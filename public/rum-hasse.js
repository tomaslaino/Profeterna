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
  const H = { on: false, rum: null, fig: null, last: null, t0: 0, T: 0, raf: 0, vant: 0 };
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
      H.bilder = [bakbild(), 'rum/hasse-foto.webp'].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); });
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
      const ror = H.spelar;
      if (!ror && ms - last < 30) return;
      const dt = last ? Math.min(0.1, (ms - last) / 1000) : 0;
      last = ms;
      if (ror) {
        if (H.fas === 'dom') {
          H.T = Math.min(5.5, H.T + dt);
          scenen(H.T);
        } else if (H.fas === 'tal') {
          // pratar med handen på disken; vartannat stycke en gest
          H.T = H.T < 5.5 ? H.T + dt : H.T;
          const kvar = nastaStycke(ms);
          const x = H.tala;
          if (H.T >= 5.5 && (x.gestar || (x.gest && x.gjord !== x.i))) {
            x.gestar = true;
            x.gjord = x.i;
            H.T += dt;
            if (H.T >= 9.95) { H.T = 5.5; x.gestar = false; }
          }
          H.tal = H.T === 5.5 ? Math.min(1, H.tal + dt * 4) : 0;
          if (!kvar && !x.gestar) { H.fas = 'hem'; H.T = 9.95; H.tal = 0; slutet(); }
        } else if (H.fas === 'hem') {
          H.T += dt;
          if (H.T >= H.fig.tid) { H.T = 0; H.spelar = false; H.fas = 'klar'; }
        }
      }
      H.fig.rita(H.T, ms / 1000, H.tal || 0);
    };
    H.raf = requestAnimationFrame(tick);
  }

  async function stang() {
    if (!H.on) return;
    H.on = false;
    H.spelar = false;
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
  // Man ber honom bara analysera en match på kupongen. Först artikeln och tipset
  // som vanligt (POST …/artikel, som i matchbladet), sedan hans röst (POST
  // …/hasse, worker/hasse.mjs). Finns de redan går det direkt. Tecknen kommer ur
  // tipset. Går hans röst inte att få står analysen som den är.
  const TECKEN = ['Etta', 'Kryss', 'Tvåa'];
  function domen(signs) {
    const s = [...signs].sort();
    return s.length === 3 ? 'Helgardera.' : `${s.map((n, i) => (i ? TECKEN[n].toLowerCase() : TECKEN[n])).join(', ')}.`;
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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

  function fraga() {
    const s = $('.rh-samtal');
    H.fraga = {};
    H.fas = 'fraga';
    H.spelar = false;
    H.T = 0;
    H.tal = 0;
    const lista = kupongen();
    const nu = Date.now();
    s.innerHTML = '<h2>Vilken match?</h2><div class="rh-lista"></div>';
    const l = s.querySelector('.rh-lista');
    lista.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<i>${i + 1}</i>${esc(m.namn)}`;
      b.disabled = Date.parse(m.avspark) <= nu;
      b.addEventListener('click', () => svara(m));
      l.append(b);
    });
  }

  async function svara(m) {
    const s = $('.rh-samtal');
    const vem = {};
    H.fraga = vem;
    H.fas = 'tanker';
    s.innerHTML = `<div class="rh-match">${esc(m.namn)}</div><div class="rh-rad rh-klocka">Det är lugnt.</div>`;
    const klocka = s.querySelector('.rh-klocka');
    const t0 = Date.now();
    const ur = setInterval(() => {
      const t = Math.floor((Date.now() - t0) / 1000);
      if (t >= 5) klocka.textContent = `Det är lugnt. ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    }, 1000);
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
    } finally {
      clearInterval(ur);
    }
    if (H.fraga !== vem) return;
    if (fel) {
      s.innerHTML = `<div class="rh-match">${esc(m.namn)}</div><div class="rh-rad">${esc(fel)}</div><button type="button" class="rh-nasta">Nästa match</button>`;
      s.querySelector('.rh-nasta').addEventListener('click', fraga);
      return;
    }
    const a = art.article;
    const stycken = has && has.ok && has.hasse ? has.hasse.stycken : [a.lead, ...a.paragraphs, a.tip.text].filter(Boolean).map((t) => t.replace(/\s*\[\d+(?:\s*[,;]\s*\d+)*\]/g, ''));
    tala(m, a, stycken);
  }

  // Domen, och sedan texten stycke för stycke medan han pratar.
  function tala(m, a, stycken) {
    H.tala = { m, a, stycken, i: 0, nasta: 0, gest: false };
    H.fas = 'dom';
    H.T = 2.5;
    H.spelar = true;
    H.tal = 0;
    H.dom = false;
  }
  function scenen(t) {
    const x = H.tala;
    const s = $('.rh-samtal');
    if (H.fas === 'dom' && t > 2.85 && !H.dom) {
      H.dom = 1;
      s.innerHTML = `<div class="rh-match rh-tona">${esc(x.m.namn)}</div>`;
    }
    if (H.fas === 'dom' && t > 4.98) {
      H.fas = 'tal';
      const d = domen(x.a.tip.signs);
      s.innerHTML = `<div class="rh-match">${esc(x.m.namn)}</div><div class="rh-dom${d.length > 7 ? ' lang' : ''}">${esc(d)}</div><div class="rh-text"></div>`;
      s.querySelector('.rh-text').addEventListener('click', () => { x.nasta = 0; x.allt = true; });
      if (!calm()) { const v = H.vy.querySelector('.rh-scen'); v.classList.remove('rh-slag'); void v.offsetWidth; v.classList.add('rh-slag'); }
    }
  }
  function nastaStycke(ms) {
    const x = H.tala;
    const t = H.rum.querySelector('.rh-text');
    if (!x || !t || x.i >= x.stycken.length) return false;
    if (ms < x.nasta && !x.allt) return true;
    do {
      const p = document.createElement('p');
      p.textContent = x.stycken[x.i++];
      t.append(p);
    } while (x.allt && x.i < x.stycken.length);
    // följer med om man inte själv har rullat tillbaka
    t.scrollTop = t.scrollHeight;
    x.nasta = ms + Math.max(2500, (x.stycken[x.i - 1].length / 34) * 1000);
    x.gest = !x.gest;
    return true;
  }
  function slutet() {
    const x = H.tala;
    const s = $('.rh-samtal');
    if (!x || s.querySelector('.rh-nasta')) return;
    const f = document.createElement('div');
    f.className = 'rh-slut';
    f.innerHTML = `<button type="button" class="rh-nasta">Nästa match</button><a href="#match/${esc(x.m.id)}">Matchbladet</a>`;
    f.querySelector('.rh-nasta').addEventListener('click', fraga);
    s.append(f);
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

  return { oppna, stang };
})();
