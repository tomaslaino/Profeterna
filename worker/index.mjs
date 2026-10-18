// Proxyn för matchanalysen (fas 5) – Cloudflare Worker. Sajten är statisk och
// kan inte hålla en hemlig nyckel, så knappen Analysera anropar den här i
// stället för språkmodellen direkt. Nyckeln ligger som Worker-hemlighet
// (DEEPSEEK_API_KEY) och lämnar aldrig proxyn.
//
//   POST /analyze  {"id": "<match-id>"}
//   → 200 {ok: true, text, news, model, generatedAt, builtAt, cached}
//     news = {text, sources} – nyhetsläget med hänvisningar [1], [2] … och
//     källistan (src/news.mjs), eller null
//   → 4xx/5xx {ok: false, error}
//
// Proxyn tar bara emot ett match-id. Underlaget hämtar den själv från den
// publicerade sajten, så nyckeln kan inte användas till något annat än att
// analysera en kommande match ur sajtens eget underlag. Texten cachas på
// underlagets innehållsavtryck (KV-bindningen ANALYSER): samma underlag
// genereras aldrig två gånger, hur många som än klickar.
//
// Samma analyze() körs lokalt av server.js (POST /api/analyze), med underlaget
// från _site/ och cachen i data/cache/analysis/.
//
// Kuponghistoriken: POST /kommentar {"id": "<kupong-id>"} skriver AI:ns
// kommentar till en färdig kupong (worker/kommentar.mjs).
//
// Nyheterna (cfg.news): vid varje klick hämtas det senaste om matchen och
// lagen online (src/news.mjs – förhandsartiklar, skador, trupp, tränarläge,
// väder) och läggs i underlaget som avsnittet nyheter. Modellen skriver då
// också nyhetsläget, ett eget avsnitt med hänvisningar till artiklarna.
// Nyhetsunderlaget cachas en stund per match (config/news.js), så att flera
// klick i rad ger samma underlag och samma cachade text.

import cfg from '../config/llm.js';
import { payloadOf, fingerprint, foreignNumbers } from './analysis.mjs';
import { gatherNews, newsPayload, citeNews, withoutRefs } from '../src/news.mjs';
import { comment } from './kommentar.mjs';

const ID_RE = /^\d{1,12}$/;

