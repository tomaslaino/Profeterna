'use strict';

// Anslagstavlan i tobaksaffären (rum.js): juteväv i en träram på högra
// väggen under tv:n, med lappar på nålar. Lapparna har det på sajten som
// rummet annars inte visar, om lagen i omgången:
//   Formen         registerkort, maskinskrivet: de fem senaste före matchen i
//                  alla tävlingar med Europacuperna (matchens fil)
//   Skadelistan    genomslag: skadade, avstängda och osäkra (matchens fil)
//   Starkast       polaroid med skölden; på baksidan modellens starkaste och
//                  svagaste i omgången (data/teams/<division>.json)
//   Kryssar gärna  gul lapp: chansen till oavgjort i lagets matcher (xG)
//   Tur & otur     rutat papper: poäng mot chanserna (xG), med staplar
//   Mot oddsen     tidningsurklipp: poäng mot vad oddsen väntade sig
//   Vilan          almanacksblad: dagar sedan förra matchen i alla tävlingar
//                  med Europacuperna (matchens fil)
//   Motståndet     anteckningsblock: de som har mött svårast och lättast
//                  motstånd hittills (modellens styrka, som på Statistik)
// Mötena och lagen ett och ett står i kortregistret på disken (rum-register.js).
// Samma lappar (utom skadelistan och vilan) står som topplistor för hela
// divisionen på Statistik → Lagen (divisioner.js): ändras en, följer den andra med.
//
// Varje lapp är en bunt blad på samma nål, ett per division i omgången med
// Premier League överst och cupmatcherna sist, och bladen under sticker
// fram lite i kanten. På bladens högerkant sitter indexflikar av plast i
// divisionens färg (som på Tabeller), i samma ordning uppifrån. Ett klick på
// en flik, eller ↑/↓ (ett svep i telefonen), bläddrar alla lappar till den
// divisionen: bladen ovanpå lyfts från nålen och läggs under bunten, lapp
// för lapp över tavlan från vänster.
//
// Ryms inte det längsta bladet på lappens plats är bunten vikt: resten är
// vikt bakom, och vecket syns i underkanten. I handen vecklas den ut (i
// dragspel när den är mer än dubbelt så lång) och viks ihop på vägen
// tillbaka, så att inget på bladen klipps bort. Längden mäts i närbilden.
//
// Ett klick på tavlan: den lossnar från väggen och flyger fram, vriden från
// väggens vinkel till rakt fram, rummet mörknar bakom och den lutar lite
// efter musen. Ett klick på en lapp tar den från nålen och fram i läsbar
// storlek (polaroiden vänds, den vikta vecklas ut); ←/→ bläddrar mellan
// lapparna och ↑/↓ mellan bladen. Ryms den utvikta lappen inte i fönstret
// flyttas den med hjulet, fingret eller Page Up/Down. Esc, ett klick
// utanför eller Häng tillbaka sätter tillbaka lappen, och Esc igen eller
// ett klick utanför tavlan hänger tavlan på väggen igen.
//
// Under lappen i handen kan man ropa till Hasse Backe (fiktiv), som sitter i
// baren till vänster utanför bilden (Hasse, vad betyder procenten?, eller H),
// och han lutar sig in nere till vänster och svarar i en pratbubbla: vad talen
// är, ett exempel ur bladet man har framme och vad han själv gör med det.
// Svaret kommer ord för ord bredvid lappen, eller över den när fönstret är för
// smalt, och med ljudet på hörs han från vänster (RumHasse.fjarran). Tack,
// Hasse, Esc eller ett klick utanför tystar honom; ett klick på svaret visar
// resten direkt.
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
// RumAnslag.mount(root, { calm, kort, close }) → { fill(ms, all), quad(), open(on, q), on(), key(k), drog() }

