'use strict';

// Spelardata per division och per lag, ur ESPN-trupperna (src/playersources.js),
// FPL (bara Premier League: skadelistan och speltid, xG/xA, försvarsspel, pris
// och poäng per spelare), ESPN:s matchrapporter (målen i alla fyra ligor,
// speltiden i Championship, League One och League Two) och 365Scores (betygen
// per match och spelarnas bilder). Allt räknas ur cachen vid bygget; inget här
// styr prognoserna.
//
// Principer som i resten av appen: spelare utan statistik är okända, inte
// nollor, och topplistor med kvoter (mål per skott, räddningsprocent) kräver
// ett minsta underlag så att en spelare med ett skott och ett mål inte toppar.
//
// ESPN:s spelarstatistik släpar ofta efter tabellen med en omgång (2026-10-18:
// lördagens matcher fanns i tabellen men inte i trupperna). Det redovisas per
// lag som "omfattar minst X av Y matcher" i stället för att döljas. X är det
// högsta antalet matcher någon i truppen spelat – en undre gräns.

const { COMPETITIONS, SEASON } = require('../config/competitions');
const fs = require('fs');
const path = require('path');
const { CACHE_DIR } = require('./store');
const { keyOf, espnKey, norm } = require('./teams');
const { newsSv } = require('./skadetext');

const LEAGUES = COMPETITIONS.filter((c) => c.type === 'league');
const SEASON_YEAR = Number(SEASON.label.slice(0, 4));

const TOP = 20;
const MIN_SHOTS_CONVERSION = 10; // mål per skott: minst så många skott
const MIN_SHARE_KEEPER = 0.5; // målvakter: minst halva lagets matcher
const MIN_MINUTES_P90 = 270; // per 90 minuter: minst tre hela matcher
const MIN_RATED = 3; // snittbetyg: minst så många betygsatta matcher
const MIN_SHARE_RATED = 0.5; // topplistan: betyg i minst halva lagets betygsatta matcher
const HOME_NATION = 'England';

// Bygget frågar efter trupperna en gång per matchsida – cachefilerna läses
// därför en gång och läses om först när filen ändrats.
const memo = new Map();
function readCache(id) {
  const file = path.join(CACHE_DIR, `${id}.json`);
  let mtime;
  try { mtime = fs.statSync(file).mtimeMs; } catch { return null; }
  const hit = memo.get(id);
  if (hit && hit.mtime === mtime) return hit.entry;
  let entry = null;
  try { entry = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { entry = null; }
  memo.set(id, { mtime, entry });
  return entry;
}

function cacheFor(compId) {
  const c = readCache(`espn_players_${compId}`);
  return c && c.data ? c : null;
}

function standingsFor(compId) {
  const c = readCache(`espn_standings_${compId}`);
  return new Map(c && c.data ? c.data.rows.map((r) => [String(r.espnId), r]) : []);
}

const statsOf = (p) => p.stats || null;
const played = (p) => !!(p.stats && p.stats.app > 0);
const round1 = (x) => Math.round(x * 10) / 10;
const share = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 1000 : null);

function row(p, t, fx) {
  const s = p.stats;
  return {
    ...(fx && fx.get(p.id)),
    id: p.id,
    name: p.name,
    team: t.name,
    teamId: t.espnId,
    pos: p.pos,
    age: p.age,
    nat: p.nat,
    jersey: p.jersey,
    app: s.app,
    starts: s.app != null && s.sub != null ? s.app - s.sub : null,
    g: s.g,
    a: s.a,
    sh: s.sh,
    sot: s.sot,
    yc: s.yc,
    rc: s.rc,
    fc: s.fc,
    fs: s.fs,
    off: s.off,
    og: s.og,
  };
}

function top(list, value, { min = 1, n = TOP, tiebreak } = {}) {
  return list
    .map((x) => ({ x, v: value(x) }))
    .filter((e) => e.v != null && e.v >= min)
    .sort((a, b) => b.v - a.v || (tiebreak ? tiebreak(a.x, b.x) : 0) || a.x.name.localeCompare(b.x.name))
    .slice(0, n)
    .map((e) => e.x);
}

// Lagets matcher enligt tabellen och hur många av dem spelarstatistiken
// minst omfattar.
function coverageOf(t, standing) {
  const covered = Math.max(0, ...t.players.map((p) => (p.stats && p.stats.app) || 0));
  const matches = standing ? standing.played : null;
  return { matches, covered, behind: matches != null ? Math.max(0, matches - covered) : null };
}

