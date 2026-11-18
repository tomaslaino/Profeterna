// Samtalet: gänget ringer varandra i Matchfixarna (public/telefon.js), med röst och,
// för den som vill, bild på tv:n i tobaksaffären (public/rum-bild.js). Rösten och
// bilden går direkt mellan webbläsarna (WebRTC); det här Durable Objectet (Samtalet)
// i tjänsten profeterna-rummet (worker/rummet.mjs) håller reda på samtalet – vem som
// ringde, vilka som är med, vilka det ringer hos – för vidare det webbläsarna säger
// till varandra för att hitta fram, och skickar aviseringen till telefonen hos den
// som inte har sidan öppen (web push). Ingen röst eller bild passerar här.
//
// Samtalet:
//  – Ring gänget: den som ringer är med, och det ringer hos de andra i 45 sekunder
//    (RINGER) – i sidan om den är öppen, och som avisering i telefonen.
//  – Svara (eller Gå med, så länge samtalet pågår): man är med. Inte nu: det slutar
//    ringa hos en. Har det ringt klart utan svar har man missat samtalet.
//  – Lägg på: man går ur. Är bara en kvar, och det inte ringer hos någon, är samtalet
//    slut – likaså när ingen svarade.
//  – Tappar någon uppkopplingen räknas hen som med i 30 sekunder (NAD), så att ett
//    hack i mobilnätet inte avslutar samtalet; kommer samma fönster tillbaka är det med
//    igen av sig självt.
//  – En person är med från en enhet i taget: svarar man på en annan flyttar samtalet dit.
//
//   GET /samtal?vem=DT&id=<fönstret>   (Upgrade: websocket; vem och id krävs)
//   ← {ice: [...]} direkt: STUN, och TURN när tjänsten har en nyckel (TURN_ID och
//     TURN_NYCKEL, Cloudflares TURN)
//   ← {alla, samtal, senast} till alla när något ändras:
//       alla:   [{id, vem, i, kamera, tyst}] fönstren (i = med i samtalet)
//       samtal: {id, av, startad, med, ringer, inte, missat, borta} eller null
//       senast: samtalet som var (id, av, startad, slut, varit, inte, missat) eller null
//   ← {flyttat: true} till ett fönster vars person svarade på en annan enhet
//   → {ring: true} ring gänget (eller gå med och ring igen hos de andra),
//     {ring: "DJ"} ring en igen, {svara: true}, {inte: true}, {lagg: true}
//   → {lage: {kamera, tyst}}             visar sig på tv:n, mikrofonen av
//   → {till: id, sig: {...}}             till ett annat fönster: SDP och ICE
//   ← {fran: id, vem, sig}               det som någon skickade till en
//   "ping" → "pong" (svaras utan att tjänsten väcks)
//
// Aviseringarna (web push, utan innehåll: service workern på sajten frågar vad det
// gäller, public/sw.js):
//   GET  /samtal/nyckel                  ← {nyckel}: den publika VAPID-nyckeln
//   POST /samtal/push {vem, sub}         telefonen vill bli uppringd (sub = PushSubscription)
//   POST /samtal/push {bort: endpoint}   inte längre
//   POST /samtal/nu {endpoint}           ← {vem, samtal, senast}: vad aviseringen ska säga
//   POST /samtal/inte {endpoint}         Inte nu från aviseringen
// VAPID-nyckeln skapas här första gången och sparas i Durable Objectets lagring.
//
// Samma trovärdighet som kupongen (worker/kupongen.mjs): vem man är väljer man själv,
// och tjänsten släpper bara in sajtens egna ursprung (rummet.mjs). Alla som är med i
// samtalet syns för de andra – ingen kan lyssna utan att synas.

const GANG = ['DL', 'DT', 'DJ'];
const FONSTER = /^[a-z0-9]{8,32}$/;
const SOCKETS_MAX = 24;
const MSG_MAX = 32000;
const RINGER = 45000;
const NAD = 30000;
const PUSH_MAX = 30;
// Cloudflares TURN-uppgifter gäller ett dygn och hämtas om efter halva tiden.
const ICE_TTL = 86400;
const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
// webbläsarnas pushtjänster (Chrome, Safari, Firefox, Edge) – inga andra adresser
const PUSHTJANST = /^https:\/\/([a-z0-9-]+\.)*(fcm\.googleapis\.com|push\.apple\.com|push\.services\.mozilla\.com|notify\.windows\.com)\//;
const LOKAL = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//;

export const giltigVem = (v) => GANG.includes(v);
export const giltigtFonster = (id) => FONSTER.test(String(id || ''));

