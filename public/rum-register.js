'use strict';

// Registret i tobaksaffären (rum.js): en 90-talsdator på disken i hörnet under
// tv:n, i three.js (rum-dator.js), med en terminal som i spionfilmerna
// runt 2000 – grön text på svart, MATCHFIXARNA REGISTER. Datorn har det om
// lagen och spelarna som tv:n inte visar, och sedan 2026-11-11 också allt som
// stod på anslagstavlan, ordnat efter match, lag och spelare (tavlan togs bort
// 2026-11-14, och datorn flyttade till hennes plats).
//
// Överst står menyraden, som alltid står still:
//   KUPONGEN   omgångens matcher i avdelningar efter tävlingen (namnet en
//              gång, till vänster eller som rubrik), med avsparken på varje
//              rad; en match öppnar matchakten:
//              allt om matchen på ett ställe, lagen sida vid sida, i flikar
//              (sedan 2026-11-14): ÖVERSIKT (formen och dess motstånd – hur
//              bra de fem motståndarna var i snitt, 0–100 från lagets egen
//              divisions svagaste lag till dess starkaste, ur matchens fil –
//              styrkan, motståndet, favoritskapet och mot oddsen, med lagets
//              plats i sin division), MÅLEN (målen, hemma och borta, nollorna,
//              skytten och de främsta i assist och segermål), xG (chanserna,
//              turen och kryssen), LÄGET (vilan, nästa match, skadorna och
//              domaren) och MÖTENA. Det bättre talet i varje par lyser och
//              det sämre är svagt (SKILJER), och varje etikett öppnar en
//              förklaring
//   REGISTRET  lagen och spelarna (fliken hette LAGEN till 2026-11-13; i
//              koden heter den fortfarande lagen). Underraden säger vad och
//              var: LAG eller SPELARE, och divisionen. LAG är divisionens lag
//              (inget lag markeras för att det står i kupongen, sedan
//              2026-11-13); SPELARE är divisionens spelare från A
//              till Ö med plats, lag, speltid och mål. Ett lag öppnar
//              lagkortet och en spelare spelarkortet, med namnet och
//              flikarna stilla överst (sedan 2026-11-13; Tab byter):
//              laget ÖVERSIKT (nästa match, formen, styrkan), xG, SPELET,
//              ODDSEN och TRUPPEN (speltid, mål, de skadade); spelaren
//              ÖVERSIKT (läget, matcherna och hur laget har gått med och
//              utan honom i startelvan mot oddsen, mu i
//              data/players/<division>.json), ANFALL, MÅLEN och FÖRSVAR
//              (målvakten I MÅLET i stället för anfallet och målen).
//              Korten har talen i ett rutnät: etiketten, talet, en mätare och
//              platsen i divisionen (sedan 2026-11-14, se ETK nedan; inte
//              där mätaren inte säger något, se mat: false)
// Landslagen (sedan 2026-11-13): matchakten har för en landskamp gruppen
// (NL B4; kupongen inte sedan 2026-11-14), Nations League, alla
// landskamper sedan 2024 och marknadens chans i stället för tavlans tal (i
// samma flikar som klubbarnas), och registret en post för
// landslagen (NL) med grupperna och ett lagkort per landslag
// (data/landslag.json). Sökningen hittar dem på svenska och engelska.
// Sedan 2026-11-14 (användarens önskemål: "spelare och statistik som de
// andra ligorna") är Nations League en division som de andra i registret:
// LAG (grupperna) och SPELARE, lagkort med samma flikar som klubbarnas
// (översikten är landslagets: gruppen, formen, Nations League och alla
// landskamper), spelarkort och listor per tal, ur data/teams/unl.json och
// data/players/unl.json. En spelare som också spelar i en engelsk klubb har
// två kort, ett för klubben och ett för landslaget (#spelare:nl-<id>). Sedan
// 2026-11-14 (användarens önskemål: landet underordnat klubblaget) står han en
// gång i sökningen, som klubbens, och korten leder till varandra: klubbens
// kort har landet sist på raden under namnet, landslagets klubben.
// (Fram till 2026-11-13 stod tavlans tal också som topplistor över omgången i
// en egen flik, TOPPLISTOR; användaren ville ha dem bara vid matcherna.)
// Statistiks tal (sedan 2026-11-13, användarens önskemål: all statistik på
// sajten ska gå att se i datorn): lagkortet och spelarkortet har allt som
// Statistik och matchsidan visar om ett lag eller en spelare – utom tabellen
// och skytteligan, som står på tv:n – i avsnitt med platsen i divisionen
// efter, och etiketten leder till listan: divisionen ordnad efter talet
// (#lista:lag:pl:skapar), där ←/→ bläddrar till förra och nästa tal.
// Matchakten har också matchsidans rader (hemma och borta, nollorna, skotten
// på mål, målen mot xG, lagens främsta i assist och segermål) och domaren.
// Längst ner står sökraden (SÖK >). Den svarar medan man skriver: alla träffar
// (lag och spelare i alla divisionerna, omgångens möten, flikarna och
// divisionerna) står i utskriften, den mest sannolika överst och markerad och
// sedan i fallande led, och Enter öppnar den markerade. Raden överst väljer
// kategori (ALLA, LAG, SPELARE; Tab byter; MÖTEN och LISTOR togs bort
// 2026-11-13, mötena och delarna står bara under ALLA). Ett lag ger också
// dess spelare (aston villa → truppen under SPELARE). Felstavat går också
// (MENADE DU), laget kan stå med (saka arsenal), och smeknamnen (spurs, wolves)
// hittar lagen. En siffra och Enter väljer raden med det numret. Under den
// står tangenterna: Esc tillbaka (och stänger överst),
// ↑/↓ och Enter väljer en rad, ←/→ bläddrar till förra och nästa match,
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
// Dolda resultat (Spoiler): det som räknar med resultaten (formens motstånd,
// styrkan, kryssen, turen, oddsen, motståndet, lagkortens siffror, truppens speltid och mål och
// spelarkorten) visar ? när en match i
// lagens divisioner är dold – samma nyckel (ans:) som anslagstavlan hade – och formen och mötena har ? för de dolda matcherna.
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
  // så många rader skrivs en och en; resten av en lång lista kommer på en gång
  const SKRIV = 50;
  // duken på disken (scenens px), där datorn syns med sin skugga
  const BOX = { x: 1136, y: 426, w: 132, h: 112 };
  // terminalen: minst så här breda rader (telefonen), och så många rader ryms på höjden (dator)
  const BRED = 40;
  const RADER = 20;
  // ett tecken i VT323 är så brett (em), och så mycket luft har terminalen i
  // telefonen (em; som .rum-regn.tel i rum-register.css): sidorna, överst,
  // nederst och mellan raderna
  const TECKEN = 0.4;
  const LUFT_TEL = { sida: 0.6, topp: 0.7, fot: 0.6, rad: 1.25 };
  const FLIKAR = [['kupongen', 'KUPONGEN'], ['lagen', 'REGISTRET']];
  const SKADA = { skadad: '', avstängd: ' (AVST.)', 'ej uttagbar': '', tveksam: '?' };
  const SOK = 'SÖK > ';
  // Landskamperna (sedan 2026-11-13, när Stryktipset tog in Nations League):
  // tävlingarna (type 'intl' i config/competitions.js) och registrets post för
  // landslagen, nl, efter divisionerna. Datan står i data/landslag.json och i
  // matchens fil; tavlans tal och lagkortens finns bara för klubbarna.
  const LANDTAV = { unl: 'Nations League', emk: 'EM-kvalet', vsk: 'Vänskapslandskamp' };
  const isLand = (c) => Object.prototype.hasOwnProperty.call(LANDTAV, c);
  const REG = [...DIVS, 'nl'];
  const REGNAMN = { ...DIVNAME, nl: 'Nations League' };
  const REGK = { ...DIVK, nl: 'NL' };
  // registrets divisioner i filerna (teams/<fil>.json, players/<fil>.json)
  const FIL = { pl: 'pl', ch: 'ch', l1: 'l1', l2: 'l2', nl: 'unl' };
  // landslagen med för långa namn för kupongens elva tecken (resten av
  // rummets kortnamn, Papper.kort och tavlans, går före)
  const LANDKORT = { 'Bosnien & Hercegovina': 'Bosnien-H.', Nordmakedonien: 'Nordmaked.', Azerbajdzjan: 'Azerbajdz.', Liechtenstein: 'Liechtenst.', Nederländerna: 'Nederländ.' };

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
  const tavNamn = (c) => up(DIVNAME[c] || LANDTAV[c] || TAV[up(c)] || c || '');
  // kupongens beteckning för en landskamp: NL B4, EMK C2 eller VSK
  const landDiv = (m) => { const g = (/grupp\s+(\S+)/i.exec(m.round || '') || [])[1]; return m.comp === 'vsk' ? 'VSK' : `${m.comp === 'emk' ? 'EMK' : 'NL'}${g ? ` ${up(g)}` : ''}`; };

  // Tavlans tal ur lagfilerna (som Statistik → Lagen)
  const fdOf = (t, k) => (t && t.fd ? t.fd[k] : null);
  const TAL = {
    styrka: (t) => (t && t.str != null ? t.str : null),
    kryss: (t) => { const x = fdOf(t, 'xg'); return x && x.n ? x.xd / x.n : null; },
    tur: (t) => { const x = fdOf(t, 'xg'); return x ? x.pts - x.xp : null; },
    odds: (t) => { const x = fdOf(t, 'mkt'); return x ? x.pts - x.xp : null; },
    motstand: (t) => fdOf(t, 'opp'),
  };

  // Matchakten: det bättre talet i varje par lyser och det sämre är svagt, när
  // talen skiljer sig minst så här mycket (annars står båda som vanligt):
  // formens poäng på fem matcher, vilans dagar (i alla tävlingar), styrkan, poängen mot oddsen,
  // målskillnaden och xG-skillnaden per match och andelen matcher som favorit.
  // Kryssen, turen, motståndet, nästa match och skytten säger inte vem som är
  // bättre och står alltid som vanligt.
  // För landslagen (som inte har tavlans tal): poängen i gruppen (en seger),
  // poängen per match i Nations League och alla landskamper (V-O-F), målen
  // som för klubbarna och marknadens chans som favoritskapet.
  const SKILJER = { form: 2, vila: 2, styrka: 0.15, odds: 1.5, mal: 0.25, xg: 0.2, favorit: 0.15, poang: 3, ppm: 0.5 };
  // matchaktens etiketter (den längsta, INSL. MOT xG, är 12 tecken)
  const AKTEN_L = 13;

  // ---------- raderna ----------
  //
  // En rad är en lista av bitar [text, klass, fråga]: klass '' (grönt), d
  // (svagt), v (ljust) eller i (omvänt); fråga gör biten tryckbar. En rad med
  // .q är tryckbar i sin helhet, och [['', 'hr']] är ett streck. En rad med
  // .kl får klassen (ny: ett tunt streck ovanför, rub: en rubrik med streck
  // efter, rum-register.css) och .st en stil (bredden på strecket i ny).

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
      : `<div class="tr${r.q ? ' a' : ''}${r.kat ? ' kat' : ''}${r.kl ? ` ${r.kl}` : ''}"${r.q ? ` data-q="${esc(r.q)}"` : ''}${r.st ? ` style="${esc(r.st)}"` : ''}>${r.map(bit).join('')}</div>`)).join('');
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
      '<div class="reg-fot" id="reg-fot"></div><div class="reg-fk" id="reg-fk" hidden></div><div class="reg-lin"></div></div>' +
      '<div class="reg-rad" id="reg-rad"><span id="reg-sp"></span></div></div>';
  }

  // ---------- i rummet ----------

  function mount(root, o) {
    const A = { on: false, ms: [], all: [], byTeam: new Map(), match: new Map(), stats: null, byEspn: new Map(), land: null, landByEspn: new Map(), loaded: 0, L: null, P: null, vy: { flik: 'kupongen' }, kat: 'alla', bak: [], ut: '', lista: [], nr: 0, sk: 0, sel: -1, bred: BRED, R: null };
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
    const fkEl = root.querySelector('#reg-fk');
    if (!small || !ov || !term) return null;
    const mus = matchMedia('(hover: hover) and (pointer: fine)');

    // datorn i three.js (hämtas med rummet; utan WebGL står disken tom)
    // (i telefonen när det blir dess tur, o.tur i rum.js; den tonas in när den är ritad, rum-register.css)
    if (!o.calm()) duk.classList.add('tonas');
    A.Lp = (o.tur || ((f) => f()))(() => import('./rum-dator.js').then((m) => m.dator({ duk, nara: root.querySelector('#reg-3d'), calm: o.calm, box: BOX }))
      .then((L) => {
        A.L = L;
        A.skarm = '';
        draw();
        // (en fast bild, ?rum-t, sätts först efter att rummet har byggts: då står den bara där)
        if (o.calm()) duk.classList.remove('tonas');
        else requestAnimationFrame(() => duk.classList.add('klar'));
      }))
      .catch((err) => console.warn('Rummet: datorn kunde inte ritas', err));

    // lagfilerna (målen, xG, oddsen, styrkan) – om igen efter en kvart
    function loadTeams() {
      if (A.loading || Date.now() - A.loaded < 15 * 60000) return A.loading;
      A.loading = Promise.all([...REG.map((d) => getJSON(`data/teams/${FIL[d]}.json`).catch(() => null)), getJSON('data/landslag.json').catch(() => null)]).then((files) => {
        // landslagen: grupperna och lagen under det svenska namnet (name, som
        // klubbarnas), med Nations Leagues lagfil (siffrorna som divisionernas,
        // comp nl) för lagen i Nations League
        const L = files.pop();
        const U = files.pop();
        const ul = new Map(U && !U.unknown ? (U.teams || []).map((t) => [t.name, t]) : []);
        const land = (t) => { const u = ul.get(t.lag); return [t.lag, { ...(u || {}), ...t, name: t.lag, land: true, ...(u ? { comp: 'nl', espnId: String(u.espnId) } : {}) }]; };
        A.land = L && !L.unknown ? { grupper: L.grupper || [], lag: new Map((L.lag || []).map(land)) } : { grupper: [], lag: new Map() };
        A.landByEspn = new Map([...A.land.lag.values()].filter((t) => t.espnId).map((t) => [String(t.espnId), t]));
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
        // (Nations League också: landslagens spelare, div nl)
        A.Pp = Promise.all(REG.map((d) => getJSON(`data/players/${FIL[d]}.json`).catch(() => null))).then((files) => {
          // (th: gränserna för de dämpade siffrorna och pos: vem gör målen, per division)
          const P = { spelare: [], lag: new Map(), avail: new Map(), th: {}, pos: {} };
          files.forEach((f, i) => {
            if (!f || f.unknown) return;
            P.th[REG[i]] = f.thresholds || {};
            P.pos[REG[i]] = (f.goalsByPos || []).filter((x) => x.goals > 0);
            for (const t of f.teams || []) P.lag.set(String(t.espnId), t);
            for (const [id, a] of Object.entries(f.availability || {})) if (a && !a.unknown) P.avail.set(String(id), a.players || []);
            for (const p of f.players || []) P.spelare.push({ p, div: REG[i], n: norm(p.name), t: norm(p.name).split(' ') });
          });
          // samma spelare i en klubb och i ett landslag (samma ESPN-id)
          P.klubb = new Map();
          P.land = new Map();
          for (const x of P.spelare) (x.div === 'nl' ? P.land : P.klubb).set(String(x.p.id), x);
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

    // dolda resultat i lagens divisioner (nyckeln ans: är anslagstavlans, som den hade)
    function slojan() {
      const stats = A.stats || new Map();
      if (!(window.Spoiler && Spoiler.on())) return { veil: false };
      const comps = new Set();
      for (const m of A.ms) for (const n of [m.home, m.away]) { const t = stats.get(n); if (t) comps.add(t.comp); else if (isLand(m.comp)) comps.add(m.comp); }
      const recent = A.all.filter((m) => comps.has(m.comp) && Spoiler.hides(m.kickoff));
      const n = recent.filter(Spoiler.hidden).length;
      const key = `ans:${recent.map((m) => m.id).sort().join(',')}`;
      return { veil: n > 0 && !Spoiler.isShown(key), key, n };
    }
    const kort = (n) => { const k = o.kort(n); return up(k === n && LANDKORT[n] ? LANDKORT[n] : k); };
    const lagOf = (n) => (A.stats ? A.stats.get(n) : null) || null;
    const landOf = (n) => (A.land ? A.land.lag.get(n) : null) || null;
    // spelarens lag (klubben eller landslaget) efter ESPN-id
    const lagAvId = (id) => A.byEspn.get(String(id)) || A.landByEspn.get(String(id)) || null;
    // spelarkortets nyckel: landslagets kort har nl- före, så att den som också
    // spelar i en engelsk klubb har ett kort för var (#spelare:nl-<id>)
    const spId = (x) => (x.div === 'nl' ? `nl-${x.p.id}` : String(x.p.id));
    // samma spelare i det andra laget: landslaget för en klubbspelare och tvärtom
    const tvilling = (x) => (A.P && A.P.land ? (x.div === 'nl' ? A.P.klubb : A.P.land).get(String(x.p.id)) : null) || null;
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
    // Formens motstånd: snittet av motståndarnas styrka i lagets fem senaste,
    // 0–100 (opp.level i matchens fil). null tills filen har hämtats och när
    // fler än en av matcherna saknar styrka – då säger snittet för lite.
    function mottOf(m, side) {
      const d = A.match.get(m.id);
      const T = d && d.teams && d.teams[side];
      const f = T && T.form ? T.form.slice(0, 5) : [];
      const k = f.filter((y) => y.opp && y.opp.level != null);
      if (!k.length || k.length < f.length - 1) return null;
      return Math.min(99, Math.round((100 * k.reduce((t, y) => t + y.opp.level, 0)) / k.length));
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

    // Kupongen: omgångens matcher i kupongens ordning, i avdelningar efter
    // tävlingen (2026-11-14, användarens val bland fem skisser): tävlingens
    // namn står en gång – på datorn i en spalt till vänster med ett tunt
    // streck mellan avdelningarna, i telefonen (där spalten inte ryms) som en
    // rubrik med streck efter. Raden har numret, lagen och avsparken, på
    // varje rad; landskampernas grupp står bara i matchakten (2026-11-14,
    // användarens önskemål: den bröt symmetrin). Tävlingarna står i den
    // ordning de först kommer i kupongen och matcherna i kupongens ordning
    // inom dem, så att en omgång i avsparkens ordning (mellan omgångarna,
    // en kupong som valts för hand) inte delas i flera avdelningar med samma
    // tävling – numren hoppar då. Formen och dess motstånd står i matchakten
    // (2026-11-13, användarens önskemål: "mindre rörig").
    function kupongen(R) {
      if (!A.ms.length) return [rad('INGEN OMGÅNG')];
      const w = 11;
      const t0 = Math.max(...A.ms.map((m) => tid(m).length));
      const avd = [];
      for (const m of A.ms) {
        const a = avd.find((x) => x.comp === m.comp);
        if (a) a.ms.push(m);
        else avd.push({ comp: m.comp, ms: [m] });
      }
      const L = Math.max(...avd.map((a) => tavNamn(a.comp).length)) + 4;
      // numret och lagen är 28 tecken; tävlingen i en spalt när den ryms
      const spalt = L + 28 + 3 + t0 <= A.bred;
      const mellan = spalt ? '   ' : '  ';
      const r = [rad([omgDatum(), 'd']), tom()];
      avd.forEach((a, j) => {
        if (!spalt) r.push(Object.assign(rad([tavNamn(a.comp), 'd']), { kl: 'rub' }));
        a.ms.forEach((m, i) => {
          const nr = nrAv(m);
          R.nr[nr] = `#mote:${m.id}`;
          const x = radQ(`#mote:${m.id}`, ...(spalt ? [[pad(i ? '' : tavNamn(a.comp), L), 'd']] : []),
            [`${padL(nr, 2)} `, 'd'], padL(kort(m.home).slice(0, w), w), [' – ', 'd'], pad(kort(m.away).slice(0, w), w),
            [mellan, 'd'], [tid(m), 'd']);
          r.push(spalt && j && !i ? Object.assign(x, { kl: 'ny' }) : x);
        });
      });
      return r;
    }

    function moten(m) {
      const r = [rad(['DE SENASTE MÖTENA', 'd', ordQ('moten')])];
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
      // (för ett landslag: tävlingen när den inte är matchens)
      const egen = t ? up(t.comp) : isLand(m.comp) ? up(m.comp) : null;
      return `${nx.days} D${nx.comp && nx.comp !== egen ? ` ${up(TAV[nx.comp] || nx.comp)}` : ''}`;
    }
    // lagets bäste skytt (spelarfilen) och hans rad i registret
    function skytten(t) {
      const pt = t && A.P && A.P.lag.get(String(t.espnId));
      const ts = pt && pt.topScorer && pt.topScorer.g ? pt.topScorer : null;
      if (!ts) return null;
      return { ts, vem: A.P.spelare.find((x) => x.p.name === ts.name && String(x.p.teamId) === String(t.espnId)) };
    }

    // Matchakten: allt om matchen på ett ställe, lagen sida vid sida – i
    // flikar sedan 2026-11-14 (användarens önskemål: "underkategorier", allt
    // i en lång lista såg rörigt ut). Titeln, tävlingen och flikarna står
    // still överst (R.huvud) och lagens namn överst i varje flik:
    //   ÖVERSIKT  vem är bäst: formen och dess motstånd, styrkan, motståndet,
    //             favoritskapet och poängen mot oddsen (en landskamp: gruppen,
    //             poängen och marknadens chans i stället för styrkan)
    //   MÅLEN     målen per match, hemma och borta, nollorna och vem som gör
    //             målen (en landskamp: Nations League och alla landskamper)
    //   xG        chanserna: xG, skotten på mål, målen mot xG, turen och kryssen
    //   LÄGET     vilan, nästa match, matcherna de senaste dagarna, skadorna
    //             och domaren
    //   MÖTENA    de senaste mötena
    // Samma flikar för alla matcher, så att ←/→ stannar i fliken; en flik
    // utan något att visa är svag. Lagen leder till lagkorten och skyttarna
    // till spelarkorten. Efter tavlans tal står lagets plats i sin division
    // (det som topplistorna visade): 1:A är högst, lika tal delar plats. Det
    // bättre talet i varje par lyser och det sämre är svagt (SKILJER); talen
    // som räknas inom divisionen (styrkan, oddsen, målen, xG och
    // favoritskapet) jämförs bara när lagen spelar i samma, och inget lyser
    // när resultaten är dolda. Varje etikett öppnar en förklaring
    // (rum-register-ord.js): talen med en lista leder dit med Enter
    // (#lista:…), de andra har bara förklaringen (#ord:…).
    const AKTDELAR = [['oversikt', 'ÖVERSIKT'], ['malen', 'MÅLEN'], ['xg', 'xG'], ['laget', 'LÄGET'], ['moten', 'MÖTENA']];
    const ordQ = (k) => `#ord:${k}`;
    // tävlingen (för en landskamp med gruppen) och avsparken, på två rader när de inte ryms
    function underrad(m) {
      const t = `${tavNamn(m.comp)}${isLand(m.comp) && m.round ? ` · ${up(m.round)}` : ''}`;
      const a = avspark(m.kickoff);
      return 4 + t.length + 3 + a.length <= A.bred ? [rad([`    ${t} · ${a}`, 'd'])] : [rad([`    ${t}`, 'd']), rad([`    ${a}`, 'd'])];
    }
    // lagets främste i ett tal (assist, segermål …), som Spelarna i ligan på
    // matchsidan: vid lika den med färst matcher. { y, top } eller null
    function framst(t, f) {
      const l = t && t.espnId && A.P ? A.P.spelare.filter((y) => String(y.p.teamId) === String(t.espnId) && f(y.p) > 0) : [];
      if (!l.length) return null;
      const top = Math.max(...l.map((y) => f(y.p)));
      return { y: l.filter((z) => f(z.p) === top).sort((a, b) => (a.p.app || 0) - (b.p.app || 0) || a.p.name.localeCompare(b.p.name, 'sv'))[0], top };
    }
    // (tomma rader först, sist och två i rad bort – när ett avsnitt saknas)
    const tvatt = (r) => r.filter(Boolean).filter((x, k, a) => x.length || (k > 0 && k < a.length - 1 && a[k - 1].length));
    function akten(m, S, R, del) {
      const i = A.ms.indexOf(m);
      R.sido = i < 0 ? null : [i > 0 ? `#mote:${A.ms[i - 1].id}` : null, i < A.ms.length - 1 ? `#mote:${A.ms[i + 1].id}` : null];
      R.slojas = true;
      const land = isLand(m.comp);
      const L = AKTEN_L;
      const K = Math.min(20, Math.floor((A.bred - L) / 2));
      const lag = [m.home, m.away];
      const sid = ['home', 'away'];
      // (för en landskamp landslagen, med Nations Leagues siffror för lagen som spelar där)
      const T = lag.map(land ? landOf : lagOf);
      const d = A.match.get(m.id);
      const ok = (x) => x != null && Number.isFinite(x);
      // laget med det bättre talet (0 eller 1), eller -1 när de är lika eller okända
      const bast = (v, grans) => (v.every(ok) && Math.abs(v[0] - v[1]) >= grans - 1e-9 ? (v[0] > v[1] ? 0 : 1) : -1);
      // (talen som räknas inom divisionen: bara när lagen spelar i samma och resultaten syns;
      // landslagen jämförs som förut, utan den regeln)
      const samma = Boolean(T[0] && T[1] && T[0].comp && T[0].comp === T[1].comp) && !S.veil;
      const inom = (f, grans) => (samma ? bast(T.map(f), grans) : -1);
      const jmf = (v, grans) => (land || samma ? bast(v, grans) : -1);
      // en rad: etiketten och lagens värden; b är laget med det bättre talet,
      // som lyser medan det andra är svagt, och efter står svagt efter värdet
      // (platsen i divisionen); q är etikettens förklaring
      const raden = (etikett, v, b = -1, efter = null, q = null) => rad([etikett, 'd', q], [pad('', L - etikett.length)],
        ...v.flatMap((x, j) => {
          const p = Array.isArray(x) ? x : [x, ''];
          const bit = b < 0 ? p : [p[0], j === b ? 'v' : 'd', p[2]];
          const bitar = efter && efter[j] ? [bit, [efter[j], 'd']] : [bit];
          const n = bitar.reduce((s, y) => s + y[0].length, 0);
          return j ? bitar : [...bitar, [pad('', Math.max(1, K - n))]];
        }));
      // etiketten: talets lista i det första lagets division (lag eller
      // spelare), annars bara förklaringen
      const div0 = (T.find((t) => t && t.comp) || {}).comp;
      const lq = (k, slag = 'lag') => (div0 ? listQ(slag, div0, k) : ordQ(slag === 'spelare' ? `spelare:${k}` : k));
      // tavlans tal med lagets plats i sin division efter: '+0,94   1:A' (för
      // landslagen utan platsen, och raden bara när något av lagen har talet)
      const tal = (etikett, f, fmt, grans, k) => {
        const v0 = T.map((t) => (t ? f(t) : null));
        if (land && !v0.some(ok)) return null;
        const v = v0.map((x) => (S.veil ? null : x));
        return raden(etikett, v.map((x) => (S.veil ? '?' : ok(x) ? fmt(x) : '–')), grans ? inom(f, grans) : -1,
          v.map((x, j) => {
            if (!ok(x) || land) return '';
            const p = placering(T[j], f);
            return p ? `${pad('', Math.max(0, 6 - fmt(x).length))}${padL(ordtal(p), 4)}` : '';
          }), lq(k));
      };
      // en rad ur lagens värden f(j) = [text, tal att jämföra] (eller null);
      // för landslagen bara när något av lagen har ett värde
      const par = (etikett, f, grans, q) => {
        const v = [0, 1].map(f);
        if (!v.some((x) => x && x[0] != null)) return land ? null : raden(etikett, ['–', '–'], -1, null, q);
        if (S.veil) return raden(etikett, ['?', '?'], -1, null, q);
        return raden(etikett, v.map((x) => (x && x[0] != null ? x[0] : '–')), grans ? jmf(v.map((x) => (x ? x[1] : null)), grans) : -1, null, q);
      };
      // matchsidans rader (Lagen sida vid sida i app.js) ur matchens fil
      const fil = (etikett) => { for (const g of (d && d.rows) || []) for (const x of g.rows || []) if (x.label === etikett) return x.values; return null; };
      const ur = (etikett, rubrik, q) => {
        const v = fil(etikett);
        return v && v.some((x) => x != null) ? raden(rubrik, v.map((x) => (S.veil ? '?' : x == null ? '–' : up(x))), -1, null, q) : null;
      };
      // ett avsnitts rubrik med ett streck efter, lika långt som raderna
      const rub = (namn) => { const w = Math.min(A.bred, L + 2 * K) - 1; return rad([namn, 'd'], ...(w > namn.length + 2 ? [[' ', ''], [' '.repeat(w - namn.length - 1), 'ln']] : [])); };
      // lagets främste i ett tal, med namnet som länk till spelarkortet
      const ledare = (etikett, f, k) => raden(etikett, T.map((t) => {
        if (S.veil) return '?';
        const x = framst(t, f);
        return x ? [`${sistaNamn(x.y.p.name).slice(0, K - 3 - String(x.top).length)} ${x.top}`, '', `#spelare:${spId(x.y)}`] : A.P ? '–' : '…';
      }), -1, null, lq(k, 'spelare'));
      const ledareLand = (etikett, f, k) => par(etikett, (j) => {
        const x = framst(T[j], f);
        return x ? [[`${sistaNamn(x.y.p.name).slice(0, K - 3 - String(x.top).length)} ${x.top}`, '', `#spelare:${spId(x.y)}`], null] : null;
      }, 0, k);

      // ÖVERSIKT. Formen: poängen på fem matcher (inte när någon av dem är
      // dold). Efter den står formens motstånd – det säger inte vem som är
      // bättre och står som vanligt
      const form = sid.map((s) => formOf(m, s));
      const formP = form.map((f) => (f.length && f.every((c) => c && 'VOF'.includes(c)) ? (5 * f.reduce((p, c) => p + (c === 'V' ? 3 : c === 'O' ? 1 : 0), 0)) / f.length : null));
      const formB = bast(formP, SKILJER.form);
      const mott = sid.map((s) => { const t = S.veil ? '?' : mottOf(m, s); return t == null ? '' : ` ${t}`; });
      const formRad = rad(['FORMEN', 'd', lq('form')], [pad('', L - 6)], ...form.flatMap((f, j) => {
        const txt = f.join('') || '–';
        const bitar = [[txt, formB < 0 ? '' : j === formB ? 'v' : 'd'], [mott[j], '']];
        return j ? bitar : [...bitar, [pad('', Math.max(1, K - txt.length - mott[j].length))]];
      }));
      const mkt0 = (j) => { const x = mkt(T[j]); return x && x.n ? [`${x.fav} AV ${x.n}`, x.fav / x.n] : null; };
      const favorit = par('FAVORIT', mkt0, SKILJER.favorit, lq('favorit'));
      const odds = tal('MOT ODDSEN', TAL.odds, (v) => signed(v), SKILJER.odds, 'odds');
      let oversikt;
      if (!land) {
        oversikt = [formRad, tal('STYRKA', TAL.styrka, (v) => signed(v, 2), SKILJER.styrka, 'styrka'),
          tal('MOTSTÅNDET', TAL.motstand, (v) => signed(v, 2), 0, 'motstand'), favorit, odds];
      } else {
        // gruppen (matchens fil, annars landslag.json): placeringen och
        // poängen, som jämförs bara i samma grupp; marknadens chans (f.p i
        // matchlistan, mk: marknaden) med krysset under
        const D = sid.map((s) => (d && d.teams && d.teams[s]) || null);
        const tab = (j) => (D[j] && D[j].table) || (T[j] && T[j].tabell && { ...T[j].tabell, size: T[j].tabell.av, group: T[j].grupp }) || null;
        const sammaGrupp = tab(0) && tab(1) && tab(0).group && tab(0).group === tab(1).group;
        const g0 = [0, 1].map(tab).find((t) => t && t.group);
        oversikt = [formRad,
          par(g0 && sammaGrupp ? `GRUPP ${up(g0.group)}` : 'GRUPPEN', (j) => { const t = tab(j); return t && t.rank ? [`${ordtal(t.rank)}${t.size ? ` AV ${t.size}` : ''}`, null] : null; }, 0, ordQ('grupp')),
          par('POÄNG', (j) => { const t = tab(j); return t && t.points != null ? [`${t.points} PÅ ${t.played}`, sammaGrupp ? t.points : null] : null; }, SKILJER.poang, ordQ('poang')),
          favorit, odds];
        const p = m.f && m.f.p;
        if (p && p.length === 3) {
          const x = `X ${p[1]} % · UR ODDSEN`;
          oversikt.push(raden('MARKNADEN', [`${p[0]} %`, `${p[2]} %`], bast([p[0] / 100, p[2] / 100], SKILJER.favorit), null, ordQ('marknaden')),
            rad([pad('', L)], [A.bred - L >= x.length + 15 ? `${x}, INTE MODELLEN` : x, 'd']));
        }
      }

      // MÅLEN: för klubbarna ligan (matchens fil: hemma och borta, nollorna)
      // och lagens främsta; för landslagen Nations League hittills (matchens
      // fil, annars landslag.json) och alla landskamper sedan hösten 2024
      let malen;
      if (!land) {
        // (gula kort där målens sort saknas)
        const segrar = !A.P || T.some((t) => t && A.P.spelare.some((y) => String(y.p.teamId) === String(t.espnId) && y.p.gw != null));
        malen = [
          par('MÅL', (j) => { const t = T[j]; return t && t.m ? [`${num(t.gf / t.m)}–${num(t.ga / t.m)}`, (t.gf - t.ga) / t.m] : null; }, SKILJER.mal, lq('gjorda')),
          ur('Hemma V–O–F', 'HEMMA', ordQ('hemma')),
          ur('Borta V–O–F', 'BORTA', ordQ('borta')),
          ur('Hållit nollan', 'NOLLOR', lq('nollor')),
          ur('Inte gjort mål', 'UTAN MÅL', ordQ('utanmal')),
          tom(),
          raden('SKYTTEN', T.map((t) => {
            if (S.veil) return '?';
            const s = skytten(t);
            if (!s) return A.P ? '–' : '…';
            return [`${sistaNamn(s.ts.name).slice(0, K - 3 - String(s.ts.g).length)} ${s.ts.g}`, '', s.vem ? `#spelare:${spId(s.vem)}` : null];
          }), -1, null, lq('skytten')),
          ledare('ASSIST', (p) => p.a, 'assist'),
          segrar ? ledare('SEGERMÅL', (p) => p.gw, 'segermal') : ledare('GULA KORT', (p) => p.yc, 'gula'),
        ];
      } else {
        const nl = (j) => { const a = d && d.teams && d.teams[sid[j]] && d.teams[sid[j]].record && d.teams[sid[j]].record.all; if (a) return a; const x = T[j] && T[j].nationsLeague; return x ? { n: x.matcher, w: x.v, d: x.o, l: x.f, gf: x.gjorda, ga: x.inslappta } : null; };
        const alla = (j) => { const x = T[j] && T[j].alla; return x && x.matcher ? { n: x.matcher, w: x.v, d: x.o, l: x.f, gf: x.gjorda, ga: x.inslappta, fran: x.fran } : null; };
        const vof = (x) => (x && x.n ? [`${x.w}-${x.d}-${x.l}`, (3 * x.w + x.d) / x.n] : null);
        const mal = (x) => (x && x.n ? [`${num(x.gf / x.n)}–${num(x.ga / x.n)}`, (x.gf - x.ga) / x.n] : null);
        const nollor = (j, k) => { const x = T[j] && T[j][k]; return x && x.matcher && x.nollor != null ? [String(x.nollor), null] : null; };
        const nlR = [
          par('V-O-F', (j) => vof(nl(j)), SKILJER.ppm, ordQ('nl-vof')),
          par('MÅL', (j) => mal(nl(j)), SKILJER.mal, ordQ('nl-mal')),
          par('NOLLOR', (j) => nollor(j, 'nationsLeague'), 0, ordQ('nl-nollor')),
          ledareLand('SKYTTEN', (p) => p.g, lq('skytten')),
          ledareLand('ASSIST', (p) => p.a, lq('assist', 'spelare')),
        ].filter(Boolean);
        // (antalet landskamper står i förklaringen: det är V-O-F tillsammans)
        const allaR = [
          par('V-O-F', (j) => vof(alla(j)), SKILJER.ppm, ordQ('alla-vof')),
          par('MÅL', (j) => mal(alla(j)), SKILJER.mal, ordQ('alla-mal')),
          par('NOLLOR', (j) => nollor(j, 'alla'), 0, ordQ('alla-nollor')),
        ].filter(Boolean);
        const fran = [0, 1].map((j) => alla(j) && alla(j).fran).filter(Boolean).sort()[0];
        const [y, mn] = fran ? fran.split('-').map(Number) : [];
        malen = [
          ...(nlR.length ? [rub('NATIONS LEAGUE'), ...nlR] : []),
          ...(allaR.length ? [tom(), rub(`ALLA LANDSKAMPER${fran ? ` SEDAN ${up(MAN[mn - 1])} ${y}` : ''}`), ...allaR] : []),
        ];
      }

      // xG: chanserna per match, skotten på mål, målen mot chanserna, turen
      // och kryssen (klubbarna: skotten och målen mot xG ur matchens fil;
      // landslagen ur Nations Leagues lagfil)
      const xgp = (j) => { const x = xgOf(T[j]); return x && x.n ? x : null; };
      const xg = [
        par('xG', (j) => { const x = xgp(j); return x ? [`${num(x.f / x.n)}–${num(x.a / x.n)}`, (x.f - x.a) / x.n] : null; }, SKILJER.xg, lq('skapar')),
        land ? par('PÅ MÅL', (j) => { const x = fdOf(T[j], 'sh'); return x && x.n && x.of != null ? [`${num(x.of / x.n)}–${num(x.oa / x.n)}`, null] : null; }, 0, lq('pamal'))
          : ur('Skott på mål', 'PÅ MÅL', lq('pamal')),
        land ? par('MÅL MOT xG', (j) => { const x = xgp(j); return x ? [signed(x.gf - x.f), null] : null; }, 0, lq('malxg'))
          : ur('Gjorda mål mot xG', 'MÅL MOT xG', lq('malxg')),
        land ? par('INSL. MOT xG', (j) => { const x = xgp(j); return x ? [signed(x.ga - x.a), null] : null; }, 0, lq('inslxg'))
          : ur('Insläppta mål mot xG', 'INSL. MOT xG', lq('inslxg')),
        tal('TUR', TAL.tur, (v) => signed(v), 0, 'tur'),
        tal('KRYSSAR', TAL.kryss, pct, 0, 'kryss'),
      ];

      // LÄGET: vilan, nästa match och matcherna de senaste veckorna
      // (matchsidans Schemat, med Europacuperna), skadorna och domaren
      const vila = sid.map((s) => vilaOf(m, s));
      const sch = sid.map((s) => (d && d.teams && d.teams[s] && d.teams[s].schedule) || null);
      const dgr = (sch[0] || sch[1] || {}).windowDays;
      const laget = [
        raden('VILAN', vila.map((x) => (x == null ? '–' : `${x} D`)), bast(vila, SKILJER.vila), null, ordQ('vila')),
        raden('NÄSTA', sid.map((s) => nastaOf(m, s)), -1, null, ordQ('nasta')),
        dgr && sch.some((x) => x && x.recent != null) ? raden(`MATCHER ${dgr} D`, sch.map((x) => (x && x.recent != null ? `${x.recent}${x.recentEurope ? ` (${x.recentEurope} EUROPA)` : ''}` : '–')), -1, null, ordQ('matcher')) : null,
      ];
      const sk = sid.map((s) => skadorOf(m, s));
      if (sk.some(Boolean)) {
        laget.push(tom(), rad(['SKADORNA', 'd', ordQ('skador')]));
        sk.forEach((l, j) => laget.push(rad([`${kort(lag[j])}: `, 'd'], l ? skadeNamn(l) : 'OKÄNT')));
      }
      // domaren (football-data.co.uk) som på matchsidan: hans eller hennes
      // ligamatcher före matchdagen, med divisionens snitt efter
      const dom = d && d.referee && !d.referee.unknown && d.referee.name ? d.referee : null;
      if (dom) {
        const s = dom.stats || {};
        const a = dom.avg || {};
        const fig = (etikett, k, v, w) => rad([etikett, 'd', ordQ(k)], [pad('', L - etikett.length)], pad(v, 8), [w != null ? `SNITT ${w}` : '', 'd']);
        laget.push(tom(), rad(['DOMAREN', 'd', ordQ('domaren')], [pad('', L - 7)], up(dom.name), [s.n ? `  ${s.n} LIGAMATCHER` : '', 'd']));
        if (s.n) {
          if (s.yellow != null) laget.push(fig('GULA KORT', 'dom-gula', num(s.yellow, 1), a.yellow != null ? num(a.yellow, 1) : null));
          if (s.fouls != null) laget.push(fig('FRISPARKAR', 'dom-frisparkar', num(s.fouls, 1), a.fouls != null ? num(a.fouls, 1) : null));
          if (s.home != null) laget.push(fig('HEMMASEGER', 'dom-hemmaseger', pct(s.home), a.home != null ? pct(a.home) : null));
          if (dom.min && s.n < dom.min) laget.push(rad([pad('', L)], ['FÖR FÅ MATCHER', 'd']));
        }
      }

      const flikar = { oversikt, malen, xg, laget, moten: moten(m) };
      const rader = (id) => tvatt(flikar[id] || []);
      // (en flik med något att visa)
      const har = (id) => rader(id).length > 0;
      const val = har(del) ? del : 'oversikt';
      R.delar = AKTDELAR.map(([id]) => id).filter(har);
      R.del = val;
      R.huvud = [rad([`${padL(i + 1, 2)}  `, 'd'], [`${kort(m.home)} – ${kort(m.away)}`, 'v']), ...underrad(m), delRad(AKTDELAR, val, har), streck()];
      if (val === 'moten') return rader('moten');
      // lagen överst i fliken (leder till lagkorten), med divisionen när den skiljer
      const kol = [rad([pad('', L)], ...lag.flatMap((n, j) => [[kort(n).slice(0, K - 1), '', `#lag:${n}`], [j ? '' : pad('', K - Math.min(kort(n).length, K - 1)), '']]))];
      if (!land && T[0] && T[1] && T[0].comp !== T[1].comp) kol.push(rad([pad('', L)], [pad(DIVK[T[0].comp], K), 'd'], [DIVK[T[1].comp], 'd']));
      return [...kol, ...rader(val)];
    }

    // ---------- platsen i divisionen ----------

    // Lagets plats i sin division efter ett av tavlans tal, högst först, som
    // topplistorna visade (lika tal delar plats, som i en skytteliga); null
    // när laget eller talet är okänt
    function placering(t, f) {
      const v = t ? f(t) : null;
      if (v == null || !Number.isFinite(v)) return null;
      return 1 + lagIDiv(t.comp).filter((x) => { const y = f(x); return y != null && Number.isFinite(y) && y > v + 1e-9; }).length;
    }
    // 1:A, 2:A, 3:E … 11:E, 12:E … 21:A
    const ordtal = (n) => `${n}:${(n % 10 === 1 || n % 10 === 2) && n % 100 !== 11 && n % 100 !== 12 ? 'A' : 'E'}`;

    // ---------- Statistiks tal: i korten och som listor ----------
    //
    // Sedan 2026-11-13 (användarens önskemål: "all statistik som finns på
    // hemsidan men som inte finns i datorn ska kunna visualiseras där") har
    // datorn allt som Statistik (divisioner.js) och matchsidan (app.js) visar
    // om ett lag eller en spelare, utom tabellen och skytteligan, som står på
    // tv:n. Samma tal under samma namn och i samma ordning som kolumnerna på
    // Statistik (TCOLS och PCOLS): lagkortet och spelarkortet har dem i
    // avsnitt med platsen i divisionen efter (för spelarna bara bland de 20
    // främsta, som Statistiks topplistor), och etiketten leder till listan –
    // divisionen ordnad efter talet, som en sorterad kolumn på Statistik. I
    // listan bläddrar ←/→ till förra och nästa tal, och divisionerna står
    // överst som i registret.
    //
    // Ett tal: k (i #lista:lag:pl:k), del (avsnittet i kortet), e (etiketten),
    // n (listans rubrik), g (talet), f (som text), asc (lägst först, som på
    // Statistik), ok (säkert nog för en plats, som Statistiks dämpade
    // siffror), noll (nollor och minus räknas i listan; annars bara de över
    // noll, som topplistorna), ute och mv (bara utespelarna eller
    // målvakterna) och visa (raden står bara när den säger något).
    const TOPP = 20;
    // etiketternas bredd i korten (den längsta är 14) och talens i listorna
    const ETK = 15;
    const VAR = 11;
    // Korten (sedan 2026-11-14, användarens val B Mätarna bland fyra skisser,
    // efter "snyggare/mer överblickbar"): etiketten, talet högerställt (13
    // tecken på datorn, så att formens resultat står rakt under talen; 10 i
    // telefonen), en mätare och platsen. Mätaren har ett streck per lag i
    // divisionen, fyllt från vänster med laget och alla bakom det – den 1:a
    // har hela, den 14:e av 20 har sju – så att man ser var laget ligger utan
    // att läsa platsen. Spelarna har ett streck per plats bland de 20
    // främsta (som platsen; utanför dem är mätaren tom). När strecken inte
    // ryms (telefonen) eller blir för många (Nations League, högst MAT_MAX)
    // fylls en kortare mätare i proportion.
    // Tal där mätaren inte säger något står utan den och utan platsen (mat:
    // false, sedan 2026-11-14, användarens önskemål): speltiden (alla som
    // har spelat allt delar första platsen), tal som redan säger andelen
    // (5 AV 8) eller är ett namn, sällsynta mål och kort (i Premier League
    // delar 43 spelare platsen på ett segermål), korten och regelbrotten
    // (säger inget om 1X2), målvaktens räddningar och skotten mot honom
    // (många är varken bra eller dåligt), lagets väntade och tagna poäng
    // (delar av MOT ODDSEN, som har mätaren) och spelarnas mål (som GJORDA).
    // Avsnitten har en rubrik med ett streck efter, lika långt som raderna.
    const smal = () => A.bred < 56;
    const kortVar = () => (smal() ? 10 : 13);
    const matMellan = () => (smal() ? 1 : 2);
    // platsen efter mätaren (14:E) och mätarens längsta (som League One och Two)
    const PLATS = 4;
    const MAT_MAX = 24;
    // mätarens längd för n lag (eller platser) och radens hela bredd
    const matLang = (n) => Math.max(4, Math.min(n, MAT_MAX, A.bred - ETK - kortVar() - matMellan() - 2 - PLATS));
    const kortBredd = (n) => ETK + kortVar() + matMellan() + matLang(n) + 1 + PLATS;
    // mätaren: plats bland k (med talet) i en mätare för n
    function matare(plats, k, n) {
      const m = matLang(n);
      const f = !plats || !k ? 0 : m === k ? k - plats + 1 : Math.max(1, Math.round((m * (k - plats + 1)) / k));
      return [[' '.repeat(f), 'mt1'], [' '.repeat(m - f), 'mt0']];
    }
    const fin = (v) => v != null && Number.isFinite(v);
    const perN = (o, k) => (o && o.n ? o[k] / o.n : null);
    const tal1 = (x) => num(x, 1);
    const tal2 = (x) => num(x, 2);
    const tecken = (d) => (x) => signed(x, d);
    const tecknadPct = (x) => (Math.round(x * 100) === 0 ? '±0 %' : `${x > 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)} %`);
    // lagets fem senaste i ligan och de engelska cuperna (data/matches.json,
    // som på Statistik), senaste först: V, O, F eller ? när resultatet är dolt
    const formLag = (n) => (A.byTeam.get(n) || []).filter((x) => x.completed).slice(0, 5)
      .map((x) => ({ m: x, l: (window.Spoiler && Spoiler.hidden(x) ? '?' : letter(x, n)) || '?' }));
    const formPoang = (f) => { const k = f.filter((x) => x.l && 'VOF'.includes(x.l)); return k.length ? k.reduce((s, x) => s + (x.l === 'V' ? 3 : x.l === 'O' ? 1 : 0), 0) : null; };
    // laget i spelarfilen (målen, den bäste målskytten)
    const sqLag = (t) => (t && A.P ? A.P.lag.get(String(t.espnId)) : null) || null;
    const mkt = (t) => fdOf(t, 'mkt');
    const xgOf = (t) => fdOf(t, 'xg');
    const LAGTAL = [
      { k: 'form', del: '', e: 'FORMEN', n: 'FORMEN: POÄNG PÅ FEM MATCHER', g: (t) => formPoang(formLag(t.name)),
        f: (v, t) => `${formLag(t.name).map((x) => x.l).join('')} ${v} P` },
      { k: 'gjorda', del: 'MÅLEN PER MATCH', e: 'GJORDA', n: 'GJORDA MÅL PER MATCH', g: (t) => (t.m ? t.gf / t.m : null), f: tal2 },
      { k: 'inslappta', del: 'MÅLEN PER MATCH', e: 'INSLÄPPTA', n: 'INSLÄPPTA MÅL PER MATCH', g: (t) => (t.m ? t.ga / t.m : null), f: tal2, asc: true },
      { k: 'nollor', del: 'MÅLEN PER MATCH', e: 'NOLLOR', n: 'HÅLLNA NOLLOR, ANDEL MATCHER', g: (t) => (fdOf(t, 'n') && fdOf(t, 'cs') != null ? fdOf(t, 'cs') / fdOf(t, 'n') : null), f: pct },
      { k: 'skapar', del: 'xG PER MATCH', e: 'SKAPAR', n: 'SKAPADE CHANSER, xG PER MATCH', g: (t) => perN(xgOf(t), 'f'), f: tal2 },
      { k: 'slapper', del: 'xG PER MATCH', e: 'SLÄPPER TILL', n: 'MOTSTÅNDARNAS xG PER MATCH', g: (t) => perN(xgOf(t), 'a'), f: tal2, asc: true },
      { k: 'xgdiff', del: 'xG PER MATCH', e: 'SKILLNAD', n: 'xG-SKILLNAD PER MATCH', g: (t) => { const x = xgOf(t); return x && x.n ? (x.f - x.a) / x.n : null; }, f: tecken(2) },
      { k: 'malxg', del: 'MOT CHANSERNA', e: 'GJORDA MÅL', n: 'GJORDA MÅL MOT xG', g: (t) => { const x = xgOf(t); return x ? x.gf - x.f : null; }, f: tecken(1) },
      { k: 'inslxg', del: 'MOT CHANSERNA', e: 'INSLÄPPTA MÅL', n: 'INSLÄPPTA MÅL MOT xG', g: (t) => { const x = xgOf(t); return x ? x.ga - x.a : null; }, f: tecken(1), asc: true },
      { k: 'tur', del: 'MOT CHANSERNA', e: 'TUR', n: 'TUR: POÄNG MOT CHANSERNA', g: TAL.tur, f: tecken(1) },
      { k: 'kryss', del: 'MOT CHANSERNA', e: 'KRYSSAR', n: 'KRYSSAR: KRYSS ENLIGT CHANSERNA', g: TAL.kryss, f: pct },
      { k: 'styrka', del: 'MODELLEN', e: 'STYRKA', n: 'STYRKA ENLIGT MODELLEN', g: TAL.styrka, f: tecken(2) },
      { k: 'motstand', del: 'MODELLEN', e: 'MOTSTÅNDET', n: 'MOTSTÅNDET HITTILLS', g: TAL.motstand, f: tecken(2) },
      { k: 'skott', del: 'SPELET PER MATCH', e: 'SKOTT', n: 'SKOTT PER MATCH', g: (t) => perN(fdOf(t, 'sh'), 'f'), f: tal1 },
      { k: 'skottmot', del: 'SPELET PER MATCH', e: 'SKOTT MOT', n: 'MOTSTÅNDARNAS SKOTT PER MATCH', g: (t) => perN(fdOf(t, 'sh'), 'a'), f: tal1, asc: true },
      { k: 'pamal', del: 'SPELET PER MATCH', e: 'PÅ MÅL', n: 'SKOTT PÅ MÅL PER MATCH', g: (t) => perN(fdOf(t, 'sh'), 'of'), f: tal1 },
      { k: 'gula', del: 'SPELET PER MATCH', mat: false, e: 'GULA KORT', n: 'GULA KORT PER MATCH', g: (t) => perN(fdOf(t, 'cards'), 'y'), f: tal2 },
      { k: 'favorit', del: 'ODDSEN', mat: false, e: 'FAVORIT', n: 'FAVORIT ENLIGT ODDSEN', g: (t) => { const x = mkt(t); return x && x.n ? x.fav / x.n : null; }, f: (v, t) => `${mkt(t).fav} AV ${mkt(t).n}` },
      { k: 'vantat', del: 'ODDSEN', mat: false, e: 'VÄNTAT', n: 'VÄNTADE POÄNG ENLIGT ODDSEN', g: (t) => { const x = mkt(t); return x && x.n ? x.xp : null; }, f: (v) => `${num(v, 1)} P` },
      { k: 'tog', del: 'ODDSEN', mat: false, e: 'TOG', n: 'TAGNA POÄNG I SAMMA MATCHER', g: (t) => { const x = mkt(t); return x && x.n ? x.pts : null; }, f: (v) => `${v} P` },
      { k: 'odds', del: 'ODDSEN', e: 'MOT ODDSEN', n: 'POÄNG MOT ODDSEN', g: TAL.odds, f: tecken(1) },
      { k: 'seger', del: 'ODDSEN', e: 'SPEL PÅ SEGER', n: 'SPEL PÅ SEGER: VINST PÅ INSATSEN', g: (t) => { const x = mkt(t); return x && x.n ? (x.ret - x.n) / x.n : null; }, f: tecknadPct },
      { k: 'malspelare', del: 'TRUPPEN', mat: false, e: 'MÅL', n: 'MÅL AV LAGETS SPELARE', g: (t) => { const s = sqLag(t); return s ? s.goals : null; }, f: String },
      { k: 'skytten', del: 'TRUPPEN', mat: false, e: 'SKYTTEN', n: 'BÄSTE MÅLSKYTTEN', g: (t) => { const s = sqLag(t); return s && s.topScorer && s.topScorer.g ? s.topScorer.g : null; },
        f: (v, t, w = VAR) => `${sistaNamn(sqLag(t).topScorer.name).slice(0, w - 1 - String(v).length)} ${v}` },
      { k: 'beroende', del: 'TRUPPEN', e: 'BEROENDE', n: 'BEROENDE AV BÄSTE MÅLSKYTTEN', g: (t) => { const s = sqLag(t); return s && s.topScorer && s.topScorer.g ? s.topScorerShare : null; }, f: pct },
    ];

    // Spelarnas tal (x är spelarens rad i registret, med divisionen):
    // gränserna för de dämpade siffrorna ur spelarfilen (thresholds)
    const grans = (x, k, d) => { const t = A.P && A.P.th[x.div]; return t && t[k] != null ? t[k] : d; };
    const per90 = (v, min) => (v == null || !min ? null : (v / min) * 90);
    // speltiden för ESPN:s siffror: i Premier League ur matchrapporterna (emin)
    const espnMin = (p) => (p.emin !== undefined ? p.emin : p.min);
    const helt = (p, x) => p.min >= grans(x, 'minMinutesP90', 270);
    const heltE = (p, x) => espnMin(p) >= grans(x, 'minMinutesP90', 270);
    // mål och assist per 90: FPL:s egna i Premier League (samma matcher som minuterna)
    const mal90 = (p) => (p.fg !== undefined ? p.fg : p.g);
    const lagetsMal = (p) => { const t = A.P && A.P.lag.get(String(p.teamId)); return t ? t.goals : null; };
    const MV = (p, v) => (p.pos === 'MV' ? v : null);
    const SPTAL = [
      { k: 'matcher', del: 'MATCHERNA', mat: false, e: 'MATCHER', n: 'LIGAMATCHER', g: (p) => p.app, f: String },
      { k: 'start', del: 'MATCHERNA', mat: false, e: 'FRÅN START', n: 'MATCHER FRÅN START', g: (p) => p.starts,
        f: (v, p) => { const t = A.P && A.P.lag.get(String(p.teamId)); const av = t && t.coverage ? t.coverage.covered : null; return av ? `${v} AV ${av}` : String(v); } },
      { k: 'inhopp', del: 'MATCHERNA', mat: false, e: 'INHOPP', n: 'INHOPP', g: (p) => (p.app != null && p.starts != null ? p.app - p.starts : null), f: String },
      { k: 'speltid', del: 'MATCHERNA', mat: false, e: 'SPELTID', n: 'SPELTID', g: (p) => p.min, f: (v) => `${v} MIN` },
      { k: 'permatch', del: 'MATCHERNA', mat: false, e: 'PER MATCH', n: 'SPELTID PER MATCH', g: (p) => (p.min != null && p.app ? p.min / p.app : null), f: (v) => `${Math.round(v)} MIN` },
      { k: 'betyg', del: 'MATCHERNA', e: 'BETYG', n: 'SNITTBETYG', g: (p) => p.rt, f: tal1,
        ok: (p, x) => p.rn >= grans(x, 'minRated', 3) && p.rq >= grans(x, 'minShareRated', 0.5) },
      { k: 'bast', del: 'MATCHERNA', e: 'BÄST PÅ PLAN', n: 'BÄST PÅ PLAN', g: (p) => (p.rt != null ? p.rb : null), f: String },
      { k: 'mal', del: 'ANFALL', ute: true, e: 'MÅL', n: 'MÅL', g: (p) => p.g, f: String },
      { k: 'assist', del: 'ANFALL', ute: true, e: 'ASSIST', n: 'ASSIST', g: (p) => p.a, f: String },
      { k: 'inblandad', del: 'MÅLEN', ute: true, e: 'INBLANDAD', n: 'INBLANDAD I LAGETS MÅL', g: (p) => { const m = lagetsMal(p); return p.noStats || !m ? null : ((p.g || 0) + (p.a || 0)) / m; }, f: pct, ok: (p) => lagetsMal(p) >= 5 },
      { k: 'andel', del: 'MÅLEN', ute: true, e: 'AV LAGETS MÅL', n: 'ANDEL AV LAGETS MÅL', g: (p) => { const m = lagetsMal(p); return p.noStats || !m || p.g == null ? null : p.g / m; }, f: pct, ok: (p) => lagetsMal(p) >= 5 },
      { k: 'skott', del: 'ANFALL', ute: true, e: 'SKOTT', n: 'SKOTT', g: (p) => p.sh, f: String },
      { k: 'pamal', del: 'ANFALL', ute: true, e: 'PÅ MÅL', n: 'SKOTT PÅ MÅL', g: (p) => p.sot, f: String },
      { k: 'malskott', del: 'ANFALL', ute: true, e: 'MÅL/SKOTT', n: 'MÅL PER SKOTT', g: (p) => (p.sh ? p.g / p.sh : null), f: pct, ok: (p, x) => p.sh >= grans(x, 'minShotsConversion', 10) },
      { k: 'malmatch', del: 'ANFALL', ute: true, e: 'MÅL/MATCH', n: 'MÅL PER MATCH', g: (p) => (p.min == null && p.app ? p.g / p.app : null), f: tal2 },
      { k: 'mal90', del: 'ANFALL', ute: true, e: 'MÅL/90', n: 'MÅL PER 90 MINUTER', g: (p) => per90(mal90(p), p.min), f: tal2, ok: helt },
      { k: 'xg', del: 'ANFALL', ute: true, e: 'xG', n: 'FÖRVÄNTADE MÅL (xG)', g: (p) => p.xg, f: tal1 },
      { k: 'malmotxg', del: 'ANFALL', ute: true, e: 'MÅL MOT xG', n: 'MÅL MOT xG', g: (p) => (p.xg != null && p.fg != null ? p.fg - p.xg : null), f: tecken(1), noll: true },
      { k: 'xa', del: 'ANFALL', ute: true, e: 'xA', n: 'FÖRVÄNTADE ASSIST (xA)', g: (p) => p.xa, f: tal1 },
      { k: 'xg90', del: 'ANFALL', ute: true, e: 'xG/90', n: 'xG PER 90 MINUTER', g: (p) => per90(p.xg, p.min), f: tal2, ok: helt },
      { k: 'ma90', del: 'ANFALL', ute: true, e: 'MÅL+ASSIST/90', n: 'MÅL OCH ASSIST PER 90 MINUTER', g: (p) => (mal90(p) == null ? null : per90(mal90(p) + ((p.fg !== undefined ? p.fa : p.a) || 0), p.min)), f: tal2, ok: helt },
      { k: 'segermal', del: 'MÅLEN', mat: false, ute: true, e: 'SEGERMÅL', n: 'SEGERMÅL', g: (p) => p.gw, f: String, visa: (p) => p.g > 0 },
      { k: 'poangmal', del: 'MÅLEN', ute: true, e: 'POÄNG ÅT LAGET', n: 'POÄNG SOM MÅLEN GAV LAGET', g: (p) => p.gpts, f: String, visa: (p) => p.g > 0 },
      { k: 'forsta', del: 'MÅLEN', mat: false, ute: true, e: 'FÖRSTA MÅLET', n: 'MATCHENS FÖRSTA MÅL', g: (p) => p.g1, f: String, visa: (p) => p.g > 0 },
      { k: 'sena', del: 'MÅLEN', mat: false, ute: true, e: 'SENA MÅL', n: 'SENA MÅL, FRÅN 80:E MINUTEN', g: (p) => p.glate, f: String, visa: (p) => p.g > 0 },
      { k: 'straffar', del: 'MÅLEN', mat: false, ute: true, e: 'STRAFFAR', n: 'STRAFFMÅL', g: (p) => p.gpen, f: (v, p) => `${v} AV ${v + (p.pmiss || 0)}`, visa: (p) => (p.gpen || 0) + (p.pmiss || 0) > 0 },
      { k: 'inhoppmal', del: 'MÅLEN', mat: false, ute: true, e: 'SOM INHOPPARE', n: 'MÅL SOM INHOPPARE', g: (p) => p.gsub, f: String, visa: (p) => p.gsub > 0 },
      { k: 'raddningar', del: 'I MÅLET', mat: false, mv: true, e: 'RÄDDNINGAR', n: 'RÄDDNINGAR', g: (p) => MV(p, p.sv), f: String },
      { k: 'raddade', del: 'I MÅLET', mv: true, e: 'RÄDDADE', n: 'RÄDDADE AV SKOTTEN PÅ MÅL', g: (p) => MV(p, p.savePct), f: pct, ok: (p) => (p.sv || 0) + (p.gc || 0) >= 10 },
      { k: 'motskott', del: 'I MÅLET', mat: false, mv: true, e: 'SKOTT PÅ MÅL', n: 'SKOTT PÅ MÅL MOT MÅLVAKTEN', g: (p) => (p.pos === 'MV' && p.sv != null && p.gc != null ? p.sv + p.gc : null), f: String },
      { k: 'inslappta', del: 'I MÅLET', mv: true, e: 'INSLÄPPTA', n: 'INSLÄPPTA MÅL', g: (p) => MV(p, p.gc), f: String, asc: true, noll: true,
        ok: (p) => (p.sv || 0) + (p.gc || 0) >= 10 },
      { k: 'inslmatch', del: 'I MÅLET', mv: true, e: 'INSL./MATCH', n: 'INSLÄPPTA MÅL PER MATCH', g: (p) => (p.pos === 'MV' && p.gc != null && p.app ? p.gc / p.app : null), f: tal1, asc: true, noll: true,
        ok: (p) => (p.sv || 0) + (p.gc || 0) >= 10 },
      { k: 'tacklingar', del: 'FÖRSVAR', e: 'TACKLINGAR', n: 'TACKLINGAR', g: (p) => p.tk, f: String },
      { k: 'rensningar', del: 'FÖRSVAR', e: 'RENSNINGAR', n: 'RENSNINGAR, TÄCKNINGAR, BRYTNINGAR', g: (p) => p.cbi, f: String },
      { k: 'bollvinster', del: 'FÖRSVAR', e: 'BOLLVINSTER', n: 'BOLLVINSTER', g: (p) => p.rec, f: String },
      { k: 'insatser90', del: 'FÖRSVAR', e: 'INSATSER/90', n: 'FÖRSVARSINSATSER PER 90 MINUTER', g: (p) => (p.tk == null || p.cbi == null ? null : per90(p.tk + p.cbi, p.min)), f: tal1, ok: helt },
      { k: 'nollor', del: 'FÖRSVAR', e: 'NOLLOR', n: 'HÅLLNA NOLLOR', g: (p) => p.cs, f: String },
      { k: 'sjalvmal', del: 'FÖRSVAR', mat: false, e: 'SJÄLVMÅL', n: 'SJÄLVMÅL', g: (p) => p.og, f: String, visa: (p) => p.og > 0 },
      { k: 'falld', del: 'REGELBROTT', mat: false, e: 'FÄLLD', n: 'FÄLLD', g: (p) => p.fs, f: String },
      { k: 'falld90', del: 'REGELBROTT', mat: false, e: 'FÄLLD/90', n: 'FÄLLD PER 90 MINUTER', g: (p) => per90(p.fs, espnMin(p)), f: tal1, ok: heltE },
      { k: 'faller', del: 'REGELBROTT', mat: false, e: 'FÄLLER', n: 'BEGÅNGNA REGELBROTT', g: (p) => p.fc, f: String },
      { k: 'faller90', del: 'REGELBROTT', mat: false, e: 'FÄLLER/90', n: 'BEGÅNGNA REGELBROTT PER 90 MIN', g: (p) => per90(p.fc, espnMin(p)), f: tal1, ok: heltE },
      { k: 'gula', del: 'REGELBROTT', mat: false, e: 'GULA KORT', n: 'GULA KORT', g: (p) => p.yc, f: String },
      { k: 'roda', del: 'REGELBROTT', mat: false, e: 'RÖDA KORT', n: 'RÖDA KORT', g: (p) => p.rc, f: String, visa: (p) => p.rc > 0 },
    ];
    // Kortens flikar (sedan 2026-11-13, användarens önskemål: "rimliga
    // underkategorier" i stället för allt i ett kort). Samma grupper som
    // Statistik (T_GROUPS och P_GROUPS i divisioner.js), utom tabellen, som
    // står på tv:n, och så att varje flik ryms på datorns skärm: lagets
    // översikt (omgångens och nästa match, formen och modellens styrka och
    // motstånd), xG (chanserna), spelet (målen, skotten och korten per
    // match), oddsen och truppen; för spelaren översikten (läget, matcherna
    // och laget med och utan honom), anfallet, målen (vad målen betyder för
    // laget), målet (målvakterna) och försvaret med regelbrotten.
    // Avsnitten i talen (del) hör till flikarna så här:
    const LAGDELAR = [['oversikt', 'ÖVERSIKT'], ['xg', 'xG'], ['spelet', 'SPELET'], ['oddsen', 'ODDSEN'], ['truppen', 'TRUPPEN']];
    const LAGFLIK = { '': 'oversikt', 'MÅLEN PER MATCH': 'spelet', 'xG PER MATCH': 'xg', 'MOT CHANSERNA': 'xg', MODELLEN: 'oversikt', 'SPELET PER MATCH': 'spelet', ODDSEN: 'oddsen', TRUPPEN: 'truppen' };
    const SPDELAR = [['oversikt', 'ÖVERSIKT'], ['anfall', 'ANFALL'], ['malen', 'MÅLEN'], ['malet', 'I MÅLET'], ['forsvar', 'FÖRSVAR']];
    const SPFLIK = { MATCHERNA: 'oversikt', ANFALL: 'anfall', MÅLEN: 'malen', 'I MÅLET': 'malet', FÖRSVAR: 'forsvar', REGELBROTT: 'forsvar' };
    // (utespelarna har inget mål att stå i, målvakterna inget anfall)
    const spDelar = (p) => SPDELAR.filter(([id]) => (p.pos === 'MV' ? id !== 'anfall' && id !== 'malen' : id !== 'malet'));
    // fliken för ett tal (när man kommer till kortet från talets lista)
    const flikFor = (slag, k) => {
      if (slag === 'spelare') { const d = SPTAL.find((y) => y.k === k); return (d && SPFLIK[d.del]) || 'oversikt'; }
      const d = LAGTAL.find((y) => y.k === k);
      return (d && LAGFLIK[d.del]) || 'oversikt';
    };
    // ---------- förklaringarna ----------
    //
    // Ett tryck på ett tals etikett i lagkortet, spelarkortet eller
    // matchakten öppnar en ruta över talen (sedan 2026-11-14, användarens val
    // bland fyra skisser): vad talet är och hur det räknas, och ett exempel
    // med lagets eller spelarens egna siffror (orden i rum-register-ord.js;
    // enkla tal har bara en kort mening, sedan samma dag).
    // Rutan lägger sig över raderna ovanför etiketten (under den när de inte
    // räcker), med titeln i ramen, och täcker hela rader så att inga halva
    // rader syns. Esc stänger, ↑/↓ bläddrar till förra och nästa tal och
    // Enter (eller HELA LISTAN i telefonen) går till talets lista, dit
    // etiketten ledde förut. Med dolda resultat står bara orden.
    const ORD = () => window.RumRegisterOrd || null;
    // talet bakom en etikett, om det har en förklaring: ett tal med en lista
    // (#lista:lag:pl:tur; lista) eller en rad i matchakten med bara
    // förklaringen (#ord:vila; slag akt)
    function fkTal(q) {
      const s = String(q || '');
      const O = ORD();
      if (!O) return null;
      if (s.startsWith('#ord:')) return { q: s, slag: 'akt', k: s.slice(5), lista: false };
      const [typ, slag, , k] = s.slice(1).split(':');
      return typ === 'lista' && O[slag] && (O[slag][k] || A.vy.mote) ? { q: s, slag, k, lista: true } : null;
    }
    const fkSaker = () => valbara().filter((el) => fkTal(el.dataset.q));
    // h till exemplen (rum-register-ord.js)
    // (namnen i löpande text: Papper.kort, inte tavlans förkortningar som
    // Huddersfld – och hela namnet där Papper.kort förkortar med apostrof
    // eller en bokstav, som Nott'm Forest och Sheffield W; motståndarna i
    // matchakten med hela namnet, så att Oxford City inte blir Oxford; &
    // blir och i landslagens namn, Bosnien och Hercegovina, men inte i
    // klubbarnas, AFC Rushden & Diamonds)
    const heltNamn = (n) => { const s = String(n || ''); return landOf(s) ? s.replace(' & ', ' och ') : s; };
    const prosa = (n) => { const k = (window.Papper && Papper.kort && Papper.kort(n)) || n; return heltNamn(/'|\s[A-ZÅÄÖ]$/.test(k) ? n : k); };
    const hLag = (t) => ({ t, namn: prosa(t.name), div: DIVNAME[t.comp] });
    const hSpelare = (x) => ({ p: x.p, namn: x.p.name, lag: prosa(x.p.team), lagM: lagetsMal(x.p) });
    // h till matchaktens exempel: laget i matchen (j: 0 hemma, 1 borta) med
    // kortets siffror (hLag), formen med motståndarnas styrka (0–100) och det
    // matchsidans rader visar. (De enkla talen har inga exempel sedan
    // 2026-11-14, bara de som räknas på ett sätt som inte syns direkt.)
    const TAVORD = { FAC: 'FA-cupen', EFL: 'Ligacupen', LC: 'Ligacupen', CL: 'Champions League', UCL: 'Champions League', EL: 'Europa League', UEL: 'Europa League', ECL: 'Conference League', UECL: 'Conference League', UNL: 'Nations League', EMK: 'EM-kvalet', VSK: 'en vänskapslandskamp', PL: 'Premier League', CH: 'Championship', L1: 'League One', L2: 'League Two' };
    function hAkt(m, j) {
      const side = j ? 'away' : 'home';
      const land = isLand(m.comp);
      const t = land ? landOf(m[side]) : lagOf(m[side]);
      const d = A.match.get(m.id);
      const T = (d && d.teams && d.teams[side]) || null;
      // tävlingen på svenska, utom när det är lagets egen (ligan, eller landskampens)
      const egen = up(land ? m.comp : (t && t.comp) || '');
      const tav = (c) => (!c || up(c) === egen ? null : TAVORD[up(c)] || null);
      return {
        ...(t ? hLag(t) : {}), t, namn: prosa(m[side]),
        form5: T && T.form ? T.form.slice(0, 5).map((x) => ({ mot: heltNamn(x.opponent), tav: tav(x.comp), niva: x.opp && x.opp.level != null ? Math.round(100 * x.opp.level) : null })) : null,
        mott: mottOf(m, side),
        // det matchsidans rad visar för laget ('5,5–4,2')
        visar: (etikett) => { for (const g of (d && d.rows) || []) for (const x of g.rows || []) if (x.label === etikett) return x.values[j]; return null; },
      };
    }
    // h till ett exempel om hela matchen: lagen, marknadens chans och domaren
    const hMatch = (m) => {
      const d = A.match.get(m.id);
      const dom = d && d.referee && !d.referee.unknown && d.referee.name ? d.referee : null;
      return { m, hem: hAkt(m, 0), bort: hAkt(m, 1), p: m.f && m.f.mk && m.f.p && m.f.p.length === 3 ? m.f.p : null, dom };
    };
    function fkInnehall(f) {
      const O = ORD();
      const vy = A.vy;
      const m = vy.mote ? A.ms.find((x) => x.id === vy.mote) : null;
      // i matchakten först matchaktens egna ord (för en landskamp landslagens),
      // annars kortets
      const nyckel = f.slag === 'spelare' ? `spelare:${f.k}` : f.k;
      const akt = m ? ((isLand(m.comp) && O.land && O.land[nyckel]) || (O.akten && O.akten[nyckel]) || null) : null;
      const ord = f.slag !== 'akt' && O[f.slag] ? O[f.slag][f.k] || null : null;
      const def = f.slag === 'akt' ? null : (f.slag === 'spelare' ? SPTAL : LAGTAL).find((d) => d.k === f.k) || null;
      if (!akt && !(ord && def)) return null;
      let e = (akt && akt.e) || (def && def.e) || f.etk || '';
      let n = (akt && akt.n) || (def && def.n) || '';
      if (n.startsWith(`${e}: `)) n = n.slice(e.length + 2);
      // (INSLÄPPTA MÅL MOT xG: hela namnet i ramen i stället för etiketten två gånger)
      else if (n.startsWith(`${e} `)) { e = n; n = ''; }
      if (n === e) n = '';
      const exf = akt && 'ex' in akt ? akt.ex : ord ? ord.ex : null;
      const S = A.R && A.R.veil;
      const ex = [];
      const pr = (fn, h) => { try { const v = fn(h); if (v) ex.push(v); } catch (err) { /* ett exempel som inte går att räkna står inte */ } };
      const hm = m ? hMatch(m) : null;
      if (!(S && S.veil)) {
        if (m) {
          // i matchakten ett exempel om matchen (exm) eller ett per lag
          if (akt && akt.exm) pr(akt.exm, hm);
          else if (exf) { pr(exf, hm.hem); pr(exf, hm.bort); }
        } else if (exf && vy.spelare) {
          const x = A.P && A.P.spelare.find((y) => spId(y) === vy.spelare);
          if (x) pr(exf, hSpelare(x));
        } else if (exf && vy.lag) {
          const t = lagOf(vy.lag);
          if (t) pr(exf, hLag(t));
        }
      }
      // (orden kan bero på matchen: sedan när domaren räknas)
      const t = (akt && akt.t) || (ord && ord.t) || '';
      return { e, n, t: typeof t === 'function' ? t(hm || {}) : t, ex };
    }
    // Tangenterna längst ner medan rutan står framme (tryckbara)
    function fkFot() {
      const l = fkSaker();
      const i = l.findIndex((el) => el.dataset.q === A.fk.q);
      const k = mus.matches;
      const b = [
        [k ? 'ESC STÄNG' : '◄ STÄNG', '#fk:0'],
        [k ? '↑ FÖRRA TALET' : '▲ FÖRRA', i > 0 ? '#fk:-1' : null, i <= 0],
        [k ? 'NÄSTA TALET ↓' : 'NÄSTA ▼', i >= 0 && i < l.length - 1 ? '#fk:1' : null, i < 0 || i >= l.length - 1],
      ];
      if (k && A.fk.lista) b.push(['↵ HELA LISTAN', `#ga:${A.fk.q}`]);
      return b.map(([t, q, av]) => `<span${q ? ` class="a" data-q="${esc(q)}"` : av ? ' class="av"' : ''}>${esc(t)}</span>`).join('');
    }
    function fkRita() {
      const f = A.fk;
      const I = f && fkInnehall(f);
      if (!I) { fkStang(); return; }
      // undertiteln i ramen när den ryms där, annars överst i rutan
      const iRamen = I.n && I.e.length + I.n.length + 8 <= A.bred;
      fkEl.innerHTML = `<span class="fk-titel">${esc(I.e)}</span>${iRamen ? `<span class="fk-under d" style="left:${I.e.length + 3}ch">${esc(I.n)}</span>` : ''}` +
        `<div class="fk-in">${I.n && !iRamen ? `<div class="d">${esc(I.n)}</div>` : ''}<div class="fk-txt">${esc(I.t)}</div>` +
        I.ex.map((x) => `<div class="fk-txt fk-ex">${esc(x)}</div>`).join('') +
        (mus.matches || !f.lista ? '' : `<div class="fk-ga"><span class="a" data-q="${esc(`#ga:${f.q}`)}">HELA LISTAN ►</span></div>`) + '</div>';
      fot.innerHTML = fkFot();
      fkPlats();
    }
    // Rutan över raderna ovanför etiketten, annars under; räcker inte raderna
    // i kortet får den gå upp över kortets huvud (namnet och flikarna, inte
    // menyraden). Räcker inte det heller (telefonen) börjar den under
    // menyraden och täcker också raden den förklarar, och är den ändå för
    // lång rullar den
    function fkPlats() {
      if (!A.fk) return;
      const el = fkSaker().find((x) => x.dataset.q === A.fk.q);
      const rad = el ? el.closest('.tr') || el : null;
      const T = term.getBoundingClientRect();
      const U = rull.getBoundingClientRect();
      const rr = rad ? rad.getBoundingClientRect() : { top: U.top, bottom: U.top, height: 0 };
      const h = rr.height || parseFloat(getComputedStyle(term).fontSize) * 1.12;
      fkEl.hidden = false;
      Object.assign(fkEl.style, { left: `${U.left - T.left}px`, width: `${U.width}px`, height: '', top: '0px' });
      fkEl.classList.remove('rull');
      const O = 0.62 * h;
      const G = 0.12 * h;
      fkEl.style.setProperty('--fk-o', `${O}px`);
      let n = Math.ceil((fkEl.getBoundingClientRect().height + O + G) / h);
      // raderna ovanför (i kortet och med huvudet) och under
      const hr = topp.querySelector('.tr.hr');
      const ovanKort = Math.floor((rr.top - U.top + 1) / h);
      const ovan = Math.max(ovanKort, Math.floor((rr.top - (hr ? hr.getBoundingClientRect().bottom : U.top) + 1) / h));
      const under = Math.floor((U.bottom - rr.bottom + 1) / h);
      let top;
      if (n <= ovanKort || (n > under && n <= ovan)) top = rr.top - n * h + O;
      else if (n <= under) top = rr.bottom + O;
      else {
        top = rr.top - ovan * h + O;
        if (n > ovan + 1 + under) { n = ovan + 1 + under; fkEl.classList.add('rull'); }
      }
      Object.assign(fkEl.style, { top: `${top - T.top}px`, height: `${n * h - O - G}px` });
    }
    // Kort och matchakter med förklaringar: klubbarnas kort (orden talar om
    // ligan; landslagens etiketter leder till listorna som förut) och alla
    // matchakter (landskamperna med landslagens ord, sedan 2026-11-14)
    function fkHar() {
      const vy = A.vy;
      if (vy.mote) return A.ms.some((x) => x.id === vy.mote);
      if (vy.lag) return Boolean(lagOf(vy.lag));
      if (vy.spelare) return !String(vy.spelare).startsWith('nl-');
      return false;
    }
    // öppnar rutan för talet bakom etiketten q (false: talet har ingen förklaring)
    function fkOppna(q) {
      const f = fkTal(q);
      if (!f || !fkHar()) return false;
      const l = valbara();
      const i = l.findIndex((el) => el.dataset.q === q);
      // (rutans titel när orden inte har någon: etiketten, som GRUPP B4)
      f.etk = i >= 0 ? l[i].textContent.trim() : '';
      A.fk = f;
      if (i >= 0) valj(i);
      fkRita();
      return Boolean(A.fk);
    }
    function fkStang() {
      if (!A.fk && fkEl.hidden) return;
      A.fk = null;
      fkEl.hidden = true;
      fkEl.innerHTML = '';
      if (A.R) fot.innerHTML = fotHtml(A.R);
    }
    // förra eller nästa tal i vyn, med rutan framme
    function fkFlytta(d) {
      if (!A.fk) return;
      const l = fkSaker();
      const i = l.findIndex((el) => el.dataset.q === A.fk.q);
      const n = l[i + d];
      if (i >= 0 && n) fkOppna(n.dataset.q);
    }

    // Flikraden under namnet (i det som står still överst, så att den inte
    // flyttar sig när man rullar eller byter flik): den valda omvänd, en
    // flik utan något att visa svag och inte tryckbar. Tre mellanslag
    // emellan som i menyraden, två när raden annars inte ryms (telefonen).
    function delRad(delar, val, har) {
      const n = delar.reduce((s, [, namn]) => s + namn.length, 0);
      const mellan = n + 3 * (delar.length - 1) <= A.bred ? '   ' : '  ';
      return rad(...delar.flatMap(([id, namn], j) => [[namn, id === val ? 'i' : har(id) ? '' : 'd', id === val || !har(id) ? null : `#del:${id}`], [j < delar.length - 1 ? mellan : '', '']]));
    }
    // Avsnittets rubrik i en flik, med en tom rad före (inte överst) – utom
    // när rubriken säger samma sak som fliken (ODDSEN under ODDSEN): då
    // fortsätter raderna utan rubrik. Ett streck efter rubriken, så långt som
    // raderna (w), skiljer avsnitten åt.
    const rubrik = (r, del, utan, w) => {
      if (del === utan) return;
      if (r.length) r.push(tom());
      r.push(rad([del, 'd'], ...(w > del.length + 2 ? [[' ', ''], [' '.repeat(w - del.length - 1), 'ln']] : [])));
    };
    // Kortets huvud: namnet och raden under (divisionen, eller laget och
    // positionen) – på en rad på datorn när den ryms, så att flikarna under
    // får plats på skärmen; sedan flikarna och ett streck
    function huvud(namn, under, flikar) {
      const n = [...namn, ...under].reduce((s, [t]) => s + t.length, 3);
      return [...(A.bred >= 60 && n <= A.bred ? [rad(...namn, ['   ', ''], ...under)] : [rad(...namn), rad(...under)]), flikar, streck()];
    }
    const listQ = (slag, d, k) => `#lista:${slag}:${d}:${k}`;
    // platsen bland talen (lika tal delar plats; asc = lägst först)
    const platsAv = (v, alla, asc) => 1 + alla.filter((y) => (asc ? y < v - 1e-9 : y > v + 1e-9)).length;
    // Divisionens lag med talet, i listans ordning
    function lagLista(def, d) {
      const l = lagIDiv(d).map((t) => ({ t, v: def.g(t) })).filter((y) => fin(y.v));
      return l.sort((a, b) => (def.asc ? a.v - b.v : b.v - a.v) || (a.t.rank || 0) - (b.t.rank || 0) || a.t.name.localeCompare(b.t.name, 'sv'));
    }
    // Divisionens spelare med talet (de som har spelat, när talet är säkert
    // nog), i listans ordning: lika tal med färst matcher först, som på Statistik
    const spMed = (def, x, v) => fin(v) && (x.p.app || 0) > 0 && (def.noll || v > 0) && (!def.ok || def.ok(x.p, x));
    function spLista(def, d) {
      if (!A.P) return [];
      const l = A.P.spelare.filter((x) => x.div === d).map((x) => ({ x, v: def.g(x.p, x) })).filter((y) => spMed(def, y.x, y.v));
      return l.sort((a, b) => (def.asc ? a.v - b.v : b.v - a.v) || (a.x.p.app || 0) - (b.x.p.app || 0) || a.x.p.name.localeCompare(b.x.p.name, 'sv'));
    }
    // en rad i kortet: etiketten (leder till listan), talet, mätaren (plats
    // bland k i en mätare för n) och platsen svagt efter – eller bara
    // etiketten och talet, när talet står utan mätare (mat: false)
    const talRad = (def, q, text, plats, k, n) => rad([def.e, 'd', q], [pad('', ETK - def.e.length)], padL(String(text).slice(0, kortVar()), kortVar()),
      ...(def.mat === false ? [] : [[' '.repeat(matMellan()), ''], ...matare(plats, k, n), [plats ? padL(ordtal(plats), PLATS + 1) : '', 'd']]));
    // Lagkortets tal i en flik, i avsnitt (formen står överst i översikten)
    function lagTal(t, S, flik, r = []) {
      const namn = (LAGDELAR.find(([id]) => id === flik) || [])[1];
      const n = lagIDiv(t.comp).length;
      let del = null;
      for (const def of LAGTAL) {
        if (!def.del || LAGFLIK[def.del] !== flik) continue;
        const v = def.g(t);
        if (!fin(v)) continue;
        if (def.del !== del) { rubrik(r, def.del, namn, kortBredd(n)); del = def.del; }
        const q = listQ('lag', t.comp, def.k);
        if (S.veil || def.mat === false) { r.push(talRad(def, q, S.veil ? '?' : def.f(v, t, kortVar()), null, 0, n)); continue; }
        const alla = lagLista(def, t.comp).map((y) => y.v);
        r.push(talRad(def, q, def.f(v, t, kortVar()), platsAv(v, alla, def.asc), alla.length, n));
      }
      return r;
    }
    // Spelarkortets tal: de som gäller spelaren (utespelare eller målvakt,
    // målskytt) och finns
    const spGaller = (def, x) => {
      const p = x.p;
      const mv = p.pos === 'MV';
      return !((def.ute && mv) || (def.mv && !mv) || (def.visa && !def.visa(p))) && fin(def.g(p, x));
    };
    // Spelarkortets tal i en flik, i avsnitt: platsen bara bland de 20 främsta
    // (utan: rubriken som inte skrivs ut, annars flikens namn)
    function spelarTal(x, S, flik, r = [], utan = null) {
      const p = x.p;
      const namn = utan || (SPDELAR.find(([id]) => id === flik) || [])[1];
      let del = null;
      // (divisionens spelare en gång; platsen räknas utan att listan sorteras)
      const iDiv = S.veil ? [] : A.P.spelare.filter((y) => y.div === x.div);
      for (const def of SPTAL) {
        if (SPFLIK[def.del] !== flik || !spGaller(def, x)) continue;
        const v = def.g(p, x);
        if (def.del !== del) { rubrik(r, def.del, namn, kortBredd(TOPP)); del = def.del; }
        const q = listQ('spelare', x.div, def.k);
        if (S.veil) { r.push(talRad(def, q, '?', null, 0, TOPP)); continue; }
        const pl = def.mat !== false && spMed(def, x, v) ? platsAv(v, iDiv.map((y) => [y, def.g(y.p, y)]).filter(([y, w]) => spMed(def, y, w)).map(([, w]) => w), def.asc) : null;
        r.push(talRad(def, q, def.f(v, p), pl && pl <= TOPP ? pl : null, TOPP, TOPP));
      }
      return r;
    }
    // Listan: divisionens lag eller spelare ordnade efter ett tal, med
    // platsen (numret bara på den första vid lika tal, som skytteligan på
    // tv:n) och talet. Raderna öppnar korten. Målen avslutas med vem som gör
    // dem (anfallarna, mittfältarna …), som på Statistik.
    function lista(vy, S, R) {
      const lagv = vy.slag !== 'spelare';
      const slag = lagv ? 'lag' : 'spelare';
      const defs = lagv ? LAGTAL : SPTAL;
      const s0 = standardDiv();
      const d = REG.includes(vy.div) ? vy.div : REG.includes(s0) ? s0 : REG[0];
      const def = defs.find((x) => x.k === vy.lista);
      if (!def) return lagv ? lagen(d, R) : spelarna(d, S, R);
      R.slojas = true;
      const r = [regRad(slag, d, def.k), streck()];
      if (!helaNamn()) r.push(rad([up(REGNAMN[d]), 'd']));
      if (lagv ? !A.stats : !A.P) return [...r, prickar('HÄMTAR', '')];
      // förra och nästa tal som finns i divisionen
      const har = (y) => (lagv ? lagIDiv(d).some((t) => fin(y.g(t))) : A.P.spelare.some((x) => x.div === d && spMed(y, x, y.g(x.p, x))));
      const finns = defs.filter((y) => y === def || har(y));
      const i = finns.indexOf(def);
      R.sido = [i > 0 ? listQ(slag, d, finns[i - 1].k) : null, i < finns.length - 1 ? listQ(slag, d, finns[i + 1].k) : null];
      // (landslagen spelar inga ligamatcher)
      r.push(rad([d === 'nl' && def.k === 'matcher' ? 'MATCHER I NATIONS LEAGUE' : def.n, 'v']), tom());
      if (S.veil) return [...r, rad('?')];
      const l = lagv ? lagLista(def, d) : spLista(def, d);
      if (!l.length) return [...r, rad('OKÄNT')];
      // namnet, laget (spelarna) och talet till höger
      const V = lagv ? VAR : 8;
      const T = lagv ? 0 : A.bred >= 60 ? 14 : 12;
      const W = Math.min(28, A.bred - 5 - T - V);
      let forra = null;
      l.forEach((y, j) => {
        const nr = forra != null && Math.abs(y.v - forra) < 1e-9 ? '' : String(j + 1);
        forra = y.v;
        const text = String(def.f(y.v, lagv ? y.t : y.x.p)).slice(0, V);
        if (lagv) r.push(radQ(`#lag:${y.t.name}`, [`${padL(nr, 3)}  `, 'd'], pad(up(y.t.name).slice(0, W - 1), W), padL(text, V)));
        else r.push(radQ(`#spelare:${spId(y.x)}`, [`${padL(nr, 3)}  `, 'd'], pad(namnPa(y.x.p.name, W - 1), W), [pad(kort(y.x.p.team).slice(0, T - 1), T), 'd'], padL(text, V)));
      });
      const pos = !lagv && def.k === 'mal' ? (A.P.pos[d] || []) : [];
      if (pos.length) {
        const POSN = { A: 'ANFALLARE', MF: 'MITTFÄLTARE', B: 'BACKAR', MV: 'MÅLVAKTER' };
        r.push(tom(), rad(['VEM GÖR MÅLEN', 'd']));
        for (const y of pos) r.push(rad([pad(POSN[y.pos] || 'OKÄND POSITION', ETK), 'd'], padL(pct(y.share), 5), [`  ${y.goals} MÅL`, 'd']));
      }
      return r;
    }

    // ---------- lagen: divisionerna, lagkorten och truppen ----------

    // (landslagen i Nations League ur A.land, med lagfilens siffror)
    const lagIDiv = (d) => [...(d === 'nl' ? (A.land ? A.land.lag.values() : []) : (A.stats || new Map()).values())].filter((t) => t.comp === d).sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    // divisionen med flest lag i omgången (landslagen räknas som nl)
    function standardDiv() {
      const n = {};
      for (const x of omgLag()) { const t = lagOf(x) || landOf(x); if (t) { const c = t.land ? 'nl' : t.comp; n[c] = (n[c] || 0) + 1; } }
      return REG.slice().sort((a, b) => (n[b] || 0) - (n[a] || 0))[0];
    }
    // Underraden i registret säger vad och var: LAG eller SPELARE till
    // vänster, divisionen till höger, de valda omvända. Divisionerna har
    // hela namnen när raden ryms (annars PL, CH, L1 och L2, och namnet står
    // under strecket). Sist står landslagen (NL, Nations League), som sedan
    // 2026-11-14 har spelare och tal som de andra divisionerna.
    const SLAG = [['lag', 'LAG', 'div'], ['spelare', 'SPELARE', 'spelarna']];
    const helaNamn = () => 20 + REG.reduce((n, x) => n + REGNAMN[x].length + 3, -3) <= A.bred;
    // (i en lista med ett tal, k: divisionerna ger samma lista där, och LAG
    // eller SPELARE leder tillbaka till divisionens lag eller spelare)
    // (en division utan talet – landslagen har ingen styrka – ger dess lag eller spelare)
    function harTal(slag, d, k) {
      const def = (slag === 'spelare' ? SPTAL : LAGTAL).find((y) => y.k === k);
      if (!def) return false;
      if (slag !== 'spelare') return lagIDiv(d).some((t) => fin(def.g(t)));
      return !A.P || A.P.spelare.some((x) => x.div === d && spMed(def, x, def.g(x.p, x)));
    }
    function regRad(slag, d, k) {
      const typ = SLAG.find(([id]) => id === slag)[2];
      const hela = helaNamn();
      return rad(
        ...SLAG.flatMap(([id, namn, t]) => [[namn, id === slag ? 'i' : '', id === slag && !k ? null : `#${t}:${d}`], ['   ', '']]),
        ['|', 'd'], ['   ', ''],
        ...REG.flatMap((x, j) => [[hela ? up(REGNAMN[x]) : REGK[x], x === d ? 'i' : '', x === d ? null : k && harTal(slag, x, k) ? `#lista:${slag}:${x}:${k}` : `#${typ}:${x}`], [j < REG.length - 1 ? '   ' : '', '']]),
      );
    }
    // en division: lagen i bokstavsordning (två spalter på datorn)
    function lagen(div, R) {
      const d = REG.includes(div) ? div : standardDiv();
      if (d === 'nl') return landslagen(R);
      const j = REG.indexOf(d);
      R.sido = [j > 0 ? `#div:${REG[j - 1]}` : null, j < REG.length - 1 ? `#div:${REG[j + 1]}` : null];
      const smal = A.bred < 60;
      const r = [regRad('lag', d), streck()];
      if (!helaNamn()) r.push(rad([up(DIVNAME[d]), 'd']));
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
          const namn = up(t.name).slice(0, w - 2);
          b.push([namn, '', `#lag:${t.name}`], [pad('', w - namn.length), '']);
        }
        r.push(rad(...b));
      }
      return r;
    }

    // ---------- landslagen ----------

    // Nations Leagues grupper med tabellen: plats, lag, spelade, V O F när
    // raden ryms, målskillnad och poäng. Alla grupperna i ordning (A1–D2),
    // utan någon särskild del eller markering för lagen i kupongen. Två
    // spalter när raden ryms, annars en. Ett lag öppnar lagkortet.
    function landslagen(R) {
      R.sido = [`#div:${REG[REG.length - 2]}`, null];
      R.slojas = true;
      const S = slojan();
      const r = [regRad('lag', 'nl'), streck()];
      if (!helaNamn()) r.push(rad([up(REGNAMN.nl), 'd']));
      if (!A.land) return [...r, prickar('HÄMTAR', '')];
      const G = A.land.grupper;
      if (!G.length) return [...r, rad('OKÄNT')];
      const k = A.bred >= 60 ? 2 : 1;
      const cw = k === 2 ? Math.floor((A.bred - 3) / 2) : A.bred;
      const vof = cw - 23 >= 12;
      const N = cw - (vof ? 23 : 14);
      const svar = (x) => (S.veil ? '?' : x);
      // ett block per grupp: rubriken och lagen, alla lika höga
      const H = Math.max(...G.map((g) => g.lag.length));
      const block = (g) => {
        const b = [[[pad(`GRUPP ${g.id}`, 2 + N + 1), 'd'],[`${padL('S', 2)}${vof ? `${padL('V', 3)}${padL('O', 3)}${padL('F', 3)}` : ''}${padL('+/-', 5)}${padL('P', 4)}`, 'd']]];
        for (const t of g.lag) {
          const namn = (up(t.lag).length > N && LANDKORT[t.lag] ? up(LANDKORT[t.lag]) : up(t.lag)).slice(0, N);
          const tal = `${padL(svar(t.played), 2)}${vof ? `${padL(svar(t.won), 3)}${padL(svar(t.drawn), 3)}${padL(svar(t.lost), 3)}` : ''}${padL(svar(S.veil ? '?' : t.gd > 0 ? `+${t.gd}` : t.gd < 0 ? `−${-t.gd}` : '0'), 5)}${padL(svar(t.points), 4)}`;
          b.push([[`${svar(t.rank)} `, 'd'], [namn, '', `#lag:${t.lag}`], [pad('', N + 1 - namn.length), ''], [tal, '']]);
        }
        while (b.length < H + 1) b.push([[pad('', cw), '']]);
        return b;
      };
      for (let i = 0; i < G.length; i += k) {
        const bl = G.slice(i, i + k).map(block);
        r.push(tom());
        for (let y = 0; y < H + 1; y++) r.push(rad(...bl.flatMap((b, x) => (x ? [['   ', ''], ...b[y]] : b[y]))));
      }
      return r;
    }

    // Lagkortet för ett landslag (data/landslag.json och, för lagen i Nations
    // League, teams/unl.json): namnet och flikarna står still överst som i
    // klubbarnas lagkort (sedan 2026-11-14), med samma flikar – xG, SPELET,
    // ODDSEN och TRUPPEN ur Nations League. Översikten är landslagets:
    // omgångens match, gruppen och tabellraden, formen, Nations League
    // hittills, alla landskamper sedan hösten 2024 och nästa match, och sedan
    // de tio senaste landskamperna. ←/→ bläddrar bland lagen i gruppen.
    function landkort(t, S, R, del) {
      const g = A.land.grupper.find((x) => x.id === t.grupp);
      const l = g ? g.lag : [];
      const i = l.findIndex((x) => x.lag === t.lag);
      if (i >= 0) R.sido = [i > 0 ? `#lag:${l[i - 1].lag}` : null, i < l.length - 1 ? `#lag:${l[i + 1].lag}` : null];
      R.slojas = true;
      const har = (id) => id === 'oversikt' || (t.comp === 'nl' && (id === 'truppen' || LAGTAL.some((d) => d.del && LAGFLIK[d.del] === id && fin(d.g(t)))));
      const val = har(del) ? del : 'oversikt';
      R.delar = LAGDELAR.map(([id]) => id).filter(har);
      R.del = val;
      const namn = [[up(t.lag), 'v'], [t.en && t.en !== t.lag ? `  ${up(t.en)}` : '', 'd']];
      const under = [[`${t.grupp ? `NATIONS LEAGUE · GRUPP ${t.grupp}` : 'LANDSLAG'}`, 'd', '#div:nl']];
      // (ett landslag utanför Nations League har bara översikten och ingen flikrad)
      R.huvud = t.comp === 'nl' ? huvud(namn, under, delRad(LAGDELAR, val, har)) : [rad(...namn), rad(...under), streck()];
      if (val === 'truppen') return truppen(t, S, lagTal(t, S, 'truppen'));
      if (val !== 'oversikt') return lagTal(t, S, val);
      const falt = (etikett, ...v) => rad([pad(etikett, 12), 'd'], ...v.map((x) => (Array.isArray(x) ? x : [x, ''])));
      const r = [];
      const om = iOmgangen(t.lag);
      if (om) r.push(falt('OMGÅNGEN', [`${nrAv(om.m)}  ${kort(om.m.home)} – ${kort(om.m.away)}`, '', `#mote:${om.m.id}`]));
      const tb = t.tabell;
      if (tb && tb.rank) r.push(falt(`GRUPP ${t.grupp || ''}`.trim(), S.veil ? '?' : `${ordtal(tb.rank)} AV ${tb.av} · ${tb.points} P PÅ ${tb.played} · ${tb.gd > 0 ? '+' : tb.gd < 0 ? '−' : ''}${Math.abs(tb.gd)}`));
      const sen = t.senaste || [];
      const dold = (x) => Boolean(window.Spoiler && Spoiler.hidesDay(x.datum) && (!Spoiler.hiddenId || Spoiler.hiddenId(x.id) !== false));
      if (sen.length) r.push(falt('FORMEN', sen.slice(0, 5).map((x) => (dold(x) ? '?' : x.utfall || '?')).join('')));
      const rec = (x) => (S.veil ? '?' : `${x.v}-${x.o}-${x.f} · MÅL ${x.gjorda}–${x.inslappta}`);
      const nlr = t.nationsLeague;
      if (nlr && nlr.matcher) r.push(falt('NATIONS L.', rec(nlr)));
      const a = t.alla;
      if (a && a.matcher) {
        r.push(falt('LANDSKAMPER', S.veil ? '?' : `${a.matcher} M · ${rec(a)}`));
        if (a.fran) r.push(rad([pad('', 12)], [`SEDAN ${up(dag(a.fran))}`, 'd']));
      }
      // hållna nollor, som på Statistik (tabellen Landslagen)
      const noll = [nlr && nlr.matcher && nlr.nollor != null ? `${nlr.nollor} I NATIONS L.` : null, a && a.matcher && a.nollor != null ? `${a.nollor} I ALLA` : null].filter(Boolean);
      if (noll.length) r.push(falt('NOLLOR', S.veil ? '?' : noll.join(' · ')));
      const nx = t.nasta;
      if (nx && nx.datum) {
        const dagar = dayNo(Date.parse(nx.datum)) - dayNo(Date.now());
        r.push(falt('NÄSTA', [kort(nx.motstand), '', landOf(nx.motstand) ? `#lag:${nx.motstand}` : null],
          ` ${nx.hemma ? 'HEMMA' : 'BORTA'} ${dagar > 0 ? `OM ${dagar} D` : dagar === 0 ? 'I DAG' : ''}${nx.turnering && nx.turnering !== 'UNL' ? ` (${nx.turnering})` : ''}`));
      }
      if (!sen.length) return r;
      r.push(tom(), rad(['DE SENASTE LANDSKAMPERNA', 'd']));
      for (const x of sen) {
        const h = dold(x);
        r.push(rad([`${pad(up(dag(x.datum)), 12)}${pad(x.turnering || '', 4)}${x.hemma ? 'H' : 'B'} `, 'd'],
          [pad(kort(x.motstand).slice(0, 11), 11), '', landOf(x.motstand) ? `#lag:${x.motstand}` : null],
          [`  ${h || !x.mal ? '?' : `${x.mal[0]}–${x.mal[1]}`}`, 'v'], [`  ${h ? '' : x.utfall || ''}`, 'd']));
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
    // i truppen och i spelarlistan: de som har spelat och de som är skadade (l = laget(x))
    const medraknad = (x, l) => (x.p.min || 0) > 0 || Boolean(l && l[0] !== 'SPELKLAR');
    function trupp(t, veil) {
      if (!A.P || !t) return null;
      return A.P.spelare.filter((x) => String(x.p.teamId) === String(t.espnId))
        .map((x) => ({ x, l: laget(x) }))
        .filter(({ x, l }) => medraknad(x, l))
        .sort((a, b) => (veil ? (POSORD[a.x.p.pos] ?? 4) - (POSORD[b.x.p.pos] ?? 4) : (b.x.p.min || 0) - (a.x.p.min || 0)) || efternamn(a.x.p.name).localeCompare(efternamn(b.x.p.name), 'sv'));
    }

    // Lagkortet: namnet, divisionen och flikarna står still överst (R.huvud),
    // och under dem det som står i fliken (del; översikten när fliken inte
    // har något). ←/→ går till förra och nästa lag i samma flik.
    function lagkort(t, S, R, del) {
      const l = lagIDiv(t.comp);
      const i = l.findIndex((x) => x.name === t.name);
      if (i >= 0) R.sido = [i > 0 ? `#lag:${l[i - 1].name}` : null, i < l.length - 1 ? `#lag:${l[i + 1].name}` : null];
      R.slojas = true;
      const har = (id) => id === 'oversikt' || id === 'truppen' || LAGTAL.some((d) => d.del && LAGFLIK[d.del] === id && fin(d.g(t)));
      const val = har(del) ? del : 'oversikt';
      R.delar = LAGDELAR.map(([id]) => id).filter(har);
      R.del = val;
      R.huvud = huvud([[up(t.name), 'v']], [[up(DIVNAME[t.comp] || ''), 'd', `#div:${t.comp}`]], delRad(LAGDELAR, val, har));
      if (val === 'truppen') return truppen(t, S, lagTal(t, S, 'truppen'));
      if (val !== 'oversikt') return lagTal(t, S, val);
      const r = [];
      const om = iOmgangen(t.name);
      const falt = (etikett, ...v) => rad([pad(etikett, ETK), 'd'], ...v.map((x) => (Array.isArray(x) ? x : [x, ''])));
      if (om) r.push(falt('OMGÅNGEN', [`${nrAv(om.m)}  ${kort(om.m.home)} – ${kort(om.m.away)}`, '', `#mote:${om.m.id}`]));
      // nästa match: efter omgångens (matchens fil), och för de andra lagen den närmaste (matcherna)
      const d = om && A.match.get(om.m.id);
      const nx = d && d.teams && d.teams[om.side] && d.teams[om.side].schedule && d.teams[om.side].schedule.next;
      if (nx && nx.days != null) {
        r.push(falt('NÄSTA', [kort(nx.opponent), '', `#lag:${nx.opponent}`], `  ${nx.home ? 'HEMMA' : 'BORTA'} OM ${nx.days} D${nx.comp && nx.comp !== up(t.comp) ? ` (${up(TAV[nx.comp] || nx.comp)})` : ''}`));
      } else if (!om) {
        const snart = Date.now() - 3 * 3600000;
        const n = (A.byTeam.get(t.name) || []).filter((x) => !x.completed && Date.parse(x.kickoff) > snart).pop();
        if (n) {
          const hemma = n.home === t.name;
          const mot = hemma ? n.away : n.home;
          const dagar = dayNo(Date.parse(n.kickoff)) - dayNo(Date.now());
          r.push(falt('NÄSTA', [kort(mot), '', lagOf(mot) ? `#lag:${mot}` : null],
            `  ${hemma ? 'HEMMA' : 'BORTA'} ${dagar > 0 ? `OM ${dagar} D` : 'I DAG'}${n.comp && n.comp !== t.comp ? ` (${up(TAV[up(n.comp)] || n.comp)})` : ''}`));
        }
      }
      // formen: de fem matcherna (som på Statistik, senaste först; datumet
      // utan år, resultatet rakt under talen på datorn) och poängen under dem
      // som en summa, med mätaren och platsen (? när en av matcherna är dold)
      const f = formLag(t.name);
      const fv = LAGTAL[0].g(t);
      if (f.length) {
        const n = lagIDiv(t.comp).length;
        const w = kortBredd(n);
        rubrik(r, 'FORMEN', null, w);
        for (const { m: x, l: u } of f) {
          const hemma = x.home === t.name;
          const mot = hemma ? x.away : x.home;
          const s = x.score90 || x.score;
          r.push(rad([`${pad(up(dag(x.kickoff)).replace(/ \d{4}$/, ''), 7)}${pad(up(x.comp || ''), 4)}${hemma ? 'H' : 'B'} `, 'd'],
            [pad(kort(mot).slice(0, 11), 12), '', lagOf(mot) ? `#lag:${mot}` : null],
            [padL(u === '?' || !s ? '?' : hemma ? `${s.home}–${s.away}` : `${s.away}–${s.home}`, 3), 'v'], [`  ${u === '?' ? '' : u}`, 'd']));
        }
        const alla = lagLista(LAGTAL[0], t.comp).map((y) => y.v);
        const summa = talRad({ e: 'POÄNG' }, listQ('lag', t.comp, 'form'), fin(fv) && f.every((x) => x.l !== '?') ? `${fv} P` : '?', !S.veil && fin(fv) ? platsAv(fv, alla) : null, alla.length, n);
        r.push(Object.assign(summa, { kl: 'ny', st: `width: ${w + 1}ch` }));
      }
      // (modellens styrka och motståndet hittills)
      return lagTal(t, S, 'oversikt', r);
    }
    // Truppen under lagets tal om truppen (r): på datorn också assisten och korten
    function truppen(t, S, r) {
      const tr = trupp(t, S.veil);
      if (r.length) r.push(tom());
      if (!tr) return [...r, prickar('HÄMTAR TRUPPEN', '')];
      const fler = A.bred >= 56 ? [['ASS', 'a'], ['GUL', 'yc'], ['RÖD', 'rc']] : A.bred >= 46 ? [['ASS', 'a']] : [];
      const W = Math.min(26, A.bred - 24 - 5 * fler.length);
      r.push(rad([`${pad('SPELARNA', 4 + W)}${padL('MIN', 5)}${padL('MÅL', 5)}${fler.map(([n]) => padL(n, 5)).join('')}`, 'd']));
      for (const { x, l: lg } of tr) {
        const st = lg && lg[0] !== 'SPELKLAR' ? STATUS[lg[0]] || lg[0] : '';
        r.push(radQ(`#spelare:${spId(x)}`, [pad(x.p.pos || '', 4), 'd'], [pad(namnPa(x.p.name, W - 1), W), st ? 'd' : ''],
          padL(S.veil ? '?' : x.p.min || 0, 5), padL(S.veil ? '?' : x.p.g || 0, 5), ...fler.map(([, k]) => padL(S.veil ? '?' : x.p[k] || 0, 5)), [st ? `  ${st}` : '', 'v']));
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

    // Spelarna i en division från A till Ö (efternamnet): platsen, laget,
    // speltiden och målen, samma spelare som i trupperna. Läget (skadad,
    // avstängd) står sist när raden ryms. Med dolda resultat står ? för
    // speltiden och målen; ordningen avslöjar inget.
    function spelarna(div, S, R) {
      const d = REG.includes(div) ? div : standardDiv();
      const j = REG.indexOf(d);
      R.sido = [j > 0 ? `#spelarna:${REG[j - 1]}` : null, j < REG.length - 1 ? `#spelarna:${REG[j + 1]}` : null];
      R.slojas = true;
      const r = [regRad('spelare', d), streck()];
      if (!A.P) return [...r, prickar('HÄMTAR', '')];
      const l = A.P.spelare.filter((x) => x.div === d).map((x) => ({ x, l: laget(x), e: efternamn(x.p.name) }))
        .filter(({ x, l: lg }) => medraknad(x, lg))
        .sort((a, b) => a.e.localeCompare(b.e, 'sv'));
      if (!l.length) return [...r, rad([up(REGNAMN[d]), 'd']), rad('OKÄNT')];
      // namnet, platsen (4), laget (T: de korta namnen har högst elva
      // tecken, utom Chesterfield), MIN och MÅL (5 + 4) och läget när det ryms
      const T = A.bred >= 60 ? 14 : 12;
      const W = Math.min(26, A.bred - T - 13);
      const lage = A.bred - (W + T + 13) >= 9;
      r.push(rad([pad(`${up(REGNAMN[d])} · ${l.length} SPELARE`, W + 4 + T), 'd'], [`${padL('MIN', 5)}${padL('MÅL', 4)}`, 'd']));
      for (const { x, l: lg } of l) {
        const st = lg && lg[0] !== 'SPELKLAR' ? STATUS[lg[0]] || lg[0] : '';
        r.push(radQ(`#spelare:${spId(x)}`, [pad(namnPa(x.p.name, W - 1), W), st ? 'd' : ''], [pad(x.p.pos || '', 4), 'd'],
          [pad(kort(x.p.team).slice(0, T - 1), T), 'd'], padL(S.veil ? '?' : x.p.min || 0, 5), padL(S.veil ? '?' : x.p.g || 0, 4),
          [lage && st ? `  ${st}` : '', 'v']));
      }
      return r;
    }

    // Spelarkortet: namnet, laget och flikarna står still överst, som i
    // lagkortet. ←/→ går till förra och nästa i truppen i samma flik.
    function spelarkort(x, S, R, del) {
      R.slojas = true;
      const p = x.p;
      const t = lagAvId(p.teamId);
      // förra och nästa i truppen
      const tr = trupp(t, S.veil);
      const k = tr ? tr.findIndex((y) => y.x === x) : -1;
      if (k >= 0) R.sido = [k > 0 ? `#spelare:${spId(tr[k - 1].x)}` : null, k < tr.length - 1 ? `#spelare:${spId(tr[k + 1].x)}` : null];
      const delar = spDelar(p);
      const har = (id) => id === 'oversikt' || SPTAL.some((d) => SPFLIK[d.del] === id && spGaller(d, x));
      const val = delar.some(([id]) => id === del) && har(del) ? del : 'oversikt';
      R.delar = delar.map(([id]) => id).filter(har);
      R.del = val;
      // Raden under namnet: kortets lag (leder till lagkortet), numret och
      // positionen. När spelaren har två kort står det andra laget också där
      // – landet i klubbens kort, klubben i landslagets – och leder till det
      // kortet: på datorn sist på raden (som står på samma rad som namnet),
      // i telefonen längst ut på namnets rad. De korta namnen (MAN CITY) när
      // raden annars inte ryms.
      const tv = tvilling(x);
      const lagNamn = (n, lang) => (lang ? up(n) : kort(n));
      const andra = (lang) => [lagNamn(tv.p.team, lang), '', `#spelare:${spId(tv)}`];
      const under = (lang, med) => [[lagNamn(p.team, lang), '', t ? `#lag:${t.name}` : null], [`${p.jersey ? ` · NR ${p.jersey}` : ''}${POS[p.pos] ? ` · ${up(POS[p.pos])}` : ''}`, ''],
        ...(med ? [[' · ', ''], andra(lang)] : [])];
      const langd = (l) => l.reduce((s, [z]) => s + z.length, 0);
      let namn = [[efternamn(p.name), 'v']];
      let u;
      if (A.bred >= 60) {
        u = [true, false].map((l) => under(l, Boolean(tv))).find((v) => langd(namn) + 3 + langd(v) <= A.bred) || under(true, Boolean(tv));
      } else {
        u = [true, false].map((l) => under(l, false)).find((v) => langd(v) <= A.bred) || under(false, false);
        const a = tv && [true, false].map((l) => andra(l)).find((v) => langd(namn) + 3 + v[0].length <= A.bred);
        if (a) namn = [...namn, [' '.repeat(A.bred - langd(namn) - a[0].length), ''], a];
        else if (tv) u = [...u, [' · ', ''], andra(false)];
      }
      R.huvud = huvud(namn, u, delRad(delar, val, har));
      // Statistiks tal i avsnitt (anfallet, målen, målet, försvaret och
      // regelbrotten), med platsen bland divisionens 20 främsta
      if (val !== 'oversikt') return spelarTal(x, S, val);
      // Översikten: läget och matcherna i samma spalt (utan rubrik, så att
      // laget med och utan honom ryms under), skadan under läget
      const r = [];
      const l = laget(x);
      if (l) {
        r.push(rad(['LÄGET', 'd'], [pad('', ETK - 5)], [l[0], l[0] === 'SPELKLAR' ? '' : 'v']));
        for (const n of l.slice(1)) r.push(rad([pad('', ETK)], [n]));
      }
      spelarTal(x, S, 'oversikt', r, 'MATCHERNA');
      if (S.veil) return r;
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
    // Sökningen svarar medan man skriver: alla träffar står i utskriften, den
    // mest sannolika överst och sedan i fallande led, och Enter öppnar den
    // markerade (↑/↓ väljer en annan). Den hittar lag och spelare i alla fyra
    // divisionerna, omgångens möten (två lag), flikarna och divisionerna, och
    // raden överst väljer kategori (Tab byter). Ett lag i frågan ger också
    // lagets trupp, sist och i truppens ordning (LAGETS). Felstavat
    // går också: hittas inget står MENADE DU över det som ligger närmast.
    //
    // Hur sannolik en träff är (p, högre är troligare) är två delar lagda
    // ihop: hur väl frågan passar namnet (passar) och hur ofta man söker
    // något sådant (TROLIGT och DIVPLUS). Så går burn → Burnley före Dan Burn
    // (ett lag före en spelare, fast bara början av namnet), och isak → Isak
    // före Isaksen och Isak Alemayehu.

    // Ett ord som bara börjar ett ord i namnet: mindre ju fler bokstäver som fattas
    const BORJAN = (rest) => 0.1 + 0.05 * Math.min(rest, 8);
    // Hur väl frågans ord passar namnets: 0 när varje ord är ett ord i namnet,
    // minus BORJAN för ett ord som bara börjar ett, -0,8 när namnet är
    // hopskrivet (mac allister = macallister), och null när det inte passar.
    // Hela namnet ger 0,3 till. ef är en spelares efternamn: träffar frågan
    // inte det dras 0,25 av (isak = Isak, inte Isak Alemayehu i första hand).
    function passar(q, t, hel, ef) {
      let s = 0;
      let iEf = !ef;
      for (const w of q) {
        let minus = null;
        let ord = null;
        for (const x of t) {
          if (!x.startsWith(w)) continue;
          const m = x === w ? 0 : BORJAN(x.length - w.length);
          if (minus == null || m < minus || (m === minus && ef && ef.includes(x))) { minus = m; ord = x; }
        }
        if (minus == null) {
          const ihop = q.join('');
          return ihop.length > 3 && (hel.replace(/ /g, '').startsWith(ihop) || t.some((x) => x.startsWith(ihop))) ? -0.8 : null;
        }
        s -= minus;
        if (ef && ef.includes(ord)) iEf = true;
      }
      return s - (iEf ? 0 : 0.25) + (q.join(' ') === hel ? 0.3 : 0);
    }
    // Hur ofta man söker något av slaget: ett möte (två lag i frågan) är nästan
    // säkert det man menar, en flik eller division när frågan är dess ord, och
    // lag söks oftare än spelare. Lagen högre upp i ligasystemet lite före, och
    // spelarna efter speltid (full vid 1 500 minuter); lag och spelare i
    // omgången också lite före.
    const TROLIGT = { mote: 0.6, del: 0.2, lag: 0, spelare: -0.6 };
    const DIVPLUS = { pl: 0.1, ch: 0.05, l1: 0.02, l2: 0, nl: 0.05 };
    // Lagets spelare när frågan är laget: efter alla som passar på namn, och
    // bara när laget passar nästan helt och frågan har minst tre bokstäver
    // (högst fyra bokstäver fattas: burn → Burnleys trupp, men inte mans →
    // Mansfields)
    const LAGETS = -2;
    const LAGETS_MIN = -0.3;
    // efternamnets ord (som efternamn(): van, de … hör till efternamnet)
    function efOrd(t) {
      let i = t.length - 1;
      while (i > 1 && /^(van|von|de|der|den|da|das|do|dos|di|del|la|le|mac|bin|ter|ten)$/.test(t[i - 1])) i--;
      return t.slice(i);
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
      { namn: 'REGISTRET', typ: 'FLIK', q: '#flik:lagen', ord: ['registret', 'register', 'lagen', 'trupperna', 'ligorna', 'divisionerna'] },
      { namn: 'SPELARE', typ: 'REGISTRET', q: '#spelarna:', ord: ['spelare', 'spelarna'] },
      ...DIVS.map((d) => ({ namn: up(DIVNAME[d]), typ: 'DIVISION', q: `#div:${d}`, ord: [norm(DIVNAME[d]), d, { pl: 'premier', ch: 'champ', l1: 'league 1', l2: 'league 2' }[d]] })),
      { namn: 'NATIONS LEAGUE', typ: 'LANDSLAG', q: '#div:nl', ord: ['nations league', 'nations', 'nl', 'landslag', 'landslagen', 'landskamper', 'landskamperna'] },
      // Statistiks tal som listor (i divisionen med flest lag i omgången): på
      // etiketten eller rubriken, hela ordet eller början från fem bokstäver
      ...[['lag', LAGTAL], ['spelare', SPTAL]].flatMap(([slag, l]) => l.map((y) => ({ namn: y.n, typ: 'LISTA', q: `#lista:${slag}::${y.k}`, ord: [...new Set([norm(y.e), norm(y.n)])], lista: true }))),
    ];
    // Alla träffar på frågan, den mest sannolika först (p, se ovan)
    function sok(text) {
      const qn = norm(text);
      const q = qn.split(' ').filter(Boolean);
      if (!q.length) return [];
      const hits = [];
      const lagTraff = [];
      // (klubbarna och landslagen; ett landslag heter också som på engelska och
      // har sin landskod: sverige, sweden, swe)
      const lag = [...(A.stats || new Map()).values(), ...(A.land ? A.land.lag.values() : [])];
      const iOmg = new Set(omgLag());
      const namnen = (t) => [...new Set([t.name, o.kort(t.name), ...(t.land ? [t.en, t.kod, LANDKORT[t.name]] : [])].filter(Boolean).map(norm))];
      const lagTok = (t) => [...namnen(t).join(' ').split(' '), ...(ALIAS[t.name] ? [ALIAS[t.name]] : [])];
      const lagPlus = (t) => TROLIGT.lag + (t.land ? DIVPLUS.nl : DIVPLUS[t.comp] || 0) + (iOmg.has(t.name) ? 0.1 : 0);
      const spelPlus = (x) => TROLIGT.spelare + 0.2 * Math.min(1, (x.p.min || 0) / 1500) + (DIVPLUS[x.div] || 0) + (iOmg.has(x.p.team) ? 0.05 : 0);
      for (const d of DELAR) {
        // hela ordet, eller början av det från tre bokstäver
        const rest = d.ord.includes(qn) ? -1 : qn.length >= (d.lista ? 5 : 3) ? Math.min(...d.ord.filter((x) => x.startsWith(qn)).map((x) => x.length - qn.length)) : Infinity;
        if (rest < Infinity) hits.push({ typ: 'del', d, p: TROLIGT.del + (rest < 0 ? 0.3 : -BORJAN(rest)) });
      }
      for (const t of lag) {
        let s = null;
        for (const n of [...namnen(t), ...(ALIAS[t.name] ? [ALIAS[t.name]] : [])]) {
          const v = passar(q, n.split(' '), n);
          if (v != null && (s == null || v > s)) s = v;
        }
        if (s != null) hits.push({ typ: 'lag', t, p: s + lagPlus(t) });
        if (s != null && s >= LAGETS_MIN && qn.length >= 3 && (!t.land || t.comp === 'nl')) lagTraff.push({ t, p: s + lagPlus(t) });
      }
      // ett möte i omgången: båda lagen ur frågan
      for (const m of A.ms) {
        // (ett landslag också på engelska: sweden bosnia)
        const en = (n) => { const t = landOf(n); return t ? [t.en, t.kod] : []; };
        const h = [m.home, o.kort(m.home), ...en(m.home)].map(norm).join(' ').split(' ');
        const b = [m.away, o.kort(m.away), ...en(m.away)].map(norm).join(' ').split(' ');
        const iH = (w) => h.some((x) => x.startsWith(w));
        const iB = (w) => b.some((x) => x.startsWith(w));
        if (q.length > 1 && q.every((w) => iH(w) || iB(w)) && q.some((w) => iH(w) && !iB(w)) && q.some((w) => iB(w) && !iH(w))) hits.push({ typ: 'mote', m, p: TROLIGT.mote });
      }
      if (A.P) for (const x of A.P.spelare) {
        if (!x.ef) x.ef = efOrd(x.t);
        let s = passar(q, x.t, x.n, x.ef);
        // med laget i frågan (saka arsenal, bowen west ham): laget gör det troligare
        if (s == null && q.length > 1) {
          if (!x.lt) x.lt = [norm(x.p.team), norm(o.kort(x.p.team))].join(' ').split(' ');
          const rest = q.filter((w) => !x.lt.some((y) => y.startsWith(w)));
          if (rest.length && rest.length < q.length) { s = passar(rest, x.t, x.n, x.ef); if (s != null) s += 0.1; }
        }
        if (s != null) hits.push({ typ: 'spelare', x, p: s + spelPlus(x) });
      }
      // lagets trupp (de som har spelat eller är skadade), i truppens ordning
      if (A.P && lagTraff.length) {
        const har = new Set(hits.filter((h) => h.typ === 'spelare').map((h) => h.x));
        const veil = slojan().veil;
        for (const { t, p } of lagTraff) {
          (trupp(t, veil) || []).forEach(({ x }, i) => { if (!har.has(x)) { har.add(x); hits.push({ typ: 'spelare', x, p: p + LAGETS - 0.0001 * i }); } });
        }
      }
      // inget alls: det som ligger närmast (felstavat), mindre troligt ju längre bort
      const luddigt = !hits.length;
      if (luddigt) {
        for (const t of lag) {
          const d = luddig(q, lagTok(t));
          if (d != null) hits.push({ typ: 'lag', t, p: lagPlus(t) - 1.2 - 0.4 * d });
        }
        if (A.P) for (const x of A.P.spelare) {
          const d = luddig(q, x.t);
          if (d != null) hits.push({ typ: 'spelare', x, p: spelPlus(x) - 1.2 - 0.4 * d });
        }
      }
      const ut = utanLandet(hits).sort((a, b) => b.p - a.p || traffNamn(a).localeCompare(traffNamn(b), 'sv'));
      ut.luddig = luddigt && ut.length > 0;
      return ut;
    }
    // En spelare som träffas både i klubben och i landslaget står en gång,
    // som klubbens, på den högre platsen av de två (landet står i kortet)
    function utanLandet(hits) {
      const klubb = new Map();
      for (const h of hits) if (h.typ === 'spelare' && h.x.div !== 'nl') klubb.set(String(h.x.p.id), h);
      return hits.filter((h) => {
        const k = h.typ === 'spelare' && h.x.div === 'nl' ? klubb.get(String(h.x.p.id)) : null;
        if (k && h.p > k.p) k.p = h.p;
        return !k;
      });
    }
    const traffNamn = (h) => (h.typ === 'lag' ? h.t.name : h.typ === 'spelare' ? efternamn(h.x.p.name) : h.typ === 'mote' ? h.m.home : h.d.namn);
    // träffen som en vy (i sin flik)
    const vyFor = (h) => (h.typ === 'lag' ? { flik: 'lagen', lag: h.t.name } : h.typ === 'mote' ? { flik: 'kupongen', mote: h.m.id } : h.typ === 'del' ? vyAv(h.d.q) : { flik: 'lagen', spelare: spId(h.x) });
    function listrad(h, i) {
      const nr = [`${padL(i + 1, 2)}  `, 'd'];
      const q = `#${i + 1}`;
      const W = Math.min(28, A.bred - 12);
      if (h.typ === 'lag') return radQ(q, nr, pad(up(h.t.name).slice(0, W - 1), W), [h.t.land ? `LANDSLAG${h.t.grupp ? ` ${h.t.grupp}` : ''}`.slice(0, A.bred - 4 - W) : `LAG ${DIVK[h.t.comp] || ''}`, 'd']);
      if (h.typ === 'mote') return radQ(q, nr, pad(`${kort(h.m.home)} – ${kort(h.m.away)}`, W), ['MÖTE', 'd']);
      if (h.typ === 'del') return radQ(q, nr, pad(h.d.namn.slice(0, W - 1), W), [h.d.typ, 'd']);
      return radQ(q, nr, pad(efternamn(h.x.p.name).slice(0, W - 1), W), [kort(h.x.p.team), 'd']);
    }
    // Kategorierna i sökningen: alla träffar eller ett slag (träffens typ).
    // Den valda gäller medan man skriver, och så länge den har träffar.
    const KATEGORIER = [['alla', 'ALLA'], ['lag', 'LAG'], ['spelare', 'SPELARE']];
    const antal = (h, id) => (id === 'alla' ? h.length : h.filter((x) => x.typ === id).length);
    // kategorin som visas (alla när den valda är tom) och dess träffar, i samma ordning
    function iKat(h) {
      const k = A.kat !== 'alla' && antal(h, A.kat) ? A.kat : 'alla';
      return { k, l: k === 'alla' ? h : h.filter((x) => x.typ === k) };
    }
    // Raden med kategorierna, som divisionernas: den valda omvänd och de
    // tomma svaga, med antalet träffar när raden ryms. Den är inte med när
    // ↑/↓ väljer (.kat), så att den markerade träffen är den troligaste.
    function katRad(h, k) {
      const med = KATEGORIER.reduce((s, [id, namn]) => s + namn.length + 1 + String(antal(h, id)).length + 3, -3) <= A.bred;
      const r = rad(...KATEGORIER.flatMap(([id, namn], j) => {
        const n = antal(h, id);
        return [[med ? `${namn} ${n}` : namn, id === k ? 'i' : n ? '' : 'd', id === k || !n ? null : `#kat:${id}`], [j < KATEGORIER.length - 1 ? '   ' : '', '']];
      }));
      r.kat = true;
      return r;
    }
    // byt kategori (Tab, Skift-Tab), bland dem som har träffar
    function bytKat(d) {
      const h = A.vy.hits || [];
      const ids = KATEGORIER.map(([id]) => id).filter((id) => antal(h, id));
      if (ids.length < 2) return;
      const i = ids.indexOf(iKat(h).k);
      A.kat = ids[(i + d + ids.length) % ids.length];
      visa(A.vy, false);
      valj(0, false);
    }
    function traffLista(vy, R) {
      const h = vy.hits || [];
      const { k, l } = iKat(h);
      // (de numrerade raderna: en siffra och Enter, och #1 … i vyAv)
      A.lista = l.slice(0, LISTA);
      const r = [katRad(h, k), streck(), h.luddig ? rad([`INGET PÅ ${up(vy.eko)}. MENADE DU:`.slice(0, A.bred), 'd']) : prickar('SÖKER I REGISTRET', traffar(l.length), A.bred)];
      if (!l.length) return r;
      r.push(tom());
      A.lista.forEach((x, i) => { R.nr[i + 1] = `#${i + 1}`; r.push(listrad(x, i)); });
      if (l.length > LISTA) r.push(rad([`    OCH ${l.length - LISTA} TILL`, 'd']));
      return r;
    }

    // ---------- vyerna ----------
    //
    // En vy är { flik, mote, div, lag, spelare } eller en sökning
    // { flik: 'sok', eko, hits }. bygg ger menyraden (topp), raderna (ut),
    // raderna med nummer (nr), förra och nästa (sido) och om vyn räknar med
    // dolda resultat.

    function vyRader(vy, S, R) {
      if (vy.flik === 'kupongen') {
        const m = vy.mote && A.ms.find((x) => x.id === vy.mote);
        return m ? akten(m, S, R, vy.del) : kupongen(R);
      }
      if (vy.lista) return lista(vy, S, R);
      if (vy.spelare) {
        const x = A.P && A.P.spelare.find((y) => spId(y) === vy.spelare);
        return x ? spelarkort(x, S, R, vy.del) : [prickar('HÄMTAR', '')];
      }
      const t = vy.lag && lagOf(vy.lag);
      if (t) return lagkort(t, S, R, vy.del);
      const tl = vy.lag && landOf(vy.lag);
      if (tl) return landkort(tl, S, R, vy.del);
      return vy.slag === 'spelare' ? spelarna(vy.div, S, R) : lagen(vy.div, R);
    }

    // (huvud: det som står still under menyraden i ett kort – namnet och
    // flikarna; delar: kortets flikar som har något, del: den valda)
    function bygg(vy) {
      const S = slojan();
      const R = { nr: {}, sido: null, slojas: false, huvud: null, delar: null, del: null };
      const aktiv = vy.flik === 'sok' ? (A.fore || {}).flik : vy.flik;
      const meny = rad(...FLIKAR.flatMap(([id, namn], j) => [[namn, aktiv === id ? 'i' : '', `#flik:${id}`], [j < FLIKAR.length - 1 ? '   ' : '', '']]));
      R.ut = vy.flik === 'sok' ? traffLista(vy, R) : vyRader(vy, S, R);
      R.topp = [meny, streck(), ...(R.huvud || [])];
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
      if (k && R.delar && R.delar.length > 1) b.push(['TAB FLIK', null]);
      if (k && A.vy.flik === 'sok' && KATEGORIER.filter(([id]) => antal(A.vy.hits || [], id)).length > 1) b.push(['TAB KATEGORI', null]);
      if (k && Object.keys(R.nr).length) b.push(['↑↓ VÄLJ   ↵ ÖPPNA', null]);
      return b.map(([t, q, av]) => `<span${q ? ` class="a" data-q="${esc(q)}"` : av ? ' class="av"' : ''}>${esc(t)}</span>`).join('');
    }

    // ---------- utskriften ----------

    // Skriver vyn: rad för rad som en terminal (utan när rummet ska vara
    // stilla), annars på en gång (när datan kommer in).
    function visa(vy, skriv) {
      fkStang();
      A.vy = vy;
      A.sel = -1;
      // (en ny sökning börjar med alla träffar)
      if (vy.flik !== 'sok') A.kat = 'alla';
      A.nr++;
      const sk = ++A.sk;
      const R = bygg(vy);
      A.R = R;
      const h = html(R.ut);
      A.ut = h;
      A.topp = html(R.topp);
      topp.innerHTML = A.topp;
      fot.innerHTML = fotHtml(R);
      spoilerRad();
      if (!skriv || o.calm()) { ut.innerHTML = h; rull.scrollTop = 0; return; }
      ut.innerHTML = '';
      rull.scrollTop = 0;
      const delar = h.match(/<div class="tr[^"]*"[^>]*>.*?<\/div>(?=<div class="tr|$)/g) || [];
      let i = 0;
      // (en lång lista skrivs så långt skärmen räcker, sedan resten på en gång)
      const steg = () => {
        if (sk !== A.sk) return;
        if (i >= SKRIV) { ut.insertAdjacentHTML('beforeend', delar.slice(i).join('')); return; }
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

    // Till en vy: den förra sparas, så att Esc går tillbaka dit – med var
    // den stod rullad och den markerade raden när den syntes (har), så att
    // man kommer tillbaka till samma ställe i en lång lista
    function ga(vy, har = true) {
      A.bak = [...A.bak, har ? { ...A.vy, y: rull.scrollTop, sel: A.sel } : A.vy].slice(-30);
      visa(vy, true);
    }
    function tillbaka() {
      if (!A.bak.length) { o.close(); return; }
      const v = A.bak.pop();
      if (!v.y) { visa(v, true); return; }
      visa(v, false);
      rull.scrollTop = v.y;
      valj(v.sel, false);
    }
    // förra eller nästa (match, division, lag eller spelare); i flikarnas början flikarna
    // (i ett kort och i matchakten: samma flik i nästa)
    function sido(d) {
      const R = A.R;
      if (R && R.sido) {
        const q = R.sido[d > 0 ? 1 : 0];
        const vy = q && vyAv(q);
        if (vy && A.vy.del && (vy.lag || vy.spelare || vy.mote)) vy.del = A.vy.del;
        if (vy) visa(vy, true);
        return;
      }
      if (A.bak.length) return;
      const i = FLIKAR.findIndex(([id]) => id === A.vy.flik);
      const j = i < 0 ? 0 : i + d;
      if (j >= 0 && j < FLIKAR.length) visa({ flik: FLIKAR[j][0] }, true);
    }
    // vyn som en tryckbar bit leder till (#mote:…, #lag:…, #spelare:…, #div:…, #spelarna:…, #flik:… eller #nr)
    // (flikarna som har gått upp i andra: topplistorna står vid matcherna)
    const GAMLA = { omgangen: 'kupongen', listor: 'kupongen', spelarna: 'lagen' };
    function vyAv(q) {
      const [typ, ...rest] = q.slice(1).split(':');
      const id = rest.join(':');
      if (/^\d+$/.test(typ)) { const h = A.lista[Number(typ) - 1]; return h ? vyFor(h) : null; }
      if (typ === 'mote') return { flik: 'kupongen', mote: id };
      if (typ === 'div') return { flik: 'lagen', div: id };
      if (typ === 'spelarna') return { flik: 'lagen', div: id, slag: 'spelare' };
      if (typ === 'lag') return lagOf(id) || landOf(id) ? { flik: 'lagen', lag: id } : null;
      if (typ === 'spelare') return { flik: 'lagen', spelare: id };
      // en lista: #lista:lag:pl:skapar (utan division: den med flest lag i omgången)
      if (typ === 'lista') return rest.length === 3 ? { flik: 'lagen', slag: rest[0], div: rest[1], lista: rest[2] } : null;
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
    // En tryckbar bit: flikarna börjar om, divisionerna byts på
    // plats, resten går vidare. En träff i sökningen öppnas från vyn där man
    // började skriva, så att Esc går tillbaka dit.
    function tryck(q) {
      const iSok = A.vy.flik === 'sok';
      const fore = A.fore || { flik: 'kupongen' };
      // en kategori i sökningen: frågan står kvar
      if (q.startsWith('#kat:')) {
        if (iSok) { A.kat = q.slice(5); visa(A.vy, false); valj(0, false); }
        return null;
      }
      // förklaringarna: rutans tangenter, HELA LISTAN (#ga:#lista:…) och ett
      // tals etikett i ett kort eller i matchakten
      if (q.startsWith('#fk:')) { const d = Number(q.slice(4)); if (d) fkFlytta(d); else fkStang(); return null; }
      if (q.startsWith('#ga:')) { fkStang(); q = q.slice(4); } else if (!iSok && fkOppna(q)) return null;
      // (en rad med bara förklaringen leder ingen annanstans)
      if (q.startsWith('#ord:')) return null;
      if (iSok) { inp.value = ''; markor(); }
      if (q === '#bak') { if (iSok) { visa(fore, true); return null; } return tillbaka(); }
      if (q === '#stang') return o.close();
      if (q.startsWith('#sido:')) return sido(Number(q.slice(6)));
      if (q.startsWith('#flik:')) { A.bak = []; visa(vyAv(q), true); return null; }
      // en flik i kortet: byts på plats (Esc går tillbaka dit man kom ifrån)
      if (q.startsWith('#del:')) { if (A.vy.lag || A.vy.spelare || A.vy.mote) visa({ ...A.vy, del: q.slice(5) }, true); return null; }
      const vy = vyAv(q);
      if (iSok) A.vy = fore;
      // från ett tals lista till kortet: fliken där talet står
      if (vy && A.vy.lista && (vy.lag || vy.spelare)) vy.del = flikFor(A.vy.slag === 'spelare' ? 'spelare' : 'lag', A.vy.lista);
      if (vy && (q.startsWith('#div:') || q.startsWith('#spelarna:') || (q.startsWith('#lista:') && A.vy.lista)) && A.vy.flik === 'lagen' && !A.vy.lag && !A.vy.spelare) { visa(vy, true); return null; }
      if (vy) {
        if (vy.mote) loadMatches();
        ga(vy, !iSok);
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
      A.kat = 'alla';
      A.lista = hits.slice(0, LISTA);
      if (hits.length === 1) { A.vy = { flik: 'sok' }; tryck('#1'); return; }
      visa({ flik: 'sok', eko, hits }, true);
      valj(0, false);
    }

    // datan har kommit (eller ändrats): terminalen och skärmen i rummet
    function draw() {
      const R = bygg(A.vy);
      const h = html(R.ut);
      // (också när bara det som står still överst har ändrats: kortets flikar)
      const ht = html(R.topp);
      if (A.on && (h !== A.ut || ht !== A.topp)) {
        const y = rull.scrollTop;
        const sel = A.sel;
        A.sk++;
        A.ut = h;
        A.topp = ht;
        ut.innerHTML = h;
        topp.innerHTML = ht;
        fot.innerHTML = fotHtml(R);
        rull.scrollTop = y;
        A.R = R;
        valj(sel, false);
        spoilerRad();
        if (A.fk) fkRita();
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
    rull.addEventListener('scroll', () => { if (A.fk) fkPlats(); }, { passive: true });

    // ↑/↓: raden som Enter öppnar (de tryckbara raderna och namnen i ordning)
    const valbara = () => [...ut.querySelectorAll('[data-q]')].filter((el) => !el.closest('.kat'));
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
      // rutan med förklaringen: Esc stänger, ↑/↓ bläddrar, Enter går till
      // listan; en annan tangent stänger den och gör som vanligt
      if (A.fk) {
        if (k === 'Escape') { fkStang(); return true; }
        if (k === 'ArrowUp' || k === 'ArrowDown') { fkFlytta(k === 'ArrowDown' ? 1 : -1); return true; }
        if (k === 'Enter' && !inp.value.trim()) { if (A.fk.lista) tryck(`#ga:${A.fk.q}`); else fkStang(); return true; }
        if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(k)) fkStang();
      }
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
      // i sökningen: kategorierna
      if (k === 'Tab' && iSok) { bytKat(e.shiftKey ? -1 : 1); return true; }
      // i ett kort: kortets flikar
      const dl = A.R && A.R.delar;
      if (k === 'Tab' && dl && dl.length > 1) {
        const i = dl.indexOf(A.R.del);
        visa({ ...A.vy, del: dl[(i + (e.shiftKey ? -1 : 1) + dl.length) % dl.length] }, true);
        return true;
      }
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
      helaRader();
    }
    // Rutan med raderna rymmer ett helt antal rader (resten blir luft ovanför
    // sökraden), och rullningen stannar på en rad (scroll-snap i
    // rum-register.css). En rad som står halvt avklippt nertill tappar det som
    // går under linjen: ett komma utan sin svans ser ut som en punkt (+0,21
    // blev +0.21 längst ner i en lista).
    function helaRader() {
      if (!ov.classList.contains('framme')) return;
      Object.assign(rull.style, { flex: '', height: '', marginBottom: '' });
      const p = document.createElement('div');
      p.className = 'tr';
      p.textContent = 'M';
      ut.appendChild(p);
      const rad = p.getBoundingClientRect().height;
      p.remove();
      const h = rull.getBoundingClientRect().height;
      if (!rad || !h) return;
      const n = Math.max(1, Math.floor((h + 0.5) / rad));
      Object.assign(rull.style, { flex: 'none', height: `${n * rad}px`, marginBottom: `${h - n * rad}px` });
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
      fkStang();
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
      if (A.fk && !e.target.closest('.reg-fk, [data-q]')) { fkStang(); if (mus.matches) inp.focus({ preventScroll: true }); return; }
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
