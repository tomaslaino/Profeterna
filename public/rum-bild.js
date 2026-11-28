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
//  – Ta med tv:n (i foten nära tv:n): man stannar i rummet, bilden krymper till
//    en liten tv i hörnet medan kameran går tillbaka, och tv:n tas ner med sin
//    hylla – armen står kvar på väggen. Den lilla tv:n följer med vart man än
//    går: till datorn, Hasse Backe, kupongen, ut på trottoaren och ut ur rummet
//    till resten av sajten.
//    Den visar tv:ns egen ruta – text-tv:n, som går vidare, eller AV – och byter
//    till AV när någon visar sig, som i rummet; kameran och bilden fortsätter.
//    Ett tryck på den (eller T, eller ett klick där den stod) bär tillbaka
//    tv:n: kameran går fram till den och bilden flyger in i den. Krysset stänger
//    den (kameran släcks) och tv:n står på väggen igen. Den går att dra till ett
//    annat hörn, och står där sedan (profeterna.tv.horn). Till Tabeller,
//    Statistik och Om oss, som är egna sidor, följer den med genom att koppla upp
//    sig igen (sessionStorage profeterna.tv.foljer, tv-med.js laddar det som
//    behövs där); text-tv:n finns bara på förstasidan, så där syns den lilla
//    tv:n bara med AV.
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
//   RumBild.foljer()            tv:n följer med (den lilla tv:n), i rummet eller utanför
//   RumBild.hem()               tv:n bärs tillbaka upp på väggen, och kameran går fram (T, där den stod)
//   RumBild.knapp()             tv:n slogs av eller på (Ta med tv:n i foten)
//
// För prov: ?rum-bild=ws://127.0.0.1:8787/bild (en annan tjänst, t.ex. wrangler
// dev) och ?rum-bild-vem=DT (vem du är här).

