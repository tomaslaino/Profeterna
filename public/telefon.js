'use strict';

// ---------- samtalet: gänget ringer varandra i Matchfixarna ----------
//
// Ett samtal för hela gänget, med röst och – för den som vill – bild på tv:n i
// tobaksaffären (rum-bild.js). Det går i hela sajten: i rummet, på kupongen och
// i uppgörelsen, och följer med när man byter vy.
//
//  – Luren (i toppbaren och i rummets fot) tar fram brickan med de andra och
//    Ring gänget. Det ringer hos de andra i 45 sekunder: i sidan om den är öppen,
//    och som avisering i telefonen (web push, sw.js) om de har tillåtit det.
//  – Brickan överst i mitten är samtalet, var man än är: vem som ringer (Svara,
//    Inte nu), vilka som är med (porträttet lyser när hen pratar), tiden,
//    mikrofonen, kameran (Visa dig på tv:n) och Lägg på. Ett grått porträtt är
//    någon som inte är med: ett tryck ringer hen igen. Pågår ett samtal utan en
//    står Gå med där.
//  – Ringsignalerna är telefonens: klockan när det ringer, den svenska
//    ringsignalen (425 Hz, en sekund på och fem av) medan man väntar på svar och
//    upptagettonen när ingen svarade.
//  – Samtalet går ur bara när man lägger på (eller stänger sidan). En dold flik
//    håller rösten (i Android också med skärmen släckt), men kameran släcks och
//    tänds igen när man kommer tillbaka inom tio minuter. Tappar man
//    uppkopplingen en stund är man kvar i samtalet (tjänsten väntar 30 sekunder).
//
// Vem du är: den du har valt i rummet (Samtal.pult.du()), annars den enheten
// minns från kupongen eller tv:n, annars frågar brickan. Medan du är med i
// samtalet byter du inte person.
//
// Rösten och bilden går direkt mellan webbläsarna (WebRTC, en förbindelse
// mellan varje par som är med). Tjänsten profeterna-rummet
// (worker/samtalet.mjs, websocketen /samtal) håller samtalet, för vidare
// erbjudandena och vägarna mellan fönstren och skickar aviseringarna.
// Erbjudandena görs som i "perfect negotiation": krockar två lämnar den som har
// det högre fönster-id:t efter.
//
//   Telefon.lur(el)       en lur i el (rummets fot)
//   Telefon.lage()        läget för tv:n (rum-bild.js)
//   Telefon.pa(fn)        fn() när något ändras
//   Telefon.ring(), svara(), lagg(), kamera(on)
//   Telefon.strom(id)     bilden från ett annat fönster (MediaStream), egen()
//
// För prov: ?rum-samtal=ws://127.0.0.1:8787/samtal (en annan tjänst, t.ex.
// wrangler dev) och ?rum-samtal-vem=DT (vem du är här).

