// Hasse Backe i tobaksaffären: en arm på pulten bredvid hans kaffe (rum.js), han
// står precis utanför bilden. Ett klick (eller H) och kameran svänger åt vänster,
// och där står han (rum-hasse-3d.js).
//
// Det är bara kameran som rör sig, och den rör sig inne i rummets egen 3D-värld: samma
// lins som rummet (perspektivet 1400 i rum.css), och rummets plan står kvar på sina djup,
// så att pulten far förbi fortare än gänget och gänget fortare än fönstret. Kameran vrids
// runt ögat medan ögat går i en liten båge åt vänster (OGA) och huvudet lutar en aning. Hans vägg är ett plan i samma värld
// som möter bakväggen i ett riktigt hörn, under samma tak; han och disken står närmare, och
// disken slutar där pulten slutar. Handen, kaffet och notan ligger kvar på pulten hela vägen,
// hans arm går dit, och när kameran har stannat syns de kvar vid bildens högra kant (på
// höjden är de just utanför).
//
// Vilan kostar inget: omslagen (.rum-vrid, .rh-vagg) saknar omvandling tills kameran svänger,
// och svängen är färdiga animeringar av lager som redan finns: grafikprocessen spelar upp dem
// själv, och ingen duk ritas om.
// Under svängen och medan han syns står rummet still (Rum.vila): gänget och sakerna ritas
// inte. Det ligger kvar, så att inget behöver ritas om på vägen tillbaka, och när man har
// gått tillbaka en stund lämnas figurens grafik tillbaka.
//
// ?rum-hasse öppnar direkt (för bilder).
window.RumHasse = (() => {
  const DEG = Math.PI / 180;
  // rummets lins (.rum-kamera i rum.css), i scenens enheter (1600 × 1000)
  const LINS = 1400;
  // Svängen: hur långt ögat går åt sidan, framåt och nedåt mitt på vägen, och hur långt det har
  // backat när kameran har stannat (längs synlinjen genom hörnet, så att hörnet och pultens
  // slut står på samma lodräta linje och handen ryms i bild); hur mycket huvudet lutar och
  // tittar upp mitt på vägen (grader).
  const OGA = { x: -300, z: -110, y: 8 };
  const BACK = 70;
  const LUT = 1.1;
  const NICK = 1.2;
  const TID = 1100;
  const BILDER = 22;
  // långsam start, och kameran bromsar länge
  const kurva = (t) => { const s = t * t * (3 - 2 * t); return 1 - (1 - s) ** 2; };
  const bage = (q) => Math.sin(Math.PI * q);
  // bakväggens plan (rum.js, plane) och hur stor del av bilden till höger om hörnet som är
  // rummet när kameran har stannat
  const BAK = 600;
  const SKUGGA = 110;
  const KANT = 0.165;
  // armen på pulten lämnar den bara i skrattet och för att dricka (rum-hasse-3d.js)
  const armUte = (T) => (T > 2.55 && T < 4.72) || (T > 20.02 && T < 24.48);
  const H = { on: false, rum: null, fig: null, last: null, t0: 0, T: 0, raf: 0, vant: 0, tal: 0, talMal: 0, ko: [], klipp: null };
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hog = () => innerWidth / innerHeight < 1.15;
  const latt = () => matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const smal = () => innerWidth < 600 && innerHeight > innerWidth;
  const $ = (s) => H.rum.querySelector(s);

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
    const sving = document.createElement('div');
    sving.className = 'rum-sving';
    const front = document.createElement('div');
    front.className = 'rum-front';
    stage.before(sving);
    sving.append(front);
    front.append(stage);
    H.front = front;
    // kameran i rummets värld, och rummets tak och pultens framsida, som bara syns i svängen
    const world = stage.querySelector('.rum-world');
    H.world = world;
    H.vrid = document.createElement('div');
    H.vrid.className = 'rum-vrid';
    world.before(H.vrid);
    H.vrid.append(world);
    H.vrid.insertAdjacentHTML('beforeend', `<i class="rv-tak">${'<b></b>'.repeat(5)}</i><i class="rv-pult"></i><i class="rv-horn"></i>`);
    H.horn = H.vrid.querySelector('.rv-horn');
    // hans vägg: ett plan, med det som fortsätter ovanför och nedanför bilden
    H.vagg = document.createElement('div');
    H.vagg.className = 'rh-vagg';
    H.vagg.innerHTML = '<i class="rh-fort tak"></i><i class="rh-fort golv"></i>';
    sving.append(H.vagg);
    const vy = document.createElement('div');
    vy.className = 'rum-hasse-vy';
    vy.id = 'rum-hasse-vy';
    vy.hidden = true;
    vy.setAttribute('aria-label', 'Hasse Backe');
    vy.innerHTML = '<div class="rh-scen"><img class="rh-bak" alt="" draggable="false"><i class="rh-skugga"></i><img class="rh-disk" alt="" draggable="false"><canvas></canvas></div><div class="rh-samtal"></div>' +
      '<div class="rh-fot"><button type="button" class="rh-tillbaka">Tillbaka</button></div>';
    H.vagg.append(vy);
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
    addEventListener('resize', () => { if (H.on) passa(); });
    // handen läggs på pulten när rummet är klart, sist av allt
    const vanta = setInterval(() => {
      if (!rum.querySelector('canvas.rum-saker')) return;
      clearInterval(vanta);
      setTimeout(hand, 800);
    }, 400);
    if (/[?&]rum-hasse\b/.test(location.search)) setTimeout(oppna, 1500);
  }

  async function hand() {
    const plan = [...H.rum.querySelectorAll('.rum-world > .rum-pl')].at(-1);
    if (!plan) return;
    try {
      const [m, a] = await Promise.all([import('./rum-hasse-3d.js'), import('./rum-hasse-hand.js')]);
      H.m = m;
      const dpr = devicePixelRatio || 1;
      H.pulten = await a.armen(plan, { matt, pr: latt() ? 1.5 : Math.min(dpr * 1.25, 2.5) });
      pultlage();
      // Handen går att trycka på; pekar man på den eller på kaffet och notan
      // (rum.js) trummar han, och hans bilder hämtas.
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
      addEventListener('resize', () => H.pulten.placera());
      // då och då trummar han otåligt med fingrarna
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

  function bakbild() {
    return hog() ? 'rum/hasse-bak-hog.webp' : 'rum/hasse-bak.webp';
  }
  // hans bilder hämtas först när någon pekar på handen eller klickar
  function forladda() {
    if (!H.bilder) {
      H.bilder = [bakbild(), 'rum/hasse-atlas.webp'].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); });
    }
    return H.bilder;
  }

  // hans vägg i fönstret
  function matt() {
    const h = hog();
    const L = H.m.SCEN[h ? 'hog' : 'bred'];
    const W = innerWidth;
    const Hj = innerHeight;
    const k = Math.max(W / L.W, Hj / L.H) * (h ? 1 : 1.15);
    const tx = Math.min(0, Math.max(W - L.W * k, W * (h ? 0.5 : 0.31) - L.px * k));
    // (huvudet ska synas helt)
    const ty = h ? 0 : Math.max(Hj - L.H * k, Math.min(0, 20 - 113 * k));
    return { W, H: Hj, k, tx, ty, L };
  }

  function passa() {
    const { W: vw, k, tx, ty, L } = matt();
    const vh = innerHeight;
    const sc = $('.rh-scen');
    Object.assign(sc.style, { width: `${L.W}px`, height: `${L.H}px`, transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(4)})` });
    const c = sc.querySelector('canvas');
    Object.assign(c.style, { left: `${L.duk.x}px`, top: `${L.duk.y}px`, width: `${L.duk.w}px`, height: `${L.duk.h}px` });
    if (H.hog) $('.rh-samtal').style.top = `${(ty + 828 * k).toFixed(0)}px`;
    else $('.rh-samtal').style.top = '';
    const g = kameran();
    const s = H.vagg.style;
    const pct = (x) => `${(Math.max(0, 1 - x / vw) * 100).toFixed(3)}%`;
    const iSc = (x) => `${Math.max(0, L.W - (x - tx) / k).toFixed(2)}px`;
    // disken går till pultens slut, och väggen till hörnet
    s.setProperty('--kant', pct(g.xh));
    s.setProperty('--kant-b', pct(g.xc));
    s.setProperty('--kant-sc', iSc(g.xh));
    s.setProperty('--kant-sc-b', iSc(g.xc));
    // diskens bakre kant i scenen (DISK i rum-hasse-arm.js)
    s.setProperty('--disk', `${(L.py + (913 * L.S * 3900) / 3660 - 1).toFixed(1)}px`);
    // väggen står längre in än han, och ser likadan ut när kameran har stannat (Safari plattar
    // till djupet i hans bild, och där står väggen i samma plan som han)
    s.setProperty('--tak', `${g.tak.toFixed(1)}px`);
    s.setProperty('--bak-t', g.djup ? `translateZ(${(-g.bz).toFixed(2)}px) scale(${g.bs.toFixed(5)})` : 'none');
    s.setProperty('--bak-o', `${((g.cx - tx) / k).toFixed(1)}px ${((g.cy - ty) / k).toFixed(1)}px`);
    s.setProperty('--tak-o', `${g.cx.toFixed(1)}px ${(g.cy + g.tak).toFixed(1)}px`);
    // skuggan i hörnet (SKUGGA enheter bred i scenen) står på väggen
    s.setProperty('--skugga-o', `${((g.cx - g.xc) / k + SKUGGA).toFixed(1)}px ${((g.cy - ty) / k).toFixed(1)}px`);
    H.horn.style.left = `${g.hornX.toFixed(1)}px`;
    H.rum.classList.toggle('hasse-kant', !H.hog);
    // (fönstret har ändrats medan han syns: rummet står där kameran står)
    if (H.rum.classList.contains('hasse-framme')) { kameraLage(1); stilla(); }
    H.k = k;
    pultlage();
  }

  // Kameran i rummets värld. Ögat står LINS enheter framför scenen, mitt i den (rum.css).
  // Bildens vänstra kant i vilan är två punkter på samma synlinje: hörnet på bakväggen och
  // pultens slut. Svängen slutar när hörnet står xc in i fönstret; ögat har då flyttat sig, så
  // att pultens slut står en bit till höger om det (xh). Han och disken är ett plan genom
  // pultens slut och väggen ett plan genom hörnet, båda rakt framför kameran.
  function kameran() {
    const W = innerWidth;
    const Hj = innerHeight;
    const m = new DOMMatrixReadOnly(getComputedStyle($('.rum-stage')).transform);
    const k = m.a;
    const cx = m.e + 800 * k;
    const cy = m.f + 500 * k;
    const F = LINS * k;
    const hg = H.hog;
    const xc = hg ? W + 2 : W * (1 - KANT);
    const hx = Math.max(0, -m.e / k);
    const hornX = 800 + ((hx - 800) * (LINS + BAK)) / LINS;
    const slut = { x: ((800 - hx) * BACK) / LINS, z: BACK };
    const cvx = hornX - 800 - slut.x;
    const cvz = -BAK - LINS - slut.z;
    const th = Math.atan2(-cvx, -cvz) + Math.atan((xc - cx) / F);
    const dj = (vx, vz) => -vx * Math.sin(th) - vz * Math.cos(th);
    const djC = dj(cvx, cvz);
    const vx = hx - 800 - slut.x;
    const vz = -LINS - slut.z;
    const djS = dj(vx, vz);
    const xh = cx + (F * (vx * Math.cos(th) - vz * Math.sin(th))) / djS;
    // väggen når taket, över bilden (bakväggen slutar 714 enheter ovanför ögat)
    const djup = H.rum.classList.contains('chromium');
    const tak = Math.max(0, ((714 * LINS) / (djup ? djC : djS)) * k - cy);
    H.g = { k, cx, cy, F, th, s: djS / LINS, bs: djC / djS, bz: (djC - djS) * k, xc, xh, hx, tak, hornX, slut, djup };
    return H.g;
  }

  // Kameran q av vägen (0 = i rummet, 1 = framme): rummet och hans vägg, med samma form på
  // listorna hela vägen, så att mellanbilderna går längs samma bana.
  function lage(q) {
    const { k, F, th, s, slut } = H.g;
    const b = bage(q);
    const ex = slut.x * q + OGA.x * b;
    const ez = slut.z * q + OGA.z * b;
    const ey = OGA.y * b;
    const kam = `rotateZ(${(LUT * b).toFixed(3)}deg) rotateX(${(NICK * b).toFixed(3)}deg) rotateY(${((-th * q) / DEG).toFixed(3)}deg)`;
    return {
      rum: `${kam} translate3d(${(-ex).toFixed(2)}px, ${(-ey).toFixed(2)}px, ${(-ez).toFixed(2)}px)`,
      vagg: `${kam} translate3d(${((slut.x - ex) * k).toFixed(2)}px, ${(-ey * k).toFixed(2)}px, ${((slut.z - ez) * k).toFixed(2)}px) rotateY(${(th / DEG).toFixed(3)}deg) translateZ(${(F * (1 - s)).toFixed(2)}px) scale(${s.toFixed(5)})`,
    };
  }
  function kameraLage(q) {
    const { cx, cy, F } = H.g;
    const l = lage(q);
    H.vrid.style.transform = l.rum;
    H.vagg.style.transform = l.vagg;
    H.vagg.style.transformOrigin = `${cx.toFixed(2)}px ${cy.toFixed(2)}px ${F.toFixed(2)}px`;
    H.horn.style.opacity = q;
    Object.assign(H.vagg.parentElement.style, { perspective: `${F.toFixed(2)}px`, perspectiveOrigin: `${cx.toFixed(2)}px ${cy.toFixed(2)}px` });
  }

  // Var något på pulten syns när kameran har stannat (rummet i fönstrets bildpunkter, rakt
  // fram → hans scen): samma kamera.
  function iScenen(x, y) {
    const { W, k: kh, tx, ty } = matt();
    const { k, cx, cy, F, th, slut } = H.g;
    const vx = (x - (W - 1600 * k) / 2) / k - 800 - slut.x;
    const vy = (y - (innerHeight - 1000 * k) / 2) / k - 500;
    const vz = -LINS - slut.z;
    const lat = vx * Math.cos(th) - vz * Math.sin(th);
    const dj = -vx * Math.sin(th) - vz * Math.cos(th);
    // (på höjden är handen utanför bilden, till höger)
    const X = Math.min(cx + (F * lat) / dj, H.hog ? W * 1.4 : Infinity);
    const Y = cy + (F * vy) / dj;
    return [(X - tx) / kh, (Y - ty) / kh];
  }
  // Hans ena arm ligger på pulten, och koppen står där.
  function pultlage() {
    if (!H.fig || !H.pulten) return;
    // (armen siktar förbi handleden: bara ärmen ska synas på hans sida av hörnet, manschetten
    // och handen ligger på pulten)
    const [x, y] = H.pulten.handled();
    const koppen = iScenen(...H.pulten.koppen());
    if (!H.hog) { H.fig.pult(iScenen(x + 70 * H.g.k, y), koppen); return; }
    // (på höjden är handen långt bort: armen går rakt genom hörnet, där ärmen på pulten är)
    const xs = (innerWidth - 1600 * H.g.k) / 2 + H.g.hx * H.g.k;
    H.fig.pult(iScenen(xs, y + (x - xs) * 0.167), koppen, true);
  }

  async function bygg() {
    H.hog = hog();
    H.vy.classList.toggle('hog', H.hog);
    H.m = H.m || await import('./rum-hasse-3d.js');
    await Promise.all(forladda());
    for (const i of H.vy.querySelectorAll('.rh-scen img')) i.src = bakbild();
    passa();
    // (fönstret har vridits sedan sist: han står på ett annat sätt)
    if (H.fig && H.figHog !== H.hog) { H.fig.borta(); H.fig = null; const d = $('.rh-scen canvas'); d.replaceWith(d.cloneNode(false)); }
    if (!H.fig) {
      H.figHog = H.hog;
      const c = $('.rh-scen canvas');
      const pr = Math.min(H.k * (devicePixelRatio || 1), latt() ? 1.6 : 2);
      H.fig = await H.m.figuren(c, { hog: H.hog, latt: latt(), pr });
    }
    pultlage();
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
    // rummet står still under svängen och medan han syns
    if (window.Rum && Rum.vila) Rum.vila(true);
    H.fig.rita(0, performance.now() / 1000);
    const r = H.rum;
    kameraLage(0);
    r.classList.add('hasse-svang');
    void r.offsetWidth;
    if (calm()) { kameraLage(1); framme(); return; }
    H.svanger = true;
    requestAnimationFrame(() => requestAnimationFrame(() => svang(0, 1, framme)));
  }

  // Kameran går från fran till till: färdiga bilder som grafikprocessen spelar upp själv.
  function svang(fran, till, sen) {
    const bilder = [];
    for (let i = 0; i <= BILDER; i++) bilder.push(lage(fran + (till - fran) * kurva(i / BILDER)));
    const opt = { duration: TID, easing: 'linear' };
    kameraLage(till);
    // (världen rätar upp sig efter musen; i stilmallen med !important skulle den köras på huvudtråden)
    Object.assign(H.world.style, { transition: 'transform 0.7s ease-out, translate 0.7s ease-out, rotate 0.7s ease-out', translate: 'none', rotate: 'none', transform: 'translateZ(-330px) rotateX(0deg) rotateY(0deg) translateZ(330px)' });
    const a = H.vagg.animate(bilder.map((b) => ({ transform: b.vagg })), opt);
    H.vrid.animate(bilder.map((b) => ({ transform: b.rum })), opt);
    H.horn.animate([{ opacity: fran }, { opacity: till }], opt);
    let klar = false;
    const slut = () => { if (!klar) { klar = true; clearTimeout(H.sv); sen(); } };
    a.finished.then(slut, slut);
    H.sv = setTimeout(slut, 1500);
  }

  // Framme: han börjar röra sig. Hans vägg går över till platt (rakt framför kameran är den
  // samma bild), och rummet står kvar vridet så att pulten syns vid kanten; under väggen ritas
  // det inte (på höjden syns inget av rummet, och där är inget 3D kvar).
  function framme() {
    const r = H.rum;
    H.svanger = false;
    r.classList.remove('hasse-svang');
    r.classList.add('hasse-framme');
    stilla();
    H.last = null;
    H.t0 = performance.now();
    loop();
  }

  function stilla() {
    if (!H.hog) H.front.style.clipPath = `inset(0 0 0 ${(H.g.xc - 4).toFixed(1)}px)`;
    H.vagg.parentElement.style.perspective = '';
    if (H.hog) { H.vrid.style.transform = 'none'; H.front.style.clipPath = ''; }
    H.vagg.style.transform = 'none';
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
      // 30 bilder i sekunden räcker när han bara står och andas
      const ror = H.klipp || H.ko.length || (H.sagt && !H.sagt.klar);
      if (!ror && ms - last < 30) return;
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
    const r = H.rum;
    r.classList.remove('hasse-arm-ute', 'hasse-klunk');
    H.klipp = null;
    H.ko.length = 0;
    // armen ska ligga på pulten när kameran går tillbaka
    if (armUte(H.T)) H.T = 0;
    H.fig.rita(H.T, performance.now() / 1000);
    if (calm()) { H.front.style.clipPath = ''; hemma(); return; }
    // (kameran står redan vänd mot honom: ingen sväng dit först)
    H.svanger = true;
    kameraLage(1);
    r.classList.remove('hasse-framme');
    r.classList.add('hasse-svang');
    H.front.style.clipPath = '';
    void r.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => svang(1, 0, hemma)));
  }

  function hemma() {
    H.svanger = false;
    if (window.Rum && Rum.vila) Rum.vila(false);
    H.world.style.transition = '';
    H.vrid.style.transform = H.vagg.style.transform = 'none';
    H.rum.classList.remove('hasse-svang', 'hasse-framme');
    H.vy.hidden = true;
    // figuren lämnas tillbaka efter en stund, så att den inte tar minne i onödan
    clearTimeout(H.ner);
    H.ner = setTimeout(() => {
      if (H.on || !H.fig) return;
      H.fig.borta();
      H.fig = null;
      const c = $('.rh-scen canvas');
      c.replaceWith(c.cloneNode(false));
    }, latt() ? 20000 : 90000);
  }

  // ---------- samtalet ----------
  //
  // Man ber honom bara analysera en match på kupongen, men det är ett samtal: han
  // frågar, man väljer en match och han frågar tillbaka. Ber man om analysen pratar
  // han medan den tas fram, slår i disken med domen och säger texten en mening i taget. Sist säger
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
    slag: { fran: 2.5, till: 5.5, vila: 5.5, fri: true }, // armarna upp, skrattet, slaget i disken
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
      `<div class="rh-slut"><button type="button" class="rh-nasta">${esc(lott(REP().lar))}</button><button type="button" class="rh-ja">Jag gissar</button><a href="#match/${esc(m.id)}">Matchbladet</a></div>`;
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

  // Slaget i disken med domen, och sedan texten medan han pratar.
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
        if (!calm()) { const v = H.vy.querySelector('.rh-scen'); v.classList.remove('rh-slag'); void v.offsetWidth; v.classList.add('rh-slag'); }
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
