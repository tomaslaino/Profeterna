// Hasse Backes händer och kaffe på pulten i tobaksaffären (rum-hasse.js), i three.js: han sitter vid pultens hörn
// utanför bilden till vänster, och hans underarmar kommer in från bildens vänstra kant och vilar korslagda på
// pulten, den vänstra handen över den högra, som när man vänder sig till honom (rum-hasse-3d.js). Till höger om
// händerna står koppen på sitt fat, och fatet står på notans övre vänstra hörn (rum.js), som i baren. Duken är en
// liten i pultens plan och ritas bara när fingrarna trummar.
//
// Det är samma armar i samma vila (VILAN i rum-hasse-arm.js), i figurens värld, med samma ljus som i baren och
// samma skuggor på disken, sedda i rummets blickriktning: mot fönstren (barens +x), lika långt bort och lika
// mycket uppifrån som från ögat i rummet (RUM i rum-pult.js), så att man ser dem från sidan där han sitter i
// hörnet. Bilden flyttas dit där kaffet och notan ligger i rummet; armbågarna och axlarna hamnar då utanför
// bilden till vänster.
//
// armen(plan, { hand, kopp, pr, ljus }) → { placera(), trumma(), knapp(el), borta() }
// hand: var händerna vilar, kopp: fatets mitt, i rummets mått (1600 × 1000); ljus: baren ljus just nu
// (ljuset i rum-hasse.js: dag, c, f)
import * as THREE from 'three';
import { HAND as HM, VILAN, byggArm, byggKopp, byggSkugga, laddaFoto, laddaHand } from './rum-hasse-arm.js';
import { disken, franBaren } from './rum-hasse-scen.js';
import { RUM, L } from './rum-pult.js';

const DEG = Math.PI / 180;
const V3 = (a) => new THREE.Vector3(...a);
// Händerna ses lika stora som koppen bredvid (rummets bildpunkter på en av figurens enheter): rummet är ritat
// så, fast hans händer egentligen ligger närmare en än koppen.
const SKALA = 0.6;
const DK = disken();
// en mjuk skugga som färdig fläck (under fatet)
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

// En kamera som ser mal från pos (eller rakt framifrån på avståndet avst i riktningen dir), med s rummets
// bildpunkter på en enhet vid mal, och mal i rummets (x, y), beskuren till duken (box i rummets mått).
const M2 = 8000;
function sikta(cam, mal, x, y, s, box) {
  const f = s * cam.position.distanceTo(mal);
  cam.lookAt(mal);
  cam.fov = (2 * Math.atan(M2 / 2 / f)) / DEG;
  cam.aspect = 1;
  cam.setViewOffset(M2, M2, M2 / 2 - x + box.x, M2 / 2 - y + box.y, box.w, box.h);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
}

