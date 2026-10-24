'use strict';

// Kortregistret i tobaksaffären (rum.js): en kortlåda i teak på disken under
// anslagstavlans högra hörn, i three.js (rum-kortlada.js). I lådan står ett
// registerkort per lag i omgången (A–Ö) bakom avdelaren Lagen och ett blått
// kort per match bakom avdelaren Mötena. Korten har det om lagen som tv:n och
// tavlan inte visar:
//   lagkortet   maskinskrivet: ligan (V–O–F, mål och poäng), hemma och borta,
//               formen, xG för och mot, modellens styrka med placeringen i
//               divisionen, motståndet hittills, oddsen (favorit och poäng mot
//               oddsen), bäste målskytten och nästa match – ur
//               data/teams/<division>.json, matcherna och matchens fil
//   mötet       de senaste mötena med datum, tävling och resultat, och
//               hemmalagets V–O–F i dem (matchens fil)
//
// Ett klick på lådan (eller R): den lyfter från disken, vänder sig mot en och
// lutar så att man ser ner i den, medan rummet mörknar bakom; den lutar lite
// efter musen, och kortet under pekaren reser sig. Ett klick på ett kort: det
// reser sig ur lådan och tas i handen i läsbar storlek, och pilarna bläddrar.
// Esc, ett klick utanför eller Sätt tillbaka sätter tillbaka kortet, och Esc
// igen, R eller ett klick utanför lådan ställer den på disken igen.
//
// Dolda resultat (Spoiler): lagkorten visar bara namnet och ? när en match i
// lagens divisioner är dold – samma nyckel som anslagstavlan, så att Visa
// ändå gäller båda – och dolda möten står som ?.
//
// Slitaget: kortens vinklar i lådan och i handen, hundöronen och kafferingen
// skiftar med dagen.
//
// RumRegister.html() → länken på disken med duken (i planet -600 i rum.js)
// RumRegister.nara() → närbilden
// RumRegister.mount(root, { calm, kort, close }) → { fill(ms, all), ready(), wait(), open(on, från), on(), at(), lift(id), key(k) }

