// Tobaksaffären tillsammans (public/rum-folk.js): vilka i gänget som har
// rummet öppet och vad var och en pekar på, så att deras figurer tittar dit
// hos de andra. Tjänsten profeterna-rummet på Cloudflare Workers, med ett
// Durable Object (Rummet) som håller websocketarna – ett enda rum för alla.
// Inget sparas: vem som är inne och vad hen pekar på finns bara så länge
// websocketen är öppen.
//
//   GET /rum?vem=DT   (Upgrade: websocket; vem valfri – utan den bara lyssnar man)
//   → {"mot": "tv"} eller {"mot": null} från sidan: vad du pekar på
//   ← {"inne": {"DL": "tv", "DT": null}} till alla när något ändras: de som
//     är inne och vad de pekar på (har någon flera fönster öppna gäller det
//     senaste)
//   "ping" → "pong" (svaras utan att rummet väcks)
//
// Samma tjänst håller gängets kupong i realtid (GET /kupong, worker/kupongen.mjs)
// och samtalet, när gänget ringer varandra i Matchfixarna (GET /samtal och
// /samtal/…, worker/samtalet.mjs).
//
// Driftsätts för hand: npx wrangler@4.147.0 deploy --config worker/rummet.toml

import { giltigOmgang } from './kupongen.mjs';
import { giltigVem, giltigtFonster } from './samtalet.mjs';

export { Kupongen } from './kupongen.mjs';
export { Samtalet } from './samtalet.mjs';

const GANG = new Set(['DL', 'DT', 'DJ']);
const MOT = /^[a-z0-9]{1,16}$/;
const MAX = 40;
// sidan på matchfixarna.se (och på GitHub Pages), och lokalt
const ORIGIN = /^(https:\/\/(www\.)?matchfixarna\.se|https:\/\/tomaslaino\.github\.io|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

// Samtalets aviseringar (web push) frågas utan websocket, från sidan och från
// service workern (public/sw.js): samma ursprung, med CORS.
const SAMTAL_HTTP = ['/samtal/nyckel', '/samtal/push', '/samtal/nu', '/samtal/inte'];
const cors = (origin, r) => {
  const h = new Headers(r.headers);
  h.set('Access-Control-Allow-Origin', origin);
  h.set('Vary', 'Origin');
  return new Response(r.body, { status: r.status, headers: h });
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    if (SAMTAL_HTTP.includes(url.pathname)) {
      if (!ORIGIN.test(origin)) return new Response('Fel ursprung', { status: 403 });
      if (req.method === 'OPTIONS') {
        return cors(origin, new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } }));
      }
      if (!['GET', 'POST'].includes(req.method) || (req.method === 'GET') !== (url.pathname === '/samtal/nyckel')) return cors(origin, new Response('Fel metod', { status: 405 }));
      if (Number(req.headers.get('Content-Length') || 0) > 8000) return cors(origin, new Response('För stort', { status: 413 }));
      return cors(origin, await env.SAMTALET.get(env.SAMTALET.idFromName('ganget')).fetch(req));
    }
    if (!['/rum', '/kupong', '/samtal'].includes(url.pathname)) return new Response('Inte här', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Bara websocket', { status: 426 });
    if (!ORIGIN.test(origin)) return new Response('Fel ursprung', { status: 403 });
    if (url.pathname === '/kupong') {
      if (!giltigOmgang(url.searchParams.get('id'))) return new Response('Fel omgång', { status: 400 });
      return env.KUPONGEN.get(env.KUPONGEN.idFromName('gangets-kupong')).fetch(req);
    }
    if (url.pathname === '/samtal') {
      if (!giltigVem(url.searchParams.get('vem')) || !giltigtFonster(url.searchParams.get('id'))) return new Response('Vem?', { status: 400 });
      return env.SAMTALET.get(env.SAMTALET.idFromName('ganget')).fetch(req);
    }
    const rum = env.RUMMET.get(env.RUMMET.idFromName('tobaksaffaren'));
    return rum.fetch(req);
  },
};

export class Rummet {
  constructor(state) {
    this.state = state;
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(req) {
    if (this.state.getWebSockets().length >= MAX) return new Response('Fullt', { status: 503 });
    const vem = new URL(req.url).searchParams.get('vem');
    const pair = new WebSocketPair();
    const [klient, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ vem: GANG.has(vem) ? vem : null, mot: null, at: Date.now() });
    this.skicka();
    return new Response(null, { status: 101, webSocket: klient });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > 200) return;
    let d;
    try { d = JSON.parse(msg); } catch { return; }
    const a = ws.deserializeAttachment() || {};
    if (!a.vem || !d || typeof d !== 'object') return;
    const mot = typeof d.mot === 'string' && MOT.test(d.mot) ? d.mot : null;
    if (mot === a.mot) return;
    ws.serializeAttachment({ ...a, mot, at: Date.now() });
    this.skicka();
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, 'hej då'); } catch { /* redan stängd */ }
    this.skicka(ws);
  }

  async webSocketError(ws) {
    this.skicka(ws);
  }

  // Alla som är inne och vad de pekar på, till alla (utom den som går).
  skicka(utom) {
    const alla = this.state.getWebSockets().filter((w) => w !== utom);
    const inne = {};
    const nar = {};
    for (const w of alla) {
      const a = w.deserializeAttachment() || {};
      if (!a.vem || (nar[a.vem] && nar[a.vem] > a.at)) continue;
      inne[a.vem] = a.mot;
      nar[a.vem] = a.at;
    }
    const msg = JSON.stringify({ inne });
    for (const w of alla) {
      try { w.send(msg); } catch { /* stängd */ }
    }
  }
}
