'use strict';

// ---------- gänget i bild på tv:n ----------
//
// Under samtalet (telefon.js) syns de som visar sig på tv:n uppe i hörnet i
// tobaksaffären (rum-tv.js): tv:ns AV-ingång, som när man kopplade in en
// videokamera. Rösten går i samtalet; här är bara bilden.
//
//  – Visar sig någon i samtalet byter tv:n till AV av sig själv, med ett
//    ögonblick snö som när man bytte kanal, så att man ser hen direkt (också på
//    håll: rutan lyser då fullt). Slutar alla visa sig går tv:n tillbaka till
//    text-tv:n. Likadant när du själv visar dig.
//  – Den som visar sig står stort på rutan, två bredvid varandra, med namnet vi
//    kallas (Tippoang.kallas) i sin färg nere i hörnet. Man ser sig själv i en
//    liten bild nere till höger (bild i bild), spegelvänd som i en spegel – eller
//    stort när ingen annan visar sig, med vilka i samtalet som ser en under.
//  – Den blå rutan när ingen bild finns säger vad man kan göra, med samma ord
//    som brickan (telefon.js), och det är knappar: Ring gänget, Svara (Tejder
//    ringer), Gå med (ett samtal pågår) eller Visa dig på tv:n (du är med).
//    Kameran tänds och släcks annars i brickan.
//  – TV/AV i knappsatsen och Gänget i bild på 300 byter mellan text-tv:n och
//    AV; en sida, en siffra eller ▲ ▼ går tillbaka till text-tv:n (rum-tv.js).
//  – Ta med tv:n (i foten nära tv:n): man går till den vanliga sidan, och tv:n
//    krymper till en liten tv uppe till höger som följer med vart man än går på
//    sajten. Den visar tv:ns egen ruta – text-tv:n, som går vidare, eller AV –
//    och byter till AV när någon visar sig, som i rummet. Ett tryck på den lilla
//    tv:n går tillbaka till tv:n i rummet, och krysset stänger den (samtalet och
//    kameran fortsätter: de är brickans). Till Tabeller, Statistik och Om oss,
//    som är egna sidor, följer den med genom sessionStorage
//    (profeterna.tv.foljer, tv-med.js laddar det som behövs där); text-tv:n finns
//    bara på förstasidan, så där syns den lilla tv:n bara med AV.
//
//   RumBild.mount(el, { tv })   när tv:n är byggd (rum.js); tv = RumTv.mount(…)
//   RumBild.on(true | false)    rummet visas eller inte
//   RumBild.avVal(on)           den som tittar bytte själv på tv:n (TV/AV, en sida …)
//   RumBild.foljer()            tv:n följer med utanför rummet (den lilla tv:n)
//   RumBild.knapp()             tv:n slogs av eller på (Ta med tv:n i foten)
//   RumBild.syns()              syns bilden från samtalet på en tv just nu? (telefon.js)

