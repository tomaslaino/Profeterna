// Hasse Backe i tobaksaffären (rum-hasse.js), i three.js: armen på pulten och
// figuren bakom disken. Kostymfotot (C More Entertainment, CC BY 3.0,
// Wikimedia Commons) ligger på en formad yta, så att huvudet vrids på riktigt
// runt nacken och kroppen lutar sig fram. Ögon, bryn och mun rör sig i skuggaren.
// Armarna, händerna och koppen finns i rum-hasse-arm.js.
//
// Grafiken: inga skuggkartor och ingen ny bild i rummet. Handen på pulten ritas bara
// när fingrarna trummar. Figuren finns bara medan man tittar på honom, och då
// står gänget och sakerna still och ritas inte (Rum.vila). Rummet bakom honom är
// en färdig bild (scripts/hasse/bak.html). Skuggorna på disken är räknade kapslar.
//
// Världen: 1 enhet = 1 bildpunkt i fotot, x = fotots x − 660, y = 900 − fotots y,
// z mot betraktaren. Disken är y = TOPP, från z = ZB till ZF.
//
// pulten(plan, { smal }) → { trumma(), satt(smal), borta() }
// figuren(duk, { hog, latt }) → { rita(T, n, tal, mun), tid: längden, armLage(), visaArm(j), borta() }
// Klipp: T 0–12,4 (vila, skrattet, domen, gesterna, hem) och T 20–24,5 (en klunk kaffe, börjar och slutar som vilan).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ATLAS, LJUS, ARM, laddaFoto, laddaHand, byggArm, byggKopp } from './rum-hasse-arm.js';

const DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const spar = (k, t) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ss(k[i - 1][0], k[i][0], t);
  return k[k.length - 1][1];
};

// ---------- handen ----------

const HUD = '#cf9f8a';
const hudM = () => new THREE.MeshStandardMaterial({ color: HUD, roughness: 0.58 });
const kavajTex = (() => {
  let t = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const id = x.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const v = 43 + (Math.random() - 0.5) * 13 + 5 * Math.sin((i + j) * 1.57);
      const o = (j * 256 + i) * 4;
      id.data[o] = v; id.data[o + 1] = v; id.data[o + 2] = v + 2; id.data[o + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
})();

// Lokalt: +y mot fingertopparna, +z ut ur handflatan; sida = +1 har tummen åt +x.
function byggHand(sida, hud) {
  const g = new THREE.Group();
  g.scale.setScalar(0.92);
  const palm = new THREE.Mesh(new RoundedBoxGeometry(108, 122, 44, 4, 19), hud);
  palm.position.y = 56;
  g.add(palm);
  const kapsel = (r, l) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 3, 10), hud); m.position.y = l / 2; return m; };
  const leder = [];
  const finger = (x, y, ls, r, rotZ) => {
    const led = [];
    let f = g;
    ls.forEach((l, i) => {
      const p = new THREE.Group();
      if (i === 0) { p.position.set(x, y, 0); p.rotation.z = rotZ; } else p.position.y = ls[i - 1];
      p.add(kapsel(r * (1 - i * 0.07), l));
      f.add(p);
      f = p;
      led.push(p);
    });
    leder.push(led);
  };
  // från tumsidan: pekfingret ligger närmast tummen
  finger(sida * 37, 114, [50, 32, 25], 13.2, -sida * 0.05);
  finger(sida * 12, 118, [55, 36, 26], 14.2, -sida * 0.01);
  finger(-sida * 13, 116, [52, 34, 26], 13.6, sida * 0.02);
  finger(-sida * 38, 108, [40, 26, 21], 12, sida * 0.07);
  const tumme = new THREE.Group();
  tumme.position.set(sida * 56, 38, 8);
  tumme.rotation.z = -sida * 0.85;
  g.add(tumme);
  tumme.add(kapsel(17, 44));
  const t2 = new THREE.Group();
  t2.position.y = 44;
  t2.add(kapsel(15, 34));
  tumme.add(t2);
  return { g, leder, tumme, t2 };
}
function bojFingrar(h, krok, peka, sida) {
  h.leder.forEach((led, i) => {
    const k = i === 0 ? krok * (1 - peka) : krok;
    led[0].rotation.x = k * 1.35 + 0.08;
    led[1].rotation.x = k * 1.5 + 0.12;
    led[2].rotation.x = k + 0.08;
  });
  h.tumme.rotation.x = krok * 0.7;
  h.t2.rotation.z = -sida * krok * 0.5;
}

