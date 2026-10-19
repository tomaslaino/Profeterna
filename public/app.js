'use strict';

// ---------- hjälpare ----------

const TZ = 'Europe/Stockholm';
const $ = (s) => document.querySelector(s);
const state = { comp: 'all', earlier: false, meta: null, comps: new Map(), all: null, detail: null };
const LIST_DAYS = 14;
// Ovanför nu-linjen syns först bara de senaste resultaten: den senaste
// speldagen, högst så här många matcher. Resten ligger bakom en knapp.
const RECENT_ROWS = 4;

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
function pct(x) {
  return x == null ? null : Math.round(x * 100);
}
// Hela procent som summerar till 100 (största rest) – samma regel som bygget.
function pct3(ps) {
  const raw = ps.map((p) => p * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}
function dec(x, d = 1) {
  return x == null ? '–' : x.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function monthYear(iso) {
  return iso ? esc(fmt({ month: 'short', year: 'numeric' }).format(new Date(iso + 'T12:00:00Z'))) : '–';
}

// Nyckeltal som rutor: [etikett, tal, rad under, title]. Samma rutor som Statistik.
function tiles(list) {
  return '<div class="dv-tiles">' + list.filter(Boolean).map(([label, num, sub, what]) =>
    `<div class="dv-tile"${what ? ` title="${esc(what)}"` : ' style="cursor:auto"'}><div class="dv-tile-label">${esc(label)}</div>` +
    `<div class="dv-tile-num">${num}</div>${sub ? `<div class="dv-tile-sub">${sub}</div>` : ''}</div>`).join('') + '</div>';
}

// Metodtexten hopfälld, som ordlistan på Tabeller och Statistik: [term, html].
function method(title, items) {
  return `<details class="help dv-glossary"><summary>${esc(title)}</summary>${defs(items)}</details>`;
}
// Samma lista utan egen vikning, för text som redan ligger i en.
function defs(items) {
  return '<dl class="dv-defs">' + items.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('') + '</dl>';
}

// ---------- flikar och routning ----------

const TABS = {
  matcher: 'matches-section',
  kupong: 'coupon-section',
  kallor: 'sources-section',
  modell: 'model-section',
  // Utvärderingen ligger sist på Modell-sidan; gamla länkar hamnar där.
  utvardering: 'model-section',
};

// Källor och Modell har ingen flik i toppbaren, bara länkar i sidfoten.
// Förstasidan (home-section) har ingen flik heller – dit leder namnet.
function showTab(sectionId) {
  for (const sec of document.querySelectorAll('main > section')) sec.hidden = sec.id !== sectionId;
  for (const btn of document.querySelectorAll('[role="tab"]')) {
    btn.setAttribute('aria-selected', String(btn.dataset.tab === sectionId));
  }
  if (sectionId === 'sources-section') loadSources();
  window.scrollTo(0, 0);
  // Modell-sidan: klar när både modellen och utvärderingen är ritade.
  if (sectionId === 'model-section') return Promise.all([loadModel(), loadEvaluation()]);
}

function route() {
  const h = location.hash.replace(/^#/, '');
  const m = /^match\/(\d+)$/.exec(h);
  if (m) {
    showTab('matches-section');
    openMatch(m[1]);
    return;
  }
  // Kupongen (kupong.js): #kupong, #kupong/historik, #kupong/<id>,
  // #kupong/ny, #kupong/andra/<id>.
  const k = /^kupong(?:\/(.+))?$/.exec(h);
  if (k) {
    showTab('coupon-section');
    showCoupon(k[1] || '');
    return;
  }
  // Förstasidan: utan eller med okänd adress.
  if (!TABS[h]) {
    showTab('home-section');
    showHome();
    return;
  }
  const loading = showTab(TABS[h]);
  $('#match-detail-view').hidden = true;
  $('#match-list-view').hidden = false;
  if (h === 'utvardering') loading.then(() => $('#eval-title').scrollIntoView());
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

async function loadMatches() {
  const el = $('#match-list');
  el.innerHTML = '<p class="empty">Laddar …</p>';
  try {
    state.all = await getJSON('data/matches.json');
    if (window.Spoiler) Spoiler.useMatches(state.all.matches);
    renderMatchList();
  } catch (err) {
    el.innerHTML = `<p class="empty">Kunde inte läsa matcherna: ${esc(err.message)}</p>`;
  }
  // Kupongen väntar på matcherna (kupong.js).
  document.dispatchEvent(new Event('matches-loaded'));
}

// Urvalet görs här, mot besökarens klocka – inte mot när sajten byggdes.
// Spelade matcher hamnar ovanför nu-linjen, kommande under, båda i tidsordning.
function selectMatches(comp, days) {
  const now = Date.now();
  const span = days * 86400000;
  const inComp = (m) => comp === 'all' || m.comp === comp;
  const t = (m) => new Date(m.kickoff).getTime();
  return {
    played: state.all.matches.filter((m) => inComp(m) && m.completed && t(m) >= now - span),
    upcoming: state.all.matches.filter((m) => inComp(m) && !m.completed && t(m) >= now - 3 * 3600000 && t(m) <= now + span),
  };
}

function renderMatchList() {
  if (!state.all) return;
  const el = $('#match-list');
  const { played, upcoming } = selectMatches(state.comp, LIST_DAYS);
  let shown = played;
  if (!state.earlier && played.length) {
    const last = dayKey.format(new Date(played[played.length - 1].kickoff));
    shown = played.filter((m) => dayKey.format(new Date(m.kickoff)) === last).slice(-RECENT_ROWS);
  }
  el.innerHTML = renderList({ played: shown, more: played.length - shown.length, upcoming, days: LIST_DAYS });
  for (const r of el.querySelectorAll('.mrow')) {
    r.addEventListener('click', () => { location.hash = `match/${r.dataset.id}`; });
  }
  const more = el.querySelector('.earlier');
  if (more) more.addEventListener('click', showEarlier);
}

// De tidigare matcherna läggs in ovanför och sidan hålls still, så att det
// man tittade på inte hoppar iväg – man skrollar uppåt för att se dem.
function showEarlier() {
  const anchor = $('#match-list .day');
  const top = anchor ? anchor.getBoundingClientRect().top : 0;
  state.earlier = true;
  renderMatchList();
  const same = anchor && $(`#match-list .day[data-day="${anchor.dataset.day}"]`);
  if (same) window.scrollBy(0, same.getBoundingClientRect().top - top);
  const first = $('#match-list .mrow');
  if (first) first.focus({ preventScroll: true });
}

// Kolumnens nyckel står i första dagens rubrik på var sida om nu-linjen i
// stället för en förklaring.
const KEY_PLAYED = '<span class="day-key" style="float:right;margin-right:20px" title="Resultat, under det prognosen 1 · X · 2 som odds före avspark">Resultat · odds</span>';
const KEY_UPCOMING = '<span class="day-key" style="float:right;margin-right:20px" title="Matchfixarnas odds på hemmaseger · oavgjort · bortaseger efter 90 minuter (1 delat med sannolikheten)">Odds 1 · X · 2</span>';

function renderList(d) {
  if (!d.played.length && !d.upcoming.length) {
    return `<p class="empty">Inga matcher de senaste eller närmaste ${d.days} dagarna.</p>`;
  }
  let html = '';
  if (d.more) {
    html += `<button type="button" class="earlier"><span aria-hidden="true">↑</span> Tidigare matcher <span class="n">${d.more}</span></button>`;
  }
  html += renderDays(d.played, KEY_PLAYED);
  if (d.played.length) html += '<div class="now-line" role="separator"><span>Nu</span></div>';
  html += d.upcoming.length
    ? renderDays(d.upcoming, KEY_UPCOMING)
    : `<p class="empty">Inga kommande matcher de närmaste ${d.days} dagarna.</p>`;
  return html;
}

// En rubrik per dag. Dagens datum kan stå på båda sidor om nu-linjen.
function renderDays(ms, key) {
  const days = new Map();
  for (const m of ms) {
    const k = dayKey.format(new Date(m.kickoff));
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(m);
  }
  const today = dayKey.format(new Date());
  let html = '';
  for (const [k, list] of days) {
    const name = fDay.format(new Date(list[0].kickoff));
    html += `<div class="day" data-day="${esc(k)}"><div class="day-head">${esc(k === today ? `I dag, ${name}` : cap(name))}${key}</div><div class="mlist">`;
    key = '';
    for (const m of list) html += matchRow(m);
    html += '</div></div>';
  }
  return html;
}

function compOf(id) {
  return state.comps.get(id) || { name: id, short: id };
}

// Prognosen som odds på svenskt vis: decimalodds = 1 / sannolikheten, med
// decimalkomma. Räknas från hela procent, samma precision som journalen.
function listOdds(p) {
  return p.map((x) => (x > 0 ? odds(100 / x) : '–'));
}

// Kompakt prognos: 1 · X · 2 som odds, det troligaste utfallet i fetstil.
function listForecast(f) {
  if (!f) return '<span class="unknown">okänt</span>';
  const max = Math.max(...f.p);
  const o = listOdds(f.p);
  return f.p.map((x, i) => (x === max ? `<b>${o[i]}</b>` : o[i])).join(' · ') +
    (f.lower ? ' <span title="Ett lag saknar egen lagdata">*</span>' : '');
}

// Spoilerskyddet (spoiler.js): ska matchens resultat döljas just nu?
function isHidden(m) {
  return Boolean(window.Spoiler && Spoiler.hidden(m));
}

// 1 · X · 2 som en tunn stapel i hemma-, oavgjort- och bortafärg, det
// troligaste utfallet starkast (theme.css .pbar). Används också av kupong.js.
function probBar(p) {
  const max = Math.max(...p);
  return '<span class="pbar" aria-hidden="true">' +
    p.map((x) => `<i style="--w:${x}"${x === max ? ' class="max"' : ''}></i>`).join('') + '</span>';
}

// Slog prognosens troligaste utfall in? Rättas mot ställningen efter 90
// minuter, som utvärderingen; okänd ställning ger null.
function tipHit(m) {
  const s = m.score90 || (/^STATUS_(FULL_TIME|FINAL)$/.test(m.status) ? m.score : null);
  if (!s) return null;
  const res = s.home > s.away ? 0 : s.home < s.away ? 2 : 1;
  return m.j.p.indexOf(Math.max(...m.j.p)) === res;
}

// Journalens odds under resultatet, det troligaste utfallet grönt om det
// slog in och rött om inte. Utan rättning (dold eller okänd): bara oddsen.
function tipOdds(p, hit) {
  const o = listOdds(p);
  if (hit == null) return o.join(' · ');
  const tip = p.indexOf(Math.max(...p));
  const cls = hit ? 'tip-ok' : 'tip-no';
  return o.map((x, i) => (i === tip ? `<b class="${cls}">${x}</b>` : x)).join(' · ') +
    ` <span class="${cls}" title="Prognosens troligaste utfall ${hit ? 'slog in' : 'slog inte in'}">${hit ? '✓' : '✗'}</span>`;
}

function matchRow(m) {
  let side;
  if (m.completed && m.score) {
    if (isHidden(m)) side = Spoiler.chip();
    else {
      side = `<span class="score">${m.score.home}–${m.score.away}</span>`;
      if (m.shootout) side += `<span class="sub">str. ${m.shootout.home}–${m.shootout.away}</span>`;
    }
    if (m.j) side += `<span class="sub" title="Prognosen före avspark, ur journalen">${m.j.p ? tipOdds(m.j.p, isHidden(m) ? null : tipHit(m)) : 'okänt'}</span>`;
    else if (m.f) side += `<span class="sub retro" title="Inte loggad – återskapad i efterhand med underlaget före matchdagen">${listOdds(m.f.p).join(' · ')}</span>`;
  } else {
    side = listForecast(m.f);
    if (m.status === 'STATUS_POSTPONED') side += '<span class="sub">uppskjuten</span>';
    else if (m.f) side += probBar(m.f.p);
  }
  return `<button type="button" class="mrow" data-id="${esc(m.id)}">` +
    `<span class="mtime">${esc(fTime.format(new Date(m.kickoff)))}</span>` +
    `<span class="ctag" title="${esc(compOf(m.comp).name)}">${esc(compOf(m.comp).short)}</span>` +
    `<span class="mteams">${esc(m.home)}<span class="vs">–</span>${esc(m.away)}` +
    `${m.round ? `<span class="sub">${esc(m.round)}</span>` : ''}</span>` +
    `<span class="mside${m.completed && m.score ? '' : ' mside-odds'}">${side}</span></button>`;
}

// ---------- matchvy ----------

async function openMatch(id) {
  const el = $('#match-detail-view');
  $('#match-list-view').hidden = true;
  el.hidden = false;
  el.innerHTML = '<p class="empty">Laddar …</p>';
  try {
    const d = await getJSON(`data/match/${encodeURIComponent(id)}.json`);
    state.detail = d;
    el.innerHTML = renderDetail(d);
    setShowSources(showSources());
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
  const hide = m.completed && isHidden(m);
  let mid;
  let midSub = '';
  if (hide) {
    mid = '';
  } else if (m.completed && m.score) {
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
    `<div class="mhead-mid">${hide ? Spoiler.chip() : esc(mid)}${midSub ? `<span class="sub">${esc(midSub)}</span>` : ''}</div>` +
    `<div class="mhead-team away">${esc(m.away)}</div></div>` +
    (m.tierNote ? `<p class="note">${esc(m.tierNote)}</p>` : '') + '</div>';

  // Dold match: bara rubriken – prognosens rättning och underlaget efter
  // matchen avslöjar resultatet.
  if (hide) {
    return html + Spoiler.card({ title: 'Resultatet är dolt', text: 'Spoilerskyddet är på.', keys: [m.id], button: 'Visa resultatet' });
  }

  // Spelad match med prognos före avspark: den återskapade prognosen och dess
  // jämförelse upprepar samma sak och visas bara med detaljerna.
  const logged = m.completed && d.journal && d.journal.counted;
  const detailOnly = (s) => (logged && s ? `<div class="src-only">${s}</div>` : s);
  if (logged) html += journalCard(d);
  html += detailOnly(forecastCard(d));
  html += analysisCard(d);
  if (d.prediction && d.prediction.status === 'ok') {
    html += '<div class="grid2">' + detailOnly(compareCard(d)) + stepsCard(d) + '</div>';
  }

  html += '<h3 class="underlag">Underlag</h3>';
  html += '<div class="grid2">' + oddsCard(d.odds, m) + formCard(d) + '</div>';
  html += sideCard(d);
  html += '<div class="grid2">' + refereeCard(d) + squadCard(d) + '</div>';
  html += squadsSection(d);
  html += '<div class="grid2 src-only">' + unknownCard(d) + '</div>';
  html += '<p class="detail-foot"><button type="button" class="src-toggle" aria-pressed="false">Visa detaljer</button>' +
    '<a href="#modell">Så fungerar modellen</a></p>';
  return html;
}

// ---------- prognos ----------

function forecastCard(d) {
  const p = d.prediction;
  const m = d.match;
  if (!p) return '<div class="card fc"><h4>Prognos</h4><p class="unknown">okänt – prognosmotorn gav ingen prognos för matchen.</p></div>';
  if (p.status !== 'ok') {
    return `<div class="card fc"><h4>Prognos</h4><p class="unknown">okänt</p><ul class="bullets">` +
      (p.reasons || []).map((r) => `<li>${esc(r)}</li>`).join('') + '</ul></div>';
  }
  const stats = [
    `Förväntade mål <b>${dec(p.goals[0])}–${dec(p.goals[1])}</b>`,
    `Över 2,5 mål <b>${pct(p.over25)} %</b>${p.baselines.market && p.baselines.market.over25 != null ? ` <span class="muted">(marknaden ${pct(p.baselines.market.over25)} %)</span>` : ''}`,
    `Båda lagen gör mål <b>${pct(p.btts)} %</b>`,
  ];
  let adv = '';
  if (p.advance) {
    adv = p.advance.home == null
      ? `<p class="fc-adv">Går vidare: <span class="unknown">okänt – ${esc(p.advance.reason || '')}</span></p>`
      : `<p class="fc-adv">Går vidare: <b>${esc(m.home)} ${pct3([p.advance.home, p.advance.away])[0]} %</b> · <b>${esc(m.away)} ${pct3([p.advance.home, p.advance.away])[1]} %</b>` +
        `<span class="sub">${esc(p.advance.rule)}${p.advance.firstLeg ? ` · första mötet ${esc(p.advance.firstLeg.home)} ${p.advance.firstLeg.score.home}–${p.advance.firstLeg.score.away} ${esc(p.advance.firstLeg.away)}` : ''}</span></p>`;
  }
  const notes = (p.notes || []).map((n) => `<p class="note">${esc(n)}</p>`).join('');
  const basis = (t) => (t.basis === 'eget'
    ? `${esc(t.name)} ${t.matches} matcher sedan ${monthYear(t.since)}, ${t.seasonMatches} i år`
    : `${esc(t.name)} <span class="lower-tag">nivåsnitt</span> ${t.matches} FA-cupmatcher för lag under National League sedan ${monthYear(t.since)}`);
  const head = m.completed
    ? `Återskapad i efterhand med underlaget före matchdagen (t.o.m. ${dateOnly(p.fitThrough)})`
    : `Skattad på matcher t.o.m. ${dateOnly(p.fitThrough)}`;
  return `<div class="card fc"><h4>${m.completed ? 'Återskapad prognos' : 'Prognos efter 90 minuter'} <span class="hint">${esc(head)}</span></h4>` +
    fcMain(p.p, [m.home, 'Oavgjort', m.away], p.range) +
    `<p class="fc-stats">${stats.join(' · ')}</p>${adv}${scoreGrid(p, m)}${notes}` +
    `<p class="src-line">Skattat på ${basis(p.teams.home)}; ${basis(p.teams.away)}. Regelversion ${esc(p.rulesVersion)}.${journalLine(d)}</p></div>`;
}

// 1 · X · 2 i hela procent med stapel; range = osäkerhetsspannet om det finns.
function fcMain(p, labels, range) {
  const w = pct3(p);
  const cols = w.map((x, i) => {
    const r = range && range[i];
    return `<div class="fc-col${i === 1 ? ' draw' : ''}"><div class="fc-label">${esc(labels[i])}</div>` +
      `<div class="fc-num">${x} %</div>` +
      `<div class="fc-range"${r ? ' title="Osäkerheten i lagens styrka (omskattning med slumpvikter)"' : ''}>${r ? `${pct(r[0])}–${pct(r[1])}` : '&nbsp;'}</div></div>`;
  }).join('');
  const bar = `<div class="fc-bar" aria-hidden="true">${w.map((x, i) => `<span class="s${i}" style="width:${x}%"></span>`).join('')}</div>`;
  return `<div class="fc-main">${cols}</div>${bar}`;
}

// Kommande match: när prognosen senast loggades i journalen.
function journalLine(d) {
  if (d.match.completed) return '';
  const j = d.journal;
  if (j && j.latestAt) return ` Loggad i journalen ${when(j.latestAt)}${j.rows > 1 ? ` (${j.rows} rader)` : ''}.`;
  const h = state.meta && state.meta.journalHorizonDays;
  if (!h) return '';
  const days = (new Date(d.match.kickoff).getTime() - Date.now()) / 86400000;
  return days > h ? ` Loggas i journalen ${h} dagar före avspark.` : ' Loggas i journalen vid nästa bygge.';
}

// Spelad match med journalpost: den äkta prognosen före avspark (den sista
// raden före avspark), rättad mot facit, och skillnaden mot den återskapade.
function journalCard(d) {
  const j = d.journal;
  const r = j.counted;
  const m = d.match;
  const head = `loggad ${when(r.loggedAt)} · regelversion ${esc(r.rulesVersion)}`;
  const foot = `<p class="src-line">${j.rows} ${j.rows === 1 ? 'rad' : 'rader'} i journalen, den sista före avspark räknas` +
    `${j.after ? ` · ${j.after} efter avspark räknas inte` : ''} · underlag t.o.m. ${dateOnly(r.fitThrough)} · <a href="#utvardering">Utvärderingen</a></p>`;
  if (r.status !== 'ok') {
    return `<div class="card fc"><h4>Prognos före avspark <span class="hint">${head}</span></h4><p class="unknown">okänt</p><ul class="bullets">` +
      (r.reasons || []).map((x) => `<li>${esc(x)}</li>`).join('') + `</ul>${foot}</div>`;
  }
  const stats = [
    `Förväntade mål <b>${dec(r.goals[0])}–${dec(r.goals[1])}</b>`,
    `Över 2,5 mål <b>${pct(r.over25)} %</b>${r.market && r.market.over25 != null ? ` <span class="muted">(marknaden ${pct(r.market.over25)} %)</span>` : ''}`,
    `Båda lagen gör mål <b>${pct(r.btts)} %</b>`,
  ];
  let adv = '';
  if (r.advance !== undefined) {
    const a = r.advance && pct3(r.advance);
    adv = a
      ? `<p class="fc-adv">Går vidare: <b>${esc(m.home)} ${a[0]} %</b> · <b>${esc(m.away)} ${a[1]} %</b>` +
        `${j.advanced ? `<span class="sub">${esc(j.advanced === 'home' ? m.home : m.away)} gick vidare</span>` : ''}</p>`
      : '<p class="fc-adv">Går vidare: <span class="unknown">okänt</span></p>';
  }
  const scores = j.scores ? scoreTable(j, r, m)
    : `<p class="unknown">${m.score90 ? '' : 'Ställningen efter 90 minuter är okänd – utvärderas inte.'}</p>`;
  let retro = '';
  if (d.prediction && d.prediction.status === 'ok') {
    const a = pct3(r.p);
    const b = pct3(d.prediction.p);
    const s = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '±0');
    retro = `<p class="src-line">Återskapad i efterhand: ${b.join(' · ')} <span class="muted">(${b.map((x, i) => s(x - a[i])).join(' · ')} mot före avspark)</span></p>`;
  }
  return `<div class="card fc"><h4>Prognos före avspark <span class="hint">${head}</span></h4>` +
    fcMain(r.p, [m.home, 'Oavgjort', m.away], null) +
    `<p class="fc-stats">${stats.join(' · ')}</p>${adv}${scores}${retro}${foot}</div>`;
}

// Baslinjernas namn på matchsidan, i klarspråk. Bokstäverna (a)–(c) som
// Modell och Utvärdering använder står i källraden under namnet.
const BASE = {
  market: 'Spelbolagen',
  closing: 'Spelbolagen vid avspark',
  season: 'Bara årets mål',
  naive: 'Ligasnittet',
};

// Prognosen och baslinjerna vid loggningen, rättade mot ställningen efter
// 90 minuter. Stängningen är marknaden vid avspark (ligamatcher).
function scoreTable(j, r, m) {
  const o = j.outcome;
  const mk = r.market;
  const lines = [
    ['<strong>Modellen</strong>', null, 'model', 'model'],
    [BASE.market, mk ? `(c) ${esc(mk.source)}, ${esc(mk.kind)}${mk.fetchedAt ? `, hämtat ${when(mk.fetchedAt)}` : ''}` : 'okänt vid loggningen', 'market'],
    [BASE.closing, 'Betfair Exchange, marknaden vid avspark', 'closing'],
    [BASE.season, null, 'season'],
    [BASE.naive, null, 'naive'],
  ];
  const rows = lines.map(([label, sub, key, cls]) => {
    const s = j.scores[key];
    if (!s && key === 'closing') return '';
    const head = `<td>${label}${sub ? `<span class="sub src-sub">${sub}</span>` : ''}</td>`;
    if (!s) return `<tr>${head}<td colspan="5" class="num unknown">okänt</td></tr>`;
    return `<tr class="${cls || ''}">${head}${pct3(s.p).map((v, k) => `<td class="num${k === o ? ' hit' : ''}">${v}</td>`).join('')}` +
      `<td class="num src-only">${dec(s.logLoss, 2)}</td><td class="num src-only">${dec(s.brier, 2)}</td></tr>`;
  }).join('');
  return `<table class="odds cmp facit"><thead><tr><th>Efter 90 min ${m.score90.home}–${m.score90.away}</th><th class="num">1</th><th class="num">X</th><th class="num">2</th>` +
    `<th class="num src-only">Log</th><th class="num src-only">Brier</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function scoreGrid(p, m) {
  const g = p.scores.grid;
  const max = Math.max(...g.flat());
  let rows = `<tr><th></th>${g[0].map((_, j) => `<th>${j}</th>`).join('')}</tr>`;
  g.forEach((row, i) => {
    rows += `<tr><th>${i}</th>${row.map((x) => {
      const v = pct(x);
      const a = Math.round((x / max) * 100);
      return `<td style="--a:${a}%">${v >= 1 ? v : '<1'}</td>`;
    }).join('')}</tr>`;
  });
  const top = p.scores.top.map((t) => `${t.home}–${t.away} ${pct(t.p)} %`).join(', ');
  return `<details class="fc-scores"><summary>Resultat: troligast ${esc(top)}</summary>` +
    `<div class="sgrid-wrap"><p class="muted">Procent · rader ${esc(m.home)} · kolumner ${esc(m.away)}</p><table class="sgrid">${rows}</table>` +
    `<p class="muted">5 mål eller fler för ett lag: ${pct(p.scores.other)} %</p></div></details>`;
}

function compareCard(d) {
  const p = d.prediction;
  const b = p.baselines;
  const rows = [];
  const row = (label, sub, x, cls = '') => rows.push(`<tr class="${cls}"><td>${label}${sub ? `<span class="sub src-sub">${sub}</span>` : ''}</td>` +
    (x ? pct3(x).map((v) => `<td class="num">${v}</td>`).join('') : '<td colspan="3" class="num unknown">okänt</td>') + '</tr>');
  row('<strong>Modellen</strong>', null, p.p, 'model');
  const mk = b.market;
  row(BASE.market, mk ? `(c) ${esc(mk.source)}, ${esc(mk.kind)}${mk.fetchedAt ? `, hämtat ${when(mk.fetchedAt)}` : ''}` : esc(marketMissing(d)), mk && mk.p);
  if (b.closing) row(BASE.closing, 'Betfair Exchange, tuffaste referensen', b.closing.p);
  row(BASE.season, b.season.p ? `(b) Poisson på årets matcher (${b.season.matches[0]} resp. ${b.season.matches[1]})` : esc(b.season.reason), b.season.p);
  row(BASE.naive, b.naive.p ? `(a) ${esc(b.naive.scope)}, ${esc(b.naive.seasons[0])}–${esc(b.naive.seasons[1])}` : esc(b.naive.reason), b.naive.p);
  let diff = '';
  if (mk && mk.p) {
    const a = pct3(p.p);
    const c = pct3(mk.p);
    const s = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '±0');
    diff = `<p class="src-line">Modell − marknad: ${s(a[0] - c[0])} · ${s(a[1] - c[1])} · ${s(a[2] - c[2])} procentenheter</p>`;
  }
  return `<div class="card"><h4>Jämförelse</h4><table class="odds cmp"><thead><tr><th></th><th class="num">1</th><th class="num">X</th><th class="num">2</th></tr></thead>` +
    `<tbody>${rows.join('')}</tbody></table>${diff}</div>`;
}

function marketMissing(d) {
  if (d.match.type === 'cup') return d.odds.note || 'DraftKings har inga odds för matchen';
  return d.match.completed ? 'inga öppningsodds sparade för matchen' : 'football-data.co.uk har inga odds för matchen ännu (läggs ut fre/tis)';
}

// Steg för steg: vad varje del av modellen gör med prognosen.
function stepsCard(d) {
  const st = d.prediction.steps;
  if (!st) return '';
  const m = d.match;
  let prev = null;
  const rows = st.map((x) => {
    const w = pct3(x.p);
    let pull = '';
    if (prev) {
      const d1 = x.p[0] - prev.p[0];
      const d2 = x.p[2] - prev.p[2];
      const [team, dv] = d1 >= d2 ? [m.home, d1] : [m.away, d2];
      const v = Math.round(dv * 100);
      pull = v >= 1 ? `<span class="pull ${d1 >= d2 ? 'h' : 'a'}" title="${esc(team)}"><span class="t">${esc(team)} </span>+${v}</span>` : '<span class="muted">–</span>';
    }
    prev = x;
    return `<tr><td>${esc(x.label)}${x.sub ? `<span class="sub">${esc(x.sub)}</span>` : ''}</td>` +
      w.map((v) => `<td class="num">${v}</td>`).join('') + `<td class="num">${pull}</td></tr>`;
  }).join('');
  return `<div class="card"><h4>Vad drog åt vilket håll</h4><table class="odds steps"><thead><tr><th></th><th class="num">1</th><th class="num">X</th><th class="num">2</th><th class="num" title="Procentenheter som steget lägger på lagets segerchans">drar mot</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`;
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
      ? f.map((x) => (window.Spoiler && Spoiler.hidesDay(x.date)
        ? '<span class="sp-form" title="Dold av spoilerskyddet">?</span>'
        : `<span class="${x.result || ''}" title="${esc(`${x.date} ${x.comp} ${x.home ? 'hemma' : 'borta'}${x.opponent ? ` mot ${x.opponent}` : ''}: ${x.gf}–${x.ga}${x.decided ? ` (${x.decided})` : ''}`)}">${x.result || '?'}</span>`)).join('')
      : '<span class="muted" style="width:auto;background:none;font-weight:400">inga tidigare matcher</span>';
    return `<div class="form-row"><span class="t">${esc(name)}</span><span class="form">${chips}</span></div>`;
  };
  let html = `<div class="card"><h4>Form, senaste ${5} <span class="hint">nyast först</span></h4>` +
    row(d.match.home, d.teams.home) + row(d.match.away, d.teams.away);
  if (d.meetings.length) {
    html += '<h4 style="margin-top:0.9rem">Möten i år</h4><ul class="plain">' +
      d.meetings.map((x) => `<li>${dateOnly(x.kickoff)} · ${esc(x.compShort)} · ${esc(x.home)} ${x.score.home}–${x.score.away} ${esc(x.away)}</li>`).join('') + '</ul>';
  }
  html += '<p class="src-line">ESPN, alla tävlingar inkl. Europacuperna · efter 90 minuter, straffavgjort = oavgjort</p>';
  const pm = d.pastMeetings;
  if (pm) {
    html += `<h4 style="margin-top:0.9rem">Tidigare säsonger <span class="hint">senaste ${pm.list.length || ''}</span></h4>` +
      (pm.list.length
        ? '<ul class="plain">' + pm.list.map((x) => `<li>${esc(x.season)} · ${esc(x.compShort)} · ${esc(x.home)} ${x.score.home}–${x.score.away} ${esc(x.away)}</li>`).join('') + '</ul>'
        : `<p class="muted" style="margin:0">Inga möten i ligorna sedan ${esc(pm.first)} eller i FA-cupen sedan 2021/22.</p>`) +
      `<p class="src-line">${esc(pm.source.provider)}, hämtat ${when(pm.source.fetchedAt)} · efter 90 minuter</p>`;
  }
  html += '</div>';
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
    rows += `<tr class="group"><td colspan="3">${esc(g.title)}${srcTxt ? `<span class="sub src-sub">${srcTxt}</span>` : ''}</td></tr>`;
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

// Domaren (football-data.co.uk): hans eller hennes ligamatcher före
// matchdagen mot divisionens snitt under samma period.
function refereeCard(d) {
  const r = d.referee;
  if (!r) return '';
  if (r.unknown) return `<div class="card src-only"><h4>Domaren</h4><p class="unknown" style="margin:0">okänt – ${esc(r.reason)}</p></div>`;
  const s = r.stats;
  const a = r.avg;
  const divs = r.divisions.map((x) => `${esc(x.short)} ${x.n}`).join(', ');
  let html = `<div class="card"><h4>Domaren</h4><p class="ref-name"><strong>${esc(r.name)}</strong>` +
    (s.n ? ` · ${s.n} ligamatcher sedan ${monthYear(r.since)}${divs ? ` <span class="muted">(${divs})</span>` : ''}` : ' · inga ligamatcher i underlaget') + '</p>';
  if (s.n) {
    const flag = (f) => (f === 'more' ? ' <span class="ref-flag" title="Mer än två standardfel över snittet">▲</span>'
      : f === 'less' ? ' <span class="ref-flag" title="Mer än två standardfel under snittet">▼</span>' : '');
    const rows = [
      ['Gula kort per match', dec(s.yellow, 1) + flag(r.flags.yellow), a && dec(a.yellow, 1)],
      ['Röda kort per match', dec(s.red, 2), a && dec(a.red, 2)],
      ['Frisparkar per match', s.fouls == null ? '–' : dec(s.fouls, 1), a && a.fouls != null ? dec(a.fouls, 1) : null],
      ['Hemmaseger', `${pct(s.home)} %` + flag(r.flags.home), a && `${pct(a.home)} %`],
    ];
    html += `<table class="odds"><thead><tr><th></th><th class="num">Domaren</th><th class="num">Snitt ${esc(a ? d.match.compShort : '')}</th></tr></thead><tbody>` +
      rows.map(([k, v, w]) => `<tr><td>${k}</td><td class="num"><b>${v}</b></td><td class="num muted">${w == null ? '–' : w}</td></tr>`).join('') + '</tbody></table>';
    if (s.n < r.min) html += `<p class="note">För få matcher för att dra slutsatser.</p>`;
  }
  html += `<p class="src-line">${esc(r.source.provider)}, hämtat ${when(r.source.fetchedAt)}. Ligamatcher nivå 1–5 de senaste ${r.seasons} avslutade säsongerna och i år, före matchdagen. ` +
    'Båda lagens kort tillsammans. ▲▼ = mer än två standardfel från snittet; annars är skillnaden inom slumpen. Domaren styr inte prognosen.</p></div>';
  return html;
}

function unknownCard(d) {
  return `<div class="card"><h4>Okänt för den här matchen</h4><ul class="bullets">` +
    d.unknowns.map((u) => `<li>${esc(u)}</li>`).join('') + '</ul></div>';
}

// ---------- trupperna (ESPN, ligamatcher i år) ----------

const POS_NAME = { MV: 'Målvakter', B: 'Backar', MF: 'Mittfältare', A: 'Anfallare' };
const COMP_PAGE = { pl: 'pl', ch: 'ch', l1: 'l1', l2: 'l2' };

function squadsSection(d) {
  const s = d.squads;
  if (!s) return '';
  return '<h3 class="underlag">Trupperna</h3>' +
    `<div class="grid2">${teamSquadCard(d.match.home, s.home)}${teamSquadCard(d.match.away, s.away)}</div>`;
}

function keyList(title, list, value, empty) {
  return `<div class="mv-key"><h5>${esc(title)}</h5>` + (list.length
    ? `<ol>${list.map((p) => `<li><span class="n">${esc(p.name)}</span><span class="v">${value(p)}</span></li>`).join('')}</ol>`
    : `<p class="muted">${esc(empty)}</p>`) + '</div>';
}

function teamSquadCard(name, s) {
  if (!s || s.unknown) {
    return `<div class="card mv-squad"><h4>${esc(name)}</h4><p class="unknown">okänt – ${esc(s ? s.reason : 'ingen spelardata')}</p></div>`;
  }
  const t = s.summary;
  const facts = [
    t.avgAge != null ? `snittålder <b>${dec(t.avgAge)}</b> år` : null,
    `<b>${t.used}</b> spelare har spelat`,
    t.topScorer && t.topScorer.g ? `${esc(t.topScorer.name)} <b>${pct(t.topScorerShare)} %</b> av målen` : null,
  ].filter(Boolean).join(' · ');
  const yc = (p) => `<i class="mv-yc"></i>${p.yc}${p.rc ? ` <i class="mv-rc"></i>${p.rc}` : ''}`;
  const byPos = {};
  for (const p of s.players) (byPos[p.pos || '?'] = byPos[p.pos || '?'] || []).push(p);
  const v = (x, strong) => (x == null ? '<span class="muted">–</span>' : x === 0 ? '<span class="muted">0</span>' : strong ? `<b>${x}</b>` : x);
  const rows = ['MV', 'B', 'MF', 'A', '?'].filter((k) => byPos[k]).map((k) =>
    `<tr class="group"><td colspan="6">${esc(POS_NAME[k] || 'Okänd position')}</td></tr>` +
    byPos[k].map((p) => `<tr${p.app ? '' : ' class="idle"'}><td>${p.jersey ? `<span class="muted">${esc(p.jersey)}</span> ` : ''}${esc(p.name)}</td>` +
      `<td class="num">${v(p.app)}</td><td class="num">${v(p.g, true)}</td><td class="num">${v(p.a)}</td><td class="num">${v(p.yc)}</td><td class="num">${v(p.rc)}</td></tr>`).join('')).join('');
  const cov = t.coverage;
  const page = COMP_PAGE[s.comp];
  return `<div class="card mv-squad"><h4>${esc(name)}</h4><p class="mv-facts">${facts}</p>` +
    '<div class="mv-keys">' +
    keyList('Målskyttar', s.key.scorers.filter((p) => p.g > 0), (p) => `<b>${p.g}</b>`, 'inga mål än') +
    keyList('Assist', s.key.creators.filter((p) => p.a > 0), (p) => `<b>${p.a}</b>`, 'inga assist än') +
    keyList('Flest gula kort', s.key.cards, yc, 'ingen med 3 eller fler') +
    '</div>' +
    `<details class="mv-full"><summary>Hela truppen (${s.players.length})</summary><div class="table-wrap"><table class="odds mv-table">` +
    '<thead><tr><th>Spelare</th><th class="num" title="Matcher">M</th><th class="num">Mål</th><th class="num" title="Assist">Ass</th><th class="num" title="Gula kort">Gul</th><th class="num" title="Röda kort">Röd</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div></details>` +
    `<p class="src-line">ESPN · ligamatcher i år · hämtat ${when(s.source.fetchedAt)}${cov.behind ? ` · ${cov.covered} av ${cov.matches} matcher införda` : ''}` +
    `${page ? ` · <a href="statistik.html#${page}/spelare">Alla spelare</a>` : ''}</p></div>`;
}

// ---------- matchanalys (fas 5, valfri) ----------

// Senaste svaret från analysen per match (text eller fel).
const analyses = new Map();

// Knappen finns bara när bygget pekat ut en analys (meta.analysis) och matchen
// är kommande med en prognos – annars renderas inget alls.
function analysisOn(d) {
  const a = state.meta && state.meta.analysis;
  const m = d.match;
  return Boolean(a && a.endpoint && !m.completed && m.status === 'STATUS_SCHEDULED' &&
    Date.parse(m.kickoff) > Date.now() && d.prediction && d.prediction.status === 'ok');
}

function analysisCard(d) {
  if (!analysisOn(d)) return '';
  const a = state.meta.analysis;
  const r = analyses.get(d.match.id);
  if (r && r.ok) {
    const other = r.builtAt && d.builtAt && r.builtAt !== d.builtAt
      ? ' Sidan visar ett annat bygge – ladda om för samma underlag.' : '';
    return `<div class="card analysis" id="analysis-card"><h4>Analys <span class="hint">genererad text</span></h4>` +
      `<p class="analysis-text">${esc(r.text).replace(/(\d) %/g, '$1&nbsp;%')}</p>` +
      (r.news ? newsSection(r.news) : '') +
      `<p class="src-line">Skriven av ${esc(r.model)} ${when(r.generatedAt)} ur underlaget från bygget ${when(r.builtAt)}. ` +
      `Alla tal i texten finns i underlaget.${other}</p></div>`;
  }
  // retry: false = svaret klarade inte kontrollen; samma underlag ger samma svar.
  const final = r && r.retry === false;
  return `<div class="card analysis" id="analysis-card"><h4>Analys <span class="hint">${esc(a.model)}</span></h4>` +
    (r ? `<p class="unknown">Ingen analys: ${esc(r.error || 'okänt fel')}${final ? ' En ny text kan skrivas när underlaget ändrats.' : ''}</p>` : '') +
    (final ? '' : `<button type="button" class="analyze" data-id="${esc(d.match.id)}" title="${a.news
      ? 'En språkmodell skriver ur underlaget på sidan och nyheter som hämtas online – en text med ett tal som inte finns där visas inte'
      : 'En språkmodell skriver bara ur underlaget på sidan – en text med ett tal som inte finns där visas inte'}">${r ? 'Försök igen' : 'Analysera'}</button>`) + '</div>';
}

// Nyhetsläget: eget avsnitt under analysen, som Redaktionens analys på
// gravergrav.se – upphöjda hänvisningar [1], [2] … och en numrerad källista
// med bara de citerade artiklarna. Hänvisningen länkar direkt till artikeln
// (ett #-ankare skulle byta vy, sidan navigerar med #match/…).
function newsSection(n) {
  const src = new Map(n.sources.map((s) => [String(s.n), s]));
  const href = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : null);
  const link = (k) => {
    const s = src.get(k);
    const u = s && href(s.url);
    return u ? `<a href="${u}" target="_blank" rel="noopener" title="${esc(`${s.source}: ${s.title}`)}">${k}</a>` : k;
  };
  const refs = (t) => t.replace(/\[(\d+(?:, \d+)*)\]/g, (m, ks) => `<sup class="ref">${ks.split(', ').map(link).join(',')}</sup>`);
  const paras = n.text.split(/\n\s*\n/).filter((p) => p.trim())
    .map((p) => `<p class="analysis-text">${refs(esc(p.trim())).replace(/(\d) %/g, '$1&nbsp;%')}</p>`).join('');
  const list = n.sources.length
    ? '<ol class="news-sources">' + n.sources.map((s) => {
      const u = href(s.url);
      const title = u ? `<a href="${u}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title);
      return `<li value="${s.n}">${title} <span class="muted">${esc(s.source)} · ${dateOnly(s.publishedAt)}</span></li>`;
    }).join('') + '</ol>'
    : '';
  const lead = n.gatheredAt ? `Ur nyheter hämtade ${when(n.gatheredAt)} – rapporterat` : 'Rapporterat';
  return `<div class="analysis-news"><h5>Nyhetsläget</h5>${paras}${list}` +
    `<p class="src-line">${lead} i media, inte kontrollerat av Matchfixarna och inte med i prognosen.</p></div>`;
}

async function runAnalysis(id, btn) {
  btn.disabled = true;
  btn.textContent = 'Skriver … (kan ta en minut)';
  let r;
  try {
    const res = await fetch(state.meta.analysis.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    r = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  } catch {
    r = { ok: false, error: 'analysen gick inte att nå.' };
  }
  analyses.set(id, r);
  const d = state.detail;
  if (!d || d.match.id !== id || location.hash !== `#match/${id}`) return;
  // Texten och sidan ska bygga på samma underlag: är sidan från ett annat bygge
  // än det analysen läste ur laddas matchen om (förbi CDN-cachen).
  if (r.ok && r.builtAt && r.builtAt !== d.builtAt) {
    try {
      const fresh = await getJSON(`data/match/${encodeURIComponent(id)}.json?b=${encodeURIComponent(r.builtAt)}`);
      if (location.hash === `#match/${id}`) {
        state.detail = fresh;
        $('#match-detail-view').innerHTML = renderDetail(fresh);
      }
      return;
    } catch {
      // Visa texten ändå – kortet säger att sidan visar ett annat bygge.
    }
  }
  const card = $('#analysis-card');
  if (card) card.outerHTML = analysisCard(d);
}

$('#match-detail-view').addEventListener('click', (e) => {
  const b = e.target.closest('button.analyze');
  if (b && !b.disabled) runAnalysis(b.dataset.id, b);
  if (e.target.closest('button.src-toggle')) setShowSources(!showSources());
});

// Källraderna, de små rubriktilläggen och det som är okänt (.src-sub,
// .src-only) på matchsidan är dolda tills man ber om dem; valet sparas på
// enheten.
function showSources() {
  try { return localStorage.getItem('visaKallor') === '1'; } catch { return false; }
}
function setShowSources(on) {
  try { localStorage.setItem('visaKallor', on ? '1' : '0'); } catch { /* inget lagringsutrymme */ }
  const el = $('#match-detail-view');
  el.classList.toggle('show-src', on);
  const b = el.querySelector('button.src-toggle');
  if (b) { b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Dölj detaljer' : 'Visa detaljer'; }
}

// ---------- utvärdering ----------

async function loadEvaluation() {
  const el = $('#evaluation');
  try {
    el.innerHTML = renderEvaluation(await getJSON('data/evaluation.json'));
  } catch (err) {
    el.innerHTML = `<p class="empty">Kunde inte läsa utvärderingen: ${esc(err.message)}</p>`;
  }
}

const f3 = (x) => dec(x, 3);
const n0 = (x) => x.toLocaleString('sv-SE');
// Med tecken: +0,022 / −0,034 / ±0,000
function sgn(x, d = 3) {
  const v = dec(Math.abs(x), d);
  return Math.round(Math.abs(x) * 10 ** d) === 0 ? `±${v}` : x > 0 ? `+${v}` : `−${v}`;
}

function renderEvaluation(d) {
  const min = d.minMatches;
  let html = '';
  if (d.error) html += `<p class="err">Utvärderingen fallerade i senaste bygget: ${esc(d.error)}</p>`;
  const j = d.journal;
  if (!j) return html + '<p class="unknown">okänt – journalen kunde inte läsas.</p>';
  if (!j.rows) {
    return html + `<p class="unknown">Journalen är tom än – matcher loggas ${j.horizonDays} dagar före avspark.</p>`;
  }

  const c = d.counts;
  const extra = [
    c.noScore ? `${c.noScore} med okänd ställning efter 90 minuter` : null,
    c.modelUnknown ? `${c.modelUnknown} där modellen sa okänt` : null,
    c.lateOnly ? `${c.lateOnly} loggade först efter avspark` : null,
  ].filter(Boolean);
  html += tiles([
    ['Matcher', n0(j.matches), `loggade sedan ${dateOnly(j.firstLoggedAt)}`, `${n0(j.rows)} rader i journalen, loggade ${when(j.firstLoggedAt)} – ${when(j.lastLoggedAt)}`],
    ['Utvärderade', n0(c.evaluated),
      c.evaluated ? (extra.length ? `utanför: ${extra.join(', ')}` : 'spelade matcher')
        : d.next ? `först ut: ${esc(d.next.home)}–${esc(d.next.away)}, ${when(d.next.kickoff)}` : 'ingen spelad än',
      `Snitt och skillnader visas från ${min} matcher`],
  ]);
  if (c.missed) html += `<p class="err">${c.missed} ${c.missed === 1 ? 'match' : 'matcher'} spelades efter att journalen startade utan att loggas.</p>`;

  // Det viktigaste syns direkt; resten, metoden med, ligger i en enda vikning.
  // Före minsta underlaget räcker en rad i stället för tabeller med "för få".
  let more = '';
  if (c.evaluated) {
    html += d.overall.model
      ? '<h3>Jämförelse <span class="hint">lägre är bättre</span></h3>' + overallTable(d.overall, min)
      : `<p class="legend">Snittet visas när ${min} matcher är spelade – ${n0(d.overall.n)} hittills.</p>`;
    html += '<h3>Senast utvärderade</h3>' + recentTable(d.recent);
    if (d.calibration.bins.some((b) => b.freq != null)) html += '<h3>Kalibrering</h3>' + calibrationBlock(d.calibration);
    more += '<h3>Per tävling</h3>' + breakdownTable(d.byComp.map((g) => ({ ...g, label: esc(g.name) })), min);
    more += '<h3>Per regelversion</h3>' + breakdownTable(d.byVersion.map((g) => ({ ...g, label: `<span class="num">${esc(g.version)}</span>` })), min);
    more += '<h3>Att gå vidare</h3>' + advanceTable(d.advance, min);
    more += '<h3>Värdespel</h3>' + valueTable(d, d.minBets);
  }
  more += '<h3>Journalen</h3>' + journalTable(j);
  more += '<h3>Så räknas det</h3>' + defs([
    ['Journalen', 'Varje prognos loggas före avspark och skrivs aldrig om. Ny rad när prognosen ändrats på den precision sidan visar, eller när marknadens odds ändrats.'],
    ['Facit', 'Den sista raden före avspark räknas, mot ställningen efter 90 minuter.'],
    ['Log-poäng, Brier', 'Hur väl sannolikheterna träffade. Lägre är bättre.'],
    ['Skillnad', 'Modell − baslinje i log-poäng med 95 % bootstrap-intervall; negativ = modellen bättre. Varje rad jämför på de matcher där båda fanns.'],
    ['Minsta underlag', `Snitt och skillnader visas från ${min} matcher – före dess är underlaget för litet för att säga något.`],
    ['Jämförelsen', `${BASE.market} är (c), ${BASE.season.toLowerCase()} (b) och ${BASE.naive.toLowerCase()} (a) – se Baslinjerna ovan.`],
    ['Kalibrering', 'Varje match ger tre prognoser – hemmaseger, oavgjort och bortaseger – som sorteras i korgar om tio procentenheter. ' +
      `Strecket är ett 95 %-intervall${d.minBin ? `; korgar med färre än ${d.minBin} prognoser visas inte i kurvan` : ''}.`],
    ['Att gå vidare', 'Modellens sannolikhet att gå vidare mot vem som gick vidare (förlängning och straffar inräknade), jämfört med slantsingling. Dubbelmöten (EFL-cupens semifinaler) utvärderas inte än.'],
    ['Värdespel', 'Teoretiskt: 1 insatt på varje utfall där modellens sannolikhet gånger marknadens odds i journalraden är större än 1, vinst eller förlust per 100 insatta' +
      `${d.minBets ? ` (visas från ${d.minBets} spel)` : ''}. Ligorna mot marknadssnittet, cuperna mot DraftKings. Inte ett mått på hur bra prognoserna är.`],
  ]);
  html += `<details class="more"><summary>Fler tabeller och förklaringar</summary>${more}</details>`;
  return html;
}

function overallTable(g, min) {
  const head = g.model
    ? `<p class="legend">Modellen: log-poäng <strong>${f3(g.model.logLoss)}</strong> · Brier <strong>${f3(g.model.brier)}</strong> · ${g.n} matcher</p>`
    : `<p class="legend">Modellen: ${g.n} matcher – för få för ett snitt (minst ${min})</p>`;
  const rows = g.vs.map((v) => (v.logLoss
    ? `<tr><td>${esc(BASE[v.key] || v.label)}</td><td class="num">${v.n}</td><td class="num">${f3(v.logLoss[0])} / ${f3(v.logLoss[1])}</td>` +
      `<td class="num"><strong>${sgn(v.diff)}</strong><span class="sub">${sgn(v.ci[0])} till ${sgn(v.ci[1])}</span></td>` +
      `<td class="num">${f3(v.brier[0])} / ${f3(v.brier[1])}</td></tr>`
    : `<tr><td>${esc(BASE[v.key] || v.label)}</td><td class="num">${v.n}</td><td colspan="3" class="muted">för få matcher (minst ${min})</td></tr>`)).join('');
  return head + '<div class="table-wrap"><table><thead><tr><th>Modellen mot</th><th class="num">Matcher</th>' +
    '<th class="num">Log-poäng modell / baslinje</th><th class="num" title="Modell − baslinje, 95 % bootstrap-intervall. Negativ = modellen bättre.">Skillnad</th><th class="num">Brier modell / baslinje</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>`;
}

// Per tävling eller regelversion: modellens snitt och skillnaden mot (c),
// (b) och (a) i log-poäng.
function breakdownTable(groups, min) {
  const few = (n) => `<span class="muted">för få</span><span class="sub">${n} av ${min}</span>`;
  const vs = (g, key) => {
    const v = g.vs.find((x) => x.key === key);
    if (!v || !v.n) return '<td class="num muted">–</td>';
    if (v.diff == null) return `<td class="num">${few(v.n)}</td>`;
    return `<td class="num"><strong>${sgn(v.diff)}</strong><span class="sub">${sgn(v.ci[0])} till ${sgn(v.ci[1])}${v.n !== g.n ? `, ${v.n} matcher` : ''}</span></td>`;
  };
  const rows = groups.map((g) => `<tr><td>${g.label}</td><td class="num">${g.n}</td>` +
    (g.model ? `<td class="num">${f3(g.model.logLoss)}</td><td class="num">${f3(g.model.brier)}</td>`
      : g.n ? `<td class="num" colspan="2">${few(g.n)}</td>` : '<td class="num muted" colspan="2">–</td>') +
    vs(g, 'market') + vs(g, 'season') + vs(g, 'naive') + '</tr>').join('');
  return '<div class="table-wrap"><table><thead><tr><th></th><th class="num">Matcher</th><th class="num">Log-poäng</th><th class="num">Brier</th>' +
    [['market', 'c'], ['season', 'b'], ['naive', 'a']].map(([key, k]) => `<th class="num" title="Skillnad i log-poäng mot (${k}). Negativ = modellen bättre.">Mot ${esc(BASE[key].toLowerCase())}</th>`).join('') + '</tr></thead>' +
    `<tbody>${rows}</tbody></table></div>`;
}

// Kalibreringskurva: modellens sannolikhet mot hur ofta det blev så, per
// korg om tio procentenheter, med 95 %-intervall.
function calibrationBlock(cal) {
  const W = 310;
  const H = 280;
  const L = 50;
  const B = 34;
  const T = 10;
  const R = 20;
  const x = (p) => (L + p * (W - L - R)).toFixed(1);
  const y = (p) => (H - B - p * (H - B - T)).toFixed(1);
  let svg = `<svg class="cal" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kalibreringskurva: modellens sannolikhet mot utfallet">`;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    svg += `<line class="grid" x1="${x(0)}" x2="${x(1)}" y1="${y(t)}" y2="${y(t)}"/><line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${y(0)}" y2="${y(1)}"/>`;
    if (t * 100 % 50 === 0) {
      svg += `<text class="tick" x="${x(t)}" y="${H - B + 14}" text-anchor="middle">${t * 100} %</text>` +
        `<text class="tick" x="${L - 6}" y="${Number(y(t)) + 4}" text-anchor="end">${t * 100} %</text>`;
    }
  }
  svg += `<line class="diag" x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}"/>`;
  for (const b of cal.bins) {
    if (b.freq == null) continue;
    svg += `<line class="ci" x1="${x(b.meanP)}" x2="${x(b.meanP)}" y1="${y(b.ci[0])}" y2="${y(b.ci[1])}"/>` +
      `<circle class="pt" cx="${x(b.meanP)}" cy="${y(b.freq)}" r="4"><title>${pct(b.lo)}–${pct(b.hi)} %: modellen sa ${pct(b.meanP)} %, det blev ${pct(b.freq)} % (${b.n} prognoser)</title></circle>`;
  }
  svg += `<text class="axis" x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">Modellen sa</text>` +
    `<text class="axis" x="12" y="${(T + H - B) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(T + H - B) / 2})">Det blev</text></svg>`;

  const rows = cal.bins.map((b) => `<tr><td class="num">${pct(b.lo)}–${pct(b.hi)} %</td><td class="num">${b.n}</td>` +
    `<td class="num">${b.n ? `${pct(b.meanP)} %` : '–'}</td>` +
    `<td class="num">${b.freq != null ? `${pct(b.freq)} %<span class="sub">${pct(b.ci[0])}–${pct(b.ci[1])} %</span>` : b.n ? '<span class="muted">för få</span>' : '–'}</td></tr>`).join('');
  return `<div class="grid2"><div class="card">${svg}</div><div class="table-wrap" style="margin:0"><table class="odds"><thead><tr><th class="num">Modellen sa</th><th class="num">Prognoser</th>` +
    `<th class="num">Snitt</th><th class="num">Det blev</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function advanceTable(a, min) {
  const groups = [{ name: 'Båda cuperna', ...a.all }, ...a.byComp];
  if (!a.all.n) return '<p class="legend">Inga avgjorda cupmatcher i journalen än.</p>';
  const rows = groups.map((g) => `<tr><td>${esc(g.name)}</td><td class="num">${g.n}</td>` +
    (g.logLoss != null
      ? `<td class="num">${f3(g.logLoss)} / ${f3(g.coin.logLoss)}</td><td class="num">${f3(g.brier)} / ${f3(g.coin.brier)}</td>`
      : `<td class="num muted" colspan="2">${g.n ? `för få matcher (minst ${min})` : '–'}</td>`) + '</tr>').join('');
  return '<div class="table-wrap"><table><thead><tr><th></th><th class="num">Matcher</th><th class="num">Log-poäng modell / slant</th>' +
    `<th class="num">Brier modell / slant</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function valueTable(d, minBets) {
  const groups = [{ label: 'Alla', ...d.overall }, ...d.byComp.filter((g) => g.value.bets).map((g) => ({ ...g, label: esc(g.name) }))];
  if (d.byVersion.length > 1) groups.push(...d.byVersion.map((g) => ({ ...g, label: `Regelversion ${esc(g.version)}` })));
  const rows = groups.map((g) => {
    const v = g.value;
    const r = v.profitPer100;
    return `<tr><td>${g.label}</td><td class="num">${v.bets}<span class="sub">${v.matches} ${v.matches === 1 ? 'match' : 'matcher'} med odds</span></td><td class="num">${v.wins}</td>` +
      `<td class="num">${r != null ? `<strong>${r >= 0 ? '+' : '−'}${Math.abs(Math.round(r))}</strong>` : `<span class="muted">för få spel</span><span class="sub">${v.bets} av ${minBets}</span>`}</td></tr>`;
  }).join('');
  return '<div class="table-wrap"><table><thead><tr><th></th><th class="num">Spel</th><th class="num">Vinster</th>' +
    '<th class="num" title="Vinst eller förlust per 100 insatta, 1 på varje utfall där sannolikhet × odds > 1">Per 100 insatta</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>`;
}

function recentTable(all) {
  const list = all.filter((r) => !isHidden(r));
  const n = all.length - list.length;
  const note = n ? `<p class="legend">${Spoiler.chip(`${n} ${n === 1 ? 'match' : 'matcher'}`)} visas inte – spoilerskyddet är på.</p>` : '';
  if (!list.length) return note;
  const rows = list.map((r) => {
    const w = pct3(r.p).map((v, k) => (k === r.o ? `<b>${v}</b>` : String(v))).join(' · ');
    return `<tr><td><a href="#match/${esc(r.id)}">${esc(r.home)}–${esc(r.away)}</a><span class="sub">${esc(compOf(r.comp).short)} · ${dateOnly(r.kickoff)}</span></td>` +
      `<td class="num">${w}<span class="sub">loggad ${when(r.loggedAt)}</span></td><td class="num">${r.score90.home}–${r.score90.away}</td>` +
      `<td class="num">${dec(r.logLoss, 2)} / ${r.market != null ? dec(r.market, 2) : '–'}</td></tr>`;
  }).join('');
  return '<div class="table-wrap"><table><thead><tr><th>Match</th><th class="num" title="1 · X · 2 i procent, utfallet i fetstil">Före avspark</th><th class="num">Efter 90</th>' +
    `<th class="num">Log-poäng modell / ${esc(BASE.market.toLowerCase())}</th></tr></thead><tbody>${rows}</tbody></table></div>` + note;
}

function journalTable(j) {
  const rows = j.latest.map((r) => `<tr><td class="num">${when(r.loggedAt)}</td>` +
    `<td><a href="#match/${esc(r.id)}">${esc(r.home)}–${esc(r.away)}</a><span class="sub">${esc(compOf(r.comp).short)} · avspark ${when(r.kickoff)}</span></td>` +
    `<td class="num">${r.p ? pct3(r.p).join(' · ') : '<span class="unknown">okänt</span>'}</td>` +
    `<td class="num">${r.market ? `${pct3(r.market.p).join(' · ')}<span class="sub">${esc(r.market.source)}</span>` : '–'}</td>` +
    `<td class="num">${esc(r.rulesVersion)}</td></tr>`).join('');
  const files = j.files.map((f) => `<a href="data/journal/${encodeURIComponent(f.name)}">${esc(f.name)}</a> (${n0(f.rows)} rader, ${n0(Math.round(f.bytes / 1024))} kB)`).join(', ');
  return '<div class="table-wrap"><table><thead><tr><th>Loggad</th><th>Match</th><th class="num">Prognos</th><th class="num">' + esc(BASE.market) + '</th><th class="num">Regelversion</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>` +
    `<p class="legend">Hela journalen: ${files}${j.invalid ? ` · ${j.invalid} oläsbara rader hoppas över` : ''}</p>`;
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
      `<td class="num">${when(s.fetchedAt)}<span class="sub">var ${s.cadenceHours >= 48 ? `${Math.round(s.cadenceHours / 24)} d` : `${esc(String(s.cadenceHours).replace('.', ','))} h`}</span></td>` +
      `<td class="num">${s.latestData ? dateOnly(s.latestData) : '–'}</td>` +
      `<td>${val(s.detail)}<span class="sub">verifierad ${dateOnly(s.verified)}</span></td></tr>`).join('') +
    '</tbody></table></div>';

  $('#unmapped').innerHTML = d.unmapped.length
    ? '<strong title="Används inte förrän de lagts in i aliastabellen">Omappade lagnamn</strong>: ' +
      d.unmapped.map((u) => `${esc(u.name)} <span class="muted">(${esc(u.source)}, ${esc(u.comp)})</span>`).join(', ')
    : '';
}

// Bara när datan uppdaterades – källorna nämns först när något är fel.
function topline(d) {
  const count = (st) => d.sources.filter((s) => s.status === st).length;
  const issues = [
    count('fel') ? `${count('fel')} ${count('fel') === 1 ? 'källa' : 'källor'} med fel` : null,
    count('gammal') ? `${count('gammal')} ${count('gammal') === 1 ? 'gammal källa' : 'gamla källor'}` : null,
  ].filter(Boolean).join(', ');
  const meta = state.meta;
  const ageMin = meta ? (Date.now() - new Date(meta.generatedAt).getTime()) / 60000 : null;
  const late = ageMin != null && ageMin > meta.updateEveryMinutes * 4;
  // Bara en varning när datan är gammal; annars syns inget här.
  const summary = $('#sources-summary');
  summary.hidden = !late;
  summary.innerHTML = late
    ? `<span class="err" style="display:inline">Senaste bygget ${when(meta.generatedAt)} – ovanligt länge sedan (ska ske var ${meta.updateEveryMinutes}:e minut). Den schemalagda hämtningen kan ha stannat.</span>`
    : '';
  $('#topline').innerHTML = `<span${meta ? ` title="Säsong ${esc(meta.season)} · byggs var ${meta.updateEveryMinutes}:e minut"` : ''}>Uppdaterad ${meta ? when(meta.generatedAt) : '–'}</span>` +
    (issues ? ` · <a href="#kallor">${esc(issues)}</a>` : '') +
    (late ? ' · <span class="err" style="display:inline">datan är gammal</span>' : '');
}

// ---------- modell ----------

async function loadModel() {
  const el = $('#model');
  try {
    const d = await getJSON('data/model.json');
    el.innerHTML = renderModel(d);
    state.backtest = d.backtest && d.backtest.current;
    drawSeasonChart();
  } catch (err) {
    el.innerHTML = `<p class="empty">Kunde inte läsa modellen: ${esc(err.message)}</p>`;
  }
}

// Diagrammet ritas i containerns bredd (text i px, inte skalad med viewBox).
let chartTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(chartTimer);
  chartTimer = setTimeout(drawSeasonChart, 150);
});

function renderModel(d) {
  const x = d.model;
  const factors = (d.model && d.model.factors) || [];
  const fNames = { table: 'tabelläget' };
  let html = `<p class="intro">Regelversion <strong>${esc(d.rulesVersion)}</strong> · mål efter 90 minuter` +
    `${factors.length ? ` och ${factors.map((f) => fNames[f.id] || f.id).join(', ')}` : ''}</p>`;
  if (!x) return html + `<p class="unknown">okänt – ${d.error ? `prognosmotorn fallerade i senaste bygget: ${esc(d.error)}` : 'inget underlag i källcachen att skatta modellen på'}.</p>`;

  const pctSigned = (v) => `${v >= 1 ? '+' : '−'}${Math.abs(Math.round((v - 1) * 100))} %`;
  const table = factors.find((f) => f.id === 'table');
  html += '<h3>Grundmodellen <span class="hint">Dixon–Coles</span></h3><div class="card"><dl class="facts">' +
    `<dt>Underlag</dt><dd>${n0(x.matches)} matcher t.o.m. ${dateOnly(x.fitThrough)} · Premier League–National League sedan ${esc(x.firstSeason)} och årets cuper</dd>` +
    `<dt>Tidsvikt</dt><dd>halveringstid ${x.halfLifeDays} dagar</dd>` +
    `<dt>Hemmafördel</dt><dd>${pctSigned(x.homeAdvantage)} mål för hemmalaget</dd>` +
    `<dt>Låga resultat</dt><dd>ρ = ${dec(x.rho, 3)}</dd>` +
    `<dt>Osäkerhet</dt><dd>mittersta ${pct(x.interval)} % av ${x.samples} omskattningar</dd>` +
    (table ? `<dt>Tabelläget</dt><dd>${table.effect >= 0 ? '+' : '−'}${dec(Math.abs(table.effect) * 100, 1)} % mål per poäng per match bättre än motståndaren · ` +
      `från ${table.minMatches} ligamatcher · sedan ${esc(table.since)}</dd>` : '') +
    `<dt>Under National League</dt><dd>nivåsnitt ur ${x.lowerMatches} FA-cupmatcher sedan ${esc(x.lowerSince)}</dd>` +
    '<dt>Cuper</dt><dd>90 minuter · förlängning med samma målfrekvens · straffar 50/50</dd>' +
    '</dl></div>' +
    method('Så fungerar modellen', [
      ['Dixon–Coles', 'Varje lag har en anfalls- och en försvarsstyrka, en gemensam hemmafördel och en korrektion för 0–0, 1–0, 0–1 och 1–1.'],
      ['Underlag', `Premier League–National League sedan ${esc(x.firstSeason)} och årets cupmatcher (football-data.co.uk, ESPN). ` +
        'Alla nivåer skattas i samma modell – de kopplas ihop av lag som flyttats upp eller ned och av cupmöten.'],
      ['Tidsvikt', `Halveringstid ${x.halfLifeDays} dagar – äldre matcher väger mindre.`],
      ['Osäkerhet', `Spannet i matchvyn är de mittersta ${pct(x.interval)} % när modellen skattas om ${x.samples} gånger med slumpvikter på matcherna ` +
        '(Bayesiansk bootstrap) – osäkerheten i lagens styrka, inte modellfel. Räknas för kommande matcher.'],
      ['Hemmafördel och ρ', 'Båda skattas. Negativt ρ = fler 0–0 och 1–1 än oberoende mål ger.'],
      ['Under National League', 'Ingen lagdata. Lagen skattas som ett gemensamt nivåsnitt och märks i matchvyn.'],
      table && ['Tabelläget', 'Poäng per match i årets liga, hemmalaget mot bortalaget, räknat ur resultaten (utan poängavdrag). Vikten är skattad på backtestets prognoser. ' +
        `Bara ligamatcher där båda lagen spelat minst ${table.minMatches} ligamatcher i år. Infört i regelversion ${esc(table.since)}, efter kandidatjakten.`],
      ['Nya faktorer', 'En faktor får påverka prognosen först när den bevisligen förbättrat den walk-forward – fram till dess visas den som underlag i matchvyn.'],
      ['Cuper', 'Prognosen gäller 90 minuter. Chansen att gå vidare räknas ur samma modell: förlängning med samma målfrekvens, straffar 50/50. ' +
        'FA-cupen: förlängning och straffar. EFL-cupen: straffar direkt, utom i semifinalerna (två möten) och finalen.'],
    ]);

  html += '<h3>Nivåerna <span class="hint">snittlaget mot ett snittlag i Premier League · neutral plan</span></h3>' +
    '<div class="table-wrap"><table><thead><tr><th>Nivå</th><th class="num">Vinst</th><th class="num">Oavgjort</th><th class="num">PL-laget vinner</th><th class="num">Mål per lag inbördes</th></tr></thead><tbody>' +
    x.tiers.map((t) => {
      const w = t.vsTop ? pct3(t.vsTop) : null;
      return `<tr><td>${esc(t.name)}${t.tier <= 5 ? ` <span class="muted">nivå ${t.tier}</span>` : ''}</td>` +
        (w ? w.map((v) => `<td class="num">${v} %</td>`).join('') : '<td colspan="3">–</td>') + `<td class="num">${dec(t.goals, 2)}</td></tr>`;
    }).join('') + '</tbody></table></div>';

  html += '<h3>Baslinjerna <span class="hint">modellen ska slå (b) – och på sikt (c)</span></h3><div class="card"><dl class="facts">' +
    `<dt>(a) Naiv</dt><dd>divisionens 1 · X · 2 de senaste ${x.naiveSeasons} säsongerna · cuper: alla ligamatcher på nivå 1–4</dd>` +
    `<dt>(b) Säsongens mål</dt><dd>Poisson på enbart årets matcher · okänd tills båda lagen spelat ${x.seasonMinMatches} matcher</dd>` +
    '<dt>(c) Marknaden</dt><dd>odds utan marginal (Shins metod) · ligorna: snittet hos football-data.co.uk, öppningsodds fre/tis, ' +
    'för spelade matcher också Betfair Exchange vid stängning · cuperna: DraftKings via ESPN</dd>' +
    '</dl></div>';

  html += backtestSection(d.backtest, d.rulesVersion);
  html += candidatesSection(d.backtest && d.backtest.candidates, new Map(factors.map((f) => [f.candidate, f.since])));
  return html;
}

// ---------- backtest och kandidatjakt (fas 4) ----------

// Skillnad i log-poäng med intervall: "−0,034" och "−0,050 till −0,018".
function diffCell(c, strong = true) {
  if (!c || !c.n) return '<td class="num muted">–</td>';
  const v = strong ? `<strong>${sgn(c.diff)}</strong>` : sgn(c.diff);
  return `<td class="num">${v}<span class="sub">${sgn(c.ci[0])} till ${sgn(c.ci[1])}</span></td>`;
}

function backtestSection(bt, version) {
  const b = bt && bt.current;
  if (!b) {
    const other = bt && bt.versions && bt.versions.length ? ` Senaste backtestet gäller regelversion ${esc(bt.versions[bt.versions.length - 1].rulesVersion)}.` : '';
    return '<h3>Backtest <span class="hint">walk-forward</span></h3>' +
      `<p class="unknown">okänt – backtestet är inte kört för regelversion ${esc(version)} än (npm run backtest).${other}</p>`;
  }
  const lg = b.leagues;
  let html = `<h3>Backtest <span class="hint">walk-forward · ${esc(b.first)}–${esc(b.last)}</span></h3>` +
    '<div class="table-wrap"><table><thead><tr><th>Ligorna, mot</th><th class="num">Matcher</th><th class="num">Modell</th><th class="num">Baslinje</th>' +
    '<th class="num" title="Modell − baslinje i log-poäng, 95 % bootstrap-intervall. Negativ = modellen bättre.">Skillnad</th><th class="num">Brier</th></tr></thead><tbody>' +
    lg.vs.filter((r) => r.n).map((r) => `<tr><td>${esc(r.label)}</td><td class="num">${n0(r.n)}</td><td class="num">${f3(r.logLoss[0])}</td><td class="num">${f3(r.logLoss[1])}</td>` +
      diffCell(r) + `<td class="num">${f3(r.brier[0])} / ${f3(r.brier[1])}</td></tr>`).join('') + '</tbody></table></div>';

  if (bt.versions.length > 1) {
    const vsOf = (v, key) => v.leagues.vs.find((c) => c.key === key);
    html += '<h4 class="sub-h">Per regelversion <span class="hint">samma matcher, ligorna</span></h4><div class="table-wrap"><table><thead><tr><th>Regelversion</th><th class="num">Körd</th>' +
      '<th class="num">Modell</th><th class="num">mot (b)</th><th class="num">mot (a)</th><th class="num">mot (c)</th></tr></thead><tbody>' +
      bt.versions.map((v) => `<tr><td class="num">${esc(v.rulesVersion)}${v.rulesVersion === version ? ' <span class="muted">i dag</span>' : ''}</td><td class="num">${dateOnly(v.ranAt)}</td>` +
        `<td class="num">${dec(vsOf(v, 'nv').logLoss[0], 4)}</td>` + ['ss', 'nv', 'mk'].map((k) => diffCell(vsOf(v, k), false)).join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }
  html += '<h4 class="sub-h">Per säsong <span class="hint">ligorna</span></h4><div class="card chart-card"><div id="season-chart"></div></div>';
  html += '<details class="as-table"><summary>Som tabell</summary><div class="table-wrap"><table><thead><tr><th>Säsong</th><th class="num">Matcher</th><th class="num">Modell</th>' +
    '<th class="num">mot (b)</th><th class="num">mot (a)</th><th class="num">mot (c)</th><th class="num">mot Pinnacle</th></tr></thead><tbody>' +
    b.bySeason.map((x) => `<tr><td class="num">${esc(x.label)}${x.partial ? `<span class="sub">t.o.m. ${dateOnly(x.through)}</span>` : ''}</td><td class="num">${n0(x.n)}</td>` +
      `<td class="num">${x.vs[1].n ? f3(x.vs[1].logLoss[0]) : '–'}</td>` + x.vs.map((c) => diffCell(c, false)).join('') + '</tr>').join('') +
    '</tbody></table></div></details>';

  html += '<h4 class="sub-h">Per division</h4><div class="table-wrap"><table><thead><tr><th>Division</th><th class="num">Matcher</th><th class="num">Modell</th>' +
    '<th class="num">mot (b)</th><th class="num">mot (a)</th><th class="num">mot (c)</th><th class="num">mot Pinnacle</th></tr></thead><tbody>' +
    b.byDivision.map((x) => `<tr><td>${esc(x.name)}</td><td class="num">${n0(x.n)}</td><td class="num">${f3(x.vs[1].logLoss[0])}</td>` +
      x.vs.map((c) => diffCell(c, false)).join('') + '</tr>').join('') + '</tbody></table></div>';

  if (b.cups.length) {
    html += '<h4 class="sub-h">Cuperna <span class="hint">log-poäng</span></h4><div class="table-wrap"><table><thead><tr><th>Cup</th><th class="num">Säsonger</th>' +
      '<th class="num">Matcher</th><th class="num">Modell</th><th class="num">Naiv</th><th class="num">Gå vidare</th><th class="num">Slantsingling</th></tr></thead><tbody>' +
      b.cups.map((c) => `<tr><td>${esc(c.name)}</td><td class="num">${esc(c.seasons[0])}${c.seasons[1] !== c.seasons[0] ? `–${esc(c.seasons[1])}` : ''}</td>` +
        `<td class="num">${n0(c.vsNaive.n)}</td><td class="num">${f3(c.vsNaive.logLoss[0])}</td><td class="num">${f3(c.vsNaive.logLoss[1])}</td>` +
        (c.advance ? `<td class="num">${f3(c.advance.logLoss)}</td><td class="num">${f3(c.advance.coin)}</td>` : '<td class="num muted">–</td><td class="num muted">–</td>') +
        '</tr>').join('') + '</tbody></table></div>';
  }
  html += `<p class="legend">football-data.co.uk och ESPN · körd ${when(b.ranAt)} · regelversion ${esc(b.rulesVersion)} · ` +
    `${n0(b.modelKnown)} av ${n0(b.matches)} matcher med modellprognos</p>` +
    method('Så gjordes backtestet', [
      ['Walk-forward', `Varje match ${esc(b.first)}–${esc(b.last)} fick en prognos skattad bara på matcherna före matchdagen, med samma kod och regler som i dag.`],
      ['Skillnad', 'Modell − baslinje i log-poäng (lägre är bättre); negativ = modellen bättre, med 95 % bootstrap-intervall där hela matchdagar dras om. ' +
        'Varje rad jämför på de matcher där båda finns.'],
      b.factors && ['Tabelläget', 'Vikten skattas säsong för säsong enbart på tidigare säsonger (den första säsongen utan tabelläge), inte med regelkonfigens värde.'],
      ['Täckning', `${n0(b.modelKnown)} av ${n0(b.matches)} matcher fick en modellprognos; övriga hade för lite underlag för ett lag.`],
      ['Körning', 'För hand när regelversionen ändras, inte i varje bygge.'],
      b.notes.length && ['Begränsningar', `<ul class="bullets">${b.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`],
    ]);
  return html;
}

// Skillnaden mot (b) och (c) per avslutad säsong, med 95 %-intervall.
function drawSeasonChart() {
  const el = document.getElementById('season-chart');
  const b = state.backtest;
  if (!el || !b) return;
  const rows = b.bySeason.filter((x) => !x.partial);
  const series = [
    { i: 0, key: 'b', label: 'mot (b) säsongens mål' },
    { i: 2, key: 'c', label: 'mot (c) marknaden' },
  ];
  const W = Math.max(260, el.clientWidth);
  const H = 230;
  const L = 46;
  const R = 12;
  const T = 12;
  const B = 26;
  const vals = rows.flatMap((x) => series.flatMap((s) => (x.vs[s.i].n ? x.vs[s.i].ci : [])));
  const step = 0.02;
  const lo = Math.floor(Math.min(0, ...vals) / step) * step;
  const hi = Math.ceil(Math.max(0, ...vals) / step) * step;
  const band = (W - L - R) / rows.length;
  const x = (i) => L + band * (i + 0.5);
  const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const off = Math.min(5, band / 5);
  let svg = `<svg class="bt" width="${W}" height="${H}" role="img" aria-label="Skillnad i log-poäng per säsong mot baslinjerna (b) och (c)">`;
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const zero = Math.abs(v) < 1e-9;
    svg += `<line class="${zero ? 'zero' : 'grid'}" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>` +
      `<text class="tick" x="${L - 6}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${zero ? '0' : sgn(v, 2)}</text>`;
  }
  const every = Math.ceil(rows.length / Math.max(1, Math.floor((W - L - R) / 46)));
  rows.forEach((r, i) => {
    if (i % every === 0) svg += `<text class="tick" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(r.label.slice(2))}</text>`;
  });
  for (const s of series) {
    rows.forEach((r, i) => {
      const c = r.vs[s.i];
      if (!c.n) return;
      const cx = (x(i) + (s.i ? off : -off)).toFixed(1);
      svg += `<line class="ci s-${s.key}" x1="${cx}" x2="${cx}" y1="${y(c.ci[0]).toFixed(1)}" y2="${y(c.ci[1]).toFixed(1)}"/>` +
        `<circle class="pt s-${s.key}" cx="${cx}" cy="${y(c.diff).toFixed(1)}" r="4"/>`;
    });
  }
  // Träffytor: hela säsongens kolumn, med båda värdena.
  rows.forEach((r, i) => {
    const t = series.map((s) => { const c = r.vs[s.i]; return c.n ? `${s.label}: ${sgn(c.diff)} (${sgn(c.ci[0])} till ${sgn(c.ci[1])}, ${c.n} matcher)` : `${s.label}: –`; }).join('\n');
    svg += `<rect class="hit" x="${(x(i) - band / 2).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${H - T - B}"><title>${esc(r.label)}\n${esc(t)}</title></rect>`;
  });
  svg += '</svg>';
  el.innerHTML = '<div class="chart-legend">' + series.map((s) => `<span><i class="key s-${s.key}"></i>${esc(s.label)}</span>`).join('') +
    '<span class="muted">under noll = modellen bättre</span></div>' + svg;
}

function candidatesSection(L, promoted = new Map()) {
  if (!L || !L.entries || !L.entries.length) {
    return '<h3>Kandidatjakt</h3><p class="unknown">Ingen kandidat prövad än (npm run kandidater).</p>';
  }
  const crit = L.criteria;
  const latest = new Map();
  const count = new Map();
  for (const e of L.entries) { latest.set(e.id, e); count.set(e.id, (count.get(e.id) || 0) + 1); }
  const run = L.runs[L.runs.length - 1];
  const log = 'https://github.com/tomaslaino/Profeterna/blob/main/data/backtest/candidates.json';
  let html = `<h3>Kandidatjakt <span class="hint">senast körd ${dateOnly(run.ranAt)}</span></h3>` +
    `<p class="legend">${run.candidates} kandidater · intervall ${dec(run.level * 100, 2)} % · säsongerna ${esc(run.seasons[0])}–${esc(run.seasons[1])}` +
    `${run.through ? ` t.o.m. ${dateOnly(run.through)}` : ''} · <a href="${log}" target="_blank" rel="noopener">hela loggen</a></p>`;

  const verdict = (e) => (promoted.has(e.id) ? '<span class="badge ok">införd</span>' : e.verdict === 'godkänd'
    ? '<span class="badge ok">godkänd</span>' : e.verdict === 'underkänd' ? '<span class="badge no">underkänd</span>' : '<span class="badge">kunde inte prövas</span>');
  const rows = [...latest.values()].map((e) => {
    const earlier = count.get(e.id) - 1;
    const why = promoted.has(e.id) ? `${e.why} – styr prognosen från regelversion ${promoted.get(e.id)}`
      : e.verdict === 'godkänd' ? `${e.why} – inte införd` : e.why;
    return `<tr><td>${esc(e.label)}<span class="sub">${esc(e.motive)}${e.scope ? ` · ${esc(e.scope)}` : ''}</span>` +
      `${e.paramText ? `<span class="sub">Skattat: ${esc(e.paramText)}</span>` : ''}</td>` +
      `<td class="num">${e.n ? `${n0(e.n)}<span class="sub">${esc(e.seasons[0])}–${esc(e.seasons[1])}</span>` : '–'}</td>` +
      (e.n ? `<td class="num"><strong>${sgn(e.diff, 4)}</strong><span class="sub">${sgn(e.ci[0], 4)} till ${sgn(e.ci[1], 4)}</span></td>` : '<td class="num">–</td>') +
      `<td>${verdict(e)}<span class="sub">${esc(why)}${e.testedAt !== run.ranAt.slice(0, 10) ? ` · ${dateOnly(e.testedAt)}` : ''}` +
      `${earlier ? ` · prövad ${earlier} gång${earlier === 1 ? '' : 'er'} tidigare` : ''}</span></td></tr>`;
  }).join('');
  html += '<div class="table-wrap"><table><thead><tr><th>Kandidat</th><th class="num">Matcher</th>' +
    '<th class="num" title="Kandidat − grundmodell på samma matcher, med intervallet">Skillnad log-poäng</th><th>Utfall</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>`;
  if (L.untestable && L.untestable.length) {
    html += '<h4 class="sub-h">Går inte att pröva än</h4><div class="card"><ul class="plain">' +
      L.untestable.map((u) => `<li><strong>${esc(u.label)}</strong><span class="sub">${esc(u.reason)}</span></li>`).join('') + '</ul></div>';
  }
  html += method('Så prövas en kandidat', [
    ['Kravet', `En faktor får styra prognosen först när den bevisligen förbättrat den walk-forward. Kravet skrevs ${dateOnly(crit.registered)}, före första körningen:` +
      `<ul class="bullets">${crit.text.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`],
    ['Skillnad', 'Kandidat − grundmodell i log-poäng på samma matcher, med intervallet ovan. Negativ = kandidaten bättre.'],
    ['Beslut', 'En godkänd kandidat blir en ny regelversion först efter beslut.'],
    ['Loggen', 'Allt som prövats loggas med utfall och datum, även det som inte fungerade, så att samma idé inte prövas igen utan ny evidens.'],
  ]);
  return html;
}

// ---------- spoilerskyddet ----------

// Läget ändrades eller en match visades ändå: rita om det som syns (kupongen
// ritar om sig själv, se kupong.js).
if (window.Spoiler) {
  Spoiler.onChange(() => {
    renderMatchList();
    const dv = $('#match-detail-view');
    if (!dv.hidden && state.detail) {
      dv.innerHTML = renderDetail(state.detail);
      setShowSources(showSources());
    }
    if (!$('#model-section').hidden) loadEvaluation();
  });
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
