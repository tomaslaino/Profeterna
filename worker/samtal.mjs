// Omgångens kupong inför samtalet: någon väljer omgångens matcher, och var
// och en fyller i kupongen för sig – ett tecken eller en gardering per match.
// Den som har lämnat in ser de andras tips (de som också har lämnat in); den
// som inte har det ser inga. Då jämförs de på sidan (public/samtal.js) under
// telefonsamtalet, och gängets kupong sparas som vanligt (worker/kupong.mjs).
//
//   GET  /samtal → {ok, samtal}   samtal = omgången som den ser ut för alla, eller null
//   POST /samtal {kod, gor: "starta", matcher: [id], tid: ISO | null, ersatt: <id> | null}
//                 ny omgång; tid = när samtalet börjar (valfritt). Pågår en
//                 omgång (någon match har inte startat) krävs ersatt = dess id.
//   POST /samtal {kod, gor: "matcher", id, matcher: [id]}   ändra omgångens
//                 matcher – bara tills någon har lämnat in
//   POST /samtal {kod, gor: "tips", id, vem, tecken: {<matchid>: "1X"}, kommentarer: {<matchid>: "…"}}
//                 lämna in sina tips – ett tecken i varje match. Går inte att
//                 ändra sedan. → {ok, samtal, nyckel}: samtal med de andras
//                 inlämnade tips; nyckel = ens bevis för att få se dem igen
//   POST /samtal {kod, gor: "se", id, vem, nyckel} → {ok, samtal}   samtal med
//                 allas inlämnade tips, för den som har lämnat in
//   POST /samtal {kod, gor: "mina", id, vem} → {ok, tips}   ens egna tips, till en annan enhet
//   → 400 fel i förfrågan · 403 fel kodord · 429 för många fel kodord
//   → 409 omgången har bytts ({samtal}), man har redan lämnat in, se utan rätt
//          nyckel, tipsen visas redan för alla, eller en omgång pågår ({finns: true, samtal})
//   → 503 inte påslaget (kodordet saknas) eller matcherna kan inte läsas
//
// Tipsen är dolda: GET ger bara vem som har lämnat in. Den som lämnar in får
// en nyckel (sparad på enheten) och ser med den allas inlämnade tips – men
// kan inte längre ändra sina. När alla har lämnat in, samtalet har börjat
// eller första matchen har startat visas tipsen för alla, och sedan går
// ingenting att lämna in eller ändra. Kodordet är gemensamt och vem man är
// väljer man själv, så nyckeln – inte kodordet – är det som hindrar att
// någon tittar på de andras tips innan den själv har lämnat in.
//
// Lagringen är en nyckel per omgång och en per person (så att två som lämnar
// in samtidigt inte skriver över varandra): på Cloudflare KV-bindningen
// KUPONG, lokalt filer (server.js).
//   samtal:aktuellt                  omgången {id, skapad, tid, matcher: [{id, match, avspark}]}
//   samtal:<id>:tips:<vem>           {inne, tecken, kommentarer, nyckel}
//   samtal:<id>                      en tidigare omgång, sparad när nästa startades

import { normSign, sameSecret } from './kupong.mjs';

const MATCHES_MAX = 40;
const NOTE_MAX = 140; // samma gräns som kupongens anteckningar
const LABEL_MAX = 120;
const WRONG_MAX = 10;
const ROUND_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{4,10}$/;
const MATCH_ID = /^\d{1,12}$/;
// Matcher som inte spelas (samma som worker/kupong.mjs).
const OFF = /POSTPONED|CANCEL|ABANDON|SUSPEND/;
const CURRENT = 'samtal:aktuellt';
const tipsKey = (id, vem) => `samtal:${id}:tips:${vem}`;

const text = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
const fail = (status, error, extra = {}) => ({ status, body: { ok: false, error, ...extra } });

// Datumet för omgångens första match i svensk tid, som kupongernas id.
const swedishDate = (iso) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

// Första avsparken – senast då visas tipsen.
const firstKick = (round) => Math.min(...round.matcher.map((m) => Date.parse(m.avspark)).filter(Number.isFinite));
const lastKick = (round) => Math.max(...round.matcher.map((m) => Date.parse(m.avspark)).filter(Number.isFinite));

async function loadTips(store, round, gang) {
  const list = await Promise.all(gang.map((g) => store.get(tipsKey(round.id, g.id))));
  return Object.fromEntries(gang.map((g, i) => [g.id, list[i]]).filter(([, t]) => t && t.tecken));
}

