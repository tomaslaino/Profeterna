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
//   fordon(v, L, lage, a, fil) → en bil eller buss i en fil på bron: sidan och fronten eller baken, och vägen
//   oskarpa(lage) → hur oskarp trafiken på bron är, i väggbildens bildpunkter (rum-hasse.js lägger den på hela duken)

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
  // (lyktorna på andra sidan, i dukens bildpunkter)
  const lampor2 = [];
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
    // körbanan bakom räcket, där trafiken går (TVAR, i samma mått som den, broPunkt): gångbanan, cykelbanorna,
    // filerna med mittlinjen och räcket på andra sidan, torr, blöt eller snöig som gatan i rummet
    {
      const bp = (u, sid, z = 0) => { const [px, py] = broPunkt(P, u, sid * METER, z); return [px * s, py * s]; };
      const US = [];
      for (let u = 0; u <= LINJE.L + 4; u += 0.5) US.push(u);
      // ett band längs bron, från sid0 till sid1 (meter innanför räcket) och z0 till z1 (räckeshöjder upp)
      const band = (sid0, sid1, fill, alfa = 1, z0 = 0, z1 = z0, us = US) => {
        x.beginPath();
        us.forEach((u, i) => { const [px, py] = bp(u, sid0, z0); if (i) x.lineTo(px, py); else x.moveTo(px, py); });
        for (let i = us.length - 1; i >= 0; i--) x.lineTo(...bp(us[i], sid1, z1));
        x.closePath();
        x.globalAlpha = alfa;
        x.fillStyle = fill;
        x.fill();
        x.globalAlpha = 1;
      };
      const blot = L.wet || v.blott;
      let gang = fas(blot ? '#7c7e82' : '#a19f99', blot ? '#2a2b30' : '#25262b', 0.3);
      let gata = fas(blot ? '#4e5054' : '#5b5d61', '#121318', 0.3);
      if (v.snotackt) { gang = dis(sno, 0.3); gata = F.mix(fas('#a3a9b0', '#262b36', 0.3), sno, 0.3); }
      const kant = F.mix(gang, '#000000', 0.3);
      const linjer = F.mix(gata, T('#e2e0da'), v.snotackt ? 0.15 : 0.35 + 0.25 * L.dag);
      band(0, TVAR.gang, gang);
      band(TVAR.gang, TVAR.gang2, gata);
      band(TVAR.gang2, TVAR.kant, gang);
      band(TVAR.gang - 0.15, TVAR.gang, kant, 0.8);
      band(TVAR.gang2, TVAR.gang2 + 0.15, kant, 0.8);
      // (cykelbanorna avskilda med en heldragen linje, mittlinjen streckad: 3 m streck och 9 m mellanrum)
      for (const sid of [TVAR.cykel, TVAR.cykel2]) band(sid - 0.08, sid + 0.08, linjer, 0.8);
      for (let m = 0; m < LINJE.L / METER; m += 12) band(TVAR.mitt - 0.08, TVAR.mitt + 0.08, linjer, 0.8, 0, 0, [m * METER, (m + 3) * METER]);
      if (blot && L.dag > 0.2) band(TVAR.gang, TVAR.gang2, F.kall(L.sky[1], L, KH), 0.18 * L.dag);
      // räcket på andra sidan: tätt på håll, så ett halvgenomskinligt band med handledaren överst
      const rack2 = fas('#2f6243', '#080b0a', 0.35);
      band(TVAR.kant, TVAR.kant, rack2, 0.45, 0, 1);
      band(TVAR.kant, TVAR.kant, rack2, 0.9, 0.92, 1);
      band(TVAR.kant, TVAR.kant, rack2, 0.7, 0.08, 0.14);
      if (v.snotackt) band(TVAR.kant, TVAR.kant, dis(sno, 0.3), 0.9, 1, 1.05);
      // lyktstolparna på andra sidan, mitt emot dem på den här (6 m höga, med armen ut över körbanan)
      const stolp2 = fas('#3c4741', '#0a0c0b', 0.35);
      for (const a of [23.6, 28.8, 35.2, 43.5]) {
        const u = langs(a);
        const fot = bp(u, TVAR.kant - 0.3);
        const topp = bp(u, TVAR.kant - 0.3, 4);
        const arm = bp(u, TVAR.kant - 1.8, 4.05);
        const m = Math.hypot(topp[0] - fot[0], topp[1] - fot[1]) / 4;
        x.strokeStyle = stolp2;
        x.lineCap = 'round';
        x.lineWidth = Math.max(0.6, m * 0.09);
        x.beginPath(); x.moveTo(...fot); x.lineTo(...topp); x.lineTo(...arm); x.stroke();
        // (oskarpa som lyktorna på den här sidan, lite mindre)
        lampor2.push([arm[0], arm[1] + m * 0.04, 0.5 + (a - BRO.a0) * 0.03]);
      }
      x.lineCap = 'butt';
    }
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
  const skiva = (az, el, r, farg, alfa, px) => {
    const [cx, cy] = px || upt(az, el);
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
    for (const [px, py, st] of lampor2) skiva(0, 0, r0 * st, '#ffe4b8', 0.6 * k, [px, py]);
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

// ---------- trafikens oskärpa ----------

// Hur oskarp trafiken på bron är (väggbildens bildpunkter): nästan som utsikten (rita: ofokus / 2), som bilarna
// och de som går på gatan i rummet är nästan lika oskarpa som stan bakom dem (rum-ute.css). Den läggs på hela
// trafikens duk (rum-hasse.js), så att den är lika stor längs hela bron: bakad i varje figur krympte den med
// figuren, och längst bort var bilarna nästan skarpa (ändrat 2026-11-16; förut knappt en sjättedel av utsiktens).
// I figurerna och fordonen själva bara BAKAD, så att kanterna inte blir hackiga.
const OSKARPA = 0.8;
const BAKAD = 0.6;
export function oskarpa(lage) {
  const { b } = projektion(lage);
  return (OSKARPA * (20 * b.S * SCEN.D)) / (SCEN.D - 120) / 2;
}

// ---------- någon på bron ----------

// Någon som går på bron då och då (bron i rum-hasse.js). Figuren ritas en gång, från sidan i två steg bredvid
// varandra, i utsiktens ljus och väder (paraply när det regnar, mössa när det är kallt), lika oskarp och i samma
// dis som det andra långt borta. Den går på gångbanan innanför räcket, som når till höften och som benen anas
// bakom. Vägen är fötternas plats längs bron i väggbildens bildpunkter och hur hög figuren är där (u från bortre
// änden vid tegelhuset till förbi bildens högra kant). Sidan lägger figuren där i trafikens duk (broRita i
// rum-hasse.js), utan att rita om den.
// Hur hög figuren är mot räcket (BRO.racke), och hur långt innanför räcket den går (meter): räcket i utsikten är
// ritat högre än ett riktigt, mot husen på andra sidan (en våning är en halv grad vid tegelhuset, där räcket är
// 0,3°), så en människa är bara lite högre än det. Gångbanan ligger bakom räcket och syns uppifrån, alltså lite
// högre i bilden än kanten (LUTA).
const GANG = { hojd: 1.15, sid: 1.35 };
export function gangare(v, L, lage, R = Math.random) {
  const F = window.RumUte.farg;
  const { P } = projektion(lage);
  const KG = F.KALL ? F.KALL.gata : 0.3;
  const KH = F.KALL ? F.KALL.himmel : 0.4;
  const kv = Math.max(0, 1 - L.dag / 0.6) * 0.2;
  const ton = (dag, natt) => F.mix(F.mix(F.kall(F.facade(dag, natt, L), L, KG), '#000000', 0.15), '#5c3c22', kv);
  const steg = gangVag(P);
  // figuren: U bildpunkter hög, med plats för paraplyet ovanför och oskärpan runt om. I figuren bara en aning
  // (BAKAD där den syns som störst i fönstren); resten läggs på hela trafiken när den ritas (oskarpa).
  const U = 60;
  const sudd = (BAKAD * U) / steg[14][2];
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
  const hoft = (1 - LUTA * GANG.sid * METER) / GANG.hojd;
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

// ---------- trafiken på bron ----------

// Bron som en rak linje på marken, uträknad ur räcket som utsikten ritar det (BRO.racke: räckets höjd i grader
// ger avståndet dit, i räckeshöjder): från bortre änden A vid tegelhuset fram till bildens högra kant. En punkt
// s räckeshöjder från A, sid innanför räcket och z upp från körbanan hamnar där broPunkt säger, med samma kant och
// samma räcke som i utsikten. Det som ligger längre in på bron syns uppifrån och hamnar högre (LUTA, i
// räckeshöjder på en räckeshöjd inåt): ungefär som man ser bron härifrån, så att körbanan syns som en smal yta
// bakom räcket och det som kör där står på den, bakom dem som går närmast. Förut 0,28, nästan dubbelt så mycket,
// och då svävade bilarna i den bortre filen långt ovanför räcket när körbanan inte syntes, i mörker och regn
// (ändrat 2026-11-16). En meter är METER räckeshöjder (den som går är 1,75 m).
const METER = GANG.hojd / 1.75;
const LUTA = 0.16;
// (fordonen själva, från sida till sida: så lite som man ser dem uppifrån när man tittar längs bron)
const FLUTA = 0.1;
const LINJE = (() => {
  const g = (az) => { const d = 1 / Math.tan(bro(az, BRO.racke) * DEG); return [d * Math.sin(az * DEG), d * Math.cos(az * DEG)]; };
  const A = g(BRO.a0);
  const B = g(BRO.a1);
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const ax = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
  // (inåt på bron: bort från en)
  const n = -ax[1] * A[0] + ax[0] * A[1] > 0 ? [-ax[1], ax[0]] : [ax[1], -ax[0]];
  return { A, L, ax, n };
})();
function broPunkt(P, s, sid, z) {
  const { A, ax, n } = LINJE;
  const q = [A[0] + ax[0] * s + n[0] * sid, A[1] + ax[1] * s + n[1] * sid];
  const az = Math.atan2(q[0], q[1]) / DEG;
  const r = Math.atan(1 / Math.hypot(q[0], q[1])) / DEG;
  return P(az, bro(az, BRO.top) + 0.04 + (LUTA * sid + z) * r + E.ned);
}

// Fötternas väg för den som går (gangare): 21 steg från bortre änden till förbi bildens högra kant, på gångbanan
// GANG.sid meter innanför räcket, i samma mått som trafiken (broPunkt), så att den som går står på
// gångbanan bredvid cyklisterna och bilarna och inte i deras väg. → [x, y, figurens höjd] i väggbildens bildpunkter
// hur långt ut på bron räcket står i riktningen az (grader)
function langs(az) {
  const { A, ax } = LINJE;
  const d = [Math.sin(az * DEG), Math.cos(az * DEG)];
  return -(A[0] * d[1] - A[1] * d[0]) / (ax[0] * d[1] - ax[1] * d[0]);
}
function gangVag(P) {
  const sid = GANG.sid * METER;
  const ut = [];
  for (let i = 0; i <= 20; i++) {
    const u = langs(BRO.a0 + 0.8 + (42 - 0.8 - BRO.a0) * (i / 20) ** 1.5);
    const [x, y] = broPunkt(P, u, sid, 0);
    const [, y2] = broPunkt(P, u, sid, GANG.hojd);
    ut.push([x, y, y - y2]);
  }
  return ut;
}

// Brons tvärsnitt (meter innanför räcket): gångbanan till gang, cykelbanan till cykel, filerna med mittlinjen
// vid mitt, cykelbanan från cykel2 och gångbanan från gang2 bort till räcket på andra sidan vid kant
const TVAR = { gang: 2.4, cykel: 3.5, mitt: 6.2, cykel2: 8.9, gang2: 10.3, kant: 12.6 };

// Körfälten (mitten, meter innanför räcket). Man sitter på brons östra sida och ser söderut mot Kungsholmen:
// i den närmaste filen kommer bilarna mot en, i den bortre åker de bort (högertrafik). Cykelbanorna ligger
// utanför, mellan gångbanan och körbanan: i den närmaste kommer cyklisterna mot en, på andra sidan åker de bort.
// lag: i vilken ordning de ritas, de bortersta först (de som går är alltid främst).
export const FIL = [
  { sid: 4.6, bort: false, lag: 2 },
  { sid: 7.8, bort: true, lag: 1 },
  { sid: 2.9, bort: false, lag: 3, cykel: true },
  { sid: 9.6, bort: true, lag: 0, cykel: true },
];
// Filens väg i väggbildens bildpunkter, var fjärdedels räckeshöjd: körbanan, en räckeshöjd uppåt och en inåt
const BANA = {};
function bana(lage, fil) {
  const k = `${lage}:${fil}`;
  if (BANA[k]) return BANA[k];
  const { P } = projektion(lage);
  const sid = FIL[fil].sid * METER;
  const ds = 0.25;
  const n = Math.ceil((LINJE.L + 30) / ds);
  const p = new Float64Array(6 * (n + 1));
  for (let i = 0; i <= n; i++) {
    const [bx, by] = broPunkt(P, i * ds, sid, 0);
    const [ux, uy] = broPunkt(P, i * ds, sid, 1);
    const [ix, iy] = broPunkt(P, i * ds, sid + 1, 0);
    p.set([bx, by, ux - bx, uy - by, ix - bx, iy - by], 6 * i);
  }
  return (BANA[k] = { p, ds, n });
}
function vid(B, s) {
  const t = Math.max(0, Math.min(B.n - 1e-6, s / B.ds));
  const i = Math.floor(t);
  const f = t - i;
  const o = [];
  for (let j = 0; j < 6; j++) o.push(B.p[6 * i + j] * (1 - f) + B.p[6 * i + 6 + j] * f);
  return o;
}

// Fordonens mått (rummets former, FORM i rum-ute.js, där en meter är 16 enheter): bakre och främre änden, taket
// (med takräcket och taxiskylten) och bredden i meter.
function matt(a, FORM) {
  const F = FORM[a.kind];
  const buss = a.kind === 'buss' || a.kind === 'ledbuss';
  const top = buss ? -54 : (F.rack ? F.tak - 1.8 : F.tak) - (a.taxi ? 4.4 : 0);
  return { F, buss, b: F.b, f: F.f, top, w: buss ? 2.55 : a.kind === 'skap' ? 1.95 : a.kind === 'suv' ? 1.9 : 1.8 };
}

// (rundade hörn där det finns, annars raka: äldre Safari)
const rund4 = (x, X, Y, w, h, r) => (x.roundRect ? x.roundRect(X, Y, w, h, r) : x.rect(X, Y, w, h));

// En affin avbildning (CSS matrix) som lägger duken (x0–x1, y0 överst, y1 nederst) med nedre vänstra hörnet i p,
// nedre högra i q och kanten uppåt längs u
function affin(x0, x1, y0, y1, p, q, u) {
  const a = (q[0] - p[0]) / (x1 - x0);
  const b = (q[1] - p[1]) / (x1 - x0);
  const c = -u[0] / (y1 - y0);
  const d = -u[1] / (y1 - y0);
  return [a, b, c, d, p[0] - a * x0 - c * y1, p[1] - b * x0 - d * y1];
}

// Färgerna i utsiktens ljus, som för den som går (lyktorna och de tända rutorna lyser själva), och räckets färg
function ljus(v, L) {
  const F = window.RumUte.farg;
  const KG = F.KALL ? F.KALL.gata : 0.3;
  const KH = F.KALL ? F.KALL.himmel : 0.4;
  const kv = Math.max(0, 1 - L.dag / 0.6) * 0.2;
  const ton = (c, natt = F.mix(c, '#07080b', 0.85)) => F.mix(F.mix(F.kall(F.facade(c, natt, L), L, KG), '#000000', 0.15), '#5c3c22', kv);
  return { F, KG, KH, ton, lampor: L.lampor || L.dimma > 0.4, rack: ton('#2f6243', '#080b0a') };
}
const ruta = (x, X, Y, w, h, c, alfa = 1) => { x.globalAlpha = alfa; x.fillStyle = c; x.fillRect(X, Y, w, h); x.globalAlpha = 1; };
const sken = (x, X, Y, r, c, alfa) => {
  const g = x.createRadialGradient(X, Y, 0, X, Y, r);
  g.addColorStop(0, c);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  x.globalAlpha = alfa;
  x.fillStyle = g;
  x.beginPath();
  x.arc(X, Y, r, 0, 2 * Math.PI);
  x.fill();
  x.globalAlpha = 1;
};
// Räcket framför det som är nedanför yr (i dukens bildpunkter, k på en av rummets enheter), dimman och det som
// faller över hela duken, och sedan oskärpan igen för lyktorna som ritas ovanpå
function framfor(x, C, v, L, yr, k, sudd) {
  const { F, KG, KH, rack } = C;
  const Wd = x.canvas.width;
  const Hd = x.canvas.height;
  const dimC = L.sky[2];
  x.filter = 'none';
  x.globalCompositeOperation = 'destination-out';
  ruta(x, 0, yr, Wd, Hd - yr, '#000', 0.3);
  x.globalCompositeOperation = 'source-atop';
  ruta(x, 0, yr, Wd, Hd - yr, rack, 0.3);
  ruta(x, 0, yr - 1.5 * k, Wd, 2.6 * k, rack, 0.8);
  if (L.dimma > 0.02) { ruta(x, 0, 0, Wd, Hd, dimC, 0.3 * L.dimma); ruta(x, 0, 0, Wd, Hd, dimC, 0.3 * L.dimma); }
  if (v.fall) ruta(x, 0, 0, Wd, Hd, v.fall === 'sno' ? F.kall(F.sno(L), L, KG) : F.kall(L.sky[2], L, KH), (v.fall === 'sno' ? 0.08 : 0.1) + 0.14 * v.mangd);
  x.globalCompositeOperation = 'source-over';
  if (FILTER) x.filter = `blur(${sudd.toFixed(2)}px)`;
}

// Fordonets ovansida från bakre till främre änden (rummets former, FORM i rum-ute.js): höjden över marken längs
// karossens överkant, i raka bitar som var och en är plåt eller glas (vindrutan och bakrutan, som lutar och sitter
// ovanför listen under sidorutorna). Bussarna har ett platt tak. → [[x0, h0, x1, h1, glas], ...] i rummets enheter
const TOPP = {};
function forenkla(p, tol) {
  if (p.length < 3) return p;
  const a = p[0];
  const b = p[p.length - 1];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let i0 = 0;
  let d0 = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - p[i][1]) - (a[0] - p[i][0]) * (b[1] - a[1])) / l;
    if (d > d0) { d0 = d; i0 = i; }
  }
  return d0 > tol ? [...forenkla(p.slice(0, i0 + 1), tol).slice(0, -1), ...forenkla(p.slice(i0), tol)] : [a, b];
}
function topp(kind, F2) {
  if (TOPP[kind]) return TOPP[kind];
  if (!F2.kaross) return (TOPP[kind] = [[F2.b, 51, F2.f, 51, false]]);
  const c = document.createElement('canvas').getContext('2d');
  const P2 = new Path2D(F2.kaross);
  const pts = [];
  for (let i = 0, n = Math.ceil(F2.f - F2.b); i <= n; i++) {
    const X = F2.b + 0.3 + ((F2.f - F2.b - 0.6) * i) / n;
    // (överkanten: ovanför är utanför, nere vid tröskeln innanför)
    let lo = -60;
    let hi = -8;
    for (let j = 0; j < 12; j++) { const m = (lo + hi) / 2; if (c.isPointInPath(P2, X, m)) hi = m; else lo = m; }
    pts.push([X, -hi]);
  }
  const belt = -F2.lin[0];
  const runs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p, q] = [pts[i], pts[i + 1]];
    const g = (p[1] + q[1]) / 2 > belt + 0.3 && Math.abs((q[1] - p[1]) / (q[0] - p[0])) > 0.22;
    const r = runs[runs.length - 1];
    if (r && r.g === g) r.p.push(q); else runs.push({ g, p: [p, q] });
  }
  const ut = [];
  for (const r of runs) {
    const q = forenkla(r.p, 0.8);
    for (let i = 0; i < q.length - 1; i++) ut.push([q[i][0], q[i][1], q[i + 1][0], q[i + 1][1], r.g]);
  }
  return (TOPP[kind] = ut);
}

