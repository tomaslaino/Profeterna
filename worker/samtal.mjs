// Omgångens kupong inför uppgörelsen: någon väljer omgångens matcher, och var
// och en fyller i kupongen för sig – ett tecken eller en gardering per match.
// Den som har lämnat in ser de andras tips (de som också har lämnat in); den
// som inte har det ser inga. Då jämförs de på sidan (public/samtal.js) under
// telefonsamtalet, och gängets kupong sparas som vanligt (worker/kupong.mjs).
//
//   GET  /samtal → {ok, samtal, forra}   samtal = omgången som den ser ut för alla,
//                 eller null; forra = omgången före den, om dess tips visades
//                 när den ersattes (så att bygget hinner spara den i
//                 tipparhistoriken, src/tippare.js)
//   POST /samtal {gor: "starta", matcher: [id], ersatt: <id> | null, spel}
//                 ny omgång. Pågår en omgång (någon match har inte startat)
//                 krävs ersatt = dess id. Matcherna står i den ordning de
//                 valdes – numren på kupongen, som på Stryktipset. spel =
//                 {namn: "Stryktipset", nr} när matcherna hämtades från
//                 Svenska Spel (worker/stryktipset.mjs), så att sidan visar
//                 Svenska folket för just den omgången (valfritt)
//   POST /samtal {gor: "matcher", id, matcher: [id], spel}   ändra omgångens
//                 matcher – bara tills någon har lämnat in. Utan spel står
//                 omgångens kvar; spel: null tar bort det
//   POST /samtal {gor: "tips", id, vem, matcher: [id], tecken: {<matchid>: "1X"}, kommentarer: {<matchid>: "…"}, nyckel}
//                 lämna in sina tips – ett tecken i varje match. matcher =
//                 omgångens matcher som sidan visade dem. → {ok, samtal,
//                 nyckel}: samtal med de andras inlämnade tips; nyckel = ens
//                 bevis för att få se dem igen. Med nyckeln går tipsen att
//                 ändra tills matcherna startar – i en match som har startat
//                 står de kvar som de var. En ändring får lämna matcher tomma.
//   POST /samtal {gor: "spara", id, vem, matcher: [id], tippat}   spara en
//                 kupong som inte är färdig, utan att lämna in: tjänsten får
//                 bara veta hur många matcher som är tippade (tipsen stannar
//                 på enheten tills de lämnas in), så att de andra ser hur
//                 långt man har kommit. → {ok, samtal}
//   POST /samtal {gor: "se", id, vem, nyckel} → {ok, samtal}   samtal med
//                 allas inlämnade tips, för den som har lämnat in
//   POST /samtal {gor: "bort", id} → {ok, samtal: null}   ta bort omgången
//                 för alla, med de inlämnade tipsen – tills allas tips visas
//                 (då hör den till tipparhistoriken)
//   → 400 fel i förfrågan
//   → 409 omgången har bytts ({samtal}), matcherna har ändrats sedan sidan
//          visade dem ({samtal, andrade: true}), man har redan lämnat in och
//          saknar nyckeln, se utan rätt nyckel, tipsen visas redan för alla
//          (för den som inte har lämnat in), alla matcher har startat, eller
//          en omgång pågår ({finns: true, samtal})
//   → 503 inte påslaget (lagringen saknas) eller matcherna kan inte läsas
//
// Tipsen är dolda: GET ger bara vem som har lämnat in och hur många matcher
// var och en har tippat (gang[].tippat). Den som lämnar in får
// en nyckel (sparad på enheten) och ser med den allas inlämnade tips. När
// alla har lämnat in eller första matchen har startat visas tipsen för alla,
// och sedan kan den som inte har lämnat in inte göra det. Den som har lämnat
// in kan ändra sina tips tills matcherna startar. Vem man är väljer man
// själv, så nyckeln är det som hindrar att någon tittar på de andras tips
// innan den själv har lämnat in, eller ändrar någon annans. Därför lämnar
// tjänsten aldrig ut en persons tips med bara namnet.
//
// Lagringen är en nyckel per omgång och en per person (så att två som lämnar
// in samtidigt inte skriver över varandra): på Cloudflare KV-bindningen
// KUPONG, lokalt filer (server.js).
//   samtal:aktuellt                  omgången {id, skapad, matcher: [{id, match, avspark}], spel}
//   samtal:<id>:tips:<vem>           {inne, ändrad, tecken, kommentarer, nyckel}
//   samtal:<id>:utkast:<vem>         {sparad, tippat, matcher} – en sparad kupong som
//                                    inte är inlämnad: bara antalet tippade
//   samtal:<id>                      en tidigare omgång, sparad när nästa startades
//                                    eller när den togs bort (borttagen)
//   samtal:forra                     omgången före den aktuella, om dess tips
//                                    visades när den ersattes (annars null)

