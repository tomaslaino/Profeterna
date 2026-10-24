// Kortlådan i tobaksaffären i three.js, som inredningen (rum-inredning.js)
// och sakerna på pulten (rum-saker.js). Korten, datan och kortet i handen
// sköts av rum-register.js. Lådan är av lackad teak och står på disken under
// anslagstavlans högra hörn, med en mässingshållare fram där etiketten säger
// KRITAN, överstruket, och Lagen med kulspets. I lådan står avdelarna av
// pressad kartong (Lagen grön, Mötena röd), lagkorten med flikar av plast i
// divisionens färg (som på Tabeller) och mötenas blå kort.
//
// I rummet ritas lådan när korten ändras, med samma kamera som högra väggen,
// och kopieras till duken i länken på disken, så att den lyser när man pekar
// på den. Närbilden ritas direkt i en duk över hela fönstret: lådan lyfter
// från disken, vänder sig mot en och lutar så att man ser ner i den, medan
// bilden zoomar in (en del av samma bild, så att perspektivet är detsamma och
// lådan skarp). Kortet under muspekaren reser sig lite, och ett kort som tas
// upp reser sig ur lådan innan det tas i handen.
//
// Världen: som rum-inredning.js – X = x, Y = −y och Z ut från hörnet mot
// betraktaren, i högra väggens mått; ögat står i (760, 400) på avståndet
// 1000, och disken är Y = −490 mellan X = 1060 och väggen i X = 1140.
//
// kortlada({ duk, nara, calm, box }) → { deck(cards, wear), paint(), open(on, från) → Promise,
//   pick(x, y), hover(id), rise(id, up) → Promise, hide(id, on), rect(id), tilt(x, y), frame(), resize() }

const DEG = Math.PI / 180;
const EYE = [760, 400];
const E = 1000;
const FW = 2 * Math.max(EYE[0], 1600 - EYE[0]);
const FH = 2 * Math.max(EYE[1], 1000 - EYE[1]);
// lådans mitt i botten, på disken
const POS = { x: 1109, y: -490, z: 306 };
// lådan: bredd, höjd, djup, väggarna och botten; korten (A6), flikarna och
// avdelarna, som är lite högre
const B = { w: 46, h: 24, d: 68, t: 2.2, b: 1.8 };
const C = { w: 40.6, h: 28.8, th: 0.26, tab: 3.6, skilj: 1.4 };
const DV = { pl: '#2a78d6', ch: '#eb6834', l1: '#1baf7a', l2: '#eda100' };
// lådan nära: lyft från disken och vänd mot ögat, lutad så att man ser ner i den
const NARA_AT = { x: POS.x - 24, y: POS.y + 34, z: POS.z + 50 };
const NARA = { yaw: Math.atan2(EYE[0] - NARA_AT.x, E - NARA_AT.z), pitch: 31 * DEG };
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

