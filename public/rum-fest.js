// Högtiderna i tobaksaffären (rum-3d.js): runt de stora högtiderna klär gänget
// sig för dem, några dagar före och efter, så att det inte bara gäller en dag.
//
//   lucia      12–14 december: vita linnen; den som sitter bakom bordet bär
//              luciakronan med levande ljus som fladdrar, de två på sidorna
//              stjärngossestrutar med guldstjärnor
//   jul        20–28 december: tomteluvor och stickade jultröjor med renar,
//              granar och snöstjärnor
//   nyar       29 december – 2 januari: kavaj i sammet, vit skjorta och fluga,
//              partyhattar i folie och konfetti på axlarna, i håret och på bordet
//   pask       onsdagen före skärtorsdagen till tisdagen efter annandag påsk:
//              påskkärringar med huckle knuten under hakan och målade kinder
//   midsommar  onsdagen till söndagen kring midsommarafton: blomkransar
//
// Vid jul, lucia och nyår byter de om helt (inga jackor, det är fest inne);
// vid påsk och midsommar har de kläderna efter vädret och bara det på huvudet.
// Det som sitter på huvudet ersätter DJ:s mössa. Oraklet med papperskronan
// (dagen efter, efterFig i rum-3d.js) bär kronan i stället.
//
// Samma axlar som figurerna i rum-3d.js: huvudets mitt i origo, y uppåt, z
// framåt och x åt figurens vänster; P är huvudets mått (F.head).
//
// festen(v) → 'lucia' | 'jul' | 'nyar' | 'pask' | 'midsommar' | null (v = Vader.nu());
//   ?rum-fest=<namn> för bilder (?rum-fest=inget: ingen)
// drakt(key, d) → kläderna d (dress i rum-3d.js) för festen d.fest
// festklader(h) → { huvud, jultroja, armar, fluga, konfetti, kinder, bord }

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fromPask } from './rum-fika.js';

export const FESTER = ['lucia', 'jul', 'nyar', 'pask', 'midsommar'];

// midsommarafton: fredagen mellan den 19 och 25 juni (UTC-millisekunder)
function midsommarafton(Y) {
  const w = new Date(Date.UTC(Y, 5, 19)).getUTCDay();
  return Date.UTC(Y, 5, 19 + ((12 - w) % 7));
}

export function festen(v) {
  const q = new URLSearchParams(location.search).get('rum-fest');
  if (q != null) return FESTER.includes(q) ? q : null;
  if (!v) return null;
  const m = v.manad;
  const d = v.dag;
  if (m === 12 && d >= 12 && d <= 14) return 'lucia';
  if (m === 12 && d >= 20 && d <= 28) return 'jul';
  if ((m === 12 && d >= 29) || (m === 1 && d <= 2)) return 'nyar';
  const p = fromPask(v);
  if (p >= -4 && p <= 2) return 'pask';
  const ms = Math.round((Date.UTC(v.ar, m - 1, d) - midsommarafton(v.ar)) / 864e5);
  if (ms >= -2 && ms <= 2) return 'midsommar';
  return null;
}

// Jultröjorna: botten, mönstret (renarna och snöstjärnorna) och granarna.
const JULTROJA = {
  dl: { farg: '#b51f2b', farg2: '#8f1621', monster: '#f3ede0', gran: '#1f5b3b' },
  dt: { farg: '#1f4e37', farg2: '#163a28', monster: '#f3ede0', gran: '#c2303a' },
  dj: { farg: '#1b3566', farg2: '#13264b', monster: '#f3ede0', gran: '#6c9fdc' },
};
// Nyårskavajerna i sammet (slagen i det mörkare), och byxorna till dem.
const KAVAJ = {
  dl: { farg: '#232c52', farg2: '#121731' },
  dt: { farg: '#1a1a1e', farg2: '#0a0a0b' },
  dj: { farg: '#561a2a', farg2: '#2a0b14' },
};
const MORKA_BYXOR = ['#25252b', '#18181c'];

// Kläderna för festen (d.fest): vid jul, lucia och nyår inga jackor och
// långbyxor; DT kavlar upp ärmen med lejonet också på tröjan och kavajen.
export function drakt(key, d) {
  const f = d.fest;
  if (f !== 'jul' && f !== 'lucia' && f !== 'nyar') return d;
  delete d.jacka;
  d.ben = 'lang';
  if (key !== 'dt' && !d.byxa) d.byxa = key === 'dl' ? ['#c9bb98', '#b1a27d'] : ['#b8b4ab', '#a29d93'];
  const upp = key === 'dt' ? 'lejon' : undefined;
  if (f === 'jul') {
    const J = JULTROJA[key];
    d.troja = { farg: J.farg, farg2: J.farg2, jul: true, upp };
  } else if (f === 'lucia') {
    d.troja = { farg: '#f7f4ec', farg2: '#e4dfd3', upp };
  } else {
    d.troja = { farg: '#f8f6f1', farg2: '#e6e2da', skjorta: true };
    d.jacka = { typ: 'oppen', tyg: 'sammet', ...KAVAJ[key], krage: true, upp };
    if (key !== 'dt') d.byxa = MORKA_BYXOR;
  }
  return d;
}

