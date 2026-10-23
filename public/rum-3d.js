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
// Den som inte har lämnat in en öppen omgång sitter med kupongen och pennan i
// stället för flaskan, burken och cigaretten, som står bredvid på
// fönsterbänken. Fem saker turas om (vanta.ordning): tuggar på pennan och
// kliar sig bakom örat med den, sneglar på ölen, otåliga ben, kikar ner mot
// pulten och håller upp kupongen mot lysröret och vänder på den. När kupongen
// är inne sätts pennan bakom örat, kupongen läggs upp och ner på
// fönsterbänken och handen tar flaskan, burken eller cigaretten – först ett
// bloss eller en lång klunk, sedan de vanliga looparna.
//
// figurer(canvas, { calm, vader }) → { draw(t, mx, my), inne(vem, t), ute(vader) }:
// ute klär om gänget efter vädret (dress) och sätter ljuset från fönstret.
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

// Lagen: färgerna, ränderna och smeknamnen, och på halsduken och mössan
// sköldarna (ESPN:s bilder, rum/skold-*.png). DL håller på Nacional (vitt,
// blått och rött, Bolso), DT på Chelsea (kungsblått; lejonet är inte
// klubbens) och DJ på IFK Göteborg (blåvitt).
const LAG = {
  dl: { vit: '#f3eee3', bla: '#1d3683', rod: '#c4202e', skold: 'rum/skold-nacional.png' },
  dt: { bla: '#2456b8', mork: '#121c3a', vit: '#f1ede4' },
  dj: { bla: '#1a5cab', vit: '#f3f0e8', guld: '#d9b14e', skold: 'rum/skold-ifk.png' },
};

// Måtten ur v2 (alt7.py) och vad var och en gör: arm 0 är figurens högra
// (betraktarens vänstra) och arm 1 den vänstra. a/b = över- och underarm.
// Attiraljerna: DL en stickad halsduk, DT ett lejon på underarmen och DJ en
// randig mössa med tofs och märke (solglasögonen uppskjutna på den).
// vanta: armen med pennan och armen med kupongen medan man väntar, var
// flaskan/burken (sak) och cigaretten (cigg; DT:s ligger i askkoppen) står,
// var kupongen läggs (lagg: x·bredd, z·lår, vridning), åt vilket håll ölen
// står (blick), foten som trummar och i vilken ordning de fem sakerna kommer
// (förskjutna med fas, så att ingen gör samma sak som någon annan samtidigt).
const FIGS = [
  { key: 'dl', x: -400, turn: 22, tilt: -4, legs: 74, torso: 86, w: 50, depth: 30, neck: 12, neckR: 17, arm: 8.5, leg: 9, a: 42, b: 36,
    head: { rx: 56.7, ry: 70.65, rz: 54, hw: 63, hh: 78.5, cy: -5.5, taper: 0.06, noseY: 19, nose: [8, 7.6, 7.2], cheek: 0.08, ear: [0.15, 0.21, 0.16, 0.5] }, glasses: 0,
    hair: { style: 'krona', f: 41, s: 80, b: 135, temple: 17, templeW: 0.2, vol: 0.06, lift: 3, back: 0, n: 22, fine: 3, fineW: 0.32, g: 0.08, dark: 0.42, wob: 0.8, tip: 3, tipAt: 'fram', edge: 0.7, sideCut: 0.6, quiff: { dir: [0, 0.62, 0.78], h: 0.1, w: 0.3 } },
    halsduk: { text: 'BOLSO' }, does: ['vila', 'flaska'],
    vanta: { penna: 0, kupong: 1, sak: [1.32, 0.3], lagg: [0.92, 0.42, 1.25], blick: 1, fot: 1, ordning: [0, 3, 1, 4, 2], fas: 0 } },
  { key: 'dt', x: -186, turn: 8, tilt: 3, legs: 60, torso: 78, w: 45, depth: 28, neck: 11, neckR: 15, arm: 8, leg: 9.5, a: 39, b: 35,
    head: { rx: 50.16, ry: 75.33, rz: 52, hw: 57, hh: 81, cy: -5, taper: 0.25, noseY: 17, nose: [6, 10, 7], cheek: 0.03, noseRot: -0.35 }, glasses: 36,
    hair: { style: 'bakat', f: 44, s: 96, b: 156, temple: 6, vol: 0.12, lift: 6, back: 12, n: 20, fine: 4, fineW: 0.35, g: 0.06, dark: 0.36, wob: 0.3, slat: 0.55, tip: 7, tipAt: 'bak', edge: 0.7, sideCut: 0.3, quiff: { dir: [0, 0.72, 0.69], h: 0.08, w: 0.5 }, gr: 1.05 },
    tatuering: { arm: 0, text: 'BLUES', rot: -50 }, does: ['cigg', 'vila'],
    vanta: { penna: 0, kupong: 1, lagg: [0.98, 0.62, -0.25], blick: -1, fot: 0, ordning: [1, 4, 2, 0, 3], fas: 2.5 } },
  { key: 'dj', x: 36, turn: -20, tilt: -2, legs: 104, torso: 100, w: 42, depth: 24, neck: 18, neckR: 13, arm: 7, leg: 8, a: 48, b: 44,
    head: { rx: 49, ry: 75, rz: 50, hw: 54, hh: 84, cy: -6, taper: 0.22, noseY: 18, nose: [5.8, 9, 7.2], noseRot: -0.3 }, glasses: 36,
    hair: { style: 'svep', sw: 28, f: 50, s: 82, b: 140, temple: 5, vol: 0.1, lift: 7, back: 2, n: 18, fine: 4, fineW: 0.3, g: 0.075, dark: 0.4, wob: 0.4, tip: 6, tipAt: 'bak', edge: 0.7, sideCut: 0.45, quiff: { dir: [-0.3, 0.62, 0.72], h: 0.13, w: 0.42 }, gr: 1.07 },
    mossa: { f: 56, s: 76, b: 104, text: ['BLÅ', 'VITT'] }, beard: [1.024, -2], does: ['burk', 'prat'],
    vanta: { penna: 1, kupong: 0, sak: [-1.38, 0.3], cigg: [1.18, 0.62], lagg: [-1.22, 0.62, 0.3], blick: -1, fot: 0, ordning: [4, 2, 0, 3, 1], fas: 5 } },
];

