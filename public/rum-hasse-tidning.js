// Tidningen som Hasse Backe läser när det har gått dåligt för honom (rum-hasse-3d.js, klippen lasa): dagens
// morgontidning, Dagens Nyheter eller Svenska Dagbladet, uppslagen med förstasidan mot en. Den ska se ut som en
// riktig tidning: tidningens namn, datumet och numret, puffar, en stor bild och dagens nyhet, och på baksidan vädret
// och kvällens tv. Nyheterna är påhittade och tidlösa, utan namn på riktiga personer, och ingen sport (dagens
// i NYHETER och PUFFAR, valda efter datumet). Bilderna målas här, som fotografier i tryck (MALA).
//
// Papperet är ett rutnät som böjs i skuggaren: två sidor vikta mot honom kring ryggen (uBeta), mjukt
// så att det faller bakåt ovanför händerna (uBuk), och en våg när han rycker i det (uVag). ytan() räknar
// samma form i JavaScript, så att händerna kan hålla i kanterna. Samma ljus som på allt annat (LJUS).
//
// byggTidning(bord) → { mesh, U, tryck(dag), visa(namn), borta() }; dagens(now) → det tryck() vill ha
// ytan(qx, qy, s, ut): punkten (qx −1–1 över uppslaget, qy 0–1 nedifrån) i papperets mått, s: { beta, buk, vag, fas }
import * as THREE from 'three';
import { LJUS, BORD_GLSL, DAG, LYS } from './rum-hasse-arm.js';

// ---------- dagens nyheter ----------
// Förstasidans nyhet: vinjetten, rubriken, ingressen, sidan den står på och bilden (MALA). Allt ska gå att läsa vilken
// dag som helst under hösten och vintern, och inget får handla om en verklig person.
export const NYHETER = [
  { vinjett: 'Vintern', rubrik: 'Snön kom tidigt – och trafiken stod still', ingress: 'Pendeltåg ställdes in och bussar körde fast när den första snön föll över Mälardalen i natt. – Vi fick ta det som det kom, säger en trafikledare.', sida: '6–7', bild: 'sno' },
  { vinjett: 'Energi', rubrik: 'Elpriset stiger när kylan kommer', ingress: 'Hushållen i södra Sverige kan få betala dubbelt så mycket i december som i fjol. Så ser du över ditt avtal innan räkningen kommer.', sida: '8–9', bild: 'stad' },
  { vinjett: 'Bostad', rubrik: 'Unga ger upp drömmen om ett eget boende', ingress: 'Köerna växer och priserna stiger igen. Tre unga vuxna berättar om att bo kvar hemma långt upp i tjugoårsåldern.', sida: '10–11', bild: 'hus' },
  { vinjett: 'Natur', rubrik: 'Älgen flyttar norrut när vintrarna blir varmare', ingress: 'Forskare har följt stammen i trettio år. I södra Sverige syns förändringen redan i skogen – och på vägarna.', sida: '12–13', bild: 'skog' },
  { vinjett: 'Skärgården', rubrik: 'Sista turen för i år – sedan blir det tyst på ön', ingress: 'När färjan lägger till för sista gången i år stannar ett fyrtiotal kvar. – Det är nu det blir riktigt fint här, säger en av dem.', sida: '14–15', bild: 'hav' },
  { vinjett: 'Ekonomi', rubrik: 'Handlarna tror på rekordjul – trots dyrare mat', ingress: 'Julhandeln väntas öka igen i år. Mest växer försäljningen av böcker, upplevelser och begagnat, visar en ny undersökning.', sida: '26–27', bild: 'gata' },
];
// Puffarna överst och i spalten: vinjetten, rubriken och bilden (MALA)
export const PUFFAR = [
  { vinjett: 'Kultur', rubrik: 'Höstens bästa romaner – vår lista', bild: 'bok' },
  { vinjett: 'Ekonomi', rubrik: 'Därför stiger matpriserna igen', bild: 'mat' },
  { vinjett: 'Debatt', rubrik: '”Skolan behöver fler lärare, inte fler skärmar”', bild: 'portratt' },
  { vinjett: 'Resor', rubrik: 'Med nattåg genom Europa – värt det?', bild: 'skog' },
  { vinjett: 'Vetenskap', rubrik: 'Så mycket förlänger promenaden livet', bild: 'hav' },
  { vinjett: 'Kultur', rubrik: 'Operan firar med ny uppsättning', bild: 'stad' },
  { vinjett: 'Krönika', rubrik: 'Ingen vill längre äga en dammsugare', bild: 'portratt' },
  { vinjett: 'Mat', rubrik: 'Ärtsoppan som blev en klassiker igen', bild: 'mat' },
];
// Kvällens tv på baksidan (utan sport)
const TV = [
  ['SVT1', [['18.00', 'Rapport'], ['18.15', 'Lokala nyheter'], ['18.30', 'Go’kväll'], ['19.30', 'Rapport'], ['20.00', 'Antikrundan'], ['21.00', 'Mord i skärgården'], ['22.00', 'Rapport'], ['22.10', 'Dokument inifrån']]],
  ['SVT2', [['18.00', 'Kulturnyheterna'], ['18.30', 'Vetenskapens värld'], ['19.30', 'Engelska trädgårdar'], ['20.00', 'Aktuellt'], ['20.45', 'Dokumentären: Fyrvaktaren'], ['22.00', 'Sverige från ovan'], ['23.00', 'Nyhetstecken']]],
  ['TV4', [['18.00', 'Nyheterna'], ['18.30', 'Hela Sverige bakar'], ['19.30', 'Nyheterna'], ['20.00', 'Hus till salu'], ['21.00', 'Brottsplats Stockholm'], ['22.00', 'Nyheterna'], ['22.30', 'Kvällsöppet']]],
];
// Vädret: [stad, longitud, latitud, normal temperatur i november]
const STADER = [['Kiruna', 20.2, 67.85, -8], ['Luleå', 22.15, 65.58, -5], ['Umeå', 20.26, 63.83, -3], ['Östersund', 14.64, 63.18, -4], ['Sundsvall', 17.31, 62.39, -1], ['Falun', 15.63, 60.6, 0], ['Karlstad', 13.5, 59.38, 2], ['Stockholm', 18.07, 59.33, 4], ['Visby', 18.29, 57.64, 5], ['Jönköping', 14.16, 57.78, 3], ['Göteborg', 11.97, 57.7, 6], ['Malmö', 13.0, 55.6, 7]];

