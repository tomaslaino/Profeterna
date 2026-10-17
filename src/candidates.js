'use strict';

// ============================================================================
// Kandidatjakten (fas 4). En faktor får påverka prognosen först när den
// bevisligen förbättrat den out-of-sample – walk-forward över tidigare
// säsonger, jämfört med grundmodellen på samma matcher. Samma princip som
// kandidatjakten i Gräva guld: kravet är skrivet INNAN körningen, och allt
// som prövats loggas med utfall och datum, även det som inte fungerade, så
// att samma idé inte prövas igen utan ny evidens.
//
//   npm run kandidater   kör grundmodellen och alla kandidater walk-forward
//                        (~10 min på 9 trådar första gången; avslutade
//                        säsonger cachas), loggar utfallet i
//                        data/backtest/candidates.json och skriver backtestet
//                        för grundmodellen (data/backtest/<regelversion>.json)
//
// Körs för hand när tillräckligt många nya matcher spelats – inte i bygget.
// En kandidat som klarar kravet ändrar INTE prognosen av sig själv: den blir
// en ny regelversion med datum i config/forecast-rules.js först efter beslut,
// eftersom det ändrar prognoserna som loggas i journalen från nästa körning.
//
// Två slags kandidater:
//   regel   ett annat värde på ett reglage i config/forecast-rules.js
//           (halveringstid, fönster, cupmatcher, hemmafördel, skott, xG).
//           Hela walk-forward-backtestet körs om med värdet – samma kod som
//           den skarpa prognosen.
//   faktor  en signal ovanpå grundmodellen (form, tabelläge, inbördes möten,
//           marknaden). Signalens vikt skattas säsong för säsong enbart på
//           TIDIGARE säsongers prognoser (expanderande fönster) och används
//           på nästa – aldrig på säsongen den skattats på. Första säsongen
//           saknar därför skattning och räknas inte.
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const rules = require('../config/forecast-rules');
const { SEASON, competition } = require('../config/competitions');
const B = require('./backtest');
const F = require('./forecast');
const M = require('./model');
const { logLoss, brier } = require('./check');
const { readCache, writeCache, ageHours } = require('./store');

const LOG_FILE = path.join(B.OUT_DIR, 'candidates.json');

// ---------- kravet (förhandsregistrerat 2026-10-17, före första körningen) ----------

const CRITERIA = {
  registered: '2026-10-17',
  alpha: 0.05,
  text: [
    'Walk-forward: varje prognos skattas bara på matcher före matchdagen, och en faktors vikt bara på tidigare säsonger.',
    'Log-poäng: kandidat − grundmodell under noll på samma matcher, med hela bootstrap-intervallet under noll (matchdagar dras om). Intervallet är 95 % justerat för antalet kandidater i körningen (Bonferroni).',
    'Stabilt: lägre log-poäng i både första och andra halvan av säsongerna.',
    'Brier-poängen får inte bli sämre.',
  ],
};

// ---------- kandidaterna ----------

