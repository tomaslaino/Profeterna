'use strict';

// ---------- utmärkelserna ----------
//
// Förstasidan: när omgången är färdigspelad delas utmärkelser ut efter hur
// var och en tippade – under Omgångens orakel och Ikaros, med en bild var.
// Titeln låter som en dygd; raden under säger hur det gick. tippare.js
// anropar Utmarkelser.live med omgångens poäng och kronan.js
// Utmarkelser.frozen med den senast avslutade omgången (data/tippare.json).
//
// Reglerna:
// - Var och en får högst en utmärkelse per omgång. Varje utmärkelse har en
//   lägsta nivå och kräver en ensam vinnare – bara Den konsekvente och Den
//   upptagne kan delas. Alla delas alltså inte ut varje gång.
// - Den som gav laget fler rätt än de andra (rätt tecken i matcher där
//   gängets kupong satt; utan kupong flest rätt) får Den oumbärlige eller en
//   annan positiv utmärkelse, aldrig en negativ.
// - Annars gäller ordningen i ORDER, ovanligast först: den första som
//   personen vann.
//
// Omgången i samma form oavsett källa:
//   { gang: [{id, name, none?}],
//     matches: [{id, match, kick, res, score, model, tips, coupon}] }
// res är '1', 'X' eller '2' (null = inte avgjord), score ställningen efter
// 90 minuter {home, away} eller null, model [1, X, 2] i hela procent eller
// null, tips {DL: '1X', …} och coupon gängets tecken i matchen eller null.
//
// Läses efter tippoang.js och kronan.js (KRONAN_KROPPAR: kropparna) och
// använder app.js och kupong.js (esc, fmtOdds, KP, teamsOf) när de finns.

