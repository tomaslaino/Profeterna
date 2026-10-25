'use strict';

// ---------- utsikten i tobaksaffären ----------
//
// Gatan utanför skyltfönstret och dörren (rum.js), efter Stockholms klocka,
// årstid och väder (vader.js): himlen över de lägre taken med moln, månen
// och stjärnorna, fasaderna mittemot med pizzerian, gatlyktorna och en
// parkerad bil, och de som går, cyklar och åker förbi. Utsikten ligger bakom
// väggen i det bakersta planet och syns genom hålen i den (masken rum-hal i
// rum.js), i scenens koordinater: den som går förbi syns först i dörren och
// sedan i fönstret.
//
// Lagren, bakifrån: himlen (SVG), livet på himlen (molnen, fåglarna,
// fyrverkerierna), blixten, gatan (SVG), livet på gatan, nederbörden och glaset
// (dropparna, frosten). Bilderna ritas om när ljuset eller vädret ändras;
// det som rör sig är CSS-animationer med bara transform och opacity
// (rum-ute.css), som står still med prefers-reduced-motion och ?rum-t.
//
//   RumUte.paint(el, v) ritar om de lager som har ändrats (v = Vader.nu())
//
// Årstiderna: löv som blåser förbi och ligger på gatan på hösten, snö på
// taken, plogbilen och pulkor på vintern, adventsstjärnor och ljusstakar i
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
    // stjärnorna, svaga i stadens ljus
    const st = (1 - sm(-9, -6, v.sol)) * (1 - sm(0.15, 0.55, L.m));
    if (st > 0.02) {
      const R = rng(41);
      for (let i = 0; i < 46; i++) {
        const x = 260 + R() * 700;
        const y = 132 + R() * 90;
        s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.5 + R() * 0.8)}" fill="#f2f4ff" opacity="${r1(st * (0.25 + R() * 0.5))}"/>`;
      }
    }
    // månen, när den är uppe (fasen ur vader.js)
    const mo = v.mane;
    const mv = sm(2, 8, mo.h) * (1 - sm(-3, 2, v.sol)) * (1 - sm(0.45, 0.85, L.m));
    if (mv > 0.03 && mo.fas > 0.04 && mo.fas < 0.96) {
      const cx = 900; const cy = 160; const r = 8.5;
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
        const left = R() < 0.6;
        const x = left ? 280 + R() * 160 : 790 + R() * 150;
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

  // Husen mittemot (x, bredd, takfoten): de lägre har tak och skorstenar
  // och himmel över sig. Det första syns i dörren, de andra i fönstret.
  const HUS = [
    { x: -60, w: 250, tak: 96, dag: '#b6a083', natt: '#0e1119' },
    { x: 190, w: 260, tak: 178, dag: '#d3a54f', natt: '#12141c', skorsten: [[232, 14, 24], [404, 12, 20]] },
    { x: 450, w: 330, tak: 100, dag: '#a2583f', natt: '#0d1017' },
    { x: 780, w: 240, tak: 214, dag: '#cdc2a6', natt: '#111520', skorsten: [[934, 12, 18]] },
  ];
  const WARM = ['#ffd58a', '#ffc56b', '#f6e7c1', '#ffcf7a', '#a9c4ff'];

  // allmänna flaggdagar (påsk, pingst, midsommar och valdagen räknas ut)
  function flaggdag(v) {
    const md = `${v.manad}-${v.dag}`;
    if (['1-1', '1-28', '3-12', '4-30', '5-1', '6-6', '7-14', '8-8', '10-24', '11-6', '12-10', '12-23', '12-25'].includes(md)) return true;
    const Y = v.ar;
    const a = Y % 19; const b = Math.floor(Y / 100); const c = Y % 100; const d = Math.floor(b / 4); const e = b % 4;
    const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const pask = Date.UTC(Y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
    const today = Date.UTC(Y, v.manad - 1, v.dag);
    if (today === pask || today === pask + 49 * 864e5) return true;
    if (v.manad === 6 && v.dag >= 20 && v.dag <= 26 && new Date(today).getUTCDay() === 6) return true;
    if (Y % 4 === 2 && v.manad === 9 && v.dag >= 8 && v.dag <= 14 && new Date(today).getUTCDay() === 0) return true;
    return false;
  }
  // hissad från klockan 8 (9 på vintern) till solnedgången, senast 21
  const flagga = (v) => flaggdag(v) && v.timme >= (v.manad >= 11 || v.manad <= 2 ? 9 : 8) && v.timme < 21 && v.sol > -1;

  function fonster(v, L, b, x, y, R) {
    const r = R(); const rc = R(); const ro = R(); const rd = R();
    const glas = mix(mix(b.natt, '#ffffff', 0.03), mix('#222932', L.sky[2], 0.32), L.dag);
    let s = `<rect x="${x}" y="${y}" width="14" height="17" fill="${glas}"/>`;
    if (r < L.tand) s += `<rect x="${x}" y="${y}" width="14" height="17" fill="${WARM[(rc * 5) | 0]}" opacity="${r1((0.28 + ro * 0.4) * (1 - 0.8 * L.dag))}"/>`;
    if (L.dag > 0.05) {
      const fr = mix('#fbf6ea', '#8d96a3', 0.3 * L.m);
      if (rd < 0.45) s += `<rect x="${x + 1}" y="${y + 1}" width="3" height="15" fill="#efe6d4" opacity="${r1(0.55 * L.dag)}"/><rect x="${x + 10}" y="${y + 1}" width="3" height="15" fill="#efe6d4" opacity="${r1(0.55 * L.dag)}"/>`;
      s += `<g stroke="${fr}" stroke-width="1.3" fill="none" opacity="${r1(0.85 * L.dag)}"><rect x="${x}" y="${y}" width="14" height="17"/><line x1="${x + 7}" y1="${y}" x2="${x + 7}" y2="${y + 17}"/><line x1="${x}" y1="${y + 6}" x2="${x + 14}" y2="${y + 6}"/></g>`;
    }
    // adventsstjärnor och ljusstakar, tända från eftermiddagen
    if (v.advent && rd > 0.66) {
      const on = 1 - 0.55 * L.dag;
      if (rc < 0.55) {
        const cx = x + 7; const cy = y + 6.5;
        let pts = '';
        for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5; const rr = j % 2 ? 1.7 : 4; pts += `${r1(cx + Math.cos(a) * rr)},${r1(cy + Math.sin(a) * rr)} `; }
        s += `<circle cx="${cx}" cy="${cy}" r="7" fill="#ffb24a" opacity="${r1(0.35 * on)}"/><polygon points="${pts}" fill="#ffc874" opacity="${r1(0.5 + 0.5 * on)}"/>`;
      } else {
        s += `<polygon points="${x + 1.5},${y + 16.5} ${x + 12.5},${y + 16.5} ${x + 7},${y + 11}" fill="#1c140c" opacity=".85"/>`;
        for (let j = 0; j < 7; j++) { const t = j / 6; s += `<circle cx="${r1(x + 2 + t * 10)}" cy="${r1(y + 16 - (1 - Math.abs(t - 0.5) * 2) * 5)}" r=".9" fill="#fff0b4" opacity="${r1(0.4 + 0.6 * on)}"/>`; }
        s += `<ellipse cx="${x + 7}" cy="${y + 14}" rx="7" ry="4" fill="#ffc874" opacity="${r1(0.25 * on)}"/>`;
      }
    }
    s += `<rect x="${x - 1.5}" y="${y + 17}" width="17" height="2.2" fill="${mix('#191c23', '#d9d3c5', L.dag * (1 - 0.3 * L.m))}"/>`;
    if (v.snotackt) s += `<rect x="${x - 1.5}" y="${y + 15.6}" width="17" height="1.8" rx=".9" fill="${snowC(L)}"/>`;
    return s;
  }

  function gata(v, L) {
    let s = '';
    const R = rng(17);
    const fern = mix(mix('#0b0e16', L.sky[2], 0.22 + 0.4 * L.dag), '#4a5262', 0.25 * L.dag);
    // stan bakom: tak och ett kyrktorn med ärgad spira, och en byggkran
    s += `<path d="M770 214 L770 202 L800 202 L806 196 L836 196 L836 204 L872 204 L872 214 Z M876 214 L876 198 L904 198 L910 192 L950 192 L950 214 Z" fill="${fern}"/>
      <path d="M180 178 L180 166 L214 166 L214 160 L262 160 L262 170 L320 170 L326 163 L376 163 L376 172 L452 172 L452 178 Z" fill="${fern}"/>
      <rect x="856" y="168" width="14" height="40" fill="${fern}"/><path d="M855 169 L863 128 L871 169 Z" fill="${mix(fern, '#6f9484', 0.35 * L.dag)}"/><circle cx="863" cy="127" r="1.6" fill="${mix(fern, '#d8b25a', 0.6 * L.dag)}"/>
      <g stroke="${mix(fern, '#c9a23a', 0.35 * L.dag)}" stroke-width="1.6" fill="none"><path d="M292 172 V122 M290 128 H350 M292 128 L304 122 M292 128 L278 124 H270"/><path d="M336 128 V140" stroke-width="1"/></g>`;
    if (L.lampor) s += '<circle cx="292" cy="121" r="1.8" fill="#ff3b30"/><circle cx="292" cy="121" r="5" fill="#ff3b30" opacity=".35"/>';
    if (v.snotackt) s += `<path d="M770 204 L800 204 L806 198 L836 198 M876 200 L904 200 L910 194 L950 194 M180 168 L214 168 M262 172 L320 172 L326 165 L376 165" stroke="${snowC(L)}" stroke-width="2.4" fill="none" opacity=".8"/>`;

    // husen
    const sunTop = 400 - Math.max(0, Math.min(300, 333 - 300 * Math.tan(Math.max(1, v.sol) * Math.PI / 180)));
    HUS.forEach((b, bi) => {
      const f = facade(b.dag, b.natt, L);
      const shade = mix(f, '#56658a', 0.14 * L.sol);
      const lit = mix(mix(f, '#fff0d2', 0.22 * L.sol), '#f0a46a', 0.25 * L.guld * L.sol);
      s += `<rect x="${b.x}" y="${b.tak}" width="${b.w}" height="${400 - b.tak}" fill="${shade}"/>`;
      if (L.sol > 0.03 && sunTop > b.tak) s += `<rect x="${b.x}" y="${b.tak}" width="${b.w}" height="${r1(sunTop - b.tak)}" fill="${lit}"/>`;
      // takfoten och taket
      if (b.tak > 120) {
        const roof = mix('#0a0c12', mix('#35373b', L.sky[2], 0.25), L.dag);
        s += `<polygon points="${b.x},${b.tak} ${b.x + b.w},${b.tak} ${b.x + b.w - 6},${b.tak - 16} ${b.x + 6},${b.tak - 16}" fill="${v.snotackt ? snowC(L) : roof}"/>`;
        for (const [cx, cw, ch] of b.skorsten || []) {
          s += `<rect x="${cx}" y="${b.tak - 16 - ch}" width="${cw}" height="${ch + 4}" fill="${mix(b.natt, '#8a5a44', L.dag * 0.9)}"/><rect x="${cx - 2}" y="${b.tak - 18 - ch}" width="${cw + 4}" height="3" fill="${v.snotackt ? snowC(L) : mix('#0a0c12', '#4a4a4c', L.dag)}"/>`;
        }
      }
      s += `<rect x="${b.x}" y="${b.tak}" width="${b.w}" height="7" fill="${mix(f, '#ffffff', 0.12 * L.dag)}"/><rect x="${b.x}" y="${b.tak + 7}" width="${b.w}" height="2" fill="#000" opacity=".25"/>`;
      if (v.snotackt) s += `<rect x="${b.x}" y="${b.tak - 1.5}" width="${b.w}" height="2.5" fill="${snowC(L)}"/>`;
      const RW = rng(17 + bi * 101);
      for (let wy = Math.max(116, b.tak + 20); wy < 280; wy += 30) {
        for (let wx = b.x + 14; wx < b.x + b.w - 18; wx += 30) s += fonster(v, L, b, wx, wy, RW);
      }
      // sockeln
      s += `<rect x="${b.x}" y="386" width="${b.w}" height="14" fill="${mix(mix(b.natt, '#000', 0.2), '#6d6a66', L.dag)}"/>`;
    });

    // bottenvåningarna: en port med lykta, ett konditori i det första huset och pizzerian
    const open = (a, z) => v.timme >= a && v.timme < z;
    const kond = open(7, 19) && v.veckodag !== 'sön';
    const port = mix('#0a0806', '#4a3020', L.dag);
    s += `<path d="M300 400 V350 Q317 334 334 350 V400 Z" fill="${port}"/><line x1="317" y1="344" x2="317" y2="400" stroke="#000" stroke-opacity=".35"/>
      <circle cx="317" cy="330" r="2.5" fill="${L.lampor ? '#ffe2b0' : mix('#1a1a1a', '#bdb6a6', L.dag)}"/>${L.lampor ? '<circle cx="317" cy="330" r="12" fill="url(#rum-sodium)" opacity=".5"/>' : ''}
      <rect x="40" y="318" width="120" height="66" fill="${kond ? '#ffd9a0' : mix('#0c0d10', mix('#2a3038', L.sky[2], 0.3), L.dag)}" opacity="${kond ? r1(0.32 - 0.12 * L.dag) : 1}"/>
      <rect x="40" y="318" width="120" height="66" fill="none" stroke="${mix('#0d0f14', '#e9e2cf', L.dag)}" stroke-width="2"/>
      <rect x="40" y="300" width="120" height="14" fill="${mix('#131012', '#6e2e2a', L.dag)}"/>`;
    let skylt = `<text x="100" y="311" text-anchor="middle" font-family="Fraunces" font-style="italic" font-size="11" fill="${mix('#6a5a44', '#f2e4c8', L.dag)}" opacity="${kond || L.dag > 0.3 ? 0.9 : 0.4}">Konditori</text>`;
    if (kond) s += '<g fill="#3a2414" opacity=".5"><rect x="56" y="360" width="24" height="3"/><rect x="104" y="356" width="34" height="3"/><circle cx="66" cy="352" r="5"/><circle cx="118" cy="348" r="5"/></g>';
    if (v.arstid !== 'vinter' && !v.snotackt && kond) {
      for (let i = 0; i < 5; i++) s += `<rect x="${44 + i * 22}" y="388" width="14" height="10" fill="${mix('#2a2a2a', '#7a7068', L.dag)}"/><circle cx="${51 + i * 22}" cy="386" r="6" fill="${['#e2483a', '#f2c23a', '#f3ead9', '#b24ad0', '#ff8a3a'][i]}" opacity="${r1(0.3 + 0.6 * L.dag)}"/>`;
    }
    const pizza = open(11, 23) || (['fre', 'lör'].includes(v.veckodag) && (v.timme >= 11 || v.timme < 1));
    const inne = pizza ? '#ffcf8a' : '#0c0a08';
    s += `<rect x="560" y="312" width="210" height="88" fill="${mix('#1a1410', '#3a2c22', L.dag)}"/><rect x="566" y="330" width="198" height="64" fill="${inne}" opacity="${pizza ? r1(0.32 - 0.1 * L.dag) : 1}"/>
      <rect x="566" y="330" width="198" height="64" fill="${mix('#3a2414', L.sky[2], 0.5 * L.dag)}" opacity="${r1(0.25 + 0.2 * L.dag)}"/>
      <g fill="#1a1410"><rect x="630" y="330" width="4" height="64"/><rect x="698" y="330" width="4" height="64"/>
        <rect x="584" y="372" width="30" height="4"/><rect x="588" y="376" width="3" height="18"/><rect x="608" y="376" width="3" height="18"/>
        <rect x="716" y="370" width="34" height="4"/><rect x="722" y="374" width="3" height="20"/><rect x="744" y="374" width="3" height="20"/></g>
      ${pizza ? '<rect x="650" y="350" width="34" height="8" rx="4" fill="#fff4d8" opacity=".5"/>' : ''}<rect x="580" y="292" width="170" height="26" fill="${mix('#0e1a12', '#1f3a2a', L.dag)}"/>
      <path d="M808 400 V352 H834 V400 Z" fill="${port}"/><rect x="852" y="332" width="70" height="52" fill="${mix('#0c0d10', mix('#2a3038', L.sky[2], 0.35), L.dag)}"/>`;
    skylt += `<text x="665" y="312" text-anchor="middle" font-family="Fraunces" font-style="italic" font-weight="700" font-size="21" fill="${pizza ? '#9bf5b5' : '#2c4a36'}">Pizzeria</text>
      ${pizza ? `<text x="665" y="312" text-anchor="middle" font-family="Fraunces" font-style="italic" font-weight="700" font-size="21" fill="#4fe08a" filter="url(#rum-ute-b4)" opacity="${r1(1 - 0.6 * L.dag)}">Pizzeria</text>` : ''}`;
    // Skyltarnas text i en egen liten SVG mellan husen och det som står
    // framför dem (lyktstolpen framför konditoriet): Chrome lägger ut text i
    // SVG på nytt i varje bildruta medan rummet vrids, och då ritades hela
    // gatan om varje gång.
    const husen = s;
    s = '';

    // flaggstången (flaggan vajar i livet på gatan)
    if (flagga(v)) s += `<line x1="712" y1="204" x2="744" y2="178" stroke="${mix('#222', '#e9e4d8', L.dag)}" stroke-width="1.8"/><circle cx="744" cy="178" r="1.6" fill="${mix('#3a3020', '#d8b25a', L.dag)}"/>`;

    // marken: trottoaren, kantstenen och gatan – torr, våt eller snöig
    const dry = [mix('#25262b', '#a19f99', L.dag), mix('#121318', '#5b5d61', L.dag)];
    const wet = [mix('#2a2b30', '#6c6e72', L.dag), mix('#121318', '#383b40', L.dag)];
    let [walk, road] = L.wet || v.blott ? wet : dry;
    if (v.snotackt) { walk = snowC(L); road = mix('#262b36', '#a3a9b0', L.dag); }
    s += `<rect x="-80" y="400" width="1100" height="11" fill="${walk}"/><rect x="-80" y="411" width="1100" height="3" fill="${mix(walk, '#000', 0.35)}"/><rect x="-80" y="414" width="1100" height="310" fill="${road}"/>`;
    if (v.snotackt) {
      s += `<g fill="${mix(road, '#000', 0.25)}"><rect x="-80" y="470" width="1100" height="9"/><rect x="-80" y="500" width="1100" height="9"/><rect x="-80" y="536" width="1100" height="11"/></g>`;
      const RS = rng(9);
      let p = 'M-80 418';
      for (let x = -80; x <= 1020; x += 20) p += ` Q${x + 10} ${r1(404 - RS() * 8)} ${x + 20} ${r1(416 + RS() * 3)}`;
      s += `<path d="${p} L1020 420 L-80 420 Z" fill="${mix(snowC(L), '#9aa2ad', 0.2)}"/>`;
    } else if (v.blott && L.dag > 0.2) {
      s += `<rect x="-80" y="416" width="1100" height="60" fill="${L.sky[2]}" opacity="${r1(0.18 * L.dag)}" filter="url(#rum-ute-b4)"/>`;
      const RP = rng(13);
      for (let i = 0; i < 7; i++) s += `<ellipse cx="${r1(RP() * 1000)}" cy="${r1(430 + RP() * 120)}" rx="${r1(20 + RP() * 40)}" ry="${r1(2 + RP() * 3)}" fill="${L.sky[1]}" opacity="${r1(0.25 * L.dag)}"/>`;
    }
    // höstlöven på trottoaren och i rännstenen
    const host = (v.manad === 9 && v.dag >= 20) || v.manad === 10 || (v.manad === 11 && v.dag <= 25);
    if (host && !v.snotackt) {
      const RL = rng(29);
      const cols = ['#c7682a', '#d99a2b', '#a8452a', '#8a5a2a', '#c9a23a'];
      for (let i = 0; i < 70; i++) {
        const x = r1(RL() * 1060 - 60);
        const y = r1(i < 40 ? 401 + RL() * 13 : 414 + RL() * 30);
        s += `<ellipse cx="${x}" cy="${y}" rx="${r1(1.4 + RL() * 1.4)}" ry="${r1(0.8 + RL() * 0.6)}" fill="${pick(RL, cols)}" opacity="${r1(0.3 + 0.6 * L.dag)}" transform="rotate(${r1(RL() * 180)} ${x} ${y})"/>`;
      }
    }

    // gatlyktorna
    for (const [sx, k] of [[330, 1], [520, 0.8], [880, 1], [120, 0.9]]) {
      s += `<rect x="${sx - 2}" y="250" width="4" height="165" fill="${mix('#1a1c22', '#3e4248', L.dag)}"/><path d="M${sx - 7} 252 Q${sx} 242 ${sx + 7} 252 Z" fill="${mix('#14161a', '#2e3236', L.dag)}"/>`;
      if (v.snotackt) s += `<path d="M${sx - 7} 248 Q${sx} 240 ${sx + 7} 248 Z" fill="${snowC(L)}"/>`;
      if (L.lampor) {
        const big = 1 + 0.8 * L.dimma;
        s += `<circle cx="${sx}" cy="252" r="${r1(60 * k * big)}" fill="url(#rum-sodium)" opacity="${r1(0.7 * (1 - L.dag))}"/><circle cx="${sx}" cy="252" r="4" fill="#ffe2b0"/>`;
        if (L.wet || v.blott) s += `<rect x="${sx - 7}" y="418" width="14" height="140" fill="url(#rum-streak)" filter="url(#rum-ute-b4)" opacity="${r1(1 - L.dag)}"/>`;
        else if (v.snotackt) s += `<ellipse cx="${sx}" cy="418" rx="70" ry="16" fill="#ffc27a" opacity="${r1(0.16 * (1 - L.dag))}" filter="url(#rum-ute-b4)"/>`;
      } else s += `<circle cx="${sx}" cy="252" r="3" fill="${mix('#2a2a2a', '#c8ccd0', L.dag)}"/>`;
    }

    // bilen som står parkerad vid trottoaren
    const car = mix('#08090c', '#3b4a5f', L.dag * (1 - 0.25 * L.m));
    s += `<path d="M682 474 V462 Q683 455 692 453 L702 443 Q706 439 714 439 L734 439 Q741 439 745 445 L750 452 Q756 454 756 462 V474 Z" fill="${car}"/>
      <path d="M704 451 L710 444 L726 444 L726 451 Z M729 451 L729 444 L739 444 L744 451 Z" fill="${mix('#020203', mix('#1e252e', L.sky[2], 0.4), L.dag)}"/>
      <circle cx="696" cy="474" r="6.5" fill="#050506"/><circle cx="742" cy="474" r="6.5" fill="#050506"/><circle cx="696" cy="474" r="2.6" fill="${mix('#151515', '#8a8e92', L.dag)}"/><circle cx="742" cy="474" r="2.6" fill="${mix('#151515', '#8a8e92', L.dag)}"/>`;
    if (v.snotackt) s += `<path d="M703 441 Q706 437 714 437 L734 437 Q741 437 745 443 Z" fill="${snowC(L)}"/><rect x="684" y="451" width="16" height="3" rx="1.5" fill="${snowC(L)}"/>`;
    if (L.lampor) {
      s += '<circle cx="754" cy="458" r="3" fill="#ff4a3a"/><circle cx="754" cy="458" r="12" fill="#ff3b30" opacity=".4" filter="url(#rum-ute-b4)"/>';
      if (L.wet || v.blott) s += '<rect x="749" y="476" width="9" height="80" fill="url(#rum-streakred)" filter="url(#rum-ute-b4)"/>';
    }
    s += `<rect x="560" y="420" width="210" height="90" fill="#ffcf8a" opacity="${pizza ? r1(0.07 * (1 - L.dag)) : 0}" filter="url(#rum-ute-b10)"/>`;

    // dimman lägger sig över allt
    if (L.dimma > 0.05) s += `<rect x="-80" y="90" width="1100" height="640" fill="${mix('#2a2622', '#aeb3b6', L.dag)}" opacity="${r1(0.5 * L.dimma)}"/>`;
    const ruta = (inner, [x, y, w, h] = [0, 0, 1600, 1000]) => `<svg class="rum-layer" viewBox="${x} ${y} ${w} ${h}" style="left:${x}px; top:${y}px; width:${w}px; height:${h}px">${inner}</svg>`;
    return ruta(`<defs><filter id="rum-ute-b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter><filter id="rum-ute-b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter></defs>${husen}`) +
      ruta(skylt, [30, 280, 740, 50]) + ruta(s);
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

  function wheel(cx, cy, r, L) {
    return `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="none" stroke="${tone('#1a1a1a', L)}" stroke-width="1.3"/><g class="hjul"><line x1="${-r}" y1="0" x2="${r}" y2="0" stroke="${tone('#777', L)}" stroke-width=".5"/><line x1="0" y1="${-r}" x2="0" y2="${r}" stroke="${tone('#777', L)}" stroke-width=".5"/></g></g>`;
  }

  // Ett fordon (vänt åt höger, hjulen i 0): bil, taxi, buss eller plogbil.
  function vehicle(kind, c, L) {
    const t = (x) => tone(x, L);
    const lamps = L.lampor || L.dimma > 0.4;
    let s = '';
    if (kind === 'buss') {
      s += `<rect x="-86" y="-50" width="172" height="44" rx="5" fill="${t('#2f6db5')}"/><rect x="-86" y="-14" width="172" height="8" fill="${t('#244f86')}"/>`;
      for (let i = 0; i < 7; i++) s += `<rect x="${-80 + i * 22}" y="-44" width="18" height="18" rx="2" fill="${lamps ? '#f4e8c4' : mix(t('#1b2530'), L.sky[2], 0.3 * L.dag)}" opacity="${lamps ? 0.75 : 1}"/>`;
      s += `<rect x="70" y="-48" width="14" height="6" fill="#140d02"/><text x="77" y="-43.2" text-anchor="middle" font-family="VT323, monospace" font-size="7" fill="#ffb02a">4</text>`;
      s += `<circle cx="-56" cy="-4" r="7" fill="#050506"/><circle cx="58" cy="-4" r="7" fill="#050506"/>`;
    } else if (kind === 'plog') {
      s += `<rect x="-40" y="-34" width="50" height="26" rx="3" fill="${t('#e07a1a')}"/><rect x="10" y="-40" width="26" height="32" rx="3" fill="${t('#e88a22')}"/><rect x="16" y="-36" width="16" height="11" rx="1.5" fill="${lamps ? '#e8dcc0' : t('#1a222a')}" opacity=".85"/>
        <path d="M38 -2 L54 -24 L58 -24 L48 -2 Z" fill="${t('#d8d4c8')}"/><circle cx="-24" cy="-4" r="6.5" fill="#050506"/><circle cx="24" cy="-4" r="6.5" fill="#050506"/>
        <g class="blink"><circle cx="22" cy="-42" r="2.4" fill="#ffc21a"/><circle cx="22" cy="-42" r="12" fill="#ffb21a" opacity=".45"/></g>`;
    } else {
      s += `<path d="M-36 -4 V-16 Q-35 -22 -26 -23 L-15 -31 Q-11 -34 -3 -34 L14 -34 Q21 -34 25 -29 L31 -23 Q37 -21 37 -15 V-4 Z" fill="${t(c)}"/>
        <path d="M-12 -24 L-6 -30 L6 -30 L6 -24 Z M9 -24 L9 -30 L18 -30 L24 -24 Z" fill="${lamps ? '#2a2218' : mix(t('#151b22'), L.sky[2], 0.35 * L.dag)}"/>
        <circle cx="-22" cy="-4" r="6.2" fill="#050506"/><circle cx="24" cy="-4" r="6.2" fill="#050506"/>`;
      if (kind === 'taxi') s += `<rect x="-4" y="-38" width="12" height="4" rx="1" fill="${lamps ? '#ffe88a' : t('#e8d050')}"/>`;
    }
    const front = kind === 'buss' ? 86 : kind === 'plog' ? 36 : 37;
    const back = kind === 'buss' ? -86 : -40;
    if (lamps) {
      s += `<path d="M${front} -14 L${front + 70} -24 L${front + 70} 6 Z" fill="#fff6dc" opacity=".16"/><circle cx="${front - 1}" cy="-13" r="2.4" fill="#fffbe8"/><circle cx="${front - 1}" cy="-13" r="9" fill="#fff2cc" opacity=".45"/>`;
      s += `<circle cx="${back + 1}" cy="-14" r="2" fill="#ff4a3a"/><circle cx="${back + 1}" cy="-14" r="8" fill="#ff3b30" opacity=".35"/>`;
    } else s += `<rect x="${front - 4}" y="-15" width="4" height="2" fill="#f4f4ee" opacity=".8"/>`;
    return s;
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
    // w/ht halva bredden och höjden före skalan k
    const walk = (inner, o) => {
      const k = o.k || 1;
      const hw = Math.ceil((o.w || 30) * k);
      const ht = Math.ceil((o.ht || 56) * k);
      const dist = 1000 + 2 * (hw + 40);
      const fran = o.dir > 0 ? -(hw + 40) : 1000 + hw + 40;
      const till = fran + o.dir * (dist + o.pause * o.speed);
      const cyc = dist / o.speed + o.pause;
      s += `<svg class="rum-gar${o.cls ? ` ${o.cls}` : ''}" style="left:${-hw}px; top:${r1(o.y - ht)}px; --fran:${fran}px; --till:${r1(till)}px; --steg:${o.steg || 0.9}s; animation-duration:${r1(cyc)}s; animation-delay:-${r1(R() * cyc)}s" viewBox="${-hw} ${-ht} ${2 * hw} ${ht + 6}" width="${2 * hw}" height="${ht + 6}"><g transform="scale(${o.dir * k} ${k})"><g class="gung">${inner}</g></g></svg>`;
    };

    // de som går på trottoaren mittemot
    let n = h < 1 ? 3 : h < 5 ? 1 : h < 7 ? 3 : h < 22 ? 7 : 4;
    if (v.fall && v.mangd > 0.75) n = Math.max(1, n - 3);
    if (v.kanns < -12) n = Math.max(1, n - 2);
    const cs = coats(v);
    const skins = ['#e9c2a2', '#d8a27c', '#b27a52', '#8a5636', '#f0cfb4'];
    const hairs = ['#2a1d14', '#5a3e24', '#c9a56a', '#1a1a1a', '#8a6a4a', '#d8d0c0'];
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
      let inner = person(o, L);
      let speed = 24 + R() * 10;
      let kind = 'gar';
      const roll = R();
      if (roll < 0.18 && h > 6 && h < 23) { kind = 'hund'; o.leash = true; inner = person(o, L) + `<g transform="translate(16 0)">${dog(L, pick(R, ['#3a2a1a', '#d8c09a', '#1a1a1a', '#8a6a4a']))}</g>`; speed = 22; }
      else if (roll < 0.3 && v.snotackt && L.dag > 0.3) {
        kind = 'pulka';
        inner = person(o, L) + `<path d="M-2 -12 L-24 -4" stroke="${tone('#222', L)}" stroke-width=".7"/><g transform="translate(-30 0)"><path d="M-8 -2 H8 Q11 -2 11 -5" fill="none" stroke="${tone('#c8322a', L)}" stroke-width="2"/><ellipse cx="0" cy="-6" rx="4" ry="4.5" fill="${tone('#2a6ab0', L)}"/><circle cx=".5" cy="-12" r="2.6" fill="${tone(o.skin, L)}"/><path d="M-2 -13 Q.5 -17 3 -13 Z" fill="${tone('#e8b923', L)}"/></g>`;
        speed = 20;
      } else if (roll < 0.36 && v.manad === 12 && v.dag >= 5 && v.dag <= 23 && h > 9 && h < 20) { kind = 'gran'; o.tree = true; o.umb = null; inner = person(o, L); speed = 22; }
      if (varmt && kind === 'gar' && o.umb == null && R() < 0.25) { o.hat = pick(R, ['#2a4a7a', '#e8e4dc', '#c8322a']); inner = person(o, L); }
      walk(inner, { y: 405 + R() * 6, dir: R() < 0.5 ? 1 : -1, speed, pause: 15 + R() * 70, steg: r1(0.75 + R() * 0.25), cls: kind, w: kind === "pulka" ? 42 : 30 });
    }

    // på cykel (inte i snön eller i ösregn)
    if (!v.snotackt && !(v.fall && v.mangd > 0.6) && h > 6 && h < 23.5) {
      const nc = v.arstid === 'vinter' ? 1 : v.arstid === 'sommar' ? 3 : 2;
      for (let i = 0; i < nc; i++) {
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

    // trafiken: närmaste filen åt höger, den bortre åt vänster
    const day = h > 6 && h < 24;
    const carsN = day ? (h > 7 && h < 20 ? 3 : 2) : 1;
    for (let i = 0; i < carsN; i++) {
      const near = i % 2 === 0;
      const kind = R() < 0.18 ? 'taxi' : 'bil';
      const c = pick(R, ['#1a1c22', '#c8ccd0', '#8a1e1e', '#2a3a5a', '#e8e4dc', '#4a4e54', '#1e3a2e']);
      walk(vehicle(kind, kind === 'taxi' ? '#202226' : c, L), { y: near ? 532 : 500, dir: near ? 1 : -1, speed: 150 + R() * 90, pause: 14 + R() * 40, k: near ? 1.45 : 1.25, cls: 'fordon', w: 110, ht: 40 });
    }
    if (h > 5.5 && h < 24.5) walk(vehicle('buss', null, L), { y: 500, dir: -1, speed: 105, pause: 230, k: 1.2, cls: 'fordon', w: 160, ht: 54 });
    if (v.snotackt || (sno && v.mangd > 0.3)) walk(vehicle('plog', null, L), { y: 532, dir: 1, speed: 58, pause: 260, k: 1.4, cls: 'fordon', w: 130, ht: 56 });

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
    return `<div class="rum-regn" style="left:36px; top:120px; width:${W}px; height:${H}px">${s}</div>`;
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
    return `<svg class="rum-layer" viewBox="0 0 1600 1000" aria-hidden="true">${defs}${s}</svg>${html}`;
  }

  // ---------- att rita ----------

  const bucket = (x, n) => Math.round(x * n) / n;
  function sigs(v, L) {
    const host = (v.manad === 9 && v.dag >= 20) || v.manad === 10 || (v.manad === 11 && v.dag <= 25);
    const base = [v.slag, bucket(v.mangd, 5), v.snotackt, v.blott, host, v.advent].join();
    return {
      himmel: [base, bucket(L.dag, 20), bucket(v.sol, 1), v.mane.h > 2, bucket(v.mane.fas, 30), bucket(L.m, 10)].join(),
      himliv: [base, bucket(L.dag, 5), bucket(L.guld, 4), v.arstid, v.timme >> 2, v.nyar, v.manad === 12 && v.dag === 31 && v.timme >= 18, v.timme >= 18 && v.timme < 23, bucket(L.m, 5)].join(),
      gata: [base, bucket(L.dag, 20), bucket(L.sol, 10), bucket(L.guld, 10), bucket(L.tand, 50), L.lampor, v.timme, v.veckodag, bucket(L.m, 10)].join(),
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
    const sig = sigs(v, L);
    sig.blixt = String(v.slag === 'aska');
    const draw = { himmel: () => himmel(v, L), himliv: () => himmelsliv(v, L), gata: () => gata(v, L), liv: () => gatliv(v, L), fall: () => fall(v), glas: () => glas(v, rects), blixt: () => (v.slag === 'aska' ? '<i></i><i class="b2"></i>' : '') };
    let changed = false;
    for (const [k] of LAGER) {
      if (el._sig[k] === sig[k]) continue;
      el._sig[k] = sig[k];
      el.querySelector(`[data-lager="${k}"]`).innerHTML = draw[k]();
      changed = true;
    }
    return changed;
  }

  return { paint, light };
})();