import { normSign, sameSecret } from './kupong.mjs';

const MATCHES_MAX = 40;
const NOTE_MAX = 140; // samma gräns som kupongens anteckningar
const LABEL_MAX = 120;
const ROUND_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{4,10}$/;
const MATCH_ID = /^\d{1,12}$/;
// Matcher som inte spelas (samma som worker/kupong.mjs).
const OFF = /POSTPONED|CANCEL|ABANDON|SUSPEND/;
const CURRENT = 'samtal:aktuellt';
const PREVIOUS = 'samtal:forra';
const tipsKey = (id, vem) => `samtal:${id}:tips:${vem}`;
const draftKey = (id, vem) => `samtal:${id}:utkast:${vem}`;

const text = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
const fail = (status, error, extra = {}) => ({ status, body: { ok: false, error, ...extra } });

// Datumet för omgångens första match i svensk tid, som kupongernas id.
const swedishDate = (iso) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

// Stryktipsomgången som matcherna hämtades från, eller null.
function gameOf(x) {
  if (!x || typeof x !== 'object') return null;
  const nr = Number(x.nr);
  return x.namn === 'Stryktipset' && Number.isInteger(nr) && nr > 0 && nr < 1e6 ? { namn: 'Stryktipset', nr } : null;
}

// Första avsparken – senast då visas tipsen.
const firstKick = (round) => Math.min(...round.matcher.map((m) => Date.parse(m.avspark)).filter(Number.isFinite));
const lastKick = (round) => Math.max(...round.matcher.map((m) => Date.parse(m.avspark)).filter(Number.isFinite));

async function loadTips(store, round, gang) {
  const list = await Promise.all(gang.map((g) => store.get(tipsKey(round.id, g.id))));
  return Object.fromEntries(gang.map((g, i) => [g.id, list[i]]).filter(([, t]) => t && t.tecken));
}

// Sparade kuponger som inte är inlämnade. Bara de som sparades för
// omgångens matcher som de är nu – ändras matcherna gäller de inte längre.
const matchKey = (round) => round.matcher.map((m) => m.id).sort().join(',');
async function loadDrafts(store, round, gang) {
  const list = await Promise.all(gang.map((g) => store.get(draftKey(round.id, g.id))));
  const key = matchKey(round);
  return Object.fromEntries(gang.map((g, i) => [g.id, list[i]]).filter(([, d]) => d && d.matcher === key));
}

// Visas tipsen, och varför: alla har lämnat in eller första matchen har
// startat.
function shown(round, tips, gang, now) {
  if (gang.every((g) => tips[g.id])) return 'alla';
  if (now >= firstKick(round)) return 'avspark';
  return null;
}

// Omgången som alla får se. Tipsen bara om de visas – för alla, eller för
// den som själv har lämnat in (own) – och bara för omgångens matcher. Hur
// många matcher var och en har tippat syns alltid: ur de inlämnade tipsen,
// annars ur en sparad kupong (drafts), annars null.
export function publicView(round, tips, gang, now, own = false, drafts = {}) {
  const why = shown(round, tips, gang, now);
  const ids = new Set(round.matcher.map((m) => m.id));
  const only = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => ids.has(k)));
  const tippat = (id) => (tips[id] ? Object.keys(only(tips[id].tecken)).length : drafts[id] ? drafts[id].tippat : null);
  return {
    id: round.id,
    skapad: round.skapad,
    ...(round['ändrad'] ? { 'ändrad': round['ändrad'] } : {}),
    matcher: round.matcher,
    ...(round.spel ? { spel: round.spel } : {}),
    visas: Boolean(why),
    orsak: why,
    gang: gang.map((g) => ({ id: g.id, namn: g.namn, inne: tips[g.id] ? tips[g.id].inne : null, tippat: tippat(g.id) })),
    tips: why || own ? Object.fromEntries(Object.entries(tips).map(([k, t]) => [k, { inne: t.inne, tecken: only(t.tecken), kommentarer: only(t.kommentarer) }])) : null,
  };
}

// Matcherna från sidan → omgångens matcher, med lag och avspark ur sajtens
// matcher, i den ordning de valdes. Bara matcher som inte har startat.
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
  return { rows: out, errors };
}

