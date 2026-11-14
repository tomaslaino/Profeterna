'use strict';

// Uppkopplingen till gängets kupong i realtid (worker/kupongen.mjs): en websocket
// som bär kryssen i uppgörelsen mellan alla som ser kupongen. Vad de betyder och
// hur de ritas står i samtal.js; här finns bara vägen dit. Går uppkopplingen ner
// kopplas den upp igen, och det man har kryssat under tiden skickas då. Det man
// har skickat men inte fått kvitto på ligger kvar ovanpå det som tjänsten
// säger, så att ett kryss inte blinkar till när någon annans ändring kommer emellan.
//
//   SamtalLive.folj(adress, omgångens id, vem, ta)   ta(lage, egen): läget
//       ändrades; lage = null när ingen har kryssat än, egen = det är svaret på
//       något du själv har skickat
//   SamtalLive.slapp()                               inte nu (dold sida, kupongen är klar)
//   SamtalLive.skicka(op)                            en ändring, se worker/kupongen.mjs
//   SamtalLive.foljer()                              kupongen följs (uppkopplad eller på väg)

window.SamtalLive = (() => {
  const PING_MS = 30000;
  // Har det inte kommit något på så här länge är uppkopplingen död, fast webbläsaren inte vet om det.
  const TYST_MS = 70000;
  const RETRY_MAX = 30000;
  // Kryss som inte kom fram på så här länge skickas inte: de andra har gått vidare.
  const GAMMAL_MS = 300000;
  const L = { ws: null, url: null, id: null, vem: null, ta: null, pa: false, n: 0, ej: [], lage: null, retry: 0, timer: 0, ping: 0, hort: 0 };

  // Det man har skickat ovanpå det som tjänsten sa (samma som andra i worker/kupongen.mjs).
  function ovanpa() {
    if (!L.ej.length) return L.lage;
    let l = L.lage ? { ...L.lage, val: { ...L.lage.val }, klar: [...L.lage.klar] } : null;
    for (const op of L.ej) {
      if (!l && op.bas) l = { id: L.id, val: { ...op.bas.val }, klar: [...(op.bas.klar || [])] };
      if (!l) l = { id: L.id, val: {}, klar: [] };
      if (op.satt) {
        l.val = { ...op.satt.val };
        l.klar = [...(op.satt.klar || [])];
      }
      if (op.match) {
        if (op.tecken) l.val[op.match] = op.tecken;
        else delete l.val[op.match];
      }
      for (const id of op.klubba || []) if (!l.klar.includes(id)) l.klar.push(id);
      if (op.sparad) l.sparad = op.sparad;
      // matchen på lappen, tills tjänsten har räknat upp sin valdV
      if ('vald' in op) Object.assign(l, { vald: op.vald, valdAv: L.vem, valdV: `n${op.n}` });
    }
    return l;
  }

  function stang() {
    clearTimeout(L.timer);
    clearInterval(L.ping);
    const ws = L.ws;
    L.ws = null;
    if (!ws) return;
    ws.onclose = null;
    ws.onmessage = null;
    ws.onopen = null;
    try { ws.close(); } catch { /* redan stängd */ }
  }

  function igen() {
    clearTimeout(L.timer);
    if (!L.pa) return;
    L.retry = Math.min(RETRY_MAX, L.retry ? L.retry * 2 : 1000);
    L.timer = setTimeout(koppla, L.retry);
  }

  function koppla() {
    stang();
    if (!L.pa || !('WebSocket' in window)) return;
    let ws;
    try {
      ws = new WebSocket(`${L.url}?id=${encodeURIComponent(L.id)}${L.vem ? `&vem=${encodeURIComponent(L.vem)}` : ''}`);
    } catch {
      igen();
      return;
    }
    L.ws = ws;
    ws.onopen = () => {
      L.retry = 0;
      L.hort = Date.now();
      const nu = Date.now();
      L.ej = L.ej.filter((op) => nu - op.at < GAMMAL_MS);
      for (const op of L.ej) ws.send(JSON.stringify(op));
      L.ping = setInterval(() => {
        if (Date.now() - L.hort > TYST_MS) koppla();
        else if (ws.readyState === 1) ws.send('ping');
      }, PING_MS);
    };
    ws.onmessage = (e) => {
      L.hort = Date.now();
      if (e.data === 'pong') return;
      let d;
      try { d = JSON.parse(e.data); } catch { return; }
      if (!d || !('lage' in d)) return;
      if (Number.isInteger(d.kvitto)) L.ej = L.ej.filter((op) => op.n > d.kvitto);
      L.lage = d.lage;
      if (L.ta) L.ta(ovanpa(), Number.isInteger(d.kvitto));
    };
    ws.onclose = () => {
      clearInterval(L.ping);
      if (L.ws === ws) L.ws = null;
      igen();
    };
  }

  addEventListener('online', () => {
    if (L.pa && !L.ws) {
      L.retry = 0;
      koppla();
    }
  });

  return {
    folj(url, id, vem, ta) {
      L.ta = ta;
      if (L.pa && L.url === url && L.id === id && L.vem === vem) return;
      if (L.id !== id) {
        L.ej = [];
        L.lage = null;
      }
      Object.assign(L, { url, id, vem, pa: true, retry: 0 });
      koppla();
    },
    slapp() {
      L.pa = false;
      stang();
    },
    skicka(op) {
      if (!L.id) return;
      const o = { ...op, n: ++L.n, at: Date.now() };
      L.ej.push(o);
      if (L.ej.length > 300) L.ej.shift();
      if (L.ws && L.ws.readyState === 1) L.ws.send(JSON.stringify(o));
    },
    foljer: () => L.pa,
    kopplad: () => Boolean(L.ws && L.ws.readyState === 1),
  };
})();
