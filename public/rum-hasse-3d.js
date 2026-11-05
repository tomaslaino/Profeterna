// Hasse Backe i tobaksaffären (rum-hasse.js), i three.js: han sitter bakom bardisken och har vridit sig ut
// mot affären och mot en, med underarmarna på disken, kaffet och notan vid den vänstra handen och cigarren
// i askkoppen vid den högra. Kameran ser snett längs baren åt vänster (rum-hasse-scen.js).
// Kostymfotot (C More Entertainment, CC BY 3.0, Wikimedia Commons) ligger på en formad yta, så att huvudet vrids på riktigt runt nacken och kroppen lutar sig
// fram. Ögon, bryn och mun rör sig i skuggaren. Armarna, händerna, koppen, askkoppen, cigarren och röken
// finns i rum-hasse-arm.js.
//
// Disken är geometri i hans värld, snett som baren, och ritas en gång på en egen duk under figuren
// (diskBild): lackat trä som speglar väggen bakom honom (bilden från scripts/hasse/bak.html), en list i
// aluminium som pultens, och notan. Det som är under disken eller skyms av den döljs i skuggarna
// (BORD_GLSL), så att kroppen slutar vid diskens bakre kant och det som ligger på disken trycks mot den.
// Skuggorna på disken är räknade kapslar, utan skuggkarta.
//
// Världen: 1 enhet = 1 bildpunkt i fotot, x = fotots x − 660, y = 900 − fotots y, z mot betraktaren.
//
// figuren(duk, { hog, latt, pr }) → { kamera(v), diskBild(duk2d, v, bak), rita(T, n, tal, mun), handelser(T0, T1), info(), borta() }
// Klipp: T 0–12,4 (vila, skrattet, domen, gesterna, hem), och sedan ett klipp i taget på var sin bit av
// tidslinjen (KLIPP): fler sätt att slå domen i disken, kaffet (sex sätt) och cigarren.
import * as THREE from 'three';
import { ATLAS, LJUS, ARM, KAMERA, BORD_GLSL, CIGARR, ASKKOPP, laddaFoto, laddaHand, byggArm, byggKopp, byggCigarr, byggAskkopp, byggRok } from './rum-hasse-arm.js';
import { SCEN, BAK, kamera as scenKamera, iKamera, disken, franBaren } from './rum-hasse-scen.js';

const DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const spar = (k, t) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ss(k[i - 1][0], k[i][0], t);
  return k[k.length - 1][1];
};

