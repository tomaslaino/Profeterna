// Bygger handmodellen till Hasse Backe (public/rum/hasse-hand.bin): en vänsterhand...
// Lokalt: handleden i origo, +y mot fingertopparna, +z ut ur handflatan, tummen åt +x.
// Formen är en mängd avsmalnande kapslar som flyter ihop (avståndsfunktion), och ytan
// plockas ut med "surface nets". Varje hörn får två ben, ton (rodnad), handflata, naglarnas
// koordinater och inbakad skugga. Körs en gång: node scripts/hasse/hand.mjs
import fs from 'node:fs';

const STEG = 6;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => mul(a, 1 / len(a));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };
const kapsel = (p, a, b, ra, rb) => { const ab = sub(b, a); const t = clamp(dot(sub(p, a), ab) / dot(ab, ab)); return len(sub(p, add(a, mul(ab, t)))) - (ra + (rb - ra) * t); };

// ---------- benen ----------
const rad = (d) => (d * Math.PI) / 180;
const rz = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
// knoge (x, y, z), solfjäder (°, + = åt tummen), längder, radier vid varje led
const FINGRAR = [
  { namn: 'pek', mcp: [47, 131, -2], fan: 8, l: [63, 39, 29], r: [17.6, 15.6, 14.2, 12.4] },
  { namn: 'lång', mcp: [15, 137, -5], fan: 1.5, l: [69, 43, 31], r: [18, 16, 14.6, 12.6] },
  { namn: 'ring', mcp: [-17, 132, -3], fan: -5.5, l: [64, 41, 30], r: [17, 15.2, 13.8, 12] },
  { namn: 'lill', mcp: [-47, 119, 1], fan: -14, l: [49, 29, 25], r: [14.8, 13, 11.8, 10.2] },
];
const ben = [{ namn: 'rot', far: -1, pos: [0, 0, 0], dir: [0, 1, 0] }];
const kedjor = [];
for (const f of FINGRAR) {
  const dir = rz([0, 1, 0], rad(-f.fan));
  let p = f.mcp;
  let far = 0;
  const ked = { f, led: [], kaps: [] };
  f.l.forEach((l, i) => {
    const q = add(p, mul(dir, l));
    const id = ben.length;
    ben.push({ namn: `${f.namn}${i}`, far, pos: p, dir });
    ked.led.push({ id, a: p, b: q, ra: f.r[i], rb: f.r[i + 1], l });
    far = id;
    p = q;
  });
  kedjor.push(ked);
}
// tummen: från handloven snett utåt och framåt
const TCMC = [40, 30, 12];
const TDIR = norm([0.66, 0.72, 0.22]);
const TL = [64, 45, 37];
const TR = [25, 20.5, 17.6, 14.6];
{
  const ked = { f: { namn: 'tumme' }, led: [], kaps: [] };
  let p = TCMC;
  let far = 0;
  let dir = TDIR;
  TL.forEach((l, i) => {
    if (i === 1) dir = norm(add(dir, [0.02, 0.16, 0.05]));
    const q = add(p, mul(dir, l));
    const id = ben.length;
    ben.push({ namn: `tumme${i}`, far, pos: p, dir });
    ked.led.push({ id, a: p, b: q, ra: TR[i], rb: TR[i + 1], l });
    far = id;
    p = q;
  });
  kedjor.push(ked);
}

