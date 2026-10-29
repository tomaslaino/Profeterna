'use strict';

// ---------- gänget i rummet ----------
//
// Tobaksaffären (rum.js) med de andra i gänget: den som har rummet öppet
// syns i sin figur (rum-3d.js), som tittar dit hen pekar – på tv:n,
// anslagstavlan, kupongen … eller på någon annan i gänget. Det du har
// framme (tv:n nära, kupongen i handen …) räknas som det du pekar på. Din
// egen figur gör det direkt (vem du är: samma val som på kupongen,
// samtal.js), och de andras kommer genom tjänsten profeterna-rummet
// (worker/rummet.mjs, en websocket; adressen är samtal.rummet i
// data/kuponger.json). Utan tjänsten gör bara din egen figur det, och utan
// vem du är bara de andras.
//
// Pekar man på någon i gänget tittar hen på en och skålar (hej); i
// telefonen gör ett tryck på figuren samma sak en stund. Ett klick på en
// figur går inte vidare till det som står bakom.
//
// Natten: mellan midnatt och sex (Stockholms tid, Vader.nu()) är lysröret
// släckt – rummet mörkt utom gatan, neonen och tv:n (.natt, rum-folk.css),
// gänget och lysröret i 3D – och på morgonen blinkar det igång igen. Nära
// tv:n, videon, en sak eller med kupongen i handen är det ljust.
//
// Dagen efter: dagen efter och dagen därpå efter att gängets kupong spelats
// färdigt syns det hur det gick, efter betyget i historiken (4–5 bra, 1–2
// illa; rum-3d.js efter) – utom med dolda resultat.
//
//   RumFolk.mount(el, { fig, inr, now, nara, fokus })  när gänget har laddats
//   RumFolk.on(true | false)                           rummet visas eller inte
//   RumFolk.ute(v)                                     klockan (Vader.nu())
//   RumFolk.fyll(old, seen)                            de färdiga kupongerna och omgångarna
//   RumFolk.natt()                                     är det natt?
//
// För bilder: ?rum-natt (=0 dag), ?rum-efter=bra|illa (=inget),
// ?rum-pekar=dt:tv,dl:dj (som om de pekade) och ?rum-hej=dl (som om man
// pekade på DL).

