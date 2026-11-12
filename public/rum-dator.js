// Datorn på disken i tobaksaffären, i three.js som inredningen
// (rum-inredning.js) och sakerna på pulten (rum-saker.js). Terminalen på
// skärmen, datan och sökningen sköts av rum-register.js. Datorn är en IBM
// Personal System/2 Model 25 från 1990, som på fotona från tiden: allt i ett
// med grå skärmram, IBM-skylten, två diskettstationer och ett Model
// M-tangentbord, en grå mus och en diskett bredvid (säkerhetskopian). Den står
// där kortlådan stod: på disken under Tipsligan, vänd mellan gänget och den
// som tittar.
//
// I rummet ritas datorn när skärmen ändras, med samma kamera som högra
// väggen, och kopieras till duken i länken på disken, så att den lyser när
// man pekar på den. Närbilden ritas direkt i en duk över hela fönstret:
// datorn står kvar som den står, och det är kameran som svänger fram och
// ställer sig rakt framför skärmen (en del av samma bild i början, så att
// perspektivet är detsamma). Där tar terminalen i rum-register.js över
// skärmen. I en stående telefon går kameran närmare, tills skärmen fyller
// höjden under rubrikraden: skärmens sidor hamnar utanför bilden, och
// terminalen håller sig till det som syns (annars blev texten för liten att
// läsa).
//
// Slitaget: disketten, musen och tangentbordet ligger lite olika varje dag.
//
// Världen: som rum-inredning.js – X = x, Y = −y och Z ut från hörnet mot
// betraktaren, i högra väggens mått; ögat står i (760, 400) på avståndet
// 1000, och disken är Y = −490 mellan X = 1060 och väggen i X = 1140.
//
// dator({ duk, nara, calm, box }) → { skarm(rader, läge), paint(), open(on, från) → Promise<ruta>,
//   ruta(), resize() }  (ruta = skärmens rektangel i fönstret när kameran står framför;
//   läge = var raderna står på skärmen, { x, y, f, rad, hoger, n } i skärmbildens px)

const DEG = Math.PI / 180;
const DAY = 86400000;
const EYE = [760, 400];
const E = 1000;
const FW = 2 * Math.max(EYE[0], 1600 - EYE[0]);
const FH = 2 * Math.max(EYE[1], 1000 - EYE[1]);
// datorns mitt i botten, på disken, och hur den är vänd (mellan gänget och ögat)
const POS = { x: 1104, y: -490, z: 377 };
const YAW = -38 * DEG;
// skärmen (4:3) och dess mitt över disken
const SK = { w: 32, h: 24, y: 39.5 };
// närbilden: hur stor del av fönstret skärmen tar och var dess mitt står,
// och kamerans synfält där. På datorn fyller skärmen höjden under namnet
// (toppNamn där det står, i smalare fönster än 8/5) och ovanför Tillbaka
// (fot, px; fotKort med Dölj resultat, där Visa ändå står under skärmen),
// högst max px hög (texten blir då omkring 30 px) och bred av bredden: förut
// tog den två tredjedelar av höjden, och på en bärbar blev texten 17–22 px.
// I en stående telefon fyller skärmen höjden mellan rubrikraden (topp) och
// fönstrets nederkant (fot, px; fotBred i ett stående fönster som inte är
// smalt, där Tillbaka står nertill).
// I ett lågt fönster (en liggande telefon) fyller den också höjden under
// rubrikraden, men hela skärmen syns.
const NARA = { bred: 0.86, topp: 60, toppNamn: 100, fot: 56, fotKort: 132, max: 760, fov: 24 * DEG };
const NARA_TEL = { topp: 60, fot: 14, fotBred: 60, fov: 30 * DEG };
const NARA_LAG = { bred: 0.9, topp: 56, fot: 10, fov: 24 * DEG };
// raderna på skärmen i rummet (skärmbildens px, 1024 × 768)
const RADER = { x: 44, y: 34, f: 34, rad: 1.12, hoger: 980, n: 18 };
const staende = () => innerWidth < 700 && innerHeight > innerWidth * 1.2;
// (som R.smal i rum.js: Tillbaka står överst)
const smal = () => innerWidth < 600 && innerHeight > innerWidth;
const lagt = () => innerHeight < 520;
// färgerna på skärmen (samma som terminalen i rum-register.css)
const FARG = { '': '#41ff6e', d: '#1c9c3d', v: '#c9ffd7', i: '#010702', bak: '#020a04' };
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

