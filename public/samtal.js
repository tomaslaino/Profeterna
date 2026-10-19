'use strict';

// Inför samtalet (Kupong → Samtalet): var och en i gänget tippar omgångens
// matcher för sig – ett tecken eller en gardering per match – och ingen ser
// de andras tips förrän alla har lämnat in (eller samtalet börjar, senast när
// första matchen startar). Då blir sidan underlaget för telefonsamtalet:
// matcherna sorteras efter hur oeniga vi är, och gängets kupong växer fram
// när man trycker på rutorna. Den görs sedan som vanligt (Ny kupong → Spara).
//
//   #kupong/samtal           omgången: vem som lämnat in, sedan underlaget
//   #kupong/samtal/tips      dina tips
//   #kupong/samtal/ny        ny omgång: välj matcherna (och tiden för samtalet)
//   #kupong/samtal/matcher   ändra omgångens matcher
//
// Omgången och tipsen ligger i tjänsten profeterna-kupong (worker/samtal.mjs,
// GET/POST …/samtal; lokalt /api/samtal), som håller tipsen dolda. Vem man
// är och gängets tecken under samtalet sparas bara på enheten.
//
// Läses efter app.js och kupong.js och använder deras hjälpare (KP, SIGNS,
// matchById, isOpen, pickable, gradeRow …). kupong.js ritar vyerna med
// Samtal.show(sub) och förstasidans ruta med Samtal.teaser().

