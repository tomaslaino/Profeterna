'use strict';

// Prognosmotorn (fas 2): grundmodellen Dixon–Coles och de tre baslinjerna,
// för varje match i de sex tävlingarna. Reglerna ligger i
// config/forecast-rules.js, matematiken i src/model.js och underlaget i
// src/modeldata.js.
//
// Punkt-i-tiden: prognosen för en match skattas bara på matcher spelade
// FÖRE matchdagen. Kommande matcher får alltså dagens skattning, och
// spelade matcher i år en återskapad prognos med det underlag som fanns före
// avspark – samma regler, men räknad i efterhand (journalen i fas 3 sparar
// prognosen innan matchen spelas). Kontrollen mot förra säsongen
// (src/check.js) kör exakt samma kod.

const rules = require('../config/forecast-rules');
const { SEASON, HISTORY, fdSeasonCode, competition } = require('../config/competitions');
const M = require('./model');
const { seasonData, neutralOf, LOWER, startYear } = require('./modeldata');
const { load } = require('./matches');
const { strengthTable } = require('./strength');

const DAY = 86400000;
const dayNum = (iso) => Math.floor(Date.parse(iso + 'T00:00:00Z') / DAY);
const isoOf = (n) => new Date(n * DAY).toISOString().slice(0, 10);
const LEAGUE_TIERS = new Set([1, 2, 3, 4]);
const TIER_NAME = { 1: 'Premier League', 2: 'Championship', 3: 'League One', 4: 'League Two', 5: 'National League' };

// ---------- kontext för en målsäsong ----------

function context(target) {
  const data = seasonData(target);
  const minSeason = fdSeasonCode(startYear(target) - rules.model.historySeasons);
  const games = data.games.map((g) => ({ ...g, day: dayNum(g.date), lower: g.h === LOWER || g.a === LOWER }));
  games.sort((a, b) => a.day - b.day);
  const tier = data.tiers.get(target) || new Map();

  // Lagens matcher i fönstret (för "underlag sedan …" och "i år").
  const teamDays = new Map();
  for (const g of games) {
    if (g.season < minSeason && !g.lower) continue;
    for (const k of [g.h, g.a]) {
      if (!teamDays.has(k)) teamDays.set(k, { all: [], season: [] });
      const t = teamDays.get(k);
      t.all.push(g.day);
      if (g.season === target) t.season.push(g.day);
    }
  }
  return { target, minSeason, games, tier, teamDays, naive: naiveTable(games, target), fetchedAt: data.fetchedAt, fits: new Map(), seasonFits: new Map() };
}

function tierOf(ctx, k) {
  return k === LOWER ? 6 : ctx.tier.get(k) || null;
}

// ---------- grundmodellen: skattning per dag ----------

// Skattning på alla matcher före dag `day` (cachad per dag, varmstart från
// närmast föregående skattning).
function fitAt(ctx, day) {
  if (ctx.fits.has(day)) return ctx.fits.get(day);
  const games = modelGames(ctx, day);
  let init = null;
  for (const [d, f] of ctx.fits) if (d < day && (!init || d > init.day)) init = f;
  const fit = M.fitPoisson(games, { init, tolerance: rules.model.tolerance, maxIterations: rules.model.maxIterations });
  // ρ skattas alltid på de faktiska målen (korrektionen gäller 0–0, 1–0,
  // 0–1 och 1–1), även när anfall och försvar skattas på skott eller xG.
  const real = games.some((g) => g.rg != null) ? games.map((g) => (g.rg != null ? { ...g, hg: g.rg, ag: g.ra } : g)) : games;
  const { rho } = M.fitRho(real, fit);
  fit.rho = rho;
  fit.day = day;
  fit.games = games;
  fit.n = games.length;
  fit.through = games.length ? isoOf(games[games.length - 1].day) : null;
  fit.divisions = divisionMeans(ctx, fit);
  ctx.fits.set(day, fit);
  return fit;
}

