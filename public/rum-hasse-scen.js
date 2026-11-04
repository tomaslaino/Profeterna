// Hasse Backes bild i baren: kameran, baren och disken. Figuren (rum-hasse-3d.js), disken och väggen
// bakom honom (scripts/hasse/bak.html) läser samma mått härifrån, så att de står på samma ställe i bilden.
//
// Figurens värld: 1 enhet = 1 bildpunkt i fotot (ungefär 0,6 mm), x åt höger, y uppåt, z mot betraktaren,
// fotots plan z = 0. Kameran ser snett längs baren åt vänster: baren är vriden BAR grader och kameran
// VRID grader åt andra hållet runt samma lodräta axel (x = 0, z = 0), så att baren ses ungefär 27° från
// sidan men han, som har vridit sig ut mot affären, bara 12°. Kroppen är ett foto taget framifrån och
// tål inte mycket mer.
//
// Barens egna mått (x längs baren åt höger, z ut ur väggen mot affären): p i figurens värld = Ry(BAR)·p.
const DEG = Math.PI / 180;

export const SCEN = {
  // kameran: D från axeln, svängd VRID grader mot hans vänstra sida, ögat HOJD över hans ögonhöjd CY
  // och lutad LUT grader nedåt (han sitter, man står vid pulten)
  D: 3900,
  CY: 500,
  VRID: 12,
  HOJD: 170,
  LUT: 2.5,
  // baren: negativt vriden, så att dess högra del (mot affären) är närmare
  BAR: -15,
  // disken i barens mått: ovansidan Y, den bakre kanten Z och djupet; väggen bakom honom
  DISK: { Y: -290, Z: 185, DJUP: 1000 },
  VAGG: -1100,
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

// Diskens bakre plan i figurens värld: n·(x, z) = c, med n (vågrät) ut mot affären. Framför planet
// (n·p > c) ligger disken under ovansidan Y.
export function disken(S = SCEN) {
  const b = S.BAR * DEG;
  return { n: [Math.sin(b), Math.cos(b)], c: S.DISK.Z, Y: S.DISK.Y, djup: S.DISK.DJUP, langs: [Math.cos(b), -Math.sin(b)] };
}

// Väggens bilder (scripts/hasse/bak.html → public/rum/hasse-bak*.webp): W × H bildpunkter, S bildpunkter
// på en enhet på avståndet D, och (px, py) där kamerans axel träffar bilden. Sidan lägger bilden så att
// den passar figuren (passa i rum-hasse.js). Bilden räcker från hjässan och uppåt ned till disken, i
// alla fönster från 844 × 390 till 3440 × 1440 och på höjden från 360 × 780 till 1000 × 1000.
export const BAK = {
  bred: { W: 1900, H: 760, S: 0.4, px: 1120, py: 180 },
  hog: { W: 1040, H: 608, S: 0.32, px: 512, py: 144 },
};
