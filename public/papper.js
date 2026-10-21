'use strict';

// ---------- papperskupongen ----------
//
// Omgångens kupong (Kupong → Omgången) ritad som en ifylld tipskupong på
// papper: tryckta rader med matcherna och rutorna 1 X 2, gängets tecken som
// kryss med kulspetspenna, utfallet inringat (grönt rätt, rött fel) och
// ställningen skriven för hand. En match som pågår är överstruken med
// märkpenna och står i blyerts tills den är slut. Antalet rätt står som ett
// betyg i hörnet. Under rutorna modellens odds före avspark, modellens tips i
// fetstil.
//
// Pennstrecken ritas med ett slumptal som utgår från matchen och tecknet, så
// att varje kryss ser handritat ut men ser likadant ut varje gång sidan ritas.
//
// Längst ner kupongen som växer fram medan man väljer matcher (builder, slip).
// Kryssen, ringarna, bockarna, betyget, ställningen och foten (cross, ring,
// tick, grade, result, foot) ritar också omgångens kupong med allas
// porträtt i rutorna i samtal.js.
//
// Läses efter kupong.js och använder dess hjälpare (SIGNS, NOTE_MAX, rowClass,
// teamsOf, scoreText, kpNum, dateRange, liveLine, fWeekdayTime) och app.js
// (esc, fTime, fDay, dayKey, cap, compOf, pctOdds, listTeam).

