'use strict';

// Omgångens kupong inför uppgörelsen (Kupong → Omgången, steg 1–4): någon skapar kupongen
// – väljer matcherna – och var och en fyller i den för sig, ett tecken eller
// en gardering per match. Kupongen står på papper med en kolumn per person,
// och man fyller i sin kolumn direkt. Den som har lämnat in kan ändra sin
// kolumn på samma papper tills hen ser någon annans tips – då står de fast –
// och ser de andras inlämnade tips; den som inte har lämnat in ser de andras
// kolumner täckta. Stämpeln på papperet säger vem omgången väntar på. En
// kupong som inte är färdig går att spara utan att lämna in: de andra ser då
// hur långt man har kommit (en tårtbit vid porträttet i stället för tre
// prickar). När alla har lämnat in (senast när första matchen startar) ser
// alla allt. Samma papper blir underlaget för uppgörelsen i telefon (steg 3):
// matcherna sorteras efter hur oeniga vi är, och gängets kupong kryssas i
// rutorna, med förslaget ikryssat från början. Den sparas direkt därifrån
// (postCoupon i kupong.js, samma som Ny kupong → Spara) – utan tjänsten i Ny
// kupong med tecknen ifyllda. Gängets kupong (steg 4) står sedan på samma
// papper med allas porträtt kvar och utfallen inringade (Samtal.paper, ritas
// av kupong.js).
//
//   #kupong                  omgången medan den fylls i och tills gängets kupong är gjord
//   #kupong/samtal           samma vy, också efteråt (uppgörelsen)
//   #kupong/samtal/ny        skapa omgångens kupong: välj matcherna
//   #kupong/samtal/matcher   ändra matcherna, tills någon har lämnat in
//
// Allt man gör med kupongen – spara, lämna in, ångra, ändra matcherna, ta
// bort – står på ett ställe: raden längst ner på papperet, som står kvar
// nederst medan man bläddrar. Ta bort (tills allas tips visas) frågar i en
// ruta ovanpå omgången.
//
// Omgången heter Kupong 1, Kupong 2 … (couponNumber i kupong.js) och får
// ett namn av AI:n när matcherna är valda (worker/namn.mjs, i samma proxy som
// matchanalysen) – samma för alla, och det följer med när gängets kupong
// sparas. Namnet står bredvid numret, som en bikommentar.
//
// Omgången och tipsen ligger i tjänsten profeterna-kupong (worker/samtal.mjs,
// GET/POST …/samtal; lokalt /api/samtal), som håller tipsen dolda. Den som
// har lämnat in ser de andras tips, på alla sina enheter. Vem man är och
// gängets tecken under uppgörelsen sparas bara på enheten.
//
// Läses efter app.js och kupong.js och använder deras hjälpare (KP, SIGNS,
// matchById, isOpen, pickable, gradeRow, roundSteps …). kupong.js ritar vyerna
// med Samtal.show(sub) och förstasidans ruta med Samtal.teaser().

