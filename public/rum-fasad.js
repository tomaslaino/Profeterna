'use strict';

// ---------- fasaden: tobaksaffären utifrån ----------
//
// Ett klick på namnet på dörren (rum.js) och man står ute på trottoaren och ser affären utifrån, där
// baren Bron ligger vid S:t Eriksbron: det laxrosa huset med den ljusa bottenvåningen, skylten
// MATCHFIXARNA över skyltfönstret och dörren, och till höger brons gröna räcke med stan på andra sidan.
// Det är samma klocka, ljus och väder som genom fönstret inifrån (Vader.nu, RumUte.light och
// RumUte.farg i rum-ute.js) och samma trafik (RumUte.trafik): himlen, molnen, regnet och snön, de som går
// förbi, lyktorna som tänds och bilarna på gatan bakom en, som syns som speglingar i glaset.
//
// Genom skyltfönstret syns rummet, vagt: gänget vid barbordet bakifrån, ritat i 3D av samma scen som
// inne (Rum.utifran, utifran i rum-3d.js), med neonskylten Tobak, som läses rätt härifrån, skivan med
// löpsedlarna med baksidan ut och rummet bakom i ljuset från lysröret – eller i neonens och tv:ns sken
// när lysröret är släckt på natten (RumFolk.nattGrad). På dagen speglar glaset himlen och gatan, och
// rummet syns svagare; på kvällen lyser det ut på trottoaren. Guldet på dörren står rättvänt, och
// skylten på sugproppen säger ÖPPET på den här sidan.
//
// Scenen ritas i meter-skala på fasaden (M enheter per meter) och den del som syns (vy) väljs efter
// fönstrets form: skyltfönstret, dörren och skylten syns alltid, och i ett brett fönster bron och himlen,
// i ett högt fler våningar och mer trottoar. Det som står still är en SVG per lager som ritas om bara när
// ljuset eller vädret ändras (sig); det som rör sig (molnen, de som går, speglingarna, regnet och snön)
// har bara transform och opacity, och står still med prefers-reduced-motion.
//
//   RumFasad.bygg(rum, o) → { el, ny(), ut() } bygger fasaden i rum (.rum) och ritar den;
//     o.gang(duk) ritar gänget på duken (false utan), o.neon() neonen tänd just nu, o.natt() 0…1 hur
//     släckt lysröret är, o.calm() utan rörelser (prefers-reduced-motion), o.still en fast bild på den
//     tiden (s, ?rum-t i rum.js): allt som rör sig står där det är då

