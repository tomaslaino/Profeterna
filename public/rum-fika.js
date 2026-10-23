// Fikat på pulten i tobaksaffären (rum-saker.js): på vissa dagar står det
// något från konditoriet mittemot där, som fläkten bara står där när det är
// varmt – semlor i pappersform på fettisdagen, pepparkakor i december,
// lussekatter på luciadagen, kanelbullar på kanelbullens dag (4 oktober),
// chokladägg i folie i påskveckan och chokladbollar på chokladbollens dag
// (11 maj). Går det dåligt med tippningen har någon redan tagit för sig:
// locket ligger bredvid semlan, pepparkaksgubben saknar huvudet, ett ägg är
// avskalat, det har blivit fler smulor. Gängets öl är julöl från första
// advent till tjugondag Knut och påsköl i påskveckan (ol, rum-3d.js).
//
// Samma världsaxlar som sakerna: 1 enhet ≈ 1 px i pultens plan, y uppåt från
// pulten och z mot betraktaren (ungefär 7 enheter på en centimeter).
//
// dagens(v) → dagens fika (v = Vader.nu()) eller null; ?rum-fika=<namn> för bilder
// ol(v) → 'jul' | 'pask' | null
// bord(THREE, { world, mat, mesh, canvasTex, specks, heap, hash }) → { r(namn), visa(namn, p, w, s) }

export const FIKA = ['semlor', 'pepparkakor', 'lussekatter', 'kanelbullar', 'paskagg', 'chokladbollar'];

