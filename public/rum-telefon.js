'use strict';

// ---------- telefonerna i rummet ----------
//
// Var och en i gänget har en gammal mobil (rum-3d.js ritar dem på bordet, din
// egen ligger också på pulten). Tar du din telefon är du med i samtalet: de
// andra som också har tagit sin hör dig och du dem, och din figur håller
// telefonen mot örat. Ljudet går direkt mellan telefonerna och datorerna
// (WebRTC); tjänsten profeterna-rummet (worker/rummet.mjs) håller reda på vilka
// som är med (`luren`) och för bara fram uppkopplingen mellan dem (`rtc`).
// Har du rummet öppet utan att vara med ringer din telefon när någon tar sin.
//
// Var och ens röst blir en nivå 0–1 (`nivaer`), som rum-3d.js låter munnen
// följa, och den som pratar (`talar`) tittar de andra på.
//
// RumTelefon.koppla(skicka)   rum-folk.js: så skickas något till rummet
// RumTelefon.fran(d)          rum-folk.js: det rummet skickar
// RumTelefon.svara() / lagg() pulten: ta telefonen och lägg på
// RumTelefon.med()            är du med i samtalet?
// RumTelefon.luren()          vilka som är med, i den ordning de svarade
// RumTelefon.nivaer()         { DL: 0–1, … } just nu, för de som är med
// RumTelefon.talar()          den som pratar just nu, eller null
// RumTelefon.ringer()         vem som ringer (du har rummet öppet och är inte med), eller null
// RumTelefon.fel()            när mikrofonen senast inte gick att få (Date.now()), eller 0
// RumTelefon.pa(fn)           fn(händelse, data): 'luren', 'med', 'ringer', 'nej'