// Varje kandidats värden är a priori-val, gjorda innan körningen och inte
// anpassade till utfallen. scope: vilka matcher som jämförs (de kandidaten
// kan påverka). from: första säsongens startår där underlaget finns.
const CANDIDATES = [
  {
    id: 'half_life_180', kind: 'regel', label: 'Halveringstid 180 dagar',
    motive: 'Senare matcher väger tyngre – fångar form och förändrade trupper snabbare.',
    rules: { model: { halfLifeDays: 180 } },
  },
  {
    id: 'half_life_730', kind: 'regel', label: 'Halveringstid 730 dagar',
    motive: 'Stabilare skattning med mer underlag per lag.',
    rules: { model: { halfLifeDays: 730 } },
  },
  {
    id: 'window_2', kind: 'regel', label: 'Fönster två säsonger bakåt',
    motive: 'Gamla säsonger kan beskriva lag som inte längre finns i samma form.',
    rules: { model: { historySeasons: 2 } },
  },
  {
    id: 'window_6', kind: 'regel', label: 'Fönster sex säsonger bakåt',
    motive: 'Mer underlag för lag som flyttats mellan divisionerna.',
    rules: { model: { historySeasons: 6 } },
  },
  {
    id: 'home_per_division', kind: 'regel', label: 'Hemmafördel per division',
    motive: 'Hemmafördelen kan skilja mellan nivåerna (resor, publik, planer).',
    rules: { model: { homeAdvantage: 'perDivision' } },
  },
  {
    id: 'cups_excluded', kind: 'regel', label: 'Cupmatcher utanför skattningen',
    motive: 'Rotation i cuperna kan ge en missvisande bild av lagens styrka.',
    rules: { model: { includeCups: false } }, from: 2021,
    scopeText: 'FA-cupen finns i historiken från 2021/22',
  },
  {
    id: 'cups_half_weight', kind: 'regel', label: 'Cupmatcher med halv vikt (rotation)',
    motive: 'Kompromiss: cupmötena kopplar ihop nivåerna, men storlagen roterar.',
    rules: { model: { cupWeight: 0.5 } }, from: 2021,
    scopeText: 'FA-cupen finns i historiken från 2021/22',
  },
  {
    id: 'shots_on_target', kind: 'regel', label: 'Skott på mål i skattningen (hälften)',
    motive: 'Skott på mål är mindre slumpmässiga än mål och borde mäta styrka bättre.',
    rules: { model: { shotsBlend: 0.5 } },
    scopeText: 'football-data.co.uk, ligorna; National League saknar skott från 2016/17',
  },
  {
    id: 'xg_understat', kind: 'regel', label: 'xG i skattningen (hälften), Premier League',
    motive: 'xG är det vanligaste måttet på chanskvalitet; finns fritt för Premier League.',
    rules: { model: { xgBlend: 0.5 } }, from: 2014, comps: ['pl'], needs: 'understat',
    scopeText: 'Understat, Premier League från 2014/15',
  },
  {
    id: 'form_last5', kind: 'faktor', label: 'Form: poäng per match, senaste fem',
    motive: 'Lag i form kan vara bättre än deras tidsviktade styrka säger.',
    covariate: 'form',
  },
  {
    id: 'table_ppg', kind: 'faktor', label: 'Tabelläge: poäng per match i år',
    motive: 'Tabellen sammanfattar säsongen och kan bära information utöver målen.',
    covariate: 'table', comps: ['pl', 'ch', 'l1', 'l2'],
    scopeText: 'ligamatcher; tabellen räknas ur resultaten (utan poängavdrag)',
  },
  {
    id: 'head_to_head', kind: 'faktor', label: 'Inbördes möten: målskillnad, senaste sex',
    motive: 'Vissa lag kan passa eller inte passa varandra.',
    covariate: 'h2h',
  },
  {
    id: 'market_blend', kind: 'faktor', label: 'Marknadens odds som faktor',
    motive: 'Marknaden har information modellen saknar (skador, startelvor, motivation).',
    covariate: 'market', comps: ['pl', 'ch', 'l1', 'l2'], combine: false,
    scopeText: 'ligamatcher med marknadssnitt (öppning) från 2005/06; vikten skattas på tidigare säsonger',
  },
];

// Det som inte går att pröva än – och varför. Loggas också.
const UNTESTABLE = [
  { id: 'xg_fdcouk', label: 'xG från football-data.co.uk', reason: 'Finns bara från 2026/27 (inga tidigare säsonger att pröva på), och leverantören är odokumenterad. Prövas när säsongen gett tillräckligt med matcher.' },
  { id: 'injuries', label: 'Skador och avstängningar (FPL)', reason: 'FPL ger bara dagens läge – ingen historik att pröva walk-forward på. Bara Premier League.' },
  { id: 'lineups', label: 'Startelvor', reason: 'Ingen fri källa med historik; publiceras först strax före avspark.' },
  { id: 'table_deductions', label: 'Tabelläge med poängavdrag (ESPN)', reason: 'ESPN:s tabell är en ögonblicksbild utan historik. Prövas i stället som tabell räknad ur resultaten.' },
  { id: 'rotation_lc', label: 'Rotation i EFL-cupen', reason: 'EFL-cupens tidigare säsonger hämtas inte – rotationen prövas på FA-cupen 2021/22–.' },
  { id: 'market_cups', label: 'Marknadens odds i cuperna', reason: 'Fri cupoddshistorik saknas (DraftKings via ESPN är luckig); kan bara utvärderas framåt i journalen.' },
];

