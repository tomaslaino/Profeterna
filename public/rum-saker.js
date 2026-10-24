// Sakerna i tobaksaffären (rum.js): på pulten till höger om kvittot, i
// three.js som gänget (rum-3d.js), en askkopp i bärnstensfärgat glas med
// fimpar och en cigarett som ryker i ett av spåren, en öppen snusdosa med
// locket bredvid och, bara när det är varmt i Stockholm, en gulnad bordsfläkt
// som svänger fram och tillbaka och blåser röken åt sidan när den pekar mot
// askkoppen. På insidan av dörrens
// glas sitter en VM 94-affisch: ett foto från landslagets hemkomst den 18 juli
// 1994 (Sniper Zeta, CC BY-SA 4.0, Wikimedia Commons).
//
// Slitaget skiftar från dag till dag och följer tippningen: går det dåligt
// (fler fel bland omgångens avgjorda matcher, annars i den senaste
// färdigspelade kupongen) fylls askkoppen och askan hamnar bredvid, snuset
// spills, fläkten går på trean och affischen hänger snett med ett hörn som
// har släppt; går det riktigt dåligt ryker två cigaretter. Dolda resultat
// räknas inte (gradeRow rättar dem inte).
//
// Världen: 1 enhet ≈ 1 px i pultens plan; pulten är y = 0 och z pekar mot
// betraktaren. Allt rör sig efter klockan t: samma t ger samma bild, också
// röken. ?rum-slit=0…1 bestämmer slitaget (för bilder).
//
// Fikat på vissa dagar – semlor, pepparkakor, lussekatter och annat från
// konditoriet – står bakom kvittot eller där det får plats (rum-fika.js).
//
// saker(el, { calm }) → { draw(t, mx, my, rows, old) }

import { dagens, bord } from './rum-fika.js';

const DEG = Math.PI / 180;
const D = 1400;
const ELEV = 34 * DEG;
// Sakerna står till höger om kvittot, kring O i pultens plan (före planets
// skala 1,095 kring mitten: x ≤ 1530 och y ≤ 850 syns i alla fönster).
// Duken är större åt vänster och uppåt, så att röken får plats när fläkten
// blåser den åt sidan.
const O = { x: 1418, y: 665 };
const BOX = { x: 1110, y: 400, w: 426, h: 460 };
// Platserna på pulten (pultens px), en per dag: fläkten med det håll den
// svänger kring (grader, 90 = mot betraktaren, 180 = åt vänster),
// askkoppen och snusdosan. Locket och prisen läggs där det finns plats.
const LAYOUTS = [
  { fan: [1478, 672, 160], ash: [1385, 742], snus: [1482, 812] },
  { fan: [1480, 670, 140], ash: [1462, 792], snus: [1392, 748] },
  { fan: [1236, 668, 35], ash: [1402, 738], snus: [1490, 806] },
  { fan: [1392, 668, 100], ash: [1478, 748], snus: [1394, 815] },
];
// där det finns plats: till höger om kvittot, och bakom det längst bak
const free = ([px, py]) => py >= 662 && py <= 846 && px <= 1522 && (px >= 1345 || (py <= 690 && px >= 1140));
// Affischen på insidan av skyltfönstret, efter dagen: i vänstra rutan under
// neonskylten, till vänster eller till höger (uppe till höger syns himlen,
// rum-ute.js) – under neonens list, så att VM 94 och BRONS syns.
const SPOTS = [{ x: 286, y: 220 }, { x: 474, y: 220 }];
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

const CREDIT = 'Henrik Larsson och Pontus Kåmark vid landslagets hemkomst efter VM, Norr Mälarstrand 18 juli 1994. Foto: Sniper Zeta, CC BY-SA 4.0 (Wikimedia Commons)';
const KALLA = 'https://commons.wikimedia.org/wiki/File:Football_players_Pontus_K%C3%A5mark_Henrik_Larsson,_July_18,_1994.jpg';

// Dagen i Stockholm som frö: sakerna ligger likadant hela dagen.
const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
// ?rum-dag=<tal> ger en annan dag (för bilder)
const daySeed = () => {
  const q = new URLSearchParams(location.search).get('rum-dag');
  if (q != null && Number.isFinite(Number(q))) return Number(q);
  return [...fDay.format(Date.now())].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7) % 9973;
};

// 0 = nyss städat, 1 = det har gått åt skogen. rows = omgångens rader
// (roundRows i rum.js), old = de färdigspelade kupongerna (senaste först).
function wearOf(rows, old, seed) {
  const forced = Number(new URLSearchParams(location.search).get('rum-slit'));
  if (new URLSearchParams(location.search).has('rum-slit') && Number.isFinite(forced)) return clamp(forced);
  let miss = null;
  const done = (rows || []).filter((x) => x.g && x.g.hit != null);
  if (done.length >= 3) miss = done.filter((x) => !x.g.hit).length / done.length;
  else {
    const c = (old || []).find((x) => x.n && x.rows && x.rows.length && !(window.Historik && Historik.hidden(x)));
    const n = c ? c.rows.filter((x) => x.hit != null).length : 0;
    if (n) miss = 1 - c.ok / n;
  }
  const base = miss == null ? 0.45 : 0.18 + (miss - 0.35) * 1.7;
  return clamp(base + (hash(seed + 0.5) - 0.5) * 0.2);
}

// ---------- affischen ----------