// Ett fordon a (en bil ur RumUte.trafik.bil, eller { kind: 'buss' | 'ledbuss', c, nr }) i filen fil, i utsiktens
// ljus och väder. Det syns från sidan, i den ände som är närmast en framifrån (de som kommer mot en, med
// strålkastarna) eller bakifrån (de som åker bort, med baklyktorna), och lite uppifrån: taket, rutorna och
// motorhuven eller bagageluckan. Var och en är en duk som ritas en gång och läggs längs bron med en affin
// avbildning (vid), så att de möts som på en riktig kaross. Räcket står framför det nedersta, som framför den som
// går, och allt är lika oskarpt och i samma dis. vag: vägen i meter, från bortre änden till förbi bildens högra
// kant, och meter: fordonets längd.
export function fordon(v, L, lage, a, fil) {
  const C = ljus(v, L);
  const { F, KG, KH, ton, lampor, rack } = C;
  const FORM = window.RumUte.trafik.FORM;
  const M = matt(a, FORM);
  const { b: B0, f: F0, top: TOP, buss } = M;
  const bort = FIL[fil].bort;
  const len = ((F0 - B0) / 16) * METER;
  const hU = (-TOP / 16) * METER;
  const wU = M.w * METER;
  const vag = bana(lage, fil);
  const W = BAK[lage].W;
  // nedre hörnet på den närmaste sidan vid s, och vektorerna uppåt och inåt där
  const at = (s) => { const q = vid(vag, s); return [q[0] - (q[4] * wU) / 2, q[1] - (q[5] * wU) / 2, q[2], q[3], q[4], q[5]]; };
  const lage4 = (s) => {
    const fj = at(s - len / 2);
    const nr = at(s + len / 2);
    return { r0: [fj[0], fj[1]], r1: [nr[0], nr[1]], up: [nr[2] * hU, nr[3] * hU], in: [nr[4] * wU, nr[5] * wU] };
  };
  // vägen: tills hela fordonet är förbi bildens högra kant
  let sEnd = len;
  while (sEnd < LINJE.L + 25 && lage4(sEnd).r0[0] < W + 12) sEnd += 1;

  // dukarna: k bildpunkter på en av rummets enheter, med plats för oskärpan och lyktornas sken. I dukarna bara
  // en aning oskärpa (BAKAD där fordonet syns som störst); resten läggs på hela trafiken när den ritas (oskarpa).
  const k = 1.2;
  const nara = lage4(Math.min(sEnd, LINJE.L) * 0.88);
  const sudd = (BAKAD * -TOP * k) / Math.hypot(...nara.up);
  const pad = Math.ceil(3 * sudd + 10 * k);
  const ws = (M.w * 16);
  const sida = document.createElement('canvas');
  sida.width = Math.ceil((F0 - B0) * k + 2 * pad);
  sida.height = Math.ceil(-TOP * k + 2 * pad);
  const ande = document.createElement('canvas');
  ande.width = Math.ceil(ws * k + 2 * pad);
  ande.height = sida.height;
  const y1 = pad - TOP * k;

  const kropp = ton(a.c || '#e07a1a');
  const mork = F.mix(kropp, '#000000', 0.38);
  const glas = lampor ? '#141210' : F.mix(ton('#151b22', '#050607'), F.kall(L.sky[2], L, KH), 0.35 * L.dag);
  // (bussens rutor tända på kvällen, dämpat: de är långt borta)
  const tand = '#d9c48e';
  const svart = ton('#121418', '#050505');
  const hjul = ton('#141518', '#040404');
  // räcket når så här högt upp på fordonet (av dess höjd)
  const racket = Math.max(0, Math.min(1, (1 - 0.04 - LUTA * (FIL[fil].sid - M.w / 2) * METER) / hU));

  // räcket framför, dimman och det som faller över, sedan lyktorna ovanpå
  const efter = (x) => framfor(x, C, v, L, y1 + TOP * k * racket, k, sudd);
  // (fogarna mellan bitarna: var bit fortsätter en bit in under den som ritas efter, så att oskärpan på båda inte
  // lämnar en ljus springa mellan dem och de ser ut som kort; i rummets enheter och i dukens bildpunkter)
  const fog = (2.5 * sudd) / k;
  const fogK = 2.5 * sudd;

  // från sidan, vänd åt det håll det åker (rummets former)
  {
    const x = sida.getContext('2d');
    const ox = pad - B0 * k;
    if (bort) x.setTransform(-k, 0, 0, k, pad + F0 * k, y1); else x.setTransform(k, 0, 0, k, ox, y1);
    if (FILTER) x.filter = `blur(${sudd.toFixed(2)}px)`;
    const F2 = M.F;
    // skuggan på körbanan, som under fordonen på gatan
    x.globalAlpha = 0.35;
    x.fillStyle = '#000000';
    x.beginPath();
    x.ellipse((B0 + F0) / 2, -0.6, (F0 - B0) / 2 + 1.5, 2.4, 0, 0, 2 * Math.PI);
    x.fill();
    x.globalAlpha = 1;
    // underredet mellan hjulen, i skugga
    ruta(x, B0 + 4, buss ? -6 : -5, F0 - B0 - 8, buss ? 5 : 4, svart);
    const rund = (r) => { for (const hx of F2.hj) { x.fillStyle = hjul; x.beginPath(); x.arc(hx, -r, r, 0, 2 * Math.PI); x.fill(); x.fillStyle = ton('#5a5e64', '#101012'); x.beginPath(); x.arc(hx, -r, r * 0.5, 0, 2 * Math.PI); x.fill(); } };
    if (buss) {
      const kjol = F.mix(kropp, '#000000', 0.45);
      const ru = lampor ? tand : glas;
      const ra = lampor ? 0.55 : 1;
      const del = (x0, x1, fram, bak, dorrar, rutor, tak) => {
        x.fillStyle = kropp;
        x.beginPath();
        rund4(x, x0, -51, x1 - x0, 46, [bak ? 4 : 0, fram ? 6 : 0, 2, 2]);
        x.fill();
        ruta(x, x0, -11, x1 - x0, 6, kjol);
        ruta(x, x0 + 3, -46.5, x1 - x0 - (fram ? 7 : 4), 20.5, svart);
        for (const [r0, r2] of rutor) ruta(x, r0, -45.5, r2 - r0, 18.5, ru, ra);
        for (const [d0, d1] of dorrar) { ruta(x, d0 - 1, -47, d1 - d0 + 2, 38.5, svart); ruta(x, d0, -46, d1 - d0, 36.5, ru, ra); }
        for (const [tx, tw] of tak) ruta(x, tx, -54, tw, 3.4, ton('#b9bdc2'));
        if (fram) { ruta(x, x1 - 36, -50.3, 18, 3.6, '#140d02'); ruta(x, x1 - 33, -49.4, 12, 1.8, '#ffb02a', 0.85); }
      };
      if (a.kind === 'buss') del(-96, 97.5, true, true, [[-82, -70], [4, 18], [78, 92]], [[-93, -84], [-68, -48], [-46, -26], [-24, 2], [20, 38], [40, 58], [60, 76]], [[-60, 64], [20, 30]]);
      else {
        del(-144, -21, false, true, [[-62, -48]], [[-141, -121], [-119, -99], [-97, -77], [-75, -64], [-46, -24]], [[-110, 50]]);
        ruta(x, -21.5, -49.5, 11, 43, ton('#1a1b1e', '#050505'));
        del(-11, 145.5, true, false, [[52, 66], [124, 138]], [[-8, 10], [12, 30], [32, 50], [68, 86], [88, 106], [108, 122]], [[0, 56], [80, 26]]);
      }
      rund(F2.r);
    } else {
      x.fillStyle = kropp;
      x.fill(new Path2D(F2.kaross));
      x.strokeStyle = mork;
      x.lineWidth = a.kind === 'suv' ? 4.4 : 2.6;
      x.beginPath(); x.moveTo(B0 + 2.5, a.kind === 'suv' ? -7.5 : -6); x.lineTo(F0 - 2.5, a.kind === 'suv' ? -7.5 : -6); x.stroke();
      x.fillStyle = glas;
      x.fill(new Path2D(F2.rutor));
      // (taket ljusare: det syns lite uppifrån och speglar himlen)
      x.strokeStyle = F.mix(kropp, F.kall(L.sky[1], L, KH), 0.35 * L.dag);
      x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(B0 + 8, F2.tak + 0.6); x.lineTo(F0 - 24, F2.tak + 0.6); x.stroke();
      if (a.taxi) ruta(x, a.kind === 'kombi' ? -18 : -8, F2.tak - 4.2, 11, 4.2, lampor ? '#ffe88a' : ton('#e8c43a'));
      rund(F2.r);
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    efter(x);
    if (bort) x.setTransform(-k, 0, 0, k, pad + F0 * k, y1); else x.setTransform(k, 0, 0, k, ox, y1);
    const [fy, by] = M.F.ly;
    ruta(x, F0 - 2.2, fy - 1.4, 2.4, 2.8, '#fbf8ec');
    if (lampor) { sken(x, F0, fy, 9, 'rgba(255, 242, 204, 0.9)', 0.5); sken(x, B0 + 1, by, 7, 'rgba(255, 59, 48, 0.9)', 0.45); ruta(x, B0 - 0.2, by - 1.8, 2, 3.6, '#ff4a3a'); }
    else ruta(x, B0 - 0.2, by - 1.8, 2, 3.6, ton('#9a1c16'));
    x.filter = 'none';
  }

  // framifrån (kommer mot en) eller bakifrån (åker bort), med den närmaste sidan till vänster: bussarna hela vägen
  // upp, bilarna bara upp till där ovansidan tar vid (nosen fram, bagageluckan eller bakluckan bak)
  const ovan = topp(a.kind, M.F);
  const he = buss ? 51 : bort ? ovan[0][1] : ovan[ovan.length - 1][3];
  {
    const x = ande.getContext('2d');
    x.setTransform(k, 0, 0, k, pad, y1);
    if (FILTER) x.filter = `blur(${sudd.toFixed(2)}px)`;
    x.globalAlpha = 0.35;
    x.fillStyle = '#000000';
    x.beginPath();
    x.ellipse(ws / 2, -0.6, ws / 2 + 1.5, 2.4, 0, 0, 2 * Math.PI);
    x.fill();
    x.globalAlpha = 1;
    const fram = !bort;
    const lyk = [];
    if (buss) {
      x.fillStyle = kropp;
      x.beginPath(); rund4(x, 0, -51, ws, 46, [4, 4, 1.5, 1.5]); x.fill();
      ruta(x, -fog, -49, fog + 2, 38, kropp);
      ruta(x, -fog, -11, ws + fog, 6, F.mix(kropp, '#000000', 0.45));
      ruta(x, 3, -54, ws - 6, 3, ton('#b9bdc2'));
      if (fram) {
        ruta(x, 1.5, -44, ws - 3, 30, glas);
        if (lampor) ruta(x, 1.5, -44, ws - 3, 30, tand, 0.35);
        ruta(x, 3, -50, ws - 6, 4.6, '#140d02');
        x.font = 'bold 5px monospace';
        x.textAlign = 'center';
        x.fillStyle = '#ffb02a';
        x.fillText(a.nr || '', ws / 2, -46.2);
        lyk.push([4, -11.5, 'v'], [ws - 4, -11.5, 'v']);
      } else {
        ruta(x, 4, -46, ws - 8, 12, glas);
        ruta(x, ws / 2 - 9, -26, 18, 14, svart);
        lyk.push([2, -18, 'r'], [ws - 2, -18, 'r']);
      }
      ruta(x, 1, -5.5, ws - 2, 4.5, svart);
      for (const hx of [3.5, ws - 3.5]) ruta(x, hx - 2.5, -7.4, 5, 7.4, hjul);
    } else {
      const F2 = M.F;
      const belt = F2.lin[0];
      ruta(x, 1, -5, ws - 2, 4, svart);
      for (const hx of [3.5, ws - 3.5]) ruta(x, hx - 2.2, -F2.r * 1.4, 4.4, F2.r * 1.4, hjul);
      x.fillStyle = kropp;
      x.beginPath(); rund4(x, 0, -he, ws, he - 4, [2.5, 2.5, 1.5, 1.5]); x.fill();
      ruta(x, -fog, -he + 2, fog + 2, he - 10, kropp);
      // (bakrutan, där bakänden är hög: kombin, suven, halvkombin och skåpbilen)
      if (bort && belt + he - 1 > 2) ruta(x, 3, -he + 2, ws - 6, belt + he - 1, glas);
      ruta(x, 1 - fog, -8, ws - 2 + fog, 3, F.mix(kropp, '#000000', 0.45));
      ruta(x, ws / 2 - 4, -10.5, 8, 2.2, ton('#e8e6dc'));
      const ly = Math.max(F2.ly[fram ? 0 : 1], -he + 2.2);
      if (fram) { ruta(x, ws * 0.3, ly - 1, ws * 0.4, 3.4, svart); lyk.push([3.2, ly, 'v'], [ws - 3.2, ly, 'v']); }
      else lyk.push([2.2, ly, 'r'], [ws - 2.2, ly, 'r']);
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    // (änden lite mörkare än sidan, så att hörnet mellan dem syns)
    x.filter = 'none';
    x.globalCompositeOperation = 'source-atop';
    ruta(x, 0, 0, ande.width, ande.height, '#000000', 0.12);
    x.globalCompositeOperation = 'source-over';
    efter(x);
    x.setTransform(k, 0, 0, k, pad, y1);
    for (const [lx, ly, s] of lyk) {
      if (s === 'v') {
        ruta(x, lx - 2.4, ly - 1.4, 4.8, 2.8, '#fbf8ec');
        if (lampor) sken(x, lx, ly, 10, 'rgba(255, 244, 214, 0.95)', 0.6);
        else sken(x, lx, ly, 3.5, 'rgba(255, 251, 232, 0.9)', 0.35);
      } else {
        ruta(x, lx - 1.6, ly - (buss ? 6 : 1.6), 3.2, buss ? 12 : 3.2, lampor ? '#ff4a3a' : ton('#9a1c16'));
        if (lampor) sken(x, lx, ly, 8, 'rgba(255, 59, 48, 0.9)', 0.5);
      }
    }
    x.filter = 'none';
  }

  // ovansidan i raka bitar (topp): plåten och rutorna, i samma oskärpa och dis, en duk för varje bit; den bortre
  // kanten smalare där rutorna sitter, och kanterna mot sidan, fronten och de andra bitarna en bit in under dem
  const plat = buss ? F.mix(kropp, ton('#c9ccd0'), 0.55) : F.mix(kropp, F.kall(L.sky[1], L, KH), 0.3 * L.dag);
  const glasT = F.mix(glas, F.kall(L.sky[1], L, KH), 0.25 * L.dag);
  const qpad = Math.ceil(3 * sudd + fogK + 2);
  const ytor = ovan.map(([x0, h0, x1, h1, g], i) => {
    const lang = Math.hypot(x1 - x0, h1 - h0) * k;
    const z1 = ws - (g || (!buss && Math.min(h0, h1) > -M.F.lin[0] + 0.5) ? (a.kind === 'skap' ? 1 : 3.5) : 0);
    const c = document.createElement('canvas');
    c.width = Math.ceil(lang + 2 * qpad);
    c.height = Math.ceil(z1 * k + 2 * qpad);
    const x = c.getContext('2d');
    if (FILTER) x.filter = `blur(${sudd.toFixed(2)}px)`;
    // (fogen bara mot bitarna bredvid och sidan, inte ut förbi fordonets ändar)
    const f0 = i ? fogK : 0;
    const f1 = i < ovan.length - 1 ? fogK : 0;
    ruta(x, qpad - f0, qpad, lang + f0 + f1, z1 * k + fogK, g ? glasT : plat);
    x.filter = 'none';
    framfor(x, C, v, L, c.height + 20, k, sudd);
    x.filter = 'none';
    // (det som är plant syns uppifrån, det som lutar bara när det lutar bort från en: vindrutan och motorhuven på
    // den som kommer mot en, bakrutan och bagageluckan på den som åker bort –
    // och inte det som skyms av något högre som är närmare en, som bagageluckan bakom kupén)
    const nara = ovan.filter((q) => (bort ? q[2] <= x0 : q[0] >= x1));
    const skyms = nara.some((q) => Math.max(q[1], q[3]) > Math.min(h0, h1) + 1);
    const syns = !skyms && (Math.abs(h1 - h0) < 0.15 * Math.abs(x1 - x0) || (bort ? h1 > h0 : h1 < h0));
    return { c, x0, h0, x1, h1, z1, syns, X1: qpad + lang, Y1: qpad + z1 * k };
  });

  // var det är när en andel p av vägen har gått (0–1, lika fort hela vägen): dukarnas avbildningar i
  // väggbildens bildpunkter, i den ordning de ritas, och synligheten (det tonas fram eller bort de första sex
  // räckeshöjderna vid bortre änden). Fordonets punkter (x längs det, h upp och z in från den närmaste sidan, i
  // rummets enheter) läggs med en och samma avbildning, så att bitarna möts. Av ovansidan ritas det som vetter
  // uppåt eller mot en (som taket, inte bakrutan på den som kommer mot en), bortifrån och hitåt; sedan fronten
  // eller baken och sist sidan.
  const e = METER / 16;
  const Xc = (B0 + F0) / 2;
  const pr = (s, X, H, Z) => {
    const q = vid(vag, s + (bort ? -1 : 1) * (X - Xc) * e);
    const z = (Z - ws / 2) * e;
    return [q[0] + q[2] * H * e + q[4] * z, q[1] + q[3] * H * e + q[5] * z];
  };
  const Xf = bort ? F0 : B0;
  const Xn = bort ? B0 : F0;
  const ordning = bort ? [...ytor].reverse() : ytor;
  const vid2 = (p) => {
    const s = (bort ? 1 - p : p) * sEnd;
    // (en avbildning för hela fordonet: den närmaste änden där den är, uppåt och inåt som där, och längs fordonet
    // bort till där den bortre änden är, så att sidan, änden och ovansidan möts precis)
    const n0 = pr(s, Xn, 0, 0);
    const f0 = pr(s, Xf, 0, 0);
    const nU = pr(s, Xn, 1, 0);
    const nI = pr(s, Xn, 0, 1);
    const U = [nU[0] - n0[0], nU[1] - n0[1]];
    // (inåt lyfter bron allt med LUTA, men fordonet självt lutar bara FLUTA: annars ser fronten sned ut och taket
    // som ett tak över det)
    const I = [nI[0] - n0[0] - (LUTA - FLUTA) * U[0], nI[1] - n0[1] - (LUTA - FLUTA) * U[1]];
    const A = [(n0[0] - f0[0]) / (Xn - Xf), (n0[1] - f0[1]) / (Xn - Xf)];
    const M = (X, H, Z) => [n0[0] + A[0] * (X - Xn) + U[0] * H + I[0] * Z, n0[1] + A[1] * (X - Xn) + U[1] * H + I[1] * Z];
    const upp = [-U[0] * TOP, -U[1] * TOP];
    const lista = [];
    for (const y of ordning) {
      if (!y.syns) continue;
      const A0 = M(y.x0, y.h0, 0);
      const A1 = M(y.x0, y.h0, y.z1);
      lista.push([y.c, affin(qpad, y.X1, qpad, y.Y1, A0, M(y.x1, y.h1, 0), [A1[0] - A0[0], A1[1] - A0[1]])]);
    }
    lista.push([ande, affin(pad, pad + ws * k, pad, y1, n0, M(Xn, 0, ws), upp)]);
    lista.push([sida, affin(pad, pad + (F0 - B0) * k, pad, y1, f0, n0, upp)]);
    return { lista, op: Math.min(1, s / 6) };
  };
  return { vid: vid2, vag: sEnd / METER, meter: (F0 - B0) / 16 };
}

// ---------- de som cyklar ----------

// Någon på cykel i cykelbanan fil (FIL), i utsiktens ljus och väder, i rummets mått som cyklisterna på gatan
// (rum-ute.js): från sidan, och framifrån (de som kommer mot en) eller bakifrån (de som åker bort). Den är smal,
// så de två bilderna står i kors genom mitten (inte som fordonens sida och ände, som hörnen på en låda): långt
// bort syns den framifrån och nära mest från sidan. Två bilder av var, med pedalerna ett halvt varv isär, om
// vartannat medan den trampar (tramp ms, broRita i rum-hasse.js). Hjälm eller mössa, regnjacka i regnet och lyse
// när det är mörkt; räcket framför benen, som för den som går.
export function cyklist(v, L, lage, fil, R = Math.random) {
  const C = ljus(v, L);
  const { F, ton, lampor } = C;
  const bort = FIL[fil].bort;
  // (rummets enheter, 16 på en meter: cykeln är 1,75 m lång med hjul som är 0,7 m höga, och den som cyklar når
  // 1,9 m upp och är 0,6 m bred med styret)
  const B0 = -14;
  const F0 = 14;
  const TOP = -31;
  const WS = 10;
  const len = ((F0 - B0) / 16) * METER;
  const hU = (-TOP / 16) * METER;
  const wU = (WS / 16) * METER;
  const vag = bana(lage, fil);
  const W = BAK[lage].W;
  // mitt i banan vid s: sidans nedre hörn bak och fram, och den tvärs över, från den närmaste kanten till den bortre
  const lage4 = (s) => {
    const fj = vid(vag, s - len / 2);
    const nr = vid(vag, s + len / 2);
    const mi = vid(vag, s);
    return {
      r0: [fj[0], fj[1]], r1: [nr[0], nr[1]], up: [mi[2] * hU, mi[3] * hU],
      m0: [mi[0] - (mi[4] * wU) / 2, mi[1] - (mi[5] * wU) / 2], m1: [mi[0] + (mi[4] * wU) / 2, mi[1] + (mi[5] * wU) / 2],
    };
  };
  let sEnd = len;
  while (sEnd < LINJE.L + 25 && lage4(sEnd).r0[0] < W + 12) sEnd += 1;

  // (lika lite oskärpa i bilderna som hos den som går, gangare)
  const k = 1.5;
  const nara = lage4(Math.min(sEnd, LINJE.L) * 0.88);
  const sudd = (BAKAD * -TOP * k) / Math.hypot(...nara.up);
  const pad = Math.ceil(3 * sudd + 6 * k);
  const y1 = pad - TOP * k;
  const racket = Math.max(0, Math.min(1, (1 - 0.04 - LUTA * (FIL[fil].sid - WS / 32) * METER) / hU));
  const yr = racket > 0 ? y1 + TOP * k * racket : y1 + 20 * k;
  const duk = (w) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * k + 2 * pad); c.height = Math.ceil(-TOP * k + 2 * pad); return c; };

  const valj = (a) => a[(R() * a.length) | 0];
  const kall = v.kanns < 5;
  const varmt = v.kanns >= 16;
  const regn = v.fall === 'regn' || v.fall === 'blandat';
  // (många som cyklar till jobbet har gul reflexväst, mest när det är mörkt eller kallt)
  const vast = R() < (lampor || kall ? 0.35 : v.arstid === 'sommar' ? 0.1 : 0.2);
  const jacka = ton(vast ? '#d6e04c' : regn && R() < 0.6 ? valj(['#e8b923', '#c8322a', '#2a5a3a', '#1c1f26'])
    : kall ? valj(['#1c1f26', '#2b2f38', '#3a3226', '#20283a', '#5a2a2a', '#2e3a2e', '#6b6458'])
      : valj(['#6b6458', '#4a5a6a', '#8a4a3a', '#3a4a3a', '#d84a3a', '#3a6ab0', '#e8e4dc']));
  // lyse: när det är mörkt, och hos en del också på dagen
  const lyse = lampor || R() < 0.3;
  const jacka2 = F.mix(jacka, '#000000', 0.3);
  const byxor = ton(valj(['#1e2430', '#2b3448', '#3a3a3a', '#202020', '#4a4236']));
  const byxor2 = F.mix(byxor, '#000000', 0.35);
  const hud = ton(valj(['#e9c2a2', '#d8a27c', '#b27a52', '#8a5636', '#f0cfb4']));
  const har = ton(valj(['#2a1d14', '#5a3e24', '#c9a56a', '#1a1a1a', '#8a6a4a']));
  const hjalm = R() < 0.6;
  const huvud = hjalm ? ton(valj(['#e8e4dc', '#1a1a1a', '#c8322a', '#2a6ab0', '#a9adb2'])) : kall ? ton(valj(['#a8322a', '#1a1a1a', '#2a4a7a', '#5a5a5a'])) : null;
  const ram = ton(valj(['#1a1a1a', '#1a2a4a', '#8a1e1e', '#a9adb2', '#2e4a36', '#e8e4dc']));
  const vaska = R() < 0.35 ? ton(valj(['#1a1a1a', '#a8322a', '#e8b923', '#2a3a2a'])) : null;
  const svart = ton('#121418', '#050505');
  const dack = ton('#141518', '#040404');
  const linje = (x, c, w, ...p) => {
    x.strokeStyle = c;
    x.lineWidth = w;
    x.beginPath();
    p.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.stroke();
  };
  const skugga = (x, cx, rx) => {
    x.globalAlpha = 0.3;
    x.fillStyle = '#000000';
    x.beginPath();
    x.ellipse(cx, -0.5, rx, 1.8, 0, 0, 2 * Math.PI);
    x.fill();
    x.globalAlpha = 1;
  };
  const skalle = (x, cx, cy, fram) => {
    x.fillStyle = fram === false ? har : hud;
    x.beginPath(); x.arc(cx, cy, 2.35, 0, 2 * Math.PI); x.fill();
    if (fram === null && !huvud) { x.fillStyle = har; x.beginPath(); x.arc(cx - 0.5, cy - 0.3, 2.2, Math.PI * 0.55, Math.PI * 1.6); x.fill(); }
    if (!huvud) return;
    x.fillStyle = huvud;
    x.beginPath();
    if (hjalm) x.ellipse(cx, cy - 0.4, 2.95, 2.4, 0, Math.PI, 2 * Math.PI);
    else x.arc(cx, cy - 0.2, 2.45, Math.PI, 2 * Math.PI);
    x.fill();
  };

  // från sidan, vänd åt det håll den cyklar: cykeln, och den som cyklar med höften på sadeln, händerna på
  // styret och fötterna på pedalerna (knäna framåt, låret och smalbenet lika långa som på en vuxen)
  const BB = [-1, -4.6];
  const HOFT = [-4.2, -16];
  const LAR = 7.6;
  const SKEN = 8.8;
  const kna = (P) => {
    const dx = P[0] - HOFT[0];
    const dy = P[1] - HOFT[1];
    const d = Math.min(LAR + SKEN - 0.05, Math.hypot(dx, dy));
    const t = Math.atan2(dy, dx);
    const al = Math.acos((LAR * LAR + d * d - SKEN * SKEN) / (2 * LAR * d));
    return [HOFT[0] + LAR * Math.cos(t - al), HOFT[1] + LAR * Math.sin(t - al)];
  };
  const ben = (x, fi, c) => {
    const P = [BB[0] + 2.8 * Math.cos(fi), BB[1] + 2.8 * Math.sin(fi)];
    const K = kna(P);
    x.lineCap = 'round';
    linje(x, c, 2.8, HOFT, K);
    linje(x, c, 2.2, K, P);
    linje(x, svart, 1.5, [P[0] - 0.4, P[1] - 0.2], [P[0] + 1.6, P[1] + 0.1]);
  };
  const sida = [0, 1].map((fas) => {
    const c = duk(F0 - B0);
    const x = c.getContext('2d');
    const ox = pad - B0 * k;
    const vand = () => (bort ? x.setTransform(-k, 0, 0, k, c.width - ox, y1) : x.setTransform(k, 0, 0, k, ox, y1));
    vand();
    if (FILTER) x.filter = `blur(${sudd.toFixed(2)}px)`;
    const fi = fas ? 1.22 * Math.PI + 0.35 : 0.39;
    skugga(x, 0, 14.5);
    ben(x, fi + Math.PI, byxor2);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    for (const hx of [-8.6, 8.6]) { x.strokeStyle = dack; x.lineWidth = 1.7; x.beginPath(); x.arc(hx, -5.6, 4.9, 0, 2 * Math.PI); x.stroke(); }
    if (vaska) { linje(x, ram, 0.7, [-11, -12.2], [-4, -12.6]); ruta(x, -12.4, -12.4, 6.2, 6, vaska); }
    linje(x, ram, 1.15, [-8.6, -5.6], BB, [-3.8, -13.2], [-8.6, -5.6]);
    linje(x, ram, 1.15, [-3.8, -13.2], [5.4, -14.2], [6.2, -11.4], BB);
    linje(x, ram, 1.0, [6.2, -11.4], [8.6, -5.6]);
    linje(x, ram, 0.9, [5.4, -14.2], [5.9, -16.4], [4.4, -16.8]);
    linje(x, svart, 1.0, [-3.8, -13.2], [-4.3, -15.2]);
    linje(x, svart, 1.5, [-6.4, -15.7], [-2.8, -15.7]);
    linje(x, svart, 0.8, BB, [BB[0] + 2.8 * Math.cos(fi), BB[1] + 2.8 * Math.sin(fi)]);
    // kroppen lutar framåt mot styret
    x.fillStyle = jacka;
    x.beginPath();
    x.moveTo(-6.5, -15.2);
    x.lineTo(-2, -15.8);
    x.lineTo(3.1, -24.4);
    x.quadraticCurveTo(2.2, -27, -0.6, -26.9);
    x.closePath();
    x.fill();
    ben(x, fi, byxor);
    x.lineCap = 'round';
    linje(x, jacka, 2, [0.9, -25.4], [3.4, -21.2]);
    linje(x, varmt ? hud : jacka, 1.8, [3.4, -21.2], [5.4, -17.1]);
    skalle(x, 2.6, -27.9, null);
    x.setTransform(1, 0, 0, 1, 0, 0);
    framfor(x, C, v, L, yr, k, sudd);
    vand();
    if (lyse) {
      ruta(x, 6.2, -15.6, 1.4, 1.4, '#fbf8ec');
      sken(x, 7, -14.9, lampor ? 7 : 3, 'rgba(255, 244, 214, 0.95)', lampor ? 0.5 : 0.35);
      ruta(x, -11.6, -12.6, 1.2, 1.2, '#ff4a3a');
      sken(x, -11, -12, lampor ? 5 : 2.5, 'rgba(255, 59, 48, 0.9)', lampor ? 0.45 : 0.3);
    }
    x.filter = 'none';
    return c;
  });

  // framifrån eller bakifrån: hjulet är ett smalt streck, det ena knät är uppe när det andra är nere, och
  // armbågarna går ut mot styrets ändar (lite bredare och tydligare än på riktigt, så att man ser vad det är)
  const cx = WS / 2;
  const ande = [0, 1].map((fas) => {
    const c = duk(WS);
    const x = c.getContext('2d');
    x.setTransform(k, 0, 0, k, pad, y1);
    if (FILTER) x.filter = `blur(${sudd.toFixed(2)}px)`;
    const fram = !bort;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    skugga(x, cx, 3);
    ruta(x, cx - 0.85, -11, 1.7, 11, dack);
    if (!fram && vaska) ruta(x, cx + 1, -12.6, 2.6, 6.2, vaska);
    for (const sg of [-1, 1]) {
      const upp = (sg < 0) === !fas;
      const K = upp ? [cx + sg * 2.3, -14.6] : [cx + sg * 2, -9.8];
      const P = upp ? [cx + sg * 1.8, -7.6] : [cx + sg * 1.6, -1.6];
      linje(x, upp ? byxor : byxor2, 2.6, [cx + sg * 1.5, -16], K);
      linje(x, upp ? byxor : byxor2, 2.2, K, P);
      linje(x, svart, 1.5, [P[0], P[1] - 0.3], [P[0], P[1] + 0.4]);
    }
    linje(x, ram, 1.1, [cx, -16.6], [cx, -11]);
    if (!fram) ruta(x, cx - 1.6, -16.4, 3.2, 1.2, svart);
    linje(x, svart, 1, [cx - 4.8, -16.8], [cx + 4.8, -16.8]);
    x.fillStyle = jacka;
    x.beginPath();
    x.moveTo(cx - 2.6, -15.4);
    x.lineTo(cx + 2.6, -15.4);
    x.lineTo(cx + 3.2, -24);
    x.quadraticCurveTo(cx, -25.8, cx - 3.2, -24);
    x.closePath();
    x.fill();
    for (const sg of [-1, 1]) linje(x, varmt ? hud : jacka, 1.8, [cx + sg * 2.9, -23.4], [cx + sg * 4.7, -20.2], [cx + sg * 4.6, -16.9]);
    if (!fram) ruta(x, cx - 2.6, -17, 5.2, 1.6, jacka2);
    skalle(x, cx, -26.6, fram);
    x.setTransform(1, 0, 0, 1, 0, 0);
    framfor(x, C, v, L, yr, k, sudd);
    x.setTransform(k, 0, 0, k, pad, y1);
    // (bak sitter alltid en röd reflex)
    if (!fram) ruta(x, cx - 0.7, -12.4, 1.4, 1.4, lyse ? '#ff4a3a' : ton('#9a1c16'));
    if (lyse && fram) { ruta(x, cx - 0.8, -15.6, 1.6, 1.4, '#fbf8ec'); sken(x, cx, -14.9, lampor ? 8 : 3.5, 'rgba(255, 244, 214, 0.95)', lampor ? 0.6 : 0.4); }
    else if (lyse) sken(x, cx, -11.7, lampor ? 6 : 3, 'rgba(255, 59, 48, 0.9)', lampor ? 0.5 : 0.35);
    x.filter = 'none';
    return c;
  });

  // var den är när en andel p av vägen har gått (som fordonen): sidan längs banan och den andra bilden tvärs över
  const sx1 = sida[0].width - pad;
  const ax1 = ande[0].width - pad;
  const vid2 = (p) => {
    const s = (bort ? 1 - p : p) * sEnd;
    const g = lage4(s);
    return { sida: affin(pad, sx1, pad, y1, g.r0, g.r1, g.up), ande: affin(pad, ax1, pad, y1, g.m0, g.m1, g.up), op: Math.min(1, s / 6) };
  };
  return { sida: sida[0], sida2: sida[1], ande: ande[0], ande2: ande[1], tramp: 340 + R() * 100, kors: true, vid: vid2, vag: sEnd / METER, meter: (F0 - B0) / 16 };
}

