// Gänget i bild på tv:n i tobaksaffären (public/rum-bild.js): medan vi pratar i
// telefon kan var och en visa sig i tv:n uppe i hörnet. Bilden går direkt mellan
// webbläsarna (WebRTC); det här Durable Objectet (Bilden) i tjänsten
// profeterna-rummet (worker/rummet.mjs) håller bara reda på vem som är med och
// för vidare det webbläsarna säger till varandra för att hitta fram. Ingen bild
// passerar här, och inget sparas: allt finns bara så länge websocketen är öppen.
//
//   GET /bild?vem=DT&id=<fönstret>   (Upgrade: websocket; vem och id krävs)
//   ← {ice: [...]} direkt: adresserna webbläsarna tar sig fram genom (STUN, och
//     TURN när tjänsten har en nyckel: TURN_ID och TURN_NYCKEL, Cloudflares TURN)
//   ← {alla: [{id, vem, kamera, med}]} till alla när någon kommer, går eller
//     ändrar sig: kamera = visar sig, med = har bilden på tv:n (eller visar sig)
//   → {lage: {kamera, med}}            hur det är med en själv
//   → {till: id, sig: {...}}           till ett annat fönster: erbjudandet,
//                                      svaret och vägarna (SDP och ICE)
//   ← {fran: id, vem, sig}             det som någon skickade till en
//   "ping" → "pong" (svaras utan att tjänsten väcks)
//
// Samma trovärdighet som kupongen (worker/kupongen.mjs): vem man är väljer man
// själv, och tjänsten släpper bara in sajtens egna ursprung (rummet.mjs). Den
// som visar sig ser på tv:n vilka som ser en.

const GANG = new Set(['DL', 'DT', 'DJ']);
const FONSTER = /^[a-z0-9]{8,32}$/;
const SOCKETS_MAX = 12;
const MSG_MAX = 32000;
// Cloudflares TURN-uppgifter gäller ett dygn och hämtas om efter halva tiden.
const ICE_TTL = 86400;
const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];

export const giltigVem = (v) => GANG.has(v);
export const giltigtFonster = (id) => FONSTER.test(String(id || ''));

export class Bilden {
  constructor(state, env) {
    this.state = state;
    this.env = env || {};
    this.isen = null;
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  // Adresserna till webbläsarna: STUN alltid, och TURN genom Cloudflare när
  // tjänsten har en nyckel – så kommer bilden fram också när ingen av dem går
  // att nå direkt (mobilnät bakom operatörens adressöversättning).
  async ice() {
    const { TURN_ID: id, TURN_NYCKEL: nyckel } = this.env;
    if (!id || !nyckel) return STUN;
    if (this.isen && Date.now() < this.isen.till) return this.isen.servrar;
    try {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${nyckel}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: ICE_TTL }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      const lista = [].concat(d.iceServers || []).filter((s) => s && s.urls);
      if (!lista.length) throw new Error('inga servrar');
      this.isen = { servrar: lista, till: Date.now() + (ICE_TTL / 2) * 1000 };
      return lista;
    } catch {
      return STUN;
    }
  }

  async fetch(req) {
    const q = new URL(req.url).searchParams;
    const vem = q.get('vem');
    const id = q.get('id');
    if (!giltigVem(vem) || !giltigtFonster(id)) return new Response('Vem?', { status: 400 });
    // samma fönster som kopplar upp sig igen ersätter det gamla
    for (const w of this.state.getWebSockets()) {
      if ((w.deserializeAttachment() || {}).id !== id) continue;
      w.serializeAttachment({ ersatt: true });
      try { w.close(1000, 'ersatt'); } catch { /* stängd */ }
    }
    if (this.uppe().length >= SOCKETS_MAX) return new Response('Fullt', { status: 503 });
    const pair = new WebSocketPair();
    const [klient, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ vem, id, kamera: false, med: false });
    server.send(JSON.stringify({ ice: await this.ice() }));
    this.alla();
    return new Response(null, { status: 101, webSocket: klient });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MSG_MAX) return;
    let d;
    try { d = JSON.parse(msg); } catch { return; }
    const a = ws.deserializeAttachment() || {};
    if (!a.id || !d || typeof d !== 'object') return;
    if (d.lage && typeof d.lage === 'object') {
      const kamera = d.lage.kamera === true;
      const med = kamera || d.lage.med === true;
      if (kamera === a.kamera && med === a.med) return;
      ws.serializeAttachment({ ...a, kamera, med });
      this.alla();
      return;
    }
    if (giltigtFonster(d.till) && d.sig && typeof d.sig === 'object') {
      const ut = JSON.stringify({ fran: a.id, vem: a.vem, sig: d.sig });
      for (const w of this.state.getWebSockets()) {
        if ((w.deserializeAttachment() || {}).id !== d.till) continue;
        try { w.send(ut); } catch { /* stängd */ }
      }
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, 'hej då'); } catch { /* redan stängd */ }
    this.alla(ws);
  }

  async webSocketError(ws) {
    this.alla(ws);
  }

  // De öppna websocketarna (inte de som har ersatts och håller på att stängas).
  uppe(utom) {
    return this.state.getWebSockets().filter((w) => w !== utom && (w.deserializeAttachment() || {}).id);
  }

  // Alla som är uppkopplade, till alla (utom den som går).
  alla(utom) {
    const ws = this.uppe(utom);
    const lista = ws.map((w) => w.deserializeAttachment())
      .map(({ id, vem, kamera, med }) => ({ id, vem, kamera: Boolean(kamera), med: Boolean(med) }));
    const msg = JSON.stringify({ alla: lista });
    for (const w of ws) {
      try { w.send(msg); } catch { /* stängd */ }
    }
  }
}
