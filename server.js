'use strict';

// Lokal utvecklingsserver. Den publicerade sajten (profeterna.se) är statisk
// och byggs av GitHub Actions; här görs samma bygge lokalt var 15:e minut och
// _site/ serveras precis som GitHub Pages gör.
//
// Matchanalysen (fas 5): finns DEEPSEEK_API_KEY i .env visas knappen
// Analysera, och servern gör analysen själv (POST /api/analyze) med samma kod
// som proxyn på Cloudflare (worker/index.mjs). Utan nyckel ingen knapp.
// Samma nyckel ger AI:ns kommentarer på sidan Historik (POST /api/kommentar)
// och, med KUPONG_LOKALT, omgångens namn (POST /api/namn).
//
// Kupongen: med KUPONG_LOKALT=1 i .env sparar knappen Spara kupongen direkt
// (POST /api/kupong) – lokalt skrivs filen i data/kuponger/ (eller
// KUPONG_DIR), inte på GitHub. Samma saveCoupon() som proxyn. Samma
// inställning slår på gängets egna tips inför uppgörelsen (GET/POST
// /api/samtal), som lokalt ligger som filer i data/cache/samtal/ (eller
// SAMTAL_DIR).

const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadEnv } = require('./src/env');
const { build, OUT } = require('./src/build');
const { CACHE_DIR } = require('./src/store');
const { COUPON_DIR, blobSha } = require('./src/coupons');
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

// POST /api/namn {id} – AI:ns namn på omgången som gänget tippar, ur
// omgången i samtalets lagring och matcherna och tabellerna i siteDir.
function nameRoute(siteDir = OUT, samtal = samtalFileStore(), store = fileStore(path.join(CACHE_DIR, 'namn'))) {
  return async (req, res) => {
    try {
      const { nameRound, teamRanks } = await import('./worker/index.mjs');
      const read = (p) => {
        const f = path.join(siteDir, 'data', p);
        return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
      };
      const r = await nameRound(req.body && req.body.id, {
        env: process.env,
        store,
        loadRound: async (id) => {
          const cur = await samtal.get('samtal:aktuellt');
          return cur && cur.id === id ? cur : samtal.get(`samtal:${id}`);
        },
        loadSite: async () => ({
          matches: (read('matches.json') || {}).matches || [],
          teams: teamRanks(['pl', 'ch', 'l1', 'l2'].map((c) => read(`teams/${c}.json`))),
        }),
      });
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[namn]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

// Lokalt skrivs kupongen som fil i stället för med en commit på GitHub –
// med samma versionskontroll (filens blob-sha) som GitHubs API.
function couponFileWriter(dir = COUPON_DIR) {
  const file = (p) => path.join(dir, path.basename(p));
  const read = (p) => {
    if (!fs.existsSync(file(p))) return null;
    const buf = fs.readFileSync(file(p));
    return { sha: blobSha(buf), text: buf.toString('utf8') };
  };
  return {
    get: async (p) => read(p),
    put: async (p, text, { sha } = {}) => {
      const cur = read(p);
      if (cur ? cur.sha !== sha : sha) throw Object.assign(new Error('konflikt'), { conflict: true });
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file(p), text);
      return { url: null, sha: blobSha(Buffer.from(text, 'utf8')) };
    },
    remove: async (p, { sha } = {}) => {
      const cur = read(p);
      if (!cur) return { url: null };
      if (cur.sha !== sha) throw Object.assign(new Error('konflikt'), { conflict: true });
      fs.unlinkSync(file(p));
      return { url: null };
    },
  };
}

// Sajtens matcher (avsparkstiderna) ur den byggda sajten i siteDir.
function siteMatches(siteDir = OUT) {
  return async () => JSON.parse(fs.readFileSync(path.join(siteDir, 'data', 'matches.json'), 'utf8')).matches || [];
}

// POST /api/kupong {kupong, andra, bas, ändå} eller {bort, bas}.
function couponSaveRoute(writer = couponFileWriter(), loadMatches = siteMatches()) {
  return async (req, res) => {
    try {
      const { saveCoupon } = await import('./worker/kupong.mjs');
      const r = await saveCoupon(req.body, { writer, loadMatches });
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[kupong]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

// Tipsens lagring lokalt: en fil per nyckel (på Cloudflare KV).
function samtalFileStore(dir = process.env.SAMTAL_DIR || path.join(CACHE_DIR, 'samtal')) {
  const file = (k) => path.join(dir, k.replace(/[^\w.-]/g, '_') + '.json');
  return {
    get: async (k) => (fs.existsSync(file(k)) ? JSON.parse(fs.readFileSync(file(k), 'utf8')) : null),
    put: async (k, v) => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file(k), JSON.stringify(v));
    },
  };
}

// GET och POST /api/samtal – samma getRound()/postRound() som tjänsten.
function samtalRoute(store = samtalFileStore(), loadMatches = siteMatches()) {
  return async (req, res) => {
    try {
      const { getRound, postRound } = await import('./worker/samtal.mjs');
      const { gang } = require('./config/kupong');
      const r = req.method === 'GET'
        ? await getRound({ store, gang })
        : await postRound(req.body, { store, gang, loadMatches });
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[samtal]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

if (require.main === module) {
  loadEnv();
  const analysisEndpoint = process.env[llm.keyEnv] ? '/api/analyze' : null;
  const couponEndpoint = process.env.KUPONG_LOKALT ? '/api/kupong' : null;

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
  if (couponEndpoint) app.all('/api/samtal', express.json({ limit: '20kb' }), samtalRoute());
  if (analysisEndpoint && couponEndpoint) app.post('/api/namn', express.json(), nameRoute());
  app.use(express.static(OUT));

  const port = parseInt(process.env.PORT || '3001', 10);
  app.listen(port, async () => {
    console.log(`Matchfixarna körs lokalt på http://localhost:${port}`);
    console.log(analysisEndpoint
      ? `Matchanalysen: på (${llm.provider}, ${llm.model}).`
      : `Matchanalysen: av (ingen ${llm.keyEnv} i .env).`);
    await cycle();
    setInterval(cycle, TICK_MINUTES * 60 * 1000);
  });
}

module.exports = { analysisRoute, commentRoute, nameRoute, couponSaveRoute, couponFileWriter, samtalRoute, samtalFileStore, siteMatches, fileStore };
