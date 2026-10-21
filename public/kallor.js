'use strict';

// ---------- Källor ----------
//
// Sidan Källor (#kallor) och raden i sidfoten om när datan uppdaterades.
// Överst hur det står till, sedan vad som kommer varifrån (datatyp ×
// tävling) och sist ett kort per källa: vad den ger, var på sajten det
// används och varje hämtning med status. Data: data/sources.json
// (src/sourcetable.js). Läses före app.js och använder dess hjälpare ($,
// esc, getJSON, when, dateOnly, fTime, dayKey, tiles, state) först när
// sidan ritas.

// Sämsta status vinner när flera hämtningar delar en cell eller en källa.
const SRC_RANK = { 'färsk': 0, 'okänt': 1, gammal: 2, fel: 3 };
const SRC_WORD = { 'färsk': 'färsk', 'okänt': 'tom', gammal: 'gammal', fel: 'fel' };

// Status räknas om här ur hämttid och gräns, så att sidan visar "gammal"
// om den schemalagda hämtningen skulle stanna.
function statusOf(s, now = Date.now()) {
  if (s.lastError) return 'fel';
  if (s.empty) return 'okänt';
  if (!s.fetchedAt || (now - new Date(s.fetchedAt).getTime()) / 3600000 > s.staleAfterHours) return 'gammal';
  return 'färsk';
}

async function loadSources() {
  const el = $('#sources');
  try {
    const d = await getJSON('data/sources.json');
    for (const s of d.sources) s.status = statusOf(s);
    if (el) el.innerHTML = renderSources(d);
    topline();
  } catch (err) {
    if (el) el.innerHTML = `<p class="empty">Kunde inte läsa källorna: ${esc(err.message)}</p>`;
  }
}

// Hur ofta en hämtning görs, i ord. Under en halvtimme = varje körning.
function srcCadence(h) {
  if (h <= 0.5) return 'varje halvtimme';
  if (h < 24) return `var ${h === 1 ? '' : `${h}:e `}timme`;
  if (h < 48) return 'en gång om dygnet';
  if (h >= 24 * 28) return 'en gång i månaden';
  return `var ${Math.round(h / 24)}:e dag`;
}

// "i dag 22:00", "i går 21:30", annars datum och tid.
function srcAgo(iso) {
  if (!iso) return '<span class="unknown">okänt</span>';
  const t = new Date(iso);
  const today = dayKey.format(new Date());
  const yesterday = dayKey.format(new Date(Date.now() - 86400000));
  const k = dayKey.format(t);
  if (k === today) return `i dag ${esc(fTime.format(t))}`;
  if (k === yesterday) return `i går ${esc(fTime.format(t))}`;
  return when(iso);
}

const srcDot = (st, title = SRC_WORD[st]) => `<span class="dot s-${st}" title="${esc(title)}"></span>`;

function srcWorst(list) {
  return list.reduce((w, s) => (SRC_RANK[s.status] > SRC_RANK[w] ? s.status : w), 'färsk');
}

function renderSources(d) {
  const byShort = new Map();
  for (const s of d.sources) {
    if (!byShort.has(s.short)) byShort.set(s.short, []);
    byShort.get(s.short).push(s);
  }
  const providers = (d.providers || []).filter((p) => byShort.has(p.id) || p.live);
  const n = (st) => d.sources.filter((s) => s.status === st).length;
  const problems = n('fel') + n('gammal');
  const meta = state.meta;

  let html = '<div class="src-page">';
  html += tiles([
    ['Hämtningar', String(d.sources.length),
      `${providers.length} fria källor · ${problems ? [n('fel') && `${n('fel')} med fel`, n('gammal') && `${n('gammal')} gamla`].filter(Boolean).join(' · ') : 'alla fungerar'}`,
      'Sajten hämtar själv från källorna. Startelvorna, matchhändelserna och Stryktipset hämtas i stället när du tittar på dem.'],
    ['Uppdaterad', meta ? esc(fTime.format(new Date(meta.generatedAt))) : '–', meta ? `${srcAgo(meta.generatedAt).replace(/ \d\d:\d\d$/, '')}, var ${meta.updateEveryMinutes}:e minut` : '',
      meta ? `Sajten uppdaterades ${fDateTime.format(new Date(meta.generatedAt))}. Varje källa hämtas när dess intervall gått ut.` : null],
  ]);
  html += '<p id="sources-summary" class="src-late" hidden></p>';

  // Vad som kommer varifrån: en rad per datatyp, en kolumn per tävling.
  const byId = new Map(d.sources.map((s) => [s.id, s]));
  const cell = (c) => {
    if (!c.sourceIds.length && !(c.live || []).length) return `<span class="src-gap" title="${esc(c.gap)}">–</span>`;
    const by = new Map();
    for (const id of c.sourceIds) {
      const s = byId.get(id);
      if (!s) continue;
      const prev = by.get(s.short);
      if (!prev || SRC_RANK[s.status] > SRC_RANK[prev]) by.set(s.short, s.status);
    }
    for (const name of c.live || []) if (!by.has(name)) by.set(name, 'live');
    return [...by].map(([name, st]) => `<span class="src-name">${st === 'live'
      ? '<span class="dot s-live" title="hämtas när du tittar"></span>' : srcDot(st)}${esc(name)}</span>`).join('');
  };
  html += '<h3>Vad som kommer varifrån</h3><div class="table-wrap src-cov"><table><thead><tr><th></th>' +
    d.competitions.map((c) => `<th title="${esc(c.name)}">${esc(c.short)}</th>`).join('') + '</tr></thead><tbody>' +
    d.coverage.map((row) => `<tr><th scope="row">${esc(row.label)}</th>` + row.cells.map((c) => `<td>${cell(c)}</td>`).join('') + '</tr>').join('') +
    '</tbody></table></div>' +
    `<p class="legend src-key">${srcDot('färsk')}färsk ${srcDot('gammal')}gammal ${srcDot('fel')}senaste hämtningen misslyckades ` +
    `${srcDot('okänt')}tom än <span class="dot s-live"></span>hämtas när du tittar <span class="src-gap">–</span> finns inte</p>`;

  // Ett kort per källa.
  html += '<h3>Källorna</h3><div class="src-grid">' + providers.map((p) => providerCard(p, byShort.get(p.id) || [])).join('') + '</div>';

  if (d.unmapped.length) {
    html += '<p class="legend src-unmapped"><strong title="Används inte förrän de lagts in i aliastabellen (config/team-aliases.js)">Okända lagnamn</strong>: ' +
      d.unmapped.map((u) => `${esc(u.name)} <span class="muted">(${esc(u.source)}, ${esc(u.comp)})</span>`).join(', ') + '</p>';
  }
  return html + '</div>';
}

