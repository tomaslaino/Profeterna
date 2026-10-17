'use strict';

// Bygger den statiska sajten i _site/: kopierar public/ och skriver de
// JSON-filer sidan läser. Körs av GitHub Actions enligt schema
// (.github/workflows/publicera.yml) och lokalt av utvecklingsservern.
//
//   data/meta.json         säsong, tävlingar, byggtid
//   data/sources.json      källtabell + täckning + omappade lagnamn
//   data/matches.json      hela säsongens matcher, kompakt
//   data/match/<id>.json   underlaget och prognosen för en match
//   data/model.json        regelversion, skattade storheter och kontrollen
//                          mot förra säsongen (fliken Modell)
//
// Den genererade datan committas inte (den skulle svälla repot med varje
// körning) – den laddas upp som Pages-artefakt. Källcachen i data/cache/
// sparas mellan körningarna med actions/cache.

const fs = require('fs');
const path = require('path');
const { refreshAll } = require('./refresh');
const { allMatches, matchIds, matchDetail } = require('./matches');
const { sourceReport } = require('./sourcetable');
const { forecastAll } = require('./forecast');
const { storedCheck } = require('./check');
const { wholePercent } = require('./model');
const rules = require('../config/forecast-rules');
const { COMPETITIONS, SEASON } = require('../config/competitions');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, '_site');

// Schemat i workflowen – visas på sidan så att besökaren vet hur färsk
// datan borde vara.
const UPDATE_EVERY_MINUTES = 30;

function writeSite(outDir = OUT) {
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
  let check = null;
  try {
    check = storedCheck();
  } catch (err) {
    console.error('[build] kontrollen:', err);
  }
  write('model.json', { rulesVersion: rules.version, model: forecast.model, error: forecast.error, check, ms: forecast.ms });

  const list = allMatches();
  for (const m of list.matches) m.f = compact(forecast.predictions.get(m.id));
  write('matches.json', list);

  // En trasig match får inte stoppa bygget – den saknar då bara sin sida.
  const failed = [];
  let pages = 0;
  for (const id of matchIds()) {
    try {
      const d = matchDetail(id);
      d.prediction = forecast.predictions.get(id) || null;
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
  return { generatedAt, pages, failed, counts: sources.counts, forecastMs: forecast.ms };
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

async function build({ force = false, fetch = true } = {}) {
  const results = fetch ? await refreshAll({ force }) : [];
  return { results, site: writeSite() };
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  const fetch = !process.argv.includes('--no-fetch');
  build({ force, fetch })
    .then(({ results, site }) => {
      for (const r of results) console.log(r.action.padEnd(8), r.id, r.error || '');
      const counts = Object.entries(site.counts).map(([k, v]) => `${v} ${k}`).join(', ');
      console.log(`Sajten byggd i _site/: ${site.pages} matchsidor, ${site.failed.length} fel, prognoser på ${site.forecastMs} ms. Källor: ${counts}.`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { build, writeSite, OUT, UPDATE_EVERY_MINUTES };
