// Gängets mobiler (rum-telefon.js): Nokia 3310 (DL), Ericsson GA628 (DT) och
// Ericsson T28 (DJ). Byggda för att kosta lite: kroppen är en rundad låda, hela
// framsidan (knappar, logga, ram) är en målad bild på en platta, skärmen en egen
// liten duk som bara ritas om när texten ändras, och GA628 och T28 har en
// antennstump. Tre till fyra ritanrop per telefon.
//
//   mobil('DL', THREE, RoundedBoxGeometry) → THREE.Group, mått i millimeter,
//   framsidan mot +z, längden längs +y, mitten i origo.
//   grupp.userData.skarm(text1, text2, tänd)  ritar skärmen (tänd = grönt sken)
//   grupp.userData.mal                         { langd, bredd, djup } i mm

const MODELL = {
  DL: { namn: 'nokia', b: 47, l: 113, d: 21, r: 11, kropp: '#3a3d43', front: '#1d3b78', skarm: [0, 26, 28, 20], ant: null },
  DT: { namn: 'ga628', b: 49, l: 130, d: 23, r: 7, kropp: '#2b2d31', front: '#2b2d31', skarm: [0, 35, 32, 17], ant: [15, 3.8, 22] },
  DJ: { namn: 't28', b: 50, l: 97, d: 15, r: 6, kropp: '#43474d', front: '#43474d', skarm: [0, 30, 31, 16], ant: [16, 3.2, 14] },
};

