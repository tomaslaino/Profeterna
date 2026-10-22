// Gänget i tobaksaffären (rum.js): DL, DT och DJ som leksaksfigurer i
// three.js. De sitter på fönsterbänken med benen hängande, dricker öl ur en
// flaska och en burk utan märken, röker (glöden och röken som stiger) och
// pratar med händerna, i lugna loopar. Huvudena nickar efter musen.
// Figurerna är tobak-a7 v2: ansiktena (rum/ansikte-*.svg, ritade av
// ansikten.py), skulpterat hår, riktiga händer, kläddetaljer och blank vinyl,
// utan sockel.
//
// Världen: x = scenens x − 800, y = 400 − scenens y, z mot betraktaren;
// 1 enhet = 1 px i fönsterbänkens plan (kameran 1400 px bort, som scenens
// perspektiv). Allt rör sig efter klockan t (sekunder): samma t ger samma bild,
// också röken, som räknas fram för varje rökbloss ur var glöden var när det
// föddes.
//
// figurer(canvas, { calm }) → { draw(t, mx, my), portrait(key) }.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const DEG = Math.PI / 180;
const D = 1400;
const SILL = -168;
const EDGE_Z = 79; // fönsterbänkens framkant
const v3 = (a) => new THREE.Vector3(...a);
const sm = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
// 0 → 1 → 0 över [a, d] med kanterna [a, b] och [c, d]
const bump = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Blank vinyl (v2): hud, tyg, hår och skor.
const P0 = {
  hud: { roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.1, envMapIntensity: 0.7 },
  tyg: { roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.18, envMapIntensity: 0.6 },
  har: { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.08, envMapIntensity: 0.8 },
  sko: { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 },
};

const CHARS = {
  dl: { skin: '#f0c3a6', skin2: '#d99a82', blush: '#e9806e', hair: '#9b7048', hair2: '#caa070', hair3: '#5e4029', tee: '#26324f', tee2: '#1a2236', pants: 'shorts', trou: '#d8ccb0', trou2: '#c2b493', sock: '#1d1d1f', shoe: '#3a3d40', sole: '#e8762c', sole2: '#f1ece2', lace: '#e9e3d6' },
  dt: { skin: '#ecbc9c', skin2: '#d0957a', blush: '#e27e66', hair: '#7f5a40', hair2: '#b08a66', hair3: '#4e3424', tee: '#a9a98a', tee2: '#8d8c6e', pants: 'jeans', trou: '#2b3448', trou2: '#222a3a', cuff: '#4b5d80', sock: '#1d1d1f', shoe: '#ece8df', sole: '#c9c2b4', sole2: '#ddd6c8', lace: '#ffffff' },
  dj: { skin: '#e9b593', skin2: '#cd8f70', blush: '#d9765e', hair: '#4a3021', hair2: '#7a5236', hair3: '#2a1a11', tee: '#1c1c1e', tee2: '#0f0f10', pants: 'shorts', trou: '#e6dcc6', trou2: '#cfc4ab', sock: '#e8e4dc', shoe: '#3b3e44', sole: '#e26a4f', sole2: '#f1ece2', lace: '#2a2b2f' },
};

// Måtten ur v2 (alt7.py) och vad var och en gör: arm 0 är figurens högra
// (betraktarens vänstra) och arm 1 den vänstra. a/b = över- och underarm.
const FIGS = [
  { key: 'dl', x: -400, turn: 22, tilt: -4, legs: 74, torso: 86, w: 50, depth: 30, neck: 12, neckR: 17, arm: 8.5, leg: 9, a: 42, b: 36,
    head: { rx: 56.7, ry: 70.65, rz: 54, hw: 63, hh: 78.5, cy: -5.5, taper: 0.06, noseY: 19, nose: [8, 7.6, 7.2], cheek: 0.08, ear: [0.15, 0.21, 0.16, 0.5] }, glasses: 0,
    hair: { style: 'krona', f: 41, s: 80, b: 135, temple: 17, templeW: 0.2, vol: 0.06, lift: 3, back: 0, n: 22, fine: 3, fineW: 0.32, g: 0.08, dark: 0.42, wob: 0.8, tip: 3, tipAt: 'fram', edge: 0.7, sideCut: 0.6, quiff: { dir: [0, 0.62, 0.78], h: 0.1, w: 0.3 } },
    does: ['vila', 'flaska'] },
  { key: 'dt', x: -186, turn: 8, tilt: 3, legs: 60, torso: 78, w: 45, depth: 28, neck: 11, neckR: 15, arm: 8, leg: 9.5, a: 39, b: 35,
    head: { rx: 50.16, ry: 75.33, rz: 52, hw: 57, hh: 81, cy: -5, taper: 0.25, noseY: 17, nose: [6, 10, 7], cheek: 0.03, noseRot: -0.35 }, glasses: 36,
    hair: { style: 'bakat', f: 44, s: 96, b: 156, temple: 6, vol: 0.12, lift: 6, back: 12, n: 20, fine: 4, fineW: 0.35, g: 0.06, dark: 0.36, wob: 0.3, slat: 0.55, tip: 7, tipAt: 'bak', edge: 0.7, sideCut: 0.3, quiff: { dir: [0, 0.72, 0.69], h: 0.08, w: 0.5 }, gr: 1.05 },
    does: ['cigg', 'vila'] },
  { key: 'dj', x: 36, turn: -20, tilt: -2, legs: 104, torso: 100, w: 42, depth: 24, neck: 18, neckR: 13, arm: 7, leg: 8, a: 48, b: 44,
    head: { rx: 49, ry: 75, rz: 50, hw: 54, hh: 84, cy: -6, taper: 0.22, noseY: 18, nose: [5.8, 9, 7.2], noseRot: -0.3 }, glasses: 36,
    hair: { style: 'svep', sw: 28, f: 50, s: 82, b: 140, temple: 5, vol: 0.1, lift: 7, back: 2, n: 18, fine: 4, fineW: 0.3, g: 0.075, dark: 0.4, wob: 0.4, tip: 6, tipAt: 'bak', edge: 0.7, sideCut: 0.45, quiff: { dir: [-0.3, 0.62, 0.72], h: 0.13, w: 0.42 }, gr: 1.07 },
    beard: [1.024, -2], does: ['burk', 'prat'] },
];

