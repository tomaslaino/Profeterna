// Matchanalysen med research (config/research.js): Claude läser på inför
// matchen och skriver analysen, nyhetsläget, läktarsnacket och vilka tecken
// den skulle ringa in. Anropas av analyze() i worker/index.mjs när nyckeln
// ANTHROPIC_API_KEY finns och dagens analyser inte är slut.
//
// Claude får sajtens underlag för matchen och nyheterna som hämtades vid
// klicket (src/news.mjs), och söker och läser själv på nätet med Anthropics
// sök- och läsverktyg. Koden kontrollerar svaret:
//   - varje källa ska vara en adress som kom upp i sökningen, i en läst sida
//     eller bland nyheterna – annars stryks hänvisningen,
//   - varje tal i texterna ska stå i underlaget eller i det Claude läste,
//   - tecknen ska vara ett till tre av 1, X och 2.
// Klarar svaret inte talen eller tecknen får Claude skriva om en gång.
//
// Svaret sparas i samma cache som analysen, med ett slutdatum (until): en
// analys gäller cacheHours timmar för alla, ett avvisat svar failMinutes.
//
// Finns artikeln inför matchen (worker/artikel.mjs) bygger analysen på den:
// artikeln står i underlaget, dess källor och text räknas som lästa, och
// Claude söker bara efter det som hänt sedan den skrevs (rc.withArticle).
// Samtalet med Claude och kontrollerna delas med artikeln.

import Anthropic from '@anthropic-ai/sdk';
import rc from '../config/research.js';
import newsCfg from '../config/news.js';
import { foreignNumbers } from './analysis.mjs';
import { newsPayload } from '../src/news.mjs';

const tz = { timeZone: 'Europe/Stockholm' };
const nowFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
// Dygnet i svensk tid, t.ex. 2026-10-20.
const dayFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, year: 'numeric', month: '2-digit', day: '2-digit' });

// Hänvisningar i texten: [2] eller [1, 4].
const REF_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g;
const URL_RE = /https?:\/\/[^\s"'<>()\]]+/g;
const NOTES = { 1: 'spik', 2: 'halvgardera', 3: 'helgardera' };

export const researchOn = (env) => Boolean(rc.enabled && env[rc.keyEnv]);

const cacheKey = (id) => `research:${rc.promptVersion}:${id}`;
const dayKey = (now) => `research:dag:${dayFmt.format(now)}`;

// Analysen som redan finns för matchen, om den fortfarande gäller.
export async function cachedResearch(id, store, now) {
  const hit = store && await store.get(cacheKey(id));
  return hit && Date.parse(hit.until) > now.getTime() ? hit : null;
}

// Finns det analyser kvar i dag?
export async function researchLeft(store, now) {
  if (!store) return true;
  return (Number(await store.get(dayKey(now))) || 0) < rc.perDay;
}

// d: matchens underlag, payload: payloadOf(d), news: gatherNews() eller null.
// → entry som sparas och visas: {ok: true, text, news, tip, …} eller
// {ok: false, error, …}. API-fel kastas (inget sparas, nästa klick försöker
// igen).
// article: artikeln inför matchen (worker/artikel.mjs) eller null.
export async function research(d, payload, news, { env, store = null, now = () => new Date(), article = null }) {
  const t0 = now();
  const seen = new Map(); // adress (normaliserad) → {url, title, date}
  if (news) for (const it of news.items) see(seen, it.url, it.title, it.publishedAt);
  const base = news ? { ...payload, nyheter: newsForResearch(news) } : payload;
  const read = [];
  if (article) {
    base.artikel = articleForResearch(article);
    for (const s of article.sources) see(seen, s.url, s.title, s.publishedAt);
    read.push(article.title, article.lead || '', ...article.paragraphs);
  }
  // Dagens analyser räknas innan anropet, så att flera samtidiga inte slinker förbi.
  await safely(async () => store && store.put(dayKey(t0), (Number(await store.get(dayKey(t0))) || 0) + 1, 2 * 86400));

  const chat = claudeChat(env[rc.keyEnv], article ? { ...rc, ...rc.withArticle } : rc);
  let say = `Nu är det ${nowFmt.format(t0)} svensk tid.\n\nUnderlag (JSON):\n${JSON.stringify(base)}`;
  let problem = null;
  let model = rc.model;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = await chat.say(say);
    model = r.model || model;
    for (const f of r.found) see(seen, f.url, f.title, f.date);
    read.push(...r.read);
    if (r.refused) { problem = `${rc.provider} avböjde att skriva analysen.`; break; }
    const parts = partsOf(r.content);
    const why = parts ? problems(parts, [base, read.join('\n')]) : ['inget svar i rätt form'];
    if (!why.length) {
      const cited = cite(parts, seen);
      const entry = {
        ok: true,
        research: true,
        text: cited.text,
        news: { text: cited.news || null, crowd: cited.crowd || null, sources: cited.sources, gatheredAt: t0.toISOString() },
        tip: parts.tip,
        model,
        generatedAt: now().toISOString(),
        until: new Date(t0.getTime() + rc.cacheHours * 3600000).toISOString(),
        attempts: attempt,
        usage: chat.usage,
      };
      await safely(() => store && store.put(cacheKey(d.match.id), entry, rc.cacheHours * 3600));
      return entry;
    }
    problem = `Analysen hade ${why.join(' och ')} och visas inte.`;
    say = `Svaret hade ${why.join(' och ')}. Skriv om det – tal bara som de står i underlaget eller på en sida du har öppnat, och tecknen som "1", "X", "2", två av dem eller "1X2" – och svara bara med samma JSON.`;
  }
  const entry = {
    ok: false,
    research: true,
    error: problem,
    again: ` Ett nytt försök går att göra om ${rc.failMinutes} minuter.`,
    generatedAt: now().toISOString(),
    until: new Date(t0.getTime() + rc.failMinutes * 60000).toISOString(),
    usage: chat.usage,
  };
  await safely(() => store && store.put(cacheKey(d.match.id), entry, rc.failMinutes * 60));
  return entry;
}