// Visas tipsen, och varför: alla har lämnat in, samtalet har börjat eller
// första matchen har startat.
function shown(round, tips, gang, now) {
  if (gang.every((g) => tips[g.id])) return 'alla';
  if (round.tid && now >= Date.parse(round.tid)) return 'samtalet';
  if (now >= firstKick(round)) return 'avspark';
  return null;
}

// Omgången som alla får se. Tipsen bara om de visas – för alla, eller för
// den som själv har lämnat in (own) – och bara för omgångens matcher.
export function publicView(round, tips, gang, now, own = false) {
  const why = shown(round, tips, gang, now);
  const ids = new Set(round.matcher.map((m) => m.id));
  const only = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => ids.has(k)));
  return {
    id: round.id,
    skapad: round.skapad,
    ...(round['ändrad'] ? { 'ändrad': round['ändrad'] } : {}),
    tid: round.tid || null,
    matcher: round.matcher,
    visas: Boolean(why),
    orsak: why,
    gang: gang.map((g) => ({ id: g.id, namn: g.namn, inne: tips[g.id] ? tips[g.id].inne : null })),
    tips: why || own ? Object.fromEntries(Object.entries(tips).map(([k, t]) => [k, { inne: t.inne, tecken: only(t.tecken), kommentarer: only(t.kommentarer) }])) : null,
  };
}

// Matcherna från sidan → omgångens matcher, med lag och avspark ur sajtens
// matcher. Bara matcher som inte har startat.
function roundMatches(list, matches, now) {
  if (!Array.isArray(list) || !list.length) return { errors: ['inga matcher'] };
  if (list.length > MATCHES_MAX) return { errors: [`högst ${MATCHES_MAX} matcher`] };
  const byId = new Map(matches.map((m) => [String(m.id), m]));
  const errors = [];
  const out = [];
  for (const raw of list) {
    const id = String(raw == null ? '' : raw).trim();
    if (!MATCH_ID.test(id)) { errors.push('ogiltigt match-id'); continue; }
    if (out.some((m) => m.id === id)) continue;
    const m = byId.get(id);
    if (!m) { errors.push(`match ${id} finns inte bland matcherna`); continue; }
    const label = text(`${m.home} – ${m.away}`, LABEL_MAX);
    if (m.completed || OFF.test(m.status || '') || !(Date.parse(m.kickoff) > now)) { errors.push(`${label} har redan startat`); continue; }
    out.push({ id, match: label, avspark: new Date(m.kickoff).toISOString() });
  }
  out.sort((a, b) => a.avspark.localeCompare(b.avspark));
  return { rows: out, errors };
}

// store: {get(key) → objekt | null, put(key, objekt)}
// loadMatches() → sajtens matcher [{id, home, away, kickoff, completed, status}].
// gang: [{id: "DL", namn: "Daniel Laino"}, …] (config/kupong.js).
// limiter: {count(), bump()} – valfri, samma spärr som kupongen.
export async function getRound({ store, gang, now = () => new Date() }) {
  if (!store) return fail(503, 'Samtalet är inte påslaget.');
  const round = await store.get(CURRENT);
  if (!round) return { status: 200, body: { ok: true, samtal: null } };
  const tips = await loadTips(store, round, gang);
  return { status: 200, body: { ok: true, samtal: publicView(round, tips, gang, now().getTime()) } };
}

