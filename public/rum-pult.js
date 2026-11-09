// Pulten i tobaksaffären: samma pult i rummet och i Hasse Backes bild. Man står vid den i rummet och ser mot
// fönstren; längst till vänster viker den i ett hörn av mot en, förbi Hasse Backe som sitter på andra sidan om
// den (rum-hasse-scen.js). Här finns det som båda bilderna läser, så att det är samma skiva: formen (L:et med
// geringssnittet), träet, framkanten, metallisten längs de bortre kanterna, ringarna efter glas, och rummets
// kamera mot pulten.
//
// - Hasses bild ritar pulten som geometri i hans värld med PULT_GLSL (diskBild i rum-hasse-3d.js).
// - Rummet visar pulten som färdiga bilder (rum/pult.webp, pult-mer.webp och framkanten pult-kant.webp), bakade
//   med samma PULT_GLSL genom rummets kamera (scripts/rum/pult.html), och ringarna ritas ovanpå (rum.js).
//
// Måtten är pultens (rum-hasse-scen.js): x längs benet framför honom (åt höger i hans bild, bort från en i
// rummet), z ut från väggen bakom honom (mot en i hans bild, åt höger i rummet), y uppåt; 1 enhet ≈ 0,6 mm.
// Han sitter vid x = SCEN.PLATS, nära hörnet.
// Benet ligger mellan z = DISK.Z och DISK.Z + DJUP och går fram till x = HORN.X + HORN.B; armen (pulten man står
// vid i rummet) ligger mellan x = HORN.X och HORN.X + HORN.B och går åt höger i rummet. Ovansidan är y = DISK.Y.
import { SCEN } from './rum-hasse-scen.js';

const { DISK, HORN } = SCEN;
// L:et: benets bakre kant (z0) och främre (z1), armens kant mot en (xi) och bortre kant (xo)
export const L = { Y: DISK.Y, z0: DISK.Z, z1: DISK.Z + DISK.DJUP, xi: HORN.X, xo: HORN.X + HORN.B };

// Skivan: tjockleken och framkantens radie (mot en, längs benet och armen), en tjock, mjukt rundad kant;
// metallistens bredd längs de bortre kanterna. Under skivan står framsidan INDRAG längre in, i skugga.
export const SKIVA = { TJOCK: 66, RADIE: 33, ALU: 11, INDRAG: 26 };

// Rummets kamera mot pulten (rum.js, scripts/rum/pult.html): ett öga som står vid pulten och ser mot fönstren,
// rakt fram (barens +x), med horisonten och flyktpunkten där pultens bild alltid har haft dem (cx, cy i scenens
// 1600 × 1000). F: brännvidden i scenens bildpunkter, H: ögat över ovansidan, Z och X: ögats läge i pultens
// mått (x = −Z, z = X). Bortre kanten hamnar på y = 650 och kanten mot en på y = 984, som förut, och hörnet med
// geringssnittet längst till vänster, där kaffet står på hörnet som i hans bild.
export const RUM = { F: 1400, cx: 810, cy: 73.4, Z: 1443.7, H: 1010.6, X: 1642 };
// en punkt i barens mått → rummets scen [x, y], och djupet
export function iRum(x, y, z) {
  const dep = RUM.Z + x;
  return [RUM.cx + (RUM.F * (z - RUM.X)) / dep, RUM.cy + (RUM.F * (RUM.H - (y - L.Y))) / dep, dep];
}
// en punkt i rummets scen → ovansidan i barens mått [x, z]
export function franRum(sx, sy) {
  const dep = (RUM.F * RUM.H) / (sy - RUM.cy);
  return [dep - RUM.Z, RUM.X + ((sx - RUM.cx) * dep) / RUM.F];
}

// Ringarna efter glas: kaffet och ölen har stått på olika ställen olika dagar, och samma ringar syns i båda
// bilderna. [x, z, radie, styrka] i pultens mått. En vid armens bortre kant strax till höger om hörnet (i rummet
// ovanför kupongen, i hans bild bakom notan), en på hörnet nära dess yttre spets, fyra längre bort på armen (i
// rummet; de flesta under kupongen eller vid askkoppen) och två på benet framför honom (bara i hans bild).
export function ringar(dag = Math.floor(Date.now() / 86400000)) {
  let h = (dag * 7 + 11) % 2147483647 || 1;
  const s = () => { h = (h * 16807) % 2147483647; return (h - 1) / 2147483646; };
  const ring = (x0, x1, z0, z1, r0 = 44, r1 = 60) => [x0 + s() * (x1 - x0), z0 + s() * (z1 - z0), r0 + s() * (r1 - r0), 0.24 + s() * 0.2];
  return [
    ring(880, 935, 1150, 1450, 44, 56),
    ring(700, 880, 290, 520),
    ...[[1000, 1400], [1400, 1800], [1800, 2200], [2200, 2550]].map(([z0, z1]) => ring(230, 900, z0, z1)),
    ring(-1050, -550, 300, 880),
    ring(-350, -110, 300, 640),
  ];
}
export const NRING = 8;

