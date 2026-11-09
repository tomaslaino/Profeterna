// Elden till Hasses cigarr (rum-hasse-3d.js tänder den): tändsticksstället i samma porslin som askkoppen,
// med långa tändstickor i och en räfflad plån runt om, tändstickan i hans hand och de brända i askkoppen,
// tändaren i borstat stål med lock som fälls upp, och lågan. Allt i figurens värld (1 enhet = 0,62 mm), i
// dagsljusets färg som det andra på disken (ljusDag), så att det inte blir rosa av neonskylten.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LJUS, BORD_GLSL, DAG, LYS, ELD_AV, ingenBord } from './rum-hasse-arm.js';

const BUTIK_AV = { value: 0 };
const BRUS = `
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float brus(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + 1.), f.x), f.y); }
`;
const uni = (bord, u = {}) => ({ uBord: bord, uButik: bord.butik || BUTIK_AV, uDag: bord.dag || DAG, uLys: bord.lys || LYS, uEld: bord.eld || ELD_AV, ...u });
const mat = (u, v, f, o = {}) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: v, fragmentShader: f, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, ...o });
const klar = (m, ordning = 6) => { m.renderOrder = ordning; m.frustumCulled = false; return m; };

// ---------- tändstickorna ----------
// Långa tändstickor (75 mm): ljust trä med en rödbrun tändsats. Längs stickan y från änden (0) till toppen (L).
// Den brända: svart, rundad topp och stickan förkolnad en bit ned; brand (0–1) är hur långt den har brunnit.
export const STICKA = { L: 120, R: 2.1, HUV: 11, HR: 3.3 };
function stickGeo() {
  const { L, R, HUV, HR } = STICKA;
  const s = new THREE.CylinderGeometry(R, R, L - HUV * 0.5, 6, 3, false);
  s.translate(0, (L - HUV * 0.5) / 2, 0);
  const h = new THREE.SphereGeometry(HR, 10, 8);
  h.scale(1, HUV / (2 * HR), 1);
  h.translate(0, L - HUV / 2, 0);
  const g = mergeGeometries([s.toNonIndexed(), h.toNonIndexed()]);
  s.dispose(); h.dispose();
  const p = g.attributes.position;
  const y = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) y[i] = p.getY(i);
  g.setAttribute('aY', new THREE.BufferAttribute(y, 1));
  return g;
}
const STICK_V = `attribute float aY; attribute float aNr; attribute float aBrand;
varying vec3 vN, vP; varying float vY, vNr, vBrand;
void main() { vY = aY; vNr = aNr; vBrand = aBrand; vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const STICK_F = `precision highp float;
uniform float uAntal, uBrand, uGlo, uTid;
varying vec3 vN, vP; varying float vY, vNr, vBrand;
${LJUS}
${BORD_GLSL}
${BRUS}
const float L = ${STICKA.L}., HUV = ${STICKA.HUV}.;
void main() {
  if (vNr >= uAntal || underBord(vP)) discard;
  vec3 n = normalize(vN);
  // (brand: hur långt den har brunnit, ur geometrin för de brända i askkoppen, annars ur uBrand)
  float b = max(vBrand, uBrand);
  // trä, med fibrer längs stickan
  float f = brus(vec2(vNr * 7.1 + atan(n.z, n.x) * 2., vY * .35));
  vec3 c = mix(vec3(.78, .64, .43), vec3(.9, .78, .56), f);
  // tändsatsen
  float huv = smoothstep(L - HUV - .5, L - HUV + 1.5, vY);
  c = mix(c, mix(vec3(.42, .09, .06), vec3(.55, .16, .09), f), huv);
  // bränd: toppen svart och grå i kanten, stickan förkolnad och brun nedanför
  float kol = smoothstep(L - HUV - 34. * b - 3., L - HUV - 34. * b + 1., vY) * step(.01, b);
  float brun = smoothstep(L - HUV - 34. * b - 12., L - HUV - 34. * b - 2., vY) * step(.01, b);
  c = mix(c, vec3(.3, .19, .1), brun);
  c = mix(c, mix(vec3(.05, .045, .04), vec3(.3, .29, .27), smoothstep(.55, .9, f) * huv), kol);
  vec3 ut = c * (ljusDag(n) + eldsken(vP, n));
  vec3 h = normalize(NYCKEL + normalize(cameraPosition - vP));
  ut += vec3(1., .94, .85) * pow(max(0., dot(n, h)), 24.) * mix(.08, .2, huv) * (1. - kol);
  // glöden i toppen när han just har skakat ut den
  float glo = uGlo * huv * smoothstep(.35, .75, brus(vec2(vY * .6, uTid * 5.) + atan(n.z, n.x)));
  ut += vec3(1., .32, .06) * glo * 1.4 / natten();
  gl_FragColor = vec4(ton(ut), 1.);
}`;
// En tändsticka i handen (mesh, uniformer brand och glo), med änden i origo och toppen längs y.
export function byggSticka(bord = ingenBord()) {
  const g = stickGeo();
  g.setAttribute('aNr', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1));
  g.setAttribute('aBrand', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1));
  const U = uni(bord, { uAntal: { value: 1 }, uBrand: { value: 0 }, uGlo: { value: 0 }, uTid: { value: 0 } });
  const mesh = klar(new THREE.Mesh(g, mat(U, STICK_V, STICK_F)));
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  return { mesh, U, TOPP: new THREE.Vector3(0, STICKA.L - 2, 0), borta() { g.dispose(); mesh.material.dispose(); } };
}
// Flera stickor i en geometri, var och en med sitt läge (matriser) och nummer: de första antal syns (uAntal).
function stickor(lagen, brand) {
  const g0 = stickGeo();
  const delar = lagen.map((m, i) => {
    const g = g0.clone().applyMatrix4(m);
    const n = g.attributes.position.count;
    g.setAttribute('aNr', new THREE.BufferAttribute(new Float32Array(n).fill(i), 1));
    g.setAttribute('aBrand', new THREE.BufferAttribute(new Float32Array(n).fill(brand ? brand[i] : 0), 1));
    return g;
  });
  const g = mergeGeometries(delar);
  g0.dispose();
  delar.forEach((d) => d.dispose());
  return g;
}

// ---------- tändsticksstället ----------
// En liten kopp i askkoppens porslin, med det blå bandet under kanten, och nedanför en bred, oglaserad och
// räfflad plån runt om som han drar stickan mot. Stickorna står i den, lite utåtlutade åt olika håll. I
// stallets mått: botten i origo och y uppåt; ANTAL stickor, och den han tar först är den sista (STALL.TA),
// som lutar mot honom (−z i stallets mått, det vrids inte).
export const STALL = { R: 27, H: 84, GOLV: 12, ANTAL: 9, PLAN: [17, 40] };
const STALL_V = `varying vec3 vN, vP, vL;
void main() { vL = position; vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const STALL_F = `precision highp float;
varying vec3 vN, vP, vL;
${LJUS}
${BORD_GLSL}
${BRUS}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  float r = length(vL.xz);
  float y = vL.y;
  bool ute = r > ${STALL.R - 2.6};
  vec3 c = vec3(.9, .865, .78);
  // plånen: oglaserat, ljust brunt gods med täta, vågräta räfflor, och lite sot där han drar stickorna
  float plan = (ute ? 1. : 0.) * smoothstep(${STALL.PLAN[0]}. - .6, ${STALL.PLAN[0]}. + .6, y) * (1. - smoothstep(${STALL.PLAN[1]}. - .6, ${STALL.PLAN[1]}. + .6, y));
  float rafs = smoothstep(-.3, .3, sin(y * 2.6));
  float a = atan(vL.z, vL.x);
  float sot = smoothstep(.45, .85, brus(vec2(a * 4., y * .08))) * smoothstep(-.2, .6, cos(a + .98));
  vec3 pc = mix(vec3(.76, .66, .54), vec3(.4, .34, .28), sot * .55) * (.82 + .18 * rafs);
  c = mix(c, pc, plan);
  // det blå bandet
  c = mix(c, vec3(.2, .32, .58), (ute ? 1. : 0.) * smoothstep(${STALL.H - 13}.2, ${STALL.H - 12}., y) * (1. - smoothstep(${STALL.H - 9}., ${STALL.H - 8}.2, y)));
  // insidan mörk nedåt
  float inne = ute ? 0. : 1. - smoothstep(${STALL.H - 30}., ${STALL.H - 4}., y);
  vec3 ut = c * (ljusDag(n) + eldsken(vP, n)) * 1.02 * (1. - .7 * inne);
  ut *= .64 + .36 * smoothstep(0., 18., y);
  // glaserat (inte plånen): speglar baren
  vec3 e = normalize(cameraPosition - vP);
  vec3 rf = reflect(-e, n);
  vec3 om = mix(vec3(.05, .03, .02), vec3(.62, .43, .25), smoothstep(-.1, .7, rf.y));
  om += vec3(1.3, 1.15, .95) * smoothstep(.93, .985, dot(rf, NYCKEL));
  float fr = .05 + .95 * pow(1. - clamp(dot(n, e), 0., 1.), 5.);
  float glas = (1. - plan) * (1. - inne);
  ut = mix(ut, om, fr * .8 * glas);
  ut += vec3(1., .94, .85) * pow(max(0., dot(n, normalize(NYCKEL + e))), 70.) * .5 * glas;
  gl_FragColor = vec4(ton(ut), 1.);
}`;
export function byggStall(bord = ingenBord()) {
  const { R, H, GOLV, ANTAL } = STALL;
  const prof = [[0, 0], [R - 3, 0], [R - 1, 1], [R, 3.5], [R, H - 10], [R + 0.8, H - 5], [R + 1.2, H - 1.5], [R + 0.4, H], [R - 2.2, H - 0.4], [R - 3, H - 3], [R - 3.4, GOLV + 6], [R - 6, GOLV], [0, GOLV - 0.5]];
  const V2 = prof.map(([x, y]) => new THREE.Vector2(x, y));
  const kopp = new THREE.LatheGeometry(V2, 32);
  const mesh = klar(new THREE.Mesh(kopp, mat(uni(bord), STALL_V, STALL_F)));
  // stickorna: i en ring, utåtlutade, och toppen höjd lite olika
  const lagen = [];
  for (let i = 0; i < ANTAL; i++) {
    // den sista (den han tar) mot honom och hans högra hand: −z och +x
    const a = i === ANTAL - 1 ? -0.85 : i * 2.399 + 0.6;
    const r = i === ANTAL - 1 ? 13 : 6 + (i % 3) * 5;
    const ut = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const tilt = 0.12 + (i % 4) * 0.035;
    const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-ut.z, 0, ut.x), tilt);
    m.setPosition(ut.x * r, GOLV - 2 + ((i * 7) % 5), ut.z * r);
    lagen.push(m);
  }
  const sg = stickor(lagen);
  const U = uni(bord, { uAntal: { value: ANTAL }, uBrand: { value: 0 }, uGlo: { value: 0 }, uTid: { value: 0 } });
  const st = klar(new THREE.Mesh(sg, mat(U, STICK_V, STICK_F)));
  mesh.add(st);
  return {
    mesh, U,
    // stickans läge i stallets mått (i: 0 … ANTAL − 1)
    lage: (i) => lagen[i],
    antal(n) { U.uAntal.value = n; },
    borta() { kopp.dispose(); sg.dispose(); mesh.material.dispose(); st.material.dispose(); },
  };
}

