'use strict';

// Anslagstavlan i tobaksaffären (rum.js): juteväv i en träram på högra
// väggen under tv:n, med lappar på nålar. Lapparna har det på sajten som
// rummet annars inte visar, om lagen i omgången:
//   Formen         registerkort, maskinskrivet: de fem senaste före matchen
//   Skadelistan    genomslag: skadade, avstängda och osäkra (matchens fil)
//   Starkast       polaroid med skölden; på baksidan modellens starkaste och
//                  svagaste i omgången (data/teams/<division>.json)
//   Kryssar gärna  gul lapp: chansen till oavgjort i lagets matcher (xG)
//   Tur & otur     rutat papper: poäng mot chanserna (xG), med staplar
//   Mot oddsen     tidningsurklipp: poäng mot vad oddsen väntade sig
//   Vilan          almanacksblad: dagar sedan förra matchen
//   Motståndet     anteckningsblock: de som har mött svårast och lättast
//                  motstånd hittills (modellens styrka, som på Statistik)
// Mötena och lagen ett och ett står i kortregistret på disken (rum-register.js).
//
// Varje lapp är en bunt blad på samma nål, ett per division i omgången med
// Premier League överst och cupmatcherna sist, och bladen under sticker
// fram lite i kanten. På bladens högerkant sitter indexflikar av plast i
// divisionens färg (som på Tabeller), i samma ordning uppifrån. Ett klick på
// en flik, eller ↑/↓ (ett svep i telefonen), bläddrar alla lappar till den
// divisionen: bladen ovanpå lyfts från nålen och läggs under bunten, lapp
// för lapp över tavlan från vänster.
//
// Ett klick på tavlan: den lossnar från väggen och flyger fram, vriden från
// väggens vinkel till rakt fram, rummet mörknar bakom och den lutar lite
// efter musen. Ett klick på en lapp tar den från nålen och fram i läsbar
// storlek (polaroiden vänds); ←/→ bläddrar mellan lapparna och ↑/↓ mellan
// bladen. Esc, ett klick utanför eller Häng tillbaka sätter tillbaka lappen,
// och Esc igen eller ett klick utanför tavlan hänger tavlan på väggen igen.
//
// Dolda resultat (Spoiler): formen får ?, och lapparna som räknar med
// resultaten (styrkan, krysset, turen, oddsen, motståndet) står med ? och
// Visa ändå när en match i lagens divisioner är dold.
//
// Slitaget: lapparnas och bladens vinklar, nålhålen och pappersresterna
// efter gamla lappar skiftar med dagen.
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

  // Lapparna på tavlan: papperet, platsen, vinkeln och nålens färg. Mellan
  // lapparna är det plats för flikarna i högerkanten.
  const NOTES = [
    { id: 'form', paper: 'kort', x: 30, y: 38, w: 296, h: 206, rot: -1.4, pin: '#c2271c', name: 'Formen' },
    { id: 'skador', paper: 'genomslag', x: 354, y: 32, w: 194, h: 226, rot: 1.1, pin: '#2a52a0', name: 'Skadelistan' },
    { id: 'styrka', paper: 'polaroid', x: 576, y: 40, w: 162, h: 208, rot: -3.2, pin: 'stift', name: 'Starkast' },
    { id: 'kryss', paper: 'postit', x: 766, y: 40, w: 166, h: 172, rot: 3, pin: '#3db37c', name: 'Kryssar gärna' },
    { id: 'tur', paper: 'rutat', x: 30, y: 280, w: 210, h: 228, rot: 1.6, pin: '#d8b06a', name: 'Tur & otur' },
    { id: 'odds', paper: 'tidning', x: 270, y: 292, w: 222, h: 206, rot: -1.1, pin: '#c2271c', name: 'Mot oddsen' },
    { id: 'vila', paper: 'almanacka', x: 522, y: 264, w: 190, h: 248, rot: 2.1, pin: '#5a5f8a', name: 'Vilan' },
    { id: 'motstand', paper: 'linjerat', x: 742, y: 278, w: 190, h: 230, rot: -2, pin: '#e7e1d2', name: 'Motståndet' },
  ];
  // jutens mått (tavlan innanför ramen)
  const JW = BW - 48;
  const JH = BH - 48;

  // Bladen i lapparna: ett per division i omgången, i den här ordningen, och
  // flikarnas färger (som på Tabeller).
  const ARK = {
    pl: { name: 'Premier League', short: 'PL', col: '#2a78d6' },
    ch: { name: 'Championship', short: 'CH', col: '#eb6834' },
    l1: { name: 'League One', short: 'L1', col: '#1baf7a' },
    l2: { name: 'League Two', short: 'L2', col: '#eda100' },
    cup: { name: 'Cupen', short: 'Cup', col: '#b0475e' },
  };
  const arkOf = (m) => (DIVS.includes(m.comp) ? m.comp : 'cup');
  // bladen under det översta sticker fram: vridna kring nålen och lite
  // förskjutna, [grader, x, y] för det andra, tredje …
  const FAN = [[0, 0, 0], [1.5, 1, 2], [-1.3, -1, 3], [2.2, 1.5, 4], [-2, -1.5, 5]];
  const FLIK = (i) => 14 + i * 24;

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
  // en lista som är tom i en liten division
  const rows = (l, row) => (l.length ? l.map(row).join('') : '<span class="r q">Ingen</span>');
  function noteTur(D) {
    if (D.veil) return dolt('Tur &amp; otur');
    const [up, down] = split(D, xpd, 4);
    const max = Math.max(1, ...up.map((x) => x.v), ...down.map((x) => -x.v));
    const row = (x) => `<span class="r"><span>${esc(D.kort(x.name))}</span><i class="bar${x.v < 0 ? ' neg' : ''}" style="width:${r1(4 + 52 * Math.abs(x.v) / max)}px"></i>` +
      `<span>${signed(x.v)}</span></span>`;
    if (!up.length && !down.length) return '<h4>Tur &amp; otur</h4><p class="inget">Okänt</p>';
    return `<h4>Tur &amp; otur</h4><b class="d">Tur</b>${rows(up, row)}<b class="d">Otur</b>${rows(down, row)}`;
  }
  function noteOdds(D) {
    if (D.veil) return dolt('Slår oddsen');
    const [up, down] = split(D, vsOdds, 4);
    const row = (x) => `<span class="r"><span>${esc(D.kort(x.name))}</span><span>${signed(x.v)}</span></span>`;
    if (!up.length && !down.length) return '<h4>Slår oddsen</h4><p class="inget">Okänt</p>';
    return `<h4>Slår oddsen</h4>${rows(up, row)}<b class="d">Sviker</b>${rows(down, row)}`;
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

  // Motståndet hittills: plus = svårare motstånd än ett normalt spelschema
  // i divisionen, minus = lättare (fd.opp, mål per match enligt modellen).
  const opp = (t) => fdOf(t, 'opp');
  function noteMotstand(D) {
    if (D.veil) return dolt('Motståndet');
    const [up, down] = split(D, opp, 4);
    const row = (x) => `<span class="r"><span>${esc(D.kort(x.name))}</span><span>${signed(x.v, 2)}</span></span>`;
    if (!up.length && !down.length) return '<h4>Motståndet</h4><p class="inget">Okänt</p>';
    return `<h4>Motståndet</h4><b class="d">Tufft hittills</b>${rows(up, row)}<b class="d">Lätt hittills</b>${rows(down, row)}`;
  }

  const BUILD = { form: noteForm, skador: noteSkador, styrka: noteStyrka, kryss: noteKryss, tur: noteTur, odds: noteOdds, vila: noteVila, motstand: noteMotstand };
  const VEILED = new Set(['styrka', 'kryss', 'tur', 'odds', 'motstand']);

  // ---------- tavlan ----------

  // Dagens slitage: vinklarna och platserna rör sig lite, och gamla nålhål
  // och hörn av rivna lappar sitter där de sitter just den dagen.
  function wear(seed) {
    const R0 = rng(seed);
    const notes = NOTES.map((n) => ({
      ...n,
      rot: r1(n.rot + (R0() - 0.5) * 2.2),
      x: n.x + Math.round((R0() - 0.5) * 6),
      y: n.y + Math.round((R0() - 0.5) * 6),
      fan: FAN.map(([a, x, y], i) => [i ? r1(a + (R0() - 0.5) * 0.8) : 0, x, y]),
    }));
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
  // Bladen i en lapp, med det valda (top) överst och resten i ordning under
  // det: z-index och skuggan efter djupet (lag), och fliken i högerkanten.
  const depth = (sheets, s, top) => (sheets.indexOf(s) - sheets.indexOf(top) + sheets.length) % sheets.length;
  const arkPos = (n, i) => `translate(${n.fan[i][1]}px, ${n.fan[i][2]}px) rotate(${n.fan[i][0]}deg)`;
  function sheetsHtml(n, inner, sheets, top) {
    return sheets.map((s, i) => {
      const a = ARK[s];
      const lag = depth(sheets, s, top);
      // flikarna med lika långt mellan sig fast bladen är vridna och förskjutna
      const y = r1(FLIK(i) - n.fan[i][2] - (n.w / 2) * Math.sin((n.fan[i][0] * Math.PI) / 180));
      const flik = a ? `<i class="ans-flik" data-flik="${s}" style="top:${y}px; --dv:${a.col}"><b>${a.short}</b></i>` : '';
      return `<span class="ans-ark p-${n.paper}" data-ark="${s}" style="z-index:${sheets.length - lag}; --lag:${lag}; transform:${arkPos(n, i)}">` +
        `<span class="ans-in">${inner[s]}</span>${flik}</span>`;
    }).join('');
  }
  const label = (n, top) => esc(ARK[top] ? `${n.name} – ${ARK[top].name}` : n.name);
  const noteHtml = (n, inner, sheets, top, wall) => `<${wall ? 'span' : 'button type="button"'} class="ans-lapp" data-lapp="${n.id}" ` +
    `style="left:${n.x}px; top:${n.y}px; width:${n.w}px; height:${n.h}px; --rot:${n.rot}deg"${wall ? '' : ` aria-label="${label(n, top)}"`}>` +
    `${sheetsHtml(n, inner, sheets, top)}</${wall ? 'span' : 'button'}>`;

  function board(W, inner, sheets, top, wall) {
    const notes = W.notes.map((n) => noteHtml(n, inner[n.id], sheets, top, wall)).join('');
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
    const A = { on: false, ms: [], all: [], teams: new Map(), match: new Map(), html: '', loaded: 0, lyft: null, raf: 0, seed: -1, W: null, sheets: ['alla'], top: 'alla', anims: [], flip: 0 };
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

    // Datan till bladen: omgångens matcher och lag per division (D.ark), och
    // de dolda resultaten för hela omgången (samma nyckel som kortregistret).
    function data() {
      const stats = A.stats || new Map();
      const roundOf = (ms) => ms.flatMap((m) => [m.home, m.away]).map((name) => ({ name, t: stats.get(name) || null }));
      // dolda resultat i lagens divisioner: lapparna som räknar med dem får ?
      let veil = false;
      let key = '';
      let n = 0;
      if (window.Spoiler && Spoiler.on()) {
        const comps = new Set(roundOf(A.ms).filter((x) => x.t).map((x) => x.t.comp));
        const recent = A.all.filter((m) => comps.has(m.comp) && Spoiler.hides(m.kickoff));
        n = recent.filter(Spoiler.hidden).length;
        key = `ans:${recent.map((m) => m.id).sort().join(',')}`;
        veil = n > 0 && !Spoiler.isShown(key);
      }
      const ark = {};
      for (const s of A.sheets) {
        const ms = s === 'alla' ? A.ms : A.ms.filter((m) => arkOf(m) === s);
        ark[s] = { ms, teams: A.byTeam, match: A.match, round: roundOf(ms), kort: o.kort, veil, key, n };
      }
      return { ark, veil, key, n };
    }

    function draw() {
      fitWall();
      const D = data();
      A.D = D;
      const seed = Math.floor(Date.now() / DAY);
      if (seed !== A.seed) { A.seed = seed; A.W = wear(seed * 7 + 3); }
      const inner = {};
      for (const n of NOTES) {
        inner[n.id] = {};
        for (const s of A.sheets) inner[n.id][s] = BUILD[n.id](VEILED.has(n.id) ? D.ark[s] : { ...D.ark[s], veil: false });
      }
      const h = JSON.stringify([A.sheets, inner]);
      if (h === A.html) return;
      A.html = h;
      A.inner = inner;
      stopFlip();
      vagg.innerHTML = board(A.W, inner, A.sheets, A.top, true);
      stor.innerHTML = board(A.W, inner, A.sheets, A.top, false);
      if (A.lyft) {
        const n = A.W.notes.find((x) => x.id === A.lyft.id);
        stor.querySelector(`[data-lapp="${n.id}"]`).classList.add('borta');
        const card = lyftEl.querySelector('.ans-lapp');
        if (card) card.innerHTML = sheetsHtml(n, inner[n.id], A.sheets, A.top);
        if (n.paper === 'polaroid' && A.lyft.vand) vand(true);
        spoilerRow(n);
      }
    }

    // ---------- bladen ----------

    // Lägger bladen i en lapp i ordning med top överst.
    function stack(el, top) {
      for (const a of el.querySelectorAll(':scope > .ans-ark')) {
        const lag = depth(A.sheets, a.dataset.ark, top);
        a.style.zIndex = A.sheets.length - lag;
        a.style.setProperty('--lag', lag);
      }
    }
    function stopFlip() {
      A.flip++;
      for (const x of A.anims) x.cancel();
      A.anims = [];
    }
    const lapparna = () => [...vagg.querySelectorAll('.ans-lapp'), ...stor.querySelectorAll('.ans-lapp'), ...lyftEl.querySelectorAll('.ans-lapp')];

    // Bläddrar alla lappar till bladet to: framåt lyfts bladen ovanpå från
    // nålen ett i taget och läggs under bunten, bakåt tas de nedersta fram
    // och läggs överst. Lapparna på tavlan följer efter varandra från vänster.
    function flip(to, dir) {
      const S = A.sheets;
      const N = S.length;
      if (N < 2 || !S.includes(to) || to === A.top) return;
      stopFlip();
      const me = A.flip;
      const i0 = S.indexOf(A.top);
      const d = (S.indexOf(to) - i0 + N) % N;
      const fwd = dir ? dir > 0 : d <= N - d;
      const steps = fwd ? d : N - d;
      const from = A.top;
      A.top = to;
      for (const el of lapparna()) {
        const n = A.W.notes.find((x) => x.id === el.dataset.lapp);
        if (el.tagName === 'BUTTON') el.setAttribute('aria-label', label(n, to).replace(/&amp;/g, '&'));
        if (o.calm() || !A.on || vagg.contains(el)) { stack(el, to); continue; }
        stack(el, from);
        const wait = lyftEl.contains(el) ? 0 : Math.round((n.x / JW) * 190 + (n.y / JH) * 40);
        for (let k = 0; k < steps; k++) {
          const at = wait + k * 120;
          const s = fwd ? S[(i0 + k) % N] : S[(i0 - k - 1 + N) % N];
          const a = el.querySelector(`:scope > .ans-ark[data-ark="${s}"]`);
          // bladet vrids kring nålen (överkanten) mot en; i vila är det platt
          const base = `${a.style.transform} perspective(700px) rotateX(0deg)`;
          const up = `${a.style.transform} perspective(700px) rotateX(-76deg)`;
          if (fwd) {
            // lyfts från nålen, och läggs under de andra på vägen ner
            const lift = a.animate([{ transform: base }, { transform: up }], { duration: 220, delay: at, easing: 'cubic-bezier(0.45, 0, 0.8, 0.5)' });
            A.anims.push(lift);
            lift.finished.then(() => {
              if (A.flip !== me) return;
              stack(el, S[(i0 + k + 1) % N]);
              A.anims.push(a.animate([{ transform: up }, { transform: base }], { duration: 300, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)' }));
            }, () => {});
          } else {
            // tas fram underifrån och läggs överst (i samma bildruta)
            const vant = a.animate([{ opacity: 1 }, { opacity: 1 }], { duration: Math.max(1, at) });
            A.anims.push(vant);
            vant.finished.then(() => {
              if (A.flip !== me) return;
              stack(el, s);
              A.anims.push(a.animate([{ transform: up }, { transform: base }], { duration: 340, easing: 'cubic-bezier(0.25, 0.4, 0.3, 1)' }));
            }, () => {});
          }
        }
      }
    }
    const flipBy = (d) => flip(A.sheets[(A.sheets.indexOf(A.top) + d + A.sheets.length) % A.sheets.length], d);

    // ---------- närbilden ----------

    // Tavlans plats i fönstret: ryms mellan namnet och foten (i telefonen
    // med smalare kanter).
    function place() {
      const k = Math.min((innerWidth - (innerWidth < 700 ? 24 : 120)) / BW, (innerHeight - (innerHeight < 500 ? 90 : 170)) / BH, 1.35);
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

    // Lappen i läsbar storlek mitt i fönstret: { x, y, s } för mitten. I
    // telefonen bläddrar man med ett svep (rum.js), så där behövs ingen plats
    // vid sidorna.
    function held(n) {
      const sm = innerWidth < 700;
      // flikarna sticker ut i högerkanten: lika mycket luft på båda sidor
      const w = n.w + (ARK[A.top] ? 36 : 0);
      const s = Math.min((innerHeight - (innerHeight < 500 ? 120 : 220)) / n.h, (innerWidth - (sm ? 32 : 160)) / w / (sm ? 1.04 : 1.2), 3.2);
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

    // polaroiderna i handen: alla bladen vända åt samma håll
    function vand(on) {
      for (const v of lyftEl.querySelectorAll('.ans-vand')) v.classList.toggle('vand', on);
    }

    function lift(id) {
      const n = A.W.notes.find((x) => x.id === id);
      if (!n || !A.inner) return;
      if (A.lyft) drop(true);
      A.lyft = { id, vand: n.paper === 'polaroid' };
      ov.classList.add('lyft');
      lyftEl.innerHTML = `<div class="ans-lapp i-handen" data-lapp="${id}" style="width:${n.w}px; height:${n.h}px">${sheetsHtml(n, A.inner[id], A.sheets, A.top)}</div>`;
      stor.querySelector(`[data-lapp="${id}"]`).classList.add('borta');
      spoilerRow(n);
      const anim = placeLyft(n, !o.calm());
      // polaroiden vänds på vägen fram
      if (n.paper === 'polaroid') {
        const me = A.lyft;
        if (anim) setTimeout(() => { if (A.lyft === me && me.vand) vand(true); }, 120);
        else vand(true);
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
      vand(false);
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
      // en flik bläddrar alla lappar till sin division
      const f = e.target.closest('[data-flik]');
      if (f && !vagg.contains(f)) { flip(f.dataset.flik); return; }
      if (A.lyft) {
        if (e.target.closest('.i-handen') && lyftEl.querySelector('.ans-vand')) vand((A.lyft.vand = !A.lyft.vand));
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
        // bladen: divisionerna i omgången, och det valda överst så länge det finns
        const S = Object.keys(ARK).filter((s) => A.ms.some((m) => arkOf(m) === s));
        A.sheets = S.length ? S : ['alla'];
        if (!A.sheets.includes(A.top)) A.top = A.sheets[0];
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
      // Esc sätter tillbaka lappen (sedan tavlan i rum.js); ←/→ bläddrar
      // mellan lapparna och ↑/↓ mellan bladen
      key(k) {
        if (!A.on) return false;
        if (k === 'Escape' && A.lyft) { drop(); return true; }
        if (/^Arrow(Up|Down)$/.test(k)) { flipBy(k === 'ArrowDown' ? 1 : -1); return true; }
        if (A.lyft && k === 'ArrowRight') { step(1); return true; }
        if (A.lyft && k === 'ArrowLeft') { step(-1); return true; }
        if (!A.lyft && /^Arrow/.test(k)) { lift(A.W.notes[0].id); return true; }
        return false;
      },
    };
  }

  return { wall, nara, mount };
})();
