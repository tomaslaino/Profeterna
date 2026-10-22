'use strict';

// ---------- Modell ----------
//
// Sidan Modell (#modell, #utvardering) i den ordning en nyfiken läsare frågar:
//
//   Så räknas en prognos   fyra steg på vanlig svenska och ett räknat exempel
//                          (nästa match i Premier League, ur matchens fil)
//   Avståndet mellan       ett snittlag per division mot ett snittlag i
//   divisionerna           Premier League
//   Hur bra är den?        efterhandstestet: modellen bland måttstockarna,
//                          säsong för säsong, division för division, cuperna
//   I skarpt läge          prognosjournalen rättad mot facit (#utvardering)
//   Prövat och förkastat   kandidatjakten
//   Detaljer               parametrarna, måttstockarna och efterhandstestet
//
// Data: data/model.json och data/evaluation.json. Läses före app.js och
// använder dess hjälpare ($, esc, getJSON, dec, pct, pct3, listOdds, when,
// dateOnly, tiles, method, defs, compOf, isHidden, state, Spoiler) först när
// sidan ritas.

const f3 = (x) => dec(x, 3);
const n0 = (x) => x.toLocaleString('sv-SE');
// Med tecken: +0,022 / −0,034 / ±0,000
function sgn(x, d = 3) {
  const v = dec(Math.abs(x), d);
  return Math.round(Math.abs(x) * 10 ** d) === 0 ? `±${v}` : x > 0 ? `+${v}` : `−${v}`;
}

// Måttstockarnas namn i klarspråk. (Stod förr i app.js för matchrutan, som
// inte visar dem längre.)
const BASE = {
  market: 'Spelbolagen',
  closing: 'Spelbolagen vid avspark',
  season: 'Bara årets mål',
  naive: 'Ligasnittet',
};

// Måttstockarna i ordning från den enklaste till den svåraste, med
// efterhandstestets nycklar (ss, nv, mk, cl) och journalens (season, naive,
// market, closing).
const MEASURES = [
  { bt: 'nv', ev: 'naive', name: () => BASE.naive, short: 'Ligasnittet' },
  { bt: 'ss', ev: 'season', name: () => BASE.season, short: 'Årets mål' },
  { bt: 'mk', ev: 'market', name: () => BASE.market, short: 'Spelbolagen' },
  { bt: 'cl', ev: 'closing', name: () => BASE.closing, short: 'Vid avspark' },
];
// Kolumnrubrik för skillnaden mot en måttstock.
const vsTh = (m) => `<th class="num" title="${esc(`Modellen − ${mlLow(m.name())} i log-poäng. Under noll = modellen bättre.`)}">${esc(m.short)}</th>`;
const mlMeasure = (key) => MEASURES.find((m) => m.bt === key || m.ev === key);
const mlLow = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// Modellen mot en måttstock: bättre, sämre eller går inte att skilja åt
// (intervallet når över noll). Intervallet avgör bara färgen och syns inte.
function verdictOf(c) {
  if (!c || !c.n || c.diff == null || !c.ci) return null;
  return c.ci[1] < 0 ? 'better' : c.ci[0] > 0 ? 'worse' : 'even';
}
// En skillnad som cell: tecknet och färgen, antalet matcher i title.
function diffTd(c, { strong = false } = {}) {
  if (!c || !c.n) return '<td class="num muted">–</td>';
  if (c.diff == null) return `<td class="num muted">för få<span class="sub">${n0(c.n)} matcher</span></td>`;
  const v = verdictOf(c);
  const txt = strong ? `<strong>${sgn(c.diff)}</strong>` : sgn(c.diff);
  return `<td class="num ml-${v}" title="${n0(c.n)} matcher">${txt}</td>`;
}

