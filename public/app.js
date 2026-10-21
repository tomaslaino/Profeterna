'use strict';

// ---------- hjälpare ----------

const TZ = 'Europe/Stockholm';
const $ = (s) => document.querySelector(s);
const state = { comp: 'all', earlier: false, meta: null, comps: new Map(), all: null, detail: null };
const LIST_DAYS = 14;
// Ovanför nu-linjen syns först bara de senaste resultaten: den senaste
// speldagen, högst så här många matcher. Resten ligger bakom en knapp.
const RECENT_ROWS = 4;
// Inbördes möten på matchsidan: så här många år bakåt.
const PAST_YEARS = 5;

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
// Odds som hos svenska spelbolag: 1 / chansen med två decimaler och
// decimalkomma, så 58 % blir 1,72 – rättvisa odds, utan spelbolagets marginal.
// Från 100 och uppåt i hela tal.
function fmtOdds(o) {
  return o >= 100 ? String(Math.round(o)) : o.toFixed(2).replace('.', ',');
}
// Odds ur hela procent, samma precision som journalen (0 % ger –).
function pctOdds(pctInt) {
  return pctInt ? fmtOdds(100 / pctInt) : '–';
}
// Odds ur en sannolikhet, avrundad till hela procent som på resten av sidan.
function oddsP(x) {
  return x == null ? '–' : pctOdds(pct(x));
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
  olympen: 'battle-section',
  // Fliken hette Kampen först; gamla länkar hamnar på Olympen.
  kampen: 'battle-section',
  kallor: 'sources-section',
  modell: 'model-section',
  // Utvärderingen ligger sist på Modell-sidan; gamla länkar hamnar där.
  utvardering: 'model-section',
};

// Källor och Modell har ingen flik i toppbaren, bara länkar i sidfoten.
// Förstasidan (home-section) har ingen flik heller – dit leder namnet.
function showTab(sectionId) {
  // Samma sida som förut (till exempel när matchrutan stängs): ingen skroll till toppen.
  const same = !$(`#${sectionId}`).hidden;
  for (const sec of document.querySelectorAll('main > section')) sec.hidden = sec.id !== sectionId;
  for (const btn of document.querySelectorAll('.tablist [role="tab"]')) {
    btn.setAttribute('aria-selected', String(btn.dataset.tab === sectionId));
  }
  if (sectionId === 'sources-section') loadSources();
  if (!same) window.scrollTo(0, 0);
  // Modell-sidan: klar när både modellen och utvärderingen är ritade.
  if (sectionId === 'model-section') return Promise.all([loadModel(), loadEvaluation()]);
}

// Matchrutan ligger ovanpå sidan man var på (#match/<id>); under den ligger
// adressen man kom ifrån, och stängs rutan går man tillbaka dit. Kom man
// direkt till matchen ligger matchlistan under.
const modal = { active: false, under: null, depth: 0, closing: false };
let routed = false;

