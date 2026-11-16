// Högtidspyntet i tobaksaffären (rum-inredning.js) och i baren bakom Hasse Backe (rum-hasse-3d.js): runt
// högtiderna pyntar affären, och pyntet sitter uppe längre än gängets högtidskläder (rum-fest.js), som en
// affär pyntar – före och en bit efter, inte bara på dagen.
//
//   jul         fredagen före första advent (julskyltningen) till tjugondag Knut (13 januari): en
//               adventsstjärna i papper som lyser i fönstret, en granrisgirlang med ljus, röda kulor och
//               rosetter längs fönstrets överkant, och en elektrisk adventsljusstake på bardisken
//   pask        lördagen före palmsöndagen till tisdagen efter annandag påsk: målade ägg i band i fönstret
//               och påskris med fjädrar i en vas på bardisken
//   midsommar   måndagen i midsommarveckan till söndagen efter midsommarafton: vimplar i blått och gult
//               längs fönstrets överkant och en burk med prästkragar, blåklint, smörblommor och björkris
//   kraftor     kräftpremiären (andra onsdagen i augusti, som på nittiotalet) till sista augusti:
//               kräftlyktor – fullmånar med ansikten – längs fönstrets överkant
//   halloween   veckan före alla helgons dag och dagen själv: en urholkad pumpa som lyser på bardisken och
//               ett spindelnät med en spindel i fönstrets hörn
//
// Dagen är Stockholms (Vader.nu(), som ölen, fikat och högtidskläderna). Nyåret och lucian ligger inom
// julpyntet, som i en vanlig affär.
//
// pyntet(v) → 'jul' | 'pask' | 'midsommar' | 'kraftor' | 'halloween' | null (v = Vader.nu());
//   ?rum-pynt=<namn> för bilder (?rum-pynt=inget: inget)
// pyntSaker(mat) → { stjarna, ljusstake, girlang, agg, paskris, vimplar, blommor, lyktor, pumpa, vav }
// pyntNatt(grupp, g) → pyntet i mörkret g (0–1)
//
// Sakerna byggs i centimeter med y uppåt och z mot betraktaren; den som ställer dem skalar gruppen.
// Det som lyser (glödlamporna, stjärnan, lyktorna och pumpan) lyser av sig själv och har ett sken
// omkring sig (sken); det andra mörknar med lysröret (natt i rum-inredning.js: userData.morkna).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fromPask } from './rum-fika.js';

export const PYNT = ['jul', 'pask', 'midsommar', 'kraftor', 'halloween'];

// ---------- kalendern ----------

const dagNr = (Y, m, d) => Math.round(Date.UTC(Y, m - 1, d) / 864e5);
const veckodag = (Y, m, d) => new Date(Date.UTC(Y, m - 1, d)).getUTCDay();
// första advent: fjärde advent är sista söndagen till och med julafton, första tre veckor före
const forstaAdvent = (Y) => dagNr(Y, 12, 24 - veckodag(Y, 12, 24) - 21);
// midsommarafton: fredagen mellan den 19 och 25 juni
const midsommarafton = (Y) => dagNr(Y, 6, 19 + ((12 - veckodag(Y, 6, 19)) % 7));
// alla helgons dag: lördagen mellan den 31 oktober och 6 november
const allaHelgon = (Y) => dagNr(Y, 10, 31 + ((13 - veckodag(Y, 10, 31)) % 7));
// kräftpremiären: andra onsdagen i augusti
const kraftpremiar = (Y) => dagNr(Y, 8, 1 + ((10 - veckodag(Y, 8, 1)) % 7) + 7);

export function pyntet(v) {
  const q = new URLSearchParams(location.search).get('rum-pynt');
  if (q != null) return PYNT.includes(q) ? q : null;
  if (!v || !v.ar) return null;
  const { ar: Y, manad: m, dag: d } = v;
  const nu = dagNr(Y, m, d);
  if (m === 1 && d <= 13) return 'jul';
  if (m >= 11 && nu >= forstaAdvent(Y) - 2) return 'jul';
  const p = fromPask(v);
  if (p >= -8 && p <= 2) return 'pask';
  const ms = nu - midsommarafton(Y);
  if (ms >= -4 && ms <= 2) return 'midsommar';
  if (m === 8 && nu >= kraftpremiar(Y)) return 'kraftor';
  const ah = allaHelgon(Y);
  if (nu >= ah - 7 && nu <= ah) return 'halloween';
  return null;
}

// ---------- sakerna ----------

const DEG = Math.PI / 180;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// samma slump varje gång (frö s)
const rnd = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

