// Inredningen i tobaksaffären (rum.js) i three.js som gänget (rum-3d.js) och
// sakerna på pulten (rum-saker.js): lysröret i taket, neonskylten i
// skyltfönstret, Stängt-skylten på dörrens glas, stationsuret och orakelramen
// med mässingsskylten på bakväggen, cigarettpaketen uppe på högra väggen och
// ramarna kring skårtavlan och korktavlan, barstolen vid disken och
// kupongstället på pulten.
//
// Allt ritas med en och samma WebGL-duk utanför sidan och kopieras till en
// vanlig duk per sak, i det plan där den platta saken låg, så att den följer
// med när kameran rör sig. Bara uret ritas om, en gång i sekunden; resten
// ritas när typsnitten har laddats och när oraklet byts.
//
// Väggarna: ögat står i (760, 400) på avståndet 1000 från bakväggen, som
// högra väggens perspektiv i rum.js, så att 1 enhet är 1 px i bakväggens
// plan. X = x, Y = −y och Z pekar mot betraktaren. Sakernas framsida ligger
// där de platta var ritade och kroppen går tillbaka till väggen (bakväggen
// Z = WZ, högra väggen X = WX). Kupongstället står på pulten med samma
// kamera som sakerna i rum-saker.js.
//
// Uret ligger i en knapp (.rum-ur) och ramen i länken (.rum-ram): ett klick
// går fram till dem (närbilderna i rum.js), och där ritas de, och ramen kring
// skårtavlan, om skarpare (skarp).
//
// inredning(el, { calm, still }) → { draw(), namn(html), skarp(namn, px) } (namnet som Kronan.names)

const DEG = Math.PI / 180;
const WZ = -26;
const WX = 1156;
// djupet in längs högra väggen där x (i hörnets plan) ligger, som onWall i rum.js
const wz = (x) => 1000 * (1 - 380 / (x - 760));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const UR = { x: 1050, y: 152, r: 46 };
const RAM = { x: 987, y: 302, w: 126, h: 152, b: 12 };
// Sakerna och dukarna (plan: 0 = väggen, 1 = tv:ns plan, 3 = pulten). Urets
// och ramens dukar ligger i knappen och länken (i, med hörnet at).
const BITAR = {
  tak: { plan: 0, box: { x: 0, y: 0, w: 960, h: 240 } },
  neon: { plan: 0, box: { x: 290, y: 104, w: 300, h: 130 } },
  ur: { plan: 0, box: { x: 992, y: 94, w: 130, h: 142 }, i: '.rum-ur', at: { x: UR.x - 54, y: UR.y - 54 } },
  ram: { plan: 0, box: { x: 968, y: 280, w: 164, h: 232 }, i: '.rum-ram', at: RAM },
  hogra: { plan: 0, box: { x: 1130, y: 0, w: 470, h: 520 } },
  stol: { plan: 1, box: { x: 1320, y: 470, w: 200, h: 200 } },
  stall: { plan: 3, box: { x: 30, y: 470, w: 260, h: 250 } },
};
// närbilden: högst så många bildpunkter på dukens längsta led
const SKARP = 2600;