(function () {
  var GANG = ['DL', 'DT', 'DJ'];
  // Ingen egen tjänst för att hitta vägen genom nätet: STUN hos Cloudflare och Google räcker oftast.
  var ICE = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
  var RING_MS = 9000;

  var st = {
    du: null, med: false, luren: [], peers: {}, stream: null, ctx: null,
    egen: null, niva: {}, tal: null, talSedan: 0, ring: null, ringTills: 0, ringLjud: null, fel: 0,
    skicka: null, lyss: [],
  };

  function sag(h, d) {
    st.lyss.forEach(function (f) { try { f(h, d); } catch (e) { console.warn('[telefon]', e); } });
  }
  function skicka(o) { if (st.skicka) try { st.skicka(o); } catch (e) { /* stängd */ } }

  function ljud() {
    if (!st.ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      st.ctx = new C();
    }
    if (st.ctx.state === 'suspended') st.ctx.resume().catch(function () {});
    return st.ctx;
  }

  function analys(stream) {
    var ctx = ljud();
    if (!ctx) return null;
    var src = ctx.createMediaStreamSource(stream);
    var an = ctx.createAnalyser();
    an.fftSize = 1024;
    an.smoothingTimeConstant = 0;
    src.connect(an);
    return { an: an, src: src, buf: new Float32Array(an.fftSize), v: 0 };
  }

  // −52 dB → 0, −22 dB → 1; munnen öppnas fort och stängs lite långsammare
  function las(a, dt) {
    if (!a) return 0;
    a.an.getFloatTimeDomainData(a.buf);
    var s = 0;
    for (var i = 0; i < a.buf.length; i++) s += a.buf[i] * a.buf[i];
    var db = 10 * Math.log10(s / a.buf.length + 1e-10);
    var mal = Math.max(0, Math.min(1, (db + 52) / 30));
    var k = mal > a.v ? Math.min(1, dt / 0.04) : Math.min(1, dt / 0.12);
    a.v += (mal - a.v) * k;
    return a.v;
  }

  var senast = 0;
  function nivaer() {
    var nu = performance.now();
    var dt = senast ? Math.min(0.1, (nu - senast) / 1000) : 1 / 60;
    senast = nu;
    var ut = {};
    if (!st.med) { st.tal = null; return ut; }
    if (st.du && st.egen) ut[st.du] = las(st.egen, dt);
    Object.keys(st.peers).forEach(function (v) { if (st.peers[v].nivan) ut[v] = las(st.peers[v].nivan, dt); });
    // den som pratar: högst över tröskeln en stund; byter inte förrän en annan har pratat en kvarts sekund
    var bast = null;
    var hog = 0.3;
    Object.keys(ut).forEach(function (v) { if (ut[v] > hog) { hog = ut[v]; bast = v; } });
    if (bast && bast !== st.tal) {
      if (!st.talSedan) st.talSedan = nu;
      if (nu - st.talSedan > 250) { st.tal = bast; st.talSedan = 0; }
    } else st.talSedan = 0;
    if (!bast && st.tal && ut[st.tal] < 0.08) {
      st.tystSedan = st.tystSedan || nu;
      if (nu - st.tystSedan > 1500) { st.tal = null; st.tystSedan = 0; }
    } else st.tystSedan = 0;
    st.niva = ut;
    return ut;
  }

  // ---------- samtalet ----------

  function svara() {
    if (st.med || !st.du) return Promise.resolve(false);
    if (!navigator.mediaDevices || !window.RTCPeerConnection) { st.fel = Date.now(); sag('nej', 'stöds inte'); return Promise.resolve(false); }
    sluta();
    ljud();
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(function (stream) {
        st.stream = stream;
        st.egen = analys(stream);
        st.med = true;
        skicka({ luren: true });
        sag('med', true);
        synka();
        return true;
      })
      .catch(function (e) { st.fel = Date.now(); sag('nej', e && e.name); return false; });
  }

  function lagg(tyst) {
    if (!st.med) return;
    st.med = false;
    Object.keys(st.peers).forEach(stang);
    if (st.stream) st.stream.getTracks().forEach(function (t) { t.stop(); });
    if (st.egen) try { st.egen.src.disconnect(); } catch (e) { /* */ }
    st.stream = null; st.egen = null; st.tal = null; st.niva = {};
    if (!tyst) skicka({ luren: false });
    sag('med', false);
  }

  function synka() {
    var vill = st.med ? st.luren.filter(function (v) { return v !== st.du; }) : [];
    Object.keys(st.peers).forEach(function (v) { if (vill.indexOf(v) < 0) stang(v); });
    vill.forEach(function (v) { if (!st.peers[v]) oppna(v); });
  }

  function oppna(v) {
    var pc = new RTCPeerConnection({ iceServers: ICE });
    // perfekt förhandling: den med det senare namnet i bokstavsordning ger med sig vid krock
    var p = { pc: pc, artig: st.du > v, gor: false, ignorera: false, ko: Promise.resolve(), ljud: null, nivan: null };
    st.peers[v] = p;
    st.stream.getTracks().forEach(function (t) { pc.addTrack(t, st.stream); });
    pc.onnegotiationneeded = function () {
      p.gor = true;
      pc.setLocalDescription()
        .then(function () { skicka({ till: v, rtc: { sdp: pc.localDescription } }); })
        .catch(function (e) { console.warn('[telefon] erbjudande', e); })
        .then(function () { p.gor = false; });
    };
    pc.onicecandidate = function (e) { if (e.candidate) skicka({ till: v, rtc: { ice: e.candidate } }); };
    pc.ontrack = function (e) { hor(v, e.streams[0] || new MediaStream([e.track])); };
    pc.onconnectionstatechange = function () {
      if (pc.connectionState === 'failed') try { pc.restartIce(); } catch (e) { /* */ }
    };
  }

  function stang(v) {
    var p = st.peers[v];
    if (!p) return;
    delete st.peers[v];
    try { p.pc.close(); } catch (e) { /* */ }
    if (p.ljud) { p.ljud.srcObject = null; p.ljud.remove(); }
    if (p.nivan) try { p.nivan.src.disconnect(); } catch (e) { /* */ }
  }

  // Den andras röst spelas i ett ljudelement (annars hörs inget i Chrome, och ekot tas bort först då)
  function hor(v, stream) {
    var p = st.peers[v];
    if (!p) return;
    if (!p.ljud) {
      p.ljud = document.createElement('audio');
      p.ljud.autoplay = true;
      p.ljud.setAttribute('playsinline', '');
      p.ljud.hidden = true;
      document.body.appendChild(p.ljud);
    }
    p.ljud.srcObject = stream;
    p.ljud.play().catch(function () {});
    if (p.nivan) try { p.nivan.src.disconnect(); } catch (e) { /* */ }
    p.nivan = analys(stream);
  }

  function signal(v, rtc) {
    if (!st.med) return;
    if (!st.peers[v]) {
      if (st.luren.indexOf(v) < 0) return;
      oppna(v);
    }
    var p = st.peers[v];
    var pc = p.pc;
    p.ko = p.ko.then(function () {
      if (st.peers[v] !== p) return;
      if (rtc.sdp) {
        var krock = rtc.sdp.type === 'offer' && (p.gor || pc.signalingState !== 'stable');
        p.ignorera = !p.artig && krock;
        if (p.ignorera) return;
        return pc.setRemoteDescription(rtc.sdp).then(function () {
          if (rtc.sdp.type !== 'offer') return;
          return pc.setLocalDescription().then(function () { skicka({ till: v, rtc: { sdp: pc.localDescription } }); });
        });
      }
      if (rtc.ice) return pc.addIceCandidate(rtc.ice).catch(function (e) { if (!p.ignorera) throw e; });
    }).catch(function (e) { console.warn('[telefon] uppkoppling', e); });
  }

  // ---------- ringsignalen ----------
  //
  // En egen signal, som en mobil från slutet av 90-talet: korta toner om vartannat, två gånger, och en paus.
  function ringa(vem) {
    st.ring = vem;
    st.ringTills = Date.now() + RING_MS;
    sag('ringer', vem);
    var hordes = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
    if (!hordes || document.hidden) return;
    var ctx = ljud();
    if (!ctx || st.ringLjud) return;
    var ut = ctx.createGain();
    ut.gain.value = 0.06;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    lp.connect(ut); ut.connect(ctx.destination);
    var t0 = ctx.currentTime + 0.05;
    var oscs = [];
    for (var r = 0; r < 4; r++) {
      for (var i = 0; i < 12; i++) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = i % 2 ? 1180 : 1480;
        var t = t0 + r * 2.2 + (i < 6 ? 0 : 0.42) + (i % 6) * 0.055;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(1, t + 0.005);
        g.gain.setValueAtTime(1, t + 0.045);
        g.gain.linearRampToValueAtTime(0, t + 0.05);
        o.connect(g); g.connect(lp);
        o.start(t); o.stop(t + 0.06);
        oscs.push(o);
      }
    }
    st.ringLjud = { ut: ut, oscs: oscs };
    setTimeout(sluta, RING_MS);
  }

  function sluta() {
    if (st.ringLjud) {
      st.ringLjud.oscs.forEach(function (o) { try { o.stop(); } catch (e) { /* */ } });
      try { st.ringLjud.ut.disconnect(); } catch (e) { /* */ }
      st.ringLjud = null;
    }
    if (st.ring) { st.ring = null; sag('ringer', null); }
  }

  // ---------- från rummet ----------

  function fran(d) {
    if (!d || typeof d !== 'object') return;
    if (d.lagg) { lagg(true); return; }
    if (d.fran && d.rtc) { signal(d.fran, d.rtc); return; }
    if (!Array.isArray(d.luren)) return;
    var fore = st.luren;
    st.luren = d.luren.filter(function (v) { return GANG.indexOf(v) >= 0; });
    // tjänsten tappade oss (ny anslutning): säg till igen
    if (st.med && st.du && st.luren.indexOf(st.du) < 0) skicka({ luren: true });
    var ny = st.luren.filter(function (v) { return fore.indexOf(v) < 0 && v !== st.du; });
    if (!st.med && ny.length && st.du) ringa(ny[ny.length - 1]);
    if (st.ring && st.luren.indexOf(st.ring) < 0) sluta();
    sag('luren', st.luren.slice());
    synka();
  }

  window.RumTelefon = {
    koppla: function (fn) {
      st.skicka = fn;
      if (fn && st.med) skicka({ luren: true });
    },
    fran: fran,
    du: function (vem) {
      if (vem === undefined) return st.du;
      vem = GANG.indexOf(vem) >= 0 ? vem : null;
      if (vem === st.du) return st.du;
      if (st.med) lagg();
      st.du = vem;
      return st.du;
    },
    svara: svara,
    lagg: function () { lagg(false); },
    med: function () { return st.med; },
    luren: function () { return st.luren.slice(); },
    nivaer: nivaer,
    talar: function () { return st.tal; },
    ringer: function () { return st.ring && Date.now() < st.ringTills ? st.ring : null; },
    fel: function () { return st.fel; },
    pa: function (fn) { st.lyss.push(fn); },
  };
})();