// Tidningarna: namnet (skrivet som text, inte tidningens logga), när den grundades och typsnitten. DN med rubriker i
// en Bodoni (Playfair Display, typsnitt.css), SvD i en klassisk antikva med spärrade versaler (Fraunces).
const PLAY = (px, v = 800) => `${v} ${px}px "Playfair Display", "Bodoni 72", Didot, Georgia, serif`;
const FRA = (px, v = 700) => `${v} ${px}px Fraunces, Georgia, "Times New Roman", serif`;
const BROD = (px, v = 400) => `${v} ${px}px Georgia, "Times New Roman", serif`;
const SANS = (px, v = 700) => `${v} ${px}px "Helvetica Neue", Arial, sans-serif`;
export const TIDNINGAR = {
  dn: { namn: 'DAGENS NYHETER.', kort: 'DN', grundad: 1864, rubrik: PLAY, huvud: (px) => PLAY(px, 900), sp: 0.01, vinjett: '#b5121b' },
  svd: { namn: 'SVENSKA DAGBLADET', kort: 'SvD', grundad: 1884, rubrik: FRA, huvud: (px) => FRA(px, 600), sp: 0.07, vinjett: '#1f3a6b' },
};

const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: 'numeric', day: 'numeric' });
const fDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fVecka = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short' });
const blanda = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// Dagens tidningar (samma hela dagen): datumet, numret och vad som står i dem. → det tryck() vill ha
export function dagens(now = Date.now()) {
  const [y, m, d] = fDag.format(new Date(now)).split('-').map(Number);
  const dag = Math.round(Date.UTC(y, m - 1, d) / 864e5);
  const nr = dag - Math.round(Date.UTC(y, 0, 1) / 864e5) + 1;
  const datum = fDatum.format(new Date(now));
  const imorgon = [1, 2, 3, 4, 5].map((i) => fVecka.format(new Date(now + i * 864e5)).replace('.', ''));
  // (DN och SvD har aldrig samma nyhet samma dag)
  const N = NYHETER.length;
  const iDn = dag % N;
  const iSvd = (dag + 1 + Math.floor(blanda(dag) * (N - 1))) % N;
  const puff = (i) => PUFFAR[(dag * 3 + i) % PUFFAR.length];
  // vädret: kallare eller varmare än vanligt i hela landet, och lite olika i varje stad
  const kyla = Math.round(blanda(dag + 0.5) * 6) - 3;
  const vader = STADER.map(([namn, lon, lat, t], i) => {
    const r = blanda(dag * 7 + i);
    const grad = t + kyla + Math.round(blanda(dag * 13 + i) * 2);
    return { namn, lon, lat, grad, sym: grad <= 0 ? (r < 0.6 ? 'sno' : 'moln') : r < 0.3 ? 'sol' : r < 0.6 ? 'moln' : r < 0.8 ? 'halv' : 'regn' };
  });
  const prognos = imorgon.map((v, i) => ({ dag: v[0].toUpperCase() + v.slice(1, 3), grad: 4 + kyla + Math.round(blanda(dag + i * 3.1) * 4) - 2, sym: ['moln', 'sol', 'halv', 'regn', 'sno'][Math.floor(blanda(dag * 5 + i) * 5)] }));
  return {
    dag, datum, nr,
    dn: { nyhet: NYHETER[iDn], puffar: [puff(0), puff(1), puff(2)], argang: y - 1864 + 1 },
    svd: { nyhet: NYHETER[iSvd], puffar: [puff(3), puff(4), puff(5)], argang: y - 1884 + 1 },
    vader, prognos,
  };
}

// En sida: bredd och höjd i världens enheter (en tidning i tabloid, 28 × 40 cm, ungefär 0,62 mm på en enhet).
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
const M = 22;
const PAPPER = ['#ebe9e3', '#e2dfd7'];
const SVART = '#1d1c1b';
const GRA = 'rgba(29, 28, 27, .5)';

