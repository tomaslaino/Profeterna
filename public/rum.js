'use strict';

// ---------- rummet ----------
//
// Förstasidan: tobaksaffären vid spelpulten, ritad i lager
// på olika djup (CSS 3D) som vrids lite när musen rör sig. Gänget – DL, DT
// och DJ – sitter som leksaksfigurer (three.js, rum-3d.js) vid ett barbord,
// dricker öl, röker och pratar. Föremålen leder inte ut ur rummet – det gör
// bara Vanlig sida i hörnet –, utan visar sig nära, som i ett rum hos Felix
// Rieseberg:
//   tv:n zoomas in (T): text-tv med en sida per match och kupongens matcher
//   live på 377 (rum-tv.js)
//   videon på disken zoomas in (V): repriserna på VHS, på tv:n och i lådan
//   bredvid, som spelas i rutan (rum-video.js)
//   anslagstavlan lyfts ner (A): lapparna (rum-anslag.js)
//   datorn på disken kommer nära (R): terminalen med kupongen, omgången (tavlans
//   siffror), lagen och spelarna (rum-register.js, datorn i three.js i rum-dator.js)
//   uret, skårtavlan (Tipsligan), oraklet, pokalhyllan, korktavlan,
//   löpsedlarna i fönstret (IFK 1982, Nacional 1988, VM 94 och Chelsea 1998 på
//   skivan och veckans löpsedel, rum-affischer.js) och dörren (med vilka vi
//   är under): kameran går fram till dem (närbilderna, sak)
//   kupongen tas i handen (K) – fylls i eller ändras –, annars går kameran
//   fram till den på pulten.
//   högen bredvid: de inlämnade kupongerna med baksidan upp; din egen tas i
//   handen därifrån när du har lämnat in, de andras när du ser deras tips.
//   Helgarderat till höger om högen (L): veckans tidning, med namnet och rubriken
//   ovanför kupongerna; den tas upp och läses (tidningen, rum-tidning.js).
//   kupongstället på disken (N): en blank kupong för nästa omgång – veckans
//   Stryktips – tas i handen, bara att titta på (openStall).
//   kaffet och notan längst till vänster på pulten → Hasse Backe, som sitter
//   i baren utanför bilden (H): man vänder sig dit (rum-hasse.js).
// Det finns ingen meny: pekar man på ett föremål lyser det, och snabbvalet på
// text-tv:n med samma ämne tänds.
//
// Vanlig sida (#hem) är den vanliga förstasidan. I telefonen står rummet
// också: scenen fyller höjden, och man ser sig omkring med fingret (pan) –
// scenen följer med och kameran vrids som med musen. På höjden är kupongen
// smal och hög (.rum.smal), som en riktig stryktipskupong, så att den går
// att fylla i; på bredden i telefonen står orden bredvid kupongen i handen
// (.rum.lag). Rörelserna stängs av med prefers-reduced-motion.
// För bilder: ?rum-t=<sekunder> fryser
// klockan, ?rum-mx=&rum-my= kamerans läge (−1…1), ?rum-vantar=DL,DT låter
// dem sitta med kupongen som om de inte hade lämnat in, ?rum-plats=0|1|2 var
// gänget sitter vid bordet (de byter var tredje dag). ?rum-anslag visar anslagstavlan
// framme (=form, =skador … med den lappen i handen, och &rum-anslag-hasse
// med Hasses svar om den), ?rum-register
// datorn (=isak … med den sökningen). ?rum-stopp=<timmar> som
// om det var så långt kvar till spelstoppet, ?rum-tittar som om matcherna
// pågick och ?rum-mal=dl:1,dt:-1,dj:0 som om det blev mål (rätt, fel, ingen
// skillnad), ?rum-akt=dl:skamt@6 ett påhitt, ?rum-radio radion på utan ljud (=4: sedan fyra
// sekunder), ?rum-lapp=dl:kinden:kolla@2 hur skylten
// hålls och vad man gör med den (två sekunder in), ?rum-ga=dl:5 att DL går iväg
// (fem sekunder in), ?rum-video videon nära och
// ?rum-sak=ur|skar|ram|kort|pokal|kork|vm94|ifk|nacional|lopsedel|chelsea|dorr|kupong|radio en närbild,
// ?rum-radio-lage=fm:104.3 hur kassettradion står inställd (utan ljud).
//
// Läses efter kupong.js, samtal.js, tippare.js och kronan.js och använder
// deras hjälpare (state, KP, TP, gradeRow, couponNumber, currentCoupon,
// Kronan.holders, Kronan.scene, Historik.coupons …) och tv:n i rum-tv.js
// (RumTv, läses före den här), anslagstavlan i rum-anslag.js (RumAnslag,
// också före), kortregistret i rum-register.js (RumRegister, också före) och sammanställningen efter omgången i rum-block.js (RumBlock, också före). rum-3d.js (gänget), rum-saker.js (med affischerna i rum-affischer.js) och rum-inredning.js (lysröret,
// neonskylten, uret, orakelramen, paketen, kupongstället …) hämtas
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
  const GANG = { DL: '#4d8ff0', DT: '#3db37c', DJ: '#a069e6', HB: '#d9ac4e' };
  // Skyltfönstrets och dörrens glas: där har väggen hål (masken rum-hal) och
  // utsikten bakom (rum-ute.js) syns.
  const WIN = { x: 272, y: 132, w: 676, h: 426 };
  const DORR = { x: 50, y: 136, w: 172, h: 560 };
  const box = (p) => `x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"`;


  const R = { built: false, on: false, el: null, q: new URLSearchParams(location.search), t0: performance.now(), frozen: null,
    mx: 0.5, my: -0.25, tx: 0.5, ty: -0.25, raf: 0, fig: null, zoom: null, last: 0, px: 0.5, py: 0.5, pek: 'mouse', dold: new Set() };
  const still = () => R.frozen != null;
  // (RumBak.snabbt: bakåt med svepet i telefonen, då läggs det översta bort utan rörelse, rum-bak.js)
  const calm = () => still() || Boolean(window.RumBak && RumBak.snabbt) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  // det som läggs fram är ett lager för bakåt
  const lager = (namn, ut) => { if (window.RumBak) RumBak.fram(namn, ut); };
  const lagerUt = (namn) => { if (window.RumBak) RumBak.bort(namn); };
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
    <linearGradient id="rum-rwall" gradientUnits="userSpaceOnUse" x1="1140" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#6b5733"/><stop offset="1" stop-color="#382d1c"/></linearGradient>
    <linearGradient id="rum-ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2519"/><stop offset="1" stop-color="#55492f"/></linearGradient>
    <linearGradient id="rum-pult" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4a30"/><stop offset=".5" stop-color="#5a3b26"/><stop offset="1" stop-color="#3b2619"/></linearGradient>
    <linearGradient id="rum-alu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a9a96"/><stop offset=".5" stop-color="#5e5e5b"/><stop offset="1" stop-color="#2e2e2c"/></linearGradient>
    <linearGradient id="rum-counter" gradientUnits="userSpaceOnUse" x1="1060" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#472b19"/><stop offset="1" stop-color="#2a180e"/></linearGradient>
    <linearGradient id="rum-knan" gradientUnits="userSpaceOnUse" x1="0" y1="500" x2="0" y2="660"><stop offset="0" stop-color="#080401" stop-opacity=".82"/><stop offset="1" stop-color="#080401" stop-opacity=".4"/></linearGradient>
    <linearGradient id="rum-countertop" gradientUnits="userSpaceOnUse" x1="1060" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#613a23"/><stop offset="1" stop-color="#3a2113"/></linearGradient>
    <linearGradient id="rum-sill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7262"/><stop offset="1" stop-color="#958b78"/></linearGradient>
    <radialGradient id="rum-sodium" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb35c" stop-opacity=".9"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
    <radialGradient id="rum-tube" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef6ff" stop-opacity=".55"/><stop offset="1" stop-color="#eef6ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="rum-streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35c" stop-opacity=".5"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></linearGradient>
    <linearGradient id="rum-streakred" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3b30" stop-opacity=".55"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></linearGradient>
    <linearGradient id="rum-cupg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
    <radialGradient id="rum-spot" fx=".5" fy=".32"><stop offset="0" stop-color="#72613f"/><stop offset=".45" stop-color="#665737"/><stop offset=".78" stop-color="#332b1b"/><stop offset="1" stop-color="#000"/></radialGradient>
    <linearGradient id="rum-guld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e3a8"/><stop offset=".55" stop-color="#d4a650"/><stop offset="1" stop-color="#9c7230"/></linearGradient>
    <clipPath id="rum-hogerklipp"><polygon points="1140,90 1250,0 1600,0 1600,1000 1140,730"/></clipPath>
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

  // Spotarna i taket: mjukt ljus på orakelramen och på pokalhyllan med Tipsligan ([cx, cy, rx, ry, styrka] i
  // scenens mått). Ljuset är målat i väggens bild, som ritas en gång och följer väggen när kameran rör sig, och
  // ramarna, paketen och disken får samma ljus i 3D (SPOTAR i rum-inredning.js). Färgskiftningen (color-dodge)
  // gör väggen ljusare i sin egen färg, som ljus gör, i stället för att lägga en ljus hinna över den.
  const SPOT = {
    ram: [1050, 372, 150, 190, 1],
    pokal: [1370, 350, 104, 150, 0.9],
  };
  function spotYta([cx, cy, rx, ry, a], klipp = '') {
    return `<ellipse ${klipp}cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#rum-spot)" opacity="${a.toFixed(2)}" style="mix-blend-mode:color-dodge"/>`;
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

  // Bardisken längs högra väggen, som i en pub: en skiva i mörk lackad
  // mahogny med en tjock rundad kant, som sticker ut en dryg decimeter över
  // fronten så att man har plats för benen. Under kanten bär konsoler upp
  // skivan, och på fronten sitter krokar i mässing. Inne vid bakväggen syns
  // väggen i skuggan under skivan. Fronten har fyllningar i ramar. Den går från bakväggen
  // ut mot pulten, mot flyktpunkten, så allt på den är större ju längre ut
  // det är, och ramarna och krokarna står lika långt isär längs disken –
  // tätare inne vid hörnet. Ritas mellan x = a och z: i bilden (bg) och till
  // höger om den i videons hörn (vaggSvg i rum-video.js), så att disken är
  // likadan hela vägen.
  function disk(a = 1060, z = W) {
    // kanten och fronten, bildpunkter till höger om flyktpunkten vid
    // bakväggen (väggen 380); fronten möter bakväggen i x = 1115
    const [E, F] = [300, 355];
    const XF = VP[0] + F;
    // en punkt X till höger och yb högt (mätt vid bakväggen) på djupet Z
    // (bakväggen 1000), och höjden yb i kantens och frontens plan
    const p3 = (X, yb, Z) => [VP[0] + X * 1000 / Z, VP[1] + (yb - VP[1]) * 1000 / Z];
    const ky = (x, yb) => VP[1] + (yb - VP[1]) * (x - VP[0]) / E;
    const fy = (x, yb) => VP[1] + (yb - VP[1]) * (x - VP[0]) / F;
    const sy = (x, X) => VP[1] + 90 * (x - VP[0]) / X;
    const pts = (list) => list.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
    const poly = (list, fill, extra = '') => `<polygon points="${pts(list)}" fill="${fill}"${extra}/>`;
    // ett band mellan höjderna y0 och y1 i kantens (y = ky) eller frontens plan
    const band = (y, y0, y1, fill, x0, x1) => poly([[x0, y(x0, y0)], [x1, y(x1, y0)], [x1, y(x1, y1)], [x0, y(x0, y1)]], fill);
    const fa = Math.max(a, XF);
    // djupet för ram i (bakväggen 0), med ramarna en halv meter isär
    const ram = (i) => 1000 - 128.57 * i;
    const xf = (Z) => VP[0] + F * 1000 / Z;

    // fronten, och bakväggen i skuggan under skivan
    let s = poly([[fa, fy(fa, 501)], [z, fy(z, 501)], [z, 1020], [fa, 1020]], 'url(#rum-counter)');
    if (a < XF) s += poly([[a, 490], [XF, 490], [XF, 1020], [a, 1020]], 'url(#rum-knan)') +
      `<line x1="${XF}" y1="501" x2="${XF}" y2="1020" stroke="#120804" stroke-opacity=".6" stroke-width="1.2"/>`;
    // fyllningarna mellan ramarna, lite inskjutna – mörka i skuggan överst
    // och med en ljus kant där ramen till vänster vänder sig mot en
    for (let i = 0; xf(ram(i)) < z; i++) {
      const [x0, x1] = [xf(ram(i) - 7), xf(ram(i + 1) + 7)];
      if (x1 < a) continue;
      s += band(fy, 524, 712, 'rgba(0,0,0,.2)', x0, x1) + band(fy, 524, 529, 'rgba(0,0,0,.28)', x0, x1) +
        band(fy, 524, 712, 'rgba(232,184,128,.1)', x0, x0 + 2.4 * (x0 - VP[0]) / F);
    }
    // skuggan under skivan
    s += band(fy, 501, 548, 'rgba(0,0,0,.5)', fa, z) + band(fy, 548, 585, 'rgba(0,0,0,.26)', fa, z) + band(fy, 585, 630, 'rgba(0,0,0,.1)', fa, z);
    // krokarna, en mitt i varje fält
    for (let i = 0; xf(ram(i)) < z; i++) {
      const Z = ram(i + 0.5);
      if (xf(Z) < a - 20) continue;
      const q = 1000 / Z;
      const [b0, b1, b2] = [p3(F, 533, Z), p3(F - 9, 537, Z), p3(F - 8.5, 529.5, Z)];
      s += poly([p3(F, 529, Z + 2.5), p3(F, 529, Z - 2.5), p3(F, 538, Z - 2.5), p3(F, 538, Z + 2.5)], '#4a3618') +
        `<path d="M${pts([b0])} Q${pts([b1])} ${pts([b2])}" fill="none" stroke="#9a7838" stroke-width="${r1(1.3 * q)}" stroke-linecap="round"/>`;
    }
    // konsolerna i järn under skivan, vid varannan ram
    for (let i = 1; xf(ram(i)) < z + 200; i += 2) {
      const Z = ram(i);
      if (xf(Z) < a - 60) continue;
      const [t, c, b] = [p3(E + 8, 501, Z), p3(F - 4, 506, Z), p3(F, 546, Z)];
      s += `<path d="M${pts([t])} Q${pts([c])} ${pts([b])}" fill="none" stroke="#140c07" stroke-width="${r1(2.2 * 1000 / Z)}" stroke-linecap="round"/>` +
        `<path d="M${pts([t])} Q${pts([c])} ${pts([b])}" fill="none" stroke="#8a6a4a" stroke-opacity=".3" stroke-width="${r1(0.6 * 1000 / Z)}" transform="translate(-0.8 -0.4)"/>`;
    }
    // överst skivan, med en blank strimma från lysröret och fogarna mellan
    // plankorna, och kanten: ljus överst där den rundar av, mörk under
    const start = (X) => (a < VP[0] + X ? [VP[0] + X, 490] : [a, sy(a, X)]);
    const strimma = (X0, X1, fill) => poly([start(X0), [z, sy(z, X0)], [z, sy(z, X1)], start(X1)], fill);
    s += poly([...(a < 1140 ? [[a, 490], [1140, 490]] : [[a, sy(a, 380)]]), [z, sy(z, 380)], [z, ky(z, 490)], [a, ky(a, 490)]], 'url(#rum-countertop)') +
      strimma(309, 330, 'rgba(255,226,180,.05)') + strimma(313, 322, 'rgba(255,226,180,.07)') +
      [327, 346, 364].map((X) => `<polyline points="${pts([start(X), [z, sy(z, X)]])}" fill="none" stroke="#1c0c04" stroke-opacity=".22" stroke-width="1"/>`).join('') +
      strimma(300, 303.5, 'rgba(255,214,160,.22)');
    return s + band(ky, 490, 491.8, '#a87650', a, z) + band(ky, 491.8, 496.5, '#653a21', a, z) + band(ky, 496.5, 501, '#341b0d', a, z) +
      band(ky, 501, 502.6, 'rgba(0,0,0,.55)', a, z);
  }

  // Bakgrunden: taket, väggarna (furupanelen och den nikotingula högra
  // väggen), dörren, skyltfönstret och disken. Lysröret, skyltarna och
  // paketen är i 3D (rum-inredning.js).
  // Taket närmare betraktaren, i telefonen på höjden där scenen står långt ner i fönstret (pan): i
  // bakväggens plan, så att det sitter ihop med bg() när kameran vrids. Plattorna går mot flyktpunkten
  // och blir större ju närmare man kommer, lysrörets sken klingar av, och högerväggen fortsätter upp,
  // över en list där hyllorna slutar.
  function tak() {
    const [X0, X1, Y0] = [-200, 1800, -340];
    const hornX = 1250 + (-Y0 * 110) / 90;
    const fly = (x, y) => r1(VP[0] + ((x - VP[0]) * (VP[1] - y)) / VP[1]);
    const fog = [200, 560, 920].map((x) => `<line x1="${x}" y1="0" x2="${fly(x, Y0)}" y2="${Y0}"/>`).join('');
    const tvars = [[-58, 1.5], [-142, 1.9], [-262, 2.4]].map(([y, b]) => {
      const x1 = r1(1250 + (-y * 110) / 90);
      return `<line x1="${X0}" y1="${y}" x2="${x1}" y2="${y}" stroke-width="${b}"/>`;
    }).join('');
    return svg(`<defs>
    <linearGradient id="rum-tak-yta" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${Y0}"><stop offset="0" stop-color="#574532"/><stop offset=".34" stop-color="#463829"/><stop offset=".62" stop-color="#32281b"/><stop offset="1" stop-color="#1c160e"/></linearGradient>
    <radialGradient id="rum-tak-sken" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(620 0) scale(520 190)"><stop offset="0" stop-color="#a88a62" stop-opacity=".3"/><stop offset="1" stop-color="#a88a62" stop-opacity="0"/></radialGradient>
    <linearGradient id="rum-tak-vagg" gradientUnits="userSpaceOnUse" x1="0" y1="${Y0}" x2="0" y2="0"><stop offset="0" stop-color="#0a0704" stop-opacity=".62"/><stop offset="1" stop-color="#0a0704" stop-opacity="0"/></linearGradient>
    <radialGradient id="rum-tak-flack"><stop offset="0" stop-color="#140c04" stop-opacity=".34"/><stop offset=".7" stop-color="#140c04" stop-opacity=".14"/><stop offset="1" stop-color="#140c04" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${4 - Y0}" fill="url(#rum-tak-yta)"/>
  <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${4 - Y0}" fill="url(#rum-tak-sken)"/>
  <ellipse cx="318" cy="-96" rx="118" ry="30" fill="url(#rum-tak-flack)"/><ellipse cx="846" cy="-188" rx="150" ry="44" fill="url(#rum-tak-flack)"/>
  <g stroke="#000" stroke-opacity=".2" stroke-width="1.2">${fog}${tvars}</g>
  <polygon points="1250,4 ${r1(hornX)},${Y0} ${X1},${Y0} ${X1},4" fill="url(#rum-rwall)"/>
  <polygon points="1250,4 ${r1(hornX)},${Y0} ${X1},${Y0} ${X1},4" fill="url(#rum-tak-vagg)"/>
  <polygon points="1250,4 1265,-12 ${X1},-12 ${X1},4" fill="#160e08" fill-opacity=".8"/>
  <line x1="1265" y1="-12" x2="${X1}" y2="-12" stroke="#b09a74" stroke-opacity=".22" stroke-width="1.4"/>`, 'rum-tak', [X0, Y0, X1 - X0, 4 - Y0], 0.25);
  }

  // Karmens profil: ljuset fångas i ytterkanten, och mot glaset (och mittposten) ligger en fals i skugga,
  // så att karmen syns som en karm också nära (vid radion), där den annars var en slät mörk platta.
  const KARM = `<g fill="none"><path d="M262.6 568 V122.6 H957.4 V568" stroke="#d8d0bc" stroke-opacity=".2" stroke-width="1.2"/>
    <path d="M264.4 568 V124.4 H955.6 V568" stroke="#000" stroke-opacity=".18" stroke-width="1"/>
    <g stroke="#000" stroke-opacity=".5" stroke-width="1.6"><rect x="${WIN.x - 0.8}" y="${WIN.y - 0.8}" width="${WIN.w + 1.6}" height="${WIN.h + 1.6}"/><path d="M603.2 132 V558 M616.8 132 V558"/></g>
    <g stroke="#cfc8b6" stroke-opacity=".12" stroke-width="1"><path d="M610 132.5 V558"/></g></g>`;

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
  ${spotYta(SPOT.ram)}
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
  ${spotYta(SPOT.pokal, 'clip-path="url(#rum-hogerklipp)" ')}

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
  ${KARM}
  <path d="M940 122 l18 0 l0 30 l-9 -6 l-4 10 l-5 -12 z" fill="#8e8064" opacity=".5"/>

  ${disk()}
  <g stroke="#d9a878" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round">
    <line x1="1092" y1="500.5" x2="1130" y2="512"/><line x1="1236" y1="543.5" x2="1250" y2="547.5"/><line x1="1318" y1="568" x2="1372" y2="584"/><line x1="1490" y1="620" x2="1512" y2="627"/>
  </g>
  <g fill="none" stroke="#e8c89a" stroke-opacity=".1" stroke-width="1.2"><ellipse cx="1112" cy="496" rx="8" ry="2.2"/><ellipse cx="1318" cy="557" rx="12" ry="3.4"/><ellipse cx="1339" cy="562" rx="11" ry="3.2"/></g>`, '', undefined, 2 / 3) +
      // Namnet i bladguld på glaset, spegelvänt inifrån som neonskylten, i
      // en egen SVG: Chrome lägger ut text i SVG på nytt i varje bildruta
      // medan rummet vrids, och då ritades hela väggen om varje gång.
      svg(`<defs><path id="rum-dorrbage" d="M66 252 Q136 232 206 252"/></defs>
  <a class="rum-sak" role="button" tabindex="0" data-sak="dorr" aria-label="Namnet på dörren" id="rum-dorrnamn">
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
      svg('<ellipse cx="440" cy="236" rx="320" ry="200" fill="#ff4a30" opacity=".08" filter="url(#rum-b40)" class="rum-neonglow"/>', 'rum-sken', [0, 0, 900, 560], 0.25);
  }

  // Neonskylten är i 3D (rum-inredning.js) och glappar ibland (neonOn); här
  // är skenet runt den.
  function neon() {
    return svg('<ellipse cx="440" cy="168" rx="160" ry="58" fill="#ff3a2a" opacity=".28" filter="url(#rum-b24)" class="rum-neonhalo"/>', 'rum-sken', [100, 40, 680, 260], 0.25);
  }

  // ---------- de sju sakerna ----------

  // Föremålen är knappar (utan adress): de leder inte ut ur rummet. Enter
  // och mellanslag klickar på dem (wire).
  const KNAPP = 'role="button" tabindex="0"';

  // 5. Omgångens orakel: oraklet ur Olympen (Kronan.scene, fotona på
  // sockeln) under stationsuret, i en förgylld ram med mässingsskylten under
  // (båda i 3D, rum-inredning.js). Ett skimmer drar då och då över glaset.
  function frameHtml() {
    return `<a class="rum-ram rum-sak" ${KNAPP} data-nav="olympen" data-sak="ram" aria-label="Omgångens orakel">` +
      '<span class="rum-ram-list"><span class="kr-scene kr-orakel" id="rum-ram-bild"></span><span class="rum-ram-glans"></span></span></a>';
  }

  // Visitkortet: fäst med ett mässingsstift på väggen mellan stationsuret och
  // orakelramen, lite snett. Namnet, våra autografer – det vi kallas
  // (Tippoang.kallas: efternamnet, Dogge för Johansson) i var och ens handstil
  // och bläck, som på kupongen (samtal.css), med hela namnet tryckt under – och
  // devisen från Om oss. Ett klick går fram till det (närbilderna, sak). Kortet
  // ritas i sina egna mått (440 × 285) och förminskas till scenens (rum.css).
  const VISIT = [['Daniel Laino', 'M3 9 C30 14 70 13 116 4'], ['Daniel Tejder', 'M2 6 C28 15 64 3 92 10 S112 12 118 6'], ['Daniel Johansson', 'M4 11 C40 4 82 15 118 7']];
  function kortHtml() {
    const gang = VISIT.map(([n, d], i) => `<span class="vk-k${i}"><i>${Tippoang.kallas(n)}</i>` +
      `<svg viewBox="0 0 120 18" aria-hidden="true"><path d="${d}"/></svg><small>${n}</small></span>`).join('');
    return `<a class="rum-sak rum-kort" ${KNAPP} data-sak="kort" aria-label="Visitkortet" id="rum-kort"><span class="vk">` +
      '<span class="vk-namn"><img src="logo.svg" alt="" width="28" height="28" draggable="false"><b>Matchfixarna</b></span>' +
      `<span class="vk-gang">${gang}</span>` +
      '<span class="vk-devis"><b>Vi tippar engelsk fotboll tillsammans.</b><i>O det handlar om pengarna.<br>Det har alltid handlat om pengarna.</i></span>' +
      '<i class="vk-stift" aria-hidden="true"></i></span></a>';
  }

  // Högra väggen i perspektiv: ett element med väggens mått (z = djupet in
  // från hörnet, y = höjden i hörnet) vrids in mot väggen. P = 1000 px.
  const wz = (x) => 1000 * (1 - (1140 - VP[0]) / (x - VP[0]));
  function onWall(x0, x1, yb0, yb1, cls, inner, attrs) {
    const z0 = wz(x0);
    return `<a class="${cls} rum-sak" ${attrs} style="top:${yb0}px; height:${yb1 - yb0}px; width:${r1(wz(x1) - z0)}px; transform: rotateY(-90deg) translateX(${r1(z0)}px)">${inner}</a>`;
  }

  // Högra väggen i tre fält, som inte går in i varandra: anslagstavlan i
  // hörnet under tv:n, i mitten pokalhyllan med Tipsligan under (säsongen i
  // gänget: pokalerna och ställningen) och längst ut korktavlan, hela i bild. Disken under dem:
  // kortregistret under Tipsligan (rum-register.js), lådan och videon under
  // korktavlan. Måtten är [x0, x1, y0, y1] som i onWall; ramarna i 3D
  // (rum-inredning.js) får dem härifrån.
  const VAGG = {
    ans: [1144, 1296, 318, 478],
    skar: [1316, 1422, 371, 439],
    kork: [1444, 1584, 318, 478],
  };

  // 3. Korktavlan med gängets gamla kuponger, rättade med röd penna.
  // 6. Skårtavlan med Tipsligan – säsongens ställning i gänget – i vita
  //    plastbokstäver.
  // 7. Anslagstavlan under tv:n (rum-anslag.js), fri från tv:ns hylla och disken.
  function rightWall() {
    const [ans, skar, kork] = [VAGG.ans, VAGG.skar, VAGG.kork];
    return '<div class="rum-hv">' +
      (window.RumAnslag ? onWall(...ans, 'rum-ans', RumAnslag.wall(), `${KNAPP} data-nav="statistik" aria-label="Anslagstavlan" id="rum-ans"`) : '') +
      onWall(...skar, 'rum-skar', '<span class="rum-skar-in" id="rum-skar"></span>', `${KNAPP} data-nav="olympen" data-sak="skar" aria-label="Tipsligan"`) +
      onWall(...kork, 'rum-kork', '<span class="rum-kork-in" id="rum-kork"></span>', `${KNAPP} data-nav="olympen" data-sak="kork" aria-label="Korktavlan"`) +
      '</div>';
  }

  // 4. Pokalhyllan: ritas på väggen (shelves()), över Tipsligan.
  const POKAL = { yb: VAGG.skar[2] - 14, x0: VAGG.skar[0], x1: VAGG.skar[1] };
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
    // pokalerna ligger i knappen, med ytan man klickar på, så att de lyser
    // som de andra föremålen när man pekar på dem
    const hit = (x0, x1, y0, y1, inner) => `<a ${KNAPP} data-nav="olympen" data-sak="pokal" class="rum-sak rum-pokal" aria-label="Pokalhyllan">${inner}` +
      `<polygon points="${x0},${r1(at(x0, y1))} ${x1},${r1(at(x1, y1))} ${x1},${r1(at(x1, y0))} ${x0},${r1(at(x0, y0))}" fill="#fff" opacity="0"/></a>`;
    return shelf(POKAL.yb, POKAL.x0, POKAL.x1) +
      // damm på hyllkanterna
      `<polygon points="${POKAL.x0},${r1(at(POKAL.x0, POKAL.yb) - 0.6)} ${POKAL.x1},${r1(at(POKAL.x1, POKAL.yb) - 0.8)} ${POKAL.x1},${r1(at(POKAL.x1, POKAL.yb) + 0.6)} ${POKAL.x0},${r1(at(POKAL.x0, POKAL.yb) + 0.5)}" fill="#d9d2c0" opacity=".3"/>` +
      hit(POKAL.x0, POKAL.x1, POKAL.yb - 36, POKAL.yb + 6, cups);
  }

  // ---------- lagren ----------

  function table() {
    // Träet är färdiga bilder (scripts/rum/pult.mjs): samma pult som framför Hasse Backe (rum-pult.js), med
    // hörnet och geringssnittet längst till vänster. Gradienten under syns tills de är hämtade. Ringarna efter
    // glas är desamma som i hans bild och ritas när rum-pult.js är hämtad (ringar nedan). Brännmärkena skiftar
    // med dagen, mest vid askkoppen.
    let h = (Math.floor(Date.now() / 86400000) * 13 + 5) % 2147483647 || 1;
    const R0 = () => { h = (h * 16807) % 2147483647; return (h - 1) / 2147483646; };
    let spar = '';
    for (let i = 0; i < 6; i++) {
      const vid = i < 4;
      const x = r1(vid ? 1360 + R0() * 170 : 380 + R0() * 1000);
      const y = r1(vid ? 690 + R0() * 110 : 700 + R0() * 260);
      spar += `<ellipse cx="${x}" cy="${y}" rx="14" ry="4.6" fill="#0c0602" opacity=".32"/><ellipse cx="${x}" cy="${y}" rx="8" ry="2.8" fill="#0c0602" opacity=".82"/>`;
    }
    return svg(`<rect x="-10" y="650" width="1620" height="360" fill="url(#rum-pult)"/>
  <image href="rum/pult.webp" x="-10" y="650" width="1620" height="350" preserveAspectRatio="none"/><g class="rum-sol"></g>
  <rect x="-10" y="647" width="1620" height="6" fill="url(#rum-alu)"/>
  <g stroke="#e8e0cc" stroke-opacity=".35" stroke-width="1.2"><line x1="210" y1="649" x2="268" y2="649"/><line x1="720" y1="650" x2="742" y2="650"/><line x1="1302" y1="649" x2="1380" y2="649"/></g>
  <ellipse cx="800" cy="840" rx="580" ry="160" fill="#ffd9a6" opacity=".10" filter="url(#rum-b40)"/>
  <ellipse cx="460" cy="700" rx="320" ry="50" fill="#ff4a30" opacity=".10" filter="url(#rum-b40)"/>
  <g class="rum-ringar"></g>${spar}
  <image class="pult-kant" href="rum/pult-kant.webp" x="-10" y="940" width="1620" height="70" preserveAspectRatio="none"/>`, '', [0, 510, W, H - 510], 2 / 3);
  }
  // Ringarna efter glas på pulten: samma som i Hasse Backes bild (rum-pult.js), genom rummets kamera.
  function ringar(el) {
    import('./rum-pult.js').then(({ ringar: lista, iRum, L }) => {
      const d = (x, z, r) => {
        let s = '';
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * 2 * Math.PI;
          const [px, py] = iRum(x + r * Math.cos(a), L.Y, z + r * Math.sin(a));
          s += `${i ? 'L' : 'M'}${r1(px)} ${r1(py)}`;
        }
        return `${s}Z`;
      };
      let ut = '';
      for (const [x, z, r, a] of lista()) {
        const [cx, cy] = iRum(x, L.Y, z);
        if (cx < -60 || cx > 1660 || cy < 640 || cy > 1000) continue;
        ut += `<path d="${d(x, z, r)}" fill="none" stroke="#160a03" stroke-opacity="${a.toFixed(2)}" stroke-width="2.6"/>` +
          `<path d="${d(x, z, r - 5.5)}" fill="none" stroke="#160a03" stroke-opacity="${(a / 2).toFixed(2)}"/>`;
      }
      for (const g of el.querySelectorAll('.rum-ringar')) g.innerHTML = ut;
    }).catch(() => { /* utan moduler: pulten utan ringar */ });
  }

  // Fönsterbänken: skivan ovanifrån (en trapets, bredare framtill) och kanten framför. Prickarna i stenen
  // klipps efter skivan: bruset fyller annars filtrets hela rektangel, och trianglarna utanför de sneda
  // ändarna låg som en halvgenomskinlig ruta på väggen (syns nära radion, under bladet vid den).
  // Bänken ligger i bakväggens plan (-600, 1,035 gånger), så att den, radion och tomflaskorna (OGA_Z i
  // rum-3d.js) följer väggen och fönstret när rummet vrids; i gängets plan (-330) gled de upp till 15 px mot
  // fönstret. Den är ritad i scenens mått och görs lika mycket mindre som planet förstorar, så att den står
  // där den stod, och ligger över det andra i planet (.rum-bank i rum.css), som när den låg framför det.
  function bank() {
    const S = 568;
    const yta = `262,${S - 14} 958,${S - 14} 984,${S + 10} 236,${S + 10}`;
    return svg(`<clipPath id="rum-sill-yta"><polygon points="${yta}"/></clipPath>
  <g transform="translate(800 500) scale(${(1 / 1.035).toFixed(5)}) translate(-800 -500)">
  <polygon points="${yta}" fill="url(#rum-sill)"/>
  <polygon points="${yta}" filter="url(#rum-prick)" opacity=".6" clip-path="url(#rum-sill-yta)"/>
  <rect x="236" y="${S + 10}" width="748" height="12" fill="#4a453c"/>
  <g stroke="#cfc6b0" stroke-opacity=".45" stroke-width="1.6"><line x1="300" y1="${S + 10}" x2="342" y2="${S + 10}"/><line x1="610" y1="${S + 10}" x2="628" y2="${S + 10}"/><line x1="880" y1="${S + 10}" x2="930" y2="${S + 10}"/></g>
  <rect x="236" y="${S + 22}" width="748" height="6" fill="#000" opacity=".3" filter="url(#rum-b4)"/></g>`, 'rum-bank', [220, 540, 780, 75]);
  }

  // Skenet från neonen över fönsterbänken och gängets duk (rum-3d.js), i planet -330.
  function sill() {
    const S = 568;
    return (
      // det svaga skenet från neonen för sig, med en fjärdedel av bildpunkterna i telefonen
      // (inte i telefonen och inte från steg 1, .rum-svag i rum.css)
      (LATT ? '' : svg(`<ellipse cx="560" cy="${S - 150}" rx="360" ry="150" fill="#ff3a2a" opacity=".05" filter="url(#rum-b40)" class="rum-svag"/>`, 'rum-sken', [40, 120, 1040, 600], 0.25)) +
      '<canvas id="rum-3d" class="rum-3d" width="1440" height="560"></canvas>'
    );
  }

  // Tv:n i hörnet (rum-tv.js).
  const tv = () => (window.RumTv ? RumTv.html() : '');
  // Videon på disken, och väggen, disken och pulten till höger om bilden (rum-video.js,
  // som ritar disken där med disk).
  const vid = (part) => (window.RumVideo ? RumVideo.html(part, { disk }) : '');

  // Pingklockan på pulten bredvid kupongen: till uppgörelsen ringer
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
    return '<span id="rum-hogen"></span>' +
      `<a id="rum-kupong" class="rum-flat rum-kup rum-sak" ${KNAPP} data-nav="kupong" aria-label="Kupong"></a>` +
      `<a class="rum-tag rum-klocka" ${KNAPP} data-nav="kupong" id="rum-tag" aria-label="Till uppgörelsen" hidden>${bell()}</a>`;
  }

  // Hasse Backe sitter i baren utanför bilden till vänster: längst ut på
  // pulten står hans kaffe på ett fat, på notan som han har skrivit på Notts
  // County (som han lämnade efter sju veckor 2009, när lönen inte kom). Ett
  // klick, eller H, och man vänder sig dit (tillHasse, rum-hasse.js).
  function hasseHtml() {
    const kopp = `<svg class="kopp" width="150" height="124" viewBox="0 0 150 124" aria-hidden="true"><defs>
    <radialGradient id="rum-hk-skugga" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".6" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="rum-hk-fat" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="#fbf8f1"/><stop offset=".55" stop-color="#e6dfd1"/><stop offset="1" stop-color="#b4ab9a"/></radialGradient>
    <linearGradient id="rum-hk-kopp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a99f8d"/><stop offset=".22" stop-color="#ece7dc"/><stop offset=".4" stop-color="#fffdf8"/><stop offset=".72" stop-color="#ddd6c6"/><stop offset="1" stop-color="#8f8676"/></linearGradient>
    <radialGradient id="rum-hk-kaffe" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#7a4520"/><stop offset=".5" stop-color="#3f200b"/><stop offset="1" stop-color="#1d0d03"/></radialGradient>
    <linearGradient id="rum-hk-sked" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#77756f"/><stop offset=".45" stop-color="#f2f0ea"/><stop offset="1" stop-color="#8a8780"/></linearGradient></defs>
  <ellipse cx="79" cy="100" rx="72" ry="25" fill="url(#rum-hk-skugga)"/>
  <path d="M11 94 A64 21 0 0 0 139 94 L139 97.5 A64 21 0 0 1 11 97.5 Z" fill="#a1988a"/>
  <ellipse cx="75" cy="94" rx="64" ry="21" fill="url(#rum-hk-fat)"/>
  <ellipse cx="75" cy="94" rx="60" ry="19" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>
  <ellipse cx="75" cy="93" rx="38" ry="12" fill="#000" fill-opacity=".05" stroke="#c4bba8" stroke-width="1.2"/>
  <ellipse cx="81" cy="92" rx="29" ry="8.5" fill="#000" opacity=".2"/>
  <g class="sked"><path d="M106 98.5 L134 88" stroke="url(#rum-hk-sked)" stroke-width="2.8" stroke-linecap="round"/>
    <ellipse cx="101" cy="100.5" rx="6.5" ry="3.2" transform="rotate(-20 101 100.5)" fill="url(#rum-hk-sked)"/>
    <path d="M108 97.4 L131 88.8" stroke="#fff" stroke-opacity=".7" stroke-width=".8" stroke-linecap="round"/></g>
  <g class="kopp-in">
    <path d="M44 59 C30 55 24 64 27.5 71 C31 78 40 79.5 47 77" fill="none" stroke="#857c6c" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M44 58.4 C30.6 54.8 25 63.6 28.4 70.4 C31.6 77 40 78.4 46.6 76.2" fill="none" stroke="#f3efe6" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M42 52 C42 76 54 90 75 90.5 C96 90 108 76 108 52 Z" fill="url(#rum-hk-kopp)"/>
    <path d="M42.6 60 A32.4 10.3 0 0 0 107.4 60" fill="none" stroke="#2f58a8" stroke-width="2.2"/>
    <path d="M43.4 64 A31.6 10 0 0 0 106.6 64" fill="none" stroke="#2f58a8" stroke-width=".9"/>
    <path d="M50 66 C50.6 75 55 82 62 86" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
    <path d="M45 64 C46 73 50 80 55 84" fill="none" stroke="#ff5a3c" stroke-opacity=".2" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="75" cy="52" rx="33" ry="10.5" fill="#f8f5ee" stroke="#cfc8b8" stroke-width="1"/>
    <ellipse cx="75" cy="53.4" rx="29.5" ry="8.4" fill="url(#rum-hk-kaffe)"/>
    <ellipse cx="66" cy="52" rx="11" ry="2.4" fill="#c58b55" opacity=".35"/>
    <ellipse cx="86" cy="51.6" rx="5" ry="1.3" fill="#fff" opacity=".35"/></g></svg>`;
    return `<a class="rum-sak" id="rum-hasse" ${KNAPP} aria-label="Hasse Backe i baren">` +
      '<span class="nota"><span class="hd"><b>Nota</b><i>Nr 0007</i></span><span class="vem">Hasse B.</span>' +
      '<span class="r"><span>Kaffe</span><span>32:–</span></span><span class="r"><span>Påtår ×4</span><span>–</span></span>' +
      '<span class="r"><span>Kanelbulle</span><span>28:–</span></span><span class="r sa"><span>S:a</span><span>60:–</span></span>' +
      '<span class="skrivs">Skrivs på</span><span class="nc">Notts County</span></span>' +
      `${kopp}<span class="anga" aria-hidden="true"><i></i><i></i></span></a>`;
  }

  // Helgarderat ligger hel till höger om högen med de inlämnade kupongerna: ett klick, eller L, och
  // man tar upp den och läser (tidningen). Framsidan skrivs i fill (tidningPult).
  const tidningHtml = () => `<a class="rum-sak" id="rum-helgarderat" ${KNAPP} aria-label="Helgarderat"></a>`;

  // Ett klick på kaffet eller H: man vänder sig mot honom (rum-hasse.js).
  function tillHasse(a = R.el.querySelector('#rum-hasse')) {
    if (!a) return;
    if (window.RumHasse) RumHasse.oppna();
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
  // (videolådans furu: filtret räknades om i processorn varje gång hörnet
  // ritades om, också när kameran gick fram i telefonen; i datorn ska den
  // vara skarp nära)
  const BAKA = { 'rum-b1': 2, 'rum-b4': 2, 'rum-b10': 0.6, 'rum-b24': 0.5, 'rum-b40': 0.35, 'rum-grainwood': 2, 'rum-ved': 2, 'rum-flack': 2, 'rum-prick': 2, 'rum-grime': 2, ...(LATT ? { 'vhs-ved': 2, 'vhs-ved-s': 2 } : {}) };

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

  // Det mjuka ljuset i Chrome. Där ritas ett lager lika skarpt som det syns (CSS
  // zoom hjälper inte, som i Safari) och om igen när kameran går nära: vinjetten
  // och ljuset tog 18 MB var i en Pixel 10, skenet från neonen och fönsterbänken
  // 25 MB och tv:ns sken 7 MB hemma och 24 MB nära, av ungefär 200 MB. Så få
  // bildpunkter räcker till något så mjukt, så de ritas en gång till dukar, som
  // inte kostar något av ritminnet och inte ritas om.
  async function ljusDukar() {
    if (!R.el.classList.contains('chromium')) return;
    const duk = (w, h) => {
      const c = document.createElement('canvas');
      c.width = Math.ceil(w);
      c.height = Math.ceil(h);
      return c;
    };
    // en enda bakad bild i en SVG (baka); opaciteten på duken, så att den kan
    // följa neonen (.av) utan att något ritas om
    for (const s of R.el.querySelectorAll('svg.rum-sken')) {
      const im = s.firstElementChild;
      if (!im || im.tagName !== 'image' || s.childElementCount !== 1) continue;
      const href = im.getAttribute('href');
      const b = new Image();
      b.src = href;
      await b.decode();
      const vb = s.viewBox.baseVal;
      const k = b.naturalWidth / im.width.baseVal.value;
      const c = duk(vb.width * k, vb.height * k);
      c.getContext('2d').drawImage(b, (im.x.baseVal.value - vb.x) * k, (im.y.baseVal.value - vb.y) * k, b.naturalWidth, b.naturalHeight);
      c.className = `rum-layer ${im.getAttribute('class') || ''}`;
      c.setAttribute('style', s.getAttribute('style'));
      if (!im.getAttribute('class')) c.style.opacity = im.getAttribute('opacity');
      s.replaceWith(c);
      URL.revokeObjectURL(href);
    }
    // gradienter i CSS: en bild av samma bakgrund, i en fjärdedels storlek
    for (const el of R.el.querySelectorAll('.rum-warm, .rum-vign, .tv-sken')) {
      const cs = getComputedStyle(el);
      const w = parseFloat(cs.width);
      const h = parseFloat(cs.height);
      const c = duk(Math.min(w, 400), Math.min(h, 250));
      const b = new Image();
      b.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${c.width}" height="${c.height}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><foreignObject width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;background-image:${cs.backgroundImage}"></div></foreignObject></svg>`)}`;
      await b.decode();
      c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
      c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
      el.style.background = 'none';
      el.append(c);
    }
    dagDuk();
    // anslagstavlans skugga på väggen (mjuk och stilla)
    const sk = R.el.querySelector('.ans-skugga');
    if (sk) {
      const [w, h, m, k] = [sk.offsetWidth, sk.offsetHeight, 16, 0.25];
      const c = duk((w + 2 * m) * k, (h + 2 * m) * k);
      const g = c.getContext('2d');
      g.filter = `blur(${5 * k}px)`;
      g.fillStyle = 'rgba(8, 5, 2, 0.55)';
      g.fillRect(m * k, m * k, w * k, h * k);
      c.style.cssText = `position:absolute;left:${-m}px;top:${-m}px;width:${w + 2 * m}px;height:${h + 2 * m}px`;
      sk.replaceChildren(c);
    }
    // röken under taket står still i telefonen (rum.css): en duk i stället för
    // ett lager i rummets bredd (samma gradient som .rum-rok i)
    const rok = LATT && R.el.querySelector('.rum-rok');
    if (rok) {
      const c = duk(400, 75);
      const g = c.getContext('2d');
      const k = c.width / 1600;
      for (const i of rok.children) {
        const b = i.offsetWidth * k;
        const h = i.offsetHeight * k;
        g.save();
        g.globalAlpha = parseFloat(getComputedStyle(i).opacity);
        g.setTransform(b / 2, 0, 0, h / 2, (i.offsetLeft * k) + b / 2, (i.offsetTop * k) + h / 2);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
        gr.addColorStop(0, 'rgba(200, 204, 210, 0.3)');
        gr.addColorStop(0.55, 'rgba(200, 204, 210, 0.11)');
        gr.addColorStop(1, 'rgba(200, 204, 210, 0)');
        g.fillStyle = gr;
        g.fillRect(-1, -1, 2, 2);
        g.restore();
      }
      c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
      rok.replaceChildren(c);
    }
  }

  // Dagsljuset genom fönstret på en duk, som ljuset ovan. Färgen följer himlen
  // (paintUte), så duken ritas om när den ändras; samma gradient som i rum-ute.css.
  function dagDuk() {
    const d = document.getElementById('rum-dagsljus');
    if (!d || !R.el.classList.contains('chromium')) return;
    const farg = getComputedStyle(d).getPropertyValue('--dag-farg').trim() || '#c4daec';
    const sol = R.solNu || { s: 0 };
    const nyckel = `${farg}|${sol.s}|${sol.vpx}`;
    if (R.dagFarg === nyckel) return;
    R.dagFarg = nyckel;
    let c = d.firstElementChild;
    if (!c) {
      c = document.createElement('canvas');
      c.width = 400;
      c.height = 250;
      c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
      d.style.background = 'none';
      d.append(c);
    }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    const [sx, sy] = [c.width / W, c.height / H];
    g.setTransform(760 * sx, 0, 0, 520 * sy, 610 * sx, 360 * sy);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, farg);
    gr.addColorStop(0.72, 'rgba(196, 218, 236, 0)');
    g.fillStyle = gr;
    g.fillRect(-4, -4, 8, 8);
    // solens strimmor genom röken, från fönstret mot pulten
    if (sol.s > 0.02) {
      g.setTransform(sx, 0, 0, sy, 0, 0);
      if ('filter' in g) g.filter = 'blur(4px)';
      const X = (a, y) => sol.vpx + (a - sol.vpx) * (y - 380) / 272;
      g.fillStyle = `rgba(255, 214, 150, ${r1(0.5 * sol.s)})`;
      for (const [a, b] of [[250, 430], [500, 590], [650, 900]]) {
        g.beginPath();
        g.moveTo(a, 130);
        g.lineTo(b, 130);
        g.lineTo(X(b, 780), 780);
        g.lineTo(X(a, 780), 780);
        g.closePath();
        g.fill();
      }
      if ('filter' in g) g.filter = 'none';
    }
  }

  // ---------- ljuset efter klockan ----------
  //
  // Rummet var lika upplyst överallt. Nu faller eftermiddagssolen in genom skyltfönstret över pulten, och
  // på kvällen lever rummet av sina egna lampor: neonen färgar fönstret rött och tv:n väggen blå. Allt är
  // färdiga bilder i lager som redan finns (pultens SVG, .rum-warm, .rum-vign och tv:ns sken), så att
  // inget nytt ritas i varje bildruta: de byts när ljuset har ändrats märkbart, högst var 15:e minut
  // (paintUte). Fönstret vetter åt väster, så solen kommer in från lunch till solnedgången, och när den
  // står högt når den inte fram till pulten.
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rad = (g, x, y, rx, ry, rgb, a) => {
    if (a < 0.005) return;
    g.save();
    g.translate(x, y);
    g.scale(rx, ry);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, `rgba(${rgb}, ${a})`);
    gr.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = gr;
    g.fillRect(-1, -1, 2, 2);
    g.restore();
  };
  // Ritar ovanpå lagrets grund (bakad i ljusDukar; i Safari finns bara CSS-bakgrunden under).
  function ljusPa(el, y0, hojd, x0, bredd, rita) {
    if (!el) return;
    let c = el.querySelector('canvas');
    if (!c) {
      c = document.createElement('canvas');
      c.width = 400;
      c.height = 250;
      c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
      el.append(c);
    }
    const g = c.getContext('2d');
    if (!c.grund) {
      c.grund = document.createElement('canvas');
      c.grund.width = c.width;
      c.grund.height = c.height;
      c.grund.getContext('2d').drawImage(c, 0, 0);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(c.grund, 0, 0);
    g.setTransform(c.width / bredd, 0, 0, c.height / hojd, -x0 * c.width / bredd, -y0 * c.height / hojd);
    rita(g);
  }
  // Solens fläck på pulten, i en fjärdedels upplösning (kanterna är mjuka): y 650–1338 i scenens mått.
  function solBild(vpx, slut, guld) {
    const c = document.createElement('canvas');
    c.width = 405;
    c.height = 172;
    const g = c.getContext('2d');
    g.scale(0.25, 0.25);
    g.translate(10, -650);
    const y0 = 652;
    const X = (a, y) => vpx + (a - vpx) * (y - 380) / (y0 - 380);
    const form = (a, b, ya, yb, k = 1) => {
      g.beginPath();
      g.moveTo(X(a, ya), ya);
      g.lineTo(X(b, ya), ya);
      g.lineTo(X(a + (b - a) * (1 - (1 - k) / 2), yb), yb);
      g.lineTo(X(a + (b - a) * ((1 - k) / 2), yb), yb);
      g.closePath();
      g.fill();
    };
    g.fillStyle = guld > 0.4 ? '#ffd392' : '#ffe6b0';
    form(240, 585, y0, slut);
    form(612, 935, y0, slut);
    // spröjsen är luckan mellan rutorna; gängets skuggor
    g.globalCompositeOperation = 'destination-out';
    if ('filter' in g) g.filter = 'blur(4px)';
    g.fillStyle = 'rgba(0, 0, 0, 0.55)';
    for (const [x, r] of [[380, 70], [560, 76], [730, 72]]) form(x - r, x + r, 690, 860, 0.9);
    return c.toDataURL();
  }
  function ljusKlockan() {
    const v = R.vader;
    if (!v || !window.RumUte || !R.el || !R.ljusKlar) return;
    const L = RumUte.light(v);
    const h = v.timme + v.minut / 60;
    const d = 180 + (h - (v.manad >= 4 && v.manad <= 10 ? 13.2 : 12.2)) * 15 - 270;
    const s = Math.round(L.sol * sm(0.5, 4, v.sol) * (1 - sm(28, 44, v.sol)) * (1 - sm(70, 88, Math.abs(d))) * 20) / 20;
    const vpx = Math.round(Math.max(-500, Math.min(2100, 800 + 470 * Math.tan(d * Math.PI / 180))) / 40) * 40;
    const slut = Math.round((1338 - 686 * sm(18, 44, v.sol)) / 20) * 20;
    const kvall = Math.round((1 - sm(0.12, 0.45, L.dag)) * 20) / 20;
    const guld = Math.round(L.guld * 2) / 2;
    const nyckel = [s, s ? vpx : 0, s ? slut : 0, kvall, s ? guld : 0, R.smal].join('|');
    if (nyckel === R.ljusNyckel) return;
    R.ljusNyckel = nyckel;
    R.solNu = { s, vpx };
    dagDuk();
    // på pulten: i pultens egen bild, så att träet syns i ljuset och inget nytt lager behövs
    const url = s > 0.02 ? solBild(vpx, slut, guld) : '';
    const bild = (blend, a) => `<image href="${url}" x="-10" y="650" width="1620" height="688" preserveAspectRatio="none" opacity="${a}" style="mix-blend-mode:${blend}"/>`;
    for (const g of R.el.querySelectorAll('.rum-sol')) g.innerHTML = url ? bild('overlay', r1(s)) + bild('soft-light', r1(s)) : '';
    const [y0v, hv] = R.smal ? [-300, 1800] : [0, H];
    // rummet lite mörkare runt solen, och på kvällen överallt: lamporna syns bättre då
    ljusPa(R.el.querySelector('.rum-vign'), y0v, hv, 0, W, (g) => {
      if (s > 0.02) {
        const gr = g.createLinearGradient(0, 0, 0, H);
        const a = (x) => `rgba(25, 12, 4, ${r1(x * s)})`;
        gr.addColorStop(0, a(0.34));
        gr.addColorStop(0.4, a(0.1));
        gr.addColorStop(0.62, a(0.06));
        gr.addColorStop(1, a(0.3));
        g.fillStyle = gr;
        g.fillRect(0, y0v, W, hv);
      }
      if (kvall > 0.02) {
        // (mörkret går runt lamporna: neonen, tv:n och spotarna ska lysa)
        const m = document.createElement('canvas');
        m.width = 200;
        m.height = 125;
        const q = m.getContext('2d');
        q.fillStyle = `rgba(14, 8, 10, ${r1(0.34 * kvall)})`;
        q.fillRect(0, 0, 200, 125);
        q.globalCompositeOperation = 'destination-out';
        q.setTransform(200 / W, 0, 0, 125 / hv, 0, -y0v * 125 / hv);
        rad(q, 400, 130, 300, 120, '0, 0, 0', 0.9);
        rad(q, 1232, 180, 230, 150, '0, 0, 0', 0.9);
        for (const [x, y, rx, ry] of Object.values(SPOT)) rad(q, x, y, rx, ry, '0, 0, 0', 0.7);
        g.drawImage(m, 0, y0v, W, hv);
      }
    });
    // lampornas färger (i telefonen läggs ljuset ovanpå utan blandningsläge: svagare)
    const f = kvall * (LATT ? 0.55 : 1);
    ljusPa(R.el.querySelector('.rum-warm'), R.smal ? -300 : 0, R.smal ? 1800 : H, 0, W, (g) => {
      rad(g, 400, 130, 416, 300, '255, 50, 40', r1(0.42 * f));
      rad(g, 448, 460, 352, 260, '255, 60, 50', r1(0.2 * f));
      rad(g, 1376, 560, 384, 160, '255, 190, 110', r1(0.3 * f));
      rad(g, 784, 800, 544, 220, '255, 220, 160', r1(0.2 * f));
    });
    // tv:ns sken är ett eget lager som släcks med tv:n: starkare på kvällen
    ljusPa(R.el.querySelector('#rum-tvsken'), -60, 480, 1000, 620, (g) => {
      rad(g, 1310, 180, 310, 240, '70, 120, 255', r1(0.42 * f));
    });
    for (const [sel, dag, kv] of [['canvas.rum-neonglow', 0.08, 0.24], ['canvas.rum-neonhalo', 0.28, 0.34]]) {
      const n = R.el.querySelector(sel);
      if (n) n.style.setProperty('--sken', r1(dag + (kv - dag) * kvall));
    }
    ljusIhop();
  }

  // I telefonen i Chrome slås ljusets tre lager över hela skärmen (värmen, dagsljuset och vinjetten) ihop
  // till en bild. Det är samma ljus, men grafikkortet behöver bara lägga ett lager i stället för tre i
  // varje bildruta. (Källorna ligger kvar, dolda: de skrivs över när ljuset ändras.) I datorn från steg 1
  // också, där ljuset redan är utan blandningslägen som i telefonen (.enkel): i ett fönster på 2880 × 1800
  // bildpunkter är varje sådant lager 5 miljoner bildpunkter att blanda in i varje bildruta.
  function ljusIhop() {
    if (!(LATT || R.el.classList.contains('enkel')) || !R.ljusKlar || !R.el.classList.contains('chromium')) return;
    const v = R.el.querySelector('.rum-vign');
    const a = R.el.querySelector('.rum-warm');
    const d = document.getElementById('rum-dagsljus');
    const kv = v && v.querySelector('canvas');
    const ka = a && a.querySelector('canvas');
    const kd = d && d.querySelector('canvas');
    if (!kv || !ka) return;
    let c = v.querySelector('canvas.ihop');
    if (!c) {
      c = document.createElement('canvas');
      c.className = 'ihop';
      c.width = kv.width;
      c.height = kv.height;
      c.style.cssText = kv.style.cssText;
      kv.style.display = 'none';
      v.append(c);
      a.style.visibility = 'hidden';
      if (d) d.style.visibility = 'hidden';
    }
    const [y0, h] = R.smal ? [-300, 1800] : [0, H];
    const g = c.getContext('2d');
    const y = (u) => ((u - y0) / h) * c.height;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(ka, 0, y(0), c.width, y(R.smal ? 1500 : H) - y(0));
    const styrka = d ? (parseFloat(d.style.getPropertyValue('--dagsljus')) || 0) * 0.2 : 0;
    if (kd && styrka > 0.004) {
      g.globalAlpha = styrka;
      g.drawImage(kd, 0, y(0), c.width, y(H) - y(0));
      g.globalAlpha = 1;
    }
    g.drawImage(kv, 0, 0, c.width, c.height);
  }

  // Tangenterna står inte i foten utan när man pekar på saken (title), och
  // bara med tangentbord och mus.
  // (kupongstället kommer med inredningen, och tangenter körs igen då)
  const TANGENT = [['#rum-kupong', 'Kupongen', 'K'], ['#rum-tv', 'Tv:n', 'T'], ['#rum-ans', 'Anslagstavlan', 'A'], ['#rum-reg', 'Datorn', 'R'], ['.vhs-hit', 'Videon', 'V'], ['#rum-hasse', 'Hasse Backe', 'H'], ['#rum-stall', 'Nästa omgång', 'N'], ['#rum-helgarderat', 'Helgarderat', 'L']];
  function tangenter() {
    if (!matchMedia('(hover: hover)').matches) return;
    for (const [sel, namn, k] of TANGENT) {
      const e = R.el.querySelector(sel);
      if (e) {
        e.title = `${namn} · ${k}`;
        e.setAttribute('aria-keyshortcuts', k);
      }
    }
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
${plane(-600, `<div class="rum-ute" id="rum-ute"></div>${tak()}${bg()}${vid('vagg')}${rightWall()}${window.RumRegister ? RumRegister.html() : ''}${svg('<g id="rum-hyllor"></g>', '', [1300, 250, 150, 120])}${neon()}${frameHtml()}${kortHtml()}${bank()}`, 1.035)}
${plane(-598, vid('horn'), 1.035, 'rum-pl3d')}
${plane(-470, `${tv()}`, 1.02, 'rum-pl3d')}
${plane(-330, `${sill()}${haze()}`)}
${plane(-60, `${table()}<svg class="rum-pult-mer" viewBox="-10 1000 1620 340" aria-hidden="true"><image href="rum/pult-mer.webp" x="-10" y="1000" width="1620" height="340" preserveAspectRatio="none"/><g class="rum-sol"></g></svg>${vid('pult')}`, 1.05)}
${plane(0, tidningHtml() + paper() + hasseHtml())}
</div></div>
<div class="rum-layer rum-mork" id="rum-mork"><i class="a"></i><i class="b"></i></div><i class="rum-mork-ut"></i>
<div class="rum-layer rum-warm"></div><div class="rum-layer rum-dagsljus" id="rum-dagsljus"></div><div class="rum-layer rum-vign"></div><div class="rum-layer rum-grain"></div>
</div>
${window.RumAnslag ? RumAnslag.nara() : ''}
${window.RumRegister ? RumRegister.nara() : ''}
<div class="rum-hdr"><a class="rum-brand" href="#">Matchfixarna</a></div>
<div class="rum-ft"><a class="rum-vanlig" href="#hem">Vanlig sida</a><a class="rum-tillbaka" ${KNAPP} hidden>Tillbaka</a></div>`;
    document.querySelector('main').prepend(el);
    R.el = el;
    R.built = true;
    takDuk(el.querySelector('.rum-tak'));
    ringar(el);
    wire();
    // kort: högst elva tecken
    R.tv = window.RumTv ? RumTv.mount(el, { calm, sedan, short, kort: (n) => BOARD[n] || short(n), wd, hm, matches: () => (state.all && state.all.matches) || [] }) : null;
    R.ans = window.RumAnslag ? RumAnslag.mount(el, { calm, kort: (n) => BOARD[n] || short(n), close: () => board(false) }) : null;
    tangenter();
    // Foten: Vanlig sida i rummet på håll, och Tillbaka så fort något ligger framme. Det enda ordet
    // som syntes nära något var annars Vanlig sida, som leder ut ur rummet.
    if (window.RumBak && RumBak.vid) {
      const tb = el.querySelector('.rum-tillbaka');
      const vs = el.querySelector('.rum-vanlig');
      tb.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        RumBak.ned();
      });
      RumBak.vid((n) => {
        tb.hidden = !n;
        vs.hidden = Boolean(n);
      });
    }
    R.video = window.RumVideo ? RumVideo.mount(el, { calm, sedan, short, kort: (n) => BOARD[n] || short(n), aim: (f) => { R.vf = f; aimVideo(calm() ? null : 'glid'); }, latt: () => { if (R.vnara) lattVideo(R.vniva); } }) : null;
    R.reg = window.RumRegister ? RumRegister.mount(el, { calm, kort: (n) => BOARD[n] || short(n), close: () => register(false), tur: (fn) => tur(fn, 3) }) : null;
    if (LATT) for (const e of el.querySelectorAll('.ans-bak, .reg-bak')) tonaDuk(e);
    paintUte();
    R.bakat = baka().then(ljusDukar).catch((err) => console.warn('Rummet: ljuset kunde inte bakas', err)).then(() => {
      R.ljusKlar = true;
      ljusKlockan();
    });
    // gatan syns genom fönstret och dörren, och gänget och röken står i
    // dukens vänstra del (utsikten och duken är större än det de visar)
    const ute = syn(el.querySelector('#rum-ute'), DORR.x, WIN.y, WIN.x + WIN.w - DORR.x, DORR.y + DORR.h - WIN.y);
    R.gang = syn(el.querySelector('#rum-3d').parentElement, 160, 120, 860, 560);
    syn(el.querySelector('#rum-3d').parentElement, 0, 0, 1, 1).id = 'rum-radio';
    // (kassettstället bredvid radion: kameran går fram dit när ryggarna är för små nära radion)
    syn(el.querySelector('#rum-3d').parentElement, 0, 0, 1, 1).id = 'rum-kassetter';
    R.cTop = parseFloat(getComputedStyle(el.querySelector('#rum-3d')).top) || 120;
    for (const x of [ute, R.gang, el.querySelector('#rum-damm')]) sikt(x);
    // dörrens övre del, med Stängt-skylten och namnet: kameran går fram dit
    // när man klickar på namnet (närbilderna, sak)
    syn(el.querySelector('#rum-ute').parentElement, DORR.x, DORR.y, DORR.w, 200).id = 'rum-dorrglas';
  }

  // Taket ovanför scenen i telefonen på höjden (.rum.smal i rum.css) som en duk en bildpunkt bred, med
  // samma övergång uppifrån och ner. Som bakgrund ritades det i rutor över 2000 px bredd, och de längst ut
  // hann inte ritas när man drog snabbt åt sidan: det syntes som svarta hål i taket. En duk ritas aldrig om.
  function takDuk(e) {
    if (!e) return;
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 64;
    const g = c.getContext('2d');
    const t = g.createLinearGradient(0, 0, 0, 64);
    t.addColorStop(0, '#17120c');
    t.addColorStop(1, '#3a2f21');
    g.fillStyle = t;
    g.fillRect(0, 0, 1, 64);
    c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
    e.style.background = 'none';
    e.append(c);
  }

  // Toningen bakom anslagstavlan och kortregistret som en liten duk i telefonen,
  // med samma övergång från mitten mot kanterna. Som CSS-bakgrund tar den 10 MB av
  // ritminnet (och med svagt minne saknades en del av den, så att rummet var mörkt
  // upptill och ljust nedtill): en duk ligger utanför ritminnet och ritas aldrig om.
  function tonaDuk(e) {
    const c = document.createElement('canvas');
    c.className = e.className;
    c.width = c.height = 48;
    c.style.cssText = 'width:100%; height:100%; background:none';
    const g = c.getContext('2d');
    g.setTransform(48, 0, 0, 48, 0, 0);
    const t = g.createRadialGradient(0.5, 0.48, 0, 0.5, 0.48, 0.75);
    t.addColorStop(0, 'rgba(10, 8, 6, 0.55)');
    t.addColorStop(1, 'rgba(10, 8, 6, 0.88)');
    g.fillStyle = t;
    g.fillRect(0, 0, 1, 1);
    e.replaceWith(c);
  }

  // Gängets kuponger på pulten är tre lager på 10 MB var. I telefonen tas de bort
  // medan kameran står vid anslagstavlan eller kortregistret, där de bara skymtar i
  // hörnet under toningen: annars räcker inte ritminnet till det man tittar på, och
  // bitar av tavlan försvinner och kommer tillbaka.
  // (Tillbaka först när kameran har kommit hem, där de ligger utanför bilden i telefonen: annars ska
  // de ritas medan kameran är på väg, och då saknas bitar av annat i stället.)
  function hogenBort(borta) {
    if (!LATT) return;
    clearTimeout(R.hogenT);
    R.hogenT = setTimeout(() => {
      const h = document.getElementById('rum-hogen');
      if (h) h.style.visibility = borta ? 'hidden' : '';
    }, calm() ? 0 : borta ? 450 : 800);
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

  // Kortare lagnamn på papperet (Papper.kort, samma i förstasidans ruta).
  const short = (name) => Papper.kort(name);
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
  const crossSvg = (key, kula = false, hasse = false) => `<svg class="kryss${kula ? ' kula' : ''}${hasse ? ' hasse' : ''}" viewBox="0 0 40 19" preserveAspectRatio="none" aria-hidden="true">${(hasse ? slarv(key) : strokes(key)).map((s) => `<path d="${s.d}" pathLength="1"/>`).join('')}</svg>`;
  // Hasse Backes kryss (rum-hasse-kupong.js): samma penna men större och med mer fart, ut över
  // rutans kanter och med en svans på det andra draget. Slarvigt, men det går inte att ta miste på.
  function slarv(key) {
    const R0 = rng(seed(`hasse${key}`));
    const j = (n) => (R0() - 0.5) * 2 * n;
    return [[3, -3.5, 37, 21.5], [36.5, -4, 1, 24]].map(([x1, y1, x2, y2]) => {
      const a = [x1 + j(2.4), y1 + j(1.4)];
      const b = [x2 + j(2.4), y2 + j(1.4)];
      const c = [(a[0] + b[0]) / 2 + j(3.4), (a[1] + b[1]) / 2 + j(2.4)];
      return { a, b, c, d: `M${r1(a[0])} ${r1(a[1])}Q${r1(c[0])} ${r1(c[1])} ${r1(b[0])} ${r1(b[1])}` };
    });
  }
  // Vilka kryss som är hans, för den här omgången (på enheten). Tar man bort ett och kryssar själv är det ditt.
  const HASSES = 'profeterna.hasse.kryss';
  function hassesKryss(id) {
    try {
      const j = JSON.parse(localStorage.getItem(HASSES));
      return j && j.id === id ? j.k || {} : {};
    } catch (e) { return {}; }
  }
  function hasseSkrev(id, key, ja) {
    const k = hassesKryss(id);
    if (ja) k[key] = 1;
    else delete k[key];
    try { localStorage.setItem(HASSES, JSON.stringify({ id, k })); } catch (e) { /* då är det ett vanligt kryss nästa gång */ }
  }
  // Det han har ändrat i din inlämnade kupong och inte lämnat in än, för att den inte följer regeln
  // (rum-hasse-kupong.js): {matchens id: tecken}. Det står på kupongen när du tar den i handen, med
  // Lämna in ändringen tänd. Gäller bara så länge det inlämnade är som när han skrev (bas; alla: ändå).
  const HASSES_ANDRING = 'profeterna.hasse.andring';
  const tSig = (t) => Object.keys(t).filter((k) => t[k]).sort().map((k) => `${k}:${t[k]}`).join(',');
  function hassesAndring(p, alla = false) {
    if (!p || p.fyll || !p.andra) return {};
    try {
      const j = JSON.parse(localStorage.getItem(HASSES_ANDRING));
      return j && j.id === p.s.id && j.vem === p.vem && (alla || j.bas === tSig(p.tecken)) ? j.t || {} : {};
    } catch (e) { return {}; }
  }
  function hasseAndrade(p, t) {
    try {
      if (p && t && Object.keys(t).length) localStorage.setItem(HASSES_ANDRING, JSON.stringify({ id: p.s.id, vem: p.vem, bas: tSig(p.tecken), t }));
      else localStorage.removeItem(HASSES_ANDRING);
    } catch (e) { /* då står det bara hos honom */ }
  }

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
  // kupongens mitt i x på pulten, och var man står i telefonen på höjden (fit)
  const HEM_SMAL = 625;
  const kupX = () => (R.smal ? 640 : 760);
  // På höjden är pulten låg (pan), så kupongen ligger mindre och närmare pultens kant, och i handen
  // och högen räknas allt från den mitten och storleken (rum.css).
  const kupY = () => (R.smal ? 819 : 853);
  const kupLigg = () => (R.smal ? 0.8 : 1);
  // hur stor del av det scenen inte fyller på höjden som hamnar över den (taket), och var i scenen
  // pingklockan under kupongen slutar, som måste rymmas i fönstret (pan)
  const TAK_SMAL = 0.6;
  const FOT_SMAL = 1090;
  const PENNOR = { bred: [{ x: 276.4, y: 340.6, a: -11 }, { x: 362, y: 440, a: -6 }], smal: [{ x: 268, y: 610, a: -5 }, { x: 268, y: 612, a: -2 }] };
  const PEN_PULT = { ...PENNOR.bred[0] };
  const PEN_VILA = { ...PENNOR.bred[1] };
  const PEN_SKRIV = -38;
  const penStyle = (p) => { const s = penAt(p); return `transform: ${s.transform}; filter: ${s.filter}`; };

  // Slitaget på kupongen. Varje kupong har haft sitt eget liv: vikt på mitten,
  // på tvären, i fyra eller med ett snett veck, en kaffekopp ställd på den
  // (ibland två gånger), några stänk, ett tumavtryck av blyerts, ett hörn som
  // vikts in, mer eller mindre gulnad och ibland mörkare från ena sidan. Allt
  // slumpas ur omgången och vems kupong det är (kupNyckel), så att samma kupong
  // ser likadan ut på pulten, i handen, i högen och hos Hasse – utkastet och den
  // inlämnade är samma papper – men ingen är den andra lik (förut hade alla
  // samma kaffering och samma veck). Det tryckta – bandet, synkmarkeringarna,
  // tryckeriets rad – är likadant på alla. Bara gradienter, inga bilder eller
  // filter, så att rummet inte får mer att rita. Allt slumpas i samma ordning
  // på båda sidor; bak (högen, gängets kupong med baksidan upp) visar bara det
  // som syns igenom, spegelvänt (rum.css): vecken, hörnet och kaffet.
  const kupNyckel = (omg, vem) => `${omg || ''}|${vem || '?'}`;
  const KAFFE = '112, 66, 22';
  const LJUS = '255, 250, 238';
  const VECK = '90, 58, 22';
  function slitage(key, bak = false) {
    const r = rng(seed(`slitage:${key}`));
    const sp = (a, b) => a + r() * (b - a);
    const o = (x) => x.toFixed(3);
    const pc = (x) => `${r1(x)}%`;
    const at = (x, y, dx = 0, dy = 0) => `calc(${pc(x)} + ${r1(dx)}px) calc(${pc(y)} + ${r1(dy)}px)`;
    // gulnat, och ibland mörkare från en sida (solen, en låda)
    const gul = sp(0, 0.16);
    const kant = [sp(38, 62), sp(34, 54), sp(0, 0.18)];
    const sida = r() < 0.4 ? [['right', 'left', 'bottom', 'top'][Math.floor(r() * 4)], sp(0.08, 0.2)] : null;
    // vecken: ingen, på mitten, på tvären, i fyra eller ett snett; åt vilket
    // håll vecket gick (vilken sida skuggan hamnar på) och hur hårt det drogs
    const typ = r();
    const veck = [];
    if (typ >= 0.15 && typ < 0.7) veck.push([90 + sp(-2.5, 2.5), sp(45, 55)]);
    if (typ >= 0.5 && typ < 0.88) veck.push([180 + sp(-2, 2), sp(43, 57)]);
    if (typ >= 0.88) veck.push([sp(76, 114), sp(22, 78)]);
    const vk = veck.map(([deg, x]) => (r() < 0.5 ? [deg, x] : [deg + 180, 100 - x]).concat(sp(0.1, 0.2)));
    // kaffet: koppen ställd en gång, ibland två
    const kopp = r() < 0.55 ? { x: sp(12, 88), y: sp(22, 88), rad: sp(36, 54), oval: sp(0.95, 1.04), s: sp(0.18, 0.32), igen: r() < 0.35 ? [sp(0, 2 * Math.PI), sp(9, 24), sp(0.4, 0.7)] : null } : null;
    // stänk i en eller två klungor
    const stank = [];
    for (let n = r() < 0.5 ? 1 + Math.floor(r() * 2) : 0; n > 0; n--) {
      const [x, y] = [sp(6, 94), sp(16, 95)];
      for (let m = 2 + Math.floor(r() * 5); m > 0; m--) stank.push([x, y, (r() + r() - 1) * 20, (r() + r() - 1) * 20, sp(1, 3.2), sp(0.1, 0.3)]);
    }
    // tumavtryck av blyerts, och ett hörn som vikts in och slätats ut igen
    const tumme = r() < 0.35 ? [sp(8, 92), sp(50, 95), sp(10, 15), sp(13, 20), sp(0.05, 0.1)] : null;
    const horn = r() < 0.3 ? { c: Math.floor(r() * 4), a: sp(28, 70), b: sp(0.75, 1.3), s: sp(0.1, 0.18), ljus: sp(0.06, 0.16) } : null;

    const lag = [];
    if (horn) {
      const [dir, pos] = [['to bottom right', 'left top'], ['to bottom left', 'right top'], ['to top right', 'left bottom'], ['to top left', 'right bottom']][horn.c];
      lag.push(`linear-gradient(${dir}, rgba(${LJUS}, ${o(horn.ljus)}) 0 calc(50% - 1px), rgba(${VECK}, ${o(horn.s)}) 50%, rgba(${LJUS}, ${o(horn.s * 2)}) calc(50% + 1px), rgba(${LJUS}, 0) calc(50% + 2.5px))` +
        ` ${pos} / ${r1(horn.a)}px ${r1(horn.a * horn.b)}px no-repeat`);
    }
    for (const [deg, x, s] of vk) {
      lag.push(`linear-gradient(${r1(deg)}deg, rgba(${VECK}, 0) calc(${pc(x)} - 7px), rgba(${VECK}, ${o(s * 0.3)}) calc(${pc(x)} - 1px), rgba(${VECK}, ${o(s)}) ${pc(x)},` +
        ` rgba(${LJUS}, ${o(s * 2.2)}) calc(${pc(x)} + 1px), rgba(${LJUS}, 0) calc(${pc(x)} + 3px))`);
    }
    if (kopp) {
      const ring = (dx, dy, s) => `radial-gradient(${r1(kopp.rad)}px ${r1(kopp.rad * kopp.oval)}px at ${at(kopp.x, kopp.y, dx, dy)}, rgba(${KAFFE}, ${o(s * 0.12)}) 0 78%,` +
        ` rgba(${KAFFE}, ${o(s * 0.5)}) 88%, rgba(${KAFFE}, ${o(s)}) 95%, rgba(${KAFFE}, 0) 100%)`;
      const s = kopp.s * (bak ? 0.45 : 1);
      lag.push(ring(0, 0, s));
      if (kopp.igen) lag.push(ring(Math.cos(kopp.igen[0]) * kopp.igen[1], Math.sin(kopp.igen[0]) * kopp.igen[1], s * kopp.igen[2]));
    }
    if (!bak) {
      for (const [x, y, dx, dy, rad, s] of stank) lag.push(`radial-gradient(${r1(rad)}px at ${at(x, y, dx, dy)}, rgba(${KAFFE}, ${o(s)}) 0 55%, rgba(${KAFFE}, 0) 100%)`);
      if (tumme) lag.push(`radial-gradient(${r1(tumme[2])}px ${r1(tumme[3])}px at ${at(tumme[0], tumme[1])}, rgba(70, 68, 66, ${o(tumme[4])}), rgba(70, 68, 66, 0))`);
    }
    if (sida) lag.push(`linear-gradient(to ${sida[0]}, rgba(196, 150, 86, ${o(sida[1])}), rgba(196, 150, 86, 0) 45%)`);
    lag.push(`radial-gradient(130% 120% at ${pc(kant[0])} ${pc(kant[1])}, rgba(122, 86, 40, 0) 55%, rgba(122, 86, 40, ${o(kant[2])}))`,
      `linear-gradient(rgba(196, 160, 106, ${o(gul)}), rgba(196, 160, 106, ${o(gul)}))`);
    return `<span class="slit${bak ? ' bak' : ''}" aria-hidden="true" style="background: ${lag.join(', ')}"></span>`;
  }

  // Kupongen på pulten och i handen: samma kupong som papperet under Kupong
  // (samtal.js), i kupongens mått. Bandet, under det stämpeln (vem omgången
  // väntar på) och spelstoppet, namnet för hand och 1 X 2 överst, en rad per match
  // med synkmarkeringen i kanten och fälten och streckkoden i foten. v säger
  // vems kupong det är (view): utan v gängets kryss om kupongen finns.
  //   fyll  ditt utkast: dina kryss och motiveringar, ditt namn
  //   din   din inlämnade kupong, med stämpeln Inlämnad
  //   las   någon annans inlämnade kupong, med hens namn
  //   gang  gängets kupong i uppgörelsen: gängets kryss med kulspetspenna och
  //         i rutorna porträtten för dem som har med tecknet, som på papperet,
  //         och allas namn överst
  // Motiveringen står för hand med blyerts efter tiden, kommentaren i
  // efterhand i bläck efter den (som pennan på papperet). Utfallet ringas in:
  // grönt när kupongen hade det, annars rött, streckat medan matchen pågår.
  // hand: kupongen i handen, där rutorna, namnen för dem du kan vara och
  // pennorna är knappar och fält – på din kupong och gängets så länge de går
  // att ändra.
  // Minut och ställning på raden när matchen är igång: grön märkpenna bakom
  // ställningen när kupongen har det tecknet just nu, annars röd (.lv i rum.css).
  // Inget när resultaten är dolda (spoilerskyddet: läget är då hidden), och ingen
  // färg när ställningen inte är den som rättas (förlängning, res saknas).
  function liveRad(g, sign) {
    if (!g) return '';
    if (g.state === 'off') return `<span class="min">${esc(g.off || '')}</span>`;
    if ((g.state !== 'live' && g.state !== 'final') || !g.score) return '';
    const tid = g.state === 'live' ? (g.clock === 'HT' ? 'Paus' : g.clock || 'pågår') : g.extra || 'Slut';
    const cls = g.res == null || !sign ? '' : sign.includes(SIGNS[g.res]) ? ' ok' : ' no';
    return `<span class="min">${esc(tid)}</span><b class="res${cls}">${g.score.home}–${g.score.away}</b>`;
  }
  // Ringen runt utfallet: grön eller röd, streckad medan matchen pågår.
  function ringKlass(g, sign, res) {
    const hit = sign.includes(SIGNS[res]) ? ' ok' : ' no';
    return g.state === 'live' ? ` live${sign ? hit : ''}` : hit;
  }

  function couponHtml(rd, rows, v = null, hand = false) {
    // omgången är spelad: bara Hasse Backes protokoll ligger på pulten (rum-block.js), tills nästa
    // kupong kommer måndagen efter kl. 16 (autoRound i worker/samtal.mjs)
    if (v && v.slag === 'gang' && !hand && R.summa) return RumBlock.html(R.summa, { tat: Boolean(R.smal) });
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
    const hans = v && (slag === 'fyll' || slag === 'din') && rd && rd.id ? hassesKryss(rd.id) : {};
    // uppgörelsen: de omtvistade matcherna, och vilka av dem som är klubbade
    // (samma som på papperet under Kupong)
    const strid = new Set(slag === 'gang' && v.g ? v.g.strid : []);
    const klar = new Set(slag === 'gang' && v.g ? v.g.klar : []);
    // (en match från Svenska Spel som inte finns på sajten har ingen tävling, openStall)
    const list = !order.length && rd && rd.tomma ? tomma(rd.tomma) : order.map((x, i) => {
      const sign = signs[x.id];
      const comp = x.m.comp ? compOf(x.m.comp) : null;
      const started = !(Date.parse(x.m.kickoff) > now);
      // i handen står matcher som har startat kvar som de var, som på papperet;
      // gängets tecken går att fylla i till en stund efter avspark (fillable)
      const edit = hand && (slag === 'gang' ? fillable(x.m, now) : !started && (slag === 'fyll' || slag === 'din'));
      const locked = hand && started && (slag === 'fyll' || slag === 'din');
      const res = x.g && x.g.res != null ? x.g.res : null;
      const ring = res == null ? '' : ringKlass(x.g, sign, res);
      const label = `${x.m.home} – ${x.m.away}`;
      const lv = liveRad(x.g, sign);
      // gängets kupong i handen: Svenska Spels siffror under rutorna (rader, Folket)
      const tal = hand && slag === 'gang' && v.spel;
      const talRad = tal ? v.spel.rader[x.id] : null;
      const box = (s, j) => {
        const on = sign.includes(s);
        const inner = `<i>${s}</i>${slag === 'gang' ? seats(v, x.id, j) : ''}${on ? crossSvg(`${x.id}${s}`, kula, Boolean(hans[`${x.id}${s}`])) : ''}` +
          (res === j ? Papper.ring(`${x.id}${s}`, `rum-ring${ring}`, 25) : '') +
          (tal ? `<span class="tal" data-j="${j}">${talRad ? esc(Folket.tal(talRad, j, Folket.vald(v.spel))) : ''}</span>` : '');
        return edit
          ? `<button type="button" class="box${on ? ' x' : ''}" data-s="${s}" aria-pressed="${on}" aria-label="${esc(`${label}: ${s}`)}">${inner}</button>`
          : `<span class="box${on ? ' x' : ''}">${inner}</span>`;
      };
      // i handen är lagen en knapp: matchbladet läggs på kupongen (lagen, rum-matchblad.js)
      const tm = hand ? 'button' : 'span';
      const st = strid.has(x.id);
      return `<div class="row${sign ? '' : ' tom'}${locked ? ' locked' : ''}${st ? ' strid' : ''}${st && klar.has(x.id) ? ' klubbad' : ''}${lv ? ' startad' : ''}${tal && Object.keys(v.spel.rader).length ? ' talrad' : ''}" data-id="${esc(x.id)}">` +
        `<span class="pp-nr">${i + 1}${st ? nrRing(x.id, klar.has(x.id)) : ''}</span>` +
        // på den smala kupongen (telefonen) de kortare namnen (short, .kort i rum.css)
        `<span class="m"><${tm} class="pp-tm"${hand ? ` type="button" data-lagen aria-label="${esc(`${label}: lagen`)}"` : ''}>` +
        `<span class="lang">${esc(x.m.home)}<span class="vs"> – </span>${esc(x.m.away)}</span>` +
        `<span class="kort">${esc(short(x.m.home))}<span class="vs"> – </span>${esc(short(x.m.away))}</span></${tm}>` +
        `<span class="pp-small">${esc(fWeekdayTime.format(new Date(x.m.kickoff)))}${comp ? ` · ${esc(comp.short)}` : ''}${locked ? ' · har startat' : ''}</span>` +
        notes(v, x.id, label, { sign, started, hand, ink }) + `<span class="lv">${lv}</span></span>` +
        SIGNS.map(box).join('') + '</div>' +
        // gängets kupong i handen: vad var och en har skrivit, under raden
        (hand && slag === 'gang' ? `<div class="kom" data-id="${esc(x.id)}">${komHtml(v, x.id)}</div>` : '');
    }).join('');
    const p = v ? pult(rd) : null;
    const top = p ? Samtal.pult.top(hand && slag === 'fyll' && p.fyll, slag === 'las' ? v.vem : null) : null;
    const id = rd && !rd.next ? rd.id || (rd.coupon && rd.coupon.id) : null;
    // slitaget: samma papper för samma omgång och person – ditt utkast och din
    // inlämnade är ett, gängets kupong ett annat, och den nya på pulten när du
    // har lämnat in ännu ett
    const nyckel = kupNyckel(rd ? rd.id || (rd.coupon && rd.coupon.id) || rd.ids.join(',') : '', !v ? 'ny' : slag === 'gang' ? 'gang' : v.vem);
    const band = `<span class="band"><small>MATCHFIXARNA · TIPSKUPONG</small><b>${nr ? `Kupong ${nr}` : 'Kupong'}</b></span>`;
    const flikar = hand && slag === 'gang' && v.spel;
    const hd = `<span class="hd${flikar && Object.keys(v.spel.rader).length ? ' medflik' : ''}"><span>Nr</span><span class="m">${top && top.vem && hand && slag === 'fyll' ? '<span class="sm-q">Vem är du?</span>' : '<span class="hd-match">Match</span>'}` +
      (flikar ? `<span class="flikar" role="group" aria-label="Siffrorna under rutorna">${Folket.flikar(v.spel)}</span>` : '') +
      `${top ? `<span class="sm-namnen${slag === 'gang' ? ' alla' : top.vem && hand && slag === 'fyll' ? ' val' : ''}">${top.namn}</span>` : ''}</span><span>1</span><span>X</span><span>2</span></span>`;
    return band +
      `<span class="topp">${top ? top.stamp : ''}<span class="pp-stop"><span>Spelstopp</span><b>${first ? esc(fWeekdayTime.format(new Date(first))) : '–'}</b></span></span>` +
      hd + list +
      `<span class="fot">${v ? Samtal.pult.fields(signs, slag === 'gang') : ''}${id ? Papper.code(id) : ''}</span>` +
      slitage(nyckel) +
      (slag === 'din' || slag === 'las' ? '<span class="stampel">Inlämnad</span>' : '') +
      // gängets kupong på pulten ligger med baksidan upp tills den vänds
      (slag === 'gang' && !hand && p && !vand(p) ? vandHtml(band + hd + list, top, slitage(nyckel, true)) : '') +
      `<span class="pencil${slag === 'gang' || (!v && order.some((x) => x.sign)) ? ' kula' : ''}" style="${penStyle(PEN_PULT)}"><i></i></span>`;
  }

  // n blanka rader: numret och rutorna, utan match (kupongstället när ingen omgång är öppen)
  const tomma = (n) => Array.from({ length: n }, (_, i) => `<div class="row tom"><span class="pp-nr">${i + 1}</span><span class="m"></span>` +
    `${SIGNS.map((s) => `<span class="box"><i>${s}</i></span>`).join('')}</div>`).join('');

  // Pennan i ett fält: samma penna som på papperet under Kupong.
  const PEN = '<svg class="sm-pen" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6 2.9l2.5 2.5-7.6 7.6-3.2.7.7-3.2z"/><path d="M9 4.5l2.5 2.5"/></svg>';
  const field = (kind, id, text, label, cls = '') => `<label class="pen pen-${kind}${cls}">${PEN}` +
    `<input type="text" class="pen-in" data-${kind === 'mot' ? 'not' : 'efter'}="${esc(id)}" maxlength="${NOTE_MAX}" autocomplete="off" enterkeyhint="done" placeholder=" "` +
    ` aria-label="${esc(`${kind === 'mot' ? 'Motivering för' : 'Kommentar till'} ${label}`)}" value="${esc(text)}"></label>`;

  // Det som står för hand efter tiden: motiveringen och kommentaren i
  // efterhand – i handen som fält där du kan skriva. Pennan för motiveringen
  // kommer när matchen är tippad, men platsen står där ändå, så att ingenting
  // flyttar sig. Kommentaren i efterhand skrivs när matchen har startat (före
  // det bara om du redan har skrivit något), som på papperet. Utanför handen
  // står det som text, likadant på alla kuponger i rummet – också på gängets
  // kupong på pulten, så att det man skrev i handen står kvar när den läggs
  // tillbaka.
  function notes(v, id, label, { sign, started, hand, ink }) {
    if (!v) return '';
    const mot = (v.not && v.not[id]) || '';
    const eft = (v.efter && v.efter[id]) || '';
    const k = ` sm-k${ink}`;
    let html = '';
    if (hand && !started && (v.slag === 'fyll' || v.slag === 'din')) html += field('mot', id, mot, label, sign || mot ? '' : ' gom');
    else if (mot) html += `<span class="mot" title="${esc(mot)}">${esc(mot)}</span>`;
    // gängets kupong på pulten: i en omtvistad match förklarar en, i sitt bläck
    // (skal); platsen står där också när ingen har skrivit något, så att den kan
    // fyllas. I handen står allas kommentarer under raden (komHtml).
    const strid = !hand && v.slag === 'gang' && !started && v.g && v.g.strid.includes(id);
    if (strid) html += `<span class="skal">${skal(v.g, id, v.tecken)}</span>`;
    if (hand && v.skriv && (v.slag === 'din' || v.slag === 'gang') && (started || eft)) html += field('eft', id, eft, label, k);
    else if (eft) html += `<span class="eft${k}" title="${esc(eft)}">${esc(eft)}</span>`;
    return html ? `<span class="not">${html}</span>` : '';
  }

  // Vad någon har skrivit om matchen: motiveringen och kommentaren i
  // efterhand (seats, och ordPa i telefonen).
  const said = (v, id, vem) => ({ mot: (v.notes && v.notes[id] && v.notes[id][vem]) || '', eft: (v.after && v.after[id] && v.after[id][vem]) || '' });

  // Gängets kupong i handen: var och ens motivering från sin egen kupong och
  // kommentar i efterhand, med porträtt och i sitt bläck, under matchen. Raden
  // blir högre bara där någon har skrivit. Din egen kommentar i efterhand står i
  // fältet på raden (notes), där du skriver den.
  function komHtml(v, id) {
    const gang = (KP.data && KP.data.samtal && KP.data.samtal.gang) || [];
    return gang.map((g, i) => {
      const { mot, eft } = said(v, id, g.id);
      const namn = String(g.namn || g.id);
      const bild = g.bild ? `<img src="${esc(g.bild)}" alt="${esc(namn)}" width="14" height="14" decoding="async" draggable="false">` : '';
      return [mot, v.skriv && g.id === v.vem ? '' : eft].filter(Boolean)
        .map((t) => `<p class="sm-k${i}" title="${esc(namn)}">${bild}<span>${esc(t)}</span></p>`).join('');
    }).join('');
  }

  // Uppgörelsen: de tre kupongerna lagda på varandra. Var och ens kryss står
  // kvar i rutan, litet och i ens bläck, på sin plats (samma ordning som
  // namnen överst), så att rutan blir mörkare ju fler som har med tecknet;
  // gängets kryss med kulspetspennan står över dem. När man pekar på ett kryss
  // motiveringen och kommentaren i efterhand – i telefonen med ett långt tryck
  // på rutan (ordPa).
  function seats(v, id, j) {
    const gang = (KP.data && KP.data.samtal && KP.data.samtal.gang) || [];
    const who = (v.who && v.who[id] && v.who[id][j]) || [];
    return '<span class="sits">' + gang.map((g, i) => {
      if (!who.includes(g.id)) return '<b></b>';
      const { mot, eft } = said(v, id, g.id);
      return `<b class="sm-k${i}" title="${esc(`${g.id}${mot ? `: ${mot}` : ''}${eft ? `\nEfteråt: ${eft}` : ''}`)}">${smaKryss(`${id}${SIGNS[j]}${g.id}`)}</b>`;
    }).join('') + '</span>';
  }
  // Den som förklarar en omtvistad match, i sitt bläck – raden blir inte
  // högre, så det är en: den som avviker, annars den vars tips gängets tecken
  // (val) lämnar mest utanför just nu, annars den första som har skrivit
  // något. Hela motiveringen när man pekar. g: Samtal.pult.gang().
  function skal(g, id, val) {
    const gang = (KP.data && KP.data.samtal && KP.data.samtal.gang) || [];
    const said = (x) => (g.notes && g.notes[id] && g.notes[id][x]) || '';
    const tips = (x) => SIGNS.filter((s, j) => ((g.who[id] && g.who[id][j]) || []).includes(x));
    const sign = (val && val[id]) || '';
    const ute = (x) => { const t = tips(x); return t.length ? t.filter((s) => !sign.includes(s)).length / t.length : 0; };
    const vem = (g.avvik[id] || []).find(said) || gang.map((x) => x.id).filter(said).sort((a, b) => ute(b) - ute(a))[0];
    if (!vem) return '';
    const i = gang.findIndex((x) => x.id === vem);
    return `<span class="sk sm-k${i}" title="${esc(`${vem}: ${said(vem)}`)}">${esc(said(vem))}</span>`;
  }
  // Ett litet kryss med blyerts (10 × 10), samma varje gång för samma match,
  // tecken och person.
  function smaKryss(key) {
    const R0 = rng(seed(key));
    const j = (n) => (R0() - 0.5) * 2 * n;
    const d = [[1.6, 1.8, 8.6, 8.4], [8.4, 1.4, 1.8, 8.8]].map(([x1, y1, x2, y2]) => {
      const a = [x1 + j(0.6), y1 + j(0.6)];
      const b = [x2 + j(0.6), y2 + j(0.6)];
      const c = [(a[0] + b[0]) / 2 + j(0.9), (a[1] + b[1]) / 2 + j(0.9)];
      return `M${r1(a[0])} ${r1(a[1])}Q${r1(c[0])} ${r1(c[1])} ${r1(b[0])} ${r1(b[1])}`;
    }).join('');
    return `<svg viewBox="0 0 10 10" aria-hidden="true"><path d="${d}"/></svg>`;
  }

  // Uppgörelsen: numren på de omtvistade matcherna (v.g.strid) är inringade
  // med kulspetspennan, och en match som har klubbats – gängets tecken
  // ändrat, eller ett klick på matchen – har en bock vid ringen (v.g.klar).
  // Klubbat sparas på enheten för omgången, samma som på papperet
  // (Samtal.pult.klubba).
  function bockSvg(key) {
    const R0 = rng(seed(`bock${key}`));
    const j = (n) => r1((R0() - 0.5) * 2 * n);
    return `<svg class="rum-bock" viewBox="0 0 16 16" aria-hidden="true"><path pathLength="1" d="M${2.4 + j(0.5)} ${8.6 + j(0.6)}Q${4.6 + j(0.5)} ${10.6 + j(0.5)} 6.3 ${13 + j(0.4)}Q${9.4 + j(0.6)} ${6.4 + j(0.6)} ${14 + j(0.4)} ${2.4 + j(0.5)}"/></svg>`;
  }
  // Gängets kupong på pulten ligger med baksidan upp, så att allas tips inte
  // syns direkt: bandet, raderna och kryssen lyser svagt igenom, spegelvända
  // (utan title, så att inget syns när man pekar), och stämpeln står mitt på.
  // Ett klick vänder den (vandKupong), och den ligger vänd på enheten tills
  // någon mer har lämnat in – eller kupongen tas i handen (openCoupon).
  const VAND = 'profeterna.rum.vand';
  const vandNyckel = (p) => `${p.s.id}|${p.se.slice().sort().join(',')}`;
  function vand(p) {
    if (R.vand === vandNyckel(p)) return true;
    try { return localStorage.getItem(VAND) === vandNyckel(p); } catch (e) { return false; }
  }
  function sparaVand(p) {
    R.vand = vandNyckel(p);
    try { localStorage.setItem(VAND, R.vand); } catch (e) { /* då ligger den vänd tills sidan laddas om */ }
  }
  const vandHtml = (fram, top, slit) => '<span class="rum-vand" aria-hidden="true">' +
    `<span class="genom">${fram.replace(/ title="[^"]*"/g, '')}</span>${slit}` +
    `${top && top.stamp ? `<span class="st">${top.stamp.replace(/ title="[^"]*"/g, '')}</span>` : ''}</span>`;

  const nrRing = (id, klar) =>Papper.ring(`s${id}`, 'rum-strid', 22).replace('<path ', '<path pathLength="1" ') + (klar ? bockSvg(id) : '');

  // Vad kupongen visar (couponHtml) ur Samtal.pult: slag och vems.
  function view(p, slag, vem = null) {
    if (!p) return null;
    if (slag === 'fyll') return { slag, vem: p.vem, tecken: p.tecken, not: p.kommentarer, efter: {} };
    if (slag === 'gang') {
      const g = Samtal.pult.gang();
      // (spel: Stryktipset – Svenska folket, oddsen och favoritskapet, när de har kommit, Folket i folket.js)
      const spel = window.Folket && p.s.spel && p.s.spel.nr ? Folket.info(p.s.spel.nr) || { rader: {} } : null;
      return g && { slag, vem: p.vem, tecken: g.val, who: g.who, notes: g.notes, after: g.efter, efter: p.efter, skriv: Boolean(p.skriv), g, spel };
    }
    const t = Samtal.pult.tips(vem);
    return t && { slag, vem, tecken: t.tecken, not: t.kommentarer, efter: t.efter, skriv: slag === 'din' && p.skriv === vem };
  }

  // ---------- högen ----------
  //
  // De som har lämnat in har lagt sin kupong med baksidan upp till höger
  // om kupongen på pulten (till vänster låg den under Hasses nota), i den
  // ordning de lämnade in (den senaste överst):
  // porträttet under ett gem, namnet i personens bläck (samma som på
  // papperet under Kupong) och stämpeln – men inga tecken. Din egen tas i
  // handen därifrån (p.hand), och de andras när du ser deras tips – annars
  // lyfts de lite och faller tillbaka (nudge). Kupongerna har
  // samma mått som kupongen på pulten, förminskade, så att den som tas i
  // handen landar exakt i högen.

  const T = (dx, dy, z, rx, rz, s, ry = 0) => `translate(${r1(dx)}px, ${r1(dy)}px) perspective(1300px) translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s.toFixed(4)})`;
  const glow = (a, drop) => `0 0 0 3px rgba(240, 214, 153, ${a}), 0 0 80px rgba(240, 214, 153, ${(0.45 * a).toFixed(2)}), ${drop}`;
  // mitten (x, y) och vridningen för den första, andra och tredje i högen
  // (askkoppen och dosan står bakom den och Helgarderat till höger om den,
  // i rum-saker.js: HOGEN där). Högen ligger så långt fram, och kupongerna
  // så tätt att namnen nätt och jämnt syns, sedan tidningen låg bakom den
  // (till 2026-11-11); på höjden är kupongerna högre (420 × 620), och där
  // ligger den ännu lite längre fram (smal).
  const HOG = { s: 0.3, at: [[1204, 874, 5], [1196, 910, -4], [1208, 946, 2]], smal: 18, skugga: '0 22px 30px rgba(0, 0, 0, 0.55)' };
  const INK = ['#2146a6', '#16784b', '#6d3aa8', '#8a6a0c', '#a0306a'];
  function slot(i) {
    const [x, y, a] = HOG.at[i % HOG.at.length];
    const n = Math.floor(i / HOG.at.length);
    return { dx: x + 14 * n - kupX(), dy: y + 10 * n + (R.smal ? HOG.smal : 0) - kupY(), a };
  }
  const restAt = (sl) => T(sl.dx, sl.dy, 0, 44, sl.a, HOG.s);

  function photoOf(id) {
    const g = ((KP.data && KP.data.samtal && KP.data.samtal.gang) || []).find((x) => x.id === id);
    return g && g.bild ? g.bild : null;
  }

  // Baksidan: bandet och markeringarna lyser svagt igenom, spegelvända, och
  // slitaget från framsidan (omg: omgångens id, som kupongens nyckel).
  function backHtml(id, ix, omg) {
    const src = photoOf(id);
    return `<span class="genom"></span>${slitage(kupNyckel(omg, id), true)}` +
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
      return `<a class="rum-flat rum-bak rum-sak" ${KNAPP} data-nav="kupong" data-vem="${esc(g.id)}" data-i="${i}"${ta ? ' data-ta' : ''}` +
        ` style="transform: ${restAt(slot(i))}" aria-label="${esc(label)}"${ta ? '' : ` title="${esc(label)}"`}>${backHtml(g.id, gang.findIndex((x) => x.id === g.id), (p && p.s.id) || (rd && rd.id))}</a>`;
    }).join('');
    if (el.dataset.html !== html) {
      el.innerHTML = html;
      el.dataset.html = html;
    }
    for (const a of el.children) a.style.visibility = R.kup && R.kup.vem === a.dataset.vem ? 'hidden' : '';
  }

  // Skårtavlan: Tipsligan, säsongens ställning i gänget – samma poäng som
  // ställningen i Olympen (kampRounds i kampen.js, med omgången som pågår),
  // lika placering vid lika poäng och antal rätt. Namnen som överallt
  // (Tippoang.kallas: efternamnet, Dogge för Johansson). Före första omgången
  // står bara namnen där, och den som inte har
  // tippat än (Hasse Backe före sin första omgång) står sist utan poäng.
  // En plastbokstav per tecken, var och en lite sned i sitt spår (samma frö
  // varje gång, så att inget flyttar sig när tavlan fylls om). Lådan har
  // fyra O – sedan får det bli nollor.
  const tavelnamn = (p) => Tippoang.kallas(p);
  function liga() {
    const rounds = typeof kampRounds === 'function' ? kampRounds().list : [];
    const people = typeof Tippoang !== 'undefined' ? Tippoang.season(rounds).people : [];
    if (people.length) {
      let rank = 0;
      let prev = null;
      const rader = people.map((p, i) => {
        const key = Tippoang.key(p);
        if (key !== prev) { rank = i + 1; prev = key; }
        return { name: tavelnamn(p), rank, pts: tpPts(p.pts) };
      });
      const utan = typeof kampGang === 'function' ? kampGang(rounds).filter((g) => !people.some((p) => p.id === g.id)) : [];
      return [...rader, ...utan.map((g) => ({ name: tavelnamn(g), rank: people.length + 1 }))];
    }
    return (typeof kampGang === 'function' ? kampGang(rounds) : []).map((g) => ({ name: tavelnamn(g) }));
  }
  function skarHtml(rows) {
    const R0 = rng(31);
    let o = 4;
    const ch = (c) => {
      if (c === ' ') return '<b class="sp"></b>';
      if (c === 'O' && o-- <= 0) c = '0';
      return `<b style="transform: translateY(${r1((R0() - 0.5) * 0.4)}px) rotate(${r1((R0() - 0.5) * 3)}deg)">${esc(c)}</b>`;
    };
    const word = (t) => [...String(t).toUpperCase()].map(ch).join('');
    return `<span class="h${rows.length > 3 ? ' tat' : ''}">${word('Tipsligan')}</span>` +
      rows.slice(0, 4).map((x) => (x.rank
        ? `<span class="rad"><span>${word(`${x.rank}.`)}</span><span>${word(x.name)}</span><span>${x.pts ? word(x.pts) : ''}</span></span>`
        : `<span class="rad bara"><span>${word(x.name)}</span></span>`)).join('');
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
      // (en kupong vars omgång finns tar fram omgångens protokoll i närbilden: korkProtokoll)
      const kup = korkOmgang(c) ? ` data-kup="${esc(c.id)}"` : '';
      return `<span class="kup${i === 1 ? ' kaffe' : ''}"${kup} style="left:${pos[0]}%; top:${pos[1]}%; --rot:${pos[2]}deg">${pin(['#d42a1e', '#3d7bd9', '#e6c43a', '#3db37c'][i])}` +
        `<span class="kt">${esc(c.name || 'Kupong')}</span><span class="tk">${ticks}</span><span class="rr">${c.ok} rätt</span></span>`;
    }).join('');
  }
  // Omgången som en kupong på korktavlan gjordes ur (data/tippare.json): den med flest av kupongens matcher,
  // minst hälften av dem (som roundOf i src/history.js). Dolda resultat ger ingen. → omgången, eller null.
  function korkOmgang(c) {
    const ids = new Set((c.rows || []).map((r) => String(r.id || '')).filter(Boolean));
    let bast = null;
    let mest = 0;
    for (const r of (TP.season && TP.season.rounds) || []) {
      const n = (r.matches || []).filter((m) => ids.has(String(m.id))).length;
      if (n > mest) {
        mest = n;
        bast = r;
      }
    }
    if (!bast || mest * 2 < ids.size) return null;
    return typeof tpRoundHidden === 'function' && tpRoundHidden(bast) ? null : bast;
  }
  // Protokollen som går att bläddra mellan från korktavlan: säsongens omgångar (data/tippare.json), den senaste
  // först, var och en med gängets kupong om den finns – också de äldre som inte längre ryms på tavlan. Dolda
  // resultat ger ingen. → [{ r: omgången, c: kupongen eller null }]
  function korkLista() {
    const par = new Map();
    for (const c of (R.old || []).filter((x) => x.n && !(window.Historik && Historik.hidden(x)))) {
      const r = korkOmgang(c);
      if (r && !par.has(r)) par.set(r, c);
    }
    return ((TP.season && TP.season.rounds) || [])
      .filter((r) => !(typeof tpRoundHidden === 'function' && tpRoundHidden(r)))
      .map((r) => ({ r, c: par.get(r) || null }));
  }
  // Protokollet för en omgång i listan: samma som på pulten om det är den omgången, annars räknat ur den frysta
  // omgången (RumBlock.fryst). → sammanställningen, eller null.
  function korkSumma({ r, c }) {
    if (R.summa && R.summa.id === r.id) return R.summa;
    const ids = (c ? (c.rows || []).map((x) => x.id) : r.matches.map((m) => m.id)).filter(Boolean);
    return RumBlock.fryst({
      round: r, kupong: c, namn: (c && c.name) || r.name, nr: typeof couponNumber === 'function' ? couponNumber(ids) : null,
      info: (KP.data && KP.data.samtal && KP.data.samtal.gang) || [], kort: short,
      analyser: analyserData ? analyserData.per : null,
    });
  }
  // Kupongen som hänger på korktavlan för en omgång i listan, eller null.
  const korkLapp = (x) => (x && x.c ? R.el.querySelector(`.rum-hv > .rum-kork .kup[data-kup="${CSS.escape(x.c.id)}"]`) : null);
  // Protokollet för kupongen på korktavlan, och ←/→ till omgången före och efter (bladdra). Hasses spalt
  // kommer ur analyserna, som hämtas först. → om det togs fram.
  function korkProtokoll(lapp) {
    const c = (R.old || []).find((x) => x.id === lapp.dataset.kup);
    const r = c && window.RumBlock && RumBlock.fryst ? korkOmgang(c) : null;
    const lista = r ? korkLista() : [];
    const i = lista.findIndex((x) => x.r === r);
    if (i < 0) return false;
    lista[i] = { r, c };
    const fram = () => {
      if (R.sak !== 'kork' || R.protokoll || !lapp.isConnected) return;
      const sum = korkSumma(lista[i]);
      if (sum) protokollet(true, false, { sum, lapp, kork: { lista, i } });
    };
    if (analyserData || typeof loadAnalyser !== 'function') fram();
    else loadAnalyser().then(fram, fram);
    return true;
  }

  // Allt som hämtas: omgången, säsongens omgångar och kupongerna.
  async function load() {
    // (gick matcherna inte att hämta försöker varje omgång igen, R.poll)
    if (!state.all && state.matchesForsokt) {
      state.matchesForsokt = false;
      await loadMatches();
    }
    await Promise.all([whenMatches(), loadCoupons()]);
    await Promise.all([
      typeof tpLoad === 'function' ? tpLoad() : null,
      // omgången som kupongen på pulten och högen visar (samtal.js)
      window.Samtal && Samtal.load ? Samtal.load() : null,
      typeof tpLoadSeason === 'function' && !TP.season ? tpLoadSeason() : null,
      window.Historik ? Historik.coupons().then((l) => { R.old = l; }) : null,
    ]);
    fill();
    // nästa omgång till kupongstället (openStall), när matcherna finns att knyta den till
    stallHamta();
  }

  function fill() {
    if (!R.el) return;
    const t = Date.now();
    const rd = round();
    const rows = rd ? roundRows(rd, t) : [];
    R.rows = rows;
    // (mot det som skrevs sist: innerHTML ger tillbaka <path …></path> där
    // kupongen skrev <path …/>, så den skrevs annars om vid varje fill)
    const set = (id, html) => {
      const e = document.getElementById(id);
      if (e && e.skrivet !== html) {
        e.skrivet = html;
        e.innerHTML = html;
      }
    };
    // tv:n: Stryktipsets ordning (spel) om omgången är Stryktipset, och next
    // mellan omgångarna, när raderna bara är de närmaste matcherna
    if (R.tv) R.tv.fill(rows, { spel: rd && rd.spel ? rd.ids : null, next: Boolean(rd && rd.next) });
    if (R.ans) R.ans.fill(rows.map((x) => x.m), (state.all && state.all.matches) || []);
    if (R.reg) R.reg.fill(rows.map((x) => x.m), (state.all && state.all.matches) || []);
    // videon: förra omgången och nästa ur rd och kupongerna som har spelats
    if (R.video) R.video.fill((state.all && state.all.matches) || [], { rd, old: [...(R.old || []), ...(typeof allCoupons === 'function' ? allCoupons() : [])] });
    const p = pult(rd);
    summera(rd, p, t);
    // har du lämnat in ligger din kupong i högen, och på pulten en ny – eller
    // gängets kupong, när du ser de andras tips (uppgörelsen)
    set('rum-kupong', couponHtml(rd, rows, p && p.gang ? view(p, 'gang') : p && !p.inne ? view(p, 'fyll') : null));
    tidningPult();
    // (Helgarderats nummer, högst var femte minut: omslaget står i det)
    hamtaTidning();
    levande();
    if (p && p.gang && p.s.spel && window.Folket) Folket.hamta(p.s.spel.nr).then((ny) => { if (ny && R.on) levande(); });
    const pa = document.getElementById('rum-kupong');
    if (pa) {
      pa.setAttribute('aria-label', R.summa ? 'Protokollet' : 'Kupong');
      if (pa.title) pa.title = `${R.summa ? 'Protokollet' : 'Kupongen'} · K`;
    }
    pile(rd, p);
    // gänget vid barbordet: den som inte har lämnat in sitter med kupongen
    R.vem = vemInne(rd, rows, t, p);
    if (R.fig && R.fig.inne) R.fig.inne(R.vem, now());
    gangTv(rd, rows, t, p);
    // bredvid kupongen står bara pingklockan, till uppgörelsen – inga ord som
    // säger vad man ska göra: kupongen och protokollet tas med ett klick på dem
    const tag = document.getElementById('rum-tag');
    if (tag) tag.hidden = !(p && p.klocka && !R.summa);
    set('rum-skar', skarHtml(liga()));
    const seen = ((TP.season && TP.season.rounds) || []).filter((r) => typeof tpRoundHidden !== 'function' || !tpRoundHidden(r));
    // dagen efter: hur det gick i den senaste kupongen (rum-folk.js)
    if (window.RumFolk) RumFolk.fyll(R.old, seen);
    set('rum-kork', corkHtml((R.old || []).filter((c) => c.n && !(window.Historik && Historik.hidden(c)))));
    const vinnare = seen.slice().sort((a, b) => String(a.from).localeCompare(String(b.from)))
      .flatMap((r) => (r.people || []).filter((p) => p.award === 'best').map((p) => p.id));
    const cups = vinnare.map((id) => GANG[id] || '#d8b06a');
    // hur många var och en har, under pokalhyllan när kameran är framme
    R.pokaler = {};
    for (const id of vinnare) R.pokaler[id] = (R.pokaler[id] || 0) + 1;
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
    // nästa avspark (timmar), för korstecknet (rum-3d.js); ?rum-stopp också här
    const kvar = rows.map((x) => Date.parse(x.m.kickoff)).filter((k) => k > t);
    const avspark = q.has('rum-stopp') ? h : kvar.length ? (Math.min(...kvar) - t) / 3600000 : null;
    R.lage = { tv, nag, avspark };
    // uret visar dagarna och de sista tolv timmarna till spelstoppet
    // (rum-inredning.js); ?rum-stopp räknas från urets tid
    R.stopp = rd && !rd.next && first ? (q.has('rum-stopp') ? (window.Vader ? Vader.nu().t : t) + h * 3600000 : first) : null;
    if (R.inr) R.inr.stopp(R.stopp);
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
    // humöret: hur det går för kupongen
    R.spel = spelLage(rd, rows, p);
    if (R.fig && R.fig.spel) R.fig.spel(R.spel, now());
  }

  // Hur det går för gängets kupong, för gängets humör (rum-3d.js, spel): bara
  // när resultaten syns och någon match på kupongen är avgjord (också en som
  // pågår, efter ställningen just nu). Kupongen tål tol fel – Stryktipset ger
  // pengar från tio rätt av tretton, alltså tre fel; en kortare kupong en
  // fjärdedel. Fler fel och den är död (deppig); lika många med matcher kvar
  // och nästa fel tar vinsten (nerv); när allt är spelat utan fler fel är det
  // vinst (glad). Däremellan efter hur den går mot modellen, med samma z som
  // betyget i historiken (src/history.js): glad från 0,5, nerv från −0,5.
  // rank: vem som leder omgången (1) och ligger sist (−1) på sina egna tips,
  // när allas tips syns och minst tre matcher är avgjorda. ansikte: hur glada
  // de ser ut när allt är spelat (rum-uttryck.js).
  // ?rum-humor=glad|nerv|deppig och ?rum-rank=dl:1,dj:-1 för bilder.
  function spelLage(rd, rows, p) {
    const q = R.q;
    if (q.has('rum-humor') || q.has('rum-rank')) {
      const rank = {};
      for (const x of (q.get('rum-rank') || '').split(',')) {
        const r = /^(\w+):(-?1)$/.exec(x.trim());
        if (r) rank[r[1].toLowerCase()] = Number(r[2]);
      }
      return { lage: q.get('rum-humor') || null, rank };
    }
    const out = { lage: null, rank: {} };
    if (!rd || rd.next) return out;
    const med = rows.filter((x) => x.sign && x.g.state !== 'off');
    const klar = med.filter((x) => x.g.res != null);
    if (klar.length) {
      const n = rows.filter((x) => x.sign).length;
      const tol = n >= 13 ? n - 10 : Math.floor(n / 4);
      const fel = klar.filter((x) => !x.g.hit).length;
      const kvar = med.length - klar.length;
      // modellens chans för tecknet, annars schablonen (45 % för ett tecken, 75 % för två)
      const pp = (x) => (x.g.p != null ? Math.min(1, x.g.p) : x.sign.length >= 3 ? 1 : x.sign.length === 2 ? 0.75 : 0.45);
      const vant = klar.reduce((a, x) => a + pp(x), 0);
      const z = (klar.length - fel - vant) / Math.sqrt(Math.max(0.5, klar.reduce((a, x) => a + pp(x) * (1 - pp(x)), 0)));
      out.lage = fel > tol ? 'deppig' : !kvar ? 'glad' : fel === tol ? 'nerv' : z >= 0.5 ? 'glad' : z <= -0.5 ? 'nerv' : null;
      // när allt är spelat: ansiktena som när kupongen kommer in i historiken
      // (betyget ur z, rum-folk.js ansikte), också innan den har gjort det
      const betyg = z >= 1.25 ? 5 : z >= 0.5 ? 4 : z >= -0.5 ? 3 : z >= -1.25 ? 2 : 1;
      if (!kvar && window.RumFolk) out.ansikte = RumFolk.ansikte(betyg, med.length, fel);
    }
    const s = p && p.s;
    const gang = rd.gang || [];
    const avg = rows.filter((x) => x.g.res != null);
    if (s && s.tips && gang.length > 1 && avg.length >= 3 && gang.every((g) => s.tips[g.id])) {
      const r = gang.map((g) => ({ k: g.id.toLowerCase(), n: avg.filter((x) => (s.tips[g.id].tecken[x.id] || '').includes(SIGNS[x.g.res])).length }));
      const hi = Math.max(...r.map((x) => x.n));
      const lo = Math.min(...r.map((x) => x.n));
      if (hi > lo) {
        const forst = r.filter((x) => x.n === hi);
        const sist = r.filter((x) => x.n === lo);
        if (forst.length === 1) out.rank[forst[0].k] = 1;
        if (sist.length === 1) out.rank[sist[0].k] = -1;
      }
    }
    return out;
  }

  // ?rum-mal=dl:1,dt:-1,dj:0: ett mål för bilder – vid tiden 0 med ?rum-t,
  // annars genast och sedan var femtonde sekund. En bokstav efter väljer
  // sättet (dl:1b: a som förut, b båda armarna upp eller händerna på huvudet,
  // c handen i bordet; rum-3d.js, malV).
  function provMal() {
    const v = R.q.get('rum-mal');
    if (!v || !R.fig || !R.fig.mal) return;
    const m = {};
    const satt = {};
    for (const x of v.split(',')) {
      const r = /^(\w+):(-?1|0)([abc])?$/.exec(x.trim());
      if (r) m[r[1]] = Number(r[2]);
      if (r && r[3]) satt[r[1]] = 'abc'.indexOf(r[3]);
    }
    const go = () => R.fig.mal(m, still() ? 0 : now(), satt);
    go();
    if (!still()) setInterval(() => { if (R.on) go(); }, 15000);
  }

  // ?rum-akt=dl:kors,dj:dunk: ett påhitt för bilder (rum-3d.js, AKTER) – mitt
  // i det med ?rum-t (dl:skamt@6: sex sekunder in), annars om och om igen från
  // nu. Gängets påhitt (skamt, gral, titta, allsångerna, zen-stunderna) ges alla tre.
  function provAkt() {
    const v = R.q.get('rum-akt');
    if (!v || !R.fig || !R.fig.prova) return;
    for (const x of v.split(',')) {
      const [k, y] = x.split(':').map((z) => z.trim());
      const [namn, at] = (y || '').split('@');
      if (k && namn) R.fig.prova(k, namn, now() - (at ? Number(at) || 0 : still() ? 2.6 : 0));
    }
  }

  // ?rum-radio: radion på fönsterbänken är på (=4: sedan fyra sekunder, med ?rum-t; rum-3d.js).
  function provRadio() {
    if (R.q.has('rum-radio-lage') && window.RumRadio) RumRadio.prova(R.q.get('rum-radio-lage'));
    if (['radio', 'radiolapp', 'kassetter'].includes(R.q.get('rum-sak'))) sak(R.q.get('rum-sak'), null);
    if (!R.q.has('rum-radio') || !R.fig || !R.fig.radio) return;
    R.fig.radio(true, now() - (Number(R.q.get('rum-radio')) || 0));
  }

  // ?rum-lapp=dl:kinden:kolla@2: hur skylten hålls, för bilder (rum-3d.js, LAPP_HALL i rum-tecken.js).
  function provLapp() {
    const v = R.q.get('rum-lapp');
    if (!v || !R.fig || !R.fig.lappProva) return;
    for (const x of v.split(',')) {
      const [k, hall, g] = x.split(':').map((z) => z.trim());
      const [gor, at] = (g || '').split('@');
      if (k && hall) R.fig.lappProva(k, hall, gor, now() - (at ? Number(at) || 0 : 0));
    }
  }

  // ?rum-ga=dl: DL går iväg och kommer tillbaka (rum-3d.js, gaNu) – nu och
  // sedan var fyrtionde sekund, eller med ?rum-t så långt in (dl:5: fem sekunder).
  function provGa() {
    const v = R.q.get('rum-ga');
    if (!v || !R.fig || !R.fig.ga) return;
    const [k, l] = v.split(':').map((y) => y.trim());
    const go = () => R.fig.ga(k, now(), Number(l) || 0);
    go();
    if (!still()) setInterval(() => { if (R.on) go(); }, 40000);
  }

  // ---------- rörelsen ----------

  // Vridningen sätts som transform direkt på #rum-world, inte som
  // CSS-variabler: variabler ärvs av varje element i rummet, så Chrome
  // räknade om stilen för hela rummet och målade om allt i varje bildruta
  // medan musen rörde sig – och hann inte rita det, så att väggen, bänken
  // och pulten blinkade svart.
  const camT = (mx, my) => `translateZ(-330px) rotateX(${(-my * 2.6).toFixed(3)}deg) rotateY(${(mx * 4.5).toFixed(3)}deg) translateZ(330px)`;
  function setCam(mx, my) {
    const w = document.getElementById('rum-world');
    if (!w) return;
    // (direkt: glider världen efter musen slutar den, se folj och vrid)
    if (R.folj) {
      // (efter folj: hela vridningen i transform igen)
      if (R.folj.ax) w.style.transition = w.style.translate = w.style.rotate = '';
      w.classList.remove('vrider');
      R.folj = null;
    }
    R.camVis = [mx, my];
    const t = camT(mx, my);
    // (samma som förra gången: inget att räkna om)
    if (t !== R.cam) w.style.transform = R.cam = t;
  }

  // Kameran efter musen i Chrome, när den är hemma: att sätta vridningen i
  // varje bild fick Chrome att räkna om alla rummets lager (~380) varje gång.
  // I stället får världen ett nytt mål högst var 100:e ms (FOLJ) och glider
  // dit själv med övergångar – medan en övergång pågår flyttar Chrome bara
  // lagren. Vridningen upp och ner står då i rotate och den åt sidorna i
  // transform (samma vridning som camT), så att de får var sin övergång med
  // var sin kurva (linear(), foljKurva): samma följning som bild för bild
  // (en bit av vägen mot musen, tidskonstanten TAU), med musens nya läge
  // inlagt jämnt över de följande 100 ms och med farten världen redan hade,
  // så att farten inte hoppar, inte heller när musen svänger. Förut gled
  // världen i jämn fart på 180 ms mot varje mål: farten ändrades i ryck tio
  // gånger i sekunden, och världen kom igång först en tiondels sekund efter
  // musen.
  // (En animering med nyckelbilder hade gett samma rörelse, men Chrome
  // räknar om lagren varje gång en sådan läggs om, en övergång bara ibland.)
  // Gänget och sakerna i 3D ritas med den vridning som syns (synlig).
  const FOLJ = 100;
  // 6 % av vägen per 1/30 sekund, som i kamera
  const TAU = 1000 / 30 / -Math.log(0.94);
  // en axel s ms in: världen följer ett mål som går från T0 (där målet låg
  // med den fart den hade) till T1 på FOLJ ms och sedan står still
  function bana(x, s) {
    const B = (x.T1 - x.T0) / FOLJ;
    const ramp = (u) => x.T0 + B * (u - TAU) + (x.x0 - x.T0 + B * TAU) * Math.exp(-u / TAU);
    if (s <= FOLJ) return ramp(Math.max(0, s));
    return x.T1 + (ramp(FOLJ) - x.T1) * Math.exp(-(s - FOLJ) / TAU);
  }
  // övergången för en axel: tills den är en tiotusendel från målet, med
  // punkterna i kurvan tätt medan målet flyttas och glesare ju närmare målet
  // (linjärt emellan: högst en tiondels bildpunkt fel)
  // (utan linear(), i Chromium före 113: jämn fart på 180 ms som förut)
  const LINEAR = window.CSS && CSS.supports('transition-timing-function', 'linear(0, 1)');
  function foljKurva(x) {
    if (!LINEAR) return '180ms linear';
    const d = x.T1 - x.x0;
    const ms = FOLJ + TAU * Math.log(Math.max(1, Math.abs(bana(x, FOLJ) - x.T1) / 1e-4));
    if (Math.abs(d) < 1e-6) return `${ms.toFixed(0)}ms`;
    const pts = [];
    for (let s = 0; s < ms; s += s < FOLJ ? 20 : Math.max(16, Math.min(250, TAU * 0.04 / Math.sqrt(Math.max(1e-6, Math.abs(bana(x, s) - x.T1)))))) {
      pts.push(`${((bana(x, s) - x.x0) / d).toFixed(5)} ${(s / ms * 100).toFixed(3)}%`);
    }
    pts.push('1 100%');
    return `${ms.toFixed(0)}ms linear(${pts.join(', ')})`;
  }
  const vridX = (my) => `x ${(-my * 2.6).toFixed(3)}deg`;
  const vridY = (mx) => `rotateY(${(mx * 4.5).toFixed(3)}deg) translateZ(330px)`;
  function folj(tx, ty) {
    const w = document.getElementById('rum-world');
    if (!w) return;
    const nu = performance.now();
    const f = R.folj;
    if (f && f.ax && (nu - f.t < FOLJ || (f.ax[0].T1 === tx && f.ax[1].T1 === ty))) return;
    // från det som syns, med farten (per ms) världen har – eller hade, om
    // den följde musen bild för bild (efter en närbild)
    const a = synlig(nu);
    let v = [0, 0];
    if (f && f.ax) {
      const p = synlig(nu - 1);
      v = [a[0] - p[0], a[1] - p[1]];
    } else {
      if (Math.abs(a[0] - R.mx) + Math.abs(a[1] - R.my) < 0.02) v = [(R.tx - a[0]) / TAU, (R.ty - a[1]) / TAU];
      if (camT(tx, ty) === camT(...a) && !v[0] && !v[1]) return;
      // samma vridning, delad på rotate och transform (utan övergång)
      w.style.transition = 'none';
      w.style.translate = '0 0 -330px';
      w.style.rotate = vridX(a[1]);
      w.style.transform = vridY(a[0]);
      R.cam = null;
      void getComputedStyle(w).transform;
    }
    const ax = [tx, ty].map((T1, i) => ({ x0: a[i], T0: a[i] + TAU * v[i], T1 }));
    R.folj = { t: nu, ax };
    w.style.transition = `rotate ${foljKurva(ax[1])}, transform ${foljKurva(ax[0])}`;
    w.style.rotate = vridX(ty);
    w.style.transform = vridY(tx);
  }
  function synlig(nu = performance.now()) {
    const f = R.folj;
    if (!f) return R.camVis || [R.mx, R.my];
    if (f.ax) return f.ax.map((x) => bana(x, nu - f.t));
    const p = f.e(Math.min(1, (nu - f.t) / f.ms));
    return [f.a[0] + (f.b[0] - f.a[0]) * p, f.a[1] + (f.b[1] - f.a[1]) * p];
  }

  // Kameran går fram till tv:n, videon, anslagstavlan eller kortregistret,
  // eller tillbaka: i Chrome vrids världen dit på samma tid och med samma
  // kurva som kameran glider (.vrider i rum.css, som .glid) i stället för en
  // bit i varje bildruta. Varje ny vinkel räknade om alla rummets lager, och
  // medan kameran gled hann Chrome då bara rita det som vreds – tv:n, tavlan
  // och gänget – i varannan eller var tredje bildruta. I Safari kostar
  // vridningen lite (och kameran börjar där när en bildruta har gått fort,
  // sedan), så där vrids den som förut.
  const kurva = (x1, y1, x2, y2) => {
    const b = (p, q, s) => 3 * p * s * (1 - s) ** 2 + 3 * q * s * s * (1 - s) + s ** 3;
    return (x) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 24; i++) {
        const m = (lo + hi) / 2;
        if (b(x1, x2, m) < x) lo = m;
        else hi = m;
      }
      return b(y1, y2, (lo + hi) / 2);
    };
  };
  const GLID = { ms: 600, e: kurva(0.3, 0, 0.2, 1) };
  const vrids = () => !calm() && R.el.classList.contains('chromium');
  function vrid(mx, my, fran = synlig()) {
    const w = document.getElementById('rum-world');
    if (!w || !vrids()) return setCam(R.mx, R.my);
    const nu = performance.now();
    // Från en närbild, där rummet står precis rakt, börjar vridningen en
    // tusendel snett (syns inte). Rakt räknar Chrome ut lagrens skärpa exakt
    // – nära tv:n är väggarna tre gånger så skarpa som hemma – och när
    // kameran började gå tillbaka behöll den den skärpan, krympt så att
    // lagren rymdes, och ritade allt som kom i bild i den och sedan allt en
    // gång till i hemmets skärpa när kameran stannade. Lutar rummet det minsta
    // i perspektivet tar den hemmets skärpa direkt.
    if (!fran[0] && !fran[1]) fran = [0.001, 0.001];
    // (från det som syns: stilen räknas om först, så att övergången börjar där)
    setCam(...fran);
    void w.offsetWidth;
    R.mx = mx;
    R.my = my;
    const f = (R.folj = { t: nu, a: fran, b: [mx, my], ...GLID });
    w.classList.add('vrider');
    w.style.transform = R.cam = camT(mx, my);
    R.camVis = [mx, my];
    setTimeout(() => {
      if (R.folj !== f) return;
      w.classList.remove('vrider');
      R.folj = null;
    }, GLID.ms + 50);
  }
  // Tillbaka hem: världen vrids mot musen medan kameran glider, i stället för
  // en bit i varje bildruta när musen rör sig. hemVrid är dit (i Chrome), så
  // att anslagstavlan och kortregistret kan mäta var de ska landa.
  const hemVrid = () => (vrids() && R.pek === 'mouse' && R.mus ? R.mus : null);
  function vridHem(fran) {
    const m = hemVrid();
    if (!m) return;
    [R.tx, R.ty] = m;
    vrid(R.tx, R.ty, fran);
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

  // Kameran efter musen (eller efter var i rummet man står med fingret),
  // dt millisekunder sedan förra gången. Den följer i varje bildruta
  // (loop), så att vridningen flyter också på skärmar med 60 eller 120
  // bilder i sekunden – att vrida världen ritar inte om något – medan gänget
  // och sakerna i 3D ritas 30 gånger i sekunden (frame). När datorn inte
  // hinner med följer den gänget i stället (KVAL).
  function kamera(dt) {
    // med fingret vrids kameran efter var i rummet man står (pan)
    if (R.pek !== 'mouse' && !nara()) {
      if (R.k * W - innerWidth > 1) R.tx = Math.max(-1, Math.min(1, (R.px - (R.pxHem === undefined ? 0.5 : R.pxHem)) * 2));
      R.ty = R.k * H - innerHeight > 1 ? R.py * 2 - 1 : -0.25;
    }
    // (världen glider själv dit vrid satte den)
    if (R.folj && R.folj.e) {
      R.borta = performance.now();
      R.bildVis = false;
      return;
    }
    if (!still()) {
      // lika fort som när den gick 6 % av vägen (12 med kupongen i handen) 30 gånger i sekunden
      const f = 1 - (1 - (R.kup ? 0.12 : 0.06)) ** (dt / (1000 / 30));
      R.mx += (R.tx - R.mx) * f;
      R.my += (R.ty - R.my) * f;
    }
    // (inte förrän kameran har glidit hem från en närbild: medan världen
    // glider behåller Chrome lagrens upplösning, och den ska bli hemmets)
    const hemma = R.el.classList.contains('chromium') && !calm() && !nara() && !R.el.classList.contains('sak-nara');
    if (!hemma) R.borta = performance.now();
    R.bildVis = !(hemma && performance.now() - (R.borta || 0) > 1000);
    if (R.bildVis) setCam(R.mx, R.my);
    else folj(R.tx, R.ty);
  }

  function frame(dt = 1000 / 30) {
    const t = now();
    kamera(dt);
    // (nära videon i telefonen syns inget av det här, lattVideo)
    if (R.vlatt) return;
    const on = neonOn(t);
    if (on !== R.neon) {
      R.neon = on;
      // på neonen och dess sken, inte på hela rummet: en klass på .rum
      // räknade om stilen för alla element i rummet varje gång den glappade
      for (const e of R.el.querySelectorAll('.rum-neon, .rum-neonhalo, .rum-neonglow')) e.classList.toggle('av', !on);
    }
    const gang = () => {
      const [vx, vy] = synlig();
      if (R.fig && syns(R.gang)) R.fig.draw(t, vx, vy, on);
    };
    const saker = () => {
      const [vx, vy] = synlig();
      if (R.saker) R.saker.draw(t, vx, vy, R.rows, R.old, syns(R.sakDuk));
      if (R.inr) R.inr.draw();
    };
    const ute = () => {
      const damm = document.getElementById('rum-damm');
      if ((!calm() || still()) && syns(damm) && !damm.hidden) dust(t);
      // (ställningarna på gatan; var figurerna är räknas i varje bildruta, gatan i loop)
      if (!calm()) uteTakt();
    };
    // I Safari väntar bildrutan på att grafiken ska hinna rita klart det som
    // har ritats i 3D, så i en telefon blev var tredje bildruta för lång – det
    // man såg som hack när man drog med fingret eller kameran glider. Där
    // ritas gänget, sakerna och gatan i stället var och en för sig, en i varje
    // bildruta, direkt efter att bildrutan är klar (efterBild): då hinner de
    // ritas färdigt till nästa, och ingen bildruta får allt på en gång. (I
    // telefonen också i Chrome: fingret får inte vänta på att allt ritas.)
    // Sakerna och gatan turas om, så att de ritas i halva takten och var tredje
    // bildruta är tom: Chrome räknar om stilen i varje bildruta där något ritas.
    // I telefonen är gatan en enda duk (gatduk i rum-ute.js) vars ställningar ritas tillsammans med
    // gänget: varje duk som ändras är en bildruta som grafikkortet måste rita hela rummet i, så det som
    // kan komma i samma bildruta gör det. Sakerna rör sig minst och ritas varannan gång. (Var figurerna
    // på gatan är läggs ut i varje bildruta medan något far förbi, gatan i loop.)
    if ((WEBKIT || LATT) && !calm()) {
      while (R.ko.length) R.ko.shift()();
      R.turUte = !R.turUte;
      if (LATT) {
        R.ko.push(() => { gang(); ute(); });
        if (R.turUte) R.ko.push(saker);
      } else R.ko.push(gang, R.turUte ? ute : saker);
    } else {
      gang();
      saker();
      ute();
    }
  }

  // Nästa del av det som ska ritas (frame) som egen uppgift: ett meddelande
  // som postas i bildrutan kommer efter att bildrutan har gått iväg.
  R.ko = [];
  const efterBild = new MessageChannel();
  efterBild.port1.onmessage = () => {
    if (R.on && R.ko.length) R.ko.shift()();
  };

  function loop() {
    cancelAnimationFrame(R.raf);
    clearTimeout(R.vila);
    let prev = 0;
    let dt = 0;
    R.kannaSist = 0;
    const tick = (ms) => {
      if (!R.on) return;
      // man har vänt sig mot Hasse (rum-hasse.js): rummet står still och syns inte
      if (R.vilar) {
        prev = 0;
        R.kannaSist = 0;
        R.vila = setTimeout(() => { R.raf = requestAnimationFrame(tick); }, 250);
        return;
      }
      const raw = prev ? ms - prev : 0;
      dt += prev ? raw : 1000 / 60;
      prev = ms;
      // gänget och sakerna 30 gånger i sekunden (eller glesare, KVAL);
      // kameran i varje bildruta, utom när Chrome inte hinner med (i Safari
      // alltid: där kostar vridningen lite, och i gängets takt ryckte
      // rummet efter fingret och när kameran gled på plats efter en närbild)
      const K = KVAL[R.kval];
      const bild = ms - R.last > 1000 / K.takt - 4;
      if (bild) {
        R.last = ms;
        frame(Math.min(100, dt));
        dt = 0;
      } else if (K.vrid || WEBKIT) {
        kamera(Math.min(100, dt));
        dt = 0;
      }
      gatan(ms);
      // (i Chrome räknas gängets bilder: huvudtråden väcks bara till dem, och till
      // gatan medan något far förbi)
      if (!TOMMA) {
        if (raw) kanna(ms, raw);
      } else if (bild) {
        if (R.kannaSist) kanna(ms, ms - R.kannaSist);
        R.kannaSist = ms;
      }
      if (R.ko.length) efterBild.port2.postMessage(0);
      // Mellan gängets bilder har huvudtråden inget att göra i Chrome i datorn
      // (utom gatan medan något far förbi, gatan): grafikkortet flyttar allt
      // annat, och kameran glider själv (folj). Varje
      // väckning kostar ändå en omräkning av stilen för allt som är animerat,
      // så den väcks först bildrutan före nästa bild (8 ms före: rätt ruta
      // i 60 Hz och högst en ruta för mycket i 120 Hz).
      const kvar = R.last + 1000 / K.takt - 4 - performance.now();
      // (det sista i kön ritas direkt efter den här bildrutan, efterBild)
      if (TOMMA && kvar > 12 && R.ko.length <= 1 && !(K.vrid && R.bildVis) && !R.gatGlid) {
        R.vila = setTimeout(() => { R.raf = requestAnimationFrame(tick); }, kvar - 8);
      } else R.raf = requestAnimationFrame(tick);
    };
    R.raf = requestAnimationFrame(tick);
  }

  // ---------- kvaliteten ----------

  // Rummet känner av om datorn eller telefonen hinner med (kanna): kommer
  // det färre än 45 bilder i sekunden (i Chrome i datorn färre än 80 % av
  // gängets takt), eller hackar det, går det ner ett steg – gänget och sakerna i 3D ritas glesare och med färre bildpunkter,
  // skuggorna räknas om mer sällan och dammet i ljuset försvinner (gatan utanför
  // glider lika jämnt på alla steg, glid i rum-ute.js). Steget sparas, så att nästa besök börjar där
  // (i tre dagar). I telefonen börjar rummet på steg 1. ?rum-kval=0|1|2
  // väljer steget och låser det; en fast bild (?rum-t) har annars allt.
  // takt: bilder i sekunden för 3D-delarna och ställningarna på gatan, pr: bildpunkterna i
  // 3D (gånger de vanliga), skugga: skuggorna räknas om var så många bilder,
  // detalj: gänget byggs av så många trianglar (gånger de vanliga), vrid:
  // kameran vrids efter musen i varje bildruta (annars i takten – Chrome
  // räknar om alla rummets lager varje gång världen vrids), enkel: gänget och
  // sakerna utan skuggkarta, miljö och de svaga lamporna (enkeltLjus i rum-3d.js)
  const KVAL = [
    { takt: 30, pr: 1, skugga: 1, detalj: 1, damm: true, vrid: true },
    { takt: 20, pr: 0.75, skugga: 2, detalj: 0.6, damm: true, vrid: false },
    { takt: 15, pr: 0.55, skugga: 4, detalj: 0.45, damm: false, vrid: false },
    { takt: 15, pr: 0.5, skugga: 0, detalj: 0.35, damm: false, vrid: false, enkel: true },
  ];
  // (i telefonen räknas skuggorna om var tredje bild, och dammet, en stor duk
  // som ritas om, får vara: det syns knappt så litet)
  if (LATT) {
    KVAL[1].skugga = 3;
    KVAL[1].damm = false;
  }
  const KVAL_NYCKEL = 'rum-kval2';
  // Där rummet börjar, efter vad enheten säger om sig själv: kommer rummet upp på
  // ett för högt steg byggs gänget om för varje steg ner, och det är det som hackar
  // mest. (Safari säger ingenting, där får kanna känna efter.)
  function startSteg() {
    let k = LATT ? 1 : 0;
    const minne = navigator.deviceMemory || 8;
    const karnor = navigator.hardwareConcurrency || 8;
    if (minne <= 4 || karnor <= 4) k = Math.max(k, LATT ? 2 : 1);
    if (minne <= 2 || karnor <= 2) k = KVAL.length - 1;
    const namn = gpuNamn();
    if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(namn)) k = KVAL.length - 1;
    else if (/Mali-(T\d|4\d\d|G[1-5]\d\b)|Adreno \(TM\) ([1-5]\d\d|6[0-2]\d)\b|PowerVR (SGX|Rogue G)|VideoCore|Intel.*(HD Graphics|GMA)/i.test(namn)) k = Math.max(k, 2);
    else if (/Mali-G[67]\d|Adreno \(TM\) 6[3-9]\d|Intel.*UHD/i.test(namn)) k = Math.max(k, 1);
    return k;
  }
  // grafikkortets namn (tomt om det inte går att få veta)
  function gpuNamn() {
    if (R.gpuNamn != null) return R.gpuNamn;
    R.gpuNamn = '';
    try {
      const g = document.createElement('canvas').getContext('webgl');
      const d = g && g.getExtension('WEBGL_debug_renderer_info');
      if (d) R.gpuNamn = String(g.getParameter(d.UNMASKED_RENDERER_WEBGL));
      const av = g && g.getExtension('WEBGL_lose_context');
      if (av) av.loseContext();
    } catch (err) { /* utan WebGL gör det inget */ }
    return R.gpuNamn;
  }
  // Kantutjämning i gänget och sakerna. Den kan inte stängas av sedan, och den kostar efter dukens yta,
  // så förut var den bara på på steg 0 (och steg 1 i telefonen). Men det är på de lägre stegen den
  // behövs: där är duken en bildpunkt per punkt eller glesare, två–tre av skärmens bildpunkter i en
  // telefon, och utan utjämning kryper trappstegen längs ansikten och armar när gänget rör sig, vilket
  // ser ut som flimmer. Där är duken också liten (en fjärdedel av ytan på steg 0 med täthet 2), så att
  // den kostar lite. Alltså: på steg 0, och annars där duken har högst 1,15 bildpunkter per punkt –
  // alla steg i telefonen, alla steg på en skärm med täthet 1, och från steg 2 med täthet 2. Inte med
  // mjukvarugrafik, där processorn räknar varje prov, och inte på PowerVR, vars drivrutin redan
  // kraschar av skuggkartan (rum-gpu.js). Mätt: se README, Jämnare kanter och jämnare takt.
  const kantutjamning = () => {
    if (R.kval === 0) return true;
    if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render|PowerVR/i.test(gpuNamn())) return false;
    // (dukens täthet som i figurer i rum-3d.js)
    const tathet = LATT ? 1.5 : Math.min(window.devicePixelRatio || 1, 2);
    return Math.max(0.75, tathet * KVAL[R.kval].pr) <= 1.15;
  };
  R.kval = 0;
  if (R.q.has('rum-kval')) {
    R.kval = Math.max(0, Math.min(KVAL.length - 1, Math.round(Number(R.q.get('rum-kval'))) || 0));
    R.kvalLas = true;
  } else if (R.q.has('rum-t')) R.kvalLas = true;
  else {
    R.kval = startSteg();
    try {
      const s = JSON.parse(localStorage.getItem(KVAL_NYCKEL) || 'null');
      if (s && Date.now() - s.t < 3 * 864e5) R.kval = Math.max(R.kval, Math.min(KVAL.length - 1, s.k | 0));
    } catch (err) { /* utan lagring börjar rummet som vanligt */ }
  }

  // Hänger sig grafikkortet (det hände i en Pixel 10 i Chrome, tolv sekunder
  // efter att sidan öppnats) startar webbläsaren om sin grafikprocess, och allt
  // som låg på grafikkortet är borta: three.js kommer igen utan ansikten och
  // kläder, inredningen och gatans dukar blir tomma, och går det inte att
  // återställa visar Chrome en vit ruta med ett ledset ansikte. Det enda som ger
  // tillbaka allt är att ladda om sidan – först med det lägsta steget och, om
  // det hänger sig igen inom tio minuter, utan 3D-delarna, så att sidan inte
  // hänger grafikkortet om och om igen. Kupongen i handen får vara färdig först.
  const KRASCH = 'rum-krasch';
  const kraschar = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KRASCH) || 'null');
      return s && Date.now() - s.t < 6e5 ? s.n : 0;
    } catch (err) { return 0; }
  };
  if (!R.kvalLas && kraschar()) R.kval = KVAL.length - 1;
  R.ej3d = kraschar() >= 2;
  window.addEventListener('webglcontextlost', (e) => {
    if (R.grafikBorta || !R.el || !R.el.contains(e.target) || still()) return;
    R.grafikBorta = true;
    R.el.classList.add('grafik-borta');
    try {
      localStorage.setItem(KRASCH, JSON.stringify({ n: kraschar() + 1, t: Date.now() }));
    } catch (err) {
      // utan lagring går det inte att veta när det ska sluta: ingen omladdning
      return;
    }
    const igen = setInterval(() => {
      if (document.hidden || R.kup || !R.on) return;
      clearInterval(igen);
      location.reload();
    }, 300);
  }, true);

  // steget till 3D-delarna och dammet (också när de har startat, three)
  function kval(k) {
    R.kval = k;
    const K = KVAL[k];
    for (const x of [R.fig, R.saker]) if (x && x.kval) x.kval(K);
    // (som i telefonen: ljuset utan blandningslägen och i ett lager, inget korn, rum.css)
    if (R.el && k >= 1 && !R.el.classList.contains('enkel')) {
      R.el.classList.add('enkel');
      ljusIhop();
    }
    // (och gatan i en enda duk, rum-ute.js)
    const gatan = R.el && document.getElementById('rum-ute');
    if (gatan && k >= 1 && !gatan._samla) {
      gatan._samla = true;
      if (!LATT && R.vader) paintUte(R.vader);
    }
    const damm = document.getElementById('rum-damm');
    if (damm && damm.hidden === K.damm) {
      damm.hidden = !K.damm;
      if (!K.damm) damm.getContext('2d').clearRect(0, 0, damm.width, damm.height);
    }
  }

  // Bilderna räknas i två sekunder åt gången medan rummet står för sig
  // självt – inte medan kameran är framme vid något eller på väg tillbaka,
  // inte medan 3D-delarna startar och inte när fliken är dold – och två
  // dåliga perioder i rad tar ett steg ner.
  function kanna(ms, dt) {
    if (R.kvalLas || R.kval >= KVAL.length - 1) return;
    const K = R.kanna || (R.kanna = { fran: ms + 5000, n: 0, sum: 0, hack: 0, daliga: 0 });
    if (document.hidden || dt > 2000 || nara() || !R.fig || (LATT && (R.turGar || TUR.length))) {
      K.fran = Math.max(K.fran, ms + 1500);
      K.n = K.sum = K.hack = 0;
      return;
    }
    if (ms < K.fran) return;
    K.n++;
    K.sum += dt;
    // (i Chrome är dt tiden mellan gängets bilder, loop)
    const takt = KVAL[R.kval].takt;
    if (dt > (TOMMA ? Math.max(50, 1500 / KVAL[R.kval].takt) : 50)) K.hack++;
    if (K.sum < 2000) return;
    // (stadiga 30 bilder i sekunden är en telefon i strömsparläge – det blir
    // inte bättre av att gänget ritas glesare)
    const bps = (K.n / K.sum) * 1000;
    const andel = TOMMA ? bps / takt : bps / 60;
    const dalig = (TOMMA ? andel < (LATT ? 0.7 : 0.8) : bps < 45 && Math.abs(bps - 30) > 3) || K.hack > K.n * 0.1;
    K.daliga = dalig ? K.daliga + 1 : 0;
    K.n = K.sum = K.hack = 0;
    if (K.daliga < 2) return;
    // ett steg ner, och en stund innan det räknas igen. Går det långt under
    // halva takten är ett steg i taget bara fler ombyggnader: direkt till botten.
    K.daliga = 0;
    K.fran = ms + 3000;
    kval(andel < 0.45 ? KVAL.length - 1 : R.kval + 1);
    try {
      localStorage.setItem(KVAL_NYCKEL, JSON.stringify({ k: R.kval, t: Date.now() }));
    } catch (err) { /* nästa besök börjar som vanligt */ }
  }

  // Gatan utanför: benen, armarna, hjulen, löven, vingarna och flaggan ritas
  // i dukar i samma takt som gänget (takt i rum-ute.js). Rör sig något annat
  // inne i en SVG där står det på paus och flyttas fram här: grafikkortet kan
  // inte flytta det, och Chrome räknade om alla rummets lager i varje
  // bildruta. Står gatan still (.vila) flyttas ingenting.
  function uteTakt() {
    const ute = document.getElementById('rum-ute');
    if (!ute || ute.classList.contains('vila')) return;
    const ms = document.timeline.currentTime;
    if (!R.uteAnim) {
      R.uteAnim = ute.getAnimations({ subtree: true }).filter((a) => {
        const e = a.effect && a.effect.target;
        return e instanceof SVGElement && !(e instanceof SVGSVGElement);
      });
      for (const a of R.uteAnim) {
        a.pause();
        a.bas = a.currentTime - ms;
      }
    }
    for (const a of R.uteAnim) a.currentTime = ms + a.bas;
    if (window.RumUte && RumUte.takt) RumUte.takt(ute, null, R.kval >= 2);
  }

  // Gatan i en duk (rum-ute.js): medan något far förbi läggs den ut i varje
  // bildruta, högst 60 gånger i sekunden (ms: bildrutans tid), så att bilarna
  // och de som går förbi glider jämnt; ställningarna ritas i gängets takt
  // (uteTakt). Annars, och när gatan inte syns, ingenting här.
  function gatan(ms) {
    R.gatGlid = false;
    if (R.vlatt || calm() || !window.RumUte || !RumUte.glid) return;
    const ute = document.getElementById('rum-ute');
    if (!ute || !ute._gat || ute.classList.contains('vila') || !syns(ute)) return;
    R.gatGlid = Boolean(ute._fort);
    if (ms - (R.gatSist || 0) < 1000 / 60 - 4) return;
    R.gatSist = ms;
    R.gatGlid = RumUte.glid(ute, ms);
  }

  // CSS-animationerna (regnet, röken, hörnet) står still på samma tid som klockan.
  function freezeCss(t) {
    for (const a of R.el.getAnimations({ subtree: true })) {
      a.pause();
      a.currentTime = t * 1000;
    }
    // (gatans dukar på samma tid)
    if (window.RumUte && RumUte.takt) RumUte.takt(document.getElementById('rum-ute'), t * 1000);
  }

  // ---------- utsikten ----------

  // Stockholms klocka och väder (vader.js) i utsikten bakom glaset
  // (rum-ute.js), i dagsljuset som faller in och i gängets kläder (rum-3d.js).
  function paintUte(v) {
    if (!window.Vader || !window.RumUte || !R.el) return;
    v = v || Vader.nu();
    R.vader = v;
    RumUte.paint(document.getElementById('rum-ute'), v, [WIN, DORR]);
    // (nya fotgängare: uteTakt hämtar deras rörelser igen)
    R.uteAnim = null;
    const L = RumUte.light(v);
    const d = document.getElementById('rum-dagsljus');
    d.style.setProperty('--dagsljus', r1(L.dag * 0.9));
    d.style.setProperty('--dag-farg', L.sky[2]);
    if (R.dagFarg) dagDuk();
    ljusKlockan();
    ljusIhop();
    R.el.classList.toggle('aska', v.slag === 'aska');
    // lysröret släckt på natten (rum-folk.js)
    if (window.RumFolk) RumFolk.ute(v);
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
    if (R.ej3d) return Promise.reject(new Error('grafikkortet har hängt sig'));
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

  // Gängets kod och bilder börjar hämtas när rummet visas, också i telefonen
  // där gänget ritas först när det är dess tur: på långsamt nät är det hämtandet
  // som tar tid, och det kostar inget minne att ha filerna klara.
  function forhamta() {
    if (R.forhamtat || R.ej3d) return;
    R.forhamtat = true;
    const m = document.querySelector('script[type="importmap"]');
    const im = m ? JSON.parse(m.textContent).imports : {};
    const fil = ['environments/RoomEnvironment.js', 'geometries/RoundedBoxGeometry.js', 'utils/BufferGeometryUtils.js'].map((f) => im['three/addons/'] + f);
    for (const href of ['rum-3d.js', 'rum-gpu.js', 'rum-fika.js', 'rum-fest.js', 'rum-tecken.js', 'rum-dans.js', 'rum-uttryck.js', 'rum-vaxter.js', 'rum-kassetter.js', im.three, ...fil]) {
      const l = document.createElement('link');
      l.rel = 'modulepreload';
      l.href = href;
      document.head.append(l);
    }
    // (bilderna i rum-3d.js; de hamnar i webbläsarens cache och avkodas inte här)
    for (const f of ['ansikte-dl.svg', 'ansikte-dt.svg', 'ansikte-dj.svg', 'skagg-dj.svg', 'skold-nacional.png', 'skold-ifk.png']) {
      fetch(`rum/${f}`).then((r) => r.blob()).catch(() => {});
    }
  }

  // Sköldarna och kropparna (skoldar.js, kronan.js) hämtas när de syns. När 3D-
  // delarna står där hämtas de som finns i rummet, så att de är klara när man
  // går dit, och med bra nät också de i de dolda flikarna, som då öppnas lika
  // fort som om allt hade hämtats från början.
  function slappBilder() {
    const c = navigator.connection;
    const bra = !c || (!c.saveData && (!c.effectiveType || c.effectiveType === '4g'));
    for (const i of (bra ? document : R.el).querySelectorAll('img[loading="lazy"]')) i.loading = 'eager';
  }

  async function three() {
    if (R.fig || R.loading) return;
    R.loading = true;
    // askkoppen, snusdosan, fläkten och löpsedlarna (rum-saker.js, rum-affischer.js)
    tur(() => import('./rum-saker.js').then((m) => m.saker(R.el, { calm: calm(), short, namn: tavelnamn, kant: kantutjamning(), enkel: Boolean(KVAL[R.kval].enkel) })).then((x) => { R.saker = x; R.sakDuk = R.el.querySelector('canvas.rum-saker'); sikt(R.sakDuk); kval(R.kval); frame(); }), 2)
      .catch((err) => console.warn('Rummet: sakerna kunde inte ritas', err));
    // lysröret, neonen, skyltarna, skivan, uret, ramarna, paketen och kupongstället (rum-inredning.js)
    tur(() => import('./rum-inredning.js').then((m) => m.inredning(R.el, { calm: calm(), still, vagg: VAGG })).then((x) => { R.inr = x; tangenter(); x.namn(R.ramNamn); x.stopp(R.stopp); if (window.RumFolk && RumFolk.nattGrad) x.natt(RumFolk.nattGrad()); if (R.sak) sak(R.sak, null); frame(); }), 1)
      .catch((err) => console.warn('Rummet: inredningen kunde inte ritas', err));
    try {
      await tur(async () => {
        const mod = await import('./rum-3d.js');
        // (ansiktena efter hur det går och gick för kupongen redan från början: spel, senast)
        R.fig = await mod.figurer(document.getElementById('rum-3d'), { calm: calm(), vader: R.vader, detalj: KVAL[R.kval].detalj, kant: kantutjamning(), enkel: Boolean(KVAL[R.kval].enkel), spel: R.spel, senast: window.RumFolk ? RumFolk.senast() : null, rita: () => frame() });
        lappa();
        kval(R.kval);
        if (R.vem) R.fig.inne(R.vem, now());
        if (R.lage) R.fig.lage(R.lage, now());
        if (R.spel) R.fig.spel(R.spel, now());
        // de andra i gänget, natten och dagen efter (rum-folk.js)
        if (window.RumFolk) RumFolk.mount(R.el, { fig: () => R.fig, inr: () => R.inr, now, nara, fokus, teckna, lappKlick, visa, ta: taKupong, radio: () => sak('radio') });
        if (window.RumRadio) RumRadio.mount({ el: R.el, fig: () => R.fig, now, inr: () => R.inr, sak: (n) => sak(n), sakNu: () => R.sak });
        radioRuta();
        provMal();
        provAkt();
        provLapp();
        provGa();
        provRadio();
        frame();
      });
    } catch (err) {
      // utan WebGL eller utan nätet står rummet kvar utan gänget
      console.warn('Rummet: figurerna kunde inte ritas', err);
    }
    turTom().then(() => setTimeout(slappBilder, still() ? 0 : 1000));
  }

  // Det du har framme i rummet, för din figur (rum-folk.js): kupongen i
  // handen, tv:n, videon, anslagstavlan, kortregistret eller närbilden.
  function fokus() {
    if (R.kup || R.protokoll) return 'kupong';
    if (R.zoom) return 'tv';
    if (R.vnara) return 'video';
    if (R.ans && R.ans.on()) return 'anslag';
    if (R.reg && R.reg.on()) return 'register';
    if (R.tidning) return 'helgarderat';
    return R.sak || null;
  }

  // ---------- klicken ----------

  // snabbvalet på text-tv:n som föremålet leder till
  function hot(nav) {
    for (const a of R.el.querySelectorAll('[data-to]')) a.classList.toggle('hot', nav === a.dataset.to);
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

  // Kameran går fram: punkten p hamnar på to med förstoringen z. Det sätts
  // som transform direkt, inte som CSS-variabler: de ärvs av allt i rummet,
  // och Chrome målade då om allt som har en variabel i stilen – tv:ns och
  // anslagstavlans sidor, videons ritningar och väggarna – varje gång
  // kameran började gå fram eller tillbaka. Det ritades om medan kameran
  // gick, minnet tog slut och rutor fattades (flimmer). I Chromium har
  // transformen ett perspektiv som inte syns (.chromium i rum.css).
  function aim(p, z, to, cls) {
    const w = document.getElementById('rum-kamera');
    const dx = r1(to[0] - 800 - z * (p[0] - 800));
    const dy = r1(to[1] - 500 - z * (p[1] - 500));
    // (dit kameran går, för närbilden av radion: radioNara)
    R.kamMal = { dx, dy, z };
    const borta = Boolean(dx || dy || z !== 1);
    const satt = () => {
      w.classList.remove('glid');
      if (cls) w.classList.add(cls);
      w.style.transform = `translate(${dx}px, ${dy}px) scale(${z})${R.el.classList.contains('chromium') ? ' perspective(100000px)' : ''}`;
      R.aimT = performance.now();
      kvar(borta);
    };
    // (WebKit ritar hela rummet när kameran lämnar hemmet, kvar – och när den
    // går hem om det har släppts medan den stod nära videon, lattVideo)
    if (cls && WEBKIT && !calm()) kvar(true);
    R.aimT = Infinity;
    sedan('kamera', satt, Boolean(cls));
  }

  // En rörelse som börjar samtidigt som något nytt ska ritas: i WebKit när
  // det är ritat (glid), annars direkt. När kameran gick fram eller
  // tillbaka, tv:n vreds, rummet svängde runt videon eller något nytt syntes
  // tog den första bildrutan i Safari 100–250 ms på en snabb dator (längre i
  // en telefon) medan övergångarnas klocka gick, så att det som rörde sig
  // hoppade en tredjedel av vägen eller mer. Nu ritas det nya först, och
  // rörelsen börjar från början efter minst två bildrutor, när en bildruta
  // har gått fort igen (högst 20). Den senaste med samma nyckel gäller (en
  // rörelse som inte glider tar bort den som väntar).
  const SEDAN = {};
  function sedan(nyckel, fn, glid = true) {
    const n = (SEDAN[nyckel] = (SEDAN[nyckel] || 0) + 1);
    if (!glid || !WEBKIT || calm()) return fn();
    let k = 0;
    let fore = 0;
    const vanta = (ms) => {
      if (SEDAN[nyckel] !== n) return;
      if (++k >= 3 && (ms - fore < 40 || k > 20)) return fn();
      fore = ms;
      requestAnimationFrame(vanta);
    };
    requestAnimationFrame(vanta);
  }

  // WebKit (Safari, och alla webbläsare i iPhone) släpper det den har ritat
  // av rummet utanför bilden medan kameran står nära något, och när kameran
  // gick tillbaka ritades allt om på en gång: kameran stod still en stund och
  // hoppade sedan nästan hela vägen hem (glidningens klocka gick under tiden).
  // Så länge något pågår på kameran behåller WebKit allt, så medan kameran är
  // borta (borta) har den en osynlig rörelse som aldrig tar slut – en
  // hundradels bildpunkt fram och tillbaka – som tas bort när den är hemma
  // igen. Chrome behöver det inte.
  const WEBKIT = !navigator.userAgentData && /AppleWebKit/.test(navigator.userAgent);
  // Chrome: huvudtråden väcks bara till gängets bilder (loop)
  const TOMMA = Boolean(navigator.userAgentData);
  function kvar(borta) {
    // (mellan lådan och rutan är allt annat redan borta, lattVideo)
    if (!WEBKIT || calm() || (borta && R.utanKvar)) return;
    const w = document.getElementById('rum-kamera');
    const n = (R.kvarN = (R.kvarN || 0) + 1);
    if (borta) {
      if (!R.kvar) R.kvar = w.animate([{ translate: '0px 0px' }, { translate: '0.01px 0px' }], { duration: 1000, iterations: Infinity, direction: 'alternate' });
      return;
    }
    if (!R.kvar) return;
    // när kameran är hemma (och inte har gått iväg igen: anslagstavlan och
    // kortregistret ställer den hemma en stund för att mäta innan den glider)
    const hemma = () => {
      if (R.kvarN !== n || !R.kvar) return;
      R.kvar.cancel();
      R.kvar = null;
    };
    const g = w.getAnimations().find((a) => a.transitionProperty === 'transform');
    if (g) g.finished.then(hemma, () => {});
    else queueMicrotask(hemma);
  }

  // Ett föremål: tv:n, videon, anslagstavlan och kortregistret kommer fram,
  // kupongen tas i handen om den går att fylla i (annars går kameran fram
  // till den), din i högen om den går att ändra eller visa, ur kupongstället
  // en kupong för nästa omgång (openStall), och resten är närbilder (sak).
  // Inget leder ut ur rummet, utom Hasses kaffe när animationen med honom
  // finns (tillHasse).
  function go(a, e) {
    e.preventDefault();
    // ett nytt klick medan tidningen väntar på notiserna gäller i stället (vantaPaTidning)
    R.tidningVantar = false;
    if (a.id === 'rum-hasse') tillHasse(a);
    else if (a.id === 'rum-helgarderat') oppnaTidning();
    else if (a.dataset.sak) sak(a.dataset.sak);
    else if (a.dataset.nav === 'tv') zoomTv(!R.zoom);
    else if (a.dataset.nav === 'video') zoomVideo(!R.vnara);
    else if (a.id === 'rum-ans') board(true);
    else if (a.id === 'rum-reg') register(true);
    else if (a.id === 'rum-stall') openStall();
    else if (a.id === 'rum-kupong') {
      if (a.querySelector('.rum-vand')) vandKupong(a);
      else if (!openCoupon()) sak('kupong');
    } else if (a.classList.contains('rum-bak') && !(a.dataset.ta != null && openCoupon(a))) nudge(a);
  }

  // ---------- sammanställningen ----------
  //
  // När omgången är spelad och syns (rum-block.js): blocket i kupongens ställe, gängets lappar i 3D
  // och datorns siffra på videons ruta. Dolda resultat ger inget (tpScore).
  function summera(rd, p, t) {
    const g = p && p.gang && rd && !rd.next ? Samtal.pult.gang() : null;
    R.summa = g && window.RumBlock ? RumBlock.rakna({
      round: p.s, val: g.val, namn: rd.name || ((R.old || []).find((c) => (c.rows || []).some((r) => rd.ids.includes(String(r.id)))) || {}).name, nr: typeof couponNumber === 'function' ? couponNumber(rd.ids) : null,
      info: (KP.data && KP.data.samtal && KP.data.samtal.gang) || [], kort: short, now: t,
      analyser: analyserData ? analyserData.per : null,
    }) : null;
    // det Hasse sa står i analyserna, som hämtas först när protokollet behöver dem
    if (R.summa && R.summa.backe && !analyserData && !R.summaHamtar) {
      R.summaHamtar = true;
      loadAnalyser().then(() => { if (R.on) fill(); });
    }
    if (R.video && R.video.datorn) R.video.datorn(R.summa ? R.summa.dator.ok : null);
    lappa();
  }
  // Lapparna finns till måndagen efter omgången kl. 16 (RumBlock.lappar). Den man har lagt ner ligger
  // på bordet, på den här enheten för den omgången.
  const LAGDA_LAPPAR = 'profeterna.rum.lappar';
  function lagdaLappar(id) {
    if (!R.lagda || R.lagda.id !== id) {
      let bort = [];
      try {
        const j = JSON.parse(localStorage.getItem(LAGDA_LAPPAR));
        if (j && j.id === id && Array.isArray(j.bort)) bort = j.bort;
      } catch (e) { /* då är de uppe igen nästa gång */ }
      R.lagda = { id, bort };
    }
    return R.lagda.bort;
  }
  function lappa() {
    if (!R.fig || !R.fig.lappar) return;
    const sam = window.Samtal && Samtal.pult;
    const st = sam && sam.state();
    // (den förra omgångens står kvar också när nästa ligger på pulten, men inte sedan den har börjat)
    const t = Date.now();
    const borjat = st && Math.min(...st.s.matcher.map((x) => Date.parse(x.avspark))) <= t;
    const o = window.RumBlock && RumBlock.lappar && sam && sam.forra ? RumBlock.lappar(borjat ? [st.s] : [st && st.s, sam.forra()], t) : null;
    R.lappar = o;
    const vem = o ? Object.fromEntries(Object.entries(o.vem).map(([k, v]) => [k, { ...v, ner: lagdaLappar(o.id).includes(k) }])) : null;
    const nyckel = (R.lappNyckel = JSON.stringify(vem));
    const klar = () => { if (R.lappNyckel === nyckel && R.fig) R.fig.lappar(vem, calm() ? now() - 10 : now()); };
    // (Caveat måste vara inläst innan siffrorna ritas på lapparna)
    if (vem && document.fonts && document.fonts.load) document.fonts.load('700 200px Caveat').then(klar, klar);
    else klar();
  }
  // Ett klick på någon i gänget som har en lapp: hen lägger ner den på bordet eller tar upp den igen.
  // → om klicket gick åt till det.
  function lappKlick(k) {
    const o = R.lappar;
    if (!o || !o.vem[k] || !R.fig || !R.fig.lappVand) return false;
    if (Date.now() >= o.slut) {
      lappa();
      return false;
    }
    const bort = lagdaLappar(o.id);
    const ner = !bort.includes(k);
    // (den som sover rör den inte: den ligger som den låg när hen vaknar)
    if (!R.fig.lappVand(k, ner, calm() ? now() - 10 : now())) return false;
    if (ner) bort.push(k);
    else bort.splice(bort.indexOf(k), 1);
    try { localStorage.setItem(LAGDA_LAPPAR, JSON.stringify({ id: o.id, bort })); } catch (e) { /* då är den uppe igen nästa gång */ }
    // (i ett rum som står still syns det när gänget ritas om)
    if (calm()) frame();
    return true;
  }

  // Protokollet på pulten: det lyfts och läggs fram stort över rummet, som står still så länge, och går
  // tillbaka samma väg. Esc, Lägg tillbaka eller ett klick utanför lägger tillbaka det. I smala fönster
  // är det den smala versionen, och ryms det inte på höjden går det att rulla, i stället för att bli oläsligt.
  // Från korktavlan (fran: { sum, lapp, kork }, korkProtokoll) tas kupongen från nålen och blir omgångens protokoll,
  // ←/→, pilarna bredvid Häng tillbaka eller ett svep i sidled bläddrar till omgången före och efter (bladdra), och
  // Häng tillbaka sätter tillbaka den. Under bladet kan man ropa till Hasse om poängen (protHasse), och ett klick
  // på en rad lägger fram matchbladet efter matchen (protMatch).
  function protokollet(pa = true, nu = false, fran = null) {
    const p = R.protokoll;
    if (!pa) {
      if (!p || p.ut) return;
      // Hasse tystnar och matchbladet går: bladet står där det står utan dem innan det läggs tillbaka
      if (p.hk) protHasse(false, true);
      p.ut = true;
      if (p.blad) p.blad.ut(true);
      lagerUt('protokollet');
      if (p.vand) p.vand.cancel();
      const klar = () => {
        p.mork.remove();
        p.el.remove();
        R.el.classList.remove('protokoll-uppe');
        if (p.lapp) p.lapp.classList.remove('nere');
        R.protokoll = null;
        R.vilar = false;
      };
      const bilder = !nu && !calm() && !p.lyft && lyftBilder(p);
      if (p.lyft && !nu && !calm()) {
        // på väg upp: det vänder där det är
        p.lyft.reverse();
        p.tona.reverse();
      } else if (bilder) {
        p.el.style.overflowY = 'hidden';
        p.lyft = p.b.animate(bilder, { duration: 640, direction: 'reverse', fill: 'both' });
        p.tona = p.mork.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 640, easing: 'ease', direction: 'reverse', fill: 'both' });
      } else {
        klar();
        return;
      }
      p.lyft.finished.then(klar, klar);
      return;
    }
    const sum = fran ? fran.sum : R.summa;
    if (p || !sum) return;
    const mork = document.createElement('div');
    mork.className = 'rum-protokoll-mork';
    const el = document.createElement('div');
    el.className = 'rum-protokoll';
    el.tabIndex = -1;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Protokoll');
    // från korktavlan står Häng tillbaka mellan pilarna till omgången före och efter (bladdra)
    const kork = fran && fran.kork ? fran.kork : null;
    const tillbaka = `<button type="button" class="rt-tillbaka">${fran ? 'Häng tillbaka' : 'Lägg tillbaka'}</button>`;
    el.innerHTML = RumBlock.html(sum, { tat: innerWidth < 555, matcher: true }) +
      `<div class="rp-rad"><button type="button" class="hs-ropa" data-rp="hasse" aria-expanded="false">${PROT_ROP}</button>` +
      (kork ? `<span class="rp-blad"><button type="button" class="rt-pil" data-pil="-1" aria-label="Omgången före">←</button>${tillbaka}` +
        '<button type="button" class="rt-pil" data-pil="1" aria-label="Omgången efter">→</button></span>' : tillbaka) + '</div>';
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'mouseover', 'wheel', 'touchstart', 'touchmove']) el.addEventListener(n, (e) => e.stopPropagation());
    R.el.append(mork, el);
    const rad = el.querySelector('.rp-rad');
    // Hasse, pratbubblan och spetsen: över bladet och under raden (rum-hasse-svar.js)
    const q = R.protokoll = { el, mork, b: el.querySelector('.rum-block'), lapp: fran ? fran.lapp : null, sum, rad, hs: RumHasseSvar.mount(el, { fore: rad, calm }), hk: false, dx: 0, kork };
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // (ett svep med musen slutar med ett klick, som inte ska lägga tillbaka bladet)
      if (q.svept && e.timeStamp - q.svept < 500) return;
      const pil = e.target.closest('.rt-pil');
      if (pil) {
        if (!pil.disabled) bladdra(Number(pil.dataset.pil));
      } else if (e.target.closest('[data-rp="hasse"]')) protHasse(!q.hk);
      // ett klick på svaret: resten direkt
      else if (q.hs.i(e)) q.hs.hoppa();
      else if (e.target.closest('.rt-tillbaka')) protokollet(false);
      // en rad: matchbladet efter matchen
      else if (e.target.closest('.rum-block [data-rad]')) protMatch(Number(e.target.closest('[data-rad]').dataset.rad));
      else if (e.target.closest('.rum-block, .rp-rad')) return;
      // utanför: först tystnar Hasse, sedan läggs bladet tillbaka
      else if (q.hk) protHasse(false);
      else protokollet(false);
    });
    // med musen: raden man pekar på tonas hela vägen över, så att det syns att den går att ta fram
    const pek = (rad) => {
      if (rad === q.pek) return;
      for (const c of q.b.querySelectorAll('.pek')) c.classList.remove('pek');
      q.pek = rad;
      if (rad != null) for (const c of q.b.querySelectorAll(`[data-rad="${rad}"]`)) c.classList.add('pek');
    };
    el.addEventListener('pointerover', (e) => {
      const c = e.pointerType === 'mouse' && !q.lyft && !q.vand ? e.target.closest('.rum-block [data-rad]') : null;
      pek(c ? c.dataset.rad : null);
    });
    el.addEventListener('pointerleave', () => pek(null));
    q.pekUt = () => pek(null);
    if (kork) {
      // ett svep i sidled över bladet bläddrar, som pilarna (fingret åt vänster: omgången efter)
      let ned = null;
      el.addEventListener('pointerdown', (e) => { ned = e.isPrimary && !e.target.closest('.rp-rad') && !q.hs.i(e) ? [e.pointerId, e.clientX, e.clientY] : null; });
      el.addEventListener('pointercancel', () => { ned = null; });
      el.addEventListener('pointerup', (e) => {
        if (!ned || e.pointerId !== ned[0]) return;
        const [dx, dy] = [e.clientX - ned[1], e.clientY - ned[2]];
        ned = null;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        q.svept = e.timeStamp;
        bladdra(dx < 0 ? 1 : -1);
      });
      korkPilar(q);
    }
    passaProtokoll();
    R.vilar = true;
    lager('protokollet', (ut) => protokollet(false, ut));
    const bilder = !calm() && lyftBilder(q);
    // det som tas fram är borta där det låg: bladet på pulten, eller kupongen på nålen
    if (q.lapp) q.lapp.classList.add('nere');
    else R.el.classList.add('protokoll-uppe');
    el.focus({ preventScroll: true });
    if (!bilder) return;
    // (medan det är på väg ska fönstret inte kunna rullas av att det ligger långt ner)
    el.style.overflowY = 'hidden';
    q.lyft = q.b.animate(bilder, { duration: 760, fill: 'both' });
    q.tona = mork.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, easing: 'ease', fill: 'both' });
    q.lyft.finished.then(() => {
      if (q.ut) return;
      // framme: inget eget lager, så att texten står skarp och inget ritas om
      q.lyft.cancel();
      q.lyft = null;
      q.tona.cancel();
      el.style.overflowY = '';
    }, () => {});
  }
  // En rad i protokollet: matchbladet efter matchen (RumMatchblad.fram med efter) läggs fram över bladet, med
  // omgångens matcher i protokollets ordning, så att numret i bandet är radens. Krysset, Esc eller ett klick
  // utanför lägger bort det, och protokollet ligger kvar som det låg. En match ur ett gammalt protokoll som inte
  // längre finns i spelprogrammet får lagen och resultatet ur protokollet.
  function protMatch(i) {
    const p = R.protokoll;
    const sum = p && p.sum;
    if (!sum || p.ut || p.blad || p.lyft || p.vand || !window.RumMatchblad || !sum.rader[i]) return;
    const matcher = sum.rader.map((r) => {
      const m = state.all ? state.all.matches.find((x) => String(x.id) === String(r.id)) : null;
      if (m) return m;
      const s = /^(\d+)–(\d+)$/.exec(r.mal || '');
      return { id: String(r.id), home: r.hemma || r.h, away: r.borta || r.b, kickoff: null, comp: null, completed: true, status: 'STATUS_FULL_TIME', score: s ? { home: +s[1], away: +s[2] } : null };
    });
    if (p.hk) protHasse(false);
    if (p.pekUt) p.pekUt();
    p.blad = RumMatchblad.fram({
      inom: R.el, matcher, id: String(sum.rader[i].id), kupong: sum.nr ? `Kupong ${sum.nr}` : 'Kupong', tillbaka: 'protokollet',
      smal: () => Boolean(R.smal), calm, efter: sum,
      nar: () => {
        p.blad = null;
        if (p.ut) return;
        const k = p.b.querySelector(`.rb-mk[data-rad="${i}"]`);
        (k || p.el).focus({ preventScroll: true });
      },
    });
  }

  // Så stort som ryms, men inte så litet att det inte går att läsa.
  function passaProtokoll() {
    const p = R.protokoll;
    if (!p) return;
    p.b.style.zoom = 1;
    const k = Math.min((p.el.clientWidth - 24) / p.b.offsetWidth, 1.5, Math.max((innerHeight - 74) / p.b.offsetHeight, 0.8));
    p.bredd = p.b.offsetWidth * Number(k.toFixed(3));
    p.b.style.zoom = k.toFixed(3);
    protHassePlats();
  }

  // ---------- Hasse om poängen ----------
  //
  // Under protokollet ropar man till Hasse om raden Poäng (Hasse, hur räknas poängen?, eller H), och han
  // lutar sig in från baren nere till vänster och svarar, som vid anslagstavlan (rum-hasse-svar.js): vad
  // rätt och poäng är, ett exempel ur omgången (RumBlock.exempel, sägs tyst) och vad han själv gör med det.
  // Svaret står till vänster om bladet, som då glider åt höger så långt som behövs, eller över bladet när
  // det inte ryms bredvid (i telefonen och i smala fönster), med raden under svaret. Tack, Hasse, Esc eller
  // ett klick utanför tystar honom, och han tystnar när bladet läggs tillbaka.
  const PROT_ROP = 'Hasse, hur räknas poängen?';
  const PROT_TACK = 'Tack, Hasse';
  function protSvaret() {
    const H = window.HasseRepliker;
    const rep = H && H.protokoll;
    if (!rep) return [];
    const ex = R.protokoll && R.protokoll.sum ? RumBlock.exempel(R.protokoll.sum) : null;
    const forst = H.ropSvar[Math.floor(Math.random() * H.ropSvar.length)];
    return [[forst], ...rep.forklaring, ...(ex ? [[ex]] : []), ...rep.rad];
  }
  // on: ropar till honom, annars tackar man. nu: utan rörelse (bladet läggs tillbaka).
  function protHasse(on, nu = false) {
    const p = R.protokoll;
    if (!p || p.ut || on === p.hk) return;
    p.hk = on;
    const ropa = p.rad.querySelector('[data-rp="hasse"]');
    ropa.textContent = on ? PROT_TACK : PROT_ROP;
    ropa.setAttribute('aria-expanded', String(on));
    if (!on) {
      lagerUt('protokollet-hasse');
      p.hs.ut(nu);
      protRad(p, false);
      protFlytt(p, 0, !nu);
      return;
    }
    lager('protokollet-hasse', () => protHasse(false));
    p.hs.svara(protSvaret());
    p.hs.fram();
    protHassePlats(true);
  }
  // Bladet och raden under det står mitt i fönstret och glider dx åt höger (paddingen till vänster
  // om dem; bladets egen transform hör till lyftet).
  function protFlytt(p, dx, anim) {
    if (Math.abs(dx - p.dx) < 0.5) return;
    const fran = `${r1(12 + 2 * p.dx)}px`;
    const till = `${r1(12 + 2 * dx)}px`;
    p.dx = dx;
    p.el.style.paddingLeft = dx ? till : '';
    if (anim && !calm()) p.el.animate([{ paddingLeft: fran }, { paddingLeft: till }], { duration: 460, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' });
  }
  // Raden under bladet, eller (fast) under svaret när det står över bladet.
  function protRad(p, fast) {
    p.rad.classList.toggle('fast', fast);
    if (!fast) p.rad.style.cssText = '';
  }
  // Svarets plats, som vid anslagstavlan (hkPlats i rum-anslag.js): bredvid bladet med överkanten vid
  // bladets, eller mitt över det. Bubblan täcker aldrig hans ansikte: står den ovanför honom slutar den
  // ovanför hans hår, och ryms svaret inte rullar det.
  function protHassePlats(anim = false) {
    const p = R.protokoll;
    if (!p || !p.hk) return;
    const hs = p.hs;
    const min = 24;
    const bw = p.bredd || p.b.getBoundingClientRect().width;
    // bredvid bladet när bubblan får minst sin vanliga bredd där, och bredare när det finns plats (så att
    // svaret ryms ovanför hans huvud); annars över bladet
    const ledigt = innerWidth - 12 - bw - 28 - 16;
    const over = ledigt < 400;
    hs.bubbla.style.width = over ? '' : `${r1(Math.min(520, ledigt))}px`;
    const w = hs.bubbla.offsetWidth;
    // där bladet börjar när svaret står bredvid
    const vanster = 16 + w + 28;
    protRad(p, over);
    let F = hs.figur(over);
    // raden under bubblan ska få plats på en rad till höger om spetsen; i ett smalt fönster blir han
    // så mycket mindre som behövs
    if (over) {
      const barn = [...p.rad.children].filter((e) => e.offsetWidth);
      const bredd = barn.reduce((sum, e) => sum + e.offsetWidth, 0) + 16 * (barn.length - 1);
      const plats = innerWidth - 16 - bredd - 10 - 28 - 4;
      if (F.hoger > plats) F = hs.figur(over, F.H * Math.max(0.7, plats / F.hoger));
    }
    const mitt = (p.el.clientWidth - bw) / 2;
    const dx = over ? 0 : Math.max(0, vanster - mitt);
    protFlytt(p, dx, anim);
    const x = over ? (innerWidth - w) / 2 : mitt + dx - 28 - w;
    const golv = over ? F.topp - 56 : x < F.hoger + 12 ? F.topp - 14 : innerHeight - 24;
    hs.bubbla.style.maxHeight = `${r1(Math.max(160, golv - min))}px`;
    const H = hs.bubbla.offsetHeight;
    const my = F.mun[1];
    const top = p.lyft ? min : p.b.getBoundingClientRect().top;
    const y = Math.max(min, over ? Math.min(golv - H, Math.max((min + golv - H) / 2, my - 170 - H)) : Math.min(top, golv - H));
    const { f2, under } = hs.placera(F, x, y, over, x + w + 40);
    if (over) {
      p.rad.style.top = `${r1(y + H + 8)}px`;
      if (under) {
        p.rad.style.paddingLeft = `${r1(f2[0] + 10)}px`;
        p.rad.style.columnGap = '16px';
      }
    }
  }
  // Vägen mellan pulten och fönstret: bladet ligger i pultens lutning och lossnar uppåt. → bildrutorna,
  // eller null om blocket inte ligger på pulten (kupongen i handen, omgången har bytts).
  function lyftBilder(p) {
    if (p.kork) return nalBilder(p);
    const kalla = R.el.querySelector('#rum-kupong > .rum-block');
    const a = kalla && kalla.getBoundingClientRect();
    if (!a || !a.width) return null;
    const b = p.b.getBoundingClientRect();
    const k = (a.width * 0.9) / b.width;
    const vrid = R.smal ? -1.2 : -4;
    // (lutningen gör att bladets mitt inte är rutans mitt: den ligger högre, och vridningen drar den åt sidan)
    const dx = a.left + a.width * (0.5 + vrid * 0.0085) - b.left - b.width / 2;
    const dy = a.top + a.height * 0.45 - b.top - b.height / 2;
    // (bladets zoom förstorar också längderna i dess transform)
    const z = Number(p.b.style.zoom) || 1;
    const t = (x, y, rx, rz, s) => `translate(${r1(x / z)}px, ${r1(y / z)}px) perspective(${r1(1340 / z)}px) rotateX(${rx}deg) rotate(${rz}deg) scale(${s.toFixed(3)})`;
    return [
      { offset: 0, transform: t(dx, dy, 41, vrid, k), easing: 'cubic-bezier(0.3, 0, 0.5, 1)' },
      { offset: 0.24, transform: t(dx * 0.96, dy - 42, 35, vrid - 1, k * 1.04), easing: 'cubic-bezier(0.25, 0.55, 0.3, 1)' },
      { offset: 1, transform: t(0, 0, 0, 0, 1) },
    ];
  }
  // Vägen mellan korktavlan och fönstret: kupongen lossnar från nålen, svänger lite och kommer fram som
  // protokollet. En omgång vars kupong inte hänger på tavlan (bläddrad dit, eller tavlan har ritats om) tonar
  // bara bort. → bildrutorna.
  function nalBilder(p) {
    const a = p.lapp && p.lapp.isConnected && p.lapp.getBoundingClientRect();
    if (!a || !a.width) return [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }];
    const b = p.b.getBoundingClientRect();
    const k = (a.width * 0.9) / b.width;
    const vrid = parseFloat(p.lapp.style.getPropertyValue('--rot')) || 0;
    const dx = a.left + a.width / 2 - b.left - b.width / 2;
    const dy = a.top + a.height / 2 - b.top - b.height / 2;
    // (bladets zoom förstorar också längderna i dess transform)
    const z = Number(p.b.style.zoom) || 1;
    const t = (x, y, rz, s) => `translate(${r1(x / z)}px, ${r1(y / z)}px) rotate(${r1(rz)}deg) scale(${s.toFixed(3)})`;
    return [
      { offset: 0, opacity: 0, transform: t(dx, dy, vrid, k), easing: 'cubic-bezier(0.3, 0, 0.5, 1)' },
      { offset: 0.22, opacity: 1, transform: t(dx, dy + a.height * 0.15, vrid * -0.6, k * 1.08), easing: 'cubic-bezier(0.25, 0.55, 0.3, 1)' },
      { offset: 1, opacity: 1, transform: t(0, 0, 0, 1) },
    ];
  }
  // Pilarna under protokollet från korktavlan: bara åt det håll där det finns en omgång.
  function korkPilar(p) {
    for (const b of p.el.querySelectorAll('.rt-pil')) b.disabled = !p.kork.lista[p.kork.i - Number(b.dataset.pil)];
  }
  // Bläddrar i protokollen från korktavlan: steg −1 är omgången före, 1 omgången efter. Bladet glider ut åt sidan
  // och nästa in från andra hållet, och den kupong som hänger på tavlan för omgången är borta från nålen i stället.
  function bladdra(steg) {
    const p = R.protokoll;
    const k = p && p.kork;
    if (!k || p.ut || p.lyft) return;
    // (ett tryck medan bladet glider väntar tills det har kommit fram)
    if (p.vand) {
      p.nasta = steg;
      return;
    }
    const x = k.lista[k.i - steg];
    const sum = x && korkSumma(x);
    if (!sum) return;
    k.i -= steg;
    // (Hasses svar har ett exempel ur omgången: han tystnar först)
    if (p.hk) protHasse(false);
    const byt = () => {
      const ny = document.createElement('div');
      ny.innerHTML = RumBlock.html(sum, { tat: innerWidth < 555, matcher: true });
      if (p.pekUt) p.pekUt();
      const blad = ny.firstElementChild;
      p.b.replaceWith(blad);
      p.b = blad;
      p.sum = sum;
      passaProtokoll();
      p.el.scrollTop = 0;
      if (p.lapp) p.lapp.classList.remove('nere');
      p.lapp = korkLapp(x);
      if (p.lapp) p.lapp.classList.add('nere');
      korkPilar(p);
      // (en pil som inte går längre tappar fokus: tangenterna ska ändå gälla bladet)
      if (!p.el.contains(document.activeElement)) p.el.focus({ preventScroll: true });
    };
    if (calm()) {
      byt();
      return;
    }
    const sida = (s) => `translateX(${r1((s * 70) / (Number(p.b.style.zoom) || 1))}px) rotate(${s * 1.5}deg)`;
    p.vand = p.b.animate([{ transform: 'none', opacity: 1 }, { transform: sida(-steg), opacity: 0 }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
    p.vand.finished.then(() => {
      if (p.ut) return;
      byt();
      p.vand = p.b.animate([{ transform: sida(steg), opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 210, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' });
      p.vand.finished.then(() => {
        p.vand = null;
        const n = p.nasta;
        p.nasta = 0;
        if (n) bladdra(n);
      }, () => {});
    }, () => {});
  }

  // ---------- tidningen ----------
  //
  // Helgarderat (rum-tidning.js) ligger på pulten till höger om högen med de inlämnade kupongerna: ett klick, eller L,
  // och den lyfts och läggs fram över rummet, som står still så länge. Det är samma tidning som på sajten
  // (helgarderat.html), för det finns bara en (2026-11-11): omslaget, Stryktipskupongen och ett matchblad per match, ur numret som
  // nattjobbet skriver inför omgången (data/poddsidor.json). Numret ligger kvar tills nästa kommer, också efter
  // omgången. Esc, Lägg tillbaka, bakåt eller ett klick utanför lägger tillbaka den. (Förut hade tidningen på pulten
  // egna avdelningar, Tipset, notiserna och Veckans analys, och ett eget nummer efter omgången, och var en annan än
  // sajtens.)
  let hgNumret = null;
  let hgAt = 0;
  let hgReq = null;
  // Numret, högst var femte minut. Ett nummer som inte gick att hämta byter inte ut det som ligger. → upplagan eller null
  function hamtaTidning() {
    if (!window.RumTidning || !RumTidning.hamta) return Promise.resolve(null);
    if (hgReq && Date.now() - hgAt < 5 * 60000) return hgReq;
    hgAt = Date.now();
    hgReq = RumTidning.hamta().catch(() => null).then((u) => {
      if (u) hgNumret = u;
      if (R.on) tidningPult();
      return hgNumret;
    });
    return hgReq;
  }
  // Numret när man pekar på tidningen eller sätter fingret på den, så att det finns när den öppnas.
  function forberedTidning() {
    if (R.tidning) return;
    hamtaTidning();
  }
  // Omslaget på pulten, när det har ändrats (i fill, och när numret har kommit), 1,75 gånger omslaget (--z i
  // rum-tidning.css).
  function tidningPult() {
    const a = R.el && R.el.querySelector('#rum-helgarderat');
    if (!a || !window.RumTidning || !RumTidning.forsta) return;
    const html = `<span class="hf-pult">${RumTidning.forsta(hgNumret)}</span>`;
    if (a.skrivet === html) return;
    a.skrivet = html;
    a.innerHTML = html;
  }
  // Ett klick på tidningen, eller L: numret hämtas först (högst ett par sekunder), och sedan lyfts den från pulten och
  // läggs fram.
  function oppnaTidning() {
    const a = R.el && R.el.querySelector('#rum-helgarderat');
    if (!window.RumTidning || !RumTidning.tidning || !a || R.tidning) return;
    const fram = () => lyft(a, false).then(() => {
      if (!(R.on && !R.tidning && tidningen(true))) lyft(a, true);
    });
    vantaPaTidning(fram);
  }
  // Numret, högst två och en halv sekund; sedan gor(), om inget annat har hänt.
  function vantaPaTidning(gor) {
    const gans = new Promise((ok) => setTimeout(ok, 2500));
    R.tidningVantar = true;
    Promise.race([hamtaTidning(), gans]).catch(() => {}).then(() => {
      if (!R.tidningVantar) return;
      R.tidningVantar = false;
      if (R.on && !R.tidning) gor();
    });
  }

  // Tidningen lyfts från pulten mot en och syns inte där medan den är framme; bort: den läggs tillbaka. (UPPE: samma
  // funktioner i samma ordning som --vila i rum-tidning.css, så att den glider dit)
  const UPPE = 'perspective(1100px) translate3d(-434px, -60px, 260px) rotateX(4deg) rotateZ(0deg) scale(1.3)';
  function lyft(a, bort) {
    for (const x of a.getAnimations()) x.cancel();
    if (bort) a.classList.remove('uppe');
    if (calm()) {
      if (!bort) a.classList.add('uppe');
      return Promise.resolve();
    }
    const vila = getComputedStyle(a).getPropertyValue('--vila').trim();
    const k = [{ transform: vila, opacity: 1 }, { transform: UPPE, opacity: 0 }];
    // (över kupongen, notan och högen medan den är i luften)
    a.classList.add('lyfts');
    const an = bort ? a.animate(k.reverse(), { duration: 340, easing: 'cubic-bezier(0.25, 0.7, 0.35, 1)' })
      : a.animate(k, { duration: 260, easing: 'cubic-bezier(0.45, 0, 0.75, 0.55)', fill: 'forwards' });
    // (i en telefon som inte hinner rita blir det inte längre än så här)
    const klar = Promise.race([an.finished.catch(() => {}), new Promise((ok) => setTimeout(ok, 330))])
      .then(() => { if (!a.getAnimations().some((x) => x !== an && x.playState === 'running')) a.classList.remove('lyfts'); });
    if (bort) return klar;
    return klar.then(() => {
      a.classList.add('uppe');
      an.cancel();
    });
  }

  // Tidningen framme över rummet, från pulten: samma ark som på sajten.
  function tidningen(pa = true) {
    const a = R.el && R.el.querySelector('#rum-helgarderat');
    if (!pa) {
      if (!R.tidning) return false;
      if (a) lyft(a, true);
      R.tidning.remove();
      R.tidning = null;
      R.vilar = false;
      lagerUt('tidningen');
      return false;
    }
    if (R.tidning) return true;
    if (!window.RumTidning || !RumTidning.tidning) return false;
    const el = document.createElement('div');
    el.className = 'rum-tidningen';
    el.tabIndex = -1;
    el.innerHTML = `<div class="hg" role="document" aria-label="Helgarderat">${RumTidning.tidning(hgNumret)}</div>` +
      '<button type="button" class="tn-tillbaka">Lägg tillbaka</button>';
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'mouseover', 'wheel', 'touchstart', 'touchmove']) el.addEventListener(n, (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // En länk inne i tidningen (kupongens rader, omslaget och namnet i sidhuvudet): dit, utan att adressen ändras.
      // Källorna öppnas i en ny flik.
      const l = e.target.closest('a');
      if (l) {
        const h = l.getAttribute('href') || '';
        const s = h.startsWith('#hg-') ? el.querySelector(h) : null;
        if (h.startsWith('#')) e.preventDefault();
        if (s) {
          const y = s.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
          el.scrollTo({ top: y - 8, behavior: calm() ? 'auto' : 'smooth' });
        }
        return;
      }
      if (!e.target.closest('.hg-omslaget, .hg-kupong, .hg-ark') || e.target.closest('.tn-tillbaka')) tidningen(false);
    });
    if (a) a.classList.add('uppe');
    R.el.append(el);
    R.tidning = el;
    R.vilar = true;
    lager('tidningen', () => tidningen(false));
    passaTidning();
    RumTidning.bildfel(el);
    // pilarna, mellanslag och Page Down bläddrar i tidningen
    el.focus({ preventScroll: true });
    return true;
  }
  // Omslaget så stort som ryms med början av nästa ark under sig, så att det syns att tidningen fortsätter
  // (RumTidning.passa, samma som på sajten).
  function passaTidning() {
    const t = R.tidning;
    if (!t) return;
    RumTidning.passa(t.querySelector('.hg'), t.clientWidth - (R.smal ? 20 : 24), t.clientHeight);
  }

  // Gängets kupong med baksidan upp vänds på pulten: den lyfts och vänds
  // runt sin långa mitt, och framsidan ritas när den står på kant. Pennan
  // följer inte med i vändningen.
  function vandKupong(desk) {
    const p = pult();
    if (!p || R.vander) return;
    sparaVand(p);
    if (calm()) {
      fill();
      return;
    }
    const m = getComputedStyle(desk).transform;
    const at = (z, y) => ({ transform: `${m} translateZ(${z}px) rotateY(${y}deg)` });
    const pen = desk.querySelector('.pencil');
    if (pen) pen.style.visibility = 'hidden';
    R.vander = true;
    const upp = desk.animate([at(0, 0), at(40, 90)], { duration: 240, easing: 'cubic-bezier(0.45, 0, 0.9, 0.6)', fill: 'forwards' });
    upp.finished.then(() => {
      fill();
      const ned = desk.animate([at(40, -90), at(0, 0)], { duration: 380, easing: 'cubic-bezier(0.15, 0.5, 0.35, 1)' });
      upp.cancel();
      return ned.finished;
    }).catch(() => {}).finally(() => {
      R.vander = false;
      const p2 = desk.querySelector('.pencil');
      if (p2) p2.style.visibility = '';
    });
  }

  // En kupong i högen som du inte får vända på än (du ser inte hens tips):
  // den lyfts lite i kanten mot kupongen och faller tillbaka.
  function nudge(a) {
    if (calm() || a.getAnimations().length) return;
    const base = a.style.transform;
    a.animate([
      { transform: base, easing: 'cubic-bezier(0.3, 0, 0.4, 1)' },
      { transform: `${base} translateZ(18px) rotateY(8deg) rotateX(-5deg)`, offset: 0.4, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
      { transform: base, offset: 0.78, easing: 'ease-out' },
      { transform: `${base} translateZ(3px)`, offset: 0.88, easing: 'ease-in' },
      { transform: base },
    ], { duration: 560 });
  }

  // T: tv:n nära, vriden mot en, så att text-tv:n går att läsa och knapparna
  // att trycka på. Kameran siktar på rutan där den hamnar när tv:n har vridits.
  function zoomTv(on) {
    // (var den inte nära ska inget röra sig: tv:n svängde annars runt när
    // kupongen togs i handen, och kameran väntade in vridningen)
    if (!on && R.zoom === false) return;
    if (on && R.vnara) zoomVideo(false);
    if (on && R.reg && R.reg.on()) register(false);
    R.zoom = on;
    if (on) lager('tv', () => zoomTv(false));
    else lagerUt('tv');
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
    if (on) vrid(0, 0);
    else vridHem();
    if (on && r) {
      R.tvMatt = { c: centerOf(r), b: r.width / R.k, h: r.height / R.k };
      aimTv(calm() ? null : 'glid');
    } else aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
  }
  // så nära som ryms i fönstret (i telefonen fyller tv:n bredden)
  function aimTv(cls) {
    const { c, b, h } = R.tvMatt;
    const z = Math.min(3.6, (innerWidth - 24) / (b * R.k), (innerHeight - 110) / (h * R.k));
    aim(c, z, mid(0.5, 0.48), cls);
  }

  // V: videon nära. Kameran går fram till hörnet på disken – tv:n, högen
  // på den och lådan bredvid – och förstorar så mycket som ryms över raden
  // med tangenterna.
  function zoomVideo(on) {
    if (!R.video || (!on && !R.vnara)) return;
    if (!on) lattVideo(0);
    if (on && R.zoom) zoomTv(false);
    if (on && R.ans && R.ans.on()) board(false);
    if (on && R.reg && R.reg.on()) register(false);
    R.vnara = on;
    if (on) lager('video', () => zoomVideo(false));
    else lagerUt('video');
    // hörnet ritas skarpt bara när rutan fyller bilden (tat i rum-video.js),
    // och i halva storleken igen när tv:n har vridits bort
    clearTimeout(R.vskarp);
    if (on) R.video.skarp(false);
    else R.vskarp = setTimeout(() => { if (!R.vnara) R.video.skarp(false); }, 900);
    R.el.classList.toggle('vid-nara', on);
    if (on) {
      R.tx = 0;
      R.ty = 0;
      if (calm()) R.mx = R.my = 0;
      vrid(0, 0);
    }
    R.vf = R.video.zoom(on);
    if (on) aimVideo(calm() ? null : 'glid');
    else {
      sving(R.vf, 0, calm() ? null : 'glid');
      vridHem();
      aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
    }
  }
  // Kameran svänger runt videon: rummets plan vrids sv grader i 3D kring tv:n,
  // som står i planet -598 där f.mitt ligger (scenens x), medan rum-video.js
  // ritar hörnet från samma håll. Hörnets plan vrids inte – Chrome ritar det
  // som lutar i perspektiv suddigt nära, och tv:n står ju där rummet vrids
  // kring – utan står kvar vänt mot kameran, så långt framför väggen som den
  // vrids fram vid kant (bildens vänstra kant eller lådans, aimVideo) och
  // lika mycket mindre, så att det syns där det syntes. Det räknas längs
  // synlinjen genom kanten, där den möter den vridna väggen (nämnaren) – rakt
  // bakom kanten räckte inte, och väggen skar av lådans vänstra del. Första gången får
  // planen samma form utan övergång, så att de vrids kring tv:n hela vägen.
  const KV = ((PERSP + 598) / PERSP) * 1.035;
  function sving(f, sv, cls, kant = f.kant) {
    const pl = [...R.el.querySelectorAll('.rum-world > .rum-pl')];
    const dx = r1((f.mitt - 800) * KV);
    const tan = Math.tan((sv * Math.PI) / 180);
    // (högst till 20 bakom planet -330, så att ordningen mot det är som förut)
    const dz = sv ? Math.min(((f.mitt - kant) * KV * tan) / (1 - ((kant - 800) * 1.035 * tan) / PERSP) + 8, 598 - 350) : 0;
    const satt = (v, z) => {
      for (const p of pl) {
        p.style.transform = p.querySelector('#rum-vhs')
          ? `translate3d(0px, 0px, ${r1(z)}px) scale(${((PERSP + 598 - z) / (PERSP + 598)).toFixed(4)}) ${p.dataset.bas}`
          : `translate3d(${dx}px, 0px, -598px) rotateY(${v}deg) translate3d(${-dx}px, 0px, 598px) ${p.dataset.bas}`;
      }
    };
    if (!pl[0].dataset.bas) {
      for (const p of pl) p.dataset.bas = p.style.transform;
      satt(0, 0);
      void pl[0].offsetWidth;
    }
    // Det tunga i Safari började först när planen började röra sig, så de
    // får en osynlig rörelse direkt (en hundradels bildpunkt), och svängen
    // börjar två bildrutor senare (som kameran, sedan)
    if (cls && WEBKIT && sv && !R.svNu && !calm()) {
      for (const p of pl) p.animate([{ translate: '0px 0px' }, { translate: '0.01px 0px' }], { duration: 120 });
    }
    R.svNu = sv;
    sedan('sving', () => {
      for (const p of pl) p.classList.toggle('glid', Boolean(cls));
      satt(sv, dz);
    }, Boolean(cls));
  }
  function aimVideo(cls) {
    // hörnet i planet -598 (1,035 gånger), och det som syns av scenen;
    // förstoringen högst f.z (rum-video.js), annars sex. Ska bilden fylla
    // fönstret (f.fyll) räknas hela fönstret, med en smal kant så att bildens
    // gräns syns runt om, och annars allt utom raden med tangenterna längst ner
    const f = R.vf;
    const [x0, x1] = [f.x0, f.x1].map((x) => 800 + (x - 800) * 1.035);
    const [y0, y1] = [f.y0, f.y1].map((y) => 500 + (y - 500) * 1.035);
    const [vx0, vx1] = [-R.ox / R.k, (innerWidth - R.ox) / R.k];
    const [vy0, vy1] = f.fyll ? [-R.oy / R.k, (innerHeight - R.oy) / R.k] : [(8 - R.oy) / R.k, (innerHeight - 52 - R.oy) / R.k];
    const m = f.fyll ? 0.96 : 0.98;
    const z = Math.min(f.z || 6, ((vx1 - vx0) * m) / (x1 - x0), ((vy1 - vy0) * m) / (y1 - y0));
    // Hörnet ska ligga framför den vridna väggen ända ut till bildens
    // vänstra kant, inte bara lådans: på vägen till rutan fyller rummet runt
    // tv:n (rumYtor i rum-video.js) hela bilden, och Chrome lät väggen skära
    // av lådan och halva tv:n när den bara räknades fram till lådan. Vid rutan
    // gäller kanten där kameran kom ifrån (vkant), så att hörnet inte går
    // bakåt på vägen.
    const kant = 800 + ((x0 + x1) / 2 - (vx1 - vx0) / (2 * z) - 800) / 1.035;
    if (!f.fyll || R.vkant == null) R.vkant = kant;
    sving(f, f.sv, cls, Math.min(f.kant, R.vkant));
    aim([(x0 + x1) / 2, (y0 + y1) / 2], z, [(vx0 + vx1) / 2, (vy0 + vy1) / 2], cls);
    lattVideo(f.fyll ? 2 : 1);
  }

  // Nära videon med WebKit (i iPhone slut på minne annars): över 1 GB frigör
  // WebKit minne var trettionde sekund och ritar då om allt som syns, med
  // toppar på ungefär en halv GB, och iPhone dödar sidan runt 1,4–1,5 GB. Så
  // när kameran har stannat tas det bort som ändå inte syns (bort), allt utom
  // väggen och hörnet, och 3D-delarna, gatan och neonen står still (frame).
  // Finns en spelare släpps också det WebKit håller ritat bakom kameran (kvar,
  // utanKvar; hörnet håller sitt eget, haller i rum-video.js) – kameran börjar
  // då gå hem lite senare, när det är ritat (sedan i aim). När rutan fyller
  // fönstret (2) tonar också väggen bort, medan kameran går dit, och kommer
  // tillbaka när den har gått tillbaka.
  function lattVideo(niva) {
    if (!LATT && !WEBKIT) return;
    clearTimeout(R.lattT);
    clearTimeout(R.tonaT);
    const pl = [...R.el.querySelectorAll('.rum-world > .rum-pl')];
    const vagg = pl[0];
    R.vniva = niva;
    if (!niva) {
      for (const p of pl) p.classList.remove('bort', 'tona');
      R.vlatt = 0;
      R.utanKvar = false;
      return;
    }
    if (niva === 2) {
      vagg.classList.add('tona');
      R.tonaT = setTimeout(() => vagg.classList.add('bort'), 450);
    }
    const framme = () => {
      if (performance.now() - R.aimT < 700) {
        R.lattT = setTimeout(framme, 200);
        return;
      }
      R.vlatt = niva;
      const allt = niva === 2 || R.video.spelare();
      for (const p of pl) if (p !== vagg && !p.querySelector('#rum-vhs')) p.classList.add('bort');
      if (allt) {
        R.utanKvar = true;
        if (R.kvar) {
          R.kvar.cancel();
          R.kvar = null;
        }
        R.kvarN = (R.kvarN || 0) + 1;
      } else {
        R.utanKvar = false;
        kvar(true);
      }
      if (niva === 1 && vagg.classList.contains('tona')) {
        vagg.classList.remove('bort');
        void vagg.offsetWidth;
        vagg.classList.remove('tona');
      }
    };
    R.lattT = setTimeout(framme, 700);
  }

  // A: anslagstavlan lossnar från väggen och flyger fram (rum-anslag.js),
  // och kameran går lite mot hörnet medan den flyger. Tillbaka flyger den
  // till hörnen där den hänger när kameran har gått tillbaka – de mäts med
  // kameran där en kort stund, innan den glider dit.
  function board(on) {
    if (!R.ans || on === R.ans.on()) return;
    if (on) lager('tavlan', () => board(false));
    else lagerUt('tavlan');
    if (on) {
      if (R.zoom) zoomTv(false);
      if (R.vnara) zoomVideo(false);
      if (R.reg && R.reg.on()) register(false);
      R.ans.open(true, R.ans.quad());
      hogenBort(true);
      vrid(R.tx, R.ty);
      const p = centerOf(document.getElementById('rum-ans'));
      const c = mid();
      aim(p, 1.25, [p[0] + (c[0] - p[0]) * 0.5, p[1] + (c[1] - p[1]) * 0.5], calm() ? null : 'glid');
      return;
    }
    hogenBort(false);
    const w = document.getElementById('rum-kamera');
    const cam = w.style.cssText;
    // (med världen vriden dit den vrids, vridHem)
    const fran = synlig();
    const hem = hemVrid();
    aim([800, 500], 1, [800, 500]);
    if (hem) setCam(...hem);
    const q = R.ans.quad();
    w.style.cssText = cam;
    void w.offsetWidth;
    if (hem) vridHem(fran);
    aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
    R.ans.open(false, q);
  }

  // R: kameran svänger fram till datorn på disken och ställer sig framför
  // skärmen (rum-register.js, datorn i rum-dator.js), och rummet går lite mot
  // disken under tiden. Tillbaka svänger den till datorns plats med rummet
  // där det står när det har gått tillbaka, som anslagstavlan.
  function register(on) {
    if (!R.reg || !R.reg.ready() || on === R.reg.on()) return;
    if (on) lager('registret', () => register(false));
    else lagerUt('registret');
    if (on) {
      if (R.zoom) zoomTv(false);
      if (R.vnara) zoomVideo(false);
      if (R.ans && R.ans.on()) board(false);
      const r = R.reg.at();
      R.reg.open(true, r);
      hogenBort(true);
      vrid(R.tx, R.ty);
      const p = centerOf(r);
      const c = mid();
      aim(p, 1.25, [p[0] + (c[0] - p[0]) * 0.5, p[1] + (c[1] - p[1]) * 0.5], calm() ? null : 'glid');
      return;
    }
    hogenBort(false);
    const w = document.getElementById('rum-kamera');
    const cam = w.style.cssText;
    const fran = synlig();
    const hem = hemVrid();
    aim([800, 500], 1, [800, 500]);
    if (hem) setCam(...hem);
    const r = R.reg.at();
    w.style.cssText = cam;
    void w.offsetWidth;
    if (hem) vridHem(fran);
    aim([800, 500], 1, [800, 500], calm() ? null : 'glid');
    R.reg.open(false, r);
  }

  // ---------- närbilderna ----------
  //
  // Uret, skårtavlan, oraklet, visitkortet, pokalhyllan, korktavlan, löpsedlarna på
  // skivan (IFK 1982, Nacional 1988, VM 94 och Chelsea 1998), veckans löpsedel och dörren (data-sak) – och kupongen på pulten när den inte går
  // att ta i handen: kameran ställer sig rakt framför och går fram tills
  // saken fyller det mesta av fönstret, och det som är ritat i 3D
  // (rum-inredning.js) ritas om skarpare. Under pokalhyllan står hur många
  // pokaler var och en har. Ingen av
  // dem leder ut ur rummet: Esc eller ett klick går tillbaka.
  //   el saken, mal det kameran siktar på (annars saken), h hur mycket av
  //   höjden den får, duk duken i 3D (eller flera), fot under den, ram(rutan, topp, höjd, med)
  //   zoomen och var sakens mitt står (det som står bredvid den, med: rutan kring det
  //   som ska med i bilden, mätt som saken), pult saken ligger på
  //   pulten (inget tonar bort), tv tv:n står framför den (och tonar bort),
  //   under foten står så här mycket av sakens höjd längre ner (remsan på skivan),
  //   radio radions reglage, bak tillbaka går hit om man kom härifrån
  const SAKER = {
    ur: { el: '.rum-ur', h: 0.78, duk: 'ur' },
    // (skårtavlan är låg: lite mer än halva höjden, ungefär lika nära som de andra)
    skar: { el: '.rum-skar', h: 0.58, duk: 'hogra' },
    ram: { el: '.rum-ram', h: 0.94, duk: 'ram' },
    pokal: { el: '.rum-pokal', h: 0.72, duk: 'hogra', fot: () => pokalFot(), tv: true },
    kork: { el: '.rum-kork', h: 0.86, duk: 'hogra' },
    vm94: { el: '#rum-vm94', h: 0.94, duk: 'skiva' },
    dorr: { el: '#rum-dorrnamn', mal: '#rum-dorrglas', h: 0.92 },
    // (kortet fyller inte hela höjden: det är litet, och uret och ramen kommer med i kanten)
    kort: { el: '#rum-kort', mal: '#rum-kort .vk', h: 0.72, duk: 'ram' },
    kupong: { el: '#rum-kupong', h: 0.94, pult: true },
    ifk: { el: '#rum-ifk', h: 0.86, duk: 'skiva' },
    lopsedel: { el: '#rum-lopsedel', h: 0.86 },
    chelsea: { el: '#rum-chelsea', h: 0.86, duk: 'skiva' },
    // (en hel tidningssida: hög, så att rubriken och fotot blir stora)
    nacional: { el: '#rum-nacional', h: 0.94, duk: 'skiva' },
    // kassettradion (rum-radio.js): gänget står kvar, skalan och reglagen kommer när kameran är framme, och
    // bladet med stationerna på väggen bredvid den kommer med i bilden
    radio: { el: '#rum-radio', h: 0.98, duk: ['skiva', 'radiolapp'], radio: true, med: '.rum-radiolapp', ram: (r, top, h, m) => (window.RumRadio ? RumRadio.ram(r, top, h, m) : null) },
    // bladet (radiolapp i rum-inredning.js): som radion, men bara bladet när raderna blir för små att läsa
    // bredvid radion (i telefonen), och tillbaka till radion om man kom därifrån
    radiolapp: { el: '#rum-radio', h: 0.98, duk: ['skiva', 'radiolapp'], radio: true, bak: 'radio', med: '.rum-radiolapp', ram: (r, top, h, m) => (window.RumRadio ? RumRadio.ram(r, top, h, m, true) : null) },
    // kassettstället bredvid radion (rum-kassetter.js, rum-radio.js): som bladet, när ryggarna blir för små
    // bredvid radion (i telefonen), och tillbaka till radion
    kassetter: { el: '#rum-kassetter', h: 0.9, duk: ['skiva'], radio: true, bak: 'radio' },
  };
  // Pokalerna per person (fill), flest först, i var och ens färg.
  function pokalFot() {
    const n = R.pokaler || {};
    const vem = Object.keys(GANG).filter((id) => n[id]).sort((x, y) => n[y] - n[x]);
    return vem.length ? `<span class="pokaler">${vem.map((id) => `<span><b style="color:${GANG[id]}">${id}</b> ${n[id]}</span>`).join('')}</span>` : '';
  }
  // Tv:n hänger snett ovanför pokalhyllan, och dess underkant skulle skära in
  // överst i närbilden: medan kameran står vid hyllan tonar tv:n bort, del för del – opacitet på lådan själv skulle platta
  // till den i 3D medan den tonar.
  function tvBort(bort, glid) {
    if (!bort && !R.tvBort) return;
    const delar = R.el.querySelectorAll('#rum-tvsken, .tv-fot > *, .rum-tv3 > *');
    for (const a of R.tvBort || []) a.cancel();
    R.tvBort = null;
    const ms = glid && !calm() ? (bort ? 250 : 500) : 0;
    const anims = [...delar].map((d) => d.animate(bort ? [{ opacity: 0 }] : [{ opacity: 0, offset: 0 }], { duration: ms, fill: bort ? 'forwards' : 'none' }));
    if (bort) R.tvBort = anims;
  }
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
    // (radion och bladet bredvid den)
    const radio = (n) => Boolean(n && SAKER[n] && SAKER[n].radio);
    if (radio(was)) {
      radioNara(false);
      // (det fina försvinner när kameran är tillbaka)
      clearTimeout(R.rDetalj);
      if (!radio(namn)) R.rDetalj = setTimeout(() => { if (!radio(R.sak) && R.fig) R.fig.radioDetalj(false); }, cls ? 700 : 0);
    }
    R.el.classList.toggle('radio-nara', radio(namn));
    R.sak = namn || null;
    if (!namn) {
      lagerUt('sak');
      R.el.classList.remove('sak-nara');
      tvBort(false, cls);
      vridHem();
      aim([800, 500], 1, [800, 500], cls);
      return;
    }
    const S = SAKER[namn];
    if (S && S.radio && !radioRuta()) return;
    if (S && S.radio) R.fig.radioDetalj(true);
    const a = S && R.el.querySelector(S.el);
    const mal = S && S.mal ? R.el.querySelector(S.mal) : a;
    // (uret finns först när inredningen är ritad, och då frågar three() igen)
    if (!a || !mal) return;
    const bak = S.bak && was === S.bak ? S.bak : null;
    lager('sak', () => sak(bak));
    if (R.zoom) zoomTv(false);
    if (R.vnara) zoomVideo(false);
    board(false);
    // saken mätt med kameran i vila och rummet rakt
    const w = document.getElementById('rum-kamera');
    const cam = w.style.cssText;
    aim([800, 500], 1, [800, 500]);
    setCam(0, 0);
    const r = mal.getBoundingClientRect();
    const p = centerOf(r);
    const med = S.med && R.el.querySelector(S.med);
    const m = med ? med.getBoundingClientRect() : null;
    setCam(R.mx, R.my);
    w.style.cssText = cam;
    void w.offsetWidth;
    // Rummet vrids rakt medan kameran går fram (.sak-nara i rum.css) och står
    // sedan still: så länge det rör sig ritar webbläsaren det suddigt.
    R.el.classList.add('sak-nara');
    R.tx = R.ty = R.mx = R.my = 0;
    setCam(0, 0);
    // gänget och pulten går kameran förbi (de tonar bort) – inte när saken
    // ligger på pulten
    for (const pl of R.el.querySelectorAll('.rum-world > .rum-pl:not(.rum-pl3d)')) {
      const z = /translateZ\((-?[\d.]+)px\)/.exec(pl.style.transform);
      // (radion står i gängets duk, i fönsterbänkens plan: det planet står kvar)
      pl.classList.toggle('forbi', !S.pult && Boolean(z) && Number(z[1]) > (S.radio ? -300 : -560));
    }
    tvBort(Boolean(S.tv), cls);
    // så stor som ryms mellan namnet och foten, med det som står under
    const html = S.fot ? S.fot(a) : '';
    const top = 64;
    const h = innerHeight - top - (html ? 112 : 64);
    const ram = (S.ram && S.ram(r, top, h, m)) || { zoom: Math.min((innerWidth * 0.9) / r.width, (h * S.h) / r.height), x: innerWidth / 2, y: top + h / 2 };
    const { zoom } = ram;
    fot.innerHTML = html;
    fot.style.top = `${r1(ram.y + r.height * zoom * (0.5 + (S.under || 0)) + 14)}px`;
    if (html) fot.classList.add('on');
    aim(p, zoom, [(ram.x - R.ox) / R.k, (ram.y - R.oy) / R.k], cls);
    // duken i 3D ritas skarpare när kameran är framme
    if (S.duk) R.skarp = setTimeout(() => { if (R.sak === namn && R.inr) R.inr.skarp(S.duk, zoom * R.k * 1.035 * (devicePixelRatio || 1)); }, cls ? 620 : 0);
    if (S.radio) R.rSkarp = setTimeout(() => { if (R.sak === namn) radioNara(true); }, cls ? 640 : 0);
  }

  // Kassettradion står i gängets duk, som är ritad för hela rummet. Rutan runt den (#rum-radio) är det
  // kameran siktar på. Framme ritas bara det som syns av duken, i närbildens skärpa (narbild i rum-3d.js):
  // gänget står kvar och rör sig, och visaren och reglagen blir skarpa. Går kameran tillbaka ritas hela
  // duken igen först.
  function radioRuta() {
    const e = R.el.querySelector('#rum-radio');
    if (!e || !R.fig || !R.fig.radioRuta) return null;
    const q = R.fig.radioRuta();
    const c = R.el.querySelector('#rum-3d');
    Object.assign(e.style, { left: `${r1(c.offsetLeft + q.x)}px`, top: `${r1(R.cTop + q.y)}px`, width: `${r1(q.w)}px`, height: `${r1(q.h)}px` });
    const k = R.el.querySelector('#rum-kassetter');
    if (k && R.fig.kassettRuta) {
      const s = R.fig.kassettRuta();
      Object.assign(k.style, { left: `${r1(c.offsetLeft + s.x)}px`, top: `${r1(R.cTop + s.y)}px`, width: `${r1(s.w)}px`, height: `${r1(s.h)}px` });
    }
    return e;
  }
  function radioNara(pa) {
    clearTimeout(R.rSkarp);
    if (!R.fig || !R.fig.narbild) return;
    if (!pa) {
      if (window.RumRadio) RumRadio.nara(false);
      R.fig.narbild(null);
      return;
    }
    const c = R.el.querySelector('#rum-3d');
    R.fig.narbild(null);
    // Det som syns av duken när kameran har kommit fram, räknat ur dit den går (aim) och inte mätt: medan
    // kameran och rummet fortfarande rörde sig (i Safari börjar kameran några bildrutor sent, och en
    // långsam dator hinner inte fram på 640 ms) mättes en annan del än den som syns sedan, och radion
    // skars av i kanten. Nära radion står rummet rakt (sak), så duken ligger som i scenen: scenen ligger i
    // fönstret förskjuten R.ox, R.oy och R.k gånger så stor (pan), och kameran förstorar z gånger kring
    // scenens mitt och flyttar dx, dy.
    const { dx, dy, z } = R.kamMal;
    const W = c.offsetWidth;
    const H = c.offsetHeight;
    const k = R.k * z;
    const ix = (x) => 800 + ((x - R.ox) / R.k - 800 - dx) / z - c.offsetLeft;
    const iy = (y) => 500 + ((y - R.oy) / R.k - 500 - dy) / z - R.cTop;
    const x0 = Math.max(0, ix(-8));
    const y0 = Math.max(0, iy(-8));
    const x1 = Math.min(W, ix(innerWidth + 8));
    const y1 = Math.min(H, iy(innerHeight + 8));
    R.fig.narbild({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, pr: k * Math.min(devicePixelRatio || 1, 2), bred: W * k * Math.min(devicePixelRatio || 1, 2) });
    if (window.RumRadio) RumRadio.nara(true);
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
    const [w, h0] = R.smal ? KUP.smal : KUP.bred;
    // (gängets kupong i handen kan vara högre än den på pulten, mattHand)
    const h = (R.kup && R.kup.hojd) || h0;
    const sida = R.lag ? 190 : 0;
    const top = R.lag ? 14 : R.smal ? 58 : 84;
    const foot = R.lag ? 14 : R.smal ? 96 : 78;
    const bredd = R.lag ? innerWidth - sida - 48 : innerWidth * (R.smal ? 0.94 : 0.8);
    const z = Math.min(2.2, (innerHeight - top - foot) / (h * k), bredd / (w * k));
    const cx = (innerWidth - sida) / 2;
    const cy = top + (innerHeight - top - foot) / 2;
    return {
      dx: (cx - (R.ox || 0)) / k - kupX(), dy: (cy - (R.oy || 0)) / k - kupY(), z,
      box: { left: cx - (w / 2) * z * k, top: cy - (h / 2) * z * k, width: w * z * k, height: h * z * k },
    };
  }

  // Vägen från pulten till handen: kupongen lossnar och lyfter, vänds upp
  // mot betraktaren, svänger en aning förbi och stannar.
  function handFrames(h) {
    return [
      { offset: 0, transform: T(0, 0, 0, 44, -2, kupLigg()), boxShadow: glow(1, '0 26px 34px rgba(0, 0, 0, 0.55)'), easing: 'cubic-bezier(0.3, 0, 0.5, 1)' },
      { offset: 0.24, transform: T(-10, -80, 70, 38, -5.5, 1.03 * kupLigg()), boxShadow: glow(0.4, '0 70px 60px rgba(0, 0, 0, 0.45)'), easing: 'cubic-bezier(0.25, 0.55, 0.3, 1)' },
      { offset: 0.84, transform: T(h.dx, h.dy + 4, 0, -4, 1, h.z * 1.006), boxShadow: glow(0, '0 40px 90px rgba(0, 0, 0, 0.6)'), easing: 'ease-in-out' },
      { offset: 1, transform: T(h.dx, h.dy, 0, 0, 0, h.z), boxShadow: glow(0, '0 34px 80px rgba(0, 0, 0, 0.6)') },
    ];
  }

  // Kupongen i handen utan rörelser.
  function inHand(el, h) {
    const { transform, boxShadow } = handFrames(h)[3];
    Object.assign(el.style, { transform, boxShadow });
  }

  // Mellan högen och handen: kupongen lyfts, vänds över långsidan (mot
  // mitten, högen ligger till höger) och förstoras till mitten. → två delar, upp till kanten och därifrån till
  // handen; innehållet byts när den står på kant (turn).
  function flipFrames(sl, h) {
    const f = 0.4;
    const mid = (ry) => T(sl.dx + (h.dx - sl.dx) * f, sl.dy + (h.dy - sl.dy) * f - 70, 60, 22, sl.a / 2, HOG.s + (h.z - HOG.s) * f, ry);
    const lyft = glow(0, '0 60px 60px rgba(0, 0, 0, 0.4)');
    return [
      [{ transform: restAt(sl), boxShadow: glow(0, HOG.skugga), easing: 'cubic-bezier(0.4, 0, 0.7, 1)' }, { transform: mid(-90), boxShadow: lyft }],
      [
        { offset: 0, transform: mid(90), boxShadow: lyft, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)' },
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
  // ---------- det som rör sig av sig självt medan kupongen ligger i handen ----------

  // Gängets kupong är så hög som siffrorna och kommentarerna kräver, med samma
  // mitt (853) som kupongen på pulten, och pennan vilar i foten där den då är.
  function mattHand(k) {
    if (k.slag !== 'gang') return;
    const [h0, vila] = R.smal ? [KUP.smal[1], PENNOR.smal[1]] : [KUP.bred[1], PENNOR.bred[1]];
    k.el.classList.add('hog');
    k.el.classList.remove('tat');
    k.hojd = Math.max(h0, k.el.offsetHeight);
    // så mycket text att allt blir för litet: varje kommentar på en rad, hela när man pekar
    if (held().z < 0.7) {
      k.el.classList.add('tat');
      k.hojd = Math.max(h0, k.el.offsetHeight);
    }
    k.el.style.top = `${853 - k.hojd / 2}px`;
    // (pennan som vilar följer med foten när kupongen blir högre)
    const vilar = !k.opening && k.pen && k.at && k.at.x === PEN_VILA.x && k.at.y === PEN_VILA.y;
    PEN_VILA.y = vila.y + k.hojd - h0;
    if (vilar) {
      k.at = PEN_VILA;
      Object.assign(k.pen.style, penAt(PEN_VILA));
    }
  }

  // Kupongen i handen står kvar mitt i fönstret och så stor som får plats.
  function flyttaHand(k) {
    if (k.closing || k.opening) return;
    mattHand(k);
    const h = held();
    placeRow(h);
    // (från pulten, eller ur kupongstället med sin egen väg)
    if (k.anim && !k.slot) k.anim.effect.setKeyframes(k.frames ? k.frames(h) : handFrames(h));
    else {
      inHand(k.el, h);
      if (k.anim) k.anim.effect.setKeyframes(flipFrames(k.slot, h)[1]);
    }
  }

  // Minuten, ställningen och ringarna, de andras kommentarer och Svenska Spels
  // siffror byts rad för rad medan kupongen ligger i handen. Kupongen skrivs inte
  // om – kryssen, pennan och det du skriver står kvar – så man behöver inte lägga
  // tillbaka den för att se hur det går.
  function levande() {
    const k = R.kup;
    // (kupongen ur kupongstället är nästa omgång: inget har startat, openStall)
    if (!k || k.closing || !k.rd) return;
    const rows = roundRows(k.rd);
    const p = k.slag === 'gang' ? pult() : null;
    const v = p ? view(p, 'gang') : null;
    const harTal = Boolean(v && v.spel && Object.keys(v.spel.rader).length);
    const f = harTal ? Folket.vald(v.spel) : 0;
    let hojd = false;
    for (const row of k.el.children) {
      const lv = row.classList.contains('row') && row.querySelector('.lv');
      if (!lv) continue;
      const id = row.dataset.id;
      const x = rows.find((r) => r.id === id);
      if (!x) continue;
      const boxes = [...row.querySelectorAll('.box')];
      const sign = SIGNS.filter((s, j) => boxes[j] && boxes[j].classList.contains('x')).join('');
      const html = liveRad(x.g, sign);
      const res = x.g.res != null ? x.g.res : null;
      const sig = `${html}|${res}|${sign}`;
      if (row.dataset.lv !== sig) {
        const fore = lv.querySelector('.res');
        const nu = fore && fore.textContent;
        lv.innerHTML = html;
        row.classList.toggle('startad', Boolean(html));
        for (const b of boxes) {
          const g = b.querySelector(':scope > .rum-ring');
          if (g) g.remove();
        }
        if (res != null) boxes[res].querySelector('i').insertAdjacentHTML('afterend', Papper.ring(`${id}${SIGNS[res]}`, `rum-ring${ringKlass(x.g, sign, res)}`, 25));
        const efter = lv.querySelector('.res');
        if (nu && efter && efter.textContent !== nu && !calm()) {
          row.classList.remove('mal');
          void row.offsetWidth;
          row.classList.add('mal');
        }
        row.dataset.lv = sig;
      }
      if (!v) continue;
      const kom = row.nextElementSibling;
      if (kom && kom.classList.contains('kom')) {
        const text = komHtml(v, id);
        if (kom.skrivet === undefined) kom.skrivet = text;
        if (kom.skrivet !== text) {
          kom.skrivet = text;
          kom.innerHTML = text;
          hojd = true;
        }
      }
      if (v.spel) {
        const rad = v.spel.rader[id];
        for (const t of row.querySelectorAll('.tal')) {
          const text = rad ? Folket.tal(rad, Number(t.dataset.j), f) : '';
          if (t.textContent !== text) t.textContent = text;
        }
        if (row.classList.contains('talrad') !== harTal) {
          row.classList.toggle('talrad', harTal);
          hojd = true;
        }
      }
    }
    if (v && v.spel) {
      const hd = k.el.querySelector(':scope > .hd');
      const fl = hd && hd.querySelector('.flikar');
      if (hd) hd.classList.toggle('medflik', harTal);
      if (fl) {
        const text = Folket.flikar(v.spel);
        if (fl.skrivet !== text) {
          fl.skrivet = text;
          fl.innerHTML = text;
        }
      }
    }
    if (hojd) flyttaHand(k);
  }

  function openCoupon(from = null) {
    if (R.kup) return true;
    // (omgången är spelad: på pulten ligger bara protokollet)
    if (!from && R.summa) {
      protokollet();
      return true;
    }
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
    // din inlämnade: med det Hasse har ändrat och inte lämnat in än
    const inlamnat = { ...v.tecken };
    if (slag === 'din' && p.andra) v.tecken = { ...v.tecken, ...hassesAndring(p) };
    // (gängets kupong läggs tillbaka med framsidan upp)
    if (slag === 'gang') {
      pling();
      sparaVand(p);
    }
    zoomTv(false);
    zoomVideo(false);
    const desk = document.getElementById('rum-kupong');
    const rd = { id: p.s.id, ids: p.s.matcher.map((x) => String(x.id)), gang: p.s.gang, name: (window.Samtal && Samtal.name()) || null };
    const nr = typeof couponNumber === 'function' ? couponNumber(rd.ids) : null;
    const rows = roundRows(rd);
    const fram = couponHtml(rd, rows, v, true);
    const vems = slag === 'las' ? `${v.vem}:s kupong` : slag === 'gang' ? 'Gängets kupong' : nr ? `Kupong ${nr}` : 'Kupong';
    desk.parentElement.insertAdjacentHTML('beforeend', '<div class="rum-dimma" id="rum-dimma"></div>' +
      `<div class="rum-flat ${from ? 'rum-bak' : 'rum-kup'} rum-handen" id="rum-handen" role="dialog" aria-modal="true" aria-label="${esc(vems)}" tabindex="-1">` +
      `${from ? from.innerHTML : fram}</div>`);
    R.el.insertAdjacentHTML('beforeend', `<div class="rum-hand" id="rum-hand">${handRow(p, v)}</div>`);
    const el = document.getElementById('rum-handen');
    const k = R.kup = { el, dim: document.getElementById('rum-dimma'), rad: document.getElementById('rum-hand'), pen: el.querySelector('.pencil'), at: PEN_PULT, desk, rd,
      slag, andra: slag === 'din' && p.andra, orig: inlamnat, tecken: { ...v.tecken }, origNot: { ...(v.not || {}) }, not: { ...(v.not || {}) },
      efter: { ...(v.efter || {}) }, fram,
      // matcherna i kupongens ordning, till matchbladet (lagen)
      matcher: rd.ids.map((id) => rows.find((x) => x.id === id)).filter(Boolean).map((x) => x.m), kupong: nr ? `Kupong ${nr}` : 'Kupong' };
    lager('kupong', () => closeCoupon());
    mattHand(k);
    k.msg = k.rad.querySelector('.msg');
    // gängets kupong: guldordet och, när den är sparad, Spela hos Svenska Spel
    // bredvid (gangState ritar om dem tillsammans)
    k.go = k.rad.querySelector(slag === 'gang' ? '[data-gang]' : '.guld');
    if (slag === 'gang') k.gw = k.rad.querySelector('.hoger');
    if (k.andra) dirty();
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
      if (slag === 'gang') uppgorelse(k, rd.id);
    }
    el.focus({ preventScroll: true });
    el.addEventListener('click', (e) => {
      if (k.closing) return;
      // matchbladet sköter sig självt (rum-matchblad.js), och lagen i en rad lägger det på kupongen
      // (klickets väg, inte var målet sitter nu: Visa ändå ritar om sidan under klicket)
      if (e.composedPath().some((n) => n instanceof Element && n.matches('.rum-blad'))) return;
      const t = e.target.closest('button[data-lagen]');
      if (t) {
        lagen(t.closest('.row').dataset.id);
        return;
      }
      // Folket, Odds och Favoritskap på gängets kupong
      const fl = e.target.closest('[data-spelflik]');
      if (fl) {
        Folket.valjFlik(Number(fl.dataset.spelflik));
        levande();
        return;
      }
      // efter ett långt tryck på en ruta kryssas den inte, och ett tryck på
      // lappen tar bort den (wireHold)
      if (k.holl || e.target.closest('.rum-ord')) {
        if (!k.holl) ordUt(k);
        k.holl = false;
        return;
      }
      const b = e.target.closest('button.box, button[data-vem]');
      // en omtvistad match som inte är klubbad: ett klick på raden – numret,
      // tiden eller förklaringen – klubbar den
      const row = !b && k.slag === 'gang' && !e.target.closest('input, label') && e.target.closest('.row.strid:not(.klubbad)');
      if (row && !row.querySelector('.pen:not(.gom) input.pen-in')) klubba(row, true);
      // tiden och det som står efter den: man skriver på raden (writeOn)
      else if (!b) writeOn(e.target);
      else if (b.dataset.vem) choose(b);
      else if (k.slag === 'gang') tickGang(b);
      else tick(b);
    });
    wireNotes(k);
    if (slag === 'gang') wireHold(k, v);
    k.rad.addEventListener('click', (e) => {
      // Spela hos Svenska Spel: länken öppnas, och kupongen lämnas över disken
      if (e.target.closest('a[data-spela]')) {
        if (!k.closing) lamnaOver(k);
        return;
      }
      const b = e.target.closest('button');
      if (!b || b.disabled || k.closing) return;
      // det man gör med kupongen syns på kupongen: matchbladet tas bort först
      if (b.dataset.tillbaka == null) lagenUt(true);
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

  // ---------- kupongstället: nästa omgång ----------
  //
  // Ett klick på kupongstället på disken (eller N) tar en blank kupong för
  // nästa omgång i handen: Stryktipset som Svenska Spel har öppet för spel
  // (Folket i folket.js, samma som Hämta Stryktipset), med sajtens matcher i
  // Stryktipsets ordning – samma kupong och samma mått som kupongen på pulten.
  // Den är bara att titta på: inga rutor att kryssa, ingen penna och inget
  // matchblad. Den lyfts ur stället, vänds upp mot betraktaren och stannar i
  // handen, och Lägg tillbaka, Esc, N, K eller ett klick utanför sätter tillbaka
  // den samma väg (closeCoupon). Är ingen omgång öppen är kupongen blank, med
  // tretton tomma rader. Omgången hämtas när rummet läser in sina data (load)
  // och när kupongen tas, högst var femte minut.
  const ST = { got: null, at: 0, p: null };
  function stallHamta() {
    if (!window.Folket || ST.p || (ST.at && Date.now() - ST.at < 5 * 60000)) return ST.p;
    ST.p = Folket.open().catch(() => null).then((got) => {
      ST.got = got;
      ST.at = Date.now();
      ST.p = null;
      return got;
    });
    return ST.p;
  }

  // Kupongen ur stället: omgångens matcher – sajtens match där den finns,
  // annars lagen och avsparken från Svenska Spel – eller tretton tomma rader.
  // Streckkoden är omgångens på pulten när det är samma Stryktips, annars
  // Stryktipsets nummer.
  function stallHtml() {
    const got = ST.got;
    const o = got && got.omgang;
    let rd = { ids: [], gang: [], name: null, tomma: 13 };
    let rows = [];
    if (o && o.lage === 'Open' && got.rows.length) {
      rows = got.rows.map((r) => {
        const m = r.m || { id: `stryktipset-${o.nr}-${r.nr}`, home: r.hemma || '', away: r.borta || '', kickoff: r.avspark, comp: null };
        return { id: String(m.id), m, g: { res: null }, sign: '' };
      });
      const p = pult();
      const samma = p && p.s.spel && p.s.spel.nr === o.nr;
      rd = { id: samma ? p.s.id : `stryktipset-${o.nr}`, ids: rows.map((x) => x.id), gang: [], name: null, spel: true };
    }
    // (utan pennan: det finns inget att skriva)
    return couponHtml(rd, rows).replace(/<span class="pencil[^>]*><i><\/i><\/span>$/, '');
  }

  // Vägen från stället till handen: kupongen är liten där den står, lutad bakåt
  // och vriden som stället, lyfts upp ur det och kommer fram till mitten, där
  // den svänger en aning förbi och stannar. a: var den står (stallFran).
  function stallFrames(a, h) {
    const f = (t) => [a.dx + (h.dx - a.dx) * t, a.dy + (h.dy - a.dy) * t];
    return [
      { offset: 0, opacity: 0, transform: T(a.dx, a.dy, 0, -10, 0, a.s, 34), boxShadow: glow(0, '0 6px 10px rgba(0, 0, 0, 0.45)'), easing: 'cubic-bezier(0.3, 0, 0.5, 1)' },
      { offset: 0.1, opacity: 1 },
      { offset: 0.28, transform: T(...f(0.12).map((x, i) => (i ? x - 60 : x)), 60, -18, -4, a.s + (h.z - a.s) * 0.22, 16), boxShadow: glow(0, '0 60px 60px rgba(0, 0, 0, 0.4)'), easing: 'cubic-bezier(0.25, 0.55, 0.3, 1)' },
      { offset: 0.84, transform: T(h.dx, h.dy + 4, 0, -4, 1, h.z * 1.006), boxShadow: glow(0, '0 40px 90px rgba(0, 0, 0, 0.6)'), easing: 'ease-in-out' },
      { offset: 1, transform: T(h.dx, h.dy, 0, 0, 0, h.z), boxShadow: glow(0, '0 34px 80px rgba(0, 0, 0, 0.6)') },
    ];
  }
  // Var kupongerna i stället syns, i kupongens transform (T, från pulten): mitten
  // av kupongerna i länken (under skylten) i scenens mått, och lika stor.
  function stallFran(lank) {
    const r = lank.getBoundingClientRect();
    const k = R.k || 1;
    const [w, h] = R.smal ? KUP.smal : KUP.bred;
    return {
      dx: (r.left + r.width * 0.42 - (R.ox || 0)) / k - kupX(),
      dy: (r.top + r.height * 0.66 - (R.oy || 0)) / k - 853,
      s: (r.height * 0.45) / (Math.max(w, h) * k),
    };
  }

  function openStall() {
    const lank = document.getElementById('rum-stall');
    const desk = document.getElementById('rum-kupong');
    if (R.kup || !R.el || !lank || !desk) return;
    if (R.sak) sak(null, null);
    zoomTv(false);
    zoomVideo(false);
    const fram = stallHtml();
    desk.parentElement.insertAdjacentHTML('beforeend', '<div class="rum-dimma" id="rum-dimma"></div>' +
      `<div class="rum-flat rum-kup rum-handen" id="rum-handen" role="dialog" aria-modal="true" aria-label="Nästa omgång" tabindex="-1">${fram}</div>`);
    R.el.insertAdjacentHTML('beforeend', '<div class="rum-hand" id="rum-hand"><span class="vanster"><button type="button" class="bla" data-tillbaka>Lägg tillbaka</button></span>' +
      '<p class="msg" role="status"></p><span class="hoger"></span></div>');
    const el = document.getElementById('rum-handen');
    const a = stallFran(lank);
    const k = R.kup = { el, dim: document.getElementById('rum-dimma'), rad: document.getElementById('rum-hand'), pen: null, desk, slag: 'stall', fram,
      tecken: {}, not: {}, efter: {}, matcher: [], frames: (h) => stallFrames(a, h) };
    lager('kupong', () => closeCoupon());
    R.el.classList.add('i-handen');
    R.tx = 0;
    R.ty = 0;
    const h = held();
    placeRow(h);
    if (calm()) {
      setCam(0, 0);
      inHand(el, h);
    } else {
      k.anim = el.animate(k.frames(h), { duration: 950, fill: 'both' });
      k.fade = k.dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: 'ease', fill: 'both' });
      k.show = k.rad.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 780, easing: 'ease-out', fill: 'both' });
    }
    el.focus({ preventScroll: true });
    k.rad.addEventListener('click', (e) => {
      if (e.target.closest('[data-tillbaka]') && !k.closing) closeCoupon();
    });
    // omgången kom (eller ändrades) efter att kupongen togs
    const p = stallHamta();
    if (p) {
      p.then(() => {
        if (R.kup !== k || k.closing) return;
        const ny = stallHtml();
        if (ny !== k.fram) el.innerHTML = k.fram = ny;
      });
    }
  }

  // Orden under kupongen, som raden längst ner på papperet: till vänster
  // Lägg tillbaka och det mer sällsynta i finstil (Ändra matcherna, Ta bort,
  // Börja om), till höger det du gör med kupongen, guldordet längst ut.
  //   fyll  Spara (Sparad när utkastet är sparat som det står) och Lämna in
  //   din   Ångra och Lämna in ändringen, släckta tills något är ändrat
  //   gang  Spara gängets kupong (Spara ändringen, Sparad) medan någon match
  //         går att fylla i (till en stund efter avspark, fillable)
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
  // Gängets kupong: guldordet (Spara gängets kupong, Spara ändringen), och när
  // den är sparad som den står Sparad – med Spela hos Svenska Spel som guldord
  // bredvid när omgången är Stryktipset och går att spela (g.spela, spela.js).
  const gangHtml = (g) => (g.same && g.spela
    ? `<button type="button" class="bla sparad" data-gang disabled>${CHECK}Sparad</button>` +
      `<a class="guld" data-spela href="${esc(g.spela)}" target="_blank" rel="noopener">Spela hos Svenska Spel</a>`
    : `<button type="button" class="guld${g.same ? ' sparad' : ''}" data-gang${g.same ? ' disabled' : ''}>${g.same ? `${CHECK}Sparad` : esc(g.label)}</button>`);

  // ---------- lagen: matchbladet ovanpå kupongen i handen (rum-matchblad.js) ----------
  //
  // Ett klick på lagen i en rad lägger matchbladet på kupongen, på samma papper
  // och i samma mått, så att det står där kupongen står. Det glider upp över
  // kupongen och lägger sig lite snett; flikarna är bladets sidor, och krysset,
  // Esc eller ett klick utanför tar bort det igen. Samma blad som Matchbladet hos
  // Hasse Backe.
  function lagen(id) {
    const k = R.kup;
    if (!k || k.closing || !window.RumMatchblad) return;
    if (k.lapp) return;
    k.lapp = RumMatchblad.oppna({ host: k.el, matcher: k.matcher, id, kupong: k.kupong, tillbaka: 'kupongen', ut: (nu) => lagenUt(nu), calm });
  }
  function lagenUt(now = false) {
    const k = R.kup;
    const b = k && k.lapp;
    if (!b) return;
    k.lapp = null;
    const id = b.id;
    b.ut(now);
    const t = k.el.querySelector(`.row[data-id="${CSS.escape(id)}"] button[data-lagen]`);
    if (t && !now) t.focus({ preventScroll: true });
    else if (!now) k.el.focus({ preventScroll: true });
  }

  function closeCoupon(now = false) {
    const k = R.kup;
    if (!k || k.closing) return;
    lagenUt(true);
    // på väg upp ur högen: läggs tillbaka när den är framme
    if (k.opening && !now) {
      k.later = true;
      return;
    }
    lagerUt('kupong');
    // en kommentar i efterhand som du skriver sparas när fältet lämnas
    const f = k.el.querySelector('input.pen-in:focus');
    if (f) f.blur();
    k.closing = true;
    clearTimeout(k.idle);
    R.el.classList.remove('i-handen');
    const done = () => {
      if (R.kup !== k) return;
      R.kup = null;
      Object.assign(PEN_VILA, PENNOR[R.smal ? 'smal' : 'bred'][1]);
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
    // (kupongen ur kupongstället har ingen penna)
    if (k.pen) penGo([{ ...PEN_VILA, l: 0.4, t: 240, e: 'ease-out' }, { ...PEN_PULT, l: 0.15, t: 380, e: 'cubic-bezier(0.4, 0, 0.6, 1)' }, { ...PEN_PULT, t: 200, e: 'ease-in' }]);
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
  function penGo(path, k = R.kup) {
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
  function spot(el, kup = R.kup.el) {
    let x = 0;
    let y = 0;
    for (let e = el; e && e !== kup; e = e.offsetParent) {
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

  // Namnet skrivs för hand: pennan (k = kupongen i handen eller på pulten) går
  // dit och längs namnet upp och ner, medan namnet kommer fram från vänster.
  // → hur länge det tar i millisekunder, och pennan står kvar vid slutet.
  function skrivNamn(el, k) {
    const o = spot(el, k.el);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const y = o.y + h * 0.72;
    const at = (x, dy, l, t, e) => ({ x: o.x + x, y: y + dy, a: PEN_SKRIV, l, t, e });
    const travel = Math.round(Math.min(380, Math.max(180, Math.hypot(o.x - k.at.x, y - k.at.y) * 0.9)));
    // en båge per ungefär en bokstav
    const n = Math.max(4, el.textContent.length);
    const step = Math.round(Math.max(55, 620 / n));
    const bagar = Array.from({ length: n }, (_, i) => at(((i + 1) / n) * w, i % 2 ? h * 0.1 : -h * 0.42, 0, step, 'ease-in-out'));
    const mal = step * n;
    penGo([at(0, 0, 0.7, travel, 'cubic-bezier(0.4, 0, 0.2, 1)'), at(0, 0, 0, 50, 'ease-in'), ...bagar, at(w + 12, 8, 0.8, 200, 'ease-out')], k);
    el.animate([{ clipPath: 'inset(-14px 100% -14px -14px)' }, { clipPath: 'inset(-14px -14px -14px -14px)' }], { duration: mal, delay: travel + 50, easing: 'linear', fill: 'backwards' });
    return travel + 50 + mal + 200;
  }

  // Någon i gänget klickades fram (rum-folk.js): kupongen på pulten ritas om och
  // namnet skrivs på den, och pennan lägger sig där den låg. → hur länge
  // namnet skrivs i millisekunder (0 när det inte syns skrivas)
  function skrivPult() {
    if (!R.on) return 0;
    fill();
    const desk = document.getElementById('rum-kupong');
    const el = desk && desk.querySelector('.sm-namn.du');
    const pen = desk && desk.querySelector('.pencil');
    if (!el || !pen || calm() || !pult() || !pult().fyll) return 0;
    const k = { pen, el: desk, at: PEN_PULT };
    const t = skrivNamn(el, k);
    clearTimeout(R.pultPen);
    R.pultPen = setTimeout(() => {
      if (!pen.isConnected) return;
      penGo([{ ...PEN_PULT, l: 0.4, t: 420, e: 'cubic-bezier(0.4, 0, 0.3, 1)' }, { ...PEN_PULT, t: 140, e: 'ease-in' }], k).finished.then((a) => {
        Object.assign(pen.style, penAt(PEN_PULT));
        a.cancel();
      }, () => {});
    }, t + 260);
    return t;
  }

  // Ett klick på dig själv i gänget (rum-folk.js): kupongen tas i handen att
  // fylla i eller ändra – om rummet står som när du klickade (inget nära,
  // inte hos Hasse). → om den togs.
  function taKupong() {
    const p = pult();
    if (!R.on || nara() || R.vilar || !p || !p.hand) return false;
    return openCoupon();
  }

  // Ett kryss eller en ring som tas bort suddas ut.
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
    // (kryssar du om det är det ditt, inte Hasse Backes)
    if (k.slag !== 'gang' && pult()) hasseSkrev(pult().s.id, `${row.dataset.id}${b.dataset.s}`, false);
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
  // kulspetspennan, och tecknen sparas och delas med de andra som på papperet
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
    levande();
    // en omtvistad match är klubbad när gängets tecken ändras – den som nu
    // blir utan förklarar – och pennan går sedan vidare till nästa
    if (row.classList.contains('strid')) {
      const g = Samtal.pult.gang();
      const sk = row.querySelector('.skal');
      if (g && sk) sk.innerHTML = skal(g, row.dataset.id, g.val);
      klubba(row);
    }
    clearTimeout(k.idle);
    k.idle = setTimeout(() => vanta(k, row), 1800);
  }

  // ---------- uppgörelsen med pennan ----------
  //
  // Första gången gängets kupong tas i handen på enheten under omgången läggs
  // de tre kupongerna ur högen på den, en i taget, genomskinliga, och var och
  // ens kryss stannar kvar i rutorna; sedan dras gängets kryss med
  // kulspetspennan, och pennan ringar in numren på de omtvistade matcherna.
  // Därefter står allt där direkt. Sedan väntar pennan vid den första
  // omtvistade matchen som inte är klubbad, och efter ett beslut vid nästa.
  const LAGDA = 'profeterna.rum.lagda';
  // var kupongerna kommer ifrån (högen ligger till höger om kupongen) och hur de är vridna
  const FAN = [[170, 80, 6], [205, 34, -5], [140, 120, 2]];
  function uppgorelse(k, id) {
    let forst = false;
    try {
      forst = localStorage.getItem(LAGDA) !== id;
      if (forst) localStorage.setItem(LAGDA, id);
    } catch (e) { forst = false; }
    if (!forst) {
      k.idle = setTimeout(() => vanta(k), 1000);
      return;
    }
    const gang = (KP.data && KP.data.samtal && KP.data.samtal.gang) || [];
    let t = 650;
    gang.forEach((g, i) => {
      const marks = [...k.el.querySelectorAll(`.sits b.sm-k${i}`)];
      if (!marks.length) return;
      const [dx, dy, a] = FAN[i % FAN.length];
      const fly = { duration: 820, delay: t, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' };
      const sheet = document.createElement('span');
      sheet.className = `rum-genom sm-k${i}`;
      k.el.appendChild(sheet);
      sheet.animate([
        { transform: `translate(${dx}px, ${dy}px) rotate(${a}deg)`, opacity: 0 },
        { offset: 0.2, opacity: 0.72 },
        { offset: 0.72, transform: 'none', opacity: 0.6 },
        { transform: 'none', opacity: 0 },
      ], { ...fly, fill: 'both' }).finished.then(() => sheet.remove(), () => sheet.remove());
      for (const m of marks) {
        m.animate([
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
          { offset: 0.2, opacity: 1 },
          { offset: 0.72, transform: 'none' },
          { transform: 'none' },
        ], { ...fly, fill: 'backwards' });
      }
      t += 230;
    });
    // gängets kryss, ett i taget, när kupongerna ligger där
    t += 700;
    [...k.el.querySelectorAll('.box .kryss.kula')].forEach((svg, n) => {
      [...svg.querySelectorAll('path')].forEach((path, j) => path.animate([{ strokeDashoffset: 1.05 }, { strokeDashoffset: 0 }],
        { duration: 110, delay: t + n * 32 + j * 60, easing: 'cubic-bezier(0.3, 0, 0.6, 1)', fill: 'backwards' }));
    });
    t += k.el.querySelectorAll('.box .kryss.kula').length * 32 + 200;
    // pennan ringar in numren på de omtvistade matcherna (ringarna syns först
    // när pennan drar dem) och väntar sedan vid den första
    const path = [];
    let at = 0;
    for (const ring of k.el.querySelectorAll('.row.strid .rum-strid')) {
      const nr = ring.parentElement;
      const o = spot(nr);
      const cx = o.x + nr.offsetWidth / 2;
      const cy = o.y + nr.offsetHeight / 2;
      const rx = (nr.offsetWidth + 14) * 0.37;
      const ry = (nr.offsetHeight + 10) * 0.34;
      const p = (v, l, dt, e) => ({ x: cx + rx * Math.cos(v), y: cy + ry * Math.sin(v), a: PEN_SKRIV, l, t: dt, e });
      const a0 = -0.6;
      const travel = path.length ? 260 : 380;
      path.push(p(a0, 0.6, travel, 'cubic-bezier(0.4, 0, 0.2, 1)'), p(a0, 0, 40, 'ease-in'));
      at += travel + 40;
      const draw = ring.querySelector('path');
      if (draw) draw.animate([{ strokeDashoffset: 1.05 }, { strokeDashoffset: 0 }], { duration: 7 * 48, delay: t + at, easing: 'linear', fill: 'backwards' });
      // förklaringen kommer fram med ringen
      const sk = nr.parentElement.querySelector('.skal');
      if (sk) sk.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: t + at + 120, easing: 'ease-out', fill: 'backwards' });
      for (let s = 1; s <= 7; s++) path.push(p(a0 + (s / 7) * Math.PI * 2.15, 0, 48, 'linear'));
      path.push(p(a0 + Math.PI * 2.15, 0.45, 70, 'ease-out'));
      at += 7 * 48 + 70;
    }
    k.idle = setTimeout(() => {
      if (R.kup !== k || k.closing) return;
      if (path.length) penGo(path);
      k.idle = setTimeout(() => vanta(k), at + 120);
    }, t);
  }

  // Där pennan väntar vid en match: till höger om rutorna, med spetsen mot raden.
  function vidRad(row) {
    const b = row.lastElementChild;
    const o = spot(b);
    return { x: o.x + b.offsetWidth + 8, y: o.y + b.offsetHeight * 0.55, a: -6 };
  }

  // Pennan går till nästa omtvistade match som inte är klubbad (efter efter,
  // annars den första), eller lägger sig vid sidan när alla är klubbade.
  function vanta(k, efter = null) {
    if (R.kup !== k || k.closing || calm()) return;
    const a = document.activeElement;
    if (a && k.el.contains(a) && a.matches('input.pen-in')) return;
    const all = [...k.el.querySelectorAll('.row')];
    const open = all.filter((r) => r.matches('.strid:not(.klubbad)'));
    const i = efter ? all.indexOf(efter) : -1;
    const row = open.find((r) => all.indexOf(r) > i) || open[0] || null;
    const to = row ? vidRad(row) : PEN_VILA;
    penGo([{ ...to, l: 0.45, t: 460, e: 'cubic-bezier(0.4, 0, 0.3, 1)' }, { ...to, l: row ? 0.18 : 0, t: 160, e: 'ease-in' }]);
  }

  // En omtvistad match klubbas: bocken vid ringen, sparad på enheten som på
  // papperet (Samtal.pult.klubba). pen: pennan drar bocken (ett klick på
  // matchen) och går sedan vidare.
  function klubba(row, pen = false) {
    const k = R.kup;
    if (!k || row.classList.contains('klubbad')) return;
    Samtal.pult.klubba(row.dataset.id);
    row.classList.add('klubbad');
    const nr = row.querySelector('.pp-nr');
    nr.insertAdjacentHTML('beforeend', bockSvg(row.dataset.id));
    if (calm()) return;
    const bock = nr.lastElementChild;
    const delay = pen ? 300 : 0;
    bock.querySelector('path').animate([{ strokeDashoffset: 1.05 }, { strokeDashoffset: 0 }], { duration: 220, delay, easing: 'cubic-bezier(0.3, 0, 0.5, 1)', fill: 'backwards' });
    if (!pen) return;
    // bockens tre punkter, i kupongens mått (rum.css: 13 × 13 vid ringens övre högra hörn)
    const o = spot(nr);
    const at = ([x, y], l, t, e) => ({ x: o.x + nr.offsetWidth - 4 + x * 0.81, y: o.y - 7 + y * 0.81, a: PEN_SKRIV, l, t, e });
    clearTimeout(k.idle);
    penGo([at([2.4, 8.6], 0.6, 260, 'cubic-bezier(0.4, 0, 0.2, 1)'), at([2.4, 8.6], 0, 40, 'ease-in'), at([6.3, 13], 0, 80, 'ease-out'),
      at([14, 2.4], 0, 140, 'ease-in'), at([16, 0], 0.5, 80, 'ease-out')]);
    k.idle = setTimeout(() => vanta(k, row), 900);
  }

  // Någon annan kryssade på gängets kupong (gängets kupong i realtid, samtal.js):
  // kryssen, bockarna och foten följer med, på kupongen i handen och den på pulten.
  // I handen syns den som kryssade i sin färg en stund runt rutan, och pennan går
  // vidare när en match har klubbats.
  addEventListener('gangets-kupong', (e) => {
    if (!R.el || !R.on) return;
    const k = R.kup;
    if (k && k.slag === 'gang' && !k.closing) gangLive(k, e.detail);
    else if (!k) gangPult();
  });
  function gangLive(k, { av }) {
    const g = Samtal.pult.gang();
    if (!g) return;
    const andrade = setSigns(g.val, true);
    let klubbat = false;
    for (const row of k.el.querySelectorAll('.row.strid')) {
      const id = row.dataset.id;
      const sk = row.querySelector('.skal');
      if (sk) sk.innerHTML = skal(g, id, g.val);
      const pa = g.klar.includes(id);
      if (pa === row.classList.contains('klubbad')) continue;
      klubbat = true;
      row.classList.toggle('klubbad', pa);
      const nr = row.querySelector('.pp-nr');
      const b = nr.querySelector('.rum-bock');
      if (pa && !b) nr.insertAdjacentHTML('beforeend', bockSvg(id));
      else if (!pa && b) b.remove();
    }
    if (av != null && !calm()) {
      for (const b of andrade) {
        b.style.setProperty('--ink-andrad', INK[av % INK.length]);
        clearTimeout(b.andradT);
        b.classList.remove('rum-andrad');
        void b.offsetWidth;
        b.classList.add('rum-andrad');
        b.andradT = setTimeout(() => b.classList.remove('rum-andrad'), 1900);
      }
    }
    k.next = null;
    if (!k.busy) gangState();
    if (klubbat) {
      clearTimeout(k.idle);
      k.idle = setTimeout(() => vanta(k), 1800);
    }
  }
  function gangPult() {
    const rd = round();
    const p = pult(rd);
    const e = document.getElementById('rum-kupong');
    if (!rd || !p || !p.gang || !e || !R.rows) return;
    const html = couponHtml(rd, R.rows, view(p, 'gang'));
    if (e.skrivet === html) return;
    e.skrivet = html;
    e.innerHTML = html;
  }

  // Spela hos Svenska Spel: länken öppnar Stryktipset med gängets tecken i en
  // ny flik, och kupongen skjuts över disken – den sjunker ner mot disken och
  // glider bort – och ligger sedan på pulten igen.
  function lamnaOver(k) {
    if (calm() || !k.anim) {
      closeCoupon(true);
      return;
    }
    k.busy = true;
    clearTimeout(k.idle);
    const h = held();
    if (k.pen) k.pen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    k.show.reverse();
    k.fade.reverse();
    k.anim.cancel();
    k.el.animate([
      { transform: T(h.dx, h.dy, 0, 0, 0, h.z), boxShadow: glow(0, '0 34px 80px rgba(0, 0, 0, 0.6)'), opacity: 1, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
      { offset: 0.3, transform: T(h.dx, h.dy + 24, 0, 24, 0, h.z * 0.97), boxShadow: glow(0, '0 20px 40px rgba(0, 0, 0, 0.55)'), opacity: 1, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' },
      { transform: T(h.dx + 30, h.dy - 230, -520, 64, -4, h.z * 0.5), boxShadow: glow(0, '0 8px 14px rgba(0, 0, 0, 0.4)'), opacity: 0 },
    ], { duration: 820, fill: 'forwards' }).finished.then(() => closeCoupon(true), () => closeCoupon(true));
  }
  // Svenska Spels omgång har hämtats (spela.js): gängets kupong i handen får
  // Spela hos Svenska Spel om den går att spela.
  addEventListener('spela', () => {
    const k = R.kup;
    if (k && k.slag === 'gang' && !k.busy && !k.closing) gangState(k.msg.textContent);
  });

  // Gängets kupong i handen efter ett kryss: fälten i foten, guldordet (Spara
  // gängets kupong, Spara ändringen eller Sparad) och Börja om.
  function gangState(msg = '') {
    const k = R.kup;
    const g = Samtal.pult.gang();
    if (!g) return;
    k.tecken = g.val;
    const f = k.el.querySelector('.fot .pp-fields');
    if (f) f.outerHTML = Samtal.pult.fields(g.val, true);
    if (k.gw && k.go) {
      k.gw.innerHTML = gangHtml(g);
      k.go = k.gw.querySelector('[data-gang]');
    }
    const r = k.rad.querySelector('[data-borjaom]');
    if (r) r.hidden = !g.reset;
    if (!k.el.querySelector('.row.tom button.box')) k.el.classList.remove('need');
    k.msg.textContent = msg;
  }

  // Rutorna ställs som tecknen i want (Ångra, Börja om, någon annan kryssade):
  // kryss som inte ska stå där suddas ut, och de som saknas dras igen, ett i
  // taget. → rutorna som ändrades.
  function setSigns(want, kula = false) {
    let n = 0;
    const andrade = [];
    for (const row of R.kup.el.querySelectorAll('.row')) {
      const w = want[row.dataset.id] || '';
      const boxes = row.querySelectorAll('button.box');
      for (const b of boxes) {
        const on = w.includes(b.dataset.s);
        if ((b.getAttribute('aria-pressed') === 'true') === on) continue;
        andrade.push(b);
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
    return andrade;
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
    // förslaget igen: inget är klubbat (Samtal.pult.besluta), och pennan
    // väntar vid den första
    for (const row of k.el.querySelectorAll('.row.klubbad')) {
      row.classList.remove('klubbad');
      const b = row.querySelector('.rum-bock');
      if (b) b.remove();
    }
    clearTimeout(k.idle);
    k.idle = setTimeout(() => vanta(k), 1200);
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
    hasseAndrade(null);
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
  }
  function refreshSpara() {
    const b = R.kup && R.kup.rad.querySelector('[data-spara]');
    const p = pult();
    if (b && p) b.outerHTML = sparaHtml(p);
  }

  // Gängets kupong sparas, som guldordet i uppgörelsen på papperet
  // (Samtal.pult.sparaGang). Saknar matcher tecken, följer kupongen inte
  // regeln eller är matcher låsta säger raden det, och guldordet blir Spara
  // ändå; har någon annan hunnit före blir det Spara
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
      // kupongen är sparad: det som inte hann klubbas är klubbat, och pennan lägger sig
      const open = [...k.el.querySelectorAll('.row.strid:not(.klubbad)')];
      if (open.length) {
        open.forEach((row) => klubba(row));
        vanta(k);
      }
      return;
    }
    const n = out.ask || 0;
    const ask = Boolean(out.text);
    if (n) k.el.classList.add('need');
    k.next = ask || out.over ? { again: true } : out.igen ? { again: true, anyway: true } : out.offline ? { again: true, adjust: true } : null;
    gangState(ask ? out.text : out.error || 'Det gick inte att spara.');
    if (k.next && k.go) {
      k.go.textContent = ask || out.igen ? 'Spara ändå' : out.over ? 'Spara över den' : 'Spara via Ny kupong';
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

  // ---------- långt tryck i telefonen ----------
  //
  // Med musen syns motiveringen och kommentaren i efterhand när man pekar på
  // porträttet i rutan (seats). I telefonen finns ingen pekare och porträtten
  // är för små för ett finger, så där visar ett långt tryck på rutan samma
  // rader för alla i den, på en lapp ovanför rutan: porträttet, namnet,
  // motiveringen med blyerts och kommentaren i bläck. Rutan kryssas inte av
  // det långa trycket, och nästa tryck tar bort lappen.
  const HALL = 450;
  function wireHold(k, v) {
    const el = k.el;
    let h = null;
    const sluta = () => { if (h) clearTimeout(h.t); h = null; };
    el.addEventListener('pointerdown', (e) => {
      k.holl = false;
      sluta();
      if (!e.target.closest('.rum-ord')) ordUt(k);
      if (e.pointerType === 'mouse' || !e.isPrimary) return;
      const box = e.target.closest('.box');
      if (!box || !box.querySelector('.sits b[class]')) return;
      h = { id: e.pointerId, x: e.clientX, y: e.clientY };
      h.t = setTimeout(() => {
        h = null;
        if (ordPa(k, v, box)) k.holl = true;
      }, HALL);
    });
    el.addEventListener('pointermove', (e) => {
      if (h && e.pointerId === h.id && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) sluta();
    });
    el.addEventListener('pointerup', sluta);
    el.addEventListener('pointercancel', sluta);
    el.addEventListener('contextmenu', (e) => { if (e.target.closest('.box, .rum-ord')) e.preventDefault(); });
  }

  // Lappen ovanför rutan, med högerkanten mot rutans (under den när den inte
  // får plats ovanför). → om det fanns något att visa.
  function ordPa(k, v, box) {
    if (R.kup !== k || k.closing) return false;
    const row = box.closest('.row');
    const id = row.dataset.id;
    const j = [...row.querySelectorAll('.box')].indexOf(box);
    const gang = (KP.data && KP.data.samtal && KP.data.samtal.gang) || [];
    const who = (v.who && v.who[id] && v.who[id][j]) || [];
    const rader = gang.map((g, i) => [g, i]).filter(([g]) => who.includes(g.id)).map(([g, i]) => {
      const { mot, eft } = said(v, id, g.id);
      const src = photoOf(g.id);
      return `<p class="sm-k${i}">${src ? `<img src="${esc(src)}" alt="" draggable="false">` : ''}<b>${esc(g.id)}</b>` +
        `${mot ? `<span class="ord-mot">${esc(mot)}</span>` : ''}${eft ? `<span class="ord-eft">Efteråt: ${esc(eft)}</span>` : ''}</p>`;
    });
    if (!rader.length) return false;
    ordUt(k);
    const el = document.createElement('div');
    el.className = 'rum-ord';
    el.innerHTML = rader.join('');
    k.el.appendChild(el);
    k.ord = el;
    const o = spot(box);
    el.style.right = `${r1(k.el.offsetWidth - o.x - box.offsetWidth)}px`;
    el.style.maxWidth = `${r1(o.x + box.offsetWidth - 12)}px`;
    const top = o.y - el.offsetHeight - 8;
    el.style.top = `${r1(top > 8 ? top : o.y + box.offsetHeight + 8)}px`;
    if (!calm()) el.animate([{ opacity: 0, transform: 'translateY(6px) scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
    return true;
  }
  function ordUt(k) {
    if (!k.ord) return;
    k.ord.remove();
    k.ord = null;
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

  // Ett klick på matchen – tiden eller det som står efter den, inte lagen
  // (matchbladet, lagen) eller rutorna – och man skriver på raden, med markören sist: kommentaren i
  // efterhand när matchen har startat, annars motiveringen när matchen är
  // tippad. Medan man skriver får texten raden (rum.css).
  function writeOn(t) {
    const row = !t.closest('input, label, button, .box') && t.closest('.row');
    const f = row && row.querySelector('.pen:not(.gom) input.pen-in');
    if (!f) return;
    const n = f.value.length;
    f.setSelectionRange(n, n);
    f.focus({ preventScroll: true });
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

  // Vem är du: ett klick på ditt namn visar de andra (.val), och ett klick på
  // ett av dem skriver det i stället för ditt. Stämpeln säger vem omgången
  // väntar på med dig först, som på papperet.
  function choose(b) {
    const k = R.kup;
    const rad = b.closest('.sm-namnen');
    if (b.getAttribute('aria-pressed') === 'true') {
      rad.classList.toggle('val');
      return;
    }
    if (!Samtal.pult.vem(b.dataset.vem)) return;
    for (const o of k.el.querySelectorAll('button[data-vem][aria-pressed="true"]')) {
      o.setAttribute('aria-pressed', 'false');
      o.classList.remove('du');
    }
    rad.classList.remove('val');
    b.setAttribute('aria-pressed', 'true');
    b.classList.add('du');
    if (!calm()) {
      const tid = skrivNamn(b, k);
      clearTimeout(k.idle);
      k.idle = setTimeout(() => {
        if (R.kup === k && !k.closing) penGo([{ ...PEN_VILA, l: 0.4, t: 480, e: 'cubic-bezier(0.4, 0, 0.3, 1)' }, { ...PEN_VILA, t: 160, e: 'ease-in' }]);
      }, tid + 900);
    }
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
    // (det Hasse hade ändrat var med i den)
    if (k.andra) hasseAndrade(null);
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
      k.bak = backHtml(p.vem, p.s.gang.findIndex((g) => g.id === p.vem), p.s.id);
    }
    // omgången läses om, så att gänget vid barbordet ser att du är inne
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
      // (matchbladet på kupongen sköter sig självt: ett svep på det är inget drag, och trycket efter det gäller)
      if (!e.isPrimary || e.button !== 0 || e.target.closest('#rum-vhs, input, .rum-hdr, .rum-ft, .rum-blad')) return;
      cancelAnimationFrame(P.raf);
      Object.assign(P, { id: e.pointerId, x: e.clientX, y: e.clientY, px: R.px, py: R.py, drar: false, spar: [[e.timeStamp, e.clientX, e.clientY]] });
    });
    el.addEventListener('pointermove', (e) => {
      R.pek = e.pointerType;
      if (e.pointerType === 'mouse') {
        // (också nära: dit vrids världen när kameran går tillbaka, vridHem)
        R.mus = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1];
        if (!nara()) [R.tx, R.ty] = R.mus;
      }
      if (e.pointerId !== P.id) return;
      // (släpptes musen utanför fönstret kom inget pointerup hit)
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) {
        P.id = null;
        return;
      }
      const dx = e.clientX - P.x;
      const dy = e.clientY - P.y;
      if (!P.drar && Math.hypot(dx, dy) < 8) return;
      P.drar = true;
      if (nara()) return;
      P.spar.push([e.timeStamp, e.clientX, e.clientY]);
      if (P.spar.length > 5) P.spar.shift();
      pan(P.px - frac(dx, R.k * W - innerWidth), P.py - frac(dy, R.k * H - innerHeight), true);
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
        // (utom när fingret flyttade en lång lapp i handen)
        if (R.ans && R.ans.on() && R.ans.drog()) return;
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
      // Hasse Backe sitter till vänster om det man ser: börjar draget där rummets vänstra kant redan
      // syns och går vidare åt det hållet vänder man sig till honom (hos honom drar man tillbaka åt
      // andra hållet, rum-hasse.js)
      if (e.pointerType !== 'mouse' && (R.k * W - innerWidth <= 1 || P.px <= 0.002) && dx >= 64 && dx > 1.5 * Math.abs(dy) && !R.sak && !R.protokoll && !R.kup) {
        tillHasse();
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
        pan(R.px - frac(vx * ms, R.k * W - innerWidth), R.py - frac(vy * ms, R.k * H - innerHeight), true);
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
  // ryms man står, i sidled och på höjden. drag: fingret drar (eller scenen
  // glider vidare efter det) – då glider scenen dit på 50 ms i Chrome (.drar
  // i rum.css), som kameran efter musen (folj): att flytta den direkt fick
  // Chrome att räkna om alla rummets lager vid varje rörelse.
  function pan(px, py, drag) {
    const ow = R.k * W - innerWidth;
    const oh = R.k * H - innerHeight;
    R.px = ow > 1 ? Math.min(1, Math.max(0, px)) : 0.5;
    R.py = oh > 1 ? Math.min(1, Math.max(0, py)) : 0.5;
    R.ox = -ow * R.px;
    // (scenen är lägre än fönstret i telefonen på höjden: mest tak över och lite pult under, så att
    // rummet får bilden och bordet ungefär en tredjedel, men aldrig så lågt att pingklockan hamnar utanför)
    R.oy = oh < -1 ? Math.max(0, Math.min(-oh * TAK_SMAL, innerHeight - 16 - FOT_SMAL * R.k)) : -oh * R.py;
    const s = R.el.querySelector('.rum-stage');
    const glid = drag && R.el.classList.contains('chromium') && !calm();
    if (glid) {
      s.classList.add('drar');
      clearTimeout(R.drar);
      R.drar = setTimeout(() => s.classList.remove('drar'), 150);
    } else if (s.classList.contains('drar')) {
      clearTimeout(R.drar);
      s.classList.remove('drar');
    }
    s.style.transform = `translate(${R.ox.toFixed(1)}px, ${R.oy.toFixed(1)}px) scale(${R.k.toFixed(4)})`;
  }

  // Ett tryck på någon i gänget långt ut i bilden (telefonen, där rummet inte
  // ryms): rummet glider så att hen hamnar mitt i bild och tecknet syns.
  function visa(x) {
    const ow = R.k * W - innerWidth;
    if (ow <= 1 || (x > innerWidth * 0.3 && x < innerWidth * 0.7)) return;
    const s = R.el.querySelector('.rum-stage');
    if (!calm()) {
      s.classList.add('glider');
      clearTimeout(R.gliderT);
      R.gliderT = setTimeout(() => s.classList.remove('glider'), 560);
    }
    pan(R.px + (x - innerWidth / 2) / ow, R.py);
  }

  // Ett klick på någon i gänget: ett tecken (rum-3d.js). I ett rum som står
  // still (minskad rörelse) syns det som en bild en stund.
  function teckna(k) {
    if (!R.fig || !R.fig.tecken) return;
    if (!calm()) {
      R.fig.tecken(k, now());
      return;
    }
    R.fig.tecken(k, now() - 1.1);
    frame();
    clearTimeout(R.tecknaT);
    R.tecknaT = setTimeout(() => { if (R.on) frame(); }, 2300);
  }

  function wire() {
    const el = R.el;
    swipe(el);
    el.addEventListener('mouseover', (e) => {
      const a = !R.kup && e.target.closest('.rum-sak, .rum-tag');
      hot(a ? a.dataset.nav : null);
      if (a && a.id === 'rum-helgarderat') forberedTidning();
    });
    // tidningen hämtar notiserna och analyserna redan när fingret sätts på den
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#rum-helgarderat')) forberedTidning();
    }, { passive: true });
    el.addEventListener('click', (e) => {
      // Namnet leder till rummet, där man redan är. Som länk blev det en rad i historiken som nästa
      // bakåt stannade på (rum-bak.js).
      if (e.target.closest('.rum-brand')) {
        e.preventDefault();
        zoomTv(false);
        zoomVideo(false);
        return;
      }
      // kupongen i handen: ett klick utanför den lägger tillbaka den
      if (R.kup) {
        // klickets väg, inte var målet sitter nu: ett matchblad som klicket
        // tog bort (lagenUt, nästa blad) sitter inte längre i kupongen
        if (e.composedPath().some((n) => n instanceof Element && n.matches('#rum-handen, #rum-hand, .rum-hdr'))) return;
        e.preventDefault();
        // med matchbladet ovanpå tar klicket bort bladet först
        if (R.kup.lapp) lagenUt();
        else closeCoupon();
        return;
      }
      // anslagstavlan sköter sina lappar själv (rum-anslag.js)
      if (R.ans && R.ans.on()) return;
      // kortregistret sköter sina kort själv (rum-register.js)
      if (R.reg && R.reg.on()) return;
      // nära tv:n sköter den sina knappar och länkar själv (rum-tv.js), utom matchens rad på
      // matchsidan: den lägger fram matchbladet (bladFram)
      const tvMatch = R.zoom && e.target.closest('#rum-tv3 a[href^="#match/"]');
      if (tvMatch && window.RumMatchblad) {
        e.preventDefault();
        bladFram(tvMatch.getAttribute('href').slice(7), 'tv:n');
        return;
      }
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
      // nära en sak: ett klick går tillbaka (utom på namnet och foten) – nära korktavlan tar ett klick
      // på en kupong fram omgångens protokoll (korkProtokoll)
      if (R.sak) {
        if (e.target.closest('.rum-hdr, .rum-ft, [data-radio]')) return;
        e.preventDefault();
        const lapp = R.sak === 'kork' && e.target.closest('.rum-kork .kup[data-kup]');
        if (!(lapp && korkProtokoll(lapp))) sak(null);
        return;
      }
      // pingklockan: gängets kupong i handen, annars går kameran fram till den
      if (e.target.closest('.rum-tag')) {
        e.preventDefault();
        if (!openCoupon()) sak('kupong');
        return;
      }
      const a = e.target.closest('.rum-sak');
      if (a && el.contains(a)) go(a, e);
      else if (R.zoom && !e.target.closest('.rum-hdr, .rum-ft')) zoomTv(false);
    });
    document.addEventListener('keydown', (e) => {
      if (!R.on || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName) || document.querySelector('dialog[open]')) return;
      // föremålen är knappar utan adress (KNAPP): Enter och mellanslag klickar
      if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof Element && e.target.matches('[role="button"]:not(button)') && R.el.contains(e.target)) {
        e.preventDefault();
        e.target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return;
      }
      const k = e.key.toLowerCase();
      const fore = R.sak;
      if (R.tidning) {
        if (k === 'escape') tidningen(false);
        return;
      }
      if (R.protokoll) {
        // matchbladet efter matchen över protokollet: Esc lägger bort det, och pilarna byter sida
        const blad = R.protokoll.blad;
        if (blad) {
          const steg = { arrowleft: -1, arrowright: 1, arrowup: -1, arrowdown: 1 }[k];
          if (k === 'escape') blad.ut();
          else if (steg) {
            e.preventDefault();
            blad.flik(steg);
          }
          return;
        }
        // Esc tystar Hasse och lägger sedan tillbaka bladet, H ropar till honom, och från korktavlan
        // bläddrar ←/→ till omgången före och efter
        if (k === 'escape') {
          if (R.protokoll.hk) protHasse(false);
          else protokollet(false);
        } else if (k === 'h' && !e.repeat) protHasse(!R.protokoll.hk);
        else if ((k === 'arrowleft' || k === 'arrowright') && R.protokoll.kork) {
          e.preventDefault();
          bladdra(k === 'arrowleft' ? -1 : 1);
        }
        return;
      }
      // matchbladet för sig (bladFram): Esc lägger bort det, och pilarna byter sida
      const pil = { arrowleft: -1, arrowright: 1, arrowup: -1, arrowdown: 1 }[k];
      if (R.blad) {
        if (k === 'escape') R.blad.ut();
        else if (pil) {
          e.preventDefault();
          R.blad.flik(pil);
        }
        return;
      }
      // nära en sak: Esc går tillbaka, och K, T, A, R, V, H och N går dit direkt
      if (R.sak && !R.kup) {
        if (k === 'escape') {
          sak(null);
          return;
        }
        if (/^[ktarvhn]$/.test(k)) sak(null, null);
      }
      if (R.kup && R.kup.lapp) {
        // matchbladet: Esc tar bort det, och pilarna byter sida
        if (k === 'escape') lagenUt();
        else if (k === 'k') closeCoupon();
        else if (pil) {
          e.preventDefault();
          R.kup.lapp.flik(pil);
        }
      } else if (R.kup) {
        // (kupongen ur kupongstället sätts tillbaka också med N)
        if (k === 'k' || k === 'escape' || (k === 'n' && R.kup.slag === 'stall')) closeCoupon();
      } else if (R.ans && R.ans.on()) {
        if (R.ans.key(e.key)) e.preventDefault();
        else if (k === 'a' || k === 'escape') board(false);
      } else if (R.reg && R.reg.on()) {
        if (R.reg.key(e.key)) e.preventDefault();
        else if (k === 'r' || k === 'escape') register(false);
      } else if (k === 'k') {
        // (K igen nära kupongen på pulten går tillbaka)
        if (!openCoupon() && fore !== 'kupong') sak('kupong');
      } else if (R.zoom && R.tv && R.tv.key(e.key)) e.preventDefault();
      else if (R.vnara && R.video.key(e.key, e.repeat)) e.preventDefault();
      else if (k === 't') zoomTv(!R.zoom);
      else if (k === 'a') board(true);
      else if (k === 'r') register(true);
      else if (k === 'n') openStall();
      else if (k === 'v') zoomVideo(!R.vnara);
      else if (k === 'h' && !R.zoom && !R.vnara) tillHasse();
      else if (k === 'l' && !R.zoom && !R.vnara) oppnaTidning();
      // (han sitter till vänster: pilen dit vänder en också, när inget ligger framme)
      else if (k === 'arrowleft' && !e.repeat && !R.zoom && !R.vnara && !R.sak && !R.protokoll) tillHasse();
      else if (k === 'escape' && R.zoom) zoomTv(false);
      else if (k === 'escape' && R.vnara) zoomVideo(false);
    });
    addEventListener('resize', fit);
    addEventListener('resize', passaProtokoll);
    addEventListener('resize', passaTidning);
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
    // i telefonen på höjden: den smala kupongen, och på bredden orden
    // bredvid kupongen i handen
    const smal = innerWidth < 600 && innerHeight > innerWidth;
    const fyller = Math.max(innerWidth / W, innerHeight / H);
    // På höjden står rummet lite längre bort: alla tre i gänget, neonen och hela kupongen syns utan
    // att man drar. Scenen räcker inte till fönstrets höjd då, så taket och pulten fortsätter utanför
    // (.rum-tak, .rum-pult-mer).
    R.k = smal ? Math.min(fyller, Math.max(innerWidth / 760, innerHeight / 1330)) : fyller;
    // där man står när man kommer in: vid gänget, med kupongen under dem (HEM_SMAL). Har man inte
    // dragit står man kvar där när fönstret ändras (adressraden i telefonen).
    const ow = R.k * W - innerWidth;
    const hem = smal && ow > 1 ? Math.min(1, Math.max(0, (HEM_SMAL * R.k - innerWidth / 2) / ow)) : 0.5;
    if (smal !== Boolean(R.smal) || R.px === R.pxHem) R.px = hem;
    R.pxHem = hem;
    pan(R.px, R.py);
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
    // tv:n och videon nära: de ryms i det nya fönstret
    if (R.zoom && R.tvMatt) aimTv(null);
    if (R.vnara) aimVideo(null);
    // närbilden: saken ryms i det nya fönstret
    if (R.sak) sak(R.sak, null);
    // kupongen i handen står kvar mitt i fönstret
    if (R.kup) flyttaHand(R.kup);
  }

  // ---------- in och ut ----------

  // Lysröret tänds när man kommer in (en gång per sidvisning, inte utan
  // rörelser): mörkt medan gänget laddas, minst 0,7 och högst 2,6 sekunder,
  // och sedan blinkar det igång (.rum-mork i rum.css).
  function tand(ready) {
    const m = document.getElementById('rum-mork');
    if (!m || R.tant || calm() || (window.RumFolk && RumFolk.nattGrad && RumFolk.nattGrad() > 0)) return;
    R.tant = true;
    const t0 = performance.now();
    m.classList.add('start');
    const tands = () => { m.classList.remove('start'); m.classList.add('tands'); };
    // (också om något gick fel i datan: annars förblev rummet mörkt)
    Promise.race([ready, new Promise((r) => setTimeout(r, 2600))])
      .catch((err) => console.warn('Rummet: datan kunde inte visas', err))
      .then(() => setTimeout(tands, Math.max(0, 700 - (performance.now() - t0))));
    m.addEventListener('animationend', (e) => { if (e.animationName === 'rum-tands') m.classList.remove('tands'); });
  }

  // i alla fönster utom de allra minsta – i telefonen också
  const fits = () => R.q.has('rum-t') || matchMedia('(min-width: 280px) and (min-height: 260px)').matches;

  function show() {
    // ?rum-mat: mätningen i den riktiga telefonen (rum-mat.js)
    if (R.q.has('rum-mat') && !R.mat) {
      R.mat = true;
      R.kvalLas = true;
      const m = document.createElement('script');
      m.src = 'rum-mat.js';
      m.onload = () => window.RumMat(R);
      document.head.append(m);
    }
    forhamta();
    if (!R.built) build();
    const q = R.q;
    if (q.has('rum-t')) R.frozen = parseFloat(q.get('rum-t')) || 0;
    if (q.has('rum-mx')) R.mx = R.tx = parseFloat(q.get('rum-mx'));
    if (q.has('rum-my')) R.my = R.ty = parseFloat(q.get('rum-my'));
    R.el.hidden = false;
    document.documentElement.classList.add('i-rummet');
    R.on = true;
    document.documentElement.classList.add('rum-pa');
    if (window.RumFolk) RumFolk.on(true);
    fit();
    kval(R.kval);
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
        .catch(() => {})
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
      ready.then(turTom).then(() => R.fig && R.fig.uttryck && R.fig.uttryck()).then(() => {
        freezeCss(R.frozen);
        if (q.has('rum-anslag')) {
          board(true);
          if (q.get('rum-anslag')) setTimeout(() => R.ans && R.ans.lift(q.get('rum-anslag')), 50);
          if (q.get('rum-anslag') && q.has('rum-anslag-hasse')) setTimeout(() => R.ans && R.ans.hasse(), 100);
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
      // (inte then(frame): frame tar emot dt, och kameran blev NaN så att gänget inte syntes)
      ready.then(() => frame());
    } else loop();
    clearInterval(R.poll);
    // omgången och liveställningen kan ändras medan rummet står öppet
    // (inte i en dold flik: varje gång är en fråga till tjänsten, samtal.js)
    R.poll = setInterval(() => { if (R.on && !document.hidden) { load(); ute(); } }, 60000);
  }

  function hide() {
    if (!R.on) return;
    if (R.blad) R.blad.ut(true);
    closeCoupon(true);
    protokollet(false, true);
    board(false);
    register(false);
    if (R.video) R.video.stop();
    zoomVideo(false);
    sak(null, null);
    if (window.RumBak) RumBak.rensa();
    R.on = false;
    document.documentElement.classList.remove('rum-pa');
    if (window.RumFolk) RumFolk.on(false);
    cancelAnimationFrame(R.raf);
    clearTimeout(R.vila);
    clearInterval(R.poll);
    R.el.hidden = true;
    document.documentElement.classList.remove('i-rummet');
  }

  // kval: rummets steg (KVAL), som Hasse Backe också ritas efter (rum-hasse.js)
  // Din kupong hos Hasse Backe (rum-hasse-kupong.js): samma kupong som på pulten, medan den går att fylla i
  // eller, inlämnad, att ändra.
  //   html()         kupongen, som på pulten (null om den inte går att fylla i eller ändra)
  //   kryss(key, h)  ett kryss (h: bara hans; annars hans om han har skrivit det), drag(key) hans drag
  //   skrev(key, ja) krysset är hans, eller inte längre, ritaOm() pulten igen, penna() var pennan ligger
  //   andring(alla)  det han har ändrat i din inlämnade och inte lämnat in, andrat(t) det nu ({} = inget)
  const kupong = {
    html() {
      const p = pult();
      const v = !p ? null : p.fyll ? view(p, 'fyll') : p.andra ? view(p, 'din', p.vem) : null;
      if (!v) return null;
      if (v.slag === 'din') v.tecken = { ...v.tecken, ...hassesAndring(p) };
      const rd = { id: p.s.id, ids: p.s.matcher.map((x) => String(x.id)), gang: p.s.gang, name: (window.Samtal && Samtal.name()) || null };
      return couponHtml(rd, roundRows(rd), v);
    },
    andring: (alla = false) => hassesAndring(pult(), alla),
    andrat: (t) => hasseAndrade(pult(), t),
    kryss(key, h = false) {
      const p = pult();
      return crossSvg(key, false, h || Boolean(p && hassesKryss(p.s.id)[key]));
    },
    drag: (key) => slarv(key),
    skrev(key, ja) {
      const p = pult();
      if (p) hasseSkrev(p.s.id, key, ja);
    },
    ritaOm() { if (R.on) fill(); },
    penna: () => ({ x: PEN_PULT.x, y: PEN_PULT.y, a: PEN_PULT.a }),
  };
  // Matchbladet för sig, mitt i rummet (RumMatchblad.fram): från matchens rad på tv:ns matchsida.
  // Matcherna är kupongens, som när bladet läggs på kupongen i handen.
  function bladFram(id, tillbaka) {
    if (R.blad || !R.el) return;
    const c = bladet();
    let matcher = c ? c.matcher : [];
    if (!matcher.some((m) => String(m.id) === String(id))) {
      const m = state.all ? state.all.matches.find((x) => String(x.id) === String(id)) : null;
      matcher = m ? [m] : [];
    }
    if (!matcher.length) return;
    R.blad = RumMatchblad.fram({ inom: R.el, matcher, id: String(id), kupong: c ? c.kupong : 'Kupong', tillbaka, smal: () => Boolean(R.smal), calm,
      nar: () => { R.blad = null; } });
  }

  // Matchbladet hos Hasse Backe (rum-hasse.js): omgångens matcher i kupongens ordning och kupongens
  // namn, som när bladet läggs på kupongen i handen (lagen). (smal: kupongen är den smala.)
  function bladet() {
    const p = pult();
    if (!p) return null;
    const rd = { id: p.s.id, ids: p.s.matcher.map((x) => String(x.id)) };
    const rows = roundRows(rd);
    const nr = typeof couponNumber === 'function' ? couponNumber(rd.ids) : null;
    return { matcher: rd.ids.map((id) => rows.find((x) => x.id === id)).filter(Boolean).map((x) => x.m), kupong: nr ? `Kupong ${nr}` : 'Kupong' };
  }
  // summa: sammanställningen så länge protokollet ligger på pulten (Hasses domar i rum-hasse.js), annars null
  return { fits, show, hide, kupong, bladet, summa: () => R.summa || null, smal: () => Boolean(R.smal), redraw: () => { if (R.on) fill(); }, skriv: skrivPult, kval: () => R.kval, vila: (v) => {
      R.vilar = Boolean(v);
      // (rummet kommer tillbaka rakt: rum-hasse.js rätar upp det på vägen dit)
      if (!v) { R.mx = R.my = 0; setCam(0, 0); }
    } };
})();
