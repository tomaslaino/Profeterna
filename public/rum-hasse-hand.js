// Hasse Backes hand och kaffe på pulten i tobaksaffären (rum-hasse.js), i three.js: handen ligger längst ut
// till vänster, med manschetten, och armen kommer in från bildens vänstra kant. Till höger om fingrarna står
// koppen på sitt fat, och fatet står på notan (rum.js), som i baren. Det är en ledtråd: han sitter i baren
// utanför bilden (rum-hasse-3d.js). Duken är en liten i pultens plan och ritas bara när fingrarna trummar.
//
// Armen, handen och koppen är figurens (rum-hasse-arm.js), och världen och kameran likaså, så att koppen
// ses från samma håll och i samma ljus som handen och är samma kopp som i baren.
//
// armen(plan, { hand, kopp, pr }) → { placera(), trumma(), knapp(el), borta() }
// hand: var handleden vilar, kopp: fatets mitt, i rummets mått (1600 × 1000)
import * as THREE from 'three';
import { ARM, KAMERA, byggArm, byggKopp, laddaFoto, laddaHand } from './rum-hasse-arm.js';

const DEG = Math.PI / 180;
const D = KAMERA.CZ;
const CY = KAMERA.CY;

// hur böjd handen är mot armen (grader)
const BOJ = -6;
// lutningen på pultens plan mot figurens kamera (handen ska ses uppifrån, som allt på
// pulten), och hur krökta fingrarna är
const LUT = 52 * DEG;
const KROK = 0.02;
const { LA, LB } = ARM;
const TUMME = 0.45;
// en mjuk skugga som färdig fläck
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

// Handens egen kamera: ett fönster där pulten ses snett uppifrån, oberoende av det riktiga fönstret.
function matt() {
  const L = { W: 1440, H: 900, S: 0.54, px: 530, py: 244.7 };
  const k = 1.15;
  return { W: L.W, H: L.H, k, tx: L.W * 0.31 - L.px * k, ty: 20 - 113 * k, L };
}

