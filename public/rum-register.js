'use strict';

// Registret i tobaksaffären (rum.js): en 90-talsdator på disken under
// Tipsligan, i three.js (rum-dator.js), med en terminal som i spionfilmerna
// runt 2000 – grön text på svart, MATCHFIXARNA REGISTER. Datorn har det om
// lagen och spelarna som tv:n inte visar, och sedan 2026-11-11 också allt som
// står på anslagstavlan (rum-anslag.js), ordnat efter match, lista, lag och
// spelare.
//
// Överst står menyraden, som alltid står still:
//   KUPONGEN   omgångens matcher med lagens form; en match öppnar matchakten:
//              allt om matchen på ett ställe – lagen sida vid sida med formen,
//              vilan, dagar till nästa match, tavlans tal (styrkan, kryssen,
//              turen, mot oddsen och motståndet) och lagkortens siffror (mål
//              och xG per match, hur ofta laget har varit favorit, skytten),
//              sedan skadorna och mötena
//   TOPPLISTOR tavlans lappar som listor över hela omgången: styrkan (per
//              division), kryss, tur och otur, mot oddsen och motståndet
//   LAGEN      de fyra divisionerna, lagen i omgången ljusa med matchens
//              nummer; ett lag öppnar lagkortet med truppen (speltid, mål, de
//              skadade), och en spelare spelarkortet: läget, speltiden, mål
//              och xG, och hur laget har gått med och utan honom i startelvan
//              mot oddsen (mu i data/players/<division>.json)
// Längst ner står sökraden (SÖK >). Den svarar medan man skriver: träffarna
// (lag och spelare i alla divisionerna, omgångens möten, topplistorna och
// flikarna) står i utskriften med den bästa markerad, och Enter öppnar den.
// Felstavat går också (MENADE DU), laget kan stå med (saka arsenal), och
// smeknamnen (spurs, wolves) hittar lagen. En siffra och Enter väljer raden med
// det numret. Under den står tangenterna: Esc tillbaka (och stänger överst),
// ↑/↓ och Enter väljer en rad, ←/→ bläddrar till förra och nästa match, lista,
// division, lag eller spelare i truppen, och bland flikarna överst. I telefonen
// räcker det att trycka: allt går att trycka på, och raden längst ner har
// Tillbaka, Förra och Nästa.
//
// Ett klick på datorn (eller R): kameran svänger fram och ställer sig rakt
// framför skärmen medan rummet mörknar bakom, och terminalen tar över
// skärmen. Tillbaka visar skärmen i rummet det som stod sist. I en stående
// telefon går kameran så nära att skärmen fyller höjden och dess sidor ligger
// utanför bilden: terminalen går från kant till kant med så stor text som
// BRED tecken tillåter, och slutar ovanför tangentbordet när man skriver.
//
// Dolda resultat (Spoiler): det som räknar med resultaten (styrkan, kryssen,
// turen, oddsen, motståndet, lagkortens siffror, truppens speltid och mål och
// spelarkorten) visar ? när en match i
// lagens divisioner är dold – samma nyckel som anslagstavlan, så att Visa ändå
// gäller båda – och formen och mötena har ? för de dolda matcherna.
//
// RumRegister.html() → länken på disken med duken (i planet -600 i rum.js)
// RumRegister.nara() → närbilden
// RumRegister.mount(root, { calm, kort, close, tur }) → { fill(ms, all), ready(), wait(), at(), open(on, från), on(), lift(text), key(k) }

