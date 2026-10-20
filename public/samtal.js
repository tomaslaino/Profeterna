'use strict';

// Omgångens kupong inför uppgörelsen (Kupong → Omgången, steg 1–3): någon skapar kupongen
// – väljer matcherna – och var och en fyller i den för sig, ett tecken eller
// en gardering per match. Den som har lämnat in ser de andras inlämnade tips
// och kan ändra sina tills matcherna startar; den som inte har lämnat in ser
// inga. När alla har lämnat in (senast när första matchen startar) ser alla
// allt. Sidan blir underlaget för uppgörelsen i telefon: matcherna sorteras
// efter hur oeniga vi är, och gängets kupong växer fram när man trycker på
// rutorna. Den sparas direkt därifrån (postCoupon i
// kupong.js, samma som Ny kupong → Spara) – eller öppnas i Ny
// kupong med tecknen ifyllda, för namn, anteckningar eller fler matcher.
//
//   #kupong                  omgången medan den fylls i och tills gängets kupong är gjord
//   #kupong/samtal           samma vy, också efteråt (Allas tips)
//   #kupong/samtal/tips      fyll i din kupong, eller ändra den du har lämnat in
//   #kupong/samtal/ny        skapa omgångens kupong: välj matcherna
//   #kupong/samtal/matcher   ändra matcherna, tills någon har lämnat in
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
    only: false,
    draft: null, // dina tips: {id, vem, tecken, kommentarer, inne, nyckel}
    edit: false, // draft är en ändring av dina inlämnade tips
    again: false, // Spara gängets kupong trots matcher utan tecken
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
    `<span class="sm-ch sm-p${Math.max(0, gang().findIndex((g) => g.id === id))}${hedge ? ' g' : ''}"${hedge ? ' title="Del av en gardering"' : ''}>${esc(id)}</span>`;
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

  function head(s, eyebrow, actions = '') {
    const k = s ? kicks(s) : [];
    return '<div class="kp-head"><div>' +
      `<p class="kp-eyebrow">${esc(eyebrow)}</p>` +
      `<h2 class="page-title">${s ? esc(dateRange(Math.min(...k), Math.max(...k))) : 'Omgångens kupong'}</h2></div>` +
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
    const actions = (s.visas || anyIn ? '' : '<a class="kp-btn" href="#kupong/samtal/matcher">Ändra matcherna</a>') +
      (canEdit(s) ? '<a class="kp-btn" href="#kupong/samtal/tips">Ändra din kupong</a>' : '') +
      (s.visas && existing(s) ? '<a class="kp-btn" href="#kupong">Gängets kupong</a>' : '') +
      (s.visas || over(s) ? '<a class="kp-btn" href="#kupong/samtal/ny">+ Ny kupong</a>' : '');
    html += steps(s) + head(s, 'Omgångens kupong', actions);
    // Allas tips så snart du ser fler än dina egna.
    html += s.tips && Object.keys(s.tips).length >= (s.visas ? 1 : 2) ? board(s) : waiting(s);
    // Gängets kuponger som spelas under tiden, t.ex. veckans matcher.
    html += openCoupons();
    el.innerHTML = html;
    wire(s);
  }

  // Bock = tipsen är inne, tre prickar = fyller i.
  const CHECK = '<svg class="sm-ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  const DOTS = '<span class="sm-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
  const mark = (s, g) => (g.inne ? CHECK : s.visas ? '' : DOTS);
  const lage = (s, g) => (g.inne ? 'inne' : s.visas ? 'lämnade inte in' : 'fyller i');

  // Gänget, och vem du är: tryck på dig själv (guldram, sparas på enheten),
  // så att Fyll i kupongen vet vems den är.
  function whoAmI(s) {
    const v = me();
    return `<div class="sm-vem" role="group" aria-label="Vem är du?">${v ? '' : '<span class="sm-vem-q">Vem är du?</span>'}` +
      s.gang.map((g) => `<button type="button" class="${g.inne ? 'inne' : 'ute'}" data-vem="${esc(g.id)}" aria-pressed="${g.id === v}" ` +
        `title="${esc(`${g.namn} · ${lage(s, g)}`)}">${chip(g.id)}${mark(s, g)}</button>`).join('') + '</div>';
  }

  // Innan du ser de andras tips: vem som lämnat in, dina tips och
  // omgångens matcher.
  function waiting(s) {
    const v = me();
    const done = submitted(s, v);
    const local = handedIn(s);
    const own = done ? (s.tips && s.tips[v] ? s.tips[v].tecken : local && local.vem === v ? local.tecken : null) : null;
    let html = '<div class="card sm-wait">' + whoAmI(s) +
      (v && !done ? '<div class="kp-actions"><a class="kp-btn primary" href="#kupong/samtal/tips">Fyll i kupongen</a></div>' : '') +
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
    html += '<div class="kp-bar sm-bar">' +
      `<span class="kp-bar-txt"><b>Gängets kupong</b> · ${done.length} av ${rows.length} klara` +
      `${gard ? ` · ${plural(gard, 'gardering', 'garderingar')}` : ''} · <b>${rader(done)}</b> ${rader(done) === 1 ? 'rad' : 'rader'}` +
      `${same ? ' · <a href="#kupong">sparad</a>' : ''}</span>` +
      '<span class="sm-slots" aria-hidden="true">' + chosen.map((x) => `<i${x ? ' class="set"' : ''}>${x || '?'}</i>`).join('') + '</span>' +
      '<button type="button" class="kp-linkbtn" id="sm-reset" title="Gängets tecken som de flesta tippade">Börja om</button>' +
      (direct ? '<button type="button" class="kp-linkbtn" id="sm-adjust" title="Öppna kupongen med tecknen ifyllda – för namn, anteckningar eller fler matcher">Justera först</button>' : '') +
      // Systemet ni spelade, som skärmbild: tecknen därifrån (systembild.js).
      (window.Systembild ? Systembild.button('kp-linkbtn') : '') +
      `<button type="button" class="kp-btn primary" id="sm-make"${same && direct ? ' disabled' : ''}>${label}</button>` +
      '<span class="sm-bar-msg" id="sm-msg" role="status"></span></div>';
    return html;
  }

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
    for (const b of document.querySelectorAll('.sm-vem button')) {
      b.addEventListener('click', () => {
        kpStore(VEM, b.dataset.vem);
        renderRound();
      });
    }
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
    const adjust = $('#sm-adjust');
    if (adjust) adjust.addEventListener('click', () => makeCoupon(s, { adjust: true }));
  }

  // ---------- dina tips ----------

  async function renderTips() {
    const s = SM.data;
    const el = $('#coupon');
    // Den som har lämnat in ändrar sin kupong här tills matcherna startar. Den
    // som inte har det kan inte lämna in när allas tips redan visas.
    if (!s || (submitted(s, me()) ? !canEdit(s) : s.visas)) {
      location.hash = 'kupong';
      return;
    }
    const v = me();
    if (!v) {
      el.innerHTML = viewNav('omgang') + steps(s) + head(s, 'Din kupong') +
        `<div class="card sm-wait">${whoAmI(s)}</div>`;
      for (const b of document.querySelectorAll('.sm-vem button')) {
        b.addEventListener('click', () => {
          kpStore(VEM, b.dataset.vem);
          renderTips();
        });
      }
      return;
    }
    // Utkastet sparas på enheten medan du fyller i. En ändring utgår från dina
    // inlämnade tips och sparas först när du lämnar in den.
    SM.edit = submitted(s, v);
    let d = kpLoad(TIPS);
    if (SM.edit) {
      const t = (s.tips && s.tips[v]) || d;
      d = { ...d, tecken: { ...t.tecken }, kommentarer: { ...(t.kommentarer || {}) } };
    } else if (!d || d.id !== s.id || d.vem !== v || d.nyckel) {
      d = { id: s.id, vem: v, tecken: {}, kommentarer: {} };
      kpStore(TIPS, d);
    }
    SM.draft = d;
    const keep = () => { if (!SM.edit) kpStore(TIPS, SM.draft); };
    const name = (gang().find((g) => g.id === v) || {}).namn || v;
    el.innerHTML = viewNav('omgang') + steps(s) + head(s, `Din kupong · ${name}`, '<a class="kp-btn" href="#kupong">Avbryt</a>') +
      Papper.fill('sm-tips-list') +
      '<div class="kp-bar"><span class="kp-bar-txt" id="sm-bar-txt"></span>' +
      `<button type="button" class="kp-btn primary" id="sm-send">${SM.edit ? 'Spara ändringarna' : 'Lämna in och se de andras'}</button>` +
      '<span class="sm-bar-msg" id="sm-msg" role="status"></span></div>';
    const list = $('#sm-tips-list');
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-s]');
      if (!b || b.disabled) return;
      const id = b.closest('[data-id]').dataset.id;
      const cur = SM.draft.tecken[id] || '';
      const next = SIGNS.filter((x) => (x === b.dataset.s ? !cur.includes(x) : cur.includes(x))).join('');
      if (next) SM.draft.tecken[id] = next;
      else delete SM.draft.tecken[id];
      keep();
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
      keep();
    });
    $('#sm-send').addEventListener('click', submitTips);
    tipsList();
  }

  function tipsList() {
    const s = SM.data;
    const d = SM.draft;
    const now = Date.now();
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
        // När du ändrar står matcher som har startat kvar som de var.
        const locked = SM.edit && started(x, now);
        html += `<div class="kp-pick${sign ? ' on' : ''}${locked ? ' sm-locked' : ''}" data-id="${esc(x.id)}">` +
          `<span class="mtime">${esc(fTime.format(new Date(x.avspark)))}</span>` +
          `<span class="ctag"${comp ? ` title="${esc(comp.name)}"` : ''}>${comp ? esc(comp.short) : ''}</span>` +
          `<span class="mteams">${teamsHtml(x, m)}</span>` +
          '<span class="kp-tg">' + SIGNS.map((sg, i) =>
            `<button type="button" data-s="${sg}" aria-pressed="${sign.includes(sg)}" aria-label="${sg} för ${esc(label)}"${locked ? ' disabled' : ''}>` +
            `${sg}<small>${p ? pctOdds(p[i]) : '–'}</small></button>`).join('') + '</span>' +
          (sign && !locked ? `<input type="text" class="kp-note-in" data-note="${esc(x.id)}" maxlength="${NOTE_MAX}" autocomplete="off"` +
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
    if (!here('tips')) return;
    btn.disabled = false;
    if (out.ok) {
      kpStore(TIPS, { ...d, inne: d.inne || new Date().toISOString(), nyckel: out.nyckel });
      location.hash = 'kupong';
      return;
    }
    // Matcherna har ändrats sedan sidan visade dem: de nya visas, med dina
    // tecken kvar i matcherna som fortfarande är med.
    if (out.andrade && SM.data && SM.data.id === s.id) {
      await renderTips();
      $('#sm-msg').innerHTML = `<span class="note">${esc(out.error)}</span>`;
      return;
    }
    msg(`<span class="note">${esc(out.error)}</span>` + (out.status === 409 ? ' <a href="#kupong">Till omgången</a>' : ''));
  }

  // ---------- skapa omgångens kupong och ändra matcherna ----------

  function renderStart(edit) {
    const s = SM.data;
    // Matcherna står fast när någon har lämnat in.
    if (edit && (!s || s.visas || s.gang.some((g) => g.inne))) {
      location.hash = 'kupong';
      return;
    }
    SM.pick = { ids: new Set(edit ? s.matcher.map((x) => x.id) : []) };
    SM.only = false;
    const comps = [{ id: 'all', short: 'Alla', name: 'Alla tävlingar' }, ...state.comps.values()];
    $('#coupon').innerHTML = viewNav('omgang') + roundSteps(1) +
      '<div class="kp-head"><div><p class="kp-eyebrow">Omgångens kupong</p>' +
      `<h2 class="page-title">${edit ? 'Ändra matcherna' : 'Välj matcher'}</h2></div>` +
      '<div class="kp-actions"><a class="kp-btn" href="#kupong">Avbryt</a></div></div>' +
      '<div class="toolbar kp-tools">' +
      `<input type="search" id="sm-q" class="kp-search" placeholder="Sök lag" autocomplete="off" value="${esc(SM.q)}">` +
      '<div class="chips" id="sm-comps" role="group" aria-label="Tävling">' + comps.map((c) =>
        `<button type="button" data-comp="${c.id}" title="${esc(c.name)}" aria-pressed="${c.id === SM.comp}">${esc(c.short)}</button>`).join('') + '</div>' +
      `<button type="button" id="sm-only" class="kp-only" aria-pressed="${SM.only}">Bara valda</button></div>` +
      '<div id="sm-pick-list"></div>' +
      '<div class="kp-bar"><span class="kp-bar-txt" id="sm-bar-txt"></span>' +
      `<button type="button" class="kp-btn primary" id="sm-start">${edit ? 'Spara matcherna' : 'Skapa kupongen'}</button>` +
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

  // Rutan på förstasidan: hur många som har lämnat in och hur länge till det
  // går – till första avsparken. När allas tips visas är det dags för
  // uppgörelsen, och när gängets kupong är gjord tar den över (kupong.js).
  function teaser() {
    const s = SM.data;
    if (!active()) return '';
    const v = me();
    const inne = s.gang.filter((g) => g.inne).length;
    const done = submitted(s, v);
    const stop = Math.min(...kicks(s));
    const open = !s.visas && Date.now() < stop;
    const ute = s.gang.filter((g) => !g.inne).map((g) => g.id);
    const go = !open ? 'Till uppgörelsen' : done ? 'Se de andras tips' : 'Fyll i kupongen';
    const href = !open || done || !v ? '#kupong' : '#kupong/samtal/tips';
    const title = !open ? 'Dags för uppgörelsen' : done ? 'Du har lämnat in' : `${inne} av ${s.gang.length} har lämnat in`;
    const ms = stop - Date.now();
    const line = open
      ? `<span class="kp-line sm-kvar${ms < HOUR ? ' snart' : ''}"><b data-kvar="${stop}">${left(ms)}</b> kvar att lämna in · <span>senast ${esc(fWeekdayTime.format(new Date(stop)))}</span></span>`
      : ute.length ? `<span class="kp-line sm-kvar">${esc(ute.join(' och '))} lämnade inte in</span>` : '';
    return '<div class="card sm-teaser">' +
      '<div><p class="kp-eyebrow">Omgångens kupong</p>' +
      `<h2 class="page-title"><a href="#kupong">${esc(title)}</a></h2>${line}</div>` +
      // Samma som Vem är du under Omgången: bock, tre prickar, guldram för dig.
      '<div class="sm-folk">' + s.gang.map((g) => {
        const st = g.inne ? 'inne' : open ? 'fyller i' : 'lämnade inte in';
        return `<span class="sm-person ${g.inne ? 'inne' : 'ute'}${g.id === v ? ' du' : ''}" title="${esc(`${g.namn} · ${st}`)}">` +
          `${chip(g.id)}${g.inne ? CHECK : open ? DOTS : ''}</span>`;
      }).join('') + '</div>' +
      `<a class="kp-btn primary" href="${href}">${go}</a></div>`;
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

  window.Samtal = { show, load, active, covers, teaser, ids, visible, made, watch, redraw: () => { if (here('')) renderRound(); } };
})();
