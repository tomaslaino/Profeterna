'use strict';

// Den beräknade startelvan: matchrutans flik Startelvor när 365Scores inte
// har någon elva än (League One, League Two, cuperna och matcher mer än några
// dagar bort). Underlaget är lagens startelvor och avbytare i säsongens
// liga- och cupmatcher ur ESPN:s matchrapporter (espn_minutes_<liga>,
// espn_elvor_<cup>). Vem som tas ut och var han står räknas i
// public/elva.js, som matchrutan också använder när den stryker dem som
// saknas. Styr inte prognosen.
//
// Regeln, mätt på säsongens matcher 2026-11-07 (README, *Den beräknade
// startelvan*):
// - Ligamatch: lagets senaste ligaelva. Elvorna från cupen och Europa
//   hoppas över – där roterar lagen. Efter en Europamatch stämde den förra
//   ligaelvan på 8,9 av 11 och Europaelvan på 7,2; efter en cupmatch 9,1
//   mot 4,5.
// - Cupmatch: roterar lagen i divisionen i säsongens cupmatcher (färre än
//   sex ur ligaelvan före startade) tas bänken från lagets senaste
//   ligamatch först och ligaelvan sedan, annars ligaelvan. Målvakten för
//   sig: står ligans målvakt oftast kvar i cupen tas han, annars den på
//   bänken. Har divisionen färre än fem cupmatcher gäller alla fyra
//   divisionerna ihop, och finns inga alls roterar lagen.
// Efter elvan (och bänken) står resten av truppen i kön, efter starter och
// inhopp i de senaste matcherna. Den som saknas hoppas över, och nästa i
// kön som spelar i samma del av laget tar platsen.

const fs = require('fs');
const path = require('path');
const { COMPETITIONS } = require('../config/competitions');
const { readCache, CACHE_DIR } = require('./store');
const Elva = require('../public/elva.js');

const DAY = 86400000;
// Planen tas fram för matcher högst så här många dagar bort.
const WINDOW_DAYS = 14;
// Spelarens vanliga plats räknas ur hans starter i lagets senaste matcher.
const HOME_MATCHES = 10;
// Kön efter elvan: starter (1) och inhopp (0,5) i de senaste matcherna,
// med fallande vikt bakåt; matcher i en annan sorts tävling väger hälften.
const QUEUE_MATCHES = 10;
const DECAY = 0.7;
const POOL_MAX = 22;
// Cupen: roterar divisionen (färre än KEEP_MIN ur ligaelvan startar) och
// minsta antal cupmatcher att gå på.
const KEEP_MIN = 6;
const MIN_CUP = 5;

const POS_GROUP = { MV: 'G', B: 'D', MF: 'M', A: 'F' };
const GROUP_LINE = { G: 0, D: 25, M: 55, F: 100 };
const LEAGUES = COMPETITIONS.filter((c) => c.type === 'league');
const KIND = Object.fromEntries(COMPETITIONS.map((c) => [c.id, c.type === 'cup' ? 'C' : 'L']));
const lineupCacheId = (c) => (c.type === 'cup' ? `espn_elvor_${c.id}` : `espn_minutes_${c.id}`);

// ---------- planen för en match ----------