// Träet, i GLSL: pultTra(b) är träets färg i punkten b = (x, z) på ovansidan, i barens mått, utan ljus.
// Brunt, matt trä som ådras längs benet och längs armen och möts i ett geringssnitt från det inre hörnet till det
// yttre, fläckigt och slitet, med ringarna (uRing) mörka i ytan. pultKant(b) är avståndet till de bortre kanterna,
// där metallisten ligger. Läsaren deklarerar inget själv: uRing kommer härifrån.
export const PULT_GLSL = `
uniform vec4 uRing[${NRING}];
float pultH2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float pultNz(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(pultH2(i), pultH2(i + vec2(1, 0)), f.x), mix(pultH2(i + vec2(0, 1)), pultH2(i + vec2(1, 1)), f.x), f.y); }
float pultFbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * pultNz(p); p = p * 2.03 + 11.; a *= .5; } return s; }
const float PULT_XI = ${L.xi.toFixed(1)}, PULT_XO = ${L.xo.toFixed(1)}, PULT_Z0 = ${L.z0.toFixed(1)}, PULT_Z1 = ${L.z1.toFixed(1)};
// armen (pulten i rummet) eller benet: geringssnittet går från det inre hörnet till det yttre
float pultGer(vec2 b) { return (b.x - PULT_XI) - (PULT_Z1 - b.y); }
bool pultArm(vec2 b) { return b.x >= PULT_XI && b.y <= PULT_Z1 ? pultGer(b) > 0. : b.y > PULT_Z1; }
// avståndet till de bortre kanterna (bakom honom, och armens bortre)
float pultKant(vec2 b) { return min(b.y - PULT_Z0, b.x > PULT_XI ? PULT_XO - b.x : 1e4); }
vec3 pultTra(vec2 b) {
  bool arm = pultArm(b);
  vec2 pl = arm ? vec2(b.y, PULT_XO - b.x) : vec2(b.x, b.y);
  vec2 g = vec2(pl.x * .0026, pl.y * .02);
  float a = pultFbm(g * vec2(1., 2.2)), bb = pultFbm(g * vec2(.7, 8.) + 3.), c2 = pultFbm(pl * vec2(.012, .06) + 17.);
  vec3 tra = mix(vec3(.35, .25, .17), vec3(.49, .36, .25), a);
  tra *= .85 + .26 * bb;
  tra *= .92 + .12 * c2;
  // fläckar och slitage
  float fl = pultFbm(b * vec2(.0042, .0061) + 41.);
  tra *= 1. - .22 * smoothstep(.55, .75, fl);
  // geringssnittet: en mörk fog, med en ljus kant där lamporna fångas
  float ge = pultGer(b);
  if (b.x > PULT_XI - 40. && b.y < PULT_Z1 + 40.) tra *= (1. - .5 * exp(-ge * ge / 7.)) * (1. + .12 * exp(-pow((ge - 3.4) / 1.6, 2.)));
  // (närmare en än armens kant, där pulten bara syns i telefonen: benet och armen möts i en rak fog)
  if (b.x < PULT_XI) tra *= 1. - .5 * exp(-pow(b.y - PULT_Z1, 2.) / 7.);
  // ringarna efter glas: en mörk ring och en svagare innanför, som där glasets fot har stått
  for (int i = 0; i < ${NRING}; i++) {
    vec4 r = uRing[i];
    if (r.z <= 0.) continue;
    float d = length(b - r.xy) - r.z;
    float m = r.w * exp(-d * d / 6.) + r.w * .5 * exp(-pow(d + 5.5, 2.) / 2.2) + r.w * .14 * exp(min(d, 0.) / 9.) * step(d, 0.);
    tra = mix(tra, vec3(.075, .04, .02), clamp(m, 0., .9));
  }
  return tra;
}
`;
