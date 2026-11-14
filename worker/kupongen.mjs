// Gängets kupong i realtid (public/samtal-live.js, public/samtal.js): kryssen i
// uppgörelsen och vilka omtvistade matcher som är klubbade, samma för alla som
// ser kupongen. Ett Durable Object (Kupongen) i tjänsten profeterna-rummet
// (worker/rummet.mjs) håller websocketarna och läget per omgång – så att den som
// kommer in sent ser samma kupong. Det här är utkastet: kupongen som spelas
// sparas som förut, som fil (worker/kupong.mjs).
//
//   GET /kupong?id=<omgång>&vem=DT   (Upgrade: websocket; vem valfri)
//   ← {lage} direkt: läget just nu, eller null om ingen har kryssat än
//   → {n, match, tecken}             ett tecken i en match ('' = inget)
//   → {n, klubba: [id]}              matcher som är klubbade
//   → {n, satt: {val, klar}}         hela kupongen: Börja om, en sparad kupong
//   → {n, sparad: {coupon, older}}   gängets kupong är sparad (valfritt ihop med
//                                    satt), så att allas knapp blir Sparad utan
//                                    att vänta på bygget
//   → {n, vald: id | null}           matchen på lappen, samma hos alla (null =
//                                    ingen); kan följa med ett tecken
//   → {bas: {val, klar}}             kan följa med vad som helst: det sidan utgår
//                                    från, och gäller bara när läget saknas (den
//                                    första som kryssar utgår från förslaget)
//   ← {lage, kvitto} till den som skickade (n), {lage} till de andra
//   "ping" → "pong" (svaras utan att tjänsten väcks)
//
// lage = {id, val: {matchens id: tecken}, klar: [matchens id], v, av, t, sparad,
//         vald, valdAv, valdV}: vald = matchen på lappen, valdAv = vem som tog fram
//         den, valdV = räknas upp varje gång någon tar fram en match.
// Samma trovärdighet som tipsen i worker/samtal.mjs: vem man är väljer man själv,
// och sidan kopplar upp sig först när den får se de andras tips, så att ingen ser
// kryssen av misstag innan hen har lämnat in.

import { normSign } from './kupong.mjs';

const ROUND_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{4,10}$/;
const COUPON_ID = /^\d{4}-\d{2}-\d{2}(-\d{1,2})?$/;
const MATCH_ID = /^\d{1,12}$/;
const SHA = /^[0-9a-f]{7,64}$/;
const GANG = new Set(['DL', 'DT', 'DJ']);
const MATCHES_MAX = 40;
const SOCKETS_MAX = 40;
const MSG_MAX = 16000;
const NOTE_MAX = 140;
const NAME_MAX = 60;
const LABEL_MAX = 120;
// så många omgångar sparas; bara den pågående ändras
const OMG_MAX = 3;

export const giltigOmgang = (id) => ROUND_ID.test(String(id || ''));

const text = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);

function tecknen(o) {
  const ut = {};
  if (!o || typeof o !== 'object') return ut;
  for (const [id, t] of Object.entries(o).slice(0, MATCHES_MAX)) {
    const s = normSign(t);
    if (MATCH_ID.test(id) && s) ut[id] = s;
  }
  return ut;
}

const matcher = (a) => (Array.isArray(a) ? [...new Set(a.map(String).filter((id) => MATCH_ID.test(id)))].slice(0, MATCHES_MAX) : []);

// Kupongen som sparades, i sidans form (coupon i public/kupong.js), bara det som
// ska stå där. null om den inte går att använda.
export function giltigSparad(x) {
  const c = x && x.coupon;
  if (!c || !COUPON_ID.test(String(c.id || '')) || !Array.isArray(c.matches) || !c.matches.length || c.matches.length > MATCHES_MAX) return null;
  const matches = [];
  for (const m of c.matches) {
    const id = String((m && m.id) || '');
    const sign = normSign(m && m.sign);
    if (!MATCH_ID.test(id) || !sign) return null;
    const note = text(m.note, NOTE_MAX);
    matches.push({ id, sign, label: text(m.label, LABEL_MAX), ...(note ? { note } : {}) });
  }
  const sha = SHA.test(String(c.sha || '')) ? c.sha : null;
  return {
    coupon: { id: c.id, name: text(c.name, NAME_MAX) || null, created: text(c.created, 40), ...(c.spel === 'Stryktipset' ? { spel: c.spel } : {}), matches, sha },
    older: (Array.isArray(x.older) ? x.older : []).filter((s) => SHA.test(String(s))).slice(0, 12),
  };
}