// en mjuk skugga som färdig fläck: inga skuggkartor (PowerVR i telefonen)
function flack() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 8, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,.62)');
  g.addColorStop(0.55, 'rgba(0,0,0,.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// ---------- på pulten ----------

// Armen kommer in från vänster och handen ligger på pulten vid hans kaffe (rum.js):
// han står precis utanför bilden. Ritas bara när fingrarna rör sig, på en liten egen duk i
// pultens plan. Kameran som i rum-saker.js: 34° uppifrån, kring lådans mitt.
const LAGE = {
  bred: { box: { x: -40, y: 770, w: 210, h: 240 }, o: { x: 40, y: 890 }, spets: [64, 930], bas: [-130, 1062], sk: 0.74 },
  smal: { box: { x: 470, y: 590, w: 320, h: 320 }, o: { x: 640, y: 690 }, spets: [705, 672], bas: [430, 758], sk: 0.62 },
};
export function pulten(plan, { smal = false, pr = 1.5 } = {}) {
  const c = document.createElement('canvas');
  c.className = 'rum-hasse-hand';
  plan.append(c);
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: pr < 1.6, powerPreference: 'low-power' });
  r.setPixelRatio(pr);
  const s = new THREE.Scene();
  s.add(new THREE.HemisphereLight('#e8dcc4', '#3a2a20', 0.95));
  const key = new THREE.DirectionalLight('#fff0d6', 2.2);
  key.position.set(-420, 700, 300);
  s.add(key);
  const fyll = new THREE.DirectionalLight('#ff8a6a', 0.35);
  fyll.position.set(-500, 220, -320);
  s.add(fyll);
  const hud = hudM();
  const kav = new THREE.MeshStandardMaterial({ map: kavajTex(), roughness: 0.8 });
  const skj = new THREE.MeshStandardMaterial({ color: '#eceae2', roughness: 0.7 });
  const g = new THREE.Group();
  s.add(g);
  const h = byggHand(1, hud);
  // handen platt: fingrarna längs −z i g, handflatan neråt
  h.g.rotation.set(-Math.PI / 2, Math.PI, 0);
  h.g.position.set(0, 16, 208);
  g.add(h.g);
  bojFingrar(h, 0.14, 0, 1);
  const ma = new THREE.Mesh(new THREE.CylinderGeometry(50, 53, 36, 20), skj);
  ma.rotation.x = Math.PI / 2;
  ma.position.set(0, 18, 224);
  g.add(ma);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(112, 60, 760, 22), kav);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 36, 224 + 18 + 380);
  g.add(arm);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: flack(), transparent: true, depthWrite: false }));
  fl.rotation.x = -Math.PI / 2;
  fl.scale.set(300, 1300, 1);
  fl.position.set(26, 1, 620);
  g.add(fl);
  const cam = new THREE.PerspectiveCamera(30, 1, 50, 6000);
  const ray = new THREE.Raycaster();
  const golv = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function satt(sm) {
    const L = sm ? LAGE.smal : LAGE.bred;
    const B = L.box;
    Object.assign(c.style, { left: `${B.x}px`, top: `${B.y}px`, width: `${B.w}px`, height: `${B.h}px` });
    r.setSize(B.w, B.h, false);
    const D = 1400;
    const ELEV = 34 * DEG;
    const fw = 2 * Math.max(L.o.x - B.x, B.x + B.w - L.o.x);
    const fh = 2 * Math.max(L.o.y - B.y, B.y + B.h - L.o.y);
    cam.fov = 2 * Math.atan(fh / 2 / D) / DEG;
    cam.aspect = fw / fh;
    cam.position.set(0, D * Math.sin(ELEV), D * Math.cos(ELEV));
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(fw, fh, B.x - (L.o.x - fw / 2), B.y - (L.o.y - fh / 2), B.w, B.h);
    cam.updateMatrixWorld();
    const pa = ([px, py]) => {
      ray.setFromCamera(new THREE.Vector2(((px - B.x) / B.w) * 2 - 1, 1 - ((py - B.y) / B.h) * 2), cam);
      return ray.ray.intersectPlane(golv, new THREE.Vector3());
    };
    const sp = pa(L.spets);
    const dir = sp.clone().sub(pa(L.bas)).setY(0).normalize();
    g.position.set(sp.x, 0, sp.z);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    g.scale.setScalar(L.sk);
    r.render(s, cam);
  }
  satt(smal);
  // Fingrarna trummar: från lillfingret till pekfingret, två varv.
  let raf = 0;
  function trumma() {
    if (raf) return;
    const t0 = performance.now();
    const steg = (ms) => {
      const t = (ms - t0) / 1000;
      if (t > 0.86) {
        bojFingrar(h, 0.14, 0, 1);
        r.render(s, cam);
        raf = 0;
        return;
      }
      h.leder.forEach((led, i) => {
        // var finger lyfter och faller i sin tur
        const f = ((t * 3.2) % 1) * 4 - (3 - i);
        const lyft = f > 0 && f < 1 ? Math.sin(f * Math.PI) : 0;
        led[0].rotation.x = 0.14 * 1.35 + 0.08 - lyft * 0.42;
        led[1].rotation.x = 0.14 * 1.5 + 0.12 + lyft * 0.1;
      });
      r.render(s, cam);
      raf = requestAnimationFrame(steg);
    };
    raf = requestAnimationFrame(steg);
  }
  return {
    trumma,
    satt,
    kval: 0,
    borta() { cancelAnimationFrame(raf); r.dispose(); r.forceContextLoss(); c.remove(); },
  };
}

