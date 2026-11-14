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
// Telefonerna (public/rum-telefon.js): den som tar sin telefon är med i samtalet.
//   → {"luren": true} eller {"luren": false}: du svarar eller lägger på
//   ← {"inne": …, "luren": ["DJ", "DL"]} till alla: de som är med, i den ordning de svarade
//   ← {"lagg": true} till ett äldre fönster när samma person svarar i ett annat
//   → {"till": "DT", "rtc": {…}}: WebRTC-uppkopplingen (sdp eller ice) till den andra
//   ← {"fran": "DL", "rtc": {…}} hos den som är med i samtalet (det senaste fönstret)
// Ljudet går direkt mellan telefonerna och datorerna; tjänsten för bara fram uppkopplingen.
//
// Samma tjänst håller gängets kupong i realtid (GET /kupong, worker/kupongen.mjs).
//
// Driftsätts för hand: npx wrangler@4.147.0 deploy --config worker/rummet.toml

import { giltigOmgang } from './kupongen.mjs';

export { Kupongen } from './kupongen.mjs';

const GANG = new Set(['DL', 'DT', 'DJ']);
const MOT = /^[a-z0-9]{1,16}$/;
const MAX = 40;
// sdp med alla kandidater ryms gott (en vanlig ljud-sdp är 2–6 kB)
const RTC_MAX = 16000;
// sidan på matchfixarna.se (och på GitHub Pages), och lokalt
const ORIGIN = /^(https:\/\/(www\.)?matchfixarna\.se|https:\/\/tomaslaino\.github\.io|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/rum' && url.pathname !== '/kupong') return new Response('Inte här', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Bara websocket', { status: 426 });
    const origin = req.headers.get('Origin') || '';
    if (!ORIGIN.test(origin)) return new Response('Fel ursprung', { status: 403 });
    if (url.pathname === '/kupong') {
      if (!giltigOmgang(url.searchParams.get('id'))) return new Response('Fel omgång', { status: 400 });
      return env.KUPONGEN.get(env.KUPONGEN.idFromName('gangets-kupong')).fetch(req);
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
    server.serializeAttachment({ vem: GANG.has(vem) ? vem : null, mot: null, at: Date.now(), luren: 0 });
    this.skicka();
    return new Response(null, { status: 101, webSocket: klient });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > RTC_MAX) return;
    let d;
    try { d = JSON.parse(msg); } catch { return; }
    const a = ws.deserializeAttachment() || {};
    if (!a.vem || !d || typeof d !== 'object') return;
    if ('rtc' in d) return this.vidare(a, d);
    if (msg.length > 200) return;
    if ('luren' in d) return this.luren(ws, a, !!d.luren);
    const mot = typeof d.mot === 'string' && MOT.test(d.mot) ? d.mot : null;
    if (mot === a.mot) return;
    ws.serializeAttachment({ ...a, mot, at: Date.now() });
    this.skicka();
  }

  // Du svarar eller lägger på. Svarar du i ett fönster lägger de andra fönstren på.
  luren(ws, a, pa) {
    if (!!a.luren === pa) return;
    const nu = Date.now();
    ws.serializeAttachment({ ...a, luren: pa ? nu : 0 });
    if (pa) {
      for (const w of this.state.getWebSockets()) {
        if (w === ws) continue;
        const b = w.deserializeAttachment() || {};
        if (b.vem !== a.vem || !b.luren) continue;
        w.serializeAttachment({ ...b, luren: 0 });
        try { w.send('{"lagg":true}'); } catch { /* stängd */ }
      }
    }
    this.skicka();
  }

  // WebRTC-uppkopplingen till den som är med i samtalet, i det fönster där hen svarade sist.
  vidare(a, d) {
    if (!a.luren || !GANG.has(d.till) || d.till === a.vem || !d.rtc || typeof d.rtc !== 'object') return;
    let mal = null;
    let nar = 0;
    for (const w of this.state.getWebSockets()) {
      const b = w.deserializeAttachment() || {};
      if (b.vem === d.till && b.luren > nar) { mal = w; nar = b.luren; }
    }
    if (!mal) return;
    try { mal.send(JSON.stringify({ fran: a.vem, rtc: d.rtc })); } catch { /* stängd */ }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, 'hej då'); } catch { /* redan stängd */ }
    this.skicka(ws);
  }

  async webSocketError(ws) {
    this.skicka(ws);
  }

  // Alla som är inne och vad de pekar på, och vilka som är med i samtalet, till alla (utom den som går).
  skicka(utom) {
    const alla = this.state.getWebSockets().filter((w) => w !== utom);
    const inne = {};
    const nar = {};
    const lur = {};
    for (const w of alla) {
      const a = w.deserializeAttachment() || {};
      if (!a.vem) continue;
      if (a.luren && (!lur[a.vem] || a.luren < lur[a.vem])) lur[a.vem] = a.luren;
      if (nar[a.vem] && nar[a.vem] > a.at) continue;
      inne[a.vem] = a.mot;
      nar[a.vem] = a.at;
    }
    const luren = Object.keys(lur).sort((x, y) => lur[x] - lur[y]);
    const msg = JSON.stringify({ inne, luren });
    for (const w of alla) {
      try { w.send(msg); } catch { /* stängd */ }
    }
  }
}