window.RumAnslag = (() => {
  // tavlan ritas i 1000 × 568 och förminskas på väggen
  const BW = 1000;
  const BH = 568;
  // I en stående telefon står närbilden på höjden, två spalter och fyra rader i stället för fyra
  // spalter och två rader: telefonen har höjden, och lapparna blir ungefär 1,6 gånger så stora och går
  // att läsa utan att lyftas. Tavlan på väggen är densamma, bara den framme har de här måtten.
  const HW = 598;
  const HH = 1070;
  const hog = () => innerWidth < 600 && innerHeight > innerWidth * 1.2;
  const HOG = { form: [8, 24], skador: [336, 12], styrka: [60, 272], kryss: [350, 276], tur: [40, 508], odds: [332, 512], vila: [40, 752], motstand: [342, 760] };
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
    { id: 'kryss', paper: 'postit', x: 766, y: 40, w: 166, h: 190, rot: 3, pin: '#3db37c', name: 'Kryssar gärna' },
    { id: 'tur', paper: 'rutat', x: 30, y: 280, w: 210, h: 228, rot: 1.6, pin: '#d8b06a', name: 'Tur & otur' },
    { id: 'odds', paper: 'tidning', x: 270, y: 290, w: 202, h: 218, rot: -1.1, pin: '#c2271c', name: 'Mot oddsen' },
    { id: 'vila', paper: 'almanacka', x: 502, y: 264, w: 210, h: 248, rot: 2.1, pin: '#5a5f8a', name: 'Vilan' },
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
  // Lagets fem senaste i matchen: ur matchens fil, med Europacuperna, och ur
  // matcherna tills den har hämtats (eller om den inte gick att hämta).
  function formOf(D, m, side) {
    const d = D.match.get(m.id);
    const T = d && d.teams && d.teams[side];
    if (T && T.form) return T.form.slice(0, 5).map((y) => (window.Spoiler && Spoiler.hidesDay(y.date) ? '?' : y.result || '?'));
    return form(D.teams.get(m[side]), m[side], Date.parse(m.kickoff));
  }
  // Dagar sedan lagets förra match före avspark: ur matchens fil, i alla
  // tävlingar med Europacuperna, och som formen ur matcherna tills den har
  // hämtats.
  function rest(D, m, side) {
    const d = D.match.get(m.id);
    const S = d && d.teams && d.teams[side] && d.teams[side].schedule;
    if (S) return S.last ? S.last.days : null;
    const t = Date.parse(m.kickoff);
    const prev = (D.teams.get(m[side]) || []).find((x) => x.id !== m.id && Date.parse(x.kickoff) < t);
    return prev ? dayNo(t) - dayNo(Date.parse(prev.kickoff)) : null;
  }

  // ---------- lapparna ----------

  const rowsOf = (items) => items.join('');
  const dolt = (h) => `<h4>${h}</h4><p class="dolt">?</p>`;
  const blank = (n, cls = 'tom') => Array.from({ length: n }, () => `<span class="${cls}"></span>`).join('');

  function noteForm(D) {
    if (!D.ms.length) return '<h4>Formen</h4><p class="inget">Ingen omgång</p>';
    return '<h4>Formen</h4><div class="ans-g5">' + rowsOf(D.ms.map((m) => {
      const cell = (l) => l.map((x) => `<i${x === '?' ? ' class="q"' : ''}>${x}</i>`).join('');
      return `<span class="h">${esc(D.kort(m.home))}</span><span class="f">${cell(formOf(D, m, 'home'))}</span><span class="s">–</span>` +
        `<span class="f">${cell(formOf(D, m, 'away'))}</span><span class="a">${esc(D.kort(m.away))}</span>`;
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
    // texten för hand under fotot: mindre när namnet är långt, så att den ryms
    const under = `Starkast${etta && !D.veil ? ` – ${D.kort(etta.name)}` : ''}`;
    const front = `<span class="ans-foto">${D.veil ? '<b class="q">?</b>' : crest}</span>` +
      `<span class="ans-under" style="font-size:${Math.min(19, Math.floor(148 / (0.4 * under.length)))}px">${esc(under)}</span>`;
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
    const row = (x) => `<span class="r"><span>${esc(D.kort(x.name))}</span><i class="bar${x.v < 0 ? ' neg' : ''}" style="width:${r1(4 + 36 * Math.abs(x.v) / max)}px"></i>` +
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
      const h = rest(D, m, 'home');
      const a = rest(D, m, 'away');
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

  // ---------- Hasse svarar ----------

  // Det man ropar till Hasse om varje lapp (länken under lappen i handen). Han svarar från
  // baren med det som står under anslag i rum-hasse-repliker.js, där det också får sitt ljud,
  // och med ett exempel ur bladet man har framme, som räknas här: en mening, eller null utan
  // data och när bladet räknar med dolda resultat (D är då null). Exemplet ändras med datan och
  // sägs därför tyst.
  const ROP = {
    form: 'Hasse, hur läser man formen?',
    skador: 'Hasse, hur mycket betyder skadorna?',
    styrka: 'Hasse, hur mäter man styrka?',
    kryss: 'Hasse, vad betyder procenten?',
    tur: 'Hasse, vad är tur och otur?',
    odds: 'Hasse, vad betyder det att slå oddsen?',
    vila: 'Hasse, spelar vilan någon roll?',
    motstand: 'Hasse, vad säger motståndet?',
  };
  const TACK = 'Tack, Hasse';
  // små tal i ord, som i löptext
  const ORD = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];
  const ord = (n) => ORD[n] || String(n);
  const dagar = (n) => `${ord(n)} ${n === 1 ? 'dags' : 'dagars'}`;
  // den högsta och den lägsta i bladet (ur samma tal som lappen), eller null
  const ytter = (D, get) => (D ? split(D, get, 1).map((l) => l[0] || null) : [null, null]);
  // "A har tagit 6,5 poäng mer än …, och B 9,6 poäng mindre."
  const merMindre = (D, [upp, ned], an) => (upp
    ? `${D.kort(upp.name)} har tagit ${num(upp.v)} poäng mer än ${an}${ned ? `, och ${D.kort(ned.name)} ${num(ned.v)} poäng mindre` : ''}.`
    : ned ? `${D.kort(ned.name)} har tagit ${num(ned.v)} poäng mindre än ${an}.` : null);

  const EXEMPEL = {
    form(D) {
      let bast = null;
      for (const m of D ? D.ms : []) {
        for (const side of ['home', 'away']) {
          const l = formOf(D, m, side);
          if (l.length < 5 || l.some((x) => !/^[VOF]$/.test(x))) continue;
          const p = l.reduce((s, x) => s + (x === 'V' ? 3 : x === 'O' ? 1 : 0), 0);
          if (!bast || p > bast.p) bast = { name: m[side], p };
        }
      }
      return bast && `${D.kort(bast.name)} har bäst form på lappen: ${bast.p} poäng av 15 möjliga, med tre poäng för vinst och en för oavgjort.`;
    },
    skador(D) {
      let flest = null;
      for (const m of D ? D.ms : []) {
        const d = D.match.get(m.id);
        for (const side of ['home', 'away']) {
          const s = d && d.squad && d.squad[side];
          if (s && !s.unknown && s.players.length >= 2 && (!flest || s.players.length > flest.n)) flest = { name: m[side], n: s.players.length };
        }
      }
      return flest && `${D.kort(flest.name)} har flest på listan, ${ord(flest.n)} man.`;
    },
    styrka(D) {
      const teams = D ? D.round.filter((x) => x.t && x.t.str != null) : [];
      const div = DIVS.find((d) => teams.some((x) => x.t.comp === d));
      const etta = div ? teams.filter((x) => x.t.comp === div).sort((a, b) => b.t.str - a.t.str)[0] : null;
      return etta && etta.t.str > 0
        ? `${D.kort(etta.name)} har ${signed(etta.t.str, 2)}. Mot ett medelbra lag i serien skulle de alltså vinna med ${num(etta.t.str, 2)} mål per match i snitt.`
        : null;
    },
    kryss(D) {
      const [topp] = D ? teamList(D, xdraw, 1) : [];
      if (!topp) return null;
      const hur = topp.v >= 0.29 ? 'klart mer än vanligt' : topp.v >= 0.26 ? 'lite mer än vanligt' : 'ungefär som vanligt';
      return `${D.kort(topp.name)} står överst med ${pct(topp.v)}. Det är ${hur}.`;
    },
    tur: (D) => (D ? merMindre(D, ytter(D, xpd), 'chanserna var värda') : null),
    odds: (D) => (D ? merMindre(D, ytter(D, vsOdds), 'oddsen räknade med') : null),
    vila(D, rep) {
      let mest = null;
      for (const m of D ? D.ms : []) {
        const h = rest(D, m, 'home');
        const a = rest(D, m, 'away');
        if (h == null || a == null || Math.abs(h - a) < 2) continue;
        if (!mest || Math.abs(h - a) > mest.d) mest = h < a ? { d: a - h, trott: m.home, pigg: m.away, t: h, p: a } : { d: h - a, trott: m.away, pigg: m.home, t: a, p: h };
      }
      if (mest) return `${D.kort(mest.trott)} har ${dagar(mest.t)} vila mot ${ord(mest.p)} för ${D.kort(mest.pigg)}.`;
      return D && D.ms.length ? rep.lugnt : null;
    },
    motstand(D) {
      const [upp, ned] = ytter(D, opp);
      return upp && ned ? `${D.kort(upp.name)} har haft det tuffast med ${signed(upp.v, 2)}, och ${D.kort(ned.name)} det lättast med ${signed(ned.v, 2)}.` : null;
    },
  };
  // Det han svarar om lappen id, i stycken av meningar: en rad ur anslagSvar, förklaringen,
  // exemplet och vad han själv gör med det. null utan repliker.
  function svaret(id, D) {
    const R = window.HasseRepliker;
    const rep = R && R.anslag && R.anslag[id];
    if (!rep) return null;
    const ex = EXEMPEL[id](D, rep);
    const forst = R.anslagSvar[Math.floor(Math.random() * R.anslagSvar.length)];
    return [[forst], ...rep.forklaring, ...(ex ? [[ex]] : []), ...rep.rad];
  }

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
    const spar = (bw, bh) => {
    let marks = '';
    for (let i = 0; i < 26; i++) marks += `<i class="ans-hal" style="left:${Math.round(40 + R0() * (bw - 80))}px; top:${Math.round(36 + R0() * (bh - 72))}px"></i>`;
    for (let i = 0; i < 4; i++) {
      const x = Math.round(60 + R0() * (bw - 140));
      const y = Math.round(40 + R0() * (bh - 88));
      const c = ['#f1ead6', '#f3e58a', '#ddd5c0', '#fbf7ec'][i % 4];
      marks += `<i class="ans-rest" style="left:${x}px; top:${y}px; background:${c}; transform: rotate(${Math.round((R0() - 0.5) * 60)}deg)"><b class="ans-nal" style="background:${['#c2271c', '#2a52a0', '#3db37c', '#d8b06a'][(R0() * 4) | 0]}"></b></i>`;
    }
    // där en stor affisch hängt länge är juten mindre gulnad
    marks += `<i class="ans-blek" style="left:${Math.round(60 + R0() * (bw - 500))}px; top:${Math.round(60 + R0() * 200)}px; transform: rotate(${r1((R0() - 0.5) * 3)}deg)"></i>`;
    return marks;
    };
    const marks = spar(1000, 568);
    return { notes, marks, marksHog: spar(HW, HH) };
  }
  // Lapparna på den stående tavlan: dagens förskjutning (wear) från sin plats i spalterna.
  function hogW(W) {
    return {
      marks: W.marksHog,
      notes: W.notes.map((n) => {
        const b = NOTES.find((x) => x.id === n.id);
        return { ...n, x: HOG[n.id][0] + n.x - b.x, y: HOG[n.id][1] + n.y - b.y };
      }),
    };
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
  // Ryms inte det längsta bladet på lappens plats är bunten vikt: på tavlan
  // syns vecket i underkanten, och i handen (len, den utvikta längden) är
  // bladen delade i paneler som vecklas ut (panels).
  const depth = (sheets, s, top) => (sheets.indexOf(s) - sheets.indexOf(top) + sheets.length) % sheets.length;
  const arkPos = (n, i) => `translate(${n.fan[i][1]}px, ${n.fan[i][2]}px) rotate(${n.fan[i][0]}deg)`;
  function sheetsHtml(n, inner, sheets, top, len = n.h) {
    const delad = len > n.h;
    return sheets.map((s, i) => {
      const a = ARK[s];
      const lag = depth(sheets, s, top);
      // flikarna med lika långt mellan sig fast bladen är vridna och förskjutna
      const y = r1(FLIK(i) - n.fan[i][2] - (n.w / 2) * Math.sin((n.fan[i][0] * Math.PI) / 180));
      const flik = a ? `<i class="ans-flik" data-flik="${s}" style="top:${y}px; --dv:${a.col}"><b>${a.short}</b></i>` : '';
      const body = delad ? panels(n, len, inner[s]) : `<span class="ans-in">${inner[s]}</span>${n.paper === 'polaroid' ? '' : '<i class="ans-vik"></i>'}`;
      return `<span class="ans-ark ${delad ? 'delad' : `p-${n.paper}`}" data-ark="${s}" style="z-index:${sheets.length - lag}; --lag:${lag}; transform:${arkPos(n, i)}">` +
        `${body}${flik}</span>`;
    }).join('');
  }
  // Ett utvikt blad: överst panelen som syns på tavlan (n.h hög), och under
  // den resten av längden i lika långa paneler, var och en fäst i
  // underkanten på den ovanför (ett veck) och vikt bakom den – i dragspel,
  // så att de ryms bakom den översta. Varje panel har en kopia av hela
  // bladet, förskjuten uppåt, så att papperet och texten fortsätter över
  // vecken, och en baksida.
  function panels(n, len, html) {
    const k = Math.ceil(len / n.h);
    const p = (len - n.h) / (k - 1);
    let out = '';
    for (let i = k - 1; i >= 0; i--) {
      const y = i ? n.h + (i - 1) * p : 0;
      const sida = `<span class="ans-sida"><span class="ans-papper p-${n.paper}" style="top:${r1(-y)}px; height:${len}px"><span class="ans-in">${html}</span></span></span>`;
      out = `<span class="ans-pan${i ? ' vik' : ''}" data-d="${i}" style="top:${i ? r1(i === 1 ? n.h : p) : 0}px; height:${r1(i ? p : n.h)}px">` +
        `${sida}${i ? `<span class="ans-rygg p-${n.paper}"></span>` : ''}${out}</span>`;
    }
    return out;
  }
  const label = (n, top) => esc(ARK[top] ? `${n.name} – ${ARK[top].name}` : n.name);
  const noteHtml = (n, inner, sheets, top, wall) => `<${wall ? 'span' : 'button type="button"'} class="ans-lapp" data-lapp="${n.id}" ` +
    `style="left:${n.x}px; top:${n.y}px; width:${n.w}px; height:${n.h}px; --rot:${n.rot}deg"${wall ? '' : ` aria-label="${label(n, top)}"`}>` +
    `${sheetsHtml(n, inner, sheets, top)}</${wall ? 'span' : 'button'}>`;

  function board(W, inner, sheets, top, wall) {
    const notes = W.notes.map((n) => noteHtml(n, inner[n.id], sheets, top, wall)).join('');
    const pins = W.notes.map(pin).join('');
    // ytan före ramens sidor: sidorna ritas efter djupet ändå (preserve-3d),
    // och kom ytan efter dem blev den ett eget lager i tavlans fulla storlek
    // (den överlappar dem), vilket Safari ritar gånger pixeltätheten
    return `<span class="ans-yta"><span class="ans-jute">${W.marks}${notes}${pins}</span><i class="ans-glans"></i></span>` +
      '<i class="ans-f ans-topp"></i><i class="ans-f ans-botten"></i><i class="ans-f ans-vanster"></i><i class="ans-f ans-hoger"></i>';
  }

  function wall() {
    return '<i class="ans-flack"></i><i class="ans-skugga"><i></i></i><span class="ans-tavla" id="ans-vagg"></span>' +
      '<i class="ans-hj" data-hj="0"></i><i class="ans-hj" data-hj="1"></i><i class="ans-hj" data-hj="2"></i><i class="ans-hj" data-hj="3"></i>';
  }
  function nara() {
    return '<div class="rum-ansn" id="rum-ansn" role="dialog" aria-label="Anslagstavlan"><div class="ans-bak"></div>' +
      '<div class="ans-flyg" id="ans-flyg"><div class="ans-luta" id="ans-luta"><div class="ans-tavla stor" id="ans-stor" tabindex="-1"></div></div></div>' +
      '<div class="ans-lyft" id="ans-lyft"></div><i class="ans-hasse-mork"></i><i class="ans-hasse-fig" aria-hidden="true"></i>' +
      '<div class="ans-hasse" id="ans-hasse" aria-label="Hasse Backe svarar"></div><svg class="ans-svans" aria-hidden="true"><path class="f"></path><path class="k"></path></svg>' +
      '<div class="ans-rad" id="ans-rad"><span id="ans-sp"></span><button type="button" class="ans-ropa" data-ans="hasse" aria-expanded="false"></button>' +
      '<button type="button" class="ans-tbx" data-ans="tillbaka">Häng tillbaka</button></div></div>';
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
  // Safari, och alla webbläsare i iPhone (som WEBKIT i rum.js)
  const WEBKIT = !navigator.userAgentData && /AppleWebKit/.test(navigator.userAgent);

  // ---------- i rummet ----------

  function mount(root, o) {
    const A = { on: false, ms: [], all: [], teams: new Map(), match: new Map(), html: '', loaded: 0, lyft: null, raf: 0, seed: -1, W: null, sheets: ['alla'], top: 'alla', anims: [], flip: 0, len: {}, vanims: [], hk: false };
    const vagg = root.querySelector('#ans-vagg');
    const wallEl = root.querySelector('#rum-ans');
    const ov = root.querySelector('#rum-ansn');
    const flyg = root.querySelector('#ans-flyg');
    const luta = root.querySelector('#ans-luta');
    const stor = root.querySelector('#ans-stor');
    const lyftEl = root.querySelector('#ans-lyft');
    const rad = root.querySelector('#ans-rad');
    const sp = root.querySelector('#ans-sp');
    const hkEl = root.querySelector('#ans-hasse');
    const mork = root.querySelector('.ans-hasse-mork');
    const figEl = root.querySelector('.ans-hasse-fig');
    const svans = root.querySelector('.ans-svans');
    // det som syns när han svarar: han själv, pratbubblan och dess spets
    const hkDelar = [figEl, hkEl, svans];
    const ropa = root.querySelector('[data-ans="hasse"]');
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
    // matchernas filer (formen, vilan, skadorna) hämtas med rummet, så att
    // lapparna på väggen räknar med Europacuperna redan innan tavlan tas fram,
    // och de som kommer nära varandra ritas tillsammans
    function rita() {
      if (A.ritT) return;
      A.ritT = setTimeout(() => {
        A.ritT = 0;
        draw();
      }, 100);
    }
    function loadMatches() {
      for (const m of A.ms) {
        if (A.match.has(m.id)) continue;
        A.match.set(m.id, undefined);
        getJSON(`data/match/${encodeURIComponent(m.id)}.json`).then((d) => { A.match.set(m.id, d); rita(); })
          .catch(() => { A.match.set(m.id, null); rita(); });
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

    // Medan tavlan flyger ritas inget (landat): filerna kommer just då, och
    // varje ombyggnad stoppade flygturen. Sedan byts bara lapparna som har
    // ändrats.
    function draw() {
      if (A.flyger) {
        A.ritaSen = true;
        return;
      }
      fitWall();
      // (telefonen har vänts: tavlan framme byggs om)
      const staende = hog();
      if (staende !== A.hog) {
        A.hog = staende;
        A.html = '';
        stor.classList.toggle('hog', staende);
        flyg.classList.toggle('hog', staende);
      }
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
      const nu = A.inner;
      A.inner = inner;
      stopFlip();
      const hela = `${seed}|${A.sheets}|${staende}`;
      if (hela === A.hela) {
        for (const n of A.W.notes) {
          if (JSON.stringify(nu[n.id]) === JSON.stringify(inner[n.id])) continue;
          const lapp = sheetsHtml(n, inner[n.id], A.sheets, A.top);
          for (const b of [vagg, stor]) b.querySelector(`[data-lapp="${n.id}"]`).innerHTML = lapp;
        }
        // (bläddrades det just stannar bladen där de ska ligga, stopFlip)
        for (const el of lapparna()) stack(el, A.top);
      } else {
        A.hela = hela;
        vagg.innerHTML = board(A.W, inner, A.sheets, A.top, true);
        stor.innerHTML = board(staende ? hogW(A.W) : A.W, inner, A.sheets, A.top, false);
      }
      measure();
      if (A.lyft) {
        const n = A.W.notes.find((x) => x.id === A.lyft.id);
        stor.querySelector(`[data-lapp="${n.id}"]`).classList.add('borta');
        const card = lyftEl.querySelector('.ans-lapp');
        if (card) {
          stopVik();
          A.lyft.len = A.len[n.id] || n.h;
          card.style.height = `${A.lyft.len}px`;
          card.innerHTML = sheetsHtml(n, inner[n.id], A.sheets, A.top, A.lyft.len);
          card.classList.add('utvikt');
          placeLyft(n, false);
        }
        if (n.paper === 'polaroid' && A.lyft.vand) vand(true);
        spoilerRow(n);
      }
      // typsnitten ändrar längden: mät om när de har laddats
      if (document.fonts && !A.typsnitt) {
        A.typsnitt = true;
        document.fonts.ready.then(() => { if (measure() && A.lyft) { A.html = ''; draw(); } });
      }
    }

    // Hur långa lapparna är utvikta (A.len): det längsta bladet i bunten,
    // minst lappens plats på tavlan. De längre är vikta (.vikt), på väggen
    // och i närbilden. Mäts i närbilden, som är utlagd också när den inte
    // syns; utan mått (rummet är inte utlagt) mäts den när tavlan tas fram.
    function measure() {
      if (!stor.offsetWidth || !A.W) return false;
      const len = {};
      for (const n of A.W.notes) {
        let L = n.h;
        if (n.paper !== 'polaroid') for (const el of stor.querySelectorAll(`[data-lapp="${n.id}"] .ans-in`)) L = Math.max(L, el.scrollHeight);
        len[n.id] = L - n.h > 3 ? Math.ceil(L) : n.h;
      }
      const ny = JSON.stringify(len) !== JSON.stringify(A.len);
      A.len = len;
      A.matt = A.html;
      for (const el of [...vagg.querySelectorAll('.ans-lapp'), ...stor.querySelectorAll('.ans-lapp')]) {
        const n = A.W.notes.find((x) => x.id === el.dataset.lapp);
        el.classList.toggle('vikt', len[n.id] > n.h);
      }
      return ny;
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
      if (A.hog) {
        // (namnet och Tillbaka står överst, och nedanför behövs inget utrymme)
        const k = Math.min((innerWidth - 24) / HW, (innerHeight - 76) / HH);
        const L = (innerWidth - HW * k) / 2;
        const T = 64 + Math.max(0, (innerHeight - 64 - HH * k) / 2 - 6);
        A.place = { k, L, T, q: [[L, T], [L + HW * k, T], [L + HW * k, T + HH * k], [L, T + HH * k]] };
        return A.place;
      }
      const k = Math.min((innerWidth - (innerWidth < 700 ? 24 : 120)) / BW, (innerHeight - (innerHeight < 500 ? 90 : 170)) / BH, 1.35);
      const L = (innerWidth - BW * k) / 2;
      const T = (innerHeight - BH * k) / 2 - 16;
      A.place = { k, L, T, q: [[L, T], [L + BW * k, T], [L + BW * k, T + BH * k], [L, T + BH * k]] };
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
    // Vägen räknas ut i förväg, en avbildning var 20:e ms, och flygs som en
    // animering som grafikkortet sköter själv. Förut sattes avbildningen i
    // varje bildruta: Chrome räknade då om alla rummets lager varje gång och
    // hann, med gänget och sakerna i 3D som ritas samtidigt, bara flytta
    // tavlan i varannan eller var tredje bildruta medan kameran gled i
    // varje – tavlan hackade fram.
    function stopFly() {
      cancelAnimationFrame(A.raf);
      if (A.fa) A.fa.cancel();
      A.fa = null;
      landat();
    }
    function landat() {
      A.flyger = false;
      if (!A.ritaSen) return;
      A.ritaSen = false;
      draw();
    }
    // Tavlans hörn t in på vägen.
    function hornPa({ from, to }, t) {
      const e = ease(t);
      const lift = 1 + 0.05 * Math.sin(Math.PI * t);
      const q = from.map((p, i) => [p[0] + (to[i][0] - p[0]) * e, p[1] + (to[i][1] - p[1]) * e]);
      const c = [0, 1].map((j) => q.reduce((s, p) => s + p[j], 0) / 4);
      return q.map((p) => [c[0] + (p[0] - c[0]) * lift, c[1] + (p[1] - c[1]) * lift]);
    }
    function fly(from, to, ms) {
      stopFly();
      A.flyger = true;
      const bana = (A.bana = { from, to, ms });
      const at = (t) => warp(hornPa(bana, t), A.hog ? HW : BW, A.hog ? HH : BH);
      const n = Math.max(12, Math.round(ms / 20));
      const vag = Array.from({ length: n + 1 }, (_, i) => ({ transform: at(i / n) }));
      return new Promise((done) => {
        A.flygKlar = done;
        const starta = () => {
          const a = (A.fa = flyg.animate(vag, { duration: ms, easing: 'linear' }));
          a.finished.then(() => {
            if (A.fa !== a) return;
            flyg.style.transform = vag[n].transform;
            a.cancel();
            A.fa = null;
            A.flygKlar = null;
            landat();
            done();
          }, () => {});
        };
        // I Safari börjar den när tavlan i närbilden har ritats (minst två
        // bildrutor, och en som gick fort, högst 20): där tog den första
        // bildrutan så lång tid att tavlan hoppade en bit av vägen. Chrome
        // startar klockan själv när animeringen når grafikkortet, samtidigt
        // som kameran.
        if (!WEBKIT) return starta();
        let k = 0;
        let fore = 0;
        const step = (now) => {
          if (++k < 3 || (now - fore >= 40 && k <= 20)) {
            fore = now;
            A.raf = requestAnimationFrame(step);
            return;
          }
          starta();
        };
        A.raf = requestAnimationFrame(step);
      });
    }

    function open(on, q) {
      if (on === A.on) return Promise.resolve();
      A.on = on;
      if (on) {
        loadMatches();
        if (hog() !== A.hog) draw();
        if (A.matt !== A.html) measure();
        place();
        // (var den på väg tillbaka vänder den där den är)
        const from = A.fa ? hornPa(A.bana, A.fa.currentTime / A.bana.ms) : q || quad();
        ov.classList.add('on');
        ov.classList.remove('ute');
        wallEl.classList.add('borta');
        luta.style.transform = '';
        if (o.calm()) {
          rest();
          ov.classList.add('framme');
          return Promise.resolve();
        }
        flyg.style.transform = warp(from, A.hog ? HW : BW, A.hog ? HH : BH);
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
      // (var den på väg fram vänder den där den är)
      const fran = A.fa ? hornPa(A.bana, A.fa.currentTime / A.bana.ms) : A.place ? A.place.q : quad();
      return fly(fran, q || quad(), 560).then(end);
    }

    // Lutar lite efter musen, så att ramens djup syns. Vinkeln sätts som
    // transform direkt, inte som CSS-variabler: de ärvs av allt på tavlan,
    // och då räknade Chrome om stilen för alla lappar och målade om dem vid
    // varje musrörelse.
    ov.addEventListener('mousemove', (e) => {
      if (!A.on || A.lyft || o.calm()) return;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      luta.style.transform = `rotateX(${r1(-y * 3.5)}deg) rotateY(${r1(x * 5)}deg)`;
    });
    addEventListener('resize', () => {
      fitWall();
      if (!A.on) return;
      place();
      // (var den på väg fram är den framme nu)
      const klar = A.flygKlar;
      A.flygKlar = null;
      stopFly();
      rest();
      if (klar) klar();
      if (A.lyft) placeLyft(A.W.notes.find((x) => x.id === A.lyft.id), false);
    });

    // ---------- en lapp i handen ----------

    // Lappen i läsbar storlek mitt i fönstret, utvikt: { x, top, s, over }
    // med mitten i sidled, överkanten och skalan. Den långa lappen blir inte
    // mindre än att den går att läsa (MINS); ryms den inte då, hamnar
    // överkanten högt upp och resten (over, med knappen under) nås genom att
    // flytta lappen (pan). I telefonen bläddrar man med ett svep (rum.js), så
    // där behövs ingen plats vid sidorna.
    const MINS = 1.15;
    // Hasses svar (HK_W brett, HK_G till lappen) står till vänster om lappen,
    // åt baren till, när lappen då kan bli minst 1,3 gånger så stor som på
    // tavlan (bredvid: den största skalan som ryms), annars över lappen.
    const HK_W = 400;
    const HK_G = 28;
    const bredvid = (n) => (innerWidth - 96 - HK_W - HK_G) / (n.w + (ARK[A.top] ? 18 : 0));
    function held(n, len = n.h) {
      const sm = innerWidth < 700;
      // flikarna sticker ut i högerkanten: lika mycket luft på båda sidor
      const w = n.w + (ARK[A.top] ? 36 : 0);
      const fri = innerHeight - (innerHeight < 500 ? 120 : 220);
      const hk = A.hk && !sm && bredvid(n) >= 1.3;
      const s = Math.min(Math.max(fri / len, MINS), hk ? bredvid(n) : (innerWidth - (sm ? 32 : 160)) / w / (sm ? 1.04 : 1.2), 3.2);
      // (i telefonen under rummets namn, som ligger kvar överst)
      const top = Math.max(sm ? 72 : 48, (innerHeight - 70) / 2 - (len * s) / 2);
      // med svaret bredvid står de två tillsammans mitt i fönstret (kort:
      // svarets vänsterkant)
      const kort = hk ? (innerWidth - HK_W - HK_G - (n.w + (ARK[A.top] ? 18 : 0)) * s) / 2 : null;
      return { x: hk ? kort + HK_W + HK_G + (n.w * s) / 2 : innerWidth / 2, top, s, over: Math.max(0, top + len * s + 64 - innerHeight), kort };
    }
    // Hållen: överkanten flyttad pan uppåt; transform-origin är mitt på den
    // översta panelen, som på tavlan.
    // anim: true från nålen, 'flytta' från där lappen står (när Hasse börjar
    // svara eller tystnar), annars direkt.
    function placeLyft(n, anim) {
      const len = A.lyft.len;
      const h = held(n, len);
      A.lyft.over = h.over;
      A.lyft.pan = Math.min(A.lyft.pan || 0, h.over);
      const top = h.top - A.lyft.pan;
      const card = lyftEl.firstElementChild;
      const to = `translate(${r1(h.x - n.w / 2)}px, ${r1(top + (n.h * h.s) / 2 - n.h / 2)}px) scale(${h.s.toFixed(3)})`;
      // raden står under lappen, också när svaret har skjutit den åt höger
      const fore = anim === 'flytta' && !o.calm() ? [card.style.transform, rad.style.top, rad.style.transform || 'none'] : null;
      rad.style.top = `${r1(top + len * h.s + 18)}px`;
      rad.style.transform = `translateX(${r1(h.x - innerWidth / 2)}px)`;
      rad.style.paddingLeft = '';
      rad.style.columnGap = '';
      hkPlats(h, top);
      if (anim === 'flytta') {
        card.style.transform = to;
        if (fore) {
          const g = { duration: 460, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' };
          card.animate([{ transform: fore[0] }, { transform: to }], g);
          rad.animate([{ top: fore[1], transform: fore[2] }, { top: rad.style.top, transform: rad.style.transform }], g);
        }
        return null;
      }
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

    // ---------- Hasse svarar ----------

    // Han lutar sig in från baren nere till vänster: svaret står i en pratbubbla bredvid
    // lappen, eller över lappen när det inte får plats bredvid,
    // och kommer ord för ord, en mening i taget (som repliker i rum-hasse.js). Med ljudet
    // på (knappen i baren) hörs han från vänster och orden kommer i takt med rösten;
    // meningar utan ljud, som exemplet, säger han tyst i skriftens takt. Med minskad
    // rörelse står allt direkt och han hörs inte, som i baren.
    const ORD_MS = 44;
    const ordTid = (w) => ORD_MS * (w.length + 1) + (/[,:;]$/.test(w) ? 170 : 0);
    const VANTA = 2500;
    const rostEn = () => (window.RumHasse && RumHasse.fjarran) || null;
    const paus = (x) => { const nx = x.m[x.i + 1]; return !nx ? 0 : nx.ny ? 850 : 400; };

    function ropText(n) {
      ropa.textContent = A.hk ? TACK : ROP[n.id];
      ropa.setAttribute('aria-expanded', String(A.hk));
    }
    function stoppa(x) {
      clearTimeout(x.t);
      cancelAnimationFrame(x.raf);
      if (x.ljud) x.ljud.stop();
      x.ljud = null;
    }
    function tyst() {
      const x = A.tal;
      A.tal = null;
      if (x) stoppa(x);
    }
    // Svaret skrivs ut osynligt från början, så att inget flyttar sig medan han pratar.
    function svara(n) {
      tyst();
      const D = A.D && A.D.ark[A.top];
      const st = svaret(n.id, D && !(VEILED.has(n.id) && D.veil) ? D : null) || [];
      const R = o.calm() ? null : rostEn();
      if (R) R.vakna();
      const tal = document.createElement('div');
      const m = [];
      for (const stycke of st) {
        const p = document.createElement('p');
        stycke.forEach((text, i) => {
          if (i) p.append(' ');
          const el = document.createElement('span');
          el.className = 'ans-rep';
          const orden = text.split(/\s+/).filter(Boolean).map((w, j) => {
            if (j) el.append(' ');
            const ett = document.createElement('span');
            ett.className = 'ans-o';
            ett.textContent = w;
            el.append(ett);
            return ett;
          });
          p.append(el);
          m.push({ el, ord: orden, ny: i === 0, klipp: R ? R.ljud(text) : null });
        });
        tal.append(p);
      }
      hkEl.replaceChildren(tal);
      hkEl.classList.remove('klar');
      hkEl.scrollTop = 0;
      const x = { m, i: -1, t: 0, raf: 0, ljud: null };
      A.tal = x;
      if (o.calm()) hoppaTal();
      else x.t = setTimeout(() => nastaMening(x), 300);
    }
    // följer med nedåt när svaret är längre än fönstret
    function folj(el) {
      const ner = el.offsetTop + el.offsetHeight - hkEl.clientHeight + 12;
      if (ner > hkEl.scrollTop) hkEl.scrollTop = ner;
    }
    function nastaMening(x) {
      if (A.tal !== x) return;
      if (x.m[x.i]) x.m[x.i].el.classList.remove('nu');
      const i = ++x.i;
      const m = x.m[i];
      if (!m) {
        hkEl.classList.add('klar');
        return;
      }
      m.el.classList.add('nu');
      folj(m.el);
      // väntar på ljudet en stund, och säger meningen tyst om det inte kommer
      const ga = (k) => {
        if (A.tal !== x || x.i !== i || m.gatt) return;
        m.gatt = true;
        clearTimeout(x.t);
        const R = rostEn();
        if (k && R && !R.av()) medRost(x, m, k, R);
        else ordForOrd(x, m, 0);
      };
      if (!m.klipp) {
        ga(null);
        return;
      }
      x.t = setTimeout(() => ga(null), VANTA);
      m.klipp.then(ga, () => ga(null));
    }
    function ordForOrd(x, m, j) {
      if (A.tal !== x) return;
      if (j < m.ord.length) {
        m.ord[j].classList.add('s');
        x.t = setTimeout(() => ordForOrd(x, m, j + 1), ordTid(m.ord[j].textContent));
        return;
      }
      x.t = setTimeout(() => nastaMening(x), paus(x));
    }
    // Orden får sin tid efter längden, utspridd över talet i klippet (borja i rum-hasse.js).
    function medRost(x, m, k, R) {
      const l = (x.ljud = R.spela(k));
      const vikt = m.ord.map((w) => ordTid(w.textContent));
      const sum = vikt.reduce((s, v) => s + v, 0) || 1;
      let acc = 0;
      const tider = vikt.map((v) => { const t = k.fran + (acc / sum) * (k.till - k.fran); acc += v; return t; });
      let j = 0;
      const steg = () => {
        if (A.tal !== x) return;
        const p = l.fran + (R.nu() - l.t0);
        while (j < m.ord.length && p >= tider[j]) m.ord[j++].classList.add('s');
        if (p < l.till && !l.slut) {
          x.raf = requestAnimationFrame(steg);
          return;
        }
        while (j < m.ord.length) m.ord[j++].classList.add('s');
        x.ljud = null;
        x.t = setTimeout(() => nastaMening(x), paus(x));
      };
      x.raf = requestAnimationFrame(steg);
    }
    // Hela svaret på en gång (ett klick på det, och med minskad rörelse).
    function hoppaTal() {
      const x = A.tal;
      if (!x) return;
      stoppa(x);
      for (const m of x.m) {
        m.el.classList.remove('nu');
        for (const w of m.ord) w.classList.add('s');
      }
      x.i = x.m.length;
      hkEl.classList.add('klar');
    }

    // Hasse lutar sig in från baren, nere till vänster i fönstret: överkroppen ur kostymfotot
    // (rum/hasse-atlas.webp, samma som i baren), lutad FIG.lut grader kring nedre vänstra
    // hörnet. FIG är utsnittet i fotots pixlar, ansikte rutan från pannan och ner som
    // pratbubblan inte får täcka (håret får den) och mun punkten en bit till höger om munnen,
    // dit bubblans spets pekar.
    const FIG = { x0: 40, y0: 20, x1: 820, y1: 760, ansikte: [220, 150, 550, 470], mun: [560, 395], lut: 6 };
    function figur(over, Hn) {
      const H = Hn || (over ? Math.min(180, Math.max(110, innerHeight * 0.21)) : Math.min(innerHeight * (innerHeight < 760 ? 0.38 : 0.45), 400));
      const s = H / (FIG.y1 - FIG.y0);
      const W = (FIG.x1 - FIG.x0) * s;
      const fx = -W * 0.16;
      const fy = innerHeight - H + 6;
      const a = (FIG.lut * Math.PI) / 180;
      // en punkt i fotot på skärmen
      const pa = (px, py) => {
        const u = (px - FIG.x0) * s;
        const v = (py - FIG.y0) * s - H;
        return [fx + u * Math.cos(a) - v * Math.sin(a), fy + H + u * Math.sin(a) + v * Math.cos(a)];
      };
      const [l, t, rr] = FIG.ansikte;
      return { H, s, W, fx, fy, pa, topp: pa(l, t)[1], hoger: pa(rr, t)[0] };
    }

    // Svarets plats: bredvid lappen till vänster (h.kort) med överkanten vid lappens, eller
    // mitt över lappen när det inte får plats bredvid – då med raden under svaret i stället
    // för under lappen. Svaret är en pratbubbla som aldrig täcker hans ansikte: står den
    // ovanför honom slutar den ovanför hans hår, och ryms svaret inte rullar det. Bakom
    // mörknar det lite från vänster, som i baren, och över lappen helt.
    function hkPlats(h, top) {
      if (!A.hk) return;
      // under rummets namn när det syns (det ligger över tavlan)
      const namn = document.querySelector('.rum-brand');
      const min = innerWidth < 700 ? 72 : Math.max(24, namn && getComputedStyle(namn).visibility === 'visible' ? namn.getBoundingClientRect().bottom + 12 : 0);
      const over = h.kort == null;
      let F = figur(over);
      // I telefonen ska raden under bubblan få plats på en rad till höger om spetsen; allt i
      // figuren växer med dess höjd, så i ett smalt fönster blir han så mycket mindre som behövs.
      if (over) {
        const barn = [...rad.children].filter((e) => e.offsetWidth);
        const bredd = barn.reduce((sum, e) => sum + e.offsetWidth, 0) + 16 * (barn.length - 1);
        const plats = innerWidth - 16 - bredd - 10 - 28 - 4;
        if (F.hoger > plats) F = figur(over, F.H * Math.max(0.7, plats / F.hoger));
      }
      const w = hkEl.offsetWidth;
      const x = over ? (innerWidth - w) / 2 : h.kort;
      // bubblans underkant: ovanför håret när den står ovanför honom, och i telefonen också
      // plats för raden mellan dem
      const golv = over ? F.topp - 56 : x < F.hoger + 12 ? F.topp - 14 : innerHeight - 24;
      hkEl.style.maxHeight = `${r1(Math.max(160, golv - min))}px`;
      const H = hkEl.offsetHeight;
      const [mx, my] = F.pa(...FIG.mun);
      // (i en hög telefon står bubblan så nära honom att spetsen inte blir längre än ~170 px)
      const y = Math.max(min, over ? Math.min(golv - H, Math.max((min + golv - H) / 2, my - 170 - H)) : Math.min(top, golv - H));
      hkEl.style.left = `${r1(x)}px`;
      hkEl.style.top = `${r1(y)}px`;
      mork.classList.toggle('over', over);
      mork.style.width = over ? '' : `${r1(x + w + 40)}px`;
      figEl.style.cssText = `left:${r1(F.fx)}px; top:${r1(F.fy)}px; width:${r1(F.W)}px; height:${r1(F.H)}px; ` +
        `background-size:${r1(1372 * F.s)}px auto; background-position:${r1(-FIG.x0 * F.s)}px ${r1(-FIG.y0 * F.s)}px; transform:rotate(${FIG.lut}deg)`;
      // Spetsen går från bubblans kant mot munnen: från underkanten när munnen är lägre än
      // bubblan, annars från vänsterkanten. Foten ligger 2 px inne i bubblan, över ramen.
      const b = y + H;
      let f1;
      let f2;
      if (my > b - 30) {
        // till höger om ansiktet, så att den inte går över det
        const bx = Math.max(x + 26, Math.min(F.hoger + 4, x + w - 80));
        f1 = [bx, b - 2];
        f2 = [bx + 28, b - 2];
      } else {
        const by = Math.max(y + 24, Math.min(my - 40, b - 54));
        f1 = [x + 2, by];
        f2 = [x + 2, by + 30];
      }
      // raden under bubblan i telefonen står till höger om spetsen
      if (over) {
        rad.style.top = `${r1(y + H + 8)}px`;
        rad.style.transform = 'translateX(0px)';
        if (my > b - 30) {
          rad.style.paddingLeft = `${r1(f2[0] + 10)}px`;
          rad.style.columnGap = '16px';
        }
      }
      const p = (q) => `${r1(q[0])} ${r1(q[1])}`;
      svans.firstChild.setAttribute('d', `M${p(f1)} L${p([mx, my])} L${p(f2)} Z`);
      svans.lastChild.setAttribute('d', `M${p(f1)} L${p([mx, my])} L${p(f2)}`);
    }
    const hkStopp = () => {
      for (const a of A.hkAnim || []) a.cancel();
      A.hkAnim = null;
    };
    function hkUt(now) {
      if (window.RumBak) RumBak.bort('hasse-svar');
      tyst();
      hkStopp();
      ov.classList.remove('hasse');
      if (now || o.calm()) {
        for (const el of hkDelar) el.classList.remove('on');
        return;
      }
      const g = { duration: 220, easing: 'ease-in', fill: 'forwards' };
      const anims = (A.hkAnim = hkDelar.map((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], g)));
      anims[0].finished.then(() => {
        if (A.hkAnim !== anims) return;
        for (const el of hkDelar) el.classList.remove('on');
        hkStopp();
      }, () => {});
    }
    // Ropar till Hasse (on), eller tackar och går vidare. Lappen i handen flyttar sig åt
    // höger när svaret får plats bredvid den.
    function hasse(on) {
      if (!A.lyft || on === A.hk) return;
      const n = A.W.notes.find((x) => x.id === A.lyft.id);
      A.hk = on;
      ropText(n);
      if (!on) {
        placeLyft(n, 'flytta');
        hkUt();
        return;
      }
      hkStopp();
      if (window.RumBak) RumBak.fram('hasse-svar', () => hasse(false));
      svara(n);
      for (const el of hkDelar) el.classList.add('on');
      ov.classList.add('hasse');
      placeLyft(n, 'flytta');
      // han lutar sig in och bubblan tonar fram, spetsen sist
      if (!o.calm()) {
        A.hkAnim = [
          figEl.animate([{ opacity: 0, transform: `rotate(${FIG.lut + 12}deg)` }, { opacity: 1, transform: `rotate(${FIG.lut}deg)` }], { duration: 480, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }),
          hkEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 120, easing: 'ease-out', fill: 'backwards' }),
          svans.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 340, easing: 'ease-out', fill: 'backwards' }),
        ];
      }
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

    // Vecklar ut (ut) eller viker ihop bladen i handen, ett veck i taget
    // uppifrån (ihop nerifrån), alla blad i bunten samtidigt. Klart när
    // det sista vecket har vänts; utan rörelser direkt.
    function stopVik() {
      for (const x of A.vanims) x.cancel();
      A.vanims = [];
    }
    function vika(card, ut, anim, wait = 0) {
      stopVik();
      card.classList.toggle('utvikt', ut);
      const pans = [...card.querySelectorAll('.ans-pan.vik')];
      if (!anim || !pans.length) return 0;
      const k = Math.max(...pans.map((p) => +p.dataset.d));
      const IHOP = 'rotateX(-178deg)';
      const UT = 'rotateX(0deg)';
      for (const p of pans) {
        const d = +p.dataset.d;
        A.vanims.push(p.animate([{ transform: ut ? IHOP : UT }, { transform: ut ? UT : IHOP }], ut
          ? { duration: 460, delay: wait + (d - 1) * 300, easing: 'cubic-bezier(0.35, 0, 0.25, 1)', fill: 'backwards' }
          : { duration: 260, delay: wait + (k - d) * 170, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'backwards' }));
      }
      return ut ? wait + (k - 1) * 300 + 460 : wait + (k - 1) * 170 + 260;
    }

    function lift(id) {
      const n = A.W.notes.find((x) => x.id === id);
      if (!n || !A.inner) return;
      if (A.lyft) drop(true);
      if (A.matt !== A.html) measure();
      const len = A.len[id] || n.h;
      A.lyft = { id, vand: n.paper === 'polaroid', len, pan: 0 };
      if (window.RumBak) RumBak.fram('lappen', () => drop());
      if (!A.fotot) (A.fotot = new Image()).src = 'rum/hasse-atlas.webp';
      ov.classList.add('lyft');
      lyftEl.innerHTML = `<div class="ans-lapp i-handen" data-lapp="${id}" style="width:${n.w}px; height:${len}px; transform-origin:50% ${n.h / 2}px">${sheetsHtml(n, A.inner[id], A.sheets, A.top, len)}</div>`;
      stor.querySelector(`[data-lapp="${id}"]`).classList.add('borta');
      spoilerRow(n);
      ropText(n);
      const anim = placeLyft(n, !o.calm());
      // den vikta lappen vecklas ut när den nästan är framme
      vika(lyftEl.firstElementChild, true, Boolean(anim), 340);
      // polaroiden vänds på vägen fram
      if (n.paper === 'polaroid') {
        const me = A.lyft;
        if (anim) setTimeout(() => { if (A.lyft === me && me.vand) vand(true); }, 120);
        else vand(true);
      }
      rad.querySelector('[data-ans="tillbaka"]').focus({ preventScroll: true });
    }

    function drop(now) {
      if (!A.lyft) return;
      const n = A.W.notes.find((x) => x.id === A.lyft.id);
      A.lyft = null;
      if (window.RumBak) RumBak.bort('lappen');
      // Hasse tystnar när lappen sätts tillbaka
      if (A.hk) {
        A.hk = false;
        hkUt(now);
      }
      const card = lyftEl.firstElementChild;
      const back = () => {
        const el = stor.querySelector(`[data-lapp="${n.id}"]`);
        if (el) el.classList.remove('borta');
        if (!A.lyft) lyftEl.innerHTML = '';
      };
      ov.classList.remove('lyft');
      if (now || o.calm() || !card) { stopVik(); back(); return; }
      vand(false);
      // viks ihop på vägen tillbaka
      const ms = Math.max(380, vika(card, false, true) + 60);
      const r = stor.querySelector(`[data-lapp="${n.id}"]`).getBoundingClientRect();
      const to = `translate(${r1(r.left + r.width / 2 - n.w / 2)}px, ${r1(r.top + r.height / 2 - n.h / 2)}px) scale(${A.place.k.toFixed(3)}) rotate(${n.rot}deg)`;
      card.animate([{ transform: card.style.transform }, { transform: to }], { duration: ms, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }).finished.then(back, back);
      card.style.transform = to;
    }

    // Den långa lappen i handen flyttas med hjulet, fingret eller Page Up/Down
    // (pan, 0 … over).
    function panTo(px) {
      if (!A.lyft || !A.lyft.over) return false;
      const v = Math.max(0, Math.min(A.lyft.over, px));
      if (v === A.lyft.pan) return true;
      A.lyft.pan = v;
      placeLyft(A.W.notes.find((x) => x.id === A.lyft.id), false);
      return true;
    }
    ov.addEventListener('wheel', (e) => {
      if (!A.on || !A.lyft || !A.lyft.over || e.target.closest('#ans-hasse')) return;
      e.preventDefault();
      panTo(A.lyft.pan + (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY));
    }, { passive: false });
    const DR = { id: null };
    ov.addEventListener('pointerdown', (e) => {
      A.drog = false;
      // (ett svep på Hasses svar bläddrar inte bladen, drog)
      A.hkDrar = Boolean(e.target.closest('#ans-hasse'));
      if (!A.lyft || !A.lyft.over || !e.target.closest('.i-handen')) return;
      Object.assign(DR, { id: e.pointerId, y: e.clientY, pan: A.lyft.pan });
    });
    addEventListener('pointermove', (e) => {
      if (e.pointerId !== DR.id || !A.lyft) return;
      const dy = e.clientY - DR.y;
      if (!A.drog && Math.abs(dy) < 8) return;
      A.drog = true;
      panTo(DR.pan - dy);
    });
    addEventListener('pointerup', (e) => { if (e.pointerId === DR.id) DR.id = null; });
    addEventListener('pointercancel', (e) => { if (e.pointerId === DR.id) DR.id = null; });

    function step(d) {
      const i = A.W.notes.findIndex((x) => x.id === A.lyft.id);
      const n = A.W.notes[(i + d + A.W.notes.length) % A.W.notes.length];
      drop(true);
      lift(n.id);
    }

    ov.addEventListener('click', (e) => {
      // (en lapp som just flyttades med fingret)
      if (!A.on || A.drog) return;
      if (e.target.closest('a[href], .sp-show')) return;
      if (e.target.closest('[data-ans="tillbaka"]')) { drop(); return; }
      if (e.target.closest('[data-ans="hasse"]')) { hasse(!A.hk); return; }
      // ett klick på svaret: resten direkt
      if (e.target.closest('#ans-hasse')) { hoppaTal(); return; }
      // en flik bläddrar alla lappar till sin division
      const f = e.target.closest('[data-flik]');
      if (f && !vagg.contains(f)) { flip(f.dataset.flik); return; }
      if (A.lyft) {
        if (e.target.closest('.i-handen') && lyftEl.querySelector('.ans-vand')) vand((A.lyft.vand = !A.lyft.vand));
        else if (e.target.closest('.i-handen, .ans-rad')) return;
        else if (A.hk) hasse(false);
        else drop();
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
        loadMatches();
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
      // Hasse svarar om lappen i handen
      hasse: (on = true) => { if (A.on) hasse(on); },
      // lappen i handen flyttades nyss med fingret, eller fingret var på
      // på Hasses svar (inget svep i rum.js)
      drog: () => Boolean(A.drog || A.hkDrar),
      // Esc tystar Hasse och sätter tillbaka lappen (sedan tavlan i rum.js);
      // ←/→ bläddrar mellan lapparna och ↑/↓ mellan bladen, och H ropar till
      // Hasse
      key(k) {
        if (!A.on) return false;
        if (k === 'Escape' && A.lyft) {
          if (A.hk) hasse(false);
          else drop();
          return true;
        }
        if (A.lyft && /^h$/i.test(k)) { hasse(!A.hk); return true; }
        if (/^Arrow(Up|Down)$/.test(k)) { flipBy(k === 'ArrowDown' ? 1 : -1); return true; }
        if (A.lyft && k === 'ArrowRight') { step(1); return true; }
        if (A.lyft && k === 'ArrowLeft') { step(-1); return true; }
        if (A.lyft && /^(PageUp|PageDown|Home|End)$/.test(k)) {
          const v = { PageUp: A.lyft.pan - innerHeight * 0.7, PageDown: A.lyft.pan + innerHeight * 0.7, Home: 0, End: Infinity }[k];
          return panTo(v);
        }
        if (!A.lyft && /^Arrow/.test(k)) { lift(A.W.notes[0].id); return true; }
        return false;
      },
    };
  }

  return { wall, nara, mount };
})();