const b64u = (b) => {
  const u = typeof b === 'string' ? new TextEncoder().encode(b) : b;
  let s = '';
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const slump = () => [...crypto.getRandomValues(new Uint8Array(9))].map((x) => (x % 36).toString(36)).join('');
const uniq = (xs) => [...new Set(xs)];
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export class Samtalet {
  constructor(state, env) {
    this.state = state;
    this.env = env || {};
    this.isen = null;
    this.v = null;
    this.s = null; // samtalet, eller null
    this.senast = null; // det förra
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    this.state.blockConcurrencyWhile(async () => {
      this.s = (await this.state.storage.get('samtal')) || null;
      this.senast = (await this.state.storage.get('senast')) || null;
    });
  }

  // ---------- adresserna mellan webbläsarna ----------

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

  // ---------- in ----------

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/samtal') return this.oppna(url.searchParams);
    let d = {};
    if (req.method === 'POST') {
      try { d = await req.json(); } catch { return json({ fel: 'json' }, 400); }
      if (!d || typeof d !== 'object') return json({ fel: 'json' }, 400);
    }
    switch (url.pathname) {
      case '/samtal/nyckel': return json({ nyckel: (await this.vapid()).publik });
      case '/samtal/push': return this.prenumerera(d);
      case '/samtal/nu': {
        const vem = await this.vemFor(d.endpoint);
        return json({ vem, samtal: this.utdrag(), senast: this.senast });
      }
      case '/samtal/inte': {
        const vem = await this.vemFor(d.endpoint);
        if (vem) await this.inte(vem);
        return json({ ok: Boolean(vem) });
      }
      default: return json({ fel: 'inte här' }, 404);
    }
  }

  async oppna(q) {
    const vem = q.get('vem');
    const id = q.get('id');
    if (!giltigVem(vem) || !giltigtFonster(id)) return new Response('Vem?', { status: 400 });
    // samma fönster som kopplar upp sig igen ersätter det gamla – och är med i
    // samtalet om det gamla var det, eller om det föll ur nyss (borta)
    let forut = null;
    for (const w of this.state.getWebSockets()) {
      const a = w.deserializeAttachment() || {};
      if (a.id !== id) continue;
      if (a.vem === vem) forut = a;
      w.serializeAttachment({ ersatt: true });
      try { w.close(1000, 'ersatt'); } catch { /* stängd */ }
    }
    if (this.uppe().length >= SOCKETS_MAX) return new Response('Fullt', { status: 503 });
    const s = this.s;
    const ater = Boolean(s && ((forut && forut.i) || (s.borta[vem] && s.borta[vem].id === id)));
    const pair = new WebSocketPair();
    const [klient, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ vem, id, i: ater, kamera: Boolean(ater && forut && forut.kamera), tyst: Boolean(ater && forut && forut.tyst) });
    if (ater) delete s.borta[vem];
    server.send(JSON.stringify({ ice: await this.ice() }));
    await this.ordna();
    return new Response(null, { status: 101, webSocket: klient });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MSG_MAX) return;
    let d;
    try { d = JSON.parse(msg); } catch { return; }
    const a = ws.deserializeAttachment() || {};
    if (!a.id || !d || typeof d !== 'object') return;
    if (giltigtFonster(d.till) && d.sig && typeof d.sig === 'object') {
      const ut = JSON.stringify({ fran: a.id, vem: a.vem, sig: d.sig });
      for (const w of this.state.getWebSockets()) {
        if ((w.deserializeAttachment() || {}).id !== d.till) continue;
        try { w.send(ut); } catch { /* stängd */ }
      }
      return;
    }
    if (d.ring) {
      await this.ring(ws, a, typeof d.ring === 'string' && giltigVem(d.ring) ? d.ring : null);
      return;
    }
    if (d.svara) {
      if (this.s) this.medI(ws, a);
      await this.ordna();
      return;
    }
    if (d.inte) {
      await this.inte(a.vem);
      return;
    }
    if (d.lagg) {
      ws.serializeAttachment({ ...a, i: false, kamera: false, tyst: false });
      await this.ordna();
      return;
    }
    if (d.lage && typeof d.lage === 'object') {
      const kamera = Boolean(a.i) && d.lage.kamera === true;
      const tyst = Boolean(a.i) && d.lage.tyst === true;
      if (kamera === Boolean(a.kamera) && tyst === Boolean(a.tyst)) return;
      ws.serializeAttachment({ ...a, kamera, tyst });
      this.skicka();
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, 'hej då'); } catch { /* redan stängd */ }
    await this.borta(ws);
  }

  async webSocketError(ws) {
    await this.borta(ws);
  }

  async alarm() {
    await this.ordna();
  }

  // ---------- samtalet ----------

  // De öppna websocketarna (inte de som har ersatts och håller på att stängas).
  uppe(utom) {
    return this.state.getWebSockets().filter((w) => w !== utom && (w.deserializeAttachment() || {}).id);
  }
  // Vilka som är med: fönster i samtalet, och de som nyss tappade uppkopplingen.
  med(utom) {
    const i = this.uppe(utom).map((w) => w.deserializeAttachment()).filter((a) => a.i).map((a) => a.vem);
    return uniq(this.s ? i.concat(Object.keys(this.s.borta)) : i);
  }

  // Ett fönster går med i samtalet: inget ringer längre hos personen, och personens
  // andra fönster går ur (samtalet flyttar hit).
  medI(ws, a) {
    const s = this.s;
    ws.serializeAttachment({ ...a, i: true });
    delete s.ringer[a.vem];
    delete s.borta[a.vem];
    s.inte = s.inte.filter((v) => v !== a.vem);
    s.missat = s.missat.filter((v) => v !== a.vem);
    if (!s.varit.includes(a.vem)) s.varit.push(a.vem);
    for (const w of this.uppe(ws)) {
      const b = w.deserializeAttachment() || {};
      if (b.vem !== a.vem || !b.i) continue;
      w.serializeAttachment({ ...b, i: false, kamera: false, tyst: false });
      try { w.send(JSON.stringify({ flyttat: true })); } catch { /* stängd */ }
    }
  }

  // Ring gänget: starta samtalet (eller gå med i det som pågår) och ring hos dem som
  // inte är med – eller bara hos en (vem).
  async ring(ws, a, vem) {
    const nu = Date.now();
    if (!this.s) {
      this.s = { id: slump(), av: a.vem, startad: nu, ringer: {}, inte: [], missat: [], borta: {}, varit: [] };
    }
    const s = this.s;
    if (!a.i) this.medI(ws, a);
    const med = this.med();
    const nya = (vem ? [vem] : GANG).filter((v) => !med.includes(v) && !s.ringer[v]);
    for (const v of nya) {
      s.ringer[v] = nu + RINGER;
      s.inte = s.inte.filter((x) => x !== v);
      s.missat = s.missat.filter((x) => x !== v);
    }
    await this.ordna();
    if (nya.length) this.pusha(nya);
  }

  async inte(vem) {
    const s = this.s;
    if (!s || !s.ringer[vem]) return;
    delete s.ringer[vem];
    if (!s.inte.includes(vem)) s.inte.push(vem);
    await this.ordna();
  }

  // Ett fönster försvann: var det med räknas personen som med en stund till.
  async borta(ws) {
    const a = ws.deserializeAttachment() || {};
    const s = this.s;
    if (s && a.i && !this.uppe(ws).some((w) => { const b = w.deserializeAttachment() || {}; return b.vem === a.vem && b.i; })) {
      s.borta[a.vem] = { id: a.id, till: Date.now() + NAD };
    }
    await this.ordna(ws);
  }

  // Läget efter en ändring: det som har ringt klart blir missat, de som har varit
  // borta för länge är inte med, och är ingen kvar att prata med är samtalet slut.
  // Sedan sparas läget, larmet ställs och alla får veta.
  async ordna(utom) {
    const s = this.s;
    const nu = Date.now();
    const missat = [];
    if (s) {
      for (const [v, b] of Object.entries(s.borta)) if (b.till <= nu) delete s.borta[v];
      for (const [v, t] of Object.entries(s.ringer)) {
        if (t > nu) continue;
        delete s.ringer[v];
        if (!s.missat.includes(v)) s.missat.push(v);
        missat.push(v);
      }
      const med = this.med(utom);
      if (!med.length || (med.length === 1 && !Object.keys(s.ringer).length)) {
        for (const v of Object.keys(s.ringer)) {
          if (!s.missat.includes(v)) s.missat.push(v);
          missat.push(v);
        }
        this.senast = { id: s.id, av: s.av, startad: s.startad, slut: nu, varit: s.varit, inte: s.inte, missat: s.missat };
        this.s = null;
        for (const w of this.uppe(utom)) {
          const b = w.deserializeAttachment() || {};
          if (b.i) w.serializeAttachment({ ...b, i: false, kamera: false, tyst: false });
        }
      }
    }
    await this.state.storage.put({ samtal: this.s, senast: this.senast });
    const t = this.s ? [...Object.values(this.s.ringer), ...Object.values(this.s.borta).map((b) => b.till)] : [];
    if (t.length) await this.state.storage.setAlarm(Math.min(...t) + 50);
    else await this.state.storage.deleteAlarm();
    this.skicka(utom);
    if (missat.length) this.pusha(uniq(missat));
  }

  // Samtalet som alla får se.
  utdrag(utom) {
    const s = this.s;
    if (!s) return null;
    return { id: s.id, av: s.av, startad: s.startad, med: this.med(utom), ringer: Object.keys(s.ringer), inte: s.inte, missat: s.missat, borta: Object.keys(s.borta), varit: s.varit };
  }

  skicka(utom) {
    const ws = this.uppe(utom);
    const alla = ws.map((w) => w.deserializeAttachment())
      .map(({ id, vem, i, kamera, tyst }) => ({ id, vem, i: Boolean(i), kamera: Boolean(kamera), tyst: Boolean(tyst) }));
    const msg = JSON.stringify({ alla, samtal: this.utdrag(utom), senast: this.senast });
    for (const w of ws) {
      try { w.send(msg); } catch { /* stängd */ }
    }
  }

  // ---------- aviseringarna ----------

  async vapid() {
    if (this.v) return this.v;
    let k = await this.state.storage.get('vapid');
    if (!k) {
      const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      const privat = await crypto.subtle.exportKey('jwk', par.privateKey);
      const publik = b64u(new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey)));
      k = { privat, publik };
      await this.state.storage.put('vapid', k);
    }
    const nyckel = await crypto.subtle.importKey('jwk', k.privat, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    this.v = { nyckel, publik: k.publik };
    return this.v;
  }

  tillaten(endpoint) {
    const e = String(endpoint || '');
    return e.length < 1000 && (PUSHTJANST.test(e) || (this.env.PUSH_LOKALT === '1' && LOKAL.test(e)));
  }

  async prenumerationer() {
    return (await this.state.storage.get('push')) || {};
  }

  async vemFor(endpoint) {
    const p = await this.prenumerationer();
    return (p[String(endpoint || '')] || {}).vem || null;
  }

  async prenumerera(d) {
    const p = await this.prenumerationer();
    if (d.bort) {
      delete p[String(d.bort)];
      await this.state.storage.put('push', p);
      return json({ ok: true });
    }
    const endpoint = d.sub && d.sub.endpoint;
    if (!giltigVem(d.vem) || !this.tillaten(endpoint)) return json({ fel: 'prenumerationen' }, 400);
    p[endpoint] = { vem: d.vem, sedan: Date.now() };
    // (de äldsta går först när det blir för många)
    const alla = Object.entries(p).sort((x, y) => y[1].sedan - x[1].sedan).slice(0, PUSH_MAX);
    await this.state.storage.put('push', Object.fromEntries(alla));
    return json({ ok: true, nyckel: (await this.vapid()).publik });
  }

  // En avisering utan innehåll till varje telefon som de här personerna har: service
  // workern frågar /samtal/nu vad det gäller (det ringer, eller ett missat samtal).
  // Samma ämne (Topic), så att en avisering som inte har kommit fram ersätts av nästa.
  pusha(vem) {
    const jobb = (async () => {
      const p = await this.prenumerationer();
      const v = await this.vapid();
      const ringer = this.s ? Object.keys(this.s.ringer) : [];
      let andrat = false;
      await Promise.all(Object.entries(p).filter(([, x]) => vem.includes(x.vem)).map(async ([endpoint, x]) => {
        if (!this.tillaten(endpoint)) return;
        try {
          const aud = new URL(endpoint).origin;
          const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
          const c = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://matchfixarna.se' }));
          const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.nyckel, new TextEncoder().encode(`${h}.${c}`)));
          const r = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `vapid t=${h}.${c}.${b64u(sig)}, k=${v.publik}`,
              TTL: ringer.includes(x.vem) ? '60' : '43200',
              Urgency: 'high',
              Topic: 'samtal',
              'Content-Length': '0',
            },
          });
          // (telefonen har slutat ta emot: bort med den)
          if (r.status === 404 || r.status === 410) {
            delete p[endpoint];
            andrat = true;
          }
        } catch { /* nästa gång */ }
      }));
      if (andrat) await this.state.storage.put('push', p);
    })();
    if (this.state.waitUntil) this.state.waitUntil(jobb);
    return jobb;
  }
}
