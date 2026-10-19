'use strict';

// ---------- omgångens och säsongens tippare ----------
//
// Förstasidan: vem i gänget som tippade bäst och sämst i omgången, och under
// den säsongen hittills. Tipsen är var och ens egna inför samtalet
// (worker/samtal.mjs, GET …/samtal) och syns här först när de visas för alla.
// Omgångens poäng räknas i webbläsaren med samma rättning som kupongen
// (gradeRow i kupong.js: ställningen efter 90 minuter, liveställningen och
// spoilerskyddet).
//
// Poängen (tippoang.js, samma som bygget): 1 om tipset satt (annars 0) minus
// modellens chans för tipset före avspark – för en gardering chanserna ihop.
// Mätt med modellens egna sannolikheter är det väntade 0 vad man än tippar, så
// summan visar hur mycket bättre (plus) eller sämre (minus) än modellen man
// tippade. Modellens eget tips (det troligaste utfallet) räknas likadant och
// står med som jämförelse.
//
// Säsongen är de avslutade omgångarna som bygget har frusit in
// (src/tippare.js → data/tippare.json), med poängen per person redan räknad.
// Här läggs de ihop – utan omgångar som spoilerskyddet döljer.
//
// Läses efter kupong.js och tippoang.js och använder deras hjälpare (KP,
// gradeRow, matchById, teamsOf, scoreText, dateRange, loadCoupons,
// whenMatches, kpNum, Tippoang).

const TP = {
  round: null, // omgången som GET …/samtal visar den, eller null
  at: 0, // när den hämtades
  busy: null,
  open: false, // Poäng per match utfälld
  season: null, // data/tippare.json
  seasonOpen: false, // Poäng per omgång utfälld
  html: null,
};
const TP_EVERY_MS = 5 * 60000;

// ---------- data ----------

