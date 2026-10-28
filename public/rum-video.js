'use strict';

// Videon i tobaksaffären (rum.js): en liten Sony-tv med inbyggd video som
// står på disken, nere i hörnet till höger, med ryggen mot väggen och
// rutan vänd mot gänget mitt i rummet. Bredvid står repriserna på VHS i en
// fruktlåda med två fack, med öppningen åt samma håll. När man går fram
// (klick eller V) står de kvar som de står, och kameran svänger runt tv:n
// så att man ser rutan snett framifrån (SVANG) – närmare rutan rakt
// framifrån. Kassetterna har maskinskrivna etiketter; ett klick på en
// kassett och den åker in i videon, som spelar matchens höjdpunkter i
// rutan (samma klipp som spelaren på sajten, hojdpunkter.js). Knapparna
// under rutan: ◀◀ och ▶▶ spolar, fortare och fortare som en riktig video,
// tills man trycker ▶ (spelar därifrån) eller ■ (stopp); ▶ spelar eller
// pausar och ⏏ matar ut. Medan den spolar söker den i bilden: bilden ur
// klippet skakar med brusränder som rullar genom den, och räkneverket och
// bandmätaren i rutan visar var på bandet den är. Nära styrs den också med
// tangenterna (←/→, mellanslaget och S), som står i rummets fot där. Ett
// klick på rutan (eller hjulet) går ännu närmare, så att bilden i rutan
// fyller fönstret.
// Går man därifrån pausar videon, och den spelar vidare när man kommer
// tillbaka. När inget spelar blinkar klockan på 12:00, som den alltid gjort.
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
// Kassetterna: matcher med YouTube-klipp (m.y i matches.json), i lådans två
// fack – till vänster förra omgångens 13 i kupongens ordning, med numret på
// en rund lapp, och till höger den senaste matchen för lagen i nästa
// omgång (högst 13, de som inte redan står till vänster). Etiketterna är
// maskinskrivna och så stora som de får plats. När ingen kassett är i står
// samma kassetter som en lista i den blå rutan, en sida per fack, och ett
// klick på en rad spelar den. I telefonen (på höjden) går kameran fram
// till lådan, och en kassett därifrån tar kameran till rutan. Dolda
// resultat (Spoiler) står inte på etiketten eller i listan, och klippets
// rubrik täcks som i spelaren på sajten.
//
// Allt ritas i sex gånger storleken och förminskas (som tv:n i rum-tv.js),
// så att det är skarpt på nära håll – i dubbla storleken till när rutan
// fyller bilden, och spelaren i dubbla storleken till.
// Väggen, disken och pulten fortsätter till höger om bilden (vagg och
// pult), så att bilden inte tar slut när kameran går dit.
//
// RumVideo.html('horn' | 'vagg' | 'pult') → delarna (planen -598, -600 och -60 i rum.js)
// RumVideo.mount(el, { calm, short, kort, aim }) → { fill(matches, { rd, old }), skarp(on), zoom(on) → hörnet i scenen, key(k), stop() }
// (rd: omgången som gänget tippar, round() i rum.js; old: de färdigspelade kupongerna, Historik.coupons())
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
  // den 16:9-stora bilden mitt i den 4:3-stora rutan
  const BILD = { x: GLAS.x, y: GLAS.y + (GLAS.h - GLAS.w * 9 / 16) / 2, w: GLAS.w, h: GLAS.w * 9 / 16 };
  const FACK = { x: 36, y: 103.2, w: 43, h: 6.6 };
  const VFD = { x: 82, y: 102.6, w: 27, h: 5.2 };
  const KNAPP = { x: 82, y: 109, w: 4.9, h: 3.6, d: 5.525 };
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
  // väggen. d är djupet. Den har två fack med en mellanvägg (MV, från
  // lådans vänstra kant), tretton kassetter höga.
  const LADA = { x: TV.x - 4 - 95, y: TV.y + TV.h - 87, w: 95, h: 87, t: 4.5, d: 27 };
  const MV = { x: 46.15, w: 2.9 };
  LADA.z = LADA.d - DJUP + (LADA.x - TV.x) / Math.tan(RAD);
  // Kameran svänger runt tv:n när man går fram, så att man ser rutan snett
  // framifrån – och när man går närmare rutan rakt framifrån: rummet
  // vrids rum grader i 3D kring tv:n (rum.js), och här ritas hörnet horn
  // grader runt (.vhs-kam, kring tv:ns mitt). Rummet är målat på platta plan,
  // så vridningen i 3D visar bara mer av planen; det är hörnet som ses från
  // det nya hållet. Tv:n och lådan står som de står. Rakt framifrån är
  // VRID grader runt, så att rutan står parallellt med bilden, med ögat
  // (perspektivets mitt, oga) flyttat från VP till rakt framför rutan:
  // kameran går fram och förstorar en del av bilden, och vänd mot VP blev
  // rutan sned som i kanten av ett vidvinkelfoto, och från VP skymde lådan
  // rutans vänstra kant.
  const SVANG = { nara: { rum: 30, horn: 30 }, tat: { rum: 34, horn: VRID, oga: [GLAS.x + GLAS.w / 2 + PLATS[0], GLAS.y + GLAS.h / 2] } };
  // Var en punkt på tv:n eller lådan (i tv:ns mått, z framåt från tv:ns
  // front) syns i hörnet: vriden kring MITT, flyttad till PLATS och i
  // rummets perspektiv, med kameran v grader runt och ögat i e. ruta: det
  // minsta i scenen som rymmer punkterna, med kanten k.
  function syns([x, y, z], v = 0, e = VP) {
    const a = RAD - v * Math.PI / 180;
    const [dx, dz] = [x - MITT[0], z - MITT[2]];
    const wx = MITT[0] + PLATS[0] + dx * Math.cos(a) - dz * Math.sin(a);
    const wz = MITT[2] + PLATS[1] + dx * Math.sin(a) + dz * Math.cos(a);
    const f = 1000 / (1000 - wz);
    return [e[0] + (wx - e[0]) * f, e[1] + (y - e[1]) * f];
  }
  const horn = (x0, y0, x1, y1, z0, z1) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => [x, y, z])));
  function ruta(p, k, v, e) {
    const s = p.map((q) => syns(q, v, e));
    const xs = s.map((q) => q[0]);
    const ys = s.map((q) => q[1]);
    return { x0: O[0] + Math.min(...xs) - k, y0: O[1] + Math.min(...ys) - k, x1: O[0] + Math.max(...xs) + k, y1: O[1] + Math.max(...ys) + k };
  }
  // lådans två fack, nerifrån och upp (den första överst): förra omgången
  // till vänster (0–12, i kupongens ordning) och nästa till höger (13–25);
  // kassetterna lutar lite
  const FACKEN = 13;
  const COLS = [
    { x: LADA.x + 4.9, y: LADA.y + LADA.h - LADA.t - 0.2, ix: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], j: 0.25, r: 0.3 },
    { x: LADA.x + 49.3, y: LADA.y + LADA.h - LADA.t - 0.2, ix: [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13], j: 0.25, r: 0.3 },
  ];
  const CAP = 2 * FACKEN;
  // det kameran ska få med: tv:n och lådan – i telefonen på höjden bara
  // lådan (LADAN), och närmare bilden i rutan, som fyller fönstret (fyll) –
  // i scenens mått, med kameran svängd; sv: rummets vridning, mitt: där
  // tv:n står i scenen (x), och kant: hörnets vänstra kant (lådan) hur
  // kameran än står
  const LADORNA = horn(LADA.x, LADA.y, LADA.x + LADA.w, LADA.y + LADA.h, LADA.z, LADA.z - LADA.d);
  const ALLT = [...horn(TV.x, TV.y - 2, TV.x + TV.w, TV.y + TV.h, 0, -DJUP), ...LADORNA];
  const HORN = { mitt: O[0] + syns(MITT)[0], kant: Math.min(...[{ horn: 0 }, SVANG.nara, SVANG.tat].map((s) => ruta(ALLT, 0, s.horn, s.oga).x0)) };
  const FOCUS = { ...ruta(ALLT, 6, SVANG.nara.horn), ...HORN, sv: SVANG.nara.rum };
  const LADAN = { ...FOCUS, ...ruta(LADORNA, 3, SVANG.nara.horn) };
  const TAT = { ...ruta(horn(BILD.x, BILD.y, BILD.x + BILD.w, BILD.y + BILD.h, 0, 0), 0, SVANG.tat.horn, SVANG.tat.oga), z: 32, fyll: true, ...HORN, sv: SVANG.tat.rum };

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

  // SONY som loggan på tv:n: en fet och bred antikva med raka seriffer och
  // lodrät betoning, i enheter där versalhöjden är 100 (w bred).
  const SONY = { w: 516, d: 'M77 25 76 24 76 22 75 21 75 20 74 18 73 17 71 15 69 14 67 13 64 12 62 11 59 10 55 9 52 9 48 10 44 10 40 12 37 13 34 14 31 16 29 18 28 20 27 22 26 23 26 25 26 26 26 27 27 28 26 29 26 30 26 31 26 32 26 33 27 35 28 37 30 38 33 40 36 41 40 42 44 43 48 44 53 45 58 46 62 47 67 48 71 48 75 49 79 50 83 51 87 52 90 54 94 56 97 59 100 63 102 68 103 73 102 78 100 83 98 87 95 91 91 93 87 96 83 97 79 98 75 99 71 100 66 100 62 100 57 100 52 100 48 100 44 100 40 100 36 100 32 100 29 99 25 98 22 97 18 96 15 94 12 92 9 90 6 87 5 84 25 74 26 75 26 77 27 78 27 80 28 81 30 83 31 84 33 86 36 87 38 88 41 89 45 90 48 91 52 91 56 90 60 90 64 89 68 87 71 86 73 84 75 83 77 81 77 79 78 77 78 76 78 75 78 74 78 73 78 72 78 72 78 71 79 70 78 69 77 67 76 65 73 64 71 62 67 61 64 60 60 59 55 58 51 57 46 56 42 55 37 55 33 54 29 53 25 52 21 51 17 50 13 48 10 46 6 42 4 38 2 33 2 28 2 23 3 18 6 14 9 10 13 7 16 5 20 3 25 2 29 1 33 0 38 0 42 0 47 0 52 0 56 0 59 0 63 0 67 0 70 0 74 0 77 1 80 2 84 3 87 5 90 7 93 9 96 12 97 15ZM86 4 97 4 97 35 86 35ZM5 65 16 65 16 96 5 96ZM238 50 238 55 237 60 235 65 233 69 231 74 228 78 224 82 220 85 215 89 210 92 205 94 200 96 194 98 188 99 182 100 176 100 170 100 164 99 158 98 152 96 147 94 142 92 137 89 132 85 128 82 124 78 121 74 119 69 117 65 115 60 114 55 114 50 114 45 115 40 117 35 119 31 121 26 124 22 128 18 132 15 137 11 142 8 147 6 152 4 158 2 164 1 170 0 176 0 182 0 188 1 194 2 200 4 205 6 210 8 215 11 220 15 224 18 228 22 231 26 233 31 235 35 237 40 238 45ZM212 46 211 42 210 38 209 35 208 31 206 28 204 25 201 22 199 19 196 17 193 15 190 13 186 12 183 11 180 10 176 10 172 10 169 11 166 12 162 13 159 15 156 17 153 19 151 22 148 25 146 28 144 31 143 35 142 38 141 42 140 46 140 50 140 54 141 58 142 62 143 65 144 69 146 72 148 75 151 78 153 81 156 83 159 85 162 87 166 88 169 89 172 90 176 90 180 90 183 89 186 88 190 87 193 85 196 83 199 81 201 78 204 75 206 72 208 69 209 65 210 62 211 58 212 54 212 50ZM266 0 275 0 275 100 266 100ZM266 0 294 0 366 100 338 100ZM357 0 366 0 366 100 357 100ZM252 0 294 0 294 9 252 9ZM252 91 290 91 290 100 252 100ZM342 0 380 0 380 9 342 9ZM406 0 434 0 468 55 444 55ZM494 0 504 0 468 55 458 55ZM444 50 468 50 468 100 444 100ZM394 0 444 0 444 9 394 9ZM478 0 516 0 516 9 478 9ZM430 91 482 91 482 100 430 100Z' };
  // Trinitron under rutan: jämntjocka linjer (stroke) med runda ändar, i
  // enheter där versalhöjden är 100.
  const TRINITRON = { w: 496, d: 'M0 0H58M29 0V100M76 30V100M76 62C76 40 88 30 108 31M126 30V100M126 7v.1M152 30V100M152 62C152 40 164 30 180 30S206 40 206 60V100M230 30V100M230 7v.1M262 8V84C262 96 270 100 286 99M248 34H284M306 30V100M306 62C306 40 318 30 338 31M353 65A30 35 0 1 0 413 65A30 35 0 1 0 353 65M436 30V100M436 62C436 40 448 30 464 30S490 40 490 60V100' };

  // Framsidan: höljet, rutans ram med SONY mitt ovanför rutan och Trinitron
  // under, kassettfacket, displayen och fötterna.
  function tvSvg() {
    const { x, y, w, h } = TV;
    const g = GLAS;
    const f = FACK;
    const k = 2 / 100;
    const kt = 1.4 / 100;
    return `<g class="massiv">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="url(#vhs-kropp)"/>
    <rect x="${x + 1}" y="${y + 0.3}" width="${w - 2}" height=".5" rx=".25" fill="#fff" opacity=".16"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="url(#vhs-dager)"/>
    <rect x="${g.x - 3}" y="${g.y - 3}" width="${g.w + 6}" height="${g.h + 6}" rx="3.4" fill="#0b0a0a" stroke="#34312d" stroke-width=".45"/>
    <rect x="${g.x - 0.8}" y="${g.y - 0.8}" width="${g.w + 1.6}" height="${g.h + 1.6}" rx="5.6" fill="#040404"/>
    <path d="${SONY.d}" transform="translate(${r2(x + w / 2 - SONY.w * k / 2)} ${r2((y + g.y - 3) / 2 - 50 * k)}) scale(${k})" fill="url(#vhs-silver)"/>
    <path d="${TRINITRON.d}" transform="translate(${r2(g.x + g.w / 2 - TRINITRON.w * kt / 2)} ${r2(g.y + g.h + 1.8 - 50 * kt)}) scale(${kt})" fill="none" stroke="#bdb8ae" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="${x + 2}" y1="${f.y - 1.5}" x2="${x + w - 2}" y2="${f.y - 1.5}" stroke="#8a857b" stroke-width=".3" opacity=".55"/>
    <rect x="${f.x - 0.6}" y="${f.y - 0.6}" width="${f.w + 1.2}" height="${f.h + 1.2}" rx="1" fill="#4c4944"/>
    <rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx=".7" fill="#030303"/>
    <rect class="vhs-lucka" x="${f.x + 0.5}" y="${f.y + 0.45}" width="${f.w - 1}" height="${f.h - 0.9}" rx=".4" fill="url(#vhs-lucka)"/>
    <rect x="${VFD.x}" y="${VFD.y}" width="${VFD.w}" height="${VFD.h}" rx=".6" fill="#06100d" stroke="#2c2a27" stroke-width=".3"/>
    <circle class="vhs-led" cx="${x + 2.6}" cy="${f.y + f.h / 2}" r=".62"/>
  </g>`;
  }
  function tvText() {
    const f = FACK;
    return `<text x="${f.x + f.w / 2}" y="${f.y + f.h + 2.4}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="1.3" letter-spacing=".4" fill="#8f8a80">HQ · STEREO</text>`;
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

  // Där man klickar på håll: tv:ns framsida, högra sidan och taket, och
  // lådans, en bildpunkt utanför dem.
  function hitYtor() {
    const L = LADA;
    const fram = (x, y, w, h, z) => `<i style="left:${px(x)}; top:${px(y)}; width:${px(w)}; height:${px(h)}; transform:translateZ(${r2(z * S + 1)}px)"></i>`;
    const sida = (x, y, h, z, d) => `<i style="left:${r2(x * S + 1)}px; top:${px(y)}; width:${px(d)}; height:${px(h)}; transform-origin:0 0; transform:translateZ(${px(z)}) rotateY(90deg)"></i>`;
    const tak = (x, y, w, z, d) => `<i style="left:${px(x)}; top:${r2((y - d) * S - 1)}px; width:${px(w)}; height:${px(d)}; transform-origin:0 100%; transform:translateZ(${px(z)}) rotateX(90deg)"></i>`;
    return fram(TV.x - 2, TV.y - 2, TV.w + 4, TV.h + 4, 0) + sida(TV.x + TV.w, TV.y, TV.h, 0, DJUP) + tak(TV.x, TV.y, TV.w, 0, DJUP) +
      fram(L.x - 1, L.y - 1, L.w + 2, L.h + 2, L.z) + sida(L.x + L.w, L.y, L.h, L.z, L.d) + tak(L.x, L.y, L.w, L.z, L.d);
  }

  // ---------- lådan ----------

  // En fruktlåda i furu på sidan, med öppningen mot gänget som tv:n.
  // Framsidan: brädorna runt öppningen, mellanväggen och en tejpbit över
  // varje fack med dagen (ladaText, fylls i av fill).
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
    ${board(L.x + MV.x, L.y + L.t - 0.3, MV.w, L.h - 2 * L.t + 0.6, 'vhs-ved-s')}
    <rect x="${L.x + MV.x}" y="${L.y + L.t}" width=".45" height="${L.h - 2 * L.t}" fill="#fff3d8" opacity=".3"/>
    ${nails}
    <polygon points="${pts([[L.x + 12, L.y + 0.45], [L.x + 38, L.y + 0.2], [L.x + 38.6, L.y + 1.4], [L.x + 37.9, L.y + 2.6], [L.x + 38.5, L.y + 4.2], [L.x + 12.2, L.y + 4.5], [L.x + 11.6, L.y + 3.1], [L.x + 12.3, L.y + 1.9]])}" fill="#e7dab2" opacity=".96" transform="rotate(-1.4 ${L.x + 25} ${L.y + 2.3})"/>
    <polygon points="${pts([[L.x + 53, L.y + 0.35], [L.x + 87, L.y + 0.5], [L.x + 87.6, L.y + 1.7], [L.x + 86.9, L.y + 2.8], [L.x + 87.5, L.y + 4.3], [L.x + 53.2, L.y + 4.4], [L.x + 52.6, L.y + 3], [L.x + 53.3, L.y + 1.8]])}" fill="#e7dab2" opacity=".96" transform="rotate(1.1 ${L.x + 70} ${L.y + 2.3})"/>
  </g>`;
  }
  function ladaText() {
    const L = LADA;
    const tejp = (cls, x, r) => `<text class="${cls}" x="${x}" y="${L.y + 3.6}" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="4.1" letter-spacing=".4" fill="#1d1a16" transform="rotate(${r} ${x} ${L.y + 2.3})"></text>`;
    return `<text x="${L.x + L.w / 2}" y="${L.y + L.h - 1.2}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="2.6" letter-spacing="1.2" fill="#9b2c1f" opacity=".5">ÄPPLEN · KLASS I</text>
    ${tejp('vhs-tejp-forra', L.x + 25, -1.4)}${tejp('vhs-tejp-nasta', L.x + 70, 1.1)}`;
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
    <linearGradient id="vhs-silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ebe8e1"/><stop offset=".55" stop-color="#c4bfb5"/><stop offset="1" stop-color="#99948a"/></linearGradient>
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
  // och taket, innanför öppningen vänstra väggen och mellanväggens högra
  // sida, botten och baksidan, och skuggan på disken.
  function ladaYtor() {
    const L = LADA;
    const [x0, y0, x1, y1] = [L.x + L.t, L.y + L.t, L.x + L.w - L.t, L.y + L.h - L.t].map((v) => v * S);
    const inne = (L.d - 1.5) * S;
    return golv('vhs-skugga', (L.x - 4) * S, (L.y + L.h) * S, (L.w + 8) * S, 4 * S, -(L.d + 4) * S) +
      yta('lada-bak', x0, y0, x1 - x0, y1 - y0, '0 0', `translateZ(${r2(-inne)}px)`) +
      yta('lada-vagg', x0, y0, inne, y1 - y0, '0 0', 'rotateY(90deg)') +
      yta('lada-vagg', (L.x + MV.x + MV.w) * S, y0, inne, y1 - y0, '0 0', 'rotateY(90deg)') +
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
  // diskens kant och fogar (diskfront i rum.js): större ju längre ut
  const kk = (x) => (x - 760) / 300;
  function vaggSvg() {
    const [a, z] = [1599.5, 2100];
    const r = `x="${a}" y="300" width="${z - a}" height="720"`;
    return `<svg class="vhs-vagg" viewBox="${a} 300 ${z - a} 720" aria-hidden="true">
    <rect ${r} fill="url(#rum-rwall)"/><rect ${r} filter="url(#rum-flack)" opacity=".55"/><rect ${r} fill="#000" opacity=".2"/>
    <polygon points="${a},${wl(a)} ${z},${wl(z)} ${z},${re(z)} ${a},${re(a)}" fill="#5b564c"/>
    <polygon points="${a},${re(a)} ${z},${re(z)} ${z},1020 ${a},1020" fill="#2a2019"/>
    <polygon points="${a},${re(a)} ${z},${re(z)} ${z},${re(z) + 2 * kk(z)} ${a},${re(a) + 2 * kk(a)}" fill="#aaa69c"/>
    <polygon points="${a},${re(a) + 2 * kk(a)} ${z},${re(z) + 2 * kk(z)} ${z},${re(z) + 4 * kk(z)} ${a},${re(a) + 4 * kk(a)}" fill="#403e3a"/>
    <line x1="2072" y1="${re(2072) + 4 * kk(2072)}" x2="2072" y2="1020" stroke="#120c08" stroke-opacity=".55" stroke-width="${1.3 * kk(2072)}"/>
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
    // knapparna, med tangenterna som gör samma sak nära (key i mount)
    const knappar = [['bak', '◀◀', 'Spola tillbaka', 'ArrowLeft'], ['spela', '▶', 'Spela', 'Space'], ['fram', '▶▶', 'Spola fram', 'ArrowRight'], ['stopp', '■', 'Stopp', 'S'], ['ut', '⏏', 'Mata ut']]
      .map(([k, t, l, tg], i) => `<button type="button" class="vhs-k" data-vhs="${k}" aria-label="${l}"${tg ? ` aria-keyshortcuts="${tg}"` : ''} style="${at({ x: KNAPP.x + i * KNAPP.d, y: KNAPP.y, w: KNAPP.w, h: KNAPP.h })}">${t}</button>`).join('');
    // en kassett: ryggen med etiketten (kupongnumret, matchen och
    // resultatet), och taket och ändarna bakåt
    const kas = (a, b) => Array.from({ length: b - a }, (_, i) => `<div class="vhs-band" data-i="${a + i}" hidden>` +
      `<button type="button" class="vhs-kas" data-i="${a + i}"><span class="lapp"><i></i><b></b><u></u></span></button>` +
      '<i class="kas-topp"></i><i class="kas-v"></i><i class="kas-h"></i></div>').join('');
    return `<div class="rum-vhs" id="rum-vhs" data-lage="tom" style="left:${O[0]}px; top:${O[1]}px">` +
      `<div class="vhs-in" style="perspective:${1000 * S}px; perspective-origin:${px(VP[0])} ${px(VP[1])}">` +
      '<i class="vhs-sken"></i>' +
      // kameran runt tv:ns mitt (SVANG)
      `<div class="vhs-kam" style="transform-origin:${px(MITT[0] + PLATS[0])} ${px(MITT[1])} ${px(MITT[2] + PLATS[1])}">` +
      `<div class="vhs-tv" style="transform:translate3d(${px(PLATS[0])}, 0px, ${px(PLATS[1])}) rotateY(${-VRID}deg); transform-origin:${px(MITT[0])} ${px(MITT[1])} ${px(MITT[2])}">${ytor()}` +
      `<div class="vhs-front">${tvRitning()}<div class="vhs-styr" inert>` +
      `<div class="vhs-skarm" style="${at(GLAS)}">` +
      `<div class="vhs-bild" style="top:${px(BILD.y - GLAS.y)}; height:${px(BILD.h)}"></div>` +
      '<div class="vhs-bla"></div><i class="vhs-brus"></i>' +
      // bildsökningen: brusränderna, och klippets tre bildrutor när klippet
      // självt inte kan visas
      `<div class="vhs-sok">${'<img alt="" referrerpolicy="no-referrer" hidden>'.repeat(3)}${'<i class="sok-rand"><i></i></i>'.repeat(2)}</div>` +
      `<i class="vhs-mask" style="top:${px(BILD.y - GLAS.y)}" hidden></i>` +
      // listan över kassetterna när ingen är i, i bilden
      `<div class="vhs-lista" style="top:${px(BILD.y - GLAS.y + 1.6)}; height:${px(BILD.h - 3.2)}" hidden><button type="button" class="ls-hd" aria-label="Byt sida"><span></span><span></span></button><ol></ol></div>` +
      // texten i bilden, så att den syns när bilden fyller fönstret:
      // läget och räkneverket uppe och bandmätaren nere
      `<span class="vhs-osd" style="top:${px(BILD.y - GLAS.y + 3)}">STOPP</span>` +
      `<span class="vhs-tid" style="top:${px(BILD.y - GLAS.y + 3)}">0:00:00</span>` +
      // (bandmätaren lika långt in nedifrån som bokstäverna uppifrån)
      `<span class="vhs-matare" style="bottom:${px(GLAS.y + GLAS.h - BILD.y - BILD.h + 4.6)}"><i></i></span><i class="vhs-glas"></i></div>` +
      `<span class="vhs-vfd" style="${at(VFD)}">12:00</span>${knappar}</div></div>` +
      // lådan bredvid
      `<div class="vhs-lada" style="transform:translateZ(${px(LADA.z)})">${ladaYtor()}${ladaRitning()}<div class="vhs-styr" inert>${kas(0, CAP)}</div></div>` +
      `<a class="vhs-hit rum-sak" href="#matcher" data-nav="video" aria-label="Videon">${hitYtor()}</a></div></div>` +
      '</div></div>';
  }

  // ---------- kassetterna ----------

  const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'numeric' });
  const fKey = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const dag = (iso) => {
    const p = Object.fromEntries(fDag.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return `${p.day}/${p.month}`;
  };
  const fVd = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short' });
  const hidden = (m) => Boolean(window.Spoiler && Spoiler.hidden(m));
  const harKlipp = (m) => Boolean(m && m.completed && m.y && m.y.length);
  const DYGN = 86400000;

  // Förra omgången och nästa, som matchernas id i kupongens ordning.
  // Omgången som gänget tippar (rd, round() i rum.js) är nästa så länge
  // ingen av dess matcher har börjat, och förra när någon har det. Den
  // andra är kupongen som spelades senast (old: historiken och kupongerna,
  // den vars sista match var senast) – eller efter förra de närmaste
  // matcherna i Premier League och Championship, efter den helgen.
  function omgangar(by, matches, rd, old, t) {
    const borjat = (ids) => ids.some((id) => {
      const m = by.get(id);
      return m && (m.completed || Date.parse(m.kickoff) <= t);
    });
    const sist = (ids) => Math.max(0, ...ids.map((id) => by.get(id)).filter(Boolean).map((m) => Date.parse(m.kickoff)));
    const ids = rd && rd.ids ? rd.ids.map(String) : [];
    const pagar = Boolean(rd && !rd.next && borjat(ids));
    let forra = pagar ? ids : [];
    let nasta = pagar ? [] : ids;
    if (!pagar) {
      const c = (old || []).map((x) => (x.rows || x.matches || []).map((r) => String(r.id)))
        .filter((l) => l.length && l.join() !== ids.join() && borjat(l))
        .sort((a, b) => sist(b) - sist(a))[0];
      if (c) forra = c;
    }
    if (!nasta.length) {
      const har = new Set(forra);
      const fran = Math.max(t, sist(forra) + 1.5 * DYGN);
      nasta = (matches || []).filter((m) => (m.comp === 'pl' || m.comp === 'ch') && !m.completed && !har.has(String(m.id)) && Date.parse(m.kickoff) > fran)
        .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff)).slice(0, FACKEN).map((m) => String(m.id));
    }
    return { forra: forra.slice(0, FACKEN), nasta };
  }

  // Kassetterna i facken (CAP platser, null där ingen står): förra
  // omgångens matcher på sina platser i kupongens ordning, och den senaste
  // matchen med klipp (högst tre veckor gammal) för lagen i nästa omgång,
  // match för match, som inte redan står till vänster.
  function valj(by, matches, forra, nasta, t) {
    const v = Array.from({ length: FACKEN }, (_, i) => (harKlipp(by.get(forra[i])) ? by.get(forra[i]) : null));
    const klara = (matches || []).filter((m) => harKlipp(m) && Date.parse(m.kickoff) > t - 21 * DYGN)
      .sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
    const har = new Set(v.filter(Boolean).map((m) => String(m.id)));
    const h = [];
    for (const n of nasta.map((id) => by.get(id)).filter(Boolean)) {
      for (const lag of [n.home, n.away]) {
        const m = klara.find((x) => x.home === lag || x.away === lag);
        if (!m || har.has(String(m.id)) || h.length >= FACKEN) continue;
        har.add(String(m.id));
        h.push(m);
      }
    }
    return [...v, ...Array.from({ length: FACKEN }, (_, i) => h[i] || null)];
  }

  // Dagen de flesta matcherna spelas, som på tejpen: LÖR 24/10.
  function dagen(ms, infor) {
    const n = {};
    for (const m of ms) {
      const d = fKey.format(new Date(m.kickoff));
      n[d] = n[d] || m;
      n[`#${d}`] = (n[`#${d}`] || 0) + 1;
    }
    const d = Object.keys(n).filter((k) => k[0] !== '#').sort((a, b) => n[`#${b}`] - n[`#${a}`] || a.localeCompare(b))[0];
    if (!d) return '';
    const k = n[d].kickoff;
    return `${infor ? 'INFÖR' : fVd.format(new Date(k)).replace('.', '').toUpperCase()} ${dag(k)}`;
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
  // börjat spela (eller spolats) – mätt till knappt fyra sekunder, med lite
  // marginal
  const FORVARM = 4400;
  // ◀◀ och ▶▶ spolar tills man trycker ▶ eller ■, fortare och fortare som
  // en riktig video: FART sekunder i sekunden i början, dubbelt så fort var
  // DUBBEL:e sekund och för varje nytt tryck åt samma håll (minst TRYCK ms
  // efter det förra, så att en nedtryckt tangent inte räknas), upp till MAX.
  // Farten ändras mjukt (TROG sekunder), så att bandet vänder och inte
  // hoppar. Räkneverket och bandmätaren står kvar i rutan EFTER ms när
  // klippet har kommit; bandmätaren har MATARE steg.
  const FART = 4;
  const DUBBEL = 1.5;
  const MAX = 64;
  const TROG = 0.25;
  const TRYCK = 120;
  const EFTER = 2500;
  const MATARE = 20;
  // Bildsökningen visar klippet självt: spelaren står på paus och hoppar dit
  // räkneverket är var HOPP:e ms. I paus kommer ingen rubrik, knapp eller
  // logga fram, bara bildrutan – fram och bak, hur fort det än går.
  const HOPP = 120;
  // i telefonen (som i rum-video.css): bara en spelare åt gången
  const TELEFON = matchMedia('(max-width: 700px), (max-height: 500px)');
  const YTIMG = 'https://i.ytimg.com/vi';

  // Bruset i bildsökningens ränder, en rad per bildlinje (randen är 40
  // bildpunkter hög, rutan har ungefär två linjer per bildpunkt): vita och
  // svarta streck av olika längd i grått brus, tätast mitt i randen och
  // glesare mot kanterna, där bilden syns igenom – ritat en gång, i en
  // liten duk.
  function randBrus() {
    const [w, h] = [512, 80];
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    let s = 7;
    const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) | 0) >>> 0) / 4294967296;
    for (let y = 0; y < h; y++) {
      const e = Math.sin(Math.PI * (y + 0.5) / h) ** 2;
      // linjen själv: ljusare eller mörkare, och olika tät
      const rad = 0.2 + rnd() * 0.5;
      let streck = 0;
      let ljus = 0;
      for (let x = 0; x < w; x++) {
        if (streck <= 0 && rnd() < 0.035 * e) {
          streck = 6 + rnd() * rnd() * 160;
          ljus = rnd() < 0.8 ? 0.8 + rnd() * 0.2 : 0.05;
        }
        const i = (y * w + x) * 4;
        const v = streck > 0 ? ljus : rad * (0.4 + rnd() * 0.9);
        const a = streck > 0 ? 0.35 + e * 0.65 : e * (0.15 + rnd() * 0.6);
        streck--;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255 * Math.min(1, v);
        img.data[i + 3] = 255 * Math.min(1, a);
      }
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function mount(root, o) {
    const box = root.querySelector('#rum-vhs');
    const inn = box.querySelector('.vhs-in');
    const kam = box.querySelector('.vhs-kam');
    const styr = [...box.querySelectorAll('.vhs-styr')];
    const bild = box.querySelector('.vhs-bild');
    const mask = box.querySelector('.vhs-mask');
    const osdEl = box.querySelector('.vhs-osd');
    const tidEl = box.querySelector('.vhs-tid');
    const matare = box.querySelector('.vhs-matare');
    const rutor = [...box.querySelectorAll('.vhs-sok img')];
    const vfd = box.querySelector('.vhs-vfd');
    // Tangenterna, med tangentbord och mus: nära står de i rummets fot
    // (rum-video.css) – rutan fyller fönstret och knapparna syns inte – och
    // knapparna säger sin när man pekar på dem, som sakerna i rummet (title).
    if (matchMedia('(hover: hover)').matches) {
      const fot = root.querySelector('.rum-ft');
      if (fot) fot.insertAdjacentHTML('afterbegin', '<span class="vhs-tangenter"><b>← →</b> spola · <b>mellanslag</b> spela · <b>S</b> stopp · <b>↑ ↓</b> kassett · <b>Esc</b> tillbaka</span>');
      const NAMN = { ArrowLeft: '←', ArrowRight: '→', Space: 'mellanslag', S: 'S' };
      for (const b of box.querySelectorAll('.vhs-k[aria-keyshortcuts]')) b.title = `${b.getAttribute('aria-label')} · ${NAMN[b.getAttribute('aria-keyshortcuts')]}`;
    }
    const lucka = box.querySelector('.vhs-lucka');
    const kas = [...box.querySelectorAll('.vhs-band')].sort((a, b) => a.dataset.i - b.dataset.i);
    const lista = box.querySelector('.vhs-lista');
    const tejp = [box.querySelector('.vhs-tejp-forra'), box.querySelector('.vhs-tejp-nasta')];
    // tapes: kassetternas matcher (CAP platser, null där ingen står); cur:
    // kassetten i videon (index), mid: dess match; near: kameran är framme,
    // tat: ännu närmare; resume: spela vidare när man kommer tillbaka;
    // forra: förra omgångens matcher i kupongens ordning (till listan),
    // dagar: tejpbitarnas text; sida och pek: listans sida (0 förra, 1
    // nästa) och den markerade kassetten
    const V = { tapes: [], key: '', cur: null, mid: null, near: false, tat: false, resume: false, lage: 'tom', forra: [], dagar: ['', ''], sida: 0, pek: null };
    // spelaren: klippen, vilket, meddelandenas id, ramen, tiden och läget;
    // dold: bilden täcks tills spelarens egna saker har tonat bort (varm);
    // mal: där bandet stannade (och spelar från), dur: klippets längd; vis,
    // fart och dir: räkneverket, farten och hållet medan den spolar (dir 0:
    // står), t0: när farten började öka, tryck: det senaste trycket; sok:
    // bildsökningens bildruta (requestAnimationFrame) och när den förra var,
    // efter: när räkneverket försvinner ur rutan; ren: spelarens egna saker
    // har tonat bort (och kommer inte fram i paus), hopp och hoppT: när och
    // dit spelaren hoppade senast i sökningen, still: den gamla spelaren med
    // sin stillbild ovanpå medan en ny värms upp (load)
    const P = { list: [], i: 0, seq: 0, frame: null, ready: false, ping: null, t: 0, st: -1, timer: 0, dold: true, varm: 0, mal: null, dur: 0, vis: 0, fart: 0, dir: 0, t0: 0, tryck: 0, sok: 0, sokT: 0, efter: 0, ren: false, hopp: 0, hoppT: null, still: null };

    function lage(l, text) {
      V.lage = l;
      box.dataset.lage = l;
      if (text != null) osdEl.textContent = text;
      if (l !== 'spolar' && P.sok) {
        cancelAnimationFrame(P.sok);
        P.sok = 0;
      }
      if (l === 'tom') visaLista();
    }

    // I telefonen på höjden går kameran fram till lådan, annars till tv:n
    // och lådan.
    const smal = () => innerWidth < 700 && innerWidth < innerHeight;
    const nara = () => (smal() ? LADAN : FOCUS);

    // ---------- listan i rutan ----------

    // När ingen kassett är i: ett fack i taget, förra omgången med
    // kupongens nummer (raderna utan klipp svaga) och nästa, och den
    // markerade kassetten i vitt. Ett klick på en rad spelar den, och på
    // rubriken byter sidan.
    const fack = (i) => (i < FACKEN ? 0 : 1);
    const ord = (n) => o.kort(n).toUpperCase();
    const sidor = () => [V.forra.length > 0, V.tapes.slice(FACKEN).some(Boolean)];
    function visaLista() {
      const s = sidor();
      lista.hidden = !s[0] && !s[1];
      box.classList.toggle('har-lista', !lista.hidden);
      if (lista.hidden) return;
      if (!s[V.sida]) V.sida = 1 - V.sida;
      if (V.pek == null || !V.tapes[V.pek] || fack(V.pek) !== V.sida) V.pek = V.tapes.findIndex((m, i) => m && fack(i) === V.sida);
      if (V.pek < 0) V.pek = null;
      const rad = (m, i, nr) => {
        const res = m.score && !hidden(m) ? `${m.score.home}–${m.score.away}` : '';
        const a = i == null ? ' class="ingen"' : `data-rad="${i}"${i === V.pek ? ' class="pek"' : ''}`;
        return `<li ${a.trim()}><b>${nr || ''}</b><span>${ord(m.home)}–${ord(m.away)}</span><i>${res}</i></li>`;
      };
      const rader = V.sida === 0
        ? V.forra.map((m, i) => (m ? rad(m, V.tapes[i] ? i : null, i + 1) : ''))
        : V.tapes.slice(FACKEN).map((m, j) => (m ? rad(m, FACKEN + j) : '')).filter(Boolean);
      const [hd, sid] = lista.querySelectorAll('.ls-hd span');
      hd.textContent = V.dagar[V.sida];
      sid.textContent = s[0] && s[1] ? (V.sida ? '◀ 2/2' : '1/2 ▶') : '';
      const ol = lista.querySelector('ol');
      const html = rader.join('');
      if (ol.innerHTML !== html) ol.innerHTML = html;
    }
    function blad(d) {
      const s = Math.min(1, Math.max(0, V.sida + d));
      if (s === V.sida || !sidor()[s]) return;
      V.sida = s;
      V.pek = null;
      visaLista();
    }
    // ↑/↓ i listan: nästa eller förra kassetten på sidan
    function peka(d) {
      const ix = V.tapes.map((m, i) => (m && fack(i) === V.sida ? i : -1)).filter((i) => i >= 0);
      if (!ix.length) return;
      const j = ix.indexOf(V.pek);
      V.pek = ix[j < 0 ? 0 : Math.min(ix.length - 1, Math.max(0, j + d))];
      visaLista();
    }

    // ---------- lådan ----------

    // Kassetterna nerifrån och upp i varje fack; den som är i videon lämnar
    // en lucka som de ovanför sjunker ner i, men har kvar sin plats att
    // komma tillbaka till.
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
          // lite innanför öppningen och lutade
          const t = `translateZ(${-S}px) rotate(${r}deg)`;
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
      const label = name.length <= 15 ? name : `${o.kort(m.home)}–${o.kort(m.away)}`;
      const v = Math.floor(hash(m.id) * VARIANTS);
      // förra omgångens kassetter har kupongens nummer
      const i = Number(el.dataset.i);
      const nr = i < FACKEN ? String(i + 1) : '';
      el.className = `vhs-band v${v}${nr ? ' har-nr' : ''}${el.classList.contains('inne') ? ' inne' : ''}`;
      el.style.setProperty('--blk', INK[Math.floor(hash(`b${m.id}`) * INK.length)]);
      el.style.setProperty('--lr', `${r2((hash(`l${m.id}`) - 0.5) * 1.6)}deg`);
      el.querySelector('.lapp i').textContent = nr;
      el.querySelector('.lapp b').textContent = label;
      el.querySelector('.lapp u').textContent = score;
      el.querySelector('.vhs-kas').setAttribute('aria-label', `${nr ? `${nr}. ` : ''}${m.home} – ${m.away}${score ? `, ${score}` : ''}, ${dag(m.kickoff)}`);
      el.dataset.passa = '';
    }

    // Etiketten så stor som den får plats, högst FS bildpunkter: texten mäts
    // i en duk (bråkdelar av bildpunkter, som webbläsaren när den kortar)
    // mot lappens bredd, när lådan syns (fill, zoom, skarp) – utan lappens
    // kanter (7 + 7), numret (24 − 4 + 5), mellanrummet före resultatet (5)
    // och 2 till godo. Resultatet kortas aldrig, namnet hellre.
    const FS = 20;
    const duk = document.createElement('canvas').getContext('2d');
    const bredd = (t, f, fam) => {
      duk.font = `400 ${f}px ${fam}`;
      return duk.measureText(t).width - 0.4 * t.length;
    };
    function passa() {
      for (const el of kas) {
        if (el.hidden || el.dataset.passa == null) continue;
        const lapp = el.querySelector('.lapp');
        if (!lapp.clientWidth) continue;
        const [b, u] = [lapp.querySelector('b'), lapp.querySelector('u')];
        const fam = getComputedStyle(b).fontFamily;
        const ledigt = lapp.clientWidth - 14 - (el.classList.contains('har-nr') ? 25 : 0) - (u.textContent ? 5 : 0) - 2;
        let f = FS;
        while (f > 11 && bredd(b.textContent, f, fam) + bredd(u.textContent, f, fam) > ledigt) f--;
        el.style.setProperty('--fs', `${f}px`);
        delete el.dataset.passa;
      }
    }
    if (document.fonts) document.fonts.load('20px "Special Elite"').then(() => { for (const el of kas) el.dataset.passa = ''; passa(); }, () => {});

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
      P.dir = 0;
      P.ren = false;
      P.still = null;
      cancelAnimationFrame(P.sok);
      P.sok = 0;
      clearTimeout(P.efter);
      box.classList.remove('vhs-efter', 'vhs-fort', 'vhs-ram');
      bild.replaceChildren();
    }

    const cmd = (func, args = []) => {
      if (P.frame && P.frame.contentWindow) P.frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args, id: P.seq, channel: 'widget' }), HOST);
    };
    const listen = (f, id) => f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), HOST);

    // Bildsökningens bilder: YouTubes tre bildrutor ur klippet, ungefär en
    // fjärdedel, hälften och tre fjärdedelar in – i 4:3 med svarta kanter,
    // som klippet i rutan. Finns ingen ger YouTube en grå bild i 120 × 90.
    function ramar(id) {
      rutor.forEach((img, n) => {
        img.hidden = true;
        img.dataset.ok = '';
        img.onload = () => { img.dataset.ok = img.naturalWidth > 120 ? '1' : ''; };
        img.onerror = () => { img.dataset.ok = ''; };
        img.src = `${YTIMG}/${encodeURIComponent(id)}/hq${n + 1}.jpg`;
      });
    }

    // Klippet P.list[P.i] från sekund start, i rutan – utan ljud och bakom
    // videons blå bild tills spelarens egna saker har tonat bort (varm).
    // kvar: efter en sökning står den gamla spelaren kvar ovanpå med sin
    // stillbild (.still) i stället för den blå bilden, tills den nya kommer.
    function load(start, kvar) {
      if (kvar && P.frame) {
        clearTimeout(P.ping);
        clearTimeout(P.timer);
        clearTimeout(P.varm);
        P.varm = 0;
        P.seq++;
        P.ready = false;
        P.st = -1;
        P.dold = true;
        P.ren = false;
        P.still = P.frame;
        P.still.classList.add('still');
      } else {
        stopPlayer();
        ramar(P.list[P.i]);
        lage('laddar', '▶ SPELA');
      }
      const seq = P.seq;
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
      bild.append(f);
      // svarar inte spelaren alls visas det som finns i rutan
      P.timer = setTimeout(() => {
        if (seq !== P.seq || P.ready || !['laddar', 'spolar'].includes(V.lage)) return;
        slapp();
        lage('spelar');
      }, 12000);
    }

    // Den gamla spelaren bort, när den nya har kommit.
    function slapp() {
      if (P.still) P.still.remove();
      P.still = null;
    }

    // spolar den (och bandet rullar)
    const rullar = () => V.lage === 'spolar' && P.dir !== 0;

    // Bilden fram och ljudet på, när klippet har spelat en stund – inte
    // medan den spolar eller står på stopp.
    function varm() {
      if (P.varm || !P.dold) return;
      P.varm = setTimeout(() => {
        P.varm = 0;
        if (P.st !== 1 || rullar() || V.lage === 'stopp') return;
        const sokte = V.lage === 'spolar';
        P.dold = false;
        P.ren = true;
        P.mal = null;
        cmd('unloadModule', ['captions']);
        cmd('unMute');
        slapp();
        lage('spelar');
        if (sokte) efter();
        tick();
      }, FORVARM);
    }

    // Efter en sökning står räkneverket och bandmätaren kvar en stund när
    // klippet har kommit, med ▶, och räknar vidare.
    function efter() {
      clearTimeout(P.efter);
      osdEl.textContent = '▶';
      box.classList.add('vhs-efter');
      P.efter = setTimeout(() => box.classList.remove('vhs-efter'), EFTER);
    }

    // Spela vidare efter en paus eller ett stopp: bakom den blå bilden (efter
    // en sökning stillbilden), tillbaka så mycket som spelarens egna saker
    // syns.
    function resume() {
      if (!P.frame) return;
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      P.ren = false;
      if (V.lage !== 'spolar') lage('laddar', '▶ SPELA');
      cmd('mute');
      cmd('seekTo', [Math.max(0, (P.mal ?? P.t) - FORVARM / 1000), true]);
      cmd('playVideo');
      // spelar den redan kommer inget nytt läge från spelaren
      if (P.st === 1) varm();
      tick();
    }

    // ▶ efter en sökning (eller tillbaka efter att ha gått därifrån mitt i
    // en): spelaren kan inte börja spela utan att visa sina saker, så med
    // klippets egna bilder står stillbilden kvar ovanpå medan en ny spelare
    // värms upp bakom den (load med kvar), eller den som redan gör det. I
    // telefonen, där två spelare tar för mycket minne, och efter YouTubes
    // bildrutor spelar samma spelare bakom bildrutan.
    function spelaHar() {
      if (P.still) resume();
      else if (box.classList.contains('vhs-ram') && !TELEFON.matches) load(P.mal, true);
      else {
        box.classList.remove('vhs-ram');
        resume();
      }
    }

    // ◀◀ och ▶▶: spolar med bildsökningen i rutan, fortare och fortare, tills
    // man trycker ▶ (spelar därifrån) eller ■, eller bandet tar slut. Ett nytt
    // tryck åt samma håll spolar dubbelt så fort, och åt andra hållet vänder
    // den. Spelaren står på paus och hoppar med räkneverket (sok) – har den
    // börjat spela nyss syns dess saker kanske än, och då visar rutan
    // YouTubes bildrutor i stället (utan .vhs-ram).
    function spola(d) {
      if (!P.frame || !P.ready || P.st === 0) return;
      const nu = performance.now();
      if (rullar()) {
        if (d !== P.dir) {
          P.dir = d;
          P.t0 = nu;
        } else if (nu - P.tryck >= TRYCK) P.t0 -= DUBBEL * 1000;
        P.tryck = nu;
        return;
      }
      // från där bilden är, där den stannade eller där den spolade till
      if (V.lage !== 'spolar') P.vis = P.mal ?? P.t;
      P.fart = 0;
      P.dir = d;
      P.t0 = nu;
      P.tryck = nu;
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      clearTimeout(P.efter);
      box.classList.remove('vhs-efter');
      if (!box.style.getPropertyValue('--sok-brus')) box.style.setProperty('--sok-brus', `url(${randBrus()})`);
      // den nya spelaren bakom stillbilden har inte kommit fram än
      slapp();
      box.classList.toggle('vhs-ram', P.ren);
      P.hoppT = null;
      lage('spolar', d > 0 ? '▶▶' : '◀◀');
      box.dataset.sok = d > 0 ? 'fram' : 'bak';
      cmd('mute');
      cmd('pauseVideo');
      ruta(P.vis);
      if (!P.sok) {
        P.sokT = nu;
        P.sok = requestAnimationFrame(sok);
      }
      tick();
    }

    // En bildruta i bildsökningen: farten ökar (och vänder mjukt),
    // räkneverket rullar, spelaren hoppar dit (var HOPP:e ms; annars visas
    // YouTubes bildruta närmast), och ränderna rullar nedåt framåt och uppåt
    // bakåt – fortare när den spolar fort. I början och slutet av bandet
    // stannar den.
    function sok(now) {
      P.sok = 0;
      if (!rullar()) return;
      const dt = Math.min(0.05, (now - P.sokT) / 1000);
      P.sokT = now;
      const mal = P.dir * Math.min(MAX, FART * 2 ** ((now - P.t0) / 1000 / DUBBEL));
      P.fart += (mal - P.fart) * (1 - Math.exp(-dt / TROG));
      P.vis += P.fart * dt;
      const slut = P.dur ? Math.max(0, P.dur - 1) : Infinity;
      if ((P.fart < 0 && P.vis <= 0) || (P.fart > 0 && P.vis >= slut)) {
        P.vis = Math.min(Math.max(0, P.vis), slut);
        stopp();
        return;
      }
      const sk = P.fart >= 0 ? 'fram' : 'bak';
      if (box.dataset.sok !== sk) {
        box.dataset.sok = sk;
        osdEl.textContent = sk === 'fram' ? '▶▶' : '◀◀';
      }
      box.classList.toggle('vhs-fort', Math.abs(P.fart) > 16);
      ruta(P.vis);
      if (now - P.hopp >= HOPP && (P.hoppT == null || Math.abs(P.vis - P.hoppT) >= 0.2)) hoppa();
      tick();
      P.sok = requestAnimationFrame(sok);
    }

    // Spelaren (på paus) till räkneverket, när rutan visar den.
    function hoppa() {
      if (!box.classList.contains('vhs-ram')) return;
      P.hopp = performance.now();
      P.hoppT = P.vis;
      cmd('seekTo', [P.vis, true]);
    }

    // Bandet stannar där räkneverket är: stillbilden, som darrar, med ▶.
    function landa() {
      P.mal = P.vis;
      P.dir = 0;
      P.fart = 0;
      box.dataset.sok = 'stilla';
      box.classList.remove('vhs-fort');
      osdEl.textContent = '▶';
      ruta(P.vis);
      hoppa();
      tick();
    }

    // ■: bandet står där det är, bakom den blå bilden med STOPP, räkneverket
    // och bandmätaren; ▶ spelar därifrån.
    function stopp() {
      if (V.cur == null || !P.frame || ['tom', 'brus', 'stopp'].includes(V.lage)) return;
      P.mal = V.lage === 'spolar' ? P.vis : P.mal ?? P.t;
      P.dir = 0;
      P.fart = 0;
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      clearTimeout(P.efter);
      box.classList.remove('vhs-efter', 'vhs-fort');
      cmd('pauseVideo');
      lage('stopp', 'STOPP');
      tick();
    }

    // Klippets bildruta närmast sekund s (en av de tre som finns).
    function ruta(s) {
      const p = P.dur ? s / P.dur : 0;
      const n = p < 0.375 ? 0 : p < 0.625 ? 1 : 2;
      const ok = [n, n - 1, n + 1, n - 2, n + 2].find((j) => rutor[j] && rutor[j].dataset.ok);
      rutor.forEach((img, j) => {
        if (img.hidden !== (j !== ok)) img.hidden = j !== ok;
      });
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
        // spolar den eller står på stopp står spelaren still
        if (rullar() || V.lage === 'stopp') cmd('pauseVideo');
        // gick man därifrån medan den laddade: paus tills man kommer tillbaka
        else if (!V.near) {
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

    // Displayen: 12:00 som blinkar när ingen kassett är i, annars tiden
    // (räkneverket medan den spolar). I rutan räkneverket och bandmätaren
    // medan den spolar och står på stopp, och en stund efter en sökning.
    const clock = (s) => {
      const t = Math.max(0, Math.floor(s));
      return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    };
    function tick() {
      const soker = V.lage === 'spolar';
      const s = soker ? P.vis : P.mal ?? P.t;
      const sym = soker ? osdEl.textContent : V.lage === 'stopp' ? '■' : P.st === 2 ? '❚❚' : '▶';
      const txt = V.cur == null && V.mid == null ? '12:00' : `${sym} ${clock(s)}`;
      if (vfd.textContent !== txt) vfd.textContent = txt;
      vfd.classList.toggle('blink', txt === '12:00');
      if (!soker && V.lage !== 'stopp' && !box.classList.contains('vhs-efter')) return;
      const t = clock(s);
      if (tidEl.textContent !== t) tidEl.textContent = t;
      matare.hidden = !P.dur;
      const n = String(Math.max(1, Math.ceil(Math.min(1, s / (P.dur || 1)) * MATARE)));
      if (matare.style.getPropertyValue('--n') !== n) matare.style.setProperty('--n', n);
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
      V.sida = fack(i);
      V.pek = i;
      lage('laddar', '▶ SPELA');
      // i telefonen syns inte rutan från lådan: kameran går dit
      if (smal()) tat(true);
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

    // ▶: spelar eller pausar – och medan den spolar spelar den därifrån;
    // utan kassett spelar den den som är markerad i listan
    function toggle() {
      if (V.cur == null) {
        const i = V.pek ?? V.tapes.findIndex(Boolean);
        if (i >= 0) insert(i);
      } else if (V.lage === 'spolar') {
        if (rullar()) {
          landa();
          spelaHar();
        }
      } else if (P.st === 1 && V.lage !== 'stopp') cmd('pauseVideo');
      else if (P.frame) resume();
      else start(V.tapes[V.cur]);
    }

    // ↑/↓: nästa eller förra kassetten – utan kassett i listan
    function step(d) {
      if (V.cur == null) {
        peka(d);
        return;
      }
      let j = V.cur + d;
      while (j >= 0 && j < V.tapes.length && !V.tapes[j]) j += d;
      if (V.tapes[j]) insert(j);
    }

    // Närmare: rutan fyller bilden; ett klick på rutan till
    // och man går tillbaka till tv:n och lådan.
    // Hörnet ritas i halva storleken, och i hela när rutan fyller bilden
    // (.skarp, rum-video.css; tat) – i telefonen på höjden också vid lådan,
    // där etiketterna ska gå att läsa. zoom ändrar också måtten i
    // övergångarna, så det byts med övergångarna avstängda, när inget rör sig,
    // och etiketterna mäts om.
    function skarp(on) {
      if (inn.classList.contains('skarp') === on) return;
      inn.classList.add('byt');
      inn.classList.toggle('skarp', on);
      void inn.offsetWidth;
      inn.classList.remove('byt');
      for (const el of kas) el.dataset.passa = '';
      passa();
    }

    // Kameran runt tv:n (SVANG s, null på håll), samtidigt som rummet vrids,
    // och ögat dit kameran går.
    function sving(s) {
      const oga = (s && s.oga) || VP;
      for (const e of [kam, inn]) e.classList.toggle('glid', !o.calm());
      kam.style.transform = `rotateY(${s ? s.horn : 0}deg)`;
      inn.style.perspectiveOrigin = `${px(oga[0])} ${px(oga[1])}`;
    }

    function tat(on) {
      if (!V.near || on === V.tat) return;
      V.tat = on;
      // hörnet ritas skarpt bara här, där rutan fyller bilden: innan
      // kameran går fram, och i halva storleken igen när den har gått
      // tillbaka (i telefonen på höjden inte, vid lådan)
      clearTimeout(V.skarpT);
      if (on) skarp(true);
      else V.skarpT = setTimeout(() => { if (!V.tat && !smal()) skarp(false); }, 900);
      box.classList.toggle('vhs-tat', on);
      sving(on ? SVANG.tat : SVANG.nara);
      if (o.aim) o.aim(on ? TAT : nara());
    }

    box.addEventListener('click', (e) => {
      if (!V.near) return;
      const b = e.target.closest('.vhs-kas, [data-vhs]');
      if (!b) {
        // i listan: en rad spelar, rubriken byter sida
        const r = e.target.closest('[data-rad]');
        if (r) insert(Number(r.dataset.rad));
        else if (e.target.closest('.ls-hd')) blad(V.sida ? -1 : 1);
        else if (e.target.closest('.vhs-skarm')) tat(!V.tat);
        // i telefonen syns bara kanten av tv:n bredvid lådan
        else if (smal() && e.target.closest('.vhs-tv')) tat(true);
        return;
      }
      e.preventDefault();
      // med musen: mellanslaget ska spela, inte trycka på knappen igen
      if (e.detail) b.blur();
      if (b.classList.contains('vhs-kas')) insert(Number(b.dataset.i));
      else if (b.dataset.vhs === 'spela') toggle();
      else if (b.dataset.vhs === 'stopp') stopp();
      else if (b.dataset.vhs === 'ut') eject();
      // utan kassett byter ◀◀ och ▶▶ sida i listan
      else if (V.cur == null) blad(b.dataset.vhs === 'fram' ? 1 : -1);
      else spola(b.dataset.vhs === 'fram' ? 1 : -1);
    });
    // musen över en rad i listan markerar den
    lista.addEventListener('pointerover', (e) => {
      const r = e.target.closest('[data-rad]');
      if (!r || Number(r.dataset.rad) === V.pek) return;
      V.pek = Number(r.dataset.rad);
      for (const li of lista.querySelectorAll('li')) li.classList.toggle('pek', li === r);
    });
    // hjulet: framåt närmare, bakåt tillbaka till tv:n och lådan
    box.addEventListener('wheel', (e) => {
      if (!V.near || Math.abs(e.deltaY) < 2) return;
      e.preventDefault();
      tat(e.deltaY < 0);
    }, { passive: false });

    tick();

    return {
      fill(matches, r = {}) {
        const t = Date.now();
        const by = new Map((matches || []).map((m) => [String(m.id), m]));
        const { forra, nasta } = omgangar(by, matches, r.rd, r.old, t);
        const list = valj(by, matches, forra, nasta, t);
        const fm = forra.map((id) => by.get(id) || null);
        const dagar = [dagen(fm.filter(Boolean), false), dagen(nasta.map((id) => by.get(id)).filter(Boolean), true)];
        const id = (m) => (m ? `${m.id}:${hidden(m) ? '?' : m.score ? `${m.score.home}-${m.score.away}` : ''}` : '-');
        const key = `${list.map(id).join()}|${fm.map(id).join()}|${dagar.join()}`;
        if (key === V.key) return;
        V.key = key;
        V.tapes = list;
        V.forra = fm;
        V.dagar = dagar;
        tejp.forEach((e, i) => { if (e) e.textContent = dagar[i]; });
        kas.forEach((el, i) => {
          el.hidden = !list[i];
          if (list[i]) paint(el, list[i]);
        });
        // kassetten i videon kan ha fått en annan plats
        if (V.mid != null) {
          const j = list.findIndex((m) => m && m.id === V.mid);
          V.cur = j >= 0 ? j : null;
          const m = list[j];
          if (m) mask.hidden = !hidden(m);
        }
        layout();
        if (V.lage === 'tom') visaLista();
        passa();
      },
      skarp,
      // Nära: kassetterna och knapparna går att trycka på, och videon spelar
      // vidare om den gjorde det när man gick. Svarar med hörnet i scenen.
      zoom(on) {
        V.near = on;
        V.tat = false;
        box.classList.remove('vhs-tat');
        sving(on ? SVANG.nara : null);
        for (const s of styr) s.inert = !on;
        // spolar den stannar bandet, och det spelar därifrån när man kommer tillbaka
        if (!on && rullar()) {
          landa();
          V.resume = true;
        } else if (!on && P.frame && P.st !== 2 && P.st !== 0) {
          cmd('pauseVideo');
          V.resume = true;
        } else if (on && V.resume) {
          V.resume = false;
          if (V.lage === 'spolar') spelaHar();
          else resume();
        }
        if (on && smal()) skarp(true);
        else if (on) passa();
        return nara();
      },
      // När man är framme: ←/→ (och ett svep i telefonen) spolar som ◀◀ och
      // ▶▶ – utan kassett byter de sida i listan – mellanslaget spelar och
      // pausar som ▶, S stoppar som ■, ↑/↓ byter kassett (i listan) och Esc
      // går tillbaka från rutan till tv:n och lådan.
      key(k) {
        if (k === 'ArrowRight' || k === 'ArrowLeft') {
          if (V.cur == null) blad(k === 'ArrowRight' ? 1 : -1);
          else spola(k === 'ArrowRight' ? 1 : -1);
        } else if (k === ' ') {
          // på en knapp (med tabben) trycker mellanslaget på knappen
          const a = document.activeElement;
          if (a && box.contains(a) && a.matches('button')) return false;
          toggle();
        } else if (k === 's' || k === 'S') stopp();
        else if (k === 'ArrowDown') step(1);
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