const px = (font) => parseFloat(/(\d+(\.\d+)?)px/.exec(font)[1]);
// bredden av text i en font (canvas mäter fel med letterSpacing, så mellanrummet läggs till själv)
function bredd(x, text, font, sp = 0) {
  x.font = font;
  if (!sp) return x.measureText(text).width;
  // (med spärr skrivs ett tecken i taget, utan kerning, och det sista får inget mellanrum efter sig)
  let w = 0;
  for (const ch of text) w += x.measureText(ch).width + sp * px(font);
  return w - sp * px(font);
}
// text med spärr sp (i fontens storlek), med vänster-, mitt- eller högerkant vid x0, och hoptryckt om den inte ryms i max
function skriv(x, text, x0, y, font, { sp = 0, farg = SVART, max = Infinity, lin = 'v' } = {}) {
  x.font = font;
  x.fillStyle = farg;
  const p = px(font);
  const w = bredd(x, text, font, sp);
  const k = Math.min(1, max / w);
  x.save();
  x.translate(lin === 'm' ? x0 - (w * k) / 2 : lin === 'h' ? x0 - w * k : x0, y);
  x.scale(k, 1);
  if (!sp) x.fillText(text, 0, 0);
  else {
    let at = 0;
    for (const ch of text) {
      x.fillText(ch, at, 0);
      at += x.measureText(ch).width + sp * p;
    }
  }
  x.restore();
  return w * k;
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
// Rubriken så stor som går (högst stor) på högst n rader i bredden w. → { rader, px }
function passa(x, text, font, w, n, stor, liten = 10) {
  for (let s = stor; s > liten; s -= 1) {
    const r = radbryt(x, text, font(s), w);
    if (r.length <= n && r.every((t) => bredd(x, t, font(s)) <= w)) return { rader: r, px: s };
  }
  return { rader: radbryt(x, text, font(liten), w), px: liten };
}
// stycken: rader i en font, radavstånd lh. → y efter
function stycke(x, rader, x0, y, font, lh, farg = SVART, lin = 'v') {
  x.font = font;
  x.fillStyle = farg;
  x.textAlign = { v: 'left', m: 'center', h: 'right' }[lin];
  for (const r of rader) { y += lh; x.fillText(r, x0, y); }
  x.textAlign = 'left';
  return y;
}
// brödtext som grå rader i en spalt (för liten för att läsas där den syns)
function spalt(x, x0, y0, w, y1, rad = 7, seed = 1) {
  x.fillStyle = 'rgba(29, 28, 27, .42)';
  let i = 0;
  for (let y = y0; y < y1 - 3; y += rad) {
    const f = blanda(seed * 9.1 + i);
    const sista = i % 9 === 8;
    x.fillRect(x0 + (i % 9 === 0 ? 6 : 0), y, sista ? w * (0.25 + 0.5 * f) : w * (0.94 + 0.06 * f) - (i % 9 === 0 ? 6 : 0), rad * 0.42);
    i++;
  }
}
const linje = (x, x0, y, w, h = 1, farg = SVART) => { x.fillStyle = farg; x.fillRect(x0, y, w, h); };

// ---------- bilderna ----------
// Målade fotografier: en stad i skymningen, snö på en gata, granskog vid en sjö, skärgården, hyreshus, en julgata
// och de små till puffarna. Sedan som i tryck: lite blekare, svärtan aldrig helt svart, och korn (tryckt).
function rng(seed) {
  let s = (Math.floor(seed * 9973) >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const grad = (x, y0, y1, ...f) => { const g = x.createLinearGradient(0, y0, 0, y1); f.forEach((c, i) => g.addColorStop(i / (f.length - 1), c)); return g; };
function glod(x, cx, cy, r, farg, a = 1) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, farg.replace('A', a));
  g.addColorStop(1, farg.replace('A', 0));
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
}
// granar: en siluett av spetsiga lager
function gran(x, cx, fot, h, farg) {
  x.fillStyle = farg;
  x.beginPath();
  const b = h * 0.32;
  x.moveTo(cx, fot - h);
  for (let i = 1; i <= 5; i++) {
    const y = fot - h + (h * i) / 5;
    const w = (b * i) / 5;
    x.lineTo(cx + w, y);
    x.lineTo(cx + w * 0.45, y - h * 0.04);
  }
  for (let i = 5; i >= 1; i--) {
    const y = fot - h + (h * i) / 5;
    const w = (b * i) / 5;
    x.lineTo(cx - w * 0.45, y - h * 0.04);
    x.lineTo(cx - w, y);
  }
  x.closePath();
  x.fill();
}
function fonster(x, x0, y0, w, h, r, tand = 0.35, farg = '#f3c66d') {
  const fw = Math.max(1.5, w * 0.05);
  for (let yy = y0 + h * 0.06; yy < y0 + h - 4; yy += fw * 2.6) {
    for (let xx = x0 + fw; xx < x0 + w - fw * 1.5; xx += fw * 2.2) {
      if (r() < tand) { x.fillStyle = farg; x.globalAlpha = 0.65 + 0.35 * r(); x.fillRect(xx, yy, fw, fw * 1.35); }
    }
  }
  x.globalAlpha = 1;
}
const MALA = {
  // stad i skymningen över vattnet, med tända fönster som speglar sig
  stad(x, W, H, r) {
    const hy = H * 0.62;
    x.fillStyle = grad(x, 0, hy, '#1c2742', '#45506b', '#8f7a78', '#d39a63');
    x.fillRect(0, 0, W, hy);
    x.fillStyle = grad(x, hy, H, '#3a3f4c', '#151820');
    x.fillRect(0, hy, W, H - hy);
    const hus = [];
    for (let xx = -5; xx < W; ) {
      const w = W * (0.04 + 0.08 * r());
      const h = H * (0.08 + 0.2 * r());
      hus.push([xx, w, h]);
      xx += w * (0.8 + 0.2 * r());
    }
    // ett torn med spira
    const tx = W * (0.25 + 0.5 * r());
    x.fillStyle = '#171a24';
    x.fillRect(tx - W * 0.02, hy - H * 0.36, W * 0.04, H * 0.36);
    x.beginPath(); x.moveTo(tx - W * 0.022, hy - H * 0.36); x.lineTo(tx, hy - H * 0.55); x.lineTo(tx + W * 0.022, hy - H * 0.36); x.fill();
    for (const [xx, w, h] of hus) {
      x.fillStyle = r() < 0.5 ? '#1a1d27' : '#22242e';
      x.fillRect(xx, hy - h, w, h + 1);
      fonster(x, xx, hy - h, w, h, r, 0.3);
    }
    // spegling: fönstrens ljus i strimmor
    for (let i = 0; i < W * 0.5; i++) {
      const xx = r() * W;
      x.fillStyle = r() < 0.6 ? 'rgba(243, 198, 109, .35)' : 'rgba(210, 150, 110, .25)';
      x.fillRect(xx, hy + 2 + r() * (H - hy) * 0.8, 2 + r() * 10, 1.2);
    }
    for (let i = 0; i < 8; i++) glod(x, r() * W, hy - 2, 10 + r() * 14, 'rgba(255, 210, 140, A)', 0.5);
  },
  // snö på en gata i kvällsmörkret: gatlyktor, husen längs den, en buss och snön som faller
  sno(x, W, H, r) {
    const vx = W * 0.56;
    const vy = H * 0.46;
    x.fillStyle = grad(x, 0, vy, '#2d3442', '#5b6374', '#8a8f9b');
    x.fillRect(0, 0, W, H);
    // husen på båda sidor, mot gränden
    for (const s of [-1, 1]) {
      x.fillStyle = s < 0 ? '#3a3a40' : '#45444a';
      x.beginPath();
      const ut = s < 0 ? 0 : W;
      x.moveTo(ut, 0); x.lineTo(vx + s * W * 0.06, vy - H * 0.2); x.lineTo(vx + s * W * 0.06, vy + H * 0.02); x.lineTo(ut, H * 0.78);
      x.fill();
      for (let i = 0; i < 26; i++) {
        const t = r();
        const fx = ut + (vx + s * W * 0.06 - ut) * t;
        const top = 0 + (vy - H * 0.2) * t;
        const bot = H * 0.78 + (vy + H * 0.02 - H * 0.78) * t;
        const fy = top + (bot - top) * (0.15 + 0.6 * r());
        if (r() < 0.55) { x.fillStyle = 'rgba(244, 196, 112, .85)'; x.fillRect(fx, fy, (1 - t) * 9 + 1.5, (1 - t) * 12 + 2); }
      }
    }
    // gatan, vit av snö, med hjulspår
    x.fillStyle = grad(x, vy, H, '#9aa2b0', '#d6dbe3');
    x.beginPath(); x.moveTo(0, H * 0.78); x.lineTo(vx - W * 0.06, vy + H * 0.02); x.lineTo(vx + W * 0.06, vy + H * 0.02); x.lineTo(W, H * 0.78); x.lineTo(W, H); x.lineTo(0, H); x.fill();
    for (const d of [-0.3, -0.12, 0.12, 0.3]) {
      const g = x.createLinearGradient(0, vy, 0, H);
      g.addColorStop(0, 'rgba(90, 96, 110, 0)');
      g.addColorStop(1, 'rgba(90, 96, 110, .45)');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(vx + d * W * 0.08, vy + H * 0.03); x.lineTo(vx + d * W * 1.6 - 9, H); x.lineTo(vx + d * W * 1.6 + 9, H); x.closePath(); x.fill();
    }
    // gatlyktorna
    for (let i = 0; i < 6; i++) {
      const t = 1 - i / 6;
      for (const s of [-1, 1]) {
        const lx = vx + s * (W * 0.07 + W * 0.5 * t * t);
        const ly = vy - H * 0.08 - H * 0.3 * t * t;
        glod(x, lx, ly, 8 + 40 * t * t, 'rgba(255, 214, 150, A)', 0.9);
      }
    }
    // bussen, med baklyktorna
    const bw = W * 0.16;
    const bh = H * 0.13;
    const bx = vx - bw * 0.3;
    const by = vy + H * 0.06;
    x.fillStyle = '#7a1f22';
    x.fillRect(bx, by - bh, bw, bh);
    x.fillStyle = 'rgba(250, 220, 150, .75)';
    x.fillRect(bx + bw * 0.08, by - bh * 0.85, bw * 0.84, bh * 0.35);
    glod(x, bx + bw * 0.1, by - bh * 0.15, 10, 'rgba(255, 60, 40, A)', 1);
    glod(x, bx + bw * 0.9, by - bh * 0.15, 10, 'rgba(255, 60, 40, A)', 1);
    // snöflingorna, några nära och suddiga
    for (let i = 0; i < W * 1.2; i++) {
      const s = r() < 0.08 ? 2.5 + r() * 3 : 0.7 + r() * 1.3;
      x.fillStyle = `rgba(255, 255, 255, ${s > 2 ? 0.35 : 0.75})`;
      x.beginPath(); x.arc(r() * W, r() * H, s, 0, 7); x.fill();
    }
  },
  // granskog i dimma vid en sjö, och en röd stuga vid stranden
  skog(x, W, H, r) {
    const hy = H * 0.6;
    x.fillStyle = grad(x, 0, hy, '#b9c2c6', '#dcdcd5');
    x.fillRect(0, 0, W, hy);
    x.fillStyle = grad(x, hy, H, '#c9cdca', '#7c8986');
    x.fillRect(0, hy, W, H - hy);
    const lager = [['#a9b3b0', 0.1, 0.18, 26], ['#7f8d88', 0.14, 0.26, 18], ['#4b5a52', 0.2, 0.4, 11]];
    for (const [farg, h0, h1, n] of lager) {
      for (let i = 0; i < n; i++) {
        const cx = r() * W * 1.1 - W * 0.05;
        const h = H * (h0 + (h1 - h0) * r());
        gran(x, cx, hy + 1, h, farg);
        // speglingen, blekare
        x.save(); x.globalAlpha = 0.35; x.translate(0, 2 * hy + 2); x.scale(1, -1); gran(x, cx, hy + 1, h, farg); x.restore();
      }
    }
    // stugan
    const sx = W * (0.15 + 0.6 * r());
    const sw = W * 0.1;
    const sh = H * 0.07;
    x.fillStyle = '#8b2a22';
    x.fillRect(sx, hy - sh, sw, sh);
    x.fillStyle = '#3b3532';
    x.beginPath(); x.moveTo(sx - sw * 0.08, hy - sh); x.lineTo(sx + sw / 2, hy - sh * 1.7); x.lineTo(sx + sw * 1.08, hy - sh); x.fill();
    x.fillStyle = '#efe9dc';
    x.fillRect(sx + sw * 0.2, hy - sh * 0.7, sw * 0.18, sh * 0.32);
    x.fillRect(sx + sw * 0.6, hy - sh * 0.7, sw * 0.18, sh * 0.32);
    x.fillStyle = 'rgba(139, 42, 34, .35)';
    x.fillRect(sx, hy + 2, sw, sh * 0.8);
    // dimman över vattnet
    x.fillStyle = grad(x, hy - H * 0.08, hy + H * 0.08, 'rgba(225, 226, 220, 0)', 'rgba(225, 226, 220, .55)', 'rgba(225, 226, 220, 0)');
    x.fillRect(0, hy - H * 0.08, W, H * 0.16);
  },
  // skärgården en grå dag: kobbar med tallar och färjan
  hav(x, W, H, r) {
    const hy = H * 0.5;
    x.fillStyle = grad(x, 0, hy, '#8f9ba5', '#cfd4d6');
    x.fillRect(0, 0, W, hy);
    x.fillStyle = grad(x, hy, H, '#7a8a94', '#3c4a54');
    x.fillRect(0, hy, W, H - hy);
    for (let i = 0; i < W * 0.6; i++) { x.fillStyle = `rgba(220, 228, 232, ${0.1 + 0.2 * r()})`; x.fillRect(r() * W, hy + r() * (H - hy), 4 + r() * 18, 1); }
    for (let i = 0; i < 3; i++) {
      const cx = W * (0.1 + 0.8 * r());
      const w = W * (0.12 + 0.2 * r());
      const y = hy + H * (0.01 + 0.04 * i);
      x.fillStyle = ['#7d766c', '#6c655c', '#5a544c'][i];
      x.beginPath(); x.ellipse(cx, y, w, H * 0.035, 0, Math.PI, 0); x.fill();
      for (let j = 0; j < 4 + i * 2; j++) gran(x, cx - w * 0.7 + r() * w * 1.4, y - H * 0.01, H * (0.04 + 0.04 * r() + 0.02 * i), ['#3f4a42', '#323c35', '#273029'][i]);
    }
    // färjan
    const fx = W * (0.35 + 0.3 * r());
    const fy = hy + H * 0.17;
    const fw = W * 0.3;
    x.fillStyle = '#f2f1ec';
    x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + fw, fy); x.lineTo(fx + fw * 0.94, fy + H * 0.06); x.lineTo(fx + fw * 0.05, fy + H * 0.06); x.fill();
    x.fillRect(fx + fw * 0.2, fy - H * 0.06, fw * 0.55, H * 0.06);
    x.fillStyle = '#2b3138';
    x.fillRect(fx + fw * 0.23, fy - H * 0.045, fw * 0.49, H * 0.018);
    x.fillStyle = '#9c2a25';
    x.fillRect(fx + fw * 0.06, fy + H * 0.035, fw * 0.86, H * 0.012);
    x.fillStyle = 'rgba(240, 244, 245, .6)';
    x.fillRect(fx - fw * 0.15, fy + H * 0.058, fw * 0.3, 2);
  },
  // hyreshus i skymningen, några fönster tända och en byggkran
  hus(x, W, H, r) {
    x.fillStyle = grad(x, 0, H, '#40506c', '#8b8fa0', '#c9a689');
    x.fillRect(0, 0, W, H);
    x.strokeStyle = '#26272c';
    x.lineWidth = 2;
    const kx = W * (0.6 + 0.3 * r());
    x.beginPath(); x.moveTo(kx, H); x.lineTo(kx, H * 0.08); x.lineTo(kx - W * 0.45, H * 0.1); x.moveTo(kx, H * 0.08); x.lineTo(kx + W * 0.12, H * 0.1); x.stroke();
    for (const [x0, w, top, farg] of [[-W * 0.05, W * 0.42, 0.18, '#5f5a58'], [W * 0.33, W * 0.36, 0.3, '#77706a'], [W * 0.66, W * 0.42, 0.24, '#55504f']]) {
      x.fillStyle = farg;
      x.fillRect(x0, H * top, w, H);
      const fw = w * 0.07;
      for (let yy = H * top + fw; yy < H - fw; yy += fw * 2.1) {
        for (let xx = x0 + fw * 0.8; xx < x0 + w - fw; xx += fw * 1.9) {
          const p = r();
          x.fillStyle = p < 0.3 ? '#f1c372' : p < 0.4 ? '#c8d0dc' : '#2f3036';
          x.fillRect(xx, yy, fw, fw * 1.2);
        }
        x.fillStyle = 'rgba(30, 30, 34, .55)';
        x.fillRect(x0, yy + fw * 1.3, w, 2);
      }
    }
  },
  // julgatan: ljusslingor över gatan och folk i rörelse
  gata(x, W, H, r) {
    x.fillStyle = grad(x, 0, H, '#1d2230', '#3c3a44', '#5b4e48');
    x.fillRect(0, 0, W, H);
    for (const s of [0, 1]) {
      x.fillStyle = s ? '#2c2a30' : '#35323a';
      x.fillRect(s ? W * 0.72 : 0, H * 0.05, W * 0.28, H * 0.75);
      fonster(x, s ? W * 0.72 : 0, H * 0.05, W * 0.28, H * 0.5, r, 0.5);
      x.fillStyle = 'rgba(255, 220, 160, .8)';
      x.fillRect(s ? W * 0.74 : W * 0.02, H * 0.6, W * 0.24, H * 0.14);
    }
    for (let k = 0; k < 4; k++) {
      const y = H * (0.12 + k * 0.1);
      for (let i = 0; i < 26; i++) {
        const t = i / 25;
        glod(x, W * 0.1 + W * 0.8 * t, y + Math.sin(t * Math.PI) * H * 0.06, 4 + 3 * r(), 'rgba(255, 226, 160, A)', 0.95);
      }
    }
    for (let i = 0; i < 16; i++) {
      const px_ = r() * W;
      const h = H * (0.18 + 0.1 * r());
      x.fillStyle = r() < 0.5 ? '#141418' : '#24222a';
      x.beginPath(); x.ellipse(px_, H - h * 0.55, h * 0.12, h * 0.42, 0, 0, 7); x.fill();
      x.beginPath(); x.arc(px_, H - h * 1.02, h * 0.09, 0, 7); x.fill();
    }
  },
  // puffarnas små bilder: en person, mat i en skål och böcker
  portratt(x, W, H, r) {
    x.fillStyle = ['#8fa3b5', '#b9a58b', '#9fb19a', '#b59a9a'][Math.floor(r() * 4)];
    x.fillRect(0, 0, W, H);
    x.fillStyle = ['#2b2e36', '#4a3c34', '#30363b'][Math.floor(r() * 3)];
    x.beginPath(); x.ellipse(W * 0.5, H * 1.05, W * 0.48, H * 0.38, 0, 0, 7); x.fill();
    x.fillStyle = '#d9b49a';
    x.beginPath(); x.ellipse(W * 0.5, H * 0.45, W * 0.19, H * 0.24, 0, 0, 7); x.fill();
    x.fillStyle = ['#d8d4cc', '#5b4231', '#2a2420', '#9a7650'][Math.floor(r() * 4)];
    x.beginPath(); x.ellipse(W * 0.5, H * 0.3, W * 0.21, H * 0.13, 0, Math.PI, 0); x.fill();
  },
  mat(x, W, H, r) {
    x.fillStyle = '#a77b58';
    x.fillRect(0, 0, W, H);
    x.fillStyle = '#efece6';
    x.beginPath(); x.ellipse(W * 0.5, H * 0.52, W * 0.42, H * 0.4, 0, 0, 7); x.fill();
    x.fillStyle = r() < 0.5 ? '#d9b444' : '#b8542f';
    x.beginPath(); x.ellipse(W * 0.5, H * 0.52, W * 0.32, H * 0.3, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(255, 255, 255, .5)';
    x.beginPath(); x.ellipse(W * 0.42, H * 0.44, W * 0.08, H * 0.05, 0, 0, 7); x.fill();
  },
  bok(x, W, H, r) {
    x.fillStyle = '#c9c2b4';
    x.fillRect(0, 0, W, H);
    let y = H * 0.95;
    for (let i = 0; i < 5; i++) {
      const h = H * (0.1 + 0.06 * r());
      const w = W * (0.6 + 0.3 * r());
      x.fillStyle = ['#7a2e2a', '#2e4a6b', '#d0a43a', '#3f5b45', '#e6e0d2'][i];
      x.fillRect((W - w) / 2 + (r() - 0.5) * 6, y - h, w, h);
      y -= h + 1;
    }
  },
};
// som tryckt: blekare, svärtan grå, och korn
function tryckt(x, W, H, r) {
  const d = x.getImageData(0, 0, W, H);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const g = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2];
    const n = (r() - 0.5) * 16;
    for (let k = 0; k < 3; k++) p[i + k] = 22 + 0.86 * (g + (p[i + k] - g) * 0.82) + n;
  }
  x.putImageData(d, 0, 0);
}
const fotoCache = new Map();
function foto(typ, W, H, seed) {
  const k = `${typ}:${W}:${H}:${seed}`;
  if (fotoCache.has(k)) return fotoCache.get(k);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  const r = rng(seed);
  (MALA[typ] || MALA.stad)(x, W, H, r);
  try { tryckt(x, W, H, r); } catch (e) { /* (utan bilddata: som den är) */ }
  if (fotoCache.size > 40) fotoCache.clear();
  fotoCache.set(k, c);
  return c;
}
function bild(x, typ, x0, y0, w, h, seed) {
  x.drawImage(foto(typ, Math.round(w), Math.round(h), seed), x0, y0, w, h);
}

