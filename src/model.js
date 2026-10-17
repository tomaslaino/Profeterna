'use strict';

// Modellmatematiken, utan källor och utan UI: skattning av lagstyrkor
// (Poisson / Dixon–Coles), resultatmatris och det som härleds ur den
// (1X2, över/under, båda lagen gör mål, förlängning). Används av den skarpa
// prognosen (src/forecast.js) och kontrollen (src/check.js) – samma kod på
// båda ställena.
//
// Parametrisering: förväntade mål för hemmalaget = A[hemma] · B[borta] · H,
// för bortalaget = A[borta] · B[hemma] (H = 1 på neutral plan). A = anfall,
// B = hur mycket laget släpper till (högre = sämre försvar). Skalan låses
// genom att anfallens geometriska medelvärde är 1.

// ---------- skattning ----------

// games: [{ h, a, hg, ag, neutral, w }] med lagnycklar h/a och vikt w > 0.
// init: tidigare skattning att starta från (snabbar upp skattning dag för dag).
// Ger { A, B, H, teams } där teams per lag har viktat antal matcher,
// antal matcher och om skattningen är degenererad (inga gjorda eller
// insläppta mål – maximum likelihood saknas då).
function fitPoisson(games, { init = null, tolerance = 1e-7, maxIterations = 2000 } = {}) {
  const idx = new Map();
  const keys = [];
  const id = (k) => {
    let i = idx.get(k);
    if (i === undefined) { i = keys.length; idx.set(k, i); keys.push(k); }
    return i;
  };
  const n = games.length;
  const gh = new Int32Array(n);
  const ga = new Int32Array(n);
  for (let g = 0; g < n; g++) { gh[g] = id(games[g].h); ga[g] = id(games[g].a); }
  const T = keys.length;
  const forW = new Float64Array(T); // viktade gjorda mål
  const agW = new Float64Array(T); // viktade insläppta mål
  const wSum = new Float64Array(T);
  const count = new Int32Array(T);
  let homeGoals = 0;
  for (let g = 0; g < n; g++) {
    const x = games[g];
    forW[gh[g]] += x.w * x.hg; agW[gh[g]] += x.w * x.ag;
    forW[ga[g]] += x.w * x.ag; agW[ga[g]] += x.w * x.hg;
    wSum[gh[g]] += x.w; wSum[ga[g]] += x.w;
    count[gh[g]]++; count[ga[g]]++;
    if (!x.neutral) homeGoals += x.w * x.hg;
  }
  const A = new Float64Array(T).fill(1);
  const B = new Float64Array(T).fill(1);
  let H = 1.3;
  if (init) {
    for (let t = 0; t < T; t++) {
      if (init.A.has(keys[t])) { A[t] = init.A.get(keys[t]); B[t] = init.B.get(keys[t]); }
    }
    H = init.H;
  }
  const degenerate = new Uint8Array(T);
  for (let t = 0; t < T; t++) if (forW[t] <= 0 || agW[t] <= 0) degenerate[t] = 1;

  const den = new Float64Array(T);
  let iterations = 0;
  for (; iterations < maxIterations; iterations++) {
    let maxChange = 0;
    // Anfall
    den.fill(0);
    for (let g = 0; g < n; g++) {
      const x = games[g];
      const hf = x.neutral ? 1 : H;
      den[gh[g]] += x.w * B[ga[g]] * hf;
      den[ga[g]] += x.w * B[gh[g]];
    }
    for (let t = 0; t < T; t++) {
      const v = den[t] > 0 ? forW[t] / den[t] : 0;
      maxChange = Math.max(maxChange, change(v, A[t]));
      A[t] = v;
    }
    // Försvar
    den.fill(0);
    for (let g = 0; g < n; g++) {
      const x = games[g];
      const hf = x.neutral ? 1 : H;
      den[ga[g]] += x.w * A[gh[g]] * hf;
      den[gh[g]] += x.w * A[ga[g]];
    }
    for (let t = 0; t < T; t++) {
      const v = den[t] > 0 ? agW[t] / den[t] : 0;
      maxChange = Math.max(maxChange, change(v, B[t]));
      B[t] = v;
    }
    // Hemmafördel: viktade hemmamål / förväntade hemmamål utan hemmafördel
    let exp = 0;
    for (let g = 0; g < n; g++) {
      if (!games[g].neutral) exp += games[g].w * A[gh[g]] * B[ga[g]];
    }
    const Hn = exp > 0 ? homeGoals / exp : H;
    maxChange = Math.max(maxChange, Math.abs(Math.log(Hn / H)));
    H = Hn;
    // Skala: geometriskt medel av anfallen = 1 (påverkar inga förväntade mål).
    let s = 0;
    let m = 0;
    for (let t = 0; t < T; t++) if (A[t] > 0 && B[t] > 0) { s += Math.log(A[t]); m++; }
    const c = m ? Math.exp(s / m) : 1;
    for (let t = 0; t < T; t++) { A[t] /= c; B[t] *= c; }
    if (maxChange < tolerance) break;
  }

  const outA = new Map();
  const outB = new Map();
  const teams = new Map();
  for (let t = 0; t < T; t++) {
    outA.set(keys[t], A[t]);
    outB.set(keys[t], B[t]);
    const bad = degenerate[t] || !(A[t] > 0 && B[t] > 0 && Number.isFinite(A[t]) && Number.isFinite(B[t]));
    teams.set(keys[t], { weight: wSum[t], matches: count[t], degenerate: bad });
  }
  return { A: outA, B: outB, H, teams, iterations, converged: iterations < maxIterations };
}

