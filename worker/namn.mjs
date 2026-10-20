// Omgångens namn (Kupong → Omgången och förstasidan), i samma proxy som
// matchanalysen och kommentaren (worker/index.mjs) och med samma språkmodell
// (config/llm.js). Prompten och gränserna står i config/namn.js.
//
//   POST /namn  {"id": "<omgångens id>"}
//   → 200 {ok: true, namn, syftar, model, generatedAt, cached}
//   → 4xx/5xx {ok: false, error}
//
// Proxyn tar bara emot omgångens id. Omgången läser den själv där gängets
// tips ligger (samtal:aktuellt eller samtal:<id>, worker/samtal.mjs), och
// lagen, tabelläget och modellens odds ur den publicerade sajten – så nyckeln
// kan bara användas till att döpa en omgång som gänget har skapat. Namnet
// sparas för alltid per omgång och matcher: alla ser samma namn, och den som
// kommer först får det skrivet. Ändras matcherna får omgången ett nytt namn.

import cfg from '../config/llm.js';
import nc from '../config/namn.js';
import { fingerprint, pctOdds } from './analysis.mjs';

const ROUND_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{4,10}$/;
const COMP = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two', fac: 'FA-cupen', lc: 'Ligacupen' };
const kickFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const ordinal = (n) => `${n}:${n % 10 <= 2 && n % 10 >= 1 && ![11, 12].includes(n % 100) ? 'a' : 'e'}`;

// Underlaget som modellen ser: matcherna i avsparksordning, med tabelläget
// och modellens odds där de finns.
export function roundPayload(round, { matches = [], teams = [] } = {}) {
  const byId = new Map(matches.map((m) => [String(m.id), m]));
  const table = new Map(teams.map((t) => [t.name, t]));
  const place = (name) => {
    const t = table.get(name);
    return t && t.rank ? `${ordinal(t.rank)} av ${t.of} i ${COMP[t.comp] || t.comp}` : 'okänd';
  };
  const rows = round.matcher.map((x) => {
    const m = byId.get(String(x.id));
    const p = m && m.f && Array.isArray(m.f.p) ? m.f.p : null;
    return {
      t: Date.parse(x.avspark),
      row: {
        match: m ? `${m.home} – ${m.away}` : x.match,
        ...(m && COMP[m.comp] ? { 'tävling': COMP[m.comp] } : {}),
        avspark: Number.isFinite(Date.parse(x.avspark)) ? kickFmt.format(new Date(x.avspark)) : 'okänd',
        ...(m ? { tabell: { hemma: place(m.home), borta: place(m.away) } } : {}),
        'modellens odds': p ? `1: ${pctOdds(p[0])} · X: ${pctOdds(p[1])} · 2: ${pctOdds(p[2])}` : 'okända',
      },
    };
  });
  return { matcher: rows.sort((a, b) => (a.t || 0) - (b.t || 0)).map((r) => r.row) };
}

export async function roundName(id, { env, loadRound, loadSite, complete, store = null, now = () => new Date() }) {
  id = String(id == null ? '' : id);
  if (!ROUND_ID.test(id)) return fail(400, 'Okänd omgång.');
  let round;
  try {
    round = await loadRound(id);
  } catch (err) {
    return fail(502, `Omgången gick inte att läsa (${err.message}).`);
  }
  if (!round || round.borttagen || !Array.isArray(round.matcher) || !round.matcher.length) return fail(404, 'Omgången finns inte.');

  const ids = round.matcher.map((x) => String(x.id)).sort();
  const key = `namn:${nc.promptVersion}:${id}:${(await fingerprint({ promptVersion: nc.promptVersion, ids })).slice(0, 16)}`;
  const hit = await safely(() => store && store.get(key));
  if (hit) return answer(hit, true);

  const apiKey = env[cfg.keyEnv];
  if (!apiKey) return fail(503, 'Namnen är inte påslagna (nyckel saknas).');

  // Utan sajtens underlag får modellen bara lagen och avsparkerna.
  let site = {};
  try { site = (await loadSite()) || {}; } catch { /* lagen räcker */ }
  const payload = roundPayload(round, site);
  const messages = [
    { role: 'system', content: nc.systemPrompt },
    { role: 'user', content: `Omgången (JSON):\n${JSON.stringify(payload)}` },
  ];
  let problem = null;
  for (let attempt = 1; attempt <= cfg.attempts; attempt++) {
    let r;
    try {
      r = await complete(messages, apiKey, env);
    } catch (err) {
      // Nätverk, överlast, saldo, nyckel: inget sparas – nästa besök försöker igen.
      return fail(err.status || 502, err.message);
    }
    const parts = partsOf(r.content);
    const why = parts ? problems(parts) : ['inget svar i rätt form'];
    if (!why.length) {
      // Hann någon annan före gäller dess namn, så att alla ser samma.
      const first = await safely(() => store && store.get(key));
      if (first && first.ok) return answer(first, true);
      const entry = { ok: true, namn: parts.namn, syftar: parts.syftar, model: r.model, generatedAt: now().toISOString() };
      await safely(() => store && store.put(key, entry));
      return answer(entry, false);
    }
    problem = `Namnet hade ${why.join(' och ')}.`;
    messages.push(
      { role: 'assistant', content: r.content },
      { role: 'user', content: `Namnet hade ${why.join(' och ')}. Hitta på ett nytt och följ reglerna: högst ${nc.maxWords} ord och ${nc.maxChars} tecken, inga siffror. Svara med JSON: {"namn": "<namnet>", "syftar": "<vad det anspelar på>"}` },
    );
  }
  // Ett avvisat svar sparas en timme, så att varje sidvisning inte kostar ett
  // nytt anrop. Därefter försöker nästa besök igen.
  const entry = { ok: false, error: problem };
  await safely(() => store && store.put(key, entry, 3600));
  return answer(entry, false);
}

const unquote = (s) => String(s).trim().replace(/^["'”“«»‘’]+|["'”“«»‘’.]+$/g, '').trim();

function partsOf(content) {
  try {
    const j = JSON.parse(content);
    const namn = j && typeof j.namn === 'string' ? unquote(j.namn) : '';
    const syftar = j && typeof j.syftar === 'string' ? j.syftar.trim() : '';
    return namn ? { namn, syftar: syftar || null } : null;
  } catch {
    return null;
  }
}

function problems({ namn, syftar }) {
  const why = [];
  const words = namn.split(/\s+/).filter(Boolean).length;
  if (namn.length > nc.maxChars || words > nc.maxWords) why.push(`för många ord eller tecken (${words} ord, ${namn.length} tecken)`);
  if (/\d/.test(namn)) why.push('siffror');
  if (/[!?]|\p{Extended_Pictographic}/u.test(namn)) why.push('utropstecken, frågetecken eller emojier');
  if (/kupong|omgång|tips/i.test(namn)) why.push('ett av de förbjudna orden');
  if (syftar && syftar.split(/\s+/).length > nc.maxHintWords * 1.5) why.push('en för lång förklaring');
  return why;
}

function answer(entry, cached) {
  if (!entry.ok) return { status: 422, body: { ok: false, error: entry.error, cached } };
  return { status: 200, body: { ok: true, namn: entry.namn, syftar: entry.syftar || null, model: entry.model || null, generatedAt: entry.generatedAt || null, cached } };
}

function fail(status, error) {
  return { status, body: { ok: false, error } };
}

// Lagringen får aldrig stoppa ett namn.
async function safely(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('[namn] lagringen:', err && err.message);
    return null;
  }
}
