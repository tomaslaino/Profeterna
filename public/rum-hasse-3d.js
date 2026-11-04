// Hasse Backe i tobaksaffären (rum-hasse.js), i three.js: han sitter bakom bardisken, vänd mot en, med
// underarmarna på disken, kaffet framför sig och cigarren i askkoppen till vänster. Kostymfotot (C More Entertainment, CC BY 3.0, Wikimedia
// Commons) ligger på en formad yta, så att huvudet vrids på riktigt runt nacken och kroppen lutar sig
// fram. Ögon, bryn och mun rör sig i skuggaren. Armarna, händerna, koppen, askkoppen, cigarren och röken
// finns i rum-hasse-arm.js.
//
// Disken ritas inte här: den är en enkel yta på sidan under duken (.rh-disk i rum-hasse.css). Det som är
// under den döljs i skuggarna (BORD_GLSL), så att kroppen slutar vid diskens bakre kant och det som
// ligger på disken trycks mot den. Skuggorna på disken är räknade kapslar, utan skuggkarta.
//
// Världen: 1 enhet = 1 bildpunkt i fotot, x = fotots x − 660, y = 900 − fotots y, z mot betraktaren.
// Ögat står på (0, 500, D) och tittar rakt fram.
//
// figuren(duk, { hog, latt, pr }) → { kamera(v), rita(T, n, tal, mun), tid, info(), borta() }
// Klipp: T 0–12,4 (vila, skrattet, domen, gesterna, hem), T 20–24,5 (en klunk kaffe) och T 30–40 (cigarren),
// de två sista börjar och slutar som vilan.
import * as THREE from 'three';
import { ATLAS, LJUS, ARM, KAMERA, BORD_GLSL, CIGARR, ASKKOPP, laddaFoto, laddaHand, byggArm, byggKopp, byggCigarr, byggAskkopp, byggRok } from './rum-hasse-arm.js';

const DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const spar = (k, t) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ss(k[i - 1][0], k[i][0], t);
  return k[k.length - 1][1];
};

// ---------- figuren ----------