export async function kortlada(o) {
  // duken i rummet (scenens px)
  const BOX = o.box;
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry: RB } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  await Promise.all(['40px "Special Elite"', '700 40px Caveat'].map((f) => document.fonts.load(f).catch(() => null)));

  // i telefonen färre bildpunkter, ingen kantutjämning och mindre skuggkartor,
  // så att minnet räcker
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const SKUGGA = LATT ? 1024 : 2048;
  const DPR = LATT ? 1.5 : Math.min(2.5, Math.max(2, (window.devicePixelRatio || 1) * 1.25));
  const gl = new THREE.WebGLRenderer({ alpha: true, antialias: !LATT, preserveDrawingBuffer: true });
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.domElement.className = 'reg-gl';
  o.nara.append(gl.domElement);
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture;

  // kameran som högra väggen; view(r) visar rektangeln r (scenens px)
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(FH / 2 / E) / DEG, FW / FH, 5, 6000);
  cam.position.set(EYE[0], -EYE[1], E);
  cam.lookAt(EYE[0], -EYE[1], 0);
  const view = (r) => { cam.setViewOffset(FW, FH, r.x - (EYE[0] - FW / 2), r.y - (EYE[1] - FH / 2), r.w, r.h); cam.updateMatrixWorld(); };
  const proj = (v) => { const s = E / (E - v.z); return [EYE[0] + (v.x - EYE[0]) * s, EYE[1] + (-v.y - EYE[1]) * s]; };

  const mat = (color, x = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.6, envMapIntensity: 0.5 }, x));
  function tex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
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
    [new THREE.PlaneGeometry(360, 200), [0, -90 * DEG, 0], [1139.9, POS.y + 100, POS.z]],
  ]) {
    const m = new THREE.Mesh(g, new THREE.ShadowMaterial({ opacity: 0.42 }));
    m.rotation.set(...rot);
    m.position.set(...pos);
    m.receiveShadow = true;
    scene.add(m);
  }

  // ---------- lådan ----------

  // lackad teak: ådringen längs brädorna
  const teak = tex(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#a5643a');
    g.addColorStop(1, '#8a4e2a');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      c.strokeStyle = `rgba(${hash(i) > 0.45 ? '58,26,8' : '196,128,78'},${0.1 + hash(i + 3) * 0.22})`;
      c.lineWidth = 0.6 + hash(i + 7) * 2.2;
      c.beginPath();
      const y = hash(i + 1) * h;
      c.moveTo(0, y);
      c.bezierCurveTo(w * 0.3, y + 9 * (hash(i + 2) - 0.5), w * 0.65, y - 7 * (hash(i + 5) - 0.5), w, y + 5 * (hash(i + 4) - 0.5));
      c.stroke();
    }
  });
  teak.wrapS = teak.wrapT = THREE.RepeatWrapping;
  const tra = mat('#ffffff', { map: teak, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.35, envMapIntensity: 0.6 });
  const traInne = mat('#6e3c1e', { roughness: 0.8 });
  const massing = mat('#c9a24c', { metalness: 1, roughness: 0.32, envMapIntensity: 1.3 });

  const lada = new THREE.Group();
  lada.rotation.order = 'YXZ';
  scene.add(lada);
  {
    const { w: W, h: H, d: D, t, b } = B;
    const vagg = (w, h, d, x, y, z) => { const m = mesh(new RB(w, h, d, 2, 0.5), tra, lada); m.position.set(x, y, z); return m; };
    vagg(W, H, t, 0, H / 2, D / 2 - t / 2);
    vagg(W, H, t, 0, H / 2, -D / 2 + t / 2);
    vagg(t, H, D - 2 * t + 0.4, -W / 2 + t / 2, H / 2, 0);
    vagg(t, H, D - 2 * t + 0.4, W / 2 - t / 2, H / 2, 0);
    mesh(new THREE.BoxGeometry(W - 2 * t, b, D - 2 * t), traInne, lada).position.set(0, b / 2, 0);
    // fyra små filttassar
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.4, 12), mat('#2a2420', { roughness: 1 }), lada).position.set(x * (W / 2 - 3), -0.2, z * (D / 2 - 3));
    // mässingshållaren med etiketten: KRITAN maskinskrivet och överstruket,
    // Lagen med blå kulspets bredvid
    const etikett = tex(360, 120, (c, w, h) => {
      c.fillStyle = '#f1e9d2';
      c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(120,90,40,.12)';
      c.fillRect(0, 0, w, 10);
      c.fillStyle = '#2b2419';
      c.font = '52px "Special Elite", "Courier New", monospace';
      c.textBaseline = 'middle';
      c.fillText('KRITAN', 22, h / 2 + 4);
      const x1 = 22 + c.measureText('KRITAN').width;
      c.strokeStyle = '#23409a';
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(14, h / 2 + 8);
      c.quadraticCurveTo(x1 / 2, h / 2 - 2, x1 + 8, h / 2 + 2);
      c.stroke();
      c.fillStyle = '#23409a';
      c.font = '700 64px Caveat, cursive';
      c.save();
      c.translate(x1 + 22, h / 2 + 2);
      c.rotate(-6 * DEG);
      c.fillText('Lagen', 0, 0);
      c.restore();
    });
    const hall = new THREE.Group();
    hall.position.set(0, H * 0.62, D / 2 + 0.05);
    lada.add(hall);
    mesh(new RB(21, 7.2, 0.6, 2, 0.25), massing, hall).position.z = 0.3;
    mesh(new THREE.PlaneGeometry(18.6, 6.2), mat('#ffffff', { map: etikett, roughness: 0.85 }), hall, false).position.z = 0.62;
    for (const y of [-3.35, 3.35]) {
      const l = mesh(new THREE.CylinderGeometry(0.42, 0.42, 20, 10), massing, hall);
      l.rotation.z = 90 * DEG;
      l.position.set(0, y, 0.75);
    }
    for (const x of [-9.8, 9.8]) {
      const s = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12), massing, hall);
      s.rotation.x = 90 * DEG;
      s.position.set(x, 0, 0.85);
    }
  }

  // ---------- korten ----------

  // registerkortet: krämvitt med rött streck under rubriken och blå linjer
  const papper = (bg, rod, bla) => tex(256, 182, (c, w, h) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      c.fillStyle = `rgba(90,70,40,${hash(i) * 0.06})`;
      c.fillRect(hash(i + 1) * w, hash(i + 2) * h, 1 + hash(i + 3) * 3, 1);
    }
    if (bla) {
      c.fillStyle = bla;
      for (let y = 40; y < h; y += 13) c.fillRect(0, y, w, 1);
    }
    if (rod) {
      c.fillStyle = rod;
      c.fillRect(0, 26, w, 2);
    }
  });
  const kartong = (col, ljus) => tex(256, 200, (c, w, h) => {
    c.fillStyle = col;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = `rgba(${hash(i) > 0.5 ? ljus : '0,0,0'},${0.05 + hash(i + 9) * 0.08})`;
      c.fillRect(hash(i + 1) * w, hash(i + 2) * h, 1 + hash(i + 3) * 4, 1);
    }
  });
  const M = {
    kort: mat('#ffffff', { map: papper('#f5f0e1', 'rgba(200,44,40,.6)', 'rgba(70,120,190,.28)'), roughness: 0.92, envMapIntensity: 0.35 }),
    bla: mat('#ffffff', { map: papper('#dde8f0', null, 'rgba(60,90,150,.22)'), roughness: 0.92, envMapIntensity: 0.35 }),
    gron: mat('#ffffff', { map: kartong('#3f7550', '220,240,210'), roughness: 0.85 }),
    rod: mat('#ffffff', { map: kartong('#a3392e', '250,220,200'), roughness: 0.85 }),
    kant: mat('#efe8d6', { roughness: 0.95 }),
    kantBla: mat('#d3dfe8', { roughness: 0.95 }),
    kantGron: mat('#2f5c3d', { roughness: 0.9 }),
    kantRod: mat('#7f2a22', { roughness: 0.9 }),
  };
  // texten på en flik: maskinskrivet, krymper tills den ryms
  function flikText(text, w, h, ink, bg) {
    return tex(w, h, (c) => {
      if (bg) { c.fillStyle = bg; c.fillRect(0, 0, w, h); }
      let px = h * 0.62;
      c.font = `${px}px "Special Elite", "Courier New", monospace`;
      while (c.measureText(text).width > w * 0.9 && px > 10) {
        px -= 1;
        c.font = `${px}px "Special Elite", "Courier New", monospace`;
      }
      c.fillStyle = ink;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, w / 2, h / 2 + px * 0.06);
    });
  }

  const kort = new THREE.Group();
  lada.add(kort);
  const K = new Map();
  const made = [];
  function deck(cards, wear) {
    for (const x of made) x.dispose();
    made.length = 0;
    kort.clear();
    K.clear();
    const inner = B.d - 2 * B.t;
    const gap = Math.min(2.6, inner / (cards.length + 1));
    const u = C.w / 5;
    cards.forEach((c, i) => {
      const w = (wear && wear.get(c.id)) || {};
      const skilj = c.kind === 'skilj';
      const hi = skilj ? C.skilj : 0;
      const th = skilj ? 0.5 : C.th;
      const g = new THREE.Group();
      g.position.set(0, B.b, B.d / 2 - B.t - gap * (i + 0.8));
      g.rotation.set(-(w.lut || 0) * DEG, 0, (w.vri || 0) * DEG);
      kort.add(g);
      const face = skilj ? M[c.cls] : c.kind === 'mote' ? M.bla : M.kort;
      const edge = skilj ? (c.cls === 'gron' ? M.kantGron : M.kantRod) : c.kind === 'mote' ? M.kantBla : M.kant;
      const bg = new THREE.BoxGeometry(C.w, C.h + hi, th);
      made.push(bg);
      mesh(bg, [edge, edge, edge, edge, face, face], g).position.y = (C.h + hi) / 2;
      // fliken
      const tabH = C.tab + (skilj ? 0.6 : 0);
      const tw = c.tab.span * u - 0.4;
      const tx = -C.w / 2 + c.tab.at * u + 0.2 + tw / 2;
      const ty = C.h + hi + tabH / 2 - 0.5;
      if (c.kind === 'lag') {
        // en hållare av plast i divisionens färg, med en papperslapp i
        const col = DV[c.dv] || '#8d8a80';
        const pm = mat(col, { transparent: true, opacity: 0.86, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1 });
        const hg = new RB(tw, tabH + 0.9, 0.7, 2, 0.22);
        made.push(hg, pm);
        mesh(hg, pm, g).position.set(tx, ty - 0.45, 0);
        const t = flikText(c.tab.text, 320, 104, '#1d1a14', '#f7f3e6');
        const lm = mat('#ffffff', { map: t, roughness: 0.8 });
        const lg = new THREE.PlaneGeometry(tw - 1, tabH - 1.1);
        made.push(t, lm, lg);
        mesh(lg, lm, g, false).position.set(tx, ty + 0.05, 0.37);
      } else {
        const tg = new THREE.BoxGeometry(tw, tabH + 0.6, th);
        made.push(tg);
        mesh(tg, [edge, edge, edge, edge, face, face], g).position.set(tx, ty - 0.3, 0);
        const t = flikText(c.tab.text, 360, 104, skilj ? '#f3ead2' : '#1f2a44', null);
        const lm = new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, color: skilj ? '#d8d0bc' : '#9aa0aa' });
        const lg = new THREE.PlaneGeometry(tw - 0.6, tabH - 0.4);
        made.push(t, lm, lg);
        mesh(lg, lm, g, false).position.set(tx, ty, th / 2 + 0.02);
      }
      g.userData = { id: c.id, y: B.b, cur: 0, mal: 0 };
      K.set(c.id, g);
    });
    if (S.open) kick();
  }

  // ---------- lägena ----------

  const S = { open: false, fly: null, tilt: [0, 0], tiltCur: [0, 0], hov: null, rect: null, raf: 0, lyft: new Set() };
  function setPose(t, up = 0) {
    lada.position.set(lerp(POS.x, NARA_AT.x, t), lerp(POS.y, NARA_AT.y, t) + up, lerp(POS.z, NARA_AT.z, t));
    lada.rotation.set(t * NARA.pitch + S.tiltCur[1] * t, t * NARA.yaw + S.tiltCur[0] * t, 0);
    lada.updateMatrixWorld(true);
  }
  // Rektangeln (scenens px) som lådan nära ryms i, mitt i fönstret mellan
  // namnet och foten, och lådans ruta i fönstret.
  function frame() {
    const was = [lada.position.clone(), lada.rotation.clone()];
    const keep = S.tiltCur.slice();
    S.tiltCur = [0, 0];
    setPose(1);
    const pts = [];
    const v = new THREE.Vector3();
    const top = B.b + C.h + C.skilj + C.tab + 0.6;
    for (const x of [-B.w / 2, B.w / 2]) for (const y of [0, B.h, top]) for (const z of [-B.d / 2, B.d / 2]) pts.push(proj(v.set(x, y, z).applyMatrix4(lada.matrixWorld)));
    lada.position.copy(was[0]);
    lada.rotation.copy(was[1]);
    S.tiltCur = keep;
    lada.updateMatrixWorld(true);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const b = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    const sm = innerWidth < 700;
    const s = Math.min((innerWidth - (sm ? 24 : 160)) / b.w, (innerHeight - (innerHeight < 500 ? 120 : 230)) / b.h);
    const cy = (innerHeight - 40) / 2;
    const r = { x: b.x + b.w / 2 - innerWidth / 2 / s, y: b.y + b.h / 2 - cy / s, w: innerWidth / s, h: innerHeight / s };
    return { r, box: { left: innerWidth / 2 - (b.w * s) / 2, top: cy - (b.h * s) / 2, width: b.w * s, height: b.h * s } };
  }
  // fönstret i scenens px när lådan i rummet syns där länken står
  function roomRect(from) {
    const k = BOX.w / from.width;
    return { x: BOX.x - from.left * k, y: BOX.y - from.top * k, w: innerWidth * k, h: innerHeight * k };
  }
  function mixRect(a, b, t) {
    const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), t));
    const cx = lerp(a.x + a.w / 2, b.x + b.w / 2, t);
    const cy = lerp(a.y + a.h / 2, b.y + b.h / 2, t);
    const h = (w * innerHeight) / innerWidth;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }

  function size() {
    gl.setPixelRatio(Math.min(LATT ? 1.5 : 2, window.devicePixelRatio || 1));
    gl.setSize(innerWidth, innerHeight, false);
  }

  // Lådan på disken till duken i länken.
  function paint() {
    if (S.open) return;
    setPose(0);
    for (const g of K.values()) { g.userData.cur = g.userData.mal = 0; g.position.y = g.userData.y; g.visible = true; }
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

  function step(now) {
    let busy = false;
    let t = S.open ? 1 : 0;
    let up = 0;
    if (S.fly) {
      const f = S.fly;
      const p = Math.min(1, (now - f.t0) / f.ms);
      const e = ease(p);
      t = lerp(f.a, f.b, e);
      up = Math.sin(Math.PI * p) * 7;
      S.rect = mixRect(f.ra, f.rb, e);
      if (p >= 1) { S.fly = null; f.done(); } else busy = true;
    }
    // lutar efter musen
    for (const i of [0, 1]) {
      const d = S.tilt[i] - S.tiltCur[i];
      if (Math.abs(d) > 0.0005) { S.tiltCur[i] += d * 0.12; busy = true; }
    }
    setPose(t, up);
    // korten reser sig och sjunker
    for (const g of K.values()) {
      const u = g.userData;
      const d = u.mal - u.cur;
      if (Math.abs(d) > 0.01) { u.cur += d * 0.24; busy = true; } else u.cur = u.mal;
      g.position.y = u.y + u.cur;
      if (u.wait && Math.abs(u.mal - u.cur) < 0.6) { const w = u.wait; u.wait = null; w(); }
    }
    return busy;
  }
  function loop() {
    S.raf = 0;
    const busy = step(performance.now());
    if (!S.rect) return;
    view(S.rect);
    gl.render(scene, cam);
    if (busy) S.raf = requestAnimationFrame(loop);
  }
  function kick() { if (!S.raf && (S.open || S.fly)) S.raf = requestAnimationFrame(loop); }

  function open(on, from) {
    if (on) {
      S.open = true;
      size();
      const F = frame();
      S.box = F.box;
      if (o.calm() || !from) {
        S.fly = null;
        S.rect = F.r;
        kick();
        return Promise.resolve(F.box);
      }
      const ra = roomRect(from);
      S.rect = ra;
      return new Promise((done) => {
        S.fly = { t0: performance.now(), ms: 760, a: 0, b: 1, ra, rb: F.r, done: () => done(F.box) };
        kick();
      });
    }
    S.hov = null;
    for (const g of K.values()) { g.userData.mal = 0; g.visible = true; }
    S.tilt = [0, 0];
    const end = () => { S.open = false; S.rect = null; paint(); };
    if (o.calm() || !from || !S.rect) { end(); return Promise.resolve(); }
    const rb = roomRect(from);
    return new Promise((done) => {
      S.fly = { t0: performance.now(), ms: 620, a: 1, b: 0, ra: S.rect, rb, done: () => { end(); done(); } };
      S.open = false;
      kick();
    });
  }

  // Kortet under punkten (x, y) i fönstret.
  const ray = new THREE.Raycaster();
  function pick(x, y) {
    if (!S.rect || S.fly) return null;
    view(S.rect);
    ray.setFromCamera(new THREE.Vector2((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2), cam);
    const hit = ray.intersectObjects([...K.values()].filter((g) => g.visible), true)[0];
    let g = hit && hit.object;
    while (g && !(g.userData && g.userData.id)) g = g.parent;
    return g ? g.userData.id : null;
  }
  function hover(id) {
    if (id === S.hov) return;
    S.hov = id;
    for (const [k, g] of K) if (!S.lyft.has(k)) g.userData.mal = k === id ? 2.4 : 0;
    kick();
  }
  // Kortet reser sig ur lådan (up) eller sjunker tillbaka.
  function rise(id, up) {
    const g = K.get(id);
    if (!g) return Promise.resolve();
    if (up) S.lyft.add(id); else S.lyft.delete(id);
    g.userData.mal = up ? C.h * 0.82 : id === S.hov ? 2.4 : 0;
    if (o.calm()) { g.userData.cur = g.userData.mal; kick(); return Promise.resolve(); }
    return new Promise((done) => { g.userData.wait = done; kick(); });
  }
  function hide(id, on) {
    const g = K.get(id);
    if (g) g.visible = !on;
    kick();
  }
  // Kortets ruta i fönstret (där det står nu).
  function rect(id) {
    const g = K.get(id);
    if (!g || !S.rect) return null;
    view(S.rect);
    lada.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    const xs = [];
    const ys = [];
    for (const x of [-C.w / 2, C.w / 2]) for (const y of [0, C.h]) {
      v.set(x, y, 0).applyMatrix4(g.matrixWorld).project(cam);
      xs.push(((v.x + 1) / 2) * innerWidth);
      ys.push(((1 - v.y) / 2) * innerHeight);
    }
    return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  function tilt(x, y) {
    S.tilt = [x * 6 * DEG, -y * 3.5 * DEG];
    kick();
  }
  function resize() {
    if (!S.open) return null;
    size();
    const F = frame();
    S.box = F.box;
    if (!S.fly) S.rect = F.r;
    kick();
    return F.box;
  }

  return { deck, paint, open, pick, hover, rise, hide, rect, tilt, resize, box: () => S.box };
}
