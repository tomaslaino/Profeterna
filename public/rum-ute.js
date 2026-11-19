'use strict';

// ---------- utsikten i tobaksaffären ----------
//
// Gatan utanför skyltfönstret och dörren (rum.js), efter Stockholms klocka,
// årstid och väder (vader.js). Det är utsikten från baren Bron vid
// S:t Eriksbron: himlen med moln, månen och stjärnorna, brons räcke med stan
// på andra sidan och det laxrosa hörnhuset vid brofästet, lyktstolparna, och
// de som går, cyklar och åker förbi. Utsikten ligger bakom
// väggen i det bakersta planet och syns genom hålen i den (masken rum-hal i
// rum.js), i scenens koordinater: den som går förbi syns först i dörren och
// sedan i fönstret.
//
// Lagren, bakifrån: himlen (SVG), livet på himlen (molnen, fåglarna,
// fyrverkerierna), blixten, gatan (SVG), livet på gatan, det som går och kör
// förbi alldeles framför affären (fasadens, i samma ögonblick: framDuk),
// nederbörden och glaset (dropparna, frosten). Bilderna ritas om när ljuset eller vädret ändras;
// det som rör sig är CSS-animationer med bara transform och opacity
// (rum-ute.css), som står still med prefers-reduced-motion och ?rum-t.
//
//   RumUte.paint(el, v) ritar om de lager som har ändrats (v = Vader.nu())
//
// Årstiderna: träden nedanför bron gröna, gula eller kala, löv som blåser
// förbi och ligger på gatan på hösten, snö på taken och räcket, plogbilen och
// pulkor på vintern, adventsstjärnor och ljusstakar i
// fönstren från första advent till tjugondag Knut, en gran som bärs hem i
// december och fyrverkerier på nyårsnatten; måsar på dagen och tornseglare
// på sommarkvällarna, flaggan på flaggdagarna, räven mitt i natten.

