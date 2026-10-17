'use strict';

// Enkel kontroll av grundmodellen på förra säsongen (2025/26): varje match
// får en prognos skattad bara på matcher före matchdagen – exakt samma kod
// och regler som den skarpa prognosen – och jämförs med baslinjerna.
// Ligorna PL–League Two från football-data.co.uk och FA-cupen från ESPN
// (EFL-cupens tidigare säsonger hämtas inte).
//
// Det här är ingen utvärdering av modellen i statistisk mening: regelvalen
// gjordes med vetskap om att 2025/26 skulle användas här. Den riktiga
// walk-forward-utvärderingen över många säsonger kommer i fas 4.
//
//   npm run check        kör och skriver ut tabellen
//
// Bygget (src/build.js) kör samma kontroll när regelversionen eller
// historiken ändrats och visar resultatet under fliken Modell.

const rules = require('../config/forecast-rules');
const { HISTORY, fdSeasonCode, competition } = require('../config/competitions');
const F = require('./forecast');
const M = require('./model');
const { readCache, writeCache } = require('./store');

const TARGET = fdSeasonCode(HISTORY.fdcouk.last);
const BOOTSTRAP = 2000;

function specs(ctx) {
  const out = [];
  for (const g of ctx.games) {
    if (g.season !== TARGET) continue;
    if (['pl', 'ch', 'l1', 'l2'].includes(g.comp)) {
      const r = g.row;
      const open = F.fdTriple(r, 'Avg');
      const close = F.fdTriple(r, 'BFEC');
      out.push({
        id: `${g.comp}|${g.date}|${g.h}|${g.a}`, comp: g.comp, round: null, day: g.day, fitDay: g.day,
        hk: g.h, ak: g.a, home: r.HomeTeam, away: r.AwayTeam, neutral: false, completed: true,
        score90: { home: g.hg, away: g.ag },
        market: open ? F.marketFrom(open, { source: 'football-data.co.uk, marknadssnitt', kind: 'öppning' }) : null,
        closing: close ? F.marketFrom(close, { source: 'Betfair Exchange', kind: 'stängning' }) : null,
      });
    } else if (g.comp === 'fac') {
      out.push({
        id: `fac|${g.espn.id}`, comp: 'fac', round: g.round, day: g.day, fitDay: g.day,
        hk: g.h, ak: g.a, home: g.names[0], away: g.names[1], neutral: g.neutral, completed: true,
        score90: { home: g.hg, away: g.ag }, market: null, closing: null,
        winner: g.espn.winner,
      });
    }
  }
  return out;
}

const outcome = (s) => (s.home > s.away ? 0 : s.home === s.away ? 1 : 2);
const logLoss = (p, o) => -Math.log(Math.max(p[o], 1e-12));
const brier = (p, o) => p.reduce((s, x, k) => s + (x - (k === o ? 1 : 0)) ** 2, 0);

// Jämför modellen med en baslinje på de matcher där båda finns. Skillnaden
// (modell − baslinje; negativt = modellen bättre) med 95 % bootstrap-
// intervall över matcherna.
function compare(rows, pick, label) {
  const pairs = rows.map((r) => ({ o: r.o, m: r.model, b: pick(r) })).filter((x) => x.m && x.b);
  if (!pairs.length) return { label, n: 0 };
  const ll = pairs.map((x) => [logLoss(x.m, x.o), logLoss(x.b, x.o)]);
  const br = pairs.map((x) => [brier(x.m, x.o), brier(x.b, x.o)]);
  const mean = (a, i) => a.reduce((s, x) => s + x[i], 0) / a.length;
  const rand = M.rng(rules.uncertainty.seed);
  const diffs = [];
  for (let b = 0; b < BOOTSTRAP; b++) {
    let s = 0;
    for (let i = 0; i < ll.length; i++) { const x = ll[Math.floor(rand() * ll.length)]; s += x[0] - x[1]; }
    diffs.push(s / ll.length);
  }
  diffs.sort((a, b) => a - b);
  return {
    label,
    n: pairs.length,
    logLoss: [round(mean(ll, 0)), round(mean(ll, 1))],
    brier: [round(mean(br, 0)), round(mean(br, 1))],
    diff: round(mean(ll, 0) - mean(ll, 1)),
    ci: [round(M.quantile(diffs, 0.025)), round(M.quantile(diffs, 0.975))],
  };
}

function round(x) {
  return Math.round(x * 10000) / 10000;
}