// ---------- figuren ----------

const TOPP = -413;
const ZB = 240;
const ZF = 690;
const D = 3900;
// fotot: urklippt, armarna borta, ljuset anpassat (bakat ur originalet)
const X0 = 280;
const Y0 = 130;
const TW = 860;
const TH = 1350;
export const SCEN = {
  bred: { W: 1440, H: 900, S: 0.54, px: 530, py: 244.7, duk: { x: 0, y: 0, w: 1150, h: 860 } },
  hog: { W: 900, H: 1500, S: 0.56, px: 450, py: 199, duk: { x: 0, y: 0, w: 900, h: 860 } },
};
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
  const L = hog ? SCEN.hog : SCEN.bred;
  const r = new THREE.WebGLRenderer({ canvas: duk, alpha: true, antialias: !latt, powerPreference: latt ? 'default' : 'high-performance' });
  r.setPixelRatio(pr);
  r.setSize(L.duk.w, L.duk.h, false);
  r.setClearColor(0, 0);
  const S = new THREE.Scene();
  const C = new THREE.PerspectiveCamera(2 * Math.atan((L.H / L.S / 2) / D) / DEG, L.W / L.H, 200, 6000);
  C.position.set(0, 500, D);
  C.lookAt(0, 500, 0);
  C.setViewOffset(L.W, L.H, L.W / 2 - L.px + L.duk.x, L.H / 2 - L.py + L.duk.y, L.duk.w, L.duk.h);
  const [foto, handModell] = await Promise.all([laddaFoto(), laddaHand()]);
  // ytan: tätare kring huvudet
  const nx = latt ? 88 : 128;
  const Xs = Array.from({ length: nx }, (_, i) => X0 + (i / (nx - 1)) * TW);
  const Ys = [];
  for (let y = Y0; y < 720; y += latt ? 8 : 5.2) Ys.push(y);
  for (let y = 720; y <= Y0 + TH; y += latt ? 26 : 17) Ys.push(y);
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
  };
  const yta = new THREE.Mesh(G, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
    vertexShader: `attribute float aW; attribute vec2 aAx; uniform mat3 uHuvud; uniform vec3 uPiv; uniform mat4 uKropp; uniform vec2 uAx; uniform float uAndas; uniform vec3 uArm[6];
    varying vec2 vQ; varying vec3 vN, vN0; varying float vAo;
    float seg3(vec3 p, vec3 a, vec3 b) { vec3 ab = b - a; return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.)); }
    void main(){ vec3 p = position; vec3 n = normal; vN0 = n; vQ = uv;
      p.y += aAx.x * uAx.x + aAx.y * uAx.y; p.x += aAx.x * -uAx.x * .25 + aAx.y * uAx.y * .25;
      float bar = (1. - aW) * smoothstep(620., 300., abs(p.y + 100.));
      p.z += uAndas * bar; p.y += uAndas * .5 * bar;
      vec3 h = uPiv + uHuvud * (p - uPiv); p = mix(p, h, aW);
      n = normalize(mix(n, uHuvud * n, aW));
      vec4 w = uKropp * vec4(p, 1.); vN = mat3(uKropp) * n;
      // armarna skuggar kroppen
      float dA = min(seg3(w.xyz, uArm[0], uArm[1]), seg3(w.xyz, uArm[1], uArm[2]));
      float dB = min(seg3(w.xyz, uArm[3], uArm[4]), seg3(w.xyz, uArm[4], uArm[5]));
      vAo = exp(-pow(max(0., dA - 80.) / 80., 2.)) * .3 + exp(-pow(max(0., dB - 80.) / 80., 2.)) * .3;
      gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform sampler2D foto; uniform float blund, kis, munn, rund, le; uniform vec2 bryn, blick; varying vec2 vQ; varying vec3 vN, vN0; varying float vAo;
    ${LJUS}
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
  const A = byggArm(S, 1, foto, handModell, 0.86);
  const B = byggArm(S, -1, foto, handModell);
  const dolj2 = new THREE.Mesh(new THREE.BoxGeometry(3400, 600, ZF - ZB), new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true }));
  dolj2.position.set(0, TOPP - 300, (ZF + ZB) / 2);
  dolj2.renderOrder = 2;
  // speglingarna har skrivit djup under disken: börja om även här
  dolj2.onBeforeRender = (re) => re.clearDepth();
  S.add(dolj2);
  // disken: bara djup, så att den döljer det som är bakom (väggen och disken är bilden)
  const dolj = new THREE.Mesh(new THREE.BoxGeometry(3400, 600, ZF - ZB), new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true }));
  dolj.position.set(0, TOPP - 300, (ZF + ZB) / 2);
  dolj.renderOrder = 0;
  S.add(dolj);
  const KOPP = hog ? [300, TOPP, 470] : [372, TOPP, 470];
  const K = byggKopp();
  const kopp = K.kopp;
  kopp.position.set(KOPP[0], TOPP + 11, KOPP[2]);
  kopp.rotation.y = -0.5;
  K.fat.position.set(KOPP[0], TOPP + 0.5, KOPP[2]);
  S.add(kopp, K.fat, K.spegel, K.spFat);
  // skuggorna på disken: kapslar som faller nedåt och åt höger, ingen skuggkarta
  const NK = 6;
  const kapA = Array.from({ length: NK }, () => new THREE.Vector4());
  const kapH = Array.from({ length: NK }, () => new THREE.Vector2());
  const skugga = new THREE.Mesh(new THREE.PlaneGeometry(3400, ZF - ZB), new THREE.ShaderMaterial({
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
  skugga.rotation.x = -Math.PI / 2;
  skugga.position.set(0, TOPP, (ZB + ZF) / 2);
  skugga.renderOrder = 1.2;
  skugga.frustumCulled = false;
  S.add(skugga);
  let armSyns = true;
  // ---------- rörelserna ----------
  const SA = W_(424, 800, -52);
  const SB = W_(987, 800, 8);
  const LA = ARM.LA;
  const LB = ARM.LB;
  // handen på disken: så står han när man kommer, med samma hand som syns på pulten
  const DISK = [[-120, TOPP + 74, 430], [-0.95, -0.42, -0.1], [0.62, -0.1, 0.78], [0.12, -0.99, -0.05], 0.08, 0];
  // [t, handled, armbågens riktning, fingrarna, handflatan, krok, peka]
  const VA = [
    [0, ...DISK], [2.5, ...DISK],
    // gapskrattet: båda armarna upp framför kroppen
    [3.0, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.35, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.78, P_(270, 680, 340), [-0.8, -0.6, 0.2], [-0.05, 0.95, 0.3], [0.9, 0, 0.3], 0.06, 0],
    [5.0, ...DISK], [5.5, ...DISK],
    // pekfingret: så är det bara
    [5.95, P_(310, 640, 390), [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
    [6.8, P_(310, 640, 390), [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
    // karateslaget
    [7.1, P_(300, 690, 400), [-0.8, -0.75, 0.15], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    [8.15, P_(300, 690, 400), [-0.8, -0.75, 0.15], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    // armen ut åt sidan, inom bilden (i telefonen är bilden smalare)
    [8.7, P_(hog ? 210 : 70, 790, 330), [-0.7, -0.75, 0.1], [-0.72, 0.6, 0.25], [0.12, -0.25, 1], 0.1, 0],
    [9.25, P_(hog ? 235 : 95, 830, 320), [-0.7, -0.75, 0.1], [-0.76, 0.5, 0.3], [0.12, -0.25, 1], 0.1, 0],
    [9.95, ...DISK], [12.4, ...DISK],
  ];
  // handen i fickan: precis som armen ligger i fotot
  const FICKA = [P_(905, 1672, 8), [1, 0.05, 0], [-0.3, -0.95, 0], [0.7, 0, 0.7], 0.45, 0];
  const VB = [
    [0, ...FICKA], [2.55, ...FICKA],
    [3.0, P_(1110, 505, 310), [0.6, -0.5, 0.65], [0.12, 0.97, 0.12], [-0.12, -0.06, 1], 0.1, 0],
    [4.2, P_(1110, 505, 310), [0.6, -0.5, 0.65], [0.12, 0.97, 0.12], [-0.12, -0.06, 1], 0.1, 0],
    [4.72, ...FICKA], [12.4, ...FICKA],
    [20, ...FICKA],
  ];
  // Klunken (T 20–24,5), börjar och slutar som vilan. Koppen går sin väg, handen följer örat.
  const KV = [[20, 0, 0, 0, 0, 0], [21.1, 0, 0, 0, 0, 0], [21.95, -405, 725, -160, -0.5, 0], [23.25, -412, 735, -168, -0.72, 0.02], [24.05, 0, 0, 0, 0, 0], [24.5, 0, 0, 0, 0, 0]];
  const klunkOm = (t) => { const f = ss(21.1, 21.3, t) * (1 - ss(23.95, 24.15, t)); return f; };
  function klunkKopp(t, ut) {
    const y = (i) => spar(KV.map((k) => [k[0], k[i]]), t);
    ut.set(y(1), y(2), y(3));
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
    const len = Math.min(d_.length(), LA + LB - 4);
    dir_.copy(d_).normalize();
    const a = (LA * LA - LB * LB + len * len) / (2 * len);
    const h = Math.sqrt(Math.max(0, LA * LA - a * a));
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
  const kb = v();
  const kk = v();
  const kh = v();
  const klunkMjuk = (t) => 1 - ss(20, 20.5, t) * (1 - ss(24.1, 24.5, t));
  const FK = v().set(-0.7, 0.28, 0.66).normalize();
  const PK = v().set(-0.3, -0.8, -0.1).normalize();
  // handen vid örat: fingrarna runt det, armbågen nedåt och utåt
  function klunkArm(t, b) {
    klunkKopp(t, kk);
    kopp.position.set(KOPP[0] + kk.x, TOPP + 11 + kk.y, KOPP[2] + kk.z);
    const lyft = kk.y / 725;
    kopp.rotation.set(kk.y > 0 ? spar(KV.map((k) => [k[0], k[4]]), t) : 0, -0.5 + lyft * 0.62, -0.22 * lyft);
    kopp.updateMatrix();
    kh.copy(K.ORA).applyMatrix4(kopp.matrix);
    // på väg dit, och kvar medan han håller
    const mot = ss(20.1, 21.05, t) * (1 - ss(24.1, 24.5, t));
    const W = kh.addScaledVector(FK, -176);
    FICKA_W.fromArray(FICKA[0]);
    FICKA_W.lerp(W, mot);
    b.w.copy(FICKA_W);
    FICKA_W.fromArray(FICKA[1]);
    b.pol.copy(FICKA_W).lerp(POLK, mot);
    FICKA_W.fromArray(FICKA[2]);
    b.F.copy(FICKA_W).lerp(FK, mot);
    FICKA_W.fromArray(FICKA[3]);
    b.P.copy(FICKA_W).lerp(PK, mot);
    b.krok = 0.45 + (spar([[20, 0.1], [21, 0.18], [21.2, 0.6], [24, 0.6], [24.2, 0.18], [24.5, 0.45]], t) - 0.45) * mot;
    b.peka = 0;
  }
  const FICKA_W = v();
  const POLK = v().set(0.5, -0.82, 0.2);
  let sistaT = 0;
  let sistaN = 0;
  let sistaTal = 0;
  let sistaMun = null;
  // T: var i rörelserna (0–2,5 vilan, 2,5–5,5 fram till domen, 5,5–9,95 gesterna
  // medan han pratar, hemåt till 12,4), n: klockan för det som alltid rör sig,
  // tal: 1 medan han pratar med handen på disken, mun: hur mycket munnen rör sig
  // (annars följer den tal och gesterna)
  function rita(T, n, tal = 0, mun = null) {
    const t = T;
    sistaT = T; sistaN = n; sistaTal = tal; sistaMun = mun;
    const skratt = ss(2.75, 3.05, t) * (1 - ss(4.25, 4.6, t));
    const talar = Math.max(tal, ss(5.55, 5.7, t) * (1 - ss(9.4, 9.6, t)));
    const dricker = ss(21.2, 21.85, t) * (1 - ss(23.2, 23.9, t));
    const yaw = 0.22 * (spar([[0, -0.3], [2.5, -0.3], [3.0, 0.15], [4.5, 0.1], [5.0, 0], [8.2, 0], [8.7, -0.8], [9.3, -0.65], [9.95, 0], [10.6, 0.25], [11.6, 0.25], [12.4, -0.3]], t) + 0.1 * Math.sin(n * 0.8) + talar * 0.28 * Math.sin(n * 2.7 + 1));
    const pitch = 0.17 * (spar([[0, -0.45], [2.5, -0.45], [3.0, -1.2], [4.4, -1.1], [4.8, -0.55], [5.0, 0.95], [5.2, 0.05], [8.2, 0.05], [9.95, 0.05], [10.6, -0.6], [11.6, -0.6], [12.4, -0.45]], t) + talar * 0.3 * Math.sin(n * 6.1) + skratt * 0.16 * Math.sin(n * 15) - dricker * 1.15);
    const roll = -(spar([[0, -0.08], [2.5, -0.08], [3.0, 0.09], [4.4, 0.07], [5.0, 0], [8.2, 0], [8.7, -0.06], [9.3, -0.05], [9.95, 0], [10.6, 0.05], [11.6, 0.05], [12.4, -0.08]], t) + talar * 0.03 * Math.sin(n * 3.3));
    eu.set(pitch, yaw, roll, 'YXZ');
    mh.makeRotationFromEuler(eu);
    U.uHuvud.value.setFromMatrix4(mh);
    const lut = spar([[0, 0.05], [2.5, 0.05], [3.0, -0.03], [4.72, -0.04], [5.0, 0.09], [5.5, 0.06], [8.2, 0.05], [9.95, 0.06], [12.4, 0.05]], t);
    const vrid = spar([[0, -0.09], [2.5, -0.09], [3, 0], [4.72, 0.05], [5.0, -0.1], [5.5, -0.08], [8.2, -0.03], [8.7, -0.17], [9.3, -0.14], [9.95, -0.08], [12.4, -0.09]], t) + talar * 0.015 * Math.sin(n * 2.1);
    const sid = spar([[0, -0.008], [2.5, -0.008], [3, -0.006], [4.72, 0.015], [5, -0.012], [8.7, 0.015], [9.95, -0.012], [12.4, -0.008]], t) + 0.003 * Math.sin(n * 0.55);
    eu.set(lut, vrid, sid, 'YXZ');
    mr.makeRotationFromEuler(eu);
    mk.copy(mr);
    h1.copy(HOFT).applyMatrix4(mr);
    mk.setPosition(HOFT.x - h1.x, HOFT.y - h1.y, HOFT.z - h1.z);
    U.uKropp.value.copy(mk);
    const axV = spar([[0, -8], [2.5, -8], [3.0, 42], [4.35, 42], [4.78, 26], [5.0, -8], [5.5, -8], [5.95, 18], [8.15, 18], [8.7, 26], [9.95, -8], [12.4, -8]], t) + skratt * 5 * Math.sin(n * 15);
    const axH = spar([[0, 0], [2.55, 0], [3.0, 42], [4.2, 42], [4.72, 0], [12.4, 0]], t) + skratt * 5 * Math.sin(n * 15);
    U.uAx.value.set(axV, axH);
    U.uAndas.value = 7 * Math.sin(n * 1.5) + skratt * 5 * Math.sin(n * 15);
    const lyft = talar * 0.38 * Math.max(0, Math.sin(n * 4.3));
    U.bryn.value.set(spar([[0, 0], [2.5, 0], [3.0, 0.5], [4.4, 0.5], [5.0, 1], [5.6, 0.4], [9.4, 0.3], [9.95, 0.4], [10.6, 0.15], [11.6, 0.15], [12.4, 0]], t) + lyft, spar([[0, 1.1], [2.5, 1.1], [3.0, 0.6], [4.4, 0.6], [5.0, 1], [5.6, 0.5], [9.4, 0.4], [9.95, 0.5], [10.6, 1.05], [11.6, 1.05], [12.4, 1.1]], t) + lyft);
    U.le.value = Math.max(0.14 * (1 - ss(2.5, 2.8, t)), skratt, 0.3 * ss(8.3, 8.8, t) * (1 - ss(9.4, 9.8, t)), 0.6 * ss(10, 10.5, t) * (1 - ss(11.6, 12.4, t)), 0.14 * ss(11.6, 12.4, t), 0.34 * ss(23.7, 24.1, t) * (1 - ss(24.3, 24.5, t)));
    // talet: stavelser med små pauser, ibland rundare läppar
    const stav = Math.abs(Math.sin(n * 7.3)) * (0.42 + 0.58 * ss(-0.35, 0.5, Math.sin(n * 2.3 + 0.7))) * (0.72 + 0.28 * Math.sin(n * 17.3));
    const talMun = (mun === null ? talar : mun) * (1 - dricker);
    U.munn.value = Math.max(talMun * stav * 0.62, skratt * (0.92 + 0.14 * Math.sin(n * 14)), ss(4.9, 5.0, t) * (1 - ss(5.0, 5.25, t)) * 0.72);
    U.rund.value = talMun * Math.max(0, Math.sin(n * 3.1 + 1.3)) * 0.8;
    U.kis.value = Math.max(skratt * 0.75, U.le.value * 0.45);
    // blinkningarna: en gång i några sekunder, klockan avgör
    const fas = (n % 4.3);
    const bl = 1 - clamp(Math.abs(fas - 0.3) / 0.085);
    U.rund.value = Math.max(U.rund.value, dricker * 0.7);
    U.blund.value = Math.max(dricker * 0.82, skratt * 0.42, bl, ss(10.7, 10.9, t) * (1 - ss(11.25, 11.45, t)));
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
    A.satt(sa, E_, Wr_, a.F, a.P, a.krok, a.peka, isar, 0.45);
    U.uArm.value[0].copy(sa); U.uArm.value[1].copy(E_); U.uArm.value[2].copy(Wr_);
    // den andra armen följer kroppen: i vila ligger den som i fotot
    if (!iKlunk) b.w.applyMatrix4(mk);
    else { kb.copy(b.w).applyMatrix4(mk); b.w.lerp(kb, klunkMjuk(t)); }
    ik(sb, b.w, b.pol, E_, Wr_);
    B.satt(sb, E_, Wr_, b.F, b.P, b.krok, b.peka, isar * 0.8, 0.45);
    U.uArm.value[3].copy(sb); U.uArm.value[4].copy(E_); U.uArm.value[5].copy(Wr_);
    const hopp = t > 5 && t < 5.55 ? Math.sin(((t - 5) / 0.55) * Math.PI) * 62 * (1 - (t - 5) / 0.9) : 0;
    if (!iKlunk) { kopp.position.set(KOPP[0], TOPP + 11 + hopp, KOPP[2]); kopp.rotation.set(0, -0.5, hopp * 0.0045); }
    K.satt();
    // skuggorna: hand och underarm för båda armarna, och koppen
    const skk = (i, a, b, rd, h) => { kapA[i].set(a.x, a.z, b.x, b.z); kapH[i].set(rd, Math.max(0, h)); };
    const ah = (o) => o.y - TOPP;
    const LA_ = A.lage;
    const LB_ = B.lage;
    FA.copy(LA_.W).addScaledVector(LA_.F, 200);
    skk(0, LA_.W, FA, armSyns ? 52 : 0, ah(LA_.W) - 20);
    skk(1, LA_.E, LA_.W, armSyns ? 64 : 0, (ah(LA_.E) + ah(LA_.W)) / 2);
    FA.copy(LB_.W).addScaledVector(LB_.F, 200);
    skk(2, LB_.W, FA, 52, ah(LB_.W) - 20);
    skk(3, LB_.E, LB_.W, 64, (ah(LB_.E) + ah(LB_.W)) / 2);
    skk(4, kopp.position, kopp.position, 60, ah(kopp.position));
    skk(5, K.fat.position, K.fat.position, 96, 1);
    r.render(S, C);
  }
  rita(0, 0);
  return {
    rita,
    tid: 12.4,
    info: () => ({ trianglar: r.info.render.triangles, ritanrop: r.info.render.calls, texturer: r.info.memory.textures }),
    ctx: r.getContext(),
    // armen på disken, för svängen (rum-hasse.js): var den står, och att den kan lämnas åt någon annan
    armLage: () => A.lage,
    visaArm(j) { armSyns = j; A.del(j ? 'allt' : 'over'); rita(sistaT, sistaN, sistaTal, sistaMun); },
    borta() {
      G.dispose();
      K.borta();
      A.borta();
      B.borta();
      r.dispose();
      r.forceContextLoss();
    },
  };
}
