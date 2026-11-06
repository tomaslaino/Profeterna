// Hasse Backe i tobaksaffären: han sitter i baren till vänster utanför bilden, och längst ut på
// pulten står hans kaffe vid notan (rum.js), där hans hand ligger (rum-hasse-hand.js). Ett klick på
// dem (eller H) och kameran slår åt vänster, till honom. Där sitter han bakom bardisken och har vridit
// sig ut mot affären och mot en, med kaffet och notan vid den vänstra handen och cigarren i askkoppen
// vid den högra (rum-hasse-3d.js). Samtalet står bredvid honom (på höjden under honom).
//
// Panoreringen: rummet och hans bild ligger bredvid varandra, med hans till vänster, och allt glider
// åt höger på 0,42 s med vågrät rörelseoskärpa, störst när bilderna byter plats; hans bild stannar
// mjukt. Tillbaka går det likadant åt andra hållet. Oskärpan ligger på ett omslag utanför rummets
// 3D-värld (.rh-pan). Hans bild är en egen värld där rummet inte syns: kameran ser snett längs baren
// (rum-hasse-scen.js), och kaffet, notan och handen på pulten i rummet är bara en ledtråd.
//
// Grafiken: panoreringen är färdiga mellanbilder som grafikprocessen spelar upp själv. Väggen bakom
// honom är en färdig bild, disken ritas en gång på en egen duk och figuren på en duk som bara är så
// stor som han och det han gör. Figuren finns bara medan man tittar på honom; då står rummet still och
// ritas inte (Rum.vila), och en stund efter att man har gått lämnas figurens grafik tillbaka. På
// rummets lägre steg (Rum.kval) ritas han med färre bildpunkter och glesare när han bara sitter och
// andas.
//
// ?rum-hasse öppnar direkt (för bilder).
window.RumHasse = (() => {
  // Panoreringen: tiden (ms), mellanbilderna, mellanrummet mellan bilderna (av bredden, rummets vägg som
  // far förbi) och oskärpan (av bredden, störst mitt i). Oskärpan är vågrät: omslaget dras ut K gånger
  // på bredden och suddas.
  const PAN = { TID: 420, BILDER: 28, GLIPA: 0.12, OSKARPA: 0.046, K: 40 };
  // fort i början, som ett ryck, och mjukt på slutet (0 → 1)
  const ryck = (t) => { const x = t ** 0.8; const k = 5.5; return 0.5 + (0.5 * Math.tanh(k * (x - 0.5))) / Math.tanh(k / 2); };
  const H = { on: false, rum: null, fig: null, last: null, t0: 0, T: 0, raf: 0, tal: 0, talMal: 0, mun: 0, munMal: null, ko: [], klipp: null, trum: 0, vanaT: 0, vana: 0 };
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hog = () => innerWidth / innerHeight < 1.15;
  const latt = () => matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const $ = (s) => H.rum.querySelector(s);
  // rummets steg (rum.js, KVAL): 0 allt, 3 det enklaste
  const steg = () => Math.max(0, Math.min(3, window.Rum && Rum.kval ? Rum.kval() : latt() ? 1 : 0));
  const pixlar = () => Math.min(devicePixelRatio || 1, [2, 1.5, 1.25, 1][steg()]);
  // minsta tid mellan bilderna (ms) när han rör sig och när han bara andas
  const takt = (ror) => (ror ? [0, 0, 33, 33] : [33, 33, 50, 66])[steg()];

  // Rummet är ledigt: ingen närbild, ingen kupong i handen.
  function ledigt() {
    if (!H.rum || H.rum.hidden || H.on) return false;
    if (H.rum.classList.contains('sak-nara') || document.getElementById('rum-handen')) return false;
    const k = document.getElementById('rum-kamera');
    return !k || !/scale\((?!1\))/.test(k.style.transform);
  }

  function mount(rum) {
    H.rum = rum;
    const stage = rum.querySelector('.rum-stage');
    // rummet och hans bild bredvid varandra i ett omslag som kan glida och suddas (panoreringen)
    const sving = document.createElement('div');
    sving.className = 'rum-sving';
    sving.innerHTML = '<div class="rh-pan"><div class="rh-pan-in"><div class="rum-front"></div><i class="rh-glipa"></i></div></div>';
    stage.before(sving);
    H.pan = sving.querySelector('.rh-pan');
    H.panIn = sving.querySelector('.rh-pan-in');
    H.front = sving.querySelector('.rum-front');
    H.glipa = sving.querySelector('.rh-glipa');
    H.front.append(stage);
    H.sving = sving;
    H.world = stage.querySelector('.rum-world');
    const vy = document.createElement('div');
    vy.className = 'rum-hasse-vy';
    vy.id = 'rum-hasse-vy';
    vy.hidden = true;
    vy.setAttribute('aria-label', 'Hasse Backe');
    vy.innerHTML = '<div class="rh-scen"><img class="rh-bak" alt="" draggable="false"><canvas class="rh-disk"></canvas><i class="rh-mork"></i></div>' +
      '<canvas class="rh-duk"></canvas><i class="rh-ton" aria-hidden="true"></i><i class="rh-korn" aria-hidden="true"></i>' +
      '<div class="rh-samtal"></div><div class="rh-fot"><button type="button" class="rh-vag rh-ljud" hidden></button><button type="button" class="rh-vag rh-tillbaka">Tillbaka</button></div>';
    H.panIn.append(vy);
    H.vy = vy;
    // det som händer i samtalet stannar där (knapparna byter ut sig själva)
    vy.querySelector('.rh-samtal').addEventListener('click', (e) => e.stopPropagation());
    // i hans vy är det han som gäller: inget når rummets svep och klick
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'mouseover', 'wheel', 'touchstart', 'touchmove']) vy.addEventListener(n, (e) => e.stopPropagation());
    vy.addEventListener('click', (e) => {
      e.stopPropagation();
      stang();
    });
    // ljudet av och på: stannar hos honom
    vy.querySelector('.rh-ljud').addEventListener('click', (e) => {
      e.stopPropagation();
      vaxla();
    });
    ljudknapp();
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!H.on) return;
      e.stopPropagation();
      if (e.key === 'Escape') stang();
    }, true);
    addEventListener('resize', () => {
      if (!H.on) return;
      // (vriden telefon: han sitter på ett annat sätt, och bygg byter figuren och bilden)
      if (hog() !== H.hog) bygg();
      else passa();
    });
    // pekar man på kaffet och notan hämtas hans bilder
    rum.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse' && e.target.closest && e.target.closest('#rum-hasse') && ledigt()) forladda(); });
    // handen läggs på pulten när rummet är klart, sist av allt
    const vanta = setInterval(() => {
      if (!rum.querySelector('canvas.rum-saker')) return;
      clearInterval(vanta);
      setTimeout(() => { H.handP = H.handP || hand(); }, 800);
    }, 400);
    if (/[?&]rum-hasse\b/.test(location.search)) setTimeout(oppna, 1500);
  }

  // Hans hand på pulten, bredvid kaffet (rum-hasse-hand.js). Den går att trycka på, och pekar man på
  // den eller på kaffet trummar han med fingrarna; då och då gör han det ändå.
  async function hand() {
    const plan = [...H.rum.querySelectorAll('.rum-world > .rum-pl')].at(-1);
    if (!plan) return;
    try {
      const a = await import('./rum-hasse-hand.js');
      H.pulten = await a.armen(plan, { hand: { x: 34, y: 686 }, kopp: { x: 268, y: 708 }, pr: Math.min(devicePixelRatio || 1, [2, 1.5, 1.25, 1][steg()]) * 1.25 });
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rum-hasse-knapp';
      b.setAttribute('aria-label', 'Hasse Backe');
      plan.append(b);
      H.pulten.knapp(b);
      b.addEventListener('click', (e) => {
        if (!ledigt()) return;
        e.stopPropagation();
        e.preventDefault();
        oppna();
      });
      const kaffe = H.rum.querySelector('#rum-hasse');
      for (const x of [kaffe, b]) if (x) x.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && ledigt()) { H.pulten.trumma(); forladda(); } });
      if (!calm()) {
        const vantan = () => {
          H.vant = setTimeout(() => {
            if (!H.on && !H.rum.hidden && !document.hidden && ledigt()) H.pulten.trumma();
            vantan();
          }, 7000 + Math.random() * 9000);
        };
        vantan();
      }
    } catch (e) {
      // utan three.js eller nätet: rummet står kvar som det var
    }
  }

  // väggen bakom honom (scripts/hasse/bak.html), med sina mått i rum-hasse-scen.js (BAK)
  const bakbild = () => (hog() ? 'rum/hasse-bak-hog.webp' : 'rum/hasse-bak.webp');
  // hans bilder och figuren hämtas först när någon pekar på kaffet eller klickar
  function forladda() {
    if (!H.bilder) {
      H.bilder = [bakbild(), 'rum/hasse-atlas.webp'].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); });
      H.bilder.push(import('./rum-hasse-3d.js').then((m) => { H.m = m; }));
    }
    return H.bilder;
  }

  // Hans storlek och plats i fönstret: s bildpunkter på en enhet på avståndet D och (cx, ey) där
  // kamerans axel träffar fönstret. Han fyller höjden från hjässan till disken, med samtalet i en spalt
  // till vänster om honom; på höjden står han överst och samtalet under händerna. Kaffet och notan till
  // höger får gärna hamna utanför bilden i smala fönster.
  function matt() {
    const { MATT, BORD, KOPP, iBild } = H.m;
    const W = innerWidth;
    const Hj = innerHeight;
    const o = { cx: 0, ey: 0, s: 1 };
    const topp = iBild(o, ...MATT.topp)[1];
    const kant = iBild(o, 0, BORD.Y, BORD.Z)[1];
    const mitt = iBild(o, 40, 0, 120)[0];
    const vans = iBild(o, ...MATT.vanster)[0];
    const v = { W, H: Hj };
    if (H.hog) {
      v.s = Math.min((0.36 * Hj) / (kant - topp), W / 1080);
      v.cx = W * 0.5 - mitt * v.s;
      v.ey = Hj * 0.03 - topp * v.s;
    } else {
      // hjässan nära överkanten och disken framför honom vid tre fjärdedelar av höjden, och mitten av
      // honom vid 60 % av bredden; mindre om samtalet inte får plats
      const sitt = (s) => ({ s, cx: W * 0.6 - mitt * s, ey: Hj * 0.05 - topp * s });
      let x = sitt((0.7 * Hj) / (kant - topp));
      for (let i = 0; i < 30 && x.cx + vans * x.s < 400; i++) x = sitt(x.s * 0.96);
      Object.assign(v, x);
    }
    v.kant = iBild(v, 0, BORD.Y, BORD.Z)[1];
    v.vanster = iBild(v, ...MATT.vanster)[0];
    // händerna, och notan framför kaffet, på disken
    v.hand = Math.max(iBild(v, 0, BORD.Y, 900)[1], iBild(v, KOPP[0] + 60, BORD.Y, KOPP[2] + 380)[1]);
    // duken: det han gör ska rymmas, inom fönstret
    const p = MATT.ram(H.hog).map((q) => iBild(v, ...q));
    v.x = Math.max(0, Math.floor(Math.min(...p.map((q) => q[0]))));
    v.y = Math.max(0, Math.floor(Math.min(...p.map((q) => q[1]))));
    v.w = Math.min(W, Math.ceil(Math.max(...p.map((q) => q[0])))) - v.x;
    v.h = Math.min(Hj, Math.ceil(Math.max(...p.map((q) => q[1])))) - v.y;
    return v;
  }

  function passa() {
    const v = matt();
    H.v = v;
    if (H.fig) H.fig.kamera(v);
    const s = H.vy.style;
    s.setProperty('--hx', `${v.cx.toFixed(0)}px`);
    // väggen: bilden från samma kamera, lagd så att den passar (scripts/hasse/bak.html)
    const b = H.m.BAK[H.hog ? 'hog' : 'bred'];
    const f = v.s / b.S;
    Object.assign($('.rh-bak').style, { left: `${(v.cx - b.px * f).toFixed(1)}px`, top: `${(v.ey - b.py * f).toFixed(1)}px`, width: `${(b.W * f).toFixed(1)}px`, height: `${(b.H * f).toFixed(1)}px` });
    // disken: ritas en gång, med väggen i lacken (medan fönstret ändras först när det har stannat)
    let disk = Promise.resolve();
    if (H.fig) {
      const bild = $('.rh-bak');
      const n = ++H.diskNr;
      const rita = () => (bild.complete ? Promise.resolve() : bild.decode()).then(() => { if (n === H.diskNr && H.fig) return H.fig.diskBild($('.rh-disk'), v, { bild, ...b }); }).catch(() => {});
      clearTimeout(H.diskT);
      if (H.on) H.diskT = setTimeout(rita, 150);
      else disk = rita();
    }
    // samtalet: på höjden under honom, annars i en spalt till vänster om honom
    const sa = $('.rh-samtal').style;
    const fo = $('.rh-fot').style;
    if (H.hog) {
      const topp = Math.min(v.hand + 10, v.H * 0.6);
      sa.top = `${topp.toFixed(0)}px`;
      sa.left = sa.width = fo.left = fo.width = '';
      s.setProperty('--mork', `${(topp - 46).toFixed(0)}px`);
    } else {
      const hoger = v.vanster - 28;
      const bredd = Math.min(hoger - 28, Math.max(340, v.W * 0.3), 620);
      const vanster = Math.max(28, (hoger - bredd) * 0.5);
      sa.top = '';
      sa.left = fo.left = `${vanster.toFixed(0)}px`;
      sa.width = fo.width = `${bredd.toFixed(0)}px`;
      s.setProperty('--mork', `${(hoger + 70).toFixed(0)}px`);
    }
    return disk;
  }

  async function bygg() {
    H.hog = hog();
    H.vy.classList.toggle('hog', H.hog);
    await Promise.all(forladda());
    H.m = H.m || await import('./rum-hasse-3d.js');
    Object.assign(GEST, H.m.KLIPP);
    $('.rh-bak').src = bakbild();
    // (fönstret har vridits sedan sist: han sitter på ett annat sätt)
    if (H.fig && H.figHog !== H.hog) borta();
    if (!H.fig) {
      H.figHog = H.hog;
      H.fig = await H.m.figuren($('.rh-duk'), { hog: H.hog, latt: latt() || steg() >= 2, pr: pixlar() });
    }
    H.vy.classList.toggle('enkel', steg() >= 1 || latt());
    // (disken hinner ritas innan kameran slår dit, men den väntar man inte länge på)
    await Promise.race([passa(), new Promise((ok) => setTimeout(ok, 1500))]);
  }
  H.diskNr = 0;
  function borta() {
    H.fig.borta();
    H.fig = null;
    const c = $('.rh-duk');
    c.replaceWith(c.cloneNode(false));
  }

  // Panoreringen till honom (till = 1) eller tillbaka (0): rummet och hans bild bredvid varandra med en
  // glipa emellan, och allt glider åt höger (åt vänster tillbaka). Oskärpan följer farten. Färdiga
  // mellanbilder som grafikprocessen spelar upp själv.
  function panorera(till, sen) {
    const W = innerWidth;
    const L = W * (1 + PAN.GLIPA);
    const n = PAN.BILDER;
    const q = (i) => { const p = ryck(i / n); return till ? p : 1 - p; };
    const fart = (i) => Math.abs(q(Math.min(n, i + 1)) - q(Math.max(0, i - 1))) * (n / (Math.min(n, i + 1) - Math.max(0, i - 1)));
    const vmax = Math.max(...Array.from({ length: n + 1 }, (_, i) => fart(i)));
    const rum = [];
    const vy = [];
    const glipa = [];
    const sudd = [];
    for (let i = 0; i <= n; i++) {
      const x = q(i) * L;
      rum.push({ transform: `translate3d(${x.toFixed(1)}px, 0, 0)` });
      vy.push({ transform: `translate3d(${(x - L).toFixed(1)}px, 0, 0)` });
      glipa.push({ transform: `translate3d(${(x - L + W).toFixed(1)}px, 0, 0)` });
      sudd.push({ filter: `blur(${((PAN.OSKARPA * W * fart(i)) / vmax / PAN.K).toFixed(3)}px)` });
    }
    const opt = { duration: PAN.TID, easing: 'linear', fill: 'forwards' };
    Object.assign(H.pan.style, { transform: `scaleX(${PAN.K})` });
    Object.assign(H.panIn.style, { transform: `scaleX(${1 / PAN.K})` });
    const x = H.front.animate(rum, opt);
    H.glipa.style.width = `${(L - W).toFixed(1)}px`;
    const anim = [x, H.vy.animate(vy, opt), H.glipa.animate(glipa, opt), H.pan.animate(sudd, opt)];
    // (?rum-hasse-pan=0.5: står still där på vägen, för bilder)
    const frys = /[?&]rum-hasse-pan=([\d.]+)/.exec(location.search);
    if (frys) { for (const a of anim) { a.pause(); a.currentTime = PAN.TID * +frys[1]; } return; }
    let klar = false;
    const slut = () => {
      if (klar) return;
      klar = true;
      clearTimeout(H.sv);
      for (const el of [H.front, H.vy, H.glipa, H.pan]) for (const a of el.getAnimations()) a.cancel();
      H.pan.style.transform = H.panIn.style.transform = '';
      sen();
    };
    x.finished.then(slut, slut);
    H.sv = setTimeout(slut, PAN.TID + 400);
  }
  // Med minskad rörelse: en kort övertoning.
  function tona(till, sen) {
    const a = H.vy.animate([{ opacity: 1 - till }, { opacity: till }], { duration: 260, easing: 'ease-out' });
    let klar = false;
    const slut = () => { if (!klar) { klar = true; clearTimeout(H.sv); sen(); } };
    a.finished.then(slut, slut);
    H.sv = setTimeout(slut, 700);
  }

  async function oppna() {
    if (H.on || H.oppnar || H.svanger) return;
    H.oppnar = true;
    vakna();
    clearTimeout(H.ner);
    try {
      H.vy.hidden = false;
      await bygg();
    } catch (e) {
      H.vy.hidden = true;
      H.oppnar = false;
      return;
    }
    fraga();
    H.on = true;
    H.oppnar = false;
    H.T = 0;
    // rummet står still medan man tittar åt hans håll, och rätar upp sig efter musen på vägen
    if (window.Rum && Rum.vila) Rum.vila(true);
    Object.assign(H.world.style, { transition: 'transform 0.2s ease-out, translate 0.2s ease-out, rotate 0.2s ease-out', translate: 'none', rotate: 'none', transform: 'translateZ(-330px) rotateX(0deg) rotateY(0deg) translateZ(330px)' });
    H.fig.rita(0, performance.now() / 1000);
    H.svanger = true;
    H.rum.classList.add('hasse-pan');
    if (calm()) { tona(1, framme); return; }
    requestAnimationFrame(() => panorera(1, framme));
  }

  // Framme: han börjar röra sig, och rummet ritas inte. Det står kvar som det var, utan att något av det
  // släpps.
  function framme() {
    H.svanger = false;
    H.rum.classList.remove('hasse-pan');
    H.rum.classList.add('hasse-framme');
    H.last = null;
    H.t0 = performance.now();
    H.trum = H.t0 + 4000 + Math.random() * 5000;
    H.vanaT = H.t0 + VANA[0] * 0.4 + Math.random() * VANA[0] * 0.3;
    loop();
  }

  function loop() {
    cancelAnimationFrame(H.raf);
    let last = 0;
    const tick = (ms) => {
      if (!H.on) return;
      // någon har lämnat rummet (bakåt i webbläsaren, en länk): direkt hem
      if (H.rum.hidden) {
        H.on = false;
        H.fraga = null;
        tystna();
        hemma();
        return;
      }
      H.raf = requestAnimationFrame(tick);
      if (!H.fig) return;
      // då och då trummar han med fingrarna medan han väntar på en
      if (ms > H.trum) {
        H.trum = ms + 7000 + Math.random() * 9000;
        if (!calm() && !H.klipp && !H.ko.length && (!H.sagt || H.sagt.klar) && ['fraga', 'val', 'klar'].includes(H.fas)) H.fig.trumma();
      }
      // och ibland njuter han av kaffet eller tar cigarren ur askkoppen, varannan gång
      if (ms > H.vanaT && !H.klipp && !H.ko.length && !H.fig.ror() && (!H.sagt || H.sagt.klar) && ['fraga', 'val', 'klar'].includes(H.fas)) {
        H.vanaT = ms + VANA[0] + Math.random() * (VANA[1] - VANA[0]);
        vana();
      }
      const ror = H.klipp || H.ko.length || (H.sagt && !H.sagt.klar) || H.fig.ror();
      if (ms - last < takt(ror)) return;
      const dt = last ? Math.min(0.1, (ms - last) / 1000) : 0;
      last = ms;
      figurSteg(dt);
      pratSteg(ms);
      talSteg(ms);
      H.tal += (H.talMal - H.tal) * Math.min(1, dt * 12);
      // munnen: ljudstyrkan när han hörs, annars följer den talet
      H.mun += ((H.munMal == null ? H.tal : H.munMal) - H.mun) * Math.min(1, dt * 30);
      H.fig.rita(H.T, ms / 1000, H.tal, H.mun);
    };
    H.raf = requestAnimationFrame(tick);
  }

  async function stang() {
    if (!H.on || H.svanger) return;
    H.on = false;
    H.fraga = null;
    tystna();
    cancelAnimationFrame(H.raf);
    H.klipp = null;
    H.ko.length = 0;
    // han sitter stilla med armarna på disken när man vänder sig bort
    H.T = 0;
    H.fig.rita(0, performance.now() / 1000);
    H.svanger = true;
    H.rum.classList.remove('hasse-framme');
    H.rum.classList.add('hasse-pan');
    if (calm()) { tona(0, hemma); return; }
    requestAnimationFrame(() => panorera(0, hemma));
  }

  function hemma() {
    H.svanger = false;
    if (window.Rum && Rum.vila) Rum.vila(false);
    H.world.style.transition = '';
    H.rum.classList.remove('hasse-pan', 'hasse-framme');
    H.vy.hidden = true;
    // figuren lämnas tillbaka efter en stund, så att den inte tar minne i onödan
    clearTimeout(H.ner);
    H.ner = setTimeout(() => { if (!H.on && H.fig) borta(); }, latt() ? 20000 : 90000);
  }

  // ---------- samtalet ----------
  //
  // Man ber honom bara analysera en match på kupongen, men det är ett samtal: han
  // frågar, man väljer en match och han frågar tillbaka. Ber man om analysen pratar
  // han medan den tas fram, slår i pulten med domen och säger texten en mening i taget. Sist säger
  // han vad han tycker om det du själv har på kupongen, och han minns vad du har
  // frågat om. Det han säger runt omkring står i rum-hasse-repliker.js.
  //
  // Allt är skrivet i förväg (scripts/analyser/skriv.mjs, data/analyser.json): artikeln,
  // tipset och hans röst. Han låtsas analysera (svara). Tecknen kommer ur tipset. Saknas
  // hans röst står analysen i skrift.
  const TECKEN = ['Etta', 'Kryss', 'Tvåa'];
  const KORT = ['1', 'X', '2'];
  function domen(signs) {
    const s = [...signs].sort();
    return s.length === 3 ? 'Helgardera.' : `${s.map((n, i) => (i ? TECKEN[n].toLowerCase() : TECKEN[n])).join(', ')}.`;
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const REP = () => window.HasseRepliker;
  const fyll = (t, o = {}) => t.replace(/\{(\w+)\}/g, (_, k) => (o[k] == null ? '' : o[k]));
  // Lottar utan att samma rad kommer två gånger innan alla har varit med.
  const pasar = new WeakMap();
  function lott(lista) {
    let p = pasar.get(lista);
    if (!p || !p.length) {
      p = [...lista].sort(() => Math.random() - 0.5);
      pasar.set(lista, p);
    }
    return p.pop();
  }

  // Kupongens matcher, i kupongens ordning.
  function kupongen() {
    const p = window.Samtal && Samtal.pult ? Samtal.pult.state() : null;
    const r = p ? p.s : typeof TP !== 'undefined' ? TP.round : null;
    if (r && r.matcher && r.matcher.length) return r.matcher.map((x) => ({ id: String(x.id), namn: x.match, avspark: x.avspark }));
    const c = typeof currentCoupon === 'function' ? currentCoupon() : null;
    const alla = (typeof state !== 'undefined' && state.all && state.all.matches) || [];
    if (c) return c.matches.map((x) => { const m = alla.find((y) => String(y.id) === String(x.id)); return m ? { id: String(x.id), namn: `${m.home} – ${m.away}`, avspark: m.kickoff } : null; }).filter(Boolean);
    return [];
  }
  // Den färdiga analysen (analysOf i app.js), eller null.
  const analysen = (id) => (typeof analysOf === 'function' ? analysOf(id) : Promise.resolve(null)).catch(() => null);
  // Modellens prognos för matchen, samma fil som matchbladet läser (data/match/<id>.json), eller null.
  const prognoser = new Map();
  function prognosen(id) {
    if (!prognoser.has(id)) {
      const p = typeof getJSON === 'function' ? getJSON(`data/match/${encodeURIComponent(id)}.json`).then((d) => (d && d.prediction) || null) : Promise.resolve(null);
      prognoser.set(id, p.catch(() => { prognoser.delete(id); return null; }));
    }
    return prognoser.get(id);
  }
  // Resultatet han säger: det troligaste i modellens resultatmatris (0–4 mål per lag) bland
  // utfallen han har ringat in, så att det aldrig går emot tecknen. Hemma–borta, eller null.
  function resultatet(p, signs) {
    const g = p && p.scores && p.scores.grid;
    if (!Array.isArray(g)) return null;
    let bast = null;
    g.forEach((rad, h) => rad.forEach((q, b) => {
      const utfall = h > b ? 0 : h === b ? 1 : 2;
      if (signs.includes(utfall) && (!bast || q > bast.q)) bast = { h, b, q };
    }));
    return bast ? `${bast.h}–${bast.b}` : null;
  }

  // Det han minns: vilka matcher du har frågat om och vad han svarade (på enheten,
  // för den här kupongen). Bara tecken du själv har bett om står på raderna.
  const MINNE = 'profeterna.hasse.fragat';
  const nyckel = (lista) => (lista.length ? `${lista[0].id}:${lista.length}` : '');
  function minns(lista) {
    try {
      const j = JSON.parse(localStorage.getItem(MINNE));
      return j && j.k === nyckel(lista) ? j.m || {} : {};
    } catch (e) { return {}; }
  }
  function minnas(lista, id, signs, res) {
    const m = minns(lista);
    m[id] = [...signs].sort().map((n) => KORT[n]).join('') + (res ? ` ${res}` : '');
    try { localStorage.setItem(MINNE, JSON.stringify({ k: nyckel(lista), m })); } catch (e) { /* då minns han det bara nu */ }
  }

  // Du, om kupongen vet vem du är: en tränare säger efternamnet.
  function dittNamn() {
    const p = window.Samtal && Samtal.pult ? Samtal.pult.state() : null;
    const g = p && p.vem && p.s.gang && p.s.gang.find((x) => x.id === p.vem);
    return g && g.namn ? g.namn.trim().split(/\s+/).pop() : '';
  }
  // När spelstoppet är: på lördag, i morgon, i dag. Tomt om det är passerat.
  function spelstopp(lista) {
    const nu = Date.now();
    const t = Math.min(...lista.map((m) => Date.parse(m.avspark)).filter((x) => x > nu));
    if (!Number.isFinite(t)) return '';
    const dag = (x) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', dateStyle: 'short' }).format(x);
    if (dag(t) === dag(nu)) return 'i dag';
    if (dag(t) === dag(nu + 86400000)) return 'i morgon';
    if (t - nu > 6 * 86400000) return '';
    return `på ${new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long' }).format(t)}`;
  }
  const medDag = (rader, dagen) => rader.filter((r) => dagen || !r.includes('{dag}')).map((r) => fyll(r, { dag: dagen }));

  // Rörelserna: klipp på tidslinjen (KLIPP i rum-hasse-3d.js, hit när figuren hämtas). fran: var det
  // börjar (måste vara där han står, utom fri), till: var det slutar, vila: där han står sedan, grupp:
  // domen, kaffet eller cigarren, och han lottar bland klippen i gruppen.
  const GEST = {};
  const GRUPP = {};
  const grupp = (g) => (GRUPP[g] = GRUPP[g] && GRUPP[g].length ? GRUPP[g] : Object.keys(GEST).filter((n) => GEST[n].grupp === g));
  const ettAv = (g, annars) => lott(grupp(g)) || annars;
  // kaffet och cigarren varannan gång, kaffet först
  function vana() {
    H.vana = (H.vana + 1) % 2;
    gest(H.vana ? ettAv('kaffe', 'klunk') : ettAv('cigarr', 'cigarr'));
  }
  // Medan han väntar på en tar han kaffet och cigarren varannan gång då och då (minst och längst i ms
  // mellan gångerna). Ska något spelas medan han håller cigarren (skynda) lägger han tillbaka den fortare.
  const VANA = [45000, 80000];
  // Måste spelas: väntar på sin tur. vid: [T, gör] när tidslinjen når T.
  function spela(namn, o = {}) {
    if (calm()) {
      if (o.vid) o.vid[1]();
      if (o.sen) o.sen();
      return;
    }
    H.ko.push({ ...GEST[namn], ...o });
  }
  // Under tiden han pratar: bara om han står still där gesten börjar.
  function gest(namn) {
    const k = GEST[namn];
    if (!k || calm() || H.klipp || H.ko.length) return;
    if (!k.fri && Math.abs(H.T - k.fran) > 0.01 && Math.abs(H.T - k.vila) > 0.01) return;
    H.ko.push({ ...k });
  }
  function figurSteg(dt) {
    if (!H.klipp) {
      if (!H.ko.length) return;
      H.klipp = H.ko.shift();
      H.T = H.klipp.fran;
    }
    const k = H.klipp;
    const T0 = H.T;
    H.T = Math.min(k.till, H.T + dt * (k.skynda && H.ko.length ? 2.5 : 1));
    // slagen i disken och koppen på fatet: bilden rycker till, och det hörs
    for (const e of H.fig.handelser(T0, H.T)) hands(e);
    if (k.vid && H.T >= k.vid[0]) {
      const f = k.vid[1];
      k.vid = null;
      f();
    }
    if (H.T >= k.till) {
      H.T = k.vila;
      H.klipp = null;
      if (k.sen) k.sen();
    }
  }

  // ---------- rösten ----------
  //
  // Det han säger hörs. Bygget tar fram ljudet till hans text och de färdiga replikerna
  // (src/rost.js) och lägger det i data/rost/ med registret data/rost.json, mening → fil.
  // Ljudet spelas med Web Audio: orden kommer i takt med ljudet och munnen följer
  // ljudstyrkan. Det hämtas medan han gör annat, analysens medan han låtsas läsa på.
  // Saknas meningen i registret, eller är ljudet inte framme i tid (r.vanta), säger han
  // den tyst i skriftens takt, som förut. Så också när ljudet är avstängt och med
  // minskad rörelse (då står allt direkt).
  const TYST = 'profeterna.hasse.tyst';
  const VANTA = 2500;
  // ljudstyrkan i steg om 10 ms, och under vilken styrka (mot den starkaste) det är tyst
  const STEG = 0.01;
  const TYSTNAD = 0.03;
  // Ljudet är av tills besökaren slår på det med knappen (det minns enheten, '0').
  const V = { ctx: null, av: true, funkar: false, reg: null, regVid: 0, rep: new Map(), spel: null };
  try { V.av = localStorage.getItem(TYST) !== '0'; } catch (e) { /* då är han tyst */ }
  const enkel = (t) => String(t).replace(/\s+/g, ' ').trim();

  // Ljud får bara börja efter ett klick eller en tangent: då väcks det.
  function vakna() {
    if (V.av) return;
    try {
      if (!V.ctx) V.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (V.ctx.state === 'suspended') Promise.resolve(V.ctx.resume()).catch(() => {});
      ljudet();
    } catch (e) {
      V.ctx = null;
    }
  }

  function ljudknapp() {
    const b = H.vy && H.vy.querySelector('.rh-ljud');
    if (!b) return;
    b.hidden = !(V.av || V.funkar);
    b.textContent = V.av ? 'Ljud på' : 'Ljud av';
  }
  function vaxla() {
    V.av = !V.av;
    try { localStorage.setItem(TYST, V.av ? '1' : '0'); } catch (e) { /* bara nu */ }
    if (V.av) tystna();
    else vakna();
    ljudknapp();
  }

  // Det som händer på disken (handelser i rum-hasse-3d.js): vid varje slag rycker hela bilden till, också
  // rummet i hörnet, mer ju hårdare han slår, och när ljudet är på hörs handen i disken och koppen som
  // klirrar på fatet (rum-hasse-ljud.js, hämtas när ljudet slås på).
  const ljudet = () => (V.fx = V.fx || import('./rum-hasse-ljud.js').catch(() => { V.fx = null; return null; }));
  function hands(e) {
    if (calm()) return;
    if (e.typ === 'dunk') {
      const v = H.sving;
      v.style.setProperty('--slag', `${(9 * Math.min(1.5, e.styrka)).toFixed(1)}px`);
      v.classList.remove('rh-slag');
      void v.offsetWidth;
      v.classList.add('rh-slag');
    }
    if (V.av || !V.ctx || V.ctx.state !== 'running') return;
    ljudet().then((m) => { if (m && !V.av && V.ctx) m.spela(V.ctx, e); });
  }

  // Registret, högst var femte minut (som analyserna).
  function registret() {
    if (!V.reg || Date.now() - V.regVid > 5 * 60000) {
      V.regVid = Date.now();
      V.reg = fetch('data/rost.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.filer) || {}).catch(() => ({}));
    }
    return V.reg;
  }

  // Klippet: ljudet, styrkan i steg om STEG och var talet börjar och slutar (s). null om
  // det är tyst.
  function klipp(buf) {
    const d = buf.getChannelData(0);
    const w = Math.max(1, Math.round(buf.sampleRate * STEG));
    const n = Math.floor(d.length / w);
    const env = new Float32Array(n);
    let max = 0;
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = i * w; j < (i + 1) * w; j++) s += d[j] * d[j];
      env[i] = Math.sqrt(s / w);
      if (env[i] > max) max = env[i];
    }
    if (!max) return null;
    for (let i = 0; i < n; i++) env[i] /= max;
    let a = 0;
    while (a < n && env[a] < TYSTNAD) a++;
    let b = n;
    while (b > a && env[b - 1] < TYSTNAD) b--;
    return b > a ? { buf, env, fran: a * STEG, till: b * STEG } : null;
  }
  async function avkoda(data) {
    const buf = await new Promise((ok, nej) => V.ctx.decodeAudioData(data, ok, nej));
    const k = klipp(buf);
    if (k && !V.funkar) {
      V.funkar = true;
      ljudknapp();
    }
    return k;
  }
  // Ljudet till en mening → Promise<klipp | null>, eller null om han inte hörs.
  function ljudTill(text) {
    if (V.av || !V.ctx) return null;
    const t = enkel(text);
    let p = V.rep.get(t);
    if (!p) {
      p = registret().then((filer) => {
        const h = filer[t];
        if (!h) return null;
        return fetch(`data/rost/${h}.mp3`).then((res) => (res.ok ? res.arrayBuffer() : null)).then((data) => data && avkoda(data));
      }).catch(() => null);
      V.rep.set(t, p);
      p.then((k) => { if (!k) V.rep.delete(t); });
      if (V.rep.size > 80) V.rep.delete(V.rep.keys().next().value);
    }
    return p;
  }
  // Repliken får sitt ljud: r.klippet är klippet när det är framme, false om det inte kommer.
  function medLjud(r, p, vanta = VANTA) {
    r.klipp = p || null;
    r.vanta = vanta;
    if (p) p.then((k) => { r.klippet = k || false; }, () => { r.klippet = false; });
  }

  // Repliken börjar höras. Orden får sin tid efter längden, som i skriften, utspridd
  // över talet i klippet.
  function borja(x, k) {
    const c = V.ctx;
    const src = c.createBufferSource();
    src.buffer = k.buf;
    src.connect(c.destination);
    const fran = Math.max(0, k.fran - 0.03);
    const till = Math.min(k.buf.duration, k.till + 0.08);
    const t0 = c.currentTime + 0.03;
    src.start(t0, fran, till - fran);
    const vikt = x.ord.map((o) => ordTid(o.textContent));
    const sum = vikt.reduce((s, v) => s + v, 0) || 1;
    let acc = 0;
    const tider = vikt.map((v) => { const t = k.fran + (acc / sum) * (k.till - k.fran); acc += v; return t; });
    const l = { src, t0, fran, till, k, tider, slut: false };
    src.onended = () => { l.slut = true; };
    x.ljud = l;
    V.spel = l;
  }
  function ljudSteg(x, ms) {
    const l = x.ljud;
    const p = l.fran + (V.ctx.currentTime - l.t0);
    while (x.n < x.ord.length && p >= l.tider[x.n]) x.ord[x.n++].classList.add('s');
    H.talMal = 1;
    H.munMal = p < l.fran ? 0 : Math.min(1, Math.max(0, ((l.k.env[Math.floor(p / STEG)] || 0) - TYSTNAD) / 0.4));
    if (p < l.till && !l.slut) return;
    while (x.n < x.ord.length) x.ord[x.n++].classList.add('s');
    x.ljud = null;
    V.spel = null;
    H.munMal = null;
    x.tyst = true;
    H.talMal = 0;
    x.tid = ms + pausEfter(x);
  }
  // Ljudet som hörs tystnar, och repliken går vidare i skriftens takt.
  function tystna() {
    const l = V.spel;
    V.spel = null;
    H.munMal = null;
    if (l) {
      l.src.onended = null;
      try { l.src.stop(); } catch (e) { /* redan slut */ }
    }
    const x = H.sagt;
    if (x) {
      x.vanta = 0;
      if (x.ljud) {
        x.ljud = null;
        x.tid = performance.now();
      }
    }
  }

  // ---------- replikerna ----------
  //
  // repliker(lista, { i, sen, direkt }): han säger en replik i taget, ord för ord
  // med munnen i takt, och väntar lite innan nästa. Platsen är reserverad från
  // början, så inget flyttar sig. Ett klick (eller mellanslag) visar hela repliken,
  // nästa klick går vidare, och "Ja, ja" (hoppa) tar resten på en gång. Repliken hörs
  // (rösten ovan): ljudet hämtas direkt, om det inte redan är givet (medLjud).
  //   lista: [{ text, gest?: namn i GEST, vid?(i): när repliken börjar,
  //             ny?: false = samma stycke som förra, skrift?: visas utan att sägas }]
  //   i: rutan (.rh-text om inget annat sägs), sen: när allt är sagt,
  //   direkt: allt på en gång, rad: repliken står direkt i rutan, utan stycke.
  const ORD_MS = 44;
  const ordTid = (w) => ORD_MS * (w.length + 1) + (/[,:;]$/.test(w) ? 170 : 0);
  function repliker(lista, { i: ruta = $('.rh-text'), sen = null, direkt = calm(), rad: somRad = false } = {}) {
    tystna();
    const x = { lista, ruta, sen, somRad, i: -1, ord: [], n: 0, tid: 0, klar: false, tyst: true, p: null, el: null, ljud: null, vanta: 0 };
    H.sagt = x;
    if (direkt) hoppa();
    else for (const r of lista) if (!('klipp' in r) && !r.skrift) medLjud(r, ljudTill(r.text));
    return x;
  }
  function ordI(el, text) {
    return text.split(/\s+/).filter(Boolean).map((w, i) => {
      if (i) el.append(' ');
      const o = document.createElement('span');
      o.className = 'rh-o';
      o.textContent = w;
      el.append(o);
      return o;
    });
  }
  function pausEfter(x) {
    const r = x.lista[x.i];
    const n = x.lista[x.i + 1];
    if (!n) return 250;
    if (n.ny !== false) return 850;
    // en paus innan poängen
    return n.text.length < 30 || /…$/.test(r.text) ? 800 : 400;
  }
  function nastaReplik(x, ms, tyst = false) {
    if (x.el) x.el.classList.remove('nu');
    x.i++;
    if (x.i >= x.lista.length) {
      x.klar = true;
      H.talMal = 0;
      x.ruta.classList.add('rh-klar');
      if (x.sen) x.sen();
      return;
    }
    const r = x.lista[x.i];
    const nere = x.ruta.scrollHeight - x.ruta.scrollTop - x.ruta.clientHeight < 40;
    if (x.somRad) x.ruta.textContent = '';
    else if (r.ny !== false || !x.p) {
      x.p = document.createElement('p');
      x.ruta.append(x.p);
    } else x.p.append(' ');
    const el = document.createElement('span');
    el.className = 'rh-rep nu';
    (x.somRad ? x.ruta : x.p).append(el);
    x.el = el;
    x.ord = ordI(el, r.text);
    x.n = 0;
    x.tyst = false;
    x.tid = ms;
    // väntar på ljudet en stund innan han börjar
    x.vanta = !tyst && !r.skrift && r.klipp ? ms + (r.vanta || VANTA) : 0;
    // följer med om man inte själv har rullat tillbaka
    if (nere && !r.skrift) x.ruta.scrollTop = x.ruta.scrollHeight;
    if (r.vid) r.vid(x.i);
    if (r.skrift) {
      x.ord.forEach((o) => o.classList.add('s'));
      x.n = x.ord.length;
      x.tyst = true;
    } else if (!tyst && r.gest) gest(r.gest);
  }
  function talSteg(ms) {
    const x = H.sagt;
    if (!x || x.klar) return;
    if (x.ljud) {
      ljudSteg(x, ms);
      return;
    }
    if (ms < x.tid) return;
    if (x.vanta) {
      const r = x.lista[x.i];
      if (r.klippet && !V.av && V.ctx && V.ctx.state === 'running') {
        x.vanta = 0;
        borja(x, r.klippet);
        return;
      }
      if (r.klippet === false || V.av || ms > x.vanta) x.vanta = 0;
      else return;
    }
    if (x.n < x.ord.length) {
      const o = x.ord[x.n++];
      o.classList.add('s');
      H.talMal = 1;
      x.tid = ms + ordTid(o.textContent);
      return;
    }
    if (!x.tyst && x.i >= 0) {
      x.tyst = true;
      H.talMal = 0;
      x.tid = ms + pausEfter(x);
      return;
    }
    nastaReplik(x, ms);
  }
  function framat() {
    const x = H.sagt;
    if (!x || x.klar) return;
    vakna();
    tystna();
    const nu = performance.now();
    if (x.n < x.ord.length) {
      while (x.n < x.ord.length) x.ord[x.n++].classList.add('s');
      H.talMal = 0;
      x.tyst = true;
      // tid att läsa det man hoppade fram till
      x.tid = nu + Math.max(pausEfter(x), x.el.textContent.length * 22);
      return;
    }
    nastaReplik(x, nu);
  }
  function hoppa() {
    const x = H.sagt;
    if (!x) return;
    tystna();
    const nu = performance.now();
    while (!x.klar) {
      while (x.n < x.ord.length) x.ord[x.n++].classList.add('s');
      x.tyst = true;
      nastaReplik(x, nu, true);
    }
    H.talMal = 0;
  }
  // En rad överst: frågan, eller det han säger medan han tänker.
  const rad = (text, sen) => repliker([{ text }], { i: $('.rh-sagt'), sen, rad: true, direkt: calm() });
  // → när han har tystnat
  const tystnat = () => new Promise((ok) => {
    const x = H.sagt;
    if (!x || x.klar) { ok(); return; }
    const f = x.sen;
    x.sen = () => { if (f) f(); ok(); };
  });
  // Rader som kommer med jämna mellanrum: medan man väntar på honom, eller han på en.
  // Väntar man på honom tar han en klunk kaffe då och då i stället för att prata, eller cigarren.
  function pratSteg(ms) {
    const v = H.prat;
    if (!v || ms < v.nasta || H.klipp || H.ko.length || (H.sagt && !H.sagt.klar)) return;
    if (v.i >= v.rader.length) {
      if (!v.runt) { H.prat = null; return; }
      v.i = 0;
    }
    if (v.runt && v.i % 5 === 2 && v.drack !== v.i) {
      v.drack = v.i;
      vana();
      v.nasta = ms + 1200;
      return;
    }
    rad(v.rader[v.i++]);
    v.nasta = ms + v.gang;
  }

  // ---------- en match i taget ----------

  // En text i meningar: inte vid "J. Smith", "t.ex." eller 2,56.
  // (rum-hasse-meningar.js: samma delning som när Macen tar fram ljudet)
  const meningar = (t) => window.HasseMeningar(t);
  // Styckena som repliker, med en gest där det passar: alltid vid de bestämda
  // orden (fingret och armarna, handen i disken eller en annan gest), annars då och då vid en
  // lång mening. Bielsa får honom att slå ut med armarna.
  const BIELSA = /rotasiones|intensid|verticalid|transisiones|presj[oó]n|ombre libre/i;
  const BESTAMT = /nej nej nej|glöm det|äsch|aldrig|varningens finger|solklart|så är det bara|köper jag/i;
  const FINGRET = /nej nej nej|varningens finger/i;
  // Gesterna medan han pratar (gruppen tal i KLIPP) lottas, utom att vissa ord ibland har sin egen:
  // han räknar till två, lägger handen på bröstet när han själv tycker något och lugnar med händerna.
  const ORDGEST = [
    [/\btvå\b|\bdels\b|för det andra/i, 'tva'],
    [/\b(tror|säger|vet|köper|lovar) jag\b|\bjag (tror|säger|vet|lovar)\b/i, 'brost'],
    [/\blugn|organis|kontroll|ordning/i, 'lugnt'],
  ];
  function talGest(text) {
    const o = ORDGEST.find(([re]) => re.test(text));
    return o && GEST[o[1]] && Math.random() < 0.6 ? o[1] : ettAv('tal', 'armar');
  }
  function somRepliker(stycken) {
    const ut = [];
    stycken.forEach((st) => meningar(st).forEach((text, i) => ut.push({ text, ny: i === 0 })));
    let sedan = 1;
    ut.forEach((r) => {
      sedan++;
      if (BIELSA.test(r.text)) { r.gest = 'slag'; sedan = 0; } else if (sedan >= 2 && BESTAMT.test(r.text)) { r.gest = FINGRET.test(r.text) ? 'armar' : Math.random() < 0.4 ? 'dunka' : talGest(r.text); sedan = 0; } else if (sedan >= 3 && r.text.length > 50) { r.gest = talGest(r.text); sedan = 0; }
    });
    return ut;
  }
  // Vad han säger om det du har på kupongen. null om du inte har någon att tala om.
  const ORD = { 1: 'etta', X: 'kryss', 2: 'tvåa' };
  const iOrd = (t) => (t.length === 3 ? 'helgardering' : t.map((c) => ORD[c]).join(' och '));
  function omKupongen(m, signs) {
    const p = window.Samtal && Samtal.pult ? Samtal.pult.state() : null;
    if (!p || !p.s) return null;
    const k = REP().kupong;
    const du = String(p.tecken[m.id] || '').split('');
    const han = signs.map((n) => KORT[n]);
    if (!du.length) return p.fyll ? lott(k.tom) : null;
    const bada = du.filter((c) => han.includes(c));
    const sort = (a) => [...a].sort((x, y) => KORT.indexOf(x) - KORT.indexOf(y));
    const o = { du: iOrd(sort(du)), Bada: iOrd(sort(bada)).replace(/^./, (c) => c.toUpperCase()) };
    if (!bada.length) return fyll(lott(k.skilda), o);
    if (bada.length === du.length && bada.length === han.length) return lott(k.samma);
    if (bada.length === du.length) return fyll(lott(k.farre), o);
    if (bada.length === han.length) return fyll(lott(k.fler), o);
    return fyll(lott(k.korsar), o);
  }

  // Han frågar. Första gången eller när man kommer igen; annars nästa match.
  function fraga() {
    const s = $('.rh-samtal');
    const forst = !H.on;
    if (forst) {
      H.klipp = null;
      H.ko = [];
      H.sagda = H.sagda || new Set();
      H.tal = 0;
      H.talMal = 0;
      H.mun = 0;
      H.munMal = null;
      H.T = 0;
    }
    H.fraga = {};
    H.fas = 'fraga';
    H.prat = null;
    const lista = kupongen();
    const fragat = minns(lista);
    const nu = Date.now();
    s.innerHTML = '<h2 class="rh-sagt"></h2><div class="rh-lista"></div>';
    const l = s.querySelector('.rh-lista');
    let forsta = null;
    lista.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<i>${i + 1}</i><span>${esc(m.namn)}</span>${hansTips(fragat[m.id])}`;
      b.disabled = Date.parse(m.avspark) <= nu;
      b.dataset.id = m.id;
      // har du redan fått svaret finns inget att ta ställning till: tecknen står på raden
      b.addEventListener('click', (e) => {
        H.listaTopp = l.scrollTop;
        if (fragat[m.id]) svara(m, lista);
        else valj(m, lista, e);
      });
      l.append(b);
      if (!forsta && !b.disabled && !fragat[m.id]) forsta = b;
    });
    // nästa match man inte har frågat om syns utan att man rullar
    if (forsta) l.scrollTop = Math.max(0, forsta.offsetTop - l.offsetTop - 40);
    const forstaText = forstaRad(lista, fragat, forst);
    if (forstaText) rad(forstaText);
    const dag = spelstopp(lista);
    H.prat = lista.length && forsta ? { rader: medDag(REP().ledig, dag), i: 0, nasta: performance.now() + 24000, gang: 24000 } : null;
    klick();
  }
  // Det han sa om matchen, på dess rad: rutorna 1 X 2 som på kupongen med hans tecken ifyllda,
  // och resultatet. Rutorna och resultatet har fast bredd och strecket i resultatet står mitt i
  // sin spalt (siffrorna är olika breda i Fraunces), så att allt står i raka spalter.
  function hansTips(minne) {
    const [tecken, res] = String(minne || '').split(' ');
    if (!tecken) return '';
    const rutor = KORT.map((k) => `<em${tecken.includes(k) ? ' class="pa"' : ''}>${k}</em>`).join('');
    const [h, b] = String(res || '').split('–');
    const mal = b === undefined ? '' : `<i>${esc(h)}</i>–<i>${esc(b)}</i>`;
    return `<b class="rh-tips"><span class="rh-vh">${esc(tecken)}</span><span class="rh-rutor" aria-hidden="true">${rutor}</span><small>${mal}</small></b>`;
  }
  function forstaRad(lista, fragat, forst) {
    const r = REP();
    if (!lista.length) return r.ingenKupong;
    const nu = Date.now();
    const oppna = lista.filter((m) => Date.parse(m.avspark) > nu);
    // när alla matcher har börjat säger han inget
    if (!oppna.length) return null;
    const n = lista.filter((m) => fragat[m.id]).length;
    const namn = dittNamn();
    if (forst) {
      if (n && n === oppna.length) return r.allaIgen;
      if (n) return fyll(lott(namn ? r.tillbakaNamn : r.tillbaka), { namn });
      return fyll(lott(namn ? r.oppningNamn : r.oppning), { namn });
    }
    if (n >= oppna.length) return r.alla;
    if (oppna.length - n === 1) return r.enKvar;
    if (n === Math.ceil(oppna.length / 2)) return r.halva;
    return r.antal[n] || lott(r.nasta);
  }

  // Du pekar ut en match och han frågar tillbaka. Först när du ber om det kommer analysen
  // (svara), så att ett felklick inte visar ett tips. Matchen och det han säger står där de
  // står under analysen. Dina svar står direkt under hans fråga, som har sin plats från
  // början (osynlig tills han säger den), så att de inte flyttar sig.
  function valj(m, lista, klick) {
    const s = $('.rh-samtal');
    const vem = {};
    const r = REP();
    const fragan = lott(r.fragaTillbaka);
    H.fraga = vem;
    H.fas = 'val';
    H.prat = null;
    vakna();
    tystna();
    H.sagt = null;
    H.talMal = 0;
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><h2 class="rh-sagt"></h2><p class="rh-fragan"><span class="rh-o">${esc(fragan)}</span></p>` +
      `<div class="rh-svar"><div><button type="button" class="rh-knapp huvud">${esc(lott(r.lar))}</button><button type="button" class="rh-knapp rh-gissa">Jag gissar</button></div>` +
      `<a class="rh-vag" href="#match/${esc(m.id)}">Matchbladet</a></div>`;
    const svar = s.querySelector('.rh-svar');
    const ja = svar.querySelector('.huvud');
    // ett dubbelklick på raden får inte landa på knappen som nu ligger under pekaren
    const t0 = performance.now();
    svar.addEventListener('click', (e) => {
      if (performance.now() - t0 >= 500) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    ja.addEventListener('click', () => svara(m, lista));
    svar.querySelector('.rh-gissa').addEventListener('click', (e) => gissa(m, e));
    if (!klick.detail) ja.focus({ preventScroll: true });
    analysen(m.id).then((a) => {
      if (H.fraga !== vem) return;
      rad(lott(H.sagda.has(m.id) ? r.valKlar : a ? r.valLasa : r.val), () => {
        if (H.fraga !== vem) return;
        repliker([{ text: fragan }], { i: s.querySelector('.rh-fragan'), rad: true }).tid = performance.now() + 450;
      });
    });
  }
  // Du gissar själv: tillbaka till listan, där du var.
  function gissa(m, e) {
    fraga();
    const l = $('.rh-lista');
    l.scrollTop = H.listaTopp || 0;
    rad(lott(REP().gissar));
    if (!e.detail) {
      const b = [...l.children].find((x) => x.dataset.id === m.id);
      if (b) b.focus({ preventScroll: true });
    }
  }

  // Analysen är redan skriven, men han låtsas: första gången du frågar om en match pratar
  // han och tar en klunk kaffe en stund innan han slår till (minst och längst i ms).
  const LATSAS = [15000, 25000];
  async function svara(m, lista) {
    const s = $('.rh-samtal');
    const vem = {};
    const igen = H.sagda.has(m.id);
    vakna();
    H.fraga = vem;
    H.fas = 'tanker';
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><h2 class="rh-sagt"></h2><div class="rh-text"></div><div class="rh-slut"></div>`;
    rad(lott(igen ? REP().igen : REP().reaktion));
    const dag = spelstopp(lista);
    const t0 = Date.now();
    const prog = prognosen(m.id);
    const a = await analysen(m.id);
    if (H.fraga !== vem) return;
    if (!a || !a.tip) {
      await tystnat();
      if (H.fraga !== vem) return;
      rad(lott(REP().ejKlar));
      slutet(m);
      return;
    }
    if (!igen && !calm()) {
      // hans text hämtas medan han låtsas läsa på
      if (a.hasse && a.hasse.stycken) for (const st of a.hasse.stycken) for (const t of meningar(st)) ljudTill(t);
      H.prat = { rader: medDag(REP().vantar, dag), i: 0, nasta: performance.now() + 6000, gang: 7000, runt: true };
      await new Promise((ok) => setTimeout(ok, LATSAS[0] + Math.random() * (LATSAS[1] - LATSAS[0])));
      if (H.fraga !== vem) return;
    }
    H.prat = null;
    await tystnat();
    if (H.fraga !== vem) return;
    // han hinner säga sitt innan han slår till
    const t = Date.now() - t0;
    if (t < 900) await new Promise((ok) => setTimeout(ok, 900 - t));
    if (H.fraga !== vem) return;
    const egen = a.hasse && a.hasse.stycken;
    const texten = egen ? somRepliker(egen)
      : [{ text: REP().utanRost }, ...[a.lead, ...a.paragraphs, a.tip.text].filter(Boolean).map((text) => ({ text: text.replace(/\s*\[\d+(?:\s*[,;]\s*\d+)*\]/g, ''), skrift: true }))];
    const signs = a.tip.signs;
    if (signs.length === 3 && egen) texten.unshift({ text: REP().helgardera });
    // sist resultatet, och efter det vad han tycker om din kupong
    const res = resultatet(await prog, signs);
    if (H.fraga !== vem) return;
    if (res) texten.push({ text: fyll(lott(REP().resultat), { res }) });
    const om = omKupongen(m, signs);
    if (om) texten.push({ text: om });
    tala(m, lista, signs, res, texten, igen);
  }

  // Slaget i pulten med domen, och sedan texten medan han pratar.
  function tala(m, lista, signs, res, texten, igen) {
    const s = $('.rh-samtal');
    H.fas = 'dom';
    H.sagda.add(m.id);
    minnas(lista, m.id, signs, res);
    const nu = () => s.querySelector('.rh-text');
    // tyst när armarna går upp: sedan slaget och domen
    tystna();
    H.sagt = null;
    H.talMal = 0;
    s.querySelector('.rh-sagt').textContent = '';
    // han slår domen i disken, på ett av sina sätt
    const slag = ettAv('dom', 'slag');
    spela(slag, {
      vid: [(GEST[slag] ? GEST[slag].dom : 5) - 0.02, () => {
        const d = domen(signs);
        s.querySelector('.rh-sagt').outerHTML = `<div class="rh-dom${d.length > 7 ? ' lang' : ''}">${esc(d)}</div>`;
      }],
      sen: () => {
        H.fas = 'tal';
        s.querySelector('.rh-slut').innerHTML = '<button type="button" class="rh-vag rh-ja" title="Hoppa till slutet">Ja, ja</button>';
        let x = null;
        s.querySelector('.rh-ja').addEventListener('click', () => {
          x.sen = null;
          hoppa();
          repliker([{ text: lott(REP().avbruten) }], { i: nu(), sen: () => slutet(m) });
        });
        x = repliker(texten, { i: nu(), sen: () => slutet(m), direkt: igen || calm() });
      },
    });
  }
  function slutet(m) {
    const s = $('.rh-samtal');
    H.fas = 'klar';
    if (Math.abs(H.T - GEST.hem.vila) > 0.01 || H.klipp) spela('hem');
    s.querySelector('.rh-slut').innerHTML = `<button type="button" class="rh-knapp huvud">Nästa match</button><a class="rh-vag" href="#match/${esc(m.id)}">Matchbladet</a>`;
    s.querySelector('.rh-slut .huvud').addEventListener('click', fraga);
  }

  // Under en match går ett klick var som helst framåt, och Tillbaka eller Esc går
  // härifrån; vid matchlistan går ett klick utanför härifrån, som förut.
  function klick() {
    if (H.klickar) return;
    H.klickar = true;
    H.vy.addEventListener('click', (e) => {
      if (H.fas === 'fraga' || e.target.closest('a, button')) return;
      e.stopImmediatePropagation();
      framat();
    }, true);
    document.addEventListener('keydown', (e) => {
      if (!H.on || H.fas === 'fraga' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (![' ', 'Enter', 'ArrowRight'].includes(e.key) || (document.activeElement && document.activeElement.closest('a, button'))) return;
      e.preventDefault();
      framat();
    }, true);
  }

  // tobaksaffären byggs när den visas första gången
  function vanta() {
    const r = document.getElementById('rum-section');
    if (r) { mount(r); return; }
    const o = new MutationObserver(() => {
      const x = document.getElementById('rum-section');
      if (x) { o.disconnect(); mount(x); }
    });
    o.observe(document.querySelector('main') || document.body, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vanta);
  else vanta();

  return { oppna, stang, repliker, framat, hoppa, gester: GEST };
})();