// ---------- faktorernas signaler (punkt-i-tiden) ----------

// Signal per backtestpost, alltid från hemmalagets håll och bara ur matcher
// före matchdagen. 0 = okänd – då ändras inte prognosen.
function covariates(records) {
  const { seasonData, LOWER } = require('./modeldata');
  const data = seasonData(SEASON.fdcouk);
  const games = data.games.map((g) => ({ ...g, day: F.dayNum(g.date) })).sort((a, b) => a.day - b.day);
  const team = new Map();
  const pair = new Map();
  const push = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };
  for (const g of games) {
    const ph = g.hg > g.ag ? 3 : g.hg === g.ag ? 1 : 0;
    const pa = g.hg < g.ag ? 3 : g.hg === g.ag ? 1 : 0;
    if (g.h !== LOWER) push(team, g.h, { day: g.day, pts: ph });
    if (g.a !== LOWER) push(team, g.a, { day: g.day, pts: pa });
    if (g.h !== LOWER && g.a !== LOWER) push(pair, [g.h, g.a].sort().join('|'), { day: g.day, h: g.h, gd: g.hg - g.ag });
  }
  // Index för första posten på eller efter dagen (dvs. antal poster före).
  const before = (arr, day) => {
    let lo = 0;
    let hi = arr ? arr.length : 0;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid].day < day) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const ppg = (arr, day, n) => {
    if (!arr) return null;
    const i = before(arr, day);
    if (i < n) return null;
    let s = 0;
    for (let k = i - n; k < i; k++) s += arr[k].pts;
    return s / n;
  };
  const tidx = F.tableIndex(games);
  const out = { form: new Map(), table: new Map(), h2h: new Map() };
  for (const r of records) {
    const day = F.dayNum(r.d);
    const fh = ppg(team.get(r.h), day, 5);
    const fa = ppg(team.get(r.a), day, 5);
    out.form.set(r.id, fh != null && fa != null ? fh - fa : 0);
    // Tabelläget: samma funktion som prognosmotorn (src/forecast.js).
    const t = F.tableSignal(tidx, r.s, r.c, r.h, r.a, day, 5);
    out.table.set(r.id, t ? t.z : 0);
    const meet = pair.get([r.h, r.a].sort().join('|'));
    const i = before(meet, day);
    let gd = 0;
    for (let k = Math.max(0, i - 6); k < i; k++) gd += meet[k].h === r.h ? meet[k].gd : -meet[k].gd;
    // Summan över de senaste sex mötena / 6: färre möten drar mot noll.
    out.h2h.set(r.id, gd / 6);
  }
  return out;
}

// ---------- faktorernas vikt (skattad på tidigare säsonger) ----------

// log λhemma += β·z, log λborta −= β·z (z = en signal per faktor); β med
// maximum likelihood (Poisson, grundmodellens förväntade mål som offset) –
// Newtons metod.
function fitBeta(rows) {
  const k = rows.length ? rows[0].z.length : 0;
  let beta = new Array(k).fill(0);
  for (let it = 0; it < 50; it++) {
    const g = new Array(k).fill(0);
    const h = Array.from({ length: k }, () => new Array(k).fill(0));
    for (const r of rows) {
      if (!r.z.some((x) => x)) continue;
      const lin = dot(beta, r.z);
      const eh = r.g[0] * Math.exp(lin);
      const ea = r.g[1] * Math.exp(-lin);
      for (let i = 0; i < k; i++) {
        g[i] += r.z[i] * (r.hg - eh - (r.ag - ea));
        for (let j = 0; j < k; j++) h[i][j] -= r.z[i] * r.z[j] * (eh + ea);
      }
    }
    const step = solve(h, g.map((x) => -x));
    if (!step) return beta.map(() => 0);
    beta = beta.map((b, i) => b + step[i]);
    if (Math.max(...step.map(Math.abs)) < 1e-9) break;
  }
  return beta;
}

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

