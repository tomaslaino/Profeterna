'use strict';

// Videon i tobaksaffären (rum.js): en liten färg-tv med inbyggd video som
// står på disken, nere i hörnet till höger, med ryggen mot väggen och
// rutan vänd mot gänget mitt i rummet. På tv:n ligger de senaste
// repriserna på VHS i en hög, och i en fruktlåda bredvid resten (Arkivet),
// med öppningen åt samma håll. När man går fram (klick eller V) står de
// kvar som de står och syns från sidan, som på håll. Kassetterna har
// handskrivna etiketter med matchen, resultatet och dagen; ett klick på en
// kassett och den åker in i videon, som spelar matchens höjdpunkter i
// rutan (samma klipp som spelaren på sajten, hojdpunkter.js). Knapparna
// under rutan: ◀◀ och ▶▶ spolar tio sekunder, ▶ spelar eller pausar och ⏏
// matar ut. Ett klick på rutan (eller hjulet) går ännu närmare, så att tv:n
// fyller bilden. Går man därifrån pausar videon, och den spelar vidare när
// man kommer tillbaka. När inget spelar blinkar klockan på 12:00, som den
// alltid gjort.
//
// Tv:n är en låda i CSS 3D (framsidan, sidorna, taket och skuggan på
// disken) i rummets eget perspektiv – 1000 bildpunkter från flyktpunkten
// (760, 400), som högra väggen i rum.js (rum-hv) – så att den står mot
// väggen som om den var målad dit. Fruktlådan och kassetterna är också
// lådor, i tv:ns mått.
//
// YouTube syns inte: spelaren får inte musen, har inga egna knappar, och
// varje gång ett klipp börjar eller spelar vidare visar videon sin blå bild
// med ▶ SPELA, utan ljud, tills spelarens rubrik och logga har tonat bort
// (FORVARM) – innan dess spolar den tillbaka lika mycket. Textningen stängs
// av.
//
// Kassetterna: matcher med YouTube-klipp (m.y i matches.json), omgångens
// först, sedan de senaste – dag för dag, Premier League före Championship
// osv. Högst 25: fyra på tv:n och 21 i lådan. Dolda resultat (Spoiler) står
// inte på etiketten, och klippets rubrik täcks som i spelaren på sajten.
//
// Allt ritas i sex gånger storleken och förminskas (som tv:n i rum-tv.js),
// så att det är skarpt på nära håll – i dubbla storleken till när rutan
// fyller bilden, och spelaren i dubbla storleken till.
// Väggen, disken och pulten fortsätter till höger om bilden (vagg och
// pult), så att bilden inte tar slut när kameran går dit.
//
// RumVideo.html('horn' | 'vagg' | 'pult') → delarna (planen -598, -600 och -60 i rum.js)
// RumVideo.mount(el, { calm, short, kort, aim }) → { fill(matches, ids), skarp(on), zoom(on) → hörnet i scenen, key(k), stop() }
// aim(f) flyttar kameran till f (med f.z som största förstoring) när man går närmare tv:n.