// ---------- sidorna ----------
function papper(x, x0) {
  x.fillStyle = grad(x, 0, SH, ...PAPPER);
  x.fillRect(x0, 0, SB, SH);
}
const VERSAL = (t) => String(t).toLocaleUpperCase('sv-SE');
// tidningens namn över hela bredden, i dess typsnitt. → y under
function namnet(x, x0, T, y) {
  const w = SB - 2 * M;
  // (mätt i sin egen storlek: Fraunces är bredare i små storlekar, opsz)
  let s = 50;
  for (let i = 0; i < 4; i++) s = Math.min(70, (s * w) / bredd(x, T.namn, T.huvud(s), T.sp));
  skriv(x, T.namn, x0 + SB / 2, y + s * 0.76, T.huvud(s), { sp: T.sp, lin: 'm' });
  return y + s * 0.76;
}
// En puff: bilden till vänster, vinjetten och rubriken bredvid
function puff(x, x0, y, w, p, T, seed, b = 48) {
  bild(x, p.bild, x0, y, b, b, seed);
  skriv(x, VERSAL(p.vinjett), x0 + b + 7, y + 10, SANS(9.5), { sp: 0.06, farg: T.vinjett });
  const { rader, px: s } = passa(x, p.rubrik, (q) => T.rubrik(q, 700), w - b - 7, 3, 14, 10);
  stycke(x, rader, x0 + b + 7, y + 12, T.rubrik(s, 700), s * 1.08);
}
// raden med datumet: dag, nummer, årgång och pris
function datumrad(x, x0, y, d, T, t) {
  x.font = SANS(9.5, 400);
  skriv(x, VERSAL(d.datum), x0 + M, y, SANS(9.5, 700), { sp: 0.04 });
  skriv(x, `Nr ${d.nr} · Årgång ${t.argang} · Pris 45 kr`, x0 + SB - M, y, SANS(9.5, 400), { lin: 'h' });
}
function innehall(x, x0, y, T) {
  linje(x, x0 + M, y, SB - 2 * M, 1.5);
  const t = 'Ledare 2   Debatt 4   Sverige 6   Världen 16   Kultur 20   Ekonomi 26   Familj 34   Väder och tv 40';
  skriv(x, t, x0 + SB / 2, y + 15, SANS(9.5, 400), { lin: 'm', max: SB - 2 * M });
}

