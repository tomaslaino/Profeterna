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
// Driftsätts för hand: npx wrangler@4.147.0 deploy --config worker/rummet.toml

const GANG = new Set(['DL', 'DT', 'DJ']);
const MOT = /^[a-z0-9]{1,16}$/;
const MAX = 40;
// sidan på matchfixarna.se (och på GitHub Pages), och lokalt
const ORIGIN = /^(https:\/\/(www\.)?matchfixarna\.se|https:\/\/tomaslaino\.github\.io|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/rum') return new Response('Inte här', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Bara websocket', { status: 426 });
    const origin = req.headers.get('Origin') || '';
    if (!ORIGIN.test(origin)) return new Response('Fel ursprung', { status: 403 });
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