// Kläderna efter vädret i Stockholm (v = Vader.nu(), via rum.js): känns-
// temperaturen avgör lagren – 0 hett (21° och mer), 1 varmt (15–21), 2 svalt
// (8–15), 3 kallt (1–8), 4 vinter (under 1) – regn ger regnjackor, sol
// solglasögonen på näsan och snöfall snö på axlarna. DT kavlar alltid upp
// ärmen på armen med lejonet.
//   ben: kort|lang, byxa: [färg, mörkare], troja: { farg, farg2, luva, ficka },
//   jacka: { typ: oppen|stangd, tyg: bomull|skinn|dun|parka|regn|flanell,
//            farg, farg2, luva: slat|pals, krage, tjock, tunn, upp: 0|1|'bada' }
function dress(key, v) {
  const k = v ? v.kanns : 17;
  const n = k >= 21 ? 0 : k >= 15 ? 1 : k >= 8 ? 2 : k >= 1 ? 3 : 4;
  const regn = !!v && (v.fall === 'regn' || v.fall === 'blandat') && n >= 1 && n <= 3;
  const d = { n, ben: n <= 1 ? 'kort' : 'lang', glas: !!v && !v.fall && v.sol > 8 && v.moln < 45, sno: !!v && v.fall === 'sno' && n >= 3 };
  if (key === 'dl') {
    if (n >= 2) { d.byxa = ['#c9bb98', '#b1a27d']; d.troja = { farg: '#2a3658', farg2: '#1c2642' }; }
    if (n === 3) d.jacka = { typ: 'oppen', tyg: 'bomull', farg: '#5d6142', farg2: '#43472f', krage: true };
    if (n === 4) d.jacka = { typ: 'stangd', tyg: 'parka', farg: '#24323f', farg2: '#172230', luva: 'slat', tjock: 1.6 };
    if (regn) d.jacka = { typ: n === 3 ? 'stangd' : 'oppen', tyg: 'regn', farg: '#e9b724', farg2: '#c99a12', luva: 'slat' };
  } else if (key === 'dt') {
    d.ben = n === 0 ? 'kort' : 'lang';
    if (n === 2) d.jacka = { typ: 'oppen', tyg: 'flanell', farg: '#8c2a24', farg2: '#1e1a1a', krage: true, tunn: true, upp: 'bada' };
    if (n === 3) d.jacka = { typ: 'oppen', tyg: 'skinn', farg: '#4a2e1e', farg2: '#2e1c12', krage: true, upp: 0 };
    if (n === 4) d.jacka = { typ: 'stangd', tyg: 'dun', farg: '#2f3e33', farg2: '#1f2a22', krage: true, tjock: 1.8, upp: 0 };
    if (regn) d.jacka = { typ: 'oppen', tyg: 'regn', farg: '#4f5a3a', farg2: '#39422a', luva: 'slat', upp: 0 };
  } else if (key === 'dj') {
    if (n >= 2) { d.byxa = ['#b8b4ab', '#a29d93']; d.troja = { farg: '#1d1d20', farg2: '#111113', luva: true, ficka: true }; }
    if (n === 3) d.jacka = { typ: 'stangd', tyg: 'dun', farg: '#161618', farg2: '#0b0b0c', krage: true, tjock: 1.5 };
    if (n === 4) d.jacka = { typ: 'stangd', tyg: 'dun', farg: '#161618', farg2: '#0b0b0c', krage: true, tjock: 2.2, luva: 'pals' };
    if (regn) d.jacka = { typ: 'stangd', tyg: 'regn', farg: '#18191c', farg2: '#0e0f11', luva: 'slat' };
  }
  return d;
}

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
  const hemi = new THREE.HemisphereLight('#d8d0b8', '#3a2a20', 0.42);
  scene.add(hemi);
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
  // fönstret bakom gänget: gatlyktorna på natten, dagsljuset på dagen (ute)
  const win = new THREE.DirectionalLight('#ffb35c', 0.35);
  win.position.set(-150, 320, -700);
  win.target.position.set(-150, -40, 0);
  scene.add(win, win.target);

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
    const cap = h.cap; // mössan: håret under den trycks ner, under kanten sticker det ut
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
        const sq = cap ? 0.12 + 0.88 * S(th, (cap.f * wf + cap.s * ws + cap.b * wb) * DEG - 0.06, (cap.f * wf + cap.s * ws + cap.b * wb) * DEG + 0.05) : 1;
        k = 1 + (k - 1) * sq;
        pos.push(dx * k * P.rx, dy * k * P.ry + (h.lift || 0) * fall * dy * sq, dz * k * P.rz - (h.back || 0) * fall * dy * sq);
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
    return g;
  }

  // ---------- attiraljerna: halsduken, tatueringen och mössan ----------

  // stickningen som bumpkarta: rätmaskor (V) i rader längs u (along) eller v
  function knitTex(along, cols, rows) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#3a3a3a';
    g.fillRect(0, 0, 128, 128);
    if (along === 'v') { g.translate(128, 0); g.rotate(Math.PI / 2); }
    g.filter = 'blur(1.2px)';
    g.fillStyle = '#d0d0d0';
    const cw = 128 / cols; const rh = 128 / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        for (const s of [-1, 1]) {
          g.save();
          g.translate((i + 0.5) * cw, (j + 0.5 + s * 0.22) * rh);
          g.rotate(s * 0.5);
          g.beginPath(); g.ellipse(0, 0, cw * 0.36, rh * 0.2, 0, 0, 2 * Math.PI); g.fill();
          g.restore();
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  // resåren i mössans uppvik: upphöjda ränder tvärs över
  const ribTex = canvasTex(64, 8, (g) => { for (let x = 0; x < 64; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, '#303030'); gr.addColorStop(0.5, '#d8d8d8'); gr.addColorStop(1, '#303030'); g.fillStyle = gr; g.fillRect(x, 0, 8, 8); } });
  ribTex.colorSpace = THREE.NoColorSpace;
  ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping;

  // Ett stickat band längs mittlinjen pts med normalerna nrm (tjockleken åt
  // det hållet): tvärsnittet är en rundad rektangel w × th och ändarna är
  // slutna. u = längden i enheter, v = tvärs över.
  function band(pts, nrm, w, th, n = 24) {
    const pos = []; const uv = []; const idx = [];
    const M = pts.length;
    const rows = [];
    let len = 0;
    for (let i = 0; i < M; i++) {
      if (i) len += pts[i].distanceTo(pts[i - 1]);
      const tg = pts[Math.min(i + 1, M - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
      const B = new THREE.Vector3().crossVectors(tg, nrm[i]).normalize();
      const N = new THREE.Vector3().crossVectors(B, tg);
      rows.push({ c: pts[i], N, B, k: 1, u: len });
    }
    rows.unshift({ ...rows[0], k: 0 });
    rows.push({ ...rows[rows.length - 1], k: 0 });
    for (const r of rows) {
      for (let j = 0; j <= n; j++) {
        const a = j / n * 2 * Math.PI;
        const ca = Math.cos(a); const sa = Math.sin(a);
        const bx = Math.sign(ca) * Math.abs(ca) ** 0.35 * w / 2 * r.k;
        const ny = Math.sign(sa) * Math.abs(sa) ** 0.35 * th / 2 * r.k;
        pos.push(r.c.x + r.B.x * bx + r.N.x * ny, r.c.y + r.B.y * bx + r.N.y * ny, r.c.z + r.B.z * bx + r.N.z * ny);
        uv.push(r.u, (1 - ca) / 2);
      }
    }
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j; const b = a + n + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    g.userData.len = len;
    return g;
  }
  // halsdukens färger längs bandet: segs = [[u0, u1, färg]] på botten
  // (färgen bg), text = [u0, u1, ord, färg], skold = [u0, u1, bild] (upprätt
  // på en hängande ände); ppu bildpunkter per enhet
  function scarfTex(L, w, bg, segs, text, skold) {
    const ppu = 16; const H = 128;
    return canvasTex(Math.ceil(L * ppu), H, (g, W) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (const [a, b, col] of segs) { g.fillStyle = col; g.fillRect(a * ppu, 0, (b - a) * ppu, H); }
      if (skold && skold[2]) {
        const [a, b, img] = skold;
        const s = Math.min((b - a) / img.height, w * 0.82 / img.width) * (H / w);
        g.save();
        g.translate((a + b) / 2 * ppu, H / 2);
        g.scale(ppu / (H / w), 1);
        g.rotate(-Math.PI / 2);
        g.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s);
        g.restore();
      }
      if (text) {
        const [a, b, str, col] = text;
        g.save();
        g.translate((a + b) / 2 * ppu, H / 2 + 4);
        g.scale(ppu / (H / w), 1);
        g.font = '900 84px "Arial Black", "Helvetica Neue", Arial, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        const fit = Math.min(1, (b - a) * (H / w) / g.measureText(str).width);
        g.scale(fit, 1);
        g.fillStyle = col; g.fillText(str, 0, 0);
        g.restore();
      }
    });
  }

  // DL:s halsduk i Nacionals trikolor: ett varv runt halsen och båda ändarna
  // fram på ena sidan, den längre med BOLSO, den kortare med skölden, fransar
  // längst ner.
  // Byggd i bröstets axlar så att den följer bålen.
  function halsduk(F, prof, parent) {
    const C = LAG[F.key];
    const T = F.torso; const sz = F.depth / F.w;
    const rAt = (y) => { if (y <= prof[0].y) return prof[0].x; for (let i = 1; i < prof.length; i++) { const a = prof[i - 1]; const b = prof[i]; if (y <= b.y) return b.y > a.y ? a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y) : b.x; } return 0; };
    const zAt = (x, y) => Math.sqrt(Math.max(0, rAt(y) ** 2 - x * x)) * sz + 1.8;
    const W = 16; const TH = 5;
    const knit = knitTex('u', 1, 7);
    knit.repeat.set(1 / 1.6, 1);
    const wool = (map) => mat('#ffffff', { map, bumpMap: knit, bumpScale: 1.4, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') });
    const grp = [[0, 4, C.bla], [4, 6.5, C.rod], [6.5, 10.5, C.bla]];
    const at = (u0) => grp.map(([a, b, col]) => [u0 + a, u0 + b, col]);
    // en ände: kontrollpunkter (x, y) längs bröstet; under bysten hänger den
    // fritt och lite framåt (bålen lutar fram)
    function end(ctrl, off) {
      const cur = new THREE.CatmullRomCurve3(ctrl.map(([x, y]) => new THREE.Vector3(x, y, 0)));
      const pts = []; const nrm = [];
      let zMax = -1e9; let yPrev = 0;
      for (const q of cur.getSpacedPoints(48)) {
        let z = zAt(q.x, q.y);
        const e = 0.5;
        const n = new THREE.Vector3(-(zAt(q.x + e, q.y) - zAt(q.x - e, q.y)) / (2 * e), -(zAt(q.x, q.y + e) - zAt(q.x, q.y - e)) / (2 * e), 1).normalize();
        if (z < zMax) { z = zMax + 0.12 * (yPrev - q.y); n.set(0, 0.12, 1).normalize(); }
        zMax = z; yPrev = q.y;
        pts.push(new THREE.Vector3(q.x, q.y, z).addScaledVector(n, off));
        nrm.push(n);
      }
      return { pts, nrm };
    }
    function fringe(e, cols) {
      const P = e.pts[e.pts.length - 1];
      const tg = P.clone().sub(e.pts[e.pts.length - 3]).normalize();
      const B = new THREE.Vector3().crossVectors(tg, e.nrm[e.nrm.length - 1]).normalize();
      const down = new THREE.Vector3(0, -1, 0.1).normalize();
      for (let i = 0; i < 8; i++) {
        const x = (i / 7 - 0.5) * (W - 2.6);
        const a = P.clone().addScaledVector(B, x).addScaledVector(tg, -0.6);
        const b = a.clone().addScaledVector(down.clone().lerp(tg, 0.4).normalize(), 5.5 + 2.2 * hash(i + F.x)).add(new THREE.Vector3(0.6 * Math.sin(i * 2.3), 0, 0.5 * Math.cos(i * 1.7)));
        capsule(a.toArray(), b.toArray(), 0.85, mat(cols[i % cols.length], { roughness: 0.7, sheen: 0.5 }), parent);
      }
    }
    // varvet runt halsen, lite lägre fram
    const ring = []; const rn = [];
    const R = F.neckR * 1.1 + 5.5;
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * 2 * Math.PI;
      ring.push(new THREE.Vector3(R * Math.sin(a), T + 5.5 - 2.2 * Math.cos(a), R * Math.cos(a)));
      rn.push(new THREE.Vector3(Math.sin(a), 0.25, Math.cos(a)).normalize());
    }
    const rt = scarfTex(34, 13, C.vit, at(20));
    rt.wrapS = THREE.RepeatWrapping; rt.repeat.x = 1 / 34;
    mesh(band(ring, rn, 13, 8.5, 28), wool(rt), parent);
    // ändarna: A (längre, med texten) och B (kortare, med skölden) ovanpå den
    const A = end([[-7, T + 1], [-8, T - 6], [-9, T - 16], [-10, T - 30], [-11, T - 44], [-12, T - 56]], TH / 2);
    const Bn = end([[-17, T + 1], [-21, T - 6], [-25, T - 15], [-29, T - 27], [-32, T - 38]], TH * 1.4);
    for (const [e, len] of [[A, 'A'], [Bn, 'B']]) {
      const g = band(e.pts, e.nrm, W, TH);
      const L = g.userData.len;
      const tx = len === 'A'
        ? scarfTex(L, W, C.vit, [...at(L - 10.5), ...at(L - 53)], [L - 40.5, L - 13, F.halsduk.text, C.bla])
        : scarfTex(L, W, C.vit, [...at(L - 10.5), ...at(L - 37)], null, [L - 26, L - 10.5, skold[F.key]]);
      tx.repeat.x = 1 / L;
      mesh(g, wool(tx), parent);
      fringe(e, [C.rod, C.vit, C.bla]);
    }
  }

  // DT:s tatuering: ett lejonhuvud i gammal stil (manen kungsblå, konturerna
  // mörkblå, ansiktet i hudens färg) med ett band under; målad på ett skal
  // runt underarmen. Lejonet är inget klubbmärke.
  function tatTex(text) {
    const C = LAG.dt;
    return canvasTex(512, 600, (g) => {
      // upp och ner: lejonet står upprätt när armen hänger (huvudet mot armbågen)
      g.translate(512, 600); g.rotate(Math.PI);
      g.lineJoin = 'round'; g.lineCap = 'round';
      const cx = 256; const cy = 222;
      // manen: lockar i två lager runt huvudet, svängda åt samma håll
      const locks = (n, r0, r1, w, fill, off) => {
        for (let i = 0; i < n; i++) {
          const a = ((i + off) / n) * 2 * Math.PI;
          const L = r1 + [0, 22, 8, 30, 14][i % 5];
          const tip = [cx + Math.cos(a + 0.34) * L, cy + Math.sin(a + 0.34) * L * 1.06];
          g.beginPath();
          g.moveTo(cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0 * 1.06);
          g.quadraticCurveTo(cx + Math.cos(a - w * 0.4) * (r0 + L) / 2 * 1.1, cy + Math.sin(a - w * 0.4) * (r0 + L) / 2 * 1.16, ...tip);
          g.quadraticCurveTo(cx + Math.cos(a + w * 0.9) * (r0 + L) / 2, cy + Math.sin(a + w * 0.9) * (r0 + L) / 2 * 1.06, cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0 * 1.06);
          g.closePath();
          g.fillStyle = fill; g.fill(); g.lineWidth = 9; g.strokeStyle = C.mork; g.stroke();
        }
      };
      locks(20, 120, 205, 0.24, C.bla, 0);
      locks(16, 105, 165, 0.27, '#4d84de', 0.5);
      // öronen, halvt i manen
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(cx + s * 52, cy - 84); g.quadraticCurveTo(cx + s * 92, cy - 132, cx + s * 104, cy - 70); g.closePath();
        g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore();
        g.lineWidth = 10; g.stroke();
        g.beginPath(); g.moveTo(cx + s * 66, cy - 86); g.quadraticCurveTo(cx + s * 88, cy - 112, cx + s * 94, cy - 78); g.closePath(); g.fillStyle = C.mork; g.fill();
      }
      // ansiktet: brett över ögonen, smalare mot nosen; huden syns
      const face = new Path2D();
      face.moveTo(cx, cy - 98);
      face.bezierCurveTo(cx + 70, cy - 98, cx + 100, cy - 62, cx + 98, cy - 8);
      face.bezierCurveTo(cx + 96, cy + 46, cx + 66, cy + 100, cx, cy + 112);
      face.bezierCurveTo(cx - 66, cy + 100, cx - 96, cy + 46, cx - 98, cy - 8);
      face.bezierCurveTo(cx - 100, cy - 62, cx - 70, cy - 98, cx, cy - 98);
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(face); g.restore();
      g.strokeStyle = C.mork; g.lineWidth = 12; g.stroke(face);
      // pannan och nosryggen: bryn som sänks mot mitten, ryggen ner mot nosen
      g.lineWidth = 10;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(cx + s * 14, cy - 30); g.quadraticCurveTo(cx + s * 40, cy - 52, cx + s * 78, cy - 40); g.stroke();
        g.beginPath(); g.moveTo(cx + s * 16, cy - 26); g.quadraticCurveTo(cx + s * 10, cy + 6, cx + s * 22, cy + 30); g.stroke();
        // ögat: smalt och snett, med en ljus glimt
        g.beginPath(); g.moveTo(cx + s * 26, cy - 18); g.quadraticCurveTo(cx + s * 50, cy - 34, cx + s * 74, cy - 24); g.quadraticCurveTo(cx + s * 52, cy - 6, cx + s * 26, cy - 18); g.closePath();
        g.fillStyle = C.mork; g.fill();
        g.beginPath(); g.ellipse(cx + s * 50, cy - 21, 8, 6, 0, 0, 2 * Math.PI); g.fillStyle = '#6f9fe8'; g.fill();
        g.beginPath(); g.arc(cx + s * 50, cy - 21, 3, 0, 2 * Math.PI); g.fillStyle = C.mork; g.fill();
        // morrhårsdynorna med prickar
        g.beginPath(); g.arc(cx + s * 24, cy + 60, 26, s > 0 ? -0.3 : Math.PI + 0.3, s > 0 ? 2.1 : Math.PI - 2.1, s < 0); g.lineWidth = 9; g.stroke();
        g.fillStyle = C.mork;
        for (const [dx, dy] of [[22, 56], [36, 50], [36, 66]]) { g.beginPath(); g.arc(cx + s * dx, cy + dy, 4.5, 0, 2 * Math.PI); g.fill(); }
      }
      // nosen: bred och mörk
      g.beginPath(); g.moveTo(cx - 34, cy + 28); g.quadraticCurveTo(cx, cy + 16, cx + 34, cy + 28); g.quadraticCurveTo(cx + 26, cy + 48, cx, cy + 56); g.quadraticCurveTo(cx - 26, cy + 48, cx - 34, cy + 28); g.closePath();
      g.fillStyle = C.mork; g.fill();
      g.beginPath(); g.ellipse(cx - 10, cy + 30, 8, 4, -0.2, 0, 2 * Math.PI); g.fillStyle = '#6f9fe8'; g.fill();
      // munnen, lite öppen
      g.beginPath(); g.moveTo(cx - 24, cy + 86); g.quadraticCurveTo(cx, cy + 78, cx + 24, cy + 86); g.quadraticCurveTo(cx, cy + 104, cx - 24, cy + 86); g.closePath();
      g.fillStyle = C.mork; g.fill();
      g.beginPath(); g.moveTo(cx, cy + 56); g.lineTo(cx, cy + 80); g.lineWidth = 8; g.stroke();
      // bandet med texten
      const by = 492; const bw = 132; const bh = 50;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(cx + s * (bw - 16), by - bh / 2 + 16); g.lineTo(cx + s * (bw + 44), by - bh / 2 + 16); g.lineTo(cx + s * (bw + 26), by + 14); g.lineTo(cx + s * (bw + 44), by + bh / 2 + 16); g.lineTo(cx + s * (bw - 16), by + bh / 2 + 16); g.closePath();
        g.fillStyle = C.mork; g.fill(); g.lineWidth = 9; g.stroke();
      }
      g.beginPath();
      g.moveTo(cx - bw, by - bh / 2); g.quadraticCurveTo(cx, by - bh / 2 - 22, cx + bw, by - bh / 2);
      g.lineTo(cx + bw, by + bh / 2); g.quadraticCurveTo(cx, by + bh / 2 - 22, cx - bw, by + bh / 2); g.closePath();
      g.fillStyle = C.bla; g.fill(); g.lineWidth = 10; g.stroke();
      g.font = '900 52px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = C.vit; g.fillText(text, cx, by - 6);
    });
  }
  function tatuering(F, A) {
    const r = F.arm * 0.92 + 0.22;
    const h = F.b * 0.76;
    const L = (h * 512 / 600) / r;
    const m = mat('#ffffff', { map: tatTex(F.tatuering.text), transparent: true, opacity: 0.94, alphaTest: 0.04, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }, 'hud');
    const x = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true, -L / 2, L), m);
    x.receiveShadow = true;
    x.position.y = -F.b * 0.1;
    A.lo.add(x);
    return x;
  }

  // DJ:s mössa i blåvitt: lodräta ränder (som tröjan), uppvik med skölden
  // som märke mellan BLÅ och VITT, och en tofs. Följer huvudet; kanten
  // (f/s/b = grader från hjässan fram, på sidan och bak) bestämmer också var
  // håret trycks ner.
  function mossa(F, P, parent) {
    const C = LAG[F.key];
    const m = F.mossa;
    const lim = (a) => { const ca = Math.cos(a); const sa = Math.sin(a); return (m.f * Math.max(0, ca) ** 2 + m.s * sa * sa + m.b * Math.max(0, -ca) ** 2) * DEG; };
    const dir = (th, a) => new THREE.Vector3(Math.sin(th) * Math.sin(a), Math.cos(th), Math.sin(th) * Math.cos(a));
    const at = (th, a, k) => dir(th, a).multiply(new THREE.Vector3(P.rx, P.ry, P.rz)).multiplyScalar(k);
    const N = 160; const M = 48;
    const NS = 18; // ränderna
    const ch = 12.5; // uppvikets höjd i enheter
    const hAt = (a, L) => ch / at(L, a, 1.1).length();
    // själva mössan: ett skal över hjässan, lite kupigt, tätt mot huvudet under uppviket
    const pos = []; const uv = []; const idx = [];
    for (let i = 0; i <= N; i++) {
      const a = i / N * 2 * Math.PI;
      const L = lim(a);
      const hth = hAt(a, L);
      for (let j = 0; j <= M; j++) {
        const t = j / M;
        const k = 1.085 + 0.035 * (1 - t) ** 1.5 + 0.012 * Math.sin(t * Math.PI) - 0.065 * (1 - THREE.MathUtils.smoothstep(L - t * L, 0.02, hth * 0.8));
        const p = at(t * L, a, k);
        pos.push(p.x, p.y, p.z);
        uv.push(i / N + 0.5 / NS, 1 - t);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j; const b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const stripes = canvasTex(NS * 32, 8, (c, w) => { for (let i = 0; i < NS; i++) { c.fillStyle = i % 2 ? C.bla : C.vit; c.fillRect(i * 32, 0, 32, 8); } });
    stripes.wrapS = THREE.RepeatWrapping;
    const kn = knitTex('v', 2, 2);
    kn.repeat.set(48, 14);
    const wool = { bumpMap: kn, bumpScale: 1.1, roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.3, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') };
    mesh(g, mat('#ffffff', { map: stripes, ...wool }), parent);
    // uppviket: ett rundat band längs kanten, nertill tätt mot pannan, med texten fram
    const cp = []; const cu = []; const ci = [];
    const n = 24;
    for (let i = 0; i <= N; i++) {
      const a = i / N * 2 * Math.PI;
      const L = lim(a);
      const hth = hAt(a, L);
      for (let j = 0; j <= n; j++) {
        const q = j / n * 2 * Math.PI;
        const cq = Math.cos(q); const sq = Math.sin(q);
        const f = 0.5 - Math.sign(cq) * Math.abs(cq) ** 0.4 / 2; // 0 nertill, 1 upptill
        const th = L + 0.012 - f * hth;
        const k = 1.014 + 0.062 * f + 0.031 + Math.sign(sq) * Math.abs(sq) ** 0.4 * 0.031;
        const p = at(th, a, k);
        cp.push(p.x, p.y, p.z);
        cu.push(i / N + 0.5, (1 - cq) / 2);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j; const b = a + n + 1; ci.push(a, b, a + 1, a + 1, b, b + 1); }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    cg.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2));
    cg.setIndex(ci);
    cg.computeVertexNormals();
    const img = skold[F.key];
    const PH = ch * 0.96; // märkets höjd och halva bredd i enheter
    const PW = img ? (PH - 1) * img.width / img.height / 2 + 0.5 : 0;
    const circ = 2 * Math.PI * P.rx * 1.12;
    const circF = 2 * Math.PI * Math.sin(lim(0)) * P.rx * 1.11; // omkretsen fram
    const cuffTex = canvasTex(2048, 128, (c, w, h) => {
      c.fillStyle = C.bla; c.fillRect(0, 0, w, h);
      c.fillStyle = C.vit; c.fillRect(0, 10, w, 7); c.fillRect(0, h - 17, w, 7);
      c.save();
      c.translate(w / 2, h / 2 + 3);
      const sx = (w / circ) / (h / ch);
      c.scale(sx, 1);
      c.font = '900 64px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      c.textBaseline = 'middle';
      // BLÅ och VITT på var sin sida om märket
      const gap = img ? (PW + 1.6) * w / circF / sx : 0;
      if (img) { c.textAlign = 'right'; c.fillText(m.text[0], -gap, 0); c.textAlign = 'left'; c.fillText(m.text[1], gap, 0); }
      else { c.textAlign = 'center'; c.fillText(m.text.join(''), 0, 0); }
      c.restore();
    });
    cuffTex.wrapS = THREE.RepeatWrapping;
    const rib = ribTex.clone();
    rib.repeat.set(140, 1);
    mesh(cg, mat('#ffffff', { map: cuffTex, ...wool, bumpMap: rib, bumpScale: 1.2 }), parent);
    // märket: skölden isydd mitt fram på uppviket, med en kant av guldtråd
    if (img) {
      const badge = canvasTex(256, Math.round(256 * PH / (2 * PW)), (c, w, h) => {
        const e = 256 * 0.5 / (2 * PW); // kanten (en halv enhet)
        const iw = w - 2 * e; const ih = h - 2 * e;
        const sil = document.createElement('canvas');
        sil.width = w; sil.height = h;
        const sc = sil.getContext('2d');
        sc.drawImage(img, e, e, iw, ih);
        sc.globalCompositeOperation = 'source-in';
        sc.fillStyle = C.guld; sc.fillRect(0, 0, w, h);
        for (let i = 0; i < 16; i++) { const a = i / 16 * 2 * Math.PI; c.drawImage(sil, Math.cos(a) * e * 0.9, Math.sin(a) * e * 0.9); }
        c.drawImage(img, e, e, iw, ih);
      });
      const bp = []; const bu = []; const bi = [];
      const NI = 24;
      const da = PW / (Math.sin(lim(0)) * P.rx * 1.11);
      for (let i = 0; i <= NI; i++) {
        const a = (i / NI * 2 - 1) * da;
        const L = lim(a);
        const hth = hAt(a, L);
        for (let j = 0; j <= NI; j++) {
          const f = 0.02 + 0.96 * j / NI;
          const p = at(L + 0.012 - f * hth, a, 1.083 + 0.062 * f);
          bp.push(p.x, p.y, p.z);
          bu.push(i / NI, j / NI);
        }
      }
      for (let i = 0; i < NI; i++) for (let j = 0; j < NI; j++) { const a = i * (NI + 1) + j; const b = a + NI + 1; bi.push(a, b, a + 1, a + 1, b, b + 1); }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
      bg.setAttribute('uv', new THREE.Float32BufferAttribute(bu, 2));
      bg.setIndex(bi);
      bg.computeVertexNormals();
      mesh(bg, mat('#ffffff', { map: badge, alphaTest: 0.5, bumpMap: badge, bumpScale: 0.8, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.2, polygonOffset: true, polygonOffsetFactor: -2 }), parent);
    }
    // tofsen: en lurvig boll av garn i båda färgerna
    const pg = new THREE.SphereGeometry(1, 64, 48);
    const pp = pg.attributes.position;
    const pc = [];
    const blue = new THREE.Color(C.bla); const white = new THREE.Color(C.vit);
    for (let i = 0; i < pp.count; i++) {
      const d = new THREE.Vector3(pp.getX(i), pp.getY(i), pp.getZ(i));
      const lump = 0.1 * Math.sin(d.x * 9 + 1) * Math.sin(d.y * 8 + 2) * Math.sin(d.z * 10) + 0.06 * Math.sin(d.x * 23 + d.y * 19 - d.z * 17) + 0.04 * Math.sin(d.x * 41 - d.z * 37 + d.y * 29);
      d.multiplyScalar(12 * (1 + lump));
      pp.setXYZ(i, d.x, d.y, d.z);
      const w = Math.sin(d.x * 0.9 + 0.4) * Math.sin(d.y * 1.1) * Math.sin(d.z * 0.8 + 1) > 0 ? white : blue;
      pc.push(w.r, w.g, w.b);
    }
    pg.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
    pg.computeVertexNormals();
    const yarn = knitTex('v', 6, 1);
    yarn.repeat.set(6, 4);
    const pom = mesh(pg, mat('#ffffff', { vertexColors: true, bumpMap: yarn, bumpScale: 2, roughness: 0.75, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff') }), parent);
    pom.position.copy(at(0.1, Math.PI, 1.135)).add(new THREE.Vector3(0, 6, 0));
    // solglasögonens plats: precis ovanför uppviket fram
    return at(m.f * DEG - ch / (P.ry * 0.9) - 0.12, 0, 1.14);
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
    g.userData.bottom = -24;
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
    g.userData.bottom = -17.4;
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
  // kupongpennan längs x, spetsen vid +x – gul, så att den syns mot händerna
  // och tröjorna
  const PEN_TIP = 11.6;
  const PEN_END = -9;
  function pencil(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const along = (x, geo, m) => { const e = mesh(geo, m, g); e.rotation.z = -Math.PI / 2; e.position.x = x; return e; };
    along(0, new THREE.CylinderGeometry(1.05, 1.05, 15, 6), mat('#e8b52c', { roughness: 0.4, clearcoat: 0.5 }));
    along(9.3, new THREE.ConeGeometry(1.05, 3.6, 6), mat('#e2c08c', { roughness: 0.75 }));
    along(10.9, new THREE.ConeGeometry(0.32, 1.4, 8), mat('#2a2a2a', { roughness: 0.4 }));
    along(-8.2, new THREE.CylinderGeometry(1.12, 1.12, 1.6, 12), mat('#9a978f', { metalness: 0.6, roughness: 0.35 }));
    return g;
  }
  // kupongen: ett litet papper, tryckt på båda sidorna (texturerna ritas när
  // typsnitten har laddats, se nedan)
  const KW = 34;
  const KH = 24;
  const kupTex = {};
  function coupon(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const paper = { roughness: 0.85, clearcoat: 0, envMapIntensity: 0.3 };
    mesh(new THREE.PlaneGeometry(KW, KH), mat('#ffffff', { map: kupTex.fram, ...paper }), g).position.z = 0.06;
    const back = mesh(new THREE.PlaneGeometry(KW, KH), mat('#ffffff', { map: kupTex.bak, ...paper }), g);
    back.position.z = -0.06;
    back.rotation.y = Math.PI;
    return g;
  }
  function drawCoupon(g, w, h, back) {
    g.fillStyle = '#f3e9d4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8643a'; g.fillRect(0, 0, w, 34);
    g.fillStyle = '#f6ecd9'; g.textBaseline = 'middle';
    g.font = '800 17px Fraunces, Georgia, serif';
    g.fillText(back ? 'MATCHFIXARNA' : 'TIPSKUPONG', 14, 18);
    if (back) {
      g.fillStyle = 'rgba(90, 70, 40, 0.28)';
      for (let i = 0; i < 6; i++) g.fillRect(14, 52 + i * 20, i % 3 === 2 ? 120 : 220, 5);
      return;
    }
    g.strokeStyle = '#9a876a'; g.lineWidth = 1.6;
    for (let r = 0; r < 8; r++) {
      const y = 44 + r * 16.5;
      g.fillStyle = 'rgba(70, 58, 40, 0.45)'; g.fillRect(14, y + 4, 70 + (r * 37) % 50, 4);
      for (let c = 0; c < 3; c++) g.strokeRect(160 + c * 30, y, 22, 12);
    }
    // två tveksamma kryss och ett suddat
    g.strokeStyle = '#3a3632'; g.lineWidth = 2.4; g.lineCap = 'round';
    for (const [c, r, a] of [[0, 1, 1], [2, 3, 1], [1, 5, 0.25]]) {
      g.globalAlpha = a;
      const x = 160 + c * 30; const y = 44 + r * 16.5;
      g.beginPath(); g.moveTo(x + 3, y + 2); g.lineTo(x + 19, y + 10); g.moveTo(x + 19, y + 2); g.lineTo(x + 3, y + 10); g.stroke();
    }
    g.globalAlpha = 1;
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

  // ---------- kläderna efter vädret ----------

  // flanellens rutor: mörka band över tygets färg (map gånger färgen)
  const plaidTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(24,18,18,.62)'; g.fillRect(0, 44, 128, 40); g.fillRect(44, 0, 40, 128);
    g.fillStyle = 'rgba(24,18,18,.35)'; g.fillRect(0, 104, 128, 6); g.fillRect(104, 0, 6, 128);
    g.fillStyle = 'rgba(255,236,210,.3)'; g.fillRect(0, 20, 128, 3); g.fillRect(20, 0, 3, 128);
  });
  plaidTex.colorSpace = THREE.NoColorSpace;
  const plaid = (rx, ry) => { const t = plaidTex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return t; };
  // jackans tyg: matt bomull och parkas, blankt skinn, glänsande nylon (dun, regn), rutig flanell
  function jackMat(J, extra = {}) {
    const o = {
      bomull: { roughness: 0.62, clearcoat: 0.3, bumpMap: denim, bumpScale: 0.5 },
      parka: { roughness: 0.72, clearcoat: 0.25, bumpMap: knit, bumpScale: 0.4 },
      skinn: { roughness: 0.32, clearcoat: 0.75, clearcoatRoughness: 0.28, bumpMap: knit, bumpScale: 0.25 },
      dun: { roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.16 },
      regn: { roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 },
      flanell: { roughness: 0.82, clearcoat: 0.12, sheen: 0.5, sheenRoughness: 0.7, map: plaid(5, 3) },
    }[J.tyg] || {};
    return mat(J.farg, { side: J.typ === 'oppen' ? THREE.DoubleSide : THREE.FrontSide, ...o, ...extra });
  }
  const edgeMat = (J) => mat(J.farg2, { roughness: J.tyg === 'regn' || J.tyg === 'dun' || J.tyg === 'skinn' ? 0.28 : 0.62, clearcoat: 0.5 });
  const snowMat = mat('#f4f7fa', { roughness: 0.9, clearcoat: 0, sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff') });

  // Jackan: ett skal utanpå tröjan (bålens profil, lite vidare och längre),
  // öppen fram med kanterna markerade eller stängd med dragkedja; dunjackan
  // har kanaler. Krage, luva och pälskant efter J. Ger profilen tillbaka, så
  // att halsduken kan ligga utanpå.
  function jacka(F, J, chest) {
    const Wd = F.w; const T = F.torso; const sz = F.depth / Wd;
    const tk = J.tunn ? 0.4 : J.tjock || 1;
    const base = [[0.86, -0.04], [0.89, 0.1], [0.93, 0.45], [1, 0.75], [1.03, 0.86], [0.95, 0.96], [0.64, 1.02], [0.38, 1.05]];
    const rAt = (h) => { for (let i = 1; i < base.length; i++) if (h <= base[i][1]) { const [a0, b0] = base[i - 1]; const [a1, b1] = base[i]; return a0 + (a1 - a0) * (h - b0) / (b1 - b0); } return base[base.length - 1][0]; };
    const pts = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const h = base[0][1] + (base[base.length - 1][1] - base[0][1]) * i / N;
      let r = rAt(h) * Wd + 2.6 + 1.6 * tk;
      if (J.tyg === 'dun') r += 1.6 * Math.sqrt(tk) * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * (h + 0.04) / 0.17), 0.6) * (h < 0.97 ? 1 : 0.3);
      pts.push(new THREE.Vector2(r, h * T));
    }
    const open = J.typ === 'oppen';
    const gap = open ? 0.34 : 0;
    const m = jackMat(J);
    const edge = edgeMat(J);
    mesh(new THREE.LatheGeometry(pts, 120, gap, 2 * Math.PI - 2 * gap), m, chest).scale.z = sz;
    // en tub längs skalet: lodrätt vid vinkeln phi, eller vågrätt runt på höjden y
    const at = (phi, r, y) => new THREE.Vector3(Math.sin(phi) * r, y, Math.cos(phi) * r * sz);
    const tube = (list, rad, mt) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(list), Math.max(24, list.length * 3), rad, 8, false), mt, chest);
    const around = (i, off, rad, mt) => tube(Array.from({ length: 41 }, (_, j) => at(gap + (2 * Math.PI - 2 * gap) * j / 40, pts[i].x + off, pts[i].y)), rad, mt);
    if (open) for (const s of [-1, 1]) tube(pts.filter((_, i) => i % 3 === 0).map((p) => at(s * gap, p.x + 0.4, p.y)), 1.7, edge);
    else {
      tube(pts.filter((_, i) => i % 3 === 0).map((p) => at(0, p.x + 0.5, p.y)), 0.8, mat('#1a1a1c', { roughness: 0.4, metalness: 0.4 }));
      const pull = mesh(new RoundedBoxGeometry(2.6, 4.2, 1.2, 2, 0.5), mat('#9a9a96', { metalness: 0.8, roughness: 0.3 }), chest);
      pull.position.copy(at(0, pts[N - 4].x + 1.6, pts[N - 4].y - 3));
    }
    around(0, 0.4, 1.6 + 0.3 * tk, edge);
    // kragen: nedvikt på den öppna, en hög krage på den stängda
    const top = pts[N];
    if (J.krage) {
      const cp = open ? [new THREE.Vector2(top.x - 1, top.y), new THREE.Vector2(top.x + 5, top.y + 4)] : [new THREE.Vector2(top.x - 0.5, top.y - 1), new THREE.Vector2(F.neckR + 5, top.y + 9)];
      mesh(new THREE.LatheGeometry(cp, 64, gap * 0.8, 2 * Math.PI - 1.6 * gap), mat(J.tyg === 'flanell' ? J.farg : J.farg2, { side: THREE.DoubleSide, roughness: 0.55, clearcoat: 0.4 }), chest).scale.z = sz;
    } else around(N, 0.3, 1.5, edge);
    // luvan nedfälld på ryggen, och pälskanten runt halsen
    if (J.luva) ellipsoid([0, T * 1.0, -(F.depth * 0.62 + 4)], [Wd * 0.48, 10, 9], m, chest);
    if (J.luva === 'pals') {
      const fg = new THREE.TorusGeometry(F.neckR + 7.5, 5, 14, 64);
      const fp = fg.attributes.position;
      for (let i = 0; i < fp.count; i++) { const x = fp.getX(i); const y = fp.getY(i); const z = fp.getZ(i); const k = 1 + 0.08 * Math.sin(x * 1.7 + y * 2.3) * Math.sin(z * 3.1 + x); fp.setXYZ(i, x * k, y * k, z * k); }
      fg.computeVertexNormals();
      const fur = mesh(fg, mat('#8d7c64', { roughness: 1, clearcoat: 0, sheen: 1, sheenRoughness: 0.9, sheenColor: new THREE.Color('#e8dcc8'), bumpMap: knit, bumpScale: 3 }), chest);
      fur.rotation.x = Math.PI / 2;
      fur.position.y = T * 1.04;
      fur.scale.y = sz * 1.15;
    }
    // fickor på bomullsjackan och parkasen
    if (J.tyg === 'bomull' || J.tyg === 'parka') {
      for (const s of [-1, 1]) {
        const y = T * 0.26; const x = s * Wd * 0.52; const r = rAt(0.26) * Wd + 2.6 + 1.6 * tk;
        const flap = mesh(new RoundedBoxGeometry(Wd * 0.42, 5, 1.6, 2, 0.6), edge, chest);
        flap.position.set(x, y, Math.sqrt(Math.max(0, r * r - x * x)) * sz + 0.6);
        flap.rotation.y = Math.atan2(x, Math.sqrt(Math.max(0, r * r - x * x)) * sz) * 0.9;
      }
    }
    return pts;
  }

  // ---------- figurerna ----------

  const tex = {};
  const skold = {}; // lagsköldarna, utan den genomskinliga kanten; saknas en blir det text i stället
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  function trim(img) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width; let y0 = c.height; let x1 = 0; let y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 16) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const o = document.createElement('canvas');
    o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext('2d').drawImage(c, -x0, -y0);
    return o;
  }
  await document.fonts.ready;
  await Promise.all([
    ...['dl', 'dt', 'dj'].map(async (k) => { tex[k] = await imgTex(`rum/ansikte-${k}.svg`); }),
    imgTex('rum/skagg-dj.svg').then((t) => { tex.dj_skagg = t; }),
    ...Object.entries(LAG).filter(([, c]) => c.skold).map(([k, c]) => loadImg(c.skold).then((i) => { skold[k] = trim(i); }, () => {})),
  ]);
  labelTex.needsUpdate = true;
  canTex.needsUpdate = true;
  kupTex.fram = canvasTex(260, 180, (g, w, h) => drawCoupon(g, w, h, false));
  kupTex.bak = canvasTex(260, 180, (g, w, h) => drawCoupon(g, w, h, true));

  const figs = [];
  for (const F of FIGS) figs.push(build(F, dress(F.key, opt.vader)));

  // D: kläderna (dress)
  function build(F, D) {
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
    const tee = fab(D.troja ? D.troja.farg : c.tee, { bumpMap: knit, bumpScale: 0.6 });
    // DT har jeans (jeansshorts när det är hett), DL och DJ shorts eller långbyxor
    const jeans = c.pants === 'jeans';
    const lang = D.ben === 'lang';
    const trou = fab(lang && D.byxa ? D.byxa[0] : c.trou, { bumpMap: jeans ? denim : knit, bumpScale: jeans ? 0.9 : 0.5 });
    const tee2 = fab(D.troja ? D.troja.farg2 : c.tee2);
    const trou2 = fab(lang && D.byxa ? D.byxa[1] : c.trou2);
    const shoe = mat(c.shoe, {}, 'sko');
    const sole = mat(c.sole, { roughness: 0.6 });
    const hipY = 11;

    // benen: låren framåt över kanten, underbenen hänger och dinglar
    const knees = [];
    const feet = [];
    for (const s of [-1, 1]) {
      const fx = s * Wd * 0.36;
      // låret lutar lite nedåt och utåt mot knät
      const hip = new THREE.Vector3(fx, hipY, 0);
      const kn = new THREE.Vector3(fx + s * 7, hipY - 7, thigh);
      const along = kn.clone().sub(hip).normalize();
      if (lang) {
        capsule(hip.toArray(), kn.toArray(), F.leg * 1.25, trou, fig);
      } else {
        capsule(hip.clone().lerp(kn, 0.5).toArray(), kn.toArray(), F.leg * 1.05, skin, fig);
        // shortsen: ett rör tätt om låret med uppvik ytterst (DT:s jeansshorts med ljus kant)
        const sh = mesh(new THREE.CylinderGeometry(F.leg * 1.32, F.leg * 1.45, thigh * 0.74, 32, 1, true), fab(c.trou, { bumpMap: jeans ? denim : knit, bumpScale: jeans ? 0.9 : 0.5, side: THREE.DoubleSide }), fig);
        sh.position.copy(hip.clone().lerp(kn, 0.33));
        sh.quaternion.setFromUnitVectors(UP, along);
        ring(hip.clone().lerp(kn, 0.68).toArray(), along.toArray(), F.leg * 1.3, 2.2, jeans ? fab(c.cuff, { bumpMap: denim, bumpScale: 0.6 }) : trou2, fig);
        const inner = mesh(new THREE.CircleGeometry(F.leg * 1.3, 24), mat('#3a3128', { roughness: 1 }), fig);
        inner.position.copy(hip.clone().lerp(kn, 0.66));
        inner.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), along);
      }
      const knee = new THREE.Group();
      knee.position.copy(kn);
      fig.add(knee);
      if (lang && jeans) {
        capsule([0, 0, 0], [0, -shin, 0], F.leg * 1.25, trou, knee);
        const cuff = mesh(new THREE.CylinderGeometry(F.leg * 1.42, F.leg * 1.45, 7, 32), fab(c.cuff, { bumpMap: denim, bumpScale: 0.6 }), knee);
        cuff.position.y = -shin + 4;
        capsule([s * F.leg * 1.22, -shin + 8, 0], [s * F.leg * 1.22, -2, 0], 0.55, mat('#c08a42', { roughness: 0.8 }), knee);
      } else if (lang) {
        // chinos: raka ben med en fåll vid vristen
        capsule([0, 0, 0], [0, -shin + 2, 0], F.leg * 1.25, trou, knee);
        mesh(new THREE.CylinderGeometry(F.leg * 1.33, F.leg * 1.36, 4, 32), trou2, knee).position.y = -shin + 2.5;
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
      feet.push(foot);
    }

    // bålen: höfterna, tröjan med veck, fållen och kragen, halsen och huvudet
    const torso = new THREE.Group();
    torso.position.set(0, hipY + 3, 0);
    fig.add(torso);
    const hipPts = lang ? [[Wd * 0.74, -6], [Wd * 0.82, 6], [Wd * 0.86, 14]] : [[Wd * 0.7, -12], [Wd * 0.82, 0], [Wd * 0.86, 14]];
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
    // luvtröjans luva på ryggen och snörena fram
    if (D.troja && D.troja.luva) {
      ellipsoid([0, T * 0.99, -(F.depth * 0.6 + 2)], [Wd * 0.46, 9, 8], tee, chest);
      for (const s of [-1, 1]) capsule([s * 4, T * 0.99, F.depth * 0.62 + 1], [s * 4.6, T * 0.8, F.depth * 0.98 + 1.2], 0.8, mat('#d8d4cc', { roughness: 0.8 }), chest);
    }
    // jackan utanpå, och halsduken utanpå jackan
    const outer = D.jacka ? jacka(F, D.jacka, chest) : prof;
    if (F.halsduk) halsduk(F, outer, chest);
    // snö på axlarna när det snöar
    if (D.sno) {
      for (const s of [-1, 1]) {
        ellipsoid([s * Wd * 0.56, T * 1.02 + 2, -1], [11, 2.6, 8], snowMat, chest, [0.1, 0, s * 0.3]);
        for (let j = 0; j < 4; j++) ellipsoid([s * Wd * (0.3 + 0.15 * j), T * (1.0 - 0.06 * j) + 3, 4 + 3 * hash(j + F.x)], [2.2, 1.2, 2], snowMat, chest);
      }
    }

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
    mesh(hairGeo(P, F.mossa ? { ...F.hair, cap: F.mossa } : F.hair, F.key.charCodeAt(1) * 131), mat('#ffffff', { map: ht, vertexColors: true, bumpMap: ht, bumpScale: 1.5 }, 'har'), hc);
    const onCap = F.mossa ? mossa(F, P, hc) : null;
    if (F.glasses) {
      const gl = glasses(P, hc, F.glasses, F.hair.gr || 1);
      if (D.glas) {
        // solen skiner: glasögonen på näsan (ögonen i ansiktsbilden y ≈ −3)
        const ey = -(-3 - P.cy) * P.ry / P.hh;
        gl.position.set(0, ey, Math.sqrt(Math.max(0, 1 - (ey / P.ry) ** 2)) * P.rz + 3);
        gl.rotation.x = 0;
      } else if (onCap) {
        // uppskjutna på mössan
        gl.position.copy(onCap); gl.rotation.x = -35 * DEG;
      }
    }
    if (D.sno) ellipsoid([0, P.ry * (F.mossa ? 1.13 : 1.05), -P.rz * 0.1], [P.rx * 0.42, 3, P.rz * 0.38], snowMat, hc);
    // munnen i huvudets axlar (ansiktsbildens y ≈ 42)
    const my = -(42 - P.cy) * P.ry / P.hh;
    const mouth = new THREE.Vector3(0, my, Math.sqrt(Math.max(0, 1 - (my / P.ry) ** 2)) * P.rz * 0.98 + 2);

    // armarna: kapslar med fast längd som IK placerar varje bild
    // ärmarna: korta på t-tröjan, långa på tröjan och jackan, eller
    // uppkavlade till armbågen (DT:s arm med lejonet)
    const J = D.jacka;
    const arms = [0, 1].map((i) => {
      const s = i === 0 ? -1 : 1;
      const kind = F.does[i];
      const sleeve = J ? (J.upp === 'bada' || J.upp === i ? 'upp' : 'jacka') : D.troja ? 'lang' : 'kort';
      const sm = J ? jackMat(J, { side: THREE.FrontSide, ...(J.tyg === 'flanell' ? { map: plaid(2, 2) } : {}) }) : tee;
      const tk = J ? (J.tunn ? 0.3 : J.tjock || 1) : 0;
      const rU = F.arm * (sleeve === 'kort' ? 1.45 : 1.22 + 0.12 * tk);
      const rL = F.arm * (1.1 + 0.1 * tk);
      const A = {
        s,
        kind,
        sleeveKind: sleeve,
        S: new THREE.Vector3(s * Wd * 0.88, T - 10, 0),
        up: rod(F.a, F.arm, skin, fig),
        lo: rod(F.b, F.arm * 0.92, skin, fig),
        sleeve: rod(sleeve === 'kort' ? F.a * 0.48 : F.a, rU, sm, fig),
        cuff: sleeve === 'kort' ? ring([0, 0, 0], [0, 1, 0], F.arm * 1.45, 1.3, tee2, fig)
          : sleeve === 'upp' ? ring([0, 0, 0], [0, 1, 0], rU * 1.02, 3 + 0.4 * tk, sm, fig)
            : ring([0, 0, 0], [0, 1, 0], rL * 1.02, J ? 1.5 + 0.3 * tk : 1.9, J ? edgeMat(J) : tee2, fig),
      };
      if (sleeve === 'lang' || sleeve === 'jacka') A.loS = rod(Math.max(1, F.b * 0.84 - 2 * rL), rL, sm, fig);
      // dunjackans kanaler runt ärmarna
      if (J && J.tyg === 'dun' && sleeve !== 'kort') A.quilt = [[0, 0.38, rU], [0, 0.72, rU], ...(A.loS ? [[1, 0.32, rL], [1, 0.62, rL]] : [])].map(([seg, f, r]) => ({ seg, f, x: ring([0, 0, 0], [0, 1, 0], r * 0.98, 1.2 + 0.2 * tk, sm, fig) }));
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
      if (F.tatuering && F.tatuering.arm === i) A.tat = tatuering(F, A);
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

    // väntan på kupongen: pennan nyps som cigaretten, kupongen hålls i en
    // vilande hand; flaskan, burken och cigaretten (släckt) står bredvid
    const V = F.vanta;
    const pen = arms[V.penna];
    const kp = arms[V.kupong];
    const q = F.arm;
    const vt = new THREE.Object3D();
    for (const A of arms) {
      if (A === pen) {
        A.wHand = A.cig ? A.hand : hand('nyp', q, skin, fig);
        A.pen = pencil(A.wHand);
        A.pen.position.set(-q * 0.2, q * 2.5, -q * 0.9);
      } else {
        A.wHand = A.kind === 'vila' ? A.hand : hand('vila', q, skin, fig);
        A.kup = coupon(A.wHand);
        // handen bakom kupongens yttre kant, handflatan mot den som läser
        new THREE.Matrix4().makeRotationY(Math.PI).setPosition(-A.s * KW * 0.42, -q * 1.1, -q * 1.15).invert()
          .decompose(A.kup.position, A.kup.quaternion, A.kup.scale);
      }
      if (A.thing) {
        A.bench = A.kind === 'burk' ? can(fig) : bottle(fig);
        A.bench.position.set(V.sak[0] * Wd, 0.4 - A.thing.userData.bottom, V.sak[1] * thigh);
        // handryggen utåt när den tas
        A.bench.rotation.y = A.s * Math.PI / 4;
      }
      if (A.cig) {
        A.bench = cigarette(fig);
        A.bench.userData.tip.visible = A.bench.userData.halo.visible = false;
        // där handen tar den: fingrarna framåt, handryggen upp, cigaretten vågrät
        const at = F.key === 'dt' ? new THREE.Vector3(-Wd * 1.35, 6.4, thigh * 0.45) : new THREE.Vector3(V.cigg[0] * Wd, 1.3, V.cigg[1] * thigh);
        const y = new THREE.Vector3(0, -0.3, 1);
        const z = new THREE.Vector3(0, 1, 0.3);
        orient(vt, new THREE.Vector3(), y, z);
        orient(vt, at.sub(A.cig.position.clone().applyQuaternion(vt.quaternion)), y, z);
        vt.updateMatrix();
        A.cig.updateMatrix();
        vt.matrix.clone().multiply(A.cig.matrix).decompose(A.bench.position, A.bench.quaternion, A.bench.scale);
      }
      for (const x of [A.pen, A.kup, A.bench, A.thing, A.cig]) if (x) x.updateMatrix();
    }
    // pennan bakom örat och kupongen upp och ner på fönsterbänken när den är inne
    const earPen = pencil(hc);
    // utanför håret och mössan, snett framåt och nedåt, så att den syns framifrån
    frameOf(earPen, new THREE.Vector3(pen.s * P.rx * 1.15, P.ry * 0.16, -P.rz * 0.1), new THREE.Vector3(-pen.s * 0.1, -0.8, 0.6), new THREE.Vector3(0, 0.6, 0.8));
    const kupBench = coupon(fig);
    const [lx, lz, lr] = V.lagg;
    frameOf(kupBench, new THREE.Vector3(lx * Wd, 0.3, lz * thigh), new THREE.Vector3(Math.cos(lr), 0, -Math.sin(lr)), new THREE.Vector3(Math.sin(lr), 0, Math.cos(lr)));
    earPen.updateMatrix();
    kupBench.updateMatrix();

    return { F, fig, torso, chest, hg, hc, knees, feet, arms, mouth, thigh, hipY, T, phase: hash(F.x) * 20, pen, kp, earPen, kupBench, inneAt: -1e9, key: JSON.stringify(D) };
  }

  // Ett föremåls matris i c med x-axeln X och y-axeln Y (rätas upp).
  function frameM(c, X, Y) {
    const x = X.clone().normalize();
    const z = new THREE.Vector3().crossVectors(x, Y).normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    return new THREE.Matrix4().makeBasis(x, y, z).setPosition(c);
  }
  function frameOf(obj, c, X, Y) {
    frameM(c, X, Y).decompose(obj.position, obj.quaternion, obj.scale);
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

  // Bålens och huvudets läge: lutning framåt, andning och blickar – och medan
  // man väntar på kupongen (waitBody) det man gör då.
  function body(o, t) {
    const k = o.F.key;
    const tt = t + o.phase;
    const drink = drinkW(o, t);
    const drag = dragW(o, t);
    let lean = 0.1 - 0.12 * drink + 0.02 * Math.sin(tt * 0.4);
    o.torso.rotation.z = 0.015 * Math.sin(tt * 0.23);
    let breath = 1;
    let pitch = -0.05 + 0.03 * Math.sin(tt * 0.31);
    let yaw = 0;
    if (k === 'dl') yaw = 0.18 * bump((t % 21), 12, 13.5, 17, 18.5) - 0.05;
    if (k === 'dt') { pitch += 0.06 * Math.sin(t * 5.2) * bump(t % 13, 8.5, 9, 10.5, 11.5); yaw = -0.12 * bump(t % 17, 2, 3, 6, 7); }
    if (k === 'dj') { yaw = -0.22 + 0.06 * Math.sin(t * 0.7); pitch += 0.04 * Math.sin(t * 2.1) * talkW(o, t); }
    pitch -= 0.38 * drink - 0.06 * drag;
    const knee = [0, 1].map((i) => 0.06 + 0.16 * Math.sin(t * (k === 'dj' ? 0.9 : 1.15) + o.phase + i * 2.4) * (k === 'dt' ? 0.6 : 1));
    const foot = [0.5, 0.5];
    // väntan: rätar på sig när kupongen är inne
    const vw = 1 - sm(0, 0.3, uOf(o, t));
    if (vw > 0) {
      const w = waitBody(o, Math.min(t, o.inneAt));
      lean += (w.lean - lean) * vw;
      pitch += (w.pitch - pitch) * vw;
      yaw += (w.yaw - yaw) * vw;
      breath += (w.breath - 1) * vw;
      for (let i = 0; i < 2; i++) { knee[i] += (w.knee[i] - knee[i]) * vw; foot[i] += (w.foot[i] - foot[i]) * vw; }
    }
    o.torso.rotation.x = lean;
    o.chest.scale.set(1 + 0.008 * Math.sin(tt * 1.6), (1 + 0.012 * Math.sin(tt * 1.6)) * breath, 1);
    o.hg.rotation.x = pitch;
    o.hg.rotation.y = yaw;
    for (let i = 0; i < 2; i++) { o.knees[i].rotation.x = knee[i]; o.feet[i].rotation.x = foot[i]; }
  }

  // ---------- väntan på kupongen ----------
  // o.inneAt: när kupongen lämnades in (Infinity = väntar, −1e9 = inne sedan
  // länge). u = 0 → 1 är övergången: pennan bakom örat (u 0,28), kupongen på
  // fönsterbänken (0,3), flaskan, burken eller cigaretten i handen (0,55),
  // som vanligt (0,82) och strax därpå det första blosset eller klunken.
  const TR = 4.4;
  const SLOT = 7.5;
  const uOf = (o, t) => (t - o.inneAt) / TR;
  const ready = (o, t) => sm(0.8, 0.9, uOf(o, t));
  const after = (o, t, a, b, c, d) => bump(t - o.inneAt - TR * 0.85, a, b, c, d);
  // Vad man gör just nu: de fem sakerna turas om, en i taget, med en stund
  // emellan. b = [tugga på pennan, snegla på ölen, otåliga ben, kika ner mot
  // pulten, vända på kupongen], l = sekunder in i den.
  function acts(o, t) {
    const V = o.F.vanta;
    const x = t + V.fas;
    const n = Math.floor(x / SLOT);
    const l = x - n * SLOT;
    const b = [0, 0, 0, 0, 0];
    b[V.ordning[((n % 5) + 5) % 5]] = bump(l, 0.3, 1.3, 5.9, 6.9);
    return { b, l };
  }
  function waitBody(o, t) {
    const { b, l } = acts(o, t);
    const [tugg, ol, ben, kika, vrid] = b;
    const F = o.F;
    // en suck efter blicken på ölen och efter kupongen mot lysröret
    const suck = (ol + vrid) * bump(l, 4.5, 5.0, 5.6, 6.4);
    const glance = ol * bump(l, 1.1, 1.7, 3.5, 4.3);
    const scratch = tugg * sm(3.4, 4.2, l);
    const chew = tugg - scratch;
    return {
      lean: 0.2 + 0.24 * kika + 0.08 * suck - 0.08 * vrid + 0.02 * Math.sin(t * 0.5 + o.phase),
      pitch: 0.26 + 0.3 * kika - 0.32 * vrid + 0.1 * suck + 0.1 * glance - chew * (0.22 + 0.03 * Math.sin(t * 9)) + 0.12 * scratch,
      yaw: F.vanta.blick * 0.62 * glance - kika * F.turn * DEG * 0.8 + 0.04 * Math.sin(t * 0.37 + o.phase),
      breath: 1 - 0.04 * suck,
      knee: [0, 1].map((i) => 0.06 + (1 - ben) * 0.16 * Math.sin(t * 1.15 + o.phase + i * 2.4) + ben * (0.3 * Math.sin(t * 2.9 + o.phase + i * 2.1) + 0.06 * Math.sin(t * 5.3 + i))),
      foot: [0, 1].map((i) => 0.5 - (i === F.vanta.fot ? ben * 0.34 * Math.max(0, Math.sin(t * 9.5)) ** 2 : 0)),
    };
  }

  // Handen som håller ett föremål med matrisen M (figurens axlar), när
  // föremålet sitter som local i handen.
  const IM = new THREE.Matrix4();
  function grip(M, local, pole) {
    const e = M.clone().multiply(IM.copy(local).invert()).elements;
    return { p: new THREE.Vector3(e[12], e[13], e[14]), y: new THREE.Vector3(e[4], e[5], e[6]), z: new THREE.Vector3(e[8], e[9], e[10]), pole };
  }
  function lerpPose(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    const y = a.y.clone().lerp(b.y, k);
    const z = a.z.clone().lerp(b.z, k);
    return { p: a.p.clone().lerp(b.p, k), y: y.lengthSq() > 1e-3 ? y : b.y, z: z.lengthSq() > 1e-3 ? z : b.z, pole: a.pole.clone().lerp(b.pole, k) };
  }
  // en punkt i huvudets axlar i figurens
  const inHead = (o, v) => {
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    return v.clone().applyMatrix4(o.hc.matrix).applyMatrix4(o.hg.matrix).applyMatrix4(o.torso.matrix);
  };
  // pennan med spetsen i tip, riktad dir
  const penAt = (tip, dir) => frameM(tip.clone().addScaledVector(dir, -PEN_TIP), dir, Math.abs(dir.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0));

  // Kupongen i handen: framför magen, lutad mot den som läser – eller (vrid)
  // uppe i ansiktshöjd, där den vänds så att framsidan syns.
  function paperM(o, t) {
    const { b, l } = acts(o, t);
    const vrid = b[4];
    const Wd = o.F.w;
    const sk = o.kp.s;
    // så långt fram att den går fri från bröstet när han lutar sig över den
    const c = new THREE.Vector3(sk * Wd * 0.14, o.hipY + o.T * 0.5 + 0.8 * Math.sin(t * 0.9 + o.phase), o.F.depth + 24)
      .lerp(new THREE.Vector3(sk * Wd * 0.02, o.hipY + o.T * 0.98, o.F.depth + 34), vrid);
    // nästan upprätt, så att baksidan syns framifrån
    const be = (24 - 14 * vrid) * DEG;
    const ph = Math.PI * vrid * bump(l, 1.7, 2.6, 3.9, 4.8);
    const Y = new THREE.Vector3(0, Math.cos(be), Math.sin(be));
    const X0 = new THREE.Vector3(-1, 0, 0);
    const Z0 = new THREE.Vector3().crossVectors(X0, Y);
    return frameM(c, X0.multiplyScalar(Math.cos(ph)).addScaledVector(Z0, Math.sin(ph)), Y);
  }
  function kupPose(o, A, t) {
    return grip(paperM(o, Math.min(t, o.inneAt)), A.kup.matrix, new THREE.Vector3(A.s, -0.5, -0.5));
  }
  // Pennan: mot kupongen (och knackar på den), i munnen, bakom örat där det
  // kliar, eller vilande på låret medan kupongen hålls upp.
  function penPose(o, A, t) {
    t = Math.min(t, o.inneAt);
    const { b, l } = acts(o, t);
    const [tugg, , ben, , vrid] = b;
    const L = A.pen.matrix;
    const sp = A.s;
    const pole = new THREE.Vector3(sp, -0.45, -0.55);
    const M = paperM(o, t);
    const e = M.elements;
    const X = new THREE.Vector3(e[0], e[1], e[2]);
    const Y = new THREE.Vector3(e[4], e[5], e[6]);
    const Z = new THREE.Vector3(e[8], e[9], e[10]);
    const tap = 1.4 * (ben + 0.3 * (1 - ben)) * Math.max(0, Math.sin(t * (ben > 0.5 ? 9.5 : 3.1))) ** 6;
    const tip = new THREE.Vector3(e[12], e[13], e[14]).addScaledVector(Y, KH * 0.22).addScaledVector(X, -sp * KW * 0.12).addScaledVector(Z, 1.2 + tap);
    let hp = grip(penAt(tip, Y.clone().multiplyScalar(-0.8).addScaledVector(new THREE.Vector3(sp, 0, 0), -0.45).addScaledVector(Z, -0.4).normalize()), L, pole);
    if (tugg > 0) {
      const dir = new THREE.Vector3(sp * 0.35, -0.38, 0.86).normalize();
      const end = mouthIn(o).add(new THREE.Vector3(0, 0.7 * Math.sin(t * 9), 1.2));
      const chew = grip(penAt(end.addScaledVector(dir, PEN_TIP - PEN_END), dir), L, new THREE.Vector3(sp, -0.7, 0.1));
      const P = o.F.head;
      const spot = inHead(o, new THREE.Vector3(sp * P.rx * 0.8, P.ry * 0.05 + 2 * Math.sin(t * 12), -P.rz * 0.62));
      const scratch = grip(penAt(spot, new THREE.Vector3(-sp * 0.45, 0.25, -0.86).normalize()), L, new THREE.Vector3(sp, -0.2, -0.4));
      hp = lerpPose(hp, lerpPose(chew, scratch, sm(3.4, 4.2, l)), tugg);
    }
    if (vrid > 0) {
      const knee = grip(penAt(new THREE.Vector3(sp * o.F.w * 0.36, o.hipY + 13, o.thigh * 1.05), new THREE.Vector3(-sp * 0.25, -0.15, 0.95).normalize()), L, pole);
      hp = lerpPose(hp, knee, vrid);
    }
    return hp;
  }
  function earPose(o, A) {
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    const M = o.torso.matrix.clone().multiply(o.hg.matrix).multiply(o.hc.matrix).multiply(o.earPen.matrix);
    return grip(M, A.pen.matrix, new THREE.Vector3(A.s, -0.3, -0.5));
  }

  // när var och en dricker och drar ett bloss (0 → 1 → 0) – inte medan man
  // väntar, och strax efter inlämningen den första klunken eller blosset
  const drinkW = (o, t) => Math.max(ready(o, t) * (o.F.key === 'dl' ? bump(t % 15, 6, 7.4, 9.6, 11) : o.F.key === 'dj' ? bump((t + 4) % 19, 11, 12.4, 14.2, 15.6) : 0),
    o.F.key === 'dl' ? after(o, t, 0, 1.0, 2.6, 3.6) : 0);
  const dragW = (o, t) => Math.max(ready(o, t) * (o.F.key === 'dt' ? bump(t % 12, 3, 4.2, 5.4, 6.6) : o.F.key === 'dj' ? bump((t + 5) % 16, 1, 2.2, 3.2, 4.4) : 0),
    o.F.key === 'dl' ? 0 : after(o, t, 0, 1.0, 2.6, 3.6));
  const talkW = (o, t) => (o.F.key === 'dj' ? ready(o, t) * (1 - dragW(o, t)) : 0);
  const glowAt = (o, t) => Math.max(ready(o, t) * (o.F.key === 'dt' ? bump(t % 12, 4, 4.4, 5.2, 5.8) : bump((t + 5) % 16, 2.1, 2.5, 3.0, 3.6)), after(o, t, 1.0, 1.4, 2.2, 2.8));

  const mouthIn = (o) => {
    o.fig.updateMatrix(); o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    return o.mouth.clone().applyMatrix4(o.hc.matrix).applyMatrix4(o.hg.matrix).applyMatrix4(o.torso.matrix);
  };
  const shoulder = (o, A) => { o.torso.updateMatrix(); return A.S.clone().applyMatrix4(o.torso.matrix); };

  // Handens läge (figurens axlar): position, y- och z-axel och armbågens
  // riktning – medan man väntar, på väg från kupongen och pennan till det man
  // får när den är inne, och sedan (handDone) som vanligt.
  function handPose(o, A, t) {
    const u = uOf(o, t);
    if (u >= 1) return handDone(o, A, t);
    const wait = A === o.pen ? penPose(o, A, t) : kupPose(o, A, t);
    if (u < 0) return wait;
    const pick = () => grip(A.bench.matrix, (A.thing || A.cig).matrix, new THREE.Vector3(A.s, -0.4, -0.6));
    if (A === o.pen) {
      if (u < 0.28) return lerpPose(wait, earPose(o, A), sm(0, 0.28, u));
      const next = A.bench ? pick() : handDone(o, A, t);
      if (u < 0.55) return lerpPose(earPose(o, A), next, sm(0.28, 0.55, u));
      if (A.bench && u < 0.82) return lerpPose(next, handDone(o, A, t), sm(0.55, 0.82, u));
      return handDone(o, A, t);
    }
    const put = grip(o.kupBench.matrix, A.kup.matrix, new THREE.Vector3(A.s, -0.2, -0.8));
    if (u < 0.3) return lerpPose(wait, put, sm(0, 0.3, u));
    const next = A.bench ? pick() : handDone(o, A, t);
    if (u < 0.55) return lerpPose(put, next, sm(0.3, 0.55, u));
    if (A.bench && u < 0.82) return lerpPose(next, handDone(o, A, t), sm(0.55, 0.82, u));
    return handDone(o, A, t);
  }
  function handDone(o, A, t) {
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
    // pennan i handen eller bakom örat, kupongen i handen eller på
    // fönsterbänken, flaskan, burken och cigaretten bredvid eller i handen
    const u = uOf(o, t);
    o.earPen.visible = u >= 0.28;
    o.kupBench.visible = u >= 0.3;
    for (const A of o.arms) {
      const taken = u >= 0.55;
      if (A.pen) A.pen.visible = u < 0.28;
      if (A.kup) A.kup.visible = u < 0.3;
      if (A.bench) A.bench.visible = !taken;
      if (A.cig) A.cig.visible = taken;
      const useW = A.wHand !== A.hand && !taken;
      if (A.wHand !== A.hand) { A.wHand.visible = useW; A.hand.visible = !useW; }
      const H = useW ? A.wHand : A.hand;
      const hp = handPose(o, A, t);
      orient(H, hp.p, hp.y, hp.z);
      H.updateMatrix();
      const Wr = H.userData.wrist.clone().applyMatrix4(H.matrix);
      const S = shoulder(o, A);
      const E = ik(S, Wr, o.F.a, o.F.b, hp.pole);
      const du = E.clone().sub(S).normalize();
      const sl = S.clone().add(du.clone().multiplyScalar(o.F.a * 0.48));
      place(A.up, S, E);
      place(A.lo, E, Wr);
      if (A.tat) {
        // tatueringen sitter på handryggens sida av underarmen och vrids med handen
        const z = new THREE.Vector3(0, 0, 1).applyQuaternion(A.hand.quaternion).applyQuaternion(A.lo.quaternion.clone().invert());
        A.tat.rotation.y = Math.atan2(z.x, z.z) + o.F.tatuering.rot * DEG;
      }
      const Z = new THREE.Vector3(0, 0, 1);
      if (A.sleeveKind === 'kort') {
        place(A.sleeve, S, sl);
        A.cuff.position.copy(sl);
        A.cuff.quaternion.setFromUnitVectors(Z, du);
      } else {
        // långa ärmar till strax före handleden, uppkavlade till armbågen
        place(A.sleeve, S, E);
        const dl = Wr.clone().sub(E).normalize();
        const end = E.clone().addScaledVector(dl, o.F.b * 0.84);
        if (A.loS) {
          place(A.loS, E, end);
          A.cuff.position.copy(end).addScaledVector(dl, -1);
          A.cuff.quaternion.setFromUnitVectors(Z, dl);
        } else {
          A.cuff.position.copy(E).addScaledVector(du, -2);
          A.cuff.quaternion.setFromUnitVectors(Z, du);
        }
        if (A.quilt) for (const q of A.quilt) {
          q.x.position.copy(q.seg ? E.clone().addScaledVector(dl, o.F.b * q.f) : S.clone().addScaledVector(du, o.F.a * q.f));
          q.x.quaternion.setFromUnitVectors(Z, q.seg ? dl : du);
        }
      }
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
        // ingen rök medan cigaretten ligger släckt och man väntar på kupongen
        if (src === 'glod') alpha = 0.8 * (1 - dragW(o, tb) * 0.7) * sm(0.55, 0.62, uOf(o, tb));
        else {
          // utandningen: strax efter blosset (och det första efter inlämningen)
          const out = o.F.key === 'dt' ? bump(tb % 12, 6.0, 6.3, 7.4, 8.6) : bump((tb + 5) % 16, 4.4, 4.7, 5.8, 7);
          alpha = 0.85 * Math.max(ready(o, tb) * out, after(o, tb, 3.0, 3.3, 4.4, 5.6));
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

  // ---------- vädret ----------

  // Ljuset från fönstret efter dagsljuset ute (rum-ute.js), och kläderna:
  // den vars kläder (dress) har ändrats byggs om, och röken följer med.
  function ute(v) {
    const L = v && window.RumUte ? window.RumUte.light(v) : null;
    const dag = L ? L.dag : 0;
    win.color.set('#ffb35c').lerp(new THREE.Color(L ? L.sky[2] : '#ffb35c'), dag);
    win.intensity = 0.35 + 1.7 * dag;
    hemi.intensity = 0.42 + 0.2 * dag;
    figs.forEach((o, i) => {
      const D = dress(o.F.key, v);
      if (JSON.stringify(D) === o.key) return;
      root.remove(o.fig);
      o.fig.traverse((x) => { if (x.geometry) x.geometry.dispose(); });
      figs[i] = Object.assign(build(o.F, D), { inneAt: o.inneAt });
    });
    for (const sk of smokers) {
      const o = figs.find((x) => x.F === sk.o.F);
      if (o === sk.o) continue;
      sk.A = o.arms[sk.o.arms.indexOf(sk.A)];
      sk.o = o;
    }
    for (const p of puffs) p.born.clear();
  }
  ute(opt.vader);

  // Vem som har lämnat in ({ dl: true, dt: false, … }; den som saknas är
  // inne) och klockan t. Första gången sitter var och en som det är; den som
  // blir inne sedan lägger ifrån sig kupongen och tar ölen eller cigaretten.
  let told = false;
  function inne(vem, t) {
    for (const o of figs) {
      const v = vem[o.F.key] !== false;
      if (!v) o.inneAt = Infinity;
      else if (!told) o.inneAt = -1e9;
      else if (o.inneAt === Infinity) o.inneAt = t;
    }
    told = true;
  }

  return { draw, inne, ute };
}