// Hjälpen från rum-3d.js: h = { mat, mesh, seg, canvasTex, ellipsoid, band, headGeo }
export function festklader(h) {
  const { mat, mesh, seg, canvasTex, ellipsoid, band, headGeo } = h;
  const DEG = Math.PI / 180;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const cache = new Map();
  // texturerna görs en gång (figurerna byggs om när vädret ändras)
  const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
  const rnd0 = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

  // ---------- huvudet: riktningar, ytan och skal ----------

  // riktningen th från hjässan och a runt huvudet (0 = fram, π/2 = vänster)
  const dir = (th, a) => V(Math.sin(th) * Math.sin(a), Math.cos(th), Math.sin(th) * Math.cos(a));
  // k gånger huvudets yta åt riktningen d (huvudet smalnar av under mitten, headGeo)
  function yta(P, d, k) {
    const x = d.y < 0 ? d.x * (1 - P.taper * (-d.y) ** 1.6) : d.x;
    return V(x * P.rx * k, d.y * P.ry * k, d.z * P.rz * k);
  }
  // kanten på det som sitter på huvudet: grader från hjässan fram, på sidan och bak
  const kantVid = (c) => (a) => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    return (c.f * Math.max(0, ca) ** 2 + c.s * sa * sa + c.b * Math.max(0, -ca) ** 2) * DEG;
  };
  // ett rutnät (i runt, j längs) av punkterna fn(u, t) → [punkt, u, v]
  function nat(N, M, fn, vand) {
    const pos = []; const uv = []; const idx = [];
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= M; j++) {
        const [p, u, w] = fn(i / N, j / M);
        pos.push(p.x, p.y, p.z);
        uv.push(u, w);
      }
    }
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        const a = i * (M + 1) + j;
        const b = a + M + 1;
        if (vand) idx.push(a, b, a + 1, a + 1, b, b + 1);
        else idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  // ett rör längs punkterna med radien rad(u), u = 0…1 längs röret
  function ror(pts, rad, nL, nR) {
    const cur = new THREE.CatmullRomCurve3(pts);
    const fr = cur.computeFrenetFrames(nL, false);
    return nat(nL, nR, (u, w) => {
      const i = Math.round(u * nL);
      const q = w * 2 * Math.PI;
      const r = rad(u);
      const p = cur.getPointAt(u).addScaledVector(fr.normals[i], Math.cos(q) * r).addScaledVector(fr.binormals[i], Math.sin(q) * r);
      return [p, w, u];
    });
  }
  // många små delar i ett nät, med färgen i hörnen: [{ geo, at, rot (Euler eller Quaternion), sc, col }]
  function smalt(list) {
    const q = new THREE.Quaternion();
    const gs = list.map(({ geo, at, rot, sc, col }) => {
      const x = geo.clone();
      if (rot && rot.isQuaternion) q.copy(rot); else q.setFromEuler(new THREE.Euler(...(rot || [0, 0, 0])));
      x.applyMatrix4(new THREE.Matrix4().compose(at, q, sc ? V(...sc) : V(1, 1, 1)));
      const c = new THREE.Color(col);
      const n = x.attributes.position.count;
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      x.setAttribute('color', new THREE.BufferAttribute(a, 3));
      return x;
    });
    const g = mergeGeometries(gs);
    for (const x of gs) x.dispose();
    return g;
  }
  // (blad och kronblad är många: få trianglar var)
  const KLOT = new THREE.SphereGeometry(1, 8, 5);
  const KLOT2 = new THREE.SphereGeometry(1, 16, 12);
  // ludd (päls och garn) som bumpkarta
  const luddTex = () => once('ludd', () => {
    const t = canvasTex(128, 128, (g, w, hh) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, hh);
      const r = rnd0(23);
      for (let i = 0; i < 1600; i++) {
        g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.2 + r() * 0.3})`;
        g.lineWidth = 1 + r();
        const x = r() * w; const y = r() * hh; const a = r() * 6.3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); g.stroke();
      }
    });
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 2);
    return t;
  });
  // en lurvig boll (tofsen på tomteluvan): en klumpig sfär med ludd
  function boll(r, col, parent) {
    const g = new THREE.SphereGeometry(1, seg(40, 20), seg(30, 14));
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const d = V(p.getX(i), p.getY(i), p.getZ(i));
      const k = 1 + 0.09 * Math.sin(d.x * 9 + 1) * Math.sin(d.y * 8 + 2) * Math.sin(d.z * 10) + 0.05 * Math.sin(d.x * 23 + d.y * 19 - d.z * 17);
      d.multiplyScalar(r * k);
      p.setXYZ(i, d.x, d.y, d.z);
    }
    g.computeVertexNormals();
    return mesh(g, mat(col, { roughness: 0.95, clearcoat: 0, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff'), bumpMap: luddTex(), bumpScale: 3 }), parent);
  }

  // ---------- tomteluvan ----------
  // Röd filt över huvudet med en vit pälskant, och toppen som faller bakåt
  // och åt sidan (s) med en vit tofs. Glasögonen sitter uppskjutna på kanten.
  function tomteluva(P, hc, s) {
    const c = { f: 54, s: 76, b: 102 };
    const lim = kantVid(c);
    const g = new THREE.Group();
    hc.add(g);
    const filt = mat('#bf1d2a', { roughness: 0.78, clearcoat: 0.08, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color('#ff8a8a'), bumpMap: luddTex(), bumpScale: 0.6 });
    const vit = mat('#f8f5ef', { roughness: 0.95, clearcoat: 0, sheen: 1, sheenRoughness: 0.7, sheenColor: new THREE.Color('#ffffff'), bumpMap: luddTex(), bumpScale: 4 });
    const N = seg(128, 64);
    mesh(nat(N, seg(28, 14), (u, t) => {
      const a = u * 2 * Math.PI;
      return [yta(P, dir(t * lim(a), a), 1.075 + 0.03 * (1 - t) ** 1.5 + 0.01 * Math.sin(t * Math.PI)), u * 4, 1 - t];
    }), filt, g);
    // pälskanten: ett tjockt, luddigt band längs kanten
    const ch = 14;
    const hAt = (a) => ch / yta(P, dir(lim(a), a), 1.1).length();
    mesh(nat(N, seg(22, 12), (u, w) => {
      const a = u * 2 * Math.PI;
      const q = w * 2 * Math.PI;
      const cq = Math.cos(q); const sq = Math.sin(q);
      const f = 0.5 - Math.sign(cq) * Math.abs(cq) ** 0.45 / 2;
      const ludd = 0.014 * Math.sin(a * 41 + q * 3) * Math.sin(a * 17 - q * 5) + 0.009 * Math.sin(a * 97 + q * 11);
      const k = 1.115 + 0.05 * f + Math.sign(sq) * Math.abs(sq) ** 0.5 * 0.05 + ludd;
      return [yta(P, dir(lim(a) + 0.03 - f * hAt(a), a), k), u * 6, (1 - cq) / 2];
    }, true), vit, g);
    // toppen: ett rör som smalnar av från hjässan, bakåt och ner på sidan
    const pts = [V(0, P.ry * 0.45, -P.rz * 0.05), V(s * P.rx * 0.04, P.ry * 0.96, -P.rz * 0.12), V(s * P.rx * 0.36, P.ry * 1.16, -P.rz * 0.3),
      V(s * P.rx * 0.86, P.ry * 1.0, -P.rz * 0.34), V(s * P.rx * 1.18, P.ry * 0.58, -P.rz * 0.26), V(s * P.rx * 1.28, P.ry * 0.12, -P.rz * 0.1)];
    const R0 = P.rx * 0.8;
    mesh(ror(pts, (u) => 3.4 + (R0 - 3.4) * (1 - u) ** 1.5, seg(72, 36), seg(32, 16)), filt, g);
    boll(8.5, '#f8f5ef', g).position.copy(pts[pts.length - 1]).add(V(s * 1, -6.5, 0.5));
    return { grupp: g, cap: c, glas: yta(P, dir(lim(0) - hAt(0) - 0.1, 0), 1.17) };
  }

  // ---------- stjärngossestruten ----------
  // En hög vit strut av papper med guldstjärnor, guldkant och en stjärna i
  // toppen, lite bakåtlutad.
  const stjarna = (n, r0, r1) => {
    const sh = new THREE.Shape();
    for (let i = 0; i <= 2 * n; i++) {
      const a = Math.PI / 2 + i * Math.PI / n;
      const r = i % 2 ? r1 : r0;
      if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return sh;
  };
  const guld = () => mat('#e3b84c', { metalness: 1, roughness: 0.3, clearcoat: 0.6, envMapIntensity: 1.3 });
  // stjärnor runt struten: på duken är bredden omkretsen, som krymper mot
  // toppen, så stjärnorna dras ut åt sidan där (1 / (1 − v))
  function strutTex() {
    return once('strut', () => {
      const W = 1024; const H = 512;
      const r = rnd0(41);
      const st = [];
      for (let row = 0; row < 7; row++) {
        const v = 0.06 + row * 0.115;
        const n = Math.max(2, Math.round(11 * (1 - v)));
        for (let i = 0; i < n; i++) st.push({ u: (i + (row % 2) * 0.5 + (r() - 0.5) * 0.3) / n, v: v + (r() - 0.5) * 0.04, s: (1 - v * 0.45) * (0.8 + r() * 0.35), a: r() });
      }
      const draw = (g, fill, star) => {
        g.fillStyle = fill; g.fillRect(0, 0, W, H);
        for (const p of st) {
          for (const dx of [-W, 0, W]) {
            g.save();
            g.translate(p.u * W + dx, (1 - p.v) * H);
            g.scale(1 / (1 - p.v), 1);
            g.rotate(p.a);
            g.beginPath();
            for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = (i % 2 ? 6 : 15) * p.s; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
            g.closePath();
            g.fillStyle = star; g.fill();
            g.restore();
          }
        }
      };
      const map = canvasTex(W, H, (g) => {
        draw(g, '#f6f3ea', '#e2b64a');
        const rr = rnd0(5);
        for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(150,130,100,${rr() * 0.08})`; g.fillRect(rr() * W, rr() * H, 2, 2); }
      });
      // metall i stjärnorna (blått) och blankare där (grönt lägre)
      const mr = canvasTex(W, H, (g) => draw(g, 'rgb(0,215,0)', 'rgb(0,80,255)'));
      mr.colorSpace = THREE.NoColorSpace;
      return { map, mr };
    });
  }
  function strut(P, hc, s) {
    const g = new THREE.Group();
    hc.add(g);
    g.rotation.set(-0.16, 0, s * 0.04);
    const y0 = P.ry * 0.4;
    const k = Math.sqrt(1 - 0.4 * 0.4) * 1.16;
    const H = P.ry * 1.7;
    const T = strutTex();
    const cone = mesh(new THREE.ConeGeometry(1, 1, seg(72, 36), 1, true), mat('#ffffff', { map: T.map, metalnessMap: T.mr, roughnessMap: T.mr, metalness: 1, roughness: 1, clearcoat: 0, envMapIntensity: 0.9 }), g);
    cone.scale.set(P.rx * k, H, P.rz * k);
    cone.position.y = y0 + H / 2;
    const rim = new THREE.TorusGeometry(1, 1.5 / (P.rx * k), 10, seg(72, 36));
    rim.rotateX(Math.PI / 2);
    const kant = mesh(rim, guld(), g);
    kant.scale.set(P.rx * k, P.rx * k, P.rz * k);
    kant.position.y = y0 + 1;
    const top = mesh(new THREE.ExtrudeGeometry(stjarna(5, 9, 3.8), { depth: 1.6, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.7, bevelSegments: 2, curveSegments: 4 }), guld(), g);
    top.position.set(0, y0 + H + 6, -0.8);
    top.rotation.z = 0.12;
    return { grupp: g, cap: { f: 64, s: 70, b: 80 }, glas: null, hog: true };
  }

  // ---------- luciakronan ----------
  // Lingonris runt huvudet med några röda bär, och sju levande ljus vars
  // lågor fladdrar (tick) och lyser.
  const skenTex = () => once('sken', () => canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,236,170,1)'); gr.addColorStop(0.35, 'rgba(255,190,90,.45)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }));
  function luciakrona(F, P, hc, lugn) {
    const g = new THREE.Group();
    hc.add(g);
    g.rotation.x = -0.14;
    // ovanpå håret
    const Hh = F.hair;
    const yc = P.ry * 0.62 + (Hh.lift || 0) * 0.8;
    const kk = Math.sqrt(1 - 0.62 * 0.62) * (1.1 + (Hh.vol || 0));
    const Rx = P.rx * kk; const Rz = P.rz * kk + (Hh.back || 0) * 0.3;
    const at = (a, dr = 0, dy = 0) => V(Math.sin(a) * (Rx + dr), yc + dy, Math.cos(a) * (Rz + dr));
    // ringen av mässing
    const rg = new THREE.TorusGeometry(1, 1.2 / Rx, 8, seg(64, 32));
    rg.rotateX(Math.PI / 2);
    const ring = mesh(rg, mat('#c9a24a', { metalness: 1, roughness: 0.35 }), g);
    ring.scale.set(Rx, Rx, Rz);
    ring.position.y = yc;
    // riset: blanka små blad åt alla håll, och bären
    const r = rnd0(17);
    const del = [];
    const n = seg(150, 80);
    const gron = ['#1d4a27', '#2a5e30', '#163b1f', '#33693a'];
    for (let i = 0; i < n; i++) {
      const a = (i + r() * 0.6) / n * 2 * Math.PI;
      const p = at(a, (r() - 0.3) * 5, (r() - 0.5) * 6);
      del.push({ geo: KLOT, at: p, rot: [r() * 6.3, a + (r() - 0.5) * 1.6, r() * 6.3], sc: [2.2, 0.7, 4.6], col: gron[i % 4] });
    }
    for (let i = 0; i < 14; i++) {
      const a = (i + 0.5 + (r() - 0.5) * 0.5) / 14 * 2 * Math.PI;
      del.push({ geo: KLOT, at: at(a, 3.4, (r() - 0.3) * 3), sc: [1.9, 1.9, 1.9], col: '#b3132b' });
    }
    mesh(smalt(del), mat('#ffffff', { vertexColors: true, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 }), g);
    // ljusen: sju vita, ett mitt fram
    const lagor = [];
    const L = 22;
    const ljus = [];
    const LJUS = new THREE.CylinderGeometry(2.8, 2.8, L, 16);
    const VEK = new THREE.CylinderGeometry(0.35, 0.35, 2, 6);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * 2 * Math.PI;
      const p = at(a, 0, 1);
      ljus.push({ geo: LJUS, at: V(p.x, p.y + L / 2, p.z), col: '#f8f4e8' }, { geo: VEK, at: V(p.x, p.y + L + 0.8, p.z), col: '#2a2018' });
      // lågan: en droppe som lyser, en ljusare kärna och ett sken runt
      const lo = new THREE.Group();
      lo.position.set(p.x, p.y + L + 1.4, p.z);
      g.add(lo);
      const yttre = new THREE.Mesh(KLOT2, new THREE.MeshBasicMaterial({ color: '#ffb54a', toneMapped: false, transparent: true, opacity: 0.9 }));
      yttre.scale.set(1.9, 4.3, 1.9);
      yttre.position.y = 3.2;
      const karna = new THREE.Mesh(KLOT2, new THREE.MeshBasicMaterial({ color: '#fff4d2', toneMapped: false }));
      karna.scale.set(1, 2.5, 1);
      karna.position.y = 2.5;
      const sken = new THREE.Sprite(new THREE.SpriteMaterial({ map: skenTex(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.75 }));
      sken.scale.set(22, 22, 1);
      sken.position.y = 3.4;
      lo.add(yttre, karna, sken);
      lagor.push({ lo, sken, i });
    }
    mesh(smalt(ljus), mat('#ffffff', { vertexColors: true, roughness: 0.45, clearcoat: 0.2, sheen: 0.5, sheenColor: new THREE.Color('#fff6dc') }), g);
    const tick = (t) => {
      if (lugn) return;
      for (const { lo, sken, i } of lagor) {
        const f = 1 + 0.13 * Math.sin(t * 11 + i * 1.7) + 0.07 * Math.sin(t * 23.3 + i * 2.9) + 0.04 * Math.sin(t * 37.1 + i);
        lo.scale.set(1 - 0.06 * (f - 1), f, 1 - 0.06 * (f - 1));
        lo.rotation.z = 0.06 * Math.sin(t * 5.3 + i * 2.1);
        sken.material.opacity = 0.62 + 0.9 * (f - 1);
      }
    };
    return { grupp: g, cap: null, glas: null, hog: true, tick };
  }

  // ---------- partyhatten ----------
  // En spetsig hatt i folie med ränder i spiral, snett på huvudet, med en
  // tofs av foliestrimlor i toppen.
  const PARTY = {
    dl: ['#e3b84c', '#f3efe6'],
    dt: ['#c9ced6', '#2456b8'],
    dj: ['#18181c', '#e3b84c'],
  };
  function partyTex(key) {
    return once(`party-${key}`, () => {
      const [a, b] = PARTY[key];
      const W = 512; const H = 256;
      const r = rnd0(7 + key.charCodeAt(1));
      const draw = (g, ca, cb, glitter) => {
        g.fillStyle = ca; g.fillRect(0, 0, W, H);
        g.fillStyle = cb;
        for (let i = -6; i < 12; i++) {
          g.beginPath();
          g.moveTo(i * W / 6, H); g.lineTo(i * W / 6 + W / 14, H); g.lineTo(i * W / 6 + W / 14 + W / 2, 0); g.lineTo(i * W / 6 + W / 2, 0);
          g.closePath(); g.fill();
        }
        if (glitter) for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.6})`; g.fillRect(r() * W, r() * H, 1.5, 1.5); }
      };
      const map = canvasTex(W, H, (g) => draw(g, a, b, true));
      // allt är folie, ränderna lite mattare
      const mr = canvasTex(W, H, (g) => draw(g, 'rgb(0,70,235)', 'rgb(0,120,170)', false));
      mr.colorSpace = THREE.NoColorSpace;
      return { map, mr };
    });
  }
  function partyhatt(F, P, hc, s) {
    const g = new THREE.Group();
    hc.add(g);
    const Hh = F.hair;
    const topp = P.ry * (1 + Hh.vol) + (Hh.lift || 0) - 3;
    g.position.set(s * P.rx * 0.14, topp, -P.rz * 0.1 - (Hh.back || 0) * 0.4);
    g.rotation.set(-0.1, 0, -s * 0.3);
    const R = P.rx * 0.34;
    const H = P.ry * 0.95;
    const T = partyTex(F.key);
    const kon = mesh(new THREE.ConeGeometry(R, H, seg(48, 24), 1, true), mat('#ffffff', { map: T.map, metalnessMap: T.mr, roughnessMap: T.mr, metalness: 1, roughness: 1, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.2, side: THREE.DoubleSide }), g);
    kon.position.y = H / 2;
    const rg = new THREE.TorusGeometry(R, 0.9, 8, seg(48, 24));
    rg.rotateX(Math.PI / 2);
    mesh(rg, mat(PARTY[F.key][1], { metalness: 0.8, roughness: 0.3 }), g).position.y = 0.4;
    // tofsen: strimlor åt alla håll uppåt
    const r = rnd0(31 + F.key.charCodeAt(1));
    const del = [];
    const STAV = new THREE.CylinderGeometry(0.28, 0.28, 1, 5);
    STAV.translate(0, 0.5, 0);
    for (let i = 0; i < 34; i++) {
      const th = Math.sqrt(r()) * 1.25;
      const a = r() * 2 * Math.PI;
      const d = dir(th, a);
      del.push({ geo: STAV, at: V(0, H - 1, 0), rot: new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d), sc: [1.6, 6 + r() * 6, 0.5], col: PARTY[F.key][i % 3 === 0 ? 1 : 0] });
    }
    mesh(smalt(del), mat('#ffffff', { vertexColors: true, metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide }), g);
    return { grupp: g, cap: null, glas: 'har', hog: true };
  }

  // ---------- hucklet (påskkärringen) ----------
  // En sjalett över huvudet som ramar in ansiktet, med en rullad fåll, knuten
  // under hakan med två snibbar. Öronen göms under den. Mönstret ritas i
  // huvudets vinklar (a runt, th från hjässan), så att prickarna och blommorna
  // är lika stora överallt.
  const HUCKLE = {
    dl: { slag: 'prickar', botten: '#c8302d', farg: '#f7f2e8' },
    dt: { slag: 'blommor', botten: '#f0bf2e', farg: '#fbf8f0', mitt: '#e2662a' },
    dj: { slag: 'rutor', botten: '#f6f3ec', farg: '#2c5fb2' },
  };
  function tygTex(key, rak) {
    return once(`huckle-${key}-${rak ? 'rak' : 'rund'}`, () => {
      const C = HUCKLE[key];
      const W = 1024; const H = 512;
      const r = rnd0(13);
      // rad: en rad i huckle-ytan (th) eller längs knuten (rak)
      return canvasTex(W, H, (g) => {
        g.fillStyle = C.botten; g.fillRect(0, 0, W, H);
        const motiv = (x, y, sx, sy) => {
          g.save(); g.translate(x, y); g.scale(sx, sy);
          if (C.slag === 'prickar') { g.fillStyle = C.farg; g.beginPath(); g.arc(0, 0, 7, 0, 2 * Math.PI); g.fill(); }
          else if (C.slag === 'blommor') {
            g.fillStyle = C.farg;
            for (let i = 0; i < 5; i++) { const a = i / 5 * 2 * Math.PI; g.beginPath(); g.ellipse(Math.cos(a) * 6, Math.sin(a) * 6, 5.5, 3.6, a, 0, 2 * Math.PI); g.fill(); }
            g.fillStyle = C.mitt; g.beginPath(); g.arc(0, 0, 3.4, 0, 2 * Math.PI); g.fill();
          }
          g.restore();
        };
        if (C.slag === 'rutor') {
          // rutigt: band åt båda hållen, mörkare där de korsar
          g.fillStyle = C.farg;
          g.globalAlpha = 0.55;
          const n = rak ? 16 : 40;
          for (let i = 0; i < n; i++) g.fillRect(i * W / n, 0, W / n / 2, H);
          for (let j = 0; j < (rak ? 4 : 16); j++) g.fillRect(0, j * H / (rak ? 4 : 16), W, H / (rak ? 4 : 16) / 2);
          g.globalAlpha = 1;
          return;
        }
        if (rak) {
          for (let i = 0; i < 24; i++) for (let j = 0; j < 4; j++) motiv((i + (j % 2) * 0.5) * W / 24, (j + 0.5) * H / 4, 2.2, 3);
          return;
        }
        // i huckle-ytan: x = a / 2π, y = th / π; en rad i taget, glesare mot hjässan
        const rader = C.slag === 'blommor' ? 17 : 26;
        for (let j = 1; j < rader; j++) {
          const th = j / rader * Math.PI;
          const n = Math.max(1, Math.round((C.slag === 'blommor' ? 38 : 64) * Math.sin(th)));
          for (let i = 0; i < n; i++) {
            const x = (i + (j % 2) * 0.5 + (r() - 0.5) * 0.15) / n * W;
            for (const dx of [-W, 0, W]) motiv(x + dx, th / Math.PI * H, 1 / Math.max(0.15, Math.sin(th)) * 0.9, 1);
          }
        }
      });
    });
  }
  function huckle(F, P, hc) {
    const key = F.key;
    const C = HUCKLE[key];
    const c = { f: 33, s: 114, b: 124 };
    const lim = kantVid(c);
    const g = new THREE.Group();
    hc.add(g);
    const tyg = (map) => mat('#ffffff', { map, roughness: 0.72, clearcoat: 0.15, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide });
    const rund = tygTex(key, false);
    // skalet, med veck som löper ner från hjässan
    const N = seg(128, 64);
    const k = (t, a) => 1.075 + 0.04 * t * t + 0.012 * Math.sin(a * 11) * t + 0.03 * Math.max(0, -Math.cos(a)) * t;
    mesh(nat(N, seg(32, 16), (u, t) => {
      const a = u * 2 * Math.PI;
      const th = t * lim(a);
      return [yta(P, dir(th, a), k(t, a)), u, 1 - th / Math.PI];
    }), tyg(rund), g);
    // den rullade fållen längs kanten
    const kant = [];
    for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI; kant.push(yta(P, dir(lim(a), a), k(1, a) + 0.012)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kant, true), seg(160, 80), 1.6, 8, true), tyg(rund), g);
    // knuten under hakan: banden från sidorna, knuten och två snibbar
    const rak = tygTex(key, true);
    rak.wrapS = rak.wrapT = THREE.RepeatWrapping;
    rak.repeat.set(1 / 30, 1);
    const knut = yta(P, dir(155 * DEG, 0), 1.12).add(V(0, -3, 2.5));
    for (const s of [-1, 1]) {
      const pts = []; const nrm = [];
      for (let i = 0; i <= 20; i++) {
        const u = i / 20;
        const a = s * (88 - 80 * u) * DEG;
        const th = (lim(a) - 6 * DEG) * (1 - u) + 158 * DEG * u;
        const p = yta(P, dir(th, a), 1.14 + 0.02 * Math.sin(u * Math.PI));
        pts.push(p.lerp(knut, u ** 3 * 0.5));
        nrm.push(dir(th, a));
      }
      const bg = band(pts, nrm, 10, 2.4);
      mesh(bg, tyg(rak), g);
      // snibben: ut och ner från knuten
      const sp = [knut.clone().add(V(s * 2, 0, 0.5)), knut.clone().add(V(s * 7, -4, 3)), knut.clone().add(V(s * 11, -9, 4)), knut.clone().add(V(s * 13, -12, 4.2))];
      const sn = sp.map(() => V(0, 0.2, 1).normalize());
      mesh(band(sp, sn, 9, 1.8), tyg(rak), g);
    }
    ellipsoid(knut.toArray(), [5, 4, 3.6], tyg(rak), g);
    return { grupp: g, cap: { f: c.f + 9, s: c.s + 4, b: c.b + 4 }, glas: yta(P, dir(lim(0) - 0.18, 0), 1.16), oron: false };
  }

  // ---------- blomkransen ----------
  // Blad och ängsblommor runt huvudet över pannan: prästkragar, blåklint,
  // smörblommor och klöver, tätast fram.
  function blomkrans(F, P, hc) {
    const g = new THREE.Group();
    hc.add(g);
    const c = kantVid({ f: 56, s: 72, b: 82 });
    const Hh = F.hair;
    const r = rnd0(53 + F.key.charCodeAt(1));
    const del = [];
    const n = seg(70, 44);
    const gron = ['#3f7a2e', '#5a9338', '#2e6224', '#6ea544'];
    // punkten, utåt och längs kransen vid a
    const ram = (a) => {
      const th = c(a);
      const kk = 1.1 + (Hh.vol || 0) * 0.8 + 0.05 * Math.sin(a) ** 2 + 0.04 * Math.max(0, -Math.cos(a));
      const p = yta(P, dir(th, a), kk);
      const ut = dir(th, a).multiply(V(1 / P.rx, 1 / P.ry, 1 / P.rz)).normalize();
      const p2 = yta(P, dir(c(a + 0.01), a + 0.01), kk);
      const langs = p2.sub(p).normalize();
      return { p, ut, langs };
    };
    const bas = (ut, langs) => {
      const z = ut.clone();
      const y = langs.clone().sub(z.clone().multiplyScalar(langs.dot(z))).normalize();
      const x = new THREE.Vector3().crossVectors(y, z);
      return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    };
    // bladen: två per steg, åt var sitt håll längs kransen
    for (let i = 0; i < n; i++) {
      const a = (i + r() * 0.5) / n * 2 * Math.PI;
      const { p, ut, langs } = ram(a);
      for (const s of [-1, 1]) {
        const q = bas(ut, langs.clone().multiplyScalar(s).addScaledVector(ut, 0.3 * (r() - 0.5)));
        q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25 + r() * 0.3, 0, (r() - 0.5) * 0.9)));
        del.push({ geo: KLOT, at: p.clone().addScaledVector(langs, s * 3), rot: q, sc: [2.4, 5.2, 0.6], col: gron[(i + (s > 0)) % 4] });
      }
    }
    // blommorna i blommans egna axlar: z utåt
    const blomma = (slag, p, q, st) => {
      const put = (geo, at, rot, sc, col) => {
        const qq = q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
        del.push({ geo, at: p.clone().add(at.clone().multiplyScalar(st).applyQuaternion(q)), rot: qq, sc: sc.map((x) => x * st), col });
      };
      if (slag === 'prastkrage') {
        for (let i = 0; i < 13; i++) { const a = i / 13 * 2 * Math.PI; put(KLOT, V(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0.4), [0, 0, a + Math.PI / 2], [0.95, 2.6, 0.35], '#fbfaf5'); }
        put(KLOT, V(0, 0, 1), [0, 0, 0], [1.8, 1.8, 0.9], '#f2c21b');
      } else if (slag === 'blaklint') {
        for (let i = 0; i < 9; i++) { const a = i / 9 * 2 * Math.PI; put(KLOT, V(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 1), [0.5 * Math.sin(a), -0.5 * Math.cos(a), a + Math.PI / 2], [1.1, 2.2, 0.6], i % 2 ? '#3d63d4' : '#4f78e6'); }
        put(KLOT, V(0, 0, 1.3), [0, 0, 0], [1.2, 1.2, 0.8], '#28307a');
      } else if (slag === 'smorblomma') {
        for (let i = 0; i < 5; i++) { const a = i / 5 * 2 * Math.PI; put(KLOT, V(Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.9), [0.6 * Math.sin(a), -0.6 * Math.cos(a), a + Math.PI / 2], [1.6, 1.9, 0.5], '#f5cc1c'); }
        put(KLOT, V(0, 0, 1.1), [0, 0, 0], [0.9, 0.9, 0.6], '#b9a62a');
      } else {
        // klöver: ett rosa klot av små kronblad
        for (let i = 0; i < 14; i++) { const d = dir(Math.acos(1 - 2 * (i + 0.5) / 14), i * 2.4); put(KLOT, d.clone().multiplyScalar(1.8).add(V(0, 0, 1.6)), [d.y, d.x, 0], [0.8, 1.2, 0.8], i % 3 ? '#d86f9f' : '#e98fb7'); }
      }
    };
    const SLAG = ['prastkrage', 'blaklint', 'prastkrage', 'smorblomma', 'klover', 'blaklint', 'prastkrage', 'smorblomma'];
    const nb = seg(24, 18);
    for (let i = 0; i < nb; i++) {
      // tätare fram (a nära 0) än bak
      const u = (i + 0.5) / nb * 2 - 1;
      const a = Math.sign(u) * Math.abs(u) ** 1.35 * Math.PI + (r() - 0.5) * 0.08;
      const { p, ut, langs } = ram(a);
      const q = bas(ut, langs).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, (r() - 0.5) * 0.5, r() * 6.3)));
      const sl = SLAG[i % SLAG.length];
      blomma(sl, p.clone().addScaledVector(ut, 1.6), q, (sl === 'prastkrage' ? 1.45 : 1.35) * (1 - 0.15 * Math.abs(a) / Math.PI));
    }
    mesh(smalt(del), mat('#ffffff', { vertexColors: true, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') }), g);
    return { grupp: g, cap: null, glas: null };
  }

  // Det på huvudet för festen: { grupp, cap (håret trycks ner under kanten),
  // glas (glasögonens plats, 'har' i håret som vanligt eller null: av),
  // oron (false: öronen göms), hog (tas av när DJ sover på bordet), tick(t) }.
  // mitt: figuren sitter bakom bordet (luciakronan); lugn: inga fladdrande lågor.
  function huvud(F, P, hc, fest, mitt, lugn) {
    // åt den sida som syns: utåt på sidorna, bakom bordet åt var sitt håll
    const s = F.turn > 10 ? -1 : F.turn < -10 ? 1 : { dl: 1, dt: -1, dj: 1 }[F.key];
    if (fest === 'jul') return tomteluva(P, hc, s);
    if (fest === 'lucia') return mitt ? luciakrona(F, P, hc, lugn) : strut(P, hc, s);
    if (fest === 'nyar') return partyhatt(F, P, hc, s);
    if (fest === 'pask') return huckle(F, P, hc);
    if (fest === 'midsommar') return blomkrans(F, P, hc);
    return null;
  }

  // ---------- jultröjan ----------
  // Ett stickat mönster i rutor (en maska = 8 × 8 bildpunkter, 128 maskor
  // runt och 53 varv upp): resår nertill, sicksack, renar mot en gran mitt
  // fram och snöstjärnor på sidorna, en rad stjärnor och sicksack upptill.
  // Duken sitter runt bålen (u runt, v = höjden, se build i rum-3d.js).
  const REN = [
    '.........X.X.',
    '........X.X.X',
    '.........XXX.',
    '..........X..',
    '..........XX.',
    '..........XXX',
    '.........XX..',
    'XXXXXXXXXXX..',
    '.XXXXXXXXXX..',
    '.XXXXXXXXX...',
    '.X.X....X.X..',
    '.X.X....X.X..',
    'X..X...X..X..',
  ];
  const GRAN = ['....X....', '...XXX...', '..XXXXX..', '...XXX...', '..XXXXX..', '.XXXXXXX.', '..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', '....X....', '....X....'];
  const SNO = ['....X....', '.X..X..X.', '..X.X.X..', '...XXX...', 'XXXX.XXXX', '...XXX...', '..X.X.X..', '.X..X..X.', '....X....'];
  const STJ = ['...X...', '.X.X.X.', '..XXX..', 'XXX.XXX', '..XXX..', '.X.X.X.', '...X...'];
  const MASKA = 8;
  const RUNT = 128;
  const VARV = 53;
  // maskorna: en V av två lutande droppar i maskans färg på en mörkare botten
  function stickat(g, col, x, y) {
    const c = new THREE.Color(col);
    g.fillStyle = '#' + c.clone().multiplyScalar(0.72).getHexString();
    g.fillRect(x, y, MASKA, MASKA);
    g.fillStyle = col;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(x + MASKA / 2 + s * 1.7, y + MASKA / 2, 1.9, 3.7, -s * 0.5, 0, 2 * Math.PI);
      g.fill();
    }
  }
  function jultroja(key) {
    return once(`jul-${key}`, () => {
      const C = JULTROJA[key];
      const rut = Array.from({ length: VARV }, () => new Array(RUNT).fill(null));
      // varv r räknas nerifrån; x runt med 0 mitt fram
      const satt = (x, r, col) => { if (r >= 0 && r < VARV) rut[r][((x % RUNT) + RUNT) % RUNT] = col; };
      const motiv = (rader, x0, r0, col, spegel) => {
        const h = rader.length;
        rader.forEach((rad, i) => [...rad].forEach((ch, j) => { if (ch === 'X') satt(x0 + (spegel ? rad.length - 1 - j : j), r0 + h - 1 - i, col); }));
      };
      for (let x = 0; x < RUNT; x++) {
        // sicksack nertill och upptill, prickar och kantrader
        for (const [r0, col] of [[5, C.monster], [40, C.monster]]) { satt(x, r0 + (x % 4 === 2 ? 2 : x % 2 ? 1 : 0), col); }
        if (x % 4 === 0) { satt(x + 2, 9, C.gran); satt(x, 29, C.gran); satt(x + 2, 45, C.monster); }
        if (x % 2 === 0) { satt(x, 11, C.monster); satt(x + 1, 27, C.monster); }
      }
      for (const off of [0, 64]) {
        motiv(GRAN, off - 4, 13, C.gran);
        motiv(REN, off - 19, 13, C.monster);
        motiv(REN, off + 7, 13, C.monster, true);
        motiv(SNO, off + 28, 15, C.monster);
      }
      for (let i = 0; i < 8; i++) motiv(STJ, 8 + i * 16 - 3, 31, i % 2 ? C.gran : C.monster);
      return canvasTex(RUNT * MASKA, VARV * MASKA, (g) => {
        for (let r = 0; r < VARV; r++) for (let x = 0; x < RUNT; x++) stickat(g, rut[r][x] || (r < 4 ? C.farg2 : C.farg), x * MASKA, (VARV - 1 - r) * MASKA);
      });
    });
  }
  // ärmarna: tröjans färg med en prick i mönstrets färg här och där
  function armar(key) {
    return once(`armar-${key}`, () => {
      const C = JULTROJA[key];
      const t = canvasTex(8 * MASKA, 8 * MASKA, (g) => {
        for (let r = 0; r < 8; r++) for (let x = 0; x < 8; x++) stickat(g, (r === 1 && x === 2) || (r === 5 && x === 6) ? C.monster : C.farg, x * MASKA, r * MASKA);
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 5);
      return t;
    });
  }

  // ---------- nyårsafton: flugan, skjortan och konfettin ----------
  // Flugan i svart satin vid kragen, skjortans kragsnibbar och tre knappar
  // fram (prof = bålens profil, Vector2 (r, y)).
  function fluga(F, chest, T, prof) {
    const sz = F.depth / F.w;
    const rAt = (y) => { for (let i = 1; i < prof.length; i++) if (y <= prof[i].y) { const a = prof[i - 1]; const b = prof[i]; return a.x + (b.x - a.x) * (y - a.y) / Math.max(1e-6, b.y - a.y); } return prof[prof.length - 1].x; };
    const satin = mat('#121214', { roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.1, sheen: 0.6, sheenColor: new THREE.Color('#5a5a66') });
    const vit = mat('#f8f6f1', { roughness: 0.55, clearcoat: 0.3 });
    const z0 = Math.max(F.neckR * 1.12, rAt(T * 1.0) * sz) + 2.2;
    const y0 = T * 1.02;
    // kragsnibbarna, nedvikta åt var sitt håll
    for (const s of [-1, 1]) {
      const k = mesh(new THREE.BoxGeometry(5.5, 7, 0.7), vit, chest);
      k.position.set(s * 3.6, y0 + 1, z0 - 0.8);
      k.rotation.set(-0.35, s * 0.35, s * 0.62);
    }
    for (const s of [-1, 1]) ellipsoid([s * 4.4, y0, z0 + 0.6], [4.6, 3, 1.5], satin, chest, [0, -s * 0.25, s * 0.18]);
    ellipsoid([0, y0, z0 + 1.4], [1.7, 2.2, 1.4], satin, chest);
    const knapp = mat('#e9e5dc', { roughness: 0.3, clearcoat: 1 });
    for (const f of [0.52, 0.68, 0.84]) ellipsoid([0, T * f, rAt(T * f) * sz + 1.4], [1.1, 1.1, 0.5], knapp, chest);
  }
  const KONFETTI = ['#e3b84c', '#e8487a', '#35bfc8', '#f6f2ea', '#8b5be0', '#e2412f', '#5cc46a'];
  const FLAGA = new THREE.PlaneGeometry(2.4, 1.6);
  FLAGA.rotateX(-Math.PI / 2);
  const konfMat = () => mat('#ffffff', { vertexColors: true, roughness: 0.35, metalness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide });
  // konfetti på axlarna (outer = profilen ytterst, jackan eller tröjan) och i håret
  function konfetti(F, outer, chest, P, hc) {
    const r = rnd0(61 + F.key.charCodeAt(1));
    const sz = F.depth / F.w;
    const topp = (x) => { for (let i = outer.length - 1; i > 0; i--) if (outer[i].x >= Math.abs(x)) return outer[i].y; return outer[0].y; };
    const del = [];
    for (let i = 0; i < 46; i++) {
      const s = i % 2 ? 1 : -1;
      const x = s * F.w * (0.22 + r() * 0.7);
      const zMax = Math.sqrt(Math.max(0, 0.9 * F.w * 0.9 * F.w - x * x)) * sz * 0.6;
      del.push({ geo: FLAGA, at: V(x, topp(x) + 0.6, (r() * 2 - 1) * zMax), rot: [(r() - 0.5) * 0.7, r() * 6.3, (r() - 0.5) * 0.7 + s * 0.25], col: KONFETTI[i % KONFETTI.length] });
    }
    mesh(smalt(del), konfMat(), chest);
    const hd = [];
    for (let i = 0; i < 14; i++) {
      const d = dir(r() * 0.7, r() * 2 * Math.PI);
      const p = yta(P, d, 1.13 + (F.hair.vol || 0)).add(V(0, (F.hair.lift || 0) * d.y, 0));
      hd.push({ geo: FLAGA, at: p, rot: [(r() - 0.5) * 0.9, r() * 6.3, (r() - 0.5) * 0.9], col: KONFETTI[(i + 3) % KONFETTI.length] });
    }
    mesh(smalt(hd), konfMat(), hc);
  }

  // ---------- påskkärringens målade kinder ----------
  // Runda röda kinder och fräknar över näsan, på ett skal strax utanpå
  // ansiktet (samma mått som ansiktsbilden: x −80…80, y −100…80).
  function kinder(F, P, hc) {
    const t = once('kinder', () => canvasTex(512, 576, (g, w, hh) => {
      g.clearRect(0, 0, w, hh);
      const X = (x) => (x + 80) / 160 * w;
      const Y = (y) => (y + 100) / 180 * hh;
      const sk = w / 160;
      for (const s of [-1, 1]) {
        const gr = g.createRadialGradient(X(s * 32), Y(19), 0, X(s * 32), Y(19), 10.5 * sk);
        gr.addColorStop(0, 'rgba(222,52,58,.9)'); gr.addColorStop(0.75, 'rgba(222,52,58,.82)'); gr.addColorStop(1, 'rgba(222,52,58,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(X(s * 32), Y(19), 10.5 * sk, 0, 2 * Math.PI); g.fill();
      }
      const r = rnd0(77);
      g.fillStyle = 'rgba(120,62,36,.85)';
      for (let i = 0; i < 26; i++) {
        const s = i % 2 ? 1 : -1;
        const x = s * (5 + r() * 26);
        const y = 7 + r() * 9 + Math.abs(x) * 0.12;
        g.beginPath(); g.arc(X(x), Y(y), (0.8 + r() * 0.6) * sk, 0, 2 * Math.PI); g.fill();
      }
    }));
    const m = new THREE.Mesh(headGeo(P, true, 1.0045), mat('#ffffff', { map: t, transparent: true, roughness: 0.5, clearcoat: 0.5, polygonOffset: true, polygonOffsetFactor: -3, depthWrite: false }, 'hud'));
    m.receiveShadow = true;
    hc.add(m);
  }

  // ---------- bordet ----------
  // På nyår: konfetti över skivan och några serpentiner (bordets axlar,
  // skivan i y = 0, radien R).
  function bord(fest, R) {
    if (fest !== 'nyar') return null;
    const g = new THREE.Group();
    g.userData.fest = true;
    const r = rnd0(97);
    const del = [];
    for (let i = 0; i < 90; i++) {
      const a = r() * 2 * Math.PI;
      const rr = Math.sqrt(r()) * (R - 6);
      del.push({ geo: FLAGA, at: V(Math.cos(a) * rr, 0.15 + r() * 0.2, Math.sin(a) * rr), rot: [(r() - 0.5) * 0.15, r() * 6.3, (r() - 0.5) * 0.15], col: KONFETTI[i % KONFETTI.length] });
    }
    mesh(smalt(del), konfMat(), g);
    for (let i = 0; i < 4; i++) {
      const a0 = i / 4 * 2 * Math.PI + 0.6;
      const c0 = V(Math.cos(a0) * R * 0.62, 0, Math.sin(a0) * R * 0.62);
      const fram = V(-Math.sin(a0), 0, Math.cos(a0));
      const pts = [];
      for (let j = 0; j <= 60; j++) {
        const u = j / 60;
        const q = u * 2 * Math.PI * 3.2;
        const rad = 1.7 + 0.5 * Math.sin(u * 5 + i);
        pts.push(c0.clone().addScaledVector(fram, (u - 0.5) * 30).add(V(Math.sin(q) * rad * 1.3, 0.5 + (rad + Math.cos(q + Math.PI) * rad) * 0.7, 0).applyAxisAngle(V(0, 1, 0), -a0)));
      }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, 0.45, 6, false), mat(KONFETTI[(i * 2 + 1) % KONFETTI.length], { roughness: 0.4, clearcoat: 0.6 }), g);
    }
    return g;
  }

  return { huvud, jultroja, armar, fluga, konfetti, kinder, bord };
}