function teamSummary(t, standing) {
  const used = t.players.filter(played);
  const apps = used.reduce((s, p) => s + p.stats.app, 0);
  const aged = used.filter((p) => p.age != null);
  const agedApps = aged.reduce((s, p) => s + p.stats.app, 0);
  const goals = used.reduce((s, p) => s + (p.stats.g || 0), 0);
  const scorer = top(used, (p) => p.stats.g, { n: 1 })[0] || null;
  const home = used.filter((p) => p.nat === HOME_NATION).reduce((s, p) => s + p.stats.app, 0);
  return {
    espnId: t.espnId,
    name: t.name,
    squad: t.players.length,
    noStats: t.players.filter((p) => !p.stats).length,
    used: used.length,
    avgAge: agedApps ? round1(aged.reduce((s, p) => s + p.age * p.stats.app, 0) / agedApps) : null,
    homeShare: share(home, apps),
    goals,
    goalsFor: standing ? standing.gf : null,
    topScorer: scorer ? { name: scorer.name, g: scorer.stats.g } : null,
    topScorerShare: scorer ? share(scorer.stats.g, goals) : null,
    yc: used.reduce((s, p) => s + (p.stats.yc || 0), 0),
    rc: used.reduce((s, p) => s + (p.stats.rc || 0), 0),
    coverage: coverageOf(t, standing),
  };
}

function keepers(teams, standings) {
  const out = [];
  for (const t of teams) {
    const st = standings.get(t.espnId);
    const cov = coverageOf(t, st).covered;
    for (const p of t.players) {
      const s = p.stats;
      if (p.pos !== 'MV' || !s || !s.app || cov === 0 || s.app / cov < MIN_SHARE_KEEPER) continue;
      out.push({
        ...row(p, t),
        sv: s.sv,
        gc: s.gc,
        savePct: savePct(s),
        gcPerApp: s.gc != null ? round1(s.gc / s.app) : null,
      });
    }
  }
  return out.sort((a, b) => (b.savePct ?? -1) - (a.savePct ?? -1));
}

// FPL-siffrorna för en ESPN-spelare. Kopplingen görs inom samma lag: i
// första hand på födelsedatum, annars på hela namnet och sist på efternamn
// plus förnamnets initial – och bara när träffen är entydig. Den som inte
// går att koppla får inga FPL-siffror (okänt, inte gissat).
function fplIndex(compId, teams) {
  if (compId !== 'pl') return null;
  const fc = readCache('fpl');
  // Cache från före 2026-10-19 saknar xG och speltidsfälten.
  if (!fc || !fc.data || !fc.data.players.some((p) => p.xg !== undefined)) return null;
  const out = new Map();
  let of = 0;
  for (const t of teams) {
    const ft = fc.data.teams.find((x) => keyOf(x.name) === espnKey(t.name));
    if (!ft) continue;
    const pool = fc.data.players.filter((x) => x.teamId === ft.id);
    const used = new Set();
    const pick = (list) => {
      const free = list.filter((x) => !used.has(x.id));
      return free.length === 1 ? free[0] : null;
    };
    for (const p of t.players) {
      of++;
      const full = norm(p.name);
      const parts = full.split(' ');
      const last = parts[parts.length - 1];
      const hit = (p.dob && pick(pool.filter((x) => x.birth === p.dob)))
        || pick(pool.filter((x) => [`${x.first} ${x.second}`, x.known, x.name].some((n) => n && norm(n) === full)))
        || pick(pool.filter((x) => {
          const sec = norm(x.second).split(' ');
          return sec[sec.length - 1] === last && norm(x.first)[0] === full[0];
        }));
      if (!hit) continue;
      used.add(hit.id);
      out.set(p.id, {
        min: hit.minutes,
        fg: hit.goals,
        fa: hit.assists,
        xg: hit.xg,
        xa: hit.xa,
        cs: hit.cs,
        dc: hit.dc,
        // Cache från före 2026-10-20 saknar försvarsspelet: okänt.
        tk: hit.tackles ?? null,
        rec: hit.recoveries ?? null,
        cbi: hit.cbi ?? null,
        cost: hit.cost,
        sel: hit.sel,
        fpts: hit.points,
        bonus: hit.bonus,
        pen: hit.pens,
      });
    }
  }
  return { map: out, matched: out.size, of, fetchedAt: fc.fetchedAt };
}