function modelGames(ctx, day) {
  const out = [];
  const m = rules.model;
  const half = m.halfLifeDays;
  const perDivision = m.homeAdvantage === 'perDivision';
  const inWindow = (g) => g.season >= ctx.minSeason || g.lower;
  // Kandidat (skott på mål): andelen mål per skott på mål i fönstret före dagen.
  let conv = null;
  if (m.shotsBlend > 0) {
    let goals = 0;
    let shots = 0;
    for (const g of ctx.games) {
      if (g.day >= day) break;
      if (g.sot && inWindow(g)) { goals += g.hg + g.ag; shots += g.sot[0] + g.sot[1]; }
    }
    conv = shots > 0 ? goals / shots : null;
  }
  for (const g of ctx.games) {
    if (g.day >= day) break;
    const cup = g.comp === 'fac' || g.comp === 'lc';
    if (!m.includeCups && cup) continue;
    if (!inWindow(g)) continue;
    let w = g.lower && !rules.lowerTier.decay ? 1 : Math.pow(0.5, (day - g.day) / half);
    if (cup && m.cupWeight !== 1) w *= m.cupWeight;
    const x = { h: g.h, a: g.a, hg: g.hg, ag: g.ag, neutral: g.neutral, w, day: g.day };
    if (perDivision) x.hgroup = homeGroup(g.comp);
    // Kandidater: anfall och försvar skattas på en blandning av mål och xG
    // eller skott på mål omräknade till mål (rg/ra = de faktiska målen).
    if (m.xgBlend > 0 && g.xg) blend(x, g.xg, 1, m.xgBlend);
    else if (conv && g.sot) blend(x, g.sot, conv, m.shotsBlend);
    out.push(x);
  }
  return out;
}

function blend(x, v, scale, share) {
  x.rg = x.hg;
  x.ra = x.ag;
  x.hg = (1 - share) * x.hg + share * scale * v[0];
  x.ag = (1 - share) * x.ag + share * scale * v[1];
}

// Hemmafördelens grupp för en tävling (bara med homeAdvantage 'perDivision').
function homeGroup(comp) {
  if (rules.model.homeAdvantage !== 'perDivision') return undefined;
  return comp === 'fac' || comp === 'lc' ? 'cup' : comp;
}

function homeFactor(fit, group) {
  return fit.Hg && group != null && fit.Hg.has(group) ? fit.Hg.get(group) : fit.H;
}

// Genomsnittligt anfall/försvar (log-skala) per nivå bland lagen som spelar
// där i målsäsongen – utgångsläget i nedbrytningen "vad drog åt vilket håll".
function divisionMeans(ctx, fit) {
  const acc = new Map();
  for (const [k, t] of ctx.tier) {
    const info = fit.teams.get(k);
    if (!info || info.degenerate) continue;
    if (!acc.has(t)) acc.set(t, { a: 0, b: 0, n: 0 });
    const x = acc.get(t);
    x.a += Math.log(fit.A.get(k));
    x.b += Math.log(fit.B.get(k));
    x.n++;
  }
  if (fit.teams.has(LOWER) && !fit.teams.get(LOWER).degenerate) {
    acc.set(6, { a: Math.log(fit.A.get(LOWER)), b: Math.log(fit.B.get(LOWER)), n: 1 });
  }
  const out = new Map();
  for (const [t, x] of acc) out.set(t, { a: x.a / x.n, b: x.b / x.n, n: x.n });
  return out;
}

// Är lagets styrka skattad? null = ja, annars orsaken.
function teamUnknown(ctx, fit, k, name) {
  const t = fit.teams.get(k);
  if (k === LOWER) {
    return t && t.weight >= rules.model.minEffectiveMatches ? null
      : `${name}: spelar under National League, och det finns för få sådana matcher i underlaget för att skatta nivån.`;
  }
  if (!t) return `${name}: inga matcher i underlaget före avspark – styrkan är okänd.`;
  if (t.degenerate) return `${name}: inga gjorda eller insläppta mål i underlaget – styrkan går inte att skatta.`;
  if (t.weight < rules.model.minEffectiveMatches) return `${name}: för få matcher i underlaget före avspark för att skatta styrkan.`;
  return null;
}

// ---------- faktorer ovanpå skattningen (fas 4) ----------

// Faktorer som klarat kandidatjakten och blivit en regelversion
// (config/forecast-rules.js, factors). Varje faktor ger en signal z
// (hemmalaget − bortalaget, punkt-i-tiden: bara matcher före prognosdagen)
// som flyttar de förväntade målen med vikten β (M.factorAdjust). Okänd
// signal = 0, då ändras ingenting.

const TABLE_LEAGUES = new Set(['pl', 'ch', 'l1', 'l2', 'nl']);

// Tabelläget: poäng per match i årets liga, räknat ur resultaten (mål efter
// 90 minuter, utan poängavdrag). Index per säsong, liga och lag med dagarna
// och de ackumulerade poängen. games ska vara sorterade på dag. Samma
// funktion används av kandidatjakten (src/candidates.js).
function tableIndex(games) {
  const idx = new Map();
  const add = (k, day, pts) => {
    if (!idx.has(k)) idx.set(k, { days: [], cum: [] });
    const e = idx.get(k);
    e.days.push(day);
    e.cum.push((e.cum.length ? e.cum[e.cum.length - 1] : 0) + pts);
  };
  for (const g of games) {
    if (!TABLE_LEAGUES.has(g.comp)) continue;
    add(`${g.season}|${g.comp}|${g.h}`, g.day, g.hg > g.ag ? 3 : g.hg === g.ag ? 1 : 0);
    add(`${g.season}|${g.comp}|${g.a}`, g.day, g.hg < g.ag ? 3 : g.hg === g.ag ? 1 : 0);
  }
  return idx;
}