// Löser A·x = b (litet system, Gauss med pivotering); null om singulärt.
function solve(A, b) {
  const n = b.length;
  const m = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-12) return null;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

function adjusted(r, beta) {
  if (!r.z.some((x) => x)) return r.p;
  const lin = dot(beta, r.z);
  return M.outcomes(M.scoreMatrix(r.g[0] * Math.exp(lin), r.g[1] * Math.exp(-lin), r.rho, rules.model.maxGoals)).x12;
}

// Log-linjär blandning med marknaden: p ∝ modell^(1−w) · marknad^w.
function blendMarket(p, m, w) {
  const q = p.map((x, i) => Math.exp((1 - w) * Math.log(Math.max(x, 1e-12)) + w * Math.log(Math.max(m[i], 1e-12))));
  const s = q[0] + q[1] + q[2];
  return q.map((x) => x / s);
}

function fitW(rows) {
  const ll = (w) => rows.reduce((s, r) => s + logLoss(blendMarket(r.p, r.mk, w), r.o), 0);
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = 0;
  let b = 1;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  let fc = ll(c);
  let fd = ll(d);
  for (let i = 0; i < 40 && b - a > 1e-4; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = ll(c); } else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = ll(d); }
  }
  return (a + b) / 2;
}

// ---------- utvärdering ----------

const yearOf = (code) => 2000 + Number(code.slice(0, 2));

function inScope(cand, r) {
  if (cand.comps && !cand.comps.includes(r.c)) return false;
  if (cand.from && yearOf(r.s) < cand.from) return false;
  return true;
}

// Par (kandidat, grundmodell) per match → mått, halvor och domslut.
function judge(cand, pairs, level, extra = {}) {
  const cmp = B.compareDays(pairs, (r) => r.cand, (r) => r.base, { level });
  if (!cmp.n) return { ...extra, n: 0, pass: false, why: 'inga matcher att jämföra på' };
  const seasons = [...new Set(pairs.map((r) => r.s))].sort();
  const cut = Math.ceil(seasons.length / 2);
  const halves = [seasons.slice(0, cut), seasons.slice(cut)].filter((h) => h.length).map((h) => {
    const set = new Set(h);
    const rs = pairs.filter((r) => set.has(r.s));
    const d = rs.reduce((s, r) => s + logLoss(r.cand, r.o) - logLoss(r.base, r.o), 0) / rs.length;
    return { seasons: [B.seasonLabel(h[0]), B.seasonLabel(h[h.length - 1])], n: rs.length, diff: round(d) };
  });
  const why = cmp.diff > 0 ? 'högre log-poäng än grundmodellen'
    : cmp.diff === 0 ? 'ingen skillnad mot grundmodellen'
    : cmp.ci[1] >= 0 ? 'intervallet når upp till noll – förbättringen kan vara slump'
    : !halves.every((h) => h.diff < 0) ? 'inte bättre i båda halvorna av säsongerna'
    : cmp.brierDiff > 0 ? 'sämre Brier-poäng'
    : null;
  return {
    ...extra,
    n: cmp.n,
    days: cmp.days,
    seasons: [B.seasonLabel(seasons[0]), B.seasonLabel(seasons[seasons.length - 1])],
    logLoss: cmp.logLoss,
    brier: cmp.brier,
    diff: cmp.diff,
    ci: cmp.ci,
    level: round(level, 5),
    brierDiff: cmp.brierDiff,
    halves,
    pass: !why,
    why: why || 'klarade kravet',
  };
}

function evalRule(cand, base, variant, level) {
  const byId = new Map(base.map((r) => [r.id, r]));
  const pairs = [];
  let lost = 0;
  let gained = 0;
  for (const c of variant) {
    if (!inScope(cand, c)) continue;
    const b = byId.get(c.id);
    if (!b) continue;
    if (b.p && !c.p) lost++;
    if (!b.p && c.p) gained++;
    if (b.p && c.p) pairs.push({ o: c.o, d: c.d, s: c.s, cand: c.p, base: b.p });
  }
  return judge(cand, pairs, level, { coverage: { lost, gained } });
}

