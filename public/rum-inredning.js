// Inredningen i tobaksaffären (rum.js) i three.js som gänget (rum-3d.js) och
// sakerna på pulten (rum-saker.js): lysröret i taket, Stryktipset målat på
// väggen ovanför fönstret, neonskylten i
// skyltfönstret, Stängt-skylten på dörrens glas, skivan med löpsedlarna i
// fönstret, stationsuret och orakelramen med mässingsskylten på bakväggen,
// cigarettpaketen uppe på högra väggen, ramarna kring skårtavlan och
// korktavlan, bardisken med barstolarna, kupongstället på disken och bladet
// med radions stationer på väggen bredvid radion.
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
// Z = WZ, högra väggen X = WX). Bardisken och kupongstället på den ses med
// samma kamera, som kortlådan (rum-kortlada.js).
//
// Uret ligger i en knapp (.rum-ur) och ramen i länken (.rum-ram): ett klick
// går fram till dem (närbilderna i rum.js), och där ritas de, och ramen kring
// skårtavlan, om skarpare (skarp).
//
// Uret visar också hur länge det är kvar till spelstoppet (stopp, från rum.js):
// dagarna i ett fönster vid sexan, som datumet i ett armbandsur, en röd spets i
// kanten vid klockslaget och de sista tolv timmarna en röd sektor från
// timvisaren fram till spetsen.
//
// På natten är lysröret släckt (natt, från rum-folk.js, 0–1 medan det dämpas och tänds): rören och
// reflektorn mörka, och det målade bandet mörknar.
//
// inredning(el, { calm, still, vagg }) → { draw(), namn(html), skarp(namn eller [namn], px), natt(0–1), stopp(ms), lapp } (namnet som Kronan.names, ms spelstoppet eller null;
// vagg: tavlornas mått på högra väggen, VAGG i rum.js; lapp: bladet vid radion för rum-radio.js, radiolapp)

import { SKIVA, skivPlats } from './rum-affischer.js';
import { ROR as NEON_ROR } from './rum-neon.js';

const DEG = Math.PI / 180;
const WZ = -26;
const WX = 1156;
// djupet in längs högra väggen där x (i hörnets plan) ligger, som onWall i rum.js
const wz = (x) => 1000 * (1 - 380 / (x - 760));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const UR = { x: 1050, y: 152, r: 46 };
const RAM = { x: 987, y: 302, w: 126, h: 152, b: 12 };
// det målade bandet på bakväggen, mellan taket och fönsterkarmen och lika brett
// som fönstret (i bakväggens bild)
const MAL = { x0: 262, x1: 958, y0: 92, y1: 121 };
// bladet med radions stationer på väggen till höger om radion (radiolapp): i remsan mellan fönsterkarmen
// (x 958) och veckans löpsedel (x 986, LOPPLATS i rum-affischer.js) med luft till båda, och en bit ovanför
// fönsterbänken (y 552), så att det sitter på en enda yta och inte når ned till bänken; ett blad ur ett
// litet block, lagom för tio stationer
const LAPP = { x: 961, y: 513, w: 23, h: 29 };
// Sakerna och dukarna (plan: 0 = väggen). Urets
// och ramens dukar ligger i knappen och länken (i, med hörnet at).
const BITAR = {
  tak: { plan: 0, box: { x: 0, y: 0, w: 960, h: 240 } },
  neon: { plan: 0, box: { x: 290, y: 104, w: 300, h: 130 } },
  ur: { plan: 0, box: { x: 992, y: 94, w: 130, h: 142 }, i: '.rum-ur', at: { x: UR.x - 54, y: UR.y - 54 } },
  ram: { plan: 0, box: { x: 968, y: 280, w: 164, h: 232 }, i: '.rum-ram', at: RAM },
  hogra: { plan: 0, box: { x: 1130, y: 0, w: 470, h: 580 } },
  // skivan med löpsedlarna, kedjorna upp till karmen och skuggan på glaset;
  // duken ligger under sedlarna (#rum-skiva, rum-affischer.js)
  skiva: { plan: 0, box: { x: SKIVA.x - 6, y: 134, w: SKIVA.w + 14, h: SKIVA.y + SKIVA.h + 10 - 134 }, i: '#rum-skiva', at: SKIVA },
  // bardisken med barstolarna, till höger om bilden in i videons hörn; den
  // ligger under tavlorna på högra väggen och kortlådan (fore)
  disk: { plan: 0, box: { x: 990, y: 470, w: 1110, h: 400 }, fore: '.rum-hv' },
  // kupongstället på disken: det står framför anslagstavlan och ligger över
  // den, men under kortlådan (z-index i rum-register.css); duken lyser när man
  // pekar på stället (.rum-stall-duk i rum.css)
  stall: { plan: 0, box: { x: 1150, y: 414, w: 110, h: 121 }, cls: 'rum-stall-duk' },
  // bladet med radions stationer (radiolapp): duken ligger i knappen kring bladet, med plats för tejpen
  // och skuggan, och ett klick går fram till det (SAKER.radiolapp i rum.js)
  radiolapp: { plan: 0, box: { x: LAPP.x - 7, y: LAPP.y - 7, w: LAPP.w + 15, h: LAPP.h + 13 }, i: '.rum-radiolapp', at: LAPP },
};
// närbilden: högst så många bildpunkter på dukens längsta led
const SKARP = 2600;

