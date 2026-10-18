'use strict';

// Bygger den statiska sajten i _site/: kopierar public/ och skriver de
// JSON-filer sidan läser. Körs av GitHub Actions enligt schema
// (.github/workflows/publicera.yml) och lokalt av utvecklingsservern.
//
//   data/meta.json         säsong, tävlingar, byggtid
//   data/sources.json      källtabell + täckning + omappade lagnamn
//   data/matches.json      hela säsongens matcher, kompakt
//   data/match/<id>.json   underlaget och prognosen för en match
//   data/model.json        regelversion, skattade storheter, backtestet och
//                          kandidatloggen (fliken Modell)
//   data/evaluation.json   journalen och utvärderingen mot facit (fliken
//                          Utvärdering)
//   data/divisions.json    statistik per division (sidan Statistik)
//   data/season.json       säsongsprognosen, modellens styrka för alla lag
//                          och programmet framåt (Tabeller → Säsongsprognos)
//   data/kuponger.json     gängets kuponger ur data/kuponger/ (fliken Kupong)
//   data/historik.json     färdiga kuponger med facit, betyg och AI:ns
//                          kommentar (sidan Historik, src/history.js)
//   data/journal/*.jsonl   prognosjournalen som den ligger i repot
//
// Matchanalysen (fas 5) görs inte i bygget utan på begäran i matchvyn, via en
// proxy (worker/). Bygget skriver bara i meta.json om knappen ska visas och
// vart den anropar (config/llm.js; avstängd som standard).
//
// Den genererade datan committas inte (den skulle svälla repot med varje
// körning) – den laddas upp som Pages-artefakt. Källcachen i data/cache/
// sparas mellan körningarna med actions/cache. Det enda som committas är
// prognosjournalen (data/journal/), som bara skrivs med --journal – det gör
// bygget på GitHub Actions, inte lokala byggen (se src/journal.js). Samma
// flagga fryser in färdiga kuponger och AI:ns kommentarer i
// data/kupong-historik.json, som också committas.

const fs = require('fs');
const path = require('path');
const { refreshAll } = require('./refresh');
const { allMatches, matchIds, matchDetail } = require('./matches');
const { sourceReport } = require('./sourcetable');
const { forecastAll } = require('./forecast');
const { readSummaries } = require('./backtest');
const { readLog } = require('./candidates');
const { readJournal, appendJournal, HORIZON_DAYS } = require('./journal');
const { evaluate } = require('./evaluate');
const { divisionStats } = require('./divisions');
const { playerFiles, teamSquad } = require('./players');
const { readCoupons, REPO, BRANCH } = require('./coupons');
const { buildHistory, writeComments } = require('./history');
const { wholePercent } = require('./model');
const rules = require('../config/forecast-rules');
const llm = require('../config/llm');
const kupongCfg = require('../config/kupong');
const { COMPETITIONS, SEASON } = require('../config/competitions');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, '_site');

// Schemat i workflowen – visas på sidan så att besökaren vet hur färsk
// datan borde vara.
const UPDATE_EVERY_MINUTES = 30;