// ---------- formen ----------
function fingerD(p, ked) {
  let d = 1e9;
  for (const s of ked.led) d = smin(d, kapsel(p, s.a, s.b, s.ra, s.rb), 2.5);
  // lederna buktar ut lite
  ked.led.forEach((s, i) => {
    if (i === 0) return;
    const sp = len(sub(p, s.a)) - (s.ra + 1.3);
    d = smin(d, sp, 3);
  });
  return d;
}
function sdf(p0) {
  const p = p0;
  // handryggen: mellanhandsbenen från handloven till knogarna
  let d = 1e9;
  const LOV = [[20, 2, 0], [-2, 2, 0], [-22, 2, 0], [-30, 6, 1]];
  FINGRAR.forEach((f, i) => { d = smin(d, kapsel(p, LOV[i], f.mcp, 25, f.r[0] + 3.5), 13); });
  // lillfingerkanten på handflatan och tumvecket
  d = smin(d, kapsel(p, [-34, 16, 7], [-49, 104, 7], 26, 19), 15);
  d = smin(d, kapsel(p, [30, 26, 9], [56, 84, 8], 24, 16), 14);
  // handloven och en bit av armen, något platt
  const pl = [p[0], p[1], p[2] * 1.28];
  d = smin(d, kapsel(pl, [12, -50, 0], [8, 6, 0], 31, 32), 14);
  d = smin(d, kapsel(pl, [-12, -50, 0], [-8, 6, 0], 31, 32), 14);
  // knogarna på handryggen
  for (const f of FINGRAR) d = smin(d, len(sub(p, add(f.mcp, [0, 2, -6]))) - (f.r[0] + 2.5), 8);
  // fingrarna håller sig för sig själva men flyter in i handen
  let fd = 1e9;
  for (let i = 0; i < 4; i++) fd = Math.min(fd, fingerD(p, kedjor[i]));
  d = smin(d, fd, 11);
  const td = fingerD(p, kedjor[4]);
  d = smin(d, td, 16);
  return d;
}
const grad = (p) => { const e = 0.6; return norm([sdf([p[0] + e, p[1], p[2]]) - sdf([p[0] - e, p[1], p[2]]), sdf([p[0], p[1] + e, p[2]]) - sdf([p[0], p[1] - e, p[2]]), sdf([p[0], p[1], p[2] + e]) - sdf([p[0], p[1], p[2] - e])]); };

// ---------- surface nets ----------
const MIN = [-115, -34, -46];
const MAX = [180, 304, 76];
const NX = Math.ceil((MAX[0] - MIN[0]) / STEG);
const NY = Math.ceil((MAX[1] - MIN[1]) / STEG);
const NZ = Math.ceil((MAX[2] - MIN[2]) / STEG);
const I = (x, y, z) => x + y * (NX + 1) + z * (NX + 1) * (NY + 1);
const V = new Float32Array((NX + 1) * (NY + 1) * (NZ + 1));
for (let z = 0; z <= NZ; z++) for (let y = 0; y <= NY; y++) for (let x = 0; x <= NX; x++) V[I(x, y, z)] = sdf([MIN[0] + x * STEG, MIN[1] + y * STEG, MIN[2] + z * STEG]);
const cell = new Int32Array(NX * NY * NZ).fill(-1);
const C = (x, y, z) => x + y * NX + z * NX * NY;
const pos = [];
const KANT = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]];
for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
  const h = [];
  for (let k = 0; k < 8; k++) h.push(V[I(x + (k & 1), y + ((k >> 1) & 1), z + ((k >> 2) & 1))]);
  let n = 0;
  const m = [0, 0, 0];
  for (const [a, b] of KANT) {
    if ((h[a] < 0) === (h[b] < 0)) continue;
    const t = h[a] / (h[a] - h[b]);
    for (let q = 0; q < 3; q++) m[q] += ((a >> q) & 1) * (1 - t) + ((b >> q) & 1) * t;
    n++;
  }
  if (!n) continue;
  let p = [MIN[0] + (x + m[0] / n) * STEG, MIN[1] + (y + m[1] / n) * STEG, MIN[2] + (z + m[2] / n) * STEG];
  // ner på ytan
  for (let it = 0; it < 3; it++) p = sub(p, mul(grad(p), sdf(p)));
  cell[C(x, y, z)] = pos.length;
  pos.push(p);
}
const idx = [];
const quad = (a, b, c, d, fl) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (fl) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c); };
for (let z = 1; z < NZ; z++) for (let y = 1; y < NY; y++) for (let x = 1; x < NX; x++) {
  const v0 = V[I(x, y, z)];
  const vx = V[I(x + 1, y, z)];
  const vy = V[I(x, y + 1, z)];
  const vz = V[I(x, y, z + 1)];
  if ((v0 < 0) !== (vx < 0)) quad(cell[C(x, y - 1, z - 1)], cell[C(x, y, z - 1)], cell[C(x, y, z)], cell[C(x, y - 1, z)], v0 < 0);
  if ((v0 < 0) !== (vy < 0)) quad(cell[C(x - 1, y, z - 1)], cell[C(x - 1, y, z)], cell[C(x, y, z)], cell[C(x, y, z - 1)], v0 < 0);
  if ((v0 < 0) !== (vz < 0)) quad(cell[C(x - 1, y - 1, z)], cell[C(x, y - 1, z)], cell[C(x, y, z)], cell[C(x - 1, y, z)], v0 < 0);
}

