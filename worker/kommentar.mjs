// AI:ns kommentar till en färdig kupong (sidan Historik), i samma proxy som
// matchanalysen (worker/index.mjs) och med samma språkmodell (config/llm.js).
//
//   POST /kommentar  {"id": "<kupong-id>"}
//   → 200 {ok: true, text, model, generatedAt, cached}
//   → 4xx/5xx {ok: false, error}
//
// Proxyn tar bara emot ett kupong-id. Kupongen hämtar den själv ur den
// publicerade data/historik.json (src/history.js), så nyckeln kan bara
// användas till att kommentera en kupong som finns i gängets historik. En
// kupong som redan har sin kommentar inskriven i historiken får den tillbaka
// utan anrop. Annars cachas texten för alltid på kupongens innehållsavtryck –
// samma kupong kommenteras en gång, hur många som än öppnar sidan. Prompten och
// reglerna står i config/kommentar.js.

import cfg from '../config/llm.js';
import kc from '../config/kommentar.js';
import { fingerprint, foreignNumbers, pctOdds } from './analysis.mjs';

const ID_RE = /^[\w-]{1,40}$/;
const SIGNS = ['1', 'X', '2'];
const dec = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');

// Underlaget som modellen ser: det som står på kupongens kort på sidan.
export function couponPayload(c) {
  return {
    kupong: c.name || null,
    spel: c.game || 'Matchfixarnas kupong',
    datum: c.till ? `${c.date} – ${c.till}` : c.date,
    'antal rätt': `${c.ok} av ${c.n}`,
    'väntat antal rätt': dec(c.exp),
    betyg: `${c.grade} av 5 stjärnor – ${c.label}`,
    'modellens tips hade rätt': c.modelN ? `${c.modelOk} av ${c.modelN}` : 'okänt',
    matcher: c.rows.map((r) => ({
      match: r.match,
      'gängets tecken': r.sign,
      resultat: r.off ? 'struken, räknas inte' : r.score || (r.res != null ? SIGNS[r.res] : 'okänt'),
      ...(r.end ? { slutresultat: r.end } : {}),
      satt: r.hit == null ? 'räknas inte' : r.hit ? 'ja' : 'nej',
      // Odds som på sidan: chansen i hela procent, 58 blir 1,72.
      'modellens odds för gängets tecken': r.p != null ? pctOdds(r.p) : 'okänt',
      'modellens tips': r.tip != null ? SIGNS[r.tip] : 'okänt',
      ...(r.note ? { anteckning: r.note } : {}),
    })),
  };
}

export async function comment(id, { env, loadHistory, complete, store = null, now = () => new Date() }) {
  id = String(id == null ? '' : id);
  if (!ID_RE.test(id)) return fail(400, 'Okänd kupong.');
  let h;
  try {
    h = await loadHistory();
  } catch (err) {
    return fail(502, `Historiken gick inte att läsa (${err.message}).`);
  }
  const c = h && Array.isArray(h.coupons) ? h.coupons.find((x) => x.id === id) : null;
  if (!c) return fail(404, 'Kupongen finns inte i historiken.');
  if (c.ai && c.ai.text) return answer({ ok: true, text: c.ai.text, model: c.ai.model, generatedAt: c.ai.at }, true);
  if (!c.n) return fail(409, 'Kupongen har inga spelade matcher att kommentera.');

  const payload = couponPayload(c);
  const key = `kommentar:${kc.promptVersion}:${id}:${await fingerprint({ promptVersion: kc.promptVersion, model: cfg.model, payload })}`;
  const hit = await safely(() => store && store.get(key));
  if (hit) return answer(hit, true);

  const apiKey = env[cfg.keyEnv];
  if (!apiKey) return fail(503, 'Kommentaren är inte påslagen (nyckel saknas).');

  const messages = [
    { role: 'system', content: kc.systemPrompt },
    { role: 'user', content: `Kupongen (JSON):\n${JSON.stringify(payload)}` },
  ];
  let problem = null;
  for (let attempt = 1; attempt <= cfg.attempts; attempt++) {
    let r;
    try {
      r = await complete(messages, apiKey, env);
    } catch (err) {
      // Nätverk, överlast, saldo, nyckel: inget cachas – nästa besök försöker igen.
      return fail(err.status || 502, err.message);
    }
    const text = textOf(r.content);
    const why = [];
    if (!text) {
      why.push('inget svar i rätt form');
    } else {
      const bad = foreignNumbers(text, payload);
      if (bad.length) why.push(`tal som inte finns i underlaget (${bad.join(', ')})`);
      const words = text.split(/\s+/).filter(Boolean).length;
      if (words > kc.maxWords * 1.25) why.push(`för många ord (${words})`);
    }
    if (!why.length) {
      const entry = { ok: true, text, model: r.model, generatedAt: now().toISOString() };
      await safely(() => store && store.put(key, entry));
      return answer(entry, false);
    }
    problem = `Kommentaren hade ${why.join(' och ')} och visas inte.`;
    messages.push(
      { role: 'assistant', content: r.content },
      { role: 'user', content: `Texten hade ${why.join(' och ')}. Skriv om den och följ reglerna, högst ${kc.maxWords} ord. Svara med JSON: {"kommentar": "<text>"}` },
    );
  }
  // Ett avvisat svar sparas ett dygn, så att varje sidvisning inte kostar ett
  // nytt anrop. Därefter försöker nästa besök igen.
  const entry = { ok: false, error: problem };
  await safely(() => store && store.put(key, entry, 86400));
  return answer(entry, false);
}

function textOf(content) {
  try {
    const j = JSON.parse(content);
    const t = j && typeof j.kommentar === 'string' ? j.kommentar.trim().replace(/^["”“]+|["”“]+$/g, '') : '';
    return t || null;
  } catch {
    return null;
  }
}

function answer(entry, cached) {
  if (!entry.ok) return { status: 422, body: { ok: false, error: entry.error, cached } };
  return { status: 200, body: { ok: true, text: entry.text, model: entry.model || null, generatedAt: entry.generatedAt || null, cached } };
}

function fail(status, error) {
  return { status, body: { ok: false, error } };
}

// Cachen får aldrig stoppa en kommentar.
async function safely(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('[kommentar] cachen:', err && err.message);
    return null;
  }
}
