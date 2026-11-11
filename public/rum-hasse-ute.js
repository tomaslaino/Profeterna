// Utsikten bakom Hasse Backe. Genom glaspartiet i baren (SCEN.FONSTER i rum-hasse-scen.js) ser man, som från
// baren Bron vid S:t Eriksbron, ut över spåren mot Kungsholmen och Fridhemsplan: den gröna bron som kommer in
// från höger och går bort mot andra sidan, vattnet och träden nedanför, och de två tornhusen där bron slutar –
// det grå höghuset och tegelhuset med den ärgade kupolen. Vädret och ljuset är rummets (Vader.nu, RumUte.light
// och RumUte.farg i rum-ute.js), så att det är samma himmel, samma moln och samma regn i båda fönstren.
//
// Allt står still och ritas en gång när vädret eller ljuset ändras (sig): i halv upplösning och lika oskarpt
// som kamerans skärpedjup gör det som är långt borta (väggen är bakad med samma lins, scripts/hasse/bak.html),
// så att det inte kostar något medan man sitter hos honom. Det som sitter på glaset – dropparna, snön i
// rutornas nederkant och frosten – är nära och ritas skarpare, på väggens duk (glas).
//
//   utsikt(v, L, lage) → duken (halva bildens mått, BAK i rum-hasse-scen.js), sparad tills sig(v, L) ändras
//   glas(x, v, L, lage, W, H) ritar glaset på väggens duk, innan väggen läggs ovanpå
//   sig(v, L) → en sträng som ändras när utsikten behöver ritas om
//   rutor(lage) → glasets fyra hörn i varje ruta, i väggbildens bildpunkter
//   gangare(v, L, lage) → någon som går på bron: figuren i två steg och vägen längs bron (bron i rum-hasse.js)

import { SCEN, BAK, kamera, iKamera, franBaren } from './rum-hasse-scen.js';

