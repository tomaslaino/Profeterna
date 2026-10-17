'use strict';

// ============================================================================
// Walk-forward-backtest av prognosmotorn (fas 4).
//
// Varje match i varje säsong som går att använda får en prognos skattad
// bara på matcherna före matchdagen – exakt samma kod som den skarpa
// prognosen (F.predict och F.fitAt i src/forecast.js), som kontrollen mot
// 2025/26 (src/check.js) gör för en säsong. Fönstret expanderar: säsong för
// säsong och dag för dag kommer nya matcher in i underlaget, och inget
// därefter används.
//
// Säsonger: football-data.co.uk har ligorna från 2000/01, och modellen
// behöver historySeasons säsonger bakåt – första säsongen är alltså 2004/05.
// National League (EC) finns från 2005/06 och FA-cupen hos ESPN från
// 2021/22; EFL-cupens tidigare säsonger hämtas inte. Pågående säsong tas
// med fram till senaste spelade match (ESPN + football-data.co.uk).
//
// Mått: log-poäng och Brier mot (a) naiv, (b) Poisson på säsongens mål,
// (c) marknadssnittet vid öppning (Betbrain-snitt t.o.m. 2018/19, därefter
// marknadssnitt – football-data.co.uk) och Pinnacle vid stängning (från
// 2012/13; saknas 2026/27) – alltid på de matcher där båda finns. Skillnad
// modell − baslinje med bootstrap-intervall där matchdagar dras om (matcher
// samma dag delar skattning och är inte oberoende).
//
// Tungt (~9 s per säsong och variant), därför körs det INTE i bygget:
//
//   npm run backtest     kör grundmodellen över alla säsonger (parallellt)
//                        och skriver data/backtest/<regelversion>.json, som
//                        committas och visas under fliken Modell
//
// Prognoserna per match cachas i data/cache/backtest_<variant>.json per
// regelversion, variant och historikens innehåll, så att kandidatjakten
// (src/candidates.js) och en omkörning bara räknar om det som ändrats.
// ============================================================================

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const rules = require('../config/forecast-rules');
const { SEASON, HISTORY, fdSeasonCode, competition } = require('../config/competitions');
const F = require('./forecast');
const M = require('./model');
const { startYear } = require('./modeldata');
const { readCache, writeCache } = require('./store');
const { outcome, logLoss, brier } = require('./check');

// Räknas upp när posternas innehåll eller beräkning ändras (ogiltigförklarar
// cachen).
const CODE_VERSION = 3;
const OUT_DIR = path.join(__dirname, '..', 'data', 'backtest');
const LEAGUES = ['pl', 'ch', 'l1', 'l2'];
const HIST_IDS = ['fdcouk_hist_E0', 'fdcouk_hist_E1', 'fdcouk_hist_E2', 'fdcouk_hist_E3', 'fdcouk_hist_EC', 'espn_hist_fac', 'understat_hist_epl'];
const BOOTSTRAP = 2000;
const BASE_RULES = JSON.parse(JSON.stringify(rules));

// ---------- säsonger ----------

const FIRST_YEAR = Math.min(...Object.values(HISTORY.fdcouk.first));

// Säsongerna en variant kan köras på: modellen behöver historySeasons
// säsonger bakåt (grundmodellens eller variantens, det största), och `from`
// kan begränsa till säsonger där variantens underlag finns.
function seasonsFor(variant = {}) {
  const hs = Math.max(BASE_RULES.model.historySeasons, (variant.rules && variant.rules.model && variant.rules.model.historySeasons) || 0);
  const first = Math.max(FIRST_YEAR + hs, variant.from || 0);
  const out = [];
  for (let y = first; y <= HISTORY.fdcouk.last; y++) out.push(fdSeasonCode(y));
  out.push(SEASON.fdcouk);
  return out;
}

const seasonLabel = (code) => `${startYear(code)}/${code.slice(2)}`;

// ---------- en säsong ----------