// Speltiden utanför Premier League, ur matchrapporterna (espn_minutes_<liga>).
// Truppens statistik släpar ofta en omgång efter rapporterna, så minuterna
// räknas för spelarens första `app` matcher i laget – samma matcher som målen
// i truppen. Har rapporterna färre matcher än truppen (en rapport saknas,
// eller spelaren har bytt klubb inom ligan) är speltiden okänd, inte för låg.
// I Premier League är FPL:s speltid den som visas; rapporternas (emin) delar
// bara ESPN:s siffror per 90 minuter, eftersom FPL kan ligga en omgång före.
function minutesIndex(compId, teams) {
  if (!LEAGUES.some((c) => c.id === compId)) return null;
  const c = readCache(`espn_minutes_${compId}`);
  if (!c || !c.data || !c.data.matches) return null;
  const apps = new Map(); // "lag|spelare" → minuter per match i tidsordning
  for (const m of Object.values(c.data.matches).sort((a, b) => a.k.localeCompare(b.k))) {
    for (const [teamId, ps] of Object.entries(m.t)) {
      for (const [id, min] of Object.entries(ps)) {
        const k = `${teamId}|${id}`;
        if (!apps.has(k)) apps.set(k, []);
        apps.get(k).push(min);
      }
    }
  }
  const out = new Map();
  let of = 0;
  for (const t of teams) {
    for (const p of t.players) {
      if (!p.stats || p.stats.app == null) continue;
      of++;
      const list = apps.get(`${t.espnId}|${p.id}`) || [];
      if (list.length < p.stats.app) continue;
      out.set(p.id, { min: list.slice(0, p.stats.app).reduce((s, x) => s + x, 0) });
    }
  }
  return { map: out, matched: out.size, of, matches: Object.keys(c.data.matches).length, fetchedAt: c.fetchedAt };
}

// Betygen ur 365Scores (s365_ratings_<liga>): snittet av spelarens betyg i
// ligans matcher i år (rt) och hur många matcher det bygger på (rn), plus hur
// ofta spelaren fick matchens högsta betyg (rb, delat räknas). Gäller alla
// matcher 365Scores har betyg för, inte bara de ESPN-truppen hunnit föra in.
// Spelarna kopplas till ESPN-truppen inom laget på hela namnet, annars
// efternamn och förnamnets initial, annars tröjnummer och ett gemensamt namn
// eller samma början på efternamnet – och bara när träffen är entydig. Den som inte går att koppla får inget
// betyg (okänt, inte gissat).
const pname = (s) => norm(String(s || '').replace(/-/g, ' '));
function ratingsIndex(compId, teams) {
  const c = readCache(`s365_ratings_${compId}`);
  if (!c || !c.data || !c.data.matches) return null;
  // Spelarna hålls isär på namnet inom laget: 365Scores id för samma spelare
  // kan skifta mellan matcherna (Jack Currie, Oxford, 2026-08-15).
  const pools = new Map(); // ESPN-lag → namn → { name, jersey, r: [betyg], best }
  const rated = new Map(); // ESPN-lag → betygsatta matcher
  let games = 0;
  for (const m of Object.values(c.data.matches)) {
    if (!m.t) continue;
    games++;
    const top = Math.max(...Object.values(m.t).flat().map((x) => x[3]));
    for (const [teamId, ps] of Object.entries(m.t)) {
      rated.set(teamId, (rated.get(teamId) || 0) + 1);
      if (!pools.has(teamId)) pools.set(teamId, new Map());
      const pool = pools.get(teamId);
      for (const [aid, name, jersey, r] of ps) {
        const k = pname(name) || aid;
        const e = pool.get(k) || { name, jersey, r: [], best: 0 };
        e.r.push(r);
        if (r === top) e.best++;
        pool.set(k, e);
      }
    }
  }
  const out = new Map();
  let of = 0;
  for (const t of teams) {
    const pool = [...(pools.get(t.espnId) || new Map()).values()];
    const used = new Set();
    const pick = (test) => {
      const free = pool.filter((x) => !used.has(x) && test(x));
      return free.length === 1 ? free[0] : null;
    };
    // Två steg: först de entydiga namnen för hela truppen, sedan resten.
    const left = [];
    const take = (p, hit) => {
      used.add(hit);
      const avg = hit.r.reduce((s, x) => s + x, 0) / hit.r.length;
      out.set(p.id, { rt: Math.round(avg * 100) / 100, rn: hit.r.length, rb: hit.best, rq: hit.r.length / (rated.get(t.espnId) || 1) });
    };
    for (const p of t.players) {
      if (played(p)) of++;
      const full = pname(p.name);
      const hit = pick((x) => pname(x.name) === full);
      if (hit) take(p, hit); else left.push(p);
    }
    for (const p of left) {
      const parts = pname(p.name).split(' ');
      const last = parts[parts.length - 1];
      const hit = pick((x) => {
        const q = pname(x.name).split(' ');
        return q[q.length - 1] === last && q[0][0] === parts[0][0];
      }) || (p.jersey && pick((x) => {
        // Samma tröja och ett gemensamt namn, eller samma början på
        // efternamnet (Yarmoliuk–Yarmolyuk, Sávio–Savinho).
        const q = pname(x.name).split(' ');
        return String(x.jersey) === String(p.jersey) &&
          (q.some((w) => w.length > 2 && parts.includes(w)) || q[q.length - 1].slice(0, 2) === last.slice(0, 2));
      }));
      if (hit) take(p, hit);
    }
  }
  return {
    map: out,
    matched: [...out.keys()].filter((id) => teams.some((t) => t.players.some((p) => p.id === id && played(p)))).length,
    of,
    games,
    played: c.data.played,
    fetchedAt: c.fetchedAt,
  };
}

