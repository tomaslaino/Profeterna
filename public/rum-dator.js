// Datorn på disken i tobaksaffären, i three.js som inredningen
// (rum-inredning.js) och sakerna på pulten (rum-saker.js). Terminalen på
// skärmen, datan och sökningen sköts av rum-register.js. Datorn är en beige
// allt-i-ett från FACIT med ett litet bildrör, tangentbord, mus och en
// diskett bredvid (säkerhetskopian), och den står där kortlådan stod: på
// disken under Tipsligan, vänd mellan gänget och den som tittar.
//
// I rummet ritas datorn när skärmen ändras, med samma kamera som högra
// väggen, och kopieras till duken i länken på disken, så att den lyser när
// man pekar på den. Närbilden ritas direkt i en duk över hela fönstret:
// datorn står kvar som den står, och det är kameran som svänger fram och
// ställer sig rakt framför skärmen (en del av samma bild i början, så att
// perspektivet är detsamma). Där tar terminalen i rum-register.js över
// skärmen; i en stående telefon står skärmen högre, så att tangentbordet
// ryms under.
//
// Slitaget: disketten, musen och tangentbordet ligger lite olika varje dag.
//
// Världen: som rum-inredning.js – X = x, Y = −y och Z ut från hörnet mot
// betraktaren, i högra väggens mått; ögat står i (760, 400) på avståndet
// 1000, och disken är Y = −490 mellan X = 1060 och väggen i X = 1140.
//
// dator({ duk, nara, calm, box }) → { skarm(rader), paint(), open(on, från) → Promise<ruta>,
//   ruta(), resize() }  (ruta = skärmens rektangel i fönstret när kameran står framför)

