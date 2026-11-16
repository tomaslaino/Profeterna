// node scripts/hasse/flagga.mjs: Nacionals flagga (DL:s lag) på bardiskens front bakom Hasse Backe (SCEN.FLAGGA i
// public/rum-hasse-scen.js), gammal och blekt, till public/rum/hasse-flagga.webp.
//
// Bilden täcker flaggRuta (barens mått, i tygets plan) och är tyget i neutralt ljus: färgen gånger vecken, som
// skuggas av lamporna framför honom till vänster, och skuggan på fronten (svart, genomskinlig). Ljuset på fronten
// lägger sidan på (flagga i public/rum-hasse.js), så det finns inte här. Bilden är lika oskarp som väggen där
// (skärpedjupet, som lopsedel i rum-hasse-3d.js), i den breda bildens skala; i den på höjden ritas den mindre och
// blir lika mycket skarpare som väggen.
//
// Patinan: bandet och bokstäverna i blekta färger, gulnade av röken (mest upptill), smutsigare mot kanterna, veck
// där den har legat hopvikt i fyra, rost runt märlorna, en kaffering och ett hål efter en cigarr. Märlorna i de
// övre hörnen hänger i mässingskrokarna, och tyget sviktar emellan, med veck från hörnen.
//
// Ljuset på fronten där den hänger läser sidan ur små prov av väggens sex bilder, som görs här
// (public/rum/hasse-flagga.json, ljusprov nedan): bakas väggen om ska skriptet köras igen.
//
// Kräver Google Chrome och Futura (finns på Macen), cwebp och dwebp, och Node 22 (WebSocket i cdp.mjs):
// /opt/homebrew/bin/node scripts/hasse/flagga.mjs. Med SKARP=1 sparas också flagga-skarp.png här, utan oskärpan.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { oppna, HERE } from './cdp.mjs';
import { SCEN, BAK, flaggRuta, franBaren, iKamera, kamera } from '../../public/rum-hasse-scen.js';

const G = SCEN.FLAGGA;
const R = flaggRuta();
// bildpunkter per enhet: drygt dubbelt så tätt som väggens breda bild vid flaggan
const K = 0.6;
const TW = Math.round(R.w * K);
const TH = Math.round(R.h * K);
const KAM = kamera();
const ZP = SCEN.FRONT.Z + G.UT;
// väggens breda bild vid flaggan: bildpunkter per enhet, och oskärpan (som lopsedel i rum-hasse-3d.js)
const z = iKamera(franBaren([(G.KROKAR[0] + G.KROKAR[1]) / 2, R.topp - G.H / 2, ZP]), KAM)[2];
const skala = (BAK.bred.S * SCEN.D) / z;
const skiva = SCEN.LINS.R * Math.abs(1 - SCEN.LINS.F / z) * (SCEN.D / SCEN.LINS.F) * BAK.bred.S;
const oskarp = Math.hypot(skiva / 2, 1.1) * (K / skala);
// Krokarnas knopp (bak.html: plattan 18 framför fronten, skaftet 60 ut, knoppen 6 × 17 × 6 vid 58) sedd från kameran,
// i tygets plan: där strålen från ögat genom knoppen går genom planet
const ogat = franBaren(KAM.pos, -SCEN.BAR);
const iPlanet = (p) => {
  const t = (ZP - ogat[2]) / (p[2] - ogat[2]);
  return [ogat[0] + t * (p[0] - ogat[0]), ogat[1] + t * (p[1] - ogat[1])];
};
const KROKY = SCEN.FRONT.KROK + 16;
const knopp = G.KROKAR.map((x) => iPlanet([x, KROKY - 2, SCEN.FRONT.Z + 18 + 58]));