// Relativ förändring mellan iterationer. Parametrar som är 0 (lag utan
// gjorda/insläppta mål – maximum likelihood saknas) räknas inte, så att de
// inte hindrar konvergensen för övriga lag.
function change(v, old) {
  return v > 0 && old > 0 ? Math.abs(Math.log(v / old)) : 0;
}

// ρ givet Poisson-parametrarna: maximerar den viktade log-likelihooden för
// Dixon–Coles-korrektionen med gyllene snittet, inom det intervall där
// korrektionen ger giltiga sannolikheter för alla matcher i skattningen.
function fitRho(games, fit) {
  let lo = -1;
  let hi = 1;
  const low = [];
  for (const x of games) {
    const [lh, la] = expectedGoals(fit, x.h, x.a, x.neutral);
    lo = Math.max(lo, -1 / lh, -1 / la);
    hi = Math.min(hi, 1 / (lh * la));
    if (x.hg <= 1 && x.ag <= 1) low.push([x.hg, x.ag, lh, la, x.w]);
  }
  const eps = 1e-6;
  lo += eps;
  hi -= eps;
  const ll = (rho) => {
    let s = 0;
    for (const [hg, ag, lh, la, w] of low) s += w * Math.log(tau(hg, ag, lh, la, rho));
    return s;
  };
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = lo;
  let b = hi;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  let fc = ll(c);
  let fd = ll(d);
  for (let i = 0; i < 80 && b - a > 1e-6; i++) {
    if (fc > fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = ll(c); } else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = ll(d); }
  }
  return { rho: (a + b) / 2, bounds: [lo, hi] };
}

function tau(x, y, lh, la, rho) {
  if (x === 0 && y === 0) return 1 - lh * la * rho;
  if (x === 0 && y === 1) return 1 + lh * rho;
  if (x === 1 && y === 0) return 1 + la * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

function expectedGoals(fit, h, a, neutral) {
  const hf = neutral ? 1 : fit.H;
  return [fit.A.get(h) * fit.B.get(a) * hf, fit.A.get(a) * fit.B.get(h)];
}

// Sammanhängande grupper av lag (lag som kopplas ihop av matcher). Två lag i
// olika grupper har ingen gemensam skala – deras inbördes styrka är okänd.
function components(games) {
  const parent = new Map();
  const find = (k) => {
    if (!parent.has(k)) parent.set(k, k);
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r);
    let x = k;
    while (parent.get(x) !== r) { const nx = parent.get(x); parent.set(x, r); x = nx; }
    return r;
  };
  for (const g of games) {
    const a = find(g.h);
    const b = find(g.a);
    if (a !== b) parent.set(a, b);
  }
  return find;
}

