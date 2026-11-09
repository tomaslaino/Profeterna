// Hasse Backe i tobaksaffären: han sitter i baren till vänster utanför bilden, och längst ut på
// pulten står hans kaffe vid notan (rum.js), där hans hand ligger (rum-hasse-hand.js). Ett klick på
// dem (eller H) och kameran slår åt vänster, till honom. Där sitter han vid pultens hörn, vänd mot en:
// pulten går fram längs ens högra sida och viker av förbi honom, med kaffet och notan vid hans vänstra
// hand i hörnet och cigarren i askkoppen vid den högra (rum-hasse-3d.js). Samtalet står bredvid honom
// (på höjden under honom).
//
// Panoreringen: rummet och hans bild ligger bredvid varandra, med hans till vänster, och allt glider
// åt höger på 0,42 s med vågrät rörelseoskärpa, störst när bilderna byter plats; hans bild stannar
// mjukt. Tillbaka går det likadant åt andra hållet. Oskärpan ligger på ett omslag utanför rummets
// 3D-värld (.rh-pan). Hans bild är en egen värld där rummet inte syns: kameran står framför honom vid
// pulten (rum-hasse-scen.js), och kaffet, notan och handen på pulten i rummet är samma som i hörnet.
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
    vy.innerHTML = '<div class="rh-scen"><img class="rh-bak" alt="" draggable="false"><img class="rh-bak rh-lys" alt="" draggable="false"><canvas class="rh-bak rh-vagg"></canvas><canvas class="rh-disk"></canvas><i class="rh-mork"></i></div>' +
      '<canvas class="rh-duk"></canvas><i class="rh-ton" aria-hidden="true"></i><i class="rh-korn" aria-hidden="true"></i>' +
      '<div class="rh-samtal"></div><div class="rh-fot"><button type="button" class="rh-vag rh-ljud" hidden></button></div>';
    H.panIn.append(vy);
    H.vy = vy;
    // det som händer i samtalet stannar där (knapparna byter ut sig själva)
    vy.querySelector('.rh-samtal').addEventListener('click', (e) => e.stopPropagation());
    // Matchbladet: samma blad som på kupongen i rummet läggs fram över baren (bladet)
    vy.querySelector('.rh-samtal').addEventListener('click', (e) => {
      const a = e.target.closest('a.rh-vag[href^="#match/"]');
      if (!a || !window.RumMatchblad) return;
      e.preventDefault();
      bladet(a.getAttribute('href').slice(7));
    });
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
      // spelarkortet ovanpå bladets startelvor sköter sig självt: Esc stänger bara det, som i rummet
      if (document.querySelector('dialog[open]')) return;
      e.stopPropagation();
      // med matchbladet framme: Esc lägger bort det, och pilarna byter sida
      if (H.blad) {
        const n = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 }[e.key];
        if (e.key === 'Escape') bladetUt();
        else if (n) {
          e.preventDefault();
          H.blad.flik(n);
        }
        return;
      }
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
      H.pulten = await a.armen(plan, { hand: { x: 92, y: 772 }, kopp: { x: 268, y: 708 }, pr: Math.min(devicePixelRatio || 1, [2, 1.5, 1.25, 1][steg()]) * 1.25, ljus: ljuset() });
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

  // väggen bakom honom (scripts/hasse/bak.html), med sina mått i rum-hasse-scen.js (BAK): på natten bara
  // neonskyltens och gatans sken, annars också i lysrörets ljus (ljuset nedan); dagsljuset genom fönstret är en egen bild
  const hogt = () => (hog() ? '-hog' : '');
  const bakbild = (lys = false) => `rum/hasse-bak${lys ? '-lys' : ''}${hogt()}.webp`;
  const dagbild = () => `rum/hasse-bak-dag${hogt()}.webp`;
  // Ljuset i baren som i rummet (rum.js, rum-folk.js, rum-ute.js): lysröret i affärens tak är tänt utom
  // mellan elva på kvällen och sex, och dagsljuset faller in genom affärens stora fönster till höger efter klockan
  // och vädret. lys: lysröret, dag: hur ljust det är ute (0–1), f: fönsterljusets styrka, c: dess färg.
  // Färgen är himlens nere vid taken, men vitare, som ögat ser dagsljus inne; solen gör den varmare och
  // starkare, låg sol gyllene, och i den blå timmen blåare. Mulet blir den grå och svagare, i regn mer.
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  function ljuset() {
    const v = window.Vader ? Vader.nu() : null;
    const L = v && window.RumUte ? RumUte.light(v) : null;
    const natt = window.RumFolk ? RumFolk.natt() : false;
    const ut = { lys: !natt, dag: L ? L.dag : 0, f: 0, c: [1, 1, 1] };
    if (!L || L.dag < 0.01) return ut;
    const a = hex(L.sky[1]);
    const b = hex(L.sky[2]);
    const norm = (c) => { const m = Math.max(...c, 1e-3); return c.map((x) => x / m); };
    let c = norm(a.map((x, i) => 0.4 * x + 0.6 * b[i])).map((x) => 0.4 + 0.6 * x);
    const sol = [1, 0.93, 0.82].map((x, i) => x + ([1, 0.74, 0.5][i] - x) * L.guld);
    c = c.map((x, i) => x + (sol[i] - x) * 0.5 * L.sol);
    c = c.map((x, i) => x + ([0.62, 0.72, 1][i] - x) * 0.45 * L.bla);
    // (svalare än barens varma lampor, som dagsljus ser ut bredvid glödljus)
    ut.c = norm(c.map((x, i) => x * [0.86, 0.95, 1.08][i]));
    ut.f = L.dag * (1 + 0.4 * L.sol);
    return ut;
  }
  function tand() {
    const l = ljuset();
    H.ljus = l;
    H.vy.classList.toggle('lys', l.lys);
    H.vy.style.setProperty('--natt', l.lys ? '0' : (1 - l.dag).toFixed(2));
    if (H.m && H.m.DAG) {
      // fönstret i figurens ljus (rum-hasse-arm.js), och lysröret som förut
      H.m.DAG.value.set(...l.c.map((x) => x * l.f * 0.8), l.dag);
      if (l.lys) H.m.LYS.value.set(0.587, 0.593, 0.606, 0.75);
      else H.m.LYS.value.set(0, 0, 0, 0);
    }
    return l;
  }
  // Väggen med dagsljuset: bilden i lysrörets eller nattens ljus, och fönsterljuset (bakat för sig i vitt)
  // ovanpå i fönstrets färg och styrka, som ljus läggs till ljus, på en duk. Disken speglar samma duk.
  // Ritas när han öppnas. Utan dagsljus syns bilden som den är.
  async function vagg() {
    const l = H.ljus;
    const bas = $(l.lys ? 'img.rh-lys' : 'img.rh-bak:not(.rh-lys)');
    await bas.decode().catch(() => {});
    H.vy.classList.remove('vagg');
    if (l.f < 0.02 || !bas.naturalWidth) return bas;
    if (!H.dag || H.dag.src.indexOf(dagbild()) < 0) {
      H.dag = new Image();
      H.dag.src = dagbild();
    }
    try { await H.dag.decode(); } catch (e) { return bas; }
    const W = bas.naturalWidth;
    const Hh = bas.naturalHeight;
    const t = H.dagDuk || (H.dagDuk = document.createElement('canvas'));
    t.width = W;
    t.height = Hh;
    const tx = t.getContext('2d');
    tx.drawImage(H.dag, 0, 0, W, Hh);
    tx.globalCompositeOperation = 'multiply';
    tx.fillStyle = `rgb(${l.c.map((x) => Math.round(x * 255)).join(',')})`;
    tx.fillRect(0, 0, W, Hh);
    tx.globalCompositeOperation = 'source-over';
    const c = $('.rh-vagg');
    c.width = W;
    c.height = Hh;
    const x = c.getContext('2d');
    x.drawImage(bas, 0, 0);
    x.globalCompositeOperation = 'lighter';
    for (let k = l.f * 0.45; k > 0.005; k -= 1) {
      x.globalAlpha = Math.min(1, k);
      x.drawImage(t, 0, 0);
    }
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    H.vy.classList.add('vagg');
    H.vaggNr = (H.vaggNr || 0) + 1;
    return c;
  }
  // hans bilder och figuren hämtas först när någon pekar på kaffet eller klickar
  function forladda() {
    if (!H.bilder) {
      const l = ljuset();
      H.bilder = [bakbild(l.lys), 'rum/hasse-atlas.webp', ...(l.f >= 0.02 ? [dagbild()] : [])].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); });
      H.bilder.push(import('./rum-hasse-3d.js').then((m) => { H.m = m; }));
    }
    return H.bilder;
  }

  // Hans storlek och plats i fönstret: s bildpunkter på en enhet på avståndet D och (cx, ey) där
  // kamerans axel träffar fönstret. Han fyller höjden från hjässan till disken, med samtalet i en spalt
  // till vänster om honom; på höjden står han överst och samtalet under händerna. Kaffet och notan till
  // höger får gärna hamna utanför bilden i smala fönster.
  function matt() {
    const { MATT, BORD, NOTAN, iBild } = H.m;
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
      // Samtalet börjar under händerna och notan, men högst vid 60 % av höjden (sa.top nedan). Når notan längre
      // ned blir bilden så mycket mindre att den slutar ovanför samtalet, i stället för att texten står på den.
      const lagst = Math.max(iBild(o, 0, BORD.Y, 900)[1], ...(NOTAN ? NOTAN.horn : []).map((q) => iBild(o, ...q)[1]));
      v.s = Math.min(v.s, (Hj * 0.57 - 10) / (lagst - topp));
      v.cx = W * 0.5 - mitt * v.s;
      v.ey = Hj * 0.03 - topp * v.s;
    } else {
      // hjässan nära överkanten och pultens inre hörn nära underkanten, så att man ser att han sitter vid
      // hörnet och pulten går vidare mot en, och mitten av honom vid 60 % av bredden; mindre om samtalet
      // inte får plats
      // (utan hörnet: en äldre rum-hasse-3d.js i webbläsarens cache, några minuter efter en publicering)
      const horn = MATT.horn ? iBild(o, ...MATT.horn)[1] : topp + ((kant - topp) * 0.86) / 0.7;
      const sitt = (s) => ({ s, cx: W * 0.6 - mitt * s, ey: Hj * 0.04 - topp * s });
      let x = sitt((0.86 * Hj) / (horn - topp));
      for (let i = 0; i < 30 && x.cx + vans * x.s < 400; i++) x = sitt(x.s * 0.96);
      Object.assign(v, x);
    }
    v.kant = iBild(v, 0, BORD.Y, BORD.Z)[1];
    v.vanster = iBild(v, ...MATT.vanster)[0];
    // händerna, och notan framför dem, på disken (utan NOTAN: en äldre rum-hasse-3d.js i cachen)
    v.hand = Math.max(iBild(v, 0, BORD.Y, 900)[1], ...(NOTAN ? NOTAN.horn : []).map((q) => iBild(v, ...q)[1]));
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
    for (const i of H.vy.querySelectorAll('.rh-bak')) Object.assign(i.style, { left: `${(v.cx - b.px * f).toFixed(1)}px`, top: `${(v.ey - b.py * f).toFixed(1)}px`, width: `${(b.W * f).toFixed(1)}px`, height: `${(b.H * f).toFixed(1)}px` });
    // pulten: ritas en gång, med väggen i träets glans (medan fönstret ändras först när det har stannat)
    let disk = Promise.resolve();
    if (H.fig) {
      // (väggen med dagsljuset, eller bilden som den är; ny: duken har ritats om sedan disken ritades)
      const bild = H.vaggBild || $(H.ljus && H.ljus.lys ? 'img.rh-lys' : 'img.rh-bak:not(.rh-lys)');
      const n = ++H.diskNr;
      const rita = () => (bild.complete === false ? bild.decode() : Promise.resolve()).then(() => {
        if (n !== H.diskNr || !H.fig) return;
        const ny = H.diskVagg !== H.vaggNr;
        H.diskVagg = H.vaggNr;
        return H.fig.diskBild($('.rh-disk'), v, { bild, ny, ...b });
      }).catch(() => {});
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
    if (H.kupong) H.kupong.passa();
    passaSpalter();
    return disk;
  }

  async function bygg() {
    H.hog = hog();
    H.vy.classList.toggle('hog', H.hog);
    await Promise.all(forladda());
    H.m = H.m || await import('./rum-hasse-3d.js');
    Object.assign(GEST, H.m.KLIPP);
    // väggen i lysrörets ljus, eller i nattens (bara den som syns hämtas)
    const l = tand();
    $(l.lys ? 'img.rh-lys' : 'img.rh-bak:not(.rh-lys)').src = bakbild(l.lys);
    // och dagsljuset genom fönstret på den
    H.vaggBild = await vagg();
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
    H.utSen = false;
    if (window.RumBak) RumBak.fram('hasse', bak);
    vakna();
    clearTimeout(H.ner);
    try {
      H.vy.hidden = false;
      await bygg();
    } catch (e) {
      H.vy.hidden = true;
      H.oppnar = false;
      if (window.RumBak) RumBak.bort('hasse');
      return;
    }
    // bakåt medan han hämtades: man hann aldrig vända sig
    if (H.utSen) {
      H.vy.hidden = true;
      H.oppnar = false;
      slappSen();
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
    if (H.utSen) stang();
  }
  // Bakåt (rum-bak.js): på väg dit vänder man när man är framme, annars går man tillbaka (nu: direkt).
  function bak(nu) {
    if (H.oppnar || H.svanger) H.utSen = true;
    else stang(nu);
  }

  function loop() {
    cancelAnimationFrame(H.raf);
    let last = 0;
    const tick = (ms) => {
      if (!H.on) return;
      // någon har lämnat rummet (bakåt i webbläsaren, en länk): direkt hem
      if (H.rum.hidden) {
        bladetUt(true);
        H.on = false;
        H.fraga = null;
        tystna();
        if (H.kupong) H.kupong.stang();
        hemma();
        return;
      }
      H.raf = requestAnimationFrame(tick);
      if (!H.fig) return;
      // då och då gör han något litet medan han väntar på en: trummar med fingrarna, tittar bort, nickar
      // för sig själv, suckar (smatt)
      if (ms > H.trum) {
        H.trum = ms + SMATT[0] + Math.random() * (SMATT[1] - SMATT[0]);
        if (!calm() && !H.klipp && !H.ko.length && !H.fig.ror() && (!H.sagt || H.sagt.klar) && ['fraga', 'val', 'klar'].includes(H.fas)) smatt();
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
      if (H.kupong) H.kupong.steg();
      pratSteg(ms);
      talSteg(ms);
      H.tal += (H.talMal - H.tal) * Math.min(1, dt * 12);
      // munnen: ljudstyrkan när han hörs, annars följer den talet
      H.mun += ((H.munMal == null ? H.tal : H.munMal) - H.mun) * Math.min(1, dt * 30);
      H.fig.rita(H.T, ms / 1000, H.tal, H.mun);
    };
    H.raf = requestAnimationFrame(tick);
  }

  async function stang(nu = false) {
    if (!H.on || H.svanger) return;
    if (window.RumBak) RumBak.bort('hasse');
    bladetUt(true);
    H.on = false;
    H.fraga = null;
    tystna();
    if (H.kupong) H.kupong.stang();
    cancelAnimationFrame(H.raf);
    H.klipp = null;
    H.ko.length = 0;
    // han sitter stilla med armarna på disken när man vänder sig bort
    H.T = 0;
    H.fig.rita(0, performance.now() / 1000);
    H.svanger = true;
    H.rum.classList.remove('hasse-framme');
    H.rum.classList.add('hasse-pan');
    if (nu) { hemma(); return; }
    if (calm()) { tona(0, hemma); return; }
    requestAnimationFrame(() => panorera(0, hemma));
  }

  function hemma() {
    H.svanger = false;
    if (window.Rum && Rum.vila) Rum.vila(false);
    H.world.style.transition = '';
    H.rum.classList.remove('hasse-pan', 'hasse-framme');
    H.vy.hidden = true;
    slappSen();
  }
  // figuren lämnas tillbaka efter en stund, så att den inte tar minne i onödan
  function slappSen() {
    clearTimeout(H.ner);
    H.ner = setTimeout(() => { if (!H.on && H.fig) borta(); }, latt() ? 20000 : 90000);
  }

  // ---------- matchbladet ----------

  // Matchbladet i samtalet lägger fram samma blad som ett klick på lagen på kupongen i rummet
  // (RumMatchblad.fram i rum-matchblad.js): i kupongens mått, lika stort som kupongen i handen,
  // över baren som mörknar bakom. Det läggs bort med krysset i bandet, Esc eller ett klick utanför,
  // och man är kvar hos honom.
  function bladet(id) {
    if (H.blad) return;
    const c = window.Rum && Rum.bladet ? Rum.bladet() : null;
    let matcher = c ? c.matcher : [];
    if (!matcher.some((m) => String(m.id) === id)) {
      const m = typeof state !== 'undefined' && state.all ? state.all.matches.find((x) => String(x.id) === id) : null;
      matcher = m ? [m] : [];
    }
    if (!matcher.length) return;
    H.blad = RumMatchblad.fram({ inom: H.vy, matcher, id, kupong: c ? c.kupong : 'Kupong', tillbaka: 'Hasse', smal: () => Boolean(window.Rum && Rum.smal && Rum.smal()), calm,
      nar: (mid) => {
        H.blad = null;
        const a = H.vy.querySelector(`.rh-samtal a.rh-vag[href="#match/${mid}"]`);
        if (a && H.on) a.focus({ preventScroll: true });
      } });
  }
  function bladetUt(nu = false) {
    if (H.blad) H.blad.ut(nu);
  }

  // ---------- samtalet ----------
  //
  // Man ber honom bara analysera en match på kupongen, men det är ett samtal: han
  // frågar, man väljer en match och han frågar tillbaka. Ber man om analysen står den
  // direkt, och han slår domen i pulten medan man läser; Läs upp låter honom läsa den. Sist
  // säger han vad han tycker om det du själv har på kupongen, och han minns vad du har
  // frågat om. Det han säger runt omkring står i rum-hasse-repliker.js.
  //
  // Allt är skrivet i förväg (scripts/analyser/skriv.mjs, data/analyser.json): artikeln,
  // tipset och hans röst (svara). Tecknen och resultatet har han
  // bestämt själv när han skrev (hasse.tecken, hasse.resultat); saknas hans röst står
  // analysen i skrift med tipsets tecken.
  const TECKEN = ['Etta', 'Kryss', 'Tvåa'];
  const KORT = ['1', 'X', '2'];
  function domen(signs) {
    const s = [...signs].sort();
    return s.length === 3 ? 'Helgardera.' : `${s.map((n, i) => (i ? TECKEN[n].toLowerCase() : TECKEN[n])).join(', ')}.`;
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const REP = () => window.HasseRepliker;
  const fyll = (t, o = {}) => t.replace(/\{(\w+)\}/g, (_, k) => (o[k] == null ? '' : o[k]));
  // Lottar utan att samma rad kommer två gånger innan alla har varit med, och inte heller två gånger i
  // rad när alla har varit med och det börjar om.
  const pasar = new WeakMap();
  const sist = new WeakMap();
  function lott(lista) {
    let p = pasar.get(lista);
    if (!p || !p.length) {
      p = [...lista].sort(() => Math.random() - 0.5);
      if (p.length > 1 && p[p.length - 1] === sist.get(lista)) [p[0], p[p.length - 1]] = [p[p.length - 1], p[0]];
      pasar.set(lista, p);
    }
    const x = p.pop();
    sist.set(lista, x);
    return x;
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
  // Hans tecken: de han valde när han skrev sin text, annars tipsets (äldre texter).
  const hans = (a) => a.hasse && a.hasse.stycken && Array.isArray(a.hasse.tecken) && a.hasse.tecken.length;
  const hansTecken = (a) => (hans(a) ? a.hasse.tecken : a.tip.signs);
  // Resultatet han säger: hans eget, annars (äldre texter, eller analysen i skrift) det
  // troligaste i modellens resultatmatris (0–4 mål per lag) bland utfallen han har ringat
  // in, så att det aldrig går emot tecknen. Hemma–borta, eller null.
  function resultatet(p, signs, a) {
    if (hans(a) && /^[0-4]–[0-4]$/.test(a.hasse.resultat || '')) return a.hasse.resultat;
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
  // för den här kupongen). Bara tecken du själv har bett om står på raderna. Det han sa
  // sparas också (SAGT: styckena och när analysen skrevs), så att matchen står direkt nästa
  // gång, som han sa den, också när analysen har skrivits om sedan dess.
  const MINNE = 'profeterna.hasse.fragat';
  const SAGT = 'profeterna.hasse.sagt';
  const nyckel = (lista) => (lista.length ? `${lista[0].id}:${lista.length}` : '');
  // (sparar enheten inget minns han det bara nu)
  const bara = new Map();
  function las(namn, lista) {
    let j = null;
    try { j = JSON.parse(localStorage.getItem(namn)); } catch (e) { /* bara nu */ }
    j = j || bara.get(namn);
    return j && j.k === nyckel(lista) ? j.m || {} : {};
  }
  function skriv(namn, lista, m) {
    const j = { k: nyckel(lista), m };
    bara.set(namn, j);
    try { localStorage.setItem(namn, JSON.stringify(j)); } catch (e) { /* bara nu */ }
  }
  const minns = (lista) => las(MINNE, lista);
  function minnas(lista, id, signs, res, sagt) {
    const m = minns(lista);
    m[id] = [...signs].sort().map((n) => KORT[n]).join('') + (res ? ` ${res}` : '');
    skriv(MINNE, lista, m);
    const s = las(SAGT, lista);
    s[id] = sagt;
    skriv(SAGT, lista, s);
  }
  // När analysen (och hans text till den) skrevs.
  const skriven = (a) => (a.hasse && a.hasse.writtenAt) || a.writtenAt || '';
  // Replikerna som stycken, som de stod.
  const stycken = (lista) => lista.reduce((ut, r, i) => {
    if (i && r.ny === false) ut[ut.length - 1] += ` ${r.text}`;
    else ut.push(r.text);
    return ut;
  }, []);

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
  // Det han säger då och då medan han väntar på en (pratSteg): n rader ur listan, den första efter forst ms
  // och sedan en var 20:e sekund. De lottas när de sägs, så att han inte upprepar sig förrän alla har varit
  // med, också om man går och kommer tillbaka. Utan dag hoppar han över raderna med {dag}.
  // (en äldre rum-hasse-repliker.js i cachen kan sakna listan)
  function vantar(lista, n, forst, dag = '') {
    if (!lista || !lista.length) return null;
    const nasta = () => {
      let t = lott(lista);
      for (let i = lista.length; !dag && t.includes('{dag}') && i > 0; i--) t = lott(lista);
      return fyll(t, { dag });
    };
    return { rader: Array(n).fill(nasta), i: 0, nasta: performance.now() + forst, gang: 20000 };
  }

  // Rörelserna: klipp på tidslinjen (KLIPP i rum-hasse-3d.js, hit när figuren hämtas). fran: var det
  // börjar (måste vara där han står, utom fri), till: var det slutar, vila: där han står sedan, grupp:
  // domen, kaffet, cigarren eller småsakerna, och han lottar bland klippen i gruppen.
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
  // Och emellanåt gör han något litet (minst och längst i ms mellan gångerna): fingrarna trummar (på ett
  // av sätten, oftast med höger hand), eller ett av klippen i gruppen smatt (han tittar bort, nickar för
  // sig själv, suckar, sträcker på nacken …), lottade. Fingrarna kommer dubbelt så ofta som ett klipp.
  const SMATT = [5000, 11000];
  const TRUMSATT = ['varv', 'varv', 'fort', 'lugnt', 'peka'];
  const SMATT_L = [];
  // Din kupong: när den ligger framför honom spanar han på den ibland (gruppen spana, med en lottad min),
  // och när han har sagt vad han tycker om den tittar han på den med en min som passar (H.spana,
  // omKupongen). Utan en kupong att titta på, eller ord om den, tittar han inte ned på en.
  const SPANA_OFTA = 0.4;
  function spana() {
    const k = H.kupong;
    // (bara från vilan: minen väntar om han står kvar där han pratade)
    if (!k || k.skriver || k.fas === 'hand' || k.fas === 'fram' || k.fas === 'ut' || Math.abs(H.T) > 0.01) return false;
    let namn = H.spana;
    if (namn) H.spana = null;
    else if (k.fas === 'disk' && Math.random() < SPANA_OFTA) namn = ettAv('spana');
    if (namn) gest(namn);
    return Boolean(namn);
  }
  function smatt() {
    if (spana()) return;
    if (!SMATT_L.length) SMATT_L.push('trumma', 'trumma', ...grupp('smatt'));
    const namn = lott(SMATT_L);
    if (namn === 'trumma') H.fig.trumma(TRUMSATT[Math.floor(Math.random() * TRUMSATT.length)], 'B');
    else gest(namn);
  }
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
    // (det som ska undan går 2,5 gånger så fort när något annat väntar, och småsakerna också när han
    // börjar prata)
    // (och inför att han skriver på din kupong, och när han suddar ut det han skrev)
    const fort = (k.skynda && (H.ko.length || ((k.grupp === 'smatt' || k.grupp === 'spana') && H.sagt && !H.sagt.klar))) || (H.ko.length && H.ko[0].brad) || k.bort;
    H.T = Math.min(k.till, H.T + dt * (fort ? 2.5 : 1));
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
  // ljudstyrkan. Det hämtas medan han gör annat, analysens när den står (lasKnapp).
  // Saknas meningen i registret, eller är ljudet inte framme i tid (r.vanta), säger han
  // den tyst i skriftens takt, som förut, och när han läser upp hoppar han över den. Så
  // också när ljudet är avstängt och med minskad rörelse (då står allt direkt).
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

  // Rösten från baren när man ropar till honom vid anslagstavlan (rum-anslag.js). Han syns
  // inte, så ljudet kommer från vänster och lite dovt, som från andra sidan affären. Samma
  // register och samma ljud som här. vakna() vid klicket, ljud(text) → Promise<klipp | null>
  // eller null (som ljudTill), spela(klipp) → { t0, fran, till, slut, stop() } i ljudets klocka
  // (nu()), och av() när han inte hörs.
  const fjarran = {
    vakna,
    ljud: (text) => ljudTill(text),
    av: () => V.av || !V.ctx || V.ctx.state !== 'running',
    nu: () => (V.ctx ? V.ctx.currentTime : 0),
    spela(k) {
      const c = V.ctx;
      const src = c.createBufferSource();
      src.buffer = k.buf;
      const dov = c.createBiquadFilter();
      dov.type = 'lowpass';
      dov.frequency.value = 3800;
      const styrka = c.createGain();
      styrka.gain.value = 0.85;
      src.connect(dov);
      dov.connect(styrka);
      let ut = styrka;
      if (c.createStereoPanner) {
        const sida = c.createStereoPanner();
        sida.pan.value = -0.7;
        styrka.connect(sida);
        ut = sida;
      }
      ut.connect(c.destination);
      const fran = Math.max(0, k.fran - 0.03);
      const till = Math.min(k.buf.duration, k.till + 0.08);
      const t0 = c.currentTime + 0.03;
      src.start(t0, fran, till - fran);
      const l = {
        t0, fran, till, slut: false,
        stop() {
          src.onended = null;
          try { src.stop(); } catch (e) { /* redan slut */ }
        },
      };
      src.onended = () => { l.slut = true; };
      return l;
    },
  };

  // ---------- replikerna ----------
  //
  // repliker(lista, { i, sen, direkt }): han säger en replik i taget, ord för ord
  // med munnen i takt, och väntar lite innan nästa. Platsen är reserverad från
  // början, så inget flyttar sig. Ett klick (eller mellanslag) visar hela repliken,
  // nästa klick går vidare, och hoppa tar resten på en gång. Repliken hörs
  // (rösten ovan): ljudet hämtas direkt, om det inte redan är givet (medLjud).
  //   lista: [{ text, gest?: namn i GEST, vid?(i): när repliken börjar,
  //             ny?: false = samma stycke som förra, skrift?: visas utan att sägas }]
  //   i: rutan (.rh-text om inget annat sägs), sen: när allt är sagt,
  //   direkt: allt på en gång, rad: repliken står direkt i rutan, utan stycke,
  //   synlig: allt står redan i rutan och han läser upp det (Läs upp, lasUpp).
  const ORD_MS = 44;
  const ordTid = (w) => ORD_MS * (w.length + 1) + (/[,:;]$/.test(w) ? 170 : 0);
  function repliker(lista, { i: ruta = $('.rh-text'), sen = null, direkt = calm(), rad: somRad = false, synlig = false } = {}) {
    avbrytLasning();
    tystna();
    const x = { lista, ruta, sen, somRad, synlig, i: -1, ord: [], n: 0, tid: 0, klar: false, tyst: true, p: null, el: null, ljud: null, vanta: 0 };
    H.sagt = x;
    if (synlig) utskrivet(x);
    if (direkt) hoppa();
    else for (const r of lista) if (!('klipp' in r) && !r.skrift) medLjud(r, ljudTill(r.text));
    return x;
  }
  // Det han ska läsa upp står redan, som det stod: varje replik i sitt stycke, alla ord synliga. Medan
  // han läser är det han inte läser dämpat (rh-klar tas bort tills han är klar).
  function utskrivet(x) {
    const topp = x.ruta.scrollTop;
    x.ruta.textContent = '';
    x.ruta.classList.remove('rh-klar');
    let p = null;
    for (const r of x.lista) {
      if (r.ny !== false || !p) {
        p = document.createElement('p');
        x.ruta.append(p);
      } else p.append(' ');
      r.el = document.createElement('span');
      r.el.className = 'rh-rep';
      p.append(r.el);
      r.ord = ordI(r.el, r.text);
      for (const o of r.ord) o.classList.add('s');
    }
    x.ruta.scrollTop = topp;
  }
  // Börjar han säga något annat mitt i en uppläsning slutar han läsa, och allt står som förut.
  function avbrytLasning() {
    const x = H.sagt;
    if (!x || !x.synlig || x.klar) return;
    x.klar = true;
    if (x.el) x.el.classList.remove('nu');
    x.ruta.classList.add('rh-klar');
    const f = x.sen;
    x.sen = null;
    if (f) f();
  }
  // Meningen han läser syns i rutan: rutan rullar bara när den inte gör det.
  function synas(text, el) {
    // (under en dom rullar texten med lappen under den)
    const ruta = text.closest('.rh-rull') || text;
    const r = el.getBoundingClientRect();
    const b = ruta.getBoundingClientRect();
    if (r.bottom > b.bottom) ruta.scrollTop += r.bottom - b.bottom + 8;
    else if (r.top < b.top) ruta.scrollTop -= b.top - r.top + 8;
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
    if (r.paus) return r.paus;
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
    if (x.synlig) {
      x.el = r.el;
      x.el.classList.add('nu');
      x.ord = r.ord;
      x.n = 0;
      x.tyst = false;
      x.tid = ms;
      x.vanta = !tyst && !r.skrift && r.klipp ? ms + (r.vanta || VANTA) : 0;
      synas(x.ruta, x.el);
      if (!tyst && !r.skrift && r.gest) gest(r.gest);
      return;
    }
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
    // (när han läser upp hoppar han över det som inte hörs: orden står ju redan)
    if (x.synlig && x.n < x.ord.length) {
      x.n = x.ord.length;
      x.tyst = true;
      return;
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
    // (när han läser upp går klicket till nästa mening)
    if (x.synlig) {
      H.talMal = 0;
      nastaReplik(x, nu);
      return;
    }
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
  // En rad överst: det han frågar eller säger mellan analyserna.
  const rad = (text, sen) => repliker([{ text }], { i: $('.rh-sagt'), sen, rad: true, direkt: calm() });
  // Rader som kommer med jämna mellanrum medan han väntar på en.
  function pratSteg(ms) {
    const v = H.prat;
    if (!v || ms < v.nasta || H.klipp || H.ko.length || (H.sagt && !H.sagt.klar)) return;
    if (v.i >= v.rader.length) { H.prat = null; return; }
    const r = v.rader[v.i++];
    rad(typeof r === 'function' ? r() : r);
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
    return medGester(ut);
  }
  function medGester(ut) {
    let sedan = 1;
    ut.forEach((r) => {
      sedan++;
      if (BIELSA.test(r.text)) { r.gest = 'slag'; sedan = 0; } else if (sedan >= 2 && BESTAMT.test(r.text)) { r.gest = FINGRET.test(r.text) ? 'armar' : Math.random() < 0.4 ? 'dunka' : talGest(r.text); sedan = 0; } else if (sedan >= 3 && r.text.length > 50) { r.gest = talGest(r.text); sedan = 0; }
    });
    return ut;
  }

  // ---------- Läs upp ----------
  //
  // Hans text står direkt. Läs upp under den låter honom läsa den med sin röst, en mening i taget,
  // och meningen han läser står ljus medan resten är dämpad. Han läser det som står i rutan: ett
  // stycke som har ljud för sig (en färdig replik, som resultatet) i ett svep, annars mening för
  // mening (hans text). Det som saknar ljud hoppar han över. Knappen finns när minst hälften av det
  // har ljud, och medan han läser heter den Ja, ja och tystar honom. Knappen slår på ljudet, som
  // Ljud på.
  function enheter(ruta, filer) {
    const ut = [];
    for (const p of ruta.querySelectorAll('p')) {
      const t = enkel(p.textContent);
      if (!t) continue;
      (filer[t] ? [t] : meningar(t)).forEach((text, i) => ut.push({ text, ny: i === 0, skrift: !filer[enkel(text)] }));
    }
    return medGester(ut);
  }
  const laser = (ruta) => Boolean(H.sagt && H.sagt.synlig && !H.sagt.klar && H.sagt.ruta === ruta);
  // Knappen i foten (slut), före Matchbladet. Kallas igen när foten har ritats om.
  function lasKnapp(slut, ruta) {
    if (!slut || !ruta) return;
    let b = slut.querySelector('.rh-las');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'rh-vag rh-las';
      b.hidden = true;
      slut.insertBefore(b, slut.querySelector('a.rh-vag'));
      b.addEventListener('click', () => lasUpp(slut, ruta));
    }
    const nu = laser(ruta);
    b.textContent = nu ? 'Ja, ja' : 'Läs upp';
    b.classList.toggle('rh-ja', nu);
    if (nu) return;
    registret().then((filer) => {
      if (!ruta.isConnected) return;
      const e = enheter(ruta, filer);
      const med = e.filter((r) => !r.skrift);
      b.hidden = !(med.length && med.length * 2 >= e.length);
      // (med ljudet på hämtas det redan nu, så att han kan börja direkt)
      if (!V.av) for (const r of med) ljudTill(r.text);
    });
  }
  function lasUpp(slut, ruta) {
    if (laser(ruta)) {
      hoppa();
      return;
    }
    if (V.av) vaxla();
    else vakna();
    registret().then((filer) => {
      if (!ruta.isConnected || laser(ruta)) return;
      repliker(enheter(ruta, filer), { i: ruta, synlig: true, direkt: false, sen: () => lasKnapp(slut, ruta) });
      lasKnapp(slut, ruta);
    });
  }
  // Vad han säger om det du har på kupongen. null om du inte har någon att tala om.
  // tecknen i ord står i rum-hasse-repliker.js, så att rösten säger samma sak (src/rost.js)
  const iOrd = (t) => (t.length === 3 ? 'helgardering' : t.map((c) => REP().tecken[c].du).join(' och '));
  function omKupongen(m, signs) {
    const p = window.Samtal && Samtal.pult ? Samtal.pult.state() : null;
    if (!p || !p.s) return null;
    const k = REP().kupong;
    // (med det han har ändrat i din inlämnade och inte lämnat in än)
    const du = K().din(m.id).split('');
    const han = signs.map((n) => KORT[n]);
    if (!du.length) return null;
    const bada = du.filter((c) => han.includes(c));
    const sort = (a) => [...a].sort((x, y) => KORT.indexOf(x) - KORT.indexOf(y));
    const o = { du: iOrd(sort(du)) };
    // (och efter orden tittar han på den med en min som passar: spana)
    if (!bada.length) { H.spana = 'spanaBlund'; return fyll(lott(k.skilda), o); }
    if (bada.length === du.length && bada.length === han.length) { H.spana = 'spanaNojd'; return lott(k.samma); }
    if (bada.length === du.length) { H.spana = 'spanaBryn'; return fyll(lott(k.farre), o); }
    H.spana = 'spanaSkaka';
    if (bada.length === han.length) return fyll(lott(k.fler), o);
    // två tecken var och ett gemensamt: "Ettan kan du behålla"
    return fyll(lott(k.korsar), { ...o, Bada: REP().tecken[bada[0]].bestamd.replace(/^./, (c) => c.toUpperCase()) });
  }

  // Han frågar. Första gången eller när man kommer igen; annars nästa match.
  function fraga() {
    const s = $('.rh-samtal');
    const forst = !H.on;
    if (forst) {
      H.klipp = null;
      H.ko = [];
      H.spana = null;
      H.tal = 0;
      H.talMal = 0;
      H.mun = 0;
      H.munMal = null;
      H.T = 0;
    }
    H.fraga = {};
    H.fas = 'fraga';
    H.prat = null;
    // efter omgången dömer han gänget (domarna nedan)
    if (gangLista(summan())) return;
    const lista = kupongen();
    const fragat = minns(lista);
    const nu = Date.now();
    s.innerHTML = '<h2 class="rh-sagt"></h2><div class="rh-lista"></div>';
    const forsta = listan(lista, fragat);
    const forstaText = forstaRad(lista, fragat, forst);
    if (forstaText) rad(forstaText);
    const dag = spelstopp(lista);
    H.prat = lista.length && forsta ? vantar(REP().ledig, 8, 14000, dag) : null;
    // När omgången har börjat står alla hans tips på raderna (hansRader), och när alla matcher har börjat
    // säger han hur det gick. Öppnar man honom medan rummet laddas kan matcherna och säsongen komma
    // efter samtalet: då ritas listan om, och han säger det först då.
    const igang = lista.some((m) => Date.parse(m.avspark) <= nu);
    const borjat = lista.length && !lista.some((m) => Date.parse(m.avspark) > nu);
    const vem = H.fraga;
    const vanta = datan(igang);
    const fram = (tips) => {
      if (H.fraga !== vem || H.fas !== 'fraga') return;
      const l = $('.rh-lista');
      const topp = l.scrollTop;
      listan(lista, fragat, tips);
      l.scrollTop = topp;
      // (efter omgången säger han inget om hur det gick för honom: då dömer han gänget)
      if (borjat && !summan()) efterat(lista, tips);
    };
    if (igang) Promise.resolve(vanta).then(() => hansRader(lista, fragat)).then(fram);
    else if (vanta) vanta.then(() => fram(fragat));
    klick();
  }
  // Det som hämtas medan rummet laddas: matcherna (Facit) och, när det behövs, säsongen (hans kupong).
  // → Promise tills det är framme, eller null om det redan är det.
  function datan(sasong) {
    const v = [];
    if (typeof state !== 'undefined' && !state.all && !state.matchesForsokt && typeof whenMatches === 'function') v.push(whenMatches());
    if (sasong && typeof TP !== 'undefined' && !TP.season && typeof tpLoadSeason === 'function') v.push(tpLoadSeason());
    return v.length ? Promise.all(v) : null;
  }
  // Raderna när omgången har börjat. Före första avspark syns bara det du själv har frågat om, men sedan
  // är tipsen ingen hemlighet (också var och ens egna har stängt): alla matcher står ifyllda, också de som
  // inte har startat än, som 18:30-matchen. Tecknen är hans kupong i tävlingen om han spelar den, annars
  // det han säger i sin text. Resultatet är hans eget, och har han inget (eller inget som stämmer med
  // tecknen) det troligaste i modellen. → Promise med {matchens id: "X2 0–2"}, som minnet (fragat).
  async function hansRader(lista, fragat) {
    const kupong = hansKupong(lista);
    const ut = { ...fragat };
    await Promise.all(lista.map(async (m) => {
      const a = await analysen(m.id);
      const egna = a && (hans(a) || a.tip) ? [...hansTecken(a)].sort().map((n) => KORT[n]).join('') : '';
      const tecken = kupong[m.id] || egna;
      if (!tecken) return;
      const signs = KORT.map((k, n) => (tecken.includes(k) ? n : -1)).filter((n) => n >= 0);
      const sagt = a ? resultatet(null, signs, a) : null;
      const [h, b] = String(sagt).split('–').map(Number);
      const res = sagt && signs.includes(h > b ? 0 : h === b ? 1 : 2) ? sagt : resultatet(await prognosen(m.id), signs, {});
      ut[m.id] = tecken + (res ? ` ${res}` : '');
    }));
    return ut;
  }
  // Raderna och spalthuvudet, med Facit så snart någon match har slutat. tips: det som står på raderna
  // (hansRader), annars det du har frågat om. → nästa match du inte har frågat om.
  function listan(lista, fragat, tips = fragat) {
    const s = $('.rh-samtal');
    const l = s.querySelector('.rh-lista');
    const nu = Date.now();
    const facit = new Map(lista.map((m) => [m.id, slutade(m, nu)]));
    const medFacit = [...facit.values()].some(Boolean);
    // (med din spalt också blir det trångt: då står spalterna tätare)
    s.classList.toggle('tre', medFacit && K().kan());
    const kol = s.querySelector('.rh-kol');
    if (kol) kol.remove();
    l.insertAdjacentHTML('beforebegin', spalter(lista, tips, medFacit));
    l.textContent = '';
    let forsta = null;
    lista.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      const f = facit.get(m.id);
      // (det du har på raden står för hand längst ut, i en egen spalt)
      b.innerHTML = `<i>${i + 1}</i><span>${esc(m.namn)}</span>${hansTips(tips[m.id], f)}${medFacit ? facitRuta(f) : ''}${K().kan() ? `<u>${esc(K().din(m.id))}</u>` : ''}`;
      b.disabled = Date.parse(m.avspark) <= nu;
      // (en match som har börjat går inte att fråga om, men hans tips ska gå att läsa)
      b.classList.toggle('spelad', Boolean(f) || b.disabled);
      b.dataset.id = m.id;
      // har du redan fått svaret står det direkt, och han erbjuder sig att titta igen
      b.addEventListener('click', (e) => {
        H.listaTopp = l.scrollTop;
        if (fragat[m.id]) tidigare(m, lista, e);
        else valj(m, lista, e);
      });
      l.append(b);
      if (!forsta && !b.disabled && !fragat[m.id]) forsta = b;
    });
    passaSpalter();
    // (handstilen kan komma efter: då mäts namnen igen)
    if (document.fonts) document.fonts.ready.then(passaSpalter);
    // nästa match man inte har frågat om syns utan att man rullar
    if (forsta) l.scrollTop = Math.max(0, forsta.offsetTop - l.offsetTop - 40);
    return forsta;
  }
  // Det han sa om matchen, på dess rad: rutorna 1 X 2 som på kupongen med hans tecken ifyllda,
  // och resultatet. Rutorna och resultatet har fast bredd och strecket i resultatet står mitt i
  // sin spalt (siffrorna är olika breda i Fraunces), så att allt står i raka spalter. När matchen har
  // slutat (f, slutade) lyser tecknet som kom in: i guld om han hade det, annars med vit ram (kom).
  // Det han hade i onödan tonas ned (av), och resultatet står i guld om han sa det exakta.
  function hansTips(minne, f = null) {
    const [tecken, res] = String(minne || '').split(' ');
    if (!tecken) return '';
    const rutor = KORT.map((k, n) => {
      const pa = tecken.includes(k);
      const klass = [pa && 'pa', f && pa && n !== f.utfall && 'av', f && !pa && n === f.utfall && 'kom'].filter(Boolean).join(' ');
      return `<em${klass ? ` class="${klass}"` : ''}>${k}</em>`;
    }).join('');
    const [h, b] = String(res || '').split('–');
    const mal = b === undefined ? '' : `<i>${esc(h)}</i>–<i>${esc(b)}</i>`;
    const exakt = f && res === `${f.h}–${f.b}`;
    return `<b class="rh-tips"><span class="rh-vh">${esc(tecken)}</span><span class="rh-rutor" aria-hidden="true">${rutor}</span><small${exakt ? ' class="exakt"' : ''}>${mal}</small></b>`;
  }
  // Hur matchen slutade efter 90 minuter, som tipsen rättas: { h, b, utfall: 0–2 }. null om den inte har
  // slutat, eller om du har valt att dölja den (gradeRow i kupong.js).
  function slutade(m, nu = Date.now()) {
    if (typeof gradeRow !== 'function') return null;
    const r = gradeRow({ id: m.id, sign: '1X2', label: m.namn }, nu);
    const s = r.state === 'final' && r.res != null && ((r.m && r.m.score90) || r.score);
    return s ? { h: s.home, b: s.away, utfall: r.res } : null;
  }
  // Rutan i spalten Facit, med strecket mitt i spalten som i hans resultat. Tom på rader som inte har slutat.
  const facitRuta = (f) => `<b class="rh-facit">${f ? `<span class="rh-vh">Slutade </span><i>${esc(f.h)}</i>–<i>${esc(f.b)}</i>` : ''}</b>`;
  // Vem som säger vad, överst i listan: Hasse (porträtt och namn i guld) över hans rutor och
  // resultat, du (porträtt i din färg och namnet i din handstil, som på kupongen) över det du har.
  // Huvudet är byggt som en rad, med osynliga rutor som håller bredden, så att det står mitt över
  // spalterna i alla storlekar. Mellan dem står Facit, när någon match har slutat. Spalterna som inte syns
  // på någon rad får inget huvud.
  function spalter(lista, tips, medFacit = false) {
    const han = lista.some((m) => tips[m.id]);
    const du = K().kan();
    if (!han && !du && !medFacit) return '';
    const hans = han ? `<b class="rh-tips"><span class="rh-rutor">${KORT.map((k) => `<em>${k}</em>`).join('')}</span><small></small><span class="rh-vem hasse"><span class="rh-ans"></span><span class="rh-namn">Hasse</span></span></b>` : '';
    let din = '';
    if (du) {
      // (porträtten står i gängets uppgifter i kuponger.json, KP i kupong.js, som rum.js läser dem)
      const p = Samtal.pult.state();
      const gang = (typeof KP !== 'undefined' && KP.data && KP.data.samtal && KP.data.samtal.gang) || p.s.gang || [];
      const i = p.vem ? gang.findIndex((g) => g.id === p.vem) : -1;
      const g = i >= 0 ? gang[i] : null;
      const namn = dittNamn();
      din = g && namn
        ? `<u><span class="rh-vem du k${i}"><span class="rh-ans"${g.bild ? ` style="background-image: url('${esc(g.bild)}')"` : ''}></span><span class="rh-namn">${esc(namn)}</span></span></u>`
        : '<u><span class="rh-vem du"><span class="rh-namn">Du</span></span></u>';
    }
    const slut = medFacit ? '<b class="rh-facit"><span class="rh-vem facit">Facit</span></b>' : '';
    return `<div class="rh-kol" aria-hidden="true">${hans}${slut}${din}</div>`;
  }
  // Huvudet lika brett som raderna (en rullningslist tar plats i listan), och namnen bara när de
  // får plats bredvid varandra: först går ditt (du vet hur du ser ut), sedan hans.
  function passaSpalter() {
    const k = $('.rh-kol');
    const l = $('.rh-lista');
    if (!k || !l || !k.offsetWidth) return;
    k.style.paddingRight = `${l.offsetWidth - l.clientWidth}px`;
    k.classList.remove('trangt', 'trangare');
    const v = [...k.querySelectorAll('.rh-vem')];
    const krock = () => v.some((x, i) => i && v[i - 1].getBoundingClientRect().right + 14 > x.getBoundingClientRect().left);
    if (krock()) k.classList.add('trangt');
    if (krock()) k.classList.add('trangare');
  }
  function forstaRad(lista, fragat, forst) {
    const r = REP();
    // (en äldre rum-hasse-repliker.js i cachen har en enda rad i stället för en lista)
    const enAv = (x) => (Array.isArray(x) ? lott(x) : x);
    if (!lista.length) return r.ingenKupong;
    const nu = Date.now();
    const oppna = lista.filter((m) => Date.parse(m.avspark) > nu);
    // när alla matcher har börjat säger han hur det gick (efterat)
    if (!oppna.length) return null;
    const n = lista.filter((m) => fragat[m.id]).length;
    // (det som är kvar räknas bara på matcher som går att fråga om: de som har börjat är inte kvar, och
    // har någon börjat är det inte hela kupongen längre)
    const kvar = oppna.filter((m) => !fragat[m.id]).length;
    const hela = oppna.length === lista.length;
    const namn = dittNamn();
    if (forst) {
      if (!kvar) return hela || !r.allaKvar ? lott(r.allaIgen) : enAv(r.allaKvar);
      if (n) return fyll(lott(namn ? r.tillbakaNamn : r.tillbaka), { namn });
      return fyll(lott(namn ? r.oppningNamn : r.oppning), { namn });
    }
    if (!kvar) return enAv(hela || !r.allaKvar ? r.alla : r.allaKvar);
    if (kvar === 1) return enAv(r.enKvar);
    if (hela && n === Math.ceil(oppna.length / 2)) return lott(r.halva);
    return lott(r.antal[n] || r.nasta);
  }

  // ---------- hur det gick ----------
  //
  // När alla matcher har börjat säger han hur det gick för honom, på sitt sätt (efter i
  // rum-hasse-repliker.js). Det som räknas är hans kupong i tävlingen om han spelade omgången
  // (data/tippare.json), annars det han sa om matcherna, alltså raderna i listan. Rättningen är
  // poängtavlans (tpRows i tippare.js), så om matcher du har valt att dölja säger han inget. Hur det gick
  // följer poängen, antal rätt mot vad chanserna var värda (i standardavvikelser): på en hel kupong med
  // garderingar är nio rätt av tretton dåligt, och på sex ensamma tecken är fyra rätt bra. Bra kräver också
  // fler rätt än fel, även när skrällarna satt.
  const BRA = 0.6;
  // Hans tecken i tävlingen i de här matcherna: {matchens id: tecken}.
  function hansKupong(lista) {
    const t = typeof TP !== 'undefined' && TP.season;
    if (!t || typeof Tippoang === 'undefined') return {};
    const alla = { ...t.hasse };
    for (const r of t.rounds || []) for (const m of r.matches || []) if (m.tips && m.tips[Tippoang.HASSE.id]) alla[m.id] = m.tips[Tippoang.HASSE.id];
    return Object.fromEntries(lista.filter((m) => alla[m.id]).map((m) => [m.id, alla[m.id]]));
  }
  // Hans plats i gänget när omgången är klar: 'best', 'worst' eller inget.
  function hansPlats(lista) {
    const ids = new Set(lista.map((m) => m.id));
    const r = ((TP.season && TP.season.rounds) || []).find((x) => (x.matches || []).some((m) => ids.has(String(m.id))));
    const nu = TP.round && TP.round.matcher && TP.round.matcher.some((m) => ids.has(String(m.id)));
    const folk = r ? r.people : nu && typeof tpScore === 'function' ? tpScore(TP.round, Date.now()).ranked : null;
    const han = (folk || []).find((p) => p.id === Tippoang.HASSE.id);
    return han ? han.award : null;
  }
  // Resultatet i någon av raderna i listan som han sa exakt, eller null. Matcher du döljer räknas inte.
  function sagtExakt(lista, tips) {
    for (const m of lista) {
      const res = String(tips[m.id] || '').split(' ')[1];
      const f = res ? slutade(m) : null;
      if (f && `${f.h}–${f.b}` === res) return res;
    }
    return null;
  }
  // → { lage: en av listorna i efter, ok, n, plats, exakt } eller null om det inte går att säga något.
  function hurDetGick(lista, tips) {
    if (typeof tpRows !== 'function' || typeof Tippoang === 'undefined') return null;
    const kupong = hansKupong(lista);
    const spelade = Object.keys(kupong).length > 0;
    const tecken = spelade ? kupong : Object.fromEntries(lista.filter((m) => tips[m.id]).map((m) => [m.id, tips[m.id].split(' ')[0]]));
    if (!Object.keys(tecken).length) return { lage: 'ofragad' };
    const rader = tpRows({ matcher: lista.map((m) => ({ id: m.id, match: m.namn })) }, tecken, Date.now())
      .filter((r) => r && r.state !== 'off' && r.state !== 'missing');
    if (!rader.length) return null;
    if (rader.some((r) => r.state === 'hidden')) return { lage: 'dolt' };
    if (rader.some((r) => r.pts == null)) return { lage: 'pagar' };
    const { n, ok, pts } = Tippoang.tally(rader);
    const spridning = Math.sqrt(rader.reduce((a, r) => a + r.prob * (1 - r.prob), 0));
    const z = spridning ? pts / spridning : 0;
    const lage = n >= 3 && !ok ? 'inget' : n >= 3 && ok === n && spridning ? 'alla' : z >= BRA && ok * 2 > n ? 'bra' : z <= -BRA ? 'daligt' : 'mitten';
    return { lage, n, ok, plats: spelade ? hansPlats(lista) : null, exakt: sagtExakt(lista, tips) };
  }
  // Vad han gör när han har sagt sitt.
  const EFTER_GEST = { alla: 'skrocka', bra: 'skrocka', mitten: 'brynet', daligt: 'suck', inget: 'suck', pagar: 'smacka', dolt: 'brynet', ofragad: 'notan' };
  function efterat(lista, tips) {
    const e = REP().efter;
    // (en äldre rum-hasse-repliker.js i cachen har inga rader om det)
    const g = e && hurDetGick(lista, tips);
    if (!g) return;
    const rader = e[g.lage];
    const plats = g.plats === 'best' ? e.forst : g.plats === 'worst' ? e.sist : null;
    const sagt = [];
    // (en stund att läsa hur många rätt han hade, innan poängen kommer)
    if (g.ok != null) sagt.push({ text: fyll(e.ratt, { ratt: REP().tal[g.ok], av: REP().tal[g.n] }), paus: 1500 });
    sagt.push({ text: lott(plats || rader) });
    repliker(sagt, { i: $('.rh-sagt'), rad: true, direkt: calm(), sen: () => gest(EFTER_GEST[g.lage]) });
    // och efter en stund: det exakta resultatet, om han sa något, och mer om hur det gick
    const sedan = g.exakt ? [fyll(lott(e.exakt), { res: g.exakt })] : [];
    for (let i = plats ? 4 : 3; i > 0; i--) sedan.push(lott(rader));
    H.prat = { rader: sedan, i: 0, nasta: performance.now() + 20000, gang: 20000 };
  }

  // ---------- domarna efter omgången ----------
  //
  // När omgången är spelad och protokollet ligger på pulten (Rum.summa, tills nästa Stryktips kommer
  // måndagen efter kl. 16) dömer han gänget. Listan har var och ens porträtt och namn i gängets ordning, som
  // på kupongen, utan siffror. Den man väljer får sin dom slagen i disken i guld, som domen över en match,
  // några meningar om sin kupong (domar och domord i rum-hasse-repliker.js, läget i RumBlock.gang) och lappen
  // ur protokollet med kupongen och siffrorna (RumBlock.lapp). Om sig själv säger han inget här. Raderna väljs
  // efter omgången och personen, så att domen är densamma varje gång och på alla enheter.
  const summan = () => (window.Rum && Rum.summa && window.RumBlock && RumBlock.gang && REP().domar ? Rum.summa() : null);
  // Samma rad för samma nyckel: ett tal ur nyckeln, inte slumpen.
  function fast(lista, nyckel) {
    let h = 7;
    for (const c of nyckel) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return lista[h % lista.length];
  }
  const versal = (t) => t.replace(/^./, (c) => c.toUpperCase());
  // Vilka i gänget du har hört domen över, på enheten för den omgången: deras ord står i guld i listan.
  const HORT = 'profeterna.hasse.domar';
  function hort(id) {
    if (!H.hort || H.hort.id !== id) {
      let vem = [];
      try {
        const j = JSON.parse(localStorage.getItem(HORT));
        if (j && j.id === id && Array.isArray(j.vem)) vem = j.vem;
      } catch (e) { /* då har du inte hört någon */ }
      H.hort = { id, vem };
    }
    return H.hort.vem;
  }
  function hora(id, vem) {
    const v = hort(id);
    if (v.includes(vem)) return;
    v.push(vem);
    try { localStorage.setItem(HORT, JSON.stringify({ id, vem: v })); } catch (e) { /* bara den här gången */ }
  }
  // Porträttet i personens färg (som på kupongen).
  const ansikte = (p) => `<span class="rh-ans"${p.bild ? ` style="background-image: url('${esc(p.bild)}')"` : ''}></span>`;
  // Gänget i sin ordning, så att var och en står på samma plats varje omgång.
  const iOrdning = (sum) => RumBlock.gang(sum).sort((a, b) => a.hand - b.hand);
  // Säsongen till lappen (data/tippare.json, som Olympen läser) utan omgångar som spoilerskyddet döljer, eller
  // null så länge den inte är hämtad.
  function sasong() {
    if (typeof TP === 'undefined' || !TP.season) return null;
    const dold = typeof tpRoundHidden === 'function' ? tpRoundHidden : () => false;
    return (TP.season.rounds || []).filter((r) => !dold(r));
  }

  // Listan: var och ens porträtt och namn, och ordet i guld under dem man har hört om. → false om det inte finns
  // någon att döma.
  function gangLista(sum) {
    const folk = sum ? iOrdning(sum) : [];
    if (!folk.length) return false;
    const s = $('.rh-samtal');
    const r = REP();
    const h = hort(sum.id);
    s.innerHTML = '<h2 class="rh-sagt"></h2><div class="rh-gang"></div>';
    const l = s.querySelector('.rh-gang');
    for (const p of folk) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `k${p.hand}${p.none ? ' inget' : ''}`;
      const ord = h.includes(p.id) ? r.domord[p.lage] || '' : '';
      b.innerHTML = `${ansikte(p)}<span class="rh-namn">${esc(p.namn)}</span><em>${esc(ord)}</em>`;
      b.setAttribute('aria-label', ord ? `${p.namn}, ${ord}` : p.namn);
      b.addEventListener('click', () => doma(p.id));
      l.append(b);
    }
    const n = folk.filter((p) => h.includes(p.id)).length;
    rad(lott(n === folk.length ? r.domar.alla : n ? r.domar.igen : r.domar.fraga));
    H.prat = vantar(r.domar.ledig, 4, 20000);
    klick();
    return true;
  }

  // Domen: en inledning efter läget, en eller två saker ur kupongen och ett slut, en mening per rad.
  function domText(p, sum) {
    const d = REP().domar;
    const tal = (n) => REP().tal[n] || String(n);
    const mening = (lista, del, n = 0) => fyll(fast(lista, `${sum.id}:${p.id}:${del}`), { namn: p.namn, antal: tal(n), Antal: versal(tal(n)) });
    const hel = () => (p.hel && p.helRatt === p.hel ? mening(p.hel === 1 ? d.hel.en : d.hel.fler, 'hel', p.hel) : null);
    const spik = () => {
      const k = d.spik;
      if (!p.spik) return mening(k.ingen, 'spik');
      if (p.spik === 1) return mening(p.spikRatt ? k.enda : k.endaInte, 'spik');
      if (p.spikRatt === p.spik) return mening(k.alla, 'spik');
      if (!p.spikRatt) return mening(k.inga, 'spik');
      return mening(p.spikRatt === 1 ? k.en : k.fler, 'spik', p.spikRatt);
    };
    const ensam = () => mening(!p.ensam ? d.ensam.ingen : p.ensam === 1 ? d.ensam.en : d.ensam.fler, 'ensam', p.ensam);
    const fakta = {
      forsakring: [hel, () => mening(d.forsakring, 'forsakring')], forst: [ensam, spik], alla: [ensam],
      mitten: [spik], sist: [spik, ensam], sistLika: [ensam], inget: [],
    }[p.lage] || [];
    return [mening(d.in[p.lage === 'forsakring' ? 'forst' : p.lage], 'in'), ...fakta.map((f) => f()), mening(d.ut[p.lage], 'ut')].filter(Boolean);
  }

  // Du väljer någon i gänget: domen slås i disken (som i svara), texten står direkt och går att läsa upp, och
  // under den ligger lappen. Sedan nästa du inte har hört om, eller hela gänget.
  function doma(id) {
    const sum = summan();
    const folk = sum ? iOrdning(sum) : [];
    const p = folk.find((x) => x.id === id);
    if (!p) { fraga(); return; }
    const s = $('.rh-samtal');
    vakna();
    tystna();
    const vem = {};
    H.fraga = vem;
    H.fas = 'klar';
    H.prat = null;
    H.sagt = null;
    H.talMal = 0;
    hora(sum.id, p.id);
    const h = hort(sum.id);
    const i = folk.indexOf(p);
    const nasta = [...folk.slice(i + 1), ...folk.slice(0, i)].find((q) => !h.includes(q.id));
    const d = REP().domord[p.lage] || '';
    s.innerHTML = `<div class="rh-match rh-gvem k${p.hand}">${ansikte(p)}<span class="rh-namn">${esc(p.namn)}</span></div>` +
      `<div class="rh-dom vantar${d.length > 7 ? ' lang' : ''}">${esc(d)}</div>` +
      `<div class="rh-rull"><div class="rh-text"></div>${RumBlock.lapp(sum, p.id, { sasong: sasong() })}</div>` +
      `<div class="rh-slut">${nasta ? `<button type="button" class="rh-knapp huvud rh-gnasta">Nästa: ${esc(nasta.namn)}</button>` : ''}<button type="button" class="rh-knapp${nasta ? '' : ' huvud'} rh-galla">Hela gänget</button></div>`;
    const ruta = repliker(domText(p, sum).map((text, n) => ({ text, ny: n === 0 })), { i: s.querySelector('.rh-text'), direkt: true }).ruta;
    s.querySelector('.rh-rull').scrollTop = 0;
    // säsongen kommer på lappen när den är hämtad
    const vanta = !p.none && !sasong() ? datan(true) : null;
    if (vanta) {
      vanta.then(() => {
        const l = H.fraga === vem && sasong() && s.querySelector('.rd-lapp');
        if (l) l.outerHTML = RumBlock.lapp(sum, p.id, { sasong: sasong() });
      });
    }
    const dom = s.querySelector('.rh-dom');
    const visa = () => dom.classList.remove('vantar');
    const slag = ettAv('dom', 'slag');
    spela(slag, { vid: [(GEST[slag] ? GEST[slag].dom : 5) - 0.02, visa] });
    // (har han något annat i händerna står domen där ändå efter en stund)
    setTimeout(visa, 3000);
    const sist = H.ko.length ? H.ko[H.ko.length - 1] : H.klipp;
    if (Math.abs((sist ? sist.vila : H.T) - GEST.hem.vila) > 0.01) spela('hem');
    const slut = s.querySelector('.rh-slut');
    if (nasta) slut.querySelector('.rh-gnasta').addEventListener('click', () => doma(nasta.id));
    slut.querySelector('.rh-galla').addEventListener('click', () => fraga());
    lasKnapp(slut, ruta);
    klick();
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
    const fylla = K().kan();
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><h2 class="rh-sagt"></h2><p class="rh-fragan"><span class="rh-o">${esc(fragan)}</span></p>` +
      `<div class="rh-svar">${fylla ? K().rutor(m.id) : ''}<div><button type="button" class="rh-knapp huvud">${esc(lott(r.lar))}</button><button type="button" class="rh-knapp rh-gissa">${fylla ? 'Jag fyller i själv' : 'Jag gissar'}</button></div>` +
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
    if (fylla) {
      const t = svar.querySelector('.rh-tecken');
      K().kopplaRutor(t, m, (sign) => {
        // han är inte längre i färd med frågan
        H.fraga = {};
        H.prat = null;
        tystna();
        H.sagt = null;
        H.talMal = 0;
        const fr = s.querySelector('.rh-fragan');
        if (fr) fr.style.opacity = 0;
        K().vems(t, () => fyllIn(m, lista, sign, () => {
          // Lär mig står kvar där den stod, och bredvid den Alla matcher
          const g = svar.querySelector('.rh-gissa');
          if (!g || g.dataset.alla) return;
          g.dataset.alla = '1';
          const ny = g.cloneNode(false);
          ny.textContent = 'Alla matcher';
          g.replaceWith(ny);
          ny.addEventListener('click', fraga);
        }));
      });
    }
    if (!klick.detail) ja.focus({ preventScroll: true });
    analysen(m.id).then((a) => {
      if (H.fraga !== vem) return;
      rad(lott(a ? r.valLasa : r.val), () => {
        if (H.fraga !== vem) return;
        repliker([{ text: fragan }], { i: s.querySelector('.rh-fragan'), rad: true }).tid = performance.now() + 450;
      });
      // och svarar du inte säger han något om det
      H.prat = vantar(r.valVanta, 3, 18000);
    });
  }
  // Du gissar själv: tillbaka till listan, där du var.
  function gissa(m, e) {
    if (H.kupong && H.kupong.paDisken) H.kupong.borta();
    fraga();
    const l = $('.rh-lista');
    // (har omgången hunnit bli spelad står gänget där i stället)
    if (!l) return;
    l.scrollTop = H.listaTopp || 0;
    rad(lott(REP().gissar));
    if (!e.detail) {
      const b = [...l.children].find((x) => x.dataset.id === m.id);
      if (b) b.focus({ preventScroll: true });
    }
  }

  // Det han säger om matchen: hans text (eller analysen i skrift, om han inte har någon), med
  // helgarderingen först och resultatet sist.
  function hansText(a, res) {
    const egen = a.hasse && a.hasse.stycken;
    const ut = egen ? somRepliker(egen)
      : [a.lead, ...a.paragraphs, a.tip.text].filter(Boolean).map((text) => ({ text: text.replace(/\s*\[\d+(?:\s*[,;]\s*\d+)*\]/g, ''), skrift: true }));
    if (hansTecken(a).length === 3 && egen) ut.unshift({ text: REP().helgardera });
    if (res) ut.push({ text: fyll(lott(REP().resultat), { res }) });
    return ut;
  }

  // Han svarar direkt: domen, hans text och resultatet står på en gång, och sist vad han tycker om
  // det du har på kupongen. Medan man läser slår han domen i disken på ett av sina sätt, och domen
  // står i guld när handen träffar (platsen är hållen från början, så att texten står still). Läs
  // upp låter honom läsa texten (lasUpp). Också när du har bett honom titta igen.
  async function svara(m, lista) {
    const s = $('.rh-samtal');
    const vem = {};
    vakna();
    tystna();
    H.fraga = vem;
    H.prat = null;
    H.sagt = null;
    H.talMal = 0;
    const prog = prognosen(m.id);
    const a = await analysen(m.id);
    if (H.fraga !== vem) return;
    H.fas = 'klar';
    const fylla = K().kan() ? K().rutor(m.id) : '';
    if (!a || !a.tip) {
      s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><h2 class="rh-sagt"></h2><div class="rh-text"></div>${fylla}<div class="rh-slut"></div>`;
      rad(lott(REP().ejKlar));
      slutet(m, lista);
      return;
    }
    const signs = hansTecken(a);
    // sist resultatet, och efter det vad han tycker om din kupong (det sparas inte: kupongen ändras)
    const res = resultatet(await prog, signs, a);
    if (H.fraga !== vem) return;
    const texten = hansText(a, res);
    const sagt = { at: skriven(a), st: stycken(texten) };
    if (!(a.hasse && a.hasse.stycken)) texten.unshift({ text: REP().utanRost });
    // (har du inget på raden föreslår han efter det här att fylla i den, under texten)
    const om = omKupongen(m, signs);
    if (om) texten.push({ text: om });
    minnas(lista, m.id, signs, res, sagt);
    const d = domen(signs);
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><div class="rh-dom vantar${d.length > 7 ? ' lang' : ''}">${esc(d)}</div>` +
      `<div class="rh-text"></div><p class="rh-fragan"></p>${fylla}<div class="rh-slut"></div>`;
    repliker(texten, { i: s.querySelector('.rh-text'), direkt: true }).ruta.scrollTop = 0;
    const dom = s.querySelector('.rh-dom');
    const visa = () => dom.classList.remove('vantar');
    const slag = ettAv('dom', 'slag');
    // (har han något annat i händerna står domen där ändå efter en stund)
    const slaget = new Promise((ok) => {
      spela(slag, { vid: [(GEST[slag] ? GEST[slag].dom : 5) - 0.02, visa], sen: ok });
      setTimeout(visa, 3000);
      setTimeout(ok, 4500);
    });
    slutet(m, lista, signs, slaget);
  }

  // En match du redan har frågat om: det han sa står direkt, under domen, som han sa det (också
  // om analysen har skrivits om sedan dess), och sist vad han tycker om din kupong nu. Sedan
  // erbjuder han sig att titta igen, ödmjukt på sitt sätt, och säger till om analysen har skrivits
  // om sedan han sa det. Titta igen ger hela analysen (svara), Alla matcher listan.
  async function tidigare(m, lista, klick) {
    const s = $('.rh-samtal');
    const vem = {};
    const r = REP();
    H.fraga = vem;
    H.fas = 'klar';
    H.prat = null;
    vakna();
    tystna();
    H.sagt = null;
    H.talMal = 0;
    const [tecken = '', res] = String(minns(lista)[m.id] || '').split(' ');
    const signs = KORT.map((k, n) => (tecken.includes(k) ? n : -1)).filter((n) => n >= 0);
    let sagt = las(SAGT, lista)[m.id];
    const a = await analysen(m.id);
    if (H.fraga !== vem) return;
    const nu = a && a.tip ? a : null;
    // (sparat innan han sparade sin text: dagens analys, om den har samma tecken)
    if (!sagt && nu && hansTecken(nu).length === signs.length && hansTecken(nu).every((n) => signs.includes(n))) {
      sagt = { at: skriven(nu), st: stycken(hansText(nu, res)) };
      minnas(lista, m.id, signs, res, sagt);
    }
    const st = sagt ? sagt.st : res ? [fyll(lott(r.resultat), { res })] : [];
    const om = omKupongen(m, signs);
    const d = domen(signs);
    // (erbjudandet har sin plats från början, osynligt tills han säger det, som frågan i valj)
    const nytt = nu && (sagt && sagt.at ? skriven(nu) > sagt.at : !sagt);
    const erbjud = nu ? lott(nytt ? r.erbjudNytt : r.erbjud) : '';
    // (1 X 2 stort, som efter en analys: du kan fylla i eller byta, också mot det han sa)
    const fylla = K().kan();
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}?</div><div class="rh-dom${d.length > 7 ? ' lang' : ''}">${esc(d)}</div>` +
      `<div class="rh-text"></div>${nu ? `<p class="rh-fragan"><span class="rh-o">${esc(erbjud)}</span></p>` : ''}${fylla ? K().rutor(m.id) : ''}` +
      `<div class="rh-slut">${knappar(!!nu)}<a class="rh-vag" href="#match/${esc(m.id)}">Matchbladet</a></div>`;
    // (texten läses från början, också när den inte får plats: i telefonen)
    const ruta = repliker([...st, om].filter(Boolean).map((text) => ({ text })), { i: s.querySelector('.rh-text'), direkt: true }).ruta;
    ruta.scrollTop = 0;
    const slut = s.querySelector('.rh-slut');
    kopplaKnappar(slut, m, lista);
    lasKnapp(slut, ruta);
    if (fylla) {
      const t = s.querySelector('.rh-tecken');
      // (det han säger om kupongen står där erbjudandet stod, sag)
      K().kopplaRutor(t, m, (sign) => K().vems(t, () => fyllIn(m, lista, sign, null, signs)), signs.map((n) => KORT[n]));
    }
    if (klick && !klick.detail) slut.querySelector('.huvud').focus({ preventScroll: true });
    if (!nu) return;
    repliker([{ text: erbjud }], { i: s.querySelector('.rh-fragan'), rad: true }).tid = performance.now() + 700;
  }

  // Han har sagt sitt. Har du inget på raden föreslår han att fylla i det han har sagt, med hans tecken
  // i guld i rutorna, och du väljer: Fyll i den, ett eget tecken eller Alla matcher. Han tar aldrig
  // kupongen själv. Är förslaget besvarat står Titta igen och Alla matcher som efter en analys.
  // Knapparna står direkt; förslaget säger han när slaget är över (efter).
  function slutet(m, lista, signs = null, efter = null) {
    const s = $('.rh-samtal');
    const vem = H.fraga;
    H.fas = 'klar';
    // tillbaka till vilan efter det han håller på med, om det inte slutar där
    const sist = H.ko.length ? H.ko[H.ko.length - 1] : H.klipp;
    if (Math.abs((sist ? sist.vila : H.T) - GEST.hem.vila) > 0.01) spela('hem');
    const slut = s.querySelector('.rh-slut');
    const ruta = s.querySelector('.rh-text');
    const t = s.querySelector('.rh-tecken');
    const han = (signs || []).map((n) => KORT[n]);
    const blad = `<a class="rh-vag" href="#match/${esc(m.id)}">Matchbladet</a>`;
    const svaren = (fokus = false) => {
      slut.innerHTML = `${knappar(han.length > 0)}${blad}`;
      kopplaKnappar(slut, m, lista);
      if (han.length) lasKnapp(slut, ruta);
      if (fokus) slut.querySelector('.huvud').focus({ preventScroll: true });
    };
    // (en äldre rum-hasse-kupong.js i cachen har inget förslag)
    let forslag = Boolean(t && han.length && K().foreslar && REP().fyller.foreslar && K().foreslar(m.id));
    if (forslag) {
      slut.innerHTML = `<button type="button" class="rh-knapp huvud rh-fyll">Fyll i den</button><button type="button" class="rh-knapp rh-alla">Alla matcher</button>${blad}`;
      slut.querySelector('.rh-alla').addEventListener('click', fraga);
      slut.querySelector('.rh-fyll').addEventListener('click', (e) => {
        forslag = false;
        svaren(!e.detail);
        // (och vet kupongen inte vem du är frågar han först)
        K().vems(t, () => {
          if (H.fraga !== vem) return;
          const sagt = lott(han.length > 1 ? REP().fyller.gardera : REP().fyller.skriver[han[0]]);
          // (står det redan något på raden, på kupongen du just valde, säger han vad han tycker om det)
          if (!K().sjalv(m.id, han, { sagt, tok: () => H.fraga === vem })) {
            const om = omKupongen(m, signs);
            if (om) sag(om);
          }
        });
      });
      lasKnapp(slut, ruta);
      // (texten ska läsas från början: förslaget rullar den inte till slutet, i telefonen; och läser han
      // upp den säger han förslaget när han har läst klart)
      const foresla = () => {
        if (!forslag || H.fraga !== vem) return;
        if (laser(ruta)) {
          const x = H.sagt;
          const f = x.sen;
          x.sen = () => { if (f) f(); foresla(); };
          return;
        }
        sag(lott(REP().fyller.foreslar), null, false);
      };
      if (efter) efter.then(foresla);
      else foresla();
    } else svaren();
    if (!t) return;
    K().kopplaRutor(t, m, (sign) => {
      // väljer du själv är förslaget besvarat
      if (forslag) { forslag = false; svaren(); }
      K().vems(t, () => fyllIn(m, lista, sign, null, signs));
    }, han);
  }
  // Du väljer ett tecken: han tar kupongen (om han inte redan har den) och skriver det. Har han sagt något
  // annat i analysen (dom) svarar han på det.
  function fyllIn(m, lista, sign, sen = null, dom = null) {
    const r = REP().fyller;
    const vem = H.fraga;
    const f = minns(lista)[m.id];
    const hans = dom ? dom.map((n) => KORT[n]) : f ? f.split(' ')[0].replace(/[^1X2]/g, '').split('') : null;
    const sagt = hans ? lott(hans.includes(sign) ? r.medhall : r.emot) : lott(r.skriver[sign]);
    K().valt(m.id, sign, { sagt, suddat: lott(r.suddar), tok: () => H.fraga === vem, sen });
  }
  // Svaren när han har sagt sitt: Titta igen (hela analysen en gång till) först, där den finns,
  // och Alla matcher (listan) bredvid. Står Alla matcher ensam är det den man väntar på.
  const knappar = (igen) => (igen ? '<button type="button" class="rh-knapp huvud rh-igen">Titta igen</button>' : '') +
    `<button type="button" class="rh-knapp${igen ? '' : ' huvud'} rh-alla">Alla matcher</button>`;
  function kopplaKnappar(slut, m, lista) {
    const igen = slut.querySelector('.rh-igen');
    if (igen) igen.addEventListener('click', () => svara(m, lista));
    slut.querySelector('.rh-alla').addEventListener('click', fraga);
  }
  // Det han säger om kupongen: överst, på raden direkt ovanför svaren när den syns (en match du
  // redan har frågat om: där han erbjöd sig att titta igen; efter en analys: under texten), eller
  // sist i texten (i telefonen), som rullas fram dit om inte rulla är false.
  function sag(text, sen = null, rulla = true) {
    const r = $('.rh-sagt');
    const f = $('.rh-samtal .rh-fragan');
    const tx = $('.rh-text');
    if (r) rad(text, sen);
    else if (f && f.offsetParent) repliker([{ text }], { i: f, sen, rad: true });
    else if (tx) {
      if (rulla) tx.scrollTop = tx.scrollHeight;
      repliker([{ text }], { i: tx, sen, direkt: calm() });
    }
  }
  // Din kupong hos honom (rum-hasse-kupong.js)
  function K() {
    if (!H.kupong) H.kupong = window.RumHasseKupong({ H, $, calm, spela, sag, lott, REP, ljud: hands });
    return H.kupong;
  }

  // Ett klick på bilden, utanför samtalet, går härifrån (som Esc), och under en match går ett
  // klick i samtalet framåt.
  function klick() {
    if (H.klickar) return;
    H.klickar = true;
    H.vy.addEventListener('click', (e) => {
      // kupongen i handen: ett klick tar den med sig
      if (H.kupong && H.kupong.klickUtanfor(e)) { e.stopImmediatePropagation(); return; }
      // (lappen under en dom är till för att titta på)
      if (H.fas === 'fraga' || e.target.closest('a, button, .rh-kupong, .rd-lapp') || !e.target.closest('.rh-samtal')) return;
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

  return { oppna, stang, repliker, framat, hoppa, gester: GEST, fjarran };
})();
