'use strict';

// Spelardata per division och per lag, ur ESPN-trupperna (src/playersources.js)
// och FPL (bara Premier League: skadelistan och speltid, xG/xA, pris och
// poäng per spelare). Allt räknas ur cachen vid bygget; inget här styr
// prognoserna.
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

const LEAGUES = COMPETITIONS.filter((c) => c.type === 'league');
const SEASON_YEAR = Number(SEASON.label.slice(0, 4));

const TOP = 20;
const MIN_SHOTS_CONVERSION = 10; // mål per skott: minst så många skott
const MIN_SHARE_KEEPER = 0.5; // målvakter: minst halva lagets matcher
const MIN_MINUTES_P90 = 270; // per 90 minuter: minst tre hela matcher
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
  const fx = fpl ? fpl.map : null;
  const rows = [];
  const all = [];
  for (const t of d.teams) {
    for (const p of t.players) {
      if (played(p)) rows.push(row(p, t, fx));
      all.push(p.stats ? { ...row(p, t, fx), ...gk(p) } : { ...bare(p, t), ...(fx && fx.get(p.id)) });
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
      // Bara med FPL (Premier League): mål över och under xG.
      overXg: fx ? top(rows, overXg, { min: 0.01 }).map((r) => ({ ...r, dxg: overXg(r) })) : null,
      underXg: fx ? top(rows, (r) => (overXg(r) == null ? null : -overXg(r)), { min: 0.01 }).map((r) => ({ ...r, dxg: overXg(r) })) : null,
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
    thresholds: { minShotsConversion: MIN_SHOTS_CONVERSION, minShareKeeper: MIN_SHARE_KEEPER, minMinutesP90: MIN_MINUTES_P90, top: TOP },
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
      .map((p) => ({ name: p.name, pos: p.pos, status: STATUS[p.status], chance: p.chanceNext, news: p.news, minutes: p.minutes })),
  };
}

// Filerna bygget skriver: players/<liga>.json per division. Trupperna i
// matchvyn läggs i matchfilen (teamSquad) och skrivs inte separat.
function playerFiles() {
  return LEAGUES.map((c) => ({ path: `players/${c.id}.json`, data: divisionPlayers(c.id) }));
}

module.exports = { divisionPlayers, teamSquad, playerFiles, LEAGUES };
