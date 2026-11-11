'use strict';

// Med och utan spelaren: hur laget har gått i ligan när spelaren startat och
// när han inte startat, och hur det står sig mot oddsen vid avspark. Säger
// något om hur viktig spelaren är för laget – en målskytt kan vara mindre
// viktig än man tror om laget tar lika många poäng utan honom.
//
// Underlaget är startelvorna i de fyra ligorna sedan 2021-22: spelade
// säsonger ur data/elvor-historik.json (scripts/elvor-historik.js) och
// innevarande ur matchrapporterna i cachen (espn_minutes_<liga>). Oddsen är
// football-data.co.uks snitt vid avspark, med marginalen bortdragen som i
// src/teamstats.js; matcher utan odds räknas inte.
//
// Bara matcher medan spelaren hörde till laget räknas, annars jämförs laget
// före hans tid med laget under den (StatMuses Haaland-tabell 2026-11-11:
// "utan" var mest City 2019–22). Tiden i laget är de säsonger i följd då han
// spelade någon ligamatch för laget, från första till sista matchen han
// spelade. Står han i lagets trupp i år räknas tiden fram till i dag, om han
// spelat i år eller i fjol – så att en långtidsskadad räknas, men inte ett
// helt låneår. Matcher i en säsong han inte spelade alls (lån, säsongslång
// skada) bryter tiden.
//
// "Med" = i startelvan, "utan" = inte i startelvan (borta eller på bänken).
// Båda sidor kräver minst MIN matcher; annars visas inget (okänt, inte noll).

const fs = require('fs');
const path = require('path');
const { COMPETITIONS, SEASON } = require('../config/competitions');
const { readCache, CACHE_DIR } = require('./store');
const { keyOf, espnKey } = require('./teams');
const { market } = require('./teamstats');

const FILE = path.join(__dirname, '..', 'data', 'elvor-historik.json');
const LEAGUES = COMPETITIONS.filter((c) => c.type === 'league');
const CURRENT = SEASON.fdcouk; // '2627'
const MIN = 10;
const DAY = 86400000;

// Uträkningen görs en gång och görs om när underlaget har ändrats (servern
// uppdaterar cachen var 15:e minut i samma process). Filerna kontrolleras
// högst var tionde sekund, inte en gång per spelare.
let memo = null;
let memoKey = null;
let checkedAt = 0;
const SOURCES = () => [FILE, ...LEAGUES.flatMap((c) => [`espn_minutes_${c.id}`, `espn_players_${c.id}`, `fdcouk_${c.fdcouk}`].map((id) => path.join(CACHE_DIR, `${id}.json`)))];

function mtime(f) {
  try { return fs.statSync(f).mtimeMs; } catch { return 0; }
}

// Oddsen per match: nyckel hemma|borta (ESPN-nycklar) -> [{ t: datum (ms), p }].
function oddsIndex() {
  const idx = new Map();
  const add = (r) => {
    const m = market(r);
    if (!m || !r.date) return;
    const k = `${keyOf(r.HomeTeam)}|${keyOf(r.AwayTeam)}`;
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k).push({ t: Date.parse(r.date), p: m.p });
  };
  for (const c of LEAGUES) {
    const h = readCache(`fdcouk_hist_${c.fdcouk}`);
    const seasons = h && h.data && h.data.seasons;
    if (seasons) for (const s of Object.keys(seasons)) if (s >= '2122') seasons[s].forEach(add);
    const cur = readCache(`fdcouk_${c.fdcouk}`);
    if (cur && cur.data && cur.data.rows) cur.data.rows.forEach(add);
  }
  return idx;
}

// Lagets väntade poäng enligt oddsen, eller null om matchen inte finns där.
function expected(idx, date, home, away, isHome) {
  const xs = idx.get(`${espnKey(home)}|${espnKey(away)}`);
  if (!xs) return null;
  const t = Date.parse(date);
  const hit = xs.find((x) => Math.abs(x.t - t) <= 3 * DAY);
  if (!hit) return null;
  const [ph, pd, pa] = hit.p;
  return 3 * (isHome ? ph : pa) + pd;
}