// analysisEndpoint: undefined = enligt config/llm.js, null = ingen knapp,
// annars adressen (lokalt '/api/analyze', se server.js).
// couponEndpoint: Spara-knappen för kupongen – undefined = enligt
// config/kupong.js, null = ingen (bara GitHub-länken), annars adressen.
function writeSite(outDir = OUT, { journal = false, analysisEndpoint, couponEndpoint } = {}) {
  const tmp = `${outDir}.tmp`;
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.cpSync(PUBLIC, tmp, { recursive: true });
  const dataDir = path.join(tmp, 'data');
  fs.mkdirSync(path.join(dataDir, 'match'), { recursive: true });
  // Sannolikheter och skattningar sparas med fyra decimaler – sidan avrundar
  // själv till hela procent (ingen falsk precision i gränssnittet).
  const write = (rel, obj) => fs.writeFileSync(path.join(dataDir, rel), JSON.stringify(obj, roundNumbers));

  const generatedAt = new Date().toISOString();
  write('meta.json', {
    generatedAt,
    updateEveryMinutes: UPDATE_EVERY_MINUTES,
    season: SEASON.label,
    rulesVersion: rules.version,
    journalHorizonDays: HORIZON_DAYS,
    analysis: analysisInfo(analysisEndpoint),
    competitions: COMPETITIONS.map((c) => ({ id: c.id, name: c.name, short: c.short, type: c.type, espn: c.espn })),
  });
  const sources = sourceReport();
  write('sources.json', sources);

  // Prognosmotorn. Fallerar den byggs sajten ändå, utan prognoser och med
  // felet synligt under fliken Modell.
  let forecast = { predictions: new Map(), model: null, error: null };
  try {
    forecast = forecastAll();
  } catch (err) {
    forecast.error = String(err.message || err);
    console.error('[build] prognosmotorn:', err);
  }
  // Backtestet och kandidatjakten (fas 4) är för tunga för bygget – de körs
  // för hand (npm run backtest, npm run kandidater) och committas i
  // data/backtest/. Här läses de bara.
  let backtest = { current: null, versions: [], candidates: null };
  try {
    const all = readSummaries();
    backtest = {
      current: all.find((b) => b.rulesVersion === rules.version) || null,
      versions: all.map((b) => ({ rulesVersion: b.rulesVersion, ranAt: b.ranAt, first: b.first, last: b.last, leagues: b.leagues })),
      candidates: readLog(),
    };
  } catch (err) {
    console.error('[build] backtestet:', err);
  }
  write('model.json', { rulesVersion: rules.version, model: forecast.model, error: forecast.error, backtest, ms: forecast.ms });
  // Säsongsprognosen räknas i prognosmotorn (src/season.js) ur samma
  // skattningar. Saknas den visar sidan okänt med orsaken.
  write('season.json', forecast.season || { error: forecast.error || 'prognosmotorn gav ingen säsongsprognos' });

  // Divisionsstatistiken (sidan Statistik) är beskrivande och styr inte
  // prognoserna. Fallerar den saknas bara sidans siffror.
  let divisions;
  try {
    divisions = divisionStats();
  } catch (err) {
    console.error('[build] divisionerna:', err);
    divisions = { error: String(err.message || err) };
  }
  write('divisions.json', divisions);

  // Spelare per division (sidorna Tabeller och Statistik). Beskrivande och styr inte
  // prognoserna; fallerar det saknas bara sidans spelare.
  fs.mkdirSync(path.join(dataDir, 'players'), { recursive: true });
  try {
    for (const f of playerFiles()) write(f.path, f.data);
  } catch (err) {
    console.error('[build] spelarna:', err);
  }

  const list = allMatches();

  // Prognosjournalen: loggar kommande matcher vars prognos är ny (bara med
  // --journal), läser sedan hela journalen och rättar spelade matcher.
  // Varken journalen eller utvärderingen får stoppa bygget.
  let logged = [];
  if (journal && !forecast.error) {
    try {
      logged = appendJournal(list.matches, forecast.predictions);
    } catch (err) {
      console.error('[build] journalen:', err);
    }
  }
  let ev = { report: null, perMatch: new Map() };
  let journalFiles = [];
  try {
    const j = readJournal();
    journalFiles = j.files.map((f) => path.join(j.dir, f.name));
    ev = evaluate(j, list.matches, forecast.predictions);
  } catch (err) {
    console.error('[build] utvärderingen:', err);
    ev.error = String(err.message || err);
  }
  write('evaluation.json', { ...ev.report, error: ev.error || null });
  fs.mkdirSync(path.join(dataDir, 'journal'), { recursive: true });
  for (const f of journalFiles) fs.copyFileSync(f, path.join(dataDir, 'journal', path.basename(f)));

  for (const m of list.matches) {
    m.f = compact(forecast.predictions.get(m.id));
    const c = m.completed && ev.perMatch.get(m.id);
    if (c && c.counted) m.j = { p: c.counted.p ? wholePercent(c.counted.p) : null };
  }
  write('matches.json', list);

  // Kupongerna (fliken Kupong). Rättas på sidan mot matches.json och
  // liveställningen; en trasig kupongfil visas som fel men stoppar inget.
  let coupons;
  try {
    coupons = readCoupons();
  } catch (err) {
    console.error('[build] kupongerna:', err);
    coupons = { coupons: [], errors: [{ file: '', errors: [String(err.message || err)] }] };
  }
  write('kuponger.json', { repo: REPO, branch: BRANCH, dir: 'data/kuponger', save: couponSaveInfo(couponEndpoint), ...coupons });

  // Kuponghistoriken (sidan Historik): färdiga kuponger med facit och betyg.
  // Med --journal fryses nya färdiga kuponger in i data/kupong-historik.json.
  let history;
  try {
    history = buildHistory({ coupons: coupons.coupons, matches: list.matches, freeze: journal });
  } catch (err) {
    console.error('[build] kuponghistoriken:', err);
    history = { coupons: [], errors: [String(err.message || err)], frozen: [] };
  }
  write('historik.json', { comment: commentInfo(analysisEndpoint), coupons: history.coupons, errors: history.errors });

  // En trasig match får inte stoppa bygget – den saknar då bara sin sida.
  const failed = [];
  let pages = 0;
  for (const id of matchIds()) {
    try {
      const d = matchDetail(id);
      d.prediction = forecast.predictions.get(id) || null;
      d.journal = ev.perMatch.get(id) || null;
      // Trupperna (ESPN) visas i matchvyn men ingår inte i analysens underlag.
      d.squads = squads(d.match);
      // Bygget som underlaget kommer ur – matchanalysen jämför mot det.
      d.builtAt = generatedAt;
      write(`match/${id}.json`, d);
      pages++;
    } catch (err) {
      failed.push(id);
      console.error(`[build] match ${id}: ${err.message || err}`);
    }
  }

  // Byt hela katalogen på en gång, så att en halvfärdig sajt aldrig serveras.
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.renameSync(tmp, outDir);
  return { generatedAt, pages, failed, counts: sources.counts, forecastMs: forecast.ms, logged: logged.length, frozen: history.frozen.length };
}