// ---------- hörnens data ----------
const nv = pos.length;
const agare = new Int8Array(nv);
const data = new DataView(new ArrayBuffer(nv * (6 + 4 + 4 + 4)));
let o = 0;
const naglar = kedjor.map((k) => k.led[k.led.length - 1]);
for (let i = 0; i < nv; i++) {
  const p = pos[i];
  const n = grad(p);
  // ägaren: närmaste kedja, räknat i radier
  let bast = -1;
  let dB = 1e9;
  kedjor.forEach((k, ki) => {
    for (const s of k.led) {
      const d = kapsel(p, s.a, s.b, s.ra, s.rb);
      if (d < dB) { dB = d; bast = ki; }
    }
  });
  const k = kedjor[bast];
  agare[i] = dB > 14 ? -1 : bast;
  let b0 = 0;
  let b1 = 0;
  let w = 1;
  // längs kedjan
  const dirK = norm(sub(k.led[0].b, k.led[0].a));
  const vidBas = dot(sub(p, k.led[0].a), dirK);
  const handen = sdf(p);
  const langtBort = dB > 14;
  if (langtBort) { b0 = 0; b1 = 0; w = 1; } else if (vidBas < 12) {
    // knogen: mjuk övergång från handen
    b0 = 0;
    b1 = k.led[0].id;
    w = 1 - ss(-16, 12, vidBas);
    if (bast === 4) w = 1 - ss(-6, 24, vidBas);
  } else {
    let vald = k.led.length - 1;
    let tBest = 0;
    let dS = 1e9;
    k.led.forEach((s, si) => {
      const ab = sub(s.b, s.a);
      const t = clamp(dot(sub(p, s.a), ab) / dot(ab, ab));
      const d = len(sub(p, add(s.a, mul(ab, t))));
      if (d < dS) { dS = d; vald = si; tBest = t * s.l; }
    });
    const s = k.led[vald];
    b0 = s.id;
    b1 = s.id;
    w = 1;
    const B = 9;
    if (vald < k.led.length - 1 && tBest > s.l - B) { b1 = k.led[vald + 1].id; w = 1 - 0.5 * ss(s.l - B, s.l, tBest); }
    if (vald > 0 && tBest < B) { b1 = k.led[vald - 1].id; w = 0.5 + 0.5 * ss(0, B, tBest); }
    if (vald === 0 && tBest < 18) { b1 = 0; w = 0.5 + 0.5 * ss(0, 18, tBest); }
  }
  // inbakad skugga: hur fritt det är längs normalen
  let ao = 1;
  for (const q of [5, 11, 22]) ao -= (clamp((q - sdf(add(p, mul(n, q)))) / q) * 0.42) * (q === 5 ? 0.6 : q === 11 ? 0.9 : 0.7);
  ao = clamp(ao);
  // rodnad: knogar, leder och fingertoppar
  let ton = 0;
  for (const f of FINGRAR) ton = Math.max(ton, 0.75 * Math.exp(-((len(sub(p, add(f.mcp, [0, 2, -14]))) / 19) ** 2)));
  kedjor.forEach((ke) => ke.led.forEach((s, si) => { if (si > 0) ton = Math.max(ton, 0.62 * Math.exp(-((len(sub(p, s.a)) / 15) ** 2))); ton = Math.max(ton, (si === ke.led.length - 1 ? 0.75 : 0) * ss(0.45, 1, dot(sub(p, s.a), norm(sub(s.b, s.a))) / s.l)); }));
  // handflata: bort från handryggen
  const palm = ss(-0.1, 0.25, n[2]);
  // naglarna: koordinater på yttersta leden (±1 är nageln), och hur mycket hörnet vetter mot ryggsidan
  let nu = 1.27;
  let nv_ = -1.27;
  let rygg = 0;
  const ki = kedjor.indexOf(k);
  const yt = naglar[ki];
  const axel = norm(sub(yt.b, yt.a));
  const langd = dot(sub(p, yt.a), axel);
  if (!langtBort) {
    let sid = norm([axel[1], -axel[0], 0]);
    let upp = [0, 0, -1];
    if (ki === 4) { upp = norm([-0.55, 0.1, -0.83]); upp = norm(sub(upp, mul(axel, dot(upp, axel)))); sid = norm([axel[1] * upp[2] - axel[2] * upp[1], axel[2] * upp[0] - axel[0] * upp[2], axel[0] * upp[1] - axel[1] * upp[0]]); }
    const lt = yt.l;
    nu = clamp(dot(sub(p, yt.a), sid) / (yt.rb * 0.86), -1.27, 1.27);
    nv_ = clamp((langd - lt * 0.7) / (lt * 0.34), -1.27, 1.27);
    rygg = ss(0.05, 0.4, dot(n, upp));
  }
  data.setInt16(o, Math.round(p[0] * 8), true); data.setInt16(o + 2, Math.round(p[1] * 8), true); data.setInt16(o + 4, Math.round(p[2] * 8), true);
  o += 6;
  data.setInt8(o++, Math.round(n[0] * 127)); data.setInt8(o++, Math.round(n[1] * 127)); data.setInt8(o++, Math.round(n[2] * 127)); data.setUint8(o++, Math.round(ao * 255));
  data.setUint8(o++, b0); data.setUint8(o++, b1); data.setUint8(o++, Math.round(w * 255)); data.setUint8(o++, Math.round(ton * 255));
  data.setUint8(o++, Math.round(palm * 255)); data.setInt8(o++, Math.round(nu * 100)); data.setInt8(o++, Math.round(nv_ * 100)); data.setUint8(o++, Math.round(rygg * 255));
}
const alla = idx.length;
const rena = [];
for (let i = 0; i < alla; i += 3) {
  const [a, b, c] = [agare[idx[i]], agare[idx[i + 1]], agare[idx[i + 2]]];
  // långt ut på två olika fingrar: bort med triangeln
  const langtUt = (v) => { const p = pos[v]; const ki = agare[v]; if (ki < 0) return false; const s = kedjor[ki].led[0]; return dot(sub(p, s.a), norm(sub(s.b, s.a))) > 32; };
  const skild = (x, y, vx, vy) => x >= 0 && y >= 0 && x !== y && langtUt(vx) && langtUt(vy);
  if (skild(a, b, idx[i], idx[i + 1]) || skild(b, c, idx[i + 1], idx[i + 2]) || skild(a, c, idx[i], idx[i + 2])) continue;
  rena.push(idx[i], idx[i + 1], idx[i + 2]);
}
idx.length = 0;
idx.push(...rena);
const kropp = Buffer.from(data.buffer);
const ix = Buffer.alloc(idx.length * 2);
idx.forEach((v, i) => ix.writeUInt16LE(v, i * 2));
const head = Buffer.from(JSON.stringify({ nv, ni: idx.length, ben: ben.map((b) => ({ far: b.far, pos: b.pos, namn: b.namn })) }));
const pad = (4 - ((4 + head.length) % 4)) % 4;
const hl = Buffer.alloc(4); hl.writeUInt32LE(head.length + pad);
const ut = Buffer.concat([hl, head, Buffer.alloc(pad, 32), kropp, ix]);
fs.writeFileSync(new URL('../../public/rum/hasse-hand.bin', import.meta.url), ut);
console.log({ nv, tri: idx.length / 3, kB: ut.length / 1024, ben: ben.length });