export async function inredning(el, opt = {}) {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry: RB } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  await Promise.all(['italic 600 68px Fraunces', '700 40px Fraunces', '800 60px Fraunces', '700 40px Caveat']
    .map((f) => document.fonts.load(f).catch(() => null)));

  // i telefonen färre bildpunkter, ingen kantutjämning och mindre skuggkartor,
  // så att minnet räcker
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const SKUGGA = LATT ? 1024 : 2048;
  const DPR = LATT ? 1.5 : Math.min(2.5, Math.max(2, (window.devicePixelRatio || 1) * 1.25));
  const gl = new THREE.WebGLRenderer({ alpha: true, antialias: !LATT, preserveDrawingBuffer: true });
  gl.setPixelRatio(DPR);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(gl);
  if (LATT) pmrem._setSize = (n) => THREE.PMREMGenerator.prototype._setSize.call(pmrem, Math.min(n, 128));
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const planes = [...el.querySelectorAll('.rum-world > .rum-pl')];

  const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.6, envMapIntensity: 0.5 }, o));
  const glas = (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: '#ffffff', transparent: true, opacity: 0.1, roughness: 0.03, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false }, o));
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

  // En sak: en scen med kamera och ljus, och duken den kopieras till.
  function bit(namn, cam, parent) {
    const { box } = BITAR[namn];
    const canvas = document.createElement('canvas');
    // neonen glappar som förut (rum-neon, .neon-av i rum.css)
    canvas.className = `rum-inr${namn === 'neon' ? ' rum-neon' : ''}`;
    canvas.width = Math.round(box.w * DPR);
    canvas.height = Math.round(box.h * DPR);
    let pr = DPR;
    const at = parent ? BITAR[namn].at : { x: 0, y: 0 };
    Object.assign(canvas.style, { position: 'absolute', pointerEvents: 'none', left: `${box.x - at.x}px`, top: `${box.y - at.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    if (namn === 'neon') canvas.style.filter = 'drop-shadow(0 0 2px rgba(255,80,60,1)) drop-shadow(0 0 6px rgba(255,45,31,.9)) drop-shadow(0 0 16px rgba(255,45,31,.6))';
    (parent || planes[BITAR[namn].plan]).append(canvas);
    const scene = new THREE.Scene();
    scene.environment = env;
    const mesh = (g, m, p = scene, skugga = true) => { const x = new THREE.Mesh(g, m); x.castShadow = skugga; x.receiveShadow = true; p.add(x); return x; };
    const occ = (g) => { const x = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false })); x.renderOrder = -1; scene.add(x); return x; };
    return {
      scene, cam, mesh, occ, canvas,
      paint() {
        // samma storlek som förra gången: duken behöver inte göras om
        if (gl.getPixelRatio() !== pr) gl.setPixelRatio(pr);
        if (gl.domElement.width !== canvas.width || gl.domElement.height !== canvas.height) gl.setSize(box.w, box.h, false);
        gl.render(scene, cam);
        const g = canvas.getContext('2d');
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.drawImage(gl.domElement, 0, 0, canvas.width, canvas.height);
        // i telefonen behövs skuggkartan bara medan saken ritas – den ritas
        // sällan om, utom uret varje sekund – och three gör en ny nästa gång
        if (LATT && namn !== 'ur') {
          scene.traverse((x) => {
            if (x.isLight && x.shadow && x.shadow.map) {
              x.shadow.map.dispose();
              x.shadow.map = null;
            }
          });
        }
      },
      // px bildpunkter per px i planet (0: som vanligt)
      skarp(px) {
        const p = Math.max(DPR, Math.min(px, SKARP / Math.max(box.w, box.h)));
        if (p === pr) return;
        pr = p;
        canvas.width = Math.floor(box.w * pr);
        canvas.height = Math.floor(box.h * pr);
        this.paint();
      },
    };
  }

  // kameran för väggarna (se överst) och för pulten (som rum-saker.js)
  function wallCam(box, eye = [760, 400], E = 1000) {
    const fw = 2 * Math.max(eye[0], 1600 - eye[0]);
    const fh = 2 * Math.max(eye[1], 1000 - eye[1]);
    const cam = new THREE.PerspectiveCamera(2 * Math.atan(fh / 2 / E) / DEG, fw / fh, 5, 6000);
    cam.position.set(eye[0], -eye[1], E);
    cam.lookAt(eye[0], -eye[1], 0);
    cam.setViewOffset(fw, fh, box.x - (eye[0] - fw / 2), box.y - (eye[1] - fh / 2), box.w, box.h);
    cam.updateMatrixWorld();
    return cam;
  }
  function deskCam(box, O, D = 1400, ELEV = 34 * DEG) {
    const fw = 2 * Math.max(O.x, 1600 - O.x);
    const fh = 2 * Math.max(O.y, 1000 - O.y);
    const cam = new THREE.PerspectiveCamera(2 * Math.atan(fh / 2 / D) / DEG, fw / fh, 50, 5000);
    cam.position.set(0, D * Math.sin(ELEV), D * Math.cos(ELEV));
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(fw, fh, box.x - (O.x - fw / 2), box.y - (O.y - fh / 2), box.w, box.h);
    cam.updateMatrixWorld();
    const ray = new THREE.Raycaster();
    const desk = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    cam.onDesk = (px, py) => {
      ray.setFromCamera(new THREE.Vector2(((px - box.x) / box.w) * 2 - 1, 1 - ((py - box.y) / box.h) * 2), cam);
      return ray.ray.intersectPlane(desk, new THREE.Vector3());
    };
    return cam;
  }

  // ljuset som i rummet: lysröret ovanför och framför till vänster, neonen
  // från fönstret och tv:n från hörnet
  function wallLights(b, box, skugga = true) {
    const { scene } = b;
    scene.add(new THREE.HemisphereLight('#eadcc0', '#3a2a1a', 0.55));
    // skuggans kamera kring saken, ljuset åt samma håll överallt
    const cx = box.x + box.w / 2, cy = -(box.y + box.h / 2), half = Math.max(box.w, box.h) + 300;
    const k = new THREE.DirectionalLight('#fff2dc', 1.9);
    k.position.set(cx - 340, cy + 680, 900);
    k.target.position.set(cx, cy, 0);
    if (skugga) {
      k.castShadow = true;
      k.shadow.mapSize.set(SKUGGA, SKUGGA);
      k.shadow.radius = 5;
      k.shadow.bias = -0.0004;
      k.shadow.normalBias = 0.4;
      Object.assign(k.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 10, far: 4000 });
    }
    scene.add(k, k.target);
    const n = new THREE.DirectionalLight('#ff3a26', 0.24);
    n.position.set(300, -170, 260);
    n.target.position.set(900, -330, 0);
    scene.add(n, n.target);
    const tv = new THREE.PointLight('#7fb0ff', 0.4 * 90000, 0, 2);
    tv.position.set(1300, -250, 380);
    scene.add(tv);
    const f = new THREE.DirectionalLight('#ffd9b0', 0.35);
    f.position.set(760, -400, 1000);
    scene.add(f);
  }
  // skuggorna faller bara där det finns vägg (högra väggen bara ovanför disken)
  function catcher(b, g, rot, pos, o = 0.42) {
    const m = new THREE.Mesh(g, new THREE.ShadowMaterial({ opacity: o }));
    m.rotation.set(...rot);
    m.position.set(...pos);
    m.receiveShadow = true;
    b.scene.add(m);
  }
  const backWall = (b) => catcher(b, new THREE.PlaneGeometry(1300, 800), [0, 0, 0], [570, -420, WZ]);
  // (högra väggen inte heller över anslagstavlan, rum-anslag.js)
  const rightWall = (b) => catcher(b, new THREE.PlaneGeometry(600, 440), [0, -90 * DEG, 0], [WX, -270, 620]);

  // ---------- taket, fönstret och dörren ----------

  function lysror(b) {
    const { mesh } = b;
    const g = new THREE.Group();
    g.position.set(665, -90, 140);
    b.scene.add(g);
    mesh(new THREE.BoxGeometry(470, 7, 62), mat('#d9d4c4', { roughness: 0.45, metalness: 0.2 }), g, false).position.y = -3.5;
    // reflektorn: ljus undersida mellan rören
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(462, 54), new THREE.MeshBasicMaterial({ color: '#f4f1e6', toneMapped: false }));
    refl.rotation.x = 90 * DEG;
    refl.position.y = -7.1;
    g.add(refl);
    const ljus = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
    for (const z of [-15, 15]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 448, 20), ljus);
      t.rotation.z = 90 * DEG;
      t.position.set(0, -12, z);
      g.add(t);
    }
    const gavel = mat('#bdb8a8', { roughness: 0.4, metalness: 0.3 });
    for (const x of [-229, 229]) mesh(new RB(12, 12, 50, 2, 2), gavel, g, false).position.set(x, -11, 0);
  }

  function stangt(b) {
    const { mesh } = b;
    const face = tex(320, 120, (g, w, h) => {
      g.fillStyle = '#ece0c4';
      g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, 'rgba(120,80,20,0)');
      gr.addColorStop(1, 'rgba(120,80,20,.22)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#b3261e';
      g.lineWidth = 8;
      g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#b3261e';
      g.font = '800 60px Fraunces';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.letterSpacing = '6px';
      g.fillText('STÄNGT', w / 2 + 3, h / 2 + 4);
    });
    const kant = mat('#d8ccb0');
    const sign = mesh(new RB(80, 30, 2.6, 2, 1.1), [kant, kant, kant, kant, mat('#fff', { map: face, roughness: 0.7 }), kant], b.scene, false);
    sign.position.set(136, -191, -14);
    sign.rotation.set(-3 * DEG, 12 * DEG, -2 * DEG);
    sign.updateMatrixWorld();
    // sugproppen med kroken och snöret
    const cup = mesh(new THREE.CylinderGeometry(3.4, 6.5, 2.5, 24), glas({ color: '#dfe8ea', opacity: 0.55, envMapIntensity: 1, depthWrite: true }), b.scene, false);
    cup.rotation.x = 90 * DEG;
    cup.position.set(136, -148, WZ + 1.2);
    const krok = mesh(new THREE.TorusGeometry(2.6, 0.7, 8, 20, 1.3 * Math.PI), mat('#c9a252', { metalness: 0.9, roughness: 0.3 }), b.scene, false);
    krok.position.set(136, -150.5, -21);
    krok.rotation.y = 90 * DEG;
    const hook = new THREE.Vector3(136, -150, -22);
    for (const sx of [-17, 17]) {
      const end = new THREE.Vector3(sx, 13.5, 0).applyMatrix4(sign.matrixWorld);
      const mid = hook.clone().lerp(end, 0.5);
      mid.y -= 1.5;
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([hook, mid, end]), 12, 0.45, 6), mat('#2a2420', { roughness: 0.9 }), b.scene, false);
    }
  }

  // Neonskylten: skelettet av "Tobak" i Fraunces kursiv. Texten ritas stort,
  // tunnas ut till en pixel (Zhang–Suen) och följs till linjer, som blir
  // glasrör med en ljus kärna; seriferna (korta stumpar) tas bort.
  function skelett(text, px) {
    const W = Math.ceil(px * 3.2), H = Math.ceil(px * 1.35), base = Math.round(px * 1.02);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.font = `italic 600 ${px}px Fraunces`;
    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.fillText(text, W / 2, base);
    const d = g.getImageData(0, 0, W, H).data;
    const A = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) A[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    const N = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
    for (let changed = true; changed;) {
      changed = false;
      for (const step of [0, 1]) {
        const del = [];
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (!A[i]) continue;
          const p = N.map(([dx, dy]) => A[i + dy * W + dx]);
          const B = p.reduce((a, q) => a + q, 0);
          if (B < 2 || B > 6) continue;
          let tr = 0;
          for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) tr++;
          if (tr !== 1) continue;
          if (step === 0 ? (p[0] * p[2] * p[4] || p[2] * p[4] * p[6]) : (p[0] * p[2] * p[6] || p[0] * p[4] * p[6])) continue;
          del.push(i);
        }
        for (const i of del) A[i] = 0;
        if (del.length) changed = true;
      }
    }
    // grannarna: de raka, och de sneda bara när ingen rak granne går emellan
    const nb = (i) => {
      const x = i % W, y = (i / W) | 0, out = [];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (A[(y + dy) * W + x + dx]) out.push((y + dy) * W + x + dx);
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) if (A[(y + dy) * W + x + dx] && !A[y * W + x + dx] && !A[(y + dy) * W + x]) out.push((y + dy) * W + x + dx);
      return out;
    };
    const trace = () => {
      const pix = [];
      for (let i = 0; i < W * H; i++) if (A[i]) pix.push(i);
      const node = (i) => nb(i).length !== 2;
      const seen = new Set();
      const key = (a, q) => (a < q ? `${a},${q}` : `${q},${a}`);
      const walk = (a, q) => {
        const path = [a];
        let prev = a, cur = q;
        seen.add(key(a, q));
        while (!node(cur)) {
          path.push(cur);
          const nx = nb(cur).find((n) => n !== prev && !seen.has(key(cur, n)));
          if (nx == null) break;
          seen.add(key(cur, nx));
          prev = cur;
          cur = nx;
          if (cur === a) break;
        }
        path.push(cur);
        return path;
      };
      const paths = [];
      for (const i of pix) if (node(i)) for (const n of nb(i)) if (!seen.has(key(i, n))) paths.push(walk(i, n));
      for (const i of pix) for (const n of nb(i)) if (!seen.has(key(i, n))) paths.push(walk(i, n));
      return paths;
    };
    for (let k = 0; k < 3; k++) {
      let cut = false;
      for (const p of trace()) {
        const a = nb(p[0]).length, q = nb(p[p.length - 1]).length;
        if (p.length < px * 0.16 && ((a === 1 && q >= 3) || (q === 1 && a >= 3))) {
          for (const i of (a === 1 ? p.slice(0, -1) : p.slice(1))) A[i] = 0;
          cut = true;
        }
      }
      if (!cut) break;
    }
    return trace().filter((p) => p.length > px * 0.06).map((p) => ({
      pts: p.map((i) => [i % W - W / 2, ((i / W) | 0) - base]),
      closed: p[0] === p[p.length - 1],
      ends: [nb(p[0]).length === 1, nb(p[p.length - 1]).length === 1],
    }));
  }

  // rören i en egen duk som lyser (rum-neon: den glappar som förut), och
  // ställningen – listen, transformatorn och kedjorna – i takets duk
  function neon(b, tak) {
    const fs = 68, px = 280, k = fs / px, Z = -12;
    const core = new THREE.MeshBasicMaterial({ color: '#ffe0d6', toneMapped: false });
    const ror = glas({ color: '#ff3a26', emissive: '#ff2a18', emissiveIntensity: 1.5, opacity: 0.62, roughness: 0.15, envMapIntensity: 0.5 });
    const elektrod = mat('#3a302a', { roughness: 0.6 });
    for (const { pts, closed, ends } of skelett('Tobak', px)) {
      // jämna till och gles ut; spegelvänd, sett inifrån
      const sm = pts.map((p, i) => {
        if (!closed && (i < 3 || i > pts.length - 4)) return p;
        let x = 0, y = 0;
        for (let j = -4; j <= 4; j++) { const q = pts[(i + j + pts.length) % pts.length]; x += q[0]; y += q[1]; }
        return [x / 9, y / 9];
      });
      const v = [];
      for (let i = 0; i < sm.length; i += 5) v.push(sm[i]);
      if (!closed && v[v.length - 1] !== sm[sm.length - 1]) v.push(sm[sm.length - 1]);
      if (v.length < 2) continue;
      const P = v.map(([x, y]) => new THREE.Vector3(440 - x * k, -(190 + y * k), Z));
      const curve = new THREE.CatmullRomCurve3(P, closed, 'centripetal');
      const n = Math.max(12, Math.round(curve.getLength() / 1.5));
      b.scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, n, 1.3, 8, closed), core));
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, n, 2.7, 12, closed), ror);
      m.renderOrder = 2;
      b.scene.add(m);
      if (!closed) [P[0], P[P.length - 1]].forEach((e, i) => {
        if (!ends[i]) return;
        const el = b.mesh(new THREE.CylinderGeometry(1.7, 1.7, 5, 14), elektrod, b.scene, false);
        el.rotation.x = 90 * DEG;
        el.position.set(e.x, e.y, Z - 5);
      });
    }
    const svart = mat('#141210', { roughness: 0.5 });
    tak.mesh(new RB(232, 5, 5, 2, 1.5), svart, tak.scene, false).position.set(440, -207, Z - 6);
    tak.mesh(new RB(40, 10, 9, 2, 2), mat('#1d1b1a', { roughness: 0.5 }), tak.scene, false).position.set(440, -210, Z - 9);
    const lank = new THREE.TorusGeometry(1.2, 0.35, 6, 12);
    const stal = mat('#8a8578', { metalness: 0.9, roughness: 0.35 });
    for (const x of [338, 542]) {
      for (let y = 133; y < 205; y += 3.4) {
        const l = tak.mesh(lank, stal, tak.scene, false);
        l.position.set(x, -y, Z - 6);
        l.rotation.y = (Math.round(y / 3.4) % 2) * 90 * DEG;
      }
    }
  }

  // ---------- bakväggen ----------

  // Stationsuret: svarvat hölje från väggen fram till glaset, tavlan gulnad
  // av röken, visarna i var sitt lager och glaset som buktar lite.
  function ur(b) {
    const { mesh } = b;
    const { x, y, r } = UR;
    const g = new THREE.Group();
    g.position.set(x, -y, 0);
    b.scene.add(g);
    const prof = [[r + 3, WZ], [r + 6, WZ + 1.5], [r + 6.8, WZ + 5], [r + 6.8, 1.5], [r + 6.2, 4.5], [r + 4.6, 6.4], [r + 2.6, 6.6], [r + 1.2, 4.8], [r + 0.6, 1]]
      .map(([a, q]) => new THREE.Vector2(a, q));
    mesh(new THREE.LatheGeometry(prof, 128), mat('#2b2925', { metalness: 0.85, roughness: 0.3, envMapIntensity: 1.1 }), g).rotation.x = 90 * DEG;
    const dial = tex(1024, 1024, (c, w) => {
      const R = w / 2;
      const gr = c.createRadialGradient(R * 0.88, R * 0.8, 0, R, R, R);
      gr.addColorStop(0, '#f7f0dc');
      gr.addColorStop(0.72, '#e9dfc3');
      gr.addColorStop(1, '#c9ba92');
      c.fillStyle = gr;
      c.fillRect(0, 0, w, w);
      c.translate(R, R);
      c.fillStyle = '#161512';
      for (let i = 0; i < 60; i++) {
        c.save();
        c.rotate(i * 6 * DEG);
        if (i % 5 === 0) c.fillRect(-R * 0.036, -R * 0.93, R * 0.072, R * 0.23);
        else c.fillRect(-R * 0.01, -R * 0.93, R * 0.02, R * 0.075);
        c.restore();
      }
      const nik = c.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
      nik.addColorStop(0, 'rgba(122,84,16,0)');
      nik.addColorStop(1, 'rgba(106,70,8,.3)');
      c.fillStyle = nik;
      c.fillRect(-R, -R, w, w);
    });
    mesh(new THREE.CircleGeometry(r + 0.8, 96), mat('#fff', { map: dial, roughness: 0.75, envMapIntensity: 0.3 }), g).position.z = 0.2;
    // visaren pekar uppåt: från baken (b0) under navet till spetsen (l)
    const hand = (l, b0, w0, w1, z, m, p = g) => {
      const sh = new THREE.Shape([new THREE.Vector2(-w0 / 2, -b0), new THREE.Vector2(w0 / 2, -b0), new THREE.Vector2(w1 / 2, l), new THREE.Vector2(-w1 / 2, l)]);
      const h = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: false }), m, p);
      h.position.z = z;
      return h;
    };
    const svart = mat('#161512', { roughness: 0.5 });
    const tim = hand(r * 0.56, r * 0.16, r * 0.11, r * 0.08, 0.9, svart);
    const min = hand(r * 0.86, r * 0.16, r * 0.085, r * 0.055, 1.9, svart);
    const sek = new THREE.Group();
    sek.position.z = 3;
    g.add(sek);
    const rod = mat('#c4281c', { roughness: 0.45 });
    hand(r * 0.8, r * 0.24, r * 0.026, r * 0.026, 0, rod, sek);
    const disc = mesh(new THREE.CylinderGeometry(r * 0.05, r * 0.05, 0.6, 24), rod, sek);
    disc.rotation.x = 90 * DEG;
    disc.position.set(0, -r * 0.2, 0.3);
    const nav = mesh(new THREE.CylinderGeometry(r * 0.045, r * 0.045, 2.2, 24), rod, g);
    nav.rotation.x = 90 * DEG;
    nav.position.z = 3.6;
    // med prefers-reduced-motion syns inte sekundvisaren
    sek.visible = !opt.calm;
    const Rg = 150;
    const a = Math.asin((r + 2.6) / Rg);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(Rg, 96, 24, 0, Math.PI * 2, 0, a), glas());
    dome.rotation.x = 90 * DEG;
    dome.position.z = 4.6 - Rg * Math.cos(a);
    g.add(dome);
    return (h, m, s) => {
      tim.rotation.z = -((h % 12) + m / 60) * 30 * DEG;
      min.rotation.z = -(m + s / 60) * 6 * DEG;
      sek.rotation.z = -s * 6 * DEG;
    };
  }

  // Orakelramen: förgylld list i två steg med pärlstav, rosetter i hörnen och
  // palmetten överst; fotot (Kronan.scene i rum.js) syns i hålet, längre in,
  // bakom glaset. Mässingsskylten under med namnet ingraverat.
  function ram(b) {
    const { mesh, occ } = b;
    const { x: x0, y: y0, w, h, b: kant } = RAM;
    const guld = mat('#f0c766', { metalness: 1, roughness: 0.24, envMapIntensity: 1.9 });
    const rect = (p, i) => { p.moveTo(x0 + i, -(y0 + i)); p.lineTo(x0 + w - i, -(y0 + i)); p.lineTo(x0 + w - i, -(y0 + h - i)); p.lineTo(x0 + i, -(y0 + h - i)); p.closePath(); };
    const ring = (i0, i1, depth, bev) => {
      const sh = new THREE.Shape();
      rect(sh, i0);
      const hole = new THREE.Path();
      rect(hole, i1);
      sh.holes.push(hole);
      mesh(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 5, curveSegments: 4 }), guld).position.z = WZ;
    };
    ring(2.5, 8, -WZ - 5, 3);
    ring(7.5, kant, -WZ - 8, 1.4);
    const parla = new THREE.SphereGeometry(1.15, 10, 8);
    const p = 9.8;
    const rad = (ax, ay, bx, by) => {
      const n = Math.round(Math.hypot(bx - ax, by - ay) / 3.2);
      for (let i = 0; i < n; i++) mesh(parla, guld, b.scene, false).position.set(ax + (bx - ax) * i / n, -(ay + (by - ay) * i / n), -2.6);
    };
    rad(x0 + p, y0 + p, x0 + w - p, y0 + p);
    rad(x0 + w - p, y0 + p, x0 + w - p, y0 + h - p);
    rad(x0 + w - p, y0 + h - p, x0 + p, y0 + h - p);
    rad(x0 + p, y0 + h - p, x0 + p, y0 + p);
    for (const [cx, cy] of [[x0 + 5, y0 + 5], [x0 + w - 5, y0 + 5], [x0 + 5, y0 + h - 5], [x0 + w - 5, y0 + h - 5]]) {
      const ro = mesh(new THREE.SphereGeometry(3.4, 20, 12), guld);
      ro.position.set(cx, -cy, 1.6);
      ro.scale.z = 0.6;
    }
    const blad = new THREE.SphereGeometry(1, 14, 10);
    [-62, -40, -20, 0, 20, 40, 62].forEach((a, i) => {
      const len = [6, 8, 10, 11.5, 10, 8, 6][i];
      const l = mesh(blad, guld);
      l.scale.set(1.7, len / 2, 1.6);
      l.position.set(x0 + w / 2 + Math.sin(a * DEG) * (len / 2 + 1.5), -(y0 - 2) + Math.cos(a * DEG) * (len / 2 + 1.5), -6);
      l.rotation.z = -a * DEG;
    });
    mesh(new THREE.SphereGeometry(3.6, 20, 12), guld).position.set(x0 + w / 2, -(y0 - 1), -5);
    const ruta = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * kant, h - 2 * kant), glas({ opacity: 0.07, envMapIntensity: 2.2 }));
    ruta.position.set(x0 + w / 2, -(y0 + h / 2), -5);
    b.scene.add(ruta);
    occ(new THREE.PlaneGeometry(w - 2 * kant, h - 2 * kant)).position.set(x0 + w / 2, -(y0 + h / 2), -8);
    // skylten: namnet byts när oraklet byts
    const skylt = mat('#fff', { metalness: 0.85, roughness: 0.32, envMapIntensity: 1 });
    mesh(new RB(108, 24, 3, 2, 1.2), [guld, guld, guld, guld, skylt, guld]).position.set(1050, -471, WZ + 1.6);
    for (const x of [1000, 1100]) {
      const sk = mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 14), mat('#8a6224', { metalness: 1, roughness: 0.35 }));
      sk.rotation.x = 90 * DEG;
      sk.position.set(x, -471, WZ + 3.4);
    }
    return (namn) => {
      if (skylt.map) skylt.map.dispose();
      skylt.map = tex(864, 192, (c, W, H) => {
        const gr = c.createLinearGradient(0, 0, W, H);
        gr.addColorStop(0, '#f3d98f');
        gr.addColorStop(0.45, '#c79a45');
        gr.addColorStop(1, '#8a6224');
        c.fillStyle = gr;
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,240,200,${0.04 + hash(i) * 0.06})`; c.fillRect(0, hash(i + 9) * H, W, 1); }
        c.textAlign = 'center';
        c.fillStyle = '#3a2808';
        c.font = '700 34px Fraunces';
        c.letterSpacing = '7px';
        c.fillText('OMGÅNGENS ORAKEL', W / 2, 62);
        c.letterSpacing = '0px';
        // delat: alla efternamnen, mindre
        c.font = `700 ${namn.length > 14 ? 52 : 74}px Fraunces`;
        c.fillText(namn, W / 2, 152, W - 60);
      });
      skylt.needsUpdate = true;
    };
  }

  // ---------- högra väggen ----------

  // (Z, Y, ut från väggen) → världen
  const onRight = (geo, out = 0) => geo.applyMatrix4(new THREE.Matrix4().set(0, 0, -1, WX - out, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));
  // en ram kring en tavla på väggen (onWall i rum.js: x i hörnets plan, y)
  function wallRing(b, xa, xb, ya, yb, k, m) {
    const z0 = wz(xa), z1 = wz(xb);
    const sh = new THREE.Shape();
    sh.moveTo(z0 - 1, -(ya - 1)); sh.lineTo(z1 + 1, -(ya - 1)); sh.lineTo(z1 + 1, -(yb + 1)); sh.lineTo(z0 - 1, -(yb + 1)); sh.closePath();
    const hole = new THREE.Path();
    hole.moveTo(z0 + k, -(ya + k)); hole.lineTo(z0 + k, -(yb - k)); hole.lineTo(z1 - k, -(yb - k)); hole.lineTo(z1 - k, -(ya + k)); hole.closePath();
    sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: WX - 1141, bevelEnabled: true, bevelThickness: 1, bevelSize: 0.8, bevelSegments: 2 });
    onRight(geo);
    b.mesh(geo, m);
    const o = new THREE.PlaneGeometry(z1 - z0 - 2 * k, yb - ya - 2 * k);
    o.translate((z0 + z1) / 2, -(ya + yb) / 2, 0);
    onRight(o, WX - 1139.7);
    b.occ(o);
  }

  function hylla(b, yb, z0, z1, depth) {
    b.mesh(new THREE.BoxGeometry(depth, 4.5, z1 - z0), mat('#2a2018', { roughness: 0.55 })).position.set(WX - depth / 2, -yb - 2.25, (z0 + z1) / 2);
    // damm på framkanten
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, z1 - z0), mat('#cfc6b0', { roughness: 1, transparent: true, opacity: 0.5 }));
    d.position.set(WX - depth + 0.6, -yb + 0.3, (z0 + z1) / 2);
    b.scene.add(d);
  }

  // Cigarettpaketen på två hyllor uppe vid taket: påhittade färger, inga
  // märken, i rader om tre till sju.
  function paket(b) {
    const cols = ['#c8643a', '#2a52a0', '#e7e1d2', '#3db37c', '#d8b06a', '#8b2e2a', '#1f6f6a', '#f0d699', '#5a5f8a'];
    const front = cols.map((c, i) => tex(64, 96, (g, w, h) => {
      const ljus = i === 2 || i === 7;
      g.fillStyle = '#f2ede0';
      g.fillRect(0, 0, w, h);
      g.fillStyle = c;
      g.fillRect(0, 0, w, h * 0.52);
      if (ljus) { g.fillStyle = ['#b3261e', '#2a52a0'][i % 2]; g.fillRect(0, h * 0.46, w, 6); }
      g.beginPath();
      g.arc(w / 2, h * 0.26, 10, 0, Math.PI * 2);
      g.fillStyle = ljus ? '#b3261e' : 'rgba(255,255,255,.85)';
      g.fill();
      g.fillStyle = '#111';
      g.fillRect(6, h * 0.72, w - 12, h * 0.16);
      g.fillStyle = '#fff';
      g.fillRect(8, h * 0.74, w - 16, h * 0.12);
      g.fillStyle = '#111';
      g.font = '700 9px sans-serif';
      g.textAlign = 'center';
      g.fillText('RÖKNING DÖDAR', w / 2, h * 0.835);
    }));
    const ms = cols.map((c, i) => { const m = mat(c); return [m, mat('#fff', { map: front[i], roughness: 0.45, clearcoat: 0.6 }), m, m, m, m]; });
    const box = new THREE.BoxGeometry(9, 21, 13.5);
    let s = 23;
    const R0 = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (const yb of [175, 225]) {
      hylla(b, yb, -10, 640, 30);
      let z = 2;
      while (z < 630) {
        const ci = (R0() * cols.length) | 0;
        const n = 3 + ((R0() * 5) | 0);
        for (let i = 0; i < n && z < 630; i++) {
          const p = b.mesh(box, ms[ci]);
          p.position.set(WX - 18, -yb + 10.5, z + 6.75);
          p.rotation.y = (R0() - 0.5) * 6 * DEG;
          z += 14.4;
        }
        z += 5;
      }
    }
  }

  // ---------- disken och pulten ----------

  // Barstolen framför disken: krom och röd vinyl med söm, fotring och ett
  // lågt ryggstöd på bortre sidan.
  function stol(b) {
    const { mesh } = b;
    const g = new THREE.Group();
    g.position.set(1079, -495, 515);
    g.rotation.y = 8 * DEG;
    b.scene.add(g);
    const krom = mat('#d8d8d4', { metalness: 1, roughness: 0.18, envMapIntensity: 1.3 });
    const vinyl = mat('#8b2e2a', { roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 });
    const prof = [[0, 0], [19, 0], [22, 1.2], [23, 4], [22.2, 7], [19, 8.4], [0, 8.6]].map(([a, q]) => new THREE.Vector2(a, q));
    mesh(new THREE.LatheGeometry(prof, 64), vinyl, g);
    const som = mesh(new THREE.TorusGeometry(22.6, 0.35, 6, 64), mat('#c9b18a', { roughness: 0.8 }), g);
    som.rotation.x = 90 * DEG;
    som.position.y = 4;
    const ring = mesh(new THREE.TorusGeometry(15, 1.3, 10, 48), krom, g);
    ring.rotation.x = 90 * DEG;
    ring.position.y = -1;
    for (const a of [45, 135, 225, 315].map((x) => x * DEG)) {
      const p0 = new THREE.Vector3(Math.cos(a) * 15, -1, Math.sin(a) * 15);
      const p1 = new THREE.Vector3(Math.cos(a) * 21, -230, Math.sin(a) * 21);
      const ben = mesh(new THREE.CylinderGeometry(1.6, 1.6, p0.distanceTo(p1), 16), krom, g);
      ben.position.copy(p0).lerp(p1, 0.5);
      ben.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
    }
    const fot = mesh(new THREE.TorusGeometry(18.5, 1.2, 10, 48), krom, g);
    fot.rotation.x = 90 * DEG;
    fot.position.y = -95;
    for (const x of [-14, 14]) {
      const st = mesh(new THREE.CylinderGeometry(1.3, 1.3, 34, 12), krom, g);
      st.position.set(x, 18, -17);
      st.rotation.x = -8 * DEG;
    }
    const rygg = mesh(new RB(44, 12, 5, 3, 2.4), vinyl, g);
    rygg.position.set(0, 33, -19.5);
    rygg.rotation.x = -8 * DEG;
  }

  // Kupongstället vid fönstret: fack av plexiglas, lågt fram och högt bak,
  // med blanka kuponger som lutar bakåt, butikens pennor i ett rör och lappen
  // på plexit.
  function stall(b) {
    const { mesh, cam } = b;
    b.scene.add(new THREE.HemisphereLight('#d8d0b8', '#3a2a20', 0.5));
    const key = new THREE.DirectionalLight('#fff0d6', 2.1);
    key.position.set(-420, 700, 300);
    key.target.position.set(0, 0, 80);
    key.castShadow = true;
    key.shadow.mapSize.set(SKUGGA, SKUGGA);
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.6;
    Object.assign(key.shadow.camera, { left: -1000, right: 1000, top: 1000, bottom: -1000, near: 10, far: 3000 });
    b.scene.add(key, key.target);
    const nl = new THREE.DirectionalLight('#ff3a26', 1.4);
    nl.position.set(-300, 220, -320);
    const fl = new THREE.DirectionalLight('#ffd9b0', 0.45);
    fl.position.set(-200, 120, 600);
    b.scene.add(nl, fl);
    const p0 = cam.onDesk(150, 686);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(800, 400), new THREE.ShadowMaterial({ opacity: 0.4 }));
    c.rotation.x = -90 * DEG;
    c.position.set(p0.x, 0, p0.z + 150);
    c.receiveShadow = true;
    b.scene.add(c);
    const g = new THREE.Group();
    g.position.copy(p0);
    g.scale.setScalar(cam.onDesk(151, 686).distanceTo(p0) * 0.85);
    g.rotation.y = -3 * DEG;
    b.scene.add(g);
    const plexi = glas({ color: '#dfeaf2', opacity: 0.2, side: THREE.DoubleSide });
    const lista = new THREE.MeshPhysicalMaterial({ color: '#e8f4f8', transparent: true, opacity: 0.75, roughness: 0.1, clearcoat: 1 });
    mesh(new RB(160, 6, 36, 2, 1.5), mat('#c9c6bc', { metalness: 0.9, roughness: 0.35 }), g).position.set(-1, 3, 0);
    const panel = (w, h, x, y, z, ry = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.6), plexi);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      m.renderOrder = 3;
      g.add(m);
      const e = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, 1.8), lista);
      e.position.set(x, y + h / 2, z);
      e.rotation.y = ry;
      g.add(e);
    };
    panel(118, 62, -18, 37, 15);
    panel(118, 136, -18, 74, -15);
    panel(30, 62, -77, 37, 0, 90 * DEG);
    panel(30, 62, 41, 37, 0, 90 * DEG);
    const blank = tex(200, 256, (x, w, h) => {
      x.fillStyle = '#e9dfc6';
      x.fillRect(0, 0, w, h);
      x.fillStyle = '#c8643a';
      x.fillRect(0, 0, w, 30);
      x.fillStyle = '#f6ecd9';
      x.font = '700 8px Fraunces';
      x.fillText('MATCHFIXARNA', 10, 19);
      x.font = '800 18px Fraunces';
      x.textAlign = 'right';
      x.fillText('Kupong', w - 10, 22);
      for (let i = 0; i < 16; i++) {
        const ry = 44 + i * 13;
        x.strokeStyle = 'rgba(138,106,74,.45)';
        x.beginPath();
        x.moveTo(12, ry + 8);
        x.lineTo(96, ry + 8);
        x.stroke();
        x.strokeStyle = '#a87650';
        for (const bx of [112, 140, 168]) x.strokeRect(bx, ry, 20, 9);
      }
    });
    const kup = mat('#fff', { map: blank, roughness: 0.85, side: THREE.DoubleSide });
    [[-20, -9, -3], [-16, -6, 2], [-18, -3, 0]].forEach(([x, z, rz], i) => {
      const m = mesh(new THREE.PlaneGeometry(100, 128), kup, g);
      m.position.set(x, 68 + i * 2, z);
      m.rotation.set(-10 * DEG, 0, rz * DEG);
    });
    const ror = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 46, 32, 1, true), plexi);
    ror.position.set(60, 26, 2);
    ror.renderOrder = 3;
    g.add(ror);
    const rk = new THREE.Mesh(new THREE.TorusGeometry(13, 0.7, 8, 32), lista);
    rk.rotation.x = 90 * DEG;
    rk.position.set(60, 49, 2);
    g.add(rk);
    const tra = mat('#e2c08c', { roughness: 0.7 });
    for (const [x, a, l, z] of [[53, -9, 54, -2], [58, -2, 62, 3], [63, 6, 52, -3], [67, 12, 48, 4]]) {
      const pg = new THREE.Group();
      pg.position.set(x, 6, 2 + z);
      pg.rotation.set(z * 1.5 * DEG, 0, -a * DEG);
      g.add(pg);
      mesh(new THREE.CylinderGeometry(2.6, 2.6, l, 6), mat('#d9d7d0', { roughness: 0.45 }), pg).position.y = l / 2;
      mesh(new THREE.ConeGeometry(2.6, 8, 6), tra, pg).position.y = l + 4;
      mesh(new THREE.ConeGeometry(0.9, 2.8, 6), mat('#2a2a2a'), pg).position.y = l + 6.6;
    }
    const lapp = tex(352, 64, (x, w, h) => {
      x.fillStyle = '#f6f1a8';
      x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a241c';
      x.font = '700 40px Caveat';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('Pennorna är räknade', w / 2, h / 2 + 2);
    });
    const la = mesh(new THREE.PlaneGeometry(88, 16), mat('#fff', { map: lapp, roughness: 0.9 }), g);
    la.position.set(-18, 40, 16.2);
    la.rotation.z = -4 * DEG;
    const tejp = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), mat('#e8e2c8', { transparent: true, opacity: 0.75, roughness: 0.5 }));
    tejp.position.set(-17, 48, 16.4);
    tejp.rotation.z = -4 * DEG;
    g.add(tejp);
  }

  // ---------- allt ----------

  // knappen kring uret: ett klick går fram till det (närbilden i rum.js)
  const knapp = document.createElement('button');
  knapp.type = 'button';
  knapp.className = 'rum-ur rum-sak';
  knapp.dataset.sak = 'ur';
  knapp.setAttribute('aria-label', 'Uret');
  planes[0].append(knapp);
  const B = {};
  for (const [k, { box, i }] of Object.entries(BITAR)) {
    if (k === 'stall') { B[k] = bit(k, deskCam(box, { x: 160, y: 640 })); continue; }
    // uret och ramen ligger i knappen och länken, så att de lyser när man pekar på dem
    B[k] = bit(k, wallCam(box), i ? el.querySelector(i) : null);
    wallLights(B[k], box, !['tak', 'neon'].includes(k));
  }
  lysror(B.tak);
  stangt(B.tak);
  neon(B.neon, B.tak);
  const visare = ur(B.ur);
  backWall(B.ur);
  const skylt = ram(B.ram);
  backWall(B.ram);
  paket(B.hogra);
  wallRing(B.hogra, 1330, 1478, 352, 458, 5, mat('#e2e0d8', { metalness: 0.75, roughness: 0.3, envMapIntensity: 1.4 }));
  const ved = tex(256, 256, (c, w, h) => {
    c.fillStyle = '#6a4a28';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      c.strokeStyle = `rgba(${hash(i) > 0.5 ? '40,24,8' : '150,110,60'},${0.15 + hash(i + 3) * 0.25})`;
      c.lineWidth = 1 + hash(i + 7) * 2;
      c.beginPath();
      const y = hash(i + 1) * h;
      c.moveTo(0, y);
      c.bezierCurveTo(w * 0.3, y + 6 * (hash(i + 2) - 0.5), w * 0.6, y - 6, w, y + 4 * (hash(i + 4) - 0.5));
      c.stroke();
    }
  });
  wallRing(B.hogra, 1496, 1700, 330, 478, 5, mat('#fff', { map: ved, roughness: 0.55 }));
  rightWall(B.hogra);
  stol(B.stol);
  stall(B.stall);

  // Uret går efter Stockholms tid, med samma klocka som utsikten (Vader.nu()
  // i vader.js, annars datorns klocka). Med ?rum-t står det på den tid det
  // visade först.
  const fUr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  let off = null;
  let sekund = null;
  function tick() {
    if (sekund != null && opt.still && opt.still()) return;
    if (off == null) off = window.Vader ? Vader.nu().t - Date.now() : 0;
    const ms = Date.now() + off;
    const s = Math.floor(ms / 1000);
    if (s === sekund) return;
    sekund = s;
    const p = {};
    for (const x of fUr.formatToParts(new Date(ms))) p[x.type] = +x.value;
    visare(p.hour, p.minute, p.second);
    B.ur.paint();
  }
  let namn = null;
  function setNamn(html) {
    const s = String(html || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (s === namn) return;
    namn = s;
    skylt(s);
    B.ram.paint();
  }
  setNamn('');
  for (const k of ['tak', 'neon', 'hogra', 'stol', 'stall']) B[k].paint();
  tick();
  return { draw: tick, namn: setNamn, skarp: (k, px) => B[k] && B[k].skarp(px) };
}
