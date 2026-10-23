'use strict';

// Anslagstavlan i tobaksaffären (rum.js): juteväv i en träram på högra
// väggen under tv:n, med lappar på nålar. Lapparna har det på sajten som
// rummet annars inte visar, om lagen i omgången:
//   Formen         registerkort, maskinskrivet: de fem senaste före matchen
//   Skadelistan    genomslag: skadade, avstängda och osäkra (matchens fil)
//   Starkast       polaroid med skölden; på baksidan modellens starkaste och
//                  svagaste i omgången per division (data/teams/<division>.json)
//   Kryssar gärna  gul lapp: chansen till oavgjort i lagets matcher (xG)
//   Tur & otur     rutat papper: poäng mot chanserna (xG), med staplar
//   Mot oddsen     tidningsurklipp: poäng mot vad oddsen väntade sig
//   Vilan          almanacksblad: dagar sedan förra matchen
//   Inbördes       anteckningsblock: de tre senaste mötena (matchens fil)
// Ett klick på tavlan: den lossnar från väggen och flyger fram, vriden från
// väggens vinkel till rakt fram, rummet mörknar bakom och den lutar lite
// efter musen. Ett klick på en lapp tar den från nålen och fram i läsbar
// storlek (polaroiden vänds); pilarna bläddrar mellan lapparna. Esc, ett
// klick utanför eller Häng tillbaka sätter tillbaka lappen, och Esc igen
// eller ett klick utanför tavlan hänger tavlan på väggen igen.
//
// Dolda resultat (Spoiler): formen och inbördes får ?, och lapparna som
// räknar med resultaten (styrkan, krysset, turen, oddsen) står med ? och
// Visa ändå när en match i lagens divisioner är dold.
//
// Slitaget: lapparnas vinklar, nålhålen och pappersresterna efter gamla
// lappar skiftar med dagen.
//
// RumAnslag.wall() → tavlan (i onWall i rum.js, på högra väggen)
// RumAnslag.nara() → närbilden
// RumAnslag.mount(root, { calm, kort, close }) → { fill(ms, all), quad(), open(on, q), on(), key(k) }

