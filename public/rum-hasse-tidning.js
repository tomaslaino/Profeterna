// Tidningen som Hasse Backe gömmer sig bakom när det har gått dåligt för honom (rum-hasse-3d.js, klippet
// lasa): veckans kvällstidning, samma som löpsedeln i rummet (rum-affischer.js), uppslagen med
// förstasidan mot en. Där står en rubrik om hans egen omgång i kvällstidningens tonläge (rum-hasse.js
// väljer den), med hans eget porträtt rastrerat under, och på baksidan notiserna inför omgången
// (data/tidning.json, skrivna på iMacen: scripts/analyser/skriv.mjs) eller, utan dem, tipsguiden.
//
// Papperet är ett rutnät som böjs i skuggaren: två sidor vikta mot honom kring ryggen (uBeta), mjukt
// så att det faller bakåt ovanför händerna (uBuk), och en våg när han rycker i det (uVag). ytan() räknar
// samma form i JavaScript, så att händerna kan hålla i kanterna. Samma ljus som på allt annat (LJUS).
//
// byggTidning(bord) → { mesh, U, tryck(rubrik), borta() }
// ytan(qx, qy, s, ut): punkten (qx −1–1 över uppslaget, qy 0–1 nedifrån) i papperets mått, s: { beta, buk, vag, fas }
import * as THREE from 'three';
import { LJUS, BORD_GLSL, DAG, LYS } from './rum-hasse-arm.js';
import { veckansTidning } from './rum-affischer.js';

