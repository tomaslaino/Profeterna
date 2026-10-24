// Tv:n i tobaksaffären (rum.js): en mörkgrå Panasonic från nittiotalet som
// står på en hylla på en arm från högra väggen, vriden ut mot rummet men
// mest mot pulten. Lådan är byggd i CSS 3D (rum-tv.css) i samma värld som
// resten av rummet, så att högersidan och hyllan under syns och följer
// musen, och bakom den sticker bildrörets kåpa ut. Armen går till en platta
// på väggen, och sladden hänger från den ner till uttaget. På taket står
// kaninöronen, det ena med en bit folie för bättre bild. Till höger om rutan
// sitter panelen: den gröna displayen med sidnumret, knappsatsen (1–9, ▼ 0
// ▲), högtalargallret och strömbrytaren. När man går fram till tv:n (T)
// vrids den mot en.
//
// Text-tv som SVT:s: 40 × 25 tecken, rubrikraden med sidnumret, datumet och
// klockan som tickar, ett blått band med rubriken i mosaikgrafik, text i sju
// färger, dubbelhöga rader och snabbvalen i rött, grönt, gult och cyanblått
// längst ner – samma fyra på alla sidor: Matcher (331), Tabeller (371),
// Skyttar (381) och Innehåll (300).
//
//   300       innehållet: alla sidor med sina nummer
//   331       omgångens matcher, en rad per match som leder till matchens sida
//   332–369   en sida per match: avsparken eller ställningen, oddsen,
//             prognosen som en stapel och lagen sida vid sida (tabelläget,
//             formen, hemma- och bortaraden), ur matchens fil
//             (data/match/<id>.json). Vilan och skadorna står på
//             anslagstavlan (rum-anslag.js), xG och resten om lagen i
//             kortregistret (rum-register.js).
//   371–374   tabellerna (data/teams/<division>.json) med formen i ligan ur
//             matcherna; 24 lag = två undersidor
//   377       Stryktipset matcher live: kupongens matcher med avspark eller
//             ställning och tecknet, i Stryktipsets ordning när omgången är
//             Stryktipset; tv:n står på den när man kommer in
//   381–384   skytteligorna (data/players/<division>.json)
//
// Filerna hämtas när sidan visas första gången. Byter man sida söker tv:n som
// förr: sidnumret i rubrikraden rullar fram tills sidan kommer, och den ritas
// uppifrån och ner. Dolda resultat (Spoiler) står som ?, och har en division
// dolda matcher visar tabellen och skytteligan bara det, med Visa ändå.
//
// Sidbyten när tv:n är nära: ▲ ▼ och piltangenterna (nästa sida i
// nummerordning, undersidorna först), snabbvalen, raderna som leder vidare,
// divisionerna i bandet eller tre siffror på knappsatsen eller tangentbordet.
// På håll bläddrar undersidorna själva var tolfte sekund.
//
// RumTv.html() → tv:n (i planet -470 i rum.js)
// RumTv.mount(el, { calm, short, kort, wd, hm, matches }) → { fill(rows, { spel, next }), zoom(on) → rutans mått, key(k) }