// Artikeln som Claude skrev inför matchen, med källornas adresser.
function articleForResearch(a) {
  return {
    skriven: `${nowFmt.format(new Date(a.writtenAt))} svensk tid`,
    rubrik: a.title,
    ingress: a.lead || '',
    text: a.paragraphs.join('\n\n'),
    källor: a.sources.map((s) => ({ n: s.n, källa: s.source, rubrik: s.title, adress: s.url })),
  };
}

// Nyheterna som hämtades vid klicket, med adressen i stället för id – Claude
// hänvisar till dem som till sidorna den hittar själv.
function newsForResearch(news) {
  const out = newsPayload(news);
  out.förklaring = 'Hämtat på nätet nyss. Rapporterat i media, inte kontrollerat av Matchfixarna och inte med i prognosen. Hänvisa till en artikel med dess adress under källor.';
  if (Array.isArray(out.artiklar)) out.artiklar = out.artiklar.map(({ id, ...a }, i) => ({ ...a, adress: news.items[i].url }));
  return out;
}

// ---------- Claude ----------

// Ett samtal med Claude: say(text) → {content, model, refused, found, read}.
// found: sidorna som kom upp (adress, rubrik, datum), read: texten Claude
// läste – rubriker, öppnade sidor och citerade stycken, för sifferkontrollen.
// c: inställningarna – config/research.js eller config/artikel.js.
export function claudeChat(apiKey, c = rc) {
  // Adressen anges, så att en ANTHROPIC_BASE_URL i miljön inte styr om anropet.
  const client = new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com', timeout: c.timeoutMs, maxRetries: 1 });
  // Spelbolag och tipssajter läses inte (samma lista som nyheterna).
  const blocked = newsCfg.excludeDomains.slice(0, 64);
  const tools = [
    { type: 'web_search_20260209', name: 'web_search', max_uses: c.searches, blocked_domains: blocked },
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: c.fetches, max_content_tokens: c.fetchTokens, blocked_domains: blocked },
  ];
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
            // Ett nytt försök läser samtalet hittills ur cachen.
            cache_control: { type: 'ephemeral' },
            output_config: { effort: c.effort },
            system: c.systemPrompt,
            tools,
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

// JSON-objektet i svaret, också om det står inom ```json … ```.
function partsOf(content) {
  try {
    const s = String(content || '');
    const j = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
    const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const text = str(j.analys);
    if (!text) return null;
    const sources = Array.isArray(j['källor']) ? j['källor'].filter((x) => x && typeof x.url === 'string') : [];
    return { text, news: str(j.nyheter), crowd: str(j['läktaren']), tip: tipOf(j.tecken, j.marginal), sources };
  } catch {
    return null;
  }
}

// "1X" → {signs: [0, 1], note: 'halvgardera'}. Marginalen är Claudes egen
// rad om den är kort och utan siffror, annars tipsspråket för antalet tecken.
function tipOf(raw, note) {
  const s = String(raw || '').toUpperCase();
  if (!s.trim() || /[^1X2\s,/·–-]/.test(s)) return null;
  const signs = ['1', 'X', '2'].map((x, i) => (s.includes(x) ? i : -1)).filter((i) => i >= 0);
  if (!signs.length) return null;
  const n = typeof note === 'string' ? note.trim().replace(/[.!]+$/, '') : '';
  const own = n && n.split(/\s+/).length <= 3 && n.length <= 24 && !/\d/.test(n);
  return { signs, note: own ? n : NOTES[signs.length] };
}

function problems(parts, known) {
  const why = [];
  if (!parts.tip) why.push('inga giltiga tecken');
  const bad = unknownNumbers([parts.text, parts.news, parts.crowd], known);
  if (bad.length) why.push(`tal som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}

// Talen i texterna (utan hänvisningarna) som varken står i underlaget eller i
// det Claude läste.
export function unknownNumbers(texts, known) {
  return foreignNumbers(texts.filter(Boolean).join('\n').replace(REF_RE, ''), known);
}

function cite(parts, seen) {
  const { fix, list } = citer(parts.sources, seen);
  return { text: fix(parts.text), news: fix(parts.news), crowd: fix(parts.crowd), sources: list };
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

// Cachen får aldrig stoppa en analys.
async function safely(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('[research] cachen:', err && err.message);
    return null;
  }
}
