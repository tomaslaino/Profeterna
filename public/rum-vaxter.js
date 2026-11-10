// Växterna i tobaksaffären (rum-3d.js): en ampellilja i en lerkruka på
// fönsterbänkens vänstra ände och en liten pilea (pannkaksväxt) i en glaserad
// kruka fram till vänster på barbordet.
//
// Rummet ska gå i gamla telefoner och datorer, så växterna kostar så lite som
// möjligt: båda är en enda geometri med färgen i hörnen (ett ritanrop, två med
// skuggkartan), som ritas med pennkoppens material (ingen ny shader att
// kompilera), och bladen är få och enkla – omkring 5 000 trianglar för båda,
// mot flera hundra tusen för gänget. Materialet ritar bara framsidan, så bladen
// har båda sidorna i geometrin. Allt slumpas ur ett fast frö, och ingenting
// rör sig, så växterna ser likadana ut varje gång.
//
//   vaxter(lilja, pilea) → BufferGeometry (position, normal, color) i rummets
//   axlar; lilja och pilea är var krukorna står (Vector3, mitt under krukan).
//
// 1 enhet = 1 px i fönsterbänkens plan, som i rum-3d.js: en Pripps-flaska är
// ungefär 50 hög. Ampelliljan ritas i en kruka av verklig storlek och förstoras
// (LILJA_SKALA) till gängets leksaksmått: krukan blir 36 hög och bladen når
// 80 ut. Pilean är byggd i sina mått: krukan är 17 bred och 10 hög, och bladen
// når 18 ut från mitten och 32 upp.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const rnd0 = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const sm = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
const LILJA_SKALA = 1.45;

// Lägger ihop delar till en geometri med färgen i hörnen. add(geo, farg, m, tva):
// farg är en färg (eller null när geo har färger), m en Matrix4, och med tva
// läggs varje triangel också in vänd åt andra hållet (bladens baksida).
function samling() {
  const pos = [];
  const nor = [];
  const col = [];
  const c = new THREE.Color();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  return {
    add(geo, farg, m, tva) {
      const e = geo.index ? geo.toNonIndexed() : geo;
      if (!e.attributes.normal) e.computeVertexNormals();
      if (m) e.applyMatrix4(m);
      const P = e.attributes.position;
      const N = e.attributes.normal;
      const C = e.attributes.color;
      const lagg = (i, s) => {
        p.fromBufferAttribute(P, i);
        n.fromBufferAttribute(N, i).multiplyScalar(s);
        if (C) c.fromBufferAttribute(C, i);
        else c.set(farg);
        pos.push(p.x, p.y, p.z);
        nor.push(n.x, n.y, n.z);
        col.push(c.r, c.g, c.b);
      };
      for (let i = 0; i < P.count; i++) lagg(i, 1);
      if (tva) for (let i = 0; i < P.count; i += 3) { lagg(i, -1); lagg(i + 2, -1); lagg(i + 1, -1); }
      geo.dispose();
      if (e !== geo) e.dispose();
    },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    },
  };
}

