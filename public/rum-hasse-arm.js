// Hasse Backes armar och händer (rum-hasse-3d.js). Ärmarna är kavajen ur fotot: fotots
// arm, uträtad till en remsa i atlasen, ligger på ett böjbart rör vars mått är fotots, så
// att tyg, veck och färg är desamma som på kroppen. Händerna är en modell med 16 ben
// (scripts/hasse/hand.mjs, rum/hasse-hand.bin) med huden ur fotot, naglar och leder.
// Allt ljus är samma ljus som på kroppen (LJUS). Ingen skuggkarta (PowerVR i telefonen).
// Disken framför honom döljer det som är under den (BORD_GLSL, uniformen bord).
//
// laddaFoto() → THREE.Texture, laddaHand() → modellen (båda hämtas en gång)
// byggHand(modell, sida, foto, bord) → { mesh, satt(W, F, P, krok, peka) }
// byggArm(scen, sida, foto, modell, vidd, bord) → { satt(S, E, W, F, P, krok, peka), del('allt' | 'under'), visible, hand }
// byggKopp(bord) → { kopp, fat, ORA }
// byggCigarr(bord) → { mesh, U, FOT }, byggAskkopp(bord) → { mesh }, byggRok(N, bord) → { mesh, slapp, steg }
import * as THREE from 'three';
import { SCEN } from './rum-hasse-scen.js';

// atlasen (bildpunkter): kroppen 860 × 1350, sedan ärmens remsa, huden bredvid
export const ATLAS = { W: 1372, H: 1350, X0: 280, Y0: 130, TW: 860, TH: 1350, rx: 860, rw: 256, rh: 1024, hx: 1116, hy: 0, hw: 256, hh: 512 };

// Samma ljus på allt: varmt framifrån till vänster (NYCKEL), ett varmt kantljus bakifrån från barens
// lampor, och i baren (uButik) neonskyltens röda sken och gatans kalla ljus från affären till höger.
// Där lyser också lysröret i affärens tak (uLys, tänt från sex till midnatt) och dagsljuset genom
// affärens stora fönster (uDag): ett brett, mjukt ljus från höger och lite framifrån, i himlens färg och
// så starkt som det är ljust ute. När det är dag tar fönstret över: lamporna, neonen och gatan syns mindre.
// Riktningarna är i figurens värld, med kameran snett från hans vänstra sida (VY, rum-hasse-scen.js).
// fotoLjus() är ljuset som fotot redan har, så att en vriden yta får rätt skillnad.
export const LJUS = `
uniform float uButik;
uniform vec4 uDag;
uniform vec4 uLys;
const vec3 NYCKEL = vec3(-.449, .549, .699);
const vec3 NEON = vec3(.702, .12, .702);
const vec3 GATA = vec3(.54, .19, .82);
const vec3 ROR = vec3(.72, .42, .55);
const vec3 FONSTER = vec3(.62, .2, .76);
const vec3 VY = vec3(.208, .044, .977);
vec3 ljus(vec3 n) {
  float k = max(0., dot(n, NYCKEL) * .86 + .14);
  vec3 a = mix(vec3(.28, .225, .19), vec3(.43, .395, .36), .5 + .5 * n.y);
  vec3 l = a + vec3(.77, .715, .635) * k;
  // (mot en utjämnad yta och svept runt den, så att skenet sprids över kinden i stället för att sluta
  // tvärt vid näsryggen)
  vec3 ns = normalize(n + .6 * VY);
  float r = clamp(dot(ns, NEON) * .6 + .4, 0., 1.);
  float g = clamp(dot(ns, GATA) * .5 + .5, 0., 1.);
  // lysröret: ett brett sken från affären och lite mer ljus överallt
  float d = clamp(dot(ns, ROR) * .55 + .45, 0., 1.);
  // fönstret: stort, så ljuset sveper långt runt (mjuka skuggor), och himlen ger lite ljus överallt
  float f = clamp(dot(ns, FONSTER) * .6 + .4, 0., 1.);
  float dag = uDag.w;
  float lys = uLys.w;
  vec3 b = l * vec3(.95, .93, .92) * (1. + .16 * lys) * (1. - .5 * dag)
    + vec3(.27, .027, .022) * r * r * r * (1. - .55 * lys) * (1. - .7 * dag)
    + vec3(.06, .085, .14) * g * g * (1. - lys) * (1. - dag)
    + uLys.rgb * (.1 + .62 * d * d) * (1. - .5 * dag)
    + uDag.rgb * (.08 + .95 * f * f);
  return mix(l, b, uButik);
}
float fotoLjus(vec3 n) { return max(.3, .42 + .58 * dot(n, vec3(-.249, .549, .798))); }
vec3 kant(vec3 n, float styrka) {
  vec3 bak = mix(vec3(.62, .62, -.48), vec3(-.55, .62, -.56), uButik);
  float f = 1. - clamp(dot(n, mix(vec3(0., 0., 1.), VY, uButik)), 0., 1.);
  return vec3(1., .74, .50) * styrka * f * f * f * max(0., dot(n, bak) + .25)
    + vec3(1., .12, .08) * styrka * uButik * f * f * max(0., dot(n, NEON)) * .8;
}
vec3 ton(vec3 c) { return c * (1.03 - .15 * c); }
`;

// Disken (rum-hasse-3d.js, rum-hasse-scen.js): dess bakre plan n·(x, z) = c (uBord.xy och z) och
// ovansidan på höjden uBord.w. Framför planet döljer disken det som är under ovansidan, bakom det
// det som skyms av disken från kameran (strålen dit går under ovansidan där den passerar planet).
export const BORD_GLSL = `
uniform vec4 uBord;
bool underBord(vec3 w) {
  float bw = dot(uBord.xy, w.xz) - uBord.z;
  if (bw >= 0.) return w.y < uBord.w;
  float bc = dot(uBord.xy, cameraPosition.xz) - uBord.z;
  return mix(cameraPosition.y, w.y, bc / (bc - bw)) < uBord.w;
}
`;
// (utan disk döljs ingenting, och det är rummets ljus utan baren)
const BUTIK_AV = { value: 0 };
// Fönstret och lysröret i affären (uDag och uLys i LJUS): ljusets färg gånger styrka, och hur mycket dag
// det är (0–1) respektive om röret är tänt. Sidan sätter dem efter klockan och vädret, som i rummet
// (ljuset i rum-hasse.js).
export const DAG = { value: new THREE.Vector4(0, 0, 0, 0) };
export const LYS = { value: new THREE.Vector4(0, 0, 0, 0) };
export const ingenBord = () => ({ value: new THREE.Vector4(0, 1, -1e9, -1e9) });