// ---------- de brända i askkoppen ----------
// Upp till fyra brända stickor i askkoppens skål (askkoppens mått, med urtagen längs x där cigarren ligger),
// på tvären mot cigarren så att de inte ligger under den. brända(n): hur många som syns.
export const BRANDA = [
  { p: [-22, 12.5, 30], a: 1.95, l: 0.06, b: 0.9 },
  { p: [18, 12.5, -34], a: 1.25, l: 0.08, b: 0.7 },
  { p: [-30, 13, -22], a: 2.55, l: 0.1, b: 1 },
  { p: [26, 12.5, 26], a: 0.8, l: 0.05, b: 0.8 },
];
// läget för bränd sticka i: änden i p, liggande längs vinkeln a (från x mot −z), lite uppåt mot toppen (l)
export function brandLage(i, ut = new THREE.Matrix4()) {
  const { p, a, l } = BRANDA[i];
  const d = new THREE.Vector3(Math.cos(a), Math.sin(l), -Math.sin(a)).normalize();
  // stickans y längs d, och dess x vågrätt
  const x = new THREE.Vector3(0, 1, 0).cross(d).normalize();
  const z = new THREE.Vector3().crossVectors(x, d);
  return ut.makeBasis(x, d, z).setPosition(p[0] - d.x * STICKA.L * 0.5, p[1], p[2] - d.z * STICKA.L * 0.5);
}
export function byggBranda(bord = ingenBord()) {
  const g = stickor(BRANDA.map((_, i) => brandLage(i)), BRANDA.map((b) => b.b));
  const U = uni(bord, { uAntal: { value: 0 }, uBrand: { value: 0 }, uGlo: { value: 0 }, uTid: { value: 0 } });
  const mesh = klar(new THREE.Mesh(g, mat(U, STICK_V, STICK_F)));
  return { mesh, U, antal(n) { U.uAntal.value = Math.min(n, BRANDA.length); }, borta() { g.dispose(); mesh.material.dispose(); } };
}

