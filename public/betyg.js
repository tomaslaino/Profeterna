'use strict';

// ---------- betyget ----------
//
// Olympen (kampen.js): gängets betyg för säsongen, skrivet på ett papper som
// kupongen (papper.css) – sex ämnen med A–F i rödpenna, meritvärdet och ett
// omdöme var. Klassföreståndaren är Modellen. Betygen är preliminära tills
// säsongen är slut (1 juni); sedan är det Slutbetyg.
//
// Ämnena räknas på alla avgjorda tips i Olympens omgångar (samma som
// ställningen, med omgången som pågår):
// - Träffsäkerhet: andel rätt.
// - Skarpsinne: poängen i Olympen per match – fler rätt än modellen väntade.
// - Mod: snittoddset för tipsen (modellens odds före avspark).
// - Lagkänsla: andel av lagets rätt som man själv hade – lagets rätt är de
//   matcher där gängets kupong satt, och utan kupong de där någon i gänget
//   hade rätt. Bara matcher som man tippade räknas.
// - Hushållning: spelkassan, 10 kr per match till modellens odds.
// - Närvaro: omgångar som man tippade.
// Gränserna (steps) är lägsta värde för A, B, C, D och E – under E blir det F.
// Meritvärdet är som i skolan: A 20, B 17,5, C 15, D 12,5, E 10 och F 0.
//
// Läses efter tippoang.js och papper.js och använder app.js och kupong.js
// (esc, fmtOdds, kpNum, KP) när de finns.

