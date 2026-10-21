'use strict';

// Kuponghistoriken (Olympen → Grupparbetena, #olympen/kuponger/<id>):
// gängets färdigspelade kuponger, sorterbara efter hur det gick, med betyget
// mot modellen och AI:ns kommentar. Data: data/historik.json (src/history.js)
// – kupongerna i data/kupong-historik.json plus sidans färdiga kuponger som
// inte frysts in där än. Kommentaren som saknas i filen hämtas från proxyn
// (worker/kommentar.mjs), en i taget.
//
// kampen.js ritar delen med Historik.show(el, id), längst ner i Olympen, och
// läser kupongerna med Historik.coupons() till tabellen Omgångarna. Allt
// ligger i en funktion, som spoiler.js, så att inget krockar med app.js och
// kupong.js.

(function () {
  const SIGNS = ['1', 'X', '2'];
  const SORTS = [
    { id: 'senaste', label: 'Senaste', title: 'Senaste kupongen först' },
    { id: 'betyg', label: 'Betyg', title: 'Bästa betyget först' },
    { id: 'andel', label: 'Andel rätt', title: 'Högst andel rätt först' },
    { id: 'modellen', label: 'Mot modellen', title: 'Flest rätt jämfört med modellens tips först' },
  ];
  const SORT_KEY = 'profeterna.historik.sortering';
  const H = {
    el: null, // rutan som historiken ritas i
    data: null,
    loading: null,
    sort: 'senaste',
    dir: 1, // 1 = bäst/senast först, -1 = omvänt
    ai: new Map(), // id → { text } | { error } | 'loading'
    wait: new Map(), // id → kommentaren som hämtas (Promise)
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

  function loadKey(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }
  function storeKey(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* inget */ }
  }

  const num = (x, d = 1) => x.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const rate = (c) => (c.n ? c.ok / c.n : 0);
  const vsModel = (c) => (c.modelN ? c.ok - c.modelOk : null);
  // Kupongen i Olympen.
  const href = (id) => `#olympen/kuponger/${encodeURIComponent(id)}`;

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
    const avg = done.reduce((a, c) => a + c.grade, 0) / done.length;
    // Samma rutor som höjdpunkterna ovanför (kampen.js).
    const tile = (label, value, sub) =>
      `<div class="dv-tile km-tile hk-tile"><div class="dv-tile-label">${label}</div><div class="dv-tile-num">${value}</div><div class="dv-tile-sub">${sub}</div></div>`;
    // Tre rutor: betyget jämför redan rätt med det väntade, som också syns i staplarna.
    return '<div class="km-tiles">' +
      tile('Kuponger', done.length, `${n} matcher`) +
      tile('Rätt', `${Math.round((100 * ok) / n)} %`, `${ok} av ${n}`) +
      tile('Betyg', `${num(avg)}<small>★</small>`, 'i snitt av 5') +
      '</div>' + chart(done);
  }

  // En stapel per kupong i tidsordning: höjden är andelen rätt, strecket det väntade.
  function chart(done) {
    if (done.length < 2) return '';
    const cols = done.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)).slice(-24);
    // Som kurvan Omgång för omgång ovanför (kampen.js).
    return '<div class="card km-card hk-chart" role="img" aria-label="Andel rätt per kupong jämfört med det väntade">' +
      '<p class="kp-eyebrow">Kupong för kupong</p>' +
      '<div class="hk-cols">' + cols.map((c) => {
        const a = Math.round(100 * rate(c));
        const e = Math.round((100 * c.exp) / c.n);
        return `<a class="hk-col" href="${esc(href(c.id))}" title="${esc(`${c.name || dateRange(c.date, c.till)}: ${c.ok} av ${c.n} rätt · väntat ${num(c.exp)} · ${c.grade} ★`)}">` +
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

  // Laget med skölden in mot mitten, som i matchlistan (theme.css .mteam).
  function team(name, home) {
    const skold = window.Skoldar ? Skoldar.img(name, { dark: true }) : '';
    const n = `<span class="mname">${esc(name)}</span>`;
    return `<span class="mteam${home ? ' home' : ''}">${home ? n + skold : skold + n}</span>`;
  }

  // Raden som matchlistans tavla: lagen speglade kring resultatet, tecknen
  // och modellens odds till höger (historik.css .hk-row). En match som
  // skrivits in för hand utan mellanslag kring strecket står hel till vänster
  // om resultatet. Förlängning och straffar står på var sin rad under det.
  function rowHtml(r) {
    const cls = dotClass(r);
    const res = r.off ? '<span class="sub">struken</span>'
      : r.score ? `<span class="score">${esc(r.score)}</span>${r.end ? `<span class="sub">${r.end.split(', ').map(esc).join('<br>')}</span>` : ''}`
        : r.res != null ? `<span class="score">${SIGNS[r.res]}</span>` : '<span class="sub">okänt</span>';
    const sides = r.match.split(/\s[–-]\s/);
    const teams = sides.length === 2
      ? `${team(sides[0], true)}<span class="mmid">${res}</span>${team(sides[1], false)}`
      : `<span class="hk-whole">${esc(r.match)}</span><span class="mmid">${res}</span>`;
    return `<div class="hk-row s-${cls}">${teams}` +
      (r.note ? `<span class="hk-note">${esc(r.note)}</span>` : '') +
      '<span class="hk-pick">' +
      `<span class="kp-dot ${cls}" aria-hidden="true">${cls === 'ok' ? '✓' : cls === 'no' ? '✕' : ''}</span>` +
      signBoxes(r) +
      (r.p != null
        ? `<span class="kp-p" title="Modellens odds för ert tecken, före avspark (${r.p} % chans)"><span class="kp-pbar"><i style="width:${Math.min(100, r.p)}%"></i></span>${pctOdds(r.p)}</span>`
        : '<span class="kp-p unknown" title="Modellens chans är okänd för matchen">–</span>') +
      '</span></div>';
  }

  // ---------- spoilerskyddet ----------

  // Kupongen döljs om någon av dess matcher döljs (spoiler.js). Kuponger utan
  // matchid (inskrivna för hand) bedöms på sista matchens dag.
  function isHidden(c) {
    if (!window.Spoiler || !Spoiler.on()) return false;
    const known = c.rows.map((r) => (r.id ? Spoiler.hiddenId(r.id) : null)).filter((x) => x != null);
    if (known.length) return known.some(Boolean);
    return !Spoiler.isShown(`kupong:${c.id}`) && Spoiler.hidesDay(c.till || c.date);
  }

  function hiddenCard(c) {
    const keys = [`kupong:${c.id}`, ...c.rows.map((r) => r.id).filter(Boolean)];
    return `<article class="card hk-card" id="${esc(c.id)}">` +
      `<div class="hk-top"><div class="hk-title"><p class="kp-eyebrow">${esc(c.name ? dateRange(c.date, c.till) : c.game || 'Kupong')}</p>` +
      `<h4>${esc(c.name || dateRange(c.date, c.till))}</h4></div></div>` +
      Spoiler.card({ title: 'Resultatet är dolt', text: 'Du har valt att dölja resultat.', keys, button: 'Visa resultatet' }) +
      '</article>';
  }

  function render() {
    const el = H.el;
    const all = H.data.coupons || [];
    // Dolda kuponger överst och utanför sammanfattningen, så att varken
    // siffrorna eller sorteringen avslöjar hur det gick.
    const hidden = all.filter(isHidden);
    const list = all.filter((c) => !hidden.includes(c));
    // Utan färdiga kuponger syns delen inte alls.
    el.hidden = !all.length && !errors();
    if (!all.length) {
      el.innerHTML = errors();
      return;
    }
    el.innerHTML = '<div class="dv-sechead hk-head"><h3 title="Gängets gemensamma kuponger">Grupparbetena</h3></div>' +
      overview(list) +
      '<div class="toolbar hk-tools"><div class="seg" role="group" aria-label="Sortera">' +
      SORTS.map((s) => {
        const on = s.id === H.sort;
        const arrow = on ? `<span class="hk-dir" aria-hidden="true">${H.dir > 0 ? '↓' : '↑'}</span>` : '';
        return `<button type="button" data-sort="${s.id}" aria-pressed="${on}" title="${esc(on ? 'Tryck igen för omvänd ordning' : s.title)}">${s.label}${arrow}</button>`;
      }).join('') + '</div></div>' +
      `<div class="hk-list">${hidden.map(hiddenCard).join('')}${sorted(list).map(card).join('')}</div>` +
      errors();
    for (const b of el.querySelectorAll('[data-sort]')) {
      b.addEventListener('click', () => {
        if (H.sort === b.dataset.sort) H.dir = -H.dir;
        else { H.sort = b.dataset.sort; H.dir = 1; }
        storeKey(SORT_KEY, { sort: H.sort, dir: H.dir });
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
  // Varje kupong frågas en gång, också när rättningen (rattning.js) ber om
  // samma kommentar.
  function fetchComment(c, endpoint) {
    if (H.wait.has(c.id)) return H.wait.get(c.id);
    const p = (async () => {
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
      return a;
    })();
    H.wait.set(c.id, p);
    return p;
  }

  async function fetchComments() {
    const endpoint = H.data.comment && H.data.comment.endpoint;
    if (!endpoint) return;
    const todo = (H.data.coupons || []).filter((c) => !c.ai && c.n);
    for (const c of todo) await fetchComment(c, endpoint);
  }

  function load() {
    if (H.loading) return H.loading;
    const saved = loadKey(SORT_KEY);
    if (saved && SORTS.some((s) => s.id === saved.sort)) { H.sort = saved.sort; H.dir = saved.dir === -1 ? -1 : 1; }
    // Med spoilerskyddet på behövs matchernas avsparkstider först, och
    // sköldarnas index till raderna.
    H.loading = Promise.all([
      getJSON('data/historik.json'),
      window.Spoiler && Spoiler.on() ? Spoiler.matches() : null,
      window.Skoldar && Skoldar.ready,
    ]).then(([data]) => {
      H.data = data;
      if (window.Spoiler) Spoiler.onChange(async () => { await Spoiler.matches(); if (visible()) render(); });
      fetchComments();
    });
    H.loading.catch(() => { H.loading = null; }); // nästa visning försöker igen
    return H.loading;
  }

  const visible = () => Boolean(H.el && H.el.isConnected && !H.el.closest('[hidden]'));

  function focus(id) {
    const t = id && document.getElementById(id);
    if (t) t.scrollIntoView();
  }

  // Ritar historiken i el och bläddrar till kupongen id (om den finns).
  async function show(el, id) {
    H.el = el;
    try {
      await load();
    } catch (err) {
      if (H.el === el) el.innerHTML = `<p class="empty">Historiken kunde inte läsas (${esc(err.message)}).</p>`;
      return;
    }
    if (H.el !== el || !el.isConnected) return; // en annan vy hann visas
    render();
    focus(id);
  }

  // De färdigspelade kupongerna (till tabellen Omgångarna i kampen.js), med
  // matchernas id i rows. Tom lista om historiken inte går att läsa.
  async function coupons() {
    try {
      await load();
    } catch {
      return [];
    }
    return H.data.coupons || [];
  }

  // Kupongens betyg och kommentar till rättningen på papperet
  // (rattning.js): { label, text, model }, eller null om kupongen inte finns
  // i historiken än.
  async function entry(id) {
    await load();
    const c = (H.data.coupons || []).find((x) => x.id === id);
    if (!c || !c.n) return null;
    const endpoint = H.data.comment && H.data.comment.endpoint;
    const a = c.ai || (endpoint ? await fetchComment(c, endpoint) : null);
    return { label: c.label || null, text: (a && a.text) || null, model: (a && a.model) || null };
  }

  window.Historik = { show, focus, entry, coupons, hidden: isHidden, href };
})();