// Specifikationer för predict() – avslutade säsonger ur historiken (som
// src/check.js), pågående ur dagens spelprogram (spelade matcher med känd
// ställning efter 90 minuter).
function historySpecs(ctx, target) {
  const out = [];
  for (const g of ctx.games) {
    if (g.season !== target) continue;
    if (LEAGUES.includes(g.comp)) {
      const r = g.row;
      const open = F.fdTriple(r, 'Avg') || F.fdTriple(r, 'BbAv');
      const close = F.fdTriple(r, 'PSC');
      out.push({
        id: `${g.comp}|${g.date}|${g.h}|${g.a}`, comp: g.comp, round: null, day: g.day, fitDay: g.day,
        hk: g.h, ak: g.a, home: r.HomeTeam, away: r.AwayTeam, neutral: false, completed: true,
        score90: { home: g.hg, away: g.ag }, date: g.date,
        market: open ? F.marketFrom(open, {}) : null,
        closing: close ? F.marketFrom(close, {}) : null,
      });
    } else if (g.comp === 'fac') {
      out.push({
        id: `fac|${g.espn.id}`, comp: 'fac', round: g.round, day: g.day, fitDay: g.day,
        hk: g.h, ak: g.a, home: g.names[0], away: g.names[1], neutral: g.neutral, completed: true,
        score90: { home: g.hg, away: g.ag }, date: g.date, market: null, closing: null, winner: g.espn.winner,
      });
    }
  }
  return out;
}

function currentSpecs(ctx) {
  const { load } = require('./matches');
  const D = load();
  return F.currentSpecs(ctx).filter((s) => s.completed && s.score90).map((s) => {
    const m = D.byId.get(s.id);
    // Pinnacle saknas 2026/27 – stängningsreferensen är då okänd.
    return { ...s, date: m.kickoff.slice(0, 10), closing: null, winner: m.winner || null };
  });
}

function runSeason(target) {
  const t0 = Date.now();
  const ctx = F.context(target);
  const list = (target === SEASON.fdcouk ? currentSpecs(ctx) : historySpecs(ctx, target)).sort((a, b) => a.fitDay - b.fitDay);
  const byId = new Map(list.map((s) => [s.id, s]));
  const records = [];
  for (const s of list) {
    const p = F.predict(ctx, s, byId);
    const fit = F.fitAt(ctx, s.fitDay);
    const ok = p.status === 'ok';
    records.push({
      id: s.id, s: target, c: s.comp, d: s.date, h: s.hk, a: s.ak,
      hg: s.score90.home, ag: s.score90.away, o: outcome(s.score90), n: !!s.neutral,
      p: ok ? r6(p.p) : null,
      g: ok ? r6(p.goals) : null,
      rho: ok ? round(fit.rho, 6) : null,
      nv: p.baselines.naive.p ? r6(p.baselines.naive.p) : null,
      ss: p.baselines.season.p ? r6(p.baselines.season.p) : null,
      mk: s.market ? r6(s.market.p) : null,
      cl: s.closing ? r6(s.closing.p) : null,
      adv: p.advance && p.advance.home != null ? p.advance.home : null,
      win: s.winner || null,
    });
  }
  return { season: target, records, through: list.length ? list[list.length - 1].date : null, ms: Date.now() - t0 };
}

// ---------- varianter och arbetare ----------

// En variant = grundmodellens regler med ändringar (kandidatjakten). Körs i
// en egen tråd, där regelobjektet ändras innan prognoserna räknas – samma
// kod som den skarpa prognosen, bara andra värden.
function applyRules(over) {
  assignDeep(rules, JSON.parse(JSON.stringify(BASE_RULES)));
  if (over) assignDeep(rules, over);
}

function assignDeep(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') assignDeep(target[k], v);
    else target[k] = v;
  }
}

if (!isMainThread && workerData && workerData.backtestWorker) {
  parentPort.on('message', (job) => {
    try {
      applyRules(job.rules);
      parentPort.postMessage({ ok: true, key: job.key, result: runSeason(job.target) });
    } catch (err) {
      parentPort.postMessage({ ok: false, key: job.key, error: String((err && err.stack) || err) });
    }
  });
}