window.RumBild = (() => {
  // tv:n följer med till en annan sida på sajten ({ t, visa }), och ett tryck på
  // den lilla tv:n där som ska fram till tv:n i rummet (sessionStorage)
  const FOLJER = 'profeterna.tv.foljer';
  const TILL_TV = 'profeterna.tv.till';
  const ATER = 10 * 60 * 1000;

  const B = {
    el: null, tv: null, tamed: null,
    // ute: tv:n följer med utanför rummet (mini: den lilla tv:n), tamed: Ta med tv:n
    // trycktes nyss (fran: var tv:n stod), tillTv: fram till tv:n när rummet visas,
    // ram: där tv:ns ruta sitter i tv:n
    ute: false, mini: null, inne: null, tamedNu: false, fran: null, tillTv: false, ram: null,
    on: false, visa: false, sett: new Set(), forut: false, video: new Map(), ritaT: 0, lyssnar: false,
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ord = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} och ${xs[xs.length - 1]}` : xs[0] || '');
  const T = () => window.Telefon || null;
  // (en gång: samtalet säger till när något ändras)
  function lyssna() {
    if (B.lyssnar || !T()) return;
    B.lyssnar = true;
    T().pa(ordna);
  }

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

  // Läget efter en ändring i samtalet: tv:n byter till AV när någon ny visar sig
  // (eller du själv), och tillbaka när ingen gör det längre.
  function ordna() {
    const tel = T();
    if (!tel) return;
    const L = tel.lage();
    const sander = L.med ? L.andra.filter((p) => p.kamera) : [];
    const nya = sander.filter((p) => !B.sett.has(p.id));
    for (const id of [...B.sett]) if (id !== 'jag' && !sander.some((p) => p.id === id)) B.sett.delete(id);
    for (const p of nya) B.sett.add(p.id);
    const egen = Boolean(L.kam);
    if (egen && !B.sett.has('jag')) nya.push('jag');
    if (egen) B.sett.add('jag');
    else B.sett.delete('jag');
    const nu = sander.length > 0 || egen;
    // (med tv:n som följer med: inte medan förbindelsen till tjänsten är nere –
    // då vet den inte om någon slutade, och den lilla tv:n ska inte slockna av det)
    const vet = L.uppe || !B.ute;
    if ((B.on || B.ute) && (B.tv || B.ute)) {
      if (nya.length && !B.visa) {
        B.visa = true;
        if (B.tv) B.tv.av(true);
      } else if (vet && !nu && B.forut && B.visa && !L.kamFel) {
        B.visa = false;
        if (B.tv) B.tv.av(false);
      }
    }
    if (vet) B.forut = nu;
    rita(L, sander);
    knapp();
    if (B.ute) miniLage();
  }

  function videon(id, strom) {
    let v = B.video.get(id);
    if (!v) {
      v = document.createElement('video');
      v.autoplay = true;
      v.muted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('aria-hidden', 'true');
      B.video.set(id, v);
    }
    if (v.srcObject !== strom) {
      v.srcObject = strom;
      if (strom) v.play().catch(() => {});
    }
    return v;
  }

  function rita(L, sander) {
    const av = B.inne;
    const tel = T();
    if (!av || !tel) return;
    const n = sander.length;
    av.classList.toggle('jag-pa', Boolean(L.kam));
    av.dataset.n = String(n);
    // de som visar sig: en ruta var, sida vid sida
    const box = av.querySelector('.av-rutor');
    const finns = new Set();
    sander.forEach((p, i) => {
      finns.add(p.id);
      let r = box.querySelector(`.av-ruta[data-id="${p.id}"]`);
      if (!r) {
        r = document.createElement('div');
        r.dataset.id = p.id;
        r.innerHTML = '<i class="av-sno"></i><b class="av-namn"></b><b class="av-tappad">Ingen kontakt</b>';
        box.append(r);
      }
      const v = videon(p.id, p.strom);
      if (v.parentNode !== r) r.prepend(v);
      r.className = `av-ruta k${tel.nr(p.vem)}${p.bild ? '' : ' letar'}${p.tappad ? ' tappad' : ''}`;
      r.style.cssText = n === 1 ? 'left:0;top:0;width:100%;height:100%' : `left:${(100 / n) * i}%;top:0;width:${100 / n}%;height:100%`;
      const namn = r.querySelector('.av-namn');
      if (namn.textContent !== tel.namn(p.vem)) namn.textContent = tel.namn(p.vem);
    });
    for (const r of [...box.querySelectorAll('.av-ruta')]) {
      if (finns.has(r.dataset.id)) continue;
      r.remove();
      const v = B.video.get(r.dataset.id);
      if (v) v.srcObject = null;
      B.video.delete(r.dataset.id);
    }
    // du själv: liten nere till höger, eller stor när ingen annan visar sig
    const egen = av.querySelector('.av-jag');
    const ev = egen.querySelector('video');
    if (L.kam) {
      if (ev.srcObject !== L.kam) {
        ev.srcObject = L.kam;
        ev.play().catch(() => {});
      }
      egen.hidden = false;
      egen.classList.toggle('stor', !n);
    } else {
      egen.hidden = true;
      if (ev.srcObject) ev.srcObject = null;
    }
    // (letar en förbindelse ritas rutan om när tiden har gått: Ingen kontakt)
    clearTimeout(B.ritaT);
    if (sander.some((p) => !p.bild)) B.ritaT = setTimeout(ordna, 2000);
    const under = av.querySelector('.av-under');
    const ser = [...new Set(L.andra.map((p) => tel.namn(p.vem)))];
    under.textContent = L.kam && !n ? (ser.length ? `${ord(ser)} ser dig` : 'Ingen annan i samtalet') : '';
    under.hidden = !under.textContent;
    // den blå rutan: ingen bild att visa, och vad man kan göra
    const bla = av.querySelector('.av-bla');
    bla.hidden = Boolean(n || L.kam);
    if (!bla.hidden) {
      const val = (t, text) => `<p class="av-text"><button type="button" class="av-val" data-tel="${t}">${esc(text)}</button></p>`;
      const s = L.samtal;
      let h;
      if (!L.kan) h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Går inte i den här webbläsaren.</p>';
      else if (!L.finns) h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Samtalet går inte att nå just nu.</p>';
      else if (L.kamFel) h = `<p class="av-rubrik">Gänget i bild</p><p class="av-text">${esc(L.kamFel)}</p>${val('kamera', 'Försök igen')}`;
      else if (L.kamStartar) h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Kameran startar …</p>';
      else if (L.med) h = `<p class="av-rubrik">Ingen i bild</p>${val('kamera', 'Visa dig på tv:n')}`;
      else if (L.vill) h = `<p class="av-rubrik">${s && s.med.length > 1 ? 'Kopplar …' : 'Ringer …'}</p>`;
      else if (L.ringer) h = `<p class="av-rubrik">${esc(tel.namn(s.av))} ringer</p>${val('svara', 'Svara')}`;
      else if (s && s.med.length) h = `<p class="av-rubrik">Samtal pågår</p>${val('svara', 'Gå med')}`;
      else h = `<p class="av-rubrik">Gänget i bild</p>${val('ring', 'Ring gänget')}`;
      if (bla.dataset.h !== h) {
        bla.dataset.h = h;
        bla.innerHTML = h;
      }
    }
  }

  // Ta med tv:n står i foten nära tv:n när den är på.
  function knapp() {
    if (B.tamed) B.tamed.hidden = !(B.tv && B.tv.pa());
  }

  // ---------- rutan ----------

  // Det som står på rutan: i tv:n i rummet, eller i den lilla tv:n när tv:n
  // följer med (plats). Videorna flyttas med och spelar vidare.
  function inne() {
    if (B.inne) return B.inne;
    const d = document.createElement('div');
    d.className = 'av-inne';
    d.innerHTML = '<div class="av-rutor"></div><div class="av-jag" hidden><video autoplay muted playsinline aria-hidden="true"></video></div>' +
      '<p class="av-under" hidden></p><div class="av-bla"></div><b class="av-osd" aria-hidden="true">AV</b>';
    const ev = d.querySelector('.av-jag video');
    ev.muted = true;
    ev.playsInline = true;
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tel]');
      const tel = T();
      if (!b || !tel) return;
      e.preventDefault();
      e.stopPropagation();
      const t = b.dataset.tel;
      if (t === 'kamera') tel.kamera(true);
      else if (t === 'svara') tel.svara();
      else if (t === 'ring') tel.ring();
    });
    B.inne = d;
    return d;
  }
  // Tv:ns ruta (text-tv:n och AV) sitter i tv:n, och i den lilla tv:n när den
  // följer med. Finns ingen tv på sidan (Tabeller, Statistik och Om oss) har den
  // lilla tv:n en egen ruta med bara AV.
  function plats() {
    const d = inne();
    const ute = B.ute && !B.on;
    const g = B.tv && B.tv.glas;
    if (g) {
      if (d.parentNode !== B.tv.avEl) B.tv.avEl.append(d);
      const ram = ute ? mini().querySelector('.tv-ram') : B.ram;
      if (g.parentNode !== ram) ram.append(g);
      if (B.mini) B.mini.querySelector('.tv-glas.egen').hidden = ute;
      B.tv.ute(ute);
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

  // Syns bilden från samtalet på en tv just nu? Då behöver brickan inte visa den
  // (telefon.js). Tv:n i rummet räknas när den syns så stor att man ser vem som
  // är i bild – i datorn står den uppe till höger, i telefonen på höjden utanför
  // bilden tills man tar fram den – och den lilla tv:n när den visar AV.
  function syns() {
    if (B.ute && !B.on) return Boolean(B.mini && oppen(B.mini) && B.visa && !B.mini.classList.contains('slocknar'));
    if (!B.on || !B.tv || !B.tv.glas) return false;
    const r = B.tv.glas.getBoundingClientRect();
    return r.width > 110 && r.left > -r.width / 3 && r.right < innerWidth + r.width / 3 && r.top > -r.height / 3 && r.bottom < innerHeight + r.height / 3;
  }

  // ---------- tv:n som följer med ----------
  //
  // Den lilla tv:n uppe till höger, under sidhuvudet: samma Panasonic som i
  // rummet utan panelen med knapparna (rum-tv.css). Ett tryck på den går till
  // tv:n i rummet, krysset stänger den. Den ligger i det översta lagret
  // (popover), så att den syns också över matchrutan.

  const pop = (m) => typeof m.showPopover === 'function';
  const oppen = (m) => (pop(m) ? m.matches(':popover-open') : !m.hidden);
  function oppna(m, on2) {
    if (on2 === oppen(m)) return;
    if (!pop(m)) m.hidden = !on2;
    else if (on2) m.showPopover();
    else m.hidePopover();
  }
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
    m.querySelector('.tv-mini-in').addEventListener('click', tillbaka);
    m.querySelector('.tv-mini-x').addEventListener('click', (e) => {
      e.stopPropagation();
      sluta(true);
    });
    document.body.append(m);
    B.mini = m;
    // under sidhuvudet, och uppåt med det när det skrollas undan i telefonen
    let f = 0;
    const topp = B.toppNu = () => {
      f = 0;
      const t = document.querySelector('.topbar');
      let y = t && getComputedStyle(t).position !== 'static' ? Math.max(0, t.getBoundingClientRect().bottom) : 0;
      // (samtalets bricka står överst i mitten, telefon.js: i telefonen står den lilla tv:n under den)
      const br = document.getElementById('tel-bricka');
      if (br && (br.matches(':popover-open') || (!br.popover && !br.hidden))) {
        const r = br.getBoundingClientRect();
        const mr = m.getBoundingClientRect();
        if (r.width && r.right > mr.left - 6 && r.left < mr.right + 6) y = Math.max(y, r.bottom - 4);
      }
      m.style.setProperty('--topp', `${Math.round(y)}px`);
    };
    B.topp = () => { if (!f) f = requestAnimationFrame(topp); };
    addEventListener('scroll', () => { if (B.ute) B.topp(); }, { passive: true });
    addEventListener('resize', () => { if (B.ute) B.topp(); });
    addEventListener('tel-bricka', () => { if (B.ute) B.topp(); });
    if (pop(m)) new MutationObserver((ms) => { if (ms.some((x) => x.target.tagName === 'DIALOG')) miniVard(); }).observe(document.body, { subtree: true, attributeFilter: ['open'] });
    return m;
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
    const syns2 = oppen(m) || m.parentNode !== hem;
    if (m.parentNode === hem && !modal) return;
    // (en popover som flyttas stängs, och läggs överst när den öppnas igen)
    if (oppen(m)) m.hidePopover();
    if (m.parentNode !== hem) hem.append(m);
    if (syns2 && B.ute && !B.on) {
      m.showPopover();
      for (const v of m.querySelectorAll('video')) if (v.srcObject) v.play().catch(() => {});
    }
  }
  // Fram: krymp = från tv:n i rummet (Ta med tv:n), annars tänds den som en tv.
  function miniFram(hur) {
    const m = mini();
    const syns2 = oppen(m) && !m.classList.contains('slocknar');
    // (bara det som miniFram och miniBort har satt igång, inte stilens egna)
    for (const e of [m, m.querySelector('.tv-ram')]) for (const a of e.getAnimations()) if (!a.animationName && !a.transitionProperty) a.cancel();
    m.classList.remove('slocknar');
    B.toppNu();
    lampa();
    oppna(m, true);
    miniVard();
    if (syns2 || calm()) return;
    const fran = hur === 'krymp' && B.fran;
    B.fran = null;
    const r = m.getBoundingClientRect();
    if (fran && fran.width > 40 && r.width) {
      // (tv:ns front i rummet är bredare: panelen med knapparna sitter till höger om rutan)
      const k = (fran.width * (238 / 292)) / r.width;
      m.animate([
        { transform: `translate(${fran.left - r.left}px, ${fran.top - r.top}px) scale(${k})`, boxShadow: 'none' },
        { transform: 'none' },
      ], { duration: 560, easing: 'cubic-bezier(0.3, 0, 0.15, 1)' });
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
  const skaSynas = () => B.ute && !B.on && (B.visa || Boolean(B.tv));
  function miniLage() {
    if (!B.ute || B.on) return;
    const m = mini();
    lampa();
    const s = skaSynas();
    if (s && (!oppen(m) || m.classList.contains('slocknar'))) miniFram('tands');
    else if (!s && oppen(m) && !m.classList.contains('slocknar')) miniBort(true);
  }
  // Den lilla tv:ns lampa: röd medan kameran är tänd.
  function lampa() {
    const tel = T();
    if (B.mini) B.mini.classList.toggle('sander', Boolean(tel && tel.egen()));
  }

  const minns = () => {
    try { sessionStorage.setItem(FOLJER, JSON.stringify({ t: Date.now(), visa: B.visa })); } catch { /* privat läge */ }
  };
  const glom = () => {
    try { sessionStorage.removeItem(FOLJER); } catch { /* privat läge */ }
  };

  // Ta med tv:n: till den vanliga sidan, med tv:n i hörnet (on(false) tar över).
  function taMed() {
    if (!B.on || !B.tv) return;
    const f = document.getElementById('rum-tvfront');
    B.fran = f ? f.getBoundingClientRect() : null;
    B.tamedNu = true;
    setTimeout(() => { B.tamedNu = false; }, 1000);
    location.hash = 'hem';
  }
  // Ett tryck på den lilla tv:n: till tv:n i rummet. På förstasidan genast; från
  // de andra sidorna laddas förstasidan, och tv:n (och samtalet) följer med dit.
  function tillbaka() {
    if (!B.ute) return;
    if (window.Rum && Rum.fits()) {
      B.tillTv = true;
      location.hash = '';
      return;
    }
    if (window.Rum) return;
    minns();
    try { sessionStorage.setItem(TILL_TV, '1'); } catch { /* privat läge */ }
    if (T() && T().vidare) T().vidare();
    location.href = './';
  }
  // Tv:n följer inte med längre. Samtalet och kameran fortsätter (brickan, telefon.js).
  // slocknar: med en tv:s sista ljuspunkt.
  function sluta(slocknar) {
    if (!B.ute) return;
    B.ute = false;
    glom();
    // Rutan går tillbaka till tv:n när den lilla har slocknat. Tv:n står då på
    // text-tv:n när man kommer till rummet; visar sig någon byter den själv.
    miniBort(slocknar, () => {
      if (B.ute || B.on) return;
      B.visa = false;
      if (B.tv) B.tv.av(false);
      plats();
      ordna();
    });
  }
  // Följde tv:n med från sidan innan (inom tio minuter)? Då kommer den fram här –
  // på förstasidan utan adress tar rummet den (on).
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
    const rummet = () => window.Rum && !location.hash.replace(/^#/, '') && Rum.fits();
    // (när sidans alla skript är lästa: rum.js står efter den här)
    const lasta = document.readyState === 'loading' ? new Promise((r) => addEventListener('DOMContentLoaded', r, { once: true })) : Promise.resolve();
    lasta.then(() => {
      if (!B.ute || B.on || rummet()) return;
      // på förstasidan byggs tv:n utan rummet, så att text-tv:n följer med
      if (!B.tv && window.Rum && Rum.tvUtan) {
        const tv = Rum.tvUtan();
        if (tv) tvIn(tv);
      }
      if (!B.tv && !T()) {
        sluta(false);
        return;
      }
      lyssna();
      plats();
      if (skaSynas()) miniFram('tands');
      ordna();
    });
  }

  // ---------- i rummet ----------

  function mount(el, o) {
    B.el = el;
    B.tv = o.tv;
    B.tamed = el.querySelector('.rum-tamed');
    if (!B.tv || !B.tv.avEl) return;
    // (byggdes tv:n utan rummet sitter rutan kvar där den är: i den lilla tv:n)
    if (!B.ram) tvIn(B.tv);
    plats();
    if (B.tamed) {
      const tryck = (e) => {
        e.preventDefault();
        e.stopPropagation();
        taMed();
      };
      B.tamed.addEventListener('click', tryck);
      B.tamed.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') tryck(e); });
    }
    lyssna();
    ordna();
  }

  function on(v) {
    v = Boolean(v);
    if (v === B.on) return;
    B.on = v;
    if (v) {
      // tv:n som följde med är tillbaka i rummet
      const ute = B.ute;
      B.ute = false;
      glom();
      plats();
      miniBort(false);
      if (ute && B.tv) B.tv.av(B.visa);
      ordna();
      if (B.tillTv) {
        B.tillTv = false;
        setTimeout(() => { if (B.on && window.Rum && Rum.tv) Rum.tv(); }, 0);
      }
    } else if (B.tamedNu) {
      // Ta med tv:n: allt fortsätter i den lilla tv:n
      B.tamedNu = false;
      B.ute = true;
      minns();
      plats();
      // (när den vanliga sidan har lagts ut: sidhuvudet syns inte i rummet)
      requestAnimationFrame(() => {
        if (B.ute && !B.on) miniFram('krymp');
        ordna();
      });
    } else ordna();
  }
  addEventListener('pagehide', () => {
    // (tv:n följer med till nästa sida)
    if (B.ute) minns();
  });

  // Den som tittar bytte själv på tv:n (TV/AV, Gänget i bild, en sida …).
  function avVal(on2) {
    B.visa = Boolean(on2);
    ordna();
  }

  aterstall();

  return { mount, on, avVal, knapp, syns, foljer: () => B.ute };
})();