function rita({ G, R, K, TW, TH, oskarp, knopp, KROK }) {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hash = (x, y) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const brus = (x, y) => {
    const xi = Math.floor(x); const yi = Math.floor(y);
    const fx = x - xi; const fy = y - yi;
    const u = fx * fx * (3 - 2 * fx); const v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi); const b = hash(xi + 1, yi); const c = hash(xi, yi + 1); const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, n = 4) => {
    let s = 0; let a = 0.5; let f = 1;
    for (let i = 0; i < n; i++) { s += a * brus(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= 0.5; }
    return s / (1 - 0.5 ** n);
  };
  const LIN = new Float32Array(256).map((_, i) => (i / 255) ** 2.2);
  const srgb = (x) => Math.round(255 * clamp(x) ** (1 / 2.2));

  // ---- mönstret, plant: 1,5 bildpunkter per enhet ----
  const DW = Math.round(G.B * 1.5);
  const DH = Math.round(G.H * 1.5);
  const d = document.createElement('canvas');
  d.width = DW; d.height = DH;
  const g = d.getContext('2d');
  // blekta färger i neutralt ljus: marinblått som har blivit skiffer, vitt som har gulnat, rött som har blivit tegel
  const BLA = '#33406a';
  const VIT = '#d4c59e';
  const ROD = '#a6503f';
  const KANTBAND = '#c2b28b';
  g.fillStyle = BLA;
  g.fillRect(0, 0, DW, DH);
  // bandet: från nedre vänstra hörnet till övre högra, lika brett runt diagonalen (som klubbens flagga)
  const t = 0.213 * DH;
  const k = DH / DW;
  g.fillStyle = VIT;
  g.beginPath();
  g.moveTo(0, DH - t); g.lineTo((DH - t) / k, 0); g.lineTo(DW, 0); g.lineTo(DW, t); g.lineTo(t / k, DH); g.lineTo(0, DH);
  g.closePath(); g.fill();
  // C.N.deF. längs bandet, i en rund, fet grotesk
  g.save();
  g.translate(DW / 2, DH / 2);
  g.rotate(-Math.atan2(DH, DW));
  g.fillStyle = ROD;
  g.textBaseline = 'alphabetic';
  const diag = Math.hypot(DW, DH);
  let f = 0.2 * DH / 0.72;
  const delar = () => [['C.N.', f, 0], ['de', 0.66 * f, 0.2], ['F.', f, 0]];
  const bredd = () => delar().reduce((s, [txt, fs]) => { g.font = `bold ${fs}px Futura`; return s + g.measureText(txt).width; }, 0);
  f *= Math.min(1, (0.58 * diag) / bredd());
  const cap = 0.72 * f;
  let x = -bredd() / 2;
  for (const [txt, fs, upp] of delar()) {
    g.font = `bold ${fs}px Futura`;
    g.fillText(txt, x, cap / 2 - upp * cap);
    x += g.measureText(txt).width;
  }
  g.restore();
  // kantbandet vid stången (märlorna sitter i det), och fållarna runt om med sina sömmar
  const E = 1.5;
  const KB = 52 * E;
  g.fillStyle = KANTBAND;
  g.fillRect(0, 0, KB, DH);
  g.fillStyle = 'rgba(40, 28, 20, 0.28)';
  for (let y = 4; y < DH; y += 9) g.fillRect(KB - 7, y, 2, 5);
  for (let x2 = KB + 4; x2 < DW; x2 += 9) { g.fillRect(x2, 14 * E, 5, 1.6); g.fillRect(x2, DH - 14 * E, 5, 1.6); }
  for (let y = 4; y < DH; y += 9) g.fillRect(DW - 14 * E, y, 1.6, 5);

  // patinan
  const im = g.getImageData(0, 0, DW, DH);
  const p = im.data;
  const horn = [[G.IN, G.IN], [G.B - G.IN, G.IN], [G.IN, G.H - G.IN], [G.B - G.IN, G.H - G.IN]].map(([a, b]) => [a * E, b * E]);
  const VECK = [[0.5, 1, 'u'], [0.25, -1, 'u'], [0.75, 1, 'u'], [0.5, -1, 'v']];
  const KAFFE = [0.13 * DW, 0.85 * DH, 26 * E];
  for (let y = 0; y < DH; y++) {
    for (let x2 = 0; x2 < DW; x2++) {
      const i = (y * DW + x2) * 4;
      let r = LIN[p[i]]; let gg = LIN[p[i + 1]]; let b = LIN[p[i + 2]];
      const u = x2 / DW; const v = y / DH;
      // solen och tvättarna har blekt det ojämnt
      const blek = ss(0.3, 0.85, fbm(x2 / 300, y / 300)) * (0.7 + 0.3 * (1 - v)) + 0.25 * ss(0.5, 0.8, fbm(x2 / 70 + 3, y / 70));
      const m = (r + gg + b) / 3;
      r += (m + 0.045 - r) * 0.34 * blek; gg += (m + 0.045 - gg) * 0.34 * blek; b += (m + 0.06 - b) * 0.34 * blek;
      // där den har legat hopvikt i fyra har de yttre fälten blekts mer än de inre (mjukt vid vecken)
      const fu = ss(0.47, 0.53, u); const fv = ss(0.47, 0.53, v); const fq = ss(0.22, 0.28, u) * (1 - fu) + fu * ss(0.72, 0.78, u);
      const falt = 0.32 * (1 - fu) * (1 - fv) + 0.12 * fu * (1 - fv) + 0.2 * (1 - fu) * fv + 0.06 * fu * fv + 0.08 * fq;
      r += (m + 0.05 - r) * falt; gg += (m + 0.05 - gg) * falt; b += (m + 0.065 - b) * falt;
      // röken: gulare upptill, i moln
      const rok = clamp(0.3 + 0.7 * fbm(x2 / 230 + 5, y / 230 + 2)) * (0.55 + 0.45 * (1 - v));
      r *= 1 - 0.05 * rok; gg *= 1 - 0.16 * rok; b *= 1 - 0.38 * rok;
      // smuts mot kanterna, mest nedtill och vid stången där man har tagit i den
      const kant = Math.min(x2, DW - x2, y * 1.6, (DH - y) * 0.8) / E;
      const smuts = (1 - ss(0, 70, kant)) * (0.5 + 0.5 * fbm(x2 / 60, y / 60 + 9));
      r *= 1 - 0.22 * smuts; gg *= 1 - 0.25 * smuts; b *= 1 - 0.3 * smuts;
      // vecken där den har legat hopvikt: slitna (ljusare) i själva vecket, lite smuts bredvid
      for (const [at, , led] of VECK) {
        const dd = Math.abs((led === 'u' ? u : v) - at) * (led === 'u' ? DW : DH) / E;
        if (dd > 30) continue;
        // (ojämnt längs vecket: nött på sina ställen, nästan inget på andra)
        const langs = ss(0.35, 0.75, fbm((led === 'u' ? y : x2) / 55, at * 50 + 3));
        const slit = Math.exp(-((dd / 2.6) ** 2)) * langs * (dd < 30 && at === 0.5 ? 1 : 0.5);
        const mork = (Math.exp(-((dd / 10) ** 2)) - Math.exp(-((dd / 3) ** 2))) * langs;
        r += (0.5 - r) * 0.16 * slit; gg += (0.48 - gg) * 0.16 * slit; b += (0.44 - b) * 0.16 * slit;
        r *= 1 - 0.06 * mork; gg *= 1 - 0.06 * mork; b *= 1 - 0.07 * mork;
      }
      // rost runt märlorna
      for (const [hx, hy] of horn) {
        const dd = Math.hypot(x2 - hx, y - hy) / E;
        if (dd > 90) continue;
        const rost = Math.exp(-((dd / 30) ** 2)) * (0.6 + 0.4 * fbm(x2 / 20, y / 20));
        r *= 1 - 0.2 * rost; gg *= 1 - 0.32 * rost; b *= 1 - 0.48 * rost;
      }
      // en kaffering på bandet nere vid stången
      {
        const dd = Math.hypot(x2 - KAFFE[0], (y - KAFFE[1]) * 1.08) - KAFFE[2] * (1 + 0.06 * Math.sin(Math.atan2(y - KAFFE[1], x2 - KAFFE[0]) * 3));
        const ring = Math.exp(-((dd / (2.4 * E)) ** 2)) * 0.8 + (dd < 0 ? 0.18 : 0);
        r *= 1 - 0.1 * ring; gg *= 1 - 0.17 * ring; b *= 1 - 0.3 * ring;
      }
      // bokstäverna: trycket har spruckit och nötts
      if (p[i] > p[i + 2] + 60) {
        const not = ss(0.55, 0.85, fbm(x2 / 9, y / 9, 3));
        r += (0.5 - r) * 0.35 * not; gg += (0.36 - gg) * 0.35 * not; b += (0.3 - b) * 0.35 * not;
      }
      // tyget
      const vav = 1 + 0.035 * (hash(x2, y) - 0.5) + 0.03 * (fbm(x2 / 3, y / 14, 2) - 0.5);
      p[i] = srgb(r * vav); p[i + 1] = srgb(gg * vav); p[i + 2] = srgb(b * vav);
    }
  }
  const monster = im;

  // ---- tyget som hänger ----
  const D = G.KROKAR[1] - G.KROKAR[0];
  const XL = G.KROKAR[0] - G.IN;
  // överkanten sviktar mellan märlorna, och hörnen utanför dem hänger lite
  const sag = (a) => {
    const s = (a - G.IN) / D;
    if (s >= 0 && s <= 1) return G.SAG * 4 * s * (1 - s);
    return 9 * clamp(Math.abs(s < 0 ? a - G.IN : a - (G.B - G.IN)) / G.IN) ** 1.6;
  };
  const inat = (a, b) => 7 * (b / G.H) * (1 - (2 * a) / G.B);
  // tyget (a, b från övre vänstra hörnet) → barens mått
  const fram = (a, b) => [XL + a + inat(a, b), R.topp - sag(a) * (1 - 0.45 * b / G.H) - b];
  const bak = (X, Y) => {
    let a = X - XL; let b = R.topp - Y;
    for (let n = 0; n < 4; n++) {
      a = X - XL - inat(a, b);
      const s = sag(a);
      b = (R.topp - s - Y) / (1 - (0.45 * s) / G.H);
    }
    return [a, b];
  };
  // vecken i tyget (höjd ut från fyllningen, i enheter)
  const linje = (ax, ay, bx, by, A, w0, w1) => ({ ax, ay, bx, by, A, w0, w1, l: Math.hypot(bx - ax, by - ay) });
  const B = G.B; const Hh = G.H; const I = G.IN;
  const ASAR = [
    // från den vänstra märlan, i en solfjäder ned mot mitten
    linje(I + 4, I + 10, B * 0.24, Hh * 1.02, 10, 7, 40),
    linje(I + 6, I + 8, B * 0.42, Hh * 0.8, 12, 8, 46),
    linje(I + 8, I + 6, B * 0.6, Hh * 0.44, 9, 7, 38),
    // små, tätt intill märlan, där tyget drar
    linje(I + 4, I + 6, I + 120, I + 150, 5, 3, 12),
    linje(I + 6, I + 4, I + 170, I + 70, 4.5, 3, 11),
    // från den högra, lite annorlunda
    linje(B - I - 4, I + 10, B * 0.78, Hh * 1.02, 9, 7, 38),
    linje(B - I - 6, I + 8, B * 0.56, Hh * 0.82, 12, 8, 48),
    linje(B - I - 8, I + 6, B * 0.4, Hh * 0.48, 8, 7, 34),
    linje(B - I - 4, I + 6, B - I - 130, I + 140, 5, 3, 12),
    linje(B - I - 6, I + 4, B - I - 180, I + 60, 4, 3, 10),
  ];
  const hojd = (a, b) => {
    let h = 0;
    for (const L of ASAR) {
      const dx = (L.bx - L.ax) / L.l; const dy = (L.by - L.ay) / L.l;
      const t2 = ((a - L.ax) * dx + (b - L.ay) * dy) / L.l;
      if (t2 <= 0 || t2 >= 1) continue;
      const vinkel = (a - L.ax) * dy - (b - L.ay) * dx;
      const w = L.w0 + (L.w1 - L.w0) * t2;
      h += 1.6 * L.A * Math.sqrt(t2) * (1 - t2) ** 0.8 * 1.9 * Math.exp(-((vinkel / w) ** 2));
    }
    // svackan mellan märlorna: ett mjukt U under överkanten
    const s = clamp((a - I) / D);
    const u4 = 4 * s * (1 - s);
    h += 14 * u4 * Math.exp(-(((b - (30 + 50 * u4)) / 26) ** 2)) - 8 * u4 * Math.exp(-(((b - (90 + 80 * u4)) / 30) ** 2)) + 5 * u4 * Math.exp(-(((b - (150 + 100 * u4)) / 34) ** 2));
    // vecken där den har legat hopvikt i fyra: skarpa, och en mjuk böj runt
    for (const [at, tecken, led] of VECK) {
      const dd = led === 'u' ? a - at * B : b - at * Hh;
      if (Math.abs(dd) > 70) continue;
      const styrka = (at === 0.5 ? 1 : 0.55) * (0.35 + 0.65 * ss(0.3, 0.7, fbm((led === 'u' ? b : a) / 90, at * 9)));
      h += tecken * styrka * (1.2 * Math.max(0, 1 - Math.abs(dd) / 3) + 4 * Math.exp(-((dd / 24) ** 2)));
    }
    // ojämnt i stort, och fållen nedtill står ut lite; det nedre vänstra hörnet rullar sig utåt
    h += 9 * (fbm(a / 240, b / 240) - 0.5);
    h += 1.6 * Math.exp(-(Hh - b) / 9);
    h += 16 * Math.exp(-((a ** 2 + (Hh - b) ** 2) / 70 ** 2));
    // kantbandet är styvare
    return a < 52 ? h * 0.6 + 1.2 : h;
  };
  // ljuset från lamporna framför honom till vänster, lite uppifrån
  const LJ = (() => { const v = [-0.3, 0.78, 0.55]; const n = Math.hypot(...v); return v.map((x2) => x2 / n); })();
  const AMB = 0.35; const DIF = 0.65;
  // hålet efter en cigarr, i det blå uppe till vänster
  const HAL = [0.33 * B, 0.21 * Hh, 4.5];

  const tyg = document.createElement('canvas');
  tyg.width = TW; tyg.height = TH;
  const tx = tyg.getContext('2d');
  const ut = tx.createImageData(TW, TH);
  const o = ut.data;
  const mask = new Float32Array(TW * TH);
  const prov = (u, v) => {
    const X = clamp(u * DW - 0.5, 0, DW - 1.001); const Y = clamp(v * DH - 0.5, 0, DH - 1.001);
    const x0 = Math.floor(X); const y0 = Math.floor(Y); const fx = X - x0; const fy = Y - y0;
    const c = [0, 0, 0];
    for (const [xx, yy, w] of [[x0, y0, (1 - fx) * (1 - fy)], [x0 + 1, y0, fx * (1 - fy)], [x0, y0 + 1, (1 - fx) * fy], [x0 + 1, y0 + 1, fx * fy]]) {
      const i = (yy * DW + xx) * 4;
      c[0] += w * LIN[monster.data[i]]; c[1] += w * LIN[monster.data[i + 1]]; c[2] += w * LIN[monster.data[i + 2]];
    }
    return c;
  };
  for (let j = 0; j < TH; j++) {
    for (let i = 0; i < TW; i++) {
      const X = R.x0 + ((i + 0.5) / TW) * R.w;
      const Y = R.y0 - ((j + 0.5) / TH) * R.h;
      const [a, b] = bak(X, Y);
      // kanterna, med trådar som har lossnat (mest i den fria änden till höger)
      const trad = 1.2 * fbm(a / 6, b / 6, 2) + (a > B - 30 ? 3 * fbm(b / 4, 7, 2) : 0);
      // (nederkanten böljar där vecken drar upp den)
      const ned = Hh - 5 * Math.sin(a / 70 + 0.8) * clamp(a / 120) - 3 * Math.sin(a / 29 + 2);
      const kant = Math.min(a, B - a, b, ned - b) - trad;
      let al = clamp(kant * K + 0.5);
      // hålet, med en bränd kant
      const dh = Math.hypot(a - HAL[0], b - HAL[1]) - HAL[2] * (1 + 0.25 * (fbm(a / 3, b / 3, 2) - 0.5));
      al *= clamp(dh * K + 0.5);
      if (al <= 0) continue;
      const h0 = hojd(a, b);
      const ha = (hojd(a + 1.5, b) - hojd(a - 1.5, b)) / 3;
      const hb = (hojd(a, b + 1.5) - hojd(a, b - 1.5)) / 3;
      const n = [-ha, hb, 1];
      const nl = Math.hypot(...n);
      const ljus = (AMB + DIF * Math.max(0, (n[0] * LJ[0] + n[1] * LJ[1] + n[2] * LJ[2]) / nl)) / (AMB + DIF * LJ[2]);
      // i svackorna når mindre ljus
      const lap = (hojd(a + 3, b) + hojd(a - 3, b) + hojd(a, b + 3) + hojd(a, b - 3) - 4 * h0) / 9;
      const ao = 1 - clamp(lap * 1.6, 0, 0.2);
      const c = prov(a / B, b / Hh);
      const sv = 1 + 0.5 * (fbm(a / 5 + 4, b / 5, 2) - 0.5);
      const bran = Math.exp(-((Math.max(0, dh) / (5 * sv)) ** 2));
      const brun = Math.exp(-((Math.max(0, dh) / (16 * sv)) ** 2));
      const f2 = ljus * ao;
      const tona = (x2, s0, s1) => x2 * (1 - 0.85 * bran * s0) * (1 - 0.3 * brun * s1);
      const q = (j * TW + i) * 4;
      o[q] = srgb(tona(c[0] * f2, 0.92, 0.6));
      o[q + 1] = srgb(tona(c[1] * f2, 0.95, 0.75));
      o[q + 2] = srgb(tona(c[2] * f2, 0.97, 0.9));
      o[q + 3] = Math.round(255 * al);
      mask[j * TW + i] = al;
    }
  }
  tx.putImageData(ut, 0, 0);

  // märlorna (mässing, nött), och krokarna i de övre: knoppen framför tyget, där kameran ser den
  const iBilden = (X, Y) => [((X - R.x0) / R.w) * TW, ((R.y0 - Y) / R.h) * TH];
  const marla = (cx, cy) => {
    const r1 = 15 * K; const r0 = 8.5 * K;
    const gr = tx.createRadialGradient(cx - 0.4 * r1, cy - 0.5 * r1, 0.2 * r1, cx, cy, r1);
    gr.addColorStop(0, '#d8bf86'); gr.addColorStop(0.5, '#9c7c40'); gr.addColorStop(1, '#5a4320');
    tx.fillStyle = gr;
    tx.beginPath(); tx.arc(cx, cy, r1, 0, 2 * Math.PI); tx.arc(cx, cy, r0, 0, 2 * Math.PI, true); tx.fill();
    tx.fillStyle = '#1a0f08';
    tx.beginPath(); tx.arc(cx, cy, r0, 0, 2 * Math.PI); tx.fill();
  };
  const knappen = ([X, Y], n) => {
    const X0 = G.KROKAR[n];
    const [cx, cy] = iBilden(X, Y);
    // skaftet: från där det går genom märlan (i tygets plan) ut till knoppen
    const [px, py] = iBilden(X0, KROK);
    tx.strokeStyle = '#7a5d2a';
    tx.lineWidth = 9 * K;
    tx.lineCap = 'round';
    tx.beginPath(); tx.moveTo(px, py); tx.lineTo(cx, cy); tx.stroke();
    tx.strokeStyle = 'rgba(240, 220, 160, 0.5)';
    tx.lineWidth = 2.5 * K;
    tx.beginPath(); tx.moveTo(px - 2 * K, py - 2 * K); tx.lineTo(cx - 2 * K, cy - 3 * K); tx.stroke();
    const gr = tx.createRadialGradient(cx - 2.5 * K, cy - 7 * K, 0.5 * K, cx, cy, 17 * K);
    gr.addColorStop(0, '#f0dca2'); gr.addColorStop(0.45, '#b08c48'); gr.addColorStop(1, '#5e461f');
    tx.fillStyle = gr;
    tx.beginPath(); tx.ellipse(cx, cy, 6.5 * K, 17 * K, 0, 0, 2 * Math.PI); tx.fill();
  };
  const marlor = [[I, I], [B - I, I], [I, Hh - I], [B - I, Hh - I]].map(([a, b]) => iBilden(...fram(a, b)));
  marlor.forEach(([cx, cy]) => marla(cx, cy));
  const knappar = knopp.map(([X, Y]) => [X, Y]);

  // ---- skuggan på fronten: tyget och knopparna, bort från lamporna (nedåt åt höger) ----
  const sk = document.createElement('canvas');
  sk.width = TW; sk.height = TH;
  const sx = sk.getContext('2d');
  const sm = sx.createImageData(TW, TH);
  for (let n = 0; n < TW * TH; n++) sm.data[n * 4 + 3] = Math.round(255 * mask[n]);
  sx.putImageData(sm, 0, 0);
  const forma = document.createElement('canvas');
  forma.width = TW; forma.height = TH;
  const fx = forma.getContext('2d');
  fx.drawImage(sk, 0, 0);
  fx.fillStyle = '#000';
  for (const [X, Y] of knappar) { const [cx, cy] = iBilden(X, Y); fx.beginPath(); fx.ellipse(cx, cy, 7 * K, 17 * K, 0, 0, 2 * Math.PI); fx.fill(); }
  const UT = G.UT;
  const skugga = document.createElement('canvas');
  skugga.width = TW; skugga.height = TH;
  const kx = skugga.getContext('2d');
  // (den skarpa nära tyget och en bred, där tyget skymmer ljuset runt om)
  kx.filter = `blur(${(0.45 * UT * K).toFixed(2)}px)`;
  kx.globalAlpha = 0.5;
  kx.drawImage(forma, -LJ[0] / LJ[2] * UT * K, LJ[1] / LJ[2] * UT * K);
  kx.filter = `blur(${(1.4 * UT * K).toFixed(2)}px)`;
  kx.globalAlpha = 0.28;
  kx.drawImage(forma, 0.2 * UT * K, 0.4 * UT * K);
  kx.filter = 'none';
  kx.globalAlpha = 1;

  // allt ihop: skuggan, tyget, knopparna framför, och sedan lika oskarpt som väggen
  const hop = document.createElement('canvas');
  hop.width = TW; hop.height = TH;
  const hx = hop.getContext('2d');
  hx.drawImage(skugga, 0, 0);
  hx.drawImage(tyg, 0, 0);
  // knoppens skugga på tyget, och knoppen
  hx.save();
  hx.filter = `blur(${(4 * K).toFixed(2)}px)`;
  hx.globalAlpha = 0.45;
  hx.fillStyle = '#000';
  for (const [X, Y] of knappar) { const [cx, cy] = iBilden(X, Y); hx.beginPath(); hx.ellipse(cx + 9 * K, cy + 12 * K, 7 * K, 16 * K, 0.2, 0, 2 * Math.PI); hx.fill(); }
  hx.restore();
  const tx0 = tx;
  tx0.clearRect(0, 0, TW, TH);
  knappar.forEach(knappen);
  hx.drawImage(tyg, 0, 0);
  const slut = document.createElement('canvas');
  slut.width = TW; slut.height = TH;
  const ux = slut.getContext('2d');
  ux.filter = `blur(${oskarp.toFixed(2)}px)`;
  ux.drawImage(hop, 0, 0);
  return { url: slut.toDataURL('image/png'), skarp: hop.toDataURL('image/png') };
}