// ---------- resultatfördelning ----------

function poissonPmf(lambda, max) {
  const p = new Float64Array(max + 1);
  p[0] = Math.exp(-lambda);
  for (let k = 1; k <= max; k++) p[k] = (p[k - 1] * lambda) / k;
  return p;
}

// Matris P[hemmamål][bortamål] med Dixon–Coles-korrektion, normerad till 1.
// ρ klipps till det giltiga intervallet för just dessa förväntade mål.
function scoreMatrix(lh, la, rho, maxGoals) {
  const r = Math.max(-1 / lh, -1 / la, Math.min(rho, 1 / (lh * la), 1));
  const ph = poissonPmf(lh, maxGoals);
  const pa = poissonPmf(la, maxGoals);
  const m = [];
  let total = 0;
  for (let i = 0; i <= maxGoals; i++) {
    const row = new Float64Array(maxGoals + 1);
    for (let j = 0; j <= maxGoals; j++) {
      row[j] = ph[i] * pa[j] * (i <= 1 && j <= 1 ? tau(i, j, lh, la, r) : 1);
      total += row[j];
    }
    m.push(row);
  }
  for (const row of m) for (let j = 0; j < row.length; j++) row[j] /= total;
  return m;
}

function outcomes(m) {
  let p1 = 0;
  let px = 0;
  let p2 = 0;
  let under25 = 0;
  let noBtts = 0;
  for (let i = 0; i < m.length; i++) {
    for (let j = 0; j < m[i].length; j++) {
      const p = m[i][j];
      if (i > j) p1 += p; else if (i === j) px += p; else p2 += p;
      if (i + j <= 2) under25 += p;
      if (i === 0 || j === 0) noBtts += p;
    }
  }
  return { x12: [p1, px, p2], over25: 1 - under25, btts: 1 - noBtts };
}

// Sannolikheten att hemmalaget vinner en förlängning (30 min) respektive att
// den slutar oavgjort, med samma målfrekvens per minut som under matchen och
// oberoende Poisson (låga resultat över 30 minuter korrigeras inte).
function extraTime(lh, la, share, maxGoals) {
  const m = scoreMatrix(lh * share, la * share, 0, maxGoals);
  const [w, d] = outcomes(m).x12;
  return { homeWin: w, draw: d, awayWin: 1 - w - d };
}

// ---------- marknadens odds ----------

// Odds → sannolikheter utan marginal (Shin 1993). z = andelen "insider-
// handel" i Shins modell, löst med bisektion så att sannolikheterna summerar
// till 1. Summan av 1/odds ≤ 1 → ingen marginal, bara normering.
function shin(odds) {
  if (!odds || odds.some((o) => !(o > 1))) return null;
  const pi = odds.map((o) => 1 / o);
  const S = pi.reduce((s, x) => s + x, 0);
  if (S <= 1) return { p: pi.map((x) => x / S), method: 'normering', overround: S };
  const probs = (z) => pi.map((x) => (Math.sqrt(z * z + (4 * (1 - z) * x * x) / S) - z) / (2 * (1 - z)));
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 100; i++) {
    const z = (lo + hi) / 2;
    if (probs(z).reduce((s, x) => s + x, 0) > 1) lo = z; else hi = z;
  }
  const p = probs((lo + hi) / 2);
  const t = p.reduce((s, x) => s + x, 0);
  return { p: p.map((x) => x / t), method: 'shin', overround: S, z: (lo + hi) / 2 };
}

// ---------- hjälpare ----------

// Hela procent som summerar till 100 (största rest).
function wholePercent(ps) {
  const raw = ps.map((p) => p * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((s, x) => s + x, 0);
  const order = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (left <= 0) break; out[i]++; left--; }
  return out;
}

// Deterministisk slump (mulberry32) – samma seed ger samma intervall.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const i = Math.floor(pos);
  const f = pos - i;
  return i + 1 < sorted.length ? sorted[i] * (1 - f) + sorted[i + 1] * f : sorted[i];
}

module.exports = {
  fitPoisson, fitRho, expectedGoals, components, scoreMatrix, outcomes, extraTime, shin,
  wholePercent, rng, quantile, tau,
};