window.RumRegister = (() => {
  const TZ = 'Europe/Stockholm';
  const DAY = 86400000;
  const DIVS = ['pl', 'ch', 'l1', 'l2'];
  const DIVNAME = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two' };
  const DIVK = { pl: 'PL', ch: 'CH', l1: 'L1', l2: 'L2', fac: 'FA-CUPEN', efl: 'LIGACUPEN' };
  const MAN = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const MANAD = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
  const POS = { MV: 'målvakt', B: 'back', MF: 'mittfältare', A: 'anfallare' };
  // mötena: så många som sajten har (de sex senaste från tidigare säsonger och säsongens)
  const MOTEN = 11;
  // cuperna i schemat (matchens fil) som på sajten; Europacuperna heter CL, EL och ECL
  const TAV = { EFL: 'Ligacupen', FAC: 'FA-cupen' };
  // flest träffar i en lista
  const LISTA = 20;
  // duken på disken (scenens px), där datorn syns med sin skugga
  const BOX = { x: 1200, y: 425, w: 250, h: 150 };
  // terminalen: minst så här breda rader (telefonen), och så många rader ryms på höjden (dator)
  const BRED = 40;
  const RADER = 20;
  // ett tecken i VT323 är så brett (em), och så mycket luft har terminalen i
  // telefonen (em; som .rum-regn.tel i rum-register.css): sidorna, överst,
  // nederst och mellan raderna
  const TECKEN = 0.4;
  const LUFT_TEL = { sida: 0.6, topp: 0.7, fot: 0.6, rad: 1.25 };
  const FLIKAR = [['kupongen', 'KUPONGEN'], ['listor', 'TOPPLISTOR'], ['lagen', 'LAGEN']];
  // tavlans lappar med topplistor (formen, vilan och skadorna står på kupongen och i matchakten)
  const AMNEN = [['styrka', 'STYRKA'], ['kryss', 'KRYSS'], ['tur', 'TUR'], ['odds', 'ODDSEN'], ['motstand', 'MOTSTÅND']];
  const SKADA = { skadad: '', avstängd: ' (AVST.)', 'ej uttagbar': '', tveksam: '?' };
  const SOK = 'SÖK > ';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (x, d = 1) => Math.abs(x).toFixed(d).replace('.', ',');
  const signed = (x, d = 1) => {
    const t = num(x, d);
    return Number(t.replace(',', '.')) === 0 ? t : x > 0 ? `+${t}` : `−${t}`;
  };
  const pct = (x) => `${Math.round(x * 100)} %`;
  const up = (s) => String(s).toLocaleUpperCase('sv');
  const pad = (s, n) => String(s).padEnd(n);
  const padL = (s, n) => String(s).padStart(n);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
  const getJSON = (path) => fetch(path, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
  const vanta = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- datan ----------

  const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const dayNo = (t) => Math.round(Date.parse(`${fDay.format(new Date(t))}T00:00:00Z`) / DAY);
  const fDel = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const delar = (t) => Object.fromEntries(fDel.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  // '15 mar 2025' ur ett datum (ÅÅÅÅ-MM-DD) eller en avspark
  function dag(s) {
    const [y, m, d] = (/^\d{4}-\d\d-\d\d$/.test(s) ? s : fDay.format(new Date(s))).split('-').map(Number);
    return `${d} ${MAN[m - 1]} ${y}`;
  }
  // 'LÖR 7 NOV 16.00'
  function avspark(t) {
    const p = delar(t);
    return up(`${p.weekday.slice(0, 3)} ${Number(p.day)} ${MAN[Number(p.month) - 1]} ${p.hour}.${p.minute}`);
  }
  // V, O eller F för laget efter 90 minuter
  function letter(m, team) {
    const s = m.score90 || m.score;
    if (!s) return '';
    const [f, a] = m.home === team ? [s.home, s.away] : [s.away, s.home];
    return f > a ? 'V' : f < a ? 'F' : 'O';
  }
  // 'Alexander Isak' → 'ISAK, ALEXANDER' (van, de … hör till efternamnet)
  function efternamn(n) {
    const t = String(n).split(/\s+/);
    if (t.length < 2) return up(n);
    let i = t.length - 1;
    while (i > 1 && /^(van|von|de|der|den|da|das|do|dos|di|del|la|le|mac|bin|ter|ten)$/i.test(t[i - 1])) i--;
    return up(`${t.slice(i).join(' ')}, ${t.slice(0, i).join(' ')}`);
  }
  const sistaNamn = (n) => efternamn(n).split(',')[0];
  const off = (m) => /POSTPONED|CANCEL|ABANDON|SUSPEND/.test(m.status || '');
  const tavNamn = (c) => up(DIVNAME[c] || TAV[up(c)] || c || '');

  // Tavlans tal ur lagfilerna (som rum-anslag.js och Statistik → Lagen)
  const fdOf = (t, k) => (t && t.fd ? t.fd[k] : null);
  const TAL = {
    styrka: (t) => (t && t.str != null ? t.str : null),
    kryss: (t) => { const x = fdOf(t, 'xg'); return x && x.n ? x.xd / x.n : null; },
    tur: (t) => { const x = fdOf(t, 'xg'); return x ? x.pts - x.xp : null; },
    odds: (t) => { const x = fdOf(t, 'mkt'); return x ? x.pts - x.xp : null; },
    motstand: (t) => fdOf(t, 'opp'),
  };

  // ---------- raderna ----------
  //
  // En rad är en lista av bitar [text, klass, fråga]: klass '' (grönt), d
  // (svagt), v (ljust), i (omvänt) eller st (en stapel); fråga gör biten tryckbar. En rad med
  // .q är tryckbar i sin helhet, och [['', 'hr']] är ett streck.

  const tom = () => [];
  const rad = (...b) => b.map((x) => (Array.isArray(x) ? x : [x, '']));
  const radQ = (q, ...b) => Object.assign(rad(...b), { q });
  const streck = () => [['', 'hr']];
  const prickar = (vanster, hoger, bred = BRED) => rad([`${vanster} ${'.'.repeat(Math.max(3, Math.min(bred, 40) - vanster.length - hoger.length - 2))} ${hoger}`, 'd']);
  const traffar = (n) => (n ? `${n} ${n === 1 ? 'TRÄFF' : 'TRÄFFAR'}` : 'INGA TRÄFFAR');
  const bit = ([t, k, q]) => (q
    ? `<span class="a${k ? ` ${k}` : ''}" data-q="${esc(q)}">${esc(t)}</span>`
    : k ? `<span class="${k}">${esc(t)}</span>` : esc(t));

  function html(rader) {
    return rader.map((r) => (r.length === 1 && r[0][1] === 'hr' ? '<div class="tr hr"></div>'
      : `<div class="tr${r.q ? ' a' : ''}"${r.q ? ` data-q="${esc(r.q)}"` : ''}>${r.map(bit).join('')}</div>`)).join('');
  }

  // ---------- duken och närbilden ----------

  function html0() {
    return `<a class="rum-reg rum-sak" id="rum-reg" role="button" tabindex="0" data-nav="statistik" aria-label="Datorn" ` +
      `style="left:${BOX.x}px; top:${BOX.y}px; width:${BOX.w}px; height:${BOX.h}px"><canvas class="reg-duk" id="reg-duk"></canvas></a>`;
  }
  function nara() {
    return '<div class="rum-regn" id="rum-regn" role="dialog" aria-label="Datorn" tabindex="-1"><div class="reg-bak"></div><div class="reg-3d" id="reg-3d"></div>' +
      '<div class="reg-term" id="reg-term"><div class="reg-topp" id="reg-topp"></div><div class="reg-rull" id="reg-rull"><div id="reg-ut"></div></div>' +
      `<label class="tr reg-in"><span>${esc(SOK)}</span><input id="reg-fraga" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-label="Sök spelare, lag eller möte"><i class="reg-mark"></i></label>` +
      '<div class="reg-fot" id="reg-fot"></div><div class="reg-lin"></div></div>' +
      '<div class="reg-rad" id="reg-rad"><span id="reg-sp"></span></div></div>';
  }

  // ---------- i rummet ----------

  function mount(root, o) {
    const A = { on: false, ms: [], all: [], byTeam: new Map(), match: new Map(), stats: null, byEspn: new Map(), loaded: 0, L: null, P: null, vy: { flik: 'kupongen' }, bak: [], ut: '', lista: [], nr: 0, sk: 0, sel: -1, bred: BRED, R: null };
    const small = root.querySelector('#rum-reg');
    const duk = root.querySelector('#reg-duk');
    const ov = root.querySelector('#rum-regn');
    const term = root.querySelector('#reg-term');
    const topp = root.querySelector('#reg-topp');
    const rull = root.querySelector('#reg-rull');
    const ut = root.querySelector('#reg-ut');
    const fot = root.querySelector('#reg-fot');
    const inp = root.querySelector('#reg-fraga');
    const mark = root.querySelector('.reg-mark');
    const sp = root.querySelector('#reg-sp');
    const radEl = root.querySelector('#reg-rad');
    if (!small || !ov || !term) return null;
    const mus = matchMedia('(hover: hover) and (pointer: fine)');

    // datorn i three.js (hämtas med rummet; utan WebGL står disken tom)
    // (i telefonen när det blir dess tur, o.tur i rum.js)
    A.Lp = (o.tur || ((f) => f()))(() => import('./rum-dator.js').then((m) => m.dator({ duk, nara: root.querySelector('#reg-3d'), calm: o.calm, box: BOX }))
      .then((L) => { A.L = L; A.skarm = ''; draw(); }))
      .catch((err) => console.warn('Rummet: datorn kunde inte ritas', err));

    // lagfilerna (målen, xG, oddsen, styrkan) – om igen efter en kvart
    function loadTeams() {
      if (A.loading || Date.now() - A.loaded < 15 * 60000) return A.loading;
      A.loading = Promise.all(DIVS.map((d) => getJSON(`data/teams/${d}.json`).catch(() => null))).then((files) => {
        const map = new Map();
        const by = new Map();
        files.forEach((f, i) => {
          if (f && !f.unknown) for (const t of f.teams || []) {
            const x = { ...t, comp: DIVS[i] };
            map.set(t.name, x);
            if (t.espnId) by.set(String(t.espnId), x);
          }
        });
        A.stats = map;
        A.byEspn = by;
        A.loaded = Date.now();
        A.loading = null;
        draw();
      });
      return A.loading;
    }
    // spelarfilerna, när datorn startas första gången
    function loadPlayers() {
      if (!A.Pp) {
        A.Pp = Promise.all(DIVS.map((d) => getJSON(`data/players/${d}.json`).catch(() => null))).then((files) => {
          const P = { spelare: [], lag: new Map(), avail: new Map() };
          files.forEach((f, i) => {
            if (!f || f.unknown) return;
            for (const t of f.teams || []) P.lag.set(String(t.espnId), t);
            for (const [id, a] of Object.entries(f.availability || {})) if (a && !a.unknown) P.avail.set(String(id), a.players || []);
            for (const p of f.players || []) P.spelare.push({ p, div: DIVS[i], n: norm(p.name), t: norm(p.name).split(' ') });
          });
          A.P = P;
          draw();
          return P;
        });
      }
      return A.Pp;
    }
    // matchernas filer (formen, vilan, skadorna, mötena, nästa match) när datorn
    // startas, och de som kommer nära varandra ritas tillsammans
    function rita() {
      if (A.ritT) return;
      A.ritT = setTimeout(() => {
        A.ritT = 0;
        draw();
      }, 80);
    }
    function loadMatches() {
      for (const m of A.ms) {
        if (A.match.has(m.id)) continue;
        A.match.set(m.id, undefined);
        getJSON(`data/match/${encodeURIComponent(m.id)}.json`).then((d) => { A.match.set(m.id, d); rita(); })
          .catch(() => { A.match.set(m.id, null); rita(); });
      }
    }

    // dolda resultat i lagens divisioner: samma nyckel som anslagstavlan
    function slojan() {
      const stats = A.stats || new Map();
      if (!(window.Spoiler && Spoiler.on())) return { veil: false };
      const comps = new Set();
      for (const m of A.ms) for (const n of [m.home, m.away]) { const t = stats.get(n); if (t) comps.add(t.comp); }
      const recent = A.all.filter((m) => comps.has(m.comp) && Spoiler.hides(m.kickoff));
      const n = recent.filter(Spoiler.hidden).length;
      const key = `ans:${recent.map((m) => m.id).sort().join(',')}`;
      return { veil: n > 0 && !Spoiler.isShown(key), key, n };
    }
    const kort = (n) => up(o.kort(n));
    const lagOf = (n) => (A.stats ? A.stats.get(n) : null) || null;
    // laget i omgången: matchen och sidan
    const iOmgangen = (name) => { for (const m of A.ms) { if (m.home === name) return { m, side: 'home' }; if (m.away === name) return { m, side: 'away' }; } return null; };
    const omgLag = () => A.ms.flatMap((m) => [m.home, m.away]);

    // Lagets fem senaste före matchen, senaste först: ur matchens fil (med
    // Europacuperna) och ur matcherna tills den har hämtats
    function formOf(m, side) {
      const d = A.match.get(m.id);
      const T = d && d.teams && d.teams[side];
      if (T && T.form) return T.form.slice(0, 5).map((y) => (window.Spoiler && Spoiler.hidesDay(y.date) ? '?' : y.result || '?'));
      const before = Date.parse(m.kickoff);
      return (A.byTeam.get(m[side]) || []).filter((x) => x.completed && Date.parse(x.kickoff) < before).slice(0, 5)
        .map((x) => (window.Spoiler && Spoiler.hidden(x) ? '?' : letter(x, m[side])));
    }
    // dagar sedan lagets förra match före avspark, i alla tävlingar
    function vilaOf(m, side) {
      const d = A.match.get(m.id);
      const S = d && d.teams && d.teams[side] && d.teams[side].schedule;
      if (S) return S.last ? S.last.days : null;
      const t = Date.parse(m.kickoff);
      const prev = (A.byTeam.get(m[side]) || []).find((x) => x.id !== m.id && Date.parse(x.kickoff) < t);
      return prev ? dayNo(t) - dayNo(Date.parse(prev.kickoff)) : null;
    }
    // skadelistan: null när den är okänd (eller inte har hämtats), annars de
    // som spelar mest först
    function skadorOf(m, side) {
      const d = A.match.get(m.id);
      const s = d && d.squad && d.squad[side];
      if (!s || s.unknown) return null;
      return s.players.slice().sort((a, b) => (b.minutes || 0) - (a.minutes || 0));
    }
    const skadeNamn = (l) => (l.length ? l.map((p) => `${sistaNamn(p.name)}${SKADA[p.status] || ''}`).join(', ') : 'INGA');

    // ---------- kupongen och matchakten ----------

    // 'LÖRDAG 7 NOVEMBER' eller '7–9 NOVEMBER'
    function omgDatum() {
      const ds = [...new Set(A.ms.map((m) => fDay.format(new Date(m.kickoff))))].sort();
      if (!ds.length) return '';
      const [, m1, d1] = ds[0].split('-').map(Number);
      const [, m2, d2] = ds[ds.length - 1].split('-').map(Number);
      if (ds.length === 1) return up(`${delar(A.ms[0].kickoff).weekday} ${d1} ${MANAD[m1 - 1]}`);
      return up(m1 === m2 ? `${d1}–${d2} ${MANAD[m1 - 1]}` : `${d1} ${MAN[m1 - 1]} – ${d2} ${MAN[m2 - 1]}`);
    }
    // avsparken: '16.00', eller 'LÖR 16.00' när omgången går flera dagar
    function tid(m) {
      const p = delar(m.kickoff);
      const flera = new Set(A.ms.map((x) => fDay.format(new Date(x.kickoff)))).size > 1;
      return up(`${flera ? `${p.weekday.slice(0, 3)} ` : ''}${p.hour}.${p.minute}`);
    }
    const nrAv = (m) => A.ms.indexOf(m) + 1;

    // Kupongen: matcherna med lagens form bredvid namnen (och på datorn
    // divisionen och avsparken till höger)
    function kupongen(R) {
      if (!A.ms.length) return [rad('INGEN OMGÅNG')];
      const w = 11;
      const bred = A.bred >= 60;
      const r = [rad([omgDatum(), 'd']), rad([`${pad('', 3 + w + 4)}FORMEN`, 'd'])];
      A.ms.forEach((m, i) => {
        R.nr[i + 1] = `#mote:${m.id}`;
        const f = ['home', 'away'].map((s) => formOf(m, s).join('') || '–');
        const borta = kort(m.away).slice(0, w);
        r.push(radQ(`#mote:${m.id}`, [`${padL(i + 1, 2)} `, 'd'], `${padL(kort(m.home).slice(0, w), w)} `, [pad(f[0], 5), 'v'], [' – ', 'd'], [pad(f[1], 5), 'v'], ` ${borta}`,
          ...(bred ? [[pad('', w - borta.length + 4)], [pad(DIVK[m.comp] || up(m.comp || ''), 11), 'd'], [tid(m), 'd']] : [])));
      });
      return r;
    }

    function moten(m) {
      const r = [rad(['DE SENASTE MÖTENA', 'd'])];
      const d = A.match.get(m.id);
      if (d === undefined) return [...r, prickar('HÄMTAR', '')];
      const list = !d ? [] : [
        ...(d.meetings || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.kickoff), x, when: x.kickoff, comp: x.compShort, hide: window.Spoiler && Spoiler.hidesDay(x.kickoff) })),
        ...((d.pastMeetings && d.pastMeetings.list) || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.date), x, when: x.date, comp: x.compShort, hide: false })),
      ].sort((a, b) => b.t - a.t).slice(0, MOTEN);
      if (!list.length) return [...r, rad('HAR INTE MÖTTS')];
      const n = { V: 0, O: 0, F: 0 };
      for (const { x, when, comp, hide } of list) {
        if (!hide) n[letter(x, m.home)]++;
        r.push(rad([`${pad(up(dag(when)), 12)}${pad(up(comp || ''), 4)}`, 'd'], `${kort(x.home)} – ${kort(x.away)}  `, [hide ? '?' : `${x.score.home}–${x.score.away}`, 'v']));
      }
      r.push(rad([`${kort(m.home)}: `, 'd'], `${n.V} V · ${n.O} O · ${n.F} F`));
      return r;
    }

    // dagar till lagets nästa match efter den här, med cupen när det inte är ligan
    function nastaOf(m, side) {
      const d = A.match.get(m.id);
      const nx = d && d.teams && d.teams[side] && d.teams[side].schedule && d.teams[side].schedule.next;
      if (!nx || nx.days == null) return '–';
      const t = lagOf(m[side]);
      return `${nx.days} D${nx.comp && (!t || nx.comp !== up(t.comp)) ? ` ${up(TAV[nx.comp] || nx.comp)}` : ''}`;
    }
    // lagets bäste skytt (spelarfilen) och hans rad i registret
    function skytten(t) {
      const pt = t && A.P && A.P.lag.get(String(t.espnId));
      const ts = pt && pt.topScorer && pt.topScorer.g ? pt.topScorer : null;
      if (!ts) return null;
      return { ts, vem: A.P.spelare.find((x) => x.p.name === ts.name && String(x.p.teamId) === String(t.espnId)) };
    }

    // Matchakten: allt om matchen på ett ställe – lagen sida vid sida med
    // läget (formen, vilan, nästa match), tavlans tal och lagkortens siffror,
    // sedan skadorna och mötena. Etiketterna leder till topplistorna, lagen
    // till lagkorten och skytten till spelarkortet.
    function akten(m, S, R) {
      const i = A.ms.indexOf(m);
      R.sido = i < 0 ? null : [i > 0 ? `#mote:${A.ms[i - 1].id}` : null, i < A.ms.length - 1 ? `#mote:${A.ms[i + 1].id}` : null];
      R.slojas = true;
      const L = 12;
      const K = Math.min(20, Math.floor((A.bred - L) / 2));
      const lag = [m.home, m.away];
      const sid = ['home', 'away'];
      const T = lag.map(lagOf);
      const r = [rad([`${padL(i + 1, 2)}  `, 'd'], [`${kort(m.home)} – ${kort(m.away)}`, 'v']), rad([`    ${tavNamn(m.comp)} · ${avspark(m.kickoff)}`, 'd']), tom()];
      r.push(rad([pad('', L)], ...lag.flatMap((n, j) => [[kort(n).slice(0, K - 1), 'v', `#lag:${n}`], [j ? '' : pad('', K - Math.min(kort(n).length, K - 1)), '']])));
      if (T[0] && T[1] && T[0].comp !== T[1].comp) r.push(rad([pad('', L)], [pad(DIVK[T[0].comp], K), 'd'], [DIVK[T[1].comp], 'd']));
      // en rad: etiketten (som leder till topplistan när det finns en) och lagens värden
      const raden = (etikett, v, amne) => rad([etikett, 'd', amne ? `#amne:${amne}` : null], [pad('', L - etikett.length)],
        ...v.flatMap((x, j) => { const b = Array.isArray(x) ? x : [x, '']; return j ? [b] : [b, [pad('', Math.max(1, K - b[0].length))]]; }));
      const tal = (etikett, amne, fmt) => raden(etikett, T.map((t) => {
        if (S.veil) return '?';
        const v = TAL[amne](t);
        return v == null || !Number.isFinite(v) ? '–' : fmt(v);
      }), amne);
      const per = (f) => T.map((t) => (S.veil ? '?' : f(t) || '–'));
      r.push(raden('FORMEN', sid.map((s) => formOf(m, s).join('') || '–')));
      r.push(raden('VILAN', sid.map((s) => { const d = vilaOf(m, s); return d == null ? '–' : `${d} D`; })));
      r.push(raden('NÄSTA', sid.map((s) => nastaOf(m, s))));
      r.push(tom());
      r.push(tal('STYRKA', 'styrka', (v) => signed(v, 2)));
      r.push(tal('KRYSSAR', 'kryss', pct));
      r.push(tal('TUR', 'tur', (v) => signed(v)));
      r.push(tal('MOT ODDSEN', 'odds', (v) => signed(v)));
      r.push(tal('MOTSTÅNDET', 'motstand', (v) => signed(v, 2)));
      r.push(tom());
      r.push(raden('MÅL', per((t) => (t && t.m ? `${num(t.gf / t.m)}–${num(t.ga / t.m)}` : null))));
      r.push(raden('xG', per((t) => { const x = fdOf(t, 'xg'); return x && x.n ? `${num(x.f / x.n)}–${num(x.a / x.n)}` : null; })));
      r.push(raden('FAVORIT', per((t) => { const x = fdOf(t, 'mkt'); return x && x.n ? `${x.fav} AV ${x.n}` : null; })));
      r.push(raden('SKYTTEN', T.map((t) => {
        if (S.veil) return '?';
        const s = skytten(t);
        if (!s) return A.P ? '–' : '…';
        return [`${sistaNamn(s.ts.name).slice(0, K - 3 - String(s.ts.g).length)} ${s.ts.g}`, '', s.vem ? `#spelare:${s.vem.p.id}` : null];
      })));
      const sk = sid.map((s) => skadorOf(m, s));
      if (sk.some(Boolean)) {
        r.push(tom(), rad(['SKADORNA', 'd']));
        sk.forEach((l, j) => r.push(rad([`${kort(lag[j])}: `, 'd'], l ? skadeNamn(l) : 'OKÄNT')));
      }
      r.push(tom(), ...moten(m));
      return r;
    }

    // ---------- topplistorna: tavlans lappar ----------

    // laget i en lista: hela raden leder till matchakten
    const lagRad = (n, ...b) => { const x = iOmgangen(n); return x ? radQ(`#mote:${x.m.id}`, ...b) : rad(...b); };
    function listor(amne, S, R) {
      const i = AMNEN.findIndex((x) => x[0] === amne);
      R.sido = [i > 0 ? `#amne:${AMNEN[i - 1][0]}` : null, i < AMNEN.length - 1 ? `#amne:${AMNEN[i + 1][0]}` : null];
      const r = [rad(...AMNEN.flatMap(([id, namn], j) => [[namn, id === amne ? 'i' : '', id === amne ? null : `#amne:${id}`], [j < AMNEN.length - 1 ? '   ' : '', '']])), streck()];
      const h0 = r.length;
      if (!A.ms.length) return [...r, rad('INGEN OMGÅNG')];
      const N = Math.min(14, A.bred - 26);
      const divs = new Set(omgLag().map((n) => (lagOf(n) || {}).comp).filter(Boolean));
      const div = (n) => (divs.size > 1 ? [`  ${DIVK[(lagOf(n) || {}).comp] || ''}`, 'd'] : ['', '']);
      // lagen i omgången efter ett tal, de högsta först
      const lista = (f) => [...new Set(omgLag())].map((n) => ({ n, v: f(lagOf(n)) })).filter((x) => x.v != null && Number.isFinite(x.v)).sort((a, b) => b.v - a.v);
      const okant = () => [...r, rad('OKÄNT')];
      R.slojas = true;
      if (S.veil) return [...r, rad('?')];
      if (amne === 'styrka') {
        // styrkan jämförs bara inom divisionen
        for (const d of DIVS) {
          const l = lista(TAL.styrka).filter((x) => lagOf(x.n).comp === d);
          if (!l.length) continue;
          if (r.length > h0) r.push(tom());
          r.push(rad([up(DIVNAME[d]), 'd']));
          for (const x of l) r.push(lagRad(x.n, pad(kort(x.n), N), [padL(signed(x.v, 2), 6), 'v']));
        }
        return r.length > h0 ? r : okant();
      }
      if (amne === 'kryss') {
        const l = lista(TAL.kryss);
        l.forEach((x) => r.push(lagRad(x.n, pad(kort(x.n), N), [padL(pct(x.v), 5), 'v'], div(x.n))));
        return l.length ? r : okant();
      }
      // två listor ur samma tal: plus och minus, de största först
      const RUB = { tur: ['TUR', 'OTUR'], odds: ['SLÅR ODDSEN', 'SVIKER'], motstand: ['TUFFT HITTILLS', 'LÄTT HITTILLS'] }[amne];
      const d = amne === 'motstand' ? 2 : 1;
      const l = lista(TAL[amne]);
      if (!l.length) return okant();
      const max = Math.max(...l.map((x) => Math.abs(x.v)));
      // stapeln: mellanslag med bakgrund, så att den är lika bred som tecknen
      const stapel = (x) => { const n = Math.max(1, Math.round((9 * Math.abs(x.v)) / max)); return amne === 'tur' ? [[' '.repeat(n), x.v < 0 ? 'st d' : 'st'], [' '.repeat(10 - n), '']] : [['', '']]; };
      [l.filter((x) => x.v > 0), l.filter((x) => x.v < 0).reverse()].forEach((del, k) => {
        if (k) r.push(tom());
        r.push(rad([RUB[k], 'd']));
        if (!del.length) r.push(rad(['INGEN', 'd']));
        for (const x of del) r.push(lagRad(x.n, pad(kort(x.n), N), ...stapel(x), [padL(signed(x.v, d), 6), 'v'], div(x.n)));
      });
      return r;
    }

    // ---------- lagen: divisionerna, lagkorten och truppen ----------

    const lagIDiv = (d) => [...(A.stats || new Map()).values()].filter((t) => t.comp === d).sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    // divisionen med flest lag i omgången
    function standardDiv() {
      const n = {};
      for (const x of omgLag()) { const t = lagOf(x); if (t) n[t.comp] = (n[t.comp] || 0) + 1; }
      return DIVS.slice().sort((a, b) => (n[b] || 0) - (n[a] || 0))[0];
    }
    const divFlikar = (d, kort2) => rad(...DIVS.flatMap((x, k) => [[kort2 ? DIVK[x] : up(DIVNAME[x]), x === d ? 'i' : '', x === d ? null : `#div:${x}`], [k < DIVS.length - 1 ? '   ' : '', '']]));
    // en division: lagen i bokstavsordning (två spalter på datorn), lagen i
    // omgången ljusa med matchens nummer
    function lagen(div, R) {
      const d = DIVS.includes(div) ? div : standardDiv();
      const j = DIVS.indexOf(d);
      R.sido = [j > 0 ? `#div:${DIVS[j - 1]}` : null, j < DIVS.length - 1 ? `#div:${DIVS[j + 1]}` : null];
      const smal = A.bred < 60;
      const r = [divFlikar(d, smal), streck()];
      if (smal) r.push(rad([up(DIVNAME[d]), 'd']));
      if (!A.stats) return [...r, prickar('HÄMTAR', '')];
      const l = lagIDiv(d);
      const k = smal ? 1 : 2;
      const w = Math.floor(A.bred / k);
      const h = Math.ceil(l.length / k);
      for (let y = 0; y < h; y++) {
        const b = [];
        for (let x = 0; x < k; x++) {
          const t = l[x * h + y];
          if (!t) continue;
          const nr = iOmgangen(t.name) ? nrAv(iOmgangen(t.name).m) : 0;
          const namn = up(t.name).slice(0, w - 6);
          b.push([nr ? padL(nr, 2) : '  ', 'd'], ['  ', ''], [namn, nr ? 'v' : '', `#lag:${t.name}`], [pad('', w - 4 - namn.length), '']);
        }
        r.push(rad(...b));
      }
      return r;
    }

    // truppen: de som har spelat och de som är skadade, mest speltid först
    // (med dolda resultat: målvakterna, backarna, mittfältarna och anfallarna,
    // i bokstavsordning, så att ordningen inte avslöjar speltiden)
    const POSORD = { MV: 0, B: 1, MF: 2, A: 3 };
    const STATUS = { 'EJ UTTAGBAR': 'EJ UTT.', AVSTÄNGD: 'AVST.' };
    // namnet på n tecken: BOWEN, JARROD, annars MAVROPANOS, K. eller bara efternamnet
    function namnPa(namn, n) {
      const e = efternamn(namn);
      if (e.length <= n) return e;
      const [sist, forst] = e.split(', ');
      return forst && sist.length + 4 <= n ? `${sist}, ${forst[0]}.` : sist.slice(0, n);
    }
    function trupp(t, veil) {
      if (!A.P || !t) return null;
      return A.P.spelare.filter((x) => String(x.p.teamId) === String(t.espnId))
        .map((x) => ({ x, l: laget(x) }))
        .filter(({ x, l }) => (x.p.min || 0) > 0 || (l && l[0] !== 'SPELKLAR'))
        .sort((a, b) => (veil ? (POSORD[a.x.p.pos] ?? 4) - (POSORD[b.x.p.pos] ?? 4) : (b.x.p.min || 0) - (a.x.p.min || 0)) || efternamn(a.x.p.name).localeCompare(efternamn(b.x.p.name), 'sv'));
    }

    function lagkort(t, S, R) {
      const l = lagIDiv(t.comp);
      const i = l.findIndex((x) => x.name === t.name);
      if (i >= 0) R.sido = [i > 0 ? `#lag:${l[i - 1].name}` : null, i < l.length - 1 ? `#lag:${l[i + 1].name}` : null];
      R.slojas = true;
      const r = [rad([up(t.name), 'v']), rad([up(DIVNAME[t.comp] || ''), 'd', `#div:${t.comp}`]), tom()];
      const om = iOmgangen(t.name);
      const falt = (etikett, ...v) => rad([pad(etikett, 10), 'd'], ...v.map((x) => (Array.isArray(x) ? x : [x, ''])));
      if (om) r.push(falt('OMGÅNGEN', [`${nrAv(om.m)}  ${kort(om.m.home)} – ${kort(om.m.away)}`, '', `#mote:${om.m.id}`]));
      const fd = t.fd;
      const xg = fd && fd.xg && fd.xg.n ? fd.xg : null;
      const mkt = fd && fd.mkt && fd.mkt.n ? fd.mkt : null;
      if (S.veil) r.push(falt('MÅL', '?'), falt('xG', '?'), falt('FAVORIT', '?'));
      else {
        if (t.m) r.push(falt('MÅL', `${num(t.gf / t.m, 2)} FÖR · ${num(t.ga / t.m, 2)} MOT`));
        if (xg) r.push(falt('xG', `${num(xg.f / xg.n, 2)} FÖR · ${num(xg.a / xg.n, 2)} MOT`));
        if (mkt) r.push(falt('FAVORIT', `${mkt.fav} AV ${mkt.n} MATCHER`));
      }
      const d = om && A.match.get(om.m.id);
      const nx = d && d.teams && d.teams[om.side] && d.teams[om.side].schedule && d.teams[om.side].schedule.next;
      if (nx && nx.days != null) {
        r.push(falt('NÄSTA', [kort(nx.opponent), '', `#lag:${nx.opponent}`], ` ${nx.home ? 'HEMMA' : 'BORTA'} OM ${nx.days} D${nx.comp && nx.comp !== up(t.comp) ? ` (${up(TAV[nx.comp] || nx.comp)})` : ''}`));
      }
      const tr = trupp(t, S.veil);
      r.push(tom());
      if (!tr) return [...r, prickar('HÄMTAR TRUPPEN', '')];
      const W = Math.min(26, A.bred - 24);
      r.push(rad([`${pad('TRUPPEN', 4 + W)}${padL('MIN', 5)}${padL('MÅL', 5)}`, 'd']));
      for (const { x, l: lg } of tr) {
        const st = lg && lg[0] !== 'SPELKLAR' ? STATUS[lg[0]] || lg[0] : '';
        r.push(radQ(`#spelare:${x.p.id}`, [pad(x.p.pos || '', 4), 'd'], [pad(namnPa(x.p.name, W - 1), W), st ? 'd' : ''],
          padL(S.veil ? '?' : x.p.min || 0, 5), padL(S.veil ? '?' : x.p.g || 0, 5), [st ? `  ${st}` : '', 'v']));
      }
      return r;
    }

    // ---------- spelarna ----------

    // läget ur skadelistan: null när laget inte har någon lista
    function laget(x) {
      const list = A.P.avail.get(String(x.p.teamId));
      if (!list) return null;
      const t = x.t;
      const hit = list.find((a) => { const n = norm(a.name); return n && (n === x.n || t.includes(n) || n.split(' ').every((w) => t.includes(w))); });
      if (!hit) return ['SPELKLAR'];
      return [up(hit.status), ...String(hit.news || '').split(' · ').filter(Boolean).map(up)];
    }

    function spelarkort(x, S, R) {
      R.slojas = true;
      const p = x.p;
      const t = A.byEspn.get(String(p.teamId));
      // förra och nästa i truppen
      const tr = trupp(t, S.veil);
      const k = tr ? tr.findIndex((y) => y.x === x) : -1;
      if (k >= 0) R.sido = [k > 0 ? `#spelare:${tr[k - 1].x.p.id}` : null, k < tr.length - 1 ? `#spelare:${tr[k + 1].x.p.id}` : null];
      const falt = (etikett, ...v) => rad([pad(etikett, 10), 'd'], ...v.map((y) => (Array.isArray(y) ? y : [y, ''])));
      const r = [rad([efternamn(p.name), 'v']), rad([up(p.team), '', t ? `#lag:${t.name}` : null], [`${p.jersey ? ` · NR ${p.jersey}` : ''}${POS[p.pos] ? ` · ${up(POS[p.pos])}` : ''}`]), tom()];
      const l = laget(x);
      if (l) {
        r.push(falt('LÄGET', [l[0], l[0] === 'SPELKLAR' ? '' : 'v']));
        for (const n of l.slice(1)) r.push(rad([pad('', 10)], [n]));
      }
      if (S.veil) return [...r, falt('SPELTID', '?'), falt('MÅL', '?')];
      const pt = A.P.lag.get(String(p.teamId));
      const av = pt && pt.coverage ? pt.coverage.covered : t ? t.m : null;
      if (p.min != null) r.push(falt('SPELTID', `${p.min} MIN · ${p.starts || 0}${av ? ` AV ${av}` : ''} FRÅN START`));
      if (p.g != null) r.push(rad([pad('MÅL', 10), 'd'], [`${p.g}`], ...(p.xg != null ? [[' · ', ''], ['xG', ''], [` ${num(p.xg, 1)}`, '']] : [])));
      const mu = p.mu;
      if (mu && mu.m && mu.u) {
        const raden = (namn, a) => {
          const [n, v, o2, f] = a;
          return `${pad(namn, 12)}${padL(n, 3)}  ${pad(`${v}-${o2}-${f}`, 8)}  ${pad(num((3 * v + o2) / n, 2), 7)}  ${num(a[6] / n, 2)}`;
        };
        r.push(tom(), rad([`${pad('I STARTELVAN', 12)}${padL('M', 3)}  ${pad('V-O-F', 8)}  ${pad('P/MATCH', 7)}  ODDSEN`, 'd']), rad(raden('MED', mu.m)), rad(raden('UTAN', mu.u)));
        if (mu.fran) {
          const [y, m] = mu.fran.split('-').map(Number);
          r.push(rad([`I ${up(p.team)} SEDAN ${up(MAN[m - 1])} ${y}`, 'd']));
        }
      }
      return r;
    }

    // ---------- sökningen ----------
    //
    // Sökningen svarar medan man skriver: träffarna står i utskriften med den
    // bästa markerad, och Enter öppnar den (↑/↓ väljer en annan). Den hittar
    // lag och spelare i alla fyra divisionerna, omgångens möten (två lag),
    // topplistorna, flikarna och divisionerna. Felstavat går också: hittas
    // inget står MENADE DU över det som ligger närmast.

    // Varje ord i frågan ska vara ett ord i namnet (nivå 0) eller börja ett
    // (nivå 1); annars namnet hopskrivet (mac allister = macallister, nivå 2).
    // Bara den bästa nivån visas, så att isak ger Isak och inte Isaksen.
    function poang(q, t, hel) {
      let s = 0;
      for (const w of q) {
        if (t.includes(w)) continue;
        if (t.some((x) => x.startsWith(w))) { s = 1; continue; }
        const ihop = q.join('');
        return ihop.length > 3 && (hel.replace(/ /g, '').startsWith(ihop) || t.some((x) => x.startsWith(ihop))) ? 2 : null;
      }
      return s;
    }
    // Avståndet mellan två ord (byten, tillägg, struckna och omkastade
    // bokstäver), eller null när det är större än k
    function avstand(a, b, k) {
      if (Math.abs(a.length - b.length) > k) return null;
      let f2 = null;
      let f = Array.from({ length: b.length + 1 }, (_, j) => j);
      for (let i = 1; i <= a.length; i++) {
        const n = [i];
        let min = i;
        for (let j = 1; j <= b.length; j++) {
          const c = a[i - 1] === b[j - 1] ? 0 : 1;
          n[j] = Math.min(f[j] + 1, n[j - 1] + 1, f[j - 1] + c);
          if (f2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) n[j] = Math.min(n[j], f2[j - 2] + 1);
          if (n[j] < min) min = n[j];
        }
        if (min > k) return null;
        f2 = f;
        f = n;
      }
      return f[b.length] <= k ? f[b.length] : null;
    }
    // Felstavat (nivå 3): varje ord i frågan börjar ett ord i namnet eller
    // ligger nära ett (eller dess början); summan av avstånden, annars null.
    // Ett helt ord och samma första bokstav går före (haland = Haaland, inte Malanda).
    function luddig(q, t) {
      let sum = 0;
      for (const w of q) {
        if (t.some((x) => x.startsWith(w))) continue;
        if (w.length < 4) return null;
        const k = w.length >= 7 ? 2 : 1;
        let bast = null;
        for (const x of t) {
          for (const y of [x, x.slice(0, w.length - 1), x.slice(0, w.length), x.slice(0, w.length + 1)]) {
            if (y.length < 3) continue;
            let d = avstand(w, y, k);
            if (d == null) continue;
            d += (y === x ? 0 : 0.3) + (y[0] === w[0] ? 0 : 0.6);
            if (bast == null || d < bast) bast = d;
          }
        }
        if (bast == null) return null;
        sum += bast;
      }
      return sum;
    }
    // smeknamn som inte börjar något ord i lagets namn
    const ALIAS = {
      'Manchester United': 'utd', 'Sheffield United': 'utd', 'Tottenham Hotspur': 'spurs', 'Wolverhampton Wanderers': 'wolves',
      Middlesbrough: 'boro', 'Queens Park Rangers': 'qpr', 'Milton Keynes Dons': 'mk', 'Brighton & Hove Albion': 'bha',
      'West Bromwich Albion': 'wba', 'Preston North End': 'pne',
    };
    // delarna av registret
    const DELAR = [
      { namn: 'KUPONGEN', typ: 'FLIK', q: '#flik:kupongen', ord: ['kupongen', 'kupong', 'matcherna', 'omgangen', 'formen'] },
      { namn: 'TOPPLISTOR', typ: 'FLIK', q: '#flik:listor', ord: ['topplistor', 'topplistorna', 'listor', 'listorna'] },
      { namn: 'LAGEN', typ: 'FLIK', q: '#flik:lagen', ord: ['lagen', 'ligorna', 'divisionerna'] },
      { namn: 'STYRKA', typ: 'TOPPLISTA', q: '#amne:styrka', ord: ['styrka', 'styrkan', 'starkast', 'svagast'] },
      { namn: 'KRYSS', typ: 'TOPPLISTA', q: '#amne:kryss', ord: ['kryss', 'kryssar', 'oavgjort'] },
      { namn: 'TUR', typ: 'TOPPLISTA', q: '#amne:tur', ord: ['tur', 'turen', 'otur'] },
      { namn: 'ODDSEN', typ: 'TOPPLISTA', q: '#amne:odds', ord: ['oddsen', 'odds', 'mot oddsen'] },
      { namn: 'MOTSTÅND', typ: 'TOPPLISTA', q: '#amne:motstand', ord: ['motstand', 'motstandet'] },
      ...DIVS.map((d) => ({ namn: up(DIVNAME[d]), typ: 'DIVISION', q: `#div:${d}`, ord: [norm(DIVNAME[d]), d, { pl: 'premier', ch: 'champ', l1: 'league 1', l2: 'league 2' }[d]] })),
    ];
    function sok(text) {
      const qn = norm(text);
      const q = qn.split(' ').filter(Boolean);
      if (!q.length) return [];
      const hits = [];
      const lag = [...(A.stats || new Map()).values()];
      const namnen = (t) => { const a = norm(t.name); const b = norm(o.kort(t.name)); return a === b ? [a] : [a, b]; };
      const lagTok = (t) => [...namnen(t).join(' ').split(' '), ...(ALIAS[t.name] ? [ALIAS[t.name]] : [])];
      for (const d of DELAR) {
        const s = d.ord.includes(qn) ? 0 : qn.length >= 3 && d.ord.some((x) => x.startsWith(qn)) ? 1 : null;
        if (s != null) hits.push({ typ: 'del', d, niva: s, s: -1 });
      }
      for (const t of lag) {
        let best = null;
        for (const n of namnen(t)) { const s = poang(q, n.split(' '), n); if (s != null && (best == null || s < best)) best = s; }
        if (best == null && ALIAS[t.name] && q.length === 1 && ALIAS[t.name].startsWith(q[0])) best = ALIAS[t.name] === q[0] ? 0 : 1;
        if (best != null) hits.push({ typ: 'lag', t, niva: best, s: -(namnen(t).includes(qn) ? 3 : 0) - 0.5 - (iOmgangen(t.name) ? 0.2 : 0) });
      }
      // ett möte i omgången: båda lagen ur frågan
      for (const m of A.ms) {
        const h = [m.home, o.kort(m.home)].map(norm).join(' ').split(' ');
        const b = [m.away, o.kort(m.away)].map(norm).join(' ').split(' ');
        const iH = (w) => h.some((x) => x.startsWith(w));
        const iB = (w) => b.some((x) => x.startsWith(w));
        if (q.length > 1 && q.every((w) => iH(w) || iB(w)) && q.some((w) => iH(w) && !iB(w)) && q.some((w) => iB(w) && !iH(w))) hits.push({ typ: 'mote', m, niva: 0, s: -5 });
      }
      if (A.P) for (const x of A.P.spelare) {
        let s = poang(q, x.t, x.n);
        // med laget i frågan (saka arsenal, bowen west ham)
        if (s == null && q.length > 1) {
          if (!x.lt) x.lt = [norm(x.p.team), norm(o.kort(x.p.team))].join(' ').split(' ');
          const rest = q.filter((w) => !x.lt.some((y) => y.startsWith(w)));
          if (rest.length && rest.length < q.length) s = poang(rest, x.t, x.n);
        }
        if (s == null) continue;
        // efternamnet först (isak = Isak, inte Isak Alemayehu), och den som spelar mest
        const sist = x.t[x.t.length - 1];
        hits.push({ typ: 'spelare', x, niva: s === 0 && q.length === 1 && q[0] !== sist ? 0.5 : s, s: -(x.n === qn ? 3 : 0) - (q.includes(sist) ? 0.6 : 0) - Math.min(0.4, (x.p.min || 0) / 3000) - (iOmgangen(x.p.team) ? 0.1 : 0) });
      }
      // inget alls: det som ligger närmast (felstavat)
      if (!hits.length) {
        for (const t of lag) {
          const d = luddig(q, lagTok(t));
          if (d != null) hits.push({ typ: 'lag', t, niva: 3, s: d - 0.5 });
        }
        if (A.P) for (const x of A.P.spelare) {
          const d = luddig(q, x.t);
          if (d != null) hits.push({ typ: 'spelare', x, niva: 3, s: d - Math.min(0.4, (x.p.min || 0) / 3000) });
        }
      }
      const bast = Math.min(...hits.map((h) => h.niva));
      const ut = hits.filter((h) => h.niva === bast).sort((a, b) => a.s - b.s);
      ut.luddig = bast === 3;
      return ut;
    }
    // träffen som en vy (i sin flik)
    const vyFor = (h) => (h.typ === 'lag' ? { flik: 'lagen', lag: h.t.name } : h.typ === 'mote' ? { flik: 'kupongen', mote: h.m.id } : h.typ === 'del' ? vyAv(h.d.q) : { flik: 'lagen', spelare: String(h.x.p.id) });
    function listrad(h, i) {
      const nr = [`${padL(i + 1, 2)}  `, 'd'];
      const q = `#${i + 1}`;
      const W = Math.min(28, A.bred - 12);
      if (h.typ === 'lag') return radQ(q, nr, pad(up(h.t.name).slice(0, W - 1), W), [`LAG ${DIVK[h.t.comp] || ''}`, 'd']);
      if (h.typ === 'mote') return radQ(q, nr, pad(`${kort(h.m.home)} – ${kort(h.m.away)}`, W), ['MÖTE', 'd']);
      if (h.typ === 'del') return radQ(q, nr, pad(h.d.namn, W), [h.d.typ, 'd']);
      return radQ(q, nr, pad(efternamn(h.x.p.name).slice(0, W - 1), W), [kort(h.x.p.team), 'd']);
    }
    function traffLista(vy, R) {
      const h = vy.hits || [];
      const r = [h.luddig ? rad([`INGET PÅ ${up(vy.eko)}. MENADE DU:`.slice(0, A.bred), 'd']) : prickar('SÖKER I REGISTRET', traffar(h.length), A.bred)];
      if (!h.length) return r;
      r.push(tom());
      h.slice(0, LISTA).forEach((x, i) => { R.nr[i + 1] = `#${i + 1}`; r.push(listrad(x, i)); });
      if (h.length > LISTA) r.push(rad([`    OCH ${h.length - LISTA} TILL`, 'd']));
      return r;
    }

    // ---------- vyerna ----------
    //
    // En vy är { flik, mote, amne, div, lag, spelare } eller en sökning
    // { flik: 'sok', eko, hits }. bygg ger menyraden (topp), raderna (ut),
    // raderna med nummer (nr), förra och nästa (sido) och om vyn räknar med
    // dolda resultat.

    function vyRader(vy, S, R) {
      if (vy.flik === 'kupongen') {
        const m = vy.mote && A.ms.find((x) => x.id === vy.mote);
        return m ? akten(m, S, R) : kupongen(R);
      }
      if (vy.flik === 'listor') return listor(vy.amne || AMNEN[0][0], S, R);
      if (vy.spelare) {
        const x = A.P && A.P.spelare.find((y) => String(y.p.id) === vy.spelare);
        return x ? spelarkort(x, S, R) : [prickar('HÄMTAR', '')];
      }
      const t = vy.lag && lagOf(vy.lag);
      return t ? lagkort(t, S, R) : lagen(vy.div, R);
    }

    function bygg(vy) {
      const S = slojan();
      const R = { nr: {}, sido: null, slojas: false };
      const aktiv = vy.flik === 'sok' ? (A.fore || {}).flik : vy.flik;
      const meny = rad(...FLIKAR.flatMap(([id, namn], j) => [[namn, aktiv === id ? 'i' : '', `#flik:${id}`], [j < FLIKAR.length - 1 ? '   ' : '', '']]));
      R.topp = [meny, streck()];
      R.ut = vy.flik === 'sok' ? traffLista(vy, R) : vyRader(vy, S, R);
      R.veil = S;
      return R;
    }

    // Tangenterna längst ner: tryckbara, med tangentens namn när det finns ett tangentbord
    function fotHtml(R) {
      const k = mus.matches;
      const b = [];
      const rot = !A.bak.length && A.vy.flik !== 'sok';
      b.push([k ? `ESC ${rot ? 'STÄNG' : 'TILLBAKA'}` : `◄ ${rot ? 'STÄNG' : 'TILLBAKA'}`, rot ? '#stang' : '#bak']);
      if (R.sido) {
        b.push([k ? '← FÖRRA' : '◄ FÖRRA', R.sido[0] ? '#sido:-1' : null, !R.sido[0]]);
        b.push([k ? 'NÄSTA →' : 'NÄSTA ►', R.sido[1] ? '#sido:1' : null, !R.sido[1]]);
      } else if (k && rot) b.push(['←→ FLIKARNA', null]);
      if (k && Object.keys(R.nr).length) b.push(['↑↓ VÄLJ   ↵ ÖPPNA', null]);
      return b.map(([t, q, av]) => `<span${q ? ` class="a" data-q="${esc(q)}"` : av ? ' class="av"' : ''}>${esc(t)}</span>`).join('');
    }

    // ---------- utskriften ----------

    // Skriver vyn: rad för rad som en terminal (utan när rummet ska vara
    // stilla), annars på en gång (när datan kommer in).
    function visa(vy, skriv) {
      A.vy = vy;
      A.sel = -1;
      A.nr++;
      const sk = ++A.sk;
      const R = bygg(vy);
      A.R = R;
      const h = html(R.ut);
      A.ut = h;
      topp.innerHTML = html(R.topp);
      fot.innerHTML = fotHtml(R);
      spoilerRad();
      if (!skriv || o.calm()) { ut.innerHTML = h; rull.scrollTop = 0; return; }
      ut.innerHTML = '';
      rull.scrollTop = 0;
      const delar = h.match(/<div class="tr[^"]*"[^>]*>.*?<\/div>(?=<div class="tr|$)/g) || [];
      let i = 0;
      const steg = () => {
        if (sk !== A.sk) return;
        ut.insertAdjacentHTML('beforeend', delar[i++] || '');
        if (i < delar.length) setTimeout(steg, 9);
      };
      steg();
    }
    function spoilerRad() {
      const R = A.R;
      const S = R && R.veil;
      sp.innerHTML = A.on && S && S.veil && R.slojas && window.Spoiler
        ? Spoiler.card({ title: `${S.n} ${S.n === 1 ? 'match' : 'matcher'} är dolda`, text: 'Datorn räknar med resultaten.', keys: [S.key] })
        : '';
      lagg();
    }

    // Till en vy: den förra sparas, så att Esc går tillbaka dit
    function ga(vy) {
      A.bak = [...A.bak, A.vy].slice(-30);
      visa(vy, true);
    }
    function tillbaka() {
      if (!A.bak.length) { o.close(); return; }
      visa(A.bak.pop(), true);
    }
    // förra eller nästa (match, lista, division, lag eller spelare); i flikarnas början flikarna
    function sido(d) {
      const R = A.R;
      if (R && R.sido) {
        const q = R.sido[d > 0 ? 1 : 0];
        if (q) visa(vyAv(q), true);
        return;
      }
      if (A.bak.length) return;
      const i = FLIKAR.findIndex(([id]) => id === A.vy.flik);
      const j = i < 0 ? 0 : i + d;
      if (j >= 0 && j < FLIKAR.length) visa({ flik: FLIKAR[j][0] }, true);
    }
    // vyn som en tryckbar bit leder till (#mote:…, #lag:…, #spelare:…, #amne:…, #div:…, #flik:… eller #nr)
    const GAMLA = { omgangen: 'listor', spelarna: 'lagen' };
    function vyAv(q) {
      const [typ, ...rest] = q.slice(1).split(':');
      const id = rest.join(':');
      if (/^\d+$/.test(typ)) { const h = A.lista[Number(typ) - 1]; return h ? vyFor(h) : null; }
      if (typ === 'mote') return { flik: 'kupongen', mote: id };
      if (typ === 'amne') return { flik: 'listor', amne: id };
      if (typ === 'div') return { flik: 'lagen', div: id };
      if (typ === 'lag') return lagOf(id) ? { flik: 'lagen', lag: id } : null;
      if (typ === 'spelare') return { flik: 'lagen', spelare: id };
      if (typ === 'flik') return { flik: GAMLA[id] || id };
      return null;
    }
    // ÅTKOMST BEVILJAD i sökraden en stund, när en träff öppnas
    function beviljad() {
      if (o.calm()) return;
      clearTimeout(A.bevT);
      ov.classList.add('beviljad');
      A.bevT = setTimeout(() => ov.classList.remove('beviljad'), 1500);
    }
    // En tryckbar bit: flikarna börjar om, listorna och divisionerna byts på
    // plats, resten går vidare. En träff i sökningen öppnas från vyn där man
    // började skriva, så att Esc går tillbaka dit.
    function tryck(q) {
      const iSok = A.vy.flik === 'sok';
      const fore = A.fore || { flik: 'kupongen' };
      if (iSok) { inp.value = ''; markor(); }
      if (q === '#bak') { if (iSok) { visa(fore, true); return null; } return tillbaka(); }
      if (q === '#stang') return o.close();
      if (q.startsWith('#sido:')) return sido(Number(q.slice(6)));
      if (q.startsWith('#flik:')) { A.bak = []; visa(vyAv(q), true); return null; }
      const vy = vyAv(q);
      if (iSok) A.vy = fore;
      if (vy && ((q.startsWith('#amne:') && A.vy.flik === 'listor') || (q.startsWith('#div:') && A.vy.flik === 'lagen' && !A.vy.lag && !A.vy.spelare))) { visa(vy, true); return null; }
      if (vy) {
        if (vy.mote) loadMatches();
        ga(vy);
        if (iSok) beviljad();
        return null;
      }
      // ett lag som inte finns i ligornas filer: sök på namnet
      return kor(q.split(':').slice(1).join(':'));
    }

    // Sökningen medan man skriver: träffarna i stället för vyn (som kommer
    // tillbaka när sökraden töms). En siffra väljer raden med det numret.
    function levande() {
      const v = inp.value.trim();
      ov.classList.remove('beviljad');
      if (!v || /^\d+$/.test(v)) {
        if (A.vy.flik === 'sok') visa(A.fore || { flik: 'kupongen' }, false);
        return;
      }
      if (A.vy.flik !== 'sok') A.fore = A.vy;
      if (!A.P) loadPlayers().then(() => { if (A.on && inp.value.trim() === v) levande(); });
      const hits = sok(v);
      A.lista = hits.slice(0, LISTA);
      visa({ flik: 'sok', eko: v, hits }, false);
      valj(0, false);
    }
    // Kör en fråga (?rum-register=isak): en träff går direkt till kortet,
    // annars står träffarna
    async function kor(text) {
      const eko = String(text || '').trim();
      if (!eko) return;
      if (/^\d+$/.test(eko)) {
        const q = A.R && A.R.nr[Number(eko)];
        if (q) tryck(q);
        return;
      }
      await loadPlayers();
      const hits = sok(eko.replace(/^(sök|sok)\s+/i, ''));
      if (A.vy.flik !== 'sok') A.fore = A.vy;
      A.lista = hits.slice(0, LISTA);
      if (hits.length === 1) { A.vy = { flik: 'sok' }; tryck('#1'); return; }
      visa({ flik: 'sok', eko, hits }, true);
      valj(0, false);
    }

    // datan har kommit (eller ändrats): terminalen och skärmen i rummet
    function draw() {
      const R = bygg(A.vy);
      const h = html(R.ut);
      if (A.on && h !== A.ut) {
        const y = rull.scrollTop;
        const sel = A.sel;
        A.sk++;
        A.ut = h;
        ut.innerHTML = h;
        topp.innerHTML = html(R.topp);
        fot.innerHTML = fotHtml(R);
        rull.scrollTop = y;
        A.R = R;
        valj(sel, false);
        spoilerRad();
      }
      if (!A.on) { A.R = R; A.ut = h; }
      // skärmen i rummet: menyraden och det som står i terminalen
      const s = JSON.stringify([R.topp, R.ut]);
      if (A.L && !A.on && s !== A.skarm) {
        A.skarm = s;
        A.L.skarm([...R.topp, ...R.ut]);
      }
    }

    // ---------- markören och tangenterna ----------

    function markor() {
      const n = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
      mark.style.left = `${SOK.length + n}ch`;
    }
    for (const ev of ['input', 'keyup', 'click', 'select', 'focus']) inp.addEventListener(ev, markor);
    inp.addEventListener('input', levande);

    // ↑/↓: raden som Enter öppnar (de tryckbara raderna och namnen i ordning)
    const valbara = () => [...ut.querySelectorAll('[data-q]')];
    function valj(i, rulla = true) {
      const l = valbara();
      for (const el of ut.querySelectorAll('.sel')) el.classList.remove('sel');
      A.sel = l.length ? Math.max(-1, Math.min(l.length - 1, i)) : -1;
      const el = l[A.sel];
      if (!el) return;
      el.classList.add('sel');
      if (rulla) {
        const r = el.getBoundingClientRect();
        const b = rull.getBoundingClientRect();
        if (r.top < b.top) rull.scrollTop -= b.top - r.top;
        else if (r.bottom > b.bottom) rull.scrollTop += r.bottom - b.bottom;
      }
    }

    // En tangent i terminalen: true när den har använts
    function tangent(e) {
      const k = e.key;
      const tomt = !inp.value;
      const iSok = A.vy.flik === 'sok';
      if (k === 'Enter') {
        const v = inp.value.trim();
        // i sökningen: den markerade träffen
        if (iSok && v && !/^\d+$/.test(v)) {
          const el = valbara()[Math.max(0, A.sel)];
          if (el) tryck(el.dataset.q);
          if (!mus.matches) inp.blur();
          return true;
        }
        inp.value = '';
        markor();
        if (v) {
          kor(v);
          // i telefonen: tangentbordet bort, så att träffarna syns
          if (!mus.matches) inp.blur();
        } else { const el = valbara()[A.sel]; if (el) tryck(el.dataset.q); }
        return true;
      }
      if (k === 'Escape') {
        if (!tomt || iSok) { inp.value = ''; markor(); if (iSok) visa(A.fore || { flik: 'kupongen' }, false); return true; }
        if (!A.bak.length) return false;
        tillbaka();
        return true;
      }
      if (k === 'ArrowUp' || k === 'ArrowDown') { valj(A.sel + (k === 'ArrowDown' ? 1 : -1)); return true; }
      if ((k === 'ArrowLeft' || k === 'ArrowRight') && tomt && !iSok) { sido(k === 'ArrowRight' ? 1 : -1); return true; }
      if (k === 'Tab') {
        const i = FLIKAR.findIndex(([id]) => id === (iSok ? (A.fore || {}).flik : A.vy.flik));
        inp.value = '';
        markor();
        A.bak = [];
        visa({ flik: FLIKAR[(i + (e.shiftKey ? -1 : 1) + FLIKAR.length) % FLIKAR.length][0] }, true);
        return true;
      }
      return false;
    }
    inp.addEventListener('keydown', (e) => {
      if (tangent(e)) e.preventDefault();
      else if (e.key === 'Escape') { e.preventDefault(); o.close(); }
    });
    // rummet ska inte dra eller zooma när man rullar i terminalen
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'touchstart', 'touchmove']) term.addEventListener(n, (e) => e.stopPropagation());

    // ---------- fram och tillbaka ----------

    const at = () => small.getBoundingClientRect();
    // Rutan terminalen får: skärmen (r, i fönstret). I en stående telefon står
    // kameran så nära att skärmens sidor ligger utanför bilden (rum-dator.js);
    // då får den det av skärmen som syns, från kant till kant (tel).
    function plats(r) {
      const left = Math.max(0, r.left);
      const width = Math.min(innerWidth, r.left + r.width) - left;
      const tel = r.width > innerWidth;
      // så många rader som ryms på höjden, men inte mindre än att det går att
      // läsa i telefonen (där rullar det i stället), och så breda rader som
      // ryms (telefonen: BRED tecken och ett par till, med telefonens luft)
      const bred = tel ? width / ((BRED + 2.5) * TECKEN + 2 * LUFT_TEL.sida) : (r.width * 0.9) / (BRED * 0.42);
      // (i ett lågt fönster, en liggande telefon, lite större än så)
      return { left, top: r.top, width, height: r.height, tel, f: Math.min(Math.max((r.height * 0.88) / (RADER * 1.12), innerHeight < 520 ? 20 : 17), bred) };
    }
    function placera(r) {
      if (!r) return;
      const P = plats(r);
      A.ruta = r;
      A.plats = P;
      ov.classList.toggle('tel', P.tel);
      term.style.setProperty('--f', `${P.f.toFixed(2)}px`);
      lagg();
    }
    // Terminalen på sin ruta, och Visa ändå under skärmen. I telefonen, där
    // skärmen går ända ner, står Visa ändå längst ner med terminalen ovanför,
    // och terminalen slutar ovanför tangentbordet när det är framme.
    function lagg() {
      const P = A.plats;
      if (!P) return;
      let ner = P.top + P.height;
      let rad = ner + 36;
      if (P.tel) {
        const kort = sp.firstElementChild;
        if (kort) {
          rad = innerHeight - kort.offsetHeight - 12;
          ner = rad - 10;
        }
        // (bara när man skriver och sidan inte är förstorad med fingrarna)
        const v = window.visualViewport;
        if (v && document.activeElement === inp && v.scale < 1.01 && v.height < innerHeight - 120) ner = Math.min(ner, v.offsetTop + v.height - 6);
      }
      Object.assign(term.style, { left: `${P.left}px`, top: `${P.top}px`, width: `${P.width}px`, height: `${Math.max(140, ner - P.top)}px` });
      radEl.style.top = `${Math.round(rad)}px`;
    }
    if (window.visualViewport) for (const n of ['resize', 'scroll']) visualViewport.addEventListener(n, () => { if (A.on) lagg(); });
    inp.addEventListener('blur', () => { if (A.on) lagg(); });
    // Var terminalens rader står på skärmen i rummet (skärmbildens px, 1024 ×
    // 768) när terminalen inte fyller skärmen (telefonen), så att inget
    // flyttar sig när den tar över och lämnar tillbaka; annars null
    function skarmLage(r) {
      const P = plats(r);
      if (!P.tel) return null;
      const kx = 1024 / r.width;
      const ky = 768 / r.height;
      const f = P.f * ky;
      // (under raderna står sökraden och tangenterna)
      const n = Math.floor((P.height / P.f - LUFT_TEL.topp - LUFT_TEL.fot - 0.3 - LUFT_TEL.rad - 0.2 - 1.6) / LUFT_TEL.rad);
      return { x: (P.left - r.left + LUFT_TEL.sida * P.f) * kx, y: LUFT_TEL.topp * f, f, rad: LUFT_TEL.rad, hoger: (P.left + P.width - r.left - LUFT_TEL.sida * P.f) * kx, n: Math.max(4, n) };
    }
    // hur många tecken som ryms på en rad (minst BRED), när terminalen syns
    function matBredd() {
      const p = document.createElement('span');
      p.textContent = 'M'.repeat(40);
      p.style.cssText = 'position:absolute; visibility:hidden; white-space:pre';
      ut.appendChild(p);
      const cw = p.getBoundingClientRect().width / 40;
      p.remove();
      const b = cw ? Math.max(BRED, Math.floor(ut.clientWidth / cw) - 1) : BRED;
      if (b === A.bred) return false;
      A.bred = b;
      return true;
    }

    function open(on, from) {
      if (on === A.on || !A.L) return Promise.resolve();
      A.on = on;
      if (on) {
        loadMatches();
        loadPlayers();
        ov.classList.add('on');
        ov.classList.remove('ute', 'framme');
        const r = from || at();
        small.classList.add('borta');
        const fram = A.L.open(true, o.calm() ? null : r);
        // telefonen: raderna på skärmen står där terminalen ställer dem
        const lage = o.calm() ? null : skarmLage(A.L.ruta());
        if (lage) {
          const R = A.R || bygg(A.vy);
          A.L.skarm([...R.topp, ...R.ut], lage);
        }
        return fram.then((ruta) => {
          if (!A.on) return;
          placera(ruta);
          A.L.skarm(null);
          ov.classList.add('framme');
          matBredd();
          visa(A.vy, false);
          // (efter tangenten som öppnade: annars hamnade R:et i sökraden)
          inp.value = '';
          setTimeout(() => {
            if (!A.on) return;
            if (mus.matches) inp.focus({ preventScroll: true });
            else ov.focus({ preventScroll: true });
            markor();
          });
        });
      }
      ov.classList.remove('framme', 'beviljad');
      ov.classList.add('ute');
      sp.innerHTML = '';
      // (mitt i en sökning: vyn där man började skriva)
      if (A.vy.flik === 'sok') {
        inp.value = '';
        A.vy = A.fore || { flik: 'kupongen' };
        A.R = bygg(A.vy);
      }
      if (ov.contains(document.activeElement)) inp.blur();
      // skärmen i rummet visar det som stod sist
      const R = A.R || bygg(A.vy);
      A.skarm = JSON.stringify([R.topp, R.ut]);
      // (telefonen: där terminalen hade dem, och som i rummet när kameran är hemma)
      const lage = o.calm() || !A.ruta ? null : skarmLage(A.ruta);
      A.L.skarm([...R.topp, ...R.ut], lage);
      const end = () => {
        if (A.on) return;
        if (ov.contains(document.activeElement)) small.focus({ preventScroll: true });
        ov.classList.remove('on', 'ute');
        small.classList.remove('borta');
        if (lage) A.L.skarm([...R.topp, ...R.ut]);
      };
      return A.L.open(false, o.calm() ? null : from || at()).then(end);
    }
    addEventListener('resize', () => {
      if (!A.on || !A.L) return;
      placera(A.L.resize());
      if (matBredd()) visa(A.vy, false);
    });

    ov.addEventListener('click', (e) => {
      if (!A.on || !ov.classList.contains('framme')) return;
      if (e.target.closest('a[href], .sp-show')) return;
      const q = e.target.closest('[data-q]');
      if (q) { tryck(q.dataset.q); if (mus.matches) inp.focus({ preventScroll: true }); return; }
      if (e.target.closest('.reg-term')) {
        // ett tryck på sökraden: skriv (i telefonen kommer tangentbordet fram);
        // med musen står markören alltid där
        if (!getSelection().toString() && (mus.matches || e.target.closest('.reg-in'))) inp.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('.reg-rad')) return;
      o.close();
    });

    return {
      fill(ms, all) {
        A.ms = (ms || []).slice();
        A.all = all || [];
        const map = new Map();
        for (const m of A.all) {
          if (off(m)) continue;
          for (const t of [m.home, m.away]) {
            if (!map.has(t)) map.set(t, []);
            map.get(t).push(m);
          }
        }
        for (const l of map.values()) l.sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
        A.byTeam = map;
        if (A.on) loadMatches();
        loadTeams();
        draw();
      },
      ready: () => Boolean(A.L),
      wait: () => A.Lp,
      at,
      open,
      on: () => A.on,
      // en fråga, som om den skrevs, eller en vy (#mote:…, #flik:omgangen …)
      // – för bilder: ?rum-register=isak
      lift(text) {
        if (!A.on) return;
        if (String(text).startsWith('#')) tryck(text);
        else kor(text);
      },
      // En tangent när markören inte står i terminalen: pilarna, Enter och Esc
      // som i sökraden, och en bokstav hamnar i sökraden (annars stängde R
      // datorn mitt i Rashford); Esc överst stänger i rum.js.
      key(k) {
        if (!A.on || !ov.classList.contains('framme')) return false;
        if (k.length !== 1) return tangent({ key: k, shiftKey: false });
        inp.focus({ preventScroll: true });
        inp.value += k;
        markor();
        levande();
        return true;
      },
    };
  }

  return { html: html0, nara, mount };
})();