// store: {get(key) → objekt | null, put(key, objekt)}
// loadMatches() → sajtens matcher [{id, home, away, kickoff, completed, status}].
// gang: [{id: "DL", namn: "Daniel Laino"}, …] (config/kupong.js).
export async function getRound({ store, gang, now = () => new Date() }) {
  if (!store) return fail(503, 'Att tippa var för sig är inte påslaget.');
  const ms = now().getTime();
  const [round, prev] = await Promise.all([store.get(CURRENT), store.get(PREVIOUS)]);
  const view = async (r, sparade = false) => (r ? publicView(r, await loadTips(store, r, gang), gang, ms, false,
    sparade ? await loadDrafts(store, r, gang) : {}) : null);
  const [samtal, forra] = await Promise.all([view(round, true), view(prev)]);
  // Den förra omgången bara om dess tips visas (de visades redan när den
  // ersattes, så det gör de fortfarande).
  return { status: 200, body: { ok: true, samtal, forra: forra && forra.visas ? forra : null } };
}

export async function postRound(body, { store, gang, loadMatches, now = () => new Date(), newId = randomId }) {
  if (!store) return fail(503, 'Att tippa var för sig är inte påslaget.');
  const b = body && typeof body === 'object' ? body : {};
  const t = now();
  const ms = t.getTime();
  const round = await store.get(CURRENT);
  const [tips, drafts] = round ? await Promise.all([loadTips(store, round, gang), loadDrafts(store, round, gang)]) : [{}, {}];
  const view = () => publicView(round, tips, gang, ms, false, drafts);
  const ok = (extra = {}) => ({ status: 200, body: { ok: true, ...extra } });

  if (b.gor === 'starta') {
    // En omgång där någon match inte har startat ersätts bara medvetet.
    if (round && ms < lastKick(round) && b.ersatt !== round.id) {
      return fail(409, 'Det finns redan en omgång som pågår.', { finns: true, samtal: view() });
    }
    let matches;
    try { matches = await loadMatches(); } catch { return fail(503, 'Kan inte läsa matcherna från sajten just nu.'); }
    const v = roundMatches(b.matcher, matches, ms);
    if (v.errors.length) return fail(400, `Omgången har fel: ${v.errors.join(', ')}.`);
    const spel = gameOf(b.spel);
    const next = {
      id: `${swedishDate(v.rows.map((m) => m.avspark).sort()[0])}-${newId()}`,
      skapad: t.toISOString(),
      matcher: v.rows,
      ...(spel ? { spel } : {}),
    };
    // Den gamla omgången sparas under sitt id, så att tipsen går att para
    // ihop med matcherna efteråt. Visades dess tips står den också kvar i
    // GET som den förra omgången tills nästa startas, så att bygget hinner
    // spara den i tipparhistoriken. En omgång som ersattes innan tipsen
    // visades räknas inte.
    if (round) {
      await store.put(`samtal:${round.id}`, round);
      await store.put(PREVIOUS, shown(round, tips, gang, ms) ? round : null);
    }
    await store.put(CURRENT, next);
    return ok({ samtal: publicView(next, {}, gang, ms) });
  }

  // Resten gäller omgången som pågår – och bara den som sidan visade.
  if (!round) return fail(409, 'Det finns ingen kupong för omgången. Skapa den först.', { samtal: null });
  if (String(b.id || '') !== round.id || !ROUND_ID.test(round.id)) {
    return fail(409, 'Omgången har bytts sedan du öppnade sidan.', { samtal: view() });
  }
  // Som när omgången ersätts innan tipsen visats: den sparas under sitt id
  // men räknas inte, och den förra omgången står kvar.
  if (b.gor === 'bort') {
    if (shown(round, tips, gang, ms)) return fail(409, 'Allas tips visas redan, så kupongen går inte att ta bort.', { samtal: view() });
    await store.put(`samtal:${round.id}`, { ...round, borttagen: t.toISOString() });
    await store.put(CURRENT, null);
    return ok({ samtal: null });
  }

  const vem = gang.find((g) => g.id === b.vem);

  // Allas inlämnade tips, för den som själv har lämnat in (med nyckeln från
  // inlämningen).
  if (b.gor === 'se') {
    const own = vem && tips[vem.id];
    if (!own || !own.nyckel || !b.nyckel || !(await sameSecret(b.nyckel, own.nyckel))) {
      return fail(409, 'Du ser de andras tips när du själv har lämnat in.', { samtal: view() });
    }
    return ok({ samtal: publicView(round, tips, gang, ms, true, drafts) });
  }

  if (b.gor === 'matcher') {
    // Den som har lämnat in har sett de andras tips – matcherna står fast.
    if (Object.keys(tips).length) return fail(409, 'Någon har redan lämnat in, så matcherna går inte att ändra.', { samtal: view() });
    if (shown(round, tips, gang, ms)) return fail(409, 'Första matchen har startat, så matcherna går inte att ändra.', { samtal: view() });
    let matches;
    try { matches = await loadMatches(); } catch { return fail(503, 'Kan inte läsa matcherna från sajten just nu.'); }
    const v = roundMatches(b.matcher, matches, ms);
    if (v.errors.length) return fail(400, `Omgången har fel: ${v.errors.join(', ')}.`);
    const { spel: was, ...rest } = round;
    const spel = b.spel === undefined ? gameOf(was) : gameOf(b.spel);
    const next = { ...rest, 'ändrad': t.toISOString(), matcher: v.rows, ...(spel ? { spel } : {}) };
    await store.put(CURRENT, next);
    return ok({ samtal: publicView(next, tips, gang, ms, false, drafts) });
  }

  // Matcherna har ändrats sedan sidan visade dem: sidan visar de nya.
  const changed = () => {
    if (!Array.isArray(b.matcher)) return false;
    const seen = new Set(b.matcher.map(String));
    return seen.size !== round.matcher.length || round.matcher.some((m) => !seen.has(m.id));
  };

  // En kupong som inte är färdig sparas utan att lämnas in. Tjänsten får
  // bara antalet tippade matcher – tipsen stannar på enheten – så det
  // behövs ingen nyckel: ingen kan se något mer än hur långt man har kommit.
  if (b.gor === 'spara') {
    if (!vem) return fail(400, 'Okänd person.');
    if (tips[vem.id]) return fail(409, 'Du har redan lämnat in – ändra kupongen där du lämnade in den.', { samtal: view() });
    if (shown(round, tips, gang, ms)) return fail(409, 'Allas tips visas redan, så det går inte att spara nu.', { samtal: view() });
    if (changed()) return fail(409, 'Matcherna har ändrats sedan du öppnade kupongen – tippa de nya och spara igen.', { samtal: view(), andrade: true });
    const n = Math.floor(Number(b.tippat));
    const mine = { sparad: t.toISOString(), tippat: Number.isFinite(n) ? Math.max(0, Math.min(round.matcher.length, n)) : 0, matcher: matchKey(round) };
    await store.put(draftKey(round.id, vem.id), mine);
    return ok({ samtal: publicView(round, tips, gang, ms, false, { ...drafts, [vem.id]: mine }) });
  }

  if (b.gor === 'tips') {
    if (!vem) return fail(400, 'Okänd person.');
    // Den som har lämnat in ändrar med nyckeln från inlämningen. Den som inte
    // har det kan inte lämna in när allas tips redan visas.
    const old = tips[vem.id];
    if (old && (!old.nyckel || !b.nyckel || !(await sameSecret(b.nyckel, old.nyckel)))) {
      return fail(409, 'Du har redan lämnat in – ändra kupongen där du lämnade in den.', { samtal: view() });
    }
    if (!old && shown(round, tips, gang, ms)) return fail(409, 'Allas tips visas redan, så det går inte att lämna in nu.', { samtal: view() });
    if (old && ms >= lastKick(round)) return fail(409, 'Alla matcher har startat, så tipsen går inte att ändra.', { samtal: view() });
    if (changed()) return fail(409, 'Matcherna har ändrats sedan du öppnade kupongen – tippa de nya och lämna in igen.', { samtal: view(), andrade: true });
    const raw = b.tecken && typeof b.tecken === 'object' ? b.tecken : {};
    const notes = b.kommentarer && typeof b.kommentarer === 'object' ? b.kommentarer : {};
    const tecken = {};
    const kommentarer = {};
    const missing = [];
    for (const m of round.matcher) {
      // En match som har startat står kvar som den var.
      if (old && !(Date.parse(m.avspark) > ms)) {
        if (old.tecken[m.id]) tecken[m.id] = old.tecken[m.id];
        if (old.kommentarer && old.kommentarer[m.id]) kommentarer[m.id] = old.kommentarer[m.id];
        continue;
      }
      const s = normSign(raw[m.id]);
      if (!s) { missing.push(m.match); continue; }
      tecken[m.id] = s;
      const n = text(notes[m.id], NOTE_MAX);
      if (n) kommentarer[m.id] = n;
    }
    // Första gången krävs alla matcher; en ändring får lämna några tomma
    // (de andra ser att kupongen inte är färdig).
    if (missing.length && !old) return fail(400, `Tippa alla matcher – det saknas tecken i ${missing.join(', ')}.`);
    const mine = old
      ? { inne: old.inne, 'ändrad': t.toISOString(), tecken, kommentarer, nyckel: old.nyckel }
      : { inne: t.toISOString(), tecken, kommentarer, nyckel: newId(24) };
    await store.put(tipsKey(round.id, vem.id), mine);
    return ok({ samtal: publicView(round, { ...tips, [vem.id]: mine }, gang, ms, true, drafts), nyckel: mine.nyckel });
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
