'use strict';

// Videon i tobaksaffären (rum.js): en liten färg-tv med inbyggd video som
// står på disken, nere i hörnet till höger. På tv:n ligger de senaste
// repriserna på VHS i en hög, och i en fruktlåda på sidan till höger resten
// (Arkivet) – lådan står precis utanför bilden och syns först när man går
// fram till tv:n (klick eller V). Kassetterna har handskrivna etiketter med
// matchen, resultatet och dagen; ett klick på en kassett och den åker in i
// videon, som spelar matchens höjdpunkter från YouTube i rutan (samma klipp
// som spelaren på sajten, hojdpunkter.js). Knapparna under rutan: ◀◀ och ▶▶
// byter kassett, ▶ spelar eller pausar och ⏏ matar ut. Går man därifrån
// pausar videon, och den spelar vidare när man kommer tillbaka. När inget
// spelar blinkar klockan på 12:00, som den alltid gjort.
//
// Kassetterna: matcher med YouTube-klipp (m.y i matches.json), omgångens
// först, sedan de senaste – dag för dag, Premier League före Championship
// osv. Högst 25: fyra på tv:n och 21 i lådan. Dolda resultat (Spoiler) står
// inte på etiketten, och klippets rubrik täcks som i spelaren på sajten.
//
// Allt ritas i sex gånger storleken och förminskas (som tv:n i rum-tv.js),
// så att det är skarpt på nära håll – och YouTubes spelare får sin vanliga
// storlek. Väggen, disken och pulten fortsätter till höger om bilden (vagg
// och pult), så att lådan står på något när kameran går dit.
//
// RumVideo.html('horn' | 'vagg' | 'pult') → delarna (planen -598, -600 och -60 i rum.js)
// RumVideo.mount(el, { calm, short, kort }) → { fill(matches, ids), zoom(on) → hörnet i scenen, key(k), stop() }

