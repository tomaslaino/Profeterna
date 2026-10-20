// Tjänsten profeterna-kupong – Cloudflare Worker som sparar gängets kupong
// direkt från sidan (worker/kupong.mjs). Egen tjänst, skild från proxyn för
// matchanalysen: GitHub-nyckeln finns bara här, och tjänsten gör inget annat
// än att committa en kontrollerad kupongfil i data/kuponger/ – och hålla
// gängets egna tips inför uppgörelsen (worker/samtal.mjs, i KV, inte på GitHub).
//
//   POST /kupong {"kupong", "andra", "bas", "ändå"}   (se worker/kupong.mjs)
//   POST /kupong {"bort", "bas"}                       ta bort en kupong
//   GET  /samtal · POST /samtal {"gor", …}             (se worker/samtal.mjs; GET startar
//                                                      veckans Stryktips som omgång)
//   GET  /stryktipset[?nr=…]                           veckans Stryktips och Svenska
//                                                      folket (se worker/stryktipset.mjs)
//
// Driftsätts för hand med worker/kupong.toml; hemligheten GITHUB_TOKEN läggs
// in med "wrangler secret put" (README, avsnittet Kupongen).
//
// Avsparkstiderna (startade matcher är låsta) läses ur den publicerade
// sajten, <site>/data/matches.json – samma sajt som matchanalysens proxy
// läser (config/llm.js, eller SITE).

import cfg from '../config/llm.js';
import kupongCfg from '../config/kupong.js';
import { saveCoupon, githubWriter } from './kupong.mjs';
import { getRound, postRound, kvStore } from './samtal.mjs';
import { getStryktipset } from './stryktipset.mjs';

// Frågeparametern går förbi CDN-cachen, så att det senaste bygget läses.
async function siteMatches(site) {
  const res = await fetch(`${site}/data/matches.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  return Array.isArray(d.matches) ? d.matches : [];
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    if (url.pathname === '/stryktipset' && request.method === 'GET') {
      const r = await getStryktipset(url.searchParams.get('nr'));
      return json(r.status, r.body);
    }
    const samtal = url.pathname === '/samtal';
    const store = env.KUPONG ? kvStore(env.KUPONG) : null;
    const site = String(env.SITE || cfg.site).replace(/\/+$/, '');
    if (samtal && request.method === 'GET') {
      try {
        // Pågår ingen omgång startar veckans Stryktips av sig själv.
        const auto = { draw: async () => (await getStryktipset()).body.omgang || null, loadMatches: () => siteMatches(site) };
        const r = await getRound({ store, gang: kupongCfg.gang, auto });
        return json(r.status, r.body);
      } catch (err) {
        console.error('[samtal]', err);
        return json(500, { ok: false, error: 'Internt fel i tjänsten.' });
      }
    }
    if ((url.pathname !== '/kupong' && !samtal) || request.method !== 'POST') return json(404, { ok: false, error: 'Finns inte.' });
    if (Number(request.headers.get('Content-Length') || 0) > 20000) return json(413, { ok: false, error: 'För stor förfrågan.' });
    let body;
    try {
      body = await request.json();
    } catch {
      return json(400, { ok: false, error: 'Ogiltig förfrågan.' });
    }
    try {
      const ctx = { loadMatches: () => siteMatches(site) };
      const r = samtal
        ? await postRound(body, { ...ctx, store, gang: kupongCfg.gang })
        : await saveCoupon(body, { ...ctx, writer: env.GITHUB_TOKEN ? githubWriter(env.GITHUB_TOKEN) : null });
      return json(r.status, r.body);
    } catch (err) {
      console.error('[kupong]', err);
      return json(err.status || 500, { ok: false, error: err.status ? err.message : 'Internt fel i tjänsten.' });
    }
  },
};