// Bilderna ur 365Scores-trupperna (s365_squads_<liga>): [athleteId,
// imageVersion] per ESPN-spelare, bara för dem som har en bild (version över
// 1). Kopplingen görs inom laget som för betygen: hela namnet, sedan samma
// födelsedatum och ett gemensamt namn eller tröjnummer, sedan efternamn och
// förnamnets initial, sist samma tröja och ett gemensamt namn – och bara när
// träffen är entydig. Den som inte går att koppla får ingen bild.
function photosIndex(compId, teams) {
  const c = readCache(`s365_squads_${compId}`);
  if (!c || !c.data || !c.data.teams) return null;
  const out = new Map();
  let of = 0;
  for (const t of teams) {
    const sq = c.data.teams[t.espnId];
    const pool = sq ? sq.a.map(([aid, name, jersey, dob, v]) => ({ aid, q: pname(name).split(' '), jersey, dob, v })) : [];
    const used = new Set();
    const pick = (test) => {
      const free = pool.filter((x) => !used.has(x) && test(x));
      return free.length === 1 ? free[0] : null;
    };
    const left = [];
    const take = (p, hit) => {
      used.add(hit);
      if (hit.v > 1) out.set(p.id, [hit.aid, hit.v]);
    };
    for (const p of t.players) {
      of++;
      const full = pname(p.name);
      const hit = pick((x) => x.q.join(' ') === full);
      if (hit) take(p, hit); else left.push(p);
    }
    for (const p of left) {
      const parts = pname(p.name).split(' ');
      const last = parts[parts.length - 1];
      const shared = (x) => x.q.some((w) => w.length > 2 && parts.includes(w));
      const sameShirt = (x) => p.jersey && String(x.jersey) === String(p.jersey);
      const hit = (p.dob && pick((x) => x.dob === p.dob && (shared(x) || sameShirt(x))))
        || pick((x) => x.q[x.q.length - 1] === last && x.q[0][0] === parts[0][0])
        || pick((x) => sameShirt(x) && (shared(x) || x.q[x.q.length - 1].slice(0, 2) === last.slice(0, 2)));
      if (hit) take(p, hit);
    }
  }
  return { map: out, matched: out.size, of, fetchedAt: c.fetchedAt };
}

// Målen ur matchrapporterna (espn_minutes_<liga>, alla fyra ligor): sorten,
// när de kom och vad de betydde för resultatet. Som speltiden räknas de för
// spelarens första `app` matcher i laget – samma matcher som målen i truppen –
// och bara när rapporternas mål för spelaren är lika många som truppens.
// Saknar en av matcherna målen, eller stämmer antalet inte, är allt okänt.
// Målens sort (KIND_KEYS) är okänd om någon av matcherna bara har minut och
// målskytt (d = 0, League One och League Two).
//
//   gw   segermål: målet som gav vinnaren den ledning den aldrig tappade
//        (vid 3–1 lagets andra mål)
//   gpts poäng som målen gav: vad laget tappat utan just det målet – 2 i en
//        match vunnen med ett mål, 1 i en oavgjord, annars 0
//   g1   matchens första mål     ghd nick     gpen straff     gfk frispark
//   gout utanför straffområdet   glate från 80:e minuten (tilläggstid räknas)
//   gsub som inhoppare           pmiss missade straffar
const GOAL_KEYS = ['g', 'gw', 'gpts', 'g1', 'ghd', 'gpen', 'gfk', 'gout', 'glate', 'gsub', 'pmiss'];
const KIND_KEYS = ['ghd', 'gpen', 'gfk', 'gout', 'pmiss'];
const LATE_MINUTE = 80;

function matchGoals(m) {
  const out = new Map();
  const add = (k, field) => {
    if (!out.has(k)) out.set(k, Object.fromEntries(GOAL_KEYS.map((x) => [x, 0])));
    out.get(k)[field]++;
  };
  const final = {};
  for (const x of m.g) final[x.t] = (final[x.t] || 0) + 1;
  const run = {};
  m.g.forEach((x, i) => {
    run[x.t] = (run[x.t] || 0) + 1;
    if (x.o || !x.p) return;
    const k = `${x.t}|${x.p}`;
    const us = final[x.t];
    const them = Object.keys(m.t).filter((t) => t !== x.t).reduce((sum, t) => sum + (final[t] || 0), 0);
    add(k, 'g');
    if (us > them && run[x.t] === them + 1) add(k, 'gw');
    if (us - them === 1) { add(k, 'gpts'); add(k, 'gpts'); } else if (us === them) add(k, 'gpts');
    if (i === 0) add(k, 'g1');
    if (x.s === 'n') add(k, 'ghd');
    if (x.s === 's') add(k, 'gpen');
    if (x.s === 'f') add(k, 'gfk');
    if (x.u) add(k, 'gout');
    if (x.m >= LATE_MINUTE) add(k, 'glate');
    if (x.i) add(k, 'gsub');
  });
  for (const x of m.pm || []) add(`${x.t}|${x.p}`, 'pmiss');
  return out;
}