function route(e) {
  const h = location.hash.replace(/^#/, '');
  const old = e && e.oldURL ? new URL(e.oldURL).hash.replace(/^#/, '') : null;
  const m = /^match\/(\d+)$/.exec(h);
  if (m) {
    if (!routed) showTab('matches-section');
    // Hur många matcher bort sidan under ligger sparas i historiken, så att
    // bakåt och framåt mellan matcher i rutan räknas rätt.
    const saved = history.state && history.state.md;
    if (!modal.active) {
      modal.under = old != null && !/^match\//.test(old) ? old : null;
      modal.depth = 1;
    } else {
      modal.depth = saved || modal.depth + 1;
    }
    history.replaceState({ ...(history.state || {}), md: modal.depth }, '');
    routed = true;
    openMatch(m[1]);
    return;
  }
  routed = true;
  if (modal.active) {
    const back = modal.under === h;
    hideMatch();
    // Tillbaka till sidan under rutan: den syns redan, inget ritas om.
    if (back) return;
  }
  // Kupongen (kupong.js): #kupong, #kupong/<id>, #kupong/ny,
  // #kupong/andra/<id> – och #kupong/historik, som leds till Olympen.
  const k = /^kupong(?:\/(.+))?$/.exec(h);
  if (k) {
    showTab('coupon-section');
    showCoupon(k[1] || '');
    return;
  }
  // Olympen med Grupparbetena (kampen.js, historik.js): #olympen/kuponger
  // och #olympen/kuponger/<id> – kampen.js bläddrar fram till kupongen.
  if (/^(olympen|kampen)\//.test(h)) {
    showTab('battle-section');
    return;
  }
  // Förstasidan: utan eller med okänd adress.
  if (!TABS[h]) {
    showTab('home-section');
    showHome();
    return;
  }
  const loading = showTab(TABS[h]);
  if (h === 'utvardering') loading.then(() => $('#eval-title').scrollIntoView());
}

for (const btn of document.querySelectorAll('.tablist [role="tab"]')) {
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

// Kolumnens nyckel står i första kommande dagens rubrik i stället för en
// förklaring. Spelade matcher visar bara resultatet och behöver ingen.
const KEY_UPCOMING = '<span class="day-key" style="float:right;margin-right:20px" title="Matchfixarnas odds för hemmaseger · oavgjort · bortaseger efter 90 minuter – rättvisa odds, utan spelbolagens marginal">Odds 1 · X · 2</span>';

function renderList(d) {
  if (!d.played.length && !d.upcoming.length) {
    return `<p class="empty">Inga matcher de senaste eller närmaste ${d.days} dagarna.</p>`;
  }
  let html = '';
  if (d.more) {
    html += `<button type="button" class="earlier"><span aria-hidden="true">↑</span> Tidigare matcher <span class="n">${d.more}</span></button>`;
  }
  html += renderDays(d.played, '');
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

// Prognosen 1 · X · 2 i hela procent som odds (se odds ovan).
function listOdds(p) {
  return p.map(pctOdds);
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

// Prognosen före avspark i resultatets tooltip – på raden står bara
// resultatet. Journalens prognos rättas mot ställningen efter 90 minuter.
function tipTitle(m) {
  if (m.j && m.j.p) {
    const hit = tipHit(m);
    return `Prognosen före avspark ${listOdds(m.j.p).join(' · ')}${hit == null ? '' : hit ? ' – slog in' : ' – slog inte in'}`;
  }
  return m.f ? `Prognosen i efterhand ${listOdds(m.f.p).join(' · ')}` : '';
}

// Spelad match: spelikonen och resultatet i var sin fast kolumn (theme.css
// .mside-res), så att båda står i rak linje rad för rad.
function matchRow(m) {
  let side;
  if (m.completed && m.score) {
    side = `<span class="mres-hl">${window.Hojdpunkter ? Hojdpunkter.row(m) : ''}</span>`;
    if (isHidden(m)) side += Spoiler.chip();
    else {
      const t = tipTitle(m);
      side += `<span class="score"${t ? ` title="${esc(t)}"` : ''}>${m.score.home}–${m.score.away}</span>`;
      if (m.shootout) side += `<span class="sub">str. ${m.shootout.home}–${m.shootout.away}</span>`;
    }
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
    `<span class="mside${m.completed && m.score ? ' mside-res' : ' mside-odds'}">${side}</span></button>`;
}

// ---------- matchrutan ----------

// Matchen öppnas i en ruta ovanpå sidan, med flikar som på gravergrav.se.
// Startelvor och Matchen hämtas i webbläsaren av matchruta.js.
const CLOSE_BTN = '<button type="button" class="mr-close" data-close aria-label="Stäng">×</button>';

async function openMatch(id) {
  const dlg = $('#match-modal');
  const el = $('#match-detail-view');
  if (!state.detail || state.detail.match.id !== id) {
    state.mtab = null;
    el.innerHTML = `<div class="mr-top">${CLOSE_BTN}</div><div class="mr-body"><p class="empty">Laddar …</p></div>`;
  }
  modal.active = true;
  if (!dlg.open) {
    dlg.showModal();
    document.documentElement.classList.add('mr-open');
  }
  try {
    // Artikeln inför matchen hämtas samtidigt, så att fliken finns från början.
    const [d] = await Promise.all([getJSON(`data/match/${encodeURIComponent(id)}.json`), loadArticle(id)]);
    if (location.hash !== `#match/${id}`) return;
    const fresh = !state.detail || state.detail.match.id !== id;
    state.detail = d;
    drawDetail();
    if (fresh) el.querySelector('.mr-body').scrollTop = 0;
  } catch (err) {
    el.innerHTML = `<div class="mr-top">${CLOSE_BTN}</div><div class="mr-body"><p class="empty">Kunde inte läsa matchen: ${esc(err.message)}</p></div>`;
  }
}

function drawDetail() {
  const el = $('#match-detail-view');
  const d = state.detail;
  $('#match-modal').setAttribute('aria-label', `${d.match.home}–${d.match.away}`);
  el.innerHTML = renderDetail(d);
  if (window.Matchruta) Matchruta.hydrate(el, d, compOf(d.match.comp).espn);
  tableFill(el, d);
}

// Stänger rutan utan att röra adressen (route sköter den).
function hideMatch() {
  modal.active = false;
  modal.closing = false;
  const dlg = $('#match-modal');
  if (dlg.open) dlg.close();
  document.documentElement.classList.remove('mr-open');
  if (window.Matchruta) Matchruta.stop();
  state.detail = null;
}

// Krysset, Esc och klick utanför: tillbaka till sidan under rutan. En gång –
// Esc kan ge både cancel och close innan adressen hunnit ändras.
function closeMatch() {
  if (modal.closing) return;
  modal.closing = true;
  if (modal.under != null) history.go(-modal.depth);
  else location.hash = 'matcher';
  // Gick det inte att backa (ingen historik) hamnar man på matchlistan.
  setTimeout(() => {
    if (!modal.closing) return;
    modal.closing = false;
    if (/^#match\//.test(location.hash)) location.hash = 'matcher';
  }, 700);
}

$('#match-modal').addEventListener('cancel', (e) => {
  e.preventDefault();
  closeMatch();
});
// Webbläsaren kan stänga rutan själv (Esc två gånger): då följer adressen med.
$('#match-modal').addEventListener('close', () => {
  document.documentElement.classList.remove('mr-open');
  if (/^#match\//.test(location.hash)) closeMatch();
});
$('#match-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeMatch();
});

function selectMatchTab(id, focus) {
  state.mtab = id;
  const el = $('#match-detail-view');
  for (const b of el.querySelectorAll('[data-mtab]')) {
    const on = b.dataset.mtab === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
    if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  for (const p of el.querySelectorAll('.mr-pane')) p.hidden = p.dataset.pane !== id;
  const body = el.querySelector('.mr-body');
  if (body) body.scrollTop = 0;
}

// Flikarna i matchbladets ordning: Startelvor först – planen, avbytarna, vilka
// som saknas och domaren, som i ett matchprogram – och Matchen efter den när
// matchen har börjat. Startelvor och Matchen fylls av matchruta.js, Tabellen
// av tableFill(). Inför står efter dem när Claude har skrivit en artikel om
// matchen (articlePane).
function matchPanes(d) {
  const m = d.match;
  const started = m.completed || (Date.parse(m.kickoff) <= Date.now() && !/POSTPONED|CANCEL/.test(m.status || ''));
  const R = window.Matchruta;
  const panes = [];
  panes.push(['startelvor', 'Startelvor', (R ? R.lineupPane(m, absentees(d)) : squadCard(d)) + refereeCard(d)]);
  if (started && R) panes.push(['matchen', 'Matchen', R.eventsPane(m)]);
  const article = articles.get(m.id);
  if (article) panes.push(['infor', 'Inför', articlePane(article)]);
  panes.push(['prognos', 'Prognos', prognosPane(d)]);
  const table = tableDivs(d).length > 0;
  panes.push(['form', 'Form', formCard(d) + sideCard(d, table)]);
  if (table) panes.push(['tabellen', 'Tabellen', `<div class="mt-wrap" data-mr-table="${esc(m.id)}"><p class="mr-wait">Hämtar tabellen …</p></div>`]);
  if (d.squads) panes.push(['trupperna', 'Trupperna', squadsSection(d)]);
  return panes;
}

// Spelad match med prognos före avspark: den rättade prognosen ensam (den
// återskapade upprepar samma sak). Annars prognosen, spelbolagen bredvid
// modellen och vad som drog åt vilket håll.
function prognosPane(d) {
  const m = d.match;
  const ok = d.prediction && d.prediction.status === 'ok';
  if (m.completed && d.journal && d.journal.counted) return journalCard(d) + (ok ? stepsCard(d) : '');
  return forecastCard(d) + analysisCard(d) + marketCard(d) + (ok ? stepsCard(d) : '');
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

  // Matchrutan är ett tryckt matchblad (matchblad.css): märket som på
  // kupongen överst och meanderbården mellan rubriken och flikarna.
  const head = '<div class="mhead mr-head"><p class="pp-brand"><img src="logo.svg" alt="" width="20" height="20">Matchfixarna<span>Matchblad</span></p>' +
    `<div class="mhead-meta"${m.tierNote ? ` title="${esc(m.tierNote)}"` : ''}>${meta}</div>` +
    `<div class="mhead-teams"><div class="mhead-team">${esc(m.home)}</div>` +
    `<div class="mhead-mid">${hide ? Spoiler.chip() : esc(mid)}${midSub ? `<span class="sub">${esc(midSub)}</span>` : ''}</div>` +
    `<div class="mhead-team away">${esc(m.away)}</div></div>` +
    (window.Hojdpunkter ? Hojdpunkter.head(d) : '') +
    '</div><div class="pp-band mr-band" aria-hidden="true"></div>';

  // Dold match: bara rubriken – prognosens rättning och underlaget efter
  // matchen avslöjar resultatet.
  if (hide) {
    return `<div class="mr-top">${CLOSE_BTN}${head}</div><div class="mr-body">` +
      Spoiler.card({ title: 'Resultatet är dolt', text: 'Du har valt att dölja resultat.', keys: [m.id], button: 'Visa resultatet' }) + '</div>';
  }

  const panes = matchPanes(d);
  const tab = panes.some(([id]) => id === state.mtab) ? state.mtab : panes[0][0];
  const tabs = '<div class="mr-tabs" role="tablist" aria-label="Om matchen">' + panes.map(([id, label]) =>
    `<button type="button" role="tab" id="mr-tab-${id}" data-mtab="${id}" aria-controls="mr-pane-${id}" aria-selected="${id === tab}"${id === tab ? '' : ' tabindex="-1"'}>${label}</button>`).join('') + '</div>';
  const body = panes.map(([id, , html]) =>
    `<section class="mr-pane" id="mr-pane-${id}" data-pane="${id}" role="tabpanel" aria-labelledby="mr-tab-${id}"${id === tab ? '' : ' hidden'}>${html}</section>`).join('');
  return `<div class="mr-top">${CLOSE_BTN}${head}${tabs}</div><div class="mr-body">${body}</div>`;
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
  const stats = goalLines(p.goals, p.over25, p.btts);
  let adv = '';
  if (p.advance) {
    adv = p.advance.home == null
      ? `<p class="fc-adv">Går vidare: <span class="unknown">okänt – ${esc(p.advance.reason || '')}</span></p>`
      : `<p class="fc-adv">Går vidare: <b>${esc(m.home)} ${pctOdds(pct3([p.advance.home, p.advance.away])[0])}</b> · <b>${esc(m.away)} ${pctOdds(pct3([p.advance.home, p.advance.away])[1])}</b>` +
        `<span class="sub">${esc(p.advance.rule)}${p.advance.firstLeg ? ` · första mötet ${esc(p.advance.firstLeg.home)} ${p.advance.firstLeg.score.home}–${p.advance.firstLeg.score.away} ${esc(p.advance.firstLeg.away)}` : ''}</span></p>`;
  }
  const notes = (p.notes || []).map((n) => `<p class="note">${esc(n)}</p>`).join('');
  // Stämpeln: prognosen står i journalen och räknas när matchen är spelad.
  const j = d.journal;
  const stamp = !m.completed && j && j.latestAt ? `<span class="pp-stamp fc-stamp" title="Loggad ${when(j.latestAt)}">I journalen</span>` : '';
  return `<div class="card fc"><h4>${m.completed ? 'Prognos i efterhand' : 'Prognos efter 90 minuter'}</h4>` +
    fcMain(p.p, [m.home, 'Oavgjort', m.away], m.id) +
    `<div class="fc-two"><div><h5>Målen</h5>${stats}</div><div><h5>Troligast</h5>${topScores(p)}</div></div>` +
    `${adv}${notes}<div class="fc-foot">${scoreGrid(p, m)}${stamp}</div></div>`;
}

// 1 · X · 2 som kupongens rutor: tecknet och oddset. Inget ringas in av sig
// självt – först när någon har tryckt på Analysera ringar AI:n in sina tecken
// med kulspetspenna och skriver en rad i marginalen (penMarks). Efter matchen
// ringas utfallet (outcome) in med samma penna som ställningen. key gör
// pennstrecken likadana varje gång (papper.js).
function fcMain(p, labels, key, outcome) {
  const w = pct3(p);
  const pen = outcome == null ? penMarks(key) : null;
  const P = window.Papper;
  const cols = w.map((x, i) => {
    const mine = Boolean(pen) && pen.signs.includes(i);
    const res = outcome === i;
    return `<div class="fc-col${i === 1 ? ' draw' : ''}${res ? ' s-out' : ''}"><div class="fc-label"><span>${esc(labels[i])}</span>` +
      (pen && i === pen.at ? `<em class="fc-note">${esc(pen.note)}</em>` : '') + '</div>' +
      `<div class="fc-box" title="${x} %"><i>${'1X2'[i]}</i><div class="fc-num">${pctOdds(x)}${mine && P ? P.ring(`penna${key}${i}`, 'fc-pen', 23) : ''}</div>` +
      `${res && P ? P.ring(`utfall${key}`, 'fc-ring', 27) : ''}</div></div>`;
  }).join('');
  return `<div class="fc-main">${cols}</div>`;
}

// Tecknen analysen ringade in och raden i marginalen, ovanför det första
// inringade tecknet. En helgardering ringar inte in något; raden står över
// krysset. null = ingen analys ännu.
function penMarks(id) {
  const r = analyses.get(id);
  const t = r && r.ok && r.tip;
  if (!t || !t.signs || !t.signs.length) return null;
  const all = t.signs.length === 3;
  return { signs: all ? [] : t.signs, at: all ? 1 : Math.min(...t.signs), note: t.note };
}

// Målen som en prislista: namnet, prickar fram till oddset.
function goalLines(goals, over25, btts) {
  const rows = [
    ['Förväntade mål', `${dec(goals[0])}–${dec(goals[1])}`],
    ['Över 2,5 mål', oddsP(over25)],
    ['Båda lagen gör mål', oddsP(btts)],
  ];
  return '<ul class="fc-lead">' + rows.map(([label, v]) => `<li><span>${label}</span><i></i><b>${v}</b></li>`).join('') + '</ul>';
}

// De tre troligaste resultaten i var sin ruta, med oddset under.
function topScores(p) {
  return '<div class="fc-top">' + p.scores.top.slice(0, 3).map((t) =>
    `<div class="fc-tbox"><b>${t.home}–${t.away}</b><span>${fmtOdds(1 / t.p)}</span></div>`).join('') + '</div>';
}

// Spelad match med journalpost: den äkta prognosen före avspark (den sista
// raden före avspark), rättad mot facit.
function journalCard(d) {
  const j = d.journal;
  const r = j.counted;
  const m = d.match;
  if (r.status !== 'ok') {
    return '<div class="card fc"><h4>Prognos före avspark</h4><p class="unknown">okänt</p><ul class="bullets">' +
      (r.reasons || []).map((x) => `<li>${esc(x)}</li>`).join('') + '</ul></div>';
  }
  const stats = goalLines(r.goals, r.over25, r.btts);
  let adv = '';
  if (r.advance !== undefined) {
    const a = r.advance && pct3(r.advance);
    adv = a
      ? `<p class="fc-adv">Går vidare: <b>${esc(m.home)} ${pctOdds(a[0])}</b> · <b>${esc(m.away)} ${pctOdds(a[1])}</b>` +
        `${j.advanced ? `<span class="sub">${esc(j.advanced === 'home' ? m.home : m.away)} gick vidare</span>` : ''}</p>`
      : '<p class="fc-adv">Går vidare: <span class="unknown">okänt</span></p>';
  }
  // Ställningen skriven för hand bredvid målen. Modellen ringade inte in
  // något före matchen, så det finns ingen bock eller något kryss att sätta.
  const out = m.score90 && j.outcome != null ? j.outcome : null;
  const graded = out == null ? '<p class="unknown">okänt</p>'
    : `<div class="fc-graded"><span class="fc-hand">${m.score90.home}–${m.score90.away}</span>` +
      `<span class="pp-stamp fc-stamp" title="Loggad ${when(r.loggedAt)}">Rättad</span></div>`;
  return '<div class="card fc"><h4>Prognos före avspark</h4>' +
    fcMain(r.p, [m.home, 'Oavgjort', m.away], m.id, out) +
    `<div class="fc-two"><div><h5>Målen</h5>${stats}</div><div><h5>Efter 90 minuter</h5>${graded}</div></div>` +
    `${adv}${j.scores ? scoreTable(j, m) : ''}</div>`;
}

// Modellen mot spelbolagen när prognosen loggades och vid avspark, utan
// spelbolagens marginal, med utfallet markerat.
function scoreTable(j, m) {
  const o = j.outcome;
  const lines = [['Modellen', 'model', 'model'], ['Spelbolagen', 'market'], ['Spelbolagen vid avspark', 'closing']];
  const rows = lines.map(([label, key, cls]) => {
    const s = j.scores[key];
    if (!s) return '';
    return `<tr class="${cls || ''}"><td>${label}</td>${listOdds(pct3(s.p)).map((v, k) => `<td class="num${k === o ? ' hit' : ''}">${v}</td>`).join('')}</tr>`;
  }).join('');
  return `<table class="odds cmp facit"><thead><tr><th></th><th class="num">1</th><th class="num">X</th><th class="num">2</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function scoreGrid(p, m) {
  const g = p.scores.grid;
  const max = Math.max(...g.flat());
  let rows = `<tr><th></th>${g[0].map((_, j) => `<th>${j}</th>`).join('')}</tr>`;
  g.forEach((row, i) => {
    rows += `<tr><th>${i}</th>${row.map((x) => {
      const a = Math.round((x / max) * 100);
      return `<td style="--a:${a}%">${x > 0.005 ? fmtOdds(1 / x) : '200+'}</td>`;
    }).join('')}</tr>`;
  });
  // Resultaten har små chanser, så oddsen räknas utan avrundning till procent.
  // De troligaste står redan i rutorna ovanför (topScores).
  return '<details class="fc-scores"><summary>Alla resultat</summary>' +
    `<div class="sgrid-wrap"><p class="muted">Odds · rader ${esc(m.home)} · kolumner ${esc(m.away)}</p><table class="sgrid">${rows}</table>` +
    `<p class="muted">5 mål eller fler för ett lag: ${p.scores.other > 0.005 ? fmtOdds(1 / p.scores.other) : '200+'}</p></div></details>`;
}

// Modellens odds överst och spelbolagens under, som de står hos bolagen:
// 1 X 2 och över 2,5 mål. Utan några odds hos bolagen ritas inget – modellen
// står redan i rutorna ovanför.
function marketCard(d) {
  const o = d.odds || {};
  const p = d.prediction && d.prediction.status === 'ok' ? d.prediction : null;
  const over = (t) => (t && t.line === 2.5 && t.over != null ? odds(t.over) : '–');
  const rows = [];
  if (o.espn) rows.push([esc(o.espn.provider), o.espn.x12.map(odds), over(o.espn.total)]);
  if (o.fdOpen && o.fdOpen.avg) rows.push(['Spelbolagens snitt', o.fdOpen.avg.map(odds), over(o.fdOpen.total25 && { line: 2.5, ...o.fdOpen.total25 })]);
  if (o.fdOpen && o.fdOpen.betfair) rows.push(['Betfair', o.fdOpen.betfair.map(odds), '–']);
  if (o.fdClose && o.fdClose.avg) rows.push(['Snitt vid avspark', o.fdClose.avg.map(odds), over(o.fdClose.total25 && { line: 2.5, ...o.fdClose.total25 })]);
  if (o.fdClose && o.fdClose.betfair) rows.push(['Betfair vid avspark', o.fdClose.betfair.map(odds), '–']);
  if (!rows.length) return '';
  if (p) rows.unshift(['Modellen', listOdds(pct3(p.p)), oddsP(p.over25), 'model']);
  return '<div class="card mk"><h4>Spelbolagen</h4><table class="odds cmp"><thead><tr><th></th><th class="num">1</th><th class="num">X</th><th class="num">2</th>' +
    '<th class="num">Över 2,5</th></tr></thead><tbody>' +
    rows.map(([label, x, ov, cls]) => `<tr${cls ? ` class="${cls}"` : ''}><td>${label}</td>${x.map((v) => `<td class="num">${v}</td>`).join('')}<td class="num">${ov}</td></tr>`).join('') +
    '</tbody></table></div>';
}

// Steg för steg som en dragkamp: startläget överst, sedan en stapel per del
// av modellen åt det lag den hjälper (procentenheter på segerchansen), och
// sist slutprognosen. Kolumnen till höger är favoritens odds efter varje steg.
function stepsCard(d) {
  const st = d.prediction.steps;
  if (!st) return '';
  const m = d.match;
  const fi = st[st.length - 1].p[0] >= st[st.length - 1].p[2] ? 0 : 2;
  const fav = fi === 0 ? m.home : m.away;
  const pulls = st.map((x, i) => {
    if (!i) return null;
    const d1 = x.p[0] - st[i - 1].p[0];
    const d2 = x.p[2] - st[i - 1].p[2];
    return { home: d1 >= d2, v: Math.round(Math.max(d1, d2) * 100) };
  });
  const scale = Math.max(8, ...pulls.map((p) => (p ? p.v : 0)));
  const gen = (n) => (/[sxz]$/i.test(n) ? n : `${n}s`);
  // Stackens delar är lika breda som chansen men märks med oddset; under 11 %
  // (odds över 9) får siffran inte plats.
  const stack = (p) => '<div class="tug-stack">' + pct3(p).map((v, i) =>
    `<span class="s${i}" style="flex:${v} 1 0">${v >= 11 ? pctOdds(v) : ''}</span>`).join('') + '</div>';
  const run = (x) => `<div class="tug-run">${pctOdds(pct3(x.p)[fi])}</div>`;
  const lab = (label, sub) => `<div class="tug-lab">${label}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div>`;

  const rows = st.map((x, i) => {
    if (!i) {
      const sub = x.label.charAt(0).toLowerCase() + x.label.slice(1);
      return `<div class="tug-row tug-start">${lab('Startpunkt', sub)}${stack(x.p)}${run(x)}</div>`;
    }
    let label = esc(x.label);
    if (x.label === 'Hemmaplan') label = `${esc(m.home)} spelar hemma`;
    else if (x.label === m.home || x.label === m.away) label = `${esc(gen(x.label))} anfall och försvar`;
    const sub = x.label === 'Hemmaplan' || !x.sub ? null : x.sub.replace(/ – mot nivåns snitt$/, '');
    const p = pulls[i];
    let track = '<i class="tug-mid"></i>';
    if (p.v >= 1) {
      const w = (p.v / scale) * 36;
      const [side, cls, team] = p.home ? ['right', 'h', m.home] : ['left', 'a', m.away];
      track += `<i class="tug-bar ${cls}" style="${side}:50%;width:${w.toFixed(1)}%"></i>` +
        `<b class="tug-v" style="${side}:calc(50% + ${w.toFixed(1)}% + 5px)" title="${esc(team)}s segerchans +${p.v} procentenheter">+${p.v}</b>`;
    } else {
      track += '<span class="tug-none">±0</span>';
    }
    return `<div class="tug-row${p.v >= 1 ? '' : ' none'}">${lab(label, sub)}<div class="tug-track">${track}</div>${run(x)}</div>`;
  });

  const axis = `<div class="tug-row tug-axis"><div class="tug-lab"></div><div class="tug-sides">` +
    `<span><i class="k h"></i>← hjälper ${esc(m.home)}</span><span>hjälper ${esc(m.away)} →<i class="k a"></i></span></div><div></div></div>`;
  const end = `<div class="tug-row tug-end"><div class="tug-lab">Slutprognos</div>${stack(st[st.length - 1].p)}<div></div></div>` +
    `<div class="tug-row tug-names"><div class="tug-lab"></div><div class="tug-sides"><span>${esc(m.home)}</span><span>${esc(m.away)}</span></div><div></div></div>`;
  return `<div class="card tug"><h4 title="${esc(`Procentenheter som varje del flyttar segerchansen · längst till höger oddset på att ${fav} vinner efter varje steg`)}">Vad drog åt vilket håll</h4>` +
    rows[0] + axis + rows.slice(1).join('') + end + '<p class="tug-more"><a href="#modell">Så fungerar modellen</a></p></div>';
}

// Förklaringarna i Form-fliken. Visas i förklaringsrutan (forklaring.js) när
// man pekar på en rubrik eller rad. En funktion får siffrorna i hemmalagets
// värde (bortalagets om hemmalagets saknas) och lagets namn, så att formatet
// förklaras med det som står på raden.
const tipNums = (v) => (v ? v.match(/[−+±]?\d+(?:,\d+)?/g) : null);
const tipNum = (s) => Number(s.replace('−', '-').replace('±', '').replace(',', '.'));
const tipPl = (n, one, many) => `${n} ${tipNum(n) === 1 ? one : many}`;
const tipOf = (base) => (n) => base + (n && n.length === 2 ? ` ”${n[0]} av ${n[1]}” betyder att det hänt i ${n[0]} av lagets ${n[1]} ligamatcher.` : '');
const tipXg = (base, say) => (n) => {
  if (!n) return base;
  const x = Math.abs(tipNum(n[0]));
  return base + ` ”${n[0]}” betyder ${x ? say(dec(x), n[0][0] === '+' ? 'fler' : 'färre') : 'precis så många mål som väntat'}.`;
};
const SIDE_TIPS = {
  'Lagen sida vid sida': 'Hemmalaget till vänster, bortalaget till höger. Där två siffror står ihop, som 15–10, kommer lagets egna först och motståndarnas sedan. Peka på en rad så förklaras den.',
  'Tabell just nu': 'Ligatabellen som den ser ut i dag. För en match som redan spelats visar den alltså läget efteråt, inte före.',
  Schemat: 'Hur tätt laget spelar runt den här matchen, i alla tävlingar. Många matcher på kort tid kan ge trötta ben – eller att tränaren vilar några av de bästa.',
  'Ligan hittills': 'Lagets ligamatcher den här säsongen, fram till den här matchen. Cuper och Europaspel räknas inte.',
  'Målprofil i ligan': 'Hur lagets ligamatcher brukar sluta. ”6 av 10” betyder att det hänt i sex av lagets tio ligamatcher.',
  'Skott och xG per match': 'Snitt per ligamatch. Första siffran gäller laget, den andra motståndarna.',
  'Spelar i': 'Ligan laget spelar i. Nivån visar var den ligger i det engelska seriesystemet: 1 är Premier League, 2 Championship, 3 League One, 4 League Two och 5 National League.',
  Placering: 'Lagets plats i ligatabellen just nu och hur många lag ligan har. Ettan är bäst.',
  Poäng: (n, t) => 'Poäng i tabellen och antal spelade ligamatcher. Vinst ger tre poäng och oavgjort en.' +
    (n && n.length === 2 && tipNum(n[1]) ? ` ”${n[0]} på ${n[1]}” betyder att ${t} har ${n[0]} poäng efter ${n[1]} matcher, i snitt ${dec(tipNum(n[0]) / tipNum(n[1]))} per match.` : ''),
  Målskillnad: 'Gjorda mål minus insläppta i ligan. Plus betyder att laget gjort fler mål än det släppt in. Har två lag lika många poäng avgör målskillnaden vilket som ligger högst.',
  Poängavdrag: 'Poäng som ligan dragit av som straff, oftast för brott mot de ekonomiska reglerna. Avdraget är redan räknat i poängen ovan.',
  'Dagar sedan förra matchen': 'Dagar sedan lagets förra match, i alla tävlingar – inom parentes vilken tävling den gällde. Dagarna räknas mellan matchdagarna: torsdag till söndag blir tre. Kort vila kan ge trötta ben.',
  'Matcher senaste': 'Antal matcher i alla tävlingar under perioden före den här matchen. Inom parentes: hur många av dem som var i Europacuperna – ofta med långa resor mitt i veckan. Ett tätt schema sliter på truppen.',
  'Dagar till nästa match': 'Dagar från den här matchen till lagets nästa, i alla tävlingar – inom parentes vilken tävling den gäller. Väntar en viktig match strax efter kan tränaren spara spelare. ”Ingen inlagd” betyder att nästa match inte är bestämd än.',
  Matcher: 'Antal ligamatcher laget spelat den här säsongen, före den här matchen.',
  'V–O–F': (n) => 'Vinster, oavgjorda och förluster i ligan.' +
    (n && n.length === 3 ? ` ”${n.join('–')}” betyder ${tipPl(n[0], 'vinst', 'vinster')}, ${tipPl(n[1], 'oavgjord', 'oavgjorda')} och ${tipPl(n[2], 'förlust', 'förluster')}.` : ''),
  Mål: (n) => 'Gjorda och insläppta mål i ligan.' + (n && n.length === 2 ? ` ”${n[0]}–${n[1]}” betyder att laget gjort ${n[0]} mål och släppt in ${n[1]}.` : ''),
  'Hemma V–O–F': 'Vinster, oavgjorda och förluster i lagets hemmamatcher i ligan. Många lag är klart bättre på hemmaplan.',
  'Borta V–O–F': 'Vinster, oavgjorda och förluster i lagets bortamatcher i ligan.',
  'Mål per match': (n) => 'Gjorda och insläppta mål i snitt per ligamatch.' + (n && n.length === 2 ? ` ”${n[0]}–${n[1]}” betyder att laget i snitt gör ${n[0]} mål per match och släpper in ${n[1]}.` : ''),
  'Över 2,5 mål': tipOf('Matcher med minst tre mål sammanlagt, oavsett vilket lag som gjorde dem. Halva mål finns inte, så 2,5 är gränsen mellan två och tre mål – samma gräns som hos spelbolagen.'),
  'Båda lagen gör mål': tipOf('Matcher där båda lagen gjort minst ett mål var.'),
  'Hållit nollan': tipOf('Matcher där laget inte släppt in något mål.'),
  'Inte gjort mål': tipOf('Matcher där laget inte gjort något mål.'),
  Skott: (n) => 'Avslut per match i snitt, alla sorter – även de som går utanför eller blockeras.' + (n && n.length === 2 ? ` ”${n[0]}–${n[1]}” betyder att laget skjuter ${n[0]} gånger per match och motståndarna ${n[1]}.` : ''),
  'Skott på mål': (n) => 'Skott som hade gått in om inte målvakten räddat – alltså mål plus räddningar.' + (n && n.length === 2 ? ` ”${n[0]}–${n[1]}” betyder ${n[0]} per match för laget och ${n[1]} för motståndarna.` : ''),
  xG: (n) => 'Förväntade mål (expected goals): hur många mål chanserna brukar ge, utifrån var och hur skotten kommer. En straff är värd ungefär 0,8 xG, ett skott från 25 meter kanske 0,03. xG säger ofta mer om hur bra ett lag är än målen gör, eftersom det inte påverkas av om skotten råkar gå in.' +
    (n && n.length === 2 ? ` ”${n[0]}–${n[1]}” betyder att lagets chanser i snitt är värda ${n[0]} mål per match och motståndarnas ${n[1]}.` : ''),
  'Gjorda mål mot xG': tipXg('Lagets mål minus dess xG, summerat över säsongen. Plus betyder fler mål än chanserna brukar ge – vassa avslut eller tur. Sådant brukar jämna ut sig, så ett stort plus kan betyda att målen tryter framöver.', (x, d) => `${x} mål ${d} än väntat`),
  'Insläppta mål mot xG': tipXg('Insläppta mål minus motståndarnas xG, summerat över säsongen. Här är minus bra: laget har släppt in färre mål än motståndarnas chanser brukar ge – en målvakt i storform eller tur. Även det brukar jämna ut sig.', (x, d) => `${x} ${d} insläppta mål än väntat`),
};

// data-tip-attributen för en rubrik eller rad; tomt om förklaring saknas.
function sideTip(label, values = [], names = []) {
  let t = SIDE_TIPS[label] || (label.startsWith('Matcher senaste') ? SIDE_TIPS['Matcher senaste'] : null);
  if (typeof t === 'function') {
    const i = values[0] != null ? 0 : 1;
    t = t(tipNums(values[i]), names[i]);
  }
  return t ? ` data-tip-head="${esc(label)}" data-tip="${esc(t)}"` : '';
}

const FORM_TIP = 'Lagets fem senaste matcher i alla tävlingar, nyast till vänster. V = vinst, O = oavgjort, F = förlust. ' +
  'Det är ställningen efter 90 minuter som gäller, så en match som avgjorts i förlängning eller på straffar räknas som oavgjord. ' +
  'Strecket under rutan är motståndets styrka enligt modellen, från den egna divisionens svagaste lag (kort streck) till dess starkaste (helt streck). ' +
  'Utan streck är styrkan okänd, som för lag utanför England. Peka på en ruta för att se vilken match det var.';
const FORM_RESULT = { V: 'Vinst', O: 'Oavgjort', F: 'Förlust' };
const formOrdinal = (n) => `${n}:${n % 10 >= 1 && n % 10 <= 2 && (n % 100 < 11 || n % 100 > 12) ? 'a' : 'e'}`;

// Motståndets styrka som ett streck under rutan (matchblad.css).
function oppBar(x) {
  return x.opp && x.opp.level != null ? ` style="--opp:${Math.round(8 + 92 * x.opp.level)}%"` : '';
}

function formCard(d) {
  const chip = (x) => {
    const where = `${x.home ? 'hemma' : 'borta'}${x.opponent ? ` mot ${x.opponent}` : ''}`;
    const score = x.gf == null ? '' : ` · ${x.gf}–${x.ga}${x.decided ? ` efter 90 minuter, avgjord ${x.decided === 'straffar' ? 'på straffar' : 'i förlängning'}` : ''}`;
    const opp = x.opp && x.opp.rank ? `. ${x.opponent} är ${formOrdinal(x.opp.rank)} av ${x.opp.of} i ${x.opp.league} enligt modellen.` : '';
    return `<span class="${x.result || ''}"${oppBar(x)} data-tip-head="${FORM_RESULT[x.result] || 'Resultat saknas'}" ` +
      `data-tip="${esc(`${dateOnly(x.date)} · ${x.comp} · ${where}${score}${opp}`)}">${x.result || '?'}</span>`;
  };
  const row = (name, p, cls) => {
    const f = p.form || [];
    const chips = f.length
      ? f.map((x) => (window.Spoiler && Spoiler.hidesDay(x.date)
        ? `<span class="sp-form"${oppBar(x)} data-tip-head="Dold" data-tip="Du har valt att dölja resultat.">?</span>`
        : chip(x))).join('')
      : '<span class="muted" style="width:auto;background:none;font-weight:400">inga tidigare matcher</span>';
    return `<div class="form-row ${cls}"><span class="t"><i class="mr-key"></i>${esc(name)}</span><span class="form">${chips}</span></div>`;
  };
  let html = `<div class="card mf-form"><h4><span data-tip-head="Form" data-tip="${esc(FORM_TIP)}">Form</span></h4>` +
    row(d.match.home, d.teams.home, 'h') + row(d.match.away, d.teams.away, 'a') + '</div>';
  // Inbördes möten: i år med datum, tidigare säsonger de senaste åren – äldre
  // säger lite om lagen i dag.
  const pm = d.pastMeetings;
  const since = Date.now() - PAST_YEARS * 365.25 * 86400000;
  const past = pm ? pm.list.filter((x) => x.date && Date.parse(x.date) >= since) : [];
  const meet = (when, x, hide) => `<li><span class="w">${when} · ${esc(x.compShort)}</span><span class="h">${esc(x.home)}</span>` +
    `<b>${hide && window.Spoiler ? Spoiler.chip() : `${x.score.home}–${x.score.away}`}</b><span class="a">${esc(x.away)}</span></li>`;
  const list = d.meetings.map((x) => meet(dateOnly(x.kickoff), x, window.Spoiler && Spoiler.hidesDay(x.kickoff)))
    .concat(past.map((x) => meet(esc(x.season), x, false)));
  if (list.length) html += `<div class="card mf-meet"><h4>Inbördes möten</h4><ul>${list.join('')}</ul></div>`;
  return html;
}

// xG finns för Premier League från två källor. Bara en visas: Understat där
// den finns (etablerad leverantör), annars football-data.co.uk.
function oneXg(rows) {
  const xg = rows.filter((r) => /^xG \(/.test(r.label));
  const keep = xg.find((r) => r.label === 'xG (Understat)') || xg[0];
  return rows.filter((r) => !xg.includes(r) || r === keep).map((r) => (r === keep ? { ...r, label: 'xG' } : r));
}

// Lagen sida vid sida. Ligan står bara med när lagen spelar i olika ligor, och
// tabelläget bara när det inte finns en flik med tabellen.
function sideCard(d, table) {
  let rows = '';
  for (const g of d.rows) {
    if (table && g.title === 'Tabell just nu') continue;
    if (g.title === 'Liga' && g.rows.every((r) => r.values[0] === r.values[1])) continue;
    rows += `<tr class="group"${sideTip(g.title)}><td colspan="3">${esc(g.title)}</td></tr>`;
    for (const r of oneXg(g.rows)) {
      rows += `<tr${sideTip(r.label, r.values, [d.match.home, d.match.away])}><td class="h">${val(r.values[0])}</td><td class="mid">${esc(r.label)}</td><td class="a">${val(r.values[1])}</td></tr>`;
    }
  }
  return `<div class="card"><h4><span${sideTip('Lagen sida vid sida')}>Lagen sida vid sida</span></h4>` +
    `<div class="table-wrap" style="margin:0"><table class="side"><thead><tr>` +
    `<th style="text-align:right"><i class="mr-key"></i>${esc(d.match.home)}</th><th class="mid"></th><th>${esc(d.match.away)}<i class="mr-key a"></i></th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div></div>`;
}

// Frånvaron från Fantasy Premier League (texten på svenska, src/skadetext.js)
// i samma form som startelvornas lista – startelvorna använder den när
// 365Scores inte har något om matchen än.
function absentees(d) {
  const team = (s) => (!s || s.unknown ? null : s.players.map((p) => ({
    name: p.name,
    doubtful: p.status === 'tveksam',
    why: p.news ? p.news.charAt(0).toLowerCase() + p.news.slice(1) : p.status,
    raw: p.chance != null ? `${p.chance} % chans att spela` : '',
  })));
  return { home: team(d.squad.home), away: team(d.squad.away) };
}

// Skadorna utan startelvornas flik (matchruta.js saknas): namnen per status.
const SQUAD_GROUPS = [
  ['skadad', 'Skadade'],
  ['avstängd', 'Avstängda'],
  ['ej uttagbar', 'Ej uttagbara'],
  ['tveksam', 'Osäkra'],
];

function squadCard(d) {
  const block = (name, s) => {
    if (s.unknown) return '';
    const h = `<p style="margin:0.2rem 0 0.3rem"><strong>${esc(name)}</strong></p>`;
    if (!s.players.length) return h + '<p class="muted" style="margin:0 0 0.6rem">Inga skador eller avstängningar.</p>';
    return h + SQUAD_GROUPS.map(([status, label]) => {
      const ps = s.players.filter((p) => p.status === status);
      if (!ps.length) return '';
      return `<p class="inj-line"><span class="muted">${label}:</span> ${ps.map((p) => `<span${p.news ? ` title="${esc(p.news)}"` : ''}>${esc(p.name)}</span>`).join(', ')}</p>`;
    }).join('');
  };
  const html = block(d.match.home, d.squad.home) + block(d.match.away, d.squad.away);
  return html ? `<div class="card inj"><h4>Skador och avstängningar</h4>${html}</div>` : '';
}

// Domaren (football-data.co.uk) som i ett matchprogram: namnet och fyra tal
// från hans eller hennes ligamatcher före matchdagen, med divisionens snitt
// under samma period under varje tal. Inte utsedd än: ingenting.
function refereeCard(d) {
  const r = d.referee;
  if (!r || r.unknown) return '';
  const s = r.stats;
  const a = r.avg;
  const divs = r.divisions.map((x) => `${x.short} ${x.n}`).join(', ');
  let html = `<p class="ref-name"><b>${esc(r.name)}</b>` +
    `<span class="muted"${divs ? ` title="${esc(divs)}"` : ''}>${s.n ? `${s.n} ligamatcher sedan ${monthYear(r.since)}` : 'inga ligamatcher i underlaget'}</span></p>`;
  if (s.n) {
    const flag = (f) => (f === 'more' ? '<span class="ref-flag" title="Klart över snittet">▲</span>'
      : f === 'less' ? '<span class="ref-flag" title="Klart under snittet">▼</span>' : '');
    const figs = [
      ['Gula kort', dec(s.yellow, 1) + flag(r.flags.yellow), a && dec(a.yellow, 1)],
      ['Röda kort', dec(s.red, 2), a && dec(a.red, 2)],
      ['Frisparkar', s.fouls == null ? '–' : dec(s.fouls, 1), a && a.fouls != null ? dec(a.fouls, 1) : null],
      ['Hemmaseger', `${pct(s.home)} %` + flag(r.flags.home), a && `${pct(a.home)} %`],
    ];
    html += '<div class="ref-figs">' + figs.map(([k, v, w]) =>
      `<div><b>${v}</b><span>${k}</span>${w == null ? '' : `<small>snitt ${w}</small>`}</div>`).join('') + '</div>';
    if (s.n < r.min) html += '<p class="note">För få matcher för att dra slutsatser.</p>';
  }
  return `<div class="card ref" title="Per match, båda lagen tillsammans · domaren styr inte prognosen"><h4>Domare</h4>${html}</div>`;
}

// ---------- trupperna (ESPN, ligamatcher i år) ----------

const POS_NAME = { MV: 'Målvakter', B: 'Backar', MF: 'Mittfältare', A: 'Anfallare' };

function squadsSection(d) {
  const s = d.squads;
  if (!s) return '';
  return `<div class="mr-teams">${teamSquadCard(d.match.home, s.home, 'h')}${teamSquadCard(d.match.away, s.away, 'a')}</div>`;
}

// tip = förklaringen när man pekar på rubriken (forklaring.js).
function keyList(title, list, value, empty, tip) {
  const head = tip ? ` data-tip="${esc(tip)}" data-tip-head="${esc(title)}"` : '';
  return `<div class="mv-key"><h5${head}>${esc(title)}</h5>` + (list.length
    ? `<ol>${list.map((p) => `<li><span class="n">${esc(p.name)}</span><span class="v">${value(p)}</span></li>`).join('')}</ol>`
    : `<p class="muted">${esc(empty)}</p>`) + '</div>';
}

function teamSquadCard(name, s, cls) {
  const h4 = `<h4><i class="mr-key"></i>${esc(name)}</h4>`;
  if (!s || s.unknown) {
    return `<div class="card mv-squad ${cls}">${h4}<p class="unknown">okänt – ${esc(s ? s.reason : 'ingen spelardata')}</p></div>`;
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
  return `<div class="card mv-squad ${cls}">${h4}<p class="mv-facts">${facts}</p>` +
    '<div class="mv-keys">' +
    keyList('Målskyttar', s.key.scorers.filter((p) => p.g > 0), (p) => `<b>${p.g}</b>`, 'inga mål än') +
    keyList('Assist', s.key.creators.filter((p) => p.a > 0), (p) => `<b>${p.a}</b>`, 'inga assist än') +
    // Högst tre listor: segermålen i stället för korten där de finns (korten
    // står kvar i hela truppen).
    (s.key.winners
      ? keyList('Segermål', s.key.winners.filter((p) => p.gw > 0), (p) => `<b>${p.gw}</b>`, 'inga segermål än',
        'Målet som gav laget den ledning det sedan aldrig tappade. Vid 3–1 är lagets andra mål segermålet.')
      : keyList('Flest gula kort', s.key.cards, yc, 'ingen med 3 eller fler')) +
    '</div>' +
    `<details class="mv-full"><summary>Hela truppen (${s.players.length})</summary><div class="table-wrap"><table class="odds mv-table">` +
    '<thead><tr><th>Spelare</th><th class="num" title="Matcher">M</th><th class="num">Mål</th><th class="num" title="Assist">Ass</th><th class="num" title="Gula kort">Gul</th><th class="num" title="Röda kort">Röd</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div></details></div>`;
}

// ---------- tabellen (ESPN, data/teams/<division>.json) ----------

// Divisionerna med en tabell för lagen i matchen: en när lagen spelar i samma
// division, annars en per lag (cupen). Lag under League Two har ingen.
const TABLE_DIVS = new Set(['pl', 'ch', 'l1', 'l2']);
const tableFiles = new Map(); // division → Promise med filen
// Zonerna som på Tabeller (divisioner.js), med samma ord.
const ZONES = [
  [/relegation/i, 'z-down', 'Nedflyttning'],
  [/playoff/i, 'z-po', 'Kval till uppflyttning'],
  [/champions league/i, 'z-up', 'Champions League'],
  [/europa|conference/i, 'z-eu', 'Europa- eller Conference League'],
  [/promotion/i, 'z-up', 'Direkt uppflyttning'],
];
const zoneOf = (note) => (note ? ZONES.find(([re]) => re.test(note)) || null : null);

function tableDivs(d) {
  const ids = [d.teams.home, d.teams.away].map((t) => t && t.league && t.league.id).filter((id) => TABLE_DIVS.has(id));
  return [...new Set(ids)];
}

function loadTable(id) {
  if (!tableFiles.has(id)) {
    const p = getJSON(`data/teams/${id}.json`);
    p.catch(() => tableFiles.delete(id));
    tableFiles.set(id, p);
  }
  return tableFiles.get(id);
}

// En division: hela tabellen med matchens lag markerade, eller – när lagen
// spelar i olika divisioner – lagets placering med tre lag på var sida.
function leagueTable(T, keys, cut) {
  const rows = T.teams;
  const mine = (r) => keys.indexOf(r.key);
  let show = rows;
  if (cut) {
    const at = rows.findIndex((r) => mine(r) >= 0);
    show = rows.slice(Math.max(0, at - 3), at + 4);
  }
  const gap = '<tr class="gap"><td colspan="9">⋯</td></tr>';
  const body = show.map((r) => {
    const z = zoneOf(r.note);
    const k = mine(r);
    const gd = r.gd > 0 ? `+${r.gd}` : r.gd < 0 ? `−${-r.gd}` : '0';
    return `<tr class="${[z ? z[1] : '', k === 0 ? 'mine h' : k === 1 ? 'mine a' : ''].join(' ').trim()}"${z ? ` title="${esc(z[2])}"` : ''}>` +
      `<td class="c rank">${r.rank}</td><td class="team">${k >= 0 ? '<i class="mr-key"></i>' : ''}${esc(r.name)}</td>` +
      `<td class="num">${r.m}</td><td class="num hide-sm">${r.w}</td><td class="num hide-sm">${r.d}</td><td class="num hide-sm">${r.l}</td>` +
      `<td class="num hide-sm">${r.gf}–${r.ga}</td><td class="num">${gd}</td>` +
      `<td class="num pts">${r.pts}${r.ded ? `<sup title="${r.ded} poängs avdrag">*</sup>` : ''}</td></tr>`;
  }).join('');
  const zones = [];
  for (const r of rows) {
    const z = zoneOf(r.note);
    if (z && !zones.some((x) => x[2] === z[2])) zones.push(z);
  }
  return '<div class="table-wrap"><table class="odds mt-table"><thead><tr><th class="c">#</th><th>Lag</th>' +
    '<th class="num" title="Spelade">S</th><th class="num hide-sm" title="Vunna">V</th><th class="num hide-sm" title="Oavgjorda">O</th><th class="num hide-sm" title="Förlorade">F</th>' +
    '<th class="num hide-sm">Mål</th><th class="num" title="Målskillnad">+/−</th><th class="num" title="Poäng">P</th></tr></thead>' +
    `<tbody>${cut && show[0] !== rows[0] ? gap : ''}${body}${cut && show[show.length - 1] !== rows[rows.length - 1] ? gap : ''}</tbody></table></div>` +
    (cut ? '' : `<p class="mt-zones">${zones.map(([, cls, label]) => `<span class="${cls}"><i></i>${esc(label)}</span>`).join('')}</p>`);
}

// Fyller fliken Tabellen när filerna kommit. Har divisionen matcher som döljs
// just nu ligger tabellen bakom samma ridå som på Tabeller – den räknar redan
// med resultaten.
async function tableFill(root, d) {
  const el = root.querySelector('[data-mr-table]');
  if (!el) return;
  const ids = tableDivs(d);
  const keys = [d.teams.home.key, d.teams.away.key];
  let html = '';
  try {
    const files = await Promise.all(ids.map(loadTable));
    const ms = window.Spoiler && Spoiler.on() ? await Spoiler.matches() : null;
    html = files.map((T, i) => {
      if (T.unknown || !T.teams) return `<div class="card"><h4>${esc(T.name || ids[i])}</h4><p class="unknown">okänt</p></div>`;
      if (ms) {
        const recent = ms.filter((m) => m.comp === T.comp && Spoiler.hides(m.kickoff));
        const n = recent.filter(Spoiler.hidden).length;
        const key = `div:${T.comp}:${recent.map((m) => m.id).sort().join(',')}`;
        if (n && !Spoiler.isShown(key)) {
          return Spoiler.card({ title: `${n} ${n === 1 ? 'match' : 'matcher'} i ${T.name} är dolda`, text: 'Tabellen räknar med resultaten.', keys: [key] });
        }
      }
      return `<div class="card mt-card"><h4>${esc(T.name)}</h4>${leagueTable(T, keys, ids.length > 1)}</div>`;
    }).join('');
  } catch (err) {
    html = `<p class="unknown">Kunde inte läsa tabellen: ${esc(err.message)}</p>`;
  }
  if (state.detail === d && root.contains(el)) el.innerHTML = html;
}

// ---------- artikeln inför matchen ----------

// Inför varje match på omgångens kupong läser Claude på och skriver en
// artikel (worker/artikel.mjs). Proxyn lämnar ut den bredvid analysen
// (…/analyze → …/artikel). Per match: artikeln eller null.
const articles = new Map();

async function loadArticle(id) {
  const a = state.meta && state.meta.analysis;
  if (!a || !a.endpoint || articles.has(id)) return;
  try {
    // Matchbladet väntar inte längre än så på artikeln.
    const res = await fetch(`${a.endpoint.replace(/analyze$/, 'artikel')}?id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(2500) });
    const j = res.ok ? await res.json() : null;
    articles.set(id, j && j.ok && j.article ? j.article : null);
  } catch {
    // Ingen artikel den här gången – nästa öppning försöker igen.
  }
}

// Rubrik, ingress och stycken med hänvisningar till källistan, som
// Redaktionens analys på gravergrav.se.
function articlePane(a) {
  const refs = refLinks(a.sources);
  const para = (t, cls) => `<p class="${cls}">${refs(esc(t)).replace(/(\d) %/g, '$1&nbsp;%')}</p>`;
  const at = a.writtenAt ? fDateTime.format(new Date(a.writtenAt)) : 'okänt';
  return `<article class="card artikel"><h4 title="${esc(`Skriven av ${a.model} efter sökningar på nätet · rapporterat i media, inte kontrollerat av Matchfixarna och inte med i prognosen`)}">Skriven ${esc(at)}</h4>` +
    `<h3 class="art-title">${esc(a.title)}</h3>` +
    (a.lead ? para(a.lead, 'art-lead') : '') +
    a.paragraphs.map((t) => para(t, 'analysis-text')).join('') +
    sourceList(a.sources) + '</article>';
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
  if (r && r.ok && r.research) return researchCard(r);
  if (r && r.ok) {
    const other = r.builtAt && d.builtAt && r.builtAt !== d.builtAt;
    return `<div class="card analysis" id="analysis-card"><h4 title="${esc(`Skriven av ${r.model} ${when(r.generatedAt)} ur underlaget från uppdateringen ${when(r.builtAt)} · alla tal i texten finns i underlaget`)}">Analys</h4>` +
      `<p class="analysis-text">${esc(r.text).replace(/(\d) %/g, '$1&nbsp;%')}</p>` +
      (r.news ? newsSection(r.news) : '') +
      (other ? '<p class="note">Sidan och texten bygger på olika uppdateringar – ladda om sidan.</p>' : '') + '</div>';
  }
  // retry: false = svaret klarade inte kontrollen; samma underlag ger samma
  // svar, eller (again) samma svar en stund.
  const final = r && r.retry === false;
  return `<div class="card analysis" id="analysis-card"><h4>Analys</h4>` +
    (r ? `<p class="unknown">Ingen analys: ${esc(r.error || 'okänt fel')}${final ? esc(r.again || ' En ny text kan skrivas när underlaget ändrats.') : ''}</p>` : '') +
    (final ? '' : `<button type="button" class="analyze" data-id="${esc(d.match.id)}" title="${a.news
      ? 'AI:n läser tidningar, presskonferenser och supporterforum på nätet och ringar in sina tecken'
      : 'En språkmodell skriver bara ur underlaget på sidan – en text med ett tal som inte finns där visas inte'}">${r ? 'Försök igen' : 'Analysera'}</button>`) + '</div>';
}

// Analysen med research: texten, nyhetsläget och läktarsnacket med
// hänvisningar till en gemensam källista. Tecknen ringas in i rutorna ovanför
// (penMarks).
function researchCard(r) {
  const n = r.news || { sources: [] };
  const paras = (t) => (t || '').split(/\n\s*\n/).filter((p) => p.trim())
    .map((p) => `<p class="analysis-text">${refLinks(n.sources)(esc(p.trim())).replace(/(\d) %/g, '$1&nbsp;%')}</p>`).join('');
  const at = r.generatedAt ? fDateTime.format(new Date(r.generatedAt)) : 'okänt';
  return `<div class="card analysis" id="analysis-card"><h4 title="${esc(`Skriven av ${r.model} ${at} efter sökningar på nätet · rapporterat i media, inte kontrollerat av Matchfixarna och inte med i prognosen`)}">Analys</h4>` +
    paras(r.text) +
    (n.text ? `<div class="analysis-news"><h5>Nyhetsläget</h5>${paras(n.text)}</div>` : '') +
    (n.crowd ? `<div class="analysis-news"><h5>Läktarsnacket</h5>${paras(n.crowd)}</div>` : '') +
    sourceList(n.sources) + '</div>';
}

// Upphöjda hänvisningar [1], [2] … som länkar direkt till artikeln (ett
// #-ankare skulle byta vy, sidan navigerar med #match/…).
const safeHref = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : null);
function refLinks(sources) {
  const src = new Map(sources.map((s) => [String(s.n), s]));
  const link = (k) => {
    const s = src.get(k);
    const u = s && safeHref(s.url);
    return u ? `<a href="${u}" target="_blank" rel="noopener" title="${esc(`${s.source}: ${s.title}`)}">${k}</a>` : k;
  };
  return (t) => t.replace(/\[(\d+(?:, \d+)*)\]/g, (m, ks) => `<sup class="ref">${ks.split(', ').map(link).join(',')}</sup>`);
}

// Den numrerade källistan, med bara de citerade artiklarna.
function sourceList(sources) {
  if (!sources.length) return '';
  return '<ol class="news-sources">' + sources.map((s) => {
    const u = safeHref(s.url);
    const title = u ? `<a href="${u}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title);
    return `<li value="${s.n}">${title} <span class="muted">${esc(s.source)}${s.publishedAt ? ` · ${dateOnly(s.publishedAt)}` : ''}</span></li>`;
  }).join('') + '</ol>';
}

// Nyhetsläget: eget avsnitt under analysen, som Redaktionens analys på
// gravergrav.se – upphöjda hänvisningar [1], [2] … och en numrerad källista
// med bara de citerade artiklarna.
function newsSection(n) {
  const refs = refLinks(n.sources);
  const paras = n.text.split(/\n\s*\n/).filter((p) => p.trim())
    .map((p) => `<p class="analysis-text">${refs(esc(p.trim())).replace(/(\d) %/g, '$1&nbsp;%')}</p>`).join('');
  const lead = n.gatheredAt ? `Ur nyheter hämtade ${when(n.gatheredAt)} – rapporterat` : 'Rapporterat';
  return `<div class="analysis-news"><h5 title="${esc(`${lead} i media, inte kontrollerat av Matchfixarna och inte med i prognosen`)}">Nyhetsläget</h5>${paras}${sourceList(n.sources)}</div>`;
}

async function runAnalysis(id, btn) {
  btn.disabled = true;
  // AI:n läser på en dryg minut – tiden tickar, så att det syns att något händer.
  const t0 = Date.now();
  const tick = () => {
    const s = Math.round((Date.now() - t0) / 1000);
    btn.textContent = s < 5 ? 'Läser på …' : `Läser på … ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  tick();
  const timer = setInterval(tick, 1000);
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
  clearInterval(timer);
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
        drawDetail();
      }
      return;
    } catch {
      // Visa texten ändå – kortet säger att sidan visar ett annat bygge.
    }
  }
  const card = $('#analysis-card');
  if (card) card.outerHTML = analysisCard(d);
  // Tecknen AI:n ringade in ritas med pennan i rutorna ovanför.
  const main = $('#match-detail-view .fc-main');
  if (main && penMarks(id)) {
    main.outerHTML = fcMain(d.prediction.p, [d.match.home, 'Oavgjort', d.match.away], id).replace('class="fc-main"', 'class="fc-main fc-fresh"');
  }
}

$('#match-detail-view').addEventListener('click', (e) => {
  const b = e.target.closest('button.analyze');
  if (b && !b.disabled) runAnalysis(b.dataset.id, b);
  if (e.target.closest('[data-close]')) closeMatch();
  const t = e.target.closest('[data-mtab]');
  if (t) selectMatchTab(t.dataset.mtab);
});
// Piltangenterna mellan flikarna.
$('#match-detail-view').addEventListener('keydown', (e) => {
  const t = e.target.closest('[data-mtab]');
  if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const all = [...$('#match-detail-view').querySelectorAll('[data-mtab]')];
  const i = all.indexOf(t);
  const j = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
  e.preventDefault();
  selectMatchTab(all[j].dataset.mtab, true);
});

// Utvärderingen, Källor och Modell ritas i kallor.js och modell.js.

// ---------- spoilerskyddet ----------

// Läget ändrades eller en match visades ändå: rita om det som syns (kupongen
// ritar om sig själv, se kupong.js).
if (window.Spoiler) {
  Spoiler.onChange(() => {
    renderMatchList();
    if ($('#match-modal').open && state.detail) drawDetail();
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
    $('#topline').hidden = false;
  }
  // meta.json kan komma ur cachen innan skripten efter app.js (kupong.js och
  // resten) har körts – route() och matchlistan anropar dem.
  if (document.readyState === 'loading') await new Promise((ok) => document.addEventListener('DOMContentLoaded', ok, { once: true }));
  renderChips();
  loadMatches();
  loadSources();
  route();
})();