// mat(färg, val) → ett material som rummets (rum-inredning.js ger sitt, med rummets reflexer)
export function pyntSaker(mat = (c, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.6 }, o))) {
  const cache = new Map();
  const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
  function duk(w, h, rita) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    rita(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  // ett material som mörknar med lysröret (natt)
  const m = (c, o) => { const x = mat(c, o); x.userData.morkna = true; return x; };
  // det som lyser av sig själv
  const lys = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const mesh = (g, mt, p) => { const x = new THREE.Mesh(g, mt); x.castShadow = true; x.receiveShadow = true; if (p) p.add(x); return x; };

  // Skenet kring det som lyser: runda fläckar som tonar ut, sammanslagna till en enda form med färgen och
  // styrkan i hörnen (lista: [punkt, radie, färg, styrka]), vända mot betraktaren (ligger: vågräta, ljuset
  // på det saken står på). Vanlig blandning, inte additiv: duken läggs över väggen som den är, och ljuset
  // målas på den som neonens sken (medSken i rum-inredning.js). Det blir starkare när det är mörkt
  // (userData.sken, pyntNatt).
  const skenTex = () => once('sken', () => duk(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.15, 'rgba(255,255,255,.6)');
    r.addColorStop(0.45, 'rgba(255,255,255,.18)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  }));
  function sken(lista, p, ligger = false) {
    const geos = lista.map(([pt, r, farg, styrka]) => {
      const g = new THREE.PlaneGeometry(2 * r, 2 * r);
      if (ligger) g.rotateX(-90 * DEG);
      g.translate(pt.x, pt.y, pt.z);
      const c = new THREE.Color(farg);
      const a = new Float32Array(g.attributes.position.count * 4);
      for (let i = 0; i < a.length; i += 4) a.set([c.r, c.g, c.b, styrka], i);
      g.setAttribute('color', new THREE.BufferAttribute(a, 4));
      return g;
    });
    const mt = new THREE.MeshBasicMaterial({ map: skenTex(), vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false });
    mt.userData.sken = true;
    const x = new THREE.Mesh(mergeGeometries(geos), mt);
    x.renderOrder = 10;
    if (p) p.add(x);
    return x;
  }

  // ett rör längs punkterna som smalnar från r0 till r1 (kvistar, snören, stjälkar), med färgen i hörnen
  function ror(pts, r0, r1 = r0, farg = '#ffffff', rund = 6) {
    const c = new THREE.CatmullRomCurve3(pts);
    const n = Math.max(3, Math.min(60, Math.round(c.getLength() / 1.4)));
    const fr = c.computeFrenetFrames(n, false);
    const pos = [];
    const nor = [];
    const idx = [];
    const N = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const p = c.getPointAt(i / n);
      const r = r0 + (r1 - r0) * (i / n);
      for (let j = 0; j <= rund; j++) {
        const a = (j / rund) * 2 * Math.PI;
        N.copy(fr.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(fr.binormals[i], Math.sin(a));
        pos.push(p.x + N.x * r, p.y + N.y * r, p.z + N.z * r);
        nor.push(N.x, N.y, N.z);
      }
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < rund; j++) {
        const a = i * (rund + 1) + j;
        const b = a + rund + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return farga(g, farg);
  }
  // färgen i hörnen (för att slå ihop många delar till en form)
  function farga(g, farg) {
    const c = new THREE.Color(farg);
    const a = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < a.length; i += 3) a.set([c.r, c.g, c.b], i);
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    if (g.attributes.uv) g.deleteAttribute('uv');
    return g;
  }
  const ihop = (lista) => mergeGeometries(lista.map((g) => (g.index ? g.toNonIndexed() : g)));
  // en båge som hänger mellan a och b och sjunker s på mitten
  function bage(a, b, s, n = 24) {
    const ut = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      ut.push(a.clone().lerp(b, t).add(V(0, -4 * s * t * (1 - t), 0)));
    }
    return ut;
  }
  // bågarna mellan krokarna, i en följd (krokar: punkter, s: hur mycket de sjunker)
  function bagar(krokar, s, n = 24) {
    const ut = [];
    for (let i = 0; i < krokar.length - 1; i++) ut.push(...bage(krokar[i], krokar[i + 1], s, n).slice(i ? 1 : 0));
    return ut;
  }
  // en rosett: två öglor och två band (färgen, storleken k)
  function rosett(farg, k = 1) {
    const g = [];
    for (const s of [-1, 1]) {
      const o = new THREE.TorusGeometry(1.3 * k, 0.42 * k, 6, 14);
      o.scale(1.15, 0.75, 0.45);
      o.translate(s * 1.45 * k, 0.15 * k, 0);
      o.rotateZ(s * -12 * DEG);
      g.push(farga(o, farg));
      const b = new THREE.BoxGeometry(0.9 * k, 3.2 * k, 0.18 * k);
      b.translate(0, -1.6 * k, 0);
      b.rotateZ(s * 22 * DEG);
      g.push(farga(b, farg));
    }
    g.push(farga(new THREE.SphereGeometry(0.6 * k, 10, 8), farg));
    return ihop(g);
  }

  // ---------- jul ----------

  // Adventsstjärnan: en femuddig stjärna i rött papper, vikt till en låg pyramid fram och bak, med en lampa
  // inuti som lyser genom papperet, starkast mot mitten, och klart genom de utskurna slitsarna; sladden går
  // upp till kroken (snore cm). Mitten i origo.
  function stjarna({ R = 17, r = 7.4, d = 7.5, farg = '#a8101a', snore = 30 } = {}) {
    const g = new THREE.Group();
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r : R;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
    }
    const pos = [];
    const uv = [];
    const tri = (...p) => { for (const q of p) { pos.push(...q); uv.push(q[0] / (2 * R) + 0.5, q[1] / (2 * R) + 0.5); } };
    for (let i = 0; i < 10; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % 10];
      tri([0, 0, d], p, q);
      tri([0, 0, -d], q, p);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    // slitsarna: en lång längs varje udd, två små snett ut mot sidorna, och en blomma av fem i mitten
    const S = 512;
    const ut = (x, y) => [S / 2 + (x / (2 * R)) * S, S / 2 - (y / (2 * R)) * S];
    const slits = (c, a, r0, r1, b) => {
      const [x0, y0] = ut(Math.cos(a) * R * r0, Math.sin(a) * R * r0);
      const [x1, y1] = ut(Math.cos(a) * R * r1, Math.sin(a) * R * r1);
      const nx = -Math.sin(a) * b * S;
      const ny = -Math.cos(a) * b * S;
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo((x0 + x1) / 2 + nx, (y0 + y1) / 2 + ny, x1, y1);
      c.quadraticCurveTo((x0 + x1) / 2 - nx, (y0 + y1) / 2 - ny, x0, y0);
      c.fill();
    };
    const monster = (c) => {
      for (let i = 0; i < 5; i++) {
        const a = Math.PI / 2 + (i * 2 * Math.PI) / 5;
        slits(c, a, 0.34, 0.74, 0.022);
        for (const da of [-0.13, 0.13]) slits(c, a + da, 0.42, 0.58, 0.01);
        slits(c, a + Math.PI / 5, 0.07, 0.2, 0.016);
      }
    };
    const karta = once(`stj-f${farg}`, () => duk(S, S, (c) => {
      c.fillStyle = farg;
      c.fillRect(0, 0, S, S);
      const q = rnd(11);
      for (let i = 0; i < 1400; i++) {
        c.fillStyle = `rgba(${q() > 0.5 ? '255,220,200' : '40,0,0'},${0.03 + q() * 0.05})`;
        c.fillRect(q() * S, q() * S, 1 + q() * 4, 1);
      }
      c.fillStyle = 'rgba(255,190,120,.9)';
      monster(c);
    }));
    const glod = once('stj-g', () => duk(S, S, (c) => {
      // papperet lyser där lampan står bakom det, starkast mot mitten och svagt ut i uddarna
      const r = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      r.addColorStop(0, 'rgb(255,120,52)');
      r.addColorStop(0.3, 'rgb(205,58,24)');
      r.addColorStop(0.7, 'rgb(120,20,10)');
      r.addColorStop(1, 'rgb(80,10,6)');
      c.fillStyle = r;
      c.fillRect(0, 0, S, S);
      c.shadowColor = 'rgb(255,170,80)';
      c.shadowBlur = 10;
      c.fillStyle = 'rgb(255,236,190)';
      monster(c);
    }));
    const papper = new THREE.MeshStandardMaterial({ color: '#ffffff', map: karta, emissive: '#ffffff', emissiveMap: glod, roughness: 0.92, flatShading: true });
    mesh(geo, papper, g);
    // vecken: en tunn kant där fram- och baksidan möts
    const kant = [];
    for (let i = 0; i <= 10; i++) kant.push(V(...pts[i % 10]));
    g.add(new THREE.Mesh(ror(kant, 0.16, 0.16, '#6a080e', 4), m('#ffffff', { vertexColors: true, roughness: 0.9 })));
    // sladden upp till kroken, och ljuset på glaset bakom
    mesh(ror([V(0, R - 1, -0.5), V(0.3, R + snore * 0.5, -0.3), V(0, R + snore, 0)], 0.22, 0.22, '#e9e4d8'), m('#ffffff', { vertexColors: true, roughness: 0.5 }), g);
    sken([[V(0, 0, -d - 1.5), R * 2.6, '#ff6a2a', 0.6]], g);
    g.userData.ljus = [{ p: V(0, 0, 0), r: R * 2.4, farg: '255, 110, 50' }];
    return g;
  }

  // Den elektriska adventsljusstaken: en trappa i vitmålat trä med sju ljus i vit plast, högst i mitten, och
  // en liten glödlampa formad som en låga i varje. Skenet ligger kring lamporna och på det den står på.
  function ljusstake({ farg = '#e4dccd' } = {}) {
    const g = new THREE.Group();
    const N = 7;
    const steg = 4.8;
    const W = N * steg;
    const hojd = (i) => 2.4 + (3 - Math.abs(i - 3)) * 3.3;
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    for (let i = 0; i < N; i++) {
      s.lineTo(-W / 2 + i * steg, hojd(i));
      s.lineTo(-W / 2 + (i + 1) * steg, hojd(i));
    }
    s.lineTo(W / 2, 0);
    s.closePath();
    const tra = m(farg, { roughness: 0.45, clearcoat: 0.4 });
    const kropp = new THREE.ExtrudeGeometry(s, { depth: 2, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 2 });
    kropp.translate(0, 1.2, -1);
    mesh(kropp, tra, g);
    const fot = new THREE.BoxGeometry(W + 1.6, 1.2, 7.5);
    fot.translate(0, 0.6, 0);
    mesh(fot, tra, g);
    const plast = m('#f8f4ea', { roughness: 0.35 });
    const lampor = [];
    for (let i = 0; i < N; i++) {
      const x = -W / 2 + (i + 0.5) * steg;
      const y0 = 1.2 + hojd(i) + 0.25;
      const ljus = new THREE.CylinderGeometry(0.72, 0.78, 5.6, 14);
      ljus.translate(x, y0 + 2.8, 0);
      mesh(ljus, plast, g);
      const sockel = new THREE.CylinderGeometry(0.42, 0.5, 0.6, 10);
      sockel.translate(x, y0 + 5.9, 0);
      mesh(sockel, m('#c9b98a', { metalness: 0.7, roughness: 0.35 }), g);
      const lagan = new THREE.SphereGeometry(1, 14, 10);
      lagan.scale(0.6, 1.05, 0.6);
      lagan.translate(x, y0 + 7.15, 0);
      lampor.push(lagan);
      g.userData.lampor = (g.userData.lampor || []).concat([V(x, y0 + 7.2, 0)]);
    }
    g.add(new THREE.Mesh(ihop(lampor.map((x) => farga(x, '#ffe9ad'))), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
    // (skenet bakom lampan, så att lågan själv är det ljusaste, och en ljus kärna i den)
    sken(g.userData.lampor.map((p) => [p.clone().add(V(0, 0.4, -0.9)), 8, '#ffbf5c', 1]).concat([[V(0, 12, -1.6), 30, '#ff9f45', 0.34]]), g);
    sken(g.userData.lampor.map((p) => [p.clone().add(V(0, -0.15, 0.8)), 1.3, '#fffbef', 1]), g);
    // ljuset på det den står på
    sken([[V(0, 0.05, 2), 24, '#ffb055', 0.38]], g, true);
    g.userData.ljus = [{ p: V(0, 10, 0), r: 26, farg: '255, 196, 120' }];
    return g;
  }

  // Granrisgirlangen: kvistar av gran runt en båge mellan krokarna (s: hur mycket den sjunker), alla lagda åt
  // samma håll som i en bunden girlang, med varmvita små lampor i en slinga runt den, en röd rosett vid
  // varje krok och en kula som hänger mitt i bågarna (röd och guld om vartannat; utan: de bågar som ska
  // vara utan). Kvistarna är kort med en ritad kvist (granris), så att den blir yvig utan att kosta mycket.
  const granris = () => once('granris', () => {
    const t = duk(128, 256, (c, w, h) => {
      const q = rnd(5);
      c.lineCap = 'round';
      c.strokeStyle = '#3b2a1c';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(w / 2, h);
      c.quadraticCurveTo(w / 2 + 4, h / 2, w / 2 - 2, 8);
      c.stroke();
      for (let y = h - 6; y > 10; y -= 5) {
        const u = 1 - y / h;
        const l = (w / 2 - 6) * (0.45 + 0.55 * Math.sin(Math.PI * (0.15 + 0.85 * (1 - u)) * 0.95));
        for (const sx of [-1, 1]) {
          const ang = (55 + q() * 15) * DEG;
          const x0 = w / 2 + sx * 1;
          const x1 = x0 + sx * Math.sin(ang) * l;
          const y1 = y - Math.cos(ang) * l;
          const gr = c.createLinearGradient(x0, y, x1, y1);
          gr.addColorStop(0, '#173d22');
          gr.addColorStop(0.7, q() > 0.5 ? '#2f6a3a' : '#2a5f33');
          gr.addColorStop(1, '#5c9a5c');
          c.strokeStyle = gr;
          c.lineWidth = 3.4;
          c.beginPath();
          c.moveTo(x0, y);
          c.lineTo(x1, y1);
          c.stroke();
        }
      }
    });
    t.anisotropy = 8;
    return t;
  });
  function girlang(krokar, { s = 6, tjock = 5.5, utan = [] } = {}) {
    const g = new THREE.Group();
    const q = rnd(23);
    const bana = new THREE.CatmullRomCurve3(bagar(krokar, s));
    const L = bana.getLength();
    const n = Math.round(L / 0.7);
    const fr = bana.computeFrenetFrames(n, false);
    const pos = [];
    const uv = [];
    const col = [];
    const dir = new THREE.Vector3();
    const sid = new THREE.Vector3();
    const N1 = new THREE.Vector3();
    const kort = (b0, d, sd, l, w, c) => {
      const h = sd.clone().multiplyScalar(w / 2);
      const t = b0.clone().addScaledVector(d, l);
      const v = [b0.clone().sub(h), b0.clone().add(h), t.clone().add(h), t.clone().sub(h)];
      const u = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(v[k].x, v[k].y, v[k].z); uv.push(...u[k]); col.push(c.r, c.g, c.b); }
    };
    for (let i = 0; i <= n; i++) {
      const p = bana.getPointAt(i / n);
      const T = fr.tangents[i];
      for (let k = 0; k < 4; k++) {
        const a = q() * 2 * Math.PI;
        N1.copy(fr.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(fr.binormals[i], Math.sin(a));
        // kvistarna pekar utåt och framåt längs girlangen
        dir.copy(N1).multiplyScalar(0.62).addScaledVector(T, 0.78 + (q() - 0.5) * 0.4).normalize();
        sid.crossVectors(dir, N1).normalize().applyAxisAngle(dir, (q() - 0.5) * 1.2);
        const l = tjock * (1.05 + q() * 0.45);
        const ljus = 0.72 + q() * 0.5;
        kort(p.clone().addScaledVector(N1, 0.6), dir, sid, l, l * 0.6, new THREE.Color(ljus, ljus * (0.95 + q() * 0.1), ljus));
      }
    }
    const barr = new THREE.BufferGeometry();
    barr.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    barr.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    barr.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    barr.computeVertexNormals();
    mesh(barr, m('#ffffff', { map: granris(), vertexColors: true, alphaTest: 0.45, roughness: 0.8, side: THREE.DoubleSide }), g);
    mesh(ror(bana.getPoints(120), tjock * 0.32, tjock * 0.32, '#17351f', 6), m('#ffffff', { vertexColors: true, roughness: 0.9 }), g);
    // lamporna i en slinga runt girlangen
    const lampor = [];
    const sk = [];
    const nl = Math.round(L / 5.5);
    for (let i = 0; i < nl; i++) {
      const t = (i + 0.5) / nl;
      const j = Math.round(t * n);
      const a = i * 2.3;
      const mitt = bana.getPointAt(t);
      const p = mitt.clone().addScaledVector(fr.normals[j], Math.cos(a) * tjock * 0.75).addScaledVector(fr.binormals[j], Math.sin(a) * tjock * 0.75);
      // (de som hamnar bakom girlangen syns inte)
      if (p.z < mitt.z - tjock * 0.1) continue;
      lampor.push(farga(new THREE.SphereGeometry(0.5, 8, 6).translate(p.x, p.y, p.z), '#fff6dc'));
      sk.push([p.clone().add(V(0, 0, 0.8)), 3.4, '#ffcf7a', 0.75]);
    }
    if (lampor.length) {
      g.add(new THREE.Mesh(ihop(lampor), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
      sken(sk, g);
    }
    // rosetterna och kulorna
    const sammet = m('#ffffff', { vertexColors: true, roughness: 0.8, sheen: 0.6, sheenColor: '#d42a2a', sheenRoughness: 0.5 });
    krokar.forEach((k, i) => {
      const r = new THREE.Mesh(rosett('#8c0c16', 2.1), sammet);
      r.position.copy(k).add(V(0, -1, tjock * 0.85));
      r.rotation.z = (i % 2 ? 1 : -1) * 5 * DEG;
      r.castShadow = true;
      g.add(r);
    });
    for (let i = 0; i < krokar.length - 1; i++) {
      if (utan.includes(i)) continue;
      const mitt = bage(krokar[i], krokar[i + 1], s, 2)[1];
      const guld = i % 2 === 1;
      const R = guld ? 2.6 : 3.1;
      const ned = 3 + (i % 3) * 1.6;
      const tradTopp = mitt.clone().add(V(0, -tjock * 0.4, tjock * 0.3));
      const kula = tradTopp.clone().add(V(0, -ned - R, 0));
      mesh(ror([tradTopp, kula.clone().add(V(0, R, 0))], 0.1, 0.1, '#d9b25a', 3), m('#ffffff', { vertexColors: true, metalness: 0.8, roughness: 0.3 }), g);
      mesh(new THREE.CylinderGeometry(0.6, 0.6, 1, 10).translate(kula.x, kula.y + R + 0.1, kula.z), m('#cfae62', { metalness: 1, roughness: 0.3 }), g);
      mesh(new THREE.SphereGeometry(R, 24, 18).translate(kula.x, kula.y, kula.z), m(guld ? '#d4a838' : '#b0101c', { metalness: guld ? 1 : 0.35, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 }), g);
    }
    return g;
  }

  // ---------- påsk ----------

  // Ett målat ägg med ränder, sicksack eller prickar (mon 0–3), lite spetsigare upptill.
  function aggGeo(k = 1) {
    const e = new THREE.SphereGeometry(1, 22, 16);
    const p = e.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const f = 1 - 0.13 * y;
      p.setXYZ(i, p.getX(i) * f * 2.05 * k, y * 2.75 * k, p.getZ(i) * f * 2.05 * k);
    }
    e.computeVertexNormals();
    return e;
  }
  const AGG_FARG = [['#f6a6c1', '#ffffff', '#c93d74'], ['#ffd23f', '#ffffff', '#e0731f'], ['#8fd2a8', '#ffffff', '#2f8a56'], ['#9cc3f2', '#ffffff', '#3462b8'], ['#c9a8ee', '#fff6c8', '#7344b0'], ['#ff9a5c', '#fff4d8', '#c4401c']];
  function aggTex(i, mon) {
    return once(`agg${i}-${mon}`, () => duk(256, 128, (c, w, h) => {
      const [a, b, d] = AGG_FARG[i % AGG_FARG.length];
      c.fillStyle = a;
      c.fillRect(0, 0, w, h);
      c.fillStyle = b;
      c.strokeStyle = d;
      if (mon === 0) {
        for (const y of [0.28, 0.5, 0.72]) { c.fillStyle = y === 0.5 ? d : b; c.fillRect(0, y * h - 6, w, 12); }
      } else if (mon === 1) {
        c.lineWidth = 7;
        c.strokeStyle = b;
        c.beginPath();
        for (let x = 0; x <= w; x += 16) c.lineTo(x, h * 0.5 + ((x / 16) % 2 ? -12 : 12));
        c.stroke();
        c.fillStyle = d;
        c.fillRect(0, h * 0.24, w, 5);
        c.fillRect(0, h * 0.76 - 5, w, 5);
      } else if (mon === 2) {
        for (let y = 0.2; y < 0.9; y += 0.2) for (let x = 0; x < w; x += 32) {
          c.fillStyle = (x / 32 + y * 5) % 2 < 1 ? b : d;
          c.beginPath();
          c.arc(x + (y * 50) % 32, y * h, 6, 0, 2 * Math.PI);
          c.fill();
        }
      } else {
        c.fillStyle = d;
        c.fillRect(0, h * 0.44, w, h * 0.12);
        for (let x = 8; x < w; x += 32) {
          c.fillStyle = b;
          c.beginPath();
          c.moveTo(x, h * 0.5);
          for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; c.lineTo(x + 9 * Math.cos(a), h * 0.5 + 9 * Math.sin(a)); }
          c.fill();
        }
        c.fillStyle = b;
        c.fillRect(0, h * 0.3, w, 4);
        c.fillRect(0, h * 0.7 - 4, w, 4);
      }
    }));
  }
  // Målade ägg i band (lista: { x, y, z, ned (cm från kroken till ägget), k (storleken) }), med en liten
  // rosett där bandet är fäst i ägget.
  function agg(lista) {
    const g = new THREE.Group();
    const band = [];
    lista.forEach((e, i) => {
      const k = e.k || 1;
      const topp = V(e.x, e.y - e.ned, e.z);
      const ag = mesh(aggGeo(k), m('#ffffff', { map: aggTex(i, i % 4), roughness: 0.38, clearcoat: 0.5 }), g);
      ag.position.copy(topp).add(V(0, -2.65 * k, 0));
      ag.rotation.set((i % 3 - 1) * 6 * DEG, i * 0.9, (i % 2 ? 1 : -1) * 4 * DEG);
      const f = AGG_FARG[(i + 2) % AGG_FARG.length][2];
      band.push(ror([V(e.x, e.y, e.z), V(e.x + 0.2, e.y - e.ned * 0.5, e.z), topp], 0.1, 0.1, f, 4));
      band.push(rosett(f, 0.45).translate(topp.x, topp.y + 0.35, topp.z + 0.4));
    });
    mesh(ihop(band), m('#ffffff', { vertexColors: true, roughness: 0.6 }), g);
    return g;
  }

  // ett vridet blad eller en fjäder: en remsa längs y (längden l, bredden b) som böjer sig bakåt
  function remsa(l, b, bojd, form = (t) => Math.sin(Math.PI * t) ** 0.7) {
    const pos = [];
    const idx = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const w = (b / 2) * form(t);
      const z = bojd * l * t * t;
      pos.push(-w, l * t, z, 0, l * t, z + 0.08 * b, w, l * t, z);
      if (i) {
        const a = (i - 1) * 3;
        idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  // lägg en del (byggd längs y från origo) i p, riktad åt d och vriden runt sig själv
  function rikta(geo, p, d, vrid = 0) {
    geo.rotateY(vrid);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()));
    geo.translate(p.x, p.y, p.z);
    return geo;
  }

  // en vas formad i ett varv (profil: [radie, höjd], cm)
  function vas(profil, mt, p) {
    const v = mesh(new THREE.LatheGeometry(profil.map(([r, y]) => new THREE.Vector2(r, y)), 40), mt, p);
    return v;
  }
  // Kvistar som växer ur vasens hals (y0, radien r0) uppåt och utåt, med några grenar; spetsarna (där
  // fjädrarna och bladen sitter) samlas i ut.
  function kvistar(q, { y0, r0, antal, hojd, farg, ut, grenar = 3, spridd = 0.5 }) {
    const geos = [];
    for (let i = 0; i < antal; i++) {
      const a = (i / antal) * 2 * Math.PI + q() * 0.6;
      const lut = (0.1 + q() * spridd) * (i % 3 === 0 ? 0.5 : 1);
      const d = V(Math.cos(a) * lut, 1, Math.sin(a) * lut * 0.7).normalize();
      const l = hojd * (0.7 + q() * 0.4);
      const start = V(Math.cos(a) * r0 * 0.4, y0 - 6, Math.sin(a) * r0 * 0.4);
      const pts = [start];
      for (let k = 1; k <= 4; k++) pts.push(start.clone().addScaledVector(d, (l * k) / 4).add(V((q() - 0.5) * 1.2, -k * k * 0.25 * lut * 2, (q() - 0.5) * 1.2)));
      geos.push(ror(pts, 0.32, 0.07, farg, 5));
      const kurva = new THREE.CatmullRomCurve3(pts);
      ut.push({ p: pts[4], d: kurva.getTangentAt(1), kurva });
      for (let k = 0; k < grenar; k++) {
        const t = 0.35 + q() * 0.5;
        const p0 = kurva.getPointAt(t);
        const b = q() * 2 * Math.PI;
        const gd = kurva.getTangentAt(t).add(V(Math.cos(b) * 0.7, 0.15, Math.sin(b) * 0.5)).normalize();
        const gl = l * (0.18 + q() * 0.22);
        const p1 = p0.clone().addScaledVector(gd, gl * 0.5).add(V(0, -0.3, 0));
        const p2 = p0.clone().addScaledVector(gd, gl);
        geos.push(ror([p0, p1, p2], 0.13, 0.05, farg, 4));
        ut.push({ p: p2, d: gd });
      }
    }
    return geos;
  }

  // En fjäder (vit, färgen läggs på i hörnen): skaftet och fanet som tonar ut mot kanterna och är fluffigt
  // nedtill, på ett kort som läggs längs kvisten (fjadrar nedan).
  const fjaderTex = () => once('fjader', () => duk(64, 160, (c, w, h) => {
    const q = rnd(3);
    for (let i = 0; i < 260; i++) {
      const t = q();
      const y = h - 8 - t * (h - 16);
      const bred = (w / 2 - 3) * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) ** 0.7;
      const s = q() > 0.5 ? 1 : -1;
      const l = bred * (0.75 + q() * 0.25);
      c.strokeStyle = `rgba(255,255,255,${0.35 + q() * 0.5})`;
      c.lineWidth = 1 + q() * 1.4;
      c.beginPath();
      c.moveTo(w / 2, y);
      c.quadraticCurveTo(w / 2 + s * l * 0.6, y - 2, w / 2 + s * l, y - 4 - q() * 6 - (1 - t) * 6);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,.95)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w / 2, h);
    c.lineTo(w / 2, 6);
    c.stroke();
  }));
  // Fjädrarna: kort med fjädern (lista: [punkt, riktning, längd, färg])
  function fjadrar(lista, q) {
    const pos = [];
    const uv = [];
    const col = [];
    for (const [p, d, l, f] of lista) {
      const sid = new THREE.Vector3().crossVectors(d, V(q() - 0.5, q() - 0.5, 1).normalize()).normalize().multiplyScalar(l * 0.2);
      const t = p.clone().addScaledVector(d, l);
      // (lite böjd: toppen faller bakåt)
      const mitt = p.clone().addScaledVector(d, l * 0.5).add(sid.clone().cross(d).normalize().multiplyScalar(l * 0.06));
      const v = [p.clone().sub(sid), p.clone().add(sid), mitt.clone().add(sid), mitt.clone().sub(sid), t.clone().add(sid), t.clone().sub(sid)];
      const u = [[0, 0], [1, 0], [1, 0.5], [0, 0.5], [1, 1], [0, 1]];
      const c = new THREE.Color(f);
      for (const k of [0, 1, 2, 0, 2, 3, 3, 2, 4, 3, 4, 5]) { pos.push(v[k].x, v[k].y, v[k].z); uv.push(...u[k]); col.push(c.r, c.g, c.b); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return new THREE.Mesh(g, m('#ffffff', { map: fjaderTex(), vertexColors: true, alphaTest: 0.32, roughness: 0.95, side: THREE.DoubleSide }));
  }

  // Påskriset: en tät bukett björkris i en vit glaserad kanna med en blå rand, med fjädrar i klara färger
  // på kvistarna och några små målade ägg som hänger i dem.
  const FJADER = ['#ff4f9a', '#ffd21f', '#3fc24a', '#ff7a1a', '#2f8cff', '#a35cff', '#ff3b3b', '#2fd0c4', '#ffe14d'];
  function paskris() {
    const g = new THREE.Group();
    const q = rnd(41);
    const H = 13;
    vas([[0, 0], [3.8, 0], [4.5, 0.5], [5.1, 2.6], [5.3, 6], [4.6, 9.5], [3.1, 11.6], [2.8, 12.4], [3.3, H], [3, H + 0.1], [2.6, 12.2]], m('#f2efe6', { roughness: 0.22, clearcoat: 0.8 }), g);
    const rand = new THREE.Mesh(new THREE.CylinderGeometry(5.25, 5.28, 1.4, 40, 1, true), m('#2a57a8', { roughness: 0.25, clearcoat: 0.8 }));
    rand.position.y = 5;
    g.add(rand);
    const spetsar = [];
    const geos = kvistar(q, { y0: H, r0: 2.6, antal: 17, hojd: 29, farg: '#3a2420', ut: spetsar, grenar: 2, spridd: 0.32 });
    mesh(ihop(geos), m('#ffffff', { vertexColors: true, roughness: 0.7 }), g);
    // fjädrarna: en eller två vid varje spets, och fler längs kvistarna
    const lista = [];
    spetsar.forEach((s, i) => {
      const f = FJADER[Math.floor(q() * FJADER.length)];
      const d = s.d.clone().add(V((q() - 0.5) * 1.4, -0.1 - q() * 0.5, (q() - 0.5) * 1.2)).normalize();
      lista.push([s.p.clone().addScaledVector(d, -1), d, 5.2 + q() * 2, f]);
      if (q() < 0.45) {
        const d2 = s.d.clone().add(V((q() - 0.5) * 2, -0.9, 0.3 + q() * 0.6)).normalize();
        lista.push([s.p.clone().add(V(0, -3 - q() * 4, 0)), d2, 4.4 + q() * 1.5, FJADER[(i + 4) % FJADER.length]]);
      }
    });
    g.add(fjadrar(lista, q));
    // några små ägg i band från kvistarna, högt upp bland fjädrarna och framåt
    const krokar = spetsar.filter((x) => x.kurva && x.p.z > -1).slice(0, 4);
    if (krokar.length) g.add(agg(krokar.map((x, i) => ({ ...x.kurva.getPointAt(0.62 + (i % 2) * 0.12), ned: 1.6, k: 0.62 }))));
    return g;
  }

  // ---------- midsommar ----------

  // Vimplar i ett snöre mellan krokarna: trianglar i tyg i färgerna om vartannat, lite vridna.
  function vimplar(krokar, { s = 5, farger = ['#0b5aa6', '#f2c200'], b = 7, h = 9, mellan = 8.5 } = {}) {
    const g = new THREE.Group();
    const q = rnd(57);
    const bana = new THREE.CatmullRomCurve3(bagar(krokar, s));
    const L = bana.getLength();
    const delar = [];
    const n = Math.floor(L / mellan);
    for (let i = 0; i < n; i++) {
      const t0 = (i + 0.08) / n;
      const t1 = (i + 0.08) / n + (b / L);
      const a = bana.getPointAt(Math.min(1, t0));
      const c = bana.getPointAt(Math.min(1, t1));
      const mitt = a.clone().lerp(c, 0.5);
      const spets = mitt.clone().add(V((q() - 0.5) * 0.8, -h, (q() - 0.5) * 1.6));
      // tyget: en triangel i några rader, så att den kan bukta lite
      const pos = [];
      const idx = [];
      const R = 4;
      for (let j = 0; j <= R; j++) {
        const u = j / R;
        const l = a.clone().lerp(spets, u);
        const r = c.clone().lerp(spets, u);
        const buk = Math.sin(Math.PI * u) * 0.5 * (q() - 0.3);
        l.z += buk;
        r.z += buk;
        pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
        if (j) idx.push((j - 1) * 2, (j - 1) * 2 + 1, j * 2, (j - 1) * 2 + 1, j * 2 + 1, j * 2);
      }
      const tri = new THREE.BufferGeometry();
      tri.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      tri.setIndex(idx);
      tri.computeVertexNormals();
      delar.push(farga(tri, farger[i % farger.length]));
    }
    mesh(ihop(delar), m('#ffffff', { vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), g);
    mesh(ror(bana.getPoints(80), 0.12, 0.12, '#f4efe2', 4), m('#ffffff', { vertexColors: true, roughness: 0.8 }), g);
    return g;
  }

  // Blommorna: en glasburk med vatten och en tät bukett prästkragar, blåklint och smörblommor, med några
  // björkkvistar och strån.
  function blommor() {
    const g = new THREE.Group();
    const q = rnd(71);
    const H = 12;
    vas([[0, 0], [4.4, 0], [4.8, 0.5], [4.9, 10], [4.4, 11.2], [4.2, H], [4.6, H + 0.4], [4.3, H + 0.5], [3.9, 11.4]], new THREE.MeshPhysicalMaterial({ color: '#e4efe6', transparent: true, opacity: 0.32, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }), g);
    const vatten = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.3, 8, 32), new THREE.MeshPhysicalMaterial({ color: '#9fc8a8', transparent: true, opacity: 0.32, roughness: 0.1, depthWrite: false }));
    vatten.position.y = 4.3;
    g.add(vatten);
    const spetsar = [];
    const stjalk = kvistar(q, { y0: H, r0: 3, antal: 22, hojd: 17, farg: '#4f7f2e', ut: spetsar, grenar: 0, spridd: 0.58 });
    const bjork = [];
    const kvist = kvistar(q, { y0: H, r0: 3, antal: 3, hojd: 23, farg: '#6b4a3a', ut: bjork, grenar: 3, spridd: 0.55 });
    const blad = [];
    const blom = [];
    // björkbladen: ljusgröna blad längs kvistarna
    bjork.forEach((s) => {
      for (let k = 0; k < 6; k++) {
        const d = s.d.clone().add(V((q() - 0.5) * 1.8, (q() - 0.6) * 1.2, (q() - 0.5) * 1.8)).normalize();
        const p = s.p.clone().add(V((q() - 0.5) * 3, -k * 1.5, (q() - 0.5) * 2));
        blad.push(farga(rikta(remsa(3, 2.2, 0.1, (t) => Math.sin(Math.PI * t ** 0.8) ** 0.8), p, d, q() * 3), q() > 0.5 ? '#7fbf3f' : '#94cf4a'));
      }
    });
    // strån
    for (let k = 0; k < 9; k++) {
      const a = q() * 2 * Math.PI;
      const d = V(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.3).normalize();
      blad.push(farga(rikta(remsa(14 + q() * 6, 0.45, -0.15), V(Math.cos(a) * 1.5, H - 3, Math.sin(a) * 1.5), d, q() * 3), q() > 0.5 ? '#6c9a3a' : '#87a94a'));
    }
    spetsar.forEach((s, i) => {
      // (flest prästkragar)
      const typ = [0, 1, 0, 2, 0, 1, 2, 0, 1][i % 9];
      const p = s.p;
      const d = s.d.clone().add(V(0, 0.4, 0.55)).normalize();
      if (typ === 0) {
        // prästkrage: vita kronblad kring en gul mitt
        const nb = 18;
        for (let k = 0; k < nb; k++) {
          const a = (k / nb) * 2 * Math.PI;
          const geo = remsa(3.5, 0.9, -0.05, (t) => Math.min(1, t * 4) * (1 - t * 0.3));
          geo.rotateX(-82 * DEG);
          geo.rotateY(-a + Math.PI / 2);
          blom.push({ geo, p, d, f: k % 2 ? '#fbfaf3' : '#f1efe4' });
        }
        blom.push({ geo: new THREE.SphereGeometry(1.3, 12, 8).scale(1, 0.45, 1), p, d, f: '#f2c21c' });
      } else if (typ === 1) {
        // blåklint: en krans av blå flikar kring en mörkare mitt
        for (let k = 0; k < 11; k++) {
          const a = (k / 11) * 2 * Math.PI;
          const geo = new THREE.ConeGeometry(0.8, 2.6, 5);
          geo.translate(0, 1.3, 0);
          geo.rotateZ(-62 * DEG);
          geo.rotateY(a);
          blom.push({ geo, p, d, f: k % 2 ? '#2f5fd1' : '#3f78ec' });
        }
        blom.push({ geo: new THREE.SphereGeometry(1, 8, 6), p, d, f: '#24479c' });
      } else {
        // smörblomma: en gul skål av fem blanka blad
        for (let k = 0; k < 5; k++) {
          const geo = remsa(2, 2.1, 0.25, (t) => Math.sin(Math.PI * (0.15 + 0.85 * t)) ** 0.6);
          geo.rotateX(-35 * DEG);
          geo.rotateY((k / 5) * 2 * Math.PI);
          blom.push({ geo, p, d, f: '#ffd51a' });
        }
      }
      // ett par smala blad på stjälken
      blad.push(farga(rikta(remsa(4, 0.6, 0.25), p.clone().add(V(0, -5 - q() * 4, 0)), s.d.clone().add(V((q() - 0.5) * 2, 0.2, (q() - 0.5) * 2)), q() * 3), '#5c8f34'));
    });
    const blomGeo = blom.map(({ geo, p, d, f }) => {
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d));
      geo.translate(p.x, p.y, p.z);
      return farga(geo, f);
    });
    mesh(ihop([...stjalk, ...kvist]), m('#ffffff', { vertexColors: true, roughness: 0.75 }), g);
    mesh(ihop([...blad, ...blomGeo]), m('#ffffff', { vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), g);
    return g;
  }

  // ---------- kräftskivan ----------

  // Kräftlyktorna: veckade pappersklot i gult och orange med fullmånens ansikte, som lyser inifrån, i
  // ett snöre mellan krokarna (lyktor: [t längs snöret (0–1), storleken, ansiktet]).
  function lyktaTex(farg, typ) {
    return once(`lykta${farg}${typ}`, () => duk(512, 256, (c, w, h) => {
      c.fillStyle = farg;
      c.fillRect(0, 0, w, h);
      // ansiktet framåt (u = 0,25)
      const x = w * 0.25;
      const y = h * 0.5;
      const k = h / 256;
      c.strokeStyle = '#7a3a10';
      c.fillStyle = '#7a3a10';
      c.lineCap = 'round';
      c.lineWidth = 5 * k;
      // ögonen: glada bågar, eller ett öga som blinkar
      c.beginPath();
      c.arc(x - 26 * k, y - 14 * k, 9 * k, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
      c.beginPath();
      if (typ === 1) {
        c.moveTo(x + 17 * k, y - 16 * k);
        c.lineTo(x + 35 * k, y - 16 * k);
      } else c.arc(x + 26 * k, y - 14 * k, 9 * k, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
      // näsan och munnen
      c.beginPath();
      c.moveTo(x, y - 6 * k);
      c.quadraticCurveTo(x + 7 * k, y + 8 * k, x - 2 * k, y + 10 * k);
      c.stroke();
      c.beginPath();
      c.arc(x, y + 6 * k, 24 * k, Math.PI * 0.2, Math.PI * 0.8);
      c.stroke();
      // kinderna
      c.fillStyle = 'rgba(230,80,40,.35)';
      for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * 38 * k, y + 10 * k, 11 * k, 7 * k, 0, 0, 2 * Math.PI); c.fill(); }
      // några kratrar på månen
      c.fillStyle = 'rgba(160,90,10,.18)';
      for (const [dx, dy, r] of [[-60, -40, 10], [55, 34, 8], [-48, 44, 6], [70, -30, 5], [140, 10, 14], [-150, -20, 12], [200, 40, 9]]) { c.beginPath(); c.arc(x + dx * k, y + dy * k, r * k, 0, 2 * Math.PI); c.fill(); }
      // vecken i papperet
      for (let yy = 0; yy < h; yy += 7 * k) { c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(0, yy, w, 2 * k); }
    }));
  }
  function lyktor(krokar, lista, { s = 4 } = {}) {
    const g = new THREE.Group();
    const bana = new THREE.CatmullRomCurve3(bagar(krokar, s));
    mesh(ror(bana.getPoints(90), 0.1, 0.1, '#2b2724', 4), m('#ffffff', { vertexColors: true, roughness: 0.6 }), g);
    const sk = [];
    const FARGER = ['#f7c531', '#f39a26', '#f7d046', '#ee7f22'];
    lista.forEach(([t, R, typ], i) => {
      const fast = bana.getPointAt(t);
      const ned = 1.6;
      const mitt = fast.clone().add(V(0, -ned - R * 0.92, 0));
      // klotet med veck: radien går upp och ned i tunna ringar
      const geo = new THREE.SphereGeometry(R, 40, 40);
      const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const v = V(p.getX(k), p.getY(k), p.getZ(k));
        const th = Math.acos(Math.max(-1, Math.min(1, v.y / R)));
        const f = (1 - 0.035 * (0.5 + 0.5 * Math.cos(th * 34))) * (1 - 0.12 * Math.abs(Math.cos(th)) ** 6);
        v.multiplyScalar(f);
        v.y *= 0.92;
        p.setXYZ(k, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const tex = lyktaTex(FARGER[i % FARGER.length], typ);
      const papper = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.62, roughness: 0.95 });
      const l = mesh(geo, papper, g);
      l.position.copy(mitt);
      l.rotation.y = (i % 2 ? 1 : -1) * 10 * DEG;
      // ringarna upptill och nedtill, och tråden till snöret
      const ring = m('#2a2420', { metalness: 0.5, roughness: 0.5 });
      for (const sy of [1, -1]) {
        const r = mesh(new THREE.TorusGeometry(R * 0.28, 0.18, 6, 20), ring, g);
        r.rotation.x = 90 * DEG;
        r.position.copy(mitt).add(V(0, sy * R * 0.86, 0));
      }
      mesh(ror([fast, mitt.clone().add(V(0, R * 0.86, 0))], 0.08, 0.08, '#2a2420', 3), ring, g);
      sk.push([mitt.clone().add(V(0, 0, -R * 0.6)), R * 2.6, '#ffb347', 0.45]);
      g.userData.ljus = (g.userData.ljus || []).concat([{ p: mitt.clone(), r: R * 2.6, farg: '255, 186, 90' }]);
    });
    sken(sk, g);
    return g;
  }

  // ---------- halloween ----------

  // Pumpan: räfflad och orange, med ett utskuret ansikte där ljuset inuti lyser ut, och stjälken.
  function pumpa({ R = 12 } = {}) {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(R, 64, 40);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const v = V(p.getX(k), p.getY(k), p.getZ(k));
      const a = Math.atan2(v.z, v.x);
      const y = v.y / R;
      const ras = 1 - 0.075 * Math.abs(Math.sin(a * 5)) ** 0.6 * (1 - y * y);
      v.x *= ras * 1.08;
      v.z *= ras * 1.08;
      v.y *= 0.8;
      // gropen upptill och nedtill
      v.y -= 2.4 * Math.exp(-((v.x * v.x + v.z * v.z) / (R * R * 0.05))) * Math.sign(y);
      p.setXYZ(k, v.x, v.y + R * 0.8, v.z);
    }
    geo.computeVertexNormals();
    const S = 512;
    // ansiktet framåt (u = 0,25 i klotets karta): ögon, näsa och ett tandat leende
    const ansikte = (c, w, h) => {
      const x = w * 0.25;
      const y = h * 0.52;
      const k = w / 512;
      c.beginPath();
      for (const s of [-1, 1]) {
        c.moveTo(x + s * 18 * k, y - 22 * k);
        c.lineTo(x + s * 50 * k, y - 18 * k);
        c.lineTo(x + s * 34 * k, y - 52 * k);
        c.closePath();
      }
      c.moveTo(x, y - 14 * k);
      c.lineTo(x - 9 * k, y + 2 * k);
      c.lineTo(x + 9 * k, y + 2 * k);
      c.closePath();
      c.moveTo(x - 62 * k, y + 12 * k);
      const tander = [[-44, 24], [-36, 16], [-24, 30], [-12, 22], [0, 34], [12, 22], [24, 30], [36, 16], [44, 24], [62, 12]];
      for (const [dx, dy] of tander) c.lineTo(x + dx * k, y + dy * k);
      c.quadraticCurveTo(x + 40 * k, y + 70 * k, x, y + 72 * k);
      c.quadraticCurveTo(x - 40 * k, y + 70 * k, x - 62 * k, y + 12 * k);
      c.fill();
    };
    const farg = once('pumpa-f', () => duk(S, S / 2, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#b4500c');
      gr.addColorStop(0.5, '#e8741a');
      gr.addColorStop(1, '#a5460b');
      c.fillStyle = gr;
      c.fillRect(0, 0, w, h);
      // räfflorna mörkare, med strimmor
      for (let i = 0; i < 10; i++) {
        const x = (i / 10) * w + w / 40;
        const r = c.createLinearGradient(x - w / 20, 0, x + w / 20, 0);
        r.addColorStop(0, 'rgba(90,30,0,.0)');
        r.addColorStop(0.5, 'rgba(90,30,0,.35)');
        r.addColorStop(1, 'rgba(90,30,0,0)');
        c.fillStyle = r;
        c.fillRect(x - w / 20, 0, w / 10, h);
      }
      c.fillStyle = '#3a1604';
      ansikte(c, w, h);
    }));
    const glod = once('pumpa-g', () => duk(S, S / 2, (c, w, h) => {
      c.fillStyle = '#000000';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffb43c';
      c.shadowColor = '#ff8a1c';
      c.shadowBlur = 10;
      ansikte(c, w, h);
    }));
    mesh(geo, m('#ffffff', { map: farg, emissive: '#ffffff', emissiveMap: glod, roughness: 0.55, clearcoat: 0.3 }), g);
    mesh(ror([V(0, R * 1.5, 0), V(0.6, R * 1.75, 0.2), V(2.4, R * 2.0, 0.4)], 1.2, 0.7, '#5a5a2a', 8), m('#ffffff', { vertexColors: true, roughness: 0.8 }), g);
    sken([[V(0, R * 0.75, R * 1.15), R * 2.2, '#ff9a2a', 0.38]], g);
    sken([[V(0, 0.05, R * 0.9), R * 2.2, '#ff8a1c', 0.3]], g, true);
    g.userData.ljus = [{ p: V(0, R * 0.8, R * 0.5), r: R * 3, farg: '255, 140, 40' }];
    return g;
  }

  // Spindelnätet i ett hörn (hörnet i origo, väggarna längs x åt höger och y nedåt; b: hur långt det når),
  // med en spindel som hänger i en tråd (spindel cm under navet).
  function vav({ b = 30, spindel = 24 } = {}) {
    const g = new THREE.Group();
    const q = rnd(83);
    const nav = V(b * 0.42, -b * 0.4, 0);
    const N = 11;
    const ekrar = [];
    const tradar = [];
    const TRAD = '#f4f4f2';
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 2 * Math.PI + 0.25 + (q() - 0.5) * 0.2;
      const d = V(Math.cos(a), Math.sin(a), 0);
      let l = b * 0.6 * (0.85 + q() * 0.3);
      let kant = false;
      // (ut till överkanten, y = 0, eller den vänstra kanten, x = 0)
      if (d.y > 0.01 && -nav.y / d.y < l) { l = -nav.y / d.y; kant = true; }
      if (d.x < -0.01 && -nav.x / d.x < l) { l = -nav.x / d.x; kant = true; }
      ekrar.push({ d, l, kant, slut: nav.clone().addScaledVector(d, l) });
      tradar.push(ror([nav, nav.clone().addScaledVector(d, l)], 0.13, 0.13, TRAD, 3));
    }
    // ramen mellan de ekrar som slutar i luften, och spiralen
    for (let i = 0; i < N; i++) {
      const e0 = ekrar[i];
      const e1 = ekrar[(i + 1) % N];
      if (!e0.kant || !e1.kant) tradar.push(ror([e0.slut, e0.slut.clone().lerp(e1.slut, 0.5).lerp(nav, 0.08), e1.slut], 0.13, 0.13, TRAD, 3));
      for (let r = 2; ; r += 2.1 + r * 0.05) {
        const r1 = r + 2.1 / N;
        if (r1 > Math.min(e0.l, e1.l) * 0.93) break;
        const p0 = nav.clone().addScaledVector(e0.d, r);
        const p1 = nav.clone().addScaledVector(e1.d, r1);
        tradar.push(ror([p0, p0.clone().lerp(p1, 0.5).lerp(nav, 0.05), p1], 0.1, 0.1, TRAD, 3));
      }
    }
    const silke = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, toneMapped: false });
    silke.userData.morkna = true;
    g.add(new THREE.Mesh(ihop(tradar), silke));
    // spindeln i sin tråd
    const sp = V(nav.x + 1.5, nav.y - spindel, 0.8);
    const kropp = [];
    kropp.push(farga(new THREE.SphereGeometry(2, 14, 10).scale(1, 1.2, 0.9).translate(sp.x, sp.y - 1.3, sp.z), '#141012'));
    kropp.push(farga(new THREE.SphereGeometry(0.9, 12, 8).translate(sp.x, sp.y + 0.9, sp.z), '#1d1719'));
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const y = sp.y + 0.8 - k * 0.55;
        kropp.push(ror([V(sp.x + s * 0.6, y, sp.z), V(sp.x + s * 2.4, y + 1.2 - k * 0.3, sp.z + 0.4), V(sp.x + s * 3.2, y - 1.6 - k * 0.5, sp.z + 0.2)], 0.16, 0.09, '#141012', 4));
      }
    }
    mesh(ihop(kropp), m('#ffffff', { vertexColors: true, roughness: 0.35, clearcoat: 0.6 }), g);
    g.add(new THREE.Mesh(ror([V(sp.x, nav.y - 1.2, 0.3), V(sp.x, sp.y + 1.6, sp.z)], 0.06, 0.06, TRAD, 3), silke));
    return g;
  }

  return { stjarna, ljusstake, girlang, agg, paskris, vimplar, blommor, lyktor, pumpa, vav };
}

// Mörkret (0–1, lysröret släckt) på pyntet: det som inte lyser mörknar som väggen, och skenet kring det
// som lyser blir starkare.
export function pyntNatt(grupp, g) {
  grupp.traverse((x) => {
    if (!x.material) return;
    for (const mt of [].concat(x.material)) {
      if (mt.userData.morkna) {
        if (!mt.userData.dag) mt.userData.dag = mt.color.clone();
        mt.color.copy(mt.userData.dag).multiplyScalar(1 - 0.6 * g);
      } else if (mt.userData.sken) {
        if (mt.userData.dagO == null) mt.userData.dagO = mt.opacity;
        mt.opacity = mt.userData.dagO + (1 - mt.userData.dagO) * g;
      }
    }
  });
}
