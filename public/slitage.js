'use strict';

// ---------- slitaget på papperet ----------
//
// Papperet (papper.css, matchblad.css) ser använt ut: alltid gulnat, och
// ibland skrynklat, med fläckar, ett hundöra eller ett hörn som vikts in.
// Varje papper har haft ett liv – i plånboken, i fickan, på köksbordet, på
// skrivbordet, nästan i papperskorgen eller (sällan) knappt något alls – och
// slitagen hör ihop med det (LIVES). Vilket liv,
// var slitagen sitter och hur de ser ut slumpas ur papperets nyckel –
// omgångens id för gängets kupong, kupongens id, matchens id för
// matchbladet – så att samma papper ser likadant ut varje gång det ritas,
// men inga två papper är slitna på samma sätt.
//
// Slitaget är två bilder (svg) över papperet: ::before multipliceras med
// trycket (gulningen, skrynklet, fläckarna) och ::after lägger det ljusa
// överst (skrynklets ljusa sidor, hundörats baksida). Båda
// ligger över allt på papperet, också raderna som står kvar när man
// bläddrar. Höjden räknas i bildpunkter från överkanten och bredden
// i andelar, så att inget flyttar sig när papperet växer eller byter flik –
// papperet visar bara mer av samma ark. Gulningen tonar också själva
// papperets färg (--pp-paper) och rutornas (--pp-box).
//
// Papperen hittas av sig själva (.pp och matchbladets #match-detail-view).
// En sida kan ge papperet en egen nyckel med data-slitage.