// påskdagen (Gauss/Meeus), i UTC-millisekunder
function pask(Y) {
  const a = Y % 19; const b = Math.floor(Y / 100); const c = Y % 100; const d = Math.floor(b / 4); const e = b % 4;
  const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return Date.UTC(Y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
// dagar från påskdagen
const fromPask = (v) => Math.round((Date.UTC(v.ar, v.manad - 1, v.dag) - pask(v.ar)) / 864e5);

export function dagens(v) {
  const q = new URLSearchParams(location.search).get('rum-fika');
  if (q != null) return FIKA.includes(q) ? q : null;
  if (!v) return null;
  const d = fromPask(v);
  if (d === -47) return 'semlor';
  if (d >= -3 && d <= 1) return 'paskagg';
  if (v.manad === 12 && v.dag === 13) return 'lussekatter';
  if (v.manad === 12) return 'pepparkakor';
  if (v.manad === 10 && v.dag === 4) return 'kanelbullar';
  if (v.manad === 5 && v.dag === 11) return 'chokladbollar';
  return null;
}

export function ol(v) {
  const q = new URLSearchParams(location.search).get('rum-ol');
  if (q != null) return q === 'jul' || q === 'pask' ? q : null;
  if (!v) return null;
  if (v.advent) return 'jul';
  const d = fromPask(v);
  return d >= -7 && d <= 1 ? 'pask' : null;
}

export function bord(THREE, h) {
  const { world, mat, mesh, canvasTex, specks, heap, hash } = h;
  const DEG = Math.PI / 180;
  const root = new THREE.Group();
  world.add(root);
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const lathe = (pts, n = 48) => new THREE.LatheGeometry(pts.map(([x, y]) => V2(x, y)), n);
  // en kurva genom punkterna, som ett rör
  const tube = (pts, rad, n = 96) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), n, rad, 14, false);
  const ball = (r, m, parent, at, sc = [1, 1, 1]) => { const x = mesh(new THREE.SphereGeometry(r, 18, 12), m, parent); x.position.set(...at); x.scale.set(...sc); return x; };

  // ---------- materialen ----------

  const crumbTex = (base, cols, seed) => canvasTex(256, 256, (g, w, hh) => { g.fillStyle = base; g.fillRect(0, 0, w, hh); specks(g, w, hh, 700, cols, 2.4, seed); });
  const bulle = mat('#ffffff', { map: crumbTex('#c98a49', ['#b4733a', '#d9a05e', '#a8652e', '#e0b275'], 3), roughness: 0.62, sheen: 0.4, sheenColor: new THREE.Color('#f3c98e') });
  const skorpa = mat('#ffffff', { map: crumbTex('#e6c79a', ['#d9b682', '#f0d8b0', '#cfa66c'], 5), roughness: 0.85 });
  const gradde = mat('#fbf8f1', { roughness: 0.38, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.15 });
  const mandel = mat('#d6b07a', { roughness: 0.7 });
  const florsocker = canvasTex(256, 256, (g, w, hh) => { g.fillStyle = '#c4874a'; g.fillRect(0, 0, w, hh); specks(g, w, hh, 2600, ['#ffffff', '#f6f2ea', '#fbf9f5'], 2.2, 9); });
  const lockMat = mat('#ffffff', { map: florsocker, roughness: 0.8 });
  const papper = mat('#f6f2ea', { roughness: 0.82, side: THREE.DoubleSide });
  const pepparkaka = mat('#ffffff', { map: crumbTex('#8c4519', ['#7a3a14', '#9d5223', '#6c3110', '#a85c2b'], 7), roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const glasyr = mat('#fbf8f0', { roughness: 0.4, clearcoat: 0.3 });
  const saffran = mat('#ffffff', { map: crumbTex('#e7a237', ['#d48d24', '#f0b553', '#c97f1c'], 13), roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.25 });
  const russin = mat('#3a1b12', { roughness: 0.35, clearcoat: 0.7 });
  const kanel = mat('#ffffff', { map: crumbTex('#b6723a', ['#8e4f22', '#c98a4f', '#6f3816'], 17), roughness: 0.55, clearcoat: 0.2 });
  const parlsocker = mat('#fdfcf8', { roughness: 0.5, clearcoat: 0.3 });
  const choklad = mat('#4a2715', { roughness: 0.35, clearcoat: 0.4 });
  const kokos = mat('#ffffff', { map: crumbTex('#4b2817', ['#f7f3ea', '#ffffff', '#efe8da', '#5a3320'], 19), roughness: 0.9, bumpMap: crumbTex('#555555', ['#ffffff', '#dddddd'], 19), bumpScale: 1.2 });
  const smulMat = mat('#c08046', { roughness: 0.9 });
  const sockerMat = mat('#ffffff', { roughness: 0.9, transparent: true, opacity: 0.85 });

  // smulor och florsocker på pulten (fler när det går dåligt)
  const smulor = [];
  for (let i = 0; i < 26; i++) {
    const m = mesh(new THREE.IcosahedronGeometry(1, 0), smulMat, root);
    m.castShadow = false;
    smulor.push(m);
  }
  const socker = [];
  for (let i = 0; i < 14; i++) {
    const m = mesh(new THREE.CircleGeometry(1, 9), sockerMat, root);
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    socker.push(m);
  }
  function strossla(list, n, R, s, y, k0, k1, col) {
    list.forEach((m, i) => {
      m.visible = i < n;
      const a = hash(s + i * 1.37) * Math.PI * 2;
      const rr = R * (0.35 + hash(s + i * 2.17) ** 1.4 * 0.9);
      m.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr * 0.75);
      const k = k0 + hash(s + i * 4.3) * (k1 - k0);
      if (m.geometry.type === 'CircleGeometry') m.scale.set(k, k * (0.6 + hash(i) * 0.5), 1);
      else { m.scale.set(k, k * 0.55, k * 0.8); m.rotation.set(hash(i) * 6, hash(i + 1) * 6, 0); }
      if (col) m.material = col;
    });
  }

  // ---------- semlor ----------
  // Pappersform med veck, bullens botten, mandelmassan, grädden och locket
  // med florsocker. Två stycken; går det dåligt ligger det ena locket bredvid
  // och det är en grop i grädden.

  function form(R, H, parent) {
    const g = lathe([[0, 0.3], [R * 0.78, 0.3], [R * 0.8, 0.8], [R, H]], 72);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i); const z = p.getZ(i); const y = p.getY(i);
      if (y < 0.5) continue;
      const k = 1 + 0.045 * Math.sin(Math.atan2(z, x) * 36) * (y / H);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return mesh(g, papper, parent);
  }
  function semla(parent, at, open, s) {
    const g = new THREE.Group();
    g.position.set(...at);
    g.rotation.y = hash(s) * 6;
    parent.add(g);
    form(26, 9, g);
    mesh(lathe([[0, 1], [22, 1.2], [24.6, 4], [25, 8], [24, 12], [21.5, 13.4], [0, 13.4]]), bulle, g);
    mesh(new THREE.CylinderGeometry(21, 21.6, 1.6, 40), mandel, g).position.y = 14;
    // grädden: spritsad, med vågor i kanten; en grop där någon har ätit
    const dip = open ? (x, z) => -6 * Math.exp(-((x - 6) ** 2 + (z - 4) ** 2) / 60) : () => 0;
    const cream = heap(22.5, 64, (x, z) => {
      const r = Math.hypot(x, z) / 22.5;
      return 14.6 + 10 * Math.sqrt(Math.max(0, 1 - r * r)) + 1.4 * Math.sin(Math.atan2(z, x) * 9) * r * (1 - r) * 4 + dip(x, z);
    });
    mesh(cream, gradde, g);
    const lock = new THREE.Group();
    mesh(lathe([[0, 0], [15.5, 0], [16, 1.6], [13, 6.4], [7, 9], [0, 9.6]]), lockMat, lock);
    mesh(new THREE.CircleGeometry(15.5, 32).rotateX(Math.PI / 2), skorpa, lock);
    if (open) {
      // locket bredvid, på sidan mot formen
      lock.position.set(34, 4.2, 10);
      lock.rotation.set(0.15, 0, 1.2);
    } else {
      lock.position.set(1, 21.5, 0);
      lock.rotation.set(0.22, 0, -0.08);
    }
    g.add(lock);
    return g;
  }

  // ---------- pepparkakor ----------
  // Två hjärtan och en gubbe med vit glasyr; när det går dåligt saknar
  // gubben huvudet (ett tandat bett där det satt).

  function hjarta(sz) {
    const S = new THREE.Shape();
    S.moveTo(0, -sz * 0.95);
    S.bezierCurveTo(sz * 0.55, -sz * 0.45, sz * 1.05, -sz * 0.05, sz * 0.95, sz * 0.38);
    S.bezierCurveTo(sz * 0.85, sz * 0.82, sz * 0.25, sz * 0.92, 0, sz * 0.48);
    S.bezierCurveTo(-sz * 0.25, sz * 0.92, -sz * 0.85, sz * 0.82, -sz * 0.95, sz * 0.38);
    S.bezierCurveTo(-sz * 1.05, -sz * 0.05, -sz * 0.55, -sz * 0.45, 0, -sz * 0.95);
    return S;
  }
  function gubbe(sz, bitten) {
    const S = new THREE.Shape();
    const u = sz / 10;
    // från vänster halsgrop medsols: huvudet, högra armen, benen, vänstra armen
    S.moveTo(-2.4 * u, 5.2 * u);
    if (bitten) {
      // tandmärkena där huvudet satt
      for (let i = 0; i <= 6; i++) S.lineTo((-2.4 + i * 0.8) * u, (5.2 + (i % 2 ? 1.1 : 0.2)) * u);
    } else {
      S.absarc(0, 8.2 * u, 3.9 * u, Math.PI * 1.22, -Math.PI * 0.22, true);
    }
    S.lineTo(2.4 * u, 5.2 * u);
    S.quadraticCurveTo(6 * u, 5.4 * u, 7.6 * u, 4.3 * u);
    S.quadraticCurveTo(8.6 * u, 3 * u, 7.2 * u, 2.4 * u);
    S.quadraticCurveTo(5 * u, 2.6 * u, 3.3 * u, 2 * u);
    S.lineTo(3.4 * u, -1.8 * u);
    S.quadraticCurveTo(5.3 * u, -6.6 * u, 5.4 * u, -8.4 * u);
    S.quadraticCurveTo(4.4 * u, -9.8 * u, 2.9 * u, -8.8 * u);
    S.quadraticCurveTo(1.5 * u, -6 * u, 0, -4.6 * u);
    S.quadraticCurveTo(-1.5 * u, -6 * u, -2.9 * u, -8.8 * u);
    S.quadraticCurveTo(-4.4 * u, -9.8 * u, -5.4 * u, -8.4 * u);
    S.quadraticCurveTo(-5.3 * u, -6.6 * u, -3.4 * u, -1.8 * u);
    S.lineTo(-3.3 * u, 2 * u);
    S.quadraticCurveTo(-5 * u, 2.6 * u, -7.2 * u, 2.4 * u);
    S.quadraticCurveTo(-8.6 * u, 3 * u, -7.6 * u, 4.3 * u);
    S.quadraticCurveTo(-6 * u, 5.4 * u, -2.4 * u, 5.2 * u);
    return S;
  }
  // kakan liggande på pulten (formen i xz-planet), med glasyren som ett rör
  // en bit innanför kanten och prickar (ögon, knappar)
  function kaka(shape, parent, at, rot, dots = []) {
    const g = new THREE.Group();
    g.position.set(...at);
    g.rotation.set(...rot);
    parent.add(g);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.7, bevelSegments: 2, curveSegments: 24 });
    geo.rotateX(-Math.PI / 2);
    mesh(geo, pepparkaka, g);
    const pts = shape.getSpacedPoints(90);
    const c = pts.reduce((a, p) => a.add(p), V2(0, 0)).multiplyScalar(1 / pts.length);
    const line = pts.map((p) => [c.x + (p.x - c.x) * 0.8, 3.1, -(c.y + (p.y - c.y) * 0.8)]);
    mesh(tube(line, 0.6, 160), glasyr, g);
    for (const [x, y] of dots) ball(0.95, glasyr, g, [x, 3.1, -y], [1, 0.5, 1]);
    return g;
  }

  // ---------- lussekatter ----------
  // Ett S av två snäckor, glaserat med saffran, med ett russin i varje.

  function lussekatt(parent, at, ry) {
    const g = new THREE.Group();
    g.position.set(...at);
    g.rotation.y = ry;
    parent.add(g);
    const pts = [];
    // från vänstra snäckans mitt ut och över till högra snäckans mitt
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const side = u < 0.5 ? -1 : 1;
      const v = u < 0.5 ? 1 - u * 2 : (u - 0.5) * 2;
      const a = side * (Math.PI * 0.5 + v * Math.PI * 2.1);
      const r = 3 + v * 11;
      pts.push([side * 15 + Math.cos(a) * r * side, 5.4, Math.sin(a) * r]);
    }
    const t = mesh(tube(pts, 5.6, 200), saffran, g);
    t.scale.y = 0.72;
    for (const s of [-1, 1]) ball(2.6, russin, g, [s * 15 - s * 0.6, 8.6, 0.4 * s], [1, 0.7, 1.2]);
    return g;
  }

  // ---------- kanelbullar ----------
  // En snäcka som stiger mot mitten (kanelen mörk mellan varven), med en
  // knut i mitten och pärlsocker, i pappersform.

  function kanelbulle(parent, at, s) {
    const g = new THREE.Group();
    g.position.set(...at);
    g.rotation.y = hash(s) * 6;
    parent.add(g);
    form(23, 8, g);
    mesh(lathe([[0, 2], [19.5, 2], [19, 8], [12, 13], [0, 15]]), mat('#5e3014', { roughness: 0.85 }), g);
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const a = u * Math.PI * 2 * 2.7;
      const r = 17 - u * 13;
      pts.push([Math.cos(a) * r, 8 + 9 * Math.sin(u * Math.PI * 0.5), Math.sin(a) * r]);
    }
    const t = mesh(tube(pts, 4.3, 300), kanel, g);
    t.scale.y = 0.9;
    ball(4.6, kanel, g, [0, 16.4, 0], [1, 0.75, 1]);
    for (let i = 0; i < 40; i++) {
      const a = hash(s + i * 3.7) * Math.PI * 2;
      const r = Math.sqrt(hash(s + i * 1.9)) * 16;
      const p = mesh(new THREE.IcosahedronGeometry(0.85 + hash(i) * 0.5, 0), parlsocker, g);
      p.position.set(Math.cos(a) * r, 12.6 + 7.6 * Math.cos((r / 17) * Math.PI * 0.5), Math.sin(a) * r);
    }
    return g;
  }

  // ---------- chokladägg ----------
  // Små ägg i skrynklig folie, liggande; går det dåligt är ett skalat och
  // folien ligger tillplattad bredvid.

  const skrynkel = canvasTex(128, 128, (g, w, hh) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, hh); specks(g, w, hh, 900, ['#ffffff', '#3a3a3a', '#a0a0a0', '#5a5a5a'], 2, 23); });
  const folie = (c) => mat(c, { metalness: 1, roughness: 0.32, bumpMap: skrynkel, bumpScale: 1.4, envMapIntensity: 1.6 });
  const FOLIE = ['#d6aa3c', '#b5262c', '#2753a6', '#2f8b4c', '#d6aa3c'];
  const aggGeo = lathe([[0, -11], [4.6, -9.6], [7.4, -5], [8, 0], [7.2, 5], [5, 8.6], [2.4, 10.2], [0, 10.6]], 36);
  function agg(parent, at, rot, m) {
    const e = mesh(aggGeo, m, parent);
    e.position.set(...at);
    e.rotation.set(...rot);
    return e;
  }

  // ---------- chokladbollar ----------

  function chokladboll(parent, at, bitten) {
    const g = new THREE.Group();
    g.position.set(...at);
    parent.add(g);
    if (!bitten) {
      ball(10.5, kokos, g, [0, 9.6, 0], [1, 0.92, 1]);
      return g;
    }
    // ett bett: halva bollen och snittet
    const b = mesh(new THREE.SphereGeometry(10.5, 24, 16, 0, Math.PI * 2, 0.9, Math.PI - 0.9), kokos, g);
    b.position.y = 9.6;
    b.scale.set(1, 0.92, 1);
    const cut = mesh(new THREE.CircleGeometry(8.2, 24), choklad, g);
    cut.rotation.x = -Math.PI / 2;
    cut.position.y = 9.6 + 10.5 * Math.cos(0.9) * 0.92;
    return g;
  }

  // ---------- servetten ----------

  function servett(parent, sz, s) {
    const geo = new THREE.PlaneGeometry(sz, sz, 12, 12);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, 0.25 + 0.5 * Math.sin(p.getX(i) * 0.2 + s) * Math.sin(p.getZ(i) * 0.17) ** 2);
    geo.computeVertexNormals();
    const m = mesh(geo, papper, parent);
    m.rotation.y = 0.5 + hash(s) * 0.6;
    return m;
  }

  // ---------- på pulten ----------

  // hur stort fikat är (radien på pulten)
  const RAD = { semlor: 56, pepparkakor: 44, lussekatter: 40, kanelbullar: 52, paskagg: 34, chokladbollar: 34 };
  let made = null;
  function visa(namn, p, w, s) {
    if (made) {
      root.remove(made);
      made.traverse((x) => { if (x.geometry && x.geometry !== aggGeo) x.geometry.dispose(); });
      made = null;
    }
    root.visible = !!namn;
    if (!namn) return;
    root.position.set(p.x, 0, p.z);
    const g = new THREE.Group();
    root.add(g);
    made = g;
    const bad = w > 0.6;
    let n = 0;
    if (namn === 'semlor') {
      semla(g, [-27, 0, -2], false, s + 1);
      semla(g, [27, 0, 4], bad, s + 2);
      strossla(socker, Math.round(3 + w * 11), 50, s + 3, 0.12, 1.2, 3.6);
      n = Math.round(w * 10);
    } else if (namn === 'pepparkakor') {
      servett(g, 62, s);
      kaka(hjarta(13), g, [-12, 0.6, 6], [0, 0.4 + hash(s + 1) * 0.6, 0]);
      kaka(hjarta(11), g, [8, 4.5, 12], [0.12, -0.5 + hash(s + 2), 0.18]);
      kaka(gubbe(17, bad), g, [10, 0.6, -10], [0, -0.3 + hash(s + 3) * 0.6, 0], bad ? [[-1, 0.5], [1, 0.5]].map(([x, y]) => [x * 0.3, y]) : [[-1.3, 8.8], [1.3, 8.8], [0, 1.2], [0, -1.4]].map(([x, y]) => [x * 1.7, y * 1.7]));
      n = Math.round(4 + w * 16);
    } else if (namn === 'lussekatter') {
      servett(g, 64, s);
      lussekatt(g, [-7, 0.6, -9], 0.15 + hash(s + 1) * 0.4).scale.setScalar(0.72);
      if (!bad) lussekatt(g, [9, 0.6, 13], -0.35 + hash(s + 2) * 0.4).scale.setScalar(0.72);
      n = Math.round(2 + w * 12);
    } else if (namn === 'kanelbullar') {
      kanelbulle(g, [-25, 0, 0], s + 1);
      if (!bad) kanelbulle(g, [25, 0, 6], s + 2);
      n = Math.round(3 + w * 14);
    } else if (namn === 'paskagg') {
      const k = bad ? 2 : 4;
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + hash(s + i) * 0.8;
        agg(g, [Math.cos(a) * 13, 7.8, Math.sin(a) * 11], [0, a + hash(s + i * 2) * 1.5, Math.PI / 2 + (hash(s + i * 3) - 0.5) * 0.3], folie(FOLIE[(i + Math.floor(hash(s) * 5)) % 5]));
      }
      if (bad) {
        agg(g, [4, 7.6, 2], [0, hash(s + 9) * 3, Math.PI / 2], choklad).scale.setScalar(0.94);
        // folien, tillplattad och skrynklig
        const f = new THREE.PlaneGeometry(22, 18, 11, 9);
        f.rotateX(-Math.PI / 2);
        const p = f.attributes.position;
        for (let i = 0; i < p.count; i++) p.setY(i, 0.3 + 1.1 * hash(s + i * 0.77) * (1 - Math.hypot(p.getX(i) / 11, p.getZ(i) / 9) * 0.6));
        f.computeVertexNormals();
        const fm = mesh(f, folie(FOLIE[Math.floor(hash(s) * 5)]), g);
        fm.position.set(-24, 0, 12);
        fm.rotation.y = 0.5;
      }
    } else if (namn === 'chokladbollar') {
      servett(g, 56, s);
      chokladboll(g, [-9, 0.6, -5], false);
      chokladboll(g, [11, 0.6, -2], false);
      chokladboll(g, [2, 0.6, 14], bad);
      n = Math.round(w * 12);
    }
    strossla(smulor, n, RAD[namn], s + 5, 0.6, 0.7, 1.9, namn === 'pepparkakor' ? pepparkaka : namn === 'chokladbollar' ? choklad : smulMat);
    if (namn !== 'semlor') socker.forEach((m) => { m.visible = false; });
    g.rotation.y = (hash(s + 7) - 0.5) * 0.5;
  }

  return { r: (namn) => RAD[namn] || 40, visa };
}