function tablePpg(idx, season, comp, team, day, min) {
  const e = idx.get(`${season}|${comp}|${team}`);
  if (!e) return null;
  let lo = 0;
  let hi = e.days.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (e.days[mid] < day) lo = mid + 1; else hi = mid; }
  return lo >= min ? { ppg: e.cum[lo - 1] / lo, n: lo } : null;
}

// z = poäng per match i år, hemmalaget − bortalaget; null om det inte är en
// ligamatch eller något av lagen spelat färre än `min` ligamatcher i år.
function tableSignal(idx, season, comp, hk, ak, day, min) {
  if (!TABLE_LEAGUES.has(comp)) return null;
  const h = tablePpg(idx, season, comp, hk, day, min);
  const a = tablePpg(idx, season, comp, ak, day, min);
  return h && a ? { z: h.ppg - a.ppg, home: h, away: a } : null;
}

function factorSignals(ctx, spec) {
  const out = { ids: [], z: [], beta: [], info: {} };
  for (const [id, cfg] of Object.entries(rules.factors || {})) {
    let sig = null;
    if (id === 'table') {
      if (!ctx.table) ctx.table = tableIndex(ctx.games);
      sig = tableSignal(ctx.table, ctx.target, spec.comp, spec.hk, spec.ak, spec.fitDay, cfg.minMatches);
    }
    out.ids.push(id);
    out.z.push(sig ? sig.z : 0);
    out.beta.push(cfg.beta);
    out.info[id] = sig;
  }
  return out;
}

// ---------- baslinje (a): naiv ----------

function naiveTable(games, target) {
  const bySeason = new Map(); // säsong → nivå → [H, D, A]
  for (const g of games) {
    if (g.season >= target || !['pl', 'ch', 'l1', 'l2'].includes(g.comp)) continue;
    const t = competition(g.comp).tier;
    if (!bySeason.has(g.season)) bySeason.set(g.season, new Map());
    const s = bySeason.get(g.season);
    if (!s.has(t)) s.set(t, [0, 0, 0]);
    s.get(t)[g.hg > g.ag ? 0 : g.hg === g.ag ? 1 : 2]++;
  }
  const seasons = [...bySeason.keys()].sort().slice(-rules.baselines.naive.seasons);
  return { bySeason, seasons };
}

function naive(ctx, comp) {
  const { bySeason, seasons } = ctx.naive;
  if (!seasons.length) return { p: null, reason: 'ingen historik i cachen' };
  const c = competition(comp);
  const tiers = c.type === 'league' ? [c.tier] : [...LEAGUE_TIERS];
  const n = [0, 0, 0];
  for (const s of seasons) for (const t of tiers) {
    const x = bySeason.get(s).get(t);
    if (x) for (let i = 0; i < 3; i++) n[i] += x[i];
  }
  const total = n[0] + n[1] + n[2];
  return {
    p: n.map((x) => x / total),
    n: total,
    seasons: [label(seasons[0]), label(seasons[seasons.length - 1])],
    scope: c.type === 'league' ? c.name : 'alla ligamatcher nivå 1–4',
    source: 'football-data.co.uk',
  };
}

function label(code) {
  return `${startYear(code)}/${code.slice(2)}`;
}

// ---------- baslinje (b): Poisson på säsongens mål ----------

// Under så här få förväntade mål i en match har lagens skala glidit iväg. I
// backtestet (fyra säsonger, dag för dag) låg vanliga skattningar över 0,01
// och de som gled iväg mellan 1e-20 och 0,001.
const MIN_SEASON_GOALS = 0.001;

