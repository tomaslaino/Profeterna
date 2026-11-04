'use strict';

// Lokal utvecklingsserver. Den publicerade sajten (profeterna.se) är statisk
// och byggs av GitHub Actions; här görs samma bygge lokalt var 15:e minut och
// _site/ serveras precis som GitHub Pages gör.
//
// Analyserna, omgångarnas namn och kommentarerna skrivs på en dator med Claude Code
// (scripts/analyser/skriv.mjs). Här visas filerna som de ligger i data/.
//
// Kupongen: med KUPONG_LOKALT=1 i .env sparar knappen Spara kupongen direkt
// (POST /api/kupong) – lokalt skrivs filen i data/kuponger/ (eller
// KUPONG_DIR), inte på GitHub. Samma saveCoupon() som proxyn. Samma
// inställning slår på gängets egna tips inför uppgörelsen (GET/POST
// /api/samtal), som lokalt ligger som filer i data/cache/samtal/ (eller
// SAMTAL_DIR), och Stryktipset med Svenska folket (GET /api/stryktipset).

const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadEnv } = require('./src/env');
const { build, OUT } = require('./src/build');
const { CACHE_DIR } = require('./src/store');
const { COUPON_DIR, blobSha } = require('./src/coupons');

const TICK_MINUTES = 15;

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
      const r = await saveCoupon(req.body, { writer, loadMatches, efterAvspark: require('./config/kupong').efterAvspark });
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

// GET och POST /api/samtal – samma getRound()/postRound() som tjänsten, och
// som där startar veckans Stryktips som omgång när ingen pågår.
function samtalRoute(store = samtalFileStore(), loadMatches = siteMatches()) {
  return async (req, res) => {
    try {
      const { getRound, postRound } = await import('./worker/samtal.mjs');
      const { getStryktipset } = await import('./worker/stryktipset.mjs');
      const { gang } = require('./config/kupong');
      const auto = { draw: async () => (await getStryktipset()).body.omgang || null, loadMatches };
      const r = req.method === 'GET'
        ? await getRound({ store, gang, auto })
        : await postRound(req.body, { store, gang, loadMatches });
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[samtal]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

// GET /api/stryktipset[?nr=…] – samma getStryktipset() som tjänsten.
function stryktipsetRoute() {
  return async (req, res) => {
    try {
      const { getStryktipset } = await import('./worker/stryktipset.mjs');
      const r = await getStryktipset(req.query.nr);
      res.status(r.status).json(r.body);
    } catch (err) {
      console.error('[stryktipset]', err);
      res.status(500).json({ ok: false, error: 'Internt fel i servern.' });
    }
  };
}

if (require.main === module) {
  loadEnv();
  const couponEndpoint = process.env.KUPONG_LOKALT ? '/api/kupong' : null;

  const cycle = async () => {
    try {
      const { results, site } = await build({ couponEndpoint });
      const fetched = results.filter((r) => r.action === 'fetched').length;
      const errors = results.filter((r) => r.action === 'error');
      console.log(`[build] ${site.generatedAt}: ${fetched} källor hämtade, ${errors.length} fel, ${site.pages} matchsidor`);
      for (const e of errors) console.log(`        ${e.id}: ${e.error}`);
    } catch (err) {
      console.error('[build]', err);
    }
  };

  const app = express();
  if (couponEndpoint) app.post('/api/kupong', express.json({ limit: '20kb' }), couponSaveRoute());
  if (couponEndpoint) app.all('/api/samtal', express.json({ limit: '20kb' }), samtalRoute());
  if (couponEndpoint) app.get('/api/stryktipset', stryktipsetRoute());
  app.use(express.static(OUT));

  const port = parseInt(process.env.PORT || '3001', 10);
  app.listen(port, async () => {
    console.log(`Matchfixarna körs lokalt på http://localhost:${port}`);
    await cycle();
    setInterval(cycle, TICK_MINUTES * 60 * 1000);
  });
}

module.exports = { couponSaveRoute, couponFileWriter, samtalRoute, samtalFileStore, stryktipsetRoute, siteMatches };
