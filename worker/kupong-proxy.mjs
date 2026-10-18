// Tjänsten profeterna-kupong – Cloudflare Worker som sparar gängets kupong
// direkt från sidan (worker/kupong.mjs). Egen tjänst, skild från proxyn för
// matchanalysen: GitHub-nyckeln finns bara här, och tjänsten gör inget annat
// än att committa en kontrollerad kupongfil i data/kuponger/.
//
//   POST /kupong {"kod", "kupong", "andra"}   (se worker/kupong.mjs)
//
// Driftsätts för hand med worker/kupong.toml; hemligheterna GITHUB_TOKEN och
// KUPONG_KOD läggs in med "wrangler secret put" (README, avsnittet Kupongen).

import { saveCoupon, githubWriter, kvLimiter } from './kupong.mjs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    if (url.pathname !== '/kupong' || request.method !== 'POST') return json(404, { ok: false, error: 'Finns inte.' });
    if (Number(request.headers.get('Content-Length') || 0) > 20000) return json(413, { ok: false, error: 'För stor förfrågan.' });
    let body;
    try {
      body = await request.json();
    } catch {
      return json(400, { ok: false, error: 'Ogiltig förfrågan.' });
    }
    try {
      const r = await saveCoupon(body, {
        env,
        writer: env.GITHUB_TOKEN ? githubWriter(env.GITHUB_TOKEN) : null,
        limiter: env.KUPONG ? kvLimiter(env.KUPONG, request.headers.get('CF-Connecting-IP')) : null,
      });
      return json(r.status, r.body);
    } catch (err) {
      console.error('[kupong]', err);
      return json(err.status || 500, { ok: false, error: err.status ? err.message : 'Internt fel i tjänsten.' });
    }
  },
};
