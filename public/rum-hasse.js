// Hasse Backe i tobaksaffären: en arm på pulten bredvid hans kaffe (rum.js), han
// står precis utanför bilden. Ett klick (eller H) och kameran svänger åt vänster,
// och där står han bakom disken (rum-hasse-3d.js). Fiktivt, och det står i foten.
//
// Rummet rörs inte: tobaksaffärens scen läggs i två omslag (.rum-sving och
// .rum-front), som saknar omvandling tills kameran svänger. Under svängen och
// medan han syns står rummet still (Rum.vila): gänget och sakerna ritas inte. Det
// ligger kvar bakom honom, så att inget behöver ritas om på vägen tillbaka, och
// när man har gått tillbaka en stund lämnas figurens grafik tillbaka.
//
// ?rum-hasse öppnar direkt (för bilder).
window.RumHasse = (() => {
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
    const vy = document.createElement('div');
    vy.className = 'rum-hasse-vy';
    vy.id = 'rum-hasse-vy';
    vy.hidden = true;
    vy.setAttribute('aria-label', 'Hasse Backe');
    vy.innerHTML = '<div class="rh-scen"><img alt="" draggable="false"><canvas></canvas></div><div class="rh-samtal"></div>' +
      '<div class="rh-fot"><span>Hasse Backe (fiktiv). Foto <a href="https://commons.wikimedia.org/wiki/File:Hasse_Backe_2013-03-26_001.jpg" target="_blank" rel="noopener">C More Entertainment</a>, CC BY 3.0, bearbetat</span><button type="button" class="rh-tillbaka">Tillbaka</button></div>';
    sving.append(vy);
    H.vy = vy;
    // det som händer i samtalet stannar där (knapparna byter ut sig själva)
    vy.querySelector('.rh-samtal').addEventListener('click', (e) => e.stopPropagation());
    // i hans vy är det han som gäller: inget når rummets svep och klick
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'mouseover', 'wheel', 'touchstart', 'touchmove']) vy.addEventListener(n, (e) => e.stopPropagation());
    vy.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('.rh-tillbaka') || !e.target.closest('a')) stang();
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
      const m = await import('./rum-hasse-3d.js');
      H.m = m;
      H.pulten = m.pulten(plan, { smal: smal(), pr: latt() ? 1.5 : Math.min((devicePixelRatio || 1) * 1.25, 2.5) });
      // Pekar man på kaffet och notan (rum.js) trummar han, och hans bilder hämtas.
      const kaffe = H.rum.querySelector('#rum-hasse');
      if (kaffe) kaffe.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && ledigt()) { H.pulten.trumma(); forladda(); } });
      // I telefonen ligger kaffet utanför bilden: där är det handen man trycker på.
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rum-hasse-knapp';
      b.setAttribute('aria-label', 'Hasse Backe');
      plan.append(b);
      b.addEventListener('click', (e) => {
        if (!ledigt()) return;
        e.stopPropagation();
        e.preventDefault();
        oppna();
      });
      addEventListener('resize', () => H.pulten.satt(smal()));
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

  function passa() {
    const L = H.m.SCEN[H.hog ? 'hog' : 'bred'];
    const vw = innerWidth;
    const vh = innerHeight;
    const k = Math.max(vw / L.W, vh / L.H);
    const mal = H.hog ? 0.5 : 0.36;
    const tx = Math.min(0, Math.max(vw - L.W * k, vw * mal - L.px * k));
    const ty = H.hog ? 0 : Math.max(vh - L.H * k, 0 - (L.H * k - vh) * 0.8);
    const sc = $('.rh-scen');
    Object.assign(sc.style, { width: `${L.W}px`, height: `${L.H}px`, transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(4)})` });
    const c = sc.querySelector('canvas');
    Object.assign(c.style, { left: `${L.duk.x}px`, top: `${L.duk.y}px`, width: `${L.duk.w}px`, height: `${L.duk.h}px` });
    if (H.hog) $('.rh-samtal').style.top = `${(ty + 828 * k).toFixed(0)}px`;
    else $('.rh-samtal').style.top = '';
    H.rum.style.setProperty('--p', `${vw / 2}px`);
    H.k = k;
  }

  async function bygg() {
    H.hog = hog();
    H.vy.classList.toggle('hog', H.hog);
    H.m = H.m || await import('./rum-hasse-3d.js');
    await Promise.all(forladda());
    $('.rh-scen img').src = bakbild();
    passa();
    if (!H.fig) {
      const c = $('.rh-scen canvas');
      const pr = Math.min(H.k * (devicePixelRatio || 1), latt() ? 1.6 : 2);
      H.fig = await H.m.figuren(c, { hog: H.hog, latt: latt(), pr });
    }
  }

  async function oppna() {
    if (H.on || H.oppnar) return;
    H.oppnar = true;
    clearTimeout(H.ner);
    if (H.pulten && !calm()) H.pulten.trumma();
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
    r.classList.add('hasse-svang');
    void r.offsetWidth;
    if (calm()) { framme(); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      r.classList.add('hasse-vand');
      const s = r.querySelector('.rum-sving');
      const klar = (e) => { if (e.target === s) { s.removeEventListener('transitionend', klar); clearTimeout(H.sv); framme(); } };
      s.addEventListener('transitionend', klar);
      H.sv = setTimeout(() => { s.removeEventListener('transitionend', klar); framme(); }, 1100);
    }));
  }

  // framme: inget 3D kvar, rummet ur bild, och han börjar röra sig
  function framme() {
    const r = H.rum;
    r.classList.remove('hasse-svang', 'hasse-vand');
    r.classList.add('hasse-framme');
    H.last = null;
    H.t0 = performance.now();
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
      // 30 bilder i sekunden räcker när han bara står och andas
      const ror = H.klipp || H.ko.length || (H.sagt && !H.sagt.klar);
      if (!ror && ms - last < 30) return;
      const dt = last ? Math.min(0.1, (ms - last) / 1000) : 0;
      last = ms;
      figurSteg(dt);
      pratSteg(ms);
      talSteg(ms);
      H.tal += (H.talMal - H.tal) * Math.min(1, dt * 12);
      H.fig.rita(H.T, ms / 1000, H.tal, H.tal);
    };
    H.raf = requestAnimationFrame(tick);
  }

  async function stang() {
    if (!H.on) return;
    H.on = false;
    H.fraga = null;
    cancelAnimationFrame(H.raf);
    const r = H.rum;
    r.classList.remove('hasse-framme');
    if (calm()) { hemma(); return; }
    r.classList.add('hasse-svang', 'hasse-vand');
    void r.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      r.classList.remove('hasse-vand');
      const s = r.querySelector('.rum-sving');
      const klar = (e) => { if (e.target === s) { s.removeEventListener('transitionend', klar); clearTimeout(H.sv); hemma(); } };
      s.addEventListener('transitionend', klar);
      H.sv = setTimeout(() => { s.removeEventListener('transitionend', klar); hemma(); }, 1100);
    }));
  }

  function hemma() {
    if (window.Rum && Rum.vila) Rum.vila(false);
    H.rum.classList.remove('hasse-svang', 'hasse-vand', 'hasse-framme');
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
  // frågar, man väljer en match, han svarar direkt och pratar medan analysen tas
  // fram, slår i disken med domen och säger texten en mening i taget. Sist säger
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
      b.addEventListener('click', () => svara(m, lista));
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
