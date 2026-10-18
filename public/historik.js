'use strict';

// Sidan Historik: gängets färdigspelade kuponger, sorterbara efter hur det
// gick, med betyget mot modellen och AI:ns kommentar. Data:
// data/historik.json (src/history.js) – kupongerna i data/kupong-historik.json
// plus sidans färdiga kuponger som inte frysts in där än. Kommentaren som
// saknas i filen hämtas från proxyn (worker/kommentar.mjs), en i taget.
// Fristående från app.js, som divisioner.js.

const $ = (s) => document.querySelector(s);
const SIGNS = ['1', 'X', '2'];
const SORTS = [
  { id: 'senaste', label: 'Senaste', title: 'Senaste kupongen först' },
  { id: 'betyg', label: 'Betyg', title: 'Bästa betyget först' },
  { id: 'andel', label: 'Andel rätt', title: 'Högst andel rätt först' },
  { id: 'modellen', label: 'Mot modellen', title: 'Flest rätt jämfört med modellens tips först' },
];
const SORT_KEY = 'profeterna.historik.sortering';
const H = {
  data: null,
  sort: 'senaste',
  dir: 1, // 1 = bäst/senast först, -1 = omvänt
  ai: new Map(), // id → { text } | { error } | 'loading'
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(res.status === 404 ? 'finns inte' : `HTTP ${res.status}`);
  return res.json();
}

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function store(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* inget */ }
}

const num = (x, d = 1) => x.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (x, d = 1) => (Math.abs(x) < 0.05 ? '±0' : `${x > 0 ? '+' : '−'}${num(Math.abs(x), d)}`);
const rate = (c) => (c.n ? c.ok / c.n : 0);
const vsModel = (c) => (c.modelN ? c.ok - c.modelOk : null);

// ---------- datum ----------

const MON = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const parts = (s) => s.split('-').map(Number);

