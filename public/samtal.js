'use strict';

// Omgångens kupong inför uppgörelsen (Kupong → Omgången, steg 1–3): någon skapar kupongen
// – väljer matcherna – och var och en fyller i den för sig, ett tecken eller
// en gardering per match. Kupongen står på papper med en kolumn per person,
// och man fyller i sin kolumn direkt. Den som har lämnat in ser de andras
// inlämnade tips och kan ändra sina tills matcherna startar; den som inte har
// lämnat in ser de andras kolumner täckta. När alla har lämnat in (senast när
// första matchen startar) ser alla allt. Sidan blir underlaget för
// uppgörelsen i telefon: matcherna sorteras
// efter hur oeniga vi är, och gängets kupong växer fram när man trycker på
// rutorna. Den sparas direkt därifrån (postCoupon i
// kupong.js, samma som Ny kupong → Spara) – eller öppnas i Ny
// kupong med tecknen ifyllda, för namn, anteckningar eller fler matcher.
//
//   #kupong                  omgången medan den fylls i och tills gängets kupong är gjord
//   #kupong/samtal           samma vy, också efteråt (Allas tips)
//   #kupong/samtal/tips      ändra kupongen du har lämnat in
//   #kupong/samtal/ny        skapa omgångens kupong: välj matcherna
//   #kupong/samtal/matcher   ändra matcherna, tills någon har lämnat in
//
// Ta bort (tills allas tips visas) frågar i en ruta ovanpå omgången.
//
// Omgången får ett namn av AI:n när matcherna är valda (worker/namn.mjs, i
// samma proxy som matchanalysen) – samma för alla, och det följer med när
// gängets kupong sparas. Tills namnet finns heter den "Omgångens kupong".
//
// Omgången och tipsen ligger i tjänsten profeterna-kupong (worker/samtal.mjs,
// GET/POST …/samtal; lokalt /api/samtal), som håller tipsen dolda. Den som
// lämnar in får en nyckel som sparas på enheten och visar de andras tips. Vem
// man är och gängets tecken under uppgörelsen sparas också bara på enheten.
//
// Läses efter app.js och kupong.js och använder deras hjälpare (KP, SIGNS,
// matchById, isOpen, pickable, gradeRow, roundSteps …). kupong.js ritar vyerna
// med Samtal.show(sub) och förstasidans ruta med Samtal.teaser().