// DN: namnet överst, tre puffar, den stora bilden och rubriken under den
function forstaDn(x, x0, d) {
  const T = TIDNINGAR.dn;
  const t = d.dn;
  papper(x, x0);
  skriv(x, `Grundad ${T.grundad}`, x0 + M, 20, SANS(9.5, 400));
  skriv(x, 'dn.se', x0 + SB - M, 20, SANS(9.5, 700), { lin: 'h' });
  let y = namnet(x, x0, T, 24);
  y += 9;
  linje(x, x0 + M, y, SB - 2 * M, 2.5);
  datumrad(x, x0, y + 15, d, T, t);
  linje(x, x0 + M, y + 21, SB - 2 * M, 1);
  y += 30;
  const pw = (SB - 2 * M - 24) / 3;
  t.puffar.forEach((p, i) => puff(x, x0 + M + i * (pw + 12), y, pw, p, T, d.dag * 3 + i));
  y += 58;
  linje(x, x0 + M, y, SB - 2 * M, 1);
  y += 8;
  const n = t.nyhet;
  const bh = 268;
  bild(x, n.bild, x0 + M, y, SB - 2 * M, bh, d.dag + 1);
  skriv(x, 'Foto: DN', x0 + SB - M, y + bh + 9, SANS(7, 400), { lin: 'h', farg: GRA });
  y += bh + 12;
  skriv(x, VERSAL(n.vinjett), x0 + M, y + 13, SANS(11.5), { sp: 0.08, farg: T.vinjett });
  y += 14;
  const { rader, px: s } = passa(x, n.rubrik, (q) => T.rubrik(q, 800), SB - 2 * M, 2, 54, 30);
  y = stycke(x, rader, x0 + M, y, T.rubrik(s, 800), s * 1.02);
  const ing = radbryt(x, n.ingress, BROD(15), SB - 2 * M);
  y = stycke(x, ing.slice(0, 3), x0 + M, y + 4, BROD(15), 19);
  skriv(x, `Sidan ${n.sida}`, x0 + M, y + 19, SANS(12), { farg: SVART });
  spalt(x, x0 + M, y + 30, SB - 2 * M, SH - 40, 7, d.dag);
  innehall(x, x0, SH - 34, T);
}