window.RumVideo = (() => {
  // sex gånger storleken; hörnets övre vänstra hörn i scenen och dess mått
  const S = 6;
  const O = [1446, 494];
  const VP = [760 - O[0], 400 - O[1]];
  const TZ = 'Europe/Stockholm';
  const r2 = (x) => Math.round(x * 100) / 100;
  const pts = (list) => list.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');

  // Måtten i hörnets enheter (scenens pixlar från O): tv:ns front, rutan,
  // kassettfacket, displayen och knapparna, lådans front och kassetterna.
  const TV = { x: 31, y: 41, w: 82, h: 75 };
  const GLAS = { x: 38.5, y: 47, w: 67, h: 50.25 };
  const FACK = { x: 36, y: 103.2, w: 43, h: 6.6 };
  const VFD = { x: 82, y: 102.6, w: 27, h: 5.2 };
  const KNAPP = { x: 82, y: 109, w: 6.1, h: 3.6, d: 6.97 };
  // tv:ns djup, och kassetternas (de ligger med ryggen åt samma håll som rutan)
  const DJUP = 40;
  const KAS = { w: 41, h: 5.67, d: 22.4 };
  // Tv:n står mot väggen (PLATS), så långt in (BAK) att den ryms i bilden,
  // vriden VRID grader kring mitten av foten: mot gänget mitt i rummet – i
  // rummets perspektiv ser den annars ut att stå rakt mot en. Platsen är
  // den där den skulle ta i väggen rakt fram, där disken (490 i hörnet
  // x = 1140, rum.js) möter den på tv:ns djup.
  const VRID = 112;
  const BAK = -110;
  const MITT = [TV.x + TV.w / 2, TV.y + TV.h, -DJUP / 2];
  const VAGG = VP[0] + (1140 - 760) * (O[1] + TV.y + TV.h - 400) / (490 - 400);
  const PLATS = [VAGG - 1.5 - TV.w / 2 - MITT[0], BAK];
  const RAD = VRID * Math.PI / 180;
  // Lådan står på disken bredvid tv:n, längre in längs väggen: i tv:ns mått
  // till vänster om den och z längre fram, så att den står lika långt från
  // väggen. d är djupet.
  const LADA = { x: TV.x - 4 - 95, y: TV.y + TV.h - 77, w: 95, h: 77, t: 4.5, d: 27 };
  LADA.z = LADA.d - DJUP + (LADA.x - TV.x) / Math.tan(RAD);
  // Var en punkt på tv:n eller lådan (i tv:ns mått, z framåt från tv:ns
  // front) syns i hörnet: vriden kring MITT, flyttad till PLATS och i
  // rummets perspektiv. ruta: det minsta i scenen som rymmer punkterna, med
  // kanten k.
  function syns([x, y, z]) {
    const [dx, dz] = [x - MITT[0], z - MITT[2]];
    const wx = MITT[0] + PLATS[0] + dx * Math.cos(RAD) - dz * Math.sin(RAD);
    const wz = MITT[2] + PLATS[1] + dx * Math.sin(RAD) + dz * Math.cos(RAD);
    const f = 1000 / (1000 - wz);
    return [VP[0] + (wx - VP[0]) * f, VP[1] + (y - VP[1]) * f];
  }
  const horn = (x0, y0, x1, y1, z0, z1) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => [x, y, z])));
  function ruta(p, k) {
    const s = p.map(syns);
    const xs = s.map((q) => q[0]);
    const ys = s.map((q) => q[1]);
    return { x0: O[0] + Math.min(...xs) - k, y0: O[1] + Math.min(...ys) - k, x1: O[0] + Math.max(...xs) + k, y1: O[1] + Math.max(...ys) + k };
  }
  // högarna: tv:ns och lådans två, nerifrån och upp (den nyaste överst);
  // på tv:n vrids kassetterna lite på högkant, i lådan lutar de
  const COLS = [
    { x: 39, y: TV.y, ix: [3, 2, 1, 0], j: 1.6, r: 3, tv: true },
    { x: LADA.x + 6.4, y: LADA.y + LADA.h - LADA.t - 0.2, ix: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4], j: 0.6, r: 0.45 },
    { x: LADA.x + 48.6, y: LADA.y + LADA.h - LADA.t - 0.2, ix: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15], j: 0.6, r: 0.45 },
  ];
  const CAP = 25;
  // det kameran ska få med: högen, tv:n och lådan – och närmare bara
  // rutan – i scenens mått
  const FOCUS = ruta([
    ...horn(TV.x, TV.y - 4 * KAS.h, TV.x + TV.w, TV.y + TV.h, 0, -DJUP),
    ...horn(LADA.x, LADA.y, LADA.x + LADA.w, LADA.y + LADA.h, LADA.z, LADA.z - LADA.d),
  ], 6);
  const TAT = { ...ruta(horn(GLAS.x, GLAS.y, GLAS.x + GLAS.w, GLAS.y + GLAS.h, 0, 0), 1), z: 16 };

  const hash = (s) => {
    let a = 7;
    for (const c of String(s)) a = (Math.imul(a, 31) + c.charCodeAt(0)) | 0;
    const x = Math.sin(a) * 43758.5453;
    return x - Math.floor(x);
  };

  // En sida av en låda i 3D, i bildpunkter, och ett golv på höjden y från
  // z0 bakåt till z1.
  const yta = (cls, x, y, w, h, o, t) => `<i class="vhs-yta ${cls}" style="left:${r2(x)}px; top:${r2(y)}px; width:${r2(w)}px; height:${r2(h)}px; transform-origin:${o}; transform:${t}"></i>`;
  const golv = (cls, x, y, w, z0, z1) => yta(cls, x, y - (z0 - z1), w, z0 - z1, '0 100%', `translateZ(${r2(z0)}px) rotateX(90deg)`);

  // ---------- tv:n ----------

  // Framsidan: höljet, rutans ram, kassettfacket, displayen och fötterna.
  function tvSvg() {
    const { x, y, w, h } = TV;
    const g = GLAS;
    const f = FACK;
    return `<g class="massiv">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="url(#vhs-kropp)"/>
    <rect x="${x + 1}" y="${y + 0.3}" width="${w - 2}" height=".5" rx=".25" fill="#fff" opacity=".16"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="url(#vhs-dager)"/>
    <rect x="${g.x - 3}" y="${g.y - 3}" width="${g.w + 6}" height="${g.h + 6}" rx="3.4" fill="#0b0a0a" stroke="#34312d" stroke-width=".45"/>
    <rect x="${g.x - 0.8}" y="${g.y - 0.8}" width="${g.w + 1.6}" height="${g.h + 1.6}" rx="5.6" fill="#040404"/>
    <line x1="${x + 2}" y1="${f.y - 1.5}" x2="${x + w - 2}" y2="${f.y - 1.5}" stroke="#8a857b" stroke-width=".3" opacity=".55"/>
    <rect x="${f.x - 0.6}" y="${f.y - 0.6}" width="${f.w + 1.2}" height="${f.h + 1.2}" rx="1" fill="#4c4944"/>
    <rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx=".7" fill="#030303"/>
    <rect class="vhs-lucka" x="${f.x + 0.5}" y="${f.y + 0.45}" width="${f.w - 1}" height="${f.h - 0.9}" rx=".4" fill="url(#vhs-lucka)"/>
    <rect x="${VFD.x}" y="${VFD.y}" width="${VFD.w}" height="${VFD.h}" rx=".6" fill="#06100d" stroke="#2c2a27" stroke-width=".3"/>
    <circle class="vhs-led" cx="${x + 2.6}" cy="${f.y + f.h / 2}" r=".62"/>
  </g>`;
  }
  function tvText() {
    const g = GLAS;
    const f = FACK;
    return `<text x="${g.x + g.w / 2}" y="${g.y + g.h + 2.35}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="1.55" letter-spacing=".5" fill="#a9a399">TV · VIDEO</text>
    <text x="${f.x + f.w / 2}" y="${f.y + f.h + 2.4}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="1.3" letter-spacing=".4" fill="#8f8a80">HQ · STEREO</text>`;
  }

  // Lådans övriga sidor, i bildpunkter: vänster och höger sida med
  // springorna, taket, baksidan, och på disken skuggan och skenet från
  // rutan framför den.
  const X0 = TV.x * S;
  const Y0 = TV.y * S;
  const W = TV.w * S;
  const H = TV.h * S;
  const D = DJUP * S;
  function ytor() {
    return golv('vhs-skugga', X0 - 7 * S, Y0 + H, W + 14 * S, 6 * S, -D - 6 * S) +
      golv('vhs-pol', X0 - 14 * S, Y0 + H, W + 28 * S, 34 * S, 0) +
      yta('vhs-bak', X0, Y0, W, H, '50% 50%', `translateZ(${-D}px) rotateY(180deg)`) +
      yta('vhs-sida v', X0 - D, Y0, D, H, '100% 0', 'rotateY(-90deg)') +
      yta('vhs-sida h', X0 + W, Y0, D, H, '0 0', 'rotateY(90deg)') +
      yta('vhs-topp', X0, Y0 - D, W, D, '0 100%', 'rotateX(90deg)') +
      // fötterna under fronten
      yta('vhs-fot', X0 + 5 * S, Y0 + H, 9 * S, 1.4 * S, '0 0', 'translateZ(-1px)') +
      yta('vhs-fot', X0 + W - 14 * S, Y0 + H, 9 * S, 1.4 * S, '0 0', 'translateZ(-1px)');
  }

  // Där man klickar på håll: tv:ns framsida med högen, högra sidan och
  // taket, och lådans, en bildpunkt utanför dem.
  function hitYtor() {
    const L = LADA;
    const fram = (x, y, w, h, z) => `<i style="left:${px(x)}; top:${px(y)}; width:${px(w)}; height:${px(h)}; transform:translateZ(${r2(z * S + 1)}px)"></i>`;
    const sida = (x, y, h, z, d) => `<i style="left:${r2(x * S + 1)}px; top:${px(y)}; width:${px(d)}; height:${px(h)}; transform-origin:0 0; transform:translateZ(${px(z)}) rotateY(90deg)"></i>`;
    const tak = (x, y, w, z, d) => `<i style="left:${px(x)}; top:${r2((y - d) * S - 1)}px; width:${px(w)}; height:${px(d)}; transform-origin:0 100%; transform:translateZ(${px(z)}) rotateX(90deg)"></i>`;
    return fram(TV.x - 2, 14, TV.w + 4, TV.y + TV.h + 2 - 14, 0) + sida(TV.x + TV.w, TV.y, TV.h, 0, DJUP) + tak(TV.x, TV.y, TV.w, 0, DJUP) +
      fram(L.x - 1, L.y - 1, L.w + 2, L.h + 2, L.z) + sida(L.x + L.w, L.y, L.h, L.z, L.d) + tak(L.x, L.y, L.w, L.z, L.d);
  }

  // ---------- lådan ----------

  // En fruktlåda i furu på sidan, med öppningen mot gänget som tv:n.
  // Framsidan: brädorna runt öppningen och tejpbiten med namnet.
  function ladaSvg() {
    const L = LADA;
    const board = (x, y, w, h, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vhs-furu)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#${cls})" opacity=".55"/>`;
    const nails = [[L.x + 2.2, L.y + 2.2], [L.x + L.w - 2.2, L.y + 2.2], [L.x + 2.2, L.y + L.h - 2.2], [L.x + L.w - 2.2, L.y + L.h - 2.2]]
      .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r=".42" fill="#2a2420"/><circle cx="${cx - 0.12}" cy="${cy - 0.12}" r=".16" fill="#8d877c"/>`).join('');
    return `<g class="massiv vhs-ram">
    ${board(L.x, L.y, L.t, L.h, 'vhs-ved-s')}${board(L.x + L.w - L.t, L.y, L.t, L.h, 'vhs-ved-s')}
    ${board(L.x, L.y, L.w, L.t, 'vhs-ved')}${board(L.x, L.y + L.h - L.t, L.w, L.t, 'vhs-ved')}
    <rect x="${L.x}" y="${L.y}" width="${L.w}" height=".45" fill="#fff3d8" opacity=".35"/>
    <g fill="#3a2410" opacity=".45"><rect x="${L.x + L.t}" y="${L.y + L.t - 0.5}" width="${L.w - 2 * L.t}" height=".5"/><rect x="${L.x + L.t - 0.5}" y="${L.y + L.t}" width=".5" height="${L.h - 2 * L.t}"/></g>
    ${nails}
    <polygon points="${pts([[L.x + 25.2, L.y + 0.45], [L.x + 69, L.y + 0.2], [L.x + 69.6, L.y + 1.4], [L.x + 68.9, L.y + 2.6], [L.x + 69.5, L.y + 4.2], [L.x + 25.4, L.y + 4.5], [L.x + 24.8, L.y + 3.1], [L.x + 25.5, L.y + 1.9]])}" fill="#e7dab2" opacity=".96" transform="rotate(-1.6 ${L.x + 47} ${L.y + 2.3})"/>
  </g>`;
  }
  function ladaText() {
    const L = LADA;
    return `<text x="${L.x + L.w / 2}" y="${L.y + L.h - 1.2}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="2.6" letter-spacing="1.2" fill="#9b2c1f" opacity=".5">ÄPPLEN · KLASS I</text>
    <text x="${L.x + 47}" y="${L.y + 3.55}" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="3.9" letter-spacing=".5" fill="#1d1a16" transform="rotate(-1.6 ${L.x + 47} ${L.y + 2.3})">ARKIVET</text>`;
  }

  // En ritning bara så stor som det den visar (b), så att lagret blir litet.
  // Texten står i en egen ritning ovanpå: Chrome lägger ut text i SVG på
  // nytt i varje bildruta medan rummet vrids, och då ritades hela ritningen
  // om varje gång.
  const ritning = (b, inner) => `<svg class="vhs-ritning" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="${b.w * S}" height="${b.h * S}" style="left:${px(b.x)}; top:${px(b.y)}" aria-hidden="true">${inner}</svg>`;
  function tvRitning() {
    const b = { x: TV.x, y: TV.y, w: TV.w, h: TV.h };
    return ritning(b, `<defs>
    <linearGradient id="vhs-kropp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#36332f"/><stop offset=".07" stop-color="#262421"/><stop offset=".85" stop-color="#191816"/><stop offset="1" stop-color="#0f0e0d"/></linearGradient>
    <linearGradient id="vhs-dager" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="vhs-lucka" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3935"/><stop offset=".18" stop-color="#1b1a18"/><stop offset="1" stop-color="#0c0c0b"/></linearGradient>
  </defs>
  ${tvSvg()}`) + ritning(b, tvText());
  }
  function ladaRitning() {
    const b = { x: LADA.x - 0.5, y: LADA.y - 1, w: LADA.w + 1, h: LADA.h + 1 };
    return ritning(b, `<defs>
    <linearGradient id="vhs-furu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6b07a"/><stop offset=".5" stop-color="#c29a62"/><stop offset="1" stop-color="#9c7744"/></linearGradient>
    <filter id="vhs-ved" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".03 .9" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .28  0 0 0 0 .15  0 0 0 0 .05  2.4 0 0 0 -1"/></filter>
    <filter id="vhs-ved-s" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .03" numOctaves="3" seed="6"/><feColorMatrix values="0 0 0 0 .28  0 0 0 0 .15  0 0 0 0 .05  2.4 0 0 0 -1"/></filter>
  </defs>
  ${ladaSvg()}`) + ritning(b, ladaText());
  }
  // Lådans övriga sidor, i bildpunkter (lådans front i z = 0): högra sidan
  // och taket, innanför öppningen vänstra väggen, botten och baksidan, och
  // skuggan på disken.
  function ladaYtor() {
    const L = LADA;
    const [x0, y0, x1, y1] = [L.x + L.t, L.y + L.t, L.x + L.w - L.t, L.y + L.h - L.t].map((v) => v * S);
    const inne = (L.d - 1.5) * S;
    return golv('vhs-skugga', (L.x - 4) * S, (L.y + L.h) * S, (L.w + 8) * S, 4 * S, -(L.d + 4) * S) +
      yta('lada-bak', x0, y0, x1 - x0, y1 - y0, '0 0', `translateZ(${r2(-inne)}px)`) +
      yta('lada-vagg', x0, y0, inne, y1 - y0, '0 0', 'rotateY(90deg)') +
      golv('lada-botten', x0, y1, x1 - x0, 0, -inne) +
      yta('lada-sida', (L.x + L.w) * S, L.y * S, L.d * S, L.h * S, '0 0', 'rotateY(90deg)') +
      yta('lada-topp', L.x * S, (L.y - L.d) * S, L.w * S, L.d * S, '0 100%', 'rotateX(90deg)');
  }

  // ---------- väggen, disken och pulten till höger om bilden ----------

  // Högra väggen och disken som de är ritade i rum.js (bg), förlängda åt
  // höger: samma toner, fläckar och linjer. Ligger direkt efter bg() i
  // planet -600, under det som hänger på väggen.
  const wl = (x) => 490 + (x - 1140) * 109 / 460;
  const re = (x) => 490 + (x - 1060) * 162 / 540;
  function vaggSvg() {
    const [a, z] = [1599.5, 2100];
    const r = `x="${a}" y="300" width="${z - a}" height="720"`;
    return `<svg class="vhs-vagg" viewBox="${a} 300 ${z - a} 720" aria-hidden="true">
    <rect ${r} fill="url(#rum-rwall)"/><rect ${r} filter="url(#rum-flack)" opacity=".55"/><rect ${r} fill="#000" opacity=".2"/>
    <polygon points="${a},${wl(a)} ${z},${wl(z)} ${z},${re(z)} ${a},${re(a)}" fill="#5b564c"/>
    <polygon points="${a},${re(a)} ${z},${re(z)} ${z},1020 ${a},1020" fill="#2a2019"/>
    <line x1="${a}" y1="${re(a)}" x2="${z}" y2="${re(z)}" stroke="#c9c2b2" stroke-opacity=".35" stroke-width="2"/>
    <polygon points="${a},${re(a) + 2} ${z},${re(z) + 2} ${z},${re(z) + 48} ${a},${re(a) + 48}" fill="#000" opacity=".12"/>
  </svg>`;
  }
  // Pulten (table i rum.js) förlängd åt höger, i planet -60.
  function pultSvg() {
    const [a, z] = [1599.5, 2140];
    const r = `x="${a}" y="650" width="${z - a}" height="360"`;
    return `<svg class="vhs-pult" viewBox="${a} 640 ${z - a} 380" aria-hidden="true">
    <rect ${r} fill="url(#rum-pult)"/><rect ${r} filter="url(#rum-grainwood)"/><rect ${r} filter="url(#rum-flack)" opacity=".35"/>
    <rect x="${a}" y="647" width="${z - a}" height="6" fill="url(#rum-alu)"/><rect x="${a}" y="984" width="${z - a}" height="20" fill="url(#rum-alu)"/>
  </svg>`;
  }

  // ---------- html ----------

  const px = (v) => `${r2(v * S)}px`;
  const at = (r) => `left:${px(r.x)}; top:${px(r.y)}; width:${px(r.w)}; height:${px(r.h)}`;

  function html(part) {
    if (part === 'vagg') return vaggSvg();
    if (part === 'pult') return pultSvg();
    const knappar = [['bak', '◀◀', 'Spola tillbaka'], ['spela', '▶', 'Spela'], ['fram', '▶▶', 'Spola fram'], ['ut', '⏏', 'Mata ut']]
      .map(([k, t, l], i) => `<button type="button" class="vhs-k" data-vhs="${k}" aria-label="${l}" style="${at({ x: KNAPP.x + i * KNAPP.d, y: KNAPP.y, w: KNAPP.w, h: KNAPP.h })}">${t}</button>`).join('');
    // en kassett: ryggen med etiketten, och taket och ändarna bakåt
    const kas = (a, b) => Array.from({ length: b - a }, (_, i) => `<div class="vhs-band" data-i="${a + i}" hidden>` +
      `<button type="button" class="vhs-kas" data-i="${a + i}"><span class="lapp"><b></b><i></i></span></button>` +
      '<i class="kas-topp"></i><i class="kas-v"></i><i class="kas-h"></i></div>').join('');
    // den 16:9-stora bilden i den 4:3-stora rutan
    const bh = GLAS.w * 9 / 16;
    return `<div class="rum-vhs" id="rum-vhs" data-lage="tom" style="left:${O[0]}px; top:${O[1]}px">` +
      `<div class="vhs-in" style="perspective:${1000 * S}px; perspective-origin:${px(VP[0])} ${px(VP[1])}">` +
      '<i class="vhs-sken"></i>' +
      `<div class="vhs-tv" style="transform:translate3d(${px(PLATS[0])}, 0px, ${px(PLATS[1])}) rotateY(${-VRID}deg); transform-origin:${px(MITT[0])} ${px(MITT[1])} ${px(MITT[2])}">${ytor()}` +
      `<div class="vhs-front">${tvRitning()}<div class="vhs-styr" inert>` +
      `<div class="vhs-skarm" style="${at(GLAS)}">` +
      `<div class="vhs-bild" style="top:${px((GLAS.h - bh) / 2)}; height:${px(bh)}"></div>` +
      '<div class="vhs-bla"></div><i class="vhs-brus"></i>' +
      `<i class="vhs-mask" style="top:${px((GLAS.h - bh) / 2)}" hidden></i>` +
      '<span class="vhs-osd">STOPP</span><i class="vhs-glas"></i></div>' +
      `<span class="vhs-vfd" style="${at(VFD)}">12:00</span>${knappar}${kas(0, 4)}</div></div>` +
      // lådan bredvid
      `<div class="vhs-lada" style="transform:translateZ(${px(LADA.z)})">${ladaYtor()}${ladaRitning()}<div class="vhs-styr" inert>${kas(4, CAP)}</div></div>` +
      `<a class="vhs-hit rum-sak" href="#matcher" data-nav="video" aria-label="Videon">${hitYtor()}</a></div>` +
      '</div></div>';
  }

  // ---------- kassetterna ----------

  const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'numeric' });
  const fKey = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const dag = (iso) => {
    const p = Object.fromEntries(fDag.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return `${p.day}/${p.month}`;
  };
  const RANK = { pl: 0, ch: 1, l1: 2, l2: 3, fac: 4, lc: 5 };
  const hidden = (m) => Boolean(window.Spoiler && Spoiler.hidden(m));

  // Omgångens matcher först, sedan de senaste dag för dag, de högre
  // divisionerna först samma dag.
  function pick(matches, ids) {
    const own = new Set((ids || []).map(String));
    return (matches || []).filter((m) => m.completed && m.y && m.y.length)
      .map((m) => ({ m, own: own.has(String(m.id)), d: fKey.format(new Date(m.kickoff)) }))
      .sort((a, b) => (b.own - a.own) || b.d.localeCompare(a.d) || (RANK[a.m.comp] ?? 9) - (RANK[b.m.comp] ?? 9) || a.m.home.localeCompare(b.m.home))
      .slice(0, CAP)
      .map((x) => x.m);
  }

  // Klipp som inte går att spela här, gemensamt med spelaren på sajten (hojdpunkter.js).
  const BAD_KEY = 'matchfixarna.hl-ej';
  function bad() {
    try {
      return JSON.parse(localStorage.getItem(BAD_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function markBad(id) {
    try {
      const list = bad().filter((x) => x !== id);
      list.push(id);
      localStorage.setItem(BAD_KEY, JSON.stringify(list.slice(-300)));
    } catch {
      // privat läge: provas igen nästa gång
    }
  }

  // ---------- i rummet ----------

  const HOST = 'https://www.youtube-nocookie.com';
  const GONE = new Set([100, 101, 150]);
  // så länge spelarens rubrik, knapp och logga syns efter att klippet har
  // börjat spela (eller spolats)
  const FORVARM = 3600;
  // ◀◀ och ▶▶: sekunder per tryck, och minsta tiden mellan två med
  // piltangenterna (så att en nedtryckt tangent spolar ungefär en minut i
  // sekunden)
  const SPOLA = 10;
  const SPOLA_MS = 150;

  function mount(root, o) {
    const box = root.querySelector('#rum-vhs');
    const inn = box.querySelector('.vhs-in');
    const styr = [...box.querySelectorAll('.vhs-styr')];
    const bild = box.querySelector('.vhs-bild');
    const mask = box.querySelector('.vhs-mask');
    const osdEl = box.querySelector('.vhs-osd');
    const vfd = box.querySelector('.vhs-vfd');
    const lucka = box.querySelector('.vhs-lucka');
    const kas = [...box.querySelectorAll('.vhs-band')].sort((a, b) => a.dataset.i - b.dataset.i);
    // tapes: kassetternas matcher; cur: kassetten i videon (index), mid: dess
    // match; near: kameran är framme, tat: ännu närmare; resume: spela vidare
    // när man kommer tillbaka
    const V = { tapes: [], key: '', cur: null, mid: null, near: false, tat: false, resume: false, lage: 'tom' };
    // spelaren: klippen, vilket, meddelandenas id, ramen, tiden och läget;
    // dold: bilden täcks tills spelarens egna saker har tonat bort (varm);
    // mal: dit den spolar (åt hållet dir), dur: klippets längd, pil: när en
    // piltangent spolade senast
    const P = { list: [], i: 0, seq: 0, frame: null, ready: false, ping: null, t: 0, st: -1, timer: 0, dold: true, varm: 0, mal: null, dir: 0, dur: 0, pil: 0 };

    function lage(l, text) {
      V.lage = l;
      box.dataset.lage = l;
      if (text != null) osdEl.textContent = text;
    }

    // ---------- högarna ----------

    // Kassetterna nerifrån och upp i varje hög; den som är i videon lämnar en
    // lucka som de ovanför sjunker ner i, men har kvar sin plats att komma
    // tillbaka till.
    function layout() {
      for (const c of COLS) {
        let yAll = c.y;
        let yNow = c.y;
        for (const i of c.ix) {
          const el = kas[i];
          if (!V.tapes[i]) continue;
          yAll -= KAS.h;
          if (i !== V.cur) yNow -= KAS.h;
          const top = i === V.cur ? yAll : yNow;
          const x = c.x + (hash(`x${i}`) - 0.5) * 2 * c.j;
          const r = r2((hash(`r${i}`) - 0.5) * 2 * c.r);
          // på tv:n lite in från kanten och vridna på högkant, i lådan lite
          // innanför öppningen och lutade
          const t = c.tv ? `translateZ(${-1.5 * S}px) rotateY(${r}deg)` : `translateZ(${-S}px) rotate(${r}deg)`;
          el.style.left = px(x);
          el.style.top = px(top);
          el.style.setProperty('--t', t);
          el.dataset.t = t;
        }
      }
      kas.forEach((el, i) => el.classList.toggle('inne', i === V.cur));
    }

    const VARIANTS = 5;
    const INK = ['#1b2030', '#22357e', '#2a2724'];
    function paint(el, m) {
      const hide = hidden(m);
      const score = !hide && m.score ? `${m.score.home}–${m.score.away}` : '';
      const name = `${o.short(m.home)}–${o.short(m.away)}`;
      const label = name.length <= 16 ? name : `${o.kort(m.home)}–${o.kort(m.away)}`;
      const v = Math.floor(hash(m.id) * VARIANTS);
      el.className = `vhs-band v${v}${el.classList.contains('inne') ? ' inne' : ''}`;
      el.style.setProperty('--blk', INK[Math.floor(hash(`b${m.id}`) * INK.length)]);
      el.style.setProperty('--lr', `${r2((hash(`l${m.id}`) - 0.5) * 1.6)}deg`);
      const text = score ? `${label} ${score}` : label;
      // långa namn skrivs mindre, så att de får plats på etiketten
      el.style.setProperty('--fs', `${text.length > 21 ? 15 : text.length > 17 ? 17.5 : 20}px`);
      el.querySelector('b').textContent = text;
      el.querySelector('.lapp i').textContent = dag(m.kickoff);
      el.querySelector('.vhs-kas').setAttribute('aria-label', `${m.home} – ${m.away}${score ? `, ${score}` : ''}, ${dag(m.kickoff)}`);
    }

    // Kassetten åker från sin plats in i facket (eller tillbaka): lyfts upp
    // och fram, ställs framför facket och skjuts in. Ur lådan dras den först
    // ut genom öppningen. Lådan står i tv:ns mått, LADA.z framför tv:ns front.
    const FC = [(FACK.x + FACK.w / 2) * S, (FACK.y + FACK.h / 2) * S];
    function fly(el, into, done) {
      if (o.calm()) {
        done();
        return;
      }
      const cx = parseFloat(el.style.left) + KAS.w * S / 2;
      const cy = parseFloat(el.style.top) + KAS.h * S / 2;
      const [dx, dy] = [r2(FC[0] - cx), r2(FC[1] - cy)];
      const lada = Boolean(el.closest('.vhs-lada'));
      const fz = lada ? r2(-LADA.z * S) : 0;
      const z = r2(fz + 34 * S);
      const k = [
        { transform: el.dataset.t, opacity: 1, offset: 0 },
        ...(lada ? [{ transform: `translate3d(0px, -6px, ${(KAS.d + 3) * S}px) scale(1.04)`, opacity: 1, offset: 0.2 }] : []),
        { transform: `translate3d(${r2(dx * 0.45)}px, ${r2(dy * 0.45 - 70)}px, ${z}px) scale(1.12)`, opacity: 1, offset: 0.45 },
        { transform: `translate3d(${dx}px, ${r2(dy + 22)}px, ${z}px) scale(1.07)`, opacity: 1, offset: 0.76 },
        { transform: `translate3d(${dx}px, ${dy}px, ${r2(fz + 34 * S * 0.3)}px) scale(1)`, opacity: 1, offset: 0.9 },
        { transform: `translate3d(${dx}px, ${r2(dy - 4)}px, ${fz}px) scale(0.9)`, opacity: 0, offset: 1 },
      ];
      el.classList.add('flyger');
      el.classList.remove('inne');
      const a = el.animate(into ? k : k.map((f) => ({ ...f, offset: 1 - f.offset })).reverse(),
        { duration: into ? 900 : 720, easing: 'cubic-bezier(0.3, 0, 0.25, 1)' });
      setTimeout(() => {
        lucka.classList.add('matar');
        setTimeout(() => lucka.classList.remove('matar'), 380);
      }, into ? 700 : 0);
      a.onfinish = () => {
        el.classList.remove('flyger');
        done();
      };
    }

    // ---------- spelaren ----------

    function stopPlayer() {
      clearTimeout(P.ping);
      clearTimeout(P.timer);
      clearTimeout(P.varm);
      P.varm = 0;
      P.seq++;
      P.frame = null;
      P.ready = false;
      P.st = -1;
      P.dold = true;
      P.mal = null;
      P.dur = 0;
      bild.replaceChildren();
    }

    const cmd = (func, args = []) => {
      if (P.frame && P.frame.contentWindow) P.frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args, id: P.seq, channel: 'widget' }), HOST);
    };
    const listen = (f, id) => f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), HOST);

    // Klippet P.list[P.i] från sekund start, i rutan – utan ljud och bakom
    // videons blå bild tills spelarens egna saker har tonat bort (varm).
    function load(start) {
      stopPlayer();
      const seq = P.seq;
      lage('laddar', '▶ SPELA');
      const q = new URLSearchParams({
        autoplay: V.near ? 1 : 0, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3,
        cc_load_policy: 0, hl: 'en', start: Math.floor(Math.max(0, (start || 0) - FORVARM / 1000)),
        enablejsapi: 1, origin: location.origin, widgetid: seq,
      });
      const f = document.createElement('iframe');
      f.src = `${HOST}/embed/${encodeURIComponent(P.list[P.i])}?${q}`;
      f.title = 'Höjdpunkter';
      f.tabIndex = -1;
      f.allow = 'autoplay; encrypted-media';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      const hello = (n) => {
        if (seq !== P.seq || P.ready || !n) return;
        listen(f, seq);
        P.ping = setTimeout(hello, 250, n - 1);
      };
      f.addEventListener('load', () => hello(40));
      P.frame = f;
      bild.replaceChildren(f);
      // svarar inte spelaren alls visas det som finns i rutan
      P.timer = setTimeout(() => { if (seq === P.seq && !P.ready && V.lage === 'laddar') lage('spelar'); }, 12000);
    }

    // Bilden fram och ljudet på, när klippet har spelat en stund.
    function varm() {
      if (P.varm || !P.dold) return;
      P.varm = setTimeout(() => {
        P.varm = 0;
        if (P.st !== 1) return;
        P.dold = false;
        P.mal = null;
        cmd('unloadModule', ['captions']);
        cmd('unMute');
        lage('spelar');
        tick();
      }, FORVARM);
    }

    // Spela vidare efter en paus: bakom den blå bilden, tillbaka så mycket
    // som spelarens egna saker syns.
    function resume() {
      if (!P.frame) return;
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      lage('laddar', '▶ SPELA');
      cmd('mute');
      cmd('seekTo', [Math.max(0, (P.mal ?? P.t) - FORVARM / 1000), true]);
      cmd('playVideo');
    }

    // ◀◀ och ▶▶: tio sekunder åt gången, bakom den blå bilden med ◀◀ eller
    // ▶▶ tills spelarens egna saker har tonat bort, och sedan spelar den
    // därifrån (också efter en paus). Flera tryck i rad lägger ihop.
    function spola(d) {
      if (!P.frame || !P.ready || P.st === 0) return;
      const mal = Math.max(0, (P.mal ?? P.t) + d * SPOLA);
      P.mal = P.dur ? Math.min(mal, Math.max(0, P.dur - 1)) : mal;
      P.dir = d;
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      lage('laddar', d > 0 ? '▶▶' : '◀◀');
      cmd('mute');
      cmd('seekTo', [Math.max(0, P.mal - FORVARM / 1000), true]);
      cmd('playVideo');
      // spelar den redan kommer inget nytt läge från spelaren
      if (P.st === 1) varm();
      tick();
    }

    function start(m) {
      const skip = new Set(bad());
      P.list = m.y.filter((id) => id && !skip.has(id));
      P.i = 0;
      P.t = 0;
      mask.hidden = !hidden(m);
      if (P.list.length) load(0);
      else {
        stopPlayer();
        lage('brus', '');
      }
    }

    function next() {
      P.t = 0;
      if (++P.i < P.list.length) load(0);
      else {
        stopPlayer();
        lage('brus', '');
      }
    }

    // Spelarens läge: 1 spelar, 2 paus, 0 slut (då matas kassetten ut).
    function state(st) {
      P.st = st;
      if (st === 1) {
        // gick man därifrån medan den laddade: paus tills man kommer tillbaka
        if (!V.near) {
          cmd('pauseVideo');
          V.resume = true;
        } else if (P.dold) varm();
      } else {
        clearTimeout(P.varm);
        P.varm = 0;
      }
      // slutet (och förslagen efter det) syns inte
      if (st === 0) {
        P.dold = true;
        lage('tom', 'STOPP');
        setTimeout(() => { if (P.st === 0) eject(); }, 600);
      }
      tick();
    }

    addEventListener('message', (e) => {
      const f = P.frame;
      if (!f || e.source !== f.contentWindow || e.origin !== HOST || typeof e.data !== 'string') return;
      let d;
      try {
        d = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!d || d.id !== P.seq) return;
      if (d.event === 'readyToListen') {
        listen(f, P.seq);
        return;
      }
      P.ready = true;
      if (d.event === 'onError') {
        if (GONE.has(d.info)) markBad(P.list[P.i]);
        next();
      } else if (d.event === 'onStateChange' && typeof d.info === 'number') state(d.info);
      else if (d.event === 'infoDelivery' && d.info) {
        if (typeof d.info.currentTime === 'number') P.t = d.info.currentTime;
        if (typeof d.info.duration === 'number') P.dur = d.info.duration;
        if (typeof d.info.playerState === 'number' && d.info.playerState !== P.st) state(d.info.playerState);
      }
    });

    // Displayen: 12:00 som blinkar när ingen kassett är i, annars tiden (dit
    // den spolar medan den spolar).
    const clock = (s) => {
      const t = Math.max(0, Math.floor(s));
      return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    };
    function tick() {
      const sym = P.st === 2 ? '❚❚' : P.mal == null ? '▶' : P.dir > 0 ? '▶▶' : '◀◀';
      const txt = V.cur == null && V.mid == null ? '12:00' : `${sym} ${clock(P.mal ?? P.t)}`;
      if (vfd.textContent !== txt) vfd.textContent = txt;
      vfd.classList.toggle('blink', txt === '12:00');
    }
    setInterval(() => { if (!root.hidden) tick(); }, 500);

    // ---------- kassetterna in och ut ----------

    function insert(i) {
      const m = V.tapes[i];
      if (!m) return;
      if (V.cur === i) {
        toggle();
        return;
      }
      if (V.cur != null) eject();
      stopPlayer();
      V.cur = i;
      V.mid = m.id;
      lage('laddar', '▶ SPELA');
      const el = kas[i];
      layout();
      el.classList.remove('inne');
      fly(el, true, () => {
        if (V.cur !== i) return;
        el.classList.add('inne');
        start(m);
        tick();
      });
      tick();
    }

    function eject() {
      const i = V.cur;
      stopPlayer();
      V.cur = null;
      V.mid = null;
      V.resume = false;
      mask.hidden = true;
      lage('tom', 'STOPP');
      layout();
      tick();
      if (i == null || !kas[i] || !V.tapes[i]) return;
      const el = kas[i];
      fly(el, false, () => {});
    }

    function toggle() {
      if (V.cur == null) insert(0);
      else if (P.st === 1) cmd('pauseVideo');
      else if (P.frame) resume();
      else start(V.tapes[V.cur]);
    }

    function step(d) {
      const n = V.tapes.length;
      if (!n) return;
      insert(V.cur == null ? 0 : Math.min(n - 1, Math.max(0, V.cur + d)));
    }

    // Närmare: rutan fyller bilden; ett klick på rutan till
    // och man går tillbaka till tv:n och lådan.
    // Hörnet ritas i halva storleken, och i hela när rutan fyller bilden
    // (.skarp, rum-video.css; tat). zoom ändrar också måtten i
    // övergångarna, så det byts med övergångarna avstängda, när inget rör sig.
    function skarp(on) {
      if (inn.classList.contains('skarp') === on) return;
      inn.classList.add('byt');
      inn.classList.toggle('skarp', on);
      void inn.offsetWidth;
      inn.classList.remove('byt');
    }

    function tat(on) {
      if (!V.near || on === V.tat) return;
      V.tat = on;
      // hörnet ritas skarpt bara här, där rutan fyller bilden: innan
      // kameran går fram, och i halva storleken igen när den har gått
      // tillbaka
      clearTimeout(V.skarpT);
      if (on) skarp(true);
      else V.skarpT = setTimeout(() => { if (!V.tat) skarp(false); }, 900);
      box.classList.toggle('vhs-tat', on);
      if (o.aim) o.aim(on ? TAT : FOCUS);
    }

    box.addEventListener('click', (e) => {
      if (!V.near) return;
      const b = e.target.closest('.vhs-kas, [data-vhs]');
      if (!b) {
        if (e.target.closest('.vhs-skarm')) tat(!V.tat);
        return;
      }
      e.preventDefault();
      if (b.classList.contains('vhs-kas')) insert(Number(b.dataset.i));
      else if (b.dataset.vhs === 'spela') toggle();
      else if (b.dataset.vhs === 'ut') eject();
      else spola(b.dataset.vhs === 'fram' ? 1 : -1);
    });
    // hjulet: framåt närmare, bakåt tillbaka till tv:n och lådan
    box.addEventListener('wheel', (e) => {
      if (!V.near || Math.abs(e.deltaY) < 2) return;
      e.preventDefault();
      tat(e.deltaY < 0);
    }, { passive: false });

    tick();

    return {
      fill(matches, ids) {
        const list = pick(matches, ids);
        const key = list.map((m) => `${m.id}:${hidden(m) ? '?' : m.score ? `${m.score.home}-${m.score.away}` : ''}`).join();
        if (key === V.key) return;
        V.key = key;
        V.tapes = list;
        kas.forEach((el, i) => {
          el.hidden = !list[i];
          if (list[i]) paint(el, list[i]);
        });
        // kassetten i videon kan ha fått en annan plats
        if (V.mid != null) {
          const j = list.findIndex((m) => m.id === V.mid);
          V.cur = j >= 0 ? j : null;
          const m = list[j];
          if (m) mask.hidden = !hidden(m);
        }
        layout();
      },
      skarp,
      // Nära: kassetterna och knapparna går att trycka på, och videon spelar
      // vidare om den gjorde det när man gick. Svarar med hörnet i scenen.
      zoom(on) {
        V.near = on;
        V.tat = false;
        box.classList.remove('vhs-tat');
        for (const s of styr) s.inert = !on;
        if (!on && P.frame && P.st !== 2 && P.st !== 0) {
          cmd('pauseVideo');
          V.resume = true;
        } else if (on && V.resume) {
          V.resume = false;
          resume();
        }
        return FOCUS;
      },
      // ←/→ (och ett svep i telefonen) spolar som ◀◀ och ▶▶ och ↑/↓ byter
      // kassett när man är framme, och Esc går tillbaka från rutan till
      // tv:n och lådan.
      key(k) {
        if (k === 'ArrowRight' || k === 'ArrowLeft') {
          if (performance.now() - P.pil < SPOLA_MS) return true;
          P.pil = performance.now();
          spola(k === 'ArrowRight' ? 1 : -1);
        } else if (k === 'ArrowDown') step(1);
        else if (k === 'ArrowUp') step(-1);
        else if (k === 'Escape' && V.tat) tat(false);
        else return false;
        return true;
      },
      // Rummet stängs: videon stannar och kassetten ligger kvar på sin plats.
      stop() {
        stopPlayer();
        V.cur = null;
        V.mid = null;
        V.resume = false;
        mask.hidden = true;
        lage('tom', 'STOPP');
        layout();
        tick();
      },
    };
  }

  return { html, mount };
})();