// Kör jobben [{ key, target, rules }] på `workers` trådar.
function runJobs(jobs, { workers = defaultWorkers(), onDone = () => {} } = {}) {
  if (!jobs.length) return Promise.resolve(new Map());
  const n = Math.max(1, Math.min(workers, jobs.length));
  const queue = [...jobs].sort((a, b) => (a.target === SEASON.fdcouk) - (b.target === SEASON.fdcouk));
  const results = new Map();
  return new Promise((resolve, reject) => {
    let running = 0;
    let failed = false;
    const pool = [];
    const next = (w) => {
      if (failed) return;
      const job = queue.shift();
      if (!job) {
        w.terminate();
        if (--running === 0) resolve(results);
        return;
      }
      w.postMessage(job);
    };
    for (let i = 0; i < n; i++) {
      const w = new Worker(__filename, { workerData: { backtestWorker: true } });
      pool.push(w);
      running++;
      w.on('message', (msg) => {
        if (!msg.ok) {
          failed = true;
          pool.forEach((x) => x.terminate());
          reject(new Error(`backtest ${msg.key}: ${msg.error}`));
          return;
        }
        results.set(msg.key, msg.result);
        onDone(msg.key, msg.result);
        next(w);
      });
      w.on('error', (err) => { failed = true; pool.forEach((x) => x.terminate()); reject(err); });
      next(w);
    }
  });
}

function defaultWorkers() {
  return Math.max(1, Math.min(10, (os.availableParallelism ? os.availableParallelism() : os.cpus().length) - 1));
}

// Historikens innehåll (inte hämttiden – avslutade säsonger hämtas om var
// 30:e dag men ändras inte).
let dataSigMemo = null;
function dataSignature() {
  if (dataSigMemo) return dataSigMemo;
  const h = crypto.createHash('sha1');
  for (const id of HIST_IDS) {
    const c = readCache(id);
    h.update(id + ':' + (c && c.data ? JSON.stringify(c.data) : '-') + ';');
  }
  dataSigMemo = h.digest('hex').slice(0, 16);
  return dataSigMemo;
}

// Prognoser per match för en variant över dess säsonger. Avslutade
// säsonger cachas; pågående räknas alltid om (nya matcher spelas).
// variants: [{ id, rules?, from? }] → Map(id → { seasons: Map(kod → resultat) })
async function backtestVariants(variants, { workers, log = () => {}, current = true } = {}) {
  const out = new Map();
  const jobs = [];
  const sigs = new Map();
  for (const v of variants) {
    const sig = crypto.createHash('sha1').update(JSON.stringify({ CODE_VERSION, base: BASE_RULES, rules: v.rules || null, data: dataSignature() })).digest('hex').slice(0, 16);
    sigs.set(v.id, sig);
    const cache = readCache(`backtest_${v.id}`);
    const cached = cache && cache.data && cache.data.sig === sig ? cache.data.seasons : {};
    const seasons = new Map();
    for (const code of seasonsFor(v)) {
      if (code === SEASON.fdcouk && !current) continue;
      if (code !== SEASON.fdcouk && cached[code]) seasons.set(code, cached[code]);
      else jobs.push({ key: `${v.id}|${code}`, variant: v.id, target: code, rules: v.rules || null });
    }
    out.set(v.id, { id: v.id, sig, seasons });
  }
  const t0 = Date.now();
  if (jobs.length) log(`${jobs.length} säsonger att räkna (${variants.length} varianter) på ${Math.min(workers || defaultWorkers(), jobs.length)} trådar …`);
  let done = 0;
  await runJobs(jobs, {
    workers,
    onDone: (key, r) => { done++; log(`  ${key.padEnd(28)} ${String(r.records.length).padStart(5)} matcher ${(r.ms / 1000).toFixed(1).padStart(5)} s  (${done}/${jobs.length}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`); },
  }).then((res) => {
    for (const job of jobs) out.get(job.variant).seasons.set(job.target, res.get(job.key));
  });
  for (const v of variants) {
    const o = out.get(v.id);
    const seasons = {};
    for (const [code, r] of o.seasons) if (code !== SEASON.fdcouk) seasons[code] = r;
    writeCache(`backtest_${v.id}`, { fetchedAt: new Date().toISOString(), data: { sig: o.sig, seasons } });
  }
  return out;
}

// Alla poster för en variant, i säsongsordning.
function recordsOf(variantResult) {
  return [...variantResult.seasons.keys()].sort().flatMap((k) => variantResult.seasons.get(k).records);
}

// ---------- jämförelse ----------