const DEG = Math.PI / 180;
const DAY = 86400000;
const EYE = [760, 400];
const E = 1000;
const FW = 2 * Math.max(EYE[0], 1600 - EYE[0]);
const FH = 2 * Math.max(EYE[1], 1000 - EYE[1]);
// datorns mitt i botten, på disken, och hur den är vänd (mellan gänget och ögat)
const POS = { x: 1104, y: -490, z: 377 };
const YAW = -38 * DEG;
// lådan: bredd, höjd och djup; skärmen (4:3) och dess mitt på fronten
const B = { w: 46, h: 60, d: 50 };
const SK = { w: 32, h: 24, y: 40 };
// närbilden: hur stor del av fönstret skärmen tar och var dess mitt står
// (andel av höjden), och kamerans synfält där
const NARA = { bred: 0.6, hog: 0.66, mitt: 0.47, fov: 24 * DEG };
const NARA_TEL = { bred: 0.97, hog: 0.62, mitt: 0.36, fov: 30 * DEG };
const staende = () => innerWidth < 700 && innerHeight > innerWidth * 1.2;
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
  await Promise.all(['40px "VT323"', '40px "Skrivmaskin"'].map((f) => document.fonts.load(f).catch(() => null)));

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

  const plast = (c) => mat(c, { roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.6, envMapIntensity: 0.45 });
  const BEIGE = plast('#d6ccb0');
  const BEIGE2 = plast('#c2b796');
  const TANGENT = plast('#e6dfca');
  const MORK = plast('#1c1d1f');
  const SLITS = mat('#141414', { roughness: 0.9 });
  const LED = new THREE.MeshBasicMaterial({ color: '#66ff8c', toneMapped: false });
  // skärmen: terminalen (skarm) eller tom när terminalen i rum-register.js står ovanpå
  const bild = duk(1024, 768);
  const SKARM = new THREE.MeshBasicMaterial({ map: bild, toneMapped: false, color: new THREE.Color(0.95, 0.95, 0.95) });
  const GLAS = mat('#000000', { transparent: true, opacity: 0.16, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 });

  const pc = new THREE.Group();
  pc.position.set(POS.x, POS.y, POS.z);
  pc.rotation.y = YAW;
  scene.add(pc);
  const { w: W, h: H, d: D } = B;
  mesh(new RB(W, H - 3, D, 3, 2.2), BEIGE, pc).position.set(0, 3 + (H - 3) / 2, 0);
  mesh(new RB(W - 4, 3.2, D - 6, 2, 1), BEIGE2, pc).position.set(0, 1.6, 0);
  // ramen kring skärmen, nedsänkt, och bildröret som buktar lite
  mesh(new RB(SK.w + 4, SK.h + 5, 2, 2, 1.2), MORK, pc).position.set(0, SK.y, D / 2 - 0.4);
  const sg = new THREE.Group();
  sg.position.set(0, SK.y, D / 2 + 0.7);
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
  }
  // skärmens sken på tangentbordet och disken
  const sken = new THREE.PointLight('#5cff86', 900, 90, 2);
  sken.position.set(0, -4, 14);
  sg.add(sken);
  // diskettluckan, märket och lampan
  mesh(new THREE.BoxGeometry(14, 1.1, 0.6), SLITS, pc).position.set(9, 18, D / 2 + 0.05);
  const skylt = duk(80, 18, (c, w, h) => {
    c.fillStyle = '#c9bd9c';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#5a4a30';
    c.font = '600 12px "Helvetica Neue", Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('FACIT', w / 2, h / 2 + 1);
  });
  mesh(new THREE.PlaneGeometry(10, 2.2), mat('#ffffff', { map: skylt, roughness: 0.4, metalness: 0.2 }), pc, false).position.set(-12, 18, D / 2 + 0.06);
  mesh(new THREE.SphereGeometry(0.55, 10, 8), LED, pc, false).position.set(-18, 11, D / 2 + 0.1);
  // ventilationsspåren på sidan
  for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.4, 1, 20), SLITS, pc, false).position.set(W / 2 + 0.05, 48 - i * 2.4, -4);

  // tangentbordet, musen och disketten: på lite olika ställen varje dag
  const dag = Math.floor(Date.now() / DAY);
  const r = (i) => hash(dag * 7.3 + i);
  {
    const tb = new THREE.Group();
    tb.position.set((r(1) - 0.5) * 5, 0, D / 2 + 12 + r(2) * 3);
    tb.rotation.set(3 * DEG, (r(3) - 0.5) * 9 * DEG, 0);
    pc.add(tb);
    const tw = 42;
    const td = 15;
    mesh(new RB(tw, 2.6, td, 2, 0.8), BEIGE, tb).position.y = 1.3;
    const cols = 15;
    const rows = 5;
    const kw = (tw - 4) / cols;
    const kd = (td - 5) / rows;
    const inst = new THREE.InstancedMesh(new RB(kw * 0.82, 1.1, kd * 0.8, 1, 0.25), TANGENT, cols * rows + 1);
    inst.castShadow = true;
    inst.receiveShadow = true;
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y === rows - 1 && x > 3 && x < 11) continue;
      m4.makeTranslation(-tw / 2 + 2 + kw * (x + 0.5) + (y % 2) * kw * 0.25 - kw * 0.12, 3.0 + y * 0.12, -td / 2 + 2.5 + kd * (y + 0.5));
      inst.setMatrixAt(n++, m4);
    }
    // mellanslaget
    m4.compose(new THREE.Vector3(-tw / 2 + 2 + kw * 7.5 - kw * 0.12, 3.5, -td / 2 + 2.5 + kd * 4.5), new THREE.Quaternion(), new THREE.Vector3(6.6, 1, 1));
    inst.setMatrixAt(n++, m4);
    inst.count = n;
    tb.add(inst);
    const mus = mesh(new RB(5, 2.4, 8.5, 2, 1.1), BEIGE, pc);
    mus.position.set(28 + r(4) * 5, 1.2, D / 2 + 10 + r(5) * 7);
    mus.rotation.y = (r(6) - 0.5) * 30 * DEG;
    const disk = new THREE.Group();
    disk.position.set(-29 - r(7) * 5, 0.5, D / 2 + 1 + r(8) * 8);
    disk.rotation.y = (r(9) - 0.3) * 60 * DEG;
    pc.add(disk);
    mesh(new THREE.BoxGeometry(9.4, 0.9, 9.4), plast('#26323e'), disk);
    const et = duk(264, 176, (c, w, h) => {
      c.fillStyle = '#f2ead4';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#2b4bb0';
      c.font = '34px "Skrivmaskin", "Courier New", monospace';
      c.fillText('REGISTER', 14, 60);
      c.fillText('säk.kopia', 14, 112);
    });
    const e = mesh(new THREE.PlaneGeometry(6.6, 4.4), mat('#ffffff', { map: et, roughness: 0.9 }), disk, false);
    e.rotation.x = -90 * DEG;
    e.position.set(0, 0.46, -1.2);
  }

  // ---------- skärmen i rummet ----------

  // Raderna (som terminalen: listor av [text, klass]) i grönt på svart, med
  // linjer som på ett bildrör. Tomt: bara mörk skärm.
  function skarm(rader) {
    const c = bild.image;
    const g = c.getContext('2d');
    g.fillStyle = FARG.bak;
    g.fillRect(0, 0, c.width, c.height);
    if (rader) {
      const f = 34;
      const lh = f * 1.12;
      g.font = `${f}px "VT323", monospace`;
      g.textBaseline = 'top';
      const cw = g.measureText('M').width;
      rader.slice(0, Math.floor((c.height - 60) / lh)).forEach((rad, i) => {
        let x = 44;
        const y = 34 + i * lh;
        for (const [t, k] of rad) {
          const w = cw * t.length;
          if (k === 'i') {
            g.fillStyle = FARG[''];
            g.fillRect(x - 6, y - 2, w + 12, lh);
          }
          g.fillStyle = FARG[k || ''];
          g.shadowColor = k === 'i' ? 'transparent' : 'rgba(65,255,110,.55)';
          g.shadowBlur = 8;
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
  const MITT = new THREE.Vector3(0, SK.y, D / 2 + 1.2).applyMatrix4(pc.matrixWorld);
  const NORMAL = new THREE.Vector3(Math.sin(YAW), 0, Math.cos(YAW));
  // Kameran rakt framför skärmen: läge, vridning och rektangel (mitt på
  // axeln, med skärmens mitt där NARA.mitt säger)
  function framfor() {
    const N = staende() ? NARA_TEL : NARA;
    const h = 2 * E * Math.tan(N.fov / 2);
    const w = (h * innerWidth) / innerHeight;
    // avståndet där skärmen tar NARA.bred av bredden och högst NARA.hog av höjden
    const d = Math.max((SK.w * E) / (N.bred * w), (SK.h * E) / (N.hog * h));
    const pos = MITT.clone().addScaledVector(NORMAL, d);
    const m = new THREE.Matrix4().lookAt(pos, MITT, new THREE.Vector3(0, 1, 0));
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return { pos, q, r: { x: EYE[0] - w / 2, y: EYE[1] - h * N.mitt, w, h } };
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
