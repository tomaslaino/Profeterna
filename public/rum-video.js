'use strict';

// Videon i tobaksaffären (rum.js): en liten Sony-tv med inbyggd video som
// står på disken, nere i hörnet till höger, med ryggen mot väggen och
// rutan vänd mot gänget mitt i rummet. Bredvid står repriserna på VHS i en
// fruktlåda med två fack, med öppningen åt samma håll. När man går fram
// (klick eller V) står de kvar som de står, och kameran svänger runt tv:n
// så att man ser rutan snett framifrån (SVANG) – närmare rutan rakt
// framifrån, i rummet runt tv:n (väggen och disken i 3D, rumYtor), så att det
// är kameran som vrids och inte tv:n. Kassetterna har maskinskrivna
// etiketter; ett klick på en kassett och den åker in i videon, som spelar
// matchens höjdpunkter i rutan (samma klipp som spelaren på sajten,
// hojdpunkter.js).
//
// Knapparna i spalten till höger om rutan, ◀◀ ▶ ▶▶ ❚❚ ■ ⏏, gör det de gör på en
// riktig video (de går att nå också när bilden är inzoomad, TAT):
//
//              ▶            ❚❚        ◀◀ ▶▶                ■       ⏏
//   stopp      spelar       –         spolar (blå bild)    –       matas ut
//   spelar     –            paus      söker i bilden       stopp   stopp, ut
//   paus       spelar       spelar    söker i bilden       stopp   stopp, ut
//   söker      spelar       paus      fortare (eller vänd) stopp   stopp, ut
//   spolar     spelar       –         vänder               stopp   stopp, ut
//
// Bandet (bandet()) är det som bestämmer: spelaren följer efter. När bandet
// tar slut spolar videon tillbaka av sig själv och stannar på 0:00:00. En
// kassett står kvar där den var när den matades ut, och efter fem minuter i
// paus går videon till stopp. ▶ från paus och sökning spelar direkt; från stopp
// går den över en kort blå bild med ▶ SPELA, när bandet ska ut ur kassetten.
// Nära styrs den också med tangenterna (←/→, mellanslaget och S), som står i
// rummets fot där. Ett klick på rutan (eller hjulet) går ännu närmare, så att
// bilden i rutan fyller fönstret.
// Går man därifrån pausar videon, och den spelar vidare när man kommer
// tillbaka. När inget spelar blinkar klockan på 12:00, som den alltid gjort.
//
// I telefonen spelas en kassett alltid med rutan i hela fönstret, och
// spelaren finns bara medan man står nära (parkera). I WebKit (Safari, och alla
// webbläsare i iPhone) spelar klippet utan ljud tills någon trycker (gest), och
// nästa klipp byts i samma spelare, som då har fått lov (load). Nära videon
// tas det bort som inte syns, så att WebKit håller sig under 1 GB (lattVideo
// i rum.js, utanLada här).
//
// Tv:n är en låda i CSS 3D (framsidan, sidorna, taket och skuggan på
// disken) i rummets eget perspektiv – 1000 bildpunkter från flyktpunkten
// (760, 400), som högra väggen i rum.js (rum-hv) – så att den står mot
// väggen som om den var målad dit. Fruktlådan och kassetterna är också
// lådor, i tv:ns mått.
//
// YouTube syns inte: spelaren får inte musen och har inga egna knappar. Dess
// rubrik, logga och förslag är lika stora hur stor spelaren än är, så den ritas
// i 2880 × 1620 och förminskas, en bit större än bilden: de hamnar i kanten
// som skärs bort, som på en gammal tv. Kvar är dess lilla knapp i mitten, och
// den täcks av videons ▶ (.vhs-mitt) så länge den syns, några sekunder efter
// ett tryck, som texten i rutan på en riktig video (dolj). Textningen stängs av.
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
// RumVideo.html('horn' | 'vagg' | 'pult', { disk }) → delarna (planen -598, -600 och -60 i rum.js;
// disk ritar bardisken i väggen)
// RumVideo.mount(el, { calm, short, kort, aim, latt }) → { fill(matches, { rd, old }), skarp(on), spelare(), zoom(on) → hörnet i scenen, key(k), stop() }
// (rd: omgången som gänget tippar, round() i rum.js; old: de färdigspelade kupongerna, Historik.coupons())
// aim(f) flyttar kameran till f (med f.z som största förstoring) när man går närmare tv:n,
// latt() säger till när en spelare har kommit till; spelare() säger om det finns någon.