function dateRange(a, b) {
  const [y1, m1, d1] = parts(a);
  const [y2, m2, d2] = parts(b || a);
  const year = y2 !== new Date().getFullYear() ? ` ${y2}` : '';
  if (a === (b || a)) return `${d1} ${MON[m1 - 1]}${year}`;
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MON[m2 - 1]}${year}`;
  return `${d1} ${MON[m1 - 1]} – ${d2} ${MON[m2 - 1]}${year}`;
}

// ---------- bitar ----------

function stars(c, cls = '') {
  if (c.grade == null) return '<span class="hk-stars none">–</span>';
  let html = `<span class="hk-stars g${c.grade} ${cls}" role="img" aria-label="${c.grade} av 5 stjärnor">`;
  for (let i = 1; i <= 5; i++) html += `<i${i <= c.grade ? ' class="on"' : ''} aria-hidden="true">★</i>`;
  return html + '</span>';
}

function dotClass(r) {
  if (r.off) return 'off';
  if (r.hit === true) return 'ok';
  if (r.hit === false) return 'no';
  return 'unk';
}

function pearls(c) {
  return '<span class="kp-pearls">' + c.rows.map((r) => {
    const cls = dotClass(r);
    const what = r.off ? 'struken' : r.score || (r.res != null ? SIGNS[r.res] : 'okänt');
    return `<span class="kp-dot ${cls}" title="${esc(`${r.match} · ${r.sign} · ${what}`)}">${cls === 'ok' ? '✓' : cls === 'no' ? '✕' : ''}</span>`;
  }).join('') + '</span>';
}

function signBoxes(r) {
  return '<span class="kp-sg">' + SIGNS.map((s, i) => {
    const cls = [r.sign.includes(s) ? 'on' : '', r.res === i ? 'res' : '', r.tip === i ? 'tip' : ''].filter(Boolean).join(' ');
    return `<i class="${cls}">${s}</i>`;
  }).join('') + '</span>';
}

function basisNote(c) {
  if (c.basis === 'modell') return 'Väntat antal rätt enligt modellens chans för era tecken före avspark';
  if (c.basis === 'delvis') return 'Väntat antal rätt: modellens chans där den finns, annars en schablon (45 % för ett tecken, 75 % för två)';
  return 'Väntat antal rätt enligt en schablon – modellen fanns inte för de här matcherna (45 % för ett tecken, 75 % för två)';
}

// ---------- sammanfattningen ----------

function overview(list) {
  const done = list.filter((c) => c.n);
  if (!done.length) return '';
  const ok = done.reduce((a, c) => a + c.ok, 0);
  const n = done.reduce((a, c) => a + c.n, 0);
  const exp = done.reduce((a, c) => a + c.exp, 0);
  const avg = done.reduce((a, c) => a + c.grade, 0) / done.length;
  const tile = (label, value, sub, title = '') =>
    `<div class="hk-tile"${title ? ` title="${esc(title)}"` : ''}><span class="kp-eyebrow">${label}</span><b>${value}</b><span class="sub">${sub}</span></div>`;
  return '<div class="hk-tiles">' +
    tile('Kuponger', done.length, `${n} matcher`) +
    tile('Rätt', `${Math.round((100 * ok) / n)} %`, `${ok} av ${n}`) +
    tile('Snittbetyg', `${num(avg)}<small>★</small>`, 'av 5') +
    tile('Mot väntat', signed(ok - exp), 'rätt', 'Antal rätt jämfört med det väntade enligt modellen, alla kuponger') +
    '</div>' + chart(done);
}

// En stapel per kupong i tidsordning: höjden är andelen rätt, strecket det väntade.
function chart(done) {
  if (done.length < 2) return '';
  const cols = done.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)).slice(-24);
  return '<div class="card hk-chart" role="img" aria-label="Andel rätt per kupong jämfört med det väntade">' +
    '<div class="hk-cols">' + cols.map((c) => {
      const a = Math.round(100 * rate(c));
      const e = Math.round((100 * c.exp) / c.n);
      return `<a class="hk-col" href="#${esc(c.id)}" title="${esc(`${c.name || dateRange(c.date, c.till)}: ${c.ok} av ${c.n} rätt · väntat ${num(c.exp)} · ${c.grade} ★`)}">` +
        `<span class="hk-bar"><i class="g${c.grade}" style="height:${a}%"></i><b style="bottom:${e}%"></b></span>` +
        `<span class="hk-lab">${esc(dateRange(c.date))}</span></a>`;
    }).join('') + '</div>' +
    '<span class="hk-key"><span><i class="us"></i>Andel rätt</span><span><i class="exp"></i>Väntat</span></span></div>';
}

// ---------- kupongerna ----------

function sorted(list) {
  const by = {
    senaste: (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    betyg: (a, b) => (a.grade || 0) - (b.grade || 0) || a.z - b.z,
    andel: (a, b) => rate(a) - rate(b) || a.n - b.n,
    modellen: (a, b) => (vsModel(a) ?? -99) - (vsModel(b) ?? -99) || rate(a) - rate(b),
  }[H.sort];
  return list.slice().sort((a, b) => H.dir * by(b, a) || b.date.localeCompare(a.date));
}

function aiBlock(c) {
  const a = c.ai || H.ai.get(c.id);
  if (!a) return '';
  if (a === 'loading') return '<div class="hk-ai is-loading"><span class="hk-ai-who">AI-kommentar</span><p><span class="hk-dots"><i></i><i></i><i></i></span> skriver …</p></div>';
  if (a.error) return '';
  return `<div class="hk-ai"><span class="hk-ai-who"${a.model ? ` title="${esc(a.model)}"` : ''}>AI-kommentar</span><p>${esc(a.text)}</p></div>`;
}

function card(c) {
  const title = c.name || dateRange(c.date, c.till);
  const eyebrow = [c.name ? dateRange(c.date, c.till) : null, c.game].filter(Boolean).join(' · ') || 'Kupong';
  const vm = vsModel(c);
  const notes = c.rows.filter((r) => r.note).length;
  return `<article class="card hk-card" id="${esc(c.id)}">` +
    '<div class="hk-top">' +
    `<div class="hk-title"><p class="kp-eyebrow">${esc(eyebrow)}</p><h4>${esc(title)}</h4></div>` +
    `<div class="hk-grade" title="${esc(`Betyget jämför ${c.ok} rätt med väntat ${num(c.exp)}`)}">${stars(c)}<span>${esc(c.label || 'Ej rättad')}</span></div>` +
    '</div>' +
    '<div class="hk-mid">' +
    `<span class="kp-big"><b>${c.ok}</b><span>/ ${c.n} rätt</span></span>` +
    `<div class="hk-facts">${pearls(c)}<span class="kp-line">` +
    `<span title="${esc(basisNote(c))}">väntat <b>${num(c.exp)}</b>${c.basis !== 'modell' ? '*' : ''}</span>` +
    (vm != null ? ` · modellens tips <b>${c.modelOk}</b>${vm ? ` <span class="${vm > 0 ? 'up' : 'down'}">${vm > 0 ? `ni +${vm}` : `ni −${-vm}`}</span>` : ''}` : '') +
    '</span></div></div>' +
    `<div class="hk-ai-slot" data-ai="${esc(c.id)}">${aiBlock(c)}</div>` +
    `<details class="hk-rows"><summary>Matcherna${notes ? ` <span class="hk-count">· ${notes} ${notes === 1 ? 'anteckning' : 'anteckningar'}</span>` : ''}</summary>` +
    '<div class="mlist">' + c.rows.map(rowHtml).join('') + '</div></details>' +
    '</article>';
}

function rowHtml(r) {
  const cls = dotClass(r);
  const res = r.off ? '<span class="sub">struken</span>'
    : r.score ? `<span class="score">${esc(r.score)}</span>${r.end ? `<span class="sub">${esc(r.end)}</span>` : ''}`
      : r.res != null ? `<span class="score">${SIGNS[r.res]}</span>` : '<span class="sub">okänt</span>';
  return `<div class="hk-row s-${cls}">` +
    `<span class="kp-dot ${cls}" aria-hidden="true">${cls === 'ok' ? '✓' : cls === 'no' ? '✕' : ''}</span>` +
    `<span class="hk-match">${esc(r.match)}${r.note ? `<span class="hk-note">${esc(r.note)}</span>` : ''}</span>` +
    signBoxes(r) +
    (r.p != null
      ? `<span class="kp-p" title="Modellens chans för ert tecken, före avspark"><span class="kp-pbar"><i style="width:${Math.min(100, r.p)}%"></i></span>${r.p} %</span>`
      : '<span class="kp-p unknown" title="Modellens chans är okänd för matchen">–</span>') +
    `<span class="hk-res">${res}</span></div>`;
}

function render() {
  const el = $('#history');
  const list = H.data.coupons || [];
  if (!list.length) {
    el.innerHTML = '<div class="card kp-empty"><p class="intro">Inga färdiga kuponger än. När alla matcher på en kupong är spelade hamnar den här, med betyg och AI:ns kommentar.</p>' +
      '<a class="kp-btn primary" href="index.html#kupong">Till kupongen</a></div>' + errors();
    return;
  }
  el.innerHTML = overview(list) +
    '<div class="toolbar hk-tools"><div class="seg" role="group" aria-label="Sortera">' +
    SORTS.map((s) => {
      const on = s.id === H.sort;
      const arrow = on ? `<span class="hk-dir" aria-hidden="true">${H.dir > 0 ? '↓' : '↑'}</span>` : '';
      return `<button type="button" data-sort="${s.id}" aria-pressed="${on}" title="${esc(on ? 'Tryck igen för omvänd ordning' : s.title)}">${s.label}${arrow}</button>`;
    }).join('') + '</div></div>' +
    `<div class="hk-list">${sorted(list).map(card).join('')}</div>` +
    '<p class="legend">Betyget jämför antal rätt med det väntade enligt modellen före avspark – en skräll som sitter väger mer än en storfavorit. ' +
    'Prickarna under 1 X 2 är modellens tips.' + (list.some((c) => c.basis !== 'modell') ? ' * Väntat delvis enligt schablon.' : '') + '</p>' +
    errors();
  for (const b of el.querySelectorAll('[data-sort]')) {
    b.addEventListener('click', () => {
      if (H.sort === b.dataset.sort) H.dir = -H.dir;
      else { H.sort = b.dataset.sort; H.dir = 1; }
      store(SORT_KEY, { sort: H.sort, dir: H.dir });
      render();
    });
  }
}

function errors() {
  const errs = H.data && H.data.errors;
  if (!errs || !errs.length) return '';
  return '<p class="legend">' + errs.map((e) => `<span class="note">${esc(e)}</span>`).join('<br>') + '</p>';
}

function paintAi(id) {
  const c = (H.data.coupons || []).find((x) => x.id === id);
  const slot = document.querySelector(`[data-ai="${CSS.escape(id)}"]`);
  if (c && slot) slot.innerHTML = aiBlock(c);
}

// AI:ns kommentar till kuponger som inte har den inskriven än – en i taget,
// senaste först. Proxyn cachar texten, så det här kostar bara första gången.
async function fetchComments() {
  const endpoint = H.data.comment && H.data.comment.endpoint;
  if (!endpoint) return;
  const todo = (H.data.coupons || []).filter((c) => !c.ai && c.n);
  for (const c of todo) {
    H.ai.set(c.id, 'loading');
    paintAi(c.id);
    let a;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id }),
      });
      const j = await res.json().catch(() => null);
      a = j && j.ok && j.text ? { text: j.text, model: j.model } : { error: (j && j.error) || `HTTP ${res.status}` };
    } catch (err) {
      a = { error: err.message };
    }
    H.ai.set(c.id, a);
    paintAi(c.id);
  }
}

(async function init() {
  const saved = load(SORT_KEY);
  if (saved && SORTS.some((s) => s.id === saved.sort)) { H.sort = saved.sort; H.dir = saved.dir === -1 ? -1 : 1; }
  try {
    H.data = await getJSON('data/historik.json');
  } catch (err) {
    $('#history').innerHTML = `<p class="empty">Historiken kunde inte läsas (${esc(err.message)}).</p>`;
    return;
  }
  render();
  if (location.hash.length > 1) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) t.scrollIntoView();
  }
  fetchComments();
})();