const PX = 6; // bildpunkter per millimeter på framsidan

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// Knappsatsen: tolv knappar med siffror, lite ljus överst och skugga nederst.
function knappar(g, m, { x0, y0, dx, dy, w, h, r, bg, fg, lut = 0 }) {
  '123456789*0#'.split('').forEach((c, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = m.cx(x0 + col * dx), cy = m.cy(y0 - row * dy);
    g.save(); g.translate(cx, cy); g.rotate((col - 1) * lut);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w * PX / 2, -h * PX / 2 + 2, w * PX, h * PX, r * PX); g.fill();
    g.fillStyle = bg; rr(g, -w * PX / 2, -h * PX / 2, w * PX, h * PX, r * PX); g.fill();
    const gr = g.createLinearGradient(0, -h * PX / 2, 0, h * PX / 2);
    gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = gr; rr(g, -w * PX / 2, -h * PX / 2, w * PX, h * PX, r * PX); g.fill();
    g.fillStyle = fg; g.font = `bold ${h * PX * 0.6}px Helvetica, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(c, 0, 1);
    g.restore();
  });
}

function framsida(kod, M) {
  const c = document.createElement('canvas');
  c.width = Math.round(M.b * PX); c.height = Math.round(M.l * PX);
  const g = c.getContext('2d');
  const m = { cx: (x) => c.width / 2 + x * PX, cy: (y) => c.height / 2 - y * PX };
  g.fillStyle = M.front; g.fillRect(0, 0, c.width, c.height);
  // lite glans uppifrån
  const sk = g.createLinearGradient(0, 0, c.width, c.height);
  sk.addColorStop(0, 'rgba(255,255,255,.16)'); sk.addColorStop(0.45, 'rgba(255,255,255,0)'); sk.addColorStop(1, 'rgba(0,0,0,.2)');
  g.fillStyle = sk; g.fillRect(0, 0, c.width, c.height);
  const [sx, sy, sw, sh] = M.skarm;
  const text = (t, x, y, s, f) => { g.fillStyle = f; g.font = `bold ${s * PX}px Helvetica, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, m.cx(x), m.cy(y)); };
  if (kod === 'DL') {
    // Nokia 3310: ljus ram runt skärmen, NOKIA ovanför, den ovala Navi-knappen, C och pilen
    g.fillStyle = '#b9bec5'; rr(g, m.cx(-18.5), m.cy(44), 37 * PX, 36 * PX, 6 * PX); g.fill();
    text('NOKIA', 0, 39.5, 4.2, '#2a2f36');
    g.fillStyle = '#c9d1db'; g.beginPath(); g.ellipse(m.cx(0), m.cy(3), 10 * PX, 5 * PX, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(m.cx(0), m.cy(2.4), 10 * PX, 5 * PX, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#aeb7c2'; rr(g, m.cx(12.5), m.cy(8.5), 7 * PX, 5 * PX, 2 * PX); g.fill(); rr(g, m.cx(-19.5), m.cy(9.5), 7 * PX, 9 * PX, 2.5 * PX); g.fill();
    knappar(g, m, { x0: -12.5, y0: -12, dx: 12.5, dy: 9.2, w: 10.5, h: 6.6, r: 2.6, bg: '#b4bfcc', fg: '#1d2330', lut: 0.08 });
  } else if (kod === 'DT') {
    // Ericsson GA628: högtalarspringor, svart glas runt skärmen, ERICSSON, YES och NO
    for (let i = 0; i < 4; i++) { g.fillStyle = '#121315'; rr(g, m.cx(-7), m.cy(58 - i * 2.6), 14 * PX, 1.2 * PX, 0.5 * PX); g.fill(); }
    g.fillStyle = '#0f1012'; rr(g, m.cx(-20), m.cy(48.5), 40 * PX, 27 * PX, 3 * PX); g.fill();
    text('ERICSSON', 0, 16.5, 3.6, '#c9ccd1');
    const knapp = (t, x, f) => { g.fillStyle = '#3d4046'; rr(g, m.cx(x - 6), m.cy(10), 12 * PX, 6 * PX, 2.5 * PX); g.fill(); text(t, x, 7, 3.2, f); };
    knapp('YES', -14, '#7ee08a'); knapp('', 0, '#fff'); knapp('NO', 14, '#ff6b5e');
    knappar(g, m, { x0: -13.5, y0: -6, dx: 13.5, dy: 9.6, w: 11.5, h: 7, r: 2.4, bg: '#4a4e55', fg: '#f2f2f2' });
  } else {
    // Ericsson T28: liten och blank, svart glas, ljusa knappar
    g.fillStyle = '#0f1012'; rr(g, m.cx(-20), m.cy(42), 40 * PX, 24 * PX, 3 * PX); g.fill();
    text('ERICSSON', 0, 14, 3.2, '#d7dade');
    knappar(g, m, { x0: -13, y0: 3, dx: 13, dy: 8.6, w: 11, h: 6.2, r: 2.6, bg: '#c7ccd2', fg: '#22252a' });
  }
  return c;
}

export function mobil(kod, THREE, RoundedBoxGeometry) {
  const M = MODELL[kod];
  const g = new THREE.Group();
  const plast = (col, r, cc) => new THREE.MeshPhysicalMaterial({ color: col, roughness: r, clearcoat: cc, clearcoatRoughness: 0.35 });
  const kropp = new THREE.Mesh(new RoundedBoxGeometry(M.b, M.l, M.d, 2, M.r * 0.5), plast(M.kropp, 0.5, 0.2));
  g.add(kropp);
  const ft = new THREE.CanvasTexture(framsida(kod, M));
  ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 4;
  const fram = new THREE.Mesh(new THREE.PlaneGeometry(M.b - M.r * 0.6, M.l - M.r * 0.6), new THREE.MeshPhysicalMaterial({ map: ft, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.3 }));
  fram.position.z = M.d / 2 + 0.05;
  // framsidans bild täcker hela plattan: skala bilden så att den passar plattans mått
  ft.repeat.set((M.b - M.r * 0.6) / M.b, (M.l - M.r * 0.6) / M.l); ft.offset.set((1 - ft.repeat.x) / 2, (1 - ft.repeat.y) / 2);
  g.add(fram);
  if (M.ant) {
    const [x, r, h] = M.ant;
    const a = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, h, 10), plast('#1c1d20', 0.55, 0.1));
    a.position.set(x, M.l / 2 + h / 2 - 2, -M.d * 0.15);
    g.add(a);
  }
  // skärmen: egen liten duk, ritas om bara när texten ändras
  const [sx, sy, sw, sh] = M.skarm;
  const sc = document.createElement('canvas'); sc.width = 160; sc.height = Math.round(160 * sh / sw);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const sm = new THREE.MeshStandardMaterial({ map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0, roughness: 0.3 });
  const skarm = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), sm);
  skarm.position.set(sx, sy, M.d / 2 + 0.12);
  g.add(skarm);
  let forra = '';
  g.userData.skarm = (t1 = '', t2 = '', tand = false) => {
    const nyckel = t1 + '|' + t2 + '|' + tand;
    if (nyckel === forra) return;
    forra = nyckel;
    const x = sc.getContext('2d'), W = sc.width, H = sc.height;
    x.fillStyle = tand ? '#a9d86e' : '#8d9a78'; x.fillRect(0, 0, W, H);
    x.fillStyle = tand ? '#1d2a12' : '#3d4532';
    for (let i = 0; i < 4; i++) x.fillRect(W * 0.05, H * (0.12 + i * 0.12), W * (0.02 + i * 0.012), H * 0.07);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `bold ${H * 0.26}px VT323, monospace`; x.fillText(t1, W * 0.56, H * 0.42);
    x.font = `bold ${H * 0.28}px VT323, monospace`; x.fillText(t2, W * 0.56, H * 0.74);
    sm.emissiveIntensity = tand ? 0.5 : 0.04;
    st.needsUpdate = true;
  };
  g.userData.skarm('', '', false);
  g.userData.mal = { langd: M.l, bredd: M.b, djup: M.d };
  g.userData.skarmMesh = skarm;
  return g;
}