async function tpLoad(force = false) {
  const info = KP.data && KP.data.samtal;
  if (!info || !info.endpoint) return;
  if (TP.busy) return TP.busy;
  if (!force && TP.at && Date.now() - TP.at < TP_EVERY_MS) return;
  TP.busy = fetch(info.endpoint, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((d) => { if (d && d.ok) TP.round = d.samtal || null; })
    // En död tjänst ger bara ingen ruta – sidan fortsätter som vanligt.
    .catch(() => {})
    .finally(() => { TP.at = Date.now(); TP.busy = null; });
  return TP.busy;
}

async function tpLoadSeason() {
  TP.season = await getJSON('data/tippare.json').catch(() => null);
}

// ---------- poängen ----------

// Modellens tips: det troligaste utfallet före avspark.
function tpModelSigns(round) {
  const out = {};
  for (const x of round.matcher) {
    const m = matchById(x.id);
    const pr = m && (m.j && m.j.p ? m.j.p : m.f ? m.f.p : null);
    if (pr) out[x.id] = Tippoang.modelSign(pr);
  }
  return out;
}

// Tecknen per match → rättade rader med poäng (null = inget tips i matchen).
function tpRows(round, signs, now) {
  return round.matcher.map((x) => {
    const sign = Tippoang.sign(signs && signs[x.id]);
    if (!sign) return null;
    const r = gradeRow({ id: x.id, sign, label: x.match }, now);
    const prob = Tippoang.chance(sign, r.p);
    const done = r.state === 'final' && r.hit != null;
    return { ...r, prob, pts: done ? Tippoang.points(r.hit, prob) : null };
  });
}

const tpTally = Tippoang.tally;
const tpKey = Tippoang.key;

function tpScore(round, now) {
  // Omgångens läge, oberoende av tecknen.
  const status = round.matcher.map((x) => gradeRow({ id: x.id, sign: '1X2', label: x.match }, now));
  const counted = status.filter((r) => r.state !== 'off' && r.state !== 'missing');
  const s = {
    status,
    n: counted.length,
    played: counted.filter((r) => r.state === 'final' && r.res != null).length,
    live: counted.filter((r) => r.state === 'live').length,
    hidden: counted.filter((r) => r.state === 'hidden').length,
  };
  s.done = s.n > 0 && s.played === s.n;
  const tips = round.tips || {};
  s.people = (round.gang || []).map((g) => {
    const signs = tips[g.id] && tips[g.id].tecken;
    if (!signs) return { id: g.id, name: g.namn || g.id, none: true };
    const rows = tpRows(round, signs, now);
    return { id: g.id, name: g.namn || g.id, rows, ...tpTally(rows) };
  });
  const rows = tpRows(round, tpModelSigns(round), now);
  s.model = { id: 'modellen', name: 'Modellen', model: true, rows, ...tpTally(rows) };
  // Bäst och sämst bara när det finns någon skillnad (delat vid lika).
  s.ranked = Tippoang.rank(s.people.filter((p) => !p.none), s.played > 0);
  return s;
}

// ---------- rutan ----------

const tpPts = (x) => {
  const v = Math.round(x * 10) / 10;
  return v > 0 ? `+${kpNum(v)}` : v < 0 ? `−${kpNum(-v)}` : kpNum(0);
};
const tpTone = (x) => (Math.round(x * 10) > 0 ? 'pos' : Math.round(x * 10) < 0 ? 'neg' : '');
const tpInitials = (p) => (p.model ? 'Mod.' : p.id);

function tpBadge(p, done) {
  if (p.award === 'best') return `<span class="tp-badge best">${done ? 'Omgångens orakel' : 'Leder'}</span>`;
  if (p.award === 'worst') return `<span class="tp-badge worst">${done ? 'Omgångens Ikaros' : 'Sist'}</span>`;
  return '';
}

// Modellen placeras där dess poäng hamnar, utan placeringssiffra.
function tpPlaced(ranked, model) {
  const list = [];
  let placed = false;
  for (const p of ranked) {
    if (!placed && tpKey(model) > tpKey(p)) { list.push(model); placed = true; }
    list.push(p);
  }
  if (!placed) list.push(model);
  return list;
}

function tpRow(p, rank, s) {
  const cls = ['tp-row', p.model ? 'tp-model' : '', p.award ? `is-${p.award}` : ''].filter(Boolean).join(' ');
  return `<li class="${cls}">` +
    `<span class="tp-rank">${p.model ? '' : rank}</span>` +
    `<span class="tp-name"><b>${esc(p.name)}</b>${p.model ? '<span class="sub">troligaste utfallet</span>' : tpBadge(p, s.done)}</span>` +
    `<span class="tp-ok" title="Rätt av de spelade matcherna">${p.ok}<span>/${p.n}</span></span>` +
    `<span class="tp-pts ${tpTone(p.pts)}" title="Rätt minus modellens chans för tipsen">${tpPts(p.pts)}</span></li>`;
}

function tpStatus(s) {
  if (s.done) return `Klar · ${s.n} ${s.n === 1 ? 'match' : 'matcher'}`;
  return [
    'Preliminärt',
    `${s.played} av ${s.n} spelade`,
    s.live ? `<span class="kp-livetxt">${s.live} pågår</span>` : null,
    s.hidden ? Spoiler.chip(`${s.hidden} ${s.hidden === 1 ? 'dold' : 'dolda'}`) : null,
  ].filter(Boolean).join(' · ');
}

// Poäng per match: en rad per match, en kolumn per tippare och modellen.
function tpTable(s) {
  const cols = [...s.ranked, s.model];
  const head = cols.map((p) => `<th title="${esc(p.model ? 'Modellens troligaste utfall' : p.name)}">${esc(tpInitials(p))}</th>`).join('');
  const body = s.status.map((st, i) => {
    if (st.state === 'off' || st.state === 'missing') return '';
    const res = st.state === 'final' && st.score ? `<span class="sub">${esc(scoreText(st))}</span>`
      : st.state === 'live' ? '<span class="sub kp-livetxt">pågår</span>'
        : st.state === 'hidden' ? Spoiler.chip() : '';
    const cells = cols.map((p) => {
      const r = p.rows[i];
      if (!r) return '<td class="tp-none">–</td>';
      const pts = r.pts != null ? `<span class="${tpTone(r.pts)}">${tpPts(r.pts)}</span>` : '';
      const hit = r.pts == null ? '' : r.hit ? ' ok' : ' no';
      return `<td><span class="tp-sign${hit}" title="Modellens odds ${oddsP(r.prob)}">${esc(r.sign)}</span>${pts}</td>`;
    }).join('');
    return `<tr><th scope="row"><span class="tp-m">${esc(teamsOf(st))}</span>${res}</th>${cells}</tr>`;
  }).join('');
  const foot = cols.map((p) => `<td class="${tpTone(p.pts)}">${tpPts(p.pts)}</td>`).join('');
  return `<details class="tp-more"${TP.open ? ' open' : ''}><summary>Poäng per match</summary>` +
    '<p class="legend">Poäng = 1 för rätt minus modellens chans för tipset före avspark. ' +
    'En rätt storfavorit ger lite och en missad kostar mycket – tvärtom för en skräll.</p>' +
    `<div class="table-wrap"><table class="tp-table"><thead><tr><th scope="col">Match</th>${head}</tr></thead>` +
    `<tbody>${body}</tbody><tfoot><tr><th scope="row">Summa</th>${foot}</tr></tfoot></table></div></details>`;
}

function tpCard(now = Date.now()) {
  const round = TP.round;
  if (!round || !round.visas || !round.tips || !Array.isArray(round.matcher) || !round.matcher.length || !state.all) return '';
  const s = tpScore(round, now);
  // Inget att visa förrän första matchen är spelad.
  if (!s.played || !s.ranked.length) return '';
  const kicks = s.status.map((r) => r.kick).filter(Boolean);
  let rank = 0;
  const list = tpPlaced(s.ranked, s.model).map((p) => tpRow(p, p.model ? 0 : ++rank, s));
  const none = s.people.filter((p) => p.none);
  return '<div class="card tp-card">' +
    `<p class="kp-eyebrow">Omgången${kicks.length ? ` ${esc(dateRange(Math.min(...kicks), Math.max(...kicks)))}` : ''}</p>` +
    // Orakel och Ikaros som bild (kronan.js).
    (window.Kronan ? Kronan.html(s, tpPts) : '') +
    `<ol class="tp-list">${list.join('')}</ol>` +
    (none.length ? `<p class="legend tp-missing">Tippade inte: ${none.map((p) => esc(p.name)).join(', ')}</p>` : '') +
    `<p class="kp-line tp-status">${tpStatus(s)}</p>` +
    tpTable(s) + '</div>';
}

// ---------- säsongens tippare ----------

// En omgång döljs om någon av dess matcher döljs av spoilerskyddet.
function tpRoundHidden(r) {
  if (!window.Spoiler || !Spoiler.on()) return false;
  return (r.matches || []).some((m) => Spoiler.hidden({ id: m.id, kickoff: m.kickoff, status: m.off ? 'POSTPONED' : '' }));
}

// Förnamnet döljs på smala skärmar – alla i gänget heter Daniel.
function tpNameHtml(name) {
  const i = name.indexOf(' ');
  return i > 0 ? `<span class="tp-given">${esc(name.slice(0, i))} </span>${esc(name.slice(i + 1))}` : esc(name);
}

// Antal gånger som Omgångens orakel och Ikaros står som märken under namnet.
function tpAwards(p) {
  const one = (x, cls, what) => (x ? `<span class="tp-badge ${cls}" title="Omgångens ${what} ${x} ${x === 1 ? 'gång' : 'gånger'}">${x} × ${what}</span>` : '');
  return one(p.best, 'best', 'orakel') + one(p.worst, 'worst', 'Ikaros');
}

function tpSeasonRow(p, rank) {
  const cls = ['tp-srow', p.model ? 'tp-model' : '', rank === 1 ? 'is-lead' : ''].filter(Boolean).join(' ');
  return `<tr class="${cls}">` +
    `<td class="tp-rank">${p.model ? '' : rank}</td>` +
    `<th scope="row" class="tp-who"><span class="tp-name"><b title="${esc(p.name)}">${p.model ? 'Modellen' : tpNameHtml(p.name)}</b>` +
    `${p.model ? '<span class="sub">troligaste utfallet</span>' : tpAwards(p)}</span></th>` +
    `<td class="tp-c">${p.rounds}</td>` +
    `<td class="tp-ok">${p.ok}<span>/${p.n}</span></td>` +
    `<td class="tp-pts ${tpTone(p.pts)}">${tpPts(p.pts)}</td></tr>`;
}

// Poäng per omgång: en rad per omgång (nyast först), en kolumn per tippare
// och modellen. Omgångens orakel och Ikaros är inramade.
function tpRoundsTable(rounds, s) {
  const cols = [...s.people, s.model];
  const head = cols.map((p) => `<th scope="col" title="${esc(p.model ? 'Modellens troligaste utfall' : p.name)}">${esc(tpInitials(p))}</th>`).join('');
  const body = rounds.map((r) => {
    const cells = cols.map((c) => {
      const p = c.model ? r.model : (r.people || []).find((x) => x.id === c.id);
      if (!p || p.none || !p.n) return '<td class="tp-none">–</td>';
      const aw = p.award ? ` tp-aw ${p.award}` : '';
      const title = p.award === 'best' ? 'Omgångens orakel' : p.award === 'worst' ? 'Omgångens Ikaros' : '';
      return `<td><span class="${(tpTone(p.pts) + aw).trim()}"${title ? ` title="${title}"` : ''}>${tpPts(p.pts)}</span></td>`;
    }).join('');
    return `<tr><th scope="row">${esc(dateRange(r.from, r.to))}<span class="sub">${r.n} ${r.n === 1 ? 'match' : 'matcher'}</span></th>${cells}</tr>`;
  }).join('');
  const foot = cols.map((p) => `<td class="${tpTone(p.pts)}">${tpPts(p.pts)}</td>`).join('');
  return `<details class="tp-more tp-rounds"${TP.seasonOpen ? ' open' : ''}><summary>Poäng per omgång</summary>` +
    '<p class="legend">Omgångens poäng är summan av 1 för rätt minus modellens chans för tipset före avspark. ' +
    'Märkena under namnen räknar gånger som Omgångens orakel (bäst) och Omgångens Ikaros (sämst) – inramade i guld och rött nedan.</p>' +
    `<div class="table-wrap"><table class="tp-table"><thead><tr><th scope="col">Omgång</th>${head}</tr></thead>` +
    `<tbody>${body}</tbody><tfoot><tr><th scope="row">Summa</th>${foot}</tr></tfoot></table></div></details>`;
}

function tpSeasonCard() {
  const all = (TP.season && TP.season.rounds) || [];
  if (!all.length) return '';
  const hidden = all.filter(tpRoundHidden);
  const rounds = all.filter((r) => !hidden.includes(r));
  const s = Tippoang.season(rounds);
  const hid = hidden.length
    ? `<p class="kp-line tp-status">${Spoiler.chip(`${hidden.length} ${hidden.length === 1 ? 'omgång dold' : 'omgångar dolda'}`)}` +
      `<button type="button" class="tp-show" data-sp-show="${esc(hidden.flatMap((r) => r.matches.map((m) => m.id)).join(' '))}">Visa ändå</button></p>`
    : '';
  const head = `<p class="kp-eyebrow">Säsongens tippare${rounds.length ? ` · ${rounds.length} ${rounds.length === 1 ? 'omgång' : 'omgångar'}` : ''}</p>`;
  if (!s.people.length) return `<div class="card tp-card tp-season">${head}${hid}</div>`;
  let rank = 0;
  const rows = tpPlaced(s.people, s.model).map((p) => tpSeasonRow(p, p.model ? 0 : ++rank)).join('');
  return '<div class="card tp-card tp-season">' + head +
    '<div class="tp-swrap"><table class="tp-stable"><thead><tr><th scope="col"><span class="tp-vh">Placering</span></th><th scope="col">Tippare</th>' +
    '<th scope="col" class="tp-c" title="Omgångar">Omg.</th><th scope="col" class="tp-c" title="Rätt av de spelade matcherna">Rätt</th>' +
    '<th scope="col" class="tp-c" title="Summan av omgångarnas poäng">Poäng</th></tr></thead>' +
    `<tbody>${rows}</tbody></table></div>` + hid + tpRoundsTable(rounds, s) +
    // Fliken Olympen (kampen.js): inbördes, kurvan och spelkassan.
    '<p class="kp-line"><a class="km-link" href="#olympen">Till Olympen →</a></p></div>';
}

function tpRender() {
  const el = $('#tippare');
  if (!el) return;
  // Utan pågående omgång står den senaste kröningen kvar (kronan.js).
  const seen = ((TP.season && TP.season.rounds) || []).filter((r) => !tpRoundHidden(r));
  const html = (tpCard() || (window.Kronan ? Kronan.reigning(seen, tpPts) : '')) + tpSeasonCard();
  if (html === TP.html) return;
  TP.html = html;
  el.innerHTML = html;
}

// ---------- start ----------

(async function initTippare() {
  const el = $('#tippare');
  if (!el) return;
  await Promise.all([whenMatches(), loadCoupons(), tpLoadSeason()]);
  await tpLoad(true);
  tpRender();
  // Utfälld eller inte överlever omritningarna (toggle bubblar inte).
  el.addEventListener('toggle', (e) => {
    if (e.target.matches('.tp-rounds')) TP.seasonOpen = e.target.open;
    else if (e.target.matches('.tp-more')) TP.open = e.target.open;
  }, true);
  if (window.Spoiler) Spoiler.onChange(tpRender);
  // Kupongens ruta ritas om vid liveställningen och spoilerskyddet – då
  // ritas den här om med samma läge. Tipsen hämtas om högst var femte minut.
  const home = $('#home');
  if (home) {
    new MutationObserver(() => {
      tpRender();
      if (Date.now() - TP.at >= TP_EVERY_MS) tpLoad().then(tpRender);
    }).observe(home, { childList: true });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tpLoad().then(tpRender); });
})();