function goalsIndex(compId, teams) {
  const c = readCache(`espn_minutes_${compId}`);
  if (!c || !c.data || !c.data.matches) return null;
  const matches = Object.values(c.data.matches).sort((a, b) => a.k.localeCompare(b.k));
  const apps = new Map(); // "lag|spelare" → { s: målen, d } per match i tidsordning (undefined = okänt)
  for (const m of matches) {
    const goals = Array.isArray(m.g) ? matchGoals(m) : null;
    for (const [teamId, ps] of Object.entries(m.t)) {
      for (const id of Object.keys(ps)) {
        const k = `${teamId}|${id}`;
        if (!apps.has(k)) apps.set(k, []);
        apps.get(k).push(goals ? { s: goals.get(k) || null, d: m.d } : undefined);
      }
    }
  }
  const out = new Map();
  let of = 0;
  for (const t of teams) {
    for (const p of t.players) {
      if (!p.stats || !p.stats.app) continue;
      of++;
      const list = (apps.get(`${t.espnId}|${p.id}`) || []).slice(0, p.stats.app);
      if (list.length < p.stats.app || list.includes(undefined)) continue;
      const sum = Object.fromEntries(GOAL_KEYS.map((x) => [x, 0]));
      for (const e of list) if (e.s) for (const x of GOAL_KEYS) sum[x] += e.s[x];
      if (sum.g !== (p.stats.g || 0)) continue;
      delete sum.g;
      if (list.some((e) => e.d === 0)) for (const x of KIND_KEYS) delete sum[x];
      out.set(p.id, sum);
    }
  }
  // kinds: de flesta rapporterna i ligan beskriver målens sort (annars visas
  // den inte – League Two hade 3 sådana av 115 matcher med mål).
  const detailed = matches.filter((m) => m.d === 1).length;
  return { map: out, matched: out.size, of, fetchedAt: c.fetchedAt, kinds: detailed > matches.filter((m) => m.d === 0).length };
}

// Bygget frågar efter målen en gång per matchsida: räkna om först när
// rapporterna eller trupperna har lästs om.
const goalsMemo = new Map();
function goalTypesFor(compId) {
  const c = readCache(`espn_minutes_${compId}`);
  const pc = cacheFor(compId);
  const hit = goalsMemo.get(compId);
  if (hit && hit.c === c && hit.pc === pc) return hit.v;
  const v = pc ? goalsIndex(compId, pc.data.teams) : null;
  goalsMemo.set(compId, { c, pc, v });
  return v;
}

// Målen i hela ligan ur matchrapporterna (alla matcher, inte bara de
// trupperna hunnit föra in): när de görs, per kvart – tilläggstiden räknas
// till halvlekens sista kvart – och hur, där rapporterna beskriver målen.
const QUARTERS = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75], [76, 90]];
const HOW = [
  ['nick', (x) => x.s === 'n'],
  ['straff', (x) => x.s === 's'],
  ['frispark', (x) => x.s === 'f'],
  ['utifrån', (x) => x.u],
  ['självmål', (x) => x.o],
  ['inifrån', () => true],
];
function leagueGoals(compId) {
  const c = readCache(`espn_minutes_${compId}`);
  if (!c || !c.data || !c.data.matches) return null;
  const matches = Object.values(c.data.matches).filter((m) => Array.isArray(m.g));
  if (!matches.length) return null;
  const goals = matches.flatMap((m) => m.g);
  const when = QUARTERS.map(([from, to]) => ({ from, to, goals: 0 }));
  for (const x of goals) {
    const q = when.find((w) => x.m >= w.from && x.m <= w.to) || (x.m > 90 ? when[when.length - 1] : null);
    if (q) q.goals++;
  }
  const detailed = matches.filter((m) => m.d === 1);
  const plain = matches.filter((m) => m.d === 0).length;
  let how = null;
  if (detailed.length > plain) {
    const counts = new Map(HOW.map(([k]) => [k, 0]));
    const dg = detailed.flatMap((m) => m.g);
    for (const x of dg) { const k = HOW.find(([, test]) => test(x))[0]; counts.set(k, counts.get(k) + 1); }
    how = { matches: detailed.length, goals: dg.length, kinds: [...counts].map(([kind, n]) => ({ kind, goals: n })) };
  }
  return { fetchedAt: c.fetchedAt, matches: matches.length, goals: goals.length, when, how };
}

