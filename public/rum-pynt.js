// Högtidspyntet i tobaksaffären (rum-inredning.js) och i baren bakom Hasse Backe (rum-hasse-3d.js): runt
// högtiderna pyntar affären, och pyntet sitter uppe längre än gängets högtidskläder (rum-fest.js), som en
// affär pyntar – före och en bit efter, inte bara på dagen.
//
//   jul         fredagen före första advent (julskyltningen) till tjugondag Knut (13 januari): en
//               adventsstjärna i papper som lyser i fönstret, en granrisgirlang med ljus, röda kulor och
//               rosetter längs fönstrets överkant, och en elektrisk adventsljusstake på bardisken; sedan
//               2026-11-28 också pappersflingor och konstsnö på glaset och en ljusstake på fönsterbänken, ut
//               mot gatan (granen och girlangen ute på fasaden ritar rum-fasad.js)
//   pask        lördagen före palmsöndagen till tisdagen efter annandag påsk: målade ägg i band i fönstret
//               och påskris med fjädrar i en vas på bardisken
//   midsommar   måndagen i midsommarveckan till söndagen efter midsommarafton: vimplar i blått och gult
//               längs fönstrets överkant och en burk med prästkragar, blåklint, smörblommor och björkris
//   kraftor     kräftpremiären (andra onsdagen i augusti, som på nittiotalet) till sista augusti:
//               kräftlyktor – fullmånar med ansikten – längs fönstrets överkant
//   halloween   veckan före alla helgons dag och dagen själv: en urholkad pumpa som lyser på bardisken och
//               ett spindelnät med en spindel i fönstrets hörn
//
//   nyar        29 december – 2 januari: julpyntet sitter kvar, och serpentiner hänger från girlangen
//
// Fler saker (2026-11-16): en julkrans och halmstjärnor (en julbock och ballonger till nyår hos Hasse),
// en påskkrans och påskkycklingar, lövruskor av björk vid dörren (en liten midsommarstång hos Hasse), ett
// fat med kräftor och en flaska brännvin med snapsglas, och fladdermöss i papper.
//
// Dagen är Stockholms (Vader.nu(), som ölen, fikat och högtidskläderna). Lucian ligger inom julpyntet, som
// i en vanlig affär.
//
// pyntet(v) → 'jul' | 'nyar' | 'pask' | 'midsommar' | 'kraftor' | 'halloween' | null (v = Vader.nu());
//   ?rum-pynt=<namn> för bilder (?rum-pynt=inget: inget)
// pyntSaker(mat) → { stjarna, ljusstake, girlang, snoflingor, konstsno, agg, paskris, vimplar, blommor, lyktor, pumpa, vav, krans,
//   halmstjarna, julbock, serpentiner, ballonger, kycklingar, bjorkris, stang, kraftfat, fladdermoss }
// pyntNatt(grupp, g) → pyntet i mörkret g (0–1)
//
// Sakerna byggs i centimeter med y uppåt och z mot betraktaren; den som ställer dem skalar gruppen.
// Det som lyser (glödlamporna, stjärnan, lyktorna och pumpan) lyser av sig själv och har ett sken
// omkring sig (sken); det andra mörknar med lysröret (natt i rum-inredning.js: userData.morkna).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fromPask } from './rum-fika.js';