window.RumAnslag = (() => {
  // tavlan ritas i 1000 × 568 och förminskas på väggen
  const BW = 1000;
  const BH = 568;
  const DAY = 86400000;
  const TZ = 'Europe/Stockholm';
  const DIVS = ['pl', 'ch', 'l1', 'l2'];
  const PAST_YEARS = 5;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r1 = (x) => Math.round(x * 10) / 10;
  const num = (x, d = 1) => Math.abs(x).toFixed(d).replace('.', ',');
  const signed = (x, d = 1) => {
    const t = num(x, d);
    return Number(t.replace(',', '.')) === 0 ? t : x > 0 ? `+${t}` : `−${t}`;
  };
  const pct = (x) => `${Math.round(x * 100)} %`;
  function rng(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const getJSON = (path) => fetch(path, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

  // Lapparna på tavlan: papperet, platsen, vinkeln och nålens färg.
  const NOTES = [
    { id: 'form', paper: 'kort', x: 46, y: 40, w: 318, h: 206, rot: -1.4, pin: '#c2271c', name: 'Formen' },
    { id: 'skador', paper: 'genomslag', x: 384, y: 34, w: 200, h: 232, rot: 1.1, pin: '#2a52a0', name: 'Skadelistan' },
    { id: 'styrka', paper: 'polaroid', x: 602, y: 44, w: 166, h: 214, rot: -3.2, pin: 'stift', name: 'Starkast' },
    { id: 'kryss', paper: 'postit', x: 786, y: 42, w: 176, h: 176, rot: 3, pin: '#3db37c', name: 'Kryssar gärna' },
    { id: 'tur', paper: 'rutat', x: 50, y: 290, w: 222, h: 236, rot: 1.6, pin: '#d8b06a', name: 'Tur & otur' },
    { id: 'odds', paper: 'tidning', x: 294, y: 302, w: 236, h: 212, rot: -1.1, pin: '#c2271c', name: 'Mot oddsen' },
    { id: 'vila', paper: 'almanacka', x: 550, y: 282, w: 196, h: 248, rot: 2.1, pin: '#5a5f8a', name: 'Vilan' },
    { id: 'inbordes', paper: 'linjerat', x: 766, y: 290, w: 196, h: 236, rot: -2, pin: '#e7e1d2', name: 'Inbördes' },
  ];

  // ---------- datan ----------

  const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const dayNo = (t) => Math.round(Date.parse(`${fDay.format(new Date(t))}T00:00:00Z`) / DAY);
  const fWd = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long' });
  const fDm = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'long' });

  const hidden = (m) => Boolean(window.Spoiler && Spoiler.hidden(m));
  const off = (m) => /POSTPONED|CANCEL|ABANDON|SUSPEND/.test(m.status || '');
  // V, O eller F för laget efter 90 minuter (straffar och förlängning räknas som oavgjort)
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

  // De fem senaste före matchen: [{ l: 'V' | 'O' | 'F' | '?' }]
  function form(list, team, before) {
    return (list || []).filter((m) => m.completed && Date.parse(m.kickoff) < before).slice(0, 5)
      .map((m) => (hidden(m) ? '?' : letter(m, team)));
  }
  // Dagar sedan förra matchen före avspark.
  function rest(list, m) {
    const t = Date.parse(m.kickoff);
    const prev = (list || []).find((x) => x.id !== m.id && Date.parse(x.kickoff) < t);
    return prev ? dayNo(t) - dayNo(Date.parse(prev.kickoff)) : null;
  }

  // ---------- lapparna ----------

  const rowsOf = (items) => items.join('');
  const dolt = (h) => `<h4>${h}</h4><p class="dolt">?</p>`;
  const blank = (n, cls = 'tom') => Array.from({ length: n }, () => `<span class="${cls}"></span>`).join('');

  function noteForm(D) {
    if (!D.ms.length) return '<h4>Formen</h4><p class="inget">Ingen omgång</p>';
    return '<h4>Formen</h4><div class="ans-g5">' + rowsOf(D.ms.map((m) => {
      const t = Date.parse(m.kickoff);
      const f = (team) => form(D.teams.get(team), team, t);
      const cell = (l) => l.map((x) => `<i${x === '?' ? ' class="q"' : ''}>${x}</i>`).join('');
      return `<span class="h">${esc(D.kort(m.home))}</span><span class="f">${cell(f(m.home))}</span><span class="s">–</span>` +
        `<span class="f">${cell(f(m.away))}</span><span class="a">${esc(D.kort(m.away))}</span>`;
    })) + '</div>';
  }

  const SKADA = { skadad: '', avstängd: ' (avst.)', 'ej uttagbar': '', tveksam: '?' };
  function noteSkador(D) {
    if (!D.ms.length) return '<h4>Skadelistan</h4><p class="inget">Ingen omgång</p>';
    let any = false;
    let wait = false;
    const lines = [];
    for (const m of D.ms) {
      const d = D.match.get(m.id);
      if (d === undefined || d === null) { wait = wait || d === undefined; continue; }
      for (const side of ['home', 'away']) {
        const s = d.squad && d.squad[side];
        if (!s || s.unknown) continue;
        any = true;
        if (!s.players.length) continue;
        const ps = s.players.slice().sort((a, b) => (b.minutes || 0) - (a.minutes || 0));
        const names = ps.slice(0, 3).map((p) => `${p.name}${SKADA[p.status] || ''}`).join(', ');
        lines.push(`<span class="r"><b>${esc(D.kort(m[side]))}:</b> ${esc(names)}${ps.length > 3 ? ` <em>+${ps.length - 3}</em>` : ''}</span>`);
      }
    }
    if (wait && !lines.length) return `<h4>Skadelistan</h4>${blank(8)}`;
    if (!lines.length) return `<h4>Skadelistan</h4><p class="inget">${any ? 'Inga skador' : 'Okänt'}</p>`;
    return `<h4>Skadelistan</h4>${lines.join('')}`;
  }

  // Polaroiden: skölden på framsidan, listorna på baksidan.
  function noteStyrka(D) {
    const teams = D.round.filter((x) => x.t && x.t.str != null);
    const divs = DIVS.filter((d) => teams.some((x) => x.t.comp === d));
    const etta = divs.length ? teams.filter((x) => x.t.comp === divs[0]).sort((a, b) => b.t.str - a.t.str)[0] : null;
    const crest = etta && window.Skoldar && Skoldar.has(etta.name) ? Skoldar.img(etta.name) : '<span class="skold"></span>';
    const front = `<span class="ans-foto">${D.veil ? '<b class="q">?</b>' : crest}</span>` +
      `<span class="ans-under">Starkast${etta && !D.veil ? ` – ${esc(D.kort(etta.name))}` : ''}</span>`;
    const SHORT = { pl: 'PL', ch: 'CH', l1: 'L1', l2: 'L2' };
    // de starkaste och de svagaste i omgången, per division (styrkan
    // jämförs bara inom divisionen): tre, två eller en från var och en
    const k = divs.length >= 3 ? 1 : divs.length === 2 ? 2 : 3;
    const best = [];
    const worst = [];
    for (const d of divs) {
      const l = teams.filter((x) => x.t.comp === d).sort((a, b) => b.t.str - a.t.str);
      const n = Math.min(k, Math.ceil(l.length / 2));
      best.push(...l.slice(0, n).filter((x) => x.t.str > 0));
      worst.push(...l.slice(n).slice(-k).reverse().filter((x) => x.t.str < 0));
    }
    const row = (x) => `<span class="r"><span>${esc(D.kort(x.name))}${divs.length > 1 ? ` <small>${SHORT[x.t.comp]}</small>` : ''}</span>` +
      `<span>${signed(x.t.str, 2)}</span></span>`;
    const back = D.veil ? dolt('Starkast') : best.length ? `<h4>Starkast</h4>${best.map(row).join('')}${worst.length ? `<h4>Svagast</h4>${worst.map(row).join('')}` : ''}` : '<h4>Starkast</h4><p class="inget">Okänt</p>';
    return `<span class="ans-vand"><span class="fram">${front}</span><span class="bak">${back}</span></span>`;
  }

  function teamList(D, get, n) {
    return D.round.map((x) => ({ name: x.name, v: x.t ? get(x.t) : null })).filter((x) => x.v != null && Number.isFinite(x.v))
      .sort((a, b) => b.v - a.v).slice(0, n);
  }
  const fdOf = (t, k) => (t.fd ? t.fd[k] : null);
  const xdraw = (t) => { const x = fdOf(t, 'xg'); return x && x.n ? x.xd / x.n : null; };
  const xpd = (t) => { const x = fdOf(t, 'xg'); return x ? x.pts - x.xp : null; };
  const vsOdds = (t) => { const m = fdOf(t, 'mkt'); return m ? m.pts - m.xp : null; };

  function noteKryss(D) {
    if (D.veil) return dolt('Kryssar gärna');
    const l = teamList(D, xdraw, 7);
    return '<h4>Kryssar gärna</h4>' + (l.length
      ? l.map((x) => `<span class="r"><span>${esc(D.kort(x.name))}</span><span>${pct(x.v)}</span></span>`).join('')
      : '<p class="inget">Okänt</p>');
  }

  // Två listor ur samma tal: de högsta (plus) och de lägsta (minus).
  function split(D, get, n) {
    const all = teamList(D, get, 99);
    return [all.filter((x) => x.v > 0).slice(0, n), all.filter((x) => x.v < 0).reverse().slice(0, n)];
  }
  function noteTur(D) {
    if (D.veil) return dolt('Tur &amp; otur');
    const [up, down] = split(D, xpd, 4);
    const max = Math.max(1, ...up.map((x) => x.v), ...down.map((x) => -x.v));
    const row = (x) => `<span class="r"><span>${esc(D.kort(x.name))}</span><i class="bar${x.v < 0 ? ' neg' : ''}" style="width:${r1(4 + 52 * Math.abs(x.v) / max)}px"></i>` +
      `<span>${signed(x.v)}</span></span>`;
    if (!up.length && !down.length) return '<h4>Tur &amp; otur</h4><p class="inget">Okänt</p>';
    return `<h4>Tur &amp; otur</h4><b class="d">Tur</b>${up.map(row).join('')}<b class="d">Otur</b>${down.map(row).join('')}`;
  }
  function noteOdds(D) {
    if (D.veil) return dolt('Slår oddsen');
    const [up, down] = split(D, vsOdds, 4);
    const row = (x) => `<span class="r"><span>${esc(D.kort(x.name))}</span><span>${signed(x.v)}</span></span>`;
    if (!up.length && !down.length) return '<h4>Slår oddsen</h4><p class="inget">Okänt</p>';
    return `<h4>Slår oddsen</h4>${up.map(row).join('')}<b class="d">Sviker</b>${down.map(row).join('')}`;
  }

  function noteVila(D) {
    const first = D.ms[0];
    const [dag, man] = first ? fDm.format(new Date(first.kickoff)).split(' ') : ['–', ''];
    const head = `<span class="ans-blad"><b>${esc(dag)}</b><span><small>${first ? esc(fWd.format(new Date(first.kickoff))) : ''}</small><small>${esc(man || '')}</small></span></span>`;
    if (!D.ms.length) return `${head}<p class="inget">Ingen omgång</p>`;
    return head + '<div class="ans-g3">' + D.ms.map((m) => {
      const h = rest(D.teams.get(m.home), m);
      const a = rest(D.teams.get(m.away), m);
      const tired = h != null && a != null && Math.abs(h - a) >= 2 ? (h < a ? 'h' : 'a') : '';
      const d = (x, side) => `<span class="n${tired === side ? ' trott' : ''}">${x == null ? '–' : `${x} d`}</span>`;
      return `<span class="h">${esc(D.kort(m.home))}</span>${d(h, 'h')}${d(a, 'a')}<span class="a">${esc(D.kort(m.away))}</span>`;
    }).join('') + '</div>';
  }

  function noteInbordes(D) {
    if (!D.ms.length) return '<h4>Inbördes</h4><p class="inget">Ingen omgång</p>';
    const since = Date.now() - PAST_YEARS * 365.25 * DAY;
    let wait = false;
    const rows = D.ms.map((m) => {
      const d = D.match.get(m.id);
      if (d === undefined) wait = true;
      const list = !d ? [] : [
        ...(d.meetings || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.kickoff), x, hide: window.Spoiler && Spoiler.hidesDay(x.kickoff) })),
        ...((d.pastMeetings && d.pastMeetings.list) || []).filter((x) => x.score && Date.parse(x.date) >= since).map((x) => ({ t: Date.parse(x.date), x, hide: false })),
      ].sort((a, b) => b.t - a.t).slice(0, 3);
      const l = list.map(({ x, hide }) => {
        if (hide) return '<i class="q">?</i>';
        const r = letter(x, m.home);
        return `<i>${r}</i>`;
      }).join('');
      return `<span class="h">${esc(D.kort(m.home))}</span><span class="s">–</span><span class="a">${esc(D.kort(m.away))}</span><span class="f">${d ? l || '–' : ''}</span>`;
    });
    return `<h4>Inbördes</h4><div class="ans-g4${wait ? ' vantar' : ''}">${rows.join('')}</div>`;
  }

  const BUILD = { form: noteForm, skador: noteSkador, styrka: noteStyrka, kryss: noteKryss, tur: noteTur, odds: noteOdds, vila: noteVila, inbordes: noteInbordes };
  const VEILED = new Set(['styrka', 'kryss', 'tur', 'odds']);

  // ---------- tavlan ----------

  // Dagens slitage: vinklarna och platserna rör sig lite, och gamla nålhål
  // och hörn av rivna lappar sitter där de sitter just den dagen.
  function wear(seed) {
    const R0 = rng(seed);
    const notes = NOTES.map((n) => ({ ...n, rot: r1(n.rot + (R0() - 0.5) * 2.2), x: n.x + Math.round((R0() - 0.5) * 6), y: n.y + Math.round((R0() - 0.5) * 6) }));
    let marks = '';
    for (let i = 0; i < 26; i++) marks += `<i class="ans-hal" style="left:${Math.round(40 + R0() * 920)}px; top:${Math.round(36 + R0() * 496)}px"></i>`;
    for (let i = 0; i < 4; i++) {
      const x = Math.round(60 + R0() * 860);
      const y = Math.round(40 + R0() * 480);
      const c = ['#f1ead6', '#f3e58a', '#ddd5c0', '#fbf7ec'][i % 4];
      marks += `<i class="ans-rest" style="left:${x}px; top:${y}px; background:${c}; transform: rotate(${Math.round((R0() - 0.5) * 60)}deg)"><b class="ans-nal" style="background:${['#c2271c', '#2a52a0', '#3db37c', '#d8b06a'][(R0() * 4) | 0]}"></b></i>`;
    }
    // där en stor affisch hängt länge är juten mindre gulnad
    marks += `<i class="ans-blek" style="left:${Math.round(120 + R0() * 500)}px; top:${Math.round(60 + R0() * 200)}px; transform: rotate(${r1((R0() - 0.5) * 3)}deg)"></i>`;
    return { notes, marks };
  }

  // Nålens plats: mitt upptill på lappen, vriden med den.
  function pinAt(n) {
    const a = (n.rot * Math.PI) / 180;
    const dy = 9 - n.h / 2;
    return [r1(n.x + n.w / 2 - dy * Math.sin(a)), r1(n.y + n.h / 2 + dy * Math.cos(a))];
  }
  function pin(n) {
    const [x, y] = pinAt(n);
    return n.pin === 'stift'
      ? `<b class="ans-stift" data-pin="${n.id}" style="left:${x}px; top:${y}px"></b>`
      : `<b class="ans-nal" data-pin="${n.id}" style="left:${x}px; top:${y}px; background:${n.pin}"></b>`;
  }
  const noteHtml = (n, inner, wall) => `<${wall ? 'span' : 'button type="button"'} class="ans-lapp p-${n.paper}" data-lapp="${n.id}" ` +
    `style="left:${n.x}px; top:${n.y}px; width:${n.w}px; height:${n.h}px; --rot:${n.rot}deg"${wall ? '' : ` aria-label="${esc(n.name)}"`}>` +
    `<span class="ans-in">${inner}</span></${wall ? 'span' : 'button'}>`;

  function board(W, inner, wall) {
    const notes = W.notes.map((n) => noteHtml(n, inner[n.id], wall)).join('');
    const pins = W.notes.map(pin).join('');
    return '<i class="ans-f ans-topp"></i><i class="ans-f ans-botten"></i><i class="ans-f ans-vanster"></i><i class="ans-f ans-hoger"></i>' +
      `<span class="ans-yta"><span class="ans-jute">${W.marks}${notes}${pins}</span><i class="ans-glans"></i></span>`;
  }

  function wall() {
    return '<i class="ans-flack"></i><i class="ans-skugga"></i><span class="ans-tavla" id="ans-vagg"></span>' +
      '<i class="ans-hj" data-hj="0"></i><i class="ans-hj" data-hj="1"></i><i class="ans-hj" data-hj="2"></i><i class="ans-hj" data-hj="3"></i>';
  }
  function nara() {
    return '<div class="rum-ansn" id="rum-ansn" role="dialog" aria-label="Anslagstavlan"><div class="ans-bak"></div>' +
      '<div class="ans-flyg" id="ans-flyg"><div class="ans-luta" id="ans-luta"><div class="ans-tavla stor" id="ans-stor" tabindex="-1"></div></div></div>' +
      '<div class="ans-fot" id="ans-fot"><a class="rum-guld" href="statistik.html" data-nav="statistik">Statistik</a></div>' +
      '<div class="ans-lyft" id="ans-lyft"></div>' +
      '<div class="ans-rad" id="ans-rad"><span id="ans-sp"></span><button type="button" class="ans-tbx" data-ans="tillbaka">Häng tillbaka</button></div></div>';
  }

  // ---------- flygturen ----------

  // Den projektiva avbildningen som lägger rektangeln w × h på fyrhörningen
  // q (övre vänstra, övre högra, nedre högra, nedre vänstra) – som matrix3d.
  function warp(q, w, h) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    let g = 0;
    let k = 0;
    const den = dx1 * dy2 - dx2 * dy1;
    if ((dx3 || dy3) && den) {
      g = (dx3 * dy2 - dx2 * dy3) / den;
      k = (dx1 * dy3 - dx3 * dy1) / den;
    }
    const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
    const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
    return `matrix3d(${m.map((v) => +v.toFixed(8)).join(',')})`;
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- i rummet ----------

  function mount(root, o) {
    const A = { on: false, ms: [], all: [], teams: new Map(), match: new Map(), html: '', loaded: 0, lyft: null, raf: 0, seed: -1, W: null };
    const vagg = root.querySelector('#ans-vagg');
    const wallEl = root.querySelector('#rum-ans');
    const ov = root.querySelector('#rum-ansn');
    const flyg = root.querySelector('#ans-flyg');
    const luta = root.querySelector('#ans-luta');
    const stor = root.querySelector('#ans-stor');
    const fot = root.querySelector('#ans-fot');
    const lyftEl = root.querySelector('#ans-lyft');
    const rad = root.querySelector('#ans-rad');
    const sp = root.querySelector('#ans-sp');
    if (!vagg || !ov) return null;
    // tavlan på väggen: förminskad till elementets bredd
    const fitWall = () => { if (wallEl.offsetWidth) wallEl.style.setProperty('--s', (wallEl.offsetWidth / BW).toFixed(4)); };
    fitWall();

    // lagfilerna (styrkan, xG och oddsen) – om igen efter en kvart
    function loadTeams() {
      if (A.loading || Date.now() - A.loaded < 15 * 60000) return A.loading;
      A.loading = Promise.all(DIVS.map((d) => getJSON(`data/teams/${d}.json`).catch(() => null))).then((files) => {
        const map = new Map();
        files.forEach((f, i) => { if (f && !f.unknown) for (const t of f.teams || []) map.set(t.name, { ...t, comp: DIVS[i] }); });
        A.stats = map;
        A.loaded = Date.now();
        A.loading = null;
        draw();
      });
      return A.loading;
    }
    // matchernas filer (skadorna, inbördes) hämtas när tavlan tas fram
    function loadMatches() {
      for (const m of A.ms) {
        if (A.match.has(m.id)) continue;
        A.match.set(m.id, undefined);
        getJSON(`data/match/${encodeURIComponent(m.id)}.json`).then((d) => { A.match.set(m.id, d); draw(); })
          .catch(() => { A.match.set(m.id, null); draw(); });
      }
    }

    function data() {
      const names = [];
      for (const m of A.ms) names.push(m.home, m.away);
      const stats = A.stats || new Map();
      const round = names.map((name) => ({ name, t: stats.get(name) || null }));
      // dolda resultat i lagens divisioner: lapparna som räknar med dem får ?
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
      return { ms: A.ms, teams: A.byTeam, match: A.match, round, kort: o.kort, veil, key, n };
    }

    function draw() {
      fitWall();
      const D = data();
      A.D = D;
      const seed = Math.floor(Date.now() / DAY);
      if (seed !== A.seed) { A.seed = seed; A.W = wear(seed * 7 + 3); }
      const inner = {};
      for (const n of NOTES) inner[n.id] = BUILD[n.id](VEILED.has(n.id) ? D : { ...D, veil: false });
      const h = JSON.stringify(inner);
      if (h === A.html) return;
      A.html = h;
      A.inner = inner;
      vagg.innerHTML = board(A.W, inner, true);
      stor.innerHTML = board(A.W, inner, false);
      if (A.lyft) {
        const n = A.W.notes.find((x) => x.id === A.lyft.id);
        stor.querySelector(`[data-lapp="${n.id}"]`).classList.add('borta');
        const card = lyftEl.querySelector('.ans-in');
        if (card) card.innerHTML = inner[n.id];
        if (n.paper === 'polaroid' && A.lyft.vand) lyftEl.querySelector('.ans-vand').classList.add('vand');
        spoilerRow(n);
      }
    }

    // ---------- närbilden ----------

    // Tavlans plats i fönstret: ryms mellan namnet och foten.
    function place() {
      const k = Math.min((innerWidth - 120) / BW, (innerHeight - 170) / BH, 1.35);
      const L = (innerWidth - BW * k) / 2;
      const T = (innerHeight - BH * k) / 2 - 16;
      A.place = { k, L, T, q: [[L, T], [L + BW * k, T], [L + BW * k, T + BH * k], [L, T + BH * k]] };
      Object.assign(fot.style, { left: `${r1(L)}px`, width: `${r1(BW * k)}px`, top: `${r1(T + BH * k + 12)}px` });
      return A.place;
    }
    const rest = () => { flyg.style.transform = `translate(${r1(A.place.L)}px, ${r1(A.place.T)}px) scale(${A.place.k.toFixed(4)})`; };

    // Hörnen på väggen, där tavlan hänger just nu.
    function quad() {
      fitWall();
      return [0, 1, 2, 3].map((i) => {
        const r = wallEl.querySelector(`[data-hj="${i}"]`).getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });
    }

    // Flyger mellan två fyrhörningar; mitt i rörelsen lyfter den lite mot en.
    function fly(from, to, ms) {
      cancelAnimationFrame(A.raf);
      return new Promise((done) => {
        const t0 = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - t0) / ms);
          const e = ease(t);
          const lift = 1 + 0.05 * Math.sin(Math.PI * t);
          const q = from.map((p, i) => [p[0] + (to[i][0] - p[0]) * e, p[1] + (to[i][1] - p[1]) * e]);
          const c = [0, 1].map((j) => q.reduce((s, p) => s + p[j], 0) / 4);
          flyg.style.transform = warp(q.map((p) => [c[0] + (p[0] - c[0]) * lift, c[1] + (p[1] - c[1]) * lift]), BW, BH);
          if (t < 1) A.raf = requestAnimationFrame(step);
          else done();
        };
        A.raf = requestAnimationFrame(step);
      });
    }

    function open(on, q) {
      if (on === A.on) return Promise.resolve();
      A.on = on;
      if (on) {
        loadMatches();
        place();
        const from = q || quad();
        ov.classList.add('on');
        ov.classList.remove('ute');
        wallEl.classList.add('borta');
        luta.style.setProperty('--rx', '0deg');
        luta.style.setProperty('--ry', '0deg');
        if (o.calm()) {
          rest();
          ov.classList.add('framme');
          return Promise.resolve();
        }
        flyg.style.transform = warp(from, BW, BH);
        return fly(from, A.place.q, 680).then(() => {
          if (!A.on) return;
          rest();
          ov.classList.add('framme');
          stor.focus({ preventScroll: true });
        });
      }
      drop(true);
      ov.classList.remove('framme');
      ov.classList.add('ute');
      const end = () => {
        if (A.on) return;
        if (ov.contains(document.activeElement)) wallEl.focus({ preventScroll: true });
        ov.classList.remove('on', 'ute');
        wallEl.classList.remove('borta');
      };
      if (o.calm()) { end(); return Promise.resolve(); }
      return fly(A.place ? A.place.q : quad(), q || quad(), 560).then(end);
    }

    // Lutar lite efter musen, så att ramens djup syns.
    ov.addEventListener('mousemove', (e) => {
      if (!A.on || A.lyft || o.calm()) return;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      luta.style.setProperty('--ry', `${r1(x * 5)}deg`);
      luta.style.setProperty('--rx', `${r1(-y * 3.5)}deg`);
    });
    addEventListener('resize', () => {
      fitWall();
      if (!A.on) return;
      place();
      cancelAnimationFrame(A.raf);
      rest();
      if (A.lyft) placeLyft(A.W.notes.find((x) => x.id === A.lyft.id), false);
    });

    // ---------- en lapp i handen ----------

    // Lappen i läsbar storlek mitt i fönstret: { x, y, s } för mitten.
    function held(n) {
      const s = Math.min((innerHeight - 220) / n.h, (innerWidth - 160) / n.w / 1.2, 3.2);
      return { x: innerWidth / 2, y: (innerHeight - 70) / 2, s };
    }
    function placeLyft(n, anim) {
      const h = held(n);
      const card = lyftEl.firstElementChild;
      const to = `translate(${r1(h.x - n.w / 2)}px, ${r1(h.y - n.h / 2)}px) scale(${h.s.toFixed(3)})`;
      rad.style.top = `${r1(h.y + (n.h * h.s) / 2 + 18)}px`;
      if (!anim) { card.style.transform = to; return null; }
      // från nålen: samma plats, storlek och vinkel som på tavlan
      const r = stor.querySelector(`[data-lapp="${n.id}"]`).getBoundingClientRect();
      const k = A.place.k;
      const from = `translate(${r1(r.left + r.width / 2 - n.w / 2)}px, ${r1(r.top + r.height / 2 - n.h / 2)}px) scale(${k.toFixed(3)}) rotate(${n.rot}deg)`;
      card.style.transform = to;
      return card.animate([
        { transform: `${from}`, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
        { transform: `${to.replace(/scale\(([\d.]+)\)/, (s, v) => `scale(${(v * 0.92).toFixed(3)})`)} perspective(900px) rotateX(-12deg) rotateY(6deg)`, offset: 0.55, easing: 'ease-out' },
        { transform: to },
      ], { duration: 520 });
    }

    function spoilerRow(n) {
      const D = A.D;
      sp.innerHTML = D && D.veil && VEILED.has(n.id) && window.Spoiler
        ? Spoiler.card({ title: `${D.n} ${D.n === 1 ? 'match' : 'matcher'} är dolda`, text: 'Lappen räknar med resultaten.', keys: [D.key] })
        : '';
    }

    function lift(id) {
      const n = A.W.notes.find((x) => x.id === id);
      if (!n || !A.inner) return;
      if (A.lyft) drop(true);
      A.lyft = { id, vand: n.paper === 'polaroid' };
      ov.classList.add('lyft');
      lyftEl.innerHTML = `<div class="ans-lapp p-${n.paper} i-handen" style="width:${n.w}px; height:${n.h}px"><span class="ans-in">${A.inner[id]}</span></div>`;
      stor.querySelector(`[data-lapp="${id}"]`).classList.add('borta');
      spoilerRow(n);
      const anim = placeLyft(n, !o.calm());
      // polaroiden vänds på vägen fram
      if (n.paper === 'polaroid') {
        const v = lyftEl.querySelector('.ans-vand');
        if (anim) setTimeout(() => v.classList.add('vand'), 120);
        else v.classList.add('vand');
      }
      rad.querySelector('button').focus({ preventScroll: true });
    }

    function drop(now) {
      if (!A.lyft) return;
      const n = A.W.notes.find((x) => x.id === A.lyft.id);
      A.lyft = null;
      const card = lyftEl.firstElementChild;
      const back = () => {
        const el = stor.querySelector(`[data-lapp="${n.id}"]`);
        if (el) el.classList.remove('borta');
        if (!A.lyft) lyftEl.innerHTML = '';
      };
      ov.classList.remove('lyft');
      if (now || o.calm() || !card) { back(); return; }
      const v = card.querySelector('.ans-vand');
      if (v) v.classList.remove('vand');
      const r = stor.querySelector(`[data-lapp="${n.id}"]`).getBoundingClientRect();
      const to = `translate(${r1(r.left + r.width / 2 - n.w / 2)}px, ${r1(r.top + r.height / 2 - n.h / 2)}px) scale(${A.place.k.toFixed(3)}) rotate(${n.rot}deg)`;
      card.animate([{ transform: card.style.transform }, { transform: to }], { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }).finished.then(back, back);
      card.style.transform = to;
    }

    function step(d) {
      const i = A.W.notes.findIndex((x) => x.id === A.lyft.id);
      const n = A.W.notes[(i + d + A.W.notes.length) % A.W.notes.length];
      drop(true);
      lift(n.id);
    }

    ov.addEventListener('click', (e) => {
      if (!A.on) return;
      if (e.target.closest('a[href], .sp-show')) return;
      if (e.target.closest('[data-ans="tillbaka"]')) { drop(); return; }
      if (A.lyft) {
        const v = e.target.closest('.i-handen') && lyftEl.querySelector('.ans-vand');
        if (v) v.classList.toggle('vand');
        else if (!e.target.closest('.i-handen, .ans-rad')) drop();
        return;
      }
      const l = e.target.closest('[data-lapp]');
      if (l && stor.contains(l)) { lift(l.dataset.lapp); return; }
      if (!e.target.closest('#ans-stor')) o.close();
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
      quad,
      open,
      on: () => A.on,
      lift: (id) => { if (A.on) lift(id); },
      // Esc sätter tillbaka lappen (sedan tavlan i rum.js); pilarna bläddrar
      key(k) {
        if (!A.on) return false;
        if (k === 'Escape' && A.lyft) { drop(); return true; }
        if (A.lyft && /^Arrow(Right|Down)$/.test(k)) { step(1); return true; }
        if (A.lyft && /^Arrow(Left|Up)$/.test(k)) { step(-1); return true; }
        if (!A.lyft && /^Arrow/.test(k)) { lift(A.W.notes[0].id); return true; }
        return false;
      },
    };
  }

  return { wall, nara, mount };
})();
