// Proxyn för matchanalysen (fas 5) – Cloudflare Worker. Sajten är statisk och
// kan inte hålla en hemlig nyckel, så knappen Analysera anropar den här i
// stället för språkmodellen direkt. Nyckeln ligger som Worker-hemlighet
// (DEEPSEEK_API_KEY) och lämnar aldrig proxyn.
//
//   POST /analyze  {"id": "<match-id>"}
//   → 200 {ok: true, text, model, generatedAt, builtAt, cached}
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

import cfg from '../config/llm.js';
import { payloadOf, fingerprint, foreignNumbers } from './analysis.mjs';

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
  const key = `${cfg.promptVersion}:${id}:${await fingerprint({ promptVersion: cfg.promptVersion, model: cfg.model, payload })}`;
  const hit = await safely(() => store && store.get(key));
  if (hit) return answer(hit, d, true);

  const apiKey = env[cfg.keyEnv];
  if (!apiKey) return fail(503, 'Analysen är inte påslagen (nyckel saknas).');

  const messages = [
    { role: 'system', content: cfg.systemPrompt },
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
    const text = r.finish === 'length' ? null : textOf(r.content);
    if (!text) { problem = `${cfg.provider} gav inget läsbart svar.`; continue; }
    const bad = foreignNumbers(text, payload);
    if (!bad.length) {
      const entry = { ok: true, text, model: r.model, generatedAt: now().toISOString(), attempts: attempt, usage };
      await safely(() => store && store.put(key, entry));
      return answer(entry, d, false);
    }
    problem = `Texten innehöll tal som inte finns i underlaget (${bad.join(', ')}) och visas inte.`;
    messages.push(
      { role: 'assistant', content: r.content },
      { role: 'user', content: `Talen ${bad.join(', ')} finns inte i underlaget. Skriv om texten utan dem och följ reglerna. Svara med JSON: {"analys": "<texten>"}` },
    );
  }
  // Ett svar som inte klarade kontrollen cachas också, så att samma underlag
  // inte kostar igen.
  const entry = { ok: false, error: problem, generatedAt: now().toISOString(), usage };
  await safely(() => store && store.put(key, entry));
  return answer(entry, d, false);
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

function textOf(content) {
  try {
    const t = JSON.parse(content).analys;
    return typeof t === 'string' && t.trim() ? t.trim() : null;
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
    body: { ok: true, text: entry.text, model: entry.model, generatedAt: entry.generatedAt, builtAt: d.builtAt || null, cached },
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
    if (url.pathname !== '/analyze' || request.method !== 'POST') return json(404, { ok: false, error: 'Finns inte.' });
    let id;
    try {
      ({ id } = await request.json());
    } catch {
      return json(400, { ok: false, error: 'Ogiltig förfrågan.' });
    }
    try {
      const site = String(env.SITE || cfg.site).replace(/\/+$/, '');
      const kv = env.ANALYSER;
      const store = kv ? {
        get: (k) => kv.get(k, 'json'),
        put: (k, v) => kv.put(k, JSON.stringify(v), { expirationTtl: cfg.cacheDays * 86400 }),
      } : null;
      const r = await analyze(id, { env, store, loadMatch: (mid) => siteMatch(site, mid) });
      return json(r.status, r.body);
    } catch (err) {
      console.error('[analys]', err);
      return json(500, { ok: false, error: 'Internt fel i proxyn.' });
    }
  },
};

// Underlaget från den publicerade sajten. Frågeparametern går förbi
// CDN-cachen, så att proxyn läser det senaste bygget.
async function siteMatch(site, id) {
  const res = await fetch(`${site}/data/match/${id}.json?t=${Date.now()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