function providerCard(p, list) {
  const st = list.length ? srcWorst(list) : null;
  const latest = list.map((s) => s.fetchedAt).filter(Boolean).sort().pop();
  const freq = list.length ? srcCadence(Math.min(...list.map((s) => s.cadenceHours))) : null;
  const bad = list.filter((s) => s.status === 'fel' || s.status === 'gammal');
  const badge = !list.length ? '<span class="src-state">hämtas när du tittar</span>'
    : bad.length ? `<span class="src-state bad">${srcDot(st)}${bad.length === 1 ? '1 hämtning' : `${bad.length} hämtningar`} ${st === 'fel' ? 'med fel' : 'gamla'}</span>`
      : `<span class="src-state">${srcDot('färsk')}fungerar</span>`;
  const facts = [
    ['Ger', esc(p.gives)],
    ['Används till', esc(p.used)],
    list.length && ['Hämtas', `${freq}${list.length > 1 && Math.max(...list.map((s) => s.cadenceHours)) >= 24 * 28 ? ', tidigare säsonger en gång i månaden' : ''} · senast ${srcAgo(latest)}`],
    p.live && ['När du tittar', esc(p.live)],
  ].filter(Boolean);
  let body = `<dl class="src-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  if (bad.length) {
    body += bad.map((s) => `<p class="err">${esc(s.label)}: ${s.lastError ? `${esc(s.lastError)} (${when(s.lastAttempt)})` : `senast hämtad ${when(s.fetchedAt)}`}</p>`).join('');
  }
  if (list.length) {
    body += `<details class="src-runs"><summary>${list.length === 1 ? 'Hämtningen' : `Alla ${list.length} hämtningar`}</summary>` +
      '<div class="table-wrap"><table><thead><tr><th>Vad</th><th class="num">Senast</th><th class="num">Data t.o.m.</th><th>Innehåll</th></tr></thead><tbody>' +
      list.map((s) => `<tr><td>${srcDot(s.status)}${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}</td>` +
        `<td class="num">${srcAgo(s.fetchedAt)}<span class="sub">${esc(srcCadence(s.cadenceHours))}</span></td>` +
        `<td class="num">${s.latestData ? dateOnly(s.latestData) : '–'}</td>` +
        `<td>${s.detail ? esc(s.detail) : '<span class="unknown">okänt</span>'}<span class="sub">kontrollerad ${dateOnly(s.verified)}</span></td></tr>`).join('') +
      '</tbody></table></div></details>';
  }
  return `<div class="card src-card"><div class="src-head"><h4><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a></h4>${badge}</div>${body}</div>`;
}

// Sidfoten säger något bara när sajtens data är gammal; när den uppdaterades
// och vilka källor som har fel står under Källor.
function topline() {
  const meta = state.meta;
  const ageMin = meta ? (Date.now() - new Date(meta.generatedAt).getTime()) / 60000 : null;
  const late = ageMin != null && ageMin > meta.updateEveryMinutes * 4;
  // Bara en varning när datan är gammal; annars syns inget här.
  const summary = $('#sources-summary');
  if (summary) {
    summary.hidden = !late;
    summary.innerHTML = late
      ? `<span class="err" style="display:inline">Senaste uppdateringen ${when(meta.generatedAt)} – ovanligt länge sedan (sker normalt var ${meta.updateEveryMinutes}:e minut). Den schemalagda hämtningen kan ha stannat.</span>`
      : '';
  }
  const tl = $('#topline');
  tl.innerHTML = !meta ? 'Kunde inte läsa sajtens data.'
    : late ? `<a href="#kallor" class="err" style="display:inline">Datan är gammal – uppdaterad ${when(meta.generatedAt)}</a>` : '';
  tl.hidden = !tl.innerHTML;
}