window.RumBild = (() => {
  const q = new URLSearchParams(location.search);
  const TV_VEM = 'profeterna.tv.vem';
  const SAMTAL_VEM = 'profeterna.samtal.vem';
  // tv:n följer med till en annan sida på sajten ({ t, kamera }), och ett tryck på
  // den lilla tv:n där som ska fram till tv:n i rummet (sessionStorage)
  const FOLJER = 'profeterna.tv.foljer';
  const TILL_TV = 'profeterna.tv.till';
  const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
  // 4:3 som rutan; framkameran i telefonen
  const KAMERA = { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } }, audio: false };
  const ATER = 10 * 60 * 1000;
  // så länge en förbindelse får leta innan rutan säger att det inte går
  const LETA = 15000;
  const fonster = () => [...crypto.getRandomValues(new Uint8Array(12))].map((x) => (x % 36).toString(36)).join('');

  const B = {
    el: null, tv: null, knapp: null, tamed: null,
    // ute: tv:n följer med, i rummet och ut ur det (mini: den lilla tv:n, horn: dess hörn, fran: var
    // tv:n stod när den togs med, drogs: den drogs nyss), tillTv: fram till tv:n när rummet visas,
    // ram: där tv:ns ruta sitter i tv:n
    ute: false, mini: null, horn: 'oh', drogs: false, inne: null, fran: null, tillTv: false, samtal: null, ram: null,
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
  // (på sidorna utan kupong.js hämtar redo() samma uppgifter)
  const samtal = () => (typeof KP !== 'undefined' && KP.data && KP.data.samtal) || B.samtal || null;
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
  // i rummet, eller med tv:n som följer med
  const aktiv = () => B.on || B.ute;

  // Gänget och tjänstens adress (data/kuponger.json): kupong.js läser dem på
  // förstasidan (loadCoupons); på Tabeller, Statistik och Om oss hämtas de här. → om de finns
  let redoP = null;
  function redo() {
    if (samtal()) return Promise.resolve(true);
    if (!redoP) {
      redoP = new Promise((res) => {
        if (typeof KP === 'undefined') {
          fetch('data/kuponger.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null))
            .then((d) => { B.samtal = (d && d.samtal) || null; }, () => {})
            .then(() => res(Boolean(samtal())));
          return;
        }
        // (kupong.js läser filen bara på de delar som visar kupongen)
        if (typeof loadCoupons === 'function') {
          loadCoupons().catch(() => {}).then(() => res(Boolean(samtal())));
          return;
        }
        let n = 0;
        const t = setInterval(() => {
          if (!samtal() && ++n < 80) return;
          clearInterval(t);
          res(Boolean(samtal()));
        }, 250);
      });
      redoP.then(() => { redoP = null; });
    }
    return redoP;
  }
  const ord = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} och ${xs[xs.length - 1]}` : xs[0] || '');

  // ---------- tjänsten ----------

  function koppla() {
    if (B.ws || !aktiv() || document.hidden) return;
    if (!samtal()) {
      redo().then((ok) => { if (ok) koppla(); });
      return;
    }
    if (!kan()) return;
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
      if (aktiv() && !document.hidden) {
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
    // (med tv:n som följer med: inte medan förbindelsen till tjänsten är nere –
    // då vet den inte om någon slutade, och den lilla tv:n ska inte slockna av det)
    const vet = B.uppe || !B.ute;
    if (aktiv() && (B.tv || B.ute)) {
      if (nya.length && !B.visa) {
        B.visa = true;
        if (B.tv) B.tv.av(true);
      } else if (vet && !sander.length && B.sander && !B.stream && B.visa && !B.valj && !B.fel) {
        B.visa = false;
        if (B.tv) B.tv.av(false);
      }
    }
    if (vet) B.sander = sander.length > 0;
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
    if (B.ute) miniLage();
  }

  // ---------- kameran ----------

  async function kameraPa() {
    if (B.stream || B.startar) return;
    if (!jag()) {
      // (gänget är inte läst än: sedan)
      if (!gang().length) redo().then((ok) => { if (ok && aktiv() && gang().length) kameraPa(); });
      else vemFraga('kamera');
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
      if (!aktiv() || document.hidden) {
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
    const av = B.inne;
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
  // än är i rummet medan den är tänd (rum.css). Ta med tv:n står bredvid, nära
  // tv:n när den är på (inte medan den frågar Vem är du?).
  function knapp() {
    if (B.tamed) B.tamed.hidden = Boolean(B.valj) || !(B.tv && B.tv.pa());
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

  // ---------- rutan ----------

  // Det som står på rutan: i tv:n i rummet, eller i den lilla tv:n när tv:n
  // följer med (plats). Videorna flyttas med och spelar vidare.
  function inne() {
    if (B.inne) return B.inne;
    const d = document.createElement('div');
    d.className = 'av-inne';
    d.innerHTML = '<div class="av-rutor"></div><div class="av-jag" hidden><video autoplay muted playsinline aria-hidden="true"></video></div>' +
      '<p class="av-under" hidden></p><div class="av-ser" hidden></div><div class="av-bla"></div><b class="av-osd" aria-hidden="true">AV</b>';
    const ev = d.querySelector('.av-jag video');
    ev.muted = true;
    ev.playsInline = true;
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-vem]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      valdes(b.dataset.vem);
    });
    B.inne = d;
    return d;
  }
  // Tv:ns ruta (text-tv:n och AV) sitter i tv:n, och i den lilla tv:n när den
  // följer med – då är tv:n borta från väggen i rummet (glid: den tonar bort eller
  // fram). Finns ingen tv på sidan (Tabeller, Statistik och Om oss) har den lilla
  // tv:n en egen ruta med bara AV.
  function plats(glid = false) {
    const d = inne();
    const ute = B.ute;
    const g = B.tv && B.tv.glas;
    if (g) {
      if (d.parentNode !== B.tv.avEl) B.tv.avEl.append(d);
      const ram = ute ? mini().querySelector('.tv-ram') : B.ram;
      if (g.parentNode !== ram) ram.append(g);
      if (B.mini) B.mini.querySelector('.tv-glas.egen').hidden = ute;
      B.tv.ute(ute, glid);
    } else if (ute) {
      const dit = mini().querySelector('.tv-av');
      if (d.parentNode !== dit) dit.append(d);
    }
    for (const v of d.querySelectorAll('video')) if (v.srcObject) v.play().catch(() => {});
  }
  // En tv på den här sidan (rummets, eller byggd utan rummet: Rum.tvUtan).
  function tvIn(tv) {
    B.tv = tv;
    B.ram = tv.glas.parentNode;
    if (!calm()) tv.glas.style.setProperty('--sno', sno());
    if (B.visa) tv.av(true);
  }

  // ---------- tv:n som följer med ----------
  //
  // Den lilla tv:n: samma Panasonic som i rummet utan panelen med knapparna
  // (rum-tv.css), i ett hörn av fönstret – uppe till höger från början, och där
  // man har dragit den sedan (HORN). Ett tryck på den bär tillbaka tv:n till
  // väggen i rummet, krysset stänger den. Den ligger i det översta lagret
  // (popover), så att den syns över allt som kommer fram i rummet och över
  // matchrutan.

  const HORN = 'profeterna.tv.horn';
  B.horn = /^[on][hv]$/.test(las(HORN) || '') ? las(HORN) : 'oh';
  const pop = (m) => typeof m.showPopover === 'function';
  const oppen = (m) => (pop(m) ? m.matches(':popover-open') : !m.hidden);
  function oppna(m, on) {
    if (on === oppen(m)) return;
    if (!pop(m)) m.hidden = !on;
    else if (on) m.showPopover();
    else m.hidePopover();
  }
  // (bara rörelserna som den lilla tv:n själv sätter igång, inte stilens egna)
  const egna = (e) => e.getAnimations().filter((a) => !a.animationName && !a.transitionProperty);
  function mini() {
    if (B.mini) return B.mini;
    const m = document.createElement('div');
    m.className = 'tv-mini';
    if (pop(m)) m.popover = 'manual';
    else m.hidden = true;
    m.innerHTML = '<button type="button" class="tv-mini-in" aria-label="Till tv:n i tobaksaffären"></button>' +
      '<div class="tv-front"><div class="tv-ram"><div class="tv-glas egen"><div class="tv-av"></div><i class="tv-scan"></i><i class="tv-glans"></i></div></div>' +
      '<i class="tv-namn">Panasonic</i><i class="tv-mini-lampa"></i></div>' +
      '<button type="button" class="tv-mini-x" aria-label="Stäng tv:n"></button>';
    if (!calm()) m.querySelector('.tv-glas').style.setProperty('--sno', sno());
    const inn = m.querySelector('.tv-mini-in');
    inn.addEventListener('click', () => {
      // (när man har dragit den är släppet inget tryck)
      if (B.drogs) {
        B.drogs = false;
        return;
      }
      tillbaka();
    });
    m.querySelector('.tv-mini-x').addEventListener('click', (e) => {
      e.stopPropagation();
      sluta(true);
    });
    dra(m, inn);
    document.body.append(m);
    B.mini = m;
    // på sin plats igen när fönstret ändras, och på sidorna när sidhuvudet skrollas undan i telefonen
    let f = 0;
    B.stall = () => { if (!f) f = requestAnimationFrame(() => { f = 0; stall(); }); };
    addEventListener('scroll', () => { if (B.ute) B.stall(); }, { passive: true });
    addEventListener('resize', () => { if (B.ute) B.stall(); });
    if (pop(m)) new MutationObserver((ms) => { if (ms.some((x) => x.target.tagName === 'DIALOG')) miniVard(); }).observe(document.body, { subtree: true, attributeFilter: ['open'] });
    stall();
    return m;
  }
  // Var den lilla tv:n står i sitt hörn (B.horn: o/n uppe eller nere, h/v höger eller vänster), som
  // avstånd från fönstrets kanter (--mx, --my; rum-tv.css lägger till telefonens säkra kanter). På
  // sidorna står den under sidhuvudet, som följs när det skrollas undan i telefonen. I rummet har den
  // samma kantluft som namnet och foten, och den hamnar aldrig över dem: står något av dem i samma hörn
  // står tv:n under eller ovanför det.
  function stall() {
    const m = B.mini;
    if (!m) return;
    const [ver, hor] = B.horn;
    for (const c of ['o', 'n', 'h', 'v']) m.classList.toggle(c, c === ver || c === hor);
    let mx;
    let my;
    if (document.documentElement.classList.contains('i-rummet')) {
      const liten = matchMedia('(max-width: 600px), (max-height: 500px)').matches;
      mx = liten ? 20 : 44;
      my = liten ? 16 : 26;
      for (const el of document.querySelectorAll('#rum-section > .rum-hdr, #rum-section > .rum-ft')) {
        const vis = el.querySelector('.rum-brand') || el;
        const r = el.getBoundingClientRect();
        if (!r.width || getComputedStyle(vis).visibility === 'hidden') continue;
        const sida = (r.left + r.right) / 2 > innerWidth / 2 ? 'h' : 'v';
        const rad = (r.top + r.bottom) / 2 < innerHeight / 2 ? 'o' : 'n';
        if (sida === hor && rad === ver) my = Math.max(my, ver === 'o' ? r.bottom + 12 : innerHeight - r.top + 12);
      }
    } else {
      const stor = matchMedia('(min-width: 761px)').matches;
      mx = stor ? 20 : 10;
      my = stor ? 14 : 10;
      const t = ver === 'o' && document.querySelector('.topbar');
      if (t && getComputedStyle(t).position !== 'static') my += Math.max(0, t.getBoundingClientRect().bottom);
    }
    m.style.setProperty('--mx', `${Math.round(mx)}px`);
    m.style.setProperty('--my', `${Math.round(my)}px`);
  }
  // Från där den stod (fore, en ruta i fönstret) till där den står nu, mjukt.
  function glid(fore, ms = 380) {
    const m = B.mini;
    if (!m || !fore || calm() || !oppen(m)) return;
    const r = m.getBoundingClientRect();
    const dx = fore.left - r.left;
    const dy = fore.top - r.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    m.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], { duration: ms, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' });
  }
  // Den lilla tv:n går att dra till ett annat hörn: den följer fingret eller musen och glider till det
  // hörn som är närmast när man släpper, och står där sedan (sparas på enheten). Ett tryck utan att dra
  // går till tv:n i rummet.
  function dra(m, inn) {
    let d = null;
    inn.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.button > 0 || m.classList.contains('slocknar') || m.classList.contains('hem')) return;
      d = { id: e.pointerId, x: e.clientX, y: e.clientY, gar: false };
    });
    inn.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.gar) {
        if (Math.hypot(dx, dy) < 8) return;
        d.gar = true;
        try { inn.setPointerCapture(e.pointerId); } catch { /* släppt */ }
        for (const a of egna(m)) a.finish();
        m.classList.add('drar');
      }
      m.style.translate = `${dx}px ${dy}px`;
    });
    const slapp = (e) => {
      if (!d || e.pointerId !== d.id) return;
      const gick = d.gar;
      d = null;
      if (!gick) return;
      B.drogs = true;
      setTimeout(() => { B.drogs = false; }, 400);
      const r = m.getBoundingClientRect();
      const horn = `${(r.top + r.bottom) / 2 < innerHeight / 2 ? 'o' : 'n'}${(r.left + r.right) / 2 > innerWidth / 2 ? 'h' : 'v'}`;
      m.classList.remove('drar');
      m.style.translate = '';
      if (horn !== B.horn) {
        B.horn = horn;
        spara(HORN, horn);
      }
      stall();
      glid(r);
    };
    inn.addEventListener('pointerup', slapp);
    inn.addEventListener('pointercancel', slapp);
  }
  // Matchrutan (en dialog) läggs överst och gör allt utanför sig obrukbart medan
  // den är öppen: den lilla tv:n flyttas in i den så länge och läggs överst igen.
  function miniVard() {
    const m = B.mini;
    if (!m || !pop(m)) return;
    let modal = null;
    for (const d of document.querySelectorAll('dialog[open]')) {
      try {
        if (d.matches(':modal')) modal = d;
      } catch {
        modal = d;
      }
    }
    const hem = modal || document.body;
    const syns = oppen(m) || m.parentNode !== hem;
    if (m.parentNode === hem && !modal) return;
    // (en popover som flyttas stängs, och läggs överst när den öppnas igen)
    if (oppen(m)) m.hidePopover();
    if (m.parentNode !== hem) hem.append(m);
    if (syns && B.ute) {
      m.showPopover();
      for (const v of m.querySelectorAll('video')) if (v.srcObject) v.play().catch(() => {});
    }
  }
  // Fram: krymp = från tv:n i rummet (Ta med tv:n), annars tänds den som en tv.
  function miniFram(hur) {
    const m = mini();
    const syns = oppen(m) && !m.classList.contains('slocknar');
    for (const e of [m, m.querySelector('.tv-ram')]) for (const a of egna(e)) a.cancel();
    m.classList.remove('slocknar', 'hem');
    stall();
    lampa();
    oppna(m, true);
    miniVard();
    if (syns || calm()) return;
    const fran = hur === 'krymp' && B.fran;
    B.fran = null;
    const r = m.getBoundingClientRect();
    if (fran && fran.width > 40 && r.width) {
      // (tv:ns front i rummet är bredare: panelen med knapparna sitter till höger om rutan)
      const k = (fran.width * (238 / 292)) / r.width;
      m.animate([
        { transform: `translate(${fran.left - r.left}px, ${fran.top - r.top}px) scale(${k})`, boxShadow: 'none' },
        { transform: 'none' },
      ], { duration: 600, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' });
    } else {
      m.querySelector('.tv-ram').animate([
        { transform: 'scale(0.04, 0.012)', filter: 'brightness(3)' },
        { transform: 'scale(1, 0.012)', filter: 'brightness(2.4)', offset: 0.35 },
        { transform: 'none', filter: 'none' },
      ], { duration: 380, easing: 'ease-out' });
      m.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1 }], { duration: 380 });
    }
  }
  // Bort: slocknar som en tv (krysset, och när alla har slutat visa sig), eller
  // direkt när tv:n är tillbaka i rummet.
  // efter: det som ska göras när den har slocknat.
  function miniBort(slocknar, efter) {
    const m = B.mini;
    if (!m || !oppen(m) || !slocknar || calm()) {
      if (m) oppna(m, false);
      if (efter) efter();
      return;
    }
    m.classList.add('slocknar');
    const g = m.querySelector('.tv-ram').animate([
      { transform: 'none', filter: 'none' },
      { transform: 'scale(1, 0.012)', filter: 'brightness(2.6)', offset: 0.55 },
      { transform: 'scale(0.03, 0.012)', filter: 'brightness(3)' },
    ], { duration: 340, easing: 'ease-in' });
    m.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 520 }).finished.then(() => {
      if (!m.classList.contains('slocknar')) return;
      m.classList.remove('slocknar');
      g.cancel();
      if (!skaSynas()) oppna(m, false);
      if (efter) efter();
    }, () => { if (efter) efter(); });
  }
  // Den lilla tv:n syns när tv:n följer med och har något att visa: tv:ns ruta,
  // eller AV i sin egen ruta där det inte finns någon tv.
  const skaSynas = () => B.ute && (B.visa || Boolean(B.tv));
  function miniLage() {
    if (!B.ute) return;
    const m = mini();
    lampa();
    const syns = skaSynas();
    if (syns && (!oppen(m) || m.classList.contains('slocknar'))) miniFram('tands');
    else if (!syns && oppen(m) && !m.classList.contains('slocknar')) miniBort(true);
  }
  // Den lilla tv:ns lampa: röd medan kameran är tänd.
  function lampa() {
    if (B.mini) B.mini.classList.toggle('sander', Boolean(B.stream));
  }

  const minns = () => {
    try { sessionStorage.setItem(FOLJER, JSON.stringify({ t: Date.now(), visa: B.visa, kamera: Boolean(B.stream) || Boolean(B.ater && Date.now() - B.ater < ATER) })); } catch { /* privat läge */ }
  };
  const glom = () => {
    try { sessionStorage.removeItem(FOLJER); } catch { /* privat läge */ }
  };

  // Ta med tv:n (i foten nära tv:n): bilden krymper till den lilla tv:n i hörnet
  // medan kameran går tillbaka, och tv:n tas ner från väggen. Allt på rutan fortsätter
  // där – i rummet, och ut ur det om man går till den vanliga sidan.
  function taMed() {
    if (!B.on || !B.tv || B.ute) return;
    const f = document.getElementById('rum-tvfront');
    B.fran = f ? f.getBoundingClientRect() : null;
    B.ute = true;
    if (window.Rum && Rum.tvUt) Rum.tvUt();
    plats(true);
    miniFram('krymp');
    ordna();
  }
  // Tv:n bärs tillbaka upp på väggen (ett tryck på den lilla tv:n, T eller ett klick
  // där den stod): kameran går fram till den var man än är i rummet, och
  // bilden i den lilla tv:n flyger in i den medan den kommer fram.
  function hem() {
    if (!B.ute || !B.on || !B.tv) return;
    const m = B.mini;
    const fran = m && oppen(m) && !m.classList.contains('slocknar') ? m.getBoundingClientRect() : null;
    B.ute = false;
    glom();
    // (tv:n tonar fram på väggen, med rutan tom tills bilden är framme)
    B.tv.ute(false, true);
    const mal = window.Rum && Rum.tv ? Rum.tv() : null;
    let klar = false;
    const in_ = () => {
      if (klar) return;
      klar = true;
      if (B.ute) return;
      if (m) {
        oppna(m, false);
        m.classList.remove('hem');
        for (const a of egna(m)) a.cancel();
      }
      plats();
    };
    if (!fran || !mal || calm()) {
      in_();
      return;
    }
    for (const e of [m, m.querySelector('.tv-ram')]) for (const a of egna(e)) a.cancel();
    m.classList.add('hem');
    const k = (mal.width * (238 / 292)) / fran.width;
    m.animate([
      { transform: 'none' },
      { transform: `translate(${mal.left - fran.left}px, ${mal.top - fran.top}px) scale(${k})`, boxShadow: 'none' },
    ], { duration: 600, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' }).finished.then(in_, in_);
  }
  // Ett tryck på den lilla tv:n: till tv:n i rummet. I rummet bärs den tillbaka
  // genast; på förstasidan visas rummet först, och från de andra sidorna laddas
  // förstasidan, och tv:n följer med dit.
  function tillbaka() {
    if (!B.ute) return;
    if (B.on) {
      hem();
      return;
    }
    if (window.Rum && Rum.fits()) {
      B.tillTv = true;
      location.hash = '';
      return;
    }
    if (window.Rum) return;
    minns();
    try { sessionStorage.setItem(TILL_TV, '1'); } catch { /* privat läge */ }
    location.href = './';
  }
  // Tv:n följer inte med längre (krysset): kameran släcks, och utanför rummet
  // stängs förbindelserna, som när man lämnar det. slocknar: med en tv:s sista
  // ljuspunkt.
  function sluta(slocknar) {
    if (!B.ute) return;
    B.ute = false;
    glom();
    B.ater = 0;
    if (B.stream) kameraAv();
    if (!B.on) {
      clearInterval(B.vemT);
      kopplaNer();
    }
    // Rutan går tillbaka till tv:n när den lilla har slocknat, och tv:n står på
    // väggen igen. Den står då på text-tv:n; visar sig någon ny byter den själv.
    miniBort(slocknar, () => {
      if (B.ute) return;
      B.visa = false;
      B.valj = null;
      B.fel = '';
      if (B.tv) B.tv.av(false);
      plats(true);
      if (B.on) ordna();
    });
  }
  // Följde tv:n med från sidan innan (inom tio minuter)? Då kopplar den upp sig
  // igen här – på förstasidan utan adress tar rummet den (on).
  function aterstall() {
    let f = null;
    let till = false;
    try {
      f = JSON.parse(sessionStorage.getItem(FOLJER) || 'null');
      till = sessionStorage.getItem(TILL_TV) === '1';
      sessionStorage.removeItem(TILL_TV);
    } catch { /* privat läge */ }
    if (!f || !(Date.now() - f.t < ATER)) {
      glom();
      return;
    }
    B.ute = true;
    B.visa = f.visa !== false;
    B.tillTv = till;
    if (f.kamera) B.ater = Date.now();
    const rummet = () => window.Rum && !location.hash.replace(/^#/, '') && Rum.fits();
    // (när sidans alla skript är lästa: rum.js står efter den här)
    const lasta = document.readyState === 'loading' ? new Promise((r) => addEventListener('DOMContentLoaded', r, { once: true })) : null;
    Promise.all([redo(), lasta]).then(([ok]) => {
      if (!B.ute || B.on || rummet()) return;
      // på förstasidan byggs tv:n utan rummet, så att text-tv:n följer med
      if (!B.tv && window.Rum && Rum.tvUtan) {
        const tv = Rum.tvUtan();
        if (tv) tvIn(tv);
      }
      if (!B.tv && (!ok || !kan())) {
        sluta(false);
        return;
      }
      plats();
      if (skaSynas()) miniFram('tands');
      koppla();
      if (B.ater && Date.now() - B.ater < ATER) kameraPa();
      vemKoll();
    });
  }

  // ---------- i rummet ----------

  function mount(el, o) {
    B.el = el;
    B.tv = o.tv;
    B.knapp = el.querySelector('.rum-bildknapp');
    B.tamed = el.querySelector('.rum-tamed');
    if (!B.tv || !B.tv.avEl) return;
    // (byggdes tv:n utan rummet sitter rutan kvar där den är: i den lilla tv:n)
    if (!B.ram) tvIn(B.tv);
    plats();
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
    if (B.tamed) {
      const tryck = (e) => {
        e.preventDefault();
        e.stopPropagation();
        taMed();
      };
      B.tamed.addEventListener('click', tryck);
      B.tamed.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') tryck(e); });
    }
    knapp();
    rita();
    if (aktiv()) koppla();
  }

  function on(v) {
    v = Boolean(v);
    if (v === B.on) return;
    B.on = v;
    const m = B.mini;
    const fore = m && oppen(m) ? m.getBoundingClientRect() : null;
    if (v) {
      // Följer tv:n med står den lilla kvar i sitt hörn också i rummet, och
      // bara armen står kvar på väggen (där namnet och foten står: när rummet är utlagt).
      if (B.ute) {
        plats();
        requestAnimationFrame(() => {
          if (!B.ute || !B.on) return;
          stall();
          glid(fore);
          miniLage();
        });
      }
      koppla();
      if (!B.stream && B.ater && Date.now() - B.ater < ATER) kameraPa();
      vemKoll();
      if (B.tillTv) {
        // (ett tryck på den lilla tv:n på den vanliga sidan: fram till tv:n när rummet står)
        B.tillTv = false;
        setTimeout(() => {
          if (!B.on) return;
          if (B.ute) hem();
          else if (window.Rum && Rum.tv) Rum.tv();
        }, 0);
      }
    } else if (B.ute) {
      // tv:n följer med ut ur rummet: allt fortsätter i den lilla tv:n, som glider
      // till sitt hörn på sidan
      minns();
      requestAnimationFrame(() => {
        if (!B.ute || B.on) return;
        stall();
        glid(fore);
        miniVard();
        ordna();
      });
    } else {
      if (B.stream) kameraAv(true);
      kopplaNer();
    }
  }
  // Har du blivit någon annan i rummet kopplar sidan upp sig som hen.
  function vemKoll() {
    clearInterval(B.vemT);
    if (!aktiv()) return;
    B.vemT = setInterval(() => {
      if (!aktiv() || document.hidden) return;
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
    if (!aktiv()) return;
    if (document.hidden) {
      if (B.stream) kameraAv(true);
      kopplaNer();
    } else {
      koppla();
      if (B.ater && Date.now() - B.ater < ATER) kameraPa();
    }
  });
  addEventListener('pagehide', () => {
    // (tv:n följer med till nästa sida, också kameran om den var tänd)
    if (B.ute) minns();
    if (B.stream) for (const t of B.stream.getTracks()) t.stop();
  });

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

  aterstall();

  return { mount, on, avVal, knapp, hem, pa: () => Boolean(B.stream), foljer: () => B.ute };
})();