function seasonFitAt(ctx, day) {
  if (ctx.seasonFits.has(day)) return ctx.seasonFits.get(day);
  const games = [];
  const count = new Map();
  for (const g of ctx.games) {
    if (g.day >= day) break;
    if (g.season !== ctx.target || g.lower) continue;
    games.push({ h: g.h, a: g.a, hg: g.hg, ag: g.ag, neutral: g.neutral, w: 1 });
    count.set(g.h, (count.get(g.h) || 0) + 1);
    count.set(g.a, (count.get(g.a) || 0) + 1);
  }
  let prev = null;
  for (const [d, f] of ctx.seasonFits) if (d < day && f.fit && (!prev || d > prev.day)) prev = f;
  const init = prev ? prev.fit : null;
  const fit = games.length ? M.fitPoisson(games, { init, tolerance: rules.model.tolerance, maxIterations: rules.model.maxIterations }) : null;
  // Tidigt på säsongen kan skattningen sakna ändligt maximum för några lag
  // (t.ex. när de inte gjort mål mot varandra): deras skala glider iväg och
  // de skattade målen i deras matcher går mot noll. Sådana lag markeras.
  const unstable = new Set();
  if (fit) {
    for (const x of games) {
      if (fit.teams.get(x.h).degenerate || fit.teams.get(x.a).degenerate) continue;
      if (Math.min(...M.expectedGoals(fit, x.h, x.a, x.neutral)) < MIN_SEASON_GOALS) { unstable.add(x.h); unstable.add(x.a); }
    }
  }
  const res = { fit, count, find: M.components(games), unstable, day };
  ctx.seasonFits.set(day, res);
  return res;
}

function seasonBaseline(ctx, day, hk, ak, neutral) {
  const s = seasonFitAt(ctx, day);
  const min = rules.baselines.season.minMatches;
  if (hk === LOWER || ak === LOWER) return { p: null, reason: 'lag under National League har ingen lagdata' };
  if (!s.fit) return { p: null, reason: 'inga matcher spelade i år' };
  const nh = s.count.get(hk) || 0;
  const na = s.count.get(ak) || 0;
  if (nh < min || na < min) return { p: null, reason: `kräver minst ${min} matcher i år per lag (${nh} resp. ${na})` };
  if (s.fit.teams.get(hk).degenerate || s.fit.teams.get(ak).degenerate) return { p: null, reason: 'ett av lagen har inte gjort eller släppt in mål i år' };
  if (s.find(hk) !== s.find(ak)) return { p: null, reason: 'lagen har inga gemensamma motståndare i år än' };
  // Skattningen saknar ändligt maximum för ett av lagen (se seasonFitAt) –
  // hittat i backtestet (fas 4): augusti–september 2022 gav (b) 100 %
  // oavgjort i elva matcher och ogiltiga sannolikheter i tolv. Då är (b)
  // okänd, den gissas inte.
  const unstable = { p: null, reason: 'årets matcher räcker inte för en ändlig skattning än' };
  if (s.unstable.has(hk) || s.unstable.has(ak)) return unstable;
  const [lh, la] = M.expectedGoals(s.fit, hk, ak, neutral);
  const ok = (x) => x >= MIN_SEASON_GOALS && x <= rules.model.maxGoals;
  const out = ok(lh) && ok(la) ? M.outcomes(M.scoreMatrix(lh, la, 0, rules.model.maxGoals)) : null;
  if (!out || !out.x12.every(Number.isFinite)) return unstable;
  return { p: out.x12, goals: [lh, la], matches: [nh, na] };
}

// ---------- baslinje (c): marknaden ----------

function marketFrom(odds, extra) {
  const r = M.shin(odds);
  return r ? { p: r.p, odds, method: r.method, overround: r.overround, ...extra } : null;
}

function fdTriple(row, prefix) {
  const t = [row[`${prefix}H`], row[`${prefix}D`], row[`${prefix}A`]];
  return t.every((x) => x > 1) ? t : null;
}

function fdTotal(row, c) {
  const o = row[`Avg${c}>2.5`];
  const u = row[`Avg${c}<2.5`];
  const r = o > 1 && u > 1 ? M.shin([o, u]) : null;
  return r ? r.p[0] : null;
}

// ---------- cuper: att gå vidare ----------

function cupRule(comp, round) {
  const r = rules.cups[comp];
  if (!r) return null;
  const twoLeg = r.twoLegRounds.includes(round);
  const et = r.afterDraw === 'extra_time' || (r.extraTimeRounds || []).includes(round);
  return {
    twoLeg,
    extraTime: et,
    text: twoLeg ? 'Två möten – sammanlagt resultat, sedan förlängning och straffar efter returen'
      : et ? 'Oavgjort efter 90 minuter → förlängning och straffar' : 'Oavgjort efter 90 minuter → straffar direkt',
  };
}

// Sannolikheten att laget som har hemmaplan i returen/matchen vinner efter
// oavgjort (förlängning och/eller straffar).
function afterDraw(rule, lh, la) {
  const pen = rules.cups.penaltyHomeShare;
  if (!rule.extraTime) return pen;
  const et = M.extraTime(lh, la, rules.cups.extraTimeShare, rules.model.maxGoals);
  return et.homeWin + et.draw * pen;
}