window.RumFasad = (() => {
  const r1 = (x) => Math.round(x * 10) / 10;
  function rng(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pick = (R, a) => a[(R() * a.length) | 0];
  // (färgerna och ljuset ur rum-ute.js, så att det är samma himmel som inifrån)
  const U = () => window.RumUte;
  const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const hx = (a) => `#${a.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;
  const mix = (a, b, t) => { const A = rgb(a); const B = rgb(b); return hx(A.map((x, i) => x + (B[i] - x) * t)); };
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;

  // ---------- måtten ----------
  //
  // M enheter per meter på fasaden. MARK: trottoaren vid fasaden; HOR: ögonhöjden (1,6 m), dit
  // trottoarens fogar löper; OGA_X ögat i sidled; AVST: hur långt från fasaden man står (m).
  // FON skyltfönstrets glas och DORR dörrens glas (glaset i rum-3d.js, FONSTER, har samma form som FON).
  const M = 207;
  const MARK = 860;
  const HOR = MARK - 1.6 * M;
  const OGA_X = 820;
  const AVST = 5;
  const FON = { x: 430, y: 404, w: 520, h: 333 };
  const DORR = { x: 990, y: 404, w: 124, h: 440 };
  const KARM = 12;
  const SKYLT = { x: 398, y: 296, w: 748, h: 84 };
  const HORN = 1250;
  const RACKE = MARK - 1.1 * M;
  // det som alltid ska synas, och världens kanter
  const FOKUS = { x0: 380, x1: 1180, y0: 270, y1: 960 };
  const VARLD = { x0: -900, x1: 2900, y0: -1100, y1: 1400 };
  // en punkt på marken d meter ut från fasaden: dess höjd i bilden och skalan där
  const markY = (d) => HOR + (MARK - HOR) * AVST / (AVST - d);
  const skala = (d) => AVST / (AVST - d);

  // Den del av världen som syns i ett fönster med formen a (bredd / höjd).
  function vy(a) {
    let h = 940;
    let w = h * a;
    const minW = FOKUS.x1 - FOKUS.x0 + 70;
    if (w < minW) { w = minW; h = w / a; }
    let x = 860 - w / 2;
    x = Math.max(FOKUS.x1 + 35 - w, Math.min(FOKUS.x0 - 35, x));
    x = Math.max(VARLD.x0, Math.min(VARLD.x1 - w, x));
    // (mer höjd: två tredjedelar uppåt, fler våningar, och resten trottoar)
    const extra = Math.max(0, h - 940);
    const y = Math.max(VARLD.y0, 40 - extra * 0.66);
    return { x: r1(x), y: r1(y), w: r1(w), h: r1(h) };
  }

  // ---------- ljuset ----------

  // Färgen i gatans ljus för det som står i det: dag → natt, och lite varmt i gatlyktornas sken.
  function tone(c, L, varm = 0.1) {
    return mix(mix('#07080b', c, 0.16 + 0.84 * L.dag), '#ffb060', varm * (1 - L.dag));
  }
  // Puts och sten: som husen inifrån (RumUte.farg.facade), dämpat i mulet och blåaktigt i skymningen.
  const puts = (dag, natt, L) => U().farg.facade(dag, natt, L);
  const snoC = (L) => U().farg.sno(L);

  // hur ljust det är inne (1 lysröret tänt … 0 släckt), och hur mycket rummet lyser ut (mer i mörker)
  function inne(o) {
    const n = Math.max(0, Math.min(1, o.natt ? o.natt() : 0));
    return 1 - 0.78 * n;
  }

  // ---------- himlen ----------

  function himmel(V, v, L) {
    const [a, b, c] = L.sky;
    let s = `<defs><linearGradient id="rf-sky" gradientUnits="userSpaceOnUse" x1="0" y1="${V.y}" x2="0" y2="${HOR + 60}"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
      <radialGradient id="rf-mane" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e8eef8" stop-opacity=".55"/><stop offset="1" stop-color="#e8eef8" stop-opacity="0"/></radialGradient>
      <radialGradient id="rf-solsken" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4d6" stop-opacity=".75"/><stop offset=".35" stop-color="#ffd9a0" stop-opacity=".25"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient></defs>
      <rect x="${V.x}" y="${V.y}" width="${V.w}" height="${V.h}" fill="url(#rf-sky)"/>`;
    // stjärnorna, svaga i stadens ljus
    const st = (1 - sm(-9, -6, v.sol)) * (1 - sm(0.15, 0.55, L.m));
    if (st > 0.02) {
      const R = rng(43);
      for (let i = 0; i < 70; i++) {
        const x = HORN + R() * 1700;
        const y = V.y + R() * (HOR - 120 - V.y);
        s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(1 + R() * 1.6)}" fill="#f2f4ff" opacity="${r1(st * (0.2 + R() * 0.5))}"/>`;
      }
    }
    // månen, när den är uppe
    const mo = v.mane;
    const mv = sm(2, 8, mo.h) * (1 - sm(-3, 2, v.sol)) * (1 - sm(0.45, 0.85, L.m));
    if (mv > 0.03 && mo.fas > 0.04 && mo.fas < 0.96) {
      const cx = 1560; const cy = Math.max(V.y + 120, 120); const r = 22;
      const wax = mo.fas < 0.5;
      const k = (1 - Math.cos(2 * Math.PI * mo.fas)) / 2;
      const rx = r1(r * Math.abs(Math.cos(2 * Math.PI * mo.fas)));
      s += `<circle cx="${cx}" cy="${cy}" r="${r * 5}" fill="url(#rf-mane)" opacity="${r1(mv * (0.3 + 0.7 * k))}"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1c2233" opacity="${r1(mv * 0.5)}"/>` +
        `<path d="M${cx} ${cy - r} A${r} ${r} 0 0 ${wax ? 1 : 0} ${cx} ${cy + r} A${rx} ${r} 0 0 ${wax === k > 0.5 ? 1 : 0} ${cx} ${cy - r} Z" fill="#eef1e6" opacity="${r1(mv)}"/>`;
    }
    // låg sol bakom stan: ett sken över taken
    if (L.sol > 0.05 && L.guld > 0.05) s += `<ellipse cx="1750" cy="${HOR - 40}" rx="520" ry="260" fill="url(#rf-solsken)" opacity="${r1(L.guld * L.sol)}"/>`;
    return s;
  }

  // Molnen som driver (bakom huset), fåglarna, tornseglarna och fyrverkerierna.
  function himmelsliv(V, v, L) {
    const R = rng(v.ar * 977 + v.manad * 61 + v.dag * 7 + (v.timme >> 2));
    let s = '';
    const m = L.m;
    const fran = HORN - 500;
    const till = V.x + V.w + 400;
    if (m > 0.12 && m < 0.92 && v.slag !== 'dimma' && till > HORN) {
      const n = Math.round(2 + m * 5);
      const lit = mix(mix(mix('#1b1916', '#f3f5f7', L.dag), '#f2b08c', 0.55 * L.guld), '#3a4870', 0.5 * L.bla);
      const dark = mix(lit, '#596273', 0.35 + 0.2 * m);
      for (let i = 0; i < n; i++) {
        const w = 280 + R() * 380;
        const y = V.y + 60 + R() * Math.max(80, HOR - 260 - V.y);
        const dur = 240 + R() * 260;
        let blob = '';
        for (let j = 0; j < 5; j++) {
          const bx = (j / 4 - 0.5) * w * 0.7 + (R() - 0.5) * 40;
          blob += `<ellipse cx="${r1(bx)}" cy="${r1(-(R() * 24) + Math.abs(j - 2) * 9)}" rx="${r1(w * (0.18 + R() * 0.12))}" ry="${r1(22 + R() * 22)}" fill="${j % 2 ? dark : lit}"/>`;
        }
        s += `<svg class="rf-glid rf-moln" style="left:0; top:${r1(y - 90 - V.y)}px; --fran:${r1(fran - V.x - 500)}px; --till:${r1(till - V.x)}px; animation-duration:${r1(dur)}s; animation-delay:-${r1(R() * dur)}s; opacity:${r1(0.55 + 0.35 * m)}" viewBox="-500 -90 1000 180" width="1000" height="180">${blob}</svg>`;
      }
    }
    // måsar och kråkor på dagen
    if (L.dag > 0.4 && (!v.fall || v.mangd < 0.5) && till > HORN) {
      const krakor = v.arstid === 'vinter';
      for (let i = 0; i < 2; i++) {
        const dur = 30 + R() * 40;
        const dir = R() < 0.5 ? 1 : -1;
        const col = krakor ? '#15151a' : mix('#6b6f76', '#f2f2ee', L.dag);
        let flock = '';
        const k = 1 + ((R() * 3) | 0);
        for (let j = 0; j < k; j++) flock += `<g transform="translate(${r1(j * 40 + R() * 16)} ${r1((R() - 0.5) * 30)})"><path class="rf-vinge" d="M-14 0 Q-7 -7 0 0 Q7 -7 14 0" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" style="animation-duration:${r1(0.5 + R() * 0.4)}s"/></g>`;
        const a = fran - V.x - 200;
        const b = till - V.x + 1200;
        s += `<svg class="rf-glid rf-fagel" style="left:0; top:${r1(Math.max(40, HOR - 520 - V.y + R() * 260))}px; --fran:${dir > 0 ? a : b}px; --till:${dir > 0 ? b : a}px; animation-duration:${r1(dur)}s; animation-delay:-${r1(R() * dur)}s" viewBox="-20 -24 150 48" width="150" height="48">${flock}</svg>`;
      }
    }
    // fyrverkerierna: nyårsnatten, och lite här och var på nyårsafton
    const nyarsafton = v.manad === 12 && v.dag === 31 && v.timme >= 18;
    if ((v.nyar || nyarsafton) && till > HORN) {
      const n = v.nyar ? 7 : 2;
      const cols = ['#ffd36a', '#ff5a4a', '#7dffb0', '#ffffff', '#7ab8ff', '#ff8ad8'];
      for (let i = 0; i < n; i++) {
        const c = pick(R, cols);
        const x = HORN + 120 + R() * Math.max(200, till - 400 - HORN);
        const y = HOR - 200 - R() * 260;
        const rr = 34 + R() * 40;
        let rays = '';
        for (let j = 0; j < 14; j++) {
          const an = j / 14 * 2 * Math.PI + R() * 0.2;
          rays += `<line x1="${r1(Math.cos(an) * rr * 0.25)}" y1="${r1(Math.sin(an) * rr * 0.25)}" x2="${r1(Math.cos(an) * rr)}" y2="${r1(Math.sin(an) * rr + 4)}"/><circle cx="${r1(Math.cos(an) * rr)}" cy="${r1(Math.sin(an) * rr + 6)}" r="2"/>`;
        }
        const dur = (v.nyar ? 2.6 : 9) + R() * 4;
        s += `<svg class="rf-pang" style="left:${r1(x - 100 - V.x)}px; top:${r1(y - 100 - V.y)}px; animation-duration:${r1(dur)}s; animation-delay:-${r1(R() * dur)}s" viewBox="-100 -100 200 200" width="200" height="200"><g stroke="${c}" fill="${c}" stroke-width="2.6" stroke-linecap="round">${rays}</g><circle r="8" fill="#fff" opacity=".8"/></svg>`;
      }
    }
    return s;
  }

  // ---------- bortom bron ----------
  //
  // Till höger om huset börjar S:t Eriksbron: bortom räcket stupar det ned mot spåren, och där syns
  // trädtopparna, kontaktledningarnas stolpar och stan på andra sidan, långt bort i diset vid ögonhöjden.

  const lovet = (v) => (v.manad === 5 ? 'ljus' : v.manad >= 6 && v.manad <= 8 ? 'gron'
    : (v.manad === 9 && v.dag >= 20) || v.manad === 10 || (v.manad === 11 && v.dag <= 25) ? 'host'
      : v.manad === 9 ? 'gron' : 'kal');

  function bortom(V, v, L) {
    let s = '';
    const dis = (c, t) => mix(c, L.sky[2], t);
    const sno = v.snotackt ? snoC(L) : null;
    const fern = mix(mix('#0b0e16', L.sky[2], 0.3 + 0.35 * L.dag), '#4a5262', 0.2 * L.dag);
    const R = rng(71);
    // stan: en rad låga hus vid ögonhöjden, en kyrkspira och två lyftkranar
    let x = HORN - 40;
    let rad = `M${x} ${HOR + 40}`;
    const tanda = [];
    while (x < VARLD.x1) {
      const w = 40 + R() * 90;
      const t = HOR - 14 - R() * 46;
      rad += ` V${r1(t)} H${r1(x + w)}`;
      if (L.tand > 0.02) for (let i = 0; i < 4; i++) if (R() < L.tand * 1.4) tanda.push([x + 6 + R() * (w - 12), t + 8 + R() * (HOR + 30 - t)]);
      x += w;
    }
    rad += ` V${HOR + 40} Z`;
    const hus = dis(puts('#c99a6a', '#0d1017', L), 0.38);
    s += `<path d="${rad}" fill="${hus}"/>`;
    s += `<path d="M1720 ${HOR - 56} L1734 ${HOR - 150} L1748 ${HOR - 56} Z" fill="${dis(mix(fern, '#6f9484', 0.4 * L.dag), 0.2)}"/><rect x="1722" y="${HOR - 58}" width="24" height="50" fill="${dis(fern, 0.15)}"/>`;
    const kran = dis(mix('#0d0f14', '#c7a43a', L.dag * 0.8), 0.35);
    s += `<g stroke="${kran}" stroke-width="3" fill="none"><path d="M1980 ${HOR - 30} V${HOR - 230} M1890 ${HOR - 222} H2120 M1980 ${HOR - 230} L1930 ${HOR - 222} M1980 ${HOR - 230} L2060 ${HOR - 222}"/><path d="M2330 ${HOR - 20} V${HOR - 190} M2260 ${HOR - 184} H2440" stroke-width="2.4"/></g>`;
    if (L.lampor) s += `<circle cx="1980" cy="${HOR - 232}" r="3" fill="#ff3b30"/><circle cx="1980" cy="${HOR - 232}" r="10" fill="#ff3b30" opacity=".35"/>`;
    if (L.dag < 0.7 && tanda.length) s += `<g fill="#ffd58a" opacity="${r1(0.85 * (1 - L.dag / 0.7))}">${tanda.map(([a, b]) => `<rect x="${r1(a)}" y="${r1(b)}" width="5" height="6"/>`).join('')}</g>`;
    // slänten ned mot spåren, bakom räcket
    s += `<rect x="${HORN}" y="${HOR + 34}" width="${VARLD.x1 - HORN}" height="${MARK - HOR}" fill="${dis(mix('#06080a', mix('#3a4a34', '#6a6a5e', 0.3 * L.m), L.dag), 0.12)}"/>`;
    // kontaktledningarnas stolpar och tråden över spåren
    const ledn = dis(mix('#0c0e12', '#59606a', L.dag), 0.25);
    s += `<g stroke="${ledn}" fill="none"><path d="M1420 ${RACKE + 30} V${HOR + 16} M1408 ${HOR + 22} H1520 M1880 ${RACKE + 30} V${HOR + 6} M1866 ${HOR + 12} H1990 M2380 ${RACKE + 30} V${HOR + 4} M2366 ${HOR + 10} H2490" stroke-width="5"/><path d="M${HORN} ${HOR + 30} Q1650 ${HOR + 40} 2900 ${HOR + 26}" stroke-width="1.6" opacity=".7"/></g>`;
    // trädtopparna nedanför bron, i årstidens färg
    const lov = lovet(v);
    const tc = { ljus: ['#6f9a48', '#86ad55'], gron: ['#2f5a34', '#3f6d3c'], host: ['#b8792e', '#c99a3a'], kal: ['#5e5650', '#6e665e'] }[lov];
    const tm = (c) => {
      const t = mix('#07090c', mix(c, '#7f8894', 0.25 * L.m), Math.pow(L.dag, 1.1));
      return sno && lov === 'kal' ? mix(t, sno, 0.35) : t;
    };
    const RT = rng(37);
    let trad = '';
    for (const [tx, top, tw] of [[1330, HOR + 40, 260], [1560, HOR + 28, 300], [1830, HOR + 46, 200], [2080, HOR + 34, 320], [2400, HOR + 44, 260], [2700, HOR + 36, 300]]) {
      trad += `<rect x="${r1(tx - tw * 0.42)}" y="${top + 30}" width="${r1(tw * 0.84)}" height="${RACKE + 60 - top}" fill="${tm(tc[0])}"/>`;
      for (let j = 0; j < 5; j++) trad += `<ellipse cx="${r1(tx + (j / 4 - 0.5) * tw * 0.7)}" cy="${r1(top + 26 + RT() * 16)}" rx="${r1(tw * (0.18 + RT() * 0.08))}" ry="${r1(28 + RT() * 14)}" fill="${tm(tc[j % 2])}"/>`;
    }
    s += lov === 'kal' ? `<g opacity=".7">${trad}</g>` : trad;
    // dimman tar det som är långt borta
    if (L.dimma > 0.05) s += `<rect x="${HORN}" y="${V.y}" width="${VARLD.x1 - HORN}" height="${RACKE + 40 - V.y}" fill="${mix('#2a2622', '#aeb3b6', L.dag)}" opacity="${r1(0.75 * L.dimma)}"/>`;
    return s;
  }

  // ---------- rummet genom glaset ----------
  //
  // Det som syns bakom gänget: rummet i lysrörets ljus (och på natten neonens och tv:ns), vagt – ritat
  // mjukt med oskärpa, så att gänget i 3D framför står ut. Sett utifrån är rummets högra vägg (tv:n,
  // Tipsligan och cigarettpaketen) till vänster och baren där Hasse Backe sitter till höger.

  function rummet(v, L, o) {
    const ljus = inne(o);
    const n = 1 - ljus;
    const vagg = mix('#2a1a10', '#8a6440', ljus);
    const tak = mix('#120c08', '#4a3626', ljus);
    const disk = mix('#140c07', '#4a2c18', ljus);
    const { x, y, w, h } = FON;
    const d = DORR;
    // ett rum för fönstret och ett för dörren: de har samma vägg och samma ljus
    const ett = (X, Y, W, H, hela) => {
      let s = `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${vagg}"/>`;
      // träpanelen
      let p = '';
      for (let px = X + 8; px < X + W; px += 26) p += `M${px} ${Y} V${Y + H}`;
      s += `<path d="${p}" stroke="#000" stroke-opacity=".14" stroke-width="3"/>`;
      // taket och lysröret (släckt på natten)
      s += `<rect x="${X}" y="${Y}" width="${W}" height="${r1(H * 0.11)}" fill="${tak}"/>`;
      if (hela) {
        s += `<rect x="${r1(X + W * 0.18)}" y="${r1(Y + H * 0.055)}" width="${r1(W * 0.62)}" height="9" rx="4.5" fill="${mix('#3a3a36', '#fffbea', ljus)}"/>`;
        if (ljus > 0.3) s += `<ellipse cx="${r1(X + W * 0.49)}" cy="${r1(Y + H * 0.08)}" rx="${r1(W * 0.46)}" ry="${r1(H * 0.2)}" fill="url(#rf-g-vit)" opacity="${r1(0.6 * ljus)}"/>`;
        // hyllan med cigarettpaketen bakom disken
        const R = rng(19);
        let pk = '';
        for (const hy of [0.3, 0.42]) {
          s += `<rect x="${r1(X + W * 0.3)}" y="${r1(Y + H * hy + 26)}" width="${r1(W * 0.52)}" height="5" fill="${mix(disk, '#000000', 0.2)}"/>`;
          for (let px = X + W * 0.31; px < X + W * 0.8; px += 12) pk += `<rect x="${r1(px)}" y="${r1(Y + H * hy + 6)}" width="9" height="20" fill="${pick(R, ['#c8322a', '#e9e3d4', '#2a4a8a', '#d9a62a', '#2f6a44', '#1d1d1f'])}"/>`;
        }
        s += `<g opacity="${r1(0.35 + 0.5 * ljus)}">${pk}</g>`;
        // tv:n på den högra väggen (till vänster härifrån) lyser blått
        s += `<polygon points="${X},${Y + H * 0.1} ${r1(X + W * 0.16)},${r1(Y + H * 0.2)} ${r1(X + W * 0.16)},${r1(Y + H * 0.82)} ${X},${Y + H}" fill="${mix(vagg, '#000000', 0.3)}"/>`;
        s += `<rect x="${r1(X + W * 0.04)}" y="${r1(Y + H * 0.2)}" width="${r1(W * 0.08)}" height="${r1(H * 0.12)}" fill="#5a7ac8" opacity="${r1(0.25 + 0.5 * n)}"/>`;
        s += `<ellipse cx="${r1(X + W * 0.1)}" cy="${r1(Y + H * 0.3)}" rx="${r1(W * 0.22)}" ry="${r1(H * 0.32)}" fill="url(#rf-g-bla)" opacity="${r1(0.25 + 0.5 * n)}"/>`;
        // Tipsligan, svart med vita rader
        s += `<rect x="${r1(X + W * 0.05)}" y="${r1(Y + H * 0.42)}" width="${r1(W * 0.075)}" height="${r1(H * 0.11)}" fill="#141414" opacity=".8"/>`;
      }
      // bardisken längs väggen, i höjd med sitsarna
      s += `<rect x="${X}" y="${r1(Y + H * 0.62)}" width="${W}" height="${r1(H * 0.06)}" fill="${mix(disk, '#ffffff', 0.08 * ljus)}"/><rect x="${X}" y="${r1(Y + H * 0.68)}" width="${W}" height="${r1(H * 0.6)}" fill="${disk}"/>`;
      return s;
    };
    const glod = (id, c, a) => `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset=".5" stop-color="${c}" stop-opacity="${r1(a * 0.35)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
    let s = `<defs>${glod('rf-g-vit', '#fff6dc', 0.6)}${glod('rf-g-bla', '#6a8cff', 0.5)}${glod('rf-g-rod', '#ff3a26', 0.55)}<filter id="rf-inne-b" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5"/></filter>
      <clipPath id="rf-inne-k"><rect x="${x}" y="${y}" width="${w}" height="${h}"/><rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}"/></clipPath></defs>`;
    s += `<g clip-path="url(#rf-inne-k)"><g filter="url(#rf-inne-b)">${ett(x - 10, y - 10, w + 20, h + 20, true)}${ett(d.x - 10, d.y - 10, d.w + 20, d.h + 20, false)}`;
    // Hasse Backe vid baren, en mörk gestalt i kostym genom dörren
    const hx = d.x + d.w * 0.55;
    const hy = d.y + d.h * 0.62;
    s += `<g fill="${mix('#0c0c10', '#2a2c38', ljus)}"><path d="M${r1(hx - 30)} ${r1(hy + 30)} Q${r1(hx - 32)} ${r1(hy - 58)} ${hx} ${r1(hy - 60)} Q${r1(hx + 32)} ${r1(hy - 58)} ${r1(hx + 30)} ${r1(hy + 30)} Z"/><circle cx="${hx}" cy="${r1(hy - 82)}" r="17" fill="${mix('#1a120c', '#c49a7a', ljus * 0.8)}"/><path d="M${r1(hx - 16)} ${r1(hy - 88)} Q${hx} ${r1(hy - 104)} ${r1(hx + 16)} ${r1(hy - 88)} Z" fill="${mix('#0a0a0a', '#d8d8d4', ljus * 0.8)}"/></g>`;
    // neonens röda sken i rummet och, på natten, ljuset från gatan
    s += `<ellipse cx="${r1(x + w * 0.76)}" cy="${r1(y + h * 0.22)}" rx="${r1(w * 0.5)}" ry="${r1(h * 0.55)}" fill="url(#rf-g-rod)" opacity="${r1(0.3 + 0.55 * n)}"/>`;
    s += '</g>';
    // gänget sitter i rummets ljus: allt bakom dem mörkare än de själva
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" opacity="${r1(0.12 + 0.3 * n)}"/></g>`;
    return s;
  }

  // Det som hänger i fönstret framför gänget: skivan med löpsedlarna (baksidan, i ståltråd från karmen)
  // och neonskylten Tobak, som läses rätt härifrån (i ett eget lager: den glappar).
  function iFonstret(v, L, o) {
    const ljus = inne(o);
    const { x, y, w, h } = FON;
    // skivan: till höger inifrån, alltså till vänster härifrån
    const sx = x + w * 0.015;
    const sw = w * 0.23;
    const sy = y + h * 0.1;
    const sh = h * 0.68;
    const tra = mix('#1a120a', '#6a4a2c', 0.25 + 0.6 * ljus);
    let s = `<path d="M${r1(sx + sw * 0.2)} ${y} V${r1(sy)} M${r1(sx + sw * 0.8)} ${y} V${r1(sy)}" stroke="${mix('#222', '#9a9a96', ljus)}" stroke-width="1.6"/>`;
    s += `<rect x="${r1(sx)}" y="${r1(sy)}" width="${r1(sw)}" height="${r1(sh)}" fill="${tra}"/>`;
    s += `<rect x="${r1(sx)}" y="${r1(sy)}" width="${r1(sw)}" height="${r1(sh)}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`;
    // (de fyra sedlarna lyser svagt igenom papperet där de sitter)
    s += `<g fill="#f3ead9" opacity="${r1(0.05 + 0.05 * ljus)}"><rect x="${r1(sx + 6)}" y="${r1(sy + 6)}" width="${r1(sw / 2 - 9)}" height="${r1(sh / 2 - 9)}"/><rect x="${r1(sx + sw / 2 + 3)}" y="${r1(sy + 6)}" width="${r1(sw / 2 - 9)}" height="${r1(sh / 2 - 9)}"/><rect x="${r1(sx + 6)}" y="${r1(sy + sh / 2 + 3)}" width="${r1(sw / 2 - 9)}" height="${r1(sh / 2 - 9)}"/><rect x="${r1(sx + sw / 2 + 3)}" y="${r1(sy + sh / 2 + 3)}" width="${r1(sw / 2 - 9)}" height="${r1(sh / 2 - 9)}"/></g>`;
    return `<g filter="url(#rf-mjuk)">${s}</g>`;
  }
  function neonSkylt() {
    const { x, y, w, h } = FON;
    const cx = x + w * 0.76;
    const cy = y + h * 0.17;
    // kedjorna från karmen, listen och transformatorn
    let s = `<path d="M${r1(cx - 68)} ${y} V${r1(cy - 38)} M${r1(cx + 68)} ${y} V${r1(cy - 38)}" stroke="#3a3a3a" stroke-width="2" stroke-dasharray="3 2"/><rect x="${r1(cx - 84)}" y="${r1(cy - 40)}" width="168" height="6" fill="#141414"/>`;
    const text = `<text x="${r1(cx)}" y="${r1(cy + 16)}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="300" font-size="58">Tobak</text>`;
    s += `<g class="rf-neon"><g fill="none" stroke="#ff3a2a" stroke-width="10" opacity=".35" filter="url(#rf-neon-b)">${text}</g>`;
    s += `<g fill="none" stroke="#ff5a3c" stroke-width="3.4" stroke-linejoin="round">${text}</g><g fill="none" stroke="#ffd9c8" stroke-width="1.2">${text}</g></g>`;
    s += `<g class="rf-neon-av" fill="none" stroke="#5a2a24" stroke-width="3.4">${text}</g>`;
    return s;
  }

  // Glaset: himlen och gatan bakom en speglas på dagen och rummet syns svagare; på kvällen mest rummet.
  // Droppar efter regn, snö i nederkanten på blecket och frost i hörnen när det är kallt.
  function glaset(v, L, o) {
    const ljus = inne(o);
    const spegel = Math.min(0.62, 0.12 + 0.5 * L.dag) * (1 - 0.25 * ljus * (1 - L.dag));
    let s = `<defs><linearGradient id="rf-spegel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.sky[0]}"/><stop offset=".45" stop-color="${L.sky[2]}" stop-opacity=".75"/><stop offset=".62" stop-color="${tone('#5a5048', L)}" stop-opacity=".45"/><stop offset="1" stop-color="${tone('#3a3a3c', L)}" stop-opacity=".6"/></linearGradient>
      <linearGradient id="rf-glans" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".2"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
    for (const r of [FON, DORR]) {
      s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#rf-spegel)" opacity="${r1(spegel)}"/>`;
      s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#rf-glans)" opacity="${r1(0.3 + 0.7 * L.dag)}"/>`;
    }
    // husen mittemot: på kvällen deras tända fönster, svagt
    if (L.dag < 0.5) {
      const R = rng(5);
      let mot = '';
      for (let px = FON.x; px < FON.x + FON.w; px += 44) if (R() < L.tand * 1.6) mot += `<rect x="${px + 8}" y="${r1(FON.y + FON.h * 0.58 + R() * 30)}" width="16" height="20" fill="#ffd58a" opacity="${r1(0.22 * (1 - L.dag / 0.5))}"/>`;
      s += `<g filter="url(#rf-mjuk)">${mot}</g>`;
    }
    // gatlyktorna bakom en, på natten
    if (L.lampor) s += `<circle cx="${r1(DORR.x + DORR.w * 0.45)}" cy="${r1(DORR.y + DORR.h * 0.24)}" r="5" fill="#fff0cc" opacity=".22" filter="url(#rf-mjuk)"/>`;
    // droppar på glaset
    const regn = v.fall === 'regn' || v.fall === 'blandat';
    if (regn || v.blott) {
      const RD = rng(17);
      for (const r of [FON, DORR]) {
        const n = Math.round((regn ? 1 : 0.4) * r.w * r.h / 1400);
        for (let i = 0; i < n; i++) {
          const dx = r.x + RD() * r.w;
          const dy = r.y + RD() * r.h;
          const rr = 1.6 + RD() * 3.4;
          if (regn && RD() < 0.3) s += `<line x1="${r1(dx)}" y1="${r1(dy)}" x2="${r1(dx + (RD() - 0.5) * 6)}" y2="${r1(dy - 20 - RD() * 60)}" stroke="#dfe8ff" stroke-opacity=".12" stroke-width="${r1(rr * 0.8)}"/>`;
          s += `<circle cx="${r1(dx)}" cy="${r1(dy)}" r="${r1(rr)}" fill="#dfe8ff" opacity="${r1(0.12 + RD() * 0.14)}"/><circle cx="${r1(dx - rr * 0.3)}" cy="${r1(dy - rr * 0.3)}" r="${r1(rr * 0.35)}" fill="#fff" opacity=".4"/>`;
        }
      }
    }
    // frosten kryper in från hörnen
    if (v.temp < -3) {
      const f = Math.min(1, (-3 - v.temp) / 10);
      s += '<defs><radialGradient id="rf-frost" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef6ff" stop-opacity=".5"/><stop offset=".6" stop-color="#eef6ff" stop-opacity=".15"/><stop offset="1" stop-color="#eef6ff" stop-opacity="0"/></radialGradient></defs>';
      for (const r of [FON, DORR]) for (const [cx, cy] of [[r.x, r.y + r.h], [r.x + r.w, r.y + r.h], [r.x, r.y], [r.x + r.w, r.y]]) s += `<circle cx="${cx}" cy="${cy}" r="${r1(70 * (0.5 + f))}" fill="url(#rf-frost)" opacity="${r1(0.4 + 0.4 * f)}"/>`;
    }
    return `<g clip-path="url(#rf-glas-k)">${s}</g>`;
  }

  // ---------- huset ----------

  // Ett fönster på våningarna ovanför (cx mitten, y underkant): vita bågar med spröjs, himlen i glaset på
  // dagen och tänt efter klockan, adventsljusstakar och stjärnor i advent, och ibland en fransk balkong.
  const WARM = ['#ffd58a', '#ffc56b', '#f6e7c1', '#ffcf7a', '#a9c4ff'];
  function fonster(v, L, cx, yb, R, balkong) {
    const w = 190;
    const h = 330;
    const x = cx - w / 2;
    const y = yb - h;
    const omf = puts('#eadfca', '#17130f', L);
    const r = R(); const rc = R(); const rd = R();
    const tand = r < L.tand;
    let s = `<rect x="${x - 22}" y="${y - 26}" width="${w + 44}" height="${h + 40}" fill="${omf}"/><rect x="${x - 30}" y="${y - 40}" width="${w + 60}" height="16" fill="${omf}"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mix(mix('#120e11', '#ffffff', 0.03), mix('#26303a', L.sky[1], 0.4), L.dag)}"/>`;
    if (L.dag > 0.2) s += `<path d="M${x} ${y} H${r1(x + w * 0.7)} L${x} ${r1(y + h * 0.6)} Z" fill="${L.sky[0]}" opacity="${r1(0.35 * L.dag)}"/>`;
    if (tand) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${WARM[(rc * 5) | 0]}" opacity="${r1(0.5 * (1 - 0.85 * L.dag))}"/>`;
    // gardinerna
    if (rd < 0.5) s += `<g fill="${tand ? mix('#f2e2c0', '#ffffff', L.dag) : '#e9e1d2'}" opacity="${r1(tand ? 0.6 : 0.45 * L.dag + 0.05)}"><path d="M${x + 4} ${y + 4} h${r1(w * 0.22)} q-10 ${r1(h * 0.5)} 6 ${r1(h - 8)} h${r1(-w * 0.22 - 6)} Z"/><path d="M${x + w - 4} ${y + 4} h${r1(-w * 0.22)} q10 ${r1(h * 0.5)} -6 ${r1(h - 8)} h${r1(w * 0.22 + 6)} Z"/></g>`;
    // adventsstjärnor och ljusstakar
    if (v.advent && rd > 0.4) {
      const on = 1 - 0.5 * L.dag;
      if (rc < 0.5) {
        const sy = y + h * 0.4;
        let pts = '';
        for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5; const rr = j % 2 ? 11 : 26; pts += `${r1(cx + Math.cos(a) * rr)},${r1(sy + Math.sin(a) * rr)} `; }
        s += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${r1(sy - 26)}" stroke="#222" stroke-width="1.2"/><circle cx="${cx}" cy="${r1(sy)}" r="50" fill="#ffb24a" opacity="${r1(0.35 * on)}"/><polygon points="${pts}" fill="#ffc874" opacity="${r1(0.55 + 0.45 * on)}"/>`;
      } else {
        const b = y + h - 4;
        s += `<polygon points="${x + 18},${b} ${x + w - 18},${b} ${cx},${b - 46}" fill="#1c140c" opacity=".85"/>`;
        for (let j = 0; j < 7; j++) { const t = j / 6; s += `<rect x="${r1(x + 24 + t * (w - 48) - 2)}" y="${r1(b - (1 - Math.abs(t - 0.5) * 2) * 40 - 14)}" width="4" height="12" fill="#f3ead9"/><circle cx="${r1(x + 24 + t * (w - 48))}" cy="${r1(b - (1 - Math.abs(t - 0.5) * 2) * 40 - 18)}" r="4" fill="#fff0b4" opacity="${r1(0.5 + 0.5 * on)}"/>`; }
        s += `<ellipse cx="${cx}" cy="${r1(b - 30)}" rx="70" ry="40" fill="#ffc874" opacity="${r1(0.25 * on)}"/>`;
      }
    }
    // bågarna: mittpost, tvärpost och spröjs
    const fr = mix('#2a2622', mix('#f4efe4', '#a6abb2', 0.25 * L.m), L.dag);
    const tv = y + h * 0.32;
    s += `<g stroke="${fr}" fill="none"><rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" stroke-width="8"/><path d="M${cx} ${y} V${y + h} M${x} ${r1(tv)} H${x + w}" stroke-width="8"/><path d="M${x} ${r1(tv + (y + h - tv) / 2)} H${x + w}" stroke-width="4"/></g>`;
    // blecket, och snön på det
    s += `<rect x="${x - 26}" y="${yb}" width="${w + 52}" height="12" fill="${mix('#141418', '#d4cfc4', L.dag * (1 - 0.3 * L.m))}"/>`;
    if (v.snotackt) s += `<path d="M${x - 26} ${yb + 1} q${r1((w + 52) / 2)} -12 ${w + 52} 0 Z" fill="${snoC(L)}"/>`;
    if (balkong) {
      const g = mix('#0c0e10', '#3a3e44', L.dag);
      let sp = '';
      for (let px = x - 12; px <= x + w + 12; px += 16) sp += `M${px} ${yb - 90} V${yb}`;
      s += `<g stroke="${g}" fill="none"><path d="${sp}" stroke-width="3"/><path d="M${x - 16} ${yb - 92} H${x + w + 16} M${x - 16} ${yb - 30} H${x + w + 16}" stroke-width="6"/></g>`;
      if (v.snotackt) s += `<rect x="${x - 18}" y="${yb - 98}" width="${w + 36}" height="6" rx="3" fill="${snoC(L)}"/>`;
    }
    return s;
  }

  function huset(V, v, L, o) {
    const sno = v.snotackt ? snoC(L) : null;
    const lax = puts('#d9825b', '#160f0d', L);
    const ljusPuts = puts('#dacdb2', '#18150f', L);
    const list = puts('#e8dfcb', '#1c1913', L);
    const granit = puts('#6d6b67', '#0f0f10', L);
    const morkt = puts('#2a2b2c', '#08090a', L);
    let s = '';
    // den laxrosa putsen ovanför bottenvåningen och den ljusa bottenvåningen med sina fogar
    s += `<rect x="${VARLD.x0}" y="${VARLD.y0}" width="${HORN - VARLD.x0}" height="${232 - VARLD.y0}" fill="${lax}"/>`;
    // (lite varmare högt upp i låg sol)
    if (L.sol > 0.05 && L.guld > 0.05) s += `<rect x="${VARLD.x0}" y="${VARLD.y0}" width="${HORN - VARLD.x0}" height="${232 - VARLD.y0}" fill="#f0a46a" opacity="${r1(0.22 * L.guld * L.sol)}"/>`;
    s += `<rect x="${VARLD.x0}" y="232" width="${HORN - VARLD.x0}" height="${MARK - 232}" fill="${ljusPuts}"/>`;
    let fog = '';
    for (let y = 290; y < MARK - 40; y += 46) fog += `M${VARLD.x0} ${y} H${HORN}`;
    s += `<path d="${fog}" stroke="${mix(ljusPuts, '#000000', 0.18)}" stroke-width="3"/>`;
    // gesimsen mellan bottenvåningen och våningarna ovanför
    s += `<rect x="${VARLD.x0}" y="214" width="${HORN - VARLD.x0 + 10}" height="22" fill="${list}"/><rect x="${VARLD.x0}" y="236" width="${HORN - VARLD.x0}" height="12" fill="${mix(ljusPuts, '#000000', 0.25)}" opacity=".6"/>`;
    if (sno) s += `<path d="M${VARLD.x0} 216 H${HORN + 10}" stroke="${sno}" stroke-width="7" stroke-linecap="round"/>`;
    // fönstren på våningarna ovanför (de syns i höga fönster)
    const RW = rng(23);
    for (const [yb, bal] of [[178, [-60, 690]], [-302, [330]], [-782, []]]) {
      for (const cx of [-420, -60, 330, 690, 1050]) s += fonster(v, L, cx, yb, RW, bal.includes(cx));
    }
    // hörnets kedjestenar
    let kedja = '';
    for (let y = VARLD.y0; y < 214; y += 64) kedja += `<rect x="${HORN - 52}" y="${y}" width="${(y / 64) % 2 ? 52 : 40}" height="58" fill="${list}"/>`;
    s += kedja + `<rect x="${HORN - 4}" y="${VARLD.y0}" width="4" height="${MARK - VARLD.y0}" fill="#000" opacity=".25"/>`;
    // sockeln
    s += `<rect x="${VARLD.x0}" y="${MARK - 34}" width="${HORN - VARLD.x0}" height="34" fill="${granit}"/>`;

    // porten till huset, med överljusfönster och omfattning i sten
    const px = 60;
    const pw = 210;
    const pt = 340;
    s += `<rect x="${px - 26}" y="${pt - 30}" width="${pw + 52}" height="${MARK - pt + 30}" fill="${list}"/>`;
    s += `<path d="M${px} ${MARK} V${pt + 90} Q${px} ${pt} ${px + pw / 2} ${pt} Q${px + pw} ${pt} ${px + pw} ${pt + 90} V${MARK} Z" fill="${mix('#0a0806', '#3f2a1a', L.dag)}"/>`;
    s += `<path d="M${px + 12} ${pt + 92} Q${px + 12} ${pt + 14} ${px + pw / 2} ${pt + 14} Q${px + pw - 12} ${pt + 14} ${px + pw - 12} ${pt + 92} Z" fill="${L.lampor ? '#d9a65a' : mix('#0c0d10', mix('#2a3038', L.sky[1], 0.4), L.dag)}" opacity="${L.lampor ? 0.55 : 1}"/>`;
    s += `<path d="M${px + pw / 2} ${pt + 14} V${pt + 92} M${px + 12} ${pt + 92} H${px + pw - 12}" stroke="${mix('#0a0806', '#3f2a1a', L.dag)}" stroke-width="6"/>`;
    s += `<g fill="none" stroke="${mix('#050403', '#2a1c10', L.dag)}" stroke-width="4"><rect x="${px + 16}" y="${pt + 116}" width="${pw / 2 - 26}" height="160" rx="4"/><rect x="${px + pw / 2 + 10}" y="${pt + 116}" width="${pw / 2 - 26}" height="160" rx="4"/><rect x="${px + 16}" y="${pt + 300}" width="${pw / 2 - 26}" height="180" rx="4"/><rect x="${px + pw / 2 + 10}" y="${pt + 300}" width="${pw / 2 - 26}" height="180" rx="4"/></g>`;
    s += `<path d="M${px + pw / 2} ${pt + 100} V${MARK}" stroke="#000" stroke-opacity=".45" stroke-width="3"/><circle cx="${px + pw / 2 - 14}" cy="${pt + 290}" r="5" fill="${mix('#2a2010', '#c9a24c', L.dag)}"/><circle cx="${px + pw / 2 + 14}" cy="${pt + 290}" r="5" fill="${mix('#2a2010', '#c9a24c', L.dag)}"/>`;

    // (barberarens stång längst till vänster snurrar, och är en egen ruta: .rf-barber i rita)
    // gatuskylten på hörnet
    const bla = mix('#0a1020', '#1f4a8a', 0.2 + 0.8 * L.dag);
    s += `<rect x="1040" y="250" width="186" height="38" rx="3" fill="${bla}"/><rect x="1044" y="254" width="178" height="30" rx="2" fill="none" stroke="${mix('#2a2e36', '#f2f2ee', L.dag)}" stroke-width="1.6"/><text x="1133" y="277" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="19" fill="${mix('#3a3e48', '#f2f2ee', L.dag)}">S:t Eriksgatan</text>`;

    // ---------- butiken ----------
    const ram = mix('#08090a', '#25292a', 0.2 + 0.8 * L.dag);
    const ramLjus = mix(ram, '#ffffff', 0.12);
    // karmen kring fönstret och dörren, med fönsterbänken av sten under fönstret
    const k = KARM;
    s += `<path fill-rule="evenodd" fill="${ram}" d="M${FON.x - k - 8} ${FON.y - k - 8} H${DORR.x + DORR.w + k + 8} V${MARK} H${DORR.x - k} V${FON.y + FON.h + k} H${FON.x - k - 8} Z M${FON.x} ${FON.y} h${FON.w} v${FON.h} h${-FON.w} Z M${DORR.x} ${DORR.y} h${DORR.w} v${DORR.h} h${-DORR.w} Z"/>`;
    s += `<path d="M${FON.x - 2} ${FON.y - 2} h${FON.w + 4} v${FON.h + 4} h${-FON.w - 4} Z M${DORR.x - 2} ${DORR.y - 2} h${DORR.w + 4} v${DORR.h + 4} h${-DORR.w - 4} Z" fill="none" stroke="${ramLjus}" stroke-width="2"/>`;
    // under fönstret: en bröstning av mörk polerad sten och blecket
    s += `<rect x="${FON.x - k - 8}" y="${FON.y + FON.h + k}" width="${FON.w + 2 * k + 16}" height="${MARK - FON.y - FON.h - k}" fill="${morkt}"/>`;
    s += `<rect x="${FON.x - k - 18}" y="${FON.y + FON.h + k - 2}" width="${FON.w + 2 * k + 36}" height="12" fill="${mix(granit, '#ffffff', 0.15)}"/>`;
    s += `<rect x="${FON.x + 16}" y="${FON.y + FON.h + k + 26}" width="${FON.w - 32}" height="${MARK - FON.y - FON.h - k - 56}" fill="none" stroke="${mix(morkt, '#ffffff', 0.08)}" stroke-width="2"/>`;
    if (sno) s += `<path d="M${FON.x - k - 18} ${FON.y + FON.h + k} q${r1((FON.w + 2 * k + 36) / 2)} -14 ${FON.w + 2 * k + 36} 0 Z" fill="${sno}"/>`;
    // dörrens handtag och sparkplåten
    s += `<rect x="${DORR.x + 10}" y="${DORR.y + DORR.h * 0.48}" width="7" height="${r1(DORR.h * 0.2)}" rx="3.5" fill="${mix('#3a3c40', '#c8ccd0', L.dag * 0.8 + 0.1)}"/><rect x="${DORR.x}" y="${DORR.y + DORR.h - 34}" width="${DORR.w}" height="34" fill="${mix('#2a2c30', '#9aa0a6', L.dag * 0.8 + 0.1)}" opacity=".9"/>`;

    // skylten: MATCHFIXARNA i benvitt på mörkt, med en tunn guldlinje
    const sk = SKYLT;
    s += `<rect x="${sk.x}" y="${sk.y}" width="${sk.w}" height="${sk.h}" fill="${mix('#060606', '#151716', 0.3 + 0.7 * L.dag)}"/><rect x="${sk.x + 8}" y="${sk.y + 8}" width="${sk.w - 16}" height="${sk.h - 16}" fill="none" stroke="#c9a25a" stroke-opacity="${r1(0.35 + 0.4 * L.dag)}" stroke-width="2"/>`;
    s += `<rect x="${sk.x - 10}" y="${sk.y - 10}" width="${sk.w + 20}" height="12" fill="${mix('#060606', '#202322', L.dag)}"/>`;
    if (sno) s += `<path d="M${sk.x - 12} ${sk.y - 9} q${sk.w / 2 + 12} -16 ${sk.w + 24} 0 Z" fill="${sno}"/>`;
    // lamporna över skylten, på svanhalsar
    for (const [lx, m] of [[sk.x + sk.w * 0.2, 1], [sk.x + sk.w * 0.8, -1]]) {
      s += `<g transform="translate(${r1(lx)} 0) scale(${m} 1)"><path d="M0 ${sk.y - 4} V${sk.y - 70} q0 -24 26 -24 q30 0 30 36" fill="none" stroke="${mix('#050505', '#2a2c2e', L.dag)}" stroke-width="5"/><path d="M38 ${sk.y - 64} l18 0 l10 22 l-38 0 Z" fill="${mix('#050505', '#2a2c2e', L.dag)}"/>`;
      if (sno) s += `<path d="M38 ${sk.y - 66} q10 -8 18 0 Z" fill="${sno}"/>`;
      s += '</g>';
    }
    // lyktan vid porten
    s += `<path d="M330 330 h22 M341 330 v18" stroke="${mix('#050505', '#25282a', L.dag)}" stroke-width="4"/><path d="M326 348 h30 l-4 50 h-22 Z" fill="${L.lampor ? '#ffcf7a' : mix('#0c0c0e', '#4a4e54', L.dag)}"/><path d="M322 346 h38 l-8 -12 h-22 Z M326 398 h30 v6 h-30 Z" fill="${mix('#050505', '#25282a', L.dag)}"/>`;
    if (sno) s += '<path d="M324 336 q17 -10 34 0 Z" fill="#eef2f5" opacity=".9"/>';
    return s;
  }

  // Texten på skylten och guldet på dörren, för sig (text i en SVG ritas om när något i den ändras).
  function texten(v, L) {
    const sk = SKYLT;
    const ben = mix('#5a554c', '#f3ead9', 0.15 + 0.85 * L.dag);
    let s = `<text x="${sk.x + sk.w / 2}" y="${sk.y + 57}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="46" letter-spacing="13" fill="${ben}">MATCHFIXARNA</text>`;
    // guldet på dörrens glas, rättvänt härifrån
    const d = DORR;
    const cx = d.x + d.w / 2;
    const y0 = d.y + 112;
    s += `<defs><path id="rf-dorrbage" d="M${d.x + 10} ${y0} Q${cx} ${y0 - 18} ${d.x + d.w - 10} ${y0}"/><linearGradient id="rf-guld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2a8"/><stop offset=".5" stop-color="#d4a54e"/><stop offset="1" stop-color="#a4782c"/></linearGradient></defs>
      <g font-family="Fraunces, Georgia, serif" text-anchor="middle">
      <text font-style="italic" font-weight="700" font-size="17" fill="url(#rf-guld)" stroke="#3a2808" stroke-width=".6" paint-order="stroke"><textPath href="#rf-dorrbage" startOffset="50%">Matchfixarna</textPath></text>
      <line x1="${cx - 34}" y1="${y0 + 8}" x2="${cx + 34}" y2="${y0 + 8}" stroke="url(#rf-guld)" stroke-width="1"/>
      <text x="${cx}" y="${y0 + 21}" font-weight="700" font-size="8.4" letter-spacing="1.9" fill="url(#rf-guld)" stroke="#3a2808" stroke-width=".3" paint-order="stroke">TOBAK &amp; SPEL</text>
      <text x="${cx}" y="${y0 + 33}" font-style="italic" font-size="7.6" fill="#d8b46a" opacity=".9">Öppet till spelstoppet</text></g>`;
    // skylten på sugproppen: ÖPPET på den här sidan (STÄNGT inåt)
    const ox = d.x + d.w * 0.62;
    const oy = d.y + 18;
    s += `<g transform="rotate(-4 ${r1(ox)} ${oy})"><circle cx="${r1(ox)}" cy="${oy}" r="4" fill="#d8dde0" opacity=".7"/><path d="M${r1(ox)} ${oy} L${r1(ox - 24)} ${oy + 16} M${r1(ox)} ${oy} L${r1(ox + 24)} ${oy + 16}" stroke="#2a2a2a" stroke-width="1"/>
      <rect x="${r1(ox - 34)}" y="${oy + 16}" width="68" height="24" rx="2" fill="${mix('#3a3630', '#f4eee0', 0.3 + 0.7 * L.dag)}" stroke="#b8352a" stroke-width="2"/><text x="${r1(ox)}" y="${oy + 34}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="14" letter-spacing="1.5" fill="#b8352a">ÖPPET</text></g>`;
    return s;
  }

  // Ljuset på kvällen: skenet från affären ut på fasaden och trottoaren, skylten i lampornas sken,
  // lyktan, gatlyktan på bron och neonens röda sken på karmen.
  function kvallsljus(V, v, L, o) {
    const mork = 1 - L.dag;
    if (mork < 0.04) return '';
    const ljus = inne(o);
    let s = `<defs><radialGradient id="rf-varm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".9"/><stop offset=".45" stop-color="#ffb35c" stop-opacity=".35"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
      <radialGradient id="rf-rott" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4a30" stop-opacity=".7"/><stop offset="1" stop-color="#ff4a30" stop-opacity="0"/></radialGradient>
      <linearGradient id="rf-golv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></linearGradient></defs>`;
    // skenet ut genom fönstret på trottoaren (en trapets mot en), och runt karmen
    const a = 0.55 * mork * (0.35 + 0.65 * ljus);
    const yb = markY(2.2);
    const ut = (x) => OGA_X + (x - OGA_X) * skala(2.2);
    s += `<path d="M${FON.x} ${MARK} H${FON.x + FON.w} L${r1(ut(FON.x + FON.w))} ${r1(yb)} H${r1(ut(FON.x))} Z M${DORR.x} ${MARK} H${DORR.x + DORR.w} L${r1(ut(DORR.x + DORR.w))} ${r1(yb)} H${r1(ut(DORR.x))} Z" fill="url(#rf-golv)" opacity="${r1(a)}" filter="url(#rf-b8)"/>`;
    s += `<ellipse cx="${FON.x + FON.w / 2 + 60}" cy="${FON.y + FON.h / 2}" rx="${FON.w * 0.85}" ry="${FON.h * 0.95}" fill="url(#rf-varm)" opacity="${r1(0.3 * mork * (0.4 + 0.6 * ljus))}"/>`;
    // neonens röda sken på karmen över fönstret
    s += `<ellipse class="rf-neon" cx="${r1(FON.x + FON.w * 0.76)}" cy="${FON.y + 10}" rx="200" ry="70" fill="url(#rf-rott)" opacity="${r1(0.5 * mork)}"/>`;
    if (L.lampor) {
      // svanhalsarna lyser på skylten, lyktan vid porten och gatlyktan på bron
      for (const lx of [SKYLT.x + SKYLT.w * 0.2 + 47, SKYLT.x + SKYLT.w * 0.8 - 47]) s += `<ellipse cx="${r1(lx)}" cy="${SKYLT.y + 30}" rx="190" ry="70" fill="url(#rf-varm)" opacity="${r1(0.75 * mork)}"/><ellipse cx="${r1(lx)}" cy="${SKYLT.y - 40}" rx="16" ry="5" fill="#fff4d6" opacity="${r1(0.9 * mork)}"/>`;
      s += `<circle cx="341" cy="372" r="110" fill="url(#rf-varm)" opacity="${r1(0.8 * mork)}"/>`;
      s += `<circle cx="1720" cy="${LYKTA - 10}" r="${r1(240 * (1 + 0.8 * L.dimma))}" fill="url(#rf-varm)" opacity="${r1(0.8 * mork)}"/><ellipse cx="1720" cy="${MARK + 40}" rx="380" ry="70" fill="url(#rf-varm)" opacity="${r1(0.4 * mork)}"/>`;
    }
    return s;
  }

  // ---------- bron ----------

  const LYKTA = -40;
  function bron(V, v, L) {
    const sno = v.snotackt ? snoC(L) : null;
    const gron = mix('#0d1114', mix('#3f7d55', '#6a8a78', 0.3 * L.m), 0.12 + 0.88 * L.dag);
    const granit = puts('#a7a39b', '#121316', L);
    let s = '';
    // räcket: över- och underliggare, en mittre, spjälor och stolpar
    let sp = '';
    for (let x = 1330; x < VARLD.x1; x += 24) sp += `M${x} ${RACKE + 8} V${MARK - 10}`;
    let st = '';
    for (let x = 1500; x < VARLD.x1; x += 360) st += `<rect x="${x - 7}" y="${RACKE - 8}" width="14" height="${MARK - RACKE + 8}"/>`;
    s += `<g fill="${gron}" stroke="${gron}"><path d="${sp}" stroke-width="4" fill="none"/><path d="M1310 ${RACKE + 4} H${VARLD.x1} M1310 ${MARK - 14} H${VARLD.x1}" stroke-width="12" fill="none"/><path d="M1310 ${r1((RACKE + MARK) / 2)} H${VARLD.x1}" stroke-width="5" fill="none"/>${st}</g>`;
    if (sno) s += `<path d="M1310 ${RACKE - 3} H${VARLD.x1}" stroke="${sno}" stroke-width="8" stroke-linecap="round"/>`;
    // stenpelaren där räcket börjar
    s += `<rect x="${HORN + 12}" y="${RACKE - 70}" width="58" height="${MARK - RACKE + 70}" fill="${granit}"/><rect x="${HORN + 4}" y="${RACKE - 84}" width="74" height="16" fill="${mix(granit, '#000000', 0.18)}"/>`;
    if (sno) s += `<rect x="${HORN + 4}" y="${RACKE - 92}" width="74" height="10" rx="5" fill="${sno}"/>`;
    // gatlyktan på bron
    const st2 = mix('#0d0f12', '#3a4a44', L.dag);
    s += `<rect x="1712" y="${LYKTA}" width="16" height="${MARK - LYKTA}" fill="${st2}"/><rect x="1704" y="${MARK - 60}" width="32" height="60" fill="${st2}"/><path d="M1694 ${LYKTA + 6} h52 l-10 -46 h-32 Z" fill="${st2}"/><path d="M1700 ${LYKTA + 6} h40 l-8 26 h-24 Z" fill="${L.lampor ? '#ffe2b0' : mix('#1a1c20', '#b8bec4', L.dag)}"/>`;
    if (sno) s += `<path d="M1702 ${LYKTA - 42} h36 q-18 -12 -36 0 Z" fill="${sno}"/>`;
    // stolpen med parkeringsförbudet och en cykel mot räcket (inte i snön)
    const syn = (c) => mix('#0b0c10', c, 0.15 + 0.85 * L.dag);
    s += `<rect x="1384" y="${RACKE - 170}" width="8" height="${MARK - RACKE + 170}" fill="${syn('#4a4e54')}"/>
      <circle cx="1388" cy="${RACKE - 136}" r="30" fill="${syn('#2a5aa8')}" stroke="${syn('#c8322a')}" stroke-width="7"/><path d="M1368 ${RACKE - 156} L1408 ${RACKE - 116}" stroke="${syn('#c8322a')}" stroke-width="6"/>`;
    if (!v.snotackt) {
      const c = syn('#2b2f36');
      const by = MARK - 48;
      s += `<g fill="none" stroke="${c}" stroke-width="5"><circle cx="1480" cy="${by}" r="46"/><circle cx="1620" cy="${by}" r="46"/><path d="M1480 ${by} L1532 ${by} L1508 ${by - 64} M1532 ${by} L1596 ${by - 64} L1508 ${by - 64} M1596 ${by - 64} L1620 ${by} M1596 ${by - 64} L1600 ${by - 92} M1508 ${by - 64} L1502 ${by - 80}"/><path d="M1588 ${by - 92} h26 M1490 ${by - 82} h26" stroke-width="7"/></g>`;
    }
    return s;
  }

  // ---------- trottoaren ----------

  function marken(V, v, L) {
    const sno = v.snotackt ? snoC(L) : null;
    const vat = L.wet || v.blott;
    let s = '';
    const plat = sno ? sno : vat ? mix('#1e1f23', '#7c7d80', L.dag) : mix('#1a1b1f', '#a8a6a0', L.dag);
    const fog = mix(plat, '#000000', sno ? 0.08 : 0.22);
    const y1 = V.y + V.h + 10;
    s += `<rect x="${VARLD.x0}" y="${MARK}" width="${VARLD.x1 - VARLD.x0}" height="${y1 - MARK}" fill="${plat}"/>`;
    // fogarna: längs fasaden, tätare långt bort, och mot ögat
    let d = '';
    for (let dm = 0.6; markY(dm) < y1; dm += 0.6) d += `M${VARLD.x0} ${r1(markY(dm))} H${VARLD.x1}`;
    for (let x = -1200; x < 3200; x += 124) {
      const k = (y1 - HOR) / (MARK - HOR);
      d += `M${x} ${MARK} L${r1(OGA_X + (x - OGA_X) * k)} ${r1(y1)}`;
    }
    s += `<path d="${d}" stroke="${fog}" stroke-width="2.4" opacity="${sno ? 0.25 : 0.7}"/>`;
    // sockelns skugga
    s += `<rect x="${VARLD.x0}" y="${MARK}" width="${HORN + 80 - VARLD.x0}" height="10" fill="#000" opacity=".18"/>`;
    if (sno) {
      // trampad snö där folk går, och en vall längst fram
      s += `<rect x="${VARLD.x0}" y="${r1(markY(0.5))}" width="${VARLD.x1 - VARLD.x0}" height="${r1(markY(1.4) - markY(0.5))}" fill="${mix(sno, '#8a8f98', 0.25)}" opacity=".6"/>`;
    } else if (vat) {
      // våt sten speglar himlen på dagen
      if (L.dag > 0.2) s += `<rect x="${VARLD.x0}" y="${MARK}" width="${VARLD.x1 - VARLD.x0}" height="${y1 - MARK}" fill="${L.sky[2]}" opacity="${r1(0.16 * L.dag)}"/>`;
      // och affärens fönster i mörkret
      if (L.dag < 0.6) {
        s += `<defs><linearGradient id="rf-vat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".8"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></linearGradient></defs>`;
        const RV = rng(41);
        let st = '';
        for (const [x0, w0] of [[FON.x, FON.w], [DORR.x, DORR.w]]) for (let x = x0 + 10; x < x0 + w0 - 10; x += 14 + RV() * 40) st += `<rect x="${r1(x)}" y="${MARK + 4}" width="${r1(8 + RV() * 22)}" height="${r1((markY(0.6 + RV() * 1.4) - MARK))}" fill="url(#rf-vat)" opacity="${r1(0.4 + RV() * 0.6)}"/>`;
        s += `<g opacity="${r1(0.32 * (1 - L.dag))}" filter="url(#rf-b8)">${st}</g>`;
      }
    }
    // höstlöven
    if (lovet(v) === 'host' && !sno) {
      const RL = rng(29);
      const cols = ['#c7682a', '#d99a2b', '#a8452a', '#8a5a2a', '#c9a23a'];
      for (let i = 0; i < 60; i++) {
        const x = r1(V.x + RL() * V.w);
        const dm = RL() * 2;
        const y = r1(markY(dm));
        const k = skala(dm);
        s += `<ellipse cx="${x}" cy="${y}" rx="${r1((5 + RL() * 5) * k)}" ry="${r1((2.6 + RL() * 2) * k)}" fill="${pick(RL, cols)}" opacity="${r1(0.35 + 0.55 * L.dag)}" transform="rotate(${r1(RL() * 180)} ${x} ${y})"/>`;
      }
    }
    return s;
  }

  // ---------- de som går förbi ----------
  //
  // En som går (fötterna i 0, vänd åt höger, i centimeter): benen och armarna svänger (rf-ben, rf-arm).
  const kladsel = (v) => (v.kanns < 3 ? ['#1c1f26', '#2b2f38', '#3a3226', '#4a4238', '#20283a', '#5a2a2a', '#6b6458', '#2e3a2e']
    : v.kanns < 15 ? ['#3d4a5c', '#6b5a44', '#7a7a70', '#2f3d36', '#8a5a3a', '#2a3550', '#c8b89a', '#4a4a50']
      : ['#e8e4dc', '#c8d8e8', '#d84a3a', '#3a6ab0', '#f0c040', '#2e2e30', '#7ab07a', '#f3ead9']);
  function figur(o, L) {
    // (på kvällen siluetter mot det upplysta fönstret, på dagen i sina färger; det som är bortvänt mörkare)
    const t = (c) => mix(mix('#08090c', c, 0.1 + 0.9 * L.dag), '#ffb060', 0.05 * (1 - L.dag));
    const bak = (c) => mix(t(c), '#000000', 0.28);
    const ben = (b2) => {
      const f = b2 ? bak : t;
      return `<g transform="translate(0 -90)"><g class="rf-ben${b2}"><rect x="-6.5" y="0" width="13" height="86" rx="6" fill="${f(o.byxa)}"/><path d="M-7 82 h17 q7 0 7 6 v2 h-24 Z" fill="${f(o.sko)}"/></g></g>`;
    };
    const arm = (b2) => {
      const f = b2 ? bak : t;
      return `<g transform="translate(1 -142)"><g class="rf-arm${b2}"><rect x="-5.5" y="0" width="11" height="60" rx="5.5" fill="${f(o.arm)}"/><circle cx="0" cy="61" r="5.2" fill="${f(o.hud)}"/></g></g>`;
    };
    let s = '<ellipse cx="0" cy="1" rx="24" ry="3.6" fill="#000" opacity=".22"/>';
    s += ben(' b2');
    if (!o.paraply) s += arm(' b2');
    s += ben('');
    const nere = o.lang ? -42 : -86;
    const kropp = `M-15 -146 Q-18 ${nere + 34} -17 ${nere} H17 Q18 ${nere + 34} 15 -146 Q0 -151 -15 -146 Z`;
    s += `<path d="${kropp}" fill="${t(o.rock)}"/><path d="M-15 -146 Q-18 ${nere + 34} -17 ${nere} H-4 Q-6 ${nere + 40} -4 -149 Q-10 -148 -15 -146 Z" fill="#000" opacity=".16"/>`;
    if (o.vaska) s += `<path d="M10 -142 L16 -100" stroke="${bak(o.vaska)}" stroke-width="2.4"/><rect x="9" y="-102" width="16" height="22" rx="3" fill="${t(o.vaska)}"/>`;
    if (o.halsduk) s += `<path d="M-11 -152 h22 v10 h-22 Z M2 -145 v24 h8 v-24 Z" fill="${t(o.halsduk)}"/>`;
    // huvudet i profil: näsan framåt, örat, håret eller mössan
    s += `<rect x="-4.5" y="-156" width="9" height="10" fill="${bak(o.hud)}"/><ellipse cx="1" cy="-163" rx="10.5" ry="12" fill="${t(o.hud)}"/><path d="M10.5 -166 l4 6 l-4 1 Z" fill="${t(o.hud)}"/><ellipse cx="-2" cy="-163" rx="2.2" ry="3.2" fill="${bak(o.hud)}"/>`;
    if (o.mossa) s += `<path d="M-10 -163 Q-11 -180 1 -180 Q13 -180 12 -165 Z" fill="${t(o.mossa)}"/><path d="M-11 -166 H12" stroke="${bak(o.mossa)}" stroke-width="3.4"/>`;
    else s += `<path d="M-10 -160 Q-12 -178 2 -177 Q13 -176 12 -167 Q4 -171 -3 -166 Q-5 -158 -10 -154 Z" fill="${t(o.har)}"/>`;
    if (o.paraply) {
      s += `<g transform="translate(4 -138) rotate(-42)"><rect x="-5.5" y="0" width="11" height="40" rx="5.5" fill="${t(o.arm)}"/></g><line x1="27" y1="-112" x2="18" y2="-212" stroke="#151515" stroke-width="2.2"/>`;
      s += `<path d="M-46 -202 Q18 -256 82 -202 Q61 -210 40 -202 Q18 -210 -4 -202 Q-25 -210 -46 -202 Z" fill="${t(o.paraply)}"/><path d="M-46 -202 Q18 -256 82 -202" fill="none" stroke="#fff" stroke-opacity="${r1(0.08 + 0.12 * L.dag)}" stroke-width="2"/>`;
    } else s += arm('');
    if (o.hund) {
      const h = t(o.hund);
      const hb = bak(o.hund);
      s += '<path d="M14 -82 Q50 -60 64 -30" fill="none" stroke="#1a1a1a" stroke-width="1.6"/>';
      s += `<g transform="translate(70 0)"><g transform="translate(-16 -20)"><g class="rf-ben fort b2"><rect x="-2.5" y="0" width="5" height="20" fill="${hb}"/></g></g><g transform="translate(14 -20)"><g class="rf-ben fort b2"><rect x="-2.5" y="0" width="5" height="20" fill="${hb}"/></g></g>`;
      s += `<g transform="translate(-10 -20)"><g class="rf-ben fort"><rect x="-2.5" y="0" width="5" height="20" fill="${h}"/></g></g><g transform="translate(20 -20)"><g class="rf-ben fort"><rect x="-2.5" y="0" width="5" height="20" fill="${h}"/></g></g><ellipse cx="0" cy="-26" rx="24" ry="10" fill="${h}"/><circle cx="24" cy="-34" r="9" fill="${h}"/><path d="M30 -32 l8 3 l-8 3 Z M18 -42 l4 -8 l4 7 Z" fill="${h}"/><path d="M-22 -28 q-10 -8 -8 -18" stroke="${h}" stroke-width="4" fill="none"/></g>`;
    }
    return s;
  }

  // Hur många som går förbi och hur de är klädda: som på gatan inifrån (RumUte.trafik), färre i ösregn
  // och kyla, nästan ingen mitt i natten. Var och en går fram och tillbaka över hela bilden med en lång
  // paus utanför den, på sitt avstånd från fasaden (fötterna där, och lika mycket större).
  function folket(V, v, L) {
    const T = U().trafik.nu(v);
    const R = rng(v.ar * 389 + v.manad * 37 + v.dag * 3 + (v.timme >> 1) + 11);
    const n = Math.max(1, Math.min(4, Math.round(T.gaende / 2)));
    const regn = v.fall === 'regn' || v.fall === 'blandat';
    const kalla = v.kanns < 3;
    const C = kladsel(v);
    let s = '';
    for (let i = 0; i < n; i++) {
      const dm = 0.3 + R() * 0.55;
      const k = skala(dm) * M / 100 * (0.94 + R() * 0.1);
      const o = {
        rock: pick(R, C), arm: null, byxa: pick(R, ['#1d2230', '#2a2a2e', '#3b4a6a', '#4a4036', '#222']), sko: pick(R, ['#111', '#3a2a1a', '#e8e4dc']),
        hud: pick(R, ['#e8c4a0', '#c99a72', '#8a5a3a', '#f0d2b4']), har: pick(R, ['#2a1c12', '#6a4a2a', '#c9a46a', '#1a1a1a', '#8a8a86']),
        lang: kalla || R() < 0.3, mossa: kalla && R() < 0.7 ? pick(R, ['#8a1e1e', '#1f2a44', '#d8cbb0', '#2a2a2a']) : null,
        halsduk: kalla && R() < 0.6 ? pick(R, ['#c8322a', '#e0c040', '#3a6ab0', '#f3ead9']) : null,
        paraply: regn && R() < 0.85 ? pick(R, ['#1a1a1e', '#2a3a6a', '#8a1e1e', '#2a5a3a', '#d8b03a']) : null,
        vaska: R() < 0.3 ? pick(R, ['#3a2a1a', '#1a1a1a', '#8a6a3a']) : null,
        hund: !regn && R() < 0.15 ? pick(R, ['#6a4a2a', '#1a1a1a', '#d8c8a8']) : null,
      };
      o.arm = o.rock;
      const dir = R() < 0.5 ? 1 : -1;
      // (1,3 m/s; varvet är bilden och en paus)
      const fart = 1.3 * M * skala(dm);
      const vag = V.w + 600;
      const varv = vag / fart + 8 + R() * (T.natt ? 70 : 26);
      const extra = varv * fart - vag;
      const a = -300;
      const b = V.w + 300 + extra;
      const y = markY(dm) - V.y;
      const steg = r1(0.95 + R() * 0.25);
      s += `<div class="rf-glid rf-gar" style="top:${r1(y)}px; --fran:${dir > 0 ? a : b}px; --till:${dir > 0 ? b : a}px; animation-duration:${r1(varv)}s; animation-delay:-${r1(R() * varv)}s; z-index:${Math.round(dm * 10)}">` +
        `<svg viewBox="-60 -270 160 280" width="160" height="280" style="transform:translate(-60px, -270px) scale(${dir > 0 ? '' : '-'}${k.toFixed(3)}, ${k.toFixed(3)}); --steg:${steg}s">${figur(o, L)}</svg></div>`;
    }
    return s;
  }

  // Bilarna på gatan bakom en syns i glaset: på dagen som mörka skuggor som far förbi, på kvällen
  // strålkastarna (och baklyktorna åt andra hållet). Bussarna lika, men längre.
  function speglingar(v, L) {
    const T = U().trafik.nu(v);
    const R = rng(v.ar * 131 + v.manad * 17 + v.dag + (v.timme >> 1) + 5);
    const mork = L.lampor || L.dag < 0.35;
    let s = '';
    const n = Math.min(4, T.bilar + 1);
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? -1 : 1;
      const buss = T.bussar && R() < 0.25;
      const w = buss ? 900 : 360;
      const varv = (T.varv[0] + R() * (T.varv[1] - T.varv[0])) * (0.5 + R() * 0.4);
      const kropp = mork
        ? (dir > 0
          ? `<i class="rf-ljus" style="left:${w - 40}px"></i><i class="rf-ljus" style="left:${w - 140}px"></i>`
          : '<i class="rf-ljus rod" style="left:20px"></i><i class="rf-ljus rod" style="left:110px"></i>')
        : `<i class="rf-kropp" style="width:${w}px; background:${tone(buss ? (R() < 0.5 ? '#b8322a' : '#2a5ab0') : pick(R, ['#16181d', '#e9e8e4', '#9da3aa', '#5a6068', '#1d2b45', '#7a1d1f']), L)}"></i>`;
      s += `<div class="rf-glid rf-bil" style="width:${w}px; --fran:${dir > 0 ? -w - 200 : FON.w + DORR.w + 300}px; --till:${dir > 0 ? FON.w + DORR.w + 300 : -w - 200}px; animation-duration:${r1(varv)}s; animation-delay:-${r1(R() * varv)}s">${kropp}</div>`;
    }
    return s;
  }

  // ---------- nederbörden ----------

  function nederbord(V, v) {
    if (!v.fall) return '';
    const R = rng(5);
    const W = Math.ceil(V.w);
    const H = Math.ceil(V.h);
    const slant = Math.min(0.55, 0.08 + v.vind * 0.035);
    const lines = (n, o, l0, l1, wd) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const x = R() * (W + 400); const y = R() * H; const len = l0 + R() * (l1 - l0);
        for (const dy of [0, H]) s += `<line x1="${r1(x)}" y1="${r1(y + dy)}" x2="${r1(x - len * slant)}" y2="${r1(y + dy + len)}" stroke="#c8d6f0" stroke-opacity="${r1(o + R() * 0.14)}" stroke-width="${r1(wd + R() * 1.2)}"/>`;
      }
      return `<svg viewBox="0 0 ${W + 400} ${2 * H}" width="${W + 400}" height="${2 * H}">${s}</svg>`;
    };
    const flakes = (n, r0, r2, o) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const x = R() * (W + 300); const y = R() * H; const r = r0 + R() * (r2 - r0);
        for (const dy of [0, H]) s += `<circle cx="${r1(x)}" cy="${r1(y + dy)}" r="${r1(r)}" fill="#f4f7fb" opacity="${r1(o + R() * 0.35)}"/>`;
      }
      return `<svg viewBox="0 0 ${W + 300} ${2 * H}" width="${W + 300}" height="${2 * H}">${s}</svg>`;
    };
    const k = v.mangd;
    const yta = (W * H) / (1600 * 1000);
    let s = '';
    if (v.fall === 'regn' || v.fall === 'blandat') {
      const part = (v.fall === 'blandat' ? 0.45 : 1) * yta;
      const dugg = v.slag === 'dugg';
      s += `<div class="rf-fall-b fjarr" style="height:${2 * H}px; --h:${H}px; animation-duration:${dugg ? 2 : 1.1}s">${lines(Math.round((dugg ? 260 : 320) * k * part), 0.04, dugg ? 10 : 30, dugg ? 22 : 70, 1)}</div>`;
      s += `<div class="rf-fall-b" style="height:${2 * H}px; --h:${H}px; animation-duration:${r1(dugg ? 1.4 : 0.65 - 0.12 * k)}s">${lines(Math.round((dugg ? 160 : 380) * k * part), 0.06, dugg ? 14 : 40, dugg ? 30 : 100, 1.4)}</div>`;
    }
    if (v.fall === 'sno' || v.fall === 'blandat') {
      const part = (v.fall === 'blandat' ? 0.4 : 1) * yta;
      const sway = Math.min(120, 20 + v.vind * 10);
      s += `<div class="rf-sno-v" style="--sway:${sway}px; animation-duration:5s"><div class="rf-fall-b" style="height:${2 * H}px; --h:${H}px; animation-duration:${r1(16 - 4 * k)}s">${flakes(Math.round(320 * k * part), 1.6, 3.4, 0.3)}</div></div>`;
      s += `<div class="rf-sno-v" style="--sway:${r1(sway * 1.4)}px; animation-duration:3.6s; animation-delay:-1.4s"><div class="rf-fall-b" style="height:${2 * H}px; --h:${H}px; animation-duration:${r1(9 - 3 * k)}s">${flakes(Math.round(200 * k * part), 3.4, 6.4, 0.45)}</div></div>`;
    }
    return s;
  }

  // ---------- att bygga och rita ----------

  const bucket = (x, n) => Math.round(x * n) / n;
  function sig(V, v, L, o) {
    return [V.x, V.y, V.w, V.h, v.slag, bucket(v.mangd, 5), v.snotackt, v.blott, v.advent, v.arstid, lovet(v), v.timme >> 1, v.nyar,
      bucket(L.dag, 20), bucket(L.sol, 10), bucket(L.guld, 10), bucket(L.m, 10), bucket(L.tand, 30), L.lampor, bucket(L.dimma, 5),
      Math.round(v.temp), Math.round(v.vind / 3), bucket(inne(o), 10)].join();
  }

  function svg(V, inner, cls = '') {
    return `<svg class="rf-lager ${cls}" viewBox="${V.x} ${V.y} ${V.w} ${V.h}" width="${V.w}" height="${V.h}" aria-hidden="true">${inner}</svg>`;
  }

  function bygg(rum, o = {}) {
    const el = document.createElement('div');
    el.className = 'rum-fasad';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Matchfixarna utifrån: affären vid S:t Eriksbron, med gänget i fönstret');
    el.innerHTML = '<div class="rf-scen"></div>';
    rum.append(el);
    const scen = el.firstChild;
    const F = { V: null, sig: '', duk: null, raf: 0, sist: 0, neon: null, klar: false };
    const calm = () => Boolean(o.calm && o.calm());

    function rita() {
      const a = (el.clientWidth || innerWidth) / (el.clientHeight || innerHeight);
      const V = vy(a);
      const v = window.Vader ? Vader.nu() : null;
      if (!v || !U()) return;
      const L = U().light(v);
      const s = sig(V, v, L, o);
      if (s === F.sig) return;
      F.sig = s;
      F.V = V;
      const defs = `<defs><filter id="rf-mjuk" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="rf-b8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter><filter id="rf-neon-b" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
        <clipPath id="rf-glas-k"><rect x="${FON.x}" y="${FON.y}" width="${FON.w}" height="${FON.h}"/><rect x="${DORR.x}" y="${DORR.y}" width="${DORR.w}" height="${DORR.h}"/></clipPath>
        <clipPath id="rf-hal"><path clip-rule="evenodd" d="M${VARLD.x0} ${VARLD.y0} H${VARLD.x1} V${VARLD.y1} H${VARLD.x0} Z M${FON.x} ${FON.y} h${FON.w} v${FON.h} h${-FON.w} Z M${DORR.x} ${DORR.y} h${DORR.w} v${DORR.h} h${-DORR.w} Z"/></clipPath></defs>`;
      const glasX = FON.x - V.x;
      const glasY = FON.y - V.y;
      // (dukens bildpunkter: fönstrets storlek på skärmen, högst 1400 på bredden)
      const k = Math.min(innerWidth / V.w, innerHeight / V.h);
      const pr = Math.min(2, devicePixelRatio || 1);
      const dw = Math.round(Math.min(1400, FON.w * k * pr));
      const dh = Math.round(dw * FON.h / FON.w);
      const gammal = F.duk;
      scen.style.width = `${V.w}px`;
      scen.style.height = `${V.h}px`;
      scen.innerHTML =
        svg(V, defs + himmel(V, v, L)) +
        `<div class="rf-lager rf-himliv">${calm() ? '' : himmelsliv(V, v, L)}</div>` +
        svg(V, bortom(V, v, L)) +
        svg(V, defs + rummet(v, L, o), 'rf-inne') +
        `<canvas class="rf-gang" width="${dw}" height="${dh}" style="left:${glasX}px; top:${glasY}px; width:${FON.w}px; height:${FON.h}px"></canvas>` +
        svg(V, defs + iFonstret(v, L, o)) +
        svg(V, defs + neonSkylt(), 'rf-neonlager') +
        svg(V, defs + glaset(v, L, o)) +
        `<div class="rf-spegel" style="left:${glasX}px; top:${glasY}px; width:${FON.w}px; height:${FON.h}px">${calm() ? '' : speglingar(v, L)}</div>` +
        `<div class="rf-spegel d" style="left:${DORR.x - V.x}px; top:${DORR.y - V.y}px; width:${DORR.w}px; height:${DORR.h}px">${calm() ? '' : speglingar(v, L).replace(/--fran:(-?[\d.]+)px; --till:(-?[\d.]+)px/g, (m0, f, t) => `--fran:${r1(+f - (DORR.x - FON.x))}px; --till:${r1(+t - (DORR.x - FON.x))}px`)}</div>` +
        svg(V, `${defs}<g clip-path="url(#rf-hal)">${huset(V, v, L, o)}</g>${bron(V, v, L)}${marken(V, v, L)}`) +
        svg(V, texten(v, L), 'rf-text') +
        `<div class="rf-barber" style="left:${-28 - V.x}px; top:${560 - V.y}px"><i></i></div>` +
        svg(V, defs + kvallsljus(V, v, L, o), 'rf-kvall') +
        `<div class="rf-lager rf-folk">${calm() ? '' : folket(V, v, L)}</div>` +
        (L.dimma > 0.05 ? `<div class="rf-lager rf-dimma" style="background:${mix('#2a2622', '#aeb3b6', L.dag)}; opacity:${r1(0.32 * L.dimma)}"></div>` : '') +
        `<div class="rf-lager rf-fall">${calm() ? '' : nederbord(V, v)}</div>` +
        (v.slag === 'aska' && !calm() ? '<div class="rf-lager rf-blixt"><i></i><i class="b2"></i></div>' : '');
      F.duk = scen.querySelector('.rf-gang');
      // (en fast bild: allt som rör sig står på samma tid)
      if (o.still != null) for (const an of el.getAnimations({ subtree: true })) { an.pause(); an.currentTime = o.still * 1000; }
      // (gänget från förra gången tills det ritas på nytt)
      if (gammal && gammal.width) F.duk.getContext('2d').drawImage(gammal, 0, 0, F.duk.width, F.duk.height);
      F.neon = null;
      passa();
      gang(true);
    }
    // scenen så stor att den täcker fönstret (vy har fönstrets form)
    function passa() {
      if (!F.V) return;
      const k = Math.max(el.clientWidth / F.V.w, el.clientHeight / F.V.h);
      scen.style.transform = `scale(${k})`;
      el.style.setProperty('--dorr-x', `${r1((DORR.x + DORR.w / 2 - F.V.x) * k)}px`);
      el.style.setProperty('--dorr-y', `${r1((DORR.y + DORR.h * 0.45 - F.V.y) * k)}px`);
    }
    // gänget i fönstret och neonen: några gånger i sekunden (i telefonen färre), en gång i en stillbild
    function gang(nu) {
      const ms = performance.now();
      if (!nu && ms - F.sist < (LATT ? 240 : 110)) return;
      F.sist = ms;
      if (F.duk && o.gang) o.gang(F.duk);
      const on = o.neon ? o.neon() !== false : true;
      if (on !== F.neon) {
        F.neon = on;
        el.classList.toggle('neon-av', !on);
      }
    }
    function loop() {
      cancelAnimationFrame(F.raf);
      if (calm() || o.still != null) return;
      const tick = () => {
        if (!el.isConnected) return;
        gang(false);
        F.raf = requestAnimationFrame(tick);
      };
      F.raf = requestAnimationFrame(tick);
    }
    // vädret och ljuset ändras: ritas om när de har ändrats (sig), en gång i minuten
    const T = setInterval(() => { if (el.isConnected) rita(); }, 60e3);
    const storlek = () => { F.sig = ''; rita(); };
    addEventListener('resize', storlek);
    rita();
    loop();
    return {
      el,
      ny: () => { F.sig = ''; rita(); },
      ut() {
        cancelAnimationFrame(F.raf);
        clearInterval(T);
        removeEventListener('resize', storlek);
        el.remove();
      },
    };
  }

  return { bygg, vy, FON, DORR };
})();