const covariatesOf = (cand) => cand.covariates || [cand.covariate];

function evalFactor(cand, base, cov, level, parts = []) {
  const { pairs, params, rows } = factorPairs(cand, base, cov);
  const market = cand.covariate === 'market';
  const known = market ? rows.length : rows.filter((r) => r.z.some((x) => x)).length;
  // Vikten skattad på alla säsonger – det värde en ny regelversion skulle få.
  const final = market ? { w: round(fitW(rows)) } : { beta: fitBeta(rows).map((b) => round(b)) };
  const out = judge(cand, pairs, level, { signalKnown: known, of: rows.length, param: final, paramText: paramText(cand, final), params });
  // Kombinationen ska också vara bättre än var och en av delarna ensam, på
  // samma matcher.
  if (out.pass && parts.length) {
    const byId = new Map(pairs.map((p) => [p.id, p]));
    for (const part of parts) {
      const { pairs: pp } = factorPairs(part, base, cov);
      let d = 0;
      let n = 0;
      for (const p of pp) {
        const c = byId.get(p.id);
        if (c) { d += logLoss(c.cand, c.o) - logLoss(p.cand, p.o); n++; }
      }
      if (!(n && d / n < 0)) { out.pass = false; out.why = `inte bättre än ${part.label.split(':')[0].toLowerCase()} ensam`; break; }
    }
  }
  return out;
}

// Läsbar vikt: hur mycket en enhet av signalen flyttar de förväntade målen.
function paramText(cand, final) {
  if (final.w != null) {
    return final.w >= 0.995 ? 'marknadens vikt 100 % – modellen tillför inget utöver oddsen'
      : `marknadens vikt ${Math.round(final.w * 100)} %, modellens ${100 - Math.round(final.w * 100)} %`;
  }
  const unit = {
    form: 'poäng/match bättre form än motståndaren',
    table: 'poäng/match högre i tabellen än motståndaren',
    h2h: 'mål i målskillnad (snitt av de sex senaste mötena)',
  };
  return covariatesOf(cand).map((k, i) => {
    const pct = (Math.exp(final.beta[i]) - 1) * 100;
    return `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(1).replace('.', ',')} % mål per ${unit[k]}`;
  }).join('; ');
}

// Säsong för säsong: vikten skattas på tidigare säsonger och används på nästa.
function factorPairs(cand, base, cov) {
  const keys = covariatesOf(cand);
  const rows = base.filter((r) => r.p && inScope(cand, r) && (cand.covariate !== 'market' || r.mk))
    .map((r) => ({ ...r, z: cand.covariate === 'market' ? null : keys.map((k) => cov[k].get(r.id)) }));
  const seasons = [...new Set(rows.map((r) => r.s))].sort();
  const pairs = [];
  const params = [];
  for (let i = 1; i < seasons.length; i++) {
    const train = rows.filter((r) => r.s < seasons[i]);
    const test = rows.filter((r) => r.s === seasons[i]);
    if (cand.covariate === 'market') {
      const w = fitW(train);
      params.push({ season: B.seasonLabel(seasons[i]), w: round(w) });
      for (const r of test) pairs.push({ id: r.id, o: r.o, d: r.d, s: r.s, cand: blendMarket(r.p, r.mk, w), base: r.p });
    } else {
      const beta = fitBeta(train);
      params.push({ season: B.seasonLabel(seasons[i]), beta: beta.map((b) => round(b)) });
      for (const r of test) pairs.push({ id: r.id, o: r.o, d: r.d, s: r.s, cand: adjusted(r, beta), base: r.p });
    }
  }
  return { pairs, params, rows };
}

// ---------- Understat-historiken (bara kandidatjakten) ----------