// Fördelningen av målskillnaden (hemma − borta) ur en resultatmatris.
function diffDist(m) {
  const G = m.length - 1;
  const d = new Float64Array(2 * G + 1);
  for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) d[i - j + G] += m[i][j];
  return d;
}

// ---------- prognos för en match ----------

// spec: { id, comp, round, day, hk, ak, home, away, neutral, completed,
//         market, closing, legs } – se currentSpecs() och src/check.js.
function predict(ctx, spec, specsById) {
  const c = competition(spec.comp);
  const fit = fitAt(ctx, spec.fitDay);
  const notes = [];
  const out = {
    rulesVersion: rules.version,
    fitThrough: fit.through,
    retro: !!spec.completed,
    status: 'ok',
  };

  const unknown = [teamUnknown(ctx, fit, spec.hk, spec.home), teamUnknown(ctx, fit, spec.ak, spec.away)].filter(Boolean);
  if (!fit.n) unknown.push('Inget underlag i cachen.');

  out.teams = { home: teamBasis(ctx, fit, spec.hk, spec.home, spec.fitDay), away: teamBasis(ctx, fit, spec.ak, spec.away, spec.fitDay) };
  out.baselines = {
    naive: naive(ctx, spec.comp),
    season: seasonBaseline(ctx, spec.fitDay, spec.hk, spec.ak, spec.neutral),
    market: spec.market || null,
    closing: spec.closing || null,
  };

  if (unknown.length) {
    out.status = 'okänt';
    out.reasons = unknown;
    return out;
  }

  const [lh0, la0] = M.expectedGoals(fit, spec.hk, spec.ak, spec.neutral, homeGroup(spec.comp));
  const sig = factorSignals(ctx, spec);
  const [lh, la] = M.factorAdjust(lh0, la0, sig.z, sig.beta);
  const m = M.scoreMatrix(lh, la, fit.rho, rules.model.maxGoals);
  const o = M.outcomes(m);
  out.p = o.x12;
  out.goals = [lh, la];
  if (sig.ids.length) {
    // Förväntade mål före faktorerna och signalerna – backtestet skattar
    // vikterna om säsong för säsong ur dem (walk-forward).
    out.factors = { goalsBefore: [lh0, la0], ids: sig.ids, z: sig.z, beta: sig.beta, table: sig.info.table || null };
  }
  out.over25 = o.over25;
  out.btts = o.btts;
  out.scores = topScores(m);
  out.steps = steps(ctx, fit, spec, sig);
  if (spec.hk === LOWER || spec.ak === LOWER) {
    notes.push(`Lag under National League saknar egen lagdata. Deras styrka är genomsnittet för alla lag under National League i FA-cupen sedan ${label(fdSeasonCode(HISTORY.espnFaCup.first))} – historiskt utfall för nivån, inte laget självt.`);
  }

  if (c.type === 'cup') out.advance = advance(ctx, fit, spec, m, specsById);
  out.notes = notes;
  return out;
}

function teamBasis(ctx, fit, k, name, day) {
  const t = tierOf(ctx, k);
  const td = ctx.teamDays.get(k);
  const before = (arr) => {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < day) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const n = td ? before(td.all) : 0;
  return {
    name,
    tier: t,
    division: t === 6 ? 'under National League' : TIER_NAME[t] || null,
    basis: k === LOWER ? 'nivå' : 'eget',
    matches: n,
    seasonMatches: td ? before(td.season) : 0,
    since: n ? isoOf(td.all[0]) : null,
  };
}

function topScores(m) {
  const list = [];
  for (let i = 0; i < m.length; i++) for (let j = 0; j < m[i].length; j++) list.push([i, j, m[i][j]]);
  list.sort((a, b) => b[2] - a[2]);
  // Matris 0–4 mål per lag för visning; resten summeras.
  const grid = [];
  let shown = 0;
  for (let i = 0; i <= 4; i++) {
    const row = [];
    for (let j = 0; j <= 4; j++) { row.push(round4(m[i][j])); shown += m[i][j]; }
    grid.push(row);
  }
  return { grid, other: round4(1 - shown), top: list.slice(0, 3).map(([i, j, p]) => ({ home: i, away: j, p: round4(p) })) };
}

