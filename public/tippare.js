'use strict';

// ---------- omgångens tippare ----------
//
// Förstasidan: vem i gänget som tippade bäst och sämst i omgången. Tipsen är
// var och ens egna inför samtalet (worker/samtal.mjs, GET …/samtal) och syns
// här först när de visas för alla. Poängen räknas i webbläsaren med samma
// rättning som kupongen (gradeRow i kupong.js: ställningen efter 90 minuter,
// liveställningen och spoilerskyddet).
//
// Poäng per match = 1 om tipset satt (annars 0) minus modellens chans för
// tipset före avspark – för en gardering chanserna ihop. Rätt på en
// storfavorit på 70 % ger +0,30 och en missad −0,70; en skräll på 20 % ger
// +0,80 om den sitter och kostar bara −0,20 om den inte gör det. Mätt med
// modellens egna sannolikheter är det väntade 0 vad man än tippar, så summan
// visar hur mycket bättre (plus) eller sämre (minus) än modellen man tippade –
// det lönar sig varken att alltid ta favoriten eller att jaga skrällar.
// Modellens eget tips (det troligaste utfallet) räknas likadant och står med
// som jämförelse. Saknas modellen för en match används kuponghistorikens
// schablon (src/history.js): 45 % för ett tecken, 75 % för två.
//
// Läses efter kupong.js och använder dess hjälpare (KP, SIGNS, gradeRow,
// matchById, teamsOf, scoreText, dateRange, loadCoupons, whenMatches, kpNum).

const TP = {
  round: null, // omgången som GET …/samtal visar den, eller null
  at: 0, // när den hämtades
  busy: null,
  open: false, // Poäng per match utfälld
  html: null,
};
const TP_EVERY_MS = 5 * 60000;
const TP_BASE = { 1: 0.45, 2: 0.75, 3: 1 };

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

// ---------- poängen ----------

const tpSign = (s) => { const t = String(s || '').toUpperCase(); return SIGNS.filter((x) => t.includes(x)).join(''); };

// Modellens tips: det troligaste utfallet före avspark.
function tpModelSigns(round) {
  const out = {};
  for (const x of round.matcher) {
    const m = matchById(x.id);
    const pr = m && (m.j && m.j.p ? m.j.p : m.f ? m.f.p : null);
    if (pr) out[x.id] = SIGNS[pr.indexOf(Math.max(...pr))];
  }
  return out;
}

// Tecknen per match → rättade rader med poäng (null = inget tips i matchen).
function tpRows(round, signs, now) {
  return round.matcher.map((x) => {
    const sign = tpSign(signs && signs[x.id]);
    if (!sign) return null;
    const r = gradeRow({ id: x.id, sign, label: x.match }, now);
    const prob = r.p != null ? r.p / 100 : TP_BASE[sign.length];
    const done = r.state === 'final' && r.hit != null;
    return { ...r, prob, pts: done ? (r.hit ? 1 : 0) - prob : null };
  });
}

function tpTally(rows) {
  const done = rows.filter((r) => r && r.pts != null);
  return { n: done.length, ok: done.filter((r) => r.hit).length, pts: done.reduce((a, r) => a + r.pts, 0) };
}

// Placeringen följer det som syns: poängen med en decimal, sedan antal rätt.
const tpKey = (t) => Math.round(t.pts * 10) * 1000 + t.ok;

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

  const ranked = s.people.filter((p) => !p.none).sort((a, b) => tpKey(b) - tpKey(a));
  s.ranked = ranked;
  // Bäst och sämst bara när det finns någon skillnad (delat vid lika).
  if (ranked.length >= 2 && s.played) {
    const top = tpKey(ranked[0]);
    const low = tpKey(ranked[ranked.length - 1]);
    if (top !== low) {
      for (const p of ranked) {
        if (tpKey(p) === top) p.award = 'best';
        else if (tpKey(p) === low) p.award = 'worst';
      }
    }
  }
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
  if (p.award === 'best') return `<span class="tp-badge best">${done ? 'Omgångens tippare' : 'Leder'}</span>`;
  if (p.award === 'worst') return `<span class="tp-badge worst">${done ? 'Omgångens sämsta' : 'Sist'}</span>`;
  return '';
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
      return `<td><span class="tp-sign${hit}" title="Modellens chans ${Math.round(r.prob * 100)} %">${esc(r.sign)}</span>${pts}</td>`;
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
  // Modellen placeras där dess poäng hamnar, utan placeringssiffra.
  const list = [];
  let rank = 0;
  let placed = false;
  for (const p of s.ranked) {
    if (!placed && tpKey(s.model) > tpKey(p)) { list.push(tpRow(s.model, 0, s)); placed = true; }
    list.push(tpRow(p, ++rank, s));
  }
  if (!placed) list.push(tpRow(s.model, 0, s));
  const none = s.people.filter((p) => p.none);
  return '<div class="card tp-card">' +
    `<p class="kp-eyebrow">Omgångens tippare${kicks.length ? ` · ${esc(dateRange(Math.min(...kicks), Math.max(...kicks)))}` : ''}</p>` +
    `<ol class="tp-list">${list.join('')}</ol>` +
    (none.length ? `<p class="legend tp-missing">Tippade inte: ${none.map((p) => esc(p.name)).join(', ')}</p>` : '') +
    `<p class="kp-line tp-status">${tpStatus(s)}</p>` +
    tpTable(s) + '</div>';
}

function tpRender() {
  const el = $('#tippare');
  if (!el) return;
  const html = tpCard();
  if (html === TP.html) return;
  TP.html = html;
  el.innerHTML = html;
}

// ---------- start ----------

(async function initTippare() {
  const el = $('#tippare');
  if (!el) return;
  await Promise.all([whenMatches(), loadCoupons()]);
  await tpLoad(true);
  tpRender();
  // Utfälld eller inte överlever omritningarna (toggle bubblar inte).
  el.addEventListener('toggle', (e) => { if (e.target.matches('.tp-more')) TP.open = e.target.open; }, true);
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