export async function dator(o) {
  const BOX = o.box;
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry: RB } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  await Promise.all(['40px "VT323"', '40px "Skrivmaskin"', '40px "Alfa Slab One"'].map((f) => document.fonts.load(f).catch(() => null)));

  // i telefonen färre bildpunkter, ingen kantutjämning och mindre skuggkartor
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const SKUGGA = LATT ? 1024 : 2048;
  const DPR = LATT ? 1.5 : Math.min(2.5, Math.max(2, (window.devicePixelRatio || 1) * 1.25));
  const gl = new THREE.WebGLRenderer({ alpha: true, antialias: !LATT, preserveDrawingBuffer: true });
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.shadowMap.enabled = !(await import('./rum-gpu.js')).utanSkuggor(gl);
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.domElement.className = 'reg-gl';
  o.nara.append(gl.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(gl);
  if (LATT) pmrem._setSize = (n) => THREE.PMREMGenerator.prototype._setSize.call(pmrem, Math.min(n, 128));
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // kameran som högra väggen; view(r) visar rektangeln r (scenens px)
  const FOV = 2 * Math.atan(FH / 2 / E);
  const cam = new THREE.PerspectiveCamera(FOV / DEG, FW / FH, 5, 6000);
  const OGA = new THREE.Vector3(EYE[0], -EYE[1], E);
  const RAKT = new THREE.Quaternion();
  const hemma = () => { cam.position.copy(OGA); cam.quaternion.copy(RAKT); };
  hemma();
  const view = (r) => { cam.setViewOffset(FW, FH, r.x - (EYE[0] - FW / 2), r.y - (EYE[1] - FH / 2), r.w, r.h); cam.updateMatrixWorld(); };

  const mat = (color, x = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.6, envMapIntensity: 0.5 }, x));
  function duk(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    if (draw) draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  const mesh = (g, m, p, skugga = true) => { const x = new THREE.Mesh(g, m); x.castShadow = skugga; x.receiveShadow = true; p.add(x); return x; };

  // ---------- ljuset, som på väggarna i rum-inredning.js ----------

  scene.add(new THREE.HemisphereLight('#eadcc0', '#3a2a1a', 0.55));
  const key = new THREE.DirectionalLight('#fff2dc', 1.9);
  key.position.set(POS.x - 340, POS.y + 680, POS.z + 900);
  key.target.position.set(POS.x, POS.y, POS.z);
  key.castShadow = true;
  key.shadow.mapSize.set(SKUGGA, SKUGGA);
  key.shadow.radius = 5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.2;
  Object.assign(key.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 3000 });
  scene.add(key, key.target);
  const neon = new THREE.DirectionalLight('#ff3a26', 0.24);
  neon.position.set(300, -170, 260);
  neon.target.position.set(900, -330, 0);
  scene.add(neon, neon.target);
  const tv = new THREE.PointLight('#7fb0ff', 0.4 * 90000, 0, 2);
  tv.position.set(1300, -250, 380);
  scene.add(tv);
  const fram = new THREE.DirectionalLight('#ffd9b0', 0.35);
  fram.position.set(760, -400, 1000);
  scene.add(fram);
  // skuggorna på disken och på väggen bakom
  for (const [g, rot, pos] of [
    [new THREE.PlaneGeometry(84, 360), [-90 * DEG, 0, 0], [1100, POS.y + 0.05, POS.z]],
    [new THREE.PlaneGeometry(360, 240), [0, -90 * DEG, 0], [1139.9, POS.y + 120, POS.z]],
  ]) {
    const m = new THREE.Mesh(g, new THREE.ShadowMaterial({ opacity: 0.42 }));
    m.rotation.set(...rot);
    m.position.set(...pos);
    m.receiveShadow = true;
    scene.add(m);
  }

  // ---------- datorn ----------

  // Plasten: matt med ett fint korn (en brusbild som bump), som gjuten plast
  // från tiden. RoundedBoxGeometry har 0–1 per sida, de extruderade delarna
  // världens enheter, därför två kopior av kornet.
  const korn = duk(128, 128, (c, w, h) => {
    const d = c.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = 112 + hash(i * 0.7313 + 0.17) * 32;
      d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v;
      d.data[i * 4 + 3] = 255;
    }
    c.putImageData(d, 0, 0);
  });
  korn.colorSpace = THREE.NoColorSpace;
  korn.wrapS = korn.wrapT = THREE.RepeatWrapping;
  const KORN_RB = korn.clone();
  KORN_RB.repeat.set(5, 5);
  const KORN_V = korn.clone();
  KORN_V.repeat.set(0.11, 0.11);
  const plast = (c, k = KORN_RB, x = {}) => mat(c, Object.assign({ roughness: 0.6, clearcoat: 0.08, clearcoatRoughness: 0.7, envMapIntensity: 0.45, bumpMap: k, bumpScale: 0.25 }, x));
  const VIT = plast('#dfdbd0');
  const VITV = plast('#dfdbd0', KORN_V);
  const GRA = plast('#a19d94', KORN_V);
  const GRAT = plast('#aaa69d', KORN_V, { side: THREE.DoubleSide });
  const SLITS = mat('#141414', { roughness: 0.9 });
  const ROR = mat('#0a0b0b', { roughness: 0.85, envMapIntensity: 0.2, side: THREE.DoubleSide });
  // skärmen: terminalen (skarm) eller tom när terminalen i rum-register.js står ovanpå
  const bild = duk(1024, 768);
  const SKARM = new THREE.MeshBasicMaterial({ map: bild, toneMapped: false, color: new THREE.Color(0.95, 0.95, 0.95) });
  const GLAS = mat('#000000', { transparent: true, opacity: 0.16, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 });

  // en rundad rektangel som väg (för plattor med hål) och som punkter (lika
  // många i varje, så att två kan limmas ihop till en sluttning)
  function rrVag(p, w, h, r, x = 0, y = 0) {
    p.moveTo(x - w / 2 + r, y - h / 2);
    p.lineTo(x + w / 2 - r, y - h / 2);
    p.absarc(x + w / 2 - r, y - h / 2 + r, r, -Math.PI / 2, 0, false);
    p.lineTo(x + w / 2, y + h / 2 - r);
    p.absarc(x + w / 2 - r, y + h / 2 - r, r, 0, Math.PI / 2, false);
    p.lineTo(x - w / 2 + r, y + h / 2);
    p.absarc(x - w / 2 + r, y + h / 2 - r, r, Math.PI / 2, Math.PI, false);
    p.lineTo(x - w / 2, y - h / 2 + r);
    p.absarc(x - w / 2 + r, y - h / 2 + r, r, Math.PI, 1.5 * Math.PI, false);
    return p;
  }
  function rrPunkter(w, h, r, n = 6) {
    const ut = [];
    for (const [cx, cy, a0] of [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]]) {
      for (let i = 0; i <= n; i++) {
        const a = (a0 + (90 * i) / n) * DEG;
        ut.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    }
    return ut;
  }
  // En platta (w × h, framsidan i z, mitten i y) med hål ({ w, h, r, y } i
  // datorns y), rundad kant runt om
  function platta(w, h, r, hal, djup, bev, m, p, z, y) {
    const s = rrVag(new THREE.Shape(), w - 2 * bev, h - 2 * bev, Math.max(0.2, r - bev));
    for (const H of hal) s.holes.push(rrVag(new THREE.Path(), H.w + 2 * bev, H.h + 2 * bev, H.r + bev, 0, H.y - y));
    const g = new THREE.ExtrudeGeometry(s, { depth: djup, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 });
    const x = mesh(g, m, p);
    x.position.set(0, y, z - djup - bev);
    return x;
  }
  // Två rundade rektanglar ({ w, h, r, y, z }) ihoplimmade: ramens sluttning
  // in mot bildröret och rörets svarta kant
  function sluttning(a, b, m, p) {
    const P = [a, b].map((R) => rrPunkter(R.w, R.h, R.r));
    const n = P[0].length;
    const pos = [];
    const idx = [];
    [a, b].forEach((R, j) => P[j].forEach(([x, y]) => pos.push(x, y + R.y, R.z)));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      idx.push(i, j, i + n, j, j + n, i + n);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return mesh(g, m, p);
  }
  // En tryckt etikett (en duk på ett plan), k bildpunkter per enhet;
  // rita(c, k) ritar i bildpunkter
  function etikett(w, h, k, rita, p, x, y, z, o = {}) {
    const t = duk(Math.round(w * k), Math.round(h * k), (c) => rita(c, k));
    const m = mat('#ffffff', Object.assign({ map: t, transparent: true, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, o));
    const e = mesh(new THREE.PlaneGeometry(w, h), m, p, false);
    e.position.set(x, y, z);
    return e;
  }
  function rundRekt(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  // IBM:s åtta streck: bokstäverna i tjock antikva, med sju skåror i
  // bakgrundens färg; s är bokstävernas höjd
  function ibm(c, x, y, s, farg, bak) {
    c.save();
    c.font = `${s * 1.36}px "Alfa Slab One", "Rockwell", Georgia, serif`;
    c.textAlign = 'center';
    c.fillStyle = farg;
    c.save();
    c.translate(x, y);
    c.scale(1.12, 1);
    c.fillText('IBM', 0, s / 2);
    c.restore();
    const b = s / 13.6;
    const w = c.measureText('IBM').width * 1.2;
    c.fillStyle = bak;
    for (let i = 0; i < 7; i++) c.fillRect(x - w / 2, y - s / 2 + b + i * 1.8 * b, w, 0.8 * b);
    c.restore();
  }
  // symbolerna för ljusstyrka och kontrast
  function sol(c, x, y, r, f) {
    c.save();
    c.strokeStyle = f;
    c.lineWidth = r * 0.28;
    c.beginPath();
    c.arc(x, y, r * 0.42, 0, 2 * Math.PI);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66);
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      c.stroke();
    }
    c.restore();
  }
  function kontrast(c, x, y, r, f) {
    c.save();
    c.strokeStyle = c.fillStyle = f;
    c.lineWidth = r * 0.22;
    c.beginPath();
    c.arc(x, y, r * 0.8, 0, 2 * Math.PI);
    c.stroke();
    c.beginPath();
    c.arc(x, y, r * 0.8, -Math.PI / 2, Math.PI / 2);
    c.fill();
    c.restore();
  }
  const lampa = (f, r, p, x, y, z) => { const m = mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: f, toneMapped: false }), p, false); m.position.set(x, y, z); m.scale.z = 0.5; return m; };

  // IBM Personal System/2 Model 25 (1990): allt i ett, en grå ram kring
  // skärmen i ett benvitt hölje, den ovala skylten med IBM i streck och
  // Personal System/2 Model 25 286 uppe till vänster, 25 i blått uppe till
  // höger, ratterna för ljus och kontrast nere till höger och två
  // diskettstationer med blå knappar i foten. Förebild: foton på Wikimedia
  // Commons (IBM PS/2 Model 25, IBM Model M).
  const pc = new THREE.Group();
  pc.position.set(POS.x, POS.y, POS.z);
  pc.rotation.y = YAW;
  scene.add(pc);
  const W = 46;
  const D = 48;
  const F = D / 2;
  // foten med diskettstationerna, lite indragen under skärmen
  mesh(new RB(W - 2.4, 16, D - 4, 1.8, 1.4), VIT, pc).position.set(0, 8, F - 1.5 - (D - 4) / 2);
  // bildskärmsdelen: höljet, den benvita kanten runt den grå ramen och ramens
  // sluttning in mot bildröret
  const MY = 16 + 42.5 / 2;
  mesh(new RB(W, 42.5, D - 5, 2.6, 2.2), VIT, pc).position.set(0, MY, -2);
  platta(W, 42.5, 2.6, [{ w: W - 4, h: 38, r: 2, y: MY }], 3, 0.5, VITV, pc, F - 0.8, MY);
  const HAL = { w: 35.2, h: 27.2, r: 1.6, y: SK.y };
  platta(W - 1.8, 41, 2, [HAL], 3.3, 0.6, GRA, pc, F, MY);
  sluttning({ ...HAL, z: F - 0.15 }, { w: SK.w + 2.2, h: SK.h + 2.2, r: 1.2, y: SK.y, z: F - 3.3 }, GRAT, pc);
  // bildröret: glaset buktar lite, och kring bilden syns rörets svarta kant
  const sg = new THREE.Group();
  sg.position.set(0, SK.y, F - 3.6);
  pc.add(sg);
  {
    const g = new THREE.PlaneGeometry(SK.w, SK.h, 24, 18);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (SK.w / 2);
      const y = p.getY(i) / (SK.h / 2);
      p.setZ(i, 0.9 * (1 - 0.5 * (x * x + y * y)));
    }
    g.computeVertexNormals();
    mesh(g, SKARM, sg, false);
    mesh(g.clone(), GLAS, sg, false).position.z = 0.05;
    sluttning({ w: SK.w + 2.8, h: SK.h + 2.8, r: 1.5, y: 0, z: 0.45 }, { w: SK.w - 1, h: SK.h - 1, r: 0.8, y: 0, z: -0.3 }, ROR, sg).castShadow = false;
    // skärmens sken på tangentbordet och disken
    const sken = new THREE.PointLight('#5cff86', 320, 90, 2);
    sken.position.set(0, -14, 24);
    sg.add(sken);
  }
  // skylten: grå oval med IBM i vita streck, snett uppåt
  const BAK = '#8f897c';
  etikett(5.8, 3.9, 96, (c, k) => {
    c.fillStyle = BAK;
    c.beginPath();
    c.ellipse(2.9 * k, 1.95 * k, 2.85 * k, 1.9 * k, 0, 0, 2 * Math.PI);
    c.fill();
    c.translate(2.9 * k, 1.95 * k);
    c.rotate(-32 * DEG);
    ibm(c, -0.25 * k, -0.35 * k, 1.35 * k, '#f4f2ec', BAK);
    c.fillStyle = '#f4f2ec';
    c.font = `${0.38 * k}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    c.fillText('Personal System/2', -0.4 * k, 0.75 * k);
    c.fillText('Model 25   286', -0.1 * k, 1.2 * k);
  }, pc, -W / 2 + 5.3, 55.1, F + 0.01, { roughness: 0.4 });
  etikett(4, 2.6, 64, (c, k) => {
    c.fillStyle = '#2d5fa8';
    c.font = `italic 700 ${2.1 * k}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('25', 2 * k, 1.35 * k);
  }, pc, W / 2 - 4.6, 55.1, F + 0.01);
  // nere till höger: ljus, kontrast, strömmen och lampan
  etikett(12, 2, 64, (c, k) => {
    const f = '#5d5a54';
    sol(c, 1 * k, 1 * k, 0.5 * k, f);
    kontrast(c, 4.2 * k, 1 * k, 0.5 * k, f);
    c.strokeStyle = c.fillStyle = f;
    c.lineWidth = 0.1 * k;
    c.beginPath();
    c.arc(7.4 * k, 1 * k, 0.42 * k, 0, 2 * Math.PI);
    c.stroke();
    c.fillRect(10.2 * k, 0.55 * k, 0.12 * k, 0.9 * k);
  }, pc, 11.4, 19.8, F + 0.01);
  {
    const ratt = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.7, 0.7, 0.8, 18).rotateX(90 * DEG), plast('#8c8880'), 3);
    [7, 10.2, 13.4].forEach((x, i) => ratt.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x + 0.2, 17.8, F + 0.05)));
    ratt.castShadow = ratt.receiveShadow = true;
    pc.add(ratt);
  }
  lampa('#58ff7a', 0.32, pc, 18.6, 17.8, F + 0.1);
  // diskettstationerna: springan med luckan, den blå utmatningsknappen och lampan
  {
    const FY = 7.6;
    const lucka = plast('#3a3a3a');
    const BLA = plast('#2f63ad', KORN_RB, { clearcoat: 0.3 });
    for (const x of [-10.6, 10.6]) {
      etikett(17, 7, 32, (c, k) => {
        c.strokeStyle = 'rgba(70,60,45,.45)';
        c.lineWidth = 0.12 * k;
        rundRekt(c, 0.3 * k, 0.3 * k, 16.4 * k, 6.4 * k, 0.6 * k);
        c.stroke();
      }, pc, x, FY, F - 1.49);
      mesh(new THREE.BoxGeometry(11.5, 1.1, 0.6), SLITS, pc, false).position.set(x - 1.2, FY + 0.8, F - 1.6);
      mesh(new THREE.BoxGeometry(10.6, 0.55, 0.3), lucka, pc, false).position.set(x - 1.2, FY + 0.8, F - 1.4);
      mesh(new RB(2, 1.3, 1, 1, 0.3), BLA, pc).position.set(x + 5.6, FY - 0.9, F - 1.4);
      lampa('#2b5a2e', 0.22, pc, x - 6.4, FY - 0.9, F - 1.45);
    }
  }
  // ventilationen på sidan av skärmen
  {
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.9, 22), SLITS, 10);
    for (let i = 0; i < 10; i++) sl.setMatrixAt(i, new THREE.Matrix4().makeTranslation(W / 2 + 0.05, 52 - i * 2.2, -8));
    sl.receiveShadow = true;
    pc.add(sl);
  }

  // ---------- tangentbordet, musen och kablarna ----------

  // IBM Model M (101 tangenter): benvitt hölje, ljusa bokstäver och siffror,
  // grå Esc, F5–F8, skift- och styrtangenter, piltangenter och räknedelens
  // tecken, tre lampor uppe till höger och märket uppe till vänster.
  // Tangenterna som [x, y, bredd, höjd, grå] i tangentbredder.
  const TB = (() => {
    const k = [];
    const rad = (y, lista) => { let x = 0; for (const [w, g, glapp = 0] of lista) { x += glapp; k.push([x, y, w, 1, g]); x += w; } };
    const L = [1, 0];
    k.push([0, 0, 1, 1, 1]);
    for (let i = 0; i < 12; i++) k.push([2 + i + Math.floor(i / 4) * 0.5, 0, 1, 1, i >= 4 && i < 8 ? 1 : 0]);
    for (let i = 0; i < 3; i++) k.push([15.5 + i, 0, 1, 1, 1]);
    rad(1.5, [...Array(13).fill(L), [2, 1]]);
    rad(2.5, [[1.5, 1], ...Array(12).fill(L), [1.5, 0]]);
    rad(3.5, [[1.75, 1], ...Array(11).fill(L), [2.25, 1]]);
    rad(4.5, [[2.25, 1], ...Array(10).fill(L), [2.75, 1]]);
    rad(5.5, [[1.5, 1], [1.5, 1, 1], [7, 0], [1.5, 1], [1.5, 1, 1]]);
    for (const y of [1.5, 2.5]) for (let i = 0; i < 3; i++) k.push([15.5 + i, y, 1, 1, 1]);
    k.push([16.5, 4.5, 1, 1, 1]);
    for (let i = 0; i < 3; i++) k.push([15.5 + i, 5.5, 1, 1, 1]);
    for (let i = 0; i < 4; i++) k.push([19 + i, 1.5, 1, 1, 1]);
    for (const y of [2.5, 3.5, 4.5]) for (let i = 0; i < 3; i++) k.push([19 + i, y, 1, 1, 0]);
    k.push([22, 2.5, 1, 2, 1], [22, 4.5, 1, 2, 1], [19, 5.5, 2, 1, 0], [21, 5.5, 1, 1, 0]);
    return { k, w: 23, h: 6.5, u: 1.95, kant: [2.2, 2.2, 6, 2.2], h0: 3.2 };
  })();

  // tangentbordet, musen och disketten: på lite olika ställen varje dag
  const dag = Math.floor(Date.now() / DAY);
  const r = (i) => hash(dag * 7.3 + i);
  const tw = TB.w * TB.u + TB.kant[0] + TB.kant[1];
  const td = TB.h * TB.u + TB.kant[2] + TB.kant[3];
  const tb = new THREE.Group();
  tb.position.set((r(1) - 0.5) * 4 + 1, 0, F + 3.5 + td / 2 + r(2) * 2.5);
  tb.rotation.set(0, (r(3) - 0.5) * 9 * DEG, 0);
  pc.add(tb);
  {
    const hus = new THREE.Group();
    hus.rotation.x = 4 * DEG;
    hus.position.y = 0.6;
    tb.add(hus);
    const H0 = TB.h0;
    mesh(new RB(tw, H0, td, 2, 0.9), plast('#dcd8cd'), hus).position.y = H0 / 2;
    const inst = new THREE.InstancedMesh(new RB(1, 1, 1, 1, 0.16), plast('#ffffff'), TB.k.length);
    inst.castShadow = true;
    inst.receiveShadow = true;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const ljus = new THREE.Color('#e4dfd3');
    const gra = new THREE.Color('#9e9a92');
    TB.k.forEach(([x, y, w, h, g], i) => {
      m4.compose(
        new THREE.Vector3(-tw / 2 + TB.kant[0] + (x + w / 2) * TB.u, H0 + 0.45, -td / 2 + TB.kant[2] + (y + h / 2) * TB.u),
        q, new THREE.Vector3(w * TB.u - 0.32, 1.1, h * TB.u - 0.32));
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, g ? gra : ljus);
    });
    hus.add(inst);
    // märket: en grå oval med IBM i blått
    const e = etikett(4.4, 2.6, 64, (c, k) => {
      c.fillStyle = '#c9c6bf';
      c.beginPath();
      c.ellipse(2.2 * k, 1.3 * k, 2.1 * k, 1.2 * k, 0, 0, 2 * Math.PI);
      c.fill();
      c.translate(2.2 * k, 1.3 * k);
      c.rotate(-20 * DEG);
      ibm(c, 0, 0, 1 * k, '#264e93', '#c9c6bf');
    }, hus, -tw / 2 + 5.4, H0 + 0.02, -td / 2 + TB.kant[2] / 2);
    e.rotation.x = -90 * DEG;
    // lamporna: Num Lock tänd
    const lx = -tw / 2 + TB.kant[0] + 19 * TB.u;
    const lz = -td / 2 + TB.kant[2] + 0.5 * TB.u;
    mesh(new RB(4 * TB.u, 0.5, 1.7, 1, 0.2), plast('#cfcbc0'), hus).position.set(lx + 2 * TB.u, H0 + 0.1, lz);
    ['#5cff7e', '#1d3a22', '#1d3a22'].forEach((f, i) => lampa(f, 0.22, hus, lx + (i + 0.5) * (4 / 3) * TB.u, H0 + 0.4, lz + 0.25 * TB.u).scale.set(1.6, 0.6, 0.6));
  }
  // musen: IBM:s grå med två knappar, lite smalare och lägre fram
  const mus = new THREE.Group();
  mus.position.set(tw / 2 + 6.5 + r(4) * 4, 0, F + 7 + r(5) * 7);
  mus.rotation.y = (r(6) - 0.5) * 30 * DEG;
  pc.add(mus);
  const ML = 9;
  const MH = 2.6;
  {
    const g = new RB(5.6, MH, ML, 3, 0.9);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getZ(i) + ML / 2) / ML;
      p.setX(i, p.getX(i) * (1 - 0.1 * (1 - t)));
      if (p.getY(i) > 0) p.setY(i, p.getY(i) * (1 - 0.3 * (1 - t)));
    }
    g.computeVertexNormals();
    mesh(g, plast('#a29f98'), mus).position.y = MH / 2;
    // knapparnas skåror
    const s = (x, z, w, d) => mesh(new THREE.BoxGeometry(w, 0.1, d), SLITS, mus, false).position.set(x, MH / 2 + (MH / 2) * (1 - 0.3 * (1 - (z + ML / 2) / ML)) - 0.03, z);
    s(0, -ML / 2 + 3.3, 4.2, 0.12);
    s(0, -ML / 2 + 1.7, 0.12, 3.2);
  }
  // kablarna: musen bakom datorn, tangentbordet in under foten
  {
    const km = mat('#2b2b2b', { roughness: 0.5 });
    const kabel = (pts) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, z, y = 0.3]) => new THREE.Vector3(x, y, z))), 48, 0.22, 6), km, pc);
    const fx = mus.position.x - (Math.sin(mus.rotation.y) * ML) / 2;
    const fz = mus.position.z - (Math.cos(mus.rotation.y) * ML) / 2;
    kabel([[fx, fz, 0.8], [fx - 1.5, fz - 5], [W / 2 + 4, F - 4], [W / 2 + 3, F - 16], [W / 2 - 4, -F + 6]]);
    const bx = tb.position.x + Math.cos(tb.rotation.y) * (-tw / 2 + 6) + Math.sin(tb.rotation.y) * (-td / 2);
    const bz = tb.position.z - Math.sin(tb.rotation.y) * (-tw / 2 + 6) + Math.cos(tb.rotation.y) * (-td / 2);
    kabel([[bx, bz, 1.2], [bx - 1, bz - 2.5], [-W / 2 + 10, F + 0.5], [-W / 2 + 8, F - 6]]);
  }
  // disketten (säkerhetskopian): blå plast, metallucka och en maskinskriven etikett
  {
    const disk = new THREE.Group();
    disk.position.set(-W / 2 - 7 - r(7) * 5, 0.5, F + 1 + r(8) * 8);
    disk.rotation.y = (r(9) - 0.3) * 60 * DEG;
    pc.add(disk);
    mesh(new RB(9.4, 0.9, 9.4, 1, 0.12), plast('#26323e'), disk);
    mesh(new THREE.BoxGeometry(5.2, 0.06, 3), mat('#b9bcc0', { metalness: 0.9, roughness: 0.35 }), disk, false).position.set(0.4, 0.47, -3.2);
    const et = duk(264, 176, (c) => {
      c.fillStyle = '#f2ead4';
      c.fillRect(0, 0, 264, 176);
      c.fillStyle = '#2b4bb0';
      c.font = '34px "Skrivmaskin", "Courier New", monospace';
      c.fillText('REGISTER', 14, 60);
      c.fillText('säk.kopia', 14, 112);
    });
    const e = mesh(new THREE.PlaneGeometry(6.6, 4.4), mat('#ffffff', { map: et, roughness: 0.9 }), disk, false);
    e.rotation.x = -90 * DEG;
    e.position.set(0, 0.46, 1.6);
  }

  // ---------- skärmen i rummet ----------

  // Raderna (som terminalen: listor av [text, klass], [['', 'hr']] är ett
  // streck) i grönt på svart, med linjer som på ett bildrör. Tomt: bara mörk skärm.
  // Läget: var raderna står (annars RADER) – i telefonens närbild där
  // terminalen ställer dem, så att inget flyttar sig när den tar över.
  function skarm(rader, lage) {
    const c = bild.image;
    const g = c.getContext('2d');
    g.fillStyle = FARG.bak;
    g.fillRect(0, 0, c.width, c.height);
    if (rader) {
      const L = lage || RADER;
      const f = L.f;
      const lh = f * L.rad;
      const k34 = f / RADER.f;
      g.font = `${f}px "VT323", monospace`;
      g.textBaseline = 'top';
      const cw = g.measureText('M').width;
      rader.slice(0, L.n).forEach((rad, i) => {
        let x = L.x;
        const y = L.y + i * lh;
        // ett streck över hela skärmen
        if (rad.length === 1 && rad[0][1] === 'hr') {
          g.fillStyle = FARG.d;
          g.fillRect(x, y + lh / 2 - 1, L.hoger - x, 2);
          return;
        }
        for (const [t, k] of rad) {
          const w = cw * t.length;
          if (k === 'i') {
            g.fillStyle = FARG[''];
            g.fillRect(x - 6 * k34, y - 2, w + 12 * k34, lh);
          } else if (k && k.startsWith('st')) {
            g.fillStyle = FARG[k === 'st' ? '' : 'd'];
            g.fillRect(x, y + lh * 0.12, w, lh * 0.66);
          }
          g.fillStyle = FARG[k || ''];
          g.shadowColor = k === 'i' ? 'transparent' : 'rgba(65,255,110,.55)';
          g.shadowBlur = 8 * k34;
          g.fillText(t, x, y);
          x += w;
        }
      });
      g.shadowBlur = 0;
    }
    g.fillStyle = 'rgba(0,0,0,.28)';
    for (let y = 0; y < c.height; y += 4) g.fillRect(0, y, c.width, 2);
    const v = g.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.3, c.width / 2, c.height / 2, c.width * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.7)');
    g.fillStyle = v;
    g.fillRect(0, 0, c.width, c.height);
    bild.needsUpdate = true;
    if (S.open && !S.fly) rita();
    else paint();
  }

  const S = { open: false, fly: null, raf: 0, t: 0, rect: null };

  // Datorn på disken till duken i länken.
  function paint() {
    if (S.open || S.fly) return;
    hemma();
    view(BOX);
    gl.setPixelRatio(DPR);
    gl.setSize(BOX.w, BOX.h, false);
    gl.render(scene, cam);
    const c = o.duk.getContext('2d');
    o.duk.width = Math.round(BOX.w * DPR);
    o.duk.height = Math.round(BOX.h * DPR);
    c.clearRect(0, 0, o.duk.width, o.duk.height);
    c.drawImage(gl.domElement, 0, 0, o.duk.width, o.duk.height);
  }

  // ---------- närbilden ----------

  // Skärmens mitt och normal i världen
  pc.updateMatrixWorld(true);
  const MITT = new THREE.Vector3(0, 0, 0.9).applyMatrix4(sg.matrixWorld);
  const NORMAL = new THREE.Vector3(Math.sin(YAW), 0, Math.cos(YAW));
  // Kameran rakt framför skärmen: läge, vridning och rektangel (mitt på
  // axeln, med skärmens mitt där NARA.mitt säger)
  function framfor() {
    const tel = staende();
    const lag = !tel && lagt();
    const N = tel ? NARA_TEL : lag ? NARA_LAG : NARA;
    const h = 2 * E * Math.tan(N.fov / 2);
    const w = (h * innerWidth) / innerHeight;
    // telefonen: skärmens höjd är fönstrets utom rubrikraden och lite luft
    // nertill; datorn: mellan namnet och Tillbaka, högst NARA.max
    const dator = !tel && !lag;
    const topp = dator && !matchMedia('(min-aspect-ratio: 8/5)').matches ? N.toppNamn : N.topp;
    let fot = tel && !smal() ? N.fotBred : dator && window.Spoiler && Spoiler.on() ? N.fotKort : N.fot;
    let plats = innerHeight - topp - fot;
    // Tillbaka står nere till höger: når skärmen med sin svarta ram (4,5 %
    // av höjden runt om) in under det slutar ramen ovanför
    const G = Math.min(N.max, plats);
    if (dator && innerWidth / 2 + G * (2 / 3 + 0.045) > innerWidth - 140) {
      fot = Math.max(fot, 60 + 0.045 * G);
      plats = innerHeight - topp - fot;
    }
    const hog = Math.max(0.5, (dator ? Math.min(N.max, plats) : plats) / innerHeight);
    const mitt = dator ? (topp + plats / 2) / innerHeight : topp / innerHeight + hog / 2;
    // avståndet där skärmen tar högst NARA.bred av bredden och hog av höjden
    // (den stående telefonen: hela höjden, hur bred skärmen än blir)
    const d = tel ? (SK.h * E) / (hog * h) : Math.max((SK.w * E) / (N.bred * w), (SK.h * E) / (hog * h));
    const pos = MITT.clone().addScaledVector(NORMAL, d);
    const m = new THREE.Matrix4().lookAt(pos, MITT, new THREE.Vector3(0, 1, 0));
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return { pos, q, r: { x: EYE[0] - w / 2, y: EYE[1] - h * mitt, w, h } };
  }
  // fönstret i scenens px när datorn i rummet syns där länken står
  function roomRect(from) {
    const k = BOX.w / from.width;
    return { x: BOX.x - from.left * k, y: BOX.y - from.top * k, w: innerWidth * k, h: innerHeight * k };
  }
  function mixRect(a, b, t) {
    const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), t));
    const h = Math.exp(lerp(Math.log(a.h), Math.log(b.h), t));
    // mitten glider i proportion till storleken, så att bilden inte svajar
    const cx = lerp(a.x + a.w / 2, b.x + b.w / 2, t);
    const cy = lerp(a.y + a.h / 2, b.y + b.h / 2, t);
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }
  // kameran en bit på väg (t = 0 i rummet, 1 framför skärmen)
  function stall(t, F, R0) {
    cam.position.lerpVectors(OGA, F.pos, t);
    cam.quaternion.slerpQuaternions(RAKT, F.q, t);
    view(mixRect(R0, F.r, t));
  }
  // skärmens rektangel i fönstret när kameran står framför
  function ruta() {
    const F = framfor();
    cam.position.copy(F.pos);
    cam.quaternion.copy(F.q);
    view(F.r);
    const xs = [];
    const ys = [];
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = new THREE.Vector3((x * SK.w) / 2, (y * SK.h) / 2, 0.9).applyMatrix4(sg.matrixWorld).project(cam);
      xs.push(((v.x + 1) / 2) * innerWidth);
      ys.push(((1 - v.y) / 2) * innerHeight);
    }
    return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }

  function size() {
    gl.setPixelRatio(Math.min(LATT ? 1.5 : 2, window.devicePixelRatio || 1));
    gl.setSize(innerWidth, innerHeight, false);
  }
  function loop(now) {
    S.raf = 0;
    const f = S.fly;
    if (!f) return;
    if (!f.go) {
      // klockan börjar när datorn i fönstrets storlek har ritats (som kortlådan:
      // i Safari tog den första bildrutan så lång tid att den hoppade)
      f.n = (f.n || 0) + 1;
      f.go = f.n >= 3 && (now - f.fore < 40 || f.n > 20);
      f.fore = f.t0 = now;
    }
    const p = Math.min(1, (now - f.t0) / f.ms);
    S.t = lerp(f.a, f.b, ease(p));
    stall(S.t, f.F, f.R0);
    gl.render(scene, cam);
    if (p >= 1) { S.fly = null; f.done(); return; }
    S.raf = requestAnimationFrame(loop);
  }
  function rita() {
    if (!S.open) return;
    const F = framfor();
    stall(1, F, F.r);
    gl.render(scene, cam);
  }

  function open(on, from) {
    cancelAnimationFrame(S.raf);
    S.raf = 0;
    if (on) {
      S.open = true;
      size();
      const F = framfor();
      if (o.calm() || !from) {
        S.fly = null;
        S.t = 1;
        rita();
        return Promise.resolve(ruta());
      }
      // (var den på väg tillbaka vänder den där den är)
      const a = S.fly ? S.t : 0;
      const R0 = roomRect(from);
      return new Promise((done) => {
        S.fly = { ms: 820, a, b: 1, F, R0, done: () => done(ruta()) };
        S.raf = requestAnimationFrame(loop);
      });
    }
    const end = () => { S.open = false; S.fly = null; gl.clear(); paint(); };
    if (o.calm() || !from) { end(); return Promise.resolve(); }
    const F = framfor();
    const R0 = roomRect(from);
    return new Promise((done) => {
      S.fly = { ms: 640, a: S.fly ? S.t : 1, b: 0, F, R0, done: () => { end(); done(); } };
      S.raf = requestAnimationFrame(loop);
    });
  }
  function resize() {
    if (!S.open) return null;
    size();
    if (!S.fly) rita();
    return ruta();
  }

  // Grafikprogrammen byggs i bakgrunden innan datorn ritas första gången (som
  // gänget i rum-3d.js), så att huvudtråden inte står still strax efter att
  // rummet visats.
  try {
    view(BOX);
    await gl.compileAsync(scene, cam);
  } catch (err) { /* då byggs de när datorn ritas, som förut */ }
  skarm(null);
  return { skarm, paint, open, ruta, resize };
}