function runCheck() {
  const t0 = Date.now();
  const ctx = F.context(TARGET);
  const list = specs(ctx).sort((a, b) => a.fitDay - b.fitDay);
  const byId = new Map(list.map((s) => [s.id, s]));
  const rows = [];
  let advLL = 0;
  let advN = 0;
  for (const s of list) {
    const p = F.predict(ctx, s, byId);
    const o = outcome(s.score90);
    rows.push({
      comp: s.comp, o,
      model: p.status === 'ok' ? p.p : null,
      naive: p.baselines.naive.p,
      season: p.baselines.season.p,
      market: p.baselines.market && p.baselines.market.p,
      closing: p.baselines.closing && p.baselines.closing.p,
    });
    if (p.advance && p.advance.home != null && s.winner) {
      advLL += -Math.log(Math.max(s.winner === 'home' ? p.advance.home : p.advance.away, 1e-12));
      advN++;
    }
  }
  const league = rows.filter((r) => r.comp !== 'fac');
  const result = {
    rulesVersion: rules.version,
    ranAt: new Date().toISOString(),
    season: `${HISTORY.fdcouk.last}/${String((HISTORY.fdcouk.last + 1) % 100).padStart(2, '0')}`,
    matches: rows.length,
    modelKnown: rows.filter((r) => r.model).length,
    leagues: [
      compare(league, (r) => r.season, '(b) Poisson på säsongens mål'),
      compare(league, (r) => r.naive, '(a) Naiv'),
      compare(league, (r) => r.market, '(c) Marknaden, öppning'),
      compare(league, (r) => r.closing, 'Betfair Exchange, stängning'),
    ],
    byDivision: ['pl', 'ch', 'l1', 'l2'].map((c) => ({
      comp: c, name: competition(c).name,
      vsSeason: compare(league.filter((r) => r.comp === c), (r) => r.season, '(b)'),
      vsMarket: compare(league.filter((r) => r.comp === c), (r) => r.market, '(c)'),
    })),
    faCup: {
      vsNaive: compare(rows.filter((r) => r.comp === 'fac'), (r) => r.naive, '(a) Naiv'),
      vsSeason: compare(rows.filter((r) => r.comp === 'fac'), (r) => r.season, '(b) Poisson på säsongens mål'),
      advance: advN ? { n: advN, logLoss: round(advLL / advN) } : null,
    },
    ms: Date.now() - t0,
  };
  return result;
}

// Bygget: kör om när regelversionen eller historiken ändrats.
function storedCheck() {
  const sig = [rules.version, ...['fdcouk_hist_E0', 'fdcouk_hist_E1', 'fdcouk_hist_E2', 'fdcouk_hist_E3', 'fdcouk_hist_EC', 'espn_hist_fac']
    .map((id) => { const c = readCache(id); return c ? c.fetchedAt : null; })].join('|');
  const cached = readCache('check');
  if (cached && cached.data && cached.data.sig === sig) return cached.data.result;
  const result = runCheck();
  writeCache('check', { fetchedAt: result.ranAt, data: { sig, result } });
  return result;
}

if (require.main === module) {
  const r = runCheck();
  const f = (x) => x.toFixed(4).replace('.', ',');
  console.log(`Kontroll ${r.season}, regelversion ${r.rulesVersion}: ${r.modelKnown} av ${r.matches} matcher med modellprognos (${r.ms} ms)\n`);
  console.log('Ligorna – modell mot baslinje (log-poäng, lägre = bättre; skillnad modell − baslinje med 95 % KI)');
  for (const c of r.leagues) {
    if (!c.n) { console.log(`  ${c.label}: inga matcher`); continue; }
    console.log(`  ${c.label.padEnd(32)} n=${String(c.n).padStart(4)}  modell ${f(c.logLoss[0])}  baslinje ${f(c.logLoss[1])}  skillnad ${f(c.diff)} [${f(c.ci[0])}, ${f(c.ci[1])}]  Brier ${f(c.brier[0])} / ${f(c.brier[1])}`);
  }
  console.log('\nPer division');
  for (const d of r.byDivision) {
    const s = d.vsSeason;
    const m = d.vsMarket;
    console.log(`  ${d.name.padEnd(16)} mot (b): n=${s.n} ${s.n ? `${f(s.logLoss[0])} / ${f(s.logLoss[1])} [${f(s.ci[0])}, ${f(s.ci[1])}]` : ''}   mot (c): n=${m.n} ${m.n ? `${f(m.logLoss[0])} / ${f(m.logLoss[1])} [${f(m.ci[0])}, ${f(m.ci[1])}]` : ''}`);
  }
  const fa = r.faCup;
  console.log(`\nFA-cupen: mot (a) n=${fa.vsNaive.n} ${fa.vsNaive.n ? `${f(fa.vsNaive.logLoss[0])} / ${f(fa.vsNaive.logLoss[1])} [${f(fa.vsNaive.ci[0])}, ${f(fa.vsNaive.ci[1])}]` : ''}` +
    `; mot (b) n=${fa.vsSeason.n}${fa.vsSeason.n ? ` ${f(fa.vsSeason.logLoss[0])} / ${f(fa.vsSeason.logLoss[1])}` : ''}` +
    `; gå vidare: ${fa.advance ? `n=${fa.advance.n}, log-poäng ${f(fa.advance.logLoss)} (slantsingling ${f(Math.log(2))})` : '–'}`);
}

module.exports = { runCheck, storedCheck };