export async function armen(plan, { hand: HAND, kopp: KOPP, pr = 1.5 }) {
  const [foto, modell] = await Promise.all([laddaFoto(), laddaHand()]);
  const c = document.createElement('canvas');
  c.className = 'rum-hasse-hand';
  // (över notan: fatet står på den)
  const kaffe = plan.querySelector('#rum-hasse');
  if (kaffe) kaffe.after(c); else plan.append(c);
  // (bilden behålls: ligger duken utanför bilden när den ritas, som i telefonen på höjden, kan Chrome
  // annars visa en tom duk när den kommer in i bilden)
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: true });
  r.setClearColor(0, 0);
  const S = new THREE.Scene();
  const A = byggArm(S, -1, foto, modell);
  A.del('under');
  // skuggorna: färdiga fläckar
  const tex = flack();
  const skugga = () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, opacity: 0.8, transparent: true, depthWrite: false, depthTest: false }));
    m.renderOrder = -1;
    S.add(m);
    return m;
  };
  const hs = skugga();
  const as = skugga();
  // Koppen på sitt fat, samma som i baren: den står upprätt i en egen värld med figurens ljus och ses av
  // en egen kamera (koppKamera), så att den lyses som i baren.
  const S2 = new THREE.Scene();
  const K = byggKopp();
  S2.add(K.kopp, K.fat);
  const fs = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, opacity: 0.85, transparent: true, depthWrite: false, depthTest: false }));
  fs.renderOrder = -1;
  S2.add(fs);
  const cam2 = new THREE.PerspectiveCamera(10, 1, 200, 30000);
  // (en liten hand ligger långt bort i figurens värld: den bortre gränsen räcker för det)
  const cam = new THREE.PerspectiveCamera(30, 1, 200, 30000);
  cam.position.set(0, CY, D);
  cam.lookAt(0, CY, 0);
  // båda bilderna på duken: handen, och koppen ovanpå
  r.autoClear = false;
  function rita() {
    r.clear();
    r.render(S, cam);
    r.clearDepth();
    r.render(S2, cam2);
  }

  // Handens fönster och figurens kamera, beskuren till duken.
  const V = { W: 1, H: 1, M: 1, ppx: 0, ppy: 0 };
  function kamera(crop) {
    const m = matt();
    V.W = m.W;
    V.H = m.H;
    V.M = m.k * m.L.S;
    V.ppx = m.tx + m.k * m.L.px;
    V.ppy = m.ty + m.k * m.L.py;
    cam.fov = 2 * Math.atan((m.H / V.M / 2) / D) / DEG;
    cam.aspect = m.W / m.H;
    cam.setViewOffset(m.W, m.H, m.W / 2 - V.ppx + crop[0], m.H / 2 - V.ppy + crop[1], crop[2], crop[3]);
    cam.updateMatrixWorld();
  }
  // en punkt i handens fönster, s bildpunkter på en enhet → figurens värld
  function ifran(x, y, s, ut) {
    return ut.set((x - V.ppx) / s, CY - (y - V.ppy) / s, D * (1 - V.M / s));
  }
  // figurens värld → handens fönster
  function iFonster(p) {
    const f = (V.M * D) / (D - p.z);
    return [V.ppx + p.x * f, V.ppy + (CY - p.y) * f];
  }
  // rummet i handens fönster: förstoringen och förskjutningen (placera)
  const R = { k: 1, ox: 0, oy: 0 };

  // ---------- i vila ----------

  // skala: rummets bildpunkter på en av figurens enheter, mot: en punkt i rummet som armen pekar mot
  // (ut ur bilden till vänster och lite mot en, mot baren där han sitter)
  const opt = { skala: 0.6, mot: [-400, 700] };
  const vila = { s: 1, W: new THREE.Vector3(), N: new THREE.Vector3(), F: new THREE.Vector3(), P: new THREE.Vector3(), D0: new THREE.Vector3() };
  const RH = new THREE.Vector3(1, 0, 0);
  let box = { x: 0, y: 0, w: 1, h: 1 };
  let knapp = null;
  const far = new THREE.Vector3();
  const vE = new THREE.Vector3();
  function ritaVila() {
    far.copy(vila.W).addScaledVector(vila.D0, LA + LB);
    vE.copy(vila.W).addScaledVector(vila.D0, LB);
    A.satt(far, vE, vila.W, vila.F, vila.P, KROK, 0, 0, TUMME);
    // (handen ska synas var den än är i världen)
    A.hand.mesh.visible = true;
    skuggor(vila.W, vila.F, vila.N, vila.D0);
    rita();
  }
  const m4 = new THREE.Matrix4();
  const sx = new THREE.Vector3();
  const sy = new THREE.Vector3();
  function skuggor(W, F, N, Dv) {
    hs.position.copy(W).addScaledVector(F, 130).addScaledVector(N, -30);
    sy.copy(F);
    sx.crossVectors(sy, N).normalize();
    sy.crossVectors(N, sx).normalize();
    m4.makeBasis(sx, sy, N);
    hs.quaternion.setFromRotationMatrix(m4);
    hs.scale.set(340, 420, 1);
    sy.copy(Dv);
    sx.crossVectors(sy, N).normalize();
    sy.crossVectors(N, sx).normalize();
    m4.makeBasis(sx, sy, N);
    as.quaternion.setFromRotationMatrix(m4);
    as.position.copy(W).addScaledVector(sy, 470).addScaledVector(N, -36).addScaledVector(sx, 14);
    as.scale.set(300, 1100, 1);
  }
  // Pultens plan som figurens kamera ser det, och armen och handen i det: armen åt vinkeln a
  // (grader, 0 = rakt åt vänster, positivt bort från en) och handen BOJ grader närmare en.
  const N = new THREE.Vector3(0, Math.cos(LUT), Math.sin(LUT));
  const AW = new THREE.Vector3(0, Math.sin(LUT), -Math.cos(LUT));
  function riktning(a) {
    vila.D0.copy(RH).multiplyScalar(-Math.cos(a * DEG)).addScaledVector(AW, Math.sin(a * DEG)).addScaledVector(N, 0.03).normalize();
    const h = -a - BOJ;
    vila.F.copy(RH).multiplyScalar(Math.cos(h * DEG)).addScaledVector(AW, Math.sin(h * DEG));
  }
  // Koppen står på pulten till höger om fingrarna, med örat åt höger och lite mot en som i baren. Den ses
  // KOPP_VY grader uppifrån och rakt framifrån, som allt annat på pulten: figurens kamera ser hörnet långt
  // från sin mitt, och där skulle en kopp luta. Den är lite mindre än i baren, där handen pekar mot en och
  // ser kortare ut; här ligger den i full längd bredvid. Fatets skugga faller bort från ljuset, som kommer
  // framifrån till vänster.
  const KOPP_VY = 44 * DEG;
  const KOPP_SKALA = 0.8;
  const KOPP_AVST = D;
  K.kopp.position.set(0, 11, 0);
  K.kopp.rotation.y = -0.5;
  K.fat.position.set(0, 0.5, 0);
  K.fat.rotation.y = -0.5;
  fs.rotation.x = -Math.PI / 2;
  fs.position.set(16, 0, -14);
  fs.scale.set(300, 290, 1);
  cam2.position.set(0, Math.sin(KOPP_VY), Math.cos(KOPP_VY)).multiplyScalar(KOPP_AVST);
  cam2.lookAt(0, 0, 0);
  // fatets mitt i handens fönster, och koppens kamera beskuren till duken som handens
  const KM = { x: 0, y: 0 };
  function koppKamera(crop) {
    const m = matt();
    KM.x = R.ox + KOPP.x * R.k;
    KM.y = R.oy + KOPP.y * R.k;
    const f = vila.s * KOPP_SKALA * KOPP_AVST;
    cam2.fov = (2 * Math.atan(m.H / 2 / f)) / DEG;
    cam2.aspect = m.W / m.H;
    cam2.setViewOffset(m.W, m.H, m.W / 2 - KM.x + crop[0], m.H / 2 - KM.y + crop[1], crop[2], crop[3]);
    cam2.updateMatrixWorld();
  }
  // koppens värld → rummets mått
  const C2F = new THREE.Vector3().copy(cam2.position).negate().normalize();
  const C2R = new THREE.Vector3(1, 0, 0);
  const C2U = new THREE.Vector3().crossVectors(C2R, C2F);
  const PK = new THREE.Vector3();
  function koppIRum(p) {
    PK.copy(p).sub(cam2.position);
    const z = PK.dot(C2F);
    const f = vila.s * KOPP_SKALA * KOPP_AVST;
    return [(KM.x + (f * PK.dot(C2R)) / z - R.ox) / R.k, (KM.y - (f * PK.dot(C2U)) / z - R.oy) / R.k];
  }
  // det koppen och fatet tar i rummet (fatets kant, koppens kant och örat)
  function koppRuta() {
    K.fat.updateMatrixWorld();
    K.kopp.updateMatrixWorld();
    const p = new THREE.Vector3();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [g, rr, h] of [[K.fat, 120, 0], [K.fat, 120, 28], [K.kopp, 64, 114], [K.kopp, 96, 62]]) for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const [x, y] = koppIRum(p.set(rr * Math.cos(a), h, rr * Math.sin(a)).applyMatrix4(g.matrixWorld));
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    return { x0, y0, x1, y1 };
  }
  // ångan ur koppen (rum.css) börjar vid kaffets yta
  function anga() {
    const a = kaffe && kaffe.querySelector('.anga');
    if (!a) return;
    const [x, y] = koppIRum(new THREE.Vector3(0, 96, 0).applyMatrix4(K.kopp.matrixWorld));
    Object.assign(a.style, { left: `${(x - kaffe.offsetLeft - 24).toFixed(1)}px`, top: `${(y - kaffe.offsetTop - 80).toFixed(1)}px` });
  }
  function placera() {
    kamera([0, 0, 1, 1]);
    const m = matt();
    // handens fönster lägger rummet så här (som rummet i ett fönster av den storleken)
    const k = Math.max(m.W / 1600, m.H / 1000);
    const ox = (m.W - 1600 * k) / 2;
    const oy = (m.H - 1000 * k) / 2;
    Object.assign(R, { k, ox, oy });
    const x = ox + HAND.x * k;
    const y = oy + HAND.y * k;
    vila.s = opt.skala * k;
    ifran(x, y, vila.s, vila.W);
    vila.N.copy(N);
    vila.P.copy(N).negate();
    // Armen pekar mot opt.mot i bilden: vinkeln som träffar dit, sökt i figurens värld.
    const mal = Math.atan2(oy + opt.mot[1] * k - y, ox + opt.mot[0] * k - x);
    const p = new THREE.Vector3();
    const fel = (a) => {
      riktning(a);
      const [qx, qy] = iFonster(p.copy(vila.W).addScaledVector(vila.D0, 200));
      let d = Math.atan2(qy - y, qx - x) - mal;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      return d;
    };
    let lo = -80;
    let hi = 80;
    const fl = fel(lo);
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (Math.sign(fel(mid)) === Math.sign(fl)) lo = mid; else hi = mid;
    }
    riktning((lo + hi) / 2);
    // (fatets mitt i fönstret, till rutan nedan)
    koppKamera([0, 0, 1, 1]);
    // duken i planet: från rummets vänstra kant (och lite till) till fingrarna och koppen med skuggan
    const fot = 390 * opt.skala;
    const kr = koppRuta();
    box = { x: Math.floor(Math.min(HAND.x - fot, -60)), y: Math.floor(Math.min(HAND.y - fot * 0.72, kr.y0 - 6)), w: 0, h: 0 };
    box.w = Math.ceil(Math.max(HAND.x + fot, kr.x1 + 24) - box.x);
    box.h = Math.ceil(Math.max(HAND.y + fot * 0.6, kr.y1 + 24) - box.y);
    Object.assign(c.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    r.setPixelRatio(pr);
    r.setSize(box.w, box.h, false);
    kamera([ox + box.x * k, oy + box.y * k, box.w * k, box.h * k]);
    koppKamera([ox + box.x * k, oy + box.y * k, box.w * k, box.h * k]);
    ritaVila();
    anga();
    // (koppen här ersätter den ritade i rummet, rum.css)
    if (kaffe) kaffe.classList.add('tre');
    c.classList.add('klar');
    // det man trycker på: handen och manschetten
    if (knapp) Object.assign(knapp.style, { left: `${HAND.x - 40}px`, top: `${HAND.y - fot * 0.5}px`, width: `${40 + fot * 0.8}px`, height: `${fot * 0.8}px` });
  }

  // ---------- fingrarna trummar: från lillfingret till pekfingret, två varv ----------

  let raf = 0;
  const handled = new THREE.Vector3();
  const extra = [0, 0, 0, 0];
  function trumma() {
    if (raf) return;
    const t0 = performance.now();
    handled.copy(vila.W).addScaledVector(vila.D0, -26);
    const steg = (ms) => {
      const t = (ms - t0) / 1000;
      if (t > 0.86) {
        ritaVila();
        raf = 0;
        return;
      }
      for (let i = 0; i < 4; i++) {
        // var finger lyfter och faller i sin tur
        const f = ((t * 3.2) % 1) * 4 - (3 - i);
        extra[i] = f > 0 && f < 1 ? -Math.sin(f * Math.PI) * 0.3 : 0;
      }
      A.hand.satt(handled, vila.F, vila.P, KROK, 0, 0, TUMME, extra);
      rita();
      raf = requestAnimationFrame(steg);
    };
    raf = requestAnimationFrame(steg);
  }

  placera();
  return {
    trumma,
    placera,
    knapp(el) { knapp = el; placera(); },
    borta() { cancelAnimationFrame(raf); A.borta(); K.borta(); r.dispose(); r.forceContextLoss(); c.remove(); if (kaffe) kaffe.classList.remove('tre'); },
  };
}