window.RumTv = (() => {
  const COLS = 40;
  const INDEX = 300;
  const FIRST = 331;
  const TAB = 371;
  const LIVE = 377;
  const SKY = 381;
  // matcher per undersida på 331 (raderna 5–21), och högst så många
  // matchsidor att de inte når tabellerna
  const PER = 17;
  const MAXM = TAB - FIRST - 2;
  // matcher per undersida på 377 (raderna 10–24)
  const LPER = 15;
  const DIVS = [
    { id: 'pl', short: 'PL', name: 'Premier League', size: 20 },
    { id: 'ch', short: 'CH', name: 'Championship', size: 24 },
    { id: 'l1', short: 'L1', name: 'League One', size: 24 },
    { id: 'l2', short: 'L2', name: 'League Two', size: 24 },
  ];
  // lag per undersida: hela Premier League på en, 24 lag i två halvor
  const perTable = (n) => (n > 20 ? Math.ceil(n / 2) : 20);
  const TZ = 'Europe/Stockholm';

  // ---------- text-tv ----------

  // En rad: bitar [text, färg, bakgrund, sida] efter varandra, fylld till 40
  // tecken; en bit med sida är en knapp. Färgerna: w vit, y gul, c cyan,
  // g grön, r röd, m magenta, b blå.
  function line(...bits) {
    let n = 0;
    let html = '';
    for (const b of bits) {
      if (b == null || b === '') continue;
      const [text, fg = 'w', bg = '', sida] = Array.isArray(b) ? b : [b];
      const t = String(text).slice(0, COLS - n);
      if (!t) continue;
      n += t.length;
      const cls = `${fg}${bg ? ` b${bg}` : ''}`;
      html += sida ? `<button type="button" class="ln ${cls}" data-sida="${sida}">${esc(t)}</button>` : `<span class="${cls}">${esc(t)}</span>`;
    }
    return html + ' '.repeat(COLS - n);
  }
  const pad = (s, n) => String(s).slice(0, n).padEnd(n, ' ');
  const rpad = (s, n) => String(s).slice(0, n).padStart(n, ' ');

  // Rubriken i mosaikgrafik: bokstäver i 5 × 7 klossar, två klossar breda och
  // tre höga per tecken, så att en bokstav tar tre tecken i bredd.
  const GLYPH = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    Å: '..#..|.....|.###.|#...#|#####|#...#|#...#',
    B: '####.|#...#|#...#|####.|#...#|#...#|####.',
    C: '.###.|#...#|#....|#....|#....|#...#|.###.',
    E: '#####|#....|#....|####.|#....|#....|#####',
    F: '#####|#....|#....|####.|#....|#....|#....',
    H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    N: '#...#|##..#|#.#.#|#.#.#|#..##|#...#|#...#',
    O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    P: '####.|#...#|#...#|####.|#....|#....|#....',
    R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    S: '.####|#....|#....|.###.|....#|....#|####.',
    T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  };
  function mosaic(word) {
    let s = '';
    [...word].forEach((ch, i) => {
      (GLYPH[ch] || '').split('|').forEach((row, y) => {
        for (const m of row.matchAll(/#+/g)) s += `<rect x="${2 + i * 6 + m.index}" y="${1 + y}" width="${m[0].length}" height="1"/>`;
      });
    });
    return `<svg class="mos" viewBox="0 0 80 9" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">${s}</svg>`;
  }

  // Bandet: raderna 1–3 i blått med rubriken i gula klossar till vänster. En
  // rad är en text eller bitar [text, färg, sida] som står till höger, eller
  // { cols } – text i kolumnerna under (rubrikerna i en tabell).
  function band(title, ...rows) {
    const row = (r) => {
      if (r && r.cols) return line([r.cols, 'w', 'b']);
      const bits = Array.isArray(r) ? r : [[String(r || '')]];
      const n = bits.reduce((a, b) => a + b[0].length, 0);
      return line([' '.repeat(Math.max(0, COLS - 1 - n)), 'w', 'b'], ...bits.map(([t, fg = 'w', sida]) => [t, fg, 'b', sida]), [' ', 'w', 'b']);
    };
    return `<div class="band"><span class="sr">${esc(title)}</span>${[0, 1, 2].map((i) => `<div class="tr">${row(rows[i])}</div>`).join('')}${mosaic(title)}</div>`;
  }
  // Text i bestämda kolumner: [[kolumn, text], …].
  function cols(spec) {
    const a = Array(COLS).fill(' ');
    for (const [c, t] of spec) [...t].forEach((ch, j) => { a[c + j] = ch; });
    return { cols: a.join('') };
  }
  // Divisionerna i bandet: den som visas i gult, de andra leder dit.
  const chooser = (base, k) => DIVS.map((d, i) => [` ${d.short} `, i === k ? 'y' : 'w', i === k ? null : base + i]);

  const fHead = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const fWhen = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const partsOf = (f, d) => Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value.replace('.', '')]));

  // Rubrikraden: sidnumret (grönt medan det rullar), namnet, datumet och klockan.
  function head(nr, rolling) {
    const p = partsOf(fHead, new Date());
    return line(' ', [String(nr), rolling ? 'g' : 'w'], ' Matchfix Text  ', pad(`${p.weekday} ${p.day} ${p.month}`, 10), ' ', [`${p.hour}:${p.minute}:${p.second}`, 'y']);
  }

  // Snabbvalen längst ner, samma på alla sidor: fyra fält om tio tecken.
  // data-to = föremålet i rummet som tänder snabbvalet (rum.js hot).
  const KEYS = [['Matcher', 'r', FIRST, 'matcher'], ['Tabeller', 'g', TAB, 'tabeller'], ['Skyttar', 'y', SKY, 'statistik'], ['Innehåll', 'c', INDEX]];
  function fast() {
    return '<div class="tr fast">' + KEYS.map(([label, fg, to, nav]) =>
      `<button type="button" class="${fg}" data-sida="${to}"${nav ? ` data-to="${nav}"` : ''}>${esc(pad(` ${label}`, 10))}</button>`).join('') + '</div>';
  }

  // Raderna 4–23: en sträng per rad, null för en tom, eller { html } med
  // dh (dubbelhög, tar två), sida (leder till en sida), href (en länk ut ur
  // rummet) eller visa (visar dolda resultat).
  function body(rows) {
    let out = '';
    let n = 0;
    for (const r of rows) {
      if (n >= 20) break;
      const o = r && typeof r === 'object' ? r : {};
      const html = r == null ? ' '.repeat(COLS) : typeof r === 'string' ? r : r.html;
      const cls = `tr${o.dh ? ' dh' : ''}`;
      const inner = o.dh ? `<span class="in">${html}</span>` : html;
      const at = `style="--i: ${n}"`;
      if (o.href) out += `<a class="${cls}" ${at} href="${esc(o.href)}">${inner}</a>`;
      else if (o.sida || o.visa) out += `<button type="button" class="${cls}" ${at} ${o.sida ? `data-sida="${o.sida}"` : `data-visa="${esc(o.visa)}"`}>${inner}</button>`;
      else out += `<div class="${cls}" ${at}>${inner}</div>`;
      n += o.dh ? 2 : 1;
    }
    for (; n < 20; n++) out += `<div class="tr">${' '.repeat(COLS)}</div>`;
    return out;
  }

  // ---------- sidorna ----------

  const done = (g) => g.state === 'final' || g.state === 'live';
  const ord = (n) => `${n}:${/1[12]$/.test(n) || !/[12]$/.test(n) ? 'e' : 'a'}`;
  const dec = (x, d = 2) => (x == null || !Number.isFinite(x) ? '-' : x.toFixed(d).replace('.', ','));
  const signed = (n) => (n > 0 ? `+${n}` : String(n));
  const COMP = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two', fac: 'FA-cupen', lc: 'Ligacupen' };
  const LIGA = { pl: 'PL', ch: 'CH', l1: 'L1', l2: 'L2' };
  const RES = { V: 'g', O: 'y', F: 'r' };

  // Läget i en kort ruta (331) och i en mening (matchens sida).
  function status(g, long = false) {
    if (g.state === 'off') return [long ? g.off || 'Struken' : 'struken', 'r'];
    if (g.state === 'hidden') return [long ? (g.over ? 'Slut' : 'Pågår') : '?', 'w'];
    if (g.state === 'final') return [long ? `Slut${g.extra ? ` ${g.extra}` : ''}` : `${g.score.home}-${g.score.away}`, 'w'];
    if (g.state === 'live') {
      const ht = g.clock === 'HT';
      return [long ? (ht ? 'Halvtid' : `Pågår ${g.clock || ''}`.trim()) : `${g.score.home}-${g.score.away} ${ht ? 'paus' : g.clock || ''}`.trim(), 'g'];
    }
    if (g.state === 'started') return [long ? 'Pågår' : 'pågår', 'g'];
    return null;
  }

  // Lagen med vanliga korta namn, eller högst elva tecken var om de inte ryms.
  function teams(T, m, n) {
    const s = `${T.short(m.home)}-${T.short(m.away)}`;
    return s.length <= n ? s : `${T.kort(m.home)}-${T.kort(m.away)}`;
  }
  // Ett lag på högst n tecken: det korta namnet, fällbladstavlans eller första ordet.
  const team = (T, name, n) => [T.short(name), T.kort(name), String(name).split(' ')[0]].find((x) => x.length <= n) || String(name).slice(0, n);

  // Har divisionen matcher som döljs just nu räknar tabellen och skytteligan
  // redan med dem – samma nyckel som Tabeller och Statistik (divisioner.js),
  // så att Visa ändå gäller där också.
  function veil(T, dv) {
    const S = window.Spoiler;
    if (!S || !S.on()) return null;
    const recent = T.matches().filter((m) => m.comp === dv.id && S.hides(m.kickoff));
    const n = recent.filter(S.hidden).length;
    if (!n) return null;
    const key = `div:${dv.id}:${recent.map((m) => m.id).sort().join(',')}`;
    return S.isShown(key) ? null : { n, key };
  }
  const veilRows = (v, dv) => [null, line(' ', `${v.n} ${v.n === 1 ? 'match' : 'matcher'} i ${dv.name} är dolda`), null,
    { visa: v.key, html: line(' ', ['Visa ändå', 'c']) }];

  function indexPage() {
    const item = (label, nr, indent = 1) => ({ sida: nr, html: line(' '.repeat(indent), pad(label, 36 - indent), [String(nr), 'y']) });
    const rows = [null, item('Omgångens matcher', FIRST), item('Stryktipset matcher live', LIVE), null, line(' ', ['Tabeller', 'c'])];
    DIVS.forEach((d, k) => rows.push(item(d.name, TAB + k, 3)));
    rows.push(null, line(' ', ['Skytteligor', 'c']));
    DIVS.forEach((d, k) => rows.push(item(d.name, SKY + k, 3)));
    return band('INNEHÅLL') + body(rows) + fast();
  }

  function listPage(T, sub) {
    const subs = Math.max(1, Math.ceil(T.rows.length / PER));
    const list = T.rows.slice(sub * PER, sub * PER + PER);
    const rows = [null];
    T.rows.forEach((x, i) => {
      if (!list.includes(x)) return;
      const k = new Date(x.m.kickoff);
      const [st, fg] = status(x.g) || [`${T.wd(k)} ${T.hm(k)}`, 'c'];
      const nr = i < MAXM ? FIRST + 1 + i : null;
      rows.push({ sida: nr, html: line(' ', pad(teams(T, x.m, 23), 23), ' ', [pad(st, 10), fg], ' ', [nr ? String(nr) : '', 'y']) });
    });
    if (!T.rows.length) rows.push(null, line(' Inga matcher just nu.'));
    return band('MATCHER', subs > 1 ? `${sub + 1}/${subs}` : '', T.rows.length ? `${T.rows.length} matcher` : '') + body(rows) + fast();
  }

  // Stryktipset matcher live: kupongens matcher med numren – i Stryktipsets
  // ordning om omgången är Stryktipset (spel), annars i avsparksordning –
  // avsparken eller ställningen och tecknet, grönt medan matchen pågår och
  // gult när den är slut. Mellan omgångarna de närmaste matcherna, utan nummer.
  function livePage(T, sub) {
    const { spel, next } = T.live;
    const at = new Map((spel || []).map((id, i) => [String(id), i]));
    const ix = (x) => (at.has(x.id) ? at.get(x.id) : at.size);
    const all = spel ? T.rows.slice().sort((a, b) => ix(a) - ix(b)) : T.rows;
    const subs = Math.max(1, Math.ceil(all.length / LPER));
    const first = all.length ? new Date(Math.min(...all.map((x) => Date.parse(x.m.kickoff)))) : null;
    const rows = [null, { dh: true, html: line(' ', [next ? 'Nästa matcher' : 'Matcher live', 'y']) },
      first && !next ? line(' Spelstopp ', [`${T.wd(first)} ${T.hm(first)}`, 'c']) : null, null];
    all.slice(sub * LPER, sub * LPER + LPER).forEach((x) => {
      const i = T.rows.indexOf(x);
      const k = new Date(x.m.kickoff);
      const [st, fg] = status(x.g) || [`${T.wd(k)} ${T.hm(k)}`, 'c'];
      const sign = done(x.g) && x.g.res != null ? ['1X2'[x.g.res], x.g.state === 'live' ? 'g' : 'y'] : null;
      rows.push({ sida: i < MAXM ? FIRST + 1 + i : null,
        html: line(rpad(next ? '' : all.indexOf(x) + 1, 3), ' ', pad(teams(T, x.m, 22), 22), ' ', [pad(st, 10), fg], ' ', sign) });
    });
    if (!all.length) rows.push(line(' Inga matcher just nu.'));
    return band('STRYKTIPSET', subs > 1 ? `${sub + 1}/${subs}` : '') + body(rows) + fast();
  }

  // Prognosen som en stapel i mosaik: 1, X och 2 i sina färger (som siffrorna
  // ovanför), lika långa som sannolikheterna och med ett tecken emellan.
  function bar(p) {
    const W = COLS - 4;
    const raw = p.map((x) => x * W);
    const w = raw.map(Math.floor);
    let left = W - w.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - w[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) w[i]++; });
    return line(' ', [' '.repeat(w[0]), 'g bar'], ' ', [' '.repeat(w[1]), 'y bar'], ' ', [' '.repeat(w[2]), 'c bar']);
  }

  // Bitarna i en ruta om 13 tecken, högerställda.
  const cell = (bits) => [' '.repeat(Math.max(0, 13 - bits.reduce((a, b) => a + b[0].length, 0))), ...bits];
  // Formen: de fem senaste, den senaste först (som på matchbladet).
  const formBits = (list) => (list.length ? list.slice(0, 5).map((x) => (window.Spoiler && Spoiler.hidesDay(x.date) ? ['?', 'w'] : [x.result || '?', RES[x.result] || 'w'])) : [['-']]);

  function matchPage(T, i) {
    const { m, g } = T.rows[i];
    const d = T.json.get(m.id) || null;
    const st = status(g, true);
    const p = partsOf(fWhen, new Date(m.kickoff));
    const score = g.state === 'hidden' ? '?' : done(g) && g.score ? `${g.score.home}-${g.score.away}` : '';
    // i bandet: tävlingen och avsparken eller läget (grönt medan matchen pågår)
    const when = st ? [st[0], st[1] === 'g' ? 'g' : 'w'] : [`${p.weekday} ${p.day} ${p.month} ${p.hour}.${p.minute}`, 'w'];
    const rows = [null, { dh: true, href: `#match/${m.id}`, html: line(' ', pad(teams(T, m, 32), 32), [rpad(score, 6), 'y']) }, null];
    const o = m.odds || [];
    const pr = d && d.prediction && d.prediction.status === 'ok' && d.prediction.p && d.prediction.p.length === 3 ? d.prediction.p : null;
    if (o.length === 3 || pr) {
      rows.push(line(' '.repeat(12), [rpad('1', 8), 'g'], [rpad('X', 8), 'y'], [rpad('2', 8), 'c']));
      if (o.length === 3) rows.push(line(' Odds', ' '.repeat(7), [o.map((x) => rpad(dec(x), 8)).join(''), 'y']));
      if (pr) rows.push(line(' Prognos', ' '.repeat(4), pr.map((x) => rpad(`${Math.round(x * 100)} %`, 8)).join('')), bar(pr));
      rows.push(null);
    }
    // lagen sida vid sida – inte när resultatet är dolt (tabellen kan ha det)
    const t = d && d.teams;
    if (t && t.home && t.away && g.state !== 'hidden') {
      const pair = (label, f) => line(' ', pad(label, 12), ...cell(f(t.home, 'home')), ...cell(f(t.away, 'away')));
      rows.push(line(' '.repeat(13), [rpad(T.kort(m.home), 13) + rpad(T.kort(m.away), 13), 'c']),
        pair('Tabell', (x) => [[x.table ? `${ord(x.table.rank)}${x.league && x.league.id !== m.comp && LIGA[x.league.id] ? ` ${LIGA[x.league.id]}` : ''} ${x.table.points} p` : '-']]),
        pair('Form', (x) => formBits(x.form || [])),
        pair('Hemma/borta', (x, side) => { const r = x.record && x.record[side]; return [[r ? `${r.w}-${r.d}-${r.l}` : '-']]; }));
    }
    return band('FOTBOLL', (d && d.match && d.match.compName) || COMP[m.comp] || '', [when]) + body(rows) + fast();
  }

  // Formen i ligan ur matcherna: de fem senaste, den senaste först. Dolda
  // resultat syns inte här: då står ridån för hela tabellen (veil).
  function leagueForm(T, comp, name) {
    if (!T.forms.has(comp)) {
      const by = new Map();
      const ms = T.matches().filter((m) => m.comp === comp && m.completed && m.score).sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
      for (const m of ms) {
        for (const side of ['home', 'away']) {
          const l = by.get(m[side]) || [];
          if (l.length >= 5) continue;
          const [f, a] = side === 'home' ? [m.score.home, m.score.away] : [m.score.away, m.score.home];
          l.push(f > a ? ['V', 'g'] : f < a ? ['F', 'r'] : ['O', 'y']);
          by.set(m[side], l);
        }
      }
      T.forms.set(comp, by);
    }
    return T.forms.get(comp).get(name) || [];
  }

  // Färgen på placeringen: uppåt grön, kval och Europa cyan, nedflyttning röd.
  function zone(note) {
    if (/relegation/i.test(note)) return 'r';
    if (/playoff|europa|conference/i.test(note)) return 'c';
    if (/champions league|promotion/i.test(note)) return 'g';
    return 'w';
  }

  function tableSubs(T, dv) {
    const d = T.teams.get(dv.id);
    const n = (d && d.teams && d.teams.length) || dv.size;
    return veil(T, dv) ? 1 : Math.ceil(n / perTable(n));
  }

  function tablePage(T, k, sub) {
    const dv = DIVS[k];
    const d = T.teams.get(dv.id);
    const v = veil(T, dv);
    const list = d && d.teams ? d.teams.slice().sort((a, b) => a.rank - b.rank) : [];
    const per = perTable(list.length || dv.size);
    const subs = v ? 1 : Math.max(1, Math.ceil((list.length || dv.size) / per));
    let rows = [];
    if (v) rows = veilRows(v, dv);
    else if (d === false || (d && !list.length)) rows = [null, line(' Tabellen saknas just nu.')];
    else {
      rows = list.slice(sub * per, sub * per + per).map((x) => line(' ', [rpad(x.rank, 2), zone(x.note)], ' ', pad(team(T, x.name, 16), 16),
        rpad(x.m, 3), rpad(signed(x.gd), 4), [rpad(x.pts, 4), 'y'], '  ', ...leagueForm(T, dv.id, x.name)));
    }
    return band('TABELL', chooser(TAB, k), `${dv.name}${subs > 1 ? `  ${sub + 1}/${subs}` : ''}`,
      v || !list.length ? '' : cols([[22, 'S'], [24, '+/-'], [30, 'P'], [33, 'Form']])) + body(rows) + fast();
  }

  // För långa namn: förnamnets initial, eller bara efternamnet.
  function person(name, n) {
    if (name.length <= n) return name;
    const [first, ...rest] = name.split(' ');
    const s = `${first[0]}. ${rest.join(' ')}`;
    return s.length <= n ? s : rest[rest.length - 1] || name;
  }

  function scorerPage(T, k) {
    const dv = DIVS[k];
    const d = T.players.get(dv.id);
    const v = veil(T, dv);
    const list = d && d.players ? d.players.filter((p) => p.g > 0).sort((a, b) => b.g - a.g || (b.a || 0) - (a.a || 0) || a.name.localeCompare(b.name, 'sv')) : [];
    let rows = [];
    if (v) rows = veilRows(v, dv);
    else if (d === false || (d && !list.length)) rows = [null, line(' Skytteligan saknas just nu.')];
    else {
      // delad placering: numret bara på den första
      rows = list.slice(0, 19).map((p, i) => line(' ', rpad(i && list[i - 1].g === p.g ? '' : list.findIndex((x) => x.g === p.g) + 1, 2), ' ',
        pad(person(p.name, 18), 18), ' ', [pad(team(T, p.team, 13), 13), 'c'], [rpad(p.g, 3), 'y']));
    }
    return band('SKYTTAR', chooser(SKY, k), dv.name, v || !list.length ? '' : cols([[36, 'Mål']])) + body(rows) + fast();
  }

  // ---------- sifferdisplayen ----------

  // Sju segment per siffra (a överst, sedan medurs, g i mitten); de släckta
  // syns svagt genom det röda glaset.
  const SEG = { a: [2, 0.6, 8, 1.8], b: [10.4, 2.6, 1.8, 7], c: [10.4, 11.2, 1.8, 7], d: [2, 18.6, 8, 1.8], e: [-0.2, 11.2, 1.8, 7], f: [-0.2, 2.6, 1.8, 7], g: [2, 9.6, 8, 1.8] };
  const DIG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
  function led(txt) {
    let s = '';
    [...txt].forEach((ch, i) => {
      for (const [k, [x, y, w, h]] of Object.entries(SEG)) s += `<rect${(DIG[ch] || '').includes(k) ? ' class="on"' : ''} x="${i * 15 + x}" y="${y}" width="${w}" height="${h}" rx=".7"/>`;
    });
    return `<svg viewBox="-2 0 46 21" aria-hidden="true"><g transform="skewX(-6)">${s}</g></svg>`;
  }

  // ---------- lådan ----------

  // Knappsatsen i panelen: 1–9 och ▼ 0 ▲ längst ner.
  const SATS = [...'123456789'].map((d) => [d, d]).concat([['ner', '▼', 'Föregående sida'], ['0', '0'], ['upp', '▲', 'Nästa sida']]);

  function html() {
    return '<i class="tv-sken" id="rum-tvsken"></i>' +
      '<div class="rum-tvpos"><div class="tv-fot"><i class="tv-platta"></i><i class="tv-arm"><i class="a-fram"></i><i class="a-under"></i></i><i class="tv-sladd"></i><i class="tv-uttag"></i></div>' +
      '<div class="rum-tv3" id="rum-tv3">' +
      '<i class="tv-antenn"><b class="folie"></b><b></b></i>' +
      '<i class="tv-hylla h-botten"></i><i class="tv-hylla h-fram"></i><i class="tv-hylla h-vanster"></i><i class="tv-hylla h-hoger"></i>' +
      '<i class="tv-f tv-kapa k-topp"></i><i class="tv-f tv-kapa k-botten"></i><i class="tv-f tv-kapa k-vanster"></i><i class="tv-f tv-kapa k-hoger"></i><i class="tv-f tv-kapa k-bak"></i>' +
      '<i class="tv-f tv-topp"></i><i class="tv-f tv-botten"></i><i class="tv-f tv-vanster"></i><i class="tv-f tv-hoger"></i>' +
      '<div class="tv-front" id="rum-tvfront" inert>' +
      '<div class="tv-ram"><div class="tv-glas" id="rum-ttx"><div class="tt"><div class="tr hd"></div><div class="tb"></div></div>' +
      '<i class="tv-scan"></i><i class="tv-glans"></i></div></div>' +
      `<div class="tv-panel"><span class="tv-led" id="rum-tvled">${led(String(LIVE))}</span>` +
      `<div class="tv-sats">${SATS.map(([k, t, label]) => `<button type="button" class="tv-k${label ? ' pil' : ''}" data-tv="${k}"${label ? ` aria-label="${label}"` : ''}>${t}</button>`).join('')}</div>` +
      '<i class="tv-galler"></i>' +
      '<button type="button" class="tv-pa" data-tv="pa" aria-label="Stäng av tv:n" aria-pressed="true"></button><i class="tv-lampa"></i></div>' +
      '<i class="tv-namn">Panasonic</i><i class="tv-fast">FASTEXT</i></div>' +
      '<a class="rum-tv rum-sak" href="#matcher" data-nav="tv" aria-label="Text-tv" id="rum-tv"></a>' +
      '</div></div>';
  }

  // ---------- i rummet ----------

  function mount(root, o) {
    const T = {
      rows: [], live: { spel: null, next: false }, nr: LIVE, sub: 0, json: new Map(), teams: new Map(), players: new Map(), forms: new Map(), typed: '', on: true, near: false,
      short: o.short, kort: o.kort || o.short, wd: o.wd, hm: o.hm, matches: o.matches || (() => []),
    };
    const box = root.querySelector('#rum-tv3');
    const front = root.querySelector('#rum-tvfront');
    const glas = root.querySelector('#rum-ttx');
    const hd = glas.querySelector('.hd');
    const tb = glas.querySelector('.tb');
    const ledEl = root.querySelector('#rum-tvled');
    const sken = root.querySelector('#rum-tvsken');
    const showLed = (txt) => { if (ledEl.dataset.v !== txt) { ledEl.dataset.v = txt; ledEl.innerHTML = led(txt); } };

    // Sidorna i nummerordning, och hur många undersidor en sida har.
    function pages() {
      const out = [INDEX, FIRST];
      for (let i = 0; i < Math.min(T.rows.length, MAXM); i++) out.push(FIRST + 1 + i);
      DIVS.forEach((d, k) => out.push(TAB + k));
      out.push(LIVE);
      DIVS.forEach((d, k) => out.push(SKY + k));
      return out;
    }
    const exists = (nr) => pages().includes(nr);
    function subsOf(nr) {
      if (nr === FIRST) return Math.max(1, Math.ceil(T.rows.length / PER));
      if (nr === LIVE) return Math.max(1, Math.ceil(T.rows.length / LPER));
      if (nr >= TAB && nr < TAB + DIVS.length) return tableSubs(T, DIVS[nr - TAB]);
      return 1;
    }

    // Filerna hämtas när sidan visas första gången.
    function load(map, id, path) {
      if (map.has(id)) return;
      map.set(id, null);
      getJSON(path).then((d) => { map.set(id, d); }, () => { map.set(id, false); }).then(() => { if (!T.roll) draw(false); });
    }
    function need(nr) {
      const x = T.rows[nr - FIRST - 1];
      if (nr > FIRST && nr < TAB && x) load(T.json, x.m.id, `data/match/${encodeURIComponent(x.m.id)}.json`);
      const dv = DIVS[nr - TAB] || DIVS[nr - SKY];
      if (nr >= TAB && nr < TAB + DIVS.length) load(T.teams, dv.id, `data/teams/${dv.id}.json`);
      if (nr >= SKY && nr < SKY + DIVS.length) load(T.players, dv.id, `data/players/${dv.id}.json`);
    }
    function page(nr, sub) {
      if (nr === INDEX) return indexPage();
      if (nr === FIRST) return listPage(T, sub);
      if (nr > FIRST && nr < TAB) return matchPage(T, nr - FIRST - 1);
      if (nr >= TAB && nr < TAB + DIVS.length) return tablePage(T, nr - TAB, sub);
      if (nr === LIVE) return livePage(T, sub);
      return scorerPage(T, nr - SKY);
    }

    // Sidan: ritas om bara när den har ändrats; ny = uppifrån och ner.
    function draw(ny) {
      need(T.nr);
      T.sub = Math.min(T.sub, subsOf(T.nr) - 1);
      const h = page(T.nr, T.sub);
      if (h !== tb.dataset.h) {
        tb.innerHTML = h;
        tb.dataset.h = h;
      }
      if (ny && !o.calm()) {
        glas.classList.remove('ny');
        void glas.offsetWidth;
        glas.classList.add('ny');
        sken.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
      }
    }
    function tick() {
      if (root.hidden || !T.on) return;
      // medan man slår siffrorna står de där sidnumret står, som på riktig text-tv
      const h = head(T.typed ? T.typed.padEnd(3, '-') : T.roll || T.nr, Boolean(T.roll));
      if (hd.dataset.h !== h) {
        hd.innerHTML = h;
        hd.dataset.h = h;
      }
      // på håll bläddrar undersidorna själva var tolfte sekund
      const subs = subsOf(T.nr);
      if (!T.near && !T.roll && subs > 1) {
        const sub = Math.floor(Date.now() / 12000) % subs;
        if (sub !== T.sub) {
          T.sub = sub;
          draw(true);
        }
      }
    }
    setInterval(tick, 250);

    // Sök sidan: numret i rubrikraden rullar fram (som när tv:n väntade på
    // att sidan skulle sändas), och finns den inte går tv:n tillbaka.
    function go(nr, sub = 0) {
      if (!T.on) return;
      clearTimeout(T.timer);
      T.typed = '';
      showLed(String(nr));
      const found = exists(nr);
      const land = () => {
        T.roll = 0;
        T.nr = nr;
        T.sub = sub;
        T.forms.clear();
        draw(!o.calm());
        tick();
      };
      if (o.calm()) {
        if (found) land();
        T.roll = 0;
        showLed(String(T.nr));
        draw(false);
        tick();
        return;
      }
      let at = found ? nr - 12 : T.roll || T.nr;
      let left = 30;
      const next = () => {
        at = at >= 399 ? 300 : at + 1;
        T.roll = at;
        left--;
        tick();
        if (found && at === nr) land();
        else if (left <= 0) {
          T.roll = 0;
          showLed(String(T.nr));
          tick();
        } else T.timer = setTimeout(next, 38);
      };
      next();
    }
    // ▲ ▼: undersidorna först, sedan nästa sida i nummerordning (runt).
    function step(d) {
      if (!T.on) return;
      const sub = T.sub + d;
      if (!T.roll && sub >= 0 && sub < subsOf(T.nr)) {
        T.sub = sub;
        draw(true);
        return;
      }
      const list = pages();
      const ix = Math.max(0, list.indexOf(T.nr));
      const nr = list[(ix + d + list.length) % list.length];
      go(nr, d < 0 ? subsOf(nr) - 1 : 0);
    }
    // En siffra från knappsatsen eller tangentbordet: tre siffror väljer sida,
    // och displayen visar dem medan man slår dem.
    function digit(d) {
      if (!T.on) return false;
      T.typed += d;
      showLed(T.typed.padEnd(3, '-'));
      if (T.typed.length === 3) go(Number(T.typed));
      else tick();
      return true;
    }
    function power() {
      T.on = !T.on;
      clearTimeout(T.timer);
      T.roll = 0;
      box.classList.toggle('av', !T.on);
      sken.classList.toggle('av', !T.on);
      const b = box.querySelector('[data-tv="pa"]');
      b.setAttribute('aria-pressed', String(T.on));
      b.setAttribute('aria-label', T.on ? 'Stäng av tv:n' : 'Sätt på tv:n');
      showLed(T.on ? String(T.nr) : '   ');
      if (T.on) {
        draw(false);
        tick();
      }
      if (!o.calm()) {
        glas.classList.remove('slocknar', 'tands');
        void glas.offsetWidth;
        glas.classList.add(T.on ? 'tands' : 'slocknar');
      }
    }

    box.addEventListener('click', (e) => {
      if (!T.near) return;
      const b = e.target.closest('[data-tv], [data-sida], [data-visa]');
      if (!b) return;
      // sidan kan ritas om direkt, och då finns knappen inte kvar när rummet
      // får klicket – det skulle zooma ut
      e.preventDefault();
      e.stopPropagation();
      if (b.dataset.tv === 'pa') power();
      else if (/^[0-9]$/.test(b.dataset.tv)) digit(b.dataset.tv);
      else if (b.dataset.tv) step(b.dataset.tv === 'upp' ? 1 : -1);
      else if (b.dataset.visa) { if (window.Spoiler) Spoiler.show(b.dataset.visa.split(' ')); }
      else go(Number(b.dataset.sida));
    });

    return {
      fill(rows, { spel = null, next = false } = {}) {
        T.rows = rows;
        T.live = { spel, next };
        T.forms.clear();
        if (!exists(T.nr)) {
          T.nr = FIRST;
          T.sub = 0;
        }
        if (!T.roll) draw(false);
        tick();
      },
      // Nära: tv:n vrids mot en och knapparna går att trycka på. Svarar med
      // frontens mått i det läge den vrids till (för kameran i rum.js).
      zoom(on) {
        T.near = on;
        front.inert = !on;
        if (!on && T.typed) {
          T.typed = '';
          showLed(T.on ? String(T.nr) : '   ');
        }
        box.classList.add('mat');
        box.classList.toggle('nara', on);
        const r = front.getBoundingClientRect();
        box.classList.toggle('nara', !on);
        void box.offsetWidth;
        box.classList.remove('mat');
        void box.offsetWidth;
        box.classList.toggle('nara', on);
        return r;
      },
      // Tangenterna när tv:n är nära: pilarna bläddrar, tre siffror väljer sida.
      key(k) {
        if (/^[0-9]$/.test(k)) return digit(k);
        if (/^Arrow(Up|Right)$/.test(k)) step(1);
        else if (/^Arrow(Down|Left)$/.test(k)) step(-1);
        else return false;
        return true;
      },
    };
  }

  return { html, mount };
})();