// ---------- tändaren ----------
// En bensintändare i borstat stål: kroppen och locket med gångjärnet på ena kortsidan, och under locket
// skorstenen med hål runt veken och hjulet. I tändarens mått: botten i origo, y uppåt (höjden), x längs
// bredden med gångjärnet åt +x, z tjockleken. lock: 0 stängt, 1 uppfällt.
export const TANDARE = { B: 58, H: 88, D: 20, LOCK: 30, GANG: [29, 58], VEKE: [-7, 78, 0], HJUL: [9, 74, 0], HJUL_R: 6.2 };
const TAND_V = `attribute float aDel; uniform float uLock;
varying vec3 vN, vP, vL; varying float vDel;
void main() {
  vec3 p = position;
  vec3 n = normal;
  vDel = aDel;
  // locket fälls upp runt gångjärnet (z-axeln), upp och över mot +x
  if (aDel > .5 && aDel < 1.5) {
    float a = -uLock * 2.05;
    float c = cos(a), s = sin(a);
    vec2 g = vec2(${TANDARE.GANG[0]}., ${TANDARE.GANG[1]}.);
    vec2 q = p.xy - g;
    p.xy = g + vec2(c * q.x - s * q.y, s * q.x + c * q.y);
    n.xy = vec2(c * n.x - s * n.y, s * n.x + c * n.y);
  }
  vL = position;
  vec4 w = modelMatrix * vec4(p, 1.);
  vP = w.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const TAND_F = `precision highp float;
