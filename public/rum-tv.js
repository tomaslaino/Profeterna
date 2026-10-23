// Tv:n i tobaksaffären (rum.js): en tjock-tv i träfaner från början av
// åttiotalet som hänger i en stång från taket i hörnet, vriden mot pulten.
// Lådan är byggd i CSS 3D (rum-tv.css) i samma värld som resten av rummet,
// så att sidan och undersidan syns och följer musen, och bakom den sticker
// bildrörets kåpa ut. På taket står kaninöronen, det ena med en bit folie
// för bättre bild. Till höger om rutan sitter panelen: färgmärket, den
// röda sifferdisplayen med sidnumret, sidknapparna ▲ ▼, högtalargallret och
// strömbrytaren. När man går fram till tv:n (T) vrids den mot en.
//
// Text-tv som SVT:s: 40 × 25 tecken, rubrikraden med sidnumret, datumet och
// klockan som tickar, ett blått band med rubriken i mosaikgrafik, text i sju
// färger, dubbelhöga rader och snabbvalen i rött, grönt, gult och cyanblått
// längst ner. Sida 331 har omgångens matcher (en rad per match, som leder
// till matchens sida) och 332 och framåt en sida per match: ligan, avsparken
// eller ställningen, oddsen och lagens rader i tabellen ur matchens fil
// (data/match/<id>.json, hämtas när sidan visas). Byter man sida söker tv:n
// som förr: sidnumret i rubrikraden rullar fram tills sidan kommer, och den
// ritas uppifrån och ner. Dolda resultat (Spoiler) står som ?.
//
// Sidbyten när tv:n är nära: sidknapparna, snabbvalen, raderna på 331,
// piltangenterna eller tre siffror (som på fjärrkontrollen).
//
// RumTv.html() → tv:n (i planet -470 i rum.js)
// RumTv.mount(el, { calm, short, kort, wd, hm }) → { fill(rows), zoom(on) → rutans mått, key(k) }