// Ljuset där flaggan hänger: väggens sex bilder i små prov (PROV, RGB, medelvärden) inom flaggans ruta på väggen,
// som sidan lägger ihop som väggen och läser ljuset ur (flaggForbered i public/rum-hasse.js), till
// public/rum/hasse-flagga.json. Rutan räknas som där (flaggLage): hörnen genom kameran, utåt till hela bildpunkter.
// Bakas väggen om ska proven göras om; till dess läser sidan bilderna själv, långsammare, om rutan inte stämmer.
const RUM = path.join(HERE, '../../public/rum');
const PROV = [16, 12];
function ljusprov() {
  const ut = { r: {}, prov: {} };
  const tmp = path.join(HERE, 'prov.pam');
  for (const [sort, b, hogt] of [['bred', BAK.bred, ''], ['hog', BAK.hog, '-hog']]) {
    const pa = (u, v) => {
      const [x, y] = iKamera(franBaren([R.x0 + u * R.w, R.y0 - v * R.h, ZP]), KAM);
      return [b.px + b.S * x, b.py + b.S * y];
    };
    const P = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => pa(u, v));
    const x0 = Math.max(0, Math.floor(Math.min(...P.map((p) => p[0]))));
    const y0 = Math.max(0, Math.floor(Math.min(...P.map((p) => p[1]))));
    const w = Math.min(b.W, Math.ceil(Math.max(...P.map((p) => p[0])))) - x0;
    const h = Math.min(b.H, Math.ceil(Math.max(...P.map((p) => p[1])))) - y0;
    ut.r[sort] = [x0, y0, w, h];
    for (const del of ['', '-lys', '-dag']) {
      const namn = `hasse-bak${del}${hogt}.webp`;
      execFileSync('dwebp', ['-quiet', '-pam', path.join(RUM, namn), '-o', tmp]);
      const pam = fs.readFileSync(tmp);
      const slut = pam.indexOf('ENDHDR\n') + 7;
      const huvud = pam.subarray(0, slut).toString();
      const BW = +/WIDTH (\d+)/.exec(huvud)[1];
      if (BW !== b.W) throw new Error(`${namn}: ${BW} bred, BAK säger ${b.W}`);
      const px = pam.subarray(slut);
      const prov = Buffer.alloc(PROV[0] * PROV[1] * 3);
      for (let j = 0; j < PROV[1]; j++) {
        for (let i = 0; i < PROV[0]; i++) {
          const s = [0, 0, 0];
          let n = 0;
          const xa = Math.round(x0 + (i * w) / PROV[0]);
          const xb = Math.max(xa + 1, Math.round(x0 + ((i + 1) * w) / PROV[0]));
          const ya = Math.round(y0 + (j * h) / PROV[1]);
          const yb = Math.max(ya + 1, Math.round(y0 + ((j + 1) * h) / PROV[1]));
          for (let y = ya; y < yb; y++) {
            for (let x = xa; x < xb; x++) {
              const q = (y * BW + x) * 4;
              for (let c = 0; c < 3; c++) s[c] += px[q + c];
              n++;
            }
          }
          for (let c = 0; c < 3; c++) prov[(j * PROV[0] + i) * 3 + c] = Math.round(s[c] / n);
        }
      }
      ut.prov[namn] = prov.toString('base64');
    }
  }
  fs.rmSync(tmp, { force: true });
  fs.writeFileSync(path.join(RUM, 'hasse-flagga.json'), JSON.stringify(ut) + '\n');
  return ut;
}

