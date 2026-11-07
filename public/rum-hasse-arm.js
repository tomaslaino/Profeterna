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
import { SCEN, kamera } from './rum-hasse-scen.js';

// atlasen (bildpunkter): kroppen 860 × 1350, sedan ärmens remsa, huden bredvid
export const ATLAS = { W: 1372, H: 1350, X0: 280, Y0: 130, TW: 860, TH: 1350, rx: 860, rw: 256, rh: 1024, hx: 1116, hy: 0, hw: 256, hh: 512 };

// Samma ljus på allt: varmt framifrån till vänster (NYCKEL), ett varmt kantljus bakifrån från barens
// lampor, och i baren (uButik) neonskyltens röda sken och gatans kalla ljus från affären till höger.
// Där lyser också lysröret i affärens tak (uLys, tänt från sex till midnatt) och dagsljuset genom
// affärens stora fönster (uDag): ett brett, mjukt ljus från höger och lite framifrån, i himlens färg och
// så starkt som det är ljust ute. När det är dag tar fönstret över: lamporna, neonen och gatan syns mindre.
// Riktningarna är i figurens värld; VY är riktningen mot kameran (rum-hasse-scen.js).
// fotoLjus() är ljuset som fotot redan har, så att en vriden yta får rätt skillnad.
const VY = kamera().bak.map((x) => x.toFixed(3)).join(', ');
export const LJUS = `
uniform float uButik;
uniform vec4 uDag;
uniform vec4 uLys;
const vec3 NYCKEL = vec3(-.449, .549, .699);
const vec3 NEON = vec3(.702, .12, .702);
const vec3 GATA = vec3(.54, .19, .82);
const vec3 ROR = vec3(.72, .42, .55);
const vec3 FONSTER = vec3(.62, .2, .76);
const vec3 VY = vec3(${VY});
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
// Handens storlek (modellen är en hand på ungefär 17 cm i skala 1; en enhet är ungefär 0,6 mm) och
// manschettens vidd. Greppen om cigarren och koppen (rum-hasse-3d.js) räknas med samma skala.
export const HAND = { SK: 1.04, MAN: 0.95 };
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
// Huden ur fotot: dess detaljer (porer, veck och ådror) på en jämn ton. Fotots hud är sammansatt av
// bitar och har mörka fläckar i ett rutmönster, som annars blir mörka streck tvärs över fingrarna. (Den
// suddiga bilden delas med sin täckning, så att det genomskinliga runt bitarna inte gör den mörkare.)
vec3 hud(vec2 uv, vec3 ton0) {
  vec3 d = texture2D(foto, uv).rgb;
  vec4 b = texture2D(foto, uv, 4.);
  vec3 bl = b.rgb / max(b.a, .05);
  return mix(bl, ton0, .75) * clamp(d / max(bl, vec3(.05)), .72, 1.28);
}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  // huden: fotots handrygg överst i atlasen, handflatan under
  vec2 q = clamp(vUv, .004, .996);
  vec3 c = mix(hud(uHud.xy + vec2(q.x, q.y * .5 + .5) * uHud.zw, vec3(.745, .498, .424)), hud(uHud.xy + vec2(q.x, q.y * .5) * uHud.zw, vec3(.831, .584, .494)), vPalm);
  // Fotots händer är rödare och mörkare än ansiktet (de låg i skugga): huden dras mot ansiktets ton,
  // och lite mattare, så att ljuset ovanifrån inte gör den orange bredvid ansiktet
  c *= vec3(1.03, 1.17, 1.22);
  c = mix(c, vec3(dot(c, vec3(.3, .55, .15))), .1);
  c = mix(c, c * vec3(1.08, .92, .88), vTon * .5);
  // inbakad skugga mellan fingrarna: varm, som hud i skugga (förut grå, som smuts mellan fingrarna)
  float ao = vAo * vAo * .6 + .4;
  // nageln: rosa nagelbädd, ljus halvmåne vid roten och ljus kant längst ut
  float rd = length(max(abs(vNagel) - vec2(.6, .58), 0.)) - .36;
  float rygg = smoothstep(.45, .7, vRygg);
  // (mjuk kant och nära huden: förut laxrosa fält med skarp kant, som klistermärken)
  float nagel = (1. - smoothstep(-.09, .07, rd)) * rygg;
  vec3 nc = mix(c, vec3(dot(c, vec3(.3, .55, .15))), .35) * vec3(1.02, 1., 1.02) + .05;
  nc = mix(nc, vec3(.88, .8, .76), .45 * (1. - smoothstep(-.92, -.5, vNagel.y)));
  nc = mix(nc, vec3(.9, .86, .8), .8 * smoothstep(.7, .95, vNagel.y));
  c = mix(c, nc, nagel * .75);
  c *= 1. - .12 * rygg * exp(-rd * rd * 160.);
  vec3 l = ljus(n);
  // ljuset som går igenom huden: varmare där ljuset tar slut
  float ter = max(0., dot(n, NYCKEL) + .3);
  l += vec3(.16, .045, .025) * ter * (1. - ter) * 1.7;
  vec3 ut = c * l * mix(vec3(.5, .36, .32), vec3(1.), ao);
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
  const SK = HAND.SK;
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
const RINGAR = 48;
const SEG = 24;
// Ärmens halva bredd längs armen (s = 0 överst på ärmhuvudet, 0,5 armbågen, 1 ärmslutet). Överarmen har
// fotots mått, så att den möter kavajen där armarna satt; från armbågen smalnar ärmen av mot ärmslutet,
// som en kavajärm gör. (Förut hade underarmen överarmens bredd nästan ända ut, och armen såg ut som en
// uppblåst korv.)
const BREDD = [[0, 56], [0.03, 66], [0.0625, 78], [0.125, 92], [0.1875, 105], [0.25, 113], [0.3125, 117], [0.375, 117], [0.4375, 113], [0.5, 106], [0.5625, 98], [0.625, 91], [0.6875, 86], [0.75, 82], [0.8125, 78], [0.875, 72], [0.9375, 68], [1, 65]];
function radie(s) {
  for (let i = 1; i < BREDD.length; i++) if (s <= BREDD[i][0]) return BREDD[i - 1][1] + ((BREDD[i][1] - BREDD[i - 1][1]) * (s - BREDD[i - 1][0])) / (BREDD[i][0] - BREDD[i - 1][0]);
  return 65;
}
const ARM_V = `
attribute vec3 aN0; attribute float aS, aI, aVeck;
varying vec2 vUv; varying vec3 vN, vN0, vW; varying float vS, vI, vVeck;
void main() { vUv = uv; vN = normal; vN0 = aN0; vS = aS; vI = aI; vVeck = aVeck; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const ARM_F = `precision highp float;
uniform sampler2D foto;
varying vec2 vUv; varying vec3 vN, vN0, vW; varying float vS, vI, vVeck;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vW)) discard;
  vec3 n = normalize(vN);
  // insidan av ärmen (genom ärmslutet): mörk, med lite av ljuset utifrån
  float ute = gl_FrontFacing ? 1. : 0.;
  if (!gl_FrontFacing) n = -n;
  vec4 c = texture2D(foto, vUv);
  // remsan är utjämnad: skuggorna kommer från ljuset, vecken från formen och fotot (mjukare, för armen
  // ligger inte som i fotot)
  c.rgb = .135 + (c.rgb - .135) * .62;
  vec3 ut = c.rgb * ljus(n) * 1.14;
  vec3 e = normalize(cameraPosition - vW);
  // ylle: ljuset fastnar i luddet där tyget vänder sig bort, och vecken skuggar sig själva
  float gr = 1. - clamp(dot(n, e), 0., 1.);
  ut += vec3(.075, .07, .066) * gr * gr * (.4 + .6 * clamp(dot(n, NYCKEL) + .5, 0., 1.)) * (1. - vVeck);
  ut += kant(n, .1) * (1. - .6 * vVeck);
  ut *= 1. - .55 * vVeck;
  // lite glans på tyget där det spänner över armbågen
  ut += vec3(.05, .045, .04) * pow(max(0., dot(n, normalize(NYCKEL + e))), 6.) * (1. - vVeck);
  ut = mix(ut * .3, ut, ute);
  // ärmhuvudet och insidan av överarmen tonar in i kavajen på fotot
  float a = smoothstep(.0, .07, vS) * (1. - smoothstep(.62, 1., -vI) * (1. - smoothstep(.07, .2, vS)));
  gl_FragColor = vec4(ton(ut) * a, a);
}`;
const SKJ_F = `precision highp float;
varying vec3 vN, vW, vL;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vW)) discard;
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  // insidan av manschetten är mörk
  float inne = gl_FrontFacing ? 1. : .34;
  vec3 c = vec3(.97, .965, .955) * (ljus(n) * 1.04) * inne;
  // skuggad där den går in i ärmen, och sömmen en bit från kanten
  c *= .5 + .5 * smoothstep(-12., 22., vL.y);
  c *= 1. - .14 * exp(-pow((vL.y - 37.5) / 1.3, 2.)) * inne;
  vec3 e = normalize(cameraPosition - vW);
  c += vec3(.06, .058, .055) * pow(max(0., dot(n, normalize(NYCKEL + e))), 12.) * inne;
  gl_FragColor = vec4(ton(c), 1.);
}`;
const SKJ_V = `varying vec3 vN, vW, vL; void main() { vL = position; vN = mat3(modelMatrix) * normal; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const Y_AX = new THREE.Vector3(0, 1, 0);
// skjortans manschett (radien, höjden längs underarmen från ärmslutet): går in i ärmen och slutar en bit
// före handleden, med en rundad kant
const MANSCHETT = [[54, -44], [54.5, 10], [54.2, 16], [53, 20.5], [51, 22.6], [49.2, 21.4], [48.6, 16], [48.6, -44]];
export function byggArm(scen, sida, foto, modell, vidd = 1, bord = ingenBord()) {
  const n = RINGAR * (SEG + 1);
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(n * 3);
  const N = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const n0 = new Float32Array(n * 3);
  const sS = new Float32Array(n);
  const sI = new Float32Array(n);
  const vk = new Float32Array(n);
  const rad = new Float32Array(n * 3);
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
    uv[o * 2 + 1] = 1 - (0.5 + Math.min(s, 0.985) * (A.rh - 1)) / A.H;
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
  g.setAttribute('aVeck', new THREE.BufferAttribute(vk, 1));
  g.setIndex(ix);
  // (dubbelsidig: genom ärmslutet syns insidan)
  const rorM = new THREE.ShaderMaterial({ uniforms: { foto: { value: foto }, uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS }, vertexShader: ARM_V, fragmentShader: ARM_F, transparent: true, depthWrite: true, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const ror = new THREE.Mesh(g, rorM);
  ror.frustumCulled = false;
  // skjortans manschett: ett rör med en rundad kant, lite plattare som handleden (handflatan åt z)
  const manG = new THREE.LatheGeometry(MANSCHETT.map(([r, y]) => new THREE.Vector2(r * HAND.MAN, y)), 28);
  manG.scale(1, 1, 0.74);
  const man = new THREE.Mesh(manG, new THREE.ShaderMaterial({ uniforms: { uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: DAG, uLys: LYS }, vertexShader: SKJ_V, fragmentShader: SKJ_F, transparent: true, side: THREE.DoubleSide }));
  man.frustumCulled = false;
  man.matrixAutoUpdate = false;
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
  const O_ = new THREE.Vector3();
  const nb = new THREE.Vector3();
  const FL = new THREE.Vector3();
  const mzT = new THREE.Vector3();
  const dI = new THREE.Vector3();
  const dJ = new THREE.Vector3();
  const nn = new THREE.Vector3();
  const mx = new THREE.Vector3();
  const mz = new THREE.Vector3();
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
    const bojd = Math.acos(Math.min(1, Math.max(-1, u1.dot(u2))));
    // Armbågen: en tät böj (förut en vid båge, så att armbågen blev en ballong när armen böjdes), där
    // tyget trycks ihop på insidan och lägger sig i veck, och spänner över armbågsspetsen på utsidan.
    const kb = Math.min(1, bojd / 1.7);
    const rr = Math.min(105 - 80 * kb, L1 * 0.34, L2 * 0.34);
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
    const smal = 0.78 + 0.22 * hang * hang * (3 - 2 * hang);
    // armbågens mittplan: överarmens tyg stannar på sin sida och underarmens på sin, så att insidan
    // viker sig i ett veck i stället för att gå igenom den andra delen
    nb.copy(u1).add(u2);
    const nbL = nb.length();
    if (nbL > 1e-4) nb.multiplyScalar(1 / nbL);
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
      // utsidan av böjen (mot armbågsspetsen), vinkelrätt mot armen här
      O_.copy(lage.pol).addScaledVector(T_, -lage.pol.dot(T_));
      const oL = O_.length();
      if (oL > 1e-4) O_.multiplyScalar(1 / oL);
      const sista = i === RINGAR - 1;
      const r0 = radie(s) * (1 + (vidd - 1) * (1 - s)) * (1 + (smal - 1) * Math.max(0, 1 - s / 0.62));
      // ärmslutet: kanten viker sig in en aning, så att den har en tjocklek
      if (sista) pC.addScaledVector(T_, -4);
      // Ärmen är lite platt: i början mot kameran (N_), och mot ärmslutet som handleden och manschetten,
      // med handflatan åt den platta sidan
      const platt = 0.8;
      const wf = Math.min(1, Math.max(0, (s - 0.62) / 0.3));
      FL.copy(N_).multiplyScalar(1 - wf).addScaledVector(mzT.copy(Pn).addScaledVector(T_, -Pn.dot(T_)).normalize(), wf * (N_.dot(mzT) < 0 ? -1 : 1));
      if (FL.lengthSq() < 1e-6) FL.copy(N_);
      FL.normalize();
      const e = dist - dE;
      // armbågen (tätt), vecken på insidan (bredare), och lite liv i tyget
      const we = kb * Math.exp(-((e / 95) ** 2));
      const wv = kb * Math.exp(-((e / 170) ** 2));
      // ärmen hopar sig lite ovanför ärmslutet när armen är böjd
      const wh = (0.4 + 0.6 * kb) * Math.min(1, Math.max(0, (s - 0.8) / 0.12)) * (1 - Math.min(1, Math.max(0, (s - 0.97) / 0.03)));
      for (let j = 0; j <= SEG; j++) {
        const th = ((j % SEG) / SEG) * 6.28318;
        const si = Math.sin(th);
        const cs = Math.cos(th);
        const rx = N_.x * cs + B_.x * si;
        const ry = N_.y * cs + B_.y * si;
        const rz = N_.z * cs + B_.z * si;
        const ob = oL > 1e-4 ? rx * O_.x + ry * O_.y + rz * O_.z : 0;
        const inn = Math.max(0, -ob);
        // vecken: valv som går runt insidan av armbågen och planar ut mot sidorna
        const vf = Math.sin(e * 0.085 - 1.9 * ob + sida);
        const veck = wv * (0.5 - 0.5 * ob) ** 1.5 * (0.5 + 0.5 * vf);
        let rd = r0 * (1 - 0.3 * we * inn ** 1.3 + 0.07 * wv * (0.5 - 0.5 * ob) ** 1.5 * vf + 0.03 * we * Math.max(0, ob) ** 3 + 0.012 * Math.sin(dist * 0.021 + th * 3) + 0.022 * wh * Math.sin(dist * 0.07 + th * 2 + sida * 1.3));
        if (sista) rd *= 0.9;
        // (radien, och den platta sidan in mot mitten)
        const fl = (rx * FL.x + ry * FL.y + rz * FL.z) * rd * (1 - platt);
        let px = pC.x + rx * rd - FL.x * fl;
        let py = pC.y + ry * rd - FL.y * fl;
        let pz = pC.z + rz * rd - FL.z * fl;
        if (nbL > 1e-4 && kb > 0.05) {
          const sd = (px - E.x) * nb.x + (py - E.y) * nb.y + (pz - E.z) * nb.z;
          if ((e < 0 && sd > 0) || (e > 0 && sd < 0)) { px -= nb.x * sd; py -= nb.y * sd; pz -= nb.z * sd; }
        }
        Pa[o * 3] = px;
        Pa[o * 3 + 1] = py;
        Pa[o * 3 + 2] = pz;
        rad[o * 3] = rx;
        rad[o * 3 + 1] = ry;
        rad[o * 3 + 2] = rz;
        // skuggan i vecken, och djupast inne i armbågsvecket
        vk[o] = Math.min(0.75, 0.55 * veck * (1 - 0.5 * (0.5 + 0.5 * vf)) + 0.45 * we * inn ** 2 + (sista ? 0.25 : 0));
        o++;
      }
    }
    // normalerna ur formen (veck och armbåge syns i ljuset), utåt
    const R1 = SEG + 1;
    for (let i = 0; i < RINGAR; i++) {
      const ia = Math.max(0, i - 1);
      const ib = Math.min(RINGAR - 1, i + 1);
      for (let j = 0; j < SEG; j++) {
        const ja = (j + SEG - 1) % SEG;
        const jb = (j + 1) % SEG;
        const k = i * R1 + j;
        dI.set(Pa[(ib * R1 + j) * 3] - Pa[(ia * R1 + j) * 3], Pa[(ib * R1 + j) * 3 + 1] - Pa[(ia * R1 + j) * 3 + 1], Pa[(ib * R1 + j) * 3 + 2] - Pa[(ia * R1 + j) * 3 + 2]);
        dJ.set(Pa[(i * R1 + jb) * 3] - Pa[(i * R1 + ja) * 3], Pa[(i * R1 + jb) * 3 + 1] - Pa[(i * R1 + ja) * 3 + 1], Pa[(i * R1 + jb) * 3 + 2] - Pa[(i * R1 + ja) * 3 + 2]);
        nn.crossVectors(dI, dJ);
        const l = nn.length();
        if (l < 1e-6) nn.set(rad[k * 3], rad[k * 3 + 1], rad[k * 3 + 2]).normalize();
        else {
          nn.multiplyScalar(1 / l);
          if (nn.x * rad[k * 3] + nn.y * rad[k * 3 + 1] + nn.z * rad[k * 3 + 2] < 0) nn.negate();
        }
        Na[k * 3] = nn.x; Na[k * 3 + 1] = nn.y; Na[k * 3 + 2] = nn.z;
      }
      const k0 = i * R1;
      const kS = k0 + SEG;
      Na[kS * 3] = Na[k0 * 3]; Na[kS * 3 + 1] = Na[k0 * 3 + 1]; Na[kS * 3 + 2] = Na[k0 * 3 + 2];
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    g.attributes.aVeck.needsUpdate = true;
    // manschetten följer handleden, platt som den (handflatan åt manschettens z)
    mz.copy(Pn).addScaledVector(u2, -Pn.dot(u2));
    if (mz.lengthSq() < 1e-6) mz.copy(N_);
    mz.normalize();
    mx.crossVectors(u2, mz);
    man.matrix.makeBasis(mx, u2, mz).setPosition(W.x, W.y, W.z);
    man.matrixWorldNeedsUpdate = true;
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

// ---------- pennan ----------
// Samma penna som ligger på kupongen (rum.css, .rum-kup .pencil), vit med träspets, lite grövre så att den
// syns i handen. Blyets spets i origo och y mot änden.
export const PENNA = { L: 215, R: 7.2, TRA: 30 };
const PEN_F = `precision highp float;
varying vec3 vN, vP, vL;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  float y = vL.y;
  // sidorna: ljus, ljusare och mörkare ränder runt om, som på kupongen
  float a = atan(vL.z, vL.x);
  vec3 c = mix(vec3(.78, .77, .72), vec3(.95, .95, .92), .5 + .5 * cos(a * 6.));
  c = mix(vec3(.82, .68, .46), c, smoothstep(${PENNA.TRA}. - .6, ${PENNA.TRA}. + .6, y));
  c = mix(vec3(.09, .09, .1), c, smoothstep(5.5, 6.5, y));
  // ringen i änden
  float ring = smoothstep(${PENNA.L}. - 12., ${PENNA.L}. - 11., y);
  c = mix(c, vec3(.55, .54, .5), ring);
  vec3 ut = c * ljus(n);
  vec3 h = normalize(NYCKEL + normalize(cameraPosition - vP));
  ut += vec3(1., .95, .88) * pow(max(0., dot(n, h)), 30.) * .25;
  ut += kant(n, .15);
  gl_FragColor = vec4(ton(ut), 1.);
}`;
export function byggPenna(bord = ingenBord()) {
  const { L, R, TRA } = PENNA;
  const g = new THREE.LatheGeometry(V2([[0, 0], [0.9, 0.6], [R, TRA], [R, L - 1], [R - 2, L], [0, L + 0.2]]), 12);
  const U = { uBord: bord, uButik: bord.butik || BUTIK_AV };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: CIG_V, fragmentShader: PEN_F, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  return { mesh, borta() { g.dispose(); mesh.material.dispose(); } };
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