window.RumTv = (() => {
  const COLS = 40;
  const FIRST = 331;
  // matcher per undersida på 331 (raderna 5–21)
  const PER = 17;
  const TZ = 'Europe/Stockholm';

  // ---------- text-tv ----------

  // En rad: bitar [text, färg, bakgrund] efter varandra, fylld till 40 tecken.
  // Färgerna: w vit, y gul, c cyan, g grön, r röd, m magenta, b blå.
  function line(...bits) {
    let n = 0;
    let html = '';
    for (const b of bits) {
      if (b == null || b === '') continue;
      const [text, fg = 'w', bg = ''] = Array.isArray(b) ? b : [b];
      const t = String(text).slice(0, COLS - n);
      if (!t) continue;
      n += t.length;
      html += `<span class="${fg}${bg ? ` b${bg}` : ''}">${esc(t)}</span>`;
    }
    return html + ' '.repeat(COLS - n);
  }
  const pad = (s, n) => String(s).slice(0, n).padEnd(n, ' ');
  const rpad = (s, n) => String(s).slice(0, n).padStart(n, ' ');

  // Rubriken i mosaikgrafik: bokstäver i 5 × 7 klossar, två klossar breda och
  // tre höga per tecken, så att en bokstav tar tre tecken i bredd.
  const GLYPH = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    B: '####.|#...#|#...#|####.|#...#|#...#|####.',
    C: '.###.|#...#|#....|#....|#....|#...#|.###.',
    E: '#####|#....|#....|####.|#....|#....|#####',
    F: '#####|#....|#....|####.|#....|#....|#....',
    H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
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

  // Bandet: raderna 1–3 i blått, rubriken i gula klossar och två korta rader
  // till höger.
  function band(title, r1 = '', r2 = '') {
    const row = (t) => `<div class="tr">${line([' '.repeat(COLS - 1 - t.length), 'w', 'b'], [t, 'w', 'b'], [' ', 'w', 'b'])}</div>`;
    return `<div class="band"><span class="sr">${esc(title)}</span>${row(r1)}${row(r2)}${row('')}${mosaic(title)}</div>`;
  }

  const fHead = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const fWhen = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const partsOf = (f, d) => Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value.replace('.', '')]));

  // Rubrikraden: sidnumret (grönt medan det rullar), namnet, datumet och klockan.
  function head(nr, rolling) {
    const p = partsOf(fHead, new Date());
    return line(' ', [String(nr), rolling ? 'g' : 'w'], ' Matchfix Text  ', pad(`${p.weekday} ${p.day} ${p.month}`, 10), ' ', [`${p.hour}:${p.minute}:${p.second}`, 'y']);
  }

  // Snabbvalen längst ner: fyra fält om tio tecken. sida = en sida på tv:n,
  // annars en länk vidare.
  function fast(keys) {
    return '<div class="tr fast">' + keys.map(([label, fg, to]) => {
      const t = esc(pad(` ${label}`, 10));
      return typeof to === 'number' ? `<button type="button" class="${fg}" data-sida="${to}">${t}</button>` : `<a class="${fg}" ${to}>${t}</a>`;
    }).join('') + '</div>';
  }

  // Raderna 4–23: en sträng per rad, { html, dh } för en dubbelhög (tar två),
  // { html, sida } för en rad som leder till en sida, null för en tom.
  function body(rows) {
    let out = '';
    let n = 0;
    for (const r of rows) {
      if (n >= 20) break;
      const html = r == null ? ' '.repeat(COLS) : typeof r === 'string' ? r : r.html;
      if (r && r.dh) {
        out += `<div class="tr dh" style="--i: ${n}"><span class="in">${html}</span></div>`;
        n += 2;
      } else if (r && r.sida) {
        out += `<button type="button" class="tr" style="--i: ${n}" data-sida="${r.sida}">${html}</button>`;
        n++;
      } else {
        out += `<div class="tr" style="--i: ${n}">${html}</div>`;
        n++;
      }
    }
    for (; n < 20; n++) out += `<div class="tr">${' '.repeat(COLS)}</div>`;
    return out;
  }

  // ---------- sidorna ----------

  const done = (g) => g.state === 'final' || g.state === 'live';
  const ord = (n) => `${n}:${/1[12]$/.test(n) || !/[12]$/.test(n) ? 'e' : 'a'}`;
  const odds = (x) => (x == null ? '-' : x.toFixed(2).replace('.', ','));
  const COMP = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two', fac: 'FA-cupen', lc: 'Ligacupen' };
  const LIGA = { pl: 'PL', ch: 'CH', l1: 'L1', l2: 'L2' };

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

  function listPage(T, sub) {
    const subs = Math.max(1, Math.ceil(T.rows.length / PER));
    const list = T.rows.slice(sub * PER, sub * PER + PER);
    const rows = [null];
    T.rows.forEach((x, i) => {
      if (!list.includes(x)) return;
      const k = new Date(x.m.kickoff);
      const [st, fg] = status(x.g) || [`${T.wd(k)} ${T.hm(k)}`, 'c'];
      rows.push({ sida: FIRST + 1 + i, html: line(' ', pad(teams(T, x.m, 23), 23), ' ', [pad(st, 10), fg], ' ', [String(FIRST + 1 + i), 'y']) });
    });
    if (!T.rows.length) rows.push(null, line(' Inga matcher just nu.'));
    return band('MATCHER', subs > 1 ? `${sub + 1}/${subs}` : '', T.rows.length ? `${T.rows.length} matcher` : '') + body(rows) +
      fast([['Kupong', 'r', 'href="#kupong" data-to="kupong"'], ['Olympen', 'g', 'href="#olympen" data-to="olympen"'],
        ['Tabell', 'y', 'href="tabeller.html" data-to="tabeller"'], ['Statistik', 'c', 'href="statistik.html" data-to="statistik"']]);
  }

  function matchPage(T, i) {
    const { m, g } = T.rows[i];
    const nr = FIRST + 1 + i;
    const d = T.json.get(m.id);
    const st = status(g, true);
    const k = new Date(m.kickoff);
    const p = partsOf(fWhen, k);
    const score = g.state === 'hidden' ? '?' : done(g) && g.score ? `${g.score.home}-${g.score.away}` : '';
    const rows = [null, { dh: true, html: line(' ', pad(teams(T, m, 32), 32), [rpad(score, 6), 'y']) },
      st ? line(' ', [st[0], st[1]]) : line(' ', [`${p.weekday[0].toUpperCase()}${p.weekday.slice(1)} ${p.day} ${p.month} ${p.hour}.${p.minute}`, 'c']),
      d && d.match && d.match.venue ? line(' ', d.match.venue) : null, null];
    const o = m.odds || [];
    if (o.length === 3) rows.push(line(' '.repeat(12), [['1', 'X', '2'].map((s) => rpad(s, 8)).join(''), 'c']), line(' Odds', ' '.repeat(7), [o.map((x) => rpad(odds(x), 8)).join(''), 'y']), null);
    else rows.push(null, null, null);
    // lagens rader i tabellen – inte när resultatet är dolt (tabellen kan ha det)
    const t = d && d.teams;
    if (t && t.home && t.away && g.state !== 'hidden') {
      const both = (label, f) => {
        const a = f(t.home, 'home');
        const b = f(t.away, 'away');
        return a == null && b == null ? null : line(' ', pad(label, 11), [rpad(a == null ? '-' : a, 13) + rpad(b == null ? '-' : b, 13), 'w']);
      };
      const rec = (r) => (r ? `${r.w}-${r.d}-${r.l}` : null);
      rows.push(line(' '.repeat(12), [rpad(T.kort(m.home), 13) + rpad(T.kort(m.away), 13), 'c']),
        both('Tabell', (x) => (x.table ? ord(x.table.rank) + (x.league && x.league.id !== m.comp && LIGA[x.league.id] ? ` ${LIGA[x.league.id]}` : '') : null)),
        both('Poäng', (x) => (x.table ? x.table.points : null)),
        both('V-O-F', (x) => rec(x.record && x.record.all)),
        both('Mål', (x) => (x.record && x.record.all ? `${x.record.all.gf}-${x.record.all.ga}` : null)),
        both('Hemma/borta', (x, side) => rec(x.record && x.record[side])));
    }
    const last = FIRST + T.rows.length;
    return band('FOTBOLL', '', (d && d.match && d.match.compName) || COMP[m.comp] || '') + body(rows) +
      fast([['Föreg', 'r', nr - 1], ['Nästa', 'g', nr === last ? FIRST : nr + 1], ['Omgången', 'y', FIRST], ['Matchen', 'c', `href="#match/${esc(m.id)}"`]]);
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

  function html() {
    return '<i class="tv-sken" id="rum-tvsken"></i>' +
      '<div class="rum-tvpos"><div class="rum-tv3" id="rum-tv3">' +
      '<i class="tv-stang"></i><i class="tv-kabel"></i><i class="tv-antenn"><b class="folie"></b><b></b></i>' +
      '<i class="tv-f tv-kapa k-topp"></i><i class="tv-f tv-kapa k-botten"></i><i class="tv-f tv-kapa k-vanster"></i><i class="tv-f tv-kapa k-hoger"></i><i class="tv-f tv-kapa k-bak"></i>' +
      '<i class="tv-f tv-topp"></i><i class="tv-f tv-botten"></i><i class="tv-f tv-vanster"></i><i class="tv-f tv-hoger"></i>' +
      '<div class="tv-front" id="rum-tvfront" inert>' +
      '<div class="tv-ram"><div class="tv-glas" id="rum-ttx"><div class="tt"><div class="tr hd"></div><div class="tb"></div></div>' +
      '<i class="tv-scan"></i><i class="tv-glans"></i></div></div>' +
      '<div class="tv-panel"><i class="tv-farg"><b></b><b></b><b></b><b></b><b></b><em>färg</em></i>' +
      `<span class="tv-led" id="rum-tvled">${led(String(FIRST))}</span>` +
      '<button type="button" class="tv-k" data-tv="upp" aria-label="Nästa sida"><i>▲</i></button>' +
      '<button type="button" class="tv-k" data-tv="ner" aria-label="Föregående sida"><i>▼</i></button>' +
      '<i class="tv-galler"></i>' +
      '<button type="button" class="tv-pa" data-tv="pa" aria-label="Stäng av tv:n" aria-pressed="true"></button><i class="tv-lampa"></i></div>' +
      '<i class="tv-namn">TEXT-TV</i></div>' +
      '<a class="rum-tv rum-sak" href="#matcher" data-nav="tv" aria-label="Text-tv" id="rum-tv"></a>' +
      '</div></div>';
  }

  // ---------- i rummet ----------

  function mount(root, o) {
    const T = { rows: [], nr: FIRST, sub: 0, json: new Map(), typed: '', on: true, near: false, short: o.short, kort: o.kort || o.short, wd: o.wd, hm: o.hm };
    const box = root.querySelector('#rum-tv3');
    const front = root.querySelector('#rum-tvfront');
    const glas = root.querySelector('#rum-ttx');
    const hd = glas.querySelector('.hd');
    const tb = glas.querySelector('.tb');
    const ledEl = root.querySelector('#rum-tvled');
    const sken = root.querySelector('#rum-tvsken');
    const exists = (nr) => nr === FIRST || (nr > FIRST && nr <= FIRST + T.rows.length);
    const showLed = (txt) => { if (ledEl.dataset.v !== txt) { ledEl.dataset.v = txt; ledEl.innerHTML = led(txt); } };

    // Sidan: ritas om bara när den har ändrats; ny = uppifrån och ner.
    function draw(ny) {
      const i = T.nr - FIRST - 1;
      if (i >= 0 && !T.json.has(T.rows[i].m.id)) fetchMatch(T.rows[i].m.id);
      const h = T.nr === FIRST ? listPage(T, T.sub) : matchPage(T, i);
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
      const h = head(T.roll || T.nr, Boolean(T.roll));
      if (hd.dataset.h !== h) {
        hd.innerHTML = h;
        hd.dataset.h = h;
      }
      // fler än 17 matcher: 331 bläddrar mellan undersidorna var tolfte sekund
      const subs = Math.ceil(T.rows.length / PER);
      const sub = subs > 1 ? Math.floor(Date.now() / 12000) % subs : 0;
      if (T.nr === FIRST && !T.roll && sub !== T.sub) {
        T.sub = sub;
        draw(true);
      }
    }
    setInterval(tick, 250);

    function fetchMatch(id) {
      T.json.set(id, null);
      getJSON(`data/match/${encodeURIComponent(id)}.json`).then((d) => {
        T.json.set(id, d);
        if (T.rows[T.nr - FIRST - 1] && T.rows[T.nr - FIRST - 1].m.id === id && !T.roll) draw(false);
      }).catch(() => {});
    }

    // Sök sidan: numret i rubrikraden rullar fram (som när tv:n väntade på
    // att sidan skulle sändas), och finns den inte går tv:n tillbaka.
    function go(nr) {
      if (!T.on) return;
      clearTimeout(T.timer);
      T.typed = '';
      showLed(String(nr));
      if (o.calm()) {
        if (exists(nr)) T.nr = nr;
        T.roll = 0;
        showLed(String(T.nr));
        draw(false);
        tick();
        return;
      }
      const found = exists(nr);
      let at = found ? nr - 12 : T.roll || T.nr;
      let left = 30;
      const next = () => {
        at = at >= 399 ? 300 : at + 1;
        T.roll = at;
        left--;
        tick();
        if (found && at === nr) {
          T.roll = 0;
          T.nr = nr;
          draw(true);
          tick();
        } else if (left <= 0) {
          T.roll = 0;
          showLed(String(T.nr));
          tick();
        } else T.timer = setTimeout(next, 38);
      };
      next();
    }
    function step(d) {
      const last = FIRST + T.rows.length;
      go(T.nr + d > last ? FIRST : T.nr + d < FIRST ? last : T.nr + d);
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
      const b = e.target.closest('[data-tv], [data-sida]');
      if (!b) return;
      e.preventDefault();
      if (b.dataset.tv === 'pa') power();
      else if (b.dataset.tv) step(b.dataset.tv === 'upp' ? 1 : -1);
      else go(Number(b.dataset.sida));
    });

    return {
      fill(rows) {
        T.rows = rows;
        if (!exists(T.nr)) T.nr = FIRST;
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
        if (/^[0-9]$/.test(k) && T.on) {
          T.typed += k;
          showLed(T.typed.padEnd(3, '-'));
          if (T.typed.length === 3) go(Number(T.typed));
          return true;
        }
        if (/^Arrow(Up|Right)$/.test(k)) step(1);
        else if (/^Arrow(Down|Left)$/.test(k)) step(-1);
        else return false;
        return true;
      },
    };
  }

  return { html, mount };
})();
