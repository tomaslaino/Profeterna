// Hasse Backes arm i tobaksaffären (rum-hasse.js), i three.js: i vila ligger den på
// pulten bredvid hans kaffe och kommer in från bildens vänstra kant, hel, med manschett
// och kavajärm. När kameran svänger till honom lyfter han handen och drar den med sig,
// och kameran följer den: underarmen är samma duk hela vägen, sitter i armbågen på hans
// vägg när den kommer in i bild, och blir figurens egen arm när kameran stannar (axeln
// och överarmen står kvar på väggen). Tillbaka lägger han handen på pulten igen.
//
// Armen och handen är figurens (rum-hasse-arm.js). Duken är en och samma: en liten i
// pultens plan i vila (ritas bara när fingrarna trummar) och över svängen ovanpå rummet
// och hans vägg. Världen och kameran är figurens, så att bilden blir densamma vid bytet.
// Det som ligger på en vägg i svängen räknas om till en punkt i den världen, med ett
// djup som ger samma förstoring (paVaggen).
import * as THREE from 'three';
import { ARM, DISK, byggArm, laddaFoto, laddaHand } from './rum-hasse-arm.js';

const DEG = Math.PI / 180;
const D = DISK.CZ;
const CY = DISK.CY;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, f) => a + (b - a) * f;

// Var handleden vilar, i rummets mått (1600 × 1000), hur stor handen är där och hur
// handen och armen ligger på pulten (grader, 0 = rakt åt höger). Står fönstret så att
// kanten skär (smalare eller bredare än scenen) flyttas den in i bild: handen ska alltid
// synas hel.
const LAGE = {
  bred: { x: 60, y: 878, skala: 0.48, in: 60, ner: 50, hv: 30, av: 18 },
  smal: { x: 610, y: 706, skala: 0.42, in: 44, ner: 50, hv: 16, av: 12 },
};
// lutningen på pultens plan mot figurens kamera (handen ska ses uppifrån, som allt på
// pulten), och hur krökta fingrarna är
const LUT = 52 * DEG;
const KROK = 0.02;
const { LA, LB } = ARM;
// Handen ligger stilla på pulten de första och sista graderna, medan rummet glider under
// den: då står hela rummet i 3D, och duken behöver inte ritas om.
const STILL = 6;
const TUMME = 0.45;
const Y_AX = new THREE.Vector3(0, 1, 0);

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

const fy = new THREE.Vector3();
const fz = new THREE.Vector3();
const fx = new THREE.Vector3();
const mt = new THREE.Matrix4();
function vridning(F, Pn, Q) {
  fy.copy(F).normalize();
  fz.copy(Pn).addScaledVector(fy, -Pn.dot(fy)).normalize();
  fx.crossVectors(fy, fz);
  mt.makeBasis(fx, fy, fz);
  return Q.setFromRotationMatrix(mt);
}