async function ensureUnderstat(log) {
  const id = 'understat_hist_epl';
  const c = readCache(id);
  if (c && c.data && ageHours(c.fetchedAt) < 30 * 24) return { ok: true, fetchedAt: c.fetchedAt };
  try {
    const understat = require('./fetchers/understat');
    const { mapLimit } = require('./fetchers/http');
    const years = [];
    for (let y = 2014; y < 2000 + Number(SEASON.fdcouk.slice(0, 2)); y++) years.push(y);
    const seasons = {};
    await mapLimit(years, 3, async (y) => {
      const r = await understat.fetchLeague('EPL', y);
      seasons[y] = r.matches.filter((m) => m.played).map((m) => ({ kickoff: m.kickoff, home: m.home, away: m.away, goals: m.goals, xg: m.xg }));
    });
    writeCache(id, { fetchedAt: new Date().toISOString(), data: { seasons, sourceUrl: 'https://understat.com/league/EPL' } });
    log(`Understat: ${years.length} säsonger hämtade.`);
    return { ok: true, fetchedAt: new Date().toISOString() };
  } catch (err) {
    log(`Understat: hämtningen misslyckades (${err.message}) – ${c ? 'använder senaste lyckade' : 'xG-kandidaten kan inte prövas'}.`);
    return c && c.data ? { ok: true, fetchedAt: c.fetchedAt, stale: true } : { ok: false, error: err.message };
  }
}

// ---------- loggen ----------

function readLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch { return { criteria: CRITERIA, runs: [], entries: [], untestable: [] }; }
}

function writeLog(logData) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logData, null, 1) + '\n');
}

function defHash(c) {
  const { motive, label, ...rest } = c;
  return crypto.createHash('sha1').update(JSON.stringify(rest)).digest('hex').slice(0, 10);
}

// ---------- körningen ----------

