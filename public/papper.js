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
// Läses efter kupong.js och använder dess hjälpare (SIGNS, rowClass, teamsOf,
// scoreText, kpNum, dateRange, liveLine, fWeekdayTime) och app.js (esc, fTime,
// fDay, dayKey, cap, compOf, pctOdds).

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
    return '<div class="pp-head">' +
      '<p class="pp-brand"><img src="logo.svg" alt="" width="20" height="20">Matchfixarna<span>Kupong</span></p>' +
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

  function row(r, i) {
    const cls = rowClass(r);
    const comp = r.m ? compOf(r.m.comp) : null;
    const small = r.m ? `${esc(fTime.format(new Date(r.m.kickoff)))}${comp ? ` · <abbr title="${esc(comp.name)}">${esc(comp.short)}</abbr>` : ''}` : '';
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
    let day = null;
    g.rows.forEach((r, i) => {
      const k = r.m ? dayKey.format(new Date(r.m.kickoff)) : 'okänd';
      if (k !== day) {
        day = k;
        html += `<p class="pp-day">${esc(r.m ? cap(fDay.format(new Date(r.m.kickoff))) : 'Okänt datum')}</p>`;
      }
      html += row(r, i);
    });
    return html;
  }

  // ---------- foten ----------

  function foot(c, g) {
    const fields = [
      !g.started ? ['Matcher', g.n] : null,
      ['Rader', rader(c), 'Antal rader med garderingarna'],
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

  window.Papper = { coupon, cross };
}());
