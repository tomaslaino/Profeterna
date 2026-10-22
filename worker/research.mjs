// Claude läser på åt Analysera (worker/artikel.mjs): samtalet med Anthropics
// sök- och läsverktyg, och kontrollerna som artikeln och tipset delar:
//   - varje källa ska vara en adress som kom upp i sökningen, i en läst sida
//     eller bland nyheterna – annars stryks hänvisningen (citer),
//   - varje tal i texterna ska stå i underlaget eller i det Claude läste
//     (unknownNumbers).
//
// 2026-10-20–22 skrev Claude här också en egen analys med ett eget sökpass
// när någon tryckte på Analysera under artikeln. Sedan 2026-10-22 skrivs
// tipset i artikelns samtal, utan att söka igen (config/artikel.js).

import Anthropic from '@anthropic-ai/sdk';
import newsCfg from '../config/news.js';
import { foreignNumbers } from './analysis.mjs';

// Hänvisningar i texten: [2] eller [1, 4].
const REF_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g;
const URL_RE = /https?:\/\/[^\s"'<>()\]]+/g;

// ---------- Claude ----------

// Ett samtal med Claude: say(text) → {content, model, refused, found, read}.
// found: sidorna som kom upp (adress, rubrik, datum), read: texten Claude
// läste – rubriker, öppnade sidor och citerade stycken, för sifferkontrollen.
// c: inställningarna i config/artikel.js; med searches: 0 får Claude inga
// verktyg och kan inte söka.
export function claudeChat(apiKey, c) {
  // Adressen anges, så att en ANTHROPIC_BASE_URL i miljön inte styr om anropet.
  const client = new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com', timeout: c.timeoutMs, maxRetries: 1 });
  // Spelbolag och tipssajter läses inte (samma lista som nyheterna).
  const blocked = newsCfg.excludeDomains.slice(0, 64);
  const tools = c.searches ? [
    { type: 'web_search_20260209', name: 'web_search', max_uses: c.searches, blocked_domains: blocked },
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: c.fetches, max_content_tokens: c.fetchTokens, blocked_domains: blocked },
  ] : null;
  const turns = [];
  const usage = [];
  return {
    usage,
    async say(text) {
      turns.push({ role: 'user', content: text });
      const found = [];
      const read = [];
      let r;
      // Ett långt sökande kan pausas (pause_turn): då skickas svaret hittills
      // tillbaka och Claude fortsätter där den var.
      for (let round = 0; round < 5; round++) {
        try {
          r = await client.beta.messages.create({
            model: c.model,
            max_tokens: c.maxTokens,
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            // Nästa meddelande – tipset, ett nytt försök – läser samtalet
            // hittills ur cachen.
            cache_control: { type: 'ephemeral' },
            output_config: { effort: c.effort },
            system: c.systemPrompt,
            ...(tools ? { tools } : {}),
            messages: turns,
          });
        } catch (err) {
          throw claudeProblem(err, c);
        }
        usage.push(r.usage);
        collect(r.content, found, read);
        turns.push({ role: 'assistant', content: r.content });
        if (r.stop_reason !== 'pause_turn') break;
      }
      // Nekade också reservmodellen finns ingen text att läsa.
      if (r.stop_reason === 'refusal') return { content: '', model: r.model, refused: true, found, read };
      const content = r.stop_reason === 'max_tokens' ? '' : r.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      return { content, model: r.model, refused: false, found, read };
    },
  };
}

// Sidorna och texten i svarets block: sökträffar, lästa sidor, citat och det
// som sökningens filtrering skrev ut. Krypterat innehåll går inte att läsa
// och hoppas över.
function collect(blocks, found, read) {
  for (const b of blocks) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
      for (const x of b.content) found.push({ url: x.url, title: x.title, date: x.page_age });
    }
    if (b.type === 'web_fetch_tool_result' && b.content && b.content.url) {
      const doc = b.content.content || {};
      found.push({ url: b.content.url, title: doc.title, date: null });
    }
    if (b.type === 'text' && Array.isArray(b.citations)) {
      for (const c of b.citations) {
        if (c.url) found.push({ url: c.url, title: c.title, date: null });
        if (c.cited_text) read.push(c.cited_text);
      }
    }
    if (/_tool_result$/.test(b.type)) {
      const texts = [];
      strings(b.content, texts);
      for (const s of texts) {
        read.push(s);
        for (const u of s.match(URL_RE) || []) found.push({ url: u, title: null, date: null });
      }
    }
  }
}