// Mål minus xG (FPL:s egna mål, så att båda gäller samma matcher).
const overXg = (r) => (r.xg != null && r.fg != null ? Math.round((r.fg - r.xg) * 100) / 100 : null);

function divisionPlayers(compId) {
  const comp = LEAGUES.find((c) => c.id === compId);
  const cache = cacheFor(compId);
  if (!comp || !cache) {
    return { comp: compId, unknown: true, reason: 'Ingen spelardata hämtad än för divisionen.' };
  }
  const d = cache.data;
  const standings = standingsFor(compId);
  const fpl = fplIndex(compId, d.teams);
  const mins = minutesIndex(compId, d.teams);
  const fx = fpl ? fpl.map : mins ? mins.map : null;
  const emin = (p) => (fpl && mins && mins.map.has(p.id) ? { emin: mins.map.get(p.id).min } : null);
  const goalTypes = goalTypesFor(compId);
  const ratings = ratingsIndex(compId, d.teams);
  const rat = (p) => {
    const r = ratings && ratings.map.get(p.id);
    return r ? { rt: r.rt, rn: r.rn, rb: r.rb } : null;
  };
  const photos = photosIndex(compId, d.teams);
  const ph = (p) => (photos && photos.map.has(p.id) ? { ph: photos.map.get(p.id) } : null);
  const rows = [];
  const all = [];
  for (const t of d.teams) {
    for (const p of t.players) {
      if (played(p)) rows.push({ ...row(p, t, fx), ...rat(p) });
      all.push(p.stats
        ? { ...row(p, t, fx), ...emin(p), ...gk(p), ...(goalTypes && goalTypes.map.get(p.id)), ...rat(p), ...ph(p) }
        : { ...bare(p, t), ...(fx && fx.get(p.id)), ...rat(p), ...ph(p) });
    }
  }

  const posGoals = { A: 0, MF: 0, B: 0, MV: 0, okänd: 0 };
  for (const r of rows) posGoals[r.pos || 'okänd'] += r.g || 0;
  const goals = rows.reduce((s, r) => s + (r.g || 0), 0);
  const apps = rows.reduce((s, r) => s + r.app, 0);

  const nats = new Map();
  for (const r of rows) {
    const k = r.nat || 'okänd';
    const e = nats.get(k) || { nat: k, players: 0, apps: 0 };
    e.players++;
    e.apps += r.app;
    nats.set(k, e);
  }
  const natList = [...nats.values()].sort((a, b) => b.apps - a.apps)
    .map((e) => ({ ...e, appShare: share(e.apps, apps) }));

  const teams = d.teams.map((t) => teamSummary(t, standings.get(t.espnId)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const behind = teams.filter((t) => t.coverage.behind > 0).length;
  const aged = rows.filter((r) => r.age != null);
  const agedApps = aged.reduce((s, r) => s + r.app, 0);
  const goalsFor = teams.reduce((s, t) => s + (t.goalsFor || 0), 0);

  return {
    comp: compId,
    unknown: false,
    source: { provider: 'ESPN', fetchedAt: cache.fetchedAt, url: d.sourceUrl },
    season: d.season,
    // ESPN byter säsong när den nya startar; före dess kan trupperna visa
    // förra säsongens siffror. Sidan ska då säga det, inte visa dem som årets.
    seasonMismatch: !d.season || d.season.year !== SEASON_YEAR,
    totals: {
      teams: d.teams.length,
      players: d.teams.reduce((s, t) => s + t.players.length, 0),
      used: rows.length,
      goals,
      goalsFor,
      // Mål i tabellen som inte har en målskytt i trupperna: självmål,
      // spelare som lämnat klubben och omgången som ännu inte förts in.
      unattributed: goalsFor ? goalsFor - goals : null,
      avgAge: agedApps ? round1(aged.reduce((s, r) => s + r.age * r.app, 0) / agedApps) : null,
      homeShare: share(natList.filter((n) => n.nat === HOME_NATION).reduce((s, n) => s + n.apps, 0), apps),
      nations: natList.filter((n) => n.nat !== 'okänd').length,
      teamsBehind: behind,
    },
    goalsByPos: Object.entries(posGoals).filter(([, g]) => g > 0)
      .map(([pos, g]) => ({ pos, goals: g, share: share(g, goals) })),
    nations: natList.slice(0, 10),
    leaders: {
      goals: top(rows, (r) => r.g, { tiebreak: (a, b) => a.app - b.app }),
      assists: top(rows, (r) => r.a, { tiebreak: (a, b) => a.app - b.app }),
      involvement: top(rows, (r) => (r.g || 0) + (r.a || 0), { tiebreak: (a, b) => a.app - b.app })
        .map((r) => ({ ...r, ga: (r.g || 0) + (r.a || 0) })),
      conversion: top(rows.filter((r) => r.sh >= MIN_SHOTS_CONVERSION), (r) => r.g / r.sh, { min: 1e-9, n: 10 })
        .map((r) => ({ ...r, conv: share(r.g, r.sh) })),
      yellow: top(rows, (r) => r.yc, { n: 10, tiebreak: (a, b) => a.app - b.app }),
      red: top(rows, (r) => r.rc, { n: 20 }),
      keepers: keepers(d.teams, standings),
      // Snittbetyget från 365Scores, bland spelare med betyg i minst halva
      // lagets betygsatta matcher (och minst MIN_RATED).
      rating: ratings
        ? top(rows.filter((r) => r.rn >= MIN_RATED && ratings.map.get(r.id).rq >= MIN_SHARE_RATED), (r) => r.rt,
          { tiebreak: (a, b) => b.rn - a.rn })
        : null,
      // Bara med FPL (Premier League): mål över och under xG.
      overXg: fpl ? top(rows, overXg, { min: 0.01 }).map((r) => ({ ...r, dxg: overXg(r) })) : null,
      underXg: fpl ? top(rows, (r) => (overXg(r) == null ? null : -overXg(r)), { min: 0.01 }).map((r) => ({ ...r, dxg: overXg(r) })) : null,
    },
    teams,
    table: table(compId, standings, d.teams),
    // Skador och avstängningar per lag (bara Premier League, via FPL).
    availability: compId === 'pl'
      ? Object.fromEntries(d.teams.map((t) => [t.espnId, availability(compId, t.name)]))
      : { unknown: true, reason: 'Ingen fri källa för skador och avstängningar utanför Premier League.' },
    // Hela truppen i ligan – spelartabellen på sidan filtrerar och sorterar själv.
    players: all.sort((a, b) => (b.g || 0) - (a.g || 0) || (b.a || 0) - (a.a || 0) || a.name.localeCompare(b.name)),
    // Speltid, xG och pris per spelare (bara Premier League).
    fpl: fpl ? { provider: 'Fantasy Premier League', fetchedAt: fpl.fetchedAt, matched: fpl.matched, of: fpl.of } : null,
    // Speltiden: FPL i Premier League, ESPN:s matchrapporter i övriga ligor.
    // matched av of = spelare med statistik vars speltid är känd.
    minutes: fpl
      ? { provider: 'Fantasy Premier League', fetchedAt: fpl.fetchedAt, matched: fpl.matched, of: fpl.of }
      : mins ? { provider: 'ESPN', fetchedAt: mins.fetchedAt, matched: mins.matched, of: mins.of, matches: mins.matches } : null,
    // Målens sort och betydelse ur matchrapporterna (alla fyra ligor).
    // matched av of = spelare med statistik vars mål går att följa.
    goalTypes: goalTypes ? { provider: 'ESPN', fetchedAt: goalTypes.fetchedAt, matched: goalTypes.matched, of: goalTypes.of, kinds: goalTypes.kinds } : null,
    leagueGoals: leagueGoals(compId),
    // Betygen från 365Scores. matched av of = spelare med statistik som har
    // betyg; games av played = ligamatcher med betyg.
    ratings: ratings
      ? { provider: '365Scores', fetchedAt: ratings.fetchedAt, matched: ratings.matched, of: ratings.of, games: ratings.games, played: ratings.played }
      : null,
    // Bilderna i spelarkortet. matched av of = spelare i truppen med bild.
    photos: photos ? { provider: '365Scores', fetchedAt: photos.fetchedAt, matched: photos.matched, of: photos.of } : null,
    thresholds: {
      minShotsConversion: MIN_SHOTS_CONVERSION, minShareKeeper: MIN_SHARE_KEEPER, minMinutesP90: MIN_MINUTES_P90,
      minRated: MIN_RATED, minShareRated: MIN_SHARE_RATED, top: TOP,
    },
  };
}

// Tabellen ur ESPN (samma cache som prognosmotorn läser) med lagets kort ur
// trupperna. note = ESPN:s zon (uppflyttning, kval, nedflyttning).
function table(compId, standings, teams) {
  const c = readCache(`espn_standings_${compId}`);
  if (!c || !c.data) return null;
  const byId = new Map(teams.map((t) => [t.espnId, t]));
  return {
    fetchedAt: c.fetchedAt,
    rows: c.data.rows.map((r) => {
      const t = byId.get(String(r.espnId));
      const used = t ? t.players.filter(played) : [];
      return {
        ...r,
        espnId: String(r.espnId),
        yc: t ? used.reduce((s, p) => s + (p.stats.yc || 0), 0) : null,
        rc: t ? used.reduce((s, p) => s + (p.stats.rc || 0), 0) : null,
      };
    }),
  };
}

function bare(p, t) {
  return { id: p.id, name: p.name, team: t.name, teamId: t.espnId, pos: p.pos, age: p.age, nat: p.nat, jersey: p.jersey, noStats: true };
}

// Trupp för ett lag i matchvyn, efter ESPN-namnet (samma källa som
// spelprogrammet). Cuplag utanför de fyra ligorna har ingen spelardata.
function teamSquad(teamName) {
  const k = espnKey(teamName);
  for (const c of LEAGUES) {
    const cache = cacheFor(c.id);
    const t = cache && cache.data.teams.find((x) => espnKey(x.name) === k);
    if (!t) continue;
    const standing = standingsFor(c.id).get(t.espnId);
    const players = t.players.map((p) => (p.stats ? { ...row(p, t), ...gk(p) } : bare(p, t)));
    const used = players.filter((p) => p.app > 0);
    // Segermålen följer bara med i nyckellistan, inte i hela truppen.
    const goals = goalTypesFor(c.id);
    const gw = (p) => (goals && goals.map.has(p.id) ? goals.map.get(p.id).gw : null);
    return {
      unknown: false,
      comp: c.id,
      source: { provider: 'ESPN', fetchedAt: cache.fetchedAt, url: cache.data.sourceUrl },
      seasonMismatch: !cache.data.season || cache.data.season.year !== SEASON_YEAR,
      summary: teamSummary(t, standing),
      players: players.sort(byPosThenApps),
      key: {
        scorers: top(used, (p) => p.g, { n: 3, tiebreak: (a, b) => a.app - b.app }),
        creators: top(used, (p) => p.a, { n: 3, tiebreak: (a, b) => a.app - b.app }),
        cards: top(used, (p) => p.yc, { min: 3, n: 5 }),
        winners: goals ? top(used, gw, { n: 3, tiebreak: (a, b) => a.app - b.app }).map((p) => ({ ...p, gw: gw(p) })) : null,
      },
      availability: availability(c.id, t.name),
    };
  }
  return { unknown: true, reason: 'Ingen fri spelardata för lag utanför de fyra ligorna.' };
}

function gk(p) {
  if (p.pos !== 'MV' || !p.stats) return {};
  const s = p.stats;
  return { sv: s.sv, gc: s.gc, savePct: savePct(s) };
}

// Räddningsprocent: räddningar av skotten på mål (räddningar + insläppta).
// ESPN:s "skott mot" saknas för många målvakter och används inte.
function savePct(s) {
  return s.sv != null && s.gc != null ? share(s.sv, s.sv + s.gc) : null;
}

const POS_ORDER = { MV: 0, B: 1, MF: 2, A: 3 };
function byPosThenApps(a, b) {
  return (POS_ORDER[a.pos] ?? 9) - (POS_ORDER[b.pos] ?? 9)
    || (b.app || 0) - (a.app || 0)
    || a.name.localeCompare(b.name);
}

// Skador och avstängningar: bara FPL (Premier League). Övriga ligor: okänt.
function availability(compId, teamName) {
  if (compId !== 'pl') {
    return { unknown: true, reason: 'Ingen fri källa för skador och avstängningar utanför Premier League.' };
  }
  const fc = readCache('fpl');
  if (!fc || !fc.data) return { unknown: true, reason: 'FPL-data saknas.' };
  const k = espnKey(teamName);
  const team = fc.data.teams.find((t) => keyOf(t.name) === k);
  if (!team) return { unknown: true, reason: `Laget hittades inte i FPL (${teamName}).` };
  const STATUS = { i: 'skadad', s: 'avstängd', d: 'tveksam', n: 'ej uttagbar' };
  return {
    unknown: false,
    source: { provider: 'Fantasy Premier League', fetchedAt: fc.fetchedAt },
    players: fc.data.players
      .filter((p) => p.teamId === team.id && STATUS[p.status])
      .sort((x, y) => (y.minutes || 0) - (x.minutes || 0))
      .map((p) => ({ name: p.name, pos: p.pos, status: STATUS[p.status], chance: p.chanceNext, news: newsSv(p.news), minutes: p.minutes })),
  };
}

// Filerna bygget skriver: players/<liga>.json per division. Trupperna i
// matchvyn läggs i matchfilen (teamSquad) och skrivs inte separat.
function playerFiles() {
  return LEAGUES.map((c) => ({ path: `players/${c.id}.json`, data: divisionPlayers(c.id) }));
}

module.exports = { divisionPlayers, teamSquad, playerFiles, LEAGUES };
