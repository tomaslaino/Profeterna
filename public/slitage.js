'use strict';

// ---------- slitaget på papperet ----------
//
// Papperet (papper.css, matchblad.css) ser använt ut: alltid gulnat, och
// oftast vikt, med en kaffering, fläckar, ett hundöra eller ett suddat
// ställe. Varje papper har haft ett liv – i plånboken, i fickan, på
// köksbordet, på skrivbordet eller (sällan) knappt något alls – och
// slitagen hör ihop med det (LIVES). Vilket liv,
// var slitagen sitter och hur de ser ut slumpas ur papperets nyckel –
// omgångens id för gängets kupong, kupongens id, matchens id för
// matchbladet – så att samma papper ser likadant ut varje gång det ritas,
// men inga två papper är slitna på samma sätt.
//
// Slitaget är två bilder (svg) över papperet: ::before multipliceras med
// trycket (gulningen, vecken, fläckarna, ringarna, blyertsen) och ::after
// lägger det ljusa överst (vecken som nött bort trycket, suddet, hundörats
// baksida). Båda ligger över allt på papperet, också raderna som står kvar
// när man bläddrar. Höjden räknas i bildpunkter från överkanten och bredden
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
  // hör ihop med det. has: alltid, may: ibland, fold: hur det har vikts.
  // Gulnat är alla papper.
  const LIVES = {
    planbok: { has: ['vikt'], may: [['flack', 0.7], ['ora', 0.4], ['kaffe', 0.2]], fold: ['hv'] },
    ficka: { has: ['vikt', 'ora'], may: [['flack', 0.5], ['kaffe', 0.2]], fold: ['h', 'hh'] },
    kok: { has: ['kaffe'], may: [['flack', 0.6], ['vikt', 0.4], ['sudd', 0.2]], fold: ['h', 'v'] },
    bord: { has: ['sudd'], may: [['kaffe', 0.8], ['vikt', 0.5], ['flack', 0.4]], fold: ['h'] },
    ny: { has: [], may: [['flack', 0.5], ['ora', 0.3]], fold: ['h'] },
  };
  // Vilka liv papperet kan ha haft och hur slitet det är (0–1): kupongen
  // som växer fram är minst sliten, omgångens kupong har legat framme hela
  // helgen och säsongens betyg har burits med sedan augusti. Bara kupongen
  // som växer fram och matchbladet kan vara nästan nya. Matchbladet får
  // inget hundöra – rutans skugga följer inte ett avvikt hörn. reach: hur
  // långt ner (px) slitagen sitter, så att de hamnar på papperet också när
  // det är som kortast – kupongen som växer fram börjar med sju tomma rader.
  // mid: matchbladet står still och innehållet rullar i det, så vecken sitter
  // mitt på bladet – tvärs över och ibland på längden – och står still med
  // bården och kanthålen.
  const KINDS = {
    bygge: { lives: [['ny', 0.5], ['kok', 1.5], ['bord', 1.5]], age: 0.35, reach: 520 },
    match: { lives: [['ny', 0.5], ['kok', 1], ['bord', 1], ['ficka', 0.8]], age: 0.5, ear: false, reach: 640, mid: true },
    omg: { lives: [['planbok', 1], ['ficka', 1], ['kok', 1.2], ['bord', 0.8]], age: 0.75 },
    kupong: { lives: [['planbok', 1], ['ficka', 1], ['kok', 1.2], ['bord', 0.8]], age: 0.8 },
    betyg: { lives: [['planbok', 2], ['ficka', 2], ['kok', 1]], age: 1 },
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
    if (on.has('vikt')) p.vikt = folds(r, life.fold, reach, k.mid);
    if (on.has('flack')) p.flack = spots(r, a, reach);
    if (on.has('kaffe')) p.kaffe = coffee(r, a, reach);
    if (on.has('ora')) p.ora = { corner: ['tl', 'tr', 'br'][int(r, 0, 2)], s: int(r, 16, 28) };
    if (on.has('sudd')) p.sudd = erased(r, reach);
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

  // Vikt: på mitten, på längden, i fyra eller i tre som ett brev. Vecket är
  // en mörk linje med skugga på ena sidan och nött tryck på den andra. Mitt
  // på bladet (mid) sitter vecket tvärs över i en andel av höjden, och ett
  // papper som skulle vikas i tre viks på mitten i stället.
  function folds(r, kinds, reach, mid) {
    const s = reach / 900;
    let kind = kinds[int(r, 0, kinds.length - 1)];
    if (mid && kind === 'hh') kind = 'h';
    const crease = (dir, at) => ({
      dir, at, mid,
      tilt: jit(r, 4),
      side: r() < 0.5 ? 1 : -1,
      dark: span(r, 0.26, 0.42),
      shade: span(r, 0.14, 0.3),
      band: span(r, 26, 54),
      wob: Array.from({ length: 15 }, () => jit(r, 0.8)),
      worn: dashes(r, 20, 90, 1, 6),
    });
    const out = [];
    if (kind === 'hh') {
      const y = span(r, 220 * s, 320 * s);
      out.push(crease('h', y), crease('h', y + span(r, 260 * s, 340 * s)));
    } else if (kind.includes('h')) out.push(crease('h', mid ? span(r, 0.47, 0.53) : span(r, 300 * s, 560 * s)));
    if (kind.includes('v')) out.push(crease('v', mid ? span(r, 0.47, 0.53) : span(r, 0.38, 0.62)));
    return out;
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

  // Kaffe: en ring, ibland två – samma kopp nedställd en gång till eller en
  // annan – hel eller bruten, med en mörk kant, en blek sjö och ibland stänk.
  const RIMS = ['', '72 5 19 4', '60 14 26', '86 14', '38 7 44 11'];
  function coffee(r, a, reach) {
    const s = reach / 900;
    const one = () => ({
      rx: span(r, 30, 58),
      round: span(r, 0.9, 1),
      rot: r() * 180,
      w: span(r, 1.5, 3.2),
      op: span(r, 0.24, 0.46) * a,
      pool: span(r, 0.03, 0.1),
      rim: RIMS[int(r, 0, RIMS.length - 1)],
      off: int(r, 0, 99),
      disp: span(r, 4, 9),
      seed: int(r, 1, 999),
      drops: r() < 0.4 ? Array.from({ length: int(r, 2, 6) }, () => ({ a: r() * 6.283, d: span(r, 1.1, 1.8), rx: span(r, 1.2, 4.2), ry: span(r, 0.6, 1) })) : [],
    });
    const first = { ...one(), x: span(r, 0.08, 0.92), y: span(r, 70 * s, 880 * s), dx: 0 };
    const out = [first];
    if (r() < 0.3) {
      if (r() < 0.6) {
        const t = r() * 6.283;
        const d = first.rx * span(r, 0.35, 0.8);
        out.push({ ...one(), rx: first.rx * span(r, 0.97, 1.03), x: first.x, dx: Math.cos(t) * d, y: first.y + Math.sin(t) * d });
      } else out.push({ ...one(), x: span(r, 0.08, 0.92), y: span(r, 70 * s, 880 * s), dx: 0 });
    }
    return out;
  }

  // Suddat: något skrivet med blyerts – streck att räkna med, ett klotter
  // eller en pil – nästan bortsuddat, med smulor runt om.
  function erased(r, reach) {
    const s = reach / 900;
    const kind = int(r, 0, 2);
    let d = '';
    if (kind === 0) {
      for (let i = 0; i < 4; i++) {
        const x = -9 + i * 5;
        d += `M${f(x + jit(r, 0.8))} ${f(-7 + jit(r, 1))}L${f(x + jit(r, 0.8))} ${f(7 + jit(r, 1))}`;
      }
      d += `M-12 ${f(5 + jit(r, 1))}L10 ${f(-5 + jit(r, 1))}`;
    } else if (kind === 1) {
      const p = [];
      for (let x = -20, i = 0; x < 22; x += span(r, 3, 6), i++) p.push([x, (i % 2 ? 5 : -5) + jit(r, 2)]);
      d = line(p);
    } else {
      d = `M-18 ${f(6 + jit(r, 2))}Q-4 ${f(-10 + jit(r, 3))} 16 -2M16 -2L9 -6M16 -2L11 4`;
    }
    return {
      x: span(r, 0.15, 0.85),
      y: span(r, 80 * s, 800 * s),
      rx: span(r, 22, 38),
      ry: span(r, 9, 15),
      rot: jit(r, 20),
      d,
      crumbs: Array.from({ length: int(r, 3, 7) }, () => [jit(r, 34), jit(r, 16), span(r, 0.8, 2)]),
    };
  }

  // ---------- bilderna ----------

  function draw(p, W, H) {
    const md = ['<filter id="b" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2"/></filter>',
      '<filter id="b4" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="4"/></filter>'];
    const td = ['<filter id="b3" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter>'];
    const mul = [];
    const top = [];

    if (p.gul) {
      const g = p.gul;
      md.push('<radialGradient id="v" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#c4a06a" stop-opacity="0"/>' +
        `<stop offset="1" stop-color="#c4a06a" stop-opacity="${g.edge.toFixed(2)}"/></radialGradient>` +
        `<filter id="t" filterUnits="userSpaceOnUse" x="0" y="0" width="${f(W)}" height="${f(H)}">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${g.freq.toFixed(4)}" numOctaves="2" seed="${g.seed}"/>` +
        `<feColorMatrix values="0 0 0 0 .66 0 0 0 0 .52 0 0 0 0 .32 0 0 0 ${(0.3 * g.blotch).toFixed(3)} ${(-0.14 * g.blotch).toFixed(3)}"/></filter>`);
      mul.push('<rect width="100%" height="100%" fill="url(#v)"/><rect width="100%" height="100%" filter="url(#t)"/>');
      if (g.side) {
        const [x1, y1, x2, y2] = g.side;
        md.push(`<linearGradient id="s" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#c9a46a" stop-opacity="${g.sun.toFixed(2)}"/>` +
          '<stop offset=".4" stop-color="#c9a46a" stop-opacity="0"/></linearGradient>');
        mul.push('<rect width="100%" height="100%" fill="url(#s)"/>');
      }
    }

    if (p.vikt) {
      // vecket tvärs över mitt på bladet sitter i en andel av höjden
      const creases = p.vikt.map((c) => (c.dir === 'h' && c.mid ? { ...c, at: c.at * H } : c));
      creases.forEach((c, i) => {
        const h = c.dir === 'h';
        const d = line(c.wob.map((w, j) => {
          const t = j / 14;
          return h ? [t * (W + 20) - 10, c.at + c.tilt * t + w] : [c.at * W + c.tilt * t + w, t * (H + 20) - 10];
        }));
        // skuggan på ena sidan om vecket, tonad bort från det
        const at = h ? c.at : c.at * W;
        const [o0, o1] = c.side > 0 ? [c.shade, 0] : [0, c.shade];
        md.push(`<linearGradient id="k${i}" x1="0" y1="0" x2="${h ? 0 : 1}" y2="${h ? 1 : 0}">` +
          `<stop offset="0" stop-color="#b8996a" stop-opacity="${o0.toFixed(2)}"/><stop offset="1" stop-color="#b8996a" stop-opacity="${o1.toFixed(2)}"/></linearGradient>`);
        const s0 = c.side > 0 ? at : at - c.band;
        mul.push(h
          ? `<rect x="0" y="${f(s0)}" width="${f(W)}" height="${f(c.band)}" fill="url(#k${i})"/>`
          : `<rect x="${f(s0)}" y="0" width="${f(c.band)}" height="${f(H)}" fill="url(#k${i})"/>`);
        mul.push(`<path d="${d}" fill="none" stroke="#6b4c2a" stroke-opacity="${c.dark.toFixed(2)}" stroke-width="1"/>`);
        const o = f(-c.side * 1.3);
        top.push(`<path d="${d}" transform="translate(${h ? `0 ${o}` : `${o} 0`})" fill="none" stroke="#fffaf0" stroke-opacity=".75" stroke-width="1.3" stroke-dasharray="${c.worn}"/>`);
      });
      // där vecken korsar varandra är papperet mest nött
      const hs = creases.filter((c) => c.dir === 'h');
      const v = creases.find((c) => c.dir === 'v');
      if (v) {
        for (const c of hs) {
          const x = v.at * W;
          const y = c.at + c.tilt * (x / W);
          top.push(`<circle cx="${f(x)}" cy="${f(y)}" r="5" fill="#fffaf0" fill-opacity=".5" filter="url(#b3)"/>`);
          mul.push(`<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#6b4c2a" fill-opacity=".14"/>`);
        }
      }
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

    if (p.kaffe) {
      p.kaffe.forEach((c, i) => {
        const x = c.x * W + c.dx;
        const ry = c.rx * c.round;
        const R = c.rx * 2.4;
        md.push(`<filter id="c${i}" filterUnits="userSpaceOnUse" x="${f(x - R)}" y="${f(c.y - R)}" width="${f(2 * R)}" height="${f(2 * R)}">` +
          `<feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="${c.seed}" result="n"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="n" scale="${f(c.disp)}" xChannelSelector="R" yChannelSelector="G"/></filter>`);
        // sjön tonar mot kanten, där kaffet torkade sist och blev mörkast
        md.push(`<radialGradient id="g${i}"><stop offset=".45" stop-color="#a0662c" stop-opacity="${(c.pool * 0.3).toFixed(3)}"/>` +
          `<stop offset=".9" stop-color="#a0662c" stop-opacity="${(c.pool * 1.6).toFixed(3)}"/><stop offset="1" stop-color="#7c4316" stop-opacity="${(c.op * 0.55).toFixed(3)}"/></radialGradient>`);
        const dash = c.rim ? ` pathLength="100" stroke-dasharray="${c.rim}" stroke-dashoffset="${c.off}"` : '';
        const drops = c.drops.map((o) => `<ellipse cx="${f(Math.cos(o.a) * c.rx * o.d)}" cy="${f(Math.sin(o.a) * ry * o.d)}" rx="${f(o.rx)}" ry="${f(o.rx * o.ry)}" fill="#8a4f1f" fill-opacity="${(c.op * 0.6).toFixed(2)}"/>`).join('');
        mul.push(`<g filter="url(#c${i})"><g transform="translate(${f(x)} ${f(c.y)}) rotate(${f(c.rot)})">` +
          `<ellipse rx="${f(c.rx)}" ry="${f(ry)}" fill="url(#g${i})"/>` +
          `<ellipse rx="${f(c.rx)}" ry="${f(ry)}" fill="none" stroke="#7c4316" stroke-opacity="${(c.op * 0.25).toFixed(3)}" stroke-width="${f(c.w * 0.5)}"/>` +
          `<ellipse rx="${f(c.rx)}" ry="${f(ry)}" fill="none" stroke="#7c4316" stroke-opacity="${c.op.toFixed(3)}" stroke-width="${f(c.w * 0.7)}"${dash}/>` +
          `<ellipse cx=".7" rx="${f(c.rx + 0.6)}" ry="${f(ry - 0.5)}" fill="none" stroke="#7c4316" stroke-opacity="${(c.op * 0.55).toFixed(3)}" stroke-width="${f(c.w * 0.45)}"${dash}/>` +
          drops + '</g></g>');
      });
    }

    if (p.sudd) {
      const e = p.sudd;
      const x = e.x * W;
      const crumbs = e.crumbs.map(([cx, cy, s]) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(s)}" ry="${f(s * 0.6)}" fill="#a08670" fill-opacity=".35"/>`).join('');
      mul.push(`<g transform="translate(${f(x)} ${f(e.y)}) rotate(${f(e.rot * 0.5)})">` +
        `<ellipse rx="${f(e.rx * 1.15)}" ry="${f(e.ry * 1.3)}" fill="#6f6c69" fill-opacity=".05" filter="url(#b4)"/>` +
        `<path d="${e.d}" fill="none" stroke="#6f6c69" stroke-opacity=".22" stroke-width="1.3" stroke-linecap="round"/>${crumbs}</g>`);
      top.push(`<ellipse transform="translate(${f(x)} ${f(e.y)}) rotate(${f(e.rot)})" rx="${f(e.rx)}" ry="${f(e.ry)}" fill="#f8f2e4" fill-opacity=".34" filter="url(#b3)"/>`);
    }

    if (p.ora) {
      const s = p.ora.s;
      const [fold, flap, sh] = {
        tl: [[[s, 0], [0, s]], [[s, 0], [0, s], [s, s]], [1.5, 2.5]],
        tr: [[[W - s, 0], [W, s]], [[W - s, 0], [W, s], [W - s, s]], [-1.5, 2.5]],
        br: [[[W, H - s], [W - s, H]], [[W, H - s], [W - s, H], [W - s, H - s]], [-1.5, -1.5]],
      }[p.ora.corner];
      const mid = [(fold[0][0] + fold[1][0]) / 2, (fold[0][1] + fold[1][1]) / 2];
      mul.push(`<path d="${line(flap)}Z" transform="translate(${sh[0]} ${sh[1]})" fill="#000" fill-opacity=".28" filter="url(#b)"/>`);
      td.push(`<linearGradient id="e" gradientUnits="userSpaceOnUse" x1="${f(mid[0])}" y1="${f(mid[1])}" x2="${f(flap[2][0])}" y2="${f(flap[2][1])}">` +
        '<stop offset="0" stop-color="#ebdfc6"/><stop offset="1" stop-color="#d8c6a2"/></linearGradient>');
      top.push(`<path d="${line(flap)}Z" fill="url(#e)"/><path d="${line(fold)}" stroke="#fff8ea" stroke-opacity=".85" stroke-width="1"/>`);
    }

    const svg = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${f(W)}" height="${f(H)}" viewBox="0 0 ${f(W)} ${f(H)}"><defs>${defs.join('')}</defs>${body.join('')}</svg>`;
    return { mul: svg(md, mul), top: svg(td, top) };
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

  const known = new WeakMap(); // papperet → { key, plan, w, h }
  const url = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

  function apply(el) {
    const kind = kindOf(el);
    const key = keyOf(el, kind);
    let st = known.get(el);
    if (!st || st.key !== key) {
      const match = kind === 'match';
      st = { key, plan: plan(kind, key), w: 0, h: 0 };
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
    if (!w || !h || (w === st.w && h === st.h)) return;
    st.w = w;
    st.h = h;
    const img = draw(st.plan, w, h);
    el.style.setProperty('--sl-mul', url(img.mul));
    el.style.setProperty('--sl-top', url(img.top));
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