// Ett klick går fram till affischen (närbilden i rum.js), med fotografen under.
function poster(back) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-vm94 rum-sak';
  el.id = 'rum-vm94';
  el.dataset.sak = 'vm94';
  el.dataset.kalla = KALLA;
  el.title = CREDIT;
  el.setAttribute('aria-label', `Affisch: VM 94, brons. ${CREDIT}`);
  el.innerHTML = '<span class="ark"><span class="band"><b>VM 94</b><b>BRONS</b></span>' +
    '<span class="foto"><img src="rum/vm94.jpg" alt="" draggable="false"></span><span class="tryck"></span></span>' +
    '<span class="hund"></span><i class="tejp a"></i><i class="tejp b"></i>';
  back.append(el);
  return (w, seed) => {
    const p = SPOTS[Math.floor(hash(seed + 61) * SPOTS.length)];
    el.style.left = `${Math.round(p.x + (hash(seed + 62) - 0.5) * 12)}px`;
    el.style.top = `${Math.round(p.y + (hash(seed + 63) - 0.5) * 10)}px`;
    const loose = w > 0.85;
    el.classList.toggle('slappt', loose);
    const rot = loose ? 6.5 : (hash(seed + 1.7) - 0.5) * 1.6 + w * 2.4;
    el.style.setProperty('--rot', `${rot.toFixed(2)}deg`);
    el.style.setProperty('--curl', `${Math.round(sm(0.45, 0.95, w) * 26)}px`);
    el.style.setProperty('--sep', (0.15 + 0.35 * w).toFixed(2));
    el.style.setProperty('--sat', (1 - 0.4 * w).toFixed(2));
    el.style.setProperty('--blek', (0.1 + 0.3 * w).toFixed(2));
  };
}

