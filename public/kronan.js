'use strict';

// ---------- kröningen ----------
//
// Förstasidan: Omgångens orakel och Omgångens Ikaros som bild överst i rutan
// Omgångens tippare (tippare.js anropar Kronan.html med omgångens poäng).
// Oraklet står på en marmorsockel med lagerkrans och solstrålar bakom sig;
// Ikaros faller med smältande vaxvingar mot havet under solen. Medan
// omgången pågår heter de Leder och Sist. Delat vid lika står alla med samma
// utmärkelse bredvid varandra.
//
// Kropparna är urklippta foton (public/profeterna/kropp-*.png). hx är
// huvudets mitt i procent av bildens bredd och sy axlarnas höjd i procent av
// bildens höjd – där fäster Ikaros vingar. Den som saknar bild får
// initialerna på en marmorskiva.

const KRONAN_KROPPAR = {
  DL: { bild: 'profeterna/kropp-laino.png', hx: 49.7, sy: 16 },
  DT: { bild: 'profeterna/kropp-teijder.png', hx: 52.8, sy: 16.7 },
  DJ: { bild: 'profeterna/kropp-johansson.png', hx: 60.5, sy: 18.1 },
};

window.Kronan = (() => {
  const r1 = (x) => Math.round(x * 10) / 10;

  // Lagerkransen bakom oraklet: två grenar längs en cirkel från rosetten
  // nedtill upp mot toppen, blad parvis utåt och inåt, mindre mot spetsen.
  const LAUREL = (() => {
    const R = 40;
    let stem = '';
    let leaves = '';
    for (const side of [-1, 1]) {
      const pt = (t) => [50 + side * R * Math.sin(t), 50 + R * Math.cos(t)];
      const d = [];
      for (let t = 0.2; t <= 2.62; t += 0.08) d.push(pt(t).map(r1).join(' '));
      stem += `<path d="M${d.join(' L')}"/>`;
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const t = 0.3 + i * 0.235;
        const [x, y] = pt(t);
        const tang = Math.atan2(-R * Math.sin(t), side * R * Math.cos(t));
        const len = 7.6 - i * 0.32;
        for (const turn of i === n ? [0] : [0.6, -0.6]) {
          const a = tang + turn;
          const cx = x + Math.cos(a) * len * 0.8;
          const cy = y + Math.sin(a) * len * 0.8;
          leaves += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(len)}" ry="${r1(len * 0.36)}" transform="rotate(${r1(a * 180 / Math.PI)} ${r1(cx)} ${r1(cy)})"/>`;
        }
      }
    }
    const bow = '<g fill="#c8643a" stroke="#8f3f1f" stroke-width="0.5">' +
      '<path d="M50 89l-9 9 2-8-6-2zM50 89l9 9-2-8 6-2z"/><circle cx="50" cy="89" r="3"/></g>';
    return '<svg class="kr-laurel" viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs><linearGradient id="kr-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9b8"/><stop offset="1" stop-color="#c9973f"/></linearGradient></defs>' +
      `<g fill="none" stroke="#a8782c" stroke-width="1.4" stroke-linecap="round">${stem}</g>` +
      `<g fill="url(#kr-gold)" stroke="#8a6122" stroke-width="0.45">${leaves}</g>${bow}</svg>`;
  })();

  // En vaxvinge från axeln (0, 12) ut åt höger; den vänstra är spegelvänd.
  // Bakre raden är långa pennor, främre korta täckfjädrar, och vaxet droppar.
  const WING = (() => {
    const bone = (t) => [t * 96, 12 - Math.sin(t * Math.PI * 0.9) * 11];
    const row = (n, len, ang, w, fill) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const t = 0.08 + (i / (n - 1)) * 0.9;
        const [x, y] = bone(t);
        const L = len(t);
        const a = ang(t);
        const cx = x + Math.cos(a) * L / 2;
        const cy = y + Math.sin(a) * L / 2;
        s += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(L / 2)}" ry="${w}" fill="${fill}" transform="rotate(${r1(a * 180 / Math.PI)} ${r1(cx)} ${r1(cy)})"/>`;
      }
      return s;
    };
    const down = (from, to) => (t) => (from + (to - from) * t) * Math.PI / 180;
    const back = row(11, (t) => 26 + 34 * t, down(98, 52), 4.6, '#d8c9ac');
    const front = row(9, (t) => 15 + 14 * t, down(100, 60), 4.2, '#f3ead9');
    const drips = [[22, 44], [47, 52], [71, 58], [88, 50]].map(([x, y], i) =>
      `<path class="kr-drip" style="--d:${i * 0.7}s" d="M${x} ${y}c-2.2 3.2-3 5-3 6.3a3 3 0 0 0 6 0c0-1.3-.8-3.1-3-6.3z"/>`).join('');
    return '<g stroke="#9c8a68" stroke-width="0.5">' + back + front + '</g>' +
      `<path d="M0 12 Q48 -8 96 8" fill="none" stroke="#c9b48c" stroke-width="3" stroke-linecap="round"/>` +
      `<g fill="#e9b25a">${drips}</g>`;
  })();
  const WINGS = '<svg class="kr-wings" viewBox="-104 -14 208 92" aria-hidden="true">' +
    `<g transform="scale(-1 1)">${WING}</g><g>${WING}</g></svg>`;

  const FEATHER = '<svg viewBox="0 0 10 30" aria-hidden="true"><path d="M5 0C9 7 9 20 5 30C1 20 1 7 5 0z" fill="#f3ead9" stroke="#9c8a68" stroke-width=".6"/><path d="M5 3V29" stroke="#9c8a68" stroke-width=".6"/></svg>';

  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const tone = (x) => (Math.round(x * 10) > 0 ? 'pos' : Math.round(x * 10) < 0 ? 'neg' : '');

  // Förnamnet döljs på smala skärmar – alla i gänget heter Daniel.
  function name(p) {
    const n = String(p.name || p.id);
    const i = n.indexOf(' ');
    return i > 0 ? `<span class="kr-given">${esc2(n.slice(0, i))} </span>${esc2(n.slice(i + 1))}` : esc2(n);
  }

  function fig(p, extra) {
    const k = KRONAN_KROPPAR[p.id];
    if (!k) {
      return `<div class="kr-fig kr-noimg"><span class="kr-ini">${esc2(p.id)}</span>${extra}</div>`;
    }
    return `<div class="kr-fig" style="--hx:${k.hx}%;--sy:${k.sy}%">` +
      `<img src="${k.bild}" alt="" draggable="false">${extra}</div>`;
  }

  function panel(kind, people, done, pts) {
    const orakel = kind === 'orakel';
    const title = orakel ? (done ? 'Omgångens orakel' : 'Leder just nu') : (done ? 'Omgångens Ikaros' : 'Sist just nu');
    const p0 = people[0];
    const stat = `${pts(p0.pts)} · ${p0.ok}/${p0.n} rätt`;
    const figs = people.map((p) => fig(p, orakel ? '' : WINGS)).join('');
    const scene = orakel
      ? `<div class="kr-rays"></div>${LAUREL}<div class="kr-figs n${people.length}">${figs}</div><div class="kr-plinth"></div>`
      : '<div class="kr-sun"></div>' +
        `<div class="kr-figs n${people.length}">${figs}</div>` +
        `<div class="kr-feathers"><i>${FEATHER}</i><i>${FEATHER}</i><i>${FEATHER}</i></div>` +
        '<svg class="kr-sea" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">' +
        '<path class="kr-wave b" d="M0 14q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V40H0z"/>' +
        '<path class="kr-wave f" d="M0 22q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V40H0z"/></svg>';
    const names = people.map(name).join('<span class="kr-amp"> &amp; </span>');
    return `<figure class="kr-panel kr-${kind}${done ? '' : ' is-prel'}" aria-label="${esc2(title)}: ${esc2(people.map((p) => p.name).join(' och '))}">` +
      `<div class="kr-scene">${scene}</div>` +
      `<figcaption><span class="kr-title">${title}</span><b class="kr-name">${names}</b>` +
      `<span class="kr-stat ${tone(p0.pts)}">${stat}</span></figcaption></figure>`;
  }

  // s = omgångens poäng (tpScore i tippare.js): ranked med award best/worst.
  function html(s, pts) {
    const ranked = (s && s.ranked) || [];
    const best = ranked.filter((p) => p.award === 'best');
    const worst = ranked.filter((p) => p.award === 'worst');
    if (!best.length || !worst.length) return '';
    const fmt = pts || ((x) => String(Math.round(x * 10) / 10));
    return `<div class="kr-stage">${panel('orakel', best, s.done, fmt)}${panel('ikaros', worst, s.done, fmt)}</div>`;
  }

  return { html };
})();