// ---------- klippen ----------
// Rörelserna är klipp på en tidslinje (rum-hasse.js spelar dem): fran–till, och där han står efteråt
// (vila: 0 är vilan, 5,5 när han pratar). fri: får börja var som helst, skynda: läggs undan fortare
// när något annat väntar, grupp: sidan lottar bland klippen i gruppen (domen, kaffet, cigarren, talet).
// dunk: [tid i klippet, styrka, sort] när handen slår i disken, dom: när domen slås i disken (det
// starkaste slaget), ned: [tid, styrka] när koppen ställs tillbaka på fatet.
export const KLIPP = {
  // armarna upp, skrattet och slaget
  slag: { fran: 2.5, till: 5.5, vila: 5.5, fri: true, grupp: 'dom', dunk: [[2.5, 1, 'hand']] },
  // fingret, handen som hackar, armen ut
  armar: { fran: 5.5, till: 9.95, vila: 5.5 },
  // nöjd, ögonen igen, tillbaka
  hem: { fran: 9.95, till: 12.4, vila: 0 },
  // kaffet: en klunk, och sedan smackar han och säger mmm med huvudet som vaggar
  klunk: { fran: 20, till: 27, vila: 0, grupp: 'kaffe', ned: [[6.35, 0.32]] },
  // cigarren ur askkoppen, två bloss, röken ut och tillbaka
  cigarr: { fran: 30, till: 40, vila: 0, skynda: true, grupp: 'cigarr' },
  // tyst, knyter näven, håller den uppe och slår den i disken
  naven: { fran: 50, till: 53.8, vila: 5.5, fri: true, grupp: 'dom', dunk: [[1.72, 1.2, 'nave']] },
  // tre slag med handflatan, det sista hårdast: så – är – det
  treslag: { fran: 55, till: 59.6, vila: 5.5, fri: true, grupp: 'dom', dunk: [[0.62, 0.5, 'hand'], [1.14, 0.7, 'hand'], [1.98, 1.15, 'hand']] },
  // båda händerna upp och ned i disken samtidigt
  bada: { fran: 60, till: 64, vila: 5.5, fri: true, grupp: 'dom', dunk: [[1.22, 1.45, 'bada']] },
  // pekfingret i luften, och sedan handflatan i disken
  fingret: { fran: 65, till: 69.6, vila: 5.5, fri: true, grupp: 'dom', dunk: [[1.86, 1.05, 'hand']] },
  // medan han pratar: handflatan i disken vid ett bestämt ord
  dunka: { fran: 70, till: 71.9, vila: 5.5, start: 5.5, dunk: [[0.62, 0.75, 'hand']] },
  // kaffet: blåser på det, smakar, bränner sig nästan, och en riktig klunk och ett långt ah
  blasa: { fran: 75, till: 84.1, vila: 0, grupp: 'kaffe', ned: [[8.5, 0.3]] },
  // kaffet: tittar ned i koppen, snurrar den, dricker ur den i ett svep och ställer ned den med en smäll
  titta: { fran: 85, till: 94, vila: 0, grupp: 'kaffe', ned: [[7.55, 0.75]] },
  // cigarren: ett bloss, och röken i en tunn stråle ur mungipan medan han tittar på en
  bloss: { fran: 95, till: 103, vila: 0, skynda: true, grupp: 'cigarr' },
  // cigarren: ett bloss och tre rökringar, som han tittar efter
  ringar: { fran: 105, till: 116, vila: 0, skynda: true, grupp: 'cigarr' },
  // cigarren: knackar av askan över askkoppen, ett bloss och röken ut genom näsan
  aska: { fran: 120, till: 131, vila: 0, skynda: true, grupp: 'cigarr' },
  // kaffet: drar in doften under näsan så att bröstet häver sig, och en liten klunk
  dofta: { fran: 135, till: 144.2, vila: 0, grupp: 'kaffe', ned: [[8.55, 0.3]] },
  // kaffet: skålar med en, en stor klunk och koppen ned med en smäll
  skal: { fran: 150, till: 158.5, vila: 0, grupp: 'kaffe', ned: [[7.25, 0.8]] },
  // kaffet: lillfingret ut, näsan i vädret och två små läppjanden, som en vinprovare
  fint: { fran: 160, till: 168.8, vila: 0, grupp: 'kaffe', ned: [[8.1, 0.18]] },
};
for (const k of Object.values(KLIPP)) {
  if (k.dunk) k.dom = k.fran + k.dunk.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// ---------- figuren ----------

export { KAMERA, SCEN, BAK };
export const D = KAMERA.CZ;
const KAM = scenKamera();
const DK = disken();
// diskens bakre kant: dess z vid x
const kantZ = (x) => (DK.c - DK.n[0] * x) / DK.n[1];
// Disken: ovansidan (y), och den bakre kanten (z) mitt framför honom.
export const BORD = { Y: DK.Y, Z: kantZ(0) };
// Armarna på disken: armbågens och handledens höjd.
export const VILA = { EH: BORD.Y + 78, WH: BORD.Y + 42 };
// Koppen på sitt fat och notan under fatet, till höger om hans vänstra hand; askkoppen till vänster om
// hans högra hand. På disken, i figurens värld.
export const KOPP = [352, BORD.Y, 790];
export const ASK = [-345, BORD.Y, 700];
// En punkt i världen i fönstret: (cx, ey) är där kamerans axel träffar fönstret och s bildpunkter på en
// enhet på avståndet D.
export function iBild(v, x, y, z = 0) {
  const [u, w] = iKamera([x, y, z], KAM);
  return [v.cx + v.s * u, v.ey + v.s * w];
}
// Det som ska rymmas: hjässan, och allt som rör sig (armarna i gesterna, koppen när han dricker,
// händerna, koppen, askkoppen och skuggorna på disken). Gesten där armen går ut åt sidan är smalare på höjden.
export const MATT = {
  topp: [0, 772, 120],
  // hans bredd i vila (ärmarna), till samtalet bredvid honom
  vanster: [-470, -200, 300],
  hoger: [470, -200, 340],
  ram: (hog) => [[hog ? -640 : -790, 860, 330], [660, 860, 330], [hog ? -640 : -790, BORD.Y, 330], [-260, BORD.Y, 1000],
    [KOPP[0] + 190, BORD.Y, KOPP[2] + 60], [KOPP[0] - 60, BORD.Y + 150, KOPP[2] + 150], [ASK[0] - 140, BORD.Y, ASK[2] + 120]],
};
// fotot: urklippt, armarna borta, ljuset anpassat (bakat ur originalet)
const X0 = 280;
const Y0 = 130;
const TW = 860;
const W_ = (x, y, z = 0) => new THREE.Vector3(x - 660, 900 - y, z);
const P_ = (x, y, z) => [x - 660, 900 - y, z];
const g2 = (x, y, cx, cy, sx, sy) => { const a = (x - cx) / sx; const b = (y - cy) / sy; return Math.exp(-(a * a + b * b)); };
const smax = (a, b, k = 34) => { const h = clamp(0.5 + 0.5 * (a - b) / k); return b + (a - b) * h + k * h * (1 - h); };
// formen: huvudet som en ellipsoid med ansiktets drag ur fotots mått (Vision), halsen och bålen
function djup(x, y) {
  const hx = (x - 660) / 182;
  const hy = (y - 385) / 240;
  const dh = hx * hx + hy * hy;
  let zh = dh < 2.4 ? 70 : -400;
  if (dh < 1) {
    zh = 70 + 170 * Math.sqrt(1 - dh);
    zh += 40 * g2(x, y, 662, 432, 17, 52) + 26 * g2(x, y, 662, 464, 24, 17) + 7 * g2(x, y, 632, 468, 14, 14) + 7 * g2(x, y, 692, 468, 14, 14);
    zh += -22 * g2(x, y, 608, 391, 34, 15) - 22 * g2(x, y, 716, 392, 34, 15);
    zh += 9 * g2(x, y, 603, 360, 50, 14) + 9 * g2(x, y, 727, 362, 50, 14);
    zh += 10 * g2(x, y, 570, 452, 48, 40) + 10 * g2(x, y, 752, 452, 48, 40);
    zh += 8 * g2(x, y, 662, 495, 42, 10) + 9 * g2(x, y, 662, 520, 36, 8) - 6 * g2(x, y, 662, 541, 34, 8) + 13 * g2(x, y, 660, 573, 46, 22);
  }
  let zn = -400;
  const nx = (x - 650) / 130;
  if (Math.abs(nx) < 1 && y > 520 && y < 760) zn = 40 + 100 * Math.sqrt(1 - nx * nx);
  const tx = (x - 715) / 360;
  let zt = y > 620 ? (x - 715) * 0.14 : -400;
  if (Math.abs(tx) < 1 && y > 620) {
    const rz = 165 * (0.42 + 0.58 * ss(640, 860, y));
    zt = rz * Math.sqrt(1 - tx * tx) + (x - 715) * 0.14;
    const v = clamp(1 - (y - 660) / 600);
    const c = 690 - (y - 660) * 0.33;
    const b = 150 * v;
    const inne = 1 - ss(b * 0.8, b + 6, Math.abs(x - c));
    zt += -14 * inne + 8 * inne * g2(x, y, c, y, 26, 400);
  }
  return Math.max(40, smax(smax(zh, zn), zt));
}

export async function figuren(duk, { hog = false, latt = false, pr = 1 } = {}) {
  const r = new THREE.WebGLRenderer({ canvas: duk, alpha: true, antialias: !latt, powerPreference: latt ? 'default' : 'high-performance' });
  r.setPixelRatio(pr);
  r.setClearColor(0, 0);
  const S = new THREE.Scene();
  // kameran ser snett längs baren (rum-hasse-scen.js); den bortre gränsen räcker till diskens bortre ände
  const C = new THREE.PerspectiveCamera(30, 1, 200, 30000);
  C.position.fromArray(KAM.pos);
  C.rotation.set(KAM.euler[0], KAM.euler[1], 0, 'YXZ');
  C.updateMatrixWorld();
  // disken i skuggarna: dess bakre plan och ovansidan
  const bord = { value: new THREE.Vector4(DK.n[0], DK.n[1], DK.c, DK.Y), butik: { value: 1 } };
  const [foto, handModell] = await Promise.all([laddaFoto(), laddaHand()]);
  // ytan: tätare kring huvudet, och bara ned till disken
  const nx = latt ? 88 : 128;
  const Xs = Array.from({ length: nx }, (_, i) => X0 + (i / (nx - 1)) * TW);
  const Ys = [];
  for (let y = Y0; y < 720; y += latt ? 8 : 5.2) Ys.push(y);
  for (let y = 720; y <= 1350; y += latt ? 26 : 17) Ys.push(y);
  const ny = Ys.length;
  const pos = new Float32Array(nx * ny * 3);
  const uvs = new Float32Array(nx * ny * 2);
  const aW = new Float32Array(nx * ny);
  const aAx = new Float32Array(nx * ny * 2);
  for (let j = 0, o = 0; j < ny; j++) for (let i = 0; i < nx; i++, o++) {
    const x = Xs[i];
    const y = Ys[j];
    pos[o * 3] = x - 660;
    pos[o * 3 + 1] = 900 - y;
    pos[o * 3 + 2] = djup(x, y);
    uvs[o * 2] = x;
    uvs[o * 2 + 1] = y;
    const hd = Math.hypot((x - 660) / 215, (y - 385) / 270);
    aW[o] = Math.max(1 - ss(0.95, 1.22, hd), (1 - ss(585, 680, y)) * (1 - ss(100, 165, Math.abs(x - 650))));
    aAx[o * 2] = g2(x, y, 420, 780, 170, 130);
    aAx[o * 2 + 1] = g2(x, y, 975, 790, 170, 130);
  }
  const idx = [];
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i;
    const b = a + 1;
    const c = a + nx;
    const d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const G = new THREE.BufferGeometry();
  G.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  G.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  G.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
  G.setAttribute('aAx', new THREE.BufferAttribute(aAx, 2));
  G.setIndex(idx);
  G.computeVertexNormals();
  const U = {
    foto: { value: foto }, uHuvud: { value: new THREE.Matrix3() }, uPiv: { value: W_(650, 650, 40) }, uKropp: { value: new THREE.Matrix4() }, uAx: { value: new THREE.Vector2() }, uAndas: { value: 0 },
    blund: { value: 0 }, kis: { value: 0 }, munn: { value: 0 }, rund: { value: 0 }, le: { value: 0 }, bryn: { value: new THREE.Vector2() }, blick: { value: new THREE.Vector2() },
    uArm: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uBord: bord, uButik: bord.butik,
  };
  const yta = new THREE.Mesh(G, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
    vertexShader: `attribute float aW; attribute vec2 aAx; uniform mat3 uHuvud; uniform vec3 uPiv; uniform mat4 uKropp; uniform vec2 uAx; uniform float uAndas; uniform vec3 uArm[6];
    varying vec2 vQ; varying vec3 vN, vN0, vW; varying float vAo;
    float seg3(vec3 p, vec3 a, vec3 b) { vec3 ab = b - a; return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.)); }
    void main(){ vec3 p = position; vec3 n = normal; vN0 = n; vQ = uv;
      p.y += aAx.x * uAx.x + aAx.y * uAx.y; p.x += aAx.x * -uAx.x * .25 + aAx.y * uAx.y * .25;
      float bar = (1. - aW) * smoothstep(620., 300., abs(p.y + 100.));
      p.z += uAndas * bar; p.y += uAndas * .5 * bar;
      vec3 h = uPiv + uHuvud * (p - uPiv); p = mix(p, h, aW);
      n = normalize(mix(n, uHuvud * n, aW));
      vec4 w = uKropp * vec4(p, 1.); vN = mat3(uKropp) * n; vW = w.xyz;
      // armarna skuggar kroppen
      float dA = min(seg3(w.xyz, uArm[0], uArm[1]), seg3(w.xyz, uArm[1], uArm[2]));
      float dB = min(seg3(w.xyz, uArm[3], uArm[4]), seg3(w.xyz, uArm[4], uArm[5]));
      vAo = exp(-pow(max(0., dA - 80.) / 80., 2.)) * .3 + exp(-pow(max(0., dB - 80.) / 80., 2.)) * .3;
      gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform sampler2D foto; uniform float blund, kis, munn, rund, le; uniform vec2 bryn, blick; varying vec2 vQ; varying vec3 vN, vN0, vW; varying float vAo;
    ${LJUS}
    ${BORD_GLSL}
    const vec2 O0 = vec2(${X0}., ${Y0}.), TS = vec2(${ATLAS.W}., ${ATLAS.H}.);
    float g(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
    float seg2(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.)); }
    // ögat: locken är kurvor; blinkningen drar ned huden ovanför, blicken flyttar bara det som är inne i ögat
    vec2 oga(vec2 q, vec2 c, float hw, float b, float ks, vec2 bl, inout float frans) {
      float x = (q.x - c.x) / hw;
      float pr = max(0., 1. - x * x);
      float yU = c.y - 7.5 * pr, yL = c.y + 6.5 * pr;
      float yUb = mix(yU, yL - .4, b), yLb = mix(yL, c.y + 1.5, ks);
      float win = 1. - smoothstep(.92, 1.3, abs(x));
      float yy = q.y;
      float inne = smoothstep(yUb - .4, yUb + 1.2, yy) * (1. - smoothstep(yLb - 1.2, yLb + .4, yy)) * (1. - smoothstep(.9, 1., abs(x)));
      frans = max(frans, b * win * exp(-pow((yy - yUb) / 1.5, 2.)));
      float top = c.y - 23.;
      if (yy < yUb && yy > top) q.y = mix(yy, top + (yy - top) * (yU - top) / (yUb - top), win);
      float bot = c.y + 20.;
      if (yy > yLb && yy < bot) q.y = mix(yy, bot - (bot - yy) * (bot - yL) / (bot - yLb), win);
      q -= bl * inne * pr;
      return q;
    }
    void main(){
      if (underBord(vW)) discard;
      vec2 q = vQ;
      vec2 q0 = q;
      // (atlasens högra kant: där börjar ärmens remsa, som annars blöder in när han ses snett)
      if (q0.x > ${X0 + TW - 6}.) discard;
      float frans = 0., inre = 0., lipp = 0., n01 = 0., dx = 0., xn = 0., uU = 0., uL = 0., A = 0.;
      // bara där det finns ett ansikte
      bool ansikte = q.y > 300. && q.y < 700. && abs(q.x - 660.) < 215.;
      if (ansikte) {
      // leendet: mungiporna ut och upp, kinderna följer med
      q += le * vec2(7., 9.) * g(q, vec2(613., 505.), vec2(38.));
      q += le * vec2(-7., 9.) * g(q, vec2(711., 505.), vec2(38.));
      q.y += le * 6. * (g(q, vec2(585., 450.), vec2(42.)) + g(q, vec2(740., 450.), vec2(42.)));
      // brynen: flyttar pannan men aldrig ögat
      float grind = 1. - smoothstep(361., 372., q.y);
      q.y += bryn.x * 10. * g(q, vec2(599., 356.), vec2(66., 24.)) * grind;
      q.y += bryn.y * 10. * g(q, vec2(727., 358.), vec2(66., 24.)) * grind;
      q = oga(q, vec2(608.5, 391.), 24., blund, kis, blick, frans);
      q = oga(q, vec2(717., 392.), 24., blund, kis, blick, frans);
      // munnen: en lins mellan läpparna; underläppen och hakan följer med ned
      const vec2 MC = vec2(662., 508.5);
      float W = 50. + le * 9. - rund * 16.;
      dx = q.x - MC.x;
      xn = dx / W;
      float prm = max(0., 1. - xn * xn);
      A = munn * (31. + rund * 5.);
      float a = A * pow(prm, .78);
      uU = a * .27; uL = a * .73;
      float y0 = MC.y - le * 4. * xn * xn;
      float d = q.y - y0;
      inre = smoothstep(-1., .4, d + uU) * (1. - smoothstep(-.4, 1., d - uL)) * smoothstep(.2, .8, A) * (1. - smoothstep(.96, 1., abs(xn)));
      n01 = clamp((d + uU) / max(.1, uU + uL), 0., 1.);
      lipp = exp(-pow(min(abs(d + uU), abs(d - uL)) / 3., 2.)) * smoothstep(.5, 3., A) * (1. - smoothstep(.9, 1.2, abs(xn)));
      if (d < -uU) { float t = clamp((-d - uU) / 26., 0., 1.); q.y += uU * (1. - t) * (1. - t); }
      else if (d > uL) {
        float ty = d - uL;
        float J = A * .73 * (1. - smoothstep(58., 135., abs(dx)));
        float sh = mix(uL, J, smoothstep(0., 26., ty)) * (1. - smoothstep(92., 170., ty));
        q.y -= sh;
      }
      }
      vec4 c = texture2D(foto, vec2((q.x - O0.x) / TS.x, 1. - (q.y - O0.y) / TS.y));
      // Sidorna nedtill är där armarna satt i fotot: där är klippet ojämnt, så kroppen slutar i en
      // mjuk linje (ärmarna ligger framför).
      if (q0.y > 1030.) c *= 1. - smoothstep(-2.5, 2.5, q0.x - (952. - (q0.y - 1030.) * .12));
      if (q0.y > 1300.) c *= smoothstep(-2.5, 2.5, q0.x - (360. + (q0.y - 1300.) * .12));
      if (c.a < .02) discard;
      // munnen inifrån: mörkt, övre tandraden, tungan längst ned
      if (inre > .001) {
        float h = uU + uL;
        vec3 m = mix(vec3(.17, .055, .05), vec3(.07, .02, .02), smoothstep(.15, .85, n01));
        float tb = min(15. / max(h, 1.), .62);
        float tu = 1. - smoothstep(tb - .06, tb + .04, n01 - .1 * xn * xn + .018 * sin(dx * .55));
        float gap = abs(fract(dx / 11.5 + .5) - .5);
        vec3 tand = vec3(.82, .775, .66) * (.66 + .34 * smoothstep(0., .2, n01)) * mix(1., .36, pow(abs(xn), 1.8)) * (1. - .3 * (1. - smoothstep(.012, .045, gap + .01 * sin(dx * .9))));
        m = mix(m, tand, tu * smoothstep(3., 9., h));
        float tungan = exp(-pow(xn / .62, 2.) - pow((n01 - 1.) / .42, 2.)) * smoothstep(14., 26., h);
        m = mix(m, vec3(.47, .19, .18), tungan * .9);
        m *= mix(1., .55, pow(abs(xn), 3.));
        c.rgb = mix(c.rgb, m * c.a, inre);
      }
      // läpparna: rödare och skuggade närmast öppningen
      c.rgb *= mix(vec3(1.), vec3(.74, .5, .47), lipp * (1. - inre));
      c.rgb *= 1. - .62 * frans;
      // vecken från näsan till mungiporna när han ler
      if (ansikte && le > .01) {
        float vk = min(seg2(q0, vec2(634., 462.), vec2(598., 522.)), seg2(q0, vec2(690., 462.), vec2(726., 522.)));
        c.rgb *= 1. - .2 * le * exp(-vk * vk / 28.);
      }
      // samma ljus som på armarna
      vec3 n = normalize(vN);
      vec3 r = mix(vec3(1.), ljus(n) / fotoLjus(normalize(vN0)), .82);
      vec3 ut = c.rgb * r;
      ut *= 1. - min(.5, vAo);
      ut += kant(n, .3) * c.a;
      gl_FragColor = vec4(ton(ut), c.a); }`,
  }));
  yta.frustumCulled = false;
  S.add(yta);
  // armarna (rum-hasse-arm.js). Kroppen får inte skymma dem: djupet börjar om efter kroppen.
  yta.renderOrder = 1;
  yta.onAfterRender = (re) => re.clearDepth();
  const A = byggArm(S, 1, foto, handModell, 0.94, bord);
  const B = byggArm(S, -1, foto, handModell, 1, bord);
  // koppen på sitt fat, till höger om hans vänstra hand
  const K = byggKopp(bord);
  const kopp = K.kopp;
  kopp.position.set(KOPP[0], KOPP[1] + 11, KOPP[2]);
  kopp.rotation.y = -0.5;
  K.fat.position.set(KOPP[0], KOPP[1] + 0.5, KOPP[2]);
  S.add(kopp, K.fat);
  // askkoppen till vänster om hans högra hand, med cigarren i urtaget som pekar åt höger och lite
  // mot en: huvudet ligger på disken, glöden över askkoppens mitt och röken stiger därifrån
  const ASKV = 0.35;
  const ask = byggAskkopp(bord);
  ask.mesh.position.fromArray(ASK);
  const ASKV3 = ask.mesh.position;
  ask.mesh.rotation.y = -ASKV;
  const cig = byggCigarr(bord);
  cig.mesh.matrixAutoUpdate = false;
  const rok = byggRok(latt ? 200 : 280, bord);
  S.add(ask.mesh, cig.mesh, rok.mesh);
  // skuggorna på disken: kapslar som faller bakåt och åt höger, ingen skuggkarta
  const NK = 9;
  const kapA = Array.from({ length: NK }, () => new THREE.Vector4());
  const kapH = Array.from({ length: NK }, () => new THREE.Vector2());
  const skuggGeo = new THREE.BufferGeometry();
  {
    // diskens ovansida
    const z0 = SCEN.DISK.Z;
    const z1 = z0 + SCEN.DISK.DJUP;
    const h = [[-3000, z0], [3000, z0], [-3000, z1], [3000, z1]].flatMap(([x, z]) => franBaren([x, BORD.Y, z]));
    skuggGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(h), 3));
    skuggGeo.setIndex([0, 2, 1, 1, 2, 3]);
  }
  const skugga = new THREE.Mesh(skuggGeo, new THREE.ShaderMaterial({
    uniforms: { uKap: { value: kapA }, uKapH: { value: kapH } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: 'varying vec3 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `precision highp float; uniform vec4 uKap[${NK}]; uniform vec2 uKapH[${NK}]; varying vec3 vP;
    float seg(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; return length(p - a - ab * clamp(dot(p - a, ab) / max(dot(ab, ab), 1.), 0., 1.)); }
    void main() {
      float ljus = 1.;
      for (int i = 0; i < ${NK}; i++) {
        float r = uKapH[i].x, h = uKapH[i].y;
        if (r <= 0.) continue;
        float d = max(0., seg(vP.xz, uKap[i].xy, uKap[i].zw) - r * .4);
        float rd = r * .72 + h * .34;
        ljus *= 1. - .78 * exp(-d * d / (rd * rd)) / (1. + h * .012);
        vec2 of = vec2(.42, -.55) * (h + r);
        d = max(0., seg(vP.xz - of, uKap[i].xy, uKap[i].zw) - r * .3);
        rd = r * .85 + h * .55;
        ljus *= 1. - .34 * exp(-d * d / (rd * rd)) / (1. + h * .006);
      }
      gl_FragColor = vec4(0., 0., 0., 1. - ljus);
    }`,
  }));
  // (först: kroppen slutar vid diskens kant, och skuggorna ligger framför den)
  skugga.renderOrder = 0.5;
  skugga.frustumCulled = false;
  S.add(skugga);
  // kroppen nära disken skuggar dess bakre kant
  kapA[6].set(-330, kantZ(-330) + 10, 330, kantZ(330) + 10);
  kapH[6].set(64, 26);
  // ---------- disken (diskBild) ----------
  // Geometri i barens mått (x längs baren), vriden som baren: ovansidan i lackat trä, framkanten med en
  // list i aluminium som pultens och framsidan nedanför. Den ritas en gång på en egen duk under figuren.
  // Lacken speglar väggen bakom honom: den speglade strålen träffar väggen, och där hämtas färgen ur
  // väggens bild (samma kamera), suddigare ju längre strålen går. Han själv speglas som en mörk form.
  const SD = new THREE.Scene();
  const LR = 17;
  const diskU = {
    uBak: { value: null }, uBakRam: { value: new THREE.Vector4(0, 0, 1, 1) }, uBakSt: { value: new THREE.Vector2(1, 1) },
    uKr: { value: new THREE.Vector3(...KAM.hoger) }, uKu: { value: new THREE.Vector3(...KAM.upp) }, uKb: { value: new THREE.Vector3(...KAM.bak) }, uD: { value: D },
    uNb: { value: new THREE.Vector2(DK.n[0], DK.n[1]) }, uVagg: { value: SCEN.VAGG + 180 }, uButik: bord.butik,
  };
  const diskG = new THREE.BufferGeometry();
  {
    const { Y, Z, DJUP } = SCEN.DISK;
    const X = 9000;
    const zf = Z + DJUP;
    const pos = [];
    const nor = [];
    const del = [];
    const idx = [];
    const quad = (a, b, c, d, n, k) => {
      const o = pos.length / 3;
      for (const q of [a, b, c, d]) { pos.push(...q); nor.push(...n); del.push(k); }
      idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
    };
    // ovansidan, listen (en halv cylinder) och framsidan
    quad([-X, Y, Z], [X, Y, Z], [-X, Y, zf - LR], [X, Y, zf - LR], [0, 1, 0], 0);
    const N = 14;
    for (let i = 0; i < N; i++) {
      const a0 = Math.PI / 2 - (i / N) * Math.PI;
      const a1 = Math.PI / 2 - ((i + 1) / N) * Math.PI;
      const p = (a) => [zf - LR + Math.cos(a) * LR, Y - LR + Math.sin(a) * LR];
      const [z0, y0] = p(a0);
      const [z1, y1] = p(a1);
      const o = pos.length / 3;
      for (const [z, y, a] of [[z0, y0, a0], [z0, y0, a0], [z1, y1, a1], [z1, y1, a1]]) nor.push(0, Math.sin(a), Math.cos(a));
      pos.push(-X, y0, z0, X, y0, z0, -X, y1, z1, X, y1, z1);
      del.push(1, 1, 1, 1);
      idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
    }
    quad([-X, Y - 2 * LR, zf - LR], [X, Y - 2 * LR, zf - LR], [-X, Y - 2400, zf - LR], [X, Y - 2400, zf - LR], [0, 0, 1], 2);
    diskG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    diskG.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
    diskG.setAttribute('aDel', new THREE.BufferAttribute(new Float32Array(del), 1));
    diskG.setIndex(idx);
  }
  const diskM = new THREE.Mesh(diskG, new THREE.ShaderMaterial({
    uniforms: diskU,
    vertexShader: `attribute float aDel; varying vec3 vB, vW, vN; varying float vDel;
    void main() { vB = position; vDel = aDel; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float;
    uniform sampler2D uBak; uniform vec4 uBakRam; uniform vec2 uBakSt; uniform vec3 uKr, uKu, uKb; uniform float uD, uVagg; uniform vec2 uNb;
    varying vec3 vB, vW, vN; varying float vDel;
    ${LJUS}
    float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float nz(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * nz(p); p = p * 2.03 + 11.; a *= .5; } return s; }
    // en punkt i världen i väggens bild (samma kamera)
    vec2 iBak(vec3 p) { vec3 d = p - cameraPosition; float z = -dot(d, uKb); vec2 uw = uD * vec2(dot(d, uKr), -dot(d, uKu)) / z; vec2 q = (uBakRam.xy + uBakRam.z * uw) / uBakSt; return vec2(q.x, 1. - q.y); }
    // det som speglas i riktningen R från p: väggen, eller han (mörkt)
    vec3 spegel(vec3 p, vec3 R, float grov) {
      float t = (uVagg - dot(uNb, p.xz)) / min(-.05, dot(uNb, R.xz));
      vec3 q = p + R * t;
      vec3 c = texture2D(uBak, iBak(q), log2(1. + t * grov)).rgb;
      // han: kroppen och huvudet på fotots plan
      float th = (70. - p.z) / min(-.05, R.z);
      vec3 h = p + R * th;
      float kropp = max(1. - smoothstep(330., 380., abs(h.x - 30.) + max(0., h.y - 250.) * .5), 0.) * (1. - smoothstep(560., 640., h.y));
      vec2 hu = (h.xy - vec2(0., 520.)) / vec2(175., 255.);
      float huvud = 1. - smoothstep(.85, 1.05, length(hu));
      c = mix(c, vec3(.035, .03, .032), kropp * step(0., th) * .9);
      c = mix(c, vec3(.32, .2, .15), huvud * step(0., th) * .8);
      return c;
    }
    void main() {
      vec3 n = normalize(vN);
      vec3 V = normalize(vW - cameraPosition);
      float cs = clamp(dot(-V, n), 0., 1.);
      float F = .04 + .96 * pow(1. - cs, 5.);
      vec3 ut;
      // ljuset faller av mot en och åt vänster, bort från lamporna över honom
      float pol = exp(-pow((vB.x + 250.) / 2600., 2.)) * (.55 + .45 * exp(-pow((vB.z - 300.) / 900., 2.)));
      // neonen och gatan från höger, där affären ligger
      float hoger = smoothstep(-200., 2600., vB.x);
      if (vDel < .5) {
        // lackat trä, ådrat längs baren, slitet och mörkare närmast en
        vec2 g = vec2(vB.x * .0026, vB.z * .02);
        float a = fbm(g * vec2(1., 2.2)), b = fbm(g * vec2(.7, 8.) + 3.), c2 = fbm(vB.xz * vec2(.012, .06) + 17.);
        vec3 tra = mix(vec3(.34, .19, .095), vec3(.5, .29, .15), a);
        tra *= .8 + .34 * b;
        tra *= .92 + .12 * c2;
        vec3 l = ljus(n) * (.32 + .9 * pol) + vec3(.5, .06, .04) * hoger * .35 + vec3(.16, .2, .3) * hoger * .2;
        ut = tra * l;
        // bakre kanten: en smal ljus kant där lamporna fångas
        float kant = exp(-pow((vB.z - ${SCEN.DISK.Z.toFixed(1)} - 3.) / 3.5, 2.));
        ut += vec3(1., .78, .52) * kant * .22 * (.4 + pol);
        vec3 R = reflect(V, n);
        float grov = .0025 + .005 * fbm(vB.xz * vec2(.004, .03));
        ut = mix(ut, spegel(vW, R, grov) * 1.25, min(1., F * 1.3));
      } else if (vDel < 1.5) {
        // listen: borstad aluminium som pultens, speglar suddigt, rött från neonen till höger
        vec3 R = reflect(V, n);
        vec3 sp = R.y > 0. ? spegel(vW, R, .04) : vec3(.05, .04, .035);
        vec3 l = ljus(n) * (.25 + .6 * pol);
        ut = vec3(.36, .36, .35) * l * .55 + sp * .75;
        ut += vec3(1., .2, .12) * hoger * pow(max(0., dot(n, normalize(vec3(.7, .5, .5)))), 4.) * .35;
        ut += vec3(1., .9, .75) * pow(max(0., dot(R, NYCKEL)), 30.) * .35;
      } else {
        // framsidan: mörkt trä i fält, i skugga under kanten
        float x = vB.x / 520.;
        float spar = smoothstep(0., .015, fract(x)) * smoothstep(0., .015, 1. - fract(x));
        vec2 g = vec2(vB.x * .02, vB.y * .0026);
        vec3 tra = mix(vec3(.16, .085, .045), vec3(.25, .14, .075), fbm(g * vec2(1.6, 1.)));
        float ned = exp((vB.y - ${SCEN.DISK.Y.toFixed(1)}) / 380.);
        ut = tra * (ljus(n) * (.2 + .5 * pol) * (.25 + .75 * ned)) * (.55 + .45 * spar);
        ut += vec3(.5, .06, .04) * hoger * .08 * ned;
      }
      gl_FragColor = vec4(ton(ut), 1.);
    }`,
  }));
  diskM.rotation.y = SCEN.BAR * DEG;
  diskM.frustumCulled = false;
  SD.add(diskM);
  // Notan under fatet, samma som i rummet (rum.js), ritad på en duk.
  const notaDuk = document.createElement('canvas');
  const notaTex = new THREE.CanvasTexture(notaDuk);
  notaTex.colorSpace = THREE.NoColorSpace;
  notaTex.anisotropy = 8;
  const NOTA = { B: 270, L: 430 };
  const notaG = new THREE.PlaneGeometry(NOTA.B, NOTA.L, 1, 8);
  {
    // liggande, med den nedre änden lite uppböjd
    const p = notaG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = (-y / NOTA.L) + 0.5;
      p.setXYZ(i, p.getX(i), Math.max(0, t - 0.78) ** 2 * 120 + 0.6, -y);
    }
    notaG.computeVertexNormals();
  }
  const nota = new THREE.Mesh(notaG, new THREE.ShaderMaterial({
    uniforms: { uT: { value: notaTex }, uButik: bord.butik },
    transparent: true,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; void main() { vUv = uv; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }',
    fragmentShader: `precision highp float; uniform sampler2D uT; varying vec2 vUv; varying vec3 vN;
    ${LJUS}
    void main() { vec4 c = texture2D(uT, vUv); if (c.a < .02) discard; vec3 n = normalize(vN); gl_FragColor = vec4(ton(c.rgb * (ljus(n) * .78 + vec3(.12, .02, .015))), c.a); }`,
  }));
  nota.position.set(KOPP[0] + 60, BORD.Y, KOPP[2] + 185);
  nota.rotation.y = 0.22;
  nota.renderOrder = 1;
  SD.add(nota);
  let notaKlar = null;
  function ritaNota() {
    if (!notaKlar) {
      notaKlar = (async () => {
        try { await Promise.all(['600 19px Caveat', '700 27px Caveat', '700 10px Fraunces', '14px VT323'].map((f) => document.fonts.load(f))); } catch (e) { /* då med reservtypsnitten */ }
        const k = 3;
        notaDuk.width = 148 * k;
        notaDuk.height = 236 * k;
        const x = notaDuk.getContext('2d');
        x.scale(k, k);
        // rivet ur blocket i överkanten
        x.beginPath();
        x.moveTo(0, 3.3);
        for (let i = 1; i <= 20; i++) x.lineTo(148 * (i / 20), i % 2 ? 0 : 3.3);
        x.lineTo(148, 236);
        x.lineTo(0, 236);
        x.closePath();
        const bg = x.createLinearGradient(0, 0, 0, 236);
        bg.addColorStop(0, '#f3efe3');
        bg.addColorStop(1, '#e2dbc8');
        x.fillStyle = bg;
        x.fill();
        x.save();
        x.clip();
        x.fillStyle = 'rgba(70, 100, 170, 0.2)';
        for (let y = 13 + 22; y < 236; y += 23) x.fillRect(0, y, 148, 1);
        x.restore();
        x.textBaseline = 'alphabetic';
        x.fillStyle = '#a8402c';
        x.font = '700 10px Fraunces, Georgia, serif';
        x.letterSpacing = '2.6px';
        x.textAlign = 'right';
        x.fillStyle = '#c0392b';
        x.font = '14px VT323, monospace';
        x.letterSpacing = '0.5px';
        x.fillText('NR 0007', 137, 26);
        const nr = x.measureText('NR 0007').width;
        x.fillStyle = '#a8402c';
        x.font = '700 10px Fraunces, Georgia, serif';
        x.letterSpacing = '2.6px';
        x.fillText('NOTA', 137 - nr - 8, 26);
        x.letterSpacing = '0px';
        x.fillStyle = '#25336f';
        const text = (t, px, py, vinkel = 0, font = '600 19px Caveat, cursive', hoger = false) => {
          x.save();
          x.translate(px, py);
          x.rotate(vinkel);
          x.font = font;
          x.textAlign = hoger ? 'right' : 'left';
          x.fillText(t, 0, 0);
          x.restore();
        };
        text('Hasse B.', 15, 50, -3 * DEG, '700 27px Caveat, cursive');
        const rad = [['Kaffe', '32:–'], ['Påtår ×4', '–'], ['Kanelbulle', '28:–'], ['S:a', '60:–']];
        rad.forEach(([a, b], i) => { text(a, 15, 73 + 23 * i + 23 - 6); text(b, 137, 73 + 23 * i + 23 - 6, 0, undefined, true); });
        x.fillRect(15, 73 + 23 * 3 + 1, 126, 1.5);
        text('Skrivs på', 15, 182, -4 * DEG);
        text('Notts County', 13, 208, -5 * DEG, '700 24px Caveat, cursive');
        x.save();
        x.translate(13, 208);
        x.rotate(-5 * DEG);
        x.font = '700 24px Caveat, cursive';
        const b = x.measureText('Notts County').width;
        x.fillRect(0, 4, b, 1.5);
        x.fillRect(0, 7.5, b, 1.5);
        x.restore();
        notaTex.needsUpdate = true;
      })();
    }
    return notaKlar;
  }
  let bakTex = null;
  // Disken i fönstret (v som kamera), från dess bakre kant ned till fönstrets underkant, på duken ut.
  // bak: väggens bild { bild, px, py, S, W, H } (scripts/hasse/bak.html).
  async function diskBild(ut, v, bak) {
    await ritaNota();
    if (!bakTex || bakTex.image !== bak.bild) {
      if (bakTex) bakTex.dispose();
      bakTex = new THREE.Texture(bak.bild);
      bakTex.colorSpace = THREE.NoColorSpace;
      bakTex.generateMipmaps = true;
      bakTex.minFilter = THREE.LinearMipmapLinearFilter;
      bakTex.needsUpdate = true;
      diskU.uBak.value = bakTex;
    }
    diskU.uBakRam.value.set(bak.px, bak.py, bak.S, 0);
    diskU.uBakSt.value.set(bak.W, bak.H);
    // den bakre kanten i fönstret: dess högsta punkt där den syns
    const ka = iBild(v, ...franBaren([-9000, BORD.Y, SCEN.DISK.Z]));
    const kb = iBild(v, ...franBaren([1500, BORD.Y, SCEN.DISK.Z]));
    const yVid = (x) => ka[1] + ((kb[1] - ka[1]) * (x - ka[0])) / (kb[0] - ka[0]);
    const y0 = Math.max(0, Math.floor(Math.min(yVid(0), yVid(v.W)) - 4));
    const box = { x: 0, y: y0, w: v.W, h: Math.max(1, v.H - y0) };
    Object.assign(ut.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    const pr = r.getPixelRatio();
    ut.width = Math.round(box.w * pr);
    ut.height = Math.round(box.h * pr);
    r.setSize(box.w, box.h, false);
    C.fov = (2 * Math.atan(v.H / 2 / (v.s * D))) / DEG;
    C.aspect = v.W / v.H;
    C.setViewOffset(v.W, v.H, v.W / 2 - v.cx + box.x, v.H / 2 - v.ey + box.y, box.w, box.h);
    r.render(SD, C);
    const g = ut.getContext('2d');
    g.clearRect(0, 0, ut.width, ut.height);
    g.drawImage(r.domElement, 0, 0, ut.width, ut.height);
    // och figuren igen
    kamera(v);
    return box;
  }
  // ---------- rörelserna ----------
  const SA = W_(352, 792, -52);
  const SB = W_(987, 800, 8);
  const LA = ARM.LA;
  const LB = ARM.LB;
  // Vilan: armbågarna på disken och underarmarna på den in mot mitten, den vänstra med handen bredvid
  // koppen. Ur axeln (s), armbågens vinkel ut från rakt fram (a) och underarmens vinkel
  // in (b): armbågen och handleden ligger på disken, med armens längder. (Disken går snett, så att den
  // vänstra armbågen når den bara nära axeln.)
  const { EH, WH } = VILA;
  function paDisken(s, sida, a, b) {
    const S0 = new THREE.Vector3(s.x + 2 * sida, s.y - 8, s.z);
    const h1 = Math.sqrt(LA * LA - (S0.y - EH) ** 2);
    const E = new THREE.Vector3(S0.x - sida * h1 * Math.sin(a * DEG), EH, S0.z + h1 * Math.cos(a * DEG));
    const h2 = Math.sqrt(LB * LB - (EH - WH) ** 2);
    const W = new THREE.Vector3(E.x + sida * h2 * Math.sin(b * DEG), WH, E.z + h2 * Math.cos(b * DEG));
    return { W: W.toArray(), pol: E.clone().sub(S0).toArray() };
  }
  const va = paDisken(SA, 1, 17, 40);
  const vb = paDisken(SB, -1, 14, 35);
  // [handled, armbågens riktning, fingrarna, handflatan, krok, peka]
  const VILA_A = [va.W, va.pol, [0.84, -0.1, 0.53], [0.2, -0.97, 0.1], 0.36, 0];
  const VILA_B = [vb.W, vb.pol, [-0.25, -0.1, 0.96], [-0.1, -0.98, 0.12], 0.3, 0];
  // [t, handled, armbågens riktning, fingrarna, handflatan, krok, peka, slag]. slag: på vägen dit går
  // handen allt fortare och stannar tvärt, som när den slår i disken (annars mjukt in och ut).
  const VA = [
    [0, ...VILA_A], [2.5, ...VILA_A],
    // gapskrattet: båda armarna upp framför kroppen
    [3.0, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.35, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.78, P_(270, 680, 340), [-0.8, -0.6, 0.2], [-0.05, 0.95, 0.3], [0.9, 0, 0.3], 0.06, 0],
    // slaget i disken
    [5.0, ...VILA_A, true], [5.5, ...VILA_A],
    // pekfingret: så är det bara
    [5.95, P_(310, 640, 390), [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
    [6.8, P_(310, 640, 390), [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
    // karateslaget
    [7.1, P_(300, 690, 400), [-0.8, -0.75, 0.15], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    [8.15, P_(300, 690, 400), [-0.8, -0.75, 0.15], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    // armen ut åt sidan, inom bilden (på höjden är bilden smalare)
    [8.7, P_(hog ? 210 : 70, 790, 330), [-0.7, -0.75, 0.1], [-0.72, 0.6, 0.25], [0.12, -0.25, 1], 0.1, 0],
    [9.25, P_(hog ? 235 : 95, 830, 320), [-0.7, -0.75, 0.1], [-0.76, 0.5, 0.3], [0.12, -0.25, 1], 0.1, 0],
    [9.95, ...VILA_A], [12.4, ...VILA_A],
  ];
  const VB = [
    [0, ...VILA_B], [2.55, ...VILA_B],
    [3.0, P_(1110, 505, 310), [0.6, -0.5, 0.65], [0.12, 0.97, 0.12], [-0.12, -0.06, 1], 0.1, 0],
    [4.2, P_(1110, 505, 310), [0.6, -0.5, 0.65], [0.12, 0.97, 0.12], [-0.12, -0.06, 1], 0.1, 0],
    [4.72, ...VILA_B], [12.4, ...VILA_B],
  ];
  // Huvudet, kroppen och brynen i T 0–12,4 (efter det: vilan).
  const HUV = {
    yaw: [[0, -0.3], [2.5, -0.3], [3.0, 0.15], [4.5, 0.1], [5.0, 0], [8.2, 0], [8.7, -0.8], [9.3, -0.65], [9.95, 0], [10.6, 0.25], [11.6, 0.25], [12.4, -0.3]],
    pitch: [[0, -0.45], [2.5, -0.45], [3.0, -1.2], [4.4, -1.1], [4.8, -0.55], [5.0, 0.95], [5.2, 0.05], [8.2, 0.05], [9.95, 0.05], [10.6, -0.6], [11.6, -0.6], [12.4, -0.45]],
    roll: [[0, -0.08], [2.5, -0.08], [3.0, 0.09], [4.4, 0.07], [5.0, 0], [8.2, 0], [8.7, -0.06], [9.3, -0.05], [9.95, 0], [10.6, 0.05], [11.6, 0.05], [12.4, -0.08]],
    lut: [[0, 0.05], [2.5, 0.05], [3.0, -0.03], [4.72, -0.04], [5.0, 0.09], [5.5, 0.06], [8.2, 0.05], [9.95, 0.06], [12.4, 0.05]],
    vrid: [[0, -0.09], [2.5, -0.09], [3, 0], [4.72, 0.05], [5.0, -0.1], [5.5, -0.08], [8.2, -0.03], [8.7, -0.17], [9.3, -0.14], [9.95, -0.08], [12.4, -0.09]],
    sid: [[0, -0.008], [2.5, -0.008], [3, -0.006], [4.72, 0.015], [5, -0.012], [8.7, 0.015], [9.95, -0.012], [12.4, -0.008]],
    axV: [[0, -8], [2.5, -8], [3.0, 42], [4.35, 42], [4.78, 26], [5.0, -8], [5.5, -8], [5.95, 18], [8.15, 18], [8.7, 26], [9.95, -8], [12.4, -8]],
    axH: [[0, 0], [2.55, 0], [3.0, 42], [4.2, 42], [4.72, 0], [12.4, 0]],
    brynX: [[0, 0], [2.5, 0], [3.0, 0.5], [4.4, 0.5], [5.0, 1], [5.6, 0.4], [9.4, 0.3], [9.95, 0.4], [10.6, 0.15], [11.6, 0.15], [12.4, 0]],
    brynY: [[0, 1.1], [2.5, 1.1], [3.0, 0.6], [4.4, 0.6], [5.0, 1], [5.6, 0.5], [9.4, 0.4], [9.95, 0.5], [10.6, 1.05], [11.6, 1.05], [12.4, 1.1]],
  };
  const KANAL = Object.keys(HUV);
  // ansiktet i klippen: läggs till som det största av det som rör sig
  const ANSIKTE = ['le', 'kis', 'blund', 'munn', 'rund', 'dricker'];
  const lage = (T) => Object.fromEntries(KANAL.map((x) => [x, spar(HUV[x], T)]));
  const S0 = lage(0);

  // ---------- klippen (KLIPP) ----------
  // Varje klipp utom de första tre: huvudet, kroppen och brynen (k) som skillnad mot där han står när
  // klippet börjar (start, 0 eller 5,5), ansiktet som det är, och armarnas nycklar (A, B), allt i klippets
  // egen tid. Klippet börjar och slutar där han står, så det behöver bara nycklarna däremellan.
  // kaffe: koppen till munnen och tillbaka, cig: cigarren (se nedan).
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const lang = (p, l) => { const x = Math.hypot(...p); return p.map((c) => (c * l) / x); };
  // armbågens riktning: lika lång som vilans, så att den inte tar över först på slutet
  const polA = (p) => lang(p, Math.hypot(...va.pol));
  const polB = (p) => lang(p, Math.hypot(...vb.pol));
  const PA = polA(va.pol);
  const PB = polB(vb.pol);
  // handen tillbaka i vilan, en bit ovanför (studsen efter ett slag), och samma hand som slår
  const vilaA = (t, slag = false) => [t, ...VILA_A, slag];
  const vilaB = (t, slag = false) => [t, ...VILA_B, slag];
  const studsA = (t, h) => [t, [va.W[0], va.W[1] + h, va.W[2]], ...VILA_A.slice(1)];
  const studsB = (t, h) => [t, [vb.W[0], vb.W[1] + h, vb.W[2]], ...VILA_B.slice(1)];
  // kaffet: handen till koppens öra och tillbaka (mot) och fingrarna runt örat (krok), när koppen står
  // på fatet igen vid ned
  const grepp = (ned) => ({ mot: [0.1, 1.05, ned + 0.05, ned + 0.5], krok: [[0, 0.1], [1, 0.18], [1.2, 0.72], [ned, 0.72], [ned + 0.2, 0.18], [ned + 0.5, VILA_B[4]]] });
  const RORELSER = {
    // Näven: han blir tyst och allvarlig, knyter höger hand och lyfter den, håller den uppe en stund och
    // slår den i disken med lillfingersidan; tittar en rakt i ögonen och nickar.
    naven: {
      k: {
        yaw: [[0.4, 0.35], [1.6, 0.35], [2.2, 0.3]],
        pitch: [[0.35, 0], [0.9, 0.35], [1.6, 0.25], [1.72, 0.2], [1.82, 1.3], [2.1, 0.45], [2.35, 0.9], [2.65, 0.5]],
        roll: [[0.9, 0.06], [1.6, 0.06], [2.2, 0.04]],
        lut: [[0.4, 0], [1.5, 0.05], [1.74, 0.12], [2.1, 0.05]],
        vrid: [[0.4, 0], [1.5, -0.07], [1.74, 0.05], [2.2, 0.02]],
        axV: [[0.3, 0], [1.05, 26], [1.5, 40], [1.74, 4], [2.0, 8]],
        axH: [[1.5, 6], [1.74, -4], [2.0, 0]],
        brynX: [[0.35, 0], [0.7, -0.6], [1.6, -0.7], [1.8, 0.5], [2.6, 0.5]],
        brynY: [[0.35, 0], [0.7, -0.9], [1.6, -1.0], [1.8, -0.3], [2.6, -0.45]],
        kis: [[0.35, 0], [0.8, 0.4], [1.6, 0.45], [1.85, 0.1], [2.2, 0]],
        blund: [[1.7, 0], [1.76, 0.85], [1.92, 0]],
        munn: [[1.7, 0], [1.78, 0.08], [1.95, 0]],
        le: [[2.3, 0], [2.7, 0.3], [3.3, 0.18]],
      },
      A: [
        vilaA(0.35),
        [1.05, [-255, 70, 520], [-0.8, -0.6, 0.2], [0.1, 0.92, 0.38], [0.45, -0.1, -0.88], 0.95, 0],
        [1.5, [-262, 120, 505], [-0.8, -0.6, 0.2], [0.08, 0.95, 0.3], [0.45, -0.1, -0.88], 1, 0],
        [1.72, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0, true],
        [1.8, [-175, -214, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0],
        [1.95, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0],
        [2.7, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 0.95, 0],
        [3.25, [-150, -240, 590], PA, [0.75, -0.08, 0.65], [0.4, -0.9, -0.1], 0.5, 0],
      ],
    },
    // Tre slag med handflatan, varje gång lite högre upp ifrån och lite hårdare, och han nickar med.
    treslag: {
      k: {
        yaw: [[0.4, 0.3], [2.2, 0.3]],
        pitch: [[0.3, 0.1], [0.62, 0.1], [0.68, 0.9], [0.9, 0.2], [1.14, 0.2], [1.2, 1.0], [1.45, 0.15], [1.8, -0.1], [1.98, -0.1], [2.05, 1.3], [2.35, 0.45], [2.6, 0.8], [2.9, 0.5]],
        lut: [[0.62, 0.06], [0.9, 0.04], [1.14, 0.08], [1.45, 0.05], [1.8, 0.02], [2.0, 0.12], [2.4, 0.06]],
        vrid: [[0.3, -0.02], [1.8, -0.05], [2.0, 0.04], [2.4, 0.01]],
        axV: [[0.3, 10], [0.62, -2], [1.0, 16], [1.14, -2], [1.65, 30], [1.8, 34], [2.0, 2], [2.3, 6]],
        brynX: [[0.3, -0.4], [1.8, -0.5], [2.05, 0.7], [2.8, 0.6]],
        brynY: [[0.3, -0.8], [1.8, -0.9], [2.05, -0.2], [2.8, -0.45]],
        kis: [[0.3, 0.3], [1.9, 0.35], [2.2, 0]],
        blund: [[0.6, 0], [0.65, 0.8], [0.78, 0], [1.12, 0], [1.17, 0.8], [1.3, 0], [1.96, 0], [2.02, 0.9], [2.18, 0]],
        munn: [[0.6, 0], [0.66, 0.1], [0.8, 0], [1.12, 0], [1.18, 0.12], [1.3, 0], [1.96, 0], [2.04, 0.1], [2.25, 0]],
        le: [[2.7, 0], [3.1, 0.28], [3.8, 0.15]],
      },
      A: [
        [0.3, [-205, -100, 545], PA, [0.8, 0.3, 0.52], [0.2, -0.93, 0.3], 0.25, 0],
        vilaA(0.62, true), studsA(0.7, 10), vilaA(0.8),
        [1.0, [-215, -40, 530], PA, [0.78, 0.38, 0.5], [0.2, -0.9, 0.38], 0.25, 0],
        vilaA(1.14, true), studsA(1.22, 12), vilaA(1.32),
        [1.65, [-230, 70, 500], PA, [0.7, 0.5, 0.5], [0.25, -0.85, 0.45], 0.2, 0],
        [1.8, [-232, 85, 495], PA, [0.7, 0.5, 0.5], [0.25, -0.85, 0.45], 0.2, 0],
        vilaA(1.98, true), studsA(2.07, 16), vilaA(2.2),
      ],
    },
    // Båda händerna: han andas in, lutar sig bakåt med händerna lyfta, och slår båda i disken samtidigt.
    bada: {
      k: {
        yaw: [[0.5, 0.3], [2.4, 0.3]],
        pitch: [[0.55, -0.3], [1.02, -0.45], [1.22, -0.2], [1.3, 1.35], [1.6, 0.4], [1.9, 0.9], [2.2, 0.5]],
        lut: [[0.55, -0.04], [1.02, -0.06], [1.24, 0.13], [1.6, 0.06]],
        axV: [[0.55, 24], [1.02, 34], [1.24, -4], [1.6, 4]],
        axH: [[0.55, 24], [1.02, 34], [1.24, -4], [1.6, 2]],
        brynX: [[0.55, 0.4], [1.02, 0.6], [1.26, -0.2], [1.6, 0.6]],
        brynY: [[0.55, -0.4], [1.02, -0.3], [1.26, -0.9], [1.6, -0.45]],
        kis: [[1.0, 0], [1.24, 0.5], [1.7, 0.1], [2.2, 0]],
        blund: [[1.2, 0], [1.25, 0.9], [1.42, 0]],
        munn: [[0.5, 0], [0.8, 0.12], [1.02, 0.1], [1.2, 0], [1.27, 0.12], [1.5, 0]],
        rund: [[0.5, 0], [0.8, 0.5], [1.02, 0.4], [1.15, 0]],
        le: [[2.0, 0], [2.4, 0.3], [3.2, 0.15]],
      },
      A: [
        [0.55, [-235, -30, 520], PA, [0.72, 0.32, 0.6], [0.2, -0.92, 0.3], 0.2, 0],
        [1.02, [-240, 20, 500], PA, [0.7, 0.4, 0.58], [0.22, -0.9, 0.35], 0.2, 0],
        vilaA(1.22, true), studsA(1.3, 14), vilaA(1.45),
      ],
      B: [
        [0.55, [255, -30, 600], PB, [-0.68, 0.3, 0.66], [-0.2, -0.92, 0.3], 0.2, 0],
        [1.02, [262, 20, 585], PB, [-0.66, 0.4, 0.63], [-0.22, -0.9, 0.35], 0.2, 0],
        vilaB(1.22, true), studsB(1.3, 14), vilaB(1.45),
      ],
    },
    // Fingret: pekfingret upp bredvid ansiktet, en stöt fram mot en, och sedan handflatan i disken.
    fingret: {
      k: {
        yaw: [[0.45, 0.4], [2.0, 0.3]],
        pitch: [[0.45, 0.2], [0.95, 0.45], [1.35, 0.3], [1.62, 0], [1.86, 0], [1.93, 1.3], [2.2, 0.45], [2.45, 0.85], [2.75, 0.5]],
        roll: [[0.45, 0.06], [1.4, 0.08], [1.8, 0]],
        lut: [[0.45, 0.02], [0.95, 0.07], [1.62, 0.02], [1.88, 0.11], [2.2, 0.06]],
        vrid: [[0.45, -0.04], [0.95, -0.02], [1.88, 0.04], [2.3, 0.01]],
        axV: [[0.45, 20], [1.4, 22], [1.62, 22], [1.88, 0], [2.1, 4]],
        brynX: [[0.45, 0.8], [1.4, 0.9], [1.7, -0.3], [1.95, 0.6]],
        brynY: [[0.45, 0.2], [1.4, 0.2], [1.7, -0.9], [1.95, -0.45]],
        kis: [[0.45, 0.15], [1.4, 0.2], [1.9, 0.4], [2.3, 0]],
        blund: [[1.84, 0], [1.89, 0.85], [2.04, 0]],
        munn: [[1.84, 0], [1.9, 0.08], [2.1, 0]],
        le: [[2.5, 0], [2.9, 0.26], [3.6, 0.15]],
      },
      A: [
        [0.45, [-350, 240, 400], [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
        [0.95, [-335, 250, 470], [-0.8, -0.75, 0.15], [0.15, 0.82, 0.55], [0.9, -0.1, -0.3], 0.62, 1],
        [1.35, [-340, 248, 450], [-0.8, -0.75, 0.15], [0.15, 0.85, 0.5], [0.9, -0.1, -0.3], 0.62, 1],
        [1.62, [-250, 60, 500], PA, [0.75, 0.4, 0.52], [0.2, -0.9, 0.38], 0.2, 0],
        vilaA(1.86, true), studsA(1.94, 14), vilaA(2.08),
      ],
    },
    // Medan han pratar: handflatan upp och ned i disken, och en nick.
    dunka: {
      k: {
        pitch: [[0.38, -0.2], [0.62, -0.1], [0.68, 1.1], [0.95, 0.2], [1.3, 0]],
        lut: [[0.38, -0.01], [0.64, 0.06], [1.0, 0]],
        axV: [[0.38, 14], [0.64, -2], [1.0, 0]],
        brynX: [[0.38, 0.2], [0.68, -0.3], [1.2, 0]],
        blund: [[0.6, 0], [0.65, 0.7], [0.8, 0]],
      },
      A: [
        [0.38, [-215, -60, 540], PA, [0.78, 0.32, 0.53], [0.2, -0.93, 0.3], 0.25, 0],
        vilaA(0.62, true), studsA(0.7, 10), vilaA(0.85),
      ],
    },
    // Kaffet (se kaffeArm): koppens lägen (kk), hur mycket han lutar den mot läppen (tipp), och
    // lillfingret ut (lill), armbågen ut (arm) och koppen i små cirklar (snurr), 0–1.
    // En klunk, och han njuter: en ordentlig klunk med slutna ögon och huvudet bakåt, och sedan sänker
    // han koppen en bit, smackar och säger mmm med höjda bryn och ett brett leende medan huvudet
    // vaggar, innan han ställer ned den.
    klunk: {
      k: {
        dricker: [[1.7, 0], [2.1, 1], [3.05, 1], [3.4, 0]],
        pitch: [[2.0, 0], [2.6, -0.5], [3.0, -0.6], [3.5, 0.2], [3.9, -0.3], [5.4, -0.3], [6.0, 0]],
        yaw: [[3.7, 0], [4.15, 0.35], [4.6, -0.3], [5.05, 0.25], [5.5, 0]],
        roll: [[3.7, 0], [4.15, 0.1], [4.6, -0.09], [5.05, 0.07], [5.5, 0]],
        lut: [[3.4, 0], [3.9, -0.03], [5.4, -0.03], [6.0, 0]],
        axV: [[3.6, 0], [4.0, 10], [5.2, 8], [5.8, 0]],
        axH: [[3.6, 0], [4.0, 10], [5.2, 8], [5.8, 0]],
        brynX: [[3.5, 0], [3.9, 0.9], [5.3, 0.8], [5.9, 0]],
        brynY: [[3.5, 0], [3.9, 0.3], [5.3, 0.25], [5.9, 0]],
        blund: [[3.4, 0], [3.6, 0.9], [5.3, 0.85], [5.6, 0]],
        munn: [[3.45, 0], [3.55, 0.12], [3.65, 0], [3.78, 0.12], [3.88, 0]],
        rund: [[3.95, 0], [4.15, 0.35], [5.2, 0.3], [5.4, 0]],
        le: [[3.6, 0], [4.0, 0.6], [5.3, 0.55], [6.2, 0.2]],
      },
      kaffe: {
        // [t, läge, båge uppåt på vägen dit]
        kk: [[1.1, 'fat'], [2.0, 'mun', 70], [3.15, 'mun'], [3.6, 'ah'], [5.6, 'ah'], [6.35, 'fat', 25]],
        tipp: [[1.95, 0], [2.4, 0.5], [3.0, 0.62], [3.35, 0]],
        ...grepp(6.35),
      },
    },
    // Cigarren: se cigarrArm.
    cigarr: {
      k: {
        yaw: [[0.15, 0], [0.75, -1.3], [1.3, -0.8], [2.0, 0.05], [3.9, 0.05], [4.4, 0.2], [6.2, 0.2], [6.75, -1.25], [7.6, -1.1], [8.0, -1.15], [8.5, -1.2], [9.3, 0]],
        pitch: [[0.15, 0], [0.75, 1.7], [1.3, 1.1], [2.0, 0.25], [3.9, 0.25], [4.05, 0.1], [4.6, -1.8], [5.9, -1.8], [6.45, 0.1], [6.85, 0.75], [7.6, 0.75], [8.0, 1.4], [8.5, 1.6], [9.3, 0]],
        roll: [[6.4, 0], [6.9, 0.07], [7.6, 0.07], [8.0, 0]],
        lut: [[0.75, 0.03], [1.4, 0.01], [2, 0], [4.15, 0], [4.7, -0.05], [6.0, -0.05], [6.6, 0], [8.0, 0.02], [8.5, 0.03], [9.4, 0]],
        vrid: [[0.75, -0.07], [1.6, -0.02], [6.4, -0.02], [6.9, -0.06], [7.6, -0.06], [8.45, -0.07], [9.4, 0]],
        axV: [[1.2, 6], [2.0, 20], [3.9, 20], [4.6, 12], [6.3, 12], [6.9, 16], [7.6, 16], [8.2, 4], [9.2, 0]],
        brynX: [[2.15, 0], [2.5, 0.3], [3.8, 0.3], [4.4, 0.1], [6.1, 0.1], [6.75, 0.65], [7.6, 0.55], [8.1, 0]],
        brynY: [[2.15, 0], [2.5, 0.24], [3.8, 0.24], [4.4, 0.08], [6.1, 0.08], [6.75, 0.52], [7.6, 0.44], [8.1, 0]],
        blund: [[2.15, 0], [2.45, 0.5], [3.8, 0.5], [4.05, 0.25], [4.4, 0.85], [5.75, 0.85], [6.2, 0]],
        le: [[5.9, 0], [6.4, 0.45], [7.6, 0.35], [8.3, 0.08]],
        kis: [[6.0, 0], [6.4, 0.32], [6.9, 0.1]],
      },
      cig: {
        // [t, läge, båge uppåt på vägen dit]
        ck: [[1.0, 'vila'], [2.1, 'mun', 70], [3.9, 'mun'], [4.35, 'bort'], [4.95, 'hall'], [6.25, 'hall'], [6.9, 'se'], [7.6, 'se'], [8.45, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.12], [0.8, 0.12], [1.0, 0.45], [8.4, 0.45], [8.6, 0.14], [9.1, 0.2], [9.6, VILA_A[4]]],
        // fram till askkoppen och tillbaka, upp mot ansiktet och ned, och när fingrarna har den
        mot: [0.05, 0.85, 8.5, 9.4],
        upp: [1.0, 1.9, 7.7, 8.4],
        grepp: [0.8, 1.0, 8.4, 8.6],
        // glöden (två bloss), läpparna om cigarren, munnen när han blåser ut och pusten mellan blossen
        glod: [[2.2, 0], [2.5, 1], [2.95, 0.12], [3.25, 0.12], [3.55, 1], [3.85, 0]],
        iMun: [[1.95, 0], [2.15, 1], [3.9, 1], [4.05, 0]],
        blaser: [[4.15, 0], [4.35, 1], [5.9, 1], [6.3, 0]],
        pust: [[2.93, 0], [3.0, 1], [3.12, 1], [3.22, 0]],
        // röken: en pust i mungipan, och ut med den, mest i början
        rok: [{ fran: 2.95, till: 3.2, sort: 'pust' }, { fran: 4.25, till: 6.2, sort: 'blas', styrka: 75, avtag: 1.3 }],
      },
    },
    // Kaffet är varmt: han håller koppen under hakan och blåser på det tre gånger med runda läppar (ångan
    // far bort från honom), smakar försiktigt och rycker till av värmen, och tar sedan en riktig klunk och
    // ett långt ah med huvudet bakåt, slutna ögon och höjda bryn innan han ställer ned den.
    blasa: {
      k: {
        dricker: [[3.75, 0], [4.0, 0.6], [4.2, 0.6], [4.4, 0], [4.9, 0], [5.2, 1], [5.8, 1], [6.05, 0]],
        yaw: [[1.75, 0.2], [3.3, 0.2], [3.6, 0], [4.25, 0], [4.45, -0.3], [4.8, -0.2], [5.1, 0]],
        pitch: [[1.2, 0], [1.75, 0.8], [3.3, 0.8], [3.6, 0], [4.3, 0], [4.45, 0.35], [4.9, 0], [6.1, -0.3], [6.5, -1.7], [7.5, -1.6], [8.1, 0]],
        lut: [[4.25, 0], [4.4, -0.03], [4.9, 0], [6.1, 0], [6.5, -0.05], [7.5, -0.05], [8.1, 0]],
        axV: [[6.1, 0], [6.4, 14], [7.0, -8], [7.6, -6], [8.2, 0]],
        axH: [[4.25, 0], [4.4, 12], [4.9, 0], [6.1, 0], [6.4, 14], [7.0, -8], [7.6, -6], [8.2, 0]],
        munn: [[1.85, 0], [1.95, 0.2], [2.2, 0.12], [2.3, 0], [2.4, 0.2], [2.65, 0.12], [2.75, 0], [2.85, 0.2], [3.1, 0.12], [3.2, 0],
          [4.4, 0], [4.48, 0.16], [4.7, 0], [6.1, 0], [6.35, 0.6], [7.4, 0.5], [7.7, 0.1], [7.9, 0]],
        rund: [[1.8, 0], [1.9, 1], [3.15, 1], [3.3, 0], [6.1, 0], [6.35, 0.25], [7.4, 0.2], [7.7, 0]],
        brynX: [[4.3, 0], [4.45, 0.9], [4.9, 0], [6.1, 0], [6.4, 1.0], [7.4, 0.9], [8.0, 0]],
        brynY: [[4.3, 0], [4.45, 0.4], [4.9, 0], [6.1, 0], [6.4, 0.4], [7.4, 0.35], [8.0, 0]],
        kis: [[4.3, 0], [4.42, 0.7], [4.8, 0]],
        blund: [[6.1, 0], [6.3, 0.95], [7.5, 0.9], [7.8, 0]],
        le: [[7.3, 0], [7.7, 0.55], [8.4, 0.25]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [1.8, 'hake', 50], [3.3, 'hake'], [3.75, 'mun'], [5.9, 'mun'], [6.35, 'ah'], [7.9, 'ah'], [8.5, 'fat', 20]],
        tipp: [[3.75, 0], [4.0, 0.3], [4.25, 0.3], [4.45, 0.12], [4.9, 0.12], [5.25, 0.65], [5.8, 0.7], [6.1, 0]],
        ...grepp(8.5),
        // ångan: stiger ur koppen, och far bort när han blåser
        rok: [{ fran: 1.5, till: 3.4, sort: 'anga', styrka: 14 }, { fran: 1.92, till: 2.25, sort: 'anga', styrka: 60, blas: true },
          { fran: 2.4, till: 2.72, sort: 'anga', styrka: 60, blas: true }, { fran: 2.88, till: 3.2, sort: 'anga', styrka: 60, blas: true }],
      },
    },
    // Han lyfter koppen till bröstet och tittar ned i den med höjda bryn, snurrar den och nickar gillande,
    // och dricker ur den i ett svep med huvudet långt bakåt och armbågen ute; tittar förvånat ned i den
    // tomma koppen och ställer ned den med en smäll och ett brett leende.
    titta: {
      k: {
        dricker: [[3.95, 0], [4.25, 1], [5.55, 1], [5.85, 0]],
        yaw: [[1.3, 0.2], [1.8, 0.45], [3.0, 0.45], [3.6, 0], [5.9, 0], [6.3, 0.35], [7.0, 0.35], [7.5, 0]],
        pitch: [[1.3, 0.4], [1.8, 1.5], [2.9, 1.5], [3.1, 0.6], [3.3, 1.4], [3.55, 0.6], [3.9, 0], [4.4, -0.5], [5.1, -0.9], [5.5, -1.0], [5.95, 0], [6.3, 1.4], [7.0, 1.4], [7.5, 0.2], [8.0, -0.2], [8.6, 0]],
        lut: [[1.8, 0.04], [3.0, 0.04], [3.6, 0], [4.4, -0.03], [5.4, -0.06], [5.9, 0], [6.3, 0.04], [7.0, 0.04], [7.6, -0.02], [8.4, 0]],
        axH: [[4.3, 0], [5.0, 14], [5.6, 14], [6.0, 0]],
        brynX: [[1.8, 0], [2.1, 0.8], [3.0, 0.8], [3.6, 0.3], [5.9, 0], [6.25, 1.1], [7.0, 1.0], [7.5, 0]],
        brynY: [[1.8, 0], [2.1, 0.3], [3.0, 0.3], [3.6, 0], [5.9, 0], [6.25, 0.5], [7.0, 0.45], [7.5, 0]],
        kis: [[1.8, 0], [2.1, 0.2], [3.0, 0.2], [3.3, 0]],
        munn: [[6.2, 0], [6.4, 0.18], [6.9, 0.15], [7.1, 0]],
        rund: [[6.2, 0], [6.4, 0.6], [6.9, 0.6], [7.1, 0]],
        le: [[3.1, 0], [3.4, 0.35], [3.8, 0.1], [7.5, 0], [7.8, 0.65], [8.6, 0.3]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [1.8, 'brost', 30], [3.6, 'brost'], [4.1, 'mun', 40], [5.6, 'mun'], [6.15, 'brost'], [7.0, 'brost'], [7.55, 'fat', 15]],
        snurr: [[1.9, 0], [2.1, 1], [2.85, 1], [3.05, 0]],
        tipp: [[4.0, 0], [4.4, 0.6], [5.1, 0.95], [5.5, 1.0], [5.9, 0]],
        arm: [[4.1, 0], [4.8, 0.3], [5.5, 0.3], [6.0, 0]],
        ...grepp(7.55),
      },
    },
    // Ett bloss, och sedan ut med röken i en tunn stråle ur mungipan, med huvudet lite på sned och ett
    // höjt bryn, medan han tittar på en.
    bloss: {
      k: {
        yaw: [[0.15, 0], [0.75, -1.3], [1.3, -0.8], [2.0, 0.05], [3.3, 0.05], [3.8, 0.45], [5.4, 0.45], [6.0, 0.1], [6.4, -1.1], [6.9, -1.2], [7.6, 0]],
        pitch: [[0.15, 0], [0.75, 1.7], [1.3, 1.1], [2.0, 0.25], [3.3, 0.25], [3.8, -0.2], [5.4, -0.2], [6.0, 0.2], [6.4, 1.4], [6.9, 1.6], [7.6, 0]],
        roll: [[3.3, 0], [3.8, -0.06], [5.4, -0.06], [6.0, 0]],
        lut: [[0.75, 0.03], [1.4, 0.01], [2, 0], [3.3, 0], [3.8, -0.02], [5.5, -0.02], [6.4, 0.02], [6.9, 0.03], [7.7, 0]],
        vrid: [[0.75, -0.07], [1.6, -0.02], [5.6, -0.02], [6.85, -0.07], [7.7, 0]],
        axV: [[1.2, 6], [2.0, 20], [3.3, 20], [3.9, 12], [5.8, 12], [6.6, 4], [7.5, 0]],
        brynX: [[2.15, 0], [2.5, 0.2], [3.3, 0.2], [3.9, 0.1], [5.3, 0.1], [5.8, 0]],
        brynY: [[2.15, 0], [2.5, 0.16], [3.3, 0.16], [3.9, 0.7], [5.3, 0.7], [5.8, 0]],
        blund: [[2.15, 0], [2.45, 0.45], [3.3, 0.45], [3.5, 0]],
        le: [[3.9, 0], [4.3, 0.22], [5.4, 0.22], [5.9, 0.3], [6.4, 0.1]],
        kis: [[3.9, 0], [4.3, 0.25], [5.4, 0.25], [5.9, 0]],
      },
      cig: {
        ck: [[1.0, 'vila'], [2.1, 'mun', 70], [3.3, 'mun'], [3.7, 'bort'], [4.3, 'hall'], [5.9, 'hall'], [6.85, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.12], [0.8, 0.12], [1.0, 0.45], [6.75, 0.45], [6.95, 0.14], [7.45, 0.2], [7.9, VILA_A[4]]],
        mot: [0.05, 0.85, 6.9, 7.75],
        upp: [1.0, 1.9, 6.0, 6.75],
        grepp: [0.8, 1.0, 6.75, 6.95],
        glod: [[2.2, 0], [2.6, 1], [3.05, 0.85], [3.3, 0]],
        iMun: [[1.95, 0], [2.15, 1], [3.3, 1], [3.45, 0]],
        blaser: [[3.85, 0], [4.0, 0.55], [5.3, 0.55], [5.6, 0]],
        rok: [{ fran: 3.9, till: 5.5, sort: 'strale', styrka: 60, avtag: 0.8 }],
      },
    },
    // Ett bloss, och sedan tre rökringar med munnen som ett o. Han lutar sig bakåt och tittar efter dem,
    // nöjd, och lägger tillbaka cigarren.
    ringar: {
      k: {
        yaw: [[0.15, 0], [0.75, -1.3], [1.3, -0.8], [2.0, 0.05], [3.5, 0.05], [4.3, 0.75], [6.8, 0.75], [7.4, 0.55], [8.3, 0.45], [8.9, -0.6], [9.4, -0.9], [10.0, -1.2], [10.8, 0]],
        pitch: [[0.15, 0], [0.75, 1.7], [1.3, 1.1], [2.0, 0.25], [3.5, 0.25], [4.3, -0.4], [6.7, -0.4], [7.3, -1.3], [8.2, -1.0], [8.9, 0.6], [9.4, 0.75], [10.0, 1.5], [10.8, 0]],
        lut: [[0.75, 0.03], [1.4, 0.01], [2, 0], [3.6, 0], [4.3, -0.03], [6.7, -0.03], [7.4, -0.05], [8.2, -0.04], [9.0, 0], [10.0, 0.03], [10.9, 0]],
        vrid: [[0.75, -0.07], [1.6, -0.02], [8.6, -0.02], [9.4, -0.06], [10.0, -0.07], [10.9, 0]],
        axV: [[1.2, 6], [2.0, 20], [3.5, 20], [4.3, 14], [8.3, 14], [9.0, 16], [9.6, 10], [10.6, 0]],
        munn: [[4.6, 0], [4.8, 0.3], [4.95, 0.4], [5.08, 0.18], [5.6, 0.3], [5.75, 0.4], [5.88, 0.18], [6.4, 0.3], [6.55, 0.4], [6.68, 0.18], [7.0, 0]],
        rund: [[4.5, 0], [4.7, 1], [6.75, 1], [7.05, 0]],
        brynX: [[7.0, 0], [7.4, 0.7], [8.2, 0.6], [8.8, 0]],
        brynY: [[7.0, 0], [7.4, 0.56], [8.2, 0.48], [8.8, 0]],
        le: [[7.1, 0], [7.5, 0.5], [8.3, 0.4], [8.9, 0.1]],
        kis: [[7.1, 0], [7.5, 0.3], [8.3, 0.25], [8.9, 0]],
        blund: [[2.15, 0], [2.45, 0.4], [3.4, 0.4], [3.6, 0]],
      },
      cig: {
        ck: [[1.0, 'vila'], [2.1, 'mun', 70], [3.5, 'mun'], [3.9, 'bort'], [4.5, 'hall'], [8.4, 'hall'], [8.9, 'se'], [9.3, 'se'], [9.95, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.12], [0.8, 0.12], [1.0, 0.45], [9.9, 0.45], [10.1, 0.14], [10.6, 0.2], [10.95, VILA_A[4]]],
        mot: [0.05, 0.85, 10.0, 10.85],
        upp: [1.0, 1.9, 9.2, 9.9],
        grepp: [0.8, 1.0, 9.9, 10.1],
        glod: [[2.2, 0], [2.55, 1], [2.95, 0.35], [3.1, 1], [3.45, 0]],
        iMun: [[1.95, 0], [2.15, 1], [3.5, 1], [3.65, 0]],
        rok: [{ t: 4.95, sort: 'ring' }, { t: 5.75, sort: 'ring' }, { t: 6.55, sort: 'ring' }, { fran: 6.8, till: 8.0, sort: 'blas', styrka: 16, avtag: 1.2 }],
      },
    },
    // Han tar cigarren och knackar av askan över askkoppen med två korta ryck, tittar på glöden, drar ett
    // bloss och blåser ut röken genom näsan med halvslutna ögon.
    aska: {
      k: {
        yaw: [[0.15, 0], [0.75, -1.3], [1.3, -1.1], [2.8, -1.15], [3.3, -1.0], [3.8, -1.0], [4.4, 0.05], [5.8, 0.05], [6.2, 0.55], [7.9, 0.5], [8.6, 0], [9.1, -1.0], [9.6, -1.1], [10.4, 0]],
        pitch: [[0.15, 0], [0.75, 1.7], [1.3, 1.4], [2.8, 1.5], [3.3, 0.8], [3.8, 0.75], [4.4, 0.25], [5.7, 0.25], [6.1, -0.5], [7.8, -0.5], [8.4, 0], [9.1, 1.4], [9.6, 1.6], [10.4, 0]],
        lut: [[0.75, 0.03], [1.4, 0.04], [2.8, 0.04], [3.3, 0.01], [6.1, -0.03], [7.8, -0.03], [8.4, 0], [9.3, 0.03], [10.4, 0]],
        vrid: [[0.75, -0.07], [2.8, -0.08], [3.4, -0.04], [6.4, -0.02], [8.6, -0.04], [9.5, -0.07], [10.4, 0]],
        axV: [[1.2, 4], [2.8, 6], [3.6, 14], [4.4, 20], [5.7, 22], [6.3, 12], [8.2, 12], [9.2, 2]],
        brynX: [[2.9, 0], [3.4, 0.5], [3.9, 0.45], [4.5, 0.1], [6.1, 0.2], [7.8, 0.2], [8.4, 0]],
        brynY: [[2.9, 0], [3.4, 0.4], [3.9, 0.36], [4.5, 0.08], [6.1, 0.16], [7.8, 0.16], [8.4, 0]],
        blund: [[4.65, 0], [4.9, 0.5], [5.6, 0.5], [6.0, 0.3], [6.3, 0.65], [7.6, 0.65], [8.0, 0]],
        le: [[3.2, 0], [3.5, 0.25], [3.9, 0.2], [4.3, 0], [7.6, 0], [8.0, 0.4], [9.0, 0.25], [9.8, 0.05]],
        kis: [[7.8, 0], [8.0, 0.25], [8.6, 0.05]],
      },
      cig: {
        ck: [[1.0, 'vila'], [1.85, 'knack', 45], [2.08, 'knackN'], [2.22, 'knack'], [2.46, 'knackN'], [2.6, 'knack'], [3.2, 'se'], [3.8, 'se'], [4.6, 'mun', 40], [5.7, 'mun'], [6.1, 'bort'], [6.7, 'hall'], [8.6, 'hall'], [9.5, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.12], [0.8, 0.12], [1.0, 0.45], [9.4, 0.45], [9.6, 0.14], [10.1, 0.2], [10.6, VILA_A[4]]],
        mot: [0.05, 0.85, 9.55, 10.4],
        upp: [3.0, 3.8, 8.7, 9.4],
        grepp: [0.8, 1.0, 9.4, 9.6],
        glod: [[4.7, 0], [5.05, 1], [5.45, 0.85], [5.7, 0]],
        iMun: [[4.45, 0], [4.65, 1], [5.7, 1], [5.85, 0]],
        rok: [{ t: 2.08, sort: 'aska' }, { t: 2.46, sort: 'aska' }, { fran: 6.0, till: 7.9, sort: 'nasa', styrka: 60, avtag: 0.9 }],
      },
    },
    // Doften: koppen under näsan, och han blundar och drar in den länge, så att ångan sugs mot näsan,
    // bröstet häver sig och axlarna åker upp, med huvudet bakåt och brynen högt; andas ut med ett saligt
    // leende, tar en liten klunk och nickar långsamt med slutna ögon.
    dofta: {
      k: {
        dricker: [[4.75, 0], [5.05, 0.8], [5.75, 0.8], [6.0, 0]],
        pitch: [[1.4, 0], [2.0, 0.5], [2.3, 0.3], [3.7, -0.9], [4.1, -0.7], [4.6, 0], [6.1, 0], [6.5, 0.7], [6.9, 0.1], [7.3, 0.6], [7.7, 0.1], [8.4, 0]],
        roll: [[2.3, 0], [3.7, 0.08], [4.4, 0.04], [4.9, 0]],
        lut: [[2.2, 0], [3.7, -0.06], [4.2, -0.02], [4.8, 0]],
        axV: [[2.2, 0], [3.7, 34], [4.2, 4], [4.7, -4], [5.5, 0]],
        axH: [[2.2, 0], [3.7, 34], [4.2, 4], [4.7, -4], [5.5, 0]],
        brynX: [[2.2, 0], [3.6, 1.0], [4.3, 0.9], [4.9, 0.2], [6.2, 0.2], [6.6, 0.7], [8.0, 0.5], [8.6, 0]],
        brynY: [[2.2, 0], [3.6, 0.45], [4.3, 0.4], [4.9, 0.1], [6.2, 0.1], [6.6, 0.3], [8.0, 0.2], [8.6, 0]],
        blund: [[2.0, 0], [2.3, 0.95], [4.5, 0.9], [4.8, 0.3], [6.2, 0.3], [6.5, 0.85], [7.9, 0.8], [8.3, 0]],
        munn: [[3.8, 0], [4.0, 0.14], [4.4, 0.1], [4.6, 0]],
        le: [[2.6, 0], [3.7, 0.35], [4.1, 0.7], [4.7, 0.6], [5.0, 0.2], [6.1, 0.3], [6.5, 0.65], [8.0, 0.55], [8.8, 0.2]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [2.0, 'nasa', 70], [4.5, 'nasa'], [4.85, 'mun'], [5.9, 'mun'], [6.35, 'ah'], [7.9, 'ah'], [8.55, 'fat', 20]],
        tipp: [[4.8, 0], [5.1, 0.45], [5.7, 0.5], [6.0, 0]],
        ...grepp(8.55),
        rok: [{ fran: 1.4, till: 2.2, sort: 'anga', styrka: 16 }, { fran: 2.2, till: 3.7, sort: 'anga', styrka: 30, sug: true }, { fran: 3.7, till: 4.6, sort: 'anga', styrka: 16 }],
      },
    },
    // Skål: han lyfter koppen mot en med ett brett leende och en nick, tar en stor klunk med huvudet
    // bakåt och armbågen högt, och ställer ned koppen med en smäll och ett nöjt ah.
    skal: {
      k: {
        dricker: [[3.75, 0], [4.05, 1], [5.2, 1], [5.5, 0]],
        yaw: [[1.4, 0], [2.1, 0.3], [3.3, 0.3], [3.8, 0]],
        pitch: [[1.5, 0], [2.2, -0.3], [2.55, 0.9], [2.9, 0.1], [3.3, 0], [4.2, -0.6], [5.0, -0.9], [5.5, -0.3], [6.6, -0.4], [7.2, 0.4], [7.7, 0]],
        lut: [[1.5, 0], [2.2, 0.05], [3.2, 0.04], [3.7, 0], [4.6, -0.05], [5.3, -0.06], [5.8, 0]],
        axH: [[1.6, 0], [2.2, 26], [3.2, 22], [3.8, 8], [5.0, 26], [5.5, 0]],
        brynX: [[1.5, 0], [2.1, 0.9], [3.2, 0.8], [3.7, 0], [5.6, 0], [5.9, 0.8], [6.8, 0.6], [7.4, 0]],
        brynY: [[1.5, 0], [2.1, 0.3], [3.2, 0.25], [3.7, 0], [5.6, 0], [5.9, 0.3], [6.8, 0.2], [7.4, 0]],
        kis: [[2.0, 0], [2.4, 0.35], [3.2, 0.3], [3.6, 0]],
        blund: [[2.5, 0], [2.6, 0.9], [2.75, 0], [5.6, 0], [5.8, 0.85], [6.7, 0.8], [7.0, 0]],
        munn: [[5.55, 0], [5.8, 0.55], [6.6, 0.45], [6.9, 0]],
        rund: [[5.55, 0], [5.8, 0.2], [6.6, 0.15], [6.9, 0]],
        le: [[1.6, 0], [2.2, 0.75], [3.3, 0.7], [3.7, 0.2], [6.6, 0.2], [7.0, 0.7], [7.9, 0.4]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [2.1, 'skal', 40], [3.25, 'skal'], [3.85, 'mun', 30], [5.3, 'mun'], [5.75, 'ah'], [6.7, 'ah'], [7.25, 'fat', 10]],
        tipp: [[3.8, 0], [4.2, 0.6], [5.0, 0.9], [5.25, 0.9], [5.55, 0]],
        arm: [[1.4, 0], [2.1, 0.5], [3.3, 0.4], [4.3, 0.3], [5.3, 0.3], [5.8, 0]],
        ...grepp(7.25),
      },
    },
    // Fint: lillfingret rakt ut och armbågen ute, näsan i vädret och halvslutna ögon, två små läppjanden
    // med munnen i en trut emellan, och sedan smackar han eftertänksamt och nickar gillande, som en
    // vinprovare.
    fint: {
      k: {
        dricker: [[2.1, 0], [2.35, 0.55], [2.85, 0.55], [3.05, 0], [4.25, 0], [4.5, 0.55], [5.0, 0.55], [5.2, 0]],
        pitch: [[1.3, 0], [2.0, -0.7], [5.3, -0.7], [5.9, -0.5], [6.3, 0.3], [6.6, -0.4], [6.9, 0.3], [7.3, -0.2], [8.2, 0]],
        yaw: [[1.3, 0], [2.0, -0.25], [5.3, -0.25], [5.8, 0.2], [7.0, 0.2], [7.6, 0]],
        roll: [[1.3, 0], [2.0, -0.06], [5.3, -0.06], [5.8, 0]],
        lut: [[1.3, 0], [2.0, -0.03], [5.3, -0.03], [5.8, 0]],
        brynX: [[1.3, 0], [2.0, 0.9], [5.3, 0.9], [5.8, 0.4], [7.2, 0.4], [7.8, 0]],
        brynY: [[1.3, 0], [2.0, 0.4], [5.3, 0.4], [5.8, 0.1], [7.8, 0]],
        kis: [[1.3, 0], [2.0, 0.55], [5.3, 0.55], [5.6, 0.2], [7.6, 0]],
        munn: [[5.4, 0], [5.5, 0.1], [5.6, 0], [5.75, 0.1], [5.85, 0], [6.0, 0.1], [6.1, 0]],
        rund: [[3.1, 0], [3.3, 0.8], [3.9, 0.8], [4.1, 0], [6.1, 0], [6.3, 0.9], [7.4, 0.8], [7.7, 0]],
        le: [[7.4, 0], [7.8, 0.4], [8.4, 0.2]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [2.1, 'mun', 60], [3.1, 'mun'], [3.45, 'lyft'], [4.0, 'lyft'], [4.3, 'mun'], [5.2, 'mun'], [5.6, 'ah'], [7.4, 'ah'], [8.1, 'fat', 15]],
        tipp: [[2.1, 0], [2.35, 0.35], [2.85, 0.35], [3.05, 0], [4.3, 0], [4.5, 0.4], [5.0, 0.4], [5.2, 0]],
        lill: [[1.2, 0], [1.9, 1], [7.7, 1], [8.1, 0]],
        arm: [[1.2, 0], [2.0, 0.55], [7.5, 0.55], [8.1, 0]],
        ...grepp(8.1),
      },
    },
  };
  // Klippen in i tidslinjen: nycklarna i tidslinjens tid, med början och slut.
  const KL = [];
  const tom = (a = 0, b = 0) => [[0, a], [1e-3, b]];
  for (const [namn, o] of Object.entries(RORELSER)) {
    const m = KLIPP[namn];
    const { fran, till, vila = 0, start = 0 } = m;
    const dur = till - fran;
    const Sa = lage(start);
    const Sb = lage(vila);
    // nycklar i klippets tid → tidslinjens, med början a och slut b (det som står på gränserna faller bort)
    const abs = (k = [], a = 0, b = 0, bas = 0) => [[fran, a], ...k.filter((x) => x[0] > 0 && x[0] < dur).map(([t, v]) => [fran + t, v + bas]), [till, b]];
    const d = {};
    for (const x of KANAL) d[x] = abs(o.k && o.k[x], Sa[x] - S0[x], Sb[x] - S0[x], Sa[x] - S0[x]);
    for (const x of ANSIKTE) if (o.k && o.k[x]) d[x] = abs(o.k[x]);
    const k = { namn, fran, till, d, kaffe: o.kaffe, cig: o.cig, dunk: (m.dunk || []).map(([t, s, sort]) => [fran + t, s, sort]) };
    // armarna: mellan klippen i vilan
    const armar = (K, nycklar, vila_, pol) => {
      if (!nycklar) return;
      K.push([fran, ...vila_]);
      for (const [t, W, p, ...r] of nycklar) K.push([fran + t, W, p === vila_[1] ? p : pol(p), ...r]);
      K.push([till, ...vila_]);
    };
    armar(VA, o.A, VILA_A, polA);
    armar(VB, o.B, VILA_B, polB);
    const tid = (k2) => k2.map(([t, ...r]) => [fran + t, ...r]);
    // röken: under en tid (fran–till) eller på en gång (t)
    const rokTid = (l = []) => l.map((r) => ({ ...r, fran: fran + (r.fran ?? r.t), till: fran + (r.till ?? r.t), t: fran + (r.t ?? r.fran) }));
    if (o.kaffe) {
      const c = o.kaffe;
      const kan_ = (x) => (c[x] ? tid(c[x]) : tom());
      k.kaffe = {
        kk: [[fran, 'fat'], ...tid(c.kk), [till, 'fat']], tipp: kan_('tipp'), snurr: kan_('snurr'), lill: kan_('lill'), arm: kan_('arm'),
        mot: c.mot.map((t) => fran + t), krok: tid(c.krok), rok: rokTid(c.rok),
      };
    }
    if (o.cig) {
      const c = o.cig;
      k.cig = {
        ck: tid(c.ck), krok: tid(c.krok), mot: c.mot.map((t) => fran + t), upp: c.upp.map((t) => fran + t), grepp: c.grepp.map((t) => fran + t),
        glod: tid(c.glod), iMun: tid(c.iMun), blaser: c.blaser ? tid(c.blaser) : tom(), pust: c.pust ? tid(c.pust) : tom(),
        rok: rokTid(c.rok),
      };
    }
    KL.push(k);
  }
  KL.sort((a, b) => a.fran - b.fran);
  VA.sort((a, b) => a[0] - b[0]);
  VB.sort((a, b) => a[0] - b[0]);
  const aktivt = (t) => KL.find((k) => t > k.fran && t < k.till) || null;
  // Slagen i disken: [T, styrka, sort]; och när koppen ställs ned på fatet [T, styrka]
  const DUNK = Object.values(KLIPP).flatMap((m) => (m.dunk || []).map(([t, s, sort]) => [m.fran + t, s, sort]));
  const NED = Object.values(KLIPP).flatMap((m) => (m.ned || []).map(([t, s]) => [m.fran + t, s]));

  // Det som står på disken hoppar när han slår i den: koppen studsar på fatet, lägre för varje gång,
  // fatet lite, askkoppen knappt och cigarren i urtaget. Höjden (i världens enheter) vid dt efter slaget.
  const TYNGD = 3100;
  const STUDS = [1, 0.13, 0.02];
  const KOPPHOPP = 38;
  function studs(dt, h) {
    let t0 = 0;
    for (const k of STUDS) {
      const v = Math.sqrt(2 * TYNGD * h * k);
      const T = (2 * v) / TYNGD;
      if (dt < t0 + T) { const x = dt - t0; return Math.max(0, v * x - 0.5 * TYNGD * x * x); }
      t0 += T;
    }
    return 0;
  }
  // när koppen landar på fatet efter ett slag: [tid efter slaget, hur hårt (0–1)]
  function landar(s) {
    let t0 = 0;
    return STUDS.map((k) => { t0 += (2 * Math.sqrt(2 * TYNGD * KOPPHOPP * s * k)) / TYNGD; return [t0, s * Math.sqrt(k)]; });
  }
  const HOPP = { kopp: 0, fat: 0, ask: 0, cig: 0 };
  function hoppar(t) {
    HOPP.kopp = HOPP.fat = HOPP.ask = HOPP.cig = 0;
    for (const [td, s] of DUNK) {
      const dt = t - td;
      if (dt < 0 || dt > 0.8) continue;
      HOPP.kopp += studs(dt, KOPPHOPP * s);
      HOPP.fat += studs(dt, 9 * s);
      HOPP.ask += studs(dt, 2.5 * s);
      HOPP.cig += studs(dt, 11 * s);
    }
    return HOPP;
  }
  function nyckel(K, t, ut) {
    let i = 1;
    while (i < K.length - 1 && t > K[i][0]) i++;
    const a = K[i - 1];
    const b = K[i];
    const x = clamp((t - a[0]) / (b[0] - a[0]));
    // ett slag: allt fortare, och tvärt stopp
    const f = b[7] ? x ** 2.2 : x * x * (3 - 2 * x);
    const l3 = (o, x, y) => o.set(x[0] + (y[0] - x[0]) * f, x[1] + (y[1] - x[1]) * f, x[2] + (y[2] - x[2]) * f);
    l3(ut.w, a[1], b[1]); l3(ut.pol, a[2], b[2]); l3(ut.F, a[3], b[3]); l3(ut.P, a[4], b[4]);
    ut.krok = a[5] + (b[5] - a[5]) * f;
    ut.peka = a[6] + (b[6] - a[6]) * f;
    return ut;
  }
  const v = () => new THREE.Vector3();
  const na = { w: v(), pol: v(), F: v(), P: v(), krok: 0, peka: 0 };
  const nb = { w: v(), pol: v(), F: v(), P: v(), krok: 0, peka: 0 };
  const d_ = v();
  const dir_ = v();
  const pp_ = v();
  const E_ = v();
  const Wr_ = v();
  function ik(Sk, Wr, pol, Eut, Wut) {
    d_.subVectors(Wr, Sk);
    // (utsträckt får den vara något längre än i fotot: det syns inte på en raklång arm)
    const hel = d_.length();
    const tj = Math.min(1.3, Math.max(1, hel / (0.97 * (LA + LB))));
    const la = LA * tj;
    const lb = LB * tj;
    const len = Math.min(hel, la + lb - 4);
    dir_.copy(d_).normalize();
    const a = (la * la - lb * lb + len * len) / (2 * len);
    const h = Math.sqrt(Math.max(0, la * la - a * a));
    pp_.copy(pol).addScaledVector(dir_, -pol.dot(dir_)).normalize();
    Eut.copy(Sk).addScaledVector(dir_, a).addScaledVector(pp_, h);
    Wut.copy(Sk).addScaledVector(dir_, len);
  }
  const FA = v();
  const eu = new THREE.Euler();
  const mh = new THREE.Matrix4();
  const mk = new THREE.Matrix4();
  const mr = new THREE.Matrix4();
  const HOFT = new THREE.Vector3(0, -413, 60);
  const h1 = v();
  const sa = v();
  const sb = v();

  // Fingrarna trummar otåligt på disken (trumma): från lillfingret till pekfingret, två varv.
  let trumT = -9;
  const trumF = [0, 0, 0, 0];
  function trummar(n) {
    const t = n - trumT;
    if (t < 0 || t > 0.86) return null;
    for (let i = 0; i < 4; i++) {
      const f = ((t * 3.2) % 1) * 4 - (3 - i);
      trumF[i] = f > 0 && f < 1 ? -Math.sin(f * Math.PI) * 0.3 : 0;
    }
    return trumF;
  }

  // ---------- cigarren ----------
  // Han tar cigarren ur askkoppen med höger hand, och det är cigarren som styr: dess läge räknas fram
  // (i askkoppen, vid munnen i huvudets mått, vid axeln) och handen räknas ur greppet, så att den
  // sitter kvar i fingrarna hela vägen. Klippets cig: lägena (ck), fingrarna (krok), när armen går
  // fram och tillbaka (mot) och upp mot ansiktet (upp), när fingrarna har den (grepp), glöden, läpparna
  // om den (iMun), munnen när han blåser ut (blaser) och pustar (pust), och röken.
  // Greppet (handens mått, skalad som handen): tummen under, pek- och långfingret ovanpå. I
  // cigarrens läge är x fingrarnas riktning, y från huvudet mot glöden och z ut ur handflatan.
  const GREPP = new THREE.Vector3(43, 148, 100).multiplyScalar(0.92);
  const SG = 60;
  const EXTRA_C = [0, 0.02, 0.2, 0.3];
  const extraC = [0, 0, 0, 0];
  const mq = new THREE.Matrix4();
  const nyPose = () => ({ p: v(), q: new THREE.Quaternion() });
  const pA_ = v();
  const pF_ = v();
  const pP_ = v();
  // läget ur greppets punkt p, cigarrens riktning A (huvudet mot glöden) och handflatans P
  function pose(ut, p, A, P) {
    pA_.copy(A).normalize();
    pF_.crossVectors(pA_, P).normalize();
    pP_.crossVectors(pF_, pA_);
    mq.makeBasis(pF_, pA_, pP_);
    ut.q.setFromRotationMatrix(mq);
    ut.p.copy(p);
    return ut;
  }
  // I askkoppen: huvudet på disken, cigarren över urtagets yttre kant och glöden över mitten.
  // Han tar den ovanifrån, med handflatan nedåt.
  const CU = new THREE.Vector3(Math.cos(ASKV), 0, Math.sin(ASKV));
  const SN = 105;
  const sinA = (ASKKOPP.URTAG + 0.2) / SN;
  const A_VILA = CU.clone().multiplyScalar(-Math.sqrt(1 - sinA * sinA));
  A_VILA.y = sinA;
  const HUV_C = new THREE.Vector3(...ASK).addScaledVector(CU, ASKKOPP.R + SN * Math.sqrt(1 - sinA * sinA));
  HUV_C.y += CIGARR.R + 0.4;
  const NED_ = new THREE.Vector3(0, -1, 0);
  // läget ur handen: handens origo H, fingrarnas riktning F och handflatans P
  const fA = v();
  function fraHand(ut, H, F, P) {
    fA.crossVectors(F, P).negate().normalize();
    return pose(ut, H.clone().addScaledVector(fA, -GREPP.x).addScaledVector(F, GREPP.y).addScaledVector(P, GREPP.z), fA, P);
  }
  const PV = {
    vila: pose(nyPose(), HUV_C.clone().addScaledVector(A_VILA, SG), A_VILA, NED_),
    // armbågen på disken och handen uppe vid axeln, cigarren tvärs över och glöden utåt
    hall: fraHand(nyPose(), V3(-310, 165, 540), V3(0.12, 0.9, 0.42).normalize(), V3(0.25, -0.45, 0.86).normalize()),
    // lite högre och vriden, glöden uppåt: han tittar på den
    se: fraHand(nyPose(), V3(-290, 215, 560), V3(0.3, 0.85, 0.43).normalize(), V3(0.1, -0.48, 0.87).normalize()),
  };
  // Över askkoppen, med glöden över skålen och cigarren snett nedåt ut från handen; han knackar av
  // askan med ett kort ryck nedåt (knackN).
  {
    const A = V3(-0.82, -0.42, 0.38).normalize();
    const glod = V3(ASK[0] + 10, BORD.Y + 55, ASK[2] - 10);
    const P = V3(0.25, -0.92, 0.3);
    PV.knack = pose(nyPose(), glod.clone().addScaledVector(A, -(CIGARR.L + 1 - SG)), A, P);
    PV.knackN = pose(nyPose(), PV.knack.p.clone().add(V3(0, -14, 0)), A, P);
  }
  // Vid munnen räknas läget i huvudets mått: huvudet en bit in mellan läpparna, cigarren ut åt
  // hans högra sida och lite nedåt. Tummen pekar mot munnen och handen sitter ut åt sidan (d) från
  // greppet, vid kinden, så att den inte skymmer ansiktet.
  const MUND = W_(662, 509, 0);
  MUND.z = djup(662, 509) - 6;
  const A_MUN = new THREE.Vector3(-0.7, -0.2, 0.68).normalize();
  const P_MUN = (() => {
    const T = A_MUN.clone().negate();
    const d = new THREE.Vector3(-1, -0.25, -0.35);
    const e = d.addScaledVector(T, -d.dot(T)).normalize().negate();
    const e2 = new THREE.Vector3().crossVectors(T, e);
    return e2.multiplyScalar(GREPP.y).addScaledVector(e, GREPP.z).normalize();
  })();
  const BORT = new THREE.Vector3(-58, -36, 52);
  const PIV = U.uPiv.value;
  const iHuvud = (p, ut) => ut.copy(p).sub(PIV).applyMatrix3(U.uHuvud.value).add(PIV).applyMatrix4(mk);
  const riktH = (d, ut) => ut.copy(d).applyMatrix3(U.uHuvud.value).transformDirection(mk);
  const hA = v();
  const hP = v();
  const hp = v();
  function vidMunnen(ut, ut2) {
    riktH(A_MUN, hA);
    riktH(P_MUN, hP);
    iHuvud(MUND, hp);
    pose(ut, hp.addScaledVector(hA, SG), hA, hP);
    // och utdragen
    iHuvud(hp.copy(MUND).add(BORT), hp);
    pose(ut2, hp.addScaledVector(hA, SG), hA, hP);
  }
  const PM = { mun: nyPose(), bort: nyPose() };
  const posen = (namn) => PM[namn] || PV[namn];
  function cigarrLage(t, ut, c) {
    const CK = c && c.ck;
    if (!CK || t <= CK[0][0] || t >= CK[CK.length - 1][0]) return pose(ut, PV.vila.p, A_VILA, NED_);
    let i = 1;
    while (t > CK[i][0]) i++;
    const f = ss(CK[i - 1][0], CK[i][0], t);
    const a = posen(CK[i - 1][1]);
    const b = posen(CK[i][1]);
    ut.p.lerpVectors(a.p, b.p, f);
    ut.p.y += (CK[i][2] || 0) * Math.sin(f * Math.PI);
    ut.q.slerpQuaternions(a.q, b.q, f);
    return ut;
  }
  const cp = nyPose();
  const fot = v();
  const cA = v();
  const cF = v();
  const cP = v();
  const cX = v();
  const cH = v();
  const cW = v();
  const cE = v();
  const cWr = v();
  const POL_UPP = new THREE.Vector3(-0.62, -0.78, 0.1).normalize();
  const cPol = v();
  // cigarren på sin plats, och var handen ska vara för att hålla den
  function cigarrSatt(cp) {
    cA.set(0, 1, 0).applyQuaternion(cp.q);
    cF.set(1, 0, 0).applyQuaternion(cp.q);
    cP.set(0, 0, 1).applyQuaternion(cp.q);
    cig.mesh.matrix.makeRotationFromQuaternion(cp.q).setPosition(cX.copy(cp.p).addScaledVector(cA, -SG));
    cig.mesh.matrixWorldNeedsUpdate = true;
    fot.copy(cig.FOT).applyMatrix4(cig.mesh.matrix);
    // handens origo: tummen (handens x) pekar mot huvudet
    cH.copy(cp.p).addScaledVector(cA, GREPP.x).addScaledVector(cF, -GREPP.y).addScaledVector(cP, -GREPP.z);
  }
  // handleden för handen i H: handen sitter 26 bortom handleden längs underarmen
  function vristTill(Sk, H, pol, ut) {
    ut.copy(H).sub(Sk).normalize();
    for (let i = 0; i < 3; i++) {
      cW.copy(H).addScaledVector(ut, -26);
      ik(Sk, cW, pol, cE, cWr);
      ut.subVectors(cWr, cE).normalize();
    }
    return cW.copy(H).addScaledVector(ut, -26);
  }
  const cU = v();
  function cigarrArm(t, Sk, a, c) {
    vidMunnen(PM.mun, PM.bort);
    cigarrLage(t, cp, c);
    cigarrSatt(cp);
    // fram till askkoppen och tillbaka i en båge; däremellan håller han den
    const mot = ss(c.mot[0], c.mot[1], t) * (1 - ss(c.mot[2], c.mot[3], t));
    const upp = ss(c.upp[0], c.upp[1], t) * (1 - ss(c.upp[2], c.upp[3], t));
    // (vilans riktning är armbågens hela längd: båda som enhetsvektorer, annars tar den nya över först på slutet)
    cPol.fromArray(VILA_A[1]).normalize().lerp(POL_UPP, upp);
    vristTill(Sk, cH, cPol, cU);
    a.w.lerp(cW, mot);
    a.w.y += 220 * mot * (1 - mot);
    a.pol.normalize().lerp(cPol, mot);
    a.F.lerp(cF, mot);
    a.P.lerp(cP, mot);
    a.krok = spar(c.krok, t);
    a.peka = 0;
    const g = ss(c.grepp[0], c.grepp[1], t) * (1 - ss(c.grepp[2], c.grepp[3], t));
    for (let i = 0; i < 4; i++) extraC[i] = EXTRA_C[i] * g;
    return extraC;
  }
  // ---------- kaffet ----------
  // Det är koppen som styr, som med cigarren: dess läge räknas fram och handen sitter i örat med samma
  // grepp hela vägen, fingrarna mot koppen, pekfingret genom örat, tummen ovanpå och handflatan mot
  // honom. Lägena: på fatet; vid läppen, lite lägre (lyft) och under näsan i huvudets mått, så att
  // koppen följer med när han lutar huvudet bakåt; under hakan, en bit ned från munnen (ah), framför
  // bröstet och upplyft mot en (skal) i kroppens. Klippets kaffe: lägena (kk), lutningen mot läppen
  // (tipp, radianer: koppen vrids runt kanten mot hans underläpp, så att den ligger kvar där medan han
  // dricker), lillfingret ut (lill), armbågen ut (arm), koppen i små cirklar (snurr), när armen går
  // dit och tillbaka (mot), fingrarna (krok) och ångan (rok).
  const KUP = V3(KOPP[0], KOPP[1] + 11, KOPP[2]);
  // kanten: höjden och radien, och kanten mot honom i koppens mått (örat åt +x, han åt −z)
  const KH = 113;
  const KR = 62;
  const NARA = V3(0, KH, -KR);
  // greppet i koppens mått: fingrarna, handflatan och handleden (örat vid fingrarnas första led)
  const GF = V3(-1, 0.12, 0.3).normalize();
  const GP = V3(0.1, -0.3, -1).normalize();
  const GW = K.ORA.clone().addScaledVector(GF, -165);
  // armbågen: nedåt och utåt, och ut åt sidan (arm)
  const POLK = V3(0.5, -0.82, 0.2).normalize();
  const POLK_UT = V3(0.9, -0.45, 0.1).normalize();
  // ett läge ur botten p, axeln A (botten mot kanten) och örat åt H
  function koppPose(ut, p, A, H) {
    pA_.copy(A).normalize();
    pF_.copy(H).addScaledVector(pA_, -H.dot(pA_)).normalize();
    pP_.crossVectors(pF_, pA_);
    mq.makeBasis(pF_, pA_, pP_);
    ut.q.setFromRotationMatrix(mq);
    ut.p.copy(p);
    return ut;
  }
  // vid läppen: kanten mot honom dy och dz från underläppen, koppen lutad v mot honom
  const LAPP = W_(662, 530, 0);
  LAPP.z = djup(662, 530) + 4;
  function vidLappen(dy, dz, v) {
    const A = V3(0, Math.cos(v), -Math.sin(v));
    const N = V3(0, -Math.sin(v), -Math.cos(v));
    return { p: LAPP.clone().add(V3(0, dy, dz)).addScaledVector(A, -KH).addScaledVector(N, -KR), A, H: V3(1, 0, 0.6) };
  }
  const KHUV = { mun: vidLappen(0, 0, 0.35), lyft: vidLappen(-55, 45, 0.25), nasa: vidLappen(26, 34, 0.06) };
  const KKROPP = {
    hake: vidLappen(-160, 150, 0.1),
    ah: vidLappen(-150, 130, 0.15),
    brost: { p: V3(70, -10, 480), A: V3(0, 1, -0.3), H: V3(1, 0, 0.45) },
    skal: { p: V3(250, 330, 620), A: V3(0.05, 1, 0.3), H: V3(1, 0, 0.1) },
  };
  const KP = { fat: koppPose(nyPose(), KUP, V3(0, 1, 0), V3(Math.cos(0.5), 0, Math.sin(0.5))) };
  for (const n of [...Object.keys(KHUV), ...Object.keys(KKROPP)]) KP[n] = nyPose();
  const kA = v();
  const kH = v();
  const kp_ = v();
  function kaffeLagen() {
    for (const [n, l] of Object.entries(KHUV)) koppPose(KP[n], iHuvud(l.p, kp_), riktH(l.A, kA), riktH(l.H, kH));
    for (const [n, l] of Object.entries(KKROPP)) koppPose(KP[n], kp_.copy(l.p).applyMatrix4(mk), kA.copy(l.A).transformDirection(mk), kH.copy(l.H).transformDirection(mk));
  }
  const qT = new THREE.Quaternion();
  const VRID_K = 0.5;
  function kaffeLage(t, ut, c) {
    const KK = c.kk;
    let i = 1;
    while (i < KK.length - 1 && t > KK[i][0]) i++;
    const f = ss(KK[i - 1][0], KK[i][0], t);
    const a = KP[KK[i - 1][1]];
    const b = KP[KK[i][1]];
    ut.p.lerpVectors(a.p, b.p, f);
    ut.p.y += (KK[i][2] || 0) * Math.sin(f * Math.PI);
    ut.q.slerpQuaternions(a.q, b.q, f);
    // lutad mot läppen, runt kanten mot honom; örat vrids samtidigt in mot kinden (runt koppens axel,
    // så att koppen står kvar), annars stiger handen upp framför ögat
    const fi = spar(c.tipp, t);
    if (fi) {
      kH.set(1, 0, 0).applyQuaternion(ut.q);
      kp_.copy(NARA).applyQuaternion(ut.q).add(ut.p);
      qT.setFromAxisAngle(kA.set(0, 1, 0).applyQuaternion(ut.q), VRID_K * Math.min(1, fi));
      ut.q.premultiply(qT);
      qT.setFromAxisAngle(kH, -fi);
      ut.q.premultiply(qT);
      ut.p.sub(kp_).applyQuaternion(qT).add(kp_);
    }
    const sn = spar(c.snurr, t);
    if (sn) {
      ut.p.x += sn * 16 * Math.cos(t * 13);
      ut.p.z += sn * 16 * Math.sin(t * 13);
    }
    return ut;
  }
  const kp = nyPose();
  const extraK = [0, 0, 0, 0, 0, 0, 0, 0];
  function kaffeArm(t, b, c) {
    kaffeLagen();
    kaffeLage(t, kp, c);
    kopp.position.copy(kp.p);
    kopp.quaternion.copy(kp.q);
    kopp.updateMatrix();
    // på väg dit, och kvar medan han håller
    const [m0, m1, m2, m3] = c.mot;
    const mot = ss(m0, m1, t) * (1 - ss(m2, m3, t));
    b.w.fromArray(VILA_B[0]).lerp(kp_.copy(GW).applyQuaternion(kp.q).add(kp.p), mot);
    // (vilans riktning som enhetsvektor, annars tar den nya över först på slutet)
    b.pol.fromArray(VILA_B[1]).normalize().lerp(kA.copy(POLK).lerp(POLK_UT, spar(c.arm, t)), mot);
    b.F.fromArray(VILA_B[2]).lerp(kH.copy(GF).applyQuaternion(kp.q), mot);
    b.P.fromArray(VILA_B[3]).lerp(kA.copy(GP).applyQuaternion(kp.q), mot);
    b.krok = VILA_B[4] + (spar(c.krok, t) - VILA_B[4]) * mot;
    b.peka = 0;
    // lillfingret rakt ut och ut från de andra, och ringfingret lite
    const l = spar(c.lill, t) * mot;
    if (!l) return null;
    extraK[2] = -0.3 * b.krok * l;
    extraK[3] = -(b.krok + 0.25) * l;
    extraK[6] = -5 * l;
    extraK[7] = -18 * l;
    return extraK;
  }
  // röken: glöden ryker hela tiden (mer när han drar), och han blåser ut röken: genom munnen (blas), i
  // en stråle ur mungipan (strale), i ringar (ring) eller genom näsan (nasa). Askan faller när han
  // knackar av den (aska), och ur kaffet stiger ånga (anga, blas: han blåser bort den).
  const fot0 = v();
  const rv = v();
  const rd = v();
  const rm = v();
  const rj = v();
  let rokN = null;
  let rokSkuld = 0;
  const skuld = new Map();
  // (snett uppåt åt hans vänstra sida, inte framför ansiktet)
  const BLAS = new THREE.Vector3(0.7, 0.72, 0.25).normalize();
  const PUFF = new THREE.Vector3(0.35, 0.28, 0.9).normalize();
  const MUNHORN = W_(680, 511, 0);
  MUNHORN.z = djup(680, 511);
  // (strålen åt hans vänstra sida, ringarna uppåt framåt, näsan nedåt framåt)
  const STRALE = V3(0.85, 0.3, 0.45).normalize();
  const RINGEN = V3(0.86, 0.36, 0.36).normalize();
  const NASAN = [W_(645, 476, 0), W_(679, 476, 0)].map((p) => { p.z = djup(p.x + 660, 900 - p.y) + 4; return p; });
  const NASDIR = V3(0.5, -0.6, 0.62).normalize();
  // (ångan han blåser bort från koppen: åt hans vänstra sida och uppåt, så att den syns framifrån)
  const ANGA = V3(0.82, 0.4, 0.4).normalize();
  const UPP = V3(0, 1, 0);
  const ru = v();
  const rw = v();
  let rokT = null;
  let nasa = 0;
  // en rökring: partiklar i en cirkel runt munnen, som far iväg och vidgar sig
  function ring(c, d) {
    ru.crossVectors(d, UPP);
    if (ru.lengthSq() < 1e-4) ru.set(1, 0, 0);
    ru.normalize();
    rw.crossVectors(d, ru);
    const N = 28;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      rj.copy(ru).multiplyScalar(Math.cos(a)).addScaledVector(rw, Math.sin(a));
      rm.copy(c).addScaledVector(rj, 6).addScaledVector(d, 10);
      rv.copy(d).multiplyScalar(330).addScaledVector(rj, 85).add(rd.set(slump(), slump(), slump()).multiplyScalar(5));
      rok.slapp(rm, rv, { liv: 4, r0: 5, r1: 20, a: 0.42, broms: 1, lyft: 6, sort: 1, virv: 0.1, inn: 0.06 });
    }
  }
  const slump = () => Math.random() - 0.5;
  function roken(n, t, glod, kl) {
    const dt = rokN === null ? 0 : clamp(n - rokN, 0, 0.1);
    rokN = n;
    const t0 = rokT === null ? t : rokT;
    rokT = t;
    const c = kl && kl.cig;
    if (dt > 0) {
      // en tunn tråd ur glöden, utspridd längs vägen om cigarren rör sig
      rokSkuld += dt * (14 + 34 * glod);
      const k = Math.floor(rokSkuld);
      rokSkuld -= k;
      for (let i = 0; i < k; i++) {
        rm.lerpVectors(fot0, fot, (i + 1) / k);
        rok.slapp(rm, rv.set(slump() * 4, 26 + slump() * 8, slump() * 4), { liv: 3.4, r0: 1.7, r1: 22, a: 0.2, lyft: 16 });
      }
      const listor = [c && c.rok, kl && kl.kaffe && kl.kaffe.rok];
      for (const l of listor) if (l) for (const r of l) {
        // på en gång: en ring, eller askan som faller
        if (r.sort === 'ring' || r.sort === 'aska') {
          if (r.t <= t0 || r.t > t) continue;
          if (r.sort === 'ring') ring(iHuvud(MUND, rm).clone(), riktH(RINGEN, rd).clone());
          else for (let i = 0; i < 12; i++) rok.slapp(fot, rv.set(slump() * 50, -25 + slump() * 30, slump() * 50), { liv: 0.5, r0: 3.2, r1: 4.2, a: 0.95, lyft: -360, sort: 1, virv: 0, inn: 0.01 });
          continue;
        }
        if (t <= r.fran || t >= r.till) continue;
        // en liten pust mellan blossen i mungipan, ångan ur kaffet, och annars ut med röken, mest i början
        const sort = r.sort;
        const takt = sort === 'pust' ? 40 : sort === 'anga' ? r.styrka : r.styrka * Math.exp(-(t - r.fran) * r.avtag);
        const s = (skuld.get(r) || 0) + dt * takt;
        const kb = Math.floor(s);
        skuld.set(r, s - kb);
        if (!kb) continue;
        if (sort === 'anga') {
          // ur koppens yta; när han blåser far den bort från honom, och när han drar in doften mot näsan
          if (r.sug) iHuvud(NASAN[0], rd).add(iHuvud(NASAN[1], ru)).multiplyScalar(0.5);
          for (let i = 0; i < kb; i++) {
            rm.set(0, 118, 0).applyQuaternion(kopp.quaternion).add(kopp.position).add(rj.set(slump() * 50, 0, slump() * 50));
            if (r.blas) rv.copy(ANGA).multiplyScalar(150 + slump() * 40).add(rj.set(slump() * 30, slump() * 30, slump() * 30));
            else if (r.sug) rv.subVectors(rd, rm).multiplyScalar(2.2).add(rj.set(slump() * 12, slump() * 12, slump() * 12));
            else rv.set(slump() * 10, 34 + slump() * 12, slump() * 10);
            rok.slapp(rm, rv, { liv: r.blas ? 1.5 : 2.4, r0: r.blas ? 12 : 10, r1: r.blas ? 60 : 44, a: r.blas ? 0.2 : 0.13, broms: 1.3, lyft: 22, sort: 1, virv: 0.8, inn: 0.15 });
          }
          continue;
        }
        const pust = sort === 'pust';
        const strale = sort === 'strale';
        const nas = sort === 'nasa';
        if (!nas) {
          iHuvud(pust || strale ? MUNHORN : MUND, rm);
          riktH(pust ? PUFF : strale ? STRALE : BLAS, rd);
        } else riktH(NASDIR, rd);
        for (let i = 0; i < kb; i++) {
          if (nas) iHuvud(NASAN[nasa++ % 2], rm);
          if (pust) rv.copy(rd).multiplyScalar(35).add(rj.set(slump(), slump(), slump()).multiplyScalar(14));
          else if (strale) rv.copy(rd).multiplyScalar(230 + slump() * 40).add(rj.set(slump(), slump(), slump()).multiplyScalar(16));
          else if (nas) rv.copy(rd).multiplyScalar(105 + slump() * 30).add(rj.set(slump(), slump(), slump()).multiplyScalar(14));
          else rv.copy(rd).multiplyScalar(165 + slump() * 50).add(rj.set(slump(), slump(), slump()).multiplyScalar(46));
          rok.slapp(rm, rv, pust ? { liv: 2.2, r0: 3, r1: 28, a: 0.12, broms: 1.2, lyft: 15, sort: 1, virv: 0.7 }
            : strale ? { liv: 2.8, r0: 3, r1: 48, a: 0.12, broms: 1.5, lyft: 20, sort: 1, virv: 0.6, inn: 0.15 }
              : nas ? { liv: 2.6, r0: 4, r1: 46, a: 0.15, broms: 1.4, lyft: 22, sort: 1, virv: 0.6, inn: 0.15 }
                : { liv: 3.0, r0: 5, r1: 70, a: 0.13, broms: 1.6, lyft: 24, sort: 1, virv: 0.7, inn: 0.3 });
        }
      }
    }
    fot0.copy(fot);
    rok.steg(dt, n, BORD.Y);
  }

  // Huvudet vänt mot kameran, som står vid hans vänstra sida: ansiktet ses nästan rakt framifrån.
  const YAW0 = 0.25;
  let sistaT = 0;
  let sistaN = 0;
  // T: var i rörelserna (0–2,5 vilan, 2,5–5,5 fram till domen, 5,5–9,95 gesterna
  // medan han pratar, hemåt till 12,4, sedan klippen i KLIPP), n: klockan för det som alltid rör sig,
  // tal: 1 medan han pratar med händerna vilande, mun: hur mycket munnen rör sig
  // (annars följer den tal och gesterna)
  function rita(T, n, tal = 0, mun = null) {
    const t = T;
    sistaT = T; sistaN = n;
    const kl = aktivt(t);
    // klippets skillnad mot vilan, och huvudet, kroppen och brynen
    const d = (x) => (kl && kl.d[x] ? spar(kl.d[x], t) : 0);
    const kan = (x) => spar(HUV[x], t) + d(x);
    const skratt = ss(2.75, 3.05, t) * (1 - ss(4.25, 4.6, t));
    const talar = Math.max(tal, ss(5.55, 5.7, t) * (1 - ss(9.4, 9.6, t)));
    const dricker = d('dricker');
    // cigarren: i munnen, och när han blåser ut
    const cc = kl && kl.cig;
    const iMun = cc ? spar(cc.iMun, t) : 0;
    const blaser = cc ? spar(cc.blaser, t) : 0;
    const glod = cc ? spar(cc.glod, t) : 0;
    const yaw = YAW0 + 0.22 * (kan('yaw') + 0.1 * Math.sin(n * 0.8) * (1 - iMun * 0.6) + talar * 0.28 * Math.sin(n * 2.7 + 1));
    const pitch = 0.17 * (kan('pitch') + talar * 0.3 * Math.sin(n * 6.1) + skratt * 0.16 * Math.sin(n * 15) - dricker * 1.15);
    const roll = -(kan('roll') + talar * 0.03 * Math.sin(n * 3.3));
    eu.set(pitch, yaw, roll, 'YXZ');
    mh.makeRotationFromEuler(eu);
    U.uHuvud.value.setFromMatrix4(mh);
    const lut = kan('lut');
    const vrid = kan('vrid') + talar * 0.015 * Math.sin(n * 2.1);
    const sid = kan('sid') + 0.003 * Math.sin(n * 0.55);
    eu.set(lut, vrid, sid, 'YXZ');
    mr.makeRotationFromEuler(eu);
    mk.copy(mr);
    h1.copy(HOFT).applyMatrix4(mr);
    mk.setPosition(HOFT.x - h1.x, HOFT.y - h1.y, HOFT.z - h1.z);
    U.uKropp.value.copy(mk);
    const axV = kan('axV') + skratt * 5 * Math.sin(n * 15);
    const axH = kan('axH') + skratt * 5 * Math.sin(n * 15);
    U.uAx.value.set(axV, axH);
    U.uAndas.value = 7 * Math.sin(n * 1.5) + skratt * 5 * Math.sin(n * 15);
    const lyft = talar * 0.38 * Math.max(0, Math.sin(n * 4.3));
    U.bryn.value.set(kan('brynX') + lyft, kan('brynY') + lyft);
    U.le.value = Math.max(0.14 * (1 - ss(2.5, 2.8, t)), skratt, 0.3 * ss(8.3, 8.8, t) * (1 - ss(9.4, 9.8, t)), 0.6 * ss(10, 10.5, t) * (1 - ss(11.6, 12.4, t)), 0.14 * ss(11.6, 12.4, t), d('le'));
    // talet: stavelser med små pauser, ibland rundare läppar
    const stav = Math.abs(Math.sin(n * 7.3)) * (0.42 + 0.58 * ss(-0.35, 0.5, Math.sin(n * 2.3 + 0.7))) * (0.72 + 0.28 * Math.sin(n * 17.3));
    const talMun = (mun === null ? talar : mun) * (1 - dricker) * (1 - Math.max(iMun, blaser));
    // läpparna om cigarren, en pust mellan blossen och ett o när han blåser ut
    const puff = cc ? spar(cc.pust, t) : 0;
    U.munn.value = Math.max(talMun * stav * 0.62, skratt * (0.92 + 0.14 * Math.sin(n * 14)), ss(4.9, 5.0, t) * (1 - ss(5.0, 5.25, t)) * 0.72, iMun * (0.15 + 0.12 * puff), blaser * (0.27 + 0.05 * Math.sin(n * 7)), d('munn'));
    U.rund.value = talMun * Math.max(0, Math.sin(n * 3.1 + 1.3)) * 0.8;
    U.kis.value = Math.max(skratt * 0.75, U.le.value * 0.45, d('kis'));
    // blinkningarna: en gång i några sekunder, klockan avgör
    const fas = (n % 4.3);
    const bl = 1 - clamp(Math.abs(fas - 0.3) / 0.085);
    U.rund.value = Math.max(U.rund.value, dricker * 0.7, iMun * 0.85, blaser, d('rund'));
    U.blund.value = Math.max(dricker * 0.82, skratt * 0.42, bl, ss(10.7, 10.9, t) * (1 - ss(11.25, 11.45, t)), d('blund'));
    U.blick.value.set(4 * clamp((yaw - YAW0) / 0.2, -1, 1), 0);
    sa.copy(SA);
    sa.y += axV;
    sa.x -= axV * 0.25;
    sa.applyMatrix4(mk);
    sb.copy(SB);
    sb.y += axH;
    sb.x += axH * 0.25;
    sb.applyMatrix4(mk);
    const a = nyckel(VA, t, na);
    const b = nyckel(VB, t, nb);
    // det som står på disken, om han har slagit i den
    hoppar(t);
    // cigarren ligger i askkoppen, eller i hans hand
    let extraA = null;
    if (cc) extraA = cigarrArm(t, sa, a, cc);
    else {
      cigarrLage(0, cp, null);
      cp.p.y += HOPP.cig;
      cigarrSatt(cp);
    }
    ask.mesh.position.y = ASK[1] + HOPP.ask;
    cig.U.uGlod.value = glod;
    cig.U.uTid.value = n;
    const kaffe = kl && kl.kaffe;
    const extraB = kaffe ? kaffeArm(t, b, kaffe) : null;
    const isar = ss(2.5, 3, t) * (1 - ss(4.3, 4.8, t));
    if (t > 5.95 && t < 8.15) {
      const k = Math.sin(n * 6.6) * ss(5.95, 6.15, t) * (1 - ss(7.95, 8.15, t));
      a.w.y += k * 34;
      a.w.x += k * 10;
      a.F.z += k * 0.25;
    }
    a.w.y += skratt * 7 * Math.sin(n * 15);
    b.w.y += skratt * 7 * Math.sin(n * 15 + 1);
    ik(sa, a.w, a.pol, E_, Wr_);
    const trum = t < 2.5 || (t > 9.95 && t < 20) ? trummar(n) : extraA;
    A.satt(sa, E_, Wr_, a.F, a.P, a.krok, a.peka, isar, 0.45, trum);
    U.uArm.value[0].copy(sa); U.uArm.value[1].copy(E_); U.uArm.value[2].copy(Wr_);
    ik(sb, b.w, b.pol, E_, Wr_);
    B.satt(sb, E_, Wr_, b.F, b.P, b.krok, b.peka, isar * 0.8, 0.45, extraB);
    U.uArm.value[3].copy(sb); U.uArm.value[4].copy(E_); U.uArm.value[5].copy(Wr_);
    // koppen och fatet hoppar när han slår i disken
    K.fat.position.y = KOPP[1] + 0.5 + HOPP.fat;
    if (!kaffe) {
      const h = Math.max(HOPP.kopp, HOPP.fat);
      kopp.position.set(KOPP[0], KOPP[1] + 11 + h, KOPP[2]);
      kopp.rotation.set(0, -0.5, h * 0.0045);
    }
    // skuggorna: hand och underarm för båda armarna, och koppen
    const skk = (i, p, q, rd, h) => { kapA[i].set(p.x, p.z, q.x, q.z); kapH[i].set(rd, Math.max(0, h)); };
    const ah = (o) => o.y - BORD.Y;
    const LA_ = A.lage;
    const LB_ = B.lage;
    FA.copy(LA_.W).addScaledVector(LA_.F, 170);
    skk(0, LA_.W, FA, 50, ah(LA_.W) - 24);
    skk(1, LA_.E, LA_.W, 70, (ah(LA_.E) + ah(LA_.W)) / 2 - 20);
    FA.copy(LB_.W).addScaledVector(LB_.F, 170);
    skk(2, LB_.W, FA, 50, ah(LB_.W) - 24);
    skk(3, LB_.E, LB_.W, 70, (ah(LB_.E) + ah(LB_.W)) / 2 - 20);
    skk(4, kopp.position, kopp.position, 60, ah(kopp.position));
    skk(5, K.fat.position, K.fat.position, 96, 1 + HOPP.fat);
    skk(7, ASKV3, ASKV3, 92, 1 + HOPP.ask);
    skk(8, cX, fot, 14, Math.min(ah(cX), ah(fot)));
    roken(n, t, glod, kl);
    r.render(S, C);
  }

  // Det som hörs mellan T0 och T1 (rum-hasse.js): slagen i disken, koppen som landar på fatet efter
  // dem, och när han ställer ned koppen. [{ typ: 'dunk' | 'klirr', styrka, sort }]
  function handelser(T0, T1) {
    const ut = [];
    const i = (t) => t > T0 && t <= T1;
    for (const [td, s, sort] of DUNK) {
      if (i(td)) ut.push({ typ: 'dunk', styrka: s, sort });
      for (const [dl, h] of landar(s)) if (i(td + dl)) ut.push({ typ: 'klirr', styrka: h });
    }
    for (const [tn, s] of NED) if (i(tn)) ut.push({ typ: 'klirr', styrka: s, mjuk: true });
    return ut;
  }

  // Kameran: v är fönstret (W, H), var ögonhöjden står i det (cx, ey), s bildpunkter på en enhet på
  // avståndet 0, och dukens ruta (x, y, w, h), allt i fönstrets bildpunkter.
  function kamera(v) {
    Object.assign(duk.style, { left: `${v.x}px`, top: `${v.y}px`, width: `${v.w}px`, height: `${v.h}px` });
    r.setSize(v.w, v.h, false);
    C.fov = (2 * Math.atan(v.H / 2 / (v.s * D))) / DEG;
    C.aspect = v.W / v.H;
    C.setViewOffset(v.W, v.H, v.W / 2 - v.cx + v.x, v.H / 2 - v.ey + v.y, v.w, v.h);
    rita(sistaT, sistaN);
  }
  return {
    rita,
    kamera,
    diskBild,
    handelser,
    // fingrarna trummar en stund (bara i vilan); ror() medan de gör det
    trumma() { if (sistaN - trumT > 1.2) trumT = sistaN + 0.05; },
    ror: () => sistaN - trumT < 0.9,
    info: () => ({ trianglar: r.info.render.triangles, ritanrop: r.info.render.calls, texturer: r.info.memory.textures }),
    ctx: r.getContext(),
    borta() {
      G.dispose();
      skuggGeo.dispose();
      K.borta();
      ask.borta();
      cig.borta();
      rok.borta();
      A.borta();
      B.borta();
      r.dispose();
      r.forceContextLoss();
    },
  };
}