// history: lagets matcher i tidsordning [{ id, t, kind: 'L'|'C', f:
// formation, s: [spelar-id per plats 1–11], b: [avbytare], on: [inbytta] }].
// target = { t, kind }. squadPos = spelar-id → position i truppen (MV, B,
// MF, A), för den som inte startat. rotation = { xi, gk } – roterar
// divisionen utespelarna och målvakten i cupen (bara cupmatcher).
// Svarar { f, slots, pool, from } eller null utan en ligamatch att gå på.
function planFor(history, target, { squadPos = null, rotation = null } = {}) {
  const before = history.filter((h) => h.t < target.t);
  const leagues = before.filter((h) => h.kind === 'L');
  if (!leagues.length) return null;
  const lastL = leagues[leagues.length - 1];
  const sp = Elva.spots(lastL.f);
  if (!sp) return null;
  const slots = lastL.s.map((_, i) => sp[i + 1]);
  const home = homes(before.slice(-HOME_MATCHES));

  const score = new Map();
  const recent = before.slice(-QUEUE_MATCHES);
  let w = 1;
  for (let k = recent.length - 1; k >= 0; k--) {
    const h = recent[k];
    const kw = h.kind === target.kind ? 1 : 0.5;
    for (const p of h.s) score.set(p, (score.get(p) || 0) + w * kw);
    for (const p of h.on) score.set(p, (score.get(p) || 0) + w * kw * 0.5);
    for (const p of h.b) if (!score.has(p)) score.set(p, 0);
    w *= DECAY;
  }
  const order = [];
  const add = (ids) => { for (const p of ids) if (!order.includes(p)) order.push(p); };
  if (target.kind === 'C') {
    const rot = rotation || { xi: false, gk: false };
    if (!rot.gk) add(lastL.s.slice(0, 1));
    if (!rot.xi) add(lastL.s.slice(1));
    add(lastL.b);
  }
  add(lastL.s);
  add([...score.keys()].sort((a, b) => score.get(b) - score.get(a)));

  const pool = order.map((id) => {
    const hm = home.get(id);
    const g = hm ? hm.g : POS_GROUP[squadPos && squadPos.get(id)] || null;
    return { id, g, l: hm ? hm.l : g ? GROUP_LINE[g] : null, s: hm ? hm.s : 50, p: lastL.s.indexOf(id) };
  }).filter((pl) => pl.g);
  return { f: lastL.f, slots, pool, from: lastL.id };
}

// Var spelaren brukar spela: snittet av hans platser (linje och sida) och
// den del av laget han oftast startat i – den senaste vid lika.
function homes(matches) {
  const acc = new Map();
  for (const h of matches) {
    const sp = Elva.spots(h.f);
    if (!sp) continue;
    h.s.forEach((id, i) => {
      const x = sp[i + 1];
      if (!acc.has(id)) acc.set(id, { n: 0, l: 0, s: 0, g: {}, last: null });
      const a = acc.get(id);
      a.n++;
      a.l += x.l;
      a.s += x.s;
      a.g[x.g] = (a.g[x.g] || 0) + 1;
      a.last = x.g;
    });
  }
  const out = new Map();
  for (const [id, a] of acc) {
    const top = Math.max(...Object.values(a.g));
    const gs = Object.keys(a.g).filter((g) => a.g[g] === top);
    out.set(id, { l: a.l / a.n, s: a.s / a.n, g: gs.includes(a.last) ? a.last : gs[0] });
  }
  return out;
}

// ---------- säsongens elvor ----------

let memo = null;

// Spelprogrammen och elvorna ur källcachen, en gång per ändring i den.
function season() {
  const ids = COMPETITIONS.flatMap((c) => [`espn_fixtures_${c.id}`, lineupCacheId(c)])
    .concat(LEAGUES.flatMap((c) => [`espn_players_${c.id}`, `s365_squads_${c.id}`]), ['fpl']);
  const sig = ids.map((id) => {
    try { return fs.statSync(path.join(CACHE_DIR, `${id}.json`)).mtimeMs; } catch { return 0; }
  }).join(',');
  if (!memo || memo.sig !== sig) memo = { sig, data: load(), fit: null };
  return memo;
}