(function () {
  // Slumptal ur en nyckel (mulberry32 med FNV-hash som frö).
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
  const jit = (r, n) => (r() - 0.5) * 2 * n;
  const f = (x) => x.toFixed(1);

  // Ett streck som böjer sig lite på mitten.
  function stroke(r, x1, y1, x2, y2, wob = 1.6, bend = 2) {
    const a = [x1 + jit(r, wob), y1 + jit(r, wob)];
    const b = [x2 + jit(r, wob), y2 + jit(r, wob)];
    const c = [(a[0] + b[0]) / 2 + jit(r, bend), (a[1] + b[1]) / 2 + jit(r, bend)];
    return `M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
  }

  // Mjuk kurva genom punkterna (Catmull-Rom som Bézier).
  function smooth(p) {
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
        `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }

  // Krysset i en ruta (36 × 36, rutan i mitten).
  function cross(key) {
    const r = rng(`x${key}`);
    return '<svg class="pp-x" viewBox="0 0 36 36" aria-hidden="true">' +
      `<path d="${stroke(r, 8, 8, 28, 28)}${stroke(r, 27.5, 8.5, 8.5, 27.5)}"/></svg>`;
  }

  // En ring runt rutan, dragen ett drygt varv så att den inte sluter tätt.
  // size: radien i rutan 60 × 60 som svg:n sträcks ut över.
  function ring(key, cls = 'pp-ring', size = 23) {
    const r = rng(`o${key}`);
    const rx = size + jit(r, 1.2);
    const ry = size - 2 + jit(r, 1.2);
    const tilt = jit(r, 0.3);
    const a0 = r() * Math.PI * 2;
    const sweep = Math.PI * 2 * (1.1 + r() * 0.12);
    const n = 14;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = a0 + (sweep * i) / n;
      const k = 1 + jit(r, 0.04) + (i / n) * 0.07;
      const x = rx * k * Math.cos(t);
      const y = ry * k * Math.sin(t);
      pts.push([30 + x * Math.cos(tilt) - y * Math.sin(tilt), 30 + x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    return `<svg class="${cls}" viewBox="0 0 60 60" preserveAspectRatio="none" aria-hidden="true"><path d="${smooth(pts)}"/></svg>`;
  }

  // Rättarens bock eller kryss i marginalen.
  function tick(key, ok) {
    const r = rng(`t${key}`);
    const d = ok
      ? smooth([[5 + jit(r, 1), 19 + jit(r, 1.5)], [10, 25 + jit(r, 1)], [14 + jit(r, 1), 30 + jit(r, 1)], [22, 17 + jit(r, 2)], [31 + jit(r, 1.5), 5 + jit(r, 1.5)]])
      : stroke(r, 8, 8, 26, 27, 1.6, 2.5) + stroke(r, 26, 7, 8, 28, 1.6, 2.5);
    return `<svg class="pp-tick" viewBox="0 0 34 34" aria-hidden="true"><path d="${d}"/></svg>`;
  }

  // Streckkoden längst ner, ur kupongens id.
  function barcode(id) {
    const r = rng(`streck${id}`);
    let x = 0;
    let d = '';
    for (let i = 0; i < 44; i++) {
      const w = 1 + Math.floor(r() * 3);
      d += `M${x} 0h${w}v30h-${w}z`;
      x += w + 1 + Math.floor(r() * 2.4);
    }
    return `<svg class="pp-bars" viewBox="0 0 ${x} 30" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
  }

  const rader = (c) => c.matches.reduce((a, x) => a * Math.max(1, x.sign.length), 1);

  // ---------- huvudet ----------

  function grade(c, g) {
    if (!g.started) {
      return `<div class="pp-stop"><span>Spelstopp</span><b>${esc(fWeekdayTime.format(new Date(g.first)))}</b></div>`;
    }
    const num = g.hidden && !g.ok ? '?' : g.ok;
    return `<div class="pp-grade" title="${g.ok} rätt av ${g.n}${g.liveOk ? ` – ${g.liveOk} till om ställningen håller` : ''}">` +
      `<span class="pp-gnum"><b>${num}</b><span>/${g.n}</span>${ring(`betyg${c.id}`, 'pp-gring', 26.5)}</span>` +
      (g.liveOk ? `<em title="Rätt om ställningen håller">+${g.liveOk}</em>` : '') +
      (g.hidden && g.ok ? '<em title="Dolt – du har valt att dölja resultat">+?</em>' : '') + '</div>';
  }

  function head(c, g) {
    const stamp = c.pending ? 'Väntar på GitHub' : g.done && !g.hidden ? 'Rättad' : '';
    // Kupongens nummer (kupong.js) i märket: Kupong 1, Kupong 2 …
    const nr = typeof couponNumber === 'function' ? ` ${couponNumber(c.matches.map((x) => x.id))}` : '';
    return '<div class="pp-head">' +
      `<p class="pp-brand"><img src="logo.svg" alt="" width="20" height="20">Matchfixarna<span>Kupong${nr}</span></p>` +
      `<h2 class="pp-title">${esc(dateRange(g.first, g.last))}</h2>` +
      '<p class="pp-meta">' +
      (c.name ? `<span class="pp-name">${esc(c.name)}</span>` : '') +
      `<span>${g.n} ${g.n === 1 ? 'match' : 'matcher'}</span>` +
      (stamp ? `<span class="pp-stamp${c.pending ? ' wait' : ''}">${stamp}</span>` : '') + '</p>' +
      grade(c, g) + '</div>';
  }

  // ---------- raderna ----------

  function signCells(r) {
    return SIGNS.map((s, i) => {
      const on = r.sign.includes(s);
      const res = r.res === i;
      const odds = r.pr ? pctOdds(r.pr[i]) : '';
      return `<span class="pp-cell"><span class="pp-box${on ? ' on' : ''}${res ? ' res' : ''}"><i>${s}</i>` +
        (on ? cross(`${r.id}${s}`) : '') + (res ? ring(`${r.id}${s}`) : '') + '</span>' +
        (r.pr ? `<small${r.tip === i ? ' class="fav"' : ''}>${odds}</small>` : '') + '</span>';
    }).join('');
  }

  // Vad skärmläsaren säger om tecknet och utfallet.
  function srText(r, cls) {
    const out = cls === 'ok' ? 'rätt' : cls === 'no' ? 'fel' : /live/.test(cls) ? (r.hit ? 'rätt just nu' : r.hit === false ? 'fel just nu' : 'pågår') : '';
    return `<span class="pp-sr">Tecken ${r.sign}${out ? `, ${out}` : ''}</span>`;
  }

  function result(r) {
    if (r.state === 'off') return `<span class="pp-hand pp-off">${esc(r.off)}</span>`;
    if (r.state === 'hidden') return Spoiler.chip();
    if (r.state === 'live') {
      return `<span class="pp-hand">${esc(scoreText(r)) || '–'}</span><span class="pp-min">${esc(r.clock || 'pågår')}</span>`;
    }
    if (r.score) return `<span class="pp-hand">${esc(scoreText(r))}</span>${r.extra ? `<span class="pp-ex">${esc(r.extra)}</span>` : ''}`;
    if (r.state === 'started') return '<span class="pp-min">pågår</span>';
    return '<span class="pp-blank" aria-hidden="true"></span>';
  }

  function row(r, i, weekday = false) {
    const cls = rowClass(r);
    const comp = r.m ? compOf(r.m.comp) : null;
    const small = r.m ? `${esc((weekday ? fWeekdayTime : fTime).format(new Date(r.m.kickoff)))}${comp ? ` · <abbr title="${esc(comp.name)}">${esc(comp.short)}</abbr>` : ''}` : '';
    const tag = r.m ? 'a' : 'div';
    const mark = cls === 'ok' || cls === 'no' ? tick(r.id, cls === 'ok') : '';
    return `<${tag} class="pp-row s-${cls.replace(' ', ' s-')}${i % 2 ? ' alt' : ''}"${r.m ? ` href="#match/${esc(r.id)}"` : ''}>` +
      `<span class="pp-nr">${i + 1}</span>` +
      '<span class="pp-match"><span class="pp-tm"><span class="pp-t">' +
      (r.m ? `${esc(r.m.home)}<span class="vs"> – </span>${esc(r.m.away)}` : esc(teamsOf(r))) + '</span></span>' +
      (small ? `<span class="pp-small">${small}</span>` : '') +
      (r.note ? `<span class="pp-note" title="${esc(r.note)}">${esc(r.note)}</span>` : '') + '</span>' +
      `<span class="pp-signs">${signCells(r)}${srText(r, cls)}</span>` +
      `<span class="pp-res">${result(r)}</span>` +
      `<span class="pp-mark">${mark}</span></${tag}>`;
  }

  function rows(g) {
    let html = '<div class="pp-cols" aria-hidden="true"><span>Nr</span><span>Match</span>' +
      '<span class="pp-cols-s" title="Under rutorna: modellens odds före avspark, modellens tips i fetstil"><b>1</b><b>X</b><b>2</b></span><span>Res.</span><span></span></div>';
    // Under sin dag – utom på en kupong i Stryktipsets ordning över flera
    // dagar, där veckodagen står på raden (som i slip).
    const days = inDayOrder(g.rows, (r) => r.m && r.m.kickoff);
    let day = null;
    g.rows.forEach((r, i) => {
      const k = r.m ? dayKey.format(new Date(r.m.kickoff)) : 'okänd';
      if (days && k !== day) {
        day = k;
        html += `<p class="pp-day">${esc(r.m ? cap(fDay.format(new Date(r.m.kickoff))) : 'Okänt datum')}</p>`;
      }
      html += row(r, i, !days);
    });
    return html;
  }

  // ---------- foten ----------

  function foot(c, g) {
    const fields = [
      !g.started ? ['Matcher', g.n] : null,
      ['Kombinationer', rader(c)],
      !g.done ? ['Väntat', kpNum(g.expected), 'Väntat antal rätt enligt modellen'] : null,
      g.started && !g.done ? ['Kvar', g.left + g.live + g.hidden] : null,
      g.started && !g.done && !g.hidden ? ['Möjliga', g.max, 'Högst så många rätt kan det bli'] : null,
      g.started && !g.hidden ? ['Modellen', g.modelOk, 'Rätt om vi spelat modellens troligaste utfall i varje match'] : null,
    ].filter(Boolean);
    return '<div class="pp-foot"><div class="pp-fields">' +
      fields.map(([label, v, title]) => `<span class="pp-field"${title ? ` title="${esc(title)}"` : ''}><span>${label}</span><b>${v}</b></span>`).join('') +
      '</div><div class="pp-fine">' + liveLine(g) +
      `<span class="pp-code">${barcode(c.id)}<span>${esc(c.id)}</span></span></div></div>`;
  }

  // Hela kupongen.
  function coupon(c, g) {
    return `<div class="pp-wrap"><article class="pp${g.live ? ' is-live' : ''}" aria-label="Kupongen ${esc(dateRange(g.first, g.last))}">` +
      head(c, g) + '<div class="pp-band" aria-hidden="true"></div>' + rows(g) + foot(c, g) + '</article></div>';
  }

  // ---------- kupongen som växer fram ----------
  //
  // Ny kupong, Ändra och Välj matcher i omgången: programmet – matcherna att
  // välja bland – och bredvid det papperskupongen, som får en tryckt rad för
  // varje vald match. I Ny kupong och Ändra kryssas tecknen på papperet; i
  // omgången står rutorna tomma tills var och en fyller i sin kupong. Också
  // i mobilen står de bredvid varandra, med kupongen kvar när man bläddrar.
  //
  // Sidan (kupong.js, samtal.js) ritar programmet i listan med id list och
  // lyssnar på hela byggets id: button[data-add] i programmet,
  // button[data-drop] (ta bort) och – med tecken – button[data-s] och
  // input[data-note] på papperet.
  //
  // Papperet har tretton tryckta rader som en tipskupong; de valda matcherna
  // fylls i uppifrån och resten står tomma. Omgångens kupong ska ha precis
  // så många matcher (samtal.js).
  //
  // I telefonen får programmet hela bredden och kupongen sticker upp nederst
  // i fönstret: antalet, en liten ruta per rad och knappen. Ett tryck på den
  // (pb-peek) drar fram hela papperet; ett tryck utanför eller Esc lägger
  // undan det.

  const RADER = 13;
  const B = { ids: null }; // raderna som stod på papperet förra gången, för att se vilken som är ny
  const phone = window.matchMedia('(max-width: 640px)');

  function builder({ id, list, tools = '', head = '', foot = '' }) {
    B.ids = null;
    return `<div class="pb" id="${id}"><div class="pb-tools">${tools}</div><div class="pb-prog"><div id="${list}"></div></div>` +
      '<aside class="pb-side" aria-label="Kupongen"><div class="pp-wrap pb-wrap"><div class="pp pp-fill pb-slip">' +
      `<button type="button" class="pb-peek" aria-expanded="false" aria-controls="${id}-rows">` +
      '<svg class="pb-chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 12.5l5-5 5 5"/></svg>' +
      '<span class="pb-peek-n"></span><span class="pb-pips" aria-hidden="true"></span></button>' +
      '<div class="pb-head">' +
      '<p class="pp-brand"><img src="logo.svg" alt="" width="20" height="20">Matchfixarna<span>Kupong</span></p>' +
      '<h2 class="pp-title pb-title"></h2>' +
      `<p class="pp-meta"><span class="pb-count"></span>${head}</p>` +
      '<div class="pp-stop pb-stop"><span>Spelstopp</span><b></b></div></div>' +
      '<div class="pp-band" aria-hidden="true"></div>' +
      `<div class="pb-rows" id="${id}-rows"></div>` +
      `<div class="pb-foot"><div class="pp-fields pb-fields"></div>${foot}</div>` +
      '</div></div></aside></div>';
  }

  // Papperet räcker ner till fönstrets nederkant, också innan det har fastnat
  // under toppraden, så att knappen längst ner alltid syns. I telefonen
  // sköter CSS:en höjden.
  function fit() {
    const slip = document.querySelector('.pb-slip');
    if (!slip) return;
    if (phone.matches) {
      slip.style.maxHeight = '';
      return;
    }
    const top = parseFloat(getComputedStyle(slip.closest('.pb')).getPropertyValue('--pb-top')) || 0;
    slip.style.maxHeight = `${Math.max(320, window.innerHeight - Math.max(top, slip.getBoundingClientRect().top) - 18)}px`;
  }
  window.addEventListener('scroll', fit, { passive: true });
  window.addEventListener('resize', fit);

  // Telefonen: hela papperet fram (on) eller undan.
  function pull(id, on = true) {
    const root = document.getElementById(id);
    if (!root) return;
    root.classList.toggle('open', on);
    const peek = root.querySelector('.pb-peek');
    if (peek) peek.setAttribute('aria-expanded', String(on));
  }
  document.addEventListener('click', (e) => {
    const peek = e.target.closest('.pb-peek');
    // Utanför papperet är det mörka fältet över programmet (.pb-side::before).
    const root = peek ? peek.closest('.pb') : e.target.matches('.pb.open > .pb-side') ? e.target.parentElement : null;
    if (root) pull(root.id, !root.classList.contains('open'));
  });
  document.addEventListener('keydown', (e) => {
    const root = e.key === 'Escape' && document.querySelector('.pb.open');
    if (!root) return;
    pull(root.id, false);
    root.querySelector('.pb-peek').focus();
  });

  // Rullar papperet (inte sidan) så att raden syns.
  function reveal(id, sel) {
    const root = document.getElementById(id);
    const box = root && root.querySelector('.pb-rows');
    const row = box && box.querySelector(sel);
    if (!row || !box.clientHeight) return;
    if (row.offsetTop < box.scrollTop || row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: Math.max(0, row.offsetTop - box.clientHeight / 3), behavior: 'smooth' });
    }
  }

  // Programmet: de valbara matcherna per dag, en knapp per match, som
  // matchlistans tavla – tävlingen och plustecknet ytterst, lagen speglade
  // kring avsparken (app.js listTeam). full: alla rader på papperet är
  // ifyllda, så plustecknen tonas ner.
  function program(matches, isOn, full = false) {
    const days = new Map();
    for (const m of matches) {
      const k = dayKey.format(new Date(m.kickoff));
      if (!days.has(k)) days.set(k, []);
      days.get(k).push(m);
    }
    let html = '';
    for (const ms of days.values()) {
      html += `<div class="day"><div class="day-head">${esc(cap(fDay.format(new Date(ms[0].kickoff))))}</div><div class="mlist">`;
      for (const m of ms) {
        const on = isOn(m.id);
        const comp = compOf(m.comp);
        html += `<button type="button" class="kp-pick pb-pick${on ? ' on' : ''}" data-add="${esc(m.id)}" aria-pressed="${on}"${full && !on ? ' aria-disabled="true"' : ''}>` +
          `<span class="ctag" title="${esc(comp.name)}">${esc(comp.short)}</span>` +
          `${listTeam(m.home, true)}<span class="mmid"><span class="kick">${esc(fTime.format(new Date(m.kickoff)))}</span></span>${listTeam(m.away, false)}` +
          `<span class="pb-tick" aria-hidden="true">${on ? '✓' : '+'}</span></button>`;
      }
      html += '</div></div>';
    }
    return html;
  }

  // Matcherna står under sin dag när de kommer i datumordning. Annars – en
  // kupong i Stryktipsets ordning över flera dagar – står veckodagen på
  // raden i stället. kick(rad) → avsparken.
  function inDayOrder(list, kick) {
    const ks = list.map((r) => (kick(r) ? dayKey.format(new Date(kick(r))) : ''));
    return ks.every((k, i) => !i || k >= ks[i - 1]);
  }

  function slipRow(r, i, signs, fresh, weekday = false) {
    const m = r.m;
    const label = m ? `${m.home} – ${m.away}` : r.label || `match ${r.id}`;
    const comp = m ? compOf(m.comp) : null;
    const small = m ? `${esc((weekday ? fWeekdayTime : fTime).format(new Date(m.kickoff)))}${comp ? ` · <abbr title="${esc(comp.name)}">${esc(comp.short)}</abbr>` : ''}` : '';
    const sign = r.sign || '';
    let cells;
    if (signs && !r.locked) {
      const p = m && m.f ? m.f.p : null;
      cells = '<span class="kp-tg">' + SIGNS.map((s, k) =>
        `<button type="button" data-s="${s}" aria-pressed="${sign.includes(s)}" aria-label="${s} för ${esc(label)}">` +
        `${s}<small>${p ? pctOdds(p[k]) : '–'}</small></button>`).join('') + '</span>';
    } else {
      // Startad (står som den stod) eller omgången (fylls i av var och en).
      cells = '<span class="pp-signs" aria-hidden="true">' + SIGNS.map((s) =>
        `<span class="pp-cell"><span class="pp-box"><i>${s}</i>${sign.includes(s) ? cross(`${r.id}${s}`) : ''}</span></span>`).join('') + '</span>';
    }
    const note = signs && !r.locked && sign
      ? `<input type="text" class="kp-note-in" data-note="${esc(r.id)}" maxlength="${NOTE_MAX}" autocomplete="off"` +
        ` placeholder="Anteckning (valfritt)" aria-label="Anteckning om ${esc(label)}" value="${esc(r.note || '')}">`
      : r.note ? `<span class="pp-note">${esc(r.note)}</span>` : '';
    return `<div class="pb-row${i % 2 ? ' alt' : ''}${r.locked ? ' locked' : ''}${fresh ? ' pb-new' : ''}${signs && !r.locked && !sign ? ' unsigned' : ''}" data-id="${esc(r.id)}">` +
      `<span class="pp-nr">${i + 1}</span>` +
      `<span class="pb-match"><span class="pp-tm">${m ? `${esc(m.home)}<span class="vs"> – </span>${esc(m.away)}` : esc(label)}</span>` +
      `${small ? `<span class="pp-small">${small}${r.locked ? ' · har startat' : ''}</span>` : ''}</span>` +
      cells +
      (r.locked ? '<span></span>' : `<button type="button" class="pb-drop" data-drop="${esc(r.id)}" aria-label="Ta bort ${esc(label)}" title="Ta bort">` +
        '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8"/></svg></button>') +
      note + '</div>';
  }

  // En tom rad: numret, en linje att skriva matchen på och tomma rutor.
  function blankRow(i) {
    return `<div class="pb-row pb-blank${i % 2 ? ' alt' : ''}" aria-hidden="true">` +
      `<span class="pp-nr">${i + 1}</span><span class="pb-line"></span><span class="pp-signs">` +
      SIGNS.map((s) => `<span class="pp-cell"><span class="pp-box"><i>${s}</i></span></span>`).join('') + '</span><span></span></div>';
  }

  // Ritar papperet: rows [{id, m, label, sign, note, locked}] i
  // avsparksordning – eller, med ordered, i den ordning de kommer (omgångens
  // kupong: i den ordning matcherna valdes, som numren på Stryktipset) –
  // fields [[etikett, värde, title]] i foten. Med signs kryssas tecknen på
  // papperet. max: så många matcher ska kupongen ha. Raden som just lagts
  // till trycks fram.
  function slip(id, { rows, signs = false, fields = [], max = 0, ordered = false }) {
    const root = document.getElementById(id);
    if (!root) return;
    root.classList.toggle('pb-signs', signs);
    const list = ordered ? rows.slice() : rows.slice().sort((a, b) => (a.m ? Date.parse(a.m.kickoff) : 0) - (b.m ? Date.parse(b.m.kickoff) : 0));
    const days = inDayOrder(list, (r) => r.m && r.m.kickoff);
    const was = B.ids;
    B.ids = new Set(list.map((r) => r.id));
    const added = was ? list.filter((r) => !was.has(r.id)).map((r) => r.id) : [];
    const kicks = list.filter((r) => r.m).map((r) => Date.parse(r.m.kickoff));
    const open = list.filter((r) => r.m && !r.locked).map((r) => Date.parse(r.m.kickoff));
    const n = list.length;
    root.querySelector('.pb-title').innerHTML = kicks.length ? esc(dateRange(Math.min(...kicks), Math.max(...kicks))) : '<span class="pb-blankline"></span>';
    const count = max ? `${n} av ${max} matcher` : `${n} ${n === 1 ? 'match' : 'matcher'}`;
    root.querySelector('.pb-count').textContent = count;
    // Kupongen nederst i telefonen: antalet och en ruta per rad – med
    // tecknet i, eller röd kant om det saknas – och de tomma raderna.
    root.querySelector('.pb-peek-n').textContent = max ? `${n} av ${max}` : count;
    root.querySelector('.pb-pips').innerHTML = list.map((r) => {
      const s = r.sign || '';
      return `<i class="${signs && !s ? 'need' : 'on'}${r.locked ? ' locked' : ''}">${signs ? esc(s) : ''}</i>`;
    }).join('') + '<i></i>'.repeat(Math.max(0, max - n));
    root.querySelector('.pb-stop b').innerHTML = open.length ? esc(fWeekdayTime.format(new Date(Math.min(...open)))) : '<span class="pb-blankline"></span>';
    let html = '';
    let day = null;
    list.forEach((r, i) => {
      const k = r.m ? dayKey.format(new Date(r.m.kickoff)) : 'okänd';
      if (days && k !== day) {
        day = k;
        html += `<p class="pp-day">${esc(r.m ? cap(fDay.format(new Date(r.m.kickoff))) : 'Okänt datum')}</p>`;
      }
      html += slipRow(r, i, signs, added.includes(r.id), !days);
    });
    for (let i = n; i < RADER; i++) html += blankRow(i);
    const box = root.querySelector('.pb-rows');
    // Fokus i en anteckning behålls: fältet ritas om bara om raderna ändrats.
    const keep = document.activeElement && box.contains(document.activeElement) && document.activeElement.matches('input') ? document.activeElement.dataset.note : null;
    box.innerHTML = html;
    if (keep) {
      const f = box.querySelector(`input[data-note="${CSS.escape(keep)}"]`);
      if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
    }
    root.querySelector('.pb-fields').innerHTML = fields.map(([label, v, title]) =>
      `<span class="pp-field"${title ? ` title="${esc(title)}"` : ''}><span>${label}</span><b>${v}</b></span>`).join('');
    if (added.length) {
      // Den nya raden rullas fram på papperet, och antalet studsar.
      reveal(id, `.pb-row[data-id="${CSS.escape(added[added.length - 1])}"]`);
      bump(id);
    }
    fit();
  }

  // Antalet matcher studsar – på papperet och nederst i telefonen.
  function bump(id) {
    for (const count of document.querySelectorAll(`#${id} .pb-count, #${id} .pb-peek-n`)) {
      count.classList.remove('pb-bump');
      void count.offsetWidth;
      count.classList.add('pb-bump');
    }
  }

  window.Papper = { RADER, coupon, builder, reveal, program, slip, bump, open: pull, cross, ring, tick, grade, result, foot, inDayOrder };
}());
