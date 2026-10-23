'use strict';

// ---------- rummet ----------
//
// Förstasidan på stora skärmar: tobaksaffären vid spelpulten, ritad i lager
// på olika djup (CSS 3D) som vrids lite när musen rör sig. Gänget – DL, DT
// och DJ – sitter som leksaksfigurer (three.js, rum-3d.js) på fönsterbänken,
// dricker öl, röker och pratar. Föremålen leder vidare, som i ett rum hos
// Felix Rieseberg:
//   fällbladstavlan → närbilden → Matcher
//   korktavlan → gängets kuponger     pokalhyllan, Omgångens orakel → Olympen
//   krittavlan → Tabeller             pärmarna → Statistik
//   namnet på dörren → Om oss
//   kvittot → Kupong, tv:n zoomas in (T) med text-tv:ns färgknappar
//   kupongen tas i handen (K) – fylls i, ändras eller visas – eller → Kupong.
//   högen bredvid: de inlämnade kupongerna med baksidan upp; din egen tas i
//   handen därifrån när du har lämnat in, de andras → Kupong.
// Pekar man på ett föremål lyser ordet i menyn som det leder till.
//
// Vanlig sida (#hem) är den vanliga förstasidan. I telefonen och i smala
// fönster står den alltid där i stället för rummet (Rum.fits). Rörelserna
// stängs av med prefers-reduced-motion. För bilder: ?rum-t=<sekunder> fryser
// klockan, ?rum-mx=&rum-my= kamerans läge (−1…1), ?rum-tavla visar
// fällbladstavlan på nära håll, ?rum-vantar=DL,DT låter dem sitta med
// kupongen som om de inte hade lämnat in.
//
// Läses efter kupong.js, samtal.js, tippare.js och kronan.js och använder
// deras hjälpare (state, KP, TP, gradeRow, couponNumber, currentCoupon,
// Kronan.holders, Kronan.scene, Historik.coupons …). rum-3d.js hämtas först
// när rummet visas, med three.js från jsdelivr (importmap i index.html); utan
// WebGL står rummet kvar utan gänget.