// "Vad drog åt vilket håll": prognosen byggs upp steg för steg på log-skala,
// där varje steg lägger till en del av modellen. Sista steget är exakt
// modellens prognos. Ordningen är fast (start → hemmaplan → nivåskillnad →
// hemmalaget → bortalaget), och ett stegs effekt beror något på ordningen.
function steps(ctx, fit, spec, sig) {
  const th = tierOf(ctx, spec.hk);
  const ta = tierOf(ctx, spec.ak);
  const dh = fit.divisions.get(th);
  const da = fit.divisions.get(ta);
  if (!dh || !da) return null;
  const rows = [];
  let lh = Math.exp(dh.a + dh.b);
  let la = lh;
  const push = (label, sub) => {
    const o = M.outcomes(M.scoreMatrix(lh, la, fit.rho, rules.model.maxGoals));
    rows.push({ label, sub: sub || null, p: o.x12.map(round4), goals: [round2(lh), round2(la)] });
  };
  const divName = th === 6 ? 'lag under National League' : `lag i ${TIER_NAME[th]}`;
  push(`Två genomsnittliga ${divName}, neutral plan`);
  if (!spec.neutral) {
    lh *= homeFactor(fit, homeGroup(spec.comp));
    push('Hemmaplan', `${spec.home} spelar hemma`);
  }
  if (th !== ta) {
    lh *= Math.exp(da.b - dh.b);
    la *= Math.exp(da.a - dh.a);
    push('Nivåskillnad', `${spec.away}: ${ta === 6 ? 'under National League' : TIER_NAME[ta]}`);
  }
  const own = (k, name, d, isHome) => {
    const a = Math.log(fit.A.get(k)) - d.a;
    const b = Math.log(fit.B.get(k)) - d.b;
    if (isHome) { lh *= Math.exp(a); la *= Math.exp(b); } else { la *= Math.exp(a); lh *= Math.exp(b); }
    push(name, k === LOWER ? 'genomsnittet för nivån – ingen egen lagdata' : `gör ${relative(a)} mål, släpper in ${relative(b)} – mot nivåns snitt`);
  };
  own(spec.hk, spec.home, dh, true);
  own(spec.ak, spec.away, da, false);
  const t = sig && sig.info.table;
  if (t && t.z) {
    [lh, la] = M.factorAdjust(lh, la, sig.z, sig.beta);
    const ppg = (x) => x.ppg.toFixed(1).replace('.', ',');
    push('Tabelläget', `${ppg(t.home)} mot ${ppg(t.away)} poäng per match i år`);
  }
  return rows;
}

// exp(x) som procent fler/färre mål än snittet, avrundat till 5 %.
function relative(x) {
  const pct = Math.round((Math.exp(x) - 1) * 20) * 5;
  return pct === 0 ? 'lika många' : pct > 0 ? `${pct} % fler` : `${-pct} % färre`;
}

function advance(ctx, fit, spec, m, specsById) {
  const rule = cupRule(spec.comp, spec.round);
  if (!rule) return null;
  const grp = homeGroup(spec.comp);
  const sig = factorSignals(ctx, spec);
  const [lh, la] = M.factorAdjust(...M.expectedGoals(fit, spec.hk, spec.ak, spec.neutral, grp), sig.z, sig.beta);
  if (!rule.twoLeg) {
    const q = afterDraw(rule, lh, la);
    const [p1, px] = M.outcomes(m).x12;
    const home = p1 + px * q;
    return { home: round4(home), away: round4(1 - home), rule: rule.text };
  }
  // Två möten. Laget X har hemmaplan i första mötet, Y i returen.
  const other = spec.legs && specsById.get(spec.legs.other);
  if (!other) return { home: null, away: null, rule: rule.text, reason: 'det andra mötet saknas i spelprogrammet' };
  const first = spec.legs.leg === 1 ? spec : other;
  const X = first.hk;
  const Y = first.ak;
  const [ly, lx] = M.expectedGoals(fit, Y, X, false, grp); // returen: Y hemma
  const q = 1 - afterDraw(rule, ly, lx); // X vinner efter oavgjort sammanlagt
  const d2 = diffDist(M.scoreMatrix(ly, lx, fit.rho, rules.model.maxGoals)); // Y − X i returen
  const G = (d2.length - 1) / 2;
  let pX = 0;
  if (spec.legs.leg === 2 && first.score90) {
    const d1 = first.score90.home - first.score90.away; // X − Y i första mötet
    for (let k = 0; k < d2.length; k++) {
      const tot = d1 - (k - G);
      pX += tot > 0 ? d2[k] : tot === 0 ? d2[k] * q : 0;
    }
  } else if (spec.legs.leg === 1) {
    const d1 = diffDist(m); // X − Y
    for (let i = 0; i < d1.length; i++) {
      for (let k = 0; k < d2.length; k++) {
        const tot = (i - G) - (k - G);
        const p = d1[i] * d2[k];
        pX += tot > 0 ? p : tot === 0 ? p * q : 0;
      }
    }
  } else {
    return { home: null, away: null, rule: rule.text, reason: 'resultatet i första mötet är okänt' };
  }
  const home = spec.hk === X ? pX : 1 - pX;
  return {
    home: round4(home), away: round4(1 - home), rule: rule.text, leg: spec.legs.leg,
    firstLeg: spec.legs.leg === 2 && first.score90 ? { home: first.home, away: first.away, score: first.score90 } : null,
  };
}