async function main() {
  const t0 = Date.now();
  const log = (s) => console.log(s);
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
  const only = arg('--only') ? arg('--only').split(',') : null;
  const workers = arg('--workers') ? Number(arg('--workers')) : undefined;
  const today = new Date().toISOString().slice(0, 10);

  const us = await ensureUnderstat(log);
  const blocked = new Map();
  if (!us.ok) blocked.set('understat', `Understat svarade inte (${us.error}) och ingen tidigare historik finns.`);

  // Kandidater som redan blivit en regelversion prövas inte igen – de ingår i
  // grundmodellen.
  const promoted = new Map(Object.values(rules.factors || {}).map((f) => [f.candidate, f.since]));
  for (const [id, v] of promoted) log(`${id}: införd i regelversion ${v} – prövas inte igen.`);
  const list = CANDIDATES.filter((c) => (!only || only.includes(c.id)) && !promoted.has(c.id));
  const testable = list.filter((c) => !(c.needs && blocked.has(c.needs)));
  const k = testable.length;
  const level = 1 - CRITERIA.alpha / Math.max(1, k);

  const variants = [{ id: 'base' }, ...testable.filter((c) => c.kind === 'regel').map((c) => ({ id: c.id, rules: c.rules, from: c.from }))];
  const res = await B.backtestVariants(variants, { workers, log });
  const base = B.recordsOf(res.get('base'));
  const through = base.filter((r) => r.s === SEASON.fdcouk).map((r) => r.d).sort().pop() || null;
  const cov = testable.some((c) => c.kind === 'faktor') ? covariates(base) : null;

  const results = [];
  for (const c of list) {
    const blockedWhy = c.needs && blocked.get(c.needs);
    let r;
    if (blockedWhy) r = { n: 0, pass: false, untested: true, why: blockedWhy };
    else if (c.kind === 'regel') r = evalRule(c, base, B.recordsOf(res.get(c.id)), level);
    else r = evalFactor(c, base, cov, level);
    results.push({ c, r });
  }

  // Kombinationssteget: klarar flera faktorer kravet prövas de tillsammans
  // (vikterna skattas gemensamt) med samma krav – så som de skulle bli en
  // regelversion – och kombinationen måste dessutom slå varje del ensam.
  // Marknaden kombineras inte: den ersätter modellen snarare än justerar den.
  const combinable = results.filter(({ c, r }) => r.pass && c.kind === 'faktor' && c.combine !== false).map(({ c }) => c);
  if (combinable.length >= 2) {
    const combo = {
      id: `combo_${combinable.map((c) => c.id).join('+')}`,
      kind: 'kombination',
      label: `Kombination: ${combinable.map((c) => c.label.split(':')[0].toLowerCase()).join(' + ')}`,
      motive: 'De godkända faktorerna tillsammans, med vikterna skattade gemensamt – så som de skulle bli en regelversion.',
      covariates: combinable.map((c) => c.covariate),
      comps: combinable.every((c) => c.comps) ? combinable[0].comps : undefined,
    };
    results.push({ c: combo, r: evalFactor(combo, base, cov, level, combinable) });
  }

  // Grundmodellens backtest från samma körning.
  const summary = B.summarize(res.get('base'), { ms: null });
  const sumFile = B.writeSummary(summary);

  // Loggen: en ny post per kandidat när regelversion, data, matcher eller
  // kandidatens definition ändrats – en omkörning på samma underlag skriver
  // ingenting nytt.
  const L = readLog();
  L.criteria = CRITERIA;
  const run = { ranAt: new Date().toISOString(), rulesVersion: rules.version, data: B.dataSignature(), through, candidates: k, level: round(level, 5), seasons: [summary.first, summary.last] };
  let added = 0;
  for (const { c, r } of results) {
    const fp = `${rules.version}|${run.data}|${through}|${defHash(c)}|${k}`;
    const prev = [...L.entries].reverse().find((e) => e.id === c.id);
    if (prev && prev.fingerprint === fp) continue;
    L.entries.push({
      id: c.id, kind: c.kind, label: c.label, motive: c.motive, scope: c.scopeText || null,
      testedAt: today, rulesVersion: rules.version, through, fingerprint: fp,
      verdict: r.untested ? 'kunde inte prövas' : r.pass ? 'godkänd' : 'underkänd',
      ...r,
    });
    added++;
  }
  const prevUntestable = new Map((L.untestable || []).map((u) => [u.id, u]));
  L.untestable = UNTESTABLE.map((u) => {
    const p = prevUntestable.get(u.id);
    return { ...u, assessedAt: p && p.reason === u.reason ? p.assessedAt : today };
  });
  if (added) L.runs.push(run);
  writeLog(L);

  // Utskrift
  const f = (x) => (x == null ? '–' : (x > 0 ? '+' : '') + x.toFixed(4).replace('.', ','));
  console.log(`\nKandidatjakt ${today}, regelversion ${rules.version}, ${k} kandidater, intervall ${(level * 100).toFixed(2).replace('.', ',')} % (Bonferroni)`);
  for (const { c, r } of results) {
    console.log(`  ${c.label.padEnd(44)} ${r.n ? `n=${String(r.n).padStart(5)} ${r.seasons[0]}–${r.seasons[1]}  ${f(r.diff)} [${f(r.ci[0])}, ${f(r.ci[1])}]  halvor ${r.halves.map((h) => f(h.diff)).join(' / ')}  Brier ${f(r.brierDiff)}` : ''}  → ${r.pass ? 'GODKÄND' : 'underkänd'}: ${r.why}`);
  }
  console.log(`\n${added} nya poster i ${path.relative(process.cwd(), LOG_FILE)}; backtestet i ${path.relative(process.cwd(), sumFile)} (${((Date.now() - t0) / 1000).toFixed(0)} s).`);
  const passed = results.filter(({ r }) => r.pass);
  if (passed.length) {
    console.log(`\n${passed.length} kandidat(er) klarade kravet: ${passed.map(({ c }) => c.label).join(', ')}.`);
    console.log('Prognosen ändras INTE av sig själv. En ny regelversion (datum) i config/forecast-rules.js kräver beslut,');
    console.log('eftersom den ändrar prognoserna som loggas i journalen från nästa körning. Kör sedan npm run backtest.');
  }
}

function round(x, d = 4) { const m = 10 ** d; return Math.round(x * m) / m; }

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { CANDIDATES, UNTESTABLE, CRITERIA, readLog, LOG_FILE, covariates, factorPairs, evalFactor, fitBeta, blendMarket };