(function () {
  const SM = {
    data: undefined, // omgången som tjänsten visar den; null = ingen, undefined = inte hämtad
    error: null,
    timer: null,
    pick: null, // skapa kupongen / ändra matcherna: {ids: Set, spel}
    q: '',
    comp: 'all',
    allDays: false, // välj matcher: alla dagar, inte bara närmaste omgången
    draft: null, // dina tips: {id, vem, tecken, kommentarer, inne}
    edit: false, // draft är en ändring av dina inlämnade tips
    again: false, // Spara gängets kupong trots matcher utan tecken
    names: new Map(), // omgång och matcher → {namn, syftar} | null (inget namn) | 'loading'
    writing: {}, // din kommentar i efterhand som inte är sparad än: matchens id → texten
    failed: {}, // matchens id → varför kommentaren inte gick att spara
    sending: new Set(), // matcher vars kommentar sparas just nu
    lyft: null, // vems tips som lyfts fram på papperet (ett tryck på porträttet överst)
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
  // bilden saknas.
  const pnum = (id) => Math.max(0, gang().findIndex((g) => g.id === id));
  const person = (id) => gang().find((g) => g.id === id) || { id, namn: id };
  const photo = (id) => {
    const g = person(id);
    return g.bild ? `<img src="${esc(g.bild)}" alt="${esc(g.id)}" width="40" height="40" decoding="async" draggable="false">` : esc(g.id);
  };
  const rader = (signs) => signs.reduce((a, s) => a * Math.max(1, s.length), 1);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const kicks = (s) => s.matcher.map((x) => Date.parse(x.avspark)).filter(Number.isFinite);
  const over = (s) => Date.now() >= Math.max(...kicks(s));
  // Matchnamnet öppnar matchrutan, som på uppgörelsens papper.
  const teamsHtml = (x, m) => (m ? `<a class="pp-t" href="#match/${esc(x.id)}">${esc(m.home)}<span class="vs">–</span>${esc(m.away)}</a>` : esc(x.match));
  // Dina inlämnade tips för omgången, som de sparades här om du lämnade in
  // på den här enheten.
  const handedIn = (s) => {
    const d = kpLoad(TIPS);
    return s && d && d.id === s.id && d.vem && d.vem === me() && d.inne ? d : null;
  };
  // Nyckeln från inlämningen skickas med om enheten har den: tjänsten
  // krävde den till 2026-10-22, och den driftsätts för hand.
  const oldKey = (s) => {
    const d = handedIn(s);
    return d && d.nyckel ? { nyckel: d.nyckel } : {};
  };
  const submitted = (s, v) => Boolean(s && v && s.gang.some((g) => g.id === v && g.inne));
  // Dina inlämnade tips, var du än lämnade in: från tjänsten, annars som de
  // sparades här.
  const mineIn = (s, v) => (s.tips && s.tips[v]) || handedIn(s);
  // Dina inlämnade tips går att ändra tills matcherna startar, på vilken av
  // dina enheter som helst – på papperet, så länge det bara visar dina.
  const canEdit = (s) => {
    const v = me();
    return Boolean(submitted(s, v) && !over(s) && mineIn(s, v));
  };
  const started = (x, now = Date.now()) => !(Date.parse(x.avspark) > now);
  // Kommentarer i efterhand skriver du när allas tips visas – eller när du
  // har lämnat in och redan ser dem. → du, eller null.
  const writer = (s) => {
    const v = me();
    return v && s && s.tips && (s.visas || submitted(s, v)) ? v : null;
  };

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
    // Har du lämnat in ser du de andras inlämnade tips.
    const v = me();
    if (SM.data && !SM.data.visas && submitted(SM.data, v)) {
      await send({ gor: 'se', id: SM.data.id, vem: v, ...oldKey(SM.data) });
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
  // vilket kan ta en minut – då står numret ensamt så länge.
  const nameKey = (s) => `${s.id}:${s.matcher.map((x) => x.id).sort().join(',')}`;
  function named(s) {
    const url = info() && info().namn;
    if (!s || !url) return null;
    const k = nameKey(s);
    if (!SM.names.has(k)) {
      // Ett namn som sparats på enheten visas direkt, men tjänsten frågas ändå
      // en gång per besök – omgången kan ha fått ett nytt namn.
      const saved = kpLoad(NAMN);
      SM.names.set(k, saved && saved.key === k && saved.namn ? saved : 'loading');
      fetchName(url, s.id, k);
    }
    const n = SM.names.get(k);
    return n && n !== 'loading' ? n : null;
  }

  async function fetchName(url, id, k) {
    const before = SM.names.get(k);
    let n = null;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok && j.namn) n = { key: k, namn: j.namn, syftar: j.syftar || null };
    } catch { /* inget namn den här gången */ }
    // Utan svar står ett sparat namn kvar.
    if (!n) {
      if (before === 'loading') SM.names.set(k, null);
      return;
    }
    SM.names.set(k, n);
    kpStore(NAMN, n);
    if (before && before !== 'loading' && before.namn === n.namn && before.syftar === n.syftar) return;
    if (!SM.data || nameKey(SM.data) !== k) return;
    // Byt bara rubriken, så att inget annat på sidan ritas om.
    for (const el of document.querySelectorAll(`[data-sm-namn="${CSS.escape(k)}"]`)) el.outerHTML = nameBlock(SM.data, el.dataset.smDel, 'fram', el.dataset.smLabel);
  }

  const nameOf = (s) => { const n = named(s); return n ? n.namn : null; };

  // Rubriken Kupong 1 med omgångens namn bredvid, och vad namnet syftar på
  // när man pekar på det. kind: 'ruta' = förstasidans ruta (tiden kvar
  // ovanför), 'sida' = omgångens sida (datumen ovanför, eller label), 'rad' =
  // bara raden ovanför en annan rubrik. Tills namnet finns står numret ensamt.
  function nameBlock(s, kind, cls = '', label = '') {
    const n = named(s);
    const nr = couponNumber(s.matcher.map((x) => x.id));
    if (kind === 'rad') return `<p class="kp-eyebrow">Kupong ${nr}</p>`;
    const key = info() && info().namn ? ` data-sm-namn="${esc(nameKey(s))}" data-sm-del="${kind}"` : '';
    const opts = { hint: n && n.syftar ? n.syftar : '', nameCls: `sm-namn ${cls}`.trim() };
    if (kind === 'ruta') return `<div${key}>${countdown(s)}${couponTitle(nr, n && n.namn, { ...opts, href: '#kupong' })}</div>`;
    const k = kicks(s);
    const eyebrow = label || dateRange(Math.min(...k), Math.max(...k));
    return `<div${key}${label ? ` data-sm-label="${esc(label)}"` : ''}><p class="kp-eyebrow">${esc(eyebrow)}</p>${couponTitle(nr, n && n.namn, opts)}</div>`;
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
    const el = $('#coupon');
    if (!info()) {
      el.innerHTML = '<p class="empty">Att tippa var för sig är inte påslaget på den här sajten.</p>';
      return;
    }
    if (SM.data === undefined) el.innerHTML = '<p class="empty">Laddar …</p>';
    if (!loaded) await load();
    if (!here(sub)) return;
    if (sub === 'ny') renderStart(false);
    else if (sub === 'matcher') renderStart(true);
    else {
      renderRound();
      poll();
    }
    window.scrollTo(0, 0);
  }

  // ---------- omgången ----------

  // label: texten ovanför rubriken i stället för datumen.
  function head(s, label, actions = '') {
    return '<div class="kp-head">' + (s ? nameBlock(s, 'sida', '', label || '') :
      `<div><p class="kp-eyebrow">${esc(label || 'Omgångens kupong')}</p><h2 class="page-title">Omgångens kupong</h2></div>`) +
      `<div class="kp-actions">${actions}</div></div>`;
  }

  // Var omgången står, i stegen överst (roundSteps i kupong.js): 2
  // medan alla tippar, 3 när allas tips visas och 4 när gängets kupong är
  // gjord eller alla matcher har startat. Stegen man kan gå tillbaka till är
  // länkar: matcherna tills någon har lämnat in, uppgörelsen och gängets
  // kupong när de finns. board: uppgörelsen visas (steg 3, också när
  // omgången har kommit längre).
  function steps(s, board = false) {
    const now = (s.visas && existing(s)) || over(s) ? 4 : s.visas ? 3 : 2;
    const inne = s.gang.filter((g) => g.inne).length;
    const go = {};
    if (!s.visas && !inne) go[1] = '#kupong/samtal/matcher';
    if (s.visas) go[3] = '#kupong/samtal';
    if (s.visas && existing(s)) go[4] = '#kupong';
    return roundSteps(now, { 2: now === 2 ? `${inne} av ${s.gang.length} har lämnat in` : '' }, go, board && now > 3 ? 3 : now);
  }

  function renderRound() {
    const el = $('#coupon');
    const s = SM.data;
    let html = '';
    if (s === undefined || (SM.error && !s)) {
      el.innerHTML = html + `<p class="empty">Kunde inte läsa omgången (${esc(SM.error || 'okänt fel')}).</p>`;
      return;
    }
    if (!s) {
      el.innerHTML = html + roundSteps(1) + emptyCard();
      return;
    }
    // Allas tips så snart du ser fler än dina egna, annars kupongen. Knapparna
    // står i raden längst ner på papperet, i båda.
    const all = Boolean(s.tips && Object.keys(s.tips).length >= (s.visas ? 1 : 2));
    html += steps(s, all) + head(s, null);
    html += all ? board(s) : sheet(s);
    // Gängets kuponger som spelas under tiden, t.ex. veckans matcher.
    html += openCoupons();
    keepFocus(() => {
      el.innerHTML = html;
      if (all) wire(s);
      else wireSheet();
    });
  }

  // Bock = tipsen är inne, tårtbit = så stor del av kupongen som är tippad
  // (grön när den är inlämnad men inte färdig), tre prickar = fyller i.
  const CHECK = '<svg class="sm-ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  // Stämpeln på papperet: vem omgången väntar på – du först – tills alla har
  // lämnat in, och då Alla inne. Den som inte hann lämna in står i raden över
  // papperet i stället. Vilka som är inne när man pekar. I telefonen bryts
  // den bara före namnen.
  const andList = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} och ${a[a.length - 1]}` : a[0] || '');
  function stamp(s) {
    const v = me();
    const ute = s.gang.filter((g) => !g.inne).sort((a, b) => (b.id === v) - (a.id === v));
    if (!ute.length) return '<span class="pp-stamp inne">Alla inne</span>';
    if (s.visas) return '';
    const inne = s.gang.filter((g) => g.inne).sort((a, b) => (b.id === v) - (a.id === v)).map((g) => (g.id === v ? 'du' : g.id));
    const who = ute.length === s.gang.length ? 'alla' : andList(ute.map((g) => (g.id === v ? 'dig' : g.id)));
    return `<span class="pp-stamp wait" title="${esc(inne.length ? `${cap(andList(inne))} har lämnat in` : 'Ingen har lämnat in än')}">Väntar&nbsp;på ${esc(who).replace(/ /g, '&nbsp;')}</span>`;
  }
  const DOTS = '<span class="sm-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
  const PIE_C = 2 * Math.PI * 2.6;
  const pie = (n, all, inne = false) => `<svg class="sm-pie${inne ? ' inne' : ''}" viewBox="0 0 16 16" aria-hidden="true">` +
    '<circle cx="8" cy="8" r="6.6"/><circle class="f" cx="8" cy="8" r="2.6" transform="rotate(-90 8 8)"' +
    ` stroke-dasharray="${(PIE_C * Math.min(1, n / all)).toFixed(2)} ${PIE_C.toFixed(2)}"/></svg>`;
  const PEN = '<svg class="sm-pen" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6 2.9l2.5 2.5-7.6 7.6-3.2.7.7-3.2z"/><path d="M9 4.5l2.5 2.5"/></svg>';

  // Hur många matcher någon har tippat. Dina egna räknas ur kupongen på
  // enheten tills du lämnar in – live: också medan du fyller i eller ändrar
  // på papperet – de andras ur det de har sparat eller lämnat in.
  function tally(s, g, live = false) {
    const d = g.id !== me() ? null : live && SM.draft ? SM.draft : g.inne ? null : kpLoad(TIPS);
    if (d && d.id === s.id && d.vem === g.id && (live || !d.inne)) return s.matcher.filter((x) => d.tecken[x.id]).length;
    return g.tippat != null ? g.tippat : g.inne ? s.matcher.length : 0;
  }
  // Märket vid porträttet: on = bocken på porträttet (inne), side = det som
  // står bredvid (tårtbiten eller tre prickar).
  function mark(s, g, live = false) {
    const n = tally(s, g, live);
    const all = s.matcher.length;
    if (g.inne) return n < all ? { side: pie(n, all, true) } : { on: CHECK };
    return { side: s.visas ? '' : n ? pie(n, all) : DOTS };
  }
  function lage(s, g, live = false) {
    const n = tally(s, g, live);
    const all = s.matcher.length;
    if (g.inne) return n < all ? `inne · ${n} av ${all} tippade` : 'inne';
    return s.visas ? 'lämnade inte in' : n ? `${n} av ${all} tippade` : 'fyller i';
  }

  // Ett porträtt överst på papperet: i färg med en grön bock när kupongen är
  // inne, grått tills dess. Ditt är inringat. attrs gör det till en knapp
  // (Vem är du?, eller en persons tips), side ersätter märket bredvid och
  // text läget när man pekar.
  function topFace(s, g, { live = false, attrs = '', side = null, text = null } = {}) {
    const du = g.id === me();
    const mk = side == null ? mark(s, g, live) : { side };
    const tag = attrs ? 'button' : 'span';
    return `<${tag}${attrs} class="sm-who sm-k${pnum(g.id)}${du ? ' du' : ''}${g.inne ? ' inne' : ''}" ` +
      `title="${esc(`${g.namn} · ${du ? 'du · ' : ''}${text || lage(s, g, live)}`)}"><span class="sm-fw">${face(g.id, false)}` +
      `${du ? Papper.ring(`du${s.id}${g.id}`, 'sm-du-ring', 25) : ''}${mk.on || ''}</span>${mk.side || ''}</${tag}>`;
  }

  // Ritar om utan att tappa var man var: fältet eller rutan som hade fokus
  // får det igen.
  function keepFocus(draw) {
    const a = document.activeElement;
    const row = a && a.closest && a.closest('#coupon [data-id]');
    const sel = !row ? null
      : a.matches('input[data-note]') ? `input[data-note="${CSS.escape(a.dataset.note)}"]`
        : a.matches('input[data-efter]') ? `input[data-efter="${CSS.escape(a.dataset.efter)}"]`
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

  // Uppgörelsen (steg 3): samma papper som när alla tippar, med allas
  // porträtt i rutorna. Matcherna står efter hur oeniga vi är, under en
  // tryckt rubrik med en rad i blyerts, men med sina nummer från kupongen.
  // Gängets tecken är kryss: förslaget – det som fler än hälften har med –
  // står ikryssat från början, och ett tryck på en ruta kryssar i eller ur.
  // Gängets kupong går att göra så fort du ser de andras tips.
  function board(s) {
    const rows = analyse(s);
    const val = decisions(s, rows);
    const ids = s.gang.filter((g) => s.tips && s.tips[g.id]).map((g) => g.id);
    const nr = new Map(s.matcher.map((x, i) => [x.id, i + 1]));
    const missing = s.gang.filter((g) => !(s.tips && s.tips[g.id]));
    let html = '';
    if (missing.length && s.visas) {
      html += `<p class="legend"><span class="note">${esc(missing.map((g) => g.id).join(' och '))} hann inte lämna in` +
        `${s.orsak === 'avspark' ? ' innan första matchen startade' : ''}.</span></p>`;
    }
    html += paperTop(stopBox(s), ' sm-up', stamp(s)) +
      upHead(s, ids, rows.filter((r) => r.g.res != null).map((r) => [r.x.id, r.g.res]));
    const w = writer(s);
    let n = 0;
    for (let k = 0; k <= 5; k++) {
      const list = rows.filter((r) => r.kind === k);
      if (!list.length) continue;
      html += `<p class="pp-day sm-grp">${esc(groupName(k, s))}${GROUPS[k][1] ? `<span>${esc(GROUPS[k][1])}</span>` : ''}</p>`;
      for (const r of list) {
        html += upRow({
          id: r.x.id, m: r.m, label: r.m ? `${r.m.home} – ${r.m.away}` : r.x.match, g: r.g, nr: nr.get(r.x.id),
          who: r.cov, sign: val[r.x.id] || '', notes: r.notes, after: afterOf(s, r.x.id, w), pen: penOf(s, r.x.id, w),
          ids, alt: n++ % 2, pick: true, open: r.open,
        });
      }
    }
    const chosen = s.matcher.map((x) => val[x.id] || '').filter(Boolean);
    const gard = chosen.filter((x) => x.length > 1).length;
    const odds = chosen.length ? radOdds(s, val) : null;
    html += '<div class="pb-foot sm-foot">' + fieldList([
      ['Tippat', `${chosen.length}/${rows.length}`],
      gard ? ['Garderingar', gard] : null,
      window.Spela ? Spela.field(rader(chosen), s.spel, s.gang.length) : ['Kombinationer', rader(chosen)],
      odds ? ['Odds', oddsText(odds), 'Oddset för att alla gängets tecken går in – matchernas odds gånger varandra'] : null,
    ]) + '</div>';
    const act = boardActions(s, rows, val);
    return html + `<div class="sm-act${actMore ? ' more' : ''}" id="sm-act"${act ? '' : ' hidden'}><div class="sm-act-in" id="sm-act-in">${act}</div>` +
      '<p class="pb-msg" id="sm-msg" role="status"></p></div></div></div>';
  }

  // Raden längst ner på papperet, som när alla tippar: till höger Spara
  // gängets kupong, till vänster det mer sällsynta – i telefonen bakom ⋯.
  // Börja om står bara där när gängets tecken skiljer sig från förslaget.
  // Med tjänsten sparas gängets kupong direkt härifrån, annars i Ny kupong
  // (eller Ändra) med tecknen ifyllda.
  function boardActions(s, rows, val) {
    const key = (o) => Object.keys(o).sort().map((k) => `${k}:${o[k]}`).join(',');
    const open = rows.some((r) => r.open);
    const direct = Boolean(KP.data && KP.data.save);
    const made = existing(s);
    const same = made && savedAsIs(made, rows, val);
    const more = [
      open && key(val) !== key(proposal(rows)) ? '<button type="button" class="sm-act-l" id="sm-reset" title="Det som fler än hälften har med">Börja om</button>' : '',
      s.visas ? '' : '<button type="button" class="sm-act-l" data-sm-remove>Ta bort</button>',
      s.visas || over(s) ? '<a class="sm-act-l" href="#kupong/samtal/ny">+ Ny kupong</a>' : '',
    ].filter(Boolean);
    const label = direct ? (same ? `${CHECK}Sparad` : made ? 'Spara ändringen' : 'Spara gängets kupong')
      : made ? 'Ändra gängets kupong' : 'Gör gängets kupong';
    const go = open ? `<button type="button" class="kp-btn primary${same && direct ? ' kept' : ''}" id="sm-make"${same && direct ? ' disabled' : ''}>${label}</button>` : '';
    return (more.length ? `<button type="button" class="sm-act-more" aria-expanded="${actMore}" aria-controls="sm-act-ls" aria-label="Fler val">${DOTS3}</button>` +
      `<span class="sm-act-ls" id="sm-act-ls">${more.join('')}</span>` : '') + (go ? `<span class="sm-act-go">${go}</span>` : '');
  }

  // Gängets kupong har redan tecknen som är valda här, i varje match som
  // inte har startat.
  function savedAsIs(c, rows, val) {
    const now = Date.now();
    const on = new Map(c.matches.map((x) => [x.id, x.sign]));
    return rows.filter((r) => isOpen(r.m, now)).every((r) => (val[r.x.id] || '') === (on.get(r.x.id) || ''));
  }

  // ---------- allas tips på papperet: uppgörelsen och gängets kupong ----------

  // Papperet: märket med kupongens nummer, i hörnet spelstoppet eller betyget
  // och stämpeln emellan, och bården under. cls: fler klasser på papperet.
  // Omgångens id ger papperet samma slitage när man fyller i och efteråt
  // (slitage.js).
  const paperTop = (corner, cls = '', stamp = '') => `<div class="pp-wrap sm-wrap"><div class="pp pp-fill sm-sheet${cls}" id="sm-sheet"${SM.data ? ` data-slitage="omg:${esc(SM.data.id)}"` : ''}>` +
    `<div class="sm-sheet-head"><p class="pp-brand"><img src="logo.svg" alt="" width="20" height="20">Matchfixarna<span>Kupong${SM.data ? ` ${couponNumber(SM.data.matcher.map((x) => x.id))}` : ''}</span></p>` +
    `${stamp}${corner}</div><div class="pp-band" aria-hidden="true"></div>`;
  const stopBox = (s) => `<div class="pp-stop"><span>Spelstopp</span><b>${esc(fWeekdayTime.format(new Date(Math.min(...kicks(s)))))}</b></div>`;
  // Fälten i foten: [[etikett, värde, title]].
  const fieldList = (list, id = '') => `<div class="pp-fields pb-fields"${id ? ` id="${id}"` : ''}>` + list.filter(Boolean).map((x) =>
    `<span class="pp-field"${x[2] ? ` title="${esc(x[2])}"` : ''}><span>${x[0]}</span><b>${x[1]}</b></span>`).join('') + '</div>';
  const oddsText = (o) => (o >= 100 ? Math.round(o).toLocaleString('sv-SE') : fmtOdds(o));
  const DOTS3 = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7"/><circle cx="10" cy="10" r="1.7"/><circle cx="15.5" cy="10" r="1.7"/></svg>';

  // Hur det går för var och en: rätt i matcherna som har ett utfall (också
  // ställningen just nu), garderingarna och raderna. null = inga tips.
  // res: [[matchens id, utfallet 0–2]].
  function score(s, id, res) {
    const tip = s.tips && s.tips[id];
    if (!tip) return null;
    const signs = s.matcher.map((x) => tip.tecken[x.id] || '');
    const hel = signs.filter((x) => x.length === 3).length;
    const halv = signs.filter((x) => x.length === 2).length;
    const done = res.filter(([mid]) => tip.tecken[mid]);
    const ok = done.filter(([mid, i]) => tip.tecken[mid].includes(SIGNS[i])).length;
    return {
      ok: done.length ? ok : null,
      text: [done.length ? `${ok} rätt av ${done.length}` : null, hel ? plural(hel, 'helgardering', 'helgarderingar') : null,
        halv ? plural(halv, 'halvgardering', 'halvgarderingar') : null, plural(rader(signs), 'rad', 'rader')].filter(Boolean).join(' · '),
    };
  }

  // Porträtten och 1 X 2 överst, som när alla tippar. När matcherna börjar
  // ge utfall står antalet rätt för hand i var och ens bläck i stället för
  // bocken; den som inte lämnade in är grå. Ett tryck på ett porträtt lyfter
  // fram den personens tips (SM.lyft): de andras porträtt i rutorna tonas
  // ner, så att hens kupong står som en egen kolumn.
  function upHead(s, ids, res) {
    const lyft = ids.includes(SM.lyft) ? SM.lyft : null;
    return `<div class="sm-r sm-hd"${lyft ? ` data-lyft="${pnum(lyft)}"` : ''}><span class="sm-hd-nr" aria-hidden="true">Nr</span>` +
      '<span class="sm-m"><span class="sm-hd-l" aria-hidden="true">Match</span><span class="sm-folk-pp">' + s.gang.map((g) => {
        const sc = score(s, g.id, res);
        const attrs = ids.includes(g.id) ? ` type="button" data-lyft="${esc(g.id)}" aria-pressed="${g.id === lyft}" aria-label="${esc(`Visa bara ${g.id}:s tips`)}"` : '';
        return topFace(s, g, {
          attrs,
          side: sc && sc.ok != null ? `<b class="sm-score">${sc.ok}</b>` : null,
          text: sc ? `${sc.text}${attrs ? ` · tryck för att se bara ${g.id}:s tips` : ''}` : null,
        });
      }).join('') + '</span></span>' +
      SIGNS.map((sg) => `<span class="sm-hd-s" aria-hidden="true">${box(sg, [], ids)}</span>`).join('') + '</div>';
  }

  // Kommentarerna i efterhand till en match – de andras (och dina, om du inte
  // kan skriva här) under motiveringarna. Din egen skriver du efter tiden,
  // som motiveringen när man tippar: penOf ger fältet, eller null.
  const afterOf = (s, id, w) => s.gang.filter((g) => g.id !== w && s.efter && s.efter[g.id] && s.efter[g.id][id])
    .map((g) => ({ k: g.id, text: s.efter[g.id][id].text }));
  const penOf = (s, id, w) => (!w || !s.matcher.some((x) => x.id === id) ? null : {
    k: w,
    text: id in SM.writing ? SM.writing[id] : ((s.efter && s.efter[w] && s.efter[w][id]) || {}).text || '',
    fel: SM.failed[id] || '',
  });

  // En match på papperet med allas porträtt i rutorna. sign: gängets tecken,
  // ett kryss med kulspetspenna över tecknet. Utfallet är en ring runt rutan
  // – grön när gängets tecken gick in, annars röd, streckad i blyerts medan
  // matchen pågår – och ställningen står för hand med rättarens bock eller
  // kryss bredvid. who: vilka som har med 1, X och 2. pick: rutorna är
  // knappar för gängets tecken (uppgörelsen), open: matchen har inte
  // startat. day: matcherna står under sin dag, så klockslaget räcker. out:
  // matchen kom inte med på gängets kupong. after, pen: kommentarerna i
  // efterhand (afterOf, penOf).
  function upRow({ id, m, label, g, nr, who, sign, notes = [], note = '', after = [], pen = null, ids, alt, pick = false, open = false, day = false, out = false }) {
    const hit = g.res != null && sign ? sign.includes(SIGNS[g.res]) : null;
    const cls = rowClass({ ...g, hit });
    const comp = m ? compOf(m.comp) : null;
    const when = m ? `${esc((day ? fTime : fWeekdayTime).format(new Date(m.kickoff)))}${comp ? ` · <abbr title="${esc(comp.name)}">${esc(comp.short)}</abbr>` : ''}` : '';
    const teams = m ? `${esc(m.home)}<span class="vs">–</span>${esc(m.away)}` : esc(label);
    const tick = cls === 'ok' || cls === 'no' ? Papper.tick(id, cls === 'ok') : '';
    const res = g.state === 'upcoming' || g.state === 'missing' ? ''
      : `<span class="sm-res"><span class="sm-res-s">${Papper.result(g)}</span>${tick}</span>`;
    const sr = `${sign ? `Gängets tecken ${sign}${hit === true ? ', rätt' : hit === false ? ', fel' : ''}` : 'Inget tecken'}. ` +
      ids.map((k) => `${k}: ${SIGNS.filter((sg, i) => who[i].includes(k)).join('') || 'inget'}`).join(', ');
    return `<div class="sm-r${alt ? ' alt' : ''} s-${cls.replace(' ', ' s-')}${pick && open && !sign ? ' unsigned' : ''}${out ? ' sm-out' : ''}" data-id="${esc(id)}">` +
      `<span class="pp-nr">${nr}</span>` +
      '<span class="sm-m"><span class="sm-mt">' +
      `<span class="pp-tm">${m ? `<a class="pp-t" href="#match/${esc(id)}">${teams}</a>` : `<span class="pp-t">${teams}</span>`}</span>` +
      (when || pen ? `<span class="sm-meta">${when ? `<span class="pp-small">${when}</span>` : ''}` +
        // Din kommentar i efterhand: en penna i ditt bläck efter tiden, och
        // man skriver på samma rad, så att ingenting flyttar sig.
        (pen ? `<label class="sm-note-w sm-k${pnum(pen.k)}${pen.fel ? ' fel' : ''}"${pen.fel ? ` title="${esc(pen.fel)}"` : ''}>${PEN}` +
          `<input type="text" class="sm-note-in" data-efter="${esc(id)}" maxlength="${NOTE_MAX}" autocomplete="off" enterkeyhint="done" placeholder=" "` +
          ` aria-label="Kommentar till ${esc(label)}"${pen.fel ? ' aria-invalid="true"' : ''} value="${esc(pen.text)}"></label>` : '') + '</span>' : '') +
      (note ? `<span class="pp-note">${esc(note)}</span>` : '') +
      [...notes, ...after].map((o) => `<span class="sm-said sm-k${pnum(o.k)}">${face(o.k)}<span>${esc(o.text)}</span></span>`).join('') +
      `<span class="pp-sr">${esc(sr)}</span></span>${res}</span>` +
      SIGNS.map((sg, i) => {
        const on = sign.includes(sg);
        const b = box(sg, who[i], ids, on ? `${id}${sg}` : null, g.res === i ? `${id}${sg}` : null);
        const odds = `<small${on ? ' class="on"' : ''}>${g.pr ? pctOdds(g.pr[i]) : '–'}</small>`;
        if (!pick) return `<span class="sm-c" aria-hidden="true">${b}${odds}</span>`;
        // Gängets tecken väljs bara i matcher som inte har startat.
        return `<button type="button" class="sm-c" data-s="${sg}" aria-pressed="${on}"${open ? '' : ' disabled'}` +
          ` aria-label="${esc(`${label}, ${sg}: ${who[i].length ? who[i].join(', ') : 'ingen'}`)}">${b}${odds}</button>`;
      }).join('') + '</div>';
  }

  // Gängets kupong ur omgången (steg 4, kupong.js): samma papper med allas
  // porträtt i rutorna, gängets kryss, utfallet inringat och betyget i
  // hörnet. Matcherna har sina nummer från kupongen som alla tippade, under
  // sin dag; en match som lagts till på gängets kupong efteråt får nästa
  // nummer, och en som gänget inte gav något tecken står kvar nedtonad.
  function paper(c, g) {
    const s = SM.data;
    const ids = s.gang.filter((p) => s.tips && s.tips[p.id]).map((p) => p.id);
    const nr = new Map(s.matcher.map((x, i) => [x.id, i + 1]));
    for (const r of g.rows) if (!nr.has(r.id)) nr.set(r.id, nr.size + 1);
    const on = new Set(g.rows.map((r) => r.id));
    const now = Date.now();
    const rows = [...g.rows, ...s.matcher.filter((x) => !on.has(x.id)).map((x) => ({ ...gradeRow({ id: x.id, sign: '', label: x.match }, now), out: true }))]
      .sort((a, b) => nr.get(a.id) - nr.get(b.id));
    const stamp = c.pending ? '<span class="pp-stamp wait">Väntar på GitHub</span>' : g.done && !g.hidden ? '<span class="pp-stamp">Rättad</span>' : '';
    let html = paperTop(Papper.grade(c, g), ' sm-up', stamp) + upHead(s, ids, rows.filter((r) => r.res != null).map((r) => [r.id, r.res]));
    const days = Papper.inDayOrder(rows, (r) => r.m && r.m.kickoff);
    const w = writer(s);
    let day = null;
    rows.forEach((r, i) => {
      const k = r.m ? dayKey.format(new Date(r.m.kickoff)) : 'okänd';
      if (days && k !== day) {
        day = k;
        html += `<p class="pp-day">${esc(r.m ? cap(fDay.format(new Date(r.m.kickoff))) : 'Okänt datum')}</p>`;
      }
      const tip = (p) => s.tips[p].tecken[r.id] || '';
      html += upRow({
        id: r.id, m: r.m, label: teamsOf(r), g: r, nr: nr.get(r.id), who: SIGNS.map((sg) => ids.filter((p) => tip(p).includes(sg))),
        sign: r.sign, note: r.note, notes: ids.map((p) => ({ k: p, text: (s.tips[p].kommentarer || {})[r.id] })).filter((o) => o.text),
        after: afterOf(s, r.id, w), pen: penOf(s, r.id, w), ids, alt: i % 2, day: days, out: r.out,
      });
    });
    return html + Papper.foot(c, g) + '</div></div>';
  }

  // Rubriken över gängets kupong (steg 4): Kupong 1 med omgångens namn, som
  // i stegen före – eller kupongens eget, om den har fått ett annat.
  function title(c) {
    const s = SM.data;
    if (!c.name || c.name === nameOf(s)) return nameBlock(s, 'sida');
    const k = kicks(s);
    return `<div><p class="kp-eyebrow">${esc(dateRange(Math.min(...k), Math.max(...k)))}</p>${couponTitle(couponNumber(c.matches.map((x) => x.id)), c.name)}</div>`;
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
    // Är omgången Stryktipset står gängets kupong i dess ordning – matcher
    // som bara finns på gängets kupong sist.
    if (s.spel) {
      d.spel = 'Stryktipset';
      d.order = [...new Set([...s.matcher.map((x) => x.id), ...(d.order || [])])];
    }
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

  // Spara gängets kupong. Med tjänsten direkt härifrån. Utan tjänsten – eller
  // när den inte kan spara just nu (adjust) – öppnas Ny kupong (eller Ändra)
  // med tecknen ifyllda, och kupongen sparas där.
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
      // Rutorna i matcherna utan tecken blir röda, som när alla tippar.
      $('#sm-sheet').classList.add('need');
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

  // Lyssnar på hela papperet i uppgörelsen: rutorna (gängets tecken) och
  // raden längst ner.
  function wire(s) {
    const el = $('#sm-sheet');
    if (!el) return;
    el.addEventListener('click', (e) => {
      if (e.target.closest('#sm-make')) {
        makeCoupon(s);
        return;
      }
      // Börja om: tecknen som fler än hälften har med.
      if (e.target.closest('#sm-reset')) {
        kpStore(DECIDE, { id: s.id, val: proposal(analyse(s)), own: true });
        SM.again = false;
        renderRound();
        return;
      }
      if (e.target.closest('[data-sm-remove]')) {
        confirmRemove();
        return;
      }
      const more = e.target.closest('.sm-act-more');
      if (more) {
        actMore = !actMore;
        more.setAttribute('aria-expanded', String(actMore));
        $('#sm-act').classList.toggle('more', actMore);
        return;
      }
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

  // ---------- kupongen ----------

  // Omgångens kupong på papper: en ruta per tecken i varje match, och var och
  // en står med sitt porträtt i rutorna hen har valt – så syns direkt vem som
  // tippat vad och var ni är eniga. Dina rutor trycker du på direkt – också
  // när du har lämnat in, så ändrar du dina inlämnade tips (edit); de andras
  // porträtt syns först när du själv har lämnat in. Överst porträtten med
  // bock eller tre prickar, ditt inringat. Har du inte valt vem du är trycker
  // du på ditt porträtt. Stämpeln säger vem omgången väntar på.
  function sheet(s) {
    const v = me();
    const edit = canEdit(s);
    const fill = Boolean(v && (edit || (!submitted(s, v) && !s.visas)));
    SM.draft = fill ? draftFor(s, v, edit) : null;
    SM.edit = edit;
    return paperTop(stopBox(s), '', stamp(s)) + '<div id="sm-rows"></div>' +
      '<div class="pb-foot sm-foot"><div class="pp-fields pb-fields" id="sm-fields"></div></div>' +
      '<div class="sm-act" id="sm-act"><div class="sm-act-in" id="sm-act-in"></div>' +
      '<p class="pb-msg" id="sm-msg" role="status"></p></div></div></div>';
  }

  // Ditt utkast sparas på enheten medan du fyller i. En ändring utgår från
  // dina inlämnade tips och sparas först när du lämnar in den; till dess står
  // den kvar när papperet ritas om.
  function draftFor(s, v, edit) {
    let d = kpLoad(TIPS);
    if (edit) {
      if (SM.edit && SM.draft && SM.draft.id === s.id && SM.draft.vem === v) return SM.draft;
      const t = mineIn(s, v);
      return { ...handedIn(s), id: s.id, vem: v, inne: t.inne, tecken: { ...t.tecken }, kommentarer: { ...(t.kommentarer || {}) } };
    }
    if (!d || d.id !== s.id || d.vem !== v || d.inne) {
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
  // porträtten står på samma ställe i varje rad. cross: nyckeln till gängets
  // kryss över tecknet, ring: till ringen runt rutan (utfallet).
  const box = (sg, who, ids, cross = null, ring = null) =>
    `<span class="pp-box sm-bx${who.length ? ' on' : ''}"><i>${sg}${cross ? Papper.cross(cross) : ''}</i><span class="sm-seats">` +
    ids.map((id) => (who.includes(id) ? face(id) : '<span class="sm-seat"></span>')).join('') + '</span>' +
    `${ring ? Papper.ring(ring, 'pp-ring sm-ring', 27) : ''}</span>`;

  function sheetList() {
    const s = SM.data;
    const v = me();
    const d = SM.draft;
    const now = Date.now();
    const cols = s.gang.map((g) => ({ g, ...column(s, g, v) }));
    // En plats i rutorna för var och en vars tips syns på papperet.
    const ids = cols.filter((c) => c.st !== 'hidden' && c.st !== 'blank').map((c) => c.g.id);
    // Vem du är går att välja tills du har lämnat in – men inte byta till
    // någon som redan har lämnat in, så att ingen ser allas tips av misstag.
    // På en ny enhet väljer du fritt.
    const choose = (g) => !submitted(s, v) && (!v || !g.inne);
    let html = '<div class="sm-r sm-hd"><span class="sm-hd-nr" aria-hidden="true">Nr</span>' +
      `<span class="sm-m">${v ? '<span class="sm-hd-l" aria-hidden="true">Match</span>' : '<span class="sm-q">Vem är du?</span>'}` +
      '<span class="sm-folk-pp">' + cols.map(({ g }) =>
        topFace(s, g, { live: true, attrs: choose(g) ? ` type="button" aria-pressed="${g.id === v}" data-vem="${esc(g.id)}"` : '' })).join('') + '</span></span>' +
      // 1 X 2 som en tom ruta utan kant, så att tecknen står rakt över rutornas.
      SIGNS.map((sg) => `<span class="sm-hd-s" aria-hidden="true">${box(sg, [], ids)}</span>`).join('') + '</div>';
    // Under sin dag när matcherna kommer i datumordning, annars med veckodagen
    // på raden.
    const days = Papper.inDayOrder(s.matcher, (x) => x.avspark);
    let day = null;
    s.matcher.forEach((x, i) => {
      const k = dayKey.format(new Date(x.avspark));
      if (days && k !== day) {
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
        `<span class="sm-meta"><span class="pp-small">${esc((days ? fTime : fWeekdayTime).format(new Date(x.avspark)))}${comp ? ` · <abbr title="${esc(comp.name)}">${esc(comp.short)}</abbr>` : ''}</span>` +
        // Motiveringen: en penna efter tiden när du har tippat matchen. Man
        // skriver på samma rad, så att ingenting flyttar sig.
        (own && (sign || d.kommentarer[x.id]) ? `<label class="sm-note-w sm-k${pnum(v)}" title="Motivering">${PEN}` +
          `<input type="text" class="sm-note-in" data-note="${esc(x.id)}" maxlength="${NOTE_MAX}" autocomplete="off" placeholder=" "` +
          ` aria-label="Motivering för ${esc(label)}" value="${esc(d.kommentarer[x.id] || '')}"></label>` : '') + '</span>' +
        (sr.length ? `<span class="pp-sr">${esc(sr.join(', '))}</span>` : '') + '</span>' +
        SIGNS.map((sg, j) => {
          const who = cols.filter((c) => (c.t[x.id] || '').includes(sg)).map((c) => c.g.id);
          return own
            ? `<button type="button" class="sm-c sm-k${pnum(v)}" data-s="${sg}" aria-pressed="${sign.includes(sg)}" aria-label="${sg} för ${esc(label)}">` +
              `${box(sg, who, ids)}<small>${p ? pctOdds(p[j]) : '–'}</small></button>`
            : `<span class="sm-c" aria-hidden="true">${box(sg, who, ids)}</span>`;
        }).join('') + '</div>';
    });
    keepFocus(() => { $('#sm-rows').innerHTML = html; });
    // Foten: hur långt du har kommit och knappen.
    const mine = d ? d.tecken : (cols.find((c) => c.g.id === v && c.st !== 'hidden') || {}).t;
    const signs = mine ? s.matcher.map((x) => mine[x.id]).filter(Boolean) : [];
    const gard = signs.filter((x) => x.length > 1).length;
    const odds = mine && signs.length ? radOdds(s, mine) : null;
    $('#sm-fields').outerHTML = !mine ? '<div class="pp-fields pb-fields" id="sm-fields"></div>' : fieldList([
      ['Tippat', `${signs.length}/${s.matcher.length}`],
      gard ? ['Garderingar', gard] : null,
      window.Spela ? Spela.field(rader(signs), s.spel) : ['Kombinationer', rader(signs)],
      odds ? ['Odds', oddsText(odds), 'Oddset för att alla dina tecken går in – matchernas odds gånger varandra'] : null,
    ], 'sm-fields');
    actionRow();
    // Alla tecken på plats: de röda rutorna försvinner.
    if (!s.matcher.some((x) => d && !d.tecken[x.id])) $('#sm-sheet').classList.remove('need');
  }

  // Det du har tippat och skrivit, för att se om kupongen är sparad som den är.
  const sig = (s, d) => s.matcher.map((x) => `${d.tecken[x.id] || ''}:${(d.kommentarer[x.id] || '').trim()}`).join('|');

  // Allt man gör med kupongen, på ett ställe: raden längst ner på papperet.
  // Till höger det du gör med din kupong, huvudknappen längst ut; till
  // vänster omgångens mer sällsynta val, i telefonen bakom ⋯. Spara = en
  // kupong som inte är färdig, utan att lämna in; Sparad när den är sparad
  // som den står. Inlämnad (en grön bock) när du har lämnat in – tills du
  // ändrar något, då Ångra och Lämna in ändringen. Överst en rad om när du
  // får se de andras tips.
  function actions(s) {
    const d = SM.draft;
    const v = me();
    const anyIn = s.gang.some((g) => g.inne);
    const others = s.gang.filter((g) => g.inne && g.id !== v).map((g) => g.id);
    const note = SM.edit || s.visas ? ''
      : d && others.length ? `Lämna in, så ser du hur ${andList(others)} har tippat.` : '';
    const more = [
      s.visas || anyIn ? '' : '<a class="sm-act-l" href="#kupong/samtal/matcher">Ändra matcherna</a>',
      s.visas ? '' : '<button type="button" class="sm-act-l" data-sm-remove>Ta bort</button>',
      s.visas || over(s) ? '<a class="sm-act-l" href="#kupong/samtal/ny">+ Ny kupong</a>' : '',
    ].filter(Boolean);
    const handIn = (attr = ' id="sm-send"') => `<button type="button" class="kp-btn primary"${attr}>Lämna in</button>`;
    const inne = `<span class="kp-btn kept sm-inne">${CHECK}Inlämnad</span>`;
    let go = '';
    if (SM.edit) {
      const t = mineIn(s, v);
      go = sig(s, d) === sig(s, { tecken: t.tecken, kommentarer: t.kommentarer || {} }) ? inne
        : '<button type="button" class="kp-btn" id="sm-undo">Ångra</button><button type="button" class="kp-btn primary" id="sm-send">Lämna in ändringen</button>';
    } else if (d) {
      const kept = Boolean(d.sparad) && d.sparad === sig(s, d);
      const blank = !d.sparad && !sig(s, d).replace(/[:|]/g, '');
      go = `<button type="button" class="kp-btn${kept ? ' kept' : ''}" id="sm-save"${kept || blank ? ' disabled' : ''}>${kept ? `${CHECK}Sparad` : 'Spara'}</button>` + handIn();
    } else if (!me() && !s.visas) {
      // Först Vem är du? – knapparna står ändå där de brukar.
      go = '<button type="button" class="kp-btn" disabled>Spara</button>' + handIn(' disabled');
    } else if (submitted(s, v)) {
      go = inne;
    }
    return (note ? `<p class="sm-act-note">${esc(note)}</p>` : '') +
      (more.length ? `<button type="button" class="sm-act-more" aria-expanded="${actMore}" aria-controls="sm-act-ls" aria-label="Fler val">${DOTS3}</button>` +
      `<span class="sm-act-ls" id="sm-act-ls">${more.join('')}</span>` : '') + (go ? `<span class="sm-act-go">${go}</span>` : '');
  }
  // ⋯ i raden längst ner är öppnad – står kvar när papperet ritas om.
  let actMore = false;

  // Raden ritas bara om när den ändras, så att knapparna behåller fokus.
  function actionRow() {
    const el = $('#sm-act-in');
    if (!el || !SM.data) return;
    const html = actions(SM.data);
    if (el.dataset.html === html) return;
    el.innerHTML = html;
    el.dataset.html = html;
    $('#sm-act').classList.toggle('more', actMore);
    $('#sm-act').hidden = !html;
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
        // Har hen lämnat in syns allas tips direkt.
        if (submitted(SM.data, who.dataset.vem)) show(KP.view.sub);
        else renderRound();
        return;
      }
      if (e.target.closest('#sm-send')) {
        submitTips();
        return;
      }
      if (e.target.closest('#sm-save')) {
        saveDraft();
        return;
      }
      // Ångra: dina inlämnade tips igen.
      if (e.target.closest('#sm-undo')) {
        SM.draft = null;
        renderRound();
        return;
      }
      if (e.target.closest('[data-sm-remove]')) {
        confirmRemove();
        return;
      }
      const more = e.target.closest('.sm-act-more');
      if (more) {
        actMore = !actMore;
        more.setAttribute('aria-expanded', String(actMore));
        $('#sm-act').classList.toggle('more', actMore);
        return;
      }
      const b = e.target.closest('button[data-s]');
      if (!b || !SM.draft) return;
      const id = b.closest('[data-id]').dataset.id;
      const cur = SM.draft.tecken[id] || '';
      const next = SIGNS.filter((x) => (x === b.dataset.s ? !cur.includes(x) : cur.includes(x))).join('');
      if (next) SM.draft.tecken[id] = next;
      else delete SM.draft.tecken[id];
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
      actionRow();
    });
    sheetList();
  }

  async function submitTips() {
    const s = SM.data;
    const d = SM.draft;
    const sub = KP.view.sub;
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    // Första gången krävs alla matcher (annars Spara); en ändring får lämna
    // några tomma – din bock blir en tårtbit tills de är tippade.
    const left = s.matcher.filter((x) => !d.tecken[x.id]);
    if (left.length && !SM.edit) {
      // Rutorna som saknar kryss blir röda, och den första rullas fram.
      $('#sm-sheet').classList.add('need');
      const row = document.querySelector(`.sm-r[data-id="${CSS.escape(left[0].id)}"]`);
      if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      msg(`<span class="note">${left.length === 1 ? 'En match saknar' : `${left.length} matcher saknar`} tecken.</span>`);
      return;
    }
    const btn = $('#sm-send');
    btn.disabled = true;
    msg('Lämnar in …');
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
      const edit = SM.edit;
      SM.draft = null;
      // Omgången igen, med de andras tips om de är inne – efter en ändring på
      // samma ställe, utan att papperet rullar upp.
      if (!edit) {
        if (sub === '') show('');
        else location.hash = 'kupong';
        return;
      }
      await load();
      if (here(sub)) renderRound();
      return;
    }
    // Matcherna har ändrats sedan sidan visade dem: de nya visas, med dina
    // tecken kvar i matcherna som fortfarande är med.
    if (out.andrade && SM.data && SM.data.id === s.id) {
      renderRound();
      $('#sm-msg').innerHTML = `<span class="note">${esc(out.error)}</span>`;
      return;
    }
    msg(`<span class="note">${esc(out.error)}</span>` + (out.status === 409 ? ' <a href="#kupong">Till omgången</a>' : ''));
  }

  // Spara en kupong som inte är färdig, utan att lämna in. Tipsen stannar på
  // enheten; tjänsten får bara veta hur många matcher som är tippade, så att
  // de andra ser hur långt du har kommit.
  async function saveDraft() {
    const s = SM.data;
    const d = SM.draft;
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    const btn = $('#sm-save');
    btn.disabled = true;
    msg('Sparar …');
    const out = await send({
      gor: 'spara',
      id: s.id,
      vem: d.vem,
      matcher: s.matcher.map((x) => x.id),
      tippat: s.matcher.filter((x) => d.tecken[x.id]).length,
    });
    if (!here('')) return;
    if (out.ok) {
      d.sparad = sig(s, d);
      kpStore(TIPS, d);
      msg('');
      $('#sm-sheet').classList.remove('need');
      sheetList();
      return;
    }
    // Matcherna har ändrats: de nya visas, med dina tecken kvar där de går.
    if (out.andrade && SM.data && SM.data.id === s.id) {
      renderRound();
      $('#sm-msg').innerHTML = `<span class="note">${esc(out.error)}</span>`;
      return;
    }
    btn.disabled = false;
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
  // en rad för varje vald match (Papper.builder i papper.js), i den ordning
  // de valdes. Kupongen har tretton matcher (Papper.RADER). Rutorna står
  // tomma tills var och en fyller i sin kupong. Hämta Stryktipset fyller
  // kupongen med veckans Stryktips i Svenska Spels ordning (folket.js) – en
  // ny kupong börjar med det.
  function renderStart(edit) {
    const s = SM.data;
    // Matcherna står fast när någon har lämnat in.
    if (edit && (!s || s.visas || s.gang.some((g) => g.inne))) {
      location.hash = 'kupong';
      return;
    }
    SM.pick = { ids: new Set(edit ? s.matcher.map((x) => x.id) : []), spel: undefined };
    SM.allDays = false;
    const comps = [{ id: 'all', short: 'Alla', name: 'Alla tävlingar' }, ...state.comps.values()];
    const tools = '<div class="toolbar kp-tools">' +
      `<input type="search" id="sm-q" class="kp-search" placeholder="Sök lag" autocomplete="off" value="${esc(SM.q)}">` +
      '<div class="chips" id="sm-comps" role="group" aria-label="Tävling">' + comps.map((c) =>
        `<button type="button" data-comp="${c.id}" title="${esc(c.name)}" aria-pressed="${c.id === SM.comp}">${esc(c.short)}</button>`).join('') + '</div></div>';
    $('#coupon').innerHTML = roundSteps(1) +
      '<div class="kp-head"><div>' + (edit ? nameBlock(s, 'rad') : '<p class="kp-eyebrow">Omgångens kupong</p>') +
      `<h2 class="page-title">${edit ? 'Ändra matcherna' : 'Välj matcher'}</h2></div>` +
      '<div class="kp-actions">' +
      (window.Folket && info().endpoint ? '<button type="button" class="kp-btn" id="sm-stryk" title="Veckans Stryktips från Svenska Spel, i deras ordning">Hämta Stryktipset</button>' : '') +
      '<a class="kp-btn" href="#kupong">Avbryt</a></div></div>' +
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
    if ($('#sm-stryk')) $('#sm-stryk').addEventListener('click', () => importStryk(edit));
    pickList();
    // En ny kupong börjar med veckans Stryktips.
    if (!edit && $('#sm-stryk')) importStryk(false, true);
  }

  // Veckans Stryktips från Svenska Spel blir kupongens matcher, i deras
  // ordning. Matcher som inte finns på sajten (andra ligor) eller som har
  // startat kommer inte med – då står det vilka. first: en ny kupong börjar
  // med Stryktipset (renderStart) – tyst om ingen omgång är öppen, om man
  // hunnit välja själv eller om omgången som pågår redan är Stryktipset.
  async function importStryk(edit, first = false) {
    const msg = (h) => { $('#sm-msg').innerHTML = h; };
    const btn = $('#sm-stryk');
    btn.disabled = true;
    msg('Hämtar Stryktipset …');
    const got = await Folket.open();
    if (!here(edit ? 'matcher' : 'ny')) return;
    btn.disabled = false;
    const s = SM.data;
    if (first && (!got || SM.pick.ids.size || (s && s.spel && s.spel.nr === got.omgang.nr && !over(s)))) {
      msg('');
      return;
    }
    if (!got) {
      msg('<span class="note">Svenska Spel har ingen öppen Stryktipsomgång just nu.</span>');
      return;
    }
    const now = Date.now();
    const ok = got.rows.filter((r) => r.m && isOpen(r.m, now));
    const out = got.rows.filter((r) => !ok.includes(r));
    SM.pick.ids = new Set(ok.map((r) => r.m.id));
    SM.pick.spel = { namn: 'Stryktipset', nr: got.omgang.nr };
    SM.q = '';
    if ($('#sm-q')) $('#sm-q').value = '';
    pickList();
    // I telefonen dras kupongen fram, som efter Ladda upp system.
    if (!first && window.matchMedia('(max-width: 640px)').matches) Papper.open('sm-build');
    const v = got.omgang.vecka ? ` v ${got.omgang.vecka}` : '';
    msg(out.length
      ? `<span class="note">Stryktipset${esc(v)}: ${out.map((r) => `${esc(r.nr)}. ${esc(r.hemma)} – ${esc(r.borta)}${r.m ? ' har startat' : ''}`).join(', ')} kom inte med.</span>`
      : `Stryktipset${esc(v)}.`);
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
    Papper.slip('sm-build', { rows: [...ids].map((id) => ({ id, m: matchById(id) })), max: Papper.RADER, ordered: true });
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
    // Hämtades matcherna från Stryktipset följer omgångens nummer med.
    const spel = SM.pick.spel;
    const out = edit
      ? await send({ gor: 'matcher', id: SM.data.id, matcher: ids, spel })
      : await send({ gor: 'starta', matcher: ids, ersatt, spel });
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
    const du = v && s.gang.find((g) => g.id === v);
    const go = !open ? 'Till uppgörelsen' : done ? 'Se de andras tips'
      : du && tally(s, du) ? 'Fyll i resten' : 'Fyll i kupongen';
    const all = s.matcher.length;
    return '<div class="card sm-teaser">' +
      nameBlock(s, 'ruta') +
      // Porträtten: ring i egen färg och bock = inne, grått = inte inne,
      // tårtbit = så mycket som är tippat när kupongen inte är färdig,
      // guldring = du. Lagerkrans och fjäder i övre hörnet = regerande
      // orakel och Ikaros (kronan.js).
      '<div class="sm-faces">' + s.gang.map((g) => {
        const st = g.inne || open ? lage(s, g) : 'lämnade inte in';
        const n = tally(s, g);
        const badge = g.inne ? (n < all ? pie(n, all, true) : CHECK) : open && n ? pie(n, all) : '';
        return `<span class="sm-face sm-p${pnum(g.id)}${person(g.id).bild ? ' bild' : ''}${g.inne ? ' inne' : ''}${g.id === v ? ' du' : ''}" title="${esc(`${g.namn} · ${st}`)}">` +
          `${photo(g.id)}${window.Kronan ? Kronan.mark(g.id) : ''}${badge}</span>`;
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

  // ---------- kommentarerna i efterhand ----------

  // Din kommentar sparas i tjänsten när du lämnar fältet (Enter gör det
  // också; Esc ångrar). Det du skriver står kvar när papperet ritas om under
  // tiden – i uppgörelsen och på gängets kupong.
  const afterField = (e) => (e.target.closest ? e.target.closest('#coupon input[data-efter]') : null);
  async function saveAfter(id) {
    const s = SM.data;
    const v = s && writer(s);
    if (!v || !(id in SM.writing) || SM.sending.has(id)) return;
    const raw = SM.writing[id];
    const text = raw.replace(/\s+/g, ' ').trim();
    if (text === ((((s.efter && s.efter[v]) || {})[id] || {}).text || '')) {
      delete SM.writing[id];
      delete SM.failed[id];
      return;
    }
    SM.sending.add(id);
    const out = await send({ gor: 'efter', id: s.id, vem: v, match: id, text, ...oldKey(s) });
    SM.sending.delete(id);
    if (out.ok) {
      delete SM.failed[id];
      if (SM.writing[id] === raw) delete SM.writing[id];
    } else {
      SM.failed[id] = out.error;
    }
    redraw();
    // Skrev du vidare medan den sparades, och har lämnat fältet: spara igen.
    const f = document.activeElement;
    if (out.ok && id in SM.writing && !(f && f.dataset && f.dataset.efter === id)) saveAfter(id);
  }
  document.addEventListener('input', (e) => {
    const f = afterField(e);
    if (f) SM.writing[f.dataset.efter] = f.value.slice(0, NOTE_MAX);
  });
  document.addEventListener('focusout', (e) => {
    const f = afterField(e);
    if (f) saveAfter(f.dataset.efter);
  });
  document.addEventListener('keydown', (e) => {
    const f = afterField(e);
    if (!f || (e.key !== 'Enter' && e.key !== 'Escape')) return;
    e.preventDefault();
    if (e.key === 'Escape') {
      delete SM.writing[f.dataset.efter];
      delete SM.failed[f.dataset.efter];
      const v = SM.data && writer(SM.data);
      f.value = ((v && SM.data.efter && SM.data.efter[v] && SM.data.efter[v][f.dataset.efter]) || {}).text || '';
    }
    f.blur();
  });
  // Går du från sidan sparas det du har skrivit.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) for (const id of Object.keys(SM.writing)) saveAfter(id);
  });

  // Ett tryck på någons porträtt överst – i uppgörelsen och på gängets
  // kupong – lyfter fram hens tips; ett tryck till visar allas igen. Papperet
  // ritas inte om: raden överst får data-lyft, och samtal.css tonar ner de
  // andras porträtt i rutorna.
  document.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('#coupon button[data-lyft]') : null;
    if (!b) return;
    SM.lyft = SM.lyft === b.dataset.lyft ? null : b.dataset.lyft;
    const hd = b.closest('.sm-hd');
    if (SM.lyft) hd.dataset.lyft = pnum(SM.lyft);
    else delete hd.dataset.lyft;
    for (const x of hd.querySelectorAll('button[data-lyft]')) x.setAttribute('aria-pressed', String(x.dataset.lyft === SM.lyft));
  });

  // Omgångens matcher (liveställningen i kupong.js hämtar dem också), om
  // allas tips visas, gängets kupong ur omgången och bevakningen av
  // förstasidans ruta.
  const ids = () => (SM.data ? SM.data.matcher.map((x) => x.id) : []);
  const visible = () => Boolean(SM.data && SM.data.visas);
  const made = () => (SM.data && SM.data.visas ? existing(SM.data) : null);
  const watch = () => { if (active() && !SM.data.visas) poll(); };

  window.Samtal = { show, load, active, covers, teaser, ids, visible, made, watch, paper, title, keep: keepFocus, name: () => nameOf(SM.data), redraw: () => { if (here('')) renderRound(); } };
})();
