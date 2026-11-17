'use strict';

// ---------- gänget i bild på tv:n ----------
//
// Medan vi pratar i telefon kan var och en visa sig på tv:n uppe i hörnet i
// tobaksaffären (rum-tv.js), om man vill: tv:ns AV-ingång, som när man kopplade
// in en videokamera. Bara bild – rösten går i telefonen, så inget eko.
//
// Så går det till:
//  – Nära tv:n står Visa dig på tv:n i foten, bredvid Tillbaka. Ett tryck tänder
//    kameran (webbläsaren frågar första gången), och tv:n byter till AV: man ser
//    sig själv, och de andra ser en på sin tv. Stäng av kameran släcker den, och
//    står kvar i foten var man än är i rummet så länge den är tänd.
//  – Visar sig någon byter tv:n till AV hos de andra av sig själv, med ett
//    ögonblick snö som när man bytte kanal, så att man ser hen direkt (också på
//    håll: rutan lyser då fullt). Slutar alla visa sig går tv:n tillbaka till
//    text-tv:n.
//  – Den som visar sig står stort på rutan, två bredvid varandra, med namnet vi
//    kallas (Tippoang.kallas) i sin färg nere i hörnet. Man ser sig själv i en
//    liten bild nere till höger (bild i bild), spegelvänd som i en spegel – eller
//    stort när ingen annan visar sig, med vilka som ser en under. De som har
//    tv:n på utan att visa sig står som porträtt uppe till höger (ser på).
//  – TV/AV i knappsatsen och Gänget i bild på 300 byter mellan text-tv:n och
//    AV; en sida, en siffra eller ▲ ▼ går tillbaka till text-tv:n (rum-tv.js).
//  – Fliken dold eller rummet stängt: kameran släcks och tänds igen av sig själv
//    när man kommer tillbaka inom tio minuter (ATER) – så bryts inget när man
//    växlar till telefonsamtalet en stund.
//
// Vem du är: den du har valt i rummet (Samtal.pult.du()), annars den enheten
// minns från kupongen, annars frågar tv:n (Vem är du?, sparas för tv:n i
// profeterna.tv.vem). Den som inte är någon i gänget kopplas inte upp och ser
// ingen. Vem man är väljer man själv, som på kupongen (README → Säkerhet): den
// som visar sig ser därför vilka som ser en.
//
// Bilden går direkt mellan webbläsarna (WebRTC, en förbindelse mellan varje par
// där minst en visar sig och båda har tv:n på AV). Tjänsten profeterna-rummet
// (worker/bilden.mjs, websocketen /bild bredvid rummets /rum) säger vilka som är
// med och för vidare erbjudandena och vägarna mellan dem – ingen bild går genom
// den. Kommer de inte fram till varandra direkt går bilden genom Cloudflares TURN,
// när tjänsten har en nyckel till det. Erbjudandena görs som i "perfect
// negotiation": krockar två lämnar den som har det högre fönster-id:t efter.
//
//   RumBild.mount(el, { tv })   när tv:n är byggd (rum.js); tv = RumTv.mount(…)
//   RumBild.on(true | false)    rummet visas eller inte
//   RumBild.avVal(on)           den som tittar bytte själv på tv:n (TV/AV, en sida …)
//
// För prov: ?rum-bild=ws://127.0.0.1:8787/bild (en annan tjänst, t.ex. wrangler
// dev) och ?rum-bild-vem=DT (vem du är här).