// SvD: namnet i spärrade versaler, rubriken över bilden, och under den ingressen och en spalt med puffar
function forstaSvd(x, x0, d) {
  const T = TIDNINGAR.svd;
  const t = d.svd;
  papper(x, x0);
  linje(x, x0 + M, 16, SB - 2 * M, 1);
  let y = namnet(x, x0, T, 24);
  y += 10;
  linje(x, x0 + M, y, SB - 2 * M, 1);
  linje(x, x0 + M, y + 3, SB - 2 * M, 1);
  datumrad(x, x0, y + 17, d, T, t);
  y += 26;
  const n = t.nyhet;
  skriv(x, VERSAL(n.vinjett), x0 + M, y + 13, SANS(11.5), { sp: 0.08, farg: T.vinjett });
  y += 14;
  const { rader, px: s } = passa(x, n.rubrik, (q) => T.rubrik(q, 700), SB - 2 * M, 2, 50, 28);
  y = stycke(x, rader, x0 + M, y, T.rubrik(s, 700), s * 1.04);
  y += 10;
  const bh = 300;
  bild(x, n.bild, x0 + M, y, SB - 2 * M, bh, d.dag + 2);
  skriv(x, 'Foto: SvD', x0 + SB - M, y + bh + 9, SANS(7, 400), { lin: 'h', farg: GRA });
  y += bh + 14;
  const vw = (SB - 2 * M) * 0.56;
  const ing = radbryt(x, n.ingress, BROD(14, 700), vw);
  let yv = stycke(x, ing.slice(0, 5), x0 + M, y, BROD(14, 700), 18);
  skriv(x, `Sidan ${n.sida}`, x0 + M, yv + 18, SANS(11.5), { farg: T.vinjett });
  spalt(x, x0 + M, yv + 28, vw, SH - 40, 7, d.dag + 5);
  const hx = x0 + M + vw + 14;
  const hw = SB - 2 * M - vw - 14;
  linje(x, hx - 7, y - 2, 1, SH - 40 - y);
  t.puffar.forEach((p, i) => {
    const py = y + i * 74;
    if (py + 60 > SH - 42) return;
    puff(x, hx, py, hw, p, T, d.dag * 5 + i, 44);
  });
  innehall(x, x0, SH - 34, T);
}

