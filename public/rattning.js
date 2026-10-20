'use strict';

// ---------- rättningen ----------
//
// Gängets färdigspelade kupong (Kupong → Omgången och Kupong → <id>) rättas
// inför ögonen första gången man ser den färdig: ringen runt utfallet dras
// en match i taget, ställningen skrivs och rättarens bock eller kryss sätts,
// sedan antalet rätt i hörnet och sist stämpeln Rättad. Under raderna skriver
// klassföreståndaren betyget och kommentaren i rödpenna – samma betyg och
// AI-kommentar som i Historik (historik.js), som kommer när bygget har tagit
// in kupongen i historiken. Webbläsaren kommer ihåg vilka kuponger som har
// rättats här, och ett tryck på stämpeln rättar en gång till. Med reducerad
// rörelse står allt klart direkt.
//
// kupong.js anropar Rattning.after(el, c, g) när kupongen har ritats. Både
// papperskupongen (papper.js) och omgångens papper med porträtten (samtal.js)
// rättas – raderna med ett utfall känns igen på ringen eller bocken.
//
// Läses efter historik.js och använder app.js (esc) när den finns.

window.Rattning = (() => {
  const SEEN_KEY = 'profeterna.kupong.rattad';
  const START = 300; // ms innan första matchen rättas
  const STEP = 240; // ms mellan matcherna
  const WRITE_MS = 2400; // så länge kommentaren skrivs (rattning.css)
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const remarks = new Map(); // kupong-id → { label, text, model }
  const played = new Set(); // om localStorage saknas
  let run = null; // rättningen som pågår: { id, t0, note, end }

  function seenList() {
    try {
      const v = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  const hasSeen = (id) => played.has(id) || seenList().includes(id);
  function markSeen(id) {
    played.add(id);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seenList().filter((x) => x !== id), id].slice(-40)));
    } catch { /* privat läge */ }
  }

  const still = () => Boolean(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const now = () => performance.now();

  // Raderna som har ett utfall att rätta, uppifrån.
  const gradedRows = (art) => [...art.querySelectorAll('.pp-row, .sm-r')].filter((r) => r.querySelector('.pp-ring, .pp-tick'));

  // Rättningen från t0. Ritas papperet om medan den pågår (liveställningen
  // varje minut) fortsätter den där den var: fördröjningarna räknas från t0.
  function play(art, id, t0 = now()) {
    if (still()) return;
    const off = now() - t0;
    const ms = (t) => `${Math.round(t - off)}ms`;
    const rows = gradedRows(art);
    rows.forEach((r, i) => r.style.setProperty('--rt', ms(START + i * STEP)));
    const end = START + rows.length * STEP;
    art.style.setProperty('--rt-grade', ms(end + 250));
    art.style.setProperty('--rt-stamp', ms(end + 1000));
    for (const p of art.querySelectorAll('.pp-ring path, .pp-tick path')) p.setAttribute('pathLength', '1');
    art.classList.remove('rt-play');
    void art.offsetWidth; // börja om
    art.classList.add('rt-play');
    run = { id, t0, note: t0 + end + 1500, end: t0 + end + 4000 };
    const note = art.querySelector('.rt-note');
    if (note) write(note, run.note);
  }

  // Kommentaren skrivs fram från vänster med start at (performance.now()),
  // men först när den syns – i telefonen står den en bit ner. Ritas
  // papperet om medan den skrivs fortsätter den där den var; var den redan
  // skriven står den kvar.
  function write(note, at) {
    if (now() > at + WRITE_MS) return;
    const t1 = now();
    note.classList.remove('rt-write');
    note.classList.add('rt-hold');
    const go = () => {
      const d = at - now();
      note.classList.remove('rt-hold');
      void note.offsetWidth;
      note.style.animationDelay = `${Math.round(d < 0 && now() - t1 > 150 ? 0 : d)}ms`;
      note.classList.add('rt-write');
    };
    if (!window.IntersectionObserver) return go();
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      go();
    }, { threshold: 0.5 });
    io.observe(note);
  }

  function noteHtml(r) {
    return `<div class="rt-note"${r.model ? ` title="${esc2(r.model)}"` : ''}>` +
      (r.label ? `<b class="rt-grade">${esc2(r.label)}.</b> ` : '') + esc2(r.text) +
      '<span class="rt-sig">Klassföreståndaren</span></div>';
  }

  // Betyget och kommentaren under raderna, ovanför foten. late: kom efter
  // att papperet ritats – skrivs fram när rättningen kommit dit, annars
  // direkt.
  function put(art, id, r, late) {
    if (!r || !r.text || art.querySelector('.rt-note')) return;
    const foot = art.querySelector('.pp-foot');
    if (foot) foot.insertAdjacentHTML('beforebegin', noteHtml(r));
    else art.insertAdjacentHTML('beforeend', noteHtml(r));
    if (late && !still()) write(art.querySelector('.rt-note'), run && run.id === id ? Math.max(now(), run.note) : now());
  }

  function after(el, c, g) {
    const art = el.querySelector('article.pp, .sm-sheet');
    if (!art || !g.done || g.hidden || c.pending) return;
    art.dataset.rattning = c.id;
    const stamp = art.querySelector('.pp-stamp:not(.wait)');
    if (stamp) {
      stamp.title = 'Rätta en gång till';
      stamp.setAttribute('role', 'button');
      stamp.tabIndex = 0;
      const again = (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        play(art, c.id);
      };
      stamp.addEventListener('click', again);
      stamp.addEventListener('keydown', again);
    }
    if (remarks.has(c.id)) {
      put(art, c.id, remarks.get(c.id), false);
    } else if (window.Historik && Historik.entry) {
      Historik.entry(c.id).then((r) => {
        if (!r || !r.text) return;
        remarks.set(c.id, r);
        const cur = document.querySelector(`[data-rattning="${CSS.escape(c.id)}"]`);
        if (cur) put(cur, c.id, r, true);
      }).catch(() => {});
    }
    if (!hasSeen(c.id)) {
      markSeen(c.id);
      play(art, c.id);
    } else if (run && run.id === c.id && now() < run.end) {
      play(art, c.id, run.t0);
    }
  }

  return { after };
})();