// Bandet där trafiken går (väggbildens bildpunkter, [x0, y0, x1, y1]): från bortre änden till förbi bildens högra
// kant, och från bussarnas tak i den bortre filen till skuggan i den närmaste cykelbanan och fötterna på gångbanan. Trafiken
// läggs i en ruta som bara är så stor (rum-hasse.js), så att grafikkortet inte rör resten av fönstret.
export function broRam(lage) {
  const { P } = projektion(lage);
  const W = BAK[lage].W;
  let x0 = Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let fil = 0; fil < FIL.length; fil++) {
    const B = bana(lage, fil);
    const hog = FIL[fil].cykel ? 1.6 : 2.7;
    const halv = (FIL[fil].cykel ? 1.2 : 1.6) * METER;
    for (let s = 0; s <= LINJE.L + 25; s += 2) {
      const q = vid(B, s);
      if (q[0] > W + 60) break;
      for (const sid of [-halv, halv]) {
        const bx = q[0] + q[4] * sid;
        const by = q[1] + q[5] * sid;
        x0 = Math.min(x0, bx);
        y0 = Math.min(y0, by + q[3] * hog);
        y1 = Math.max(y1, by - q[3] * 0.4);
      }
    }
  }
  // de som går (gangare): fötterna och paraplyet
  for (const [x, y, h] of gangVag(P)) {
    x0 = Math.min(x0, x - h);
    y0 = Math.min(y0, y - 1.3 * h);
    y1 = Math.max(y1, y + 0.2 * h);
  }
  return [x0 - 24, y0 - 16, W + 60, y1 + 16];
}
