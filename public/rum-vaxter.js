// Växterna i tobaksaffären (rum-3d.js): en ampellilja i en lerkruka på
// fönsterbänkens vänstra ände och en liten pilea (pannkaksväxt) i en glaserad
// kruka fram till vänster på barbordet – och en gullranka på bardisken
// (rum-inredning.js, längst ner).
//
// Rummet ska gå i gamla telefoner och datorer, så växterna kostar så lite som
// möjligt: ampelliljan och pilean är en enda geometri med färgen i hörnen (ett ritanrop, två med
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

// ---------- gullranka ----------

// Ett hjärtformat blad: fäst i p, riktat åt d med ovansidan åt n (d och n
// vinkelräta och normaliserade), längden L, halva bredden B och tyngden som
// böjer spetsen nedåt. Mittlinjen börjar en bit bakom fästet, så att bladets
// bas sticker ut bakåt som på ett hjärta; bredast en fjärdedel ut och sedan
// rundat mot en kort spets. Ett blad som når under golv lyfts upp till det.
// Materialet ritar båda sidorna.
function hjarta(ut, p, d, n, L, B, tyngd, farg, golv = -Infinity) {
  const pts = [];
  const r = d.clone();
  const q = p.clone().addScaledVector(d, -0.14 * L);
  for (let i = 0; i < 7; i++) {
    pts.push(q.clone());
    q.addScaledVector(r, L / 6);
    r.y -= tyngd;
    r.normalize();
  }
  const S = new THREE.Vector3();
  const g = band(pts, (s) => B * (s < 0.25 ? 0.55 + 0.45 * sm(0, 0.25, s) : Math.max(0.02, Math.sqrt(1 - ((s - 0.25) / 0.75) ** 2))),
    (t) => S.crossVectors(t, n).normalize().clone(), 0.16, farg);
  g.computeBoundingBox();
  if (g.boundingBox.min.y < golv) g.translate(0, golv - g.boundingBox.min.y, 0);
  ut.add(g, null, null, false);
}