window.RumRegister = (() => {
  const DAY = 86400000;
  const TZ = 'Europe/Stockholm';
  const DIVS = ['pl', 'ch', 'l1', 'l2'];
  const DIVNAME = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two' };
  const MAN = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const MOTEN = 8;
  // cuperna i schemat (matchens fil) som på sajten; Europacuperna heter CL, EL och ECL
  const TAV = { EFL: 'Ligacupen', FAC: 'FA-cupen' };
  // duken på disken (scenens px), där lådan syns med sin skugga
  const BOX = { x: 1172, y: 430, w: 190, h: 136 };
  // kortet i handen ritas i 487 × 346 (A6) med fliken ovanpå
  const CW = 487;
  const CH = 346;
  const TAB = 44;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r1 = (x) => Math.round(x * 10) / 10;
  const num = (x, d = 1) => Math.abs(x).toFixed(d).replace('.', ',');
  const signed = (x, d = 1) => {
    const t = num(x, d);
    return Number(t.replace(',', '.')) === 0 ? t : x > 0 ? `+${t}` : `−${t}`;
  };
  const pct = (x) => `${Math.round(x * 100)} %`;
  const ord = (n) => `${n}:${(n % 10 === 1 || n % 10 === 2) && n % 100 !== 11 && n % 100 !== 12 ? 'a' : 'e'}`;
  function rng(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const getJSON = (path) => fetch(path, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

  // ---------- datan ----------

  const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  // '15 mar 2025' ur ett datum (ÅÅÅÅ-MM-DD) eller en avspark
  function dag(s) {
    const [y, m, d] = (/^\d{4}-\d\d-\d\d$/.test(s) ? s : fDay.format(new Date(s))).split('-').map(Number);
    return `${d} ${MAN[m - 1]} ${y}`;
  }

  const hidden = (m) => Boolean(window.Spoiler && Spoiler.hidden(m));
  const off = (m) => /POSTPONED|CANCEL|ABANDON|SUSPEND/.test(m.status || '');
  // V, O eller F för laget efter 90 minuter
  function letter(m, team) {
    const s = m.score90 || m.score;
    if (!s) return '';
    const [f, a] = m.home === team ? [s.home, s.away] : [s.away, s.home];
    return f > a ? 'V' : f < a ? 'F' : 'O';
  }
  // Lagets matcher (alla tävlingar), senaste först.
  function byTeam(all) {
    const map = new Map();
    for (const m of all) {
      if (off(m)) continue;
      for (const t of [m.home, m.away]) {
        if (!map.has(t)) map.set(t, []);
        map.get(t).push(m);
      }
    }
    for (const l of map.values()) l.sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
    return map;
  }
  // Hemma- och bortaraden i ligan ur matcherna.
  function split(list, team, comp) {
    const r = { home: { n: 0, w: 0, d: 0, l: 0 }, away: { n: 0, w: 0, d: 0, l: 0 } };
    for (const m of list || []) {
      if (!m.completed || m.comp !== comp) continue;
      const l = letter(m, team);
      if (!l) continue;
      const x = r[m.home === team ? 'home' : 'away'];
      x.n++;
      x[l === 'V' ? 'w' : l === 'O' ? 'd' : 'l']++;
    }
    return r;
  }

  // ---------- korten ----------

  const blank = (n) => Array.from({ length: n }, () => '<span class="r tom"></span>').join('');
  // en rad: rubriken och värdet; null = väntar på matchens fil (tom rad)
  const row = (label, value) => `<span class="r"><b>${label}</b><span>${value == null ? '' : value || '–'}</span></span>`;
  const vof = (r) => (r && r.n ? `${r.w}–${r.d}–${r.l}` : '–');

  function lagkort(D, x) {
    const { name, side, m, t } = x;
    const comp = t ? t.comp : null;
    const crest = window.Skoldar && Skoldar.has(name) ? `<span class="reg-skold">${Skoldar.img(name)}</span>` : '';
    const under = comp ? `${DIVNAME[comp]}${t.rank && !D.veil ? `, <span class="ring">${ord(t.rank)}</span>` : ''}` : 'Utanför ligorna';
    const head = `${crest}<h4>${esc(name)}</h4><p class="reg-under">${under}</p>`;
    if (D.veil) return `${head}<p class="dolt">?</p>`;
    const d = D.match.get(m.id);
    const T = d && d.teams && d.teams[side];
    const fd = t && t.fd;
    // formen: de fem senaste före avspark i alla tävlingar, den senaste först
    // (matchens fil, med Europacuperna, som på tv:n; annars ur matcherna);
    // förlusterna i rött
    const cell = (l, q) => (q ? '<i class="q">?</i>' : `<i class="${l.toLowerCase()}">${l}</i>`);
    const before = Date.parse(m.kickoff);
    const f = T && T.form
      ? T.form.slice(0, 5).map((y) => cell(y.result || '?', window.Spoiler && Spoiler.hidesDay(y.date))).join('')
      : (D.teams.get(name) || []).filter((y) => y.completed && Date.parse(y.kickoff) < before).slice(0, 5).map((y) => cell(letter(y, name), hidden(y))).join('');
    const ha = comp ? split(D.teams.get(name), name, comp) : null;
    const xg = fd && fd.xg && fd.xg.n ? fd.xg : null;
    const mkt = fd && fd.mkt && fd.mkt.n ? fd.mkt : null;
    const opp = fd && fd.opp != null ? fd.opp : null;
    let str = '';
    if (t && t.str != null) {
      const i = (D.divs[comp] || []).findIndex((y) => y.name === name);
      str = `${signed(t.str, 2)}${i >= 0 ? ` · ${ord(i + 1)} i ligan` : ''}`;
    }
    const sum = d && d.squads && d.squads[side] && d.squads[side].summary;
    const top = sum && sum.topScorer && sum.topScorer.g
      ? `${esc(sum.topScorer.name)} ${sum.topScorer.g} mål${sum.topScorerShare ? ` (${pct(sum.topScorerShare)})` : ''}`
      : d === undefined ? null : '';
    const nx = T && T.schedule && T.schedule.next;
    const next = nx && nx.days != null
      ? `${esc(D.kort(nx.opponent))} ${nx.home ? 'hemma' : 'borta'} om ${nx.days} d${nx.comp && nx.comp !== (comp || '').toUpperCase() ? ` (${esc(TAV[nx.comp] || nx.comp)})` : ''}`
      : d === undefined ? null : '';
    return head + '<span class="reg-rader">' +
      row('Ligan', t ? `${t.w}–${t.d}–${t.l} · ${t.gf}–${t.ga} · ${t.pts} p` : '') +
      `<span class="r"><b>Hemma</b><span>${ha ? vof(ha.home) : '–'}<b class="mitt">Borta</b>${ha ? vof(ha.away) : '–'}</span></span>` +
      row('Formen', f ? `<span class="reg-form">${f}</span>` : '') +
      row('xG', xg ? `${num(xg.f / xg.n, 2)} för · ${num(xg.a / xg.n, 2)} mot` : '') +
      row('Styrka', str) +
      row('Motstånd', opp != null ? `${signed(opp, 2)} · ${opp > 0.05 ? 'tufft hittills' : opp < -0.05 ? 'lätt hittills' : 'som snittet'}` : '') +
      row('Oddsen', mkt ? `favorit ${mkt.fav} av ${mkt.n} · ${signed(mkt.pts - mkt.xp)} p` : '') +
      row('Skytten', top) +
      row('Nästa', next) + '</span>';
  }

  function motet(D, m) {
    const head = `<h4>${esc(D.kort(m.home))} – ${esc(D.kort(m.away))}</h4><p class="reg-under">De senaste mötena</p>`;
    const d = D.match.get(m.id);
    if (d === undefined) return head + blank(8);
    const list = !d ? [] : [
      ...(d.meetings || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.kickoff), x, when: x.kickoff, comp: x.compShort, hide: window.Spoiler && Spoiler.hidesDay(x.kickoff) })),
      ...((d.pastMeetings && d.pastMeetings.list) || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.date), x, when: x.date, comp: x.compShort, hide: false })),
    ].sort((a, b) => b.t - a.t).slice(0, MOTEN);
    if (!list.length) return `${head}<p class="inget">Har inte mötts</p>`;
    const n = { V: 0, O: 0, F: 0 };
    const rows = list.map(({ x, when, comp, hide }) => {
      if (!hide) n[letter(x, m.home)]++;
      return `<span class="m"><span>${dag(when)}</span><span>${esc(comp || '')}</span><span class="lag">${esc(D.kort(x.home))} – ${esc(D.kort(x.away))}</span>` +
        `<span class="res">${hide ? '<i class="q">?</i>' : `${x.score.home}–${x.score.away}`}</span></span>`;
    }).join('');
    return `${head}<span class="reg-moten">${rows}</span><p class="reg-summa">${esc(D.kort(m.home))}: ${n.V} V · ${n.O} O · ${n.F} F</p>`;
  }

  // Korten i lådan, framifrån: avdelaren Lagen, lagen A–Ö, avdelaren Mötena
  // och mötena i omgångens ordning. Flikarna sitter på fem platser (lagen)
  // eller tre (mötena), så att varje flik syns ovanför dem framför den.
  function deck(D) {
    const cards = [{ id: 'lagen', kind: 'skilj', tab: { text: 'LAGEN', at: 0, span: 1.7 }, cls: 'gron' }];
    D.round.slice().sort((a, b) => a.name.localeCompare(b.name, 'sv')).forEach((x, i) => {
      cards.push({ id: `lag:${x.name}`, kind: 'lag', x, dv: x.t ? x.t.comp : null, tab: { text: D.kort(x.name), at: (i + 2) % 5, span: 1 } });
    });
    cards.push({ id: 'moten', kind: 'skilj', tab: { text: 'MÖTENA', at: 3.3, span: 1.7 }, cls: 'rod' });
    D.ms.forEach((m, i) => {
      cards.push({ id: `mote:${m.id}`, kind: 'mote', m, tab: { text: `${D.kort(m.home)}–${D.kort(m.away)}`, at: (i % 3) * (5 / 3), span: 5 / 3 } });
    });
    return cards;
  }
  const inner = (D, c) => (c.kind === 'lag' ? lagkort(D, c.x) : c.kind === 'mote' ? motet(D, c.m) : '');

  // Dagens slitage: kortens lutning och vridning i lådan, vinkeln i handen,
  // hundöron och en kaffering.
  function wear(seed, cards) {
    const R0 = rng(seed);
    const map = new Map();
    const ring = 1 + Math.floor(R0() * (cards.length - 1));
    cards.forEach((c, i) => map.set(c.id, {
      lut: r1(R0() * 3.5), vri: r1((R0() - 0.5) * 1.6), rot: r1((R0() - 0.5) * 2.4),
      hund: c.kind !== 'skilj' && R0() < 0.22, kaffe: i === ring && c.kind !== 'skilj', kx: Math.round(60 + R0() * 280), ky: Math.round(90 + R0() * 150),
    }));
    return map;
  }

  function html() {
    return `<a class="rum-reg rum-sak" id="rum-reg" href="statistik.html#pl/lag" data-nav="statistik" aria-label="Kortregistret" ` +
      `style="left:${BOX.x}px; top:${BOX.y}px; width:${BOX.w}px; height:${BOX.h}px"><canvas class="reg-duk" id="reg-duk"></canvas></a>`;
  }

  function nara() {
    return '<div class="rum-regn" id="rum-regn" role="dialog" aria-label="Kortregistret" tabindex="-1"><div class="reg-bak"></div><div class="reg-3d" id="reg-3d"></div>' +
      '<div class="reg-fot" id="reg-fot"><a class="rum-guld" href="statistik.html#pl/lag" data-nav="statistik">Lagen</a></div>' +
      '<div class="reg-lyft" id="reg-lyft"></div>' +
      '<div class="reg-rad" id="reg-rad"><span id="reg-sp"></span><button type="button" class="reg-tbx" data-reg="tillbaka">Sätt tillbaka</button></div></div>';
  }

  const ease = 'cubic-bezier(0.45, 0, 0.2, 1)';

  // ---------- i rummet ----------

  function mount(root, o) {
    const A = { on: false, ms: [], all: [], byTeam: new Map(), match: new Map(), stats: null, divs: {}, loaded: 0, html: '', lyft: null, seed: -1, cards: [], L: null };
    const small = root.querySelector('#rum-reg');
    const duk = root.querySelector('#reg-duk');
    const ov = root.querySelector('#rum-regn');
    const fot = root.querySelector('#reg-fot');
    const lyftEl = root.querySelector('#reg-lyft');
    const rad = root.querySelector('#reg-rad');
    const sp = root.querySelector('#reg-sp');
    if (!small || !ov) return null;

    // lådan i three.js (hämtas med rummet; utan WebGL står disken tom)
    A.Lp = import('./rum-kortlada.js').then((m) => m.kortlada({ duk, nara: root.querySelector('#reg-3d'), calm: o.calm, box: BOX }))
      .then((L) => { A.L = L; A.ids = ''; draw(); })
      .catch((err) => console.warn('Rummet: kortlådan kunde inte ritas', err));

    // lagfilerna (placering, styrka, xG, oddsen) – om igen efter en kvart
    function loadTeams() {
      if (A.loading || Date.now() - A.loaded < 15 * 60000) return A.loading;
      A.loading = Promise.all(DIVS.map((d) => getJSON(`data/teams/${d}.json`).catch(() => null))).then((files) => {
        const map = new Map();
        const divs = {};
        files.forEach((f, i) => {
          if (!f || f.unknown) return;
          for (const t of f.teams || []) map.set(t.name, { ...t, comp: DIVS[i] });
          divs[DIVS[i]] = (f.teams || []).filter((t) => t.str != null).slice().sort((a, b) => b.str - a.str);
        });
        A.stats = map;
        A.divs = divs;
        A.loaded = Date.now();
        A.loading = null;
        draw();
      });
      return A.loading;
    }
    // matchernas filer (skytten, nästa match, mötena) hämtas när lådan tas fram
    function loadMatches() {
      for (const m of A.ms) {
        if (A.match.has(m.id)) continue;
        A.match.set(m.id, undefined);
        getJSON(`data/match/${encodeURIComponent(m.id)}.json`).then((d) => { A.match.set(m.id, d); draw(); })
          .catch(() => { A.match.set(m.id, null); draw(); });
      }
    }

    function data() {
      const stats = A.stats || new Map();
      const round = [];
      for (const m of A.ms) for (const side of ['home', 'away']) round.push({ name: m[side], side, m, t: stats.get(m[side]) || null });
      // dolda resultat i lagens divisioner: samma nyckel som anslagstavlan
      let veil = false;
      let key = '';
      let n = 0;
      if (window.Spoiler && Spoiler.on()) {
        const comps = new Set(round.filter((x) => x.t).map((x) => x.t.comp));
        const recent = A.all.filter((m) => comps.has(m.comp) && Spoiler.hides(m.kickoff));
        n = recent.filter(Spoiler.hidden).length;
        key = `ans:${recent.map((m) => m.id).sort().join(',')}`;
        veil = n > 0 && !Spoiler.isShown(key);
      }
      return { ms: A.ms, round, teams: A.byTeam, match: A.match, divs: A.divs, kort: o.kort, veil, key, n };
    }

    function draw() {
      const D = data();
      A.D = D;
      const cards = deck(D);
      A.cards = cards;
      // lådan ritas om när korten eller flikarna (eller dagen) ändras
      const seed = Math.floor(Date.now() / DAY);
      const ids = `${seed}|${cards.map((c) => `${c.id}:${c.dv || ''}:${c.tab.text}`).join('|')}`;
      if (ids !== A.ids) {
        A.ids = ids;
        A.W = wear(seed * 13 + 5, cards);
        if (A.L) {
          A.L.deck(cards, A.W);
          A.L.paint();
          if (A.lyft) A.L.hide(A.lyft.id, true);
        }
      }
      const content = new Map(cards.map((c) => [c.id, inner(D, c)]));
      A.content = content;
      const h = JSON.stringify([...content.values()]);
      if (h === A.html) return;
      A.html = h;
      if (A.lyft) {
        const c = cards.find((x) => x.id === A.lyft.id);
        const el = lyftEl.querySelector('.reg-in');
        if (c && el) el.innerHTML = content.get(c.id);
        spoilerRow(c);
      }
    }

    // Lådans ruta på disken i fönstret, där den står just nu.
    const at = () => small.getBoundingClientRect();

    function place(box) {
      if (!box) return;
      Object.assign(fot.style, { left: `${r1(box.left)}px`, width: `${r1(box.width)}px`, top: `${r1(box.top + box.height + 10)}px` });
    }

    function open(on, from) {
      if (on === A.on || !A.L) return Promise.resolve();
      A.on = on;
      if (on) {
        loadMatches();
        draw();
        ov.classList.add('on');
        ov.classList.remove('ute', 'framme');
        const r = from || at();
        const p = A.L.open(true, o.calm() ? null : r);
        small.classList.add('borta');
        if (A.L.box()) place(A.L.box());
        return p.then((box) => {
          if (!A.on) return;
          place(box);
          ov.classList.add('framme');
          ov.focus({ preventScroll: true });
        });
      }
      drop(true);
      A.L.hover(null);
      ov.classList.remove('framme');
      ov.classList.add('ute');
      ov.style.cursor = '';
      const end = () => {
        if (A.on) return;
        if (ov.contains(document.activeElement)) small.focus({ preventScroll: true });
        ov.classList.remove('on', 'ute');
        small.classList.remove('borta');
      };
      return A.L.open(false, o.calm() ? null : from || at()).then(end);
    }

    // Lutar efter musen, och kortet under pekaren reser sig.
    ov.addEventListener('mousemove', (e) => {
      if (!A.on || !A.L) return;
      if (A.lyft) { A.L.hover(null); ov.style.cursor = ''; return; }
      if (!o.calm()) A.L.tilt((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
      const id = e.target.closest('.reg-fot, .reg-rad') ? null : A.L.pick(e.clientX, e.clientY);
      A.L.hover(id);
      ov.style.cursor = id ? 'pointer' : '';
    });
    addEventListener('resize', () => {
      if (!A.on || !A.L) return;
      place(A.L.resize());
      if (A.lyft && A.lyft.framme) placeLyft();
    });

    // ---------- ett kort i handen ----------

    function held() {
      const sm = innerWidth < 700;
      const s = Math.min((innerHeight - (innerHeight < 500 ? 110 : 210)) / (CH + TAB), (innerWidth - (sm ? 24 : 160)) / CW, 1.9);
      return { x: innerWidth / 2, y: (innerHeight - 70) / 2 + (TAB * s) / 2, s };
    }
    const handT = (x, y, s, ax, rot) => `translate(${r1(x - CW / 2)}px, ${r1(y - CH / 2)}px) scale(${s.toFixed(3)}) perspective(1400px) rotateX(${r1(ax)}deg) rotate(${rot}deg)`;
    // samma plats, storlek och lutning som kortet i lådan
    function fromRect(r) {
      const s = r.width / CW;
      const k = Math.min(1, (r.height / r.width) / (CH / CW));
      return handT(r.left + r.width / 2, r.top + r.height / 2, s, -Math.acos(k) / (Math.PI / 180), 0);
    }
    function placeLyft() {
      const w = A.W.get(A.lyft.id) || { rot: 0 };
      const h = held();
      const card = lyftEl.firstElementChild;
      rad.style.top = `${r1(h.y + (CH * h.s) / 2 + 20)}px`;
      card.style.transform = handT(h.x, h.y, h.s, 0, w.rot);
    }

    function spoilerRow(c) {
      const D = A.D;
      sp.innerHTML = D && D.veil && c && c.kind === 'lag' && window.Spoiler
        ? Spoiler.card({ title: `${D.n} ${D.n === 1 ? 'match' : 'matcher'} är dolda`, text: 'Kortet räknar med resultaten.', keys: [D.key] })
        : '';
    }

    function lift(id) {
      let i = A.cards.findIndex((x) => x.id === id);
      if (i < 0 || !A.L) return;
      // avdelaren: det första kortet bakom den
      if (A.cards[i].kind === 'skilj') i++;
      const c = A.cards[i];
      if (!c || c.kind === 'skilj') return;
      if (A.lyft) drop(true);
      const me = { id: c.id };
      A.lyft = me;
      ov.classList.add('lyft');
      ov.style.cursor = '';
      A.L.hover(null);
      const w = A.W.get(c.id) || {};
      const kaffe = w.kaffe ? `<i class="reg-kaffe" style="left:${w.kx}px; top:${w.ky}px"></i>` : '';
      const tw = (c.tab.span * CW) / 5;
      // texten på fliken krymper tills den ryms, som i lådan
      const fs = Math.min(c.kind === 'lag' ? 14 : 13, (tw - 24) / (c.tab.text.length * 0.6));
      lyftEl.innerHTML = `<div class="reg-kort i-handen k-${c.kind}${c.dv ? ` dv-${c.dv}` : ''}${w.hund ? ' hund' : ''}" style="width:${CW}px; height:${CH}px">` +
        `<span class="reg-flik" style="left:${r1((c.tab.at * CW) / 5 + 3)}px; width:${r1(tw - 6)}px; height:${TAB}px; top:${-TAB + 6}px; font-size:${r1(fs)}px"><span>${esc(c.tab.text)}</span></span>` +
        `<span class="reg-in">${A.content.get(c.id)}</span>${kaffe}</div>`;
      spoilerRow(c);
      const card = lyftEl.firstElementChild;
      card.style.visibility = 'hidden';
      A.L.rise(c.id, true).then(() => {
        if (A.lyft !== me) return;
        const r = A.L.rect(c.id);
        A.L.hide(c.id, true);
        me.framme = true;
        placeLyft();
        card.style.visibility = '';
        if (!o.calm() && r) card.animate([{ transform: fromRect(r) }, { transform: card.style.transform }], { duration: 480, easing: ease });
        rad.querySelector('button').focus({ preventScroll: true });
      });
    }

    function drop(now) {
      if (!A.lyft) return;
      const { id, framme } = A.lyft;
      A.lyft = null;
      const card = lyftEl.firstElementChild;
      const back = () => {
        A.L.hide(id, false);
        A.L.rise(id, false);
        if (!A.lyft) lyftEl.innerHTML = '';
      };
      ov.classList.remove('lyft');
      sp.innerHTML = '';
      if (now || o.calm() || !card || !framme) { if (card) card.style.visibility = 'hidden'; back(); return; }
      const r = A.L.rect(id);
      if (!r) { back(); return; }
      const to = fromRect(r);
      card.animate([{ transform: card.style.transform }, { transform: to }], { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }).finished.then(back, back);
      card.style.transform = to;
    }

    // pilarna: nästa eller förra kortet (avdelarna hoppas över)
    function step(dir) {
      const list = A.cards.filter((x) => x.kind !== 'skilj');
      if (!list.length) return;
      const i = A.lyft ? list.findIndex((x) => x.id === A.lyft.id) : dir > 0 ? -1 : 0;
      const c = list[(i + dir + list.length) % list.length];
      drop(true);
      lift(c.id);
    }

    ov.addEventListener('click', (e) => {
      if (!A.on) return;
      if (e.target.closest('a[href], .sp-show')) return;
      if (e.target.closest('[data-reg="tillbaka"]')) { drop(); return; }
      if (A.lyft) {
        if (!e.target.closest('.i-handen, .reg-rad')) drop();
        return;
      }
      const id = A.L && A.L.pick(e.clientX, e.clientY);
      if (id) { lift(id); return; }
      if (!e.target.closest('.reg-fot')) o.close();
    });

    return {
      fill(ms, all) {
        A.ms = (ms || []).slice();
        if (A.all !== all) {
          A.all = all || [];
          A.byTeam = byTeam(A.all);
        }
        if (A.on) loadMatches();
        loadTeams();
        if (window.Skoldar && Skoldar.ready && !A.crests) {
          A.crests = true;
          Skoldar.ready.then(() => { A.html = ''; draw(); });
        }
        draw();
      },
      ready: () => Boolean(A.L),
      wait: () => A.Lp,
      at,
      open,
      on: () => A.on,
      // ett kort: id:t, eller ett lag eller möte vars id innehåller texten (för bilder)
      lift(id) {
        if (!A.on) return;
        const c = A.cards.find((x) => x.id === id) || A.cards.find((x) => x.kind !== 'skilj' && x.id.includes(id));
        if (c) lift(c.id);
      },
      // Esc sätter tillbaka kortet (sedan lådan i rum.js); pilarna bläddrar
      key(k) {
        if (!A.on) return false;
        if (k === 'Escape' && A.lyft) { drop(); return true; }
        if (/^Arrow(Right|Down)$/.test(k)) { step(1); return true; }
        if (/^Arrow(Left|Up)$/.test(k)) { step(-1); return true; }
        return false;
      },
    };
  }

  return { html, nara, mount };
})();