// Alla ligamatcher med startelvor: { s: säsong, d: datum, h, a: lag-id,
// hg, ag, start: [Set, Set], spel: [Set, Set] } (spel = startade eller
// byttes in).
function allMatches(names) {
  const out = [];
  let hist = null;
  try { hist = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { hist = null; }
  if (hist) {
    Object.assign(names, hist.lag);
    for (const c of Object.keys(hist.matcher)) {
      for (const [s, rows] of Object.entries(hist.matcher[c])) {
        for (const [, d, h, a, hg, ag, hs, as, hi, ai] of rows) {
          const sh = hs.split(' ');
          const sa = as.split(' ');
          out.push({
            s, d, h, a, hg, ag,
            start: [new Set(sh), new Set(sa)],
            spel: [new Set(sh.concat(hi ? hi.split(' ') : [])), new Set(sa.concat(ai ? ai.split(' ') : []))],
          });
        }
      }
    }
  }
  for (const c of LEAGUES) {
    const mins = readCache(`espn_minutes_${c.id}`);
    const fx = readCache(`espn_fixtures_${c.id}`);
    if (!mins || !mins.data || !fx || !fx.data) continue;
    const byId = new Map(fx.data.matches.map((m) => [String(m.id), m]));
    for (const [id, m] of Object.entries(mins.data.matches)) {
      const f = byId.get(id);
      if (!f || !f.completed || !f.score || !m.e) continue;
      const h = String(f.home.espnId);
      const a = String(f.away.espnId);
      const eh = m.e[h];
      const ea = m.e[a];
      if (!eh || !ea || !eh.s || !ea.s) continue;
      names[h] = f.home.name;
      names[a] = f.away.name;
      out.push({
        s: CURRENT, d: m.k.slice(0, 10), h, a, hg: f.score.home, ag: f.score.away,
        start: [new Set(eh.s), new Set(ea.s)],
        spel: [new Set(Object.keys((m.t && m.t[h]) || {}).concat(eh.s)), new Set(Object.keys((m.t && m.t[a]) || {}).concat(ea.s))],
      });
    }
  }
  return out;
}

// Spelarna i lagens trupper i år (ESPN): lag-id -> Set av spelar-id.
function currentSquads() {
  const out = new Map();
  for (const c of LEAGUES) {
    const p = readCache(`espn_players_${c.id}`);
    if (!p || !p.data) continue;
    for (const t of p.data.teams) out.set(String(t.espnId), new Set(t.players.map((x) => String(x.id))));
  }
  return out;
}

const blank = () => ({ n: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, xp: 0 });

function compute() {
  const names = {};
  const odds = oddsIndex();
  const squads = currentSquads();
  // Lagets matcher i tidsordning, med lagets mål och väntade poäng.
  const teams = new Map();
  for (const m of allMatches(names)) {
    for (const side of [0, 1]) {
      const id = side ? m.a : m.h;
      const xp = expected(odds, m.d, names[m.h], names[m.a], side === 0);
      if (xp == null) continue;
      const gf = side ? m.ag : m.hg;
      const ga = side ? m.hg : m.ag;
      if (!teams.has(id)) teams.set(id, []);
      teams.get(id).push({ s: m.s, d: m.d, gf, ga, xp, start: m.start[side], spel: m.spel[side] });
    }
  }
  const SEASONS = ['2122', '2223', '2324', '2425', '2526', CURRENT];
  const prevSeason = SEASONS[SEASONS.length - 2];
  const result = new Map(); // lag-id -> Map(spelar-id -> { m, u, fran })
  for (const [team, list] of teams) {
    list.sort((x, y) => x.d.localeCompare(y.d));
    const seasonsOfTeam = [...new Set(list.map((x) => x.s))].sort();
    // Spelarnas första och sista match per säsong.
    const seen = new Map(); // spelare -> Map(säsong -> [första, sista] index)
    list.forEach((x, i) => {
      for (const p of x.spel) {
        if (!seen.has(p)) seen.set(p, new Map());
        const ps = seen.get(p);
        const r = ps.get(x.s);
        if (r) r[1] = i; else ps.set(x.s, [i, i]);
      }
    });
    const squad = squads.get(team);
    const out = new Map();
    for (const [p, ps] of seen) {
      // Säsonger i följd (bland lagets säsonger i de fyra ligorna).
      const runs = [];
      let run = null;
      for (const s of seasonsOfTeam) {
        if (ps.has(s)) {
          if (!run) runs.push((run = { from: ps.get(s)[0], to: ps.get(s)[1], last: s }));
          else { run.to = ps.get(s)[1]; run.last = s; }
        } else run = null;
      }
      const end = runs[runs.length - 1];
      if (end && squad && squad.has(p) && (end.last === CURRENT || end.last === prevSeason)) end.to = list.length - 1;
      const m = blank();
      const u = blank();
      for (const r of runs) {
        for (let i = r.from; i <= r.to; i++) {
          const x = list[i];
          const e = x.start.has(p) ? m : u;
          e.n++;
          if (x.gf > x.ga) { e.w++; e.pts += 3; } else if (x.gf === x.ga) { e.d++; e.pts += 1; } else e.l++;
          e.gf += x.gf;
          e.ga += x.ga;
          e.xp += x.xp;
        }
      }
      if (m.n < MIN || u.n < MIN) continue;
      const pack = (e) => [e.n, e.w, e.d, e.l, e.gf, e.ga, Math.round(e.xp * 100) / 100];
      out.set(p, { m: pack(m), u: pack(u), fran: list[runs[0].from].d.slice(0, 7) });
    }
    result.set(team, out);
  }
  return result;
}

// { m: med, u: utan, fran: 'ÅÅÅÅ-MM' } för spelaren i laget, eller null.
// m och u = [matcher, vunna, oavgjorda, förlorade, gjorda, insläppta,
// väntade poäng enligt oddsen].
function medUtan(teamId, playerId) {
  if (!memo || Date.now() - checkedAt > 10000) {
    checkedAt = Date.now();
    const key = SOURCES().map(mtime).join('|');
    if (!memo || key !== memoKey) {
      memo = compute();
      memoKey = key;
    }
  }
  const t = memo.get(String(teamId));
  return (t && t.get(String(playerId))) || null;
}

module.exports = { medUtan, MIN };