(function () {
  const SEL = '.pp, dialog.mr-modal #match-detail-view';
  // papperet och rutorna i papper.css, och så gula de blir som mest
  const PAPER = [[241, 232, 213], [226, 207, 166]];
  const BOX = [[251, 247, 236], [238, 225, 196]];

  // Slumptal ur en nyckel (mulberry32 med FNV-hash som frö, som i papper.js).
  function rng(key) {
    let a = 2166136261;
    for (let i = 0; i < key.length; i++) a = Math.imul(a ^ key.charCodeAt(i), 16777619);
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = (x) => x.toFixed(1);
  const span = (r, a, b) => a + r() * (b - a);
  const jit = (r, n) => (r() - 0.5) * 2 * n;
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  // Ett av alternativen efter vikt: [[värde, vikt]].
  function weighted(r, list) {
    let t = r() * list.reduce((a, x) => a + x[1], 0);
    for (const x of list) if ((t -= x[1]) < 0) return x[0];
    return list[list.length - 1][0];
  }
  const line = (p) => 'M' + p.map((q) => `${f(q[0])} ${f(q[1])}`).join('L');
  function dashes(r, a, b, c, d) {
    const s = [];
    for (let i = 0; i < 8; i++) s.push(Math.round(span(r, a, a + b)), Math.round(span(r, c, c + d)));
    return s.join(' ');
  }
  const mix = ([a, b], t) => '#' + a.map((x, i) => Math.round(x + (b[i] - x) * t).toString(16).padStart(2, '0')).join('');

  // ---------- vad papperet har varit med om ----------

  // Slitaget är inte hur som helst: papperet har haft ett liv, och slitagen
  // hör ihop med det. has: alltid, may: ibland. Gulnat är alla papper.
  const LIVES = {
    planbok: { has: [], may: [['flack', 0.7], ['ora', 0.4], ['horn', 0.15]] },
    ficka: { has: ['ora'], may: [['skrynkel', 0.3], ['flack', 0.5], ['horn', 0.2]] },
    kok: { has: [], may: [['flack', 0.6], ['horn', 0.25]] },
    bord: { has: [], may: [['horn', 0.35], ['flack', 0.4]] },
    // nästan slängd: skrynklad till en boll och utslätad igen
    korg: { has: ['skrynkel'], may: [['flack', 0.5]] },
    ny: { has: [], may: [['flack', 0.5], ['ora', 0.3], ['horn', 0.2]] },
  };
  // Vilka liv papperet kan ha haft och hur slitet det är (0–1): kupongen
  // som växer fram är minst sliten, omgångens kupong har legat framme hela
  // helgen och säsongens betyg har burits med sedan augusti. Bara kupongen
  // som växer fram och matchbladet kan vara nästan nya. Matchbladet får
  // inget hundöra – rutans skugga följer inte ett avvikt hörn. reach: hur
  // långt ner (px) slitagen sitter, så att de hamnar på papperet också när
  // det är som kortast – kupongen som växer fram börjar med sju tomma rader.
  // rolls: rutan där innehållet rullar i papperet (matchbladets flikar,
  // raderna på kupongen som växer fram). Fläckarna och skrynklet där
  // sitter i innehållet och följer med när det rullar; gulningen, hundörat
  // och hörnen står still med kanten. grows: papperet växer. Ett hörn som
  // vikts in sitter inte nedtill när papperet växer eller innehållet rullar
  // – där skulle det flytta sig.
  const KINDS = {
    bygge: { lives: [['ny', 0.5], ['kok', 1.5], ['bord', 1.5]], age: 0.35, reach: 520, grows: true, rolls: '.pb-rows' },
    match: { lives: [['ny', 0.5], ['kok', 1], ['bord', 1], ['ficka', 0.8]], age: 0.5, ear: false, reach: 640, rolls: '.mr-body' },
    omg: { lives: [['planbok', 1], ['ficka', 1], ['kok', 1.2], ['bord', 0.8], ['korg', 0.3]], age: 0.75 },
    kupong: { lives: [['planbok', 1], ['ficka', 1], ['kok', 1.2], ['bord', 0.8], ['korg', 0.4]], age: 0.8 },
    betyg: { lives: [['planbok', 2], ['ficka', 2], ['kok', 1], ['korg', 0.5]], age: 1 },
  };

  function plan(kind, key) {
    const r = rng(`slitage:${key}`);
    const k = KINDS[kind];
    const life = LIVES[weighted(r, k.lives)];
    const on = new Set(life.has);
    for (const [x, odds] of life.may) if (r() < odds && on.size < 3) on.add(x);
    if (k.ear === false) on.delete('ora');
    const p = {};
    // de bleka slitagen syns mer ju äldre papperet är
    const a = 0.55 + 0.45 * k.age;
    const reach = k.reach || 900;
    p.gul = aged(r, k.age);
    if (on.has('skrynkel')) p.skrynkel = crumpled(r, a);
    if (on.has('flack')) p.flack = spots(r, a, reach);
    if (on.has('ora')) p.ora = { corner: ['tl', 'tr', 'br'][int(r, 0, 2)], s: int(r, 16, 28) };
    if (on.has('horn')) p.horn = corner(r, a, k.grows || !!k.rolls, p.ora && p.ora.corner);
    return p;
  }

  // Gulnat: papperets färg, mörkare kanter, fläckvis toning och ibland en
  // sida som legat i solen – mer ju äldre papperet är, men synligt också på
  // det nyaste.
  function aged(r, age) {
    const sides = [[0, 0, 1, 0], [1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 0, 0]];
    return {
      tone: span(r, 0.35, 0.8) * (0.4 + 0.6 * age),
      edge: span(r, 0.28, 0.55) * (0.5 + 0.5 * age),
      blotch: span(r, 0.6, 1.05) * (0.6 + 0.4 * age),
      freq: span(r, 0.006, 0.014),
      seed: int(r, 1, 999),
      side: r() < 0.55 * age ? sides[int(r, 0, 3)] : null,
      sun: span(r, 0.16, 0.36),
    };
  }

  // Skrynklat: knycklat till en boll och utslätat igen, så att hela papperet
  // är fullt av korta veck. Vecken slumpas när de ritas, ur ett eget frö.
  function crumpled(r, a) {
    const c = span(r, 55, 85);
    return {
      seed: `skrynkel:${int(r, 1, 1e9)}`,
      c,
      cols: Math.max(5, Math.round(860 / c)),
      dens: span(r, 0.5, 0.7),
      op: span(r, 0.14, 0.22) * a,
      face: span(r, 0.02, 0.04) * a,
    };
  }

  // Ett hörn som vikts in och slätats ut igen: ett snett veck tvärs över
  // hörnet. Hörnet låg med trycket mot papperet och gulnade mindre, liksom
  // det ställe det låg på. Inte nedtill på ett papper som växer eller där
  // innehållet rullar (low), och inte i hörnet med hundörat.
  function corner(r, a, low, ear) {
    const all = (low ? ['tl', 'tr'] : ['tl', 'tr', 'bl', 'br']).filter((c) => c !== ear);
    const s = span(r, 26, 80);
    return {
      corner: all[int(r, 0, all.length - 1)],
      a: s,
      b: s * span(r, 0.75, 1.3),
      side: r() < 0.5 ? 1 : -1,
      dark: span(r, 0.22, 0.36) * a,
      light: r() < 0.65 ? span(r, 0.1, 0.2) : 0,
      worn: dashes(r, 10, 40, 1, 4),
    };
  }

  // Fläckar: rost i små klungor och ibland ett fingeravtryck av grafit.
  function spots(r, a, reach) {
    const s = reach / 900;
    const dots = [];
    for (let c = int(r, 1, 3); c > 0; c--) {
      const x = span(r, 0.05, 0.95);
      const y = span(r, 30 * s, 900 * s);
      const sig = span(r, 25, 90);
      for (let n = int(r, 4, 12); n > 0; n--) {
        dots.push({ x, dx: (r() + r() + r() - 1.5) * sig, y: y + (r() + r() + r() - 1.5) * sig, rad: span(r, 0.5, 2.6), op: span(r, 0.1, 0.32) * a, halo: r() < 0.25 });
      }
    }
    const smudge = r() < 0.45 ? { x: span(r, 0.06, 0.94), y: span(r, 60 * s, 900 * s), rx: span(r, 12, 18), ry: span(r, 16, 24), rot: jit(r, 40), op: span(r, 0.05, 0.09) * a } : null;
    return { dots, smudge };
  }

  // ---------- bilderna ----------

  // roll: rutan där innehållet rullar (rolling). Gulningen och hörnen sitter
  // på bladet (bmul, btop) och resten på det som står på det (mul, top), som
  // där följer med innehållet. Y: hur långt ner det räcker.
  function draw(p, W, H, roll) {
    const Y = roll ? Math.max(H, roll.y + roll.d) : H;
    const md = ['<filter id="b" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2"/></filter>',
      '<filter id="b4" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="4"/></filter>'];
    const td = ['<filter id="b3" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter>'];
    const bmul = [];
    const btop = [];
    const mul = [];
    const top = [];

    if (p.gul) {
      const g = p.gul;
      md.push('<radialGradient id="v" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#c4a06a" stop-opacity="0"/>' +
        `<stop offset="1" stop-color="#c4a06a" stop-opacity="${g.edge.toFixed(2)}"/></radialGradient>` +
        `<filter id="t" filterUnits="userSpaceOnUse" x="0" y="0" width="${f(W)}" height="${f(H)}">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${g.freq.toFixed(4)}" numOctaves="2" seed="${g.seed}"/>` +
        `<feColorMatrix values="0 0 0 0 .66 0 0 0 0 .52 0 0 0 0 .32 0 0 0 ${(0.3 * g.blotch).toFixed(3)} ${(-0.14 * g.blotch).toFixed(3)}"/></filter>`);
      bmul.push('<rect width="100%" height="100%" fill="url(#v)"/><rect width="100%" height="100%" filter="url(#t)"/>');
      if (g.side) {
        const [x1, y1, x2, y2] = g.side;
        md.push(`<linearGradient id="s" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#c9a46a" stop-opacity="${g.sun.toFixed(2)}"/>` +
          '<stop offset=".4" stop-color="#c9a46a" stop-opacity="0"/></linearGradient>');
        bmul.push('<rect width="100%" height="100%" fill="url(#s)"/>');
      }
    }

    // Skrynklat: ett nät av korta veck med några långa tvärs igenom, och
    // ytorna mellan vecken fångar ljuset olika. Nätet slumpas rad för rad
    // uppifrån, så att ett papper som växer bara får fler rader.
    if (p.skrynkel) {
      const k = p.skrynkel;
      const q = rng(k.seed);
      const dark = [[], [], []];
      const lite = [[], []];
      const face = [[], [], [], []]; // mörk, mörkare, ljus, ljusare
      const seg = (A, B) => `M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}`;
      const edge = (A, B, odds = k.dens) => {
        if (q() > odds) return;
        const s = q();
        dark[s < 0.5 ? 0 : s < 0.85 ? 1 : 2].push(seg(A, B));
        if (s > 0.3) lite[q() < 0.5 ? 0 : 1].push(seg(A, B));
      };
      const tri = (A, B, C) => {
        const v = jit(q, 1);
        if (Math.abs(v) > 0.35) face[(v < 0 ? 0 : 2) + (Math.abs(v) > 0.75 ? 1 : 0)].push(`${line([A, B, C])}Z`);
      };
      let prev = null;
      // raderna står olika tätt, så att nätet inte blir ett rutnät
      for (let y = -k.c; y < Y + 2 * k.c; y += k.c * span(q, 0.65, 1.35)) {
        const row = [];
        for (let i = -1; i <= k.cols + 1; i++) row.push([((i + jit(q, 0.45)) / k.cols) * W, y + jit(q, 0.4) * k.c]);
        if (prev) {
          for (let i = 0; i + 1 < row.length; i++) {
            const [A, B, C, D] = [prev[i], prev[i + 1], row[i], row[i + 1]];
            edge(A, B);
            edge(A, C);
            if (q() < 0.5) {
              edge(A, D, 0.9);
              tri(A, B, D);
              tri(A, D, C);
            } else {
              edge(B, C, 0.9);
              tri(A, B, C);
              tri(B, D, C);
            }
          }
          // ett långt veck tvärs igenom, där bollen knycklades först
          if (q() < 0.22) {
            const t = q() * Math.PI;
            const [x, L] = [q() * W, span(q, 160, 420)];
            const [ux, uy] = [(Math.cos(t) * L) / 2, (Math.sin(t) * L) / 2];
            dark[2].push(seg([x - ux, y - uy], [x + ux, y + uy]));
            lite[q() < 0.5 ? 0 : 1].push(seg([x - ux, y - uy], [x + ux, y + uy]));
          }
        }
        prev = row;
      }
      const fill = (d, c, o) => (d.length ? `<path d="${d.join('')}" fill="${c}" fill-opacity="${o.toFixed(3)}"/>` : '');
      mul.push(fill(face[0], '#9c7a4c', k.face * 0.6), fill(face[1], '#9c7a4c', k.face));
      top.push(fill(face[2], '#fffaf0', k.face * 1.4), fill(face[3], '#fffaf0', k.face * 2.4));
      dark.forEach((d, n) => d.length && mul.push(`<path d="${d.join('')}" fill="none" stroke="#6b4c2a" stroke-opacity="${(k.op * [0.4, 0.7, 1][n]).toFixed(3)}" stroke-width=".8"/>`));
      lite.forEach((d, n) => d.length && top.push(`<path d="${d.join('')}" transform="translate(${n ? '.7 .5' : '-.7 -.5'})" fill="none" stroke="#fffaf0" stroke-opacity=".45" stroke-width=".9"/>`));
    }

    if (p.flack) {
      for (const s of p.flack.dots) {
        const x = s.x * W + s.dx;
        if (s.halo) mul.push(`<circle cx="${f(x)}" cy="${f(s.y)}" r="${f(s.rad * 3)}" fill="#8b5e34" fill-opacity="${(s.op * 0.3).toFixed(3)}" filter="url(#b)"/>`);
        mul.push(`<circle cx="${f(x)}" cy="${f(s.y)}" r="${f(s.rad)}" fill="#8b5e34" fill-opacity="${s.op.toFixed(2)}"/>`);
      }
      const m = p.flack.smudge;
      if (m) mul.push(`<ellipse transform="translate(${f(m.x * W)} ${f(m.y)}) rotate(${f(m.rot)})" rx="${f(m.rx)}" ry="${f(m.ry)}" fill="#4a4846" fill-opacity="${m.op.toFixed(3)}" filter="url(#b4)"/>`);
    }

    if (p.horn) {
      const c = p.horn;
      const [P, Q, C] = {
        tl: [[c.a, 0], [0, c.b], [0, 0]],
        tr: [[W - c.a, 0], [W, c.b], [W, 0]],
        bl: [[0, H - c.b], [c.a, H], [0, H]],
        br: [[W, H - c.b], [W - c.a, H], [W, H]],
      }[c.corner];
      const [dx, dy] = [Q[0] - P[0], Q[1] - P[1]];
      const L = Math.hypot(dx, dy);
      // hörnet och dess spegelbild i vecket, där det låg
      const t = ((C[0] - P[0]) * dx + (C[1] - P[1]) * dy) / (L * L);
      const C2 = [2 * (P[0] + t * dx) - C[0], 2 * (P[1] + t * dy) - C[1]];
      if (c.light) btop.push(`<path d="${line([P, C, Q, C2])}Z" fill="#fffaf0" fill-opacity="${c.light.toFixed(2)}" filter="url(#b3)"/>`);
      const d = line([[P[0] - dx * 0.06, P[1] - dy * 0.06], [Q[0] + dx * 0.06, Q[1] + dy * 0.06]]);
      const [nx, ny] = [(-dy / L) * c.side, (dx / L) * c.side];
      bmul.push(`<path d="${d}" transform="translate(${f(nx * 2.5)} ${f(ny * 2.5)})" fill="none" stroke="#b8996a" stroke-opacity=".3" stroke-width="4" filter="url(#b)"/>`);
      bmul.push(`<path d="${d}" fill="none" stroke="#6b4c2a" stroke-opacity="${c.dark.toFixed(2)}" stroke-width="1"/>`);
      btop.push(`<path d="${d}" transform="translate(${f(-nx * 1.2)} ${f(-ny * 1.2)})" fill="none" stroke="#fffaf0" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="${c.worn}"/>`);
    }

    if (p.ora) {
      const s = p.ora.s;
      const [fold, flap, sh] = {
        tl: [[[s, 0], [0, s]], [[s, 0], [0, s], [s, s]], [1.5, 2.5]],
        tr: [[[W - s, 0], [W, s]], [[W - s, 0], [W, s], [W - s, s]], [-1.5, 2.5]],
        br: [[[W, H - s], [W - s, H]], [[W, H - s], [W - s, H], [W - s, H - s]], [-1.5, -1.5]],
      }[p.ora.corner];
      const mid = [(fold[0][0] + fold[1][0]) / 2, (fold[0][1] + fold[1][1]) / 2];
      bmul.push(`<path d="${line(flap)}Z" transform="translate(${sh[0]} ${sh[1]})" fill="#000" fill-opacity=".28" filter="url(#b)"/>`);
      td.push(`<linearGradient id="e" gradientUnits="userSpaceOnUse" x1="${f(mid[0])}" y1="${f(mid[1])}" x2="${f(flap[2][0])}" y2="${f(flap[2][1])}">` +
        '<stop offset="0" stop-color="#ebdfc6"/><stop offset="1" stop-color="#d8c6a2"/></linearGradient>');
      btop.push(`<path d="${line(flap)}Z" fill="url(#e)"/><path d="${line(fold)}" stroke="#fff8ea" stroke-opacity=".85" stroke-width="1"/>`);
    }

    const svg = (w, h, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}"><defs>${defs.join('')}</defs>${body.join('')}</svg>`;
    if (!roll) return { mul: svg(W, H, md, [...bmul, ...mul]), top: svg(W, H, td, [...top, ...btop]) };
    // i rutan ritas det som står på papperet i en egen bild som rullar med
    // innehållet (rmul, rtop), och på bladet bara ovanför och nedanför rutan
    const out = `<clipPath id="o"><rect width="${f(W)}" height="${f(roll.y)}"/>` +
      `<rect y="${f(roll.y + roll.h)}" width="${f(W)}" height="${f(Math.max(0, H - roll.y - roll.h))}"/></clipPath>`;
    const g = (attr, body) => `<g ${attr}>${body.join('')}</g>`;
    const cut = 'clip-path="url(#o)"';
    const move = `transform="translate(${f(-roll.x)} ${f(-roll.y)})"`;
    return {
      mul: svg(W, H, [...md, out], [...bmul, g(cut, mul)]),
      top: svg(W, H, [...td, out], [g(cut, top), ...btop]),
      rmul: svg(roll.w, roll.d, md, [g(move, mul)]),
      rtop: svg(roll.w, roll.d, td, [g(move, top)]),
    };
  }

  // Det avvikta hörnet klipps bort ur papperet.
  function clip(p) {
    if (!p.ora) return '';
    const s = `${p.ora.s}px`;
    return {
      tl: `polygon(${s} 0, 100% 0, 100% 100%, 0 100%, 0 ${s})`,
      tr: `polygon(0 0, calc(100% - ${s}) 0, 100% ${s}, 100% 100%, 0 100%)`,
      br: `polygon(0 0, 100% 0, 100% calc(100% - ${s}), calc(100% - ${s}) 100%, 0 100%)`,
    }[p.ora.corner];
  }

  // ---------- papperen på sidan ----------

  // Vilket papper det är (KINDS) och dess nyckel: data-slitage, matchen i
  // matchbladet, veckan för kupongen som växer fram, annars kupongens id
  // eller rubrik.
  function kindOf(el) {
    if (el.id === 'match-detail-view') return 'match';
    if (el.classList.contains('pb-slip')) return 'bygge';
    if (el.classList.contains('sm-sheet')) return 'omg';
    if (el.classList.contains('bg')) return 'betyg';
    return 'kupong';
  }
  function keyOf(el, kind) {
    if (el.dataset.slitage) return el.dataset.slitage;
    if (kind === 'match') {
      const m = /^#match\/([^/?&]+)/.exec(location.hash);
      if (m) return `match:${m[1]}`;
    }
    if (kind === 'bygge') return `bygge:${Math.floor((Date.now() / 864e5 + 3) / 7)}:${location.hash.split('?')[0]}`;
    const id = el.querySelector('.pp-code span, .pp-title, .mhead-teams');
    return `${kind}:${id ? id.textContent.trim().slice(0, 80) : ''}`;
  }

  const known = new WeakMap(); // papperet → { key, plan, size, box }
  const url = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

  // Rutan i papperet där innehållet rullar (KINDS rolls): var den sitter på
  // papperet, hur stor den är och hur långt innehållet räcker (d). Slitaget i
  // rutan (data-sl-roll, --sl-h) fälls ihop medan den mäts, så att det inte
  // självt håller ut rutan när innehållet krymper. Innehållet kan växa och
  // krympa utan att rutan gör det, så det bevakas också.
  const rolled = new WeakSet();
  function rolling(el, sel) {
    const s = sel && el.querySelector(sel);
    if (!s || !s.clientHeight || s.offsetParent !== el) return null;
    if (!s.hasAttribute('data-sl-roll')) s.setAttribute('data-sl-roll', '');
    for (const n of [s, ...s.children]) {
      if (rolled.has(n)) continue;
      rolled.add(n);
      sizes.observe(n);
    }
    const box = { el: s, x: s.offsetLeft + s.clientLeft, y: s.offsetTop + s.clientTop, w: s.clientWidth, h: s.clientHeight };
    s.style.setProperty('--sl-h', '0px');
    box.d = s.scrollHeight;
    s.style.setProperty('--sl-h', `${box.d}px`);
    return box;
  }

  function apply(el) {
    const kind = kindOf(el);
    const key = keyOf(el, kind);
    let st = known.get(el);
    if (!st || st.key !== key) {
      const match = kind === 'match';
      st = { key, plan: plan(kind, key), size: '' };
      known.set(el, st);
      if (!el.hasAttribute('data-sl')) {
        el.setAttribute('data-sl', '');
        sizes.observe(el);
      }
      // gulningen tonar papperet och rutorna; i matchbladet på dialogen, där
      // sajtens färger i rutan räknas fram ur papperets
      const host = (match && el.closest('dialog')) || el;
      const g = st.plan.gul;
      for (const [name, pair] of [['--pp-paper', PAPER], ['--pp-box', BOX]]) {
        if (g) host.style.setProperty(name, mix(pair, name === '--pp-box' ? g.tone * 0.6 : g.tone));
        else host.style.removeProperty(name);
      }
      const c = clip(st.plan);
      el.style.clipPath = c;
      el.style.webkitClipPath = c;
    }
    const w = el.clientWidth;
    const h = el.clientHeight;
    const roll = w && h ? rolling(el, KINDS[kind].rolls) : null;
    const size = [w, h, roll ? [roll.x, roll.y, roll.w, roll.h, roll.d] : ''].join();
    const box = roll && roll.el;
    if (!w || !h || (size === st.size && box === st.box)) return;
    st.size = size;
    st.box = box;
    const img = draw(st.plan, w, h, roll);
    el.style.setProperty('--sl-mul', url(img.mul));
    el.style.setProperty('--sl-top', url(img.top));
    if (box) {
      box.style.setProperty('--sl-rmul', url(img.rmul));
      box.style.setProperty('--sl-rtop', url(img.rtop));
    }
  }

  let queued = false;
  function scan() {
    queued = false;
    for (const el of document.querySelectorAll(SEL)) apply(el);
  }
  function later() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }
  const sizes = new ResizeObserver(later);
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', later);
  later();
})();
