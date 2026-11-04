// Hasse Backes arm i tobaksaffären (rum-hasse.js), i three.js: den ligger på pulten
// bredvid hans kaffe och kommer in från bildens vänstra kant, hel, med manschett och
// kavajärm. Duken är en liten i pultens plan och ritas bara när fingrarna trummar. Svänger
// kameran till honom ligger den kvar som allt annat på pulten, och armen fortsätter över
// hörnet på hans vägg (rum-hasse-3d.js).
//
// Armen och handen är figurens (rum-hasse-arm.js), och världen och kameran likaså.
import * as THREE from 'three';
import { ARM, DISK, byggArm, laddaFoto, laddaHand } from './rum-hasse-arm.js';

const DEG = Math.PI / 180;
const D = DISK.CZ;
const CY = DISK.CY;

// Var handleden vilar, i rummets mått (1600 × 1000), hur stor handen är där och hur
// handen och armen ligger på pulten (grader, 0 = rakt åt höger). Står fönstret så att
// kanten skär (smalare eller bredare än scenen) flyttas den in i bild: handen ska alltid
// synas hel.
const LAGE = {
  bred: { x: 56, y: 944, skala: 0.7, in: 60, ner: 36, hv: 12, av: 8 },
  smal: { x: 610, y: 706, skala: 0.42, in: 44, ner: 50, hv: 16, av: 12 },
};
// koppen på pulten (rum.js, #rum-hasse .kopp i rum.css)
const KOPP = { x: 65, y: 730 };
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

// matt() → fönstret och hans väggs mått (rum-hasse.js, passa)
export async function armen(plan, { matt, pr = 1.5 }) {
  const [foto, modell] = await Promise.all([laddaFoto(), laddaHand()]);
  const c = document.createElement('canvas');
  c.className = 'rum-hasse-hand';
  plan.append(c);
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, powerPreference: 'low-power' });
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
  const cam = new THREE.PerspectiveCamera(30, 1, 200, 6000);
  cam.position.set(0, CY, D);
  cam.lookAt(0, CY, 0);

  // Fönstret och figurens kamera.
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
  // en punkt i fönstret, s bildpunkter på en enhet → figurens värld
  function ifran(x, y, s, ut) {
    return ut.set((x - V.ppx) / s, CY - (y - V.ppy) / s, D * (1 - V.M / s));
  }
  // ---------- i vila ----------

  const vila = { x: 0, y: 0, s: 1, W: new THREE.Vector3(), N: new THREE.Vector3(), F: new THREE.Vector3(), P: new THREE.Vector3(), D0: new THREE.Vector3() };
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
    A.hand.spegel.visible = false;
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
  function placera() {
    kamera([0, 0, 1, 1]);
    const m = matt();
    const k = Math.max(m.W / 1600, m.H / 1000);
    const ox = (m.W - 1600 * k) / 2;
    const oy = (m.H - 1000 * k) / 2;
    const visL = -ox / k;
    const visB = (m.H - oy) / k;
    const L = (m.W < 600 && m.H > m.W) || visL > 150 ? LAGE.smal : LAGE.bred;
    const px = Math.max(L === LAGE.smal ? 0 : L.x, visL + L.in);
    const py = Math.min(L.y, visB - L.ner);
    vila.x = ox + px * k;
    vila.y = oy + py * k;
    vila.ox = ox;
    vila.oy = oy;
    vila.k = k;
    vila.s = L.skala * k;
    ifran(vila.x, vila.y, vila.s, vila.W);
    // pultens plan som figurens kamera ser det
    const N = vila.N.set(0, Math.cos(LUT), Math.sin(LUT));
    const AW = new THREE.Vector3(0, Math.sin(LUT), -Math.cos(LUT));
    vila.F.copy(RH).multiplyScalar(Math.cos(L.hv * DEG)).addScaledVector(AW, Math.sin(L.hv * DEG));
    vila.P.copy(N).negate();
    vila.D0.copy(RH).multiplyScalar(-Math.cos(L.av * DEG)).addScaledVector(AW, -Math.sin(L.av * DEG)).addScaledVector(N, 0.03).normalize();
    // duken i planet: från bildens kant (och längre, i telefonen drar man) till fingrarna
    const fot = 390 * L.skala;
    box = { x: Math.floor(Math.min(px - fot, visL - 10)), y: Math.floor(py - fot * 0.72), w: 0, h: Math.ceil(fot * 1.32) };
    box.w = Math.ceil(px + fot - box.x);
    iPlanet(ox, oy, k);
    // det man trycker på: handen och ärmen
    if (knapp) Object.assign(knapp.style, { left: `${px - 90}px`, top: `${py - fot * 0.56}px`, width: `${90 + fot * 0.84}px`, height: `${fot * 0.84}px` });
  }
  function iPlanet(ox, oy, k) {
    Object.assign(c.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    r.setPixelRatio(pr);
    r.setSize(box.w, box.h, false);
    kamera([ox + box.x * k, oy + box.y * k, box.w * k, box.h * k]);
    ritaVila();
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
    knapp(el) { knapp = el; placera(); },
    // i fönstrets bildpunkter, med rummet rakt fram
    handled: () => [vila.x, vila.y],
    koppen: () => [vila.ox + KOPP.x * vila.k, vila.oy + KOPP.y * vila.k],
    borta() { cancelAnimationFrame(raf); A.borta(); r.dispose(); r.forceContextLoss(); c.remove(); },
  };
}
