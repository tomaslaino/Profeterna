'use strict';

// Modellens styrka för alla lag i nivå 1–4, på samma skala: förväntad
// målskillnad per match mot ett genomsnittligt Premier League-lag på neutral
// plan, med den senaste skattningen (samma som ger prognoserna för kommande
// matcher). Används som motståndets styrka i lagstatistiken
// (src/teamstats.js) och i formen (src/matches.js).
//
// Formen möter också lag utanför de fyra ligorna. De får sin styrka på samma
// skala, men räknas inte in i lagstatistiken (list är nivå 1–4 som förut):
//   nl     lagen i National League, som modellen skattar
//   under  nivån under National League – ett gemensamt lag i modellen
//   scale  det som behövs för att räkna ett utländskt lags styrka ur
//          matchens odds (strengthFromOdds nedan)

const rules = require('../config/forecast-rules');
const M = require('./model');

// ctx: prognosmotorns kontext, specs: alla matcher, fitAt: (dag) → skattning,
// lower: nyckeln för nivån under National League (LOWER i src/modeldata.js –
// skickas in, eftersom modeldata läser src/matches.js som läser den här filen).
function strengthTable({ ctx, specs, fitAt, lower = null }) {
  const future = specs.filter((s) => !s.completed);
  const day = future.length ? Math.max(...future.map((s) => s.fitDay)) : Math.max(...specs.map((s) => s.fitDay));
  const fit = fitAt(day);
  const known = (k) => fit.teams.has(k) && !fit.teams.get(k).degenerate && fit.teams.get(k).weight >= rules.model.minEffectiveMatches && fit.A.has(k);
  const tierKeys = [...ctx.tier].filter(([k, t]) => t <= 5 && known(k));
  const top = tierKeys.filter(([, t]) => t === 1).map(([k]) => k);
  if (!top.length) return { list: [], fitThrough: fit.through };
  // Premier League-snittets anfall och försvar (geometriskt medel).
  const a1 = Math.exp(top.reduce((acc, k) => acc + Math.log(fit.A.get(k)), 0) / top.length);
  const b1 = Math.exp(top.reduce((acc, k) => acc + Math.log(fit.B.get(k)), 0) / top.length);
  const rating = (k) => fit.A.get(k) * b1 - a1 * fit.B.get(k);
  const list = tierKeys.filter(([, t]) => t <= 4)
    .map(([k]) => ({ key: k, rating: rating(k), a: fit.A.get(k), b: fit.B.get(k) }));
  const nl = tierKeys.filter(([, t]) => t === 5).map(([k]) => ({ key: k, rating: rating(k) }));
  return {
    list,
    nl,
    under: lower && known(lower) ? rating(lower) : null,
    scale: { a1, b1, home: fit.H, rho: fit.rho || 0 },
    fitThrough: fit.through,
  };
}

// ---------- ett lag utanför modellen, ur matchens odds ----------

const MAX_GOALS = 10;
// Rimliga mål per match: oddsens kryss bestämmer målen dåligt när ett lag är
// stor favorit, och utanför spannet skulle styrkan dras iväg.
const TOTAL = [1.6, 4.4];

const x12 = (lh, la, rho) => M.outcomes(M.scoreMatrix(lh, la, rho, MAX_GOALS)).x12;

function bisect(f, lo, hi) {
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

// De förväntade målen som ger oddsens sannolikheter p = [1, X, 2]: fördelningen
// mellan lagen efter skillnaden 1 mot 2, antalet mål efter krysset.
function goalsFromProbs(p, rho) {
  const split = (total) => bisect((h) => { const q = x12(total * h, total * (1 - h), rho); return (q[0] - q[2]) - (p[0] - p[2]); }, 0.02, 0.98);
  const total = bisect((t) => { const h = split(t); return p[1] - x12(t * h, t * (1 - h), rho)[1]; }, TOTAL[0], TOTAL[1]);
  const h = split(total);
  return { home: total * h, away: total * (1 - h) };
}

// Styrkan hos motståndaren i en match där bara det egna laget finns i
// modellen (Europacuperna). Modellen säger: hemmalagets mål = lagets anfall ·
// motståndarens försvar · hemmafördelen, bortalagets = lagets anfall ·
// motståndarens försvar. Oddsen ger matchens förväntade mål, och med det egna
// lagets anfall och försvar (own.a, own.b) följer motståndarens – på samma
// skala som de andra lagens styrka. odds = [1, X, 2] som decimalodds.
// null när oddsen inte går att räkna på.
function strengthFromOdds(scale, own, { home, neutral }, odds) {
  if (!scale || !own || !(own.a > 0) || !(own.b > 0)) return null;
  const s = M.shin(odds);
  if (!s || s.p.some((x) => !(x > 0))) return null;
  const g = goalsFromProbs(s.p, scale.rho || 0);
  const H = neutral ? 1 : scale.home;
  const a = home ? g.away / own.b : g.home / (own.b * H);
  const b = home ? g.home / (own.a * H) : g.away / own.a;
  const r = a * scale.b1 - scale.a1 * b;
  return Number.isFinite(r) ? r : null;
}

// ---------- hur svårt ett motstånd är ----------

// Medianen i en lista av tal (styrkor eller Elo-tal), null när den är tom.
function median(xs) {
  if (!xs || !xs.length) return null;
  const s = xs.slice().sort((a, b) => a - b);
  const i = (s.length - 1) / 2;
  return (s[Math.floor(i)] + s[Math.ceil(i)]) / 2;
}

// Motståndets svårighet 0–1 (sedan 2026-11-17): hur stor del av poängen
// motståndaren väntas ta mot medianlaget i den egna divisionen på neutral plan,
// där vinst är 1 och oavgjort ½. d = motståndarens styrka minus medianlagets,
// i mål per match. Målen är lika många som mellan två genomsnittliga Premier
// League-lag (scale.a1 · scale.b1 var), fördelade så att skillnaden blir d.
// 0,5 är ett lag som medianlaget; 0 och 1 nås aldrig, eftersom ingen match
// är vunnen eller förlorad på förhand. (Till 2026-11-17 gick skalan från
// divisionens svagaste lag till dess starkaste, och allt utanför fastnade på
// 0 eller 100 – Hull lika lätt som Fleetwood för Arsenal.)
function difficulty(d, scale) {
  if (!Number.isFinite(d)) return null;
  const mu = scale && scale.a1 > 0 && scale.b1 > 0 ? scale.a1 * scale.b1 : 1.35;
  const t = Math.asinh(d / (2 * mu));
  const q = x12(mu * Math.exp(t), mu * Math.exp(-t), (scale && scale.rho) || 0);
  return q[0] + q[1] / 2;
}

// Samma sak för landslagen ur Elo-talen: Elo-skalans väntade resultat (vinst 1,
// oavgjort ½) för motståndaren mot ett lag med referensens tal, neutral plan.
const eloDifficulty = (elo, ref) => 1 / (1 + 10 ** ((ref - elo) / 400));

module.exports = { strengthTable, strengthFromOdds, median, difficulty, eloDifficulty };