// Jämför två prognoser (a och b, plockade ur posterna) på de matcher där
// båda finns. Skillnaden a − b (negativ = a bättre) med bootstrap-intervall
// där hela matchdagar dras om. level: intervallets täckning.
function compareDays(rows, pickA, pickB, { label = null, level = 0.95, seed = rules.uncertainty.seed } = {}) {
  const days = new Map();
  let n = 0;
  let sa = 0;
  let sb = 0;
  let ba = 0;
  let bb = 0;
  for (const r of rows) {
    const a = pickA(r);
    const b = pickB(r);
    if (!a || !b) continue;
    const la = logLoss(a, r.o);
    const lb = logLoss(b, r.o);
    n++;
    sa += la; sb += lb;
    ba += brier(a, r.o); bb += brier(b, r.o);
    const d = days.get(r.d) || { s: 0, n: 0 };
    d.s += la - lb;
    d.n++;
    days.set(r.d, d);
  }
  if (!n) return { label, n: 0 };
  const list = [...days.values()];
  const rand = M.rng(seed);
  const diffs = new Float64Array(BOOTSTRAP);
  for (let i = 0; i < BOOTSTRAP; i++) {
    let s = 0;
    let c = 0;
    for (let j = 0; j < list.length; j++) { const x = list[Math.floor(rand() * list.length)]; s += x.s; c += x.n; }
    diffs[i] = s / c;
  }
  diffs.sort();
  const alpha = (1 - level) / 2;
  return {
    label,
    n,
    days: list.length,
    logLoss: [round(sa / n), round(sb / n)],
    brier: [round(ba / n), round(bb / n)],
    diff: round((sa - sb) / n),
    ci: [round(M.quantile(diffs, alpha)), round(M.quantile(diffs, 1 - alpha))],
    brierDiff: round((ba - bb) / n),
  };
}

const BASELINES = [
  { key: 'ss', label: '(b) Poisson på säsongens mål' },
  { key: 'nv', label: '(a) Naiv' },
  { key: 'mk', label: '(c) Marknaden, öppning' },
  { key: 'cl', label: 'Pinnacle, stängning' },
];

function vsBaselines(rows) {
  return BASELINES.map((b) => compareDays(rows, (r) => r.p, (r) => r[b.key], { label: b.label, key: b.key })).map((x, i) => ({ key: BASELINES[i].key, ...x }));
}

// Sammanställningen som committas och visas under fliken Modell.
function summarize(variantResult, { ms = null } = {}) {
  const codes = [...variantResult.seasons.keys()].sort();
  const all = recordsOf(variantResult);
  const league = all.filter((r) => LEAGUES.includes(r.c));
  const known = (rs) => rs.filter((r) => r.p).length;
  const cup = (comp) => {
    const rs = all.filter((r) => r.c === comp);
    if (!rs.length) return null;
    const adv = rs.filter((r) => r.adv != null && r.win);
    const advLL = adv.reduce((s, r) => s + -Math.log(Math.max(r.win === 'home' ? r.adv : 1 - r.adv, 1e-12)), 0);
    const seasons = [...new Set(rs.map((r) => r.s))].sort();
    return {
      comp, name: competition(comp).name, n: rs.length, known: known(rs),
      seasons: [seasonLabel(seasons[0]), seasonLabel(seasons[seasons.length - 1])],
      vsNaive: compareDays(rs, (r) => r.p, (r) => r.nv, { label: '(a) Naiv' }),
      vsSeason: compareDays(rs, (r) => r.p, (r) => r.ss, { label: '(b) Poisson på säsongens mål' }),
      advance: adv.length ? { n: adv.length, logLoss: round(advLL / adv.length), coin: round(Math.log(2)) } : null,
    };
  };
  const meta = (code) => {
    const r = variantResult.seasons.get(code);
    return { code, label: seasonLabel(code), partial: code === SEASON.fdcouk, through: r.through };
  };
  return {
    rulesVersion: BASE_RULES.version,
    ranAt: new Date().toISOString(),
    ms,
    bootstrap: { samples: BOOTSTRAP, level: 0.95, unit: 'matchdag' },
    seasons: codes.map(meta),
    first: seasonLabel(codes[0]),
    last: seasonLabel(codes[codes.length - 1]),
    matches: all.length,
    modelKnown: known(all),
    leagues: { n: league.length, known: known(league), vs: vsBaselines(league) },
    byDivision: LEAGUES.map((c) => {
      const rs = league.filter((r) => r.c === c);
      return { comp: c, name: competition(c).name, n: rs.length, known: known(rs), vs: vsBaselines(rs) };
    }),
    bySeason: codes.map((code) => {
      const rs = league.filter((r) => r.s === code);
      return { ...meta(code), n: rs.length, known: known(rs), vs: vsBaselines(rs) };
    }),
    cups: ['fac', 'lc'].map(cup).filter(Boolean),
    sources: sourceDates(),
    notes: [
      `Från ${seasonLabel(codes[0])}: ligorna finns från ${FIRST_YEAR}/${String((FIRST_YEAR + 1) % 100).padStart(2, '0')} och modellen behöver ${BASE_RULES.model.historySeasons} säsonger bakåt.`,
      'National League från 2005/06 – uppflyttade lag har kortare historik de första åren.',
      `Cupmatcher bara från ${HISTORY.espnFaCup.first}/${String((HISTORY.espnFaCup.first + 1) % 100).padStart(2, '0')} (FA-cupen, ESPN); EFL-cupens tidigare säsonger hämtas inte.`,
      '(c) är marknadssnittet vid öppning från 2005/06 (Betbrain t.o.m. 2018/19); Pinnacle vid stängning finns från 2012/13 och saknas 2026/27.',
    ],
  };
}