function strings(v, out) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (!/^encrypted|^(type|id|tool_use_id|media_type)$/.test(k)) strings(x, out);
  }
}

function claudeProblem(err, c) {
  const p = c.provider;
  const problem = (status, message) => Object.assign(new Error(message), { status });
  if (err instanceof Anthropic.AuthenticationError) return problem(502, `Nyckeln godtogs inte av ${p}.`);
  if (err instanceof Anthropic.RateLimitError) return problem(503, `${p} är överbelastat – försök igen om en stund.`);
  if (err instanceof Anthropic.APIConnectionTimeoutError) return problem(504, `${p} svarade inte inom ${Math.round(c.timeoutMs / 60000)} minuter.`);
  if (err instanceof Anthropic.APIConnectionError) return problem(504, `${p} gick inte att nå.`);
  if (err instanceof Anthropic.APIError) return problem(502, err.status >= 500 ? `${p} är överbelastat – försök igen om en stund.` : `${p} avvisade anropet (HTTP ${err.status}).`);
  return problem(502, `${p} gav ett fel (${err && err.message}).`);
}

// ---------- svaret ----------

// Talen i texterna (utan hänvisningarna) som varken står i underlaget eller i
// det Claude läste.
export function unknownNumbers(texts, known) {
  return foreignNumbers(texts.filter(Boolean).join('\n').replace(REF_RE, ''), known);
}

// Hänvisningarna numreras om 1, 2, 3 … i den ordning de först citeras, och
// bara källor med en adress som verkligen kom upp följer med. En hänvisning
// till något annat stryks. → {fix(text), list}: fix numrerar om en text,
// list är källistan för texterna som gått genom fix, i den ordningen.
export function citer(sources, seen) {
  const given = new Map(sources.map((s) => [String(s.n), s]));
  const byUrl = new Map(); // normaliserad adress → nytt nummer
  const list = [];
  const numberOf = (k) => {
    const s = given.get(k);
    const key = s && normUrl(s.url);
    const hit = key && seen.get(key);
    if (!hit || blockedUrl(hit.url)) return null;
    if (!byUrl.has(key)) {
      const host = new URL(hit.url).hostname.replace(/^www\./, '');
      const name = typeof s['källa'] === 'string' && s['källa'].trim().length <= 40 ? s['källa'].trim() : host;
      // Utan sajtens namn på slutet ("… - Yahoo Sports"); det står efter rubriken.
      const title = (hit.title || (typeof s.rubrik === 'string' && s.rubrik.trim()) || host).replace(/^(.{20,}?)\s+[|–-]\s+[^|–-]{2,30}$/, '$1');
      list.push({ n: list.length + 1, source: name, title, url: hit.url, publishedAt: hit.date });
      byUrl.set(key, list.length);
    }
    return byUrl.get(key);
  };
  const fix = (text) => (text ? text.replace(REF_RE, (m, ks) => {
    const ns = [...new Set(ks.split(/\s*[,;]\s*/).map(numberOf).filter(Boolean))].sort((a, b) => a - b);
    return ns.length ? `[${ns.join(', ')}]` : '';
  })
    // [2][3] → [2, 3]
    .replace(/\[(\d+(?:, \d+)*)\](?:\s*\[(\d+(?:, \d+)*)\])+/g, (m) => `[${[...new Set(m.match(/\d+/g).map(Number))].sort((a, b) => a - b).join(', ')}]`)
    .replace(/ {2,}/g, ' ')
    .replace(/ +([.,;:])/g, '$1')
    .trim() : null);
  return { fix, list };
}

export function see(seen, url, title, date) {
  const key = normUrl(url);
  if (!key) return;
  const old = seen.get(key);
  const iso = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null;
  seen.set(key, { url: old ? old.url : String(url).trim(), title: (old && old.title) || (title ? String(title).trim() : null), date: (old && old.date) || iso });
}

// Adressen utan https, www, ankare, spårningsparametrar och snedstreck på slutet.
function normUrl(u) {
  try {
    const x = new URL(String(u || '').trim().replace(/[.,;:]+$/, ''));
    if (!/^https?:$/.test(x.protocol)) return null;
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|ref$)/i.test(k)) x.searchParams.delete(k);
    return `${x.hostname.replace(/^www\./, '').toLowerCase()}${x.pathname.replace(/\/+$/, '')}${x.search}`;
  } catch {
    return null;
  }
}

function blockedUrl(u) {
  const host = new URL(u).hostname.replace(/^www\./, '');
  return newsCfg.excludeDomains.some((d) => host === d || host.endsWith(`.${d}`));
}