window.RumVideo = (() => {
  // sex gånger storleken; hörnets övre vänstra hörn i scenen och dess mått
  const S = 6;
  const O = [1446, 494];
  const VP = [760 - O[0], 400 - O[1]];
  const TZ = 'Europe/Stockholm';
  // WebKit (Safari, och alla webbläsare i iPhone), som i rum.js
  const WEBKIT = !navigator.userAgentData && /AppleWebKit/.test(navigator.userAgent);
  const r2 = (x) => Math.round(x * 100) / 100;
  const pts = (list) => list.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');

  // Måtten i hörnets enheter (scenens pixlar från O): tv:ns front, rutan,
  // kassettfacket, displayen, spalten med knapparna, lådans front och kassetterna.
  const TV = { x: 31, y: 41, w: 84.8, h: 75 };
  const GLAS = { x: 37, y: 47, w: 67, h: 50.25 };
  // den 16:9-stora bilden mitt i den 4:3-stora rutan
  const BILD = { x: GLAS.x, y: GLAS.y + (GLAS.h - GLAS.w * 9 / 16) / 2, w: GLAS.w, h: GLAS.w * 9 / 16 };
  const FACK = { x: 36, y: 103.2, w: 43, h: 6.6 };
  const VFD = { x: 87.4, y: 103.9, w: 27, h: 5.2 };
  // Spalten till höger om rutan, lika hög som rutans ram. Knapparna står inom
  // bildens höjd (BILD), mitt för den, så att de syns när bilden är inzoomad
  // också i ett brett fönster (TAT), och så tätt (d, från en knapp till nästa)
  // att ⏏ går fri från Tillbaka i ett lågt fönster.
  const SPALT = { x: 108, y: GLAS.y - 3, w: 6.4, h: GLAS.h + 6 };
  const KNAPP = { x: 108.9, y: 56.425, w: 4.6, h: 4.4, d: 5.4 };
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
  // det nya hållet. Tv:n och lådan står som de står. Närmare rutan syns
  // väggen och disken runt dem i hörnet (rumYtor), så att de svänger med. Rakt framifrån är
  // VRID grader runt, så att rutan står parallellt med bilden, med ögat
  // (perspektivets mitt, oga) flyttat från VP till rakt framför rutan:
  // kameran går fram och förstorar en del av bilden, och vänd mot VP blev
  // rutan sned som i kanten av ett vidvinkelfoto, och från VP skymde lådan
  // rutans vänstra kant. Nära går hörnet längre runt än rummet (som inte går att
  // vrida hur långt som helst, då kommer gänget och radion in i bild), så att
  // etiketterna står mer framifrån och går att läsa. Lådans bortre ände kommer
  // då mot en, så hörnet flyttas upp (lyft) tills lådan står på disken igen.
  const SVANG = { nara: { rum: 34, horn: 46, lyft: 12 }, tat: { rum: 34, horn: VRID, oga: [GLAS.x + GLAS.w / 2 + PLATS[0], GLAS.y + GLAS.h / 2] } };
  // Var en punkt på tv:n eller lådan (i tv:ns mått, z framåt från tv:ns
  // front) syns i hörnet: vriden kring MITT, flyttad till PLATS och i
  // rummets perspektiv, med kameran där s säger (SVANG). ruta: det minsta i
  // scenen som rymmer punkterna, med kanten k.
  function syns([x, y, z], s = {}) {
    const e = s.oga || VP;
    const a = RAD - (s.horn || 0) * Math.PI / 180;
    const [dx, dz] = [x - MITT[0], z - MITT[2]];
    const wx = MITT[0] + PLATS[0] + dx * Math.cos(a) - dz * Math.sin(a);
    const wz = MITT[2] + PLATS[1] + dx * Math.sin(a) + dz * Math.cos(a);
    const f = 1000 / (1000 - wz);
    return [e[0] + (wx - e[0]) * f, e[1] + (y - (s.lyft || 0) - e[1]) * f];
  }
  const horn = (x0, y0, x1, y1, z0, z1) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => [x, y, z])));
  function ruta(p, k, s) {
    const q = p.map((a) => syns(a, s));
    const xs = q.map((a) => a[0]);
    const ys = q.map((a) => a[1]);
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
  // det kameran ska få med: tv:ns och lådans framsidor (utan sidorna, som bara
  // tar plats från etiketterna) – i telefonen på höjden bara lådans
  // (LADAN), och närmare bilden i rutan och spalten med knapparna, som
  // fyller fönstret (fyll) –
  // i scenens mått, med kameran svängd; sv: rummets vridning, mitt: där
  // tv:n står i scenen (x), och kant: hörnets vänstra kant (lådan) hur
  // kameran än står
  const LADORNA = horn(LADA.x, LADA.y, LADA.x + LADA.w, LADA.y + LADA.h, LADA.z, LADA.z - LADA.d);
  const ALLT = [...horn(TV.x, TV.y - 2, TV.x + TV.w, TV.y + TV.h, 0, -DJUP), ...LADORNA];
  const HORN = { mitt: O[0] + syns(MITT)[0], kant: Math.min(...[{ horn: 0 }, SVANG.nara, SVANG.tat].map((s) => ruta(ALLT, 0, s).x0)) };
  const LADFRAM = horn(LADA.x, LADA.y, LADA.x + LADA.w, LADA.y + LADA.h, LADA.z, LADA.z);
  const FOCUS = { ...ruta([...horn(TV.x, TV.y - 2, TV.x + TV.w, TV.y + TV.h, 0, 0), ...LADFRAM], 1, SVANG.nara), z: 10, ...HORN, sv: SVANG.nara.rum };
  const LADAN = { ...FOCUS, ...ruta(LADFRAM, 3, SVANG.nara) };
  const TAT = { ...ruta(horn(BILD.x, BILD.y, SPALT.x + SPALT.w, BILD.y + BILD.h, 0, 0), 0, SVANG.tat), z: 32, fyll: true, ...HORN, sv: SVANG.tat.rum };

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
  // under, spalten med högtalargaller över och under knapparna, kassettfacket,
  // displayen och fötterna.
  function galler(y0, y1) {
    let d = '';
    for (let y = y0; y < y1 - 0.2; y += 1.15) d += `M${r2(SPALT.x + 1.2)} ${r2(y)}H${r2(SPALT.x + SPALT.w - 1.2)}`;
    return d;
  }
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
    <path d="${SONY.d}" transform="translate(${r2(g.x + g.w / 2 - SONY.w * k / 2)} ${r2((y + g.y - 3) / 2 - 50 * k)}) scale(${k})" fill="url(#vhs-silver)"/>
    <path d="${TRINITRON.d}" transform="translate(${r2(g.x + g.w / 2 - TRINITRON.w * kt / 2)} ${r2(g.y + g.h + 1.8 - 50 * kt)}) scale(${kt})" fill="none" stroke="#bdb8ae" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="${SPALT.x}" y="${SPALT.y}" width="${SPALT.w}" height="${SPALT.h}" rx="2" fill="#100f0e" stroke="#34312d" stroke-width=".45"/>
    <path d="${galler(SPALT.y + 2.2, KNAPP.y - 1.6)}${galler(KNAPP.y + 5 * KNAPP.d + KNAPP.h + 1.8, SPALT.y + SPALT.h - 1.8)}" fill="none" stroke="#2b2925" stroke-width=".5" stroke-linecap="round"/>
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
  // sida, botten och baksidan, och skuggan på disken. I WebKit ritas det
  // innanför öppningen på ett enda plan precis bakom kassetterna (.platt):
  // Core Animation lade väggarna på tvären ovanpå kassetterna, så att
  // etiketterna inte gick att läsa.
  function ladaYtor() {
    const L = LADA;
    const [x0, y0, x1, y1] = [L.x + L.t, L.y + L.t, L.x + L.w - L.t, L.y + L.h - L.t].map((v) => v * S);
    const inne = (L.d - 1.5) * S;
    return golv('vhs-skugga', (L.x - 4) * S, (L.y + L.h) * S, (L.w + 8) * S, 4 * S, -(L.d + 4) * S) +
      (WEBKIT ? yta('lada-bak platt', x0, y0, x1 - x0, y1 - y0, '0 0', `translateZ(${-1.5 * S}px)`) :
        yta('lada-bak', x0, y0, x1 - x0, y1 - y0, '0 0', `translateZ(${r2(-inne)}px)`) +
        yta('lada-vagg', x0, y0, inne, y1 - y0, '0 0', 'rotateY(90deg)') +
        yta('lada-vagg', (L.x + MV.x + MV.w) * S, y0, inne, y1 - y0, '0 0', 'rotateY(90deg)') +
        golv('lada-botten', x0, y1, x1 - x0, 0, -inne)) +
      yta('lada-sida', (L.x + L.w) * S, L.y * S, L.d * S, L.h * S, '0 0', 'rotateY(90deg)') +
      yta('lada-topp', L.x * S, (L.y - L.d) * S, L.w * S, L.d * S, '0 100%', 'rotateX(90deg)');
  }

  // ---------- väggen, disken och pulten till höger om bilden ----------

  // Högra väggen som den är ritad i rum.js (bg), förlängd åt höger: samma
  // toner och fläckar, och bardisken med samma ritning (disk i rum.js, som
  // skickas hit). Ligger direkt efter bg() i planet -600, under det som
  // hänger på väggen.
  function vaggSvg(disk) {
    const [a, z] = [1599.5, 2100];
    const r = `x="${a}" y="300" width="${z - a}" height="720"`;
    return `<svg class="vhs-vagg" viewBox="${a} 300 ${z - a} 720" aria-hidden="true">
    <rect ${r} fill="url(#rum-rwall)"/><rect ${r} filter="url(#rum-flack)" opacity=".55"/><rect ${r} fill="#000" opacity=".2"/>
    ${disk ? disk(a, z) : ''}
  </svg>`;
  }
  // Pulten (table i rum.js) förlängd åt höger, i planet -60: samma trä och framkant, bakade för sig
  // (pult-hoger.webp, scripts/rum/pult.mjs), och metallisten längs bortre kanten.
  function pultSvg() {
    const [a, z] = [1599.5, 2140];
    const r = `x="${a}" y="650" width="${z - a}" height="360"`;
    return `<svg class="vhs-pult" viewBox="${a} 640 ${z - a} 380" aria-hidden="true">
    <rect ${r} fill="url(#rum-pult)"/><image href="rum/pult-hoger.webp" ${r} preserveAspectRatio="none"/>
    <rect x="${a}" y="647" width="${z - a}" height="6" fill="url(#rum-alu)"/>
  </svg>`;
  }

  // ---------- rummet runt tv:n ----------

  // Väggen bakom tv:n med korktavlan, och bardisken som den står på, i 3D i
  // hörnets perspektiv (.vhs-rum i .vhs-kam), så att de svänger med tv:n när
  // kameran går fram till rutan (tat). Rutan står rakt först när kameran har
  // gått VRID grader runt tv:n, och rummets målade plan går inte att vrida
  // mer än ungefär 40 grader (sving i rum.js): med bara dem såg det ut som
  // att tv:n vände sig mot en på disken. Nu står tv:n kvar mot väggen, och
  // det är kameran som vrids. Måtten är rummets (bg, disk och VAGG i rum.js):
  // X till höger om flyktpunkten, yb högt mätt vid bakväggen och djupet Z
  // (bakväggen 1000, ögat 0). Hörnet är rummet förstorat SK gånger kring
  // ögat, så att disken (490) hamnar under tv:ns fot och väggen (380) där
  // tv:n tar i den (VAGG).
  const SK = (TV.y + TV.h - VP[1]) / 90;
  const p3 = (X, yb, Z) => [VP[0] + X * SK, VP[1] + (yb - 400) * SK, 1000 - Z * SK];
  // så långt in och ut längs väggen
  const RUM = { z0: 300, z1: 820 };
  // En yta i rummets mått, w × h, med övre vänstra hörnet i p, vriden (rot)
  // och förstorad till hörnets. Lagret ritas i res gånger rummets mått
  // (zoom på det inre), inte i hörnets: det räcker för något som kameran far
  // förbi, och en toning blir inte sämre av att förstoras.
  const skiva = (cls, p, rot, w, h, st = '', res = 1) => `<i class="vhs-vy ${cls}" style="width:${r2(w * res)}px; height:${r2(h * res)}px; ` +
    `transform:translate3d(${px(p[0])}, ${px(p[1])}, ${px(p[2])}) ${rot} scale(${r2((SK * S) / res)})"><b style="width:${r2(w)}px; height:${r2(h)}px; zoom:${res}${st}"></b></i>`;
  // färgen längs väggen eller disken som den är målad: en toning i bilden
  // från x0 till x1 (a till b), och X till höger om flyktpunkten
  const blanda = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t))));
  function toning(X, a, b, x0, x1, k = 1, led = 90) {
    const steg = [];
    for (let Z = RUM.z1; Z >= RUM.z0 - 1; Z -= 40) {
      const c = blanda(a, b, (760 + (X * 1000) / Z - x0) / (x1 - x0)).map((v) => Math.round(v * k));
      steg.push(`rgb(${c}) ${r2(((RUM.z1 - Z) / (RUM.z1 - RUM.z0)) * 100)}%`);
    }
    return `linear-gradient(${led}deg, ${steg.join(', ')})`;
  }
  function rumYtor() {
    const djup = RUM.z1 - RUM.z0;
    // väggen (rum-rwall i rum.js, och en femtedel svart över)
    const vagg = toning(380, [107, 87, 51], [56, 45, 28], 1140, 1600, 0.8);
    // disken (rum-countertop och rum-counter)
    const topp = toning(340, [97, 58, 35], [58, 33, 19], 1060, 1600, 1, 180);
    const front = toning(346, [71, 43, 25], [42, 24, 14], 1060, 1600);
    // fyllningarna i fronten: en ram var 128,57 (ram i rum.js), räknat från
    // bakväggen. Fronten står i X = 346 i stället för 355: ett plan som går
    // genom tv:n eller lådan delar Chrome dem längs, och då syntes ett svart
    // streck genom rutan. Under skivans kant syns det inte.
    const ram = 128.57;
    const fas = r2((((RUM.z1 - 1000 - 7) % ram) + ram) % ram);
    return '<div class="vhs-rum">' +
      skiva('vy-vagg', p3(380, 140, RUM.z1), 'rotateY(-90deg)', djup, 350, `; background:${vagg}`, 0.5) +
      skiva('vy-front', p3(346, 501, RUM.z1), 'rotateY(-90deg)', djup, 400, `; --fas:${fas}px; --front:${front}`, 0.5) +
      skiva('vy-topp', p3(300, 490.3, RUM.z1), 'rotateX(90deg)', 80, djup, `; --topp:${topp}`) +
      skiva('vy-kant', p3(300, 490, RUM.z1), 'rotateY(-90deg)', djup, 12.6) +
      '</div>';
  }

  // ---------- html ----------

  const px = (v) => `${r2(v * S)}px`;
  const at = (r) => `left:${px(r.x)}; top:${px(r.y)}; width:${px(r.w)}; height:${px(r.h)}`;

  function html(part, o = {}) {
    if (part === 'vagg') return vaggSvg(o.disk);
    if (part === 'pult') return pultSvg();
    // knapparna, med tangenterna som gör samma sak nära (key i mount)
    const knappar = [['bak', '◀◀', 'Spola tillbaka', 'ArrowLeft'], ['spela', '▶', 'Spela', 'Space'], ['fram', '▶▶', 'Spola fram', 'ArrowRight'], ['paus', '❚❚', 'Paus', 'Space'], ['stopp', '■', 'Stopp', 'S'], ['ut', '⏏', 'Mata ut']]
      .map(([k, t, l, tg], i) => `<button type="button" class="vhs-k" data-vhs="${k}" aria-label="${l}"${tg ? ` aria-keyshortcuts="${tg}"` : ''} style="${at({ x: KNAPP.x, y: KNAPP.y + i * KNAPP.d, w: KNAPP.w, h: KNAPP.h })}">${t}</button>`).join('');
    // en kassett: ryggen med etiketten (kupongnumret, matchen och
    // resultatet), och taket och ändarna bakåt
    const kas = (a, b) => Array.from({ length: b - a }, (_, i) => `<div class="vhs-band" data-i="${a + i}" hidden>` +
      `<button type="button" class="vhs-kas" data-i="${a + i}"><span class="lapp"><i></i><b></b><u></u></span></button>` +
      '<i class="kas-topp"></i><i class="kas-v"></i><i class="kas-h"></i></div>').join('');
    return `<div class="rum-vhs${WEBKIT ? ' webkit' : ''}" id="rum-vhs" data-lage="tom" style="left:${O[0]}px; top:${O[1]}px">` +
      `<div class="vhs-in" style="perspective:${1000 * S}px; perspective-origin:${px(VP[0])} ${px(VP[1])}">` +
      '<i class="vhs-sken"></i>' +
      // kameran runt tv:ns mitt (SVANG)
      `<div class="vhs-kam" style="transform-origin:${px(MITT[0] + PLATS[0])} ${px(MITT[1])} ${px(MITT[2] + PLATS[1])}">${rumYtor()}` +
      `<div class="vhs-tv" style="transform:translate3d(${px(PLATS[0])}, 0px, ${px(PLATS[1])}) rotateY(${-VRID}deg); transform-origin:${px(MITT[0])} ${px(MITT[1])} ${px(MITT[2])}">${ytor()}` +
      `<div class="vhs-front">${tvRitning()}<div class="vhs-styr" inert>` +
      `<div class="vhs-skarm" style="${at(GLAS)}">` +
      `<div class="vhs-bild" style="top:${px(BILD.y - GLAS.y)}; height:${px(BILD.h)}"></div><i class="vhs-mitt"></i>` +
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
      `<span class="vhs-dator" style="top:${px(BILD.y - GLAS.y + 3)}"></span>` +
      `<span class="vhs-tid" style="top:${px(BILD.y - GLAS.y + 3)}">0:00:00</span>` +
      `<span class="vhs-ljud" style="bottom:${px(GLAS.y + GLAS.h - BILD.y - BILD.h + 3)}">TRYCK FÖR LJUD</span>` +
      // (bandmätaren lika långt in nedifrån som bokstäverna uppifrån)
      `<span class="vhs-matare" style="bottom:${px(GLAS.y + GLAS.h - BILD.y - BILD.h + 4.6)}"><i></i></span><i class="vhs-glas"></i></div>` +
      `<span class="vhs-vfd" style="${at(VFD)}">12:00</span>${knappar}</div></div>` +
      // lådan bredvid
      `<div class="vhs-lada" style="transform:translateZ(${px(LADA.z)})">${ladaYtor()}${ladaRitning()}<div class="vhs-styr" inert>${kas(0, CAP)}</div></div>` +
      `<a class="vhs-hit rum-sak" role="button" tabindex="0" data-nav="video" aria-label="Videon">${hitYtor()}</a></div></div>` +
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
  // så länge spelarens knapp mitt i bilden syns efter att klippet har börjat
  // spela (eller hoppat) – mätt till knappt fyra sekunder, med lite marginal.
  // Så länge står också ▶, räkneverket och bandmätaren i rutan.
  const FORVARM = 4400;
  // ▶ från stopp, och när kassetten har åkt in: den blå bilden står så här länge
  // efter att bandet har börjat gå, så att det hinner ut ur kassetten
  const BLA = 800;
  // stannar spelaren inom så här lång tid efter ▶ är det pausen före
  const SEN = 800;
  // Bandets fart, i sekunder i sekunden. Spelar den eller står den på paus
  // söker ◀◀ och ▶▶ i bilden i en fast fart: SOK, och ett nytt tryck åt samma
  // håll går upp ett steg. På stopp spolar bandet med blå bild (VIND) och
  // bromsar in sista biten. Farten ändras mjukt (TROG, TROGV), så att bandet
  // vänder och inte hoppar. Bandmätaren har MATARE steg, och brusränderna
  // rullar genom bilden i LAS ms när den kommer.
  const SOK = [7, 21];
  const VIND = 30;
  const TROG = 0.25;
  const TROGV = 0.7;
  const LAS = 900;
  const MATARE = 20;
  // efter så länge i paus går videon till stopp, för att skona bandet
  const PAUSTID = 5 * 60 * 1000;
  // ⏏ medan bandet går: det stannar och kassetten kommer ut efter så här länge
  const UT = 600;
  // Bildsökningen visar klippet självt: spelaren står på paus och hoppar dit
  // räkneverket är var HOPP:e ms. I paus kommer ingen rubrik, knapp eller
  // logga fram, bara bildrutan – fram och bak, hur fort det än går.
  const HOPP = 120;
  // i telefonen (som i rum-video.css): spelaren finns bara medan man står
  // nära, och klippen spelas med rutan i hela fönstret
  const TELEFON = matchMedia('(max-width: 700px), (max-height: 500px)');
  // WebKit: en video får inte ha ljud förrän någon har tryckt medan den
  // finns (se gest), så där byts klippen i samma spelare. Stannade den när
  // ljudet slogs på inom LJUDPAUS ms var det inte tillåtet här (andra
  // webbläsare kan också ha den regeln).
  const LJUDPAUS = 1500;
  // så länge en spelare får vara tyst innan en ny provas
  const SVAR = 45000;
  // så länge en spelare brukar behöva för att börja själv
  const TRYGG = 2500;
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
    // (rum-video.css), och knapparna säger sin när man pekar på dem, som
    // sakerna i rummet (title).
    if (matchMedia('(hover: hover)').matches) {
      const fot = root.querySelector('.rum-ft');
      if (fot) fot.insertAdjacentHTML('afterbegin', '<span class="vhs-tangenter"><b>← →</b> spola · <b>mellanslag</b> spela/paus · <b>S</b> stopp · <b>↑ ↓</b> kassett</span>');
      const NAMN = { ArrowLeft: '←', ArrowRight: '→', Space: 'mellanslag', S: 'S' };
      for (const b of box.querySelectorAll('.vhs-k[aria-keyshortcuts]')) b.title = `${b.getAttribute('aria-label')} · ${NAMN[b.getAttribute('aria-keyshortcuts')]}`;
    }
    // Rummet runt tv:n syns på vägen till rutan och på vägen tillbaka, som
    // är lika lång (.vhs-runt); nära och på håll är det rummets målade plan.
    // Hela vägen hem till rummet (hem) tonar det ut tidigare, innan dess
    // kanter syns.
    function runt(kvar, hem = false) {
      clearTimeout(V.runtT);
      kvar = kvar && !o.calm();
      box.classList.toggle('vhs-runt', kvar);
      box.classList.toggle('vhs-hem', kvar && hem);
      if (kvar) V.runtT = setTimeout(() => { if (!V.tat) box.classList.remove('vhs-runt', 'vhs-hem'); }, 700);
    }
    // Tipsligan och korktavlan på väggen bakom tv:n, i rummet runt den
    // (rumYtor): kopior av tavlorna i rum.js, som de ser ut när man går
    // fram, på samma plats på väggen (onWall i rum.js: överkanten yb, höjden,
    // bredden längs väggen och djupet z in från bakväggen). Ramarna i 3D
    // (rum-inredning.js) är inte med: tavlornas egna kanter får räcka.
    const rum = box.querySelector('.vhs-rum');
    function tavlor() {
      for (const t of rum.querySelectorAll('.vy-tavla')) t.remove();
      for (const sel of ['.rum-hv > .rum-skar', '.rum-hv > .rum-kork']) {
        const org = root.querySelector(sel);
        const z = org && /translateX\(([-\d.]+)px\)/.exec(org.style.transform);
        if (!z) continue;
        const [yb, h, w] = ['top', 'height', 'width'].map((k) => parseFloat(org.style[k]));
        rum.insertAdjacentHTML('beforeend', skiva('vy-tavla', p3(379.6, yb, 1000 - Number(z[1])), 'rotateY(-90deg)', w, h, '', 2));
        const kopia = org.cloneNode(true);
        for (const e of [kopia, ...kopia.querySelectorAll('[id]')]) e.removeAttribute('id');
        for (const a of ['role', 'tabindex', 'data-nav', 'data-sak', 'aria-label', 'href']) kopia.removeAttribute(a);
        kopia.classList.remove('rum-sak');
        kopia.setAttribute('aria-hidden', 'true');
        kopia.style.cssText = 'left:0; top:0; width:100%; height:100%; transform:none';
        rum.lastElementChild.firstElementChild.append(kopia);
      }
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
    // nästa) och den markerade kassetten; band: var på bandet kassetterna
    // står (match → sekund); utT: ⏏ är tryckt och kassetten är på väg ut
    const V = { tapes: [], key: '', cur: null, mid: null, near: false, tat: false, resume: false, lage: 'tom', forra: [], dagar: ['', ''], sida: 0, pek: null, band: new Map(), utT: 0 };
    // spelaren: klippen, vilket, meddelandenas id, ramen, tiden och läget;
    // dold: bilden täcks eller ljudet är av (varm, spola);
// mal: där bandet stannade (och spelar från), dur: klippets längd; vis,
    // fart och dir: räkneverket, farten och hållet när det söker eller
    // spolar, steg: sökfarten (SOK); sok:
    // bildrutan (requestAnimationFrame) och när den förra var; ren: spelaren har börjat spela, så att
    // den har en bild, hopp och hoppT: när och dit spelaren hoppade senast i
    // sökningen; pausT: när pausen tar slut, doljT: när ▶ försvinner ur rutan,
    // vantaT: när ▶ kommer medan den väntar på data, lasT: brusränderna, spelad: det senaste ▶; ljud: spelaren får ha ljud, ljudT: när det slogs på,
    // ledig: spelaren på paus mellan två klipp, n: spelarna, som meddelandena
    // skiljer dem åt (seq), borta: den spelade när sidan doldes, laddad: när
    // klippet lades i, svar: spelare i rad som inte har svarat
    const P = { list: [], i: 0, seq: 0, n: 0, frame: null, ledig: null, ljud: !WEBKIT, ljudT: 0, borta: false, laddad: 0, svar: 0, ready: false, ping: null, t: 0, st: -1, timer: 0, dold: true, varm: 0, mal: null, dur: 0, vis: 0, fart: 0, dir: 0, steg: 0, sok: 0, sokT: 0, ren: false, hopp: 0, hoppT: null, pausT: 0, doljT: 0, vantaT: 0, lasT: 0, spelad: 0 };

    function lage(l, text) {
      V.lage = l;
      box.dataset.lage = l;
      if (text != null) osdEl.textContent = text;
      if (l !== 'paus') clearTimeout(P.pausT);
      if (l !== 'spolar' && l !== 'vind' && P.sok) {
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
    if (document.fonts) document.fonts.load('20px "Skrivmaskin"').then(() => { for (const el of kas) el.dataset.passa = ''; passa(); }, () => {});

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

    // Spelaren stannar. spara: i WebKit står den kvar på paus (dold), så att
    // nästa klipp får ljud (load); annars försvinner den.
    function stopPlayer(spara) {
      clearTimeout(P.ping);
      clearTimeout(P.timer);
      clearTimeout(P.varm);
      P.varm = 0;
      if (spara && WEBKIT && P.frame && P.ready) {
        cmd('pauseVideo');
        cmd('mute');
        P.ledig = P.frame;
      } else if (!spara || !P.ledig) {
        P.ledig = null;
        P.ljud = !WEBKIT;
        bild.replaceChildren();
      }
      P.seq = 0;
      P.ljudT = 0;
      P.frame = null;
      P.ready = false;
      P.st = -1;
      P.dold = true;
      P.mal = null;
      P.dur = 0;
      P.dir = 0;
      P.steg = 0;
      P.ren = false;
      cancelAnimationFrame(P.sok);
      P.sok = 0;
      clearTimeout(P.doljT);
      clearTimeout(P.vantaT);
      clearTimeout(P.lasT);
      clearTimeout(P.pausT);
      box.classList.remove('vhs-efter', 'vhs-fort', 'vhs-ram', 'vhs-tyst', 'vhs-dolj', 'vhs-las');
    }

    const cmd = (func, args = []) => {
      if (P.frame && P.frame.contentWindow) P.frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args, id: P.seq, channel: 'widget' }), HOST);
    };
    const listen = (f, id) => f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), HOST);
    // paus som vi själva ber om (inte den när ljudet inte var tillåtet, state)
    const pausa = () => {
      P.ljudT = 0;
      cmd('pauseVideo');
    };

    // En tryckning: nu får spelaren ha ljud. Gesten följer med meddelandet in
    // i spelaren, och sedan får den spela med ljud, också nästa klipp (load).
    // Medan den värms upp är den fortfarande tyst, men har fått lov. Svarar
    // om den fick det nu.
    function gest() {
      if (P.ljud || !P.frame || !P.ready) return false;
      P.ljud = true;
      P.ljudT = performance.now();
      cmd('unMute');
      if (P.dold) cmd('mute');
      box.classList.remove('vhs-tyst');
      return true;
    }

    // WebKit lägger ibland inte ut spelaren när hörnet ritas i dubbla storleken
    // (0 × 0, och rutan blir svart): något som ändras bredvid den tvingar fram det.
    function knuffa() {
      if (!WEBKIT || !P.frame || P.frame.offsetWidth) return;
      const d = document.createElement('i');
      bild.append(d);
      void d.offsetWidth;
      d.remove();
    }

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
    // videons blå bild tills bandet har börjat gå (varm).
    function load(start) {
      stopPlayer(true);
      ramar(P.list[P.i]);
      lage('laddar', '▶ SPELA');
      dolj();
      if (V.near) skarp(true);
      P.laddad = performance.now();
      if (start > 0) P.mal = start;
      // spelaren som står på paus tar nästa klipp, med ljudet den har fått
      if (P.ledig) {
        P.frame = P.ledig;
        P.ledig = null;
        P.seq = Number(P.frame.dataset.seq);
        P.ready = true;
        cmd('mute');
        cmd(V.near ? 'loadVideoById' : 'cueVideoById', [{ videoId: P.list[P.i], startSeconds: Math.max(0, (start || 0) - BLA / 1000) }]);
        // tar den inte klippet börjar en ny spelare
        const seq = P.seq;
        if (V.near) {
          P.timer = setTimeout(() => {
            if (seq !== P.seq || P.st === 1 || P.st === 3 || V.lage !== 'laddar') return;
            stopPlayer(false);
            load(start);
          }, 7000);
        }
        return;
      }
      P.seq = ++P.n;
      const seq = P.seq;
      const q = new URLSearchParams({
        autoplay: V.near ? 1 : 0, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3,
        cc_load_policy: 0, hl: 'en', start: Math.floor(Math.max(0, (start || 0) - BLA / 1000)),
        enablejsapi: 1, origin: location.origin, widgetid: seq,
      });
      const f = document.createElement('iframe');
      f.src = `${HOST}/embed/${encodeURIComponent(P.list[P.i])}?${q}`;
      f.title = 'Höjdpunkter';
      f.dataset.seq = seq;
      f.tabIndex = -1;
      f.allow = 'autoplay; encrypted-media';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      const hello = () => {
        if (seq !== P.seq || P.ready) return;
        listen(f, seq);
        P.ping = setTimeout(hello, 250);
      };
      f.addEventListener('load', hello);
      P.frame = f;
      bild.append(f);
      knuffa();
      // (en spelare tar minne: rummet släpper mer, lattVideo i rum.js)
      if (o.latt) o.latt();
      // Svarar inte spelaren alls provas en ny, och sedan nästa klipp.
      P.timer = setTimeout(() => {
        if (seq !== P.seq || P.ready || V.lage !== 'laddar') return;
        stopPlayer(false);
        if (P.svar++ < 1) load(start);
        else next(true);
      }, SVAR);
    }

    // Var på bandet det är, vad det än gör.
    const bandet = () => (V.lage === 'spolar' || V.lage === 'vind' ? P.vis : P.mal ?? P.t);
    // går bandet fort (och rutan visar bildsökningen eller den blå bilden)
    const rullar = () => (V.lage === 'spolar' || V.lage === 'vind') && P.dir !== 0;
    const brus = () => {
      if (!box.style.getPropertyValue('--sok-brus')) box.style.setProperty('--sok-brus', `url(${randBrus()})`);
    };

    // ▶ över spelarens knapp mitt i bilden: från att den börjar spela eller
    // väntar på data, tills knappen har tonat bort och ▶ försvinner, med
    // räkneverket och bandmätaren (.vhs-efter). Pausar man innan dess står
    // knappen kvar, och ▶ med den (state).
    function dolj() {
      clearTimeout(P.doljT);
      box.classList.add('vhs-dolj');
    }
    function doljKlar() {
      clearTimeout(P.doljT);
      P.doljT = setTimeout(() => box.classList.remove('vhs-dolj', 'vhs-efter'), FORVARM);
    }

    // Bilden fram. ljud: det var avstängt, och slås på. rand: brusränderna rullar
    // genom bilden en gång medan bandet låser. ▶, räkneverket och bandmätaren
    // står kvar en stund (doljKlar).
    function bildFram(rand, ljud) {
      P.dold = false;
      P.mal = null;
      if (ljud && P.ljud) {
        P.ljudT = performance.now();
        cmd('unMute');
      }
      box.classList.toggle('vhs-tyst', !P.ljud);
      lage('spelar');
      if (rand) las();
      osdEl.textContent = '▶';
      box.classList.add('vhs-efter');
      tick();
    }

    // Bilden kommer en kort stund efter att bandet har börjat gå bakom den blå.
    function varm() {
      if (P.varm || !P.dold) return;
      P.varm = setTimeout(() => {
        P.varm = 0;
        if (P.st === 1 && V.lage === 'laddar') bildFram(true, true);
      }, BLA);
    }

    function las() {
      if (o.calm()) return;
      brus();
      clearTimeout(P.lasT);
      box.classList.add('vhs-las');
      P.lasT = setTimeout(() => box.classList.remove('vhs-las'), LAS);
    }

    // ▶ från stopp: bandet ska ut ur kassetten, så det går bakom den blå bilden
    // en kort stund först, från lika mycket före där det stod.
    function resume() {
      if (!P.frame) {
        // (i telefonen är spelaren borta när man har gått därifrån, parkera)
        if (V.cur != null && P.list.length) load(bandet());
        return;
      }
      const t = bandet();
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      P.dir = 0;
      P.fart = 0;
      P.steg = 0;
      P.mal = t;
      lage('laddar', '▶ SPELA');
      box.classList.remove('vhs-efter', 'vhs-fort', 'vhs-ram', 'vhs-las');
      dolj();
      skarp(true);
      cmd('mute');
      cmd('seekTo', [Math.max(0, t - BLA / 1000), true]);
      cmd('playVideo');
      // spelar den redan kommer inget nytt läge från spelaren
      if (P.st === 1) varm();
      tick();
    }

    // ▶ från paus och sökning: bilden står redan i spelaren och går direkt, med
    // ljudet om det var av. Efter en sökning låser bandet med brusränderna.
    function direkt() {
      const t = bandet();
      const sokte = V.lage === 'spolar';
      const tyst = P.dold;
      clearTimeout(P.varm);
      P.varm = 0;
      P.dir = 0;
      P.fart = 0;
      P.steg = 0;
      P.t = t;
      P.spelad = performance.now();
      box.classList.remove('vhs-fort', 'vhs-ram', 'vhs-efter');
      dolj();
      skarp(true);
      if (sokte) cmd('seekTo', [t, true]);
      cmd('playVideo');
      // (spelar den redan kommer inget nytt läge från spelaren)
      if (P.st === 1) doljKlar();
      bildFram(sokte, tyst);
    }

    // Spelar vidare: direkt om spelaren har bilden, annars över den blå.
    const vidare = () => (P.frame && P.ren && ['paus', 'spolar', 'spelar'].includes(V.lage) ? direkt() : resume());

    // ◀◀ och ▶▶. På stopp spolar bandet, med blå bild och utan bild ur klippet
    // (vinda). Spelar den, står på paus eller håller på att börja söker den i
    // bilden i en fast fart, tills man trycker ▶, ❚❚ eller ■ eller bandet tar
    // slut: ett nytt tryck åt samma håll går upp ett steg, och åt andra hållet
    // vänder den. Spelaren står på paus och hoppar med räkneverket (sok) – har
    // den inte börjat spela än visar rutan YouTubes bildrutor i stället (utan
    // .vhs-ram).
    function spola(d) {
      if (V.cur == null || V.utT) return;
      if (V.lage === 'stopp') {
        vinda(d);
        return;
      }
      if (V.lage === 'vind') {
        P.dir = d;
        return;
      }
      if (V.lage === 'spolar') {
        if (d !== P.dir) {
          P.dir = d;
          P.steg = 0;
        } else P.steg = Math.min(SOK.length - 1, P.steg + 1);
        return;
      }
      if (!['spelar', 'paus', 'laddar'].includes(V.lage) || !P.frame || !P.ready) return;
      P.vis = bandet();
      P.fart = 0;
      P.steg = 0;
      P.dir = d;
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      box.classList.remove('vhs-efter', 'vhs-tyst', 'vhs-las');
      brus();
      // (i telefonen visar rutan YouTubes bildrutor: spelaren hinner inte med
      // att hoppa åtta gånger i sekunden där)
      box.classList.toggle('vhs-ram', P.ren && !TELEFON.matches);
      P.hoppT = null;
      lage('spolar', d > 0 ? '▶▶' : '◀◀');
      box.dataset.sok = d > 0 ? 'fram' : 'bak';
      cmd('mute');
      pausa();
      ruta(P.vis);
      rulla();
      tick();
    }

    // Spolar från stopp: i bandets ände finns inget mer att spola.
    function vinda(d) {
      const t = bandet();
      if (d < 0 ? t <= 0 : !P.dur || t >= P.dur - 1) return;
      P.vis = t;
      P.fart = 0;
      P.steg = 0;
      P.dir = d;
      lage('vind', d > 0 ? '▶▶' : '◀◀');
      box.dataset.sok = d > 0 ? 'fram' : 'bak';
      rulla();
      tick();
    }

    function rulla() {
      if (P.sok) return;
      P.sokT = performance.now();
      P.sok = requestAnimationFrame(sok);
    }

    // En bildruta medan bandet går fort: farten närmar sig den det ska ha (och
    // vänder mjukt) och räkneverket rullar. Söker det hoppar spelaren dit (var
    // HOPP:e ms; annars visas YouTubes bildruta närmast), och ränderna rullar
    // nedåt framåt och uppåt bakåt, fortare när det går fort. I början av bandet
    // stannar det, och i slutet spolar det tillbaka (bandSlut).
    function sok(now) {
      P.sok = 0;
      if (!rullar()) return;
      const dt = Math.max(0, Math.min(0.1, (now - P.sokT) / 1000));
      P.sokT = now;
      const vind = V.lage === 'vind';
      const slut = P.dur ? Math.max(0, P.dur - 1) : Infinity;
      const fart = vind ? Math.min(VIND, 6 + (P.dir > 0 ? slut - P.vis : P.vis) * 4) : SOK[P.steg];
      P.fart += (P.dir * fart - P.fart) * (1 - Math.exp(-dt / (vind ? TROGV : TROG)));
      P.vis += P.fart * dt;
      if (P.fart < 0 && P.vis <= 0) {
        P.vis = 0;
        stopp();
        return;
      }
      if (P.fart > 0 && P.vis >= slut) {
        P.vis = slut;
        bandSlut();
        return;
      }
      const sk = P.dir > 0 ? 'fram' : 'bak';
      if (box.dataset.sok !== sk) {
        box.dataset.sok = sk;
        osdEl.textContent = sk === 'fram' ? '▶▶' : '◀◀';
      }
      if (!vind) {
        box.classList.toggle('vhs-fort', Math.abs(P.fart) > 16);
        ruta(P.vis);
        if (now - P.hopp >= HOPP && (P.hoppT == null || Math.abs(P.vis - P.hoppT) >= 0.2)) hoppa();
      }
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

    // Bandet tar slut, spelat, sökt eller spolat: videon spolar tillbaka av
    // sig själv och stannar på 0:00:00.
    function bandSlut() {
      clearTimeout(P.varm);
      P.varm = 0;
      P.dold = true;
      P.vis = P.dur || P.t;
      P.mal = null;
      box.classList.remove('vhs-efter', 'vhs-fort', 'vhs-ram', 'vhs-las');
      pausa();
      lage('vind', '◀◀');
      box.dataset.sok = 'bak';
      P.fart = 0;
      P.steg = 0;
      P.dir = -1;
      rulla();
      tick();
    }

    // ❚❚: bandet står och bilden darrar, med en brusrand. Efter en sökning
    // hoppar spelaren dit bandet stannade.
    function stilla() {
      const sokte = V.lage === 'spolar';
      P.mal = sokte ? P.vis : P.t;
      P.dir = 0;
      P.fart = 0;
      P.steg = 0;
      brus();
      box.classList.remove('vhs-efter', 'vhs-fort', 'vhs-las');
      box.classList.toggle('vhs-ram', P.ren);
      pausa();
      lage('paus', '❚❚');
      ruta(P.mal);
      if (sokte) hoppa();
      clearTimeout(P.pausT);
      P.pausT = setTimeout(stopp, PAUSTID);
      tick();
    }

    // ■: bandet står där det är, bakom den blå bilden med STOPP, räkneverket
    // och bandmätaren; ▶ spelar därifrån och ◀◀ och ▶▶ spolar.
    function stopp() {
      if (V.cur == null || ['tom', 'brus', 'stopp'].includes(V.lage)) return;
      P.mal = bandet();
      P.dir = 0;
      P.fart = 0;
      P.steg = 0;
      clearTimeout(P.varm);
      P.varm = 0;
      clearTimeout(V.fortT);
      P.dold = true;
      box.classList.remove('vhs-efter', 'vhs-fort', 'vhs-ram', 'vhs-las');
      pausa();
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
      P.svar = 0;
      P.i = 0;
      // kassetten står där den stod när den matades ut
      const t = V.band.get(m.id) || 0;
      P.t = t;
      mask.hidden = !hidden(m);
      if (!P.list.length) {
        stopPlayer(true);
        lage('brus', '');
      } else if (!V.near) {
        // gick man därifrån medan kassetten åkte in spelar den när man kommer tillbaka
        V.resume = true;
        if (TELEFON.matches) lage('stopp', 'STOPP');
        else load(t);
      } else load(t);
    }

    // Nästa klipp. fel: det här gick inte att spela, och spelaren får bytas
    // om den inte har fått ljud (en spelare som har gett fel tar inte alltid
    // nästa klipp).
    function next(fel) {
      P.t = 0;
      if (fel && !P.ljud) stopPlayer(false);
      if (++P.i < P.list.length) load(0);
      else {
        stopPlayer(true);
        lage('brus', '');
      }
    }

    // Spelarens läge: 1 spelar, 2 paus, 3 väntar på data, 0 slut. Bandet
    // bestämmer: står det ska spelaren också stå.
    function state(st) {
      P.st = st;
      // stannade den när ljudet slogs på var det inte tillåtet: utan ljud tills någon trycker
      const ljudpaus = st === 2 && P.ljudT && performance.now() - P.ljudT < LJUDPAUS;
      if (ljudpaus) {
        P.ljudT = 0;
        P.ljud = false;
        box.classList.add('vhs-tyst');
        cmd('mute');
        cmd('playVideo');
      }
      if (st === 1) {
        P.ren = true;
        // ingen textning (unloadModule räcker inte: den kommer tillbaka vid nästa ▶)
        cmd('setOption', ['captions', 'track', {}]);
        if (V.lage !== 'laddar' && V.lage !== 'spelar') pausa();
        // gick man därifrån medan den laddade: paus tills man kommer tillbaka
        else if (!V.near) {
          pausa();
          V.resume = true;
        } else if (P.dold) varm();
      } else {
        clearTimeout(P.varm);
        P.varm = 0;
      }
      // stannade den av något annat skäl är det paus, som allt annat som står
      // (inte om det är pausen före ett ▶, som kommer strax efter det)
      if (st === 2 && !ljudpaus && V.lage === 'spelar' && V.near && !V.resume && !document.hidden && performance.now() - P.spelad > SEN) stilla();
      // väntar den på data en stund kommer spelarens hjul fram i mitten
      clearTimeout(P.doljT);
      clearTimeout(P.vantaT);
      if (st === 3 && V.lage === 'spelar' && !box.classList.contains('vhs-dolj')) P.vantaT = setTimeout(dolj, 400);
      else if (st === 1 && box.classList.contains('vhs-dolj')) doljKlar();
      if (st === 0 && (V.lage === 'spelar' || V.lage === 'laddar')) bandSlut();
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
      P.svar = 0;
      if (d.event === 'onError') {
        if (GONE.has(d.info)) markBad(P.list[P.i]);
        next(true);
      } else if (d.event === 'onStateChange' && typeof d.info === 'number') state(d.info);
      else if (d.event === 'infoDelivery' && d.info) {
        if (typeof d.info.currentTime === 'number') P.t = d.info.currentTime;
        if (typeof d.info.duration === 'number') P.dur = d.info.duration;
        if (typeof d.info.playerState === 'number' && d.info.playerState !== P.st) state(d.info.playerState);
      }
    });

    // Displayen: 12:00 som blinkar när ingen kassett är i, annars bandets
    // läge och räkneverket. I rutan räkneverket och bandmätaren när bandet går
    // fort och när det står (stopp och paus), och en stund när bilden kommer.
    const clock = (s) => {
      const t = Math.max(0, Math.floor(s));
      return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    };
    function tick() {
      knuffa();
      const soker = V.lage === 'spolar' || V.lage === 'vind';
      const s = bandet();
      const sym = soker ? osdEl.textContent : V.lage === 'stopp' ? '■' : V.lage === 'paus' ? '❚❚' : '▶';
      const txt = V.cur == null && V.mid == null ? '12:00' : `${sym} ${clock(s)}`;
      if (vfd.textContent !== txt) vfd.textContent = txt;
      vfd.classList.toggle('blink', txt === '12:00');
      if (!soker && V.lage !== 'stopp' && V.lage !== 'paus' && !box.classList.contains('vhs-efter')) return;
      const t = clock(s);
      if (tidEl.textContent !== t) tidEl.textContent = t;
      matare.hidden = !P.dur;
      const n = String(Math.max(1, Math.ceil(Math.min(1, s / (P.dur || 1)) * MATARE)));
      if (matare.style.getPropertyValue('--n') !== n) matare.style.setProperty('--n', n);
    }
    setInterval(() => { if (!root.hidden) tick(); }, 500);

    // Telefonen låstes eller man bytte app: systemet pausar videon, och den
    // spelar vidare när man kommer tillbaka.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) P.borta = P.st === 1;
      else if (P.borta && P.st === 2 && V.near && V.lage === 'spelar') vidare();
    });

    // ---------- kassetterna in och ut ----------

    function insert(i) {
      const m = V.tapes[i];
      if (!m) return;
      clearTimeout(V.fortT);
      if (V.cur === i) {
        spelaPaus();
        return;
      }
      if (V.cur != null) eject();
      stopPlayer(true);
      V.cur = i;
      V.mid = m.id;
      P.t = V.band.get(m.id) || 0;
      V.sida = fack(i);
      V.pek = i;
      V.resume = false;
      lage('laddar', '▶ SPELA');
      // i telefonen spelas den med rutan i hela fönstret
      if (TELEFON.matches) tat(true);
      utanLada(V.tat);
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
      clearTimeout(V.utT);
      V.utT = 0;
      spara();
      utanLada(false);
      clearTimeout(V.fortT);
      stopPlayer(true);
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

    // Var kassetten står på bandet följer med den ut. (Inget när den inte gick
    // att spela.)
    function spara() {
      if (V.mid != null && P.list.length && V.lage !== 'brus') V.band.set(V.mid, bandet());
    }

    // ⏏: går bandet stannar det först.
    function mataUt() {
      if (V.cur == null || V.utT) return;
      if (V.lage === 'stopp' || V.lage === 'brus' || o.calm()) eject();
      else {
        stopp();
        V.utT = setTimeout(eject, UT);
      }
    }

    // ▶: spelar från där bandet är, direkt från paus och sökning. Spelar den
    // redan händer inget; håller den på att börja får en spelare som inte har
    // fått börja själv en knuff. Utan kassett spelar den den som är markerad i
    // listan.
    function spela() {
      if (V.utT) return;
      if (V.cur == null) {
        const i = V.pek ?? V.tapes.findIndex(Boolean);
        if (i >= 0) insert(i);
        return;
      }
      if (V.lage === 'laddar') {
        if (P.ready && P.st !== 1 && P.st !== 3) cmd('playVideo');
        return;
      }
      if (V.lage === 'brus' || (V.lage === 'spelar' && P.st !== 2)) return;
      V.resume = false;
      if (P.frame || P.mal != null || rullar()) vidare();
      else start(V.tapes[V.cur]);
      if (TELEFON.matches) tat(true);
    }

    // ❚❚: paus medan den spelar och söker, och spelar igen från paus.
    function paus() {
      if (V.utT) return;
      if (V.lage === 'spelar' || V.lage === 'spolar') stilla();
      else if (V.lage === 'paus') spela();
    }

    // mellanslaget
    const spelaPaus = () => (V.lage === 'spelar' ? paus() : spela());

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
      // (byter den storlek medan klippet syns kommer YouTubes rubrik och logga fram)
      if (!on && P.frame && P.st === 1 && !P.dold) return;
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
      // (samtidigt som kameran och rummet, när det nya har ritats: sedan i rum.js)
      (o.sedan || ((k, f) => f()))('hornet', () => {
        for (const e of [kam, inn]) e.classList.toggle('glid', !o.calm());
        kam.style.transform = `translate3d(0px, ${px(s && s.lyft ? -s.lyft : 0)}, 0px) rotateY(${s ? s.horn : 0}deg)`;
        inn.style.perspectiveOrigin = `${px(oga[0])} ${px(oga[1])}`;
      }, !o.calm());
    }

    function tat(on) {
      if (!V.near || on === V.tat) return;
      V.tat = on;
      if (window.RumBak && on) RumBak.fram('rutan', () => tat(false));
      else if (window.RumBak) RumBak.bort('rutan');
      // hörnet ritas skarpt bara här, där rutan fyller bilden: innan
      // kameran går fram, och i halva storleken igen när den har gått
      // tillbaka (i telefonen på höjden inte, vid lådan)
      clearTimeout(V.skarpT);
      if (on) skarp(true);
      else V.skarpT = setTimeout(() => { if (!V.tat && !smal()) skarp(false); }, 900);
      box.classList.toggle('vhs-tat', on);
      root.classList.toggle('vid-tat', on);
      runt(!on);
      sving(on ? SVANG.tat : SVANG.nara);
      if (o.aim) o.aim(on ? TAT : nara());
      utanLada(on && V.cur != null);
      // i telefonen spelar den bara här
      if (!TELEFON.matches) return;
      clearTimeout(V.fortT);
      if (on && V.resume && V.cur != null) {
        V.resume = false;
        if (P.frame) vidare();
        else {
          // (en ny spelare när kameran har kommit fram: det tog minne samtidigt som allt annat)
          lage('laddar', '▶ SPELA');
          V.fortT = setTimeout(resume, 800);
        }
      } else if (!on && V.lage === 'spolar') {
        stilla();
        V.resume = true;
      } else if (!on && P.frame && (V.lage === 'laddar' || (V.lage === 'spelar' && P.st !== 2 && P.st !== 0))) {
        pausa();
        V.resume = true;
      }
    }

    // I telefonen försvinner spelaren när man går från videon – den spelar
    // vidare därifrån när man kommer tillbaka (zoom) – så att rummet har
    // minne att gå hem med. WebKit håller hörnet ritat med en osynlig rörelse
    // (som kvar i rum.js): rummet runt om släpps när kameran står still nära,
    // och utan rörelsen räknade WebKit fel på vad som syns av något som står
    // så snett och släppte kassetterna också.
    function parkera() {
      utanLada(false);
      clearTimeout(V.fortT);
      const s = bandet();
      const dur = P.dur;
      const lag = V.lage;
      stopPlayer(false);
      if (V.cur == null || lag === 'brus') return;
      P.mal = s;
      P.dur = dur;
      lage('stopp', 'STOPP');
      tick();
    }
    // Med en kassett i och rutan i hela fönstret syns inte lådan, tv:ns sidor
    // eller skenet: i telefonen tas de bort när kassetten har åkt in, och
    // kommer tillbaka innan något ska synas där.
    function utanLada(on) {
      clearTimeout(V.ladaT);
      clearTimeout(V.tonaT);
      if (on && (WEBKIT || TELEFON.matches)) {
        // (rummet runt tv:n tonar bort först, när kameran har stannat, som
        // väggen i rum.js gör där, lattVideo)
        V.tonaT = setTimeout(() => box.classList.add('vhs-tona'), 650);
        V.ladaT = setTimeout(() => box.classList.add('utan-lada'), 1100);
      } else box.classList.remove('utan-lada', 'vhs-tona');
    }
    function haller(on) {
      if (!WEBKIT) return;
      if (on && !V.hall) V.hall = box.animate([{ translate: '0px 0px' }, { translate: '0.01px 0px' }], { duration: 1000, iterations: Infinity, direction: 'alternate' });
      else if (!on && V.hall) {
        V.hall.cancel();
        V.hall = null;
      }
    }

    box.addEventListener('click', (e) => {
      if (!V.near) return;
      const ljud = gest();
      const b = e.target.closest('.vhs-kas, [data-vhs]');
      if (!b) {
        // i listan: en rad spelar, rubriken byter sida
        const r = e.target.closest('[data-rad]');
        if (r) insert(Number(r.dataset.rad));
        else if (e.target.closest('.ls-hd')) blad(V.sida ? -1 : 1);
        else if (e.target.closest('.vhs-skarm')) {
          // Trycket på rutan gav ljud, eller startar en spelare som inte har
          // fått börja själv (strömsparläge i iPhone): kameran står kvar.
          if (V.lage === 'laddar' && P.ready && P.st !== 1 && P.st !== 3 && performance.now() - P.laddad > TRYGG) cmd('playVideo');
          else if (!ljud) tat(!V.tat);
        }
        // i telefonen syns bara kanten av tv:n bredvid lådan
        else if (smal() && e.target.closest('.vhs-tv')) tat(true);
        return;
      }
      e.preventDefault();
      // med musen: mellanslaget ska spela, inte trycka på knappen igen
      if (e.detail) b.blur();
      if (b.classList.contains('vhs-kas')) insert(Number(b.dataset.i));
      else if (b.dataset.vhs === 'spela') spela();
      else if (b.dataset.vhs === 'paus') paus();
      else if (b.dataset.vhs === 'stopp') stopp();
      else if (b.dataset.vhs === 'ut') mataUt();
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
      spelare: () => Boolean(P.frame || P.ledig),
      // Nära: kassetterna och knapparna går att trycka på, och videon spelar
      // vidare om den gjorde det när man gick. Svarar med hörnet i scenen.
      // Hur många rätt datorn fick, på den blå rutan när omgången är spelad (null: inget). Den står
      // i listans ställe på håll och försvinner när man går fram, så att kassetterna går att välja.
      datorn(n) {
        const e = box.querySelector('.vhs-dator');
        if (e) e.textContent = n == null ? '' : String(n);
        box.classList.toggle('har-dator', n != null);
      },
      zoom(on) {
        V.near = on;
        box.classList.toggle('vhs-narma', on);
        runt(V.tat && !on, true);
        V.tat = false;
        if (window.RumBak) RumBak.bort('rutan');
        if (on) tavlor();
        box.classList.remove('vhs-tat');
        root.classList.remove('vid-tat');
        sving(on ? SVANG.nara : null);
        for (const s of styr) s.inert = !on;
        haller(on);
        // spolar bandet stannar det; söker det står bilden still, och det
        // spelar därifrån när man kommer tillbaka
        if (!on && V.lage === 'vind') stopp();
        else if (!on && V.lage === 'spolar') {
          stilla();
          V.resume = true;
        } else if (!on && P.frame && (V.lage === 'spelar' || V.lage === 'laddar') && P.st !== 2 && P.st !== 0) {
          pausa();
          V.resume = true;
        } else if (on && V.resume) {
          // (i telefonen med rutan i hela fönstret, när kameran har fått sitt mål)
          if (TELEFON.matches) queueMicrotask(() => tat(true));
          else {
            V.resume = false;
            vidare();
          }
        }
        if (!on && TELEFON.matches) parkera();
        // (på höjden i telefonen skarpt när kameran har stannat vid lådan: hörnet
        // ritades annars om samtidigt som allt annat, och minnet tog slut)
        clearTimeout(V.skarpT);
        if (on && smal()) V.skarpT = setTimeout(() => { if (V.near && smal()) skarp(true); }, 800);
        else if (on) passa();
        return nara();
      },
      // När man är framme: ←/→ (och ett svep i telefonen) som ◀◀ och ▶▶ – utan
      // kassett byter de sida i listan – mellanslaget pausar när den spelar
      // och spelar annars, S stoppar som ■, ↑/↓ byter kassett (i listan) och
      // Esc går tillbaka från rutan till tv:n och lådan. En nedtryckt tangent
      // (upprepad) räknas bara som ett tryck, utom ↑/↓.
      key(k, upprepad) {
        if (upprepad && k !== 'ArrowUp' && k !== 'ArrowDown') return k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 's' || k === 'S';
        gest();
        if (k === 'ArrowRight' || k === 'ArrowLeft') {
          if (V.cur == null) blad(k === 'ArrowRight' ? 1 : -1);
          else spola(k === 'ArrowRight' ? 1 : -1);
        } else if (k === ' ') {
          // på en knapp (med tabben) trycker mellanslaget på knappen
          const a = document.activeElement;
          if (a && box.contains(a) && a.matches('button')) return false;
          spelaPaus();
        } else if (k === 's' || k === 'S') stopp();
        else if (k === 'ArrowDown') step(1);
        else if (k === 'ArrowUp') step(-1);
        else if (k === 'Escape' && V.tat) tat(false);
        else return false;
        return true;
      },
      // Rummet stängs: videon stannar och kassetten ligger kvar på sin plats.
      stop() {
        clearTimeout(V.utT);
        V.utT = 0;
        spara();
        stopPlayer(false);
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