window.Rum = (() => {
  const W = 1600;
  const H = 1000;
  const PERSP = 1400;
  const PIVOT = -330;
  // Högra väggen: vågräta linjer går mot flyktpunkten VP; at(x, yb) är
  // höjden yb (mätt i hörnet x = 1140) längre in mot betraktaren.
  const VP = [760, 400];
  const at = (x, yb) => VP[1] + (yb - VP[1]) * (x - VP[0]) / (1140 - VP[0]);
  const sc = (x) => (x - VP[0]) / (1140 - VP[0]);
  const r1 = (x) => Math.round(x * 10) / 10;
  const GANG = { DL: '#4d8ff0', DT: '#3db37c', DJ: '#a069e6' };

  const R = { built: false, on: false, el: null, q: new URLSearchParams(location.search), t0: performance.now(), frozen: null,
    mx: 0.5, my: -0.25, tx: 0.5, ty: -0.25, raf: 0, fig: null, page: 0, pageAt: 0, zoom: null, last: 0 };
  const still = () => R.frozen != null;
  const calm = () => still() || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const now = () => (still() ? R.frozen : (performance.now() - R.t0) / 1000);

  function rng(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---------- scenen ----------

  function plane(z, inner, extra = 1, cls = '') {
    const k = (PERSP - z) / PERSP * extra;
    return `<div class="rum-pl${cls ? ` ${cls}` : ''}" style="transform: translateZ(${z}px) scale(${k.toFixed(4)})">${inner}</div>`;
  }
  const svg = (inner, cls = '') => `<svg class="rum-layer${cls ? ` ${cls}` : ''}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${inner}</svg>`;

  const DEFS = `<defs>
    <linearGradient id="rum-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f19"/><stop offset=".55" stop-color="#121826"/><stop offset="1" stop-color="#1c1d24"/></linearGradient>
    <linearGradient id="rum-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#857552"/><stop offset=".45" stop-color="#6c5f43"/><stop offset="1" stop-color="#3e3527"/></linearGradient>
    <linearGradient id="rum-nik" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3c0c" stop-opacity=".55"/><stop offset=".35" stop-color="#5a3c0c" stop-opacity="0"/></linearGradient>
    <linearGradient id="rum-rwall" gradientUnits="userSpaceOnUse" x1="1140" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#5a4e39"/><stop offset="1" stop-color="#2f2920"/></linearGradient>
    <linearGradient id="rum-ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2519"/><stop offset="1" stop-color="#55492f"/></linearGradient>
    <linearGradient id="rum-pult" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4a30"/><stop offset=".5" stop-color="#5a3b26"/><stop offset="1" stop-color="#3b2619"/></linearGradient>
    <linearGradient id="rum-alu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a9a96"/><stop offset=".5" stop-color="#5e5e5b"/><stop offset="1" stop-color="#2e2e2c"/></linearGradient>
    <linearGradient id="rum-counter" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3a2c"/><stop offset="1" stop-color="#2a2019"/></linearGradient>
    <linearGradient id="rum-countertop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b8577"/><stop offset="1" stop-color="#5b564c"/></linearGradient>
    <linearGradient id="rum-sill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7262"/><stop offset="1" stop-color="#958b78"/></linearGradient>
    <radialGradient id="rum-sodium" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb35c" stop-opacity=".9"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
    <radialGradient id="rum-tube" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef6ff" stop-opacity=".55"/><stop offset="1" stop-color="#eef6ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="rum-streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35c" stop-opacity=".5"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></linearGradient>
    <linearGradient id="rum-streakred" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3b30" stop-opacity=".55"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></linearGradient>
    <linearGradient id="rum-cupg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
    <linearGradient id="rum-guld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e3a8"/><stop offset=".55" stop-color="#d4a650"/><stop offset="1" stop-color="#9c7230"/></linearGradient>
    <path id="rum-dorrbage" d="M66 252 Q136 232 206 252"/>
    <clipPath id="rum-win"><rect x="272" y="132" width="676" height="426"/></clipPath>
    <clipPath id="rum-doorglass"><rect x="50" y="136" width="172" height="560"/></clipPath>
    <filter id="rum-b1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.3"/></filter>
    <filter id="rum-b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="rum-b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="rum-b24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
    <filter id="rum-b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="rum-grainwood" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.003 0.07" numOctaves="3" seed="5"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .06  0 0 0 0 .03  1.5 0 0 0 -.5"/></filter>
    <filter id="rum-flack" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011 .016" numOctaves="4" seed="8"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .13  0 0 0 0 .03  0 0 0 -2.2 1.25"/></filter>
    <filter id="rum-prick" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="1" seed="2"/><feColorMatrix values="0 0 0 0 .18  0 0 0 0 .12  0 0 0 0 .05  0 0 0 -9 6.4"/></filter>
    <filter id="rum-grime" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .006" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .52  0 0 0 0 .45  0 0 0 -2 1.1"/></filter>
  </defs>`;

  // Fasaden mittemot, gatlyktorna, bilen och dropparna på rutan.
  function outside(R0) {
    const warm = ['#ffd58a', '#ffc56b', '#f6e7c1', '#ffcf7a', '#a9c4ff'];
    let s = '';
    for (const [hx, hw, hc] of [[0, 190, '#0e1119'], [190, 260, '#12141c'], [450, 330, '#0d1017'], [780, 220, '#111520']]) {
      s += `<rect x="${hx}" y="100" width="${hw}" height="300" fill="${hc}"/>`;
      for (let wy = 116; wy < 280; wy += 30) {
        for (let wx = hx + 14; wx < hx + hw - 18; wx += 30) {
          const lit = R0() < 0.3;
          s += `<rect x="${wx}" y="${wy}" width="14" height="17" fill="${lit ? warm[(R0() * 5) | 0] : '#fff'}" opacity="${lit ? r1(0.28 + R0() * 0.4) : 0.025}"/>`;
        }
      }
    }
    s += `<rect x="560" y="312" width="210" height="88" fill="#1a1410"/><rect x="566" y="330" width="198" height="64" fill="#ffcf8a" opacity=".32"/>
      <rect x="566" y="330" width="198" height="64" fill="#3a2414" opacity=".25"/>
      <g fill="#1a1410"><rect x="630" y="330" width="4" height="64"/><rect x="698" y="330" width="4" height="64"/>
        <rect x="584" y="372" width="30" height="4"/><rect x="588" y="376" width="3" height="18"/><rect x="608" y="376" width="3" height="18"/>
        <rect x="716" y="370" width="34" height="4"/><rect x="722" y="374" width="3" height="20"/><rect x="744" y="374" width="3" height="20"/></g>
      <rect x="650" y="350" width="34" height="8" rx="4" fill="#fff4d8" opacity=".5"/><rect x="580" y="292" width="170" height="26" fill="#0e1a12"/>
      <text x="665" y="312" text-anchor="middle" font-family="Fraunces" font-style="italic" font-weight="700" font-size="21" fill="#9bf5b5">Pizzeria</text>
      <text x="665" y="312" text-anchor="middle" font-family="Fraunces" font-style="italic" font-weight="700" font-size="21" fill="#4fe08a" filter="url(#rum-b4)">Pizzeria</text>
      <rect x="0" y="400" width="1000" height="14" fill="#2a2b30"/><rect x="0" y="414" width="1000" height="310" fill="#121318"/>`;
    for (const [sx, k] of [[330, 1], [520, 0.8], [880, 1], [120, 0.9]]) {
      s += `<rect x="${sx - 2}" y="250" width="4" height="165" fill="#1a1c22"/><circle cx="${sx}" cy="250" r="${60 * k}" fill="url(#rum-sodium)" opacity=".7"/>` +
        `<circle cx="${sx}" cy="250" r="4" fill="#ffe2b0"/><rect x="${sx - 7}" y="418" width="14" height="140" fill="url(#rum-streak)" filter="url(#rum-b4)"/>`;
    }
    for (const cx of [700, 736]) {
      s += `<circle cx="${cx}" cy="470" r="5" fill="#ff4a3a"/><circle cx="${cx}" cy="470" r="16" fill="#ff3b30" opacity=".45" filter="url(#rum-b4)"/>` +
        `<rect x="${cx - 4}" y="478" width="8" height="80" fill="url(#rum-streakred)" filter="url(#rum-b4)"/>`;
    }
    s += '<rect x="680" y="440" width="76" height="36" rx="8" fill="#08090c"/><rect x="560" y="420" width="210" height="90" fill="#ffcf8a" opacity=".07" filter="url(#rum-b10)"/>';
    return s;
  }

  // Droppar som sitter kvar på rutan (regnet som faller ritas i rain()).
  function drops(R0, x0, w, y0, h, m) {
    let s = '';
    for (let i = 0; i < m; i++) {
      const dx = x0 + R0() * w;
      const dy = y0 + R0() * h;
      const r = 1 + R0() * 3;
      if (R0() < 0.3) s += `<line x1="${r1(dx)}" y1="${r1(dy)}" x2="${r1(dx + (R0() - 0.5) * 4)}" y2="${r1(dy - 10 - R0() * 40)}" stroke="#dfe8ff" stroke-opacity=".08" stroke-width="${r1(r * 0.8)}"/>`;
      s += `<circle cx="${r1(dx)}" cy="${r1(dy)}" r="${r1(r)}" fill="#dfe8ff" opacity="${r1(0.1 + R0() * 0.12)}"/><circle cx="${r1(dx - r * 0.3)}" cy="${r1(dy - r * 0.3)}" r="${r1(r * 0.35)}" fill="#fff" opacity=".35"/>`;
    }
    return s;
  }

  // Cigarettpaketen på hyllorna längs högra väggen (påhittade färger, inga märken).
  function packs(R0, yb, x0, x1) {
    const cols = ['#c8643a', '#2a52a0', '#e7e1d2', '#3db37c', '#d8b06a', '#8b2e2a', '#1f6f6a', '#f0d699', '#5a5f8a'];
    let s = shelf(yb, x0, x1);
    let x = x0 + 4;
    while (x < x1) {
      const k = sc(x);
      const c = cols[(R0() * cols.length) | 0];
      const n = 3 + ((R0() * 5) | 0);
      for (let i = 0; i < n && x < x1; i++) {
        const w = 13 * k;
        for (let r = 0; r < 3; r++) {
          const h = 9 * k;
          const y1 = at(x, yb) - r * (h + 1);
          const y2 = at(x + w, yb) - r * (h + 1) * ((x + w - VP[0]) / (x - VP[0]));
          s += `<polygon points="${r1(x)},${r1(y1)} ${r1(x + w)},${r1(y2)} ${r1(x + w)},${r1(y2 - h * 1.03)} ${r1(x)},${r1(y1 - h)}" fill="${c}" opacity=".8"/>` +
            `<polygon points="${r1(x)},${r1(y1 - h)} ${r1(x + w)},${r1(y2 - h * 1.03)} ${r1(x + w)},${r1(y2 - h * 1.03 + 2 * k)} ${r1(x)},${r1(y1 - h + 2 * k)}" fill="#fff" opacity=".12"/>`;
        }
        x += w + k;
      }
      x += 4 * k;
    }
    return s;
  }
  function shelf(yb, x0, x1) {
    return `<polygon points="${x0},${r1(at(x0, yb))} ${x1},${r1(at(x1, yb))} ${x1},${r1(at(x1, yb) + 8 * sc(x1))} ${x0},${r1(at(x0, yb) + 8 * sc(x0))}" fill="#241d15"/>` +
      `<polygon points="${x0},${r1(at(x0, yb))} ${x1},${r1(at(x1, yb))} ${x1},${r1(at(x1, yb) + 1.4 * sc(x1))} ${x0},${r1(at(x0, yb) + 1.4 * sc(x0))}" fill="#c9bfa5" opacity=".18"/>`;
  }

  // Bakgrunden: tak, lysrör, väggarna (nikotingula, fläckiga, flagnande),
  // dörren, skyltfönstret, disken med godisburken.
  function bg() {
    const R0 = rng(17);
    const out = outside(R0);
    const win = drops(R0, 272, 676, 132, 426, 120);
    const door = drops(R0, 50, 172, 136, 560, 40);
    let candy = '';
    for (let i = 0; i < 36; i++) candy += `<circle cx="${r1(1414 + R0() * 52)}" cy="${r1(518 + R0() * 38)}" r="${r1(4 + R0() * 3)}" fill="${['#e04a3a', '#f0c23a', '#3db37c', '#f3ead9', '#a069e6'][(R0() * 5) | 0]}" opacity=".85"/>`;
    const R1 = rng(23);
    const top = packs(R1, 175, 1140, 1600) + packs(R1, 225, 1140, 1600);
    return svg(`${DEFS}
  <polygon points="0,0 1250,0 1140,90 0,90" fill="url(#rum-ceil)"/>
  <rect x="0" y="0" width="1250" height="90" filter="url(#rum-prick)" opacity=".5"/>
  <ellipse cx="650" cy="44" rx="470" ry="52" fill="#3a2a0e" opacity=".42" filter="url(#rum-b24)"/>
  <path d="M1010 8 q22 -6 40 6 q18 14 -2 26 q-20 10 -40 -2 q-16 -14 2 -30 z" fill="#5a4418" opacity=".28" filter="url(#rum-b4)"/>
  <path d="M1010 8 q22 -6 40 6 q18 14 -2 26 q-20 10 -40 -2 q-16 -14 2 -30 z" fill="none" stroke="#2a1e08" stroke-opacity=".35" stroke-width="1.6"/>
  <g stroke="#000" stroke-opacity=".18" stroke-width="1.2"><line x1="0" y1="45" x2="1194" y2="45"/><line x1="200" y1="0" x2="200" y2="90"/><line x1="560" y1="0" x2="560" y2="90"/><line x1="920" y1="0" x2="920" y2="90"/></g>
  <rect x="380" y="30" width="540" height="22" rx="3" fill="#d6d2c2"/>
  <rect x="392" y="35" width="516" height="6" rx="3" fill="#ffffff"/>
  <rect x="392" y="44" width="516" height="5" rx="2.5" fill="#f2f8ff"/>
  <rect x="384" y="30" width="62" height="22" fill="#3a2e18" opacity=".25"/>
  <ellipse cx="650" cy="62" rx="420" ry="70" fill="url(#rum-tube)" filter="url(#rum-b24)" class="rum-tubeglow"/>

  <rect x="0" y="90" width="1140" height="640" fill="url(#rum-wall)"/>
  <rect x="0" y="90" width="1140" height="640" fill="url(#rum-nik)"/>
  <rect x="0" y="90" width="1140" height="640" filter="url(#rum-flack)" opacity=".75"/>
  <rect x="0" y="90" width="1140" height="640" filter="url(#rum-prick)" opacity=".55"/>
  <rect x="0" y="90" width="1140" height="6" fill="#000" opacity=".3"/>
  <path d="M640 92 q30 26 18 60 q-6 22 10 40" fill="none" stroke="#3b2a12" stroke-opacity=".28" stroke-width="7" filter="url(#rum-b4)"/>
  <ellipse cx="760" cy="104" rx="58" ry="16" fill="none" stroke="#4a3412" stroke-opacity=".3" stroke-width="3" filter="url(#rum-b1)"/>
  <ellipse cx="768" cy="106" rx="40" ry="10" fill="#4a3412" opacity=".12" filter="url(#rum-b4)"/>
  <rect x="986" y="286" width="132" height="196" fill="#b5a47a" opacity=".16"/>
  <rect x="986" y="286" width="132" height="196" fill="none" stroke="#2a2010" stroke-opacity=".18" stroke-width="2" filter="url(#rum-b1)"/>
  <path d="M958 122 l9 -9 l-2 -7 l11 -9 l6 -6" fill="none" stroke="#1e160a" stroke-opacity=".55" stroke-width="1.2"/>
  <path d="M700 90 L700 104 Q700 112 690 114 L360 120 Q352 121 352 130" fill="none" stroke="#2c2a26" stroke-width="2.2" opacity=".85"/>
  <g fill="#cbbf9e" opacity=".5"><rect x="512" y="114" width="5" height="3" rx="1"/><rect x="420" y="117" width="5" height="3" rx="1"/></g>
  <path d="M0 470 q30 -10 60 4 l-4 18 q-30 -8 -56 2 z" fill="#2a1e0c" opacity=".14" filter="url(#rum-b4)"/>
  <path d="M262 590 q14 8 40 6 q30 -4 46 10 l-2 30 l-84 0 z" fill="#9b8c68" opacity=".35"/>
  <path d="M262 590 q14 8 40 6 q30 -4 46 10" fill="none" stroke="#241c10" stroke-opacity=".4" stroke-width="1.2"/>

  <polygon points="1140,90 1250,0 1600,0 1600,1000 1140,730" fill="url(#rum-rwall)"/>
  <polygon points="1140,90 1250,0 1600,0 1600,1000 1140,730" filter="url(#rum-flack)" opacity=".55"/>
  <line x1="1140" y1="90" x2="1140" y2="730" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
  ${top}
  <polygon points="1140,90 1600,0 1600,1000 1140,730" fill="#000" opacity=".2"/>

  <rect x="36" y="122" width="200" height="610" fill="#3b3b3d"/>
  <g clip-path="url(#rum-doorglass)"><g transform="translate(-260 0)" filter="url(#rum-b1)">${out}</g>${door}
    <rect x="50" y="136" width="172" height="560" filter="url(#rum-grime)" opacity=".5"/></g>
  <rect x="50" y="136" width="172" height="560" fill="#fff" opacity=".03"/>
  <rect x="44" y="420" width="184" height="16" rx="3" fill="url(#rum-alu)"/>
  <path d="M36 122 h200 v610 h-200 z M50 136 v560 h172 v-560 z" fill="#1e1e20" fill-rule="evenodd" opacity=".001"/>
  <path d="M136 122 v12" stroke="#7a6a4a" stroke-width="2"/>
  <path d="M126 148 Q136 128 146 148 Z" fill="#c9a252"/><circle cx="136" cy="150" r="2.5" fill="#8a6a2a"/>
  <path d="M118 176 L136 158 L154 176" fill="none" stroke="#2a2420" stroke-width="1.2"/>
  <rect x="96" y="176" width="80" height="30" rx="3" fill="#ece0c4"/>
  <rect x="96" y="176" width="80" height="30" rx="3" fill="none" stroke="#b3261e" stroke-width="2"/>
  <text x="136" y="197" text-anchor="middle" font-family="Fraunces" font-weight="800" font-size="15" letter-spacing="1.5" fill="#b3261e">STÄNGT</text>
  <!-- namnet i bladguld på glaset, spegelvänt inifrån som neonskylten -->
  <a class="rum-sak" href="om-oss.html" aria-label="Om oss" id="rum-dorrnamn">
    <rect x="60" y="226" width="152" height="72" fill="#000" opacity=".001"/>
    <g transform="translate(272 0) scale(-1 1)" font-family="Fraunces" text-anchor="middle">
      <text font-style="italic" font-weight="700" font-size="21" fill="#1a1208" opacity=".55" transform="translate(1.5 2)"><textPath href="#rum-dorrbage" startOffset="50%">Matchfixarna</textPath></text>
      <text font-style="italic" font-weight="700" font-size="21" fill="url(#rum-guld)" stroke="#3a2808" stroke-width=".8" paint-order="stroke"><textPath href="#rum-dorrbage" startOffset="50%">Matchfixarna</textPath></text>
      <line x1="92" y1="262" x2="180" y2="262" stroke="url(#rum-guld)" stroke-width="1.2"/>
      <text x="136" y="277" font-weight="700" font-size="10.5" letter-spacing="2.4" fill="url(#rum-guld)" stroke="#3a2808" stroke-width=".4" paint-order="stroke">TOBAK &amp; SPEL</text>
      <text x="136" y="292" font-style="italic" font-size="9.5" fill="#d8b46a" opacity=".9">Öppet till spelstoppet</text>
    </g>
  </a>
  <!-- flagnad färg vid dörrkarmen -->
  <path d="M236 300 l14 6 l-3 18 l9 12 l-6 22 l4 16 l-18 4 z" fill="#9b8c68" opacity=".55"/>
  <path d="M236 300 l14 6 l-3 18 l9 12 l-6 22 l4 16" fill="none" stroke="#241c10" stroke-opacity=".45" stroke-width="1.4"/>
  <path d="M250 306 l7 -3 l-2 9 z" fill="#b8a77d" opacity=".7"/>
  <path d="M0 560 l22 -8 l6 20 l-10 18 l8 26 l-26 6 z" fill="#9b8c68" opacity=".5"/>

  <rect x="262" y="122" width="696" height="446" fill="#3a3a3c"/>
  <g clip-path="url(#rum-win)">
    <g filter="url(#rum-b1)">${out}</g>${win}
    <rect x="272" y="132" width="676" height="426" fill="#fff" opacity=".03"/>
    <rect x="420" y="150" width="420" height="5" rx="2" fill="#fff" opacity=".12" filter="url(#rum-b1)"/>
    <rect x="272" y="132" width="676" height="426" filter="url(#rum-grime)" opacity=".45"/>
    <rect x="272" y="520" width="676" height="38" fill="#2a2418" opacity=".35" filter="url(#rum-b4)"/>
  </g>
  <rect x="604" y="132" width="12" height="426" fill="#3a3a3c"/>
  <rect x="262" y="558" width="696" height="12" fill="#2c2c2e"/>
  <path d="M940 122 l18 0 l0 30 l-9 -6 l-4 10 l-5 -12 z" fill="#8e8064" opacity=".5"/>
  <ellipse cx="440" cy="236" rx="320" ry="200" fill="#ff4a30" opacity=".08" filter="url(#rum-b40)" class="rum-neonglow"/>

  <polygon points="1060,490 1140,490 1600,599 1600,652" fill="url(#rum-countertop)"/>
  <polygon points="1060,490 1600,652 1600,1000 1060,1000" fill="url(#rum-counter)"/>
  <line x1="1060" y1="490" x2="1600" y2="652" stroke="#c9c2b2" stroke-opacity=".35" stroke-width="2"/>
  <g stroke="#d9c7a1" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round">
    <line x1="1092" y1="500" x2="1130" y2="511"/><line x1="1236" y1="543" x2="1250" y2="547"/><line x1="1318" y1="567" x2="1372" y2="583"/><line x1="1490" y1="619" x2="1512" y2="626"/>
  </g>
  <polygon points="1060,492 1600,654 1600,700 1060,540" fill="#000" opacity=".12"/>
  <polygon points="1262,486 1340,500 1340,530 1262,514" fill="#232325"/>
  <polygon points="1278,488 1322,496 1320,470 1280,463" fill="#f1efe8"/>
  <ellipse cx="1440" cy="560" rx="34" ry="8" fill="#000" opacity=".35" filter="url(#rum-b4)"/>
  <rect x="1408" y="490" width="64" height="70" rx="12" fill="#d9e6ea" opacity=".2"/>
  ${candy}
  <rect x="1404" y="482" width="72" height="12" rx="4" fill="#c8643a"/>
  <rect x="1410" y="494" width="60" height="62" rx="10" fill="#cfc4a3" opacity=".12"/>

  <g stroke="#1f1f20" stroke-width="7" fill="none"><path d="M22 650 V306 H324 V650"/></g>
  <rect x="18" y="300" width="310" height="8" fill="url(#rum-alu)"/>
  <rect x="18" y="298" width="310" height="3" fill="#cfc6b0" opacity=".25"/>`);
  }

  // Regnet som faller utanför: två band per ruta som glider nedåt (bara
  // transform, så att det blir billigt).
  function rain() {
    const R0 = rng(5);
    const band = (w, h, n, o) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const x = R0() * w;
        const y = R0() * h;
        const len = 16 + R0() * 34;
        const line = `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x - len * 0.12)}" y2="${r1(y + len)}" stroke="#c8d6f0" stroke-opacity="${r1(o + R0() * 0.14)}" stroke-width="${r1(0.7 + R0() * 0.6)}"/>`;
        s += line + line.replace(/y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/, (_, a, b, c) => `y1="${r1(+a + h)}" x2="${b}" y2="${r1(+c + h)}"`);
      }
      return `<svg viewBox="0 0 ${w} ${2 * h}" width="${w}" height="${2 * h}">${s}</svg>`;
    };
    const pane = (x, y, w, h, n) => `<div class="rum-regn" style="left:${x}px; top:${y}px; width:${w}px; height:${h}px">` +
      `<div class="rum-regn-b fjarr" style="height:${2 * h}px">${band(w, h, Math.round(n * 0.6), 0.03)}</div>` +
      `<div class="rum-regn-b" style="height:${2 * h}px">${band(w, h, n, 0.05)}</div>` +
      `<i class="rum-droppe" style="left:${Math.round(w * 0.3)}px"></i><i class="rum-droppe d2" style="left:${Math.round(w * 0.72)}px"></i></div>`;
    return pane(272, 132, 676, 426, 220) + pane(50, 136, 172, 560, 70);
  }

  // Neonskylten, spegelvänd inifrån; ett av o:na glappar ibland.
  function neon() {
    const word = (y, cls = '') => `<g class="rum-neon${cls}" transform="translate(880 0) scale(-1 1)" font-family="Fraunces" font-style="italic" font-weight="600" text-anchor="middle">` +
      `<text x="440" y="${y}" font-size="68" fill="#ff2d1f" filter="url(#rum-b10)" opacity=".9">Tobak</text>` +
      `<text x="440" y="${y}" font-size="68" fill="none" stroke="#ff3a2a" stroke-width="6" filter="url(#rum-b4)">Tobak</text>` +
      `<text x="440" y="${y}" font-size="68" fill="none" stroke="#ffd6cf" stroke-width="1.8">Tobak</text></g>`;
    return svg(`<line x1="350" y1="132" x2="356" y2="140" stroke="#555" stroke-width="1"/><line x1="530" y1="132" x2="524" y2="140" stroke="#555" stroke-width="1"/>
      <ellipse cx="440" cy="168" rx="160" ry="58" fill="#ff3a2a" opacity=".28" filter="url(#rum-b24)" class="rum-neonhalo"/>
      ${word(190)}<rect x="420" y="200" width="40" height="10" rx="2" fill="#1d1b1a"/>`);
  }

  // Löpsedlarna i stället, den vänstra med ett hörn som släppt.
  function lop() {
    return '<div class="rum-lop" style="left:28px; top:318px"><span class="mast">Facit</span><div class="kick">Experterna:</div><div class="head">Bollen är rund</div><i class="tejp" style="left:6px"></i></div>' +
      '<div class="rum-lop slapp" style="left:178px; top:318px"><span class="mast">Facit</span><div class="kick">Lördag:</div><div class="head">DJ tror på kryss</div>' +
      '<i class="tejp" style="left:8px"></i><i class="horn"></i></div>';
  }

  // ---------- de sju sakerna ----------

  // 1. Fällbladstavlan: på bakväggen till höger om fönstret. Omgångens
  // matcher med oddsen före avspark, sedan ställningen och det rätta tecknet
  // tänt. Fyra matcher i taget; den bläddrar och klaprar. Klickar man zoomar
  // man in på den och ser alla matcher på en gång (närbilden); där leder
  // raderna till matcherna och guldordet till Matcher.
  // En rad är fält av blad: hemmalaget, ställningen, bortalaget och oddsen
  // för 1, X och 2 – siffrorna 1, X och 2 är målade på ramen ovanför.
  const NAME = 11;
  const FIELDS = [NAME, 3, NAME, 3, 3, 3];
  const HEAD = [19, 3];
  const ROWS = 4;
  const fbField = (n, i, inner = '<b> </b>'.repeat(n)) => `<span class="fl f${i}" style="--n:${n}">${inner}</span>`;
  const fbRow = (fields, cls = '', href = '') => {
    const tag = href ? 'a' : 'span';
    return `<${tag} class="rum-fb-r${cls}"${href ? ` href="${href}"` : ''}>${fields.map((n, i) => fbField(n, i)).join('')}</${tag}>`;
  };
  const fbFrame = () => '<span class="rum-fb-skruv"></span><span class="rum-fb-skruv h"></span><span class="rum-fb-skruv n"></span><span class="rum-fb-skruv n h"></span>' +
    `${fbRow(HEAD, ' rum-fb-hd')}<span class="rum-fb-r rum-fb-lb">${FIELDS.map((n, i) => fbField(n, i, i > 2 ? `<i>${'1X2'[i - 3]}</i>` : '')).join('')}</span>`;
  function boardHtml() {
    return '<a class="rum-fb rum-sak" href="#matcher" data-nav="matcher" aria-label="Omgångens matcher" id="rum-fb">' +
      `${fbFrame()}${Array.from({ length: ROWS }, () => fbRow(FIELDS)).join('')}</a>`;
  }
  function closeHtml() {
    return '<div class="rum-nara" id="rum-nara"><div class="rum-nara-bak"></div>' +
      `<div class="rum-fb rum-fb-stor" id="rum-fbn" role="dialog" aria-label="Omgångens matcher" tabindex="-1">${fbFrame()}<span class="rum-fbn-rader" id="rum-fbn-rader"></span>` +
      '<span class="rum-fbn-fot"><a class="rum-guld" href="#matcher" data-nav="matcher">Alla matcher</a></span></div></div>';
  }

  // 5. Omgångens orakel: oraklet ur Olympen (Kronan.scene, fotona på
  // sockeln) i en förgylld ram under fällbladstavlan, med mässingsskylten
  // under. Ett skimmer drar då och då över guldet och glaset.
  const RAM = { w: 126, h: 152, b: 13, f: 5.5 };
  function gilt() {
    const { w, h, b, f } = RAM;
    // listen i genomskärning, utifrån och in: kanten, rundstaven, hålkälen,
    // frisen (f till f + 4 px, med meandern), pärlstaven och falsen mot bilden
    const prof = [[0, '#3a2408'], [0.08, '#e9c878'], [0.16, '#a87a2e'], [0.25, '#f7e3a1'], [0.34, '#b8862f'],
      [0.39, '#6e4a16'], [0.43, '#8f6526'], [0.73, '#a57a32'], [0.8, '#f0d48a'], [0.88, '#8a5f20'], [0.94, '#2c1a06'], [1, '#160d03']]
      .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
    // varje sida med sin genomskärning (utifrån och in) och sitt ljus: ljuset
    // faller uppifrån och från vänster
    const sides = [
      [`0,0 ${w},0 ${w - b},${b} ${b},${b}`, '0 0 0 1', '#fff', 0.16],
      [`0,0 ${b},${b} ${b},${h - b} 0,${h}`, '0 0 1 0', '#fff', 0.06],
      [`${w},0 ${w},${h} ${w - b},${h - b} ${w - b},${b}`, '1 0 0 0', '#000', 0.22],
      [`0,${h} ${b},${h - b} ${w - b},${h - b} ${w},${h}`, '0 1 0 0', '#000', 0.34],
    ];
    const grads = sides.map(([, v], i) => {
      const [x1, y1, x2, y2] = v.split(' ');
      return `<linearGradient id="rum-ram-p${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${prof}</linearGradient>`;
    }).join('');
    // meandern, 4 px hög, börjar jämnt i varje sida (de stående är vridna:
    // mönstrets y blir −x)
    const band = [['t', 0, f], ['b', 0, h - f - 4], ['l', 1, f], ['r', 1, w - f - 4]];
    const keys = band.map(([k, rot, at]) => `<pattern id="rum-ram-m${k}" width="4" height="4" patternUnits="userSpaceOnUse" ` +
      `${rot ? `y="${-at - 4}" patternTransform="rotate(90)"` : `y="${at}"`}><g transform="scale(.3333)" fill="none" stroke-width="1.6">` +
      '<path d="M0 10H2V2H10V6H6V10H12" stroke="#f6dfa0" opacity=".55" transform="translate(.8 .8)"/>' +
      '<path d="M0 10H2V2H10V6H6V10H12" stroke="#4a300c"/></g></pattern>').join('');
    const frieze = band.map(([k, rot, at]) => (rot
      ? `<rect x="${at}" y="${f}" width="4" height="${h - 2 * f}" fill="url(#rum-ram-m${k})"/>`
      : `<rect x="${f}" y="${at}" width="${w - 2 * f}" height="4" fill="url(#rum-ram-m${k})"/>`)).join('');
    const c = f + 2;
    const roses = [[c, c], [w - c, c], [c, h - c], [w - c, h - c]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="url(#rum-ram-ros)" stroke="#4a300c" stroke-width=".5"/><circle cx="${x}" cy="${y}" r=".8" fill="#6e4a16"/>`).join('');
    // palmetten överst: sju blad i solfjäder ur två voluter
    const cx = w / 2;
    const leaves = [-66, -44, -22, 0, 22, 44, 66].map((a, i) => {
      const len = [6.5, 8.5, 10.5, 12, 10.5, 8.5, 6.5][i];
      const r = a * Math.PI / 180;
      const x = cx + Math.sin(r) * (len / 2 + 1.5);
      const y = -1 - Math.cos(r) * (len / 2 + 1.5);
      return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="1.8" ry="${len / 2}" transform="rotate(${a} ${r1(x)} ${r1(y)})"/>`;
    }).join('');
    const crest = `<g transform="translate(${cx} 0) scale(.75) translate(${-cx} 0)" fill="url(#rum-ram-kron)" stroke="#5a3c10" stroke-width=".5">${leaves}` +
      `<path d="M${cx - 12} 0.5Q${cx - 13} -5 ${cx - 9} -4.5Q${cx - 6} -4 ${cx - 8} -2M${cx + 12} 0.5Q${cx + 13} -5 ${cx + 9} -4.5Q${cx + 6} -4 ${cx + 8} -2" fill="none" stroke-width="1.6" stroke="#b8862f"/>` +
      `<ellipse cx="${cx}" cy="-1" rx="4" ry="2.4"/></g>`;
    return `<svg viewBox="0 -12 ${w} ${h + 12}" aria-hidden="true"><defs>${grads}${keys}` +
      '<radialGradient id="rum-ram-ros" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#fbeec0"/><stop offset=".55" stop-color="#b8862f"/><stop offset="1" stop-color="#5a3c10"/></radialGradient>' +
      '<linearGradient id="rum-ram-kron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e3a1"/><stop offset="1" stop-color="#9a6d26"/></linearGradient></defs>' +
      sides.map(([pts], i) => `<polygon points="${pts}" fill="url(#rum-ram-p${i})"/>`).join('') + frieze + roses +
      sides.map(([pts, , col, o]) => `<polygon points="${pts}" fill="${col}" opacity="${o}"/>`).join('') +
      `<rect x=".3" y=".3" width="${w - 0.6}" height="${h - 0.6}" fill="none" stroke="#2a1a06" stroke-width=".6"/>${crest}</svg>`;
  }
  function frameHtml() {
    return '<a class="rum-ram rum-sak" href="#olympen" data-nav="olympen" aria-label="Olympen">' +
      `<span class="rum-ram-list">${gilt()}<span class="kr-scene kr-orakel" id="rum-ram-bild"></span><span class="rum-ram-glans"></span></span>` +
      '<span class="rum-ram-skylt"><small>Omgångens orakel</small><b id="rum-ram-namn"></b></span></a>';
  }

  // Högra väggen i perspektiv: ett element med väggens mått (z = djupet in
  // från hörnet, y = höjden i hörnet) vrids in mot väggen. P = 1000 px.
  const wz = (x) => 1000 * (1 - (1140 - VP[0]) / (x - VP[0]));
  function onWall(x0, x1, yb0, yb1, cls, inner, attrs) {
    const z0 = wz(x0);
    return `<a class="${cls} rum-sak" ${attrs} style="top:${yb0}px; height:${yb1 - yb0}px; width:${r1(wz(x1) - z0)}px; transform: rotateY(-90deg) translateX(${r1(z0)}px)">${inner}</a>`;
  }

  // 3. Korktavlan med gängets gamla kuponger, rättade med röd penna.
  // 6. Krittavlan med ligatabellen som dagens meny.
  function rightWall() {
    return '<div class="rum-hv">' +
      onWall(1330, 1478, 352, 458, 'rum-krita', '<span class="rum-krita-in" id="rum-krita"></span>', 'href="tabeller.html" data-nav="tabeller" aria-label="Tabeller"') +
      onWall(1496, 1700, 330, 478, 'rum-kork', '<span class="rum-kork-in" id="rum-kork"></span>', 'href="#olympen/kuponger" data-nav="olympen" aria-label="Gängets kuponger"') +
      '</div>';
  }

  // 4. Pokalhyllan och 7. pärmarna: ritas på väggen (shelves()).
  const POKAL = { yb: 288, x0: 1146, x1: 1312 };
  const PARM = { yb: 402, x0: 1146, x1: 1322 };
  function trophy(x, yb, col, i) {
    const k = sc(x) * 0.95;
    const y = at(x, yb);
    const id = `rum-pk${i}`;
    return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${k.toFixed(3)})">` +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${col}"/><stop offset=".3" stop-color="#fff" stop-opacity=".9"/>` +
      `<stop offset=".45" stop-color="${col}"/><stop offset="1" stop-color="#111"/></linearGradient></defs>` +
      '<rect x="-7" y="-7" width="14" height="7" fill="#2a1f16"/><rect x="-4.5" y="-5" width="9" height="2.4" fill="#c9a24c"/>' +
      `<path d="M-1.6 -7 L1.6 -7 L1 -14 L-1 -14 Z" fill="url(#${id})"/><ellipse cx="0" cy="-14" rx="3.4" ry="1.2" fill="url(#${id})"/>` +
      `<path d="M-7.5 -30 Q-7 -17 0 -15 Q7 -17 7.5 -30 Z" fill="url(#${id})"/><ellipse cx="0" cy="-30" rx="7.5" ry="1.6" fill="#000" opacity=".35"/>` +
      `<path d="M-7 -28 q-5 0 -5 5 q0 4 6 5" fill="none" stroke="${col}" stroke-width="1.6"/><path d="M7 -28 q5 0 5 5 q0 4 -6 5" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="1.6"/>` +
      '<rect x="-7" y="-31" width="14" height="1" fill="#e8e2d2" opacity=".35"/></g>';
  }
  function binder(x, w, i, label) {
    const cols = ['#3b3f45', '#7b2a26', '#2c4a6b', '#4a5a3a', '#6d6658', '#262626', '#8a6d3b'];
    const c = cols[i % cols.length];
    const top = PARM.yb - 50 + (i % 3 === 1 ? 3 : 0);
    const pt = (xx, yb) => `${r1(xx)},${r1(at(xx, yb))}`;
    const xm = x + w / 2;
    const k = sc(xm);
    const slope = (top + 12 - VP[1]) / (1140 - VP[0]);
    return `<polygon points="${pt(x, PARM.yb)} ${pt(x + w, PARM.yb)} ${pt(x + w, top)} ${pt(x, top)}" fill="${c}"/>` +
      `<polygon points="${pt(x, PARM.yb)} ${pt(x + w * 0.18, PARM.yb)} ${pt(x + w * 0.18, top)} ${pt(x, top)}" fill="#fff" opacity=".08"/>` +
      `<polygon points="${pt(x + w * 0.2, top + 6)} ${pt(x + w * 0.8, top + 6)} ${pt(x + w * 0.8, top + 18)} ${pt(x + w * 0.2, top + 18)}" fill="#e9e2cf" opacity=".9"/>` +
      `<text transform="translate(${r1(xm)} ${r1(at(xm, top + 14.5))}) skewY(${(Math.atan(slope) * 180 / Math.PI).toFixed(1)}) scale(${(k * 0.5).toFixed(2)})" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="11" fill="#2a241c">${label}</text>` +
      `<ellipse cx="${r1(xm)}" cy="${r1(at(xm, PARM.yb - 12))}" rx="${r1(2.6 * k)}" ry="${r1(4 * k)}" fill="#111" opacity=".55"/>`;
  }
  function shelves(trophies, seasons) {
    let s = shelf(POKAL.yb, POKAL.x0, POKAL.x1);
    // en pokal per vunnen omgång, i vinnarens färg; ett dammfritt märke där
    // nästa ska stå
    let x = POKAL.x0 + 10;
    trophies.forEach((col, i) => {
      if (x > POKAL.x1 - 8) return;
      s += trophy(x, POKAL.yb, col, i);
      x += 17 * sc(x);
    });
    if (x < POKAL.x1 - 8) s += `<ellipse cx="${r1(x)}" cy="${r1(at(x, POKAL.yb) - 1)}" rx="${r1(6 * sc(x))}" ry="${r1(1.6 * sc(x))}" fill="#000" opacity=".25"/>`;
    s += shelf(PARM.yb, PARM.x0, PARM.x1);
    let bx = PARM.x0 + 4;
    seasons.forEach((label, i) => {
      const w = 10.5 * sc(bx);
      if (bx + w > PARM.x1) return;
      s += binder(bx, w, i, label);
      bx += w + 0.6 * sc(bx);
    });
    // damm på hyllkanterna
    s += `<polygon points="${POKAL.x0},${r1(at(POKAL.x0, POKAL.yb) - 0.6)} ${POKAL.x1},${r1(at(POKAL.x1, POKAL.yb) - 0.8)} ${POKAL.x1},${r1(at(POKAL.x1, POKAL.yb) + 0.6)} ${POKAL.x0},${r1(at(POKAL.x0, POKAL.yb) + 0.5)}" fill="#d9d2c0" opacity=".3"/>`;
    // ytorna man klickar på
    const hit = (x0, x1, y0, y1, nav, href, label) => `<a href="${href}" data-nav="${nav}" class="rum-sak rum-yta" aria-label="${label}">` +
      `<polygon points="${x0},${r1(at(x0, y1))} ${x1},${r1(at(x1, y1))} ${x1},${r1(at(x1, y0))} ${x0},${r1(at(x0, y0))}" fill="#fff" opacity="0"/></a>`;
    s += hit(POKAL.x0, POKAL.x1, POKAL.yb - 36, POKAL.yb + 6, 'olympen', '#olympen', 'Olympen');
    s += hit(PARM.x0, PARM.x1, PARM.yb - 52, PARM.yb + 6, 'statistik', 'statistik.html', 'Statistik');
    return s;
  }

  // Kupongstället vid fönstret: blanka kuponger i ett fack av plexiglas,
  // butikens pennor (samma som kupongens) i ett rör bredvid och en lapp.
  function stall() {
    const sheet = (x, y, a, rows) => {
      let s = `<g transform="translate(${x} ${y}) rotate(${a})"><rect width="100" height="128" fill="#e9dfc6"/><rect width="100" height="15" fill="#c8643a"/>` +
        '<text x="5" y="9.4" font-family="Fraunces" font-weight="700" font-size="4" letter-spacing=".8" fill="#f6ecd9">MATCHFIXARNA</text>' +
        '<text x="95" y="11" text-anchor="end" font-family="Fraunces" font-weight="800" font-size="9" fill="#f6ecd9">Kupong</text>';
      for (let i = 0; i < rows; i++) {
        const ry = 22 + i * 12;
        s += `<line x1="6" y1="${ry + 7}" x2="48" y2="${ry + 7}" stroke="#8a6a4a" stroke-opacity=".45"/>` +
          [56, 70, 84].map((bx) => `<rect x="${bx}" y="${ry}" width="11" height="8" fill="none" stroke="#a87650" stroke-width=".8"/>`).join('');
      }
      return `${s}<rect width="100" height="128" fill="url(#rum-cupg)" opacity=".25"/></g>`;
    };
    // spetsen uppåt: kroppen i tre ljus, trät och blyertsen
    const pen = (x, a, l) => `<g transform="translate(${x} 0) rotate(${a})"><rect x="-2.5" y="${-l}" width="5" height="${l}" fill="url(#rum-penna)"/>` +
      `<path d="M-2.5 ${-l}L0 ${-l - 9}L2.5 ${-l}Z" fill="#e2c08c"/><path d="M-.85 ${-l - 6}L0 ${-l - 9}L.85 ${-l - 6}Z" fill="#2a2a2a"/></g>`;
    const glas = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#cfe2f0" opacity=".1"/>` +
      `<rect x="${x}" y="${y - 1}" width="${w}" height="2" fill="#fff" opacity=".6"/>` +
      `<g fill="#fff" opacity=".3"><rect x="${x}" y="${y}" width="1.5" height="${h}"/><rect x="${x + w - 1.5}" y="${y}" width="1.5" height="${h}"/></g>` +
      `<polygon points="${x + w * 0.55},${y} ${x + w * 0.75},${y} ${x + w * 0.45},${y + h} ${x + w * 0.25},${y + h}" fill="#fff" opacity=".06"/>`;
    return `<g transform="translate(150 688) scale(.85)"><defs>
      <linearGradient id="rum-penna" x1="0" y1="0" x2="1" y2="0"><stop offset=".3" stop-color="#f0f0ec"/><stop offset=".3" stop-color="#d9d7d0"/><stop offset=".7" stop-color="#d9d7d0"/><stop offset=".7" stop-color="#b8b5ac"/></linearGradient>
      <linearGradient id="rum-stallfack" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#1a0f06" stop-opacity="0"/><stop offset="1" stop-color="#1a0f06" stop-opacity=".5"/></linearGradient>
      <clipPath id="rum-stallet"><rect x="-90" y="-170" width="180" height="164"/></clipPath></defs>
      <ellipse cx="2" cy="1" rx="90" ry="9" fill="#000" opacity=".5" filter="url(#rum-b4)"/>
      <g clip-path="url(#rum-stallet)">${sheet(-73, -124, -3, 2)}${sheet(-67, -131, 2, 2)}${sheet(-70, -126, 0, 9)}
        <rect x="-80" y="-140" width="122" height="134" fill="url(#rum-stallfack)"/><rect x="46" y="-50" width="26" height="44" fill="#000" opacity=".18"/>
        ${pen(53, -9, 54)}${pen(58, -2, 62)}${pen(63, 6, 52)}${pen(67, 12, 48)}</g>
      ${glas(-76, -68, 116, 62)}${glas(46, -50, 26, 44)}
      <rect x="49" y="-47" width="2.5" height="39" fill="#fff" opacity=".3"/><ellipse cx="59" cy="-50" rx="13" ry="3" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>
      <rect x="-80" y="-6" width="158" height="6" rx="1.5" fill="url(#rum-alu)"/><rect x="-80" y="-6" width="158" height="1" fill="#e8e6de" opacity=".5"/>
      <g transform="translate(-18 -36) rotate(-4)"><rect x="-44" y="-10" width="88" height="15" fill="#f6f1a8"/>
        <rect x="-8" y="-13" width="16" height="6" fill="#e8e2c8" opacity=".75"/>
        <text y="1.5" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="11" fill="#2a241c">Pennorna är räknade</text></g>
    </g>`;
  }

  // ---------- lagren ----------

  function table() {
    return svg(`<rect x="-10" y="650" width="1620" height="360" fill="url(#rum-pult)"/>
  <rect x="-10" y="650" width="1620" height="360" filter="url(#rum-grainwood)"/>
  <rect x="-10" y="650" width="1620" height="360" filter="url(#rum-flack)" opacity=".35"/>
  <rect x="-10" y="647" width="1620" height="6" fill="url(#rum-alu)"/>
  <g stroke="#e8e0cc" stroke-opacity=".35" stroke-width="1.2"><line x1="210" y1="649" x2="268" y2="649"/><line x1="720" y1="650" x2="742" y2="650"/><line x1="1302" y1="649" x2="1380" y2="649"/></g>
  <ellipse cx="800" cy="840" rx="580" ry="160" fill="#ffd9a6" opacity=".10" filter="url(#rum-b40)"/>
  <ellipse cx="460" cy="700" rx="320" ry="50" fill="#ff4a30" opacity=".10" filter="url(#rum-b40)"/>
  <ellipse cx="1340" cy="930" rx="34" ry="12" fill="none" stroke="#2a160a" stroke-opacity=".35" stroke-width="3"/>
  <ellipse cx="1120" cy="700" rx="30" ry="10" fill="none" stroke="#2a160a" stroke-opacity=".25" stroke-width="2.5"/>
  <g fill="#1a0e06" opacity=".55"><ellipse cx="372" cy="760" rx="7" ry="3"/><ellipse cx="1452" cy="742" rx="6" ry="2.4"/><ellipse cx="1480" cy="870" rx="5" ry="2"/></g>
  ${stall()}
  <circle cx="1150" cy="790" r="7" fill="none" stroke="#a9a9a4" stroke-width="3"/><circle cx="1150" cy="790" r="2.5" fill="#55554f"/>
  <rect x="-10" y="984" width="1620" height="20" fill="url(#rum-alu)"/>`);
  }

  function props() {
    return svg(`<rect x="1384" y="538" width="5" height="112" fill="url(#rum-alu)"/><rect x="1447" y="538" width="5" height="112" fill="url(#rum-alu)"/>
  <rect x="1378" y="530" width="80" height="18" rx="8" fill="#7d2925"/>
  <path d="M1398 534 q10 -3 22 1" stroke="#c9b18a" stroke-opacity=".6" stroke-width="3" fill="none"/>
  <rect x="1414" y="604" width="7" height="46" fill="url(#rum-alu)"/>
  <ellipse cx="1418" cy="606" rx="46" ry="9" fill="#5a1f1b"/><ellipse cx="1418" cy="602" rx="44" ry="8" fill="#8b2e2a" stroke="#b9b9b2" stroke-width="2"/>
  <path d="M1384 601 q14 -4 26 -1" stroke="#e0c99a" stroke-opacity=".5" stroke-width="2" fill="none"/>`);
  }

  function sill() {
    const S = 568;
    return svg(`<polygon points="262,${S - 14} 958,${S - 14} 984,${S + 10} 236,${S + 10}" fill="url(#rum-sill)"/>
  <polygon points="262,${S - 14} 958,${S - 14} 984,${S + 10} 236,${S + 10}" filter="url(#rum-prick)" opacity=".6"/>
  <rect x="236" y="${S + 10}" width="748" height="12" fill="#4a453c"/>
  <g stroke="#cfc6b0" stroke-opacity=".45" stroke-width="1.6"><line x1="300" y1="${S + 10}" x2="342" y2="${S + 10}"/><line x1="610" y1="${S + 10}" x2="628" y2="${S + 10}"/><line x1="880" y1="${S + 10}" x2="930" y2="${S + 10}"/></g>
  <rect x="236" y="${S + 22}" width="748" height="6" fill="#000" opacity=".3" filter="url(#rum-b4)"/>
  <ellipse cx="560" cy="${S - 150}" rx="360" ry="150" fill="#ff3a2a" opacity=".05" filter="url(#rum-b40)"/>`) +
      '<canvas id="rum-3d" class="rum-3d" width="1280" height="560"></canvas>';
  }

  function tv() {
    return svg(`<rect x="1352" y="0" width="7" height="122" fill="#1a1a1a"/>
  <polygon points="1316,112 1556,104 1556,300 1316,292" fill="#1b1a19"/>
  <polygon points="1316,112 1556,104 1556,300 1316,292" fill="none" stroke="#fff" stroke-opacity=".06"/>
  <polygon points="1318,112 1556,104 1556,108 1318,116" fill="#d6cfbd" opacity=".22"/>`) +
      '<a class="rum-tv rum-sak" href="#matcher" data-nav="tv" aria-label="Text-tv" id="rum-tv"><span class="ttx" id="rum-ttx"></span><span class="scan"></span><span class="glass"></span></a>';
  }

  function paper() {
    return '<a id="rum-kvitto" class="rum-flat rum-sak" href="#kupong" data-nav="kupong" aria-label="Kupong"></a>' +
      '<span id="rum-hogen"></span>' +
      '<a id="rum-kupong" class="rum-flat rum-kup rum-sak" href="#kupong" data-nav="kupong" aria-label="Kupong"></a>' +
      svg('<path d="M846 930 C 960 980, 1110 920, 1150 796" fill="none" stroke="#b9b9b2" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 7"/>' +
        '<path d="M846 930 C 960 980, 1110 920, 1150 796" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="3" transform="translate(3 6)" stroke-dasharray="0.1 7" stroke-linecap="round"/>') +
      '<a class="rum-tag" href="#kupong" data-nav="kupong" id="rum-tag">Fyll i kupongen</a>';
  }

  // Röken som lagt sig under lysröret, och dammet som syns i ljuset.
  function haze() {
    return '<div class="rum-rok"><i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i></div>' +
      '<canvas class="rum-damm" id="rum-damm" width="800" height="500"></canvas>';
  }

  function build() {
    const el = document.createElement('section');
    el.id = 'rum-section';
    el.className = 'rum';
    el.hidden = true;
    el.setAttribute('aria-label', 'Tobaksaffären');
    el.innerHTML = `<div class="rum-stage" id="rum-stage"><div class="rum-kamera" id="rum-kamera"><div class="rum-world" id="rum-world">
${plane(-600, `${bg()}${rain()}${rightWall()}${svg('<g id="rum-hyllor"></g>')}${neon()}${lop()}${boardHtml()}${frameHtml()}`, 1.035)}
${plane(-470, `${props()}${tv()}`, 1.02)}
${plane(-330, `${sill()}${haze()}`)}
${plane(-60, table(), 1.05)}
${plane(0, paper())}
</div></div>
<div class="rum-layer rum-warm"></div><div class="rum-layer rum-vign"></div><div class="rum-layer rum-grain"></div>
</div>
${closeHtml()}
<div class="rum-hdr"><a class="rum-brand" href="#">Matchfixarna</a>
  <nav aria-label="Sektioner"><a href="#kupong" data-to="kupong">Kupong</a><a href="#olympen" data-to="olympen">Olympen</a><a href="#matcher" data-to="matcher">Matcher</a><a href="tabeller.html" data-to="tabeller">Tabeller</a><a href="statistik.html" data-to="statistik">Statistik</a></nav></div>
<div class="rum-ft"><span class="keys"><b>K</b> kupongen · <b>T</b> tv:n</span><a href="#hem">Vanlig sida</a></div>`;
    document.querySelector('main').prepend(el);
    R.el = el;
    R.built = true;
    wire();
  }

  // ---------- datan ----------

  // Kortare lagnamn på papperet och krittavlan.
  const SHORT = { 'Manchester City': 'Man City', 'Manchester United': 'Man Utd', 'Tottenham Hotspur': 'Tottenham', 'Brighton & Hove Albion': 'Brighton',
    'Wolverhampton Wanderers': 'Wolves', 'West Bromwich Albion': 'West Brom', 'Queens Park Rangers': 'QPR', 'Nottingham Forest': "Nott'm Forest",
    'AFC Bournemouth': 'Bournemouth', 'Preston North End': 'Preston', 'Sheffield Wednesday': 'Sheff Wed', 'Sheffield United': 'Sheff Utd' };
  const short = (name) => SHORT[name] || String(name || '').replace(/\s+(United|City|Town|Rovers|Athletic|County|Wanderers|Albion|Argyle|Hotspur)$/, '');
  // På fällbladstavlan: högst elva tecken (NAME).
  const BOARD = { 'Nottingham Forest': 'Nottingham', 'Middlesbrough': 'Middlesbro', 'Crystal Palace': 'Palace', 'Huddersfield Town': 'Huddersfld',
    'Peterborough United': "P'borough", 'Leyton Orient': 'Orient', 'Milton Keynes Dons': 'MK Dons', 'AFC Wimbledon': 'Wimbledon',
    'Bristol City': 'Bristol C', 'Bristol Rovers': 'Bristol R', 'Accrington Stanley': 'Accrington' };
  const onBoard = (name) => (BOARD[name] || short(name)).toUpperCase();

  const fOdds = (x) => (x == null ? ' - ' : x >= 10 ? String(Math.round(x)).padStart(3, ' ') : x.toFixed(1).replace('.', ','));
  const fWd = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short' });
  const fHm = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
  const wd = (d) => fWd.format(d).replace('.', '').slice(0, 3);
  const hm = (d) => fHm.format(d).replace(':', '.');

  // Omgången som gänget tippar (TP.round ur GET …/samtal), annars
  // omgångens kupong (kupong.js): matcherna efter avspark.
  function round() {
    const r = typeof TP !== 'undefined' ? TP.round : null;
    if (r && r.matcher && r.matcher.length) {
      return { id: r.id, ids: r.matcher.map((x) => String(x.id)), gang: r.gang || [], name: r.namn || (window.Samtal && Samtal.name ? Samtal.name() : null) };
    }
    const c = typeof currentCoupon === 'function' ? currentCoupon() : null;
    if (c) return { ids: c.matches.map((x) => String(x.id)), gang: [], name: c.name || null, coupon: c };
    // mellan omgångarna: de närmaste matcherna i Premier League och Championship
    const t = Date.now();
    const next = ((state.all && state.all.matches) || []).filter((m) => (m.comp === 'pl' || m.comp === 'ch') && !m.completed && Date.parse(m.kickoff) > t)
      .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff)).slice(0, 13);
    return next.length ? { ids: next.map((m) => String(m.id)), gang: [], name: null, next: true } : null;
  }

  function roundRows(rd, t = Date.now()) {
    const signs = {};
    const c = rd.coupon || (typeof currentCoupon === 'function' ? currentCoupon() : null);
    if (c) for (const x of c.matches) signs[String(x.id)] = x.sign;
    return rd.ids.map((id) => {
      const g = gradeRow({ id, sign: signs[id] || '', label: '' }, t);
      return { id, m: g.m, g, sign: signs[id] || '' };
    }).filter((x) => x.m).sort((a, b) => Date.parse(a.m.kickoff) - Date.parse(b.m.kickoff) || a.m.home.localeCompare(b.m.home));
  }

  // Fällbladstavlans text: rubriken och en rad per match, fälten i FIELDS
  // efter varandra; lit = de tända fälten [rad, fält]. Före avspark oddsen,
  // sedan ställningen i mitten och efter slutsignalen det rätta tecknet tänt
  // under sin siffra.
  function boardLines(rows, t = Date.now(), next = false) {
    const pad = (s, n) => String(s).slice(0, n).padEnd(n, ' ');
    const mid = (s, n) => pad(' '.repeat(Math.max(0, Math.floor((n - String(s).length) / 2))) + s, n);
    if (!rows.length) return { head: 'INGA MATCHER', rows: [], lit: [] };
    const first = Math.min(...rows.map((x) => Date.parse(x.m.kickoff)));
    const started = first <= t;
    const head = started ? 'RESULTAT' : `${next ? 'NÄSTA' : 'SPELSTOPP'} ${wd(new Date(first)).toUpperCase()} ${hm(new Date(first))}`;
    const lit = [];
    const out = rows.map((x, i) => {
      const g = x.g;
      const o = x.m.odds || [];
      const shown = g.score && (g.state === 'final' || g.state === 'live');
      const score = g.state === 'hidden' ? '?' : shown ? `${g.score.home}-${g.score.away}` : '-';
      let signs = [0, 1, 2].map((k) => mid(fOdds(o[k]), 3)).join('');
      if (g.state === 'off') signs = mid('STRUKEN', 9);
      else if (g.state === 'hidden') signs = ' '.repeat(9);
      else if (g.state === 'final') {
        signs = [0, 1, 2].map((k) => mid(k === g.res ? '1X2'[k] : '', 3)).join('');
        if (g.res != null) lit.push([i, 3 + g.res]);
      }
      return pad(onBoard(x.m.home), NAME) + mid(score, 3) + pad(onBoard(x.m.away), NAME) + signs;
    });
    return { head, rows: out, lit };
  }

  // En sida av tavlan: per rader i taget, och sidnumret i rubrikens högra fält.
  function boardText(lines, pageIx, per) {
    const pages = Math.max(1, Math.ceil(lines.rows.length / per));
    const p = pageIx % pages;
    const text = [lines.head.slice(0, HEAD[0]).padEnd(HEAD[0], ' ') + (pages > 1 ? `${p + 1}/${pages}` : '').padStart(HEAD[1], ' ')];
    for (let i = 0; i < per; i++) text.push((lines.rows[p * per + i] || '').padEnd(FIELDS.reduce((a, b) => a + b, 0), ' '));
    const lit = (ri, fi) => ri > 0 && lines.lit.some(([li, f]) => li === p * per + ri - 1 && f === fi);
    return { text, lit };
  }

  // Bladen rad för rad, med fältet de sitter i (de målade siffrorna räknas inte).
  const cellsOf = (el) => [...el.querySelectorAll('.rum-fb-r:not(.rum-fb-lb)')]
    .map((r) => [...r.querySelectorAll('.fl')].flatMap((f, fi) => [...f.children].map((cell) => ({ cell, fi }))));

  function setBoard(el, lines, pageIx, animate) {
    if (!el || !lines) return;
    const rows = cellsOf(el);
    const { text, lit } = boardText(lines, pageIx, rows.length - 1);
    rows.forEach((r, ri) => r.forEach(({ cell, fi }, ci) => flap(cell, text[ri][ci] || ' ', lit(ri, fi), animate ? 40 + ci * 18 + ri * 30 : 0)));
  }

  // Samma klapper räknat ur klockan, för stillbilderna: u sekunder efter
  // bläddringen visar varje blad ännu ett mellantecken.
  function boardAt(el, lines, pageIx, u) {
    if (!el || !lines) return;
    const rows = cellsOf(el);
    const per = rows.length - 1;
    const { text, lit } = boardText(lines, pageIx, per);
    const prev = pageIx > 0 ? boardText(lines, pageIx - 1, per).text : null;
    const h = (a) => { const x = Math.sin(a * 91.17 + 7.3) * 43758.55; return x - Math.floor(x); };
    rows.forEach((r, ri) => r.forEach(({ cell, fi }, ci) => {
      const ch = text[ri][ci] || ' ';
      const was = prev ? prev[ri][ci] || ' ' : ' ';
      const changed = was !== ch;
      const d = (40 + ci * 18 + ri * 30) / 1000;
      const steps = 3 + Math.floor(h(ri * 31 + ci + pageIx * 7) * 6);
      const n = Math.floor((u - d) / 0.055);
      const show = changed && n >= 0 && n < steps ? FLAPS[Math.floor(h(ri * 131 + ci * 17 + n) * FLAPS.length)] : !changed || n >= steps ? ch : was;
      cell.textContent = show;
      cell.dataset.c = show;
      cell.classList.toggle('lit', lit(ri, fi) && show === ch);
      cell.classList.toggle('f', changed && n >= 0 && n < steps && (u - d) % 0.055 < 0.03);
    }));
  }

  // Ett fällblad: bläddrar fram genom några tecken innan det stannar.
  const FLAPS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789-,./';
  function flap(cell, ch, lit, delay) {
    cell.classList.toggle('lit', lit);
    if (cell.dataset.c === ch) return;
    cell.dataset.c = ch;
    clearInterval(cell._t);
    clearTimeout(cell._d);
    if (!delay || calm()) {
      cell.textContent = ch;
      return;
    }
    const steps = 3 + ((Math.random() * 6) | 0);
    let n = 0;
    cell._d = setTimeout(() => {
      cell._t = setInterval(() => {
        n++;
        cell.classList.remove('f');
        void cell.offsetWidth;
        cell.classList.add('f');
        cell.textContent = n >= steps ? ch : FLAPS[(Math.random() * FLAPS.length) | 0];
        if (n >= steps) clearInterval(cell._t);
      }, 55);
    }, delay);
  }

  // Närbildens rader: en länk per match, byggs om när omgången byts.
  function closeRows(rows) {
    const box = document.getElementById('rum-fbn-rader');
    const ids = rows.map((x) => x.id).join();
    if (!box || box.dataset.ids === ids) return;
    box.dataset.ids = ids;
    box.innerHTML = rows.length ? rows.map((x) => fbRow(FIELDS, '', `#match/${x.id}`)).join('') : fbRow(FIELDS);
  }

  // Text-tv: sida 331 med omgångens matcher, två undersidor.
  function ttx(rows, t, sub) {
    const pad = (s, n) => String(s).slice(0, n);
    const clock = hm(new Date(t)).replace('.', ':');
    const list = rows.slice(sub * 6, sub * 6 + 6);
    const subs = Math.max(1, Math.ceil(rows.length / 6));
    return `<span class="r"><span>331 Matchfix-Text</span><span>${clock}</span></span>` +
      `<span class="band"><b>MATCHER</b><i>${subs > 1 ? `${sub + 1}/${subs}` : ''}</i></span>` +
      list.map((x) => {
        const g = x.g;
        const right = g.score && (g.state === 'final' || g.state === 'live') ? `<em>${g.score.home}-${g.score.away}</em>` : '';
        return `<span class="m"><span class="t">${wd(new Date(x.m.kickoff))} ${hm(new Date(x.m.kickoff))}</span><span>${esc(pad(`${short(x.m.home)}-${short(x.m.away)}`, 24))}</span>${right}</span>`;
      }).join('') +
      '<span class="fast"><a class="red" href="#kupong" data-to="kupong">Kupong</a><a class="grn" href="#olympen" data-to="olympen">Olympen</a>' +
      '<a class="yel" href="tabeller.html" data-to="tabeller">Tabell</a><a class="cya" href="statistik.html" data-to="statistik">Statistik</a></span>';
  }

  // Kryssets två streck med blyerts i en ruta (40 × 19): lite sneda och
  // böjda, men samma för samma match och tecken – på pulten och i handen.
  const seed = (s) => [...String(s)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7);
  function strokes(key) {
    const R0 = rng(seed(key));
    const j = (n) => (R0() - 0.5) * 2 * n;
    return [[7, 3, 33, 16], [32, 3, 8, 16.5]].map(([x1, y1, x2, y2]) => {
      const a = [x1 + j(1.6), y1 + j(1)];
      const b = [x2 + j(1.6), y2 + j(1)];
      const c = [(a[0] + b[0]) / 2 + j(1.8), (a[1] + b[1]) / 2 + j(1.4)];
      return { a, b, d: `M${r1(a[0])} ${r1(a[1])}Q${r1(c[0])} ${r1(c[1])} ${r1(b[0])} ${r1(b[1])}` };
    });
  }
  const crossSvg = (key) => `<svg class="kryss" viewBox="0 0 40 19" preserveAspectRatio="none" aria-hidden="true">${strokes(key).map((s) => `<path d="${s.d}" pathLength="1"/>`).join('')}</svg>`;

  // Pennan: spetsen i (x, y) på kupongen, vriden a grader och lyft l (0 =
  // mot papperet, 1 = i luften). Skuggan faller nedåt på papperet hur pennan
  // än är vriden.
  function penAt({ x, y, a, l = 0 }) {
    const v = (-a * Math.PI) / 180;
    const dx = 1.5 + 5 * l;
    const dy = 4 + 9 * l;
    return {
      transform: `translate(${r1(x)}px, ${r1(y)}px) rotate(${r1(a)}deg) scale(${(1 + 0.06 * l).toFixed(3)})`,
      filter: `drop-shadow(${r1(dx * Math.cos(v) - dy * Math.sin(v))}px ${r1(dx * Math.sin(v) + dy * Math.cos(v))}px ${r1(2 + 3 * l)}px rgba(0, 0, 0, ${(0.38 - 0.12 * l).toFixed(2)}))`,
    };
  }
  const PEN_PULT = { x: 276.4, y: 340.6, a: -11 };
  const PEN_VILA = { x: 506, y: 384, a: -7 };
  const PEN_SKRIV = -38;
  const penStyle = (p) => { const s = penAt(p); return `transform: ${s.transform}; filter: ${s.filter}`; };

  // Kupongen på pulten: omgångens matcher i kupongens ordning, med kryss där
  // gängets kupong har tecken – innan den finns dina egna (p =
  // Samtal.pult.state()), med ditt namn kryssat under Tippare och stämpeln
  // när du har lämnat in. hand: kupongen i handen, där rutorna är knappar.
  function couponHtml(rd, rows, p = null, hand = false) {
    const nr = rd && !rd.next && typeof couponNumber === 'function' && rd.ids.length ? couponNumber(rd.ids) : null;
    const first = rows.length ? Math.min(...rows.map((x) => Date.parse(x.m.kickoff))) : null;
    const order = rd ? rd.ids.map((id) => rows.find((x) => x.id === id)).filter(Boolean) : rows;
    const gang = order.some((x) => x.sign);
    const own = Boolean(p) && !gang;
    const mine = own ? p.tecken : {};
    const box = (key, label, on, attrs, cls = '') => (hand && attrs != null
      ? `<button type="button" class="box${on ? ' x' : ''}${cls}"${attrs} aria-pressed="${on}">`
      : `<span class="box${on ? ' x' : ''}${cls}">`) + `<i>${label}</i>${on ? crossSvg(key) : ''}${hand && attrs != null ? '</button>' : '</span>'}`;
    const list = order.map((x, i) => {
      const sign = own ? mine[x.id] || '' : x.sign;
      return `<div class="row${sign ? '' : ' tom'}" data-id="${esc(x.id)}"><span class="nr">${i + 1}</span><span>${esc(short(x.m.home))} – ${esc(short(x.m.away))}</span>` +
        ['1', 'X', '2'].map((s) => box(`${x.id}${s}`, s, sign.includes(s), ` data-s="${s}" aria-label="${esc(`${x.m.home} – ${x.m.away}: ${s}`)}"`)).join('') + '</div>';
    }).join('');
    const who = rd && rd.gang && rd.gang.length ? rd.gang.filter((g) => g.inne).length : null;
    const vem = own ? '<span class="vem"><span>Tippare</span><span>' + p.s.gang.map((g) => box(`vem${g.id}`, esc(g.id), g.id === p.vem,
      p.val.includes(g.id) ? ` data-vem="${esc(g.id)}" aria-label="${esc(g.namn || g.id)}"` : null, g.inne && g.id !== p.vem ? ' inne' : '')).join('') + '</span></span>' : '';
    return '<span class="marks"></span>' +
      `<span class="band"><small>MATCHFIXARNA · TIPSKUPONG</small><b>${nr ? `Kupong ${nr}` : 'Kupong'}</b></span>` +
      `<span class="sub"><i>${esc((rd && rd.name) || '')}</i><span>${rows.length} matcher</span></span>` +
      `<span class="grid"><span><span class="hd"><span></span><span>MATCH</span><span>1</span><span>X</span><span>2</span></span>${list}</span>` +
      `<span class="side"><span><span>Spelstopp</span><b>${first ? `${wd(new Date(first))} ${hm(new Date(first))}` : '–'}</b></span>` +
      `<span><span>Insats</span><b>äran</b></span>${who != null ? `<span><span>Inlämnade</span><b>${who} av ${rd.gang.length}</b></span>` : ''}` +
      (own ? `<span><span>Tippat</span><b data-tippat>${order.filter((x) => mine[x.id]).length}/${order.length}</b></span>${vem}` : '') + '</span></span>' +
      '<span class="code"></span><span class="fine"><span>Kupongen gäller först när den är inlämnad.</span><span>Ej giltig som kvitto</span></span>' +
      (own && p.inne ? '<span class="stampel">Inlämnad</span>' : '') + `<span class="pencil" style="${penStyle(PEN_PULT)}"><i></i></span>`;
  }

  // ---------- högen ----------
  //
  // De som har lämnat in har lagt sin kupong med baksidan upp till vänster
  // om kupongen på pulten, i den ordning de lämnade in (den senaste överst):
  // porträttet under ett gem, namnet i personens bläck (samma som på
  // papperet under Kupong) och stämpeln – men inga tecken. Din egen tas i
  // handen därifrån (p.hand), de andras leder till Kupong. Kupongerna har
  // samma mått som kupongen på pulten, förminskade, så att den som tas i
  // handen landar exakt i högen.

  const T = (dx, dy, z, rx, rz, s, ry = 0) => `translate(${r1(dx)}px, ${r1(dy)}px) perspective(1300px) translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s.toFixed(4)})`;
  const glow = (a, drop) => `0 0 0 3px rgba(240, 214, 153, ${a}), 0 0 80px rgba(240, 214, 153, ${(0.45 * a).toFixed(2)}), ${drop}`;
  // mitten (x, y) och vridningen för den första, andra och tredje i högen
  const HOG = { s: 0.3, at: [[338, 790, -5], [348, 836, 4], [336, 882, -2]], skugga: '0 22px 30px rgba(0, 0, 0, 0.55)' };
  const INK = ['#2146a6', '#16784b', '#6d3aa8', '#8a6a0c', '#a0306a'];
  function slot(i) {
    const [x, y, a] = HOG.at[i % HOG.at.length];
    const n = Math.floor(i / HOG.at.length);
    return { dx: x + 14 * n - 760, dy: y + 10 * n - 853, a };
  }
  const restAt = (sl) => T(sl.dx, sl.dy, 0, 44, sl.a, HOG.s);

  function photoOf(id) {
    const g = ((KP.data && KP.data.samtal && KP.data.samtal.gang) || []).find((x) => x.id === id);
    return g && g.bild ? g.bild : null;
  }

  // Baksidan: bandet och markeringarna lyser svagt igenom, spegelvända.
  function backHtml(id, ix) {
    const src = photoOf(id);
    return '<span class="genom"></span>' +
      (src ? `<span class="foto"><img src="${esc(src)}" alt="" draggable="false"></span>` +
        '<svg class="gem" viewBox="0 0 30 92" aria-hidden="true"><path d="M8 84V14a8 8 0 0 1 16 0v62a5 5 0 0 1-10 0V24"/></svg>' : '') +
      `<b class="namn" style="color: ${INK[ix] || INK[0]}">${esc(id)}</b><span class="stampel">Inlämnad</span>` +
      '<span class="regler"><small>Spelregler</small></span>';
  }

  // p = Samtal.pult.state() (färskast efter en inlämning), annars omgången.
  // Den som är i handen just nu står inte i högen.
  function pile(rd, p) {
    const el = document.getElementById('rum-hogen');
    if (!el) return;
    const gang = (p ? p.s.gang : rd && rd.gang) || [];
    const inne = gang.filter((g) => g.inne).sort((a, b) => String(a.inne).localeCompare(String(b.inne)));
    const html = inne.map((g, i) => {
      const ta = Boolean(p && p.vem === g.id && p.hand);
      const label = ta ? `Din kupong (${g.id}), inlämnad – ${p.andra ? 'ändra' : 'visa'}` : `${g.id}:s kupong, inlämnad`;
      return `<a class="rum-flat rum-bak rum-sak" href="#kupong" data-nav="kupong" data-vem="${esc(g.id)}" data-i="${i}"${ta ? ' data-ta' : ''}` +
        ` style="transform: ${restAt(slot(i))}" aria-label="${esc(label)}">${backHtml(g.id, gang.findIndex((x) => x.id === g.id))}</a>`;
    }).join('');
    if (el.dataset.html !== html) {
      el.innerHTML = html;
      el.dataset.html = html;
    }
    for (const a of el.children) a.style.visibility = R.kup && R.kup.vem === a.dataset.vem ? 'hidden' : '';
  }

  function receiptHtml(rd, nr) {
    const gang = (rd && rd.gang) || [];
    const fDt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short', hour: '2-digit', minute: '2-digit' });
    const lines = gang.map((g) => `<span class="r"><span>${esc(g.id)}</span><span>${g.inne ? esc(fDt.format(new Date(g.inne)).replace('.', '').replace(':', '.')) : '–'}</span></span>`).join('');
    return '<span class="c">MATCHFIXARNAS<br>TOBAK &amp; SPEL</span><hr>' +
      `<span class="r"><span>${nr ? `KUPONG ${nr}` : 'KUPONG'}</span><span>INNE</span></span>${lines}<hr>` +
      '<span class="r"><span>Insats</span><span>äran</span></span><span class="bar"></span><span class="c">Spara kvittot</span>';
  }

  function chalkHtml(T) {
    const rows = ((T && T.teams) || []).slice().sort((a, b) => a.rank - b.rank).slice(0, 9);
    if (!rows.length) return '<b class="h">Dagens tabell</b><span class="tom">Kommer</span>';
    return `<b class="h">${esc((T && T.name) || 'Tabellen')}</b>` +
      rows.map((x) => `<span class="rad"><span>${x.rank}. ${esc(short(x.name))}</span><i></i><span>${x.pts}</span></span>`).join('');
  }

  function corkHtml(list) {
    const pin = (c) => `<i class="nal" style="background:${c}"></i>`;
    if (!list.length) {
      return `<span class="rest" style="left:22%; top:18%">${pin('#d42a1e')}</span><span class="rest r2" style="left:58%; top:52%">${pin('#e6c43a')}</span>` +
        `<span class="lapp" style="left:12%; top:46%; transform: rotate(-4deg)">${pin('#3d7bd9')}<span class="kv">Dartkväll<br>tor 19.00</span></span>`;
    }
    return list.slice(0, 4).map((c, i) => {
      const pos = [[6, 6, -5], [46, 12, 4], [10, 52, 3], [52, 56, -3]][i];
      const ticks = (c.rows || []).slice(0, 13).map((r) => `<i class="${r.hit ? 'ok' : 'no'}"></i>`).join('');
      return `<span class="kup${i === 1 ? ' kaffe' : ''}" style="left:${pos[0]}%; top:${pos[1]}%; transform: rotate(${pos[2]}deg)">${pin(['#d42a1e', '#3d7bd9', '#e6c43a', '#3db37c'][i])}` +
        `<span class="kt">${esc(c.name || 'Kupong')}</span><span class="tk">${ticks}</span><span class="rr">${c.ok} rätt</span></span>`;
    }).join('');
  }

  function seasonLabels(season) {
    const y = Number(String(season || '').slice(0, 4)) || new Date().getFullYear();
    const out = [];
    for (let s = y - 11; s <= y; s++) out.push(`${String(s).slice(2)}/${String(s + 1).slice(2)}`);
    return out;
  }

  // Allt som hämtas: omgången, tabellen, säsongens omgångar och kupongerna.
  async function load() {
    await Promise.all([whenMatches(), loadCoupons()]);
    await Promise.all([
      typeof tpLoad === 'function' ? tpLoad() : null,
      typeof tpLoadSeason === 'function' && !TP.season ? tpLoadSeason() : null,
      R.table ? null : getJSON('data/teams/pl.json').then((d) => { R.table = d; }).catch(() => { R.table = null; }),
      window.Historik ? Historik.coupons().then((l) => { R.old = l; }) : null,
    ]);
    fill();
  }

  function fill() {
    if (!R.el) return;
    const t = Date.now();
    const rd = round();
    const rows = rd ? roundRows(rd, t) : [];
    R.rows = rows;
    R.lines = boardLines(rows, t, Boolean(rd && rd.next));
    setBoard(document.getElementById('rum-fb'), R.lines, R.page, !calm());
    closeRows(rows);
    if (R.nara) setBoard(document.getElementById('rum-fbn'), R.lines, 0, !calm());
    const nr = rd && !rd.next && rd.ids.length && typeof couponNumber === 'function' ? couponNumber(rd.ids) : null;
    const set = (id, html) => { const e = document.getElementById(id); if (e && e.innerHTML !== html) e.innerHTML = html; };
    set('rum-ttx', ttx(rows, t, R.sub || 0));
    const p = pult(rd);
    // har du lämnat in ligger din kupong i högen, och på pulten en ny
    set('rum-kupong', couponHtml(rd, rows, p && !p.inne ? p : null));
    pile(rd, p);
    set('rum-kvitto', receiptHtml(rd, nr));
    // gänget på fönsterbänken: den som inte har lämnat in sitter med kupongen
    R.vem = vemInne(rd, rows, t, p);
    if (R.fig && R.fig.inne) R.fig.inne(R.vem, now());
    const started = rows.length && Math.min(...rows.map((x) => Date.parse(x.m.kickoff))) <= t;
    const tag = document.getElementById('rum-tag');
    if (tag) {
      tag.textContent = p ? p.go : started ? 'Följ kupongen' : 'Fyll i kupongen';
      tag.hidden = !tag.textContent;
    }
    set('rum-krita', chalkHtml(R.table));
    const seen = ((TP.season && TP.season.rounds) || []).filter((r) => typeof tpRoundHidden !== 'function' || !tpRoundHidden(r));
    set('rum-kork', corkHtml((R.old || []).filter((c) => c.n && !(window.Historik && Historik.hidden(c)))));
    const cups = seen.slice().sort((a, b) => String(a.from).localeCompare(String(b.from)))
      .flatMap((r) => (r.people || []).filter((p) => p.award === 'best').map((p) => GANG[p.id] || '#d8b06a'));
    const hy = document.getElementById('rum-hyllor');
    const hs = shelves(cups, seasonLabels(state.meta && state.meta.season));
    if (hy && R.hy !== hs) { hy.innerHTML = hs; R.hy = hs; }
    // oraklet som regerar, med hela efternamnet på skylten; scenen ritas om
    // bara när oraklet byts, så att strålarna inte börjar om
    const { best } = Kronan.holders(seen);
    const scene = Kronan.scene('orakel', best, 'ram');
    const bild = document.getElementById('rum-ram-bild');
    if (bild && R.ram !== scene) { bild.innerHTML = scene; R.ram = scene; }
    set('rum-ram-namn', Kronan.names(best));
    R.el.querySelector('.rum-ram').classList.toggle('flera', best.length > 1);
  }

  // Vem som har lämnat in, för figurerna (rum-3d.js): bara en omgång som inte
  // har börjat väntar på någon, och din egen inlämning på pulten räknas
  // direkt. ?rum-vantar=DL,DT låter dem vänta ändå.
  function vemInne(rd, rows, t, p) {
    const open = rd && !rd.next && rows.length && Math.min(...rows.map((x) => Date.parse(x.m.kickoff))) > t;
    const vem = {};
    for (const g of (rd && rd.gang) || []) vem[g.id.toLowerCase()] = !open || Boolean(g.inne) || Boolean(p && p.inne && p.vem === g.id);
    for (const id of (R.q.get('rum-vantar') || '').split(',')) if (id.trim()) vem[id.trim().toLowerCase()] = false;
    return vem;
  }

  // ---------- rörelsen ----------

  function setCam(mx, my) {
    const w = document.getElementById('rum-world');
    if (!w) return;
    w.style.setProperty('--ry', `${(mx * 4.5).toFixed(3)}deg`);
    w.style.setProperty('--rx', `${(-my * 2.6).toFixed(3)}deg`);
  }

  // Neonen glappar ibland: tider ur klockan, så att stillbilderna blir samma.
  function neonOn(t) {
    const p = t % 23;
    if (p > 6.2 && p < 7.1) return Math.sin(p * 61) > -0.2;
    if (p > 15.0 && p < 15.35) return Math.sin(p * 97) > 0.3;
    return true;
  }

  function dust(t) {
    const c = document.getElementById('rum-damm');
    if (!c) return;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const R0 = rng(9);
    for (let i = 0; i < 46; i++) {
      const x0 = R0() * 800;
      const y0 = R0() * 500;
      const sp = 3 + R0() * 6;
      const x = (x0 + Math.sin(t * 0.13 + i) * 14 + t * sp * 0.6) % 800;
      const y = (y0 + Math.sin(t * 0.21 + i * 2.1) * 10 + t * sp * 0.25) % 500;
      const light = Math.max(0, 1 - Math.hypot(x - 330, (y - 30) * 1.5) / 420);
      g.globalAlpha = (0.15 + R0() * 0.35) * light;
      g.fillStyle = '#fff5e0';
      g.beginPath();
      g.arc(x, y, 0.6 + R0() * 1.1, 0, 7);
      g.fill();
    }
  }

  function frame() {
    const t = now();
    if (!still()) {
      const f = R.kup ? 0.12 : 0.06;
      R.mx += (R.tx - R.mx) * f;
      R.my += (R.ty - R.my) * f;
    }
    setCam(R.mx, R.my);
    const on = neonOn(t);
    if (on !== R.neon) {
      R.neon = on;
      R.el.classList.toggle('neon-av', !on);
    }
    // tavlan bläddrar var nionde sekund, text-tv:n var tolfte
    const page = Math.floor(t / 9);
    if (still() && R.lines) {
      boardAt(document.getElementById('rum-fb'), R.lines, page, t - page * 9);
      if (R.nara) boardAt(document.getElementById('rum-fbn'), R.lines, 0, t);
    } else if (page !== R.pageAt && R.lines) {
      R.pageAt = page;
      R.page = page;
      setBoard(document.getElementById('rum-fb'), R.lines, page, !calm());
    }
    const sub = Math.floor(t / 12) % 2;
    if (sub !== R.sub && R.rows) {
      R.sub = sub;
      const e = document.getElementById('rum-ttx');
      if (e) e.innerHTML = ttx(R.rows, Date.now(), R.rows.length > 6 ? sub : 0);
    }
    if (!calm() || still()) dust(t);
    if (R.fig) R.fig.draw(t, R.mx, R.my);
  }

  function loop() {
    cancelAnimationFrame(R.raf);
    const tick = (ms) => {
      if (!R.on) return;
      // 30 bilder i sekunden räcker
      if (ms - R.last > 30) {
        R.last = ms;
        frame();
      }
      R.raf = requestAnimationFrame(tick);
    };
    R.raf = requestAnimationFrame(tick);
  }

  // CSS-animationerna (regnet, röken, hörnet) står still på samma tid som klockan.
  function freezeCss(t) {
    for (const a of R.el.getAnimations({ subtree: true })) {
      a.pause();
      a.currentTime = t * 1000;
    }
  }

  // ---------- figurerna ----------

  async function three() {
    if (R.fig || R.loading) return;
    R.loading = true;
    try {
      const mod = await import('./rum-3d.js');
      R.fig = await mod.figurer(document.getElementById('rum-3d'), { calm: calm() });
      if (R.vem) R.fig.inne(R.vem, now());
      frame();
    } catch (err) {
      // utan WebGL eller utan nätet står rummet kvar utan gänget
      console.warn('Rummet: figurerna kunde inte ritas', err);
    }
  }

  // ---------- klicken ----------

  function hot(nav) {
    for (const a of R.el.querySelectorAll('.rum-hdr nav a')) a.classList.toggle('hot', nav === a.dataset.to);
  }

  // Föremålets mitt i scenens koordinater.
  function centerOf(a) {
    const r = a.getBoundingClientRect();
    const st = R.el.querySelector('.rum-stage').getBoundingClientRect();
    return [((r.left + r.width / 2 - st.left) / st.width) * W, ((r.top + r.height / 2 - st.top) / st.height) * H];
  }

  // Kameran går fram: punkten p hamnar på to med förstoringen z.
  function aim(p, z, to, cls) {
    const w = document.getElementById('rum-kamera');
    w.classList.remove('glid', 'dyk');
    if (cls) w.classList.add(cls);
    w.style.setProperty('--z', z);
    w.style.setProperty('--dx', `${r1(to[0] - 800 - z * (p[0] - 800))}px`);
    w.style.setProperty('--dy', `${r1(to[1] - 500 - z * (p[1] - 500))}px`);
  }

  // Ett föremål: kameran går fram mot det en kort stund innan sidan byts.
  // Kupongen tas i handen om den går att fylla i, och din i högen om den
  // går att ändra eller visa.
  function go(a, e) {
    const href = a.getAttribute('href');
    if (!href) return;
    if (a.dataset.nav === 'tv') {
      e.preventDefault();
      zoomTv(!R.zoom);
      return;
    }
    if (a.id === 'rum-fb') {
      e.preventDefault();
      closeUp(true);
      return;
    }
    if ((a.id === 'rum-kupong' || a.dataset.ta != null) && openCoupon(a.id === 'rum-kupong' ? null : a)) {
      e.preventDefault();
      return;
    }
    if (calm()) return;
    e.preventDefault();
    const p = centerOf(a);
    aim(p, 1.35, [p[0] + (800 - p[0]) * 0.4, p[1] + (500 - p[1]) * 0.4], 'dyk');
    R.el.classList.add('dyker');
    setTimeout(() => {
      if (/^#/.test(href)) location.hash = href.slice(1);
      else location.href = href;
      // tillbaka i rummet (matchrutan ligger ovanpå det, och bakåt-knappen)
      setTimeout(() => {
        R.el.classList.remove('dyker');
        aim([800, 500], 1, [800, 500]);
      }, 60);
    }, 420);
  }

  // Närbilden av fällbladstavlan: kameran går fram mot den, närbilden växer
  // fram ur tavlan på väggen och alla matcher klaprar fram på en gång. Esc
  // eller ett klick utanför tar en tillbaka.
  function closeUp(on) {
    if (on && R.zoom) zoomTv(false);
    R.nara = on;
    R.el.classList.toggle('fb-nara', on);
    const el = document.getElementById('rum-fbn');
    const fb = document.getElementById('rum-fb');
    if (on && el) {
      fit();
      if (!calm()) {
        const a = fb.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        const k = parseFloat(el.style.getPropertyValue('--k')) || 1;
        el.animate([
          { transform: `translate(${r1(a.left + a.width / 2 - b.left - b.width / 2)}px, ${r1(a.top + a.height / 2 - b.top - b.height / 2)}px) scale(${(k * a.width / b.width).toFixed(3)})` },
          { transform: `scale(${k})` },
        ], { duration: 520, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' });
      }
      for (const b of el.querySelectorAll('.rum-fb-r b')) {
        clearInterval(b._t);
        clearTimeout(b._d);
        b.textContent = ' ';
        b.dataset.c = ' ';
        b.classList.remove('lit');
      }
      setBoard(el, R.lines, 0, !calm());
      if (!still()) el.focus({ preventScroll: true });
    } else if (el && el.contains(document.activeElement)) fb.focus({ preventScroll: true });
    if (on) aim(centerOf(fb), 1.6, [800, 440], calm() ? null : 'glid');
    else aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
  }

  // T: tv:n nära, så att text-tv:n går att läsa och färgknapparna att trycka på.
  function zoomTv(on) {
    if (on && R.nara) closeUp(false);
    R.zoom = on;
    R.el.classList.toggle('tv-nara', on);
    const tvEl = document.getElementById('rum-tv');
    if (on && tvEl) aim(centerOf(tvEl), 2.5, [800, 470], calm() ? null : 'glid');
    else aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
  }

  // ---------- kupongen i handen ----------
  //
  // Den som inte har lämnat in fyller i kupongen på pulten här: den lyfter,
  // vänds upp mot en och förstoras till mitten, rummet mörknar bakom och
  // pennan följer med. Rutorna är knappar, och pennan drar krysset. Under
  // kupongen står Lägg tillbaka och guldordet Lämna in. Samma utkast och
  // samma inlämning som papperet under Kupong (Samtal.pult i samtal.js).
  // Esc, K, Lägg tillbaka eller ett klick utanför lägger tillbaka den samma
  // väg baklänges. Inlämnad vänds kupongen och läggs i högen (se ovan), och
  // på pulten ligger en ny. Därifrån lyfts den, vänds på vägen upp och står
  // i handen med ens kryss och stämpeln: går tipsen att ändra (Samtal.pult:
  // andra) heter guldordet Lämna in ändringen, annars leder Se de andras
  // tips till Kupong. Lägg tillbaka och inlämningen lägger den i högen igen.
  // När alla har lämnat in, eller matcherna har börjat, leder kupongen och
  // högen till Kupong.

  // Läget för kupongen på pulten, om det är omgången som rummet visar.
  function pult(rd) {
    const p = window.Samtal && Samtal.pult ? Samtal.pult.state() : null;
    return p && (!rd || rd.id === p.s.id) ? p : null;
  }

  // Var kupongen hamnar i handen: mitt i fönstret, så stor som får plats
  // mellan menyn och orden under den. → förskjutningen från pulten och
  // förstoringen i scenens mått, och rutan i fönstret.
  function held() {
    const k = R.k || 1;
    const top = 84;
    const foot = 78;
    const z = Math.min(2.2, (innerHeight - top - foot) / (470 * k), (innerWidth * 0.8) / (660 * k));
    const cx = innerWidth / 2;
    const cy = top + (innerHeight - top - foot) / 2;
    return {
      dx: (cx - (R.ox || 0)) / k - 760, dy: (cy - (R.oy || 0)) / k - 853, z,
      box: { left: cx - 330 * z * k, top: cy - 235 * z * k, width: 660 * z * k, height: 470 * z * k },
    };
  }

  // Vägen från pulten till handen: kupongen lossnar och lyfter, vänds upp
  // mot betraktaren, svänger en aning förbi och stannar.
  function handFrames(h) {
    return [
      { offset: 0, transform: T(0, 0, 0, 44, -2, 1), boxShadow: glow(1, '0 26px 34px rgba(0, 0, 0, 0.55)'), easing: 'cubic-bezier(0.3, 0, 0.5, 1)' },
      { offset: 0.24, transform: T(-10, -80, 70, 38, -5.5, 1.03), boxShadow: glow(0.4, '0 70px 60px rgba(0, 0, 0, 0.45)'), easing: 'cubic-bezier(0.25, 0.55, 0.3, 1)' },
      { offset: 0.84, transform: T(h.dx, h.dy + 4, 0, -4, 1, h.z * 1.006), boxShadow: glow(0, '0 40px 90px rgba(0, 0, 0, 0.6)'), easing: 'ease-in-out' },
      { offset: 1, transform: T(h.dx, h.dy, 0, 0, 0, h.z), boxShadow: glow(0, '0 34px 80px rgba(0, 0, 0, 0.6)') },
    ];
  }

  // Kupongen i handen utan rörelser.
  function inHand(el, h) {
    const { transform, boxShadow } = handFrames(h)[3];
    Object.assign(el.style, { transform, boxShadow });
  }

  // Mellan högen och handen: kupongen lyfts, vänds över långsidan och
  // förstoras till mitten. → två delar, upp till kanten och därifrån till
  // handen; innehållet byts när den står på kant (turn).
  function flipFrames(sl, h) {
    const f = 0.4;
    const mid = (ry) => T(sl.dx + (h.dx - sl.dx) * f, sl.dy + (h.dy - sl.dy) * f - 70, 60, 22, sl.a / 2, HOG.s + (h.z - HOG.s) * f, ry);
    const lyft = glow(0, '0 60px 60px rgba(0, 0, 0, 0.4)');
    return [
      [{ transform: restAt(sl), boxShadow: glow(0, HOG.skugga), easing: 'cubic-bezier(0.4, 0, 0.7, 1)' }, { transform: mid(90), boxShadow: lyft }],
      [
        { offset: 0, transform: mid(-90), boxShadow: lyft, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)' },
        { offset: 0.8, transform: T(h.dx, h.dy + 4, 0, -4, 1, h.z * 1.006), boxShadow: glow(0, '0 40px 90px rgba(0, 0, 0, 0.6)'), easing: 'ease-in-out' },
        { offset: 1, transform: T(h.dx, h.dy, 0, 0, 0, h.z), boxShadow: glow(0, '0 34px 80px rgba(0, 0, 0, 0.6)') },
      ],
    ];
  }

  // Kupongen vänds: framsidan med tipsen eller baksidan med namnet.
  function turn(k, front) {
    k.el.classList.toggle('rum-kup', front);
    k.el.classList.toggle('rum-bak', !front);
    k.el.innerHTML = front ? k.fram : k.bak;
    k.pen = k.el.querySelector('.pencil');
  }

  // Orden under kupongen, i fönstrets mått.
  function placeRow(h) {
    const s = R.kup.rad.style;
    s.left = `${r1(h.box.left)}px`;
    s.width = `${r1(h.box.width)}px`;
    s.top = `${r1(h.box.top + h.box.height + 20)}px`;
  }

  // Har du lämnat in tas din kupong ur högen (from), var du än klickar.
  function openCoupon(from = null) {
    if (R.kup) return true;
    const p = pult();
    if (!p || !p.hand || !R.el) return false;
    if (p.inne) from = document.querySelector(`#rum-hogen [data-vem="${CSS.escape(p.vem)}"]`);
    if (p.inne && !from) return false;
    zoomTv(false);
    if (R.nara) closeUp(false);
    const desk = document.getElementById('rum-kupong');
    const rd = { id: p.s.id, ids: p.s.matcher.map((x) => String(x.id)), gang: p.s.gang, name: (window.Samtal && Samtal.name()) || null };
    const nr = typeof couponNumber === 'function' ? couponNumber(rd.ids) : null;
    const fram = couponHtml(rd, roundRows(rd), p, p.fyll || p.andra);
    desk.parentElement.insertAdjacentHTML('beforeend', '<div class="rum-dimma" id="rum-dimma"></div>' +
      `<div class="rum-flat ${from ? 'rum-bak' : 'rum-kup'} rum-handen" id="rum-handen" role="dialog" aria-modal="true" aria-label="${nr ? `Kupong ${nr}` : 'Kupong'}" tabindex="-1">` +
      `${from ? from.innerHTML : fram}</div>`);
    // guldordet: Lämna in, Lämna in ändringen (när något är ändrat) eller,
    // när dina tips står fast, de andras tips under Kupong
    const go = p.fyll ? '<button type="button" class="guld" data-lamna>Lämna in</button>'
      : p.andra ? '<button type="button" class="guld" data-lamna disabled>Lämna in ändringen</button>'
        : '<a class="guld" href="#kupong">Se de andras tips</a>';
    R.el.insertAdjacentHTML('beforeend', '<div class="rum-hand" id="rum-hand"><button type="button" class="bla" data-tillbaka>Lägg tillbaka</button>' +
      `<p class="msg" role="status"></p>${go}</div>`);
    const el = document.getElementById('rum-handen');
    const k = R.kup = { el, dim: document.getElementById('rum-dimma'), rad: document.getElementById('rum-hand'), pen: el.querySelector('.pencil'), at: PEN_PULT, desk,
      andra: p.andra, orig: p.tecken, tecken: { ...p.tecken }, fram };
    k.msg = k.rad.querySelector('.msg');
    k.go = k.rad.querySelector('[data-lamna]');
    if (from) {
      // ur högen: vem och var den låg, och baksidan att vända tillbaka till
      Object.assign(k, { vem: p.vem, slot: slot(Number(from.dataset.i)), bak: from.innerHTML });
      from.style.visibility = 'hidden';
      el.style.transform = restAt(k.slot);
    } else desk.style.visibility = 'hidden';
    R.el.classList.add('i-handen');
    // kameran ställer sig rakt framför, så att kupongen står rakt i handen
    R.tx = 0;
    R.ty = 0;
    const h = held();
    placeRow(h);
    if (calm()) {
      setCam(0, 0);
      if (from) turn(k, true);
      inHand(el, h);
      Object.assign(k.pen.style, penAt(PEN_VILA));
      k.at = PEN_VILA;
    } else if (from) {
      // lyfts ur högen och vänds på vägen upp; pennan ligger redan bredvid
      const [a, b] = flipFrames(k.slot, h);
      k.opening = true;
      k.fade = k.dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: 'ease', fill: 'both' });
      k.show = k.rad.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 860, easing: 'ease-out', fill: 'both' });
      const up = el.animate(a, { duration: 380, fill: 'both' });
      up.finished.then(() => {
        if (R.kup !== k) return null;
        turn(k, true);
        Object.assign(k.pen.style, penAt(PEN_VILA));
        k.at = PEN_VILA;
        k.pen.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 420, fill: 'backwards' });
        k.anim = el.animate(b, { duration: 640, fill: 'both' });
        up.cancel();
        return k.anim.finished;
      }).then(() => {
        k.opening = false;
        if (k.later) closeCoupon();
      }, () => {});
    } else {
      k.anim = el.animate(handFrames(h), { duration: 950, fill: 'both' });
      k.fade = k.dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: 'ease', fill: 'both' });
      k.show = k.rad.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 780, easing: 'ease-out', fill: 'both' });
      // pennan följer med upp och rullar sedan undan till sidan
      penGo([{ ...PEN_PULT, l: 0.15, t: 420, e: 'ease-in' }, { ...PEN_VILA, l: 0.5, t: 380, e: 'cubic-bezier(0.3, 0, 0.3, 1)' }, { ...PEN_VILA, t: 160, e: 'ease-in' }]);
    }
    el.focus({ preventScroll: true });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button.box');
      if (!b || k.closing) return;
      if (b.dataset.vem) choose(b);
      else tick(b);
    });
    k.rad.addEventListener('click', (e) => {
      if (e.target.closest('[data-tillbaka]')) closeCoupon();
      else if (e.target.closest('[data-lamna]')) handIn();
    });
    return true;
  }

  function closeCoupon(now = false) {
    const k = R.kup;
    if (!k || k.closing) return;
    // på väg upp ur högen: läggs tillbaka när den är framme
    if (k.opening && !now) {
      k.later = true;
      return;
    }
    k.closing = true;
    clearTimeout(k.idle);
    R.el.classList.remove('i-handen');
    const done = () => {
      if (R.kup !== k) return;
      R.kup = null;
      // kupongen på pulten (och högen) ritas med det som fylldes i innan den syns igen
      if (R.on) fill();
      k.desk.style.visibility = '';
      k.el.remove();
      k.dim.remove();
      k.rad.remove();
      if (calm()) setCam(R.mx, R.my);
    };
    // Inlämnad (k.vem): till högen, och på pulten ligger en ny. Din plats i
    // högen finns när tjänsten har svarat; den står tom tills kupongen landar.
    if (k.vem && R.on) {
      fill();
      k.desk.style.visibility = '';
      const a = document.querySelector(`#rum-hogen [data-vem="${CSS.escape(k.vem)}"]`);
      if (a) k.slot = slot(Number(a.dataset.i));
    }
    if (now || calm() || !k.anim || (k.vem && !k.slot)) {
      done();
      return;
    }
    if (k.vem) {
      toPile(k, done);
      return;
    }
    penGo([{ ...PEN_VILA, l: 0.4, t: 240, e: 'ease-out' }, { ...PEN_PULT, l: 0.15, t: 380, e: 'cubic-bezier(0.4, 0, 0.6, 1)' }, { ...PEN_PULT, t: 200, e: 'ease-in' }]);
    k.anim.reverse();
    k.anim.updatePlaybackRate(-1.15);
    k.fade.reverse();
    k.show.reverse();
    k.anim.finished.then(done, done);
  }

  // Tillbaka till högen: samma väg som upp ur den, baklänges – kupongen
  // vänds på vägen ner och landar på sin plats.
  function toPile(k, done) {
    const [a, b] = flipFrames(k.slot, held());
    if (k.pen) k.pen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    const down = k.el.animate(b, { duration: 560, fill: 'both' });
    down.reverse();
    k.anim.cancel();
    k.fade.reverse();
    k.show.reverse();
    down.finished.then(() => {
      if (R.kup !== k) return null;
      turn(k, false);
      const land = k.el.animate(a, { duration: 420, fill: 'both' });
      land.reverse();
      down.cancel();
      return land.finished;
    }).then(done, done);
  }

  // Pennan går genom punkterna – t = millisekunder dit, e = takten – från
  // där den är just nu.
  function penGo(path) {
    const k = R.kup;
    for (const a of k.pen.getAnimations()) {
      a.commitStyles();
      a.cancel();
    }
    const total = path.reduce((s, p) => s + p.t, 0);
    let acc = 0;
    const frames = [{ offset: 0, transform: k.pen.style.transform, filter: k.pen.style.filter, easing: path[0].e || 'ease-in-out' }];
    path.forEach((p, i) => {
      acc += p.t;
      frames.push({ offset: acc / total, ...penAt(p), easing: (path[i + 1] && path[i + 1].e) || 'linear' });
    });
    k.at = path[path.length - 1];
    return k.pen.animate(frames, { duration: total, fill: 'forwards' });
  }

  // Rutans läge på kupongen, i kupongens egna mått.
  function spot(el) {
    let x = 0;
    let y = 0;
    for (let e = el; e && e !== R.kup.el; e = e.offsetParent) {
      x += e.offsetLeft;
      y += e.offsetTop;
    }
    return { x, y };
  }

  // Pennan drar krysset i rutan: ner, ett streck, upp och över, ett streck
  // till, och lyfter. Står den still en stund lägger den sig vid sidan igen.
  function drawCross(box, key) {
    const k = R.kup;
    box.insertAdjacentHTML('beforeend', crossSvg(key));
    if (calm()) return;
    const svg = box.lastElementChild;
    const o = spot(box);
    const [s1, s2] = strokes(key);
    const at = (pt, l, t, e) => ({ x: o.x + pt[0], y: o.y + pt[1], a: PEN_SKRIV, l, t, e });
    const travel = Math.round(Math.min(340, Math.max(150, Math.hypot(o.x - k.at.x, o.y - k.at.y) * 0.9)));
    penGo([
      at(s1.a, 0.7, travel, 'cubic-bezier(0.4, 0, 0.2, 1)'), at(s1.a, 0, 50, 'ease-in'), at(s1.b, 0, 120, 'cubic-bezier(0.3, 0, 0.6, 1)'),
      at(s1.b, 0.45, 50, 'ease-out'), at(s2.a, 0.45, 90, 'ease-in-out'), at(s2.a, 0, 45, 'ease-in'), at(s2.b, 0, 120, 'cubic-bezier(0.3, 0, 0.6, 1)'),
      at([s2.b[0] + 12, s2.b[1] + 10], 0.8, 220, 'ease-out'),
    ]);
    const [p1, p2] = svg.querySelectorAll('path');
    const line = (p, delay) => p.animate([{ strokeDashoffset: 1.05 }, { strokeDashoffset: 0 }], { duration: 120, delay, easing: 'cubic-bezier(0.3, 0, 0.6, 1)', fill: 'backwards' });
    line(p1, travel + 50);
    line(p2, travel + 50 + 120 + 50 + 90 + 45);
    clearTimeout(k.idle);
    k.idle = setTimeout(() => {
      if (R.kup === k && !k.closing) penGo([{ ...PEN_VILA, l: 0.4, t: 480, e: 'cubic-bezier(0.4, 0, 0.3, 1)' }, { ...PEN_VILA, t: 160, e: 'ease-in' }]);
    }, 1800);
  }

  // Ett kryss som tas bort suddas ut.
  function eraseCross(box) {
    for (const svg of box.querySelectorAll('.kryss:not(.ut)')) {
      svg.classList.add('ut');
      if (calm()) svg.remove();
      else svg.animate([{ opacity: 1 }, { opacity: 0, filter: 'blur(1.5px)' }], { duration: 240, easing: 'ease-out', fill: 'forwards' }).finished.then(() => svg.remove(), () => {});
    }
  }

  // En ruta för ett tecken: kryssas i eller ur, och utkastet sparas – en
  // ändring av dina inlämnade tips först när den lämnas in, som på papperet.
  function tick(b) {
    const k = R.kup;
    const row = b.closest('.row');
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('x', on);
    if (on) drawCross(b, `${row.dataset.id}${b.dataset.s}`);
    else eraseCross(b);
    const sign = SIGNS.filter((s) => row.querySelector(`[data-s="${s}"]`).getAttribute('aria-pressed') === 'true').join('');
    row.classList.toggle('tom', !sign);
    if (k.andra) {
      if (sign) k.tecken[row.dataset.id] = sign;
      else delete k.tecken[row.dataset.id];
      k.go.disabled = Object.keys({ ...k.orig, ...k.tecken }).every((id) => (k.orig[id] || '') === (k.tecken[id] || ''));
    } else Samtal.pult.tippa(row.dataset.id, sign);
    const rows = [...k.el.querySelectorAll('.row')];
    const n = rows.filter((r) => !r.classList.contains('tom')).length;
    const f = k.el.querySelector('[data-tippat]');
    if (f) f.textContent = `${n}/${rows.length}`;
    if (n === rows.length) k.el.classList.remove('need');
    k.msg.textContent = '';
  }

  // Tippare: du kryssar för vem du är.
  function choose(b) {
    const k = R.kup;
    if (b.getAttribute('aria-pressed') === 'true' || !Samtal.pult.vem(b.dataset.vem)) return;
    for (const o of k.el.querySelectorAll('button[data-vem][aria-pressed="true"]')) {
      o.setAttribute('aria-pressed', 'false');
      o.classList.remove('x');
      eraseCross(o);
    }
    b.setAttribute('aria-pressed', 'true');
    b.classList.add('x');
    drawCross(b, `vem${b.dataset.vem}`);
    k.el.classList.remove('need-vem');
    k.msg.textContent = '';
  }

  // Lämna in: som på papperet under Kupong. Stämpeln slår i, och kupongen
  // vänds och läggs i högen.
  async function handIn() {
    const k = R.kup;
    if (!k || k.busy || k.closing || k.opening) return;
    const p = pult();
    if (!p || !(k.andra ? p.andra : p.fyll)) {
      k.msg.textContent = 'Kupongen går inte att lämna in längre.';
      return;
    }
    if (k.andra) {
      // en ändring får lämna matcher tomma, som på papperet
      if (k.go.disabled) return;
    } else if (!p.vem) {
      k.el.classList.add('need-vem');
      k.msg.textContent = 'Vem är du?';
      return;
    }
    const left = k.andra ? 0 : p.s.matcher.filter((x) => !p.tecken[x.id]).length;
    if (left) {
      k.el.classList.add('need');
      k.msg.textContent = `${left === 1 ? 'En match saknar' : `${left} matcher saknar`} tecken.`;
      return;
    }
    k.busy = true;
    k.go.disabled = true;
    k.msg.textContent = 'Lämnar in …';
    const out = await Samtal.pult.lamnaIn(k.andra ? k.tecken : null);
    if (R.kup !== k) return;
    k.busy = false;
    k.go.disabled = false;
    if (!out.ok) {
      k.msg.textContent = out.error || 'Ingen kontakt med servern.';
      return;
    }
    k.msg.textContent = '';
    k.go.disabled = true;
    let st = k.el.querySelector('.stampel');
    if (!st) {
      k.pen.insertAdjacentHTML('beforebegin', '<span class="stampel">Inlämnad</span>');
      st = k.pen.previousElementSibling;
    }
    if (!calm()) {
      st.animate([
        { transform: 'rotate(-8deg) scale(1.9)', opacity: 0 },
        { transform: 'rotate(-8deg) scale(0.95)', opacity: 0.9, offset: 0.75 },
        { transform: 'rotate(-8deg) scale(1)', opacity: 0.82 },
      ], { duration: 260, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' });
    }
    // baksidan med ditt namn, som kupongen visar i högen
    if (!k.vem) {
      k.vem = p.vem;
      k.bak = backHtml(p.vem, p.s.gang.findIndex((g) => g.id === p.vem));
    }
    // kvittot visar att du är inne
    if (typeof tpLoad === 'function') tpLoad(true).then(() => { if (R.on) fill(); });
    setTimeout(() => { if (R.kup === k) closeCoupon(); }, calm() ? 700 : 1100);
  }

  function wire() {
    const el = R.el;
    el.addEventListener('mousemove', (e) => {
      if (R.kup) return;
      R.tx = (e.clientX / innerWidth) * 2 - 1;
      R.ty = (e.clientY / innerHeight) * 2 - 1;
    });
    el.addEventListener('mouseover', (e) => {
      const a = !R.kup && e.target.closest('.rum-sak, .rum-tag, .rum-guld');
      hot(a ? a.dataset.nav : null);
    });
    el.addEventListener('click', (e) => {
      // kupongen i handen: ett klick utanför den lägger tillbaka den
      if (R.kup) {
        if (e.target.closest('#rum-handen, #rum-hand, .rum-hdr')) return;
        e.preventDefault();
        closeCoupon();
        return;
      }
      const ttxLink = e.target.closest('.ttx .fast a');
      if (ttxLink) return;
      if (R.nara) {
        // i närbilden leder raderna och guldordet vidare; utanför tavlan tillbaka
        if (!e.target.closest('#rum-fbn, .rum-hdr, .rum-ft')) closeUp(false);
        return;
      }
      if (e.target.closest('.rum-tag') && openCoupon()) {
        e.preventDefault();
        return;
      }
      const a = e.target.closest('.rum-sak');
      if (a && el.contains(a)) go(a, e);
      else if (R.zoom && !e.target.closest('.rum-hdr, .rum-ft')) zoomTv(false);
    });
    document.addEventListener('keydown', (e) => {
      if (!R.on || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName) || document.querySelector('dialog[open]')) return;
      const k = e.key.toLowerCase();
      if (R.kup) {
        if (k === 'k' || k === 'escape') closeCoupon();
      } else if (k === 'k') {
        if (!openCoupon()) location.hash = 'kupong';
      } else if (k === 't') zoomTv(!R.zoom);
      else if (k === 'escape' && R.nara) closeUp(false);
      else if (k === 'escape' && R.zoom) zoomTv(false);
    });
    addEventListener('resize', fit);
    if (window.Spoiler && Spoiler.onChange) Spoiler.onChange(() => { if (R.on) fill(); });
  }

  // Scenen täcker fönstret (1600 × 1000, beskuren i kanterna).
  function fit() {
    if (!R.el || R.el.hidden) return;
    // för smalt för rummet: den vanliga förstasidan (route i app.js)
    if (!fits()) {
      dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    const s = Math.max(innerWidth / W, innerHeight / H);
    R.k = s;
    R.ox = (innerWidth - W * s) / 2;
    R.oy = (innerHeight - H * s) / 2;
    const st = R.el.querySelector('.rum-stage');
    st.style.transform = `translate(${R.ox.toFixed(1)}px, ${R.oy.toFixed(1)}px) scale(${s.toFixed(4)})`;
    // närbilden av tavlan ryms mellan menyn och foten
    const n = document.getElementById('rum-fbn');
    if (n && n.offsetWidth) n.style.setProperty('--k', Math.min((innerWidth - 120) / n.offsetWidth, (innerHeight - 190) / n.offsetHeight, 1.3).toFixed(3));
    // kupongen i handen står kvar mitt i fönstret
    if (R.kup && !R.kup.closing && !R.kup.opening) {
      const h = held();
      placeRow(h);
      if (R.kup.anim && !R.kup.slot) R.kup.anim.effect.setKeyframes(handFrames(h));
      else {
        inHand(R.kup.el, h);
        if (R.kup.anim) R.kup.anim.effect.setKeyframes(flipFrames(R.kup.slot, h)[1]);
      }
    }
  }

  // ---------- in och ut ----------

  const fits = () => R.q.has('rum-t') || matchMedia('(min-width: 900px) and (min-aspect-ratio: 6/5)').matches;

  function show() {
    if (!R.built) build();
    const q = R.q;
    if (q.has('rum-t')) R.frozen = parseFloat(q.get('rum-t')) || 0;
    if (q.has('rum-mx')) R.mx = R.tx = parseFloat(q.get('rum-mx'));
    if (q.has('rum-my')) R.my = R.ty = parseFloat(q.get('rum-my'));
    R.el.hidden = false;
    document.documentElement.classList.add('i-rummet');
    R.on = true;
    fit();
    zoomTv(false);
    if (R.nara) closeUp(false);
    hot(null);
    const ready = Promise.all([load(), three()]);
    if (still()) {
      // en fast bild: allt på samma tid, och klar när datan och gänget är ritade
      ready.then(() => {
        freezeCss(R.frozen);
        if (q.has('rum-tavla')) closeUp(true);
        frame();
        document.body.dataset.rumKlar = '1';
      });
    } else if (calm()) {
      // utan rörelser: en bild, och en ny när datan ändras
      ready.then(frame);
    } else loop();
    clearInterval(R.poll);
    // omgången och liveställningen kan ändras medan rummet står öppet
    R.poll = setInterval(() => { if (R.on) load(); }, 60000);
  }

  function hide() {
    if (!R.on) return;
    closeCoupon(true);
    R.on = false;
    cancelAnimationFrame(R.raf);
    clearInterval(R.poll);
    R.el.hidden = true;
    document.documentElement.classList.remove('i-rummet');
  }

  return { fits, show, hide, redraw: () => { if (R.on) fill(); } };
})();
