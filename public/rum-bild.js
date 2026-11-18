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
//
//   RumBild.mount(el, { tv })   när tv:n är byggd (rum.js); tv = RumTv.mount(…)
//   RumBild.on(true | false)    rummet visas eller inte
//   RumBild.avVal(on)           den som tittar bytte själv på tv:n (TV/AV, en sida …)

window.RumBild = (() => {
  const B = { el: null, tv: null, av: null, on: false, visa: false, sett: new Set(), forut: false, video: new Map() };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ord = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} och ${xs[xs.length - 1]}` : xs[0] || '');

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
    if (!B.av || !window.Telefon) return;
    const L = Telefon.lage();
    const sander = L.med ? L.andra.filter((p) => p.kamera) : [];
    const nya = sander.filter((p) => !B.sett.has(p.id));
    for (const id of [...B.sett]) if (!sander.some((p) => p.id === id)) B.sett.delete(id);
    for (const p of nya) B.sett.add(p.id);
    const egen = Boolean(L.kam);
    if (egen && !B.sett.has('jag')) nya.push('jag');
    if (egen) B.sett.add('jag');
    else B.sett.delete('jag');
    const nu = sander.length > 0 || egen;
    if (B.tv) {
      if (nya.length && !B.visa) {
        B.visa = true;
        B.tv.av(true);
      } else if (!nu && B.forut && B.visa && !L.kamFel) {
        B.visa = false;
        B.tv.av(false);
      }
    }
    B.forut = nu;
    rita(L, sander);
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
    const av = B.av;
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
      r.className = `av-ruta k${Telefon.nr(p.vem)}${p.bild ? '' : ' letar'}${p.tappad ? ' tappad' : ''}`;
      r.style.cssText = n === 1 ? 'left:0;top:0;width:100%;height:100%' : `left:${(100 / n) * i}%;top:0;width:${100 / n}%;height:100%`;
      const namn = r.querySelector('.av-namn');
      if (namn.textContent !== Telefon.namn(p.vem)) namn.textContent = Telefon.namn(p.vem);
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
    const ser = [...new Set(L.andra.map((p) => Telefon.namn(p.vem)))];
    under.textContent = L.kam && !n ? (ser.length ? `${ord(ser)} ser dig` : 'Ingen annan i samtalet') : '';
    under.hidden = !under.textContent;
    // den blå rutan: ingen bild att visa, och vad man kan göra
    const bla = av.querySelector('.av-bla');
    bla.hidden = Boolean(n || L.kam);
    if (!bla.hidden) {
      const val = (tel, text) => `<p class="av-text"><button type="button" class="av-val" data-tel="${tel}">${esc(text)}</button></p>`;
      const s = L.samtal;
      let h;
      if (!L.kan) h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Går inte i den här webbläsaren.</p>';
      else if (!L.finns) h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Samtalet går inte att nå just nu.</p>';
      else if (L.kamFel) h = `<p class="av-rubrik">Gänget i bild</p><p class="av-text">${esc(L.kamFel)}</p>${val('kamera', 'Försök igen')}`;
      else if (L.kamStartar) h = '<p class="av-rubrik">Gänget i bild</p><p class="av-text">Kameran startar …</p>';
      else if (L.med) h = `<p class="av-rubrik">Ingen i bild</p>${val('kamera', 'Visa dig på tv:n')}`;
      else if (L.vill) h = `<p class="av-rubrik">${s && s.med.length > 1 ? 'Kopplar …' : 'Ringer …'}</p>`;
      else if (L.ringer) h = `<p class="av-rubrik">${esc(Telefon.namn(s.av))} ringer</p>${val('svara', 'Svara')}`;
      else if (s && s.med.length) h = `<p class="av-rubrik">Samtal pågår</p>${val('svara', 'Gå med')}`;
      else h = `<p class="av-rubrik">Gänget i bild</p>${val('ring', 'Ring gänget')}`;
      if (bla.dataset.h !== h) {
        bla.dataset.h = h;
        bla.innerHTML = h;
      }
    }
  }

  // ---------- i rummet ----------

  function mount(el, o) {
    B.el = el;
    B.tv = o.tv;
    B.av = B.tv && B.tv.avEl;
    if (!B.av) return;
    B.av.innerHTML = '<div class="av-rutor"></div><div class="av-jag" hidden><video autoplay muted playsinline aria-hidden="true"></video></div>' +
      '<p class="av-under" hidden></p><div class="av-bla"></div><b class="av-osd" aria-hidden="true">AV</b>';
    const ev = B.av.querySelector('.av-jag video');
    ev.muted = true;
    ev.playsInline = true;
    const glas = B.av.closest('.tv-glas');
    if (glas && !calm()) glas.style.setProperty('--sno', sno());
    B.av.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tel]');
      if (!b || !window.Telefon) return;
      e.preventDefault();
      e.stopPropagation();
      const t = b.dataset.tel;
      if (t === 'kamera') Telefon.kamera(true);
      else if (t === 'svara') Telefon.svara();
      else if (t === 'ring') Telefon.ring();
    });
    if (window.Telefon) Telefon.pa(ordna);
    ordna();
  }

  function on(v) {
    B.on = Boolean(v);
    ordna();
  }

  // Den som tittar bytte själv på tv:n (TV/AV, Gänget i bild, en sida …).
  function avVal(on2) {
    B.visa = Boolean(on2);
    ordna();
  }

  return { mount, on, avVal };
})();