async function loadModel() {
  const el = $('#model');
  const more = $('#model-more');
  try {
    const d = await getJSON('data/model.json');
    el.innerHTML = renderModel(d);
    more.innerHTML = renderModelMore(d);
    state.backtest = d.backtest && d.backtest.current;
    drawSeasonChart();
    loadExample();
  } catch (err) {
    el.innerHTML = `<p class="empty">Kunde inte läsa modellen: ${esc(err.message)}</p>`;
    more.innerHTML = '';
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
  let html = `<p class="intro ml-meta">Regelversion <strong>${esc(d.rulesVersion)}</strong>` +
    `${x ? ` · skattad på matcherna t.o.m. ${dateOnly(x.fitThrough)}` : ''}</p>`;
  if (!x) return html + `<p class="unknown">okänt – ${d.error ? `prognosmotorn misslyckades vid senaste uppdateringen: ${esc(d.error)}` : 'inget underlag i källcachen att skatta modellen på'}.</p>`;
  html += howSection(x);
  html += tiersSection(x);
  html += qualitySection(d.backtest, d.rulesVersion, x);
  return html;
}

// ---------- så räknas en prognos ----------

function howSection(x) {
  const table = (x.factors || []).find((f) => f.id === 'table');
  const half = x.halfLifeDays === 365 ? 'ett år' : `${x.halfLifeDays} dagar`;
  const home = Math.round((x.homeAdvantage - 1) * 100);
  const steps = [
    ['Underlaget', `${n0(x.matches)} matcher i de fem högsta divisionerna sedan ${esc(x.firstSeason)} och årets cupmatcher. ` +
      `Nyare matcher väger tyngre: en match för ${half} sedan räknas hälften så mycket som en från i dag.`],
    ['Lagens styrka', 'Varje lag får ett anfall och ett försvar – hur många mål det brukar göra och släppa in, med hänsyn till vilka det mött. ' +
      'Lag i olika divisioner jämförs genom dem som flyttats upp och ned och genom cupmötena.'],
    ['Matchen', `Anfall mot försvar ger hur många mål varje lag väntas göra. Hemmalaget gör ${home}\u00a0% fler` +
      (table ? `, och laget med bättre poängsnitt i årets liga får ${dec(table.effect * 100, 1)}\u00a0% fler mål för varje poäng per match i skillnad.` : '.')],
    ['Oddset', 'De väntade målen ger chansen för varje resultat – 0–0, 1–0, 2–1 och så vidare – och tillsammans chansen för 1, X och 2. ' +
      'Sajten visar chansen som odds utan spelbolagens marginal: 58\u00a0% blir 1,72.'],
  ];
  return '<h3>Så räknas en prognos</h3><ol class="ml-steps">' +
    steps.map(([t, p], i) => `<li class="card"><span class="ml-step-n" aria-hidden="true">${i + 1}</span><h4>${esc(t)}</h4><p>${p}</p></li>`).join('') +
    '</ol><div id="model-example"></div>';
}

// Ett räknat exempel: nästa match i Premier League med prognos, steg för
// steg ur matchens fil (prediction.steps, samma som "Vad drog åt vilket håll"
// i matchrutan).
function matchesReady() {
  return state.all ? Promise.resolve() : new Promise((r) => document.addEventListener('matches-loaded', r, { once: true }));
}

async function loadExample() {
  const el = $('#model-example');
  if (!el) return;
  try {
    await matchesReady();
    const now = Date.now();
    const next = ((state.all && state.all.matches) || [])
      .filter((m) => m.comp === 'pl' && !m.completed && m.f && new Date(m.kickoff).getTime() > now)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
    if (!next) return;
    const d = await getJSON(`data/match/${encodeURIComponent(next.id)}.json`);
    const p = d.prediction;
    if (!p || p.status !== 'ok' || !p.steps || !p.steps.length) return;
    el.innerHTML = exampleCard({ ...next, ...(d.match || {}), id: next.id }, p);
  } catch {
    el.innerHTML = '';
  }
}

function exampleCard(m, p) {
  const gen = (n) => (/[sxz]$/i.test(n) ? n : `${n}s`);
  const last = p.steps.length - 1;
  const rows = p.steps.map((s, i) => {
    let label = esc(s.label);
    let sub = s.sub;
    if (s.label === 'Hemmaplan') { label = `${esc(m.home)} spelar hemma`; sub = null; }
    else if (s.label === m.home || s.label === m.away) label = `${esc(gen(s.label))} anfall och försvar`;
    const odds = listOdds(pct3(s.p));
    return `<tr class="${i === last ? 'ml-final' : ''}"><td>${i ? '<span class="ml-plus" aria-hidden="true">+</span>' : ''}${label}` +
      `${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</td>` +
      `<td class="num">${dec(s.goals[0], 2)}–${dec(s.goals[1], 2)}</td>` + odds.map((o) => `<td class="num">${o}</td>`).join('') + '</tr>';
  }).join('');
  const day = dateOnly(m.kickoff);
  return `<div class="card ml-example"><h4>Exempel <span class="hint"><a href="#match/${esc(m.id)}">${esc(m.home)}–${esc(m.away)}</a> · ${day}</span></h4>` +
    '<div class="table-wrap"><table class="odds"><thead><tr><th>Steg</th><th class="num">Väntade mål</th><th class="num">1</th><th class="num">X</th><th class="num">2</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>` +
    `<p class="src-line">Sista raden är prognosen som står i matchrutan. Oddsen ändras när nya matcher spelas och modellen skattas om.</p></div>`;
}

// ---------- avståndet mellan divisionerna ----------

function tiersSection(x) {
  if (!x.tiers || !x.tiers.length) return '';
  const rows = x.tiers.map((t) => {
    const w = t.vsTop ? pct3(t.vsTop) : null;
    const stack = w ? '<div class="tug-stack">' + w.map((v, i) =>
      `<span class="s${i}" style="flex:${v} 1 0" title="${esc([`${t.name} vinner`, 'Oavgjort', 'Premier League-laget vinner'][i])}: ${v} % (${pctOdds(v)})">${v >= 11 ? pctOdds(v) : ''}</span>`).join('') + '</div>'
      : '<span class="unknown">okänt</span>';
    return `<div class="ml-tier"><div class="ml-tier-name">${esc(t.name)}${t.tier <= 5 ? `<span class="sub">nivå ${t.tier}</span>` : ''}</div>${stack}` +
      `<div class="ml-tier-goals num" title="Mål per lag när två snittlag i ${esc(t.name)} möts">${dec(t.goals, 2)}</div></div>`;
  }).join('');
  return '<h3>Avståndet mellan divisionerna <span class="hint">snittlaget mot ett snittlag i Premier League, neutral plan</span></h3>' +
    '<div class="card ml-tiers"><div class="ml-tier ml-tier-head"><div></div><div class="chart-legend">' +
    '<span><i class="key ml-k0"></i>divisionens lag vinner</span><span><i class="key ml-k1"></i>oavgjort</span><span><i class="key ml-k2"></i>Premier League-laget vinner</span></div>' +
    '<div class="ml-tier-goals" title="Mål per lag när två snittlag i divisionen möts">Mål</div></div>' + rows + '</div>';
}

// ---------- hur bra är den? ----------

function qualitySection(bt, version, x) {
  const b = bt && bt.current;
  let html = '<h3>Hur bra är den?</h3>';
  if (!b) {
    const other = bt && bt.versions && bt.versions.length ? ` Senaste efterhandstestet gäller regelversion ${esc(bt.versions[bt.versions.length - 1].rulesVersion)}.` : '';
    return html + `<p class="unknown">okänt – efterhandstestet är inte kört för regelversion ${esc(version)} än (npm run backtest).${other}</p>`;
  }
  const vs = (key) => b.leagues.vs.find((c) => c.key === key);
  const model = vs('nv') && vs('nv').logLoss ? vs('nv').logLoss[0] : null;

  // Domen i ord, först.
  const v = Object.fromEntries(MEASURES.map((m) => [m.bt, verdictOf(vs(m.bt))]));
  const beats = MEASURES.slice(0, 2).filter((m) => v[m.bt] === 'better').map((m) => mlLow(m.name()));
  let market;
  if (v.mk === 'worse' && v.cl === 'worse') market = 'Spelbolagen är bättre, både när oddsen öppnar och vid avspark.';
  else if (v.mk === 'better' && v.cl === 'worse') market = 'Den slår spelbolagens odds när de öppnar, men inte oddsen vid avspark.';
  else if (v.mk === 'better' && v.cl === 'better') market = 'Den slår till och med spelbolagen.';
  else market = 'Mot spelbolagen går det inte att säga vem som är bättre.';
  html += `<p class="ml-lede">Modellen ${beats.length ? `slår ${beats.join(' och ')}` : 'slår inte de enkla måttstockarna'}. ${market}</p>` +
    `<p class="legend">Efterhandstestet: ${n0(b.leagues.known)} ligamatcher ${esc(b.first)}–${esc(b.last)}, där varje prognos bara fick se matcherna före sin egen dag – med samma kod och regler som i dag.</p>`;

  html += mlLadder(b, model);
  html += '<dl class="dv-defs ml-defs">' +
    `<dt>Log-poäng</dt><dd>Hur stor chans prognosen gav det som faktiskt hände – ju lägre, desto bättre. Modellens ${model ? f3(model) : '–'} betyder att det som hände i snitt fick ungefär ${model ? Math.round(Math.exp(-model) * 100) : '–'}\u00a0%.</dd>` +
    `<dt>${esc(BASE.naive)}</dt><dd>Hur ofta det blev 1, X och 2 i divisionen de senaste ${x.naiveSeasons} säsongerna – samma odds i varje match.</dd>` +
    `<dt>${esc(BASE.season)}</dt><dd>Lagens gjorda och insläppta mål i årets matcher, inget från tidigare säsonger. Okänd tills båda lagen spelat ${x.seasonMinMatches} matcher.</dd>` +
    `<dt>${esc(BASE.market)}</dt><dd>Snittet av spelbolagens odds när de öppnar, fredagen eller tisdagen före matchen, utan deras marginal.</dd>` +
    `<dt>${esc(BASE.closing)}</dt><dd>Oddsen precis före avspark, när startelvorna är kända – det svåraste att slå.</dd></dl>`;

  html += '<h4 class="sub-h">Säsong för säsong</h4><div class="card chart-card"><div id="season-chart"></div></div>' +
    '<details class="as-table"><summary>Som tabell</summary><div class="table-wrap"><table><thead><tr><th>Säsong</th><th class="num">Matcher</th><th class="num">Modellen</th>' +
    MEASURES.map(vsTh).join('') + '</tr></thead><tbody>' +
    b.bySeason.map((r) => {
      const c = (key) => r.vs.find((y) => y.key === key);
      const base = c('nv');
      return `<tr><td class="num">${esc(r.label)}${r.partial ? `<span class="sub">t.o.m. ${dateOnly(r.through)}</span>` : ''}</td><td class="num">${n0(r.n)}</td>` +
        `<td class="num">${base && base.n ? f3(base.logLoss[0]) : '–'}</td>` + MEASURES.map((m) => diffTd(c(m.bt))).join('') + '</tr>';
    }).join('') + '</tbody></table></div></details>';

  html += '<h4 class="sub-h">Division för division <span class="hint">modellen mot måttstockarna i log-poäng, under noll = modellen bättre</span></h4>' +
    '<div class="table-wrap"><table><thead><tr><th>Division</th><th class="num">Matcher</th><th class="num">Modellen</th>' +
    MEASURES.map(vsTh).join('') + '</tr></thead><tbody>' +
    b.byDivision.map((r) => {
      const c = (key) => r.vs.find((y) => y.key === key);
      return `<tr><td>${esc(r.name)}</td><td class="num">${n0(r.n)}</td><td class="num">${f3(c('nv').logLoss[0])}</td>` +
        MEASURES.map((m) => diffTd(c(m.bt))).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';

  if (b.cups.length) {
    html += '<h4 class="sub-h">Cuperna <span class="hint">log-poäng, lägre är bättre</span></h4><div class="table-wrap"><table><thead><tr><th>Cup</th><th class="num">Säsonger</th>' +
      `<th class="num">Matcher</th><th class="num">Modellen</th><th class="num">${esc(BASE.naive)}</th><th class="num" title="Chansen att gå vidare, förlängning och straffar inräknade">Gå vidare</th></tr></thead><tbody>` +
      b.cups.map((c) => `<tr><td>${esc(c.name)}</td><td class="num">${esc(c.seasons[0])}${c.seasons[1] !== c.seasons[0] ? `–${esc(c.seasons[1])}` : ''}</td>` +
        `<td class="num">${n0(c.vsNaive.n)}</td><td class="num"><strong>${f3(c.vsNaive.logLoss[0])}</strong></td><td class="num">${f3(c.vsNaive.logLoss[1])}</td>` +
        (c.advance ? `<td class="num"><strong>${f3(c.advance.logLoss)}</strong></td>` : '<td class="num muted">–</td>') +
        '</tr>').join('') + '</tbody></table></div>';
  }
  return html;
}

// Modellen bland måttstockarna: en prick per jämförelse på samma skala,
// den bästa överst. Varje måttstock jämförs på de matcher där båda finns;
// modellens prick är snittet på alla matcher.
function mlLadder(b, model) {
  const rows = [{ name: 'Modellen', value: model, n: b.leagues.known, model: true }];
  for (const m of MEASURES) {
    const c = b.leagues.vs.find((y) => y.key === m.bt);
    if (c && c.n && c.logLoss) rows.push({ name: m.name(), value: c.logLoss[1], n: c.n, own: c.logLoss[0] });
  }
  const vals = rows.map((r) => r.value).filter((v) => v != null);
  if (vals.length < 2) return '';
  rows.sort((a, c) => a.value - c.value);
  const step = 0.01;
  const lo = Math.floor((Math.min(...vals) - 0.004) / step) * step;
  const hi = Math.ceil((Math.max(...vals) + 0.004) / step) * step;
  const pos = (v) => (((v - lo) / (hi - lo)) * 100).toFixed(2);
  const ticks = [];
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(t);
  const grid = ticks.map((t) => `<i class="ml-grid" style="left:${pos(t)}%"></i>`).join('');
  const body = rows.map((r) => `<div class="ml-lrow${r.model ? ' is-model' : ''}"><span class="ml-lname">${esc(r.name)}</span>` +
    `<span class="ml-ltrack">${grid}<i class="ml-ldot" style="left:${pos(r.value)}%" title="${esc(`${r.name}: ${f3(r.value)} på ${n0(r.n)} matcher${r.own != null ? ` (modellen ${f3(r.own)} på samma matcher)` : ''}`)}"></i></span>` +
    `<span class="ml-lval num">${f3(r.value)}</span></div>`).join('');
  const axis = '<div class="ml-lrow ml-laxis"><span class="ml-lname"></span><span class="ml-ltrack">' +
    ticks.map((t, i) => `<b class="${i % 2 ? 'ml-odd' : ''}${ticks.length > 8 && i % 2 ? ' ml-many' : ''}" style="left:${pos(t)}%">${dec(t, 2)}</b>`).join('') + '</span><span class="ml-lval"></span></div>';
  return `<div class="card ml-ladder" role="img" aria-label="${esc(`Log-poäng i efterhandstestet: ${rows.map((r) => `${r.name} ${f3(r.value)}`).join(', ')}`)}">` +
    `<h4>Log-poäng <span class="hint">lägre är bättre · ligamatcherna</span></h4>${body}${axis}</div>`;
}

// Skillnaden mot bara årets mål och spelbolagen per avslutad säsong.
function drawSeasonChart() {
  const el = document.getElementById('season-chart');
  const b = state.backtest;
  if (!el || !b) return;
  const rows = b.bySeason.filter((x) => !x.partial);
  const series = [
    { key: 'ss', cls: 'b', label: `mot ${mlLow(BASE.season)}` },
    { key: 'mk', cls: 'c', label: `mot ${mlLow(BASE.market)}` },
  ];
  const at = (r, s) => r.vs.find((c) => c.key === s.key) || { n: 0 };
  const W = Math.max(260, el.clientWidth);
  const H = 230;
  const L = 46;
  const R = 12;
  const T = 12;
  const B = 26;
  const vals = rows.flatMap((x) => series.flatMap((s) => (at(x, s).n ? [at(x, s).diff] : [])));
  const step = 0.02;
  const lo = Math.floor(Math.min(0, ...vals) / step) * step;
  const hi = Math.ceil(Math.max(0, ...vals) / step) * step;
  const band = (W - L - R) / rows.length;
  const x = (i) => L + band * (i + 0.5);
  const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const off = Math.min(5, band / 5);
  let svg = `<svg class="bt" width="${W}" height="${H}" role="img" aria-label="Skillnad i log-poäng per säsong mot ${esc(mlLow(BASE.season))} och ${esc(mlLow(BASE.market))}">`;
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const zero = Math.abs(v) < 1e-9;
    svg += `<line class="${zero ? 'zero' : 'grid'}" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>` +
      `<text class="tick" x="${L - 6}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${zero ? '0' : sgn(v, 2)}</text>`;
  }
  const every = Math.ceil(rows.length / Math.max(1, Math.floor((W - L - R) / 46)));
  rows.forEach((r, i) => {
    if (i % every === 0) svg += `<text class="tick" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(r.label.slice(2))}</text>`;
  });
  series.forEach((s, k) => {
    rows.forEach((r, i) => {
      const c = at(r, s);
      if (!c.n) return;
      const cx = (x(i) + (k ? off : -off)).toFixed(1);
      svg += `<circle class="pt s-${s.cls}" cx="${cx}" cy="${y(c.diff).toFixed(1)}" r="4"/>`;
    });
  });
  // Träffytor: hela säsongens kolumn, med båda värdena.
  rows.forEach((r, i) => {
    const t = series.map((s) => { const c = at(r, s); return c.n ? `${s.label}: ${sgn(c.diff)} (${c.n} matcher)` : `${s.label}: –`; }).join('\n');
    svg += `<rect class="hit" x="${(x(i) - band / 2).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${H - T - B}"><title>${esc(r.label)}\n${esc(t)}</title></rect>`;
  });
  svg += '</svg>';
  el.innerHTML = '<div class="chart-legend">' + series.map((s) => `<span><i class="key s-${s.cls}"></i>${esc(s.label)}</span>`).join('') +
    '<span class="muted">under noll = modellen bättre</span></div>' + svg;
}

// ---------- prövat och förkastat, och detaljerna ----------

function renderModelMore(d) {
  const x = d.model;
  if (!x) return '';
  const factors = x.factors || [];
  return candidatesSection(d.backtest && d.backtest.candidates, new Map(factors.map((f) => [f.candidate, f.since]))) +
    detailsSection(d, x, factors);
}

function candidatesSection(L, promoted = new Map()) {
  if (!L || !L.entries || !L.entries.length) {
    return '<h3>Prövat och förkastat</h3><p class="unknown">Ingen idé prövad än (npm run kandidater).</p>';
  }
  const crit = L.criteria;
  const latest = new Map();
  const count = new Map();
  for (const e of L.entries) { latest.set(e.id, e); count.set(e.id, (count.get(e.id) || 0) + 1); }
  const run = L.runs[L.runs.length - 1];
  const log = 'https://github.com/tomaslaino/Profeterna/blob/main/data/backtest/candidates.json';
  const groupOf = (e) => (promoted.has(e.id) ? 0 : e.verdict === 'godkänd' ? 1 : e.verdict === 'underkänd' ? 2 : 3);
  const GROUPS = [
    ['Styr prognosen', 'ml-better'],
    ['Klarade kravet men används inte', 'ml-pass'],
    ['Underkända', 'ml-worse'],
    ['Kunde inte prövas', 'muted'],
  ];
  const all = [...latest.values()];
  const inUse = all.filter((e) => groupOf(e) === 0).length;
  // De underkända står bara i loggen.
  const rejected = all.filter((e) => groupOf(e) === 2).length;
  let html = `<h3>Prövat och förkastat <span class="hint">${all.length} idéer · ${inUse === 1 ? 'en' : inUse} styr prognosen</span></h3>` +
    '<p class="legend">En idé får styra prognosen först när den bevisligen gjort den bättre i efterhandstestet – annars syns den bara som underlag i matchrutan. ' +
    `Senast prövade ${dateOnly(run.ranAt)} på säsongerna ${esc(run.seasons[0])}–${esc(run.seasons[1])} · ${rejected ? `de ${rejected} underkända står i ` : ''}<a href="${log}" target="_blank" rel="noopener">hela loggen</a></p>`;

  const row = (e) => {
    const earlier = count.get(e.id) - 1;
    const why = promoted.has(e.id) ? `sedan regelversion\u00a0${promoted.get(e.id).replace(/-/g, '\u2011')}`
      : e.verdict === 'godkänd' ? '' : e.why;
    const diff = e.n ? `<td class="num" title="${esc(`${n0(e.n)} matcher ${e.seasons[0]}–${e.seasons[1]}`)}">${sgn(e.diff, 4)}</td>` : '<td class="num muted">–</td>';
    const out = [esc(why), earlier ? `prövad ${earlier} gång${earlier === 1 ? '' : 'er'} tidigare` : ''].filter(Boolean).join(' · ');
    // I telefonen står utfallet under idén i stället för i en egen kolumn.
    return `<tr><td>${esc(e.label)}<span class="sub">${esc(e.motive)}</span>${e.paramText ? `<span class="sub">Skattat: ${esc(e.paramText)}</span>` : ''}` +
      `<span class="sub ml-why ml-why-sm">${out}</span></td>${diff}<td class="ml-why-col"><span class="sub ml-why">${out}</span></td></tr>`;
  };
  const body = GROUPS.map(([title, cls], g) => {
    const list = all.filter((e) => groupOf(e) === g);
    if (!list.length || g === 2) return '';
    return `<tbody><tr class="ml-group"><th colspan="3" class="${cls}">${esc(title)} <span class="muted">${list.length}</span></th></tr>${list.map(row).join('')}</tbody>`;
  }).join('');
  html += '<div class="table-wrap ml-cands"><table><thead><tr><th>Idé</th>' +
    '<th class="num" title="Idén − grundmodellen i log-poäng på samma matcher. Under noll = idén bättre.">Skillnad</th><th class="ml-why-col">Utfall</th></tr></thead>' +
    `${body}</table></div>`;

  html += method('Så prövas en idé', [
    ['Kravet', `Skrevs ${dateOnly(crit.registered)}, före första körningen, och ändras inte:` +
      `<ul class="bullets">${crit.text.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`],
    ['Skillnad', 'Idén − grundmodellen i log-poäng på samma matcher. Under noll = idén bättre.'],
    ['Beslut', 'En idé som klarat kravet blir en ny regelversion först efter beslut.'],
    ['Loggen', 'Allt som prövats sparas med utfall och datum, även det som inte fungerade, så att samma idé inte prövas igen utan nya belägg.'],
    L.untestable && L.untestable.length && ['Kan inte prövas än', '<ul class="plain">' +
      L.untestable.map((u) => `<li><strong>${esc(u.label)}</strong><span class="sub">${esc(u.reason)}</span></li>`).join('') + '</ul>'],
  ]);
  return html;
}

function detailsSection(d, x, factors) {
  const table = factors.find((f) => f.id === 'table');
  const pctSigned = (v) => `${v >= 1 ? '+' : '−'}${Math.abs(Math.round((v - 1) * 100))} %`;
  let html = '<h4 class="sub-h">Grundmodellen</h4>' + defs([
    ['Modellen', `Dixon–Coles: varje lag har ett anfall och ett försvar, alla en gemensam hemmafördel, och målen är Poissonfördelade med en korrektion för 0–0, 1–0, 0–1 och 1–1 (ρ = ${dec(x.rho, 3)}; under noll = lite fler sådana resultat än om lagens mål vore oberoende).`],
    ['Underlag', `${n0(x.matches)} matcher t.o.m. ${dateOnly(x.fitThrough)} · Premier League–National League sedan ${esc(x.firstSeason)} och årets cupmatcher (football-data.co.uk, ESPN). Alla nivåer skattas i samma modell.`],
    ['Tidsvikt', `Halveringstid ${x.halfLifeDays} dagar.`],
    ['Hemmafördel', `${pctSigned(x.homeAdvantage)} mål för hemmalaget, skattad ur matcherna.`],
    table && ['Tabelläget', `${table.effect >= 0 ? '+' : '−'}${dec(Math.abs(table.effect) * 100, 1)} % mål per poäng per match bättre än motståndaren i årets liga, räknat ur resultaten (utan poängavdrag). ` +
      `Bara ligamatcher där båda lagen spelat minst ${table.minMatches} ligamatcher i år. Vikten skattad i efterhandstestet; infört i regelversion ${esc(table.since)}.`],
    ['Under National League', `Ingen egen lagdata. Lagen skattas som ett gemensamt nivåsnitt ur ${x.lowerMatches} FA-cupmatcher sedan ${esc(x.lowerSince)} och märks i matchrutan.`],
    ['Cuperna', 'Prognosen gäller 90 minuter. Chansen att gå vidare räknas ur samma modell: förlängning med samma målfrekvens, straffar 50/50. ' +
      'FA-cupen: förlängning och straffar. EFL-cupen: straffar direkt, utom i semifinalerna (två möten) och finalen.'],
  ]);
  html += '<h4 class="sub-h">Måttstockarna</h4>' + defs([
    [BASE.naive, `Divisionens fördelning av 1, X och 2 de senaste ${x.naiveSeasons} säsongerna. I cuperna alla ligamatcher på nivå 1–4.`],
    [BASE.season, `Poisson på enbart årets matcher. Okänd tills båda lagen spelat ${x.seasonMinMatches} matcher.`],
    [BASE.market, 'Odds utan marginal (Shins metod). Ligorna: snittet hos football-data.co.uk vid öppning, fredag eller tisdag – i efterhandstestet från 2005/06 (Betbrain t.o.m. 2018/19). Cuperna: DraftKings via ESPN.'],
    [BASE.closing, 'Pinnacle vid avspark i efterhandstestet (från 2012/13, saknas 2026/27), Betfair Exchange vid avspark i skarpt läge.'],
  ]);

  const b = d.backtest && d.backtest.current;
  if (b) {
    html += `<h4 class="sub-h">Efterhandstestet <span class="hint">ligorna ${esc(b.first)}–${esc(b.last)}</span></h4>` +
      '<div class="table-wrap"><table><thead><tr><th>Modellen mot</th><th class="num">Matcher</th><th class="num">Modellen</th><th class="num">Måttstocken</th>' +
      '<th class="num" title="Modellen − måttstocken i log-poäng. Under noll = modellen bättre.">Skillnad</th></tr></thead><tbody>' +
      MEASURES.map((m) => {
        const r = b.leagues.vs.find((c) => c.key === m.bt);
        if (!r || !r.n) return '';
        return `<tr><td>${esc(m.name())}</td><td class="num">${n0(r.n)}</td><td class="num">${f3(r.logLoss[0])}</td><td class="num">${f3(r.logLoss[1])}</td>` +
          `${diffTd(r, { strong: true })}</tr>`;
      }).join('') + '</tbody></table></div>';
    if (d.backtest.versions.length > 1) {
      const vsOf = (v, key) => v.leagues.vs.find((c) => c.key === key);
      html += '<div class="table-wrap"><table><thead><tr><th>Regelversion</th><th class="num">Körd</th><th class="num">Modellen</th>' +
        MEASURES.map(vsTh).join('') + '</tr></thead><tbody>' +
        d.backtest.versions.map((v) => `<tr><td class="num">${esc(v.rulesVersion)}${v.rulesVersion === d.rulesVersion ? ' <span class="muted">i dag</span>' : ''}</td><td class="num">${dateOnly(v.ranAt)}</td>` +
          `<td class="num">${dec(vsOf(v, 'nv').logLoss[0], 4)}</td>` + MEASURES.map((m) => diffTd(vsOf(v, m.bt))).join('') + '</tr>').join('') +
        '</tbody></table></div>';
    }
    html += defs([
      ['Steg för steg', `Varje match ${esc(b.first)}–${esc(b.last)} fick en prognos skattad bara på matcherna före matchdagen, med samma kod och regler som i dag.`],
      ['Skillnad', 'Modellen − måttstocken i log-poäng; under noll = modellen bättre. Varje rad jämför på de matcher där båda finns.'],
      b.factors && ['Tabelläget', 'Vikten skattas säsong för säsong enbart på tidigare säsonger (den första säsongen utan tabelläge), inte med värdet i regelfilen.'],
      ['Täckning', `${n0(b.modelKnown)} av ${n0(b.matches)} matcher fick en modellprognos; de övriga hade för lite underlag för ett lag.`],
      ['Körning', `För hand när regelversionen ändras, inte vid varje uppdatering. Senast ${when(b.ranAt)}, regelversion ${esc(b.rulesVersion)}.`],
      b.notes.length && ['Begränsningar', `<ul class="bullets">${b.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`],
    ]);
  }
  return `<details class="more ml-details"><summary>Detaljer: parametrarna, måttstockarna och efterhandstestet</summary>${html}</details>`;
}

// ---------- i skarpt läge (prognosjournalen) ----------

async function loadEvaluation() {
  const el = $('#evaluation');
  try {
    el.innerHTML = renderEvaluation(await getJSON('data/evaluation.json'));
  } catch (err) {
    el.innerHTML = `<p class="empty">Kunde inte läsa utvärderingen: ${esc(err.message)}</p>`;
  }
}

function renderEvaluation(d) {
  const min = d.minMatches;
  let html = '';
  if (d.error) html += `<p class="err">Utvärderingen misslyckades vid senaste uppdateringen: ${esc(d.error)}</p>`;
  const j = d.journal;
  if (!j) return html + '<p class="unknown">okänt – journalen kunde inte läsas.</p>';
  html += `<p class="legend">Varje prognos sparas i en journal ${j.horizonDays} dagar före avspark och skrivs aldrig om. ` +
    'Den sista före avspark rättas mot ställningen efter 90 minuter – det är så modellen ska bedömas på sikt.</p>';
  if (!j.rows) return html + '<p class="unknown">Journalen är tom än.</p>';

  const c = d.counts;
  const extra = [
    c.noScore ? `${c.noScore} med okänd ställning efter 90 minuter` : null,
    c.modelUnknown ? `${c.modelUnknown} där modellen sa okänt` : null,
    c.lateOnly ? `${c.lateOnly} loggade först efter avspark` : null,
  ].filter(Boolean);
  html += tiles([
    ['Loggade', n0(j.matches), `matcher sedan ${dateOnly(j.firstLoggedAt)}`, `${n0(j.rows)} rader i journalen, loggade ${fDateTime.format(new Date(j.firstLoggedAt))} – ${fDateTime.format(new Date(j.lastLoggedAt))}`],
    ['Spelade', n0(c.evaluated),
      c.evaluated ? (extra.length ? `utanför: ${extra.join(', ')}` : 'rättade mot facit')
        : d.next ? `först ut: ${esc(d.next.home)}–${esc(d.next.away)}, ${when(d.next.kickoff)}` : 'ingen spelad än',
      `Snitt och skillnader visas från ${min} matcher`],
  ]);
  if (c.missed) html += `<p class="err">${c.missed} ${c.missed === 1 ? 'match' : 'matcher'} spelades efter att journalen startade utan att loggas.</p>`;

  // Det viktigaste syns direkt; resten ligger i en enda vikning.
  let more = '';
  if (c.evaluated) {
    html += d.overall.model
      ? '<h4 class="sub-h">Jämförelse <span class="hint">log-poäng, lägre är bättre</span></h4>' + overallTable(d.overall, min)
      : `<p class="legend">Snittet visas när ${min} matcher är spelade – ${n0(d.overall.n)} hittills.</p>`;
    html += '<h4 class="sub-h">Senast rättade</h4>' + recentTable(d.recent);
    if (d.calibration.bins.some((b) => b.freq != null)) html += '<h4 class="sub-h">Stämmer procenten?</h4>' + calibrationBlock(d.calibration);
    more += '<h4 class="sub-h">Per tävling</h4>' + breakdownTable(d.byComp.map((g) => ({ ...g, label: esc(g.name) })), min);
    more += '<h4 class="sub-h">Per regelversion</h4>' + breakdownTable(d.byVersion.map((g) => ({ ...g, label: `<span class="num">${esc(g.version)}</span>` })), min);
    more += '<h4 class="sub-h">Att gå vidare</h4>' + advanceTable(d.advance, min);
    more += '<h4 class="sub-h">Värdespel</h4>' + valueTable(d, d.minBets);
  }
  more += '<h4 class="sub-h">Journalen</h4>' + journalTable(j);
  more += '<h4 class="sub-h">Så räknas det</h4>' + defs([
    ['Journalen', 'Ny rad när prognosen ändrats så mycket att det syns på sidan, eller när spelbolagens odds ändrats.'],
    ['Facit', 'Den sista raden före avspark räknas, mot ställningen efter 90 minuter.'],
    ['Log-poäng', 'Hur väl sannolikheterna träffade. Lägre är bättre.'],
    ['Skillnad', 'Modellen − måttstocken i log-poäng; under noll = modellen bättre. Varje rad jämför på de matcher där båda fanns.'],
    ['Minsta underlag', `Snitt och skillnader visas från ${min} matcher – före dess är underlaget för litet för att säga något.`],
    ['Stämmer procenten?', 'Varje match ger tre prognoser – hemmaseger, oavgjort och bortaseger – som sorteras i korgar om tio procentenheter. ' +
      `Prickarna ska ligga nära diagonalen: av allt modellen gav 40 % ska ungefär 40 % ha hänt.${d.minBin ? ` Korgar med färre än ${d.minBin} prognoser visas inte.` : ''}`],
    ['Att gå vidare', 'Modellens chans att gå vidare mot vem som gick vidare (förlängning och straffar inräknade). Dubbelmöten (EFL-cupens semifinaler) utvärderas inte än.'],
    ['Värdespel', 'Teoretiskt: 1 kr på varje utfall där modellens chans gånger spelbolagens odds i journalraden är större än 1, vinst eller förlust per 100 kr' +
      `${d.minBets ? ` (visas från ${d.minBets} spel)` : ''}. Ligorna mot spelbolagens snitt, cuperna mot DraftKings. Inte ett mått på hur bra prognoserna är.`],
  ]);
  html += `<details class="more"><summary>Fler tabeller och förklaringar</summary>${more}</details>`;
  return html;
}

function overallTable(g, min) {
  const head = `<p class="legend">Modellen: log-poäng <strong>${f3(g.model.logLoss)}</strong> · ${g.n} matcher</p>`;
  const order = MEASURES.map((m) => g.vs.find((v) => v.key === m.ev)).filter(Boolean);
  const rows = order.map((v) => {
    const name = esc(mlMeasure(v.key).name());
    if (!v.logLoss) return `<tr><td>${name}</td><td class="num">${v.n}</td><td colspan="2" class="muted">för få matcher (minst ${min})</td></tr>`;
    return `<tr><td>${name}</td><td class="num">${v.n}</td><td class="num">${f3(v.logLoss[0])} / ${f3(v.logLoss[1])}</td>` +
      `${diffTd(v, { strong: true })}</tr>`;
  }).join('');
  return head + '<div class="table-wrap"><table><thead><tr><th>Modellen mot</th><th class="num">Matcher</th>' +
    '<th class="num">Log-poäng</th><th class="num" title="Modellen − måttstocken. Under noll = modellen bättre.">Skillnad</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>`;
}

// Per tävling eller regelversion: modellens snitt och skillnaden mot
// måttstockarna i log-poäng.
function breakdownTable(groups, min) {
  const keys = ['naive', 'season', 'market'];
  const cell = (g, key) => {
    const v = g.vs.find((x) => x.key === key);
    if (!v || !v.n) return '<td class="num muted">–</td>';
    if (v.diff == null) return `<td class="num muted">för få<span class="sub">${v.n} av ${min}</span></td>`;
    return diffTd(v);
  };
  const rows = groups.map((g) => `<tr><td>${g.label}</td><td class="num">${g.n}</td>` +
    (g.model ? `<td class="num">${f3(g.model.logLoss)}</td>`
      : g.n ? `<td class="num muted">för få<span class="sub">${g.n} av ${min}</span></td>` : '<td class="num muted">–</td>') +
    keys.map((k) => cell(g, k)).join('') + '</tr>').join('');
  return '<div class="table-wrap"><table><thead><tr><th></th><th class="num">Matcher</th><th class="num">Log-poäng</th>' +
    keys.map((k) => vsTh(mlMeasure(k))).join('') + '</tr></thead>' +
    `<tbody>${rows}</tbody></table></div>`;
}

// Stämmer procenten: modellens chans mot hur ofta det blev så, per korg om
// tio procentenheter. Bara korgar med tillräckligt många prognoser står med.
function calibrationBlock(cal) {
  const bins = cal.bins.filter((b) => b.freq != null);
  const W = 310;
  const H = 280;
  const L = 50;
  const B = 34;
  const T = 10;
  const R = 20;
  const x = (p) => (L + p * (W - L - R)).toFixed(1);
  const y = (p) => (H - B - p * (H - B - T)).toFixed(1);
  let svg = `<svg class="cal" viewBox="0 0 ${W} ${H}" role="img" aria-label="Modellens chans mot hur ofta det blev så">`;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    svg += `<line class="grid" x1="${x(0)}" x2="${x(1)}" y1="${y(t)}" y2="${y(t)}"/><line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${y(0)}" y2="${y(1)}"/>`;
    if (t * 100 % 50 === 0) {
      svg += `<text class="tick" x="${x(t)}" y="${H - B + 14}" text-anchor="middle">${t * 100} %</text>` +
        `<text class="tick" x="${L - 6}" y="${Number(y(t)) + 4}" text-anchor="end">${t * 100} %</text>`;
    }
  }
  svg += `<line class="diag" x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}"/>`;
  for (const b of bins) {
    svg += `<circle class="pt" cx="${x(b.meanP)}" cy="${y(b.freq)}" r="4"><title>${pct(b.lo)}–${pct(b.hi)} %: modellen sa ${pct(b.meanP)} %, det blev ${pct(b.freq)} % (${b.n} prognoser)</title></circle>`;
  }
  svg += `<text class="axis" x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">Modellen sa</text>` +
    `<text class="axis" x="12" y="${(T + H - B) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(T + H - B) / 2})">Det blev</text></svg>`;

  const rows = bins.map((b) => `<tr><td class="num">${pct(b.lo)}–${pct(b.hi)} %</td><td class="num">${b.n}</td>` +
    `<td class="num">${pct(b.meanP)} %</td><td class="num">${pct(b.freq)} %</td></tr>`).join('');
  return `<div class="grid2"><div class="card">${svg}</div><div class="table-wrap" style="margin:0"><table class="odds"><thead><tr><th class="num">Modellen sa</th><th class="num">Prognoser</th>` +
    `<th class="num">Snitt</th><th class="num">Det blev</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function advanceTable(a, min) {
  const groups = [{ name: 'Båda cuperna', ...a.all }, ...a.byComp];
  if (!a.all.n) return '<p class="legend">Inga avgjorda cupmatcher i journalen än.</p>';
  const rows = groups.map((g) => `<tr><td>${esc(g.name)}</td><td class="num">${g.n}</td>` +
    (g.logLoss != null
      ? `<td class="num">${f3(g.logLoss)}</td>`
      : `<td class="num muted">${g.n ? `för få matcher (minst ${min})` : '–'}</td>`) + '</tr>').join('');
  return '<div class="table-wrap"><table><thead><tr><th></th><th class="num">Matcher</th><th class="num">Log-poäng</th>' +
    `</tr></thead><tbody>${rows}</tbody></table></div>`;
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
    '<th class="num" title="Vinst eller förlust per 100 kr, 1 kr på varje utfall där chans × odds > 1">Per 100 kr</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>`;
}

function recentTable(all) {
  const list = all.filter((r) => !isHidden(r));
  const n = all.length - list.length;
  const note = n ? `<p class="legend">${Spoiler.chip(`${n} ${n === 1 ? 'match' : 'matcher'}`)} visas inte – du har valt att dölja resultat.</p>` : '';
  if (!list.length) return note;
  const rows = list.map((r) => {
    const w = listOdds(pct3(r.p)).map((v, k) => (k === r.o ? `<b>${v}</b>` : v)).join(' · ');
    return `<tr><td><a href="#match/${esc(r.id)}">${esc(r.home)}–${esc(r.away)}</a><span class="sub">${esc(compOf(r.comp).short)} · ${dateOnly(r.kickoff)}</span></td>` +
      `<td class="num">${w}</td><td class="num">${r.score90.home}–${r.score90.away}</td>` +
      `<td class="num">${dec(r.logLoss, 2)} / ${r.market != null ? dec(r.market, 2) : '–'}</td></tr>`;
  }).join('');
  return '<div class="table-wrap"><table><thead><tr><th>Match</th><th class="num" title="1 · X · 2 som odds, utfallet i fetstil">Före avspark</th><th class="num">Efter 90</th>' +
    `<th class="num">Log-poäng modellen / ${esc(mlLow(BASE.market))}</th></tr></thead><tbody>${rows}</tbody></table></div>` + note;
}

function journalTable(j) {
  const rows = j.latest.map((r) => `<tr><td class="num">${when(r.loggedAt)}</td>` +
    `<td><a href="#match/${esc(r.id)}">${esc(r.home)}–${esc(r.away)}</a><span class="sub">${esc(compOf(r.comp).short)} · avspark ${when(r.kickoff)}</span></td>` +
    `<td class="num">${r.p ? listOdds(pct3(r.p)).join(' · ') : '<span class="unknown">okänt</span>'}</td>` +
    `<td class="num">${r.market ? `${listOdds(pct3(r.market.p)).join(' · ')}<span class="sub">${esc(r.market.source)}</span>` : '–'}</td>` +
    `<td class="num">${esc(r.rulesVersion)}</td></tr>`).join('');
  const files = j.files.map((f) => `<a href="data/journal/${encodeURIComponent(f.name)}">${esc(f.name)}</a> (${n0(f.rows)} rader, ${n0(Math.round(f.bytes / 1024))} kB)`).join(', ');
  return '<div class="table-wrap"><table><thead><tr><th>Loggad</th><th>Match</th><th class="num">Prognos</th><th class="num">' + esc(BASE.market) + '</th><th class="num">Regelversion</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>` +
    `<p class="legend">Hela journalen: ${files}${j.invalid ? ` · ${j.invalid} oläsbara rader hoppas över` : ''}</p>`;
}