export async function figurer(canvas, opt = {}) {
  const W = canvas.clientWidth || 1280;
  const H = canvas.clientHeight || 560;
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.setSize(W, H, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(H / 2 / D) / DEG, W / H, 50, 5000);
  cam.position.set(0, 0, D);
  cam.lookAt(0, 0, 0);

  // ljuset: lysröret framifrån ovan, neonen bakom till vänster, terminalen till höger
  scene.add(new THREE.HemisphereLight('#d8d0b8', '#3a2a20', 0.42));
  const key = new THREE.DirectionalLight('#fff0d6', 2.0);
  key.position.set(120, 520, 520);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -650, right: 350, top: 450, bottom: -450, near: 10, far: 2000 });
  key.target.position.set(-150, -50, 0);
  scene.add(key, key.target);
  const neon = new THREE.DirectionalLight('#ff3a26', 4.2);
  neon.position.set(-260, 260, -420);
  scene.add(neon);
  const term = new THREE.DirectionalLight('#5ff0dc', 1.1);
  term.position.set(520, 80, -120);
  scene.add(term);
  const fill = new THREE.DirectionalLight('#ffd9b0', 0.5);
  fill.position.set(-300, -50, 400);
  scene.add(fill);

  const pivot = new THREE.Group();
  pivot.position.y = -100;
  scene.add(pivot);
  const root = new THREE.Group();
  root.position.y = 100;
  pivot.add(root);

  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(1100, 220), new THREE.ShadowMaterial({ opacity: 0.42 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.set(-170, SILL, -24);
  catcher.receiveShadow = true;
  root.add(catcher);

  const mat = (color, o = {}, sort) => {
    const m = new THREE.MeshPhysicalMaterial(Object.assign({ color, envMapIntensity: 0.45 }, sort ? P0[sort] : {}, o));
    if (m.sheen && !o.sheenColor) m.sheenColor = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35);
    return m;
  };
  const mesh = (g, m, parent) => { const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; parent.add(x); return x; };
  const UP = new THREE.Vector3(0, 1, 0);
  function capsule(a, b, rad, m, parent) {
    a = v3(a); b = v3(b);
    const x = mesh(new THREE.CapsuleGeometry(rad, a.distanceTo(b), 8, 24), m, parent);
    x.position.copy(a).add(b).multiplyScalar(0.5);
    x.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    return x;
  }
  // en kapsel med fast längd som flyttas varje bild
  const rod = (len, rad, m, parent) => Object.assign(mesh(new THREE.CapsuleGeometry(rad, len, 8, 24), m, parent), { len });
  function place(x, a, b) {
    x.position.copy(a).add(b).multiplyScalar(0.5);
    x.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  }
  function ellipsoid(pos, sc, m, parent, rot) {
    const x = mesh(new THREE.SphereGeometry(1, 40, 28), m, parent);
    x.position.set(...pos);
    x.scale.set(...sc);
    if (rot) x.rotation.set(...rot);
    return x;
  }
  function ring(at, dir, R, tube, m, parent) {
    const x = mesh(new THREE.TorusGeometry(R, tube, 12, 64), m, parent);
    x.position.copy(v3(at));
    x.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v3(dir).normalize());
    return x;
  }
  const imgTex = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1152;
      c.getContext('2d').drawImage(img, 0, 0, 1024, 1152);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      res(t);
    };
    img.onerror = rej;
    img.src = src;
  });
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function hairTex(c1, c2, c3, seed) {
    const t = canvasTex(1024, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, c3); gr.addColorStop(0.35, c1); gr.addColorStop(1, c1);
      g.fillStyle = gr;
      g.fillRect(0, 0, 1024, 256);
      let s = seed;
      const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 900; i++) {
        const x = rnd() * 1024;
        g.strokeStyle = rnd() < 0.5 ? c2 : c3;
        g.globalAlpha = 0.25 + rnd() * 0.35;
        g.lineWidth = 1 + rnd() * 2.5;
        g.beginPath(); g.moveTo(x, rnd() * 40);
        g.bezierCurveTo(x + (rnd() - 0.5) * 30, 90, x + (rnd() - 0.5) * 40, 170, x + (rnd() - 0.5) * 30, 256);
        g.stroke();
      }
    });
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }
  // tygets struktur: fin trikå eller diagonal denim, som bumpkarta
  function weaveTex(kind) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#808080';
    g.fillRect(0, 0, 256, 256);
    let s = kind === 'denim' ? 11 : 5;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    if (kind === 'denim') {
      g.lineWidth = 2;
      for (let i = -256; i < 512; i += 5) { g.strokeStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${0.25 + rnd() * 0.3})`; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); }
    } else {
      for (let y = 0; y < 256; y += 4) for (let x = 0; x < 256; x += 4) { g.fillStyle = `rgba(0,0,0,${0.15 + rnd() * 0.25})`; g.fillRect(x + ((y / 4) % 2) * 2, y, 2, 3); }
    }
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.12})`; g.fillRect(rnd() * 256, rnd() * 256, 1, 1); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(kind === 'denim' ? 10 : 14, kind === 'denim' ? 10 : 14);
    return t;
  }
  const knit = weaveTex('knit');
  const denim = weaveTex('denim');

  // huvudet: en deformerad sfär; ansiktsdragen målas på ett skal framtill
  function headGeo(P, front, scale = 1, dy = 0) {
    const g = front ? new THREE.SphereGeometry(1, 96, 72, 0, Math.PI) : new THREE.SphereGeometry(1, 96, 72);
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      let X = p.getX(i);
      const Y = p.getY(i);
      let Z = p.getZ(i);
      if (Y < 0) X *= 1 - P.taper * Math.pow(-Y, 1.6);
      if (P.cheek) { const w = Math.exp(-(((Y + 0.32) / 0.3) ** 2)) * Math.max(0, Z); X *= 1 + P.cheek * w; Z *= 1 + P.cheek * 0.6 * w; }
      const px = X * P.rx * scale;
      const py = Y * P.ry * scale + dy;
      const pz = Z * P.rz * (front ? scale : 1);
      p.setXYZ(i, px, py, pz);
      if (front) uv.setXY(i, (px * P.hw / P.rx + 80) / 160, 1 - ((-py * P.hh / P.ry + P.cy) + 100) / 180);
    }
    g.computeVertexNormals();
    return g;
  }
  // skulpterat hår som på en vinylfigur: grova testar med fina fåror, rundade
  // spetsar, tjock kant mot huden, volym framtill, mörkare i fårorna
  function hairGeo(P, h, seed) {
    const N = 480;
    const M = 96;
    const pos = [];
    const uv = [];
    const col = [];
    const idx = [];
    let s0 = seed;
    const rnd = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
    const ph = Array.from({ length: 6 }, () => rnd() * 6.283);
    const sw = (h.sw || 0) * DEG;
    const Q = h.quiff ? v3(h.quiff.dir).normalize() : null;
    const wob = h.wob ?? 1;
    const S = THREE.MathUtils.smoothstep;
    const ridge = (p, e) => Math.pow(0.5 + 0.5 * Math.cos(p), e);
    const phaseAt = (a, t, dx, dy, dz) => (h.style === 'krona'
      ? h.n * a + wob * (0.8 * Math.sin(a * 5 + ph[2]) + 1.4 * t * Math.sin(a * 2 + ph[3]))
      : h.n * Math.atan2(dx * Math.cos(sw) - dz * Math.sin(sw), dy) + wob * (0.7 * Math.sin(dz * 4 + ph[2]) + 0.4 * Math.sin(dx * 7 + ph[3])));
    for (let i = 0; i <= N; i++) {
      const a = i / N * 2 * Math.PI;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const wf = Math.max(0, ca) ** 2;
      const wb = Math.max(0, -ca) ** 2;
      const ws = sa * sa;
      let lim = (h.f * wf + h.s * ws + h.b * wb) * DEG;
      const ang = Math.abs(Math.atan2(sa, ca));
      lim -= (h.temple || 0) * DEG * Math.exp(-(((ang - 0.62) / (h.templeW || 0.22)) ** 2));
      if (h.tip) {
        const ex = Math.sin(lim) * sa; const ey = Math.cos(lim); const ez = Math.sin(lim) * ca;
        const w = h.tipAt === 'bak' ? wb + 0.6 * ws * (ca < 0) : h.tipAt === 'fram' ? wf + 0.5 * ws * (ca > 0) : 1;
        lim += h.tip * DEG * w * (ridge(phaseAt(a, 1, ex, ey, ez), 2.2) - 0.35);
      }
      for (let j = 0; j <= M; j++) {
        const t = j / M;
        const th = t * lim;
        const dx = Math.sin(th) * sa; const dy = Math.cos(th); const dz = Math.sin(th) * ca;
        const fall = 1 - S(t, h.edge || 0.55, 1);
        const fall2 = 1 - S(t, 0.9, 1);
        const phase = phaseAt(a, t, dx, dy, dz);
        const fade = h.style === 'krona' ? S(Math.sin(th), 0.08, 0.4) : S(Math.hypot(dx * Math.cos(sw) - dz * Math.sin(sw), dy), 0.12, 0.45);
        const smooth = 1 - (h.slat || 0) * wf * S(t, 0.45, 0.95);
        const big = ridge(phase, 0.5); const fine = ridge(phase * (h.fine || 3) + 1.3, 0.9); const fw = h.fineW ?? 0.3;
        const rid = big * (1 - fw) + fine * fw;
        const side = 1 - (h.sideCut || 0) * ws * (1 - Math.max(0, dy)) * (ca > -0.3);
        let k = 1.012 + h.vol * fall * side * (0.55 + 0.45 * dy) + h.g * (rid - 0.5) * fall2 * fade * smooth;
        if (Q) { const dd = 1 - (dx * Q.x + dy * Q.y + dz * Q.z); k += h.quiff.h * Math.exp(-dd * dd / (h.quiff.w ** 2)) * fall; }
        pos.push(dx * k * P.rx, dy * k * P.ry + (h.lift || 0) * fall * dy, dz * k * P.rz - (h.back || 0) * fall * dy);
        const sh = (1 - h.dark * (1 - rid) * fade * smooth) * (1 - 0.25 * (1 - fall2));
        col.push(sh, sh, sh);
        uv.push(phase / 6.283 / 5, 1 - t);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j; const b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  function glasses(P, parent, at, rr = 1) {
    const g = new THREE.Group();
    parent.add(g);
    const m = new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.32, envMapIntensity: 0.2 });
    for (const s of [-1, 1]) { const l = mesh(new RoundedBoxGeometry(P.rx * 0.62, P.ry * 0.2, 3, 3, 2.5), m, g); l.position.x = s * P.rx * 0.36; }
    mesh(new THREE.BoxGeometry(P.rx * 0.14, 2.4, 2.4), m, g).position.y = P.ry * 0.03;
    for (const s of [-1, 1]) { const arm = mesh(new THREE.BoxGeometry(2.4, 2.4, P.rz * 1.05), m, g); arm.position.set(s * P.rx * 0.66, 0, -P.rz * 0.5); }
    const th = at * DEG;
    g.position.set(0, Math.cos(th) * P.ry * 1.1 * rr, Math.sin(th) * P.rz * 1.18 * rr + 2);
    g.rotation.x = 8 * DEG;
  }

  // ---------- sakerna: flaskan, burken, cigaretten, askkoppen ----------

  const labelTex = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#efe3c2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b8312a'; g.fillRect(0, 18, w, 16); g.fillRect(0, h - 30, w, 10);
    g.fillStyle = '#2a2014'; g.font = '700 46px Fraunces, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const x of [w * 0.25, w * 0.75]) g.fillText('PILSNER', x, 70);
  });
  const canTex = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9dde2'); gr.addColorStop(0.18, '#1f3f7a'); gr.addColorStop(0.82, '#1f3f7a'); gr.addColorStop(1, '#c9cdd2');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e3b84a'; g.fillRect(0, h * 0.62, w, 10);
    g.fillStyle = '#f3ead9'; g.font = '800 92px Fraunces, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const x of [w * 0.25, w * 0.75]) g.fillText('ÖL', x, h * 0.43);
  });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#4a2408', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.88, envMapIntensity: 1.2 });
  function bottle(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const prof = [[0, -24], [7.2, -24], [7.6, -22], [7.6, 6], [7, 9], [3.4, 15], [2.8, 23], [3.2, 24], [3.2, 26], [2.4, 26.4], [0, 26.4]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 32), glass, g);
    const lb = mesh(new THREE.CylinderGeometry(7.75, 7.75, 14, 32, 1, true), mat('#ffffff', { map: labelTex, roughness: 0.5, clearcoat: 0.3 }), g);
    lb.position.y = -9;
    g.userData.top = 26;
    return g;
  }
  function can(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const alu = mat('#c9cdd2', { metalness: 0.9, roughness: 0.25, envMapIntensity: 1 });
    const body = mesh(new THREE.CylinderGeometry(7.4, 7.4, 30, 36, 1, true), mat('#ffffff', { map: canTex, metalness: 0.55, roughness: 0.28, clearcoat: 0.6, envMapIntensity: 1 }), g);
    body.position.y = 0;
    const top = mesh(new THREE.CylinderGeometry(6.2, 7.4, 2.6, 36), alu, g); top.position.y = 16.3;
    const bot = mesh(new THREE.CylinderGeometry(7.4, 6.4, 2.4, 36), alu, g); bot.position.y = -16.2;
    g.userData.top = 17.6;
    return g;
  }
  const ember = new THREE.MeshBasicMaterial({ color: '#ff6a24' });
  const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,180,90,1)'); gr.addColorStop(0.4, 'rgba(255,90,30,.5)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  // cigaretten längs x: filtret vid −x, glöden vid +x
  function cigarette(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const paper = mesh(new THREE.CylinderGeometry(1.25, 1.25, 15, 14), mat('#f4f1ea', { roughness: 0.7 }), g);
    paper.rotation.z = Math.PI / 2; paper.position.x = 1.5;
    const filt = mesh(new THREE.CylinderGeometry(1.3, 1.3, 6, 14), mat('#d9924a', { roughness: 0.7 }), g);
    filt.rotation.z = Math.PI / 2; filt.position.x = -9;
    const ash = mesh(new THREE.CylinderGeometry(1.2, 1.1, 2.2, 12), mat('#9a948a', { roughness: 1 }), g);
    ash.rotation.z = Math.PI / 2; ash.position.x = 10;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 8), ember.clone());
    tip.position.x = 9.6; g.add(tip);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 }));
    halo.scale.set(10, 10, 1); halo.position.x = 9.8; g.add(halo);
    g.userData = { tip, halo, end: new THREE.Vector3(11, 0, 0), filter: new THREE.Vector3(-12, 0, 0) };
    return g;
  }

  // ---------- händerna ----------
  // Byggda i handens egna axlar och placerade varje bild:
  //   grepp: fingrarna runt något längs y (flaskan, burken), handryggen mot +z;
  //   nyp:   vante med fingrarna längs +y och cigaretten i topparna, längs x;
  //   vila:  vante som vilar, fingrarna längs +y, handflatan mot −z.
  function hand(kind, q, skin, parent, r0 = 7.6) {
    const g = new THREE.Group();
    parent.add(g);
    if (kind === 'grepp') {
      const back = mesh(new RoundedBoxGeometry(q * 2.3, q * 2.6, q * 1.3, 4, q * 0.55), skin, g);
      back.position.set(0, 0, r0 + q * 0.5);
      for (let i = 0; i < 4; i++) {
        const f = mesh(new THREE.TorusGeometry(r0 + q * 0.32, q * 0.36, 10, 24, Math.PI * 1.05), skin, g);
        f.rotation.x = Math.PI / 2;
        f.rotation.z = -Math.PI * 0.02 + Math.PI;
        f.position.y = (i - 1.5) * q * 0.72;
      }
      capsule([q * 0.9, q * 0.8, r0 + q * 0.2], [q * 0.4, q * 1.6, -r0 * 0.4], q * 0.42, skin, g);
      g.userData.wrist = new THREE.Vector3(0, -q * 0.3, r0 + q * 1.2);
    } else {
      ellipsoid([0, q * 1.1, 0], [q * 0.62, q * 1.3, q * 1.05], skin, g);
      ellipsoid([-q * 0.12, q * 2.25, 0], [q * 0.55, q * 0.95, q * 0.98], skin, g, [0, 0, 0.25]);
      capsule([q * 0.15, q * 0.7, -q * 0.75], [q * 0.4, q * 1.7, -q * 1.02], q * 0.36, skin, g);
      g.userData.wrist = new THREE.Vector3(0, 0, 0);
    }
    return g;
  }

  // ---------- figurerna ----------

  const tex = {};
  await document.fonts.ready;
  await Promise.all([
    ...['dl', 'dt', 'dj'].map(async (k) => { tex[k] = await imgTex(`rum/ansikte-${k}.svg`); }),
    imgTex('rum/skagg-dj.svg').then((t) => { tex.dj_skagg = t; }),
  ]);
  labelTex.needsUpdate = true;
  canTex.needsUpdate = true;

  const figs = [];
  for (const F of FIGS) figs.push(build(F));

  function build(F) {
    const c = CHARS[F.key];
    const L = F.legs;
    const T = F.torso;
    const Wd = F.w;
    const thigh = L * 0.5;
    const shin = L * 0.44;
    const z0 = EDGE_Z + 3 - thigh * Math.cos(F.turn * DEG);
    const fig = new THREE.Group();
    fig.position.set(F.x, SILL, z0);
    fig.rotation.y = F.turn * DEG;
    root.add(fig);
    const skin = mat(c.skin, { sheenColor: new THREE.Color(c.blush), sheen: 0.3 }, 'hud');
    const fab = (col, extra = {}) => mat(col, extra, 'tyg');
    const tee = fab(c.tee, { bumpMap: knit, bumpScale: 0.6 });
    const jeans = c.pants === 'jeans';
    const trou = fab(c.trou, { bumpMap: jeans ? denim : knit, bumpScale: jeans ? 0.9 : 0.5 });
    const tee2 = fab(c.tee2);
    const trou2 = fab(c.trou2);
    const shoe = mat(c.shoe, {}, 'sko');
    const sole = mat(c.sole, { roughness: 0.6 });
    const hipY = 11;

    // benen: låren framåt över kanten, underbenen hänger och dinglar
    const knees = [];
    for (const s of [-1, 1]) {
      const fx = s * Wd * 0.36;
      // låret lutar lite nedåt och utåt mot knät
      const hip = new THREE.Vector3(fx, hipY, 0);
      const kn = new THREE.Vector3(fx + s * 7, hipY - 7, thigh);
      const along = kn.clone().sub(hip).normalize();
      if (jeans) {
        capsule(hip.toArray(), kn.toArray(), F.leg * 1.25, trou, fig);
      } else {
        capsule(hip.clone().lerp(kn, 0.5).toArray(), kn.toArray(), F.leg * 1.05, skin, fig);
        // shortsen: ett rör tätt om låret med uppvik ytterst
        const sh = mesh(new THREE.CylinderGeometry(F.leg * 1.32, F.leg * 1.45, thigh * 0.74, 32, 1, true), fab(c.trou, { bumpMap: knit, bumpScale: 0.5, side: THREE.DoubleSide }), fig);
        sh.position.copy(hip.clone().lerp(kn, 0.33));
        sh.quaternion.setFromUnitVectors(UP, along);
        ring(hip.clone().lerp(kn, 0.68).toArray(), along.toArray(), F.leg * 1.3, 2.2, trou2, fig);
        const inner = mesh(new THREE.CircleGeometry(F.leg * 1.3, 24), mat('#3a3128', { roughness: 1 }), fig);
        inner.position.copy(hip.clone().lerp(kn, 0.66));
        inner.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), along);
      }
      const knee = new THREE.Group();
      knee.position.copy(kn);
      fig.add(knee);
      if (jeans) {
        capsule([0, 0, 0], [0, -shin, 0], F.leg * 1.25, trou, knee);
        const cuff = mesh(new THREE.CylinderGeometry(F.leg * 1.42, F.leg * 1.45, 7, 32), fab(c.cuff, { bumpMap: denim, bumpScale: 0.6 }), knee);
        cuff.position.y = -shin + 4;
        capsule([s * F.leg * 1.22, -shin + 8, 0], [s * F.leg * 1.22, -2, 0], 0.55, mat('#c08a42', { roughness: 0.8 }), knee);
      } else {
        capsule([0, 0, 0], [0, -shin, 0], F.leg, skin, knee);
        mesh(new THREE.CylinderGeometry(F.leg * 1.08, F.leg * 1.08, 9, 24), mat(c.sock, { roughness: 0.9 }), knee).position.y = -shin + 2;
      }
      const foot = new THREE.Group();
      foot.position.set(0, -shin - 5, 2);
      foot.rotation.x = 0.5;
      knee.add(foot);
      ellipsoid([0, 0, 6], [11, 8, 19], shoe, foot);
      ellipsoid([0, -4.5, 6], [11.5, 3, 19.5], sole, foot);
      ellipsoid([0, -1.8, 6], [11.6, 1, 19.6], mat(c.sole2, { roughness: 0.6 }), foot);
      const lace = mat(c.lace, { roughness: 0.8 });
      for (const zz of [9, 13.5, 18]) { const yy = 8 * Math.sqrt(Math.max(0, 1 - ((zz - 6) / 19) ** 2)) - 0.4; capsule([-4.6, yy, zz], [4.6, yy, zz], 1.15, lace, foot); }
      knees.push(knee);
    }

    // bålen: höfterna, tröjan med veck, fållen och kragen, halsen och huvudet
    const torso = new THREE.Group();
    torso.position.set(0, hipY + 3, 0);
    fig.add(torso);
    const hipPts = jeans ? [[Wd * 0.74, -6], [Wd * 0.82, 6], [Wd * 0.86, 14]] : [[Wd * 0.7, -12], [Wd * 0.82, 0], [Wd * 0.86, 14]];
    const hips = mesh(new THREE.LatheGeometry([new THREE.Vector2(0, hipPts[0][1]), ...hipPts.map(([a, b]) => new THREE.Vector2(a, b)), new THREE.Vector2(0, 14)], 48), trou, torso);
    hips.scale.z = F.depth / Wd;
    const prof = [[0, -0.02], [0.84, -0.02], [0.86, 0.1], [0.9, 0.45], [0.97, 0.75], [1, 0.86], [0.92, 0.96], [0.6, 1.02], [0.25, 1.04], [0, 1.04]].map(([a, b]) => new THREE.Vector2(a * Wd, b * T));
    const tg = new THREE.LatheGeometry(prof, 160);
    const p = tg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i); const rr = Math.hypot(x, z);
      if (rr < Wd * 0.5) continue;
      const th = Math.atan2(x, z); const h = y / T;
      const f = 1.7 * (0.5 + 0.5 * Math.sin(th * 7 + h * 9 + F.x)) * Math.exp(-(((h - 0.12) / 0.16) ** 2)) + 1.4 * (0.5 + 0.5 * Math.sin(th * 4 - h * 8 + 1)) * Math.exp(-(((h - 0.7) / 0.18) ** 2)) * Math.abs(Math.sin(th));
      const k = (rr + f) / rr;
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    tg.computeVertexNormals();
    const chest = new THREE.Group();
    torso.add(chest);
    mesh(tg, tee, chest).scale.z = F.depth / Wd;
    ring([0, -T * 0.015, 0], [0, 1, 0], Wd * 0.86, 2.2, tee2, chest).scale.y = F.depth / Wd;
    ring([0, T * 1.03, 0], [0, 1, 0], F.neckR + 2.6, 2.3, tee2, chest);
    mesh(new THREE.CylinderGeometry(F.neckR, F.neckR * 1.1, F.neck + 26, 24), skin, torso).position.y = T + F.neck / 2 - 2;

    const P = F.head;
    const hg = new THREE.Group();
    hg.position.set(0, T + F.neck, 0);
    torso.add(hg);
    const hc = new THREE.Group();
    hc.position.y = P.ry * 0.84;
    hg.add(hc);
    mesh(headGeo(P, false), skin, hc);
    const fm = new THREE.Mesh(headGeo(P, true, 1.003), mat('#ffffff', { map: tex[F.key], transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }, 'hud'));
    fm.receiveShadow = true;
    hc.add(fm);
    if (F.beard) {
      const bm = new THREE.Mesh(headGeo(P, true, F.beard[0], F.beard[1]), mat('#ffffff', { map: tex.dj_skagg, transparent: true, alphaTest: 0.3, roughness: 0.85, bumpMap: tex.dj_skagg, bumpScale: 1.5 }));
      bm.castShadow = bm.receiveShadow = true;
      hc.add(bm);
    }
    const ny = -(P.noseY - P.cy) / P.hh;
    ellipsoid([0, ny * P.ry, Math.sqrt(Math.max(0, 1 - ny * ny)) * P.rz * 0.9], P.nose, skin, hc, P.noseRot ? [P.noseRot, 0, 0] : undefined);
    const ear = P.ear || [0.13, 0.19, 0.15, 0.35];
    for (const s of [-1, 1]) ellipsoid([s * P.rx * 0.95, -P.ry * 0.04, -P.rz * 0.08], [P.rx * ear[0], P.ry * ear[1], P.rz * ear[2]], mat(c.skin2, { roughness: 0.55 }), hc, [0, s * ear[3], 0]);
    const ht = hairTex(c.hair, c.hair2, c.hair3, F.key.charCodeAt(1));
    mesh(hairGeo(P, F.hair, F.key.charCodeAt(1) * 131), mat('#ffffff', { map: ht, vertexColors: true, bumpMap: ht, bumpScale: 1.5 }, 'har'), hc);
    if (F.glasses) glasses(P, hc, F.glasses, F.hair.gr || 1);
    // munnen i huvudets axlar (ansiktsbildens y ≈ 42)
    const my = -(42 - P.cy) * P.ry / P.hh;
    const mouth = new THREE.Vector3(0, my, Math.sqrt(Math.max(0, 1 - (my / P.ry) ** 2)) * P.rz * 0.98 + 2);

    // armarna: kapslar med fast längd som IK placerar varje bild
    const arms = [0, 1].map((i) => {
      const s = i === 0 ? -1 : 1;
      const kind = F.does[i];
      const A = {
        s,
        kind,
        S: new THREE.Vector3(s * Wd * 0.88, T - 10, 0),
        up: rod(F.a, F.arm, skin, fig),
        lo: rod(F.b, F.arm * 0.92, skin, fig),
        sleeve: rod(F.a * 0.48, F.arm * 1.45, tee, fig),
        cuff: ring([0, 0, 0], [0, 1, 0], F.arm * 1.45, 1.3, tee2, fig),
      };
      const q = F.arm;
      if (kind === 'flaska' || kind === 'burk') {
        A.hand = hand('grepp', q, skin, fig, kind === 'burk' ? 7.4 : 7.6);
        A.thing = kind === 'burk' ? can(A.hand) : bottle(A.hand);
      } else if (kind === 'cigg' || kind === 'prat') {
        A.hand = hand('nyp', q, skin, fig);
        A.cig = cigarette(A.hand);
        A.cig.position.set(-q * 0.2, q * 2.5, -q * 0.9);
      } else {
        A.hand = hand('vila', q, skin, fig);
      }
      return A;
    });
    // en flaska till på fönsterbänken bredvid DT och askkoppen
    if (F.key === 'dt') {
      const b2 = bottle(fig);
      b2.position.set(Wd * 1.25, 24.4, thigh * 0.15);
      const tray = new THREE.Group();
      tray.position.set(-Wd * 1.35, 0, thigh * 0.45);
      fig.add(tray);
      const tm = new THREE.MeshPhysicalMaterial({ color: '#9fb2b0', roughness: 0.1, transmission: 0, transparent: true, opacity: 0.75, clearcoat: 1 });
      mesh(new THREE.CylinderGeometry(15, 13, 5, 28), tm, tray).position.y = 2.5;
      mesh(new THREE.CylinderGeometry(11, 11, 1, 20), mat('#5a554c', { roughness: 1 }), tray).position.y = 4.4;
      for (const [x, z, a] of [[-4, 2, 0.6], [3, -3, -0.9], [5, 4, 2.1]]) {
        const b = mesh(new THREE.CylinderGeometry(1.25, 1.25, 7, 10), mat('#e6dcc8', { roughness: 0.9 }), tray);
        b.rotation.set(Math.PI / 2, 0, a); b.position.set(x, 5.4, z);
      }
    }
    if (F.key === 'dj') {
      for (const [x, z, tilt] of [[Wd * 1.55, -22, 0], [Wd * 2.05, -6, 1.45]]) {
        const e = bottle(fig);
        e.rotation.z = tilt;
        e.position.set(x, tilt ? 7.6 : 24.4, z);
      }
    }
    return { F, fig, torso, chest, hg, hc, knees, arms, mouth, thigh, hipY, T, phase: hash(F.x) * 20 };
  }

  // ---------- rörelserna ----------

  const scratch = new THREE.Group();
  // Tvåledad IK: armbågen E ur axeln S, handleden Wr, längderna och en
  // riktning som armbågen ska peka åt.
  function ik(S, Wr, a, b, pole) {
    const d = Wr.clone().sub(S);
    let len = d.length();
    len = Math.min(Math.max(len, Math.abs(a - b) + 0.5), a + b - 0.3);
    const dir = d.normalize();
    const x = (a * a - b * b + len * len) / (2 * len);
    const h = Math.sqrt(Math.max(0, a * a - x * x));
    const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    return S.clone().add(dir.clone().multiplyScalar(x)).add(perp.multiplyScalar(h));
  }
  // Handens axlar ur y (fingrarna/flaskan) och z (handryggen).
  function orient(g, pos, y, z) {
    const Y = y.clone().normalize();
    const Z = z.clone().sub(Y.clone().multiplyScalar(z.dot(Y))).normalize();
    const X = new THREE.Vector3().crossVectors(Y, Z);
    g.position.copy(pos);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  }

  // Bålens och huvudets läge: lutning framåt, andning och blickar.
  function body(o, t) {
    const k = o.F.key;
    const tt = t + o.phase;
    const drink = drinkW(o, t);
    const drag = dragW(o, t);
    o.torso.rotation.x = 0.1 - 0.12 * drink + 0.02 * Math.sin(tt * 0.4);
    o.torso.rotation.z = 0.015 * Math.sin(tt * 0.23);
    o.chest.scale.set(1 + 0.008 * Math.sin(tt * 1.6), 1 + 0.012 * Math.sin(tt * 1.6), 1);
    let pitch = -0.05 + 0.03 * Math.sin(tt * 0.31);
    let yaw = 0;
    if (k === 'dl') yaw = 0.18 * bump((t % 21), 12, 13.5, 17, 18.5) - 0.05;
    if (k === 'dt') { pitch += 0.06 * Math.sin(t * 5.2) * bump(t % 13, 8.5, 9, 10.5, 11.5); yaw = -0.12 * bump(t % 17, 2, 3, 6, 7); }
    if (k === 'dj') { yaw = -0.22 + 0.06 * Math.sin(t * 0.7); pitch += 0.04 * Math.sin(t * 2.1) * talkW(o, t); }
    pitch -= 0.38 * drink - 0.06 * drag;
    o.hg.rotation.x = pitch;
    o.hg.rotation.y = yaw;
    for (let i = 0; i < 2; i++) o.knees[i].rotation.x = 0.06 + 0.16 * Math.sin(t * (k === 'dj' ? 0.9 : 1.15) + o.phase + i * 2.4) * (k === 'dt' ? 0.6 : 1);
  }
  // när var och en dricker och drar ett bloss (0 → 1 → 0)
  const drinkW = (o, t) => (o.F.key === 'dl' ? bump(t % 15, 6, 7.4, 9.6, 11) : o.F.key === 'dj' ? bump((t + 4) % 19, 11, 12.4, 14.2, 15.6) : 0);
  const dragW = (o, t) => (o.F.key === 'dt' ? bump(t % 12, 3, 4.2, 5.4, 6.6) : o.F.key === 'dj' ? bump((t + 5) % 16, 1, 2.2, 3.2, 4.4) : 0);
  const talkW = (o, t) => (o.F.key === 'dj' ? 1 - dragW(o, t) : 0);
  const glowAt = (o, t) => (o.F.key === 'dt' ? bump(t % 12, 4, 4.4, 5.2, 5.8) : bump((t + 5) % 16, 2.1, 2.5, 3.0, 3.6));

  const mouthIn = (o) => {
    o.fig.updateMatrix(); o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    return o.mouth.clone().applyMatrix4(o.hc.matrix).applyMatrix4(o.hg.matrix).applyMatrix4(o.torso.matrix);
  };
  const shoulder = (o, A) => { o.torso.updateMatrix(); return A.S.clone().applyMatrix4(o.torso.matrix); };

  // Handens läge (figurens axlar): position, y- och z-axel och armbågens riktning.
  function handPose(o, A, t) {
    const { s } = A;
    const Wd = o.F.w;
    const th = o.thigh;
    const y0 = o.hipY;
    if (A.kind === 'flaska' || A.kind === 'burk') {
      const top = A.thing.userData.top;
      const rest = { p: new THREE.Vector3(s * Wd * 0.42, y0 + 8 + top * 0.55, th * 0.72), y: new THREE.Vector3(s * 0.05, 1, 0.06), z: new THREE.Vector3(s, 0.1, -0.15), pole: new THREE.Vector3(s, -0.6, -0.6) };
      const w = drinkW(o, t);
      if (w <= 0) return rest;
      const m = mouthIn(o);
      const u = new THREE.Vector3(-s * 0.12, 0.52 + 0.25 * w, -0.85).normalize();
      const sip = 0.03 * Math.sin(t * 3) * w;
      u.y += sip;
      const at = m.clone().sub(u.clone().multiplyScalar(top - 1)).add(new THREE.Vector3(0, 0, 1.5));
      return { p: rest.p.clone().lerp(at, w), y: rest.y.clone().lerp(u, w), z: rest.z.clone().lerp(new THREE.Vector3(s * 0.85, -0.3, 0.2), w), pole: new THREE.Vector3(s, -0.35, -0.2) };
    }
    if (A.kind === 'cigg' || A.kind === 'prat') {
      // vilar på låret med glöden framåt, gestikulerar (DJ) och tar ett bloss
      const rest = A.kind === 'cigg'
        ? { p: new THREE.Vector3(s * Wd * 0.98, y0 + 16, th * 0.72), y: new THREE.Vector3(s * 0.2, 0.6, 1), z: new THREE.Vector3(s * 0.9, 0.4, -0.2), pole: new THREE.Vector3(s, -0.4, -0.7) }
        : { p: new THREE.Vector3(s * Wd * 0.4, y0 + 13, th * 0.78), y: new THREE.Vector3(-s * 0.15, 0.25, 1), z: new THREE.Vector3(s * 0.4, 1, -0.1), pole: new THREE.Vector3(s, -0.5, -0.5) };
      if (A.kind === 'prat') {
        const k = talkW(o, t);
        const a = t * 0.9;
        rest.p.lerp(new THREE.Vector3(s * (Wd * 1.15 + 9 * Math.sin(a)), o.T * 0.42 + 8 * Math.sin(a * 1.7) + y0, th * 0.9 + 6 * Math.cos(a * 1.3)), k);
        rest.y.lerp(new THREE.Vector3(s * 0.2 + 0.25 * Math.sin(a * 1.1), 1, 0.55), k);
        rest.z.lerp(new THREE.Vector3(s * 0.3, -0.2, -1), k);
      }
      const w = dragW(o, t);
      if (w <= 0) return rest;
      const m = mouthIn(o);
      // filtret mot läpparna: handen framför munnen, fingrarna uppåt
      const y = new THREE.Vector3(s * 0.25, 1, 0.35);
      const z = new THREE.Vector3(0, 0.1, 1);
      const q = o.F.arm;
      orient(scratch, new THREE.Vector3(), y, z); scratch.updateMatrix();
      const filt = A.cig.position.clone().add(new THREE.Vector3(-12, 0, 0)).applyMatrix4(scratch.matrix);
      const at = m.clone().sub(filt).add(new THREE.Vector3(0, -q * 0.2, 2));
      return { p: rest.p.clone().lerp(at, w), y: rest.y.clone().lerp(y, w), z: rest.z.clone().lerp(z, w), pole: new THREE.Vector3(s, -0.7, 0.1) };
    }
    // vila: handflatan mot fönsterbänken bredvid höften (DL) eller på knät (DT)
    if (o.F.key === 'dl') return { p: new THREE.Vector3(s * Wd * 1.05, 2, th * 0.25), y: new THREE.Vector3(s * 0.35, 0, 1), z: new THREE.Vector3(0, 1, 0), pole: new THREE.Vector3(s, 0.2, -1) };
    return { p: new THREE.Vector3(s * Wd * 0.36, y0 + 9, th * 0.92), y: new THREE.Vector3(-s * 0.1, -0.15, 1), z: new THREE.Vector3(0, 1, 0.1), pole: new THREE.Vector3(s, -0.3, -0.6) };
  }

  function pose(o, t) {
    body(o, t);
    o.torso.updateMatrix();
    for (const A of o.arms) {
      const hp = handPose(o, A, t);
      orient(A.hand, hp.p, hp.y, hp.z);
      A.hand.updateMatrix();
      const Wr = A.hand.userData.wrist.clone().applyMatrix4(A.hand.matrix);
      const S = shoulder(o, A);
      const E = ik(S, Wr, o.F.a, o.F.b, hp.pole);
      const du = E.clone().sub(S).normalize();
      const sl = S.clone().add(du.clone().multiplyScalar(o.F.a * 0.48));
      place(A.up, S, E);
      place(A.lo, E, Wr);
      place(A.sleeve, S, sl);
      A.cuff.position.copy(sl);
      A.cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), du);
      if (A.cig) {
        const g = glowAt(o, t);
        const tip = A.cig.userData.tip;
        tip.material.color.setRGB(1, 0.32 + 0.25 * g, 0.1 + 0.08 * g);
        A.cig.userData.halo.material.opacity = 0.35 + 0.6 * g + 0.08 * Math.sin(t * 13 + o.phase);
        A.cig.userData.halo.scale.setScalar(8 + 7 * g);
      }
    }
  }

  // ---------- röken ----------
  // Varje bloss föds på en fast tid; läget räknas ur var glöden (eller
  // munnen, när man blåser ut) var då, plus drift uppåt och åt sidan.
  const smokeTex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(228,230,234,.9)'); gr.addColorStop(0.45, 'rgba(214,218,224,.38)'); gr.addColorStop(1, 'rgba(200,205,212,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const smokers = [];
  for (const o of figs) for (const A of o.arms) if (A.cig) smokers.push({ o, A });
  const SM = { every: 0.09, life: 5.5, n: 0 };
  SM.n = Math.ceil(SM.life / SM.every) + 2;
  const puffs = [];
  for (const sk of smokers) {
    for (const src of ['glod', 'mun']) {
      const list = [];
      for (let i = 0; i < SM.n; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, color: '#e4e6ea', toneMapped: false }));
        root.add(sp);
        list.push(sp);
      }
      puffs.push({ sk, src, list, born: new Map() });
    }
  }
  const fp = new THREE.Vector3();
  function emitter(sk, src, t) {
    pose(sk.o, t);
    sk.o.fig.updateMatrix();
    if (src === 'mun') return mouthIn(sk.o).applyMatrix4(sk.o.fig.matrix);
    sk.A.hand.updateMatrix();
    sk.A.cig.updateMatrix();
    return sk.A.cig.userData.end.clone().applyMatrix4(sk.A.cig.matrix).applyMatrix4(sk.A.hand.matrix).applyMatrix4(sk.o.fig.matrix);
  }
  function smoke(t) {
    for (const { sk, src, list, born } of puffs) {
      const o = sk.o;
      const base = Math.floor(t / SM.every);
      // var glöden (munnen) var när varje bloss föddes räknas en gång
      for (const k of born.keys()) if (k < base - SM.n || k > base) born.delete(k);
      list.forEach((sp, i) => {
        const k = base - i;
        const tb = k * SM.every;
        const age = t - tb;
        const seed = k * 7.13 + o.F.x;
        let alpha = 0;
        if (src === 'glod') alpha = 0.8 * (1 - dragW(o, tb) * 0.7);
        else {
          // utandningen: strax efter blosset
          const after = o.F.key === 'dt' ? bump(tb % 12, 6.0, 6.3, 7.4, 8.6) : bump((tb + 5) % 16, 4.4, 4.7, 5.8, 7);
          alpha = 0.85 * after;
        }
        if (alpha < 0.01 || age < 0 || age > SM.life) { sp.material.opacity = 0; sp.visible = false; return; }
        let e = born.get(k);
        if (!e) { e = emitter(sk, src, tb); born.set(k, e); }
        const life = age / SM.life;
        const rise = src === 'glod' ? 11 + 2 * hash(seed) : 5;
        fp.copy(e);
        // ett tunt band närmast glöden som slingrar sig och löses upp högre upp
        const curl = Math.sin(age * 1.7 + tb * 0.8) * (1.2 + age * 3.2) + Math.sin(age * 0.6 + hash(seed + 1) * 6) * age * 2.5;
        fp.y += rise * age + 0.9 * age * age;
        fp.x += curl + age * 3.6;
        fp.z += (src === 'mun' ? 18 * (1 - Math.exp(-age * 1.6)) : 0) + Math.cos(age * 0.9 + tb) * age * 1.5;
        sp.position.copy(fp);
        const size = src === 'glod' ? 3.2 + age * 5.5 + age * age * 0.7 : 9 + age * 14;
        sp.scale.set(size, size, 1);
        sp.material.opacity = alpha * Math.min(1, age * 4) * (1 - life) ** (src === 'glod' ? 1.8 : 1.3);
        sp.material.rotation = hash(seed + 2) * 6 + age * 0.3;
        sp.visible = true;
      });
    }
  }

  // ---------- porträttet i ramen ----------

  const shots = {};
  function portrait(k) {
    if (shots[k]) return shots[k];
    const o = figs.find((x) => x.F.key === k);
    if (!o) return null;
    pose(o, 2);
    for (const x of figs) x.fig.visible = x === o;
    for (const p of puffs) for (const sp of p.list) sp.visible = false;
    catcher.visible = false;
    pivot.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const c = new THREE.Vector3();
    o.hc.getWorldPosition(c);
    const pc = new THREE.PerspectiveCamera(24, 0.92, 10, 5000);
    pc.position.copy(c).add(new THREE.Vector3(30, 20, 420));
    pc.lookAt(c.clone().add(new THREE.Vector3(0, -18, 0)));
    const w = 368;
    const h = 400;
    const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, colorSpace: THREE.SRGBColorSpace });
    r.setRenderTarget(rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(scene, pc);
    const buf = new Uint8Array(w * h * 4);
    r.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    r.setRenderTarget(null);
    rt.dispose();
    for (const x of figs) x.fig.visible = true;
    catcher.visible = true;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const img = cv.getContext('2d').createImageData(w, h);
    for (let y = 0; y < h; y++) img.data.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    cv.getContext('2d').putImageData(img, 0, 0);
    shots[k] = cv.toDataURL('image/png');
    return shots[k];
  }

  // ---------- en bild ----------

  let headA = 0;
  let headV = 0;
  let lastMx = 0;
  function draw(t, mx, my) {
    // huvudena nickar efter när musen rör sig
    const dv = mx - lastMx;
    lastMx = mx;
    headV += ((dv * 40 + mx * 3) * DEG - headA) * 0.08;
    headV *= 0.86;
    headA += headV;
    for (const o of figs) {
      pose(o, t);
      o.hg.rotation.z = o.F.tilt * DEG + headA * (1 + figs.indexOf(o) * 0.15);
    }
    smoke(t);
    for (const o of figs) pose(o, t);
    pivot.rotation.y = mx * 4.5 * DEG;
    pivot.rotation.x = my * 2.6 * DEG;
    r.render(scene, cam);
  }

  return { draw, portrait };
}