// ---------- rubrikerna ----------
// Om hans egen omgång, i kvällstidningens tonläge som löpsedeln i rummet (rum-affischer.js): vinjetten (kick),
// rubrikens rader ([text, stil], stil 1 röd) och raden under. {ok} och {n}: hans rätt och antalet matcher,
// {T}: tidningens namn. daligt: det gick dåligt, inget: inte ett enda rätt, sist: sämst i gänget.
export const RUBRIKER = {
  daligt: [
    { kick: 'KRISEN', rad: [['BACKE:'], ['”INGEN'], ['KRIS”', 1]], under: '{ok} rätt av {n}. Själv skyller experten på matcherna' },
    { kick: 'TIPSKRASCHEN', rad: [['BACKE'], ['I FRITT'], ['FALL', 1]], under: '{ok} rätt av {n}. Experten: ”Matcherna hade fel”' },
    { kick: 'FIASKOT', rad: [['BACKE'], ['TIGER', 1]], under: 'Bara {ok} rätt av {n}. Experten vill inte kommentera' },
    { kick: '{T} AVSLÖJAR', rad: [['SANNINGEN'], ['OM BACKES'], ['TIPS', 1]], under: '{ok} rätt av {n} – nu krävs svar' },
    { kick: 'EXPERTEN', rad: [['BACKE:'], ['”JAG STÅR'], ['FAST”', 1]], under: 'Efter {ok} rätt av {n}: ”Matcherna slutade fel”' },
  ],
  inget: [
    { kick: 'HISTORISKT', rad: [['NOLL'], ['RÄTT', 1]], under: 'Backe: ”Statistiskt sett var det matcherna”' },
  ],
  sist: [
    { kick: 'TIPSLIGAN', rad: [['BACKE'], ['SIST', 1]], under: '{ok} rätt av {n}, sämst i gänget. Experten: ”Ingen kris”' },
  ],
};
const fDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long' });
// Rubriken för hans omgång: samma för samma omgång (nyckel), på dagens tidning. → det tryck() vill ha
export function rubrikOm({ lage, ok, n, nyckel = '', now = Date.now() }) {
  const lista = RUBRIKER[lage] || RUBRIKER.daligt;
  let h = 7;
  for (const c of String(nyckel)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = lista[h % lista.length];
  const tid = veckansTidning(now);
  const T = tid === 'ex' ? 'EXPRESSEN' : 'SPORTBLADET';
  const fyll = (t) => String(t).replace('{ok}', ok).replace('{n}', n).replace('{T}', T);
  return { tidning: tid, kick: fyll(r.kick), rad: r.rad.map(([t, s]) => [fyll(t), s]), under: fyll(r.under), datum: fDatum.format(new Date(now)).toUpperCase() };
}

// En sida: bredd och höjd i världens enheter (en kvällstidning, 28 × 40 cm, ungefär 0,62 mm på en enhet).
export const TIDNING = { B: 450, H: 640, RYGG: 18 };

const GLSL_YTA = `
uniform float uBeta, uBuk, uVag, uFas;
vec3 yta(vec2 q) {
  float u = abs(q.x) * ${TIDNING.B}.;
  float y = q.y * ${TIDNING.H}.;
  // ryggen är rundad: vecket böjer sig mjukt
  float zr = sqrt(u * u + ${TIDNING.RYGG * TIDNING.RYGG}.) - ${TIDNING.RYGG}.;
  vec3 p = vec3(q.x * ${TIDNING.B}. * cos(uBeta), y, -zr * sin(uBeta));
  // mjukt: ovanför händerna faller det bakåt mot honom, mest vid ryggen där ingen håller
  float ov = max(0., q.y - .48);
  p.z -= uBuk * ov * ov * ${TIDNING.H}. * (1. - .55 * abs(q.x));
  // vågen när han rycker i det
  p.z += uVag * sin(3.14159 * abs(q.x)) * sin(q.y * 4. + uFas);
  return p;
}`;

// samma form i JavaScript (för händerna)
export function ytan(qx, qy, s, ut) {
  const { B, H, RYGG } = TIDNING;
  const u = Math.abs(qx) * B;
  const zr = Math.sqrt(u * u + RYGG * RYGG) - RYGG;
  const ov = Math.max(0, qy - 0.48);
  const z = -zr * Math.sin(s.beta) - s.buk * ov * ov * H * (1 - 0.55 * Math.abs(qx)) + s.vag * Math.sin(Math.PI * Math.abs(qx)) * Math.sin(qy * 4 + s.fas);
  return ut.set(qx * B * Math.cos(s.beta), qy * H, z);
}

const V = `${GLSL_YTA}
varying vec2 vUv; varying vec3 vN, vP;
void main() {
  vec2 q = position.xy;
  vec3 p = yta(q);
  vec2 e = vec2(.004, 0.);
  vec3 n = normalize(cross(yta(q + e.xy) - yta(q - e.xy), yta(q + e.yx) - yta(q - e.yx)));
  vUv = vec2(q.x * .5 + .5, q.y);
  vec4 w = modelMatrix * vec4(p, 1.);
  vP = w.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const F = `precision highp float;
uniform sampler2D uUt, uIn;
varying vec2 vUv; varying vec3 vN, vP;
${LJUS}
${BORD_GLSL}
void main() {
  if (underBord(vP)) discard;
  vec3 n = normalize(vN);
  vec3 c;
  if (gl_FrontFacing) c = texture2D(uUt, vUv).rgb;
  else { c = texture2D(uIn, vec2(1. - vUv.x, vUv.y)).rgb; n = -n; }
  // vecket vid ryggen: en mörkare fåra
  float r = abs(vUv.x - .5) * ${2 * TIDNING.B}.;
  c *= 1. - .16 * exp(-r * r / 90.);
  // kanterna lite smutsiga av fingrarna och av att ha legat i en bunt
  float k = min(min(vUv.x, 1. - vUv.x) * ${2 * TIDNING.B}., min(vUv.y, 1. - vUv.y) * ${TIDNING.H}.);
  c *= .94 + .06 * smoothstep(0., 14., k);
  // papper som notan på disken: ljusets styrka i dagsljusets färg (ljusDag), inte rosa av neonskylten
  vec3 ut = c * ljusDag(n) + kant(n, .1);
  gl_FragColor = vec4(ton(ut), 1.);
}`;

// ---------- trycket ----------
// Uppslaget utifrån: baksidan till vänster och förstasidan till höger, en sida 512 × 728 bildpunkter.
const SB = 512;
const SH = 728;
const FARG = {
  sb: { papper: '#ebbcc4', papper2: '#e3b1bb', rod: '#c4222b', kick: '#23201e' },
  ex: { papper: '#ece8dc', papper2: '#e4ddcd', rod: '#c6262c', kick: '#c6262c' },
};
const SVART = '#23201e';
const NAMN = {
  sb: { namn: 'Sportbladet', font: (px) => `900 ${px}px "Helvetica Neue", Arial, sans-serif`, sp: -0.04, skev: 0, rod: false },
  ex: { namn: 'EXPRESSEN', font: (px) => `400 ${px}px "Alfa Slab One", Georgia, serif`, sp: -0.01, skev: -0.19, rod: true },
};
const ANTON = (px) => `400 ${px}px Anton, Impact, "Arial Narrow", sans-serif`;
const HELV = (px, v = 700) => `${v} ${px}px "Helvetica Neue", Arial, sans-serif`;

// bredden av text i en font (canvas mäter fel med letterSpacing, så mellanrummet läggs till själv)
function bredd(x, text, font, sp = 0) {
  x.font = font;
  return x.measureText(text).width + sp * parseFloat(/(\d+(\.\d+)?)px/.exec(font)[1]) * text.length;
}
function skriv(x, text, cx, y, font, { sp = 0, farg = SVART, max = Infinity } = {}) {
  x.font = font;
  x.fillStyle = farg;
  const px = parseFloat(/(\d+(\.\d+)?)px/.exec(font)[1]);
  const w = bredd(x, text, font, sp);
  const k = Math.min(1, max / w);
  x.save();
  x.translate(cx - (w * k) / 2, y);
  x.scale(k, 1);
  let at = 0;
  for (const ch of text) {
    x.fillText(ch, at, 0);
    at += x.measureText(ch).width + sp * px;
  }
  x.restore();
}
// rader som grå text, i en spalt
function spalt(x, x0, y0, w, y1, rad = 11, seed = 1) {
  x.fillStyle = 'rgba(35, 32, 30, .55)';
  let i = 0;
  for (let y = y0; y < y1 - 4; y += rad) {
    const h = Math.sin(seed * 91.7 + i * 12.9898) * 43758.5453;
    const f = h - Math.floor(h);
    const sista = i % 7 === 6;
    x.fillRect(x0, y, sista ? w * (0.3 + 0.5 * f) : w * (0.92 + 0.08 * f), rad * 0.42);
    i++;
  }
}

// Hans porträtt svartvitt och rastrerat, som tidningsbilderna i rummet (rastrera i rum-block.js).
let portratt = null;
function laddaPortratt() {
  if (!portratt) {
    portratt = new Promise((ok) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => ok(null);
      img.src = 'profeterna/hasse.jpg';
    });
  }
  return portratt;
}
function rastrera(img, W, H) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#fff';
  x.fillRect(0, 0, W, H);
  if (img) {
    const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    x.drawImage(img, (W - img.naturalWidth * k) / 2, 0, img.naturalWidth * k, img.naturalHeight * k);
  }
  let d;
  try { d = x.getImageData(0, 0, W, H); } catch (e) { return c; }
  const p = d.data;
  const ruta = 4.2;
  for (let y = 0; y < H; y++) {
    for (let i = 0; i < W; i++) {
      const o = (y * W + i) * 4;
      const g = Math.min(1, Math.max(0, ((0.3 * p[o] + 0.59 * p[o + 1] + 0.11 * p[o + 2]) / 255 - 0.5) * 1.3 + 0.55));
      const u = ((i + y) / ruta) % 1;
      const v = ((i - y + 4 * H) / ruta) % 1;
      const r = Math.hypot(u - 0.5, v - 0.5) / 0.71;
      const prick = r < Math.sqrt(1 - g) * 0.95 ? 1 : 0;
      const t = 0.55 * prick + 0.45 * (1 - g);
      const ton = 255 * (1 - t);
      p[o] = p[o + 1] = p[o + 2] = ton;
      p[o + 3] = 255;
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

// Rubrikens rader (som löpsedeln: [[text, stil]], stil 1 röd, 2 vit på rött) så stora som ryms i bredden,
// alla lika mycket mindre om de inte ryms på höjden.
function rubriken(x, rad, x0, w, y0, hog, f) {
  const r = rad.map(([t, s]) => [String(t).toUpperCase(), Number(s) || 0]);
  const KV = 0.94;
  let size = r.map(([t]) => Math.min(170, (w / bredd(x, t, ANTON(100), 0.002)) * 100));
  const tot = size.reduce((a, b) => a + b * KV, 0) + (r.length - 1) * 6;
  if (tot > hog) size = size.map((s) => (s * (hog - (r.length - 1) * 6)) / (tot - (r.length - 1) * 6));
  let y = y0 + Math.max(0, (hog - (size.reduce((a, b) => a + b * KV, 0) + (r.length - 1) * 6)) / 2);
  r.forEach(([t, s], i) => {
    const px = size[i];
    y += px * KV;
    if (s === 2) {
      const bw = bredd(x, t, ANTON(px), 0.002);
      x.fillStyle = f.rod;
      x.fillRect(x0 + w / 2 - bw / 2 - px * 0.12, y - px * 0.86, bw + px * 0.24, px * 0.94);
    }
    skriv(x, t, x0 + w / 2, y - px * 0.06, ANTON(px), { sp: 0.002, farg: s === 1 ? f.rod : s === 2 ? f.papper : SVART });
    y += 6;
  });
}

function papper(x, x0, f) {
  const g = x.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, f.papper);
  g.addColorStop(1, f.papper2);
  x.fillStyle = g;
  x.fillRect(x0, 0, SB, SH);
}

function huvud(x, x0, tid, f, storlek = 1) {
  const N = NAMN[tid] || NAMN.sb;
  const w = SB - 44;
  const px = Math.min(84 * storlek, (w / bredd(x, N.namn, N.font(100), N.sp)) * 100);
  x.save();
  x.translate(x0 + SB / 2, 18 + px * 0.82);
  x.transform(1, 0, N.skev, 1, 0, 0);
  skriv(x, N.namn, 0, 0, N.font(px), { sp: N.sp, farg: N.rod ? f.rod : SVART });
  x.restore();
  const y = 26 + px * 0.9;
  x.fillStyle = SVART;
  x.fillRect(x0 + 22, y, SB - 44, 2.5);
  return y + 2.5;
}

function kick(x, x0, y, text, datum, f) {
  const px = 24;
  x.font = ANTON(px);
  const w = bredd(x, text, ANTON(px), 0.06);
  x.fillStyle = f.kick;
  x.fillRect(x0 + 22, y, w + 20, px + 10);
  skriv(x, text, x0 + 22 + 10 + w / 2, y + px + 3, ANTON(px), { sp: 0.06, farg: f.papper });
  if (datum) {
    x.font = HELV(12);
    x.fillStyle = SVART;
    x.textAlign = 'right';
    x.fillText(datum, x0 + SB - 22, y + px + 2);
    x.textAlign = 'left';
  }
  return y + px + 10;
}

function radbryt(x, text, font, w) {
  x.font = font;
  const ord = String(text).split(/\s+/);
  const rader = [];
  let r = '';
  for (const o of ord) {
    const n = r ? `${r} ${o}` : o;
    if (x.measureText(n).width > w && r) { rader.push(r); r = o; } else r = n;
  }
  if (r) rader.push(r);
  return rader;
}

// rubrik: { tidning: 'sb' | 'ex', kick, rad, under, datum, bild: porträttet (img) }
function forsta(x, x0, rb, f, bild) {
  papper(x, x0, f);
  let y = huvud(x, x0, rb.tidning, f);
  y = kick(x, x0, y + 9, rb.kick, rb.datum, f);
  rubriken(x, rb.rad, x0 + 22, SB - 44, y + 8, 300, f);
  y += 316;
  x.font = HELV(19);
  x.fillStyle = SVART;
  x.textAlign = 'center';
  for (const r of radbryt(x, rb.under, HELV(19), SB - 70).slice(0, 2)) { y += 22; x.fillText(r, x0 + SB / 2, y); }
  x.textAlign = 'left';
  y += 14;
  x.fillRect(x0 + 22, y, SB - 44, 1.5);
  y += 10;
  // porträttet, och spalter bredvid
  const bw = 196;
  const bh = Math.min(240, SH - 26 - y);
  if (bild) x.drawImage(bild, x0 + 22, y, bw, bh);
  x.font = HELV(10, 400);
  x.fillStyle = SVART;
  x.fillText('Hasse Backe.', x0 + 22, y + bh + 12);
  spalt(x, x0 + 22 + bw + 14, y + 2, (SB - 44 - bw - 14 - 10) / 2, y + bh + 14, 11, 3);
  spalt(x, x0 + 22 + bw + 14 + (SB - 44 - bw - 14) / 2 + 5, y + 2, (SB - 44 - bw - 14 - 10) / 2, y + bh + 14, 11, 7);
}

// Notiserna inför omgången (data/tidning.json): en per match, skrivna på iMacen med Claude Code. Läses en
// gång per sidvisning; en sida som är äldre än NOTIS_DAGAR trycks inte.
const NOTIS_DAGAR = 10;
let notiser = null;
let notisLadd = null;
function laddaNotiser() {
  if (!notisLadd) {
    notisLadd = fetch('data/tidning.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((t) => {
        const farsk = t && Array.isArray(t.notiser) && Date.now() - Date.parse(t.skriven) < NOTIS_DAGAR * 864e5;
        notiser = farsk ? t.notiser.filter((n) => n && n.rubrik && n.text).sort((a, b) => a.nr - b.nr) : null;
      })
      .catch(() => {});
  }
  return notisLadd;
}

// Notiserna i två spalter, i den största storleken där alla ryms: matchen, rubriken och texten.
function notisSida(x, x0, y0, lista, f) {
  const G = 14;
  const W = (SB - 44 - G) / 2;
  const Y1 = SH - 20;
  const satt = (px) => {
    const block = lista.map((n) => {
      const rader = [];
      rader.push({ t: `${n.nr}  ${n.match || ''}`.trim(), font: HELV(px * 0.85, 700), farg: f.rod, h: px * 1.1 });
      for (const r of radbryt(x, n.rubrik, HELV(px * 1.3, 700), W)) rader.push({ t: r, font: HELV(px * 1.3, 700), farg: SVART, h: px * 1.35 });
      for (const r of radbryt(x, n.text, HELV(px, 400), W)) rader.push({ t: r, font: HELV(px, 400), farg: SVART, h: px * 1.2 });
      return { rader, h: rader.reduce((a, r) => a + r.h, 0) + px * 0.9 };
    });
    // spalterna fylls uppifrån, och nästa notis går till spalten med mest plats kvar
    const sp = [y0, y0];
    const plats = block.map((b) => {
      const k = sp[0] <= sp[1] ? 0 : 1;
      const p = { k, y: sp[k] };
      sp[k] += b.h;
      return p;
    });
    return { block, plats, ryms: Math.max(...sp) <= Y1 };
  };
  let px = 11;
  let s = satt(px);
  while (!s.ryms && px > 5.5) { px -= 0.25; s = satt(px); }
  x.textBaseline = 'alphabetic';
  s.block.forEach((b, i) => {
    const { k, y } = s.plats[i];
    let ry = y;
    for (const r of b.rader) {
      ry += r.h;
      if (ry > Y1) break;
      x.font = r.font;
      x.fillStyle = r.farg;
      x.fillText(r.t, x0 + 22 + k * (W + G), ry - r.h * 0.18);
    }
  });
  x.fillStyle = 'rgba(35, 32, 30, .5)';
  x.fillRect(x0 + 22 + W + G / 2 - 0.5, y0 + 4, 1, Math.min(Y1, Math.max(...s.plats.map((p, i) => p.y + s.block[i].h))) - y0 - 8);
}

// Baksidan: notiserna inför omgången, och utan dem tipsguiden, som på löpsedeln när det inte finns något att
// skriva om, och tretton rader att tippa.
function baksida(x, x0, rb, f) {
  papper(x, x0, f);
  if (notiser && notiser.length) {
    x.font = HELV(12);
    x.fillStyle = SVART;
    x.fillText(NAMN[rb.tidning] ? NAMN[rb.tidning].namn : '', x0 + 22, 30);
    x.textAlign = 'right';
    x.fillText('48', x0 + SB - 22, 30);
    x.textAlign = 'left';
    x.fillRect(x0 + 22, 38, SB - 44, 1.5);
    const y = kick(x, x0, 52, 'INFÖR OMGÅNGEN', '', f);
    rubriken(x, [['SÅ MÅR TIPSLAGEN', 1]], x0 + 22, SB - 44, y + 22, 50, f);
    x.fillStyle = SVART;
    x.fillRect(x0 + 22, y + 82, SB - 44, 1.5);
    notisSida(x, x0, y + 88, notiser, f);
    return;
  }
  x.font = HELV(12);
  x.fillStyle = SVART;
  x.fillText(NAMN[rb.tidning] ? NAMN[rb.tidning].namn : '', x0 + 22, 30);
  x.textAlign = 'right';
  x.fillText('48', x0 + SB - 22, 30);
  x.textAlign = 'left';
  x.fillRect(x0 + 22, 38, SB - 44, 1.5);
  let y = kick(x, x0, 52, 'EXTRA', '', f);
  rubriken(x, [['STORA'], ['TIPSGUIDEN', 1]], x0 + 22, SB - 44, y + 6, 190, f);
  y += 206;
  x.font = HELV(17);
  x.textAlign = 'center';
  x.fillStyle = SVART;
  x.fillText('Så tar du hem 13 rätt – experterna avslöjar allt', x0 + SB / 2, y + 16, SB - 60);
  x.textAlign = 'left';
  y += 34;
  // tretton rader med 1 X 2
  const rh = Math.min(26, (SH - 30 - y) / 13);
  for (let i = 0; i < 13; i++) {
    const ry = y + i * rh;
    x.fillStyle = 'rgba(35, 32, 30, .5)';
    x.font = HELV(rh * 0.55);
    x.fillText(String(i + 1), x0 + 26, ry + rh * 0.72);
    x.fillRect(x0 + 52, ry + rh * 0.38, 210 - 40 * ((i * 7) % 3), rh * 0.24);
    for (let j = 0; j < 3; j++) {
      x.strokeStyle = SVART;
      x.lineWidth = 1.4;
      x.strokeRect(x0 + SB - 22 - (3 - j) * rh * 1.15, ry + 3, rh * 0.95, rh - 6);
      x.fillStyle = SVART;
      x.font = HELV(rh * 0.5, 700);
      x.textAlign = 'center';
      x.fillText('1X2'[j], x0 + SB - 22 - (3 - j) * rh * 1.15 + rh * 0.475, ry + rh * 0.68);
      x.textAlign = 'left';
    }
  }
}

// Insidan (sidorna han läser, sett bakifrån): spalter och en bild per sida.
function insida(c, tid) {
  const f = FARG[tid] || FARG.sb;
  const x = c.getContext('2d');
  for (const x0 of [0, c.width / 2]) {
    const g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, f.papper);
    g.addColorStop(1, f.papper2);
    x.fillStyle = g;
    x.fillRect(x0, 0, c.width / 2, c.height);
    const w = c.width / 2;
    x.fillStyle = SVART;
    x.fillRect(x0 + w * 0.06, c.height * 0.05, w * 0.88, c.height * 0.07);
    x.fillStyle = 'rgba(35, 32, 30, .35)';
    x.fillRect(x0 + w * 0.06, c.height * 0.15, w * 0.55, c.height * 0.3);
    for (let k = 0; k < 3; k++) spalt(x, x0 + w * (0.06 + k * 0.3), c.height * (k ? 0.15 : 0.48), w * 0.26, c.height * 0.95, 5, k + x0);
  }
}

// ---------- papperet ----------
export function byggTidning(bord) {
  const NX = 36;
  const NY = 22;
  const pos = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) pos.push((i / NX) * 2 - 1, j / NY, 0);
  const idx = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i;
    idx.push(a, a + 1, a + NX + 1, a + 1, a + NX + 2, a + NX + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const ut = document.createElement('canvas');
  ut.width = 2 * SB;
  ut.height = SH;
  const inn = document.createElement('canvas');
  inn.width = 256;
  inn.height = 182;
  const tex = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 4;
    return t;
  };
  const U = {
    uUt: { value: tex(ut) }, uIn: { value: tex(inn) },
    uBeta: { value: 0.1 }, uBuk: { value: 0.1 }, uVag: { value: 0 }, uFas: { value: 0 },
    uBord: bord, uButik: bord.butik, uDag: bord.dag || DAG, uLys: bord.lys || LYS,
  };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: V, fragmentShader: F, side: THREE.DoubleSide, transparent: true, depthWrite: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  // efter kroppen (djupet börjar om där) och före armarna, så att händerna framför papperet syns och
  // armarna bakom det inte gör det
  mesh.renderOrder = 4;
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  let nr = 0;
  // Trycker uppslaget (förstasidan med rubriken, baksidan och insidan). Typsnitten och porträttet hämtas
  // först; kommer de sent trycks det om.
  async function tryck(rb) {
    const mitt = ++nr;
    const f = FARG[rb.tidning] || FARG.sb;
    const rita = (bild) => {
      if (mitt !== nr) return;
      const x = ut.getContext('2d');
      baksida(x, 0, rb, f);
      forsta(x, SB, rb, f, bild);
      insida(inn, rb.tidning);
      U.uUt.value.needsUpdate = true;
      U.uIn.value.needsUpdate = true;
    };
    rita(null);
    const fonter = document.fonts && document.fonts.load
      ? Promise.race([Promise.all([document.fonts.load(ANTON(30)), document.fonts.load(NAMN.ex.font(30))]), new Promise((ok) => setTimeout(ok, 2500))])
      : null;
    const [img] = await Promise.all([laddaPortratt(), fonter, laddaNotiser()]);
    rita(img ? rastrera(img, 196, 240) : null);
  }
  return {
    mesh, U, tryck,
    borta() { g.dispose(); mesh.material.dispose(); U.uUt.value.dispose(); U.uIn.value.dispose(); },
  };
}
