// Kassettstället på fönsterbänken, till vänster om kassettradion (användarens val 2026-11-11 bland fyra
// skisser: stället i svart plast, etiketterna med blå kulspets). Ett fack per match på kupongen, numrerat som
// där, med supporterpoddarnas senaste avsnitt inför omgången (data/poddsidor.json, rum-radio.js): A-sidan är
// hemmalagets podd och B-sidan bortalagets. En match utan podd är ett oinspelat band. Överst står gängets
// egna band, och Blandbandet sitter i radion från början.
//
// Fodralen står kvar i stället när kassetten sitter i radion, utdragna en bit. Kassetten flyger mellan
// fodralet och kassettluckan (flytt: 'in', 'ut', 'vand'), luckan fälls ut, tangenterna på radions lock går
// ner och spolarna i fönstret snurrar och växer och krymper med bandet. rum-3d.js ritar (rita varje bild),
// rum-radio.js bestämmer (lage).
//
// Allt i stället är två ritningar (och ramens skugga): ramen och fodralen (fodralens ryggar och sidor ur en enda duk, som ritas
// om större när kameran går fram till radion: rduk i rum-3d.js). Fodralet till kassetten i radion är en
// tredje, och kassetten som flyger en fjärde bara medan den flyger.
//
//   kassettstall({ THREE, mat, mesh, rduk, merge, scene, radio, kassettBild, fint })
//     → { g, traff, satt(lista), lage(x), flytt(typ, id), tryck(i), rita(t), ruta(id), stallRuta, upptagen }
//   lista: [{ id, text, liten, marke, tom, egen }] uppifrån (null = tomt fack)
//   radio: { k, dorr, kas, tangenter: [6], rullar: [{ hjul, nav }], F } ur kassettradio i rum-3d.js
//   kassettBild(et): kassetten bakom luckan (null = ingen, et = { sida, rad1, rad2, marke })