window.Betyg = (() => {
  const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const MERIT = { A: 20, B: 17.5, C: 15, D: 12.5, E: 10, F: 0 };
  const INSATS = 10;
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const num1 = (x) => x.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const signed = (x) => {
    const v = Math.round(x * 10) / 10;
    return v > 0 ? `+${num1(v)}` : v < 0 ? `−${num1(-v)}` : num1(0);
  };
  const odds = (o) => (typeof fmtOdds === 'function' ? fmtOdds(o) : o.toFixed(2).replace('.', ','));
  const kr = (x) => {
    const v = Math.round(x);
    const t = Math.abs(v).toLocaleString('sv-SE');
    return v > 0 ? `+${t} kr` : v < 0 ? `−${t} kr` : '0 kr';
  };
  const merit = (x) => x.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
  const surname = (n) => {
    const s = String(n || '');
    const i = s.indexOf(' ');
    return i > 0 ? s.slice(i + 1) : s;
  };
  const took = (p) => p && !p.none && p.n > 0;

  // ---------- ämnena ----------
  //
  // value: talet som betygssätts, text: det som står under betyget, at:
  // gränsen skriven som texten (till rutans tooltip). Med for ett tal per
  // person ur stats.

  const SUBJECTS = [
    {
      key: 'traff',
      name: 'Träffsäkerhet',
      what: 'Andel rätt tips',
      steps: [0.6, 0.54, 0.48, 0.43, 0.38],
      value: (s) => s.ok / s.n,
      text: (s) => `${Math.round((s.ok / s.n) * 100)} %`,
      at: (v) => `${Math.round(v * 100)} %`,
    },
    {
      key: 'skarp',
      name: 'Skarpsinne',
      what: 'Poängen i Olympen: fler rätt än modellen väntade sig',
      steps: [0.06, 0.03, 0, -0.03, -0.06],
      value: (s) => s.pts / s.n,
      text: (s) => signed(s.pts),
      at: (v, s) => signed(v * s.n),
    },
    {
      key: 'mod',
      name: 'Mod',
      what: 'Snittoddset för tipsen',
      steps: [2.8, 2.5, 2.2, 1.95, 1.7],
      value: (s) => s.n / s.prob,
      text: (s) => odds(s.n / s.prob),
      at: (v) => odds(v),
    },
    {
      key: 'lag',
      name: 'Lagkänsla',
      what: 'Andel av lagets rätt som du också hade',
      steps: [0.9, 0.82, 0.74, 0.66, 0.58],
      value: (s) => (s.team ? s.gave / s.team : null),
      text: (s) => `${s.gave} av ${s.team}`,
      at: (v, s) => `${Math.ceil(v * s.team - 1e-9)} av ${s.team}`,
    },
    {
      key: 'kassa',
      name: 'Hushållning',
      what: `Spelkassan: ${INSATS} kr per match till modellens odds`,
      steps: [0.15, 0.07, 0, -0.07, -0.15],
      value: (s) => (s.back - s.n * INSATS) / (s.n * INSATS),
      text: (s) => kr(s.back - s.n * INSATS),
      at: (v, s) => kr(v * s.n * INSATS),
    },
    {
      key: 'narvaro',
      name: 'Närvaro',
      what: 'Omgångar som du tippade',
      steps: [1, 0.95, 0.9, 0.8, 0.7],
      value: (s) => s.came / s.rounds,
      text: (s) => `${s.came} av ${s.rounds}`,
      at: (v, s) => `${Math.ceil(v * s.rounds - 1e-9)} av ${s.rounds}`,
    },
  ];

  const gradeOf = (v, steps) => GRADES[steps.findIndex((x) => v >= x - 1e-9)] || 'F';

  // ---------- omdömet ----------
  //
  // Ett bra ämne (C eller bättre) och ett dåligt (D eller sämre), som en
  // lärare skulle skriva det.

  const PRAISE = {
    skarp: 'Ser det som modellen missar',
    lag: 'En god kamrat',
    mod: 'Räcker gärna upp handen',
    kassa: 'Sköter sin ekonomi',
    traff: 'Har ofta rätt svar',
    narvaro: 'Kommer alltid i tid',
  };
  const BLAME = {
    narvaro: 'har hög frånvaro',
    traff: 'behöver träna på att få rätt',
    skarp: 'behöver lyssna mer på modellen',
    mod: 'räcker sällan upp handen',
    lag: 'arbetar helst på egen hand',
    kassa: 'behöver se över sin ekonomi',
  };

  // Varje ämne helst bara i ett omdöme. Den som har färst ämnen att välja
  // bland väljer först, sedan går ämnet till den med bäst betyg i det (eller
  // sämst, för kritiken) och vid lika den med högst meritvärde. Den som blir
  // utan får sitt eget ämne ändå.
  function choose(people, phrases, ok, rank) {
    const pairs = [];
    for (const p of people) {
      for (const k of Object.keys(phrases)) {
        const x = p.grades[k];
        if (x && ok(GRADES.indexOf(x.grade))) pairs.push({ p, k, r: rank(GRADES.indexOf(x.grade)) });
      }
    }
    const order = Object.keys(phrases);
    const many = (p) => pairs.filter((x) => x.p === p).length;
    pairs.sort((a, b) => many(a.p) - many(b.p) || a.r - b.r || b.p.merit - a.p.merit || order.indexOf(a.k) - order.indexOf(b.k));
    const out = new Map();
    const used = new Set();
    for (const x of pairs) {
      if (out.has(x.p) || used.has(x.k)) continue;
      out.set(x.p, x.k);
      used.add(x.k);
    }
    for (const x of pairs) if (!out.has(x.p)) out.set(x.p, x.k);
    return out;
  }

  function omdomen(people) {
    const good = choose(people, PRAISE, (i) => i <= 2, (i) => i);
    const bad = choose(people, BLAME, (i) => i >= 3, (i) => -i);
    for (const p of people) {
      const g = good.get(p);
      const b = bad.get(p);
      p.omdome = g && b ? `${PRAISE[g]}, men ${BLAME[b]}.`
        : g ? `${PRAISE[g]}. Fortsätt så!`
        : b ? `Visar god vilja, men ${BLAME[b]}.`
        : 'Visar god vilja.';
    }
  }

  // ---------- underlaget ----------

  // Gängets kupong för omgången: den sparade kupongen med flest av
  // omgångens matcher (minst hälften) – tecknen per matchid, eller null.
  // Samma val som utmärkelserna (utmarkelser.js).
  function couponFor(ids) {
    const list = (typeof KP !== 'undefined' && KP.data && KP.data.coupons) || [];
    let hit = null;
    let most = 0;
    for (const c of list) {
      const k = (c.matches || []).filter((x) => ids.includes(String(x.id))).length;
      if (k > most) { hit = c; most = k; }
    }
    return hit && most * 2 >= ids.length ? new Map(hit.matches.map((x) => [String(x.id), Tippoang.sign(x.sign)])) : null;
  }

  // Talen per person ur omgångarna (kampen.js: kampRounds).
  function stats(rounds, gang) {
    const by = new Map(gang.map((g) => [g.id, { g, n: 0, ok: 0, pts: 0, prob: 0, back: 0, team: 0, gave: 0, came: 0 }]));
    let counted = 0;
    let matches = 0;
    let last = null;
    for (const r of rounds) {
      const settled = (r.matches || []).filter((m) => m.res);
      if (!settled.length) continue;
      counted += 1;
      matches += settled.length;
      const coupon = couponFor((r.matches || []).map((m) => String(m.id)));
      for (const m of settled) {
        if (m.kickoff && (!last || m.kickoff > last)) last = m.kickoff;
        const tips = Object.entries(m.tips || {}).map(([id, t]) => [id, Tippoang.sign(t)]).filter(([, t]) => t);
        const teamOk = coupon
          ? Boolean(coupon.get(String(m.id)) && coupon.get(String(m.id)).includes(m.res))
          : tips.some(([, t]) => t.includes(m.res));
        for (const [id, sign] of tips) {
          const s = by.get(id);
          if (!s) continue;
          const prob = Tippoang.chance(sign, Tippoang.pct(sign, m.model || null));
          const hit = sign.includes(m.res);
          s.n += 1;
          s.prob += prob;
          if (hit) { s.ok += 1; s.back += INSATS / prob; }
          s.pts += Tippoang.points(hit, prob);
          if (teamOk) { s.team += 1; if (hit) s.gave += 1; }
        }
      }
      for (const s of by.values()) {
        if (took((r.people || []).find((p) => p.id === s.g.id))) s.came += 1;
      }
    }
    return { people: [...by.values()].filter((s) => s.n), rounds: counted, matches, last };
  }

  // Säsongen som omgången hör till: 2026/27 från juli till juni.
  function seasonOf(iso) {
    const d = iso ? new Date(iso) : new Date();
    const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return { label: `${y}/${String((y + 1) % 100).padStart(2, '0')}`, end: new Date(y + 1, 5, 1).getTime() };
  }

  function compute(rounds, gang, now = Date.now()) {
    const st = stats(rounds, gang);
    if (!st.people.length) return null;
    const people = st.people.map((s) => {
      s.rounds = st.rounds;
      const grades = {};
      for (const sub of SUBJECTS) {
        const v = sub.value(s);
        if (v == null || !Number.isFinite(v)) continue;
        const grade = gradeOf(v, sub.steps);
        const i = GRADES.indexOf(grade);
        const next = i > 0 ? `${GRADES[i - 1]} från ${sub.at(sub.steps[i - 1], s)}` : '';
        grades[sub.key] = { grade, text: sub.text(s), title: `${sub.name} ${grade} · ${sub.text(s)}${next ? ` · ${next}` : ''}` };
      }
      const score = Object.values(grades).reduce((a, x) => a + MERIT[x.grade], 0);
      return { g: s.g, grades, merit: score, max: Object.keys(grades).length * 20 };
    });
    omdomen(people);
    const season = seasonOf(st.last);
    return { season: season.label, final: now >= season.end, rounds: st.rounds, matches: st.matches, last: st.last, people };
  }

  // ---------- papperet ----------

  const ring = (key, cls) => (window.Papper && Papper.ring ? Papper.ring(key, cls, 24) : '');

  function face(g) {
    const style = `style="--bg-c:${g.deep || g.color || '#9d9383'}"`;
    return g.img
      ? `<span class="bg-face" ${style}><img src="${esc2(g.img)}" alt="" width="40" height="40" loading="lazy" draggable="false"></span>`
      : `<span class="bg-face bg-face-txt" ${style}>${esc2(g.id)}</span>`;
  }

  function html(rounds, gang, now = Date.now()) {
    const b = compute(rounds, gang, now);
    if (!b) return '';
    const cols = b.people;
    const top = Math.max(...cols.map((p) => p.merit));
    const head = cols.map((p) => `<th scope="col" title="${esc2(p.g.name)}">${face(p.g)}<span>${esc2(surname(p.g.name))}</span></th>`).join('');
    const body = SUBJECTS.filter((sub) => cols.some((p) => p.grades[sub.key])).map((sub) => {
      const cells = cols.map((p) => {
        const x = p.grades[sub.key];
        if (!x) return '<td class="bg-none">–</td>';
        return `<td title="${esc2(x.title)}"><span class="bg-grade g-${x.grade}">${x.grade}${x.grade === 'A' ? ring(`betyg-${sub.key}-${p.g.id}`, 'bg-ring') : ''}</span>` +
          `<small>${esc2(x.text)}</small></td>`;
      }).join('');
      return `<tr><th scope="row" title="${esc2(sub.what)}">${esc2(sub.name)}</th>${cells}</tr>`;
    }).join('');
    const foot = cols.map((p) => `<td><b class="bg-merit${p.merit === top && cols.length > 1 ? ' is-top' : ''}">${merit(p.merit)}` +
      `${p.merit === top && cols.length > 1 ? ring(`betyg-merit-${p.g.id}`, 'bg-ring bg-ring-merit') : ''}</b></td>`).join('');
    const max = Math.max(...cols.map((p) => p.max));
    const notes = cols.map((p) => `<li>${face(p.g)}<span class="bg-who">${esc2(surname(p.g.name))}</span><span class="bg-note">${esc2(p.omdome)}</span></li>`).join('');
    const when = b.last ? new Date(b.last) : new Date(now);
    const date = when.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
    return '<div class="pp-wrap bg-wrap"><article class="pp bg" aria-label="Betyg för säsongen">' +
      '<div class="pp-head">' +
      '<p class="pp-brand"><img src="logo.svg" alt="" width="20" height="20">Matchfixarna<span>Betyg</span></p>' +
      `<h2 class="pp-title">Säsongen ${esc2(b.season)}</h2>` +
      '<p class="pp-meta">' +
      `<span class="pp-name">Efter ${b.rounds} ${b.rounds === 1 ? 'omgång' : 'omgångar'}</span>` +
      `<span>${b.matches} ${b.matches === 1 ? 'match' : 'matcher'}</span>` +
      `<span class="pp-stamp${b.final ? '' : ' wait'}">${b.final ? 'Slutbetyg' : 'Preliminärt'}</span></p></div>` +
      '<div class="pp-band" aria-hidden="true"></div>' +
      `<div class="bg-scroll"><table class="bg-table"><thead><tr><th scope="col">Ämne</th>${head}</tr></thead>` +
      `<tbody>${body}</tbody>` +
      `<tfoot><tr><th scope="row" title="Summan av betygen: A 20, B 17,5, C 15, D 12,5, E 10, F 0 – högst ${max}">Meritvärde</th>${foot}</tr></tfoot></table></div>` +
      `<p class="bg-label">Omdöme</p><ul class="bg-notes">${notes}</ul>` +
      '<div class="bg-fine">' +
      `<span class="bg-field"><span>Ort och datum</span><b>Aten, ${esc2(date)}</b></span>` +
      '<span class="bg-field bg-sign"><span>Klassföreståndare</span><b class="bg-sig">Modellen</b></span>' +
      '</div></article></div>';
  }

  return { SUBJECTS, compute, html };
})();