function load() {
  const fixtures = new Map();
  const teams = new Map();
  const tier = new Map();
  const names = new Map();
  let lineupsAt = null;
  for (const c of COMPETITIONS) {
    const fx = readCache(`espn_fixtures_${c.id}`);
    const lu = readCache(lineupCacheId(c));
    const reports = (lu && lu.data && lu.data.matches) || {};
    if (lu && lu.fetchedAt && (!lineupsAt || lu.fetchedAt > lineupsAt)) lineupsAt = lu.fetchedAt;
    for (const m of (fx && fx.data && fx.data.matches) || []) {
      const h = m.home.espnId;
      const a = m.away.espnId;
      names.set(h, m.home.name);
      names.set(a, m.away.name);
      if (c.type === 'league') { tier.set(h, c.id); tier.set(a, c.id); }
      fixtures.set(m.id, { id: m.id, comp: c.id, kind: KIND[c.id], t: Date.parse(m.kickoff), completed: m.completed, home: h, away: a });
      const r = reports[m.id];
      if (!m.completed || !r || !r.e) continue;
      for (const [tid, opp] of [[h, a], [a, h]]) {
        const x = r.e[tid];
        if (!x) continue;
        const played = Object.keys((r.t && r.t[tid]) || {});
        if (!teams.has(tid)) teams.set(tid, []);
        teams.get(tid).push({ id: m.id, comp: c.id, kind: KIND[c.id], t: Date.parse(m.kickoff), opp, f: x.f, s: x.s, b: x.b, on: played.filter((p) => !x.s.includes(p)) });
      }
    }
  }
  for (const list of teams.values()) list.sort((x, y) => x.t - y.t);
  return { fixtures, teams, tier, names, lineupsAt, squads: squads() };
}

// Trupperna (ESPN) per lag: namn, tröja och position, 365Scores id (för att
// stryka dem 365Scores säger saknas) och FPL:s status i Premier League.
function squads() {
  const { linkIndexes } = require('./players');
  const out = new Map();
  for (const c of LEAGUES) {
    const ep = readCache(`espn_players_${c.id}`);
    if (!ep || !ep.data) continue;
    const { aids, fpl } = linkIndexes(c.id, ep.data.teams);
    for (const t of ep.data.teams) {
      out.set(String(t.espnId), new Map(t.players.map((p) => [String(p.id), {
        name: p.name, nr: p.jersey || null, pos: p.pos, aid: aids.get(p.id) || null, fpl: fpl.get(p.id) || null,
      }])));
    }
  }
  return out;
}

// Hur lagen i divisionen gjort i säsongens cupmatcher före t: hur många ur
// ligaelvan före matchen som startade, och om ligans målvakt stod kvar.
function rotationIn(D, division, t) {
  const tally = (test) => {
    let n = 0;
    let kept = 0;
    let gk = 0;
    for (const [tid, list] of D.teams) {
      if (!test(tid)) continue;
      let lastL = null;
      for (const h of list) {
        if (h.t >= t) break;
        if (h.kind === 'L') { lastL = h; continue; }
        if (!lastL) continue;
        n++;
        kept += h.s.filter((p) => lastL.s.includes(p)).length;
        if (h.s[0] === lastL.s[0]) gk++;
      }
    }
    return { n, kept: n ? kept / n : null, gk: n ? gk / n : null };
  };
  let r = tally((tid) => D.tier.get(tid) === division);
  let all = false;
  if (r.n < MIN_CUP) { r = tally((tid) => D.tier.has(tid)); all = true; }
  // Inga cupmatcher än (första omgångarna i augusti): lagen roterar. Så var
  // det 2026/27 i alla fyra divisionerna – bänken först gav 7,3 rätt i
  // Premier League och Championship, ligaelvan 1,3 och 2,9.
  if (r.n < MIN_CUP) return { xi: true, gk: true, n: r.n, all };
  return { xi: r.kept < KEEP_MIN, gk: r.gk <= 0.5, n: r.n, kept: Math.round(r.kept * 10) / 10, all };
}

// Positionen i truppen per spelar-id, för den som inte startat.
function squadPositions(D, tid) {
  const sq = D.squads.get(tid);
  return sq ? new Map([...sq].map(([id, p]) => [id, p.pos])) : null;
}

// ---------- mätningen ----------

