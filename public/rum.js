'use strict';

// ---------- rummet ----------
//
// Förstasidan: tobaksaffären vid spelpulten, ritad i lager
// på olika djup (CSS 3D) som vrids lite när musen rör sig. Gänget – DL, DT
// och DJ – sitter som leksaksfigurer (three.js, rum-3d.js) på fönsterbänken,
// dricker öl, röker och pratar. Föremålen leder vidare, som i ett rum hos
// Felix Rieseberg:
//   korktavlan → gängets kuponger     pokalhyllan, Omgångens orakel → Olympen
//   skårtavlan → Tabeller             anslagstavlan: lapparna (A, rum-anslag.js)
//   namnet på dörren → Om oss
//   kvittot → Kupong, tv:n zoomas in (T): text-tv med en sida per match och
//   kupongens matcher live på 377 (rum-tv.js)
//   videon på disken zoomas in (V): repriserna på VHS, på tv:n och i lådan
//   bredvid, som spelas i rutan (rum-video.js)
//   uret, skårtavlan, oraklet och VM 94-affischen: kameran går fram till dem
//   (närbilderna, sak); skårtavlan och oraklet leder sedan vidare
//   kortregistret på disken lyfts fram (R): ett kort per lag och per möte
//   (rum-register.js, lådan i three.js i rum-kortlada.js)
//   kupongen tas i handen (K) – fylls i eller ändras – eller → Kupong.
//   högen bredvid: de inlämnade kupongerna med baksidan upp; din egen tas i
//   handen därifrån när du har lämnat in, de andras → Kupong.
// Det finns ingen meny: pekar man på ett föremål lyser det, och snabbvalet på
// text-tv:n som det leder till tänds.
//
// Vanlig sida (#hem) är den vanliga förstasidan. I telefonen står rummet
// också: scenen fyller höjden, och man ser sig omkring med fingret (pan) –
// scenen följer med och kameran vrids som med musen. På höjden är kupongen
// smal och hög (.rum.smal), som en riktig stryktipskupong, så att den går
// att fylla i; på bredden i telefonen står orden bredvid kupongen i handen
// (.rum.lag). Rörelserna stängs av med prefers-reduced-motion.
// För bilder: ?rum-t=<sekunder> fryser
// klockan, ?rum-mx=&rum-my= kamerans läge (−1…1), ?rum-vantar=DL,DT låter
// dem sitta med kupongen som om de inte hade lämnat in. ?rum-anslag visar anslagstavlan
// framme (=form, =skador … med den lappen i handen), ?rum-register
// kortregistret (=Arsenal … med det kortet i handen). ?rum-stopp=<timmar> som
// om det var så långt kvar till spelstoppet, ?rum-tittar som om matcherna
// pågick och ?rum-mal=dl:1,dt:-1,dj:0 som om det blev mål (rätt, fel, ingen
// skillnad), ?rum-video videon nära och ?rum-sak=ur|skar|ram|vm94 en närbild.
//
// Läses efter kupong.js, samtal.js, tippare.js och kronan.js och använder
// deras hjälpare (state, KP, TP, gradeRow, couponNumber, currentCoupon,
// Kronan.holders, Kronan.scene, Historik.coupons …) och tv:n i rum-tv.js
// (RumTv, läses före den här), anslagstavlan i rum-anslag.js (RumAnslag,
// också före) och kortregistret i rum-register.js (RumRegister, också före). rum-3d.js (gänget), rum-saker.js och rum-inredning.js (lysröret,
// neonskylten, uret, orakelramen, paketen, stolen, kupongstället …) hämtas
// först när rummet visas, med three.js från jsdelivr (importmap i
// index.html); utan WebGL står rummet kvar utan dem.

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
  // Skyltfönstrets och dörrens glas: där har väggen hål (masken rum-hal) och
  // utsikten bakom (rum-ute.js) syns.
  const WIN = { x: 272, y: 132, w: 676, h: 426 };
  const DORR = { x: 50, y: 136, w: 172, h: 560 };
  const box = (p) => `x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"`;


  const R = { built: false, on: false, el: null, q: new URLSearchParams(location.search), t0: performance.now(), frozen: null,
    mx: 0.5, my: -0.25, tx: 0.5, ty: -0.25, raf: 0, fig: null, zoom: null, last: 0, px: 0.5, py: 0.5, pek: 'mouse', dold: new Set() };
  const still = () => R.frozen != null;
  const calm = () => still() || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const now = () => (still() ? R.frozen : (performance.now() - R.t0) / 1000);
  // kupongen i handen, tv:n, videon, en närbild (sak), anslagstavlan eller kortregistret nära
  const nara = () => Boolean(R.kup || R.zoom || R.vnara || R.sak || (R.ans && R.ans.on()) || (R.reg && R.reg.on()));
  // punkten (fx, fy) i fönstret – mitten om inget annat sägs – i scenens mått
  const mid = (fx = 0.5, fy = 0.5) => [(innerWidth * fx - R.ox) / R.k, (innerHeight * fy - R.oy) / R.k];
  // i telefonen (som i rum-3d.js och de andra): rummet sparar på minnet
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;

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
  // Varje sak i ett plan är ett eget lager (.rum-pl > * i rum.css), och
  // Safari ritar ett lager i full storlek gånger skärmens pixeltäthet: en
  // SVG får därför bara rutan (x, y, b, h) som det den ritar behöver, med
  // samma koordinater som scenen.
  const svg = (inner, cls = '', [x, y, b, h] = [0, 0, W, H], z = 1) => `<svg class="rum-layer${cls ? ` ${cls}` : ''}" viewBox="${x} ${y} ${b} ${h}" ` +
    `style="${zoom(x, y, z)}width:${b}px; height:${h}px" aria-hidden="true">${inner}</svg>`;
  // I telefonen ritas en SVG utan text, som inte behöver vara skarpare nära,
  // med z av bildpunkterna (CSS zoom och sedan förstorad igen, som ljuset i
  // rum.css): 2/3 är så många som syns där, där scenen visas förminskad.
  const zoom = (x, y, z) => (LATT && z !== 1 ? `zoom:${z}; transform:scale(${(1 / z).toFixed(4)}); transform-origin:0 0; left:${r1(x / z)}px; top:${r1(y / z)}px; ` : `left:${x}px; top:${y}px; `);

  const DEFS = `<defs>
    <linearGradient id="rum-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f19"/><stop offset=".55" stop-color="#121826"/><stop offset="1" stop-color="#1c1d24"/></linearGradient>
    <linearGradient id="rum-furu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e1804" stop-opacity=".62"/><stop offset=".22" stop-color="#2e1804" stop-opacity=".12"/>
      <stop offset=".5" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
    <radialGradient id="rum-furu-lampa" cx=".5" cy="0" r=".7"><stop offset="0" stop-color="#fff2d6" stop-opacity=".22"/><stop offset="1" stop-color="#fff2d6" stop-opacity="0"/></radialGradient>
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
    <clipPath id="rum-win"><rect ${box(WIN)}/></clipPath>
    <clipPath id="rum-doorglass"><rect ${box(DORR)}/></clipPath>
    <mask id="rum-hal" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect ${box(WIN)} fill="#000"/><rect ${box(DORR)} fill="#000"/></mask>
    <filter id="rum-b1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.3"/></filter>
    <filter id="rum-b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="rum-b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="rum-b24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
    <filter id="rum-b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="rum-grainwood" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.003 0.07" numOctaves="3" seed="5"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .06  0 0 0 0 .03  1.5 0 0 0 -.5"/></filter>
    <filter id="rum-ved" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.22 0.0045" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .22  0 0 0 0 .11  0 0 0 0 .03  2.2 0 0 0 -.95"/></filter>
    <filter id="rum-flack" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011 .016" numOctaves="4" seed="8"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .13  0 0 0 0 .03  0 0 0 -2.2 1.25"/></filter>
    <filter id="rum-prick" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="1" seed="2"/><feColorMatrix values="0 0 0 0 .18  0 0 0 0 .12  0 0 0 0 .05  0 0 0 -9 6.4"/></filter>
    <filter id="rum-grime" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .006" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .52  0 0 0 0 .45  0 0 0 -2 1.1"/></filter>
  </defs>`;

  function shelf(yb, x0, x1) {
    return `<polygon points="${x0},${r1(at(x0, yb))} ${x1},${r1(at(x1, yb))} ${x1},${r1(at(x1, yb) + 8 * sc(x1))} ${x0},${r1(at(x0, yb) + 8 * sc(x0))}" fill="#241d15"/>` +
      `<polygon points="${x0},${r1(at(x0, yb))} ${x1},${r1(at(x1, yb))} ${x1},${r1(at(x1, yb) + 1.4 * sc(x1))} ${x0},${r1(at(x0, yb) + 1.4 * sc(x0))}" fill="#c9bfa5" opacity=".18"/>`;
  }

  // Furupanelen på bakväggen: lackade bräder med kvistar och ådring, mörka av
  // röken upptill och ljusare under lysröret. Där en tavla har hängt (runt
  // ramen) har furan inte mörknat lika mycket.
  function furu() {
    const R0 = rng(11);
    const tones = ['#b47c43', '#a9713a', '#bb874c', '#a46c36', '#b78046', '#ad763e'];
    let s = '';
    for (let x = 0; x < 1140; x += 34) {
      s += `<rect x="${x}" y="90" width="34" height="640" fill="${tones[(R0() * tones.length) | 0]}"/>` +
        `<rect x="${x}" y="90" width="1.8" height="640" fill="#26150a" opacity=".75"/><rect x="${x + 1.8}" y="90" width="1.2" height="640" fill="#f0c48a" opacity=".3"/>`;
    }
    s += '<rect x="0" y="90" width="1140" height="640" filter="url(#rum-ved)" opacity=".55"/>';
    for (let i = 0; i < 46; i++) {
      const x = r1(R0() * 1140), y = r1(100 + R0() * 620), rx = 2.4 + R0() * 3.6, ry = rx * (0.55 + R0() * 0.3);
      s += `<ellipse cx="${x}" cy="${y}" rx="${r1(rx * 2.6)}" ry="${r1(ry * 3.4)}" fill="#6a3c16" opacity=".28" filter="url(#rum-b1)"/>` +
        `<ellipse cx="${x}" cy="${y}" rx="${r1(rx)}" ry="${r1(ry)}" fill="#5a3010" opacity=".9"/><ellipse cx="${r1(x - rx * 0.2)}" cy="${y}" rx="${r1(rx * 0.45)}" ry="${r1(ry * 0.45)}" fill="#2a1405"/>`;
    }
    return `${s}<rect x="980" y="282" width="150" height="212" fill="#e2ad6e" opacity=".22"/>
  <rect x="0" y="90" width="1140" height="640" fill="#1c1006" opacity=".3"/>
  <rect x="0" y="90" width="1140" height="640" fill="url(#rum-furu)"/>
  <ellipse cx="650" cy="90" rx="620" ry="420" fill="url(#rum-furu-lampa)"/>
  <rect x="0" y="90" width="1140" height="640" filter="url(#rum-flack)" opacity=".3"/>
  <rect x="0" y="90" width="1140" height="640" filter="url(#rum-prick)" opacity=".35"/>
  <rect x="0" y="90" width="1140" height="7" fill="#000" opacity=".35"/>`;
  }

  // Bakgrunden: taket, väggarna (furupanelen och den nikotingula högra
  // väggen), dörren, skyltfönstret och disken. Lysröret, skyltarna och
  // paketen är i 3D (rum-inredning.js).
  function bg() {
    return svg(`${DEFS}
  <polygon points="0,0 1250,0 1140,90 0,90" fill="url(#rum-ceil)"/>
  <rect x="0" y="0" width="1250" height="90" filter="url(#rum-prick)" opacity=".5"/>
  <ellipse cx="650" cy="44" rx="470" ry="52" fill="#3a2a0e" opacity=".42" filter="url(#rum-b24)"/>
  <path d="M1010 8 q22 -6 40 6 q18 14 -2 26 q-20 10 -40 -2 q-16 -14 2 -30 z" fill="#5a4418" opacity=".28" filter="url(#rum-b4)"/>
  <path d="M1010 8 q22 -6 40 6 q18 14 -2 26 q-20 10 -40 -2 q-16 -14 2 -30 z" fill="none" stroke="#2a1e08" stroke-opacity=".35" stroke-width="1.6"/>
  <g stroke="#000" stroke-opacity=".18" stroke-width="1.2"><line x1="0" y1="45" x2="1194" y2="45"/><line x1="200" y1="0" x2="200" y2="90"/><line x1="560" y1="0" x2="560" y2="90"/><line x1="920" y1="0" x2="920" y2="90"/></g>
  <ellipse cx="650" cy="62" rx="420" ry="70" fill="url(#rum-tube)" filter="url(#rum-b24)" class="rum-tubeglow"/>

  <g mask="url(#rum-hal)">
  ${furu()}
  <path d="M640 92 q30 26 18 60 q-6 22 10 40" fill="none" stroke="#3b2a12" stroke-opacity=".28" stroke-width="7" filter="url(#rum-b4)"/>
  </g>
  <ellipse cx="760" cy="104" rx="58" ry="16" fill="none" stroke="#4a3412" stroke-opacity=".3" stroke-width="3" filter="url(#rum-b1)"/>
  <ellipse cx="768" cy="106" rx="40" ry="10" fill="#4a3412" opacity=".12" filter="url(#rum-b4)"/>
  <path d="M700 90 L700 104 Q700 112 690 114 L360 120 Q352 121 352 130" fill="none" stroke="#2c2a26" stroke-width="2.2" opacity=".85"/>
  <g fill="#cbbf9e" opacity=".5"><rect x="512" y="114" width="5" height="3" rx="1"/><rect x="420" y="117" width="5" height="3" rx="1"/></g>
  <path d="M0 470 q30 -10 60 4 l-4 18 q-30 -8 -56 2 z" fill="#2a1e0c" opacity=".14" filter="url(#rum-b4)"/>

  <polygon points="1140,90 1250,0 1600,0 1600,1000 1140,730" fill="url(#rum-rwall)"/>
  <polygon points="1140,90 1250,0 1600,0 1600,1000 1140,730" filter="url(#rum-flack)" opacity=".55"/>
  <line x1="1140" y1="90" x2="1140" y2="730" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
  <polygon points="1140,90 1600,0 1600,1000 1140,730" fill="#000" opacity=".2"/>

  <rect x="36" y="122" width="200" height="610" fill="#3b3b3d" mask="url(#rum-hal)"/>
  <g clip-path="url(#rum-doorglass)"><rect x="50" y="136" width="172" height="560" filter="url(#rum-grime)" opacity=".5"/></g>
  <rect x="50" y="136" width="172" height="560" fill="#fff" opacity=".03"/>
  <rect x="44" y="420" width="184" height="16" rx="3" fill="url(#rum-alu)"/>
  <path d="M36 122 h200 v610 h-200 z M50 136 v560 h172 v-560 z" fill="#1e1e20" fill-rule="evenodd" opacity=".001"/>

  <rect x="262" y="122" width="696" height="446" fill="#3a3a3c" mask="url(#rum-hal)"/>
  <g clip-path="url(#rum-win)">
    <rect x="272" y="132" width="676" height="426" fill="#fff" opacity=".03"/>
    <rect x="420" y="150" width="420" height="5" rx="2" fill="#fff" opacity=".12" filter="url(#rum-b1)"/>
    <rect x="272" y="132" width="676" height="426" filter="url(#rum-grime)" opacity=".45"/>
    <rect x="272" y="520" width="676" height="38" fill="#2a2418" opacity=".35" filter="url(#rum-b4)"/>
  </g>
  <rect x="604" y="132" width="12" height="426" fill="#3a3a3c"/>
  <rect x="262" y="558" width="696" height="12" fill="#2c2c2e"/>
  <path d="M940 122 l18 0 l0 30 l-9 -6 l-4 10 l-5 -12 z" fill="#8e8064" opacity=".5"/>

  <polygon points="1060,490 1140,490 1600,599 1600,652" fill="url(#rum-countertop)"/>
  <polygon points="1060,490 1600,652 1600,1000 1060,1000" fill="url(#rum-counter)"/>
  <line x1="1060" y1="490" x2="1600" y2="652" stroke="#c9c2b2" stroke-opacity=".35" stroke-width="2"/>
  <g stroke="#d9c7a1" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round">
    <line x1="1092" y1="500" x2="1130" y2="511"/><line x1="1236" y1="543" x2="1250" y2="547"/><line x1="1318" y1="567" x2="1372" y2="583"/><line x1="1490" y1="619" x2="1512" y2="626"/>
  </g>
  <polygon points="1060,492 1600,654 1600,700 1060,540" fill="#000" opacity=".12"/>`, '', undefined, 2 / 3) +
      // Namnet i bladguld på glaset, spegelvänt inifrån som neonskylten, i
      // en egen SVG: Chrome lägger ut text i SVG på nytt i varje bildruta
      // medan rummet vrids, och då ritades hela väggen om varje gång.
      svg(`<defs><path id="rum-dorrbage" d="M66 252 Q136 232 206 252"/></defs>
  <a class="rum-sak" href="om-oss.html" aria-label="Om oss" id="rum-dorrnamn">
    <rect x="60" y="226" width="152" height="72" fill="#000" opacity=".001"/>
    <g transform="translate(272 0) scale(-1 1)" font-family="Fraunces" text-anchor="middle">
      <text font-style="italic" font-weight="700" font-size="21" fill="#1a1208" opacity=".55" transform="translate(1.5 2)"><textPath href="#rum-dorrbage" startOffset="50%">Matchfixarna</textPath></text>
      <text font-style="italic" font-weight="700" font-size="21" fill="url(#rum-guld)" stroke="#3a2808" stroke-width=".8" paint-order="stroke"><textPath href="#rum-dorrbage" startOffset="50%">Matchfixarna</textPath></text>
      <line x1="92" y1="262" x2="180" y2="262" stroke="url(#rum-guld)" stroke-width="1.2"/>
      <text x="136" y="277" font-weight="700" font-size="10.5" letter-spacing="2.4" fill="url(#rum-guld)" stroke="#3a2808" stroke-width=".4" paint-order="stroke">TOBAK &amp; SPEL</text>
      <text x="136" y="292" font-style="italic" font-size="9.5" fill="#d8b46a" opacity=".9">Öppet till spelstoppet</text>
    </g>
  </a>`, '', [44, 210, 184, 100]) +
      // Neonens sken genom fönstret för sig: det blinkar med neonen
      // (neonOn), och i väggens SVG ritades hela väggen om varje gång. Det
      // står längre till vänster än disken, som ritas efter det i väggen.
      svg('<ellipse cx="440" cy="236" rx="320" ry="200" fill="#ff4a30" opacity=".08" filter="url(#rum-b40)" class="rum-neonglow"/>', '', [0, 0, 900, 560], 0.25);
  }

  // Neonskylten är i 3D (rum-inredning.js) och glappar ibland (neonOn); här
  // är skenet runt den.
  function neon() {
    return svg('<ellipse cx="440" cy="168" rx="160" ry="58" fill="#ff3a2a" opacity=".28" filter="url(#rum-b24)" class="rum-neonhalo"/>', '', [100, 40, 680, 260], 0.25);
  }

  // ---------- de sju sakerna ----------

  // 5. Omgångens orakel: oraklet ur Olympen (Kronan.scene, fotona på
  // sockeln) under stationsuret, i en förgylld ram med mässingsskylten under
  // (båda i 3D, rum-inredning.js). Ett skimmer drar då och då över glaset.
  function frameHtml() {
    return '<a class="rum-ram rum-sak" href="#olympen" data-nav="olympen" data-sak="ram" aria-label="Olympen">' +
      '<span class="rum-ram-list"><span class="kr-scene kr-orakel" id="rum-ram-bild"></span><span class="rum-ram-glans"></span></span></a>';
  }

  // Högra väggen i perspektiv: ett element med väggens mått (z = djupet in
  // från hörnet, y = höjden i hörnet) vrids in mot väggen. P = 1000 px.
  const wz = (x) => 1000 * (1 - (1140 - VP[0]) / (x - VP[0]));
  function onWall(x0, x1, yb0, yb1, cls, inner, attrs) {
    const z0 = wz(x0);
    return `<a class="${cls} rum-sak" ${attrs} style="top:${yb0}px; height:${yb1 - yb0}px; width:${r1(wz(x1) - z0)}px; transform: rotateY(-90deg) translateX(${r1(z0)}px)">${inner}</a>`;
  }

  // 3. Korktavlan med gängets gamla kuponger, rättade med röd penna.
  // 6. Skårtavlan med ligatabellen i vita plastbokstäver.
  // 7. Anslagstavlan under tv:n (rum-anslag.js), fri från tv:ns hylla och disken.
  function rightWall() {
    return '<div class="rum-hv">' +
      (window.RumAnslag ? onWall(1144, 1300, 316, 478, 'rum-ans', RumAnslag.wall(), 'href="statistik.html" data-nav="statistik" aria-label="Anslagstavlan" id="rum-ans"') : '') +
      onWall(1330, 1478, 352, 458, 'rum-skar', '<span class="rum-skar-in" id="rum-skar"></span>', 'href="tabeller.html" data-nav="tabeller" data-sak="skar" aria-label="Tabeller"') +
      onWall(1496, 1700, 330, 478, 'rum-kork', '<span class="rum-kork-in" id="rum-kork"></span>', 'href="#olympen/kuponger" data-nav="olympen" aria-label="Gängets kuponger"') +
      '</div>';
  }

  // 4. Pokalhyllan: ritas på väggen (shelves()).
  const POKAL = { yb: 288, x0: 1146, x1: 1312 };
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
  function shelves(trophies) {
    // en pokal per vunnen omgång, i vinnarens färg; ett dammfritt märke där
    // nästa ska stå
    let cups = '';
    let x = POKAL.x0 + 10;
    trophies.forEach((col, i) => {
      if (x > POKAL.x1 - 8) return;
      cups += trophy(x, POKAL.yb, col, i);
      x += 17 * sc(x);
    });
    if (x < POKAL.x1 - 8) cups += `<ellipse cx="${r1(x)}" cy="${r1(at(x, POKAL.yb) - 1)}" rx="${r1(6 * sc(x))}" ry="${r1(1.6 * sc(x))}" fill="#000" opacity=".25"/>`;
    // pokalerna ligger i länken, med ytan man klickar på, så att de lyser
    // som de andra föremålen när man pekar på dem
    const hit = (x0, x1, y0, y1, nav, href, label, inner) => `<a href="${href}" data-nav="${nav}" class="rum-sak" aria-label="${label}">${inner}` +
      `<polygon points="${x0},${r1(at(x0, y1))} ${x1},${r1(at(x1, y1))} ${x1},${r1(at(x1, y0))} ${x0},${r1(at(x0, y0))}" fill="#fff" opacity="0"/></a>`;
    return shelf(POKAL.yb, POKAL.x0, POKAL.x1) +
      // damm på hyllkanterna
      `<polygon points="${POKAL.x0},${r1(at(POKAL.x0, POKAL.yb) - 0.6)} ${POKAL.x1},${r1(at(POKAL.x1, POKAL.yb) - 0.8)} ${POKAL.x1},${r1(at(POKAL.x1, POKAL.yb) + 0.6)} ${POKAL.x0},${r1(at(POKAL.x0, POKAL.yb) + 0.5)}" fill="#d9d2c0" opacity=".3"/>` +
      hit(POKAL.x0, POKAL.x1, POKAL.yb - 36, POKAL.yb + 6, 'olympen', '#olympen', 'Olympen', cups);
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
  <rect x="-10" y="984" width="1620" height="20" fill="url(#rum-alu)"/>`, '', [0, 510, W, H - 510], 2 / 3);
  }

  function sill() {
    const S = 568;
    return svg(`<polygon points="262,${S - 14} 958,${S - 14} 984,${S + 10} 236,${S + 10}" fill="url(#rum-sill)"/>
  <polygon points="262,${S - 14} 958,${S - 14} 984,${S + 10} 236,${S + 10}" filter="url(#rum-prick)" opacity=".6"/>
  <rect x="236" y="${S + 10}" width="748" height="12" fill="#4a453c"/>
  <g stroke="#cfc6b0" stroke-opacity=".45" stroke-width="1.6"><line x1="300" y1="${S + 10}" x2="342" y2="${S + 10}"/><line x1="610" y1="${S + 10}" x2="628" y2="${S + 10}"/><line x1="880" y1="${S + 10}" x2="930" y2="${S + 10}"/></g>
  <rect x="236" y="${S + 22}" width="748" height="6" fill="#000" opacity=".3" filter="url(#rum-b4)"/>`, '', [220, 540, 780, 75]) +
      // det svaga skenet från neonen för sig, med en fjärdedel av bildpunkterna i telefonen
      svg(`<ellipse cx="560" cy="${S - 150}" rx="360" ry="150" fill="#ff3a2a" opacity=".05" filter="url(#rum-b40)"/>`, '', [40, 120, 1040, 600], 0.25) +
      '<canvas id="rum-3d" class="rum-3d" width="1280" height="560"></canvas>';
  }

  // Tv:n i hörnet (rum-tv.js).
  const tv = () => (window.RumTv ? RumTv.html() : '');
  // Videon på disken, och väggen, disken och pulten till höger om bilden (rum-video.js).
  const vid = (part) => (window.RumVideo ? RumVideo.html(part) : '');

  // Pingklockan på pulten, där guldordet annars står: till uppgörelsen ringer
  // man in gänget. Kupan i mässing speglar lysröret och lite av neonskylten.
  const bell = () => `<svg width="104" height="88" viewBox="0 0 104 88" aria-hidden="true"><defs>
    <radialGradient id="rum-kl-kupa" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="#fff7dc"/><stop offset=".16" stop-color="#f3d488"/><stop offset=".45" stop-color="#c8963a"/><stop offset=".78" stop-color="#7a5216"/><stop offset="1" stop-color="#3c2706"/></radialGradient>
    <linearGradient id="rum-kl-fot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140d0a"/><stop offset=".3" stop-color="#5a3e2f"/><stop offset=".55" stop-color="#2c1e17"/><stop offset="1" stop-color="#0e0907"/></linearGradient>
    <linearGradient id="rum-kl-krom" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d5a55"/><stop offset=".3" stop-color="#f4f1ea"/><stop offset=".55" stop-color="#9a958b"/><stop offset="1" stop-color="#3b3935"/></linearGradient>
    <filter id="rum-kl-b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>
  <ellipse cx="54" cy="76" rx="48" ry="9" fill="#000" opacity=".6" filter="url(#rum-kl-b3)"/>
  <path d="M8 64 L8 72 A44 10 0 0 0 96 72 L96 64 Z" fill="url(#rum-kl-fot)"/>
  <ellipse cx="52" cy="64" rx="44" ry="10" fill="#4a3226" stroke="#7d5a44" stroke-width=".8"/>
  <g class="kupa"><path d="M15 63 C15 35 30 23 52 23 C74 23 89 35 89 63 A37 7.5 0 0 1 15 63 Z" fill="url(#rum-kl-kupa)"/>
    <path d="M15 63 A37 7.5 0 0 0 89 63" fill="none" stroke="#2c1c05" stroke-width="1.2" opacity=".6"/>
    <g fill="none" stroke-linecap="round"><path d="M24 54 C22 40 30 31 42 27" stroke="#fffbe8" stroke-width="3.2" opacity=".75"/>
    <path d="M30 58 C30 50 32 45 35 41" stroke="#fffbe8" stroke-width="1.6" opacity=".4"/>
    <path d="M68 30 C76 35 81 43 82 52" stroke="#ff5a3c" stroke-width="2.2" opacity=".4"/></g></g>
  <g class="kn"><rect x="49.5" y="12" width="5" height="12" fill="url(#rum-kl-krom)"/>
    <ellipse cx="52" cy="13" rx="10" ry="4" fill="#2a2724"/><ellipse cx="52" cy="11.5" rx="10" ry="4" fill="url(#rum-kl-krom)"/>
    <ellipse cx="49" cy="10.6" rx="4" ry="1.2" fill="#fff" opacity=".7"/></g>
  <g class="pl" fill="none" stroke="#f0d699" stroke-width="1.6" stroke-linecap="round"><path d="M28 10 q-6 -4 -8 -10"/><path d="M76 10 q6 -4 8 -10"/><path d="M18 20 q-8 -2 -12 -6"/><path d="M86 20 q8 -2 12 -6"/></g></svg>`;

  // Pingklockan plingar när gängets kupong tas i handen.
  function pling() {
    const b = document.querySelector('#rum-tag.rum-klocka');
    if (!b || calm()) return;
    b.classList.remove('pling');
    void b.offsetWidth;
    b.classList.add('pling');
  }

  function paper() {
    return '<a id="rum-kvitto" class="rum-flat rum-sak" href="#kupong" data-nav="kupong" aria-label="Kupong"></a>' +
      '<span id="rum-hogen"></span>' +
      '<a id="rum-kupong" class="rum-flat rum-kup rum-sak" href="#kupong" data-nav="kupong" aria-label="Kupong"></a>' +
      '<a class="rum-tag" href="#kupong" data-nav="kupong" id="rum-tag">Fyll i kupongen</a>';
  }

  // Röken som lagt sig under lysröret, och dammet som syns i ljuset.
  function haze() {
    return '<div class="rum-rok"><i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i></div>' +
      '<canvas class="rum-damm" id="rum-damm" width="800" height="500"></canvas>';
  }

  // ---------- filtren ----------
  //
  // Bruset (furun, fläckarna, smutsen på glaset, träet i pulten) och
  // oskärpan (skuggorna och skenet) räknas annars om i full upplösning,
  // förstorade som planen de står i, och ligger kvar i minnet – över en
  // gigabyte, så att sidan kraschade i telefonen. De ritas i stället en gång
  // var till en bild på samma ställe (filtrets ruta och samma brus), och står
  // dolda tills bilden är klar. Oskärpan behöver få bildpunkter. Utsikten
  // (rum-ute.js) ritas om hela tiden och har egna filter. SVG:n som ritar en
  // bild hämtas från en blob som släpps efteråt: en data-URL låg kvar i
  // Safaris cache med filtrens mellanbilder, ungefär 350 MB för hela rummet.
  // Bruset räknas ut här i stället (brus): samma brus som filtret, utan att
  // gå via en bild av SVG:n – Safari höll ändå kvar fyra–fem kopior av varje
  // bild, ungefär 350 MB för furun, väggen och pulten. Det blir också färre
  // bildpunkter där bruset är mjukt (som ådringen på höjden).
  // → när allt är bakat
  const BAKA = { 'rum-b1': 2, 'rum-b4': 2, 'rum-b10': 0.6, 'rum-b24': 0.5, 'rum-b40': 0.35, 'rum-grainwood': 2, 'rum-ved': 2, 'rum-flack': 2, 'rum-prick': 2, 'rum-grime': 2 };

  // feTurbulence som i SVG-specifikationen (samma slumptal, gitter och
  // oktaver som i webbläsaren): fn(kanal, x, y) → 0…1.
  function turbulens(seed, [fx, fy], oktaver, fraktal) {
    const BS = 256;
    const N = BS + BS + 2;
    let s = Math.trunc(seed);
    if (s <= 0) s = -(s % 2147483646) + 1;
    if (s > 2147483646) s = 2147483646;
    const rnd = () => {
      s = 16807 * (s % 127773) - 2836 * Math.floor(s / 127773);
      if (s <= 0) s += 2147483647;
      return s;
    };
    const lat = new Int32Array(N);
    const g = new Float64Array(4 * N * 2);
    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < BS; i++) {
        lat[i] = i;
        const o = (k * N + i) * 2;
        do {
          g[o] = ((rnd() % (BS + BS)) - BS) / BS;
          g[o + 1] = ((rnd() % (BS + BS)) - BS) / BS;
        } while (!g[o] && !g[o + 1]);
        const l = Math.hypot(g[o], g[o + 1]);
        g[o] /= l;
        g[o + 1] /= l;
      }
    }
    for (let i = BS - 1; i > 0; i--) {
      const k = lat[i];
      const j = rnd() % BS;
      lat[i] = lat[j];
      lat[j] = k;
    }
    for (let i = 0; i < BS + 2; i++) {
      lat[BS + i] = lat[i];
      for (let k = 0; k < 4; k++) g.copyWithin((k * N + BS + i) * 2, (k * N + i) * 2, (k * N + i) * 2 + 2);
    }
    const kurva = (t) => t * t * (3 - 2 * t);
    function noise(k, vx, vy) {
      const tx = vx + 4096;
      const ty = vy + 4096;
      const bx = Math.trunc(tx);
      const by = Math.trunc(ty);
      const rx = tx - bx;
      const ry = ty - by;
      const i = lat[bx & 255];
      const j = lat[(bx + 1) & 255];
      const b0 = by & 255;
      const b1 = (by + 1) & 255;
      const q = (n, x, y) => { const o = (k * N + n) * 2; return x * g[o] + y * g[o + 1]; };
      const sx = kurva(rx);
      const u0 = q(lat[i + b0], rx, ry);
      const a = u0 + sx * (q(lat[j + b0], rx - 1, ry) - u0);
      const u1 = q(lat[i + b1], rx, ry - 1);
      const b = u1 + sx * (q(lat[j + b1], rx - 1, ry - 1) - u1);
      return a + kurva(ry) * (b - a);
    }
    return (k, x, y) => {
      let sum = 0;
      let vx = x * fx;
      let vy = y * fy;
      for (let o = 0, r = 1; o < oktaver; o++, r *= 2, vx *= 2, vy *= 2) {
        const n = noise(k, vx, vy);
        sum += (fraktal ? n : Math.abs(n)) / r;
      }
      return Math.min(1, Math.max(0, fraktal ? sum * 0.5 + 0.5 : sum));
    };
  }

  // En PNG av bildpunkterna (RGBA, w × h) utan duk.
  const CRC = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c;
  });
  async function png(w, h, px) {
    const rad = w * 4 + 1;
    const raw = new Uint8Array(rad * h);
    for (let y = 0; y < h; y++) raw.set(px.subarray(y * w * 4, (y + 1) * w * 4), y * rad + 1);
    const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    const bit = (typ, data) => {
      const b = new Uint8Array(12 + data.length);
      const v = new DataView(b.buffer);
      v.setUint32(0, data.length);
      for (let i = 0; i < 4; i++) b[4 + i] = typ.charCodeAt(i);
      b.set(data, 8);
      let c = ~0;
      for (let i = 4; i < 8 + data.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
      v.setUint32(8 + data.length, ~c >>> 0);
      return b;
    };
    const hd = new Uint8Array(13);
    new DataView(hd.buffer).setUint32(0, w);
    new DataView(hd.buffer).setUint32(4, h);
    hd.set([8, 6], 8);
    return new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), bit('IHDR', hd), bit('IDAT', z), bit('IEND', new Uint8Array(0))], { type: 'image/png' });
  }

  // Ett brusfilter (feTurbulence och sedan feColorMatrix med fast färg och
  // alfa ur bruset) i rutan (x, y, w, h) → en PNG, eller null för andra filter.
  // Bildpunkterna räcker för brusets finaste oktav, högst 2 per px.
  async function brus(f, x, y, w, h) {
    const [t, m, ...rest] = f.children;
    if (rest.length || !t || !m || t.localName !== 'feTurbulence' || m.localName !== 'feColorMatrix' || !window.CompressionStream) return null;
    if ((m.getAttribute('type') || 'matrix') !== 'matrix' || t.getAttribute('stitchTiles') === 'stitch') return null;
    const v = (m.getAttribute('values') || '').trim().split(/[\s,]+/).map(Number);
    if (v.length !== 20 || [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13].some((i) => v[i])) return null;
    const bf = (t.getAttribute('baseFrequency') || '0').trim().split(/[\s,]+/).map(Number);
    const fq = [bf[0], bf.length > 1 ? bf[1] : bf[0]];
    const okt = parseInt(t.getAttribute('numOctaves') || '1', 10);
    const fn = turbulens(Number(t.getAttribute('seed') || 0), fq, okt, t.getAttribute('type') === 'fractalNoise');
    const [sx, sy] = fq.map((q) => Math.min(2, Math.max(0.25, q * 2 ** (okt - 1) * 5)));
    const cw = Math.max(1, Math.round(w * sx));
    const ch = Math.max(1, Math.round(h * sy));
    // färgen räknas i linearRGB om inget annat sägs, och visas i sRGB
    const lin = f.getAttribute('color-interpolation-filters') !== 'sRGB';
    const srgb = (c) => Math.round(255 * Math.min(1, Math.max(0, !lin ? c : c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)));
    const [r, gr, b] = [v[4], v[9], v[14]].map(srgb);
    const ka = [0, 1, 2, 3].filter((k) => v[15 + k]);
    const px = new Uint8Array(cw * ch * 4);
    for (let j = 0, o = 0; j < ch; j++) {
      const yy = y + ((j + 0.5) * h) / ch;
      for (let i = 0; i < cw; i++, o += 4) {
        const xx = x + ((i + 0.5) * w) / cw;
        let a = v[19];
        // som i filtret: bruset som 8 bitar
        for (const k of ka) a += v[15 + k] * (Math.round(fn(k, xx, yy) * 255) / 255);
        px[o] = r;
        px[o + 1] = gr;
        px[o + 2] = b;
        px[o + 3] = Math.round(255 * Math.min(1, Math.max(0, a)));
      }
    }
    return png(cw, ch, px);
  }

  // Oskärpan (ett feGaussianBlur) av en form i en enda färg: formen ritas
  // på en duk och suddas med tre lådfilter som i specifikationen, i rutan
  // (x, y, w, h) med s bildpunkter per px → en PNG, eller null.
  async function oskarpa(f, e, x, y, w, h, s) {
    const [g, ...rest] = f.children;
    if (rest.length || !g || g.localName !== 'feGaussianBlur' || (g.getAttribute('in') || 'SourceGraphic') !== 'SourceGraphic' || !window.CompressionStream) return null;
    const cs = getComputedStyle(e);
    const farg = (p) => (p && p !== 'none' && /^rgba?\(/.test(p) ? p : null);
    const fill = farg(cs.fill);
    const stroke = farg(cs.stroke) && parseFloat(cs.strokeWidth) > 0 ? cs.stroke : null;
    if ((cs.fill !== 'none' && !fill) || (cs.stroke !== 'none' && !farg(cs.stroke)) || (fill && stroke) || !(fill || stroke)) return null;
    const num = (a) => parseFloat(e.getAttribute(a)) || 0;
    const p = new Path2D();
    switch (e.localName) {
      case 'ellipse': p.ellipse(num('cx'), num('cy'), num('rx'), num('ry'), 0, 0, 2 * Math.PI); break;
      case 'circle': p.arc(num('cx'), num('cy'), num('r'), 0, 2 * Math.PI); break;
      case 'rect': if (p.roundRect && num('rx')) p.roundRect(num('x'), num('y'), num('width'), num('height'), num('rx')); else p.rect(num('x'), num('y'), num('width'), num('height')); break;
      case 'path': p.addPath(new Path2D(e.getAttribute('d'))); break;
      case 'line': p.moveTo(num('x1'), num('y1')); p.lineTo(num('x2'), num('y2')); break;
      case 'polygon': case 'polyline': {
        const v = (e.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
        for (let i = 0; i + 1 < v.length; i += 2) (i ? p.lineTo : p.moveTo).call(p, v[i], v[i + 1]);
        if (e.localName === 'polygon') p.closePath();
        break;
      }
      default: return null;
    }
    const cw = Math.max(1, Math.round(w * s));
    const ch = Math.max(1, Math.round(h * s));
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const k = c.getContext('2d', { willReadFrequently: true });
    k.setTransform(cw / w, 0, 0, ch / h, (-x * cw) / w, (-y * ch) / h);
    k.fillStyle = k.strokeStyle = '#fff';
    if (fill) {
      k.globalAlpha = parseFloat(cs.fillOpacity);
      k.fill(p, cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero');
    } else {
      k.globalAlpha = parseFloat(cs.strokeOpacity);
      k.lineWidth = parseFloat(cs.strokeWidth);
      k.lineCap = cs.strokeLinecap;
      k.lineJoin = cs.strokeLinejoin;
      k.stroke(p);
    }
    const d = k.getImageData(0, 0, cw, ch).data;
    c.width = c.height = 0;
    let a = new Float32Array(cw * ch);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
    const sd = (g.getAttribute('stdDeviation') || '0').trim().split(/[\s,]+/).map(Number);
    a = sudda(a, cw, ch, sd[0] * (cw / w), 1);
    a = sudda(a, ch, cw, (sd.length > 1 ? sd[1] : sd[0]) * (ch / h), cw);
    const [r, gr, b] = (fill || stroke).match(/[\d.]+/g).map(Number);
    const px = new Uint8Array(cw * ch * 4);
    for (let i = 0, o = 0; i < a.length; i++, o += 4) {
      px[o] = r;
      px[o + 1] = gr;
      px[o + 2] = b;
      px[o + 3] = Math.round(Math.min(255, a[i]));
    }
    return png(cw, ch, px);
  }

  // Gaussisk oskärpa längs en led (n punkter per rad, steg st mellan dem):
  // tre lådfilter (d enligt specifikationen) eller, för små σ, en riktig kärna.
  function sudda(a, n, rader, sigma, st) {
    if (!(sigma > 0)) return a;
    const ut = new Float32Array(a.length);
    const rad = st === 1 ? (r) => r * n : (r) => r;
    const steg = st === 1 ? 1 : st;
    const buf = new Float32Array(n);
    const tmp = new Float32Array(n);
    // en låda av storleken d, med centrum förskjutet off (−1, 0 eller +1 halv)
    const lada = (src, dst, dd, off) => {
      const lo = Math.floor((dd - 1) / 2) + (off < 0 ? 1 : 0);
      const v = dd - 1 - lo;
      let sum = 0;
      for (let i = -lo; i <= v; i++) if (i >= 0 && i < n) sum += src[i];
      for (let i = 0; i < n; i++) {
        dst[i] = sum / dd;
        const ut0 = i - lo;
        const in1 = i + v + 1;
        if (ut0 >= 0 && ut0 < n) sum -= src[ut0];
        if (in1 >= 0 && in1 < n) sum += src[in1];
      }
    };
    let kern = null;
    let dd = 0;
    if (sigma < 2) {
      const r = Math.ceil(sigma * 3);
      kern = new Float32Array(r * 2 + 1);
      let t = 0;
      for (let i = -r; i <= r; i++) t += kern[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
      for (let i = 0; i < kern.length; i++) kern[i] /= t;
    } else dd = Math.floor((sigma * 3 * Math.sqrt(2 * Math.PI)) / 4 + 0.5);
    for (let r = 0; r < rader; r++) {
      const b0 = rad(r);
      for (let i = 0; i < n; i++) buf[i] = a[b0 + i * steg];
      if (kern) {
        const R2 = (kern.length - 1) / 2;
        for (let i = 0; i < n; i++) {
          let s = 0;
          for (let j = -R2; j <= R2; j++) if (i + j >= 0 && i + j < n) s += buf[i + j] * kern[j + R2];
          tmp[i] = s;
        }
        buf.set(tmp);
      } else if (dd % 2) {
        lada(buf, tmp, dd, 0); lada(tmp, buf, dd, 0); lada(buf, tmp, dd, 0); buf.set(tmp);
      } else {
        lada(buf, tmp, dd, -1); lada(tmp, buf, dd, 1); lada(buf, tmp, dd + 1, 0); buf.set(tmp);
      }
      for (let i = 0; i < n; i++) ut[b0 + i * steg] = buf[i];
    }
    return ut;
  }

  function baka() {
    const ns = 'http://www.w3.org/2000/svg';
    const idOf = (e) => (/^url\(#([\w-]+)\)$/.exec(e.getAttribute('filter')) || [])[1];
    const els = [...R.el.querySelectorAll('svg [filter]')].filter((e) => BAKA[idOf(e)]);
    if (!els.length) return Promise.resolve();
    for (const e of els) e.setAttribute('visibility', 'hidden');
    // elementens rutor mäts i en osynlig SVG utanför rummet (det är dolt än)
    const mat = document.createElementNS(ns, 'svg');
    mat.setAttribute('style', 'position: absolute; left: -9999px; top: 0; width: 10px; height: 10px; visibility: hidden');
    document.body.append(mat);
    const xs = new XMLSerializer();
    // bilderna byts in på en gång, så att varje lager ritas om en gång
    const byt = [];
    return (async () => {
      for (const e of els) {
        const id = idOf(e);
        const f = R.el.querySelector(`filter#${id}`);
        const k = e.cloneNode(true);
        for (const a of ['filter', 'transform', 'visibility', 'opacity', 'class', 'clip-path', 'style']) k.removeAttribute(a);
        mat.append(k);
        const b = k.getBBox();
        k.remove();
        let src = '';
        const img = new Image();
        try {
          if (!f || !b.width || !b.height) throw new Error('ingen ruta');
          // filtrets ruta i andelar av elementets (objectBoundingBox)
          const del = (a, d) => { const v = f.getAttribute(a); return v == null ? d : parseFloat(v) / (v.endsWith('%') ? 100 : 1); };
          const x = b.x + del('x', -0.1) * b.width;
          const y = b.y + del('y', -0.1) * b.height;
          const w = del('width', 1.2) * b.width;
          const h = del('height', 1.2) * b.height;
          let blob = (await brus(f, x, y, w, h)) || (await oskarpa(f, e, x, y, w, h, BAKA[id]));
          if (!blob) {
            const cw = Math.max(1, Math.round(w * BAKA[id]));
            const ch = Math.max(1, Math.round(h * BAKA[id]));
            k.setAttribute('filter', `url(#${id})`);
            src = URL.createObjectURL(new Blob([`<svg xmlns="${ns}" width="${cw}" height="${ch}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="none">${DEFS}${xs.serializeToString(k)}</svg>`], { type: 'image/svg+xml' }));
            img.src = src;
            await img.decode();
            const c = document.createElement('canvas');
            c.width = cw;
            c.height = ch;
            c.getContext('2d').drawImage(img, 0, 0, cw, ch);
            img.src = '';
            URL.revokeObjectURL(src);
            src = '';
            blob = await new Promise((r) => c.toBlob(r, 'image/png'));
            c.width = c.height = 0;
          }
          if (!blob) throw new Error('ingen bild');
          const im = document.createElementNS(ns, 'image');
          for (const [a, v] of [['href', URL.createObjectURL(blob)], ['x', x], ['y', y], ['width', w], ['height', h], ['preserveAspectRatio', 'none']]) im.setAttribute(a, v);
          for (const a of ['opacity', 'class', 'transform', 'clip-path', 'style']) if (e.hasAttribute(a)) im.setAttribute(a, e.getAttribute(a));
          byt.push([e, im]);
        } catch {
          // går det inte står filtret kvar som förut
          e.removeAttribute('visibility');
          if (src) {
            img.src = '';
            URL.revokeObjectURL(src);
          }
        }
      }
      mat.remove();
      for (const [e, im] of byt) e.replaceWith(im);
    })();
  }

  function build() {
    const el = document.createElement('section');
    el.id = 'rum-section';
    // Chromium (navigator.userAgentData) ritar lagren på ett eget sätt när
    // kameran går fram (.chromium i rum.css); Safari behöver det inte
    el.className = navigator.userAgentData ? 'rum chromium' : 'rum';
    el.hidden = true;
    el.setAttribute('aria-label', 'Tobaksaffären');
    el.innerHTML = `<div class="rum-stage" id="rum-stage"><div class="rum-kamera" id="rum-kamera"><div class="rum-world" id="rum-world">
${plane(-600, `<div class="rum-ute" id="rum-ute"></div>${bg()}${vid('vagg')}${rightWall()}${window.RumRegister ? RumRegister.html() : ''}${svg('<g id="rum-hyllor"></g>', '', [1130, 170, 200, 140])}${neon()}${frameHtml()}`, 1.035)}
${plane(-598, vid('horn'), 1.035, 'rum-pl3d')}
${plane(-470, `${tv()}`, 1.02, 'rum-pl3d')}
${plane(-330, `${sill()}${haze()}`)}
${plane(-60, `${table()}${vid('pult')}`, 1.05)}
${plane(0, paper())}
</div></div>
<div class="rum-layer rum-mork" id="rum-mork"><i class="a"></i><i class="b"></i></div>
<div class="rum-layer rum-warm"></div><div class="rum-layer rum-dagsljus" id="rum-dagsljus"></div><div class="rum-layer rum-vign"></div><div class="rum-layer rum-grain"></div>
</div>
${window.RumAnslag ? RumAnslag.nara() : ''}
${window.RumRegister ? RumRegister.nara() : ''}
<div class="rum-hdr"><a class="rum-brand" href="#">Matchfixarna</a></div>
<div class="rum-ft"><span class="keys"><b>K</b> kupongen · <b>T</b> tv:n · <b>A</b> anslagstavlan · <b>R</b> kortregistret · <b>V</b> videon</span><a href="#hem">Vanlig sida</a></div>`;
    document.querySelector('main').prepend(el);
    R.el = el;
    R.built = true;
    wire();
    // kort: högst elva tecken
    R.tv = window.RumTv ? RumTv.mount(el, { calm, short, kort: (n) => BOARD[n] || short(n), wd, hm, matches: () => (state.all && state.all.matches) || [] }) : null;
    R.ans = window.RumAnslag ? RumAnslag.mount(el, { calm, kort: (n) => BOARD[n] || short(n), close: () => board(false) }) : null;
    R.video = window.RumVideo ? RumVideo.mount(el, { calm, short, kort: (n) => BOARD[n] || short(n), aim: (f) => { R.vf = f; aimVideo(calm() ? null : 'glid'); } }) : null;
    R.reg = window.RumRegister ? RumRegister.mount(el, { calm, kort: (n) => BOARD[n] || short(n), close: () => register(false), tur: (fn) => tur(fn, 3) }) : null;
    paintUte();
    R.bakat = baka();
    // gatan syns genom fönstret och dörren, och gänget och röken står i
    // dukens vänstra del (utsikten och duken är större än det de visar)
    const ute = syn(el.querySelector('#rum-ute'), DORR.x, WIN.y, WIN.x + WIN.w - DORR.x, DORR.y + DORR.h - WIN.y);
    R.gang = syn(el.querySelector('#rum-3d').parentElement, 160, 120, 860, 560);
    for (const x of [ute, R.gang, el.querySelector('#rum-damm')]) sikt(x);
  }

  // en osynlig ruta som sikt följer i stället för något större (först, så
  // att den inte blir ett eget lager)
  function syn(i, x, y, b, h) {
    const e = document.createElement('i');
    e.className = 'rum-syn';
    Object.assign(e.style, { left: `${x}px`, top: `${y}px`, width: `${b}px`, height: `${h}px` });
    i.prepend(e);
    return e;
  }

  // Det som inte syns – utanför fönstret, eller när kameran står nära något
  // annat – ritas inte: gänget, sakerna och dammet ritas bara när deras duk
  // syns (de står kvar som de var), och gatan utanför står still när
  // fönstret och dörren inte syns (.vila i rum-ute.css).
  function sikt(x) {
    if (!x || !window.IntersectionObserver) return;
    if (!R.sikt) {
      R.sikt = new IntersectionObserver((list) => {
        for (const e of list) {
          if (e.isIntersecting) R.dold.delete(e.target);
          else R.dold.add(e.target);
          if (e.target.parentElement.id === 'rum-ute') e.target.parentElement.classList.toggle('vila', !e.isIntersecting && !still());
        }
      });
    }
    R.sikt.observe(x);
  }
  // (utan rörelser ritas bara en bild då och då, och den ska ha allt)
  const syns = (x) => calm() || !R.dold.has(x);

  // ---------- datan ----------

  // Kortare lagnamn på papperet och skårtavlan.
  const SHORT = { 'Manchester City': 'Man City', 'Manchester United': 'Man Utd', 'Tottenham Hotspur': 'Tottenham', 'Brighton & Hove Albion': 'Brighton',
    'Wolverhampton Wanderers': 'Wolves', 'West Bromwich Albion': 'West Brom', 'Queens Park Rangers': 'QPR', 'Nottingham Forest': "Nott'm Forest",
    'AFC Bournemouth': 'Bournemouth', 'Preston North End': 'Preston', 'Sheffield Wednesday': 'Sheff Wed', 'Sheffield United': 'Sheff Utd' };
  const short = (name) => SHORT[name] || String(name || '').replace(/\s+(United|City|Town|Rovers|Athletic|County|Wanderers|Albion|Argyle|Hotspur)$/, '');
  // På text-tv:n när lagen inte ryms: högst elva tecken.
  const BOARD = { 'Nottingham Forest': 'Nottingham', 'Middlesbrough': 'Middlesbro', 'Crystal Palace': 'Palace', 'Huddersfield Town': 'Huddersfld',
    'Peterborough United': "P'borough", 'Leyton Orient': 'Orient', 'Milton Keynes Dons': 'MK Dons', 'AFC Wimbledon': 'Wimbledon',
    'Bristol City': 'Bristol C', 'Bristol Rovers': 'Bristol R', 'Accrington Stanley': 'Accrington' };

  const fWd = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short' });
  const fHm = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
  const wd = (d) => fWd.format(d).replace('.', '').slice(0, 3);
  const hm = (d) => fHm.format(d).replace(':', '.');

  // Omgången som gänget tippar (GET …/samtal: samtal.js, som rummet läser om
  // varje minut, annars TP.round), annars omgångens kupong (kupong.js):
  // matcherna efter avspark.
  function round() {
    const p = window.Samtal && Samtal.pult ? Samtal.pult.state() : null;
    const r = p ? p.s : typeof TP !== 'undefined' ? TP.round : null;
    if (r && r.matcher && r.matcher.length) {
      return { id: r.id, ids: r.matcher.map((x) => String(x.id)), gang: r.gang || [], name: r.namn || (window.Samtal && Samtal.name ? Samtal.name() : null), spel: Boolean(r.spel) };
    }
    const c = typeof currentCoupon === 'function' ? currentCoupon() : null;
    if (c) return { ids: c.matches.map((x) => String(x.id)), gang: [], name: c.name || null, coupon: c, spel: Boolean(c.spel) };
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
  const crossSvg = (key, kula = false) => `<svg class="kryss${kula ? ' kula' : ''}" viewBox="0 0 40 19" preserveAspectRatio="none" aria-hidden="true">${strokes(key).map((s) => `<path d="${s.d}" pathLength="1"/>`).join('')}</svg>`;

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
  // kupongens mått (rum.css), bred och smal (.rum.smal, i telefonen på höjden),
  // och pennan på pulten och i handen på dem (fit)
  const KUP = { bred: [660, 470], smal: [420, 620] };
  const PENNOR = { bred: [{ x: 276.4, y: 340.6, a: -11 }, { x: 362, y: 440, a: -6 }], smal: [{ x: 196, y: 420, a: -11 }, { x: 268, y: 612, a: -2 }] };
  const PEN_PULT = { ...PENNOR.bred[0] };
  const PEN_VILA = { ...PENNOR.bred[1] };
  const PEN_SKRIV = -38;
  const penStyle = (p) => { const s = penAt(p); return `transform: ${s.transform}; filter: ${s.filter}`; };

  // Kupongen på pulten och i handen: samma kupong som papperet under Kupong
  // (samtal.js), i kupongens mått. Bandet, under det stämpeln (vem omgången
  // väntar på) och spelstoppet, porträtten och 1 X 2 överst, en rad per match
  // med synkmarkeringen i kanten och fälten och streckkoden i foten. v säger
  // vems kupong det är (view): utan v gängets kryss om kupongen finns.
  //   fyll  ditt utkast: dina kryss och motiveringar, ditt porträtt inringat
  //   din   din inlämnade kupong, med stämpeln Inlämnad
  //   las   någon annans inlämnade kupong, med hens porträtt inringat
  //   gang  gängets kupong i uppgörelsen: gängets kryss med kulspetspenna och
  //         i rutorna porträtten för dem som har med tecknet, som på papperet
  // Motiveringen står för hand med blyerts efter tiden, kommentaren i
  // efterhand i bläck efter den (som pennan på papperet). Utfallet ringas in:
  // grönt när kupongen hade det, annars rött, streckat medan matchen pågår.
  // hand: kupongen i handen, där rutorna, porträtten för dem du kan vara och
  // pennorna är knappar och fält – på din kupong och gängets så länge de går
  // att ändra.
  function couponHtml(rd, rows, v = null, hand = false) {
    const nr = rd && !rd.next && typeof couponNumber === 'function' && rd.ids.length ? couponNumber(rd.ids) : null;
    const first = rows.length ? Math.min(...rows.map((x) => Date.parse(x.m.kickoff))) : null;
    const order = rd ? rd.ids.map((id) => rows.find((x) => x.id === id)).filter(Boolean) : rows;
    const slag = v ? v.slag : null;
    const signs = Object.fromEntries(order.map((x) => [x.id, (v ? v.tecken[x.id] : x.sign) || '']));
    // gängets kryss med kulspetspenna, var och ens med blyerts
    const kula = !v || slag === 'gang';
    const gang = (KP.data && KP.data.samtal && KP.data.samtal.gang) || [];
    const ink = v && v.vem ? Math.max(0, gang.findIndex((g) => g.id === v.vem)) : 0;
    const now = Date.now();
    const list = order.map((x, i) => {
      const sign = signs[x.id];
      const comp = compOf(x.m.comp);
      const started = !(Date.parse(x.m.kickoff) > now);
      // i handen står matcher som har startat kvar som de var, som på papperet
      const edit = hand && !started && (slag === 'fyll' || slag === 'din' || slag === 'gang');
      const locked = hand && started && (slag === 'fyll' || slag === 'din');
      const res = x.g && x.g.res != null ? x.g.res : null;
      const ring = res == null ? '' : x.g.state === 'live' ? ' live' : sign.includes(SIGNS[res]) ? ' ok' : ' no';
      const label = `${x.m.home} – ${x.m.away}`;
      const box = (s, j) => {
        const on = sign.includes(s);
        const inner = `<i>${s}</i>${slag === 'gang' ? seats(v, x.id, j) : ''}${on ? crossSvg(`${x.id}${s}`, kula) : ''}` +
          (res === j ? Papper.ring(`${x.id}${s}`, `rum-ring${ring}`, 25) : '');
        return edit
          ? `<button type="button" class="box${on ? ' x' : ''}" data-s="${s}" aria-pressed="${on}" aria-label="${esc(`${label}: ${s}`)}">${inner}</button>`
          : `<span class="box${on ? ' x' : ''}">${inner}</span>`;
      };
      return `<div class="row${sign ? '' : ' tom'}${locked ? ' locked' : ''}" data-id="${esc(x.id)}"><span class="pp-nr">${i + 1}</span>` +
        `<span class="m"><span class="pp-tm">${esc(x.m.home)}<span class="vs"> – </span>${esc(x.m.away)}</span>` +
        `<span class="pp-small">${esc(fWeekdayTime.format(new Date(x.m.kickoff)))}${comp ? ` · ${esc(comp.short)}` : ''}${locked ? ' · har startat' : ''}</span>` +
        notes(v, x.id, label, { sign, started, hand, ink }) + '</span>' +
        SIGNS.map(box).join('') + '</div>';
    }).join('');
    const p = v ? pult(rd) : null;
    const top = p ? Samtal.pult.top(hand && slag === 'fyll' && p.fyll, slag === 'las' ? v.vem : null) : null;
    const id = rd && !rd.next ? rd.id || (rd.coupon && rd.coupon.id) : null;
    return `<span class="band"><small>MATCHFIXARNA · TIPSKUPONG</small><b>${nr ? `Kupong ${nr}` : 'Kupong'}</b></span>` +
      `<span class="topp">${top ? top.stamp : ''}<span class="pp-stop"><span>Spelstopp</span><b>${first ? esc(fWeekdayTime.format(new Date(first))) : '–'}</b></span></span>` +
      `<span class="hd"><span>Nr</span><span class="m">${top && top.vem && slag === 'fyll' ? '<span class="sm-q">Vem är du?</span>' : '<span>Match</span>'}` +
      `${top ? `<span class="sm-folk-pp">${top.faces}</span>` : ''}</span><span>1</span><span>X</span><span>2</span></span>${list}` +
      `<span class="fot">${v ? Samtal.pult.fields(signs, slag === 'gang') : ''}${id ? Papper.code(id) : ''}</span>` +
      (slag === 'din' || slag === 'las' ? '<span class="stampel">Inlämnad</span>' : '') +
      `<span class="pencil${slag === 'gang' || (!v && order.some((x) => x.sign)) ? ' kula' : ''}" style="${penStyle(PEN_PULT)}"><i></i></span>`;
  }

  // Pennan i ett fält: samma penna som på papperet under Kupong.
  const PEN = '<svg class="sm-pen" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6 2.9l2.5 2.5-7.6 7.6-3.2.7.7-3.2z"/><path d="M9 4.5l2.5 2.5"/></svg>';
  const field = (kind, id, text, label, cls = '') => `<label class="pen pen-${kind}${cls}">${PEN}` +
    `<input type="text" class="pen-in" data-${kind === 'mot' ? 'not' : 'efter'}="${esc(id)}" maxlength="${NOTE_MAX}" autocomplete="off" enterkeyhint="done" placeholder=" "` +
    ` aria-label="${esc(`${kind === 'mot' ? 'Motivering för' : 'Kommentar till'} ${label}`)}" value="${esc(text)}"></label>`;

  // Det som står för hand efter tiden: motiveringen och kommentaren i
  // efterhand – i handen som fält där du kan skriva. Pennan för motiveringen
  // kommer när matchen är tippad, men platsen står där ändå, så att ingenting
  // flyttar sig. Kommentaren i efterhand skrivs när matchen har startat (före
  // det bara om du redan har skrivit något), som på papperet.
  function notes(v, id, label, { sign, started, hand, ink }) {
    if (!v) return '';
    const mot = (v.not && v.not[id]) || '';
    const eft = (v.efter && v.efter[id]) || '';
    const k = ` sm-k${ink}`;
    let html = '';
    if (hand && !started && (v.slag === 'fyll' || v.slag === 'din')) html += field('mot', id, mot, label, sign || mot ? '' : ' gom');
    else if (mot) html += `<span class="mot" title="${esc(mot)}">${esc(mot)}</span>`;
    if (hand && v.skriv && (v.slag === 'din' || v.slag === 'gang') && (started || eft)) html += field('eft', id, eft, label, k);
    else if (eft && v.slag !== 'gang') html += `<span class="eft${k}" title="${esc(eft)}">${esc(eft)}</span>`;
    return html ? `<span class="not">${html}</span>` : '';
  }

  // Uppgörelsen: porträtten för dem som har med tecknet, var och en på sin
  // plats i rutan (samma ordning som överst), och motiveringen när man pekar.
  function seats(v, id, j) {
    const gang = (KP.data && KP.data.samtal && KP.data.samtal.gang) || [];
    const who = (v.who && v.who[id] && v.who[id][j]) || [];
    return '<span class="sits">' + gang.map((g, i) => {
      if (!who.includes(g.id)) return '<b></b>';
      const note = v.notes && v.notes[id] && v.notes[id][g.id];
      const src = photoOf(g.id);
      return `<b class="sm-k${i}" title="${esc(`${g.id}${note ? `: ${note}` : ''}`)}">${src ? `<img src="${esc(src)}" alt="" draggable="false">` : ''}</b>`;
    }).join('') + '</span>';
  }

  // Vad kupongen visar (couponHtml) ur Samtal.pult: slag och vems.
  function view(p, slag, vem = null) {
    if (!p) return null;
    if (slag === 'fyll') return { slag, vem: p.vem, tecken: p.tecken, not: p.kommentarer, efter: {} };
    if (slag === 'gang') {
      const g = Samtal.pult.gang();
      return g && { slag, vem: p.vem, tecken: g.val, who: g.who, notes: g.notes, efter: p.efter, skriv: Boolean(p.skriv), g };
    }
    const t = Samtal.pult.tips(vem);
    return t && { slag, vem, tecken: t.tecken, not: t.kommentarer, efter: t.efter, skriv: slag === 'din' && p.skriv === vem };
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
      // din tas alltid i handen, de andras när du ser deras tips
      const du = Boolean(p && p.vem === g.id);
      const ta = du || Boolean(p && p.se.includes(g.id));
      const label = du ? `Din kupong (${g.id}), inlämnad${p.andra ? ' – ändra' : ''}` : ta ? `${g.id}:s kupong, inlämnad` : `${g.id}:s kupong, inlämnad – syns när du har lämnat in`;
      return `<a class="rum-flat rum-bak rum-sak" href="#kupong" data-nav="kupong" data-vem="${esc(g.id)}" data-i="${i}"${ta ? ' data-ta' : ''}` +
        ` style="transform: ${restAt(slot(i))}" aria-label="${esc(label)}"${ta ? '' : ` title="${esc(label)}"`}>${backHtml(g.id, gang.findIndex((x) => x.id === g.id))}</a>`;
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

  // Skårtavlan: en plastbokstav per tecken, var och en lite sned i sitt
  // spår (samma frö varje gång, så att inget flyttar sig när tavlan fylls
  // om). Lådan har fyra O – sedan får det bli nollor.
  function skarHtml(T) {
    const R0 = rng(31);
    let o = 4;
    const ch = (c) => {
      if (c === ' ') return '<b class="sp"></b>';
      if (c === 'O' && o-- <= 0) c = '0';
      return `<b style="transform: translateY(${r1((R0() - 0.5) * 0.9)}px) rotate(${r1((R0() - 0.5) * 7)}deg)">${esc(c)}</b>`;
    };
    const word = (t) => [...String(t).toUpperCase()].map(ch).join('');
    const rows = ((T && T.teams) || []).slice().sort((a, b) => a.rank - b.rank).slice(0, 9);
    if (!rows.length) return `<span class="h">${word('Dagens tabell')}</span><span class="tom">${word('Kommer')}</span>`;
    return `<span class="h">${word((T && T.name) || 'Tabellen')}</span>` +
      rows.map((x) => `<span class="rad"><span>${word(`${x.rank}. ${short(x.name)}`)}</span><span>${word(x.pts)}</span></span>`).join('');
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

  // Allt som hämtas: omgången, tabellen, säsongens omgångar och kupongerna.
  async function load() {
    await Promise.all([whenMatches(), loadCoupons()]);
    await Promise.all([
      typeof tpLoad === 'function' ? tpLoad() : null,
      // omgången som kupongen på pulten och högen visar (samtal.js)
      window.Samtal && Samtal.load ? Samtal.load() : null,
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
    const nr = rd && !rd.next && rd.ids.length && typeof couponNumber === 'function' ? couponNumber(rd.ids) : null;
    const set = (id, html) => { const e = document.getElementById(id); if (e && e.innerHTML !== html) e.innerHTML = html; };
    // tv:n: Stryktipsets ordning (spel) om omgången är Stryktipset, och next
    // mellan omgångarna, när raderna bara är de närmaste matcherna
    if (R.tv) R.tv.fill(rows, { spel: rd && rd.spel ? rd.ids : null, next: Boolean(rd && rd.next) });
    if (R.ans) R.ans.fill(rows.map((x) => x.m), (state.all && state.all.matches) || []);
    if (R.reg) R.reg.fill(rows.map((x) => x.m), (state.all && state.all.matches) || []);
    if (R.video) R.video.fill((state.all && state.all.matches) || [], rd && !rd.next ? rd.ids : []);
    const p = pult(rd);
    // har du lämnat in ligger din kupong i högen, och på pulten en ny – eller
    // gängets kupong, när du ser de andras tips (uppgörelsen)
    set('rum-kupong', couponHtml(rd, rows, p && p.gang ? view(p, 'gang') : p && !p.inne ? view(p, 'fyll') : null));
    pile(rd, p);
    set('rum-kvitto', receiptHtml(rd, nr));
    // gänget på fönsterbänken: den som inte har lämnat in sitter med kupongen
    R.vem = vemInne(rd, rows, t, p);
    if (R.fig && R.fig.inne) R.fig.inne(R.vem, now());
    gangTv(rd, rows, t, p);
    const started = rows.length && Math.min(...rows.map((x) => Date.parse(x.m.kickoff))) <= t;
    const tag = document.getElementById('rum-tag');
    if (tag) {
      const go = p ? p.go : started ? 'Följ kupongen' : 'Fyll i kupongen';
      // till uppgörelsen står pingklockan där i stället för guldordet
      if (tag.dataset.go !== go) {
        const klocka = go === 'Till uppgörelsen';
        tag.dataset.go = go;
        tag.className = klocka ? 'rum-tag rum-klocka' : 'rum-tag';
        if (klocka) {
          tag.innerHTML = bell();
          tag.setAttribute('aria-label', go);
          tag.title = go;
        } else {
          tag.textContent = go;
          tag.removeAttribute('aria-label');
          tag.removeAttribute('title');
        }
      }
      tag.hidden = !go;
    }
    set('rum-skar', skarHtml(R.table));
    const seen = ((TP.season && TP.season.rounds) || []).filter((r) => typeof tpRoundHidden !== 'function' || !tpRoundHidden(r));
    set('rum-kork', corkHtml((R.old || []).filter((c) => c.n && !(window.Historik && Historik.hidden(c)))));
    const cups = seen.slice().sort((a, b) => String(a.from).localeCompare(String(b.from)))
      .flatMap((r) => (r.people || []).filter((p) => p.award === 'best').map((p) => GANG[p.id] || '#d8b06a'));
    const hy = document.getElementById('rum-hyllor');
    const hs = shelves(cups);
    if (hy && R.hy !== hs) { hy.innerHTML = hs; R.hy = hs; }
    // oraklet som regerar, med hela efternamnet på skylten; scenen ritas om
    // bara när oraklet byts, så att strålarna inte börjar om
    const { best } = Kronan.holders(seen);
    const scene = Kronan.scene('orakel', best, 'ram');
    const bild = document.getElementById('rum-ram-bild');
    if (bild && R.ram !== scene) { bild.innerHTML = scene; R.ram = scene; }
    // namnet står på mässingsskylten (rum-inredning.js)
    R.ramNamn = Kronan.names(best);
    if (R.inr) R.inr.namn(R.ramNamn);
  }

  // Vem som har lämnat in, för figurerna (rum-3d.js): bara en omgång som inte
  // har börjat väntar på någon, och din egen inlämning på pulten räknas
  // direkt. ?rum-vantar=DL,DT låter dem vänta ändå (och ?rum-tittar inte).
  function vemInne(rd, rows, t, p) {
    const open = !R.q.has('rum-tittar') && rd && !rd.next && rows.length && Math.min(...rows.map((x) => Date.parse(x.m.kickoff))) > t;
    const vem = {};
    for (const g of (rd && rd.gang) || []) vem[g.id.toLowerCase()] = !open || Boolean(g.inne) || Boolean(p && p.inne && p.vem === g.id);
    for (const id of (R.q.get('rum-vantar') || '').split(',')) if (id.trim()) vem[id.trim().toLowerCase()] = false;
    return vem;
  }

  // Gänget och matcherna (rum-3d.js): tv:n när någon match pågår (också med
  // dolda resultat), nag när omgången väntar på någon – från ett dygn före
  // spelstoppet och 1 den sista timmen – och ett mål när ställningen ändras
  // medan rummet står öppet: för var och en 1 när tipset blev rätt, −1 när det
  // blev fel och 0 annars, efter ens eget tips när det syns (annars gängets
  // kupong). Dolda resultat ger inga mål.
  function gangTv(rd, rows, t, p) {
    const q = R.q;
    const soon = (x) => t - x.g.kick < 2.5 * 3600000;
    const tv = q.has('rum-tittar') || rows.some((x) => x.g.state === 'live' || ((x.g.state === 'started' || (x.g.state === 'hidden' && !x.g.over)) && soon(x)));
    const first = rows.length ? Math.min(...rows.map((x) => Date.parse(x.m.kickoff))) : 0;
    const h = q.has('rum-stopp') ? parseFloat(q.get('rum-stopp')) : (first - t) / 3600000;
    const nag = !rd || rd.next || !(h > 0) || h > 24 ? 0 : h <= 1 ? 1 : 0.25 + (0.6 * (24 - h)) / 23;
    R.lage = { tv, nag };
    if (R.fig && R.fig.lage) R.fig.lage(R.lage, now());
    // målen: ställningen mot förra gången (första gången inga)
    const s = p && p.s;
    const res = (sc) => SIGNS[signIdx(sc)];
    const gang = rd && rd.gang && rd.gang.length ? rd.gang : ['DL', 'DT', 'DJ'].map((id) => ({ id }));
    const was = R.ss || {};
    const sum = {};
    R.ss = {};
    for (const x of rows) {
      if (x.g.state !== 'live' || !x.g.score) continue;
      const sc = x.g.score;
      R.ss[x.id] = sc;
      const w = was[x.id];
      if (!w || (w.home === sc.home && w.away === sc.away)) continue;
      for (const g of gang) {
        const own = s && s.tips && s.tips[g.id] ? s.tips[g.id].tecken[x.id] : p && p.inne && p.vem === g.id ? p.tecken[x.id] : null;
        const sign = own || x.sign || '';
        sum[g.id] = (sum[g.id] || 0) + (sign ? Number(sign.includes(res(sc))) - Number(sign.includes(res(w))) : 0);
      }
    }
    if (Object.keys(sum).length && R.fig && R.fig.mal) R.fig.mal(sum, now());
  }

  // ?rum-mal=dl:1,dt:-1,dj:0: ett mål för bilder – vid tiden 0 med ?rum-t,
  // annars genast och sedan var femtonde sekund.
  function provMal() {
    const v = R.q.get('rum-mal');
    if (!v || !R.fig || !R.fig.mal) return;
    const m = {};
    for (const x of v.split(',')) {
      const r = /^(\w+):(-?1|0)$/.exec(x.trim());
      if (r) m[r[1]] = Number(r[2]);
    }
    const go = () => R.fig.mal(m, still() ? 0 : now());
    go();
    if (!still()) setInterval(() => { if (R.on) go(); }, 15000);
  }

  // ---------- rörelsen ----------

  // Vridningen sätts som transform direkt på #rum-world, inte som
  // CSS-variabler: variabler ärvs av varje element i rummet, så Chrome
  // räknade om stilen för hela rummet och målade om allt i varje bildruta
  // medan musen rörde sig – och hann inte rita det, så att väggen, bänken
  // och pulten blinkade svart.
  function setCam(mx, my) {
    const w = document.getElementById('rum-world');
    if (!w) return;
    w.style.transform = `translateZ(-330px) rotateX(${(-my * 2.6).toFixed(3)}deg) rotateY(${(mx * 4.5).toFixed(3)}deg) translateZ(330px)`;
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
    // med fingret vrids kameran efter var i rummet man står (pan)
    if (R.pek !== 'mouse' && !nara()) {
      if (R.k * W - innerWidth > 1) R.tx = R.px * 2 - 1;
      R.ty = R.k * H - innerHeight > 1 ? R.py * 2 - 1 : -0.25;
    }
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
    if ((!calm() || still()) && syns(document.getElementById('rum-damm'))) dust(t);
    if (R.fig && syns(R.gang)) R.fig.draw(t, R.mx, R.my);
    if (R.saker) R.saker.draw(t, R.mx, R.my, R.rows, R.old, syns(R.sakDuk));
    if (R.inr) R.inr.draw();
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

  // ---------- utsikten ----------

  // Stockholms klocka och väder (vader.js) i utsikten bakom glaset
  // (rum-ute.js), i dagsljuset som faller in och i gängets kläder (rum-3d.js).
  function paintUte(v) {
    if (!window.Vader || !window.RumUte || !R.el) return;
    v = v || Vader.nu();
    R.vader = v;
    RumUte.paint(document.getElementById('rum-ute'), v, [WIN, DORR]);
    const L = RumUte.light(v);
    const d = document.getElementById('rum-dagsljus');
    d.style.setProperty('--dagsljus', r1(L.dag * 0.9));
    d.style.setProperty('--dag-farg', L.sky[2]);
    R.el.classList.toggle('aska', v.slag === 'aska');
    if (R.fig && R.fig.ute) {
      R.fig.ute(v);
      if (calm() && !still()) frame();
    }
  }
  async function ute() {
    if (window.Vader) paintUte(await Vader.hamta());
  }

  // ---------- figurerna ----------

  // I telefonen startar 3D-delarna (gänget, inredningen, sakerna och
  // kortlådan) en i taget i ordning, och först när rummet syns: var och en
  // tar ett par hundra MB medan den startar (shaders, texturer, ljuset), och
  // alla på en gång medan rummet ritades var för mycket för en iPhone. På
  // datorn startar de på en gång som förut.
  // tur(fn, ordning) → fn():s löfte
  const TUR = [];
  function tur(fn, ordning = 0) {
    if (!LATT) return fn();
    return new Promise((res, rej) => {
      TUR.push({ fn, ordning, res, rej });
      TUR.sort((a, b) => a.ordning - b.ordning);
      nasta();
    });
  }
  // → när alla har startat (för en fast bild)
  const TOM = [];
  const turTom = () => (LATT && (R.turGar || TUR.length) ? new Promise((r) => TOM.push(r)) : Promise.resolve());
  async function nasta() {
    if (R.turGar || !R.turStart) return;
    if (!TUR.length) {
      TOM.splice(0).forEach((r) => r());
      return;
    }
    R.turGar = true;
    const t = TUR.shift();
    try {
      t.res(await t.fn());
    } catch (err) {
      t.rej(err);
    }
    // en stund emellan, så att det som startade hinner städa efter sig
    // (Safari släpper buffertar som inte används efter ungefär en sekund)
    await new Promise((r) => setTimeout(r, 800));
    R.turGar = false;
    nasta();
  }

  async function three() {
    if (R.fig || R.loading) return;
    R.loading = true;
    // askkoppen, snusdosan, fläkten och affischen (rum-saker.js)
    tur(() => import('./rum-saker.js').then((m) => m.saker(R.el, { calm: calm() })).then((x) => { R.saker = x; R.sakDuk = R.el.querySelector('canvas.rum-saker'); sikt(R.sakDuk); frame(); }), 2)
      .catch((err) => console.warn('Rummet: sakerna kunde inte ritas', err));
    // lysröret, neonen, skyltarna, uret, ramarna, paketen, stolen och kupongstället (rum-inredning.js)
    tur(() => import('./rum-inredning.js').then((m) => m.inredning(R.el, { calm: calm(), still })).then((x) => { R.inr = x; x.namn(R.ramNamn); if (R.sak) sak(R.sak, null); frame(); }), 1)
      .catch((err) => console.warn('Rummet: inredningen kunde inte ritas', err));
    try {
      await tur(async () => {
        const mod = await import('./rum-3d.js');
        R.fig = await mod.figurer(document.getElementById('rum-3d'), { calm: calm(), vader: R.vader });
        if (R.vem) R.fig.inne(R.vem, now());
        if (R.lage) R.fig.lage(R.lage, now());
        provMal();
        frame();
      });
    } catch (err) {
      // utan WebGL eller utan nätet står rummet kvar utan gänget
      console.warn('Rummet: figurerna kunde inte ritas', err);
    }
  }

  // ---------- klicken ----------

  // snabbvalet på text-tv:n som föremålet leder till
  function hot(nav) {
    for (const a of R.el.querySelectorAll('[data-to]')) a.classList.toggle('hot', nav === a.dataset.to);
  }

  // Magneten: en miss nära ett föremål räknas som en träff. Pekar man på
  // något som inte leder någonstans gäller det närmaste föremålet inom MAG
  // (scenens px) – det lyser, pekaren blir en hand och klicket går dit.
  // Föremålen söks med träffprov i ringar ut från punkten, så att magneten
  // följer deras verkliga form och det som står framför; ett prov kostar
  // (rummet är djupt), så med musen söks det först när den stannar
  // (wire), och vid ett klick.
  const MAG = 36;
  const PEKBAR = '.rum-sak, .rum-tag';
  function magnet(x, y, t = document.elementFromPoint(x, y)) {
    if (!t || !R.el.contains(t)) return null;
    const s = t.closest(PEKBAR);
    if (s || t.closest('a, button, input, .rum-hdr, .rum-ft')) return s;
    const r = MAG * R.k;
    for (let i = 1; i <= 3; i++) {
      for (let j = 0; j < 8; j++) {
        const v = ((j + i / 2) * Math.PI) / 4;
        const p = document.elementFromPoint(x + (Math.cos(v) * r * i) / 3, y + (Math.sin(v) * r * i) / 3);
        const n = p && p.closest(PEKBAR);
        if (n && R.el.contains(n)) return n;
      }
    }
    return null;
  }
  // Föremålet magneten valt lyser som när man pekar på det (.magnet).
  // direkt: musen är på ett föremål, och mouseover har redan tänt snabbvalet.
  function peka(s, direkt) {
    if (s === R.mag) return;
    if (R.mag) R.mag.classList.remove('magnet');
    R.mag = s;
    if (s) s.classList.add('magnet');
    R.el.classList.toggle('magnet', Boolean(s));
    if (!direkt) hot(s ? s.dataset.nav : null);
  }

  // Elementets mått i fönstret. WebKit utan GetBoundingClientRectZoomed
  // (Safari i iPhone) delar måtten för det som står i något med CSS zoom med
  // zoomen – tv:n ritas i zoom 1,5 eller 3 – så att kameran siktade på fel
  // ställe och tv:n hamnade utanför bilden. Där förstoras de tillbaka med
  // zoomen på vägen upp.
  let zoomDelar = null;
  function rekt(el) {
    const r = el.getBoundingClientRect();
    if (zoomDelar == null) {
      const a = document.createElement('div');
      a.style.cssText = 'position:fixed; left:0; top:0; zoom:2; visibility:hidden';
      a.innerHTML = '<div style="width:10px; height:10px"></div>';
      document.body.append(a);
      zoomDelar = a.firstChild.getBoundingClientRect().width < 15;
      a.remove();
    }
    if (!zoomDelar) return r;
    let z = 1;
    for (let p = el; p; p = p.parentElement) z *= parseFloat(getComputedStyle(p).zoom) || 1;
    return z === 1 ? r : new DOMRect(r.x * z, r.y * z, r.width * z, r.height * z);
  }

  // Föremålets (eller måttens) mitt i scenens koordinater.
  function centerOf(a) {
    const r = a.getBoundingClientRect ? a.getBoundingClientRect() : a;
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
    if (a.dataset.sak) {
      e.preventDefault();
      sak(a.dataset.sak);
      return;
    }
    const href = a.getAttribute('href');
    if (!href) return;
    if (a.dataset.nav === 'tv') {
      e.preventDefault();
      zoomTv(!R.zoom);
      return;
    }
    if (a.dataset.nav === 'video') {
      e.preventDefault();
      zoomVideo(!R.vnara);
      return;
    }
    if (a.id === 'rum-ans') {
      e.preventDefault();
      board(true);
      return;
    }
    if (a.id === 'rum-reg') {
      e.preventDefault();
      register(true);
      return;
    }
    if ((a.id === 'rum-kupong' || a.dataset.ta != null) && openCoupon(a.id === 'rum-kupong' ? null : a)) {
      e.preventDefault();
      return;
    }
    if (a.classList.contains('rum-bak') && a.dataset.ta == null && pult()) {
      e.preventDefault();
      nudge(a);
      return;
    }
    const folj = () => {
      if (/^#/.test(href)) location.hash = href.slice(1);
      else location.href = href;
    };
    if (calm()) {
      // magneten: klicket föll bredvid länken
      if (!a.contains(e.target)) {
        e.preventDefault();
        folj();
      }
      return;
    }
    e.preventDefault();
    const p = centerOf(a);
    const c = mid();
    aim(p, 1.35, [p[0] + (c[0] - p[0]) * 0.4, p[1] + (c[1] - p[1]) * 0.4], 'dyk');
    R.el.classList.add('dyker');
    setTimeout(() => {
      folj();
      // tillbaka i rummet (matchrutan ligger ovanpå det, och bakåt-knappen)
      setTimeout(() => {
        R.el.classList.remove('dyker');
        aim([800, 500], 1, [800, 500]);
      }, 60);
    }, 420);
  }

  // En kupong i högen som du inte får vända på än (du ser inte hens tips):
  // den lyfts lite i ena kanten och faller tillbaka.
  function nudge(a) {
    if (calm() || a.getAnimations().length) return;
    const base = a.style.transform;
    a.animate([
      { transform: base, easing: 'cubic-bezier(0.3, 0, 0.4, 1)' },
      { transform: `${base} translateZ(18px) rotateY(-8deg) rotateX(-5deg)`, offset: 0.4, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
      { transform: base, offset: 0.78, easing: 'ease-out' },
      { transform: `${base} translateZ(3px)`, offset: 0.88, easing: 'ease-in' },
      { transform: base },
    ], { duration: 560 });
  }

  // T: tv:n nära, vriden mot en, så att text-tv:n går att läsa och knapparna
  // att trycka på. Kameran siktar på rutan där den hamnar när tv:n har vridits.
  function zoomTv(on) {
    if (on && R.vnara) zoomVideo(false);
    if (on && R.reg && R.reg.on()) register(false);
    R.zoom = on;
    R.el.classList.toggle('tv-nara', on);
    // kameran ställer sig rakt framför, så att tv:n står rak (som med kupongen i handen)
    if (on) {
      R.tx = 0;
      R.ty = 0;
      if (calm()) R.mx = R.my = 0;
      setCam(0, 0);
    }
    const r = R.tv && R.tv.zoom(on, rekt);
    setCam(R.mx, R.my);
    // så nära som ryms i fönstret (i telefonen fyller tv:n bredden)
    const z = r && Math.min(3.6, (innerWidth - 24) / r.width, (innerHeight - 110) / r.height);
    if (on && r) aim(centerOf(r), z, mid(0.5, 0.48), calm() ? null : 'glid');
    else aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
  }

  // V: videon nära. Kameran går fram till hörnet på disken – tv:n, högen
  // på den och lådan bredvid, som annars står utanför bilden – rakt
  // framifrån, och förstorar så mycket som ryms mellan namnet och foten.
  function zoomVideo(on) {
    if (!R.video || (!on && !R.vnara)) return;
    if (on && R.zoom) zoomTv(false);
    if (on && R.ans && R.ans.on()) board(false);
    if (on && R.reg && R.reg.on()) register(false);
    R.vnara = on;
    // i telefonen ritas hörnet skarpt bara när rutan fyller bilden (tat i
    // rum-video.js), och i halva storleken igen när tv:n har vridits bort
    clearTimeout(R.vskarp);
    if (on) R.video.skarp(false);
    else R.vskarp = setTimeout(() => { if (!R.vnara) R.video.skarp(false); }, 900);
    R.el.classList.toggle('vid-nara', on);
    if (on) {
      R.tx = 0;
      R.ty = 0;
      if (calm()) R.mx = R.my = 0;
      setCam(R.mx, R.my);
    }
    R.vf = R.video.zoom(on);
    if (on) aimVideo(calm() ? null : 'glid');
    else aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
  }
  function aimVideo(cls) {
    // hörnet i planet -598 (1,035 gånger), och det som syns av scenen;
    // förstoringen högst f.z (rutan nära, rum-video.js), annars sex
    const f = R.vf;
    const [x0, x1] = [f.x0, f.x1].map((x) => 800 + (x - 800) * 1.035);
    const [y0, y1] = [f.y0, f.y1].map((y) => 500 + (y - 500) * 1.035);
    const [vx0, vx1] = [-R.ox / R.k, (innerWidth - R.ox) / R.k];
    const [vy0, vy1] = [(64 - R.oy) / R.k, (innerHeight - 56 - R.oy) / R.k];
    const z = Math.min(f.z || 6, ((vx1 - vx0) * 0.92) / (x1 - x0), ((vy1 - vy0) * 0.92) / (y1 - y0));
    aim([(x0 + x1) / 2, (y0 + y1) / 2], z, [(vx0 + vx1) / 2, (vy0 + vy1) / 2], cls);
  }

  // A: anslagstavlan lossnar från väggen och flyger fram (rum-anslag.js),
  // och kameran går lite mot hörnet medan den flyger. Tillbaka flyger den
  // till hörnen där den hänger när kameran har gått tillbaka – de mäts med
  // kameran där en kort stund, innan den glider dit.
  function board(on) {
    if (!R.ans || on === R.ans.on()) return;
    if (on) {
      if (R.zoom) zoomTv(false);
      if (R.vnara) zoomVideo(false);
      if (R.reg && R.reg.on()) register(false);
      R.ans.open(true, R.ans.quad());
      const p = centerOf(document.getElementById('rum-ans'));
      const c = mid();
      aim(p, 1.25, [p[0] + (c[0] - p[0]) * 0.5, p[1] + (c[1] - p[1]) * 0.5], calm() ? null : 'glid');
      return;
    }
    const w = document.getElementById('rum-kamera');
    const cam = w.style.cssText;
    aim([800, 500], 1, [800, 500]);
    const q = R.ans.quad();
    w.style.cssText = cam;
    void w.offsetWidth;
    aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
    R.ans.open(false, q);
  }

  // R: kortregistret lyfter från disken, vänder sig mot en och kommer nära
  // (rum-register.js, lådan i rum-kortlada.js), och kameran går lite mot
  // disken medan det flyger. Tillbaka flyger det till lådans plats med
  // kameran där den står när den har gått tillbaka, som anslagstavlan.
  function register(on) {
    if (!R.reg || !R.reg.ready() || on === R.reg.on()) return;
    if (on) {
      if (R.zoom) zoomTv(false);
      if (R.vnara) zoomVideo(false);
      if (R.ans && R.ans.on()) board(false);
      const r = R.reg.at();
      R.reg.open(true, r);
      const p = centerOf(r);
      const c = mid();
      aim(p, 1.25, [p[0] + (c[0] - p[0]) * 0.5, p[1] + (c[1] - p[1]) * 0.5], calm() ? null : 'glid');
      return;
    }
    const w = document.getElementById('rum-kamera');
    const cam = w.style.cssText;
    aim([800, 500], 1, [800, 500]);
    const r = R.reg.at();
    w.style.cssText = cam;
    void w.offsetWidth;
    aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
    R.reg.open(false, r);
  }

  // ---------- närbilderna ----------
  //
  // Uret, skårtavlan, oraklet och VM 94-affischen (data-sak): kameran ställer
  // sig rakt framför och går fram tills saken fyller det mesta av fönstret,
  // och det som är ritat i 3D (rum-inredning.js) ritas om skarpare. Under
  // skårtavlan och oraklet står guldordet dit de leder (dit leder också ett
  // klick på dem), under affischen fotografen. Esc eller ett klick någon
  // annanstans går tillbaka.
  //   el saken, h hur mycket av höjden den får, duk duken i 3D, fot under den
  const SAKER = {
    ur: { el: '.rum-ur', h: 0.78, duk: 'ur' },
    skar: { el: '.rum-skar', h: 0.82, duk: 'hogra', fot: () => '<a class="rum-guld" href="tabeller.html">Tabeller</a>' },
    ram: { el: '.rum-ram', h: 0.94, duk: 'ram', fot: () => '<a class="rum-guld" href="#olympen">Olympen</a>' },
    vm94: { el: '#rum-vm94', h: 0.74, fot: (a) => `<span class="foto">${esc(a.title).replace('Wikimedia Commons', (m) => (a.dataset.kalla ? `<a href="${esc(a.dataset.kalla)}" target="_blank" rel="noopener">${m}</a>` : m))}</span>` },
  };
  function sakFot() {
    let f = document.getElementById('rum-sakfot');
    if (!f) {
      f = document.createElement('div');
      f.className = 'rum-sakfot';
      f.id = 'rum-sakfot';
      R.el.append(f);
    }
    return f;
  }
  // namn = null: tillbaka (cls = null: genast)
  function sak(namn, cls = calm() ? null : 'glid') {
    const was = R.sak;
    if (!namn && !was) return;
    const fot = sakFot();
    fot.classList.remove('on');
    clearTimeout(R.skarp);
    // den förra saken ritas som vanligt igen
    const duk = was && SAKER[was] && SAKER[was].duk;
    if (duk && was !== namn && R.inr) R.inr.skarp(duk, 0);
    R.sak = namn || null;
    if (!namn) {
      R.el.classList.remove('sak-nara');
      aim([800, 500], 1, [800, 500], cls);
      return;
    }
    const S = SAKER[namn];
    const a = S && R.el.querySelector(S.el);
    // (uret finns först när inredningen är ritad, och då frågar three() igen)
    if (!a) return;
    if (R.zoom) zoomTv(false);
    if (R.vnara) zoomVideo(false);
    board(false);
    // saken mätt med kameran i vila och rummet rakt
    const w = document.getElementById('rum-kamera');
    const cam = w.style.cssText;
    aim([800, 500], 1, [800, 500]);
    setCam(0, 0);
    const r = a.getBoundingClientRect();
    const p = centerOf(r);
    setCam(R.mx, R.my);
    w.style.cssText = cam;
    void w.offsetWidth;
    // Rummet vrids rakt medan kameran går fram (.sak-nara i rum.css) och står
    // sedan still: så länge det rör sig ritar webbläsaren det suddigt.
    R.el.classList.add('sak-nara');
    R.tx = R.ty = R.mx = R.my = 0;
    setCam(0, 0);
    // gänget, pulten och barstolen går kameran förbi (de tonar bort)
    for (const pl of R.el.querySelectorAll('.rum-world > .rum-pl:not(.rum-pl3d)')) {
      const m = /translateZ\((-?[\d.]+)px\)/.exec(pl.style.transform);
      pl.classList.toggle('forbi', Boolean(m) && Number(m[1]) > -560);
    }
    // så stor som ryms mellan namnet och foten, med guldordet under
    const top = 64;
    const h = innerHeight - top - (S.fot ? 112 : 64);
    const z = Math.min((innerWidth * 0.9) / r.width, (h * S.h) / r.height);
    const cy = top + h / 2;
    fot.innerHTML = S.fot ? S.fot(a) : '';
    fot.style.top = `${r1(cy + (r.height * z) / 2 + 14)}px`;
    if (S.fot) fot.classList.add('on');
    aim(p, z, [(innerWidth / 2 - R.ox) / R.k, (cy - R.oy) / R.k], cls);
    // duken i 3D ritas skarpare när kameran är framme
    if (S.duk) R.skarp = setTimeout(() => { if (R.sak === namn && R.inr) R.inr.skarp(S.duk, z * R.k * 1.035 * (devicePixelRatio || 1)); }, cls ? 620 : 0);
  }
  // Vidare från närbilden: rummet tonar bort och sidan byts.
  function sakVidare(href) {
    R.el.classList.add('dyker');
    setTimeout(() => {
      if (/^#/.test(href)) location.hash = href.slice(1);
      else location.href = href;
      setTimeout(() => {
        R.el.classList.remove('dyker');
        sak(null, null);
      }, 60);
    }, calm() ? 0 : 420);
  }

  // ---------- kupongen i handen ----------
  //
  // Allt man gör med kupongen på papperet under Kupong görs här, med
  // kupongen i handen (Samtal.pult i samtal.js – samma utkast, inlämning och
  // tjänst). Den lyfter från pulten, vänds upp mot en och förstoras till
  // mitten, rummet mörknar bakom och pennan följer med. Rutorna är knappar,
  // och pennan drar krysset; efter tiden skriver pennan motiveringen för
  // hand. Under kupongen står Lägg tillbaka och det man gör med den (handRow).
  // Esc, K, Lägg tillbaka eller ett klick utanför lägger tillbaka den samma
  // väg baklänges.
  //   fyll  den som inte har lämnat in fyller i kupongen på pulten: Spara och
  //         Lämna in. Inlämnad vänds den och läggs i högen (se ovan), och på
  //         pulten ligger en ny.
  //   din   din kupong ur högen: lyfts, vänds på vägen upp och står i handen
  //         med dina kryss och stämpeln. Tills matcherna startar går den att
  //         ändra (Ångra, Lämna in ändringen); startade matcher står fast och
  //         får pennan för kommentaren i efterhand.
  //   las   någon annans kupong ur högen, när du ser hens tips: hens kryss,
  //         motiveringar och kommentarer.
  //   gang  uppgörelsen, när du ser de andras tips: kupongen på pulten är
  //         gängets, med allas porträtt i rutorna och gängets kryss med
  //         kulspetspenna, och guldordet sparar den.

  // Läget för kupongen på pulten, om det är omgången som rummet visar.
  function pult(rd) {
    const p = window.Samtal && Samtal.pult ? Samtal.pult.state() : null;
    return p && (!rd || rd.id === p.s.id) ? p : null;
  }

  // Var kupongen hamnar i handen: mitt i fönstret, så stor som får plats
  // mellan namnet och orden under den. → förskjutningen från pulten och
  // förstoringen i scenens mått, och rutan i fönstret.
  // På bredden i telefonen (lag) står orden bredvid kupongen i stället.
  function held() {
    const k = R.k || 1;
    const [w, h] = R.smal ? KUP.smal : KUP.bred;
    const sida = R.lag ? 190 : 0;
    const top = R.lag ? 14 : R.smal ? 58 : 84;
    const foot = R.lag ? 14 : R.smal ? 96 : 78;
    const bredd = R.lag ? innerWidth - sida - 48 : innerWidth * (R.smal ? 0.94 : 0.8);
    const z = Math.min(2.2, (innerHeight - top - foot) / (h * k), bredd / (w * k));
    const cx = (innerWidth - sida) / 2;
    const cy = top + (innerHeight - top - foot) / 2;
    return {
      dx: (cx - (R.ox || 0)) / k - 760, dy: (cy - (R.oy || 0)) / k - 853, z,
      box: { left: cx - (w / 2) * z * k, top: cy - (h / 2) * z * k, width: w * z * k, height: h * z * k },
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
    if (R.lag) {
      s.left = `${r1(h.box.left + h.box.width + 28)}px`;
      s.width = '162px';
      s.top = `${r1(h.box.top)}px`;
      s.height = `${r1(h.box.height)}px`;
      return;
    }
    s.left = `${r1(h.box.left)}px`;
    s.width = `${r1(h.box.width)}px`;
    s.top = `${r1(h.box.top + h.box.height + 20)}px`;
    s.height = '';
    // på höjden i telefonen står meddelandet ovanför kupongen (rum.css)
    s.setProperty('--upp', `${r1(h.box.height + 30)}px`);
  }

  // Kupongen tas i handen: från pulten (from = null) eller ur högen (from =
  // kupongen där). På pulten ligger ditt utkast att fylla i, eller gängets
  // kupong när du ser de andras tips; annars tas din ur högen, var du än
  // klickar. Ur högen tas din kupong och de vars tips du ser. → om den togs.
  function openCoupon(from = null) {
    if (R.kup) return true;
    const p = pult();
    if (!p || !R.el) return false;
    let slag = null;
    if (from) slag = from.dataset.vem === p.vem && p.inne ? 'din' : p.se.includes(from.dataset.vem) ? 'las' : null;
    else if (p.fyll) slag = 'fyll';
    else if (p.gang) slag = 'gang';
    else if (p.inne) {
      from = document.querySelector(`#rum-hogen [data-vem="${CSS.escape(p.vem)}"]`);
      slag = 'din';
    }
    const v = slag && view(p, slag, from ? from.dataset.vem : null);
    if (!v || (slag !== 'fyll' && slag !== 'gang' && !from)) return false;
    if (slag === 'gang') pling();
    zoomTv(false);
    zoomVideo(false);
    const desk = document.getElementById('rum-kupong');
    const rd = { id: p.s.id, ids: p.s.matcher.map((x) => String(x.id)), gang: p.s.gang, name: (window.Samtal && Samtal.name()) || null };
    const nr = typeof couponNumber === 'function' ? couponNumber(rd.ids) : null;
    const fram = couponHtml(rd, roundRows(rd), v, true);
    const vems = slag === 'las' ? `${v.vem}:s kupong` : slag === 'gang' ? 'Gängets kupong' : nr ? `Kupong ${nr}` : 'Kupong';
    desk.parentElement.insertAdjacentHTML('beforeend', '<div class="rum-dimma" id="rum-dimma"></div>' +
      `<div class="rum-flat ${from ? 'rum-bak' : 'rum-kup'} rum-handen" id="rum-handen" role="dialog" aria-modal="true" aria-label="${esc(vems)}" tabindex="-1">` +
      `${from ? from.innerHTML : fram}</div>`);
    R.el.insertAdjacentHTML('beforeend', `<div class="rum-hand" id="rum-hand">${handRow(p, v)}</div>`);
    const el = document.getElementById('rum-handen');
    const k = R.kup = { el, dim: document.getElementById('rum-dimma'), rad: document.getElementById('rum-hand'), pen: el.querySelector('.pencil'), at: PEN_PULT, desk,
      slag, andra: slag === 'din' && p.andra, orig: { ...v.tecken }, tecken: { ...v.tecken }, origNot: { ...(v.not || {}) }, not: { ...(v.not || {}) },
      efter: { ...(v.efter || {}) }, fram };
    k.msg = k.rad.querySelector('.msg');
    k.go = k.rad.querySelector('.guld');
    if (from) {
      // ur högen: vems och var den låg, och baksidan att vända tillbaka till
      Object.assign(k, { vem: from.dataset.vem, slot: slot(Number(from.dataset.i)), bak: from.innerHTML });
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
      const b = e.target.closest('button.box, button[data-vem]');
      if (!b || k.closing) return;
      if (b.dataset.vem) choose(b);
      else if (k.slag === 'gang') tickGang(b);
      else tick(b);
    });
    wireNotes(k);
    k.rad.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled || k.closing) return;
      if (b.dataset.tillbaka != null) closeCoupon();
      else if (b.dataset.lamna != null) handIn();
      else if (b.dataset.spara != null) save();
      else if (b.dataset.angra != null) undo();
      else if (b.dataset.gang != null) saveGang();
      else if (b.dataset.borjaom != null) startOver();
      else if (b.dataset.bort != null) removeRound();
    });
    return true;
  }

  // Orden under kupongen, som raden längst ner på papperet: till vänster
  // Lägg tillbaka och det mer sällsynta i finstil (Ändra matcherna, Ta bort,
  // Börja om), till höger det du gör med kupongen, guldordet längst ut.
  //   fyll  Spara (Sparad när utkastet är sparat som det står) och Lämna in
  //   din   Ångra och Lämna in ändringen, släckta tills något är ändrat
  //   gang  Spara gängets kupong (Spara ändringen, Sparad) medan någon match
  //         inte har startat
  const CHECK = '<svg class="ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  function handRow(p, v) {
    const fin = [];
    let go = '';
    if (v.slag === 'fyll') {
      if (p.matcher) fin.push('<a class="fin" href="#kupong/samtal/matcher">Ändra matcherna</a>');
      if (p.bort) fin.push('<button type="button" class="fin" data-bort>Ta bort</button>');
      go = sparaHtml(p) + '<button type="button" class="guld" data-lamna>Lämna in</button>';
    } else if (v.slag === 'din' && p.andra) {
      go = '<button type="button" class="bla" data-angra disabled>Ångra</button><button type="button" class="guld" data-lamna disabled>Lämna in ändringen</button>';
    } else if (v.slag === 'gang' && v.g.open) {
      fin.push(`<button type="button" class="fin" data-borjaom title="Det som fler än hälften har med"${v.g.reset ? '' : ' hidden'}>Börja om</button>`);
      go = gangHtml(v.g);
    }
    return `<span class="vanster"><button type="button" class="bla" data-tillbaka>Lägg tillbaka</button>${fin.join('')}</span>` +
      `<p class="msg" role="status"></p><span class="hoger">${go}</span>`;
  }
  const sparaHtml = (p) => `<button type="button" class="bla${p.sparad ? ' sparad' : ''}" data-spara${p.sparad || p.tom ? ' disabled' : ''}>${p.sparad ? `${CHECK}Sparad` : 'Spara'}</button>`;
  const gangHtml = (g) => `<button type="button" class="guld${g.same ? ' sparad' : ''}" data-gang${g.same ? ' disabled' : ''}>${g.same ? `${CHECK}Sparad` : esc(g.label)}</button>`;

  function closeCoupon(now = false) {
    const k = R.kup;
    if (!k || k.closing) return;
    // på väg upp ur högen: läggs tillbaka när den är framme
    if (k.opening && !now) {
      k.later = true;
      return;
    }
    // en kommentar i efterhand som du skriver sparas när fältet lämnas
    const f = k.el.querySelector('input.pen-in:focus');
    if (f) f.blur();
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
  function drawCross(box, key, kula = false) {
    const k = R.kup;
    box.insertAdjacentHTML('beforeend', crossSvg(key, kula));
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

  // Pennan ringar in ditt porträtt, ett drygt varv som på papperet: den
  // följer ringen som ritas (Papper.ring) och lyfter.
  function drawRing(fw, key) {
    const k = R.kup;
    fw.querySelector('.sm-fc').insertAdjacentHTML('afterend', Papper.ring(key, 'sm-du-ring', 25));
    const svg = fw.querySelector('.sm-du-ring');
    const path = svg.querySelector('path');
    if (calm()) return;
    // ringen står 6 px utanför porträttet runt om (rum.css), i 60 × 60
    const o = spot(fw);
    const w = fw.offsetWidth + 12;
    const h = fw.offsetHeight + 12;
    const len = path.getTotalLength();
    const n = 16;
    const pts = Array.from({ length: n + 1 }, (_, i) => path.getPointAtLength((len * i) / n))
      .map((q) => [o.x - 6 + (q.x / 60) * w, o.y - 6 + (q.y / 60) * h]);
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 2';
    const at = (pt, l, t, e) => ({ x: pt[0], y: pt[1], a: PEN_SKRIV, l, t, e });
    const travel = Math.round(Math.min(340, Math.max(150, Math.hypot(pts[0][0] - k.at.x, pts[0][1] - k.at.y) * 0.9)));
    const step = 26;
    penGo([
      at(pts[0], 0.7, travel, 'cubic-bezier(0.4, 0, 0.2, 1)'), at(pts[0], 0, 50, 'ease-in'),
      ...pts.slice(1).map((pt) => at(pt, 0, step, 'linear')),
      at([pts[n][0] + 12, pts[n][1] + 10], 0.8, 220, 'ease-out'),
    ]);
    path.animate([{ strokeDashoffset: 1.05 }, { strokeDashoffset: 0 }], { duration: step * n, delay: travel + 50, easing: 'linear', fill: 'backwards' });
    clearTimeout(k.idle);
    k.idle = setTimeout(() => {
      if (R.kup === k && !k.closing) penGo([{ ...PEN_VILA, l: 0.4, t: 480, e: 'cubic-bezier(0.4, 0, 0.3, 1)' }, { ...PEN_VILA, t: 160, e: 'ease-in' }]);
    }, 1800);
  }

  // Ett kryss eller en ring som tas bort suddas ut.
  function eraseCross(box) {
    for (const svg of box.querySelectorAll('.kryss:not(.ut), .sm-du-ring:not(.ut)')) {
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
    penShown(row);
    if (k.andra) {
      if (sign) k.tecken[row.dataset.id] = sign;
      else delete k.tecken[row.dataset.id];
      dirty();
    } else {
      Samtal.pult.tippa(row.dataset.id, sign);
      refreshSpara();
    }
    // fälten i foten räknas om, som på papperet
    const f = k.el.querySelector('.fot .pp-fields');
    if (f) f.outerHTML = Samtal.pult.fields(k.andra ? k.tecken : Samtal.pult.state().tecken);
    if (!k.el.querySelector('.row.tom')) k.el.classList.remove('need');
    k.msg.textContent = '';
  }

  // Uppgörelsen: en ruta kryssas i eller ur för gängets tecken, med
  // kulspetspennan, och tecknen sparas på enheten som på papperet
  // (Samtal.pult.besluta).
  function tickGang(b) {
    const k = R.kup;
    if (k.busy) return;
    const row = b.closest('.row');
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('x', on);
    if (on) drawCross(b, `${row.dataset.id}${b.dataset.s}`, true);
    else eraseCross(b);
    const sign = SIGNS.filter((s) => row.querySelector(`[data-s="${s}"]`).getAttribute('aria-pressed') === 'true').join('');
    row.classList.toggle('tom', !sign);
    Samtal.pult.besluta(row.dataset.id, sign);
    k.next = null;
    gangState();
  }

  // Gängets kupong i handen efter ett kryss: fälten i foten, guldordet (Spara
  // gängets kupong, Spara ändringen eller Sparad) och Börja om.
  function gangState(msg = '') {
    const k = R.kup;
    const g = Samtal.pult.gang();
    if (!g) return;
    k.tecken = g.val;
    const f = k.el.querySelector('.fot .pp-fields');
    if (f) f.outerHTML = Samtal.pult.fields(g.val, true);
    if (k.go) {
      k.go.outerHTML = gangHtml(g);
      k.go = k.rad.querySelector('[data-gang]');
    }
    const r = k.rad.querySelector('[data-borjaom]');
    if (r) r.hidden = !g.reset;
    if (!k.el.querySelector('.row.tom button.box')) k.el.classList.remove('need');
    k.msg.textContent = msg;
  }

  // Rutorna ställs som tecknen i want (Ångra, Börja om): kryss som inte ska
  // stå där suddas ut, och de som saknas dras igen, ett i taget.
  function setSigns(want, kula = false) {
    let n = 0;
    for (const row of R.kup.el.querySelectorAll('.row')) {
      const w = want[row.dataset.id] || '';
      const boxes = row.querySelectorAll('button.box');
      for (const b of boxes) {
        const on = w.includes(b.dataset.s);
        if ((b.getAttribute('aria-pressed') === 'true') === on) continue;
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle('x', on);
        if (!on) {
          eraseCross(b);
          continue;
        }
        b.insertAdjacentHTML('beforeend', crossSvg(`${row.dataset.id}${b.dataset.s}`, kula));
        if (!calm()) {
          [...b.lastElementChild.querySelectorAll('path')].forEach((path, i) => path.animate([{ strokeDashoffset: 1.05 }, { strokeDashoffset: 0 }],
            { duration: 120, delay: 240 + n * 90 + i * 130, easing: 'cubic-bezier(0.3, 0, 0.6, 1)', fill: 'backwards' }));
        }
        n += 1;
      }
      if (boxes.length) row.classList.toggle('tom', !w);
    }
  }

  // Börja om: tecknen som fler än hälften har med, som på papperet.
  function startOver() {
    const k = R.kup;
    if (k.busy) return;
    Samtal.pult.besluta(null);
    const g = Samtal.pult.gang();
    if (g) setSigns(g.val, true);
    k.next = null;
    gangState();
  }

  // Din inlämnade kupong: Ångra och Lämna in ändringen tänds när något är
  // ändrat – ett tecken eller en motivering.
  function dirty() {
    const k = R.kup;
    if (!k.andra) return;
    const same = (a, b) => Object.keys({ ...a, ...b }).every((id) => String(a[id] || '').trim() === String(b[id] || '').trim());
    const changed = !same(k.orig, k.tecken) || !same(k.origNot, k.not);
    for (const b of k.rad.querySelectorAll('[data-angra], [data-lamna]')) b.disabled = !changed || k.busy;
  }

  // Ångra: dina inlämnade tecken och motiveringar igen, som på papperet.
  function undo() {
    const k = R.kup;
    if (k.busy) return;
    setSigns(k.orig);
    k.tecken = { ...k.orig };
    k.not = { ...k.origNot };
    for (const f of k.el.querySelectorAll('input[data-not]')) {
      f.value = k.not[f.dataset.not] || '';
      penShown(f.closest('.row'));
    }
    const f = k.el.querySelector('.fot .pp-fields');
    if (f) f.outerHTML = Samtal.pult.fields(k.tecken);
    k.msg.textContent = '';
    dirty();
  }

  // Spara utan att lämna in, som på papperet: de andra ser hur långt du har
  // kommit (tårtbiten vid ditt porträtt), och ordet blir Sparad tills du
  // ändrar något.
  async function save() {
    const k = R.kup;
    const p = pult();
    if (!p || k.busy) return;
    if (!p.vem) {
      k.el.classList.add('need-vem');
      k.msg.textContent = 'Vem är du?';
      return;
    }
    k.busy = true;
    k.rad.querySelector('[data-spara]').disabled = true;
    k.msg.textContent = 'Sparar …';
    const out = await Samtal.pult.spara();
    if (R.kup !== k) return;
    k.busy = false;
    k.msg.textContent = out.ok ? '' : out.error || 'Ingen kontakt med servern.';
    refreshSpara();
    if (!out.ok) return;
    const top = Samtal.pult.top(true);
    const faces = k.el.querySelector('.sm-folk-pp');
    if (top && faces) faces.innerHTML = top.faces;
  }
  function refreshSpara() {
    const b = R.kup && R.kup.rad.querySelector('[data-spara]');
    const p = pult();
    if (b && p) b.outerHTML = sparaHtml(p);
  }

  // Gängets kupong sparas, som guldordet i uppgörelsen på papperet
  // (Samtal.pult.sparaGang). Saknar matcher tecken säger raden det, och
  // guldordet blir Spara ändå; har någon annan hunnit före blir det Spara
  // över den (gängets kupong) eller Spara ändå (en kupong till samma dag).
  // Utan tjänsten öppnas Ny kupong (eller Ändra) med tecknen ifyllda.
  async function saveGang() {
    const k = R.kup;
    if (!k || k.busy) return;
    k.busy = true;
    k.go.disabled = true;
    k.msg.textContent = 'Sparar …';
    const out = await Samtal.pult.sparaGang(k.next || {});
    if (R.kup !== k) return;
    k.busy = false;
    k.next = null;
    if (out.via) {
      location.hash = out.via;
      return;
    }
    if (out.ok) {
      gangState('Sparad · syns för alla om några minuter.');
      return;
    }
    const n = out.ask || 0;
    if (n) k.el.classList.add('need');
    k.next = n || out.over ? { again: true } : out.igen ? { again: true, anyway: true } : out.offline ? { again: true, adjust: true } : null;
    gangState(n ? `${n === 1 ? 'En match saknar' : `${n} matcher saknar`} tecken och kommer inte med.` : out.error || 'Det gick inte att spara.');
    if (k.next && k.go) {
      k.go.textContent = n || out.igen ? 'Spara ändå' : out.over ? 'Spara över den' : 'Spara via Ny kupong';
      k.go.disabled = false;
    }
  }

  // Ta bort omgången: samma fråga som på papperet (Samtal.pult.bort). Sedan
  // faller kupongen ur handen, och på pulten ligger nästa omgångs matcher.
  function removeRound() {
    const k = R.kup;
    Samtal.pult.bort(() => {
      if (R.kup !== k) return;
      if (typeof TP !== 'undefined') TP.round = null;
      const gone = () => {
        closeCoupon(true);
        if (typeof tpLoad === 'function') tpLoad(true).then(() => { if (R.on) fill(); });
      };
      if (calm() || !k.fade) {
        gone();
        return;
      }
      k.busy = true;
      R.el.classList.remove('i-handen');
      k.fade.reverse();
      k.show.reverse();
      if (k.pen) k.pen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      k.el.animate([{ transform: 'none' }, { transform: 'translate(-60px, 760px) rotate(-26deg)' }],
        { duration: 700, easing: 'cubic-bezier(0.55, 0, 0.9, 0.55)', composite: 'add', fill: 'forwards' }).finished.then(gone, gone);
    });
  }

  // ---------- pennan skriver ----------
  //
  // Motiveringen och kommentaren i efterhand skrivs för hand efter tiden, som
  // på papperet: pennan går dit och följer texten medan du skriver.
  // Motiveringen hamnar i utkastet (eller i ändringen av din inlämnade
  // kupong), kommentaren i efterhand sparas när du lämnar fältet eller
  // trycker Enter – Esc ångrar, och går den inte att spara blir den röd.

  // Pennan för motiveringen syns när matchen är tippad eller har en text –
  // platsen står kvar ändå, så att ingenting flyttar sig.
  function penShown(row) {
    const w = row && row.querySelector('.pen-mot');
    if (!w) return;
    const f = w.querySelector('input');
    w.classList.toggle('gom', row.classList.contains('tom') && !f.value.trim() && document.activeElement !== f);
  }

  function wireNotes(k) {
    const el = k.el;
    const field = (e) => (e.target.closest ? e.target.closest('input.pen-in') : null);
    el.addEventListener('focusin', (e) => {
      const f = field(e);
      if (f) penTo(f, false);
    });
    el.addEventListener('input', (e) => {
      const f = field(e);
      if (!f) return;
      const text = f.value.slice(0, NOTE_MAX);
      if (f.dataset.not != null) {
        if (k.slag === 'fyll') {
          Samtal.pult.motivera(f.dataset.not, text);
          refreshSpara();
        } else {
          if (text.trim()) k.not[f.dataset.not] = text;
          else delete k.not[f.dataset.not];
          dirty();
        }
      } else f.closest('.pen').classList.remove('fel');
      penTo(f, true);
    });
    el.addEventListener('keyup', (e) => {
      const f = field(e);
      if (f && /^(Arrow|Home|End)/.test(e.key)) penTo(f, true);
    });
    el.addEventListener('keydown', (e) => {
      const f = field(e);
      if (!f || (e.key !== 'Enter' && e.key !== 'Escape')) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape' && f.dataset.efter != null) f.value = k.efter[f.dataset.efter] || '';
      f.blur();
    });
    el.addEventListener('focusout', (e) => {
      const f = field(e);
      if (!f) return;
      f.scrollLeft = 0;
      if (f.dataset.efter != null) saveEfter(f);
      else penShown(f.closest('.row'));
      clearTimeout(k.idle);
      k.idle = setTimeout(() => {
        const a = document.activeElement;
        if (R.kup === k && !k.closing && !calm() && !(a && el.contains(a) && a.matches('input.pen-in'))) {
          penGo([{ ...PEN_VILA, l: 0.4, t: 480, e: 'cubic-bezier(0.4, 0, 0.3, 1)' }, { ...PEN_VILA, t: 160, e: 'ease-in' }]);
        }
      }, 1200);
    });
  }

  // Pennan går till där texten slutar i fältet (vid markören) och hoppar
  // lite för varje tecken som skrivs, som när man skriver för hand.
  const MATT = document.createElement('canvas').getContext('2d');
  function penTo(f, writing) {
    const k = R.kup;
    if (!k || k.closing || calm()) return;
    clearTimeout(k.idle);
    const o = spot(f);
    const cs = getComputedStyle(f);
    MATT.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const pos = f.selectionEnd == null ? f.value.length : f.selectionEnd;
    const w = MATT.measureText(f.value.slice(0, pos)).width - f.scrollLeft;
    const x = o.x + parseFloat(cs.paddingLeft) + Math.max(0, Math.min(f.clientWidth, w));
    const y = o.y + f.offsetHeight * 0.8;
    if (writing) {
      penGo([{ x: (k.at.x + x) / 2, y: y - 3, a: PEN_SKRIV, l: 0.1, t: 45, e: 'ease-out' }, { x, y, a: PEN_SKRIV, l: 0, t: 55, e: 'ease-in' }]);
      return;
    }
    const travel = Math.round(Math.min(340, Math.max(150, Math.hypot(x - k.at.x, y - k.at.y) * 0.9)));
    penGo([{ x, y, a: PEN_SKRIV, l: 0.6, t: travel, e: 'cubic-bezier(0.4, 0, 0.2, 1)' }, { x, y, a: PEN_SKRIV, l: 0, t: 70, e: 'ease-in' }]);
  }

  // Kommentaren i efterhand sparas (Samtal.pult.efter); skrev du vidare
  // medan den sparades sparas den igen.
  async function saveEfter(f) {
    const k = R.kup;
    const id = f.dataset.efter;
    const w = f.closest('.pen');
    const text = f.value.replace(/\s+/g, ' ').trim();
    if (text === (k.efter[id] || '') || w.classList.contains('skickar')) {
      if (text === (k.efter[id] || '')) w.classList.remove('fel');
      return;
    }
    w.classList.add('skickar');
    const out = await Samtal.pult.efter(id, text);
    w.classList.remove('skickar');
    if (out.ok) {
      k.efter[id] = text;
      w.classList.remove('fel');
      w.removeAttribute('title');
    } else {
      w.classList.add('fel');
      w.title = out.error || 'Det gick inte att spara.';
    }
    if (out.ok && R.kup === k && document.activeElement !== f && f.value.replace(/\s+/g, ' ').trim() !== text) saveEfter(f);
  }

  // Vem är du: pennan ringar in ditt porträtt, och stämpeln säger vem
  // omgången väntar på med dig först, som på papperet.
  function choose(b) {
    const k = R.kup;
    if (b.getAttribute('aria-pressed') === 'true' || !Samtal.pult.vem(b.dataset.vem)) return;
    for (const o of k.el.querySelectorAll('button[data-vem][aria-pressed="true"]')) {
      o.setAttribute('aria-pressed', 'false');
      eraseCross(o);
    }
    b.setAttribute('aria-pressed', 'true');
    drawRing(b.querySelector('.sm-fw'), `du${Samtal.pult.state().s.id}${b.dataset.vem}`);
    const top = Samtal.pult.top();
    const st = k.el.querySelector('.topp .pp-stamp');
    if (st && top.stamp) st.outerHTML = top.stamp;
    const q = k.el.querySelector('.hd .sm-q');
    if (q) q.outerHTML = '<span>Match</span>';
    k.el.classList.remove('need-vem');
    k.msg.textContent = '';
    refreshSpara();
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
    for (const b of k.rad.querySelectorAll('[data-spara], [data-angra]')) b.disabled = true;
    const out = await Samtal.pult.lamnaIn(k.andra ? k.tecken : null, k.andra ? k.not : null);
    if (R.kup !== k) return;
    k.busy = false;
    k.go.disabled = false;
    if (!out.ok) {
      k.msg.textContent = out.error || 'Ingen kontakt med servern.';
      if (k.andra) dirty();
      else refreshSpara();
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

  // Med fingret (eller musen nedtryckt) ser man sig omkring: scenen följer
  // med där den är större än fönstret, och släpper man den i farten glider
  // den vidare en bit. Nära tv:n, videon och med en lapp ur anslagstavlan
  // eller ett kort ur kortregistret i handen bläddrar ett svep i sidled i
  // stället, som pilarna. Klicket efter
  // ett drag öppnar ingenting.
  function swipe(el) {
    const P = { id: null };
    const frac = (d, o) => (o > 1 ? d / o : 0);
    el.addEventListener('pointerdown', (e) => {
      R.pek = e.pointerType;
      if (!e.isPrimary || e.button !== 0 || e.target.closest('#rum-vhs, input, .rum-hdr, .rum-ft')) return;
      cancelAnimationFrame(P.raf);
      Object.assign(P, { id: e.pointerId, x: e.clientX, y: e.clientY, px: R.px, py: R.py, drar: false, spar: [[e.timeStamp, e.clientX, e.clientY]] });
    });
    el.addEventListener('pointermove', (e) => {
      R.pek = e.pointerType;
      if (e.pointerType === 'mouse' && !nara()) {
        R.tx = (e.clientX / innerWidth) * 2 - 1;
        R.ty = (e.clientY / innerHeight) * 2 - 1;
      }
      if (e.pointerId !== P.id) return;
      const dx = e.clientX - P.x;
      const dy = e.clientY - P.y;
      if (!P.drar && Math.hypot(dx, dy) < 8) return;
      P.drar = true;
      if (nara()) return;
      P.spar.push([e.timeStamp, e.clientX, e.clientY]);
      if (P.spar.length > 5) P.spar.shift();
      pan(P.px - frac(dx, R.k * W - innerWidth), P.py - frac(dy, R.k * H - innerHeight));
    });
    el.addEventListener('pointerup', (e) => {
      if (e.pointerId !== P.id) return;
      P.id = null;
      if (!P.drar) return;
      P.tyst = e.timeStamp;
      const dx = e.clientX - P.x;
      const dy = e.clientY - P.y;
      if (nara()) {
        // anslagstavlan: ett svep uppåt eller neråt bläddrar bladen i lapparna
        if (R.ans && R.ans.on() && Math.abs(dy) >= 40 && Math.abs(dy) > Math.abs(dx) * 1.5) {
          R.ans.key(dy < 0 ? 'ArrowDown' : 'ArrowUp');
          return;
        }
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const k = dx < 0 ? 'ArrowRight' : 'ArrowLeft';
        if (R.zoom && R.tv) R.tv.key(k);
        else if (R.vnara && R.video) R.video.key(k);
        else if (R.ans && R.ans.on() && el.querySelector('.rum-ansn.lyft')) R.ans.key(k);
        else if (R.reg && R.reg.on() && el.querySelector('.rum-regn.lyft')) R.reg.key(k);
        return;
      }
      // farten de sista bildpunkterna, i bildpunkter per millisekund
      const [t0, x0, y0] = P.spar[0];
      const dt = Math.max(16, e.timeStamp - t0);
      let vx = (e.clientX - x0) / dt;
      let vy = (e.clientY - y0) / dt;
      if (calm() || Math.hypot(vx, vy) < 0.2) return;
      let last = performance.now();
      const step = (t) => {
        const ms = t - last;
        last = t;
        pan(R.px - frac(vx * ms, R.k * W - innerWidth), R.py - frac(vy * ms, R.k * H - innerHeight));
        vx *= 0.995 ** ms;
        vy *= 0.995 ** ms;
        if (R.on && !nara() && Math.hypot(vx, vy) > 0.02) P.raf = requestAnimationFrame(step);
      };
      P.raf = requestAnimationFrame(step);
    });
    el.addEventListener('pointercancel', (e) => { if (e.pointerId === P.id) P.id = null; });
    el.addEventListener('click', (e) => {
      if (!P.tyst || e.timeStamp - P.tyst > 600) return;
      P.tyst = 0;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  // Scenen förskjuten i fönstret: px och py (0–1) säger var i det som inte
  // ryms man står, i sidled och på höjden.
  function pan(px, py) {
    const ow = R.k * W - innerWidth;
    const oh = R.k * H - innerHeight;
    R.px = ow > 1 ? Math.min(1, Math.max(0, px)) : 0.5;
    R.py = oh > 1 ? Math.min(1, Math.max(0, py)) : 0.5;
    R.ox = -ow * R.px;
    R.oy = -oh * R.py;
    R.el.querySelector('.rum-stage').style.transform = `translate(${R.ox.toFixed(1)}px, ${R.oy.toFixed(1)}px) scale(${R.k.toFixed(4)})`;
  }

  function wire() {
    const el = R.el;
    swipe(el);
    el.addEventListener('mouseover', (e) => {
      const a = !R.kup && (e.target.closest('.rum-sak, .rum-tag, .rum-guld') || R.mag);
      hot(a ? a.dataset.nav : null);
    });
    // magneten söks när musen har stannat, och släpper när musen kommer
    // till ett föremål eller går mer än MAG från där den söktes
    const M = { t: 0, x: 0, y: 0 };
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(M.t);
      const direkt = Boolean(e.target.closest(PEKBAR));
      if (direkt || nara() || Math.hypot(e.clientX - M.x, e.clientY - M.y) > MAG * R.k) peka(null, direkt);
      if (direkt || nara()) return;
      const { clientX: x, clientY: y } = e;
      M.t = setTimeout(() => {
        M.x = x;
        M.y = y;
        if (R.on && !nara()) peka(magnet(x, y));
      }, 80);
    });
    el.addEventListener('pointerleave', () => {
      clearTimeout(M.t);
      peka(null);
    });
    el.addEventListener('click', (e) => {
      clearTimeout(M.t);
      peka(null, true);
      // kupongen i handen: ett klick utanför den lägger tillbaka den
      if (R.kup) {
        if (e.target.closest('#rum-handen, #rum-hand, .rum-hdr')) return;
        e.preventDefault();
        closeCoupon();
        return;
      }
      // anslagstavlan sköter sina lappar själv (rum-anslag.js)
      if (R.ans && R.ans.on()) return;
      // kortregistret sköter sina kort själv (rum-register.js)
      if (R.reg && R.reg.on()) return;
      // nära tv:n sköter den sina knappar och länkar själv (rum-tv.js)
      if (R.zoom && e.target.closest('#rum-tv3')) return;
      // nära videon sköter den kassetterna och knapparna själv (rum-video.js);
      // ett klick utanför hörnet går tillbaka
      if (R.vnara) {
        if (!e.target.closest('#rum-vhs, .rum-hdr, .rum-ft')) {
          e.preventDefault();
          zoomVideo(false);
        }
        return;
      }
      // nära en sak: guldordet, skårtavlan och oraklet leder vidare, och
      // allt annat går tillbaka (utom namnet, foten och fotografens länk)
      if (R.sak) {
        if (e.target.closest('.rum-hdr, .rum-ft, .rum-sakfot .foto a')) return;
        e.preventDefault();
        const l = e.target.closest('.rum-sakfot a, .rum-sak');
        const href = l && (l.closest('.rum-sakfot') || l.dataset.sak === R.sak) ? l.getAttribute('href') : null;
        if (href) sakVidare(href);
        else sak(null);
        return;
      }
      // en miss nära ett föremål räknas som en träff (inte med tangenterna,
      // e.detail 0, och inte nära tv:n)
      const a = e.target.closest(PEKBAR) || (!nara() && e.detail ? magnet(e.clientX, e.clientY, e.target) : null);
      if (a && a.matches('.rum-tag') && openCoupon()) {
        e.preventDefault();
        return;
      }
      if (a && el.contains(a)) go(a, e);
      else if (R.zoom && !e.target.closest('.rum-hdr, .rum-ft')) zoomTv(false);
    });
    document.addEventListener('keydown', (e) => {
      if (!R.on || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName) || document.querySelector('dialog[open]')) return;
      peka(null);
      const k = e.key.toLowerCase();
      // nära en sak: Esc går tillbaka, och K, T, A, R och V går dit direkt
      if (R.sak && !R.kup) {
        if (k === 'escape') {
          sak(null);
          return;
        }
        if (/^[ktarv]$/.test(k)) sak(null, null);
      }
      if (R.kup) {
        if (k === 'k' || k === 'escape') closeCoupon();
      } else if (R.ans && R.ans.on()) {
        if (R.ans.key(e.key)) e.preventDefault();
        else if (k === 'a' || k === 'escape') board(false);
      } else if (R.reg && R.reg.on()) {
        if (R.reg.key(e.key)) e.preventDefault();
        else if (k === 'r' || k === 'escape') register(false);
      } else if (k === 'k') {
        if (!openCoupon()) location.hash = 'kupong';
      } else if (R.zoom && R.tv && R.tv.key(e.key)) e.preventDefault();
      else if (R.vnara && R.video.key(e.key)) e.preventDefault();
      else if (k === 't') zoomTv(!R.zoom);
      else if (k === 'a') board(true);
      else if (k === 'r') register(true);
      else if (k === 'v') zoomVideo(!R.vnara);
      else if (k === 'escape' && R.zoom) zoomTv(false);
      else if (k === 'escape' && R.vnara) zoomVideo(false);
    });
    addEventListener('resize', fit);
    if (window.Spoiler && Spoiler.onChange) Spoiler.onChange(() => { if (R.on) fill(); });
  }

  // Scenen täcker fönstret (1600 × 1000, beskuren i kanterna); det som inte
  // ryms når man med fingret (pan).
  function fit() {
    if (!R.el || R.el.hidden) return;
    // för litet för rummet: den vanliga förstasidan (route i app.js)
    if (!fits()) {
      dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    R.k = Math.max(innerWidth / W, innerHeight / H);
    pan(R.px, R.py);
    // i telefonen på höjden: den smala kupongen, och på bredden orden
    // bredvid kupongen i handen
    const smal = innerWidth < 600 && innerHeight > innerWidth;
    R.lag = innerHeight < 500 && innerWidth > innerHeight;
    R.el.classList.toggle('lag', R.lag);
    if (smal !== Boolean(R.smal)) {
      R.smal = smal;
      R.el.classList.toggle('smal', smal);
      const [pult, vila] = PENNOR[smal ? 'smal' : 'bred'];
      Object.assign(PEN_PULT, pult);
      Object.assign(PEN_VILA, vila);
      if (R.on && !R.kup) fill();
    }
    // videon nära: hörnet ryms i det nya fönstret
    if (R.vnara) aimVideo(null);
    // närbilden: saken ryms i det nya fönstret
    if (R.sak) sak(R.sak, null);
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

  // Lysröret tänds när man kommer in (en gång per sidvisning, inte utan
  // rörelser): mörkt medan gänget laddas, minst 0,7 och högst 2,6 sekunder,
  // och sedan blinkar det igång (.rum-mork i rum.css).
  function tand(ready) {
    const m = document.getElementById('rum-mork');
    if (!m || R.tant || calm()) return;
    R.tant = true;
    const t0 = performance.now();
    m.classList.add('start');
    const tands = () => { m.classList.remove('start'); m.classList.add('tands'); };
    Promise.race([ready, new Promise((r) => setTimeout(r, 2600))])
      .then(() => setTimeout(tands, Math.max(0, 700 - (performance.now() - t0))));
    m.addEventListener('animationend', (e) => { if (e.animationName === 'rum-tands') m.classList.remove('tands'); });
  }

  // i alla fönster utom de allra minsta – i telefonen också
  const fits = () => R.q.has('rum-t') || matchMedia('(min-width: 280px) and (min-height: 260px)').matches;

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
    zoomVideo(false);
    hot(null);
    const data = load();
    // I telefonen syns världen först när filtren är bakade, datan ifylld och
    // typsnitten laddade (rummet är mörkt så länge, tand): annars ritas allt
    // en gång till medan det laddas, och minnet räckte inte.
    if (LATT && !R.visad) {
      R.visad = true;
      R.el.classList.add('laddar');
      Promise.race([Promise.all([R.bakat, data, document.fonts.ready]), new Promise((r) => setTimeout(r, 4000))])
        .then(() => new Promise((r) => requestAnimationFrame(r)))
        .then(() => {
          R.el.classList.remove('laddar');
          // 3D-delarna när rummet har ritats (och städat efter sig)
          setTimeout(() => {
            R.turStart = true;
            nasta();
          }, 800);
        });
    } else if (!R.turStart) {
      R.turStart = true;
      nasta();
    }
    // gänget klär sig efter vädret: vänta lite på det (i en fast bild tills det är hämtat)
    const ready = Promise.all([data, Promise.race([ute(), new Promise((r) => setTimeout(r, still() ? 9000 : 1500))]).then(three), R.bakat]);
    tand(ready);
    if (still()) {
      // en fast bild: allt på samma tid, och klar när datan och gänget är
      // ritade (och i telefonen resten av 3D-delarna, tur)
      ready.then(turTom).then(() => {
        freezeCss(R.frozen);
        if (q.has('rum-anslag')) {
          board(true);
          if (q.get('rum-anslag')) setTimeout(() => R.ans && R.ans.lift(q.get('rum-anslag')), 50);
        }
        if (q.has('rum-video')) zoomVideo(true);
        if (q.has('rum-sak')) sak(q.get('rum-sak'), null);
        if (q.has('rum-register') && R.reg) {
          R.reg.wait().then(() => {
            register(true);
            if (q.get('rum-register')) setTimeout(() => R.reg.lift(q.get('rum-register')), 50);
          });
        }
        frame();
        document.body.dataset.rumKlar = '1';
      });
    } else if (calm()) {
      // utan rörelser: en bild, och en ny när datan ändras
      ready.then(frame);
    } else loop();
    clearInterval(R.poll);
    // omgången och liveställningen kan ändras medan rummet står öppet
    R.poll = setInterval(() => { if (R.on) { load(); ute(); } }, 60000);
  }

  function hide() {
    if (!R.on) return;
    closeCoupon(true);
    board(false);
    register(false);
    if (R.video) R.video.stop();
    zoomVideo(false);
    sak(null, null);
    R.on = false;
    cancelAnimationFrame(R.raf);
    clearInterval(R.poll);
    R.el.hidden = true;
    document.documentElement.classList.remove('i-rummet');
  }

  return { fits, show, hide, redraw: () => { if (R.on) fill(); } };
})();