(function () {
  const SM = {
    data: undefined, // omgången som tjänsten visar den; null = ingen, undefined = inte hämtad
    error: null,
    timer: null,
    pick: null, // ny omgång / ändra matcherna: {ids: Set, tid}
    q: '',
    comp: 'all',
    only: false,
    draft: null, // dina tips: {id, vem, tecken, kommentarer, inne}
    again: false, // Gör kupongen trots matcher utan tecken
  };
  const VEM = 'profeterna.samtal.vem';
  const TIPS = 'profeterna.samtal.tips';
  const DECIDE = 'profeterna.samtal.beslut';
  const POLL_MS = 20000;

  const info = () => (KP.data && KP.data.samtal) || null;
  const gang = () => (info() ? info().gang : []);
  const me = () => {
    const v = kpLoad(VEM);
    return gang().some((g) => g.id === v) ? v : null;
  };
  const here = (sub) => Boolean(KP.view && KP.view.mode === 'samtal' && KP.view.sub === sub && !$('#coupon-section').hidden);
  // Initialerna i en egen färg per person; streckad = del av en gardering.
  const chip = (id, hedge = false) =>
    `<span class="sm-ch sm-p${Math.max(0, gang().findIndex((g) => g.id === id))}${hedge ? ' g' : ''}">${esc(id)}</span>`;
  const rader = (signs) => signs.reduce((a, s) => a * Math.max(1, s.length), 1);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const kicks = (s) => s.matcher.map((x) => Date.parse(x.avspark)).filter(Number.isFinite);
  const over = (s) => Date.now() >= Math.max(...kicks(s));
  const teamsHtml = (x, m) => (m ? `${esc(m.home)}<span class="vs">–</span>${esc(m.away)}` : esc(x.match));

  // ---------- tjänsten ----------

  async function load() {
    try {
      const res = await fetch(`${info().endpoint}?t=${Date.now()}`, { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
      SM.data = body.samtal || null;
      SM.error = null;
    } catch (err) {
      SM.error = err.message || 'ingen kontakt';
    }
  }

  // Kodordet är kupongens, sparat på enheten (KP_CODE). Saknas det står ett
  // fält för det bredvid knappen (#sm-kod).
  function codeField() {
    return kpLoad(KP_CODE) ? '' : '<input type="password" id="sm-kod" class="kp-name sm-kod" placeholder="Kodord" autocomplete="current-password" aria-label="Kodord">';
  }

  async function send(body) {
    const field = $('#sm-kod');
    const kod = field ? field.value : kpLoad(KP_CODE);
    if (!kod) return { error: 'Skriv kodordet.' };
    let res = null;
    let out = {};
    try {
      res = await fetch(info().endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kod, ...body }) });
      out = await res.json().catch(() => ({}));
    } catch { /* ingen kontakt */ }
    if (res && res.status === 403) {
      kpStore(KP_CODE, null);
      return { error: 'Fel kodord.', code: true };
    }
    if (res && res.ok && out.ok) {
      kpStore(KP_CODE, kod);
      if ('samtal' in out) SM.data = out.samtal;
      return out;
    }
    // 409: omgången har bytts eller tipsen visas redan – sidan visar läget.
    if (res && res.status === 409 && 'samtal' in out) SM.data = out.samtal;
    return { ...out, ok: false, status: res && res.status, error: out.error || 'Ingen kontakt med servern.' };
  }

  // Ritar om när omgången ändrats, t.ex. när någon lämnat in.
  function poll() {
    clearInterval(SM.timer);
    SM.timer = setInterval(async () => {
      if (!here('')) { clearInterval(SM.timer); return; }
      if (document.hidden) return;
      const before = JSON.stringify(SM.data);
      await load();
      if (here('') && JSON.stringify(SM.data) !== before) renderRound();
    }, POLL_MS);
  }

  async function show(sub) {
    KP.view = { mode: 'samtal', sub };
    const el = $('#coupon');
    if (!info()) {
      el.innerHTML = viewNav('samtal') + '<p class="empty">Samtalet är inte påslaget på den här sajten.</p>';
      return;
    }
    if (SM.data === undefined) el.innerHTML = viewNav('samtal') + '<p class="empty">Laddar …</p>';
    await load();
    if (!here(sub)) return;
    if (sub === 'ny') renderStart(false);
    else if (sub === 'matcher') renderStart(true);
    else if (sub === 'tips') await renderTips();
    else {
      renderRound();
      poll();
    }
    window.scrollTo(0, 0);
  }

  // ---------- omgången ----------

  function head(s, eyebrow, actions = '') {
    const k = s ? kicks(s) : [];
    return '<div class="kp-head"><div>' +
      `<p class="kp-eyebrow">${esc(eyebrow)}</p>` +
      `<h2 class="page-title">${s ? esc(dateRange(Math.min(...k), Math.max(...k))) : 'Ny omgång'}</h2></div>` +
      `<div class="kp-actions">${actions}</div></div>`;
  }

  // När samtalet börjar, efter "Inför samtalet" överst.
  const callTime = (s) => (s && s.tid ? fWeekdayTime.format(new Date(s.tid)) : '');

  function renderRound() {
    const el = $('#coupon');
    const s = SM.data;
    let html = viewNav('samtal');
    if (s === undefined || (SM.error && !s)) {
      el.innerHTML = html + `<p class="empty">Kunde inte läsa omgången (${esc(SM.error || 'okänt fel')}).</p>`;
      return;
    }
    if (!s) {
      el.innerHTML = html + '<div class="kp-empty card"><p class="kp-eyebrow">Inför samtalet</p><h2 class="page-title">Var och en tippar för sig</h2>' +
        '<p class="intro">Välj omgångens matcher. Sedan fyller alla i sina egna tips – med garderingar om man vill – och ingen ser de andras ' +
        'förrän alla har lämnat in. Då jämför ni dem här när ni ringer, och gör gängets kupong.</p>' +
        '<a class="kp-btn primary" href="#kupong/samtal/ny">Starta omgång</a></div>';
      return;
    }
    const eyebrow = ['Inför samtalet', callTime(s)].filter(Boolean).join(' · ');
    const actions = (s.visas ? '' : '<a class="kp-btn" href="#kupong/samtal/matcher">Ändra matcherna</a>') +
      (s.visas || over(s) ? '<a class="kp-btn" href="#kupong/samtal/ny">+ Ny omgång</a>' : '');
    html += head(s, eyebrow, actions);
    html += s.visas ? board(s) : waiting(s);
    el.innerHTML = html;
    wire(s);
  }

  // Vem är du – sparas på enheten, så att Fyll i dina tips vet vems de är.
  function whoAmI() {
    const v = me();
    return '<div class="sm-vem" role="group" aria-label="Vem är du?"><span class="sm-vem-q">Du är</span>' +
      gang().map((g) => `<button type="button" data-vem="${esc(g.id)}" aria-pressed="${g.id === v}" title="${esc(g.namn)}">` +
        `${chip(g.id)}<span>${esc(g.namn)}</span></button>`).join('') + '</div>';
  }

  // Innan tipsen visas: vem som lämnat in, dina tips och omgångens matcher.
  function waiting(s) {
    const v = me();
    const inne = s.gang.filter((g) => g.inne).length;
    const mine = v && s.gang.find((g) => g.id === v && g.inne);
    const local = kpLoad(TIPS);
    const own = local && local.id === s.id && local.vem === v && mine ? local.tecken : null;
    let html = '<div class="card sm-wait">' +
      '<div class="sm-folk">' + s.gang.map((g) => `<span class="sm-person${g.inne ? ' inne' : ''}">${chip(g.id)}` +
        `<span>${g.inne ? `inne ${esc(fWeekdayTime.format(new Date(g.inne)))}` : 'väntar'}${g.id === v ? ' · du' : ''}</span></span>`).join('') + '</div>' +
      `<p class="sm-wait-txt"><b>${inne} av ${s.gang.length}</b> har lämnat in. Tipsen visas när alla har gjort det` +
      `${s.tid ? `, eller när samtalet börjar ${esc(fWeekdayTime.format(new Date(s.tid)))}` : ''}.</p>` +
      whoAmI() +
      (v ? `<div class="kp-actions"><a class="kp-btn primary" href="#kupong/samtal/tips">${mine ? 'Ändra dina tips' : 'Fyll i dina tips'}</a></div>` : '') +
      '</div>';
    html += '<div class="mlist sm-list">' + s.matcher.map((x) => {
      const m = matchById(x.id);
      const comp = m ? compOf(m.comp) : null;
      return `<div class="sm-li"><span class="mtime">${esc(fWeekdayTime.format(new Date(x.avspark)))}</span>` +
        `<span class="ctag"${comp ? ` title="${esc(comp.name)}"` : ''}>${comp ? esc(comp.short) : ''}</span>` +
        `<span class="mteams">${teamsHtml(x, m)}</span>` +
        `<span class="sm-mine">${own && own[x.id] ? `<span class="sm-mine-lab">ditt</span>${esc(own[x.id])}` : ''}</span></div>`;
    }).join('') + '</div>';
    return html;
  }

  // ---------- underlaget ----------

  // Per match: vem som tippat vad, hur många som har med varje tecken och
  // vilken grupp matchen hamnar i.
  //   0 alla olika · 1 två mot en · 2 samma grund, olika säkerhet
  //   3 eniga mot modellen · 4 eniga · 5 bara en (eller ingen) har tippat
  function analyse(s) {
    const now = Date.now();
    return s.matcher.map((x) => {
      const m = matchById(x.id);
      const t = {};
      for (const g of s.gang) {
        const sign = s.tips && s.tips[g.id] && s.tips[g.id].tecken[x.id];
        if (sign) t[g.id] = sign;
      }
      const who = Object.keys(t);
      const n = who.length;
      const cov = SIGNS.map((sg) => who.filter((k) => t[k].includes(sg)));
      const most = Math.max(0, ...cov.map((c) => c.length));
      const pr = m && m.j && m.j.p ? m.j.p : m && m.f ? m.f.p : null;
      const fav = pr ? pr.indexOf(Math.max(...pr)) : null;
      const same = n > 0 && new Set(who.map((k) => t[k])).size === 1;
      const kind = n < 2 ? 5 : most === 1 ? 0 : most < n ? 1 : !same ? 2
        : fav != null && !t[who[0]].includes(SIGNS[fav]) ? 3 : 4;
      // Förslaget till gängets tecken: det som fler än hälften har med. Där
      // alla tippat olika får samtalet avgöra.
      const proposal = kind === 0 ? '' : SIGNS.filter((sg, i) => cov[i].length * 2 > n).join('');
      const notes = who.map((k) => ({ k, text: (s.tips[k].kommentarer || {})[x.id] })).filter((o) => o.text);
      const g = gradeRow({ id: x.id, sign: '1X2' }, now);
      return { x, m, t, n, cov, pr, fav, kind, proposal, notes, g, open: isOpen(m, now) };
    });
  }

  const GROUPS = [
    ['Alla olika', 'Ta dem först – kanske en gardering?'],
    [null, 'Den som avviker förklarar.'],
    ['Samma grund, olika säkerhet', 'Räcker det, eller ska vi gardera?'],
    ['Eniga mot modellen', 'Stämmer det verkligen?'],
    ['Eniga', 'Klubbas utan snack.'],
    ['Saknar tips', 'Alla har inte tippat de här.'],
  ];
  const groupName = (k, s) => GROUPS[k][0] || (s.gang.length === 3 ? 'Två mot en' : 'Delade meningar');

  // Gängets tecken under samtalet, på enheten. Börjar som förslaget.
  function decisions(s, rows) {
    const saved = kpLoad(DECIDE);
    if (saved && saved.id === s.id && saved.val) return saved.val;
    const val = {};
    for (const r of rows) if (r.proposal) val[r.x.id] = r.proposal;
    kpStore(DECIDE, { id: s.id, val });
    return val;
  }

  function board(s) {
    const rows = analyse(s);
    const val = decisions(s, rows);
    const ordered = [0, 1, 2, 3, 4, 5].flatMap((k) => rows.filter((r) => r.kind === k));
    const missing = s.gang.filter((g) => !(s.tips && s.tips[g.id]));
    let html = '<div class="sm-folk sm-folk-board">' + s.gang.map((g) => {
      const tip = s.tips && s.tips[g.id];
      if (!tip) return `<span class="sm-person">${chip(g.id)}<span>lämnade inte in</span></span>`;
      const signs = s.matcher.map((x) => tip.tecken[x.id] || '');
      const hel = signs.filter((x) => x.length === 3).length;
      const halv = signs.filter((x) => x.length === 2).length;
      // Antal rätt i de matcher som är klara.
      const done = rows.filter((r) => r.g.res != null && tip.tecken[r.x.id]);
      const ok = done.filter((r) => tip.tecken[r.x.id].includes(SIGNS[r.g.res])).length;
      const parts = [hel ? `${hel} helg.` : null, halv ? `${halv} halvg.` : null, plural(rader(signs), 'rad', 'rader'),
        done.length ? `<b>${ok}</b> rätt av ${done.length}` : null].filter(Boolean);
      return `<span class="sm-person inne">${chip(g.id)}<span>${parts.join(' · ')}</span></span>`;
    }).join('') + '</div>';
    if (missing.length) {
      html += `<p class="legend"><span class="note">${esc(missing.map((g) => g.id).join(' och '))} hann inte lämna in` +
        `${s.orsak === 'samtalet' ? ' innan samtalet började' : s.orsak === 'avspark' ? ' innan första matchen startade' : ''}.</span></p>`;
    }
    html += '<p class="legend sm-legend">' +
      `<span>${chip(s.gang[0].id)} enda tecknet</span><span>${chip(s.gang[0].id, true)} del av en gardering</span>` +
      '<span>siffran är modellens chans</span><span>tryck på rutorna för gängets tecken</span></p>';
    for (let k = 0; k <= 5; k++) {
      const list = rows.filter((r) => r.kind === k);
      if (!list.length) continue;
      html += `<div class="sm-group"><h3>${esc(groupName(k, s))} <span class="sm-count">${list.length}</span></h3><span>${esc(GROUPS[k][1])}</span></div>`;
      html += '<div class="mlist sm-board">' + list.map((r) => boardRow(r, val[r.x.id] || '', s)).join('') + '</div>';
    }
    // Gängets kupong: rutorna i samma ordning som matcherna ovan.
    const chosen = ordered.map((r) => val[r.x.id] || '');
    const done = chosen.filter(Boolean);
    const gard = done.filter((x) => x.length > 1).length;
    html += '<div class="kp-bar sm-bar">' +
      `<span class="kp-bar-txt"><b>Gängets kupong</b> · ${done.length} av ${rows.length} klara` +
      `${gard ? ` · ${plural(gard, 'gardering', 'garderingar')}` : ''} · <b>${rader(done)}</b> ${rader(done) === 1 ? 'rad' : 'rader'}</span>` +
      '<span class="sm-slots" aria-hidden="true">' + chosen.map((x) => `<i${x ? ' class="set"' : ''}>${x || '?'}</i>`).join('') + '</span>' +
      '<button type="button" class="kp-linkbtn" id="sm-reset" title="Gängets tecken som de flesta tippade">Börja om</button>' +
      `<button type="button" class="kp-btn primary" id="sm-make">${existing(s) ? 'Ändra kupongen' : 'Gör kupongen'}</button>` +
      '<span class="sm-bar-msg" id="sm-msg" role="status"></span></div>';
    return html;
  }

  function boardRow(r, chosen, s) {
    const { x, m, g } = r;
    const comp = m ? compOf(m.comp) : null;
    const when = g.state === 'final' || g.state === 'live' ? `${esc(scoreText(g))}${g.state === 'live' ? ` · ${esc(g.clock || 'live')}` : ''}`
      : g.state === 'hidden' ? 'dolt' : g.state === 'off' ? esc(g.off) : esc(fWeekdayTime.format(new Date(x.avspark)));
    const label = m ? `${m.home} – ${m.away}` : x.match;
    return `<div class="sm-row" data-id="${esc(x.id)}">` +
      `<div class="sm-tm"><a class="sm-teams" href="#match/${esc(x.id)}">${teamsHtml(x, m)}</a>` +
      `<span class="sm-meta">${comp ? `<span class="ctag" title="${esc(comp.name)}">${esc(comp.short)}</span>` : ''}${when}</span>` +
      r.notes.map((o) => `<span class="sm-note">${chip(o.k)}<span>”${esc(o.text)}”</span></span>`).join('') + '</div>' +
      SIGNS.map((sg, i) => {
        const who = r.cov[i];
        const on = chosen.includes(sg);
        const cls = ['sm-cell', on ? 'on' : '', g.res === i ? 'res' : ''].filter(Boolean).join(' ');
        return `<button type="button" class="${cls}" data-s="${sg}" aria-pressed="${on}"${r.open ? '' : ' disabled'}` +
          ` aria-label="${esc(`${label}, ${sg}: ${who.length ? who.join(', ') : 'ingen'}${r.pr ? `, modellen ${r.pr[i]} %` : ''}`)}">` +
          `<span class="sm-s"><b>${sg}</b>${who.length ? `<small>${who.length}/${r.n}</small>` : ''}</span>` +
          `<span class="sm-chips">${who.map((k) => chip(k, r.t[k].length > 1)).join('')}</span>` +
          `<span class="sm-pc${r.fav === i ? ' fav' : ''}">${r.pr ? `${r.pr[i]} %` : '–'}</span></button>`;
      }).join('') + '</div>';
  }

  // Gängets kupong för omgångens matcher, om den redan finns och inte är
  // färdigspelad – då ändras den i stället för att en ny görs.
  function existing(s) {
    const ids = new Set(s.matcher.map((x) => x.id));
    return allCoupons().find((c) => c.matches.some((x) => ids.has(x.id)) && gradeCoupon(c).rows.some((r) => r.state === 'upcoming')) || null;
  }

  // Gängets tecken blir ett utkast i Ny kupong (eller Ändra), där kupongen
  // sparas som vanligt.
  function makeCoupon(s) {
    const rows = analyse(s);
    const val = decisions(s, rows);
    const now = Date.now();
    const open = rows.filter((r) => isOpen(r.m, now));
    const undecided = open.filter((r) => !val[r.x.id]).length;
    if (!open.length) {
      $('#sm-msg').innerHTML = '<span class="note">Alla matcher har startat.</span>';
      return;
    }
    if (undecided && !SM.again) {
      SM.again = true;
      $('#sm-msg').innerHTML = `<span class="note">${undecided === 1 ? 'En match saknar' : `${undecided} matcher saknar`} tecken och kommer inte med. Tryck igen för att fortsätta ändå.</span>`;
      return;
    }
    SM.again = false;
    const c = existing(s);
    const d = newDraft(c ? c.id : null);
    for (const r of open) {
      if (val[r.x.id]) d.picks[r.x.id] = val[r.x.id];
      else {
        delete d.picks[r.x.id];
        delete d.notes[r.x.id];
      }
    }
    kpStore(KP_DRAFT, d);
    KP.onlyPicked = true;
    location.hash = c ? `kupong/andra/${c.id}` : 'kupong/ny';
  }

  function wire(s) {
    for (const b of document.querySelectorAll('.sm-vem button')) {
      b.addEventListener('click', () => {
        kpStore(VEM, b.dataset.vem);
        renderRound();
      });
    }
    if (!s.visas) return;
    const board = document.querySelectorAll('.sm-board');
    for (const list of board) {
      list.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-s]');
        if (!b || b.disabled) return;
        const id = b.closest('[data-id]').dataset.id;
        const saved = kpLoad(DECIDE) || { id: s.id, val: {} };
        const cur = saved.val[id] || '';
        const next = SIGNS.filter((x) => (x === b.dataset.s ? !cur.includes(x) : cur.includes(x))).join('');
        if (next) saved.val[id] = next;
        else delete saved.val[id];
        kpStore(DECIDE, saved);
        SM.again = false;
        renderRound();
      });
    }
    $('#sm-reset').addEventListener('click', () => {
      kpStore(DECIDE, null);
      renderRound();
    });
    $('#sm-make').addEventListener('click', () => makeCoupon(s));
  }

  // ---------- dina tips ----------

  async function renderTips() {
    const s = SM.data;
    const el = $('#coupon');
    if (!s || s.visas) {
      location.hash = 'kupong/samtal';
      return;
    }
    const v = me();
    if (!v) {
      el.innerHTML = viewNav('samtal') + head(s, 'Dina tips') +
        `<div class="card sm-wait"><p class="sm-wait-txt">Vem är du? Tipsen sparas i ditt namn.</p>${whoAmI()}</div>`;
      for (const b of document.querySelectorAll('.sm-vem button')) {
        b.addEventListener('click', () => {
          kpStore(VEM, b.dataset.vem);
          renderTips();
        });
      }
      return;
    }
    // Utkastet på enheten, eller – om du lämnat in från en annan enhet – det
    // inlämnade (kräver kodordet).
    let d = kpLoad(TIPS);
    if (!d || d.id !== s.id || d.vem !== v) {
      d = { id: s.id, vem: v, tecken: {}, kommentarer: {} };
      const g = s.gang.find((x) => x.id === v);
      if (g && g.inne && kpLoad(KP_CODE)) {
        const out = await send({ gor: 'mina', id: s.id, vem: v });
        if (!here('tips')) return;
        if (out.ok && out.tips) d = { ...d, tecken: out.tips.tecken || {}, kommentarer: out.tips.kommentarer || {}, inne: out.tips.inne };
      }
      kpStore(TIPS, d);
    }
    SM.draft = d;
    const name = (gang().find((g) => g.id === v) || {}).namn || v;
    el.innerHTML = viewNav('samtal') + head(s, `Dina tips · ${name}`, '<a class="kp-btn" href="#kupong/samtal">Avbryt</a>') +
      '<p class="legend">Välj ett eller flera tecken i varje match – två är en halvgardering, alla tre en helgardering. ' +
      'Ingen ser dina tips förrän alla har lämnat in. En kort motivering hjälper samtalet.</p>' +
      '<div id="sm-tips-list"></div>' +
      `<div class="kp-bar"><span class="kp-bar-txt" id="sm-bar-txt"></span>${codeField()}` +
      `<button type="button" class="kp-btn primary" id="sm-send">${d.inne ? 'Lämna in igen' : 'Lämna in'}</button>` +
      '<span class="sm-bar-msg" id="sm-msg" role="status"></span></div>';
    const list = $('#sm-tips-list');
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-s]');
      if (!b) return;
      const id = b.closest('[data-id]').dataset.id;
      const cur = SM.draft.tecken[id] || '';
      const next = SIGNS.filter((x) => (x === b.dataset.s ? !cur.includes(x) : cur.includes(x))).join('');
      if (next) SM.draft.tecken[id] = next;
      else delete SM.draft.tecken[id];
      kpStore(TIPS, SM.draft);
      $('#sm-msg').innerHTML = '';
      tipsList();
    });
    // Motiveringen sparas medan man skriver; listan ritas inte om, så att
    // fältet behåller fokus.
    list.addEventListener('input', (e) => {
      const f = e.target.closest('input[data-note]');
      if (!f) return;
      const text = f.value.slice(0, NOTE_MAX);
      if (text.trim()) SM.draft.kommentarer[f.dataset.note] = text;
      else delete SM.draft.kommentarer[f.dataset.note];
      kpStore(TIPS, SM.draft);
    });
    $('#sm-send').addEventListener('click', submitTips);
    tipsList();
  }

  function tipsList() {
    const s = SM.data;
    const d = SM.draft;
    const days = new Map();
    for (const x of s.matcher) {
      const k = dayKey.format(new Date(x.avspark));
      if (!days.has(k)) days.set(k, []);
      days.get(k).push(x);
    }
    let html = '';
    for (const xs of days.values()) {
      html += `<div class="day"><div class="day-head">${esc(cap(fDay.format(new Date(xs[0].avspark))))}</div><div class="mlist">`;
      for (const x of xs) {
        const m = matchById(x.id);
        const sign = d.tecken[x.id] || '';
        const p = m && m.f ? m.f.p : null;
        const comp = m ? compOf(m.comp) : null;
        const label = m ? `${m.home} – ${m.away}` : x.match;
        html += `<div class="kp-pick${sign ? ' on' : ''}" data-id="${esc(x.id)}">` +
          `<span class="mtime">${esc(fTime.format(new Date(x.avspark)))}</span>` +
          `<span class="ctag"${comp ? ` title="${esc(comp.name)}"` : ''}>${comp ? esc(comp.short) : ''}</span>` +
          `<span class="mteams">${teamsHtml(x, m)}</span>` +
          '<span class="kp-tg">' + SIGNS.map((sg, i) =>
            `<button type="button" data-s="${sg}" aria-pressed="${sign.includes(sg)}" aria-label="${sg} för ${esc(label)}">` +
            `${sg}<small>${p ? `${p[i]} %` : '–'}</small></button>`).join('') + '</span>' +
          (sign ? `<input type="text" class="kp-note-in" data-note="${esc(x.id)}" maxlength="${NOTE_MAX}" autocomplete="off"` +
            ` placeholder="Motivering (valfritt)" aria-label="Motivering för ${esc(label)}" value="${esc(d.kommentarer[x.id] || '')}">` : '') +
          '</div>';
      }
      html += '</div></div>';
    }
    $('#sm-tips-list').innerHTML = html;
    const signs = s.matcher.map((x) => d.tecken[x.id]).filter(Boolean);
    const hel = signs.filter((x) => x.length === 3).length;
    const halv = signs.filter((x) => x.length === 2).length;
    $('#sm-bar-txt').innerHTML = `<b>${signs.length}</b> av ${s.matcher.length} matcher` +
      (hel ? ` · ${hel} helg.` : '') + (halv ? ` · ${halv} halvg.` : '') +
      (signs.length ? ` · <b>${rader(signs)}</b> ${rader(signs) === 1 ? 'rad' : 'rader'}` : '');
  }

  async function submitTips() {
    const s = SM.data;
    const d = SM.draft;
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    const left = s.matcher.filter((x) => !d.tecken[x.id]).length;
    if (left) {
      msg(`<span class="note">Tippa alla matcher – ${left === 1 ? 'en saknar' : `${left} saknar`} tecken.</span>`);
      return;
    }
    const btn = $('#sm-send');
    btn.disabled = true;
    msg('Lämnar in …');
    const out = await send({
      gor: 'tips',
      id: s.id,
      vem: d.vem,
      tecken: Object.fromEntries(s.matcher.map((x) => [x.id, d.tecken[x.id]])),
      kommentarer: Object.fromEntries(s.matcher.filter((x) => (d.kommentarer[x.id] || '').trim()).map((x) => [x.id, d.kommentarer[x.id].trim()])),
    });
    if (!here('tips')) return;
    btn.disabled = false;
    if (out.ok) {
      kpStore(TIPS, { ...d, inne: new Date().toISOString() });
      location.hash = 'kupong/samtal';
      return;
    }
    if (out.code) {
      renderTips().then(() => msg('<span class="note">Fel kodord.</span>'));
      return;
    }
    msg(`<span class="note">${esc(out.error)}</span>` + (out.status === 409 ? ' <a href="#kupong/samtal">Till omgången</a>' : ''));
  }

  // ---------- ny omgång och ändra matcherna ----------

  function renderStart(edit) {
    const s = SM.data;
    if (edit && (!s || s.visas)) {
      location.hash = 'kupong/samtal';
      return;
    }
    SM.pick = { ids: new Set(edit ? s.matcher.map((x) => x.id) : []) };
    SM.only = false;
    const comps = [{ id: 'all', short: 'Alla', name: 'Alla tävlingar' }, ...state.comps.values()];
    const min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    $('#coupon').innerHTML = viewNav('samtal') +
      '<div class="kp-head"><div><p class="kp-eyebrow">Inför samtalet</p>' +
      `<h2 class="page-title">${edit ? 'Ändra matcherna' : 'Ny omgång'}</h2></div>` +
      '<div class="kp-actions"><a class="kp-btn" href="#kupong/samtal">Avbryt</a></div></div>' +
      `<p class="legend">${edit ? 'Tips som redan lämnats in finns kvar för matcherna som är kvar. Den som lämnat in får tippa nya matcher när du sparat.'
        : 'Välj matcherna som ska vara med. Sedan tippar var och en för sig.'}</p>` +
      (edit ? '' : '<div class="sm-when"><label for="sm-tid">Samtalet</label>' +
        `<input type="datetime-local" id="sm-tid" class="kp-name" min="${min}">` +
        '<span class="legend">valfritt – då visas tipsen senast när ni ringer</span></div>') +
      '<div class="toolbar kp-tools">' +
      `<input type="search" id="sm-q" class="kp-search" placeholder="Sök lag" autocomplete="off" value="${esc(SM.q)}">` +
      '<div class="chips" id="sm-comps" role="group" aria-label="Tävling">' + comps.map((c) =>
        `<button type="button" data-comp="${c.id}" title="${esc(c.name)}" aria-pressed="${c.id === SM.comp}">${esc(c.short)}</button>`).join('') + '</div>' +
      `<button type="button" id="sm-only" class="kp-only" aria-pressed="${SM.only}">Bara valda</button></div>` +
      '<div id="sm-pick-list"></div>' +
      `<div class="kp-bar"><span class="kp-bar-txt" id="sm-bar-txt"></span>${codeField()}` +
      `<button type="button" class="kp-btn primary" id="sm-start">${edit ? 'Spara matcherna' : 'Starta omgången'}</button>` +
      '<span class="sm-bar-msg" id="sm-msg" role="status"></span></div>';

    $('#sm-q').addEventListener('input', (e) => { SM.q = e.target.value; pickList(); });
    for (const b of document.querySelectorAll('#sm-comps button')) {
      b.addEventListener('click', () => {
        SM.comp = b.dataset.comp;
        for (const x of document.querySelectorAll('#sm-comps button')) x.setAttribute('aria-pressed', String(x === b));
        pickList();
      });
    }
    $('#sm-only').addEventListener('click', (e) => {
      SM.only = !SM.only;
      e.currentTarget.setAttribute('aria-pressed', String(SM.only));
      pickList();
    });
    $('#sm-pick-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      const id = b.dataset.id;
      if (SM.pick.ids.has(id)) SM.pick.ids.delete(id);
      else SM.pick.ids.add(id);
      $('#sm-msg').innerHTML = '';
      pickList();
    });
    $('#sm-start').addEventListener('click', () => startRound(edit));
    pickList();
  }

  function pickList() {
    const q = fold(SM.q.trim());
    const ids = SM.pick.ids;
    const now = Date.now();
    // Valda matcher som hunnit starta faller bort.
    for (const id of [...ids]) if (!isOpen(matchById(id), now)) ids.delete(id);
    const list = pickable(now).filter((m) => {
      if (SM.only) return ids.has(m.id);
      if (SM.comp !== 'all' && m.comp !== SM.comp) return false;
      return !q || fold(`${m.home} ${m.away}`).includes(q);
    });
    const el = $('#sm-pick-list');
    if (!list.length) {
      el.innerHTML = `<p class="empty">${SM.only ? 'Inga valda matcher än.' : 'Inga matcher hittades.'}</p>`;
    } else {
      const days = new Map();
      for (const m of list) {
        const k = dayKey.format(new Date(m.kickoff));
        if (!days.has(k)) days.set(k, []);
        days.get(k).push(m);
      }
      let html = '';
      for (const ms of days.values()) {
        html += `<div class="day"><div class="day-head">${esc(cap(fDay.format(new Date(ms[0].kickoff))))}</div><div class="mlist">`;
        for (const m of ms) {
          const on = ids.has(m.id);
          html += `<button type="button" class="kp-pick sm-pick${on ? ' on' : ''}" data-id="${esc(m.id)}" aria-pressed="${on}">` +
            `<span class="mtime">${esc(fTime.format(new Date(m.kickoff)))}</span>` +
            `<span class="ctag" title="${esc(compOf(m.comp).name)}">${esc(compOf(m.comp).short)}</span>` +
            `<span class="mteams">${esc(m.home)}<span class="vs">–</span>${esc(m.away)}</span>` +
            `<span class="sm-tick" aria-hidden="true">${on ? '✓' : '+'}</span></button>`;
        }
        html += '</div></div>';
      }
      el.innerHTML = html;
    }
    const n = ids.size;
    $('#sm-bar-txt').innerHTML = n ? `<b>${n}</b> ${n === 1 ? 'match' : 'matcher'} valda` : 'Tryck på matcherna som ska vara med';
  }

  async function startRound(edit, ersatt = null) {
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    const ids = [...SM.pick.ids];
    if (!ids.length) {
      msg('<span class="note">Välj minst en match.</span>');
      return;
    }
    const tidIn = $('#sm-tid');
    const tid = tidIn && tidIn.value ? new Date(tidIn.value).toISOString() : null;
    const btn = $('#sm-start');
    btn.disabled = true;
    msg('Sparar …');
    const out = edit
      ? await send({ gor: 'matcher', id: SM.data.id, matcher: ids })
      : await send({ gor: 'starta', matcher: ids, tid, ersatt });
    if (!here(edit ? 'matcher' : 'ny')) return;
    btn.disabled = false;
    if (out.ok) {
      location.hash = 'kupong/samtal';
      return;
    }
    if (out.code) {
      const kod = $('#sm-kod');
      if (!kod) $('#sm-start').insertAdjacentHTML('beforebegin', codeField());
      msg('<span class="note">Fel kodord.</span>');
      $('#sm-kod').focus();
      return;
    }
    // Det finns redan en omgång som pågår: ersätt den bara om man vill.
    if (out.finns && out.samtal) {
      const o = out.samtal;
      const k = kicks(o);
      const inne = o.gang.filter((g) => g.inne).length;
      msg(`<span class="note">Det finns redan en omgång (${esc(dateRange(Math.min(...k), Math.max(...k)))})` +
        `${inne ? ` där ${inne} har lämnat in` : ''}.</span> <button type="button" class="kp-linkbtn" id="sm-replace">Ersätt den</button>`);
      $('#sm-replace').addEventListener('click', () => startRound(false, o.id));
      return;
    }
    msg(`<span class="note">${esc(out.error)}</span>`);
  }

  // ---------- förstasidan ----------

  // Rutan överst på förstasidan medan en omgång pågår.
  function teaser() {
    const s = SM.data;
    if (!info() || !s || over(s)) return '';
    const v = me();
    const inne = s.gang.filter((g) => g.inne).length;
    const mine = v && s.gang.some((g) => g.id === v && g.inne);
    const go = s.visas ? 'Öppna underlaget' : mine ? 'Ändra dina tips' : 'Fyll i dina tips';
    const href = s.visas || !v ? '#kupong/samtal' : '#kupong/samtal/tips';
    return '<div class="card sm-teaser">' +
      `<div><p class="kp-eyebrow">${esc(['Inför samtalet', callTime(s)].filter(Boolean).join(' · '))}</p>` +
      `<h2 class="page-title"><a href="#kupong/samtal">${s.visas ? 'Alla tips är inne' : `${inne} av ${s.gang.length} har lämnat in`}</a></h2></div>` +
      '<div class="sm-folk">' + s.gang.map((g) => `<span class="sm-person${g.inne ? ' inne' : ''}">${chip(g.id)}<span>${g.inne ? '✓' : '…'}</span></span>`).join('') + '</div>' +
      `<a class="kp-btn primary" href="${href}">${go}</a></div>`;
  }

  // Omgången hämtas en gång när sidan laddas, så att förstasidan kan visa den.
  (async function init() {
    await loadCoupons();
    if (!info()) return;
    await load();
    if (KP.view && KP.view.mode === 'home') redraw();
  })();

  window.Samtal = { show, teaser, redraw: () => { if (here('')) renderRound(); } };
})();