// Varje lag och liga- eller cupmatch i säsongen med bara matcherna före:
// hur många av de elva som startade fanns i den beräknade elvan. Utan
// skadelistorna (de finns inte bakåt), så siffran är snarare för låg.
function measure() {
  const S = season();
  if (S.fit) return S.fit;
  const D = S.data;
  const fit = { L: { n: 0, hit: 0 }, C: { n: 0, hit: 0 } };
  for (const [tid, list] of D.teams) {
    if (!D.tier.has(tid)) continue;
    const pos = squadPositions(D, tid);
    for (let i = 1; i < list.length; i++) {
      const T = list[i];
      const rotation = T.kind === 'C' ? rotationIn(D, D.tier.get(tid), T.t) : null;
      const plan = planFor(list.slice(0, i), T, { squadPos: pos, rotation });
      const xi = plan && Elva.fill(plan, null);
      if (!xi) continue;
      fit[T.kind].n++;
      fit[T.kind].hit += xi.filter((x) => T.s.includes(x.player.id)).length;
    }
  }
  const out = {};
  for (const k of ['L', 'C']) out[k] = fit[k].n ? { n: fit[k].n, hit: Math.round((fit[k].hit / fit[k].n) * 10) / 10 } : null;
  S.fit = out;
  return out;
}

// ---------- matchbladet ----------

// Planen för båda lagen i en kommande match inom WINDOW_DAYS, som
// matchrutan läser (data/match/<id>.json, fältet elva). null = ingen.
//   home/away: { f, k, slots: [[l, s, g]], pool: [{ i, n, k, nr, g, l, s, p,
//              a, x }], from: { id, t, opp, comp }, rot } eller null
//   fit:       mätningen { L, C: { n, hit } }
function elvaFor(matchId, now = Date.now()) {
  const S = season();
  const D = S.data;
  const m = D.fixtures.get(String(matchId));
  if (!m || m.completed || m.t < now - 3 * 3600000 || m.t > now + WINDOW_DAYS * DAY) return null;
  const side = (tid) => {
    const list = D.teams.get(tid);
    const sq = D.squads.get(tid);
    if (!list || !sq || !D.tier.has(tid)) return null;
    const rotation = m.kind === 'C' ? rotationIn(D, D.tier.get(tid), m.t) : null;
    const plan = planFor(list, { t: m.t, kind: m.kind }, { squadPos: squadPositions(D, tid), rotation });
    if (!plan) return null;
    // Bara den som är kvar i truppen; den som FPL säger lämnat är borta.
    const pool = plan.pool.filter((pl) => sq.has(pl.id) && !(sq.get(pl.id).fpl && sq.get(pl.id).fpl.st === 'u'))
      .slice(0, POOL_MAX);
    if (!Elva.fill({ slots: plan.slots, pool }, null)) return null;
    const from = list.find((h) => h.id === plan.from);
    return {
      f: plan.f,
      k: m.kind,
      slots: plan.slots.map((x) => [x.l, x.s, x.g]),
      pool: pool.map((pl) => {
        const p = sq.get(pl.id);
        return {
          i: pl.id, n: p.name, k: shortName(p.name), nr: p.nr, g: pl.g, l: Math.round(pl.l), s: Math.round(pl.s), p: pl.p,
          a: p.aid, x: p.fpl ? FPL_STATUS[p.fpl.st] || null : null,
        };
      }),
      from: { id: from.id, t: new Date(from.t).toISOString(), opp: D.names.get(from.opp) || null, comp: from.comp },
      rot: rotation,
    };
  };
  const home = side(m.home);
  const away = side(m.away);
  if (!home && !away) return null;
  return { home, away, fit: measure(), at: D.lineupsAt };
}

const FPL_STATUS = { i: 'skadad', s: 'avstängd', n: 'ej uttagbar', d: 'tveksam' };

// Namnet på planen: efternamnet, med "van", "de", "Mac" och liknande som
// hör till ("Micky van de Ven" → "van de Ven", "Jan Paul van Hecke" → "van
// Hecke", "Kevin De Bruyne" → "De Bruyne"). Ett ensamt namn som det är.
const PARTICLES = new Set(['van', 'von', 'de', 'der', 'den', 'da', 'das', 'do', 'dos', 'di', 'del', 'della', 'du', 'le', 'la', 'ter', 'ten', 'mac', 'al', 'el', 'bin', 'ben']);
function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] || '';
  const i = parts.findIndex((w, j) => j > 0 && j < parts.length - 1 && PARTICLES.has(w.toLowerCase()));
  return parts.slice(i > 0 ? i : parts.length - 1).join(' ');
}

module.exports = { planFor, homes, rotationIn, measure, elvaFor, season, shortName, WINDOW_DAYS };
