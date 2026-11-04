// Hasse Backes hand på pulten i tobaksaffären (rum-hasse.js), i three.js: den ligger längst ut till
// vänster bredvid hans kaffe, med manschetten, och armen kommer in från bildens vänstra kant. Svänger
// kameran till honom vrids den med rummet som allt annat på pulten, och hans arm går längs disken fram
// till den (rum-hasse-3d.js). Duken är en liten i pultens plan och ritas bara när fingrarna trummar.
//
// Armen och handen är figurens (rum-hasse-arm.js), och världen och kameran likaså.
//
// armen(plan, { hand, pr }) → { placera(), stall({ skala, mot }), trumma(), knapp(el), borta() }
// hand: var handleden vilar, i rummets mått (1600 × 1000)
import * as THREE from 'three';
import { ARM, KAMERA, byggArm, laddaFoto, laddaHand } from './rum-hasse-arm.js';

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

export async function armen(plan, { hand: HAND, pr = 1.5 }) {
  const [foto, modell] = await Promise.all([laddaFoto(), laddaHand()]);
  const c = document.createElement('canvas');
  c.className = 'rum-hasse-hand';
  // (under kaffet och notan: fingrarna når in bakom fatet)
  const kaffe = plan.querySelector('#rum-hasse');
  if (kaffe) kaffe.before(c); else plan.append(c);
  // (bilden behålls: ligger duken utanför bilden när den ritas, som i telefonen på höjden, visade Chrome
  // annars en tom duk när kameran svängde dit)
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
  // (en liten hand ligger långt bort i figurens värld: den bortre gränsen räcker för det)
  const cam = new THREE.PerspectiveCamera(30, 1, 200, 30000);
  cam.position.set(0, CY, D);
  cam.lookAt(0, CY, 0);

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

  // ---------- i vila ----------

  // skala: rummets bildpunkter på en av figurens enheter, mot: en punkt i rummet som armen pekar mot
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
    r.render(S, cam);
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
  function placera() {
    kamera([0, 0, 1, 1]);
    const m = matt();
    // handens fönster lägger rummet så här (som rummet i ett fönster av den storleken)
    const k = Math.max(m.W / 1600, m.H / 1000);
    const ox = (m.W - 1600 * k) / 2;
    const oy = (m.H - 1000 * k) / 2;
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
    // duken i planet: från rummets vänstra kant (och lite till, under hans vägg i svängen) till fingrarna
    const fot = 390 * opt.skala;
    box = { x: Math.floor(Math.min(HAND.x - fot, -60)), y: Math.floor(HAND.y - fot * 0.72), w: 0, h: Math.ceil(fot * 1.32) };
    box.w = Math.ceil(HAND.x + fot - box.x);
    Object.assign(c.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    r.setPixelRatio(pr);
    r.setSize(box.w, box.h, false);
    kamera([ox + box.x * k, oy + box.y * k, box.w * k, box.h * k]);
    ritaVila();
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
      r.render(S, cam);
      raf = requestAnimationFrame(steg);
    };
    raf = requestAnimationFrame(steg);
  }

  placera();
  return {
    trumma,
    placera,
    // storleken och var armen pekar (rum-hasse.js räknar ut dem ur svängen)
    stall(o) {
      const ny = (o.skala !== undefined && Math.abs(o.skala - opt.skala) > 1e-3) || (o.mot && Math.hypot(o.mot[0] - opt.mot[0], o.mot[1] - opt.mot[1]) > 0.5);
      Object.assign(opt, o);
      if (ny) placera();
    },
    knapp(el) { knapp = el; placera(); },
    borta() { cancelAnimationFrame(raf); A.borta(); r.dispose(); r.forceContextLoss(); c.remove(); },
  };
}
