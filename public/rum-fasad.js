'use strict';

// ---------- fasaden: tobaksaffären utifrån ----------
//
// Ett klick på namnet på dörren (rum.js) och man står ute på trottoaren och ser affären utifrån, där
// baren Bron ligger vid S:t Eriksbron: det laxrosa huset med den ljusa bottenvåningen, skylten
// MATCHFIXARNA över skyltfönstret och dörren, och till höger brons gröna räcke med stan på andra sidan.
// Det är samma klocka, ljus och väder som genom fönstret inifrån (Vader.nu, RumUte.light och
// RumUte.farg i rum-ute.js) och samma trafik (RumUte.trafik): himlen, molnen, regnet och snön, de som går
// förbi, lyktorna som tänds och bilarna och bussarna som kör förbi på gatan mellan en själv och affären
// (rum-fasad-gatan.js) och syns som speglingar i glaset.
//
// Genom skyltfönstret syns rummet, vagt: gänget vid barbordet bakifrån, ritat i 3D av samma scen som
// inne, i gängets egen duk som rummet lånar ut till fönstret (glas, utifran i rum-3d.js), med neonskylten Tobak, som läses rätt härifrån, skivan med
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
//   RumFasad.bygg(rum, o) → { el, ny(), ut(), glas(duk) } bygger fasaden i rum (.rum) och ritar den; glas(duk)
//     ställer gängets duk (rum-3d.js) i skyltfönstret, glas(null) tar bort den igen (rum.js ställer tillbaka den);
//     o.gang({ w, h }) ritar gänget i den duken med w × h bildpunkter (false utan), o.takt() hur många gånger i sekunden (som inne),
//     o.neon() neonen tänd just nu, o.natt() 0…1 hur släckt lysröret är, o.pynt(namn, { w, h, dag }) högtidspyntet
//     i fönstret ('pyntF') eller på dörren ('pyntP') sett utifrån, en duk w × h eller null (pyntUtifran i
//     rum-inredning.js), o.calm() utan rörelser
//     (prefers-reduced-motion), o.still en fast bild på den tiden (s, ?rum-t i rum.js): allt som rör sig
//     står där det är då

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
  // (också korta färger som #222: utan det blev blandningen ogiltig, och delen fick färgen före sig)
  const rgb = (c) => (c.length === 4 ? [1, 2, 3].map((i) => parseInt(c[i] + c[i], 16)) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
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
  // stupröret: mellan fönstren på våningarna, så att det syns också i en telefon
  const STUPROR = 1180;
  // gatuskylten: på väggen mellan gesimsen och skyltens tak, mellan den högra svanhalsen (och dess skugga) och
  // stupröret (inte bakom röret), högerkanten i linje med skyltens tak, så att den syns hel också i en telefon
  const GATSKYLT = { x: 1012, y: 252, w: 144, h: 30, fs: 17 };
  const RACKE = MARK - 1.1 * M;
  // det som alltid ska synas, och världens kanter
  const FOKUS = { x0: 380, x1: 1180, y0: 270, y1: 960 };
  const VARLD = { x0: -900, x1: 2900, y0: -1100, y1: 1400 };
  // en punkt på marken d meter ut från fasaden: dess höjd i bilden och skalan där
  const markY = (d) => HOR + (MARK - HOR) * AVST / (AVST - d);
  const skala = (d) => AVST / (AVST - d);

  // Den del av världen som syns i ett fönster med formen a (bredd / höjd).
  function vy(a) {
    const minW = FOKUS.x1 - FOKUS.x0 + 70;
    let h = Math.max(940, minW / a);
    // (mer höjd: två tredjedelar uppåt, fler våningar, och resten trottoar)
    const extra = h - 940;
    let y = Math.max(VARLD.y0, 40 - extra * 0.66);
    // (och gatan ut till den närmre filen, rum-fasad-gatan.js: det som fattas nertill i ett brett fönster tas hälften
    // genom att visa mer och hälften från överkanten)
    const brist = GATA() ? markY(GATA().SYNS) - (y + h) : 0;
    if (brist > 0) {
      h += brist / 2;
      y += brist / 2;
    }
    const w = h * a;
    let x = 860 - w / 2;
    x = Math.max(FOKUS.x1 + 35 - w, Math.min(FOKUS.x0 - 35, x));
    x = Math.max(VARLD.x0, Math.min(VARLD.x1 - w, x));
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
  // Det som syns bakom gänget: rummet i taklampornas ljus (och på natten neonens och tv:ns), lite ur skärpa –
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
      // taket och takfläkten över gängets bord (släckt på natten): mörka blad och fyra kupor under (förut ett
      // lysrör; spotskenan närmast glaset togs bort samma kväll som den kom, 2026-11-16)
      s += `<rect x="${X}" y="${Y}" width="${W}" height="${r1(H * 0.11)}" fill="${tak}"/>`;
      if (hela) {
        const lampa = mix('#3a3a36', '#fff1d6', ljus);
        const fx = X + W * 0.48;
        const fy = Y + H * 0.065;
        s += `<path d="M${r1(fx - W * 0.16)} ${r1(fy)} L${r1(fx + W * 0.16)} ${r1(fy + 3)}" stroke="#24160c" stroke-width="5" stroke-linecap="round"/>`;
        for (const k of [-0.045, -0.015, 0.015, 0.045]) s += `<ellipse cx="${r1(fx + W * k)}" cy="${r1(fy + 13)}" rx="7" ry="5" fill="${lampa}"/>`;
        if (ljus > 0.3) s += `<ellipse cx="${r1(fx)}" cy="${r1(fy + 16)}" rx="${r1(W * 0.34)}" ry="${r1(H * 0.2)}" fill="url(#rf-g-vit)" opacity="${r1(0.6 * ljus)}"/>`;
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
  // ett rinnmärke på putsen, smalare nedåt (toningen rf-rinn står i huset)
  const rinn = (x, y, w, h) => `<path d="M${r1(x - w / 2)} ${y} Q${r1(x - w * 0.3)} ${r1(y + h * 0.6)} ${r1(x - w * 0.08)} ${r1(y + h)} L${r1(x + w * 0.1)} ${r1(y + h * 0.9)} Q${r1(x + w * 0.3)} ${r1(y + h * 0.5)} ${r1(x + w / 2)} ${y} Z" fill="url(#rf-rinn)"/>`;
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
    // Grannarna: i några tända fönster sitter någon vid fönstret eller en katt bakom räcket, som siluetter mot
    // ljuset inne, på kvällen (en egen följd per fönster och dag, så att det inte ändrar vilka som är tända)
    const RG = rng(Math.round(cx * 7 - yb * 3) + v.dag * 131 + v.manad * 17 + 7);
    const vem = RG();
    const sil = tand && L.dag < 0.5 ? r1(0.82 * (1 - L.dag * 2)) : 0;
    if (sil && vem < 0.3) {
      const hx = r1(cx + (RG() - 0.5) * 90);
      const hy = yb - 102;
      s += `<path d="M${hx - 46} ${yb} V${hy + 62} Q${hx - 44} ${hy + 36} ${hx - 18} ${hy + 32} Q${hx - 24} ${hy + 20} ${hx - 22} ${hy + 4} Q${hx - 18} ${hy - 22} ${hx} ${hy - 22} Q${hx + 19} ${hy - 22} ${hx + 21} ${hy + 2} Q${hx + 22} ${hy + 20} ${hx + 15} ${hy + 32} Q${hx + 44} ${hy + 38} ${hx + 48} ${hy + 64} V${yb} Z" fill="#160f0a" opacity="${sil}"/>`;
    } else if (sil && vem < 0.45) {
      const kx = r1(cx + (RG() - 0.5) * 120);
      const ky = yb - 2;
      s += `<g fill="#0b0908" stroke="#0b0908" opacity="${sil}"><path d="M${kx - 20} ${ky} Q${kx - 24} ${ky - 30} ${kx - 10} ${ky - 40} L${kx - 12} ${ky - 54} L${kx - 3} ${ky - 46} Q${kx + 2} ${ky - 48} ${kx + 6} ${ky - 46} L${kx + 12} ${ky - 55} L${kx + 12} ${ky - 40} Q${kx + 24} ${ky - 28} ${kx + 20} ${ky} Z" stroke="none"/><path d="M${kx + 18} ${ky - 2} Q${kx + 46} ${ky - 2} ${kx + 42} ${ky - 28}" fill="none" stroke-width="5" stroke-linecap="round"/></g>`;
    }
    // bågarna: mittpost, tvärpost och spröjs
    const fr = mix('#2a2622', mix('#f4efe4', '#a6abb2', 0.25 * L.m), L.dag);
    const tv = y + h * 0.32;
    s += `<g stroke="${fr}" fill="none"><rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" stroke-width="8"/><path d="M${cx} ${y} V${y + h} M${x} ${r1(tv)} H${x + w}" stroke-width="8"/><path d="M${x} ${r1(tv + (y + h - tv) / 2)} H${x + w}" stroke-width="4"/></g>`;
    // blecket, och snön på det
    s += `<rect x="${x - 26}" y="${yb}" width="${w + 52}" height="12" fill="${mix('#141418', '#d4cfc4', L.dag * (1 - 0.3 * L.m))}"/>`;
    // regnet har runnit av blecket i åratal: mörka märken under ändarna och några under mitten
    s += rinn(x - 22, yb + 12, 12 + RG() * 10, 90 + RG() * 120) + rinn(x + w + 22, yb + 12, 12 + RG() * 10, 90 + RG() * 120) + rinn(x + 20 + RG() * (w - 40), yb + 12, 6 + RG() * 8, 40 + RG() * 80);
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
    // Putsen har levt: stora mjuka fläckar, mörkare och ljusare, och fukten nertill där regnet stänker upp
    // (mörkare när stenen är våt). Allt står still och ritas med resten av huset.
    s += '<defs><radialGradient id="rf-flack"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><radialGradient id="rf-flack-l"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rf-rinn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".35" stop-color="#000" stop-opacity=".09"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rf-fukt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000"/></linearGradient></defs>';
    const RP = rng(61);
    let fl = '';
    for (let i = 0; i < 44; i++) {
      const fx = r1(VARLD.x0 + 200 + RP() * (HORN - VARLD.x0 - 200));
      const fy = r1(VARLD.y0 + 300 + RP() * (MARK - VARLD.y0 - 300));
      const ljusF = RP() < 0.3;
      fl += `<ellipse cx="${fx}" cy="${fy}" rx="${r1(60 + RP() * 150)}" ry="${r1(40 + RP() * 110)}" fill="url(#rf-flack${ljusF ? '-l' : ''})" opacity="${r1((ljusF ? 0.05 : 0.08) + RP() * 0.06)}"/>`;
    }
    s += fl;
    const vat = (L.wet || v.blott) && !v.snotackt;
    s += `<rect x="${VARLD.x0}" y="${MARK - 110}" width="${HORN - VARLD.x0}" height="110" fill="url(#rf-fukt)" opacity="${vat ? 0.32 : 0.14}"/>`;
    // gesimsen mellan bottenvåningen och våningarna ovanför
    s += `<rect x="${VARLD.x0}" y="214" width="${HORN - VARLD.x0 + 10}" height="22" fill="${list}"/><rect x="${VARLD.x0}" y="236" width="${HORN - VARLD.x0}" height="12" fill="${mix(ljusPuts, '#000000', 0.25)}" opacity=".6"/>`;
    if (sno) s += `<path d="M${VARLD.x0} 216 H${HORN + 10}" stroke="${sno}" stroke-width="7" stroke-linecap="round"/>`;
    let rg = '';
    for (let x = VARLD.x0 + 20; x < HORN; x += 110 + RP() * 200) rg += rinn(x, 248, 6 + RP() * 10, 40 + RP() * 110);
    s += rg;
    // fönstren på våningarna ovanför (de syns i höga fönster)
    const RW = rng(23);
    for (const [yb, bal] of [[178, [-60, 690]], [-302, [330]], [-782, []]]) {
      for (const cx of [-420, -60, 330, 690, 1050]) s += fonster(v, L, cx, yb, RW, bal.includes(cx));
    }
    // hörnets kedjestenar
    let kedja = '';
    for (let y = VARLD.y0; y < 214; y += 64) kedja += `<rect x="${HORN - 52}" y="${y}" width="${(y / 64) % 2 ? 52 : 40}" height="58" fill="${list}"/>`;
    s += kedja + `<rect x="${HORN - 4}" y="${VARLD.y0}" width="4" height="${MARK - VARLD.y0}" fill="#000" opacity=".25"/>`;
    // sockeln, med en glans i överkanten när den är våt
    s += `<rect x="${VARLD.x0}" y="${MARK - 34}" width="${HORN - VARLD.x0}" height="34" fill="${granit}"/>`;
    if (vat) s += `<rect x="${VARLD.x0}" y="${MARK - 34}" width="${HORN - VARLD.x0}" height="2" fill="${mix('#ffffff', '#ffe2b0', 1 - L.dag)}" opacity="${r1(0.12 + 0.08 * (1 - L.dag))}"/>`;
    // Stupröret mellan fönstren, bredvid gatuskylten: fästen, en böj nertill och vatten som forsar ut när det
    // regnar (bäcken över trottoaren står i marken)
    const ror = mix('#0e0f0f', '#5b605c', L.dag);
    const rx = STUPROR;
    s += `<rect x="${rx - 7}" y="${VARLD.y0}" width="14" height="${MARK - 54 - VARLD.y0}" fill="${ror}"/><rect x="${rx - 7}" y="${VARLD.y0}" width="3" height="${MARK - 54 - VARLD.y0}" fill="${mix(ror, L.dag > 0.5 ? '#ffffff' : '#ffd9a0', 0.18)}"/>`;
    let fasten = '';
    for (let y = VARLD.y0 + 100; y < MARK - 60; y += 170) fasten += `<rect x="${rx - 10}" y="${y}" width="20" height="7" fill="${mix(ror, '#000000', 0.35)}"/>`;
    s += fasten + `<path d="M${rx - 7} ${MARK - 54} Q${rx - 7} ${MARK - 30} ${rx + 10} ${MARK - 22} L${rx + 18} ${MARK - 34} Q${rx + 7} ${MARK - 40} ${rx + 7} ${MARK - 54} Z" fill="${ror}"/><ellipse cx="${rx + 15}" cy="${MARK - 27}" rx="5" ry="8" transform="rotate(-35 ${rx + 15} ${MARK - 27})" fill="#060606"/>`;
    if (v.fall === 'regn' || v.fall === 'blandat') s += `<g stroke="${L.dag > 0.5 ? '#e6eef8' : '#ffe8cc'}" stroke-linecap="round" fill="none"><path d="M${rx + 16} ${MARK - 26} q8 8 10 30" stroke-width="5" opacity=".3"/><path d="M${rx + 14} ${MARK - 24} q6 8 6 28" stroke-width="2" opacity=".5"/><path d="M${rx + 19} ${MARK - 26} q10 6 14 26" stroke-width="1.4" opacity=".4"/></g>`;

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
    // gatuskylten vid hörnet, fastskruvad på väggen bredvid stupröret
    // (på kvällen i sken av lampan bredvid: emaljen lyser upp, så att namnet går att läsa)
    const lyst = L.lampor ? 1 - L.dag : 0;
    const bla = mix(mix('#0a1020', '#1f4a8a', 0.2 + 0.8 * L.dag), '#2c4a7e', 0.6 * lyst);
    const vit = mix(mix('#3a3e48', '#f2f2ee', L.dag), '#d8d0bc', 0.7 * lyst);
    const gs = GATSKYLT;
    const gsMitt = gs.y + gs.h / 2;
    s += `<rect x="${gs.x}" y="${gs.y}" width="${gs.w}" height="${gs.h}" rx="3" fill="${bla}"/><rect x="${gs.x + 4}" y="${gs.y + 4}" width="${gs.w - 8}" height="${gs.h - 8}" rx="2" fill="none" stroke="${vit}" stroke-opacity="${r1(1 - 0.4 * lyst)}" stroke-width="1.6"/><text x="${gs.x + gs.w / 2}" y="${r1(gsMitt + 0.42 * gs.fs)}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="${gs.fs}" fill="${vit}">S:t Eriksgatan</text>`;
    s += `<g fill="${mix(bla, vit, 0.55)}">${[gs.x + 8.5, gs.x + gs.w - 8.5].map((x) => `<circle cx="${x}" cy="${gsMitt}" r="1.5"/>`).join('')}</g>`;

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
    s += [0.12, 0.31, 0.47, 0.66, 0.84].map((f, i) => rinn(FON.x + FON.w * f, FON.y + FON.h + k + 10, 10, 60 + ((i * 37) % 40))).join('');
    // källarfönstret med galler, nere i bröstningen
    const kx = FON.x + 70;
    const ky = MARK - 62;
    s += `<rect x="${kx - 8}" y="${ky - 8}" width="156" height="58" fill="${mix(morkt, '#ffffff', 0.06)}"/><rect x="${kx}" y="${ky}" width="140" height="44" fill="#060606"/>`;
    s += `<g stroke="${mix('#141312', '#5a5650', L.dag)}" stroke-width="5">${[1, 2, 3, 4, 5, 6].map((i) => `<path d="M${kx + i * 20} ${ky} V${ky + 44}"/>`).join('')}<path d="M${kx} ${ky + 22} H${kx + 140}"/></g>`;
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
    // öppettiderna i guld nertill på dörrens glas, och klistermärkena i fönstrets nedre hörn: korten, tipset och
    // travet, lite blekta (med ljuset inne bakom sig på kvällen)
    const yt = d.y + d.h - 118;
    s += `<g font-family="Fraunces, Georgia, serif" text-anchor="middle" fill="#d8b46a" stroke="#3a2808" stroke-width=".25" paint-order="stroke" opacity=".9"><text x="${cx}" y="${yt}" font-size="7.6" font-weight="700" letter-spacing="1.4">ÖPPETTIDER</text><text x="${cx}" y="${yt + 12}" font-size="7.4" font-style="italic">Vardagar 7–22</text><text x="${cx}" y="${yt + 23}" font-size="7.4" font-style="italic">Lördag 9–22</text><text x="${cx}" y="${yt + 34}" font-size="7.4" font-style="italic">Söndag 10–21</text></g>`;
    let mx = FON.x + 8;
    const my = FON.y + FON.h - 30;
    let mk = '';
    for (const [bg, fg, txt] of [['#1a3a8a', '#f0c040', 'VISA'], ['#c8322a', '#f4eee0', 'EUROCARD'], ['#1f6a3a', '#f4eee0', 'TIPS · LOTTO'], ['#e8c440', '#1a1a1a', 'TRAV']]) {
      const w = r1(10 + txt.length * 5.2);
      mk += `<rect x="${r1(mx)}" y="${my}" width="${w}" height="22" rx="2" fill="${mix(bg, '#f4eee0', 0.18)}"/><text x="${r1(mx + w / 2)}" y="${my + 14.5}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="8.4" fill="${fg}">${txt}</text>`;
      mx += w + 5;
    }
    s += `<g opacity="${r1(0.42 + 0.3 * L.dag)}">${mk}</g>`;
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
      // stupröret står ut från väggen och kastar en smal skugga; gatuskylten ligger an och kastar nästan ingen
      const gs = GATSKYLT;
      sh += `<rect x="${STUPROR + 7}" y="${VARLD.y0}" width="5" height="${MARK - 54 - VARLD.y0}" fill="#000" opacity=".4"/>`;
      sh += `<path fill-rule="evenodd" d="M${gs.x + 2} ${gs.y + 3} h${gs.w} v${gs.h} h${-gs.w} Z M${gs.x} ${gs.y} h${gs.w} v${gs.h} h${-gs.w} Z" fill="#000" opacity=".5"/>`;
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
    if (L.lampor) hal.push([GATSKYLT.x + GATSKYLT.w / 2, GATSKYLT.y + GATSKYLT.h / 2, 120, 48]);
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
    // bäcken från stupröret ut över trottoaren mot gatan, när det regnar
    if (vat && !sno && (v.fall === 'regn' || v.fall === 'blandat')) {
      let b = '';
      for (let i = 0; i <= 30; i++) {
        // (ned i rännstenen vid trottoarkanten, rum-fasad-gatan.js)
        const dd = 0.06 + (i / 30) * (GATA() ? GATA().KANT + 0.06 : 4);
        const xw = STUPROR + 22 + Math.sin(i * 0.7) * 10 + i * 4;
        b += `${i ? 'L' : 'M'}${r1(OGA_X + (xw - OGA_X) * skala(dd))} ${r1(markY(dd))}`;
      }
      // (en bred mörkare rand där stenen är blötare, och glitter här och där där vattnet rinner)
      s += `<path d="${b}" stroke="#000" stroke-width="22" fill="none" opacity=".1" stroke-linecap="round"/><path d="${b}" stroke="#000" stroke-width="9" fill="none" opacity=".1" stroke-linecap="round"/><path d="${b}" stroke="${L.dag > 0.5 ? '#ffffff' : '#ffe6c0'}" stroke-width="1.6" stroke-dasharray="10 14 4 22 7 18" fill="none" opacity="${r1(0.18 + 0.16 * (1 - L.dag))}" stroke-linecap="round"/>`;
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
  // stenen, någon som ibland stannar och tittar in, löven, duvorna och andedräkten (rum-fasad-liv.js), regnet, snön
  // och blixten; bakom huset (bak), där himlen
  // syns, molnen, fåglarna och fyrverkerierna; och barberarens stång i en liten egen duk på väggen. Förut var
  // det ett trettiotal CSS-animeringar, var och en i ett eget lager, och ett tiotal skärmytor lades ihop 60
  // gånger i sekunden.
  const TAKT = LATT ? 24 : 30;
  // (medan en bil eller buss syns: de kör fort, och i 30 bilder i sekunden hoppar de på en stor skärm)
  const TAKT_GATA = LATT ? 30 : 60;
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
  // De som går förbi går som folk, och var och en på sitt sätt. Foten som står på marken står still mot
  // trottoaren medan kroppen går fram (hälen slår i, foten rullar över till tån och lyfts), höften gungar upp och
  // ner en gång per steg och knät ger efter lite när hälen tar emot. Benet som förs fram följer vinklarna i en
  // människas gång: låret svänger fram tidigt och knät böjs mest strax efter att tån har lämnat marken (ca 60°),
  // sträcks sedan ut och låret dras tillbaka en aning före nästa hälisättning. Armarna pendlar emot benen,
  // överkroppen lutar lite framåt och en lång kappa följer låren. Gångcykeln (två steg) räknas ut en gång per
  // sätt att gå (gangen) och var i den en figur är tas av hur långt den har gått (stalln), så att fötterna
  // står still mot stenen hur ofta duken än ritas om.
  const GANG = { LAR: 45, SMA: 38, HOFT: 90, N: 128 };
  // Sätten att gå (STILAR, var och en olika, gangStil): S två stegs längd (cm), B hur stor del av varvet en fot
  // står i marken, x0 hur långt framför höften hälen sätts i (del av S), lyft fotens vinkel när tån lämnar marken,
  // kna hur mycket knät böjs när benet förs fram (grader), hojd och studs höftens höjd och gung (cm; de raka
  // benen bestämmer hur högt den når), lut hur mycket överkroppen lutar framåt (grader), arm hur mycket armarna
  // pendlar, takt varv (två steg) i sekunden och ficka hur ofta händerna är i fickorna. Farten blir S · takt.
  // Och för de sätt som skiljer sig mer: hal fotens vinkel när den sätts i (grader; −12 är hälen först, nära 0 hela
  // foten), lop att höften är lägst mitt i steget och högst i luften (springa), drive hur långt låret förs fram förbi
  // hälisättningen och dras tillbaka (grader) och larS/knaS var i svingen låret och knät är som längst fram och mest
  // böjda, armar hur armarna går (spring: böjda och pumpar, balans: ut framför kroppen, power: i rät vinkel och
  // pumpar, rygg: händerna på ryggen), rull hur mycket axlarna rullar med armarna och nick hur mycket huvudet nickar
  // med stegen. Hållningen: huvud huvudets lutning (grader, plus är nedåt), hfram och hned hur långt det skjuts fram och
  // dras ner mellan axlarna (cm), axlar hur mycket axlarna dras upp (cm, minus är uppåt), armFram och armBoj var armarna
  // hänger och hur böjda (grader), knack hur mycket armbågen böjs när armen svänger fram. Och rytmen: halta hur mycket
  // den haltar (gangen: kortare tid på det onda benet) och svaj hur mycket överkroppen svajar (på väg hem från krogen).
  const STILAR = {
    vanlig: { S: 128, B: 0.62, x0: 0.19, lyft: 55, kna: 62, hojd: 88.6, studs: 1.7, lut: 2.5, arm: 1, takt: 0.98, ficka: 0.12 },
    rask: { S: 142, B: 0.6, x0: 0.2, lyft: 58, kna: 65, hojd: 88.4, studs: 2, lut: 5, arm: 1.4, takt: 1.05, ficka: 0 },
    strosar: { S: 108, B: 0.64, x0: 0.19, lyft: 45, kna: 56, hojd: 88.8, studs: 1.3, lut: 0.5, arm: 0.6, takt: 0.86, ficka: 0.55 },
    studsar: { S: 124, B: 0.6, x0: 0.19, lyft: 62, kna: 66, hojd: 87.8, studs: 2.8, lut: 1.5, arm: 1.15, takt: 1, ficka: 0, nick: 0.5 },
    lunkar: { S: 94, B: 0.66, x0: 0.18, lyft: 32, kna: 50, hojd: 87.6, studs: 1, lut: 9, arm: 0.45, takt: 0.92, ficka: 0.3, huvud: 6 },
    rak: { S: 122, B: 0.62, x0: 0.19, lyft: 48, kna: 56, hojd: 89.4, studs: 1.2, lut: -1, arm: 0.75, takt: 0.98, ficka: 0.2, huvud: -2 },
    // (på inlines: två skär per varv, S hur långt de glider på dem; skridTab)
    skrinna: { S: 330, B: 0.5, x0: 0, lyft: 0, kna: 0, hojd: 77, studs: 1.2, lut: 22, arm: 1.7, takt: 0.8, ficka: 0 },
    // korta, snabba steg och små armrörelser
    trippar: { S: 90, B: 0.6, x0: 0.17, lyft: 40, kna: 52, hojd: 88.9, studs: 1.1, lut: 1, arm: 0.5, takt: 1.2, ficka: 0.05 },
    // långa, sega steg, bakåtlutad, armarna svänger löst och axlarna rullar med, huvudet nickar
    slantrar: { S: 132, B: 0.63, x0: 0.2, lyft: 50, kna: 60, hojd: 88.2, studs: 2.3, lut: -2.5, arm: 1.6, takt: 0.84, ficka: 0.15, rull: 1, nick: 1, huvud: -3 },
    // på halkan: korta steg med hela foten i taget, böjda knän, framåtlutad och armarna ute för balansen
    halkar: { S: 76, B: 0.68, x0: 0.26, lyft: 12, kna: 26, knaS: 0.55, larS: 0.7, hojd: 86.4, studs: 0.5, lut: 4, arm: 0.4, takt: 1, ficka: 0, hal: -3, armar: 'balans', huvud: 8 },
    // med käpp: korta, försiktiga steg, framåtböjd; käppen går med det bortre benet (kapp i stalln)
    kapp: { S: 80, B: 0.68, x0: 0.15, lyft: 30, kna: 48, hojd: 87.6, studs: 0.8, lut: 7, arm: 0.35, takt: 0.88, ficka: 0, huvud: 4, hfram: 1.5 },
    // springer (joggar, eller hinner med bussen): i luften mellan stegen, landar på mitten av foten, knät högt fram
    springer: { S: 212, B: 0.36, x0: 0.09, lyft: 52, kna: 112, hojd: 86.6, studs: 3.2, lut: 7, arm: 1, takt: 1.42, ficka: 0, hal: -3, lop: true, drive: 24, larS: 0.56, knaS: 0.38, armar: 'spring' },
    // hasar: släpar fötterna, korta steg nästan utan att lyfta dem och hela foten i marken på en gång, lutar sig fram
    // och tittar ner, armarna hänger
    hasar: { S: 86, B: 0.66, x0: 0.16, lyft: 22, kna: 40, hojd: 87.9, studs: 0.6, lut: 5, arm: 0.3, takt: 1, ficka: 0.4, hal: -4, huvud: 9, hfram: 1 },
    // kliver: långa steg i lugn takt, knät högt fram och raka armar
    kliver: { S: 158, B: 0.6, x0: 0.21, lyft: 66, kna: 68, hojd: 88.6, studs: 2.4, lut: 1.5, arm: 1.3, takt: 0.86, ficka: 0.1, knack: 6, armBoj: -4 },
    // stram: rak i ryggen och hakan upp, hälen i först, armarna raka och långt fram och bak
    stram: { S: 136, B: 0.62, x0: 0.2, lyft: 52, kna: 58, hojd: 89.4, studs: 1.1, lut: -1.5, arm: 1.7, takt: 1.02, ficka: 0, hal: -17, huvud: -5, knack: 3, armBoj: -3, armFram: -3 },
    // vaggar: korta steg, bakåtlutad, armarna lite fram och böjda, och axlarna gungar (rund om magen)
    vaggar: { S: 82, B: 0.66, x0: 0.17, lyft: 34, kna: 46, hojd: 87.8, studs: 0.7, lut: -4.5, arm: 0.6, takt: 0.88, ficka: 0, rull: 1.4, nick: 0.3, armFram: -8, armBoj: -22, huvud: -2 },
    // fryser: axlarna uppdragna och huvudet nere mellan dem och framåt, händerna i fickorna, korta snabba steg
    frusen: { S: 96, B: 0.62, x0: 0.18, lyft: 42, kna: 54, hojd: 88.4, studs: 1, lut: 7, arm: 0.3, takt: 1.16, ficka: 0.85, huvud: 10, hfram: 2.4, hned: 3.2, axlar: -2.6 },
    // powerwalk: långa, snabba steg, armarna böjda i rät vinkel pumpar högt
    power: { S: 150, B: 0.6, x0: 0.21, lyft: 58, kna: 64, hojd: 88.8, studs: 1.4, lut: 4, arm: 1.2, takt: 1.12, ficka: 0, hal: -16, armar: 'power', huvud: -2 },
    // haltar: kortare tid på det onda benet, vars knä inte sträcks; kroppen sjunker och nickar när det tar emot och
    // det goda benet tar ett kort, snabbt steg (gangen)
    haltar: { S: 104, B: 0.62, x0: 0.18, lyft: 46, kna: 56, hojd: 88.4, studs: 1.2, lut: 3, arm: 0.8, takt: 0.9, ficka: 0.1, halta: 1 },
    // vinglar: på väg hem från krogen, överkroppen svajar och armarna slänger
    vinglar: { S: 106, B: 0.64, x0: 0.18, lyft: 44, kna: 56, hojd: 88.2, studs: 1.6, lut: 2, arm: 1.4, takt: 0.88, ficka: 0, nick: 0.7, rull: 0.6, svaj: 1, knack: 14 },
  };
  // Ett sätt att gå ur R: vilket, och var och en på sitt eget sätt inom det – det som gör att man känner igen någon på
  // gången: steglängden och takten, gunget, hur hälen sätts i, hur högt foten lyfts, lutningen och hur mycket
  // överkroppen gungar med stegen, huvudets hållning (framskjutet, böjt eller med hakan upp), armarna (hur böjda, var
  // de hänger, hur långt de svänger och i vilken takt, och ofta svänger den ena mindre än den andra), lite axlar som
  // rullar och ett huvud som nickar. Ibland är bara den ena handen i fickan (F den närmre och B den bortre).
  function gangStil(R, o = {}) {
    const namn = o.stil || pick(R, ['vanlig', 'vanlig', 'vanlig', 'rask', 'rask', 'strosar', 'strosar', 'studsar', 'lunkar', 'rak', 'trippar', 'slantrar', 'kliver', 'stram', 'hasar']);
    const s = STILAR[namn];
    const j = (x, d) => x + (R() * 2 - 1) * d;
    const ficka = !o.paraply && !o.hund && !s.armar && namn !== 'kapp' && namn !== 'skrinna' && R() < s.ficka + (o.kalla ? 0.15 : 0);
    const r = R();
    // (det som sitter i benen bara lite för den som springer, halkar eller åker inlines: där är det sättet som syns)
    const fri = !['springer', 'halkar', 'skrinna'].includes(namn);
    const v = fri ? 1 : 0.4;
    const st = {
      ...s, namn, S: j(s.S, 9 * v), lyft: j(s.lyft, 7 * v), kna: j(s.kna, 5 * v), hojd: j(s.hojd, 0.4), studs: Math.max(0.3, j(s.studs, 0.5 * v)),
      lut: j(s.lut, 2), arm: Math.max(0.15, j(s.arm, 0.25 * v)), takt: j(s.takt, 0.05 * v), x0: j(s.x0, 0.015 * v),
      armBoj: j(s.armBoj ?? -8, 6), armFram: j(s.armFram ?? 0, 4), armSen: j(0.04, 0.04), knack: Math.max(2, j(s.knack ?? 11, 4)),
      lutGung: Math.max(0.15, j(0.6, 0.4)), huvud: j(s.huvud ?? 0, 3), hfram: Math.max(-0.6, j(s.hfram ?? 0, 0.8)), hned: s.hned ?? 0,
      ficka: ficka ? (r < 0.55 ? 'FB' : r < 0.8 ? 'F' : 'B') : '', tab: null, skrid: namn === 'skrinna',
    };
    if (fri) st.hal = j(s.hal ?? -12, s.hal != null ? 1.5 : 5);
    // (den ena armen svänger ofta mindre än den andra; en del rullar lite med axlarna och nickar lite med huvudet)
    const as = R() < 0.35 ? j(0.62, 0.2) : 1;
    st.armA = R() < 0.5 ? [as, 1] : [1, as];
    st.rull = (s.rull || 0) + (R() < 0.3 ? R() * 0.45 : 0);
    st.nick = (s.nick || 0) + R() * 0.35;
    if (s.halta) {
      st.halta = j(0.8, 0.2);
      st.ont = R() < 0.5 ? 'F' : 'B';
    }
    if (s.svaj) st.svajFas = R() * 2 * Math.PI;
    return st;
  }
  // På inlines (skrinna): varje ben skjuter ifrån bakåt med hjulen mot stenen i halva varvet och förs sedan fram,
  // böjt och lite lyft, i den andra. Höften står lägre (knäna böjda), överkroppen lutar fram och fötterna glider
  // med kroppen, som på skridskor. Samma tabell som gångens (gangen): höften och benets vinklar per del av varvet.
  const SKRIDSULA = 15;
  function skridTab(st) {
    const { LAR: L1, SMA: L2, N } = GANG;
    const ss = (x) => { const q = Math.min(1, Math.max(0, x)); return q * q * (3 - 2 * q); };
    // fotleden (x framåt, y nedåt från höften) → lår och knä, med knät framåt
    const ik = (x, y) => {
      const d = Math.max(5, Math.min(Math.hypot(x, y), L1 + L2 - 0.5));
      const a = Math.atan2(-x, y) - Math.acos(Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
      const kx = -L1 * Math.sin(a);
      const ky = L1 * Math.cos(a);
      return [a, Math.atan2(-(x - kx), y - ky) - a];
    };
    const FRAM = 20;
    const BAK = -46;
    return [...Array(N)].map((_, i) => {
      const p = i / N;
      const h = st.hojd + st.studs * Math.cos(4 * Math.PI * p);
      let x; let y; let tipp = 0;
      if (p < 0.5) {
        x = FRAM + (BAK - FRAM) * (p / 0.5);
        y = h - SKRIDSULA;
      } else {
        const s = (p - 0.5) / 0.5;
        x = BAK + (FRAM - BAK) * ss(s);
        y = h - SKRIDSULA - 11 * Math.sin(Math.PI * s);
        tipp = 14 * DEG * Math.sin(Math.PI * s);
      }
      const [a, b] = ik(x, y);
      return [0, GANG.HOFT - h, a, b, -(a + b) + tipp];
    });
  }
  let gangVanlig = null;
  const stilVanlig = () => gangVanlig || (gangVanlig = gangStil(() => 0.5, { stil: 'vanlig' }));
  // Gångcykeln för sättet st: höftens förskjutning och höjd och benets vinklar per del av varvet, för det närmre benet
  // (st.tab) och, när benen går olika (den som haltar), för det bortre (st.tab2, i dess eget varv, som börjar st.fas2
  // in i det närmres). Annars går det bortre benet som det närmre ett halvt varv senare.
  function gangen(st) {
    if (st.tab) return st.tab;
    if (st.skrid) return (st.tab = skridTab(st));
    const { LAR: L1, SMA: L2, N } = GANG;
    const { S } = st;
    // foten från fotleden (x framåt, y nedåt): hälen och tån; vinkeln positiv när hälen lyfts
    const HAL = [-6.5, 7];
    const TA = [16.5, 7];
    const rot = (q, a) => [q[0] * Math.cos(a) - q[1] * Math.sin(a), q[0] * Math.sin(a) + q[1] * Math.cos(a)];
    const ss = (x) => { const q = Math.min(1, Math.max(0, x)); return q * q * (3 - 2 * q); };
    const herm = (p0, p1, m0, m1, x) => {
      const x2 = x * x; const x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * p0 + (x3 - 2 * x2 + x) * m0 + (3 * x2 - 2 * x3) * p1 + (x3 - x2) * m1;
    };
    // Benen: hur stor del av varvet var och ett står i marken (B), var i varvet hälen sätts i (off), och det som
    // styr steget. Den som haltar står kortare tid på det onda benet och sträcker inte knät på det (det böjs mindre
    // när det förs fram och foten lyfts mindre), och det goda benet sätts i tidigare: ett kort, snabbt steg med det
    // goda och ett långt med det onda, och kroppen sjunker (dip) när det onda tar emot.
    const ben0 = { off: 0, B: st.B, x0: st.x0, hal: st.hal ?? -12, lyft: st.lyft, kna: st.kna, knaS: st.knaS, larS: st.larS, drive: st.drive };
    const ben1 = { ...ben0, off: 0.5 };
    let ontI = -1;
    let dip = 0;
    if (st.halta) {
      const g = st.halta;
      const ont = { B: st.B - 0.08 * g, kna: st.kna - 12 * g, lyft: st.lyft - 10 * g };
      const bra = { B: st.B + 0.06 * g };
      if (st.ont === 'F') { Object.assign(ben0, ont); Object.assign(ben1, bra, { off: 0.5 - 0.08 * g }); ontI = 0; }
      else { Object.assign(ben0, bra); Object.assign(ben1, ont, { off: 0.5 + 0.08 * g }); ontI = 1; }
      dip = 3.2 * g;
    }
    // Stödfasen (0 … B): hälen slår i X0 framför höften och foten fälls ner (till 0,08), står platt (till HA)
    // och rullar över tån (till B). Fotleden och fotens vinkel på marken (y 0), där höften var i 0 vid
    // hälisättningen och går S per varv; och fotleden mätt från höften (rel), för benet som är q in i sitt varv.
    const lag = (b) => {
      const X0 = b.x0 * S;
      const HA = b.B - 0.2;
      const PSI0 = b.hal * DEG;
      const PSI1 = b.lyft * DEG;
      const stod = (p) => {
        if (p < 0.08) { const psi = PSI0 * (1 - ss(p / 0.08)); const h = rot(HAL, psi); return [X0 - h[0], -h[1], psi]; }
        if (p < HA) return [X0 - HAL[0], -HAL[1], 0];
        const psi = PSI1 * Math.pow((p - HA) / (b.B - HA), 1.7);
        const q = rot(TA, psi);
        return [X0 - HAL[0] + TA[0] - q[0], -q[1], psi];
      };
      const rel = (q) => { const f = stod(q); return [f[0] - S * q, f[1], f[2]]; };
      // (var i sitt varv benet är vid p, om det står i marken; annars −1)
      const i = (p) => { const q = (((p - b.off) % 1) + 1) % 1; return q < b.B ? q : -1; };
      return { ...b, stod, rel, i };
    };
    const LB = [lag(ben0), lag(ben1)];
    // Höften: högst mitt i steget och lägst när båda fötterna är i marken; aldrig högre än att benen som står når
    // marken med knät lite böjt (minst 5°). Den som springer är tvärtom lägst mitt i steget, när knät tar emot, och
    // högst i luften. Fyra punkter i varvet (mitt i varje steg och mellan dem) med mjuka bågar emellan; när benen går
    // lika blir det en cosinus med två toppar per varv.
    const ps = [...Array(N)].map((_, i) => i / N);
    const t0 = LB[1].off + LB[1].B - 1;
    const sg = st.lop ? -1 : 1;
    const nyck = [[t0 / 2, -1, -1], [(t0 + LB[1].off) / 2, 1, 0], [(LB[1].off + LB[0].B) / 2, -1, -1], [(LB[0].B + 1) / 2, 1, 1]]
      .map(([q, u, i]) => [(((q % 1) + 1) % 1), st.hojd + sg * u * st.studs - (i === ontI ? dip : 0)])
      .sort((a, b) => a[0] - b[0]);
    if (ontI >= 0) st.ontMitt = (((ontI === 0 ? (t0 + LB[1].off) / 2 : (LB[0].B + 1) / 2) % 1) + 1) % 1;
    const bas = (p) => {
      const x = p < nyck[0][0] ? p + 1 : p;
      for (let k = 0; k < 4; k++) {
        const [q0, v0] = nyck[k];
        const q1 = k === 3 ? nyck[0][0] + 1 : nyck[k + 1][0];
        if (x >= q0 && x < q1) return v0 + (nyck[(k + 1) % 4][1] - v0) * (1 - Math.cos(Math.PI * (x - q0) / (q1 - q0))) / 2;
      }
      return nyck[0][1];
    };
    // (mitt i steget på det närmre benet; höften går lite fram och tillbaka kring det, fram)
    const PM = (t0 + LB[1].off) / 2;
    const fram = (p) => -0.7 * Math.sin(4 * Math.PI * (p - PM));
    const NA = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * Math.cos(5 * DEG));
    const tak = ps.map((p) => Math.min(...LB.filter((b) => b.i(p) >= 0).map((b) => {
      const r = b.rel(b.i(p));
      const dx = r[0] - fram(p);
      return Math.sqrt(Math.max(0, NA * NA - dx * dx)) - r[1];
    })));
    let H = ps.map(bas);
    for (let k = 0; k < 40; k++) {
      H = H.map((h, i) => Math.min(h, tak[i]));
      H = H.map((h, i) => (H[(i + N - 1) % N] + 2 * h + H[(i + 1) % N]) / 4);
    }
    H = H.map((h, i) => Math.min(h, tak[i]));
    const Hp = (p) => { const x = (((p % 1) + 1) % 1) * N; const i = Math.floor(x); return H[i] + (H[(i + 1) % N] - H[i]) * (x - i); };
    const NA3 = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * Math.cos(3 * DEG));
    // Ett bens vinklar genom varvet (q i dess eget varv, höften där den är då, vid q + off).
    function tabell(b) {
      // benet som står (IK, knät framåt): lårets, smalbenets och fotens vinklar (radianer, medurs som i duken)
      const ik = (q) => {
        const p = q + b.off;
        const r = b.rel(q);
        const dx = r[0] - fram(p);
        const dy = r[1] + Hp(p);
        const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1e-6);
        const f1 = Math.atan2(dx, dy) + Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
        const f2 = Math.atan2(dx - L1 * Math.sin(f1), dy - L1 * Math.cos(f1));
        return [-f1, f1 - f2, r[2] + f2];
      };
      // Benet som förs fram (B … 1, s 0 … 1): mjuka kurvor genom knutar [s, vinkel, lutning], som börjar där och så
      // som benet lämnade marken och slutar där nästa hälisättning börjar. Låret svänger fram och dras tillbaka
      // 3° på slutet, knät böjs mest efter 30 % och sträcks, foten fälls upp till 3° och hålls där. Den som springer
      // för låret långt fram (drive) och drar tillbaka det innan foten tar i, och knät böjs mer och senare (knaS).
      const sw = 1 - b.B;
      const e = 1e-3;
      const a0 = ik(b.B - e);
      const d0 = ik(b.B - 2 * e).map((v, j) => (a0[j] - v) / e * sw);
      const a1 = ik(0);
      const d1 = ik(e).map((v, j) => (v - a1[j]) / e * sw);
      const KM = b.kna * DEG;
      const KS = b.knaS || 0.3;
      const K = [
        [[0, a0[0], d0[0]], [b.larS || 0.84, a1[0] - (b.drive || 1.5) * DEG, 0], [1, a1[0], d1[0]]],
        [[0, a0[1], Math.min(d0[1], 2.5 * (KM - a0[1]) / KS)], [KS, KM, 0], [1, a1[1], 0]],
        [[0, a0[2], d0[2]], [0.45, -5 * DEG, 0], [1, a1[2], 0]],
      ];
      const kurva = (k, s) => {
        const j = s < k[1][0] ? 0 : 1;
        const [s0, y0, m0] = k[j];
        const [s1, y1, m1] = k[j + 1];
        const h = s1 - s0;
        return herm(y0, y1, m0 * h, m1 * h, (s - s0) / h);
      };
      // Det sista av svingen: fotleden sänks ovanifrån mot nästa hälisättning och saktar in (till halva farten),
      // så att hälen sätts i mjukt där den sedan står. Banan blandas in från s 0,62 och benet följer den (IK, knät
      // böjt minst 3°); foten behåller sin vinkel.
      const A1 = b.stod(0);
      const landa = (q, v) => {
        const w = ss(((q - b.B) / sw - 0.62) / 0.33);
        if (w <= 0) return v;
        const p = q + b.off;
        const u = 1 - q;
        const ax = L1 * Math.sin(-v[0]) + L2 * Math.sin(-v[0] - v[1]);
        const ay = L1 * Math.cos(v[0]) + L2 * Math.cos(v[0] + v[1]);
        const tx = S + A1[0] - S * (0.5 * u + 2 * u * u) - S * q - fram(p);
        const ty = Hp(p) + A1[1] - 300 * u * u;
        const x = ax + (tx - ax) * w;
        const y = ay + (ty - ay) * w;
        const d = Math.min(Math.hypot(x, y), NA3);
        const f1 = Math.atan2(x, y) + Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
        const f2 = Math.atan2(x - L1 * Math.sin(f1), y - L1 * Math.cos(f1));
        return [-f1, f1 - f2, v[0] + v[1] + v[2] + f2];
      };
      // per del av varvet: höftens förskjutning (x, y) och benets vinklar (lår, smalben, fot)
      const T = ps.map((q) => {
        const v = q < b.B ? ik(q) : landa(q, K.map((k) => kurva(k, (q - b.B) / sw)));
        return [fram(q + b.off), GANG.HOFT - Hp(q + b.off), ...v];
      });
      // Foten som förs fram går minst 1,5 cm över stenen (mitt i svingen; mindre strax efter att den lämnat
      // marken och strax före hälisättningen): där den inte gör det böjs knät mer och låret förs fram lite.
      const lagst = (r) => {
        const [, by, th, kn, ft] = r;
        const ky = GANG.HOFT - by - L1 * Math.cos(th);
        const ay = ky - L2 * Math.cos(th + kn);
        const f = th + kn + ft;
        return Math.min(...[[-6.5, 7], [16.5, 7]].map(([x, y]) => ay - (x * Math.sin(f) + y * Math.cos(f))));
      };
      for (let n = 0; n < 8; n++) {
        const brist = ps.map((q, i) => (q < b.B ? 0 : Math.max(0, 1.5 * Math.sin(Math.PI * (q - b.B) / sw) ** 0.7 - lagst(T[i]))));
        if (Math.max(...brist) < 0.05) break;
        const mjuk = brist.map((_, i) => Math.max(...[-3, -2, -1, 0, 1, 2, 3].map((d) => brist[(i + d + N) % N] * (1 - Math.abs(d) / 4))));
        T.forEach((r, i) => { if (ps[i] >= b.B) { r[3] += mjuk[i] / 30; r[2] -= mjuk[i] / 90; } });
      }
      return T;
    }
    st.tab = tabell(LB[0]);
    if (ontI >= 0) {
      st.tab2 = tabell(LB[1]);
      st.fas2 = LB[1].off;
    }
    return st.tab;
  }
  // Ställningen p in i varvet (0 … 1; det bortre benet och armen ett halvt varv efter, eller st.fas2 när benen går
  // olika) för sättet st: höften (bx, by), benen (F, B: lår, smalben, fot), kappans och kjolens skört (kF, kB: med det
  // främre och det bakre låret), överkroppens lutning (lut), armarna (aF, aB: axel, armbåge; i fickorna nästan
  // stilla), paraplyet (par), och var i varvet (p), hur långt den har gått (d, cm: hjulen rullar efter det) och
  // stegens längd (S: hunden travar efter dem); axlarnas rullning (sF, sB, cm framåt) och höjd (sy, cm), huvudets
  // lutning och nick (nick), var huvudet är (hx, hy: framskjutet och nerdraget, cm) och käppen (kapp: handtaget x, y
  // och vinkeln). p räknas inte om till 0 … 1: svajet hos den som vinglar går över flera varv. STAR: står still.
  const STAR = { bx: 0, by: 0, F: [0, 0, 0], B: [0, 0, 0], kF: 0, kB: 0, lut: 0, aF: [0, -6 * DEG], aB: [0, -6 * DEG], par: 0, p: null, d: 0, S: 128 };
  // käppens längd (cm, från handtaget till spetsen)
  const KAPP = 84;
  function stalln(p, st) {
    const T = gangen(st);
    const N = T.length;
    const tab = (U, q) => {
      const x = ((q % 1) + 1) % 1 * N;
      const i = Math.floor(x);
      const a = U[i]; const b = U[(i + 1) % N]; const w = x - i;
      return a.map((v, j) => v + (b[j] - v) * w);
    };
    const f = tab(T, p);
    const b2 = st.tab2 ? st.fas2 : 0.5;
    const b = tab(st.tab2 || T, p - b2);
    const PM = st.B / 2;
    // (den som vinglar: överkroppen svajar fram och tillbaka i en långsammare takt än stegen, armarna slänger olika
    // mycket och huvudet följer med)
    const svaj = st.svaj ? st.svaj * (Math.sin(2 * Math.PI * p / 2.7 + st.svajFas) + 0.45 * Math.sin(2 * Math.PI * p / 1.3 + 2 * st.svajFas)) : 0;
    // Armarna emot benen: den närmre fram när det närmre benet är bak. I fickan nästan stilla, och då svänger den
    // andra lite mer; ofta svänger den ena mindre än den andra (armA). Den som springer har armarna böjda och pumpar
    // (utom den som bär något i handen, st.hang), den som powerwalkar har dem i rät vinkel och pumpar högt, på halkan
    // hålls de ute framför kroppen och den som har händerna på ryggen har armbågarna bakåt och händerna knäppta
    // nedanför ryggen.
    const fi = st.ficka || '';
    const A = st.arm * (fi.length === 1 ? 1.15 : 1) * (1 + 0.25 * svaj);
    const AA = st.armA || [1, 1];
    const cos = (q) => Math.cos(2 * Math.PI * (q - st.armSen));
    const arm = (q, ficka, bar, a) => {
      const c = cos(q);
      const Aa = A * a;
      if (ficka) return [(-2 + 2 * c) * DEG, -18 * DEG];
      if (st.armar === 'spring' && bar) return [(Aa * 16 * c - 4) * DEG, (-24 + 6 * c) * DEG];
      if (st.armar === 'spring') return [(Aa * 26 * c - 2) * DEG, (-76 + 12 * c) * DEG];
      if (st.armar === 'power' && !bar) return [(Aa * 22 * c - 8) * DEG, (-86 + 8 * c) * DEG];
      if (st.armar === 'balans') return [(-13 + 4 * Aa * c) * DEG, (-34 + 3 * c) * DEG];
      if (st.armar === 'rygg') return [(53 + 1.5 * c) * DEG, (-63 + c) * DEG];
      return [(Aa * 15 * c + st.armFram) * DEG, ((st.armBoj ?? -8) - (st.knack ?? 11) * Aa * (1 - c)) * DEG];
    };
    let lut = st.lut + (st.lutGung ?? 0.6) * Math.cos(4 * Math.PI * (p - PM - 0.1)) + 4 * svaj;
    let nick = (st.huvud || 0) + (st.nick ? st.nick * 2.2 * Math.sin(4 * Math.PI * (p - PM + 0.08)) : 0) + 3 * svaj;
    // (den som haltar sjunker och nickar en gång per varv, när det onda benet tar emot)
    if (st.halta && st.ontMitt != null) {
      const w = 0.5 + 0.5 * Math.cos(2 * Math.PI * (p - st.ontMitt));
      lut += 2.4 * st.halta * w;
      nick += 4 * st.halta * w;
    }
    lut *= DEG;
    const P = { bx: f[0], by: f[1], F: f.slice(2), B: b.slice(2), kF: 0.7 * Math.min(f[2], b[2]), kB: 0.7 * Math.max(f[2], b[2]),
      lut, aF: arm(p, fi.includes('F'), st.hang === 'F', AA[0]), aB: arm(p - b2, fi.includes('B'), st.hang === 'B', AA[1]),
      par: 1.2 * DEG * Math.sin(4 * Math.PI * (p - PM)), p, d: p * st.S, S: st.S };
    // axlarna rullar med armarna (den närmre fram när dess arm är fram), och huvudet nickar en gång per steg
    if (st.rull) {
      const s = -2.6 * st.rull * cos(p);
      P.sF = s;
      P.sB = -s;
    }
    if (nick) P.nick = nick * DEG;
    if (st.hfram) P.hx = st.hfram;
    if (st.hned) P.hy = st.hned;
    if (st.axlar) P.sy = st.axlar;
    if (st.namn === 'kapp') kappen(P, st, lut);
    return P;
  }
  // Käppen i den närmre handen går med det bortre benet, som hos den som går med käpp: spetsen sätts i en bit framför
  // där den bortre hälen sätts i, samtidigt, och står still medan kroppen går förbi den; den lyfts lite innan foten
  // lämnar marken och förs fram i en låg båge. Handtaget är där armen når, lite framför axeln, och armen böjs i
  // armbågen så att handen håller det (P.aF).
  function kappen(P, st, lut) {
    const { HOFT } = GANG;
    const hx = P.bx;
    const hy = P.by - HOFT;
    // spetsen: var i det bortre benets varv (q), i figurens mått (den går S på ett varv)
    const q = (((P.p + 0.5) % 1) + 1) % 1;
    const CS = st.B * 0.7;
    const X = st.x0 * st.S + 22;
    const u = q < CS ? 0 : (q - CS) / (1 - CS);
    const tx = X + st.S * (u * u * (3 - 2 * u)) - st.S * q;
    const ty = -5 * Math.sin(Math.PI * u);
    // axeln (överkroppen lutar kring höften) och handtaget lite framför den
    const sx = hx + Math.cos(lut) + 52 * Math.sin(lut);
    const sy = hy + Math.sin(lut) - 52 * Math.cos(lut);
    const dx = Math.max(-0.4 * KAPP, Math.min(0.4 * KAPP, sx + 9 - tx));
    let gx = tx + dx;
    let gy = ty - Math.sqrt(KAPP * KAPP - dx * dx);
    // armen (överarm 29, underarm 31): räcker den inte når handen så långt den kan, och käppen följer med
    const A1 = 29;
    const A2 = 31;
    let vx = gx - sx;
    let vy = gy - sy;
    let d = Math.hypot(vx, vy);
    if (d > A1 + A2 - 0.5) {
      const k = (A1 + A2 - 0.5) / d;
      vx *= k; vy *= k; d = A1 + A2 - 0.5;
      gx = sx + vx; gy = sy + vy;
    }
    // (armbågen bakåt, underarmen fram: vinklarna medurs från rakt ner, som i ritaDelar)
    const g = Math.acos(Math.max(-1, Math.min(1, (A1 * A1 + d * d - A2 * A2) / (2 * A1 * d))));
    const a0 = Math.atan2(-vx, vy) + g;
    const ex = sx - A1 * Math.sin(a0);
    const ey = sy + A1 * Math.cos(a0);
    const w = Math.atan2(-(gx - ex), gy - ey);
    P.aF = [a0, w - a0];
    P.kapp = [gx, gy, Math.atan2(-(tx - gx), ty - gy)];
  }

  // ---------- de som går: kroppen, kläderna och det de har med sig ----------
  //
  // En som går ritas i centimeter (fötterna i 0, vänd åt höger) som delar i den ordning de fylls i, det bortre
  // först: det som dras efter (dragkärran, pulkan), bortre benet och armen, ryggsäcken, närmre benet, kroppen
  // och huvudet, närmre armen och det som hålls i den, och sist det som går före (hunden, barnvagnen, cykeln).
  // Delarnas grupp (g) säger hur de rör sig (ritaDelar): benen i höften, knät och fotleden, armarna i axeln och
  // armbågen, det som hålls med armen i en fast vinkel (fast, GREPP), det som hänger i handen (hang: väskan och
  // påsen hänger rakt ner), paraplyet (par), hundens ben (hund) och kropp (hkropp), och det som står på marken
  // och inte gungar med höften (mark) med hjul som rullar (hjul).
  const LARP = (w) => `M${r1(-7.5 * w)} -6 H${r1(7.5 * w)} Q${r1(8 * w)} 22 ${r1(5.8 * w)} ${GANG.LAR} Q0 ${GANG.LAR + 5} ${r1(-5.6 * w)} ${GANG.LAR} Q${r1(-8 * w)} 22 ${r1(-7.5 * w)} -6 Z`;
  const SMAP = (w) => { const u = w > 1.1 ? 1.8 : 0; return `M${r1(-5.6 * w)} -2 Q0 -5 ${r1(5.8 * w)} -2 L${r1(4.4 * w + u)} ${GANG.SMA - 3 + u} H${r1(-3.6 * w - u)} Z`; };
  const SHORTS = (w) => `M${r1(-8 * w)} -7 H${r1(8 * w)} Q${r1(8.6 * w)} 8 ${r1(7.6 * w)} 19 Q0 22 ${r1(-7.4 * w)} 19 Q${r1(-8.6 * w)} 8 ${r1(-8 * w)} -7 Z`;
  const SKO = 'M-4.6 -4 H4.6 Q15 -3.5 16.5 3 V7 H-6.5 Q-7 1 -4.6 -4 Z';
  const SNEAKER = 'M-5.2 -5 H5 Q15.5 -4 17.4 2 V7 H-7.2 Q-7.8 0 -5.2 -5 Z';
  const KANGA = `M-5.2 ${GANG.SMA - 13} H5.4 L5.8 ${GANG.SMA + 1} H-5.4 Z`;
  const STOVEL = `M-6.2 ${GANG.SMA - 25} H6.4 L6.4 ${GANG.SMA + 1} H-6 Z`;
  const SOCKA = `M-3.9 ${GANG.SMA - 8} H4.5 L4.5 ${GANG.SMA} H-3.9 Z`;
  const OVER = 'M-6 0 H6 Q6.4 16 5.4 29 Q0 33.5 -5.2 29 Q-6.4 16 -6 0 Z';
  const ARMEL = 'M-6.6 -1 H6.6 Q7.1 7 6.4 13.5 Q0 16 -6.1 13.5 Q-7.1 7 -6.6 -1 Z';
  const UNDER = 'M-5.2 -2.5 Q0 -5 5.4 -2.5 L4.6 27 H-4.4 Z';
  const HUVUD = 'M-9.5 -163 Q-10.5 -177 0 -178 Q10 -178 10.5 -169 Q11 -166 13.6 -162.5 Q12 -161 10.6 -160.6 Q11.4 -156 7 -154.5 Q2 -153 -3 -154 Q-9 -156 -9.5 -163 Z';
  // jackans nedre kant (cm över marken, negativt uppåt): kappor till knät, jackor till höften
  const HEM = { kappa: -40, trench: -44, regn: -60, dun: -86, kort: -90, skinn: -93, bomber: -95, jeans: -93, vind: -91, trackdrakt: -92, luv: -88, falt: -80, kavaj: -82, tshirt: -92, skjorta: -90, overall: -90 };
  const HAR = {
    kort: 'M-10 -160 Q-12 -179.5 1 -179.5 Q11 -179 11 -170 Q6 -173 1 -170 Q-3 -166 -5 -160 Q-7 -157 -10 -155 Z',
    gel: 'M-10 -160 Q-12 -178 -6 -181 L-4 -186 L-1 -181.5 L2 -187 L4 -181.5 L7.5 -185.5 L8 -180 Q11.5 -178 11 -170 Q6 -173 1 -170 Q-3 -166 -5 -160 Q-7 -157 -10 -155 Z',
    page: 'M-11 -152 Q-13.5 -166 -10 -175 Q-4 -181.5 3 -180.5 Q11.5 -179 12 -169.5 Q7 -173 2 -170.5 Q-1 -166 0 -158 Q0 -153 -2 -151.5 Q-7 -150 -11 -152 Z',
    lockar: 'M-13 -150 Q-19 -160 -14 -171 Q-12 -183 -1 -184 Q11 -184.5 13 -173 Q14 -169 12 -167.5 Q7 -172 2 -169.5 Q-2 -165 -2 -158 Q-3 -151 -7 -147 Q-11 -146 -13 -150 Z',
    flint: 'M-10 -157 Q-11.5 -167 -7.5 -171 Q-4 -168 -4.5 -162 Q-5 -158 -6.5 -155.5 Z',
    knut: 'M-10 -160 Q-12 -179.5 1 -179.5 Q11 -179 11 -170 Q6 -173 1 -170 Q-3 -166 -5 -160 Q-7 -157 -10 -155 Z M-17.5 -176 a6 5.6 0 1 0 12 0 a6 5.6 0 1 0 -12 0 Z',
    afro: 'M-12 -152 Q-21 -160 -18 -174 Q-14 -190 1 -191 Q15 -191 17 -177 Q18 -170 13.5 -167 Q7 -173 2 -170 Q-2 -165 -3 -158 Q-5 -151 -12 -152 Z',
    // (tuppkammen: en kam av spetsar från pannan till nacken, sidorna rakade)
    tupp: 'M-10 -164 Q-12 -175 -8 -181 L-12 -192 L-3.5 -186 L-3.5 -198 L1.5 -187.5 L5 -197 L6.8 -185.5 L13 -190 L10 -178.5 Q11 -175 10.5 -172 Q5 -177.5 -1 -177.5 Q-6.5 -176.5 -10 -164 Z',
  };
  // håret som syns bakom och under mössan
  const HAR_BAK = {
    lang: 'M-10 -160 Q-13 -150 -9 -139 L-3 -141 Q-6 -150 -5 -160 Z',
    hockey: 'M-10 -161 Q-12.5 -152 -11 -146 Q-8 -144.5 -4.5 -147.5 Q-5.5 -153 -5 -160 Z',
    svans: 'M-9 -173 Q-19 -172 -19.5 -158 Q-19 -149 -15 -146 Q-15.5 -156 -8.5 -165 Z',
  };
  // Armarna som håller något: vinkeln i axeln och armbågen (grader; framåt negativt) och var handen då är
  const GREPP = { koppel: [-12, -35], mobil: [-70, -153], glass: [-14, -96], hand: [-5, -8], vagn: [-40, -30], cykel: [-35, -35], drar: [24, 6], upp: [-134, -71], under: [8, -66], barn: [-78, -10], pizza: [-8, -78], blommor: [-18, -98], rull: [-24, -42], karta: [-30, -70], skid: [-120, -20], bergs: [-175, -74] };
  const handVid = ([a, b]) => {
    const u = a * DEG; const w = (a + b) * DEG;
    return [1 - 29 * Math.sin(u) + 0.4 * Math.cos(w) - 31 * Math.sin(w), -142 + 29 * Math.cos(u) + 0.4 * Math.sin(w) + 31 * Math.cos(w)];
  };
  // en Path2D förstorad s gånger kring (cx, cy) (barnens huvud), och en ring (däcken)
  function skalad(d, s, cx, cy) {
    const p = new Path2D();
    p.addPath(typeof d === 'string' ? new Path2D(d) : d, new DOMMatrix([s, 0, 0, s, cx * (1 - s), cy * (1 - s)]));
    return p;
  }
  const ring = (cx, cy, r, r2) => {
    const p = new Path2D();
    p.arc(cx, cy, r, 0, 2 * Math.PI);
    p.moveTo(cx + r2, cy);
    p.arc(cx, cy, r2, 0, 2 * Math.PI, true);
    return p;
  };
  // Hundarna (cm, vända åt höger, tassarna i 0, kroppens mitt x0 framför den som går): kroppen [x, y, rx, ry],
  // huvudet [x, y, r], benens bredd, och hur många travsteg de tar på människans dubbelsteg (n)
  const HUNDAR = {
    lab: { kr: [0, -40, 27, 11.5], hu: [31, -54, 9.2], ben: 6.4, n: 2.8, x0: 68 },
    schafer: { kr: [0, -46, 29, 12], hu: [34, -64, 8.8], ben: 6.6, n: 2.5, x0: 72 },
    tax: { kr: [0, -14.5, 22, 6.5], hu: [25, -21, 6], ben: 3.8, n: 6, x0: 62 },
    terrier: { kr: [0, -19, 15, 7.5], hu: [18, -28, 6.8], ben: 4.2, n: 4.6, x0: 58 },
    pudel: { kr: [0, -31, 15, 8.5], hu: [19, -45, 6.4], ben: 3, n: 3.6, x0: 60 },
    // (dalmatinern, nittiotalets hund efter filmen, och cockerspanieln med de långa öronen)
    dalm: { kr: [0, -44, 26, 10.5], hu: [31, -58, 8.4], ben: 5.6, n: 2.7, x0: 68 },
    cocker: { kr: [0, -26, 18, 8.5], hu: [21, -38, 7], ben: 4.4, n: 4, x0: 60 },
  };

  // Kläderna i ljuset L: på kvällen mörka, men färgerna syns svagt (NATTF) i lyktornas och fönstrens sken,
  // så att en röd dunjacka och en gul regnrock går att skilja från en svart kappa (morkna mörkar dem sedan
  // efter hur långt från ljuset de går).
  const NATTF = 0.24;
  const klarL = (L) => (c) => mix(mix('#07080b', c, NATTF + (1 - NATTF) * L.dag), '#ffb060', 0.03 * (1 - L.dag));
  // (en kraftig eller smal överkropp: delarna från i0 dras ut på bredden b kring kroppens mitt, utom benen,
  // armarna och det som hålls i dem)
  function bredda(D, i0, b, alla = false) {
    if (!b || b === 1) return;
    const m = new DOMMatrix([b, 0, 0, 1, 0, 0]);
    for (let i = i0; i < D.length; i++) {
      const p = D[i];
      if (!alla && p.g !== '' && p.g !== 'kjolF' && p.g !== 'kjolB') continue;
      const q = new Path2D();
      q.addPath(p.d, m);
      p.d = q;
    }
  }
  // Paraplyets duk sett från sidan, en kupol kring skaftet (x 24): r halva bredden, h höjden och y0 kanten
  // (cm), n kilar runt om (hälften syns). Ger konturen med bågarna mellan spetsarna (duk), varannan kil
  // (kilar, för de tvåfärgade), spröten (sprot), spetsarna (spets) och toppen (topp).
  function parForm(r, h, y0, n) {
    const P = (a, f) => [24 + r * Math.sin(a) * Math.cos(f), y0 - h * Math.cos(a)];
    const pt = ([x, y]) => `${r1(x)} ${r1(y)}`;
    const ner = (f) => [...Array(9)].map((_, i) => P((i / 8) * Math.PI / 2, f));
    const fs = [...Array(n / 2 + 1)].map((_, i) => Math.PI * (1 - i / (n / 2)));
    const spets = fs.map((f) => P(Math.PI / 2, f));
    const bage = (a, b) => `Q${r1((a[0] + b[0]) / 2)} ${r1(y0 - Math.max(2.5, 0.16 * Math.abs(b[0] - a[0])))} ${pt(b)}`;
    const vanster = ner(Math.PI).reverse();
    let duk = `M${vanster.map(pt).join(' L')} L${ner(0).slice(1).map(pt).join(' L')}`;
    for (let i = spets.length - 1; i > 0; i--) duk += ` ${bage(spets[i], spets[i - 1])}`;
    let kilar = '';
    for (let i = 0; i < fs.length - 1; i += 2) {
      kilar += `M${ner(fs[i]).reverse().map(pt).join(' L')} L${ner(fs[i + 1]).slice(1).map(pt).join(' L')} ${bage(spets[i + 1], spets[i])} Z `;
    }
    const sprot = fs.map((f) => `M${ner(f).map(pt).join(' L')}`).join(' ');
    return { duk: `${duk} Z`, kilar, sprot, spets, topp: y0 - h };
  }
  const PARAPLY = {
    golf: parForm(84, 46, -208, 8),
    liten: parForm(50, 26, -204, 12),
    bubbla: parForm(44, 64, -158, 16),
  };

  function figurDelar(o, L) {
    const t = klarL(L);
    const bak = (c) => mix(t(c), '#000000', 0.32);
    const D = [];
    const P2 = (d) => (typeof d === 'string' ? new Path2D(d) : d);
    const del = (d, f, g = '', x = {}) => D.push({ d: P2(d), f, g, ...x });
    const drag = (d, s, w, x = {}) => D.push({ d: P2(d), s, w, g: '', ...x });
    // (barnen har större huvud)
    const H = o.barn ? (d) => skalad(d, 1.3, 1, -150) : P2;
    // (huvudet för sig: det kan nicka, nick i stalln)
    const hd = (d, f, x = {}) => del(H(d), f, 'huvud', x);
    const hdr = (d, s, w, x = {}) => drag(H(d), s, w, { g: 'huvud', ...x });
    const stil = o.stil || (o.lang ? 'kappa' : 'kort');
    const nere = HEM[stil] ?? -84;
    const lang = nere > -70;
    const skugga = (x, rx) => del(ell(x, 1, rx, 3), '#000000', 'mark', { a: 0.2, inre: true });

    // ett hjul som rullar (däck, fälg, ekrar och nav), mitten r över marken i x
    const hjul = (x, r, c1 = '#1a1a1a', c2 = '#b4b4b4', ek = 8) => {
      del(ring(x, -r, r, r - 2.6), t(c1), 'mark');
      del(ring(x, -r, r - 3.2, r - 4.6), t(c2), 'mark', { inre: true });
      let s = '';
      for (let i = 0; i < ek; i++) {
        const a = (i / ek) * Math.PI;
        const c = Math.cos(a) * (r - 3.6); const sn = Math.sin(a) * (r - 3.6);
        s += `M${r1(-c)} ${r1(-sn)} L${r1(c)} ${r1(sn)} `;
      }
      drag(s, t(c2), 0.7, { g: 'hjul', px: x, py: -r, r, inre: true, a: 0.75 });
      del(ell(x, -r, 2.2, 2.2), t(c2), 'mark', { inre: true });
    };

    // --- det som dras efter (i den bortre handen)
    if (o.vagn && o.vagn.typ === 'karra') {
      const [hx, hy] = handVid(GREPP.drar);
      const ax = -60; const ay = -9;
      const dx = ax - hx; const dy = ay - hy;
      const n = [-dy / Math.hypot(dx, dy), dx / Math.hypot(dx, dy)];
      const Q = (s, w) => `${r1(hx + dx * s + n[0] * w)} ${r1(hy + dy * s + n[1] * w)}`;
      skugga(ax - 4, 14);
      drag(`M${r1(hx)} ${r1(hy)} L${ax} ${ay}`, t('#2a2a2e'), 2.2, { g: 'mark' });
      // (tidningsbudets kärra: buntarna med morgonens tidningar sticker upp ur säcken)
      if (o.vagn.tidn) {
        del(`M${Q(0.17, 2)} L${Q(0.3, 2)} L${Q(0.3, 13)} L${Q(0.19, 13)} Z M${Q(0.2, 14)} L${Q(0.3, 14)} L${Q(0.3, 25)} L${Q(0.22, 25)} Z`, t('#e6e2d4'), 'mark');
        drag(`M${Q(0.18, 7)} L${Q(0.3, 7)} M${Q(0.21, 19)} L${Q(0.3, 19)}`, t('#8a8a84'), 1, { g: 'mark', inre: true });
      }
      del(`M${Q(0.28, 0)} L${Q(0.93, 0)} L${Q(0.93, 25)} Q${Q(0.6, 29)} ${Q(0.26, 27)} Z`, t(o.vagn.f), 'mark');
      drag(`M${Q(0.3, 8)} L${Q(0.9, 8)} M${Q(0.29, 17)} L${Q(0.9, 17)}`, t(o.vagn.f2), 1.6, { g: 'mark', inre: true, a: 0.7 });
      drag(`M${Q(0.5, 0)} L${Q(0.5, 27)} M${Q(0.72, 0)} L${Q(0.72, 26.5)}`, t(o.vagn.f2), 1.1, { g: 'mark', inre: true, a: 0.5 });
      hjul(ax, 9, '#1a1a1a', '#8a8a8a', 4);
    } else if (o.vagn && o.vagn.typ === 'pulka') {
      const [hx, hy] = handVid(GREPP.drar);
      const fx = -82;
      skugga(fx - 38, 40);
      drag(`M${r1(hx)} ${r1(hy)} Q${r1((hx + fx) / 2)} -20 ${fx} -15`, t('#c8c0a8'), 1.2, { g: 'mark' });
      del(`M${fx - 76} -4 Q${fx - 78} -15 ${fx - 70} -16 H${fx - 14} Q${fx - 4} -16 ${fx} -26 Q${fx + 3} -11 ${fx - 10} -2 H${fx - 72} Q${fx - 76} -2 ${fx - 76} -4 Z`, t(o.vagn.f), 'mark');
      // barnet i pulkan: overall, mössa med tofs, stövlar
      del(`M${fx - 64} -15 Q${fx - 67} -44 ${fx - 52} -47 Q${fx - 38} -47 ${fx - 36} -30 L${fx - 34} -15 Z`, t(o.vagn.f2), 'mark');
      del(`M${fx - 40} -25 H${fx - 15} Q${fx - 11} -25 ${fx - 11} -20 V-15 H${fx - 40} Z`, t(o.vagn.f2), 'mark');
      del(ell(fx - 13, -19, 4, 5.5), t('#1a1a1a'), 'mark');
      del(`M${fx - 54} -50 H${fx - 47} V-44 H${fx - 54} Z`, bak(o.vagn.hud), 'mark');
      del(ell(fx - 50, -56, 8, 8.5), t(o.vagn.hud), 'mark');
      del(ell(fx - 44.5, -57, 0.8, 0.8), bak('#2a2018'), 'mark', { inre: true });
      del(`M${fx - 59} -56 Q${fx - 59.5} -70 ${fx - 50} -70 Q${fx - 40.5} -70 ${fx - 41} -57 Z`, t(o.vagn.f3), 'mark');
      del(ell(fx - 50, -72, 3.8, 3.5), t('#f3ead9'), 'mark');
      drag(`M${fx - 46} -40 Q${fx - 34} -33 ${fx - 28} -23`, t(o.vagn.f2), 4.4, { g: 'mark' });
    }

    // --- benen och armarna
    // (en kraftig har kraftigare ben, en smal smalare)
    const lb = 1 + ((o.bred || 1) - 1) * 0.6;
    const ben = (g, f) => {
      const w = (o.vidd || 1) * lb;
      if (o.ben === 'shorts') {
        del(LARP(lb), f(o.hud), g);
        del(SHORTS(w), f(o.byxa), g);
        del(SMAP(lb), f(o.hud), g, { led: 1 });
        if (o.strumpa) del(SOCKA, f(o.strumpa), g, { led: 1 });
      } else {
        const c = o.ben === 'kjol' ? o.strumpa : o.byxa;
        const ww = o.ben === 'kjol' ? 0.9 * lb : w;
        del(LARP(ww), f(c), g);
        del(SMAP(ww), f(c), g, { led: 1 });
      }
      if (o.skoStil === 'inlines') {
        // (inlines: kängan upp över fotleden, skenan och fyra hjul i neon, knäskydd)
        del(`M-6.6 ${GANG.SMA - 15} H6.6 L7.2 ${GANG.SMA + 1} H-6.6 Z`, f(o.sko), g, { led: 1 });
        if (o.skydd) del(ell(2.6, 3, 6.4, 6), f(o.skydd), g, { led: 1 });
        del('M-6.6 -5 H5 Q15.5 -4.5 17 2.5 V6.5 H-7.2 Q-7.6 0 -6.6 -5 Z', f(o.sko), g, { led: 2 });
        del('M-6.5 6 H16 V9.2 H-6.5 Z', f('#3a3a40'), g, { led: 2 });
        const hj = new Path2D();
        for (const x of [-4.2, 2.4, 9, 15]) hj.ellipse(x, 11.8, 3.2, 3.2, 0, 0, 2 * Math.PI);
        del(hj, f(o.hjul || '#e8d84a'), g, { led: 2 });
        return;
      }
      if (o.skoStil === 'stovel') del(STOVEL, f(o.sko), g, { led: 1 });
      else if (o.skoStil === 'kanga') del(KANGA, f(o.sko), g, { led: 1 });
      del(o.skoStil === 'sneaker' ? SNEAKER : SKO, f(o.sko), g, { led: 2 });
      if (o.skoStil === 'sneaker') drag('M-7 4.2 H17', f('#8a8a88'), 1.2, { g, led: 2, inre: true });
      if (o.dm) drag('M-6.5 4.2 H16', f('#c8a83a'), 0.8, { g, led: 2, inre: true });
      if (o.skoStil === 'stovel') drag(`M-5.6 ${GANG.SMA - 21} H6`, f('#000000'), 1, { g, led: 1, inre: true, a: 0.3 });
    };
    // något som hänger i handen: plastpåsen och portföljen
    const hanger = (g, f, x) => {
      const h = o.hang;
      const y = { ...x, led: 1, hang: true };
      if (h.typ === 'pase') {
        drag('M-5 7 Q-3 -3 0 -1 Q3 -3 5 7', f(h.f), 1.6, { g, ...y });
        del('M-11 5 H11 Q13 22 11 38 Q0 41 -11 38 Q-13 22 -11 5 Z', f(h.f), g, y);
        del('M-11.8 13 H11.9 V17.5 H-11.9 Z', f(h.f2), g, { ...y, inre: true });
      } else if (h.typ === 'sport') {
        // (bandybagen med två innebandyklubbor som sticker upp bakåt)
        drag('M-14 16 L-58 -26 M-8 18 L-50 -34', f('#1a1a1a'), 1.8, { g, ...y });
        drag('M-58 -26 l-7 2 M-50 -34 l-7 1', f(h.f2), 3.2, { g, ...y });
        drag('M-8 9 Q-6 -1 0 -1 Q6 -1 8 9', f('#141414'), 1.8, { g, ...y });
        del('M-28 7 H26 Q33 7 33 17 Q33 27 26 27 H-28 Q-35 27 -35 17 Q-35 7 -28 7 Z', f(h.f), g, y);
        drag('M-35 17 H33', f(h.f2), 1.6, { g, ...y, inre: true });
      } else if (h.typ === 'klapp') {
        // (en papperskasse med julklappar i, inslagna med snören som sticker upp)
        del('M-10 -3 H1 V9 H-10 Z', f(h.p1), g, y);
        del('M-2 -7 H9 V9 H-2 Z', f(h.p2), g, y);
        drag('M-4.5 -3 V9 M3.5 -7 V9 M-2 -2 H9', f('#e8c84a'), 1, { g, ...y, inre: true });
        drag('M-6 7 Q-4 -2 0 -1 Q4 -2 6 7', f(h.f), 1.4, { g, ...y });
        del('M-12 5 H12 L11 36 H-11 Z', f(h.f), g, y);
        drag('M-12 9 H12', f('#000000'), 1, { g, ...y, inre: true, a: 0.2 });
      } else if (h.typ === 'stavar') {
        // (skidstavarna, med trissorna nere vid marken)
        drag('M-1 -6 L-15 74 M2 -6 L-9 74', f('#2a2a30'), 1.4, { g, ...y });
        drag('M-17 68 h6 M-11 68 h6', f(h.f), 1.6, { g, ...y });
        del('M-2.5 -9 H3.5 V4 H-2.5 Z', f(h.f), g, y);
      } else {
        drag('M-5 5 Q-5 -1 0 -1 Q5 -1 5 5', f('#141414'), 1.8, { g, ...y });
        del('M-20 4 H20 Q22 4 22 6 V31 Q22 33 20 33 H-20 Q-22 33 -22 31 V6 Q-22 4 -20 4 Z', f(h.f), g, y);
        del(ell(0, 7.5, 1.8, 1.1), f('#b89a4a'), g, { ...y, inre: true });
      }
    };
    // en arm (F närmre, B bortre): pendlar, eller håller något (GREPP); kort ärm, vantar
    const arm = (sida, f) => {
      const gr = sida === 'F' ? o.gF : o.gB;
      const x = gr ? { px: 1, py: -142, rot: GREPP[gr][0], rot2: GREPP[gr][1] } : {};
      const g = gr ? 'fast' : sida === 'F' ? 'armF' : 'armB';
      const kort = stil === 'tshirt';
      del(OVER, f(kort ? o.hud : o.arm), g, x);
      if (kort) del(ARMEL, f(o.arm), g, x);
      if (kort && o.sverige) del('M-6.4 9.6 H6.6 L6.4 13.5 Q0 16 -6.1 13.5 Z', f(o.sverige), g, { ...x, inre: true });
      del(UNDER, f(kort ? o.hud : o.arm), g, { ...x, led: 1 });
      if (o.skydd) del('M-5 19 H5.2 L5 28 H-4.6 Z', f('#1a1a1e'), g, { ...x, led: 1 });
      // (turistkartan uppvikt framför en, med vikarna och en röd ring)
      if (gr === 'karta') {
        const b = { ...x, led: 1, hang: true };
        del('M-6 -22 H24 L23 6 H-5 Z', f('#ece6d2'), g, b);
        drag('M4 -22 L4.5 6 M14 -22 L13.6 6 M-5.5 -8 H23.5', f('#9aa0a8'), 0.8, { g, ...b, inre: true });
        drag('M-2 -16 Q6 -12 9 -4 Q14 0 20 -2', f('#5a8ac8'), 1.2, { g, ...b, inre: true });
        drag(ell(16, -12, 2.6, 2.2), f('#c8322a'), 1, { g, ...b, inre: true });
      }
      if (gr === 'mobil') {
        del('M-3 25 H3.4 V46 H-3 Z', f('#1a1a1e'), g, { ...x, led: 1 });
        drag('M2.4 46 V53', f('#1a1a1e'), 1.2, { g, ...x, led: 1 });
      }
      if (gr === 'glass') del('M-3.3 -3 H3.3 L0 9 Z', f('#c8964a'), g, { ...x, led: 1, hang: true });
      // (pizzakartongen på underarmen, blommorna i papper upprätt framför bröstet)
      if (gr === 'pizza') {
        del('M-27 -5.5 H9 V0.5 H-27 Z', f('#ece6d6'), g, { ...x, led: 1, hang: true });
        del('M-27 -3.2 H9 V-1.8 H-27 Z', f(o.pizza || '#c8322a'), g, { ...x, led: 1, hang: true, inre: true });
      }
      if (gr === 'blommor' && o.blommor) {
        const b = { ...x, led: 1, hang: true };
        for (const [bx, by, c] of [[-6, -27, 0], [1, -31, 1], [7, -26, 2], [-1, -24, 2], [4, -33, 0], [-5, -33, 1]]) del(ell(bx, by, 3.6, 3.4), f(o.blommor[c]), g, b);
        del('M-3.5 7 H3.5 L10.5 -24 Q0 -20 -10.5 -24 Z', f(o.blomPapper || '#e8e0cc'), g, b);
        drag('M-9 -23 Q-12 -29 -10 -33 M9 -23 Q12 -29 10 -32', f('#3a6a2a'), 1.6, { g, ...b });
      }
      // (händerna i fickorna, eller bara den ena: underarmen in mot fickan, utan hand)
      if (gr || !(o.ficka || '').includes(sida)) del(o.vante ? ell(0.4, 31.5, 5.2, 6.4) : ell(0.4, 31, 4.4, 5.6), f(o.vante || o.hud), g, { ...x, led: 1 });
      if (gr === 'glass') del(ell(0, -6.5, 4.6, 4.2), f(o.glassF || '#e8a0b0'), g, { ...x, led: 1, hang: true });
      if (o.hang && o.hang.sida === sida) hanger(g, f, x);
    };
    // paraplyets arm (sträckt och förkortad, som förut)
    const parArm = (f) => {
      del('M-6 0 H6 Q6.5 20 4.6 36 H-4.4 Q-6.5 20 -6 0 Z', f(o.arm), 'fast', { px: 3, py: -140, rot: -38 });
      del(ell(0, 39, 4.4, 5.4), f(o.vante || o.hud), 'fast', { px: 3, py: -140, rot: -38 });
    };

    ben('benB', bak);
    if (o.paraply && o.parHand === 'B') parArm(bak);
    else if (!(o.paraply && o.parHand === 'F' && !o.gB && !o.hang)) arm('B', bak);
    // Bergsprängaren på den bortre axeln, bakom huvudet: två högtalare, kassettluckan, handtaget i den bortre
    // handen och antennen
    if (o.bergs) {
      del('M-54 -168 Q-54 -172 -50 -172 H-2 Q2 -172 2 -168 V-148 Q2 -144 -2 -144 H-50 Q-54 -144 -54 -148 Z', t(o.bergs));
      del(ring(-41, -157, 9, 3.8), bak('#141416'), '', { inre: true });
      del(ring(-11, -157, 9, 3.8), bak('#141416'), '', { inre: true });
      del('M-30 -166 H-22 V-150 H-30 Z', bak('#2a2a30'), '', { inre: true });
      drag('M-44 -172 V-179 H-6 V-172', t('#2a2a30'), 2.4);
      drag('M-1 -172 L10 -198', t('#c8c8c8'), 1);
    }
    // skidorna på den bortre axeln, spetsarna framåt och uppåt, och bindningarna
    if (o.skidor) {
      const sk = (dy) => `M${-96} ${-111 + dy} L90 ${-198 + dy} Q99 ${-205 + dy} 101 ${-198 + dy} L91 ${-193 + dy} L-95 ${-106 + dy} Z`;
      del(sk(0), t(o.skidor));
      del(sk(5), bak(o.skidor));
      drag('M-6 -152 L4 -157 M-4 -147 L6 -152', t('#1a1a1a'), 2.4, { inre: true });
    }
    // (härifrån till huvudet: överkroppen, som dras ut på bredden, bredda)
    const iKropp = D.length;
    // gitarren i mjukt fodral på ryggen, halsen upp bakom huvudet
    if (o.gitarr) {
      del('M-33 -80 Q-37 -99 -28 -110 Q-35 -124 -26 -134 L-15 -190 Q-12 -196 -6.5 -193 L-11 -133 Q-3 -123 -9 -110 Q-1 -97 -10 -80 Q-21 -72 -33 -80 Z', t(o.gitarr));
      drag('M-30 -98 Q-20 -95 -11 -97', bak(o.gitarr), 1.2, { inre: true });
    }
    // ryggsäcken (fyrkantig, med en rund märkesbricka)
    if (o.ryggsack) {
      del('M-28 -141 Q-28 -146 -23 -146 H-11 V-104 H-23 Q-28 -104 -28 -109 Z', t(o.ryggsack));
      del(ell(-19.5, -132, 2.6, 2.6), t('#e8e0c8'), '', { inre: true });
      drag('M-27 -116 H-12', bak(o.ryggsack), 1.2, { inre: true });
    }
    ben('benF', t);

    // --- kroppen
    // (kjolen och en lång kappas skört följer låren, en gång med det främre och en gång med det bakre, så att de
    // vidgas när benen går isär; bäckenet under korta jackor)
    const skort = (d, f, skugga) => {
      del(d, f, 'kjolF');
      del(d, f, 'kjolB');
      if (skugga) del(skugga, '#000000', 'kjolB', { a: 0.2, inre: true });
    };
    if (o.ben === 'kjol') {
      const kn = o.kjolKort ? -70 : -52;
      skort(`M-14.5 -97 H14.5 Q18 -80 20.5 ${kn} Q0 ${kn + 3} -19.5 ${kn} Q-17.5 -80 -14.5 -97 Z`, t(o.kjol));
    } else if (nere < -86) del('M-14 -102 H14 Q15.5 -90 10 -84 Q0 -80 -11 -84 Q-15.5 -90 -14 -102 Z', t(o.byxa));
    const b = stil === 'dun' ? 3.5 : stil === 'kavaj' ? 1.2 : 0;
    const hR = lang ? 19 : 15.5 + b;
    const hL = lang ? -20 : -16.5 - b;
    const sida = stil === 'dun' ? 4 : 0;
    if (lang) {
      skort(`M-15.6 -96 H16.2 L${hR} ${nere} Q0 ${nere + 2.5} ${hL} ${nere} Z`, t(o.rock), `M-15.6 -96 H-12 L-11 ${nere + 1} L${hL} ${nere} Z`);
      del('M-13 -140 Q-16 -151 -7 -152.5 H8 Q16 -151.5 15 -140 L17.2 -84 H-16.9 Z', t(o.rock));
      del('M-13 -140 Q-16 -151 -7 -152.5 L-4 -152 Q-9 -120 -11.6 -84 H-16.9 Z', '#000000', '', { a: 0.2, inre: true });
    } else {
      del(`M${-13 - b} -140 Q${-16 - b} -151 -7 ${r1(-152.5 - b * 0.4)} H8 Q${16 + b} -151.5 ${15 + b} -140 Q${r1(hR + sida)} ${r1((nere - 140) / 2)} ${hR} ${nere} Q0 ${nere + 2.5} ${hL} ${nere} Q${r1(hL - sida)} ${r1((nere - 140) / 2)} ${-13 - b} -140 Z`, t(o.rock));
      del(`M${-13 - b} -140 Q${-16 - b} -151 -7 -152.5 L-4 -152 Q-9 -120 -11 ${nere + 1} L${hL} ${nere} Z`, '#000000', '', { a: 0.2, inre: true });
    }
    // (magen under jackan eller kappan)
    if (o.mage) del(`M13 -141 Q${r1(27 + b)} -124 16.5 -95 L9 -95 L9 -141 Z`, t(o.rock));
    const kant = bak(o.rock);
    if (stil === 'dun') {
      if (o.duo) del(`M${-13 - b} -140 Q${-16 - b} -151 -7 ${r1(-152.5 - b * 0.4)} H8 Q${16 + b} -151.5 ${15 + b} -140 L${r1(15.4 + b)} -126 Q1 -123.5 ${r1(-14.2 - b)} -126 Z`, t(o.duo), '', { inre: true });
      for (const y of [-139, -126, -113, -100]) drag(`M${-15 - b} ${y} Q1 ${y + 2.5} ${16 + b} ${y}`, kant, 1.3, { inre: true });
      del('M-8 -154 H9 V-147 Q1 -145 -8 -147 Z', kant, '', { inre: true });
    } else if (stil === 'vind' || stil === 'trackdrakt') {
      del('M-13 -140 Q-16 -151 -7 -152.5 H8 Q16 -151.5 15 -140 L15.6 -127 Q0 -122 -13.8 -117 Z', t(o.blk[0]), '', { inre: true });
      del('M-14 -112 Q0 -118 15.8 -122 L16 -116.5 Q0 -112.5 -14.2 -106.5 Z', t(o.blk[1]), '', { inre: true });
      drag('M12.5 -151 L15.5 -93', kant, 1, { inre: true });
      drag(`M${hL} ${nere - 3} H${hR}`, kant, 2, { inre: true });
    } else if (stil === 'bomber') {
      del(`M${hL + 0.5} ${nere - 6} H${hR - 0.3} V${nere} Q0 ${nere + 2.5} ${hL + 0.5} ${nere} Z`, kant, '', { inre: true });
      del('M-7 -153.5 H8.5 V-148.5 H-7 Z', kant, '', { inre: true });
      drag('M12 -150 L15 -96', kant, 1, { inre: true });
    } else if (stil === 'skinn') {
      drag('M-4 -152 L5 -138 L10.5 -150.5', kant, 2.2, { inre: true });
      drag('M9 -150 L14.5 -96', t('#9a9a9a'), 0.9, { inre: true, a: 0.6 });
      drag('M-10 -146 Q-12 -125 -12 -100', '#ffffff', 1.6, { inre: true, a: 0.06 + 0.1 * L.dag });
    } else if (stil === 'jeans') {
      drag('M-13 -138 Q1 -134 15.4 -138', kant, 1, { inre: true });
      del('M5 -134 H13 V-126 Q9 -124 5 -126 Z', kant, '', { inre: true });
      drag(`M${hL} ${nere - 4} H${hR}`, kant, 1, { inre: true });
    } else if (stil === 'luv') {
      del('M-15 -151 Q-22 -146 -18 -134 Q-12 -137 -8 -150 Z', kant);
      drag('M3 -112 Q8 -110 14 -111', kant, 1.2, { inre: true });
      drag('M7 -151 V-140 M9.5 -151 V-141', t('#e8e4dc'), 0.8, { inre: true });
    } else if (stil === 'falt') {
      del('M3 -134 H12.5 V-125 H3 Z', kant, '', { inre: true });
      del('M2 -104 H13.5 V-93 H2 Z', kant, '', { inre: true });
      drag('M-5 -152 L2 -136 L9 -151.5', kant, 2, { inre: true });
    } else if (stil === 'kavaj') {
      del('M-1 -152 L5 -137 L9 -151.5 Z', t(o.skjorta || '#e8e4dc'), '', { inre: true });
      if (o.slips) del('M3.2 -150 L5.8 -150 L6.3 -132 L4.5 -129 L3 -132 Z', t(o.slips), '', { inre: true });
      drag('M-3 -152 L4 -136 L6 -112', kant, 1.6, { inre: true });
    } else if (stil === 'tshirt') {
      drag('M-4 -152 Q2 -147 8 -151.5', o.sverige ? t(o.sverige) : kant, o.sverige ? 2.6 : 1.4, { inre: true });
      if (o.tryck) del(ell(6, -128, 5.5, 5.5), t(o.tryck), '', { inre: true });
    } else if (stil === 'skjorta') {
      del('M-3 -153.5 L2.5 -146 L7 -153.5 Z', kant, '', { inre: true });
      drag('M11.5 -150 L14.5 -92', kant, 0.8, { inre: true });
    } else if (stil === 'regn') {
      for (const y of [-140, -126, -112, -98, -84]) del(ell(13.6, y, 0.9, 0.9), kant, '', { inre: true });
      drag('M-11 -144 Q-13 -110 -14 -66', '#ffffff', 1.8, { inre: true, a: 0.08 + 0.12 * L.dag });
    } else if (stil === 'overall') {
      drag('M-12 -135 Q1 -131 15 -135', kant, 1, { inre: true });
    } else {
      drag('M-5 -152 L2 -134 L9 -151.5', kant, 2, { inre: true });
    }
    if (stil === 'kappa' || stil === 'trench') del('M-15.5 -101 H17 V-97 H-15.8 Z', kant, '', { inre: true });
    if (stil === 'trench') {
      del('M5 -101.5 H10 V-96.5 H5 Z', t('#2a2018'), '', { inre: true });
      del(ell(11, -131, 1, 1), kant, '', { inre: true });
      del(ell(11, -118, 1, 1), kant, '', { inre: true });
    }
    // (pälskanten på luvan, som ligger nere bak på axlarna)
    if (o.pals) {
      del('M-16.5 -142 Q-21 -152 -12.5 -157.5 Q-6.5 -160.5 -2.5 -156 Q-6 -154.4 -9 -151.4 Q-13 -147.6 -16.5 -142 Z', t(o.pals));
      drag('M-17.5 -146 Q-17.6 -153.6 -11 -157.6', t(o.pals), 1.4, { inre: true, a: 0.6 });
    }
    if (o.sno) del('M-11.5 -151 Q-4 -155.5 4 -154 Q-2 -152 -11.5 -148.5 Z', t('#eef0f2'), '', { inre: true, a: 0.8 });
    if (o.vaska) { drag('M8 -151 L-11 -104', bak(o.vaska), 2.2); del('M-24 -105 Q-24 -108 -21 -108 H-9 Q-6 -108 -6 -105 V-88 Q-6 -85 -9 -85 H-21 Q-24 -85 -24 -88 Z', t(o.vaska)); }
    if (o.ryggsack) drag('M-9 -151.5 Q4 -150 8 -140 Q9.5 -128 6.5 -118', bak(o.ryggsack), 2.4, { inre: true });
    if (o.gitarr) drag('M-8 -152 Q5 -148 10 -132 Q13 -112 8 -96', t('#1a1a1a'), 2, { inre: true });
    // (nitar på skinnjackans axel och krage)
    if (o.nitar) drag('M-10 -149 h0.1 M-6 -150.5 h0.1 M-2 -151 h0.1 M11 -147 h0.1 M12.4 -141 h0.1 M13.4 -135 h0.1', t('#d8d8d8'), 2, { inre: true });
    // Tidningsbudets reflexväst över jackan, med ränderna som lyser i ljuset på morgonen (lys: mörknar inte)
    if (o.vast) {
      del('M-12.5 -146 Q-13.5 -151.5 -6 -152 L-2 -151 L4 -140 L9 -151.5 Q15 -151 14.6 -146 L15.6 -100 Q1 -98 -13.6 -100 Z', t(o.vast));
      del('M-13.2 -124 H15.2 V-120 H-13.3 Z M-13.5 -111 H15.4 V-107 H-13.6 Z', L.dag < 0.5 ? '#c8ccd0' : t('#d8dce0'), '', { inre: true, lys: L.dag < 0.5 });
    }
    // turistens kamera på magen och magväskan (nittiotalets midjeväska) över höften
    if (o.kamera) {
      drag('M-6 -151 Q2 -140 7 -131', t('#1a1a1a'), 1.1, { inre: true });
      del('M4 -133 H17 Q18 -133 18 -132 V-124 Q18 -123 17 -123 H4 Z', t('#1e1e22'));
      del(ell(18.6, -128, 1.8, 3), t('#3a3a44'), '', { inre: true });
    }
    if (o.mag && !lang) {
      drag('M-13 -103 Q0 -101 6 -102', bak(o.mag), 1.8);
      del('M5 -105 Q5 -110 10 -110 H15 Q20.5 -110 20.5 -104 Q20.5 -97.5 14 -97.5 H10 Q5 -97.5 5 -105 Z', t(o.mag));
      drag('M6 -104.5 Q12.5 -102 20 -104.5', bak(o.mag), 0.9, { inre: true });
    }
    bredda(D, iKropp, o.bred);

    // --- huvudet
    if (HAR_BAK[o.harStil] && o.hatt !== 'luva' && o.hatt !== 'sjal') hd(HAR_BAK[o.harStil], t(o.har));
    hd('M-4.2 -158 H4.2 V-148 H-4.2 Z', bak(o.hud));
    hd(HUVUD, t(o.hud));
    hd(ell(-1.5, -164, 2, 3), bak(o.hud), { inre: true });
    hd(ell(7.6, -166.5, 1, 1), bak('#2a2018'), { inre: true });
    hdr('M5.5 -169.5 Q8 -170.6 10 -169.4', bak(o.har), 1, { inre: true });
    if (o.skagg) hd('M7.8 -159.6 Q10.5 -161.4 13 -160 Q11 -158.4 7.8 -159 Z', t(o.har), { inre: true });
    if (o.harStil === 'svans' && o.hatt !== 'luva' && o.hatt !== 'sjal') hd(ell(-11.5, -169.5, 2.6, 3.3), t(o.snodd || '#d8407a'), { inre: true });
    // håret (under mössan bara det som sticker fram bakom)
    if (!o.hatt || ['basker', 'kepa', 'pannband', 'docker', 'muffar'].includes(o.hatt)) hd(HAR[o.harStil] || HAR.kort, t(o.har));
    const h = o.hatt;
    const hc = t(o.mossa || '#2a2a2a');
    if (h === 'mossa' || h === 'oron' || h === 'slak') {
      // (stickad mössa med uppvikt kant; den slaka slokar bakåt)
      hd(h === 'slak' ? 'M-10.5 -167.5 Q-12 -175 -16.5 -180.5 Q-19 -188.5 -8 -190 Q11.5 -191 11.5 -169.5 Z' : 'M-10.5 -167.5 Q-11.5 -188.5 0.5 -188.5 Q12 -188.5 11.5 -169.5 Z', hc);
      hd('M-11 -172 H12 V-167.6 H-11 Z', bak(o.mossa), { inre: true });
      if (o.mRand) {
        hd('M-10.1 -178.5 Q0.5 -179.6 11 -178.5 L11.3 -175.5 Q0.5 -176.6 -10.4 -175.5 Z', t(o.mRand), { inre: true });
        if (o.mRand2) hd('M-8.4 -183 Q0.5 -184.2 9.4 -183 L10.3 -180.6 Q0.5 -181.8 -9.3 -180.6 Z', t(o.mRand), { inre: true });
      }
      if (h === 'oron') {
        hd('M-7.5 -169 Q-9 -157 -3.5 -154.5 Q0.5 -157.5 0 -169 Z', hc);
        // (jokkmokksmössans snören med en liten tofs)
        if (o.snoren) { hdr('M-3.6 -155 Q-5 -150 -4 -145', hc, 1.1); hd(ell(-4, -144, 1.5, 1.8), t(o.tofsF || o.mossa)); }
      }
      if (o.tofs) hd(ell(0.5, -190.5, 4.2, 4), t(o.tofsF || '#f3ead9'));
      if (o.sno) hd('M-8 -186.5 Q0 -191 8 -186.5 Q0 -188.1 -8 -186.5 Z', t('#eef0f2'), { inre: true, a: 0.8 });
    } else if (h === 'docker') {
      // (den korta sjömansmössan högt upp på huvudet, öronen fria)
      hd('M-9.6 -177 Q-10.4 -190 0.5 -190 Q11 -190 11 -177.5 Z', hc);
      hd('M-10 -180.6 H11.4 V-176.4 H-9.8 Z', bak(o.mossa), { inre: true });
    } else if (h === 'pals') {
      // (pälsmössan, hög med platt topp och uppvikt brätte runt om)
      hd('M-11.5 -166.5 Q-12.8 -183 -9.6 -189 Q0.5 -191.5 10.6 -189 Q13.6 -183 12.8 -167.5 Z', hc);
      hd('M-12.4 -173 Q0.5 -176.5 13.4 -173 L13 -165.4 Q0.5 -168.6 -12 -165.4 Z', bak(o.mossa));
      if (o.sno) hd('M-8 -186.5 Q0 -191 8 -186.5 Q0 -188.1 -8 -186.5 Z', t('#eef0f2'), { inre: true, a: 0.8 });
    } else if (h === 'muffar') {
      // (öronmuffarna: bygeln över huvudet och en luddig muff över örat)
      hdr('M-2.6 -166 Q-4.5 -187.5 3.5 -186.5', bak(o.mossa), 1.4);
      hd(ell(-1.8, -164.5, 4.6, 5.3), hc);
    } else if (h === 'pannband') {
      // (frottébandet runt pannan på den som joggar; i kylan ett stickat pannband som går ner över öronen)
      hd('M-11 -175.5 Q0.5 -179 12.2 -174 L12 -168.6 Q0.5 -173.4 -11.2 -170 Z', hc);
      if (o.stickat) hd('M-11.2 -173 Q-4 -174 0.6 -173.6 Q1.6 -165 -1 -158.4 Q-6 -158 -9 -162.4 Q-11.4 -167 -11.2 -173 Z', hc);
      hdr('M-10.5 -172.6 Q0.5 -176 11.8 -171.2', bak(o.mossa), 0.8, { inre: true, a: 0.5 });
    } else if (h === 'keps') hd('M-10 -167 Q-10 -180 1 -180 Q10.5 -180 11 -171 L19.5 -168.5 Q15 -166 10 -166.5 L-10 -165 Z', hc);
    else if (h === 'kepa') {
      // (sixpence: platt och framåtlutad, med kort skärm)
      hd('M-11 -168.5 Q-12 -178 -3 -180.5 Q9 -182 14 -173.5 L18.5 -170 Q14.5 -168 9.5 -168.6 L-11 -166 Z', hc);
      hdr('M-10 -170.5 Q2 -172.5 13 -172', bak(o.mossa), 0.9, { inre: true });
    } else if (h === 'basker') {
      // (baskern på sned, ner mot ena örat, med en liten stjälk)
      hd('M-12.5 -167 Q-16.5 -176 -7 -181.5 Q3 -186 12 -180.5 Q15.5 -177.5 11 -174 Q1 -171 -12.5 -167 Z', hc);
      hdr('M0.5 -184.5 L1.5 -188', hc, 1.6);
    }
    else if (h === 'bakkeps') {
      hd('M11 -167 Q11 -180 0 -180 Q-9.5 -180 -10 -171 L-18.5 -168.5 Q-14 -166 -9 -166.5 L11 -165 Z', hc);
      hd('M8 -168 Q10 -166 11 -162 Q9 -160.5 7.5 -162 Z', t(o.har), { inre: true });
    } else if (h === 'hatt') {
      hd('M-8 -171 Q-8.5 -187 1.5 -186 Q9.5 -187 9.5 -171 Z', hc);
      hd('M-15 -170.5 Q1 -174.5 18 -170 Q2 -166.5 -15 -170.5 Z', hc);
      hd('M-8 -174 H9.5 V-171 H-8 Z', bak(o.mossa), { inre: true });
    } else if (h === 'fiskar') {
      hd('M-9.5 -170 Q-10 -184 1 -184 Q11.5 -184 11.5 -170 Z', hc);
      hd('M-15 -165.5 L-10 -171.5 H12 L17 -165.5 Q1 -168.5 -15 -165.5 Z', hc);
    } else if (h === 'sydvast') {
      hd('M-10.5 -166 Q-11.5 -185 1 -185 Q12.5 -185 12.5 -168 L16 -166 Q1 -171 -10.5 -166 Z', hc);
      hd('M-10.5 -169 Q-19 -164 -23 -151 Q-15 -156 -7 -162 Z', hc);
      hdr('M4 -167 Q2 -158 6 -154', bak(o.mossa), 1, { inre: true });
    } else if (h === 'luva') {
      hd('M-13 -148 Q-19.5 -163 -13 -179.5 Q-5 -189 5.5 -186.5 Q13.5 -184 13.5 -176 L11.5 -174 Q6 -175.5 4.5 -168.5 Q3.5 -160 5.5 -154.5 Q-2 -150 -13 -148 Z', hc);
      hdr('M11.5 -174 Q6 -175.5 4.5 -168.5 Q3.5 -160 5.5 -154.5', bak(o.mossa), 1.6, { inre: true });
    } else if (h === 'sjal') {
      hd('M-11.5 -156 Q-14.5 -177 -1 -182.5 Q11.5 -183 12 -171 Q8.5 -174 4 -172.5 Q1 -165 3 -156 Q-4 -151 -11.5 -156 Z', hc);
      hd(ell(4.5, -153.5, 2.6, 2.2), bak(o.mossa));
    }
    if (o.glas) {
      hdr(ell(8.6, -166.4, 3, 2.4), t('#2a2a2a'), 0.8, { inre: true });
      hdr('M5.6 -167 L-2 -166', t('#2a2a2a'), 0.8, { inre: true });
    }
    if (o.sol) {
      hd('M4.5 -169 H12.6 L12.2 -165.2 Q9 -163.4 5.2 -165.2 Z', t('#0e0e10'));
      hdr('M4.6 -168 L-2 -166.5', t('#0e0e10'), 1, { inre: true });
    }
    if (o.walkman) {
      hdr('M-2.5 -167 Q-4 -186 3.5 -185', t('#1a1a1a'), 1.6);
      hd(ell(-1.8, -164.5, 3.4, 3.9), t('#e2762a'));
      drag('M-2 -161 Q-6 -140 -8 -104', t('#111111'), 0.6, { inre: true });
      del('M-13 -105 H-5 V-94 H-13 Z', t(o.walkmanF || '#3a3a44'));
    }
    if (o.cigg) {
      hdr('M10.4 -158.4 L17.4 -157.6', t('#ece8e0'), 1.5, { inre: true });
      hd(ell(17.9, -157.6, 0.95, 0.95), '#ff7a2a', { inre: true, lys: true });
      if (L.dag < 0.6) hd(ell(17.9, -157.6, 3.4, 3.4), '#ff8a3a', { inre: true, lys: true, a: 0.25 * (1 - L.dag) });
      hdr('M18 -159.5 q2.5 -6 -0.5 -10 q-3 -5 1 -11', '#cfd3d8', 1.2, { inre: true, a: 0.1 + 0.12 * L.dag });
    }
    if (o.halsduk) {
      // (fram: knuten med en ände fram; bak: änden slängd bakåt över axeln; tva: båda ändarna fram; tjock: lindad
      // tjockt kring halsen)
      const hf = t(o.halsduk);
      const form = o.hForm || 'fram';
      const fram = form === 'fram' || form === 'tva';
      const r2 = o.klubb || o.hRand;
      if (form === 'bak') hd('M-5.5 -153.5 Q-12 -152.5 -14.6 -146 L-16.2 -121.5 L-11.2 -121 L-9.6 -145 Q-8.4 -148.6 -5 -149 Z', hf);
      if (form === 'tva') hd('M0.5 -149 L4.6 -127 L0 -126.4 L-2.6 -148 Z', bak(o.halsduk));
      if (form === 'tjock') {
        hd('M-8 -158.5 Q1 -153.5 10 -158.5 V-145 Q1 -140 -8 -145 Z', hf);
        hdr('M-7.5 -151.6 Q1 -146.8 9.6 -151.6', bak(o.halsduk), 1, { inre: true });
      } else hd('M-7 -156 Q1 -152 9 -156 V-148 Q1 -144 -7 -148 Z', hf);
      if (fram) hd('M4 -149 L10 -121 L4.5 -120 L0.5 -148 Z', hf);
      // (randig: supporterhalsduken i lagets andra färg och andra med ränder, med fransarna; rutig: ett rutmönster)
      if (r2) {
        const f2 = t(r2);
        if (form === 'tjock') hd('M-8 -155 Q1 -150 10 -155 V-153 Q1 -148 -8 -153 Z M-8 -149 Q1 -144 10 -149 V-147 Q1 -142 -8 -147 Z', f2, { inre: true });
        else hd('M-3 -154.6 Q0 -153.4 3 -153.8 V-146 Q0 -145.6 -3 -146.8 Z', f2, { inre: true });
        if (fram) {
          hd('M1.5 -141 H5.7 L6.6 -137 H2.1 Z M2.9 -131 H7.9 L8.7 -127 H3.5 Z', f2, { inre: true });
          hdr('M5 -120 l0.3 3.4 M7 -120.3 l0.3 3.4 M9 -120.6 l0.3 3.4', f2, 1);
        } else if (form === 'bak') {
          hd('M-15.2 -138 L-10.4 -137.6 L-10.6 -133.6 L-15.4 -134 Z M-15.7 -128 L-10.8 -127.6 L-11 -123.6 L-15.9 -124 Z', f2, { inre: true });
          hdr('M-15.6 -121.2 l-0.2 3.4 M-13.6 -121.1 l-0.2 3.4 M-11.6 -121 l-0.2 3.4', f2, 1);
        }
      } else if (o.hRutor) {
        const rut = form === 'tjock' ? 'M-8 -153.6 Q1 -148.6 10 -153.6 M-8 -148.6 Q1 -143.6 10 -148.6 M-4 -157 V-143.4 M3 -155.4 V-142.4'
          : `M-4 -155.2 V-146.8 M3.4 -154.8 V-145.8${fram ? ' M1.6 -143 L6.8 -143.4 M2.6 -135 L8 -135.4 M3.6 -127 L9.2 -127.3 M2.6 -147 L7.4 -121.5' : form === 'bak' ? ' M-15 -140 L-10 -139.6 M-15.5 -131 L-10.6 -130.6 M-13 -147 L-13.6 -121.2' : ''}`;
        hdr(rut, t(o.hRutor), 0.8, { inre: true, a: 0.85 });
      }
    }

    // --- det som hålls framför och den närmre armen
    if (o.tidning) {
      // (uppslagen över huvudet, den närmre halvan hänger ner mot en, med spalter och rubrikens rött)
      del('M-28 -189 Q2 -205 33 -191 L31 -182 Q2 -194 -26 -180 Z', t('#e6e2d6'));
      drag('M-28 -189 Q2 -205 33 -191', t('#b8b4a8'), 1, { inre: true });
      del('M-4 -196.5 L8 -196.8 L7.6 -192.5 L-3.6 -192.2 Z', t('#c8322a'), '', { inre: true });
      drag('M-21 -186.5 Q-12 -191.5 -6 -192.3 M11 -192.6 Q20 -191.4 27 -187.5 M-20 -183.6 Q-12 -188.4 -6 -189.2 M11 -189.5 Q20 -188.4 26.5 -184.6', t('#8a8a84'), 0.9, { inre: true });
    }
    if (o.skate) {
      del('M-34 -110 Q-40 -110 -40 -103 Q-40 -96 -34 -96 H44 Q50 -96 50 -103 Q50 -110 44 -110 Z', t(o.skate));
      del('M-30 -107 H40 V-105 H-30 Z', t(o.skate2 || '#e8e4dc'), '', { inre: true });
      for (const x of [-22, 32]) {
        del(`M${x - 4} -111 H${x + 4} V-95 H${x - 4} Z`, t('#9a9a9a'), '', { inre: true });
        del(ell(x, -112, 3.6, 2.4), t('#ece8e0'));
        del(ell(x, -94, 3.6, 2.4), t('#ece8e0'));
      }
    }
    // käppen, med handtaget i den närmre handen (som håller om det, och ritas efter)
    if (o.kapp) {
      del(`M-1.3 4 H1.3 V${KAPP - 3} H-1.3 Z`, t(o.kapp), 'kapp');
      del(`M-1.9 ${KAPP - 3.5} H1.9 V${KAPP} H-1.9 Z`, t('#141414'), 'kapp');
      del('M-1.4 5 Q-2.4 -3.6 4.6 -4.6 Q10.4 -5 11.4 -0.6 L8.8 0 Q8 -2.2 4.8 -2 Q0.8 -1.6 1.4 5 Z', t(o.kapp), 'kapp');
    }
    // julgranen i nät under den närmre armen, stammen framåt och toppen efter
    if (o.gran) {
      const A = [44, -114]; const B = [-112, -88];
      const ux = B[0] - A[0]; const uy = B[1] - A[1]; const l = Math.hypot(ux, uy);
      const nx = -uy / l; const ny = ux / l;
      const P = (s, w) => `${r1(A[0] + ux * s + nx * w)} ${r1(A[1] + uy * s + ny * w)}`;
      // (bredast en bit från stammen, och lite taggig av grenarna i nätet)
      const bredd = (s, i) => 25 * (1 - s) * Math.min(1, 0.5 + s * 2.4) * (i % 2 ? 0.86 : 1);
      let kant = `M${P(0.03, 0)}`;
      for (let i = 0; i <= 8; i++) { const s = 0.05 + i * 0.115; kant += ` L${P(s, bredd(s, i))}`; }
      kant += ` L${P(1, 0)}`;
      for (let i = 8; i >= 0; i--) { const s = 0.05 + i * 0.115; kant += ` L${P(s, -bredd(s, i))}`; }
      drag(`M${P(-0.06, 0)} L${P(0.05, 0)}`, t('#5a3a22'), 4.2);
      del(`${kant} Z`, t(o.gran));
      let nat = '';
      for (let i = 0; i < 7; i++) { const s = 0.1 + i * 0.12; nat += `M${P(s, -0.85 * bredd(s, 0))} L${P(s + 0.12, 0.85 * bredd(s + 0.12, 0))} M${P(s, 0.85 * bredd(s, 0))} L${P(s + 0.12, -0.85 * bredd(s + 0.12, 0))} `; }
      drag(nat, t('#d8d2c0'), 0.7, { a: 0.45, inre: true });
    }
    if (o.paraply && o.parHand === 'F') parArm(t);
    else arm('F', t);
    if (o.paraply) {
      const p = t(o.paraply);
      const par = { g: 'par' };
      const typ = PARAPLY[o.parTyp];
      if (typ) {
        // (golfparaplyet i två färger, det lilla hopfällbara och bubblan av genomskinlig plast ner över huvudet)
        const bubbla = o.parTyp === 'bubbla';
        drag(`M24 -110 V${r1(typ.topp)}`, bubbla ? t('#3a3a40') : '#141414', bubbla ? 1.4 : 2, par);
        if (bubbla) drag('M24 -110 V-118', '#141414', 3.6, par);
        else drag('M24 -110 q0 8 -6 8', '#141414', 2.4, par);
        del(typ.duk, bubbla ? t('#dfe9ef') : p, 'par', bubbla ? { a: 0.3 } : {});
        if (o.paraply2) del(typ.kilar, t(o.paraply2), 'par', { inre: true });
        drag(typ.sprot, bubbla ? t('#ffffff') : '#000000', bubbla ? 0.7 : 1.3, { a: bubbla ? 0.35 : 0.22, inre: true, g: 'par' });
        if (bubbla) drag(typ.duk, p, 1.4, { a: 0.85, inre: true, g: 'par' });
        drag(`M24 ${r1(typ.topp)} v-7`, '#141414', 2, par);
        const s = typ.spets;
        if (o.droppar) drag(s.filter((_, i) => i % 2 === 0).map(([x, y]) => `M${r1(x)} ${r1(y + 2)} v${5 + ((x * 7) % 4)}`).join(' '), '#cfdcf0', 1.2, { a: 0.35, inre: true, g: 'par' });
      } else if (o.vand) {
        // (vänt ut och in av vinden)
        drag('M24 -110 V-212', '#141414', 2, par);
        drag('M24 -110 q0 8 -6 8', '#141414', 2.4, par);
        del('M-34 -252 C-26 -226 4 -211 24 -210 C44 -211 74 -226 82 -252 Q66 -240 56 -248 Q44 -236 24 -242 Q4 -236 -8 -248 Q-18 -240 -34 -252 Z', p, 'par');
        drag('M24 -211 L-34 -252 M24 -211 L-8 -248 M24 -211 L56 -248 M24 -211 L82 -252', '#000000', 1.4, { a: 0.3, inre: true, g: 'par' });
      } else {
        drag('M24 -110 V-243', '#141414', 2, par);
        drag('M24 -110 q0 8 -6 8', '#141414', 2.4, par);
        del('M-42 -206 C-38 -229 -8 -243 24 -243 C56 -243 86 -229 90 -206 Q82 -212 74 -206 Q66 -213 57 -206 Q49 -213 41 -206 Q32 -213 24 -206 Q16 -213 7 -206 Q-1 -213 -9 -206 Q-17 -213 -26 -206 Q-34 -212 -42 -206 Z', p, 'par');
        drag('M24 -243 L-42 -206 M24 -243 L-9 -206 M24 -243 L24 -206 M24 -243 L57 -206 M24 -243 L90 -206', '#000000', 1.4, { a: 0.25, inre: true, g: 'par' });
        drag('M24 -243 V-251', '#141414', 2, par);
        drag('M-30 -226 C-14 -238 6 -241 24 -241', '#ffffff', 2.4, { a: 0.06 + 0.16 * L.dag, inre: true, g: 'par' });
        if (o.droppar) drag('M-42 -204 v6 M7 -204 v9 M57 -204 v5 M90 -204 v8', '#cfdcf0', 1.2, { a: 0.35, inre: true, g: 'par' });
      }
    }

    // --- det som går före: hunden i kopplet, barnvagnen, cykeln
    if (o.hund) {
      const hu = o.hund;
      const S = HUNDAR[hu.typ];
      const [kx0, ky, rx, ry] = S.kr;
      const kx = kx0 + S.x0;
      const [hx0, hy, hr] = S.hu;
      const hx = hx0 + S.x0;
      const c = t(hu.f);
      const cb = bak(hu.f);
      const kb = { n: S.n, lb: -ky };
      const kd = (d, f, x = {}) => del(d, f, 'hkropp', { ...kb, ...x });
      skugga(kx + 4, rx + 12);
      const topp = ky + ry * 0.3;
      const lb = -topp;
      // (frambenet rakt med tassen framåt, bakbenet brett upptill och knyckt i hasen)
      const w = S.ben;
      const tass = `L${r1(0.36 * w)} ${r1(lb - 2.4)} Q${r1(0.36 * w + 2.6)} ${r1(lb - 2.4)} ${r1(0.36 * w + 3)} ${r1(lb)} H${r1(-0.4 * w)}`;
      const fram = `M${r1(-w / 2)} 0 H${r1(w / 2)} ${tass} Z`;
      const bakben = `M${r1(-0.8 * w)} 0 H${r1(0.6 * w)} Q${r1(0.7 * w)} ${r1(0.35 * lb)} ${r1(0.1 * w)} ${r1(0.62 * lb)} ${tass} L${r1(-0.45 * w)} ${r1(0.66 * lb)} Q${r1(-0.95 * w)} ${r1(0.4 * lb)} ${r1(-0.8 * w)} 0 Z`;
      const bx = [kx - rx * 0.68, kx + rx * 0.7];
      // (travet: bortre bak med närmre fram, och tvärtom)
      del(bakben, cb, 'hund', { px: bx[0] + 3, py: topp, hund: { n: S.n, lb, fas: 0.5 } });
      del(fram, cb, 'hund', { px: bx[1] + 3, py: topp, hund: { n: S.n, lb, fas: 0 } });
      // svansen
      if (hu.typ === 'schafer') kd(`M${kx - rx * 0.92} ${ky - ry * 0.5} Q${kx - rx * 1.32} ${ky - ry * 0.1} ${kx - rx * 1.36} ${ky + ry * 1.6} Q${kx - rx * 1.2} ${ky + ry * 1.5} ${kx - rx * 1.1} ${ky + ry * 0.4} Z`, c);
      else if (hu.typ === 'terrier') drag(`M${kx - rx * 0.88} ${ky - ry * 0.4} l-2 -9`, c, 3.2, { g: 'hkropp', ...kb });
      else if (hu.typ === 'pudel') { drag(`M${kx - rx * 0.9} ${ky - ry * 0.4} l-5 -9`, c, 1.8, { g: 'hkropp', ...kb }); kd(ell(kx - rx * 0.9 - 5.5, ky - ry * 0.4 - 10, 3.6, 3.6), c); }
      else if (hu.typ === 'cocker') drag(`M${kx - rx * 0.92} ${ky - ry * 0.5} l-6 -4`, c, 3, { g: 'hkropp', ...kb });
      else drag(`M${kx - rx * 0.95} ${ky - ry * 0.35} Q${kx - rx * 1.4} ${ky - ry * (hu.typ === 'tax' ? 1.2 : 0.1)} ${kx - rx * (hu.typ === 'tax' ? 1.45 : 1.38)} ${ky + ry * (hu.typ === 'tax' ? -0.9 : 1.3)}`, c, hu.typ === 'tax' ? 2 : hu.typ === 'dalm' ? 2.6 : 3.8, { g: 'hkropp', ...kb });
      // kroppen, halsen och huvudet
      kd(`M${r1(kx - rx * 1.07)} ${r1(ky - ry * 0.4)} Q${r1(kx - rx * 1.04)} ${r1(ky - ry * 1.05)} ${r1(kx - rx * 0.74)} ${r1(ky - ry * 1.05)} L${r1(kx + rx * 0.6)} ${r1(ky - ry * 1.12)} Q${r1(kx + rx * 0.96)} ${r1(ky - ry * 1.05)} ${r1(kx + rx * 1.07)} ${r1(ky + ry * 0.15)} Q${r1(kx + rx * 1.07)} ${r1(ky + ry * 0.95)} ${r1(kx + rx * 0.78)} ${r1(ky + ry * 1.05)} Q${r1(kx + rx * 0.2)} ${r1(ky + ry * 0.72)} ${r1(kx - rx * 0.33)} ${r1(ky + ry * 0.72)} Q${r1(kx - rx * 0.67)} ${r1(ky + ry * 1.1)} ${r1(kx - rx * 0.93)} ${r1(ky + ry * 0.9)} Q${r1(kx - rx * 1.15)} ${r1(ky + ry * 0.5)} ${r1(kx - rx * 1.07)} ${r1(ky - ry * 0.4)} Z`, c);
      kd(`M${kx + rx * 0.5} ${ky - ry * 0.8} L${hx - 2} ${hy - hr * 0.6} L${hx + 2} ${hy + hr * 0.6} L${kx + rx * 0.9} ${ky + ry * 0.3} Z`, c);
      if (hu.f2) kd(ell(kx - 3, ky - ry * 0.45, rx * 0.78, ry * 0.55), t(hu.f2), { inre: true });
      kd(ell(hx, hy, hr, hr * 0.92), c);
      // (dalmatinerns prickar, på kroppen och huvudet)
      if (hu.prickar) {
        const pr = new Path2D();
        for (const [a, b2, r] of [[-0.7, -0.5, 2.4], [-0.35, 0.1, 2], [0, -0.6, 2.6], [0.3, 0.2, 1.8], [0.55, -0.55, 2.2], [-0.15, -0.95, 1.6], [0.8, 0.1, 1.6], [-0.9, 0.2, 1.6]]) {
          const x = kx + rx * a; const y = ky + ry * b2;
          pr.moveTo(x + r, y);
          pr.ellipse(x, y, r, r * 0.8, 0, 0, 2 * Math.PI);
        }
        pr.moveTo(hx + 1.6, hy - 4);
        pr.ellipse(hx, hy - 4, 1.6, 1.3, 0, 0, 2 * Math.PI);
        kd(pr, t(hu.prickar), { inre: true });
      }
      if (hu.typ === 'pudel') { kd(ell(hx - 1, hy - hr * 0.95, 5, 4.4), c); kd(ell(kx + rx * 0.55, ky - ry * 0.3, 7, 8), c); }
      const nos = {
        lab: `M${hx + 4} ${hy - 3.5} L${hx + 15} ${hy} Q${hx + 16.5} ${hy + 5} ${hx + 12} ${hy + 6} L${hx + 3} ${hy + 6.5} Z`,
        schafer: `M${hx + 4} ${hy - 3.5} L${hx + 17} ${hy + 2} L${hx + 15} ${hy + 5.5} L${hx + 3} ${hy + 5} Z`,
        tax: `M${hx + 3} ${hy - 2.5} L${hx + 13} ${hy + 1.5} L${hx + 12} ${hy + 4} L${hx + 2} ${hy + 4} Z`,
        terrier: `M${hx + 4} ${hy - 2} L${hx + 10} ${hy + 1} Q${hx + 10.5} ${hy + 6.5} ${hx + 5} ${hy + 6.5} Z`,
        pudel: `M${hx + 3} ${hy - 2} L${hx + 12} ${hy + 1} L${hx + 11} ${hy + 3.5} L${hx + 3} ${hy + 3.5} Z`,
        dalm: `M${hx + 4} ${hy - 3.2} L${hx + 14.6} ${hy + 0.4} Q${hx + 15.6} ${hy + 4.6} ${hx + 11.6} ${hy + 5.4} L${hx + 3} ${hy + 5.6} Z`,
        cocker: `M${hx + 3} ${hy - 2.6} L${hx + 11} ${hy + 0.6} Q${hx + 11.5} ${hy + 5} ${hx + 7} ${hy + 5.4} L${hx + 2} ${hy + 5} Z`,
      }[hu.typ];
      kd(nos, c);
      const spets = { lab: [15.5, 1], schafer: [16.5, 2.4], tax: [12.6, 2], terrier: [10, 1.6], pudel: [11.8, 1.6], dalm: [15.2, 1.4], cocker: [10.6, 1.4] }[hu.typ];
      kd(ell(hx + spets[0], hy + spets[1], 1.6, 1.4), t('#0a0a0a'), { inre: true });
      kd(ell(hx + 2.6, hy - 2.4, 0.9, 0.9), t('#0a0a0a'), { inre: true });
      if (hu.typ === 'schafer' || hu.typ === 'terrier') {
        const hh = hu.typ === 'schafer' ? 10 : 6;
        kd(`M${hx - 4.5} ${hy - hr * 0.55} L${hx - 2.5} ${hy - hr * 0.6 - hh} L${hx + 1.5} ${hy - hr * 0.75} Z`, c);
      } else {
        // (hängande öron; cockerns långa och lockiga)
        const ln = hu.typ === 'cocker' ? 1.9 : 0.95;
        kd(`M${hx - 1} ${hy - hr * 0.85} Q${hx - 7 - ln} ${hy - 3} ${hx - 4.5 - ln} ${r1(hy + hr * ln)} Q${hx - 0.5} ${r1(hy + hr * (ln + 0.05))} ${hx + 1.5} ${hy - 2} Z`, cb, { inre: true });
      }
      if (hu.tacke) kd(`M${kx - rx * 0.85} ${ky - ry * 0.2} Q${kx - rx * 0.9} ${ky - ry * 1.18} ${kx} ${ky - ry * 1.18} Q${kx + rx * 0.7} ${ky - ry * 1.18} ${kx + rx * 0.74} ${ky - ry * 0.1} Q${kx} ${ky + ry * 0.5} ${kx - rx * 0.85} ${ky - ry * 0.2} Z`, t(hu.tacke));
      // halsbandet och kopplet
      const cx = kx + rx * 0.76; const cy = ky - ry * 0.45;
      drag(`M${kx + rx * 0.62} ${ky - ry * 1.02} L${kx + rx * 0.9} ${ky + ry * 0.05}`, t(hu.halsband || '#b8322a'), 1.8, { g: 'hkropp', ...kb, inre: true });
      del(bakben, c, 'hund', { px: bx[0] - 1, py: topp, hund: { n: S.n, lb, fas: 0 } });
      del(fram, c, 'hund', { px: bx[1] - 1, py: topp, hund: { n: S.n, lb, fas: 0.5 } });
      const [ax, ay] = handVid(GREPP.koppel);
      drag(`M${r1(ax)} ${r1(ay)} Q${r1((ax + cx) / 2)} ${r1(Math.max(ay, cy) + 10)} ${r1(cx)} ${r1(cy)}`, t('#1a1a1a'), 1.5);
    }
    if (o.vagn && o.vagn.typ === 'rullator') {
      // (rullatorn: handtagen, ramen ned till fyra hjul, sitsen och korgen med en kasse i)
      const [hx, hy] = handVid(GREPP.rull);
      const x0 = Math.round(hx + 3);
      const x1 = x0 + 50;
      const f = t(o.vagn.f);
      const m = { g: 'mark' };
      skugga((x0 + x1) / 2, 32);
      drag(`M${r1(hx + 4)} ${r1(hy)} L${x0} -10 M${r1(hx + 4)} ${r1(hy + 3)} Q${x0 + 30} ${r1(hy + 6)} ${x1} -10 M${x0 + 2} -52 H${x1 - 13}`, f, 2.6, m);
      del(`M${r1(hx - 5)} ${r1(hy - 2.4)} H${r1(hx + 6)} V${r1(hy + 2.4)} H${r1(hx - 5)} Z`, t('#1a1a1a'), 'mark');
      del(`M${x0 + 4} -55 H${x1 - 16} V-50 H${x0 + 4} Z`, t('#2a2a2e'), 'mark');
      del(`M${x0 + 16} -82 H${x1 - 4} L${x1 - 8} -60 H${x0 + 19} Z`, t(o.vagn.korg), 'mark', { a: 0.85 });
      drag(`M${x0 + 18} -75 H${x1 - 5} M${x0 + 18.5} -68 H${x1 - 6.5} M${x0 + 26} -82 L${x0 + 27} -60 M${x0 + 36} -82 L${x0 + 35} -60`, bak(o.vagn.korg), 0.8, { g: 'mark', inre: true });
      if (o.vagn.kasse) del(`M${x0 + 20} -80 Q${x0 + 24} -94 ${x0 + 31} -92 Q${x0 + 37} -90 ${x1 - 10} -80 Z`, t(o.vagn.kasse), 'mark');
      hjul(x0, 10, '#1a1a1a', '#9a9a9a', 5);
      hjul(x1, 10, '#1a1a1a', '#9a9a9a', 5);
    }
    if (o.vagn && o.vagn.typ === 'barnvagn') {
      const [hx, hy] = handVid(GREPP.vagn);
      const x0 = Math.round(hx + 14);
      const x1 = x0 + 78;
      const f = t(o.vagn.f);
      skugga((x0 + x1) / 2, 46);
      drag(`M${r1(hx)} ${r1(hy)} L${x0 + 6} -86 M${x0 + 8} -58 L${x0 + 14} -17 M${x1 - 8} -58 L${x1 - 12} -17 M${x0 + 14} -32 H${x1 - 12}`, t('#2a2a2e'), 2.4, { g: 'mark' });
      del(`M${r1(hx - 3)} ${r1(hy - 2.6)} H${r1(hx + 4)} V${r1(hy + 2.6)} H${r1(hx - 3)} Z`, t('#1a1a1a'), 'mark');
      del(`M${x0} -90 Q${x0 - 2} -62 ${x0 + 10} -55 H${x1 - 8} Q${x1 + 3} -60 ${x1} -86 Q${x1 - 1} -91 ${x1 - 7} -91 H${x0 + 4} Z`, f, 'mark');
      drag(`M${x0 + 1} -71 H${x1 + 0.5}`, t(o.vagn.f2), 2.2, { g: 'mark', inre: true });
      del(`M${x0 - 1} -90 Q${x0 + 1} -121 ${x0 + 30} -123 Q${x0 + 41} -110 ${x0 + 40} -90 Z`, bak(o.vagn.f), 'mark');
      drag(`M${x0 + 8} -91 Q${x0 + 10} -114 ${x0 + 30} -118 M${x0 + 20} -91 Q${x0 + 21} -108 ${x0 + 33} -113`, '#000000', 1.2, { g: 'mark', a: 0.3, inre: true });
      hjul(x0 + 14, 16, '#1a1a1a', '#c8c8c8', 7);
      hjul(x1 - 12, 16, '#1a1a1a', '#c8c8c8', 7);
      if (o.vagn.skydd) {
        del(`M${x0 - 3} -89 Q${x0 - 1} -126 ${x0 + 30} -127 Q${x0 + 50} -122 ${x1 + 2} -92 Q${x1 + 4} -70 ${x1 - 4} -56 H${x0 + 6} Q${x0 - 5} -62 ${x0 - 3} -89 Z`, t('#d8e6f0'), 'mark', { a: 0.22 });
        drag(`M${x0 + 6} -112 Q${x0 + 20} -122 ${x0 + 36} -121`, '#ffffff', 1.6, { g: 'mark', a: 0.12 + 0.2 * L.dag, inre: true });
      }
    }
    if (o.vagn && o.vagn.typ === 'cykel') {
      const [gx, gy] = handVid(GREPP.cykel);
      const fr = t(o.vagn.f);
      const ml = t('#a8a8a8');
      const m = { g: 'mark' };
      skugga(16, 64);
      hjul(-38, 33, '#1a1a1a', '#b0b0b0', 9);
      hjul(70, 33, '#1a1a1a', '#b0b0b0', 9);
      drag('M-72 -45 A36 36 0 0 1 -8 -53 M36 -45 A36 36 0 0 1 100 -53', fr, 2.6, m);
      drag('M61 -78 Q34 -42 8 -30 M8 -30 L-8 -84 M8 -30 L-38 -33 M-6 -78 L-38 -33 M58 -92 L61 -78 M61 -78 Q66 -55 70 -33', fr, 3.2, m);
      drag(`M58 -92 L57 -100 Q52 -104 ${r1(gx)} ${r1(gy)}`, t('#1a1a1a'), 2.4, m);
      drag('M-8 -84 L-9 -88', ml, 2, m);
      drag('M-6 -80 L-56 -76 M-50 -76 L-38 -33', ml, 1.6, m);
      del('M-20 -89 Q-10 -94 1 -90 Q0 -86 -4 -86 H-18 Q-21 -86 -20 -89 Z', t('#2a1c14'), 'mark');
      del('M-38 -36 Q-15 -39.5 12 -36 Q15 -30 12 -26 Q-14 -27 -38 -30 Z', fr, 'mark');
      drag('M8 -30 L13 -17', ml, 2, m);
      del('M9 -18.5 H18 V-15.5 H9 Z', t('#1a1a1a'), 'mark');
      del(ell(64, -96, 3, 3), t('#d8d8d0'), 'mark');
      if (o.vagn.korg) {
        del('M62 -110 H86 L83 -88 H64 Z', t(o.vagn.korg), 'mark');
        drag('M63 -103 H85 M63.5 -96 H84 M70 -110 L69.5 -88 M78 -110 L77 -88', bak(o.vagn.korg), 0.9, { g: 'mark', inre: true });
      }
    }
    return morkna(D);
  }
  // Någon som har stannat framför fönstret och tittar in, med ryggen mot en.
  function bakDelar(o, L) {
    const t = klarL(L);
    const bak = (c) => mix(t(c), '#000000', 0.32);
    const D = [];
    const del = (d, f, x = {}) => D.push({ d: typeof d === 'string' ? new Path2D(d) : d, f, g: '', ...x });
    // (benen och skorna är ett steg mörkare på kvällen, benSteg)
    del('M-11.5 -90 H-1 L-2 -4 H-9.5 Z M1 -90 H11.5 L9.5 -4 H2 Z', t(o.byxa), { nere: true });
    del('M-11 -5 H-1 V0 H-12 Z M1 -5 H11 L12 0 H1 Z', t(o.sko), { nere: true });
    // (en kort jacka slutar vid höften, en kappa vid knäna)
    const nere = o.stil && HEM[o.stil] < -70 ? HEM[o.stil] + 2 : -46;
    del(`M-17 -141 Q-19 -152 -9 -154 H9 Q19 -152 17 -141 L20 ${nere} Q0 ${nere + 4} -20 ${nere} Z`, t(o.rock));
    D.push({ d: new Path2D(`M0 -150 V${nere}`), s: bak(o.rock), w: 1.6, g: '', inre: true });
    del('M-17 -141 Q-23 -112 -20 -84 L-13 -85 Q-15 -112 -12 -136 Z M17 -141 Q23 -112 20 -84 L13 -85 Q15 -112 12 -136 Z', bak(o.rock));
    bredda(D, 0, o.bred);
    del('M-4.6 -159 H4.6 V-150 H-4.6 Z', bak(o.hud));
    del(ell(-10, -166, 2, 3.2), t(o.hud));
    del(ell(10, -166, 2, 3.2), t(o.hud));
    del(ell(0, -167, 10, 12), t(o.har));
    if (o.harStil === 'tupp' && !o.mossa) del('M-2.6 -176 L-3.4 -194 L0 -187 L3.4 -195 L2.6 -176 Z', t(o.har));
    if (o.halsduk) del('M-8 -157 Q0 -153 8 -157 V-149 Q0 -145 -8 -149 Z', t(o.halsduk));
    if (o.mossa) { del('M-10.5 -166 Q-11.5 -186 0 -186 Q11.5 -186 10.5 -166 Z', t(o.mossa)); del('M-11 -170 H11 V-165.5 H-11 Z', bak(o.mossa), { inre: true }); }
    return morkna(D);
  }

  // Delarna i ställningen P (stalln): allt utom hunden och det på marken gungar med höften, benen vrids i
  // höften, knät och fotleden (led 0, 1, 2), kappans och kjolens skört i höften med låren, överkroppen lutar
  // kring höften, armarna vrids i axeln och armbågen (och hänger lodrätt fast överkroppen lutar), och det som
  // sitter fast har sina egna vinklar. Det som hänger i handen vrids tillbaka så att det hänger rakt ner.
  // Hundens ben travar efter hur långt den har gått (tassen står still halva varvet och lyfts fram i den
  // andra), och hjulen rullar. rand: bara konturen, lineWidth rand (ljuset i kanten), annars fyllt med alfa A
  // (kontur: bara det som syns i siluetten, för speglingen) i mörkersteget z (morkna).
  // (zBen: hur mörka benen, hunden och det på marken är, MORK, när de står framför något mörkare än resten av
  // figuren; annars z som allt annat. Benen hos den som står och tittar in, bakDelar, har nere.)
  const NERE = new Set(['benF', 'benB', 'mark', 'hund', 'hkropp']);
  function ritaDelar(c, D, P, A, rand, kontur = false, z = 0, zBen = null) {
    for (const p of D) {
      if ((rand || kontur) && p.inre) continue;
      if (kontur && p.s) continue;
      c.save();
      const g = p.g;
      if (g === 'hund') {
        c.translate(p.px, p.py);
        if (P.p != null) {
          const h = p.hund;
          let q = h.n * P.p + h.fas;
          q -= Math.floor(q);
          const E = P.S / (4 * h.n);
          const s = (q - 0.5) / 0.5;
          const x = q < 0.5 ? E * (1 - 4 * q) : -E + 2 * E * s * s * (3 - 2 * s);
          const y = h.lb - (q < 0.5 ? 0 : 0.3 * h.lb * Math.sin(Math.PI * s));
          c.rotate(-Math.atan2(x, y));
          c.scale(1, Math.hypot(x, y) / h.lb);
        }
      } else if (g === 'hkropp') {
        if (P.p != null) c.translate(0, -0.035 * p.lb * Math.abs(Math.sin(2 * Math.PI * p.n * P.p)));
      } else if (g === 'hjul') {
        c.translate(p.px, p.py);
        c.rotate(P.d / p.r);
      } else if (g === 'kapp') {
        // (käppen: handtaget och vinkeln räknas i stalln, kappen; stilla lodrätt bredvid)
        if (P.kapp) {
          c.translate(P.kapp[0], P.kapp[1]);
          c.rotate(P.kapp[2]);
        } else c.translate(14, -KAPP);
      } else if (g !== 'mark') {
        c.translate(P.bx, P.by);
        if (g === 'benF' || g === 'benB') {
          const b = g === 'benF' ? P.F : P.B;
          c.translate(0, -GANG.HOFT);
          c.rotate(b[0]);
          if (p.led) { c.translate(0, GANG.LAR); c.rotate(b[1]); }
          if (p.led > 1) { c.translate(0, GANG.SMA); c.rotate(b[2]); }
        } else if (g === 'kjolF' || g === 'kjolB') {
          c.translate(0, -GANG.HOFT);
          c.rotate(g === 'kjolF' ? P.kF : P.kB);
          c.translate(0, GANG.HOFT);
        } else if (P.lut) {
          c.translate(0, -GANG.HOFT);
          c.rotate(P.lut);
          c.translate(0, GANG.HOFT);
        }
        // (huvudet framskjutet eller nerdraget mellan axlarna, och böjt eller med nick; halsen följer med)
        if (g === 'huvud') {
          if (P.hx || P.hy) c.translate(P.hx || 0, P.hy || 0);
          if (P.nick) {
            c.translate(0, -152);
            c.rotate(P.nick);
            c.translate(0, 152);
          }
        }
        if (g === 'armF' || g === 'armB') {
          const a = g === 'armF' ? P.aF : P.aB;
          c.translate(1 + ((g === 'armF' ? P.sF : P.sB) || 0), -142 + (P.sy || 0));
          c.rotate(a[0] - P.lut);
          if (p.led) { c.translate(0, 29); c.rotate(a[1]); }
          if (p.hang) { c.translate(0.4, 31); c.rotate(-(a[0] + a[1]) * 0.85); }
        } else if (g === 'fast') {
          c.translate(p.px, p.py + (P.sy || 0));
          c.rotate(p.rot * DEG - P.lut);
          if (p.led) { c.translate(0, 29); c.rotate(p.rot2 * DEG); }
          if (p.hang) { c.translate(0.4, 31); c.rotate(-(p.rot + p.rot2) * DEG); }
        } else if (g === 'par') { c.translate(24, -110); c.rotate(P.par - P.lut); c.translate(-24, 110); }
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
        const zz = zBen != null && (NERE.has(g) || p.nere) ? zBen : z;
        c.fillStyle = zz && p.fz ? p.fz[zz] : p.f;
        c.fill(p.d);
      }
      c.restore();
    }
  }

  // På kvällen är den som går lika mörk som mörkret där den går: utan det var en ljus rock i mörkret ljusare än
  // väggen bakom (som kvällens mask mörkar) och såg genomskinlig ut, som ett spöke. Fyra steg av samma färger
  // (MORK, fz på varje del: morkna i figurDelar och bakDelar), från 0 framför fönstret, dörren och lyktorna.
  const MORK = [0, 0.25, 0.45, 0.62];
  function morkna(D) {
    // (det som lyser, glöden i cigaretten, mörknar inte)
    for (const p of D) if (p.f && !p.lys) p.fz = MORK.map((m) => mix(p.f, '#030305', m));
    return D;
  }
  function morkSteg(x, L) {
    if (L.dag > 0.6) return 0;
    const nara = (a, b, f) => { const d = x < a ? a - x : x > b ? x - b : 0; return Math.max(0, 1 - d / f); };
    let n = Math.max(nara(FON.x, FON.x + FON.w, 160), nara(DORR.x, DORR.x + DORR.w, 120));
    if (L.lampor) n = Math.max(n, 0.6 * nara(300, 380, 150), 0.8 * nara(1640, 1800, 220));
    return Math.round((1 - L.dag / 0.6) * (1 - n) * 3);
  }

  // Benen (och hunden och det på marken) ett steg mörkare än resten på kvällen: skyltfönstrets ljus är bakom
  // överkroppen, men under fönsterbänken är bröstningen mörk, och lyktorna lyser uppifrån. Framför dörren, vars
  // glas går nästan ned till stenen, är benen som resten.
  function benSteg(x, z, L) {
    if (L.dag > 0.4 || z >= 3) return null;
    if (x > DORR.x - 20 && x < DORR.x + DORR.w + 20) return null;
    return z + 1;
  }

  // Hur mycket ljus det är bakom den som går, i kanten (0 … 1): starkast framför fönstret och dörren, lite vid
  // lyktorna, inget på dagen. (Var på figuren: kantRuta.)
  function randLjus(x, L) {
    if (L.dag > 0.6) return 0;
    const nara = (a, b, f) => { const d = x < a ? a - x : x > b ? x - b : 0; return Math.max(0, 1 - d / f); };
    let n = Math.max(nara(FON.x, FON.x + FON.w, 150), nara(DORR.x, DORR.x + DORR.w, 110));
    if (L.lampor) n = Math.max(n, 0.55 * nara(300, 380, 170), 0.6 * nara(1690, 1750, 280));
    return (1 - L.dag / 0.6) * (0.04 + 0.96 * n);
  }
  // under lyktan vid porten eller gatlyktan på bron
  const underLykta = (x, L) => L.lampor && ((x > 140 && x < 540) || (x > 1440 && x < 2000));

  // En figur i världen: fötterna i (x, y), k gånger centimetrarna, dir 1 åt höger och −1 åt vänster; var
  // i gångens varv av hur långt den har gått (x), så att foten i marken står still. spegel: upp och ned i den
  // våta stenen, svagt.
  function ritaFigur(c, f, D, x, y, t, L, ut) {
    const st = f.stil || stilVanlig();
    const P = f.sta ? STAR : stalln((f.dir * x) / (st.S * f.k) + (f.gfas || 0), st);
    c.save();
    if (ut.spegel) {
      c.translate(x, y);
      c.scale(f.dir * f.k, -f.k * 0.85);
      ritaDelar(c, D, P, ut.spegel, 0, true);
      c.restore();
      return;
    }
    // Kantljuset bara där ljuset är bakom den som går (kantRuta): där den står framför skyltfönstrets och dörrens
    // glas, och under lyktorna på huvudet och axlarna. Förut låg det runt hela figuren, också runt benen framför
    // den mörka bröstningen och skorna, som en ljus kontur kring ett klistermärke.
    const r = ut.rand;
    if (r > 0.1) {
      c.save();
      kantRuta(c, x, y, f.k, ut.lykta);
      c.translate(x, y - 1.4 * f.k);
      c.scale(f.dir * f.k, f.k);
      c.lineJoin = 'round';
      c.lineCap = 'round';
      c.strokeStyle = '#ffc98a';
      c.globalAlpha = 0.34 * r * ut.A;
      ritaDelar(c, D, P, 1, 2.4);
      c.restore();
    }
    c.translate(x, y);
    c.scale(f.dir * f.k, f.k);
    c.globalAlpha = 0.26 * ut.A;
    c.fillStyle = '#000';
    c.beginPath();
    c.ellipse(f.sta ? 0 : 8, 1, f.sta ? 22 : 28, 3.6, 0, 0, 2 * Math.PI);
    c.fill();
    ritaDelar(c, D, P, ut.A, 0, false, ut.z || 0, ut.zBen);
    c.restore();
  }

  // Där ljuset är bakom den som går, i världen: skyltfönstrets och dörrens glas, och under en lykta (lykta) en
  // remsa från axlarna och uppåt, så att ljuset uppifrån fångas på huvudet, mössan, axlarna och paraplyet.
  function kantRuta(c, x, y, k, lykta) {
    c.beginPath();
    c.rect(FON.x, FON.y, FON.w, FON.h);
    c.rect(DORR.x, DORR.y, DORR.w, DORR.h);
    if (lykta) c.rect(x - 160 * k, y - 300 * k, 320 * k, 172 * k);
    c.clip();
  }

  // ---------- vilka som går förbi ----------
  //
  // Hur många som går förbi: efter gatan inifrån (RumUte.trafik) men färre, färre i ösregn och kyla, nästan ingen
  // mitt i natten. Var och en (eller ett sällskap) går över hela bilden, åt det ena eller andra hållet, på sitt
  // avstånd från fasaden (fötterna där, och lika mycket större), och nästa gång är det någon annan (folket). Det är 90-tal: vindjackor i
  // färgblock, dunjackor, skinnjackor, bomberjackor, trenchcoats, myskläder, vida jeans, bakvända kepsar,
  // freestyle med orange öronkuddar, fyrkantiga ryggsäckar, plastpåsar och en och annan mobiltelefon med
  // antenn. Och klädda efter vädret: paraply, regnrock och sydväst, gummistövlar och regnskydd på
  // barnvagnen i regnet, mössa, halsduk och lovikkavantar i kylan, pulka i snön, shorts och glass i värmen.
  const F90 = {
    kappa: ['#1c1f26', '#2b2f38', '#3a3226', '#20283a', '#5a2a2a', '#6b6458', '#2e3a2e', '#5a2a4a', '#b8a07a', '#2a4a4e'],
    trench: ['#b8a07a', '#a89070', '#7a6a50', '#2a2e38', '#c8b48a'],
    dun: ['#1a1a1e', '#26346a', '#8a1e1e', '#d8a83a', '#4a2a6a', '#1e6a6a', '#b8bcc0', '#2a5a3a', '#c8322a'],
    vind: [['#4a2a6a', '#1e8a8a', '#e8e4dc'], ['#1d3a7a', '#d8407a', '#e8d84a'], ['#1e6a4a', '#4a2a6a', '#f3ead9'], ['#c8322a', '#1d2a4a', '#e8e4dc'], ['#10306a', '#e8b923', '#c8322a'], ['#2a2a30', '#2a8ad0', '#e0408a'], ['#1e8a8a', '#e8e4dc', '#4a2a6a']],
    regn: ['#e8b923', '#1d2a4a', '#c8322a', '#2a5a3a', '#4a4a52', '#e8b923', '#2a5ab0'],
    skinn: ['#121214', '#2a1c14', '#121214', '#3a2418'],
    bomber: ['#3a4430', '#121418', '#1d2a4a', '#5a1e22'],
    jeans: ['#4a6a90', '#5a7aa0', '#34507a'],
    falt: ['#4a5034', '#5a5a3a', '#3a4a3a', '#6a5a3a'],
    luv: ['#7a7a7a', '#1d2a4a', '#5a2a2a', '#2a5a3a', '#d8d4c8', '#1a1a1a', '#8a1e1e', '#4a2a6a'],
    kavaj: ['#2a2e38', '#3a3a40', '#5a4a3a', '#6a2a2a', '#1c2030', '#c8b89a'],
    tshirt: ['#f3ead9', '#e8e4dc', '#1a1a1a', '#c8322a', '#2a5ab0', '#f0c040', '#7ab07a', '#d8407a', '#1e8a8a', '#4a2a6a'],
    skjorta: ['#8a1e1e', '#2a4a6a', '#e8e4dc', '#5a7aa0', '#3a5a3a', '#c8b48a'],
    overall: ['#4a2a6a', '#1e8a8a', '#c8322a', '#d8407a', '#2a5ab0', '#e8b923'],
    barnregn: ['#e8b923', '#c8322a', '#2a5ab0', '#2a8a4a', '#e8b923'],
    byxa: ['#3b4a6a', '#4a6a90', '#1d1d20', '#2a2a2e', '#4a4a50', '#b8a888', '#34405a', '#3a3226'],
    ljusjeans: ['#7a98b8', '#6a8aac', '#3b4a6a', '#1d1d20', '#4a6a90'],
    shorts: ['#d8ccb0', '#3a4a66', '#6a7a5a', '#4a6a90', '#1a1a1a', '#7a98b8'],
    kjol: ['#1a1a1e', '#2a2a40', '#5a2a2a', '#3a3a3a', '#6a5a3a', '#2a4a4e'],
    sneaker: ['#e8e4dc', '#f0ece4', '#d8d4cc', '#1a1a1a'],
    kanga: ['#141414', '#2a1c14', '#3a2a1a', '#141414'],
    stovel: ['#1d3a2a', '#111111', '#c8322a', '#e8b923', '#1d2a4a', '#111111'],
    mossa: ['#8a1e1e', '#1f2a44', '#d8cbb0', '#2a2a2a', '#1e6a6a', '#4a2a6a', '#e8b923', '#c8322a', '#2a5a3a', '#7a7a76', '#e86a1a', '#2a5ab0', '#d8407a', '#5a3a22', '#a8c8d8', '#3a4430'],
    halsduk: ['#c8322a', '#e0c040', '#2a5ab0', '#f3ead9', '#1e6a6a', '#5a2a4a', '#2a2a2a', '#8a1e1e', '#7a7a76', '#e86a1a', '#b8a07a', '#2a5a3a', '#4a2a6a', '#1d2a4a', '#d8407a'],
    vante: ['#1a1a1a', '#3a2a1a', '#8a1e1e', '#2a3a6a', '#7a7a76', '#2a5a3a', '#4a2a6a', '#c8322a'],
    pals: ['#3a2e24', '#5a4a3a', '#1a1a1a', '#8a7a68', '#d8ccb0', '#6a5a48'],
    muffar: ['#ece6da', '#d8407a', '#1a1a1a', '#c8b8a0', '#8a1e1e', '#4a2a6a', '#2a5ab0'],
    hud: ['#e8c4a0', '#c99a72', '#8a5a3a', '#f0d2b4', '#e0b896', '#5a3a26', '#f0d2b4'],
    har: ['#2a1c12', '#6a4a2a', '#c9a46a', '#1a1a1a', '#8a8a86', '#a85a2a', '#d8c08a', '#3a2418'],
    gra: ['#8a8a86', '#c8c8c4', '#6a6a66', '#d8d4cc', '#a8a8a4'],
    paraply: ['#1a1a1e', '#2a3a6a', '#8a1e1e', '#2a5a3a', '#d8b03a', '#1a1a1e', '#4a2a6a', '#1e6a6a'],
    golf: [['#1d2a4a', '#e8e4dc'], ['#c8322a', '#e8e4dc'], ['#1e5a3a', '#e8e4dc'], ['#1a1a1e', '#d8b03a'], ['#2a5ab0', '#e8b923'], ['#c8322a', '#1d2a4a']],
    ryggsack: ['#c8322a', '#2a5ab0', '#2a5a3a', '#e8b923', '#1a1a1a', '#e0408a'],
  };
  // byggnaden (överkroppens bredd, bredda) efter vem: unga oftare smala, äldre oftare runda
  const BYGG = {
    ung: [0.86, 0.9, 0.94, 1, 1, 1.1, 1.18],
    vuxen: [0.88, 0.94, 1, 1, 1.08, 1.16, 1.26],
    aldre: [0.92, 1, 1.08, 1.16, 1.26, 1.26],
    kostym: [0.94, 1, 1.08, 1.16, 1.26],
    barn: [0.9, 1, 1, 1.12],
  };
  // vädret för kläderna
  function vadret(v, L) {
    const regn = v.fall === 'regn' || v.fall === 'blandat';
    return {
      regn, sno: v.fall === 'sno' || v.fall === 'blandat', snoMark: v.snotackt,
      kall: v.kanns < 3, sval: v.kanns >= 3 && v.kanns < 11, varm: v.kanns >= 16, hett: v.kanns >= 21,
      sol: L.sol > 0.4 && L.dag > 0.6,
      // (halt: snö på marken kring nollan, eller blött och minusgrader)
      halt: (v.snotackt && v.temp > -8 && v.temp < 2.5) || (v.blott && v.temp < 0.5),
    };
  }
  // (en annan färg ur listan än c, oftast)
  const annan = (R, a, c) => { const x = pick(R, a); return x === c ? pick(R, a) : x; };
  // Mössan i kylan: stickad mössa (med eller utan tofs och ränder), en som slokar bakåt, den korta sjömansmössan
  // högt på huvudet (docker), jokkmokksmössan med öronlappar (oron), öronmuffar, ett stickat pannband, luvtröjans
  // luva under jackan, rånarluvan på barnen och pälsmössan på de äldre och i sträng kyla.
  function vinterHatt(R, vem, kv, v) {
    if (vem === 'barn') return pick(R, ['mossa', 'mossa', 'mossa', 'oron', 'luva']);
    if (v.kanns < -8 && R() < 0.35) return vem === 'ung' ? 'oron' : pick(R, ['oron', 'pals']);
    const k = vem === 'ung' ? ['mossa', 'mossa', 'slak', 'slak', 'docker', 'oron', 'luva', ...(kv ? ['muffar', 'pannband'] : ['docker', 'luva'])]
      : vem === 'aldre' ? ['mossa', 'mossa', 'pals', ...(kv ? ['muffar'] : ['mossa'])]
        : vem === 'kostym' ? ['mossa', 'pals', 'hatt']
          : ['mossa', 'mossa', 'mossa', 'oron', 'slak', ...(kv ? ['muffar', 'pannband'] : ['docker', 'pals'])];
    return pick(R, k);
  }
  // Kläderna och det man har med sig, för en som är ung, vuxen, gammal, i kostym eller ett barn (vem), i
  // vädret W. x: utanParaply, utanHatt. Ger o till figurDelar (och bakDelar: rock, byxa, sko, hud, har,
  // halsduk, mossa).
  function klad(R, v, L, W, vem = 'vuxen', x = {}) {
    const ung = vem === 'ung';
    const aldre = vem === 'aldre';
    const barn = vem === 'barn';
    const kostym = vem === 'kostym';
    // (kjol, långt hår och sjalett för en del)
    const kv = !kostym && R() < 0.5;
    const o = { vem, barn, hud: pick(R, F90.hud) };
    o.har = aldre ? pick(R, F90.gra) : pick(R, F90.har);
    // Längden (del av skalan; kvinnor lite kortare i snitt, äldre lite hopsjunkna) och byggnaden: smal,
    // vanlig, kraftig eller rund med mage (bredden på överkroppen, bredda).
    o.h = barn ? 0.6 + R() * 0.04 : (kv ? 0.95 : 1.01) - (aldre ? 0.025 : 0) + (R() + R() - 1) * 0.065;
    o.bred = pick(R, BYGG[vem] || BYGG.vuxen);
    o.mage = o.bred > 1.15 && !barn && R() < 0.75;
    // (bland de unga en och annan punkare med tuppkam och nitar, eller hårdrockare med långt hår, i skinnjacka)
    const sub = ung && !W.varm && R() < 0.1 ? (R() < 0.5 ? 'punk' : 'hardrock') : null;
    let stil;
    if (barn) stil = W.regn ? 'regn' : W.kall || W.snoMark ? 'overall' : W.varm ? 'tshirt' : pick(R, ['vind', 'dun', 'luv', 'jeans']);
    else if (kostym) stil = W.kall ? pick(R, ['kappa', 'kappa', 'trench']) : W.varm ? 'kavaj' : pick(R, ['trench', 'kappa', 'kavaj']);
    else if (W.kall) stil = pick(R, aldre ? ['kappa', 'kappa', 'dun', 'falt'] : ung ? ['dun', 'dun', 'bomber', 'skinn', 'falt'] : ['kappa', 'dun', 'dun', 'falt', 'kappa', 'skinn', 'trench']);
    else if (W.varm) stil = pick(R, aldre ? ['skjorta', 'kavaj', 'tshirt'] : ung ? ['tshirt', 'tshirt', 'luv', 'skjorta', 'trackdrakt'] : ['tshirt', 'skjorta', 'tshirt', 'kavaj', 'jeans']);
    else if (W.sval) stil = pick(R, aldre ? ['kappa', 'trench', 'falt', 'kavaj', 'kappa'] : ung ? ['vind', 'vind', 'bomber', 'skinn', 'jeans', 'luv', 'trackdrakt', 'dun'] : ['trench', 'kappa', 'skinn', 'vind', 'jeans', 'falt', 'bomber', 'dun', 'kappa']);
    else stil = pick(R, aldre ? ['trench', 'kavaj', 'falt', 'skjorta'] : ung ? ['vind', 'jeans', 'luv', 'trackdrakt', 'skjorta', 'bomber'] : ['jeans', 'vind', 'skinn', 'kavaj', 'trench', 'luv', 'skjorta']);
    if (W.regn && !barn && !kostym && R() < (aldre ? 0.15 : 0.25)) stil = 'regn';
    if (sub) stil = 'skinn';
    o.stil = stil;
    if (stil === 'vind' || stil === 'trackdrakt') {
      const b = pick(R, F90.vind);
      o.rock = b[0];
      o.blk = [b[1], b[2]];
      o.arm = R() < 0.5 ? b[1] : b[0];
    } else {
      o.rock = pick(R, barn && stil === 'regn' ? F90.barnregn : F90[stil]);
      o.arm = o.rock;
    }
    o.lang = HEM[stil] > -70;
    // (dunjackan ibland i två färger med axlarna i den ena, och i kylan pälskanten på luvan som ligger nere bak
    // på dunjackan och fältjackan)
    if (stil === 'dun' && R() < 0.3) { o.duo = annan(R, F90.dun, o.rock); if (R() < 0.5) o.arm = o.duo; }
    if ((stil === 'dun' || stil === 'falt') && W.kall && !barn && R() < 0.3) o.pals = pick(R, F90.pals);
    if (stil === 'kavaj') { o.skjorta = pick(R, ['#e8e4dc', '#c8d8e8', '#f3ead9']); o.slips = kostym ? pick(R, ['#8a1e1e', '#1d2a4a', '#5a2a6a', '#c8a83a']) : null; }
    if (stil === 'tshirt' && R() < 0.4) o.tryck = pick(R, ['#c8322a', '#e8b923', '#2a5ab0', '#1a1a1a', '#e8e4dc']);
    // (landslagströjan i värmen: gul med blå krage och blå kant på ärmarna)
    if (stil === 'tshirt' && !kostym && R() < 0.12) { o.rock = '#f0c41c'; o.arm = o.rock; o.sverige = '#1d4a9a'; o.tryck = null; }
    // byxorna (eller kjolen, eller shorts)
    if (stil === 'trackdrakt' || stil === 'overall' || (barn && stil === 'regn')) o.byxa = o.rock;
    else if (W.varm && !aldre && !kostym && R() < 0.45) { o.ben = 'shorts'; o.byxa = pick(R, F90.shorts); o.strumpa = R() < 0.65 ? '#ece8e0' : null; }
    else if (kv && !ung && !barn && R() < 0.3) { o.ben = 'kjol'; o.kjol = pick(R, F90.kjol); o.kjolKort = R() < 0.4; o.strumpa = W.varm ? o.hud : pick(R, ['#1a1a1e', '#2a2a30', '#3a2a2a']); o.byxa = o.kjol; }
    else {
      o.byxa = kostym ? (stil === 'kavaj' ? o.rock : pick(R, F90.kavaj)) : pick(R, ung || barn ? F90.ljusjeans : F90.byxa);
      if (ung && R() < 0.7) o.vidd = 1.28;
    }
    if (sub) { o.ben = null; o.vidd = 1; o.byxa = sub === 'punk' ? pick(R, ['#1a1a1e', '#6a1a22', '#2a2a30']) : pick(R, ['#3b4a6a', '#1d1d20', '#4a6a90']); }
    // skorna
    if (barn) { o.skoStil = W.regn || W.snoMark ? 'stovel' : 'sneaker'; o.sko = pick(R, o.skoStil === 'stovel' ? F90.stovel : F90.sneaker); }
    else if (W.regn && R() < 0.25) { o.skoStil = 'stovel'; o.sko = pick(R, F90.stovel); }
    else if (W.kall || W.snoMark) { o.skoStil = 'kanga'; o.sko = pick(R, F90.kanga); o.dm = ung && R() < 0.5; }
    else if (ung) { const r = R(); o.skoStil = r < 0.5 ? 'sneaker' : r < 0.8 ? 'kanga' : 'sko'; o.dm = o.skoStil === 'kanga'; o.sko = o.skoStil === 'sneaker' ? pick(R, F90.sneaker) : '#141414'; }
    else if (kostym || aldre) { o.skoStil = 'sko'; o.sko = pick(R, ['#141414', '#3a2a1a']); }
    else { o.skoStil = W.varm && R() < 0.4 ? 'sneaker' : 'sko'; o.sko = o.skoStil === 'sneaker' ? pick(R, F90.sneaker) : pick(R, ['#141414', '#3a2a1a', '#2a1c14']); }
    // håret
    o.harStil = barn ? pick(R, kv ? ['svans', 'page', 'lang'] : ['kort', 'kort', 'page'])
      : aldre ? pick(R, kv ? ['lockar', 'page', 'kort'] : ['flint', 'kort', 'flint'])
        : kv ? pick(R, ['lang', 'svans', 'page', 'lockar', 'lang', 'knut', 'afro']) : pick(R, ung ? ['kort', 'gel', 'hockey', 'lang', 'hockey', 'afro'] : ['kort', 'kort', 'hockey', 'flint', 'lockar', 'afro']);
    if (sub === 'punk') { o.harStil = 'tupp'; o.har = pick(R, ['#d8407a', '#3ab04a', '#e83a2a', '#1a1a1a', '#e8d84a', '#2a6ad8']); }
    else if (sub) o.harStil = 'lang';
    if (sub) { o.skoStil = 'kanga'; o.sko = '#141414'; o.dm = true; o.nitar = sub === 'punk' || R() < 0.4; }
    if (o.harStil === 'svans') o.snodd = pick(R, ['#d8407a', '#1e8a8a', '#e8b923', '#1a1a1a', '#f3ead9', '#4a2a6a']);
    // huvudet
    o.hatt = null;
    const r = R();
    if (x.utanHatt) o.hatt = null;
    else if (stil === 'regn') o.hatt = r < (barn ? 0.45 : 0.3) ? 'sydvast' : 'luva';
    else if (W.kall || W.sno) o.hatt = aldre && r < 0.3 ? pick(R, kv ? ['sjal', 'basker', 'pals'] : ['hatt', 'kepa', 'pals']) : r < (W.sno ? 0.85 : 0.72) ? vinterHatt(R, vem, kv, v) : R() < 0.3 ? 'keps' : null;
    else if (W.regn) o.hatt = ['luv', 'vind', 'dun', 'falt'].includes(stil) && r < 0.45 ? 'luva' : r < 0.6 ? pick(R, aldre ? ['hatt', 'kepa', 'kepa'] : kostym ? ['hatt', 'hatt', 'keps'] : kv ? ['keps', 'mossa', 'basker'] : ['keps', 'mossa', 'keps']) : null;
    else if (W.varm) o.hatt = r < (ung || barn ? 0.4 : 0.18) ? (ung && R() < 0.5 ? 'bakkeps' : R() < 0.75 ? 'keps' : 'fiskar') : aldre && !kv && r < 0.4 ? pick(R, ['hatt', 'kepa']) : null;
    else o.hatt = r < (ung ? 0.4 : 0.15) ? (ung && R() < 0.55 ? 'bakkeps' : R() < 0.8 ? 'keps' : 'fiskar') : (aldre || kostym) && r < 0.4 ? (aldre && !kv ? pick(R, ['hatt', 'kepa', 'kepa']) : 'hatt') : W.sval && r < 0.3 ? (kv && R() < 0.4 ? 'basker' : 'mossa') : null;
    // (luvan under jackan i kylan är luvtröjans eller barnets rånarluva, i regnet jackans egen)
    const egenLuva = o.hatt === 'luva' && stil !== 'regn' && (W.kall || W.sno);
    o.mossa = o.hatt === 'luva' || o.hatt === 'sydvast' ? (egenLuva ? pick(R, barn ? F90.mossa : F90.luv) : o.rock)
      : o.hatt === 'hatt' ? pick(R, ['#1d1d20', '#3a3026', '#2a2e38', '#5a4a3a'])
        : o.hatt === 'kepa' ? pick(R, ['#5a4a3a', '#4a4a46', '#3a3226', '#6a5a44', '#2a2e38'])
          : o.hatt === 'basker' ? pick(R, ['#1a1a1e', '#8a1e1e', '#2a3a6a', '#5a2a4a', '#2a4a3a'])
            : o.hatt === 'sjal' ? pick(R, ['#8a1e1e', '#2a3a6a', '#d8cbb0', '#4a2a4a'])
              : o.hatt === 'pals' ? pick(R, F90.pals) : o.hatt === 'muffar' ? pick(R, F90.muffar) : pick(R, F90.mossa);
    if (sub === 'punk') o.hatt = null;
    // (stickat: en eller två ränder i en annan färg, tofsen i en egen färg och jokkmokksmössans snören)
    const stickad = ['mossa', 'oron', 'docker'].includes(o.hatt);
    o.tofs = (o.hatt === 'mossa' || o.hatt === 'oron') && R() < (barn ? 0.8 : 0.35);
    if (o.tofs && R() < 0.5) o.tofsF = annan(R, F90.mossa, o.mossa);
    if (stickad && o.hatt !== 'docker' && R() < 0.35) { o.mRand = annan(R, F90.mossa, o.mossa); o.mRand2 = R() < 0.4; }
    o.snoren = o.hatt === 'oron' && R() < 0.6;
    if (o.hatt === 'pannband' && (W.kall || W.sno)) o.stickat = true;
    o.halsduk = (W.kall && R() < 0.65) || (W.sval && R() < 0.15) || (W.sno && R() < 0.4) ? pick(R, F90.halsduk) : null;
    // Halsduken: knuten med en ände fram (fram), slängd bakåt över axeln (bak), med båda ändarna fram (tva) eller
    // lindad tjockt kring halsen utan ändar (tjock); randig eller rutig ibland, och ibland i samma färg och
    // ränder som mössan (ett set).
    if (o.halsduk) {
      o.hForm = pick(R, barn ? ['fram', 'tjock'] : ['fram', 'fram', 'bak', 'tva', 'tjock']);
      const m = R();
      if (m < 0.3) o.hRand = annan(R, F90.halsduk, o.halsduk);
      else if (m < 0.45) o.hRutor = annan(R, F90.halsduk, o.halsduk);
      if (stickad && R() < 0.3) { o.halsduk = o.mossa; o.hRand = o.mRand || null; o.hRutor = null; }
    }
    o.vante = W.kall && R() < 0.7 ? (R() < 0.25 ? '#ece6da' : stickad && R() < 0.3 ? o.mossa : pick(R, F90.vante)) : null;
    o.sno = W.sno && v.mangd > 0.2;
    // det man har med sig
    if (barn) o.ryggsack = R() < 0.7 ? pick(R, F90.ryggsack) : null;
    else {
      const oron = ['luva', 'sydvast', 'oron', 'sjal', 'muffar', 'pals'].includes(o.hatt);
      o.walkman = !oron && R() < (ung ? 0.32 : 0.05);
      o.cigg = R() < (aldre ? 0.07 : 0.11);
      o.glas = R() < (aldre ? 0.45 : 0.12);
      o.sol = W.sol && !o.glas && R() < 0.4;
      o.skagg = !kv && R() < (aldre ? 0.3 : 0.14);
      o.mobil = (kostym && R() < 0.35) || (!ung && !aldre && R() < 0.03);
      o.ryggsack = R() < (ung ? 0.35 : aldre ? 0 : 0.08) ? pick(R, F90.ryggsack) : null;
      o.vaska = !o.ryggsack && R() < (kv ? 0.32 : 0.08) ? pick(R, ['#3a2a1a', '#1a1a1a', '#8a6a3a', '#5a1e22']) : null;
      // (magväskan, julklapparna i december)
      o.mag = !kostym && !aldre && R() < (ung ? 0.09 : 0.05) ? pick(R, ['#1a1a1e', '#2a5ab0', '#c8322a', '#e0408a', '#1e8a8a', '#4a2a6a']) : null;
      if (v.manad === 12 && v.dag < 24 && R() < 0.22) o.hang = { typ: 'klapp', f: pick(R, ['#b8322a', '#c8a878', '#1e5a3a', '#ece6d6']), p1: pick(R, ['#c8322a', '#2a5ab0', '#e8b923']), p2: pick(R, ['#1e6a3a', '#d8407a', '#e8e4dc']) };
      else if (kostym && R() < 0.65) o.hang = { typ: 'portfolj', f: pick(R, ['#2a1c14', '#141414', '#4a3020']) };
      else if (!ung && R() < 0.2) o.hang = { typ: 'pase', f: '#ece8e0', f2: pick(R, ['#c8322a', '#2a5ab0', '#e8b923', '#2a8a4a']) };
      else if (ung && R() < 0.1) o.hang = { typ: 'sport', f: pick(R, ['#1a1a1e', '#1d2a4a', '#8a1e1e', '#2a5a3a']), f2: pick(R, ['#e8e4dc', '#e8b923', '#2a8ad0']) };
      // (gitarren på ryggen, pizzan hem på kvällen, blommorna till någon)
      o.gitarr = ung && !o.ryggsack && !o.hang && R() < 0.12 ? pick(R, ['#1a1a1a', '#22242a', '#3a2a1a']) : null;
      if (L.dag < 0.4 && !kostym && R() < 0.08) o.pizza = pick(R, ['#c8322a', '#2a6a3a', '#1d3a7a']);
      else if (!ung && R() < 0.06) {
        o.blommor = [...Array(3)].map(() => pick(R, ['#d8283a', '#e8b923', '#e870a0', '#f3ead9', '#c84a1a', '#8a3ab0']));
        o.blomPapper = pick(R, ['#e8e0cc', '#c8a878', '#d8e6f0']);
      }
      o.glass = W.hett && L.dag > 0.5 && R() < 0.25;
      if (o.glass) o.cigg = false;
      if (o.glass) o.glassF = pick(R, ['#e8a0b0', '#f3ead9', '#7a4a2a', '#c8e0a0']);
      o.skate = ung && !W.regn && !W.sno && !W.snoMark && v.kanns > 4 && R() < 0.14;
      if (o.skate) { o.skate = pick(R, ['#c8322a', '#2a2a30', '#1e8a8a', '#e8b923', '#4a2a6a']); o.skate2 = pick(R, ['#e8e4dc', '#e0408a', '#2a5ab0']); }
    }
    o.paraply = null;
    if (!x.utanParaply && !barn && stil !== 'regn' && o.hatt !== 'luva') {
      if (W.regn && R() < 0.72) { o.paraply = pick(R, F90.paraply); o.vand = v.vind > 9 && R() < 0.3; }
      else if (W.sno && R() < 0.08) o.paraply = pick(R, F90.paraply);
      // (vanligt, golfparaply i två färger, litet hopfällbart eller en genomskinlig bubbla; i blåsten vänds
      // bara det vanliga ut och in)
      if (o.paraply && !o.vand) {
        o.parTyp = pick(R, kostym ? ['vanlig', 'golf', 'golf'] : kv ? ['vanlig', 'liten', 'liten', 'bubbla', 'golf'] : ['vanlig', 'vanlig', 'liten', 'golf', 'liten']);
        if (o.parTyp === 'golf') [o.paraply, o.paraply2] = pick(R, F90.golf);
        if (o.parTyp === 'bubbla') o.paraply = pick(R, ['#c8322a', '#2a5ab0', '#1a1a1e', '#e8b923', '#e0408a']);
      }
    }
    o.droppar = W.regn;
    return o;
  }
  // Vad händerna gör: först det som sällskapet kräver (gF, gB: kopplet, barnets hand, barnvagnen …), sedan
  // paraplyet, mobilen, glassen och brädan; påsen och portföljen hänger i en hand som är ledig.
  function hander(o) {
    const fri = (s) => !(s === 'F' ? o.gF || o.kapp : o.gB) && o.parHand !== s;
    if (o.paraply) {
      o.parHand = fri('F') ? 'F' : fri('B') ? 'B' : null;
      if (!o.parHand) o.paraply = null;
    }
    for (const [k, g] of [['mobil', 'mobil'], ['glass', 'glass'], ['skate', 'under'], ['pizza', 'pizza'], ['blommor', 'blommor']]) {
      if (!o[k]) continue;
      if (fri('F')) o.gF = g;
      else o[k] = null;
    }
    if (o.hang) {
      o.hang.sida = fri('B') ? 'B' : fri('F') ? 'F' : null;
      if (!o.hang.sida) o.hang = null;
    }
    return o;
  }
  function hundVal(R, W) {
    const typ = pick(R, ['lab', 'lab', 'tax', 'schafer', 'terrier', 'pudel', 'tax', 'dalm', 'cocker', 'cocker']);
    // (labradoren också som golden)
    const f = { lab: ['#d8b47a', '#1a1a1a', '#5a3a22', '#e0c8a0', '#c8903a', '#d8a860'], schafer: ['#a8743a'], tax: ['#7a3e1e', '#3a2416', '#8a5a2a'], terrier: ['#ece6da', '#e8e0d0'], pudel: ['#1a1a1a', '#ece6da', '#8a6a4a', '#c8c4bc'], dalm: ['#ece8e0'], cocker: ['#8a4a1e', '#c8843a', '#1a1a1a', '#d8b47a'] }[typ];
    const h = { typ, f: pick(R, f), halsband: pick(R, ['#b8322a', '#2a5ab0', '#1a1a1a', '#e8b923']) };
    if (typ === 'schafer') h.f2 = '#1e1812';
    if (typ === 'dalm') h.prickar = '#141414';
    const liten = typ === 'tax' || typ === 'terrier' || typ === 'pudel' || typ === 'cocker';
    if (liten && ((W.regn && R() < 0.65) || (W.kall && R() < 0.5))) h.tacke = pick(R, ['#c8322a', '#2a3a6a', '#e8b923', '#2a5a3a', '#4a2a4a']);
    return h;
  }
  // Vem som kommer gående: en ensam, någon med hund, ett par, ett gäng, en förälder med ett barn i handen, en
  // familj, skolbarn i sällskap, med barnvagn, med pulka i snön, en äldre med dragkärra, någon som leder cykeln, någon som skyddar sig
  // med tidningen i regnet, någon som joggar morgon och kväll; efter klockan och vädret.
  function vemGar(R, T, W, v) {
    const h = T.h;
    const dag = h > 8 && h < 19.5;
    // (barnen är ute på dagen och till halv nio, flest på lediga dagar; kvällspromenaden med hunden)
    const barnTid = h > 8 && h < 20.5 ? (h < 19.5 ? 1 : 0.4) * (T.helg ? 1.4 : 1) : 0;
    const kv = [
      ['en', 1.3],
      ['hund', h > 6 && h < 23.5 ? (W.regn ? 0.18 : 0.3) + (h > 19 && h < 22.5 ? 0.14 : 0) : 0.06],
      ['par', 0.16 + (h > 17 ? 0.1 : 0)],
      ['gang', h > 13 && h < 23.5 ? 0.06 : T.natt && T.helg ? 0.14 : 0.02],
      ['barn', 0.2 * barnTid],
      ['familj', 0.14 * barnTid],
      ['skolbarn', !T.helg && ((h > 7.4 && h < 8.4) || (h > 12 && h < 16.5)) ? 0.16 : T.helg && h > 10 && h < 18 ? 0.06 : 0],
      ['vagn', dag && !(W.sno && v.mangd > 0.5) ? 0.09 : 0],
      ['karra', h > 9 && h < 17 && !W.snoMark ? 0.06 : 0],
      ['cykel', !v.snotackt && !(W.regn && v.mangd > 0.6) && h > 6 && h < 23 ? 0.07 : 0],
      ['pulka', v.snotackt && h > 9 && h < 16.5 ? 0.16 : 0],
      ['tidning', W.regn && v.mangd < 0.85 ? 0.07 : 0],
      ['jogg', !v.snotackt && !W.halt && !(W.regn && v.mangd > 0.5) && v.kanns > -6 && ((h > 6 && h < 9.5) || (h > 16.5 && h < 21.5)) ? (W.varm ? 0.05 : 0.03) : 0],
      // (inlines när det är torrt och milt, rullatorn på dagen, supportrarna på väg till eller från matchen,
      // bergsprängaren, julgranen i december, tidningsbudet i gryningen, turisterna på sommaren och skidorna
      // när det har snöat en ledig dag)
      ['inlines', !W.regn && !W.sno && !v.snotackt && v.kanns >= 7 && h > 9 && h < 21 ? (v.arstid === 'sommar' ? 0.07 : 0.035) : 0],
      ['rullator', h > 9 && h < 17 && !(v.snotackt && v.mangd > 0.3) ? 0.07 : 0],
      ['supporter', T.helg ? (h > 11 && h < 19.5 ? 0.16 : 0) : h > 17 && h < 21.5 ? 0.06 : 0],
      ['bergs', !W.regn && !W.sno && v.kanns >= 5 && h > 11 && h < 22 ? 0.05 : 0],
      ['gran', v.manad === 12 && v.dag >= 7 && v.dag <= 23 && h > 10 && h < 20 ? 0.16 : 0],
      ['bud', h >= 4.5 && h < 7 ? 1.4 : 0],
      ['turist', v.manad >= 6 && v.manad <= 8 && h > 10 && h < 19 && !W.regn ? 0.12 : 0],
      ['skidor', v.snotackt && T.helg && h > 8.5 && h < 16.5 ? 0.12 : 0],
      // (powerwalk morgon och kväll, och på helgen på förmiddagen; på väg hem från krogen sent fredag och lördag)
      ['power', !v.snotackt && !W.halt && !(W.regn && v.mangd > 0.4) && v.kanns > -4 && ((h > 6.5 && h < 9.5) || (h > 17 && h < 21) || (T.helg && h > 9 && h < 12)) ? 0.03 : 0],
      ['hemvag', ((v.veckodag === 'fre' || v.veckodag === 'lör') && h >= 22.5) || ((v.veckodag === 'lör' || v.veckodag === 'sön') && h < 3) ? 0.3 : h >= 23 || h < 2 ? 0.05 : 0],
    ];
    let s = kv.reduce((a, [, w]) => a + w, 0) * R();
    for (const [k, w] of kv) { s -= w; if (s <= 0) return k; }
    return 'en';
  }
  // Sättet att gå (STILAR) efter vem det är, eller det sällskapet kräver (namn). På halkan (W.halkar) går de flesta
  // försiktigt, utom barnen och den som springer, och med kjol trippar en del. Den som är rund om magen vaggar ibland,
  // den långa kliver ibland, i kylan fryser en del (axlarna upp och huvudet ner), och en och annan haltar. En del äldre
  // går framåtböjda, de flesta med huvudet lite framskjutet, och den som strosar har ibland händerna på ryggen. En hand
  // i fickan bara när den är ledig: med påsen i den ena handen eller paraplyet kan den andra vara i fickan. Lugnt
  // framför affären (2026-11-17): färre raska och studsande, fler som går vanligt eller strosar.
  const GSTIL = {
    ung: ['vanlig', 'vanlig', 'strosar', 'studsar', 'lunkar', 'slantrar', 'slantrar', 'hasar', 'hasar', 'kliver', 'trippar', 'stram'],
    vuxen: ['vanlig', 'vanlig', 'vanlig', 'strosar', 'strosar', 'rak', 'rask', 'trippar', 'kliver', 'stram', 'hasar'],
    aldre: ['strosar', 'strosar', 'strosar', 'rak', 'lunkar', 'trippar', 'hasar', 'stram', 'vanlig'],
    kostym: ['vanlig', 'vanlig', 'rask', 'rak', 'stram', 'stram', 'kliver'],
    barn: ['studsar', 'studsar', 'vanlig', 'trippar'],
  };
  function gangFor(R, o, W, namn) {
    if (W.halkar && o.vem !== 'barn' && !['springer', 'kapp', 'skrinna'].includes(namn)) namn = 'halkar';
    const vuxen = o.vem !== 'barn';
    if (!namn && o.ben === 'kjol' && R() < 0.4) namn = 'trippar';
    else if (!namn && o.mage && R() < 0.2) namn = 'vaggar';
    else if (!namn && vuxen && W.kall && !o.paraply && R() < 0.3) namn = 'frusen';
    else if (!namn && vuxen && o.h > 1.04 && R() < 0.3) namn = 'kliver';
    else if (!namn && vuxen && R() < 0.05) namn = 'haltar';
    const st = gangStil(R, { stil: namn || (GSTIL[o.vem] ? pick(R, GSTIL[o.vem]) : undefined), kalla: W.kall });
    const ledig = (s) => !(s === 'F' ? o.gF || o.kapp : o.gB) && o.parHand !== s && !(o.hang && o.hang.sida === s);
    st.ficka = o.hund || o.vagn || o.tidning ? '' : [...st.ficka].filter(ledig).join('');
    if (o.vem === 'aldre' && !['kapp', 'springer', 'halkar'].includes(st.namn)) {
      if (R() < 0.4) st.lut += 4 + R() * 3;
      st.hfram += 0.8 + R() * 1.6;
      if (['strosar', 'rak', 'stram', 'lunkar'].includes(st.namn) && ledig('F') && ledig('B') && !o.paraply && R() < 0.4) {
        st.armar = 'rygg';
        st.ficka = '';
      }
    }
    o.ficka = st.ficka;
    st.hang = o.hang ? o.hang.sida : '';
    return st;
  }
  // Den som joggar: myskläder (vindtyg i färgblock) eller shorts och t-shirt när det är varmt, gympadojor,
  // pannband eller mössa och ibland en gul sportfreestyle; inget i händerna.
  function joggare(R, o, W) {
    const b = pick(R, F90.vind);
    Object.assign(o, { stil: 'trackdrakt', rock: b[0], blk: [b[1], b[2]], arm: R() < 0.5 ? b[1] : b[0], lang: false, ben: null, strumpa: null, vidd: 1 });
    o.byxa = o.rock;
    if (W.varm) {
      Object.assign(o, { stil: 'tshirt', rock: pick(R, F90.tshirt), tryck: R() < 0.4 ? pick(R, ['#c8322a', '#e8b923', '#2a5ab0', '#1a1a1a']) : null, ben: 'shorts', byxa: pick(R, F90.shorts), strumpa: '#ece8e0' });
      o.arm = o.rock;
    }
    Object.assign(o, { skoStil: 'sneaker', sko: pick(R, F90.sneaker), dm: false, bred: Math.min(o.bred, 1.08), mage: false, halsduk: null, sverige: null, nitar: false });
    o.hatt = W.kall || W.sno ? 'mossa' : R() < 0.45 ? 'pannband' : null;
    if (o.hatt) o.mossa = pick(R, F90.mossa);
    Object.assign(o, { tofs: false, mRand: null, snoren: false, stickat: false, duo: null, pals: null });
    for (const k of ['hang', 'vaska', 'ryggsack', 'gitarr', 'pizza', 'blommor', 'mobil', 'cigg', 'skate', 'glass', 'paraply']) o[k] = null;
    o.walkman = R() < 0.5;
    o.walkmanF = R() < 0.6 ? '#e8b923' : null;
    return o;
  }
  // Ett sällskap: vem (o, st: sättet att gå, dx: cm före den första, ddm: m närmare en, k: barnets storlek)
  // och hur långt det når fram och bak (ut, cm). Alla går i den förstas fart.
  // Supporterhalsdukarna: lagets två färger (Stockholmslagen och de engelska lag som många höll på)
  const LAGEN = [['#1a1a1a', '#e8c020'], ['#1d4a9a', '#c8322a'], ['#1e7a3a', '#f3ead9'], ['#b8202a', '#f3ead9'], ['#c8202a', '#1a1a1a'], ['#f3ead9', '#1d3a8a'], ['#1d3a8a', '#f3ead9'], ['#1a1a1a', '#f3ead9'], ['#6a1e3a', '#7ab0e0']];
  // (det som inte passar ihop med att ha händerna fulla)
  const tomHand = (o) => { o.hang = null; o.mobil = null; o.glass = null; o.pizza = null; o.blommor = null; o.skate = null; o.gitarr = null; return o; };
  function sallskap(R, typ, v, L, W) {
    const en = (vem, x = {}) => klad(R, v, L, W, vem, x);
    const ett = (o, namn, ut = 100) => ({ vem: [{ o, st: gangFor(R, hander(o), W, namn) }], ut });
    if (typ === 'inlines') {
      const vem = pick(R, ['ung', 'ung', 'vuxen']);
      const ut = [];
      for (let i = 0, n = R() < 0.3 ? 2 : 1; i < n; i++) {
        const o = tomHand(en(vem, { utanParaply: true }));
        o.skoStil = 'inlines';
        o.sko = pick(R, ['#1a1a1e', '#e8e4dc', '#2a5ab0', '#1a1a1e', '#4a2a6a']);
        o.hjul = pick(R, ['#e8d84a', '#e0408a', '#7ad8d0', '#f0f0e8', '#8ae04a']);
        o.skydd = R() < 0.7 ? pick(R, ['#1a1a1e', '#2a2a30', '#c8322a', '#2a5ab0']) : null;
        o.ryggsack = R() < 0.3 ? o.ryggsack : null;
        o.cigg = false;
        o.walkman = o.walkman || (!o.hatt && R() < 0.4);
        ut.push({ o, st: gangFor(R, hander(o), W, 'skrinna'), dx: i ? -(70 + R() * 60) : 0, ddm: i ? -0.16 : 0 });
      }
      return { vem: ut, ut: 130 };
    }
    if (typ === 'rullator') {
      const o = en('aldre', { utanParaply: true });
      o.gF = 'rull';
      o.gB = 'rull';
      o.vagn = { typ: 'rullator', f: pick(R, ['#8a1e22', '#2a3a6a', '#3a5a3a', '#6a6a70']), korg: '#3a3a40', kasse: R() < 0.6 ? pick(R, ['#ece8e0', '#c8322a', '#2a5ab0']) : null };
      const st = gangFor(R, hander(o), W, 'strosar');
      st.lut += 6;
      st.S *= 0.85;
      return { vem: [{ o, st }], ut: 110 };
    }
    if (typ === 'supporter') {
      const lag = pick(R, LAGEN);
      const vem = pick(R, ['ung', 'ung', 'vuxen']);
      const namn = pick(R, ['vanlig', 'rask', 'studsar']);
      const ut = [];
      for (let i = 0, n = 2 + (R() < 0.4 ? 1 : 0); i < n; i++) {
        const o = en(vem, { utanParaply: i > 0 || R() < 0.5 });
        o.halsduk = lag[0];
        o.klubb = lag[1];
        Object.assign(o, { hForm: 'fram', hRand: null, hRutor: null });
        o.blommor = null;
        if (o.stil === 'tshirt') { o.rock = lag[0]; o.arm = lag[0]; o.tryck = lag[1]; o.sverige = null; }
        ut.push({ o, st: gangFor(R, hander(o), W, namn), dx: i === 0 ? 0 : i === 1 ? -(16 + R() * 24) : 38 + R() * 16, ddm: i === 1 ? -0.22 : i ? 0.12 : 0 });
      }
      return { vem: ut, ut: 120 };
    }
    if (typ === 'bergs') {
      const o = tomHand(en('ung', { utanParaply: true }));
      o.gB = 'bergs';
      o.bergs = pick(R, ['#b8bcc0', '#1a1a1e', '#2a2a30', '#c8c8cc']);
      o.ryggsack = null;
      o.walkman = false;
      o.vidd = 1.3;
      if (!o.hatt && R() < 0.6) o.hatt = 'bakkeps';
      return ett(o, pick(R, ['studsar', 'lunkar', 'vanlig']));
    }
    if (typ === 'gran') {
      const o = en(pick(R, ['vuxen', 'vuxen', 'aldre', 'ung']), { utanParaply: true });
      o.gF = 'under';
      o.gran = pick(R, ['#24452a', '#2a4e30', '#1e3e26']);
      return ett(o, pick(R, ['vanlig', 'rask']), 150);
    }
    if (typ === 'bud') {
      const o = tomHand(en(pick(R, ['vuxen', 'aldre', 'ung', 'vuxen']), { utanParaply: true }));
      o.gB = 'drar';
      o.vast = '#d8e23a';
      o.vagn = { typ: 'karra', tidn: true, f: pick(R, ['#c8322a', '#1d2a4a', '#2a4a8a', '#e8b923']), f2: pick(R, ['#e8e4dc', '#1a1a1a']) };
      return ett(o, 'rask', 100);
    }
    if (typ === 'turist') {
      const ut = [];
      for (let i = 0, n = R() < 0.5 ? 2 : 1; i < n; i++) {
        const o = tomHand(en('vuxen', { utanParaply: true }));
        o.kamera = i === 0 || R() < 0.4;
        o.mag = R() < 0.6 ? pick(R, ['#1a1a1e', '#2a5ab0', '#c8322a', '#e0408a']) : o.mag;
        if (i === 0) o.gF = 'karta';
        if (!['keps', 'fiskar'].includes(o.hatt) && R() < 0.6) { o.hatt = pick(R, ['fiskar', 'keps', 'fiskar']); o.mossa = pick(R, ['#e8e0c8', '#c8b48a', '#2a5ab0', '#e8e4dc']); }
        if (W.varm && o.ben !== 'kjol') { o.ben = 'shorts'; o.byxa = pick(R, F90.shorts); o.strumpa = '#ece8e0'; o.vidd = 1; }
        ut.push({ o, st: gangFor(R, hander(o), W, 'strosar'), dx: i ? -(18 + R() * 14) : 0, ddm: i ? -0.2 : 0 });
      }
      return { vem: ut, ut: 110 };
    }
    if (typ === 'skidor') {
      const o = tomHand(en(pick(R, ['ung', 'vuxen', 'vuxen']), { utanParaply: true }));
      o.gB = 'skid';
      o.skidor = pick(R, ['#c8322a', '#e8e4dc', '#1d3a8a', '#e8b923', '#1a1a1a', '#e0408a']);
      o.hang = { typ: 'stavar', f: pick(R, ['#1a1a1a', '#c8322a', '#2a5ab0']) };
      o.ryggsack = null;
      if (o.stil !== 'vind' && o.stil !== 'dun') { const b = pick(R, F90.vind); o.stil = 'vind'; o.rock = b[0]; o.blk = [b[1], b[2]]; o.arm = b[0]; o.lang = false; o.pals = null; }
      if (!o.hatt) { o.hatt = 'mossa'; o.mossa = pick(R, F90.mossa); }
      return ett(o, 'vanlig', 130);
    }
    if (typ === 'hund') {
      const o = en(pick(R, ['ung', 'vuxen', 'vuxen', 'aldre']));
      o.gF = 'koppel';
      o.hund = hundVal(R, W);
      o.mobil = null;
      return ett(o, pick(R, ['vanlig', 'vanlig', 'strosar', 'rask']), 135);
    }
    if (typ === 'par' || typ === 'gang') {
      const vem = typ === 'gang' ? 'ung' : pick(R, ['ung', 'vuxen', 'vuxen', 'aldre']);
      const namn = typ === 'gang' ? pick(R, ['vanlig', 'studsar', 'lunkar', 'slantrar']) : vem === 'aldre' ? 'strosar' : pick(R, ['vanlig', 'strosar']);
      const a = en(vem);
      // (ett par går ibland ut med hunden)
      if (typ === 'par' && vem !== 'ung' && R() < 0.22) { a.gF = 'koppel'; a.hund = hundVal(R, W); a.mobil = null; }
      const ut = [{ o: a, st: gangFor(R, hander(a), W, namn) }];
      const n = typ === 'gang' ? 2 + (R() < 0.5 ? 1 : 0) : 2;
      for (let i = 1; i < n; i++) {
        // (under samma paraply som den närmsta, eller under ett eget)
        const b = en(vem, { utanParaply: Boolean(a.paraply) && i === 1 && R() < 0.6 });
        ut.push({ o: b, st: gangFor(R, hander(b), W, typ === 'gang' ? undefined : namn), dx: i === 1 ? -(14 + R() * (typ === 'gang' ? 30 : 12)) : 36 + R() * 16, ddm: i === 1 ? -0.22 : 0.12 });
      }
      return { vem: ut, ut: a.hund ? 140 : 120 };
    }
    if (typ === 'familj') {
      // (en förälder med barnet i handen, den andra lite efter, ibland med hunden, och ibland ett större barn
      // som studsar i förväg)
      const a = en(pick(R, ['vuxen', 'vuxen', 'ung']));
      a.gF = 'hand';
      a.mobil = null;
      const b = en('barn');
      b.gF = 'barn';
      const [hx] = handVid(GREPP.hand);
      const [bx] = handVid(GREPP.barn);
      const ut = [{ o: a, st: gangFor(R, hander(a), W, 'strosar') }, { o: b, st: gangFor(R, hander(b), W, 'studsar'), dx: hx - bx * b.h, ddm: 0.14, k: b.h }];
      const c = en(a.vem === 'ung' ? 'ung' : 'vuxen', { utanParaply: Boolean(a.paraply) && R() < 0.5 });
      if (R() < 0.35) { c.gF = 'koppel'; c.hund = hundVal(R, W); c.mobil = null; }
      ut.push({ o: c, st: gangFor(R, hander(c), W, 'strosar'), dx: -(22 + R() * 26), ddm: -0.2 });
      if (R() < 0.45) {
        const d = en('barn');
        d.h += 0.06 + R() * 0.06;
        ut.push({ o: d, st: gangFor(R, hander(d), W, pick(R, ['studsar', 'studsar', 'vanlig'])), dx: 60 + R() * 40, ddm: 0.08 });
      }
      return { vem: ut, ut: 170 };
    }
    if (typ === 'skolbarn') {
      // (två eller tre större barn på väg till eller från skolan, med ryggsäckar)
      const ut = [];
      const namn = pick(R, ['studsar', 'vanlig', 'rask']);
      for (let i = 0, n = R() < 0.4 ? 3 : 2; i < n; i++) {
        const o = en('barn', { utanParaply: true });
        o.h = 0.68 + R() * 0.09;
        if (!o.ryggsack || R() < 0.3) o.ryggsack = pick(R, F90.ryggsack);
        ut.push({ o, st: gangFor(R, hander(o), W, i ? undefined : namn), dx: i === 0 ? 0 : i === 1 ? -(16 + R() * 26) : 34 + R() * 18, ddm: i === 1 ? -0.2 : i ? 0.12 : 0 });
      }
      return { vem: ut, ut: 110 };
    }
    if (typ === 'barn') {
      const a = en(pick(R, ['vuxen', 'vuxen', 'ung']));
      a.gF = 'hand';
      a.mobil = null;
      const b = en('barn');
      b.gF = 'barn';
      const [hx] = handVid(GREPP.hand);
      const [bx] = handVid(GREPP.barn);
      return { vem: [{ o: a, st: gangFor(R, hander(a), W, 'strosar') }, { o: b, st: gangFor(R, hander(b), W, 'studsar'), dx: hx - bx * b.h, ddm: 0.14, k: b.h }], ut: 110 };
    }
    if (typ === 'vagn') {
      const o = en(pick(R, ['vuxen', 'vuxen', 'ung']), { utanParaply: true });
      o.gF = 'vagn';
      o.gB = 'vagn';
      o.vagn = { typ: 'barnvagn', f: pick(R, ['#1d2a4a', '#2a3a2a', '#5a1e22', '#2a2a30', '#4a2a4a', '#1e5a6a']), f2: pick(R, ['#e8e4dc', '#c8b48a', '#c8322a']), skydd: W.regn || W.sno };
      return ett(o, pick(R, ['vanlig', 'strosar']), 150);
    }
    if (typ === 'karra') {
      const o = en('aldre');
      o.gB = 'drar';
      o.hang = null;
      o.vagn = { typ: 'karra', f: pick(R, ['#5a1e22', '#1d2a4a', '#2a4a2a', '#3a2a1a']), f2: pick(R, ['#c8a83a', '#e8e4dc', '#c8322a']) };
      return ett(o, 'strosar', 90);
    }
    if (typ === 'cykel') {
      const o = en(pick(R, ['ung', 'vuxen', 'vuxen']), { utanParaply: true });
      o.gF = 'cykel';
      o.vagn = { typ: 'cykel', f: pick(R, ['#8a1e1e', '#1a1a1a', '#1d3a7a', '#2a5a3a', '#a8d0c0', '#e8e4dc', '#4a2a6a']), korg: R() < 0.5 ? pick(R, ['#8a6a3a', '#1a1a1a']) : null };
      return ett(o, 'vanlig', 130);
    }
    if (typ === 'pulka') {
      const o = en(pick(R, ['vuxen', 'vuxen', 'ung']));
      o.gB = 'drar';
      o.hang = null;
      o.vagn = { typ: 'pulka', f: pick(R, ['#c8322a', '#2a5ab0', '#e8b923', '#2a8a4a']), f2: pick(R, F90.overall), f3: pick(R, F90.mossa), hud: pick(R, F90.hud) };
      return ett(o, 'vanlig', 175);
    }
    if (typ === 'tidning') {
      const o = en(pick(R, ['ung', 'vuxen', 'vuxen', 'kostym']), { utanParaply: true, utanHatt: true });
      o.gF = 'upp';
      o.gB = 'upp';
      o.tidning = true;
      o.hang = null;
      o.mobil = null;
      o.glass = null;
      return ett(o, 'rask');
    }
    if (typ === 'jogg') return ett(joggare(R, en(pick(R, ['ung', 'ung', 'vuxen'])), W), 'springer', 110);
    // De som powerwalkar, ofta två och två (den andra pratar i stället för att lyssna på freestylen), i myskläder.
    if (typ === 'power') {
      const vem = pick(R, ['vuxen', 'vuxen', 'vuxen', 'ung', 'aldre']);
      const ut = [];
      for (let i = 0, n = R() < 0.45 ? 2 : 1; i < n; i++) {
        const o = joggare(R, en(vem), W);
        if (i) o.walkman = false;
        ut.push({ o, st: gangFor(R, hander(o), W, 'power'), dx: i ? -(16 + R() * 14) : 0, ddm: i ? -0.2 : 0 });
      }
      return { vem: ut, ut: 120 };
    }
    // På väg hem från krogen: den ena vinglar, och kompisen (om någon) går som vanligt bredvid.
    if (typ === 'hemvag') {
      const vem = pick(R, ['ung', 'ung', 'vuxen']);
      const a = tomHand(en(vem));
      a.paraply = null;
      const ut = [{ o: a, st: gangFor(R, hander(a), W, 'vinglar') }];
      if (R() < 0.4) {
        const b = en(vem, { utanParaply: true });
        ut.push({ o: b, st: gangFor(R, hander(b), W), dx: -(18 + R() * 16), ddm: -0.2 });
      }
      return { vem: ut, ut: 120 };
    }
    const o = en(pick(R, ['ung', 'ung', 'vuxen', 'vuxen', 'vuxen', 'vuxen', 'aldre', 'kostym']));
    // (en del äldre går med käpp)
    if (o.vem === 'aldre' && R() < 0.4) {
      o.kapp = pick(R, ['#3a2416', '#1a1a1a', '#5a3a22', '#9a9a9a']);
      return ett(o, 'kapp');
    }
    // (den som blir blöt skyndar sig, och ibland springer den; i rusningen springer någon till bussen)
    const fort = W.regn && v.mangd > 0.45 && !o.paraply && o.stil !== 'regn';
    const h = v.timme + v.minut / 60;
    const rusar = !o.paraply && !W.halt && ((h > 7 && h < 9) || (h > 16 && h < 18)) && R() < 0.03;
    if ((fort && !W.halt && R() < 0.2) || rusar) {
      o.cigg = false;
      o.glass = null;
      return ett(o, 'springer');
    }
    return ett(o, fort ? 'rask' : undefined);
  }
  // (?rum-fasad-vem=inlines: alla som går förbi är sådana, för bilder och prov; vemGar har namnen)
  const VEM = (() => { try { return new URLSearchParams(location.search).get('rum-fasad-vem'); } catch (e) { return null; } })();
  // Lugnt men levande (2026-11-17, användarens önskemål: "lugnare/mindre stressig än vad den är nu – men också mer
  // levande"): färre går förbi samtidigt och i lugnare takt, men varje gång är det någon ny. Gatan delas i platser (högst
  // LUGN.max), var och en med ett varv om P sekunder, förskjutna jämnt så att de inte kommer i klump. I varje varv kommer
  // ett nytt sällskap (eller ingen, LUGN.tom), lottat ur platsens och varvets nummer, åt det ena eller andra hållet, en
  // stund in i varvet; förut gick samma sällskap (upp till tolv) runt i samma riktning gång på gång. Allt räknas ur
  // tiden, så att en stillbild (?rum-t) visar dem som går just då, och varje sällskap byggs först när dess varv börjar
  // (lopp), medan det ännu är utanför bilden. takt: hur fort de går mot förut (den som springer eller åker inlines som
  // förut); stegen är lika långa, så att gången är densamma.
  const LUGN = { andel: LATT ? 0.6 : 0.75, max: LATT ? 5 : 6, tom: 0.15, takt: 0.93 };
  function folket(V, v, L) {
    const T = U().trafik.nu(v);
    const fro = v.ar * 389 + v.manad * 37 + v.dag * 3 + (v.timme >> 1);
    const R = rng(fro + 11);
    const W = vadret(v, L);
    // (platserna: som på gatan inifrån och ett till utom på natten, gånger LUGN.andel, och färre i regnet och i
    // snöyran. Varvet: en passage tar 6–12 s och resten är tid utanför bilden, så långt att det i ett brett fönster i
    // snitt syns 0,75 + 0,18 · RumUte.trafik.gaende sällskap: två mitt på dagen och knappt ett och ett halvt en vanlig
    // kväll, med den som stannar)
    const n0 = Math.max(1, Math.min(LUGN.max, Math.round((T.gaende + (T.natt ? 0 : 1)) * LUGN.andel)));
    const n = Math.max(1, Math.round(n0 * (W.regn ? 0.7 : W.sno && v.mangd > 0.5 ? 0.8 : 1)));
    const P = T.natt ? 70 : Math.max(14, Math.min(40, (n0 * 7.6) / (0.75 + 0.18 * T.gaende)));
    const off = [...Array(n)].map((_, i) => ((i + 0.6 * R()) * P) / n);
    const minne = new Map();
    function lopp(i, m) {
      const key = m * 16 + i;
      if (minne.has(key)) return minne.get(key);
      // (vilka de är, kläderna och sättet att gå ur platsens och varvets egen följd)
      const RK = rng(fro + 977 * (i + 1) + 7919 * m);
      let lap = null;
      if (RK() > LUGN.tom) {
        // (på halkan går de flesta i ett sällskap försiktigt, halkar i gangFor)
        const sk = sallskap(RK, VEM || vemGar(RK, T, W, v), v, L, W.halt ? { ...W, halkar: RK() < 0.65 } : W);
        for (const x of sk.vem) if (x.st.namn !== 'springer' && x.st.namn !== 'skrinna') x.st.takt *= LUGN.takt;
        const dm = 0.3 + RK() * 0.4;
        const dir = RK() < 0.5 ? 1 : -1;
        const k0 = skala(dm) * M / 100;
        // (alla går i den förstas fart)
        const st0 = sk.vem[0].st;
        const fart = st0.S * k0 * st0.takt;
        const kant = sk.ut * k0 + 60;
        const tc = (V.w + 2 * kant) / fart;
        const start = m * P + off[i] + RK() * Math.max(0, P - tc);
        lap = {
          start, slut: start + tc, fart, dir, fran: dir > 0 ? V.x - kant : V.x + V.w + kant,
          folk: sk.vem.map((x) => {
            const dmm = Math.min(0.82, Math.max(0.12, dm + (x.ddm || 0)));
            const k = skala(dmm) * M / 100 * (x.k || x.o.h || 1);
            return { D: figurDelar(x.o, L), k, dir, stil: x.st, gfas: RK(), dm: dmm, y: markY(dmm), dx: (x.dx || 0) * k0, o: x.o, and: RK() * 4 };
          }),
        };
      }
      minne.set(key, lap);
      if (minne.size > 4 * n + 4) minne.delete(minne.keys().next().value);
      return lap;
    }
    // de som syns vid tiden t: [figuren, delarna, x, y, varvet], de bortre först
    return {
      vid(t) {
        const ut = [];
        for (let i = 0; i < n; i++) {
          const m = Math.floor((t - off[i]) / P);
          for (let j = m - 2; j <= m; j++) {
            const lap = lopp(i, j);
            if (!lap || t < lap.start || t > lap.slut) continue;
            const x0 = lap.fran + lap.dir * lap.fart * (t - lap.start);
            for (const f of lap.folk) {
              const x = x0 + f.dir * f.dx;
              if (x > V.x - 260 && x < V.x + V.w + 260) ut.push([f, f.D, x, f.y, lap]);
            }
          }
        }
        return ut.sort((p, q) => p[0].dm - q[0].dm);
      },
    };
  }

  // Någon stannar ibland framför fönstret och tittar in på oss: kommer gående, står en stund med ryggen mot
  // en vid fönstrets vänstra del (där skivan med löpsedlarna hänger, så att gänget syns), och går vidare. Inte
  // varje gång och inte mitt i natten; klädd efter vädret, utan paraply (det skulle skymma skylten). Sedan
  // 2026-11-17 oftare och längre (16–28 s; förut i sex av tio varv om 170 s och 13 s): den som står stilla och
  // tittar gör gatan levande utan att något far förbi.
  const STANNA = { cykel: 120, start: 18, dm: 0.25 };
  function stannar(V, v, L) {
    const T = U().trafik.nu(v);
    if (T.gaende < 2 || v.timme < 7 || v.timme >= 23) return null;
    const k = skala(STANNA.dm) * M / 100;
    const xs = FON.x + FON.w * 0.11;
    const W = vadret(v, L);
    // (en ny människa varje varv)
    const vem = (n) => {
      const R = rng(n * 131 + v.dag * 7 + v.manad);
      if (R() > 0.72) return null;
      const o = hander(klad(R, v, L, W, pick(R, ['ung', 'vuxen', 'vuxen', 'aldre', 'kostym']), { utanParaply: true }));
      o.walkman = false;
      // (den som stannar strosar, och går försiktigt på halkan)
      const stil = gangFor(R, o, W.halt ? { ...W, halkar: true } : W, 'strosar');
      const bakO = { ...o, mossa: ['mossa', 'oron', 'luva', 'slak', 'docker', 'pals'].includes(o.hatt) ? o.mossa : null };
      const dir = n % 2 ? -1 : 1;
      const xa = dir > 0 ? V.x - 200 : V.x + V.w + 200;
      const xb = dir > 0 ? V.x + V.w + 200 : V.x - 200;
      const kk = k * (o.h || 1);
      return { o, dir, xa, xb, D: figurDelar(o, L), B: bakDelar(bakO, L), k: kk, stil, fart: stil.S * kk * stil.takt * LUGN.takt, dm: STANNA.dm, sta: 16 + R() * 12 };
    };
    const minne = new Map();
    return (t) => {
      const n = Math.floor(t / STANNA.cykel);
      if (!minne.has(n)) { minne.clear(); minne.set(n, vem(n)); }
      const f = minne.get(n);
      if (!f) return null;
      let tau = t - n * STANNA.cykel - STANNA.start;
      const fart = f.fart;
      const tIn = Math.abs(xs - f.xa) / fart;
      const tUt = Math.abs(f.xb - xs) / fart;
      if (tau < 0 || tau > tIn + f.sta + tUt) return null;
      if (tau < tIn) return { f, x: f.xa + f.dir * fart * tau, sta: false };
      tau -= tIn;
      if (tau < f.sta) return { f, x: xs, sta: true };
      return { f, x: xs + f.dir * fart * (tau - f.sta), sta: false };
    };
  }

  // Bilarna på gatan bakom en syns i glaset: på dagen som mörka skuggor som far förbi, på kvällen
  // baklyktorna. Alla åt vänster, som på gatan (den är enkelriktad, rum-fasad-gatan.js). Bussarna lika, men
  // längre. Samma bil far över fönstret och dörren (glasen sitter i samma plan).
  function bilarna(v, L, px) {
    const T = U().trafik.nu(v);
    const R = rng(v.ar * 131 + v.manad * 17 + v.dag + (v.timme >> 1) + 5);
    const mork = L.lampor || L.dag < 0.35;
    const n = Math.min(4, T.bilar + 1);
    const yk = FON.y + FON.h * 0.54;
    const hk = FON.h * 0.3;
    const ut = [];
    for (let i = 0; i < n; i++) {
      const dir = -1;
      const buss = T.bussar && R() < 0.25;
      const w = buss ? 900 : 360;
      // (glesare och svagare sedan 2026-11-17, som bilarna på gatan)
      const varv = (T.varv[0] + R() * (T.varv[1] - T.varv[0])) * (0.9 + R() * 0.6);
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
      ut.push({ w, dir, mork, bild, a: LATT ? 0.15 : 0.21, yk, hk, g: { fran, till, dur: varv, fas: R() * varv } });
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
      // stänken: på stenen (x i fasadens mått, d meter ut), på fönsterbänkens bleck och skyltens tak (d −1:
      // y står i x-platsen bredvid), och hur fort och när i varvet; inte där snön ligger
      if (!v.snotackt) {
        const RS = rng(7);
        const yMax = V.y + V.h;
        const ut = [];
        const nSten = Math.round((LATT ? 70 : 130) * (0.4 + 0.6 * k) * (dugg ? 0.35 : 1));
        for (let i = 0; i < nSten; i++) {
          const d = 0.03 + Math.pow(RS(), 1.25) * 4;
          const xw = V.x - 200 + RS() * (V.w + 400);
          if (markY(d) < yMax + 10) ut.push(xw, d, 1.2 + RS(), RS());
        }
        const nKant = Math.round((LATT ? 14 : 22) * (0.4 + 0.6 * k) * (dugg ? 0.35 : 1));
        for (let i = 0; i < nKant; i++) ut.push(FON.x - KARM - 14 + RS() * (FON.w + 2 * KARM + 28), -(FON.y + FON.h + KARM - 2), 1.4 + RS() * 0.6, RS());
        for (let i = 0; i < nKant * 0.8; i++) ut.push(SKYLT.x - 8 + RS() * (SKYLT.w + 16), -(SKYLT.y - 10), 1.4 + RS() * 0.6, RS());
        N.stank = new Float32Array(ut);
        N.droppar = !dugg;
      }
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
  // ---------- regnet i ljuset ----------
  //
  // På kvällen syns regnet där något lyser – i svanhalsarnas käglor, framför fönstret och dörren, kring lyktan
  // vid porten och under gatlyktan på bron – och knappt i mörkret, och där det lyser är det varmt. Ljuset
  // räknas ut en gång när scenen ritas (ljusKarta: rutor om RUTA enheter), och varje streck, stänk och droppe
  // tar sitt ljus ur rutan där det är. På dagen syns regnet lika överallt, som förut.
  const RUTA = 24;
  function ljusVid(x, y, L, ljus) {
    const mork = 1 - L.dag;
    if (mork < 0.05) return 0;
    const sk = SKYLT;
    const ruta = (x0, x1, y0, y1, m) => sm(x0 - m, x0 + m * 0.4, x) * (1 - sm(x1 - m * 0.4, x1 + m, x)) * sm(y0 - m, y0 + m * 0.4, y) * (1 - sm(y1 - m * 0.4, y1 + m, y));
    let l = 0;
    if (L.lampor) {
      for (const lx of [sk.x + sk.w * 0.2 + 47, sk.x + sk.w * 0.8 - 47]) {
        if (y > 252 && y < 470) {
          const f = (y - 252) / 190;
          const w = 14 + 170 * f;
          const dx = (x - lx) / w;
          if (dx > -1 && dx < 1) l += (1 - dx * dx) * (1 - 0.5 * f);
        }
        l += Math.max(0, 1 - Math.hypot(x - lx, (y - 256) * 1.4) / 85) * 1.1;
      }
      l += Math.max(0, 1 - Math.hypot(x - 341, (y - 380) * 0.8) / 150) * 0.9;
      if (y > LYKTA) {
        const f = Math.min(1, (y - LYKTA) / (MARK - LYKTA));
        const w = 26 + 330 * f;
        const dx = (x - 1720) / w;
        if (dx > -1 && dx < 1) l += (1 - dx * dx) * 0.7 * (1 - 0.3 * f);
      }
      l += Math.max(0, 1 - Math.hypot(x - 1720, y - LYKTA - 16) / 140) * 1.2;
    }
    // fönstret och dörren lyser bakom regnet, och ut på trottoaren
    const inne = 0.35 + 0.65 * ljus;
    l += inne * (0.55 * ruta(FON.x, FON.x + FON.w, FON.y, FON.y + FON.h + 30, 40) + 0.5 * ruta(DORR.x, DORR.x + DORR.w, DORR.y, DORR.y + DORR.h, 30));
    if (y > MARK - 10) {
      const ned = 1 - sm(MARK, MARK + 260, y);
      l += inne * ned * Math.max(0.8 * sm(FON.x - 90, FON.x + 30, x) * (1 - sm(FON.x + FON.w - 30, FON.x + FON.w + 90, x)),
        0.85 * sm(DORR.x - 60, DORR.x + 10, x) * (1 - sm(DORR.x + DORR.w - 10, DORR.x + DORR.w + 60, x)));
      if (L.lampor) l += Math.max(0.45 * (1 - sm(0, 160, Math.abs(x - 341))) * ned, 0.9 * (1 - sm(0, 330, Math.abs(x - 1720))));
    }
    return mork * l;
  }
  function ljusKarta(V, L, ljus) {
    const nx = Math.ceil((V.w + 400) / RUTA) + 1;
    const ny = Math.ceil(V.h / RUTA) + 2;
    const a = new Float32Array(nx * ny);
    const x0 = V.x - 200;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) a[j * nx + i] = ljusVid(x0 + i * RUTA, V.y + j * RUTA, L, ljus);
    return { a, nx, ny, x0, y0: V.y };
  }
  const iKartan = (K, x, y) => {
    const i = Math.round((x - K.x0) / RUTA);
    const j = Math.round((y - K.y0) / RUTA);
    return i < 0 || j < 0 || i >= K.nx || j >= K.ny ? 0 : K.a[j * K.nx + i];
  };
  // hur starkt i ljuset (0 … 3): de fyra stegen som strecken delas i, och hur mycket starkare de är där
  const ljusSteg = (l) => (l < 0.12 ? 0 : l < 0.35 ? 1 : l < 0.7 ? 2 : 3);
  const STEG_A = [0.3, 0.95, 1.8, 2.8];
  // Stänken där regnet slår ned (en ring som vidgas och en liten krona i början) och dropparna som hänger
  // under skyltens kant, lampskärmarna och lyktan och faller: i ljuset på kvällen, svagt på dagen.
  const DROPPAR = [414, 486, 566, 652, 731, 812, 893, 968, 1046, 1121];
  function ritaStank(c, N, K, t, dag) {
    if (!N || !N.stank) return;
    const S = N.stank;
    const bin = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const syn = (x, y) => (K ? ljusSteg(iKartan(K, x, y)) : 1);
    for (let i = 0; i < S.length; i += 4) {
      const fas = (t * S[i + 2] + S[i + 3] * 7) % 1;
      let x; let y; let k;
      if (S[i + 1] >= 0) { const d = S[i + 1]; x = OGA_X + (S[i] - OGA_X) * skala(d); y = markY(d); k = skala(d) * 1.1; } else { x = S[i]; y = -S[i + 1]; k = 0.8; }
      const p = bin[dag > 0.5 ? 1 : syn(x, y - 6)];
      const r = (2.5 + 8 * fas) * k;
      p.moveTo(x + r, y);
      p.ellipse(x, y, r, r * 0.26, 0, 0, 2 * Math.PI);
      if (fas < 0.22) {
        const h = (1.5 + 9 * fas) * k;
        p.moveTo(x - k, y); p.lineTo(x - 2.6 * k, y - h);
        p.moveTo(x + k, y); p.lineTo(x + 2.6 * k, y - h);
      }
    }
    const fall = new Path2D();
    const hang = new Path2D();
    if (N.droppar) {
      const sk = SKYLT;
      const droppe = (p, x, y, l, b) => { p.moveTo(x + b, y); p.ellipse(x, y, b, l, 0, 0, 2 * Math.PI); };
      const rad = (x, y0, y1, fart, seed) => {
        droppe(hang, x, y0 + 2.6, 2.4, 1.8);
        for (let j = 0; j < 2; j++) {
          const q = (t * fart + j / 2 + seed) % 1;
          droppe(fall, x, y0 + 6 + q * q * (y1 - y0), 2.5 + 8 * q, 1.3);
        }
      };
      DROPPAR.forEach((x, i) => rad(x, sk.y + sk.h, FON.y + FON.h + KARM - 6, 0.55 + (i % 3) * 0.06, (i * 0.37) % 1));
      if (dag < 0.5) for (const lx of [sk.x + sk.w * 0.2 + 47, sk.x + sk.w * 0.8 - 47]) { rad(lx - 17, 254, 330, 0.9, 0.2); rad(lx + 17, 254, 330, 0.85, 0.7); }
      rad(334, 404, 520, 0.8, 0.4);
      rad(349, 404, 520, 0.7, 0.9);
    }
    const ljust = dag > 0.5 ? '#e4eaf0' : '#fff1dc';
    c.lineCap = 'round';
    c.lineWidth = 1.1;
    c.strokeStyle = ljust;
    bin.forEach((p, b) => { c.globalAlpha = dag > 0.5 ? 0.16 : [0.05, 0.16, 0.32, 0.5][b]; c.stroke(p); });
    c.fillStyle = ljust;
    c.globalAlpha = dag > 0.5 ? 0.35 : 0.85;
    c.fill(hang);
    c.globalAlpha = dag > 0.5 ? 0.3 : 0.75;
    c.fill(fall);
    c.globalAlpha = 1;
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
  function ritaNederbord(c, N, V, t, K, dag = 1) {
    if (!N) return false;
    const { H } = N;
    // (på kvällen fyra steg i ljuset, ljusKarta; på dagen ett)
    const NS = K && dag < 0.95 ? 4 : 1;
    for (const l of N.lager) {
      const dy = ((((t / l.dur) % 1) + 1) % 1) * H;
      if (l.typ === 'regn') {
        // (tre grupper efter hur starka strecken är och fyra steg i ljuset, så att det blir få anrop)
        const grupp = [];
        for (let i = 0; i < 3 * NS; i++) grupp.push(new Path2D());
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
            const p = grupp[g * NS + (NS > 1 ? ljusSteg(iKartan(K, x - len * N.slant * 0.5, V.y + yy + len * 0.5) * (l.fjarr ? 0.75 : 1)) : 0)];
            p.moveTo(x, V.y + yy);
            p.lineTo(x - len * N.slant, V.y + yy + len);
          }
        }
        c.lineCap = 'butt';
        grupp.forEach((p, i) => {
          const g = Math.floor(i / NS);
          const s = i % NS;
          c.strokeStyle = NS > 1 && s > 1 ? '#ffe8cc' : '#c8d6f0';
          c.globalAlpha = (l.fjarr ? 0.8 : 1) * [0.07, 0.12, 0.17][g] * (NS > 1 ? dag + (1 - dag) * STEG_A[s] : 1);
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
  // de som går och den som har stannat, bilarna och bussarna på gatan (rum-fasad-gatan.js), regnet, snön och
  // blixten. Syns inget som rör sig töms duken en gång.
  function ritaFram(R, t) {
    const { V, L } = R;
    const c = R.fram;
    const lista = R.folk ? R.folk.vid(t) : [];
    const st = R.stanna && R.stanna(t);
    if (st) lista.unshift([{ k: st.f.k, dir: st.sta ? 1 : st.f.dir, sta: st.sta, stil: st.f.stil, dm: STANNA.dm }, st.sta ? st.f.B : st.f.D, st.x, markY(STANNA.dm)]);
    const bilar = R.bilar.some((b) => { const x = glidX(b.g, t); return x < DORR.x + DORR.w + 100 && x + b.w > FON.x - 100; });
    // (bilarna och bussarna på gatan framför, rum-fasad-gatan.js)
    const gata = R.gata ? GATA().syns(R.gata, t, V) : null;
    R.fortGata = Boolean(gata);
    // (löven, duvorna och andedräkten, rum-fasad-liv.js)
    const liv = R.liv && LIV().syns(R.liv, t) ? R.liv : null;
    if (!lista.length && !bilar && !gata && !R.N && !liv && R.tom) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    R.tom = !lista.length && !bilar && !gata && !R.N && !liv;
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
    // (löven närmast fasaden, de som går bakom duvorna, duvorna på stenen, de andra som går, andedräkten, duvorna i
    // luften och löven framför dem)
    if (R.liv) LIV().lov(c, R.liv, t, 0);
    const duvMark = R.liv ? LIV().MARK : 0;
    let i = 0;
    const figur = ([f, D, x, y]) => {
      const z = morkSteg(x, L);
      ritaFigur(c, f, D, x, y, t, L, { A: R.A, rand: randLjus(x, L), lykta: underLykta(x, L), z, zBen: benSteg(x, z, L) });
    };
    for (; i < lista.length && R.liv && lista[i][0].dm < duvMark; i++) figur(lista[i]);
    if (R.liv) LIV().duvor(c, R.liv, t, lista.map(([f, , x]) => [x, f.dm, f.sta ? 0 : f.dir]), false);
    for (; i < lista.length; i++) figur(lista[i]);
    if (R.liv) {
      LIV().ande(c, R.liv, lista, t);
      LIV().duvor(c, R.liv, t, null, true);
      LIV().lov(c, R.liv, t, 1);
    }
    // (stänken på stenen bakom dem som kör förbi, och fordonen framför dem som går)
    if (gata) {
      ritaStank(c, R.N, R.K, t, L.dag);
      GATA().rita(c, R.gata, gata, t);
    }
    if (R.liv) LIV().lov(c, R.liv, t, 2);
    // (i dimma: samma dis över dem som över allt bakom, bara där något är ritat)
    if (R.dimma) {
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = R.dimma.a;
      c.fillStyle = R.dimma.c;
      c.fillRect(V.x, V.y, V.w, V.h);
      c.restore();
    }
    ritaNederbord(c, R.N, V, t, R.K, L.dag);
    if (!gata) ritaStank(c, R.N, R.K, t, L.dag);
  }

  // ---------- att bygga och rita ----------

  // Gatan och trafiken framför affären (rum-fasad-gatan.js) får fasadens mått och hjälpare.
  const GATA = () => window.RumFasadGatan || null;
  let gataG = null;
  const gataMatt = () => gataG || (gataG = { M, MARK, HOR, AVST, OGA_X, VARLD, FON, DORR, markY, skala, tone, mix, rng, pick, r1, sm, snoC, lovet, LATT });
  // Det lilla som lever (rum-fasad-liv.js): löven, andedräkten och duvorna, med samma mått och kantljuset (randLjus).
  const LIV = () => window.RumFasadLiv || null;
  let livG = null;
  const livMatt = () => livG || (livG = { ...gataMatt(), ljus: randLjus });

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
    const F = { V: null, sig: '', gl: null, glasR: null, glasPx: null, raf: 0, sist: 0, tider: [], vantar: false, neon: null, klar: false, ro: null };
    const calm = () => Boolean(o.calm && o.calm());
    // (dukarnas bildpunkter per enhet i världen: skärmens, högst två miljoner bildpunkter på hela fönstret)
    const tathet = (V) => {
      const W = el.clientWidth || innerWidth;
      const H = el.clientHeight || innerHeight;
      return Math.max(W / V.w, H / V.h) * Math.min(2, devicePixelRatio || 1, Math.sqrt(2e6 / (W * H)));
    };
    // En duk som inte behövs längre lämnar tillbaka sitt minne genast när den blir noll stor (slapp): annars
    // ligger bildpunkterna kvar tills skräpsamlingen hinner dit, och i en telefon hann de bli många – vid
    // varje ombygge av scenen (rita) och varje gång man gick ut och in igen (ut). Scenens dukar, bilarnas och
    // molnens (dukarna).
    const slapp = (c) => { if (c && c.width) { c.width = 0; c.height = 0; } };
    const dukarna = (R) => (R ? [R.fram && R.fram.canvas, R.bak && R.bak.canvas, R.barber && R.barber.canvas,
      ...(R.bilar || []).map((b) => b.bild), ...((R.himlen && R.himlen.moln) || []).map((m) => m.bild)] : []);
    // (scenen i fönstrets punkter: F.k punkter per enhet i världen, passa)
    const duk = (cls, r, px) => `<canvas class="${cls}" width="${Math.max(1, Math.round(r.w * px))}" height="${Math.max(1, Math.round(r.h * px))}" style="left:${r1((r.x - F.V.x) * F.k)}px; top:${r1((r.y - F.V.y) * F.k)}px; width:${r1(r.w * F.k)}px; height:${r1(r.h * F.k)}px"></canvas>`;

    function rita() {
      const a = (el.clientWidth || innerWidth) / (el.clientHeight || innerHeight);
      const V = vy(a);
      const v = window.Vader ? Vader.nu() : null;
      if (!v || !U()) return;
      const L = U().light(v);
      // (och dukarnas bildpunkter, i steg om en åttondel: storleken på skärmen, tathet)
      const px = tathet(V);
      const s = `${sig(V, v, L, o)},${Math.round(px * 8)}`;
      if (s === F.sig) return;
      F.sig = s;
      F.V = V;
      F.k = Math.max((el.clientWidth || innerWidth) / V.w, (el.clientHeight || innerHeight) / V.h);
      const defs = `<defs><filter id="rf-mjuk" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="rf-neon-b" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
        <clipPath id="rf-glas-k"><rect x="${FON.x}" y="${FON.y}" width="${FON.w}" height="${FON.h}"/><rect x="${DORR.x}" y="${DORR.y}" width="${DORR.w}" height="${DORR.h}"/></clipPath>
        <clipPath id="rf-hal"><path clip-rule="evenodd" d="M${VARLD.x0} ${VARLD.y0} H${VARLD.x1} V${VARLD.y1} H${VARLD.x0} Z M${FON.x} ${FON.y} h${FON.w} v${FON.h} h${-FON.w} Z M${DORR.x} ${DORR.y} h${DORR.w} v${DORR.h} h${-DORR.w} Z"/></clipPath></defs>`;
      const glasX = FON.x - V.x;
      const glasY = FON.y - V.y;
      // (gängets bildpunkter: fönstrets storlek på skärmen, högst 1400 på bredden)
      const k = Math.min(innerWidth / V.w, innerHeight / V.h);
      const pr = Math.min(2, devicePixelRatio || 1);
      const dw = Math.round(Math.min(1400, FON.w * k * pr));
      F.glasPx = { w: dw, h: Math.round(dw * FON.h / FON.w) };
      const gamla = dukarna(F.ro);
      // det som rör sig: vad, var och hur (inget med prefers-reduced-motion, utom stången som står still)
      const lugn = calm();
      const bakX = Math.max(V.x, HORN - 520);
      const bakR = { x: bakX, y: V.y, w: V.x + V.w - bakX, h: HOR + 60 - V.y };
      const himlen = !lugn && bakR.w > 0 ? himmelsliv(V, v, L, px) : null;
      const barberR = BARBER.x + BARBER.w > V.x && BARBER.x < V.x + V.w ? BARBER : null;
      // (pyntets dukar: som de andra, men högst 1400 bildpunkter på fönstrets bredd)
      const pyntPx = Math.min(px, 1400 / FON.w);
      const pyntBild = pyntBilder(L, pyntPx);
      const R = {
        px, V, L, bakR, himlen,
        folk: lugn ? null : folket(V, v, L),
        stanna: lugn ? null : stannar(V, v, L),
        bilar: lugn ? [] : bilarna(v, L, px),
        gata: lugn || !GATA() ? null : GATA().trafik(v, L, gataMatt()),
        liv: lugn || !LIV() ? null : LIV().liv(V, v, L, livMatt()),
        N: lugn ? null : nederbord(V, v),
        // (ljuset där regnet faller, på kvällen: ljusKarta)
        K: !lugn && (v.fall === 'regn' || v.fall === 'blandat') && L.dag < 0.95 ? ljusKarta(V, L, inne(o)) : null,
        vat: (L.wet || v.blott) && !v.snotackt,
        A: 1,
        dimma: L.dimma > 0.05 ? { c: mix('#2a2622', '#aeb3b6', L.dag), a: 0.32 * L.dimma } : null,
        spegelA: 0.14 + 0.1 * (1 - L.dag),
        tom: false,
      };
      // Det som står still är en SVG mellan varje duk (fyra i stället för nio), i fönstrets storlek: förut
      // var de i världens mått och förminskades (i en telefon på höjden till 0,45), och Safari ritar ett lager
      // i dess egen storlek gånger pixeltätheten, så att varje lager tog fem gånger så mycket minne som det
      // syns (ungefär 50 MB i stället för 10 i en iPhone).
      const sk = F.k;
      const pyntDukar = pyntBild.map((b, i) => (b ? duk('rf-pynt', i ? DORR : FON, pyntPx) : '')).join('');
      const framfor = `<g clip-path="url(#rf-hal)">${huset(V, v, L, o)}</g>${bron(V, v, L)}${marken(V, v, L)}${GATA() ? GATA().mark(V, v, L, gataMatt()) : ''}${texten(v, L)}`;
      scen.style.transform = '';
      scen.style.width = `${r1(V.w * sk)}px`;
      scen.style.height = `${r1(V.h * sk)}px`;
      scen.innerHTML =
        svg(V, defs + himmel(V, v, L)) +
        (himlen ? duk('rf-bak', bakR, px) : '') +
        svg(V, defs + bortom(V, v, L) + rummet(v, L, o)) +
        // (här står gängets duk, glas; högtidspyntet mellan neonen och glaset, bara när det finns: annars ett lager mindre)
        (pyntDukar
          ? svg(V, `${defs}${iFonstret(v, L, o)}${neonSkylt()}`, 'rf-fonster') + pyntDukar + svg(V, `${defs}${glaset(v, L, o)}${framfor}`)
          : svg(V, `${defs}${iFonstret(v, L, o)}${neonSkylt()}${glaset(v, L, o)}${framfor}`, 'rf-fonster')) +
        (barberR ? duk('rf-barber', barberR, px) : '') +
        svg(V, kvallsljus(V, v, L, o)) +
        (L.dimma > 0.05 ? `<div class="rf-lager rf-dimma" style="background:${mix('#2a2622', '#aeb3b6', L.dag)}; opacity:${r1(0.32 * L.dimma)}"></div>` : '') +
        duk('rf-fram', V, px);
      F.glasR = { x: r1(glasX * sk), y: r1(glasY * sk), w: r1(FON.w * sk), h: r1(FON.h * sk) };
      placera();
      // (getContext ger null när telefonen inte har mer minne till dukar: då står det som skulle ha ritats
      // där still och resten rör sig ändå – förut kastade det ett fel, och fasaden stod som en fast bild eller
      // gick inte att klicka bort)
      R.fram = scen.querySelector('.rf-fram').getContext('2d');
      R.bak = himlen ? scen.querySelector('.rf-bak').getContext('2d') : null;
      R.barber = barberR ? scen.querySelector('.rf-barber').getContext('2d') : null;
      F.ro = R;
      pynt(pyntBild);
      // (en fast bild: allt som rör sig står på samma tid)
      if (o.still != null) for (const an of el.getAnimations({ subtree: true })) { an.pause(); an.currentTime = o.still * 1000; }
      for (const c of gamla) slapp(c);
      F.neon = null;
      passa();
      gang();
      rorelse(true);
    }
    // Högtidspyntet i skyltfönstret och på dörren, så som det hänger inne (o.pynt, pyntUtifran i
    // rum-inredning.js): bilderna tas fram innan scenen byggs (rita), så att dukarna och lagret de kräver bara
    // finns när det finns pynt, och ritas en gång på var sin duk framför neonen och bakom glaset, så att
    // speglingen, imman och dropparna ligger över det. Innan rummets 3D-delar är klara finns inget pynt.
    function pyntBilder(L, px) {
      return [['pyntF', FON], ['pyntP', DORR]].map(([namn, r]) => {
        if (!o.pynt) return null;
        try {
          return o.pynt(namn, { w: Math.max(1, Math.round(r.w * px)), h: Math.max(1, Math.round(r.h * px)), dag: L.dag }) || null;
        } catch (err) { return null; /* utan pyntet: glaset som vanligt */ }
      });
    }
    function pynt(bilder) {
      const dukar = scen.querySelectorAll('.rf-pynt');
      let j = 0;
      for (const bild of bilder) {
        if (!bild || !dukar[j]) continue;
        const g = dukar[j++].getContext('2d');
        if (g) g.drawImage(bild, 0, 0);
      }
    }
    // Gängets duk i skyltfönstret (glas i rum.js): rummet lånar ut den medan det inte syns, och den står där
    // gänget syns genom glaset, bakom neonen och glaset. Förut ritades glaset i rummets duk och kopierades
    // hit efter varje bild, ett arbete på grafikkortet som bara fanns ute; nu visar duken själv det som
    // ritas i den, som inne. Den följer med när scenen byggs om (placera). null: rummet tar tillbaka den.
    function glas(c) {
      const g = F.gl;
      F.gl = c || null;
      if (g && g !== F.gl) {
        g.classList.remove('rf-gang');
        g.remove();
      }
      placera();
      if (!F.gl) return;
      gang();
      // (den kommer när rummet bakom har dolts, och tonar fram)
      if (F.gl !== g && !calm() && o.still == null && F.gl.animate) F.gl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    }
    function placera() {
      const c = F.gl;
      const r = F.glasR;
      if (!c || !r) return;
      c.classList.add('rf-gang');
      Object.assign(c.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
      const fore = scen.querySelector('.rf-fonster');
      if (c.parentNode !== scen || c.nextSibling !== fore) scen.insertBefore(c, fore);
    }
    // Scenen täcker fönstret: den byggs i fönstrets storlek (F.k), och när storleken ändras skalas den om så
    // länge, tills den byggs om (storlek). Och dörrens mitt i fönstret, dit man går in och ut.
    function passa() {
      if (!F.V) return;
      const k = Math.max(el.clientWidth / F.V.w, el.clientHeight / F.V.h) || F.k;
      const sk = k / F.k;
      scen.style.transform = Math.abs(sk - 1) < 1e-3 ? '' : `scale(${sk})`;
      el.style.setProperty('--dorr-x', `${r1((DORR.x + DORR.w / 2 - F.V.x) * k)}px`);
      el.style.setProperty('--dorr-y', `${r1((DORR.y + DORR.h * 0.45 - F.V.y) * k)}px`);
    }
    // Gänget i fönstret och neonen: lika ofta som gänget ritas inne (o.takt, efter vad enheten hinner med),
    // men glesare om en bild av gänget tar mer än en fjärdedel av tiden (GANG_ANDEL; F.tider: de senaste,
    // och mitten av dem räknas), så att regnet och de som går förbi inte hackar för gängets skull i en svag
    // telefon eller dator. Gänget ritas direkt efter bildrutan (efter), som inne (efterBild i rum.js): då
    // har det hela tiden till nästa, och det som ritas i bildrutan väntar inte. En gång i en stillbild.
    // Förut ritades hela gängets duk några gånger i sekunden, och då hackade gänget fram; nu ritas bara
    // glaset (utifran i rum-3d.js). Utan duk i fönstret (glas) ritas inget.
    const GANG_ANDEL = 0.25;
    function gangDags(ms) {
      const takt = (o.takt && o.takt()) || (LATT ? 20 : 30);
      const tid = F.tider.length ? [...F.tider].sort((a, b) => a - b)[F.tider.length >> 1] : 0;
      return ms - F.sist >= Math.max(1000 / takt - 4, tid / GANG_ANDEL);
    }
    const efter = new MessageChannel();
    efter.port1.onmessage = () => {
      F.vantar = false;
      if (el.isConnected) gang();
    };
    function gang() {
      const ms = performance.now();
      if (F.gl && F.glasPx && o.gang) o.gang(F.glasPx);
      F.tider.push(performance.now() - ms);
      if (F.tider.length > 9) F.tider.shift();
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
      if (R.fram && dags(R.sFram, R.fortGata ? TAKT_GATA : TAKT)) {
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
      const tick = (ms) => {
        if (!el.isConnected) return;
        // (nästa bildruta först: ett fel i en bild får inte stoppa allt som rör sig för gott)
        F.raf = requestAnimationFrame(tick);
        // (F.sist: bildrutan som gänget ritades efter)
        if (!F.vantar && gangDags(ms)) {
          F.sist = ms;
          F.vantar = true;
          efter.port2.postMessage(0);
        }
        rorelse();
      };
      F.raf = requestAnimationFrame(tick);
    }
    // vädret och ljuset ändras: ritas om när de har ändrats (sig), en gång i minuten
    const T = setInterval(() => { if (el.isConnected) rita(); }, 60e3);
    // Storleken ändras (telefonen vrids, adressfältet glider in eller ut): scenen skalas om genast så att
    // den täcker fönstret (passa), och byggs om först när storleken har stått still en stund, och bara om
    // vyn eller dukarnas bildpunkter har ändrats (sig). Förut byggdes allt om – alla lager och dukar – vid
    // varje resize, och i en telefon kommer de en per bildruta medan adressfältet glider: 60 i rad tog
    // ungefär 600 MB mer minne (som iPhone i Chromium), och sidan kraschade.
    let storlekT = 0;
    const storlek = () => {
      passa();
      clearTimeout(storlekT);
      storlekT = setTimeout(() => { if (el.isConnected) rita(); }, 300);
    };
    addEventListener('resize', storlek);
    // (ett fel när scenen byggs får inte lämna kvar en fasad som inte går att klicka bort: rum.js sätter
    // klicket och Esc först när bygg har kommit tillbaka)
    try {
      rita();
    } catch (err) {
      console.error(err);
    }
    loop();
    return {
      el,
      ny: () => { F.sig = ''; rita(); },
      glas,
      ut() {
        cancelAnimationFrame(F.raf);
        clearInterval(T);
        clearTimeout(storlekT);
        removeEventListener('resize', storlek);
        el.remove();
        for (const c of dukarna(F.ro)) slapp(c);
        F.ro = null;
        // (gängets duk är rummets: rum.js ställer tillbaka den, glas)
        F.gl = null;
      },
    };
  }

  // (gången och huvudet också för dem som går på gatan inifrån, rum-ute.js: samma sätt att gå och samma ställning)
  return { bygg, vy, FON, DORR, gang: { stil: gangStil, stalln, KAPP, HUVUD, HAR, GSTIL } };
})();