// matt() → fönstret och hans väggs mått (rum-hasse.js, passa)
export async function armen(plan, { matt, pr = 1.5, prUt = 1.5 }) {
  const [foto, modell] = await Promise.all([laddaFoto(), laddaHand()]);
  const c = document.createElement('canvas');
  c.className = 'rum-hasse-hand';
  plan.append(c);
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, powerPreference: 'low-power' });
  r.setClearColor(0, 0);
  const S = new THREE.Scene();
  const A = byggArm(S, 1, foto, modell, 0.86);
  A.del('under');
  // skuggorna: färdiga fläckar
  const tex = flack();
  const skugga = () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
    m.renderOrder = -1;
    S.add(m);
    return m;
  };
  const hs = skugga();
  const as = skugga();
  // disken, när handen ligger på den: bara djup, som i figuren (rum-hasse-3d.js)
  const disk = new THREE.Mesh(new THREE.BoxGeometry(3400, 600, DISK.ZF - DISK.ZB), new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true }));
  disk.position.set(0, DISK.TOPP - 300, (DISK.ZF + DISK.ZB) / 2);
  disk.renderOrder = 2;
  disk.visible = false;
  disk.onBeforeRender = (re) => re.clearDepth();
  S.add(disk);
  // natten: rummets mörker ligger ovanpå planet, och utanför det får duken skymma sig själv
  const mork = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { m: { value: 1 } },
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform float m; void main() { gl_FragColor = vec4(vec3(m), 1.); }',
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  }));
  mork.frustumCulled = false;
  mork.renderOrder = 99;
  mork.visible = false;
  S.add(mork);
  const cam = new THREE.PerspectiveCamera(30, 1, 200, 6000);
  cam.position.set(0, CY, D);
  cam.lookAt(0, CY, 0);

  // Fönstret och figurens kamera.
  const V = { W: 1, H: 1, M: 1, ppx: 0, ppy: 0, p: 1, cy: 0 };
  function kamera(crop) {
    const m = matt();
    V.W = m.W;
    V.H = m.H;
    V.M = m.k * m.L.S;
    V.ppx = m.tx + m.k * m.L.px;
    V.ppy = m.ty + m.k * m.L.py;
    V.p = m.W / 2;
    V.cy = m.H / 2;
    cam.fov = 2 * Math.atan((m.H / V.M / 2) / D) / DEG;
    cam.aspect = m.W / m.H;
    cam.setViewOffset(m.W, m.H, m.W / 2 - V.ppx + crop[0], m.H / 2 - V.ppy + crop[1], crop[2], crop[3]);
    cam.updateMatrixWorld();
  }
  // en punkt i fönstret, s bildpunkter på en enhet → figurens värld
  function ifran(x, y, s, ut) {
    return ut.set((x - V.ppx) / s, CY - (y - V.ppy) / s, D * (1 - V.M / s));
  }
  const paSkarm = (P) => {
    const s = V.M * D / (D - P.z);
    return { x: V.ppx + P.x * s, y: V.ppy - (P.y - CY) * s, s };
  };
  // En punkt på hans vägg när kameran har svängt th grader. Väggen är ett plan i
  // CSS 3D (rum-hasse.css): ögat mitt i fönstret, på halva bredden från väggen.
  function paVaggen(P, th, ut) {
    const a = paSkarm(P);
    const u = a.x - V.p;
    const v = a.y - V.cy;
    const sn = Math.sin(th * DEG);
    const cs = Math.cos(th * DEG);
    const X = -V.p * cs + u * sn;
    const Z = Math.max(0.12 * V.p, V.p * sn + u * cs);
    return ifran(V.p + (V.p * X) / Z, V.cy + (V.p * v) / Z, (a.s * V.p) / Z, ut);
  }

  // ---------- i vila ----------

  const vila = { x: 0, y: 0, ux: 0, uy: 0, s: 1, W: new THREE.Vector3(), Q: new THREE.Quaternion(), N: new THREE.Vector3(), F: new THREE.Vector3(), P: new THREE.Vector3(), D0: new THREE.Vector3() };
  const RH = new THREE.Vector3(1, 0, 0);
  let box = { x: 0, y: 0, w: 1, h: 1 };
  let knapp = null;
  let ute = null;
  // var handleden är i fönstret just nu, efter alla rummets vridningar
  const prob = document.createElement('i');
  prob.className = 'rum-syn';
  plan.append(prob);
  const far = new THREE.Vector3();
  const vE = new THREE.Vector3();
  // armen är figurens: den kan stå hur som helst, men handen ska synas var den än är i världen
  function stall(Sk, E, W, F, P, krok, peka) {
    A.satt(Sk, E, W, F, P, krok, peka, 0, TUMME);
    A.hand.mesh.visible = true;
    A.hand.spegel.visible = false;
  }
  function ritaVila() {
    mork.visible = disk.visible = false;
    far.copy(vila.W).addScaledVector(vila.D0, LA + LB);
    vE.copy(vila.W).addScaledVector(vila.D0, LB);
    stall(far, vE, vila.W, vila.F, vila.P, KROK, 0);
    skuggor(vila.W, vila.F, vila.N, vila.D0, 0.8, 0.8, 0);
    r.render(S, cam);
  }
  const m4 = new THREE.Matrix4();
  const sx = new THREE.Vector3();
  const sy = new THREE.Vector3();
  function skuggor(W, F, N, Dv, oh, oa, q) {
    hs.material.opacity = oh;
    hs.position.copy(W).addScaledVector(F, 130 * (1 - q)).addScaledVector(N, -30 * (1 - q));
    hs.position.x += 50 * q;
    hs.position.z += 80 * q;
    // (på disken ligger skuggan på dess yta, hur högt handleden än är)
    hs.position.y = mix(hs.position.y, DISK.TOPP + 1, q);
    sy.copy(F);
    sx.crossVectors(sy, N).normalize();
    sy.crossVectors(N, sx).normalize();
    m4.makeBasis(sx, sy, N);
    hs.quaternion.setFromRotationMatrix(m4);
    hs.scale.set(340, 420, 1);
    as.visible = oa > 0.01;
    if (as.visible) {
      as.material.opacity = oa;
      sy.copy(Dv);
      sx.crossVectors(sy, N).normalize();
      sy.crossVectors(N, sx).normalize();
      m4.makeBasis(sx, sy, N);
      as.quaternion.setFromRotationMatrix(m4);
      as.position.copy(W).addScaledVector(sy, 470).addScaledVector(N, -36).addScaledVector(sx, 14);
      as.scale.set(300, 1100, 1);
    }
  }
  function placera() {
    // (mitt i svängen: när handen är hemma igen)
    if (ute) return;
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
    vila.x = vila.ux = ox + px * k;
    vila.y = vila.uy = oy + py * k;
    vila.s = L.skala * k;
    ifran(vila.x, vila.y, vila.s, vila.W);
    // pultens plan som figurens kamera ser det
    const N = vila.N.set(0, Math.cos(LUT), Math.sin(LUT));
    const AW = new THREE.Vector3(0, Math.sin(LUT), -Math.cos(LUT));
    vila.F.copy(RH).multiplyScalar(Math.cos(L.hv * DEG)).addScaledVector(AW, Math.sin(L.hv * DEG));
    vila.P.copy(N).negate();
    vridning(vila.F, vila.P, vila.Q);
    vila.D0.copy(RH).multiplyScalar(-Math.cos(L.av * DEG)).addScaledVector(AW, -Math.sin(L.av * DEG)).addScaledVector(N, 0.03).normalize();
    Object.assign(prob.style, { left: `${px}px`, top: `${py}px`, width: '0', height: '0' });
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
  function hemIgen() {
    if (!ute) return;
    cancelAnimationFrame(ute.raf);
    ute = null;
    plan.append(c);
    placera();
  }

  // ---------- svängen ----------

  const W_ = new THREE.Vector3();
  const S_ = new THREE.Vector3();
  const E_ = new THREE.Vector3();
  const F_ = new THREE.Vector3();
  const P_ = new THREE.Vector3();
  const N_q = new THREE.Vector3();
  const Q_ = new THREE.Quaternion();
  const d_ = new THREE.Vector3();
  // th: kamerans vinkel (0 mot rummet, 90 mot honom). Kameran följer handen: den dras åt
  // samma håll som kameran och går långsamt in i bilden medan rummet far förbi, i luften
  // halva vägen, och från ungefär 70° ligger den på hans disk och följer väggen som allt
  // annat. Armbågen kommer in i bild först när handen ligger där den ska, så att armen
  // aldrig ser för lång ut.
  function ritaSving(th) {
    const q = clamp((th - STILL) / (90 - STILL));
    const u = ute;
    // på disken, så som kameran ser den nu
    paVaggen(u.W, th, W_);
    const nu = paSkarm(W_);
    const v = ss(58, 84, th);
    const ga = ss(STILL, 62, th);
    // (högst när hans kaffe glider förbi under handen)
    const lyft = ss(STILL, 40, th) * (1 - ss(58, 74, th));
    const x = mix(mix(u.x0, u.xh, ga), nu.x, v);
    const y = mix(mix(u.y0, u.yh, ga) - lyft * u.lyft, nu.y, v);
    const s = mix(mix(u.s0, u.sh, ga), nu.s, v);
    ifran(x, y, s, W_);
    // handen ligger stilla i världen medan kameran vrids
    Q_.copy(vila.Q).slerp(u.Q1, q);
    F_.set(0, 1, 0).applyQuaternion(Q_);
    P_.set(0, 0, 1).applyQuaternion(Q_);
    N_q.copy(vila.N).lerp(Y_AX, q).normalize();
    // ärmen: rakt ut ur bild, sedan mot armbågen på väggen, och sist exakt som hans
    far.copy(W_).addScaledVector(vila.D0, LB);
    paVaggen(u.E, th, E_);
    E_.lerp(far, 1 - ss(0.3, 0.72, q));
    paVaggen(u.S, th, S_);
    d_.subVectors(E_, W_).normalize();
    far.copy(E_).addScaledVector(d_, LA);
    S_.lerp(far, 1 - ss(0.88, 1, q));
    stall(S_, E_, W_, F_, P_, mix(KROK, u.krok, q) + 0.16 * lyft * (1 - v), u.peka * v);
    // spegelbilden i disken, när handen ligger där
    A.hand.spegel.visible = disk.visible = th > 88;
    skuggor(W_, F_, N_q, vila.D0, 0.8 * (1 - 0.8 * lyft * (1 - v)), 0.8 * (1 - ss(0, 0.2, q)), v);
    mork.material.uniforms.m.value = mix(u.m0, 1, ss(0.02, 0.6, q));
    mork.visible = mork.material.uniforms.m.value < 0.995;
    r.render(S, cam);
  }

  // Ut ur planet och över fönstret, med handen där den låg (också om rummet har vridits
  // efter musen). lage: figurens arm (figuren.armLage).
  function ut_(lage, sving, th0 = 0, dag = 1) {
    kamera([0, 0, 1, 1]);
    const s1 = paSkarm(lage.W);
    // (på vägen tillbaka är rummet vänt bort; handen ska hem dit den låg)
    if (th0 === 0) {
      const pb = prob.getBoundingClientRect();
      vila.ux = pb.left;
      vila.uy = pb.top;
    }
    ute = {
      raf: 0,
      x0: vila.ux,
      y0: vila.uy,
      s0: vila.s,
      // där den är på väg medan kameran far förbi
      xh: mix(vila.x, s1.x, 0.45),
      yh: mix(vila.y, s1.y, 0.5),
      sh: mix(vila.s, s1.s, 0.5) * 1.06,
      lyft: 0.17 * V.H,
      Q1: vridning(lage.F, lage.P, new THREE.Quaternion()),
      S: lage.S.clone(),
      E: lage.E.clone(),
      W: lage.W.clone(),
      krok: lage.krok,
      peka: lage.peka,
      m0: dag,
      stilla: false,
    };
    // Duken bara där armen är, och med färre bildpunkter: den rör sig ju.
    const m = matt();
    const bred = Math.ceil(m.W * (m.W / m.H < 1.15 ? 0.85 : 0.56));
    const topp = Math.floor(m.H * 0.3);
    const hojd = m.H - topp;
    sving.parentElement.append(c);
    Object.assign(c.style, { left: '0px', top: `${topp}px`, width: `${bred}px`, height: `${hojd}px` });
    r.setPixelRatio(prUt);
    r.setSize(bred, hojd, false);
    kamera([0, topp, bred, hojd]);
    ritaSving(Math.max(th0, STILL));
    const steg = () => {
      if (!ute) return;
      ute.raf = requestAnimationFrame(steg);
      const t = new DOMMatrixReadOnly(getComputedStyle(sving).transform);
      const th = Math.atan2(t.m13, t.m11) / DEG;
      if (th > STILL || !ute.stilla) ritaSving(Math.max(th, STILL));
      ute.stilla = th <= STILL;
    };
    ute.raf = requestAnimationFrame(steg);
  }

  // ---------- fingrarna trummar: från lillfingret till pekfingret, två varv ----------

  let raf = 0;
  const handled = new THREE.Vector3();
  const extra = [0, 0, 0, 0];
  function trumma() {
    if (raf || ute) return;
    const t0 = performance.now();
    handled.copy(vila.W).addScaledVector(vila.D0, -26);
    const steg = (ms) => {
      if (ute) { raf = 0; return; }
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
    ut: ut_,
    hem: hemIgen,
    borta() { cancelAnimationFrame(raf); A.borta(); r.dispose(); r.forceContextLoss(); c.remove(); prob.remove(); },
  };
}