export async function armen(plan, { hand: HAND, kopp: KOPP, pr = 1.5, ljus = null }) {
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
  // Barens ljus (LJUS i rum-hasse-arm.js): fönstret efter klockan och vädret som i baren, och lysröret tänt.
  // (På natten mörknar rummet självt, rum-folk.css, så handen gör det inte en gång till.)
  const l = ljus || { dag: 0, c: [1, 1, 1], f: 0 };
  const bord = {
    value: new THREE.Vector4(DK.n[0], DK.n[1], DK.c, DK.Y), butik: { value: 1 },
    dag: { value: new THREE.Vector4(...l.c.map((x) => x * l.f * 0.8), l.dag) }, lys: { value: new THREE.Vector4(0.587, 0.593, 0.606, 0.75) },
    // (ärmarna ses från sidan bort från barens lampor: samma gråa kavaj som i baren, rum-hasse-arm.js)
    tyg: { value: 1.35 },
  };
  const S = new THREE.Scene();
  // Skuggorna på pulten under händerna och underarmarna, som i baren (byggSkugga): på diskens ovansida runt dem.
  const sg = new THREE.PlaneGeometry(4000, 4000);
  sg.rotateX(-Math.PI / 2);
  sg.translate(0, DK.Y + 0.3, 900);
  const SK = byggSkugga(sg, 4, bord.dag);
  SK.mesh.renderOrder = -1;
  S.add(SK.mesh);
  const cam = new THREE.PerspectiveCamera(30, 1, 50, 30000);

  // Vilan: samma armar och händer som i baren.
  const lage = {};
  for (const [k, v] of [['A', VILAN.A], ['B', VILAN.B]]) {
    const W = V3(v.W);
    const E = V3(v.E);
    const u = W.clone().sub(E).normalize();
    lage[k] = { v, S: V3(v.S), E, W, F: V3(v.F).normalize(), P: V3(v.P).normalize(), H: W.clone().addScaledVector(u, 26) };
  }
  // händernas mitt: där underarmarna korsar, en bit fram mot fingrarna
  const MITT = lage.A.W.clone().add(lage.B.W).multiplyScalar(0.5).addScaledVector(lage.A.F.clone().add(lage.B.F).normalize(), 70);
  // ögat: i rummets blickriktning, lika långt bort och lika högt som rummets öga (barens mått → figurens värld)
  const oga = V3(franBaren([-RUM.Z, L.Y + RUM.H, RUM.X]));
  const avst = oga.distanceTo(MITT);
  const lut = Math.asin((oga.y - MITT.y) / avst);
  const OGA = MITT.clone().addScaledVector(V3(franBaren([Math.cos(lut), -Math.sin(lut), 0])), -avst);
  cam.position.copy(OGA);
  // (ljuset ses från det ögat, rum-hasse-arm.js)
  bord.vy = OGA.clone().sub(MITT).normalize().toArray();
  const A = byggArm(S, 1, foto, modell, 0.94, bord);
  const B = byggArm(S, -1, foto, modell, 1, bord);
  lage.A.X = A;
  lage.B.X = B;
  const satt = (k, extra = null) => {
    const a = lage[k];
    a.X.satt(a.S, a.E, a.W, a.F, a.P, a.v.krok, 0, a.v.spar, a.v.tumme, extra);
  };
  const HS = HM.SK / 0.92;
  const ah = (o) => o.y - DK.Y;
  const FA = new THREE.Vector3();
  function skuggor() {
    const kap = (i, a) => {
      FA.copy(a.W).addScaledVector(a.F, 170 * HS);
      SK.kap(i, a.W, FA, 50 * HS, ah(a.W) - 24);
      SK.kap(i + 1, a.E, a.W, 70, (ah(a.E) + ah(a.W)) / 2 - 20);
    };
    kap(0, lage.A);
    kap(2, lage.B);
  }

  // Koppen på sitt fat, samma som i baren: den står upprätt i en egen värld med samma ljus och ses av en egen
  // kamera rakt framifrån, KOPP_VY grader uppifrån som pulten i rummet (rummets öga ser hörnet långt från sin
  // mitt, och där skulle en kopp luta). Lite mindre än i baren, där handen pekar rakt mot en och ser kortare ut.
  // Fatets skugga faller bort från ljuset, som kommer framifrån till vänster.
  const tex = flack();
  const S2 = new THREE.Scene();
  const K = byggKopp({ value: new THREE.Vector4(0, 1, -1e9, -1e9), butik: bord.butik, dag: bord.dag, lys: bord.lys, vy: [0, Math.sin(33 * DEG), Math.cos(33 * DEG)] });
  S2.add(K.kopp, K.fat);
  const fs = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, opacity: 0.85, transparent: true, depthWrite: false, depthTest: false }));
  fs.renderOrder = -1;
  S2.add(fs);
  const KOPP_VY = 33 * DEG;
  const KOPP_SKALA = 0.9;
  const KOPP_AVST = 3900;
  K.kopp.position.set(0, 11, 0);
  K.kopp.rotation.y = -0.5;
  K.fat.position.set(0, 0.5, 0);
  K.fat.rotation.y = -0.5;
  fs.rotation.x = -Math.PI / 2;
  fs.position.set(16, 0, -14);
  fs.scale.set(300, 290, 1);
  const cam2 = new THREE.PerspectiveCamera(10, 1, 200, 30000);
  cam2.position.set(0, Math.sin(KOPP_VY), Math.cos(KOPP_VY)).multiplyScalar(KOPP_AVST);
  const O = new THREE.Vector3();
  // båda bilderna på duken: händerna, och koppen ovanpå
  r.autoClear = false;
  function rita() {
    r.clear();
    r.render(S, cam);
    r.clearDepth();
    r.render(S2, cam2);
  }

  // en punkt i figurens värld i rummet (händernas kamera, mitten vid HAND)
  const fram = new THREE.Vector3();
  const hoger = new THREE.Vector3();
  const upp = new THREE.Vector3();
  const pd = new THREE.Vector3();
  function iRummet(p, mal, x, y, s, kam) {
    fram.subVectors(mal, kam).normalize();
    hoger.crossVectors(fram, upp.set(0, 1, 0)).normalize();
    upp.crossVectors(hoger, fram);
    pd.subVectors(p, kam);
    const z = pd.dot(fram);
    const f = s * kam.distanceTo(mal);
    return [x + (f * pd.dot(hoger)) / z, y - (f * pd.dot(upp)) / z];
  }
  const koppIRum = (p) => iRummet(p, O, KOPP.x, KOPP.y, SKALA * KOPP_SKALA, cam2.position);
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
  // det händerna och underarmarna tar i rummet, med skuggorna (till vänster ut över bildkanten)
  // (och händerna själva, till det man trycker på)
  function handRuta() {
    const ut = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const h = { ...ut };
    const med = (p, m, rr = ut) => {
      const [x, y] = iRummet(p, MITT, HAND.x, HAND.y, SKALA, OGA);
      rr.x0 = Math.min(rr.x0, x - m); rr.y0 = Math.min(rr.y0, y - m); rr.x1 = Math.max(rr.x1, x + m); rr.y1 = Math.max(rr.y1, y + m);
    };
    for (const a of [lage.A, lage.B]) {
      med(a.W, 70);
      med(a.E, 80);
      med(FA.copy(a.S).add(a.E).multiplyScalar(0.5), 80);
      med(FA.copy(a.W).addScaledVector(a.F, 200), 60);
      med(a.W, 30, h);
      med(FA.copy(a.W).addScaledVector(a.F, 190), 20, h);
    }
    return { ...ut, hand: h };
  }
  let box = { x: 0, y: 0, w: 1, h: 1 };
  let knapp = null;
  let hr = null;
  function placera() {
    satt('A');
    satt('B');
    skuggor();
    hr = handRuta();
    const kr = koppRuta();
    // duken i planet: från rummets vänstra kant (och lite till) till fingrarna och koppen med skuggan
    box = { x: -60, y: Math.floor(Math.min(hr.y0, kr.y0 - 6)), w: 0, h: 0 };
    box.w = Math.ceil(Math.max(hr.x1, kr.x1 + 24) - box.x);
    box.h = Math.ceil(Math.max(hr.y1, kr.y1 + 24) - box.y);
    Object.assign(c.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    r.setPixelRatio(pr);
    r.setSize(box.w, box.h, false);
    sikta(cam, MITT, HAND.x, HAND.y, SKALA, box);
    sikta(cam2, O, KOPP.x, KOPP.y, SKALA * KOPP_SKALA, box);
    SK.U.uRuta.value.set(box.w * pr, box.h * pr, pr);
    rita();
    anga();
    // (koppen här ersätter den ritade i rummet, rum.css)
    if (kaffe) kaffe.classList.add('tre');
    c.classList.add('klar');
    // det man trycker på: händerna och underarmarna ut till bildkanten
    const hh = hr.hand;
    if (knapp) Object.assign(knapp.style, { left: '-40px', top: `${hh.y0}px`, width: `${hh.x1 + 40}px`, height: `${hh.y1 - hh.y0}px` });
  }

  // ---------- fingrarna trummar: den vänstra handen, överst, från lillfingret till pekfingret, två varv ----------

  let raf = 0;
  const extra = [0, 0, 0, 0];
  function trumma() {
    if (raf) return;
    const t0 = performance.now();
    const b = lage.B;
    const steg = (ms) => {
      const t = (ms - t0) / 1000;
      if (t > 0.86) {
        satt('B');
        rita();
        raf = 0;
        return;
      }
      for (let i = 0; i < 4; i++) {
        // var finger lyfter och faller i sin tur
        const f = ((t * 3.2) % 1) * 4 - (3 - i);
        extra[i] = f > 0 && f < 1 ? -Math.sin(f * Math.PI) * 0.3 : 0;
      }
      B.hand.satt(b.H, b.F, b.P, b.v.krok, 0, b.v.spar, b.v.tumme, extra);
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
    borta() { cancelAnimationFrame(raf); A.borta(); B.borta(); K.borta(); sg.dispose(); r.dispose(); r.forceContextLoss(); c.remove(); if (kaffe) kaffe.classList.remove('tre'); },
  };
}
