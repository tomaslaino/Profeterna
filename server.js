'use strict';

// Lokal utvecklingsserver. Den publicerade sajten (profeterna.se) är statisk
// och byggs av GitHub Actions; här görs samma bygge lokalt var 15:e minut och
// _site/ serveras precis som GitHub Pages gör.
//
// Matchanalysen (fas 5): finns DEEPSEEK_API_KEY i .env visas knappen
// Analysera, och servern gör analysen själv (POST /api/analyze) med samma kod
// som proxyn på Cloudflare (worker/index.mjs). Utan nyckel ingen knapp.
// Samma nyckel ger AI:ns kommentarer på sidan Historik (POST /api/kommentar).
//
// Kupongen: finns KUPONG_KOD i .env sparar knappen Spara kupongen direkt
// (POST /api/kupong) – lokalt skrivs filen i data/kuponger/ (eller
// KUPONG_DIR), inte på GitHub. Samma saveCoupon() som proxyn.

const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadEnv } = require('./src/env');
const { build, OUT } = require('./src/build');
const { CACHE_DIR } = require('./src/store');
const { COUPON_DIR } = require('./src/coupons');
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

// POST /api/kommentar {id} – AI:ns kommentar till en färdig kupong, ur den
// byggda historiken i siteDir (sidan Historik).
function commentRoute(siteDir = OUT, store = fileStore(path.join(CACHE_DIR, 'kommentarer'))) {
  return async (req, res) => {
    try {
      const { couponComment } = await import('./worker/index.mjs');
      const r = await couponComment(req.body && req.body.id, {
        env: process.env,
        store,
        loadHistory: async () => {
          const f = path.join(siteDir, 'data', 'historik.json');
          return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
        },
      });
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[kommentar]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

// Lokalt skrivs kupongen som fil i stället för med en commit på GitHub.
function couponFileWriter(dir = COUPON_DIR) {
  const file = (p) => path.join(dir, path.basename(p));
  return {
    get: async (p) => (fs.existsSync(file(p)) ? { sha: 'lokal' } : null),
    put: async (p, text) => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file(p), text);
      return { url: null };
    },
  };
}

// POST /api/kupong {kod, kupong, andra} – kodordet ur KUPONG_KOD.
function couponSaveRoute(writer = couponFileWriter()) {
  const wrong = new Map(); // fel kodord per IP-adress, glöms efter en timme
  return async (req, res) => {
    try {
      const { saveCoupon } = await import('./worker/kupong.mjs');
      const ip = req.ip;
      const r = await saveCoupon(req.body, {
        env: process.env,
        writer,
        limiter: {
          count: async () => ((wrong.get(ip) || {}).until > Date.now() ? wrong.get(ip).n : 0),
          bump: async () => {
            const w = wrong.get(ip);
            wrong.set(ip, w && w.until > Date.now() ? { n: w.n + 1, until: w.until } : { n: 1, until: Date.now() + 3600000 });
          },
        },
      });
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[kupong]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

if (require.main === module) {
  loadEnv();
  const analysisEndpoint = process.env[llm.keyEnv] ? '/api/analyze' : null;
  const couponEndpoint = process.env.KUPONG_KOD ? '/api/kupong' : null;

  const cycle = async () => {
    try {
      const { results, site } = await build({ analysisEndpoint, couponEndpoint });
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
  if (analysisEndpoint) app.post('/api/kommentar', express.json(), commentRoute());
  if (couponEndpoint) app.post('/api/kupong', express.json({ limit: '20kb' }), couponSaveRoute());
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

module.exports = { analysisRoute, commentRoute, couponSaveRoute, couponFileWriter, fileStore };