export async function inredning(el, opt = {}) {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry: RB } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  await Promise.all(['italic 600 68px Fraunces', '600 40px Fraunces', '700 40px Fraunces', '800 60px Fraunces', '700 40px Caveat', '400 40px "Alfa Slab One"']
    .map((f) => document.fonts.load(f).catch(() => null)));

  // i telefonen färre bildpunkter, ingen kantutjämning och mindre skuggkartor,
  // så att minnet räcker
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const SKUGGA = LATT ? 1024 : 2048;
  const DPR = LATT ? 1.5 : Math.min(2.5, Math.max(2, (window.devicePixelRatio || 1) * 1.25));
  const gl = new THREE.WebGLRenderer({ alpha: true, antialias: !LATT, preserveDrawingBuffer: true });
  gl.setPixelRatio(DPR);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.shadowMap.enabled = !(await import('./rum-gpu.js')).utanSkuggor(gl);
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

  // Neonens sken är ritat i duken. Som filter på duken (tre skuggor i rad)
  // räknades oskärpan om på grafikkortet i varje bildruta, flera pass i full
  // upplösning för något som bara ändras när skylten glappar – och då sköter
  // opaciteten det (.av i rum.css). Skuggorna här är samma skuggor och görs en
  // gång (spridningen i filtret är standardavvikelsen, och shadowBlur är dubbla
  // den). SKEN_M: rum runt rören, i planets px.
  const SKEN_M = 50;
  function medSken(g, bild, m, pr) {
    let sist = bild;
    let x = m;
    let y = m;
    for (const [blur, farg] of [[2, 'rgba(255,80,60,1)'], [6, 'rgba(255,45,31,.9)'], [16, 'rgba(255,45,31,.6)']]) {
      const c = document.createElement('canvas');
      c.width = g.canvas.width;
      c.height = g.canvas.height;
      const t = c.getContext('2d');
      t.shadowColor = farg;
      t.shadowBlur = 2 * blur * pr;
      t.drawImage(sist, x, y);
      sist = c;
      x = 0;
      y = 0;
    }
    g.drawImage(sist, 0, 0);
  }

  // En sak: en scen med kamera och ljus, och duken den kopieras till.
  function bit(namn, cam, parent) {
    const { box } = BITAR[namn];
    const canvas = document.createElement('canvas');
    // neonen glappar som förut (rum-neon, .av i rum.css)
    canvas.className = `rum-inr${namn === 'neon' ? ' rum-neon' : ''}${BITAR[namn].cls ? ` ${BITAR[namn].cls}` : ''}`;
    // (vilken sak: löpsedeln läggs under disken, rum-affischer.js)
    canvas.dataset.bit = namn;
    // (neonens sken ritas i duken, utanför rören: medSken)
    const M = namn === 'neon' ? SKEN_M : 0;
    canvas.width = Math.round((box.w + 2 * M) * DPR);
    canvas.height = Math.round((box.h + 2 * M) * DPR);
    let pr = DPR;
    const at = parent ? BITAR[namn].at : { x: 0, y: 0 };
    Object.assign(canvas.style, { position: 'absolute', pointerEvents: 'none', left: `${box.x - at.x - M}px`, top: `${box.y - at.y - M}px`, width: `${box.w + 2 * M}px`, height: `${box.h + 2 * M}px` });
    const pl = parent || planes[BITAR[namn].plan];
    const fore = BITAR[namn].fore && pl.querySelector(`:scope > ${BITAR[namn].fore}`);
    if (fore) pl.insertBefore(canvas, fore);
    else pl.append(canvas);
    const scene = new THREE.Scene();
    scene.environment = env;
    const mesh = (g, m, p = scene, skugga = true) => { const x = new THREE.Mesh(g, m); x.castShadow = skugga; x.receiveShadow = true; p.add(x); return x; };
    const occ = (g) => { const x = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false })); x.renderOrder = -1; scene.add(x); return x; };
    return {
      scene, cam, mesh, occ, canvas,
      paint() {
        // samma storlek som förra gången: duken behöver inte göras om
        if (gl.getPixelRatio() !== pr) gl.setPixelRatio(pr);
        const gw = Math.round(box.w * pr);
        const gh = Math.round(box.h * pr);
        if (gl.domElement.width !== gw || gl.domElement.height !== gh) gl.setSize(box.w, box.h, false);
        gl.render(scene, cam);
        const g = canvas.getContext('2d');
        g.clearRect(0, 0, canvas.width, canvas.height);
        if (M) medSken(g, gl.domElement, M * pr, pr);
        else g.drawImage(gl.domElement, 0, 0, canvas.width, canvas.height);
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
        canvas.width = Math.floor((box.w + 2 * M) * pr);
        canvas.height = Math.floor((box.h + 2 * M) * pr);
        this.paint();
      },
    };
  }

  // kameran för väggarna (se överst)
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
  // Spotarna i taket (SPOT i rum.js målar deras ljus på väggarna): mot orakelramen och mot pokalhyllan med
  // Tipsligan, som också lyser på disken under. De finns i alla sakers ljus, så att alla delar samma
  // grafikprogram och ljuset faller lika överallt; sakerna ritas en gång, så det kostar inget i bildrutorna.
  const SPOTAR = [
    { fran: [1050, 30, 330], mot: [1050, -372, WZ], styrka: 1.6, vinkel: 0.34 },
    { fran: [880, 30, 470], mot: [WX, -366, 377], styrka: 0.8, vinkel: 0.36 },
  ];
  // ljuset som i rummet: lysröret ovanför och framför till vänster, neonen
  // från fönstret, tv:n från hörnet och spotarna
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
    for (const { fran, mot, styrka, vinkel } of SPOTAR) {
      const s = new THREE.SpotLight('#ffe2b8', 0, 0, vinkel, 0.9, 2);
      s.position.set(...fran);
      s.target.position.set(...mot);
      s.intensity = styrka * s.position.distanceToSquared(s.target.position);
      scene.add(s, s.target);
    }
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

  const ROR = { ljus: '#ffffff', refl: '#f4f1e6', av: '#8d8f8a', reflAv: '#6c6960' };
  let rorLjus = null;
  let rorRefl = null;
  function lysror(b) {
    const { mesh } = b;
    const g = new THREE.Group();
    g.position.set(665, -90, 140);
    b.scene.add(g);
    mesh(new THREE.BoxGeometry(470, 7, 62), mat('#d9d4c4', { roughness: 0.45, metalness: 0.2 }), g, false).position.y = -3.5;
    // reflektorn: ljus undersida mellan rören
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(462, 54), new THREE.MeshBasicMaterial({ color: ROR.refl, toneMapped: false }));
    rorRefl = refl.material;
    refl.rotation.x = 90 * DEG;
    refl.position.y = -7.1;
    g.add(refl);
    const ljus = new THREE.MeshBasicMaterial({ color: ROR.ljus, toneMapped: false });
    rorLjus = ljus;
    for (const z of [-15, 15]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 448, 20), ljus);
      t.rotation.z = 90 * DEG;
      t.position.set(0, -12, z);
      g.add(t);
    }
    const gavel = mat('#bdb8a8', { roughness: 0.4, metalness: 0.3 });
    for (const x of [-229, 229]) mesh(new RB(12, 12, 50, 2, 2), gavel, g, false).position.set(x, -11, 0);
  }

  // Stryktipset målat direkt på bakväggen ovanför fönstret (MAL): ett band i
  // oxidrött med krämvita bokstäver, en stjärna och två linjer på vardera sidan.
  // Färgen har nötts, så att panelens ådring och fogar (var 34:e, furu i rum.js)
  // syns igenom. Det är färg och inget föremål, så det har ingen kropp och ingen
  // skugga. Materialet (malMat) mörknar när lysröret är släckt (natt).
  let malMat = null;
  function malat(b) {
    const W = MAL.x1 - MAL.x0, H = MAL.y1 - MAL.y0, my = H / 2;
    const KRAM = '#fbeec6', SKUGGA_F = '#350704';
    const k = (LATT ? 2048 : 4096) / W;
    const karta = tex(Math.round(W * k), Math.round(H * k), (c) => {
      c.scale(k, k);
      // bandet, med ojämna penseldrag i kanterna
      c.fillStyle = '#a3170d';
      c.beginPath();
      c.moveTo(0.6, 0.8);
      for (let x = 0; x <= W; x += 24) c.lineTo(x, 0.5 + hash(x + 0.3));
      for (let x = W; x >= 0; x -= 24) c.lineTo(x, H - 0.5 - hash(x + 0.7));
      c.closePath();
      c.fill();
      c.strokeStyle = KRAM;
      c.lineWidth = 0.9;
      c.strokeRect(4, 3.4, W - 8, H - 6.8);
      // ordet, bokstav för bokstav (Safari saknar letterSpacing på duken)
      const FS = 25, SP = 5, ORD = 'STRYKTIPSET';
      c.font = `${FS}px "Alfa Slab One", Fraunces`;
      c.textBaseline = 'alphabetic';
      c.textAlign = 'left';
      const steg = [...ORD].map((q) => c.measureText(q).width + SP);
      const wOrd = steg.reduce((a, q) => a + q, 0);
      const base = my + FS * 0.362;
      for (const [f, dx, dy] of [[SKUGGA_F, 1.2, 1.1], [KRAM, 0, 0]]) {
        c.fillStyle = f;
        let x = (W - wOrd) / 2 + SP / 2;
        [...ORD].forEach((q, i) => { c.fillText(q, x + dx, base + dy); x += steg[i]; });
      }
      // stjärna och två linjer på vardera sidan
      c.fillStyle = KRAM;
      for (const sx of [-1, 1]) {
        const bx = W / 2 + sx * (wOrd / 2 + 24);
        c.beginPath();
        for (let n = 0; n < 10; n++) {
          const a = (-90 + n * 36) * DEG, q = n % 2 ? 3.6 : 8.4;
          c.lineTo(bx + q * Math.cos(a), my + q * Math.sin(a));
        }
        c.closePath();
        c.fill();
        const x0 = W / 2 + sx * (wOrd / 2 + 42), x1 = W / 2 + sx * (W / 2 - 14);
        c.fillRect(Math.min(x0, x1), my - 3.2, Math.abs(x1 - x0), 1.7);
        c.fillRect(Math.min(x0, x1), my + 1.5, Math.abs(x1 - x0), 1.7);
      }
      // det nötta: fläckar, ådringen och fogarna, där väggen syns igenom
      c.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 1300; i++) {
        c.fillStyle = `rgba(0,0,0,${(0.15 + hash(i + 0.31) * 0.5).toFixed(2)})`;
        c.fillRect(hash(i + 0.13) * W, hash(i + 0.57) * H, 0.3 + hash(i + 0.77), 0.25 + hash(i + 0.17) * 1.5);
      }
      for (let i = 0; i < 120; i++) {
        c.strokeStyle = `rgba(0,0,0,${(0.05 + hash(i + 0.4) * 0.26).toFixed(2)})`;
        c.lineWidth = 0.3 + hash(i + 0.6) * 0.9;
        const x = hash(i + 0.9) * W;
        c.beginPath();
        c.moveTo(x, 0);
        c.bezierCurveTo(x + 2, H * 0.3, x - 2, H * 0.7, x + 1, H);
        c.stroke();
      }
      c.fillStyle = 'rgba(0,0,0,.7)';
      for (let x = 34 * Math.ceil(MAL.x0 / 34); x < MAL.x1; x += 34) c.fillRect(x - MAL.x0 + 0.1, 0, 0.9, H);
      c.globalCompositeOperation = 'source-over';
    });
    malMat = new THREE.MeshBasicMaterial({ map: karta, toneMapped: false, transparent: true, depthWrite: false, opacity: 0.94 });
    malMat.userData.dag = malMat.color.clone();
    // väggen ligger på djupet WZ, och MAL är mätt i bilden av den
    const z = WZ + 0.3, s = 1000 / (1000 - z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W / s, H / s), malMat);
    m.position.set(760 + ((MAL.x0 + MAL.x1) / 2 - 760) / s, -(400 + ((MAL.y0 + MAL.y1) / 2 - 400) / s), z);
    b.scene.add(m);
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

  // rören i en egen duk som lyser (rum-neon: den glappar som förut), och
  // ställningen – listen, transformatorn och kedjorna – i takets duk
  function neon(b, tak) {
    const fs = 68, px = 280, k = fs / px, Z = -12;
    const core = new THREE.MeshBasicMaterial({ color: '#ffe0d6', toneMapped: false });
    const ror = glas({ color: '#ff3a26', emissive: '#ff2a18', emissiveIntensity: 1.5, opacity: 0.62, roughness: 0.15, envMapIntensity: 0.5 });
    const elektrod = mat('#3a302a', { roughness: 0.6 });
    // (rören är uträknade i förväg, rum-neon.js; spegelvända, sett inifrån)
    for (const { v, closed, ends } of NEON_ROR) {
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

    // Spelstoppet: fönstret med dagarna kvar (kalenderdagar i Stockholm, 0 på
    // spelstoppets dag) med DAGAR TILL / SPELSTOPP tryckt under, spetsen och
    // sektorn. Utan spelstopp står fönstret tomt.
    const ROD = '#a81c12';
    const FW = r * 0.3, FH = r * 0.25, PX = 24;
    // ramen (FH + 3) och två rader text under den
    const FT = FH + 9.8;
    const ruta = tex(Math.round((FW + 3) * PX), Math.round(FT * PX), () => {});
    const fonster = mesh(new THREE.PlaneGeometry(FW + 3, FT), new THREE.MeshStandardMaterial({ map: ruta, transparent: true, roughness: 0.75 }), g, false);
    // över sektorn (0,45), under visarna; så högt att texten går fri från sexan
    fonster.position.set(0, -r * 0.41, 0.55);
    function dagar(n) {
      const c = ruta.image.getContext('2d');
      const k = PX;
      c.clearRect(0, 0, ruta.image.width, ruta.image.height);
      c.fillStyle = '#1b1915';
      c.fillRect(0, 0, (FW + 3) * k, (FH + 3) * k);
      c.fillStyle = '#f6efdd';
      c.fillRect(1.5 * k, 1.5 * k, FW * k, FH * k);
      // hjulet ligger bakom tavlan: skugga från fönstrets överkant
      const sk = c.createLinearGradient(0, 1.5 * k, 0, (1.5 + FH * 0.35) * k);
      sk.addColorStop(0, 'rgba(40,30,15,.45)');
      sk.addColorStop(1, 'rgba(40,30,15,0)');
      c.fillStyle = sk;
      c.fillRect(1.5 * k, 1.5 * k, FW * k, FH * 0.35 * k);
      if (n == null) { ruta.needsUpdate = true; return; }
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = n ? ROD : '#2a2620';
      c.font = `700 ${FH * (n > 9 ? 0.66 : 0.86) * k}px 'Helvetica Neue', Helvetica, Arial`;
      c.fillText(String(n), (FW + 3) * k / 2, (FH / 2 + 1.5) * k + 0.06 * FH * k);
      c.fillStyle = '#3a342a';
      c.font = `600 ${2.7 * k}px 'Helvetica Neue', Helvetica, Arial`;
      c.fillText(n === 1 ? 'DAG TILL' : 'DAGAR TILL', (FW + 3) * k / 2, (FH + 4.85) * k, (FW + 3) * k);
      c.fillText('SPELSTOPP', (FW + 3) * k / 2, (FH + 7.95) * k, (FW + 3) * k);
      ruta.needsUpdate = true;
    }
    const sp = new THREE.Shape([new THREE.Vector2(-r * 0.07, r), new THREE.Vector2(r * 0.07, r), new THREE.Vector2(0, r * 0.86)]);
    const spets = mesh(new THREE.ExtrudeGeometry(sp, { depth: 0.5, bevelEnabled: false }), mat(ROD, { roughness: 0.45 }), g, false);
    spets.position.z = 0.35;
    const sekMat = new THREE.MeshPhysicalMaterial({ color: ROD, roughness: 0.7, transparent: true, opacity: 0.94, depthWrite: false });
    let sektor = null;
    let visad;
    let sekNyckel = '';
    const fKl = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
    const delar = (ms) => { const p = {}; for (const x of fKl.formatToParts(new Date(ms))) p[x.type] = +x.value; return p; };
    const dagnr = (p) => Date.UTC(p.year, p.month - 1, p.day) / 864e5;
    // timvisarens vinkel (grader medurs från tolv)
    const vinkel = (p) => ((p.hour % 12) + p.minute / 60) * 30;
    function kvar(ms, stopp) {
      const nu = delar(ms);
      const st = stopp && stopp > ms ? delar(stopp) : null;
      const n = st ? dagnr(st) - dagnr(nu) : null;
      if (n !== visad) { dagar(n); visad = n; }
      spets.visible = Boolean(st);
      let nyckel = '';
      if (st) {
        const a1 = vinkel(st);
        spets.rotation.z = -a1 * DEG;
        if (stopp - ms <= 12 * 3600e3) {
          const a0 = vinkel(nu);
          nyckel = `${a0} ${a1 > a0 ? a1 : a1 + 360}`;
        }
      }
      if (nyckel === sekNyckel) return;
      sekNyckel = nyckel;
      if (sektor) { g.remove(sektor); sektor.geometry.dispose(); sektor = null; }
      if (!nyckel) return;
      const [a0, a1] = nyckel.split(' ').map(Number);
      sektor = new THREE.Mesh(new THREE.CircleGeometry(r * 0.66, 96, (90 - a1) * DEG, (a1 - a0) * DEG), sekMat);
      sektor.position.z = 0.45;
      g.add(sektor);
    }
    const visare = (h, m, s) => {
      tim.rotation.z = -((h % 12) + m / 60) * 30 * DEG;
      min.rotation.z = -(m + s / 60) * 6 * DEG;
      sek.rotation.z = -s * 6 * DEG;
    };
    return { visare, kvar };
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
  function wallRing(b, xa, xb, ya, yb, k, m, djup = WX - 1141) {
    const z0 = wz(xa), z1 = wz(xb);
    const sh = new THREE.Shape();
    sh.moveTo(z0 - 1, -(ya - 1)); sh.lineTo(z1 + 1, -(ya - 1)); sh.lineTo(z1 + 1, -(yb + 1)); sh.lineTo(z0 - 1, -(yb + 1)); sh.closePath();
    const hole = new THREE.Path();
    hole.moveTo(z0 + k, -(ya + k)); hole.lineTo(z0 + k, -(yb - k)); hole.lineTo(z1 - k, -(yb - k)); hole.lineTo(z1 - k, -(ya + k)); hole.closePath();
    sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: djup, bevelEnabled: true, bevelThickness: 1, bevelSize: 0.8, bevelSegments: 2 });
    onRight(geo, WX - 1141 - djup);
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
  // märken, i rader om tre till sju. Hyllorna börjar bakom tv:n, så att
  // inga stumpar sticker fram mellan den och hörnet.
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
      hylla(b, yb, 100, 640, 30);
      let z = 112;
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

  // ---------- bardisken och barstolarna ----------

  // Bardisken längs högra väggen, som den platta i rum.js (disk) men i 3D, så
  // att man ser att det är tomt under skivan: skivan i lackad mahogny med en
  // rundad kant, en dryg decimeter ut över den indragna fronten med ramar och
  // fyllningar, konsoler i järn under kanten och en krok i mässing i varje
  // fält. Framför står tre barstolar som gängets (rum-3d.js), inskjutna
  // under kanten. Skivan skuggar
  // fronten och stolarna skuggar fronten och väggen under skivan.
  // Mått i bakväggens plan (1 enhet = 1 px där, ungefär 2,37 per cm):
  // skivan Y = −490 till −501 mellan kanten X = 1060 och väggen X = 1140,
  // fronten X = 1115, golvet Y = −730 och ramarna 128,57 isär från bakväggen
  // (Z = 0) mot betraktaren.
  const DISK = { top: -490, kant: 1060, vagg: 1140, front: 1115, under: -501, golv: -730, ram: 128.57, fram: 850 };
  function bardisk(b) {
    const { mesh } = b;
    const D = DISK;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    // lackad mahogny: ådringen längs plankorna (v), fogarna mellan dem
    const mahogny = (ljus, plankor) => {
      const t = tex(512, 512, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, ljus ? '#7a4a2c' : '#55301b');
        g.addColorStop(1, ljus ? '#6a3e24' : '#4a2916');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        for (let i = 0; i < 140; i++) {
          c.strokeStyle = `rgba(${hash(i) > 0.45 ? '40,16,6' : '170,104,60'},${0.08 + hash(i + 3) * 0.18})`;
          c.lineWidth = 0.6 + hash(i + 7) * 2.4;
          c.beginPath();
          const x = hash(i + 1) * w;
          c.moveTo(x, 0);
          c.bezierCurveTo(x + 10 * (hash(i + 2) - 0.5), h * 0.3, x - 8 * (hash(i + 5) - 0.5), h * 0.65, x + 6 * (hash(i + 4) - 0.5), h);
          c.stroke();
        }
        if (plankor) {
          c.fillStyle = 'rgba(24,10,3,.55)';
          for (const x of [0.32, 0.66]) c.fillRect(x * w, 0, 2, h);
        }
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    };
    const skivTra = mahogny(true, true);
    skivTra.repeat.set(1 / 80, 1 / 520);
    const skiva = mat('#ffffff', { map: skivTra, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18, envMapIntensity: 0.55 });
    const frontTra = mahogny(false, false);
    const front = mat('#ffffff', { map: frontTra, roughness: 0.5, clearcoat: 0.3, envMapIntensity: 0.4 });
    const jarn = mat('#1d1611', { metalness: 0.6, roughness: 0.5 });
    const massing = mat('#c09a52', { metalness: 1, roughness: 0.32, envMapIntensity: 1.2 });

    // skivan: rundad kant fram, sedd i genomskärning och dragen längs disken
    const r = (D.under - D.top) / -2;
    const prof = new THREE.Shape();
    prof.moveTo(D.vagg, D.top);
    prof.lineTo(D.kant + r, D.top);
    prof.absarc(D.kant + r, D.top - r, r, Math.PI / 2, Math.PI * 1.5, false);
    prof.lineTo(D.vagg, D.under);
    prof.closePath();
    mesh(new THREE.ExtrudeGeometry(prof, { depth: D.fram, bevelEnabled: false, curveSegments: 14 }), skiva, b.scene);

    // fronten: skivor inne, ramar utanpå (överst, nederst och vid varje ram)
    const lada = (x0, x1, y0, y1, z0, z1, m = front) => {
      const x = mesh(new THREE.BoxGeometry(x1 - x0, y0 - y1, z1 - z0), m, b.scene);
      x.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      return x;
    };
    lada(D.front + 1.5, D.vagg, D.under, D.golv, 0, D.fram);
    lada(D.front - 1, D.front + 1.5, D.under, -522, 0, D.fram);
    lada(D.front - 1, D.front + 1.5, -712, D.golv, 0, D.fram);
    for (let i = 0; i * D.ram < D.fram; i++) lada(D.front - 1, D.front + 1.5, -522, -712, Math.max(0, i * D.ram - 7), i * D.ram + 7);

    // konsolerna i järn vid varannan ram, och krokarna mitt i varje fält
    for (let i = 1; i * D.ram < D.fram; i += 2) {
      const z = i * D.ram;
      mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(D.kant + 8, D.under - 1, z), V(D.front - 4, D.under - 5, z), V(D.front - 1.5, -546, z)), 20, 1.4, 8), jarn, b.scene);
      lada(D.kant + 8, D.front - 1, D.under, D.under - 1.6, z - 1.6, z + 1.6, jarn);
      lada(D.front - 2, D.front - 1, D.under, -552, z - 2.2, z + 2.2, jarn);
    }
    for (let i = 0; (i + 0.5) * D.ram < D.fram; i++) {
      const z = (i + 0.5) * D.ram;
      lada(D.front - 2.4, D.front - 1, -527, -541, z - 2.6, z + 2.6, massing);
      mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(D.front - 2, -533, z), V(D.front - 11, -539, z), V(D.front - 10.5, -529, z)), 12, 0.9, 8), massing, b.scene);
      mesh(new THREE.SphereGeometry(1.25, 12, 8), massing, b.scene).position.set(D.front - 10.5, -529, z);
    }

    // barstolarna: röd vinyl med söm på en krom ställning, som gängets, i
    // verklig storlek (sitsen 75 cm över golvet), inskjutna under kanten
    const krom = mat('#d8d8d4', { metalness: 1, roughness: 0.18, envMapIntensity: 1.3 });
    const vinyl = mat('#8b2e2a', { roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.6 });
    const som = mat('#c9b18a', { roughness: 0.8 });
    const k = 1.6;
    const cm = 2.37;
    const SITS = D.golv + 75 * cm;
    const ring = (y, R, tube, m, p) => {
      const x = mesh(new THREE.TorusGeometry(R, tube, 10, 64), m, p);
      x.rotation.x = 90 * DEG;
      x.position.y = y;
    };
    // (den innersta är inskjuten ända in under skivan, så att sitsen går fri från
    // löpsedeln på väggen, LOPPLATS i rum-affischer.js: den börjar vid x 1063 i bakväggens bild)
    for (const [z, vrid, inne] of [[120, 8, 24], [250, -14, 0], [380, 21, 0]]) {
      const stol = new THREE.Group();
      stol.position.set(D.kant - 18 + inne, SITS - 2 * k, z);
      stol.rotation.y = vrid * DEG;
      b.scene.add(stol);
      const sits = [[0, 0], [19, 0], [22, 1.2], [23, 4], [22.2, 7], [19, 8.4], [0, 8.6]].map(([a, q]) => new THREE.Vector2(a * k, q * k));
      mesh(new THREE.LatheGeometry(sits, 64), vinyl, stol).position.y = -6.6 * k;
      ring(-2.6 * k, 22.6 * k, 0.35 * k, som, stol);
      ring(-7.6 * k, 15 * k, 1.3 * k, krom, stol);
      const golv = D.golv - stol.position.y;
      ring(golv + 30 * cm, 19.5 * k, 1.2 * k, krom, stol);
      for (const a of [45, 135, 225, 315].map((x) => x * DEG)) {
        const p0 = V(Math.cos(a) * 15 * k, -7.6 * k, Math.sin(a) * 15 * k);
        const p1 = V(Math.cos(a) * 24 * k, golv, Math.sin(a) * 24 * k);
        const ben = mesh(new THREE.CylinderGeometry(1.6 * k, 1.6 * k, p0.distanceTo(p1), 16), krom, stol);
        ben.position.copy(p0).add(p1).multiplyScalar(0.5);
        ben.quaternion.setFromUnitVectors(V(0, 1, 0), p1.clone().sub(p0).normalize());
      }
    }
    // skuggorna på bakväggen under skivan; utan skuggkarta (rum-gpu.js) en
    // målad skugga på fronten under skivan i stället
    catcher(b, new THREE.PlaneGeometry(140, 260), [0, 0, 0], [1080, -620, 0.3]);
    if (!gl.shadowMap.enabled) {
      const t = tex(4, 64, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(0,0,0,.6)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(D.fram, 70), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.rotation.y = -90 * DEG;
      m.position.set(D.front - 2.6, D.under - 35, D.fram / 2);
      b.scene.add(m);
    }
  }

  // ---------- kupongstället ----------

  // Kupongstället på bardisken, under anslagstavlan mellan barstolarna och
  // kortlådan (rum-kortlada.js): ett fack av plexiglas, lågt fram och högt bak,
  // med blanka kuponger som lutar bakåt, butikens pennor i ett rör och lappen
  // på plexit. Kupongerna är kupongen på pulten i telefonens smala form
  // (blankett), och överst sitter en tryckt skylt i bandets färg: Nästa
  // omgång. Ett klick på stället tar en kupong för nästa omgång i handen
  // (länken #rum-stall, openStall i rum.js). Det står in mot väggen, vänt ut
  // mot rummet och lite mot den som står vid pulten. Stället är ritat i
  // millimeter, k enheter per mm (disken har 0,237; stället är lite större,
  // som kortlådan), och står på skivan i (x, z) vridet vrid grader.
  const STALL = { x: 1104, z: 225, vrid: -66, k: 0.3 };
  // Kupongen på pulten i telefonen (.rum.smal i rum.css, 420 × 620): bandet,
  // spelstoppet, Nr och Match, tretton rader med synkmarkeringen i kanten och
  // rutorna 1 X 2, och tryckeriets rad längs högerkanten. Samma färger och tryck.
  function blankett(x, w, h) {
    const s = w / 420;
    x.scale(s, s);
    const W = 420;
    const H = h / s;
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f3e9d4');
    g.addColorStop(1, '#e7dbc0');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    const tryck = '#a9452b';
    const spar = (t, px) => { x.letterSpacing = `${px}px`; return t; };
    // bandet
    x.fillStyle = '#c8643a';
    x.fillRect(0, 0, W, 46);
    x.fillStyle = '#f1e8d5';
    x.fillRect(0, 46, W, 2);
    x.fillStyle = '#c8643a';
    x.fillRect(0, 48, W, 1.5);
    x.fillStyle = '#f6ecd9';
    x.textBaseline = 'middle';
    x.font = '700 11px Fraunces';
    x.fillText(spar('MATCHFIXARNA · TIPSKUPONG', 2), 36, 24);
    x.font = '800 27px Fraunces';
    x.textAlign = 'right';
    x.fillText(spar('Kupong', -0.3), 404, 24);
    // spelstoppet till höger, på en prickad rad
    x.fillStyle = tryck;
    x.textAlign = 'left';
    x.font = '700 10.5px Fraunces';
    x.fillText(spar('SPELSTOPP', 1.6), 236, 66);
    x.textAlign = 'right';
    x.fillStyle = '#221f1b';
    x.font = '400 16px Fraunces';
    x.fillText(spar('–', 0), 404, 66);
    x.strokeStyle = 'rgba(169,69,43,.45)';
    x.lineWidth = 1;
    x.setLineDash([1, 2]);
    x.beginPath();
    x.moveTo(236, 77.5);
    x.lineTo(404, 77.5);
    x.stroke();
    // Nr och Match, med prickar under
    x.fillStyle = tryck;
    x.textAlign = 'left';
    x.font = '700 10px Fraunces';
    x.fillText(spar('NR', 1.6), 36, 97);
    x.fillText(spar('MATCH', 1.6), 64, 97);
    x.beginPath();
    x.moveTo(36, 109.5);
    x.lineTo(404, 109.5);
    x.stroke();
    x.setLineDash([]);
    // raderna: lagen och dagen skrivs inte på en blankett
    for (let i = 0; i < 13; i++) {
      const y = 110 + i * 34;
      if (i % 2) {
        x.fillStyle = 'rgba(169,69,43,.055)';
        x.fillRect(36, y, 368, 34);
      }
      x.fillStyle = '#1e1a15';
      x.fillRect(10, y + 14, 16, 6);
      x.strokeStyle = 'rgba(169,69,43,.25)';
      x.beginPath();
      x.moveTo(36, y + 33.5);
      x.lineTo(404, y + 33.5);
      x.stroke();
      x.fillStyle = tryck;
      x.textAlign = 'center';
      x.font = '700 13px Fraunces';
      x.fillText(spar(String(i + 1), 0), 47, y + 17);
      ['1', 'X', '2'].forEach((t, j) => {
        const bx = 260 + j * 50;
        x.fillStyle = 'rgba(251,247,236,.45)';
        x.strokeStyle = '#b4664a';
        x.lineWidth = 1.2;
        x.beginPath();
        if (x.roundRect) x.roundRect(bx + 0.6, y + 4.6, 42.8, 24.8, 2);
        else x.rect(bx + 0.6, y + 4.6, 42.8, 24.8);
        x.fill();
        x.stroke();
        x.globalAlpha = 0.62;
        x.fillStyle = tryck;
        x.font = '600 11px Fraunces';
        x.fillText(t, bx + 22, y + 17.5);
        x.globalAlpha = 1;
      });
    }
    // tryckeriets rad längs högerkanten, nerifrån och upp
    x.save();
    x.translate(W - 8.5, H - 18);
    x.rotate(-Math.PI / 2);
    x.globalAlpha = 0.72;
    x.fillStyle = tryck;
    x.textAlign = 'left';
    x.font = '600 7px Fraunces';
    x.fillText(spar('MATCHFIXARNA AB · BLANKETT 13 · EFTERTRYCK FÖRBJUDES', 1.1), 0, 0);
    x.restore();
    x.letterSpacing = '0px';
  }
  // Skylten överst: tryckt kartong i bandets färg, med en ljus ram innanför kanten.
  function skylten(x, w, h) {
    x.fillStyle = '#c8643a';
    x.fillRect(0, 0, w, h);
    x.strokeStyle = '#f1e8d5';
    x.lineWidth = w * 0.012;
    x.strokeRect(w * 0.03, w * 0.03, w - w * 0.06, h - w * 0.06);
    x.fillStyle = '#f6ecd9';
    x.textAlign = 'center';
    x.textBaseline = 'alphabetic';
    const rad = (t, y) => {
      let px = h * 0.4;
      x.font = `800 ${px}px Fraunces`;
      const b = x.measureText(t).width;
      if (b > w * 0.84) {
        px *= (w * 0.84) / b;
        x.font = `800 ${px}px Fraunces`;
      }
      x.fillText(t, w / 2, y);
    };
    rad('NÄSTA', h * 0.47);
    rad('OMGÅNG', h * 0.86);
  }
  function stall(b) {
    const { mesh } = b;
    const D = DISK;
    // skuggan på skivan (inte utanför kanten) och på väggen strax ovanför
    catcher(b, new THREE.PlaneGeometry(D.vagg - D.kant - 6, 240), [-90 * DEG, 0, 0], [(D.kant + 6 + D.vagg) / 2, D.top + 0.05, STALL.z - 40]);
    catcher(b, new THREE.PlaneGeometry(240, 80), [0, -90 * DEG, 0], [D.vagg - 0.05, D.top + 40, STALL.z - 40], 0.3);
    const g = new THREE.Group();
    g.position.set(STALL.x, D.top, STALL.z);
    g.scale.setScalar(STALL.k);
    g.rotation.y = STALL.vrid * DEG;
    b.scene.add(g);
    // Ljuset kommer ungefär därifrån man ser stället, så skuggan faller bakom
    // det. En mjuk skugga tätt under foten håller det på skivan, också utan
    // skuggkarta (rum-gpu.js).
    const fot = tex(256, 96, (c, w, h) => {
      c.shadowColor = 'rgba(0,0,0,.7)';
      c.shadowBlur = 14;
      c.shadowOffsetY = 1000;
      c.fillRect(28, 26 - 1000, w - 56, h - 52);
    });
    const ks = new THREE.Mesh(new THREE.PlaneGeometry(200, 75), new THREE.MeshBasicMaterial({ map: fot, transparent: true, depthWrite: false }));
    ks.rotation.x = -90 * DEG;
    ks.position.set(-1, 0.4, 0);
    g.add(ks);
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
    // skylten står i en skåra i bakstyckets överkant, med kartongen grå baktill
    const sk = { w: 150, h: 64 };
    const skylt = mesh(new THREE.BoxGeometry(sk.w, sk.h, 1.2), [
      ...Array(4).fill(mat('#a9532f', { roughness: 0.8 })),
      mat('#fff', { map: tex(600, 256, skylten), roughness: 0.6 }),
      mat('#9a8f7c', { roughness: 0.9 }),
    ], g);
    skylt.position.set(-18, 142 + sk.h / 2 - 5, -15);
    // kupongerna har smala kupongens mått (420 × 620)
    const kup = mat('#fff', { map: tex(LATT ? 280 : 420, LATT ? 413 : 620, blankett), roughness: 0.85, side: THREE.DoubleSide });
    const KH = 122;
    const kuponger = [[-20, -9, -3], [-16, -6, 2], [-18, -3, 0]].map(([x, z, rz], i) => {
      const m = mesh(new THREE.PlaneGeometry((KH * 420) / 620, KH), kup, g);
      m.position.set(x, 66 + i * 2, z);
      m.rotation.set(-10 * DEG, 0, rz * DEG);
      return m;
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

    // Länken över stället (knappen, som uret): rutan kring kupongerna, skylten
    // och bakstycket i bild, i planets px. Ett klick tar en kupong för nästa
    // omgång i handen (go och openStall i rum.js), och duken lyser när man pekar.
    g.updateMatrixWorld(true);
    const ram = new THREE.Box3();
    for (const m of [skylt, ...kuponger]) ram.expandByObject(m);
    ram.expandByPoint(new THREE.Vector3(-77, 6, 15).applyMatrix4(g.matrixWorld));
    ram.expandByPoint(new THREE.Vector3(41, 6, 15).applyMatrix4(g.matrixWorld));
    const { box } = BITAR.stall;
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i < 8; i++) {
      const v = new THREE.Vector3(i & 1 ? ram.max.x : ram.min.x, i & 2 ? ram.max.y : ram.min.y, i & 4 ? ram.max.z : ram.min.z).project(b.cam);
      const px = box.x + ((v.x + 1) / 2) * box.w;
      const py = box.y + ((1 - v.y) / 2) * box.h;
      x0 = Math.min(x0, px);
      x1 = Math.max(x1, px);
      y0 = Math.min(y0, py);
      y1 = Math.max(y1, py);
    }
    const lank = document.createElement('a');
    lank.className = 'rum-stall rum-sak';
    lank.id = 'rum-stall';
    lank.setAttribute('role', 'button');
    lank.tabIndex = 0;
    lank.setAttribute('aria-label', 'Nästa omgång');
    Object.assign(lank.style, { left: `${Math.floor(x0)}px`, top: `${Math.floor(y0)}px`, width: `${Math.ceil(x1 - x0)}px`, height: `${Math.ceil(y1 - y0)}px` });
    planes[0].append(lank);
  }

  // ---------- skivan med löpsedlarna ----------

  // Plywood i två kedjor: så här sätter den upp det som har hand om det.
  // Sedlarna är knappar ovanpå (rum-affischer.js), med skivans framsida i deras
  // plan, och en Dymo-remsa under varje sedel. Skivan är färdig: inga
  // blyertsmått och inget vattenpass. Skuggorna under sedlarna och på glaset är
  // bakade, så att sedlarna inte behöver något filter och det ser likadant ut
  // utan skuggkarta.
  function skiva(b) {
    const { x, y, w, h, sedel, rader } = SKIVA;
    const D = 6;
    // på glaset bakom
    for (const [dx, dy, o] of [[1.6, 2.2, 0.26], [3.4, 4.6, 0.24]]) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: o, depthWrite: false }));
      s.position.set(x + w / 2 + dx, -(y + h / 2 + dy), -D - 1);
      b.scene.add(s);
    }
    // björken, med ådringen på längden
    const ply = tex(512, 512, (c, W, H) => {
      c.fillStyle = '#ad8e5e';
      c.fillRect(0, 0, W, H);
      for (let i = 0; i < 260; i++) {
        c.strokeStyle = `rgba(${hash(i) < 0.7 ? '70,44,18' : '235,214,170'},${0.03 + hash(i + 0.1) * 0.08})`;
        c.lineWidth = 0.6 + hash(i + 0.2) * 2.4;
        const yy = hash(i + 0.3) * H, d = (hash(i + 0.4) - 0.5) * 18;
        c.beginPath();
        c.moveTo(0, yy);
        c.bezierCurveTo(W * 0.3, yy + d, W * 0.7, yy - d, W, yy + (hash(i + 0.5) - 0.5) * 8);
        c.stroke();
      }
    });
    ply.wrapT = THREE.MirroredRepeatWrapping;
    ply.repeat.set(1, h / w);
    const kant = mat('#c7ab7b', { roughness: 0.7 });
    b.mesh(new THREE.BoxGeometry(w, h, D), [kant, kant, kant, kant, mat('#fff', { map: ply, roughness: 0.74, envMapIntensity: 0.8 }), kant]).position.set(x + w / 2, -(y + h / 2), -D / 2);
    // skuggorna under sedlarna, på framsidan
    const SK = 3;
    const rit = tex(w * SK, h * SK, (c) => {
      c.scale(SK, SK);
      c.translate(-x, -y);
      c.shadowColor = 'rgba(24,12,0,.62)';
      c.shadowBlur = 2.2 * SK;
      c.shadowOffsetX = 0.45 * SK;
      c.shadowOffsetY = 0.9 * SK;
      for (const r of rader) c.fillRect(r.x, r.y, sedel.w, sedel.h);
      // bara skuggan: genom revan i GP:s underkant syns skivan
      c.shadowColor = 'transparent';
      c.globalCompositeOperation = 'destination-out';
      for (const r of rader) c.fillRect(r.x, r.y, sedel.w, sedel.h);
    });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: rit, transparent: true, depthWrite: false }));
    f.position.set(x + w / 2, -(y + h / 2), 0.02);
    b.scene.add(f);
    // remsorna: vita versaler präglade i svart plast
    for (const r of rader) {
      const px = 16, fs = 4.2, rh = 6.8;
      const font = `700 ${fs * px}px "Helvetica Neue", Arial, sans-serif`;
      const ls = `${fs * px * 0.14}px`;
      const m = document.createElement('canvas').getContext('2d');
      m.font = font;
      m.letterSpacing = ls;
      const rw = m.measureText(r.text).width / px + fs * 1.1;
      const t = tex(Math.ceil(rw * px), Math.ceil(rh * px), (c, W, H) => {
        c.fillStyle = '#121212';
        c.fillRect(0, 0, W, H);
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(255,255,255,.14)');
        g.addColorStop(0.5, 'rgba(255,255,255,.02)');
        g.addColorStop(1, 'rgba(0,0,0,.25)');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        c.font = font;
        c.letterSpacing = ls;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = 'rgba(0,0,0,.6)';
        c.fillText(r.text, W / 2 + 1, H / 2 + 2.5);
        c.fillStyle = '#f3f1e8';
        c.fillText(r.text, W / 2, H / 2 + 1.5);
      });
      b.mesh(new RB(rw, rh, 0.5, 1, 0.12), mat('#fff', { map: t, roughness: 0.42, envMapIntensity: 0.3 })).position.set(r.x + sedel.w / 2, -(r.y + sedel.h + 3 + rh / 2), 0.25);
    }
    // kedjorna, från en plåt med en skruv på skivan upp till karmen
    const zink = mat('#c9c8bd', { metalness: 0.9, roughness: 0.34, envMapIntensity: 1 });
    const lank = new THREE.TorusGeometry(2.1, 0.5, 8, 16);
    for (const kx of [x + 26, x + w - 26]) {
      let i = 0;
      for (let ky = 138; ky < y + 3; ky += 5.4, i++) {
        const l = b.mesh(lank, zink);
        l.scale.set(0.72, 1.24, 1);
        l.position.set(kx, -ky, 2);
        l.rotation.y = i % 2 ? 90 * DEG : 0;
      }
      b.mesh(new RB(6.4, 7.5, 1.6, 2, 0.5), zink).position.set(kx, -(y + 1.75), 0.8);
      const s = b.mesh(new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), zink);
      s.rotation.x = 90 * DEG;
      s.scale.set(1, 0.42, 1);
      s.position.set(kx, -(y + 2), 1.6);
    }
  }

  // ---------- bladet vid radion ----------
  // Ett blad som har rivits ur ett spiralblock och tejpats rakt på väggen bredvid radion med två korta
  // bitar gulnad tejp över överkanten: halva spiralhål överst, blå linjer och röd marginal, vikt en gång på
  // mitten, och nedtill står det ut en aning från väggen. Radions stationer står där för hand (KANALER och rad i
  // rum-radio.js) i en spalt: FM i blått och under det AM i rött, varje band med sin rubrik och frekvenserna
  // under varandra, och den station som hörs ringas in med samma penna (nu). Papperet har samma struktur som allt papper på sajten (rum/papper.webp), fibrer och en
  // kaffering, och ritas en gång. rader() ger raderna som andelar av duken, så att rum-radio.js kan lägga
  // knappar över dem nära radion.
  function radiolapp(b) {
    const RR = window.RumRadio;
    if (!RR || !RR.KANALER || !RR.rad) return null;
    // bladet i bakväggens bild (EW × EH, och raderna i samma enheter), och i 3D på djupet Z
    const EW = LAPP.w;
    const EH = LAPP.h;
    const Z = WZ + 0.6;
    const s = 1000 / (1000 - Z);
    const W = EW / s;
    const H = EH / s;
    // Uppställningen, en rad per linje: bandets rubrik och dess stationer, och en tom rad mellan banden.
    // Raderna står på linjerna (j: linjen, räknat från TOPP), och linjerna står så tätt som stationerna kräver.
    const PLAN = [];
    for (const band of ['fm', 'am']) {
      const st = RR.KANALER.filter((k) => k.band === band);
      if (!st.length) continue;
      const j0 = PLAN.length ? PLAN[PLAN.length - 1].j + 2 : 0;
      PLAN.push({ band, j: j0 });
      st.forEach((k, i) => PLAN.push({ band, k, j: j0 + 1 + i }));
    }
    const TOPP = 4.4;
    const RAD = Math.min(2.4, (EH - TOPP - 1.6) / Math.max(1, PLAN[PLAN.length - 1].j));
    // marginalen, frekvensernas högerkant (FX, efter den bredaste) och namnen efter dem
    const MARG = 2.2;
    const KOL = MARG + 0.5;
    const BLAK = { fm: '#1b2c84', am: '#a11d1d' };
    const TW = LATT ? 720 : 1080;
    const TH = Math.round((TW * EH) / EW);
    const rader = [];
    // (fibrerna är desamma varje gång)
    let fro = 7;
    const slump = () => { fro = (fro * 16807) % 2147483647; return fro / 2147483647; };
    let korn = null;
    function rita(c, w, h) {
      const u = w / EW;
      fro = 7;
      rader.length = 0;
      c.clearRect(0, 0, w, h);
      c.save();
      // riven ur spiralen: halva hål och fransar längs överkanten
      const form = new Path2D();
      const y0 = 1.15 * u;
      form.moveTo(0, y0);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const cx = (i + 0.5) * (w / n);
        const r = 0.44 * u;
        form.lineTo(cx - r - 0.12 * u * hash(i), y0 + 0.08 * u * hash(i + 3));
        form.arc(cx, y0 - 0.15 * u, r, Math.PI * 0.95, Math.PI * 0.05, true);
        form.lineTo(cx + r + 0.3 * u * hash(i + 7), y0 - 0.1 * u * hash(i + 11));
      }
      form.lineTo(w, y0);
      form.lineTo(w, h);
      form.lineTo(0, h);
      form.closePath();
      c.clip(form);
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f8f7f2');
      g.addColorStop(0.25, '#f2f0e9');
      g.addColorStop(1, '#eeebe2');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      if (korn) {
        c.globalCompositeOperation = 'multiply';
        c.globalAlpha = 0.55;
        const t = 12 * u;
        for (let y = 0; y < h; y += t) for (let x = 0; x < w; x += t) c.drawImage(korn, x, y, t, t);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      }
      // fibrer, och moln i massan
      c.lineCap = 'round';
      c.lineWidth = Math.max(0.6, 0.035 * u);
      for (let i = 0; i < 900; i++) {
        const x = slump() * w;
        const y = slump() * h;
        const l = (0.2 + 0.8 * slump()) * u;
        const a = slump() * Math.PI;
        c.strokeStyle = slump() < 0.5 ? `rgba(110,95,70,${(0.04 + 0.05 * slump()).toFixed(3)})` : `rgba(255,255,255,${(0.1 + 0.15 * slump()).toFixed(3)})`;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + l * 0.5 * Math.cos(a + 0.6), y + l * 0.5 * Math.sin(a + 0.6), x + l * Math.cos(a), y + l * Math.sin(a));
        c.stroke();
      }
      for (let i = 0; i < 16; i++) {
        const x = slump() * w;
        const y = slump() * h;
        const r = (3 + 6 * slump()) * u;
        const m = c.createRadialGradient(x, y, 0, x, y, r);
        m.addColorStop(0, slump() < 0.5 ? 'rgba(255,255,252,0.08)' : 'rgba(150,125,80,0.05)');
        m.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = m;
        c.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      // linjerna och marginalen
      c.strokeStyle = 'rgba(84,130,200,0.42)';
      c.lineWidth = Math.max(1, 0.07 * u);
      for (let j = 0; TOPP + j * RAD < EH - 0.4; j++) {
        const y = (TOPP + j * RAD - 0.12) * u;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }
      c.strokeStyle = 'rgba(214,90,90,0.55)';
      c.lineWidth = Math.max(1, 0.08 * u);
      c.beginPath();
      c.moveTo(MARG * u, 1.5 * u);
      c.lineTo(MARG * u, h);
      c.stroke();
      // vikningen, och en kaffering som nästan har torkat bort
      const vy = h * 0.52;
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fillRect(0, vy - 0.1 * u, w, 0.08 * u);
      c.fillStyle = 'rgba(90,80,60,0.16)';
      c.fillRect(0, vy, w, 0.1 * u);
      c.strokeStyle = 'rgba(120,70,20,0.1)';
      c.lineWidth = 0.35 * u;
      c.beginPath();
      c.ellipse(w * 0.9, h * 0.94, 4.2 * u, 4 * u, 0.2, Math.PI * 0.95, Math.PI * 1.75);
      c.stroke();
      // handstilen: lite mer bläck där pennan tar i, och varje rad lite olika (→ bredden)
      const skriv = (txt, x, y, px, farg, max, i) => {
        c.save();
        c.translate(x, y + (hash(i * 4.1) - 0.5) * 0.14 * u);
        c.rotate((hash(i * 2.9) - 0.5) * 0.02);
        c.font = `700 ${px}px Caveat, cursive`;
        const bb = c.measureText(txt).width;
        const k = max && bb > max ? max / bb : 1;
        c.scale(k, 1);
        c.fillStyle = farg;
        c.globalAlpha = 0.9;
        c.fillText(txt, 0, 0);
        c.globalAlpha = 0.25;
        c.fillText(txt, 0.03 * u, 0.02 * u);
        c.restore();
        return bb * k;
      };
      const fs = RAD * 0.86 * u;
      c.font = `700 ${fs}px Caveat, cursive`;
      const FX = KOL + Math.max(...PLAN.filter((x) => x.k).map((x) => c.measureText(RR.rad(x.k)[0]).width)) / u;
      const NX = FX + 0.7;
      for (const x of PLAN) {
        const farg = BLAK[x.band];
        const linje = TOPP + x.j * RAD;
        const bas = linje - 0.3;
        if (!x.k) {
          // rubriken: bandet stort, enheten liten efter det, och ett streck under
          const B0 = RR.BAND[x.band];
          const n = x.band === 'fm' ? 90 : 91;
          const bb = skriv(B0.namn, KOL * u, bas * u, RAD * 1.45 * u, farg, 0, n);
          skriv(B0.enhet, (KOL + bb / u + 0.45) * u, (bas - 0.05) * u, RAD * 0.72 * u, farg, 0, n + 5);
          c.strokeStyle = farg;
          c.globalAlpha = 0.8;
          c.lineWidth = 0.13 * u;
          c.beginPath();
          c.moveTo(KOL * u, (linje + 0.05) * u);
          c.quadraticCurveTo((KOL + bb / u * 0.6) * u, (linje + 0.25) * u, (KOL + bb / u + 0.4) * u, linje * u);
          c.stroke();
          c.globalAlpha = 1;
          continue;
        }
        const [f, namn] = RR.rad(x.k);
        c.font = `700 ${fs}px Caveat, cursive`;
        const fw = c.measureText(f).width;
        skriv(f, FX * u - fw, bas * u, fs, farg, 0, x.j * 3);
        const nb = skriv(namn, NX * u, bas * u, fs, farg, (EW - NX - 0.8) * u, x.j * 3 + 1);
        rader.push({ id: x.k.id, band: x.band, x0: KOL, x1: EW - 0.6, topp: linje - RAD, ned: linje, bas, fran: FX - fw / u, slut: NX + nb / u });
      }
      // kanterna lite mörkare, som ljuset faller
      const v = c.createRadialGradient(w / 2, h * 0.4, Math.min(w, h) * 0.3, w / 2, h * 0.45, Math.max(w, h) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(60,40,10,0.12)');
      c.fillStyle = v;
      c.fillRect(0, 0, w, h);
      c.restore();
    }
    const karta = tex(TW, TH, rita);
    // papperets struktur, när den har laddats
    const bild = new Image();
    // (och handstilen: utan den mäts raderna i reservtypsnittet)
    const hand = document.fonts ? document.fonts.load('700 40px Caveat').catch(() => {}) : Promise.resolve();
    bild.onload = () => hand.then(() => {
      korn = bild;
      rita(karta.image.getContext('2d'), TW, TH);
      karta.needsUpdate = true;
      // (raderna mättes kanske i reservtypsnittet förra gången: ringen ritas om efter dem)
      const id = nuId;
      nuId = '';
      nu(id);
      b.paint();
    });
    bild.src = 'rum/papper.webp';
    // ytan: små ojämnheter som fångar ljuset
    const ytan = tex(128, 128, (c, w, h) => {
      const d = c.createImageData(w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const x = 128 + (slump() - 0.5) * 90;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = x;
        d.data[i + 3] = 255;
      }
      c.putImageData(d, 0, 0);
    });
    ytan.wrapS = ytan.wrapT = THREE.RepeatWrapping;
    ytan.repeat.set(EW / 6, EH / 6);
    // Böjen (x, y: 0–1 från övre vänstra hörnet): överst håller tejpen bladet mot väggen, och längre ned
    // står det ut en aning, jämnt över bredden, med vikningen som en svag rygg. Bladet ligger plant nog
    // att se uppsatt ut: inget hörn som rullar sig.
    const bojd = (x, y) => 0.45 * Math.max(0, (y - 0.12) / 0.88) ** 1.6
      + 0.12 * Math.sin(Math.PI * x) * Math.sin(Math.PI * Math.min(1, y * 1.1))
      + 0.18 * Math.max(0, 1 - Math.abs(y - 0.52) / 0.4) - 0.3
      + 0.03 * Math.sin(x * 9 + y * 5);
    const geo = new THREE.PlaneGeometry(W, H, 24, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, bojd(pos.getX(i) / W + 0.5, 0.5 - pos.getY(i) / H));
    geo.computeVertexNormals();
    const papp = mat('#ffffff', { map: karta, bumpMap: ytan, bumpScale: 0.5, roughness: 0.9, sheen: 0.3, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide, alphaTest: 0.5, envMapIntensity: 0.35 });
    const grupp = new THREE.Group();
    grupp.position.set(760 + (LAPP.x + LAPP.w / 2 - 760) / s, -(400 + (LAPP.y + LAPP.h / 2 - 400) / s), Z);
    grupp.rotation.z = 0.006;
    b.scene.add(grupp);
    const blad = new THREE.Mesh(geo, papp);
    grupp.add(blad);
    // skuggan på väggen: tät och nära överst, där tejpen håller, och lite mjukare nedtill, där bladet står
    // ut (ritad, så att den också finns utan skuggkarta)
    const skugga = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.3, H * 1.24), new THREE.MeshBasicMaterial({
      map: tex(128, 160, (c, w, h) => {
        const sx = w / 1.3;
        const sy = h / 1.24;
        const x0 = (w - sx) / 2 - 4 * w;
        const y0 = (h - sy) / 2;
        c.shadowOffsetX = 4 * w;
        c.shadowColor = 'rgba(0,0,0,0.45)';
        c.shadowBlur = 3;
        c.fillRect(x0, y0 + sy * 0.02, sx, sy * 0.98);
        c.shadowColor = 'rgba(0,0,0,0.4)';
        c.shadowBlur = 7;
        c.fillRect(x0 + sx * 0.02, y0 + sy * 0.5, sx * 0.98, sy * 0.52);
      }),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }));
    skugga.position.set(0.25, -0.45, -0.5);
    grupp.add(skugga);
    // tejpen: två korta bitar över överkanten, en en bit in från vart hörn, nästan raka – halva på bladet
    // och halva på väggen ovanför, och inget som sticker ut åt sidorna
    const tejpMat = mat('#ffffff', {
      map: tex(128, 48, (c, w, h) => {
        c.fillStyle = 'rgba(236,222,170,0.62)';
        c.beginPath();
        c.moveTo(0, 2);
        for (let i = 0; i <= 6; i++) c.lineTo(3 * hash(i), (h / 6) * i);
        c.lineTo(w - 3 * hash(9), h);
        for (let i = 6; i >= 0; i--) c.lineTo(w - 3 * hash(i + 4), (h / 6) * i);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.14)';
        c.fillRect(0, h * 0.2, w, h * 0.12);
      }),
      transparent: true,
      roughness: 0.38,
      clearcoat: 0.6,
      depthWrite: false,
      envMapIntensity: 0.6,
    });
    for (const [x, y, r] of [[-W / 2 + 3.6, H / 2 - 0.15, 0.07], [W / 2 - 3.6, H / 2 - 0.05, -0.05]]) {
      // (de rivna ändarna uppåt och nedåt)
      const t = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), tejpMat);
      t.position.set(x, y, -0.2);
      t.rotation.z = Math.PI / 2 + r;
      grupp.add(t);
    }
    // ringen kring den station som hörs: ett pennstreck runt raden som går lite om sig själv
    const ringMat = {
      fm: mat(BLAK.fm, { roughness: 0.7, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
      am: mat(BLAK.am, { roughness: 0.7, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
    };
    const ring = new THREE.Mesh(new THREE.BufferGeometry(), ringMat.fm);
    ring.renderOrder = 3;
    ring.visible = false;
    grupp.add(ring);
    const lokal = (ex, ey, dz = 0) => [(ex / EW - 0.5) * W, (0.5 - ey / EH) * H, bojd(ex / EW, ey / EH) + dz];
    let nuId = '';
    function nu(id) {
      id = id || '';
      if (id === nuId) return false;
      nuId = id;
      const r = rader.find((x) => x.id === id);
      ring.visible = Boolean(r);
      if (!r) return true;
      const cx = (r.fran + r.slut) / 2 + 0.1;
      const cy = r.bas - RAD * 0.29;
      const a = (r.slut - r.fran) / 2 + 1.2;
      const bb = RAD * 0.64;
      const N = 72;
      const p = [];
      const ix = [];
      // (lite fylligare än en ellips i ändarna, så att höga bokstäver som l och k ryms)
      const fyll = (v) => Math.sign(v) * Math.abs(v) ** 0.8;
      const pt = (t) => {
        const th = Math.PI * 0.9 + t * Math.PI * 2.15;
        return [cx + a * fyll(Math.cos(th)) * (1 + 0.02 * Math.sin(t * 11)), cy + bb * fyll(Math.sin(th)) - 0.025 * a * Math.cos(th)];
      };
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const [x, y] = pt(t);
        const [x1, y1] = pt(Math.min(1, t + 0.004));
        const [x2, y2] = pt(Math.max(0, t - 0.004));
        const l = Math.hypot(x1 - x2, y1 - y2) || 1;
        // (tunnare i ändarna, där pennan sätts i och lyfts)
        const b2 = 0.07 * (0.55 + 0.45 * Math.sin(Math.PI * t));
        const nx = (-(y1 - y2) / l) * b2;
        const ny = ((x1 - x2) / l) * b2;
        p.push(...lokal(x + nx, y + ny, 0.15), ...lokal(x - nx, y - ny, 0.15));
        if (i) ix.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setIndex(ix);
      g.computeVertexNormals();
      ring.geometry.dispose();
      ring.geometry = g;
      ring.material = ringMat[r.band];
      return true;
    }
    // raderna och bladet som andelar av duken ([vänster, topp, höger, botten])
    const v = new THREE.Vector3();
    const ut = (ex, ey) => {
      v.set(...lokal(ex, ey)).applyMatrix4(blad.matrixWorld).project(b.cam);
      return [(v.x + 1) / 2, (1 - v.y) / 2];
    };
    const ruta = (x0, y0, x1, y1) => {
      const q = [ut(x0, y0), ut(x1, y0), ut(x0, y1), ut(x1, y1)];
      return [Math.min(...q.map((x) => x[0])), Math.min(...q.map((x) => x[1])), Math.max(...q.map((x) => x[0])), Math.max(...q.map((x) => x[1]))];
    };
    const mats = [papp, tejpMat, ringMat.fm, ringMat.am];
    for (const m of mats) m.userData.dag = m.color.clone();
    // (radion kan redan spela)
    const nu0 = RR.lage ? RR.lage() : null;
    if (nu0 && nu0.band !== 'av' && nu0.kanal) nu(nu0.kanal);
    return {
      rader: () => { grupp.updateMatrixWorld(true); return rader.map((r) => ({ id: r.id, r: ruta(r.x0 - 0.5, r.topp, r.x1, r.ned) })); },
      sida: () => { grupp.updateMatrixWorld(true); return ruta(0, 1, EW, EH); },
      nu,
      // en rad i bladets höjd
      rad: RAD / EH,
      mats,
    };
  }

  // ---------- allt ----------

  // knappen kring uret: ett klick går fram till det (närbilden i rum.js)
  const knapp = document.createElement('button');
  knapp.type = 'button';
  knapp.className = 'rum-ur rum-sak';
  knapp.dataset.sak = 'ur';
  knapp.setAttribute('aria-label', 'Uret');
  planes[0].append(knapp);
  // knappen kring bladet vid radion: ett klick går fram till det (SAKER.radiolapp i rum.js)
  const lappKnapp = window.RumRadio && window.RumRadio.rad ? document.createElement('button') : null;
  if (lappKnapp) {
    lappKnapp.type = 'button';
    lappKnapp.className = 'rum-radiolapp rum-sak';
    lappKnapp.dataset.sak = 'radiolapp';
    lappKnapp.setAttribute('aria-label', 'Lappen med radiostationerna');
    Object.assign(lappKnapp.style, { left: `${LAPP.x}px`, top: `${LAPP.y}px`, width: `${LAPP.w}px`, height: `${LAPP.h}px` });
    planes[0].append(lappKnapp);
  }
  skivPlats(planes[0]);
  const B = {};
  for (const [k, { box, i }] of Object.entries(BITAR)) {
    if (k === 'radiolapp' && !lappKnapp) continue;
    // uret och ramen ligger i knappen och länken, så att de lyser när man pekar på dem
    B[k] = bit(k, wallCam(box), i ? el.querySelector(i) : null);
    // (bladet vid radion har sin skugga ritad)
    wallLights(B[k], box, !['tak', 'neon', 'radiolapp'].includes(k));
  }
  lysror(B.tak);
  malat(B.tak);
  stangt(B.tak);
  neon(B.neon, B.tak);
  const { visare, kvar } = ur(B.ur);
  backWall(B.ur);
  const skylt = ram(B.ram);
  backWall(B.ram);
  paket(B.hogra);
  wallRing(B.hogra, ...opt.vagg.skar, 5, mat('#c6c8c8', { metalness: 0.4, roughness: 0.45 }), 4);
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
  wallRing(B.hogra, ...opt.vagg.kork, 5, mat('#fff', { map: ved, roughness: 0.55 }));
  rightWall(B.hogra);
  stall(B.stall);
  bardisk(B.disk);
  skiva(B.skiva);
  const LP = B.radiolapp ? radiolapp(B.radiolapp) : null;

  // Uret går efter Stockholms tid, med samma klocka som utsikten (Vader.nu()
  // i vader.js, annars datorns klocka). Med ?rum-t står det på den tid det
  // visade först, och den klockan står då still (på ?rum-klocka, annars när
  // sidan laddades).
  const fUr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  let off = null;
  let sekund = null;
  let senast = null;
  let spelstopp = null;
  function tick() {
    if (sekund != null && opt.still && opt.still()) return;
    if (off == null) off = window.Vader ? Vader.nu().t - Date.now() : 0;
    const ms = Date.now() + off;
    const s = Math.floor(ms / 1000);
    if (s === sekund) return;
    sekund = s;
    senast = ms;
    const p = {};
    for (const x of fUr.formatToParts(new Date(ms))) p[x.type] = +x.value;
    visare(p.hour, p.minute, p.second);
    kvar(ms, spelstopp);
    B.ur.paint();
  }
  // spelstoppet (ms) eller null; med ?rum-klocka jämförs det med urets tid
  function stopp(ms) {
    ms = ms || null;
    if (ms === spelstopp) return;
    spelstopp = ms;
    if (senast == null) return;
    kvar(senast, spelstopp);
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
  // En sak i taget, med grafikprogrammen byggda i bakgrunden och en paus emellan:
  // allt på en gång höll huvudtråden medan grafikkortet arbetade, och rummet svarade
  // inte på fingret så länge.
  const paus = () => new Promise((r) => setTimeout(r));
  for (const k of ['ram', 'ur', 'tak', 'neon', 'hogra', 'skiva', 'stall', 'disk', 'radiolapp']) {
    if (!B[k]) continue;
    try {
      await gl.compileAsync(B[k].scene, B[k].cam);
    } catch (err) { /* då byggs de när saken ritas */ }
    if (k === 'ram') setNamn('');
    else if (k === 'ur') tick();
    else B[k].paint();
    await paus();
  }
  // skivans material, för natten: gatan lyser in bakom den, och framsidan ligger i skugga
  const skivMat = new Set();
  B.skiva.scene.traverse((x) => {
    if (x.isMesh && !x.material.isMeshBasicMaterial && !x.material.isShadowMaterial) for (const m of [x.material].flat()) skivMat.add(m);
  });
  for (const m of skivMat) m.userData.dag = m.color.clone();
  // (hur släckt lysröret är, 0–1: rören grånar och väggen och skivan mörknar i takt)
  let morkt = 0;
  function natt(g) {
    g = typeof g === 'number' ? Math.max(0, Math.min(1, g)) : g ? 1 : 0;
    if (g === morkt) return;
    morkt = g;
    rorLjus.color.set(ROR.ljus).lerp(new THREE.Color(ROR.av), g);
    rorRefl.color.set(ROR.refl).lerp(new THREE.Color(ROR.reflAv), g);
    malMat.color.copy(malMat.userData.dag).multiplyScalar(1 - 0.6 * g);
    B.tak.paint();
    for (const m of skivMat) m.color.copy(m.userData.dag).multiplyScalar(1 - 0.6 * g);
    B.skiva.paint();
    if (LP) {
      for (const m of LP.mats) m.color.copy(m.userData.dag).multiplyScalar(1 - 0.6 * g);
      B.radiolapp.paint();
    }
  }
  // (k: en duk eller flera, som skivan och bladet vid radion)
  const skarp = (k, px) => { for (const n of [].concat(k)) if (B[n]) B[n].skarp(px); };
  // bladet vid radion (rum-radio.js): raderna och bladet som andelar av duken, ringen kring den station
  // som hörs, och hur hög en rad är i bladet
  const lapp = LP && {
    canvas: B.radiolapp.canvas,
    rader: LP.rader,
    sida: LP.sida,
    rad: LP.rad,
    nu(id) { if (LP.nu(id)) B.radiolapp.paint(); },
  };
  return { draw: tick, namn: setNamn, skarp, natt, stopp, lapp };
}