const C = await oppna({ W: 800, H: 600 });
try {
  await C.send('Page.navigate', { url: 'about:blank' });
  await C.sov(300);
  await C.ev(`document.fonts.load('bold 200px Futura')`);
  const r = await C.ev(`(${rita.toString()})(${JSON.stringify({ G, R, K, TW, TH, oskarp, knopp, KROK: SCEN.FRONT.KROK })})`);
  if (!r || !r.url) throw new Error('ingen bild: ' + C.fel.join(' | '));
  const png = path.join(HERE, 'flagga.png');
  fs.writeFileSync(png, Buffer.from(r.url.split(',')[1], 'base64'));
  if (process.env.SKARP) fs.writeFileSync(path.join(HERE, 'flagga-skarp.png'), Buffer.from(r.skarp.split(',')[1], 'base64'));
  const ut = path.join(HERE, '../../public/rum/hasse-flagga.webp');
  execFileSync('cwebp', ['-quiet', '-q', '88', '-alpha_q', '90', '-m', '6', '-sharp_yuv', png, '-o', ut]);
  fs.rmSync(png, { force: true });
  console.log(`${TW} × ${TH}, oskärpa ${oskarp.toFixed(2)} bildpunkter, ${fs.statSync(ut).size} byte → ${path.relative(process.cwd(), ut)}`);
  const lj = ljusprov();
  console.log(`ljusprov: ${Object.keys(lj.prov).length} bilder, rutan ${JSON.stringify(lj.r)} → public/rum/hasse-flagga.json`);
} finally {
  C.stang();
}