// ---------- osäkerhet ----------

// Bayesiansk bootstrap för en skattningsdag: skattningen görs om med
// slumpvikter, och för varje match samlas 1X2 från varje omskattning.
function intervals(ctx, day, specs) {
  const base = fitAt(ctx, day);
  const { samples, interval, seed } = rules.uncertainty;
  const rand = M.rng(seed + day);
  const draws = specs.map(() => [[], [], []]);
  const sigs = specs.map((sp) => factorSignals(ctx, sp));
  for (let s = 0; s < samples; s++) {
    const games = base.games.map((g) => ({ ...g, w: g.w * -Math.log(1 - rand()) }));
    const fit = M.fitPoisson(games, { init: base, tolerance: 1e-6, maxIterations: rules.model.maxIterations });
    specs.forEach((sp, i) => {
      if (!fit.A.has(sp.hk) || !fit.A.has(sp.ak)) return;
      const [lh, la] = M.factorAdjust(...M.expectedGoals(fit, sp.hk, sp.ak, sp.neutral, homeGroup(sp.comp)), sigs[i].z, sigs[i].beta);
      const x = M.outcomes(M.scoreMatrix(lh, la, base.rho, rules.model.maxGoals)).x12;
      for (let k = 0; k < 3; k++) draws[i][k].push(x[k]);
    });
  }
  const lo = (1 - interval) / 2;
  return draws.map((d) => (d[0].length < samples / 2 ? null
    : d.map((xs) => { const s = xs.sort((a, b) => a - b); return [round4(M.quantile(s, lo)), round4(M.quantile(s, 1 - lo))]; })));
}

// ---------- innevarande säsong ----------

// Alla matcher i de sex tävlingarna, som specifikationer för predict().
function currentSpecs(ctx, now = new Date()) {
  const D = load();
  const today = dayNum(now.toISOString().slice(0, 10));
  const specs = [];
  for (const m of D.matches) {
    const c = competition(m.comp);
    const day = dayNum(m.kickoff.slice(0, 10));
    const hk = ctx.tier.has(m.hk) ? m.hk : LOWER;
    const ak = ctx.tier.has(m.ak) ? m.ak : LOWER;
    const neutral = neutralOf(m, m.comp);
    specs.push({
      id: m.id, comp: m.comp, round: m.round, day,
      // Spelade matcher: underlaget före matchdagen. Ej spelade (även
      // uppskjutna med passerat datum): dagens underlag – i dag före dagens
      // matcher, framåt med allt som spelats.
      fitDay: m.completed ? day : day <= today ? today : today + 1,
      hk, ak, home: m.home.name, away: m.away.name, neutral,
      completed: m.completed,
      score90: m.score90,
      ...marketCurrent(D, m, c),
    });
  }
  // Två möten (EFL-cupens semifinaler): para ihop med returen.
  for (const s of specs) {
    const r = rules.cups[s.comp];
    if (!r || !r.twoLegRounds.includes(s.round)) continue;
    const other = specs.find((o) => o !== s && o.comp === s.comp && o.round === s.round && o.hk === s.ak && o.ak === s.hk);
    if (other) s.legs = { other: other.id, leg: s.day < other.day || (s.day === other.day && s.id < other.id) ? 1 : 2 };
  }
  return specs;
}

function marketCurrent(D, m, c) {
  if (c.type === 'cup') {
    const o = D.odds.byEvent[m.id];
    if (!o) return { market: null };
    const mk = marketFrom([o.home, o.draw, o.away], { source: `${o.provider} via ESPN`, kind: 'senaste', fetchedAt: o.fetchedAt });
    if (mk && o.totalLine === 2.5 && o.over > 1 && o.under > 1) mk.over25 = M.shin([o.over, o.under]).p[0];
    return { market: mk };
  }
  const key = `${m.hk}|${m.ak}`;
  const result = m.completed ? D.fd[c.id].byPair.get(key) : null;
  const fixture = D.fdFixtures.byPair.get(key);
  const row = result || fixture;
  const fetchedAt = result ? D.fd[c.id].fetchedAt : D.fdFixtures.fetchedAt;
  const open = row && fdTriple(row, 'Avg');
  const market = open ? marketFrom(open, { source: 'football-data.co.uk, marknadssnitt', kind: 'öppning', fetchedAt, over25: fdTotal(row, '') }) : null;
  const bfc = result && fdTriple(result, 'BFEC');
  const closing = bfc ? marketFrom(bfc, { source: 'Betfair Exchange', kind: 'stängning', fetchedAt }) : null;
  return { market, closing };
}