export const MARKEN = [
  { namn: 'TDK', sub: 'D90', bg: '#151518', fg: '#ffffff', acc: '#d4202a', kropp: '#e9e6dd', kas: '#2e2f34' },
  { namn: 'maxell', sub: 'UR 90', bg: '#c9ccd0', fg: '#121214', acc: '#c8102e', kropp: '#d8d9db', kursiv: true, kas: '#cfd1d4' },
  { namn: 'BASF', sub: 'LH 90', bg: '#e2531d', fg: '#ffffff', acc: '#1d2f6f', kropp: '#f0e9da', kas: '#3a3c42' },
];
const PENNA = '#1f3a93';
const kl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const t = kl((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// Ryggen på ett fodral: märket till vänster och etiketten för hand (texten krymper tills den får plats).
function ritaRygg(c, x, y, w, h, e) {
  const M = MARKEN[(e.marke || 0) % MARKEN.length];
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = M.bg;
  c.fillRect(x, y, w, h);
  const bx = x + Math.round(w * 0.245);
  c.textBaseline = 'middle';
  c.fillStyle = M.fg;
  c.font = `${M.kursiv ? 'italic ' : ''}bold ${Math.max(4, Math.round(h * 0.44))}px Arial, Helvetica, sans-serif`;
  c.fillText(M.namn, x + w * 0.015, y + h * 0.36);
  c.fillStyle = M.acc;
  c.font = `bold ${Math.max(3, Math.round(h * 0.3))}px Arial, Helvetica, sans-serif`;
  c.fillText(M.sub, x + w * 0.018, y + h * 0.76);
  c.fillStyle = '#f4efe2';
  c.fillRect(bx, y, x + w - bx, h);
  c.fillStyle = 'rgba(60,90,160,0.25)';
  c.fillRect(bx, y + h * 0.82, x + w - bx, Math.max(1, h * 0.02));
  c.fillStyle = 'rgba(0,0,0,0.25)';
  c.fillRect(bx, y, Math.max(1, w * 0.004), h);
  if (!e.tom && e.text) {
    const fam = 'Caveat, cursive';
    let lw = 0;
    if (e.liten) { c.font = `500 ${Math.round(h * 0.52)}px ${fam}`; lw = c.measureText(e.liten).width + w * 0.035; }
    const plats = x + w - bx - w * 0.045 - lw;
    let fs = h * 0.78;
    c.font = `600 ${Math.round(fs)}px ${fam}`;
    while (c.measureText(e.text).width > plats && fs > 4) { fs -= Math.max(1, h * 0.03); c.font = `600 ${Math.round(fs)}px ${fam}`; }
    c.fillStyle = PENNA;
    c.fillText(e.text, bx + w * 0.023, y + h * 0.46);
    if (e.liten) {
      c.font = `500 ${Math.round(h * 0.52)}px ${fam}`;
      c.textAlign = 'right';
      c.fillText(e.liten, x + w * 0.98, y + h * 0.5);
      c.textAlign = 'left';
    }
  }
  c.restore();
}

// Kassetten själv, framsidan (bakom luckan och när den flyger): plasten i märkets färg, etiketten med sidan
// och poddens namn, och fönstret (spolarna är egna delar i radion, rullar).
export function ritaKassett(c, w, h, et) {
  const e = et || { sida: 'A', rad1: 'Blandband', rad2: '', marke: 0 };
  const M = MARKEN[(e.marke || 0) % MARKEN.length];
  c.fillStyle = M.kas;
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#ece4cf';
  c.fillRect(w * 0.05, h * 0.07, w * 0.9, h * 0.62);
  c.fillStyle = M.bg === '#c9ccd0' ? M.acc : M.bg;
  c.fillRect(w * 0.05, h * 0.07, w * 0.9, h * 0.07);
  c.strokeStyle = 'rgba(40,50,110,0.28)';
  c.lineWidth = Math.max(1, h * 0.008);
  c.beginPath();
  for (const y of [0.3, 0.4]) { c.moveTo(w * 0.09, h * y); c.lineTo(w * 0.91, h * y); }
  c.stroke();
  // sidan i en ruta till vänster, och texten för hand
  c.fillStyle = '#1b1b1f';
  c.font = `bold ${Math.round(h * 0.13)}px Arial, Helvetica, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(e.sida || 'A', w * 0.1, h * 0.215);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#1b2a66';
  const fit = (t, fs0, maxW) => { let fs = fs0; c.font = `700 ${Math.round(fs)}px Caveat, cursive`; while (c.measureText(t).width > maxW && fs > 4) { fs -= 1; c.font = `700 ${Math.round(fs)}px Caveat, cursive`; } };
  if (e.rad1) { fit(e.rad1, h * 0.17, w * 0.76); c.fillText(e.rad1, w * 0.15, h * 0.285); }
  if (e.rad2) { fit(e.rad2, h * 0.11, w * 0.8); c.fillText(e.rad2, w * 0.1, h * 0.39); }
  // fönstret: mörkt, med bandet som ett brunt stråk
  c.fillStyle = '#17171a';
  c.fillRect(w * 0.26, h * 0.43, w * 0.48, h * 0.22);
  c.fillStyle = 'rgba(90,60,35,0.6)';
  c.fillRect(w * 0.26, h * 0.62, w * 0.48, h * 0.02);
  c.fillStyle = '#26272b';
  c.beginPath();
  c.moveTo(w * 0.14, h);
  c.lineTo(w * 0.2, h * 0.76);
  c.lineTo(w * 0.8, h * 0.76);
  c.lineTo(w * 0.86, h);
  c.fill();
  c.fillStyle = '#6a6a6e';
  for (const x of [0.28, 0.5, 0.72]) { c.beginPath(); c.arc(w * x, h * 0.88, h * 0.022, 0, 7); c.fill(); }
}

// Navet i spolen: vitt med sex kuggar (en liten duk som vrids)
export function ritaNav(c, w, h) {
  c.clearRect(0, 0, w, h);
  const r = w * 0.5;
  c.fillStyle = '#e8e4da';
  c.beginPath(); c.arc(r, r, r * 0.62, 0, 7); c.fill();
  c.fillStyle = '#17171a';
  c.beginPath(); c.arc(r, r, r * 0.36, 0, 7); c.fill();
  c.fillStyle = '#e8e4da';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    c.save();
    c.translate(r + Math.cos(a) * r * 0.3, r + Math.sin(a) * r * 0.3);
    c.rotate(a);
    c.fillRect(-r * 0.09, -r * 0.05, r * 0.18, r * 0.1);
    c.restore();
  }
}

export function kassettstall({ THREE, mat, mesh, rduk, merge, scene, radio, kassettBild, calm }) {
  // Måtten i cm. Fodralet: 11 × 1,7 × 7, ryggen mot +z. Stället: RADER fack med STEG cm emellan.
  const RADER = 16;
  const STEG = 2.05;
  const HH = RADER * STEG + 2.2;
  const FW = 11;
  const FH = 1.7;
  const FD = 7;
  const UT = 2.6;
  const g = new THREE.Group();
  g.name = 'kassettstall';
  const ram = mat('#1a1a1d', { roughness: 0.5 });
  const bitar = [];
  const lada = (w, h, d, x, y, z) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y, z); bitar.push(b); };
  for (const sx of [-6.1, 6.1]) lada(0.8, HH, 8, sx, HH / 2, 0);
  lada(13, 1, 9, 0, 0.5, 0.2);
  lada(13, 0.8, 8, 0, HH - 0.4, 0);
  lada(11.4, HH, 0.4, 0, HH / 2, -3.8);
  for (let i = 0; i <= RADER; i++) lada(11.4, 0.18, 1.2, 0, 1 + i * STEG, 3.4);
  const ramM = mesh(merge(bitar), ram, g);
  // facket i, uppifrån: fodralets mitt
  const fackY = (i) => 1 + (RADER - 1 - i) * STEG + 0.95;

  // Duken med ryggarna (en rad per fack) och sidornas färger i sista raden
  const L = { lista: [], aktiv: null, utdrag: {}, et: null };
  const DUK = rduk(128, 20 * (RADER + 1), (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const rh = h / (RADER + 1);
    L.lista.forEach((e, i) => { if (e) ritaRygg(c, 0, i * rh, w, rh, e); });
    const fr = ['#2c2c30', ...MARKEN.map((M) => M.bg)];
    fr.forEach((f, j) => { c.fillStyle = f; c.fillRect((j / fr.length) * w, RADER * rh, w / fr.length, rh); });
  });
  const fodMat = mat('#ffffff', { map: DUK, roughness: 0.42, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  // ett fodral i facket i med rätt bit av duken på varje sida
  function fodralGeo(i, e) {
    const b = new THREE.BoxGeometry(FW, FH, FD);
    const uv = b.attributes.uv;
    const sv = 1 - (RADER + 0.5) / (RADER + 1);
    const farg = (j) => [(j + 0.5) / (MARKEN.length + 1), sv];
    const sida = farg(1 + ((e.marke || 0) % MARKEN.length));
    const mork = farg(0);
    // (BoxGeometry: +x, −x, +y, −y, +z, −z, fyra hörn var)
    const ytor = [sida, sida, sida, mork, null, mork];
    for (let f = 0; f < 6; f++) {
      for (let v = 0; v < 4; v++) {
        const n = f * 4 + v;
        if (ytor[f]) uv.setXY(n, ytor[f][0], ytor[f][1]);
        else uv.setXY(n, uv.getX(n), 1 - (i + (1 - uv.getY(n))) / (RADER + 1));
      }
    }
    return b;
  }
  // (fodralen står i ställets skugga: de kastar ingen egen)
  const fodM = new THREE.Mesh(new THREE.BufferGeometry(), fodMat);
  fodM.receiveShadow = true;
  g.add(fodM);
  // fodralet som är utdraget (kassetten sitter i radion) eller på väg ut och in
  const aktM = new THREE.Mesh(new THREE.BufferGeometry(), fodMat);
  aktM.receiveShadow = true;
  aktM.visible = false;
  g.add(aktM);
  const index = (id) => L.lista.findIndex((e) => e && e.id === id);
  function bygg() {
    const geos = [];
    L.lista.forEach((e, i) => {
      if (!e || e.id === L.aktiv) return;
      const b = fodralGeo(i, e);
      b.translate(0, fackY(i), 0.4 + (((i * 7919) % 13) / 13) * 0.5);
      geos.push(b);
    });
    fodM.geometry.dispose();
    fodM.geometry = geos.length ? merge(geos) : new THREE.BufferGeometry();
    const i = index(L.aktiv);
    aktM.visible = i >= 0;
    if (i >= 0) {
      aktM.geometry.dispose();
      aktM.geometry = fodralGeo(i, L.lista[i]);
      aktM.position.set(0, fackY(i), 0.4 + UT);
    }
  }
  function satt(lista, aktiv) {
    if (aktiv !== undefined) L.aktiv = aktiv;
    L.lista = lista.slice(0, RADER);
    while (L.lista.length < RADER) L.lista.push(null);
    DUK.userData.rita(DUK.image.getContext('2d'), DUK.image.width, DUK.image.height);
    DUK.needsUpdate = true;
    bygg();
  }

  // ---------- radion: luckan, tangenterna, spolarna ----------
  // Läget som rum-radio.js säger: i (kassetten i radion), lage ('stop', 'play', 'ff', 'rew'), paus, p (hur
  // långt bandet har gått, 0–1)
  const S = { i: null, lage: 'stop', paus: false, p: 0, vinkel: 0, sen: null, tryckt: {}, ko: [], nu: null };
  // Kassetten som flyger (i världen, scenen)
  const flygMat = mat('#ffffff', { map: radio.kasMap, roughness: 0.6 });
  const plastF = mat('#2e2f34', { roughness: 0.4 });
  const KW = 16.6 * radio.sk;
  const KH = 7.3 * radio.sk;
  const fly = new THREE.Mesh(new THREE.BoxGeometry(KW, KH, 1.0), [plastF, plastF, plastF, plastF, flygMat, plastF]);
  fly.visible = false;
  fly.castShadow = true;
  scene.add(fly);
  const vq = new THREE.Quaternion();
  const vp = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const qA = new THREE.Quaternion();
  const qB = new THREE.Quaternion();
  const LIGG = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const VAND = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  // fodralets framkant i facket (kassetten tas ur där), i världen
  function iFack(i, ut) {
    g.updateMatrixWorld(true);
    vp.set(0, fackY(i) + 0.6, 0.4 + FD / 2 + ut).applyMatrix4(g.matrixWorld);
    g.getWorldQuaternion(vq);
    return [vp.clone(), vq.clone().multiply(LIGG)];
  }
  function iLuckan(fram = 0) {
    radio.kas.updateMatrixWorld(true);
    vp.set(0, 0, 0.6 + fram).applyMatrix4(radio.kas.matrixWorld);
    radio.kas.getWorldQuaternion(vq);
    return [vp.clone(), vq.clone()];
  }
  // Ett steg i taget (kön): typ, id, start och längd i sekunder
  // (med minskad rörelse på ett ögonblick)
  const LANGD = calm ? { in: 0.02, ut: 0.02, vand: 0.02 } : { in: 1.35, ut: 1.25, vand: 1.3 };
  // → hur länge det dröjer tills steget är klart, i sekunder
  function flytt(typ, id, t, et) {
    S.ko.push({ typ, id, et: et || null });
    if (!S.nu) nasta(t);
    return S.ko.reduce((a, x) => a + LANGD[x.typ], S.nu ? Math.max(0, S.nu.t0 + LANGD[S.nu.typ] - t) : 0);
  }
  function nasta(t) {
    S.nu = S.ko.shift() || null;
    if (!S.nu) return;
    S.nu.t0 = t;
    const i = index(S.nu.id);
    if (S.nu.typ === 'in') {
      // det nya fodralet dras ut, och kassetten visar sin etikett
      L.aktiv = S.nu.id;
      bygg();
      kassettBild(S.nu.et || null);
      radio.kas.visible = false;
    } else if (S.nu.typ === 'ut') {
      radio.kas.visible = true;
    }
    S.nu.i = i;
  }
  function lage(x) { Object.assign(S, x); }
  function tryck(i, t) { S.tryckt[i] = t; }

  const ner = (i, t) => {
    if (S.tryckt[i] != null && t - S.tryckt[i] < 0.2) return 1;
    if (!S.i) return 0;
    if (i === 1) return S.lage === 'play' ? 1 : 0;
    if (i === 2) return S.lage === 'rew' ? 1 : 0;
    if (i === 3) return S.lage === 'ff' ? 1 : 0;
    if (i === 5) return S.paus ? 1 : 0;
    return 0;
  };
  const RULLE = { min: 0.42, max: 0.78 };
  function rita(t) {
    const dt = S.sen == null ? 0 : Math.max(0, Math.min(0.25, t - S.sen));
    S.sen = t;
    // tangenterna (en sänkt tangent står 0,9 lägre)
    radio.tangenter.forEach((m, i) => {
      const mal = ner(i, t);
      m.userData.ner = m.userData.ner == null ? mal : m.userData.ner + (mal - m.userData.ner) * (1 - Math.exp(-dt * 30));
      m.position.y = m.userData.y0 - 0.9 * m.userData.ner;
    });
    // spolarna: storleken efter bandet, och de snurrar när bandet går
    const fart = !S.i || S.paus ? 0 : S.lage === 'play' ? -2.2 : S.lage === 'ff' ? -22 : S.lage === 'rew' ? 22 : 0;
    S.vinkel += fart * dt;
    // (utan kassett i radion syns inga spolar)
    const har = radio.kas.visible;
    radio.rullar.forEach((r, j) => {
      const fyll = j === 0 ? 1 - S.p : S.p;
      const rad = Math.sqrt(RULLE.min ** 2 + (RULLE.max ** 2 - RULLE.min ** 2) * kl(fyll));
      r.hjul.scale.setScalar(har ? rad : 1e-4);
      r.nav.scale.setScalar(har ? 1 : 1e-4);
      r.nav.rotation.z = S.vinkel * (RULLE.max / rad) * 0.6 + j;
    });
    // luckan, fodralet och kassetten som flyger
    const N = S.nu;
    let dorr = 0;
    if (N) {
      const u = t - N.t0;
      const i = N.i;
      if (N.typ === 'in') {
        aktM.position.z = 0.4 + UT * sm(0, 0.35, u);
        dorr = sm(0.12, 0.42, u) * (1 - sm(1.08, 1.32, u));
        const f = sm(0.35, 1.05, u);
        if (u >= 0.35 && u < 1.05 && i >= 0) {
          const [p0, q0] = iFack(i, UT);
          const [p1, q1] = iLuckan();
          fly.visible = true;
          fly.position.lerpVectors(p0, p1, f);
          fly.position.y += Math.sin(f * Math.PI) * 9;
          fly.quaternion.slerpQuaternions(q0, q1, sm(0.1, 0.85, f));
        } else fly.visible = false;
        radio.kas.visible = u >= 1.05;
      } else if (N.typ === 'ut') {
        dorr = sm(0, 0.25, u) * (1 - sm(0.98, 1.2, u));
        radio.kas.visible = u < 0.25;
        const f = sm(0.25, 0.95, u);
        if (u >= 0.25 && u < 0.95 && i >= 0) {
          const [p0, q0] = iLuckan();
          const [p1, q1] = iFack(i, UT);
          fly.visible = true;
          fly.position.lerpVectors(p0, p1, f);
          fly.position.y += Math.sin(f * Math.PI) * 9;
          fly.quaternion.slerpQuaternions(q0, q1, sm(0.15, 0.9, f));
        } else fly.visible = false;
        aktM.position.z = 0.4 + UT * (1 - sm(0.95, 1.2, u));
        if (u >= 0.95 && L.aktiv === N.id) {
          // fodralet är tillbaka
          L.aktiv = null;
          if (i >= 0) { aktM.visible = true; aktM.geometry.dispose(); aktM.geometry = fodralGeo(i, L.lista[i]); aktM.position.set(0, fackY(i), 0.4 + UT * (1 - sm(0.95, 1.2, u))); }
          N.tillbaka = true;
        }
      } else if (N.typ === 'vand') {
        dorr = sm(0, 0.25, u) * (1 - sm(1.05, 1.3, u));
        const f = sm(0.25, 1.0, u);
        if (u >= 0.25 && u < 1.0) {
          const [p0, q0] = iLuckan();
          const [p1] = iLuckan(3);
          radio.kas.visible = false;
          fly.visible = true;
          fly.position.lerpVectors(p0, p1, Math.sin(f * Math.PI));
          qA.copy(q0);
          qB.copy(q0).multiply(VAND);
          // (halvvägs syns baksidan: där byts etiketten till den andra sidan)
          fly.quaternion.slerpQuaternions(qA, qB, f);
          if (f > 0.5 && !N.bytt) { N.bytt = true; kassettBild(N.et || null); }
          if (f > 0.5) fly.quaternion.multiply(VAND);
        } else {
          fly.visible = false;
          radio.kas.visible = true;
        }
      }
      if (u >= LANGD[N.typ]) {
        fly.visible = false;
        if (N.typ === 'ut') { radio.kas.visible = false; if (N.tillbaka) bygg(); }
        if (N.typ === 'vand' && !N.bytt) kassettBild(N.et || null);
        nasta(t);
      }
    }
    radio.dorr.rotation.x = 0.42 * dorr;
  }
  // Fodralets rygg i stället, i stället eget rum (för knapparna över dem i närbilden): [x0, y0, x1, y1, z]
  function ruta(id) {
    const i = index(id);
    if (i < 0) return null;
    const ut = id === L.aktiv ? UT : 0;
    return [-FW / 2, fackY(i) - STEG / 2, FW / 2, fackY(i) + STEG / 2, 0.4 + FD / 2 + ut];
  }
  const stallRuta = [-6.5, 0, 6.5, HH, 4.6];
  return {
    g, traff: [ramM], satt, lage, flytt, tryck, rita, ruta, stallRuta,
    ider: () => L.lista.filter((e) => e && e.spelbar).map((e) => e.id),
    upptagen: () => Boolean(S.nu || S.ko.length),
    LANGD,
  };
}