window.RumUte = (() => {
  const r1 = (x) => Math.round(x * 10) / 10;
  function rng(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const hx = (a) => `#${a.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;
  const mix = (a, b, t) => { const A = rgb(a); const B = rgb(b); return hx(A.map((x, i) => x + (B[i] - x) * t)); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pick = (R, a) => a[(R() * a.length) | 0];

  // ---------- ljuset ----------

  // dag 0…1 hur ljust det är ute, sol hur mycket solen lyser på fasaderna,
  // guld låg sol, bla blå timmen, lampor gatlyktorna tända, tand andelen
  // tända fönster (fler på kvällen, nästan inga mitt i natten)
  function light(v) {
    const m = Math.min(1, v.moln / 100);
    const wet = v.fall ? v.mangd : 0;
    const dimma = v.slag === 'dimma' ? 1 : v.slag === 'dugg' ? 0.3 : 0;
    const dag = v.ljus * (1 - 0.3 * m) * (1 - 0.18 * wet);
    const sol = v.fall ? 0 : sm(0.5, 6, v.sol) * (1 - sm(0.35, 0.85, m)) * (1 - dimma);
    const guld = (1 - sm(4, 16, v.sol)) * sm(-1, 2, v.sol) * (1 - sm(0.4, 0.9, m));
    const bla = sm(-10, -5, v.sol) * (1 - sm(-1, 4, v.sol)) * (1 - 0.6 * m);
    const h = v.timme + v.minut / 60;
    const vana = h < 1 ? 0.24 : h < 5 ? 0.06 : h < 6.5 ? 0.14 : h < 9 ? 0.3 : h < 16 ? 0.12 : h < 22.5 ? 0.44 : 0.32;
    const sky = skyCols(v, m, dimma, wet);
    return { m, dag, sol, guld, bla, dimma, wet, lampor: dag < 0.42 || (dimma > 0.5 && dag < 0.6), tand: vana * (0.35 + 0.65 * (1 - dag)), sky };
  }

  // himlen uppifrån och ner mot taken: klar (natt → blå timme → glöd → dag)
  // blandad med mulen (molnen lyses upp av staden på natten)
  function skyCols(v, m, dimma, wet) {
    const s = v.sol;
    const K = (a, b, t) => a.map((c, i) => mix(c, b[i], t));
    let klar = ['#04070e', '#0a1020', '#141c31'];
    klar = K(klar, ['#15234a', '#2b4176', '#5a6896'], sm(-12, -5, s));
    klar = K(klar, ['#34508c', '#a87c8c', '#eea86c'], sm(-4, 1, s));
    klar = K(klar, ['#4479c0', '#7fa9d9', '#c3d9ec'], sm(2, 12, s));
    let mulen = ['#120f0d', '#1a1612', '#272019'];
    mulen = K(mulen, ['#3a3f4c', '#565b68', '#77787f'], sm(-10, -3, s));
    mulen = K(mulen, ['#8a9096', '#a1a6ab', '#b7babc'], sm(-3, 8, s));
    mulen = K(mulen, ['#5e6369', '#6f7479', '#81858a'], 0.5 * wet * sm(-3, 8, s));
    let c = K(klar, mulen, sm(0.2, 0.9, m));
    if (dimma) c = K(c, [0, 1, 2].map(() => mix('#26221e', '#a9aeb1', sm(-6, 6, s))), 0.55 * dimma);
    return c;
  }

  // fasadens färg: dagens puts, dämpad och kallare när det är mulet, varm i
  // låg sol, blåaktig i skymningen, nästan svart på natten
  function facade(day, night, L) {
    let c = mix(day, '#7f8894', 0.32 * L.m);
    c = mix(c, '#e2a676', 0.3 * L.guld * L.sol);
    c = mix(c, '#2e3a5a', 0.45 * L.bla);
    return mix(night, c, Math.pow(L.dag, 1.15));
  }
  const snowC = (L) => mix('#6a7286', '#eef2f5', L.dag);

  // ---------- himlen ----------

  function himmel(v, L) {
    const [a, b, c] = L.sky;
    let s = `<defs><linearGradient id="rum-ute-sky" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="250"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
      <radialGradient id="rum-ute-mane" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e8eef8" stop-opacity=".5"/><stop offset="1" stop-color="#e8eef8" stop-opacity="0"/></radialGradient></defs>
      <rect x="-80" y="90" width="1100" height="340" fill="url(#rum-ute-sky)"/>`;
    // stjärnorna, svaga i stadens ljus (till vänster om hörnhuset)
    const st = (1 - sm(-9, -6, v.sol)) * (1 - sm(0.15, 0.55, L.m));
    if (st > 0.02) {
      const R = rng(41);
      for (let i = 0; i < 40; i++) {
        const x = 40 + R() * 580;
        const y = 132 + R() * 90;
        s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.5 + R() * 0.8)}" fill="#f2f4ff" opacity="${r1(st * (0.25 + R() * 0.5))}"/>`;
      }
    }
    // månen, när den är uppe (fasen ur vader.js)
    const mo = v.mane;
    const mv = sm(2, 8, mo.h) * (1 - sm(-3, 2, v.sol)) * (1 - sm(0.45, 0.85, L.m));
    if (mv > 0.03 && mo.fas > 0.04 && mo.fas < 0.96) {
      const cx = 560; const cy = 160; const r = 8.5;
      const wax = mo.fas < 0.5;
      const k = (1 - Math.cos(2 * Math.PI * mo.fas)) / 2;
      const rx = r1(r * Math.abs(Math.cos(2 * Math.PI * mo.fas)));
      s += `<circle cx="${cx}" cy="${cy}" r="${r * 5}" fill="url(#rum-ute-mane)" opacity="${r1(mv * (0.3 + 0.7 * k))}"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1c2233" opacity="${r1(mv * 0.5)}"/>` +
        `<path d="M${cx} ${cy - r} A${r} ${r} 0 0 ${wax ? 1 : 0} ${cx} ${cy + r} A${rx} ${r} 0 0 ${wax === k > 0.5 ? 1 : 0} ${cx} ${cy - r} Z" fill="#eef1e6" opacity="${r1(mv)}"/>`;
    }
    return s;
  }

  // molnen (som driver), fåglarna och fyrverkerierna – bakom taken
  function himmelsliv(v, L) {
    const R = rng(v.ar * 977 + v.manad * 61 + v.dag * 7 + (v.timme >> 2));
    let s = '';
    const m = L.m;
    if (m > 0.12 && m < 0.9 && v.slag !== 'dimma') {
      const n = Math.round(2 + m * 6);
      const lit = mix(mix(mix('#1b1916', '#f3f5f7', L.dag), '#f2b08c', 0.55 * L.guld), '#3a4870', 0.5 * L.bla);
      const dark = mix(lit, '#596273', 0.35 + 0.2 * m);
      for (let i = 0; i < n; i++) {
        const w = 110 + R() * 160;
        const y = 128 + R() * 70;
        const dur = 260 + R() * 260;
        let blob = '';
        for (let j = 0; j < 5; j++) {
          const bx = (j / 4 - 0.5) * w * 0.7 + (R() - 0.5) * 20;
          blob += `<ellipse cx="${r1(bx)}" cy="${r1(-(R() * 10) + (Math.abs(j - 2) * 4))}" rx="${r1(w * (0.18 + R() * 0.12))}" ry="${r1(9 + R() * 9)}" fill="${j % 2 ? dark : lit}"/>`;
        }
        s += `<svg class="rum-moln" style="top:${r1(y - 40)}px; --fran:-260px; --till:1240px; animation-duration:${r1(dur)}s; animation-delay:-${r1(R() * dur)}s; opacity:${r1(0.55 + 0.35 * m)}" viewBox="-200 -40 400 80" width="400" height="80">${blob}</svg>`;
      }
    }
    // måsar och kråkor på dagen, tornseglare på sommarkvällarna
    if (L.dag > 0.4 && (!v.fall || v.mangd < 0.5)) {
      const krakor = v.arstid === 'vinter';
      const n = krakor ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const dur = 50 + R() * 70;
        const dir = R() < 0.5 ? 1 : -1;
        const col = krakor ? '#15151a' : mix('#6b6f76', '#f2f2ee', L.dag);
        let flock = '';
        const k = 1 + ((R() * 3) | 0);
        for (let j = 0; j < k; j++) flock += `<g transform="translate(${r1(j * 18 + R() * 8)} ${r1((R() - 0.5) * 14)})"><path class="vinge" d="M-6 0 Q-3 -3 0 0 Q3 -3 6 0" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" style="animation-duration:${r1(0.5 + R() * 0.4)}s"/></g>`;
        s += `<svg class="rum-fagel" style="top:${r1(130 + R() * 70)}px; --fran:${dir > 0 ? -80 : 1080}px; --till:${dir > 0 ? 1080 + dur * 10 : -80 - dur * 10}px; animation-duration:${r1(dur)}s; animation-delay:-${r1(R() * dur)}s" viewBox="-10 -12 70 24" width="70" height="24">${flock}</svg>`;
      }
    }
    if (v.arstid === 'sommar' && v.timme >= 18 && v.timme < 23 && !v.fall) {
      for (let i = 0; i < 5; i++) {
        const dur = 7 + R() * 9;
        s += `<svg class="rum-seglare" style="top:${r1(140 + R() * 40)}px; animation-duration:${r1(dur)}s; animation-delay:-${r1(R() * dur)}s; --dy:${r1((R() - 0.5) * 60)}px" viewBox="-8 -4 16 8" width="16" height="8"><path d="M-7 1 Q-3 -3 0 0 Q3 -3 7 1 Q3 -1 0 1 Q-3 -1 -7 1 Z" fill="#1a1a20"/></svg>`;
      }
    }
    // fyrverkerierna: nyårsnatten, och lite här och var på nyårsafton
    const nyarsafton = v.manad === 12 && v.dag === 31 && v.timme >= 18;
    if (v.nyar || nyarsafton) {
      const n = v.nyar ? 9 : 3;
      const cols = ['#ffd36a', '#ff5a4a', '#7dffb0', '#ffffff', '#7ab8ff', '#ff8ad8'];
      for (let i = 0; i < n; i++) {
        const c = pick(R, cols);
        const x = R() < 0.35 ? 70 + R() * 140 : 290 + R() * 300;
        const y = 142 + R() * 50;
        const rr = 14 + R() * 16;
        let rays = '';
        for (let j = 0; j < 14; j++) {
          const a = j / 14 * 2 * Math.PI + R() * 0.2;
          rays += `<line x1="${r1(Math.cos(a) * rr * 0.25)}" y1="${r1(Math.sin(a) * rr * 0.25)}" x2="${r1(Math.cos(a) * rr)}" y2="${r1(Math.sin(a) * rr + 2)}"/><circle cx="${r1(Math.cos(a) * rr)}" cy="${r1(Math.sin(a) * rr + 3)}" r="1"/>`;
        }
        const dur = (v.nyar ? 2.6 : 9) + R() * 4;
        s += `<svg class="rum-pang" style="left:${r1(x - 40)}px; top:${r1(y - 40)}px; animation-duration:${r1(dur)}s; animation-delay:-${r1(R() * dur)}s" viewBox="-40 -40 80 80" width="80" height="80"><g stroke="${c}" fill="${c}" stroke-width="1.3" stroke-linecap="round">${rays}</g><circle r="4" fill="#fff" opacity=".8"/></svg>`;
      }
    }
    return s;
  }

  // ---------- gatan ----------
  //
  // Utsikten från baren Bron vid S:t Eriksbron: på andra sidan S:t Eriksgatan går brons gröna
  // räcke, med en trappa ned, och bortom det syns trädtopparna och kontaktledningarna över
  // järnvägen under bron och stan på andra sidan, med en kyrkspira och ett högt torn. Till höger
  // står det laxrosa hörnhuset vid brofästet, med en stenpelare där räcket börjar. Det ska kännas
  // som platsen, inte vara en karta: få och stora former, som ritas en gång (i telefonen en grov
  // duk, bakaGata) och bara på nytt när ljuset eller vädret ändras.

  // Stan på andra sidan (x, bredd, takfoten, takets höjd): högre till vänster, lägre bort mot
  // hörnhuset. Raden bakom är en enda siluett i diset som sticker upp över den.
  const STAD = [
    { x: -80, w: 150, tak: 290, th: 14, dag: '#d2b384' },
    { x: 70, w: 72, tak: 300, th: 9, dag: '#d98a3c' },
    { x: 142, w: 88, tak: 306, th: 7, dag: '#ecd6a4' },
    { x: 230, w: 80, tak: 313, th: 6, dag: '#c76a42' },
    { x: 310, w: 100, tak: 318, th: 6, dag: '#e3b24c' },
    { x: 410, w: 72, tak: 323, th: 5, dag: '#eadfc6' },
    { x: 482, w: 60, tak: 327, th: 5, dag: '#b9764e' },
    { x: 542, w: 100, tak: 331, th: 5, dag: '#dcb06a' },
  ];
  const BAKOM = 'M-80 400 V270 H40 V282 H120 V290 H200 V296 H262 V300 H330 V304 H372 V300 H420 V310 H470 V314 H540 V318 H600 V320 H640 V400 Z';
  // trädtopparna nedanför bron, som når upp över räcket (mitten, toppen, bredden)
  const TRAD = [[-30, 370, 90], [150, 364, 100], [330, 371, 64], [430, 362, 120], [590, 370, 70]];
  // räcket: från vänster till stenpelaren vid hörnhuset (HORN), med trappan ned mellan TRAPP
  const RACKE = 377;
  const TRAPP = [296, 352];
  const HORN = 628;
  const WARM = ['#ffd58a', '#ffc56b', '#f6e7c1', '#ffcf7a', '#a9c4ff'];

  // löven på träden: ljusgröna i maj, gröna på sommaren, gula på hösten, annars kala
  const lovet = (v) => (v.manad === 5 ? 'ljus' : v.manad >= 6 && v.manad <= 8 ? 'gron'
    : (v.manad === 9 && v.dag >= 20) || v.manad === 10 || (v.manad === 11 && v.dag <= 25) ? 'host'
      : v.manad === 9 ? 'gron' : 'kal');

  // påskdagen år Y (ms, UTC)
  function paskdag(Y) {
    const a = Y % 19; const b = Math.floor(Y / 100); const c = Y % 100; const d = Math.floor(b / 4); const e = b % 4;
    const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451);
    return Date.UTC(Y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  }
  // allmänna flaggdagar (påsk, pingst, midsommar och valdagen räknas ut)
  function flaggdag(v) {
    const md = `${v.manad}-${v.dag}`;
    if (['1-1', '1-28', '3-12', '4-30', '5-1', '6-6', '7-14', '8-8', '10-24', '11-6', '12-10', '12-23', '12-25'].includes(md)) return true;
    const Y = v.ar;
    const pask = paskdag(Y);
    const today = Date.UTC(Y, v.manad - 1, v.dag);
    if (today === pask || today === pask + 49 * 864e5) return true;
    if (v.manad === 6 && v.dag >= 20 && v.dag <= 26 && new Date(today).getUTCDay() === 6) return true;
    if (Y % 4 === 2 && v.manad === 9 && v.dag >= 8 && v.dag <= 14 && new Date(today).getUTCDay() === 0) return true;
    return false;
  }
  // hissad från klockan 8 (9 på vintern) till solnedgången, senast 21
  const flagga = (v) => flaggdag(v) && v.timme >= (v.manad >= 11 || v.manad <= 2 ? 9 : 8) && v.timme < 21 && v.sol > -1;

  // Lediga dagar då trafiken går som en söndag: helgerna, de röda dagarna och aftnarna (midsommar-, jul- och
  // nyårsafton), långfredagen, annandag påsk och Kristi himmelsfärd.
  function ledig(v) {
    if (v.veckodag === 'lör' || v.veckodag === 'sön') return true;
    if (['1-1', '1-6', '5-1', '6-6', '12-24', '12-25', '12-26', '12-31'].includes(`${v.manad}-${v.dag}`)) return true;
    const today = Date.UTC(v.ar, v.manad - 1, v.dag);
    const p = paskdag(v.ar);
    if ([-2, 1, 39].some((d) => today === p + d * 864e5)) return true;
    return v.manad === 6 && v.dag >= 19 && v.dag <= 25 && new Date(today).getUTCDay() === 5;
  }

  // Trafiken på S:t Eriksgatan efter klockan och dagen, för gatan här (gatliv) och S:t Eriksbron genom Hasse
  // Backes fönster (rum-hasse.js): rusning vardagar 7–9.30 och 15.30–18.30, mer trafik på dagen än på kvällen
  // och lite på natten. På lediga dagar ingen rusning och lugnt till halv tio, men fler ute efter midnatt
  // natten mot lördag och söndag. bilar: bilar per varv och fil, varv: varvets längd (s), gaende: hur många som
  // går (färre i ösregn, snöstorm och sträng kyla), bussar: bussarna går.
  function trafik(v) {
    const h = v.timme + v.minut / 60;
    const helg = ledig(v);
    const rusning = !helg && ((h > 7 && h < 9.5) || (h > 15.5 && h < 18.5));
    const natt = h < 5 || h >= 23.5;
    const dag = h > (helg ? 9.5 : 6.5) && h < 21;
    const bilar = rusning ? 3 : dag ? 2 : 1;
    const varv = natt ? [60, 85] : rusning ? [26, 32] : bilar === 2 ? [32, 40] : [42, 52];
    const ut = (v.veckodag === 'lör' || v.veckodag === 'sön') && h < 4;
    // (glest på kvällen: efter halv sju färre, efter åtta bara en och annan, lite fler fredag och lördag)
    const fest = v.veckodag === 'fre' || v.veckodag === 'lör';
    let gaende = h < 1 ? (ut ? 3 : 1) : h < 5 ? (ut ? 3 : 1) : h < 7 ? (helg ? 1 : 3) : helg && h < 9.5 ? 4 : h < 18.5 ? 7 : h < 20 ? 5 : h < 22 ? (fest ? 4 : 3) : fest ? 3 : 2;
    if (v.fall && v.mangd > 0.75) gaende = Math.max(1, gaende - 3);
    if (v.kanns < -12) gaende = Math.max(1, gaende - 2);
    // på cykel: inte i snön eller i ösregn, fler på sommaren (1–3, 0 = ingen)
    const cyklar = !v.snotackt && !(v.fall && v.mangd > 0.6) && h > 6 && h < 23.5 ? (v.arstid === 'vinter' ? 1 : v.arstid === 'sommar' ? 3 : 2) : 0;
    return { h, helg, rusning, natt, dag, bilar, varv, gaende, cyklar, bussar: h > 5.5 };
  }

  // Ett fönster (w × h) i hörnhuset: glaset speglar himlen på dagen och är tänt efter klockan
  // på kvällen, med karmen (mittpost och tvärpost), ibland gardiner, i advent en stjärna eller
  // en ljusstake, och blecket under.
  function fonster(v, L, x, y, w, h, R) {
    const r = R(); const rc = R(); const ro = R(); const rd = R();
    const k = w / 14;
    const tv = r1(y + h * 0.36);
    const tand = r < L.tand;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mix(mix('#120e11', '#ffffff', 0.03), mix('#222932', L.sky[2], 0.32), L.dag)}"/>`;
    if (tand) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${WARM[(rc * 5) | 0]}" opacity="${r1((0.28 + ro * 0.4) * (1 - 0.8 * L.dag))}"/>`;
    if (L.dag > 0.2) s += `<path d="M${x} ${y} H${r1(x + w * 0.62)} L${x} ${r1(y + h * 0.55)} Z" fill="${L.sky[1]}" opacity="${r1(0.3 * L.dag)}"/>`;
    if (L.dag > 0.05) {
      const fr = mix('#fbf6ea', '#8d96a3', 0.3 * L.m);
      if (rd < 0.45) s += `<g fill="#efe6d4" opacity="${r1(0.55 * L.dag)}"><rect x="${x + 1}" y="${y + 1}" width="${r1(w * 0.2)}" height="${h - 2}"/><rect x="${r1(x + w * 0.8 - 1)}" y="${y + 1}" width="${r1(w * 0.2)}" height="${h - 2}"/></g>`;
      s += `<g stroke="${fr}" stroke-width="1.8" fill="none" opacity="${r1(0.85 * L.dag)}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/><path d="M${x + w / 2} ${tv} V${y + h} M${x} ${tv} H${x + w}"/></g>`;
    } else if (tand) s += `<path d="M${x + w / 2} ${tv} V${y + h} M${x} ${tv} H${x + w}" stroke="#1a120c" stroke-width="1.8" opacity=".55"/>`;
    // adventsstjärnor och ljusstakar, tända från eftermiddagen
    if (v.advent && rd > 0.66) {
      const on = 1 - 0.55 * L.dag;
      const cx = x + w / 2;
      if (rc < 0.55) {
        const cy = r1(y + h * 0.58);
        let pts = '';
        for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5; const rr = (j % 2 ? 1.7 : 4) * k; pts += `${r1(cx + Math.cos(a) * rr)},${r1(cy + Math.sin(a) * rr)} `; }
        s += `<circle cx="${cx}" cy="${cy}" r="${r1(7 * k)}" fill="#ffb24a" opacity="${r1(0.35 * on)}"/><polygon points="${pts}" fill="#ffc874" opacity="${r1(0.5 + 0.5 * on)}"/>`;
      } else {
        const b = y + h - 0.5;
        s += `<polygon points="${r1(x + 1.5 * k)},${b} ${r1(x + w - 1.5 * k)},${b} ${cx},${r1(b - 5.5 * k)}" fill="#1c140c" opacity=".85"/>`;
        for (let j = 0; j < 7; j++) { const t = j / 6; s += `<circle cx="${r1(x + 2 * k + t * (w - 4 * k))}" cy="${r1(b - (1 - Math.abs(t - 0.5) * 2) * 5 * k)}" r="${r1(0.9 * k)}" fill="#fff0b4" opacity="${r1(0.4 + 0.6 * on)}"/>`; }
        s += `<ellipse cx="${cx}" cy="${r1(b - 2.5 * k)}" rx="${r1(7 * k)}" ry="${r1(4 * k)}" fill="#ffc874" opacity="${r1(0.25 * on)}"/>`;
      }
    }
    s += `<rect x="${r1(x - 2)}" y="${y + h}" width="${w + 4}" height="2.6" fill="${mix('#191c23', '#d9d3c5', L.dag * (1 - 0.3 * L.m))}"/>`;
    if (v.snotackt) s += `<rect x="${r1(x - 2)}" y="${r1(y + h - 1.4)}" width="${w + 4}" height="2.2" rx="1" fill="${snowC(L)}"/>`;
    return s;
  }

  function gata(v, L) {
    let s = '';
    const sno = v.snotackt ? snowC(L) : null;
    // diset: det som är långt bort går mot himlens färg nere vid taken
    const dis = (c, t) => mix(c, L.sky[2], t);
    const fern = mix(mix('#0b0e16', L.sky[2], 0.22 + 0.4 * L.dag), '#4a5262', 0.25 * L.dag);

    // stan på andra sidan: raden bakom, en kyrkspira och ett högt torn (med en röd lampa i mörkret)
    s += `<path d="${BAKOM}" fill="${dis(fern, 0.15)}"/>
      <rect x="196" y="282" width="14" height="30" fill="${fern}"/><path d="M196 283 L203 250 L210 283 Z" fill="${mix(fern, '#6f9484', 0.35 * L.dag)}"/>
      <rect x="498" y="254" width="16" height="80" fill="${dis(facade('#a6afb9', '#0e1119', L), 0.25)}"/><rect x="496" y="252" width="20" height="5" fill="${dis(mix('#0a0c12', '#5d646e', L.dag), 0.2)}"/>
      <path d="M502 260 V330 M510 260 V330" stroke="${dis(mix('#0a0c12', '#7d8691', L.dag), 0.25)}" stroke-width="1.4"/>`;
    if (L.lampor) s += '<circle cx="506" cy="249" r="1.8" fill="#ff3b30"/><circle cx="506" cy="249" r="5" fill="#ff3b30" opacity=".35"/>';
    // husen, med tak och fönsterrader (tända efter klockan, mörka prickar på dagen)
    const RS = rng(53);
    let morka = '';
    const tanda = ['', ''];
    // Stadens ljus är ur skärpa (skärpedjupet, rum-ute.css): några av de tända fönstren blir runda
    // fläckar, som ljus ser ut genom ett objektiv som har skärpan i rummet. Ett urval av de ljusaste (r
    // nedan), så att fläckarna inte flyter ihop; i en enda form med en båge per fläck.
    let flackar = '';
    const FLACK = 5;
    const roof = sno || dis(mix('#0a0c12', mix('#3a3d44', L.sky[2], 0.25), L.dag), 0.2);
    for (const b of STAD) {
      const f = dis(facade(b.dag, '#0d1017', L), 0.16);
      s += `<rect x="${b.x}" y="${b.tak}" width="${b.w}" height="${400 - b.tak}" fill="${f}"/><polygon points="${b.x},${b.tak} ${b.x + b.w},${b.tak} ${b.x + b.w - 3},${b.tak - b.th} ${b.x + 3},${b.tak - b.th}" fill="${roof}"/>`;
      if (b.th >= 9) for (let x = b.x + 14; x < b.x + b.w - 12; x += 26) s += `<rect x="${x}" y="${b.tak - b.th + 2}" width="7" height="${b.th - 3}" fill="${f}"/>`;
      for (let y = b.tak + 6; y < 392; y += 10) {
        for (let x = b.x + 5; x < b.x + b.w - 6; x += 8) {
          const w = `M${x} ${y}h2.6v3.4h-2.6z`;
          morka += w;
          const r = RS();
          if (r < L.tand * 0.8) tanda[r < L.tand * 0.3 ? 0 : 1] += w;
          if (r < L.tand * 0.14) flackar += `M${r1(x + 1.3 - FLACK)} ${r1(y + 1.7)}a${FLACK} ${FLACK} 0 1 0 ${2 * FLACK} 0a${FLACK} ${FLACK} 0 1 0 ${-2 * FLACK} 0z`;
        }
      }
    }
    if (L.dag > 0.05) s += `<path d="${morka}" fill="${dis(mix('#1e2228', L.sky[2], 0.15), 0.1)}" opacity="${r1(0.5 * L.dag)}"/>`;
    if (L.dag < 0.7) tanda.forEach((d, i) => { if (d) s += `<path d="${d}" fill="${WARM[i]}" opacity="${r1((i ? 0.5 : 0.9) * (1 - 0.9 * L.dag))}"/>`; });
    if (L.dag < 0.7 && flackar) s += `<path d="${flackar}" fill="${WARM[0]}" opacity="${r1(0.45 * (1 - L.dag / 0.7))}"/>`;

    // kontaktledningarna över järnvägen, mellan träden
    s += `<g stroke="${dis(mix('#0c0e12', '#59606a', L.dag), 0.2)}" fill="none"><path d="M34 400 V352 M78 400 V352 M30 356 H82 M228 400 V354 M272 400 V354 M224 358 H276" stroke-width="2"/><path d="M-80 364 H320" stroke-width=".8" opacity=".6"/></g>`;

    // trädtopparna
    const lov = lovet(v);
    const tc = { ljus: ['#6f9a48', '#86ad55'], gron: ['#2f5a34', '#3f6d3c'], host: ['#b8792e', '#c99a3a'], kal: ['#5e5650', '#6e665e'] }[lov];
    const tm = (c) => {
      const t = mix('#07090c', mix(c, '#7f8894', 0.25 * L.m), Math.pow(L.dag, 1.1));
      return sno && lov === 'kal' ? mix(t, sno, 0.35) : t;
    };
    const RT = rng(31);
    let trad = '';
    for (const [tx, top, tw] of TRAD) {
      trad += `<rect x="${r1(tx - tw * 0.42)}" y="${top + 14}" width="${r1(tw * 0.84)}" height="${400 - top - 14}" fill="${tm(tc[0])}"/>`;
      for (let j = 0; j < 4; j++) trad += `<ellipse cx="${r1(tx + (j / 3 - 0.5) * tw * 0.66)}" cy="${r1(top + 12 + RT() * 7)}" rx="${r1(tw * (0.2 + RT() * 0.08))}" ry="${r1(12 + RT() * 6)}" fill="${tm(tc[j % 2])}"/>`;
    }
    s += lov === 'kal' ? `<g opacity=".6">${trad}</g>` : trad;

    // brons räcke: överliggare, underliggare, spjälor och stolpar, trappan ned och stenpelaren vid huset
    const gron = mix('#10141a', mix('#3f7d55', '#6a8a78', 0.3 * L.m), L.dag);
    const [t0, t1] = TRAPP;
    let spjalor = '';
    for (let x = -78; x < HORN - 20; x += 5.5) {
      const y = x > t0 && x < t1 ? RACKE + 2 + (x - t0) / (t1 - t0) * 22 : RACKE + 3;
      if (y < 393) spjalor += `M${r1(x)} ${r1(y)}V396`;
    }
    let stolpar = '';
    for (let x = -76; x < HORN - 24; x += 64) if (x < t0 - 6 || x > t1 + 6) stolpar += `<rect x="${x}" y="${RACKE - 3}" width="4" height="${403 - RACKE}"/>`;
    s += `<g fill="${gron}" stroke="${gron}"><path d="${spjalor}" stroke-width="1.2" fill="none"/>
      <path d="M-80 ${RACKE + 1.5} H${t0} L${t1} 399 M${t1} ${RACKE + 1.5} H${HORN - 16}" stroke-width="3.5" fill="none"/><path d="M-80 396 H${t0} M${t1} 396 H${HORN - 16}" stroke-width="2.4" fill="none"/>
      ${stolpar}<rect x="${t0 - 2}" y="${RACKE - 4}" width="5" height="${404 - RACKE}"/><rect x="${t1 - 2}" y="${RACKE - 4}" width="5" height="${404 - RACKE}"/></g>`;
    if (sno) s += `<path d="M-80 ${RACKE - 0.5} H${t0} L${t1} 397 M${t1} ${RACKE - 0.5} H${HORN - 16}" stroke="${sno}" stroke-width="2" fill="none"/>`;
    const granit = mix('#121316', mix('#a7a39b', '#8f949a', 0.3 * L.m), L.dag);
    s += `<rect x="${HORN - 18}" y="366" width="18" height="36" fill="${granit}"/><rect x="${HORN - 20}" y="363" width="22" height="5" fill="${mix(granit, '#000000', 0.15)}"/>`;
    if (sno) s += `<rect x="${HORN - 20}" y="361" width="22" height="3" rx="1.5" fill="${sno}"/>`;

    // hörnhuset: laxrosa puts med solen på den övre delen, mörka omfattningar kring fönstren,
    // granit kring de stora fönstren i bottenvåningen under mörka överstycken, och en port
    const sunTop = 400 - Math.max(0, Math.min(300, 333 - 300 * Math.tan(Math.max(1, v.sol) * Math.PI / 180)));
    const f = facade('#e08a5a', '#120e11', L);
    s += `<rect x="${HORN}" y="80" width="480" height="320" fill="${mix(f, '#56658a', 0.14 * L.sol)}"/>`;
    if (L.sol > 0.03 && sunTop > 80) s += `<rect x="${HORN}" y="80" width="480" height="${r1(sunTop - 80)}" fill="${mix(mix(f, '#fff0d2', 0.22 * L.sol), '#f0a46a', 0.25 * L.guld * L.sol)}"/>`;
    const omf = mix('#0d0d10', mix('#4a4746', '#8a8f96', 0.25 * L.m), L.dag);
    const RW = rng(23);
    s += `<rect x="${HORN}" y="80" width="3" height="320" fill="${mix(f, '#000000', 0.2)}"/>`;
    for (const cx of [676, 776, 876, 976, 1076]) {
      for (const y of [140, 214]) s += `<rect x="${cx - 17}" y="${y - 3}" width="34" height="50" fill="${omf}"/>${fonster(v, L, cx - 14, y, 28, 44, RW)}`;
      s += `<rect x="${cx - 19}" y="306" width="38" height="86" fill="${granit}"/><rect x="${cx - 23}" y="299" width="46" height="7" fill="${omf}"/>`;
      if (cx === 976) s += `<rect x="${cx - 14}" y="314" width="28" height="86" fill="${mix('#0a0806', '#5a3a24', L.dag)}"/><path d="M${cx - 11} 330 V320 Q${cx} 312 ${cx + 11} 320 V330 Z" fill="${mix('#0c0d10', mix('#2a3038', L.sky[2], 0.35), L.dag)}"/>`;
      else s += `${fonster(v, L, cx - 15, 312, 30, 46, RW)}<rect x="${cx - 13}" y="364" width="26" height="22" fill="${mix(f, '#000000', 0.12)}"/>`;
      if (sno) s += `<rect x="${cx - 23}" y="297" width="46" height="2.5" rx="1" fill="${sno}"/>`;
    }
    s += `<rect x="${HORN}" y="390" width="480" height="10" fill="${granit}"/>
      <path d="M635 352 q4 -16 8 -2 q3 -14 7 0 q2 -9 6 -3 M637 341 l18 -6" stroke="${mix('#141018', '#8a52c2', L.dag)}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
    // flaggstången (flaggan vajar i livet på gatan)
    s += `<line x1="712" y1="204" x2="744" y2="178" stroke="${mix('#222', '#e9e4d8', L.dag)}" stroke-width="1.8"/><circle cx="744" cy="178" r="1.6" fill="${mix('#3a3020', '#d8b25a', L.dag)}"/>`;

    // stolpen med gatuskylten och parkeringsförbudet vid pelaren, och en cykel mot räcket
    const syn = (c) => mix('#0b0c10', c, 0.15 + 0.85 * L.dag);
    s += `<rect x="599" y="294" width="2.4" height="108" fill="${syn('#4a4e54')}"/><rect x="588" y="294" width="25" height="7" fill="${syn('#f2f2ee')}"/><rect x="592" y="297" width="17" height="1.2" fill="${syn('#2a2a2a')}"/>
      <circle cx="600" cy="313" r="6" fill="${syn('#2a5aa8')}" stroke="${syn('#c8322a')}" stroke-width="1.6"/><path d="M596 309 L604 317" stroke="${syn('#c8322a')}" stroke-width="1.4"/><rect x="595" y="321" width="10" height="5" fill="${syn('#e8a030')}"/>
      <g fill="none" stroke="${syn('#2b2f36')}" stroke-width="1.3"><circle cx="537" cy="394" r="6.5"/><circle cx="560" cy="394" r="6.5"/><path d="M537 394 L545 394 L541 384 M545 394 L555 384 L541 384 M555 384 L560 394 M555 384 L556 379 M541 384 L540 381"/></g>`;

    // marken: trottoaren på bron, kantstenen och gatan – torr, våt eller snöig – och närmast trottoaren utanför
    // affären, med kantstenen i granit och rännstenen, så som fasaden har dem: i samma mått som de som går och kör
    // där (framY, rum-fasad-gatan.js: kanten 0,88 m ut, rännstenen till 1 m, filerna 1,3 och 1,72 m och linjen
    // mellan dem 1,51 m)
    const dry = [mix('#25262b', '#a19f99', L.dag), mix('#121318', '#5b5d61', L.dag)];
    const wet = [mix('#2a2b30', '#6c6e72', L.dag), mix('#121318', '#383b40', L.dag)];
    let [walk, road] = L.wet || v.blott ? wet : dry;
    if (sno) { walk = sno; road = mix('#262b36', '#a3a9b0', L.dag); }
    const yRann = r1(framY(1));
    const yKant = r1(framY(0.88));
    const yTrott = r1(framY(0.76));
    const nara = sno ? mix(sno, '#9aa2ad', 0.22) : walk;
    s += `<rect x="-80" y="400" width="1100" height="11" fill="${walk}"/><rect x="-80" y="411" width="1100" height="3" fill="${mix(walk, '#000', 0.35)}"/><rect x="-80" y="414" width="1100" height="310" fill="${road}"/>
      <rect x="-80" y="${yRann}" width="1100" height="${r1(yKant - yRann)}" fill="${sno ? mix(road, '#000', 0.12) : mix(road, '#4a3e32', 0.35)}"/>
      <rect x="-80" y="${yKant}" width="1100" height="${r1(yTrott - yKant)}" fill="${sno ? nara : granit}"/><path d="M-80 ${yKant}H1020" stroke="${mix(granit, '#ffffff', 0.18)}" stroke-width="1.2" opacity="${r1(0.3 + 0.4 * L.dag)}"/>
      <rect x="-80" y="${yTrott}" width="1100" height="${r1(724 - yTrott)}" fill="${nara}"/>
      <path d="M-80 ${r1(framY(0.6))}H1020M-80 ${r1(framY(0.4))}H1020M-80 ${r1(framY(0.2))}H1020" stroke="${mix(nara, '#000', 0.2)}" stroke-width="1.4" opacity=".55"/>`;
    if (!sno) {
      // (gatstenen i rännstenen)
      let d = '';
      for (let x = -76; x < 1020; x += 9) d += `M${x} ${yRann}v${r1(yKant - yRann)}`;
      s += `<path d="${d}" stroke="${mix(road, '#000', 0.3)}" stroke-width="1" opacity=".5"/>`;
    }
    // kvällen: affärens ljus faller ut genom fönstret och dörren på trottoaren (X: fasadens meter i sidled, framX)
    if (L.dag < 0.6) {
      const a = 1 - L.dag / 0.6;
      const p = (X, d) => `${r1(framX(X, framS(d)))},${r1(framY(d))}`;
      s += `<defs><linearGradient id="rum-ute-affar" x1="0" y1="${yKant}" x2="0" y2="${r1(framY(0.1))}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb36a" stop-opacity="0"/><stop offset="1" stop-color="#ffb36a" stop-opacity="${r1(0.34 * a * 100) / 100}"/></linearGradient></defs>
        <polygon points="${p(-2.1, 0.88)} ${p(1.6, 0.88)} ${p(1.9, 0.05)} ${p(-2.4, 0.05)}" fill="url(#rum-ute-affar)"/>`;
    }
    if (sno) {
      // hjulspåren i filerna och plogvallen längs kanten
      s += `<g fill="${mix(road, '#000', 0.25)}">${[1.3, 1.72].map((d) => `<rect x="-80" y="${r1(framY(d) - 2.5)}" width="1100" height="5"/>`).join('')}</g>`;
      const RP = rng(9);
      let p = 'M-80 418';
      for (let x = -80; x <= 1020; x += 20) p += ` Q${x + 10} ${r1(404 - RP() * 8)} ${x + 20} ${r1(416 + RP() * 3)}`;
      s += `<path d="${p} L1020 420 L-80 420 Z" fill="${mix(sno, '#9aa2ad', 0.2)}"/>`;
      p = `M-80 ${yKant}`;
      for (let x = -80; x <= 1020; x += 26) p += ` Q${x + 13} ${r1(yRann - 3 - RP() * 7)} ${x + 26} ${r1(yRann + 1 + RP() * 3)}`;
      s += `<path d="${p} L1020 ${yKant} Z" fill="${sno}"/>`;
    } else {
      // linjen mellan filerna
      const yl = framY(1.51);
      let d = '';
      for (let x = -60; x < 1020; x += 260) d += `M${x} ${r1(yl)}h100`;
      s += `<path d="${d}" stroke="${mix('#3a3c40', '#e2e0da', L.dag)}" stroke-width="3" opacity="${r1(0.35 + 0.25 * L.dag)}"/>`;
      if (v.blott && L.dag > 0.2) {
        s += `<rect x="-80" y="416" width="1100" height="60" fill="${L.sky[2]}" opacity="${r1(0.18 * L.dag)}" filter="url(#rum-ute-b4)"/>`;
        const RP = rng(13);
        for (let i = 0; i < 7; i++) s += `<ellipse cx="${r1(RP() * 1000)}" cy="${r1(422 + RP() * 58)}" rx="${r1(20 + RP() * 40)}" ry="${r1(2 + RP() * 3)}" fill="${L.sky[1]}" opacity="${r1(0.25 * L.dag)}"/>`;
      }
    }
    // höstlöven på trottoaren mittemot, och i rännstenen och på trottoaren utanför (större: närmare)
    if (lov === 'host' && !sno) {
      const RL = rng(29);
      const cols = ['#c7682a', '#d99a2b', '#a8452a', '#8a5a2a', '#c9a23a'];
      for (let i = 0; i < 70; i++) {
        const x = r1(RL() * 1060 - 60);
        const y = r1(i < 40 ? 401 + RL() * 13 : yRann + RL() * 70);
        const k = i < 40 ? 1 : 2.6 + (y - yRann) / 30;
        s += `<ellipse cx="${x}" cy="${y}" rx="${r1((1.4 + RL() * 1.4) * k)}" ry="${r1((0.8 + RL() * 0.6) * k)}" fill="${pick(RL, cols)}" opacity="${r1(0.3 + 0.6 * L.dag)}" transform="rotate(${r1(RL() * 180)} ${x} ${y})"/>`;
      }
    }

    // brons lyktstolpe (i dörren) och vägglyktan på hörnhuset
    const sx = 140;
    s += `<rect x="${sx - 2}" y="250" width="4" height="152" fill="${mix('#1a1c22', '#3e4248', L.dag)}"/><path d="M${sx - 7} 252 Q${sx} 242 ${sx + 7} 252 Z" fill="${mix('#14161a', '#2e3236', L.dag)}"/>
      <path d="M716 296 h8 v-4 M722 292 v-8" stroke="${mix('#14161a', '#3a3c40', L.dag)}" stroke-width="1.6" fill="none"/><rect x="718" y="284" width="8" height="10" rx="1.5" fill="${mix('#14161a', '#2e3236', L.dag)}"/>`;
    if (sno) s += `<path d="M${sx - 7} 248 Q${sx} 240 ${sx + 7} 248 Z" fill="${sno}"/>`;
    for (const [lx, ly, k] of [[sx, 252, 0.9], [722, 289, 0.7]]) {
      if (L.lampor) {
        const big = 1 + 0.8 * L.dimma;
        s += `<circle cx="${lx}" cy="${ly}" r="${r1(60 * k * big)}" fill="url(#rum-sodium)" opacity="${r1(0.7 * (1 - L.dag))}"/><circle cx="${lx}" cy="${ly}" r="${r1(4 * k)}" fill="#ffe2b0"/>`;
        if (L.wet || v.blott) s += `<rect x="${lx - 7}" y="418" width="14" height="66" fill="url(#rum-streak)" filter="url(#rum-ute-b4)" opacity="${r1(1 - L.dag)}"/>`;
        else if (sno) s += `<ellipse cx="${lx}" cy="418" rx="70" ry="16" fill="#ffc27a" opacity="${r1(0.16 * (1 - L.dag))}" filter="url(#rum-ute-b4)"/>`;
      } else s += `<circle cx="${lx}" cy="${ly}" r="${r1(3 * k)}" fill="${mix('#2a2a2a', '#c8ccd0', L.dag)}"/>`;
    }

    // dimman lägger sig över allt
    if (L.dimma > 0.05) s += `<rect x="-80" y="90" width="1100" height="640" fill="${mix('#2a2622', '#aeb3b6', L.dag)}" opacity="${r1(0.5 * L.dimma)}"/>`;
    // (allt i en SVG: i telefonen blir den en enda grov duk, bakaGata)
    return `<svg class="rum-layer" viewBox="0 0 1600 1000" style="left:0; top:0; width:1600px; height:1000px"><defs><filter id="rum-ute-b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>${s}</svg>`;
  }

  // ---------- livet på gatan ----------

  // Färgen i gatans ljus: dämpad på natten, lite varm under lyktorna.
  const tone = (c, L) => mix(mix('#06070a', c, 0.18 + 0.82 * L.dag), '#ffb060', 0.1 * (1 - L.dag));

  // En som går (fötterna i 0, vänd åt höger): benen och armarna svänger.
  function person(o, L) {
    const t = (c) => tone(c, L);
    let s = '';
    const top = -26 * o.h;
    const hip = -13 * o.h;
    const leg = 13.5 * o.h;
    for (const b2 of ['', ' b2']) s += `<g transform="translate(0 ${r1(hip)})"><g class="ben${b2}"><rect x="-1.7" y="0" width="3.4" height="${r1(leg)}" rx="1.5" fill="${t(o.legs)}"/><rect x="-1.9" y="${r1(leg - 1.6)}" width="5" height="2.2" rx="1" fill="${t(o.shoe)}"/></g></g>`;
    if (o.shorts) s += `<rect x="-4.2" y="${r1(hip - 1)}" width="8.4" height="5" rx="2" fill="${t(o.legs2)}"/>`;
    const bottom = o.long ? -7.5 * o.h : hip + 1;
    s += `<rect x="-4.7" y="${r1(top)}" width="9.4" height="${r1(bottom - top)}" rx="3" fill="${t(o.coat)}"/>`;
    if (o.bag) s += `<rect x="3.5" y="${r1(hip - 2)}" width="5" height="6" rx="1" fill="${t(o.bag)}"/>`;
    const arm = o.bare ? o.skin : o.coat2;
    if (o.umb) {
      s += `<rect x="1" y="${r1(top + 1)}" width="2.8" height="8" rx="1.3" fill="${t(arm)}" transform="rotate(-35 2 ${r1(top + 2)})"/><line x1="4.5" y1="${r1(top - 2)}" x2="4.5" y2="${r1(top - 14)}" stroke="#111" stroke-width=".9"/>`;
      s += o.vand
        ? `<path d="M-6 ${r1(top - 22)} L4.5 ${r1(top - 13)} L15 ${r1(top - 22)} Q4.5 ${r1(top - 16)} -6 ${r1(top - 22)} Z" fill="${t(o.umb)}"/>`
        : `<path d="M-7.5 ${r1(top - 11)} Q4.5 ${r1(top - 26)} 16.5 ${r1(top - 11)} Q10.5 ${r1(top - 13)} 4.5 ${r1(top - 11)} Q-1.5 ${r1(top - 13)} -7.5 ${r1(top - 11)} Z" fill="${t(o.umb)}"/>`;
    } else if (o.tree) {
      s += `<path d="M-2 ${r1(top + 3)} L-22 ${r1(top + 10)} L-22 ${r1(top - 2)} Z M-4 ${r1(top + 4)} L18 ${r1(top - 1)}" fill="${t('#2e5a32')}" stroke="${t('#6a4a2a')}" stroke-width="1.2"/><rect x="-1" y="${r1(top + 1)}" width="2.8" height="8" rx="1.3" fill="${t(arm)}" transform="rotate(-60 0 ${r1(top + 2)})"/>`;
    } else {
      s += `<g transform="translate(0 ${r1(top + 1.5)})"><g class="arm"><rect x="-1.4" y="0" width="2.8" height="${r1(11 * o.h)}" rx="1.3" fill="${t(arm)}"/></g></g>`;
    }
    if (o.leash) s += `<path d="M1.5 ${r1(hip + 2)} Q8 ${r1(hip + 8)} 13 -8" fill="none" stroke="${t('#2a2a2a')}" stroke-width=".7"/>`;
    s += `<rect x="-1.3" y="${r1(top - 2.2)}" width="2.6" height="3" fill="${t(o.skin)}"/><circle cx=".6" cy="${r1(top - 4.6)}" r="${r1(3.3 * o.h)}" fill="${t(o.skin)}"/>`;
    if (o.hat) s += `<path d="M-2.9 ${r1(top - 5)} Q.6 ${r1(top - 11.5)} 4.1 ${r1(top - 5)} Z" fill="${t(o.hat)}"/>`;
    else s += `<path d="M-2.8 ${r1(top - 4.5)} Q.6 ${r1(top - 9.4)} 4 ${r1(top - 5.6)} Q1 ${r1(top - 6.8)} -1.8 ${r1(top - 3)} Z" fill="${t(o.hair)}"/>`;
    return s;
  }

  function dog(L, c) {
    const t = (x) => tone(x, L);
    let s = '';
    for (const [x, b2] of [[-4, ''], [-3, ' b2'], [4, ''], [5, ' b2']]) s += `<g transform="translate(${x} -5)"><g class="ben fort${b2}"><rect x="-.8" y="0" width="1.6" height="5" fill="${t(c)}"/></g></g>`;
    return `${s}<ellipse cx="0" cy="-6.5" rx="6.5" ry="2.8" fill="${t(c)}"/><circle cx="6.8" cy="-8.8" r="2.4" fill="${t(c)}"/><path d="M-6 -7 Q-9 -10 -8.5 -12" stroke="${t(c)}" stroke-width="1.4" fill="none"/>`;
  }

  // ---------- de som går: samma gång som framför affären ----------
  //
  // De som går på trottoaren mittemot går som de som går förbi framför affären (rum-fasad.js, RumFasad.gang): samma
  // sätt att gå (vanlig, rask, strosar, studsar, lunkar, rak, trippar, släntrar, hasar, kliver, stram, fryser,
  // haltar, på halkan, med käpp och springer, och händerna på ryggen), var och en på sitt sätt, och samma ställning i
  // varje bild (stalln): foten i marken står still mot stenen, höften gungar, knät böjs, armarna pendlar emot benen och
  // överkroppen lutar. Figuren ritas i centimeter (fötterna i 0,
  // vänd åt höger, samma huvud och hår som framför affären) och förminskas till gatan, CMG px per cm, och delarnas
  // grupper (g-…) får sina vinklar ur ställningen (rorelse, gangLas). Farten är steglängden gånger takten, så att
  // fötterna inte glider. Utan rum-fasad.js går de som förut (person).
  const CMG = 0.19;
  // sätten att gå för figurerna i gatans SVG (data-gang: platsen här): st, var i varvet den börjar (fas) och den
  // senaste ställningen (t, P)
  const GANGAR = [];
  // Gångcykeln (gangen i rum-fasad.js) en gång per sätt att gå, utan det som skiljer var och en i benen: i gatans
  // storlek syns det inte, och att räkna den för var och en tog ungefär 10 ms per figur i en långsam telefon. Var och
  // en är ändå olika i takten, lutningen, armarna och längden (och farten följer).
  const TABELL = {};
  function gangFor(GG, R, namn, kalla) {
    const st = GG.stil(R, { stil: namn, kalla });
    let s0 = TABELL[st.namn];
    if (!s0) {
      s0 = GG.stil(() => 0.5, { stil: st.namn });
      GG.stalln(0, s0);
      TABELL[st.namn] = s0;
    }
    for (const k of ['S', 'B', 'x0', 'hal', 'lyft', 'kna', 'hojd', 'studs', 'tab', 'tab2', 'fas2', 'ontMitt']) st[k] = s0[k];
    return st;
  }
  // handen för armen som hålls stilla ([axel, armbåge], grader; cm från fötterna, som handVid i rum-fasad.js)
  const handVid = ([a, b]) => {
    const u = (a * Math.PI) / 180;
    const w = ((a + b) * Math.PI) / 180;
    return [1 - 29 * Math.sin(u) - 31 * Math.sin(w), -142 + 29 * Math.cos(u) + 31 * Math.cos(w)];
  };
  // F: händerna (fickaF, fickaB: i fickan; fastF: den närmre armen hålls stilla, paraplyet, kopplet …)
  function folk(o, L, F, GG) {
    const t = (c) => tone(c, L);
    const bak = (c) => mix(tone(c, L), '#000000', 0.3);
    const at = (x, y, inner) => `<g transform="translate(${r1(x)} ${r1(y)})">${inner}</g>`;
    const g = (d, inner, b2) => `<g class="g-${d}${b2 ? ' b2' : ''}">${inner}</g>`;
    // (överkroppen lutar kring höften)
    const luta = (inner) => at(0, -90, g('luta', at(0, 90, inner)));
    // ett ben från höften: låret, smalbenet och skon (det bortre mörkare)
    const ben = (b2) => {
      const f = b2 ? bak : t;
      const lar = o.shorts
        ? `<rect x="-6.4" y="-4" width="12.8" height="50" rx="6" fill="${f(o.skin)}"/><rect x="-7.6" y="-7" width="15.2" height="25" rx="5" fill="${f(o.legs2)}"/>`
        : `<rect x="-7" y="-7" width="14" height="54" rx="6.5" fill="${f(o.legs)}"/>`;
      const vad = `<rect x="-5.2" y="-3" width="10.4" height="41" rx="4.6" fill="${f(o.shorts ? o.skin : o.legs)}"/>`;
      const sko = `<path d="M-6.5 -3.5 H5 Q15 -3 16.5 3 V7 H-6.5 Z" fill="${f(o.shoe)}"/>`;
      return at(0, -90, g('lar', lar + at(0, 45, g('kna', vad + at(0, 38, g('fot', sko, b2)), b2)), b2));
    };
    // en arm från axeln: pendlar efter ställningen, eller hålls stilla (fast); handen syns inte i fickan
    const arm = (b2, fast) => {
      const f = b2 ? bak : t;
      const over = o.bare
        ? `<rect x="-5.4" y="-2" width="10.8" height="33" rx="5.2" fill="${f(o.skin)}"/><rect x="-6.4" y="-3" width="12.8" height="14" rx="5" fill="${f(o.coat)}"/>`
        : `<rect x="-6" y="-2.5" width="12" height="34" rx="5.6" fill="${f(o.coat)}"/>`;
      const hand = (b2 ? F.fickaB : F.fickaF) ? '' : `<circle cx=".4" cy="31" r="4.6" fill="${f(o.skin)}"/>`;
      const under = `<rect x="-4.8" y="-2.5" width="9.6" height="32" rx="4.6" fill="${f(o.bare ? o.skin : o.coat2)}"/>${hand}`;
      if (fast) return at(1, -142, `<g transform="rotate(${fast[0]})">${over}${at(0, 29, `<g transform="rotate(${fast[1]})">${under}</g>`)}</g>`);
      return at(1, -142, g('arm', over + at(0, 29, g('armb', under, b2)), b2));
    };
    // kroppen: jackan till höften eller kappan till knäna, ränderna på joggarens överdel och väskan på axeln
    const nere = o.long ? -42 : -86;
    const hR = o.long ? 19 : 15.5;
    const hL = o.long ? -20 : -16;
    let kropp = `<path d="M-13 -140 Q-16 -151 -7 -152.5 H8 Q16 -151.5 15 -140 L${hR} ${nere} Q0 ${nere + 2.5} ${hL} ${nere} Z" fill="${t(o.coat)}"/>`;
    if (o.rand) kropp += `<path d="M-14 -127 Q0 -129 15.6 -127 L15.8 -119 Q0 -121 -14.2 -119 Z" fill="${t(o.rand)}"/>`;
    if (o.bag) kropp += `<path d="M8 -151 L-11 -104" stroke="${bak(o.bag)}" stroke-width="2.4"/><rect x="-24" y="-108" width="18" height="23" rx="3" fill="${t(o.bag)}"/>`;
    // huvudet: håret, mössan, kepsen eller pannbandet
    let huvud = `<path d="${GG.HUVUD}" fill="${t(o.skin)}"/>`;
    const har = `<path d="${GG.HAR[o.harStil] || GG.HAR.kort}" fill="${t(o.hair)}"/>`;
    if (o.hatt === 'mossa') huvud += `<path d="M-10.5 -167.5 Q-11.5 -188.5 0.5 -188.5 Q12 -188.5 11.5 -169.5 Z" fill="${t(o.hat)}"/>`;
    else if (o.hatt === 'keps') huvud += `${har}<path d="M-10 -167 Q-10 -180 1 -180 Q10.5 -180 11 -171 L19.5 -168.5 Q15 -166 10 -166.5 L-10 -165 Z" fill="${t(o.hat)}"/>`;
    else if (o.hatt === 'band') huvud += `${har}<path d="M-11 -175.5 Q0.5 -179 12.2 -174 L12 -168.6 Q0.5 -173.4 -11.2 -170 Z" fill="${t(o.hat)}"/>`;
    else huvud += har;
    // (så få delar som möjligt: varje del ritas om i varje bild, och i telefonen i processorn)
    let s = g('kropp', arm(true, F.fastB) + ben(true) + ben(false) + luta(kropp + huvud));
    // käppen i den närmre handen (handtaget och vinkeln ur ställningen, kappen i rum-fasad.js)
    if (o.kapp) {
      const C = GG.KAPP;
      s += g('kapp', `<rect x="-1.3" y="4" width="2.6" height="${C - 7}" fill="${t(o.kapp)}"/><rect x="-1.9" y="${C - 3.5}" width="3.8" height="3.5" fill="${t('#141414')}"/><path d="M-1.4 5 Q-2.4 -3.6 4.6 -4.6 Q10.4 -5 11.4 -0.6 L8.8 0 Q8 -2.2 4.8 -2 Q0.8 -1.6 1.4 5 Z" fill="${t(o.kapp)}"/>`);
    }
    // den närmre armen och det den håller: paraplyet (som vinden ibland vänder) och julgranen under armen
    let fram = arm(false, F.fastF);
    if (o.tree) fram = `<path d="M44 -114 L-112 -80 L-106 -120 Z" fill="${t('#2a4e30')}"/><path d="M44 -114 L60 -117" stroke="${t('#5a3a22')}" stroke-width="4"/>${fram}`;
    if (o.umb) {
      // (som framför affären, men lägre: skaftet från handen, duken strax över huvudet)
      const [hx, hy] = handVid(F.fastF);
      fram += `<path d="M${r1(hx)} ${r1(hy)} V${r1(hy - (o.vand ? 74 : 105))}" stroke="#141414" stroke-width="2.4"/>`;
      fram += at(hx - 24, hy + 138, o.vand
        ? `<path d="M-34 -252 C-26 -226 4 -211 24 -210 C44 -211 74 -226 82 -252 Q66 -240 56 -248 Q44 -236 24 -242 Q4 -236 -8 -248 Q-18 -240 -34 -252 Z" fill="${t(o.umb)}"/>`
        : `<path d="M-42 -206 C-38 -229 -8 -243 24 -243 C56 -243 86 -229 90 -206 Q82 -212 74 -206 Q66 -213 57 -206 Q49 -213 41 -206 Q32 -213 24 -206 Q16 -213 7 -206 Q-1 -213 -9 -206 Q-17 -213 -26 -206 Q-34 -212 -42 -206 Z" fill="${t(o.umb)}"/>`);
    }
    return s + g('kropp', luta(fram));
  }
  // Ställningen för delen r efter t ms: ur sättet att gå (stalln i rum-fasad.js), en gång per figur och bild. Var i
  // varvet räknas ur tiden: farten är densamma hela vägen (rum-gar i rum-ute.css), så foten står still ändå.
  function gangLas(r, t) {
    const G = r.G;
    if (G.t !== t) {
      G.t = t;
      G.P = window.RumFasad.gang.stalln((t / 1000) * G.st.takt + G.fas, G.st);
    }
    const P = G.P;
    const rot = (a, x = 0, y = 0) => { const c = Math.cos(a); const s = Math.sin(a); return [c, s, -s, c, x, y]; };
    const sida = r.b2 ? P.B : P.F;
    const a = r.b2 ? P.aB : P.aF;
    switch (r.del) {
      case 'kropp': return [1, 0, 0, 1, P.bx, P.by];
      case 'luta': return rot(P.lut);
      case 'lar': return rot(sida[0]);
      case 'kna': return rot(sida[1]);
      case 'fot': return rot(sida[2]);
      // (armarna hänger lodrätt fast överkroppen lutar, och axlarna rullar hos den som släntrar)
      case 'arm': return rot(a[0] - P.lut, (r.b2 ? P.sB : P.sF) || 0);
      case 'armb': return rot(a[1]);
      case 'kapp': return P.kapp ? rot(P.kapp[2], P.kapp[0], P.kapp[1]) : [1, 0, 0, 1, 14, -84];
      default: return [1, 0, 0, 1, 0, 0];
    }
  }

  function wheel(cx, cy, r, L) {
    return `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="none" stroke="${tone('#1a1a1a', L)}" stroke-width="1.3"/><g class="hjul"><line x1="${-r}" y1="0" x2="${r}" y2="0" stroke="${tone('#777', L)}" stroke-width=".5"/><line x1="0" y1="${-r}" x2="0" y2="${r}" stroke="${tone('#777', L)}" stroke-width=".5"/></g></g>`;
  }

  const coats = (v) => (v.kanns < 3 ? ['#1c1f26', '#2b2f38', '#3a3226', '#4a4238', '#20283a', '#5a2a2a', '#6b6458', '#2e3a2e']
    : v.kanns < 15 ? ['#3d4a5c', '#6b5a44', '#7a7a70', '#2f3d36', '#8a5a3a', '#2a3550', '#c8b89a', '#4a4a50']
      : ['#e8e4dc', '#c8d8e8', '#d84a3a', '#3a6ab0', '#f0c040', '#2e2e30', '#7ab07a', '#f3ead9']);

  function gatliv(v, L) {
    const R = rng(v.ar * 389 + v.manad * 37 + v.dag * 3 + (v.timme >> 1));
    const h = v.timme + v.minut / 60;
    const regn = v.fall === 'regn' || v.fall === 'blandat';
    const sno = v.fall === 'sno';
    const kallt = v.kanns < 3;
    const varmt = v.kanns >= 16;
    let s = '';
    // o: y (fötterna/hjulen), dir, speed (px/s), pause (s utanför bild),
    // w/ht halva bredden och höjden före skalan k, o.egen: gungar inte som helhet (gången har sin egen höft)
    const walk = (inner, o) => {
      const k = o.k || 1;
      const hw = Math.ceil((o.w || 30) * k);
      const ht = Math.ceil((o.ht || 56) * k);
      const dist = 1000 + 2 * (hw + 40);
      const fran = o.dir > 0 ? -(hw + 40) : 1000 + hw + 40;
      const cyc = dist / o.speed + o.pause;
      const till = fran + o.dir * cyc * o.speed;
      const fore = r1(R() * cyc);
      s += `<svg class="rum-gar${o.cls ? ` ${o.cls}` : ''}" style="left:${-hw}px; top:${r1(o.y - ht)}px; --fran:${fran}px; --till:${r1(till)}px; --steg:${o.steg || 0.9}s; animation-duration:${r1(cyc)}s; animation-delay:-${fore}s" viewBox="${-hw} ${-ht} ${2 * hw} ${ht + 6}" width="${2 * hw}" height="${ht + 6}"><g transform="scale(${o.dir * k} ${k})">${o.egen ? inner : `<g class="gung">${inner}</g>`}</g></svg>`;
    };

    // pulkan med barnet i, bakom den som drar (px)
    const pulka = (o) => `<g transform="translate(-30 0)"><path d="M-8 -2 H8 Q11 -2 11 -5" fill="none" stroke="${tone('#c8322a', L)}" stroke-width="2"/><ellipse cx="0" cy="-6" rx="4" ry="4.5" fill="${tone('#2a6ab0', L)}"/><circle cx=".5" cy="-12" r="2.6" fill="${tone(o.skin, L)}"/><path d="M-2 -13 Q.5 -17 3 -13 Z" fill="${tone('#e8b923', L)}"/></g>`;

    // En som går med fasadens gång (folk): vem (ung, vuxen, äldre), med vad (hund, pulka, gran, joggar) och på vilket
    // sätt, som framför affären – den äldre strosar och går ibland med käpp, den unga släntrar ibland, den som blir
    // blöt skyndar sig och ibland springer, i rusningen springer någon till bussen, och på halkan går de flesta
    // försiktigt.
    const gaende = (o) => {
      const GG = window.RumFasad.gang;
      const roll = R();
      let typ = 'gar';
      if (roll < 0.18 && h > 6 && h < 23) typ = 'hund';
      else if (roll < 0.3 && v.snotackt && L.dag > 0.3) typ = 'pulka';
      else if (roll < 0.36 && v.manad === 12 && v.dag >= 5 && v.dag <= 23 && h > 9 && h < 20) typ = 'gran';
      else if (roll < 0.42 && !v.snotackt && !halt && !(regn && v.mangd > 0.5) && v.kanns > -6 && ((h > 6 && h < 9.5) || (h > 16.5 && h < 21.5))) typ = 'jogg';
      const vem = typ === 'jogg' ? pick(R, ['ung', 'ung', 'vuxen']) : pick(R, ['ung', 'ung', 'vuxen', 'vuxen', 'vuxen', 'aldre']);
      if (vem === 'aldre') o.hair = pick(R, ['#d8d0c0', '#a8a8a4', '#c8c8c4', '#8a8a86']);
      o.harStil = vem === 'aldre' ? pick(R, ['flint', 'kort', 'page']) : pick(R, ['kort', 'kort', 'page', 'lockar', 'gel', 'knut']);
      o.hatt = o.hat ? 'mossa' : null;
      if (typ === 'gran') { o.tree = true; o.umb = null; }
      if (typ === 'jogg') {
        // (myskläder i två färger, eller shorts och t-shirt när det är varmt; gympadojor, pannband eller mössa)
        const b = pick(R, [['#4a2a6a', '#1e8a8a'], ['#1d3a7a', '#d8407a'], ['#1e6a4a', '#4a2a6a'], ['#c8322a', '#1d2a4a'], ['#10306a', '#e8b923'], ['#2a2a30', '#2a8ad0'], ['#1e8a8a', '#e8e4dc']]);
        Object.assign(o, { coat: b[0], rand: b[1], legs: b[0], long: false, bag: null, umb: null, shoe: '#e8e4dc', hat: null, hatt: null, bare: false, shorts: false });
        if (varmt) Object.assign(o, { bare: true, shorts: true, legs2: pick(R, ['#1a1a1a', '#3a4a66', '#d8ccb0']), legs: o.skin, coat: pick(R, ['#e8e4dc', '#c8322a', '#2a5ab0', '#f0c040']), rand: null });
        o.coat2 = mix(o.coat, '#000000', 0.15);
        if (kallt || sno) { o.hatt = 'mossa'; o.hat = pick(R, ['#a8322a', '#1a1a1a', '#2a4a7a']); }
        else if (R() < 0.45) { o.hatt = 'band'; o.hat = pick(R, ['#e8e4dc', '#c8322a', '#e8b923', '#2a8ad0']); }
      }
      let namn;
      if (typ === 'jogg') namn = 'springer';
      else if (typ === 'gar' && vem === 'aldre' && !o.umb && R() < 0.35) {
        o.kapp = pick(R, ['#3a2416', '#1a1a1a', '#5a3a22', '#9a9a9a']);
        namn = 'kapp';
      } else if (typ === 'hund') namn = pick(R, ['vanlig', 'vanlig', 'strosar', 'rask']);
      else if (typ === 'pulka' || typ === 'gran') namn = pick(R, ['vanlig', 'strosar']);
      else {
        const blot = regn && v.mangd > 0.45 && !o.umb;
        const rusar = !o.umb && !halt && ((h > 7 && h < 9) || (h > 16 && h < 18)) && R() < 0.06;
        if ((blot && !halt && R() < 0.4) || rusar) namn = 'springer';
        else if (blot) namn = 'rask';
        else if (kallt && !o.umb && R() < 0.3) namn = 'frusen';
        else if (R() < 0.05) namn = 'haltar';
        else if (GG.GSTIL[vem]) namn = pick(R, GG.GSTIL[vem]);
      }
      if (halt && namn !== 'springer' && namn !== 'kapp' && R() < 0.65) namn = 'halkar';
      if (varmt && typ === 'gar' && !o.umb && !o.hatt && R() < 0.25) { o.hatt = 'keps'; o.hat = pick(R, ['#2a4a7a', '#e8e4dc', '#c8322a']); }
      const st = gangFor(GG, R, namn, kallt);
      // (en del äldre går lite framåtböjda, och den som strosar har ibland händerna på ryggen)
      if (vem === 'aldre' && !['kapp', 'springer', 'halkar'].includes(st.namn) && R() < 0.4) st.lut += 4 + R() * 3;
      if (vem === 'aldre' && typ === 'gar' && !o.umb && ['strosar', 'rak', 'stram', 'lunkar'].includes(st.namn) && R() < 0.4) { st.armar = 'rygg'; st.ficka = ''; }
      // den närmre armen håller paraplyet, kopplet, granen under armen eller pulkans snöre; en ledig hand kan vara i
      // fickan
      const F = { fastF: o.umb ? [-6, -104] : typ === 'hund' ? [-12, -35] : typ === 'gran' ? [8, -66] : typ === 'pulka' ? [24, 6] : null };
      st.ficka = [...st.ficka].filter((x) => x === 'B' || (!F.fastF && !o.kapp)).join('');
      F.fickaF = st.ficka.includes('F');
      F.fickaB = st.ficka.includes('B');
      const K = CMG * o.h;
      const gi = GANGAR.push({ st, fas: R(), t: null, P: null }) - 1;
      let inner = `<g data-gang="${gi}" transform="scale(${r1(K * 1000) / 1000})">${folk(o, L, F, GG)}</g>`;
      if (typ === 'hund' || typ === 'pulka') {
        const [hx, hy] = handVid(F.fastF).map((x) => r1(x * K));
        if (typ === 'hund') inner += `<path d="M${hx} ${hy} Q${r1(hx + 6)} ${r1(hy + 9)} 22 -8" fill="none" stroke="${tone('#2a2a2a', L)}" stroke-width=".7"/><g class="gung"><g transform="translate(16 0)">${dog(L, pick(R, ['#3a2a1a', '#d8c09a', '#1a1a1a', '#8a6a4a']))}</g></g>`;
        else inner += `<path d="M${hx} ${hy} L-24 -4" stroke="${tone('#222', L)}" stroke-width=".7"/>${pulka(o)}`;
      }
      // (fart: två steg per varv i takten, så att foten i marken står still; hunden trippar efter, steg)
      walk(inner, { y: 405 + R() * 6, dir: R() < 0.5 ? 1 : -1, speed: st.S * K * st.takt, pause: typ === 'jogg' ? 60 + R() * 120 : 15 + R() * 70, steg: 0.3, cls: typ, w: typ === 'pulka' ? 42 : 30, egen: true });
    };

    // de som går på trottoaren mittemot
    const T = trafik(v);
    const n = T.gaende;
    const cs = coats(v);
    const skins = ['#e9c2a2', '#d8a27c', '#b27a52', '#8a5636', '#f0cfb4'];
    const hairs = ['#2a1d14', '#5a3e24', '#c9a56a', '#1a1a1a', '#8a6a4a', '#d8d0c0'];
    const GG = window.RumFasad && window.RumFasad.gang;
    GANGAR.length = 0;
    // (halt: snö på marken kring nollan, eller blött och minusgrader, som framför affären)
    const halt = (v.snotackt && v.temp > -8 && v.temp < 2.5) || (v.blott && v.temp < 0.5);
    for (let i = 0; i < n; i++) {
      const o = {
        h: 0.92 + R() * 0.16, coat: pick(R, cs), legs: pick(R, ['#1e2430', '#2b3448', '#3a3a3a', '#4a4236', '#202020']), shoe: '#141414',
        skin: pick(R, skins), hair: pick(R, hairs), long: kallt ? R() < 0.7 : !varmt && R() < 0.3,
      };
      o.coat2 = mix(o.coat, '#000000', 0.15);
      if (varmt) { o.bare = true; o.shorts = R() < 0.6; if (o.shorts) { o.legs2 = pick(R, ['#d8ccb0', '#3a4a66', '#6a7a5a']); o.legs = o.skin; } }
      if (kallt || sno) o.hat = R() < (kallt ? 0.75 : 0.4) ? pick(R, ['#a8322a', '#1a1a1a', '#d8d0c0', '#2a4a7a', '#5a5a5a']) : null;
      if (regn && R() < 0.75) { o.umb = pick(R, ['#111215', '#111215', '#1a2a4a', '#8a1e1e', '#2a2a2a']); o.vand = v.vind > 9 && R() < 0.35; }
      if (regn && !o.umb && R() < 0.5) o.coat = pick(R, ['#e8b923', '#c8322a', '#2a5a3a']);
      if (R() < 0.3) o.bag = pick(R, ['#d8c8a8', '#3a3a3a', '#7a4a2a']);
      if (GG) {
        gaende(o);
        continue;
      }
      let inner = person(o, L);
      let speed = 24 + R() * 10;
      let kind = 'gar';
      const roll = R();
      if (roll < 0.18 && h > 6 && h < 23) { kind = 'hund'; o.leash = true; inner = person(o, L) + `<g transform="translate(16 0)">${dog(L, pick(R, ['#3a2a1a', '#d8c09a', '#1a1a1a', '#8a6a4a']))}</g>`; speed = 22; }
      else if (roll < 0.3 && v.snotackt && L.dag > 0.3) {
        kind = 'pulka';
        inner = person(o, L) + `<path d="M-2 -12 L-24 -4" stroke="${tone('#222', L)}" stroke-width=".7"/>${pulka(o)}`;
        speed = 20;
      } else if (roll < 0.36 && v.manad === 12 && v.dag >= 5 && v.dag <= 23 && h > 9 && h < 20) { kind = 'gran'; o.tree = true; o.umb = null; inner = person(o, L); speed = 22; }
      if (varmt && kind === 'gar' && o.umb == null && R() < 0.25) { o.hat = pick(R, ['#2a4a7a', '#e8e4dc', '#c8322a']); inner = person(o, L); }
      walk(inner, { y: 405 + R() * 6, dir: R() < 0.5 ? 1 : -1, speed, pause: 15 + R() * 70, steg: r1(0.75 + R() * 0.25), cls: kind, w: kind === "pulka" ? 42 : 30 });
    }
    // på cykel (trafik: inte i snön eller i ösregn)
    if (T.cyklar) {
      for (let i = 0; i < T.cyklar; i++) {
        const c = pick(R, cs);
        const sk = pick(R, skins);
        const bike = `${wheel(-9, -6, 6, L)}${wheel(10, -6, 6, L)}<path d="M-9 -6 L-1 -6 L-4 -16 M-1 -6 L7 -16 L-4 -16 M7 -16 L10 -6 M7 -16 L8 -20" fill="none" stroke="${tone('#3a3a3a', L)}" stroke-width="1.2"/>`;
        const rider = `<g transform="translate(-4 -16)"><g class="ben"><rect x="-1.5" y="0" width="3" height="11" rx="1.4" fill="${tone('#2b3448', L)}"/></g></g><g transform="translate(-4 -16)"><g class="ben b2"><rect x="-1.5" y="0" width="3" height="11" rx="1.4" fill="${tone('#2b3448', L)}"/></g></g>
          <path d="M-5.5 -15 L-2 -29 L4 -27 L3 -15 Z" fill="${tone(c, L)}"/><path d="M1 -26 L8 -20" stroke="${tone(varmt ? sk : c, L)}" stroke-width="2.6" stroke-linecap="round"/><circle cx="0" cy="-32" r="3.2" fill="${tone(sk, L)}"/>
          ${R() < 0.6 ? `<path d="M-3.6 -32.5 Q0 -38 3.6 -32.5 Z" fill="${tone(pick(R, ['#1a1a1a', '#c8322a', '#e8e4dc', '#2a6ab0']), L)}"/>` : ''}`;
        const light = L.lampor ? '<circle cx="12" cy="-17" r="1.6" fill="#fffbe8"/><circle cx="12" cy="-17" r="6" fill="#fff2cc" opacity=".4"/><circle cx="-11" cy="-12" r="1.3" fill="#ff3b30"/>' : '';
        walk(bike + rider + light, { y: 418 + R() * 8, dir: R() < 0.5 ? 1 : -1, speed: 70 + R() * 30, pause: 30 + R() * 90, steg: 0.45, cls: 'cykel', w: 22, ht: 42 });
      }
    }

    // räven mitt i natten
    if ((h >= 23.5 || h < 5) && !(v.fall && v.mangd > 0.6)) {
      const fox = `${dog(L, '#c8642a')}<path d="M-6 -7 Q-13 -6 -14 -10 Q-10 -9 -6 -8" fill="${tone('#e8e0d0', L)}"/><path d="M5.5 -11 L6 -14.5 L8 -11.5 Z" fill="${tone('#c8642a', L)}"/>`;
      walk(fox, { y: 409, dir: -1, speed: 40, pause: 140, steg: 0.35, cls: 'rav', k: 0.9, w: 20, ht: 18 });
    }

    // flaggan på flaggdagarna
    if (flagga(v)) {
      s += `<svg class="rum-flagga" style="left:742px; top:176px" viewBox="-1 -1 28 20" width="28" height="20"><g class="vaj" style="animation-duration:${r1(Math.max(0.9, 3 - v.vind * 0.2))}s"><path d="M0 0 Q12 -1.5 25 1.5 L25 16.5 Q12 13.5 0 15 Z" fill="${tone('#1f62ad', L)}"/><path d="M8 0 V15 M0 7.2 Q12 6 25 9" stroke="${tone('#f6c71c', L)}" stroke-width="3" fill="none"/></g></svg>`;
    }

    // löven som blåser förbi
    const host =(v.manad === 9 && v.dag >= 20) || v.manad === 10 || (v.manad === 11 && v.dag <= 25);
    if (host && !v.snotackt && !sno) {
      const nl = Math.round(5 + Math.min(14, v.vind * 1.6));
      const cols = ['#c7682a', '#d99a2b', '#a8452a', '#8a5a2a', '#c9a23a'];
      for (let i = 0; i < nl; i++) {
        const y0 = 150 + R() * 260;
        const sp = 110 + R() * 140 + v.vind * 10;
        const dur = 1150 / sp;
        const cyc = dur + 4 + R() * 18;
        const c = tone(pick(R, cols), L);
        const sz = 0.6 + R() * 0.8;
        s += `<svg class="rum-lov" style="--y0:${r1(y0)}px; --y1:${r1(y0 + 60 + R() * 140)}px; --x1:${r1(-40 + 1150 * cyc / dur)}px; animation-duration:${r1(cyc)}s; animation-delay:-${r1(R() * cyc)}s" viewBox="-8 -8 16 16" width="16" height="16"><g class="snurr" style="animation-duration:${r1(0.8 + R() * 1.6)}s"><path d="M0 -6 Q5 -2 0 6 Q-5 -2 0 -6 Z" fill="${c}" transform="scale(${r1(sz)})"/></g></svg>`;
      }
    }
    return s;
  }

  // ---------- framför affären ----------
  //
  // S:t Eriksgatan alldeles utanför: de som går förbi på trottoaren framför affären och bilarna och bussarna i gatans
  // två filer är fasadens (rum-fasad.js, rum-fasad-gatan.js), samma människor och samma fordon i samma ögonblick som
  // när man går ut genom dörren. Fasadens kod räknar ut vilka de är och var de är vid tiden t (sekunder ur
  // performance.now, som där) och ritar dem; här ses de från andra hållet, spegelvända: det som kör åt vänster utifrån
  // kör åt höger inifrån (gatan är enkelriktad), och den som stannar och tittar in på oss står med ansiktet hitåt.
  //
  // Måtten: ögat är 1,25 m över marken och horisonten i y 382, där räcket och huvudena på dem som går på bron är.
  // Något d m ut från fasaden (fasadens mått) har skalan framS(d) px per meter och marken i framY(d): de som går på
  // trottoaren (0,3–0,8 m ut) syns från midjan och uppåt över fönsterbänken och hela i dörren, fordonen kör bortom
  // kanten (filerna i y 473 och 459), och bussarna når upp över gängets huvuden. I sidled (X: fasadens meter, med
  // dess öga i 0) står ögat härinne 0,48 m till vänster om fasadens, sett utifrån, så att det fasaden ser framför
  // skyltfönstret och dörren ryms i glasen härinifrån.
  //
  // Allt ritas i en grov duk över glasen (FRAM.px bildpunkter per px: förstorad blir den mjuk, ur skärpa som resten
  // av gatan, utan filter), i telefonen och på datorns lägre steg i gatans duk (ritaGatan), och bara medan något
  // syns: de som går i gängets takt, och medan ett fordon kör förbi i varje bildruta (glid), som på fasaden.
  const FRAM = { yh: 382, oga: 1.25, K: 166.8, d0: 1.016, xv: 571, XE: -0.483, px: 0.4 };
  // De som går och kör förbi är bakgrund och ska inte dra blicken från gänget: de ritas skarpa i en kladd och läggs
  // sedan i sina bilder ur skärpa (oskarpa: px i scenen) och lite disiga, mot luftens färg (dis: hur mycket), se
  // ritaFramMjuk. Utan ctx.filter (äldre Safari) får bilderna halva upplösningen i stället för oskärpan.
  const DIS = { oskarpa: 2.6, dis: 0.15 };
  const framS = (d) => FRAM.K / (d + FRAM.d0);
  const framY = (d) => FRAM.yh + FRAM.oga * framS(d);
  const framX = (X, s) => FRAM.xv + (FRAM.XE - X) * s;
  // (färgerna går mot blågrått på dagen som resten av gatan, kall, men mindre än på bron: de är närmare)
  const KALL_FRAM = 0.45;
  // (hela världen: fordonen sorteras bort här, efter var de syns i glasen)
  const ALLT = { x: -1e6, y: 0, w: 2e6, h: 0 };
  // affärens ljus faller ut på trottoaren framför fönstret och dörren (X), på kvällen, och tar slut mjukt på
  // LJUSKANT m (LJUSTEG steg från ljuset ut i mörkret, fz i framModell)
  const LJUSET = [-2.1, 1.6];
  const LJUSKANT = 0.9;
  const LJUSTEG = 4;

  // fönstrets form, som fasaden räknar den (vy i rum-fasad.js: var de går och hur långa varven är beror på den)
  function formen(el) {
    const rum = el.closest('.rum');
    return ((rum && rum.clientWidth) || innerWidth) / ((rum && rum.clientHeight) || innerHeight || 1);
  }
  const tsig = (v) => { const T = trafik(v); return [T.gaende, T.rusning, T.natt, T.dag, T.helg, T.bussar].join(); };
  let framForm = false;
  addEventListener('resize', () => { framForm = true; });

  // Fasadens folk och trafik (RumFasad.framfor, RumFasadGatan.trafik) i gatans färger härifrån.
  function framModell(el, v, L) {
    const RF = window.RumFasad;
    const FG = window.RumFasadGatan;
    if (!RF || !RF.framfor || !FG) return null;
    const a = formen(el);
    const m = RF.framfor(v, L, a);
    const hex = (c) => typeof c === 'string' && c.length === 7 && c[0] === '#';
    const kl = (c) => (hex(c) ? kallFarg(c, L, KALL_FRAM) : c);
    // På kvällen faller affärens ljus på dem framifrån, härifrån sett (utifrån är de siluetter mot fönstret). Men
    // de är bakgrund: i ljuset (z 0) har de bara sina egna färger med ett varmt sken, utanför det mörkare, och
    // däremellan LJUSTEG steg, så att ingen tänds på en gång när de går in i ljuset. (Förut blev de 2,3 gånger
    // ljusare, i ett enda steg, och drog blicken från gänget.)
    const natt = L.dag < 0.6 ? 1 - L.dag / 0.6 : 0;
    const lys = (c) => (hex(c) ? hx(rgb(c).map((x, i) => x * (1 - 0.08 * natt) + [16, 8, 0][i] * natt)) : c);
    const morkt = (c) => mix(c, '#06060a', 0.5 * natt);
    const kalla = (D) => {
      for (const p of D) {
        if (p.f) p.f = kl(p.f);
        if (p.s) p.s = kl(p.s);
        if (p.fz) p.fz = p.fz.map(kl);
        if (natt && hex(p.f) && !p.lys) {
          const a = lys(p.f);
          const b = morkt(p.f);
          p.fz = Array.from({ length: LJUSTEG + 1 }, (_, i) => mix(a, b, i / LJUSTEG));
          p.f = p.fz[0];
        }
        if (natt && p.s && hex(p.s)) p.s = mix(lys(p.s), morkt(p.s), 0.5);
      }
      return D;
    };
    const S = FG.trafik(v, L, m.G);
    const ton = S.ton;
    S.ton = (c) => kl(ton(c));
    S.glas = kl(S.glas);
    S.himmel = kl(S.himmel);
    // (luften mellan oss och dem: himlen nere vid taken, lite mörkare nere på gatan)
    const dis = mix(kl(L.sky[2]), '#000000', 0.15);
    return { ...m, S, kalla, a, L, dis, T: tsig(v), tT: performance.now() };
  }

  // Det som syns framför affären vid tiden t (s) genom glasen r: { fordon, folk }, de bortre först, eller null.
  // fordon: { b, f, x, fart, broms, nig } som fasadens (RumFasadGatan.rita), folk: { f, D, x, xi, yi, q, dm, id, ut }
  // (fötterna i xi, yi och q px per fasadens enhet; id: den som går, också den som har stannat, som kommer som ett nytt
  // föremål varje gång).
  function framLista(el, t, r) {
    let M = el._fram;
    if (!M) return null;
    // (ny form på fönstret, eller annan trafik än när det byggdes: fasaden har andra som går)
    const ms = performance.now();
    if (framForm || ms - M.tT > 30000) {
      const v = window.Vader ? Vader.nu() : null;
      M.tT = ms;
      if (v && ((framForm && Math.abs(formen(el) - M.a) > 0.004) || tsig(v) !== M.T)) M = el._fram = framModell(el, v, light(v)) || M;
      framForm = false;
    }
    const RF = window.RumFasad;
    const FG = window.RumFasadGatan;
    // fordonen, den bortre filen härifrån först (fasadens närmre)
    const fordon = [];
    for (const it of FG.syns(M.S, t, ALLT) || []) {
      const s = framS(it.f.d);
      const x = framX((it.x - M.G.OGA_X) / it.f.um, s);
      // (strålkastarnas ljus på gatan framför när det är mörkt)
      const h = (it.b.L / 200) * s + (M.S.lamps ? 5 * s : 0.4 * s);
      if (x + h < r.x || x - h > r.x + r.w) continue;
      fordon.push({ b: it.b, f: { y: framY(it.f.d), dir: 1, k: s / 100, d: it.f.d }, x, fart: it.fart, broms: it.broms, nig: it.nig });
    }
    fordon.sort((p, q) => q.f.d - p.f.d);
    // de som går, de bortre först, och den som har stannat och tittar in (står den: framifrån). Var och en syns där
    // den syns utifrån och tonar in och ut på en halvmeter i kanterna av fasadens bild, där loppet börjar och slutar.
    const natt = M.L.dag < 0.6 ? 1 - M.L.dag / 0.6 : 0;
    const folk = [];
    const lagg = (f, D, x, dm, e, id = f) => {
      const um = RF.M * RF.skala(dm);
      const s = framS(dm);
      const X = (x - RF.OGA_X) / um;
      const xi = framX(X, s);
      if (xi + FB.x * s < r.x || xi - FB.x * s > r.x + r.w || e <= 0) return;
      // (på kvällen i affärens ljus framför fönstret och dörren, mörkare bortom, med en mjuk kant)
      const inne = Math.min(X - LJUSET[0], LJUSET[1] - X) / LJUSKANT + 0.5;
      const z = natt ? Math.round(LJUSTEG * (1 - Math.max(0, Math.min(1, inne)))) : 0;
      folk.push({ f, D, x, xi, yi: framY(dm), q: s / um, dm, id, ut: { A: Math.min(1, e / um / 0.6), rand: 0, z } });
    };
    // (var och en får gatans färger första gången den syns: fasaden lottar dem lopp för lopp, folket.vid)
    for (const [f, D, x, , lap] of M.folk.vid(t)) {
      if (!f.kall) {
        f.kall = true;
        M.kalla(D);
      }
      lagg(f, D, x, f.dm, lap ? lap.fart * Math.min(t - lap.start, lap.slut - t) : 1e9);
    }
    const st = M.stanna && M.stanna(t);
    if (st) {
      const f = st.f;
      if (!f.kall) {
        f.kall = true;
        M.kalla(f.D);
        f.FR = M.kalla(RF.framDelar(f.bakO, M.L));
      }
      lagg({ k: f.k, dir: st.sta ? 1 : f.dir, sta: st.sta, stil: f.stil }, st.sta ? f.FR : f.D, st.x, f.dm, Math.min(Math.abs(st.x - f.xa), Math.abs(f.xb - st.x)), f);
    }
    folk.sort((p, q) => q.dm - p.dm);
    return fordon.length || folk.length ? { fordon, folk } : null;
  }

  // (disigt: bara där något är ritat i x, source-atop)
  function disa(el, x, w, h) {
    if (!(DIS.dis > 0) || !el._fram) return;
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = DIS.dis;
    x.fillStyle = el._fram.dis;
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
  }

  // Det som syns framför affären vid tiden t (s) i duken g (k bildpunkter per px, hörnet i ox, oy), ur skärpa och
  // disigt (DIS); r: glasen. → 2 om ett fordon syns (då ritas det i varje bildruta), 1 om bara de som går, 0 om inget.
  //
  // Var och en som går förbi och varje fordon är en egen liten bild (2026-11-19, användarens önskemål: flyta bättre på
  // sämre enheter). Medan något far förbi läggs gatan ut i varje bildruta (glid), och förut ritades då allt framför
  // affären om från grunden varje gång – fasadens figurer och fordon, några hundra former var – och lades i glasen med
  // oskärpan över hela fönstret: åtta gånger så mycket arbete för grafiken som resten av gatan tillsammans. Nu ritas
  // var och en skarp i kladden, disig och med oskärpan i sin bild i gängets takt (el._framTakt, takt), och i
  // bildrutorna däremellan läggs bara bilderna ut där var och en är, som gatans egna figurer (stall, ark). Den som har
  // stannat och står still ritas en gång. Ett fordons bild är klippt till glasen med FMARG m marginal och ritas om när
  // det har kört mer än hälften av den sedan förra gången. Utan ctx.filter (äldre Safari) har bilderna halva
  // upplösningen i stället för oskärpan.
  //
  // FB: hur långt en figur når från fötterna (m), paraplyet och hunden med (mätt över 6 000 figurer i olika väder och
  // tider: 1,67 m åt sidan och 2,75 m upp). FBIL: ett fordon från mitten (m) utöver halva längden, på kvällen med
  // strålkastarnas ljus framför och bakom (mätt: 4,4 m; på dagen 0,35), upp och ner med spegelbilden i den våta gatan
  // (mätt: 4,4 m upp för plogbilen och 2,5 m ner).
  const FB = { x: 1.75, upp: 2.85, ned: 0.1 };
  const FBIL = { x: 4.6, dag: 0.6, upp: 4.6, ned: 2.7 };
  const FMARG = 2;
  function ritaFramMjuk(el, g, t, ox, oy, k, r) {
    const L = framLista(el, t, r);
    if (!L) return 0;
    const M = el._fram;
    const RF = window.RumFasad;
    const FG = window.RumFasadGatan;
    const s = FILTER ? k : k / 2;
    const B = el._framB || (el._framB = new Map());
    const nu = performance.now();
    // (i en stillbild ritas allt, på den fasta tiden)
    const ep = el._fast != null ? -1 : el._framTakt || 0;
    const pad = FILTER ? Math.ceil(3 * DIS.oskarpa * s) + 1 : 1;
    const f = k / s;
    // bilden b (W × H) ritas om: skarp i kladden (rita), disig, och därifrån med oskärpan
    const kl = el._framF || (el._framF = document.createElement('canvas').getContext('2d'));
    if (!kl) return 0;
    const bild = (b, W, H, rita) => {
      if (kl.canvas.width < W || kl.canvas.height < H) {
        kl.canvas.width = Math.max(kl.canvas.width, W);
        kl.canvas.height = Math.max(kl.canvas.height, H);
      }
      kl.setTransform(1, 0, 0, 1, 0, 0);
      kl.globalAlpha = 1;
      kl.clearRect(0, 0, W, H);
      rita(kl);
      kl.setTransform(1, 0, 0, 1, 0, 0);
      disa(el, kl, W, H);
      const c = b.c;
      if (c.width !== W || c.height !== H) {
        c.width = W;
        c.height = H;
      }
      const x = c.getContext('2d');
      if (!x) return;
      x.clearRect(0, 0, W, H);
      if (FILTER) x.filter = `blur(${r1(DIS.oskarpa * s * 10) / 10}px)`;
      x.drawImage(kl.canvas, 0, 0, W, H, 0, 0, W, H);
      if (FILTER) x.filter = 'none';
      b.W = W;
      b.H = H;
      b.ep = ep;
    };
    const hamta = (id) => {
      let b = B.get(id);
      if (!b) B.set(id, (b = { c: document.createElement('canvas') }));
      b.sist = nu;
      return b;
    };
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    for (const v of L.fordon) {
      const sm = v.f.k * 100;
      const b = hamta(v.b);
      if (ep < 0 || b.ep !== ep || Math.abs(v.x - b.x) > (FMARG / 2) * sm) {
        // (bilden: fordonet med ljuset, klippt till glasen med marginalen, i scenens px)
        const hx = (v.b.L / 200 + (M.S.lamps ? FBIL.x : FBIL.dag)) * sm;
        const x0 = Math.max(v.x - hx, r.x - FMARG * sm);
        const x1 = Math.min(v.x + hx, r.x + r.w + FMARG * sm);
        const y0 = Math.max(v.f.y - FBIL.upp * sm, r.y - pad / s);
        const y1 = Math.min(v.f.y + FBIL.ned * sm, r.y + r.h + pad / s);
        if (x1 <= x0 || y1 <= y0) continue;
        b.x = v.x;
        b.x0 = x0;
        b.y0 = y0;
        bild(b, Math.ceil((x1 - x0) * s) + 2 * pad, Math.ceil((y1 - y0) * s) + 2 * pad, (c) => {
          c.setTransform(s, 0, 0, s, pad - x0 * s, pad - y0 * s);
          FG.rita(c, M.S, [v], t);
        });
      }
      if (!b.W) continue;
      g.drawImage(b.c, 0, 0, b.W, b.H, (b.x0 + v.x - b.x - ox) * k - pad * f, (b.y0 - oy) * k - pad * f, b.W * f, b.H * f);
    }
    for (const p of L.folk) {
      const sm = framS(p.dm);
      const W = Math.ceil(2 * FB.x * sm * s) + 2 * pad;
      const H = Math.ceil((FB.upp + FB.ned) * sm * s) + 2 * pad;
      const cx = pad + FB.x * sm * s;
      const cy = pad + FB.upp * sm * s;
      const sta = Boolean(p.f.sta);
      const b = hamta(p.id);
      if (ep < 0 || (!sta && b.ep !== ep) || b.W !== W || b.H !== H || b.z !== p.ut.z || b.D !== p.D || b.sta !== sta || b.dir !== p.f.dir) {
        Object.assign(b, { z: p.ut.z, D: p.D, sta, dir: p.f.dir });
        bild(b, W, H, (c) => {
          c.translate(cx, cy);
          c.scale(-p.q * s, p.q * s);
          c.translate(-p.x, 0);
          RF.ritaFigur(c, p.f, p.D, p.x, 0, t, M.L, { A: 1, rand: 0, z: p.ut.z });
        });
      }
      if (!b.W) continue;
      // (i kanterna av fasadens bild tonar den in och ut)
      g.globalAlpha = p.ut.A;
      g.drawImage(b.c, 0, 0, W, H, (p.xi - ox) * k - cx * f, (p.yi - oy) * k - cy * f, W * f, H * f);
    }
    g.globalAlpha = 1;
    // (det som inte har synts på en sekund: bilden släpps)
    if (B.size > L.fordon.length + L.folk.length) {
      for (const [id, b] of B) {
        if (nu - b.sist < 1000) continue;
        b.c.width = 0;
        B.delete(id);
      }
    }
    return L.fordon.length ? 2 : 1;
  }

  // I datorn, där det som rör sig på gatan är egna dukar: en duk över glasen, mellan dem som går på bron och regnet.
  // nu: ms (performance.now, eller den fasta tiden i en stillbild). → som ritaFram.
  function framDuk(el, nu) {
    const c = el._framC;
    if (!c) return 0;
    const g = c.getContext('2d');
    if (!g) return 0;
    if (!el._framTom) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
    }
    const r = el._framR;
    const ut = RORELSE_AV.matches ? 0 : ritaFramMjuk(el, g, nu / 1000, r.x, r.y, FRAM.px, r);
    el._framTom = !ut;
    el._fort = ut === 2;
    return ut;
  }

  // ---------- nederbörden ----------

  // Regnet, duggregnet och snön: band som glider nedåt (bara transform),
  // i ett lager bakom både fönstret och dörren.
  function fall(v) {
    if (!v.fall) return '';
    const R = rng(5);
    const W = 924;
    const H = 580;
    const slant = Math.min(0.55, 0.08 + v.vind * 0.035);
    const lines = (n, o, l0, l1, wd) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const x = R() * W; const y = R() * H; const len = l0 + R() * (l1 - l0);
        for (const dy of [0, H]) s += `<line x1="${r1(x)}" y1="${r1(y + dy)}" x2="${r1(x - len * slant)}" y2="${r1(y + dy + len)}" stroke="#c8d6f0" stroke-opacity="${r1(o + R() * 0.14)}" stroke-width="${r1(wd + R() * 0.6)}"/>`;
      }
      return `<svg viewBox="0 0 ${W} ${2 * H}" width="${W}" height="${2 * H}">${s}</svg>`;
    };
    // snön är 120 px bredare än rutan, så att den kan driva i sidled
    const flakes = (n, r0, r2, o) => {
      let s = '';
      const W2 = W + 120;
      for (let i = 0; i < n; i++) {
        const x = R() * W2; const y = R() * H; const r = r0 + R() * (r2 - r0);
        for (const dy of [0, H]) s += `<circle cx="${r1(x)}" cy="${r1(y + dy)}" r="${r1(r)}" fill="#f4f7fb" opacity="${r1(o + R() * 0.35)}"/>`;
      }
      return `<svg viewBox="0 0 ${W2} ${2 * H}" width="${W2}" height="${2 * H}">${s}</svg>`;
    };
    const k = v.mangd;
    let s = '';
    if (v.fall === 'regn' || v.fall === 'blandat') {
      const part = v.fall === 'blandat' ? 0.45 : 1;
      if (v.slag === 'dugg') {
        s += `<div class="rum-regn-b fjarr" style="height:${2 * H}px; animation-duration:2s">${lines(Math.round(200 * k * part), 0.03, 6, 12, 0.4)}</div>`;
        s += `<div class="rum-regn-b" style="height:${2 * H}px; animation-duration:1.3s">${lines(Math.round(140 * k * part), 0.04, 8, 16, 0.5)}</div>`;
      } else {
        s += `<div class="rum-regn-b fjarr" style="height:${2 * H}px; animation-duration:1.25s">${lines(Math.round(260 * k * part), 0.03, 16, 40, 0.7)}</div>`;
        s += `<div class="rum-regn-b" style="height:${2 * H}px; animation-duration:${r1(0.75 - 0.15 * k)}s">${lines(Math.round(400 * k * part), 0.05, 18, 50, 0.7)}</div>`;
      }
    }
    if (v.fall === 'sno' || v.fall === 'blandat') {
      const part = v.fall === 'blandat' ? 0.4 : 1;
      const sway = Math.min(60, 10 + v.vind * 5);
      s += `<div class="rum-sno-v" style="--sway:${sway}px; animation-duration:5s"><div class="rum-regn-b rum-sno-b" style="height:${2 * H}px; animation-duration:${r1(16 - 4 * k)}s">${flakes(Math.round(260 * k * part), 0.6, 1.4, 0.3)}</div></div>`;
      s += `<div class="rum-sno-v" style="--sway:${r1(sway * 1.4)}px; animation-duration:3.6s; animation-delay:-1.4s"><div class="rum-regn-b rum-sno-b" style="height:${2 * H}px; animation-duration:${r1(10 - 3 * k)}s">${flakes(Math.round(220 * k * part), 1.2, 2.6, 0.45)}</div></div>`;
    }
    // (inte rum-regn: så heter datorns närbild, rum-register.css, som är dold tills den öppnas –
    // regnet och snön syntes inte i datorn, och rörelsen gick ändå, i huvudtråden)
    return `<div class="rum-nederbord" style="left:36px; top:120px; width:${W}px; height:${H}px">${s}</div>`;
  }

  // ---------- glaset ----------

  // Dropparna som sitter kvar på rutan, och de som rinner när det regnar;
  // snö i nederkanten och frost i hörnen när det är kallt.
  function glas(v, rects) {
    let s = '';
    let html = '';
    const regn = v.fall === 'regn' || v.fall === 'blandat';
    rects.forEach((p, pi) => {
      const R = rng(17 + pi * 7);
      const m = Math.round((regn ? 1 : v.blott ? 0.45 : 0) * (p.w * p.h) / 2400);
      for (let i = 0; i < m; i++) {
        const dx = p.x + R() * p.w;
        const dy = p.y + R() * p.h;
        const r = 1 + R() * 3;
        if (regn && R() < 0.3) s += `<line x1="${r1(dx)}" y1="${r1(dy)}" x2="${r1(dx + (R() - 0.5) * 4)}" y2="${r1(dy - 10 - R() * 40)}" stroke="#dfe8ff" stroke-opacity=".08" stroke-width="${r1(r * 0.8)}"/>`;
        s += `<circle cx="${r1(dx)}" cy="${r1(dy)}" r="${r1(r)}" fill="#dfe8ff" opacity="${r1(0.1 + R() * 0.12)}"/><circle cx="${r1(dx - r * 0.3)}" cy="${r1(dy - r * 0.3)}" r="${r1(r * 0.35)}" fill="#fff" opacity=".35"/>`;
      }
      if (regn) html += `<div class="rum-rinner" style="left:${p.x}px; top:${p.y}px; width:${p.w}px; height:${p.h}px"><i class="rum-droppe" style="left:${Math.round(p.w * 0.3)}px"></i><i class="rum-droppe d2" style="left:${Math.round(p.w * 0.72)}px"></i></div>`;
      if (v.snotackt && v.temp < 1.5) {
        let d = `M${p.x} ${p.y + p.h}`;
        for (let x = 0; x <= p.w; x += 12) d += ` L${r1(p.x + x)} ${r1(p.y + p.h - 3 - R() * 4 - (x < 30 || x > p.w - 30 ? 6 : 0))}`;
        s += `<path d="${d} L${p.x + p.w} ${p.y + p.h} Z" fill="#e9eef3" opacity=".75"/>`;
      }
      if (v.temp < -3) {
        const f = Math.min(1, (-3 - v.temp) / 10);
        for (const [cx, cy] of [[p.x, p.y + p.h], [p.x + p.w, p.y + p.h], [p.x, p.y], [p.x + p.w, p.y]]) {
          const rr = (cy > p.y ? 70 : 40) * (0.5 + f);
          s += `<circle cx="${cx}" cy="${cy}" r="${r1(rr)}" fill="url(#rum-ute-frost)" opacity="${r1(0.5 + 0.4 * f)}"/>`;
          for (let j = 0; j < 9; j++) {
            const a = Math.atan2(p.y + p.h / 2 - cy, p.x + p.w / 2 - cx) + (R() - 0.5) * 1.6;
            const L2 = rr * (0.4 + R() * 0.5);
            const x2 = cx + Math.cos(a) * L2; const y2 = cy + Math.sin(a) * L2;
            s += `<path d="M${cx} ${cy} L${r1(x2)} ${r1(y2)} M${r1(cx + (x2 - cx) * 0.5)} ${r1(cy + (y2 - cy) * 0.5)} l${r1(Math.cos(a + 0.7) * 8)} ${r1(Math.sin(a + 0.7) * 8)} M${r1(cx + (x2 - cx) * 0.7)} ${r1(cy + (y2 - cy) * 0.7)} l${r1(Math.cos(a - 0.7) * 6)} ${r1(Math.sin(a - 0.7) * 6)}" stroke="#eef6ff" stroke-opacity="${r1(0.25 + 0.2 * f)}" stroke-width=".8" fill="none"/>`;
          }
        }
      }
    });
    const defs = '<defs><radialGradient id="rum-ute-frost" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef6ff" stop-opacity=".55"/><stop offset=".6" stop-color="#eef6ff" stop-opacity=".18"/><stop offset="1" stop-color="#eef6ff" stop-opacity="0"/></radialGradient></defs>';
    // (bara så stor som fönstret och dörren, och ingen alls utan droppar, snö och frost: annars lade
    // grafikkortet ett tomt lager över hela utsikten i varje bildruta. Utanför glaset är väggen.)
    if (!s) return html;
    const x0 = Math.min(...rects.map((p) => p.x));
    const y0 = Math.min(...rects.map((p) => p.y));
    const w = Math.max(...rects.map((p) => p.x + p.w)) - x0;
    const h = Math.max(...rects.map((p) => p.y + p.h)) - y0;
    return `<svg class="rum-layer" viewBox="${x0} ${y0} ${w} ${h}" style="left:${x0}px; top:${y0}px; width:${w}px; height:${h}px" aria-hidden="true">${defs}${s}</svg>${html}`;
  }

  // ---------- att rita ----------

  const bucket = (x, n) => Math.round(x * n) / n;
  function sigs(v, L) {
    const host = (v.manad === 9 && v.dag >= 20) || v.manad === 10 || (v.manad === 11 && v.dag <= 25);
    const base = [v.slag, bucket(v.mangd, 5), v.snotackt, v.blott, host, v.advent].join();
    return {
      himmel: [base, bucket(L.dag, 20), bucket(v.sol, 1), v.mane.h > 2, bucket(v.mane.fas, 30), bucket(L.m, 10)].join(),
      himliv: [base, bucket(L.dag, 5), bucket(L.guld, 4), v.arstid, v.timme >> 2, v.nyar, v.manad === 12 && v.dag === 31 && v.timme >= 18, v.timme >= 18 && v.timme < 23, bucket(L.m, 5)].join(),
      gata: [base, bucket(L.dag, 20), bucket(L.sol, 10), bucket(L.guld, 10), bucket(L.tand, 50), L.lampor, lovet(v), bucket(L.m, 10)].join(),
      liv: [base, bucket(L.dag, 4), L.lampor, v.timme >> 1, v.arstid, v.manad === 12, bucket(v.kanns, 0.1), bucket(v.vind, 0.25), flagga(v)].join(),
      fall: [v.fall, v.slag, bucket(v.mangd, 5), Math.round(v.vind / 3)].join(),
      glas: [v.fall, v.blott, v.snotackt, Math.round(v.temp)].join(),
    };
  }

  const LAGER = [
    ['himmel', 'svg', 'rum-layer rum-ute-himmel'], ['himliv', 'div', 'rum-layer rum-himliv'], ['blixt', 'div', 'rum-layer rum-blixt'],
    ['gata', 'div', 'rum-layer rum-ute-gata'], ['liv', 'div', 'rum-layer rum-liv'],
    ['fall', 'div', 'rum-layer rum-fall'], ['glas', 'div', 'rum-layer rum-glas'],
  ];

  // ---------- det som rör sig, i dukar ----------
  //
  // De som går, cyklar och åker förbi, löven, fåglarna och flaggan ritas var
  // och en i en liten duk i stället för som SVG med ben och armar som vrids.
  // Att vrida något inne i en SVG fick Chrome att räkna om alla rummets lager
  // (PaintArtifactCompositor::Update) varje gång, och oskärpan på varje SVG
  // var ett eget pass på grafikkortet i varje bildruta. Duken glider över
  // gatan som förut (CSS-animationen i rum-ute.css, på grafikkortet), och
  // ställningen ritas om i gängets takt (takt, från rum.js) med oskärpan i
  // ritningen; molnen ritas en gång. Bara det som syns genom fönstret och
  // dörren ritas om. Utan ctx.filter (äldre Safari) får duken oskärpan i CSS.

  const FILTER = (() => {
    try { return typeof document.createElement('canvas').getContext('2d').filter === 'string'; } catch { return false; }
  })();
  // I telefonen (Safari saknar ctx.filter) gjorde oskärpan i CSS varje figur
  // till ett eget pass på grafikkortet i varje bildruta, ett tjugotal på
  // gatan. Där får dukarna i stället en halv bildpunkt per px – förstorade
  // blir de lika mjuka – och molnen en femtedels (rum-ute.css tar bort
  // oskärpan), och figurerna ritas om varannan gång, hälften i taget.
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;

  // ease-in-out
  const IO = (() => {
    const b = (t, p, q) => 3 * p * t * (1 - t) * (1 - t) + 3 * q * t * t * (1 - t) + t * t * t;
    return (x) => {
      let lo = 0;
      let hi = 1;
      let t = x;
      for (let i = 0; i < 16; i++) {
        if (b(t, 0.42, 0.58) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
      return b(t, 0, 1);
    };
  })();

  // Rörelserna inne i figurerna (klassen i SVG:n): vad som ändras (m: rot
  // vrids, ty gungar, sy viker sig, vaj vajar, op blinkar), från a till b
  // på d ms, fram och tillbaka (alt) eller runt, f ms före (b2 i otakt),
  // kring o. steg är stegets längd (--steg). Delarna av en som går (g-…: kroppen, lutningen, låren, knäna, fötterna,
  // armarna och käppen) tar sin ställning ur sättet att gå (gang, gangLas).
  function rorelse(e, steg) {
    const k = e.classList;
    const gd = /\bg-(\w+)/.exec(e.getAttribute('class') || '');
    if (gd) {
      const w = e.closest('[data-gang]');
      const G = w && GANGAR[+w.getAttribute('data-gang')];
      return G ? { m: 'gang', del: gd[1], b2: k.contains('b2'), G } : null;
    }
    const egen = (parseFloat(e.style.animationDuration) || 1) * 1000;
    if (k.contains('gung')) return { m: 'ty', a: 0, b: -0.8, d: steg / 2, alt: 1 };
    if (k.contains('ben')) {
      const d = steg * (k.contains('fort') ? 0.6 : 1);
      return { m: 'rot', a: 24, b: -24, d, f: k.contains('b2') ? d : 0, alt: 1 };
    }
    if (k.contains('arm')) return { m: 'rot', a: -18, b: 18, d: steg, f: steg, alt: 1 };
    if (k.contains('hjul')) return { m: 'rot', a: 0, b: 360, d: 500 };
    // lövet snurrar kring sin mitt, vingen viker sig kring sin och flaggan
    // vajar från stången
    if (k.contains('snurr')) return { m: 'rot', a: 0, b: 360, d: egen };
    if (k.contains('vinge')) return { m: 'sy', a: 1, b: -0.5, d: egen, alt: 1, o: [0, -0.75] };
    if (k.contains('vaj')) return { m: 'vaj', a: 0, b: 1, d: egen, alt: 1 };
    if (k.contains('blink')) return { m: 'op', d: 900 };
    return null;
  }

  // rörelsen r efter t ms: [a, b, c, d, e, f] (eller genomskinligheten)
  function las(r, t) {
    if (r.m === 'gang') return gangLas(r, t);
    const x = (t + (r.f || 0)) / r.d;
    let p = x - Math.floor(x);
    if (r.m === 'op') return p < 0.5 ? 1 : 0.1;
    if (r.alt) {
      if (Math.floor(x) % 2) p = 1 - p;
      p = IO(p);
    }
    const v = r.a + (r.b - r.a) * p;
    if (r.m === 'ty') return [1, 0, 0, 1, 0, v];
    if (r.m === 'sy') return [1, 0, 0, v, 0, r.o[1] * (1 - v)];
    if (r.m === 'vaj') {
      const sx = 0.92 + 0.08 * v;
      return [sx, sx * Math.tan((-5 + 9 * v) * Math.PI / 180), 0, 1, 0, 0];
    }
    const c = Math.cos(v * Math.PI / 180);
    const s = Math.sin(v * Math.PI / 180);
    return [c, s, -s, c, 0, 0];
  }

  // W[o…] = A[i…] · B
  const mul = (A, i, B, W, o) => {
    const a = A[i];
    const b = A[i + 1];
    const c = A[i + 2];
    const d = A[i + 3];
    const e = A[i + 4];
    const f = A[i + 5];
    W[o] = a * B[0] + c * B[1];
    W[o + 1] = b * B[0] + d * B[1];
    W[o + 2] = a * B[2] + c * B[3];
    W[o + 3] = b * B[2] + d * B[3];
    W[o + 4] = a * B[4] + c * B[5] + e;
    W[o + 5] = b * B[4] + d * B[5] + f;
  };
  const ETT = [1, 0, 0, 1, 0, 0];

  // formen av ett SVG-element som Path2D (eller null)
  function form(k) {
    const n = (a) => parseFloat(k.getAttribute(a)) || 0;
    const p = new Path2D();
    switch (k.localName) {
      case 'rect': {
        const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
        const r = Math.min(n('rx') || n('ry'), w / 2, h / 2);
        if (r > 0 && p.roundRect) p.roundRect(x, y, w, h, r);
        else p.rect(x, y, w, h);
        return p;
      }
      case 'circle': p.ellipse(n('cx'), n('cy'), n('r'), n('r'), 0, 0, 2 * Math.PI); return p;
      case 'ellipse': p.ellipse(n('cx'), n('cy'), n('rx'), n('ry'), 0, 0, 2 * Math.PI); return p;
      case 'line': p.moveTo(n('x1'), n('y1')); p.lineTo(n('x2'), n('y2')); return p;
      case 'path': return new Path2D(k.getAttribute('d') || '');
      case 'polygon': case 'polyline': {
        const v = (k.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
        for (let i = 0; i + 1 < v.length; i += 2) (i ? p.lineTo : p.moveTo).call(p, v[i], v[i + 1]);
        if (k.localName === 'polygon') p.closePath();
        return p;
      }
      default: return null;
    }
  }

  // SVG:ns delar i ordning: förälder, egen transform eller rörelse,
  // genomskinlighet och formen med färgerna (som ärvs från <g>)
  function delar(svg, steg) {
    const N = [];
    const ARV = { fill: '#000', stroke: 'none', 'stroke-width': '1', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'fill-opacity': '1', 'stroke-opacity': '1', 'fill-rule': 'nonzero', 'font-size': '16', 'font-family': 'sans-serif', 'text-anchor': 'start' };
    const ga = (e, p, arv) => {
      for (const k of e.children) {
        const a = { ...arv };
        for (const x in a) if (k.hasAttribute(x)) a[x] = k.getAttribute(x);
        const n = { p, m: null, r: k.classList.length ? rorelse(k, steg) : null, al: k.hasAttribute('opacity') ? parseFloat(k.getAttribute('opacity')) : 1, op: null };
        if (!n.r || n.r.m === 'op') {
          const t = k.transform && k.transform.baseVal;
          if (t && t.numberOfItems) {
            const x = t.consolidate().matrix;
            n.m = [x.a, x.b, x.c, x.d, x.e, x.f];
          }
        }
        if (k.localName === 'text') n.op = { text: k.textContent, x: parseFloat(k.getAttribute('x')) || 0, y: parseFloat(k.getAttribute('y')) || 0, font: `${parseFloat(a['font-size'])}px ${a['font-family']}`, align: { middle: 'center', end: 'right' }[a['text-anchor']] || 'left', fill: a.fill };
        else {
          const f = form(k);
          if (f) n.op = { f, fill: a.fill, stroke: a.stroke, lw: parseFloat(a['stroke-width']), cap: a['stroke-linecap'], join: a['stroke-linejoin'], fo: parseFloat(a['fill-opacity']), so: parseFloat(a['stroke-opacity']), rule: a['fill-rule'] };
        }
        N.push(n);
        if (k.localName === 'g') ga(k, N.length - 1, a);
      }
    };
    ga(svg, -1, ARV);
    return N;
  }

  // en delad duk där figuren ritas skarp innan oskärpan läggs på (cpu: för figurerna i gatans duk, vars
  // ark är i processorn: en kladd på grafikkortet hade lästs tillbaka därifrån för varje figur)
  const KLADD = [null, null];
  function kladd(w, h, cpu = false) {
    const i = cpu ? 1 : 0;
    if (!KLADD[i]) KLADD[i] = document.createElement('canvas').getContext('2d', cpu ? { willReadFrequently: true } : undefined);
    const c = KLADD[i].canvas;
    if (c.width < w || c.height < h) {
      c.width = Math.max(c.width, w);
      c.height = Math.max(c.height, h);
    }
    return KLADD[i];
  }

  // figurens delar i duken g, med figurens läge och skala i bas
  function delarna(g, f, t, bas) {
    const { N, W, A } = f;
    for (let i = 0; i < N.length; i++) {
      const n = N[i];
      const L = n.r && n.r.m !== 'op' ? las(n.r, t) : n.m || ETT;
      if (n.p < 0) mul(bas, 0, L, W, i * 6);
      else mul(W, n.p * 6, L, W, i * 6);
      A[i] = (n.p < 0 ? 1 : A[n.p]) * n.al * (n.r && n.r.m === 'op' ? las(n.r, t) : 1);
      const o = n.op;
      if (!o || !(A[i] > 0)) continue;
      g.setTransform(W[i * 6], W[i * 6 + 1], W[i * 6 + 2], W[i * 6 + 3], W[i * 6 + 4], W[i * 6 + 5]);
      if (o.text != null) {
        g.globalAlpha = A[i];
        g.font = o.font;
        g.textAlign = o.align;
        g.fillStyle = o.fill;
        g.fillText(o.text, o.x, o.y);
        continue;
      }
      if (o.fill !== 'none') {
        g.globalAlpha = A[i] * o.fo;
        g.fillStyle = o.fill;
        g.fill(o.f, o.rule === 'evenodd' ? 'evenodd' : 'nonzero');
      }
      if (o.stroke !== 'none' && o.lw > 0) {
        g.globalAlpha = A[i] * o.so;
        g.strokeStyle = o.stroke;
        g.lineWidth = o.lw;
        g.lineCap = o.cap;
        g.lineJoin = o.join;
        g.stroke(o.f);
      }
    }
  }

  // figuren f i ställningen efter t ms
  // (i gatans duk är figurens bild en ruta i ett gemensamt ark, med hörnet i ax, ay; en
  // suddig figur ritas skarp i kladden och läggs sedan i sin ruta med oskärpan)
  function rita(f, t) {
    const g = f.bakad ? kladd(f.bw, f.bh, f.delad) : f.x;
    const ax = f.bakad ? 0 : f.ax || 0;
    const ay = f.bakad ? 0 : f.ay || 0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.clearRect(ax, ay, f.bw, f.bh);
    g.save();
    g.beginPath();
    g.rect(ax + f.P * f.s, ay + f.P * f.s, f.w * f.s, f.h * f.s);
    g.clip();
    delarna(g, f, t, f.B);
    g.restore();
    if (f.bakad) {
      const [ux, uy] = [f.ax || 0, f.ay || 0];
      f.x.clearRect(ux, uy, f.bw, f.bh);
      // (arket delas av alla figurerna: oskärpan sätts för den här och tas bort efteråt)
      if (f.delad) f.x.filter = f.fl;
      f.x.drawImage(g.canvas, 0, 0, f.bw, f.bh, ux, uy, f.bw, f.bh);
      if (f.delad) f.x.filter = 'none';
    }
  }

  // Byter lagrets SVG:er som rör sig inuti eller är suddiga mot dukar.
  // s: duken i bildpunkter per px. samla: figurerna ritas i gatans gemensamma
  // duk (ritaGatan), och hamnar inte alls i sidan.
  function duka(lager, s, samla = false) {
    const ut = [];
    // Oskärpan läses för alla innan någon byts ut: att läsa stilen efter att den förra figuren
    // hade tagits bort räknade om den varje gång, ett trettiotal gånger i rad.
    const alla = [...lager.querySelectorAll(':scope > svg')].map((svg) => {
      const m = /blur\(([\d.]+)px\)/.exec(getComputedStyle(svg).filter);
      return [svg, m ? parseFloat(m[1]) : 0];
    });
    for (const [svg, blur] of alla) {
      const ror = svg.querySelector('.gung, .ben, .arm, .hjul, .blink, .snurr, .vinge, .vaj, .g-kropp');
      if (!ror && !blur) continue;
      const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
      const w = parseFloat(svg.getAttribute('width'));
      const h = parseFloat(svg.getAttribute('height'));
      if (vb.length !== 4 || !(w > 0) || !(h > 0)) continue;
      const st = svg.style;
      const steg = (parseFloat(st.getPropertyValue('--steg')) || 0.9) * 1000;
      // det som är så suddigt behöver inte mer än en bildpunkt per px; i gatans
      // duk är figuren en bild i dukens upplösning (GAT_S), med oskärpan i samma mått
      const sk = samla && ror ? GAT_S : LATT ? (blur >= 3 ? 0.2 : 0.5) : blur >= 2.5 ? Math.min(1, s) : s;
      const bakad = FILTER && blur > 0;
      const P = bakad ? Math.ceil(blur * 3) : 0;
      const c = document.createElement('canvas');
      c.setAttribute('class', `${svg.getAttribute('class')} duk${bakad ? ' bakad' : ''}`);
      c.setAttribute('aria-hidden', 'true');
      c.style.cssText = `${svg.getAttribute('style') || ''}; width:${w + 2 * P}px; height:${h + 2 * P}px; margin:${-P}px 0 0 ${-P}px`;
      const bw = Math.ceil((w + 2 * P) * sk);
      const bh = Math.ceil((h + 2 * P) * sk);
      // (figurerna i gatans duk ritas i ett gemensamt ark, ark)
      const x = samla && ror ? null : c.getContext('2d');
      if (x) {
        c.width = bw;
        c.height = bh;
      }
      const fl = bakad ? `blur(${r1(blur * sk * 10) / 10}px)` : '';
      if (x && fl) x.filter = fl;
      const N = delar(svg, steg);
      const sx = (w / vb[2]) * sk;
      const sy = (h / vb[3]) * sk;
      const f = {
        c, x, N, W: new Float64Array(N.length * 6), A: new Float64Array(N.length), B: [sx, 0, 0, sy, (P - vb[0] * w / vb[2]) * sk, (P - vb[1] * h / vb[3]) * sk],
        w, h, P, s: sk, bw, bh, bakad, fl, ror: Boolean(ror), t0: document.timeline.currentTime || 0,
        // var den är på gatan: left + translateX från fran till till (löven från −40 till --x1)
        x0: parseFloat(st.left) || 0,
        fran: svg.classList.contains('rum-lov') ? -40 : parseFloat(st.getPropertyValue('--fran')) || 0,
        till: svg.classList.contains('rum-lov') ? parseFloat(st.getPropertyValue('--x1')) || 0 : parseFloat(st.getPropertyValue('--till')) || 0,
        glid: /rum-(gar|fagel|moln|lov)/.test(svg.getAttribute('class')),
      };
      if (samla) {
        const lov = svg.classList.contains('rum-lov');
        Object.assign(f, {
          lov,
          y0: lov ? parseFloat(st.getPropertyValue('--y0')) || 0 : parseFloat(st.top) || 0,
          y1: lov ? parseFloat(st.getPropertyValue('--y1')) || 0 : 0,
          al: st.opacity === '' ? 1 : parseFloat(st.opacity),
          dur: (parseFloat(st.animationDuration) || 0) * 1000,
          fore: -(parseFloat(st.animationDelay) || 0) * 1000,
          // det som far förbi fort nog att hacka i gängets takt (molnen driver
          // några px i sekunden, och flaggan står på sin stång)
          fort: f.glid && !svg.classList.contains('rum-moln'),
        });
        // (molnen ritas en gång, det andra i gängets takt: stall)
        if (!f.ror) rita(f, 0);
        svg.remove();
        ut.push(f);
        continue;
      }
      rita(f, 0);
      svg.replaceWith(c);
      if (f.ror) ut.push(f);
    }
    if (samla) ark(ut.filter((f) => f.ror));
    return ut;
  }

  // Figurernas bilder i gatans duk ligger i ett gemensamt ark, en ruta var med en
  // tom bildpunkt runt: som ett tjugotal små dukar var de var sin yta på
  // grafikkortet, och gatan blev dyrare att lägga ut i varje bildruta.
  function ark(lista) {
    if (!lista.length) return;
    const W = Math.max(256, ...lista.map((f) => f.bw + 2));
    let x = 0;
    let y = 0;
    let rad = 0;
    for (const f of lista) {
      if (x + f.bw + 2 > W) {
        x = 0;
        y += rad;
        rad = 0;
      }
      f.ax = x + 1;
      f.ay = y + 1;
      x += f.bw + 2;
      rad = Math.max(rad, f.bh + 2);
    }
    const c = document.createElement('canvas');
    c.width = W;
    c.height = y + rad;
    // (i processorn: det är litet, tar inget ritminne, och grafikkortet läser in det
    // bara när ställningarna har ändrats)
    const g = c.getContext('2d', { willReadFrequently: true });
    for (const f of lista) {
      f.c = c;
      f.x = g;
      f.delad = true;
      // (en suddig figur ritas först för sig i kladden, rita)
      if (!f.bakad) {
        f.B[4] += f.ax;
        f.B[5] += f.ay;
      }
      rita(f, 0);
    }
  }

  // I telefonen ritas gatan (bron, stan och hörnhuset och det som står framför dem)
  // en gång i en grov duk, 0,4 bildpunkter per px: förstorad är den lika mjuk
  // som med oskärpan i CSS, som var ett pass på grafikkortet över hela gatan i
  // varje bildruta. Ett filter inne i SVG:n blev dyrare än så: Safari släpper
  // det som är utanför bilden medan kameran står nära och ritar om gatan, med
  // filtret, varje gång. En duk ritas inte om.
  const GATA = 0.4;
  // Skärpedjupet (rum-ute.css): gatan är ur skärpa. Den grova duken är mjuk i sig, ungefär som 1,3 px
  // oskärpa i datorn; DJUP läggs till (i scenens px) när gatan och himlen bakas, så att de blir lika
  // mjuka som där (3,4 px). Utan ctx.filter (äldre Safari) blir de som förut.
  const DJUP = 3.1;
  const djup = (g) => { if (FILTER) g.filter = `blur(${r1(DJUP * GATA * 10) / 10}px)`; return g; };
  async function bakaGata(x, klar) {
    const gen = (x._gen = (x._gen || 0) + 1);
    const xs = new XMLSerializer();
    const dukar = [];
    const svgs = [...x.querySelectorAll(':scope > svg')];
    for (const svg of svgs) {
      const k = svg.cloneNode(true);
      k.removeAttribute('style');
      k.removeAttribute('class');
      k.setAttribute('width', 1600);
      k.setAttribute('height', 1000);
      // (en bild ser inte resten av sidan: gradienterna och filtren följer med)
      const text = xs.serializeToString(k);
      const ids = new Set([...text.matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1]));
      const defs = [...ids].map((id) => (document.getElementById(id) || {}).outerHTML || '').join('');
      const url = URL.createObjectURL(new Blob([text.replace('>', `><defs>${defs}</defs>`)], { type: 'image/svg+xml' }));
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        if (x._gen !== gen || !svg.isConnected) return;
        const c = document.createElement('canvas');
        c.className = 'rum-layer';
        c.style.cssText = 'width:1600px; height:1000px';
        c.width = 1600 * GATA;
        c.height = 1000 * GATA;
        djup(c.getContext('2d')).drawImage(img, 0, 0, c.width, c.height);
        img.src = '';
        if (klar) dukar.push(c);
        else svg.replaceWith(c);
      } catch { /* då står SVG:n kvar, utan oskärpa */ } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (klar && x._gen === gen && dukar.length === svgs.length) {
      klar(dukar);
      for (const svg of svgs) svg.style.display = 'none';
    }
  }

  // Himlen på samma sätt i telefonen: en gradient som täcker hela utsikten tog 10 MB
  // av ritminnet, fast den bara syns genom fönstret. SVG:n ligger kvar, dold, så att
  // nästa ändring (paint) har något att skriva i.
  async function bakaHimmel(x, klar) {
    const gen = (x._gen = (x._gen || 0) + 1);
    const k = x.cloneNode(true);
    k.removeAttribute('style');
    k.removeAttribute('class');
    k.setAttribute('width', 1600);
    k.setAttribute('height', 1000);
    const text = new XMLSerializer().serializeToString(k);
    const ids = new Set([...text.matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1]));
    const defs = [...ids].map((id) => (document.getElementById(id) || {}).outerHTML || '').join('');
    const url = URL.createObjectURL(new Blob([text.replace('>', `><defs>${defs}</defs>`)], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (x._gen !== gen || !x.isConnected) return;
      // (i datorn låg duken i sidan; i gatans duk, från steg 1, ritas den där i stället)
      if (klar && x._duk && x._duk.isConnected) {
        x._duk.remove();
        x._duk = null;
      }
      const c = x._duk || document.createElement('canvas');
      c.className = 'rum-layer';
      c.style.cssText = 'width:1600px; height:1000px';
      c.width = 1600 * GATA;
      c.height = 1000 * GATA;
      djup(c.getContext('2d')).drawImage(img, 0, 0, c.width, c.height);
      img.src = '';
      if (klar) klar(c);
      else if (!x._duk) x.after(c);
      x._duk = c;
      x.style.display = 'none';
    } catch { /* då står SVG:n kvar */ } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---------- hela gatan i en duk ----------
  //
  // I telefonen ritas allt på gatan i en och samma duk, stor som det som syns
  // genom fönstret och dörren: himlen, molnen, fåglarna, husen och de som går
  // förbi. Förut gled ett par dussin små dukar var för sig på grafikkortet, med
  // husen och himlen över varandra i flera lager. En ofärgad duk (alpha: false)
  // gör dessutom att det bakom den inte ritas alls.
  //
  // Ställningen (benen, armarna, hjulen, vingarna, flaggan) ritas i gängets takt
  // i en ruta per figur (stall, ark), men var figurerna är på gatan räknas om i
  // varje bildruta, högst 60 gånger i sekunden (glid från rum.js), medan något som
  // far förbi syns: i gängets takt, 15–20 gånger i sekunden och på datorns lägsta
  // steg 5–8, hoppade en bil 10–50 px åt gången och de som går förbi ryckte fram.
  // Att lägga ut bilderna är ett par dussin kopieringar i en liten duk. Syns bara
  // molnen, som driver några px i sekunden, ritas gatan i gängets takt som förut.
  const GAT_S = 0.5;
  function gatduk(el, rects) {
    if (el._gat || !rects || !rects.length) return;
    const x = Math.min(...rects.map((r) => r.x));
    const y = Math.min(...rects.map((r) => r.y));
    const b = { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
    const c = document.createElement('canvas');
    c.className = 'rum-gatduk';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `left:${b.x}px; top:${b.y}px; width:${b.w}px; height:${b.h}px`;
    c.width = Math.ceil(b.w * GAT_S);
    c.height = Math.ceil(b.h * GAT_S);
    el._gat = { c, g: c.getContext('2d', { alpha: false }), b, himmel: null, gata: null };
    el.classList.add('samlad');
    el.prepend(c);
  }
  // var figuren f är på gatan efter nu ms: [x, y] (vänstra övre hörnet)
  function plats(f, nu) {
    if (!f.glid || !(f.dur > 0)) return [f.x0, f.y0];
    const q = (nu + f.fore) / f.dur;
    const p = q - Math.floor(q);
    return [f.x0 + f.fran + (f.till - f.fran) * p, f.lov ? f.y0 + (f.y1 - f.y0) * p : f.y0];
  }
  // syns genom fönstret eller dörren (m px marginal)
  const synsUte = (G, x, f, m = 0) => x + f.w + f.P >= G.b.x - m && x - f.P <= G.b.x + G.b.w + m;

  // Ställningarna efter nu ms i figurernas bilder, för dem som syns (eller strax
  // kommer in: 40 px är mer än en bil hinner mellan två av gängets bilder).
  function stall(el, nu) {
    const G = el._gat;
    if (!G || !el._dukar || RORELSE_AV.matches) return;
    for (const k of ['himliv', 'liv']) {
      for (const f of el._dukar[k] || []) {
        if (f.ror && synsUte(G, plats(f, nu)[0], f, 40)) rita(f, nu);
      }
    }
  }

  // Lägger ut gatan efter nu ms (utan nu: klockan, eller den fasta tiden i en
  // stillbild). → om något som far förbi syns (el._fort): då ska gatan ritas i
  // varje bildruta (glid).
  function ritaGatan(el, nu) {
    const G = el._gat;
    if (!G || !G.himmel || !G.gata) return false;
    const { g, b } = G;
    if (nu == null) nu = el._fast != null ? el._fast : performance.now();
    let fort = false;
    const bakgrund = (d) => {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.drawImage(d, b.x * GATA, b.y * GATA, b.w * GATA, b.h * GATA, 0, 0, g.canvas.width, g.canvas.height);
    };
    const figurer = (lista) => {
      if (RORELSE_AV.matches) return;
      for (let i = 0; i < lista.length; i++) {
        const f = lista[i];
        const [x, y] = plats(f, nu);
        if (!synsUte(G, x, f)) continue;
        if (f.fort) fort = true;
        g.globalAlpha = f.al;
        g.drawImage(f.c, f.ax || 0, f.ay || 0, f.bw, f.bh, (x - b.x - f.P) * GAT_S, (y - b.y - f.P) * GAT_S, (f.w + 2 * f.P) * GAT_S, (f.h + 2 * f.P) * GAT_S);
      }
    };
    bakgrund(G.himmel);
    figurer(el._dukar.himliv || []);
    for (const d of G.gata) bakgrund(d);
    figurer(el._dukar.liv || []);
    // det som går och kör förbi framför affären (ritaFram)
    if (el._fram && !RORELSE_AV.matches) {
      if (ritaFramMjuk(el, g, nu / 1000, b.x, b.y, GAT_S, b)) fort = true;
    }
    // regnet och snön: banden faller (och snön driver)
    if (G.fall) {
      if (!RORELSE_AV.matches) fort = true;
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (const f of G.fall) {
        const q = RORELSE_AV.matches ? 0.5 : nu / f.dur;
        const p = q - Math.floor(q);
        let x = FALL.x + f.dx;
        if (f.sd && !RORELSE_AV.matches) {
          const s = (nu + f.sf) / f.sd;
          const i = Math.floor(s);
          x += f.sway * (IO(i % 2 ? 1 - (s - i) : s - i) - 0.5);
        }
        g.globalAlpha = f.al;
        g.drawImage(f.c, (x - b.x) * GAT_S, (FALL.y - (f.h / 2) * (1 - p) - b.y) * GAT_S, f.w * GAT_S, f.h * GAT_S);
      }
    }
    g.globalAlpha = 1;
    // blixten (åska) över hela gatan, som lagret .rum-blixt med sina två ljus
    if (G.blixt && !RORELSE_AV.matches) {
      const a = 1 - (1 - blixtA(nu / 17000)) * (1 - blixtA((nu + 11000) / 29000));
      if (a > 0.004) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalAlpha = 0.45 * a;
        g.fillStyle = '#eef3ff';
        g.fillRect(0, 0, g.canvas.width, g.canvas.height);
        g.globalAlpha = 1;
      }
    }
    // dropparna, snön och frosten på rutan (bakaGlas)
    if (G.glas) {
      const q = G.glas;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(q.c, (q.x - b.x) * GAT_S, (q.y - b.y) * GAT_S, q.w * GAT_S, q.h * GAT_S);
    }
    el._fort = fort;
    return fort;
  }
  const RORELSE_AV = matchMedia('(prefers-reduced-motion: reduce)');
  // blixtens styrka efter q varv (nyckelbilderna rum-blixt i rum-ute.css, rakt mellan dem)
  const BLIXT = [[0, 0], [0.9, 0], [0.906, 0.85], [0.912, 0.08], [0.92, 0.6], [0.94, 0], [1, 0]];
  function blixtA(q) {
    const p = q - Math.floor(q);
    for (let i = 1; i < BLIXT.length; i++) {
      const [x1, y1] = BLIXT[i];
      if (p > x1) continue;
      const [x0, y0] = BLIXT[i - 1];
      return y0 + ((y1 - y0) * (p - x0)) / (x1 - x0);
    }
    return 0;
  }

  // I varje bildruta från rum.js (ms: bildrutans tid), medan gatan syns och rör
  // sig: gatan läggs ut på nytt bara när något som far förbi syns, annars i
  // gängets takt (takt). → om gatan ska ritas i varje bildruta.
  function glid(el, ms) {
    if (!el || !el._fort || el._fast != null) return false;
    if (el._gat) return ritaGatan(el, ms);
    // (i datorn: medan ett fordon kör förbi framför affären, framDuk)
    return framDuk(el, ms) === 2;
  }

  // Regnets och snöns band (fall) som bilder, en gång, i gatans duk: som egna lager gled de över hela
  // utsikten på grafikkortet, och då ritades hela rummet om 60 gånger i sekunden medan det regnade.
  const FALL = { x: 36, y: 120 };
  async function bakaFall(x, el) {
    const G = el._gat;
    const gen = (x._gen = (x._gen || 0) + 1);
    x.style.display = '';
    G.fall = null;
    const ut = [];
    for (const e of x.querySelectorAll('.rum-regn-b')) {
      const svg = e.querySelector('svg');
      const w = parseFloat(svg.getAttribute('width'));
      const h = parseFloat(svg.getAttribute('height'));
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        if (x._gen !== gen) return;
        const c = document.createElement('canvas');
        c.width = Math.ceil(w * GAT_S);
        c.height = Math.ceil(h * GAT_S);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        img.src = '';
        const sv = e.parentElement.classList.contains('rum-sno-v') ? e.parentElement : null;
        ut.push({
          c, w, h, dur: (parseFloat(e.style.animationDuration) || 0.7) * 1000, al: e.classList.contains('fjarr') ? 0.8 : 1,
          dx: sv ? -60 : 0, sway: sv ? parseFloat(sv.style.getPropertyValue('--sway')) || 0 : 0,
          sd: sv ? (parseFloat(sv.style.animationDuration) || 0) * 1000 : 0, sf: sv ? -(parseFloat(sv.style.animationDelay) || 0) * 1000 : 0,
        });
      } catch { return; /* då får regnet glida som förut */ } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (!ut.length) return;
    G.fall = ut;
    x.style.display = 'none';
    ritaGatan(el);
  }

  // Dropparna, snön och frosten på rutan (glas) som en bild i gatans duk i telefonen, en gång. Som eget
  // lager över fönstret och dörren lade grafikkortet dem över rummet i varje bildruta (0,4 skärmytor),
  // fast de står still. Där ritas utsikten ändå med 0,4 bildpunkter per px (rum.css).
  async function bakaGlas(x, el) {
    const G = el._gat;
    const gen = (x._gen = (x._gen || 0) + 1);
    G.glas = null;
    const svg = x.querySelector(':scope > svg');
    if (!svg) return ritaGatan(el);
    const vb = svg.viewBox.baseVal;
    const k = svg.cloneNode(true);
    k.removeAttribute('style');
    k.removeAttribute('class');
    k.setAttribute('width', vb.width);
    k.setAttribute('height', vb.height);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(k)], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (x._gen !== gen || el._gat !== G) return;
      const c = document.createElement('canvas');
      c.width = Math.ceil(vb.width * GAT_S);
      c.height = Math.ceil(vb.height * GAT_S);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      img.src = '';
      G.glas = { c, x: vb.x, y: vb.y, w: vb.width, h: vb.height };
      svg.style.display = 'none';
      ritaGatan(el);
    } catch { /* då står SVG:n kvar */ } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Ställningarna efter t ms (rum.js: i gängets takt, eller den fasta
  // tiden i en stillbild); bara det som syns genom fönstret och dörren.
  // Var en figur är läses bara för en figur i taget: i Safari räknar varje
  // läsning (getComputedTiming) om stilen, och med den alla rummets lager om
  // något har ändrats. Däremellan räknas läget fram ur farten.
  let tur = 0;
  function takt(el, t, glesa = true) {
    // (det som går och kör förbi framför affären ritas om i den här takten, ritaFramMjuk)
    if (el) el._framTakt = (el._framTakt || 0) + 1;
    if (el && el._gat) {
      // (i en stillbild står klockan still, också när bilderna blir klara efteråt)
      if (t != null) el._fast = t;
      const nu = el._fast != null ? el._fast : performance.now();
      stall(el, nu);
      // (far något förbi läggs gatan ut i nästa bildruta, glid)
      if (!el._fort || el._fast != null) ritaGatan(el, nu);
      return;
    }
    // (framför affären, i datorn: de som går i gängets takt, och medan ett fordon kör förbi i varje bildruta, glid)
    if (el && el._framC) {
      if (t != null) el._fast = t;
      if (el._fast != null || !el._fort) framDuk(el, el._fast != null ? el._fast : performance.now());
    }
    if (!el || !el._duk) return;
    const [X0, X1] = el._x || [-Infinity, Infinity];
    const nu = performance.now();
    const fast = t != null;
    tur++;
    el._duk.forEach((f, i) => {
      if (f.glid) {
        if (f.a === undefined) f.a = f.c.getAnimations ? f.c.getAnimations()[0] || null : null;
        if (f.a && f.a.effect && (fast || f.pt === undefined || i === tur % el._duk.length)) {
          const c = f.a.effect.getComputedTiming();
          f.p = c.progress;
          f.pt = nu;
          f.dur = c.duration;
        }
        if (f.p != null) {
          const p = (f.p + (f.dur > 0 ? (nu - f.pt) / f.dur : 0)) % 1;
          const x = f.x0 + f.fran + (f.till - f.fran) * p;
          if (x + f.w + f.P < X0 || x - f.P > X1) return;
        }
      }
      if (LATT && !fast && glesa && (i + tur) % 2) return;
      rita(f, fast ? t : (document.timeline.currentTime || 0) - f.t0);
    });
  }


  // Kall gata, varmt rum: ute går färgerna mot blågrått medan det är ljust, så att gänget och det varma
  // rummet lyfter från gatan. Det görs i färgerna när gatan ritas (också de som går förbi), inte med
  // ett filter, så det kostar inget sedan. På kvällen och natten står allt som det brukar. mat0: hur
  // mycket färgen går ur – mindre i himlen, och i bron och husen så att hörnhuset är laxrosa och stan
  // varm som från Bron, mer i dem som går förbi. kallFarg gör det med en färg (också utsikten bakom
  // Hasse Backe, rum-hasse-ute.js).
  function kallFarg(c, L, mat0) {
    const t = Math.min(1, L.dag * 1.3);
    if (t < 0.03) return c;
    const mat = mat0 * t;
    const kon = 1 - 0.16 * t;
    const lju = 1 - 0.06 * t;
    const bla = [110, 140, 175];
    const [r, g, b] = rgb(c);
    const y = 0.3 * r + 0.59 * g + 0.11 * b;
    return hx([r, g, b].map((x, i) => {
      const a = (128 + (y + (x - y) * (1 - mat) - 128) * kon) * lju;
      return a + (bla[i] - a) * 0.2 * t;
    }));
  }
  function kall(svg, L, mat0) {
    if (Math.min(1, L.dag * 1.3) < 0.03) return svg;
    return svg.replace(/#[0-9a-f]{6}\b/gi, (c) => kallFarg(c, L, mat0));
  }

  const KALL = { himmel: 0.4, gata: 0.3, liv: 0.58, himliv: 0.58 };

  // el: utsiktens lager i rum.js; rects: fönstrets och dörrens glas
  function paint(el, v, rects) {
    if (!el) return false;
    const L = light(v);
    if (!el.querySelector('[data-lager]')) {
      for (const [k, tag, cls] of LAGER) {
        const x = tag === 'svg' ? document.createElementNS('http://www.w3.org/2000/svg', 'svg') : document.createElement('div');
        x.setAttribute('class', cls);
        x.dataset.lager = k;
        if (tag === 'svg') { x.setAttribute('viewBox', '0 0 1600 1000'); x.setAttribute('aria-hidden', 'true'); }
        el.appendChild(x);
      }
      el._sig = {};
    }
    const SAMLA = LATT || el._samla;
    if (SAMLA && !el._gat) {
      gatduk(el, rects);
      el._sig = {};
    }
    const sig = sigs(v, L);
    sig.blixt = String(v.slag === 'aska');
    // (med gatan i en duk blinkar blixten där, ritaGatan: två lager i hela utsiktens storlek som
    // tonade upp och ner på grafikkortet gjorde att hela rummet ritades om 60 gånger i sekunden)
    if (el._gat) el._gat.blixt = v.slag === 'aska';
    const draw = { himmel: () => himmel(v, L), himliv: () => himmelsliv(v, L), gata: () => gata(v, L), liv: () => gatliv(v, L), fall: () => fall(v), glas: () => glas(v, rects), blixt: () => (v.slag === 'aska' && !el._gat ? '<i></i><i class="b2"></i>' : '') };
    let changed = false;
    // dukarna: bildpunkter per px som utsikten syns (högst 2), och det som
    // syns genom fönstret och dörren (med marginal)
    const skala = el.getBoundingClientRect().width / 1600;
    const s = Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * (skala > 0 ? skala : 1)));
    if (rects && rects.length) el._x = [Math.min(...rects.map((r) => r.x)) - 60, Math.max(...rects.map((r) => r.x + r.w)) + 60];
    el._dukar = el._dukar || {};
    for (const [k] of LAGER) {
      if (el._sig[k] === sig[k]) continue;
      el._sig[k] = sig[k];
      const x = el.querySelector(`[data-lager="${k}"]`);
      x.innerHTML = KALL[k] ? kall(draw[k](), L, KALL[k]) : draw[k]();
      if (k === 'liv' || k === 'himliv') el._dukar[k] = duka(x, s, Boolean(el._gat));
      // (framför affären: fasadens folk och trafik i det här ljuset och vädret, framModell)
      if (k === 'liv') el._fram = framModell(el, v, L);
      const G = el._gat;
      // (gatan och himlen bakas till dukar med oskärpan, också i datorn: som filter i CSS lade grafikkortet
      // på oskärpan i varje bildruta, rum-ute.css)
      const baka = SAMLA || FILTER;
      if (k === 'gata' && baka) bakaGata(x, G && ((d) => { G.gata = d; ritaGatan(el); }));
      if (k === 'himmel' && baka) bakaHimmel(x, G && ((d) => { G.himmel = d; ritaGatan(el); }));
      if (k === 'fall' && G) bakaFall(x, el);
      // (i datorn står de kvar i full skärpa: gatans duk har en halv bildpunkt per px)
      if (k === 'glas' && G && LATT) bakaGlas(x, el);
      changed = true;
    }
    el._duk = [...(el._dukar.liv || []), ...(el._dukar.himliv || [])];
    // I datorn en egen duk över glasen för det framför affären (framDuk); i gatans duk ritas det där.
    if (el._gat && el._framC) {
      el._framC.remove();
      el._framC = null;
    } else if (!el._gat && !el._framC && rects && rects.length) {
      const r = { x: Math.min(...rects.map((q) => q.x)), y: Math.min(...rects.map((q) => q.y)) };
      r.w = Math.max(...rects.map((q) => q.x + q.w)) - r.x;
      r.h = Math.max(...rects.map((q) => q.y + q.h)) - r.y;
      const c = document.createElement('canvas');
      c.className = 'rum-fram';
      c.setAttribute('aria-hidden', 'true');
      c.style.cssText = `left:${r.x}px; top:${r.y}px; width:${r.w}px; height:${r.h}px`;
      c.width = Math.ceil(r.w * FRAM.px);
      c.height = Math.ceil(r.h * FRAM.px);
      el._framC = c;
      el._framR = r;
      el._framTom = true;
      el.querySelector('[data-lager="fall"]').before(c);
    }
    if (el._framC && changed) framDuk(el, el._fast != null ? el._fast : performance.now());
    if (el._gat && changed) {
      stall(el, el._fast != null ? el._fast : performance.now());
      ritaGatan(el);
    }
    return changed;
  }

  // (färgerna, för utsikten bakom Hasse Backe: samma ljus och samma kalla dag som här)
  return { paint, light, takt, glid, farg: { mix, facade, kall: kallFarg, sno: snowC, KALL }, trafik: { nu: trafik } };
})();