(function () {
  const SM = {
    data: undefined, // omgången som tjänsten visar den; null = ingen, undefined = inte hämtad
    error: null,
    timer: null,
    pick: null, // skapa kupongen / ändra matcherna: {ids: Set}
    q: '',
    comp: 'all',
    allDays: false, // välj matcher: alla dagar, inte bara närmaste omgången
    draft: null, // dina tips: {id, vem, tecken, kommentarer, inne, nyckel}
    noteRow: null, // matchen du senast tippade: där står fältet för motiveringen
    edit: false, // draft är en ändring av dina inlämnade tips
    again: false, // Spara gängets kupong trots matcher utan tecken
    names: new Map(), // omgång och matcher → {namn, syftar} | null (inget namn) | 'loading'
  };
  const VEM = 'profeterna.samtal.vem';
  const TIPS = 'profeterna.samtal.tips';
  const DECIDE = 'profeterna.samtal.beslut';
  const NAMN = 'profeterna.samtal.namn';
  const POLL_MS = 20000;

  const info = () => (KP.data && KP.data.samtal) || null;
  const gang = () => (info() ? info().gang : []);
  const me = () => {
    const v = kpLoad(VEM);
    return gang().some((g) => g.id === v) ? v : null;
  };
  const here = (sub) => Boolean(KP.view && KP.view.mode === 'samtal' && KP.view.sub === sub && !$('#coupon-section').hidden);
  // Var och en med sitt porträtt (bild i config/kupong.js) i en ring i sin
  // färg – alla heter D-något, så initialerna skiljer dåligt. Initialerna om
  // bilden saknas; streckad ring = del av en gardering.
  const pnum = (id) => Math.max(0, gang().findIndex((g) => g.id === id));
  const person = (id) => gang().find((g) => g.id === id) || { id, namn: id };
  const photo = (id) => {
    const g = person(id);
    return g.bild ? `<img src="${esc(g.bild)}" alt="${esc(g.id)}" width="40" height="40" decoding="async" draggable="false">` : esc(g.id);
  };
  const chip = (id, hedge = false) => {
    const g = person(id);
    return `<span class="sm-ch sm-p${pnum(id)}${g.bild ? ' bild' : ''}${hedge ? ' g' : ''}" title="${esc(`${g.namn}${hedge ? ' · del av en gardering' : ''}`)}">${photo(id)}</span>`;
  };
  const rader = (signs) => signs.reduce((a, s) => a * Math.max(1, s.length), 1);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const kicks = (s) => s.matcher.map((x) => Date.parse(x.avspark)).filter(Number.isFinite);
  const over = (s) => Date.now() >= Math.max(...kicks(s));
  const teamsHtml = (x, m) => (m ? `${esc(m.home)}<span class="vs">–</span>${esc(m.away)}` : esc(x.match));
  // Dina inlämnade tips för omgången på den här enheten, med nyckeln som
  // visar de andras.
  const handedIn = (s) => {
    const d = kpLoad(TIPS);
    return s && d && d.id === s.id && d.vem && d.nyckel ? d : null;
  };
  const submitted = (s, v) => Boolean(s && v && s.gang.some((g) => g.id === v && g.inne));
  // Dina inlämnade tips går att ändra här (med nyckeln på enheten) tills
  // matcherna startar.
  const canEdit = (s) => {
    const d = handedIn(s);
    return Boolean(d && d.vem === me() && submitted(s, d.vem) && !over(s));
  };
  const started = (x, now = Date.now()) => !(Date.parse(x.avspark) > now);

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
      return;
    }
    // Har du lämnat in här ser du de andras inlämnade tips.
    const d = handedIn(SM.data);
    if (SM.data && !SM.data.visas && d) {
      await send({ gor: 'se', id: SM.data.id, vem: d.vem, nyckel: d.nyckel });
    }
  }

  async function send(body) {
    let res = null;
    let out = {};
    try {
      res = await fetch(info().endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      out = await res.json().catch(() => ({}));
    } catch { /* ingen kontakt */ }
    if (res && res.ok && out.ok) {
      if ('samtal' in out) SM.data = out.samtal;
      return out;
    }
    // 409: omgången har bytts, du har redan lämnat in eller tipsen visas
    // redan – sidan visar läget.
    if (res && res.status === 409 && 'samtal' in out) SM.data = out.samtal;
    return { ...out, ok: false, status: res && res.status, error: out.error || 'Ingen kontakt med servern.' };
  }

  // ---------- omgångens namn ----------

  // Namnet hämtas en gång per omgång och matcher (ändras matcherna får
  // omgången ett nytt) och sparas på enheten. Första gången skriver AI:n det,
  // vilket kan ta en minut – då står "Omgångens kupong" kvar så länge.
  const nameKey = (s) => `${s.id}:${s.matcher.map((x) => x.id).sort().join(',')}`;
  function named(s) {
    const url = info() && info().namn;
    if (!s || !url) return null;
    const k = nameKey(s);
    if (!SM.names.has(k)) {
      const saved = kpLoad(NAMN);
      if (saved && saved.key === k && saved.namn) SM.names.set(k, saved);
      else {
        SM.names.set(k, 'loading');
        fetchName(url, s.id, k);
      }
    }
    const n = SM.names.get(k);
    return n && n !== 'loading' ? n : null;
  }

  async function fetchName(url, id, k) {
    let n = null;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok && j.namn) n = { key: k, namn: j.namn, syftar: j.syftar || null };
    } catch { /* inget namn den här gången */ }
    SM.names.set(k, n);
    if (!n) return;
    kpStore(NAMN, n);
    if (!SM.data || nameKey(SM.data) !== k) return;
    // Byt bara rubriken, så att inget annat på sidan ritas om.
    for (const el of document.querySelectorAll(`[data-sm-namn="${CSS.escape(k)}"]`)) el.outerHTML = nameBlock(SM.data, el.dataset.smDel, 'fram');
  }

  const nameOf = (s) => { const n = named(s); return n ? n.namn : null; };

  // Namnet med vad det syftar på när man pekar på det. kind: 'ruta' =
  // förstasidans ruta (tiden kvar ovanför, namnet som rubrik), 'sida' =
  // omgångens sida (datumen ovanför, namnet som rubrik), 'rad' = bara raden
  // ovanför rubriken. Tills namnet finns står "Omgångens kupong" där.
  function nameBlock(s, kind, cls = '') {
    const n = named(s);
    const key = info() && info().namn ? ` data-sm-namn="${esc(nameKey(s))}" data-sm-del="${kind}"` : '';
    const hint = n && n.syftar ? ` title="${esc(n.syftar)}"` : '';
    const name = n ? esc(n.namn) : 'Omgångens kupong';
    const nameCls = n ? ` sm-namn ${cls}` : '';
    if (kind === 'ruta') {
      return `<div${key}>${countdown(s)}<h2 class="page-title${nameCls}"><a href="#kupong"${hint}>${name}</a></h2></div>`;
    }
    if (kind === 'sida') {
      const k = kicks(s);
      const range = esc(dateRange(Math.min(...k), Math.max(...k)));
      return n
        ? `<div${key}><p class="kp-eyebrow">${range}</p><h2 class="page-title${nameCls}"${hint}>${name}</h2></div>`
        : `<div${key}><p class="kp-eyebrow">Omgångens kupong</p><h2 class="page-title">${range}</h2></div>`;
    }
    return `<p class="kp-eyebrow${nameCls}"${key}${hint}>${name}</p>`;
  }

  // Tiden kvar att lämna in (till första avsparken; klockslaget när man
  // pekar), eller att det är dags för uppgörelsen.
  function countdown(s) {
    const stop = Math.min(...kicks(s));
    const ms = stop - Date.now();
    if (s.visas || ms <= 0) return '<p class="kp-eyebrow">Dags för uppgörelsen</p>';
    return `<p class="kp-eyebrow sm-kvar${ms < HOUR ? ' snart' : ''}" title="${esc(`Senast ${fWeekdayTime.format(new Date(stop))}`)}"><span data-kvar="${stop}">${left(ms)}</span> kvar</p>`;
  }


  // Frågar tjänsten var 20:e sekund och ritar om när omgången ändrats, t.ex.
  // när någon lämnat in – under Omgången, och på förstasidan medan tipsen
  // lämnas in. Slutar när man lämnar sidorna.
  const onHome = () => Boolean(KP.view && KP.view.mode === 'home' && !$('#home-section').hidden);
  function poll() {
    if (SM.timer) return;
    SM.timer = setInterval(async () => {
      if (!here('') && !onHome()) {
        clearInterval(SM.timer);
        SM.timer = null;
        return;
      }
      if (document.hidden || (!here('') && !(SM.data && !SM.data.visas))) return;
      const before = JSON.stringify(SM.data);
      await load();
      if (JSON.stringify(SM.data) === before) return;
      if (here('')) renderRound();
      else if (onHome()) redraw();
    }, POLL_MS);
  }

  // loaded: omgången har just hämtats (kupong.js, under Omgången).
  async function show(sub, loaded = false) {
    KP.view = { mode: 'samtal', sub };
    SM.noteRow = null;
    const el = $('#coupon');
    if (!info()) {
      el.innerHTML = viewNav('omgang') + '<p class="empty">Att tippa var för sig är inte påslaget på den här sajten.</p>';
      return;
    }
    if (SM.data === undefined) el.innerHTML = viewNav('omgang') + '<p class="empty">Laddar …</p>';
    if (!loaded) await load();
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

  // eyebrow: texten ovanför rubriken, annars omgångens namn.
  // label: texten ovanför rubriken – utan den omgångens namn som rubrik.
  function head(s, label, actions = '') {
    const k = s ? kicks(s) : [];
    return '<div class="kp-head">' + (s && !label ? nameBlock(s, 'sida') : '<div>' +
      `<p class="kp-eyebrow">${esc(label || 'Omgångens kupong')}</p>` +
      `<h2 class="page-title">${s ? esc(dateRange(Math.min(...k), Math.max(...k))) : 'Omgångens kupong'}</h2></div>`) +
      `<div class="kp-actions">${actions}</div></div>`;
  }

  // Var omgången står, i stegen under flikarna (roundSteps i kupong.js): 2
  // medan alla tippar, 3 när allas tips visas och 4 när gängets kupong är
  // gjord eller alla matcher har startat.
  function steps(s) {
    const now = (s.visas && existing(s)) || over(s) ? 4 : s.visas ? 3 : 2;
    const inne = s.gang.filter((g) => g.inne).length;
    return roundSteps(now, { 2: now === 2 ? `${inne} av ${s.gang.length} har lämnat in` : '' });
  }

  function renderRound() {
    const el = $('#coupon');
    const s = SM.data;
    let html = viewNav('omgang');
    if (s === undefined || (SM.error && !s)) {
      el.innerHTML = html + `<p class="empty">Kunde inte läsa omgången (${esc(SM.error || 'okänt fel')}).</p>`;
      return;
    }
    if (!s) {
      el.innerHTML = html + roundSteps(1) + emptyCard();
      return;
    }
    const anyIn = s.gang.some((g) => g.inne);
    // Allas tips så snart du ser fler än dina egna, annars kupongen.
    const all = Boolean(s.tips && Object.keys(s.tips).length >= (s.visas ? 1 : 2));
    const actions = (s.visas || anyIn ? '' : '<a class="kp-btn" href="#kupong/samtal/matcher">Ändra matcherna</a>') +
      (all && canEdit(s) ? '<a class="kp-btn" href="#kupong/samtal/tips">Ändra din kupong</a>' : '') +
      (s.visas ? '' : '<button type="button" class="kp-btn" data-sm-remove>Ta bort</button>') +
      (s.visas && existing(s) ? '<a class="kp-btn" href="#kupong">Gängets kupong</a>' : '') +
      (s.visas || over(s) ? '<a class="kp-btn" href="#kupong/samtal/ny">+ Ny kupong</a>' : '');
    html += steps(s) + head(s, null, actions);
    html += all ? board(s) : sheet(s, false);
    // Gängets kuponger som spelas under tiden, t.ex. veckans matcher.
    html += openCoupons();
    keepFocus(() => {
      el.innerHTML = html;
      const bort = el.querySelector('[data-sm-remove]');
      if (bort) bort.addEventListener('click', confirmRemove);
      if (all) wire(s);
      else wireSheet();
    });
  }

  // Bock = tipsen är inne, tre prickar = fyller i.
  const CHECK = '<svg class="sm-ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  const DOTS = '<span class="sm-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
  const mark = (s, g) => (g.inne ? CHECK : s.visas ? '' : DOTS);
  const lage = (s, g) => (g.inne ? 'inne' : s.visas ? 'lämnade inte in' : 'fyller i');

  // Ritar om utan att tappa var man var: fältet eller rutan som hade fokus
  // får det igen.
  function keepFocus(draw) {
    const a = document.activeElement;
    const row = a && a.closest && a.closest('#coupon [data-id]');
    const sel = !row ? null
      : a.matches('input[data-note]') ? `input[data-note="${CSS.escape(a.dataset.note)}"]`
        : a.matches('button[data-s]') ? `[data-id="${CSS.escape(row.dataset.id)}"] button[data-s="${a.dataset.s}"]` : null;
    const caret = sel && a.matches('input') ? a.selectionStart : null;
    draw();
    const b = sel && document.querySelector(`#coupon ${sel}`);
    if (!b) return;
    b.focus({ preventScroll: true });
    if (caret != null) b.setSelectionRange(caret, caret);
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
      // alla tippat olika får uppgörelsen avgöra.
      const proposal = kind === 0 ? '' : SIGNS.filter((sg, i) => cov[i].length * 2 > n).join('');
      const notes = who.map((k) => ({ k, text: (s.tips[k].kommentarer || {})[x.id] })).filter((o) => o.text);
      const g = gradeRow({ id: x.id, sign: '1X2' }, now);
      return { x, m, t, n, cov, pr, fav, kind, proposal, notes, g, open: isOpen(m, now) };
    });
  }

  const GROUPS = [
    ['Alla olika', 'Kanske en gardering?'],
    [null, 'Den som avviker förklarar.'],
    ['Samma grund, olika säkerhet', 'Räcker det, eller ska vi gardera?'],
    ['Eniga mot modellen', 'Stämmer det verkligen?'],
    ['Eniga', 'Klubbas utan snack.'],
    ['Saknar tips', ''],
  ];
  const groupName = (k, s) => GROUPS[k][0] || (s.gang.length === 3 ? 'Två mot en' : 'Delade meningar');

  // Gängets tecken under uppgörelsen, på enheten. Tills man själv har tryckt på
  // rutorna (own) följer de gängets kupong, om den redan är sparad (t.ex. på
  // en annan enhet), annars förslaget – som följer med när någon lämnar in
  // eller ändrar sina tips.
  const proposal = (rows) => Object.fromEntries(rows.filter((r) => r.proposal).map((r) => [r.x.id, r.proposal]));
  function decisions(s, rows) {
    const saved = kpLoad(DECIDE);
    if (saved && saved.id === s.id && saved.val && saved.own) return saved.val;
    const c = existing(s);
    return c
      ? Object.fromEntries(c.matches.filter((x) => rows.some((r) => r.x.id === x.id)).map((x) => [x.id, x.sign]))
      : proposal(rows);
  }

  function board(s) {
    const rows = analyse(s);
    // Gängets kupong går att göra så fort du ser de andras tips.
    const val = decisions(s, rows);
    const ordered = [0, 1, 2, 3, 4, 5].flatMap((k) => rows.filter((r) => r.kind === k));
    const missing = s.gang.filter((g) => !(s.tips && s.tips[g.id]));
    let html = '<div class="sm-folk sm-folk-board">' + s.gang.map((g) => {
      const tip = s.tips && s.tips[g.id];
      if (!tip) return `<span class="sm-person ute" title="${esc(`${g.namn} · ${lage(s, g)}`)}">${chip(g.id)}${mark(s, g)}</span>`;
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
    const names = esc(missing.map((g) => g.id).join(' och '));
    if (missing.length && s.visas) {
      html += `<p class="legend"><span class="note">${names} hann inte lämna in` +
        `${s.orsak === 'avspark' ? ' innan första matchen startade' : ''}.</span></p>`;
    }
    for (let k = 0; k <= 5; k++) {
      const list = rows.filter((r) => r.kind === k);
      if (!list.length) continue;
      html += `<div class="sm-group"><h3>${esc(groupName(k, s))} <span class="sm-count">${list.length}</span></h3>${GROUPS[k][1] ? `<span>${esc(GROUPS[k][1])}</span>` : ''}</div>`;
      html += '<div class="mlist sm-board">' + list.map((r) => boardRow(r, val[r.x.id] || '')).join('') + '</div>';
    }
    // Gängets kupong: rutorna i samma ordning som matcherna ovan.
    const chosen = ordered.map((r) => val[r.x.id] || '');
    const done = chosen.filter(Boolean);
    const gard = done.filter((x) => x.length > 1).length;
    // Med tjänsten sparas gängets kupong direkt härifrån; Justera först
    // öppnar den i Ny kupong (eller Ändra) med tecknen ifyllda.
    const direct = Boolean(KP.data && KP.data.save);
    const made = existing(s);
    const same = made && savedAsIs(made, rows, val);
    const label = direct ? (same ? 'Sparad' : made ? 'Spara ändringen' : 'Spara gängets kupong')
      : made ? 'Ändra gängets kupong' : 'Gör gängets kupong';
    // I telefonen står de mindre valen bakom ⋯, så att raden tar lite plats.
    html += `<div class="kp-bar sm-bar${barMore ? ' more' : ''}">` +
      `<span class="kp-bar-txt"><b>Gängets kupong</b> · ${done.length} av ${rows.length} klara` +
      `${gard ? ` · ${plural(gard, 'gardering', 'garderingar')}` : ''} · <b>${rader(done)}</b> ${rader(done) === 1 ? 'rad' : 'rader'}` +
      `${same ? ' · <a href="#kupong">sparad</a>' : ''}</span>` +
      '<span class="sm-slots" aria-hidden="true">' + chosen.map((x) => `<i${x ? ' class="set"' : ''}>${x || '?'}</i>`).join('') + '</span>' +
      `<button type="button" class="sm-more" id="sm-more" aria-expanded="${barMore}" aria-controls="sm-bar-more" aria-label="Fler val">` +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7"/><circle cx="10" cy="10" r="1.7"/><circle cx="15.5" cy="10" r="1.7"/></svg></button>' +
      '<span class="sm-bar-more" id="sm-bar-more">' +
      '<button type="button" class="kp-linkbtn" id="sm-reset" title="Gängets tecken som de flesta tippade">Börja om</button>' +
      (direct ? '<button type="button" class="kp-linkbtn" id="sm-adjust" title="Öppna kupongen med tecknen ifyllda – för namn, anteckningar eller fler matcher">Justera först</button>' : '') +
      // Systemet ni spelade, som skärmbild: tecknen därifrån (systembild.js).
      (window.Systembild ? Systembild.button('kp-linkbtn') : '') + '</span>' +
      `<button type="button" class="kp-btn primary" id="sm-make"${same && direct ? ' disabled' : ''}>${label}</button>` +
      '<span class="sm-bar-msg" id="sm-msg" role="status"></span></div>';
    return html;
  }
  // ⋯ i raden längst ner är öppnad – står kvar när underlaget ritas om.
  let barMore = false;

  // Gängets kupong har redan tecknen som är valda här, i varje match som
  // inte har startat.
  function savedAsIs(c, rows, val) {
    const now = Date.now();
    const on = new Map(c.matches.map((x) => [x.id, x.sign]));
    return rows.filter((r) => isOpen(r.m, now)).every((r) => (val[r.x.id] || '') === (on.get(r.x.id) || ''));
  }

  function boardRow(r, chosen) {
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
        // Gängets tecken väljs bara i matcher som inte har startat.
        return `<button type="button" class="${cls}" data-s="${sg}" aria-pressed="${on}"${r.open ? '' : ' disabled'}` +
          ` aria-label="${esc(`${label}, ${sg}: ${who.length ? who.join(', ') : 'ingen'}${r.pr ? `, modellens odds ${pctOdds(r.pr[i])}` : ''}`)}">` +
          `<span class="sm-s"><b>${sg}</b>${who.length ? `<small>${who.length}/${r.n}</small>` : ''}</span>` +
          `<span class="sm-chips">${who.map((k) => chip(k, r.t[k].length > 1)).join('')}</span>` +
          `<span class="sm-pc${r.fav === i ? ' fav' : ''}" title="Modellens odds">${r.pr ? pctOdds(r.pr[i]) : '–'}</span></button>`;
      }).join('') + '</div>';
  }

  // Gängets kupong för omgångens matcher – den som har flest av dem – om den
  // finns, också när alla dess matcher har startat (då är omgångens kupong
  // gjord, och underlaget ska inte be om den igen). Sparas gängets kupong på
  // nytt ändras den i stället för att en till görs.
  function existing(s) {
    const ids = new Set(s.matcher.map((x) => x.id));
    let best = null;
    let most = 0;
    for (const c of allCoupons()) {
      const n = c.matches.filter((x) => ids.has(x.id)).length;
      if (n > most) {
        best = c;
        most = n;
      }
    }
    return best;
  }

  // Gängets tecken som utkast till gängets kupong: en ändring av den om den
  // finns (startade matcher står kvar som de är), annars en ny. Matcher som
  // inte startat och saknar tecken kommer inte med.
  function gangDraft(s) {
    const rows = analyse(s);
    const val = decisions(s, rows);
    const now = Date.now();
    const open = rows.filter((r) => isOpen(r.m, now));
    const c = existing(s);
    const d = newDraft(c ? c.id : null);
    // Gängets kupong får omgångens namn, om den inte redan har ett.
    if (!d.name) d.name = nameOf(s) || '';
    for (const r of open) {
      if (val[r.x.id]) d.picks[r.x.id] = val[r.x.id];
      else {
        delete d.picks[r.x.id];
        delete d.notes[r.x.id];
      }
    }
    return { d, c, open, undecided: open.filter((r) => !val[r.x.id]).length };
  }

  const SAVED = 'Gängets kupong är sparad · syns för alla om några minuter.';
  // Efter sparat visar Omgången gängets kupong.
  function toCoupon() {
    KP.flash = SAVED;
    if (location.hash === '#kupong') showCoupon('');
    else location.hash = 'kupong';
  }

  // Spara gängets kupong. Med tjänsten direkt härifrån. Utan tjänsten – eller med
  // Justera först (adjust) – öppnas Ny kupong (eller Ändra) med tecknen
  // ifyllda, och kupongen sparas där.
  async function makeCoupon(s, { adjust = false } = {}) {
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    const { d, c, open, undecided } = gangDraft(s);
    if (!open.length) {
      msg('<span class="note">Alla matcher har startat.</span>');
      return;
    }
    const ctx = couponCtx(d);
    if (!ctx) {
      msg('<span class="note">Tryck på rutorna för gängets tecken först.</span>');
      return;
    }
    if (!adjust && undecided && !SM.again) {
      SM.again = true;
      msg(`<span class="note">${undecided === 1 ? 'En match saknar' : `${undecided} matcher saknar`} tecken och kommer inte med. Tryck igen för att spara ändå.</span>`);
      return;
    }
    SM.again = false;
    if (adjust || !(KP.data && KP.data.save)) {
      kpStore(KP_DRAFT, d);
      KP.onlyPicked = true;
      location.hash = c ? `kupong/andra/${c.id}` : 'kupong/ny';
      return;
    }
    const btn = $('#sm-make');
    btn.disabled = true;
    msg('Sparar …');
    const r = await postCoupon(ctx);
    if (!here('')) return;
    btn.disabled = false;
    if (r.ok) {
      toCoupon();
      return;
    }
    // Någon annan hann före. Är det gängets kupong för omgången (någon annan
    // sparade eller ändrade den samtidigt) går det att spara de här tecknen
    // över den – annars som en kupong till för samma dag.
    if (r.changed || r.taken) {
      const ours = covers(r.other);
      msg(`<span class="note">${esc(ours ? 'Någon annan har just sparat gängets kupong.' : r.error)}</span> ` +
        `<a href="#kupong/${esc(r.other.id)}">Visa den</a> · ` +
        `<button type="button" class="kp-linkbtn" id="sm-over">${ours ? 'Spara våra tecken över den' : 'Spara ändå, som en kupong till'}</button>`);
      $('#sm-over').addEventListener('click', async () => {
        if (ours) {
          SM.again = true; // frågan om matcher utan tecken är redan besvarad
          makeCoupon(s);
          return;
        }
        msg('Sparar …');
        const again = await postCoupon({ ...ctx, anyway: true });
        if (!here('')) return;
        if (again.ok) toCoupon();
        else msg(`<span class="note">${esc(again.error)}</span>`);
      });
      return;
    }
    if (!r.offline) {
      msg(`<span class="note">${esc(r.error)}</span>`);
      return;
    }
    // Tjänsten kan inte spara just nu: Ny kupong har GitHub-vägen.
    msg(`<span class="note">${esc(r.error)}</span> <button type="button" class="kp-linkbtn" id="sm-via">Spara via Ny kupong i stället</button>`);
    $('#sm-via').addEventListener('click', () => makeCoupon(s, { adjust: true }));
  }

  function wire(s) {
    if (!$('#sm-make')) return;
    const board = document.querySelectorAll('.sm-board');
    for (const list of board) {
      list.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-s]');
        if (!b || b.disabled) return;
        const id = b.closest('[data-id]').dataset.id;
        const saved = { id: s.id, val: { ...decisions(s, analyse(s)) }, own: true };
        const cur = saved.val[id] || '';
        const next = SIGNS.filter((x) => (x === b.dataset.s ? !cur.includes(x) : cur.includes(x))).join('');
        if (next) saved.val[id] = next;
        else delete saved.val[id];
        kpStore(DECIDE, saved);
        SM.again = false;
        renderRound();
      });
    }
    // Börja om: tecknen som fler än hälften har med.
    $('#sm-reset').addEventListener('click', () => {
      kpStore(DECIDE, { id: s.id, val: proposal(analyse(s)), own: true });
      SM.again = false;
      renderRound();
    });
    $('#sm-make').addEventListener('click', () => makeCoupon(s));
    $('#sm-more').addEventListener('click', (e) => {
      barMore = !barMore;
      e.currentTarget.setAttribute('aria-expanded', String(barMore));
      e.currentTarget.closest('.sm-bar').classList.toggle('more', barMore);
    });
    const adjust = $('#sm-adjust');
    if (adjust) adjust.addEventListener('click', () => makeCoupon(s, { adjust: true }));
  }

  // ---------- kupongen ----------

  // Omgångens kupong på papper: en ruta per tecken i varje match, och var och
  // en står med sitt porträtt i rutorna hen har valt – så syns direkt vem som
  // tippat vad och var ni är eniga. Dina rutor trycker du på direkt; de
  // andras porträtt syns först när du själv har lämnat in. Överst porträtten
  // med bock eller tre prickar, ditt inringat. Har du inte valt vem du är
  // trycker du på ditt porträtt.
  //   edit: du ändrar dina inlämnade tips (#kupong/samtal/tips)
  function sheet(s, edit) {
    const v = me();
    const fill = Boolean(v && (edit || (!submitted(s, v) && !s.visas)));
    SM.edit = edit;
    SM.draft = fill ? draftFor(s, v, edit) : null;
    const stop = Math.min(...kicks(s));
    return '<div class="pp-wrap sm-wrap"><div class="pp pp-fill sm-sheet" id="sm-sheet">' +
      '<div class="sm-sheet-head"><p class="pp-brand"><img src="logo.svg" alt="" width="20" height="20">Matchfixarna<span>Kupong</span></p>' +
      `<div class="pp-stop"><span>Spelstopp</span><b>${esc(fWeekdayTime.format(new Date(stop)))}</b></div></div>` +
      '<div class="pp-band" aria-hidden="true"></div>' +
      '<div id="sm-rows"></div>' +
      '<div class="pb-foot sm-foot"><div class="pp-fields pb-fields" id="sm-fields"></div><span id="sm-go"></span>' +
      '<p class="pb-msg" id="sm-msg" role="status"></p></div></div></div>';
  }

  // Ditt utkast sparas på enheten medan du fyller i. En ändring utgår från
  // dina inlämnade tips och sparas först när du lämnar in den.
  function draftFor(s, v, edit) {
    let d = kpLoad(TIPS);
    if (edit) {
      const t = (s.tips && s.tips[v]) || d;
      return { ...d, tecken: { ...t.tecken }, kommentarer: { ...(t.kommentarer || {}) } };
    }
    if (!d || d.id !== s.id || d.vem !== v || d.nyckel) {
      d = { id: s.id, vem: v, tecken: {}, kommentarer: {} };
      kpStore(TIPS, d);
    }
    return d;
  }

  // Vad som syns av en persons tips: fill = ditt utkast, shown = tips du får
  // se, own = dina inlämnade på den här enheten, hidden = inne men dolt,
  // blank = inget ännu.
  function column(s, g, v) {
    if (g.id === v && SM.draft) return { st: 'fill', t: SM.draft.tecken };
    const tips = s.tips && s.tips[g.id];
    if (tips) return { st: 'shown', t: tips.tecken };
    const local = g.id === v ? handedIn(s) : null;
    if (local && local.vem === v) return { st: 'own', t: local.tecken };
    return { st: g.inne ? 'hidden' : 'blank', t: {} };
  }

  // Porträttet på papperet, i en ring i personens bläck.
  const face = (id, tip = true) =>
    `<span class="sm-fc sm-k${pnum(id)}"${tip ? ` title="${esc(person(id).namn)}"` : ''}>${photo(id)}</span>`;
  // Rutan för ett tecken med porträtten för dem som har valt det. Var och en
  // har sin plats i rutan, i samma ordning som överst, så att tecknet och
  // porträtten står på samma ställe i varje rad.
  const box = (sg, who, ids) => `<span class="pp-box sm-bx${who.length ? ' on' : ''}"><i>${sg}</i><span class="sm-seats">` +
    ids.map((id) => (who.includes(id) ? face(id) : '<span class="sm-seat"></span>')).join('') + '</span></span>';

  function sheetList() {
    const s = SM.data;
    const v = me();
    const d = SM.draft;
    const now = Date.now();
    const cols = s.gang.map((g) => ({ g, ...column(s, g, v) }));
    // En plats i rutorna för var och en vars tips syns på papperet.
    const ids = cols.filter((c) => c.st !== 'hidden' && c.st !== 'blank').map((c) => c.g.id);
    // Vem du är går att välja tills du har lämnat in.
    const choose = !submitted(s, v);
    let html = '<div class="sm-r sm-hd"><span class="sm-hd-nr" aria-hidden="true">Nr</span>' +
      `<span class="sm-m">${v ? '<span class="sm-hd-l" aria-hidden="true">Match</span>' : '<span class="sm-q">Vem är du?</span>'}` +
      '<span class="sm-folk-pp">' + cols.map(({ g }) => {
        const du = g.id === v;
        const tag = choose ? 'button' : 'span';
        return `<${tag}${choose ? ` type="button" aria-pressed="${du}"` : ''} class="sm-who sm-k${pnum(g.id)}${du ? ' du' : ''}" data-vem="${esc(g.id)}" ` +
          `title="${esc(`${g.namn} · ${du ? 'du · ' : ''}${lage(s, g)}`)}"><span class="sm-fw">${face(g.id, false)}` +
          `${du ? Papper.ring(`du${s.id}${g.id}`, 'sm-du-ring', 25) : ''}</span>${mark(s, g)}</${tag}>`;
      }).join('') + '</span></span>' +
      // 1 X 2 som en tom ruta utan kant, så att tecknen står rakt över rutornas.
      SIGNS.map((sg) => `<span class="sm-hd-s" aria-hidden="true">${box(sg, [], ids)}</span>`).join('') + '</div>';
    let day = null;
    s.matcher.forEach((x, i) => {
      const k = dayKey.format(new Date(x.avspark));
      if (k !== day) {
        day = k;
        html += `<p class="pp-day">${esc(cap(fDay.format(new Date(x.avspark))))}</p>`;
      }
      const m = matchById(x.id);
      const comp = m ? compOf(m.comp) : null;
      const label = m ? `${m.home} – ${m.away}` : x.match;
      const p = m && m.f ? m.f.p : null;
      // När du ändrar står matcher som har startat kvar som de var.
      const locked = SM.edit && started(x, now);
      const sign = d ? d.tecken[x.id] || '' : '';
      // Dina rutor är knappar medan du fyller i; skärmläsaren får de andras
      // tips som text.
      const own = Boolean(d) && !locked;
      const sr = cols.filter((c) => !(own && c.st === 'fill')).map((c) =>
        `${c.g.id}: ${c.st === 'hidden' ? 'dolt' : c.st === 'blank' ? 'inget ännu' : c.t[x.id] || 'inget'}`);
      html += `<div class="sm-r${i % 2 ? ' alt' : ''}${locked ? ' sm-locked' : ''}${d && !sign ? ' unsigned' : ''}" data-id="${esc(x.id)}">` +
        `<span class="pp-nr">${i + 1}</span>` +
        `<span class="sm-m"><span class="pp-tm">${teamsHtml(x, m)}</span>` +
        `<span class="pp-small">${esc(fTime.format(new Date(x.avspark)))}${comp ? ` · <abbr title="${esc(comp.name)}">${esc(comp.short)}</abbr>` : ''}</span>` +
        (sr.length ? `<span class="pp-sr">${esc(sr.join(', '))}</span>` : '') + '</span>' +
        SIGNS.map((sg, j) => {
          const who = cols.filter((c) => (c.t[x.id] || '').includes(sg)).map((c) => c.g.id);
          return own
            ? `<button type="button" class="sm-c sm-k${pnum(v)}" data-s="${sg}" aria-pressed="${sign.includes(sg)}" aria-label="${sg} för ${esc(label)}">` +
              `${box(sg, who, ids)}<small>${p ? pctOdds(p[j]) : '–'}</small></button>`
            : `<span class="sm-c" aria-hidden="true">${box(sg, who, ids)}</span>`;
        }).join('') +
        // Motiveringen under matchen du just tippade, och där du har skrivit en.
        (sign && !locked && (SM.noteRow === x.id || d.kommentarer[x.id]) ? `<input type="text" class="kp-note-in" data-note="${esc(x.id)}" maxlength="${NOTE_MAX}" autocomplete="off"` +
          ` placeholder="Motivering (valfritt)" aria-label="Motivering för ${esc(label)}" value="${esc(d.kommentarer[x.id] || '')}">` : '') +
        '</div>';
    });
    keepFocus(() => { $('#sm-rows').innerHTML = html; });
    // Foten: hur långt du har kommit och knappen.
    const mine = d ? d.tecken : (cols.find((c) => c.g.id === v && c.st !== 'hidden') || {}).t;
    const signs = mine ? s.matcher.map((x) => mine[x.id]).filter(Boolean) : [];
    const gard = signs.filter((x) => x.length > 1).length;
    const odds = mine && signs.length ? radOdds(s, mine) : null;
    $('#sm-fields').innerHTML = !mine ? '' : [
      ['Tippat', `${signs.length}/${s.matcher.length}`],
      gard ? ['Garderingar', gard] : null,
      ['Rader', rader(signs), 'Antal rader med garderingarna'],
      odds ? ['Odds', odds >= 100 ? Math.round(odds).toLocaleString('sv-SE') : fmtOdds(odds), 'Oddset för att alla dina tecken går in – matchernas odds gånger varandra'] : null,
    ].filter(Boolean).map(([label, val, title]) =>
      `<span class="pp-field"${title ? ` title="${esc(title)}"` : ''}><span>${label}</span><b>${val}</b></span>`).join('');
    const go = d ? `<button type="button" class="kp-btn primary" id="sm-send">${SM.edit ? 'Spara ändringarna' : 'Lämna in och se de andras'}</button>`
      : canEdit(s) ? '<a class="kp-btn sm-again" href="#kupong/samtal/tips">Ändra din kupong</a>' : '';
    // Knappen ritas bara om när den ändras, så att den behåller fokus.
    if ($('#sm-go').dataset.html !== go) {
      $('#sm-go').innerHTML = go;
      $('#sm-go').dataset.html = go;
    }
    // Alla tecken på plats: de röda rutorna försvinner.
    if (!s.matcher.some((x) => d && !d.tecken[x.id])) $('#sm-sheet').classList.remove('need');
  }

  // Oddset för hela din rad: matchernas odds gånger varandra, där en
  // gardering har oddset för sina tecken tillsammans. Prognosen före avspark
  // som på resten av kupongen. null om en tippad match saknar prognos.
  function radOdds(s, mine) {
    let o = 1;
    for (const x of s.matcher) {
      const t = mine[x.id];
      if (!t) continue;
      const m = matchById(x.id);
      const pr = m && (m.j && m.j.p ? m.j.p : m.f ? m.f.p : null);
      const p = pr ? t.split('').reduce((a, sg) => a + pr[SIGNS.indexOf(sg)], 0) : 0;
      if (!p) return null;
      o *= 100 / p;
    }
    return o;
  }

  // Lyssnar på hela papperet: initialerna (vem du är), rutorna, motiveringen
  // och knappen.
  function wireSheet() {
    const el = $('#sm-sheet');
    if (!el) return;
    const keep = () => { if (!SM.edit) kpStore(TIPS, SM.draft); };
    el.addEventListener('click', (e) => {
      const who = e.target.closest('button[data-vem]');
      if (who) {
        if (who.dataset.vem === me()) return;
        kpStore(VEM, who.dataset.vem);
        renderRound();
        return;
      }
      if (e.target.closest('#sm-send')) {
        submitTips();
        return;
      }
      const b = e.target.closest('button[data-s]');
      if (!b || !SM.draft) return;
      const id = b.closest('[data-id]').dataset.id;
      const cur = SM.draft.tecken[id] || '';
      const next = SIGNS.filter((x) => (x === b.dataset.s ? !cur.includes(x) : cur.includes(x))).join('');
      if (next) SM.draft.tecken[id] = next;
      else delete SM.draft.tecken[id];
      SM.noteRow = id;
      keep();
      $('#sm-msg').innerHTML = '';
      sheetList();
    });
    // Motiveringen sparas medan man skriver; listan ritas inte om, så att
    // fältet behåller fokus.
    el.addEventListener('input', (e) => {
      const f = e.target.closest('input[data-note]');
      if (!f || !SM.draft) return;
      const text = f.value.slice(0, NOTE_MAX);
      if (text.trim()) SM.draft.kommentarer[f.dataset.note] = text;
      else delete SM.draft.kommentarer[f.dataset.note];
      keep();
    });
    sheetList();
  }

  // Ändra dina inlämnade tips, tills matcherna startar. Kupongen ser ut som
  // under Omgången, med din kolumn öppen igen.
  async function renderTips() {
    const s = SM.data;
    if (!s || !canEdit(s)) {
      location.hash = 'kupong';
      return;
    }
    $('#coupon').innerHTML = viewNav('omgang') + steps(s) +
      head(s, 'Ändra din kupong', '<a class="kp-btn" href="#kupong">Avbryt</a>') + sheet(s, true);
    wireSheet();
  }

  async function submitTips() {
    const s = SM.data;
    const d = SM.draft;
    const sub = KP.view.sub;
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    const left = s.matcher.filter((x) => !d.tecken[x.id]);
    if (left.length) {
      // Rutorna som saknar kryss blir röda, och den första rullas fram.
      $('#sm-sheet').classList.add('need');
      const row = document.querySelector(`.sm-r[data-id="${CSS.escape(left[0].id)}"]`);
      if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      msg(`<span class="note">${left.length === 1 ? 'En match saknar' : `${left.length} matcher saknar`} tecken.</span>`);
      return;
    }
    const btn = $('#sm-send');
    btn.disabled = true;
    msg(SM.edit ? 'Sparar …' : 'Lämnar in …');
    const out = await send({
      gor: 'tips',
      id: s.id,
      vem: d.vem,
      matcher: s.matcher.map((x) => x.id),
      tecken: Object.fromEntries(s.matcher.map((x) => [x.id, d.tecken[x.id]])),
      kommentarer: Object.fromEntries(s.matcher.filter((x) => (d.kommentarer[x.id] || '').trim()).map((x) => [x.id, d.kommentarer[x.id].trim()])),
      nyckel: d.nyckel,
    });
    if (!here(sub)) return;
    btn.disabled = false;
    if (out.ok) {
      kpStore(TIPS, { ...d, inne: d.inne || new Date().toISOString(), nyckel: out.nyckel });
      // Omgången igen, med de andras tips om de är inne.
      if (sub === '') show('');
      else location.hash = 'kupong';
      return;
    }
    // Matcherna har ändrats sedan sidan visade dem: de nya visas, med dina
    // tecken kvar i matcherna som fortfarande är med.
    if (out.andrade && SM.data && SM.data.id === s.id) {
      if (sub === '') renderRound();
      else await renderTips();
      $('#sm-msg').innerHTML = `<span class="note">${esc(out.error)}</span>`;
      return;
    }
    msg(`<span class="note">${esc(out.error)}</span>` + (out.status === 409 ? ' <a href="#kupong">Till omgången</a>' : ''));
  }

  // ---------- ta bort ----------

  // Omgångens kupong tas bort för alla, med tipsen som har lämnats in – efter
  // en fråga i en ruta ovanpå sidan. När allas tips visas står den kvar
  // (tipparhistoriken) – då startar man en ny.
  function confirmRemove() {
    const s = SM.data;
    if (!s || s.visas) return;
    let d = document.getElementById('sm-remove');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'sm-remove';
      d.className = 'kp-confirm';
      d.setAttribute('aria-label', 'Ta bort kupongen');
      // Avbryt, Esc eller ett klick utanför rutan stänger den.
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
      document.body.appendChild(d);
    }
    const inne = s.gang.filter((g) => g.inne).map((g) => g.namn);
    d.innerHTML = '<div class="kp-confirm-box"><h2>Ta bort kupongen?</h2>' +
      `<p>Den tas bort för alla${inne.length ? `, med tipsen som ${esc(inne.join(' och '))} har lämnat in` : ''}.</p>` +
      '<div class="kp-actions"><button type="button" class="kp-btn kp-danger" data-ok>Ta bort</button>' +
      '<button type="button" class="kp-btn" data-close autofocus>Avbryt</button></div>' +
      '<p class="kp-msg" role="status"></p></div>';
    d.querySelector('[data-ok]').addEventListener('click', () => removeRound(s, d));
    d.showModal();
  }

  async function removeRound(s, d) {
    const msg = (h) => { d.querySelector('.kp-msg').innerHTML = h; };
    const btn = d.querySelector('[data-ok]');
    btn.disabled = true;
    msg('Tar bort …');
    const out = await send({ gor: 'bort', id: s.id });
    btn.disabled = false;
    if (out.ok) {
      // Utkast och gängets tecken för omgången på enheten går inte längre att använda.
      for (const k of [TIPS, DECIDE]) {
        const x = kpLoad(k);
        if (x && x.id === s.id) kpStore(k, null);
      }
      d.close();
      // Kupongsidan ritas om utan omgången (showCoupon i kupong.js).
      if (location.hash === '#kupong') showCoupon('');
      else location.hash = 'kupong';
      return;
    }
    msg(`<span class="note">${esc(out.error)}</span>`);
    // 409: allas tips visas redan eller omgången har bytts – sidan under visar läget.
    if (out.status === 409 && here('')) renderRound();
  }

  // ---------- skapa omgångens kupong och ändra matcherna ----------

  // Programmet till vänster och omgångens kupong på papper bredvid, som får
  // en rad för varje vald match (Papper.builder i papper.js). Kupongen har
  // tretton matcher (Papper.RADER). Rutorna står tomma tills var och en
  // fyller i sin kupong.
  function renderStart(edit) {
    const s = SM.data;
    // Matcherna står fast när någon har lämnat in.
    if (edit && (!s || s.visas || s.gang.some((g) => g.inne))) {
      location.hash = 'kupong';
      return;
    }
    SM.pick = { ids: new Set(edit ? s.matcher.map((x) => x.id) : []) };
    SM.allDays = false;
    const comps = [{ id: 'all', short: 'Alla', name: 'Alla tävlingar' }, ...state.comps.values()];
    const tools = '<div class="toolbar kp-tools">' +
      `<input type="search" id="sm-q" class="kp-search" placeholder="Sök lag" autocomplete="off" value="${esc(SM.q)}">` +
      '<div class="chips" id="sm-comps" role="group" aria-label="Tävling">' + comps.map((c) =>
        `<button type="button" data-comp="${c.id}" title="${esc(c.name)}" aria-pressed="${c.id === SM.comp}">${esc(c.short)}</button>`).join('') + '</div></div>';
    $('#coupon').innerHTML = viewNav('omgang') + roundSteps(1) +
      '<div class="kp-head"><div>' + (edit ? nameBlock(s, 'rad') : '<p class="kp-eyebrow">Omgångens kupong</p>') +
      `<h2 class="page-title">${edit ? 'Ändra matcherna' : 'Välj matcher'}</h2></div>` +
      '<div class="kp-actions"><a class="kp-btn" href="#kupong">Avbryt</a></div></div>' +
      Papper.builder({
        id: 'sm-build',
        list: 'sm-pick-list',
        tools,
        foot: `<button type="button" class="kp-btn primary" id="sm-start">${edit ? 'Spara matcherna' : 'Skapa kupongen'}</button>` +
          '<p class="pb-msg" id="sm-msg" role="status"></p>',
      });

    $('#sm-q').addEventListener('input', (e) => { SM.q = e.target.value; pickList(); });
    for (const b of document.querySelectorAll('#sm-comps button')) {
      b.addEventListener('click', () => {
        SM.comp = b.dataset.comp;
        for (const x of document.querySelectorAll('#sm-comps button')) x.setAttribute('aria-pressed', String(x === b));
        pickList();
      });
    }
    // + och bock i programmet, × på kupongen.
    $('#sm-build').addEventListener('click', (e) => {
      if (e.target.closest('#sm-more')) {
        SM.allDays = true;
        pickList();
        return;
      }
      const b = e.target.closest('button[data-add], button[data-drop]');
      if (!b) return;
      const id = b.dataset.add || b.dataset.drop;
      if (b.dataset.drop || SM.pick.ids.has(id)) SM.pick.ids.delete(id);
      else if (SM.pick.ids.size >= Papper.RADER) {
        $('#sm-msg').innerHTML = '<span class="note">Kupongen är full.</span>';
        Papper.bump('sm-build');
        return;
      } else SM.pick.ids.add(id);
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
    const all = pickable(now).filter((m) => {
      if (SM.comp !== 'all' && m.comp !== SM.comp) return false;
      return !q || fold(`${m.home} ${m.away}`).includes(q);
    });
    // Först bara närmaste omgången (och det som redan är valt); sökningen
    // gäller alla dagar.
    const end = roundEnd(now);
    const list = SM.allDays || q ? all : all.filter((m) => ids.has(m.id) || dayKey.format(new Date(m.kickoff)) <= end);
    const later = all.length - list.length;
    const more = later ? `<button type="button" class="earlier" id="sm-more">Visa fler dagar <span class="n">${later}</span></button>` : '';
    $('#sm-pick-list').innerHTML = (list.length ? Papper.program(list, (id) => ids.has(id), ids.size >= Papper.RADER)
      : `<p class="empty">${later ? 'Inga matcher den närmaste omgången.' : 'Inga matcher hittades.'}</p>`) + more;
    Papper.slip('sm-build', { rows: [...ids].map((id) => ({ id, m: matchById(id) })), max: Papper.RADER });
  }

  async function startRound(edit, ersatt = null) {
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    const ids = [...SM.pick.ids];
    const left = Papper.RADER - ids.length;
    if (left) {
      msg(`<span class="note">${left > 0 ? `Välj ${plural(left, 'match', 'matcher')} till.` : `Ta bort ${plural(-left, 'match', 'matcher')}.`}</span>`);
      Papper.bump('sm-build');
      return;
    }
    const btn = $('#sm-start');
    btn.disabled = true;
    msg('Sparar …');
    const out = edit
      ? await send({ gor: 'matcher', id: SM.data.id, matcher: ids })
      : await send({ gor: 'starta', matcher: ids, ersatt });
    if (!here(edit ? 'matcher' : 'ny')) return;
    btn.disabled = false;
    if (out.ok) {
      location.hash = 'kupong';
      return;
    }
    // Det finns redan en kupong som fylls i: ersätt den bara om man vill.
    if (out.finns && out.samtal) {
      const o = out.samtal;
      const k = kicks(o);
      const inne = o.gang.filter((g) => g.inne).length;
      msg(`<span class="note">Det finns redan en kupong som fylls i (${esc(dateRange(Math.min(...k), Math.max(...k)))})` +
        `${inne ? ` där ${inne} har lämnat in` : ''}.</span> <button type="button" class="kp-linkbtn" id="sm-replace">Ersätt den</button>`);
      $('#sm-replace').addEventListener('click', () => startRound(false, o.id));
      return;
    }
    msg(`<span class="note">${esc(out.error)}</span>`);
  }

  // ---------- förstasidan ----------

  // Omgången fylls i eller tipsen jämförs: då är det den som står under
  // Kupong → Omgången och överst på förstasidan. När gängets kupong är gjord
  // tar den över.
  const active = () => {
    const s = SM.data;
    return Boolean(info() && s && !over(s) && !(s.visas && existing(s)));
  };

  // Gängets kupong har matcher ur omgången.
  const covers = (c) => {
    const ids = new Set(SM.data ? SM.data.matcher.map((x) => x.id) : []);
    return c.matches.some((x) => ids.has(x.id));
  };

  // Tiden kvar att lämna in, grovt: minuter, timmar, sedan dagar.
  const HOUR = 3600000;
  function left(ms) {
    const min = Math.max(1, Math.ceil(ms / 60000));
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return h < 10 && min % 60 ? `${h} tim ${min % 60} min` : `${h} tim`;
    const d = Math.floor(h / 24);
    return d < 3 && h % 24 ? `${plural(d, 'dag', 'dagar')} ${h % 24} tim` : plural(d, 'dag', 'dagar');
  }

  // Rutan på förstasidan, med så lite som möjligt: omgångens namn som rubrik
  // (som AI:n gav den), tiden kvar att lämna in ovanför, vilka som är inne och
  // en knapp. När allas tips visas är det dags för uppgörelsen, och när
  // gängets kupong är gjord tar den över (kupong.js).
  function teaser() {
    const s = SM.data;
    if (!active()) return '';
    const v = me();
    const done = submitted(s, v);
    const open = !s.visas && Date.now() < Math.min(...kicks(s));
    const go = !open ? 'Till uppgörelsen' : done ? 'Se de andras tips' : 'Fyll i kupongen';
    return '<div class="card sm-teaser">' +
      nameBlock(s, 'ruta') +
      // Porträtten: ring i egen färg och bock = inne, grått = inte inne,
      // guldring = du.
      '<div class="sm-faces">' + s.gang.map((g) => {
        const st = g.inne ? 'inne' : open ? 'fyller i' : 'lämnade inte in';
        return `<span class="sm-face sm-p${pnum(g.id)}${person(g.id).bild ? ' bild' : ''}${g.inne ? ' inne' : ''}${g.id === v ? ' du' : ''}" title="${esc(`${g.namn} · ${st}`)}">` +
          `${photo(g.id)}${g.inne ? CHECK : ''}</span>`;
      }).join('') + '</div>' +
      '<a class="kp-btn primary" href="#kupong">' + go + '</a></div>';
  }

  // Nedräkningen i rutan går av sig själv. När tiden är ute ritas rutan om.
  setInterval(() => {
    const el = document.querySelector('[data-kvar]');
    if (!el || document.hidden) return;
    const ms = Number(el.dataset.kvar) - Date.now();
    if (ms > 0) {
      el.textContent = left(ms);
      el.parentElement.classList.toggle('snart', ms < HOUR);
    } else if (onHome()) redraw();
  }, 30000);

  // Omgången hämtas en gång när sidan laddas, så att förstasidan kan visa den.
  (async function init() {
    await loadCoupons();
    if (!info()) return;
    await load();
    if (KP.view && KP.view.mode === 'home') redraw();
  })();

  // Omgångens matcher (liveställningen i kupong.js hämtar dem också), om
  // allas tips visas, gängets kupong ur omgången och bevakningen av
  // förstasidans ruta.
  const ids = () => (SM.data ? SM.data.matcher.map((x) => x.id) : []);
  const visible = () => Boolean(SM.data && SM.data.visas);
  const made = () => (SM.data && SM.data.visas ? existing(SM.data) : null);
  const watch = () => { if (active() && !SM.data.visas) poll(); };

  window.Samtal = { show, load, active, covers, teaser, ids, visible, made, watch, name: () => nameOf(SM.data), redraw: () => { if (here('')) renderRound(); } };
})();
