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
// bygget på GitHub Actions, inte lokala byggen (se src/journal.js).

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
const { playerFiles, teamSquad } = require('./players');
const { wholePercent } = require('./model');
const rules = require('../config/forecast-rules');
const llm = require('../config/llm');
const { COMPETITIONS, SEASON } = require('../config/competitions');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, '_site');

// Schemat i workflowen – visas på sidan så att besökaren vet hur färsk
// datan borde vara.
const UPDATE_EVERY_MINUTES = 30;

// analysisEndpoint: undefined = enligt config/llm.js, null = ingen knapp,
// annars adressen (lokalt '/api/analyze', se server.js).
function writeSite(outDir = OUT, { journal = false, analysisEndpoint } = {}) {
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
    competitions: COMPETITIONS.map((c) => ({ id: c.id, name: c.name, short: c.short, type: c.type })),
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

  // Spelare per division (sidan Divisioner). Beskrivande och styr inte
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
  return { generatedAt, pages, failed, counts: sources.counts, forecastMs: forecast.ms, logged: logged.length };
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
  return endpoint ? { endpoint, provider: llm.provider, model: llm.model } : null;
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

async function build({ force = false, fetch = true, journal = false, analysisEndpoint } = {}) {
  const results = fetch ? await refreshAll({ force }) : [];
  return { results, site: writeSite(OUT, { journal, analysisEndpoint }) };
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
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { build, writeSite, OUT, UPDATE_EVERY_MINUTES };