window.RumBild = (() => {
  const q = new URLSearchParams(location.search);
  const TV_VEM = 'profeterna.tv.vem';
  const SAMTAL_VEM = 'profeterna.samtal.vem';
  const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
  // 4:3 som rutan; framkameran i telefonen
  const KAMERA = { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } }, audio: false };
  const ATER = 10 * 60 * 1000;
  // så länge en förbindelse får leta innan rutan säger att det inte går
  const LETA = 15000;
  const fonster = () => [...crypto.getRandomValues(new Uint8Array(12))].map((x) => (x % 36).toString(36)).join('');

  const B = {
    el: null, tv: null, av: null, knapp: null,
    on: false, ws: null, uppe: false, timer: 0, ping: 0, retry: 0, vem: null, vemT: 0,
    id: fonster(), ice: null, alla: [], peers: new Map(),
    stream: null, startar: false, fel: '', valj: null,
    visa: false, sett: new Set(), sander: false, ater: 0, skickat: '',
  };

  // ---------- vem du är ----------

  const las = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const spara = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privat läge */ } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  // (KP i kupong.js är en global const, inte window.KP)
  const samtal = () => (typeof KP !== 'undefined' && KP.data && KP.data.samtal) || null;
  const gang = () => (samtal() && samtal().gang) || [];
  const iGang = (v) => gang().some((g) => g.id === v);
  const person = (v) => gang().find((g) => g.id === v) || { id: v, namn: v };
  const kallas = (v) => (window.Tippoang && Tippoang.kallas ? Tippoang.kallas(person(v)) : v);
  const nr = (v) => Math.max(0, gang().findIndex((g) => g.id === v));
  function jag() {
    const prov = q.get('rum-bild-vem');
    if (prov && iGang(prov)) return prov;
    const du = window.Samtal && Samtal.pult && Samtal.pult.du ? Samtal.pult.du() : null;
    return [du, las(SAMTAL_VEM), las(TV_VEM)].find(iGang) || null;
  }
  function adress() {
    const u = q.get('rum-bild') || (samtal() && samtal().rummet ? String(samtal().rummet).replace(/\/rum$/, '/bild') : '');
    return /^wss?:\/\/.+\/bild$/.test(u) ? u : null;
  }
  const kan = () => Boolean(adress() && 'WebSocket' in window && 'RTCPeerConnection' in window);
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ord = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} och ${xs[xs.length - 1]}` : xs[0] || '');

  // ---------- tjänsten ----------

  function koppla() {
    if (B.ws || !B.on || document.hidden || !kan()) return;
    const v = jag();
    if (!v) return;
    let ws;
    try { ws = new WebSocket(`${adress()}?vem=${encodeURIComponent(v)}&id=${B.id}`); } catch { return; }
    B.ws = ws;
    B.vem = v;
    B.skickat = '';
    ws.onopen = () => {
      B.retry = 0;
      B.uppe = true;
      skickaLage();
      clearInterval(B.ping);
      B.ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 30000);
      ordna();
    };
    ws.onmessage = (e) => {
      if (e.data === 'pong' || B.ws !== ws) return;
      let d;
      try { d = JSON.parse(e.data); } catch { return; }
      if (!d || typeof d !== 'object') return;
      if (Array.isArray(d.ice)) B.ice = d.ice;
      if (Array.isArray(d.alla)) {
        B.alla = d.alla.filter((p) => p && p.id && p.id !== B.id && iGang(p.vem));
        ordna();
      }
      if (d.fran && d.sig) signal(d);
    };
    ws.onclose = () => {
      clearInterval(B.ping);
      if (B.ws !== ws) return;
      B.ws = null;
      B.uppe = false;
      for (const id of [...B.peers.keys()]) stang(id);
      B.alla = [];
      ordna();
      // försök igen om en stund (längre och längre, högst en minut)
      if (B.on && !document.hidden) {
        clearTimeout(B.timer);
        B.timer = setTimeout(() => { B.timer = 0; koppla(); }, Math.min(60000, 2000 * 2 ** B.retry++));
      }
    };
  }
  function kopplaNer() {
    clearTimeout(B.timer);
    B.timer = 0;
    clearInterval(B.ping);
    const ws = B.ws;
    B.ws = null;
    B.uppe = false;
    if (ws) try { ws.close(1000); } catch { /* inget */ }
    for (const id of [...B.peers.keys()]) stang(id);
    B.alla = [];
    ordna();
  }
  const skicka = (d) => { if (B.ws && B.ws.readyState === 1) B.ws.send(JSON.stringify(d)); };
  // Hur det är med dig: visar du dig, och har du tv:n på AV?
  function skickaLage() {
    const l = { kamera: Boolean(B.stream), med: Boolean(B.stream) || B.visa };
    const k = JSON.stringify(l);
    if (!B.ws || B.ws.readyState !== 1 || k === B.skickat) return;
    B.skickat = k;
    skicka({ lage: l });
  }

  // ---------- förbindelserna ----------

  // En förbindelse till ett annat fönster, när minst en av er visar sig och båda
  // har tv:n på AV.
  function peer(p) {
    const pc = new RTCPeerConnection({ iceServers: B.ice || STUN });
    const x = { id: p.id, vem: p.vem, pc, polite: B.id > p.id, making: false, ignore: false, ko: Promise.resolve(), video: null, ruta: null, bild: false, sedan: Date.now() };
    // (erbjudandet och svaret görs uttryckligen och krocken backas uttryckligen,
    // så att det fungerar också i äldre Safari)
    pc.onnegotiationneeded = async () => {
      try {
        x.making = true;
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        skicka({ till: x.id, sig: { sdp: pc.localDescription } });
      } catch (e) {
        // (krockade det med det andras erbjudande tar svaret över: väntat)
        if (!e || e.name !== 'InvalidStateError') console.warn('Gänget i bild: erbjudandet', e);
      } finally {
        x.making = false;
      }
    };
    pc.onicecandidate = (e) => skicka({ till: x.id, sig: { ice: e.candidate ? e.candidate.toJSON() : null } });
    pc.ontrack = (e) => {
      if (e.track.kind !== 'video') return;
      const v = videon(x);
      const fram = () => {
        if (!v.srcObject || v.srcObject.getVideoTracks()[0] !== e.track) v.srcObject = new MediaStream([e.track]);
        v.play().catch(() => {});
      };
      fram();
      e.track.onmute = () => { x.bild = false; rita(); };
      e.track.onunmute = () => {
        fram();
        x.bild = true;
        rita();
      };
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') x.sedan = 0;
      else if (!x.sedan) x.sedan = Date.now();
      // tappar den kontakten letar den nya vägar
      if (s === 'failed' && pc.restartIce) pc.restartIce();
      rita();
    };
    B.peers.set(p.id, x);
    if (B.stream) sand(x);
    return x;
  }
  // Din kamera till en förbindelse: på samma sändare igen om det finns en.
  // (addTrack och inte addTransceiver: krockar två erbjudanden tas sändaren
  // med i det andras, så att det blir en enda bild åt vardera hållet.)
  function sand(x) {
    const t = B.stream && B.stream.getVideoTracks()[0];
    if (!t || x.pc.signalingState === 'closed') return;
    const tr = x.pc.getTransceivers().find((r) => !r.stopped && r.receiver.track && r.receiver.track.kind === 'video');
    if (!tr) {
      x.pc.addTrack(t, B.stream);
      return;
    }
    tr.sender.replaceTrack(t).catch(() => {});
    if (tr.sender.setStreams) tr.sender.setStreams(B.stream);
    if (tr.direction !== 'sendrecv') tr.direction = 'sendrecv';
  }
  // Kameran släckt: sändaren tystnar, och förbindelsen tar bara emot.
  function tyst(x) {
    if (x.pc.signalingState === 'closed') return;
    for (const tr of x.pc.getTransceivers()) {
      if (tr.stopped || !tr.sender.track) continue;
      tr.sender.replaceTrack(null).catch(() => {});
      tr.direction = 'recvonly';
    }
  }
  function stang(id) {
    const x = B.peers.get(id);
    if (!x) return;
    B.peers.delete(id);
    try { x.pc.close(); } catch { /* stängd */ }
    if (x.video) x.video.srcObject = null;
    if (x.ruta) x.ruta.remove();
  }
  // Det andra fönstret säger något: i tur och ordning per förbindelse.
  function signal(d) {
    let x = B.peers.get(d.fran);
    if (!x) {
      if (!d.sig.sdp || d.sig.sdp.type !== 'offer' || !iGang(d.vem)) return;
      x = peer({ id: d.fran, vem: d.vem });
    }
    x.ko = x.ko.then(async () => {
      const pc = x.pc;
      if (pc.signalingState === 'closed') return;
      try {
        if (d.sig.sdp) {
          const krock = d.sig.sdp.type === 'offer' && (x.making || pc.signalingState !== 'stable');
          x.ignore = !x.polite && krock;
          if (x.ignore) return;
          if (krock && pc.signalingState === 'have-local-offer') await pc.setLocalDescription({ type: 'rollback' });
          await pc.setRemoteDescription(d.sig.sdp);
          if (d.sig.sdp.type === 'offer') {
            await pc.setLocalDescription(await pc.createAnswer());
            skicka({ till: x.id, sig: { sdp: pc.localDescription } });
          }
        } else if ('ice' in d.sig) {
          try {
            await pc.addIceCandidate(d.sig.ice || undefined);
          } catch (e) {
            if (!x.ignore) throw e;
          }
        }
      } catch (e) {
        console.warn('Gänget i bild:', e);
      }
    });
  }

  // Läget efter en ändring: tv:n byter till AV när någon ny visar sig, och
  // tillbaka när ingen gör det längre; förbindelserna där de behövs.
  function ordna() {
    const sander = B.alla.filter((p) => p.kamera);
    const nya = sander.filter((p) => !B.sett.has(p.id));
    for (const id of [...B.sett]) if (!sander.some((p) => p.id === id)) B.sett.delete(id);
    for (const p of nya) B.sett.add(p.id);
    if (B.on && B.tv) {
      if (nya.length && !B.visa) {
        B.visa = true;
        B.tv.av(true);
      } else if (!sander.length && B.sander && !B.stream && B.visa && !B.valj && !B.fel) {
        B.visa = false;
        B.tv.av(false);
      }
    }
    B.sander = sander.length > 0;
    const med = Boolean(B.stream) || B.visa;
    for (const p of B.alla) {
      const ska = med && p.med && (Boolean(B.stream) || p.kamera);
      const x = B.peers.get(p.id);
      if (ska && !x) peer(p);
      else if (!ska && x) stang(p.id);
      else if (x) x.vem = p.vem;
    }
    for (const id of [...B.peers.keys()]) if (!B.alla.some((p) => p.id === id)) stang(id);
    skickaLage();
    rita();
    knapp();
  }

  // ---------- kameran ----------

  async function kameraPa() {
    if (B.stream || B.startar) return;
    if (!jag()) {
      vemFraga('kamera');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      B.fel = 'Webbläsaren kan inte använda kameran här.';
      visa(true);
      return;
    }
    B.startar = true;
    B.fel = '';
    B.valj = null;
    knapp();
    try {
      const s = await navigator.mediaDevices.getUserMedia(KAMERA);
      if (!B.on || document.hidden) {
        for (const t of s.getTracks()) t.stop();
        B.ater = Date.now();
        return;
      }
      B.stream = s;
      B.ater = 0;
      // (tar en annan app kameran slutar bilden: då är den släckt)
      for (const t of s.getTracks()) t.onended = () => { if (B.stream === s) kameraAv(); };
      for (const x of B.peers.values()) sand(x);
      B.visa = true;
      if (B.tv) B.tv.av(true);
      koppla();
    } catch (e) {
      const n = e && e.name;
      B.fel = n === 'NotAllowedError' || n === 'SecurityError' ? 'Kameran fick inte startas. Tillåt den för sajten i webbläsaren och försök igen.'
        : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'Hittar ingen kamera.'
          : n === 'NotReadableError' ? 'Kameran används av något annat just nu.' : 'Kameran gick inte att starta.';
      B.visa = true;
      if (B.tv) B.tv.av(true);
    } finally {
      B.startar = false;
      ordna();
    }
  }
  // ater: släckt för att fliken dolts eller rummet stängts – tänds igen om man
  // kommer tillbaka inom ATER.
  function kameraAv(ater = false) {
    const s = B.stream;
    if (!s) return;
    B.stream = null;
    for (const t of s.getTracks()) t.stop();
    for (const x of B.peers.values()) tyst(x);
    B.ater = ater ? Date.now() : 0;
    // ingen annan i bild: tillbaka till text-tv:n
    if (!ater && B.visa && !B.alla.some((p) => p.kamera)) {
      B.visa = false;
      if (B.tv) B.tv.av(false);
    }
    ordna();
  }
  function visa(on) {
    B.visa = Boolean(on);
    if (B.tv) B.tv.av(B.visa);
    if (!B.visa) {
      B.valj = null;
      B.fel = '';
    }
    ordna();
  }
  // Vem är du? på tv:n: för = vad som händer sedan (kameran eller bara titta).
  function vemFraga(for_) {
    B.valj = for_;
    visa(true);
  }
  function valdes(v) {
    if (!iGang(v)) return;
    spara(TV_VEM, v);
    const for_ = B.valj;
    B.valj = null;
    koppla();
    if (for_ === 'kamera') kameraPa();
    else ordna();
  }

  // ---------- bilden på tv:n ----------

  // Snö i rutan medan bilden letar sig fram, och när tv:n byter kanal: en
  // bild med brus som flyttas i hopp (rum-tv.css, --sno).
  function sno() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const d = g.createImageData(64, 64);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() < 0.08 ? 255 : Math.random() * 190;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    return `url(${c.toDataURL()})`;
  }

  function videon(x) {
    if (x.video) return x.video;
    const v = document.createElement('video');
    v.autoplay = true;
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    const fick = () => { if (v.videoWidth) { x.bild = true; rita(); } };
    v.addEventListener('playing', fick);
    v.addEventListener('resize', fick);
    x.video = v;
    return v;
  }

  const portratt = (v) => {
    const g = person(v);
    return g.bild ? `<img src="${esc(g.bild)}" alt="" draggable="false" decoding="async">` : `<span>${esc(v)}</span>`;
  };

  function rita() {
    const av = B.av;
    if (!av) return;
    const sander = [...B.peers.values()].filter((x) => B.alla.some((p) => p.id === x.id && p.kamera));
    const ser = B.alla.filter((p) => p.med && !p.kamera);
    const n = sander.length;
    av.classList.toggle('jag-pa', Boolean(B.stream));
    av.dataset.n = String(n);
    // de som visar sig: en ruta var, sida vid sida
    sander.forEach((x, i) => {
      if (!x.ruta) {
        x.ruta = document.createElement('div');
        x.ruta.className = 'av-ruta';
        x.ruta.innerHTML = '<i class="av-sno"></i><b class="av-namn"></b><b class="av-tappad">Ingen kontakt</b>';
        x.ruta.prepend(videon(x));
        av.querySelector('.av-rutor').append(x.ruta);
        x.video.play().catch(() => {});
      }
      const r = x.ruta;
      r.className = `av-ruta k${nr(x.vem)}${x.bild ? '' : ' letar'}${x.sedan && Date.now() - x.sedan > LETA && !x.bild ? ' tappad' : ''}`;
      r.style.cssText = n === 1 ? 'left:0;top:0;width:100%;height:100%' : `left:${(100 / n) * i}%;top:0;width:${100 / n}%;height:100%`;
      const namn = r.querySelector('.av-namn');
      if (namn.textContent !== kallas(x.vem)) namn.textContent = kallas(x.vem);
    });
    for (const x of B.peers.values()) {
      if (x.ruta && !sander.includes(x)) {
        x.ruta.remove();
        x.ruta = null;
      }
    }
    // du själv: liten nere till höger, eller stor när ingen annan visar sig
    const egen = av.querySelector('.av-jag');
    const ev = egen.querySelector('video');
    if (B.stream) {
      if (ev.srcObject !== B.stream) {
        ev.srcObject = B.stream;
        ev.play().catch(() => {});
      }
      egen.hidden = false;
      egen.classList.toggle('stor', !n);
    } else {
      egen.hidden = true;
      if (ev.srcObject) ev.srcObject = null;
    }
    const under = av.querySelector('.av-under');
    const serDig = B.alla.filter((p) => p.med).map((p) => kallas(p.vem));
    under.textContent = B.stream && !n ? (serDig.length ? `${ord([...new Set(serDig)])} ser dig` : 'Ingen annan har tv:n på') : '';
    under.hidden = !under.textContent;
    // de som har tv:n på utan att visa sig
    const serEl = av.querySelector('.av-ser');
    const nyckel = ser.map((p) => p.id).join();
    if (serEl.dataset.k !== nyckel) {
      serEl.dataset.k = nyckel;
      serEl.innerHTML = ser.length ? `<span>ser på</span>${ser.map((p) => `<i class="k${nr(p.vem)}" title="${esc(kallas(p.vem))}">${portratt(p.vem)}</i>`).join('')}` : '';
    }
    serEl.hidden = !ser.length;
    // den blå rutan: ingen bild att visa, eller något att säga
    const bla = av.querySelector('.av-bla');
    const tom = !n && !B.stream;
    bla.hidden = !tom && !B.valj;
    if (!bla.hidden) {
      let h;
      if (B.valj) {
        h = `<p class="av-rubrik">Vem är du?</p><div class="av-vem">${gang().map((g) => `<button type="button" class="k${nr(g.id)}" data-vem="${esc(g.id)}">${portratt(g.id)}<b>${esc(kallas(g.id))}</b></button>`).join('')}</div>`;
      } else if (B.fel) {
        h = `<p class="av-rubrik">Gänget i bild</p><p class="av-text">${esc(B.fel)}</p>`;
      } else if (B.startar) {
        h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Kameran startar …</p>';
      } else if (!jag()) {
        h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Här syns de i gänget som visar sig medan ni pratar i telefon.</p>';
      } else if (!B.uppe) {
        h = `<p class="av-rubrik">Gänget i bild</p><p class="av-text">${kan() ? 'Söker gänget …' : 'Går inte i den här webbläsaren.'}</p>`;
      } else {
        h = '<p class="av-rubrik">Ingen i bild</p><p class="av-text">Tryck på <b>Visa dig på tv:n</b>, så syns du här hos de andra.</p>';
      }
      if (bla.dataset.h !== h) {
        bla.dataset.h = h;
        bla.innerHTML = h;
      }
    }
    // (letar en förbindelse ritas rutan om när tiden har gått)
    clearTimeout(B.ritaT);
    if (sander.some((x) => !x.bild && x.sedan)) B.ritaT = setTimeout(rita, 2000);
  }

  // Knappen i foten: Visa dig på tv:n nära tv:n, och Stäng av kameran var man
  // än är i rummet medan den är tänd (rum.css).
  function knapp() {
    const k = B.knapp;
    if (!k) return;
    k.hidden = !kan();
    const pa = Boolean(B.stream) || B.startar;
    k.classList.toggle('pa', pa);
    k.classList.toggle('sander', Boolean(B.stream));
    const t = B.startar ? 'Kameran startar …' : B.stream ? 'Stäng av kameran' : 'Visa dig på tv:n';
    if (k.textContent !== t) k.textContent = t;
    k.setAttribute('aria-pressed', String(Boolean(B.stream)));
  }

  // ---------- i rummet ----------

  function mount(el, o) {
    B.el = el;
    B.tv = o.tv;
    B.av = B.tv && B.tv.avEl;
    B.knapp = el.querySelector('.rum-bildknapp');
    if (!B.av) return;
    B.av.innerHTML = '<div class="av-rutor"></div><div class="av-jag" hidden><video autoplay muted playsinline aria-hidden="true"></video></div>' +
      '<p class="av-under" hidden></p><div class="av-ser" hidden></div><div class="av-bla"></div><b class="av-osd" aria-hidden="true">AV</b>';
    const ev = B.av.querySelector('.av-jag video');
    ev.muted = true;
    ev.playsInline = true;
    const glas = B.av.closest('.tv-glas');
    if (glas && !calm()) glas.style.setProperty('--sno', sno());
    B.av.addEventListener('click', (e) => {
      const b = e.target.closest('[data-vem]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      valdes(b.dataset.vem);
    });
    if (B.knapp) {
      const tryck = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (B.stream) kameraAv();
        else kameraPa();
      };
      B.knapp.addEventListener('click', tryck);
      B.knapp.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') tryck(e); });
    }
    knapp();
    rita();
    if (B.on) koppla();
  }

  function on(v) {
    v = Boolean(v);
    if (v === B.on) return;
    B.on = v;
    if (v) {
      koppla();
      if (B.ater && Date.now() - B.ater < ATER) kameraPa();
      vemKoll();
    } else {
      if (B.stream) kameraAv(true);
      kopplaNer();
    }
  }
  // Har du blivit någon annan i rummet kopplar sidan upp sig som hen.
  function vemKoll() {
    clearInterval(B.vemT);
    if (!B.on) return;
    B.vemT = setInterval(() => {
      if (!B.on || document.hidden) return;
      const v = jag();
      if (B.ws && v !== B.vem) {
        if (B.stream) kameraAv();
        kopplaNer();
      }
      // (inte medan den väntar på att försöka igen)
      if (!B.ws && !B.timer) koppla();
      knapp();
    }, 3000);
  }
  addEventListener('visibilitychange', () => {
    if (!B.on) return;
    if (document.hidden) {
      if (B.stream) kameraAv(true);
      kopplaNer();
    } else {
      koppla();
      if (B.ater && Date.now() - B.ater < ATER) kameraPa();
    }
  });
  addEventListener('pagehide', () => { if (B.stream) for (const t of B.stream.getTracks()) t.stop(); });

  // Den som tittar bytte själv på tv:n (TV/AV, Gänget i bild, en sida …).
  function avVal(on2) {
    B.visa = Boolean(on2);
    if (B.visa && !jag()) B.valj = 'titta';
    if (!B.visa) {
      B.valj = null;
      B.fel = '';
    }
    ordna();
  }

  return { mount, on, avVal, pa: () => Boolean(B.stream) };
})();