varying vec3 vN, vP, vL; varying float vDel;
${LJUS}
${BORD_GLSL}
${BRUS}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  vec3 e = normalize(cameraPosition - vP);
  vec3 rf = reflect(-e, n);
  // stålet: borstat på höjden, och speglar baren (mörkt nedåt, varmt ljus uppåt)
  float bor = brus(vec2(vL.x * 1.7 + vL.z * 1.7, vL.y * .05)) * .5 + brus(vec2(vL.x * 6. + vL.z * 6., vL.y * .1)) * .5;
  vec3 bas = vec3(.56, .56, .58) * (.85 + .3 * bor);
  float del = vDel;
  // skorstenen: hål i rader
  if (del > 1.5 && del < 2.5) {
    vec2 h = vec2(vL.x + vL.z, vL.y) / 4.6;
    float hal = 1. - smoothstep(.22, .3, length(fract(h) - .5));
    bas *= mix(1., .08, hal * step(${TANDARE.GANG[1] + 4}., vL.y) * (1. - step(${TANDARE.VEKE[1] - 2}., vL.y)));
  }
  // hjulet: räfflat och mörkare
  if (del > 2.5) bas = vec3(.3, .3, .31) * (.7 + .5 * step(.5, fract(atan(vL.y - ${TANDARE.HJUL[1]}., vL.x - ${TANDARE.HJUL[0]}.) * 3.2)));
  vec3 om = mix(vec3(.05, .04, .03), vec3(.86, .7, .52), smoothstep(-.1, .8, rf.y));
  om += vec3(1.4, 1.25, 1.05) * smoothstep(.9, .99, dot(rf, NYCKEL));
  vec3 ut = bas * (ljusDag(n) + eldsken(vP, n)) * .3 + om * bas * 1.2;
  ut += vec3(1., .95, .88) * pow(max(0., dot(n, normalize(NYCKEL + e))), 40.) * .45;
  gl_FragColor = vec4(ton(ut), 1.);
}`;
export function byggTandare(bord = ingenBord()) {
  const { B, H, D, LOCK, VEKE, HJUL, HJUL_R } = TANDARE;
  const del = (g, d) => { const n = g.attributes.position.count; g.setAttribute('aDel', new THREE.BufferAttribute(new Float32Array(n).fill(d), 1)); return g; };
  const kropp = new RoundedBoxGeometry(B, H - LOCK, D, 2, 4.5).translate(0, (H - LOCK) / 2, 0);
  const lock = new RoundedBoxGeometry(B, LOCK, D, 2, 4.5).translate(0, H - LOCK / 2, 0);
  const sk = new THREE.BoxGeometry(30, 22, D - 7).translate(VEKE[0], H - LOCK + 11, 0);
  const hjul = new THREE.CylinderGeometry(HJUL_R, HJUL_R, 9, 14).rotateX(Math.PI / 2).translate(HJUL[0], HJUL[1], 0);
  const g = mergeGeometries([del(kropp.toNonIndexed(), 0), del(lock.toNonIndexed(), 1), del(sk.toNonIndexed(), 2), del(hjul.toNonIndexed(), 3)].map((x) => { x.deleteAttribute('uv'); return x; }));
  [kropp, lock, sk, hjul].forEach((x) => x.dispose());
  const U = uni(bord, { uLock: { value: 0 } });
  const mesh = klar(new THREE.Mesh(g, mat(U, TAND_V, TAND_F)));
  mesh.matrixAutoUpdate = false;
  return { mesh, U, VEKE: new THREE.Vector3(...VEKE), HJUL: new THREE.Vector3(...HJUL), borta() { g.dispose(); mesh.material.dispose(); } };
}

// ---------- lågan ----------
// En låga som alltid står upp (eller böjer sig mot cigarren när han drar), ritad på en yta som vänds mot
// kameran: en droppe med vit-gul kärna, orange kant och blått vid foten (mer blått i tändarens), och ett svagt
// sken runt om. satt(fot, upp, höjd, bredd, styrka, sort, tid): sort 0 tändstickan, 1 tändaren.
const LAGA_V = `uniform vec3 uFot, uUpp; uniform vec2 uMatt;
varying vec2 vQ;
void main() {
  vQ = position.xy;
  vec4 f = viewMatrix * vec4(uFot, 1.);
  vec3 u = normalize((viewMatrix * vec4(uUpp, 0.)).xyz);
  vec3 s = normalize(cross(u, vec3(0., 0., 1.)));
  // (ytan: x −1–1 över, y −.3–1.3 längs, i lågans mått och lite större för skenet)
  vec3 c = f.xyz + u * position.y * uMatt.x + s * position.x * uMatt.y * 2.2;
  gl_Position = projectionMatrix * vec4(c, 1.);
}`;
const LAGA_F = `precision highp float;
uniform float uStyrka, uSort, uTid;
varying vec2 vQ;
${BRUS}
void main() {
  float y = vQ.y;
  // fladdret: sidledes mer upptill, och spetsen som hoppar
  float fl = (brus(vec2(uTid * 9., y * 2.)) - .5) * .35 * y * y + (brus(vec2(uTid * 23., 3.)) - .5) * .08 * y;
  float x = vQ.x * 2.2 - fl;
  float topp = .95 + .12 * (brus(vec2(uTid * 13., 7.)) - .5);
  // droppen: bredast en fjärdedel upp, spetsig upptill och rund nedtill
  float yy = clamp(y / topp, 0., 1.);
  float b = .5 * pow(sin(3.1416 * pow(yy, .62)), .9) * smoothstep(-.12, .05, y);
  float inne = 1. - smoothstep(b * .55, b, abs(x));
  inne *= step(-.1, y) * (1. - smoothstep(topp - .1, topp, y));
  float k = (1. - smoothstep(b * .2, b * .7, abs(x))) * smoothstep(-.02, .12, y) * (1. - smoothstep(.25, .7, yy));
  vec3 c = mix(vec3(1., .42, .08), vec3(1., .78, .32), smoothstep(.0, .5, 1. - abs(x) / max(b, 1e-3)));
  c = mix(c, vec3(1., .97, .85), k);
  // blått vid foten
  float bla = (1. - smoothstep(.0, mix(.16, .3, uSort), y)) * smoothstep(-.12, 0., y);
  c = mix(c, vec3(.25, .4, 1.), bla * mix(.55, .85, uSort) * (1. - k * .6));
  float a = inne * mix(.85, .95, k);
  // skenet runt lågan
  float d = length(vec2(vQ.x * 1.3, (y - .35) * .9));
  float sken = exp(-d * d * 2.6) * .22;
  vec3 ut = c * a + vec3(1., .55, .2) * sken;
  ut *= uStyrka;
  gl_FragColor = vec4(ut, 0.);
}`;
export function byggLaga() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -0.3, 0, 1, -0.3, 0, 1, 1.4, 0, -1, 1.4, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const U = { uFot: { value: new THREE.Vector3() }, uUpp: { value: new THREE.Vector3(0, 1, 0) }, uMatt: { value: new THREE.Vector2(30, 10) }, uStyrka: { value: 0 }, uSort: { value: 0 }, uTid: { value: 0 } };
  const mesh = klar(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: LAGA_V, fragmentShader: LAGA_F, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor })), 9);
  mesh.visible = false;
  return {
    mesh, U,
    satt(fot, upp, h, b, styrka, sort, tid) {
      mesh.visible = styrka > 0.004;
      if (!mesh.visible) return;
      U.uFot.value.copy(fot);
      U.uUpp.value.copy(upp).normalize();
      U.uMatt.value.set(h, b);
      U.uStyrka.value = styrka;
      U.uSort.value = sort;
      U.uTid.value = tid;
    },
    borta() { g.dispose(); mesh.material.dispose(); },
  };
}
