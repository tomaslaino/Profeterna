'use strict';

// ---------- kröningen ----------
//
// Förstasidan: Omgångens orakel och Omgångens Ikaros som bild överst i
// omgångens ruta (tippare.js anropar Kronan.html med omgångens poäng).
// Oraklet står på en marmorsockel med lagerkrans och solstrålar bakom sig;
// Ikaros flyger kaxigt upp mot solen, vingarna smälter och han störtar i
// havet – om och om igen. Medan
// omgången pågår heter de Leder och Sist. Delat vid lika står alla med samma
// utmärkelse bredvid varandra.
//
// Utan pågående omgång (Kronan.reigning) står den senaste avslutade
// omgångens orakel och Ikaros kvar i en egen ruta. Före första omgången är
// det KRONAN_START.
//
// Kropparna är urklippta foton (public/profeterna/kropp-*.png). hx är
// huvudets mitt i procent av bildens bredd och sy axlarnas höjd i procent av
// bildens höjd – där fäster Ikaros vingar. Den som saknar bild får
// initialerna på en marmorskiva.

const KRONAN_KROPPAR = {
  DL: { namn: 'Daniel Laino', bild: 'profeterna/kropp-laino.png', hx: 49.7, sy: 16 },
  DT: { namn: 'Daniel Teijder', bild: 'profeterna/kropp-teijder.png', hx: 52.8, sy: 16.7 },
  DJ: { namn: 'Daniel Johansson', bild: 'profeterna/kropp-johansson.png', hx: 60.5, sy: 18.1 },
};
const KRONAN_START = { orakel: ['DL'], ikaros: ['DJ'] };

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

  // Vaxvingarna från axeln (0, 12) ut åt höger; den vänstra är spegelvänd.
  // Varje vinge finns i två lägen som tonar över i varandra i kronan.css:
  // hel (på väg upp mot solen) och smält (nära solen och på väg ner) – då
  // hänger pennorna, några har lossnat (0), spetsarna glöder och vaxet sitter
  // i klumpar på framkanten och droppar.
  const WING = (() => {
    const bone = (t) => [t * 96, 12 - Math.sin(t * Math.PI * 0.9) * 11];
    const row = (n, len, ang, w, fill, kvar) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const t = 0.08 + (i / (n - 1)) * 0.9;
        const [x, y] = bone(t);
        const L = len(t) * (kvar ? kvar[i % kvar.length] : 1);
        if (!L) continue;
        const a = ang(t);
        const cx = x + Math.cos(a) * L / 2;
        const cy = y + Math.sin(a) * L / 2;
        s += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(L / 2)}" ry="${w}" fill="${fill}" transform="rotate(${r1(a * 180 / Math.PI)} ${r1(cx)} ${r1(cy)})"/>`;
      }
      return s;
    };
    const down = (from, to) => (t) => (from + (to - from) * t) * Math.PI / 180;
    const hel = '<g class="kr-w-hel"><g stroke="#9c8a68" stroke-width="0.5">' +
      row(12, (t) => 26 + 34 * t, down(98, 40), 4.6, '#e2d6bf') +
      row(9, (t) => 15 + 14 * t, down(100, 50), 4.2, '#f6efe1') + '</g>' +
      '<path d="M0 12 Q48 -8 96 8" fill="none" stroke="#d8c7a4" stroke-width="3" stroke-linecap="round"/></g>';
    const at = [0.16, 0.38, 0.6, 0.82, 0.97];
    const globs = at.map((t) => { const [x, y] = bone(t); return `<ellipse cx="${r1(x)}" cy="${r1(y - 1)}" rx="4.2" ry="2.6"/>`; }).join('');
    const drips = at.map((t, i) => {
      const [x, y] = bone(t);
      return `<path class="kr-drip" style="--d:${r1(i * 0.35)}s" d="M${r1(x)} ${r1(y + 4)}c-2.2 3.2-3 5-3 6.3a3 3 0 0 0 6 0c0-1.3-.8-3.1-3-6.3z"/>`;
    }).join('');
    const smalt = '<g class="kr-w-smalt"><g stroke="#9c8a68" stroke-width="0.5">' +
      row(12, (t) => 26 + 34 * t, down(100, 78), 4.6, 'url(#kr-wax)', [1, 0.85, 1.05, 0, 0.9, 0.62, 1, 0, 0.78, 0.55, 0.9, 0.4]) +
      row(9, (t) => 15 + 14 * t, down(102, 84), 4.2, '#f3ead9', [1, 0.8, 1, 0.7, 0, 0.9, 0.75, 0.6, 0.5]) + '</g>' +
      '<path d="M0 12 Q48 -8 96 8" fill="none" stroke="#dba25a" stroke-width="3.4" stroke-linecap="round"/>' +
      `<g fill="#eaa24f">${globs}${drips}</g></g>`;
    return hel + smalt;
  })();
  const WINGS = '<svg class="kr-wings" viewBox="-104 -16 208 96" aria-hidden="true">' +
    '<defs><linearGradient id="kr-wax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#efe3cb"/>' +
    '<stop offset=".55" stop-color="#e6c48c"/><stop offset="1" stop-color="#e0773f"/></linearGradient></defs>' +
    `<g class="kr-flap l"><g transform="scale(-1 1)">${WING}</g></g><g class="kr-flap r">${WING}</g></svg>`;

  // Plasket där han slår i havet.
  const SPLASH = '<svg class="kr-splash" viewBox="0 0 80 36" aria-hidden="true">' +
    '<path d="M6 36C12 29 15 21 12 11C19 20 23 26 26 31C28 21 30 12 33 3C36 13 38 22 40 31C43 23 47 15 55 9C53 19 55 27 61 32C64 26 68 22 74 19C72 26 72 31 76 36Z"/>' +
    '<circle cx="9" cy="6" r="1.8"/><circle cx="22" cy="4" r="1.3"/><circle cx="45" cy="2" r="1.5"/><circle cx="64" cy="7" r="1.9"/><circle cx="75" cy="12" r="1.2"/></svg>';

  const FEATHER = '<svg viewBox="0 0 10 30" aria-hidden="true"><path d="M5 0C9 7 9 20 5 30C1 20 1 7 5 0z" fill="#f3ead9" stroke="#9c8a68" stroke-width=".6"/><path d="M5 3V29" stroke="#9c8a68" stroke-width=".6"/></svg>';

  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const tone = (x) => (Math.round(x * 10) > 0 ? 'pos' : Math.round(x * 10) < 0 ? 'neg' : '');

  // Bara efternamnet syns – alla i gänget heter Daniel.
  function name(p) {
    const n = String(p.name || p.id);
    const i = n.indexOf(' ');
    return esc2(i > 0 ? n.slice(i + 1) : n);
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
    const stat = p0.pts != null ? `<span class="kr-stat ${tone(p0.pts)}">${pts(p0.pts)} · ${p0.ok}/${p0.n} rätt</span>` : '';
    const figs = people.map((p) => fig(p, orakel ? '' : WINGS)).join('');
    const scene = orakel
      ? `<div class="kr-rays"></div>${LAUREL}<div class="kr-figs n${people.length}">${figs}</div><div class="kr-plinth"></div>`
      : '<div class="kr-sun"></div>' +
        '<div class="kr-speed"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
        `<div class="kr-figs n${people.length}">${figs}<div class="kr-smoke"><i></i><i></i><i></i></div></div>` +
        `<div class="kr-feathers"><i>${FEATHER}</i><i>${FEATHER}</i><i>${FEATHER}</i><i>${FEATHER}</i></div>` +
        SPLASH +
        '<svg class="kr-sea" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">' +
        '<path class="kr-wave b" d="M0 14q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V40H0z"/>' +
        '<path class="kr-wave f" d="M0 22q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V40H0z"/></svg>';
    const names = people.map(name).join('<span class="kr-amp"> &amp; </span>');
    return `<figure class="kr-panel kr-${kind}${done ? '' : ' is-prel'}" aria-label="${esc2(title)}: ${esc2(people.map((p) => p.name).join(' och '))}">` +
      `<div class="kr-scene">${scene}</div>` +
      `<figcaption><span class="kr-title">${title}</span><b class="kr-name">${names}</b>${stat}</figcaption></figure>`;
  }

  // s = omgångens poäng (tpScore i tippare.js): ranked med award best/worst.
  const fmt0 = (x) => String(Math.round(x * 10) / 10);

  function stage(best, worst, done, pts) {
    return `<div class="kr-stage">${panel('orakel', best, done, pts || fmt0)}${panel('ikaros', worst, done, pts || fmt0)}</div>`;
  }

  // s = omgångens poäng (tpScore i tippare.js): ranked med award best/worst.
  function html(s, pts) {
    const ranked = (s && s.ranked) || [];
    const best = ranked.filter((p) => p.award === 'best');
    const worst = ranked.filter((p) => p.award === 'worst');
    if (!best.length || !worst.length) return '';
    return stage(best, worst, s.done, pts);
  }

  // Egen ruta när ingen omgång pågår: den senaste avslutade omgången med både
  // orakel och Ikaros (säsongens omgångar, data/tippare.json), annars
  // KRONAN_START utan poäng.
  function reigning(rounds, pts) {
    const has = (r, a) => (r.people || []).some((p) => p.award === a);
    const last = (rounds || []).filter((r) => has(r, 'best') && has(r, 'worst'))
      .sort((a, b) => String(b.to || b.from).localeCompare(String(a.to || a.from)))[0];
    let best;
    let worst;
    let when = '';
    if (last) {
      best = last.people.filter((p) => p.award === 'best');
      worst = last.people.filter((p) => p.award === 'worst');
      if (typeof dateRange === 'function' && last.from) when = esc2(dateRange(last.from, last.to || last.from));
    } else {
      const who = (id) => ({ id, name: (KRONAN_KROPPAR[id] && KRONAN_KROPPAR[id].namn) || id });
      best = KRONAN_START.orakel.map(who);
      worst = KRONAN_START.ikaros.map(who);
    }
    return `<div class="card tp-card kr-reign"><p class="kp-eyebrow">${last ? `Omgången${when ? ` ${when}` : ''}` : 'Före första omgången'}</p>` +
      `${stage(best, worst, true, pts)}</div>`;
  }

  return { html, reigning };
})();