// Ett blad som ett band längs mittlinjen pts, med halva bredden w(s) (s = 0 vid
// basen, 1 i spetsen), sidan sid(t) (vinkelrät mot mittlinjen, t dess riktning),
// kanterna lyfta mot ovansidan (ranna, i bredder) och färgen i mitten och vid
// kanterna (farg(s, mitt)). Tre punkter över bladet.
function band(pts, w, sid, ranna, farg) {
  const n = pts.length;
  const pos = [];
  const col = [];
  const idx = [];
  const t = new THREE.Vector3();
  const upp = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    t.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    const S = sid(t);
    upp.crossVectors(S, t).normalize();
    const b = w(s);
    for (const u of [-1, 0, 1]) {
      const q = pts[i].clone().addScaledVector(S, u * b).addScaledVector(upp, Math.abs(u) * ranna * b);
      pos.push(q.x, q.y, q.z);
      const c = farg(s, u === 0);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < 2; j++) {
      const a = i * 3 + j;
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Mittlinjen för ett blad eller skaft som växer ur p0 åt riktningen d
// (normaliserad) med längden L och böjer sig nedåt med tyngden (per enhet), i steg delar.
function bage(p0, d, L, tyngd, steg) {
  const pts = [p0.clone()];
  const p = p0.clone();
  const r = d.clone();
  for (let k = 0; k < steg; k++) {
    p.addScaledVector(r, L / steg);
    r.y -= tyngd * (L / steg);
    r.normalize();
    pts.push(p.clone());
  }
  return pts;
}

// Sidan vinkelrät mot riktningen t, ur en vågrät sida (för ett blad som pekar åt phi).
const sidAv = (phi) => {
  const s0 = V(-Math.sin(phi), 0, Math.cos(phi));
  return (t) => s0.clone().sub(t.clone().multiplyScalar(s0.dot(t))).normalize();
};

// En kruka svarvad ur profilen [r, y] med färgen efter höjden: farg(y, r).
function svarv(profil, n, farg) {
  const g = new THREE.LatheGeometry(profil.map(([r, y]) => new THREE.Vector2(r, y)), n);
  const P = g.attributes.position;
  const col = [];
  const p = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    p.fromBufferAttribute(P, i);
    const c = farg(p.y, Math.hypot(p.x, p.z));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// Jorden i krukan: en skiva i mullfärg.
function jord(r, y) {
  const g = new THREE.CircleGeometry(r, 12);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

// ---------- ampellilja ----------

// Ampellilja (Chlorophytum comosum) i en lerkruka på ett fat: ett knippe långa,
// smala blad med en ljusare rand i mitten som växer upp ur jorden och böjer sig
// utåt och ner, och två revor med småplantor som hänger över bänkens ände.
// Bladen sträcker sig mest åt sidorna och bakåt, inte fram över bänkens kant
// (där går den som lämnar bordet förbi).
function ampellilja(ut, m) {
  const rnd = rnd0(4711);
  const tegel = new THREE.Color('#ad5735');
  ut.add(svarv([[0, 0], [13.8, 0], [16.6, 3.2], [16.2, 3.6], [13.6, 1.2], [0, 1.2]], 24,
    (y) => new THREE.Color('#99492b').offsetHSL(0, 0, y < 0.3 ? -0.05 : 0)), null, m);
  ut.add(svarv([[0, 1.2], [9.8, 1.2], [10.4, 2], [13, 19], [15.2, 19.3], [15.5, 24.4], [14.8, 25], [13.6, 24.6], [13.3, 22.6]], 24,
    (y, r) => {
      const c = tegel.clone();
      if (y > 18.9) c.offsetHSL(0, 0, 0.03);
      if (y < 5) c.lerp(new THREE.Color('#84442a'), 0.35 * (1 - y / 5));
      if (y > 22.5 && r < 14) c.lerp(new THREE.Color('#5e2c1a'), 0.8);
      return c;
    }), null, m);
  ut.add(jord(13.3, 22.6), '#3a2a1f', m);

  const gron = new THREE.Color('#2f7424');
  const mork = new THREE.Color('#1c4716');
  const rand = new THREE.Color('#a9cc6c');
  const ytan = 23;
  const N = 36;
  for (let i = 0; i < N; i++) {
    // runt krukan, mest åt sidorna och bakåt (z < 0), inget rakt fram
    let phi = (i / N) * 2 * Math.PI + (rnd() - 0.5) * 0.5;
    if (Math.sin(phi) > 0.35) phi += (rnd() < 0.5 ? -1 : 1) * 0.9;
    const yttre = rnd();
    const L = 36 + 40 * Math.pow(yttre, 0.8);
    // de inre bladen står uppåt, de yttre lutar ut och faller över kanten
    const el = (84 - 34 * yttre - 6 * rnd()) * Math.PI / 180;
    const pts = bage(V(Math.cos(phi) * 2.2 * rnd(), ytan, Math.sin(phi) * 2.2 * rnd()),
      V(Math.cos(el) * Math.cos(phi), Math.sin(el), Math.cos(el) * Math.sin(phi)), L, 0.012 + 0.018 * yttre, 9);
    const B = 2.6 + 1.3 * rnd();
    const ljus = 0.85 + 0.3 * rnd();
    ut.add(band(pts, (s) => B * (s < 0.25 ? 0.45 + 0.55 * sm(0, 0.25, s) : Math.max(0.04, 1 - Math.pow((s - 0.25) / 0.75, 1.7))), sidAv(phi), 0.3,
      (s, mitt) => (mitt ? gron.clone().lerp(rand, 0.5) : gron.clone()).lerp(mork, 0.5 * (1 - sm(0, 0.45, s))).multiplyScalar(ljus)), null, m, true);
  }

  // revorna: tunna gulgröna stänglar som bågar ut åt vänster och hänger ner
  // över bänkens ände, med en liten planta längst ut
  for (const [phi, L, ner] of [[Math.PI * 1.06, 52, 30], [Math.PI * 0.93, 40, 18]]) {
    const ri = V(Math.cos(phi), 0, Math.sin(phi));
    const a = V(0, ytan + 6, 0);
    const kurva = new THREE.CatmullRomCurve3([
      a,
      a.clone().addScaledVector(ri, L * 0.3).add(V(0, 12, 0)),
      a.clone().addScaledVector(ri, L * 0.7).add(V(0, 6, 0)),
      a.clone().addScaledVector(ri, L).add(V(0, -ner * 0.4, 0)),
      a.clone().addScaledVector(ri, L + 3).add(V(0, -ner, 0)),
    ]);
    ut.add(new THREE.TubeGeometry(kurva, 16, 0.55, 4, false), '#a9a85c', m);
    const o = kurva.getPoint(1);
    for (let j = 0; j < 6; j++) {
      const ph = (j / 6) * 2 * Math.PI + rnd() * 0.5;
      const el = (30 + 40 * rnd()) * Math.PI / 180;
      const pts = bage(o, V(Math.cos(el) * Math.cos(ph), Math.sin(el), Math.cos(el) * Math.sin(ph)), 8 + 6 * rnd(), 0.05, 4);
      ut.add(band(pts, (s) => 1.4 * (s < 0.3 ? 0.5 + 0.5 * sm(0, 0.3, s) : Math.max(0.05, 1 - Math.pow((s - 0.3) / 0.7, 1.5))), sidAv(ph), 0.3,
        (s, mitt) => (mitt ? gron.clone().lerp(rand, 0.4) : gron.clone())), null, m, true);
    }
  }
}

// ---------- pilea ----------

// Pilea (Pilea peperomioides, pannkaksväxt) i en liten rund kruka glaserad i
// senapsgult: en kort stam med runda blad på skaft runt om, de äldsta längst ner
// och utåt, de yngsta uppåt i mitten. Bladen vänder sig utåt, så att de runda
// bladen syns från sidan.
function pilea(ut, m) {
  const rnd = rnd0(1977);
  ut.add(svarv([[0, 0], [5.6, 0], [6.3, 0.45], [7.4, 2.8], [8, 6], [8.1, 8.4], [8.5, 8.9], [8.35, 9.6], [7.6, 9.6], [7.45, 8.9]], 24,
    (y, r) => {
      if (y < 0.5) return new THREE.Color('#a87c56');
      const c = new THREE.Color('#bf8a22');
      if (y > 8.7) c.lerp(new THREE.Color('#dcb764'), 0.45);
      if (y < 2.6) c.lerp(new THREE.Color('#91611a'), 0.35 * (1 - y / 2.6));
      if (y > 8.8 && r < 7.9) c.lerp(new THREE.Color('#5c3f11'), 0.6);
      return c;
    }), null, m);
  ut.add(jord(7.45, 8.9), '#3a2a1f', m);

  const ytan = 9;
  const stam = new THREE.CatmullRomCurve3([V(0, ytan - 0.5, 0), V(0.4, ytan + 5.5, 0.2), V(0.2, ytan + 11, -0.3)]);
  ut.add(new THREE.TubeGeometry(stam, 6, 0.8, 4, false), '#566f2e', m);
  const N = 18;
  const gyllene = Math.PI * (3 - Math.sqrt(5));
  const mork = new THREE.Color('#1a4a15');
  const ljus = new THREE.Color('#3f7f28');
  const fast = new THREE.Color('#86b358');
  const skaft = new THREE.Color('#71903f');
  for (let i = 0; i < N; i++) {
    // i = 0 är det äldsta: längst ner, längst ut och störst
    const ung = i / (N - 1);
    const phi = i * gyllene + 0.7;
    const ri = V(Math.cos(phi), 0, Math.sin(phi));
    const el = (12 + 58 * ung + 8 * rnd()) * Math.PI / 180;
    const pts = bage(stam.getPoint(0.2 + 0.78 * ung), ri.clone().multiplyScalar(Math.cos(el)).setY(Math.sin(el)), 9 - 4.5 * ung + 1.2 * rnd(), 0.01 * (1 - ung), 4);
    ut.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 4, 0.3, 3, false), skaft, m);
    // bladet: en rund skiva fäst underifrån nära mitten (sköldformat), vänd utåt
    // (de yngsta uppåt) och välvd, ljusast där skaftet sitter
    const R = 6.2 - 2.6 * ung + 0.6 * rnd();
    const skiva = new THREE.CircleGeometry(R, 10);
    const P = skiva.attributes.position;
    const col = [];
    for (let k = 0; k < P.count; k++) {
      const r = Math.hypot(P.getX(k), P.getY(k)) / R;
      P.setZ(k, -0.22 * R * r * r);
      const c = ljus.clone().lerp(mork, 0.25 + 0.55 * r).lerp(fast, r < 0.1 ? 0.7 : 0);
      col.push(c.r, c.g, c.b);
    }
    skiva.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    skiva.computeVertexNormals();
    const n = UP.clone().multiplyScalar(0.4 + 0.55 * ung).addScaledVector(ri, 0.95 - 0.55 * ung).normalize();
    const nedat = ri.clone().sub(n.clone().multiplyScalar(n.dot(ri))).normalize();
    const lm = new THREE.Matrix4().compose(
      pts[pts.length - 1].clone().addScaledVector(ri, R * 0.2).addScaledVector(nedat, R * 0.15).add(V(0, 0.4, 0)),
      new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), rnd() * Math.PI)),
      V(1, 1, 1));
    ut.add(skiva, null, m.clone().multiply(lm), true);
  }
}

export function vaxter(lilja, pilean) {
  const ut = samling();
  ampellilja(ut, new THREE.Matrix4().compose(lilja, new THREE.Quaternion(), V(LILJA_SKALA, LILJA_SKALA, LILJA_SKALA)));
  pilea(ut, new THREE.Matrix4().makeTranslation(pilean.x, pilean.y, pilean.z));
  return ut.geo();
}
