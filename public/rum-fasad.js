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
// ljuset eller vädret ändras (sig); det som rör sig (de som går, speglingarna, regnet och snön, molnen och
// barberarens stång) ritas i tre dukar i en takt (TAKT), och står still med prefers-reduced-motion.
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
  // Det som syns bakom gänget: rummet i lysrörets ljus (och på natten neonens och tv:ns), lite ur skärpa –
  // hyllan med cigarettpaketen går att se, men gänget i 3D framför står ut; Hasse vagare bakom dörren. Sett utifrån är rummets högra vägg (tv:n,
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
          for (let px = X + W * 0.31; px < X + W * 0.8; px += 12) pk += `<rect x="${r1(px)}" y="${r1(Y + H * hy + 6)}" width="9" height="20" fill="${pick(R, ['#9a3a2c', '#d8ceb8', '#34507a', '#b8903a', '#3a5e44', '#2a2622'])}"/>`;
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
    let s = `<defs>${glod('rf-g-vit', '#fff6dc', 0.6)}${glod('rf-g-bla', '#6a8cff', 0.5)}${glod('rf-g-rod', '#ff3a26', 0.55)}<filter id="rf-inne-b" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2"/></filter><filter id="rf-inne-h" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
      <clipPath id="rf-inne-k"><rect x="${x}" y="${y}" width="${w}" height="${h}"/><rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}"/></clipPath></defs>`;
    s += `<g clip-path="url(#rf-inne-k)"><g filter="url(#rf-inne-b)">${ett(x - 10, y - 10, w + 20, h + 20, true)}${ett(d.x - 10, d.y - 10, d.w + 20, d.h + 20, false)}`;
    // Hasse Backe vid baren, en mörk gestalt i kostym genom dörren
    const hx = d.x + d.w * 0.55;
    const hy = d.y + d.h * 0.62;
    s += `<g fill="${mix('#0c0c10', '#2a2c38', ljus)}" filter="url(#rf-inne-h)"><path d="M${r1(hx - 30)} ${r1(hy + 30)} Q${r1(hx - 32)} ${r1(hy - 58)} ${hx} ${r1(hy - 60)} Q${r1(hx + 32)} ${r1(hy - 58)} ${r1(hx + 30)} ${r1(hy + 30)} Z"/><circle cx="${hx}" cy="${r1(hy - 82)}" r="17" fill="${mix('#1a120c', '#c49a7a', ljus * 0.8)}"/><path d="M${r1(hx - 16)} ${r1(hy - 88)} Q${hx} ${r1(hy - 104)} ${r1(hx + 16)} ${r1(hy - 88)} Z" fill="${mix('#0a0a0a', '#d8d8d4', ljus * 0.8)}"/></g>`;
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
  // Glaset sitter djupt i karmen (skugga upptill och till vänster), imma nertill när det är kallt ute (varmt
  // inne), droppar efter regn – små linser med mörk kant och en ljusprick – och några som har runnit och
  // lämnat ett spår, och frost i hörnen när det är kallare än −3°.
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
    // imma, droppar och rännilar
    const regn = v.fall === 'regn' || v.fall === 'blandat';
    const RD = rng(17);
    const imma = v.temp < 14 ? Math.min(1, (14 - v.temp) / 10) * (regn ? 1 : 0.5) : 0;
    const ik = mix('#c9d2d8', '#f0dcc0', 1 - L.dag);
    s += '<defs><linearGradient id="rf-g-topp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="rf-g-sida" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
      `<linearGradient id="rf-imma" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${ik}" stop-opacity=".5"/><stop offset=".22" stop-color="${ik}" stop-opacity=".16"/><stop offset=".45" stop-color="${ik}" stop-opacity="0"/></linearGradient></defs>`;
    for (const r of [FON, DORR]) {
      if (imma > 0.02) s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#rf-imma)" opacity="${r1(imma)}"/>`;
      if (regn || v.blott) {
        const n = Math.round((regn ? 1 : 0.4) * r.w * r.h / 1500);
        for (let i = 0; i < n; i++) {
          const dx = r1(r.x + RD() * r.w);
          const dy = r.y + RD() * r.h;
          const rr = 1 + RD() * RD() * 3.6;
          s += `<circle cx="${dx}" cy="${r1(dy + 0.5)}" r="${r1(rr)}" fill="#120c06" opacity=".3"/><circle cx="${dx}" cy="${r1(dy)}" r="${r1(rr * 0.78)}" fill="#ffe7c4" opacity="${r1(0.1 + 0.12 * RD())}"/><ellipse cx="${dx}" cy="${r1(dy + rr * 0.42)}" rx="${r1(rr * 0.5)}" ry="${r1(rr * 0.24)}" fill="#fff3d8" opacity=".45"/><circle cx="${r1(dx - rr * 0.32)}" cy="${r1(dy - rr * 0.34)}" r="${r1(Math.max(0.5, rr * 0.22))}" fill="#fff" opacity=".8"/>`;
        }
        // (rännilarna: en droppe som har runnit och lämnat ett spår)
        const m = regn ? Math.max(2, Math.round(r.w / 40)) : 1;
        for (let j = 0; j < m; j++) {
          const x0 = r.x + 6 + RD() * (r.w - 12);
          const y0 = r.y + RD() * r.h * 0.55;
          const y1 = Math.min(r.y + r.h - 6, y0 + 50 + RD() * r.h * 0.6);
          const w = 1.2 + RD() * 1.6;
          let x = x0;
          let p = `M${r1(x)} ${r1(y0)}`;
          for (let y = y0 + 14; y < y1; y += 12 + RD() * 14) {
            const nx = x + (RD() - 0.5) * 4;
            p += ` Q${r1(x)} ${r1(y - 6)} ${r1(nx)} ${r1(y)}`;
            x = nx;
          }
          s += `<path d="${p}" fill="none" stroke="#120c06" stroke-opacity=".22" stroke-width="${r1(w + 1.4)}" stroke-linecap="round"/><path d="${p}" fill="none" stroke="#fff1d6" stroke-opacity=".3" stroke-width="${r1(w * 0.6)}" stroke-linecap="round" transform="translate(-.5 0)"/>`;
          s += `<circle cx="${r1(x)}" cy="${r1(y1 + 1)}" r="${r1(w * 1.5 + 0.6)}" fill="#120c06" opacity=".3"/><circle cx="${r1(x)}" cy="${r1(y1)}" r="${r1(w * 1.3)}" fill="#ffe7c4" opacity=".2"/><circle cx="${r1(x - w * 0.4)}" cy="${r1(y1 - w * 0.4)}" r="${r1(w * 0.35)}" fill="#fff" opacity=".85"/>`;
        }
      }
      // (glaset sitter djupt i karmen)
      s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="22" fill="url(#rf-g-topp)"/><rect x="${r.x}" y="${r.y}" width="12" height="${r.h}" fill="url(#rf-g-sida)"/>`;
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

  // Texten på skylten och guldet på dörren, för sig (text i en SVG ritas om när något i den ändras). Skyltens
  // bokstäver lyser i lampornas sken på kvällen.
  function texten(v, L) {
    const sk = SKYLT;
    const ben = mix(mix('#5a554c', '#f3ead9', 0.15 + 0.85 * L.dag), '#f8e4bc', L.lampor ? 0.9 * (1 - L.dag) : 0);
    // (bokstäverna står ut från skylten: en skugga under, av lamporna på kvällen och solen på dagen)
    let s = `<text x="${sk.x + sk.w / 2 + 2}" y="${sk.y + 62}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="46" letter-spacing="13" fill="#000" opacity=".5">MATCHFIXARNA</text>`;
    s += `<text x="${sk.x + sk.w / 2}" y="${sk.y + 57}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="46" letter-spacing="13" fill="${ben}">MATCHFIXARNA</text>`;
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

  // Ljuset. På dagen skuggor under gesimsen, skylten och svanhalsarna och i porten, så att fasaden får djup.
  // På kvällen är bottenvåningen och trottoaren mörkare (en mask med mjuka hål där något lyser) och ljuset
  // skarpt: käglor från svanhalsarna ned över skylten, en liten gloria kring lyktorna, rummets sken på
  // väggen och trottoaren och, när stenen är våt, ränder av ljus under det som lyser (neonen röd). Uppåt
  // mörknar det, så att blicken stannar vid affären. Inga filter: mjuka kanter med toningar och käglor i
  // lager på lager, så att det ritas lika fort i telefonen.
  function kvallsljus(V, v, L, o) {
    const mork = 1 - L.dag;
    const ljus = inne(o);
    const sk = SKYLT;
    const lampX = [sk.x + sk.w * 0.2 + 47, sk.x + sk.w * 0.8 - 47];
    let d = '<defs><radialGradient id="rf-glod" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2d2" stop-opacity=".95"/><stop offset=".25" stop-color="#ffd08a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rf-hol" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000"/><stop offset=".55" stop-color="#000" stop-opacity=".75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>';
    let s = '';
    // ---- dagen
    const skugga = L.dag * (0.22 + 0.4 * L.sol * (1 - 0.6 * L.m));
    if (skugga > 0.02) {
      d += '<linearGradient id="rf-s-ned" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="rf-s-hog" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".8"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>';
      const px = 60;
      const pw = 210;
      const pt = 340;
      const valv = (dx, dy) => `M${px + dx} ${MARK} V${pt + 90 + dy} Q${px + dx} ${pt + dy} ${px + pw / 2 + dx} ${pt + dy} Q${px + pw + dx} ${pt + dy} ${px + pw + dx} ${pt + 90 + dy} V${MARK} Z`;
      d += `<clipPath id="rf-s-port"><path d="${valv(0, 0)}"/></clipPath>`;
      let sh = `<rect x="${VARLD.x0}" y="236" width="${HORN - VARLD.x0}" height="34" fill="url(#rf-s-ned)"/>`;
      sh += `<rect x="${sk.x + 16}" y="${sk.y + sk.h}" width="${sk.w}" height="40" fill="url(#rf-s-ned)"/><rect x="${sk.x + sk.w}" y="${sk.y + 10}" width="18" height="${sk.h}" fill="url(#rf-s-hog)"/>`;
      sh += `<rect x="${sk.x + 6}" y="${MARK - 34}" width="${HORN - sk.x}" height="10" fill="#000" opacity=".35"/>`;
      for (const [lx, m] of [[sk.x + sk.w * 0.2, 1], [sk.x + sk.w * 0.8, -1]]) sh += `<g transform="translate(${r1(lx + 10)} 16) scale(${m} 1)" opacity=".38"><path d="M0 ${sk.y - 4} V${sk.y - 70} q0 -24 26 -24 q30 0 30 36" fill="none" stroke="#000" stroke-width="5"/><path d="M38 ${sk.y - 64} l18 0 l10 22 l-38 0 Z" fill="#000"/></g>`;
      sh += `<g clip-path="url(#rf-s-port)"><path fill-rule="evenodd" d="${valv(0, 0)} ${valv(18, 16)}" fill="#000"/></g>`;
      sh += '<path d="M341 361 h30 l-4 50 h-22 Z" fill="#000" opacity=".6"/>';
      s += `<g opacity="${r1(skugga)}">${sh}</g>`;
    }
    if (mork < 0.04 || L.dag > 0.75) return `${d}</defs>${s}`;
    // ---- kvällen: mörkret över bottenvåningen och trottoaren, utom där något lyser
    const hal = [[FON.x + FON.w / 2, FON.y + FON.h / 2, FON.w * 0.78, FON.h * 0.95], [DORR.x + DORR.w / 2, DORR.y + DORR.h / 2, DORR.w * 1.2, DORR.h * 0.7]];
    for (const lx of lampX) hal.push([lx, sk.y + 30, 230, 130]);
    if (L.lampor) hal.push([341, 380, 150, 160], [1720, MARK + 30, 330, 120]);
    hal.push([FON.x + FON.w / 2 + 40, MARK + 50, 520, 120]);
    d += `<mask id="rf-mork-m" maskUnits="userSpaceOnUse" x="${VARLD.x0}" y="${VARLD.y0}" width="${VARLD.x1 - VARLD.x0}" height="${VARLD.y1 - VARLD.y0}"><rect x="${VARLD.x0}" y="${VARLD.y0}" width="${VARLD.x1 - VARLD.x0}" height="${VARLD.y1 - VARLD.y0}" fill="#fff"/>` +
      hal.map(([cx, cy, rx, ry]) => `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="url(#rf-hol)"/>`).join('') +
      `<rect x="${FON.x}" y="${FON.y}" width="${FON.w}" height="${FON.h}" fill="#000"/><rect x="${DORR.x}" y="${DORR.y}" width="${DORR.w}" height="${DORR.h}" fill="#000"/></mask>` +
      '<linearGradient id="rf-mork" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="300"><stop offset="0" stop-color="#05060a" stop-opacity="0"/><stop offset="1" stop-color="#05060a"/></linearGradient>' +
      `<linearGradient id="rf-upp" gradientUnits="userSpaceOnUse" x1="0" y1="${V.y}" x2="0" y2="250"><stop offset="0" stop-color="#05060a" stop-opacity=".75"/><stop offset="1" stop-color="#05060a" stop-opacity="0"/></linearGradient>`;
    s += `<path d="M${VARLD.x0} 150 H${HORN} V${MARK} H${VARLD.x1} V${VARLD.y1} H${VARLD.x0} Z" fill="url(#rf-mork)" opacity="${r1(0.62 * mork)}" mask="url(#rf-mork-m)"/>`;
    s += `<rect x="${VARLD.x0}" y="${V.y}" width="${VARLD.x1 - VARLD.x0}" height="${r1(250 - V.y)}" fill="url(#rf-upp)" opacity="${r1(mork)}"/>`;
    // rummet lyser ut på väggen kring fönstret, svagt, och neonens röda sken på karmen över fönstret
    s += `<ellipse cx="${FON.x + FON.w / 2}" cy="${FON.y + FON.h / 2}" rx="${FON.w * 0.7}" ry="${FON.h * 0.82}" fill="url(#rf-glod)" opacity="${r1(0.16 * mork * (0.4 + 0.6 * ljus))}"/>`;
    d += '<radialGradient id="rf-rott" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4a30" stop-opacity=".7"/><stop offset="1" stop-color="#ff4a30" stop-opacity="0"/></radialGradient>';
    s += `<ellipse class="rf-neon" cx="${r1(FON.x + FON.w * 0.76)}" cy="${FON.y + 4}" rx="170" ry="46" fill="url(#rf-rott)" opacity="${r1(0.45 * mork)}"/>`;
    // (en kägla: samma toning i tre allt bredare lager, så att kanterna blir mjuka)
    const kagla = (id, x, y0, y1, smal, breda, a) => breda.map((b, i) => `<path d="M${r1(x - smal)} ${y0} L${r1(x + smal)} ${y0} L${r1(x + b)} ${y1} L${r1(x - b)} ${y1} Z" fill="url(#${id})" opacity="${r1(a * [0.5, 0.35, 0.22][i])}"/>`).join('');
    if (L.lampor) {
      // svanhalsarnas käglor ned över skylten
      lampX.forEach((lx, i) => {
        d += `<radialGradient id="rf-kon${i}" gradientUnits="userSpaceOnUse" cx="${r1(lx)}" cy="256" r="210"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".9"/><stop offset=".45" stop-color="#ffc47e" stop-opacity=".32"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>`;
        s += kagla(`rf-kon${i}`, lx, 254, 432, 10, [110, 150, 195], mork);
        s += `<ellipse cx="${r1(lx)}" cy="258" rx="46" ry="15" fill="url(#rf-glod)" opacity="${r1(0.9 * mork)}"/><ellipse cx="${r1(lx)}" cy="255" rx="15" ry="4" fill="#fffaf0" opacity="${r1(mork)}"/>`;
      });
      // lyktan vid porten: en liten gloria och ljuset på väggen under
      s += `<ellipse cx="341" cy="440" rx="80" ry="120" fill="url(#rf-glod)" opacity="${r1(0.22 * mork)}"/><circle cx="341" cy="374" r="62" fill="url(#rf-glod)" opacity="${r1(0.75 * mork)}"/><path d="M330 352 h22 l-3 40 h-16 Z" fill="#fff4dc" opacity="${r1(0.8 * mork)}"/>`;
      // gatlyktan på bron: en skarp kärna, en mindre gloria och ljuset ned mot trottoaren
      d += `<radialGradient id="rf-gat" gradientUnits="userSpaceOnUse" cx="1720" cy="${LYKTA + 10}" r="${r1(MARK - LYKTA)}"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".35"/><stop offset=".5" stop-color="#ffc47e" stop-opacity=".09"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>`;
      s += kagla('rf-gat', 1720, LYKTA + 14, MARK + 30, 24, [170, 250, 330], 0.3 * mork);
      s += `<circle cx="1720" cy="${LYKTA + 16}" r="${r1(120 * (1 + 0.6 * L.dimma))}" fill="url(#rf-glod)" opacity="${r1(0.8 * mork)}"/><ellipse cx="1720" cy="${LYKTA + 22}" rx="20" ry="7" fill="#fffaf0" opacity="${r1(mork)}"/>`;
      s += `<ellipse cx="1720" cy="${MARK + 34}" rx="300" ry="44" fill="url(#rf-glod)" opacity="${r1(0.3 * mork)}"/>`;
    }
    // rummets ljus ut på trottoaren, mjukt och kort
    d += '<radialGradient id="rf-pol" cx=".5" cy="0" r=".5"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".75"/><stop offset=".6" stop-color="#ffcf8a" stop-opacity=".2"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>';
    const pol = 0.42 * mork * (0.35 + 0.65 * ljus);
    s += `<rect x="${FON.x - 120}" y="${MARK}" width="${FON.w + 240}" height="${r1(2 * (markY(1.8) - MARK))}" fill="url(#rf-pol)" opacity="${r1(pol)}"/><rect x="${DORR.x - 60}" y="${MARK}" width="${DORR.w + 120}" height="${r1(2 * (markY(1.8) - MARK))}" fill="url(#rf-pol)" opacity="${r1(pol)}"/>`;
    // den våta stenen: ränder av ljus under det som lyser
    if ((L.wet || v.blott) && !v.snotackt) {
      const grad = (id, c) => `<radialGradient id="${id}" cx=".5" cy="0" r="1"><stop offset="0" stop-color="${c}"/><stop offset=".22" stop-color="${c}" stop-opacity=".5"/><stop offset=".5" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
      d += grad('rf-r-v', '#ffcf8a') + grad('rf-r-r', '#ff5a3c') + grad('rf-r-l', '#ffe2b0');
      const RV = rng(41);
      let st = '';
      const rand = (x0, x1, id, a, l0, l1, t0 = 6, t1 = 16, glapp = 26) => {
        for (let x = x0 + RV() * 10; x < x1; x += t0 * 0.6 + RV() * glapp) {
          const w = t0 + RV() * (t1 - t0);
          const l = l0 + RV() * (l1 - l0);
          st += `<rect x="${r1(x - w / 2)}" y="${MARK + 1}" width="${r1(w)}" height="${r1(2 * l)}" fill="url(#${id})" opacity="${r1(a * (0.45 + RV() * 0.55))}"/>`;
        }
      };
      rand(FON.x + 6, FON.x + FON.w - 8, 'rf-r-v', 0.55 * (0.4 + 0.6 * ljus), 40, 150);
      rand(DORR.x + 6, DORR.x + DORR.w - 8, 'rf-r-v', 0.5 * (0.4 + 0.6 * ljus), 60, 170);
      rand(FON.x + FON.w * 0.76 - 70, FON.x + FON.w * 0.76 + 70, 'rf-r-r', 0.8, 140, 260, 8, 18, 12);
      if (L.lampor) {
        for (const lx of lampX) rand(lx - 26, lx + 26, 'rf-r-l', 0.6, 80, 200, 6, 12, 12);
        rand(318, 364, 'rf-r-l', 0.7, 90, 220, 6, 12, 10);
        rand(1690, 1750, 'rf-r-l', 0.85, 200, 360, 7, 14, 10);
      }
      s += `<g class="rf-randerna" opacity="${r1(mork)}">${st}</g>`;
    }
    return `${d}</defs>${s}`;
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
      // våt sten speglar himlen på dagen (och affärens ljus på kvällen: kvallsljus)
      if (L.dag > 0.2) s += `<rect x="${VARLD.x0}" y="${MARK}" width="${VARLD.x1 - VARLD.x0}" height="${y1 - MARK}" fill="${L.sky[2]}" opacity="${r1(0.16 * L.dag)}"/>`;
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

  // ---------- det som rör sig ----------
  //
  // Allt som rör sig hela tiden ritas i dukar, högst TAKT gånger i sekunden och bara när något som rör sig
  // syns: överst (fram) bilarna som speglas i glaset, de som går förbi och deras speglingar i den våta
  // stenen, någon som ibland stannar och tittar in, regnet, snön och blixten; bakom huset (bak), där himlen
  // syns, molnen, fåglarna och fyrverkerierna; och barberarens stång i en liten egen duk på väggen. Förut var
  // det ett trettiotal CSS-animeringar, var och en i ett eget lager, och ett tiotal skärmytor lades ihop 60
  // gånger i sekunden.
  const TAKT = LATT ? 24 : 30;
  const DEG = Math.PI / 180;
  // fram och tillbaka med mjuka vändningar (som ease-in-out alternate): 0 … 1 … 0 på 2·p sekunder
  const pendel = (t, p) => {
    const x = (((t / p) % 2) + 2) % 2;
    const q = x < 1 ? x : 2 - x;
    return q * q * (3 - 2 * q);
  };
  // något som glider från fran till till på dur sekunder, om och om igen (fas: hur långt det har kommit vid 0)
  const glidX = (g, t) => g.fran + (g.till - g.fran) * (((((t + g.fas) / g.dur) % 1) + 1) % 1);
  // en rundad rektangel (roundRect finns inte i äldre Safari); r: ett tal eller [övre vänster, övre höger, nedre höger, nedre vänster]
  function rund(c, x, y, w, h, r) {
    const [a, b, d, e] = (Array.isArray(r) ? r : [r, r, r, r]).map((q) => Math.min(q, w / 2, h / 2));
    c.moveTo(x + a, y);
    c.arcTo(x + w, y, x + w, y + h, b);
    c.arcTo(x + w, y + h, x, y + h, d);
    c.arcTo(x, y + h, x, y, e);
    c.arcTo(x, y, x + w, y, a);
    c.closePath();
  }
  const ell = (cx, cy, rx, ry) => {
    const p = new Path2D();
    p.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    return p;
  };

  // ---------- gången ----------
  //
  // De som går förbi går som folk: foten som står på marken står still mot trottoaren medan kroppen går fram
  // (hälen slår i, foten rullar över till tån och lyfts), höften gungar upp och ner en gång per steg, knät böjs
  // när benet förs fram och armarna pendlar emot benen med armbågen lite böjd. Gångcykeln (två steg, GANG.S cm
  // långa tillsammans) räknas ut en gång (gangen): var foten är i varje del av varvet, och därifrån höften och
  // vinklarna i höften, knät och fotleden. Var i varvet en figur är tas av hur långt den har gått (stalln), så
  // att fötterna står still mot stenen hur ofta duken än ritas om.
  const GANG = { S: 136, B: 0.62, LAR: 45, SMA: 38, HOFT: 90, N: 64, PM: 0.31 };
  let gangTab = null;
  function gangen() {
    if (gangTab) return gangTab;
    const { S, B, LAR: L1, SMA: L2, N, PM } = GANG;
    // foten från fotleden (x framåt, y nedåt): hälen och tån; vinkeln positiv när hälen lyfts
    const HAL = [-6.5, 7];
    const TA = [16.5, 7];
    const PSI0 = -12 * DEG;
    const PSI1 = 55 * DEG;
    const rot = (q, a) => [q[0] * Math.cos(a) - q[1] * Math.sin(a), q[0] * Math.sin(a) + q[1] * Math.cos(a)];
    const ss = (x) => { const q = Math.min(1, Math.max(0, x)); return q * q * (3 - 2 * q); };
    // Stödfasen (0 … B): hälen slår i X0 framför höften och foten fälls ner (till 0,08), står platt (till
    // 0,36) och rullar över tån (till B). Fotleden och fotens vinkel på marken (y 0), där höften var i 0 vid
    // hälisättningen och går S per varv.
    const X0 = 24;
    function stod(p) {
      if (p < 0.08) { const psi = PSI0 * (1 - ss(p / 0.08)); const h = rot(HAL, psi); return [X0 - h[0], -h[1], psi]; }
      if (p < 0.36) return [X0 - HAL[0], -HAL[1], 0];
      const psi = PSI1 * Math.pow((p - 0.36) / (B - 0.36), 1.5);
      const q = rot(TA, psi);
      return [X0 - HAL[0] + TA[0] - q[0], -q[1], psi];
    }
    // Svingfasen (B … 1): fotleden förs fram till nästa hälisättning (S längre fram) i en mjuk båge som börjar
    // i samma fart som foten lämnade marken (hermite), och tårna lyfts.
    const e = 1e-4;
    const sw = 1 - B;
    const a0 = stod(B - e);
    const a0b = stod(B - 2 * e);
    const a1 = stod(0);
    const a1b = stod(e);
    const v0 = [(a0[0] - a0b[0]) / e * sw, (a0[1] - a0b[1]) / e * sw * 0.5];
    const v1 = [(a1b[0] - a1[0]) / e * sw * 0.6, (a1b[1] - a1[1]) / e * sw * 0.6];
    const herm = (p0, p1, m0, m1, x) => {
      const x2 = x * x; const x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * p0 + (x3 - 2 * x2 + x) * m0 + (3 * x2 - 2 * x3) * p1 + (x3 - x2) * m1;
    };
    function fot(p) {
      if (p < B) return stod(p);
      const x = (p - B) / sw;
      return [herm(a0[0], a1[0] + S, v0[0], v1[0], x), herm(a0[1], a1[1], v0[1], v1[1], x) - Math.sin(Math.PI * Math.pow(x, 0.8)) * (1 - 0.3 * x),
        PSI1 + (PSI0 - PSI1) * ss(x / 0.75)];
    }
    // fotleden mätt från höften, för benet som är q in i sitt varv
    const rel = (q) => { const f = fot(q); return [f[0] - S * q, f[1], f[2]]; };
    // Höften: högst mitt i steget (PM) och lägst när båda fötterna är i marken, och lite långsammare där uppe;
    // aldrig högre än att benen som står når marken med knät lite böjt (minst 5°).
    const ps = [...Array(N)].map((_, i) => i / N);
    const fram = (p) => -0.7 * Math.sin(4 * Math.PI * (p - PM));
    const NA = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * Math.cos(5 * DEG));
    const tak = ps.map((p) => Math.min(...[p, (p + 0.5) % 1].map((q) => {
      const r = rel(q);
      const dx = r[0] - fram(p);
      return Math.sqrt(Math.max(0, NA * NA - dx * dx)) - r[1];
    })));
    let H = ps.map((p) => 88.6 + 1.7 * Math.cos(4 * Math.PI * (p - PM)));
    for (let k = 0; k < 6; k++) {
      H = H.map((h, i) => Math.min(h, tak[i]));
      H = H.map((h, i) => (H[(i + N - 1) % N] + 2 * h + H[(i + 1) % N]) / 4);
    }
    H = H.map((h, i) => Math.min(h, tak[i]));
    // per del av varvet: höftens förskjutning (x, y) och benets vinklar (lår, smalben, fot; radianer, medurs
    // som i duken), knät framåt (IK)
    gangTab = ps.map((p, i) => {
      const r = rel(p);
      const dx = r[0] - fram(p);
      const dy = r[1] + H[i];
      const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1e-6);
      const f1 = Math.atan2(dx, dy) + Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
      const f2 = Math.atan2(dx - L1 * Math.sin(f1), dy - L1 * Math.cos(f1));
      return [fram(p), GANG.HOFT - H[i], -f1, f1 - f2, r[2] + f2];
    });
    return gangTab;
  }
  // Ställningen p in i varvet (0 … 1; det bortre benet och armen ett halvt varv efter): höften (bx, by), benen
  // (F, B: lår, smalben, fot), armarna (aF, aB: axel, armbåge), paraplyet (par) och hundens fyra ben (rotate,
  // scaleY: hunden travar fyra varv på ett, tassen står still halva varvet och lyfts fram i den andra, från
  // benets topp 20 cm upp). sta: står still.
  const STAR = { bx: 0, by: 0, F: [0, 0, 0], B: [0, 0, 0], aF: [0, -6 * DEG], aB: [0, -6 * DEG], par: 0, hund: [[0, 1], [0, 1], [0, 1], [0, 1]] };
  function stalln(p) {
    const T = gangen();
    const N = T.length;
    const tab = (q) => {
      const x = ((q % 1) + 1) % 1 * N;
      const i = Math.floor(x);
      const a = T[i]; const b = T[(i + 1) % N]; const w = x - i;
      return a.map((v, j) => v + (b[j] - v) * w);
    };
    const f = tab(p);
    const b = tab(p + 0.5);
    const arm = (q) => { const c = Math.cos(2 * Math.PI * (q - 0.04)); return [15 * c * DEG, (-8 - 11 * (1 - c)) * DEG]; };
    const E = GANG.S / 32;
    const tass = (q) => {
      q = ((q % 1) + 1) % 1;
      const s = (q - 0.5) / 0.5;
      const x = q < 0.5 ? E * (1 - 4 * q) : -E + 2 * E * s * s * (3 - 2 * s);
      const y = 20 - (q < 0.5 ? 0 : 5 * Math.sin(Math.PI * s));
      return [-Math.atan2(x, y), Math.hypot(x, y) / 20];
    };
    const h = 4 * p + 0.3;
    return { bx: f[0], by: f[1], F: f.slice(2), B: b.slice(2), aF: arm(p), aB: arm(p + 0.5), par: 1.2 * DEG * Math.sin(4 * Math.PI * (p - GANG.PM)),
      hund: [tass(h), tass(h + 0.5), tass(h + 0.5), tass(h)] };
  }

  // En som går (fötterna i 0, vänd åt höger, i centimeter), som delar i den ordning de fylls i: benen i höften,
  // knät och fotleden, armarna i axeln och armbågen, och hundens ben. Lår och knän, kappa med krage, huvudet i profil
  // med näsa och haka, mössa, keps eller hatt, och paraply med spröt. På kvällen mörka mot fönstret.
  function figurDelar(o, L) {
    const t = (c) => mix(mix('#07080b', c, 0.08 + 0.92 * L.dag), '#ffb060', 0.03 * (1 - L.dag));
    const bak = (c) => mix(t(c), '#000000', 0.32);
    const D = [];
    const del = (d, f, g = '', x = {}) => D.push({ d: typeof d === 'string' ? new Path2D(d) : d, f, g, ...x });
    const drag = (d, s, w, x = {}) => D.push({ d: new Path2D(d), s, w, g: '', ...x });
    // (låret från höften, smalbenet från knät och skon från fotleden; överarmen från axeln, underarmen från armbågen)
    const LAR = `M-7.5 -6 H7.5 Q8 22 5.8 ${GANG.LAR} Q0 ${GANG.LAR + 5} -5.6 ${GANG.LAR} Q-8 22 -7.5 -6 Z`;
    const SMA = `M-5.6 -2 Q0 -5 5.8 -2 L4.4 ${GANG.SMA - 3} H-3.6 Z`;
    const SKO = 'M-4.6 -4 H4.6 Q15 -3.5 16.5 3 V7 H-6.5 Q-7 1 -4.6 -4 Z';
    const OVER = 'M-6 0 H6 Q6.4 16 5.4 29 Q0 33.5 -5.2 29 Q-6.4 16 -6 0 Z';
    const UNDER = 'M-5.2 -2.5 Q0 -5 5.4 -2.5 L4.6 27 H-4.4 Z';
    const ben = (g, f) => { del(LAR, f(o.byxa), g); del(SMA, f(o.byxa), g, { led: 1 }); del(SKO, f(o.sko), g, { led: 2 }); };
    const arm = (g, f) => { del(OVER, f(o.arm), g); del(UNDER, f(o.arm), g, { led: 1 }); del(ell(0.4, 31, 4.4, 5.6), f(o.hud), g, { led: 1 }); };
    ben('benB', bak);
    if (!o.paraply) arm('armB', bak);
    ben('benF', t);
    const nere = o.lang ? -40 : -84;
    const hR = o.lang ? 19 : 16;
    const hL = o.lang ? -20 : -17;
    del(`M-13 -140 Q-16 -151 -7 -152.5 H8 Q16 -151.5 15 -140 L${hR} ${nere} Q0 ${nere + 2.5} ${hL} ${nere} Z`, t(o.rock));
    del(`M-13 -140 Q-16 -151 -7 -152.5 L-4 -152 Q-9 -120 -11 ${nere + 1} L${hL} ${nere} Z`, '#000', '', { a: 0.2, inre: true });
    drag('M-5 -152 L2 -134 L9 -151.5', bak(o.rock), 2, { inre: true });
    if (o.lang) del('M-15.5 -101 H17 V-97 H-15.8 Z', bak(o.rock), '', { inre: true });
    if (o.vaska) { drag('M8 -151 L-11 -104', bak(o.vaska), 2.2); del('M-24 -105 Q-24 -108 -21 -108 H-9 Q-6 -108 -6 -105 V-88 Q-6 -85 -9 -85 H-21 Q-24 -85 -24 -88 Z', t(o.vaska)); }
    del('M-4.2 -158 H4.2 V-148 H-4.2 Z', bak(o.hud));
    del('M-9.5 -163 Q-10.5 -177 0 -178 Q10 -178 10.5 -169 Q11 -166 13.6 -162.5 Q12 -161 10.6 -160.6 Q11.4 -156 7 -154.5 Q2 -153 -3 -154 Q-9 -156 -9.5 -163 Z', t(o.hud));
    del(ell(-1.5, -164, 2, 3), bak(o.hud), '', { inre: true });
    del(ell(7.6, -166.5, 1, 1), bak('#2a2018'), '', { inre: true });
    drag('M5.5 -169.5 Q8 -170.6 10 -169.4', bak(o.har), 1, { inre: true });
    if (o.halsduk) del('M-7 -156 Q1 -152 9 -156 V-148 Q1 -144 -7 -148 Z M4 -149 L10 -121 L4.5 -120 L0.5 -148 Z', t(o.halsduk));
    if (o.hatt === 'mossa') { del('M-10.5 -164 Q-11.5 -185 0.5 -185 Q12 -185 11.5 -166 Z', t(o.mossa)); del('M-11 -168 H12 V-163.5 H-11 Z', bak(o.mossa), '', { inre: true }); }
    else if (o.hatt === 'keps') del('M-10 -167 Q-10 -180 1 -180 Q10.5 -180 11 -171 L19.5 -168.5 Q15 -166 10 -166.5 L-10 -165 Z', t(o.mossa));
    else if (o.hatt === 'hatt') { del('M-8 -171 Q-8.5 -187 1.5 -186 Q9.5 -187 9.5 -171 Z', t(o.mossa)); del('M-15 -170.5 Q1 -174.5 18 -170 Q2 -166.5 -15 -170.5 Z', t(o.mossa)); del('M-8 -174 H9.5 V-171 H-8 Z', bak(o.mossa), '', { inre: true }); }
    else {
      del('M-10 -160 Q-12 -179.5 1 -179.5 Q11 -179 11 -170 Q6 -173 1 -170 Q-3 -166 -5 -160 Q-7 -157 -10 -155 Z', t(o.har));
      if (o.langHar) del('M-10 -160 Q-13 -150 -9 -139 L-3 -141 Q-6 -150 -5 -160 Z', t(o.har));
    }
    if (o.paraply) {
      const p = t(o.paraply);
      del('M-6 0 H6 Q6.5 20 4.6 36 H-4.4 Q-6.5 20 -6 0 Z', t(o.arm), 'fast', { px: 3, py: -140, rot: -38 });
      del(ell(0, 39, 4.4, 5.4), t(o.hud), 'fast', { px: 3, py: -140, rot: -38 });
      const par = { g: 'par' };
      drag('M24 -110 V-243', '#141414', 2, par);
      drag('M24 -110 q0 8 -6 8', '#141414', 2.4, par);
      del('M-42 -206 C-38 -229 -8 -243 24 -243 C56 -243 86 -229 90 -206 Q82 -212 74 -206 Q66 -213 57 -206 Q49 -213 41 -206 Q32 -213 24 -206 Q16 -213 7 -206 Q-1 -213 -9 -206 Q-17 -213 -26 -206 Q-34 -212 -42 -206 Z', p, 'par');
      drag('M24 -243 L-42 -206 M24 -243 L-9 -206 M24 -243 L24 -206 M24 -243 L57 -206 M24 -243 L90 -206', '#000', 1.4, { a: 0.25, inre: true, g: 'par' });
      drag('M24 -243 V-251', '#141414', 2, par);
      drag('M-30 -226 C-14 -238 6 -241 24 -241', '#ffffff', 2.4, { a: 0.06 + 0.16 * L.dag, inre: true, g: 'par' });
      if (o.droppar) drag('M-42 -204 v6 M7 -204 v9 M57 -204 v5 M90 -204 v8', '#cfdcf0', 1.2, { a: 0.35, inre: true, g: 'par' });
    } else if (o.hund) {
      // (kopplet i handen: armen lite framåt och stilla)
      del(OVER, t(o.arm), 'fast', { px: 1, py: -142, rot: -12 });
      del(UNDER, t(o.arm), 'fast', { px: 1, py: -142, rot: -12, led: 1, rot2: -35 });
      del(ell(0.4, 31, 4.4, 5.6), t(o.hud), 'fast', { px: 1, py: -142, rot: -12, led: 1, rot2: -35 });
    } else arm('armF', t);
    if (o.hund) {
      const h = t(o.hund);
      const hb = bak(o.hund);
      drag('M30 -92 Q52 -52 86 -38', '#1a1a1a', 1.6);
      // (benen i diagonala par: bortre bak med närmre fram, och tvärtom)
      [[54, hb, 1], [84, hb, 2], [60, h, 3], [90, h, 0]].forEach(([px, c, ben]) => del('M-2.5 0 H2.5 V20 H-2.5 Z', c, 'hund', { px, py: -20, ben }));
      del(ell(70, -26, 24, 10), h);
      del(ell(94, -34, 9, 9), h);
      del('M100 -32 l8 3 l-8 3 Z M88 -42 l4 -8 l4 7 Z', h);
      drag('M48 -28 q-10 -8 -8 -18', h, 4);
    }
    return D;
  }
  // Någon som har stannat framför fönstret och tittar in, med ryggen mot en.
  function bakDelar(o, L) {
    const t = (c) => mix(mix('#07080b', c, 0.08 + 0.92 * L.dag), '#ffb060', 0.03 * (1 - L.dag));
    const bak = (c) => mix(t(c), '#000000', 0.32);
    const D = [];
    const del = (d, f, x = {}) => D.push({ d: typeof d === 'string' ? new Path2D(d) : d, f, g: '', ...x });
    del('M-11.5 -90 H-1 L-2 -4 H-9.5 Z M1 -90 H11.5 L9.5 -4 H2 Z', t(o.byxa));
    del('M-11 -5 H-1 V0 H-12 Z M1 -5 H11 L12 0 H1 Z', t(o.sko));
    del('M-17 -141 Q-19 -152 -9 -154 H9 Q19 -152 17 -141 L20 -46 Q0 -42 -20 -46 Z', t(o.rock));
    D.push({ d: new Path2D('M0 -150 V-46'), s: bak(o.rock), w: 1.6, g: '', inre: true });
    del('M-17 -141 Q-23 -112 -20 -84 L-13 -85 Q-15 -112 -12 -136 Z M17 -141 Q23 -112 20 -84 L13 -85 Q15 -112 12 -136 Z', bak(o.rock));
    del('M-4.6 -159 H4.6 V-150 H-4.6 Z', bak(o.hud));
    del(ell(-10, -166, 2, 3.2), t(o.hud));
    del(ell(10, -166, 2, 3.2), t(o.hud));
    del(ell(0, -167, 10, 12), t(o.har));
    if (o.halsduk) del('M-8 -157 Q0 -153 8 -157 V-149 Q0 -145 -8 -149 Z', t(o.halsduk));
    if (o.mossa) { del('M-10.5 -166 Q-11.5 -186 0 -186 Q11.5 -186 10.5 -166 Z', t(o.mossa)); del('M-11 -170 H11 V-165.5 H-11 Z', bak(o.mossa), { inre: true }); }
    return D;
  }

  // Delarna i ställningen P (stalln): allt utom hunden gungar med höften, benen vrids i höften, knät och
  // fotleden (led 0, 1, 2), armarna i axeln och armbågen, och det som sitter fast har sina egna vinklar.
  // rand: bara konturen, lineWidth rand (ljuset i kanten), annars fyllt med alfa A (kontur: bara det som syns
  // i siluetten, för speglingen).
  function ritaDelar(c, D, P, A, rand, kontur = false) {
    for (const p of D) {
      if ((rand || kontur) && p.inre) continue;
      if (kontur && p.s) continue;
      c.save();
      const g = p.g;
      if (g === 'hund') { const h = P.hund[p.ben]; c.translate(p.px, p.py); c.rotate(h[0]); c.scale(1, h[1]); }
      else {
        c.translate(P.bx, P.by);
        if (g === 'benF' || g === 'benB') {
          const b = g === 'benF' ? P.F : P.B;
          c.translate(0, -GANG.HOFT);
          c.rotate(b[0]);
          if (p.led) { c.translate(0, GANG.LAR); c.rotate(b[1]); }
          if (p.led > 1) { c.translate(0, GANG.SMA); c.rotate(b[2]); }
        } else if (g === 'armF' || g === 'armB') {
          const a = g === 'armF' ? P.aF : P.aB;
          c.translate(1, -142);
          c.rotate(a[0]);
          if (p.led) { c.translate(0, 29); c.rotate(a[1]); }
        } else if (g === 'fast') {
          c.translate(p.px, p.py);
          c.rotate(p.rot * DEG);
          if (p.led) { c.translate(0, 29); c.rotate(p.rot2 * DEG); }
        } else if (g === 'par') { c.translate(24, -110); c.rotate(P.par); c.translate(-24, 110); }
      }
      if (rand) {
        c.lineWidth = (p.s ? p.w : 0) + rand;
        c.stroke(p.d);
      } else if (p.s) {
        c.globalAlpha = A * (p.a == null ? 1 : p.a);
        c.strokeStyle = p.s;
        c.lineWidth = p.w;
        c.stroke(p.d);
      } else {
        c.globalAlpha = A * (p.a == null ? 1 : p.a);
        c.fillStyle = p.f;
        c.fill(p.d);
      }
      c.restore();
    }
  }

  // Hur mycket ljus det är bakom den som går, i kanten (0 … 1): starkast framför fönstret och dörren, lite vid
  // lyktorna, inget på dagen.
  function randLjus(x, L) {
    if (L.dag > 0.6) return 0;
    const nara = (a, b, f) => { const d = x < a ? a - x : x > b ? x - b : 0; return Math.max(0, 1 - d / f); };
    let n = Math.max(nara(FON.x, FON.x + FON.w, 150), nara(DORR.x, DORR.x + DORR.w, 110));
    if (L.lampor) n = Math.max(n, 0.55 * nara(300, 380, 170), 0.6 * nara(1690, 1750, 280));
    return (1 - L.dag / 0.6) * (0.04 + 0.96 * n);
  }

  // En figur i världen: fötterna i (x, y), k gånger centimetrarna, dir 1 åt höger och −1 åt vänster; var
  // i gångens varv av hur långt den har gått (x), så att foten i marken står still. spegel: upp och ned i den
  // våta stenen, svagt.
  function ritaFigur(c, f, D, x, y, t, L, ut) {
    const P = f.sta ? STAR : stalln((f.dir * x) / (GANG.S * f.k) + (f.gfas || 0));
    c.save();
    c.translate(x, y);
    if (ut.spegel) {
      c.scale(f.dir * f.k, -f.k * 0.85);
      ritaDelar(c, D, P, ut.spegel, 0, true);
      c.restore();
      return;
    }
    c.scale(f.dir * f.k, f.k);
    c.globalAlpha = 0.26 * ut.A;
    c.fillStyle = '#000';
    c.beginPath();
    c.ellipse(f.sta ? 0 : 8, 1, f.sta ? 22 : 28, 3.6, 0, 0, 2 * Math.PI);
    c.fill();
    const r = ut.rand;
    if (r > 0.03) {
      c.lineJoin = 'round';
      c.lineCap = 'round';
      c.strokeStyle = '#ffc98a';
      c.save();
      c.translate(0, -1.4);
      c.globalAlpha = 0.34 * r * ut.A;
      ritaDelar(c, D, P, 1, 2.4);
      c.restore();
    }
    ritaDelar(c, D, P, ut.A, 0);
    c.restore();
  }

  // Hur många som går förbi och hur de är klädda: som på gatan inifrån (RumUte.trafik), färre i ösregn
  // och kyla, nästan ingen mitt i natten. Var och en går fram och tillbaka över hela bilden med en lång
  // paus utanför den, på sitt avstånd från fasaden (fötterna där, och lika mycket större).
  const kladsel = (v) => (v.kanns < 3 ? ['#1c1f26', '#2b2f38', '#3a3226', '#4a4238', '#20283a', '#5a2a2a', '#6b6458', '#2e3a2e']
    : v.kanns < 15 ? ['#3d4a5c', '#6b5a44', '#7a7a70', '#2f3d36', '#8a5a3a', '#2a3550', '#c8b89a', '#4a4a50']
      : ['#e8e4dc', '#c8d8e8', '#d84a3a', '#3a6ab0', '#f0c040', '#2e2e30', '#7ab07a', '#f3ead9']);
  function folket(V, v, L) {
    const T = U().trafik.nu(v);
    const R = rng(v.ar * 389 + v.manad * 37 + v.dag * 3 + (v.timme >> 1) + 11);
    const n = Math.max(1, Math.min(4, Math.round(T.gaende / 2)));
    const regn = v.fall === 'regn' || v.fall === 'blandat';
    const kalla = v.kanns < 3;
    const C = kladsel(v);
    const ut = [];
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
        droppar: regn,
      };
      o.arm = o.rock;
      // (huvudbonaden och håret ur en egen följd, så att var och en går där den gick förut)
      const RH = rng(i * 97 + 5);
      o.hatt = o.mossa ? pick(RH, ['mossa', 'mossa', 'keps', 'hatt']) : RH() < 0.25 ? 'hatt' : null;
      if (o.hatt && !o.mossa) o.mossa = pick(RH, ['#1d1d20', '#3a3026', '#2a2e38']);
      o.langHar = !o.hatt && RH() < 0.4;
      const dir = R() < 0.5 ? 1 : -1;
      // (1,3 m/s; varvet är bilden och en paus)
      const fart = 1.3 * M * skala(dm);
      const vag = V.w + 600;
      const varv = vag / fart + 8 + R() * (T.natt ? 70 : 26);
      const extra = varv * fart - vag;
      const a = V.x - 300;
      const b = V.x + V.w + 300 + extra;
      R();
      ut.push({ D: figurDelar(o, L), k, dir, gfas: (i * 0.618) % 1, dm, y: markY(dm), g: { fran: dir > 0 ? a : b, till: dir > 0 ? b : a, dur: varv, fas: R() * varv } });
    }
    return ut.sort((p, q) => p.dm - q.dm);
  }

  // Någon stannar ibland framför fönstret och tittar in på oss: kommer gående, står en stund med ryggen mot
  // en vid fönstrets vänstra del (där skivan med löpsedlarna hänger, så att gänget syns), och går vidare. Inte
  // varje gång och inte mitt i natten; klädd efter vädret, utan paraply (det skulle skymma skylten).
  const STANNA = { cykel: 170, start: 24, sta: 13, dm: 0.25 };
  function stannar(V, v, L) {
    const T = U().trafik.nu(v);
    if (T.gaende < 2 || v.timme < 7 || v.timme >= 23) return null;
    const k = skala(STANNA.dm) * M / 100;
    const fart = 1.15 * M * skala(STANNA.dm);
    const xs = FON.x + FON.w * 0.11;
    const kalla = v.kanns < 3;
    const C = kladsel(v);
    // (en ny människa varje varv)
    const vem = (n) => {
      const R = rng(n * 131 + v.dag * 7 + v.manad);
      if (R() > 0.6) return null;
      const o = { rock: pick(R, C), byxa: pick(R, ['#1d2230', '#2a2a2e', '#3b4a6a']), sko: pick(R, ['#111', '#3a2a1a']), hud: pick(R, ['#e8c4a0', '#c99a72', '#8a5a3a', '#f0d2b4']), har: pick(R, ['#2a1c12', '#6a4a2a', '#8a8a86', '#c9a46a']), lang: true, mossa: kalla || R() < 0.4 ? pick(R, ['#8a1e1e', '#1f2a44', '#2a2a2a']) : null, halsduk: kalla ? pick(R, ['#c8322a', '#e0c040', '#3a6ab0']) : null };
      o.arm = o.rock;
      o.hatt = o.mossa ? 'mossa' : null;
      const dir = n % 2 ? -1 : 1;
      const xa = dir > 0 ? V.x - 200 : V.x + V.w + 200;
      const xb = dir > 0 ? V.x + V.w + 200 : V.x - 200;
      return { o, dir, xa, xb, D: figurDelar(o, L), B: bakDelar(o, L), k, dm: STANNA.dm, sta: false };
    };
    const minne = new Map();
    return (t) => {
      const n = Math.floor(t / STANNA.cykel);
      if (!minne.has(n)) { minne.clear(); minne.set(n, vem(n)); }
      const f = minne.get(n);
      if (!f) return null;
      let tau = t - n * STANNA.cykel - STANNA.start;
      const tIn = Math.abs(xs - f.xa) / fart;
      const tUt = Math.abs(f.xb - xs) / fart;
      if (tau < 0 || tau > tIn + STANNA.sta + tUt) return null;
      if (tau < tIn) return { f, x: f.xa + f.dir * fart * tau, sta: false };
      tau -= tIn;
      if (tau < STANNA.sta) return { f, x: xs, sta: true };
      return { f, x: xs + f.dir * fart * (tau - STANNA.sta), sta: false };
    };
  }

  // Bilarna på gatan bakom en syns i glaset: på dagen som mörka skuggor som far förbi, på kvällen
  // strålkastarna (och baklyktorna åt andra hållet). Bussarna lika, men längre. Samma bil far över fönstret
  // och dörren (glasen sitter i samma plan).
  function bilarna(v, L, px) {
    const T = U().trafik.nu(v);
    const R = rng(v.ar * 131 + v.manad * 17 + v.dag + (v.timme >> 1) + 5);
    const mork = L.lampor || L.dag < 0.35;
    const n = Math.min(4, T.bilar + 1);
    const yk = FON.y + FON.h * 0.54;
    const hk = FON.h * 0.3;
    const ut = [];
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? -1 : 1;
      const buss = T.bussar && R() < 0.25;
      const w = buss ? 900 : 360;
      const varv = (T.varv[0] + R() * (T.varv[1] - T.varv[0])) * (0.5 + R() * 0.4);
      let bild = null;
      if (!mork) {
        // (kroppen en gång, mjuk: en suddig skugga av en rundad låda)
        const farg = tone(buss ? (R() < 0.5 ? '#b8322a' : '#2a5ab0') : pick(R, ['#16181d', '#e9e8e4', '#9da3aa', '#5a6068', '#1d2b45', '#7a1d1f']), L);
        const m = 40;
        bild = document.createElement('canvas');
        bild.width = Math.max(1, Math.round((w + 2 * m) * px));
        bild.height = Math.max(1, Math.round((hk + 2 * m) * px));
        const g = bild.getContext('2d');
        g.scale(px, px);
        g.fillStyle = farg;
        g.shadowColor = farg;
        g.shadowBlur = LATT ? 0 : 20 * px;
        g.shadowOffsetX = LATT ? 0 : 1e4 * px;
        g.beginPath();
        rund(g, m - (LATT ? 0 : 1e4), m, w, hk, [hk * 0.6, hk * 0.6, hk * 0.2, hk * 0.2]);
        g.fill();
      }
      const fran = dir > 0 ? FON.x - w - 200 : FON.x + FON.w + DORR.w + 300;
      const till = dir > 0 ? FON.x + FON.w + DORR.w + 300 : FON.x - w - 200;
      ut.push({ w, dir, mork, bild, a: LATT ? 0.2 : 0.28, yk, hk, g: { fran, till, dur: varv, fas: R() * varv } });
    }
    return ut;
  }
  function ritaBilar(c, B, t) {
    let syns = false;
    c.save();
    c.beginPath();
    c.rect(FON.x, FON.y, FON.w, FON.h);
    c.rect(DORR.x, DORR.y, DORR.w, DORR.h);
    c.clip();
    for (const b of B) {
      const x = glidX(b.g, t);
      if (x > DORR.x + DORR.w + 100 || x + b.w < FON.x - 100) continue;
      syns = true;
      if (b.bild) {
        c.globalAlpha = b.a;
        c.drawImage(b.bild, x - 40, b.yk - 40, b.w + 80, b.hk + 80);
        continue;
      }
      c.globalAlpha = 1;
      const y = FON.y + FON.h * 0.64;
      const ljus = b.dir > 0 ? [[x + b.w - 40, 85, 'rgba(255,250,232,'], [x + b.w - 140, 85, 'rgba(255,250,232,']] : [[x + 20, 55, 'rgba(255,70,50,'], [x + 110, 55, 'rgba(255,70,50,']];
      for (const [lx, r, f] of ljus) {
        c.save();
        c.translate(lx, y);
        c.scale(1, b.dir > 0 ? 46 / 170 : 34 / 110);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, `${f}${b.dir > 0 ? 0.6 : 0.45})`);
        g.addColorStop(0.5, `${f}${b.dir > 0 ? 0.18 : 0.1})`);
        g.addColorStop(1, `${f}0)`);
        c.fillStyle = g;
        c.fillRect(-r, -r, 2 * r, 2 * r);
        c.restore();
      }
    }
    c.restore();
    return syns;
  }

  // ---------- nederbörden ----------
  //
  // Regnet i två lager (långt bort och nära) och snön i två lager som vajar, i fram: strecken och flingorna
  // läggs ut en gång, och var i fallet de är räknas ur tiden.
  function nederbord(V, v) {
    if (!v.fall) return null;
    const R = rng(5);
    const W = Math.ceil(V.w);
    const H = Math.ceil(V.h);
    const slant = Math.min(0.55, 0.08 + v.vind * 0.035);
    const k = v.mangd;
    const yta = (W * H) / (1600 * 1000);
    const N = { H, W, slant, lager: [] };
    const streck = (n, o, l0, l1, wd, dur) => {
      const s = new Float32Array(n * 5);
      for (let i = 0; i < n; i++) s.set([R() * (W + 400), R() * H, l0 + R() * (l1 - l0), o + R() * 0.14, wd + R() * 1.2], i * 5);
      N.lager.push({ typ: 'regn', s, dur, fjarr: o < 0.05 });
    };
    const flingor = (n, r0, r2, o, dur, sway, svaj, fas) => {
      const s = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) s.set([R() * (W + 300), R() * H, r0 + R() * (r2 - r0), o + R() * 0.35], i * 4);
      N.lager.push({ typ: 'sno', s, dur, sway, svaj, fas });
    };
    if (v.fall === 'regn' || v.fall === 'blandat') {
      const part = (v.fall === 'blandat' ? 0.45 : 1) * yta;
      const dugg = v.slag === 'dugg';
      streck(Math.round((dugg ? 260 : 320) * k * part), 0.04, dugg ? 10 : 30, dugg ? 22 : 70, 1, dugg ? 2 : 1.1);
      streck(Math.round((dugg ? 160 : 380) * k * part), 0.06, dugg ? 14 : 40, dugg ? 30 : 100, 1.4, dugg ? 1.4 : 0.65 - 0.12 * k);
    }
    if (v.fall === 'sno' || v.fall === 'blandat') {
      const part = (v.fall === 'blandat' ? 0.4 : 1) * yta;
      const sway = Math.min(120, 20 + v.vind * 10);
      flingor(Math.round(320 * k * part), 1.6, 3.4, 0.3, 16 - 4 * k, sway, 5, 0);
      flingor(Math.round(200 * k * part), 3.4, 6.4, 0.45, 9 - 3 * k, sway * 1.4, 3.6, 1.4);
    }
    // blixten vid åska: två blixtar i otakt (17 och 29 s)
    N.aska = v.slag === 'aska';
    return N;
  }
  // blixtens styrka efter p (0 … 1 av varvet): som nyckelbilderna förut
  const BLIXT = [[0, 0], [0.9, 0], [0.906, 0.7], [0.912, 0.06], [0.92, 0.5], [0.94, 0], [1, 0]];
  function blixtA(p) {
    for (let i = 1; i < BLIXT.length; i++) {
      const [x1, y1] = BLIXT[i];
      const [x0, y0] = BLIXT[i - 1];
      if (p <= x1) return y0 + ((y1 - y0) * (p - x0)) / (x1 - x0 || 1);
    }
    return 0;
  }
  function ritaNederbord(c, N, V, t) {
    if (!N) return false;
    const { H } = N;
    for (const l of N.lager) {
      const dy = ((((t / l.dur) % 1) + 1) % 1) * H;
      if (l.typ === 'regn') {
        // (tre grupper efter hur starka strecken är, så att det blir få anrop)
        const grupp = [new Path2D(), new Path2D(), new Path2D()];
        const bredd = [0, 0, 0];
        const antal = [0, 0, 0];
        const n = l.s.length / 5;
        for (let i = 0; i < n; i++) {
          const x = l.s[i * 5] + V.x - 200;
          let y = l.s[i * 5 + 1] + dy;
          if (y >= H) y -= H;
          const len = l.s[i * 5 + 2];
          const g = l.fjarr ? (l.s[i * 5 + 3] < 0.09 ? 0 : 1) : l.s[i * 5 + 3] < 0.11 ? 1 : 2;
          bredd[g] += l.s[i * 5 + 4];
          antal[g]++;
          for (const yy of y > H - len ? [y, y - H] : [y]) {
            grupp[g].moveTo(x, V.y + yy);
            grupp[g].lineTo(x - len * N.slant, V.y + yy + len);
          }
        }
        c.strokeStyle = '#c8d6f0';
        c.lineCap = 'butt';
        grupp.forEach((p, g) => {
          c.globalAlpha = (l.fjarr ? 0.8 : 1) * [0.07, 0.12, 0.17][g];
          c.lineWidth = antal[g] ? bredd[g] / antal[g] : 1.4;
          c.stroke(p);
        });
      } else {
        const sx = (-0.5 + pendel(t + l.fas, l.svaj)) * l.sway;
        const grupp = [new Path2D(), new Path2D()];
        const n = l.s.length / 4;
        for (let i = 0; i < n; i++) {
          const x = l.s[i * 4] + V.x - 200 + sx;
          let y = l.s[i * 4 + 1] + dy;
          if (y >= H) y -= H;
          const r = l.s[i * 4 + 2];
          const p = grupp[l.s[i * 4 + 3] < 0.5 ? 0 : 1];
          p.moveTo(x + r, V.y + y);
          p.arc(x, V.y + y, r, 0, 2 * Math.PI);
        }
        c.fillStyle = '#f4f7fb';
        grupp.forEach((p, g) => { c.globalAlpha = [0.4, 0.7][g]; c.fill(p); });
      }
    }
    c.globalAlpha = 1;
    if (N.aska) {
      const a = Math.max(blixtA((t / 17) % 1), blixtA(((t + 11) / 29) % 1));
      if (a > 0.005) {
        c.globalAlpha = a;
        c.fillStyle = '#eef3ff';
        c.fillRect(V.x, V.y, V.w, V.h);
        c.globalAlpha = 1;
      }
    }
    return true;
  }

  // ---------- barberarens stång ----------
  //
  // Stången snurrar: ränderna glider uppåt i en liten egen duk på väggen (B: var i världen), under kvällens
  // mörker så att den är lika mörk som väggen omkring.
  const BARBER = { x: -34, y: 556, w: 46, h: 158 };
  function ritaBarber(c, t) {
    const x = -28;
    const y = 560;
    const w = 34;
    const h = 150;
    c.clearRect(BARBER.x, BARBER.y, BARBER.w, BARBER.h);
    c.save();
    c.beginPath();
    rund(c, x, y, w, h, 17);
    c.clip();
    c.fillStyle = '#f3eee4';
    c.fillRect(x, y, w, h);
    // ränderna: röd, vit, blå, vit, snett, 48 i varvet, ett varv på 3 s
    const tan = Math.tan(35 * DEG);
    const band = 58.6 / 4;
    const y0 = y - 2 * 58.6 + ((((t / 3) % 1) + 1) % 1) * 58.6;
    for (let j = 0; y0 + j * band < y + h; j++) {
      if (j % 2) continue;
      const yy = y0 + j * band;
      c.fillStyle = j % 4 ? '#2a4a9a' : '#c8322a';
      c.beginPath();
      c.moveTo(x, yy + w * tan);
      c.lineTo(x + w, yy);
      c.lineTo(x + w, yy + band);
      c.lineTo(x, yy + band + w * tan);
      c.fill();
    }
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(255,255,255,.35)');
    g.addColorStop(0.3, 'rgba(255,255,255,0)');
    g.addColorStop(0.7, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.restore();
    c.fillStyle = '#222';
    c.beginPath();
    rund(c, x - 6, y, w + 12, 14, 6);
    rund(c, x - 6, y + h - 14, w + 12, 14, 6);
    c.fill();
  }

  // ---------- himlen som rör sig ----------
  //
  // Molnen som driver (bakom huset), fåglarna och fyrverkerierna, i bak: molnen ritas suddiga en gång var
  // (en egen liten bild), fåglarna slår med vingarna.
  function himmelsliv(V, v, L, px) {
    const R = rng(v.ar * 977 + v.manad * 61 + v.dag * 7 + (v.timme >> 2));
    const H = { moln: [], faglar: [], pang: [] };
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
        const blob = [];
        for (let j = 0; j < 5; j++) {
          const bx = (j / 4 - 0.5) * w * 0.7 + (R() - 0.5) * 40;
          blob.push([bx, -(R() * 24) + Math.abs(j - 2) * 9, w * (0.18 + R() * 0.12), 22 + R() * 22, j % 2 ? dark : lit]);
        }
        // (suddigt en gång: skuggan av ovalerna, långt åt sidan, är det som syns)
        const b = document.createElement('canvas');
        const mg = 60;
        b.width = Math.max(1, Math.round((1000 + 2 * mg) * px * 0.5));
        b.height = Math.max(1, Math.round((180 + 2 * mg) * px * 0.5));
        const g = b.getContext('2d');
        const s = px * 0.5;
        g.setTransform(s, 0, 0, s, (500 + mg) * s, (90 + mg) * s);
        g.shadowBlur = 28 * s;
        g.shadowOffsetX = 1e4 * s;
        for (const [bx, by, rx, ry, c] of blob) {
          g.fillStyle = c;
          g.shadowColor = c;
          g.beginPath();
          g.ellipse(bx - 1e4, by, rx, ry, 0, 0, 2 * Math.PI);
          g.fill();
        }
        H.moln.push({ bild: b, y, a: 0.55 + 0.35 * m, mg, g: { fran, till: till + 500, dur, fas: R() * dur } });
      }
    }
    // måsar och kråkor på dagen
    if (L.dag > 0.4 && (!v.fall || v.mangd < 0.5) && till > HORN) {
      const krakor = v.arstid === 'vinter';
      for (let i = 0; i < 2; i++) {
        const dur = 30 + R() * 40;
        const dir = R() < 0.5 ? 1 : -1;
        const col = krakor ? '#15151a' : mix('#6b6f76', '#f2f2ee', L.dag);
        const flock = [];
        const k = 1 + ((R() * 3) | 0);
        for (let j = 0; j < k; j++) flock.push([j * 40 + R() * 16, (R() - 0.5) * 30, 0.5 + R() * 0.4]);
        const a = fran - 200;
        const b = till + 1200;
        const y = V.y + Math.max(40, HOR - 520 - V.y + R() * 260) + 24;
        H.faglar.push({ col, flock, y, g: { fran: dir > 0 ? a : b, till: dir > 0 ? b : a, dur, fas: R() * dur } });
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
        const rays = [];
        for (let j = 0; j < 14; j++) rays.push(j / 14 * 2 * Math.PI + R() * 0.2);
        const dur = (v.nyar ? 2.6 : 9) + R() * 4;
        H.pang.push({ c, x, y, rr, rays, dur, fas: R() * dur });
      }
    }
    return H.moln.length || H.faglar.length || H.pang.length ? H : null;
  }
  const PANG = [[0, 0, 0.15, 0], [0.03, 1, 0.24, 0], [0.28, 0.9, 1, 0], [0.48, 0, 1.08, 8], [1, 0, 1.08, 8]];
  function ritaHimmel(c, H, V, t) {
    let fort = false;
    for (const m of H.moln) {
      const x = glidX(m.g, t);
      c.globalAlpha = m.a;
      c.drawImage(m.bild, x - 500 - m.mg, m.y - 90 - m.mg, 1000 + 2 * m.mg, 180 + 2 * m.mg);
    }
    c.globalAlpha = 1;
    c.lineCap = 'round';
    c.lineWidth = 3;
    for (const f of H.faglar) {
      const x0 = glidX(f.g, t);
      if (x0 > V.x + V.w + 40 || x0 + 160 < V.x) continue;
      fort = true;
      c.strokeStyle = f.col;
      for (const [bx, by, d] of f.flock) {
        const s = 1 - 1.6 * pendel(t, d);
        c.save();
        c.translate(x0 + 20 + bx, f.y + by);
        c.scale(1, s);
        c.beginPath();
        c.moveTo(-14, 0);
        c.quadraticCurveTo(-7, -7, 0, 0);
        c.quadraticCurveTo(7, -7, 14, 0);
        c.stroke();
        c.restore();
      }
    }
    for (const p of H.pang) {
      const q = ((((t + p.fas) / p.dur) % 1) + 1) % 1;
      let i = 1;
      while (i < PANG.length - 1 && q > PANG[i][0]) i++;
      const [x0, a0, s0, y0] = PANG[i - 1];
      const [x1, a1, s1, y1] = PANG[i];
      const u = (q - x0) / (x1 - x0 || 1);
      const a = a0 + (a1 - a0) * u;
      if (a < 0.01) continue;
      fort = true;
      const s = s0 + (s1 - s0) * u;
      c.save();
      c.globalAlpha = a;
      c.translate(p.x, p.y + y0 + (y1 - y0) * u);
      c.scale(s, s);
      c.strokeStyle = p.c;
      c.fillStyle = p.c;
      c.lineWidth = 2.6;
      c.beginPath();
      for (const an of p.rays) {
        c.moveTo(Math.cos(an) * p.rr * 0.25, Math.sin(an) * p.rr * 0.25);
        c.lineTo(Math.cos(an) * p.rr, Math.sin(an) * p.rr + 4);
      }
      c.stroke();
      c.beginPath();
      for (const an of p.rays) { c.moveTo(Math.cos(an) * p.rr + 2, Math.sin(an) * p.rr + 6); c.arc(Math.cos(an) * p.rr, Math.sin(an) * p.rr + 6, 2, 0, 2 * Math.PI); }
      c.fill();
      c.globalAlpha = a * 0.8;
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(0, 0, 8, 0, 2 * Math.PI);
      c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
    return fort;
  }

  // Det framför, en bild: speglingarna av dem som går i den våta stenen (tonade nedåt), bilarna i glaset,
  // de som går och den som har stannat, regnet, snön och blixten. Syns inget som rör sig töms duken en gång.
  function ritaFram(R, t) {
    const { V, L } = R;
    const c = R.fram;
    const lista = [];
    for (const f of R.folk) {
      const x = glidX(f.g, t);
      if (x > V.x - 220 && x < V.x + V.w + 220) lista.push([f, f.D, x, f.y]);
    }
    const st = R.stanna && R.stanna(t);
    if (st) lista.unshift([{ k: st.f.k, dir: st.sta ? 1 : st.f.dir, sta: st.sta }, st.sta ? st.f.B : st.f.D, st.x, markY(STANNA.dm)]);
    const bilar = R.bilar.some((b) => { const x = glidX(b.g, t); return x < DORR.x + DORR.w + 100 && x + b.w > FON.x - 100; });
    if (!lista.length && !bilar && !R.N && R.tom) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    R.tom = !lista.length && !bilar && !R.N;
    if (R.tom) return;
    c.setTransform(R.px, 0, 0, R.px, -V.x * R.px, -V.y * R.px);
    if (R.vat && lista.length) {
      for (const [f, D, x, y] of lista) ritaFigur(c, f, D, x, y, t, L, { spegel: R.spegelA });
      c.save();
      c.globalCompositeOperation = 'destination-out';
      const g = c.createLinearGradient(0, MARK, 0, MARK + 260);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = g;
      c.fillRect(V.x, MARK, V.w, V.y + V.h - MARK);
      c.restore();
    }
    if (bilar) ritaBilar(c, R.bilar, t);
    for (const [f, D, x, y] of lista) ritaFigur(c, f, D, x, y, t, L, { A: R.A, rand: randLjus(x, L) });
    // (i dimma: samma dis över dem som över allt bakom, bara där något är ritat)
    if (R.dimma) {
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = R.dimma.a;
      c.fillStyle = R.dimma.c;
      c.fillRect(V.x, V.y, V.w, V.h);
      c.restore();
    }
    ritaNederbord(c, R.N, V, t);
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
    const F = { V: null, sig: '', duk: null, raf: 0, sist: 0, neon: null, klar: false, ro: null };
    const calm = () => Boolean(o.calm && o.calm());
    // (dukarnas bildpunkter per enhet i världen: skärmens, högst två miljoner bildpunkter på hela fönstret)
    const tathet = (V) => {
      const W = el.clientWidth || innerWidth;
      const H = el.clientHeight || innerHeight;
      return Math.max(W / V.w, H / V.h) * Math.min(2, devicePixelRatio || 1, Math.sqrt(2e6 / (W * H)));
    };
    const duk = (cls, r, px) => `<canvas class="${cls}" width="${Math.max(1, Math.round(r.w * px))}" height="${Math.max(1, Math.round(r.h * px))}" style="left:${r1(r.x - F.V.x)}px; top:${r1(r.y - F.V.y)}px; width:${r1(r.w)}px; height:${r1(r.h)}px"></canvas>`;

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
      const defs = `<defs><filter id="rf-mjuk" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="rf-neon-b" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
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
      // det som rör sig: vad, var och hur (inget med prefers-reduced-motion, utom stången som står still)
      const px = tathet(V);
      const lugn = calm();
      const bakX = Math.max(V.x, HORN - 520);
      const bakR = { x: bakX, y: V.y, w: V.x + V.w - bakX, h: HOR + 60 - V.y };
      const himlen = !lugn && bakR.w > 0 ? himmelsliv(V, v, L, px) : null;
      const barberR = BARBER.x + BARBER.w > V.x && BARBER.x < V.x + V.w ? BARBER : null;
      const R = {
        px, V, L, bakR, himlen,
        folk: lugn ? [] : folket(V, v, L),
        stanna: lugn ? null : stannar(V, v, L),
        bilar: lugn ? [] : bilarna(v, L, px),
        N: lugn ? null : nederbord(V, v),
        vat: (L.wet || v.blott) && !v.snotackt,
        A: 1,
        dimma: L.dimma > 0.05 ? { c: mix('#2a2622', '#aeb3b6', L.dag), a: 0.32 * L.dimma } : null,
        spegelA: 0.14 + 0.1 * (1 - L.dag),
        tom: false,
      };
      scen.style.width = `${V.w}px`;
      scen.style.height = `${V.h}px`;
      scen.innerHTML =
        svg(V, defs + himmel(V, v, L)) +
        (himlen ? duk('rf-bak', bakR, px) : '') +
        svg(V, bortom(V, v, L)) +
        svg(V, defs + rummet(v, L, o), 'rf-inne') +
        `<canvas class="rf-gang" width="${dw}" height="${dh}" style="left:${glasX}px; top:${glasY}px; width:${FON.w}px; height:${FON.h}px"></canvas>` +
        svg(V, defs + iFonstret(v, L, o)) +
        svg(V, defs + neonSkylt(), 'rf-neonlager') +
        svg(V, defs + glaset(v, L, o)) +
        svg(V, `${defs}<g clip-path="url(#rf-hal)">${huset(V, v, L, o)}</g>${bron(V, v, L)}${marken(V, v, L)}`) +
        svg(V, texten(v, L), 'rf-text') +
        (barberR ? duk('rf-barber', barberR, px) : '') +
        svg(V, kvallsljus(V, v, L, o), 'rf-kvall') +
        (L.dimma > 0.05 ? `<div class="rf-lager rf-dimma" style="background:${mix('#2a2622', '#aeb3b6', L.dag)}; opacity:${r1(0.32 * L.dimma)}"></div>` : '') +
        duk('rf-fram', V, px);
      F.duk = scen.querySelector('.rf-gang');
      R.fram = scen.querySelector('.rf-fram').getContext('2d');
      R.bak = himlen ? scen.querySelector('.rf-bak').getContext('2d') : null;
      R.barber = barberR ? scen.querySelector('.rf-barber').getContext('2d') : null;
      F.ro = R;
      // (en fast bild: allt som rör sig står på samma tid)
      if (o.still != null) for (const an of el.getAnimations({ subtree: true })) { an.pause(); an.currentTime = o.still * 1000; }
      // (gänget från förra gången tills det ritas på nytt)
      if (gammal && gammal.width) F.duk.getContext('2d').drawImage(gammal, 0, 0, F.duk.width, F.duk.height);
      F.neon = null;
      passa();
      gang(true);
      rorelse(true);
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
    // Det som rör sig, i sin takt: det framför och himlen när något fort syns högst TAKT gånger i sekunden,
    // molnen ensamma 8 och stången 15; nu: genast (allt har ritats om). En fast bild på o.still.
    function rorelse(nu = false) {
      const R = F.ro;
      if (!R) return;
      const ms = performance.now();
      const t = o.still != null ? o.still : ms / 1000;
      const dags = (sist, fps) => nu || ms - (sist || 0) >= 1000 / fps - 4;
      if (dags(R.sFram, TAKT)) {
        R.sFram = ms;
        ritaFram(R, t);
      }
      if (R.bak && dags(R.sBak, R.fort ? TAKT : 8)) {
        R.sBak = ms;
        const c = R.bak;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);
        c.setTransform(R.px, 0, 0, R.px, -R.bakR.x * R.px, -R.bakR.y * R.px);
        R.fort = ritaHimmel(c, R.himlen, R.V, t);
      }
      if (R.barber && dags(R.sBarber, 15)) {
        R.sBarber = ms;
        const c = R.barber;
        c.setTransform(R.px, 0, 0, R.px, -BARBER.x * R.px, -BARBER.y * R.px);
        ritaBarber(c, calm() ? 0 : t);
      }
    }
    function loop() {
      cancelAnimationFrame(F.raf);
      if (calm() || o.still != null) return;
      const tick = () => {
        if (!el.isConnected) return;
        gang(false);
        rorelse();
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