// Sverige: en förenklad kontur [longitud, latitud], och Gotland och Öland
const SVERIGE = [[20.55, 69.06], [21.2, 68.85], [22.4, 68.7], [23.1, 68.3], [23.9, 67.95], [23.6, 67.2], [23.9, 66.8], [23.65, 66.3], [24.15, 65.83], [23.3, 65.75], [22.15, 65.58], [21.48, 65.32], [21.25, 64.75], [20.26, 63.83], [19.9, 63.6], [18.72, 63.29], [17.94, 62.63], [17.31, 62.39], [17.1, 61.73], [17.06, 61.3], [17.15, 60.67], [18.44, 60.34], [18.8, 60.1], [19.06, 59.72], [18.9, 59.3], [17.95, 58.9], [17.1, 58.67], [16.6, 58.2], [16.64, 57.76], [16.45, 57.26], [16.36, 56.66], [15.85, 56.08], [14.86, 56.17], [14.28, 55.92], [14.35, 55.56], [13.82, 55.43], [13.16, 55.37], [12.98, 55.6], [12.83, 55.87], [12.45, 56.3], [12.85, 56.43], [12.85, 56.67], [12.49, 56.9], [12.07, 57.49], [11.75, 57.7], [11.43, 58.27], [11.17, 58.94], [11.75, 59.2], [11.8, 59.6], [12.5, 60.0], [12.6, 60.5], [12.3, 61.0], [12.6, 61.55], [12.15, 61.75], [12.3, 62.25], [12.05, 62.6], [12.15, 63.3], [12.6, 63.75], [13.6, 64.3], [14.1, 64.5], [13.65, 64.95], [14.5, 65.5], [15.4, 66.15], [16.0, 66.6], [16.4, 67.0], [16.6, 67.5], [17.3, 68.05], [18.12, 68.45], [19.0, 68.5], [20.0, 68.75]];
const GOTLAND = [[18.12, 56.92], [18.2, 57.3], [18.29, 57.64], [18.65, 57.9], [19.3, 57.95], [19.0, 57.6], [18.95, 57.43], [18.5, 57.17]];
const OLAND = [[16.4, 56.2], [16.5, 56.6], [16.7, 57.0], [17.05, 57.35], [16.95, 56.95], [16.65, 56.45], [16.45, 56.2]];
function symbol(x, typ, cx, cy, s) {
  const moln = (dx, dy, f = '#a6adb4') => {
    x.fillStyle = f;
    x.beginPath();
    x.arc(cx + dx - s * 0.35, cy + dy + s * 0.1, s * 0.32, 0, 7);
    x.arc(cx + dx, cy + dy - s * 0.08, s * 0.42, 0, 7);
    x.arc(cx + dx + s * 0.38, cy + dy + s * 0.12, s * 0.3, 0, 7);
    x.fill();
    x.fillRect(cx + dx - s * 0.35, cy + dy + s * 0.05, s * 0.73, s * 0.37);
  };
  if (typ === 'sol' || typ === 'halv') {
    x.fillStyle = '#e6a92e';
    x.beginPath(); x.arc(cx - (typ === 'halv' ? s * 0.2 : 0), cy - (typ === 'halv' ? s * 0.2 : 0), s * 0.42, 0, 7); x.fill();
  }
  if (typ === 'halv') moln(s * 0.15, s * 0.12, '#b8bec4');
  if (typ === 'moln' || typ === 'regn' || typ === 'sno') moln(0, -s * 0.1, typ === 'moln' ? '#a6adb4' : '#8a929b');
  if (typ === 'regn') {
    x.strokeStyle = '#3f6fa8'; x.lineWidth = 1.6;
    for (const dx of [-0.3, 0, 0.3]) { x.beginPath(); x.moveTo(cx + dx * s, cy + s * 0.45); x.lineTo(cx + dx * s - s * 0.12, cy + s * 0.75); x.stroke(); }
  }
  if (typ === 'sno') {
    x.fillStyle = '#3f6fa8';
    for (const dx of [-0.3, 0, 0.3]) { x.beginPath(); x.arc(cx + dx * s, cy + s * 0.6, s * 0.08, 0, 7); x.fill(); }
  }
}
// Baksidan: vädret med kartan och prognosen, och kvällens tv
function baksida(x, x0, d, namn) {
  const T = TIDNINGAR[namn];
  papper(x, x0);
  skriv(x, `${T.kort === 'DN' ? 'DN' : 'SvD'} · ${d.datum}`, x0 + M, 20, SANS(9.5, 400));
  skriv(x, '40', x0 + SB - M, 20, SANS(11), { lin: 'h' });
  linje(x, x0 + M, 27, SB - 2 * M, 1.5);
  skriv(x, 'Vädret', x0 + M, 70, T.rubrik(40, 800));
  skriv(x, 'Prognos för i morgon', x0 + M, 90, SANS(11, 400));
  // kartan
  const ky = 22;
  const kx = ky * Math.cos(62 * Math.PI / 180);
  const ox = x0 + M + 6;
  const oy = 104;
  const P = ([lon, lat]) => [ox + (lon - 11) * kx, oy + (69.2 - lat) * ky];
  x.fillStyle = '#cfd8dd';
  x.fillRect(x0 + M, oy - 6, 190, 318);
  for (const form of [SVERIGE, GOTLAND, OLAND]) {
    x.beginPath();
    form.forEach((q, i) => { const [a, b] = P(q); if (i) x.lineTo(a, b); else x.moveTo(a, b); });
    x.closePath();
    x.fillStyle = '#eef0e8';
    x.fill();
    x.strokeStyle = '#8b97a0';
    x.lineWidth = 1;
    x.stroke();
  }
  for (const s of d.vader) {
    const [a, b] = P([s.lon, s.lat]);
    symbol(x, s.sym, a - 2, b - 9, 13);
    skriv(x, `${s.grad}°`, a + 9, b + 1, SANS(11.5), { farg: s.grad <= 0 ? '#2d5f9a' : '#b23a1f' });
  }
  // prognosen för Stockholm och några städer i en tabell
  const tx = x0 + M + 206;
  const tw = SB - M - tx + x0;
  skriv(x, 'Stockholm', tx, 118, T.rubrik(17, 700));
  d.prognos.forEach((p, i) => {
    const y = 132 + i * 34;
    linje(x, tx, y, tw, 0.8, GRA);
    skriv(x, p.dag, tx, y + 21, SANS(11.5));
    symbol(x, p.sym, tx + 70, y + 16, 14);
    skriv(x, `${p.grad}°`, tx + tw, y + 21, SANS(12.5), { lin: 'h', farg: p.grad <= 0 ? '#2d5f9a' : '#b23a1f' });
  });
  let y = 132 + 5 * 34 + 14;
  skriv(x, 'Sverige i dag', tx, y, T.rubrik(14, 700));
  y += 6;
  for (const s of d.vader.slice(0, 8)) {
    y += 14;
    skriv(x, s.namn, tx, y, SANS(10, 400));
    skriv(x, `${s.grad}°`, tx + tw, y, SANS(10, 700), { lin: 'h' });
  }
  // tv
  y = 446;
  linje(x, x0 + M, y, SB - 2 * M, 2.5);
  skriv(x, 'Tv i kväll', x0 + M, y + 34, T.rubrik(30, 800));
  y += 50;
  const kw = (SB - 2 * M - 24) / 3;
  TV.forEach(([kanal, prog], i) => {
    const kx0 = x0 + M + i * (kw + 12);
    x.fillStyle = SVART;
    x.fillRect(kx0, y, kw, 18);
    skriv(x, kanal, kx0 + 6, y + 13.5, SANS(11.5), { farg: PAPPER[0] });
    let yy = y + 18;
    for (const [tid, titel] of prog) {
      const rader = radbryt(x, titel, SANS(10, tid >= '20' && tid < '22' ? 700 : 400), kw - 36);
      yy += 15;
      skriv(x, tid, kx0, yy, SANS(10, 400), { farg: GRA });
      stycke(x, rader, kx0 + 34, yy - 13, SANS(10, tid >= '20' && tid < '22' ? 700 : 400), 13);
      yy += (rader.length - 1) * 13;
    }
  });
  innehall(x, x0, SH - 34, T);
}

