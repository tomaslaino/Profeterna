'use strict';

// Sökningen i toppbaren, som på gravergrav.se: förstoringsglaset bredvid ögat
// öppnar en ruta ovanpå toppbaren, och det man skriver ger lag, spelare och
// matcher. Ett lag öppnar lagkortet och en spelare spelarkortet (divisioner.js,
// samma kort som på Statistik), en match matchbladet på förstasidan.
//
// Lagen och spelarna kommer ur divisionernas spelarfiler, matcherna ur
// matches.json. Inget hämtas förrän man öppnar sökningen. Resultat och
// tabellplaceringar visas inte, så att sökningen aldrig avslöjar något när
// resultaten är dolda (spoiler.js).

(function () {
  const TZ = 'Europe/Stockholm';
  const LEAGUES = ['pl', 'ch', 'l1', 'l2']; // divisionerna med spelarfiler
  const POS = { MV: 'Målvakt', B: 'Back', MF: 'Mittfältare', A: 'Anfallare' };
  const MAX = { lag: 3, spelare: 4, matcher: 3 };
  // Smeknamn som inte börjar som något ord i lagets namn.
  const ALIAS = {
    'Manchester United': 'utd',
    'Sheffield United': 'utd',
    'Tottenham Hotspur': 'spurs',
    'Wolverhampton Wanderers': 'wolves',
    'Middlesbrough': 'boro',
    'Queens Park Rangers': 'qpr',
    'Milton Keynes Dons': 'mk',
    'Brighton & Hove Albion': 'bha',
  };

  const icon = (paths, cls = 'sk-ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  const GLASS = icon('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20.5 20.5"/>');

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  // Gemener utan accenter, så att "odegaard" hittar Ødegaard och "joao" João.
  const fold = (s) => String(s).toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/ł/g, 'l').replace(/ı/g, 'i').replace(/đ/g, 'd')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Orden att söka på: vart och ett för sig och hela namnet i ett (N'Golo → ngolo).
  function words(...names) {
    const w = [];
    for (const n of names) {
      const f = fold(n);
      w.push(...f.split(/[^a-z0-9]+/).filter(Boolean), f.replace(/[^a-z0-9]/g, ''));
    }
    return w;
  }
  // Varje ord i frågan ska vara början på något ord i posten.
  const hits = (q, w) => q.every((t) => w.some((x) => x.startsWith(t)));

  const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
  const fTime = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const when = (t) => `${fDay.format(new Date(t)).replace(/\./g, '')} · ${fTime.format(new Date(t))}`;
  const crest = (name) => (window.Skoldar ? Skoldar.img(name, { dark: true }) : '<span class="skold" aria-hidden="true"></span>');

  async function getJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ---------- registret ----------

  let reg = null;
  let loaded = null;
  function load() {
    if (!reg) {
      reg = Promise.all([
        getJSON('data/meta.json'),
        getJSON('data/matches.json'),
        ...LEAGUES.map((id) => getJSON(`data/players/${id}.json`).catch(() => null)),
        window.Skoldar && Skoldar.ready,
      ]).then(([meta, M, ...files]) => {
        const comps = new Map((meta.competitions || []).map((c) => [c.id, c.name]));
        const teams = [];
        const players = [];
        LEAGUES.forEach((div, tier) => {
          const P = files[tier];
          if (!P || P.unknown) return;
          const rank = new Map(((P.table && P.table.rows) || []).map((r) => [r.espnId, r.rank]));
          for (const t of P.teams || []) {
            teams.push({ div, tier, id: t.espnId, name: t.name, rank: rank.get(t.espnId), w: words(t.name, ALIAS[t.name] || '') });
          }
          for (const p of P.players || []) {
            players.push({ div, id: p.id, name: p.name, team: p.team, pos: p.pos, min: p.min || p.emin || 0, app: p.app || 0, w: words(p.name), tw: words(p.team) });
          }
        });
        const matches = (M.matches || []).map((m) => ({
          id: m.id, comp: m.comp, t: new Date(m.kickoff).getTime(), home: m.home, away: m.away,
          w: words(m.home, m.away, ALIAS[m.home] || '', ALIAS[m.away] || ''),
        }));
        loaded = { comps, divs: new Map(LEAGUES.map((id) => [id, comps.get(id) || id])), teams, players, matches };
        return loaded;
      });
      reg.catch(() => { reg = null; });
    }
    return reg;
  }

  function search(R, raw) {
    const q = fold(raw).split(/[^a-z0-9]+/).filter(Boolean);
    const whole = fold(raw).trim();
    if (!q.length) return [];
    const starts = (name) => (fold(name).startsWith(whole) ? 0 : 1);

    const teams = R.teams.filter((t) => hits(q, t.w))
      .sort((a, b) => starts(a.name) - starts(b.name) || a.tier - b.tier || (a.rank || 99) - (b.rank || 99))
      .slice(0, MAX.lag);
    // Spelaren på namnet, eller på namnet och laget ("rice ars").
    const players = R.players.filter((p) => hits(q, p.w) || (q.length > 1 && hits(q, p.w.concat(p.tw)) && q.some((t) => p.w.some((x) => x.startsWith(t)))))
      .sort((a, b) => starts(a.name) - starts(b.name) || b.min - a.min || b.app - a.app)
      .slice(0, MAX.spelare);
    // Kommande matcher först, närmast först; sedan de spelade, senast först.
    const soon = Date.now() - 3 * 3600000;
    const matches = R.matches.filter((m) => hits(q, m.w))
      .sort((a, b) => (a.t >= soon) !== (b.t >= soon) ? (a.t >= soon ? -1 : 1) : a.t >= soon ? a.t - b.t : b.t - a.t)
      .slice(0, MAX.matcher);

    const hide = window.Spoiler && Spoiler.on();
    const out = [];
    for (const t of teams) {
      const place = !hide && t.rank ? `${t.rank}:${t.rank % 10 <= 2 && t.rank % 10 > 0 && ![11, 12].includes(t.rank % 100) ? 'a' : 'e'} i ` : '';
      out.push({ grp: 'Lag', kind: 'lag', it: t, ic: crest(t.name), title: t.name, sub: place + R.divs.get(t.div) });
    }
    for (const p of players) {
      out.push({ grp: 'Spelare', kind: 'spelare', it: p, ic: crest(p.team), title: p.name, sub: [p.team, POS[p.pos]].filter(Boolean).join(' · ') });
    }
    for (const m of matches) {
      out.push({ grp: 'Matcher', kind: 'match', it: m, ic: crest(m.home), title: `${m.home} – ${m.away}`, sub: `${when(m.t)} · ${R.comps.get(m.comp) || m.comp}` });
    }
    return out;
  }

  // ---------- att öppna ett resultat ----------

  // Korten från Statistik: på Tabeller och Statistik finns de redan, på de
  // andra sidorna läses divisioner.js in som matchbladet gör (app.js).
  async function cards() {
    if (!window.Spelarkort) {
      try { await import('./divisioner.js'); } catch { /* utan korten */ }
    }
    return window.Spelarkort || null;
  }

  async function choose(r) {
    close();
    if (r.kind === 'match') {
      if (document.getElementById('match-modal')) location.hash = `match/${r.it.id}`;
      else location.href = `index.html#match/${r.it.id}`;
      return;
    }
    const S = await cards();
    if (!S) { location.href = `statistik.html#${r.it.div}/${r.kind === 'lag' ? 'lag' : 'spelare'}`; return; }
    if (r.kind === 'lag') S.team(r.it.div, r.it.id);
    else S.open(r.it.div, r.it.id);
  }

  // ---------- rutan ----------

  let ctl = null;
  let btn = null;
  let box = null;
  let input = null;
  let list = null;
  let shown = [];
  let at = -1;

  function mount() {
    const bar = document.querySelector('.topbar-inner');
    if (!bar) return;
    ctl = document.createElement('div');
    ctl.className = 'sk-ctl';
    ctl.innerHTML = `<button type="button" class="sk-btn" aria-label="Sök lag, spelare eller match" title="Sök" aria-expanded="false" aria-controls="sk-box">${GLASS}</button>` +
      '<div class="sk-box" id="sk-box" hidden>' +
      `<div class="sk-field">${GLASS}<input type="search" placeholder="Lag, spelare eller match" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" ` +
      'role="combobox" aria-label="Sök lag, spelare eller match" aria-expanded="false" aria-controls="sk-list" aria-autocomplete="list">' +
      '<button type="button" class="sk-x" aria-label="Stäng sökningen">×</button></div>' +
      '<div class="sk-list" id="sk-list" role="listbox" aria-label="Träffar" hidden></div></div>';
    bar.insertBefore(ctl, bar.querySelector('.sp-ctl'));
    btn = ctl.querySelector('.sk-btn');
    box = ctl.querySelector('.sk-box');
    input = ctl.querySelector('input');
    list = ctl.querySelector('.sk-list');

    btn.addEventListener('click', open);
    ctl.querySelector('.sk-x').addEventListener('click', () => close(true));
    input.addEventListener('input', paint);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (shown.length) mark((at + (e.key === 'ArrowDown' ? 1 : shown.length - 1)) % shown.length, true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (shown.length) choose(shown[Math.max(at, 0)]);
      }
    });
    // mousedown: resultatet väljs innan fältet tappar fokus
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => {
      const o = e.target.closest('[data-i]');
      if (o) choose(shown[Number(o.dataset.i)]);
    });
    list.addEventListener('mousemove', (e) => {
      const o = e.target.closest('[data-i]');
      if (o && Number(o.dataset.i) !== at) mark(Number(o.dataset.i));
    });
    document.addEventListener('click', (e) => {
      if (!box.hidden && !e.composedPath().includes(ctl)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !box.hidden) { close(true); return; }
      // "/" öppnar sökningen, utom när man skriver någon annanstans
      if (e.key === '/' && box.hidden && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !e.target.closest('input, textarea, select, [contenteditable]')) {
        e.preventDefault();
        open();
      }
    });
    window.addEventListener('hashchange', () => { if (!box.hidden) close(); });
  }

  // Datorn: rutan fyller den tomma delen av toppbaren mellan menyn och
  // förstoringsglaset (högst 360 px). Är den för smal läggs rutan över menyn.
  function fit() {
    const nav = document.querySelector('.topbar .tabs');
    if (!nav || matchMedia('(max-width: 680px)').matches) { box.style.width = ''; return; }
    const room = btn.getBoundingClientRect().right - nav.getBoundingClientRect().right - 24;
    box.style.width = `${Math.round(Math.max(260, Math.min(360, room)))}px`;
  }

  function open() {
    fit();
    box.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    input.focus();
    input.select();
    load().catch(() => {});
    paint();
  }

  function close(focus) {
    if (!box) return;
    box.hidden = true;
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-expanded', 'false');
    if (focus) btn.focus();
  }

  // scroll: med piltangenterna rullar listan så att det markerade syns
  function mark(i, scroll) {
    at = i;
    for (const o of list.querySelectorAll('[data-i]')) o.setAttribute('aria-selected', String(Number(o.dataset.i) === i));
    const cur = list.querySelector(`[data-i="${i}"]`);
    if (!cur) return;
    input.setAttribute('aria-activedescendant', cur.id);
    if (scroll) {
      if (cur.offsetTop < list.scrollTop) list.scrollTop = cur.offsetTop - 8;
      else if (cur.offsetTop + cur.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = cur.offsetTop + cur.offsetHeight - list.clientHeight + 8;
    }
  }

  function message(text) {
    shown = [];
    at = -1;
    input.removeAttribute('aria-activedescendant');
    list.innerHTML = `<p class="sk-msg">${esc(text)}</p>`;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  async function paint() {
    const q = input.value;
    if (fold(q).replace(/[^a-z0-9]/g, '').length < 2) {
      shown = [];
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    let R;
    try {
      if (!loaded) message('Laddar …');
      R = await load();
    } catch {
      message('Kunde inte läsa lagen och matcherna');
      return;
    }
    if (input.value !== q || box.hidden) return; // man hann skriva vidare
    shown = search(R, q);
    if (!shown.length) { message('Inget hittat'); return; }
    let html = '';
    let grp = '';
    shown.forEach((r, i) => {
      if (r.grp !== grp) { grp = r.grp; html += `<p class="sk-grp" role="presentation">${esc(grp)}</p>`; }
      html += `<div class="sk-it" role="option" id="sk-o${i}" data-i="${i}" aria-selected="false">${r.ic}` +
        `<span class="sk-t"><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span></div>`;
    });
    list.innerHTML = html;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    mark(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
