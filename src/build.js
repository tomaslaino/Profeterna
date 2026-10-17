'use strict';

// Bygger den statiska sajten i _site/: kopierar public/ och skriver de
// JSON-filer sidan läser. Körs av GitHub Actions enligt schema
// (.github/workflows/publicera.yml) och lokalt av utvecklingsservern.
//
//   data/meta.json         säsong, tävlingar, byggtid
//   data/sources.json      källtabell + täckning + omappade lagnamn
//   data/matches.json      hela säsongens matcher, kompakt
//   data/match/<id>.json   underlaget för en match
//
// Den genererade datan committas inte (den skulle svälla repot med varje
// körning) – den laddas upp som Pages-artefakt. Källcachen i data/cache/
// sparas mellan körningarna med actions/cache.

const fs = require('fs');
const path = require('path');
const { refreshAll } = require('./refresh');
const { allMatches, matchIds, matchDetail } = require('./matches');
const { sourceReport } = require('./sourcetable');
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
  const write = (rel, obj) => fs.writeFileSync(path.join(dataDir, rel), JSON.stringify(obj));

  const generatedAt = new Date().toISOString();
  write('meta.json', {
    generatedAt,
    updateEveryMinutes: UPDATE_EVERY_MINUTES,
    season: SEASON.label,
    competitions: COMPETITIONS.map((c) => ({ id: c.id, name: c.name, short: c.short, type: c.type })),
  });
  const sources = sourceReport();
  write('sources.json', sources);
  write('matches.json', allMatches());

  // En trasig match får inte stoppa bygget – den saknar då bara sin sida.
  const failed = [];
  let pages = 0;
  for (const id of matchIds()) {
    try {
      write(`match/${id}.json`, matchDetail(id));
      pages++;
    } catch (err) {
      failed.push(id);
      console.error(`[build] match ${id}: ${err.message || err}`);
    }
  }

  // Byt hela katalogen på en gång, så att en halvfärdig sajt aldrig serveras.
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.renameSync(tmp, outDir);
  return { generatedAt, pages, failed, counts: sources.counts };
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
      console.log(`Sajten byggd i _site/: ${site.pages} matchsidor, ${site.failed.length} fel. Källor: ${counts}.`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { build, writeSite, OUT, UPDATE_EVERY_MINUTES };