export const PYNT = ['jul', 'nyar', 'pask', 'midsommar', 'kraftor', 'halloween'];

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
  if ((m === 12 && d >= 29) || (m === 1 && d <= 2)) return 'nyar';
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
    // (från båda hållen: fasaden ser pyntet utifrån, pyntUtifran i rum-inredning.js)
    const mt = new THREE.MeshBasicMaterial({ map: skenTex(), vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
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
  // En yta mellan två rader punkter (a och b lika långa), med färgen i hörnen: band, öglor och vimplar.
  function yta(a, b, farg) {
    const pos = [];
    const idx = [];
    for (let i = 0; i < a.length; i++) {
      pos.push(a[i].x, a[i].y, a[i].z, b[i].x, b[i].y, b[i].z);
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return farga(g, farg);
  }
  // En rosett av ett brett band (färgen, storleken k): två öglor som droppar ut från knuten, med bandets
  // breda sida mot betraktaren och en grop mot hålet, så att de får ljus och skugga, och två band som hänger
  // med lite vridning och ett snett snitt i änden. Förut två ringar (torusar), som såg ut som öglor av
  // ståltråd. Mitten (knuten) i origo, framsidan mot +z.
  function rosett(farg, k = 1) {
    const g = [];
    const n = 18;
    for (const s of [-1, 1]) {
      const yttre = [];
      const inre = [];
      const L = 2.9 * k;
      const H = 2.3 * k;
      const mitt = V(s * L * 0.55, 0, 0);
      for (let i = 0; i <= n; i++) {
        const th = (i / n) * 2 * Math.PI;
        const u = (1 - Math.cos(th)) / 2;
        const p = V(s * L * u, (H / 2) * Math.sin(th) * u ** 0.45, 0.55 * k * u);
        // (lite uppåt, som en rosett som sitter)
        p.applyAxisAngle(V(0, 0, 1), s * 14 * DEG);
        const q = p.clone().lerp(mitt.clone().applyAxisAngle(V(0, 0, 1), s * 14 * DEG), 0.62 * Math.min(1, u * 3));
        q.z -= 0.7 * k * Math.min(1, u * 2.5);
        yttre.push(p);
        inre.push(q);
      }
      g.push(yta(s > 0 ? yttre : inre, s > 0 ? inre : yttre, farg));
      // bandet: tre punkter i bredd, så att änden kan skäras snett (en V)
      const T = 3.8 * k;
      const b = 0.95 * k;
      const rad = [[], [], []];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const c = V(s * (0.25 + 1.1 * t) * k, -0.2 * k - T * t, 0.2 * k * Math.sin(Math.PI * t));
        const vr = s * 0.55 * t;
        const w = V(Math.cos(vr) * b * 0.5, 0, Math.sin(vr) * b * 0.5);
        const v = i === 6 ? 0.5 * b : 0;
        rad[0].push(c.clone().sub(w));
        rad[1].push(c.clone().add(V(0, v, 0)));
        rad[2].push(c.clone().add(w));
      }
      g.push(yta(rad[0], rad[1], farg), yta(rad[1], rad[2], farg));
    }
    // knuten
    g.push(farga(new THREE.SphereGeometry(0.62 * k, 10, 8).scale(0.95, 1.05, 0.65).translate(0, 0, 0.3 * k), farg));
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
  // Barr längs en kurva (bana, sluten för en krans): kvistar av gran (kort med granris) som pekar utåt och
  // framåt längs kurvan, som i en bunden girlang, kring en mörkgrön kärna. → { fr (kurvans ramar), n }
  function barr(g, bana, { tjock, q, slutet = false, steg = 0.7, per = 4 }) {
    const L = bana.getLength();
    const n = Math.round(L / steg);
    const fr = bana.computeFrenetFrames(n, slutet);
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
      const p = bana.getPointAt((i % (n + (slutet ? 0 : 1))) / n);
      const T = fr.tangents[i % fr.tangents.length];
      for (let k = 0; k < per; k++) {
        const a = q() * 2 * Math.PI;
        N1.copy(fr.normals[i % fr.normals.length]).multiplyScalar(Math.cos(a)).addScaledVector(fr.binormals[i % fr.binormals.length], Math.sin(a));
        dir.copy(N1).multiplyScalar(0.62).addScaledVector(T, 0.78 + (q() - 0.5) * 0.4).normalize();
        sid.crossVectors(dir, N1).normalize().applyAxisAngle(dir, (q() - 0.5) * 1.2);
        // (de första korten i varje led är kortare och mörkare: djupet inne i riset, så att girlangen och
        // kransen blir fylliga och inte platta)
        const inre = k < per / 3;
        const l = tjock * (inre ? 0.75 : 1.05 + q() * 0.45);
        const ljus = inre ? 0.4 + q() * 0.16 : 0.74 + q() * 0.5;
        kort(p.clone().addScaledVector(N1, 0.6), dir, sid, l, l * 0.6, new THREE.Color(ljus, ljus * (0.95 + q() * 0.1), ljus));
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    mesh(geo, m('#ffffff', { map: granris(), vertexColors: true, alphaTest: 0.45, roughness: 0.8, side: THREE.DoubleSide }), g);
    mesh(ror(bana.getPoints(slutet ? 80 : 120), tjock * 0.32, tjock * 0.32, '#17351f', 6), m('#ffffff', { vertexColors: true, roughness: 0.9 }), g);
    return { fr, n, L };
  }
  // En kotte (storleken k, längs y, mitten i origo): fjällen i förskjutna ringar som står ut, ljusa i kanten
  // och mörka i springorna (färgen i hörnen).
  function kotte(k = 1) {
    const g = new THREE.SphereGeometry(1, 12, 14);
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    const mork = new THREE.Color('#2e1a0c');
    const ljus = new THREE.Color('#8a5a32');
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const a = Math.atan2(p.getZ(i), p.getX(i));
      const f = Math.max(0, Math.sin((y + 1) * 10 + Math.sin(a * 3) * 1.2));
      const r = (1 + 0.22 * f) * (1 - 0.25 * Math.max(0, y) ** 2);
      p.setXYZ(i, p.getX(i) * r * 1.25 * k, y * 2 * k, p.getZ(i) * r * 1.25 * k);
      c.set(mork.clone().lerp(ljus, f ** 0.6).toArray(), i * 3);
    }
    g.computeVertexNormals();
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    g.deleteAttribute('uv');
    return g;
  }
  function girlang(krokar, { s = 6, tjock = 5.5, utan = [] } = {}) {
    const g = new THREE.Group();
    const q = rnd(23);
    const bana = new THREE.CatmullRomCurve3(bagar(krokar, s));
    const { fr, n, L } = barr(g, bana, { tjock, q, per: 6 });
    // lamporna i en slinga runt girlangen
    const lampor = [];
    const sk = [];
    const nl = Math.round(L / 4.6);
    for (let i = 0; i < nl; i++) {
      const t = (i + 0.5) / nl;
      const j = Math.round(t * n);
      const a = i * 2.3;
      const mitt = bana.getPointAt(t);
      const p = mitt.clone().addScaledVector(fr.normals[j], Math.cos(a) * tjock * 0.75).addScaledVector(fr.binormals[j], Math.sin(a) * tjock * 0.75);
      // (de som hamnar bakom girlangen syns inte)
      if (p.z < mitt.z - tjock * 0.1) continue;
      lampor.push(farga(new THREE.SphereGeometry(0.58, 8, 6).translate(p.x, p.y, p.z), '#fff6dc'));
      sk.push([p.clone().add(V(0, 0, 0.8)), 3.4, '#ffcf7a', 0.75]);
    }
    if (lampor.length) {
      g.add(new THREE.Mesh(ihop(lampor), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
      sken(sk, g);
    }
    // rosetterna och kulorna
    const sammet = m('#ffffff', { vertexColors: true, roughness: 0.8, sheen: 0.6, sheenColor: '#d42a2a', sheenRoughness: 0.5, side: THREE.DoubleSide });
    krokar.forEach((k, i) => {
      const r = new THREE.Mesh(rosett('#8c0c16', 2.1), sammet);
      r.position.copy(k).add(V(0, -1, tjock * 0.85));
      r.rotation.z = (i % 2 ? 1 : -1) * 5 * DEG;
      r.castShadow = true;
      g.add(r);
    });
    // Kulorna: i varje båge en klase om två eller tre som hänger olika långt, och små kulor som ligger i
    // riset vid rosetterna; röda i glas och guld i metall, alla i två nät (förut tre nät per kula), med
    // trådarna och hättorna i ett tredje. Kottar ligger i riset mitt i bågarna.
    const roda = [];
    const gulda = [];
    const hattor = [];
    const kottar = [];
    const kula = (p, R, guld, trad) => {
      (guld ? gulda : roda).push(farga(new THREE.SphereGeometry(R, 20, 14).translate(p.x, p.y, p.z), guld ? '#d6aa3c' : ['#b0101c', '#9a0c18', '#c0182a'][Math.round(R * 7) % 3]));
      hattor.push(farga(new THREE.CylinderGeometry(R * 0.24, R * 0.24, R * 0.32, 8).translate(p.x, p.y + R * 0.98, p.z), '#cfae62'));
      if (trad) hattor.push(ror([trad, p.clone().add(V(0, R * 1.1, 0))], 0.09, 0.09, '#d9b25a', 3));
    };
    for (let i = 0; i < krokar.length - 1; i++) {
      const mitt = bage(krokar[i], krokar[i + 1], s, 2)[1];
      const topp = mitt.clone().add(V(0, -tjock * 0.4, tjock * 0.3));
      if (!utan.includes(i)) {
        const klase = i % 2 ? [[0, 6.5, 3.1, false], [-2.6, 3.2, 2.2, true], [2.8, 4.2, 1.9, false]] : [[0, 5.5, 2.9, true], [-2.4, 3.6, 2.1, false], [2.6, 2.6, 2.3, true]];
        for (const [dx, ned, R, guld] of klase) {
          const t = topp.clone().add(V(dx * 0.4, 0, dx * 0.05));
          kula(t.clone().add(V(dx, -ned - R, 0.3 * Math.abs(dx))), R, guld, t);
        }
      }
      // en kotte i riset
      const kp = mitt.clone().add(V((i % 2 ? 1 : -1) * 4, -tjock * 0.15, tjock * 0.7));
      kottar.push(kotte(0.85).rotateZ((i % 2 ? -1 : 1) * 70 * DEG).rotateX(-20 * DEG).translate(kp.x, kp.y, kp.z));
    }
    // små kulor i riset vid rosetterna
    krokar.forEach((k, i) => {
      if (i === 0 || i === krokar.length - 1) return;
      for (const sx of [-1, 1]) kula(k.clone().add(V(sx * 6.5, -2.4 - (i % 2), tjock * 0.6)), 1.5, (i + (sx > 0 ? 1 : 0)) % 2 === 0, null);
    });
    if (roda.length) mesh(ihop(roda), m('#ffffff', { vertexColors: true, metalness: 0.35, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06 }), g);
    if (gulda.length) mesh(ihop(gulda), m('#ffffff', { vertexColors: true, metalness: 1, roughness: 0.24 }), g);
    mesh(ihop(hattor), m('#ffffff', { vertexColors: true, metalness: 0.9, roughness: 0.3 }), g);
    mesh(ihop(kottar), m('#ffffff', { vertexColors: true, roughness: 0.85 }), g);
    return g;
  }

  // Snöflingor klippta i papper (2026-11-28), tejpade på glaset: vikta i sex och klippta som i skolan, med
  // grenar på armarna och hål i mitten och längs armarna. Fyra sorter i en karta (2 × 2) med en bit tejp
  // upptill, och varje flinga är en enda platt ruta (två trianglar), alla i ett nät. Papperet syns från båda
  // hållen (fasaden ser dem bakifrån). lista: [{ x, y, z, R, typ (0–3), vrid }], mitten i (x, y, z).
  const flingTex = () => once('flingor', () => duk(512, 512, (c, S) => {
    const T = S / 2;
    const SORT = [
      { grenar: [[0.42, 0.3], [0.68, 0.2]], mitt: 0.26, b: 0.15 },
      { grenar: [[0.32, 0.36], [0.58, 0.26], [0.8, 0.13]], mitt: 0.2, b: 0.11 },
      { grenar: [[0.5, 0.42]], mitt: 0.4, b: 0.17, ring: true },
      { grenar: [[0.28, 0.18], [0.48, 0.28], [0.7, 0.2]], mitt: 0.18, b: 0.13 },
    ];
    SORT.forEach((s, k) => {
      const R = T * 0.42;
      c.save();
      c.translate((k % 2) * T + T / 2, Math.floor(k / 2) * T + T / 2);
      c.rotate(k * 0.4);
      // (en svag skugga i kanten, så att papperet syns mot ett ljust glas)
      c.shadowColor = 'rgba(60,50,40,.35)';
      c.shadowBlur = 2;
      c.fillStyle = '#f7f4ec';
      c.strokeStyle = '#f7f4ec';
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i * Math.PI) / 3);
        c.lineWidth = R * s.b;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(R * 0.86, 0);
        for (const [t, l] of s.grenar) {
          for (const sy of [-1, 1]) {
            c.moveTo(R * t, 0);
            c.lineTo(R * (t + l * 0.6), sy * R * l * 0.8);
          }
        }
        c.stroke();
        // spetsen
        c.beginPath();
        c.moveTo(R * 0.8, -R * s.b);
        c.lineTo(R, 0);
        c.lineTo(R * 0.8, R * s.b);
        c.fill();
        c.restore();
      }
      c.beginPath();
      for (let i = 0; i < 6; i++) c.lineTo(Math.cos((i * Math.PI) / 3 + Math.PI / 6) * R * s.mitt, Math.sin((i * Math.PI) / 3 + Math.PI / 6) * R * s.mitt);
      c.fill();
      if (s.ring) {
        c.lineWidth = R * 0.07;
        c.beginPath();
        c.arc(0, 0, R * 0.62, 0, 2 * Math.PI);
        c.stroke();
      }
      // hålen: en romb på varje arm, en sexhörning i mitten och små trianglar mellan armarna
      c.shadowColor = 'transparent';
      c.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const rx = Math.cos(a);
        const ry = Math.sin(a);
        const romb = (t, l, w) => {
          c.beginPath();
          c.moveTo(rx * R * (t - l), ry * R * (t - l));
          c.lineTo(rx * R * t - ry * R * w, ry * R * t + rx * R * w);
          c.lineTo(rx * R * (t + l), ry * R * (t + l));
          c.lineTo(rx * R * t + ry * R * w, ry * R * t - rx * R * w);
          c.fill();
        };
        romb(s.mitt + 0.1, 0.06, s.b * 0.28);
        if (s.grenar.length > 1) romb(s.grenar[1][0] + 0.07, 0.035, s.b * 0.2);
        const b = a + Math.PI / 6;
        const r0 = R * s.mitt * 0.55;
        c.beginPath();
        c.moveTo(Math.cos(b) * r0, Math.sin(b) * r0);
        c.lineTo(Math.cos(b - 0.22) * r0 * 1.5, Math.sin(b - 0.22) * r0 * 1.5);
        c.lineTo(Math.cos(b + 0.22) * r0 * 1.5, Math.sin(b + 0.22) * r0 * 1.5);
        c.fill();
      }
      c.beginPath();
      for (let i = 0; i < 6; i++) c.lineTo(Math.cos((i * Math.PI) / 3) * R * s.mitt * 0.3, Math.sin((i * Math.PI) / 3) * R * s.mitt * 0.3);
      c.fill();
      c.globalCompositeOperation = 'source-over';
      // tejpen upptill, lite sned
      c.rotate(-k * 0.4 + (k % 2 ? 0.12 : -0.1));
      c.fillStyle = 'rgba(236,228,196,.6)';
      c.fillRect(-R * 0.2, -R * 1.08, R * 0.4, R * 0.24);
      c.restore();
    });
  }));
  function snoflingor(lista) {
    const geos = lista.map(({ x, y, z, R, typ = 0, vrid = 0 }) => {
      const g = new THREE.PlaneGeometry(2 * R, 2 * R);
      const uv = g.attributes.uv;
      const tx = typ % 2;
      const ty = Math.floor(typ / 2) % 2;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + tx) / 2, (uv.getY(i) + 1 - ty) / 2);
      g.rotateZ(vrid);
      g.translate(x, y, z);
      return g;
    });
    const x = new THREE.Mesh(mergeGeometries(geos), m('#ffffff', { map: flingTex(), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 0.92, depthWrite: false }));
    x.renderOrder = 4;
    return x;
  }

  // Konstsnö på glaset (2026-11-28), sprejad genom en schablon som i en affär på nittiotalet: tätast i rutans
  // hörn och glesare ut mot en båge, med några stjärnor i schablonens form. En karta, och varje hörn är en platt
  // ruta som vänds efter hörnet, alla i ett nät. lista: [{ x, y, z, b (bredd, cm), h, horn 'ov' 'oh' 'nv' 'nh'
  // (övre/nedre, vänster/höger) }], där (x, y) är rutans hörn.
  const snoTex = () => once('konstsno', () => duk(256, 256, (c, w, h) => {
    const q = rnd(31);
    // (en mjuk grund i hörnet, sedan prickarna)
    const r = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.8);
    r.addColorStop(0, 'rgba(255,255,255,.62)');
    r.addColorStop(0.45, 'rgba(255,255,255,.28)');
    r.addColorStop(0.8, 'rgba(255,255,255,0)');
    c.fillStyle = r;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const x = q() * w;
      const y = q() * h;
      const a = Math.atan2(y, x);
      const kant = w * (0.66 + 0.06 * Math.sin(a * 7) + 0.04 * Math.sin(a * 13 + 1));
      const d = Math.hypot(x, y);
      const p = d < kant ? 0.85 - 0.5 * (d / kant) : 0.35 * Math.exp(-(d - kant) / (w * 0.05));
      if (q() > p) continue;
      c.fillStyle = `rgba(255,255,255,${0.35 + q() * 0.5})`;
      const s = 0.6 + q() * 1.6;
      c.fillRect(x, y, s, s);
    }
    // stjärnorna i schablonen, åttauddiga, vita med sprejad kant
    c.shadowColor = 'rgba(255,255,255,.9)';
    c.shadowBlur = 3;
    c.fillStyle = 'rgba(255,255,255,.92)';
    for (const [x, y, R] of [[0.62, 0.2, 0.11], [0.24, 0.6, 0.085], [0.5, 0.5, 0.06]]) {
      c.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const rr = (i % 2 ? 0.38 : 1) * R * w;
        c.lineTo(x * w + Math.cos(a) * rr, y * h + Math.sin(a) * rr);
      }
      c.fill();
    }
  }));
  function konstsno(lista) {
    const geos = lista.map(({ x, y, z, b, h = b, horn }) => {
      const p = new THREE.PlaneGeometry(b, h);
      // (kartans hörn uppe till vänster ligger i rutans hörn)
      const sx = horn[1] === 'v' ? 1 : -1;
      const sy = horn[0] === 'o' ? -1 : 1;
      p.translate(b / 2, -h / 2, 0);
      p.scale(sx, -sy, 1);
      if (sx * -sy < 0) p.index.array.reverse();
      p.translate(x, y, z);
      return p;
    });
    const x = new THREE.Mesh(mergeGeometries(geos), m('#ffffff', { map: snoTex(), transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
    x.renderOrder = 3;
    return x;
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
    mesh(ihop(band), m('#ffffff', { vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), g);
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
  function paskris({ hojd = 29 } = {}) {
    const g = new THREE.Group();
    const q = rnd(41);
    const H = 13;
    vas([[0, 0], [3.8, 0], [4.5, 0.5], [5.1, 2.6], [5.3, 6], [4.6, 9.5], [3.1, 11.6], [2.8, 12.4], [3.3, H], [3, H + 0.1], [2.6, 12.2]], m('#f2efe6', { roughness: 0.22, clearcoat: 0.8 }), g);
    const rand = new THREE.Mesh(new THREE.CylinderGeometry(5.25, 5.28, 1.4, 40, 1, true), m('#2a57a8', { roughness: 0.25, clearcoat: 0.8 }));
    rand.position.y = 5;
    g.add(rand);
    const spetsar = [];
    const geos = kvistar(q, { y0: H, r0: 2.6, antal: 17, hojd, farg: '#3a2420', ut: spetsar, grenar: 2, spridd: 0.32 });
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

  // ---------- fler saker (2026-11-16) ----------
  // Alla är några få sammanslagna nät med färgen i hörnen och samma material som det andra pyntet, så att
  // inga nya grafikprogram behöver byggas, och de ritas en gång som det andra.

  // Ett litet blad, byggt längs y och lite vikt längs mittnerven: runt nedtill och spetsigt upptill som
  // björkens (åtta trianglar kring mitten; förut fyra, och bladen blev romber).
  function blad(l, b) {
    const g = new THREE.BufferGeometry();
    const kant = [[0, 0], [-0.36, 0.14], [-0.5, 0.38], [-0.36, 0.66], [0, 1], [0.36, 0.66], [0.5, 0.38], [0.36, 0.14]];
    const pos = [0, l * 0.42, b * 0.16];
    for (const [x, y] of kant) pos.push(x * b, y * l, 0);
    const idx = [];
    for (let i = 0; i < 8; i++) idx.push(0, 1 + i, 1 + ((i + 1) % 8));
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  // ett band som hänger från p upp till en sugpropp på glaset (längden l cm)
  function upphang(p, l, farg) {
    return [ror([p, p.clone().add(V(0.15, l * 0.5, -0.4)), p.clone().add(V(0, l, -0.8))], 0.16, 0.16, farg, 4),
      farga(new THREE.CylinderGeometry(0.9, 1.5, 0.6, 14).rotateX(90 * DEG).translate(p.x, p.y + l + 0.4, p.z - 1.2), '#dfe7e6')];
  }

  // Kransen på dörrens glas, med mitten i origo: av granris med lingon i klasar och en röd rosett överst
  // (gran), eller av björkris med fjädrar och små ägg (pask). Den hänger i ett band från en sugpropp.
  function krans({ R = 16, typ = 'gran', band = 6 } = {}) {
    const g = new THREE.Group();
    const q = rnd(97);
    const ring = (n, r = R, z = 0) => Array.from({ length: n }, (x, i) => V(Math.cos((i / n) * 2 * Math.PI) * r, Math.sin((i / n) * 2 * Math.PI) * r, z));
    const delar = [];
    if (typ === 'gran') {
      barr(g, new THREE.CatmullRomCurve3(ring(28), true), { tjock: 5.3, q, slutet: true, steg: 0.55, per: 6 });
      // lingonen: klasar framtill runt om utom under rosetten, tätast nedtill
      for (let k = 0; k < 10; k++) {
        const a = Math.PI * (0.78 + (k / 9) * 1.44);
        const c = V(Math.cos(a) * R * (0.92 + q() * 0.16), Math.sin(a) * R * (0.92 + q() * 0.16), 3.2);
        const n = k % 3 === 1 ? 4 : 7;
        for (let j = 0; j < n; j++) delar.push(farga(new THREE.SphereGeometry(0.58 + q() * 0.22, 8, 6).translate(c.x + (q() - 0.5) * 2.6, c.y + (q() - 0.5) * 2.6, c.z + q()), q() > 0.4 ? '#c0141f' : '#8a0b13'));
        // (och ett par lingonblad vid klasen)
        if (k % 2 === 0) delar.push(farga(rikta(blad(2.4, 1.3), c.clone().add(V(0, 0, 0.4)), V(Math.cos(a + 1), Math.sin(a + 1), 0.6), 0.3), '#2c5a2a'));
      }
      // tre kottar nedtill
      for (const [a, k] of [[1.4, 0.8], [1.5, 0.92], [1.6, 0.75]]) delar.push(kotte(k).rotateZ((a - 1.5) * 5).translate(Math.cos(a * Math.PI) * R * 1.02, Math.sin(a * Math.PI) * R * 1.02, 4.2));
      const r = new THREE.Mesh(rosett('#8c0c16', 2.2), m('#ffffff', { vertexColors: true, roughness: 0.8, sheen: 0.6, sheenColor: '#d42a2a', sheenRoughness: 0.5, side: THREE.DoubleSide }));
      r.position.set(0, R + 0.8, 5.2);
      r.castShadow = true;
      g.add(r);
      delar.push(...upphang(V(0, R + 1.5, 2.2), band, '#8c0c16'));
    } else {
      // björkris vridet i en ring
      for (let k = 0; k < 22; k++) {
        const a0 = q() * 2 * Math.PI;
        const pts = [];
        for (let j = 0; j <= 8; j++) {
          const a = a0 + (j / 8) * 2.2;
          const r = R + Math.sin(j * 1.3 + k) * 1.2;
          pts.push(V(Math.cos(a) * r, Math.sin(a) * r, Math.cos(j * 0.9 + k) * 1.4));
        }
        delar.push(ror(pts, 0.42, 0.2, q() > 0.5 ? '#4a2c22' : '#5e3b2b', 4));
      }
      const lista = [];
      for (let k = 0; k < 34; k++) {
        const a = (k / 34) * 2 * Math.PI + q() * 0.2;
        const p = V(Math.cos(a) * R, Math.sin(a) * R, 1.5);
        const d = V(-Math.sin(a), Math.cos(a), 0).multiplyScalar(0.7).add(V(Math.cos(a), Math.sin(a), 0.5).multiplyScalar(k % 2 ? 1 : -0.6)).normalize();
        lista.push([p, d, 5.5 + q() * 2, FJADER[k % FJADER.length]]);
      }
      g.add(fjadrar(lista, q));
      g.add(agg([[-0.35, 1], [0, 1.2], [0.35, 1]].map(([x, k]) => ({ ...V(Math.sin(x) * R * 0.98, -Math.cos(x) * R * 0.98, 2.2), ned: 0.8, k: 1.05 * k }))));
      const r = new THREE.Mesh(rosett('#f2c21c', 1.8), m('#ffffff', { vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }));
      r.position.set(0, R + 0.5, 2.5);
      g.add(r);
      delar.push(...upphang(V(0, R + 1.5, 1.8), band, '#f2c21c'));
    }
    mesh(ihop(delar), m('#ffffff', { vertexColors: true, roughness: 0.45, clearcoat: 0.5 }), g);
    return g;
  }

  // En halmstjärna: åtta strån i kors, fyra långa och fyra korta emellan, med rött garn om mitten och om
  // varje arm, i ett rött snöre (band cm). Mitten i origo.
  // Förut låg de långa stråna två och två på samma led (varje strå går genom mitten), så att stjärnan blev
  // ett kors med två sneda strån; nu åtta strån runt halva varvet, sexton uddar.
  function halmstjarna({ R = 8, band = 12 } = {}) {
    const g = new THREE.Group();
    const delar = [];
    const HALM = ['#d9a944', '#c8962f', '#e3b856', '#bf8a2c'];
    // ett strå: platt och blankt, spetsigt snittat i båda ändar, ljusare på mitten
    const stra = (l, r, farg) => {
      const geo = new THREE.LatheGeometry([[0, -l / 2], [r, -l / 2 + 3.2 * r], [r, l / 2 - 3.2 * r], [0, l / 2]].map(([x, y]) => new THREE.Vector2(x, y)), 6);
      geo.scale(1, 1, 0.5);
      const c = new THREE.Color(farg);
      const ljus = c.clone().lerp(new THREE.Color('#ffe7a8'), 0.22);
      const p = geo.attributes.position;
      const a = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) a.set((p.getZ(i) > 0.05 * r ? ljus : c).toArray(), i * 3);
      geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
      geo.deleteAttribute('uv');
      return geo;
    };
    const uddar = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 8;
      const l = i % 2 ? R * 1.35 : R * 2;
      // (de korta framför de långa, och vartannat strå lite framför, som när de är bundna)
      const z = (i % 2 ? 0.45 : 0) + (i % 4 < 2 ? 0.12 : -0.12);
      delar.push(stra(l, 0.32, HALM[i % HALM.length]).rotateZ(a - Math.PI / 2).translate(0, 0, z));
      uddar.push([a, z], [a + Math.PI, z]);
    }
    // det röda garnet: en ring som går över och under stråna kring mitten, och ett kors över mitten
    const rr = R * 0.36;
    uddar.sort((x, y) => x[0] - y[0]);
    const ring = uddar.map(([a, z], i) => V(Math.cos(a) * rr, Math.sin(a) * rr, z + (i % 2 ? -0.32 : 0.42)));
    delar.push(ror([...ring, ring[0], ring[1]], 0.19, 0.19, '#c8141f', 4));
    for (const a of [Math.PI / 4, -Math.PI / 4]) delar.push(ror([V(Math.cos(a) * -1, Math.sin(a) * -1, 0.75), V(0, 0, 0.95), V(Math.cos(a), Math.sin(a), 0.75)], 0.16, 0.16, '#b5121c', 4));
    delar.push(ror([V(0, R, 0), V(0.2, R + band / 2, -0.2), V(0, R + band, 0)], 0.1, 0.1, '#b5121c', 3));
    mesh(ihop(delar), m('#ffffff', { vertexColors: true, roughness: 0.5, clearcoat: 0.3 }), g);
    return g;
  }

  // Julbocken i halm med röda band, stående på hovarna i origo, nosen åt +x.
  // Förut släta rör med röda ringar (torusar) som stod ut som plastringar; nu buntar av halm, randiga på
  // längden, och breda röda band som ligger an mot halmen.
  function julbock() {
    const g = new THREE.Group();
    const d = [];
    const HALM = ['#d8ae52', '#b98a36', '#e8c773', '#a87a2c', '#cfa147', '#f0d58e'];
    // en bunt halm längs punkterna: ett rör där vart och ett av hörnen runt om får sitt strås färg
    const bunt = (pts, r0, r1, rund = 12, fro = 1) => {
      const geo = ror(pts, r0, r1, '#ffffff', rund);
      const q = rnd(Math.abs(Math.round(fro * 31)) + 7);
      const farger = Array.from({ length: rund + 1 }, () => new THREE.Color(HALM[Math.floor(q() * HALM.length)]));
      farger[rund] = farger[0];
      const c = geo.attributes.color;
      for (let i = 0; i < c.count; i++) c.setXYZ(i, ...farger[i % (rund + 1)].toArray());
      return { geo, kurva: new THREE.CatmullRomCurve3(pts), r0, r1 };
    };
    // ett rött band runt bunten vid t (0–1), bredden b
    const band = (bt, t, b = 1.3) => {
      const p = bt.kurva.getPointAt(t);
      const T = bt.kurva.getTangentAt(t);
      const r = bt.r0 + (bt.r1 - bt.r0) * t + 0.12;
      const geo = new THREE.CylinderGeometry(r, r, b, 18, 1, true);
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), T));
      geo.translate(p.x, p.y, p.z);
      d.push(farga(geo, '#b8141e'));
      // (kanterna, lite tjockare)
      for (const s of [-1, 1]) {
        const k = new THREE.TorusGeometry(r, 0.14, 4, 18).rotateX(Math.PI / 2);
        k.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), T));
        k.translate(p.x + (T.x * s * b) / 2, p.y + (T.y * s * b) / 2, p.z + (T.z * s * b) / 2);
        d.push(farga(k, '#8e0c14'));
      }
    };
    const kropp = bunt([V(-9, 13.2, 0), V(-3, 14, 0), V(3, 14.2, 0), V(8, 15, 0)], 3.3, 2.9, 14, 1);
    const hals = bunt([V(7, 14.8, 0), V(9.2, 19, 0), V(10.4, 23.4, 0)], 2, 1.5, 12, 2);
    const huvud = bunt([V(9.6, 24, 0), V(12.4, 23, 0), V(15.2, 21, 0)], 1.75, 1.0, 12, 3);
    const svans = bunt([V(-8.8, 13.8, 0), V(-11, 16.5, 0), V(-11.6, 18.4, 0)], 1.2, 0.35, 8, 4);
    const delar = [kropp, hals, huvud, svans];
    for (const z of [-1, 1]) {
      // hornen: böjda bakåt och ned i en båge
      delar.push(bunt([V(10.2, 25, z * 0.8), V(9.4, 28.6, z * 1.5), V(6.6, 29.6, z * 2.3), V(4.8, 27.6, z * 2.8), V(5.6, 25.8, z * 2.9)], 0.75, 0.3, 8, 5 + z));
      // öronen
      d.push(farga(new THREE.ConeGeometry(0.6, 2.4, 6).rotateZ(z > 0 ? -1.9 : -1.9).rotateX(z * -0.5).translate(10.6, 24.2, z * 1.9), '#c99f45'));
      // benen, lite isär nedtill
      for (const x of [-6.2, 5]) delar.push(bunt([V(x, 12.4, z * 1.8), V(x + 0.3, 6.5, z * 2.1), V(x - 0.2, 0, z * 2.5)], 1.15, 0.95, 10, 9 + x + z));
    }
    for (const b of delar) d.push(b.geo);
    // (ändarna på bunten: kroppen bak, nosen och fötterna)
    const ande = (b, t, f = '#9a6c2c') => {
      const p = b.kurva.getPointAt(t);
      const T = b.kurva.getTangentAt(t);
      const r = t ? b.r1 : b.r0;
      const geo = new THREE.SphereGeometry(r * 0.98, 12, 6).scale(1, 0.22, 1);
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), T));
      d.push(farga(geo.translate(p.x, p.y, p.z), f));
    };
    ande(kropp, 0);
    ande(kropp, 1);
    ande(huvud, 1, '#8a5e24');
    // banden: två om kroppen, om halsen, om nosen och om benen
    band(kropp, 0.3, 1.5);
    band(kropp, 0.7, 1.5);
    band(hals, 0.55, 1.2);
    band(huvud, 0.72, 0.9);
    for (const b of delar.slice(5)) if (b.r0 > 1) band(b, 0.42, 1);
    // ögonen: två små mörka knappar
    for (const z of [-1, 1]) d.push(farga(new THREE.SphereGeometry(0.28, 6, 4).translate(12.2, 23.9, z * 1.45), '#2a1a10'));
    mesh(ihop(d), m('#ffffff', { vertexColors: true, roughness: 0.82 }), g);
    return g;
  }

  // Serpentiner som hänger i lockar från punkterna (lista: [punkt, längd cm]) och ballonger i folie med
  // snören ned till en punkt (ballonger: [x, y, z, färg] över snörets fäste i origo).
  const SERP = ['#ff3d7f', '#ffd21f', '#3d9bff', '#4fd65a', '#f2f2f2', '#ff8a2a'];
  // Serpentinen är en remsa papper som har rullats och hänger i en lös skruv: bandets breda sida vänd utåt,
  // lockarna glesare nedåt där tyngden drar ut dem. Förut ett tunt rör i sicksack.
  function serpentiner(lista) {
    const g = new THREE.Group();
    const d = [];
    lista.forEach(([p, l], i) => {
      const a0 = [];
      const a1 = [];
      const n = Math.round(l * 4);
      const b = 0.55;
      let y = 0;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        // (varvet tar 2,2 cm överst och drygt dubbelt så mycket längst ned)
        const a = t * l * 1.45 + i * 1.7;
        y = -t * l;
        const r = 0.9 + 0.7 * t;
        const c = p.clone().add(V(Math.cos(a) * r, y, Math.sin(a) * r));
        // bandet lutar med skruven
        const lut = 0.45 + 0.25 * t;
        const w = V(-Math.sin(a) * lut, 1, Math.cos(a) * lut).normalize().multiplyScalar(b / 2);
        a0.push(c.clone().sub(w));
        a1.push(c.clone().add(w));
      }
      d.push(yta(a0, a1, SERP[i % SERP.length]));
    });
    mesh(ihop(d), m('#ffffff', { vertexColors: true, roughness: 0.4, clearcoat: 0.5, side: THREE.DoubleSide }), g);
    return g;
  }
  function ballonger(lista = [[-6, 52, 0, '#d4a838'], [5, 58, 2, '#c8ccd2'], [0, 46, -4, '#1c1c22']]) {
    const g = new THREE.Group();
    const d = [];
    const snoren = [];
    lista.forEach(([x, y, z, f], i) => {
      const b = new THREE.SphereGeometry(1, 22, 16);
      b.scale(9, 10.5, 9);
      b.translate(x, y, z);
      d.push(farga(b, f));
      d.push(farga(new THREE.ConeGeometry(1.1, 1.6, 10).rotateX(Math.PI).translate(x, y - 10.9, z), f));
      snoren.push(ror([V(x, y - 11.5, z), V(x * 0.6 + Math.sin(i) * 2, (y - 11.5) * 0.55, z * 0.6), V(0, 0, 0)], 0.08, 0.08, '#efeae0', 3));
    });
    mesh(ihop(d), m('#ffffff', { vertexColors: true, metalness: 0.6, roughness: 0.22, clearcoat: 1 }), g);
    mesh(ihop(snoren), m('#ffffff', { vertexColors: true, roughness: 0.6 }), g);
    return g;
  }

  // Påskkycklingar av garn (lista: [x, z, storlek, vridning]) som står på det de står på.
  function kycklingar(lista) {
    const g = new THREE.Group();
    const q = rnd(13);
    const d = [];
    const ludd = (geo, k) => {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + (q() - 0.5) * k), p.getY(i) * (1 + (q() - 0.5) * k), p.getZ(i) * (1 + (q() - 0.5) * k));
      geo.computeVertexNormals();
      return geo;
    };
    for (const [x, z, k, v] of lista) {
      const del = [];
      del.push(farga(ludd(new THREE.SphereGeometry(1.7, 14, 10).scale(1.05, 0.95, 1), 0.08).translate(0, 1.6, 0), '#f6d32e'));
      del.push(farga(ludd(new THREE.SphereGeometry(1.1, 12, 8), 0.07).translate(0, 3.6, 0.35), '#f8da3a'));
      del.push(farga(new THREE.ConeGeometry(0.32, 0.8, 6).rotateX(Math.PI / 2).translate(0, 3.5, 1.65), '#f08a1d'));
      for (const s of [-1, 1]) {
        del.push(farga(new THREE.SphereGeometry(0.16, 6, 4).translate(s * 0.42, 3.85, 1.25), '#141012'));
        del.push(farga(new THREE.SphereGeometry(0.75, 8, 6).scale(0.4, 0.8, 1.1).translate(s * 1.65, 1.8, -0.1), '#efc624'));
        del.push(farga(new THREE.BoxGeometry(0.25, 0.12, 0.9).translate(s * 0.55, 0.06, 0.6), '#f08a1d'));
      }
      const geo = ihop(del).scale(k, k, k).rotateY(v).translate(x, 0, z);
      d.push(geo);
    }
    mesh(ihop(d), m('#ffffff', { vertexColors: true, roughness: 0.95, sheen: 1, sheenColor: '#fff3b0' }), g);
    return g;
  }

  // Björkris (lövruskor) som binds vid dörrposten: en kvist från origo upp till hojd cm, med grenar som
  // hänger och tätt med ljusgröna blad. vanster: grenarna åt vänster (−x).
  function bjorkris({ hojd = 150, vanster = false, fro = 3 } = {}) {
    const g = new THREE.Group();
    const q = rnd(fro);
    const s = vanster ? -1 : 1;
    const kvist = [];
    const lov = [];
    const stam = [V(0, 0, 0), V(s * 2, hojd * 0.35, 1), V(s * 1, hojd * 0.7, 2), V(s * -1, hojd, 2)];
    kvist.push(ror(stam, 0.9, 0.35, '#e9e2d4', 6));
    const kurva = new THREE.CatmullRomCurve3(stam);
    for (let k = 0; k < 24; k++) {
      const t = 0.1 + (k / 24) * 0.88;
      const p0 = kurva.getPointAt(t);
      const ut = (k % 2 ? s : -s) * (0.5 + q() * 0.5);
      const l = 14 + q() * 16 * (1 - t * 0.4);
      const pts = [p0, p0.clone().add(V(ut * l * 0.45, l * 0.08, 1 + q() * 2)), p0.clone().add(V(ut * l * 0.75, -l * 0.25, 2 + q() * 2)), p0.clone().add(V(ut * l * 0.9, -l * 0.7, 2.5 + q() * 3))];
      kvist.push(ror(pts, 0.32, 0.08, '#5b3a2b', 4));
      const c = new THREE.CatmullRomCurve3(pts);
      for (let j = 0; j < 26; j++) {
        const p = c.getPointAt(0.08 + (j / 26) * 0.92).add(V((q() - 0.5) * 3, (q() - 0.5) * 3, (q() - 0.5) * 3));
        const d = V((q() - 0.5) * 2, -0.4 - q(), 0.4 + q() * 0.8).normalize();
        lov.push(farga(rikta(blad(4.4 + q() * 1.2, 3.4), p, d, q() * 3), q() > 0.5 ? '#7fbf3f' : q() > 0.5 ? '#94cf4a' : '#5f9a2f'));
      }
    }
    mesh(ihop(kvist), m('#ffffff', { vertexColors: true, roughness: 0.7 }), g);
    mesh(ihop(lov), m('#ffffff', { vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), g);
    return g;
  }

  // En liten midsommarstång att ställa på bordet: stången och tvärslån lindade med blad, två kransar som
  // hänger i slån, blommor i bladen och en fot.
  function stang({ hojd = 42 } = {}) {
    const g = new THREE.Group();
    const q = rnd(29);
    const tra = [];
    const lov = [];
    const blom = [];
    tra.push(farga(new THREE.CylinderGeometry(4, 4.6, 1.4, 20).translate(0, 0.7, 0), '#7a5a3a'));
    tra.push(ror([V(0, 0, 0), V(0, hojd, 0)], 0.7, 0.6, '#8a6a46', 6));
    const sla = hojd * 0.72;
    tra.push(ror([V(-8, sla, 0), V(8, sla, 0)], 0.35, 0.35, '#8a6a46', 6));
    const kurvor = [new THREE.CatmullRomCurve3([V(0, 1.5, 0), V(0, hojd, 0)]), new THREE.CatmullRomCurve3([V(-8, sla, 0), V(8, sla, 0)])];
    for (const x of [-8, 8]) {
      const ring = Array.from({ length: 18 }, (y, i) => V(x, sla - 3.6 + Math.cos((i / 18) * 2 * Math.PI) * 3.4, Math.sin((i / 18) * 2 * Math.PI) * 3.4));
      kurvor.push(new THREE.CatmullRomCurve3(ring, true));
    }
    const FARG = ['#fbfaf3', '#f2c21c', '#3f78ec', '#e8336d'];
    kurvor.forEach((c, ci) => {
      const n = Math.round(c.getLength() * 3.4);
      for (let j = 0; j < n; j++) {
        const p = c.getPointAt(j / n);
        const d = V(q() - 0.5, q() - 0.3, q() - 0.2).normalize();
        lov.push(farga(rikta(blad(2.6, 1.9), p, d, q() * 3), q() > 0.5 ? '#6fae35' : '#88c444'));
        // blommorna: en platt krona med en mitt, vänd utåt och framåt (förut färgade kulor)
        if (q() < 0.2) {
          const f = FARG[Math.floor(q() * FARG.length)];
          const ut = V(d.x, d.y * 0.5, Math.abs(d.z) + 0.6).normalize();
          const bp = p.clone().addScaledVector(ut, 1.2);
          blom.push(farga(rikta(new THREE.CircleGeometry(0.95, f === '#3f78ec' ? 7 : 10).rotateX(-Math.PI / 2), bp, ut), f));
          blom.push(farga(new THREE.SphereGeometry(0.34, 6, 4).translate(bp.x + ut.x * 0.15, bp.y + ut.y * 0.15, bp.z + ut.z * 0.15), f === '#fbfaf3' ? '#f2c21c' : '#2a3a6a'));
        }
      }
    });
    tra.push(farga(new THREE.SphereGeometry(0.9, 8, 6).translate(0, hojd + 0.6, 0), '#2f5fd1'));
    mesh(ihop(tra), m('#ffffff', { vertexColors: true, roughness: 0.7 }), g);
    mesh(ihop([...lov, ...blom]), m('#ffffff', { vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), g);
    return g;
  }

  // Ett fat med kräftor och dill, och en flaska brännvin med två snapsglas (snaps: [x, z] för flaskan).
  function kraftfat({ snaps = [-15, -6] } = {}) {
    const g = new THREE.Group();
    const q = rnd(61);
    const fat = [];
    fat.push(farga(new THREE.LatheGeometry([[0, 0], [8.5, 0], [10.5, 0.6], [12.8, 1.7], [13.2, 1.9], [12.9, 2], [10.4, 1], [0, 0.8]].map(([x, y]) => new THREE.Vector2(x, y)), 36), '#f4f1ea'));
    fat.push(farga(new THREE.TorusGeometry(12.9, 0.22, 4, 48).rotateX(Math.PI / 2).translate(0, 1.95, 0), '#2a57a8'));
    const kraftor = [];
    const R1 = '#c8321e';
    const R2 = '#a8240f';
    const kraft = (x, z, a) => {
      const d = [];
      const sf = (r, sx, sy, sz, px, py, pz, f) => d.push(farga(new THREE.SphereGeometry(r, 7, 5).scale(sx, sy, sz).translate(px, py, pz), f));
      sf(1, 1.25, 0.95, 2.4, 0, 1.25, 1.9, R2);
      for (let k = 0; k < 5; k++) sf(1, 1.15 - k * 0.1, 0.75, 0.85, 0, 1.0 - k * 0.12, -0.7 - k * 1.25, k % 2 ? R1 : R2);
      sf(1, 1.6, 0.25, 0.9, 0, 0.55, -7.2, R1);
      for (const s of [-1, 1]) {
        d.push(ror([V(s * 0.8, 1.1, 3.4), V(s * 2.1, 1.2, 4.6), V(s * 2.6, 1.0, 6.2)], 0.45, 0.4, R1, 5));
        sf(1, 0.85, 0.5, 1.9, s * 2.9, 1.0, 8, R2);
        d.push(farga(new THREE.ConeGeometry(0.35, 2, 5).rotateX(Math.PI / 2).translate(s * 2.45, 1.0, 10.3), R1));
        d.push(ror([V(s * 0.3, 1.6, 4.2), V(s * 1.2, 1.9, 7), V(s * 3.5, 1.4, 10.5)], 0.08, 0.05, R1, 3));
        for (let k = 0; k < 3; k++) d.push(ror([V(s * 1, 0.8, 1.2 + k * 0.9), V(s * 2.2, 0.6, 1.4 + k * 0.9), V(s * 2.8, 0.1, 1.2 + k * 0.9)], 0.12, 0.08, R1, 3));
      }
      kraftor.push(ihop(d).scale(0.95, 0.95, 0.95).rotateY(a).translate(x, 1.4, z));
    };
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 2 * Math.PI + 0.3;
      kraft(Math.sin(a) * 6.8, Math.cos(a) * 6.8, a + Math.PI + (q() - 0.5) * 0.3);
    }
    kraft(0, -0.5, 0.9);
    // dillkronor
    const dill = [];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * 2 * Math.PI;
      const p0 = V(Math.cos(a) * 9.5, 2.4, Math.sin(a) * 9.5);
      const top = p0.clone().add(V(Math.cos(a + 1.2) * 5, 1.2, Math.sin(a + 1.2) * 5));
      dill.push(ror([p0, p0.clone().lerp(top, 0.5).add(V(0, 0.8, 0)), top], 0.14, 0.08, '#6c8f3a', 3));
      for (let j = 0; j < 7; j++) {
        const b = (j / 7) * 2 * Math.PI;
        const u = top.clone().add(V(Math.cos(b) * 1.8, 0.4, Math.sin(b) * 1.8));
        dill.push(ror([top, u], 0.05, 0.05, '#8fae46', 3));
        dill.push(farga(new THREE.SphereGeometry(0.32, 4, 3).translate(u.x, u.y, u.z), '#c9c23a'));
      }
    }
    mesh(ihop(fat), m('#ffffff', { vertexColors: true, roughness: 0.2, clearcoat: 0.8 }), g);
    mesh(ihop([...kraftor, ...dill]), m('#ffffff', { vertexColors: true, roughness: 0.4, clearcoat: 0.5 }), g);
    if (snaps) {
      const [sx, sz] = snaps;
      const glasMat = new THREE.MeshPhysicalMaterial({ color: '#e8f0ec', transparent: true, opacity: 0.32, roughness: 0.05, clearcoat: 1, depthWrite: false });
      const flaska = new THREE.LatheGeometry([[0, 0], [3.3, 0], [3.5, 0.4], [3.5, 16.5], [3.2, 18.5], [1.4, 21], [1.2, 24.6], [1.4, 25], [0, 25]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
      const f = mesh(flaska, glasMat, g);
      f.position.set(sx, 0, sz);
      f.renderOrder = 3;
      const inne = [];
      inne.push(farga(new THREE.CylinderGeometry(3.2, 3.2, 13, 24).translate(sx, 6.8, sz), '#e9dca6'));
      inne.push(farga(new THREE.CylinderGeometry(3.56, 3.56, 7, 28, 1, true).translate(sx, 9.5, sz), '#efe6cf'));
      inne.push(farga(new THREE.CylinderGeometry(3.57, 3.57, 1.6, 28, 1, true).translate(sx, 9.5, sz), '#b5121c'));
      inne.push(farga(new THREE.CylinderGeometry(1.5, 1.5, 1.8, 16).translate(sx, 25.4, sz), '#b5121c'));
      mesh(ihop(inne), m('#ffffff', { vertexColors: true, roughness: 0.5 }), g);
      for (const [gx, gz] of [[sx + 6, sz + 3], [sx + 4.5, sz + 7.5]]) {
        const gl = mesh(new THREE.LatheGeometry([[0, 0], [1.5, 0], [1.5, 0.25], [0.25, 0.5], [0.25, 2.3], [1.2, 3.3], [1.4, 5.2], [1.25, 5.2], [1.1, 3.4]].map(([x, y]) => new THREE.Vector2(x, y)), 18), glasMat, g);
        gl.position.set(gx, 0, gz);
        gl.renderOrder = 3;
        mesh(new THREE.CylinderGeometry(1.3, 0.9, 1.6, 14).translate(gx, 4.1, gz), m('#e9dca6', { roughness: 0.2, transparent: true, opacity: 0.7 }), g);
      }
    }
    return g;
  }

  // Fladdermöss i svart papper i trådar (lista: { x, y, z, ned, k, vrid }), med vingarna lite uppvikta.
  function fladdermoss(lista) {
    const g = new THREE.Group();
    const H = [[0, 0.9], [0.32, 1.5], [0.5, 0.95], [0.8, 0.85], [2, 1.5], [3.4, 1.85], [4.6, 1.35], [3.9, 0.55], [3.3, 0.85], [2.7, 0.2], [2, 0.6], [1.3, -0.1], [0.8, 0.2], [0.45, -0.9], [0, -1.3]];
    const s = new THREE.Shape();
    s.moveTo(...H[0]);
    for (const p of H.slice(1)) s.lineTo(...p);
    for (const [x, y] of H.slice(0, -1).reverse()) s.lineTo(-x, y);
    const d = [];
    const tradar = [];
    lista.forEach((e, i) => {
      const geo = new THREE.ShapeGeometry(s);
      const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) p.setZ(k, Math.abs(p.getX(k)) * 0.35);
      geo.computeVertexNormals();
      const k = e.k || 1;
      geo.scale(k, k, k).rotateY(e.vrid || 0).rotateZ(((i % 3) - 1) * 0.12).translate(e.x, e.y - e.ned - 1.3 * k, e.z);
      d.push(farga(geo, '#151214'));
      tradar.push(ror([V(e.x, e.y, e.z), V(e.x, e.y - e.ned + 0.2, e.z)], 0.06, 0.06, '#d8d8d8', 3));
    });
    mesh(ihop(d), m('#ffffff', { vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), g);
    mesh(ihop(tradar), m('#ffffff', { vertexColors: true, roughness: 0.6 }), g);
    return g;
  }

  return { stjarna, ljusstake, girlang, snoflingor, konstsno, agg, paskris, vimplar, blommor, lyktor, pumpa, vav, krans, halmstjarna, julbock, serpentiner, ballonger, kycklingar, bjorkris, stang, kraftfat, fladdermoss };
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