const DEG = Math.PI / 180;
const K = kamera();
const FO = SCEN.FONSTER;
const FILTER = (() => {
  try { return typeof document.createElement('canvas').getContext('2d').filter === 'string'; } catch { return false; }
})();
function rng(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hink = (x, n) => Math.round(x * n) / n;

// Var något hamnar i väggens bild: en riktning ut genom väggen (az grader åt höger, el grader uppåt, i barens
// mått) eller en punkt på väggen (barens mått).
function projektion(lage) {
  const b = BAK[lage];
  const bild = (p) => { const [u, w] = iKamera(p, K); return [b.px + b.S * u, b.py + b.S * w]; };
  const P = (az, el) => {
    const a = az * DEG;
    const e = el * DEG;
    const d = franBaren([Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]);
    return bild([K.pos[0] + d[0] * 1e6, K.pos[1] + d[1] * 1e6, K.pos[2] + d[2] * 1e6]);
  };
  const V = (x, y, z) => bild(franBaren([x, y, z]));
  return { b, P, V };
}

// Rutorna i väggens bild: glaset innanför karmarna, i det plan där det sitter
export function rutor(lage) {
  const { V } = projektion(lage);
  const z = SCEN.VAGG - 80;
  const k = FO.KARM;
  return FO.X.map(([x0, x1]) => [V(x0 + k, FO.Y0 + k, z), V(x1 - k, FO.Y0 + k, z), V(x1 - k, FO.Y1 - k, z), V(x0 + k, FO.Y1 - k, z)]);
}

export function sig(v, L) {
  return [v.slag, hink(v.mangd, 5), v.snotackt, v.blott, v.arstid, v.temp < -3 ? Math.round(v.temp) : '', hink(L.dag, 20), hink(L.sol, 10),
    hink(L.guld, 10), hink(L.bla, 10), hink(L.m, 10), hink(L.dimma, 5), L.lampor, hink(L.tand, 20), v.timme >> 2, v.dag, Math.round(v.vind / 3)].join();
}

const SPARAD = {};
export function utsikt(v, L, lage) {
  const s = sig(v, L);
  const c = SPARAD[lage];
  if (c && c.sig === s) return c.duk;
  const duk = rita(v, L, lage, c && c.duk);
  SPARAD[lage] = { sig: s, duk };
  return duk;
}

// ---------- utsikten ----------

// Höjderna i utsikten (grader uppåt, negativt under ögat): stranden på andra sidan, där husen står, vattnet
// nedanför den och spåren i skärningen närmast, ned mot bardisken. Allt står ned grader lägre i bilden.
const E = { strand: -12.6, vatten: -13.25, spar: -16.0, ned: -2.4 };
// Husen på andra sidan, längs stranden (az från, till, takets höjd, fasadens färg på dagen, sadeltak)
// (samma ockra, terrakotta, gult och ljusa puts som stan genom rummets fönster, STAD i rum-ute.js)
const HUS = [
  [-44, -37, -10.1, '#d2b384', 1], [-37, -31, -9.6, '#c76a42'], [-31, -25.5, -10.4, '#ecd6a4', 1], [-25.5, -19, -9.5, '#d98a3c'],
  [-19, -13.5, -10.1, '#eadfc6', 1], [-13.5, -7.5, -9.7, '#e3b24c'], [-7.5, -1.5, -10.3, '#b9764e', 1], [-1.5, 4, -9.6, '#dcb06a'],
  [4, 9, -10.2, '#ecd6a4', 1], [9, 14, -10.6, '#d2b384'], [25, 30, -10.0, '#e3b24c', 1], [30, 36, -10.5, '#c76a42'],
  [36, 42, -9.8, '#eadfc6', 1], [42, 50, -10.3, '#d98a3c'],
];
// Träden på stranden nedanför (mitten, bredd, toppen)
const TRAD = [[-40, 5, -11.4], [-33.5, 6, -11.0], [-26, 4.5, -11.7], [-19, 6, -11.1], [-11.5, 5, -11.6], [-4.5, 6, -10.9], [2.5, 5, -11.3],
  [8.5, 5, -11.0], [13.5, 4, -11.8], [18, 3, -12.2], [26.5, 3.4, -12.6], [31, 3, -13.0], [36.5, 3.6, -12.8]];
const VARM = ['#ffd58a', '#ffc56b', '#f6e7c1', '#ffcf7a', '#a9c4ff'];
// S:t Eriksbron, från bortre änden vid tegelhuset (a0) till förbi bildens högra kant (a1): balkens överkant och
// underkant, och räcket ovanpå
const BRO = { a0: 20.8, a1: 48, top: [-12.4, -9.8], under: [-12.75, -19.5], racke: [0.3, 2.6] };
const bro = (az, [a, b]) => a + (b - a) * (az - BRO.a0) / (BRO.a1 - BRO.a0);

function rita(v, L, lage, gammal) {
  const { b, P } = projektion(lage);
  const F = window.RumUte.farg;
  // halv upplösning med oskärpan i ritningen; utan ctx.filter (äldre Safari) en fjärdedel, som blir mjuk
  // när den förstoras
  const s = FILTER ? 0.5 : 0.25;
  const W = Math.round(b.W * s);
  const H = Math.round(b.H * s);
  const duk = document.createElement('canvas');
  duk.width = W;
  duk.height = H;
  const x = duk.getContext('2d');
  // skärpedjupet: en punkt långt borta blir en skiva med radien 20 · S · D / skärpeplanet i bakningen
  const ofokus = (20 * b.S * SCEN.D) / (SCEN.D - 120);

  // (den kalla dagen som i rummet: himlen och stan tappar lika mycket färg som där, KALL i rum-ute.js)
  const KH = F.KALL ? F.KALL.himmel : 0.4;
  const KG = F.KALL ? F.KALL.gata : 0.3;
  const T = (c) => F.kall(c, L, KG);
  const dimC = L.sky[2];
  const dis = (c, k) => F.mix(c, dimC, Math.min(1, k * L.dimma));
  // en sak i dagens och nattens färg, i rummets ljus (fasaden i rum-ute.js), kall på dagen och i dimma k
  const fas = (dag, natt, k = 0) => dis(T(F.facade(dag, natt, L)), k);
  const sno = T(F.sno(L));
  const pt = (az, el) => { const [px, py] = P(az, el + E.ned); return [px * s, py * s]; };
  // en yta (az, el) med kanterna delade, så att långa kanter följer kameran
  const yta = (pts, fill, alfa = 1) => {
    x.beginPath();
    pts.forEach((q, i) => {
      const n = pts[(i + 1) % pts.length];
      const steg = Math.max(1, Math.ceil(Math.max(Math.abs(n[0] - q[0]), Math.abs(n[1] - q[1])) / 1.5));
      for (let k = 0; k < steg; k++) {
        const [px, py] = pt(q[0] + (n[0] - q[0]) * (k / steg), q[1] + (n[1] - q[1]) * (k / steg));
        if (i === 0 && k === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
    });
    x.closePath();
    x.globalAlpha = alfa;
    x.fillStyle = fill;
    x.fill();
    x.globalAlpha = 1;
  };
  const ruta = (a0, a1, e0, e1, fill, alfa) => yta([[a0, e0], [a1, e0], [a1, e1], [a0, e1]], fill, alfa);
  const linje = (pts, farg, bredd, alfa = 1) => {
    x.beginPath();
    pts.forEach((q, i) => { const [px, py] = pt(...q); if (i) x.lineTo(px, py); else x.moveTo(px, py); });
    x.globalAlpha = alfa;
    x.strokeStyle = farg;
    x.lineWidth = bredd * s;
    x.stroke();
    x.globalAlpha = 1;
  };
  const R = rng(v.ar * 977 + v.manad * 61 + v.dag * 7 + (v.timme >> 2));

  // himlen: rummets färger (skyCols i rum-ute.js), uppifrån ned mot taken
  {
    const [, yTop] = pt(15, -4);
    const [, yMid] = pt(15, -8);
    const [, yLag] = pt(15, E.strand + 0.6);
    const g = x.createLinearGradient(0, yTop, 0, yLag);
    const k = (yMid - yTop) / (yLag - yTop);
    const H0 = F.kall(L.sky[0], L, KH);
    g.addColorStop(0, H0);
    g.addColorStop(Math.min(0.95, Math.max(0.05, k)), F.kall(L.sky[1], L, KH));
    g.addColorStop(1, F.kall(L.sky[2], L, KH));
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    // låg sol: ett varmt sken nere vid taken
    if (L.guld * (1 - L.m) > 0.05) {
      const [gx, gy] = pt(30, -10.5);
      const r = x.createRadialGradient(gx, gy, 0, gx, gy, W * 0.45);
      r.addColorStop(0, `rgba(255, 176, 110, ${(0.35 * L.guld * (1 - L.m)).toFixed(3)})`);
      r.addColorStop(1, 'rgba(255, 176, 110, 0)');
      x.fillStyle = r;
      x.fillRect(0, 0, W, H);
    }
  }
  // molnen, som rummets (himmelsliv): några när det är halvklart, ett tätt täcke när det är mulet
  if (L.m > 0.12 && v.slag !== 'dimma') {
    const lit = T(F.mix(F.mix(F.mix('#1b1916', '#f3f5f7', L.dag), '#f2b08c', 0.55 * L.guld), '#3a4870', 0.5 * L.bla));
    const dark = F.mix(lit, T('#596273'), 0.35 + 0.2 * L.m);
    const n = L.m < 0.9 ? Math.round(2 + L.m * 7) : 9;
    for (let i = 0; i < n; i++) {
      const az = -38 + R() * 88;
      const el = -10 + R() * 5.5;
      const w = 5 + R() * 9;
      for (let j = 0; j < 5; j++) {
        const [cx, cy] = pt(az + (j / 4 - 0.5) * w * 0.7 + (R() - 0.5) * 1.5, el + (R() - 0.5) * 0.5 - Math.abs(j - 2) * 0.12);
        const [ex] = pt(az + w * (0.15 + R() * 0.12), el);
        const rx = Math.abs(ex - pt(az, el)[0]);
        x.globalAlpha = (L.m < 0.9 ? 0.55 + 0.35 * L.m : 0.35) * (0.8 + R() * 0.2);
        x.fillStyle = j % 2 ? dark : lit;
        x.beginPath();
        x.ellipse(cx, cy, rx, rx * (0.16 + R() * 0.1), 0, 0, 2 * Math.PI);
        x.fill();
      }
    }
    x.globalAlpha = 1;
  }

  // ett fönster i en fasad: glaset, tänt eller inte
  const glas = (fasad) => F.mix(F.mix(fasad, '#ffffff', 0.03), F.mix(T('#222932'), F.kall(L.sky[2], L, KH), 0.32), L.dag);
  const fonsterRad = (a0, a1, e0, e1, da, de, fasad, k, tak = 1) => {
    const g = dis(glas(fasad), k);
    for (let e = e0; e < e1 - de * 0.6; e += de) {
      for (let a = a0 + da * 0.3; a < a1 - da * 0.5; a += da) {
        ruta(a, a + da * 0.45, e, e + de * 0.5, g);
        if (R() < L.tand) ruta(a, a + da * 0.45, e, e + de * 0.5, VARM[(R() * 5) | 0], Math.min(1, (0.5 + R() * 0.45) * (1 - 0.8 * L.dag) * tak));
      }
    }
  };

  // husen längs stranden, med tak och fönster
  for (const [a0, a1, top, dag, sadel] of HUS) {
    const f = fas(dag, '#0e1119', 0.8);
    const tak = v.snotackt ? dis(sno, 0.8) : fas(sadel ? '#5a4a42' : '#3a3c40', '#07080b', 0.8);
    ruta(a0, a1, E.strand - 0.4, top, f);
    if (sadel) yta([[a0 - 0.1, top], [a1 + 0.1, top], [a1 - 0.5, top + 0.75], [a0 + 0.5, top + 0.75]], tak);
    else ruta(a0, a1, top - 0.3, top, tak);
    ruta(a0, a1, top - 0.12, top, F.mix(f, '#ffffff', 0.12 * L.dag));
    fonsterRad(a0, a1, E.strand - 0.2, top - 0.45, 0.62, 0.62, f, 0.8);
    if (sadel) for (const a of [a0 + (a1 - a0) * 0.3, a0 + (a1 - a0) * 0.72]) ruta(a, a + 0.32, top + 0.3, top + 0.95, fas('#7a4a3a', '#0a0808', 0.8));
  }

  // Det grå höghuset vid Fridhemsplan: ljust grå puts, en högre mitt och en röd skylt på högkant
  {
    const f = fas('#a6afb9', '#0e1119', 0.7);
    const sk = F.mix(f, '#000000', 0.12);
    ruta(13.6, 19.2, E.strand - 0.4, -7.7, f);
    ruta(15.0, 17.8, -7.75, -6.6, f);
    ruta(15.9, 16.9, -6.65, -6.2, sk);
    ruta(13.6, 19.2, -7.88, -7.7, sk);
    ruta(13.6, 19.2, -10.9, -10.75, sk);
    fonsterRad(13.6, 19.2, E.strand - 0.2, -7.95, 0.46, 0.48, f, 0.7);
    fonsterRad(15.0, 17.8, -7.65, -6.75, 0.46, 0.48, f, 0.7);
    ruta(16.25, 16.55, -11.1, -8.2, fas('#a8322a', '#3a0d0a', 0.7));
    if (v.snotackt) { ruta(13.6, 19.2, -7.76, -7.68, dis(sno, 0.7)); ruta(15.0, 17.8, -6.66, -6.58, dis(sno, 0.7)); }
    // (på kvällen lyser en grön skylt högt upp)
    if (L.dag < 0.45) ruta(15.4, 17.4, -7.25, -6.9, '#58e08a', 0.85 * (1 - L.dag / 0.45));
  }
  // Tegelhuset där bron slutar, med den ärgade kupolen och lanterninen
  {
    const f = fas('#9e4936', '#130c0b', 0.65);
    const kc = 22.4;
    ruta(19.7, 25.0, E.strand - 0.4, -10.0, f);
    ruta(kc - 1.0, kc + 1.0, -10.05, -9.3, f);
    ruta(19.7, 25.0, -10.15, -10.0, fas('#3b2e2a', '#070606', 0.65));
    ruta(19.7, 25.0, -10.0, -9.88, F.mix(f, '#e8dcc8', 0.35 * L.dag));
    fonsterRad(19.7, 25.0, E.strand + 0.1, -10.25, 0.52, 0.52, f, 0.65);
    fonsterRad(kc - 1.0, kc + 1.0, -9.9, -9.4, 0.5, 0.42, f, 0.65);
    const kop = v.snotackt ? dis(sno, 0.65) : fas('#5f927d', '#0b1412', 0.65);
    const pts = [];
    for (let i = 0; i <= 16; i++) { const t = (i / 16) * Math.PI; pts.push([kc - Math.cos(t) * 0.9, -9.3 + Math.sin(t) * 0.95]); }
    yta(pts, kop);
    ruta(kc - 0.19, kc + 0.19, -8.4, -7.85, kop);
    yta([[kc - 0.25, -7.85], [kc + 0.25, -7.85], [kc, -7.5]], kop);
    linje([[kc, -7.5], [kc, -7.2]], kop, 3);
  }

  // vattnet mellan stranderna, med himlen i
  {
    const is = v.snotackt && v.temp < -4;
    const vatten = is ? dis(F.mix(sno, '#9aa4ad', 0.3), 0.6) : dis(F.mix(F.kall(L.sky[2], L, KH), T('#1d2a30'), 0.45), 0.6);
    ruta(-46, 21, E.vatten, E.strand - 0.05, vatten);
    linje([[-46, E.strand - 0.12], [21, E.strand - 0.12]], F.mix(vatten, F.kall(L.sky[1], L, KH), 0.6), 3, 0.7);
  }
  // slänten ned mot spåren, med buskar och sly, och träden på stranden, efter årstiden
  // (löven som på träden nedanför bron i rummet, lovet i rum-ute.js: ljusgröna i maj, gröna på sommaren,
  // gula på hösten, annars kala)
  const ar = v.manad === 5 ? 'ljus' : v.manad >= 6 && v.manad <= 8 ? 'gron'
    : (v.manad === 9 && v.dag >= 20) || v.manad === 10 || (v.manad === 11 && v.dag <= 25) ? 'host' : v.manad === 9 ? 'gron' : 'kal';
  const kal = ar === 'kal';
  const host = ar === 'host';
  const lov = { ljus: ['#6f9a48', '#86ad55'], gron: ['#2f5a34', '#3f6d3c'], host: ['#b8792e', '#c99a3a', '#8c7a36'], kal: ['#5e5650', '#6e665e'] }[ar];
  {
    const mark = v.snotackt ? dis(F.mix(sno, '#a8aaa6', 0.2), 0.4) : fas(kal ? '#5e5547' : host ? '#6b6034' : '#3e5a34', '#08090a', 0.4);
    ruta(-46, 50, E.spar - 0.2, E.vatten, mark);
    for (let a = -46; a < 50; a += 1.1 + R() * 1.6) {
      const [cx, cy] = pt(a, E.spar + 0.6 + R() * 1.4);
      const [ex] = pt(a + 0.9 + R() * 1.2, -14);
      const rx = Math.abs(ex - cx);
      x.globalAlpha = kal ? 0.5 : 0.9;
      x.fillStyle = fas(lov[(R() * lov.length) | 0], '#060807', 0.4);
      x.beginPath();
      x.ellipse(cx, cy, rx, rx * (0.45 + R() * 0.3), 0, 0, 2 * Math.PI);
      x.fill();
    }
    x.globalAlpha = 1;
  }
  {
    for (const [ac, w, top] of TRAD) {
      for (let j = 0; j < 7; j++) {
        const a = ac + (R() - 0.5) * w;
        const t = top + R() * 0.9;
        const [cx, cy] = pt(a, t - 0.9 - R() * 0.4);
        const [, yt] = pt(a, t);
        const rr = Math.max(Math.abs(pt(a + w * (0.22 + R() * 0.14), t)[0] - cx), Math.abs(cy - yt) * 1.1);
        x.globalAlpha = kal ? 0.6 : 0.95;
        x.fillStyle = fas(lov[(R() * lov.length) | 0], '#070908', 0.45);
        x.beginPath();
        x.ellipse(cx, cy, rr, Math.abs(cy - yt), 0, 0, 2 * Math.PI);
        x.fill();
        // (stammen ned mot slänten)
        linje([[a, t - 1.2], [a, E.spar + 0.3]], fas('#2e2620', '#050505', 0.45), 2.5, kal ? 0.6 : 0.8);
        if (v.snotackt) {
          x.globalAlpha = kal ? 0.35 : 0.5;
          x.fillStyle = dis(sno, 0.45);
          x.beginPath();
          x.ellipse(cx, yt + Math.abs(cy - yt) * 0.35, rr * 0.8, Math.abs(cy - yt) * 0.3, 0, 0, 2 * Math.PI);
          x.fill();
        }
      }
    }
    x.globalAlpha = 1;
  }
  // spåren i skärningen, med kontaktledningen
  {
    const grus = v.snotackt ? dis(F.mix(sno, '#8c8c8c', 0.15), 0.2) : fas(v.blott ? '#3e3833' : '#4e4840', '#0d0c0b', 0.2);
    ruta(-46, 50, -22, E.spar, grus);
    const rals = fas('#3a322c', '#080706', 0.2);
    const syll = fas('#4a3a2c', '#080706', 0.2);
    for (const [e0, e1] of [[-16.45, -16.75], [-17.35, -17.7], [-18.4, -18.8]]) {
      for (let a = -46; a < 50; a += 0.42) ruta(a, a + 0.2, e1 - 0.06, e0 + 0.06, syll, 0.55);
      for (const e of [e0, e1]) {
        linje([[-46, e], [50, e]], rals, 3);
        if (L.dag > 0.2) linje([[-46, e + 0.03], [50, e + 0.03]], T('#b4b0a8'), 1.2, 0.6 * L.dag);
      }
    }
    // stängslet längs spåren
    const stang = fas('#4a4e4c', '#08090a', 0.25);
    linje([[-46, E.spar + 0.55], [50, E.spar + 0.55]], stang, 1.6, 0.8);
    for (let a = -46; a < 50; a += 1.3) linje([[a, E.spar], [a, E.spar + 0.6]], stang, 1.6, 0.8);
    const stolpe = fas('#3e4146', '#0a0b0d', 0.25);
    for (const a of [-30, -10, 10, 33]) {
      linje([[a, -18.5], [a, -13.4]], stolpe, 5);
      linje([[a, -13.55], [a + 1.6, -13.55]], stolpe, 3);
    }
    linje([[-46, -13.75], [50, -13.75]], stolpe, 1.6, 0.8);
  }

  // S:t Eriksbron: den gröna balken, räcket och lyktstolparna, från bortre änden vid tegelhuset fram till höger
  const lampor = [];
  {
    const { a0, a1 } = BRO;
    const top = (a) => bro(a, BRO.top);
    const under = (a) => bro(a, BRO.under);
    // skuggan under bron, på slänten och spåren
    yta([[a0, under(a0)], [a1, under(a1)], [a1, -24], [a0 + 3, -24]], '#000000', 0.42 * (0.3 + 0.7 * L.dag));
    // pelaren under bron
    const pa = 30.5;
    const pw = 1.6;
    ruta(pa - pw / 2, pa + pw / 2, -22, under(pa) + 0.1, fas('#625e57', '#0e0d0c', 0.3));
    ruta(pa + pw * 0.15, pa + pw / 2, -22, under(pa) + 0.1, '#000000', 0.18);
    // balken: ljusare upptill, i skugga nedtill
    const gron = fas('#356c4a', '#0b110e', 0.3);
    yta([[a0, top(a0)], [a1, top(a1)], [a1, under(a1)], [a0, under(a0)]], gron);
    const bal = [[a0, top(a0)], [a1, top(a1)], [a1, under(a1)], [a0, under(a0)]].map(([a, e]) => pt(a, e));
    // (närmast mörkare och nedtill i skugga; bortre änden ljusare av luften emellan)
    const g = x.createLinearGradient(bal[0][0], Math.min(bal[0][1], bal[1][1]), bal[1][0], bal[2][1]);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    g.addColorStop(0.35, 'rgba(0, 0, 0, 0.05)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    x.fillStyle = g;
    x.beginPath();
    bal.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.closePath();
    x.fill();
    // livarna på balkens sida, och underflänsen
    const liv = F.mix(gron, '#000000', 0.22);
    for (let a = a0 + 1.6; a < a1; a += 1.6 + (a - a0) * 0.1) linje([[a, top(a) - 0.5], [a, under(a)]], liv, 1.2 + (a - a0) * 0.1, 0.45);
    const fl = (a) => top(a) - (top(a) - under(a)) * 0.3;
    linje([[a0, fl(a0)], [a1, fl(a1)]], liv, 3, 0.6);
    linje([[a0, under(a0) + 0.04], [a1, under(a1) + 0.25]], F.mix(gron, '#000000', 0.45), 5 + 4 * (1 - L.dag));
    // kantbalken överst, och snö på den
    yta([[a0, top(a0)], [a1, top(a1)], [a1, top(a1) - 0.55], [a0, top(a0) - 0.05]], F.mix(gron, T('#c9d2c8'), 0.18));
    if (v.snotackt) linje([[a0, top(a0) + 0.02], [a1, top(a1) + 0.05]], dis(sno, 0.3), 4);
    // räcket: spjälor som blir ett glest galler på håll, och handledaren överst
    const rack = fas('#2f6243', '#080b0a', 0.3);
    const rh = (a) => bro(a, BRO.racke);
    for (let a = a0 + 0.15; a < a1; a += 0.22 + (a - a0) * 0.01) linje([[a, top(a)], [a, top(a) + rh(a)]], rack, 1.4 + (a - a0) * 0.09, 0.85);
    linje([[a0, top(a0) + rh(a0)], [a1, top(a1) + rh(a1)]], rack, 6);
    linje([[a0, top(a0) + rh(a0) * 0.12], [a1, top(a1) + rh(a1) * 0.12]], rack, 4);
    if (v.snotackt) linje([[a0, top(a0) + rh(a0) + 0.03], [a1, top(a1) + rh(a1) + 0.06]], dis(sno, 0.3), 3);
    // lyktstolparna
    const stolp = fas('#3c4741', '#0a0c0b', 0.3);
    for (const a of [23.6, 28.8, 35.2, 43.5]) {
      const h = 2.2 + (a - a0) * 0.15;
      const b0 = top(a);
      linje([[a, b0], [a, b0 + h]], stolp, 4.5 + (a - a0) * 0.25);
      linje([[a, b0 + h], [a - 0.35 - (a - a0) * 0.02, b0 + h + 0.08]], stolp, 3.5 + (a - a0) * 0.16);
      lampor.push([a - 0.4 - (a - a0) * 0.02, b0 + h + 0.02, 0.6 + (a - a0) * 0.04]);
    }
  }

  // oskärpan: det här är långt borta
  let ut = duk;
  if (FILTER) {
    const b2 = gammal && gammal.width === W && gammal.height === H ? gammal : document.createElement('canvas');
    b2.width = W;
    b2.height = H;
    const y = b2.getContext('2d');
    y.filter = `blur(${((ofokus * s) / 2).toFixed(2)}px)`;
    y.drawImage(duk, 0, 0);
    y.filter = 'none';
    ut = b2;
  }
  const u = ut.getContext('2d');
  const upt = pt;

  // dimma, regn och snö lägger sig över allt som ett dis
  if (L.dimma > 0.02) { u.globalAlpha = 0.3 * L.dimma; u.fillStyle = dimC; u.fillRect(0, 0, W, H); }
  if (v.fall) {
    u.globalAlpha = (v.fall === 'sno' ? 0.08 : 0.1) + 0.14 * v.mangd;
    u.fillStyle = v.fall === 'sno' ? sno : F.kall(L.sky[2], L, KH);
    u.fillRect(0, 0, W, H);
  }
  u.globalAlpha = 1;

  // ljusen på kvällen: lyktorna på bron, gatlyktorna på andra sidan och lampan på höghusets tak, som skivor
  // (så ser en lampa ut när den är oskarp)
  const skiva = (az, el, r, farg, alfa) => {
    const [cx, cy] = upt(az, el);
    const g = u.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, farg);
    g.addColorStop(0.7, farg);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    u.globalAlpha = alfa;
    u.fillStyle = g;
    u.beginPath();
    u.arc(cx, cy, r, 0, 2 * Math.PI);
    u.fill();
    u.globalAlpha = 1;
  };
  const r0 = Math.max(1.5, ofokus * s * 0.8);
  if (L.lampor) {
    const k = Math.min(1, (0.6 - L.dag) * 3) * (1 - 0.5 * L.dimma);
    for (const [a, e, st] of lampor) skiva(a, e, r0 * st, '#ffe4b8', 0.8 * k);
    for (let a = -44; a < 20; a += 3.4) skiva(a, E.strand - 0.1, r0 * 0.55, '#ffd29a', 0.55 * k);
    for (let a = 26; a < 48; a += 3.8) skiva(a, E.strand + 0.1, r0 * 0.5, '#ffd29a', 0.5 * k);
  }
  if (L.dag < 0.5) skiva(16.4, -6.15, r0 * 0.5, '#ff3b30', 0.9 * (1 - L.dag * 2));

  // det som faller, nära glaset och därför bara lite oskarpt
  if (v.fall === 'regn' || v.fall === 'blandat') {
    const n = Math.round((v.fall === 'blandat' ? 50 : 110) * v.mangd);
    const lut = Math.min(0.55, 0.08 + v.vind * 0.035);
    const Rr = rng(5);
    u.strokeStyle = '#c8d6f0';
    u.lineWidth = Math.max(0.6, s * 1.6);
    for (let i = 0; i < n; i++) {
      const px = Rr() * W;
      const py = Rr() * H * 0.75;
      const l = (14 + Rr() * 30) * s;
      u.globalAlpha = 0.05 + Rr() * 0.07;
      u.beginPath();
      u.moveTo(px, py);
      u.lineTo(px - l * lut, py + l);
      u.stroke();
    }
    u.globalAlpha = 1;
  }
  if (v.fall === 'sno' || v.fall === 'blandat') {
    const n = Math.round((v.fall === 'blandat' ? 60 : 150) * v.mangd);
    const Rr = rng(7);
    if (FILTER) u.filter = `blur(${Math.max(0.5, s * 1.4).toFixed(2)}px)`;
    u.fillStyle = '#f4f7fb';
    for (let i = 0; i < n; i++) {
      u.globalAlpha = 0.3 + Rr() * 0.4;
      u.beginPath();
      u.arc(Rr() * W, Rr() * H * 0.8, (1.5 + Rr() * 4.5) * s, 0, 2 * Math.PI);
      u.fill();
    }
    u.filter = 'none';
    u.globalAlpha = 1;
  }
  return ut;
}

// ---------- glaset ----------

// På väggens duk (W × H, bildens mått), innan väggen läggs ovanpå: lite smuts och mörkare nedtill som i
// skyltfönstret i rummet, rummets sken i glaset när det är mörkt ute, och – som i rummet (glas i rum-ute.js) –
// droppar efter regn, snö i nederkanten och frost i hörnen när det är kallare än −3°.
export function glas(x, v, L, lage, W, H) {
  const F = window.RumUte.farg;
  const sk = W / BAK[lage].W;
  const R = rng(17);
  const regn = v.fall === 'regn' || v.fall === 'blandat';
  for (const q of rutor(lage).map((r) => r.map(([a, b]) => [a * sk, b * sk]))) {
    x.save();
    x.beginPath();
    q.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
    x.closePath();
    x.clip();
    const ner = (q[0][1] + q[1][1]) / 2;
    const xs = q.map((p) => p[0]);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    x.fillStyle = 'rgba(255, 255, 255, 0.03)';
    x.fillRect(x0, 0, x1 - x0, ner);
    const g = x.createLinearGradient(0, ner - 40 * sk, 0, ner);
    g.addColorStop(0, 'rgba(42, 36, 24, 0)');
    g.addColorStop(1, 'rgba(42, 36, 24, 0.35)');
    x.fillStyle = g;
    x.fillRect(x0, ner - 40 * sk, x1 - x0, 40 * sk);
    // (när det är mörkt ute speglar glaset den varma baren)
    if (L.dag < 0.6) {
      x.fillStyle = `rgba(92, 60, 34, ${(0.2 * (1 - L.dag / 0.6)).toFixed(3)})`;
      x.fillRect(x0, 0, x1 - x0, ner);
    }
    const yta = (x1 - x0) * Math.min(ner, 300 * sk);
    const m = Math.round((regn ? 1 : v.blott ? 0.45 : 0) * yta / (3200 * sk * sk));
    for (let i = 0; i < m; i++) {
      const dx = x0 + R() * (x1 - x0);
      const dy = R() * ner;
      const r = (1.2 + R() * 3.2) * sk;
      if (regn && R() < 0.3) {
        x.strokeStyle = 'rgba(223, 232, 255, 0.08)';
        x.lineWidth = r * 0.8;
        x.beginPath();
        x.moveTo(dx, dy);
        x.lineTo(dx + (R() - 0.5) * 4 * sk, dy - (10 + R() * 40) * sk);
        x.stroke();
      }
      x.fillStyle = `rgba(223, 232, 255, ${(0.1 + R() * 0.12).toFixed(3)})`;
      x.beginPath();
      x.arc(dx, dy, r, 0, 2 * Math.PI);
      x.fill();
      x.fillStyle = 'rgba(255, 255, 255, 0.35)';
      x.beginPath();
      x.arc(dx - r * 0.3, dy - r * 0.3, r * 0.35, 0, 2 * Math.PI);
      x.fill();
    }
    if (v.snotackt && v.temp < 1.5) {
      x.fillStyle = F.kall(F.sno(L), L, F.KALL ? F.KALL.gata : 0.3);
      x.globalAlpha = 0.75;
      x.beginPath();
      x.moveTo(x0, ner);
      for (let a = x0; a <= x1; a += 12 * sk) x.lineTo(a, ner - (3 + R() * 4) * sk - (a - x0 < 30 * sk || x1 - a < 30 * sk ? 6 * sk : 0));
      x.lineTo(x1, ner);
      x.closePath();
      x.fill();
      x.globalAlpha = 1;
    }
    if (v.temp < -3) {
      const f = Math.min(1, (-3 - v.temp) / 10);
      for (const [cx, cy] of [q[0], q[1]]) {
        const rr = 70 * sk * (0.5 + f);
        const r = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
        r.addColorStop(0, 'rgba(238, 246, 255, 0.55)');
        r.addColorStop(0.6, 'rgba(238, 246, 255, 0.18)');
        r.addColorStop(1, 'rgba(238, 246, 255, 0)');
        x.globalAlpha = 0.5 + 0.4 * f;
        x.fillStyle = r;
        x.beginPath();
        x.arc(cx, cy, rr, 0, 2 * Math.PI);
        x.fill();
        x.globalAlpha = 1;
      }
    }
    x.restore();
  }
}

// ---------- någon på bron ----------

// Någon som går på bron då och då (bron i rum-hasse.js). Figuren ritas en gång, från sidan i två steg bredvid
// varandra, i utsiktens ljus och väder (paraply när det regnar, mössa när det är kallt), lika oskarp och i samma
// dis som det andra långt borta. Den går på gångbanan innanför räcket, som når till höften och som benen anas
// bakom. Vägen är fötternas plats längs bron i väggbildens bildpunkter och hur hög figuren är där (u från bortre
// änden vid tegelhuset till förbi bildens högra kant). Sidan låter figuren glida dit med en transform, så att inget
// ritas om medan den går.
// Hur hög figuren är mot räcket (BRO.racke), och hur högt över brons kant fötterna står: räcket i utsikten är
// ritat högre än ett riktigt, mot husen på andra sidan (en våning är en halv grad vid tegelhuset, där räcket är
// 0,3°), så en människa är bara lite högre än det. Gångbanan ligger bakom räcket och syns uppifrån, alltså lite
// högre i bilden än kanten.
const GANG = { hojd: 1.15, inne: 0.25 };
export function gangare(v, L, lage, R = Math.random) {
  const F = window.RumUte.farg;
  const { b, P } = projektion(lage);
  const KG = F.KALL ? F.KALL.gata : 0.3;
  const KH = F.KALL ? F.KALL.himmel : 0.4;
  const kv = Math.max(0, 1 - L.dag / 0.6) * 0.2;
  const ton = (dag, natt) => F.mix(F.mix(F.kall(F.facade(dag, natt, L), L, KG), '#000000', 0.15), '#5c3c22', kv);
  const steg = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const a = BRO.a0 + 0.8 + (42 - 0.8 - BRO.a0) * u ** 1.5;
    const rh = bro(a, BRO.racke);
    const fot = bro(a, BRO.top) + 0.04 + GANG.inne * rh;
    const [x, y] = P(a, fot + E.ned);
    const [, y2] = P(a, fot + GANG.hojd * rh + E.ned);
    steg.push([x, y, y - y2]);
  }
  // figuren: U bildpunkter hög, med plats för paraplyet ovanför och oskärpan runt om. Oskärpan är knappt hälften
  // av utsiktens (rita: ofokus / 2 i väggbildens bildpunkter) där figuren syns som störst i fönstren: lika oskarp
  // som bron blir den en fläck som man inte ser är en människa.
  const U = 60;
  const ofokus = (20 * b.S * SCEN.D) / (SCEN.D - 120);
  const sudd = Math.min(3.2, Math.max(1.6, (0.4 * (ofokus / 2) * U) / steg[14][2]));
  const pad = Math.ceil(Math.max(12, 3 * sudd));
  const B = Math.round(U * 0.55) + 2 * pad;
  const Hd = Math.round(U * 1.18) + 2 * pad;
  const duk = document.createElement('canvas');
  duk.width = 2 * B;
  duk.height = Hd;
  const x = duk.getContext('2d');
  const kall = v.kanns < 5;
  // (i mörkret lyser brons lyktor lite på den, så att man anar den mot det mörka)
  const rock = ton(kall ? ['#1c1f26', '#2b2f38', '#3a3226', '#20283a', '#5a2a2a', '#2e3a2e'][(R() * 6) | 0] : ['#6b6458', '#4a5a6a', '#8a4a3a', '#3a4a3a', '#7a6a4a'][(R() * 5) | 0], '#3a2e24');
  const byxor = ton('#22242a', '#241e19');
  const hud = ton('#c89878', '#5a4436');
  const regn = v.fall === 'regn' || v.fall === 'blandat';
  const mossa = !regn && v.temp < 3;
  const rack = ton('#2f6243', '#080b0a');
  // räcket: från fötterna upp till handledaren, i figurens mått
  const hoft = (1 - GANG.inne) / GANG.hojd;
  if (FILTER) x.filter = `blur(${sudd.toFixed(2)}px)`;
  for (let k = 0; k < 2; k++) {
    const cx = k * B + B / 2;
    const fy = Hd - pad;
    const y = (t) => fy - t * U;
    x.lineCap = 'round';
    // benen: isär i det första steget, ihop i det andra
    x.strokeStyle = byxor;
    x.lineWidth = U * 0.085;
    const isar = k ? 0.03 : 0.13;
    for (const d of [-isar, isar]) { x.beginPath(); x.moveTo(cx, y(0.47)); x.lineTo(cx + d * U, y(0.02)); x.stroke(); }
    // rocken och armarna
    x.fillStyle = rock;
    x.beginPath();
    x.moveTo(cx - U * 0.1, y(0.8));
    x.lineTo(cx + U * 0.1, y(0.8));
    x.lineTo(cx + U * 0.12, y(0.36));
    x.lineTo(cx - U * 0.12, y(0.36));
    x.closePath();
    x.fill();
    x.strokeStyle = rock;
    x.lineWidth = U * 0.06;
    x.beginPath(); x.moveTo(cx, y(0.76)); x.lineTo(cx + (k ? 0.03 : 0.09) * U, y(0.45)); x.stroke();
    // huvudet, och mössan eller paraplyet
    x.fillStyle = hud;
    x.beginPath(); x.arc(cx + U * 0.01, y(0.89), U * 0.075, 0, 2 * Math.PI); x.fill();
    if (mossa) { x.fillStyle = byxor; x.beginPath(); x.arc(cx + U * 0.01, y(0.91), U * 0.072, Math.PI, 2 * Math.PI); x.fill(); }
    if (regn) {
      x.strokeStyle = byxor;
      x.lineWidth = U * 0.02;
      x.beginPath(); x.moveTo(cx + U * 0.02, y(0.62)); x.lineTo(cx + U * 0.02, y(1.08)); x.stroke();
      x.fillStyle = ton(['#1c1f26', '#5a2a2a', '#20283a'][(R() * 3) | 0], '#2c241e');
      x.beginPath(); x.ellipse(cx + U * 0.02, y(1.06), U * 0.26, U * 0.1, 0, Math.PI, 2 * Math.PI); x.fill();
    }
    // räcket framför benen: mellan spjälorna anas de, och handledaren går över höften (bara på figuren)
    x.globalCompositeOperation = 'destination-out';
    x.globalAlpha = 0.3;
    x.fillRect(k * B, y(hoft), B, hoft * U + pad);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = rack;
    x.globalAlpha = 0.3;
    x.fillRect(k * B, y(hoft), B, hoft * U + pad);
    x.globalAlpha = 0.8;
    x.fillRect(k * B, y(hoft + 0.02), B, U * 0.05);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
  }
  x.filter = 'none';
  // samma dis som över bron och utsikten (rita: fas och dimman, regnet eller snön i luften), så att den inte
  // syns skarpare och mörkare än det som är lika långt bort
  const dimC = L.sky[2];
  const lager = (farg, a) => {
    if (a < 0.005) return;
    x.globalAlpha = Math.min(1, a);
    x.fillStyle = farg;
    x.fillRect(0, 0, duk.width, duk.height);
  };
  x.globalCompositeOperation = 'source-atop';
  lager(dimC, 0.3 * L.dimma);
  if (L.dimma > 0.02) lager(dimC, 0.3 * L.dimma);
  if (v.fall) lager(v.fall === 'sno' ? F.kall(F.sno(L), L, KG) : F.kall(L.sky[2], L, KH), (v.fall === 'sno' ? 0.08 : 0.1) + 0.14 * v.mangd);
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-over';
  return { duk, B, H: Hd, fot: [B / 2, Hd - pad], U, steg, mot: R() < 0.5 };
}