// Prognoser för hela innevarande säsong: Map(match-id → prognos).
function forecastAll({ now = new Date() } = {}) {
  const t0 = Date.now();
  const ctx = context(SEASON.fdcouk);
  const specs = currentSpecs(ctx, now);
  const byId = new Map(specs.map((s) => [s.id, s]));
  const out = new Map();
  for (const s of [...specs].sort((a, b) => a.fitDay - b.fitDay)) {
    try {
      out.set(s.id, predict(ctx, s, byId));
    } catch (err) {
      console.error(`[forecast] match ${s.id}: ${err.message || err}`);
    }
  }
  // Osäkerhet för matcher som inte spelats.
  const byDay = new Map();
  for (const s of specs) {
    const p = out.get(s.id);
    if (s.completed || !p || p.status !== 'ok') continue;
    if (!byDay.has(s.fitDay)) byDay.set(s.fitDay, []);
    byDay.get(s.fitDay).push(s);
  }
  for (const [day, list] of byDay) {
    intervals(ctx, day, list).forEach((r, i) => { out.get(list[i].id).range = r; });
  }
  const latest = ctx.fits.size ? fitAt(ctx, Math.max(...ctx.fits.keys())) : null;
  // Styrkan för alla lag (motståndet i lagstatistiken). Beskrivande ur samma
  // skattning; fallerar den saknas bara den.
  let strength = null;
  try {
    strength = strengthTable({ ctx, specs, fitAt: (day) => fitAt(ctx, day) });
  } catch (err) {
    console.error('[forecast] styrkan:', err);
  }
  return { predictions: out, model: modelSummary(ctx, latest), strength, ms: Date.now() - t0 };
}

// Det som visas under fliken Modell: regelversion och skattade storheter.
// Utan skattning (inget underlag i cachen) finns inget att visa – null, inte
// startvärden.
function modelSummary(ctx, fit) {
  if (!fit || !fit.n) return null;
  const tiers = [...fit.divisions].sort((a, b) => a[0] - b[0]).map(([t, d]) => ({
    tier: t, name: t === 6 ? 'Under National League' : TIER_NAME[t], teams: d.n,
    // förväntade mål när två genomsnittslag på nivån möts på neutral plan
    goals: round2(Math.exp(d.a + d.b)),
    // mot ett genomsnittslag i Premier League, neutral plan
    vsTop: fit.divisions.has(1) ? x12Rounded(Math.exp(d.a + fit.divisions.get(1).b), Math.exp(fit.divisions.get(1).a + d.b), fit.rho) : null,
  }));
  return {
    rulesVersion: rules.version,
    fitThrough: fit.through,
    matches: fit.n,
    firstSeason: label(ctx.minSeason),
    halfLifeDays: rules.model.halfLifeDays,
    homeAdvantage: round4(fit.H),
    rho: round4(fit.rho),
    tiers,
    lowerMatches: ctx.games.filter((g) => g.lower && g.day < fit.day).length,
    lowerSince: label(fdSeasonCode(HISTORY.espnFaCup.first)),
    naiveSeasons: rules.baselines.naive.seasons,
    seasonMinMatches: rules.baselines.season.minMatches,
    interval: rules.uncertainty.interval,
    samples: rules.uncertainty.samples,
    factors: Object.entries(rules.factors || {}).map(([id, f]) => ({
      id, candidate: f.candidate, since: f.since, beta: f.beta, minMatches: f.minMatches, effect: round4(Math.exp(f.beta) - 1),
    })),
    sources: ctx.fetchedAt,
  };
}

function x12Rounded(lh, la, rho) {
  return M.outcomes(M.scoreMatrix(lh, la, rho, rules.model.maxGoals)).x12.map(round4);
}

function round4(x) { return x == null ? null : Math.round(x * 10000) / 10000; }
function round2(x) { return x == null ? null : Math.round(x * 100) / 100; }

module.exports = {
  forecastAll, context, predict, fitAt, intervals, currentSpecs, marketFrom, fdTriple, fdTotal, cupRule, dayNum, isoOf,
  tableIndex, tableSignal, LOWER,
};
