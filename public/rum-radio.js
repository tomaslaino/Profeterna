// Kassettradion på fönsterbänken: FM- och AM-bandet, stationsskalan och ljudet. Ett klick på
// radion i rummet går fram till den (sak i rum.js, SAKER.radio), och där sitter reglagen: POWER-knappen,
// bandspaken (FM eller AM), stationsspaken under skalan (visaren följer den, och skalan går också att dra i)
// och volymratten. Radion i 3D (visaren, lampan, spakarna, lysdioderna, högtalarna, tejpen) står i rum-3d.js
// (kassettradio, radioRita).
//
// Stationerna ligger på sina frekvenser (KANALER, de svenska på sina frekvenser i Stockholm och
// Göteborg, AM-bandets på mellanvågen där de sänder eller har sänt, som talkSPORT och Sport 890) och är
// riktiga webbradiokanaler. Mellan dem hörs brus
// (på AM dessutom knaster och den pipton som sjunker när man närmar sig stationen). På en station är FM
// ren och AM har bara ett svagt sus och något enstaka knäpp. Samma visare går över
// båda banden, som på en riktig radio, så ett byte av band hamnar sällan på en station.
//
// Alla stationer står för hand på tejpen vid skalan (FM ovanför, AM under), och med frekvenserna på ett
// blad ur ett spiralblock som är tejpat på fönsterkarmen bredvid radion (lappen, och radiolapp i
// rum-inredning.js). Ett klick på en rad på bladet går dit och sätter på radion. Första gången står
// visaren på Italo Disco.
//
// Ljudet går genom Web Audio (allt är CORS-öppet, kontrollerat 2026-11-08): AM låter som AM (smalt band
// och långsam fading), och lysdioderna och högtalarna följer det som faktiskt hörs. Slutar en adress
// svara provas reservadressen och sedan samma adress utan Web Audio (A.fri), så att en station som
// har bytt server ändå hörs. Ljudet måste sättas igång av ett tryck, och det gör reglagen och lappen. Gänget sjunger och dansar till musik (fig.radio), inte till
// brus eller prat, och slutar inte förrän fyra sekunder efter att musiken har försvunnit: den som drar i
// spaken ska inte få dem att börja om. Radion stängs av när man lämnar rummet (av).
//
//   RumRadio.mount({ el, fig, now, inr, sak })  när gänget har laddats (inr: inredningen med bladet,
//                                        sak(namn): kameran går fram till något)
//   RumRadio.nara(på)                    reglagen läggs över radion (kameran är framme) eller tas bort
//   RumRadio.ram(r, topp, hojd, m, bara) närbilden: radion (r) och bladet (m) i fönstret, eller bara bladet
//   RumRadio.rad(kanal)                  [frekvensen, namnet] som de står på bladet
//   RumRadio.kraft()                     POWER: på med bandet som spaken står på, eller av
//   RumRadio.bandspak('fm' | 'am')       bandspaken (är radion av flyttas bara spaken)
//   RumRadio.av()                        stäng av
//   RumRadio.prova('fm:104.3')           för bilder, utan ljud (?rum-radio-lage)
//   RumRadio.lage()                      hur det står till (band, frekvens, kanal, hörs)
window.RumRadio = (() => {
  // lasa: så här nära är stationen ren, tappa: så här långt bort har den försvunnit i bruset
  const BAND = {
    fm: { fran: 87.5, till: 108.5, steg: 0.1, lasa: 0.07, tappa: 0.22, fanga: 0.26, namn: 'FM', enhet: 'MHz' },
    am: { fran: 520, till: 1620, steg: 9, lasa: 2, tappa: 7.5, fanga: 9, namn: 'AM', enhet: 'kHz' },
  };
  const khz = (x) => `https://${x}-ice.stream.khz.se/${x}_mp3`;
  // (direkt till servrarna: live1.sr.se och flera andra skickar vidare utan CORS, och då spelas inget)
  const sr = (x) => ({ url: `https://edge1.sr.se/${x}-mp3-96`, reserv: `https://edge2.sr.se/${x}-mp3-96` });
  const rai = (x) => `https://icecdn-19d24861e90342cc8decb03c24c8a419.msvdn.net/icecastRelay/${x}/icecast`;
  // (i frekvensordning: lappen står som de står här)
  const KANALER = [
    { id: 'skargard', band: 'fm', f: 88.1, namn: 'Skärgårdsradion', kort: 'Skärgård', url: khz('fm06'), musik: true },
    { id: 'dansband', band: 'fm', f: 88.7, namn: 'Dansbandskanalen', kort: 'Dansband', url: 'https://stream.dbmedia.se/dbkMP3', musik: true },
    { id: 'marca', band: 'fm', f: 89.3, namn: 'Radio Marca', kort: 'Marca', url: 'https://streaming.enacast.com/radiomarcaasturiasHD.mp3', musik: false },
    { id: 'country', band: 'fm', f: 89.9, namn: 'Go Country', kort: 'Country', url: khz('wr14'), musik: true },
    { id: 'italo', band: 'fm', f: 90.4, namn: 'Italo Disco', kort: 'Italo', url: 'https://italo-disco.stream.laut.fm/italo-disco', musik: true },
    { id: 'fip', band: 'fm', f: 91, namn: 'FIP', kort: 'FIP', url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', musik: true },
    { id: 'rai2', band: 'fm', f: 91.7, namn: 'Rai Radio 2', kort: 'Rai 2', url: rai('S35942484/yp5F67151K92'), musik: true },
    { id: 'p1', band: 'fm', f: 92.4, namn: 'P1', kort: 'P1', ...sr('p1'), musik: false },
    { id: 'guld60', band: 'fm', f: 93, namn: 'Guldkanalen 60-tal', kort: '60-tal', url: 'https://stream.dbmedia.se/gk60tal96', musik: true },
    { id: 'guld', band: 'fm', f: 93.7, namn: 'Guldkanalen 80-tal', kort: '80-tal', url: 'https://stream.dbmedia.se/gk80tal96', musik: true },
    { id: 'nostalgi', band: 'fm', f: 94.2, namn: 'Radio Nostalgi', kort: 'Nostalgi', url: 'https://live-bauerse-fm.sharp-stream.com/nostalgi_mp3', musik: true },
    { id: 'gamla', band: 'fm', f: 94.8, namn: 'Gamla Favoriter', kort: 'Gamla', url: khz('wr09'), musik: true },
    { id: 'power', band: 'fm', f: 95.3, namn: 'Power Hit Radio', kort: 'Power', url: khz('fm04'), musik: true },
    { id: 'p2', band: 'fm', f: 96.2, namn: 'P2', kort: 'P2', ...sr('p2'), musik: true },
    { id: 'rock', band: 'fm', f: 97.7, namn: 'Rockklassiker', kort: 'Rock', url: 'https://live-bauerse-fm.sharp-stream.com/rockklassiker_instream_se_aacp', musik: true },
    { id: 'hitmix', band: 'fm', f: 98.5, namn: 'HitMix 90’s', kort: '90-tal', url: khz('wr19'), musik: true },
    { id: 'p3', band: 'fm', f: 99.3, namn: 'P3', kort: 'P3', ...sr('p3'), musik: true },
    { id: 'disco', band: 'fm', f: 100.6, namn: 'Disco 54', kort: 'Disco', url: khz('wr15'), musik: true },
    { id: 'nova', band: 'fm', f: 101.3, namn: 'Radio Nova', kort: 'Nova', url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3', musik: true },
    { id: 'p4g', band: 'fm', f: 101.9, namn: 'P4 Göteborg', kort: 'P4 G', ...sr('p4gbg'), musik: false },
    { id: 'rtl', band: 'fm', f: 102.5, namn: 'RTL 102.5', kort: 'RTL', url: 'https://streamingv2.shoutcast.com/rtl-1025', musik: true },
    { id: 'p4', band: 'fm', f: 103.3, namn: 'P4 Stockholm', kort: 'P4 S', ...sr('p4sth'), musik: false },
    { id: 'mix', band: 'fm', f: 104.3, namn: 'Mix Megapol', kort: 'Mix', url: 'https://live-bauerse-fm.sharp-stream.com/mixmegapol_instream_se_mp3', musik: true },
    { id: 'r105', band: 'fm', f: 105.1, namn: 'Radio 105', kort: '105', url: 'https://icecast.unitedradio.it/Radio105.mp3', musik: true },
    { id: 'bandit', band: 'fm', f: 106.3, namn: 'Bandit Rock', kort: 'Bandit', url: khz('fm02'), musik: true },
    { id: 'rix', band: 'fm', f: 106.7, namn: 'Rix FM', kort: 'Rix', url: khz('fm01'), musik: true },
    { id: 'star', band: 'fm', f: 107.1, namn: 'Star FM', kort: 'Star', url: khz('fm05'), musik: true },
    { id: 'club', band: 'fm', f: 107.8, namn: 'Power Club', kort: 'Club', url: khz('wr06'), musik: true },
    { id: 'rural', band: 'am', f: 610, namn: 'Radio Rural', kort: 'Rural', url: 'https://radiolatina.live/9206/stream', musik: false },
    { id: 'rivadavia', band: 'am', f: 630, namn: 'Radio Rivadavia', kort: 'Rivadavia', url: 'https://radio02.ferozo.com/proxy/ra02001331?mp=/stream', musik: false },
    { id: 'clasica', band: 'am', f: 650, namn: 'Clásica', kort: 'Clásica', url: 'https://radios.iwstreaming.uy/8032/stream', musik: true },
    { id: 'sarandi', band: 'am', f: 690, namn: 'Sarandí', kort: 'Sarandí', url: 'https://radiolatina.live:10977/sarandi', musik: false },
    { id: 'mitre', band: 'am', f: 790, namn: 'Radio Mitre', kort: 'Mitre', url: 'https://sc.host-live.com:10810/stream', musik: false },
    { id: 'espectador', band: 'am', f: 810, namn: 'El Espectador', kort: 'Espectador', url: 'https://espectador-1.nty.uy/', musik: false },
    { id: 'carve', band: 'am', f: 850, namn: 'Radio Carve', kort: 'Carve', url: 'https://icecast22.innovanexo.com:9000/radiocarve850.mp3', musik: false },
    { id: 'nacional', band: 'am', f: 870, namn: 'Radio Nacional', kort: 'Nacional', url: 'https://sa.mp3.icecast.magma.edge-access.net/sc_rad1', musik: false },
    { id: 'sport', band: 'am', f: 890, namn: 'Sport 890', kort: 'Sport 890', url: 'https://radiolatina.live:10976/sport', reserv: 'https://puma.streemlion.com:2415/stream', musik: false },
    { id: 'rai', band: 'am', f: 900, namn: 'Rai Radio 1', kort: 'Rai', url: rai('S16355530/Q4zh3NTu28Rx'), musik: false },
    { id: 'montecarlo', band: 'am', f: 930, namn: 'Radio Monte Carlo', kort: 'Monte Carlo', url: 'https://icecast22.innovanexo.com:9000/montecarlo.mp3', reserv: 'https://icecast15.innovanexo.com:9000/montecarlo.mp3', musik: true },
    { id: 'reloj', band: 'am', f: 950, namn: 'Radio Reloj', kort: 'Reloj', url: 'https://icecast.teveo.cu/b3jbfThq', musik: false },
    { id: 'universal', band: 'am', f: 970, namn: '970 Universal', kort: 'Universal', url: 'https://970universal-3.nty.uy/', musik: false },
    { id: 'cope', band: 'am', f: 999, namn: 'COPE', kort: 'COPE', url: 'https://net1-cope-rrcast.flumotion.com/cope/net1-low.mp3', musik: false },
    { id: 'talksport', band: 'am', f: 1053, namn: 'talkSPORT', kort: 'talkSPORT', url: 'https://radio.talksport.com/stream', musik: false },
    { id: 'talksport2', band: 'am', f: 1089, namn: 'talkSPORT 2', kort: 'talk 2', url: 'https://talksport.live.stream.broadcasting.news/stream2', musik: false },
    { id: 'caroline', band: 'am', f: 1159, namn: 'Radio Caroline', kort: 'Caroline', url: 'https://happy.radiocaroline.nl/listen/classic_rock/radio128.mp3', musik: true },
    { id: 'p6', band: 'am', f: 1179, namn: 'P6', kort: 'P6', ...sr('p6'), musik: false },
    { id: 'rmc', band: 'am', f: 1467, namn: 'RMC', kort: 'RMC', url: 'https://audio.bfmtv.com/rmcradio_128.mp3', musik: false },
    { id: 'vaticana', band: 'am', f: 1530, namn: 'Radio Vaticana', kort: 'Vatikanen', url: 'https://radio.vaticannews.va/stream-it', musik: false },
    { id: 'gold', band: 'am', f: 1548, namn: 'Gold', kort: 'Gold', url: 'https://media-ssl.musicradio.com/GoldMP3', musik: true },
  ];
  const kanal = (id) => KANALER.find((k) => k.id === id) || null;
  const pAv = (band, f) => (f - BAND[band].fran) / (BAND[band].till - BAND[band].fran);
  const fAv = (band, p) => BAND[band].fran + p * (BAND[band].till - BAND[band].fran);
  const kl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const mjuk = (a, b, x) => { const t = kl((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  // Det som sparas: visaren och volymen (och radion är av när man kommer tillbaka)
  const NYCKEL = 'rum-radio';
  const S = { band: 'av', sist: 'fm', p: pAv('fm', 90.4), vol: 0.55 };
  try {
    const x = JSON.parse(localStorage.getItem(NYCKEL) || 'null');
    if (x) {
      if (Number.isFinite(x.p)) S.p = kl(x.p);
      if (Number.isFinite(x.vol)) S.vol = kl(x.vol);
      if (BAND[x.sist]) S.sist = x.sist;
    }
  } catch (err) { /* då börjar den från början */ }
  let sparaT = 0;
  function spara() {
    clearTimeout(sparaT);
    sparaT = setTimeout(() => {
      try { localStorage.setItem(NYCKEL, JSON.stringify({ p: S.p, vol: S.vol, sist: S.sist })); } catch (err) { /* bara den här gången */ }
    }, 400);
  }

  const O = { el: null, fig: () => null, now: () => 0, tyst: false };
  const fig = () => O.fig();
  // visaren: den går mot mal (N.mal) med lite tröghet, och ljudet följer den
  const N = { mal: S.p, raf: 0, sen: 0, drag: false };
  // ljudet (A.ctx först efter ett tryck)
  const A = { ctx: null, el: null, fri: null, friPa: false, steg: 0, kanal: null, klar: false, narmast: null, s: 0, fade: 1, las: 0, slapp: 0, gangT: 0, gang: false, omT: 0, fel: {}, basSn: 0 };

  function narmast(band, f) {
    let bast = null;
    let d = Infinity;
    for (const k of KANALER) {
      if (k.band !== band) continue;
      const x = Math.abs(k.f - f);
      if (x < d) { d = x; bast = k; }
    }
    return { k: bast, d };
  }

  // ---------- ljudet ----------
  function ljudStart() {
    if (O.tyst) return;
    if (A.ctx) {
      if (A.ctx.state !== 'running') A.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const c = new Ctx();
    A.ctx = c;
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.preload = 'auto';
    A.el = el;
    A.utv = c.createGain();
    A.utv.gain.value = S.vol ** 1.6;
    // (ett tak: starka stationer på hög volym slår annars i botten och sprakar)
    A.tak = c.createDynamicsCompressor();
    A.tak.threshold.value = -1;
    A.tak.knee.value = 0;
    A.tak.ratio.value = 20;
    A.tak.attack.value = 0.002;
    A.tak.release.value = 0.12;
    A.utv.connect(A.tak);
    A.tak.connect(c.destination);
    A.mix = c.createGain();
    A.mix.connect(A.utv);
    A.an = c.createAnalyser();
    A.an.fftSize = 512;
    A.an.smoothingTimeConstant = 0.35;
    A.an.minDecibels = -75;
    A.an.maxDecibels = -15;
    A.mix.connect(A.an);
    A.buf = new Uint8Array(A.an.frequencyBinCount);
    A.vag = new Uint8Array(A.an.fftSize);
    // stationen: rak på FM, smal på AM (bandSatt)
    A.hp = c.createBiquadFilter();
    A.hp.type = 'highpass';
    A.lp = c.createBiquadFilter();
    A.lp.type = 'lowpass';
    A.topp = c.createBiquadFilter();
    A.topp.type = 'peaking';
    A.topp.frequency.value = 1300;
    A.stn = c.createGain();
    A.stn.gain.value = 0;
    c.createMediaElementSource(el).connect(A.hp);
    A.hp.connect(A.lp);
    A.lp.connect(A.topp);
    A.topp.connect(A.stn);
    A.stn.connect(A.mix);
    // bruset, knastret på AM (tätt mellan stationerna, glest på dem) och piptonen mellan AM-stationerna
    const vit = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const v = vit.getChannelData(0);
    for (let i = 0; i < v.length; i++) v[i] = Math.random() * 2 - 1;
    const knaster = (sek, antal) => {
      const b = c.createBuffer(1, Math.floor(c.sampleRate * sek), c.sampleRate);
      const q = b.getChannelData(0);
      for (let n = 0; n < antal; n++) {
        const at = Math.floor(Math.random() * (q.length - 800));
        const st = 0.25 + Math.random() * 0.75;
        const len = 40 + Math.floor(Math.random() * 500);
        for (let i = 0; i < len; i++) q[at + i] += st * (Math.random() * 2 - 1) * (1 - i / len) ** 2;
      }
      return b;
    };
    const slinga = (b) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s; };
    A.bHp = c.createBiquadFilter();
    A.bHp.type = 'highpass';
    A.bLp = c.createBiquadFilter();
    A.bLp.type = 'lowpass';
    A.brus = c.createGain();
    A.brus.gain.value = 0;
    slinga(vit).connect(A.bHp);
    A.bHp.connect(A.bLp);
    A.bLp.connect(A.brus);
    A.brus.connect(A.mix);
    const popLp = c.createBiquadFilter();
    popLp.type = 'lowpass';
    popLp.frequency.value = 2600;
    popLp.connect(A.mix);
    A.pop = c.createGain();
    A.pop.gain.value = 0;
    slinga(knaster(5, 34)).connect(A.pop);
    A.pop.connect(popLp);
    A.gles = c.createGain();
    A.gles.gain.value = 0;
    slinga(knaster(9.7, 6)).connect(A.gles);
    A.gles.connect(popLp);
    A.viss = c.createOscillator();
    A.viss.type = 'sine';
    A.visG = c.createGain();
    A.visG.gain.value = 0;
    A.viss.connect(A.visG);
    A.visG.connect(A.mix);
    A.viss.start();
    A.fri = new Audio();
    A.fri.preload = 'auto';
    const spelar = () => { clearTimeout(A.omT); A.klar = true; lyssna(); };
    const vantar = () => { A.klar = false; lyssna(); };
    const spela = (x, u) => {
      x.src = u;
      const p = x.play();
      if (p && p.catch) p.catch(() => {});
    };
    // Adressen svarar inte: reservadressen, samma adress utan Web Audio, och sedan brus en stund
    const borta = () => {
      const k = A.kanal;
      if (!k) return;
      A.klar = false;
      if (A.steg === 0 && k.reserv) {
        A.steg = 1;
        spela(el, k.reserv);
      } else if (A.steg < 2) {
        A.steg = 2;
        el.removeAttribute('src');
        el.load();
        A.friPa = true;
        spela(A.fri, k.url);
      } else {
        A.kanal = null;
        tyst(A.fri);
        A.friPa = false;
        A.fel[k.id] = performance.now();
        clearTimeout(A.omT);
        A.omT = setTimeout(() => { delete A.fel[k.id]; lyssna(); }, 6000);
      }
      lyssna();
    };
    for (const x of [el, A.fri]) {
      x.addEventListener('playing', spelar);
      x.addEventListener('waiting', vantar);
      for (const h of ['error', 'ended']) x.addEventListener(h, () => { if (x.getAttribute('src')) borta(); });
    }
    bandSatt();
    // (första trycket låser upp spelaren i Safari, också utan någon station under visaren)
    const lasUpp = el.play();
    if (lasUpp && lasUpp.catch) lasUpp.catch(() => {});
    // (fadingen på AM och att den ibland hänger sig efter en dold flik)
    setInterval(() => {
      if (S.band === 'am' && A.klar) {
        A.fade = 0.82 + Math.random() * 0.18;
        lyssna();
      } else if (A.fade !== 1) A.fade = 1;
    }, 1400);
  }
  const param = (x, v, tid = 0.05) => { if (x) x.setTargetAtTime(v, A.ctx.currentTime, tid); };
  function bandSatt() {
    if (!A.ctx) return;
    const am = S.band === 'am';
    param(A.hp.frequency, am ? 320 : 20, 0.02);
    param(A.lp.frequency, am ? 3100 : 19000, 0.02);
    param(A.topp.gain, am ? 4 : 0, 0.02);
    param(A.bHp.frequency, am ? 200 : 900, 0.02);
    param(A.bLp.frequency, am ? 2800 : 11000, 0.02);
  }
  const tyst = (x) => {
    if (!x || !x.getAttribute('src')) return;
    x.pause();
    x.removeAttribute('src');
    x.load();
  };
  function laddaIn(k) {
    if (!A.el || A.kanal === k) return;
    clearTimeout(A.omT);
    tyst(A.fri);
    A.friPa = false;
    A.steg = 0;
    A.kanal = k;
    A.klar = false;
    A.el.src = k.url;
    const p = A.el.play();
    if (p && p.catch) p.catch(() => {});
  }
  function slapp() {
    A.kanal = null;
    A.klar = false;
    A.friPa = false;
    tyst(A.el);
    tyst(A.fri);
  }
  function gangSatt(pa) {
    if (A.gang === pa) return;
    A.gang = pa;
    const g = fig();
    if (g && g.radio) g.radio(pa, O.now());
  }
  // Var visaren står och vad som ska höras: anropas när visaren har rört sig och när något har hänt
  function lyssna() {
    const pa = S.band !== 'av';
    const f = pa ? fAv(S.band, S.p) : 0;
    const { k, d } = pa ? narmast(S.band, f) : { k: null, d: Infinity };
    const B = BAND[S.band];
    const s = k ? 1 - mjuk(B.lasa, B.tappa, d) : 0;
    const provar = O.tyst;
    const hors = provar ? s > 0.5 : Boolean(k && A.kanal === k && A.klar);
    A.narmast = k;
    A.s = s;
    if (pa && !provar && A.ctx) {
      clearTimeout(A.las);
      clearTimeout(A.slapp);
      if (s > 0.02 && A.kanal !== k && !A.fel[k.id]) {
        // (inte varje station man far förbi; står visaren still är det ett tryck, och då genast)
        if (N.drag || N.raf) A.las = setTimeout(() => laddaIn(k), 240);
        else laddaIn(k);
      } else if (s <= 0.02 && A.kanal) {
        A.slapp = setTimeout(slapp, 5000);
      }
      const am = S.band === 'am';
      const ren = hors ? s : 0;
      // Bruset tystnar när visaren står på stationen, också medan den laddas eller hackar till (bara en
      // station som inte svarar ger brus). Där är FM ren, och AM har kvar ett svagt sus och något enstaka knäpp.
      const bar = hors ? s : k && A.kanal === k ? s * 0.9 : 0;
      param(A.stn.gain, hors && !A.friPa ? ren * (am ? A.fade : 1) : 0, am ? 0.35 : 0.04);
      if (A.friPa) A.fri.volume = kl(ren * S.vol ** 1.6);
      param(A.brus.gain, am ? 0.32 * (1 - 0.95 * bar) * (2 - A.fade) : 0.3 * (1 - bar), 0.04);
      param(A.pop.gain, am ? 0.34 * (1 - bar) : 0, 0.05);
      param(A.gles.gain, am ? 0.06 * bar : 0, 0.05);
      // (AM: tonen mellan stationerna, som sjunker tills man står rätt)
      if (am && d > B.lasa * 0.7 && d < B.tappa * 1.6) {
        param(A.viss.frequency, 120 + d * 340, 0.02);
        param(A.visG.gain, 0.022 * (1 - bar), 0.04);
      } else param(A.visG.gain, 0, 0.04);
    } else if (A.ctx) {
      clearTimeout(A.las);
      clearTimeout(A.slapp);
      param(A.stn.gain, 0, 0.02);
      param(A.brus.gain, 0, 0.02);
      param(A.pop.gain, 0, 0.02);
      param(A.gles.gain, 0, 0.02);
      param(A.visG.gain, 0, 0.02);
      if (!pa && A.kanal) slapp();
    }
    // gänget: musik sätter igång dem direkt, och de slutar först en stund efter att musiken är borta
    const musik = Boolean(pa && k && k.musik && hors && s > 0.5);
    if (musik || !pa) {
      clearTimeout(A.gangT);
      A.gangT = 0;
      gangSatt(musik);
    } else if (A.gang && !A.gangT) {
      A.gangT = setTimeout(() => { A.gangT = 0; gangSatt(false); }, 4000);
    }
    till3d({ s: hors ? s * (S.band === 'am' ? 0.45 + 0.55 * A.fade : 1) : s * 0.12 });
    lappNu();
  }
  // Hur mycket som hörs just nu, till lysdioderna och högtalarna (rum-3d.js, radioRita).
  function niva() {
    if (!A.ctx || S.band === 'av' || A.friPa) return null;
    // styrkan i decibel (−38 dB är inget, −8 dB är allt) och basens slag ovanför sitt medel
    A.an.getByteTimeDomainData(A.vag);
    let sum = 0;
    for (let i = 0; i < A.vag.length; i += 2) { const x = (A.vag[i] - 128) / 128; sum += x * x; }
    const rms = Math.sqrt(sum / (A.vag.length / 2));
    A.an.getByteFrequencyData(A.buf);
    const b = (A.buf[0] + A.buf[1] + A.buf[2] + A.buf[3]) / (4 * 255);
    A.basSn += (b - A.basSn) * 0.04;
    return { bas: kl((b - A.basSn * 0.9) * 3.2), tot: kl((20 * Math.log10(rms + 1e-5) + 38) / 30) };
  }
  // (knappen ett högt klick, spaken ett lägre och längre)
  function klick(ton = 2300, tid = 0.03, styrka = 0.5) {
    if (!A.ctx) return;
    const c = A.ctx;
    const b = c.createBuffer(1, Math.floor(c.sampleRate * tid), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    const s = c.createBufferSource();
    s.buffer = b;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = ton;
    const g = c.createGain();
    g.gain.value = styrka;
    s.connect(f);
    f.connect(g);
    g.connect(c.destination);
    s.start();
  }

  // ---------- till 3D ----------
  function till3d(x = {}) {
    const g = fig();
    if (g && g.radioLage) g.radioLage(x);
  }
  function allt3d() {
    const g = fig();
    if (!g || !g.radioLage) return;
    g.radioLage({ band: S.band, sist: S.sist, p: S.p, vol: S.vol, lampa: S.band === 'av' ? 0 : 1, niva });
    g.radioEtiketter(KANALER.map((k) => ({ id: k.id, band: k.band, p: pAv(k.band, k.f), kort: k.kort })));
  }

  // ---------- visaren ----------
  function fortsatt() {
    if (N.raf) return;
    N.sen = performance.now();
    N.raf = requestAnimationFrame(steg);
  }
  function steg(ms) {
    N.raf = 0;
    const dt = Math.min(0.1, (ms - N.sen) / 1000);
    N.sen = ms;
    const d = N.mal - S.p;
    // (minskad rörelse: direkt)
    const lugn = matchMedia('(prefers-reduced-motion: reduce)').matches;
    S.p = lugn || Math.abs(d) < 0.00025 ? N.mal : S.p + d * (1 - Math.exp(-dt * (N.drag ? 22 : 7)));
    till3d({ p: S.p });
    lyssna();
    if (S.p !== N.mal) N.raf = requestAnimationFrame(steg);
    else {
      spara();
      spakNu();
    }
  }
  const malet = (p) => { N.mal = kl(p); fortsatt(); };
  // Släpper man nära en station drar radion in den (AFC), som på en riktig radio.
  function fanga() {
    const band = S.band === 'av' ? S.sist : S.band;
    const f = fAv(band, N.mal);
    const { k, d } = narmast(band, f);
    if (k && d < BAND[band].fanga) malet(pAv(band, k.f));
  }
  function stega(n) {
    const band = S.band === 'av' ? S.sist : S.band;
    malet(N.mal + (n * BAND[band].steg) / (BAND[band].till - BAND[band].fran));
    clearTimeout(N.afc);
    N.afc = setTimeout(fanga, 500);
  }
  // S.band: 'av' eller det band som hörs; S.sist: det band som bandspaken står på.
  function satt(band, ton) {
    if (band === S.band) return;
    ljudStart();
    if (ton) klick(...ton);
    else klick();
    S.band = band;
    if (band !== 'av') S.sist = band;
    bandSatt();
    if (band === 'av') slapp();
    else if (A.el && A.kanal && A.kanal.band !== band) slapp();
    till3d({ band, sist: S.sist, lampa: band === 'av' ? 0 : 1 });
    lyssna();
    knappar();
    spara();
  }
  const KLONK = [820, 0.055, 0.65];
  const kraft = () => satt(S.band === 'av' ? S.sist : 'av');
  // Bandspaken byter band. Är radion av flyttas bara spaken, som på en riktig radio.
  function bandspak(band) {
    if (band === S.sist || !BAND[band]) return;
    if (S.band !== 'av') {
      satt(band, KLONK);
      return;
    }
    ljudStart();
    klick(...KLONK);
    S.sist = band;
    till3d({ sist: band });
    knappar();
    spara();
  }
  function volym(v) {
    S.vol = kl(v);
    till3d({ vol: S.vol });
    if (A.ctx) param(A.utv.gain, S.vol ** 1.6, 0.03);
    if (A.friPa) A.fri.volume = kl(A.s * S.vol ** 1.6);
    if (U.vol) U.vol.setAttribute('aria-valuenow', String(Math.round(S.vol * 100)));
    spara();
  }
  function valj(id) {
    const k = kanal(id);
    if (!k) return;
    ljudStart();
    if (S.band !== k.band) satt(k.band);
    malet(pAv(k.band, k.f));
  }

  // ---------- reglagen ----------
  // Genomskinliga knappar över delarna i 3D, placerade när kameran är framme. Fingret når dem också
  // när radion är liten (MINST), och i bilden ser man den riktiga delen röra sig under. Lappen med
  // frekvenserna (nedan) står bland dem.
  const U = { el: null, pa: false };
  const MINST = 42;
  function bygg() {
    if (U.el) return;
    const d = document.createElement('div');
    d.className = 'rum-radio-reglage';
    d.dataset.radio = '';
    d.hidden = true;
    // (skalan och spaken gör samma sak, och skalan är bara till för handen; den som ska stå överst står sist)
    d.innerHTML = '<div class="r-del r-kropp"></div><div class="r-del r-skala"></div>'
      + '<div class="r-del r-spak" role="slider" tabindex="0" aria-label="Stationsspaken" aria-valuemin="0" aria-valuemax="100"></div>'
      + '<div class="r-del r-ratt r-vol" role="slider" tabindex="0" aria-label="Volymen" aria-valuemin="0" aria-valuemax="100"></div>'
      + '<button type="button" class="r-del r-kraft" aria-label="På och av"></button>'
      + '<button type="button" class="r-del r-band"></button>'
      + '<button type="button" class="r-lapp" aria-label="Gå fram till lappen med stationerna" hidden></button>'
      + `<div class="r-rader" hidden>${KANALER.map((k) => `<button type="button" class="r-st" data-k="${k.id}" aria-pressed="false">${rad(k).join(' ')}</button>`).join('')}</div>`;
    O.el.append(d);
    U.el = d;
    // (reglagen är inget drag i rummet: svepet i rum.js ska inte se dem, och inte stoppa nästa klick)
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'mouseover', 'wheel', 'touchstart', 'touchmove']) d.addEventListener(n, (e) => e.stopPropagation());
    U.kropp = d.querySelector('.r-kropp');
    U.skala = d.querySelector('.r-skala');
    U.spak = d.querySelector('.r-spak');
    U.vol = d.querySelector('.r-vol');
    U.kraft = d.querySelector('.r-kraft');
    U.band = d.querySelector('.r-band');
    U.lapp = d.querySelector('.r-lapp');
    U.rader = d.querySelector('.r-rader');
    U.st = {};
    for (const b of U.rader.querySelectorAll('.r-st')) U.st[b.dataset.k] = b;
    U.rader.addEventListener('click', (e) => {
      const b = e.target.closest('.r-st');
      if (b) valj(b.dataset.k);
    });
    // (raderna är för små här: kameran går fram till bladet)
    U.lapp.addEventListener('click', () => { if (!U.lapp.classList.contains('las') && O.sak) O.sak('radiolapp'); });
    U.nu = null;
    lappNu();
    U.kraft.addEventListener('click', kraft);
    // bandspaken: upp är FM och ner är AM, och ett tryck slår över den
    let y0 = null;
    let drog = false;
    U.band.addEventListener('pointerdown', (e) => {
      y0 = e.clientY;
      drog = false;
      U.band.setPointerCapture(e.pointerId);
    });
    U.band.addEventListener('pointermove', (e) => {
      if (y0 == null || Math.abs(e.clientY - y0) < 6) return;
      drog = true;
      bandspak(e.clientY < y0 ? 'fm' : 'am');
    });
    const slapper = () => { y0 = null; };
    U.band.addEventListener('pointerup', slapper);
    U.band.addEventListener('pointercancel', slapper);
    U.band.addEventListener('click', () => {
      if (drog) drog = false;
      else bandspak(S.sist === 'fm' ? 'am' : 'fm');
    });
    // skalan och spaken: visaren följer handen. Griper man om spaken stannar den där man tog tag i den,
    // och trycker man någon annanstans på skenan går den dit.
    const dukPunkt = (e) => {
      const c = O.el.querySelector('#rum-3d').getBoundingClientRect();
      return [((e.clientX - c.left) / c.width) * 2 - 1, -(((e.clientY - c.top) / c.height) * 2 - 1)];
    };
    const fanga3 = (el, ner, drar, upp) => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        ljudStart();
        N.drag = true;
        ner(e);
        el.focus({ preventScroll: true });
      });
      el.addEventListener('pointermove', (e) => { if (el.hasPointerCapture(e.pointerId)) drar(e); });
      const klar = (e) => { if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); N.drag = false; upp(); };
      el.addEventListener('pointerup', klar);
      el.addEventListener('pointercancel', klar);
    };
    let grepp = 0;
    let fri = false;
    const handP = (e) => { const g = fig(); return g ? g.radioP(...dukPunkt(e)) : N.mal; };
    const griper = (e) => {
      const p = handP(e);
      const vidSpaken = Math.abs(p - N.mal) < 0.05;
      grepp = vidSpaken ? N.mal - p : 0;
      // (nedanför skenan hänger bara kulan: ett tryck bredvid den är ett tryck på fronten)
      const r = U.spak.getBoundingClientRect();
      fri = !vidSpaken && e.currentTarget === U.spak && e.clientY > r.top + r.height * 0.42;
      if (!fri) malet(p + grepp);
    };
    const drar = (e) => { if (!fri) malet(handP(e) + grepp); };
    fanga3(U.skala, griper, drar, fanga);
    fanga3(U.spak, griper, drar, fanga);
    // volymratten: runt med musen, längs med eller upp och ner med fingret
    const vrid = (el, varv, pxHela, hamta, satt, upp) => {
      let v0 = 0;
      let a0 = 0;
      let x0 = 0;
      let y1 = 0;
      const vinkel = (e) => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
      fanga3(el, (e) => { v0 = hamta(); a0 = vinkel(e); x0 = e.clientX; y1 = e.clientY; }, (e) => {
        if (e.pointerType === 'mouse') {
          const a = vinkel(e);
          let da = a - a0;
          if (da > Math.PI) da -= 2 * Math.PI;
          if (da < -Math.PI) da += 2 * Math.PI;
          a0 = a;
          v0 = kl(v0 + da / (2 * Math.PI * varv));
          satt(v0);
        } else satt(kl(v0 + (e.clientX - x0 - (e.clientY - y1)) / pxHela));
      }, upp);
    };
    vrid(U.vol, 0.75, 170, () => S.vol, volym, () => {});
    // hjulet och tangentbordet
    U.spak.addEventListener('wheel', (e) => { e.preventDefault(); stega(Math.sign(e.deltaY) * -1); }, { passive: false });
    U.skala.addEventListener('wheel', (e) => { e.preventDefault(); stega(Math.sign(e.deltaY) * -1); }, { passive: false });
    U.vol.addEventListener('wheel', (e) => { e.preventDefault(); volym(S.vol - Math.sign(e.deltaY) * 0.05); }, { passive: false });
    document.addEventListener('keydown', (e) => {
      if (!U.pa || e.metaKey || e.ctrlKey || e.altKey) return;
      const pa = { ArrowLeft: () => stega(-1), ArrowRight: () => stega(1), ArrowUp: () => volym(S.vol + 0.05), ArrowDown: () => volym(S.vol - 0.05) }[e.key];
      if (!pa) return;
      e.preventDefault();
      ljudStart();
      pa();
    });
  }
  function spakNu() {
    if (!U.el) return;
    const band = BAND[S.sist];
    const f = fAv(S.sist, S.p);
    U.spak.setAttribute('aria-valuenow', String(Math.round(S.p * 100)));
    U.spak.setAttribute('aria-valuetext', `${(band.steg < 1 ? f.toFixed(1) : String(Math.round(f))).replace('.', ',')} ${band.enhet}`);
  }
  function knappar() {
    if (!U.el) return;
    U.kraft.setAttribute('aria-pressed', String(S.band !== 'av'));
    U.band.setAttribute('aria-label', `Bandet: ${BAND[S.sist].namn}`);
    U.vol.setAttribute('aria-valuenow', String(Math.round(S.vol * 100)));
    spakNu();
  }
  function placera() {
    const g = fig();
    const c = O.el.querySelector('#rum-3d');
    if (!g || !g.radioDelar || !c || !U.el) return;
    const r = c.getBoundingClientRect();
    const d = g.radioDelar();
    const satt = (el, [l, t, h, b]) => {
      let x0 = r.left + l * r.width;
      let x1 = r.left + h * r.width;
      let y0 = r.top + t * r.height;
      let y1 = r.top + b * r.height;
      const lagg = (a0, a1) => { const m = Math.max(0, MINST - (a1 - a0)) / 2; return [a0 - m, a1 + m]; };
      [y0, y1] = lagg(y0, y1);
      [x0, x1] = lagg(x0, x1);
      Object.assign(el.style, { left: `${x0.toFixed(1)}px`, top: `${y0.toFixed(1)}px`, width: `${(x1 - x0).toFixed(1)}px`, height: `${(y1 - y0).toFixed(1)}px` });
    };
    satt(U.kropp, d.kropp);
    satt(U.skala, d.skala);
    satt(U.spak, d.spak);
    satt(U.vol, d.vol);
    satt(U.kraft, d.kraft);
    satt(U.band, d.band);
    lappPlats();
  }
  function nara(pa) {
    bygg();
    U.pa = Boolean(pa);
    U.el.hidden = !pa;
    if (pa) {
      placera();
      knappar();
    }
  }

  // ---------- lappen ----------
  // Ett blad ur ett spiralblock, tejpat på fönsterkarmen till höger om radion (radiolapp i rum-inredning.js):
  // stationerna för hand, FM i blått och AM i rött i var sin spalt, och den station som hörs är inringad
  // (lappNu). Det sitter där från början, och nära radion kommer det med i bilden (ram). Över raderna ligger
  // genomskinliga knappar när de är stora nog att läsa (LASBAR): ett klick går dit och sätter på radion.
  // Annars är bladet en knapp som går fram till det (SAKER.radiolapp i rum.js), och där räcker det.
  const frekvens = (k) => (BAND[k.band].steg < 1 ? k.f.toFixed(1).replace('.', ',') : String(k.f));
  // (frekvensen står redan framför namnet: Sport 890 blir Sport och RTL 102.5 blir RTL)
  const lappNamn = (k) => k.namn.split(' ').filter((o) => o.replace(',', '.') !== String(k.f)).join(' ') || k.namn;
  // en rad på bladet: frekvensen och namnet
  const rad = (k) => [frekvens(k), lappNamn(k)];
  // (så här höga måste raderna vara i bilden för att gå att läsa och träffa)
  const LASBAR = 14;
  const lapp = () => {
    const L = O.inr && O.inr() && O.inr().lapp;
    // (bladet blev klart efter att stationen hittades)
    if (L && L.sagt !== U.nu) {
      L.sagt = U.nu;
      L.nu(U.nu);
    }
    return L || null;
  };
  // Närbilden: r är rutan runt radion och m bladet, utan zoom och med rummet rakt, och topp och hojd den del
  // av fönstret som de får. Radion och bladet tillsammans, eller bara bladet (bara: SAKER.radiolapp) när
  // raderna blir för små bredvid radion. → zoomen och var radions mitt ska stå i fönstret.
  function ram(r, topp, hojd, m, bara) {
    if (!r || !m || !m.width) return null;
    const W = innerWidth;
    const kant = 12;
    const U0 = { left: Math.min(r.left, m.left), top: Math.min(r.top, m.top), right: Math.max(r.right, m.right), bottom: Math.max(r.bottom, m.bottom) };
    const passa = (q) => Math.min((W - 2 * kant) / (q.right - q.left), (hojd * 0.97) / (q.bottom - q.top));
    let q = U0;
    let z = passa(U0);
    const L = lapp();
    if (bara && z * m.height * (L ? L.rad : 1 / 33) < LASBAR) {
      q = m;
      z = passa(m);
    }
    const mitt = (x) => [(x.left + x.right) / 2, (x.top + x.bottom) / 2];
    const [rx, ry] = mitt(r);
    const [qx, qy] = mitt(q);
    return { zoom: z, x: W / 2 + (rx - qx) * z, y: topp + hojd / 2 + (ry - qy) * z };
  }
  // (när kameran är framme: knapparna över raderna, eller över hela bladet)
  function lappPlats() {
    const L = lapp();
    if (!U.rader || !L) {
      if (U.rader) U.rader.hidden = U.lapp.hidden = true;
      return;
    }
    const c = L.canvas.getBoundingClientRect();
    const ruta = (el, [l, t, h, b]) => Object.assign(el.style, { left: `${(c.left + l * c.width).toFixed(1)}px`, top: `${(c.top + t * c.height).toFixed(1)}px`, width: `${((h - l) * c.width).toFixed(1)}px`, height: `${((b - t) * c.height).toFixed(1)}px` });
    let minst = Infinity;
    for (const { id, r } of L.rader()) {
      const b = U.st[id];
      if (!b) continue;
      ruta(b, r);
      minst = Math.min(minst, (r[3] - r[1]) * c.height);
    }
    // (bladet ligger under raderna: ett tryck bredvid dem lämnar inte närbilden)
    const las = minst >= LASBAR;
    U.rader.hidden = !las;
    U.lapp.hidden = false;
    U.lapp.classList.toggle('las', las);
    U.lapp.tabIndex = las ? -1 : 0;
    U.lapp.setAttribute('aria-hidden', String(las));
    ruta(U.lapp, L.sida());
  }
  function lappNu() {
    const nu = S.band !== 'av' && A.narmast && A.s > 0.5 ? A.narmast.id : '';
    // (bladet kan ha blivit klart sedan förra gången)
    lapp();
    if (U.nu === nu) return;
    U.nu = nu;
    lapp();
    if (U.st) for (const [id, b] of Object.entries(U.st)) b.setAttribute('aria-pressed', String(id === nu));
  }

  function mount(o) {
    Object.assign(O, o);
    allt3d();
  }
  function av() {
    if (S.band === 'av') return;
    S.band = 'av';
    slapp();
    till3d({ band: 'av', lampa: 0 });
    lyssna();
    knappar();
  }
  // För bilder: 'fm:104.3' eller 'av', utan ljud.
  function prova(lage) {
    O.tyst = true;
    const [band, f] = String(lage || 'fm').split(':');
    if (BAND[band]) {
      S.band = band;
      S.sist = band;
      if (Number(f)) S.p = N.mal = pAv(band, Number(f));
    } else S.band = 'av';
    allt3d();
    lyssna();
  }
  const lage = () => ({
    band: S.band,
    spak: S.sist,
    f: S.band === 'av' ? null : fAv(S.band, S.p),
    p: S.p,
    vol: S.vol,
    kanal: A.narmast && A.s > 0.5 ? A.narmast.id : null,
    hors: Boolean(A.klar),
    laddad: A.kanal && A.kanal.id,
    s: A.s,
    gang: A.gang,
    tid: A.el ? A.el.currentTime : 0,
    ctx: A.ctx && A.ctx.state,
  });

  return { BAND, KANALER, rad, mount, nara, placera, ram, av, prova, lage, valj, kraft, bandspak, volym };
})();