window.RumFolk = (() => {
  const q = new URLSearchParams(location.search);
  const D = 1400;
  const GANG = ['dl', 'dt', 'dj'];
  // Sakerna man kan peka på, med samma namn som det man har framme (fokus i
  // rum.js: kupong, tv, video, anslag, register och närbilderna ur, skar,
  // ram, vm94).
  const SAKER = {
    tv: '#rum-tv', video: '.vhs-hit', anslag: '#rum-ans', register: '#rum-reg', kupong: '#rum-kupong', tag: '#rum-tag',
    kvitto: '#rum-kvitto', hogen: '.rum-bak', ur: '.rum-ur', skar: '.rum-skar', ram: '.rum-ram',
    pokal: '.rum-sak[aria-label="Olympen"]:not(.rum-ram)', kork: '.rum-kork', vm94: '#rum-vm94', dorr: '#rum-dorrnamn',
  };
  const F = {
    el: null, o: null, on: false, ws: null, timer: 0, ping: 0, retry: 0, loop: 0,
    over: null, pa: null, mot: undefined, sent: undefined, sentAt: 0, sendT: 0, inne: {},
    natt: null, efter: undefined, pek: null, typ: 'mouse', hejAt: -1, rorAt: 0,
  };
  const fig = () => (F.o && F.o.fig()) || null;

  // ---------- vem du är och tjänsten ----------

  // (KP i kupong.js är en global const, inte window.KP)
  const samtal = () => (typeof KP !== 'undefined' && KP.data && KP.data.samtal) || null;
  function jag() {
    const v = typeof kpLoad === 'function' ? kpLoad('profeterna.samtal.vem') : null;
    const s = samtal();
    return s && (s.gang || []).some((g) => g.id === v) ? v : null;
  }
  const adress = () => q.get('rum-folk') || (samtal() && samtal().rummet) || null;

  function koppla() {
    if (F.ws || !F.on || document.hidden) return;
    const u = adress();
    if (!u || !('WebSocket' in window)) return;
    const v = jag();
    let ws;
    try { ws = new WebSocket(v ? `${u}?vem=${encodeURIComponent(v)}` : u); } catch { return; }
    F.ws = ws;
    F.sent = undefined;
    ws.onopen = () => {
      F.retry = 0;
      skicka();
      clearInterval(F.ping);
      F.ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 30000);
    };
    ws.onmessage = (e) => {
      if (e.data === 'pong') return;
      try {
        const d = JSON.parse(e.data);
        if (d && d.inne && typeof d.inne === 'object') {
          F.inne = d.inne;
          andra();
        }
      } catch { /* inget */ }
    };
    ws.onclose = () => {
      clearInterval(F.ping);
      if (F.ws !== ws) return;
      F.ws = null;
      F.inne = {};
      andra();
      // försök igen om en stund (längre och längre, högst en minut)
      if (F.on && !document.hidden) {
        clearTimeout(F.timer);
        F.timer = setTimeout(koppla, Math.min(60000, 3000 * 2 ** F.retry++));
      }
    };
  }
  function kopplaNer() {
    clearTimeout(F.timer);
    clearInterval(F.ping);
    const ws = F.ws;
    F.ws = null;
    if (ws) try { ws.close(1000); } catch { /* inget */ }
    F.inne = {};
    andra();
  }
  // vad du pekar på, högst var 150:e millisekund
  function skicka() {
    const ws = F.ws;
    if (!ws || ws.readyState !== 1 || !jag() || F.sent === F.mot) return;
    const vanta = 150 - (performance.now() - F.sentAt);
    if (vanta > 0) {
      clearTimeout(F.sendT);
      F.sendT = setTimeout(skicka, vanta);
      return;
    }
    F.sent = F.mot;
    F.sentAt = performance.now();
    ws.send(JSON.stringify({ mot: F.mot || null }));
  }
  addEventListener('visibilitychange', () => {
    if (document.hidden) kopplaNer();
    else koppla();
  });

  // ---------- var sakerna är ----------

  // Sakens mitt i världen (rum-3d.js: x = scenens x − 800, y = 400 − scenens
  // y, z mot betraktaren från fönsterbänkens plan), ur var den syns i scenen
  // och planet den står i; på högra väggen efter hur långt fram den är (som
  // perspektivet i rum.js). Räknas när kameran står på håll och sparas.
  const cache = {};
  addEventListener('resize', () => { for (const k of Object.keys(cache)) delete cache[k]; });
  function punkt(k) {
    if (!k) return null;
    const f = fig();
    if (GANG.includes(k)) return f && f.huvud ? f.huvud(k) : null;
    if (cache[k] || F.o.nara()) return cache[k] || null;
    const el = F.el.querySelector(SAKER[k]);
    const st = F.el.querySelector('#rum-stage');
    if (!el || !st) return null;
    const r = el.getBoundingClientRect();
    const s = st.getBoundingClientRect();
    const kk = s.width / 1600;
    const sx = (r.left + r.width / 2 - s.left) / kk;
    const sy = (r.top + r.height / 2 - s.top) / kk;
    const pl = el.closest('.rum-pl');
    const z = pl ? parseFloat((/translateZ\((-?[\d.]+)px\)/.exec(pl.style.transform) || [])[1]) || 0 : 0;
    const fak = z <= -590 && sx > 1140 ? (D / (D + 270)) * ((sx - 760) / 380) : D / (D - (z + 330));
    cache[k] = [(sx - 800) / fak, (400 - sy) / fak, D - D / fak].map((x) => Math.round(x));
    return cache[k];
  }
  function nyckel(el) {
    if (!el) return null;
    for (const [k, sel] of Object.entries(SAKER)) if (el.matches(sel)) return k === 'tag' ? 'kupong' : k;
    return null;
  }

  // ---------- pekarna ----------

  // Det du pekar på: det du har framme, annars någon i gänget, annars saken under musen.
  const mitt = () => (F.o && F.o.fokus()) || F.pa || F.over || null;

  // Din egen figur direkt, och till de andra genom tjänsten.
  function egen() {
    const f = fig();
    const v = jag();
    const mot = mitt();
    if (mot !== F.mot) {
      F.mot = mot;
      skicka();
    }
    if (!f || !f.pekar || !v) return;
    const me = v.toLowerCase();
    f.pekar(me, mot && mot !== me ? punkt(mot) : null, F.o.now());
  }
  // De andras figurer: dit de pekar (null = inget, eller inte här).
  function andra() {
    const f = fig();
    if (!f || !f.pekar) return;
    const me = (jag() || '').toLowerCase();
    const t = F.o.now();
    for (const k of GANG) {
      if (k === me) continue;
      if (F.pek && k in F.pek) {
        // ?rum-pekar: som om de pekade sedan länge
        f.pekar(k, F.pek[k] !== k ? punkt(F.pek[k]) : null, -1e9);
        continue;
      }
      const mot = F.inne[k.toUpperCase()];
      f.pekar(k, mot && mot !== k && (SAKER[mot] || GANG.includes(mot)) ? punkt(mot) : null, t);
    }
  }

  // Vem i gänget syns under punkten (x, y) i fönstret?
  function vemUnder(x, y) {
    const f = fig();
    const c = F.el && F.el.querySelector('#rum-3d');
    if (!f || !f.under || !c || F.o.nara()) return null;
    const r = c.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    return f.under(((x - r.left) / r.width) * 2 - 1, -(((y - r.top) / r.height) * 2 - 1));
  }
  function pa(k) {
    if (k === F.pa) return;
    const f = fig();
    const t = F.o.now();
    if (f && F.pa) f.hej(F.pa, t, t);
    if (f && k) f.hej(k, t);
    F.pa = k;
    egen();
  }
  // På en figur: ingen hand (klicket går inte till det som står bakom). Det
  // sätts på länken under musen (.rum-sak, .rum-tag – det enda som annars
  // visar en hand), inte som en klass på hela rummet – den räknade om stilen
  // för rummets ~3 800 element och alla lager varje gång musen gick in över
  // eller ut från gänget – och inte på scenen eller en vägg: pekaren ärvs av
  // allt inuti, och Chrome ritade då om väggarnas SVG:er (rutor i fönstrets
  // bredd, sexton för bakväggen) upp till femton gånger i sekunden, så att
  // grafikkortet inte hann med när kameran gick tillbaka från en närbild.
  function markor(el) {
    if (el === F.markor) return;
    if (F.markor) F.markor.style.removeProperty('cursor');
    F.markor = el;
    if (el) el.style.setProperty('cursor', 'default', 'important');
  }

  function wire(el) {
    el.addEventListener('mouseover', (e) => {
      const a = e.target.closest('.rum-sak, .rum-tag');
      F.over = a ? nyckel(a) : null;
      egen();
    });
    el.addEventListener('pointerdown', (e) => { F.typ = e.pointerType; });
    // pekar man på gänget (musen), högst var 60:e millisekund
    el.addEventListener('pointermove', (e) => {
      F.typ = e.pointerType;
      if (e.pointerType !== 'mouse') return;
      const ms = performance.now();
      if (ms - F.rorAt < 60) return;
      F.rorAt = ms;
      const k = vemUnder(e.clientX, e.clientY);
      pa(k);
      markor(k ? e.target.closest('.rum-sak, .rum-tag') : null);
    });
    el.addEventListener('mouseleave', () => {
      F.over = null;
      pa(null);
      markor(null);
    });
    // ett klick (eller tryck) på en figur: hej en stund i telefonen, och
    // inget annat
    el.addEventListener('click', (e) => {
      // (inte klicket efter ett drag, som rum.js redan har stoppat)
      if (e.defaultPrevented) return;
      const k = vemUnder(e.clientX, e.clientY);
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      if (F.typ !== 'mouse' && fig()) {
        const t = F.o.now();
        fig().hej(k, t, t + 2.5);
      }
    }, true);
  }

  // ---------- natten ----------

  function arNatt(v) {
    if (q.has('rum-natt')) return q.get('rum-natt') !== '0';
    return Boolean(v && v.timme < 6);
  }
  function ute(v) {
    const on = arNatt(v);
    if (on === F.natt) return;
    const forr = F.natt;
    F.natt = on;
    const el = F.el || document.getElementById('rum-section');
    if (el) {
      el.classList.toggle('natt', on);
      // på morgonen blinkar lysröret igång (.rum-mork.tands i rum.css)
      const m = el.querySelector('#rum-mork');
      if (forr && !on && m && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        m.classList.add('tands');
        m.addEventListener('animationend', function slut(e) {
          if (e.animationName !== 'rum-tands') return;
          m.classList.remove('tands');
          m.removeEventListener('animationend', slut);
        });
      }
    }
    nattTill();
  }
  function nattTill() {
    const f = fig();
    if (f && f.natt) f.natt(F.natt, F.o.now());
    const inr = F.o && F.o.inr();
    if (inr && inr.natt) inr.natt(F.natt);
  }

  // ---------- dagen efter ----------

  // Den senaste färdiga kupongen som syns (old: senaste först), om den
  // spelades färdigt i går eller i förrgår (Stockholms dag): 'bra' med
  // betyg 4–5, 'illa' med 1–2, och oraklen ur omgångens utmärkelser.
  function efterAv(old, seen) {
    const f = q.get('rum-efter');
    const best = (c) => {
      const h = window.Kronan && Kronan.holders ? Kronan.holders(seen || []) : null;
      if (!h || !h.last || (c && String(h.last.id || '').slice(0, 10) !== String(c.id).slice(0, 10))) return [];
      return h.best.map((p) => String(p.id).toLowerCase());
    };
    if (f) return f === 'bra' || f === 'illa' ? { lage: f, krona: best(null).length ? best(null) : ['dt'] } : null;
    const c = (old || []).find((x) => x.n && x.rows && x.rows.length);
    if (!c || (window.Historik && Historik.hidden(c)) || !c.grade) return null;
    const v = window.Vader ? Vader.nu() : null;
    const dag = String(c.till || c.date || c.id).slice(0, 10).split('-').map(Number);
    if (!v || dag.length < 3) return null;
    const d = (Date.UTC(v.ar, v.manad - 1, v.dag) - Date.UTC(dag[0], dag[1] - 1, dag[2])) / 864e5;
    if (d < 1 || d > 2) return null;
    const lage = c.grade >= 4 ? 'bra' : c.grade <= 2 ? 'illa' : null;
    return lage ? { lage, krona: best(c) } : null;
  }
  function fyll(old, seen) {
    F.efter = efterAv(old, seen);
    const f = fig();
    if (f && f.efter) f.efter(F.efter);
  }

  // ---------- in och ut ----------

  function mount(el, o) {
    F.el = el;
    F.o = o;
    if (!el.dataset.folk) {
      el.dataset.folk = '1';
      wire(el);
    }
    // ?rum-pekar=dt:tv,dl:dj och ?rum-hej=dl
    if (q.has('rum-pekar')) {
      F.pek = {};
      for (const x of q.get('rum-pekar').split(',')) {
        const [k, m] = x.split(':').map((s) => s.trim().toLowerCase());
        if (GANG.includes(k)) F.pek[k] = m || null;
      }
    }
    const f = fig();
    if (f) {
      if (F.efter !== undefined && f.efter) f.efter(F.efter);
      if (q.has('rum-hej') && f.hej) f.hej(q.get('rum-hej').toLowerCase(), o.now() - 1.2);
    }
    nattTill();
    andra();
    on(F.on || !el.hidden);
  }
  function on(x) {
    F.on = Boolean(x);
    clearInterval(F.loop);
    if (!F.on || !F.o) {
      kopplaNer();
      return;
    }
    koppla();
    // det du har framme och huvudena man pekar på ändras utan att musen rör sig
    F.loop = setInterval(() => {
      egen();
      andra();
    }, 250);
  }

  return { mount, on, ute, fyll, natt: () => Boolean(F.natt) };
})();