function squads(m) {
  try {
    return { home: teamSquad(m.home), away: teamSquad(m.away) };
  } catch (err) {
    console.error(`[build] trupperna ${m.id}: ${err.message || err}`);
    return null;
  }
}

function analysisInfo(override) {
  const endpoint = override !== undefined ? override : (llm.enabled ? llm.endpoint : null);
  return endpoint ? { endpoint, provider: llm.provider, model: llm.model, news: Boolean(llm.news) } : null;
}

// AI:ns kommentar till kupongerna går via samma proxy som analysen
// (…/analyze → …/kommentar, lokalt /api/kommentar).
// Kupongen sparas av tjänsten profeterna-kupong, som committar filen i repot
// (worker/kupong-proxy.mjs).
function couponSaveInfo(override) {
  if (override !== undefined) return override;
  return kupongCfg.enabled ? kupongCfg.endpoint : null;
}

function commentInfo(override) {
  const a = analysisInfo(override);
  return a ? { endpoint: a.endpoint.replace(/analyze$/, 'kommentar') } : null;
}

// Kompakt prognos för matchlistan: hela procent 1 · X · 2 (summa 100), och
// om ett lag saknar egen lagdata (under National League).
function compact(p) {
  if (!p || p.status !== 'ok') return null;
  const out = { p: wholePercent(p.p) };
  if (p.teams.home.basis !== 'eget' || p.teams.away.basis !== 'eget') out.lower = true;
  return out;
}

function roundNumbers(key, v) {
  return typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 10000) / 10000 : v;
}

async function build({ force = false, fetch = true, journal = false, analysisEndpoint, couponEndpoint } = {}) {
  const results = fetch ? await refreshAll({ force }) : [];
  const site = writeSite(OUT, { journal, analysisEndpoint, couponEndpoint });
  // AI:ns kommentarer skrivs in i historiken efter bygget: proxyn läser
  // kupongen ur den publicerade sajten (se src/history.js).
  site.comments = 0;
  if (journal) {
    try {
      const c = commentInfo(analysisEndpoint);
      site.comments = (await writeComments({ endpoint: c && c.endpoint })).length;
    } catch (err) {
      console.error('[build] kommentarerna:', err);
    }
  }
  return { results, site };
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  const fetch = !process.argv.includes('--no-fetch');
  const journal = process.argv.includes('--journal');
  build({ force, fetch, journal })
    .then(({ results, site }) => {
      for (const r of results) console.log(r.action.padEnd(8), r.id, r.error || '');
      const counts = Object.entries(site.counts).map(([k, v]) => `${v} ${k}`).join(', ');
      console.log(`Sajten byggd i _site/: ${site.pages} matchsidor, ${site.failed.length} fel, prognoser på ${site.forecastMs} ms. Källor: ${counts}.`);
      console.log(journal ? `Prognosjournalen: ${site.logged} nya rader.` : 'Prognosjournalen: bara läst (skrivs med --journal).');
      if (journal) console.log(`Kuponghistoriken: ${site.frozen} nya kuponger, ${site.comments} nya kommentarer.`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { build, writeSite, OUT, UPDATE_EVERY_MINUTES };