function sourceDates() {
  const out = {};
  for (const id of HIST_IDS) {
    const c = readCache(id);
    if (c) out[id] = c.fetchedAt;
  }
  return out;
}

function writeSummary(summary) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${summary.rulesVersion}.json`);
  fs.writeFileSync(file, JSON.stringify(summary, null, 1) + '\n');
  return file;
}

// Backtestet per regelversion som det ligger i repot (läses av bygget).
function readSummaries() {
  let names = [];
  try { names = fs.readdirSync(OUT_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.\d+\.json$/.test(f)); } catch { return []; }
  return names.sort().map((f) => {
    try { return JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8')); } catch { return null; }
  }).filter(Boolean);
}

function r6(xs) { return xs.map((x) => round(x, 6)); }
function round(x, d = 4) { const k = 10 ** d; return Math.round(x * k) / k; }

// ---------- kommandorad ----------

async function main() {
  const t0 = Date.now();
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
  const workers = arg('--workers') ? Number(arg('--workers')) : undefined;
  const res = await backtestVariants([{ id: 'base' }], { workers, log: (s) => console.log(s) });
  const summary = summarize(res.get('base'), { ms: Date.now() - t0 });
  const file = writeSummary(summary);
  print(summary);
  console.log(`\nSkrivet till ${path.relative(process.cwd(), file)} (${((Date.now() - t0) / 1000).toFixed(0)} s).`);
}

function print(s) {
  const f = (x) => (x == null ? '   –  ' : x.toFixed(3).replace('.', ','));
  const sg = (x) => (x > 0 ? '+' : '') + f(x);
  const line = (c) => (c.n ? `n=${String(c.n).padStart(5)} ${f(c.logLoss[0])} / ${f(c.logLoss[1])}  ${sg(c.diff)} [${sg(c.ci[0])}, ${sg(c.ci[1])}]` : 'n=0');
  console.log(`\nBacktest ${s.first}–${s.last}, regelversion ${s.rulesVersion}: ${s.modelKnown} av ${s.matches} matcher med modellprognos`);
  console.log('Ligorna, modell / baslinje i log-poäng, skillnad med 95 % KI (matchdagar dras om)');
  for (const c of s.leagues.vs) console.log(`  ${c.label.padEnd(30)} ${line(c)}  Brier ${f(c.brier && c.brier[0])} / ${f(c.brier && c.brier[1])}`);
  console.log('\nPer division');
  for (const d of s.byDivision) console.log(`  ${d.name.padEnd(16)} mot (b) ${line(d.vs[0])}   mot (c) ${line(d.vs[2])}`);
  console.log('\nPer säsong');
  for (const x of s.bySeason) console.log(`  ${x.label}${x.partial ? '*' : ' '} mot (b) ${line(x.vs[0])}   mot (c) ${line(x.vs[2])}`);
  for (const c of s.cups) {
    console.log(`\n${c.name} ${c.seasons[0]}–${c.seasons[1]}: mot (a) ${line(c.vsNaive)}; gå vidare ${c.advance ? `n=${c.advance.n} ${f(c.advance.logLoss)} (slantsingling ${f(c.advance.coin)})` : '–'}`);
  }
}

if (isMainThread && require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = {
  backtestVariants, recordsOf, compareDays, summarize, writeSummary, readSummaries, seasonsFor, seasonLabel,
  dataSignature, LEAGUES, OUT_DIR,
};