window.Utmarkelser = (() => {
  const SIGNS = ['1', 'X', '2'];
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const odds = (prob) => {
    const o = 1 / prob;
    return typeof fmtOdds === 'function' ? fmtOdds(o) : o.toFixed(2).replace('.', ',');
  };
  const surname = (n) => {
    const s = String(n || '');
    const i = s.indexOf(' ');
    return i > 0 ? s.slice(i + 1) : s;
  };
  const signOf = (s) => (s.home > s.away ? '1' : s.home === s.away ? 'X' : '2');
  const count = (list, f) => list.filter(f).length;

  function parseScore(s) {
    if (s && typeof s === 'object') return Number.isFinite(s.home) && Number.isFinite(s.away) ? s : null;
    const m = String(s == null ? '' : s).match(/^\s*(\d+)\s*[-–]\s*(\d+)\s*$/);
    return m ? { home: Number(m[1]), away: Number(m[2]) } : null;
  }

  // Ett mål mer eller mindre för något av lagen hade gett ett av tecknen.
  function oneGoalAway(sign, s) {
    if (!s) return false;
    return [[s.home + 1, s.away], [s.home - 1, s.away], [s.home, s.away + 1], [s.home, s.away - 1]]
      .filter(([h, a]) => h >= 0 && a >= 0)
      .some(([h, a]) => sign.includes(signOf({ home: h, away: a })));
  }

  // "Leicester City" för 2 i Bromley – Leicester City, annars tecknet och matchen.
  function pickText(m, sign) {
    const [home, away] = String(m.match || '').split(' – ');
    if (sign === '1' && home && away) return home;
    if (sign === '2' && home && away) return away;
    if (sign === 'X') return `kryss i ${m.match}`;
    return `${sign} i ${m.match}`;
  }

  // ---------- var och ens tips ----------

  function profile(round, g) {
    const rivals = round.gang.filter((x) => x.id !== g.id && !x.none);
    const tips = [];
    for (const m of round.matches) {
      const sign = Tippoang.sign(m.tips && m.tips[g.id]);
      if (!sign || !m.res) continue;
      const prob = Tippoang.chance(sign, Tippoang.pct(sign, m.model));
      const hit = sign.includes(m.res);
      const others = rivals.map((x) => Tippoang.sign(m.tips && m.tips[x.id])).filter(Boolean);
      const score = m.score && signOf(m.score) === m.res ? m.score : null;
      const ms = Tippoang.modelSign(m.model);
      tips.push({
        m,
        sign,
        prob,
        hit,
        pts: Tippoang.points(hit, prob),
        alone: hit && others.length > 0 && others.every((s) => !s.includes(m.res)),
        near: !hit && oneGoalAway(sign, score),
        asModel: ms ? sign === ms : null,
        gave: hit && Boolean(m.coupon) && m.coupon.includes(m.res),
      });
    }
    return {
      g,
      tips,
      n: tips.length,
      ok: count(tips, (t) => t.hit),
      gave: count(tips, (t) => t.gave),
      pts: tips.reduce((a, t) => a + t.pts, 0),
    };
  }

  // ---------- utmärkelserna ----------
  //
  // value: hur mycket (högst vinner), null = inte aktuell. line: raden under
  // namnet. tip: mer när man pekar på raden. sign: tecknet i bilden.

  const longshot = (t) => t.prob < 1 / 3;
  const best = (list, f) => list.reduce((a, t) => (!a || f(t) > f(a) ? t : a), null);

  const AWARDS = {
    oumbarlig: {
      title: 'Den oumbärlige',
      tone: 'pos',
      // Lika många till laget: flest rätt, sedan poängen.
      value: (x, r) => { const v = r.coupon ? x.gave : x.ok; return v >= 2 ? v + x.ok / 100 + x.pts / 10000 : null; },
      line: (x, r) => (!r.coupon ? `${x.ok} rätt av ${x.n}`
        : x.gave === r.teamOk ? `Alla lagets ${r.teamOk} rätt` : `${x.gave} av lagets ${r.teamOk} rätt`),
    },
    missforstadd: {
      title: 'Den missförstådde',
      tone: 'pos',
      value: (x) => { const k = count(x.tips, (t) => t.alone); return k ? k + x.tips.filter((t) => t.alone).reduce((a, t) => a + t.pts, 0) / 100 : null; },
      line: (x) => {
        const list = x.tips.filter((t) => t.alone);
        return list.length === 1 ? `Ensam om rätt i ${list[0].m.match}` : `Ensam om rätt i ${list.length} matcher`;
      },
      sign: (x) => x.tips.find((t) => t.alone).m.res,
    },
    finansgeni: {
      title: 'Finansgeniet',
      tone: 'pos',
      value: (x) => { const t = best(x.tips.filter((y) => y.hit && longshot(y)), (y) => 1 / y.prob); return t ? 10 / t.prob : null; },
      line: (x) => { const t = best(x.tips.filter((y) => y.hit && longshot(y)), (y) => 1 / y.prob); return `10 kr blev ${Math.round(10 / t.prob)} kr`; },
      tip: (x) => { const t = best(x.tips.filter((y) => y.hit && longshot(y)), (y) => 1 / y.prob); return `${pickText(t.m, t.sign)} · odds ${odds(t.prob)}`; },
    },
    vaghalsig: {
      title: 'Den våghalsige',
      tone: 'pos',
      value: (x) => {
        if (x.n < 3) return null;
        const o = x.n / x.tips.reduce((a, t) => a + t.prob, 0);
        return o >= 2.6 ? o : null;
      },
      line: (x) => `Snittodds ${odds(x.tips.reduce((a, t) => a + t.prob, 0) / x.n)} · ${x.ok} rätt`,
    },
    diplomat: {
      title: 'Den diplomatiske',
      tone: 'pos',
      value: (x) => count(x.tips, (t) => t.sign.length === 3) || null,
      line: (x) => {
        const list = x.tips.filter((t) => t.sign.length === 3);
        return list.length === 1 ? `Tog inte ställning i ${list[0].m.match}` : `Tog inte ställning i ${list.length} matcher`;
      },
    },
    sjalvstandig: {
      title: 'Den självständige',
      tone: 'pos',
      value: (x) => {
        const list = x.tips.filter((t) => t.asModel != null);
        const k = count(list, (t) => t.asModel);
        return list.length >= 3 && k / list.length >= 0.75 ? k / list.length + k / 1000 : null;
      },
      line: (x) => {
        const list = x.tips.filter((t) => t.asModel != null);
        const k = count(list, (t) => t.asModel);
        return k === list.length ? `Som modellen i alla ${k}` : `Som modellen i ${k} av ${list.length}`;
      },
    },
    konfliktradd: {
      title: 'Den konflikträdde',
      tone: 'pos',
      value: (x) => { const k = count(x.tips, (t) => t.sign === 'X'); return k >= 2 && k * 3 >= x.n ? k : null; },
      line: (x) => `Kryss i ${count(x.tips, (t) => t.sign === 'X')} av ${x.n}`,
    },
    konsekvent: {
      title: 'Den konsekvente',
      tone: 'neg',
      shared: true,
      value: (x) => (x.n >= 3 && x.ok === 0 ? 1 : null),
      line: (x) => `0 av ${x.n}`,
    },
    upptagen: { title: 'Den upptagne', tone: 'neg', shared: true, line: () => 'Tippade inte' },
    storsint: {
      title: 'Den storsinte',
      tone: 'neg',
      line: (x, r) => (r.lastMany ? 'Ledde in i de sista matcherna' : 'Ledde till sista matchen'),
    },
    sjalvsaker: {
      title: 'Den självsäkre',
      tone: 'neg',
      value: (x) => { const t = best(x.tips.filter((y) => !y.hit), (y) => y.prob); return t && t.prob >= 0.6 ? t.prob : null; },
      line: (x) => { const t = best(x.tips.filter((y) => !y.hit), (y) => y.prob); return `Fel på ${pickText(t.m, t.sign)} · odds ${odds(t.prob)}`; },
    },
    oturs: {
      title: 'Otursfågeln',
      tone: 'neg',
      value: (x) => { const k = count(x.tips, (t) => t.near); return k >= 2 ? k : null; },
      line: (x) => `Ett mål ifrån i ${count(x.tips, (t) => t.near)} matcher`,
    },
    optimist: {
      title: 'Den optimistiske',
      tone: 'neg',
      value: (x) => {
        const list = x.tips.filter(longshot);
        return list.length >= 2 && !list.some((t) => t.hit) ? list.length : null;
      },
      line: (x) => `${count(x.tips, longshot)} skrällar, ingen satt`,
    },
    forutseende: {
      title: 'Den förutseende',
      tone: 'neg',
      value: (x) => { const k = count(x.tips, (t) => t.sign.length > 1 && !t.hit); return k >= 2 ? k : null; },
      line: (x) => {
        const g = count(x.tips, (t) => t.sign.length > 1);
        const k = count(x.tips, (t) => t.sign.length > 1 && !t.hit);
        return k < g ? `Garderade ${g}, fel i ${k}` : g === 2 ? 'Garderade 2, fel i båda' : `Garderade ${g}, fel i alla ${g}`;
      },
    },
  };

  // Ovanligast först: den som vinner flera får den som står först här.
  const ORDER = ['upptagen', 'oumbarlig', 'konsekvent', 'storsint', 'finansgeni', 'forutseende', 'optimist',
    'missforstadd', 'konfliktradd', 'vaghalsig', 'diplomat', 'sjalvsaker', 'oturs', 'sjalvstandig'];

  // Den storsinte: ledde ensam inför de sista matcherna men slutade inte
  // överst. Matcher med samma avspark räknas tillsammans.
  function leaderLost(round, list) {
    const kicks = [...new Set(round.matches.filter((m) => m.res && m.kick).map((m) => m.kick))].sort((a, b) => a - b);
    if (kicks.length < 2 || list.length < 2) return null;
    const until = kicks[kicks.length - 2];
    const at = (x) => {
      const t = x.tips.filter((y) => y.m.kick && y.m.kick <= until);
      return { ok: count(t, (y) => y.hit), pts: t.reduce((a, y) => a + y.pts, 0) };
    };
    const then = list.map((x) => ({ x, k: Tippoang.key(at(x)) })).sort((a, b) => b.k - a.k);
    if (then[0].k === then[1].k) return null;
    const top = Math.max(...list.map((x) => Tippoang.key(x)));
    if (Tippoang.key(then[0].x) >= top) return null;
    return { id: then[0].x.g.id, many: count(round.matches, (m) => m.kick === kicks[kicks.length - 1]) > 1 };
  }

  function compute(round) {
    if (!round || !Array.isArray(round.matches) || !Array.isArray(round.gang)) return [];
    const r = {
      coupon: round.matches.some((m) => m.coupon),
      teamOk: count(round.matches, (m) => m.res && m.coupon && m.coupon.includes(m.res)),
    };
    const list = round.gang.filter((g) => !g.none).map((g) => profile(round, g)).filter((x) => x.n);
    if (!list.length) return [];
    const won = {};
    for (const key of ORDER) {
      const a = AWARDS[key];
      won[key] = [];
      if (key === 'upptagen') {
        won[key] = round.gang.filter((g) => g.none).map((g) => g.id);
      } else if (key === 'storsint') {
        const lost = leaderLost(round, list);
        if (lost) { won[key] = [lost.id]; r.lastMany = lost.many; }
      } else if (list.length >= 2 || a.shared) {
        const scored = list.map((x) => ({ x, v: a.value(x, r) })).filter((s) => s.v != null);
        if (!scored.length) continue;
        const top = Math.max(...scored.map((s) => s.v));
        const tops = scored.filter((s) => Math.abs(s.v - top) < 1e-9);
        if (tops.length === 1 || a.shared) won[key] = tops.map((s) => s.x.g.id);
      }
    }
    // En per person. Den som gav laget fler rätt än de andra får bara en
    // positiv.
    const gave = (x) => (r.coupon ? x.gave : x.ok);
    const topGave = Math.max(...list.map(gave));
    const lowGave = Math.min(...list.map(gave));
    const chosen = new Map();
    for (const g of round.gang) {
      const mine = ORDER.filter((k) => won[k].includes(g.id));
      const x = list.find((y) => y.g.id === g.id);
      const key = x && topGave > lowGave && gave(x) === topGave ? mine.find((k) => AWARDS[k].tone === 'pos') : mine[0];
      if (!key) continue;
      if (!chosen.has(key)) chosen.set(key, []);
      chosen.get(key).push({ g, x });
    }
    return ORDER.filter((k) => chosen.has(k)).map((key) => {
      const a = AWARDS[key];
      const who = chosen.get(key);
      const x = who[0].x;
      return {
        key,
        title: a.title,
        tone: a.tone,
        people: who.map((w) => ({ id: w.g.id, name: w.g.name })),
        line: a.line(x, r),
        tip: a.tip ? a.tip(x, r) : '',
        sign: a.sign ? a.sign(x, r) : '',
      };
    });
  }

  // ---------- omgången ur sidan och ur säsongen ----------

  // Gängets kupong för omgången: den sparade kupongen som har flest av
  // omgångens matcher (minst hälften) – tecknen per matchid, eller null.
  function couponFor(ids) {
    const list = (typeof KP !== 'undefined' && KP.data && KP.data.coupons) || [];
    let hit = null;
    let most = 0;
    for (const c of list) {
      const k = count(c.matches || [], (x) => ids.includes(String(x.id)));
      if (k > most) { hit = c; most = k; }
    }
    return hit && most * 2 >= ids.length ? new Map(hit.matches.map((x) => [String(x.id), Tippoang.sign(x.sign)])) : null;
  }

  function withCoupon(round) {
    const c = couponFor(round.matches.map((m) => m.id));
    if (c) for (const m of round.matches) m.coupon = c.get(m.id) || null;
    return round;
  }

  // Omgången ur GET …/samtal med tpScore (tippare.js), när den är klar.
  function fromLive(round, s) {
    const tips = round.tips || {};
    const matches = round.matcher.map((x, i) => {
      const st = s.status[i];
      if (!st || st.state === 'off' || st.state === 'missing') return null;
      const m = st.m || {};
      const t = {};
      for (const p of s.people) {
        const sign = Tippoang.sign(tips[p.id] && tips[p.id].tecken && tips[p.id].tecken[x.id]);
        if (sign) t[p.id] = sign;
      }
      return {
        id: String(x.id),
        match: typeof teamsOf === 'function' ? teamsOf(st) : x.match,
        kick: st.kick || Date.parse(x.avspark) || null,
        res: st.res != null ? SIGNS[st.res] : null,
        score: parseScore(m.score90 || (st.extra ? null : st.score)),
        model: st.pr || null,
        tips: t,
      };
    }).filter(Boolean);
    return withCoupon({ gang: s.people.map((p) => ({ id: p.id, name: p.name, none: Boolean(p.none) })), matches });
  }

  // En avslutad omgång ur data/tippare.json (src/tippare.js).
  function fromFrozen(r) {
    const matches = (r.matches || []).filter((m) => !m.off).map((m) => ({
      id: String(m.id),
      match: m.match,
      kick: Date.parse(m.kickoff) || null,
      res: m.res || null,
      score: parseScore(m.score),
      model: Array.isArray(m.model) ? m.model : null,
      tips: m.tips || {},
    }));
    return withCoupon({ gang: (r.people || []).map((p) => ({ id: p.id, name: p.name || p.id, none: Boolean(p.none) })), matches });
  }

  // ---------- bilderna ----------
  //
  // Kropparna är kröningens (KRONAN_KROPPAR i kronan.js): --hx är huvudets
  // mitt i procent av bildens bredd, --sy axlarnas höjd. Huvudet går från
  // bildens topp till ungefär 13 % av höjden. Saker på kroppen (hjälm,
  // solglasögon, krans) läggs i .ut-fig, resten i scenen.

  const HELMET = '<svg class="ut-on ut-helmet" viewBox="0 0 40 28" aria-hidden="true">' +
    '<path d="M5 20C5 9 12 3 20.5 3S36 9 36 20z" fill="#e8492f"/>' +
    '<path d="M2 19.5h37a2 2 0 0 1 0 4H2a2 2 0 0 1 0-4z" fill="#b8341f"/>' +
    '<path d="M11 8.5c2.5-2.6 6-3.8 9.5-3.8" stroke="#ffb7a3" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="23" cy="13" rx="5.5" ry="3" fill="#f6efe2" opacity="0.85"/>' +
    '<path d="M7 23.5l2.5 4.5M34 23.5l-2.5 4.5" stroke="#2a2420" stroke-width="1.2"/></svg>';

  const glasses = (id) => '<svg class="ut-on ut-shades" viewBox="0 0 40 13" aria-hidden="true">' +
    `<defs><clipPath id="${id}"><path d="M2 2h15v3.5c0 3.5-3 6-7.5 6S2 9 2 5.5zM23 2h15v3.5c0 3.5-3 6-7.5 6S23 9 23 5.5z"/></clipPath></defs>` +
    '<path d="M0.5 1.5h39" stroke="#c9973f" stroke-width="1.2"/>' +
    '<path d="M2 2h15v3.5c0 3.5-3 6-7.5 6S2 9 2 5.5zM23 2h15v3.5c0 3.5-3 6-7.5 6S23 9 23 5.5z" fill="#0d0c0b" stroke="#c9973f" stroke-width="0.7"/>' +
    `<g clip-path="url(#${id})"><rect class="ut-gleam" x="-14" y="-4" width="5" height="22" fill="#fff" opacity="0.75" transform="rotate(25)"/></g></svg>`;

  // Lagerkrans sedd framifrån: två kvistar från pannan ut och upp åt
  // sidorna, med blad parvis längs kvisten.
  const WREATH = (() => {
    const r1 = (v) => Math.round(v * 10) / 10;
    let stems = '';
    let leaves = '';
    for (const side of [-1, 1]) {
      // Kvadratisk kurva från mitten (20, 19) via (20 ± 14, 20) till (20 ± 18, 5).
      const P = [[20, 19], [20 + side * 14, 20], [20 + side * 18, 5]];
      const at = (t) => [0, 1].map((i) => (1 - t) ** 2 * P[0][i] + 2 * (1 - t) * t * P[1][i] + t * t * P[2][i]);
      const dir = (t) => [0, 1].map((i) => 2 * (1 - t) * (P[1][i] - P[0][i]) + 2 * t * (P[2][i] - P[1][i]));
      stems += `<path d="M${P[0].join(' ')}Q${P[1].join(' ')} ${P[2].join(' ')}"/>`;
      for (let i = 1; i <= 6; i++) {
        const t = i / 6.4;
        const [x, y] = at(t);
        const [dx, dy] = dir(t);
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        for (const turn of i === 6 ? [0] : [-38, 38]) {
          const a = ang + turn;
          const len = 3.4 - i * 0.18;
          const cx = x + Math.cos((a * Math.PI) / 180) * len * 0.8;
          const cy = y + Math.sin((a * Math.PI) / 180) * len * 0.8;
          leaves += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(len)}" ry="${r1(len * 0.38)}" transform="rotate(${r1(a)} ${r1(cx)} ${r1(cy)})"/>`;
        }
      }
    }
    return '<svg class="ut-on ut-wreath" viewBox="0 0 40 24" aria-hidden="true">' +
      `<g fill="none" stroke="#9c7430" stroke-width="0.8">${stems}</g>` +
      `<g fill="#e6c27a" stroke="#9c7430" stroke-width="0.35">${leaves}</g></svg>`;
  })();

  const BUBBLE = (sign) => `<span class="ut-on ut-bubble">${esc2(sign || '!')}</span>`;

  const FLAG = '<div class="ut-on ut-flag"><i class="ut-pole"></i>' +
    '<svg class="ut-cloth" viewBox="0 0 40 26" aria-hidden="true"><path d="M0 2C10-1 18 5 28 2s10-1 12 0v20c-10 3-18-3-28 0S2 23 0 22z" fill="#f6f1e6"/>' +
    '<path d="M0 8c10-3 18 3 28 0s10-1 12 0" stroke="#d8cdb8" stroke-width="0.8" fill="none"/></svg></div>';

  const DOVE = '<svg class="ut-dove" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6Q6 0 12 5Q18 0 24 6Q18 4 12 9Q6 4 0 6z" fill="#f3ead9"/></svg>';

  const PUPPET = '<div class="ut-on ut-ctrl"><i class="ut-bar"></i><i class="ut-stick"></i><b>M</b></div>' +
    '<i class="ut-str c"></i><i class="ut-str l"></i><i class="ut-str r"></i>';

  const CLOUD = '<div class="ut-on ut-cloud">' +
    '<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M12 28h36a10 10 0 0 0 1-20 14 14 0 0 0-27-3 9 9 0 0 0-10 23z" fill="#474b52"/>' +
    '<path d="M18 12a9 9 0 0 1 14-5" stroke="#6b707a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' +
    '<span class="ut-drops"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>' +
    '<div class="ut-on ut-orbit"><svg class="ut-crow" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 5Q6 0 12 5Q18 0 24 5Q18 3 12 9Q6 3 0 5z" fill="#0c0b0a"/></svg></div>';

  const BALLOONS = (() => {
    const one = (cls, cx, cy, fill) => `<g class="ut-b ${cls}">` +
      `<path d="M${cx} ${cy + 10}Q${cx - 2} ${(cy + 98) / 2} 6 88" stroke="#d0c6b6" stroke-width="0.6" fill="none"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="7.5" ry="9.5" fill="${fill}"/>` +
      `<path d="M${cx - 1.5} ${cy + 11}l1.5-2 1.5 2z" fill="${fill}"/>` +
      `<ellipse cx="${cx - 3}" cy="${cy - 4}" rx="1.8" ry="3" fill="#fff" opacity="0.35"/></g>` +
      `<g class="ut-pop ${cls}" stroke="#f6efe2" stroke-width="1" stroke-linecap="round"><path d="M${cx} ${cy - 13}v4M${cx} ${cy + 9}v4M${cx - 12} ${cy}h4M${cx + 8} ${cy}h4M${cx - 8} ${cy - 9}l3 3M${cx + 5} ${cy + 6}l3 3M${cx + 8} ${cy - 9}l-3 3M${cx - 5} ${cy + 6}l-3 3"/></g>`;
    return '<svg class="ut-on ut-balloons" viewBox="0 0 44 90" aria-hidden="true">' +
      one('b1', 10, 14, '#e0485e') + one('b2', 30, 10, '#4d8ff0') + one('b3', 22, 30, '#e3a33d') + '</svg>';
  })();

  const UMBRELLA = '<svg class="ut-on ut-umbrella" viewBox="0 0 60 50" aria-hidden="true">' +
    '<path d="M30 22V45q0 4-4 4t-3.5-3.5" stroke="#3a2c20" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M2 24Q30-8 58 24Q51 19 44 24Q37 19 30 24Q23 19 16 24Q9 19 2 24z" fill="#c8643a"/>' +
    '<path d="M30 1.5Q20 8 16 24M30 1.5Q40 8 44 24" stroke="#8f3f1f" stroke-width="0.8" fill="none"/></svg>';

  const BUOY = '<svg class="ut-on ut-buoy" viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="14.5" fill="none" stroke="#f6efe2" stroke-width="8"/>' +
    '<circle cx="20" cy="20" r="14.5" fill="none" stroke="#d8432f" stroke-width="8" stroke-dasharray="11.39 11.39" transform="rotate(-20 20 20)"/>' +
    '<circle cx="20" cy="20" r="18.5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="0.6"/></svg>';

  // Dörren har ett hål där det frostade glaset sitter, så att kroppen syns
  // suddig bakom.
  const DOOR = '<i class="ut-on ut-door"></i><i class="ut-on ut-glass"></i><i class="ut-on ut-plo"></i>' +
    '<i class="ut-on ut-knob"></i><span class="ut-on ut-hang">Stör ej</span>';

  // Granskog på en ås, som vid forsen i Georgien.
  const HILLS = (() => {
    const tops = [8, 14, 6, 18, 11, 20, 9, 16, 12, 22, 7, 15, 19, 10, 17, 13, 21, 8, 14, 18];
    let d = 'M0 60V34';
    tops.forEach((h, i) => {
      const x = i * 10;
      d += ` L${x + 3} ${34 - h * 0.5} L${x + 5} ${30 - h} L${x + 7} ${34 - h * 0.5} L${x + 10} ${34 - (i % 3)}`;
    });
    return '<svg class="ut-hills" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 60V40Q50 22 100 34T200 30V60z" fill="#2c4a33"/>' +
      `<path d="${d} V60z" fill="#1d3626"/></svg>`;
  })();

  const RIVER = '<svg class="ut-river" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">' +
    '<path class="a" d="M0 12q25-8 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V40H0z"/>' +
    '<path class="b" d="M0 21q25-8 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V40H0z"/></svg>';

  const n6 = '<i></i><i></i><i></i><i></i><i></i><i></i>';

  // back: bakom kropparna, on: på varje kropp, front: framför.
  function scene(a, idx) {
    switch (a.key) {
      case 'oumbarlig': return {
        back: '<i class="ut-col l"></i><i class="ut-col r"></i>',
        front: `<div class="ut-beam"></div><div class="ut-dust">${n6}</div><div class="ut-floor"></div>`,
      };
      case 'missforstadd': return { back: '<i class="ut-cone"></i><i class="ut-pool"></i>', on: BUBBLE(a.sign) };
      case 'finansgeni': return {
        back: '<i class="ut-glow"></i><i class="ut-stack"></i>',
        front: `<div class="ut-coins">${n6}<i></i><i></i></div>`,
      };
      case 'vaghalsig': return { back: HILLS, on: HELMET, front: `${RIVER}<div class="ut-spray">${n6}</div>` };
      case 'diplomat': return { back: DOVE, on: FLAG };
      case 'sjalvstandig': return { back: '<i class="ut-curtain l"></i><i class="ut-curtain r"></i>', on: PUPPET, front: '<div class="ut-boards"></div>' };
      case 'konfliktradd': return { front: '<div class="ut-crate"><i></i><i></i></div>' };
      case 'konsekvent': return { back: '<span class="ut-zero" aria-hidden="true">0</span>', front: '<div class="ut-floor"></div>' };
      case 'upptagen': return { on: DOOR };
      case 'storsint': return { back: '<i class="ut-glow"></i>', on: WREATH, front: '<div class="ut-floor"></div>' };
      case 'sjalvsaker': return {
        back: '<i class="ut-sun"></i>',
        on: glasses(`ut-lens-${idx}`),
        front: '<div class="ut-ground"></div><svg class="ut-crack" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6L14 5L21 8L32 3L41 7L54 2L62 7L73 4L83 8L100 5"/></svg>',
      };
      case 'oturs': return { back: '<i class="ut-sun"></i>', on: CLOUD, front: '<div class="ut-grass"></div>' };
      case 'optimist': return { back: '<i class="ut-puff a"></i><i class="ut-puff b"></i>', on: BALLOONS, front: '<div class="ut-grass"></div>' };
      case 'forutseende': return { on: UMBRELLA + BUOY, front: `<div class="ut-slant">${n6}${n6}</div>` };
      default: return {};
    }
  }

  // Mer om kropparna, i procent av bildens bredd och höjd: vänstra handen
  // sett framifrån (lx, ly – flaggan och ballongerna), ögonen (ey) och midjan
  // (wy) – och vem som redan har hjälm på sig.
  const KROPP = {
    DL: { lx: 4, ly: 38, ey: 9.5, wy: 46, hjalm: true },
    DT: { lx: 22, ly: 28, ey: 6.5, wy: 52 },
    DJ: { lx: 4, ly: 17, ey: 10.5, wy: 49, hjalm: true },
  };
  const BASE = { lx: 22, ly: 50, ey: 7, wy: 50 };

  function fig(p, on) {
    const k = typeof KRONAN_KROPPAR !== 'undefined' ? KRONAN_KROPPAR[p.id] : null;
    const b = KROPP[p.id] || BASE;
    const more = `--lx:${b.lx}%;--ly:${b.ly}%;--ey:${b.ey}%;--wy:${b.wy}%`;
    const props = b.hjalm ? on.replace(HELMET, '') : on;
    if (!k) return `<div class="ut-fig ut-noimg" style="--hx:50%;--sy:30%;${more}"><span class="ut-ini">${esc2(p.id)}</span>${props}</div>`;
    return `<div class="ut-fig" style="--hx:${k.hx}%;--sy:${k.sy}%;${more}"><img src="${k.bild}" alt="" draggable="false">${props}</div>`;
  }

  function panel(a, idx) {
    const sc = scene(a, idx);
    const figs = a.people.map((p) => fig(p, sc.on || '')).join('');
    const names = a.people.map((p) => esc2(surname(p.name || p.id))).join('<span class="ut-amp"> &amp; </span>');
    return `<figure class="ut-panel ut-${a.key} ut-${a.tone}" aria-label="${esc2(a.title)}: ${esc2(a.people.map((p) => p.name).join(' och '))}">` +
      `<div class="ut-scene">${sc.back || ''}<div class="ut-figs n${a.people.length}">${figs}</div>${sc.front || ''}</div>` +
      `<figcaption><span class="ut-title">${esc2(a.title)}</span><b class="ut-name">${names}</b>` +
      `<span class="ut-line"${a.tip ? ` title="${esc2(a.tip)}"` : ''}>${esc2(a.line)}</span></figcaption></figure>`;
  }

  function html(list) {
    if (!list || !list.length) return '';
    return `<div class="ut-row n${list.length}">${list.map(panel).join('')}</div>`;
  }

  return {
    compute,
    fromLive,
    fromFrozen,
    html,
    // Omgången som pågår (tippare.js), när den är färdigspelad.
    live: (round, s) => (s && s.done ? html(compute(fromLive(round, s))) : ''),
    // Den senast avslutade omgången (kronan.js, Kronan.reigning).
    frozen: (r) => html(compute(fromFrozen(r))),
  };
})();
