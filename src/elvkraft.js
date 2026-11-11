'use strict';

// Elvans slagkraft – två signaler för kandidatjakten (src/candidates.js) ur
// startelvorna i ligorna sedan 2021/22 (data/elvor-historik.json och årets
// matchrapporter i cachen, samma underlag som src/medochutan.js). Bara
// beskrivande tills en kandidat klarat kravet och fått en regelversion.
//
// Allt räknas punkt-i-tiden: för en match används bara lagets tidigare
// ligamatcher, och dagens elva – den är känd ungefär en timme före avspark
// (365Scores trolig elva några dagar före i Premier League och Championship).
//
// - xi  Andel av de ordinarie: lagets ordinarie elva är de elva med flest
//       starter i lagets LAST tidigare ligamatcher (minst MIN_PREV), och
//       andelen = startandelarna för dagens elva delat med de ordinaries.
//       1 = ordinarie elvan, lägre = vila eller frånvaro. Signal =
//       10 × (hemma − borta), alltså per tiondel av ordinarie elvan.
// - xiv Med och utan de som saknas: varje ordinarie som inte startar dras av
//       med sitt värde – lagets poäng per match mot oddsen med honom från
//       start minus utan honom, under hans tid i laget och bara i matcher före
//       dagen, krympt mot noll med n/(n + K) där n = nm·nu/(nm + nu). K = 64
//       a priori: poängen per match har spridningen ~1,2 och en spelares
//       verkliga betydelse antas sällan vara över ~0,15 poäng per match
//       (1,2² / 0,15² ≈ 64). Signal = bortalagets förlust − hemmalagets, i
//       poäng per match.
//
// Värdena (LAST, MIN_PREV, K) är valda före första körningen och prövas inte
// i flera varianter.

const { espnKey } = require('./teams');
const MU = require('./medochutan');

const LAST = 10;
const MIN_PREV = 5;
const K = 64;
const DAY = 86400000;

// Lagets ligamatcher i tidsordning: { t, s, start, spel, x (poäng − väntade
// enligt oddsen, null utan odds) }.
function teamLists() {
  const names = {};
  const odds = MU.oddsIndex();
  const teams = new Map();
  const index = new Map(); // hemma|borta (ESPN-nycklar) -> [{ t, h, a, ih, ia }]
  for (const m of MU.allMatches(names)) {
    const t = Date.parse(m.d);
    const ent = { t, h: m.h, a: m.a, ih: null, ia: null };
    for (const side of [0, 1]) {
      const id = side ? m.a : m.h;
      const gf = side ? m.ag : m.hg;
      const ga = side ? m.hg : m.ag;
      const xp = MU.expected(odds, m.d, names[m.h], names[m.a], side === 0);
      const pts = gf > ga ? 3 : gf === ga ? 1 : 0;
      if (!teams.has(id)) teams.set(id, []);
      const row = { t, s: m.s, start: m.start[side], spel: m.spel[side], x: xp == null ? null : pts - xp, ent, side };
      teams.get(id).push(row);
    }
    const k = `${espnKey(names[m.h])}|${espnKey(names[m.a])}`;
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(ent);
  }
  for (const list of teams.values()) {
    list.sort((x, y) => x.t - y.t);
    list.forEach((r, i) => { if (r.side) r.ent.ia = i; else r.ent.ih = i; });
  }
  return { teams, index };
}

// Spelarens värde före match i: med minus utan mot oddsen under hans
// nuvarande tid i laget (säsonger i följd med minst en match), krympt.
function value(list, i, p) {
  // säsongerna då han spelat, före match i
  const played = new Set();
  const seasons = [];
  for (let j = 0; j < i; j++) {
    if (!seasons.length || seasons[seasons.length - 1] !== list[j].s) seasons.push(list[j].s);
    if (list[j].spel.has(p)) played.add(list[j].s);
  }
  // bakåt från den senaste säsongen han spelat, så länge han spelat varje säsong
  let k = seasons.length - 1;
  while (k >= 0 && !played.has(seasons[k])) k--;
  if (k < 0) return 0;
  while (k > 0 && played.has(seasons[k - 1])) k--;
  const from = seasons[k];
  let nm = 0; let nu = 0; let sm = 0; let su = 0;
  let started = false;
  for (let j = 0; j < i; j++) {
    const r = list[j];
    if (r.s < from) continue;
    if (!started) { if (!r.spel.has(p)) continue; started = true; }
    if (r.x == null) continue;
    if (r.start.has(p)) { nm++; sm += r.x; } else { nu++; su += r.x; }
  }
  if (!nm || !nu) return 0;
  const n = (nm * nu) / (nm + nu);
  return (sm / nm - su / nu) * (n / (n + K));
}

// Andelen av de ordinarie och de saknades värde för lagets match i, eller
// null om laget har för få tidigare matcher.
function strength(list, i) {
  const prev = list.slice(Math.max(0, i - LAST), i);
  if (prev.length < MIN_PREV) return null;
  const f = new Map();
  for (const r of prev) for (const p of r.start) f.set(p, (f.get(p) || 0) + 1 / prev.length);
  const usual = [...f].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 11);
  const full = usual.reduce((s, [, v]) => s + v, 0);
  const today = list[i].start;
  let xi = 0;
  for (const p of today) xi += f.get(p) || 0;
  let lost = 0;
  for (const [p] of usual) if (!today.has(p)) lost += value(list, i, p);
  return { xi: full ? xi / full : null, lost };
}

// Signalerna per backtestpost (records från src/backtest.js), från
// hemmalagets håll; 0 = okänd.
function lineupSignals(records) {
  const { teams, index } = teamLists();
  const memo = new Map();
  const of = (id, i) => {
    const k = `${id}|${i}`;
    if (!memo.has(k)) memo.set(k, strength(teams.get(id), i));
    return memo.get(k);
  };
  const out = { xi: new Map(), xiv: new Map() };
  let hit = 0;
  for (const r of records) {
    const xs = index.get(`${r.h}|${r.a}`);
    const t = Date.parse(r.d);
    const e = xs && xs.find((x) => Math.abs(x.t - t) <= 2 * DAY);
    const h = e ? of(e.h, e.ih) : null;
    const a = e ? of(e.a, e.ia) : null;
    if (e) hit++;
    out.xi.set(r.id, h && a && h.xi != null && a.xi != null ? 10 * (h.xi - a.xi) : 0);
    out.xiv.set(r.id, h && a ? a.lost - h.lost : 0);
  }
  out.matched = hit;
  return out;
}

module.exports = { lineupSignals, LAST, MIN_PREV, K };