window.Telefon = (() => {
  const q = new URLSearchParams(location.search);
  const VEM_TV = 'profeterna.tv.vem';
  const VEM_SAMTAL = 'profeterna.samtal.vem';
  // telefonen som kan ringas upp: { vem, endpoint, t }
  const AVISERING = 'profeterna.telefon.avisering';
  // det missade samtal som har visats (senast.id)
  const MISSAT_SETT = 'profeterna.telefon.missat';
  // samtalet följer med till nästa sida på sajten ({ id, t, kam, tyst }, sessionStorage)
  const MED = 'profeterna.telefon.med';
  const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
  const MIK = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false };
  // 4:3 som tv:ns ruta; framkameran i telefonen
  const KAMERA = { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } }, audio: false };
  const ATER = 10 * 60 * 1000;
  // så länge en förbindelse får leta innan rutan säger att det inte går
  const LETA = 15000;
  const fonster = () => [...crypto.getRandomValues(new Uint8Array(12))].map((x) => (x % 36).toString(36)).join('');
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const T = {
    ws: null, uppe: false, timer: 0, ping: 0, retry: 0, vem: null, finns: null, provT: 0,
    id: fonster(), ice: null,
    alla: [], jag: null, samtal: null, senast: null, flyttat: false,
    vill: false, vantar: 0, startar: false, startad: 0,
    mic: null, kam: null, tyst: false, kamStartar: false, kamFel: '', kamAter: 0,
    peers: new Map(), lyss: new Set(),
    ac: null, signal: null, niva: new Map(), nivaT: 0, jagTalar: false,
    bricka: null, inne: null, lurar: [], oppen: '', liten: false,
    besked: '', beskedT: 0, lasT: 0, tidT: 0, medFor: null, efterVem: null, las: null, synlig: false,
    data: null, dataP: null, vidare: 0, aterTill: null,
  };

  // ---------- vem du är ----------

  const las = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const spara = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privat läge */ } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  // (KP i kupong.js är en global const, inte window.KP; på Tabeller, Statistik och Om oss finns
  // den inte, och där hämtas samma uppgifter ur data/kuponger.json: lasData)
  const samtalData = () => (typeof KP !== 'undefined' && KP.data && KP.data.samtal) || T.data || null;
  function lasData() {
    if (typeof KP !== 'undefined' || T.dataP) return;
    T.dataP = fetch('data/kuponger.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { T.data = (d && d.samtal) || null; }, () => {})
      .then(() => { T.dataP = null; if (!T.data) setTimeout(lasData, 60000); vemKoll(); });
  }
  const gang = () => (samtalData() && samtalData().gang) || [];
  const iGang = (v) => gang().some((g) => g.id === v);
  const person = (v) => gang().find((g) => g.id === v) || { id: v, namn: v };
  const kallas = (v) => (window.Tippoang && Tippoang.kallas ? Tippoang.kallas(person(v)) : v);
  const nr = (v) => Math.max(0, gang().findIndex((g) => g.id === v));
  const ord = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} och ${xs[xs.length - 1]}` : xs[0] || '');
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function jag() {
    if (T.vill && T.vem) return T.vem;
    const prov = q.get('rum-samtal-vem');
    if (prov && iGang(prov)) return prov;
    const du = window.Samtal && Samtal.pult && Samtal.pult.du ? Samtal.pult.du() : null;
    return [du, las(VEM_SAMTAL), las(VEM_TV)].find(iGang) || null;
  }
  function adress() {
    const u = q.get('rum-samtal') || (samtalData() && samtalData().rummet ? String(samtalData().rummet).replace(/\/rum$/, '/samtal') : '');
    return /^wss?:\/\/.+\/samtal$/.test(u) ? u : null;
  }
  const httpBas = () => adress().replace(/^ws/, 'http').replace(/\/samtal$/, '');
  const kan = () => Boolean(adress() && 'WebSocket' in window && 'RTCPeerConnection' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const iSamtalet = () => Boolean(T.jag && T.jag.i);
  const ringerHosMig = () => Boolean(T.samtal && T.vem && T.samtal.ringer.includes(T.vem) && !T.vill);

  // ---------- tjänsten ----------

  // Finns tjänsten? (Sajten publiceras av sig själv, tjänsten för hand: tills den
  // har samtalet syns ingen lur.) Frågas en gång, och igen efter en minut om den
  // inte gick att nå.
  function prova() {
    if (T.finns || !kan() || Date.now() - T.provT < 60000) return;
    T.provT = Date.now();
    fetch(`${httpBas()}/samtal/nyckel`).then((r) => r.json()).then((d) => {
      T.finns = Boolean(d && d.nyckel);
      if (T.finns) koppla();
      rita();
    }).catch(() => { T.finns = false; });
  }

  function koppla() {
    if (T.ws || !kan() || !T.finns || (document.hidden && !T.vill)) return;
    const v = jag();
    if (!v) return;
    let ws;
    try { ws = new WebSocket(`${adress()}?vem=${encodeURIComponent(v)}&id=${T.id}`); } catch { return; }
    T.ws = ws;
    T.vem = v;
    ws.onopen = () => {
      T.retry = 0;
      T.uppe = true;
      T.finns = true;
      if (T.vill) skickaLage(true);
      clearInterval(T.ping);
      T.ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 30000);
    };
    ws.onmessage = (e) => {
      if (e.data === 'pong' || T.ws !== ws) return;
      let d;
      try { d = JSON.parse(e.data); } catch { return; }
      if (!d || typeof d !== 'object') return;
      if (Array.isArray(d.ice)) T.ice = d.ice;
      if (d.flyttat) T.flyttat = true;
      if (Array.isArray(d.alla)) lage(d);
      if (d.fran && d.sig) signal(d);
    };
    ws.onclose = () => {
      clearInterval(T.ping);
      if (T.ws !== ws) return;
      T.ws = null;
      T.uppe = false;
      // (förbindelserna till de andra lever vidare: de går inte genom tjänsten)
      if (!T.vill) {
        T.alla = [];
        T.samtal = null;
      }
      rita();
      if (T.vill || !document.hidden) {
        clearTimeout(T.timer);
        T.timer = setTimeout(() => { T.timer = 0; koppla(); }, Math.min(30000, 1000 * 2 ** T.retry++));
      }
    };
  }
  function kopplaNer() {
    clearTimeout(T.timer);
    T.timer = 0;
    clearInterval(T.ping);
    const ws = T.ws;
    T.ws = null;
    T.uppe = false;
    if (ws) try { ws.close(1000); } catch { /* inget */ }
    T.alla = [];
    T.samtal = null;
    rita();
  }
  const skicka = (d) => { if (T.ws && T.ws.readyState === 1) T.ws.send(JSON.stringify(d)); };
  function skickaLage() {
    skicka({ lage: { kamera: Boolean(T.kam), tyst: T.tyst } });
  }

  // Tjänstens läge: vilka fönster som finns och samtalet. Är du med enligt
  // tjänsten utan att vilja det lägger du på; vill du vara med utan att vara det
  // är samtalet slut för dig (eller har flyttat till din andra enhet).
  function lage(d) {
    const forra = T.samtal;
    T.alla = d.alla.filter((p) => p && p.id !== T.id && iGang(p.vem));
    T.jag = d.alla.find((p) => p && p.id === T.id) || null;
    T.samtal = d.samtal || null;
    T.senast = d.senast || null;
    const i = iSamtalet();
    if (i) T.vantar = 0;
    // (tiden går från att någon annan är med: inte medan det ringer)
    if (i && T.vill && !T.startad && T.samtal && T.samtal.med.some((v) => v !== T.vem)) T.startad = Date.now();
    if (i && !T.vill) skicka({ lagg: true });
    else if (T.vill && !i && !(T.vantar && Date.now() - T.vantar < 8000)) avsluta(orsak(forra));
    if (T.vill && i) skickaLage();
    missat();
    ordna();
    ljuden();
    stangAviseringar();
    rita();
  }

  // Varför samtalet tog slut för dig (forra: samtalet som det var).
  function orsak(forra) {
    if (T.flyttat) {
      T.flyttat = false;
      return 'Samtalet fortsätter på en annan enhet';
    }
    if (T.samtal) return 'Samtalet bröts';
    const s = T.senast && forra && T.senast.id === forra.id ? T.senast : null;
    if (!s) return 'Samtalet är slut';
    const andra = (s.varit || []).filter((v) => v !== T.vem);
    if (!andra.length) {
      const inte = (s.inte || []).filter((v) => v !== T.vem);
      return inte.length && !(s.missat || []).filter((v) => v !== T.vem).length ? `${ord(inte.map(kallas))} kan inte nu` : 'Ingen svarade';
    }
    return T.startad ? `Samtalet är slut · ${tid(Date.now() - T.startad)}` : 'Samtalet är slut';
  }
  const tid = (ms) => {
    const s = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  };

  // Ett missat samtal som sidan inte har visat: ett besked, en gång.
  function missat() {
    const s = T.senast;
    if (!s || !T.vem || T.vill || !(s.missat || []).includes(T.vem) || Date.now() - s.slut > 12 * 3600e3) return;
    if (las(MISSAT_SETT) === s.id) return;
    spara(MISSAT_SETT, s.id);
    besked(`Missat samtal från ${kallas(s.av)}`);
  }

  // ---------- att ringa, svara och lägga på ----------

  async function mikrofon() {
    if (T.mic) return true;
    try {
      T.mic = await navigator.mediaDevices.getUserMedia(MIK);
      const t = T.mic.getAudioTracks()[0];
      if (t) {
        t.enabled = !T.tyst;
        t.onended = () => { if (T.vill) lagg('Mikrofonen slutade fungera'); };
      }
      analys('jag', t);
      return true;
    } catch (e) {
      const n = e && e.name;
      besked(n === 'NotAllowedError' || n === 'SecurityError' ? 'Mikrofonen fick inte startas. Tillåt den för sajten och försök igen.'
        : n === 'NotFoundError' ? 'Hittar ingen mikrofon.'
          : n === 'NotReadableError' ? 'Mikrofonen används av något annat just nu.' : 'Mikrofonen gick inte att starta.');
      return false;
    }
  }

  // Ring gänget, svara, gå med: mikrofonen först, sedan säger sidan till tjänsten.
  async function medI(vad, auto = false) {
    if (T.vill || T.startar) return;
    if (!jag()) {
      T.oppen = 'vem';
      T.efterVem = vad;
      rita();
      return;
    }
    ljudKalla();
    // (frågan om aviseringar bara efter ett tryck, inte när sidan går med av sig själv)
    aviseringar(!auto);
    T.startar = true;
    T.oppen = '';
    rita();
    const ok = await mikrofon();
    T.startar = false;
    if (!ok) {
      rita();
      return;
    }
    T.vem = jag();
    T.vill = true;
    T.vantar = Date.now();
    T.startad = 0;
    T.tyst = false;
    T.flyttat = false;
    vakna(true);
    if (!T.ws) koppla();
    const skickaNar = () => {
      if (!T.vill) return;
      if (T.ws && T.ws.readyState === 1) skicka(vad === 'ring' ? { ring: true } : { svara: true });
      else setTimeout(skickaNar, 300);
    };
    skickaNar();
    // (svarar inte tjänsten, eller tog samtalet slut under tiden)
    setTimeout(() => { if (T.vill && T.vantar && !iSamtalet()) avsluta(T.samtal ? 'Samtalet bröts' : 'Samtalet är slut'); }, 8500);
    ljuden();
    rita();
  }
  const ring = () => medI('ring');
  const svara = () => medI('svara');
  function inte() {
    skicka({ inte: true });
    spela(null);
    stangAviseringar(true);
  }
  function lagg(text) {
    if (!T.vill) return;
    skicka({ lagg: true });
    avsluta(typeof text === 'string' ? text : '');
  }
  // Samtalet är slut för dig: mikrofonen och kameran av, förbindelserna stängs.
  function avsluta(text) {
    const varMed = T.vill;
    T.vill = false;
    T.vantar = 0;
    T.startad = 0;
    for (const id of [...T.peers.keys()]) stang(id);
    for (const s of [T.mic, T.kam]) if (s) for (const t of s.getTracks()) t.stop();
    T.mic = null;
    T.kam = null;
    T.kamAter = 0;
    T.kamFel = '';
    T.tyst = false;
    T.niva.clear();
    T.jagTalar = false;
    vakna(false);
    spela(varMed && text && text !== 'Samtalet fortsätter på en annan enhet' ? 'slut' : null);
    if (text) besked(text);
    if (document.hidden) kopplaNer();
    rita();
  }
  function ringIgen(v) {
    if (T.vill && iGang(v)) skicka({ ring: v });
  }
  function tysta() {
    if (!T.vill) return;
    T.tyst = !T.tyst;
    const t = T.mic && T.mic.getAudioTracks()[0];
    if (t) t.enabled = !T.tyst;
    skickaLage();
    rita();
  }

  // ---------- kameran ----------

  async function kamera(on) {
    if (!on) {
      kameraAv();
      return;
    }
    if (T.kam || T.kamStartar || !T.vill) return;
    T.kamStartar = true;
    T.kamFel = '';
    rita();
    try {
      const s = await navigator.mediaDevices.getUserMedia(KAMERA);
      if (!T.vill || document.hidden) {
        for (const t of s.getTracks()) t.stop();
        if (T.vill) T.kamAter = Date.now();
        return;
      }
      T.kam = s;
      T.kamAter = 0;
      // (tar en annan app kameran slutar bilden: då är den släckt)
      for (const t of s.getTracks()) t.onended = () => { if (T.kam === s) kameraAv(); };
      for (const x of T.peers.values()) sand(x);
    } catch (e) {
      const n = e && e.name;
      T.kamFel = n === 'NotAllowedError' || n === 'SecurityError' ? 'Kameran fick inte startas. Tillåt den för sajten i webbläsaren och försök igen.'
        : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'Hittar ingen kamera.'
          : n === 'NotReadableError' ? 'Kameran används av något annat just nu.' : 'Kameran gick inte att starta.';
    } finally {
      T.kamStartar = false;
      skickaLage();
      rita();
    }
  }
  // ater: släckt för att fliken dolts – tänds igen om man kommer tillbaka inom ATER.
  function kameraAv(ater = false) {
    const s = T.kam;
    if (!s) return;
    T.kam = null;
    for (const t of s.getTracks()) t.stop();
    for (const x of T.peers.values()) utanBild(x);
    T.kamAter = ater ? Date.now() : 0;
    skickaLage();
    rita();
  }

  // ---------- förbindelserna ----------

  // En förbindelse till ett annat fönster i samtalet: din röst dit, och din bild om
  // kameran är tänd.
  function peer(p) {
    const pc = new RTCPeerConnection({ iceServers: T.ice || STUN });
    const x = { id: p.id, vem: p.vem, pc, polite: T.id > p.id, making: false, ignore: false, ko: Promise.resolve(), ljud: null, video: null, strom: null, bild: false, sedan: Date.now() };
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
        if (!e || e.name !== 'InvalidStateError') console.warn('Samtalet: erbjudandet', e);
      } finally {
        x.making = false;
      }
    };
    pc.onicecandidate = (e) => skicka({ till: x.id, sig: { ice: e.candidate ? e.candidate.toJSON() : null } });
    pc.ontrack = (e) => {
      const t = e.track;
      if (t.kind === 'audio') {
        if (!x.ljud) {
          x.ljud = document.createElement('audio');
          x.ljud.autoplay = true;
          ljudlada().append(x.ljud);
        }
        x.ljud.srcObject = new MediaStream([t]);
        x.ljud.play().catch(() => {});
        analys(x.id, t);
        return;
      }
      if (t.kind !== 'video') return;
      x.strom = new MediaStream([t]);
      x.bild = !t.muted;
      t.onmute = () => { x.bild = false; rita(); };
      t.onunmute = () => { x.bild = true; rita(); };
      rita();
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') x.sedan = 0;
      else if (!x.sedan) x.sedan = Date.now();
      // tappar den kontakten letar den nya vägar
      if (s === 'failed' && pc.restartIce) pc.restartIce();
      rita();
    };
    T.peers.set(p.id, x);
    const m = T.mic && T.mic.getAudioTracks()[0];
    if (m) pc.addTrack(m, T.mic);
    if (T.kam) sand(x);
    return x;
  }
  // Din kamera till en förbindelse: på samma sändare igen om det finns en.
  // (addTrack och inte addTransceiver: krockar två erbjudanden tas sändaren
  // med i det andras, så att det blir en enda bild åt vardera hållet.)
  function sand(x) {
    const t = T.kam && T.kam.getVideoTracks()[0];
    if (!t || x.pc.signalingState === 'closed') return;
    const tr = x.pc.getTransceivers().find((r) => !r.stopped && r.receiver.track && r.receiver.track.kind === 'video');
    if (!tr) {
      x.pc.addTrack(t, T.kam);
      return;
    }
    tr.sender.replaceTrack(t).catch(() => {});
    if (tr.sender.setStreams) tr.sender.setStreams(T.kam);
    if (tr.direction !== 'sendrecv') tr.direction = 'sendrecv';
  }
  // Kameran släckt: bildens sändare tystnar, rösten går som förut.
  function utanBild(x) {
    if (x.pc.signalingState === 'closed') return;
    for (const tr of x.pc.getTransceivers()) {
      if (tr.stopped || !tr.receiver.track || tr.receiver.track.kind !== 'video' || !tr.sender.track) continue;
      tr.sender.replaceTrack(null).catch(() => {});
      tr.direction = 'recvonly';
    }
  }
  function stang(id) {
    const x = T.peers.get(id);
    if (!x) return;
    T.peers.delete(id);
    try { x.pc.close(); } catch { /* stängd */ }
    if (x.ljud) {
      x.ljud.srcObject = null;
      x.ljud.remove();
    }
    T.niva.delete(id);
  }
  // Det andra fönstret säger något: i tur och ordning per förbindelse.
  function signal(d) {
    if (!T.vill) return;
    let x = T.peers.get(d.fran);
    if (!x) {
      const p = T.alla.find((a) => a.id === d.fran);
      if (!d.sig.sdp || d.sig.sdp.type !== 'offer' || !p || !p.i) return;
      x = peer(p);
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
        console.warn('Samtalet:', e);
      }
    });
  }
  // En förbindelse till varje annat fönster i samtalet, när du själv är med.
  function ordna() {
    const med = T.vill && iSamtalet();
    for (const p of T.alla) {
      const ska = med && p.i;
      const x = T.peers.get(p.id);
      if (ska && !x) peer(p);
      else if (!ska && x) stang(p.id);
      else if (x) x.vem = p.vem;
    }
    // (utan tjänsten står förbindelserna kvar tills den är tillbaka)
    if (T.uppe || !T.vill) for (const id of [...T.peers.keys()]) if (!T.alla.some((p) => p.id === id && p.i) || !med) stang(id);
  }

  // ---------- ljudet ----------

  function ljudlada() {
    let l = document.getElementById('tel-ljud');
    if (!l) {
      l = document.createElement('div');
      l.id = 'tel-ljud';
      l.hidden = true;
      document.body.append(l);
    }
    return l;
  }
  function ljudKalla() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!T.ac) {
      try { T.ac = new AC(); } catch { return null; }
    }
    if (T.ac.state === 'suspended') T.ac.resume().catch(() => {});
    return T.ac;
  }

  // Vem som pratar: ljudnivån i rösten (nyckel: fönstrets id, eller 'jag').
  function analys(nyckel, track) {
    const ac = ljudKalla();
    if (!ac || !track) return;
    try {
      const src = ac.createMediaStreamSource(new MediaStream([track]));
      const an = ac.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      T.niva.set(nyckel, { an, buf: new Float32Array(an.fftSize), talar: false, src });
    } catch { /* utan nivåer */ }
    if (!T.nivaT) T.nivaT = setInterval(nivaer, 140);
  }
  function nivaer() {
    if (!T.vill) {
      clearInterval(T.nivaT);
      T.nivaT = 0;
      return;
    }
    let andrat = false;
    for (const [k, n] of T.niva) {
      n.an.getFloatTimeDomainData(n.buf);
      let sum = 0;
      for (let i = 0; i < n.buf.length; i++) sum += n.buf[i] * n.buf[i];
      const rms = Math.sqrt(sum / n.buf.length);
      const talar = n.talar ? rms > 0.008 : rms > 0.015;
      const m = k === 'jag' && T.tyst ? false : talar;
      if (m !== n.talar) {
        n.talar = m;
        andrat = true;
      }
    }
    if (andrat) ritaTal();
  }
  const talar = (id) => Boolean(T.niva.get(id) && T.niva.get(id).talar);

  // Telefonens ljud, ritat med Web Audio: klockan, ringsignalen och upptaget.
  function spela(slag) {
    const s = T.signal;
    if (s && s.slag === slag) return;
    if (s) {
      clearTimeout(s.timer);
      try { s.ut.gain.setTargetAtTime(0, T.ac.currentTime, 0.02); } catch { /* inget */ }
      setTimeout(() => { try { s.ut.disconnect(); } catch { /* inget */ } }, 300);
      T.signal = null;
    }
    if (!slag) return;
    const ac = ljudKalla();
    if (!ac) return;
    const ut = ac.createGain();
    ut.connect(ac.destination);
    const sig = { slag, ut, timer: 0 };
    T.signal = sig;
    const ton = (f, t0, len, vol) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      g.gain.setValueAtTime(vol, t0 + len - 0.02);
      g.gain.linearRampToValueAtTime(0, t0 + len);
      o.connect(g).connect(ut);
      o.start(t0);
      o.stop(t0 + len + 0.05);
    };
    // klockan: två klangskålar som slås an 25 gånger i sekunden i 1,2 s, var fjärde sekund
    const klocka = (t0) => {
      for (const [f, v] of [[1180, 0.07], [1770, 0.045], [2420, 0.02]]) {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t0);
        for (let t = 0; t < 1.2; t += 0.04) {
          g.gain.setValueAtTime(0.0001, t0 + t);
          g.gain.linearRampToValueAtTime(v, t0 + t + 0.003);
          g.gain.exponentialRampToValueAtTime(v * 0.15, t0 + t + 0.038);
        }
        g.gain.setValueAtTime(0, t0 + 1.24);
        o.connect(g).connect(ut);
        o.start(t0);
        o.stop(t0 + 1.3);
      }
    };
    const varv = () => {
      if (T.signal !== sig) return;
      const t0 = ac.currentTime + 0.05;
      if (slag === 'in') {
        klocka(t0);
        if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate([600, 200, 400]);
        sig.timer = setTimeout(varv, 4000);
      } else if (slag === 'ut') {
        ton(425, t0, 1, 0.06);
        sig.timer = setTimeout(varv, 6000);
      } else if (slag === 'slut') {
        for (let i = 0; i < 3; i++) ton(425, t0 + i * 0.5, 0.25, 0.06);
        sig.timer = setTimeout(() => { if (T.signal === sig) spela(null); }, 1700);
      } else if (slag === 'kom' || slag === 'gick') {
        const [a, b] = slag === 'kom' ? [660, 880] : [880, 660];
        ton(a, t0, 0.09, 0.035);
        ton(b, t0 + 0.11, 0.12, 0.035);
        sig.timer = setTimeout(() => { if (T.signal === sig) spela(null); }, 400);
      }
    };
    varv();
  }
  // Vilket ljud som ska höras just nu: klockan när det ringer hos dig,
  // ringsignalen medan du väntar på svar, och ett kort pling när någon kommer
  // eller går.
  function ljuden() {
    const s = T.samtal;
    const andraMed = s ? s.med.filter((v) => v !== T.vem) : [];
    if (T.vill && iSamtalet()) {
      const key = andraMed.slice().sort().join();
      if (T.medFor !== null && T.medFor !== key) {
        const kom = andraMed.length > (T.medFor ? T.medFor.split(',').length : 0);
        if (!T.signal || T.signal.slag === 'ut') spela(kom ? 'kom' : 'gick');
      }
      T.medFor = key;
    } else T.medFor = null;
    if (ringerHosMig() && !document.hidden) spela('in');
    else if (T.vill && iSamtalet() && !andraMed.length && s && s.ringer.length) {
      if (!T.signal || T.signal.slag !== 'kom') spela('ut');
    } else if (T.signal && (T.signal.slag === 'in' || T.signal.slag === 'ut')) spela(null);
  }

  // ---------- aviseringarna ----------

  // Telefonen kan ringas upp också när sidan inte är öppen: tillåter man
  // aviseringar (frågas när man ringer, svarar eller går med första gången)
  // prenumererar sidan på dem hos tjänsten, och service workern (sw.js) visar
  // Tejder ringer, med Svara och Inte nu. Fråga = inifrån ett tryck: då får
  // webbläsaren fråga om lov.
  async function aviseringar(fraga) {
    try {
      if (!kan() || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !window.isSecureContext) return;
      const vem = jag();
      if (!vem) return;
      let lov = Notification.permission;
      if (lov === 'default' && fraga) lov = await Notification.requestPermission();
      if (lov !== 'granted') return;
      const reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      // (det service workern behöver för att säga vem som ringer: tjänstens adress, namnen och porträtten)
      const t = { bas: httpBas(), namn: {}, bild: {} };
      for (const g of gang()) {
        t.namn[g.id] = kallas(g.id);
        t.bild[g.id] = g.bild ? new URL(g.bild, location.href).href : null;
      }
      await (await caches.open('telefon')).put(new URL('telefon.json', reg.scope).href, new Response(JSON.stringify(t), { headers: { 'Content-Type': 'application/json' } }));
      const sparad = las(AVISERING);
      if (!fraga && sparad && sparad.vem === vem && Date.now() - sparad.t < 7 * 864e5) return;
      const r = await fetch(`${httpBas()}/samtal/nyckel`);
      const { nyckel } = await r.json();
      const nyckelU8 = Uint8Array.from(atob(nyckel.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
      let sub = await reg.pushManager.getSubscription();
      // (en prenumeration med en annan nyckel byts ut)
      if (sub && sub.options && sub.options.applicationServerKey) {
        const k = new Uint8Array(sub.options.applicationServerKey);
        if (k.length !== nyckelU8.length || k.some((b, i) => b !== nyckelU8[i])) {
          await sub.unsubscribe();
          sub = null;
        }
      }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: nyckelU8 });
      const svar = await fetch(`${httpBas()}/samtal/push`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vem, sub: sub.toJSON() }) });
      if (svar.ok) spara(AVISERING, { vem, endpoint: sub.endpoint, t: Date.now() });
    } catch (e) {
      console.warn('Samtalet: aviseringarna', e);
    }
  }
  // Aviseringen om samtalet har spelat ut sin roll när sidan visar samtalet.
  function stangAviseringar(ocksaRing) {
    if (document.hidden || !('serviceWorker' in navigator) || (ringerHosMig() && !ocksaRing)) return;
    navigator.serviceWorker.getRegistration().then((r) => (r ? r.getNotifications({ tag: 'samtal' }) : [])).then((ns) => {
      for (const n of ns) n.close();
    }).catch(() => {});
  }
  // Från aviseringen (?samtal=svara, ?samtal=ring eller ett meddelande från sw.js).
  let fran = q.get('samtal');
  if (fran) {
    const u = new URL(location.href);
    u.searchParams.delete('samtal');
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  }
  function franAvisering() {
    if (!T.uppe) return;
    // samtalet följde med från sidan innan: med igen, med kameran och mikrofonen som de var
    const a = T.aterTill;
    if (a && T.samtal && !T.vill) {
      T.aterTill = null;
      if (T.samtal.id === a.id) {
        T.tystAter = Boolean(a.tyst);
        medI('svara', true).then(() => {
          if (!T.vill) return;
          if (a.startad) T.startad = a.startad;
          if (T.tystAter) tysta();
          if (a.kam) kamera(true);
        });
      }
    } else if (a && T.jag && !T.samtal) T.aterTill = null;
    if (!fran) return;
    const f = fran;
    fran = null;
    if (f === 'svara' && T.samtal) svara();
    else if (f === 'ring') ring();
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.samtal === 'svara' || d.samtal === 'ring') {
        fran = d.samtal;
        koppla();
        franAvisering();
      }
    });
  }

  // Skärmen hålls tänd under samtalet i iPhone, där Safari annars stannar sidan
  // (och samtalet) när skärmen släcks.
  async function vakna(on) {
    if (!IOS || !('wakeLock' in navigator)) return;
    if (!on) {
      if (T.las) T.las.release().catch(() => {});
      T.las = null;
      return;
    }
    if (T.las || document.hidden) return;
    try {
      T.las = await navigator.wakeLock.request('screen');
      T.las.addEventListener('release', () => { T.las = null; });
    } catch { /* inget */ }
  }

  // ---------- brickan ----------

  const IKON = {
    lur: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.12.37 2.33.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>',
    lagg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.96.96 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.3 11.3 0 0 0-2.67-1.85 1 1 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',
    mik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>',
    mikAv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',
    kam: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
    kamAv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2 2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>',
  };
  const portratt = (v) => {
    const g = person(v);
    return g.bild ? `<img src="${esc(g.bild)}" alt="" draggable="false" decoding="async">` : `<span>${esc(v)}</span>`;
  };
  // Ett porträtt i brickan: klass = med, ringer, inne (har sidan öppen) eller av.
  const ansikte = (v, klass, knapp) => {
    const t = esc(kallas(v));
    const inner = `${portratt(v)}<b class="tb-tyst" aria-hidden="true">${IKON.mikAv}</b>`;
    return knapp
      ? `<button type="button" class="tb-p k${nr(v)} ${klass}" data-ring="${esc(v)}" aria-label="Ring ${t}" title="Ring ${t}">${inner}</button>`
      : `<i class="tb-p k${nr(v)} ${klass}" data-vem="${esc(v)}" title="${t}">${inner}</i>`;
  };
  const knapp = (cls, ikon, text, extra = '') => `<button type="button" class="tb-knapp ${cls}" ${extra}>${ikon || ''}<span>${esc(text)}</span></button>`;
  const rund = (cls, ikon, text, extra = '') => `<button type="button" class="tb-rund ${cls}" aria-label="${esc(text)}" title="${esc(text)}" ${extra}>${ikon}</button>`;

  // Vad brickan visar, i tur och ordning: att välja vem man är, samtalet man är
  // med i, det som ringer, att ringa (efter luren), ett besked och ett samtal som
  // pågår utan en.
  function vy() {
    const s = T.samtal;
    if (T.oppen === 'vem') return 'vem';
    if (T.startar) return 'startar';
    if (T.vill) return iSamtalet() && s && s.med.some((v) => v !== T.vem) ? 'samtal' : 'ringer';
    if (ringerHosMig()) return 'in';
    if (T.oppen === 'start') return s ? 'pagar' : 'start';
    if (T.besked) return 'besked';
    if (s && T.vem && s.med.length && !s.med.includes(T.vem)) return 'pagar';
    return '';
  }

  function html(v) {
    const s = T.samtal;
    const andra = gang().map((g) => g.id).filter((x) => x !== T.vem);
    const inne = (x) => T.alla.some((p) => p.vem === x);
    if (v === 'vem') {
      return `<b class="tb-txt">Vem är du?</b><span class="tb-folk tb-valj">${gang().map((g) => `<button type="button" class="tb-p k${nr(g.id)}" data-vem-val="${esc(g.id)}" title="${esc(kallas(g.id))}">${portratt(g.id)}</button>`).join('')}</span>${rund('tb-stang', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', 'Stäng')}`;
    }
    if (v === 'startar') return `<span class="tb-txt"><b>Mikrofonen startar …</b></span>`;
    if (v === 'in') {
      const med = s.med.filter((x) => x !== s.av);
      return `<span class="tb-folk">${ansikte(s.av, 'med skakar')}</span><span class="tb-txt"><b>${esc(kallas(s.av))} ringer</b>${med.length ? `<small>${esc(ord(med.map(kallas)))} är med</small>` : ''}</span>` +
        knapp('tb-inte', '', 'Inte nu', 'data-tel="inte"') + knapp('tb-gron', IKON.lur, 'Svara', 'data-tel="svara"');
    }
    if (v === 'ringer') {
      // du har ringt och väntar (de som sa Inte nu är gråa), eller du har svarat och kopplas in
      const folk = !iSamtalet() && s ? s.med.filter((x) => x !== T.vem).map((x) => ansikte(x, 'med'))
        : andra.map((x) => ansikte(x, !s || s.ringer.includes(x) ? 'ringer' : 'av'));
      return `<span class="tb-folk">${folk.join('')}</span><span class="tb-txt"><b>${iSamtalet() ? 'Ringer …' : 'Kopplar …'}</b></span>` +
        rund('tb-rod', IKON.lagg, 'Lägg på', 'data-tel="lagg"');
    }
    if (v === 'samtal') {
      const folk = andra.map((x) => (s.med.includes(x) ? ansikte(x, `med${s.borta.includes(x) ? ' borta' : ''}`) : s.ringer.includes(x) ? ansikte(x, 'ringer') : ansikte(x, 'av', true))).join('');
      return `<div class="tb-bilder" hidden></div><div class="tb-rad"><span class="tb-folk">${folk}</span><span class="tb-tid" aria-label="Tiden">0:00</span>` +
        rund(`tb-mik${T.tyst ? ' av' : ''}`, T.tyst ? IKON.mikAv : IKON.mik, T.tyst ? 'Sätt på mikrofonen' : 'Stäng av mikrofonen', 'data-tel="tyst"') +
        rund(`tb-kam${T.kam ? ' pa' : ''}`, T.kam ? IKON.kam : IKON.kamAv, T.kam ? 'Stäng av kameran' : 'Visa dig på tv:n', 'data-tel="kamera"') +
        rund('tb-rod', IKON.lagg, 'Lägg på', 'data-tel="lagg"') + '</div>';
    }
    if (v === 'besked') return `<span class="tb-txt"><b>${esc(T.besked)}</b></span>`;
    if (v === 'start') {
      return `<span class="tb-folk">${andra.map((x) => ansikte(x, inne(x) ? 'inne' : '')).join('')}</span>` +
        knapp('tb-gron', IKON.lur, 'Ring gänget', 'data-tel="ring"') + rund('tb-stang', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', 'Stäng');
    }
    if (v === 'pagar') {
      return `<span class="tb-folk">${s.med.map((x) => ansikte(x, 'med')).join('')}</span><span class="tb-txt"><b>Samtal pågår</b></span>` +
        knapp('tb-gron', IKON.lur, 'Gå med', 'data-tel="svara"') + (T.oppen ? rund('tb-stang', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', 'Stäng') : '');
    }
    return '';
  }

  function bygg() {
    if (T.bricka) return;
    const b = document.createElement('div');
    b.id = 'tel-bricka';
    b.className = 'tel-bricka';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Samtalet');
    if ('popover' in HTMLElement.prototype) b.popover = 'manual';
    b.hidden = !('popover' in HTMLElement.prototype);
    b.innerHTML = '<div class="tb-inne" aria-live="polite"></div>';
    document.body.append(b);
    T.bricka = b;
    T.inne = b.querySelector('.tb-inne');
    b.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t) {
        if (e.target.closest('.tb-bilder')) {
          T.liten = !T.liten;
          ritaBilder();
        }
        return;
      }
      e.stopPropagation();
      if (t.dataset.vemVal) {
        spara(VEM_TV, t.dataset.vemVal);
        const efter = T.efterVem;
        T.efterVem = null;
        T.oppen = efter ? '' : 'start';
        koppla();
        if (efter) medI(efter);
        else rita();
        aviseringar(false);
        return;
      }
      if (t.dataset.ring) {
        ringIgen(t.dataset.ring);
        return;
      }
      if (t.classList.contains('tb-stang')) {
        T.oppen = '';
        rita();
        return;
      }
      const g = t.dataset.tel;
      if (g === 'ring') ring();
      else if (g === 'svara') svara();
      else if (g === 'inte') inte();
      else if (g === 'lagg') lagg();
      else if (g === 'tyst') tysta();
      else if (g === 'kamera') kamera(!T.kam);
    });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && T.oppen) {
        T.oppen = '';
        rita();
      }
    });
    addEventListener('scroll', placera, { passive: true });
    addEventListener('resize', placera, { passive: true });
  }

  // Överst i mitten: under toppbaren på sajten, och under namnet och foten i rummet.
  function placera() {
    const b = T.bricka;
    if (!b || !T.synlig) return;
    let top = 12;
    if (document.documentElement.classList.contains('i-rummet')) {
      const ft = document.querySelector('.rum.smal .rum-ft');
      if (ft) top = Math.max(12, ft.getBoundingClientRect().bottom + 10);
    } else {
      const tb = document.querySelector('.topbar');
      if (tb) top = Math.max(10, tb.getBoundingClientRect().bottom + 8);
    }
    b.style.top = `${Math.round(top)}px`;
  }

  function rita() {
    bygg();
    const v = vy();
    const b = T.bricka;
    const h = v ? html(v) : '';
    if (b.dataset.vy !== v || b.dataset.h !== h) {
      b.dataset.vy = v;
      b.dataset.h = h;
      b.className = `tel-bricka vy-${v || 'ingen'}${calm() ? ' lugn' : ''}`;
      T.inne.innerHTML = h;
    }
    const syns = Boolean(v);
    if (syns !== Boolean(T.synlig)) {
      T.synlig = syns;
      if (b.popover) {
        try { if (syns) b.showPopover(); else b.hidePopover(); } catch { /* redan */ }
      } else b.hidden = !syns;
    }
    placera();
    if (v === 'samtal') {
      ritaTal();
      ritaBilder();
      tick();
    } else {
      clearTimeout(T.tidT);
      T.tidT = 0;
    }
    lurar();
    for (const fn of T.lyss) try { fn(); } catch (e) { console.warn(e); }
  }
  // Porträtten som pratar, och de som har mikrofonen av.
  function ritaTal() {
    if (!T.inne) return;
    for (const el of T.inne.querySelectorAll('.tb-p[data-vem]')) {
      const v = el.dataset.vem;
      const fon = T.alla.filter((p) => p.vem === v && p.i);
      const tal = fon.some((p) => talar(p.id));
      el.classList.toggle('talar', tal);
      el.classList.toggle('tyst', fon.some((p) => p.tyst));
    }
    const m = T.inne.querySelector('.tb-mik');
    if (m) m.classList.toggle('talar', talar('jag'));
  }
  function tick() {
    const el = T.inne && T.inne.querySelector('.tb-tid');
    if (el && T.startad) el.textContent = tid(Date.now() - T.startad);
    clearTimeout(T.tidT);
    T.tidT = setTimeout(tick, 1000 - (Date.now() % 1000) + 20);
  }
  // Syns bilden redan på en tv: i rummet, där tv:n syns så stor att man ser vem som är i
  // bild, eller i den lilla tv:n som följer med (rum-bild.js)?
  const tvSyns = () => Boolean(window.RumBild && RumBild.syns && RumBild.syns());
  // Bilderna i brickan, när någon visar sig och ingen tv visar dem: på sajten, och i
  // rummet i telefonen tills man tar fram tv:n.
  function ritaBilder() {
    const box = T.inne && T.inne.querySelector('.tb-bilder');
    if (!box) return;
    const tv = tvSyns();
    const visar = tv ? [] : [...T.peers.values()].filter((x) => x.strom && T.alla.some((p) => p.id === x.id && p.kamera));
    const egen = !tv && T.kam;
    // (rummet flyttar sig utan att något i samtalet ändras: titta igen om en stund)
    clearTimeout(T.bilderT);
    if (window.RumBild && (T.kam || T.alla.some((p) => p.i && p.kamera))) T.bilderT = setTimeout(ritaBilder, 700);
    box.hidden = !visar.length && !egen;
    box.classList.toggle('liten', T.liten);
    const nyckel = `${visar.map((x) => x.id).join()}|${egen ? 1 : 0}`;
    if (box.dataset.k !== nyckel) {
      box.dataset.k = nyckel;
      box.textContent = '';
      for (const x of visar) {
        const f = document.createElement('div');
        f.className = `tb-bild k${nr(x.vem)}`;
        const vid = video(x.strom);
        f.append(vid);
        const n = document.createElement('b');
        n.textContent = kallas(x.vem);
        f.append(n);
        box.append(f);
      }
      if (egen) {
        const f = document.createElement('div');
        f.className = 'tb-bild jag';
        f.append(video(T.kam));
        box.append(f);
      }
    }
    for (const f of box.querySelectorAll('.tb-bild:not(.jag)')) {
      const x = visar[[...box.querySelectorAll('.tb-bild:not(.jag)')].indexOf(f)];
      f.classList.toggle('letar', Boolean(x && !x.bild));
    }
  }
  function video(strom) {
    const v = document.createElement('video');
    v.autoplay = true;
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    v.srcObject = strom;
    v.play().catch(() => {});
    return v;
  }

  function besked(text) {
    T.besked = text;
    clearTimeout(T.beskedT);
    T.beskedT = setTimeout(() => {
      T.besked = '';
      rita();
    }, 5000);
    rita();
  }

  // ---------- luren ----------

  function lurHtml() {
    return `<button type="button" class="tel-lur" aria-label="Ring gänget" title="Ring gänget" hidden>${IKON.lur}</button>`;
  }
  function lur(el) {
    if (!el) return;
    el.innerHTML = lurHtml();
    const b = el.firstElementChild;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!jag()) T.oppen = 'vem';
      else if (ringerHosMig()) {
        svara();
        return;
      } else T.oppen = T.oppen ? '' : 'start';
      koppla();
      rita();
    });
    T.lurar.push(b);
    lurar();
  }
  // Luren syns när man kan ringa: inte under ett samtal (då är brickan framme).
  function lurar() {
    const s = T.samtal;
    for (const b of T.lurar) {
      b.hidden = !kan() || !T.finns || !gang().length || T.vill;
      b.classList.toggle('ringer', ringerHosMig());
      b.classList.toggle('pagar', Boolean(s && s.med.length && !T.vill));
      b.setAttribute('aria-expanded', String(Boolean(T.oppen)));
    }
  }

  // ---------- sidan ----------

  addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (T.kam) kameraAv(true);
      if (!T.vill) kopplaNer();
      if (T.signal && T.signal.slag === 'in') spela(null);
    } else {
      koppla();
      if (T.vill) {
        vakna(true);
        if (T.kamAter && Date.now() - T.kamAter < ATER) kamera(true);
      }
      stangAviseringar();
      ljuden();
      rita();
    }
  });
  // (svarade man från aviseringen fanns inget tryck att starta ljudet med: nästa tryck gör det)
  addEventListener('pointerdown', () => { if (T.ac && T.ac.state === 'suspended') T.ac.resume().catch(() => {}); }, { capture: true, passive: true });
  // Stängs sidan går man ur samtalet direkt, i stället för om 30 sekunder – utom när man
  // går till en annan sida på sajten (Tabeller, Statistik, Om oss och tillbaka): då följer
  // samtalet med, och nästa sida går med igen av sig själv inom tjänstens 30 sekunder.
  const vidare = () => { T.vidare = Date.now(); };
  addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.defaultPrevented) return;
    const u = new URL(a.href, location.href);
    if (u.origin === location.origin && u.pathname !== location.pathname) vidare();
  }, true);
  addEventListener('pagehide', (e) => {
    if (e.persisted) return;
    if (T.vill && T.samtal && Date.now() - T.vidare < 5000) {
      try { sessionStorage.setItem(MED, JSON.stringify({ id: T.samtal.id, t: Date.now(), kam: Boolean(T.kam), tyst: T.tyst, startad: T.startad })); } catch { /* privat läge */ }
    } else if (T.vill) skicka({ lagg: true });
    for (const s of [T.mic, T.kam]) if (s) for (const t of s.getTracks()) t.stop();
  });
  try {
    const a = JSON.parse(sessionStorage.getItem(MED) || 'null');
    sessionStorage.removeItem(MED);
    if (a && Date.now() - a.t < 25000) T.aterTill = a;
  } catch { /* privat läge */ }

  // Kupongens data (gänget och tjänstens adress) kommer en stund efter sidan, och
  // vem du är kan ändras i rummet: sidan kopplar upp sig när den vet, och som den
  // nya personen om du byter (men inte mitt i ett samtal).
  function vemKoll() {
    if (document.hidden) return;
    if (!gang().length) lasData();
    prova();
    const v = jag();
    if (T.ws && !T.vill && v !== T.vem) kopplaNer();
    if (!T.ws && !T.timer) koppla();
    if (T.uppe) franAvisering();
    if (!T.lasT && v) {
      T.lasT = 1;
      aviseringar(false);
    }
    lurar();
  }
  function start() {
    const tb = document.querySelector('.topbar-inner');
    if (tb && !tb.querySelector('.tel-ctl')) {
      const c = document.createElement('div');
      c.className = 'tel-ctl';
      tb.insertBefore(c, tb.querySelector('.sk-ctl, .sp-ctl'));
      lur(c);
    }
    setInterval(vemKoll, 1500);
    vemKoll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // ---------- för tv:n ----------

  function lageUt() {
    const s = T.samtal;
    return {
      kan: kan(),
      finns: T.finns !== false,
      vem: T.vem || jag(),
      uppe: T.uppe,
      vill: T.vill,
      med: T.vill && iSamtalet(),
      ringer: ringerHosMig(),
      samtal: s,
      // de andra fönstren i samtalet, med bilden om de visar sig
      andra: T.alla.filter((p) => p.i).map((p) => {
        const x = T.peers.get(p.id);
        return { id: p.id, vem: p.vem, kamera: p.kamera, tyst: p.tyst, strom: x ? x.strom : null, bild: Boolean(x && x.bild), tappad: Boolean(x && x.sedan && Date.now() - x.sedan > LETA && !x.bild) };
      }),
      kam: T.kam,
      kamStartar: T.kamStartar,
      kamFel: T.kamFel,
    };
  }

  return {
    lur,
    lage: lageUt,
    pa: (fn) => T.lyss.add(fn),
    ring,
    svara,
    lagg,
    kamera,
    valjVem: () => { T.oppen = 'vem'; rita(); },
    vidare,
    strom: (id) => (T.peers.get(id) || {}).strom || null,
    egen: () => T.kam,
    namn: kallas,
    nr,
    portratt,
  };
})();