export async function analyze(id, { env, loadMatch, store = null, now = () => new Date() }) {
  if (!ID_RE.test(String(id == null ? '' : id))) return fail(400, 'Okänt match-id.');
  let d;
  try {
    d = await loadMatch(String(id));
  } catch (err) {
    return fail(502, `Matchens underlag gick inte att läsa (${err.message}).`);
  }
  if (!d) return fail(404, 'Matchen finns inte.');
  const m = d.match;
  if (m.completed || m.status !== 'STATUS_SCHEDULED' || Date.parse(m.kickoff) <= now().getTime()) {
    return fail(409, 'Analys görs bara för kommande matcher.');
  }
  if (!d.prediction || d.prediction.status !== 'ok') {
    return fail(409, 'Prognosen är okänd för matchen – det finns inget att analysera.');
  }

  const payload = payloadOf(d);
  // Hämtningen kastar aldrig – det som inte gick att nå står som okänt.
  // Nyheterna (med artikeltext) sparas bara en timme i cachen.
  const newsStore = store && { get: (k) => store.get(k), put: (k, v) => store.put(k, v, 3600) };
  const news = cfg.news ? await gatherNews(m, { store: newsStore, now: now() }) : null;
  if (news) payload.nyheter = newsPayload(news);
  const newsDown = Boolean(news) && !news.sources.some((s) => s.ok && s.name !== 'Open-Meteo');
  // Avtrycket räknas utan nyheternas hämttider, så att samma artiklar ger
  // samma (cachade) text även efter att nyheterna hämtats om.
  const stable = news ? { ...payload, nyheter: { ...payload.nyheter, hämtat: undefined, 'artiklar från': undefined } } : payload;
  const key = `${cfg.promptVersion}:${id}:${await fingerprint({ promptVersion: cfg.promptVersion, model: cfg.model, news: Boolean(news), payload: stable })}`;
  const hit = await safely(() => store && store.get(key));
  if (hit) return answer(hit, d, true);

  const apiKey = env[cfg.keyEnv];
  if (!apiKey) return fail(503, 'Analysen är inte påslagen (nyckel saknas).');

  const messages = [
    { role: 'system', content: news ? cfg.systemPromptNews : cfg.systemPrompt },
    { role: 'user', content: `Underlag (JSON):\n${JSON.stringify(payload)}` },
  ];
  const usage = [];
  let problem = null;
  for (let attempt = 1; attempt <= cfg.attempts; attempt++) {
    let r;
    try {
      r = await complete(messages, apiKey, env);
    } catch (err) {
      // Nätverk, överlast, saldo, nyckel: inget cachas – nästa klick försöker igen.
      return fail(err.status || 502, err.message);
    }
    usage.push(r.usage);
    if (r.finish === 'content_filter') { problem = `${cfg.provider} avböjde att skriva texten.`; break; }
    const parts = r.finish === 'length' ? null : partsOf(r.content);
    if (!parts) { problem = `${cfg.provider} gav inget läsbart svar.`; continue; }
    const { text } = parts;
    const bad = foreignNumbers(withoutRefs(`${text}\n${parts.news || ''}`), payload);
    // Hänvisningar till artiklar som inte finns i underlaget: påståendet
    // saknar då källa, så texten skrivs om (och visas annars inte).
    const ids = new Set(news ? news.items.map((x) => x.id) : []);
    const badRefs = [...new Set(refsIn(parts.news))].filter((x) => !ids.has(x));
    const raw = rawRefsIn(text, parts.news);
    if (!bad.length && !badRefs.length && !raw.length) {
      const cited = news && parts.news ? { ...citeNews(parts.news, news), gatheredAt: news.gatheredAt } : null;
      const entry = { ok: true, text, news: cited && cited.text ? cited : null, model: r.model, generatedAt: now().toISOString(), attempts: attempt, usage };
      // Svarade ingen nyhetskälla är texten ett tillfälligt "okänt" – den
      // visas men cachas inte.
      if (!newsDown) await safely(() => store && store.put(key, entry));
      return answer(entry, d, false);
    }
    const why = [];
    if (bad.length) why.push(`tal som inte finns i underlaget (${bad.join(', ')})`);
    if (badRefs.length) why.push(`hänvisningar till artiklar som inte finns (${badRefs.join(', ')})`);
    if (raw.length) why.push(`artikel-id utanför hakparentes eller i analysen (${raw.join(', ')})`);
    problem = `Texten innehöll ${why.join(' och ')} och visas inte.`;
    const howRefs = raw.length ? ' Hänvisa till artiklarna bara i "nyheter" och bara med id i hakparentes, t.ex. "enligt Sports Mole [N3]" – aldrig N3 utan hakparentes.' : '';
    messages.push(
      { role: 'assistant', content: r.content },
      { role: 'user', content: `Texten innehöll ${why.join(' och ')}. Skriv om texten utan dem och följ reglerna.${howRefs} Svara med JSON: ${news ? '{"analys": "<text>", "nyheter": "<text>"}' : '{"analys": "<texten>"}'}` },
    );
  }
  // Ett svar som inte klarade kontrollen cachas också, så att samma underlag
  // inte kostar igen.
  const entry = { ok: false, error: problem, generatedAt: now().toISOString(), usage };
  await safely(() => store && store.put(key, entry));
  return answer(entry, d, false);
}

// Kommentaren till en färdig kupong, med samma anrop till språkmodellen.
export function couponComment(id, opts) {
  return comment(id, { complete, ...opts });
}

async function complete(messages, apiKey, env) {
  const base = String(env.LLM_BASE_URL || cfg.baseUrl).replace(/\/+$/, '');
  let res;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        thinking: { type: 'enabled' },
        reasoning_effort: cfg.reasoningEffort,
        max_tokens: cfg.maxTokens,
        response_format: { type: 'json_object' },
        stream: false,
      }),
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
  } catch (err) {
    throw problemOf(504, err && err.name === 'TimeoutError'
      ? `${cfg.provider} svarade inte inom ${Math.round(cfg.timeoutMs / 1000)} sekunder.`
      : `${cfg.provider} gick inte att nå.`);
  }
  if (!res.ok) throw problemOf(502, httpProblem(res.status));
  let j;
  try {
    j = await res.json();
  } catch {
    throw problemOf(502, `${cfg.provider} gav ett svar som inte gick att läsa.`);
  }
  const c = j.choices && j.choices[0];
  if (!c) throw problemOf(502, `${cfg.provider} gav ett tomt svar.`);
  if (c.finish_reason === 'insufficient_system_resource' || c.finish_reason === 'aborted') {
    throw problemOf(503, `${cfg.provider} är överbelastat – försök igen om en stund.`);
  }
  return { content: (c.message && c.message.content) || '', finish: c.finish_reason, model: j.model || cfg.model, usage: j.usage || null };
}

