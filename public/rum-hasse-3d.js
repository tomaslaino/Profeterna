// Hasse Backe i tobaksaffären (rum-hasse.js), i three.js: armen på pulten och
// figuren bakom disken. Kostymfotot (C More Entertainment, CC BY 3.0,
// Wikimedia Commons) ligger på en formad yta, så att huvudet vrids på riktigt
// runt nacken och kroppen lutar sig fram. Armarna är inte fotot utan tjocka
// kavajärmar med armbågar och veck, och händerna är modellerade.
//
// Grafiken: inga skuggkartor och ingen ny bild i rummet. Handen ritas bara
// när fingrarna trummar. Figuren finns bara medan man tittar på honom, och då
// står gänget och sakerna still och ritas inte (Rum.vila). Väggen och hyllorna
// bakom honom är en färdig bild.
//
// Världen: 1 enhet = 1 bildpunkt i fotot, x = fotots x − 660, y = 900 − fotots y,
// z mot betraktaren. Disken är y = TOPP, från z = ZB till ZF.
//
// pulten(plan, { smal }) → { trumma(), satt(smal), borta() }
// figuren(duk, { hog, latt }) → { rita(T, n, tal, mun), tid: längden, borta() }
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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

// Hans kopp som den på pulten (rum.js): vit med blå ränder, på ett fat.
function byggKopp() {
  const kopp = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#efe9db';
  x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#3f5f9e';
  x.fillRect(0, 14, 256, 12);
  x.fillRect(0, 34, 256, 5);
  x.fillRect(0, 96, 256, 5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.34 });
  const kropp = new THREE.Mesh(new THREE.CylinderGeometry(44, 32, 80, 24), [m, new THREE.MeshStandardMaterial({ color: '#efe9db', roughness: 0.34 }), new THREE.MeshStandardMaterial({ color: '#efe9db', roughness: 0.34 })]);
  kropp.position.y = 46;
  kopp.add(kropp);
  const yta = new THREE.Mesh(new THREE.CircleGeometry(40, 24), new THREE.MeshStandardMaterial({ color: '#180c05', roughness: 0.18 }));
  yta.rotation.x = -Math.PI / 2;
  yta.position.y = 80;
  kopp.add(yta);
  const ora = new THREE.Mesh(new THREE.TorusGeometry(19, 6, 8, 16), kropp.material[1]);
  ora.position.set(46, 50, 0);
  kopp.add(ora);
  return kopp;
}
function byggFat() {
  const f = new THREE.Mesh(new THREE.CylinderGeometry(78, 58, 9, 28), new THREE.MeshStandardMaterial({ color: '#e6dfd1', roughness: 0.3 }));
  f.position.y = 5;
  return f;
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
const RINGAR = 30;
const SEG = 18;
function radie(s) {
  const T = [[0, 84], [0.14, 88], [0.3, 86], [0.5, 76], [0.58, 78], [0.82, 66], [1, 56]];
  for (let i = 1; i < T.length; i++) if (s <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (s - T[i - 1][0]) / (T[i][0] - T[i - 1][0]);
  return 56;
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
  // fotot
  const bild = new Image();
  bild.src = 'rum/hasse-foto.webp';
  await bild.decode();
  const foto = new THREE.Texture(bild);
  foto.premultiplyAlpha = true;
  foto.generateMipmaps = false;
  foto.minFilter = THREE.LinearFilter;
  foto.colorSpace = THREE.NoColorSpace;
  foto.needsUpdate = true;
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
    uvs[o * 2] = (x - X0) / TW;
    uvs[o * 2 + 1] = 1 - (y - Y0) / TH;
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
    blund: { value: 0 }, munn: { value: 0 }, le: { value: 0 }, bryn: { value: new THREE.Vector2() }, blick: { value: new THREE.Vector2() },
  };
  const yta = new THREE.Mesh(G, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
    vertexShader: `attribute float aW; attribute vec2 aAx; uniform mat3 uHuvud; uniform vec3 uPiv; uniform mat4 uKropp; uniform vec2 uAx; uniform float uAndas;
    varying vec2 vUv; varying vec3 vN, vN0;
    void main(){ vec3 p = position; vec3 n = normal; vN0 = n;
      p.y += aAx.x * uAx.x + aAx.y * uAx.y; p.x += aAx.x * -uAx.x * .25 + aAx.y * uAx.y * .25;
      float bar = (1. - aW) * smoothstep(620., 300., abs(p.y + 100.));
      p.z += uAndas * bar; p.y += uAndas * .5 * bar;
      vec3 h = uPiv + uHuvud * (p - uPiv); p = mix(p, h, aW);
      n = normalize(mix(n, uHuvud * n, aW));
      vec4 w = uKropp * vec4(p, 1.); vN = mat3(uKropp) * n; vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform sampler2D foto; uniform float blund, munn, le; uniform vec2 bryn, blick; varying vec2 vUv; varying vec3 vN, vN0;
    const vec2 OV = vec2(608., 391.), OH = vec2(716., 392.), BV = vec2(599., 364.), BH = vec2(727., 367.), MUN = vec2(662., 508.);
    const vec2 O0 = vec2(${X0}., ${Y0}.), TS = vec2(${TW}., ${TH}.);
    float g(vec2 p, vec2 c, float r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
    void main(){
      vec2 q = vec2(vUv.x, 1. - vUv.y) * TS + O0;
      q += le * vec2(7., 9.) * g(q, vec2(613., 505.), 40.);
      q += le * vec2(-7., 9.) * g(q, vec2(711., 505.), 40.);
      q.y += le * 7. * (g(q, vec2(585., 455.), 42.) + g(q, vec2(740., 455.), 42.));
      vec2 e = (q - BV) / vec2(62., 30.); q.y += bryn.x * 14. * exp(-dot(e, e));
      e = (q - BH) / vec2(62., 30.); q.y += bryn.y * 14. * exp(-dot(e, e));
      vec2 ev = (q - OV) / vec2(31., 11.), eh = (q - OH) / vec2(31., 11.);
      float mo = max(1. - smoothstep(.65, 1.5, length(ev)), 1. - smoothstep(.65, 1.5, length(eh)));
      q -= blick * mo * (1. - blund);
      q.y -= blund * mo * 21.;
      float kw = smoothstep(MUN.y - 3., MUN.y + 8., q.y) * (1. - smoothstep(.85, 1.2, length((q - vec2(660., 548.)) / vec2(120., 66.))));
      float bred = 42. + le * 13.;
      float gap = exp(-pow((q.y - MUN.y - munn * 7.) / (.8 + munn * 7.), 2.)) * (1. - smoothstep(bred - 7., bred + 7., abs(q.x - MUN.x))) * min(1., munn * 3.);
      float tand = gap * smoothstep(MUN.y + munn * 8., MUN.y + munn * 1.5, q.y);
      q.y -= munn * 15. * kw;
      vec2 s = (q - O0) / TS;
      vec4 c = texture2D(foto, vec2(s.x, 1. - s.y));
      if (c.a < .35) discard;
      c.rgb = mix(c.rgb, vec3(.15, .05, .04) * c.a, gap * .92);
      c.rgb = mix(c.rgb, vec3(.84, .80, .72) * c.a, tand * .75);
      c.rgb *= 1. - blund * mo * .10;
      vec3 L = normalize(vec3(-.25, .55, .8));
      float r0 = max(.3, .42 + .58 * dot(normalize(vN0), L)), r1 = max(.3, .42 + .58 * dot(normalize(vN), L));
      c.rgb *= mix(1., r1 / r0, .55);
      gl_FragColor = c; }`,
  }));
  yta.frustumCulled = false;
  S.add(yta);
  // armarna
  const kavaj = new THREE.MeshStandardMaterial({ map: kavajTex(), roughness: 0.78 });
  const skjorta = new THREE.MeshStandardMaterial({ color: '#eceae2', roughness: 0.7, side: THREE.DoubleSide });
  const hud = hudM();
  const Y_AX = new THREE.Vector3(0, 1, 0);
  const u1 = new THREE.Vector3();
  const u2 = new THREE.Vector3();
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const T_ = new THREE.Vector3();
  const N_ = new THREE.Vector3();
  const B_ = new THREE.Vector3();
  function byggArm(sida) {
    const n = RINGAR * (SEG + 1);
    const g = new THREE.BufferGeometry();
    const u = new Float32Array(n * 2);
    const ix = [];
    for (let i = 0; i < RINGAR; i++) for (let j = 0; j <= SEG; j++) {
      u[(i * (SEG + 1) + j) * 2] = (j / SEG) * 5;
      u[(i * (SEG + 1) + j) * 2 + 1] = (i / (RINGAR - 1)) * 12;
      if (i < RINGAR - 1 && j < SEG) { const a = i * (SEG + 1) + j; ix.push(a, a + 1, a + SEG + 1, a + 1, a + SEG + 2, a + SEG + 1); }
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(u, 2));
    g.setIndex(ix);
    const arm = new THREE.Mesh(g, kavaj);
    arm.frustumCulled = false;
    const axel = new THREE.Mesh(new THREE.SphereGeometry(84, 18, 12), kavaj);
    const man = new THREE.Mesh(new THREE.CylinderGeometry(45, 47, 30, 16, 1, true), skjorta);
    const hand = byggHand(sida, hud);
    S.add(arm, axel, man, hand.g);
    return { sida, hand, axel, man, g };
  }
  function arm(A, Sk, E, Wr) {
    A.axel.position.copy(Sk);
    u1.subVectors(E, Sk);
    const L1 = u1.length();
    u1.normalize();
    u2.subVectors(Wr, E);
    const L2 = u2.length();
    u2.normalize();
    const rr = Math.min(70, L1 * 0.4, L2 * 0.4);
    const bojd = Math.acos(clamp(u1.dot(u2), -1, 1));
    pA.copy(E).addScaledVector(u1, -rr);
    pB.copy(E).addScaledVector(u2, rr);
    const b = 2 * rr * Math.cos(bojd / 2) * (1 + 0.1 * bojd);
    const tot = (L1 - rr) + b + (L2 - rr);
    const dE = (L1 - rr) + b / 2;
    N_.set(0, 0, 1);
    const P = A.g.attributes.position.array;
    let o = 0;
    for (let i = 0; i < RINGAR; i++) {
      const s = i / (RINGAR - 1);
      const dist = s * tot;
      if (dist < L1 - rr) { pC.copy(Sk).addScaledVector(u1, dist); T_.copy(u1); } else if (dist < L1 - rr + b) {
        const f = (dist - (L1 - rr)) / b;
        const f1 = 1 - f;
        pC.set(0, 0, 0).addScaledVector(pA, f1 * f1).addScaledVector(E, 2 * f1 * f).addScaledVector(pB, f * f);
        T_.copy(u1).multiplyScalar(f1).addScaledVector(u2, f).normalize();
      } else { pC.copy(pB).addScaledVector(u2, dist - (L1 - rr) - b); T_.copy(u2); }
      N_.addScaledVector(T_, -N_.dot(T_));
      if (N_.lengthSq() < 1e-4) N_.set(1, 0, 0).addScaledVector(T_, -T_.x);
      N_.normalize();
      B_.crossVectors(T_, N_);
      const r0 = radie(s);
      const ve = Math.exp(-(((dist - dE) / 150) ** 2));
      for (let j = 0; j <= SEG; j++) {
        const th = ((j % SEG) / SEG) * 6.2832;
        const rd = r0 * (1 + (0.012 + 0.06 * bojd * ve) * Math.sin(dist * 0.07 + th * 2 + A.sida) + 0.015 * Math.sin(dist * 0.021 + th * 3));
        const c = Math.cos(th) * rd * 0.96;
        const si = Math.sin(th) * rd;
        P[o++] = pC.x + N_.x * c + B_.x * si;
        P[o++] = pC.y + N_.y * c + B_.y * si;
        P[o++] = pC.z + N_.z * c + B_.z * si;
      }
    }
    A.g.attributes.position.needsUpdate = true;
    A.g.computeVertexNormals();
    A.man.position.copy(Wr).addScaledVector(u2, 8);
    A.man.quaternion.setFromUnitVectors(Y_AX, u2);
  }
  const A = byggArm(1);
  const B = byggArm(-1);
  // disken: bara djup, så att den döljer det som är bakom (väggen och disken är bilden)
  const dolj = new THREE.Mesh(new THREE.BoxGeometry(3400, 600, ZF - ZB), new THREE.MeshBasicMaterial({ colorWrite: false }));
  dolj.position.set(0, TOPP - 300, (ZF + ZB) / 2);
  dolj.renderOrder = -1;
  S.add(dolj);
  const kopp = byggKopp();
  kopp.position.set(hog ? 300 : 372, TOPP + 8, 470);
  kopp.rotation.y = -0.5;
  S.add(kopp);
  const fat = byggFat();
  fat.position.set(kopp.position.x, TOPP, 470);
  S.add(fat);
  const fm = flack();
  const sk = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fm, transparent: true, depthWrite: false }));
  sk.rotation.x = -Math.PI / 2;
  sk.scale.set(260, 150, 1);
  sk.position.set(kopp.position.x + 12, TOPP + 1, 462);
  S.add(sk);
  const hs = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fm, transparent: true, depthWrite: false }));
  hs.rotation.x = -Math.PI / 2;
  hs.scale.set(300, 300, 1);
  S.add(hs);
  S.add(new THREE.HemisphereLight('#fff0d8', '#3a2818', 1.15));
  const sol = new THREE.DirectionalLight('#fff1da', 2.4);
  sol.position.set(-340, 1300, 1600);
  S.add(sol);
  const rand = new THREE.DirectionalLight('#ffbf8a', 0.8);
  rand.position.set(1200, 500, 300);
  S.add(rand);
  // ---------- rörelserna ----------
  const SA = W_(432, 800, -52);
  const SB = W_(985, 805, 8);
  const LA = 470;
  const LB = 410;
  // handen på disken: så står han när man kommer, med samma hand som syns på pulten
  const DISK = [[-100, TOPP + 26, 450], [-0.9, -0.3, -0.4], [0.35, -0.03, 0.93], [0.02, -1, 0], 0.12, 0];
  // [t, handled, armbågens riktning, fingrarna, handflatan, krok, peka]
  const VA = [
    [0, ...DISK], [2.5, ...DISK],
    [3.0, P_(120, 300, 300), [-1, -0.75, 0.05], [-0.28, 0.92, 0.2], [0.1, -0.1, 1], 0.12, 0],
    [4.35, P_(120, 300, 300), [-1, -0.75, 0.05], [-0.28, 0.92, 0.2], [0.1, -0.1, 1], 0.12, 0],
    [4.78, P_(270, 480, 330), [-1, -0.7, -0.1], [-0.1, 0.95, 0.3], [0.9, 0, 0.3], 0.06, 0],
    [5.0, ...DISK], [5.5, ...DISK],
    [5.95, P_(270, 690, 380), [-1, -0.8, -0.2], [0.25, 0.85, 0.45], [0.9, -0.1, -0.2], 0.62, 1],
    [6.8, P_(270, 690, 380), [-1, -0.8, -0.2], [0.25, 0.85, 0.45], [0.9, -0.1, -0.2], 0.62, 1],
    [7.1, P_(250, 720, 390), [-1, -0.8, -0.2], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    [8.15, P_(250, 720, 390), [-1, -0.8, -0.2], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    [8.7, P_(-110, 700, 340), [-1, -0.6, -0.3], [-0.96, 0.15, 0.2], [0.05, -0.2, 1], 0.1, 0],
    [9.25, P_(-70, 760, 330), [-1, -0.6, -0.3], [-0.95, 0.05, 0.25], [0.05, -0.2, 1], 0.1, 0],
    [9.95, ...DISK], [12.4, ...DISK],
  ];
  const FICKA = [P_(905, 1590, 190), [1, -0.08, -0.5], [-0.2, -1, 0.1], [-0.7, 0, -0.7], 0.45, 0];
  const VB = [
    [0, ...FICKA], [2.55, ...FICKA],
    [3.0, P_(1190, 300, 310), [1, -0.75, 0.05], [0.28, 0.92, 0.2], [-0.1, -0.1, 1], 0.12, 0],
    [4.2, P_(1190, 300, 310), [1, -0.75, 0.05], [0.28, 0.92, 0.2], [-0.1, -0.1, 1], 0.12, 0],
    [4.72, ...FICKA], [12.4, ...FICKA],
  ];
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
  const fy = v();
  const fz = v();
  const fx = v();
  const mt = new THREE.Matrix4();
  function satt(H, Wr, F, Pn, krok, peka, sida) {
    fy.copy(F).normalize();
    fz.copy(Pn).addScaledVector(fy, -Pn.dot(fy)).normalize();
    fx.crossVectors(fy, fz);
    mt.makeBasis(fx, fy, fz);
    H.g.quaternion.setFromRotationMatrix(mt);
    H.g.position.copy(Wr).addScaledVector(fy, 14);
    bojFingrar(H, krok, peka, sida);
  }
  const eu = new THREE.Euler();
  const mh = new THREE.Matrix4();
  const mk = new THREE.Matrix4();
  const mr = new THREE.Matrix4();
  const HOFT = new THREE.Vector3(0, -413, 60);
  const h1 = v();
  const sa = v();
  const sb = v();
  // T: var i rörelserna (0–2,5 vilan, 2,5–5,5 fram till domen, 5,5–9,95 gesterna
  // medan han pratar, hemåt till 12,4), n: klockan för det som alltid rör sig,
  // tal: 1 medan han pratar med handen på disken, mun: hur mycket munnen rör sig
  // (annars följer den tal och gesterna)
  function rita(T, n, tal = 0, mun = null) {
    const t = T;
    const skratt = ss(2.75, 3.05, t) * (1 - ss(4.25, 4.6, t));
    const talar = Math.max(tal, ss(5.55, 5.7, t) * (1 - ss(9.4, 9.6, t)));
    const yaw = 0.22 * (spar([[0, -0.3], [2.5, -0.3], [3.0, 0.15], [4.5, 0.1], [5.0, 0], [8.2, 0], [8.7, -0.8], [9.3, -0.65], [9.95, 0], [10.6, 0.25], [11.6, 0.25], [12.4, -0.3]], t) + 0.1 * Math.sin(n * 0.8) + talar * 0.28 * Math.sin(n * 2.7 + 1));
    const pitch = 0.17 * (spar([[0, -0.45], [2.5, -0.45], [3.0, -1.2], [4.4, -1.1], [4.8, -0.55], [5.0, 0.95], [5.2, 0.05], [8.2, 0.05], [9.95, 0.05], [10.6, -0.6], [11.6, -0.6], [12.4, -0.45]], t) + talar * 0.3 * Math.sin(n * 6.1) + skratt * 0.16 * Math.sin(n * 15));
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
    U.le.value = Math.max(0.14 * (1 - ss(2.5, 2.8, t)), skratt, 0.3 * ss(8.3, 8.8, t) * (1 - ss(9.4, 9.8, t)), 0.6 * ss(10, 10.5, t) * (1 - ss(11.6, 12.4, t)), 0.14 * ss(11.6, 12.4, t));
    const sta = 0.8 * Math.abs(Math.sin(n * 8.7)) * (0.5 + 0.5 * Math.sin(n * 2.9 + 0.7)) * (0.72 + 0.28 * Math.sin(n * 17.3));
    U.munn.value = Math.max((mun === null ? talar : mun) * sta, skratt * (0.7 + 0.2 * Math.sin(n * 14)), ss(4.9, 5.0, t) * (1 - ss(5.0, 5.25, t)) * 0.6);
    // blinkningarna: en gång i några sekunder, klockan avgör
    const fas = (n % 4.3);
    const bl = 1 - clamp(Math.abs(fas - 0.3) / 0.085);
    U.blund.value = Math.max(skratt * 0.5, bl, ss(10.7, 10.9, t) * (1 - ss(11.25, 11.45, t)));
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
    if (t > 5.95 && t < 8.15) {
      const k = Math.sin(n * 6.6) * ss(5.95, 6.15, t) * (1 - ss(7.95, 8.15, t));
      a.w.y += k * 34;
      a.w.x += k * 10;
      a.F.z += k * 0.25;
    }
    a.w.y += skratt * 7 * Math.sin(n * 15);
    b.w.y += skratt * 7 * Math.sin(n * 15 + 1);
    ik(sa, a.w, a.pol, E_, Wr_);
    arm(A, sa, E_, Wr_);
    satt(A.hand, Wr_, a.F, a.P, a.krok, a.peka, 1);
    const hX = Wr_.x;
    const hZ = Wr_.z;
    ik(sb, b.w, b.pol, E_, Wr_);
    arm(B, sb, E_, Wr_);
    satt(B.hand, Wr_, b.F, b.P, b.krok, b.peka, -1);
    const hopp = t > 5 && t < 5.55 ? Math.sin(((t - 5) / 0.55) * Math.PI) * 62 * (1 - (t - 5) / 0.9) : 0;
    kopp.position.y = TOPP + 8 + hopp;
    kopp.rotation.z = hopp * 0.0045;
    sk.material.opacity = 1 - hopp / 90;
    const nere = Math.max(1 - ss(2.5, 2.85, t), ss(4.9, 5.0, t) * (1 - ss(5.5, 5.72, t)), ss(9.7, 9.95, t));
    hs.visible = nere > 0;
    hs.material.opacity = nere * 0.8;
    hs.position.set(hX + 50, TOPP + 1, hZ + 80);
    r.render(S, C);
  }
  rita(0, 0);
  return {
    rita,
    tid: 12.4,
    info: () => ({ trianglar: r.info.render.triangles, ritanrop: r.info.render.calls, texturer: r.info.memory.textures }),
    ctx: r.getContext(),
    borta() {
      G.dispose();
      foto.dispose();
      fm.dispose();
      r.dispose();
      r.forceContextLoss();
    },
  };
}