// Det som är sant efter en ändring. Ett tecken gäller per match (den senaste
// vinner), så två som kryssar i olika matcher skriver inte över varandra.
export function andra(lage, op, vem = null) {
  const bas = op.bas && typeof op.bas === 'object' ? op.bas : {};
  const l = lage
    ? { val: { ...lage.val }, klar: [...lage.klar], ...(lage.sparad ? { sparad: lage.sparad } : {}),
      ...(lage.valdV ? { vald: lage.vald, valdAv: lage.valdAv, valdV: lage.valdV } : {}) }
    : { val: tecknen(bas.val), klar: matcher(bas.klar) };
  // Matchen på lappen: den som tog fram en match senast bestämmer, hos alla.
  if ('vald' in op && (op.vald === null || (typeof op.vald === 'string' && MATCH_ID.test(op.vald)))) {
    l.vald = op.vald;
    l.valdAv = GANG.has(vem) ? vem : null;
    l.valdV = ((lage && lage.valdV) || 0) + 1;
  }
  if (op.satt && typeof op.satt === 'object') {
    l.val = tecknen(op.satt.val);
    l.klar = matcher(op.satt.klar);
  }
  if (typeof op.match === 'string' && MATCH_ID.test(op.match)) {
    const s = normSign(op.tecken);
    if (s) l.val[op.match] = s;
    else delete l.val[op.match];
  }
  for (const id of matcher(op.klubba)) if (!l.klar.includes(id)) l.klar.push(id);
  const sparad = giltigSparad(op.sparad);
  if (sparad) l.sparad = sparad;
  return l;
}

export class Kupongen {
  constructor(state) {
    this.state = state;
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(req) {
    if (this.state.getWebSockets().length >= SOCKETS_MAX) return new Response('Fullt', { status: 503 });
    const q = new URL(req.url).searchParams;
    const id = q.get('id');
    const vem = q.get('vem');
    const pair = new WebSocketPair();
    const [klient, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ id, vem: GANG.has(vem) ? vem : null });
    server.send(JSON.stringify({ lage: (await this.state.storage.get(`omg:${id}`)) || null }));
    return new Response(null, { status: 101, webSocket: klient });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MSG_MAX) return;
    let op;
    try { op = JSON.parse(msg); } catch { return; }
    const a = ws.deserializeAttachment() || {};
    if (!a.id || !op || typeof op !== 'object') return;
    const key = `omg:${a.id}`;
    const old = await this.state.storage.get(key);
    const lage = { ...andra(old, op, a.vem), id: a.id, v: ((old && old.v) || 0) + 1, av: a.vem || null, t: Date.now() };
    await this.state.storage.put(key, lage);
    if (!old) await this.rensa(key);
    const ut = JSON.stringify({ lage });
    const kvitto = JSON.stringify({ lage, kvitto: op.n });
    for (const w of this.state.getWebSockets()) {
      if ((w.deserializeAttachment() || {}).id !== a.id) continue;
      try { w.send(w === ws && Number.isInteger(op.n) ? kvitto : ut); } catch { /* stängd */ }
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, 'hej då'); } catch { /* redan stängd */ }
  }

  async webSocketError() { /* sidan kopplar upp sig igen */ }

  // Gamla omgångar tas bort när en ny börjar.
  async rensa(behall) {
    const alla = [...(await this.state.storage.list({ prefix: 'omg:' })).entries()];
    const gamla = alla.filter(([k]) => k !== behall).sort((x, y) => (y[1].t || 0) - (x[1].t || 0)).slice(OMG_MAX - 1);
    if (gamla.length) await this.state.storage.delete(gamla.map(([k]) => k));
  }
}