export const D = KAMERA.CZ;
// Disken: ovansidan (y) och den bakre kanten (z), strax framför hans mage.
export const BORD = { Y: -290, Z: 230 };
// En punkt i världen i fönstret, när ögonhöjden på avståndet 0 står i (cx, ey) med s bildpunkter
// på en enhet.
export function iBild(v, x, y, z = 0) {
  const f = (v.s * D) / (D - z);
  return [v.cx + x * f, v.ey + (KAMERA.CY - y) * f];
}
// Det som ska rymmas: hjässan, och allt som rör sig (armarna i gesterna, koppen när han dricker,
// händerna och skuggorna på disken). Gesten där armen går ut åt sidan är smalare på höjden.
export const MATT = {
  topp: [0, 772, 120],
  // hans bredd i vila (ärmarna), till samtalet bredvid honom
  vanster: [-470, -200, 300],
  hoger: [470, -200, 340],
  ram: (hog) => [[hog ? -640 : -790, 860, 330], [660, 860, 330], [hog ? -640 : -790, BORD.Y, 330], [560, BORD.Y, 1000], [-260, BORD.Y, 1000]],
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
  const C = new THREE.PerspectiveCamera(30, 1, 200, 6000);
  C.position.set(0, KAMERA.CY, D);
  C.lookAt(0, KAMERA.CY, 0);
  // disken i skuggarna: ovansidan, bakre kanten och den kanten i duken (kamera)
  const bord = { value: new THREE.Vector3(BORD.Y, BORD.Z, -1) };
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
    uBord: bord,
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
  // koppen på sitt fat, framför honom och närmast hans vänstra hand
  const KOPP = [100, BORD.Y, 720];
  const K = byggKopp(bord);
  const kopp = K.kopp;
  kopp.position.set(KOPP[0], KOPP[1] + 11, KOPP[2]);
  kopp.rotation.y = -0.5;
  K.fat.position.set(KOPP[0], KOPP[1] + 0.5, KOPP[2]);
  S.add(kopp, K.fat);
  // askkoppen till vänster om hans högra hand, med cigarren i urtaget som pekar åt höger och lite
  // mot en: huvudet ligger på disken, glöden över askkoppens mitt och röken stiger därifrån
  const ASK = new THREE.Vector3(-330, BORD.Y, 820);
  const ASKV = 0.35;
  const ask = byggAskkopp(bord);
  ask.mesh.position.copy(ASK);
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
    const zn = D - 900;
    const h = [[-2400, BORD.Z], [2400, BORD.Z], [-2400, zn], [2400, zn]].flatMap(([x, z]) => [x, BORD.Y, z]);
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
  kapA[6].set(-330, BORD.Z + 10, 330, BORD.Z + 10);
  kapH[6].set(64, 26);
  // ---------- rörelserna ----------
  const SA = W_(352, 792, -52);
  const SB = W_(987, 800, 8);
  const LA = ARM.LA;
  const LB = ARM.LB;
  // Vilan: armbågarna på disken, underarmarna på den in mot mitten, och handen på hans vänstra sida
  // vid koppen. Ur axeln (s), armbågens vinkel ut från rakt fram (a) och underarmens vinkel in (b):
  // armbågen och handleden ligger på disken, med armens längder.
  const EH = BORD.Y + 78;
  const WH = BORD.Y + 42;
  function paDisken(s, sida, a, b) {
    const S0 = new THREE.Vector3(s.x + 2 * sida, s.y - 8, s.z);
    const h1 = Math.sqrt(LA * LA - (S0.y - EH) ** 2);
    const E = new THREE.Vector3(S0.x - sida * h1 * Math.sin(a * DEG), EH, S0.z + h1 * Math.cos(a * DEG));
    const h2 = Math.sqrt(LB * LB - (EH - WH) ** 2);
    const W = new THREE.Vector3(E.x + sida * h2 * Math.sin(b * DEG), WH, E.z + h2 * Math.cos(b * DEG));
    return { W: W.toArray(), pol: E.clone().sub(S0).toArray() };
  }
  const va = paDisken(SA, 1, 17, 40);
  const vb = paDisken(SB, -1, 14, 12);
  // [handled, armbågens riktning, fingrarna, handflatan, krok, peka]
  const VILA_A = [va.W, va.pol, [0.84, -0.1, 0.53], [0.2, -0.97, 0.1], 0.36, 0];
  const VILA_B = [vb.W, vb.pol, [-0.4, -0.1, 0.91], [-0.22, -0.97, 0.08], 0.34, 0];
  // [t, handled, armbågens riktning, fingrarna, handflatan, krok, peka]
  const VA = [
    [0, ...VILA_A], [2.5, ...VILA_A],
    // gapskrattet: båda armarna upp framför kroppen
    [3.0, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.35, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.78, P_(270, 680, 340), [-0.8, -0.6, 0.2], [-0.05, 0.95, 0.3], [0.9, 0, 0.3], 0.06, 0],
    // slaget i disken
    [5.0, ...VILA_A], [5.5, ...VILA_A],
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
    [20, ...VILA_B],
  ];
  // Klunken (T 20–24,5), börjar och slutar som vilan. Koppen går till munnen, handen följer örat.
  const KF = { x: (-33 - KOPP[0]) / -405, y: (323 - KOPP[1] - 11) / 725, z: (310 - KOPP[2]) / -160 };
  const KV = [[20, 0, 0, 0, 0, 0], [21.1, 0, 0, 0, 0, 0], [21.95, -405, 725, -160, -0.5, 0], [23.25, -412, 735, -168, -0.72, 0.02], [24.05, 0, 0, 0, 0, 0], [24.5, 0, 0, 0, 0, 0]];
  function klunkKopp(t, ut) {
    const y = (i) => spar(KV.map((k) => [k[0], k[i]]), t);
    ut.set(y(1) * KF.x, y(2) * KF.y, y(3) * KF.z);
    return ut;
  }
  const v = () => new THREE.Vector3();
  const na = { w: v(), pol: v(), F: v(), P: v(), krok: 0, peka: 0 };
  const nb = { w: v(), pol: v(), F: v(), P: v(), krok: 0, peka: 0 };
  function nyckel(K, t, ut) {
    let i = 1;
    while (i < K.length - 1 && t > K[i][0]) i++;
    const a = K[i - 1];
    const b = K[i];
    const f = ss(a[0], b[0], clamp(t, a[0], b[0]));
    const l3 = (o, x, y) => o.set(x[0] + (y[0] - x[0]) * f, x[1] + (y[1] - x[1]) * f, x[2] + (y[2] - x[2]) * f);
    l3(ut.w, a[1], b[1]); l3(ut.pol, a[2], b[2]); l3(ut.F, a[3], b[3]); l3(ut.P, a[4], b[4]);
    ut.krok = a[5] + (b[5] - a[5]) * f;
    ut.peka = a[6] + (b[6] - a[6]) * f;
    return ut;
  }
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
  const kk = v();
  const kh = v();

  const FK = v().set(-0.7, 0.28, 0.66).normalize();
  const PK = v().set(-0.3, -0.8, -0.1).normalize();
  const POLK = v().set(0.5, -0.82, 0.2);
  const tmp = v();
  // handen vid örat: fingrarna runt det, armbågen nedåt och utåt
  function klunkArm(t, b) {
    klunkKopp(t, kk);
    kopp.position.set(KOPP[0] + kk.x, KOPP[1] + 11 + kk.y, KOPP[2] + kk.z);
    const lyft = kk.y / 725;
    kopp.rotation.set(kk.y > 0 ? spar(KV.map((k) => [k[0], k[4]]), t) : 0, -0.5 + lyft * 0.62, -0.22 * lyft);
    kopp.updateMatrix();
    kh.copy(K.ORA).applyMatrix4(kopp.matrix);
    // på väg dit, och kvar medan han håller
    const mot = ss(20.1, 21.05, t) * (1 - ss(24.1, 24.5, t));
    const W = kh.addScaledVector(FK, -176);
    b.w.fromArray(VILA_B[0]).lerp(W, mot);
    b.pol.copy(tmp.fromArray(VILA_B[1])).lerp(POLK, mot);
    b.F.copy(tmp.fromArray(VILA_B[2])).lerp(FK, mot);
    b.P.copy(tmp.fromArray(VILA_B[3])).lerp(PK, mot);
    b.krok = VILA_B[4] + (spar([[20, 0.1], [21, 0.18], [21.2, 0.6], [24, 0.6], [24.2, 0.18], [24.5, VILA_B[4]]], t) - VILA_B[4]) * mot;
    b.peka = 0;
  }
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

  // ---------- cigarren (T 30–40) ----------
  // Han tar cigarren ur askkoppen med höger hand, drar två bloss med halvslutna ögon, blåser ut
  // röken med huvudet bakåt, tittar nöjt på den och lägger tillbaka den. Det är cigarren som styr:
  // handen räknas ur greppet, så att den sitter kvar i fingrarna hela vägen.
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
  const HUV = ASK.clone().addScaledVector(CU, ASKKOPP.R + SN * Math.sqrt(1 - sinA * sinA));
  HUV.y += CIGARR.R + 0.4;
  const NED = new THREE.Vector3(0, -1, 0);
  // läget ur handen: handens origo H, fingrarnas riktning F och handflatans P
  const fA = v();
  function fraHand(ut, H, F, P) {
    fA.crossVectors(F, P).negate().normalize();
    return pose(ut, H.clone().addScaledVector(fA, -GREPP.x).addScaledVector(F, GREPP.y).addScaledVector(P, GREPP.z), fA, P);
  }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const PV = {
    vila: pose(nyPose(), HUV.clone().addScaledVector(A_VILA, SG), A_VILA, NED),
    // armbågen på disken och handen uppe vid axeln, cigarren tvärs över och glöden utåt
    hall: fraHand(nyPose(), V3(-310, 165, 540), V3(0.12, 0.9, 0.42).normalize(), V3(0.25, -0.45, 0.86).normalize()),
    // lite högre och vriden, glöden uppåt: han tittar på den
    se: fraHand(nyPose(), V3(-290, 215, 560), V3(0.3, 0.85, 0.43).normalize(), V3(0.1, -0.48, 0.87).normalize()),
  };
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
  // [T, läge, båge uppåt på vägen dit]
  const CK = [[31.0, 'vila'], [32.1, 'mun', 70], [33.9, 'mun'], [34.35, 'bort'], [34.95, 'hall'], [36.25, 'hall'], [36.9, 'se'], [37.6, 'se'], [38.45, 'vila', 90]];
  const posen = (namn) => PM[namn] || PV[namn];
  function cigarrLage(t, ut) {
    if (t <= CK[0][0] || t >= CK[CK.length - 1][0]) return pose(ut, PV.vila.p, A_VILA, NED);
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
  const KROK_C = [[30, VILA_A[4]], [30.5, 0.12], [30.8, 0.12], [31.0, 0.45], [38.4, 0.45], [38.6, 0.14], [39.1, 0.2], [39.6, VILA_A[4]]];
  function cigarrArm(t, Sk, a) {
    vidMunnen(PM.mun, PM.bort);
    cigarrLage(t, cp);
    cigarrSatt(cp);
    // fram till askkoppen och tillbaka i en båge; däremellan håller han den
    const mot = ss(30.05, 30.85, t) * (1 - ss(38.5, 39.4, t));
    const upp = ss(31.0, 31.9, t) * (1 - ss(37.7, 38.4, t));
    // (vilans riktning är armbågens hela längd: båda som enhetsvektorer, annars tar den nya över först på slutet)
    cPol.fromArray(VILA_A[1]).normalize().lerp(POL_UPP, upp);
    vristTill(Sk, cH, cPol, cU);
    a.w.lerp(cW, mot);
    a.w.y += 220 * mot * (1 - mot);
    a.pol.normalize().lerp(cPol, mot);
    a.F.lerp(cF, mot);
    a.P.lerp(cP, mot);
    a.krok = spar(KROK_C, t);
    a.peka = 0;
    const g = ss(30.8, 31.0, t) * (1 - ss(38.4, 38.6, t));
    for (let i = 0; i < 4; i++) extraC[i] = EXTRA_C[i] * g;
    return extraC;
  }
  // röken: glöden ryker hela tiden (mer när han drar), och han blåser ut genom munnen
  const fot0 = v();
  const rv = v();
  const rd = v();
  const rm = v();
  const rj = v();
  let rokN = null;
  let rokSkuld = 0;
  let blasSkuld = 0;
  // (snett uppåt åt hans vänstra sida, inte framför ansiktet)
  const BLAS = new THREE.Vector3(0.7, 0.72, 0.25).normalize();
  const PUFF = new THREE.Vector3(0.35, 0.28, 0.9).normalize();
  const MUNHORN = W_(680, 511, 0);
  MUNHORN.z = djup(680, 511);
  const slump = () => Math.random() - 0.5;
  function roken(n, t, glod, iCig) {
    const dt = rokN === null ? 0 : clamp(n - rokN, 0, 0.1);
    rokN = n;
    if (dt > 0) {
      // en tunn tråd ur glöden, utspridd längs vägen om cigarren rör sig
      rokSkuld += dt * (14 + 34 * glod);
      const k = Math.floor(rokSkuld);
      rokSkuld -= k;
      for (let i = 0; i < k; i++) {
        rm.lerpVectors(fot0, fot, (i + 1) / k);
        rok.slapp(rm, rv.set(slump() * 4, 26 + slump() * 8, slump() * 4), { liv: 3.4, r0: 1.7, r1: 22, a: 0.2, lyft: 16 });
      }
      if (iCig) {
        // en liten pust mellan blossen, i mungipan
        const puff = t > 32.95 && t < 33.2;
        // och ut med röken, mest i början
        const blas = t > 34.25 && t < 36.2 ? 75 * Math.exp(-(t - 34.25) * 1.3) : 0;
        if (puff || blas) {
          blasSkuld += dt * (puff ? 40 : blas);
          const kb = Math.floor(blasSkuld);
          blasSkuld -= kb;
          iHuvud(puff ? MUNHORN : MUND, rm);
          riktH(puff ? PUFF : BLAS, rd);
          for (let i = 0; i < kb; i++) {
            rv.copy(rd).multiplyScalar(puff ? 35 : 165 + slump() * 50).add(rj.set(slump(), slump(), slump()).multiplyScalar(puff ? 14 : 46));
            rok.slapp(rm, rv, puff ? { liv: 2.2, r0: 3, r1: 28, a: 0.12, broms: 1.2, lyft: 15, sort: 1, virv: 0.7 } : { liv: 3.0, r0: 5, r1: 70, a: 0.13, broms: 1.6, lyft: 24, sort: 1, virv: 0.7, inn: 0.3 });
          }
        }
      }
    }
    fot0.copy(fot);
    rok.steg(dt, n, BORD.Y);
  }

  // Huvudet, kroppen och ansiktet under cigarren, som skillnad mot vilan. Han tittar ned mot
  // askkoppen, möter cigarren, blundar halvt medan han drar, lutar sig bakåt och blåser ut, ler
  // och tittar på den, och tittar ned igen när han lägger tillbaka den.
  const C_YAW = [[30, 0], [30.15, 0], [30.75, -1.3], [31.3, -0.8], [32.0, 0.05], [33.9, 0.05], [34.4, 0.2], [36.2, 0.2], [36.75, -1.25], [37.6, -1.1], [38.0, -1.15], [38.5, -1.2], [39.3, 0], [40, 0]];
  const C_PITCH = [[30, 0], [30.15, 0], [30.75, 1.7], [31.3, 1.1], [32.0, 0.25], [33.9, 0.25], [34.05, 0.1], [34.6, -1.8], [35.9, -1.8], [36.45, 0.1], [36.85, 0.75], [37.6, 0.75], [38.0, 1.4], [38.5, 1.6], [39.3, 0], [40, 0]];
  const C_ROLL = [[30, 0], [36.4, 0], [36.9, 0.07], [37.6, 0.07], [38.0, 0], [40, 0]];
  const C_LUT = [[30, 0], [30.75, 0.03], [31.4, 0.01], [32, 0], [34.15, 0], [34.7, -0.05], [36.0, -0.05], [36.6, 0], [38.0, 0.02], [38.5, 0.03], [39.4, 0], [40, 0]];
  const C_VRID = [[30, 0], [30.75, -0.07], [31.6, -0.02], [36.4, -0.02], [36.9, -0.06], [37.6, -0.06], [38.45, -0.07], [39.4, 0], [40, 0]];
  const C_AX = [[30, 0], [31.2, 6], [32.0, 20], [33.9, 20], [34.6, 12], [36.3, 12], [36.9, 16], [37.6, 16], [38.2, 4], [39.2, 0], [40, 0]];
  const C_BLUND = [[30, 0], [32.15, 0], [32.45, 0.5], [33.8, 0.5], [34.05, 0.25], [34.4, 0.85], [35.75, 0.85], [36.2, 0], [40, 0]];
  const C_BRYN = [[30, 0], [32.15, 0], [32.5, 0.3], [33.8, 0.3], [34.4, 0.1], [36.1, 0.1], [36.75, 0.65], [37.6, 0.55], [38.1, 0], [40, 0]];
  const C_LE = [[30, 0], [35.9, 0], [36.4, 0.45], [37.6, 0.35], [38.3, 0.08], [40, 0]];
  const C_KIS = [[30, 0], [36.0, 0], [36.4, 0.32], [36.9, 0.1], [40, 0]];
  // glöden: två bloss
  const GLOD = [[32.2, 0], [32.5, 1], [32.95, 0.12], [33.25, 0.12], [33.55, 1], [33.85, 0]];

  let sistaT = 0;
  let sistaN = 0;
  // T: var i rörelserna (0–2,5 vilan, 2,5–5,5 fram till domen, 5,5–9,95 gesterna
  // medan han pratar, hemåt till 12,4), n: klockan för det som alltid rör sig,
  // tal: 1 medan han pratar med händerna vilande, mun: hur mycket munnen rör sig
  // (annars följer den tal och gesterna)
  function rita(T, n, tal = 0, mun = null) {
    const t = T;
    sistaT = T; sistaN = n;
    const skratt = ss(2.75, 3.05, t) * (1 - ss(4.25, 4.6, t));
    const talar = Math.max(tal, ss(5.55, 5.7, t) * (1 - ss(9.4, 9.6, t)));
    const dricker = ss(21.2, 21.85, t) * (1 - ss(23.2, 23.9, t));
    // cigarren: i munnen, och när han blåser ut
    const iCig = t > 30 && t < 40;
    const iMun = iCig ? ss(31.95, 32.15, t) * (1 - ss(33.9, 34.05, t)) : 0;
    const blaser = iCig ? ss(34.15, 34.35, t) * (1 - ss(35.9, 36.3, t)) : 0;
    const glod = iCig ? spar(GLOD, t) : 0;
    const c = (k) => (iCig ? spar(k, t) : 0);
    const yaw = 0.22 * (c(C_YAW) + spar([[0, -0.3], [2.5, -0.3], [3.0, 0.15], [4.5, 0.1], [5.0, 0], [8.2, 0], [8.7, -0.8], [9.3, -0.65], [9.95, 0], [10.6, 0.25], [11.6, 0.25], [12.4, -0.3]], t) + 0.1 * Math.sin(n * 0.8) * (1 - iMun * 0.6) + talar * 0.28 * Math.sin(n * 2.7 + 1));
    const pitch = 0.17 * (c(C_PITCH) + spar([[0, -0.45], [2.5, -0.45], [3.0, -1.2], [4.4, -1.1], [4.8, -0.55], [5.0, 0.95], [5.2, 0.05], [8.2, 0.05], [9.95, 0.05], [10.6, -0.6], [11.6, -0.6], [12.4, -0.45]], t) + talar * 0.3 * Math.sin(n * 6.1) + skratt * 0.16 * Math.sin(n * 15) - dricker * 1.15);
    const roll = -(c(C_ROLL) + spar([[0, -0.08], [2.5, -0.08], [3.0, 0.09], [4.4, 0.07], [5.0, 0], [8.2, 0], [8.7, -0.06], [9.3, -0.05], [9.95, 0], [10.6, 0.05], [11.6, 0.05], [12.4, -0.08]], t) + talar * 0.03 * Math.sin(n * 3.3));
    eu.set(pitch, yaw, roll, 'YXZ');
    mh.makeRotationFromEuler(eu);
    U.uHuvud.value.setFromMatrix4(mh);
    const lut = c(C_LUT) + spar([[0, 0.05], [2.5, 0.05], [3.0, -0.03], [4.72, -0.04], [5.0, 0.09], [5.5, 0.06], [8.2, 0.05], [9.95, 0.06], [12.4, 0.05]], t);
    const vrid = c(C_VRID) + spar([[0, -0.09], [2.5, -0.09], [3, 0], [4.72, 0.05], [5.0, -0.1], [5.5, -0.08], [8.2, -0.03], [8.7, -0.17], [9.3, -0.14], [9.95, -0.08], [12.4, -0.09]], t) + talar * 0.015 * Math.sin(n * 2.1);
    const sid = spar([[0, -0.008], [2.5, -0.008], [3, -0.006], [4.72, 0.015], [5, -0.012], [8.7, 0.015], [9.95, -0.012], [12.4, -0.008]], t) + 0.003 * Math.sin(n * 0.55);
    eu.set(lut, vrid, sid, 'YXZ');
    mr.makeRotationFromEuler(eu);
    mk.copy(mr);
    h1.copy(HOFT).applyMatrix4(mr);
    mk.setPosition(HOFT.x - h1.x, HOFT.y - h1.y, HOFT.z - h1.z);
    U.uKropp.value.copy(mk);
    const axV = c(C_AX) + spar([[0, -8], [2.5, -8], [3.0, 42], [4.35, 42], [4.78, 26], [5.0, -8], [5.5, -8], [5.95, 18], [8.15, 18], [8.7, 26], [9.95, -8], [12.4, -8]], t) + skratt * 5 * Math.sin(n * 15);
    const axH = spar([[0, 0], [2.55, 0], [3.0, 42], [4.2, 42], [4.72, 0], [12.4, 0]], t) + skratt * 5 * Math.sin(n * 15);
    U.uAx.value.set(axV, axH);
    U.uAndas.value = 7 * Math.sin(n * 1.5) + skratt * 5 * Math.sin(n * 15);
    const lyft = talar * 0.38 * Math.max(0, Math.sin(n * 4.3));
    const brynC = c(C_BRYN);
    U.bryn.value.set(brynC + spar([[0, 0], [2.5, 0], [3.0, 0.5], [4.4, 0.5], [5.0, 1], [5.6, 0.4], [9.4, 0.3], [9.95, 0.4], [10.6, 0.15], [11.6, 0.15], [12.4, 0]], t) + lyft, brynC * 0.8 + spar([[0, 1.1], [2.5, 1.1], [3.0, 0.6], [4.4, 0.6], [5.0, 1], [5.6, 0.5], [9.4, 0.4], [9.95, 0.5], [10.6, 1.05], [11.6, 1.05], [12.4, 1.1]], t) + lyft);
    U.le.value = Math.max(0.14 * (1 - ss(2.5, 2.8, t)), skratt, 0.3 * ss(8.3, 8.8, t) * (1 - ss(9.4, 9.8, t)), 0.6 * ss(10, 10.5, t) * (1 - ss(11.6, 12.4, t)), 0.14 * ss(11.6, 12.4, t), 0.34 * ss(23.7, 24.1, t) * (1 - ss(24.3, 24.5, t)), c(C_LE));
    // talet: stavelser med små pauser, ibland rundare läppar
    const stav = Math.abs(Math.sin(n * 7.3)) * (0.42 + 0.58 * ss(-0.35, 0.5, Math.sin(n * 2.3 + 0.7))) * (0.72 + 0.28 * Math.sin(n * 17.3));
    const talMun = (mun === null ? talar : mun) * (1 - dricker) * (1 - Math.max(iMun, blaser));
    // läpparna om cigarren, en pust mellan blossen och ett o när han blåser ut
    const puff = iCig ? ss(32.93, 33.0, t) * (1 - ss(33.12, 33.22, t)) : 0;
    U.munn.value = Math.max(talMun * stav * 0.62, skratt * (0.92 + 0.14 * Math.sin(n * 14)), ss(4.9, 5.0, t) * (1 - ss(5.0, 5.25, t)) * 0.72, iMun * (0.15 + 0.12 * puff), blaser * (0.27 + 0.05 * Math.sin(n * 7)));
    U.rund.value = talMun * Math.max(0, Math.sin(n * 3.1 + 1.3)) * 0.8;
    U.kis.value = Math.max(skratt * 0.75, U.le.value * 0.45, c(C_KIS));
    // blinkningarna: en gång i några sekunder, klockan avgör
    const fas = (n % 4.3);
    const bl = 1 - clamp(Math.abs(fas - 0.3) / 0.085);
    U.rund.value = Math.max(U.rund.value, dricker * 0.7, iMun * 0.85, blaser);
    U.blund.value = Math.max(dricker * 0.82, skratt * 0.42, bl, ss(10.7, 10.9, t) * (1 - ss(11.25, 11.45, t)), c(C_BLUND));
    U.blick.value.set(4 * clamp(yaw / 0.2, -1, 1), 0);
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
    // cigarren ligger i askkoppen, eller i hans hand
    let extraA = null;
    if (iCig) extraA = cigarrArm(t, sa, a);
    else cigarrSatt(cigarrLage(0, cp));
    cig.U.uGlod.value = glod;
    cig.U.uTid.value = n;
    const iKlunk = t > 20 && t < 24.5;
    if (iKlunk) klunkArm(t, b);
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
    B.satt(sb, E_, Wr_, b.F, b.P, b.krok, b.peka, isar * 0.8, 0.45);
    U.uArm.value[3].copy(sb); U.uArm.value[4].copy(E_); U.uArm.value[5].copy(Wr_);
    // koppen hoppar när han slår i disken
    const hopp = t > 5 && t < 5.55 ? Math.sin(((t - 5) / 0.55) * Math.PI) * 62 * (1 - (t - 5) / 0.9) : 0;
    if (!iKlunk) { kopp.position.set(KOPP[0], KOPP[1] + 11 + hopp, KOPP[2]); kopp.rotation.set(0, -0.5, hopp * 0.0045); }
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
    skk(5, K.fat.position, K.fat.position, 96, 1);
    skk(7, ASK, ASK, 92, 1);
    skk(8, cX, fot, 14, Math.min(ah(cX), ah(fot)));
    roken(n, t, glod, iCig);
    r.render(S, C);
  }

  // Kameran: v är fönstret (W, H), var ögonhöjden står i det (cx, ey), s bildpunkter på en enhet på
  // avståndet 0, och dukens ruta (x, y, w, h), allt i fönstrets bildpunkter.
  function kamera(v) {
    Object.assign(duk.style, { left: `${v.x}px`, top: `${v.y}px`, width: `${v.w}px`, height: `${v.h}px` });
    r.setSize(v.w, v.h, false);
    C.fov = (2 * Math.atan(v.H / 2 / (v.s * D))) / DEG;
    C.aspect = v.W / v.H;
    C.setViewOffset(v.W, v.H, v.W / 2 - v.cx + v.x, v.H / 2 - v.ey + v.y, v.w, v.h);
    // diskens bakre kant i duken, räknat nedifrån som gl_FragCoord
    const kant = iBild(v, 0, BORD.Y, BORD.Z)[1] - v.y;
    bord.value.z = (v.h - kant) * (duk.height / v.h);
    rita(sistaT, sistaN);
  }
  return {
    rita,
    kamera,
    tid: 12.4,
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