export async function saker(el, opt = {}) {
  if (!document.querySelector('link[href="rum-saker.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'rum-saker.css';
    document.head.append(css);
  }
  // det bakersta planet (väggen och dörren) och pultens plan
  const planes = [...el.querySelectorAll('.rum-world > .rum-pl')];
  const back = planes[0];
  const pult = planes.find((p) => /translateZ\(-60px\)/.test(p.style.transform));
  const wearPoster = back ? poster(back) : () => {};

  // Fläkten står där bara när det känns som VARMT grader eller mer i Stockholm,
  // samma gräns som gängets tunnaste kläder (dress i rum-3d.js). Vädret
  // (vader.js) läses om var tionde sekund.
  // Dagens fika (rum-fika.js) läses samtidigt.
  const VARMT = 21;
  let varmt = null;
  let fika;
  let vAt = -Infinity;
  function vader() {
    const ms = performance.now();
    if (ms - vAt < 10e3) return false;
    vAt = ms;
    const v = window.Vader ? Vader.nu() : null;
    const w = !!v && v.kanns >= VARMT;
    const f = dagens(v);
    if (w === varmt && f === fika) return false;
    varmt = w;
    fika = f;
    return true;
  }

  let seed = daySeed();
  let key = null;
  let wear = 0.45;
  // slitaget räknas om när omgången eller dagen ändras
  function update(rows, old) {
    const s = daySeed();
    if (rows === key?.rows && old === key?.old && s === seed) return false;
    seed = s;
    key = { rows, old };
    wear = wearOf(rows, old, seed);
    wearPoster(wear, seed);
    return true;
  }
  update(null, null);

  let three = null;
  if (pult) {
    try {
      three = await props(pult, opt);
    } catch (err) {
      console.warn('Rummet: sakerna på pulten kunde inte ritas', err);
    }
  }
  return {
    draw(t, mx, my, rows, old) {
      if (update(rows, old) && three) three.wear(wear, seed);
      if (three && vader()) three.power(varmt, fika);
      if (three) three.draw(t, mx, my);
    },
  };
}

// ---------- pulten ----------

async function props(pult, opt) {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const canvas = document.createElement('canvas');
  canvas.className = 'rum-saker';
  canvas.width = BOX.w;
  canvas.height = BOX.h;
  Object.assign(canvas.style, { left: `${BOX.x}px`, top: `${BOX.y}px`, width: `${BOX.w}px`, height: `${BOX.h}px` });
  pult.append(canvas);

  // i telefonen färre bildpunkter, ingen kantutjämning och mindre skuggkartor,
  // så att minnet räcker
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const SKUGGA = LATT ? 1024 : 2048;
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !LATT });
  r.setPixelRatio(LATT ? 1.5 : Math.min((window.devicePixelRatio || 1) * 1.25, 2.5));
  r.setSize(BOX.w, BOX.h, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(r);
  if (LATT) pmrem._setSize = (n) => THREE.PMREMGenerator.prototype._setSize.call(pmrem, Math.min(n, 128));
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  // kameran ser på O; duken är en bit av en bild som har O i mitten
  const full = { w: 2 * Math.max(O.x - BOX.x, BOX.x + BOX.w - O.x), h: 2 * Math.max(O.y - BOX.y, BOX.y + BOX.h - O.y) };
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(full.h / 2 / D) / DEG, full.w / full.h, 50, 5000);
  cam.position.set(0, D * Math.sin(ELEV), D * Math.cos(ELEV));
  cam.lookAt(0, 0, 0);
  cam.setViewOffset(full.w, full.h, BOX.x - (O.x - full.w / 2), BOX.y - (O.y - full.h / 2), BOX.w, BOX.h);
  cam.updateMatrixWorld();
  const ray = new THREE.Raycaster();
  const deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const onDesk = (px, py) => {
    ray.setFromCamera(new THREE.Vector2(((px - BOX.x) / BOX.w) * 2 - 1, 1 - ((py - BOX.y) / BOX.h) * 2), cam);
    return ray.ray.intersectPlane(deskPlane, new THREE.Vector3());
  };
  const toPult = (x, z) => { const p = new THREE.Vector3(x, 0, z).project(cam); return [BOX.x + ((p.x + 1) / 2) * BOX.w, BOX.y + ((1 - p.y) / 2) * BOX.h]; };

  // ljuset som i rummet: lysröret uppe till vänster, neonen bakom till
  // vänster, terminalen bakom till höger
  scene.add(new THREE.HemisphereLight('#d8d0b8', '#3a2a20', 0.5));
  const key = new THREE.DirectionalLight('#fff0d6', 2.1);
  key.position.set(-420, 700, 300);
  key.target.position.set(0, 0, 80);
  key.castShadow = true;
  key.shadow.mapSize.set(SKUGGA, SKUGGA);
  key.shadow.radius = 8;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.6;
  Object.assign(key.shadow.camera, { left: -420, right: 420, top: 420, bottom: -420, near: 10, far: 2400 });
  scene.add(key, key.target);
  const neon = new THREE.DirectionalLight('#ff3a26', 1.6);
  neon.position.set(-500, 220, -320);
  scene.add(neon);
  const term = new THREE.DirectionalLight('#5ff0dc', 0.55);
  term.position.set(320, 160, -300);
  scene.add(term);
  const fill = new THREE.DirectionalLight('#ffd9b0', 0.45);
  fill.position.set(-200, 120, 600);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);
  // skuggorna faller bara på pulten, som slutar vid z = −27 (kanten, y = 650)
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(700, 480), new THREE.ShadowMaterial({ opacity: 0.36 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.z = -27 + 240;
  catcher.receiveShadow = true;
  world.add(catcher);

  const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, envMapIntensity: 0.5, roughness: 0.6 }, o));
  const mesh = (g, m, parent) => { const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; parent.add(x); return x; };
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
  // brus med fast frö, till askan, snuset och dammet
  const specks = (g, w, h, n, cols, rmax, s0) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[Math.floor(hash(s0 + i * 1.3) * cols.length)];
      g.globalAlpha = 0.35 + hash(s0 + i * 2.9) * 0.65;
      g.beginPath();
      g.arc(hash(s0 + i * 0.7) * w, hash(s0 + i * 4.1) * h, 0.4 + hash(s0 + i * 3.3) * rmax, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  // en skiva med en hög på: höjden h(x, z) i skivans plan (y uppåt)
  function heap(rad, n, h) {
    const geo = new THREE.CircleGeometry(rad, n, 0, Math.PI * 2);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, h(p.getX(i), p.getZ(i)));
    geo.computeVertexNormals();
    return geo;
  }

  // ---------- askkoppen ----------

  const ASH = { x: 0, z: 0, R: 45 };
  const tray = new THREE.Group();
  world.add(tray);
  // genomskärningen utifrån och in: foten, sidan, kanten och skålen
  const prof = [[0, 0], [36, 0], [40, 0.6], [43, 2.6], [44.6, 8], [45, 13.2], [44, 15.2], [40.5, 16], [37, 15.2], [34.5, 11], [31.5, 7], [22, 5.9], [0, 5.7]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const trayGeo = new THREE.LatheGeometry(prof, 144);
  // tre spår i kanten för cigaretterna
  const NOTCH = [22 * DEG, 142 * DEG, 262 * DEG];
  {
    const p = trayGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      if (Math.hypot(x, z) < 33 || y < 8) continue;
      const a = Math.atan2(z, x);
      for (const n of NOTCH) {
        const d = Math.atan2(Math.sin(a - n), Math.cos(a - n));
        if (Math.abs(d) < 10 * DEG) p.setY(i, y - 5.6 * Math.cos(d / (10 * DEG) * Math.PI / 2) ** 2 * sm(8, 15, y));
      }
    }
    trayGeo.computeVertexNormals();
  }
  const glassO = { color: '#c27a2c', transparent: true, opacity: 0.44, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2, specularIntensity: 1, ior: 1.52, depthWrite: false };
  const trayBack = new THREE.Mesh(trayGeo, mat('#a86424', { ...glassO, side: THREE.BackSide, opacity: 0.38 }));
  trayBack.renderOrder = 1;
  tray.add(trayBack);
  const trayFront = new THREE.Mesh(trayGeo, mat('#c98236', glassO));
  trayFront.renderOrder = 2;
  trayFront.castShadow = true;
  tray.add(trayFront);
  // sotet på insidan av kanten
  const soot = new THREE.Mesh(new THREE.LatheGeometry([[31.2, 7.1], [34.2, 11], [36.6, 15]].map(([x, y]) => new THREE.Vector2(x, y)), 96),
    mat('#3a342e', { transparent: true, opacity: 0.2, roughness: 1, depthWrite: false, side: THREE.DoubleSide }));
  soot.renderOrder = 1;
  tray.add(soot);

  const ashTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8a857d';
    g.fillRect(0, 0, w, h);
    specks(g, w, h, 900, ['#9f9a90', '#76716a', '#b3ada2', '#5e5a54'], 5, 11);
    specks(g, w, h, 160, ['#1f1b18', '#2e2925'], 1.6, 37);
    specks(g, w, h, 60, ['#e6dccb', '#cfc2a8'], 1.4, 59);
  });
  const ashMat = mat('#ffffff', { map: ashTex, roughness: 1, envMapIntensity: 0.25 });
  const bump = (x, z, s) => Math.exp(-(x * x + z * z) / (s * s));
  let ashBed = null;
  function ashFill(w, s) {
    if (ashBed) { tray.remove(ashBed); ashBed.geometry.dispose(); }
    const hi = 0.5 + 3.6 * w;
    const ax = (hash(s + 3) - 0.5) * 16;
    const az = (hash(s + 4) - 0.5) * 16;
    const edge = (x, z) => 1 - sm(22, 29, Math.hypot(x, z));
    ashBed = mesh(heap(29, 64, (x, z) => 5.9 + edge(x, z) * (hi * bump(x - ax, z - az, 16) + hi * 0.5 * bump(x + az, z - ax, 10) + 0.4 + 0.4 * Math.sin(x * 0.9 + z * 1.3))), ashMat, tray);
  }

  // fimparna: filtret, det som är kvar av papperet och den brända änden;
  // de flesta är nedtryckta och böjda
  const corkTex = canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#d18f4a';
    g.fillRect(0, 0, w, h);
    specks(g, w, h, 260, ['#b8732f', '#e7ac6a', '#a8652a'], 1.3, 5);
  });
  const filterMat = mat('#ffffff', { map: corkTex, roughness: 0.75 });
  const paperMat = mat('#f1ece2', { roughness: 0.7 });
  const charMat = mat('#2b2521', { roughness: 1 });
  const smudge = mat('#8f877b', { roughness: 0.9 });
  const BUTTS = 13;
  const butts = [];
  for (let i = 0; i < BUTTS; i++) {
    const g = new THREE.Group();
    const L = 5 + hash(i * 3.1 + 0.2) * 10;
    const f = mesh(new THREE.CylinderGeometry(2.5, 2.5, 13, 14), filterMat, g);
    f.rotation.z = Math.PI / 2;
    f.position.x = -6.5;
    const bend = new THREE.Group();
    g.add(bend);
    const crushed = hash(i * 1.7 + 0.4) > 0.35;
    bend.rotation.z = crushed ? (12 + hash(i * 5.3) * 35) * DEG : 0;
    bend.rotation.y = crushed ? (hash(i * 2.2) - 0.5) * 40 * DEG : 0;
    const pp = mesh(new THREE.CylinderGeometry(2.42, 2.45, L, 14), hash(i * 6.1) > 0.6 ? smudge : paperMat, bend);
    pp.rotation.z = Math.PI / 2;
    pp.position.x = L / 2;
    const end = mesh(new THREE.CylinderGeometry(crushed ? 2.9 : 2.2, 2.42, 1.6, 12), charMat, bend);
    end.rotation.z = Math.PI / 2;
    end.position.x = L + 0.7;
    if (crushed) end.scale.set(1, 1, 0.55);
    g.visible = false;
    tray.add(g);
    butts.push({ g, len: 13 + L });
  }
  function placeButts(w, s) {
    const n = Math.min(BUTTS, Math.round(1 + w * 10 + (hash(s + 9) - 0.5) * 2));
    const top = 6 + 0.5 + 3.6 * w;
    butts.forEach((b, i) => {
      b.g.visible = i < n;
      // vinkeln, utom i sektorn under cigaretten i spår 0
      const a = NOTCH[0] + (40 + hash(s + i * 7.7) * 280) * DEG;
      const rr = 3 + hash(s + i * 3.9) * 11;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      b.g.position.set(x, top + 2.2 + i * 0.35 + 1.8 * bump(x, z, 16) * w, z);
      // ungefär tvärs över skålen, så att ändarna inte sticker ut genom glaset
      b.g.rotation.set((hash(s + i) - 0.5) * 0.5, a + Math.PI / 2 + (hash(s + i * 2.3) - 0.5) * 1.1, (hash(s + i * 4.4) - 0.5) * 0.35);
    });
  }

  // askan som hamnat bredvid
  const flakeMat = mat('#9a948a', { roughness: 1, transparent: true, opacity: 0.85 });
  const flakes = [];
  for (let i = 0; i < 18; i++) {
    const m = mesh(new THREE.CircleGeometry(1, 7), flakeMat, world);
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    m.visible = false;
    flakes.push(m);
  }
  function placeFlakes(w, s) {
    const n = Math.round(w * w * 18);
    flakes.forEach((m, i) => {
      m.visible = i < n;
      const a = (110 + hash(s + i * 1.9) * 200) * DEG;
      const rr = ASH.R + 6 + hash(s + i * 2.7) ** 1.6 * 46;
      m.position.set(ASH.x + Math.cos(a) * rr, 0.15, ASH.z + Math.sin(a) * rr * 0.8);
      const k = 0.8 + hash(s + i * 3.1) * 2.6;
      m.scale.set(k, k * (0.6 + hash(i) * 0.6), 1);
      m.rotation.z = hash(s + i * 5.1) * 6;
    });
  }

  // ---------- cigaretterna ----------

  const ember = new THREE.MeshBasicMaterial({ color: '#ff6a24', toneMapped: false });
  const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,180,90,1)'); gr.addColorStop(0.4, 'rgba(255,90,30,.5)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const smokeTex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(228,230,234,.9)'); gr.addColorStop(0.45, 'rgba(214,218,224,.38)'); gr.addColorStop(1, 'rgba(200,205,212,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  // i spår n: filtret utanför kanten, den glödande änden inne över skålen
  // (längs −x i cigarettens grupp)
  const SM = { every: 0.07, life: 6.2 };
  SM.n = Math.ceil(SM.life / SM.every) + 2;
  function cigarette(n, inner) {
    const g = new THREE.Group();
    const a = NOTCH[n];
    g.position.set(Math.cos(a) * 40.5, 10.3 + 2.4, Math.sin(a) * 40.5);
    g.rotation.y = -a;
    g.rotation.z = -5 * DEG;
    tray.add(g);
    const f = mesh(new THREE.CylinderGeometry(2.5, 2.5, 13, 16), filterMat, g);
    f.rotation.z = Math.PI / 2;
    f.position.x = 5.5;
    const pp = mesh(new THREE.CylinderGeometry(2.45, 2.45, inner, 16), paperMat, g);
    pp.rotation.z = Math.PI / 2;
    pp.position.x = -1 - inner / 2;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.5, 1.8, 16), ember.clone());
    ring.rotation.z = Math.PI / 2;
    ring.position.x = -1 - inner;
    g.add(ring);
    const ash = mesh(new THREE.CylinderGeometry(2.25, 2.4, 1, 14), mat('#9b958b', { roughness: 1 }), g);
    ash.rotation.z = Math.PI / 2;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthWrite: false, transparent: true, opacity: 0.5, toneMapped: false }));
    halo.scale.set(15, 15, 1);
    halo.position.x = -1 - inner;
    g.add(halo);
    const puffs = [];
    for (let i = 0; i < SM.n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, color: '#e4e6ea', toneMapped: false }));
      world.add(sp);
      puffs.push(sp);
    }
    const c = { g, ring, ash, halo, puffs, inner, n, at: new THREE.Vector3() };
    return c;
  }
  const cigs = [cigarette(0, 19), cigarette(1, 13)];

  // ---------- snusdosan ----------

  const SN = { x: 0, z: 0 };
  const dosa = new THREE.Group();
  world.add(dosa);
  const bandTex = canvasTex(512, 64, (g, w, h) => {
    g.fillStyle = '#efe8d8';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1f3566';
    g.fillRect(0, 18, w, 28);
    g.fillStyle = '#efe8d8';
    g.font = '700 19px Fraunces, Georgia, serif';
    g.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) g.fillText('PRIMA LÖSSNUS', 14 + i * 172, 33);
    specks(g, w, h, 120, ['#c9bfa8', '#8a7f68'], 1.2, 71);
  });
  mesh(new THREE.CylinderGeometry(20.6, 20.3, 11, 48, 1, true), mat('#ffffff', { map: bandTex, roughness: 0.45, clearcoat: 0.4 }), dosa).position.y = 5.5;
  mesh(new THREE.CylinderGeometry(20.3, 20.3, 0.8, 48), mat('#d9d0bd', { roughness: 0.6 }), dosa).position.y = 0.4;
  const rim = mesh(new THREE.TorusGeometry(20.2, 0.7, 8, 48), mat('#f4efe3', { roughness: 0.4 }), dosa);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 11;
  const snusTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5a3b20';
    g.fillRect(0, 0, w, h);
    specks(g, w, h, 1400, ['#6f4a2a', '#4a2f19', '#7d5834', '#3a2414'], 2.2, 17);
  });
  const snusMat = mat('#ffffff', { map: snusTex, roughness: 0.95, envMapIntensity: 0.2 });
  // snuset, med en grop där någon har tagit en pris
  mesh(heap(19.6, 48, (x, z) => 9.6 + 0.9 * bump(x - 4, z + 3, 12) - 2.2 * bump(x + 6, z - 5, 5.5) + 0.25 * Math.sin(x * 1.7) * Math.cos(z * 1.3)), snusMat, dosa);
  const lidTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f1ebdc';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1f3566';
    g.lineWidth = 14;
    g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.arc(128, 128, 84, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#1f3566';
    g.font = '800 58px Fraunces, Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SNUS', 128, 120);
    g.font = '700 20px Fraunces, Georgia, serif';
    g.fillText('N:o 1', 128, 166);
    specks(g, w, h, 160, ['#bfb39a', '#8a7f68'], 1.6, 83);
  });
  const lid = new THREE.Group();
  world.add(lid);
  const lidTop = mesh(new THREE.CylinderGeometry(21.6, 21.6, 1, 48), [mat('#efe8d8', { roughness: 0.4 }), mat('#ffffff', { map: lidTex, roughness: 0.35, clearcoat: 0.5 }), mat('#d8cfbb', { roughness: 0.5 })], lid);
  lidTop.position.y = 4;
  mesh(new THREE.CylinderGeometry(21.6, 21.6, 4.2, 48, 1, true), mat('#1f3566', { roughness: 0.4, clearcoat: 0.5, side: THREE.DoubleSide }), lid).position.y = 2.1;
  // En plats d från p åt något håll (börjar vid a0) där det finns plats på
  // pulten och som går fri från askkoppen, fläkten och det som redan ligger
  // där (keep = [x, z, radie]).
  function spotNear(p, d, a0, r, keep = []) {
    const busy = [[ASH.x, ASH.z, ASH.R], [FAN.x, FAN.z, 34], ...keep];
    for (let k = 0; k < 16; k++) {
      const a = a0 + 0.4 * (k % 2 ? 1 : -1) * Math.ceil(k / 2);
      const x = p.x + Math.cos(a) * d;
      const z = p.z + Math.sin(a) * d * 0.7;
      if (free(toPult(x, z)) && busy.every(([bx, bz, br]) => Math.hypot(x - bx, z - bz) > br + r + 4)) return { x, z, a };
    }
    return null;
  }
  // locket, efter dagen: bredvid dosan (längre bort när det går dåligt),
  // lutat mot dosans kant eller upp och ner
  const LID = { x: 0, z: 0 };
  function placeLid(w, s) {
    const v = hash(s + 21);
    const lean = v >= 0.4 && v < 0.75 && w <= 0.7;
    const d = lean ? 30 : 46 + w * 18 + hash(s + 23) * 8;
    const a0 = hash(s + 22) * Math.PI * 2;
    const at = spotNear(SN, d, a0, lean ? 8 : 22) || spotNear(SN, 30, a0, 8) || { x: SN.x - 30, z: SN.z, a: Math.PI };
    lid.rotation.set(0, hash(s + 24) * 6, 0);
    Object.assign(LID, { x: at.x, z: at.z });
    if (lean) {
      lid.position.set(at.x, 3, at.z);
      lid.rotation.set(0, -at.a + Math.PI / 2, 0);
      lid.rotateX(58 * DEG);
    } else if (v < 0.75) {
      lid.position.set(at.x, 0, at.z);
    } else {
      lid.position.set(at.x, 4.6, at.z);
      lid.rotation.x = Math.PI;
    }
  }
  // smulorna och, när det har gått riktigt illa, en använd pris på pulten
  const crumbMat = mat('#5a3b20', { roughness: 0.9 });
  const crumbs = [];
  for (let i = 0; i < 22; i++) {
    const m = mesh(new THREE.IcosahedronGeometry(1, 0), crumbMat, world);
    m.castShadow = false;
    m.visible = false;
    crumbs.push(m);
  }
  const pris = mesh(new THREE.SphereGeometry(1, 16, 10), mat('#4a2e18', { roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15 }), world);
  pris.scale.set(6.5, 2.6, 4.2);
  const fleck = mesh(new THREE.CircleGeometry(9, 20), mat('#3a2412', { transparent: true, opacity: 0.25, roughness: 0.3, depthWrite: false }), world);
  fleck.rotation.x = -Math.PI / 2;
  fleck.castShadow = false;
  function placeSnus(w, s) {
    const pr = spotNear(ASH, 62 + hash(s + 31) * 14, hash(s + 32) * Math.PI * 2, 8, [[SN.x, SN.z, 21], [LID.x, LID.z, 22]]) || { x: ASH.x + 60, z: ASH.z + 40 };
    const n = Math.round(w * 22);
    crumbs.forEach((m, i) => {
      m.visible = i < n;
      const a = hash(s + i * 1.37) * Math.PI * 2;
      const rr = 22 + hash(s + i * 2.17) ** 1.5 * 34;
      m.position.set(SN.x + Math.cos(a) * rr, 0.5, SN.z + Math.sin(a) * rr * 0.75);
      const k = 0.6 + hash(s + i * 4.3) * 1.2;
      m.scale.set(k, k * 0.5, k * 0.8);
      m.rotation.set(hash(i) * 6, hash(i + 1) * 6, 0);
    });
    const show = w > 0.7;
    pris.visible = fleck.visible = show;
    const px = pr.x;
    const pz = pr.z;
    pris.position.set(px, 1.8, pz);
    pris.rotation.y = hash(s + 33) * 3;
    fleck.position.set(px + 1, 0.12, pz + 1);
  }

  // ---------- fläkten ----------
  // Gulnad plast med blå propeller, svänger ±38° kring φC; huvudet pekar åt
  // (cos φ, 0, sin φ). Knappen som är nedtryckt är farten: ettan när det går
  // bra, trean när det går dåligt. Utan fläktväder (power(false)) är den borta.

  const FAN = { x: 0, z: 0, R: 36, phiC: 160 * DEG, amp: 40 * DEG, period: 15 };
  let phiAsh = 0;
  const plast = mat('#dccf9f', { roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const plast2 = mat('#cdbf8c', { roughness: 0.5 });
  const dammTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#dccf9f';
    g.fillRect(0, 0, w, h);
    specks(g, w, h, 500, ['#b8aa7e', '#9a8f72', '#e8dcb0', '#8c826a'], 1.4, 29);
  });
  const housing = mat('#ffffff', { map: dammTex, roughness: 0.55, clearcoat: 0.25 });
  const fan = new THREE.Group();
  world.add(fan);
  const foot = new THREE.Group();
  fan.add(foot);
  mesh(new RoundedBoxGeometry(62, 11, 50, 4, 5), plast, foot).position.y = 5.5;
  const keys = [];
  for (let i = 0; i < 4; i++) {
    const k = mesh(new RoundedBoxGeometry(9, 5, 7, 2, 1.4), i === 0 ? mat('#b8452f', { roughness: 0.45 }) : plast2, foot);
    k.position.set(-15 + i * 10, 11.5, 18);
    keys.push(k);
  }
  const stem = mesh(new THREE.CylinderGeometry(4.2, 5.6, 60, 20), plast, foot);
  stem.position.set(0, 41, -6);
  const swivel = new THREE.Group();
  swivel.position.set(0, 76, -6);
  fan.add(swivel);
  mesh(new THREE.SphereGeometry(7, 20, 14), plast2, swivel);
  const head = new THREE.Group();
  head.rotation.x = -7 * DEG;
  swivel.add(head);
  // motorn bakom propellern, längs −z
  const motor = mesh(new THREE.LatheGeometry([[0, 0], [10, 0], [15.5, 3], [17.5, 10], [17.5, 22], [14, 28], [0, 29]].map(([x, y]) => new THREE.Vector2(x, y)), 40), housing, head);
  motor.rotation.x = Math.PI / 2;
  motor.position.z = -30;
  const knob = mesh(new THREE.CylinderGeometry(3, 3.4, 9, 14), plast2, head);
  knob.position.set(0, 18, -18);
  // gallret: ringar och ekrar fram och bak, välvt
  const wire = mat('#e2d6ac', { roughness: 0.45, clearcoat: 0.3 });
  const R = FAN.R;
  const domeF = (rho) => 6 + 9 * (1 - (rho / R) ** 2);
  const domeB = (rho) => -4 - 6 * (1 - (rho / R) ** 2);
  const cage = new THREE.Group();
  head.add(cage);
  for (const rho of [0.21, 0.4, 0.6, 0.79, 0.95].map((k) => k * R)) {
    for (const f of [domeF, domeB]) {
      const t = mesh(new THREE.TorusGeometry(rho, 0.55, 6, 64), wire, cage);
      t.position.z = f(rho);
    }
  }
  const lip = mesh(new THREE.TorusGeometry(R + 0.8, 2.1, 10, 72), plast, cage);
  lip.position.z = 1;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    for (const f of [domeF, domeB]) {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const rho = 4 + (R - 4) * (k / 8);
        pts.push(new THREE.Vector3(Math.cos(a) * rho, Math.sin(a) * rho, f(rho)));
      }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.5, 5), wire, cage);
    }
  }
  const badgeTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#e8ddb6';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#8a7b52';
    g.lineWidth = 5;
    g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#7a6b44';
    g.font = '700 30px Fraunces, Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('3', 64, 66);
  });
  const badge = mesh(new THREE.CylinderGeometry(8.5, 8.5, 2, 28), [plast, mat('#ffffff', { map: badgeTex, roughness: 0.4 }), plast], cage);
  badge.rotation.x = Math.PI / 2;
  badge.position.z = domeF(0) + 1;
  // propellern: tre blad i blå plast, med en eftersläpning när den snurrar
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-4, 6);
  bladeShape.bezierCurveTo(-13, 18, -18, 30, -9, 38);
  bladeShape.bezierCurveTo(-1, 43, 12, 38, 13, 27);
  bladeShape.bezierCurveTo(12, 16, 6, 9, 4, 6);
  bladeShape.closePath();
  const bladeGeo = new THREE.ShapeGeometry(bladeShape, 16);
  const prop = new THREE.Group();
  prop.position.z = 1.5;
  prop.scale.setScalar(R / 42);
  head.add(prop);
  const ghosts = [];
  for (let gI = 0; gI < 4; gI++) {
    const set = new THREE.Group();
    const m = mat('#8fb7cf', { transparent: true, opacity: gI ? 0.32 - gI * 0.07 : 0.62, roughness: 0.2, clearcoat: 0.6, side: THREE.DoubleSide, depthWrite: !gI });
    for (let b = 0; b < 3; b++) {
      const pitch = new THREE.Group();
      pitch.rotation.z = (b * 120) * DEG;
      const one = new THREE.Mesh(bladeGeo, m);
      one.rotation.y = 22 * DEG;
      one.castShadow = !gI;
      pitch.add(one);
      set.add(pitch);
    }
    prop.add(set);
    ghosts.push(set);
  }
  const hub = mesh(new THREE.CylinderGeometry(6.5, 7.5, 6, 24), mat('#7da6bf', { roughness: 0.3, clearcoat: 0.5 }), prop);
  hub.rotation.x = Math.PI / 2;
  const blur = new THREE.Mesh(new THREE.CircleGeometry(R * 0.93, 48), mat('#9cc1d6', { transparent: true, opacity: 0, roughness: 0.3, depthWrite: false, side: THREE.DoubleSide }));
  blur.position.z = 1.5;
  head.add(blur);
  // remsan av en gammal kupong som fladdrar i draget
  const stripTex = canvasTex(16, 128, (g, w, h) => {
    g.fillStyle = '#efe6d0';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8643a';
    g.fillRect(0, 0, w, 9);
    g.fillStyle = '#b9ad92';
    for (let y = 18; y < h; y += 11) g.fillRect(3, y, w - 6, 1);
  });
  const STRIP = { w: 3.4, l: 30, n: 14 };
  const stripGeo = new THREE.PlaneGeometry(STRIP.w, STRIP.l, 1, STRIP.n);
  const strip = new THREE.Mesh(stripGeo, mat('#ffffff', { map: stripTex, roughness: 0.8, side: THREE.DoubleSide }));
  strip.castShadow = true;
  strip.position.set(0, R + 1, domeF(R) + 2);
  head.add(strip);

  let speed = 1;
  const phiAt = (t) => FAN.phiC + FAN.amp * Math.sin((t / FAN.period) * Math.PI * 2);
  // draget vid askkoppen: hur rakt fläkten pekar mot den
  const windAt = (t) => (fan.visible ? (6 + speed * 7) * Math.max(0, Math.cos(phiAt(t) - phiAsh)) ** 6 : 0);

  // dagens platser, med några px hit eller dit
  function arrange(s) {
    const L = LAYOUTS[Math.floor(hash(s + 51) * LAYOUTS.length)];
    const j = (k) => (hash(s + k) - 0.5) * 10;
    const a = onDesk(L.ash[0] + j(52), L.ash[1] + j(53));
    const n = onDesk(L.snus[0] + j(54), L.snus[1] + j(55));
    const f = onDesk(L.fan[0] + j(56), L.fan[1]);
    Object.assign(ASH, { x: a.x, z: a.z });
    Object.assign(SN, { x: n.x, z: n.z });
    Object.assign(FAN, { x: f.x, z: f.z, phiC: (L.fan[2] + (hash(s + 57) - 0.5) * 16) * DEG });
    tray.position.set(a.x, 0.3, a.z);
    dosa.position.set(n.x, 0, n.z);
    dosa.rotation.y = hash(s + 58) * 6;
    fan.position.set(f.x, 0, f.z);
    foot.rotation.y = Math.PI / 2 - FAN.phiC;
    phiAsh = Math.atan2(ASH.z - FAN.z, ASH.x - FAN.x);
  }

  // ---------- fikat ----------
  // Dagens fika (rum-fika.js): bakom kvittot om det får plats där, annars
  // till höger, fritt från askkoppen, dosan, locket, prisen och fläkten.

  const FK = bord(THREE, { world, mat, mesh, canvasTex, specks, heap, hash });
  let fikat = null;
  let last = [0.45, 0];
  function placeFika(w, s) {
    if (!fikat) { FK.visa(null); return; }
    const r = FK.r(fikat);
    const busy = [[ASH.x, ASH.z, ASH.R], [SN.x, SN.z, 21], [LID.x, LID.z, 22]];
    if (fan.visible) busy.push([FAN.x, FAN.z, FAN.R]);
    if (pris.visible) busy.push([pris.position.x, pris.position.z, 8]);
    const cand = [[1250, 682], [1200, 682], [1300, 682]];
    for (let y = 700; y <= 836; y += 12) for (let x = 1370; x <= 1510; x += 14) cand.push([x, y]);
    const ok = cand.find((c) => { const p = onDesk(...c); return free(c) && busy.every(([bx, bz, br]) => Math.hypot(p.x - bx, p.z - bz) > br + r * 0.8); });
    FK.visa(fikat, onDesk(...(ok || cand[0])), w, s);
  }

  function wear(w, s) {
    arrange(s);
    ashFill(w, s);
    placeButts(w, s);
    placeFlakes(w, s);
    placeLid(w, s);
    placeSnus(w, s);
    last = [w, s];
    placeFika(w, s);
    speed = w > 0.66 ? 3 : w > 0.33 ? 2 : 1;
    keys.forEach((k, i) => { k.position.y = i === speed ? 9.6 : 11.5; });
    const dust = 0.25 + 0.45 * w;
    wire.color.set('#e2d6ac').lerp(new THREE.Color('#8f8566'), dust * 0.5);
    soot.material.opacity = 0.15 + 0.4 * w;
    // två som ryker när det har gått riktigt illa
    cigs[1].on = w > 0.8;
    cigs[1].g.visible = cigs[1].on;
    cigs[0].on = true;
    tray.rotation.y = hash(s + 41) * Math.PI * 2 / 3 - Math.PI / 3;
  }

  // fläkten när det är varmt, och dagens fika
  function power(o, f) {
    fan.visible = !!o;
    fikat = f || null;
    placeFika(...last);
  }

  // ---------- en bild ----------

  const fp = new THREE.Vector3();
  const off = new THREE.Vector3();
  // glöden i världens (world) axlar, så att röken inte vrids med musen
  const toWorld = new THREE.Matrix4();
  function smoke(c, t) {
    toWorld.copy(world.matrixWorld).invert().multiply(c.g.matrixWorld);
    c.at.set(-1 - c.inner - 0.6, 1.2, 0).applyMatrix4(toWorld);
    const base = Math.floor(t / SM.every);
    c.puffs.forEach((sp, i) => {
      const k = base - i;
      const tb = k * SM.every;
      const age = t - tb;
      if (!c.on || age < 0 || age > SM.life) { sp.visible = false; return; }
      const life = age / SM.life;
      const seed = k * 7.13 + c.n * 31;
      // draget från fläkten under puffens liv, åt det håll fläkten pekar
      off.set(0, 0, 0);
      const steps = Math.ceil(age / 0.25);
      for (let j = 0; j < steps; j++) {
        const a0 = (j + 0.5) * (age / steps);
        const tau = tb + a0;
        const wv = windAt(tau) * sm(0.3, 1.6, a0) * (age / steps);
        const ph = phiAt(tau);
        off.x += Math.cos(ph) * wv;
        off.z += Math.sin(ph) * wv * 0.5;
      }
      fp.copy(c.at);
      // en tunn tråd närmast glöden som slingrar sig och löses upp högre upp
      const curl = Math.sin(age * 1.9 + tb * 0.7) * (0.5 + age * 2.4) + Math.sin(age * 0.7 + hash(seed + 1) * 6) * age * 2.2;
      fp.y += 15 * age + 0.8 * age * age;
      fp.x += curl + age * 1.2 + off.x;
      fp.z += Math.cos(age * 1.1 + tb) * age * 1.6 + off.z;
      fp.y += off.y;
      sp.position.copy(fp);
      const size = 1.8 + age * 4.4 + age * age * 0.7 + off.length() * 0.12;
      sp.scale.set(size, size, 1);
      sp.material.opacity = 0.62 * Math.min(1, age * 5) * (1 - life) ** 1.35 * (1 - clamp(off.length() / 140) * 0.5);
      sp.material.rotation = hash(seed + 2) * 6 + age * 0.3;
      sp.visible = true;
    });
  }

  const flicker = (t, s) => 0.78 + 0.14 * Math.sin(t * 7.3 + s) + 0.08 * Math.sin(t * 17.1 + s * 2);
  function draw(t, mx, my) {
    const calm = opt.calm;
    world.rotation.y = mx * 3 * Math.PI / 180;
    world.rotation.x = my * 1.5 * Math.PI / 180;
    scene.updateMatrixWorld();
    // askan på cigaretten växer i 50 s och faller
    for (const c of cigs) {
      if (!c.on) continue;
      const ph = ((t + c.n * 17) % 50) / 50;
      const L = 1 + 6 * ph;
      c.ash.scale.set(1, L, 1);
      c.ash.position.x = -1 - c.inner - 0.45 - L / 2;
      const f = flicker(t, c.n * 3);
      c.ring.material.color.setRGB(1, 0.32 + 0.14 * f, 0.1 * f);
      c.halo.material.opacity = 0.35 + 0.3 * f;
      c.halo.position.x = -1 - c.inner - 0.4;
      smoke(c, t);
    }
    // fläkten: huvudet svänger, propellern snurrar, remsan fladdrar
    const ph = phiAt(t);
    swivel.rotation.y = Math.PI / 2 - ph;
    const spin = calm ? 0.4 : t * (5.4 + speed * 1.7) * Math.PI * 2;
    ghosts.forEach((set, i) => {
      set.rotation.z = -spin + i * 11 * DEG;
      set.visible = !calm || i === 0;
    });
    blur.material.opacity = calm ? 0 : 0.08 + speed * 0.025;
    const p = stripGeo.attributes.position;
    const blow = calm ? 0.3 : 0.55 + speed * 0.15;
    for (let i = 0; i < p.count; i++) {
      const v = Math.floor(i / 2);
      const s = v / STRIP.n;
      const along = s * STRIP.l;
      const wave = calm ? 0 : Math.sin(s * 9 - t * (16 + speed * 4)) * s * (1.5 + speed * 0.8);
      // remsan hänger i gallrets överkant och blåser ut framåt
      p.setY(i, -along * (1 - blow) * 0.9 + wave * 0.3);
      p.setZ(i, along * blow + wave);
      p.setX(i, (i % 2 ? 0.5 : -0.5) * STRIP.w + wave * 0.25);
    }
    p.needsUpdate = true;
    stripGeo.computeVertexNormals();
    r.render(scene, cam);
  }

  return { wear, power, draw };
}
