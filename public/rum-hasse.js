// Hasse Backe i tobaksaffären: han sitter i baren till vänster utanför bilden, och längst ut på
// pulten står hans kaffe vid notan (rum.js), där hans hand ligger (rum-hasse-hand.js). Ett klick på
// dem (eller H) och kameran svänger åt vänster i rummet. Där sitter han bakom bardisken, vänd mot en,
// med ena underarmen på disken och den andra längs disken över hörnet till handen på pulten
// (rum-hasse-3d.js). Kaffet, notan och handen är rummets och syns snett i hörnet till höger om honom;
// samtalet står bredvid honom (på höjden under honom).
//
// Svängen: kameran vrids i rummets egen 3D-värld (.rum-vrid runt .rum-world, samma lins som rummet),
// och baren är en vägg i samma värld som möter bakväggen i ett hörn vid rummets vänstra kant. Ögat
// glider lite fram mot hörnet medan kameran vrids, längs synlinjen genom hörnet, så att rummets plan
// rör sig mot varandra men hörnet står kvar som en rak linje. När kameran har stannat är hans vy platt.
//
// Grafiken: svängen är färdiga mellanbilder som grafikprocessen spelar upp själv, och ingenting ritas
// om på vägen. Baren är en färdig bild, disken en yta i CSS och figuren en duk som bara är så stor som
// han och det han gör. Figuren finns bara medan man tittar på honom; då står rummet still och ritas
// inte (Rum.vila), och en stund efter att man har gått lämnas figurens grafik tillbaka. På rummets
// lägre steg (Rum.kval) ritas han med färre bildpunkter och glesare när han bara sitter och andas.
//
// ?rum-hasse öppnar direkt (för bilder).
window.RumHasse = (() => {
  const DEG = Math.PI / 180;
  // rummets lins (.rum-kamera i rum.css) och bakväggens plan (rum.js, plane(-600, …, 1.035))
  const LINS = 1400;
  const BAK = 600;
  const BAK_K = ((LINS + BAK) / LINS) * 1.035;
  // svängen (ms) och mellanbilderna
  const TID = 1000;
  const BILDER = 20;
  // hur långt ögat går fram mot hörnet medan kameran vrids (rummets enheter)
  const FRAM = 170;
  // Var kameran stannar: notans högra kant (#rum-hasse i rum.css) vid NOTA av bredden, så att kaffet,
  // notan och handen syns snett i rummets hörn till höger om honom, men hörnet inte längre in än
  // HORN_MIN. På höjden ryms de inte bredvid honom: där står hörnet HORN utanför bildens högra kant.
  const NOTA = 0.96;
  const HORN_MIN = 0.6;
  const HORN = 0.07;
  // pultens plan (rum.js, plane(-60, …, 1.05)) och dess bakre kant (rum.js, table)
  const PULT_K = ((LINS + 60) / LINS) * 1.05;
  const PULT_Y = 648;
  // Hans hand på pulten (rum-hasse-hand.js): handleden i rummets mått, vid koppen nära pultens bakre
  // kant. I hans värld (rum-hasse-3d.js) ligger handleden X_W enheter till höger om honom, med armen
  // längs disken; armbågen vilar på disken bredvid honom.
  const HAND = { x: 34, y: 686 };
  const X_W = 620;
  // armen på pulten lämnar den bara i skrattet och för att dricka (rum-hasse-3d.js)
  const armUte = (T) => (T > 2.55 && T < 4.72) || (T > 20.02 && T < 24.48);
  // långsam start, och kameran bromsar länge
  const kurva = (t) => { const s = t * t * (3 - 2 * t); return 1 - (1 - s) ** 1.6; };
  const H = { on: false, rum: null, fig: null, last: null, t0: 0, T: 0, raf: 0, tal: 0, talMal: 0, ko: [], klipp: null, trum: 0 };
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
    // rummet i ett lager som kan glida undan, och baren bredvid
    const sving = document.createElement('div');
    sving.className = 'rum-sving';
    const front = document.createElement('div');
    front.className = 'rum-front';
    stage.before(sving);
    sving.append(front);
    front.append(stage);
    H.front = front;
    H.sving = sving;
    // kameran i rummets värld, och det som bara syns i svängen: taket, pultens framsida och
    // skuggan i hörnet på bakväggen
    H.world = stage.querySelector('.rum-world');
    H.vrid = document.createElement('div');
    H.vrid.className = 'rum-vrid';
    H.world.before(H.vrid);
    H.vrid.append(H.world);
    H.vrid.insertAdjacentHTML('beforeend', '<i class="rv-tak"><b></b><b></b><b></b><b></b></i><i class="rv-pult"></i><i class="rv-horn"></i>');
    const kant = 800 - 800 * BAK_K;
    H.horn = H.vrid.querySelector('.rv-horn');
    Object.assign(H.horn.style, { left: `${kant.toFixed(1)}px`, top: `${(500 - 500 * BAK_K).toFixed(1)}px`, height: `${(1000 * BAK_K).toFixed(1)}px` });
    const vy = document.createElement('div');
    vy.className = 'rum-hasse-vy';
    vy.id = 'rum-hasse-vy';
    vy.hidden = true;
    vy.setAttribute('aria-label', 'Hasse Backe');
    vy.innerHTML = '<div class="rh-scen"><img class="rh-bak" alt="" draggable="false"><i class="rh-disk"></i><i class="rh-horn" aria-hidden="true"><i class="rh-list"></i></i><i class="rh-mork"></i></div>' +
      '<i class="rh-fort tak"></i><i class="rh-fort golv"></i><canvas class="rh-duk"></canvas>' +
      '<div class="rh-samtal"></div><div class="rh-fot"><button type="button" class="rh-tillbaka">Tillbaka</button></div>';
    sving.append(vy);
    H.vy = vy;
    // det som händer i samtalet stannar där (knapparna byter ut sig själva)
    vy.querySelector('.rh-samtal').addEventListener('click', (e) => e.stopPropagation());
    // i hans vy är det han som gäller: inget når rummets svep och klick
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'mouseover', 'wheel', 'touchstart', 'touchmove']) vy.addEventListener(n, (e) => e.stopPropagation());
    vy.addEventListener('click', (e) => {
      e.stopPropagation();
      stang();
    });
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
      H.pulten = await a.armen(plan, { hand: HAND, pr: Math.min(devicePixelRatio || 1, [2, 1.5, 1.25, 1][steg()]) * 1.25 });
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
      // (är han redan byggd: armen läggs dit nu)
      if (H.v && H.fig) passa();
    } catch (e) {
      // utan three.js eller nätet: rummet står kvar som det var
    }
  }

  function bakbild() {
    return hog() ? 'rum/hasse-bak-hog.webp' : 'rum/hasse-bak.webp';
  }
  // hans bilder och figuren hämtas först när någon pekar på kaffet eller klickar
  function forladda() {
    if (!H.bilder) {
      H.bilder = [bakbild(), 'rum/hasse-atlas.webp'].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); });
      H.bilder.push(import('./rum-hasse-3d.js').then((m) => { H.m = m; }));
    }
    return H.bilder;
  }

  // Kameran när den har stannat: rummets vridning th (och på höjden lutningen fi nedåt), ögat e1 och
  // var hörnet och sakerna i rummet hamnar. I rummets enheter med ögat i vila i origo (x åt höger, y
  // nedåt, z mot betraktaren): ögat står LINS framför scenens mitt (rum.css). Hörnet är bakväggens
  // vänstra kant, där rummet slutar, och ögat går FRAM mot det längs synlinjen dit, så att allt som
  // slutar vid rummets vänstra kant står på hörnets linje hela vägen. Pk är pultens bakre kant i hörnet:
  // hans vägg går genom den, och hans disk står i samma höjd.
  function kameran() {
    const W = innerWidth;
    const m = new DOMMatrixReadOnly(getComputedStyle($('.rum-stage')).transform);
    const k = m.a || 1;
    const g = { k, cx: m.e + 800 * k, cy: m.f + 500 * k, F: LINS * k, fi: 0 };
    const C = [-800 * BAK_K, 0, -(LINS + BAK)];
    const L = Math.hypot(C[0], C[2]);
    g.u = { x: C[0] / L, z: C[2] / L };
    g.e1 = { x: g.u.x * FRAM, z: g.u.z * FRAM };
    const vinkel = (p) => Math.atan2(-(p[0] - g.e1.x), -(p[2] - g.e1.z));
    g.Pk = [g.u.x * ((LINS + 60) / -g.u.z), (PULT_Y - 500) * PULT_K, -(LINS + 60)];
    const kh = $('#rum-hasse');
    const kx = kh ? kh.offsetLeft : 0;
    const ky = kh ? kh.offsetTop : 640;
    g.kopp = [kx + 75 - 800, ky + 64 - 500, -LINS];
    g.hand = [HAND.x - 800, HAND.y - 500, -LINS];
    if (H.hog) g.th = vinkel(C) + Math.atan((W * (1 + HORN) - g.cx) / g.F);
    else g.th = Math.max(vinkel([kx + 280 - 800, 260, -LINS]) + Math.atan((NOTA * W - g.cx) / g.F), vinkel(C) + Math.atan((HORN_MIN * W - g.cx) / g.F));
    H.g = g;
    return g;
  }
  // En punkt i rummet (som ovan) i fönstret när kameran har stannat → [x, y, djup].
  function iBilden(p, g = H.g) {
    const vx = p[0] - g.e1.x;
    const vz = p[2] - g.e1.z;
    const lat = vx * Math.cos(g.th) - vz * Math.sin(g.th);
    const d0 = -vx * Math.sin(g.th) - vz * Math.cos(g.th);
    const y = p[1] * Math.cos(g.fi) - d0 * Math.sin(g.fi);
    const d = p[1] * Math.sin(g.fi) + d0 * Math.cos(g.fi);
    return [g.cx + (g.F * lat) / d, g.cy + (g.F * y) / d, d];
  }
  // En punkt i fönstret när kameran har stannat → där den ligger i planet med sakerna på pulten (plan 0),
  // i rummets mått.
  function iRummet(X, Y, g = H.g) {
    const lat = (X - g.cx) / g.F;
    const y2 = (Y - g.cy) / g.F;
    const y = y2 * Math.cos(g.fi) + Math.sin(g.fi);
    const d0 = -y2 * Math.sin(g.fi) + Math.cos(g.fi);
    const vx = lat * Math.cos(g.th) - d0 * Math.sin(g.th);
    const vz = -lat * Math.sin(g.th) - d0 * Math.cos(g.th);
    const l = (-LINS - g.e1.z) / vz;
    return [g.e1.x + l * vx + 800, l * y + 500];
  }

  // Hans storlek och plats i fönstret: ögonhöjden (cx, ey) och s bildpunkter på en enhet, var diskens
  // bakre kant står och var hörnet är. Bredvid honom står disken i samma höjd som pulten i hörnet,
  // hjässan ryms, handen ligger på pulten bortom hörnet med armen längs disken, och samtalet får en spalt
  // till vänster om honom. På höjden: han överst och samtalet under händerna, och kameran lutar så
  // mycket nedåt att pulten står i diskens höjd i hörnet.
  function matt() {
    const { MATT, BORD, iBild, KAMERA, VILA } = H.m;
    const W = innerWidth;
    const Hj = innerHeight;
    const g = kameran();
    const o = { cx: 0, ey: 0, s: 1 };
    const topp = iBild(o, ...MATT.topp)[1];
    const kant = iBild(o, 0, BORD.Y, BORD.Z)[1];
    const vans = -iBild(o, ...MATT.vanster)[0];
    const hy = KAMERA.CY - VILA.WH;
    const v = { W, H: Hj };
    let Ws = null;
    if (H.hog) {
      v.s = Math.min((0.34 * Hj) / (kant - topp), W / 1150);
      v.cx = W * 0.5;
      v.ey = Hj * 0.035 - topp * v.s;
      v.kant = iBild(v, 0, BORD.Y, BORD.Z)[1];
      // lutningen: pultens kant i hörnet i diskens höjd
      const vx = g.Pk[0] - g.e1.x;
      const vz = g.Pk[2] - g.e1.z;
      const d0 = -vx * Math.sin(g.th) - vz * Math.cos(g.th);
      const t = (v.kant - g.cy) / g.F;
      g.fi = Math.atan((g.Pk[1] - t * d0) / (d0 + t * g.Pk[1]));
      Ws = iBilden(g.hand);
    } else {
      const yk = iBilden(g.Pk)[1];
      Ws = iBilden(g.hand);
      // handleden X_W enheter till höger om honom ger var han sitter; mindre om samtalet inte får plats
      const sitt = (s) => {
        const ey = yk - kant * s;
        return { s, ey, cx: Ws[0] - (X_W * (Ws[1] - ey)) / hy };
      };
      let x = sitt(Math.min((yk - Hj * 0.05) / (kant - topp), 0.62));
      for (let i = 0; i < 30 && x.cx - vans * x.s < 360; i++) x = sitt(x.s * 0.96);
      Object.assign(v, x);
      v.kant = iBild(v, 0, BORD.Y, BORD.Z)[1];
    }
    // hörnet (hans vägg slutar där) och hans vägg genom pultens kant i hörnet
    const pk = iBilden(g.Pk);
    v.xc = pk[0];
    g.s = pk[2] / LINS;
    v.vanster = iBild(v, ...MATT.vanster)[0];
    // händerna på disken
    v.hand = iBild(v, 0, BORD.Y, 900)[1];
    // handen på pulten och rummets kopp, i hans värld: handleden i armens höjd och koppens fat på
    // disken, där de syns i bilden
    const iVarlden = (X, Y, y) => {
      const fs = (Y - v.ey) / (KAMERA.CY - y);
      return [(X - v.cx) / fs, y, H.m.D * (1 - v.s / fs)];
    };
    v.W3 = iVarlden(Ws[0], Ws[1], VILA.WH);
    const kp = iBilden(g.kopp);
    v.kopp = iVarlden(kp[0], kp[1], BORD.Y);
    v.Ws = Ws;
    // duken: det han gör ska rymmas, inom fönstret (också armen till pulten och koppen där)
    const p = [...MATT.ram(H.hog), [v.W3[0] + 260, v.W3[1] + 120, v.W3[2]], [v.kopp[0] + 120, v.kopp[1], v.kopp[2]]].map((q) => iBild(v, ...q));
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
    s.setProperty('--kant', `${v.kant.toFixed(1)}px`);
    s.setProperty('--hx', `${v.cx.toFixed(0)}px`);
    // hörnet: hans vägg slutar där, och duken också när armen ligger på pulten
    s.setProperty('--xc', `${v.xc.toFixed(1)}px`);
    s.setProperty('--horn', `${(v.W * HORN).toFixed(1)}px`);
    s.setProperty('--kant-duk', `${Math.max(0, v.x + v.w - v.xc).toFixed(1)}px`);
    // (fönstret har ändrats medan han syns: rummet står där kameran nu står)
    if (H.rum.classList.contains('hasse-framme')) H.vrid.style.transform = lage(1).rum;
    pultlage();
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
  }

  // Armen på pulten: handleden där handen i rummet ligger, armbågen på disken bredvid honom, och
  // rummets kopp. Handen i rummet får samma storlek som hans hand där och pekar mot armbågen.
  function pultlage() {
    const v = H.v;
    if (!v || !H.fig || !H.pulten) return;
    const { iBild, VILA } = H.m;
    const E = VILA.armbage;
    H.fig.pult({ W: v.W3, k: v.kopp, E });
    const fs = (v.Ws[1] - v.ey) / (H.m.KAMERA.CY - VILA.WH);
    H.pulten.stall({ skala: (fs * v.Ws[2]) / H.g.F, mot: iRummet(...iBild(v, ...E)) });
  }

  async function bygg() {
    H.hog = hog();
    H.vy.classList.toggle('hog', H.hog);
    // (handen på pulten hämtas när rummet är klart; öppnar man honom innan dess väntar armen på den)
    H.handP = H.handP || hand();
    await Promise.all([...forladda(), Promise.race([H.handP, new Promise((ok) => setTimeout(ok, 2500))])]);
    H.m = H.m || await import('./rum-hasse-3d.js');
    $('.rh-bak').src = bakbild();
    // (fönstret har vridits sedan sist: han sitter på ett annat sätt)
    if (H.fig && H.figHog !== H.hog) borta();
    if (!H.fig) {
      H.figHog = H.hog;
      H.fig = await H.m.figuren($('.rh-duk'), { hog: H.hog, latt: latt() || steg() >= 2, pr: pixlar() });
    }
    passa();
  }
  function borta() {
    H.fig.borta();
    H.fig = null;
    const c = $('.rh-duk');
    c.replaceWith(c.cloneNode(false));
  }

  // Kameran q av vägen (0 = i rummet, 1 = framme): rummet och hans vägg. Bägge vrids runt ögat, och
  // hans vägg ligger där den står när kameran har stannat (i fönstrets bildpunkter).
  function lage(q) {
    const { k, F, th, fi, s, u } = H.g;
    const rot = `rotateX(${((-fi * q) / DEG).toFixed(3)}deg) rotateY(${((-th * q) / DEG).toFixed(3)}deg)`;
    const f = FRAM * q;
    const b = FRAM * (1 - q) * k;
    return {
      // skuggan i hörnet: full redan en bit in i svängen (i vilan står den vid bildens vänstra kant)
      horn: Math.min(1, q * 4),
      rum: `${rot} translate3d(${(-u.x * f).toFixed(2)}px, 0px, ${(-u.z * f).toFixed(2)}px)`,
      vy: `${rot} translate3d(${(u.x * b).toFixed(2)}px, 0px, ${(u.z * b).toFixed(2)}px) rotateY(${(th / DEG).toFixed(3)}deg) rotateX(${(fi / DEG).toFixed(3)}deg) translateZ(${(F * (1 - s)).toFixed(2)}px) scale(${s.toFixed(5)})`,
    };
  }
  function stall(q) {
    const { cx, cy, F } = H.g;
    const l = lage(q);
    H.vrid.style.transform = l.rum;
    H.horn.style.opacity = l.horn;
    Object.assign(H.vy.style, { transform: l.vy, transformOrigin: `${cx.toFixed(2)}px ${cy.toFixed(2)}px ${F.toFixed(2)}px` });
    Object.assign(H.sving.style, { perspective: `${F.toFixed(2)}px`, perspectiveOrigin: `${cx.toFixed(2)}px ${cy.toFixed(2)}px` });
  }
  // Från fran till till: färdiga mellanbilder som grafikprocessen spelar upp själv.
  function vand(fran, till, sen) {
    const b = [];
    for (let i = 0; i <= BILDER; i++) b.push(lage(fran + (till - fran) * kurva(i / BILDER)));
    const opt = { duration: TID, easing: 'linear' };
    stall(till);
    const x = H.vy.animate(b.map((l) => ({ transform: l.vy })), opt);
    H.vrid.animate(b.map((l) => ({ transform: l.rum })), opt);
    H.horn.animate(b.map((l) => ({ opacity: l.horn })), opt);
    let klar = false;
    const slut = () => { if (!klar) { klar = true; clearTimeout(H.sv); sen(); } };
    x.finished.then(slut, slut);
    H.sv = setTimeout(slut, TID + 400);
  }
  // Framme är hans vy platt igen (samma bild), så att den är skarp och går att trycka på.
  function platt() {
    H.vy.style.transform = 'none';
    H.sving.style.perspective = '';
  }

  async function oppna() {
    if (H.on || H.oppnar || H.svanger) return;
    H.oppnar = true;
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
    Object.assign(H.world.style, { transition: 'transform 0.7s ease-out, translate 0.7s ease-out, rotate 0.7s ease-out', translate: 'none', rotate: 'none', transform: 'translateZ(-330px) rotateX(0deg) rotateY(0deg) translateZ(330px)' });
    H.fig.rita(0, performance.now() / 1000);
    H.rum.classList.add('hasse-svang');
    if (calm()) { stall(1); framme(); return; }
    H.svanger = true;
    stall(0);
    void H.vy.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => vand(0, 1, framme)));
  }

  // Framme: han börjar röra sig. Rummet står kvar vridet utanför bilden, utan att något av det
  // släpps, så att vägen tillbaka inte behöver rita om det.
  function framme() {
    H.svanger = false;
    platt();
    H.rum.classList.add('hasse-framme');
    H.last = null;
    H.t0 = performance.now();
    H.trum = H.t0 + 4000 + Math.random() * 5000;
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
      const ror = H.klipp || H.ko.length || (H.sagt && !H.sagt.klar) || H.fig.ror();
      if (ms - last < takt(ror)) return;
      const dt = last ? Math.min(0.1, (ms - last) / 1000) : 0;
      last = ms;
      figurSteg(dt);
      // Lämnar armen pulten ritar hans duk den, och dricker han tar han koppen.
      H.rum.classList.toggle('hasse-arm-ute', armUte(H.T));
      H.rum.classList.toggle('hasse-klunk', H.T > 21.1 && H.T < 24.05);
      pratSteg(ms);
      talSteg(ms);
      H.tal += (H.talMal - H.tal) * Math.min(1, dt * 12);
      H.fig.rita(H.T, ms / 1000, H.tal, H.tal);
    };
    H.raf = requestAnimationFrame(tick);
  }

  async function stang() {
    if (!H.on || H.svanger) return;
    H.on = false;
    H.fraga = null;
    cancelAnimationFrame(H.raf);
    H.klipp = null;
    H.ko.length = 0;
    // han sitter stilla med armen på disken och handen på pulten när man vänder sig bort
    H.T = 0;
    H.fig.rita(0, performance.now() / 1000);
    H.rum.classList.remove('hasse-framme', 'hasse-arm-ute', 'hasse-klunk');
    if (calm()) { hemma(); return; }
    H.svanger = true;
    stall(1);
    void H.vy.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => vand(1, 0, hemma)));
  }

  function hemma() {
    H.svanger = false;
    if (window.Rum && Rum.vila) Rum.vila(false);
    H.world.style.transition = '';
    H.vrid.style.transform = H.vy.style.transform = H.sving.style.perspective = '';
    H.rum.classList.remove('hasse-svang', 'hasse-framme');
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
  // Först artikeln och tipset som vanligt (POST …/artikel, som i matchbladet), sedan
  // hans röst (POST …/hasse, worker/hasse.mjs). Finns de redan går det direkt.
  // Tecknen kommer ur tipset. Går hans röst inte att få står analysen i skrift.
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
  const adress = (vad) => { const a = typeof state !== 'undefined' && state.meta && state.meta.analysis; return a && a.endpoint ? a.endpoint.replace(/analyze$/, vad) : null; };
  async function posta(url, id) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    return res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  }
  // Frågar om igen medan någon annan skriver.
  async function tillSvar(url, id, vem) {
    const t0 = Date.now();
    for (;;) {
      if (H.fraga !== vem) return null;
      const r = await posta(url, id);
      if (!(r.ok && r.pending) || Date.now() - t0 > 10 * 60000) return r;
      await new Promise((ok) => setTimeout(ok, 15000));
    }
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
  function minnas(lista, id, signs) {
    const m = minns(lista);
    m[id] = [...signs].sort().map((n) => KORT[n]).join('');
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

  // Rörelserna: klipp på tidslinjen i rum-hasse-3d.js. fran: var det börjar (måste
  // vara där han står, utom fri), till: var det slutar, vila: där han står sedan.
  const GEST = {
    slag: { fran: 2.5, till: 5.5, vila: 5.5, fri: true }, // armarna upp, skrattet, slaget i pulten
    armar: { fran: 5.5, till: 9.95, vila: 5.5 }, // fingret, handen som hackar, armen ut
    hem: { fran: 9.95, till: 12.4, vila: 0 }, // nöjd, ögonen igen, tillbaka
    klunk: { fran: 20, till: 24.5, vila: 0 }, // en klunk kaffe
  };
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
    H.T = Math.min(k.till, H.T + dt);
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

  // ---------- replikerna ----------
  //
  // repliker(lista, { i, sen, direkt }): han säger en replik i taget, ord för ord
  // med munnen i takt, och väntar lite innan nästa. Platsen är reserverad från
  // början, så inget flyttar sig. Ett klick (eller mellanslag) visar hela repliken,
  // nästa klick går vidare, och "Ja, ja" (hoppa) tar resten på en gång.
  //   lista: [{ text, gest?: namn i GEST, vid?(i): när repliken börjar,
  //             ny?: false = samma stycke som förra, skrift?: visas utan att sägas }]
  //   i: rutan (.rh-text om inget annat sägs), sen: när allt är sagt,
  //   direkt: allt på en gång, rad: repliken står direkt i rutan, utan stycke.
  const ORD_MS = 44;
  const ordTid = (w) => ORD_MS * (w.length + 1) + (/[,:;]$/.test(w) ? 170 : 0);
  function repliker(lista, { i: ruta = $('.rh-text'), sen = null, direkt = calm(), rad: somRad = false } = {}) {
    const x = { lista, ruta, sen, somRad, i: -1, ord: [], n: 0, tid: 0, klar: false, tyst: true, p: null, el: null };
    H.sagt = x;
    if (direkt) hoppa();
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
    if (!x || x.klar || ms < x.tid) return;
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
  // Väntar man på honom tar han en klunk kaffe då och då i stället för att prata.
  function pratSteg(ms) {
    const v = H.prat;
    if (!v || ms < v.nasta || H.klipp || H.ko.length || (H.sagt && !H.sagt.klar)) return;
    if (v.i >= v.rader.length) {
      if (!v.runt) { H.prat = null; return; }
      v.i = 0;
    }
    if (v.runt && v.i % 5 === 2 && v.drack !== v.i) {
      v.drack = v.i;
      gest('klunk');
      v.nasta = ms + 1200;
      return;
    }
    rad(v.rader[v.i++]);
    v.nasta = ms + v.gang;
  }

  // ---------- en match i taget ----------

  // En text i meningar: inte vid "J. Smith", "t.ex." eller 2,56.
  function meningar(t) {
    const delar = String(t).replace(/([.!?…]+["”»’']?)\s+(?=[\p{Lu}\d"“«])/gu, '$1\n').split('\n');
    const ut = [];
    for (const d of delar) {
      const f = ut[ut.length - 1];
      if (f && /(?:^|\s)(?:\p{Lu}|t\.ex|bl\.a|d\.v\.s|ca)\.$/u.test(f)) ut[ut.length - 1] = `${f} ${d}`;
      else if (d.trim()) ut.push(d.trim());
    }
    return ut;
  }
  // Styckena som repliker, med en gest där det passar: alltid vid de bestämda
  // orden, annars då och då vid en lång mening. Bielsa får honom att slå ut med armarna.
  const BIELSA = /rotasiones|intensid|verticalid|transisiones|presj[oó]n|ombre libre/i;
  const BESTAMT = /nej nej nej|glöm det|äsch|aldrig|varningens finger|solklart|så är det bara|köper jag/i;
  function somRepliker(stycken) {
    const ut = [];
    stycken.forEach((st) => meningar(st).forEach((text, i) => ut.push({ text, ny: i === 0 })));
    let sedan = 1;
    ut.forEach((r) => {
      sedan++;
      if (BIELSA.test(r.text)) { r.gest = 'slag'; sedan = 0; } else if (sedan >= 2 && BESTAMT.test(r.text)) { r.gest = 'armar'; sedan = 0; } else if (sedan >= 4 && r.text.length > 60) { r.gest = 'armar'; sedan = 0; }
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
      b.innerHTML = `<i>${i + 1}</i><span>${esc(m.namn)}</span>${fragat[m.id] ? `<b>${esc(fragat[m.id])}</b>` : ''}`;
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
    rad(forstaRad(lista, fragat, forst));
    const dag = spelstopp(lista);
    H.prat = lista.length && forsta ? { rader: medDag(REP().ledig, dag), i: 0, nasta: performance.now() + 24000, gang: 24000 } : null;
    klick();
  }
  function forstaRad(lista, fragat, forst) {
    const r = REP();
    if (!lista.length) return r.ingenKupong;
    const nu = Date.now();
    const oppna = lista.filter((m) => Date.parse(m.avspark) > nu);
    if (!oppna.length) return r.igang;
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

  // Finns hans text redan, så att det går direkt och inte kostar något? → true, false,
  // eller null om det inte går att få veta i tid. Ett tips äldre än TIPS_TIMMAR skrivs om
  // när man ber om analysen, och då skrivs också hans text om.
  const TIPS_TIMMAR = 24; // tip.refreshHours i config/artikel.js
  async function harSvaret(id) {
    const u = adress('hasse');
    if (!u) return null;
    try {
      const res = await fetch(`${u}?id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(800) });
      const j = res.ok ? await res.json() : null;
      if (!j || !j.ok) return null;
      return Boolean(j.hasse) && Date.now() - Date.parse(j.hasse.tips) < TIPS_TIMMAR * 3600000;
    } catch (e) {
      return null;
    }
  }

  // Du pekar ut en match och han frågar tillbaka. Först när du ber om det tas analysen
  // fram (svara), så att ett felklick varken kostar en text eller visar ett tips. Samma
  // uppställning som under analysen, så att inget flyttar sig när man går vidare.
  function valj(m, lista, klick) {
    const s = $('.rh-samtal');
    const vem = {};
    H.fraga = vem;
    H.fas = 'val';
    H.prat = null;
    H.sagt = null;
    H.talMal = 0;
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><h2 class="rh-sagt"></h2><div class="rh-text"></div>` +
      `<div class="rh-slut"><button type="button" class="rh-nasta">Analysera</button><button type="button" class="rh-ja">Jag gissar</button><a href="#match/${esc(m.id)}">Matchbladet</a></div>`;
    const slut = s.querySelector('.rh-slut');
    const ja = slut.querySelector('.rh-nasta');
    // ett dubbelklick på raden får inte landa på knappen som nu ligger under pekaren
    const t0 = performance.now();
    slut.addEventListener('click', (e) => {
      if (performance.now() - t0 >= 500) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    ja.addEventListener('click', () => svara(m, lista));
    slut.querySelector('.rh-ja').addEventListener('click', (e) => gissa(m, e));
    if (!klick.detail) ja.focus({ preventScroll: true });
    harSvaret(m.id).then((finns) => {
      if (H.fraga !== vem) return;
      const r = REP();
      rad(lott(finns === null ? r.val : finns ? r.valKlar : r.valLasa), () => {
        if (H.fraga !== vem) return;
        repliker([{ text: lott(r.fragaTillbaka) }]).tid = performance.now() + 450;
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

  async function svara(m, lista) {
    const s = $('.rh-samtal');
    const vem = {};
    const igen = H.sagda.has(m.id);
    H.fraga = vem;
    H.fas = 'tanker';
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><h2 class="rh-sagt"></h2><div class="rh-text"></div><div class="rh-slut"></div>`;
    rad(lott(igen ? REP().igen : REP().reaktion));
    const dag = spelstopp(lista);
    H.prat = { rader: medDag(REP().vantar, dag), i: 0, nasta: performance.now() + 6000, gang: 7000, runt: true };
    const t0 = Date.now();
    let art = null;
    let has = null;
    let fel = null;
    try {
      const u = adress('artikel');
      if (!u) throw new Error('Hasse är inte på plats.');
      art = await tillSvar(u, m.id, vem);
      if (H.fraga !== vem) return;
      if (!art || !art.ok || !art.article || !art.article.tip) fel = (art && art.error) || 'Analysen blev inte klar.';
      else has = await tillSvar(adress('hasse'), m.id, vem).catch(() => null);
    } catch (e) {
      fel = e.message === 'Hasse är inte på plats.' ? e.message : 'Analysen gick inte att nå.';
    }
    if (H.fraga !== vem) return;
    H.prat = null;
    await tystnat();
    if (H.fraga !== vem) return;
    if (fel) {
      rad(REP().fel);
      s.querySelector('.rh-text').innerHTML = `<p class="rh-orsak">${esc(fel)}</p>`;
      slutet(m);
      return;
    }
    // han hinner säga sitt innan han slår till
    const t = Date.now() - t0;
    if (t < 900) await new Promise((ok) => setTimeout(ok, 900 - t));
    if (H.fraga !== vem) return;
    const a = art.article;
    const egen = has && has.ok && has.hasse && has.hasse.stycken;
    const texten = egen ? somRepliker(egen)
      : [{ text: REP().utanRost }, ...[a.lead, ...a.paragraphs, a.tip.text].filter(Boolean).map((text) => ({ text: text.replace(/\s*\[\d+(?:\s*[,;]\s*\d+)*\]/g, ''), skrift: true }))];
    const signs = a.tip.signs;
    if (signs.length === 3 && egen) texten.unshift({ text: REP().helgardera });
    const om = omKupongen(m, signs);
    if (om) texten.push({ text: om });
    tala(m, lista, signs, texten, igen);
  }

  // Slaget i pulten med domen, och sedan texten medan han pratar.
  function tala(m, lista, signs, texten, igen) {
    const s = $('.rh-samtal');
    H.fas = 'dom';
    H.sagda.add(m.id);
    minnas(lista, m.id, signs);
    const nu = () => s.querySelector('.rh-text');
    // tyst när armarna går upp: sedan slaget och domen
    H.sagt = null;
    H.talMal = 0;
    s.querySelector('.rh-sagt').textContent = '';
    spela('slag', {
      vid: [4.98, () => {
        const d = domen(signs);
        s.querySelector('.rh-sagt').outerHTML = `<div class="rh-dom${d.length > 7 ? ' lang' : ''}">${esc(d)}</div>`;
        // (hela bilden rycker till, också rummet i hörnet)
        if (!calm()) { const v = H.sving; v.classList.remove('rh-slag'); void v.offsetWidth; v.classList.add('rh-slag'); }
      }],
      sen: () => {
        H.fas = 'tal';
        s.querySelector('.rh-slut').innerHTML = '<button type="button" class="rh-ja" title="Hoppa till slutet">Ja, ja</button>';
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
    s.querySelector('.rh-slut').innerHTML = `<button type="button" class="rh-nasta">Nästa match</button><a href="#match/${esc(m.id)}">Matchbladet</a>`;
    s.querySelector('.rh-nasta').addEventListener('click', fraga);
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
