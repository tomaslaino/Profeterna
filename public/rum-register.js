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
//              bra de fem motståndarna var i snitt, 0–100 som deras chans
//              mot den egna divisionens mittenlag, ur matchens fil –
//              styrkan, motståndet, favoritskapet och mot oddsen, med lagets
//              plats i sin division; de tio senaste i snitt, och för en
//              landskamp i Nations Leagues sista omgångar SPELAR FÖR; de tio
//              senaste matcherna med motståndets styrka på sidan MATCH FÖR
//              MATCH), MÅLEN (hemmalaget hemma mot bortalaget borta, och på
//              sidan ALLA MATCHER målen, nollorna, skytten och de främsta i
//              assist och segermål), xG (chanserna, turen och kryssen). En
//              flik som inte ryms på skärmen har sidor, radioknappar under
//              flikraden (sedan 2026-11-17, se sidorna()), LÄGET (vilan, nästa match, skadorna och
//              domaren) och MÖTENA (förra mötet med lagens siffror, när det
//              var högst ett halvår sedan, och mötena de senaste fem åren). Det
//              bättre talet i varje par lyser och
//              det sämre är svagt (SKILJER), och varje etikett öppnar en
//              förklaring. Sedan 2026-11-16 är talen som säger vem som är
//              bättre en dragkamp: en delad stapel mellan lagens tal, med
//              samma mått i alla flikar (dragRad vid forraMotet)
//   REGISTRET  lagen och spelarna (fliken hette LAGEN till 2026-11-13; i
//              koden heter den fortfarande lagen). Underraden säger vad och
//              var: LAG eller SPELARE, och divisionen. LAG är divisionens
//              tabell (sedan 2026-11-16; till dess lagen i bokstavsordning,
//              se lagen nedan; inget lag markeras för att det står i
//              kupongen, sedan 2026-11-13); SPELARE är divisionens spelare
//              från A till Ö med plats, lag, speltid och mål. Ett lag öppnar
//              lagkortet och en spelare spelarkortet, med namnet och
//              flikarna stilla överst (sedan 2026-11-13; Tab byter):
//              laget ÖVERSIKT (nästa match, formen, styrkan; formens matcher
//              på sidan MATCH FÖR MATCH), xG, SPELET,
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
// Statistik och matchsidan visar om ett lag eller en spelare – utom
// skytteligan, som står på tv:n (tabellen står sedan 2026-11-16 också under
// LAG) – i avsnitt med platsen i divisionen
// efter, och etiketten leder till listan: divisionen ordnad efter talet
// (#lista:lag:pl:skapar), där ←/→ bläddrar till förra och nästa tal.
// Sedan 2026-11-16 är listan en rankning med en stapel per rad, och platsen
// efter ett tal (i korten mätaren och platsen, i matchakten platsen) leder
// dit med laget eller spelaren markerad (#plats:lag:pl:skapar:Arsenal);
// Esc går tillbaka till kortet.
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
  // cuperna i schemat (matchens fil) som på sajten; Europacuperna heter CL, EL och ECL
  const TAV = { EFL: 'Ligacupen', FAC: 'FA-cupen' };
  // (och kortare, när namnet inte ryms i matchaktens spalt; annars förkortningen)
  const TAVK = { VSK: 'Vänskap', ECL: 'Conference' };
  // flest träffar i en lista
  const LISTA = 20;
  // så många rader skrivs en och en; resten av en lång lista kommer på en gång
  const SKRIV = 50;
  // duken på disken (scenens px), där datorn syns med sin skugga (åt höger till
  // strax före korktavlan, x 1280,5: med ryggen mot väggen når datorns bakre hörn x 1269)
  const BOX = { x: 1136, y: 426, w: 142, h: 112 };
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
  // målskillnaden och xG-skillnaden per match, xG och skotten på mål per match
  // (lagets egna och motståndarnas, var för sig) och andelen matcher som favorit.
  // Kryssen, turen, motståndet, nästa match och skytten säger inte vem som är
  // bättre och står alltid som vanligt.
  // För landslagen (som inte har tavlans tal): poängen i gruppen (en seger),
  // poängen per match i Nations League och alla landskamper (V-O-F), målen
  // som för klubbarna och marknadens chans som favoritskapet.
  const SKILJER = { form: 2, vila: 2, vilaSnitt: 1, styrka: 0.15, odds: 1.5, mal: 0.25, xg: 0.2, xgMatch: 0.15, skott: 0.5, favorit: 0.15, poang: 3, ppm: 0.5 };
  // vilken elva spelarnas vila gäller (src/fetchers/s365vila.js), svagt under dagarna
  const ELVA_SORT = { uttagen: 'UTTAGEN ELVA', trolig: 'TROLIG ELVA', beräknad: 'BERÄKNAD ELVA', förra: 'FÖRRA ELVAN' };
  // matchaktens etiketter (den längsta, STORA CHANSER i förra mötet, är 13
  // tecken) och lagens tal på var sida om dragkampens stapel (24:E −0,89)
  const AKTEN_L = 15;
  const DRAG_V = 10;
  // spegelns etikettspalt i matchakten (den längsta, TRUPPENS VILA, är 13
  // tecken; på datorn ett tecken luft till på var sida) och ett lags halva
  // som längst
  const SPEGEL_L = 13;
  const SPEGEL_S = 22;

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
  // Bitar i följd med samma fråga blir en tryckbar bit (mätaren och platsen
  // i korten, som leder till rankningen): ett ställe att trycka på och en
  // rad för ↑/↓. Skärmen i rummet (rum-dator.js) läser bitarna en och en.
  function bitar(r) {
    let s = '';
    for (let i = 0; i < r.length;) {
      const q = r[i][2];
      let j = i + 1;
      while (q && j < r.length && r[j][2] === q) j++;
      s += j - i > 1 ? `<span class="a" data-q="${esc(q)}">${r.slice(i, j).map(([t, k]) => bit([t, k])).join('')}</span>` : bit(r[i]);
      i = j;
    }
    return s;
  }

  function html(rader) {
    return rader.map((r) => (r.length === 1 && r[0][1] === 'hr' ? '<div class="tr hr"></div>'
      : `<div class="tr${r.q ? ' a' : ''}${r.kat ? ' kat' : ''}${r.kl ? ` ${r.kl}` : ''}"${r.q ? ` data-q="${esc(r.q)}"` : ''}${r.st ? ` style="${esc(r.st)}"` : ''}>${bitar(r)}</div>`)).join('');
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
        // (filens tabell kan vara äldre än ESPN:s: hämta den direkt igen)
        A.tabellAt = 0;
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
    // Nations Leagues tabell direkt från ESPN (sedan 2026-11-14), så att den
    // följer matcherna i stället för bygget (landslag.json hämtar tabellen
    // högst en gång per körning, var 30:e minut). Så länge grupperna eller ett
    // lagkort visas hämtas den om varje minut, var 30:e sekund medan en match
    // pågår. Två källor:
    //   tabellen   ESPN:s tabell – den officiella ordningen, men ändras först
    //              när matchen är slut (och ibland en stund efter)
    //   matcherna  ligafasens matcher (september–november) med resultaten och
    //              liveställningen; ur dem räknas en egen tabell (raknaGrupp)
    // Per grupp: pågår en match visas den egna tabellen med ställningen just
    // nu (GRUPP A4 LIVE). Annars ESPN:s tabell när den har räknat in alla
    // matcher, och den egna medan ESPN släpar efter slutsignalen. Ingen grupp
    // får färre spelade matcher än i filen; svarar inte ESPN gäller filen.
    const ESPN_NL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations';
    const ESPN_TABELL = 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.nations/standings';
    // ligafasens månader hittills, YYYYMM: september–november det år säsongen började
    function nlManader(now = new Date()) {
      const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      const nu = now.getFullYear() * 100 + now.getMonth() + 1;
      return [9, 10, 11].map((m) => y * 100 + m).filter((m) => m <= nu).map(String);
    }
    // ligafasens matcher: de färdiga månaderna en gång, den pågående varje gång
    function nlMatcher() {
      const man = nlManader();
      A.nlMan = A.nlMan || new Map();
      return Promise.all(man.map((m, i) => (i < man.length - 1 && A.nlMan.has(m) ? A.nlMan.get(m)
        : fetch(`${ESPN_NL}/scoreboard?dates=${m}&limit=1000`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then((j) => {
            const ms = (j.events || []).map((e) => {
              const c = e.competitions && e.competitions[0];
              const st = (e.status && e.status.type) || {};
              const h = c && c.competitors.find((t) => t.homeAway === 'home');
              const a = c && c.competitors.find((t) => t.homeAway === 'away');
              if (!h || !a) return null;
              const live = st.state === 'in';
              return {
                h: String(h.team.id), a: String(a.team.id), live, klar: !!st.completed,
                hs: Number(h.score), as: Number(a.score),
              };
            }).filter((m) => m && (m.klar || m.live) && fin(m.hs) && fin(m.as));
            A.nlMan.set(m, ms);
            return ms;
          })))).then((l) => l.flat());
    }
    // En grupps tabell ur matcherna (de pågående med ställningen just nu).
    // Ordningen som i Nations League: poäng, sedan inbördes möten (poäng,
    // målskillnad, gjorda mål), målskillnad, gjorda mål, gjorda mål borta och
    // vinster; därefter tabellens ordning hittills. (UEFA prövar de inbördes
    // mötena om igen bland de lag som fortfarande står lika – det görs inte här.)
    function raknaGrupp(g, M) {
      const ids = g.lag.map((t) => String(t.espnId));
      const ms = M.filter((m) => ids.includes(m.h) && ids.includes(m.a));
      const S = new Map(ids.map((id, i) => [id, { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, borta: 0, live: false, forra: i }]));
      const spela = (s, f, a, borta, live) => {
        s.played++; s.gf += f; s.ga += a; s.gd = s.gf - s.ga;
        if (borta) s.borta += f;
        if (f > a) { s.won++; s.points += 3; } else if (f === a) { s.drawn++; s.points++; } else s.lost++;
        if (live) s.live = true;
      };
      for (const m of ms) {
        spela(S.get(m.h), m.hs, m.as, false, m.live);
        spela(S.get(m.a), m.as, m.hs, true, m.live);
      }
      const inbordes = (lag) => {
        const T = new Map(lag.map((id) => [id, { p: 0, gd: 0, gf: 0 }]));
        for (const m of ms) {
          if (!T.has(m.h) || !T.has(m.a)) continue;
          const h = T.get(m.h);
          const a = T.get(m.a);
          h.gf += m.hs; a.gf += m.as; h.gd += m.hs - m.as; a.gd += m.as - m.hs;
          if (m.hs > m.as) h.p += 3; else if (m.hs < m.as) a.p += 3; else { h.p++; a.p++; }
        }
        return T;
      };
      const ordning = [...ids].sort((x, y) => S.get(y).points - S.get(x).points || S.get(x).forra - S.get(y).forra);
      for (let i = 0; i < ordning.length;) {
        let j = i + 1;
        while (j < ordning.length && S.get(ordning[j]).points === S.get(ordning[i]).points) j++;
        if (j - i > 1) {
          const blk = ordning.slice(i, j);
          const T = inbordes(blk);
          blk.sort((x, y) => {
            const [a, b, s, t] = [T.get(x), T.get(y), S.get(x), S.get(y)];
            return b.p - a.p || b.gd - a.gd || b.gf - a.gf || t.gd - s.gd || t.gf - s.gf || t.borta - s.borta || t.won - s.won || s.forra - t.forra;
          });
          ordning.splice(i, j - i, ...blk);
        }
        i = j;
      }
      const rad = new Map(ordning.map((id, i) => {
        const { played, won, drawn, lost, gf, ga, gd, points, live } = S.get(id);
        return [id, { rank: i + 1, played, won, drawn, lost, gf, ga, gd, points, live }];
      }));
      return { rader: ids.map((id) => rad.get(id)), live: ms.some((m) => m.live), spelade: ms.length };
    }
    function loadTabell() {
      if (!A.land || !A.land.grupper.length || A.tabellLaddar || Date.now() - (A.tabellAt || 0) < (A.tabellVanta || 60000)) return;
      const tabell = fetch(ESPN_TABELL, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .catch((err) => { console.warn('Registret: ESPN:s tabell kunde inte hämtas', err); return null; });
      const matcher = nlMatcher().catch((err) => { console.warn('Registret: ESPN:s matcher kunde inte hämtas', err); return null; });
      A.tabellLaddar = Promise.all([tabell, matcher]).then(([j, M]) => {
        const espn = new Map();
        for (const g of (j && j.children) || []) {
          for (const e of (g.standings && g.standings.entries) || []) {
            const s = {};
            for (const x of e.stats || []) s[x.name] = x.value;
            if (e.team && fin(s.gamesPlayed)) {
              espn.set(String(e.team.id), {
                rank: s.rank, played: s.gamesPlayed, won: s.wins, drawn: s.ties, lost: s.losses,
                gf: s.pointsFor, ga: s.pointsAgainst, gd: s.pointDifferential, points: s.points, live: false,
              });
            }
          }
        }
        const summa = (l) => l.reduce((n, x) => n + x.played, 0);
        let andrat = false;
        let live = false;
        for (const g of A.land.grupper) {
          const fore = JSON.stringify([g.live, g.lag]);
          const fil = summa(g.lag);
          const ny = g.lag.map((t) => espn.get(String(t.espnId)));
          const espnOk = !ny.some((x, i) => !x || x.played < g.lag[i].played);
          let R = M ? raknaGrupp(g, M) : null;
          if (R && summa(R.rader) < fil) R = null; // (matcherna saknas delvis)
          let val = null;
          if (R && R.live) val = R.rader;
          else if (espnOk && summa(ny) >= (R ? summa(R.rader) : fil)) val = ny;
          else if (R && summa(R.rader) > fil) val = R.rader;
          g.live = !!(R && R.live);
          live = live || g.live;
          if (val) {
            g.lag.forEach((t, i) => {
              Object.assign(t, val[i]);
              const kort = A.land.lag.get(t.lag);
              if (kort && kort.tabell) Object.assign(kort.tabell, { rank: t.rank, played: t.played, points: t.points, gd: t.gd });
            });
            g.lag.sort((a, b) => a.rank - b.rank);
          }
          if (JSON.stringify([g.live, g.lag]) !== fore) andrat = true;
        }
        A.tabellVanta = live ? 30000 : 60000;
        if (andrat) draw();
      })
        .catch((err) => console.warn('Registret: tabellen kunde inte räknas', err))
        .finally(() => {
          A.tabellLaddar = null;
          A.tabellAt = Date.now();
          // om igen, om grupperna eller ett lagkort fortfarande visas
          clearTimeout(A.tabellT);
          A.tabellT = setTimeout(() => { if (A.on) draw(); }, (A.tabellVanta || 60000) + 1000);
        });
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
    // 0–100 (opp.level i matchens fil: chansen mot divisionens mittenlag). null tills filen har hämtats och när
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

    // Förra mötet (sedan 2026-11-15, önskemål från gänget: "var det en
    // chansrik affär, vem hade mest bollinnehav, blev det många kort";
    // användarens val bland tre skisser: Matchrapporten). När lagen har mötts
    // det senaste halvåret (lastMeeting i matchens fil) står lagens siffror
    // från det mötet överst i MÖTENA. Samma kväll, efter "mer pedagogiskt och
    // överblickbart", användarens val A Dragkampen bland fyra skisser: varje
    // tal har en delad stapel mellan lagens tal – lika lång på alla rader,
    // delad där lagens andelar möts, med ett tomt tecken i skarven – så att
    // man ser hur stor del vart lag hade utan att läsa talen. Det bättre
    // lagets del och tal lyser och det andras är svagt (målen, xG, chanserna
    // och skotten); bollinnehavet och korten är gröna på båda sidor. Talen i
    // den ordning de säger mest om matchen: målen, xG och de stora chanserna
    // först, bollinnehavet och korten sist. Röda kort bara när något lag fick
    // ett. Dolt resultat: ? och en tom stapel. Sedan listan med de senaste mötena.
    //
    // Dragkampen gällde hela matchakten en dag (2026-11-16, användarens val B
    // Dragkampen bland tre skisser: Mittlinjen, Dragkampen och Lamporna och
    // mätarna); samma kväll valde användaren spegeln för matchakten i stället
    // (spegel() nedan), och dragkampen står kvar i förra mötet. En dragkampsrad har etiketten,
    // det vänstra lagets tal högerställt mot stapeln, stapeln och det högra
    // lagets tal; platsen i divisionen står utanför talet (1:A +0,94 … +0,12
    // 14:E). En textrad (namn, V-O-F, tal som inte säger vem som är bättre)
    // har det vänstra lagets text där talen börjar och det högra lagets längst
    // ut till höger, som lagens namn överst. I telefonen står etiketten på en
    // egen rad i mitten och raden under går från kant till kant.
    function dragMatt() {
      const tel = A.bred < 56;
      const L = tel ? 0 : AKTEN_L;
      const V = DRAG_V;
      const n = Math.max(8, Math.min(36, A.bred - L - 2 * V - 2));
      return { tel, L, V, n, w: L + V + 1 + n + 1 + V, halv: Math.floor((A.bred - L - 1) / 2) };
    }
    const dragLen = (b) => b.reduce((s, y) => s + y[0].length, 0);
    const dragStreck = (k, kl) => (k > 0 ? [[' '.repeat(k), kl]] : []);
    // etiketten: först på raden på datorn, på en egen rad i mitten i telefonen
    function dragEtikett(G, etikett, q) {
      if (!G.tel) return { fore: [[etikett || '', 'd', etikett ? q : null], [pad('', G.L - (etikett || '').length), '']], over: [] };
      if (!etikett) return { fore: [], over: [] };
      return { fore: [], over: [rad([pad('', Math.max(0, Math.floor((G.w - etikett.length) / 2)))], [etikett, 'd', q])] };
    }
    // en bit [text, klass, fråga] ur en text eller en bit, ljus eller svag efter b
    const dragBit = (x, j, b) => {
      const p = Array.isArray(x) ? x : [x, ''];
      return b < 0 ? p : [p[0], j === b ? 'v' : 'd', p[2]];
    };
    // En dragkampsrad: t är lagens tal, andel det vänstra lagets del av
    // stapeln (0–1; 'tom' ger en tom stapel för dolda resultat), b laget med
    // det bättre talet (-1: båda gröna) och ytter en bit utanför talet
    // (platsen i divisionen). Utan andel blir det en textrad.
    function dragRad(G, etikett, t, andel, b, q, ytter) {
      if (andel == null || (andel !== 'tom' && !Number.isFinite(andel))) return dragText(G, etikett, t, q, b, ytter);
      const E = dragEtikett(G, etikett, q);
      const y = (j) => (ytter && ytter[j] && ytter[j][0] ? ytter[j] : null);
      const v = [0, 1].map((j) => dragBit(t[j], j, b));
      const vanster = y(0) ? [y(0), [' ', ''], v[0]] : [v[0]];
      const hoger = y(1) ? [v[1], [' ', ''], y(1)] : [v[1]];
      const n = G.n;
      const kl = (j) => (b < 0 ? 'mt1' : j === b ? 'mtv' : 'mtd');
      // det vänstra lagets del av n - 1 tecken (det sista är skarven)
      const f0 = andel === 'tom' ? 0 : Math.round((n - 1) * Math.min(1, Math.max(0, andel)));
      const stapel = andel === 'tom' ? dragStreck(n, 'mt0') : [...dragStreck(f0, kl(0)), [' ', ''], ...dragStreck(n - 1 - f0, kl(1))];
      return [...E.over, rad(...E.fore, [pad('', Math.max(0, G.V - dragLen(vanster))), ''], ...vanster, [' ', ''], ...stapel, [' ', ''], ...hoger)];
    }
    // En textrad: det vänstra lagets text där talen börjar, det högra lagets
    // högerställd längst ut (var och en högst en halv rad)
    function dragText(G, etikett, t, q, b = -1, ytter) {
      const E = dragEtikett(G, etikett, q);
      const max = Math.max(4, Math.floor((G.w - G.L - 1) / 2));
      const sida = (j) => {
        const y = ytter && ytter[j] && ytter[j][0] ? ytter[j] : null;
        const p = dragBit(t[j], j, b);
        const v = [String(p[0]).slice(0, Math.max(1, max - (y ? y[0].length + 1 : 0))), p[1], p[2]];
        return y ? (j ? [v, [' ', ''], y] : [y, [' ', ''], v]) : [v];
      };
      const v = sida(0);
      const h = sida(1);
      return [...E.over, rad(...E.fore, ...v, [pad('', Math.max(1, G.w - G.L - dragLen(v) - dragLen(h))), ''], ...h)];
    }
    // lagens namn överst (leder till lagkorten): det vänstra där talen börjar,
    // det högra längst ut till höger
    function dragNamn(G, lag) {
      const max = Math.floor((G.w - G.L - 1) / 2);
      const namn = lag.map((y) => kort(y).slice(0, max));
      return rad([pad('', G.L)], [namn[0], '', `#lag:${lag[0]}`], [pad('', Math.max(1, G.w - G.L - namn[0].length - namn[1].length)), ''], [namn[1], '', `#lag:${lag[1]}`]);
    }
    // ett avsnitts rubrik med ett streck efter, lika långt som raderna
    function dragRubrik(G, namn, q = null) {
      return rad([namn, 'd', q], ...(G.w - 1 > namn.length + 2 ? [[' ', ''], [' '.repeat(G.w - namn.length - 2), 'ln']] : []));
    }

    // Spegeln (sedan 2026-11-16, användarens val B Staplarna bland fyra
    // skisser – Spegeln, Staplarna, Mätarna och Övertaget – "men skippa
    // staplar där det egentligen kanske inte behövs", och sedan "byt till
    // spegeln" i stället för dragkampen): matchakten står i mitten av
    // skärmen med etiketten i mitten och lagen speglade runt den –
    // hemmalagets tal högerställda mot etiketten och bortalagets
    // vänsterställda, som tavlan i matchlistan – och rubrikerna står i mitten
    // med ett streck på båda sidor. Platsen i divisionen står utanför talet
    // (1:A  +0,94 … +0,12  14:E). Bara V-O-F har en stapel (vinsterna
    // fyllda, de oavgjorda svagare och förlusterna tomma, inifrån och ut):
    // där säger stapeln något som siffrorna inte säger direkt, hur ofta laget
    // kryssar. LÄGET:s mätare står utanför dagarna på samma sätt. Samma mått
    // i ÖVERSIKT, MÅLEN, xG och LÄGET, så att lagen står still när man byter
    // flik; förra mötet i MÖTENA är kvar som dragkamp.
    // spegel(): Lc etikettens spalt, S ett lags halva (med mellanrummet mot
    // etiketten), B hela blocket och M luften till vänster om det
    function spegel() {
      const tel = A.bred < 56;
      const Lc = tel ? SPEGEL_L : SPEGEL_L + 2;
      const S = Math.min(SPEGEL_S, Math.floor((A.bred - Lc) / 2));
      const B = 2 * S + Lc;
      return { tel, Lc, S, B, M: Math.max(0, Math.floor((A.bred - B) / 2)) };
    }
    // en rad: hemmalagets bitar högerställda mot etiketten, etiketten i mitten (q: förklaringen) och bortalagets bitar
    function spRad(G, vanster, etikett, q, hoger) {
      const e = etikett || '';
      const v = Math.max(0, Math.floor((G.Lc - e.length) / 2));
      return rad([pad('', Math.max(0, G.M + G.S - 1 - dragLen(vanster))), ''], ...vanster, [pad('', 1 + v), ''],
        ...(e ? [[e, 'd', q]] : []), [pad('', 1 + Math.max(0, G.Lc - e.length - v)), ''], ...hoger);
    }
    // En rad med lagens tal: b är laget med det bättre talet (ljust, det andra
    // svagt), ytter en bit utanför talet (platsen i divisionen, formens
    // motstånd) och vof lagens { w, d, l } för V-O-F-stapeln utanför talet
    function spTal(G, etikett, t, b, q, ytter, vof) {
      const v = [0, 1].map((j) => dragBit(t[j], j, b));
      const y = (j) => (ytter && ytter[j] && ytter[j][0] ? ytter[j] : null);
      const harY = y(0) || y(1);
      if (!harY && !vof) return spRad(G, [v[0]], etikett, q, [v[1]]);
      // (talen lika breda, så att platserna och staplarna står i rad)
      const vw = Math.max(vof ? 6 : 4, ...v.map((x) => String(x[0]).length));
      const tal = (j) => [j ? pad(v[j][0], vw) : padL(v[j][0], vw), v[j][1], v[j][2]];
      const sida = (j) => {
        if (vof) {
          const st = vof[j] ? vofStapel(vof[j], G.S - 2 - vw, j === 1) : [];
          if (!st.length) return [tal(j)];
          return j ? [tal(j), [' ', ''], ...st] : [...st, [' ', ''], tal(j)];
        }
        const yt = y(j) ? [y(j)] : [];
        const luft = [pad('', 4 - (y(j) ? y(j)[0].length : 0)), ''];
        return j ? [tal(j), ['  ', ''], ...yt, luft] : [luft, ...yt, ['  ', ''], tal(j)];
      };
      return spRad(G, sida(0), etikett, q, sida(1));
    }
    // ett avsnitts rubrik i mitten med ett streck på båda sidor, över hela blocket
    function spRub(G, bitar) {
      const n = dragLen(bitar) + 2;
      if (n + 4 > G.B) return rad([pad('', G.M), ''], ...bitar);
      const v = Math.floor((G.B - n) / 2);
      return rad([pad('', G.M), ''], [' '.repeat(v), 'ln'], [' ', ''], ...bitar, [' ', ''], [' '.repeat(G.B - n - v), 'ln']);
    }
    // en rad i mitten av blocket
    const spMitt = (G, bitar) => rad([pad('', G.M + Math.max(0, Math.floor((G.B - dragLen(bitar)) / 2))), ''], ...bitar);
    // lagens namn (till lagkorten) över spalterna
    const spLag = (G, lag) => spRad(G, [[kort(lag[0]).slice(0, G.S - 1), '', `#lag:${lag[0]}`]], '', null, [[kort(lag[1]).slice(0, G.S - 1), '', `#lag:${lag[1]}`]]);
    // V-O-F ({ w, d, l }) som en stapel av w tecken, inifrån och ut: vinsterna
    // (sv), de oavgjorda (so) och förlusterna (sf). Delarna avrundas så att
    // de blir w tecken (de största resterna uppåt), och en del som finns får
    // minst ett tecken.
    function vofStapel(x, w, hoger) {
      const n = x.w + x.d + x.l;
      if (!n || w < 3) return [];
      const t = [x.w, x.d, x.l];
      const r = t.map((y) => (y * w) / n);
      const h = r.map(Math.floor);
      let kvar = w - h.reduce((a, y) => a + y, 0);
      for (const [, i] of r.map((y, j) => [y - h[j], j]).sort((a, b) => b[0] - a[0])) if (kvar > 0) { h[i]++; kvar--; }
      for (let i = 0; i < 3; i++) {
        if (t[i] > 0 && !h[i]) { const st = h.indexOf(Math.max(...h)); if (h[st] > 1) { h[st]--; h[i] = 1; } }
      }
      const bitar = [['sv', h[0]], ['so', h[1]], ['sf', h[2]]].filter(([, c]) => c > 0).map(([k, c]) => [' '.repeat(c), k]);
      return hoger ? bitar : bitar.reverse();
    }
    const FORRA = [
      ['MÅL', 'mal', String, true], ['xG', 'xg', (x) => num(x, 2), true], ['STORA CHANSER', 'bc', String, true],
      ['SKOTT', 'sh', String, true], ['PÅ MÅL', 'sot', String, true], ['BOLLINNEHAV', 'poss', (x) => `${Math.round(x)} %`, false],
      ['GULA KORT', 'yc', String, false], ['RÖDA KORT', 'rc', String, false],
    ];
    function forraMotet(m, d) {
      const x = d && d.lastMeeting;
      if (!x || !x.stats || !x.score) return [];
      const lag = [m.home, m.away];
      const st = lag.map((n) => (x.home === n ? x.stats.home : x.away === n ? x.stats.away : null));
      if (!st[0] || !st[1]) return [];
      const mal = lag.map((n) => (x.home === n ? x.score.home : x.score.away));
      const dolj = Boolean(window.Spoiler && Spoiler.hidesDay(x.kickoff));
      const G = dragMatt();
      const plats = x.neutral ? 'PÅ NEUTRAL PLAN' : `${isLand(x.comp) ? 'I' : 'HOS'} ${kort(x.home)}`;
      const titel = `FÖRRA MÖTET · ${up(dag(x.kickoff)).replace(/ \d{4}$/, '')} · ${plats}`;
      const r = [dragRubrik(G, titel, ordQ('forra')), dragNamn(G, lag)];
      const ok = (y) => y != null && Number.isFinite(y);
      for (const [e, k, fmt, battre] of FORRA) {
        const v = k === 'mal' ? mal : st.map((y) => y[k]);
        if (!v.some(ok) || (k === 'rc' && !v.some((y) => y > 0))) continue;
        const b = !dolj && battre && v.every(ok) && v[0] !== v[1] ? (v[0] > v[1] ? 0 : 1) : -1;
        const txt = v.map((y) => (dolj ? '?' : ok(y) ? fmt(y) : '–'));
        const sum = v.every(ok) ? v[0] + v[1] : 0;
        r.push(...dragRad(G, e, txt, dolj || !(sum > 0) ? 'tom' : v[0] / sum, b, ordQ(`forra-${k}`)));
      }
      return [...r, tom()];
    }

    // Mötena de senaste fem åren (sedan 2026-11-16, användarens fråga "kan man
    // ha mötena de senaste 5 åren?"; till dess de elva senaste, och för
    // landslagen bara från hösten 2024): säsongens och de tidigare, alla som
    // sajten har inom fem år före avspark (pastMeetings i matchens fil).
    function moten(m) {
      const r = [rad(['MÖTENA DE SENASTE FEM ÅREN', 'd', ordQ('moten')])];
      const d = A.match.get(m.id);
      if (d === undefined) return [...r, prickar('HÄMTAR', '')];
      r.unshift(...forraMotet(m, d));
      const list = !d ? [] : [
        ...(d.meetings || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.kickoff), x, when: x.kickoff, comp: x.compShort, hide: window.Spoiler && Spoiler.hidesDay(x.kickoff) })),
        ...((d.pastMeetings && d.pastMeetings.list) || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.date), x, when: x.date, comp: x.compShort, hide: false })),
      ].sort((a, b) => b.t - a.t);
      if (!list.length) return [...r, rad('HAR INTE MÖTTS PÅ FEM ÅR')];
      const n = { V: 0, O: 0, F: 0 };
      for (const { x, when, comp, hide } of list) {
        if (!hide) n[letter(x, m.home)]++;
        r.push(rad([`${pad(up(dag(when)), 12)}${pad(up(comp || ''), 4)}`, 'd'], `${kort(x.home)} – ${kort(x.away)}  `, [hide ? '?' : `${x.score.home}–${x.score.away}`, 'v']));
      }
      r.push(rad([`${kort(m.home)}: `, 'd'], `${n.V} V · ${n.O} O · ${n.F} F`));
      return r;
    }

    // De tio senaste (sedan 2026-11-16, på sidan MATCH FÖR MATCH): lagets tio senaste
    // matcher i alla tävlingar före matchen, senaste först, med motståndets
    // styrka 0–1 (niva) – ur matchens fil (senaste), och till dess den har
    // hämtats ur matcherna, då utan styrkan. f och a är lagets mål och
    // motståndarnas efter 90 minuter, null när resultatet är dolt.
    function tioMatcher(m, side) {
      const namn = m[side];
      const d = A.match.get(m.id);
      const T = d && d.teams && d.teams[side];
      if (T && T.senaste) {
        return T.senaste.slice(0, 10).map((y) => {
          const dolt = Boolean(window.Spoiler && Spoiler.hidesDay(y.date));
          return { res: dolt ? '?' : y.result || '?', f: dolt ? null : y.gf, a: dolt ? null : y.ga, h: y.home, mot: y.opponent, tav: y.comp, niva: y.opp && y.opp.level != null ? y.opp.level : null };
        });
      }
      const before = Date.parse(m.kickoff);
      return (A.byTeam.get(namn) || []).filter((x) => x.completed && Date.parse(x.kickoff) < before).slice(0, 10).map((x) => {
        const dolt = Boolean(window.Spoiler && Spoiler.hidden(x));
        const s = x.score90 || x.score;
        const h = x.home === namn;
        return { res: dolt ? '?' : letter(x, namn) || '?', f: dolt || !s ? null : h ? s.home : s.away, a: dolt || !s ? null : h ? s.away : s.home, h, mot: h ? x.away : x.home, tav: null, niva: null };
      });
    }
    // de tio senaste i snitt: poängen per match och målen (null när något
    // resultat är dolt eller saknas, som formens poäng) och motståndet 0–99
    // (när högst två av matcherna saknar styrka)
    function tioSnitt(l) {
      if (!l.length) return null;
      const alla = l.every((y) => y.res && 'VOF'.includes(y.res) && y.f != null && y.a != null);
      const nv = l.filter((y) => y.niva != null);
      return {
        n: l.length,
        ppm: alla ? l.reduce((t, y) => t + (y.res === 'V' ? 3 : y.res === 'O' ? 1 : 0), 0) / l.length : null,
        f: alla ? l.reduce((t, y) => t + y.f, 0) : null,
        a: alla ? l.reduce((t, y) => t + y.a, 0) : null,
        mott: nv.length && nv.length >= l.length - 2 ? Math.min(99, Math.round((100 * nv.reduce((t, y) => t + y.niva, 0)) / nv.length)) : null,
      };
    }
    // ett lags rader i listan, w tecken breda: utfallet, resultatet (rm
    // tecken, lika för båda lagen), H eller B, motståndaren, styrkan och en
    // mätare för styrkan (fylld till styrkan, tom när den är okänd)
    // (en rads bredd utan avkortning: namnet minst nio tecken, så att mätaren får sex)
    const tioBredd = (y, rm) => 15 + rm + Math.max(9, kort(y.mot).length);
    function tioCeller(l, w, rm) {
      const fast = 9 + rm;
      const mw = Math.max(3, Math.min(6, w - fast - 9));
      const nw = Math.max(4, w - fast - mw);
      return l.map((y) => {
        const namn = kort(y.mot).slice(0, nw);
        const st = y.niva == null ? null : Math.min(99, Math.round(100 * y.niva));
        const fy = st == null ? 0 : Math.round(mw * y.niva);
        return [[y.res, y.res === 'V' ? 'v' : ''], [` ${pad(y.f != null && y.a != null ? `${y.f}–${y.a}` : '', rm)}`, ''], [` ${y.h ? 'H' : 'B'} `, 'd'],
          [namn, '', lagOf(y.mot) || landOf(y.mot) ? `#lag:${y.mot}` : null], [pad('', nw - namn.length), ''],
          [` ${padL(st == null ? '–' : String(st), 2)} `, st == null ? 'd' : ''], ...dragStreck(fy, 'mt1'), ...dragStreck(mw - fy, 'mt0')];
      });
    }

    // Lagens listor i telefonen (de tio senaste på sidan MATCH FÖR MATCH),
    // där de inte ryms sida vid sida: under varandra med lagets namn
    // över sin lista och en tom rad mellan lagen, båda listorna lika breda och
    // tillsammans i mitten av blocket, så att spalterna står i rad. Bredden
    // är den bredaste radens (bredd), högst blocket; celler(l, w) ger ett
    // lags rader. (Till 2026-11-16 stod det högra lagets lista högerställd,
    // och listorna hamnade förskjutna mot varandra.)
    function underVarandra(G, lag, listor, bredd, celler) {
      const w = Math.min(G.B, Math.max(...listor.flat().map(bredd), ...lag.map((n) => kort(n).length)));
      const luft = [pad('', G.M + Math.floor((G.B - w) / 2)), ''];
      const r = [];
      listor.forEach((l, j) => {
        if (!l.length) return;
        if (r.length) r.push(tom());
        r.push(rad(luft, [kort(lag[j]).slice(0, w), 'v', `#lag:${lag[j]}`]));
        for (const c of celler(l, w)) r.push(rad(luft, ...c));
      });
      return r;
    }

    // Vad lagen spelar för i Nations Leagues sista omgångar (sedan
    // 2026-11-15, önskemål från gänget; användarens val bland tre skisser:
    // Raden, med rutan). Gruppens återstående matcher prövas med 1, X och 2
    // (högst fyra, alltså 81 fall), och lagen ordnas som i raknaGrupp: poäng,
    // sedan poängen i de inbördes mötena bland de lika (om igen bland dem som
    // fortfarande står lika), sedan de inbördes mötenas målskillnad och mål
    // när alla de mötena är spelade. Avgör målen i en match som återstår
    // räknas alla platser laget kan hamna på. FOLJD är vad platsen ger i
    // ligan 2026–27 (A: ettan och tvåan till kvartsfinal, treorna och fyrorna
    // jämförs med de andra gruppernas; B: upp, kval om A, kvar, kval om att
    // stanna; C: upp, kval om B, kvar, kvar; D läggs ner och alla går upp).
    // Per lag: det bästa laget kan nå (mal) och vad som räcker (villkor) –
    // eller klart när alla utfall ger samma sak. null när matchen inte är en
    // gruppmatch som återstår.
    const FOLJD = {
      A: ['KVARTSFINAL', 'KVARTSFINAL', 'TREA', 'FYRA'],
      B: ['UPP I A', 'KVAL OM A', 'KVAR I B', 'KVAL OM B'],
      C: ['UPP I B', 'KVAL OM B', 'KVAR I C', 'KVAR I C'],
      D: ['UPP I C', 'UPP I C', 'UPP I C'],
    };
    function insatsen(m) {
      if (m.comp !== 'unl' || m.completed || !A.land || !A.all) return null;
      const g = A.land.grupper.find((x) => `Grupp ${x.id}` === m.round);
      const F = g && FOLJD[g.liga];
      if (!F) return null;
      const lag = g.lag.map((t) => t.lag);
      const ms = A.all.filter((x) => x.comp === 'unl' && x.round === m.round && lag.includes(x.home) && lag.includes(x.away));
      const spelade = ms.filter((x) => x.completed && x.score).map((x) => ({ h: x.home, a: x.away, hs: x.score.home, as: x.score.away }));
      const kvar = ms.filter((x) => !x.completed);
      if (!kvar.some((x) => x.id === m.id) || kvar.length > 4) return null;
      const om = new Map(lag.map((n) => [n, { V: new Set(), O: new Set(), F: new Set() }]));
      // (per lag och eget resultat: platserna i varje fall, för att se om målen eller de andra matcherna avgör)
      const fall = new Map(lag.map((n) => [n, { V: new Set(), O: new Set(), F: new Set() }]));
      for (let c = 0; c < 3 ** kvar.length; c++) {
        const val = kvar.map((x, i) => '1X2'[Math.floor(c / 3 ** i) % 3]);
        const res = [...spelade.map((x) => ({ ...x, t: x.hs > x.as ? '1' : x.hs < x.as ? '2' : 'X', fast: true })), ...kvar.map((x, i) => ({ h: x.home, a: x.away, t: val[i], fast: false }))];
        const poang = (l) => {
          const p = new Map(l.map((n) => [n, 0]));
          for (const x of res) {
            if (!p.has(x.h) || !p.has(x.a)) continue;
            if (x.t === '1') p.set(x.h, p.get(x.h) + 3); else if (x.t === '2') p.set(x.a, p.get(x.a) + 3); else { p.set(x.h, p.get(x.h) + 1); p.set(x.a, p.get(x.a) + 1); }
          }
          return p;
        };
        // (lika också i de inbördes mötena: målen avgör, om de är kända)
        const malen = (blk, pos) => {
          const inb = res.filter((x) => blk.includes(x.h) && blk.includes(x.a));
          if (inb.every((x) => x.fast)) {
            const g2 = new Map(blk.map((n) => [n, [0, 0]]));
            for (const x of inb) { g2.get(x.h)[0] += x.hs - x.as; g2.get(x.a)[0] += x.as - x.hs; g2.get(x.h)[1] += x.hs; g2.get(x.a)[1] += x.as; }
            if (new Set(blk.map((n) => g2.get(n).join('|'))).size === blk.length) {
              return [...blk].sort((a, b) => g2.get(b)[0] - g2.get(a)[0] || g2.get(b)[1] - g2.get(a)[1]).map((n, i) => ({ n, fran: pos + i, till: pos + i }));
            }
          }
          return blk.map((n) => ({ n, fran: pos, till: pos + blk.length - 1 }));
        };
        const ordna = (l, pos) => {
          const p = poang(l);
          const ut = [];
          for (const v of [...new Set(l.map((n) => p.get(n)))].sort((a, b) => b - a)) {
            const blk = l.filter((n) => p.get(n) === v);
            if (blk.length === 1) ut.push({ n: blk[0], fran: pos, till: pos });
            else ut.push(...(blk.length < l.length ? ordna(blk, pos) : malen(blk, pos)));
            pos += blk.length;
          }
          return ut;
        };
        for (const o of ordna(lag, 1)) {
          const i = kvar.findIndex((x) => x.home === o.n || x.away === o.n);
          const egen = i < 0 ? ['V', 'O', 'F'] : [val[i] === 'X' ? 'O' : (val[i] === '1') === (kvar[i].home === o.n) ? 'V' : 'F'];
          for (const r of egen) { for (let q = o.fran; q <= o.till; q++) om.get(o.n)[r].add(q); fall.get(o.n)[r].add(`${o.fran}-${o.till}`); }
        }
      }
      const lagI = (n) => {
        const x = om.get(n);
        const alla = [...new Set([...x.V, ...x.O, ...x.F])].sort((a, b) => a - b);
        const ger = (l) => [...new Set([...l].map((q) => F[q - 1]))];
        if (ger(alla).length === 1) return { n, mal: F[alla[0] - 1], klart: true, etta: alla.length === 1 && alla[0] === 1 };
        const mal = F[alla[0] - 1];
        const sakert = (r) => x[r].size > 0 && [...x[r]].every((q) => F[q - 1] === mal);
        const kan = (r) => [...x[r]].some((q) => F[q - 1] === mal);
        // inte säkert med något resultat: målen avgör när alla fall ger samma
        // platser men lika poäng (lika också inbördes); annars de andra matcherna
        const minst = kan('O') ? 'O' : 'V';
        const malen = [...fall.get(n)[minst]].every((x) => x === [...fall.get(n)[minst]][0]) && [...fall.get(n)[minst]][0].split('-')[0] !== [...fall.get(n)[minst]][0].split('-')[1];
        const villkor = sakert('O') ? 'POÄNG RÄCKER' : sakert('V') ? 'VINST RÄCKER' : malen ? 'MÅLEN AVGÖR' : minst === 'O' ? 'BEHÖVER HJÄLP' : 'VINST + HJÄLP';
        return { n, mal, villkor, minst, klart: false, annars: sakert('V') && (kan('O') || kan('F')) };
      };
      const andra = kvar.filter((x) => x.id !== m.id).map((x) => `${heltNamn(x.home)}–${heltNamn(x.away)}`);
      return { liga: g.liga, grupp: g.id, lag: [lagI(m.home), lagI(m.away)], andra };
    }

    // tävlingen för lagets förra eller nästa match (x, ur schemat i matchens
    // fil) när den inte är lagets egen – för ett landslag när den inte är
    // matchens: 'CHAMPIONS LEAGUE', 'FA-CUPEN', 'VÄNSKAPSLANDSKAMP', och
    // förkortad när den inte ryms på bred tecken ('CL', 'VÄNSKAP')
    function tavlingOf(m, side, x, bred) {
      if (!x || !x.comp) return '';
      const t = lagOf(m[side]);
      const egen = t ? up(t.comp) : isLand(m.comp) ? up(m.comp) : null;
      if (x.comp === egen) return '';
      const hel = up(TAV[x.comp] || x.compName || x.comp);
      return hel.length <= bred ? hel : up(TAVK[x.comp] || TAV[x.comp] || x.comp);
    }
    // lagets bäste skytt (spelarfilen) och hans rad i registret
    function skytten(t) {
      const pt = t && A.P && A.P.lag.get(String(t.espnId));
      const ts = pt && pt.topScorer && pt.topScorer.g ? pt.topScorer : null;
      if (!ts) return null;
      return { ts, vem: A.P.spelare.find((x) => x.p.name === ts.name && String(x.p.teamId) === String(t.espnId)) };
    }

    // Matchakten: allt om matchen på ett ställe, lagen i spegeln (spegel()) – i
    // flikar sedan 2026-11-14 (användarens önskemål: "underkategorier", allt
    // i en lång lista såg rörigt ut). Titeln och flikarna står still överst
    // (R.huvud; tävlingen och avsparken under titeln togs bort 2026-11-17,
    // användarens önskemål: "det tar onödig plats") och lagens namn överst i
    // varje flik. En flik som inte ryms på skärmen har sidor (AKTSIDOR, se
    // sidorna()):
    //   ÖVERSIKT  TALEN: vem är bäst – formen och dess motstånd, de tio
    //             senaste i snitt, styrkan, motståndet, favoritskapet och
    //             poängen mot oddsen (en landskamp: gruppen, poängen och
    //             marknadens chans i stället för styrkan); MATCH FÖR MATCH: de
    //             tio senaste med motståndets styrka
    //   MÅLEN     HEMMA OCH BORTA: hemmalaget hemma mot bortalaget borta; ALLA
    //             MATCHER: målen per match, nollorna och vem som gör målen (en
    //             landskamp: Nations League och alla landskamper, en sida)
    //   xG        chanserna: xG, skotten på mål, målen mot xG, turen och kryssen
    //   LÄGET     vilan, nästa match, matcherna de senaste dagarna, skadorna
    //             och domaren
    //   MÖTENA    mötena de senaste fem åren
    // Samma flikar för alla matcher, så att ←/→ stannar i fliken (och på
    // sidan); en flik utan något att visa är svag. Lagen leder till lagkorten och skyttarna
    // till spelarkorten. Efter tavlans tal står lagets plats i sin division
    // (det som topplistorna visade): 1:A är högst, lika tal delar plats. Det
    // bättre talet i varje par lyser och det sämre är svagt (SKILJER); talen
    // som räknas inom divisionen (styrkan, oddsen, målen, xG och
    // favoritskapet) jämförs bara när lagen spelar i samma, och inget lyser
    // när resultaten är dolda. Varje etikett öppnar en förklaring
    // (rum-register-ord.js): talen med en lista leder dit med Enter
    // (#lista:…), de andra har bara förklaringen (#ord:…).
    const AKTDELAR = [['oversikt', 'ÖVERSIKT'], ['malen', 'MÅLEN'], ['xg', 'xG'], ['laget', 'LÄGET'], ['moten', 'MÖTENA']];
    const AKTSIDOR = {
      oversikt: [['oversikt', 'TALEN'], ['oversikt/2', 'MATCH FÖR MATCH']],
      malen: [['malen', 'HEMMA OCH BORTA'], ['malen/2', 'ALLA MATCHER']],
    };
    const ordQ = (k) => `#ord:${k}`;
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
      // spegelns mått (samma i alla flikar) och ett lags halva för texterna
      const G = spegel();
      const H = G.S - 1;
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
      const sammaDiv = Boolean(T[0] && T[1] && T[0].comp && T[0].comp === T[1].comp);
      const samma = sammaDiv && !S.veil;
      const inom = (f, grans) => (samma ? bast(T.map(f), grans) : -1);
      const jmf = (v, grans) => (land || samma ? bast(v, grans) : -1);
      // En rad med lagens värden (spTal ovanför forraMotet): b är laget med
      // det bättre talet, som lyser medan det andra är svagt; ytter står svagt
      // utanför värdet (platsen i divisionen); vof ger V-O-F-stapeln; q är
      // etikettens förklaring
      const raden = (etikett, v, b = -1, q = null, ytter = null, vof = null) => spTal(G, etikett, v, b, q, ytter, vof);
      // etiketten: talets lista i det första lagets division (lag eller
      // spelare), annars bara förklaringen
      const div0 = (T.find((t) => t && t.comp) || {}).comp;
      const lq = (k, slag = 'lag') => (div0 ? listQ(slag, div0, k) : ordQ(slag === 'spelare' ? `spelare:${k}` : k));
      // tavlans tal med lagets plats i sin division utanför: '1:A +0,94' och
      // '+0,12 14:E' (för landslagen utan platsen, och raden bara när något
      // av lagen har talet). Platsen leder till rankningen i lagets division,
      // med laget och motståndaren markerade (sedan 2026-11-16)
      const tal = (etikett, f, fmt, grans, k) => {
        const v0 = T.map((t) => (t ? f(t) : null));
        if (land && !v0.some(ok)) return null;
        const v = v0.map((x) => (S.veil ? null : x));
        const ytter = v.map((x, j) => {
          if (!ok(x) || land) return null;
          const p = placering(T[j], f);
          const vem = [T[j], T[1 - j]].filter(Boolean).map((t) => t.name).join('|');
          return p ? [ordtal(p), 'd', platsQ('lag', T[j].comp, k, vem)] : null;
        });
        return raden(etikett, v.map((x) => (S.veil ? '?' : ok(x) ? fmt(x) : '–')), grans ? inom(f, grans) : -1, lq(k), ytter);
      };
      // en rad ur lagens värden f(j) = [text, tal att jämföra] (eller null);
      // för landslagen bara när något av lagen har ett värde. Talen jämförs
      // när de får det (kan: landslagen eller samma division); vof(j) ger
      // lagets { w, d, l } till V-O-F-stapeln
      const par = (etikett, f, grans, q, vof = null, kan = land || samma) => {
        const v = [0, 1].map(f);
        if (!v.some((x) => x && x[0] != null)) return land ? null : raden(etikett, ['–', '–'], -1, q);
        if (S.veil) return raden(etikett, ['?', '?'], -1, q);
        const tal2 = v.map((x) => (x ? x[1] : null));
        return raden(etikett, v.map((x) => (x && x[0] != null ? x[0] : '–')), grans && kan ? bast(tal2, grans) : -1, q, null,
          vof ? [0, 1].map((j) => (v[j] && v[j][0] != null ? vof(j) : null)) : null);
      };
      // matchsidans rader (Lagen sida vid sida i app.js) ur matchens fil
      const fil = (etikett) => { for (const g of (d && d.rows) || []) for (const x of g.rows || []) if (x.label === etikett) return x.values; return null; };
      // (vof: talen är V–O–F, och raden får stapeln)
      const ur = (etikett, rubrik, q, vof = false) => {
        const v = fil(etikett);
        const vofAv = (x) => { const t = !S.veil && x != null && String(x).match(/^(\d+)\D+(\d+)\D+(\d+)$/); return t ? { w: +t[1], d: +t[2], l: +t[3] } : null; };
        return v && v.some((x) => x != null) ? raden(rubrik, v.map((x) => (S.veil ? '?' : x == null ? '–' : up(x))), -1, q, null, vof ? v.map(vofAv) : null) : null;
      };
      // ett avsnitts rubrik i mitten med ett streck på båda sidor
      const rub = (namn) => spRub(G, [[namn, 'd']]);
      // lagets främste i ett tal, med namnet som länk till spelarkortet
      const ledare = (etikett, f, k) => raden(etikett, T.map((t) => {
        if (S.veil) return '?';
        const x = framst(t, f);
        return x ? [`${sistaNamn(x.y.p.name).slice(0, H - 1 - String(x.top).length)} ${x.top}`, '', `#spelare:${spId(x.y)}`] : A.P ? '–' : '…';
      }), -1, lq(k, 'spelare'));
      const ledareLand = (etikett, f, k) => par(etikett, (j) => {
        const x = framst(T[j], f);
        return x ? [[`${sistaNamn(x.y.p.name).slice(0, H - 1 - String(x.top).length)} ${x.top}`, '', `#spelare:${spId(x.y)}`], null] : null;
      }, 0, k);

      // ÖVERSIKT. Formen: poängen på fem matcher (inte när någon av dem är
      // dold). Efter den står formens motstånd – det säger inte vem som är
      // bättre och står som vanligt
      const form = sid.map((s) => formOf(m, s));
      const formP = form.map((f) => (f.length && f.every((c) => c && 'VOF'.includes(c)) ? (5 * f.reduce((p, c) => p + (c === 'V' ? 3 : c === 'O' ? 1 : 0), 0)) / f.length : null));
      const formB = bast(formP, SKILJER.form);
      // (formens motstånd utanför bokstäverna: 62 VVVVV … VVVVF 48)
      const mott = sid.map((s) => { const t = S.veil ? '?' : mottOf(m, s); return t == null ? null : [String(t), '']; });
      const formRad = raden('FORMEN', form.map((f) => f.join('') || '–'), formB, lq('form'), mott);
      // (formens fem matcher stod under FORMEN 2026-11-15–17; sedan dess
      // står de tio senaste på sidan MATCH FÖR MATCH, som säger samma sak med
      // motståndets styrka i stället för tabellplatsen)
      const mkt0 = (j) => { const x = mkt(T[j]); return x && x.n ? [`${x.fav} AV ${x.n}`, x.fav / x.n] : null; };
      const favorit = par('FAVORIT', mkt0, SKILJER.favorit, lq('favorit'));
      const odds = tal('MOT ODDSEN', TAL.odds, (v) => signed(v), SKILJER.odds, 'odds');
      // talen för säsongen (ligan, för landslagen gruppen i Nations League),
      // under formen och de tio senaste i TALEN
      let talen;
      if (!land) {
        talen = [tal('STYRKA', TAL.styrka, (v) => signed(v, 2), SKILJER.styrka, 'styrka'),
          tal('MOTSTÅNDET', TAL.motstand, (v) => signed(v, 2), 0, 'motstand'), favorit, odds];
      } else {
        // gruppen (matchens fil, annars landslag.json): placeringen och
        // poängen, som jämförs bara i samma grupp; marknadens chans (f.p i
        // matchlistan, mk: marknaden) med krysset under
        const D = sid.map((s) => (d && d.teams && d.teams[s]) || null);
        const tab = (j) => (D[j] && D[j].table) || (T[j] && T[j].tabell && { ...T[j].tabell, size: T[j].tabell.av, group: T[j].grupp }) || null;
        const sammaGrupp = tab(0) && tab(1) && tab(0).group && tab(0).group === tab(1).group;
        const g0 = [0, 1].map(tab).find((t) => t && t.group);
        // vad lagen spelar för (insatsen): målet och vad som räcker, eller
        // INGET när gruppen redan är avgjord för laget
        const ins = insatsen(m);
        // (KLART: framför målet när det ryms: i den vänstra spalten före den högra)
        const kl = (x) => (`KLART: ${x.mal}`.length <= H ? `KLART: ${x.mal}` : x.mal);
        const spelarFor = !ins ? [] : S.veil ? [raden('SPELAR FÖR', ['?', '?'], -1, ordQ('spelarfor'))] : [
          raden('SPELAR FÖR', ins.lag.map((x) => (x.klart ? ['INGET', 'd'] : [x.mal, ''])), -1, ordQ('spelarfor')),
          raden('', ins.lag.map((x) => [x.klart ? kl(x) : x.villkor, 'd'])),
        ];
        talen = [
          par(g0 && sammaGrupp ? `GRUPP ${up(g0.group)}` : 'GRUPPEN', (j) => { const t = tab(j); return t && t.rank ? [`${ordtal(t.rank)}${t.size ? ` AV ${t.size}` : ''}`, null] : null; }, 0, ordQ('grupp')),
          par('POÄNG', (j) => { const t = tab(j); return t && t.points != null ? [`${t.points} PÅ ${t.played}`, sammaGrupp ? t.points : null] : null; }, SKILJER.poang, ordQ('poang')),
          ...spelarFor,
          favorit, odds];
        const p = m.f && m.f.p;
        if (p && p.length === 3) {
          const x = `X ${p[1]} % · UR ODDSEN`;
          talen.push(raden('MARKNADEN', [`${p[0]} %`, `${p[2]} %`], bast([p[0] / 100, p[2] / 100], SKILJER.favorit), ordQ('marknaden')),
            spMitt(G, [[G.B >= x.length + 17 ? `${x}, INTE MODELLEN` : x, 'd']]));
        }
      }

      // MÅLEN: för klubbarna ligan (matchens fil: hemma och borta, nollorna)
      // och lagens främsta; för landslagen Nations League hittills (matchens
      // fil, annars landslag.json) och alla landskamper sedan hösten 2024.
      // Klubbarnas på två sidor: HEMMA OCH BORTA (malen) och ALLA MATCHER
      // (malen2) – utan hemma och borta för båda lagen allt på en sida
      let malen;
      let malen2 = [];
      if (!land) {
        // (gula kort där målens sort saknas)
        const segrar = !A.P || T.some((t) => t && A.P.spelare.some((y) => String(y.p.teamId) === String(t.espnId) && y.p.gw != null));
        // Hemma och borta (sedan 2026-11-15, önskemål från gänget; användarens
        // val bland tre skisser: Avsnittet): hemmalagets ligamatcher hemma mot
        // bortalagets borta (hb i lagfilen), med bollinnehavet och poängen mot
        // lagen över och under i tabellen; alla matcher på sidan efter.
        // Utan hemma/borta för båda lagen står HEMMA och BORTA som förut.
        const hb = [T[0] && T[0].hb && T[0].hb.h, T[1] && T[1].hb && T[1].hb.b];
        const hbRad = (etikett, f, grans, k, vof = null) => par(etikett, (j) => (hb[j] && hb[j].n ? f(hb[j]) : null), grans, ordQ(k), vof && ((j) => vof(hb[j])), samma);
        const ppm = (x) => (3 * x.w + x.d) / x.n;
        const motTab = (o) => (o && o.n ? [`${o.p} P PÅ ${o.n}`, o.p / o.n] : null);
        const hbNamn = `${kort(m.home)} HEMMA · ${kort(m.away)} BORTA`;
        const hbRader = hb[0] && hb[1] && hb[0].n && hb[1].n ? [
          rub(hbNamn.length + 6 <= G.B ? hbNamn : 'HEMMA OCH BORTA'),
          hbRad('V-O-F', (x) => [`${x.w}-${x.d}-${x.l}`, null], 0, 'hb-vof', (x) => ({ w: x.w, d: x.d, l: x.l })),
          hbRad('POÄNG/MATCH', (x) => [num(ppm(x), 2), ppm(x)], SKILJER.ppm, 'hb-ppm'),
          hbRad('MÅL', (x) => [`${num(x.gf / x.n)}–${num(x.ga / x.n)}`, (x.gf - x.ga) / x.n], SKILJER.mal, 'hb-mal'),
          hbRad('xG', (x) => (x.xg && x.xg.n ? [`${num(x.xg.f / x.xg.n)}–${num(x.xg.a / x.xg.n)}`, (x.xg.f - x.xg.a) / x.xg.n] : null), SKILJER.xg, 'hb-xg'),
          hbRad('BOLLINNEHAV', (x) => (x.poss ? [`${Math.round(x.poss.v)} %`, x.poss.v] : null), 0, 'hb-boll'),
          hbRad('LAG OVANFÖR', (x) => motTab(x.ovan), SKILJER.ppm, 'hb-ovan'),
          hbRad('LAG NEDANFÖR', (x) => motTab(x.under), SKILJER.ppm, 'hb-under'),
        ] : null;
        const allaR = [
          par('MÅL', (j) => { const t = T[j]; return t && t.m ? [`${num(t.gf / t.m)}–${num(t.ga / t.m)}`, (t.gf - t.ga) / t.m] : null; }, SKILJER.mal, lq('gjorda')),
          hbRader ? null : ur('Hemma V–O–F', 'HEMMA', ordQ('hemma'), true),
          hbRader ? null : ur('Borta V–O–F', 'BORTA', ordQ('borta'), true),
          ur('Hållit nollan', 'NOLLOR', lq('nollor')),
          ur('Inte gjort mål', 'UTAN MÅL', ordQ('utanmal')),
          tom(),
          raden('SKYTTEN', T.map((t) => {
            if (S.veil) return '?';
            const s = skytten(t);
            if (!s) return A.P ? '–' : '…';
            return [`${sistaNamn(s.ts.name).slice(0, H - 1 - String(s.ts.g).length)} ${s.ts.g}`, '', s.vem ? `#spelare:${spId(s.vem)}` : null];
          }), -1, lq('skytten')),
          ledare('ASSIST', (p) => p.a, 'assist'),
          segrar ? ledare('SEGERMÅL', (p) => p.gw, 'segermal') : ledare('GULA KORT', (p) => p.yc, 'gula'),
        ];
        if (hbRader) {
          malen = hbRader;
          malen2 = allaR;
        } else malen = allaR;
      } else {
        const nl = (j) => { const a = d && d.teams && d.teams[sid[j]] && d.teams[sid[j]].record && d.teams[sid[j]].record.all; if (a) return a; const x = T[j] && T[j].nationsLeague; return x ? { n: x.matcher, w: x.v, d: x.o, l: x.f, gf: x.gjorda, ga: x.inslappta } : null; };
        const alla = (j) => { const x = T[j] && T[j].alla; return x && x.matcher ? { n: x.matcher, w: x.v, d: x.o, l: x.f, gf: x.gjorda, ga: x.inslappta, fran: x.fran } : null; };
        const vof = (x) => (x && x.n ? [`${x.w}-${x.d}-${x.l}`, (3 * x.w + x.d) / x.n] : null);
        const mal = (x) => (x && x.n ? [`${num(x.gf / x.n)}–${num(x.ga / x.n)}`, (x.gf - x.ga) / x.n] : null);
        const nollor = (j, k) => { const x = T[j] && T[j][k]; return x && x.matcher && x.nollor != null ? [String(x.nollor), null] : null; };
        const nlR = [
          par('V-O-F', (j) => vof(nl(j)), SKILJER.ppm, ordQ('nl-vof'), nl),
          par('MÅL', (j) => mal(nl(j)), SKILJER.mal, ordQ('nl-mal')),
          par('NOLLOR', (j) => nollor(j, 'nationsLeague'), 0, ordQ('nl-nollor')),
          ledareLand('SKYTTEN', (p) => p.g, lq('skytten')),
          ledareLand('ASSIST', (p) => p.a, lq('assist', 'spelare')),
        ].filter(Boolean);
        // (antalet landskamper står i förklaringen: det är V-O-F tillsammans)
        const allaR = [
          par('V-O-F', (j) => vof(alla(j)), SKILJER.ppm, ordQ('alla-vof'), alla),
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
      // landslagen ur Nations Leagues lagfil). Sedan 2026-11-16 (användarens
      // val A Raderna bland tre skisser – Raderna, Raderna och tallinjen,
      // Spalterna – och rubriken med lagkortets ord): paren (1,5–0,2) såg ut
      // som resultat, så varje tal har en egen rad där det bättre lyser, under
      // rubrikerna xG PER MATCH och SKOTT PÅ MÅL PER MATCH, och talen mot
      // chanserna står under MOT CHANSERNA med lagkortets ord (GJORDA MÅL +3,7,
      // INSLÄPPTA MÅL −0,2), så att tecknen läses som en mening
      const xgp = (j) => { const x = xgOf(T[j]); return x && x.n ? x : null; };
      // ('7,2–1,0' ur matchens fil som två tal)
      const tvaTal = (s) => { const p = s == null ? [] : String(s).split(/\s*[–-]\s*/).map((y) => parseFloat(y.replace(',', '.'))); return p.length === 2 && p.every(Number.isFinite) ? p : null; };
      const skottFil = fil('Skott på mål');
      const skott = (j) => {
        if (!land) return tvaTal(skottFil && skottFil[j]);
        const x = fdOf(T[j], 'sh');
        return x && x.n && x.of != null && x.oa != null ? [x.of / x.n, x.oa / x.n] : null;
      };
      // en rad med ett tal per lag, det högsta ljust (lagre: det lägsta);
      // ingen rad när inget av lagen har talet
      const enRad = (etikett, f, grans, q, lagre = false) => {
        const v = [0, 1].map(f);
        return v.some(ok) ? par(etikett, (j) => (ok(v[j]) ? [num(v[j]), lagre ? -v[j] : v[j]] : null), grans, q) : null;
      };
      // ett avsnitt med rubriken, bara när något av lagen har talen
      const avsnitt = (namn, r) => (r.some(Boolean) ? [rub(namn), ...r] : []);
      // DE TIO SENASTE (sedan 2026-11-16, användarens önskemål: "ha med de
      // senaste 10 matcherna … och hur svårt motståndet för de lagen som de
      // har mött har varit – för att få en känsla för hur bra de har varit";
      // användarens val A Listan bland tre skisser – Listan, Mot starka och
      // svaga, Staplarna): poängen per match, målen och motståndet i snitt
      // över lagets tio senaste matcher i alla tävlingar (tioSum, i TALEN
      // under formen), och på sidan MATCH FÖR MATCH en rad per match med
      // utfallet, resultatet, H eller B, motståndaren och dess styrka med en
      // mätare – motståndarens chans mot mittenlaget i lagets division (50 som
      // mittenlaget, sedan 2026-11-17), som formens motstånd (landslagen:
      // ligan i Nations League, efter Elo-talen). På datorn lagen sida vid sida, i telefonen under
      // varandra. Poängen och målen jämförs som formen (det bättre lyser);
      // motståndet säger inte vem som är bättre och står som vanligt. Till
      // 2026-11-17 stod allt det överst i xG-fliken, som då blev 27 rader.
      const tioL = sid.map((s) => (S.veil ? [] : tioMatcher(m, s)));
      const tioS = tioL.map(tioSnitt);
      const tioSum = [];
      const tioLista = [];
      if (tioL.some((l) => l.length)) {
        const vis = (f) => tioS.map((x) => (S.veil ? '?' : x && f(x) != null ? f(x) : '–'));
        const ppm = tioS.map((x) => (x ? x.ppm : null));
        const md = tioS.map((x) => (x && x.f != null ? (x.f - x.a) / x.n : null));
        tioSum.push(rub('DE TIO SENASTE'),
          raden('POÄNG/MATCH', vis((x) => (x.ppm == null ? null : num(x.ppm, 1))), bast(ppm, SKILJER.ppm), ordQ('tio-poang')),
          raden('MÅLEN', vis((x) => (x.f == null ? null : `${x.f}–${x.a}`)), bast(md, SKILJER.mal), ordQ('tio-malen')),
          raden('MOTSTÅNDET', vis((x) => (x.mott == null ? null : String(x.mott))), -1, ordQ('tio-motstand')));
        tioLista.push(spRub(G, [['DE TIO SENASTE', 'd', ordQ('tio-matcher')]]));
        const rm = Math.max(3, ...tioL.flat().map((y) => (y.f != null && y.a != null ? `${y.f}–${y.a}`.length : 0)));
        if (!G.tel) {
          const cw = Math.min(28, G.S - 1 + G.M);
          const c = tioL.map((l) => tioCeller(l, cw, rm));
          for (let i = 0; i < Math.max(c[0].length, c[1].length); i++) tioLista.push(spRad(G, c[0][i] || [], '', null, c[1][i] || []));
        } else {
          tioLista.push(...underVarandra(G, lag, tioL, (y) => tioBredd(y, rm), (l, w) => tioCeller(l, w, rm)));
        }
      } else if (S.veil) {
        tioSum.push(rub('DE TIO SENASTE'), raden('POÄNG/MATCH', ['?', '?'], -1, ordQ('tio-poang')));
      }
      // TALEN: formen, de tio senaste i snitt och säsongens tal under
      // ligans (landslagen: Nations Leagues) rubrik
      const sasong = talen.filter(Boolean);
      const oversikt = [formRad, ...tioSum, ...(sasong.length ? [rub(land ? 'NATIONS LEAGUE' : 'I LIGAN'), ...sasong] : [])];
      // xG: chanserna under säsongen (ligan, för landslagen Nations League)
      const xg = [
        ...avsnitt('xG PER MATCH', [
          enRad('SKAPAR', (j) => (xgp(j) ? xgp(j).f / xgp(j).n : null), SKILJER.xgMatch, lq('skapar')),
          enRad('SLÄPPER TILL', (j) => (xgp(j) ? xgp(j).a / xgp(j).n : null), SKILJER.xgMatch, lq('slapper'), true),
        ]),
        ...avsnitt('SKOTT PÅ MÅL PER MATCH', [
          enRad('SKJUTER', (j) => (skott(j) ? skott(j)[0] : null), SKILJER.skott, lq('pamal')),
          enRad('SLÄPPER TILL', (j) => (skott(j) ? skott(j)[1] : null), SKILJER.skott, ordQ('pamal-mot'), true),
        ]),
        ...avsnitt('MOT CHANSERNA', [
          land ? par('GJORDA MÅL', (j) => { const x = xgp(j); return x ? [signed(x.gf - x.f), null] : null; }, 0, lq('malxg'))
            : ur('Gjorda mål mot xG', 'GJORDA MÅL', lq('malxg')),
          land ? par('INSLÄPPTA MÅL', (j) => { const x = xgp(j); return x ? [signed(x.ga - x.a), null] : null; }, 0, lq('inslxg'))
            : ur('Insläppta mål mot xG', 'INSLÄPPTA MÅL', lq('inslxg')),
          tal('TUR', TAL.tur, (v) => signed(v), 0, 'tur'),
          tal('KRYSSAR', TAL.kryss, pct, 0, 'kryss'),
        ]),
      ];

      // LÄGET: vilan, nästa match och matcherna de senaste veckorna
      // (matchsidans Schemat, med Europacuperna), skadorna och domaren.
      // Sedan 2026-11-15 (användarens val bland fyra skisser: Klartext,
      // Tidslinjen, Mätarna och Stora siffror) med en mätare efter talet,
      // som i lagkorten: VILAN och NÄSTA i samma skala, full vid två veckor
      // (en ruta per dag på datorn, i telefonen färre i samma skala), och MATCHER en ruta per
      // match. Den bättre vilan lyser med sin mätare och den sämre är svag.
      // Under VILAN och NÄSTA står tävlingen svagt när den inte är lagets
      // egen (Europacuperna, de engelska cuperna, en vänskapslandskamp), och
      // under MATCHER hur många dagar det gäller.
      const vila = sid.map((s) => vilaOf(m, s));
      const sch = sid.map((s) => (d && d.teams && d.teams[s] && d.teams[s].schedule) || null);
      const dgr = (sch[0] || sch[1] || {}).windowDays;
      // (sedan 2026-11-16 i spegeln: talen mot etiketten och lagets mätare
      // utanför talet, fyllt inifrån och ut, som V-O-F-stapeln i MÅLEN)
      const MATV = 6;
      const MATN = Math.max(4, Math.min(14, G.S - 2 - MATV));
      // en rad med lagens tal och var sin mätare: bitar(j) ger lagets mätare
      // inifrån och ut (fyllt först), b är laget med det bättre talet
      const matRad = (etikett, t, bitar, b, q) => {
        const v = [0, 1].map((j) => dragBit(t[j], j, b));
        const m0 = bitar(0).slice().reverse();
        const m1 = bitar(1);
        return spRad(G, [...m0, [' ', ''], [padL(v[0][0], MATV), v[0][1], v[0][2]]], etikett, q,
          [[pad(v[1][0], MATV), v[1][1], v[1][2]], [' ', ''], ...m1]);
      };
      // dagarna: full mätare vid två veckor; b är laget med den bättre vilan
      const dagRad = (etikett, v, b, q, fmt = (x) => `${x} D`) => matRad(etikett, v.map((x) => (x == null ? '–' : fmt(x))), (j) => {
        const f = v[j] == null ? 0 : Math.min(MATN, Math.round((v[j] * MATN) / 14));
        return [...dragStreck(f, b >= 0 && j !== b ? 'mtd' : 'mt1'), ...dragStreck(MATN - f, 'mt0')];
      }, b, q);
      // en svag rad under lagens tal (bara när något av lagen har en text)
      const under = (v) => (v.some(Boolean) ? spRad(G, [[v[0] || '', 'd']], '', null, [[v[1] || '', 'd']]) : null);
      const tav = (k) => under(sid.map((s, j) => tavlingOf(m, s, sch[j] && sch[j][k], H)));
      // Spelarnas egen vila (sedan 2026-11-16, användarens önskemål: lagets
      // VILAN säger lite inför en landskamp, när spelarna har spelat för sina
      // klubbar under tiden): snittet av dagarna sedan varje spelares senaste
      // match i alla tävlingar, för startelvan och för truppen, i samma skala
      // som VILAN. Under elvans dagar står svagt vilken elva det är.
      // (src/fetchers/s365vila.js)
      const sv = (d && d.spelarvila) || null;
      const spv = (k) => sid.map((s) => (sv && sv[s] && sv[s][k] && ok(sv[s][k].d) ? sv[s][k].d : null));
      const elvV = spv('elva');
      const trpV = spv('trupp');
      const snittD = (x) => `${num(x, 1)} D`;
      const spelarna = [
        elvV.some(ok) ? dagRad('ELVANS VILA', elvV, bast(elvV, SKILJER.vilaSnitt), ordQ('vila-elvan'), snittD) : null,
        elvV.some(ok) ? under(sid.map((s) => ELVA_SORT[sv[s] && sv[s].elva ? sv[s].elva.k : ''] || '')) : null,
        trpV.some(ok) ? dagRad('TRUPPENS VILA', trpV, bast(trpV, SKILJER.vilaSnitt), ordQ('vila-truppen'), snittD) : null,
      ];
      const laget = [
        dagRad('VILAN', vila, bast(vila, SKILJER.vila), ordQ('vila')),
        tav('last'),
        ...spelarna,
        dagRad('NÄSTA', sch.map((x) => (x && x.next && x.next.days != null ? x.next.days : null)), -1, ordQ('nasta')),
        tav('next'),
      ];
      if (dgr && sch.some((x) => x && x.recent != null)) {
        const nr = sch.map((x) => (x && x.recent != null ? x.recent : null));
        laget.push(matRad('MATCHER', nr.map((n) => (n == null ? '–' : String(n))), (j) => dragStreck(Math.min(MATN, nr[j] || 0), 'mtm'), -1, ordQ('matcher')));
        laget.push(under([0, 1].map(() => `SENASTE ${dgr} D`)));
      }
      // skadorna: lagens namn i halvorna, så många per rad som ryms
      const sk = sid.map((s) => skadorOf(m, s));
      if (sk.some(Boolean)) {
        const rader = sk.map((l) => {
          const n = !l ? ['OKÄNT'] : l.length ? l.map((p) => `${sistaNamn(p.name)}${SKADA[p.status] || ''}`.slice(0, H - 1)) : ['INGA'];
          const ut = [];
          n.forEach((x, i) => {
            const t = i < n.length - 1 ? `${x},` : x;
            if (ut.length && ut[ut.length - 1].length + 1 + t.length <= H) ut[ut.length - 1] += ` ${t}`;
            else ut.push(t);
          });
          return ut;
        });
        laget.push(tom());
        for (let i = 0; i < Math.max(rader[0].length, rader[1].length); i++) {
          laget.push(spRad(G, rader[0][i] ? [[rader[0][i], '']] : [], i ? '' : 'SKADORNA', ordQ('skador'), rader[1][i] ? [[rader[1][i], '']] : []));
        }
      }
      // domaren (football-data.co.uk) som på matchsidan: hans eller hennes
      // ligamatcher före matchdagen, med divisionens snitt efter
      const dom = d && d.referee && !d.referee.unknown && d.referee.name ? d.referee : null;
      if (dom) {
        const s = dom.stats || {};
        const a = dom.avg || {};
        // (domarens tal till vänster och divisionens snitt till höger)
        const fig = (etikett, k, v, w) => spRad(G, [[v, '']], etikett, ordQ(k), w != null ? [[`SNITT ${w}`, 'd']] : []);
        laget.push(tom(), spRub(G, [['DOMAREN', 'd', ordQ('domaren')], [` ${up(dom.name)}`, '']]));
        if (s.n) laget.push(spRad(G, [[String(s.n), '']], 'LIGAMATCHER', ordQ('domaren'), []));
        if (s.n) {
          if (s.yellow != null) laget.push(fig('GULA KORT', 'dom-gula', num(s.yellow, 1), a.yellow != null ? num(a.yellow, 1) : null));
          if (s.fouls != null) laget.push(fig('FRISPARKAR', 'dom-frisparkar', num(s.fouls, 1), a.fouls != null ? num(a.fouls, 1) : null));
          if (s.home != null) laget.push(fig('HEMMASEGER', 'dom-hemmaseger', pct(s.home), a.home != null ? pct(a.home) : null));
          if (dom.min && s.n < dom.min) laget.push(spMitt(G, [['FÖR FÅ MATCHER', 'd']]));
        }
      }

      // flikarnas sidor (AKTSIDOR): 'oversikt/2' och 'malen/2' är den andra sidan
      const flikar = { oversikt, 'oversikt/2': tioLista, malen, 'malen/2': malen2, xg, laget, moten: moten(m) };
      // (raderna och listorna med rader som dragkampens delar ger, i en lista)
      const platta = (l) => l.flatMap((x) => (!x ? [] : x.length && Array.isArray(x[0]) && Array.isArray(x[0][0]) ? x : [x]));
      const rader = (id) => tvatt(platta(flikar[id] || []));
      // (en sida med något att visa)
      const s = sidorna(AKTDELAR, AKTSIDOR, (id) => rader(id).length > 0, del);
      const val = s.val;
      R.delar = s.ordning;
      R.del = val;
      R.huvud = [rad([`${padL(i + 1, 2)}  `, 'd'], [`${kort(m.home)} – ${kort(m.away)}`, 'v']), delRad(AKTDELAR, s.topp, s.har), s.rad];
      if (val === 'moten') return rader('moten');
      // lagen överst i fliken (leder till lagkorten), med divisionen när den skiljer
      const kol = [spLag(G, lag)];
      if (!land && T[0] && T[1] && T[0].comp !== T[1].comp) kol.push(spRad(G, [[DIVK[T[0].comp] || '', 'd']], '', null, [[DIVK[T[1].comp] || '', 'd']]));
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
    // översiktens två sidor (sidorna()): talen och matcherna, en rad per match
    const LAGSIDOR = { oversikt: [['oversikt', 'TALEN'], ['oversikt/2', 'MATCH FÖR MATCH']] };
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
        // de tio senaste med motståndets styrka (xG-fliken)
        tio: (() => {
          const l = tioMatcher(m, side);
          return { snitt: tioSnitt(l), mot: l.filter((x) => x.niva != null).map((x) => ({ mot: heltNamn(x.mot), tav: tav(x.tav), niva: Math.min(99, Math.round(100 * x.niva)) })) };
        })(),
        // spelarnas vila före matchen { elva: { d, n, k, p }, trupp: { d, n } }
        sv: (d && d.spelarvila && d.spelarvila[side]) || null,
        // det matchsidans rad visar för laget ('5,5–4,2')
        visar: (etikett) => { for (const g of (d && d.rows) || []) for (const x of g.rows || []) if (x.label === etikett) return x.values[j]; return null; },
      };
    }
    // h till ett exempel om hela matchen: lagen, marknadens chans och domaren
    const hMatch = (m) => {
      const d = A.match.get(m.id);
      const dom = d && d.referee && !d.referee.unknown && d.referee.name ? d.referee : null;
      return { m, hem: hAkt(m, 0), bort: hAkt(m, 1), p: m.f && m.f.mk && m.f.p && m.f.p.length === 3 ? m.f.p : null, dom, ins: insatsen(m) };
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
      // (under menyraden och den tomma raden under den)
      const tak = topp.querySelector('.tr.meny + .tr');
      const ovanKort = Math.floor((rr.top - U.top + 1) / h);
      const ovan = Math.max(ovanKort, Math.floor((rr.top - (tak ? tak.getBoundingClientRect().bottom : U.top) + 1) / h));
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
    // flyttar sig när man rullar eller byter flik): en flik utan något att
    // visa svag och inte tryckbar. Tre mellanslag emellan som i menyraden, två
    // när raden annars inte ryms (telefonen). Sedan 2026-11-17 (användarens
    // val B "DOS-programmet" bland tre skisser av markeringen) är den valda
    // fliken en mapp man ser in i: en ram runt fliken, öppen nedåt mot
    // strecket under raden (klassen flik i rum-register.css, och så ritar
    // skärmen i rummet den, rum-dator.js); till dess var den omvänd.
    function delRad(delar, val, har) {
      const n = delar.reduce((s, [, namn]) => s + namn.length, 0);
      const mellan = n + 3 * (delar.length - 1) <= A.bred ? '   ' : '  ';
      return Object.assign(rad(...delar.flatMap(([id, namn], j) => [[namn, id === val ? 'i' : har(id) ? '' : 'd', id === val || !har(id) ? null : `#del:${id}`], [j < delar.length - 1 ? mellan : '', '']])), { kl: 'flik' });
    }
    // Sidorna i en flik (sedan 2026-11-17, användarens val B "Sidor i
    // fliken" bland två skisser; A var fler flikar, som i telefonen hade
    // hamnat på två rader). En flik som inte rymdes på skärmen – matchaktens
    // xG var 27 rader, MÅLEN 18, landslagens översikt 19 – delas i sidor,
    // 'oversikt' och 'oversikt/2', och sidorna står på raden under flikraden
    // (sidRad) som radioknappar, så att ingen rad går åt och inget flyttar
    // sig. En flik med en sida har en tom rad där. delar är
    // flikarna [[id, namn]], sid en fliks sidor { id: [[id, namn] …] } och
    // finns(id) om en sida har något att visa. Ger den valda sidan (val, en
    // annan sida i samma flik eller fliken när del inte finns, annars
    // översikten), fliken (topp), om en flik har något (har), alla sidor i
    // flikarnas ordning (ordning, för Tab) och raden under flikarna (rad).
    function sidorna(delar, sid, finns, del) {
      const i = (t) => (sid[t] || [[t, '']]).filter(([id]) => finns(id));
      const t0 = String(del || '').split('/')[0];
      const topp = i(t0).length ? t0 : 'oversikt';
      const l = i(topp);
      const val = l.some(([id]) => id === del) ? del : l.length ? l[0][0] : 'oversikt';
      return { val, topp, har: (id) => i(id).length > 0, ordning: delar.flatMap(([id]) => i(id).map(([x]) => x)), rad: l.length > 1 ? sidRad(l, val) : tom() };
    }
    // flikens sidor som radioknappar under flikraden, den valda ljus:
    // (•) HEMMA OCH BORTA   ( ) ALLA MATCHER – 38 tecken, ryms i telefonen
    // (till 2026-11-17 stod sidorna i ett streck, den valda omvänd)
    function sidRad(l, val) {
      return Object.assign(rad(...l.flatMap(([id, namn], j) => [
        id === val ? [`(•) ${namn}`, 'v'] : [`( ) ${namn}`, '', `#del:${id}`],
        [j < l.length - 1 ? '   ' : '', ''],
      ])), { kl: 'sid' });
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
    // får plats på skärmen; sedan flikarna (med strecket under, delRad) och
    // en rad till (slut: flikens sidor, sidRad, eller en tom rad)
    function huvud(namn, under, flikar, slut = tom()) {
      const n = [...namn, ...under].reduce((s, [t]) => s + t.length, 3);
      return [...(A.bred >= 60 && n <= A.bred ? [rad(...namn, ['   ', ''], ...under)] : [rad(...namn), rad(...under)]), flikar, slut];
    }
    const listQ = (slag, d, k) => `#lista:${slag}:${d}:${k}`;
    // platsen efter ett tal: rankningen, med vem markerad (lagets namn eller
    // spelarens nyckel, flera med |) – inte förklaringen, som etiketten öppnar
    const platsQ = (slag, d, k, vem) => `#plats:${slag}:${d}:${k}:${vem}`;
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
    // en rad i kortet: etiketten (leder till förklaringen), talet, mätaren
    // (plats bland k i en mätare för n) och platsen svagt efter – eller bara
    // etiketten och talet, när talet står utan mätare (mat: false). Mätaren
    // och platsen är en tryckbar bit som leder till rankningen (pq, sedan
    // 2026-11-16), när platsen står där
    const talRad = (def, q, text, plats, k, n, pq = null) => rad([def.e, 'd', q], [pad('', ETK - def.e.length)], padL(String(text).slice(0, kortVar()), kortVar()),
      ...(def.mat === false ? [] : [[' '.repeat(matMellan()), ''],
        ...[...matare(plats, k, n), [plats ? padL(ordtal(plats), PLATS + 1) : '', 'd']].map((b) => (plats && pq ? [...b, pq] : b))]));
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
        r.push(talRad(def, q, def.f(v, t, kortVar()), platsAv(v, alla, def.asc), alla.length, n, platsQ('lag', t.comp, def.k, t.name)));
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
        r.push(talRad(def, q, def.f(v, p), pl && pl <= TOPP ? pl : null, TOPP, TOPP, platsQ('spelare', x.div, def.k, spId(x))));
      }
      return r;
    }
    // Rankningen: divisionens lag eller spelare ordnade efter ett tal, med
    // platsen (numret bara på den första vid lika tal, som skytteligan på
    // tv:n), talet och en stapel. Raderna öppnar korten. Målen avslutas med
    // vem som gör dem (anfallarna, mittfältarna …), som på Statistik.
    // Sedan 2026-11-16 (användarens önskemål: platsen efter ett tal ska leda
    // till "en sida med rankingen … snyggt visualiserade som man sen lätt kan
    // ta sig tillbaka ifrån") leder platsen i korten och i matchakten hit,
    // med laget eller spelaren markerad (vy.vem; från matchakten båda lagen,
    // flera med |): namnet omvänt, platsen, talet och stapeln ljusa och de
    // andras staplar svaga, raden en tredjedel ner i rutan och PLATS AV
    // ANTAL under rubriken. Förklaringens HELA LISTAN markerar kortets lag
    // eller spelare på samma sätt. Rubriken står still överst (R.huvud)
    // medan listan rullar, ←/→ går till förra och nästa tal med samma
    // markering, och Esc går tillbaka till kortet.
    // Stapeln är talet: från noll till listans högsta, och när någon har
    // minus från en mittlinje åt båda hållen (tur, styrka, mot oddsen). De
    // tomma rutorna efter den (mt0) är skalan, som mätarna i korten.
    function lista(vy, S, R) {
      const lagv = vy.slag !== 'spelare';
      const slag = lagv ? 'lag' : 'spelare';
      const defs = lagv ? LAGTAL : SPTAL;
      const s0 = standardDiv();
      const d = REG.includes(vy.div) ? vy.div : REG.includes(s0) ? s0 : REG[0];
      const def = defs.find((x) => x.k === vy.lista);
      if (!def) return lagv ? lagen(d, S, R) : spelarna(d, S, R);
      R.slojas = true;
      // (landslagen spelar inga ligamatcher)
      const titel = d === 'nl' && def.k === 'matcher' ? 'MATCHER I NATIONS LEAGUE' : def.n;
      // det som står still: divisionerna, rubriken och raden under den – den
      // markerades plats och, när divisionerna har de korta namnen, divisionen
      const stilla = (om) => {
        const div = helaNamn() ? null : up(REGNAMN[d]);
        const h = [regRad(slag, d, def.k), streck(), rad([titel, 'v'])];
        const n = om ? om.reduce((s, [t]) => s + t.length, 0) : 0;
        if (om && div && n + 3 + div.length <= A.bred) h.push(rad(...om, [` · ${div}`, 'd']));
        else h.push(...[om && rad(...om), div && rad([div, 'd'])].filter(Boolean));
        R.huvud = [...h, streck()];
      };
      if (lagv ? !A.stats : !A.P) { stilla(null); return [prickar('HÄMTAR', '')]; }
      // förra och nästa tal som finns i divisionen (med samma markering)
      const har = (y) => (lagv ? lagIDiv(d).some((t) => fin(y.g(t))) : A.P.spelare.some((x) => x.div === d && spMed(y, x, y.g(x.p, x))));
      const finns = defs.filter((y) => y === def || har(y));
      const i = finns.indexOf(def);
      const till = (y) => (vy.vem ? platsQ(slag, d, y.k, vy.vem) : listQ(slag, d, y.k));
      R.sido = [i > 0 ? till(finns[i - 1]) : null, i < finns.length - 1 ? till(finns[i + 1]) : null];
      if (S.veil) { stilla(null); return [rad('?')]; }
      const l = lagv ? lagLista(def, d) : spLista(def, d);
      if (!l.length) { stilla(null); return [rad('OKÄNT')]; }

      // platserna (lika tal delar plats) och de markerade, i vems ordning
      const nr = [];
      l.forEach((y, j) => nr.push(j && Math.abs(y.v - l[j - 1].v) < 1e-9 ? nr[j - 1] : j + 1));
      const id = (y) => (lagv ? y.t.name : spId(y.x));
      const ix = String(vy.vem || '').split('|').filter(Boolean).map((v) => l.findIndex((y) => id(y) === v)).filter((j) => j >= 0);
      stilla(ix.length ? [...ix.flatMap((j, k) => [...(k ? [[' · ', 'd']] : []), [lagv ? kort(l[j].t.name) : sistaNamn(l[j].x.p.name), 'v'], [` ${ordtal(nr[j])}`, 'v']]), [` AV ${l.length}`, 'd']] : null);

      // spalterna: platsen (5), namnet (W), laget för spelarna (T: hela det
      // korta namnet, när stapeln ändå får minst sex rutor), talet (V, så
      // brett som det bredaste) och stapeln (B, högst 40)
      const text = l.map((y) => String(def.f(y.v, lagv ? y.t : y.x.p)).slice(0, lagv ? VAR : 9));
      const V = Math.max(...text.map((t) => t.length));
      const bred = A.bred >= 56;
      const W = lagv ? (bred ? 24 : 12) : (bred ? 20 : 12);
      const rest = A.bred - 5 - W - V - 2;
      const T = lagv ? 0 : bred && rest - 14 >= 10 ? 14 : rest - 11 >= 6 ? 11 : 0;
      const B = Math.max(4, Math.min(40, rest - T));
      const namn = (y) => {
        if (!lagv) return namnPa(y.x.p.name, W - 1);
        const n = up(y.t.name);
        return n.length < W ? n : kort(y.t.name).slice(0, W - 1);
      };
      // stapeln: från noll, eller från mittlinjen när någon har minus (en
      // verklig skillnad som syns som en strimma, noll som ingenting)
      const lo = Math.min(0, ...l.map((y) => y.v));
      const skala = Math.max(0, ...l.map((y) => Math.abs(y.v))) || 1;
      const rutor = (v, n) => Math.min(n, Math.round((n * Math.abs(v)) / skala) || (Math.abs(v) / skala >= 0.02 ? 1 : 0));
      const stapel = (v, fyll) => {
        if (lo >= 0) { const f = rutor(v, B); return [[' '.repeat(f), fyll], [' '.repeat(B - f), 'mt0']]; }
        const h = Math.floor((B - 1) / 2);
        const f = rutor(v, h);
        return v < 0
          ? [[' '.repeat(h - f), 'mt0'], [' '.repeat(f), fyll], ['|', 'd'], [' '.repeat(h), 'mt0']]
          : [[' '.repeat(h), 'mt0'], ['|', 'd'], [' '.repeat(f), fyll], [' '.repeat(h - f), 'mt0']];
      };
      const r = [];
      l.forEach((y, j) => {
        const mig = ix.includes(j);
        const nn = namn(y);
        // (numret på den första vid lika tal – och alltid på den markerade)
        const b = [[`${padL(j && nr[j] === nr[j - 1] && !mig ? '' : nr[j], 3)}  `, mig ? 'v' : 'd'], [nn, mig ? 'i' : ''], [pad('', W - nn.length), '']];
        if (T) b.push([pad(kort(y.x.p.team).slice(0, T - 1), T), 'd']);
        b.push([padL(text[j], V), mig ? 'v' : ''], ['  ', ''], ...stapel(y.v, mig ? 'mtv' : ix.length ? 'mtd' : 'mt1'));
        // (den första markerade: dit rutan rullar, tillMig)
        if (j === ix[0]) R.mig = r.length;
        r.push(Object.assign(radQ(lagv ? `#lag:${y.t.name}` : `#spelare:${spId(y.x)}`, ...b), mig ? { kl: 'mig' } : {}));
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
    // divisionen registret öppnar på: Premier League (sedan 2026-11-16,
    // användarens val; förut den med flest lag i omgången, vilket gav NL
    // under landslagsuppehållen)
    const standardDiv = () => 'pl';
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
    // En division: tabellen (sedan 2026-11-16, användarens önskemål: "ordna så
    // att tabellerna dyker upp snyggt när man klickar i PL, CH osv."; till dess
    // stod lagen i bokstavsordning). Som på Tabeller och tv:ns 371–374:
    // platsen, laget, spelade, V O F, målen, målskillnaden och poängen, och
    // sist formen i ligan (de fem senaste, senaste först, som i lagkortet).
    // V O F, målen och formen står när raden ryms, i den ordningen; namnet
    // som rummets korta när det hela inte ryms. Divisionens namn står till
    // vänster på raden med rubrikerna, och de står still överst med
    // underraden medan lagen rullar. Ett tunt streck där zonen byts
    // (ESPN:s note, samma zoner som på Tabeller) och zonerna med sina platser
    // under tabellen; ett poängavdrag har * efter poängen. Hela raden öppnar
    // lagkortet. Med dolda resultat står lagen i bokstavsordning (ordningen
    // skulle avslöja resultaten) och ? i stället för talen.
    const ZONER = [
      [/relegation/i, 'NEDFLYTTNING'],
      [/playoff/i, 'KVAL TILL UPPFLYTTNING'],
      [/champions league/i, 'CHAMPIONS LEAGUE'],
      [/europa|conference/i, 'EUROPA- ELLER CONFERENCE LEAGUE'],
      [/promotion/i, 'DIREKT UPPFLYTTNING'],
    ];
    const zonAv = (note) => (note && (ZONER.find(([re]) => re.test(note)) || [])[1]) || null;
    // namnet minst så brett och högst så brett som det längsta (Wolverhampton
    // Wanderers); formen är två mellanrum och fem bokstäver
    const TAB_N = [15, 24];
    const FORMK = { V: 'v', O: '', F: 'd' };
    function lagen(div, S, R) {
      const d = REG.includes(div) ? div : standardDiv();
      if (d === 'nl') return landslagen(R);
      const j = REG.indexOf(d);
      R.sido = [j > 0 ? `#div:${REG[j - 1]}` : null, j < REG.length - 1 ? `#div:${REG[j + 1]}` : null];
      R.slojas = true;
      const r = [regRad('lag', d), streck()];
      const divNamn = helaNamn() ? '' : up(DIVNAME[d]);
      const l = A.stats ? lagIDiv(d) : [];
      if (!l.length) return [...r, ...(divNamn ? [rad([divNamn, 'd'])] : []), A.stats ? rad('OKÄNT') : prickar('HÄMTAR', '')];
      const veil = S.veil;
      if (!veil) l.sort((a, b) => (a.rank || 99) - (b.rank || 99) || a.name.localeCompare(b.name, 'sv'));
      const tal = (x) => (veil ? '?' : x == null ? '–' : String(x));
      const avdrag = !veil && l.some((t) => t.ded > 0);
      const KOL = [
        { h: 'S', w: 3, g: (t) => tal(t.m) },
        { h: 'V', w: 3, g: (t) => tal(t.w), val: 'vof' },
        { h: 'O', w: 3, g: (t) => tal(t.d), val: 'vof' },
        { h: 'F', w: 3, g: (t) => tal(t.l), val: 'vof' },
        { h: 'MÅL', w: 7, g: (t) => (veil ? '?' : `${t.gf}–${t.ga}`), val: 'mal' },
        { h: '+/-', w: 5, g: (t) => (veil ? '?' : t.gd > 0 ? `+${t.gd}` : t.gd < 0 ? `−${-t.gd}` : '0') },
        { h: 'P', w: 4, g: (t) => tal(t.pts), k: 'v' },
      ];
      // platsen (3), spalterna som alltid står och * för avdraget; sedan de
      // som ryms med namnet minst TAB_N[0] brett
      let fast = 3 + KOL.filter((k) => !k.val).reduce((s, k) => s + k.w, 0) + (avdrag ? 1 : 0);
      const med = new Set();
      for (const [id, w] of [['vof', 9], ['mal', 7], ['form', 7]]) if (A.bred - fast - w >= TAB_N[0]) { med.add(id); fast += w; }
      const N = Math.max(TAB_N[0], Math.min(TAB_N[1], A.bred - fast));
      const kol = KOL.filter((k) => !k.val || med.has(k.val));
      const form = med.has('form');
      // (på datorn, där raden räcker till, ett tecken till mellan spalterna)
      const lu = A.bred - fast - N >= kol.length + (form ? 1 : 0) ? 1 : 0;
      const bredd = 3 + N + kol.reduce((s, k) => s + k.w + lu, 0) + (avdrag ? 1 : 0) + (form ? 7 + lu : 0);
      // (underraden och rubrikerna står still överst, R.huvud, och lagen rullar under dem)
      R.huvud = [...r, rad([`${pad(divNamn.slice(0, 3 + N), 3 + N)}${kol.map((k) => padL(k.h, k.w + lu)).join('')}${avdrag ? ' ' : ''}${form ? `${' '.repeat(2 + lu)}FORM` : ''}`, 'd'])];
      r.length = 0;
      const formen = (t) => (A.byTeam.get(t.name) || []).filter((x) => x.completed && x.comp === t.comp).slice(0, 5)
        .map((x) => (veil || (window.Spoiler && Spoiler.hidden(x)) ? '?' : letter(x, t.name) || '?'));
      let forra = null;
      l.forEach((t, i) => {
        const z = veil ? null : zonAv(t.note);
        const namn = up(t.name).length < N ? up(t.name) : kort(t.name).slice(0, N - 1);
        const x = radQ(`#lag:${t.name}`, [`${padL(veil ? '' : t.rank || '', 2)} `, 'd'], pad(namn, N),
          ...kol.map((k) => [padL(k.g(t), k.w + lu), k.k || '']),
          ...(avdrag ? [[t.ded > 0 ? '*' : ' ', 'd']] : []),
          ...(form ? [[' '.repeat(2 + lu), ''], ...formen(t).map((f) => [f, FORMK[f] == null ? 'd' : FORMK[f]])] : []));
        // (ett tunt streck där zonen byts, lika brett som tabellen: --ny i
        // rum-register.css; raden själv får ingen bredd, för ett tecken i
        // VT323 är en bråkdel bredare än 1ch och då bröts raden)
        if (i && z !== forra) Object.assign(x, { kl: 'ny', st: `--ny: ${bredd}ch` });
        forra = z;
        r.push(x);
      });
      if (veil) return r;
      // zonerna med sina platser, och avdragen
      const zoner = [];
      for (const t of l) {
        const z = zonAv(t.note);
        const s = zoner[zoner.length - 1];
        if (!z || !t.rank) continue;
        if (s && s.z === z && s.b === t.rank - 1) s.b = t.rank;
        else zoner.push({ z, a: t.rank, b: t.rank });
      }
      if (zoner.length) r.push(tom(), ...zoner.map((s) => rad([`${padL(s.a === s.b ? s.a : `${s.a}–${s.b}`, 5)}  ${s.z}`, 'd'])));
      const ded = l.filter((t) => t.ded > 0);
      if (ded.length) r.push(tom(), ...ded.map((t) => rad([`*  POÄNGAVDRAG: ${up(t.name)} −${t.ded}`, 'd'])));
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
      loadTabell();
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
        // (en grupp där en match pågår: LIVE i rubriken, lagen i matchen ljusare)
        const rub = `GRUPP ${g.id}`;
        const b = [[[rub, 'd'], ...(g.live ? [[' LIVE', 'live']] : []), [pad('', 2 + N + 1 - rub.length - (g.live ? 5 : 0)), 'd'],[`${padL('S', 2)}${vof ? `${padL('V', 3)}${padL('O', 3)}${padL('F', 3)}` : ''}${padL('+/-', 5)}${padL('P', 4)}`, 'd']]];
        for (const t of g.lag) {
          const namn = (up(t.lag).length > N && LANDKORT[t.lag] ? up(LANDKORT[t.lag]) : up(t.lag)).slice(0, N);
          const tal = `${padL(svar(t.played), 2)}${vof ? `${padL(svar(t.won), 3)}${padL(svar(t.drawn), 3)}${padL(svar(t.lost), 3)}` : ''}${padL(svar(S.veil ? '?' : t.gd > 0 ? `+${t.gd}` : t.gd < 0 ? `−${-t.gd}` : '0'), 5)}${padL(svar(t.points), 4)}`;
          b.push([[`${svar(t.rank)} `, 'd'], [namn, t.live ? 'v' : '', `#lag:${t.lag}`], [pad('', N + 1 - namn.length), ''], [tal, t.live ? 'v' : '']]);
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
    // hittills, alla landskamper sedan hösten 2024 och nästa match (TALEN),
    // och de tio senaste landskamperna på sidan MATCH FÖR MATCH (sedan
    // 2026-11-17; i en lista var översikten 19 rader). ←/→ bläddrar bland
    // lagen i gruppen.
    function landkort(t, S, R, del) {
      loadTabell();
      const g = A.land.grupper.find((x) => x.id === t.grupp);
      const l = g ? g.lag : [];
      const i = l.findIndex((x) => x.lag === t.lag);
      if (i >= 0) R.sido = [i > 0 ? `#lag:${l[i - 1].lag}` : null, i < l.length - 1 ? `#lag:${l[i + 1].lag}` : null];
      R.slojas = true;
      const sen = t.senaste || [];
      const har = (id) => id === 'oversikt' || (t.comp === 'nl' && (id === 'truppen' || LAGTAL.some((d) => d.del && LAGFLIK[d.del] === id && fin(d.g(t)))));
      const s = sidorna(LAGDELAR, LAGSIDOR, (id) => (id === 'oversikt/2' ? sen.length > 0 : har(id)), del);
      const val = s.val;
      R.delar = s.ordning;
      R.del = val;
      const namn = [[up(t.lag), 'v'], [t.en && t.en !== t.lag ? `  ${up(t.en)}` : '', 'd']];
      const under = [[`${t.grupp ? `NATIONS LEAGUE · GRUPP ${t.grupp}` : 'LANDSLAG'}`, 'd', '#div:nl']];
      // (ett landslag utanför Nations League har bara översikten och ingen flikrad)
      R.huvud = t.comp === 'nl' ? huvud(namn, under, delRad(LAGDELAR, s.topp, s.har), s.rad) : [rad(...namn), rad(...under), s.rad.length ? s.rad : streck()];
      if (val === 'truppen') return truppen(t, S, lagTal(t, S, 'truppen'));
      const dold = (x) => Boolean(window.Spoiler && Spoiler.hidesDay(x.datum) && (!Spoiler.hiddenId || Spoiler.hiddenId(x.id) !== false));
      if (val === 'oversikt/2') {
        const r = [rad(['DE SENASTE LANDSKAMPERNA', 'd'])];
        for (const x of sen) {
          const h = dold(x);
          r.push(rad([`${pad(up(dag(x.datum)), 12)}${pad(x.turnering || '', 4)}${x.hemma ? 'H' : 'B'} `, 'd'],
            [pad(kort(x.motstand).slice(0, 11), 11), '', landOf(x.motstand) ? `#lag:${x.motstand}` : null],
            [`  ${h || !x.mal ? '?' : `${x.mal[0]}–${x.mal[1]}`}`, 'v'], [`  ${h ? '' : x.utfall || ''}`, 'd']));
        }
        return r;
      }
      if (val !== 'oversikt') return lagTal(t, S, val);
      const falt = (etikett, ...v) => rad([pad(etikett, 12), 'd'], ...v.map((x) => (Array.isArray(x) ? x : [x, ''])));
      const r = [];
      const om = iOmgangen(t.lag);
      if (om) r.push(falt('OMGÅNGEN', [`${nrAv(om.m)}  ${kort(om.m.home)} – ${kort(om.m.away)}`, '', `#mote:${om.m.id}`]));
      const tb = t.tabell;
      if (tb && tb.rank) r.push(falt(`GRUPP ${t.grupp || ''}`.trim(), S.veil ? '?' : `${ordtal(tb.rank)} AV ${tb.av} · ${tb.points} P PÅ ${tb.played} · ${tb.gd > 0 ? '+' : tb.gd < 0 ? '−' : ''}${Math.abs(tb.gd)}`));
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
    // har något). ←/→ går till förra och nästa lag i samma flik. Översikten
    // har två sidor (sedan 2026-11-17, som matchakten): TALEN med omgången,
    // nästa match, formen och modellen, och formens matcher på MATCH FÖR MATCH.
    function lagkort(t, S, R, del) {
      const l = lagIDiv(t.comp);
      const i = l.findIndex((x) => x.name === t.name);
      if (i >= 0) R.sido = [i > 0 ? `#lag:${l[i - 1].name}` : null, i < l.length - 1 ? `#lag:${l[i + 1].name}` : null];
      R.slojas = true;
      const f = formLag(t.name);
      const har = (id) => id === 'oversikt' || id === 'truppen' || LAGTAL.some((d) => d.del && LAGFLIK[d.del] === id && fin(d.g(t)));
      const s = sidorna(LAGDELAR, LAGSIDOR, (id) => (id === 'oversikt/2' ? f.length > 0 : har(id)), del);
      const val = s.val;
      R.delar = s.ordning;
      R.del = val;
      R.huvud = huvud([[up(t.name), 'v']], [[up(DIVNAME[t.comp] || ''), 'd', `#div:${t.comp}`]], delRad(LAGDELAR, s.topp, s.har), s.rad);
      if (val === 'truppen') return truppen(t, S, lagTal(t, S, 'truppen'));
      const n = lagIDiv(t.comp).length;
      // formens matcher (som på Statistik, senaste först; datumet utan år och
      // resultatet rakt under talen på TALEN)
      if (val === 'oversikt/2') {
        const r = [];
        rubrik(r, 'DE FEM SENASTE', null, kortBredd(n));
        for (const { m: x, l: u } of f) {
          const hemma = x.home === t.name;
          const mot = hemma ? x.away : x.home;
          const sk = x.score90 || x.score;
          r.push(rad([`${pad(up(dag(x.kickoff)).replace(/ \d{4}$/, ''), 7)}${pad(up(x.comp || ''), 4)}${hemma ? 'H' : 'B'} `, 'd'],
            [pad(kort(mot).slice(0, 11), 12), '', lagOf(mot) ? `#lag:${mot}` : null],
            [padL(u === '?' || !sk ? '?' : hemma ? `${sk.home}–${sk.away}` : `${sk.away}–${sk.home}`, 3), 'v'], [`  ${u === '?' ? '' : u}`, 'd']));
        }
        return r;
      }
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
      // formen: bokstäverna och poängen på de fem matcherna, med mätaren och
      // platsen (? när en av matcherna är dold)
      const fv = LAGTAL[0].g(t);
      if (f.length) {
        const alla = lagLista(LAGTAL[0], t.comp).map((y) => y.v);
        const syns = !S.veil && fin(fv) && f.every((x) => x.l !== '?');
        if (r.length) r.push(tom());
        r.push(talRad(LAGTAL[0], listQ('lag', t.comp, 'form'), syns ? LAGTAL[0].f(fv, t) : '?', syns ? platsAv(fv, alla) : null, alla.length, n, platsQ('lag', t.comp, 'form', t.name)));
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
      { namn: 'REGISTRET', typ: 'FLIK', q: '#flik:lagen', ord: ['registret', 'register', 'lagen', 'trupperna', 'ligorna', 'divisionerna', 'tabell', 'tabellen', 'tabeller', 'tabellerna'] },
      { namn: 'SPELARE', typ: 'REGISTRET', q: '#spelarna:', ord: ['spelare', 'spelarna'] },
      ...DIVS.map((d) => ({ namn: up(DIVNAME[d]), typ: 'DIVISION', q: `#div:${d}`, ord: [norm(DIVNAME[d]), d, { pl: 'premier', ch: 'champ', l1: 'league 1', l2: 'league 2' }[d]] })),
      { namn: 'NATIONS LEAGUE', typ: 'LANDSLAG', q: '#div:nl', ord: ['nations league', 'nations', 'nl', 'landslag', 'landslagen', 'landskamper', 'landskamperna'] },
      // Statistiks tal som listor (i Premier League, standardDiv): på
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
      return vy.slag === 'spelare' ? spelarna(vy.div, S, R) : lagen(vy.div, S, R);
    }

    // (huvud: det som står still under menyraden i ett kort – namnet och
    // flikarna; delar: kortets flikar som har något, del: den valda.)
    // Menyraden är en list över hela bredden som tangentraden längst ner,
    // med den valda mörk i det ljusa och en tom rad under (klassen meny;
    // sedan 2026-11-17, användarens val B "DOS-programmet" – till dess var
    // den valda omvänd och ett streck stod under raden).
    function bygg(vy) {
      const S = slojan();
      const R = { nr: {}, sido: null, slojas: false, huvud: null, delar: null, del: null };
      const aktiv = vy.flik === 'sok' ? (A.fore || {}).flik : vy.flik;
      const meny = Object.assign(rad(...FLIKAR.flatMap(([id, namn], j) => [[namn, aktiv === id ? 'i' : '', `#flik:${id}`], [j < FLIKAR.length - 1 ? '   ' : '', '']])), { kl: 'meny' });
      R.ut = vy.flik === 'sok' ? traffLista(vy, R) : vyRader(vy, S, R);
      R.topp = [meny, tom(), ...(R.huvud || [])];
      R.veil = S;
      return R;
    }

    // Tangenterna längst ner: tryckbara, med tangentens namn när det finns ett tangentbord
    function fotHtml(R) {
      const k = mus.matches;
      const b = [];
      const rot = !A.bak.length && A.vy.flik !== 'sok';
      // (med piltangenterna i menyn, A.meny, byter ←/→ i menyraden i stället
      // för förra och nästa, som då bara går att trycka på)
      const m = k && A.meny;
      b.push([k ? `ESC ${rot ? 'STÄNG' : 'TILLBAKA'}` : `◄ ${rot ? 'STÄNG' : 'TILLBAKA'}`, rot ? '#stang' : '#bak']);
      if (R.sido) {
        b.push([k ? (m ? 'FÖRRA' : '← FÖRRA') : '◄ FÖRRA', R.sido[0] ? '#sido:-1' : null, !R.sido[0]]);
        b.push([k ? (m ? 'NÄSTA' : 'NÄSTA →') : 'NÄSTA ►', R.sido[1] ? '#sido:1' : null, !R.sido[1]]);
      } else if (k && rot && !m) b.push(['←→ FLIKARNA', null]);
      if (m) b.push(['←→ BYT   ↑↓ MENYRAD', null]);
      else if (k && R.delar && R.delar.length > 1) b.push(['↑ MENYN', null]);
      if (k && A.vy.flik === 'sok' && KATEGORIER.filter(([id]) => antal(A.vy.hits || [], id)).length > 1) b.push(['TAB KATEGORI', null]);
      if (k && !m && Object.keys(R.nr).length) b.push(['↑↓ VÄLJ   ↵ ÖPPNA', null]);
      return b.map(([t, q, av]) => `<span${q ? ` class="a" data-q="${esc(q)}"` : av ? ' class="av"' : ''}>${esc(t)}</span>`).join('');
    }

    // ---------- utskriften ----------

    // Skriver vyn: rad för rad som en terminal (utan när rummet ska vara
    // stilla), annars på en gång (när datan kommer in).
    function visa(vy, skriv) {
      fkStang();
      A.vy = vy;
      A.sel = -1;
      // (piltangenterna står kvar i menyraden bara när de själva bytte vy)
      const mf = A.menyKvar;
      A.menyKvar = null;
      A.meny = null;
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
      if (mf) menyFokus(mf, false);
      fot.innerHTML = fotHtml(R);
      spoilerRad();
      // (rankningen med en markerad rad: på en gång, och rullad dit)
      if (!skriv || o.calm() || R.mig != null) { ut.innerHTML = h; rull.scrollTop = 0; tillMig(R); return; }
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
    // den markerade raden i rankningen (R.mig) en tredjedel ner i rutan
    function tillMig(R) {
      const el = R && R.mig != null ? ut.children[R.mig] : null;
      if (el) rull.scrollTop = Math.max(0, el.offsetTop - Math.floor(rull.clientHeight / 3));
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
      // en lista: #lista:lag:pl:skapar (utan division: Premier League, standardDiv)
      if (typ === 'lista') return rest.length === 3 ? { flik: 'lagen', slag: rest[0], div: rest[1], lista: rest[2] } : null;
      // rankningen från platsen efter ett tal: #plats:lag:pl:skapar:Arsenal (vem markerad)
      if (typ === 'plats') return rest.length >= 4 ? { flik: 'lagen', slag: rest[0], div: rest[1], lista: rest[2], vem: rest.slice(3).join(':') } : null;
      if (typ === 'flik') return { flik: GAMLA[id] || id };
      return null;
    }
    // vem som markeras i ett tals lista (vy) när man kommer dit från vyn som
    // står nu: kortets lag eller spelare, matchens lag, eller samma som i
    // listan man var i (en annan division); annars ingen
    function migAv(vy) {
      const v = A.vy;
      if (v.lista) return v.vem || null;
      if (vy.slag === 'spelare') return v.spelare || null;
      if (v.lag) return v.lag;
      const m = v.mote && A.ms.find((x) => x.id === v.mote);
      return m ? `${m.home}|${m.away}` : null;
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
      // till ett tals lista från ett kort eller en matchakt (HELA LISTAN):
      // kortets lag eller spelare, eller matchens lag, markeras där
      if (vy && vy.lista && !vy.vem && !iSok) vy.vem = migAv(vy);
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
        const forra = A.R;
        A.sk++;
        A.ut = h;
        A.topp = ht;
        ut.innerHTML = h;
        topp.innerHTML = ht;
        if (A.meny) menyFokus(A.meny, false);
        fot.innerHTML = fotHtml(R);
        rull.scrollTop = y;
        // (rankningen som väntade på datan: till den markerade raden när den kommer)
        if (R.mig != null && !(forra && forra.mig != null)) tillMig(R);
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
      if (A.meny && i >= 0) menyFokus(null);
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

    // Piltangenterna i menyraderna (sedan 2026-11-17, användarens önskemål:
    // "surfa mellan de olika menyraderna med piltangenterna istället för med
    // tab"). ↑ ovanför den första raden går upp i menyn, till raden närmast
    // (flikens sidor, kortets flikar eller listen överst); där går ↑/↓ mellan
    // menyraderna och ←/→ byter direkt i raden – sidan, fliken (dess första
    // sida) eller KUPONGEN/REGISTRET – och ↓ under den nedersta går tillbaka
    // till raderna. Esc lämnar menyn. Raden som tangenterna står i har
    // klassen fokus (rum-register.css): den valda lyser som en vald rad.
    // Tab bläddrar som förut.
    const menyRader = () => ['meny', 'flik', 'sid'].filter((id) => topp.querySelector(`.tr.${id}`));
    function menyFokus(rad, fotOck = true) {
      for (const el of topp.querySelectorAll('.tr.fokus')) el.classList.remove('fokus');
      const el = rad && topp.querySelector(`.tr.${rad}`);
      A.meny = el ? rad : null;
      if (el) {
        el.classList.add('fokus');
        for (const x of ut.querySelectorAll('.sel')) x.classList.remove('sel');
        A.sel = -1;
      }
      if (fotOck && A.R) fot.innerHTML = fotHtml(A.R);
    }
    function menyTangent(k) {
      const l = menyRader();
      const j = l.indexOf(A.meny);
      if (k === 'ArrowUp') { if (j > 0) menyFokus(l[j - 1]); return; }
      if (k === 'ArrowDown') {
        if (j >= 0 && j < l.length - 1) menyFokus(l[j + 1]);
        else { menyFokus(null); valj(0); }
        return;
      }
      const d = k === 'ArrowRight' ? 1 : -1;
      if (A.meny === 'meny') {
        const i = FLIKAR.findIndex(([id]) => id === A.vy.flik);
        const n = FLIKAR[i + d];
        if (!n) return;
        inp.value = '';
        markor();
        A.bak = [];
        A.menyKvar = 'meny';
        visa({ flik: n[0] }, true);
        return;
      }
      // kortets flikar och flikens sidor, i ordning (de som har något)
      const dl = (A.R && A.R.delar) || [];
      const topp0 = (id) => String(id).split('/')[0];
      const nu = A.R && A.R.del;
      const val = A.meny === 'sid' ? dl.filter((id) => topp0(id) === topp0(nu)) : [...new Set(dl.map(topp0))];
      const i = val.indexOf(A.meny === 'sid' ? nu : topp0(nu));
      const n = val[i + d];
      if (i < 0 || !n) return;
      A.menyKvar = A.meny;
      visa({ ...A.vy, del: A.meny === 'sid' ? n : dl.find((id) => topp0(id) === n) }, true);
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
        if (A.meny) { menyFokus(null); return true; }
        if (!tomt || iSok) { inp.value = ''; markor(); if (iSok) visa(A.fore || { flik: 'kupongen' }, false); return true; }
        if (!A.bak.length) return false;
        tillbaka();
        return true;
      }
      // piltangenterna i menyraderna (menyTangent); ↑ ovanför den första raden går dit
      if (tomt && !iSok && k.startsWith('Arrow')) {
        if (A.meny) { menyTangent(k); return true; }
        const l = menyRader();
        if (k === 'ArrowUp' && A.sel <= 0 && l.length) { menyFokus(l[l.length - 1]); return true; }
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