// Gullranka (Epipremnum aureum) i en krämvit glaserad kruka med ett brunt band,
// på ett fat: en tuva av hjärtformade blad, gröna med gula stråk, och fyra
// revor – två som hänger över diskens kant och två som kryper längs skivan, åt
// var sitt håll. Den står på bardisken i rum-inredning.js, som ritas en gång
// till en duk, så den kostar ingenting i bildrutorna (omkring 4 800 trianglar,
// en gång). Byggd i verkliga mått som disken: krukan är 24 bred och 17 hög,
// och tuvan når 35 upp. Ögat ser disken nästan från sidan, så bladen vänder
// sig en bit mot det (som mot ljuset i rummet): annars syntes de mest som
// streck. Allt slumpas ur ett fast frö.
//
//   gullranka({ kant, rund, oga }) → BufferGeometry (position, normal, color)
//   med y uppåt och origo mitt under krukan: diskens kant ligger kant bort åt
//   −x och är rundad med radien rund, z går längs disken och oga är
//   riktningen mot ögat ({ x, y, z }).
export function gullranka({ kant, rund, oga }) {
  const ut = samling();
  const rnd = rnd0(2311);
  const m = new THREE.Matrix4();
  ut.add(svarv([[0, 0], [10.4, 0], [11.6, 0.5], [12.1, 1.9], [11.7, 2.1], [10.5, 1], [0, 1]], 24,
    () => new THREE.Color('#cbbd9f')), null, m);
  ut.add(svarv([[0, 1], [8.1, 1], [8.5, 1.5], [9.5, 8], [9.85, 11.3], [9.9, 11.7], [9.95, 12.5], [10, 12.9], [10.2, 14.4],
    [11.1, 14.6], [11.4, 16.3], [10.9, 16.8], [10.1, 16.4], [9.9, 15]], 24,
    (y, r) => {
      const c = new THREE.Color('#e3d7bd');
      if (y < 3) c.lerp(new THREE.Color('#a8956f'), 0.5 * (1 - y / 3));
      if (y > 11.5 && y < 12.7) c.set('#7c4527');
      if (y > 14.5) c.lerp(new THREE.Color('#f3ecdb'), 0.5);
      if (y > 14.9 && r < 10.5) c.lerp(new THREE.Color('#4a3424'), 0.85);
      return c;
    }), null, m);
  ut.add(jord(9.9, 15), '#3a2a1f', m);

  const GRON = new THREE.Color('#357227');
  const MORK = new THREE.Color('#1b4315');
  const GULD = new THREE.Color('#d2c86a');
  const STJALK = '#7f9a46';
  const UPP = V(0, 1, 0);
  const OGA = V(oga.x, oga.y, oga.z).normalize();
  // mot ögat längs disken, och åt sidan sett därifrån
  const FRAM = V(OGA.x, 0, OGA.z).normalize();
  const SIDAN = V(FRAM.z, 0, -FRAM.x);
  // gula stråk ut från mittnerven, olika mycket på varje blad
  const farg = () => {
    const guld = 0.2 + 0.6 * rnd();
    const fas = rnd() * 6.3;
    const ljus = 0.85 + 0.25 * rnd();
    return (s, mitt) => {
      const strak = guld * sm(0.45, 0.95, 0.5 + 0.5 * Math.sin(9 * s + fas));
      return GRON.clone().lerp(GULD, mitt ? strak : 0.45 * strak).lerp(MORK, (mitt ? 0 : 0.2) + 0.35 * (1 - sm(0, 0.3, s))).multiplyScalar(ljus);
    };
  };
  // v vinkelrätt mot n (normaliserad)
  const vinkelratt = (v, n) => v.clone().addScaledVector(n, -v.dot(n)).normalize();
  // ovansidan för ett blad åt d: uppåt, vänd en bit (k) mot ögat
  const mot = (d, k) => vinkelratt(vinkelratt(UPP, d).addScaledVector(OGA, k), d);

  // tuvan: de äldsta bladen längst ut och hängande över krukans kant, de
  // yngsta i mitten och uppåt; skaften ur jorden
  const ytan = 15;
  const N = 24;
  const gyllene = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const ung = i / (N - 1);
    const phi = i * gyllene + (rnd() - 0.5) * 0.4;
    const ri = V(Math.cos(phi), 0, Math.sin(phi));
    const fot = ri.clone().multiplyScalar(4.5 * (1 - ung) * rnd()).setY(ytan);
    const el = (28 + 42 * ung + 8 * rnd()) * Math.PI / 180;
    const fast = fot.clone().addScaledVector(ri.clone().multiplyScalar(Math.cos(el)).setY(Math.sin(el)), 11 - 3 * ung + 2 * rnd());
    ut.add(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(fot, fot.clone().lerp(fast, 0.5).setY(fast.y + 1.5), fast), 4, 0.42, 3, false), STJALK, m);
    // (de som pekar mot ögat hänger inte ner framför krukan)
    const lut = Math.max((-55 + 95 * ung + 12 * rnd()), ri.dot(FRAM) > 0.2 ? -10 : -90) * Math.PI / 180;
    // ovansidan vänds mot ögat och ljuset, och bladet följer med: de som pekar
    // mot ögat lutar då mindre uppåt (undersidan låg i skugga och syntes
    // nästan svart)
    const d0 = ri.clone().multiplyScalar(Math.cos(lut)).setY(Math.sin(lut)).normalize();
    const n = vinkelratt(UPP, d0).addScaledVector(OGA, 0.7).normalize();
    const d = vinkelratt(d0, n);
    const L = 14.5 + 2 * rnd() - 2.5 * ung;
    hjarta(ut, fast, d, n, L, L * 0.38, 0.05 * (1 - ung), farg(), 0.4);
  }

  // revorna: ut över krukans kant och ner på disken, och sedan över kanten
  // (rundad, med mitten i (−kant + rund, −rund)) och rakt ner, eller längs skivan
  const kx = -kant + rund;
  const runt = (a, z) => V(kx + Math.cos(a) * (rund + 0.9), -rund + Math.sin(a) * (rund + 0.9), z);
  const UT = V(-1, 0.2, 0.35).normalize().addScaledVector(OGA, 0.8).normalize();
  const ner = (z, y) => [runt(Math.PI / 2, z), runt(Math.PI * 0.75, z + 0.3), runt(Math.PI * 0.95, z + 0.5), V(-kant - 0.9, -14, z + 0.7), V(-kant - 1.1, y * 0.6, z + 1), V(-kant - 2, y, z + 2)];
  const revor = [
    [V(-7, 15.2, -5), V(-11, 16.6, -6), V(-17.5, 1.4, -4), V(-27, 0.75, 1), ...ner(3, -47)],
    [V(-8.5, 15.2, 1), V(-12.5, 16.4, 2), V(-18.5, 1.3, 7), V(-25.5, 0.75, 14), ...ner(19, -33)],
    [V(-1, 15.4, -8), V(-2, 16.6, -11.5), V(-5, 1.3, -16), V(-8, 0.75, -24), V(-6, 0.75, -32), V(-9, 0.75, -40), V(-10.5, 1.4, -45)],
    [V(3, 15.4, 8), V(4, 16.6, 11.5), V(2, 1.3, 17), V(-3, 0.75, 26), V(-8, 0.75, 33), V(-10.5, 1.4, 37)],
  ];
  for (const pts of revor) {
    const kurva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    ut.add(new THREE.TubeGeometry(kurva, 6 * pts.length, 0.45, 4, false), STJALK, m);
    // ett blad var femte enhet, växelvis åt var sitt håll, mindre mot spetsen:
    // där revan hänger (utanför krukan och nedanför diskens kant) vänt utåt och
    // mot ögat, och på disken resta en bit
    const len = kurva.getLength();
    let sida = rnd() < 0.5 ? 1 : -1;
    for (let l = 6; l < len - 1; l += 4.2 + rnd()) {
      const u = l / len;
      const p = kurva.getPointAt(u);
      const t = kurva.getTangentAt(u);
      const hanger = t.y < -0.6;
      const krukan = p.x > kx;
      // (inga runt kanten, och inga framför krukan sett från ögat)
      if (hanger && (krukan ? p.dot(FRAM) > 0 && Math.abs(p.dot(SIDAN)) < 9 : p.y > -12)) continue;
      const F = !hanger ? UPP : krukan ? V(p.x, 0, p.z).normalize().addScaledVector(OGA, 0.8).normalize() : UT;
      const S = V(0, 0, 0).crossVectors(t, F).normalize();
      const fast = p.clone().addScaledVector(S, sida * 0.9).addScaledVector(F, hanger ? 0.9 : 0.5);
      const d = t.clone().multiplyScalar(hanger ? 0.55 : 0.3).addScaledVector(S, sida * 0.95);
      if (hanger) d.addScaledVector(F, -d.dot(F)).normalize();
      else d.add(V(0, 0.45, 0)).normalize();
      const L = 10 - 4 * Math.min(1, l / len) + rnd();
      hjarta(ut, fast, d, hanger ? vinkelratt(F, d) : mot(d, 0.6), L, L * 0.38, hanger ? 0.03 : 0, farg(), hanger && !krukan ? -Infinity : 0.4);
      sida = -sida;
    }
  }
  return ut.geo();
}

export function vaxter(lilja, pilean) {
  const ut = samling();
  ampellilja(ut, new THREE.Matrix4().compose(lilja, new THREE.Quaternion(), V(LILJA_SKALA, LILJA_SKALA, LILJA_SKALA)));
  pilea(ut, new THREE.Matrix4().makeTranslation(pilean.x, pilean.y, pilean.z));
  return ut.geo();
}
