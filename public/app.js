'use strict';

// ---------- hjälpare ----------

const TZ = 'Europe/Stockholm';
const $ = (s) => document.querySelector(s);
const state = { view: 'upcoming', comp: 'all', meta: null, comps: new Map(), all: null };
const LIST_DAYS = 14;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Sajten är statisk: all data ligger som JSON-filer under data/, byggda av
// GitHub Actions. no-cache = fråga servern om filen ändrats (billigt med ETag).
async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(res.status === 404 ? 'finns inte' : `HTTP ${res.status}`);
  return res.json();
}

const fmt = (o) => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, ...o });
const fTime = fmt({ hour: '2-digit', minute: '2-digit' });
const fDay = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const fDate = fmt({ day: 'numeric', month: 'short' });
const fDateTime = fmt({ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const dayKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });

function when(iso) {
  if (!iso) return '<span class="unknown">okänt</span>';
  return esc(fDateTime.format(new Date(iso)));
}
function dateOnly(iso) {
  return iso ? esc(fDate.format(new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso))) : '–';
}
function odds(x) {
  return x == null ? '–' : x.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function val(v) {
  return v == null ? '<span class="unknown">okänt</span>' : esc(v);
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- flikar och routning ----------

const TABS = {
  matcher: 'matches-section',
  utvardering: 'eval-section',
  kallor: 'sources-section',
  modell: 'model-section',
};

function showTab(sectionId) {
  for (const btn of document.querySelectorAll('[role="tab"]')) {
    const on = btn.dataset.tab === sectionId;
    btn.setAttribute('aria-selected', String(on));
    document.getElementById(btn.dataset.tab).hidden = !on;
  }
  if (sectionId === 'sources-section') loadSources();
}

function route() {
  const h = location.hash.replace(/^#/, '');
  const m = /^match\/(\d+)$/.exec(h);
  if (m) {
    showTab('matches-section');
    openMatch(m[1]);
    return;
  }
  showTab(TABS[h] || 'matches-section');
  $('#match-detail-view').hidden = true;
  $('#match-list-view').hidden = false;
}

for (const btn of document.querySelectorAll('[role="tab"]')) {
  btn.addEventListener('click', () => {
    const name = Object.keys(TABS).find((k) => TABS[k] === btn.dataset.tab);
    location.hash = name;
  });
}
window.addEventListener('hashchange', route);

// ---------- matchlista ----------

function renderChips() {
  const all = [{ id: 'all', short: 'Alla', name: 'Alla tävlingar' }, ...state.comps.values()];
  $('#comp-chips').innerHTML = all.map((c) =>
    `<button type="button" data-comp="${c.id}" title="${esc(c.name)}" aria-pressed="${c.id === state.comp}">${esc(c.short)}</button>`).join('');
  for (const b of document.querySelectorAll('#comp-chips button')) {
    b.addEventListener('click', () => { state.comp = b.dataset.comp; renderChips(); renderMatchList(); });
  }
}

for (const b of document.querySelectorAll('.seg button')) {
  b.addEventListener('click', () => {
    state.view = b.dataset.view;
    for (const x of document.querySelectorAll('.seg button')) x.setAttribute('aria-pressed', String(x === b));
    renderMatchList();
  });
}

async function loadMatches() {
  const el = $('#match-list');
  el.innerHTML = '<p class="empty">Laddar …</p>';
  try {
    state.all = await getJSON('data/matches.json');
    renderMatchList();
  } catch (err) {
    el.innerHTML = `<p class="empty">Kunde inte läsa matcherna: ${esc(err.message)}</p>`;
  }
}

// Urvalet görs här, mot besökarens klocka – inte mot när sajten byggdes.
function selectMatches(view, comp, days) {
  const now = Date.now();
  const span = days * 86400000;
  const inComp = (m) => comp === 'all' || m.comp === comp;
  const t = (m) => new Date(m.kickoff).getTime();
  if (view === 'played') {
    return state.all.matches.filter((m) => inComp(m) && m.completed && t(m) >= now - span).reverse();
  }
  return state.all.matches.filter((m) => inComp(m) && !m.completed && t(m) >= now - 3 * 3600000 && t(m) <= now + span);
}

function renderMatchList() {
  if (!state.all) return;
  const el = $('#match-list');
  const matches = selectMatches(state.view, state.comp, LIST_DAYS);
  $('#list-legend').innerHTML = state.view === 'played'
    ? 'Resultat från ESPN. Klicka på en match för underlaget.'
    : `Odds 1 · X · 2 från DraftKings via ESPN, hämtade ${when(state.all.oddsFetchedAt)}. Klicka på en match för underlaget.`;
  el.innerHTML = renderList({ view: state.view, days: LIST_DAYS, matches });
  for (const r of el.querySelectorAll('.mrow')) {
    r.addEventListener('click', () => { location.hash = `match/${r.dataset.id}`; });
  }
}

function renderList(d) {
  if (!d.matches.length) {
    return `<p class="empty">Inga ${d.view === 'played' ? 'spelade' : 'kommande'} matcher de närmaste ${d.days} dagarna.</p>`;
  }
  const days = new Map();
  for (const m of d.matches) {
    const k = dayKey.format(new Date(m.kickoff));
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(m);
  }
  let html = '';
  for (const ms of days.values()) {
    html += `<div class="day"><div class="day-head">${esc(cap(fDay.format(new Date(ms[0].kickoff))))}</div><div class="mlist">`;
    for (const m of ms) html += matchRow(m);
    html += '</div></div>';
  }
  return html;
}

function compOf(id) {
  return state.comps.get(id) || { name: id, short: id };
}

function matchRow(m) {
  let side;
  if (m.completed && m.score) {
    side = `<span class="score">${m.score.home}–${m.score.away}</span>`;
    if (m.shootout) side += `<span class="sub">str. ${m.shootout.home}–${m.shootout.away}</span>`;
  } else if (m.status === 'STATUS_POSTPONED') {
    side = 'uppskjuten';
  } else if (m.odds) {
    side = m.odds.map(odds).join(' · ');
  } else {
    side = '';
  }
  return `<button type="button" class="mrow" data-id="${esc(m.id)}">` +
    `<span class="mtime">${esc(fTime.format(new Date(m.kickoff)))}</span>` +
    `<span class="ctag" title="${esc(compOf(m.comp).name)}">${esc(compOf(m.comp).short)}</span>` +
    `<span class="mteams">${esc(m.home)}<span class="vs">–</span>${esc(m.away)}` +
    `${m.round ? `<span class="sub">${esc(m.round)}</span>` : ''}</span>` +
    `<span class="mside">${side}</span></button>`;
}

// ---------- matchvy ----------

async function openMatch(id) {
  const el = $('#match-detail-view');
  $('#match-list-view').hidden = true;
  el.hidden = false;
  el.innerHTML = '<p class="empty">Laddar …</p>';
  try {
    const d = await getJSON(`data/match/${encodeURIComponent(id)}.json`);
    el.innerHTML = renderDetail(d);
    window.scrollTo({ top: 0 });
  } catch (err) {
    el.innerHTML = backLink() + `<p class="empty">Kunde inte läsa matchen: ${esc(err.message)}</p>`;
  }
}

function backLink() {
  return '<div class="back"><a href="#matcher">← Alla matcher</a></div>';
}

function renderDetail(d) {
  const m = d.match;
  let mid;
  let midSub = '';
  if (m.completed && m.score) {
    mid = `${m.score.home}–${m.score.away}`;
    const s90 = m.score90;
    const extra = [];
    if (s90 && (s90.home !== m.score.home || s90.away !== m.score.away)) extra.push(`efter 90 min ${s90.home}–${s90.away}`);
    if (m.shootout) extra.push(`straffar ${m.shootout.home}–${m.shootout.away}`);
    if (extra.length) midSub = extra.join(' · ');
  } else {
    mid = '–';
    if (m.status === 'STATUS_POSTPONED') midSub = 'uppskjuten';
  }
  const meta = [m.compName, m.round, cap(fDay.format(new Date(m.kickoff))) + ' ' + fTime.format(new Date(m.kickoff)), m.venue]
    .filter(Boolean).map(esc).join(' · ');

  let html = backLink();
  html += `<div class="mhead"><div class="mhead-meta">${meta}</div>` +
    `<div class="mhead-teams"><div class="mhead-team">${esc(m.home)}</div>` +
    `<div class="mhead-mid">${esc(mid)}${midSub ? `<span class="sub">${esc(midSub)}</span>` : ''}</div>` +
    `<div class="mhead-team away">${esc(m.away)}</div></div>` +
    (m.tierNote ? `<p class="note">${esc(m.tierNote)}</p>` : '') + '</div>';

  html += `<div class="card pending" style="margin-bottom:1rem">Prognosen räknas fram i nästa fas – här visas underlaget den ska bygga på. <span class="phase-tag">Fas 2</span></div>`;

  html += '<div class="grid2">' + oddsCard(d.odds, m) + formCard(d) + '</div>';
  html += sideCard(d);
  html += '<div class="grid2">' + squadCard(d) + unknownCard(d) + '</div>';
  html += '<p class="legend">Lagstatistiken bygger bara på matcher spelade före avspark. Tabell och trupp är aktuella ögonblicksbilder.</p>';
  return html;
}

function oddsCard(o, m) {
  const rows = [];
  if (o.espn) rows.push([`${esc(o.espn.provider)}`, o.espn.x12, o.espn.total]);
  if (o.fdOpen) {
    if (o.fdOpen.avg) rows.push(['Snitt, öppning', o.fdOpen.avg, o.fdOpen.total25 && { line: 2.5, ...o.fdOpen.total25 }]);
    if (o.fdOpen.betfair) rows.push(['Betfair Exchange, öppning', o.fdOpen.betfair, null]);
  }
  if (o.fdClose) {
    if (o.fdClose.avg) rows.push(['Snitt, stängning', o.fdClose.avg, o.fdClose.total25 && { line: 2.5, ...o.fdClose.total25 }]);
    if (o.fdClose.betfair) rows.push(['Betfair Exchange, stängning', o.fdClose.betfair, null]);
  }
  let body;
  if (!rows.length) {
    body = `<p class="unknown">okänt – ${esc(o.note || 'inga odds hittade för matchen')}</p>`;
  } else {
    body = '<table class="odds"><thead><tr><th></th><th class="num">1</th><th class="num">X</th><th class="num">2</th><th class="num">Över/under</th></tr></thead><tbody>' +
      rows.map(([label, x, t]) => `<tr><td>${label}</td>${x.map((v) => `<td class="num">${odds(v)}</td>`).join('')}` +
        `<td class="num">${t ? `${odds(t.over)} / ${odds(t.under)}<span class="sub">${esc(String(t.line).replace('.', ','))} mål</span>` : '–'}</td></tr>`).join('') +
      '</tbody></table>';
  }
  const src = [];
  if (o.espn) src.push(`DraftKings via ESPN, hämtat ${when(o.espn.fetchedAt)}`);
  if (o.fdOpen || o.fdClose) src.push(`football-data.co.uk (öppning insamlad fre/tis), hämtat ${when((o.fdOpen || o.fdClose).fetchedAt)}`);
  return `<div class="card"><h4>Odds</h4>${body}${src.length ? `<p class="src-line">${src.join('. ')}.</p>` : ''}</div>`;
}

function formCard(d) {
  const row = (name, p) => {
    const f = p.form || [];
    const chips = f.length
      ? f.map((x) => `<span class="${x.result || ''}" title="${esc(`${x.date} ${x.comp} ${x.home ? 'hemma' : 'borta'}${x.opponent ? ` mot ${x.opponent}` : ''}: ${x.gf}–${x.ga}${x.decided ? ` (${x.decided})` : ''}`)}">${x.result || '?'}</span>`).join('')
      : '<span class="muted" style="width:auto;background:none;font-weight:400">inga tidigare matcher</span>';
    return `<div class="form-row"><span class="t">${esc(name)}</span><span class="form">${chips}</span></div>`;
  };
  let html = `<div class="card"><h4>Form, senaste ${5} <span class="hint">nyast först</span></h4>` +
    row(d.match.home, d.teams.home) + row(d.match.away, d.teams.away);
  if (d.meetings.length) {
    html += '<h4 style="margin-top:0.9rem">Möten i år</h4><ul class="plain">' +
      d.meetings.map((x) => `<li>${dateOnly(x.kickoff)} · ${esc(x.compShort)} · ${esc(x.home)} ${x.score.home}–${x.score.away} ${esc(x.away)}</li>`).join('') + '</ul>';
  }
  html += '<p class="src-line">ESPN, alla tävlingar. Avgjort på 90 minuter – straffavgjorda cupmatcher räknas som oavgjorda.</p></div>';
  return html;
}

function sideCard(d) {
  let rows = '';
  const notes = [];
  for (const g of d.rows) {
    let srcTxt = '';
    if (g.sources) {
      const s = g.sources.find(Boolean);
      if (s) {
        srcTxt = esc(s.provider);
        if (g.through) {
          const [a, b] = g.through.map((x) => (x ? dateOnly(x) : null));
          srcTxt += a === b ? `, t.o.m. ${a || '–'}` : `, t.o.m. ${a || '–'} resp. ${b || '–'}`;
        } else {
          srcTxt += `, hämtad ${when(s.fetchedAt)}`;
        }
      }
    }
    rows += `<tr class="group"><td colspan="3">${esc(g.title)}${srcTxt ? `<span class="sub">${srcTxt}</span>` : ''}</td></tr>`;
    for (const r of g.rows) {
      rows += `<tr><td class="h">${val(r.values[0])}</td><td class="mid">${esc(r.label)}</td><td class="a">${val(r.values[1])}</td></tr>`;
    }
    if (g.note) notes.push(g.note);
  }
  return `<div class="card" style="margin-bottom:1rem"><h4>Lagen sida vid sida</h4>` +
    `<div class="table-wrap" style="box-shadow:none;margin:0"><table class="side"><thead><tr>` +
    `<th style="text-align:right">${esc(d.match.home)}</th><th class="mid"></th><th>${esc(d.match.away)}</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>` +
    (notes.length ? `<p class="src-line">${notes.map(esc).join(' ')}</p>` : '') + '</div>';
}

function squadCard(d) {
  const block = (name, s) => {
    let h = `<p style="margin:0.2rem 0 0.3rem"><strong>${esc(name)}</strong></p>`;
    if (s.unknown) return h + `<p class="unknown" style="margin:0 0 0.6rem">okänt – ${esc(s.reason)}</p>`;
    if (!s.players.length) return h + '<p class="muted" style="margin:0 0 0.6rem">Inga skador eller avstängningar rapporterade.</p>';
    return h + '<ul class="plain" style="margin-bottom:0.6rem">' + s.players.map((p) =>
      `<li>${esc(p.name)} <span class="muted">${esc(p.pos || '')}</span> – ${esc(p.status)}` +
      `${p.chance != null ? ` (${p.chance} % chans att spela)` : ''}` +
      `${p.news ? `<span class="sub">${esc(p.news)}${p.since ? ` · ${dateOnly(p.since)}` : ''}</span>` : ''}</li>`).join('') + '</ul>';
  };
  const src = [d.squad.home, d.squad.away].find((s) => s.source);
  return `<div class="card"><h4>Skador och avstängningar</h4>` +
    block(d.match.home, d.squad.home) + block(d.match.away, d.squad.away) +
    (src ? `<p class="src-line">${esc(src.source.provider)}, hämtat ${when(src.source.fetchedAt)}.${src.note ? ' ' + esc(src.note) : ''} Sorterat efter speltid.</p>` : '') + '</div>';
}

function unknownCard(d) {
  return `<div class="card"><h4>Okänt för den här matchen</h4><ul class="bullets">` +
    d.unknowns.map((u) => `<li>${esc(u)}</li>`).join('') + '</ul></div>';
}

// ---------- källor ----------

const RANK = { 'färsk': 0, gammal: 1, fel: 2, 'okänt': 3 };

// Status räknas om här ur hämttid och gräns, så att sidan visar "gammal"
// om den schemalagda hämtningen skulle stanna.
function statusOf(s, now = Date.now()) {
  if (s.empty) return 'okänt';
  if (s.lastError) return 'fel';
  if (!s.fetchedAt || (now - new Date(s.fetchedAt).getTime()) / 3600000 > s.staleAfterHours) return 'gammal';
  return 'färsk';
}

async function loadSources() {
  try {
    const d = await getJSON('data/sources.json');
    for (const s of d.sources) s.status = statusOf(s);
    renderSources(d);
    topline(d);
  } catch (err) {
    $('#sources-table').innerHTML = `<p class="empty">Kunde inte läsa källorna: ${esc(err.message)}</p>`;
  }
}

function renderSources(d) {
  const comps = d.competitions;
  const byId = new Map(d.sources.map((s) => [s.id, s]));
  const cell = (c) => {
    if (!c.sourceIds.length) return `<span class="gap">${esc(c.gap)}</span>`;
    // En rad per leverantör i cellen; sämsta status vinner.
    const by = new Map();
    for (const id of c.sourceIds) {
      const s = byId.get(id);
      const prev = by.get(s.short);
      if (!prev || RANK[s.status] > RANK[prev]) by.set(s.short, s.status);
    }
    return [...by].map(([name, st]) => `<span class="src"><span class="dot s-${st}" title="${st}"></span>${esc(name)}</span>`).join('');
  };
  $('#coverage').innerHTML = '<div class="table-wrap"><table class="cov"><thead><tr><th>Data</th>' +
    comps.map((c) => `<th title="${esc(c.name)}">${esc(c.short)}</th>`).join('') + '</tr></thead><tbody>' +
    d.coverage.map((row) => `<tr><td>${esc(row.label)}</td>` + row.cells.map((c) => `<td>${cell(c)}</td>`).join('') + '</tr>').join('') +
    '</tbody></table></div>';

  $('#sources-table').innerHTML = '<div class="table-wrap"><table><thead><tr>' +
    '<th>Källa</th><th>Status</th><th>Hämtad</th><th>Data t.o.m.</th><th>Innehåll</th></tr></thead><tbody>' +
    d.sources.map((s) => `<tr>` +
      `<td><strong>${esc(s.provider)}</strong><span class="sub">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}</span></td>` +
      `<td class="num"><span class="dot s-${s.status}"></span>${esc(s.status)}` +
      `${s.lastError ? `<span class="err">${esc(s.lastError)} (${when(s.lastAttempt)})</span>` : ''}</td>` +
      `<td class="num">${when(s.fetchedAt)}<span class="sub">var ${esc(String(s.cadenceHours).replace('.', ','))} h</span></td>` +
      `<td class="num">${s.latestData ? dateOnly(s.latestData) : '–'}</td>` +
      `<td>${val(s.detail)}<span class="sub">verifierad ${dateOnly(s.verified)}</span></td></tr>`).join('') +
    '</tbody></table></div>';

  $('#unmapped').innerHTML = d.unmapped.length
    ? `<strong>Omappade lagnamn</strong> (används inte förrän de lagts in i aliastabellen): ` +
      d.unmapped.map((u) => `${esc(u.name)} <span class="muted">(${esc(u.source)}, ${esc(u.comp)})</span>`).join(', ')
    : 'Alla lagnamn i football-data.co.uk, Understat och FPL är mappade mot ESPN.';
}

function topline(d) {
  const n = d.sources.length;
  const count = (st) => d.sources.filter((s) => s.status === st).length;
  const fresh = count('färsk');
  const issues = [
    count('fel') ? `${count('fel')} med fel` : null,
    count('gammal') ? `${count('gammal')} gamla` : null,
    count('okänt') ? `${count('okänt')} utan data` : null,
  ].filter(Boolean).join(', ');
  const meta = state.meta;
  const ageMin = meta ? (Date.now() - new Date(meta.generatedAt).getTime()) / 60000 : null;
  const late = ageMin != null && ageMin > meta.updateEveryMinutes * 4;
  $('#sources-summary').innerHTML = meta
    ? `Uppdateras automatiskt var ${meta.updateEveryMinutes}:e minut. Senaste bygget: ${when(meta.generatedAt)}.` +
      (late ? ' <span class="err" style="display:inline">Det är ovanligt länge sedan – den schemalagda hämtningen kan ha stannat.</span>' : '')
    : '';
  $('#topline').innerHTML = `Säsong ${esc(meta ? meta.season : '')} · uppdaterad ${meta ? when(meta.generatedAt) : '–'}` +
    `<br><strong>${fresh} av ${n}</strong> källor färska` +
    (issues ? ` · <a href="#kallor">${esc(issues)}</a>` : '') +
    (late ? ' · <span class="err" style="display:inline">datan är gammal</span>' : '');
}

// ---------- start ----------

(async function init() {
  try {
    state.meta = await getJSON('data/meta.json');
    state.comps = new Map(state.meta.competitions.map((c) => [c.id, c]));
  } catch {
    $('#topline').textContent = 'Kunde inte läsa sajtens data.';
  }
  renderChips();
  loadMatches();
  loadSources();
  route();
})();