// Insidan (sidorna han läser, sett bakifrån): rubriker, bilder och spalter på varje sida.
function insida(c, namn, d) {
  const x = c.getContext('2d');
  const w = c.width / 2;
  for (const [i, x0] of [0, w].entries()) {
    x.fillStyle = grad(x, 0, c.height, ...PAPPER);
    x.fillRect(x0, 0, w, c.height);
    x.fillStyle = SVART;
    x.fillRect(x0 + w * 0.06, c.height * 0.05, w * 0.88, c.height * 0.035);
    x.fillRect(x0 + w * 0.06, c.height * 0.1, w * 0.6, c.height * 0.035);
    bild(x, ['stad', 'skog', 'hav', 'hus'][(d.dag + i + (namn === 'svd' ? 2 : 0)) % 4], x0 + w * 0.06, c.height * 0.17, w * 0.56, c.height * 0.3, d.dag + i);
    for (let k = 0; k < 3; k++) spalt(x, x0 + w * (0.06 + k * 0.3), c.height * (k === 2 ? 0.17 : 0.5), w * 0.27, c.height * 0.95, 4, k + i);
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
  let dagNu = null;
  let visad = 'dn';
  let nr = 0;
  // Trycker uppslaget (förstasidan, baksidan och insidan) för dagens tidning som visas. Typsnitten hämtas först;
  // kommer de sent trycks det om.
  function rita() {
    if (!dagNu) return;
    const x = ut.getContext('2d');
    baksida(x, 0, dagNu, visad);
    (visad === 'svd' ? forstaSvd : forstaDn)(x, SB, dagNu);
    insida(inn, visad, dagNu);
    U.uUt.value.needsUpdate = true;
    U.uIn.value.needsUpdate = true;
  }
  let fonter = null;
  async function tryck(dag) {
    const mitt = ++nr;
    dagNu = dag;
    rita();
    fonter = fonter || (document.fonts && document.fonts.load
      ? Promise.race([Promise.all([document.fonts.load(PLAY(30, 900)), document.fonts.load(PLAY(30, 700)), document.fonts.load(FRA(30, 600)), document.fonts.load(FRA(30, 700))]), new Promise((ok) => setTimeout(ok, 2500))])
      : Promise.resolve());
    await fonter;
    if (mitt === nr) rita();
  }
  return {
    mesh, U, tryck,
    // vilken av tidningarna han har i händerna ('dn' eller 'svd'); trycks om när den byts
    visa(namn) {
      if (!TIDNINGAR[namn] || namn === visad) return;
      visad = namn;
      rita();
    },
    borta() { g.dispose(); mesh.material.dispose(); U.uUt.value.dispose(); U.uIn.value.dispose(); },
  };
}
