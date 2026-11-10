// Hasse Backes bild i baren: kameran, baren och disken. Figuren (rum-hasse-3d.js), disken och väggen
// bakom honom (scripts/hasse/bak.html) läser samma mått härifrån, så att de står på samma ställe i bilden.
//
// Figurens värld: 1 enhet = 1 bildpunkt i fotot (ungefär 0,6 mm), x åt höger, y uppåt, z mot betraktaren,
// fotots plan z = 0.
//
// Han sitter vid pultens hörn: samma pult som man står vid i rummet. Pulten går från en, längs ens högra
// sida, fram till hörnet, och viker där av åt vänster förbi honom (benet framför honom). Han sitter på
// andra sidan om benet, med vänsterarmen över hörnet på pulten, där kaffet och notan står (rummets hand,
// kaffe och nota, rum-hasse-hand.js). Kameran är ens öga när man har vänt sig åt vänster: framför honom,
// lite högre än han (man står, han sitter) och så nära att pulten ses uppifrån som i rummet.
//
// Barens egna mått (x längs benet åt höger, z ut ur väggen mot en): p i figurens värld = Ry(BAR)·p.
// Pultens mått (rum-pult.js, samma som rummets) är barens förskjutna längs benet: han sitter vid x = PLATS.
// Pultens arm (HORN) ligger i pultens mått mellan x = HORN.X och HORN.X + HORN.B och går från benets bakre
// kant fram mot en, förbi kameran; i barens mått alltså PLATS längre till vänster, nära ens högra sida.
const DEG = Math.PI / 180;

export const SCEN = {
  // kameran: D från axeln, svängd VRID grader mot hans vänstra sida, ögat HOJD över hans ögonhöjd CY
  // och lutad LUT grader nedåt (han sitter, man står vid pulten). Så högt att pultens arm, som går fram
  // förbi kamerans högra sida, ses uppifrån och ligger vågrät (med ögat 31 cm över hans och 10° lutning såg
  // den ut som en ramp som steg mot hörnet, ändrat 2026-11-08).
  D: 3000,
  CY: 500,
  VRID: 0,
  HOJD: 750,
  LUT: 14,
  // baren: positivt vriden, så att benets högra del går bort från en och pultens arm går fram förbi
  // kamerans högra sida (man har vänt sig lite mindre än en rät vinkel)
  BAR: 8,
  // disken: ovansidan Y, den bakre kanten Z och djupet; väggen bakom honom
  DISK: { Y: -290, Z: 185, DJUP: 900 },
  // pultens arm mot en, i pultens mått: dess vänstra kant och bredden (lika bred som benet, som pulten i rummet)
  HORN: { X: 110, B: 900 },
  VAGG: -1100,
  // var han sitter längs benet, i pultens mått (rum-pult.js): så långt ut mot hörnet att händerna ligger
  // vid geringssnittet, som i rummet. Förut satt han vid x = 0, 27 cm längre in på benet (ändrat 2026-11-09).
  PLATS: 450,
  // Fönstren bakom honom (barens mått), som på baren Bron vid S:t Eriksbron: ett stort glasparti ut mot bron och
  // Fridhemsplan, från bardiskens skiva och upp förbi bildens överkant. Rutorna (X: vänster och höger kant) sitter
  // kant i kant, och karmen (KARM bred, mörkgrå som skyltfönstret i rummet) går runt var och en, så att posterna
  // emellan blir dubbelt så breda. Ingen post står bakom hans huvud. Glaset sitter DJUP in i väggen. Väggen
  // (scripts/hasse/bak.html) och utsikten (rum-hasse-ute.js) läser samma mått.
  FONSTER: { Y0: -278, Y1: 1500, X: [[-4600, -1260], [-1260, 1540], [1540, 4600]], KARM: 34, DJUP: 120 },
};

// Kameran: läget, och axlarna i världen (höger, upp och bakåt; den tittar mot −bak). Rotationen är
// Ry(VRID)·Rx(−LUT), som three.js Euler(−LUT, VRID, 0, 'YXZ').
export function kamera(S = SCEN) {
  const t = S.VRID * DEG;
  const f = S.LUT * DEG;
  const ct = Math.cos(t);
  const st = Math.sin(t);
  const cf = Math.cos(f);
  const sf = Math.sin(f);
  return {
    pos: [S.D * st, S.CY + S.HOJD, S.D * ct],
    hoger: [ct, 0, -st],
    upp: [-st * sf, cf, -ct * sf],
    bak: [st * cf, sf, ct * cf],
    euler: [-f, t, 0],
  };
}

// En punkt i världen i kamerans bild: [u, w, djup], där bildpunkten är (cx + s·u, cy + s·w) när s är
// bildpunkter på en enhet på avståndet D och (cx, cy) är där kamerans axel träffar bilden.
export function iKamera(p, K = kamera()) {
  const d = [p[0] - K.pos[0], p[1] - K.pos[1], p[2] - K.pos[2]];
  const dot = (a) => a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
  const z = -dot(K.bak);
  return [(SCEN.D * dot(K.hoger)) / z, (-SCEN.D * dot(K.upp)) / z, z];
}

// Från barens mått till figurens värld (och tillbaka med −BAR).
export function franBaren(p, vinkel = SCEN.BAR) {
  const b = vinkel * DEG;
  const c = Math.cos(b);
  const s = Math.sin(b);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

// Från pultens mått (rum-pult.js, samma som rummets) till figurens värld: han sitter vid x = PLATS.
export function franPulten(p) {
  return franBaren([p[0] - SCEN.PLATS, p[1], p[2]]);
}

// Diskens bakre plan i figurens värld: n·(x, z) = c, med n (vågrät) ut mot affären. Framför planet
// (n·p > c) ligger disken under ovansidan Y.
export function disken(S = SCEN) {
  const b = S.BAR * DEG;
  return { n: [Math.sin(b), Math.cos(b)], c: S.DISK.Z, Y: S.DISK.Y, djup: S.DISK.DJUP, langs: [Math.cos(b), -Math.sin(b)] };
}

// Väggens bilder (scripts/hasse/bak.html → public/rum/hasse-bak*.webp): W × H bildpunkter, S bildpunkter
// på en enhet på avståndet D, och (px, py) där kamerans axel träffar bilden. Sidan lägger bilden så att
// den passar figuren (passa i rum-hasse.js). Bilden räcker från hjässan och uppåt ned till pulten, och
// till höger om pultens arm ned till fönstrets underkant, i alla fönster från 844 × 390 till 3440 × 1440
// och på höjden från 360 × 780 till 1000 × 1000.
export const BAK = {
  bred: { W: 2025, H: 945, S: 0.45, px: 1193, py: 180 },
  hog: { W: 992, H: 608, S: 0.32, px: 480, py: 128 },
};