// figurens kamera (rum-hasse-3d.js): ögat på höjden CY, CZ framför fotots plan
export const KAMERA = { CY: SCEN.CY, CZ: SCEN.D };

let fotoP = null;
export function laddaFoto() {
  if (!fotoP) {
    fotoP = (async () => {
      const bild = new Image();
      bild.src = 'rum/hasse-atlas.webp';
      await bild.decode();
      const t = new THREE.Texture(bild);
      t.premultiplyAlpha = true;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
      return t;
    })();
  }
  return fotoP;
}

let handP = null;
export function laddaHand() {
  if (!handP) {
    handP = (async () => {
      const buf = await (await fetch('rum/hasse-hand.bin')).arrayBuffer();
      const hl = new DataView(buf).getUint32(0, true);
      const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
      const o = 4 + hl;
      const nv = head.nv;
      const d = new DataView(buf, o);
      const pos = new Float32Array(nv * 3);
      const aN = new Int8Array(nv * 4);
      const aBen = new Uint8Array(nv * 4);
      const aPalm = new Uint8Array(nv);
      const aNagel = new Int8Array(nv * 2);
      const aRygg = new Uint8Array(nv);
      for (let i = 0, q = 0; i < nv; i++, q += 18) {
        for (let k = 0; k < 3; k++) pos[i * 3 + k] = d.getInt16(q + k * 2, true) / 8;
        for (let k = 0; k < 3; k++) aN[i * 4 + k] = d.getInt8(q + 6 + k);
        aN[i * 4 + 3] = d.getUint8(q + 9) / 2;
        for (let k = 0; k < 4; k++) aBen[i * 4 + k] = d.getUint8(q + 10 + k);
        aPalm[i] = d.getUint8(q + 14);
        aNagel[i * 2] = d.getInt8(q + 15);
        aNagel[i * 2 + 1] = d.getInt8(q + 16);
        aRygg[i] = d.getUint8(q + 17);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aN', new THREE.BufferAttribute(aN, 4, true));
      g.setAttribute('aBen', new THREE.BufferAttribute(aBen, 4, false));
      g.setAttribute('aPalm', new THREE.BufferAttribute(aPalm, 1, true));
      g.setAttribute('aNagel', new THREE.BufferAttribute(aNagel, 2, false));
      g.setAttribute('aRygg', new THREE.BufferAttribute(aRygg, 1, true));
      g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, o + nv * 18, head.ni), 1));
      return { g, ben: head.ben };
    })();
  }
  return handP;
}

// ---------- handen ----------
const HUD_V = `
attribute vec4 aN, aBen; attribute float aPalm, aRygg; attribute vec2 aNagel;
uniform mat4 uB[16];
varying vec3 vN, vP; varying vec2 vUv, vNagel; varying float vAo, vTon, vPalm, vRygg;
void main() {
  vec3 p0 = position;
  float w = aBen.z / 255.;
  mat4 M = uB[int(aBen.x)] * w + uB[int(aBen.y)] * (1. - w);
  vec4 w4 = modelMatrix * M * vec4(p0, 1.);
  vN = normalize(mat3(modelMatrix) * mat3(M) * aN.xyz);
  vP = w4.xyz; vAo = aN.w; vTon = aBen.w / 255.; vPalm = aPalm; vNagel = aNagel / 100.; vRygg = aRygg;
  vUv = vec2(.5 + p0.x / 290., clamp((p0.y + 34.) / 340., 0., 1.));
  gl_Position = projectionMatrix * viewMatrix * w4;
}`;
const HUD_F = `precision highp float;
uniform sampler2D foto; uniform vec4 uHud;
varying vec3 vN, vP; varying vec2 vUv, vNagel; varying float vAo, vTon, vPalm, vRygg;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  // huden: fotots handrygg överst i atlasen, handflatan under
  vec2 q = clamp(vUv, .004, .996);
  vec3 c = mix(texture2D(foto, uHud.xy + vec2(q.x, q.y * .5 + .5) * uHud.zw).rgb, texture2D(foto, uHud.xy + vec2(q.x, q.y * .5) * uHud.zw).rgb, vPalm);
  // (lite mattare än fotots hud: ljuset ovanifrån gör den annars orange bredvid ansiktet)
  c = mix(c, vec3(dot(c, vec3(.3, .55, .15))), .12);
  c = mix(c, c * vec3(1.1, .9, .84), vTon * .7);
  float ao = vAo * vAo * .7 + .3;
  // nageln: rosa nagelbädd, ljus halvmåne vid roten och ljus kant längst ut
  float rd = length(max(abs(vNagel) - vec2(.6, .58), 0.)) - .36;
  float rygg = smoothstep(.45, .7, vRygg);
  float nagel = (1. - smoothstep(-.04, .05, rd)) * rygg;
  vec3 nc = c * vec3(1.12, 1.03, 1.02) + .035;
  nc = mix(nc, vec3(.86, .74, .68), .55 * (1. - smoothstep(-.92, -.55, vNagel.y)));
  nc = mix(nc, vec3(.92, .86, .78), smoothstep(.72, .92, vNagel.y));
  c = mix(c, nc, nagel * .9);
  c *= 1. - .2 * rygg * exp(-rd * rd * 240.);
  vec3 l = ljus(n);
  // ljuset som går igenom huden: varmare där ljuset tar slut
  float ter = max(0., dot(n, NYCKEL) + .3);
  l += vec3(.16, .035, .015) * ter * (1. - ter) * 2.2;
  vec3 ut = c * l * mix(.72, 1., ao) * ao;
  vec3 h = normalize(NYCKEL + normalize(cameraPosition - vP));
  float sp = pow(max(0., dot(n, h)), mix(22., 60., nagel));
  ut += vec3(1., .93, .84) * sp * mix(.07, .2, nagel) * ao;
  ut += kant(n, .28) * ao;
  gl_FragColor = vec4(ton(ut), 1.);
}`;
const ax = new THREE.Vector3(1, 0, 0);
const az = new THREE.Vector3(0, 0, 1);
const TAX = new THREE.Vector3(0.49, -0.63, 0.6).normalize();
const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();
const v1 = new THREE.Vector3();
const skala = new THREE.Vector3(1, 1, 1);

