'use strict';

// Lokal utvecklingsserver. Den publicerade sajten (profeterna.se) är statisk
// och byggs av GitHub Actions; här görs samma bygge lokalt var 15:e minut och
// _site/ serveras precis som GitHub Pages gör.
//
// Matchanalysen (fas 5): finns DEEPSEEK_API_KEY i .env visas knappen
// Analysera, och servern gör analysen själv (POST /api/analyze) med samma kod
// som proxyn på Cloudflare (worker/index.mjs). Utan nyckel ingen knapp.

const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadEnv } = require('./src/env');
const { build, OUT } = require('./src/build');
const { CACHE_DIR } = require('./src/store');
const llm = require('./config/llm');

const TICK_MINUTES = 15;

// Cachen för analyserna: en fil per match och underlag.
function fileStore(dir = path.join(CACHE_DIR, 'analysis')) {
  const file = (k) => path.join(dir, k.replace(/[^\w.-]/g, '_') + '.json');
  return {
    get: (k) => (fs.existsSync(file(k)) ? JSON.parse(fs.readFileSync(file(k), 'utf8')) : null),
    put: (k, v) => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file(k), JSON.stringify(v));
    },
  };
}

// POST /api/analyze {id} – underlaget läses ur den byggda sajten i siteDir.
function analysisRoute(siteDir = OUT, store = fileStore()) {
  return async (req, res) => {
    try {
      const { analyze } = await import('./worker/index.mjs');
      const r = await analyze(req.body && req.body.id, {
        env: process.env,
        store,
        loadMatch: async (id) => {
          const f = path.join(siteDir, 'data', 'match', `${id}.json`);
          return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
        },
      });
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[analys]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

if (require.main === module) {
  loadEnv();
  const analysisEndpoint = process.env[llm.keyEnv] ? '/api/analyze' : null;

  const cycle = async () => {
    try {
      const { results, site } = await build({ analysisEndpoint });
      const fetched = results.filter((r) => r.action === 'fetched').length;
      const errors = results.filter((r) => r.action === 'error');
      console.log(`[build] ${site.generatedAt}: ${fetched} källor hämtade, ${errors.length} fel, ${site.pages} matchsidor`);
      for (const e of errors) console.log(`        ${e.id}: ${e.error}`);
    } catch (err) {
      console.error('[build]', err);
    }
  };

  const app = express();
  if (analysisEndpoint) app.post('/api/analyze', express.json(), analysisRoute());
  app.use(express.static(OUT));

  const port = parseInt(process.env.PORT || '3001', 10);
  app.listen(port, async () => {
    console.log(`Profeterna körs lokalt på http://localhost:${port}`);
    console.log(analysisEndpoint
      ? `Matchanalysen: på (${llm.provider}, ${llm.model}).`
      : `Matchanalysen: av (ingen ${llm.keyEnv} i .env).`);
    await cycle();
    setInterval(cycle, TICK_MINUTES * 60 * 1000);
  });
}

module.exports = { analysisRoute, fileStore };