export async function postRound(body, { env, store, gang, loadMatches, limiter = null, now = () => new Date(), newId = randomId }) {
  if (!env.KUPONG_KOD || !store) return fail(503, 'Samtalet är inte påslaget.');
  const b = body && typeof body === 'object' ? body : {};
  if (limiter && (await limiter.count()) >= WRONG_MAX) return fail(429, 'För många fel kodord. Vänta en timme.');
  if (!b.kod || !(await sameSecret(b.kod, env.KUPONG_KOD))) {
    if (limiter) await limiter.bump();
    return fail(403, 'Fel kodord.');
  }
  const t = now();
  const ms = t.getTime();
  const round = await store.get(CURRENT);
  const tips = round ? await loadTips(store, round, gang) : {};
  const view = () => publicView(round, tips, gang, ms);
  const ok = (extra = {}) => ({ status: 200, body: { ok: true, ...extra } });

  if (b.gor === 'starta') {
    // En omgång där någon match inte har startat ersätts bara medvetet.
    if (round && ms < lastKick(round) && b.ersatt !== round.id) {
      return fail(409, 'Det finns redan en omgång som pågår.', { finns: true, samtal: view() });
    }
    const tid = b.tid ? Date.parse(b.tid) : null;
    if (b.tid && !Number.isFinite(tid)) return fail(400, 'Ogiltig tid för samtalet.');
    if (tid && tid < ms) return fail(400, 'Samtalet måste ligga framåt i tiden.');
    let matches;
    try { matches = await loadMatches(); } catch { return fail(503, 'Kan inte läsa matcherna från sajten just nu.'); }
    const v = roundMatches(b.matcher, matches, ms);
    if (v.errors.length) return fail(400, `Omgången har fel: ${v.errors.join(', ')}.`);
    const next = {
      id: `${swedishDate(v.rows[0].avspark)}-${newId()}`,
      skapad: t.toISOString(),
      tid: tid ? new Date(tid).toISOString() : null,
      matcher: v.rows,
    };
    // Den gamla omgången sparas under sitt id, så att tipsen går att para
    // ihop med matcherna efteråt.
    if (round) await store.put(`samtal:${round.id}`, round);
    await store.put(CURRENT, next);
    return ok({ samtal: publicView(next, {}, gang, ms) });
  }

  // Resten gäller omgången som pågår – och bara den som sidan visade.
  if (!round) return fail(409, 'Det finns ingen kupong för omgången. Skapa den först.', { samtal: null });
  if (String(b.id || '') !== round.id || !ROUND_ID.test(round.id)) {
    return fail(409, 'Omgången har bytts sedan du öppnade sidan.', { samtal: view() });
  }
  const vem = gang.find((g) => g.id === b.vem);

  if (b.gor === 'mina') {
    if (!vem) return fail(400, 'Okänd person.');
    const own = tips[vem.id];
    return ok({ tips: own ? { inne: own.inne, tecken: own.tecken, kommentarer: own.kommentarer || {} } : null });
  }

  // Allas inlämnade tips, för den som själv har lämnat in (med nyckeln från
  // inlämningen).
  if (b.gor === 'se') {
    const own = vem && tips[vem.id];
    if (!own || !own.nyckel || !b.nyckel || !(await sameSecret(b.nyckel, own.nyckel))) {
      return fail(409, 'Du ser de andras tips när du själv har lämnat in.', { samtal: view() });
    }
    return ok({ samtal: publicView(round, tips, gang, ms, true) });
  }

  // Tipsen visas redan för alla: inget går att lämna in eller ändra.
  if (shown(round, tips, gang, ms)) return fail(409, 'Tipsen visas redan och kan inte ändras.', { samtal: view() });

  if (b.gor === 'matcher') {
    // Den som har lämnat in har sett de andras tips – matcherna står fast.
    if (Object.keys(tips).length) return fail(409, 'Någon har redan lämnat in, så matcherna går inte att ändra.', { samtal: view() });
    let matches;
    try { matches = await loadMatches(); } catch { return fail(503, 'Kan inte läsa matcherna från sajten just nu.'); }
    const v = roundMatches(b.matcher, matches, ms);
    if (v.errors.length) return fail(400, `Omgången har fel: ${v.errors.join(', ')}.`);
    const next = { ...round, 'ändrad': t.toISOString(), matcher: v.rows };
    await store.put(CURRENT, next);
    return ok({ samtal: publicView(next, tips, gang, ms) });
  }

  if (b.gor === 'tips') {
    if (!vem) return fail(400, 'Okänd person.');
    if (tips[vem.id]) return fail(409, 'Du har redan lämnat in, och tipsen går inte att ändra.', { samtal: view() });
    const raw = b.tecken && typeof b.tecken === 'object' ? b.tecken : {};
    const notes = b.kommentarer && typeof b.kommentarer === 'object' ? b.kommentarer : {};
    const tecken = {};
    const kommentarer = {};
    const missing = [];
    for (const m of round.matcher) {
      const s = normSign(raw[m.id]);
      if (!s) { missing.push(m.match); continue; }
      tecken[m.id] = s;
      const n = text(notes[m.id], NOTE_MAX);
      if (n) kommentarer[m.id] = n;
    }
    if (missing.length) return fail(400, `Tippa alla matcher – det saknas tecken i ${missing.join(', ')}.`);
    const mine = { inne: t.toISOString(), tecken, kommentarer, nyckel: newId(24) };
    await store.put(tipsKey(round.id, vem.id), mine);
    return ok({ samtal: publicView(round, { ...tips, [vem.id]: mine }, gang, ms, true), nyckel: mine.nyckel });
  }

  return fail(400, 'Okänd åtgärd.');
}

function randomId(n = 6) {
  return Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join('');
}

// Cloudflare KV som lagring (JSON).
export function kvStore(kv) {
  return {
    get: (key) => kv.get(key, 'json'),
    put: (key, value) => kv.put(key, JSON.stringify(value)),
  };
}