export function byggHand(modell, sida, foto, bord = ingenBord()) {
  const ben = modell.ben;
  const inv = ben.map((b) => new THREE.Matrix4().makeTranslation(-b.pos[0], -b.pos[1], -b.pos[2]));
  const lok = ben.map(() => new THREE.Matrix4());
  const var_ = ben.map(() => new THREE.Matrix4());
  const ut = ben.map(() => new THREE.Matrix4());
  const a = ATLAS;
  const U = {
    foto: { value: foto },
    uB: { value: ut },
    uHud: { value: new THREE.Vector4((a.hx + 0.5) / a.W, 1 - (a.hy + a.hh - 0.5) / a.H, (a.hw - 1) / a.W, (a.hh - 1) / a.H) },
    uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS,
  };
  const mesh = new THREE.Mesh(modell.g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: HUD_V, fragmentShader: HUD_F, transparent: true, depthWrite: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  // Fingrarnas två yttre leder: de punkter i modellen som ska ligga ovanpå disken (golv nedan).
  const FL = [0, 1, 2, 3].map((fi) => {
    const P = modell.g.attributes.position.array;
    const B = modell.g.attributes.aBen.array;
    const mitt = fi * 3 + 2;
    const yttre = fi * 3 + 3;
    const ix = [];
    for (let i = 0; i < P.length / 3; i++) if ((B[i * 4] === mitt || B[i * 4] === yttre) && B[i * 4 + 2] > 128) ix.push(i);
    return ix.filter((_, k) => k % 2 === 0);
  });
  // lyft: hur mycket rakare var finger ligger för att inte gå ned i disken (golv)
  const lyft = [0, 0, 0, 0];
  // krok: 0 raka, 1 knuten. peka: pekfingret rakt. spar: fingrarna isär (0–1). tumme: 0 mot handen, 1 ut.
  // extra: mer böjning per finger (pek-, lång-, ring- och lillfingret), sedan hur mycket mer var och
  // ett spretar ut (grader), och sist hur rak tummen är fast handen är knuten (0–1, tummen upp).
  // bara: räkna bara om det fingret (golv nedan).
  function bojFingrar(krok, peka = 0, spar = 0, tumme = 0.4, extra = null, bara = -1) {
    const g = (i) => (extra ? extra[i] || 0 : 0);
    const kt = krok * (1 - g(8));
    const K = [0.0, 0.05, 0.09, 0.16];
    const FAN = [8, 1.5, -5.5, -14];
    for (let i = bara < 0 ? 1 : bara * 3 + 1; i < (bara < 0 ? ben.length : bara * 3 + 4); i++) {
      const b = ben[i];
      const fi = Math.floor((i - 1) / 3);
      const led = (i - 1) % 3;
      q1.identity();
      if (fi < 4) {
        // (lyft får göra fingret helt rakt, och lite till i knogen, men inte bakåtböjt)
        const kr0 = Math.max(0, (fi === 0 ? krok * (1 - peka) : krok) + K[fi] * (1 - krok) + g(fi));
        const kr = Math.max(-0.07, kr0 - lyft[fi]);
        const vink = led === 0 ? kr * 1.42 + 0.1 : led === 1 ? kr * 1.62 + 0.16 : kr * 1.05 + 0.1;
        if (led === 0) { q2.setFromAxisAngle(az, ((FAN[fi] * (1 - spar) + g(fi + 4)) / 180) * Math.PI * 0.94); q1.multiply(q2); }
        q2.setFromAxisAngle(ax, vink);
        q1.multiply(q2);
      } else {
        // tummen: lägger sig över handflatan när handen knyts
        if (led === 0) { q2.setFromAxisAngle(az, 0.12 - tumme * 0.42 + kt * 0.22); q1.multiply(q2); }
        q2.setFromAxisAngle(TAX, led === 0 ? kt * 0.42 + 0.06 : kt * 0.8 + 0.12);
        q1.multiply(q2);
      }
      v1.set(b.pos[0] - (b.far >= 0 ? ben[b.far].pos[0] : 0), b.pos[1] - (b.far >= 0 ? ben[b.far].pos[1] : 0), b.pos[2] - (b.far >= 0 ? ben[b.far].pos[2] : 0));
      lok[i].compose(v1, q1, skala);
      var_[i].multiplyMatrices(var_[b.far], lok[i]);
      ut[i].multiplyMatrices(var_[i], inv[i]);
    }
    var_[0].identity();
    ut[0].identity();
  }
  bojFingrar(0.1);
  // Golvet: fingrarna lägger sig på disken i stället för att gå ned i den. Ett finger vars två yttre leder
  // når under diskens ovansida (där disken är, framför dess bakre kant) böjs mindre, så att den lägsta
  // punkten ligger på ytan. Utan disk (handen på pulten i rummet) gör det ingenting.
  const MP = modell.g.attributes.position.array;
  const MB = modell.g.attributes.aBen.array;
  const pv = new THREE.Vector3();
  const mm = new THREE.Matrix4();
  function lagst(fi) {
    const Y = bord.value.w;
    let min = Infinity;
    for (const i of FL[fi]) {
      const w = MB[i * 4 + 2] / 255;
      const a = ut[MB[i * 4]].elements;
      const b = ut[MB[i * 4 + 1]].elements;
      const e = mm.elements;
      for (let k = 0; k < 16; k++) e[k] = a[k] * w + b[k] * (1 - w);
      pv.set(MP[i * 3], MP[i * 3 + 1], MP[i * 3 + 2]).applyMatrix4(mm).applyMatrix4(mesh.matrix);
      if (bord.value.x * pv.x + bord.value.y * pv.z < bord.value.z) continue;
      min = Math.min(min, pv.y - Y);
    }
    return min;
  }
  const GOLV = 1.2;
  function golv(krok, peka, spar, tumme, extra) {
    if (bord.value.w < -1e8) return;
    for (let fi = 0; fi < 4; fi++) {
      lyft[fi] = 0;
      if (lagst(fi) >= GOLV) continue;
      let lo = 0;
      let hi = 1.6;
      lyft[fi] = hi;
      bojFingrar(krok, peka, spar, tumme, extra, fi);
      if (lagst(fi) < GOLV) continue;
      for (let k = 0; k < 7; k++) {
        lyft[fi] = (lo + hi) / 2;
        bojFingrar(krok, peka, spar, tumme, extra, fi);
        if (lagst(fi) < GOLV) lo = lyft[fi]; else hi = lyft[fi];
      }
      lyft[fi] = hi;
      bojFingrar(krok, peka, spar, tumme, extra, fi);
    }
  }
  const fy = new THREE.Vector3();
  const fz = new THREE.Vector3();
  const fx = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const sp = new THREE.Vector3(sida, 1, 1);
  const SK = 0.92;
  // W: handleden, F: mot fingertopparna, P: ut ur handflatan, i världen
  function satt(W, F, P, krok, peka, spar, tumme, extra) {
    fy.copy(F).normalize();
    fz.copy(P).addScaledVector(fy, -P.dot(fy)).normalize();
    // modellen har tummen åt +x: sida = −1 speglas
    fx.crossVectors(fy, fz);
    m.makeBasis(fx, fy, fz);
    m.scale(sp.set(SK * sida, SK, SK));
    m.setPosition(W.x, W.y, W.z);
    mesh.matrix.copy(m);
    mesh.matrixWorldNeedsUpdate = true;
    lyft.fill(0);
    bojFingrar(krok, peka, spar, tumme, extra);
    golv(krok, peka, spar, tumme, extra);
  }
  return { mesh, satt, U };
}

// ---------- armen ----------
export const ARM = { LA: 466, LB: 431, TOPP: 88 };
const RINGAR = 44;
const SEG = 22;
// fotots halva bredd längs armen (s = 0 överst på ärmhuvudet)
const BREDD = [[0, 56], [0.03, 66], [0.0625, 78], [0.125, 92], [0.1875, 105], [0.25, 113], [0.3125, 118], [0.375, 119], [0.4375, 118], [0.5, 115], [0.5625, 109], [0.625, 102], [0.6875, 95], [0.75, 91], [0.8125, 88], [0.875, 84], [0.9375, 77], [1, 68]];
function radie(s) {
  for (let i = 1; i < BREDD.length; i++) if (s <= BREDD[i][0]) return BREDD[i - 1][1] + ((BREDD[i][1] - BREDD[i - 1][1]) * (s - BREDD[i - 1][0])) / (BREDD[i][0] - BREDD[i - 1][0]);
  return 68;
}
const ARM_V = `
attribute vec3 aN0; attribute float aS, aI;
varying vec2 vUv; varying vec3 vN, vN0, vW; varying float vS, vI;
void main() { vUv = uv; vN = normal; vN0 = aN0; vS = aS; vI = aI; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const ARM_F = `precision highp float;
uniform sampler2D foto;
varying vec2 vUv; varying vec3 vN, vN0, vW; varying float vS, vI;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vW)) discard;
  vec3 n = normalize(vN);
  vec4 c = texture2D(foto, vUv);
  // remsan är utjämnad: skuggorna kommer från ljuset, vecken från fotot (mjukare, för armen ligger inte som i fotot)
  c.rgb = .135 + (c.rgb - .135) * .62;
  vec3 ut = c.rgb * ljus(n) * 1.14;
  float gr = 1. - clamp(dot(n, normalize(cameraPosition - vW)), 0., 1.);
  ut += vec3(.075, .07, .066) * gr * gr * (.4 + .6 * clamp(dot(n, NYCKEL) + .5, 0., 1.));
  ut += kant(n, .1);
  // ärmhuvudet och insidan av överarmen tonar in i kavajen på fotot
  float a = smoothstep(.0, .07, vS) * (1. - smoothstep(.62, 1., -vI) * (1. - smoothstep(.07, .2, vS)));
  ut *= 1. - .7 * smoothstep(.985, 1., vS);
  gl_FragColor = vec4(ton(ut) * a, a);
}`;
const SKJ_F = `precision highp float;
varying vec3 vN, vW; varying vec2 vUv;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vW)) discard;
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  // insidan av manschetten är mörk
  float inne = gl_FrontFacing ? 1. : .34;
  vec3 c = vec3(.98, .97, .95) * (ljus(n) * 1.06) * inne;
  c *= .7 + .3 * smoothstep(.05, .55, vUv.y);
  gl_FragColor = vec4(ton(c), 1.);
}`;
const SKJ_V = `varying vec3 vN, vW; varying vec2 vUv; void main() { vUv = uv; vN = mat3(modelMatrix) * normal; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const Y_AX = new THREE.Vector3(0, 1, 0);
export function byggArm(scen, sida, foto, modell, vidd = 1, bord = ingenBord()) {
  const n = RINGAR * (SEG + 1);
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(n * 3);
  const N = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const n0 = new Float32Array(n * 3);
  const sS = new Float32Array(n);
  const sI = new Float32Array(n);
  const ix = [];
  const A = ATLAS;
  // så låg armen i fotot: överarmen något utåt, underarmen inåt (för remsans ljus)
  const T1 = new THREE.Vector3(0.106, -0.994, 0).normalize();
  const T2 = new THREE.Vector3(-0.305, -0.952, 0).normalize();
  const Z = new THREE.Vector3(0, 0, 1);
  const b0 = new THREE.Vector3();
  const tt = new THREE.Vector3();
  for (let i = 0; i < RINGAR; i++) for (let j = 0; j <= SEG; j++) {
    const o = i * (SEG + 1) + j;
    const s = i / (RINGAR - 1);
    const th = (j / SEG) * 6.28318;
    // fram (θ = 0) och bak har samma bit av remsan; tvärs över armen som i en projektion
    const sTri = Math.asin(Math.sin(th)) / 1.5708;
    const t = -(Math.sin(th) * 0.35 + sTri * 0.65) * sida * 0.9;
    uv[o * 2] = (A.rx + 0.5 + ((t + 1) / 2) * (A.rw - 1)) / A.W;
    uv[o * 2 + 1] = 1 - (0.5 + s * (A.rh - 1)) / A.H;
    tt.copy(T1).lerp(T2, Math.min(1, Math.max(0, (s - 0.5) / 0.14))).normalize();
    b0.crossVectors(tt, Z);
    const sn = Math.sin(th) * sida;
    const cs = Math.abs(Math.cos(th));
    n0[o * 3] = Z.x * cs + b0.x * sn;
    n0[o * 3 + 1] = Z.y * cs + b0.y * sn;
    n0[o * 3 + 2] = Z.z * cs + b0.z * sn;
    sS[o] = s;
    sI[o] = Math.sin(th) * sida;
    if (i < RINGAR - 1 && j < SEG) ix.push(o, o + 1, o + SEG + 1, o + 1, o + SEG + 2, o + SEG + 1);
  }
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aN0', new THREE.BufferAttribute(n0, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(sS, 1));
  g.setAttribute('aI', new THREE.BufferAttribute(sI, 1));
  g.setIndex(ix);
  const rorM = new THREE.ShaderMaterial({ uniforms: { foto: { value: foto }, uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS }, vertexShader: ARM_V, fragmentShader: ARM_F, transparent: true, depthWrite: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const ror = new THREE.Mesh(g, rorM);
  ror.frustumCulled = false;
  // skjortans manschett: ett rör med en tjock kant
  const prof = [new THREE.Vector2(51, -40), new THREE.Vector2(53, 34), new THREE.Vector2(53, 46), new THREE.Vector2(50.5, 49.5), new THREE.Vector2(47.5, 46), new THREE.Vector2(47, -40)];
  const manG = new THREE.LatheGeometry(prof, 24);
  manG.scale(1, 1, 0.78);
  const man = new THREE.Mesh(manG, new THREE.ShaderMaterial({ uniforms: { uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS }, vertexShader: SKJ_V, fragmentShader: SKJ_F, transparent: true, side: THREE.DoubleSide }));
  man.frustumCulled = false;
  const hand = byggHand(modell, sida, foto, bord);
  ror.renderOrder = man.renderOrder = hand.mesh.renderOrder = 5;
  const grupp = new THREE.Group();
  grupp.add(ror, man, hand.mesh);
  scen.add(grupp);
  // 'allt', eller 'under' (armbågen, manschetten och handen)
  let delen = 'allt';
  let armbage = 22;
  const ritaDel = () => {
    const per = SEG * 6;
    const tot = (RINGAR - 1) * per;
    if (delen === 'allt') g.setDrawRange(0, tot);
    else { const b = Math.max(armbage - 1, 0) * per; g.setDrawRange(b, tot - b); }
  };

  const u1 = new THREE.Vector3();
  const u2 = new THREE.Vector3();
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const T_ = new THREE.Vector3();
  const N_ = new THREE.Vector3();
  const B_ = new THREE.Vector3();
  const topp = new THREE.Vector3();
  const lage = { S: new THREE.Vector3(), E: new THREE.Vector3(), W: new THREE.Vector3(), pol: new THREE.Vector3(), F: new THREE.Vector3(), P: new THREE.Vector3(), krok: 0, peka: 0 };
  function satt(S, E, W, F, Pn, krok, peka, spar = 0, tumme = 0.4, extra = null) {
    lage.S.copy(S); lage.E.copy(E); lage.W.copy(W); lage.F.copy(F); lage.P.copy(Pn); lage.krok = krok; lage.peka = peka;
    u1.subVectors(E, S);
    const L1 = u1.length();
    u1.normalize();
    u2.subVectors(W, E);
    const L2 = u2.length();
    u2.normalize();
    topp.copy(S).addScaledVector(u1, -ARM.TOPP);
    const L0 = L1 + ARM.TOPP;
    const rr = Math.min(105, L1 * 0.34, L2 * 0.34);
    const bojd = Math.acos(Math.min(1, Math.max(-1, u1.dot(u2))));
    pA.copy(E).addScaledVector(u1, -rr);
    pB.copy(E).addScaledVector(u2, rr);
    const b = 2 * rr * Math.cos(bojd / 2) * (1 + 0.1 * bojd);
    const tot = (L0 - rr) + b + (L2 - rr);
    const dE = (L0 - rr) + b / 2;
    armbage = Math.round((dE / tot) * (RINGAR - 1));
    if (delen !== 'allt') ritaDel();
    lage.pol.copy(u1).sub(u2);
    if (lage.pol.lengthSq() > 1e-6) lage.pol.normalize();
    // kavajen hänger löst bara när armen hänger: uppe är ärmen smalare
    const hang = Math.min(1, Math.max(0, (-u1.y - 0.25) / 0.6));
    const smal = 0.82 + 0.18 * hang * hang * (3 - 2 * hang);
    N_.set(0, 0, 1);
    const Pa = g.attributes.position.array;
    const Na = g.attributes.normal.array;
    let o = 0;
    for (let i = 0; i < RINGAR; i++) {
      const s0 = i / (RINGAR - 1);
      const dist = s0 * tot;
      const s = dist < dE ? (0.5 * dist) / dE : 0.5 + (0.5 * (dist - dE)) / (tot - dE);
      if (dist < L0 - rr) { pC.copy(topp).addScaledVector(u1, dist); T_.copy(u1); } else if (dist < L0 - rr + b) {
        const f = (dist - (L0 - rr)) / b;
        const f1 = 1 - f;
        pC.set(0, 0, 0).addScaledVector(pA, f1 * f1).addScaledVector(E, 2 * f1 * f).addScaledVector(pB, f * f);
        T_.copy(u1).multiplyScalar(f1).addScaledVector(u2, f).normalize();
      } else { pC.copy(pB).addScaledVector(u2, dist - (L0 - rr) - b); T_.copy(u2); }
      N_.addScaledVector(T_, -N_.dot(T_));
      if (N_.lengthSq() < 1e-4) N_.set(1, 0, 0).addScaledVector(T_, -T_.x);
      N_.normalize();
      B_.crossVectors(T_, N_);
      const r0 = radie(s) * (i === RINGAR - 1 ? 0.7 : 1) * (1 + (vidd - 1) * (1 - s)) * (1 + (smal - 1) * Math.max(0, 1 - s / 0.62));
      if (i === RINGAR - 1) pC.addScaledVector(T_, -3);
      const platt = 0.8 + 0.11 * Math.min(1, Math.max(0, (s - 0.78) / 0.18));
      // vecken vid armbågen och lite liv i tyget
      const ve = Math.exp(-(((dist - dE) / 120) ** 2));
      for (let j = 0; j <= SEG; j++) {
        const th = ((j % SEG) / SEG) * 6.28318;
        const si = Math.sin(th);
        const cs = Math.cos(th);
        const rd = r0 * (1 + 0.075 * bojd * ve * Math.sin(dist * 0.055 + th * 2 + sida) * (0.5 + 0.5 * si) + 0.012 * Math.sin(dist * 0.021 + th * 3));
        const c = cs * rd * platt;
        const d = si * rd;
        Pa[o * 3] = pC.x + N_.x * c + B_.x * d;
        Pa[o * 3 + 1] = pC.y + N_.y * c + B_.y * d;
        Pa[o * 3 + 2] = pC.z + N_.z * c + B_.z * d;
        Na[o * 3] = N_.x * cs + B_.x * si;
        Na[o * 3 + 1] = N_.y * cs + B_.y * si;
        Na[o * 3 + 2] = N_.z * cs + B_.z * si;
        o++;
      }
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    // manschetten följer handleden
    man.position.copy(W).addScaledVector(u2, 4);
    man.quaternion.setFromUnitVectors(Y_AX, u2);
    hand.satt(pC.copy(W).addScaledVector(u2, 26), F, Pn, krok, peka, spar, tumme, extra);
  }
  return { grupp, satt, lage, hand, man, del(d) { delen = d; ritaDel(); }, set visible(v) { grupp.visible = v; }, get visible() { return grupp.visible; }, borta() { g.dispose(); manG.dispose(); } };
}

// ---------- koppen ----------
const KER_V = `varying vec3 vN, vP; varying vec2 vL;
void main() { vL = vec2(length(position.xz), position.y); vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const KER_F = `precision highp float;
uniform float uRand, uKaffe; uniform vec2 uBand[3];
varying vec3 vN, vP; varying vec2 vL;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  vec3 c = vec3(.93, .895, .81);
  // blå ränder som koppen på pulten
  float y = uRand > .5 ? vL.x : vL.y;
  for (int i = 0; i < 3; i++) { float m = smoothstep(uBand[i].x - .8, uBand[i].x + .8, y) * (1. - smoothstep(uBand[i].y - .8, uBand[i].y + .8, y)); c = mix(c, vec3(.22, .34, .6), m); }
  if (uKaffe > .5) c = vec3(.11, .055, .03);
  vec3 ut = c * ljus(n) * .9;
  // nära bordet blir det mörkare, och det är en blank yta
  ut *= uRand > .5 ? 1. : .62 + .38 * smoothstep(0., 34., vL.y);
  // (mot kameran, som står snett och lite högre i baren)
  vec3 e = normalize(cameraPosition - vP);
  vec3 r = reflect(-e, n);
  vec3 om = mix(vec3(.05, .03, .02), vec3(.62, .43, .25), smoothstep(-.1, .7, r.y));
  om += vec3(1.3, 1.15, .95) * smoothstep(.93, .985, dot(r, NYCKEL));
  float f = .05 + .95 * pow(1. - clamp(dot(n, e), 0., 1.), 5.);
  ut = mix(ut, om, f * (uKaffe > .5 ? .7 : .85));
  ut += vec3(1., .94, .85) * pow(max(0., dot(n, normalize(NYCKEL + e))), 90.) * .55;
  gl_FragColor = vec4(ton(ut), 1.);
}`;
function kerM(rand, kaffe, band, bord) {
  return new THREE.ShaderMaterial({
    uniforms: { uRand: { value: rand }, uKaffe: { value: kaffe }, uBand: { value: band.map((b) => new THREE.Vector2(b[0], b[1])) }, uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS },
    vertexShader: KER_V, fragmentShader: KER_F, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}
const V2 = (a) => a.map(([x, y]) => new THREE.Vector2(x, y));
// koppen (botten i origo, y uppåt, örat åt +x) och fatet
export function byggKopp(bord = ingenBord()) {
  const kropp = new THREE.LatheGeometry(V2([[0, 0], [38, 0], [42, 3], [46, 16], [60, 98], [63, 111], [62, 114], [59, 113], [56, 100], [44, 24], [0, 14]]), 32);
  const yta = new THREE.CircleGeometry(57, 32);
  yta.rotateX(-Math.PI / 2);
  yta.translate(0, 96, 0);
  // örat
  class Ora extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const a = -1.75 + t * 3.5; return o.set(58 + Math.cos(a) * 25 - 2 * t * (1 - t), 62 + Math.sin(a) * 28, 0); } }
  const ora = new THREE.TubeGeometry(new Ora(), 18, 6.4, 8, false);
  ora.scale(1, 1, 1.25);
  const fat = new THREE.LatheGeometry(V2([[0, 0], [62, 0], [66, 3], [74, 9], [114, 23], [118, 26], [116, 28], [74, 15], [64, 10], [0, 10]]), 36);
  const BAND = [[97, 104], [90, 92.5], [22, 25]];
  const BF = [[107, 111], [999, 999], [999, 999]];
  const kopp = new THREE.Group();
  const fatG = new THREE.Group();
  const del = (grp, geo, rand, kaffe, band) => { const m = new THREE.Mesh(geo, kerM(rand, kaffe, band, bord)); m.renderOrder = 6; m.frustumCulled = false; grp.add(m); return m; };
  del(kopp, kropp, 0, 0, BAND);
  del(kopp, ora, 0, 0, [[999, 999], [999, 999], [999, 999]]);
  del(kopp, yta, 0, 1, [[999, 999], [999, 999], [999, 999]]);
  del(fatG, fat, 1, 0, BF);
  return {
    kopp, fat: fatG,
    // örat i koppens egna mått
    ORA: new THREE.Vector3(84, 62, 0),
    borta() { kropp.dispose(); yta.dispose(); ora.dispose(); fat.dispose(); },
  };
}

// ---------- cigarren ----------
// Munänden (huvudet) i origo, +y mot den tända änden (foten). Ringen nära huvudet, askan vid foten.
export const CIGARR = { L: 196, R: 12.6, ASKA: 22, RING: [17, 35] };
const BRUS_GLSL = `
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float brus(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + 1.), f.x), f.y); }
`;
const CIG_V = `varying vec3 vN, vP, vL;
void main() { vL = position; vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const CIG_F = `precision highp float;
uniform float uGlod, uTid;
varying vec3 vN, vP, vL;
${LJUS}
${BORD_GLSL}
${BRUS_GLSL}
const float L = ${CIGARR.L}., G0 = ${CIGARR.L - CIGARR.ASKA}.;
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  float y = vL.y;
  float a = atan(vL.z, vL.x);
  // runt om i bildpunkter (skarven vid a = ±π syns inte i bruset)
  vec2 q = vec2(a * ${CIGARR.R}, y);
  // täckbladet: brunt och flammigt, med ådror snett över och skarven i en spiral
  float b = brus(q * vec2(.11, .035)) * .6 + brus(q * vec2(.33, .12)) * .4;
  vec3 c = mix(vec3(.2, .11, .055), vec3(.37, .22, .115), b);
  float sp = fract(a / 6.2832 + y / 64.);
  c *= 1. - .4 * exp(-pow((sp - .5) / .014, 2.));
  float adra = abs(fract((q.x * .7 + y) / 21. + brus(q * .04) * .7) - .5);
  c += vec3(.05, .032, .016) * exp(-adra * adra / .0012);
  // locket på huvudet
  c *= mix(.78, 1., smoothstep(3., 9., y));
  float glans = .22;
  // ringen: guld, med ett rött fält och en guldkant
  float ring = smoothstep(${CIGARR.RING[0]}. - .4, ${CIGARR.RING[0]}. + .4, y) * (1. - smoothstep(${CIGARR.RING[1]}. - .4, ${CIGARR.RING[1]}. + .4, y));
  if (ring > 0.) {
    float m = (y - ${CIGARR.RING[0]}.) / ${CIGARR.RING[1] - CIGARR.RING[0]}.;
    vec3 rc = vec3(.8, .58, .2) * (.85 + .3 * brus(q * .5));
    float rod = smoothstep(.2, .25, m) * (1. - smoothstep(.75, .8, m));
    rc = mix(rc, vec3(.52, .06, .05), rod);
    // en liten vit sköld fram
    rc = mix(rc, vec3(.92, .88, .78), rod * (1. - smoothstep(.45, .6, abs(a - 1.2))) * smoothstep(.3, .36, m) * (1. - smoothstep(.64, .7, m)));
    c = mix(c, rc, ring);
    glans = mix(glans, .9, ring);
  }
  // kolet och askan
  float kol = smoothstep(G0 - 7., G0 - 1., y);
  c = mix(c, vec3(.045, .032, .025), kol);
  float aska = smoothstep(G0 - .5, G0 + 1., y);
  float rand = abs(fract((y - G0) / 5.5 + brus(q * .15) * .5) - .5);
  vec3 ac = vec3(.52, .5, .47) * (.62 + .55 * brus(q * vec2(.25, .5))) * (.75 + .25 * smoothstep(.0, .2, rand));
  ac = mix(ac, vec3(.72, .7, .66), smoothstep(L - 2., L, y) * .6);
  c = mix(c, ac, aska);
  glans *= 1. - aska;
  vec3 ut = c * ljus(n);
  vec3 h = normalize(NYCKEL + normalize(cameraPosition - vP));
  ut += vec3(1., .92, .8) * pow(max(0., dot(n, h)), mix(18., 60., ring)) * glans;
  ut += kant(n, .2) * (1. - aska * .5);
  // glöden: en ring under askan, och fläckar i änden när han drar
  float f = brus(q * .45 + vec2(uTid * 2.3, 0.)) * .6 + brus(q * 1.3 - vec2(0., uTid * 3.1)) * .4;
  float glod = exp(-pow((y - G0 + .8) / 2.4, 2.)) * (.45 + .55 * f);
  glod += smoothstep(L - 1.5, L, y) * smoothstep(.55, .8, f) * uGlod * .8;
  glod += exp(-pow((y - G0 - 4.) / 4., 2.)) * smoothstep(.62, .85, f) * uGlod * .5;
  ut += vec3(1., .3, .05) * glod * (.22 + 1.5 * uGlod);
  gl_FragColor = vec4(ton(ut), 1.);
}`;
export function byggCigarr(bord = ingenBord()) {
  const { L, R, ASKA } = CIGARR;
  const prof = [[0, 0], [4.5, 0.5], [8, 1.9], [10.6, 4.2], [12, 7.2], [R, 11], [R, 40], [R, L - ASKA - 6], [R - 0.15, L - ASKA - 1], [R - 0.5, L - ASKA + 1], [R - 0.3, L - 12], [R - 0.8, L - 4], [R - 2.6, L - 1.1], [R - 6, L - 0.1], [0, L + 0.2]];
  const g = new THREE.LatheGeometry(V2(prof), 24);
  const U = { uGlod: { value: 0 }, uTid: { value: 0 }, uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: CIG_V, fragmentShader: CIG_F, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;
  return {
    mesh, U,
    // den tända änden i cigarrens egna mått
    FOT: new THREE.Vector3(0, L + 1, 0),
    borta() { g.dispose(); mesh.material.dispose(); },
  };
}

// ---------- askkoppen ----------
// Rund och tung, av samma glaserade gods som koppen, med två urtag för cigarren mitt emot
// varandra (urtaget pekar åt +x). Botten i origo, y uppåt.
export const ASKKOPP = { R: 92, H: 34, URTAG: 21, BREDD: 14.5, KANT: 88 };
const ASK_V = `varying vec3 vN, vP, vL;
void main() { vL = position; vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const ASK_F = `precision highp float;
varying vec3 vN, vP, vL;
${LJUS}
${BORD_GLSL}
${BRUS_GLSL}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  float r = length(vL.xz);
  float y = vL.y;
  vec3 c = vec3(.9, .865, .78);
  // det blå bandet strax under kanten, utanpå
  float ute = smoothstep(86., 89., r);
  c = mix(c, vec3(.2, .32, .58), ute * smoothstep(23.2, 24., y) * (1. - smoothstep(27., 27.8, y)));
  // askan i botten
  float inne = (1. - smoothstep(70., 78., r)) * (1. - smoothstep(13., 18., y));
  float ab = brus(vL.xz * .09) * .6 + brus(vL.xz * .31) * .4;
  c = mix(c, vec3(.58, .56, .53) * (.7 + .5 * ab), inne * smoothstep(.3, .6, ab + .2 * (1. - r / 70.)));
  vec3 ut = c * ljus(n) * .9;
  // mörkare mot disken och inne i skålen
  ut *= .64 + .36 * smoothstep(0., 20., y);
  ut *= 1. - .18 * (1. - smoothstep(60., 82., r)) * smoothstep(20., 30., 40. - y);
  // glaserad: speglar baren
  vec3 e = normalize(cameraPosition - vP);
  vec3 rf = reflect(-e, n);
  vec3 om = mix(vec3(.05, .03, .02), vec3(.62, .43, .25), smoothstep(-.1, .7, rf.y));
  om += vec3(1.3, 1.15, .95) * smoothstep(.93, .985, dot(rf, NYCKEL));
  float f = .05 + .95 * pow(1. - clamp(dot(n, e), 0., 1.), 5.);
  ut = mix(ut, om, f * .8 * (1. - inne * .7));
  ut += vec3(1., .94, .85) * pow(max(0., dot(n, normalize(NYCKEL + e))), 70.) * .5 * (1. - inne);
  gl_FragColor = vec4(ton(ut), 1.);
}`;
export function byggAskkopp(bord = ingenBord()) {
  const { H, URTAG, BREDD, KANT } = ASKKOPP;
  // profilen utifrån och in: botten, väggen, kanten, skålen
  const prof = [[0, 0], [76, 0], [83, 1.2], [87.5, 4.5], [90.5, 12], [92, 24], [91.6, 30], [89.8, 33.2], [86.5, 34], [82.5, 33.6], [80, 31.5], [77, 25], [70, 16.5], [58, 11.5], [40, 10.2], [0, 9.8]];
  // tätare kring urtagen
  const vinklar = [];
  for (let a = 0; a < Math.PI * 2 - 1e-6;) {
    vinklar.push(a);
    const d = Math.min(...[0, Math.PI, Math.PI * 2].map((u) => Math.abs(a - u))) * KANT;
    a += d < BREDD * 1.8 ? 2.2 / KANT : 0.09;
  }
  const na = vinklar.length;
  const np = prof.length;
  const pos = new Float32Array((na + 1) * np * 3);
  // urtaget: en halvcirkel ned i kanten, genom hela godset
  const golv = (a) => {
    const d = Math.min(...[0, Math.PI, Math.PI * 2].map((u) => Math.abs(a - u))) * KANT;
    if (d >= BREDD + 3) return 1e9;
    const k = d < BREDD ? URTAG + (H - URTAG) * (1 - Math.sqrt(1 - (d / BREDD) ** 2)) : H;
    // rundad övergång mot kanten
    return d < BREDD - 2 ? k : k + (H + 2 - k) * ((d - (BREDD - 2)) / 5) ** 2;
  };
  for (let i = 0; i <= na; i++) {
    const a = vinklar[i % na];
    const gy = golv(a);
    for (let j = 0; j < np; j++) {
      const [r, y] = prof[j];
      const o = (i * np + j) * 3;
      pos[o] = Math.cos(a) * r;
      pos[o + 1] = j > 3 && j < np - 3 ? Math.min(y, gy) : y;
      pos[o + 2] = -Math.sin(a) * r;
    }
  }
  const ix = [];
  for (let i = 0; i < na; i++) for (let j = 0; j < np - 1; j++) {
    const a = i * np + j;
    const b = a + np;
    ix.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  // skarven: samma normal på båda sidor
  const nr = g.attributes.normal.array;
  for (let j = 0; j < np; j++) {
    const a = j * 3;
    const b = (na * np + j) * 3;
    for (let k = 0; k < 3; k++) nr[a + k] = nr[b + k] = (nr[a + k] + nr[b + k]) / 2;
  }
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS }, vertexShader: ASK_V, fragmentShader: ASK_F, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;
  return { mesh, borta() { g.dispose(); mesh.material.dispose(); } };
}

// ---------- röken ----------
// Partiklar som rör sig i en gemensam luftström: så länge röken är tunn stiger den lugnt och
// rakt, högre upp slingrar den sig. slapp(p, v, o) släpper en partikel, steg(dt, n) flyttar dem.
const ROK_V = `attribute vec4 aP; attribute vec3 aR; varying vec2 vH; varying vec3 vR; varying vec3 vW;
void main() { vH = position.xy; vR = aR; vW = aP.xyz; vec4 c = viewMatrix * vec4(aP.xyz, 1.); c.xy += position.xy * aP.w; gl_Position = projectionMatrix * c; }`;
const ROK_F = `precision highp float;
varying vec2 vH; varying vec3 vR; varying vec3 vW;
${BORD_GLSL}
${BRUS_GLSL}
void main() {
  if (underBord(vW)) discard;
  float r = length(vH);
  if (r > 1.) discard;
  vec2 q = vH * 1.6 + vR.y * 17.3;
  float b = brus(q) * .6 + brus(q * 2.3 + 4.1) * .4;
  float a = vR.x * (1. - smoothstep(.15, 1., r)) * (.35 + 1.1 * b);
  // blå rök från glöden, grå när han blåser ut
  vec3 c = mix(vec3(.6, .64, .74), vec3(.8, .77, .73), vR.z);
  gl_FragColor = vec4(c * a, a);
}`;
export function byggRok(N = 240, bord = ingenBord()) {
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  const aP = new Float32Array(N * 4);
  const aR = new Float32Array(N * 3);
  const iP = new THREE.InstancedBufferAttribute(aP, 4);
  const iR = new THREE.InstancedBufferAttribute(aR, 3);
  iP.setUsage(THREE.DynamicDrawUsage);
  iR.setUsage(THREE.DynamicDrawUsage);
  quad.setAttribute('aP', iP);
  quad.setAttribute('aR', iR);
  quad.instanceCount = 0;
  const mesh = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: { uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS }, vertexShader: ROK_V, fragmentShader: ROK_F, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  mesh.renderOrder = 8;
  mesh.frustumCulled = false;
  // partiklarna: läge, fart, ålder, livslängd, storlek från och till, täthet, frö, sort (0 blå, 1 grå),
  // virvel, broms, lyft och hur länge den tonar in
  const P = Array.from({ length: N }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), t: 0, liv: 0, r0: 0, r1: 0, a: 0, fro: 0, sort: 0, virv: 0, broms: 0, lyft: 0, inn: 0 }));
  let n = 0;
  function slapp(p, v, o = {}) {
    if (n >= N) return;
    const x = P[n++];
    x.p.copy(p);
    x.v.copy(v);
    x.t = 0;
    x.liv = o.liv ?? 3;
    x.r0 = o.r0 ?? 3;
    x.r1 = o.r1 ?? 30;
    x.a = o.a ?? 0.12;
    x.fro = Math.random();
    x.sort = o.sort ?? 0;
    x.virv = o.virv ?? 1;
    x.broms = o.broms ?? 0;
    x.lyft = o.lyft ?? 0;
    x.inn = o.inn ?? 0.12;
  }
  function steg(dt, tid, golv) {
    for (let i = 0; i < n;) {
      const x = P[i];
      x.t += dt;
      if (x.t >= x.liv) { P[i] = P[n - 1]; P[n - 1] = x; n--; continue; }
      // luftströmmen: lugn nära källan, slingrig högre upp, och ett svagt drag åt höger
      const h = Math.max(0, x.p.y - golv);
      const s = x.virv * Math.min(1, x.t / 1.4) * (8 + Math.min(h, 500) * 0.09);
      const y = x.p.y * 0.021;
      const fx = s * (Math.sin(tid * 1.3 + y + x.p.z * 0.01) + 0.6 * Math.sin(tid * 2.9 - y * 2.3 + 1.7)) + 7;
      const fz = s * 0.6 * Math.sin(tid * 1.7 - y * 1.4 + 0.5);
      const k = Math.exp(-x.broms * dt);
      x.v.multiplyScalar(k);
      x.v.y += x.lyft * dt;
      x.p.x += (x.v.x + fx) * dt;
      x.p.y += x.v.y * dt;
      x.p.z += (x.v.z + fz) * dt;
      i++;
    }
    for (let i = 0; i < n; i++) {
      const x = P[i];
      const f = x.t / x.liv;
      const r = x.r0 + (x.r1 - x.r0) * Math.sqrt(f);
      aP[i * 4] = x.p.x; aP[i * 4 + 1] = x.p.y; aP[i * 4 + 2] = x.p.z; aP[i * 4 + 3] = r;
      aR[i * 3] = x.a * Math.min(1, x.t / x.inn) * (1 - f) * (1 - f);
      aR[i * 3 + 1] = x.fro;
      aR[i * 3 + 2] = x.sort;
    }
    quad.instanceCount = n;
    iP.needsUpdate = true;
    iR.needsUpdate = true;
  }
  return { mesh, slapp, steg, bord, get antal() { return n; }, borta() { quad.dispose(); mesh.material.dispose(); } };
}