window.RumVideo = (() => {
  // sex gånger storleken; hörnets övre vänstra hörn i scenen och dess mått
  const S = 6;
  const O = [1446, 494];
  const VP = [760 - O[0], 400 - O[1]];
  const TZ = 'Europe/Stockholm';
  const r2 = (x) => Math.round(x * 100) / 100;
  const pts = (list) => list.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');

  // Måtten i hörnets enheter (scenens pixlar från O): tv:ns front, rutan,
  // kassettfacket, displayen och knapparna, lådans front och kassetterna.
  const TV = { x: 31, y: 41, w: 82, h: 75 };
  const GLAS = { x: 38.5, y: 47, w: 67, h: 50.25 };
  const FACK = { x: 36, y: 103.2, w: 43, h: 6.6 };
  const VFD = { x: 82, y: 102.6, w: 27, h: 5.2 };
  const KNAPP = { x: 82, y: 109, w: 6.1, h: 3.6, d: 6.97 };
  // lådan står bredvid tv:n när man är framme, annars utskjuten till höger
  // om bilden (UT), så långt att den inte syns ens när rummet vrids efter musen
  const LADA = { x: 135, y: 43, w: 95, h: 77, t: 4.5 };
  const UT = 88;
  const KAS = { w: 41, h: 5.67 };
  // högarna: tv:ns och lådans två, nerifrån och upp (den nyaste överst)
  const COLS = [
    { x: 39, y: 40.4, ix: [3, 2, 1, 0], j: 1.6, r: 0.9 },
    { x: LADA.x + 6.4, y: LADA.y + LADA.h - 5.4, ix: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4], j: 0.6, r: 0.45 },
    { x: LADA.x + 48.6, y: LADA.y + LADA.h - 5.4, ix: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15], j: 0.6, r: 0.45 },
  ];
  const CAP = 25;
  // det kameran ska få med: högen, tv:n och lådan, i scenens mått
  const FOCUS = { x0: O[0] + 12, y0: O[1] + 12, x1: O[0] + 238, y1: O[1] + 130 };

  const hash = (s) => {
    let a = 7;
    for (const c of String(s)) a = (Math.imul(a, 31) + c.charCodeAt(0)) | 0;
    const x = Math.sin(a) * 43758.5453;
    return x - Math.floor(x);
  };

  // En punkt längre in mot flyktpunkten (f < 1), och sidan och taket på en
  // låda med fronten r som går dx in.
  const toward = (f) => ([x, y]) => [VP[0] + (x - VP[0]) * f, VP[1] + (y - VP[1]) * f];
  function faces(r, dx) {
    const b = toward(1 - dx / (r.x - VP[0]));
    const [x0, y0, x1, y1] = [r.x, r.y, r.x + r.w, r.y + r.h];
    return {
      side: [[x0, y0], b([x0, y0]), b([x0, y1]), [x0, y1]],
      top: [[x0, y0], [x1, y0], b([x1, y0]), b([x0, y0])],
      b,
    };
  }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // ---------- tv:n ----------

  function tvSvg() {
    const { side, top, b } = faces(TV, 11);
    const { x, y, w, h } = TV;
    // springorna på sidan, i sidans perspektiv
    let vents = '';
    for (let k = 0; k < 8; k++) {
      const p = [x, y + h * (0.1 + k * 0.045)];
      const q = b(p);
      const [a, c] = [lerp(p, q, 0.18), lerp(p, q, 0.82)];
      vents += `<line x1="${r2(a[0])}" y1="${r2(a[1])}" x2="${r2(c[0])}" y2="${r2(c[1])}"/>`;
    }
    const g = GLAS;
    const f = FACK;
    return `<g class="massiv">
    <polygon points="${pts(side)}" fill="url(#vhs-sida)"/>
    <g stroke="#000" stroke-opacity=".7" stroke-width=".55" stroke-linecap="round">${vents}</g>
    <polygon points="${pts(top)}" fill="#46423c"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="url(#vhs-kropp)"/>
    <rect x="${x + 1}" y="${y + 0.3}" width="${w - 2}" height=".5" rx=".25" fill="#fff" opacity=".16"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="url(#vhs-dager)"/>
    <rect x="${g.x - 3}" y="${g.y - 3}" width="${g.w + 6}" height="${g.h + 6}" rx="3.4" fill="#0b0a0a" stroke="#34312d" stroke-width=".45"/>
    <rect x="${g.x - 0.8}" y="${g.y - 0.8}" width="${g.w + 1.6}" height="${g.h + 1.6}" rx="5.6" fill="#040404"/>
    <text x="${g.x + g.w / 2}" y="${g.y + g.h + 2.35}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="1.55" letter-spacing=".5" fill="#a9a399">TV · VIDEO</text>
    <line x1="${x + 2}" y1="${f.y - 1.5}" x2="${x + w - 2}" y2="${f.y - 1.5}" stroke="#8a857b" stroke-width=".3" opacity=".55"/>
    <rect x="${f.x - 0.6}" y="${f.y - 0.6}" width="${f.w + 1.2}" height="${f.h + 1.2}" rx="1" fill="#4c4944"/>
    <rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx=".7" fill="#030303"/>
    <rect class="vhs-lucka" x="${f.x + 0.5}" y="${f.y + 0.45}" width="${f.w - 1}" height="${f.h - 0.9}" rx=".4" fill="url(#vhs-lucka)"/>
    <text x="${f.x + f.w / 2}" y="${f.y + f.h + 2.4}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="1.3" letter-spacing=".4" fill="#8f8a80">HQ · STEREO</text>
    <rect x="${VFD.x}" y="${VFD.y}" width="${VFD.w}" height="${VFD.h}" rx=".6" fill="#06100d" stroke="#2c2a27" stroke-width=".3"/>
    <circle class="vhs-led" cx="${x + 2.6}" cy="${f.y + f.h / 2}" r=".62"/>
    <rect x="${x + 5}" y="${y + h}" width="9" height="1.4" rx=".4" fill="#070606"/>
    <rect x="${x + w - 14}" y="${y + h}" width="9" height="1.4" rx=".4" fill="#070606"/>
  </g>`;
  }

  // ---------- lådan ----------

  // En fruktlåda i furu på sidan, med öppningen mot rummet: brädorna runt
  // öppningen, sidan med springor mellan brädorna och tejpbiten med namnet.
  function ladaSvg() {
    const L = LADA;
    const { side, top, b } = faces(L, 12.5);
    // sidans tre brädor, i sidans perspektiv
    const band = (t0, t1) => pts([lerp(side[0], side[3], t0), lerp(side[1], side[2], t0), lerp(side[1], side[2], t1), lerp(side[0], side[3], t1)]);
    const sida = [[0, 0.31], [0.345, 0.655], [0.69, 1]].map(([t0, t1]) => `<polygon points="${band(t0, t1)}" fill="url(#vhs-furu)"/><polygon points="${band(t0, t1)}" fill="#1b1006" opacity=".42"/>`).join('');
    const x0 = L.x + L.t;
    const y0 = L.y + L.t;
    const x1 = L.x + L.w - L.t;
    const y1 = L.y + L.h - L.t;
    // insidan: botten (lådans baksida) med springor, och högra innerväggen i ljuset
    const inner = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="url(#vhs-inne)"/>
    <polygon points="${pts([[x1, y0], [x1, y1], b([x1, y1]), b([x1, y0])])}" fill="#5a3f22" opacity=".55"/>
    <g fill="#0d0703" opacity=".8"><rect x="${x0}" y="${y0 + 21}" width="${x1 - x0}" height="1.3"/><rect x="${x0}" y="${y0 + 44}" width="${x1 - x0}" height="1.3"/></g>`;
    const board = (x, y, w, h, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vhs-furu)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#${cls})" opacity=".55"/>`;
    const nails = [[L.x + 2.2, L.y + 2.2], [L.x + L.w - 2.2, L.y + 2.2], [L.x + 2.2, L.y + L.h - 2.2], [L.x + L.w - 2.2, L.y + L.h - 2.2]]
      .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r=".42" fill="#2a2420"/><circle cx="${cx - 0.12}" cy="${cy - 0.12}" r=".16" fill="#8d877c"/>`).join('');
    return `<g class="massiv">
    ${sida}
    <polygon points="${pts(top)}" fill="#d8b47e"/>
    ${inner}
  </g>
  <g class="massiv vhs-ram">
    ${board(L.x, L.y, L.t, L.h, 'vhs-ved-s')}${board(L.x + L.w - L.t, L.y, L.t, L.h, 'vhs-ved-s')}
    ${board(L.x, L.y, L.w, L.t, 'vhs-ved')}${board(L.x, L.y + L.h - L.t, L.w, L.t, 'vhs-ved')}
    <rect x="${L.x}" y="${L.y}" width="${L.w}" height=".45" fill="#fff3d8" opacity=".35"/>
    <g fill="#3a2410" opacity=".45"><rect x="${L.x + L.t}" y="${L.y + L.t - 0.5}" width="${L.w - 2 * L.t}" height=".5"/><rect x="${L.x + L.t - 0.5}" y="${L.y + L.t}" width=".5" height="${L.h - 2 * L.t}"/></g>
    ${nails}
    <text x="${L.x + L.w / 2}" y="${L.y + L.h - 1.2}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="2.6" letter-spacing="1.2" fill="#9b2c1f" opacity=".5">ÄPPLEN · KLASS I</text>
    <g transform="rotate(-1.6 ${L.x + 47} ${L.y + 2.3})">
      <polygon points="${pts([[L.x + 25.2, L.y + 0.45], [L.x + 69, L.y + 0.2], [L.x + 69.6, L.y + 1.4], [L.x + 68.9, L.y + 2.6], [L.x + 69.5, L.y + 4.2], [L.x + 25.4, L.y + 4.5], [L.x + 24.8, L.y + 3.1], [L.x + 25.5, L.y + 1.9]])}" fill="#e7dab2" opacity=".96"/>
      <text x="${L.x + 47}" y="${L.y + 3.55}" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="3.9" letter-spacing=".5" fill="#1d1a16">ARKIVET</text>
    </g>
  </g>`;
  }

  const ritning = (inner) => `<svg class="vhs-ritning" viewBox="0 0 240 130" width="${240 * S}" height="${130 * S}" aria-hidden="true">${inner}</svg>`;
  function tvRitning() {
    return ritning(`<defs>
    <linearGradient id="vhs-kropp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#36332f"/><stop offset=".07" stop-color="#262421"/><stop offset=".85" stop-color="#191816"/><stop offset="1" stop-color="#0f0e0d"/></linearGradient>
    <linearGradient id="vhs-dager" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="vhs-sida" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b0a09"/><stop offset="1" stop-color="#1d1b18"/></linearGradient>
    <linearGradient id="vhs-lucka" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3935"/><stop offset=".18" stop-color="#1b1a18"/><stop offset="1" stop-color="#0c0c0b"/></linearGradient>
    <linearGradient id="vhs-furu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6b07a"/><stop offset=".5" stop-color="#c29a62"/><stop offset="1" stop-color="#9c7744"/></linearGradient>
    <linearGradient id="vhs-inne" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#120a04"/><stop offset=".7" stop-color="#2a1a0c"/><stop offset="1" stop-color="#3d2814"/></linearGradient>
    <radialGradient id="vhs-pol" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8fb0ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fb0ff" stop-opacity="0"/></radialGradient>
    <filter id="vhs-ved" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".03 .9" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .28  0 0 0 0 .15  0 0 0 0 .05  2.4 0 0 0 -1"/></filter>
    <filter id="vhs-ved-s" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .03" numOctaves="3" seed="6"/><feColorMatrix values="0 0 0 0 .28  0 0 0 0 .15  0 0 0 0 .05  2.4 0 0 0 -1"/></filter>
  </defs>
  <ellipse class="vhs-pol" cx="${TV.x + TV.w / 2}" cy="${TV.y + TV.h + 3}" rx="54" ry="7" fill="url(#vhs-pol)"/>
  <ellipse cx="${TV.x + TV.w / 2 - 4}" cy="${TV.y + TV.h + 0.6}" rx="${TV.w / 2 + 6}" ry="2.2" fill="#000" opacity=".6" filter="url(#rum-b1)"/>
  ${tvSvg()}`);
  }
  function ladaRitning() {
    return ritning(`<ellipse cx="${LADA.x + LADA.w / 2 - 5}" cy="${LADA.y + LADA.h + 0.4}" rx="${LADA.w / 2 + 6}" ry="2" fill="#000" opacity=".6" filter="url(#rum-b1)"/>
  ${ladaSvg()}`);
  }

  // ---------- väggen, disken och pulten till höger om bilden ----------

  // Högra väggen och disken som de är ritade i rum.js (bg), förlängda åt
  // höger: samma toner, fläckar och linjer. Ligger direkt efter bg() i
  // planet -600, under det som hänger på väggen.
  const wl = (x) => 490 + (x - 1140) * 109 / 460;
  const re = (x) => 490 + (x - 1060) * 162 / 540;
  function vaggSvg() {
    const [a, z] = [1599.5, 2100];
    const r = `x="${a}" y="300" width="${z - a}" height="720"`;
    return `<svg class="vhs-vagg" viewBox="${a} 300 ${z - a} 720" aria-hidden="true">
    <rect ${r} fill="url(#rum-rwall)"/><rect ${r} filter="url(#rum-flack)" opacity=".55"/><rect ${r} fill="#000" opacity=".2"/>
    <polygon points="${a},${wl(a)} ${z},${wl(z)} ${z},${re(z)} ${a},${re(a)}" fill="#5b564c"/>
    <polygon points="${a},${re(a)} ${z},${re(z)} ${z},1020 ${a},1020" fill="#2a2019"/>
    <line x1="${a}" y1="${re(a)}" x2="${z}" y2="${re(z)}" stroke="#c9c2b2" stroke-opacity=".35" stroke-width="2"/>
    <polygon points="${a},${re(a) + 2} ${z},${re(z) + 2} ${z},${re(z) + 48} ${a},${re(a) + 48}" fill="#000" opacity=".12"/>
  </svg>`;
  }
  // Pulten (table i rum.js) förlängd åt höger, i planet -60.
  function pultSvg() {
    const [a, z] = [1599.5, 2140];
    const r = `x="${a}" y="650" width="${z - a}" height="360"`;
    return `<svg class="vhs-pult" viewBox="${a} 640 ${z - a} 380" aria-hidden="true">
    <rect ${r} fill="url(#rum-pult)"/><rect ${r} filter="url(#rum-grainwood)"/><rect ${r} filter="url(#rum-flack)" opacity=".35"/>
    <rect x="${a}" y="647" width="${z - a}" height="6" fill="url(#rum-alu)"/><rect x="${a}" y="984" width="${z - a}" height="20" fill="url(#rum-alu)"/>
  </svg>`;
  }

  // ---------- html ----------

  const px = (v) => `${r2(v * S)}px`;
  const at = (r) => `left:${px(r.x)}; top:${px(r.y)}; width:${px(r.w)}; height:${px(r.h)}`;

  function html(part) {
    if (part === 'vagg') return vaggSvg();
    if (part === 'pult') return pultSvg();
    const knappar = [['bak', '◀◀', 'Nyare kassett'], ['spela', '▶', 'Spela'], ['fram', '▶▶', 'Äldre kassett'], ['ut', '⏏', 'Mata ut']]
      .map(([k, t, l], i) => `<button type="button" class="vhs-k" data-vhs="${k}" aria-label="${l}" style="${at({ x: KNAPP.x + i * KNAPP.d, y: KNAPP.y, w: KNAPP.w, h: KNAPP.h })}">${t}</button>`).join('');
    const kas = (a, b) => Array.from({ length: b - a }, (_, i) => `<button type="button" class="vhs-kas" data-i="${a + i}" hidden><span class="lapp"><b></b><i></i></span></button>`).join('');
    // den 16:9-stora bilden i den 4:3-stora rutan
    const bh = GLAS.w * 9 / 16;
    return `<div class="rum-vhs" id="rum-vhs" data-lage="tom" style="left:${O[0]}px; top:${O[1]}px"><div class="vhs-in">` +
      `<i class="vhs-sken"></i>${tvRitning()}` +
      '<div class="vhs-styr" inert>' +
      `<div class="vhs-skarm" style="${at(GLAS)}"><div class="vhs-bla"></div><i class="vhs-brus"></i>` +
      `<div class="vhs-bild" style="top:${px((GLAS.h - bh) / 2)}; height:${px(bh)}"></div>` +
      `<i class="vhs-mask" style="top:${px((GLAS.h - bh) / 2)}" hidden></i>` +
      '<span class="vhs-osd">STOPP</span><i class="vhs-glas"></i></div>' +
      `<span class="vhs-vfd" style="${at(VFD)}">12:00</span>${knappar}${kas(0, 4)}</div>` +
      // lådan glider in längs disken när man går fram (rum-video.css)
      `<div class="vhs-lada" style="--ut:${px(UT)}">${ladaRitning()}<div class="vhs-styr" inert>${kas(4, CAP)}</div></div>` +
      `<a class="vhs-hit rum-sak" href="#matcher" data-nav="video" aria-label="Videon" style="${at({ x: 18, y: 14, w: 97, h: 104 })}"></a>` +
      '</div></div>';
  }

  // ---------- kassetterna ----------

  const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'numeric' });
  const fKey = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const dag = (iso) => {
    const p = Object.fromEntries(fDag.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return `${p.day}/${p.month}`;
  };
  const RANK = { pl: 0, ch: 1, l1: 2, l2: 3, fac: 4, lc: 5 };
  const hidden = (m) => Boolean(window.Spoiler && Spoiler.hidden(m));

  // Omgångens matcher först, sedan de senaste dag för dag, de högre
  // divisionerna först samma dag.
  function pick(matches, ids) {
    const own = new Set((ids || []).map(String));
    return (matches || []).filter((m) => m.completed && m.y && m.y.length)
      .map((m) => ({ m, own: own.has(String(m.id)), d: fKey.format(new Date(m.kickoff)) }))
      .sort((a, b) => (b.own - a.own) || b.d.localeCompare(a.d) || (RANK[a.m.comp] ?? 9) - (RANK[b.m.comp] ?? 9) || a.m.home.localeCompare(b.m.home))
      .slice(0, CAP)
      .map((x) => x.m);
  }

  // Klipp som inte går att spela här, gemensamt med spelaren på sajten (hojdpunkter.js).
  const BAD_KEY = 'matchfixarna.hl-ej';
  function bad() {
    try {
      return JSON.parse(localStorage.getItem(BAD_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function markBad(id) {
    try {
      const list = bad().filter((x) => x !== id);
      list.push(id);
      localStorage.setItem(BAD_KEY, JSON.stringify(list.slice(-300)));
    } catch {
      // privat läge: provas igen nästa gång
    }
  }

  // ---------- i rummet ----------

  const HOST = 'https://www.youtube-nocookie.com';
  const GONE = new Set([100, 101, 150]);

  function mount(root, o) {
    const box = root.querySelector('#rum-vhs');
    const styr = [...box.querySelectorAll('.vhs-styr')];
    const bild = box.querySelector('.vhs-bild');
    const mask = box.querySelector('.vhs-mask');
    const osdEl = box.querySelector('.vhs-osd');
    const vfd = box.querySelector('.vhs-vfd');
    const lucka = box.querySelector('.vhs-lucka');
    const kas = [...box.querySelectorAll('.vhs-kas')].sort((a, b) => a.dataset.i - b.dataset.i);
    // tapes: kassetternas matcher; cur: kassetten i videon (index), mid: dess
    // match; near: kameran är framme; resume: spela vidare när man kommer tillbaka
    const V = { tapes: [], key: '', cur: null, mid: null, near: false, resume: false, lage: 'tom' };
    // spelaren: klippen, vilket, meddelandenas id, ramen, tiden och läget
    const P = { list: [], i: 0, seq: 0, frame: null, ready: false, ping: null, t: 0, st: -1, timer: 0 };

    function lage(l, text) {
      V.lage = l;
      box.dataset.lage = l;
      if (text != null) osdEl.textContent = text;
    }

    // ---------- högarna ----------

    // Kassetterna nerifrån och upp i varje hög; den som är i videon lämnar en
    // lucka som de ovanför sjunker ner i, men har kvar sin plats att komma
    // tillbaka till.
    function layout() {
      for (const c of COLS) {
        let yAll = c.y;
        let yNow = c.y;
        for (const i of c.ix) {
          const el = kas[i];
          if (!V.tapes[i]) continue;
          yAll -= KAS.h;
          if (i !== V.cur) yNow -= KAS.h;
          const top = i === V.cur ? yAll : yNow;
          const x = c.x + (hash(`x${i}`) - 0.5) * 2 * c.j;
          const r = (hash(`r${i}`) - 0.5) * 2 * c.r;
          el.style.left = px(x);
          el.style.top = px(top);
          el.style.setProperty('--r', `${r2(r)}deg`);
          el.dataset.r = r2(r);
        }
      }
      kas.forEach((el, i) => el.classList.toggle('inne', i === V.cur));
    }

    const VARIANTS = 5;
    const INK = ['#1b2030', '#22357e', '#2a2724'];
    function paint(el, m) {
      const hide = hidden(m);
      const score = !hide && m.score ? `${m.score.home}–${m.score.away}` : '';
      const name = `${o.short(m.home)}–${o.short(m.away)}`;
      const label = name.length <= 16 ? name : `${o.kort(m.home)}–${o.kort(m.away)}`;
      const v = Math.floor(hash(m.id) * VARIANTS);
      el.className = `vhs-kas v${v}${el.classList.contains('inne') ? ' inne' : ''}`;
      el.style.setProperty('--blk', INK[Math.floor(hash(`b${m.id}`) * INK.length)]);
      el.style.setProperty('--lr', `${r2((hash(`l${m.id}`) - 0.5) * 1.6)}deg`);
      const text = score ? `${label} ${score}` : label;
      // långa namn skrivs mindre, så att de får plats på etiketten
      el.style.setProperty('--fs', `${text.length > 21 ? 15 : text.length > 17 ? 17.5 : 20}px`);
      el.querySelector('b').textContent = text;
      el.querySelector('i').textContent = dag(m.kickoff);
      el.setAttribute('aria-label', `${m.home} – ${m.away}${score ? `, ${score}` : ''}, ${dag(m.kickoff)}`);
    }

    // Kassetten åker från sin plats in i facket (eller tillbaka): lyfts mot
    // en, ställs framför facket och skjuts in.
    const FC = [(FACK.x + FACK.w / 2) * S, (FACK.y + FACK.h / 2) * S];
    function fly(el, into, done) {
      if (o.calm()) {
        done();
        return;
      }
      const cx = parseFloat(el.style.left) + KAS.w * S / 2;
      const cy = parseFloat(el.style.top) + KAS.h * S / 2;
      const [dx, dy] = [FC[0] - cx, FC[1] - cy];
      const k = [
        { transform: `rotate(${el.dataset.r}deg)`, opacity: 1, offset: 0 },
        { transform: `translate(${r2(dx * 0.45)}px, ${r2(dy * 0.45 - 70)}px) scale(1.12)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${r2(dx)}px, ${r2(dy + 22)}px) scale(1.07)`, opacity: 1, offset: 0.76 },
        { transform: `translate(${r2(dx)}px, ${r2(dy)}px) scale(1)`, opacity: 1, offset: 0.9 },
        { transform: `translate(${r2(dx)}px, ${r2(dy - 4)}px) scale(.9)`, opacity: 0, offset: 1 },
      ];
      el.classList.add('flyger');
      el.classList.remove('inne');
      const a = el.animate(into ? k : k.map((f) => ({ ...f, offset: 1 - f.offset })).reverse(),
        { duration: into ? 900 : 720, easing: 'cubic-bezier(0.3, 0, 0.25, 1)' });
      setTimeout(() => {
        lucka.classList.add('matar');
        setTimeout(() => lucka.classList.remove('matar'), 380);
      }, into ? 700 : 0);
      a.onfinish = () => {
        el.classList.remove('flyger');
        done();
      };
    }

    // ---------- spelaren ----------

    function stopPlayer() {
      clearTimeout(P.ping);
      clearTimeout(P.timer);
      P.seq++;
      P.frame = null;
      P.ready = false;
      P.st = -1;
      bild.replaceChildren();
    }

    const cmd = (func, args = []) => {
      if (P.frame && P.frame.contentWindow) P.frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args, id: P.seq, channel: 'widget' }), HOST);
    };
    const listen = (f, id) => f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), HOST);

    // Klippet P.list[P.i] från sekund start, i rutan.
    function load(start) {
      stopPlayer();
      const seq = P.seq;
      const q = new URLSearchParams({
        autoplay: V.near ? 1 : 0, rel: 0, playsinline: 1, iv_load_policy: 3, start: Math.floor(start || 0),
        enablejsapi: 1, origin: location.origin, widgetid: seq,
      });
      const f = document.createElement('iframe');
      f.src = `${HOST}/embed/${encodeURIComponent(P.list[P.i])}?${q}`;
      f.title = 'Höjdpunkter';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      const hello = (n) => {
        if (seq !== P.seq || P.ready || !n) return;
        listen(f, seq);
        P.ping = setTimeout(hello, 250, n - 1);
      };
      f.addEventListener('load', () => hello(40));
      P.frame = f;
      bild.replaceChildren(f);
      // VCR:ns text står kvar tills bilden kommer
      P.timer = setTimeout(() => { if (seq === P.seq && V.lage === 'laddar') lage('spelar'); }, 3500);
    }

    function start(m) {
      const skip = new Set(bad());
      P.list = m.y.filter((id) => id && !skip.has(id));
      P.i = 0;
      P.t = 0;
      mask.hidden = !hidden(m);
      if (P.list.length) load(0);
      else {
        stopPlayer();
        lage('brus', '');
      }
    }

    function next() {
      P.t = 0;
      if (++P.i < P.list.length) load(0);
      else {
        stopPlayer();
        lage('brus', '');
      }
    }

    // Spelarens läge: 1 spelar, 2 paus, 0 slut (då matas kassetten ut).
    function state(st) {
      P.st = st;
      if (st === 1) {
        if (V.lage === 'laddar') lage('spelar');
        // gick man därifrån medan den laddade: paus tills man kommer tillbaka
        if (!V.near) {
          cmd('pauseVideo');
          V.resume = true;
        }
      } else if (st === 0) setTimeout(() => { if (P.st === 0) eject(); }, 900);
      tick();
    }

    addEventListener('message', (e) => {
      const f = P.frame;
      if (!f || e.source !== f.contentWindow || e.origin !== HOST || typeof e.data !== 'string') return;
      let d;
      try {
        d = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!d || d.id !== P.seq) return;
      if (d.event === 'readyToListen') {
        listen(f, P.seq);
        return;
      }
      P.ready = true;
      if (d.event === 'onError') {
        if (GONE.has(d.info)) markBad(P.list[P.i]);
        next();
      } else if (d.event === 'onStateChange' && typeof d.info === 'number') state(d.info);
      else if (d.event === 'infoDelivery' && d.info) {
        if (typeof d.info.currentTime === 'number') P.t = d.info.currentTime;
        if (typeof d.info.playerState === 'number' && d.info.playerState !== P.st) state(d.info.playerState);
      }
    });

    // Displayen: 12:00 som blinkar när ingen kassett är i, annars tiden.
    const clock = (s) => {
      const t = Math.max(0, Math.floor(s));
      return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    };
    function tick() {
      const txt = V.cur == null && V.mid == null ? '12:00' : `${P.st === 2 ? '❚❚' : '▶'} ${clock(P.t)}`;
      if (vfd.textContent !== txt) vfd.textContent = txt;
      vfd.classList.toggle('blink', txt === '12:00');
    }
    setInterval(() => { if (!root.hidden) tick(); }, 500);

    // ---------- kassetterna in och ut ----------

    function insert(i) {
      const m = V.tapes[i];
      if (!m) return;
      if (V.cur === i) {
        toggle();
        return;
      }
      if (V.cur != null) eject();
      stopPlayer();
      V.cur = i;
      V.mid = m.id;
      lage('laddar', '▶ SPELA');
      const el = kas[i];
      layout();
      el.classList.remove('inne');
      fly(el, true, () => {
        if (V.cur !== i) return;
        el.classList.add('inne');
        start(m);
        tick();
      });
      tick();
    }

    function eject() {
      const i = V.cur;
      stopPlayer();
      V.cur = null;
      V.mid = null;
      V.resume = false;
      mask.hidden = true;
      lage('tom', 'STOPP');
      layout();
      tick();
      if (i == null || !kas[i] || !V.tapes[i]) return;
      const el = kas[i];
      fly(el, false, () => {});
    }

    function toggle() {
      if (V.cur == null) insert(0);
      else if (P.st === 1) cmd('pauseVideo');
      else if (P.frame) cmd('playVideo');
      else start(V.tapes[V.cur]);
    }

    function step(d) {
      const n = V.tapes.length;
      if (!n) return;
      insert(V.cur == null ? 0 : Math.min(n - 1, Math.max(0, V.cur + d)));
    }

    box.addEventListener('click', (e) => {
      if (!V.near) return;
      const b = e.target.closest('.vhs-kas, [data-vhs]');
      if (!b) return;
      e.preventDefault();
      if (b.classList.contains('vhs-kas')) insert(Number(b.dataset.i));
      else if (b.dataset.vhs === 'spela') toggle();
      else if (b.dataset.vhs === 'ut') eject();
      else step(b.dataset.vhs === 'fram' ? 1 : -1);
    });

    tick();

    return {
      fill(matches, ids) {
        const list = pick(matches, ids);
        const key = list.map((m) => `${m.id}:${hidden(m) ? '?' : m.score ? `${m.score.home}-${m.score.away}` : ''}`).join();
        if (key === V.key) return;
        V.key = key;
        V.tapes = list;
        kas.forEach((el, i) => {
          el.hidden = !list[i];
          if (list[i]) paint(el, list[i]);
        });
        // kassetten i videon kan ha fått en annan plats
        if (V.mid != null) {
          const j = list.findIndex((m) => m.id === V.mid);
          V.cur = j >= 0 ? j : null;
          const m = list[j];
          if (m) mask.hidden = !hidden(m);
        }
        layout();
      },
      // Nära: kassetterna och knapparna går att trycka på, och videon spelar
      // vidare om den gjorde det när man gick. Svarar med hörnet i scenen.
      zoom(on) {
        V.near = on;
        for (const s of styr) s.inert = !on;
        // utan rörelser (och i stillbilder) står lådan på plats direkt
        box.classList.toggle('lugn', o.calm());
        if (!on && P.frame && P.st !== 2 && P.st !== 0) {
          cmd('pauseVideo');
          V.resume = true;
        } else if (on && V.resume) {
          cmd('playVideo');
          V.resume = false;
        }
        return FOCUS;
      },
      // Pilarna byter kassett när man är framme.
      key(k) {
        if (/^Arrow(Right|Down)$/.test(k)) step(1);
        else if (/^Arrow(Left|Up)$/.test(k)) step(-1);
        else return false;
        return true;
      },
      // Rummet stängs: videon stannar och kassetten ligger kvar på sin plats.
      stop() {
        stopPlayer();
        V.cur = null;
        V.mid = null;
        V.resume = false;
        mask.hidden = true;
        lage('tom', 'STOPP');
        layout();
        tick();
      },
    };
  }

  return { html, mount };
})();