function httpProblem(status) {
  if (status === 401) return `Nyckeln godtogs inte av ${cfg.provider}.`;
  if (status === 402) return `${cfg.provider}-kontot saknar saldo.`;
  if (status === 429 || status >= 500) return `${cfg.provider} är överbelastat – försök igen om en stund.`;
  return `${cfg.provider} avvisade anropet (HTTP ${status}).`;
}

// Artikel-id:n som texten hänvisar till: [N3], [N1, N4], [N2; 5].
function refsIn(text) {
  return [...String(text || '').matchAll(/\[(N\d+(?:\s*[,;]\s*N?\d+)*)\]/g)]
    .flatMap((x) => x[1].split(/\s*[,;]\s*/).map((y) => (y.startsWith('N') ? y : `N${y}`)));
}

// Artikel-id som skulle synas rått för besökaren: i nyhetsläget ett N3 utan
// hakparentes (bara [N3] numreras om till [1], [2] …), i analysen varje N3 –
// analysen bygger inte på nyheterna och numreras aldrig om.
function rawRefsIn(text, newsText) {
  const ids = (s) => String(s || '').match(/\bN\d+\b/g) || [];
  return [...new Set([...ids(text), ...ids(withoutRefs(newsText))])];
}

// {"analys": …, "nyheter": …}. Analysen krävs; saknas nyhetsläget visas
// analysen ändå, utan nyhetsavsnitt.
function partsOf(content) {
  try {
    const j = JSON.parse(content);
    const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const text = str(j.analys);
    return text ? { text, news: str(j.nyheter) } : null;
  } catch {
    return null;
  }
}

function answer(entry, d, cached) {
  // Ett avvisat svar gäller tills underlaget ändras – ett nytt klick ger samma.
  if (!entry.ok) return { status: 422, body: { ok: false, error: entry.error, retry: false, cached } };
  // builtAt är bygget som underlaget lästes ur just nu – ett cachat svar gäller
  // varje bygge med samma underlag.
  return {
    status: 200,
    body: { ok: true, text: entry.text, news: entry.news || null, model: entry.model, generatedAt: entry.generatedAt, builtAt: d.builtAt || null, cached },
  };
}

function fail(status, error) {
  return { status, body: { ok: false, error } };
}

function problemOf(status, message) {
  return Object.assign(new Error(message), { status });
}

// Cachen får aldrig stoppa en analys.
async function safely(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('[analys] cachen:', err && err.message);
    return null;
  }
}

// ---------- Cloudflare Worker ----------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    if (!['/analyze', '/kommentar'].includes(url.pathname) || request.method !== 'POST') return json(404, { ok: false, error: 'Finns inte.' });
    let id;
    try {
      ({ id } = await request.json());
    } catch {
      return json(400, { ok: false, error: 'Ogiltig förfrågan.' });
    }
    try {
      const site = String(env.SITE || cfg.site).replace(/\/+$/, '');
      const kv = env.ANALYSER;
      if (url.pathname === '/kommentar') {
        // En kommentar sparas utan slutdatum – samma kupong kommenteras en gång.
        const store = kv ? {
          get: (k) => kv.get(k, 'json'),
          put: (k, v, ttl) => kv.put(k, JSON.stringify(v), ttl ? { expirationTtl: ttl } : {}),
        } : null;
        const r = await couponComment(id, { env, store, loadHistory: () => siteHistory(site) });
        return json(r.status, r.body);
      }
      const store = kv ? {
        get: (k) => kv.get(k, 'json'),
        put: (k, v, ttl) => kv.put(k, JSON.stringify(v), { expirationTtl: ttl || cfg.cacheDays * 86400 }),
      } : null;
      const r = await analyze(id, { env, store, loadMatch: (mid) => siteMatch(site, mid) });
      return json(r.status, r.body);
    } catch (err) {
      console.error('[analys]', err);
      return json(500, { ok: false, error: 'Internt fel i proxyn.' });
    }
  },
};

async function siteHistory(site) {
  const res = await fetch(`${site}/data/historik.json?t=${Date.now()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Underlaget från den publicerade sajten. Frågeparametern går förbi
// CDN-cachen, så att proxyn läser det senaste bygget.
async function siteMatch(site, id) {
  const res = await fetch(`${site}/data/match/${id}.json?t=${Date.now()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
