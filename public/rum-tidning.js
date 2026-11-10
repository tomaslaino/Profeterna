'use strict';

// ---------- kvällstidningen ----------
//
// Veckans tidning – Sportbladet eller Expressen, samma som löpsedeln (rum-affischer.js) – ligger på pulten i
// tobaksaffären, och ett klick tar upp den och lägger fram den över rummet (tidningPult och tidningen i rum.js).
// Överst ligger sedeln själv, förstorad, som tidningens framsida (på pulten syns den ner till rubrikens slut,
// ovanför kupongerna i högen), och under den sidorna, en under en, med sidnummer,
// tidningens namn och datumet i huvudet som i en riktig tidning. Vad som står i den beror på omgången:
//
//   inför omgången   Tipset (omgångens matcher med avsparken, datorns procent och Sixten Bråvalls tecken,
//                    och Tipsligan), Så mår tipslagen (notiserna ur data/tidning.json, skrivna på iMacen),
//                    Veckans analys (Sixtens artikel om matchen som löpsedeln handlar om, annars den
//                    jämnaste, ur data/analyser.json) och Supportrarna: en informationssida per
//                    match med det intressanta ur lagens supporterpoddar och forum (data/poddsidor.json),
//                    grupperat efter ämne, med slag, podd och citat.
//   efter omgången   Omgången (resultaten, rätt rad och siffrorna), Betygen, Skrällen och citaten (det ni
//                    skrev på kupongen, med facit under) och Hasse Backes krönika med Tipsligan efteråt.
//
// Allt räknas ur omgångens data, och samma omgång ger samma tidning på alla enheter: där texten kan
// variera väljer omgångens id. Inget här anropar någon språkmodell: notiserna och analysen är skrivna i
// förväg, och resten är tryckta mallar (TEXT), som npm run repliker kollar mot det som är underkänt.
//
// RumTidning.html(upplaga) → html för sidorna under sedeln. upplaga:
//   { tid: 'sb'|'ex', datum, nr, namn, namnAv(id, namn),
//     efter: sammanställningen (RumBlock.bygg) eller null, citat: { notes, efter } (Samtal.pult.gang()),
//     liga: { fore: [...], efter: [...], omg } (Tippoang.season), matcher, notiser, analys,
//     poddsidor: { amnen, sidor } }
// RumTidning.rastrera(rot) ritar porträtten på sina dukar, svartvita och rastrerade.
//
// Tipsguiden är tidningens tipsbilaga, och ett nummer ligger också på pulten (tipsguiden i rum.js):
// ett klick tar upp det och lägger fram det som tidningen. Framsidan är dess egen (forsta, 100 × 140 som
// sedeln, samma på pulten och i handen), och sidorna är de inför omgången – Tipset, Så mår tipslagen, Veckans
// analys och Supportrarna – och Åtta knep, som alltid finns.
// RumTidning.guide(upplaga) → { forsta, inne, blad, sidor }, med samma upplaga som före omgången.
// RumTidning.forsta(upplaga) → framsidan.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RumTidning = factory();
})(typeof self !== 'undefined' ? self : this, () => {
  const SIGNS = ['1', 'X', '2'];
  const TAL = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv', 'tretton'];
  const ordet = (n) => TAL[n] || String(n);
  const stor = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lista = (l0) => {
    const l = [].concat(l0);
    return l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} och ${l.at(-1)}`;
  };
  const pr = (x) => Math.round(Number(x) || 0);
  const runda = (x) => Math.round((Number(x) || 0) * 10) / 10;
  const poang = (x) => {
    const v = runda(x);
    const t = String(Math.abs(v)).replace('.', ',');
    return v > 0 ? `+${t}` : v < 0 ? `−${t}` : t;
  };
  // resultatet (3–1) bryts inte vid tankstrecket
  const hel = (s) => String(s).replace(/(\d)–(\d)/g, '$1\u2060–\u2060$2');
  const decimal = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  const plats = (n) => `${n}:${n % 10 === 1 || n % 10 === 2 ? (n % 100 === 11 || n % 100 === 12 ? 'e' : 'a') : 'e'}`;
  // samma omgång ger samma val, på alla enheter
  const frö = (s) => {
    let h = 7;
    for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
  };
  const valj = (l, nyckel) => (Array.isArray(l) ? l[frö(nyckel) % l.length] : l);
  const nyckel = (p) => Math.round(runda(p.pts) * 10) * 1000 + (p.ok || 0);
  const HASSE = 'HB';
  const HASSE_BILD = 'profeterna/hasse.jpg';

  const fDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short' });
  const fTid = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
  const avspark = (t) => (Number.isFinite(Date.parse(t)) ? `${fDag.format(new Date(t)).replace('.', '')} ${fTid.format(new Date(t)).replace(':', '.')}` : '');
  const NAMN = { sb: 'Sportbladet', ex: 'Expressen', tg: 'Tipsguiden' };

  // ---------- texterna ----------
  // Tidningens egen röst är kvällstidningens, torr och saklig. Krönikan är Hasse Backes: han har alltid
  // haft rätt, och det som gick fel var matcherna. Till er säger han ni och er.
  const TEXT = {
    sidor: {
      tipset: 'Tipset',
      notiser: 'Så mår tipslagen',
      analys: 'Veckans analys',
      poddar: 'Supportrarna',
      omgangen: 'Omgången',
      betygen: 'Betygen',
      skrallen: 'Skrällen',
      kronikan: 'Krönikan',
      knep: 'Åtta knep',
    },
    // Tipsguidens framsida: rubriken och raden under väljs av omgången, Rysaren är den jämnaste matchen
    // och Spika den största favoriten.
    guide: {
      rubrik: [
        ['Så tar du hem', '13 rätt'],
        ['Allt om', 'helgens 13'],
        ['Här är den', 'säkra raden'],
      ],
      under: ['Experterna avslöjar allt', 'Datorn, notiserna och Sixten', 'Nästan i alla fall'],
      kupongen: 'Kupongen',
      datorn: 'Datorn',
      nr: (n) => `Nr ${n}`,
      pris: '15 kr',
      rysaren: 'Rysaren',
      spika: 'Spika',
      knep: ['8 enkla knep', 'Femman gör alla fel'],
    },
    knep: {
      rubrik: 'Så blir du rik på tipset',
      ingress: 'Åtta enkla knep. Nummer 5 gör alla fel.',
      lista: [
        ['Spika inte allt', 'Tretton favoriter låter som en säker rad, men de vinner nästan aldrig alla på samma lördag.'],
        ['Gardera det jämna', 'Där ingen utgång har mer än fyra chanser på tio är en gardering billigare än ett tecken man ångrar.'],
        ['Formen före tabellen', 'Ett lag som har vunnit fyra raka bryr sig inte om var det står i tabellen.'],
        ['Hemmaplan är värd något', 'Särskilt i regn, i november och längre ner i divisionerna.'],
        ['Tippa inte med hjärtat', 'Ditt eget lag ska ha det tecken det förtjänar, inte det du önskar dig.'],
        ['Läs notiserna', 'En skadad målvakt syns inte alltid i oddsen, men den står i lokaltidningen.'],
        ['Lämna in i tid', 'Spelstoppet väntar inte på någon, och en kupong i fickan har aldrig vunnit något.'],
        ['Lyssna inte på experterna', 'Inte ens på oss.'],
      ],
      stampel: 'Här gör alla fel',
    },
    tipset: {
      rubrik: 'Omgångens matcher',
      datorn: 'med datorns tecken',
      experten: 'Sixten',
      ingetTecken: 'Sixten Bråvall har inte tippat den här matchen än.',
    },
    liga: {
      rubrik: 'Tipsligan',
      efter: (n) => `Efter ${n} ${n === 1 ? 'omgång' : 'omgångar'}`,
    },
    notiser: {
      ingress: 'Skador, sviter och vad tränarna säger inför helgens tipsmatcher.',
    },
    analys: {
      tipset: 'Sixtens tips',
    },
    poddar: {
      slag: { b: 'Bekräftat', h: 'Hört i podden', o: 'Supportrarnas åsikt' },
      // Slaget h är källans egen uppgift: poddens, forumets, de insatta mediernas eller flera av dem.
      egen: { podd: 'Hört i podden', forum: 'Från forumet', media: 'Enligt insatta', blandat: 'Hört bland supportrarna' },
      amnen: { trupp: 'Skador och trupp', elva: 'Väntad uppställning', spel: 'Så spelar laget', klubb: 'Tränaren och klubben', match: 'Inför matchen' },
      // Ämnet med ett ord, i spalten till vänster om punkterna.
      kort: { trupp: 'Truppen', elva: 'Elvan', spel: 'Spelet', klubb: 'Klubben', match: 'Matchen' },
      // Markören framför punkten, och nyckeln under sidan.
      nyckel: { b: 'Bekräftat', h: 'Egen uppgift eller rykte', o: 'Åsikt' },
      // Källans slag i raden under laget: Ur podden …, forumet … och (de insatta) bara namnet.
      typord: { podd: 'podden', forum: 'forumet', media: '' },
      och: 'och',
      rubrik: (h, b) => `${h}–${b}: det supportrarna vet`,
      ur: (l) => `Ur ${l}`,
      ingen: 'Ingen supporterpodd, inget forum och inget från de insatta att hämta något ur den här veckan.',
      forumet: (n) => `forumet ${n}`,
      forklaring: {
        b: 'källan återger något som klubben, tränaren eller en spelare har sagt, eller något som har hänt.',
        podd: 'poddens egna uppgifter, intryck från läktaren och rykten.',
        forum: 'det supportrarna på forumet själva har sett och hört, och rykten.',
        media: 'det skribenter som följer laget varje vecka – fansajter, fanzines, nyhetsbrev och oberoende lokala reportrar – själva har tagit reda på, och rykten.',
        blandat: 'det flera av källorna tar upp: egna uppgifter och rykten.',
        h: 'det poddarna, forumen och de insatta själva har sett, hört eller tagit reda på, och rykten.',
        o: 'vad de som följer laget varje vecka tycker och hoppas.',
      },
      // Källans namn som det står på sidan: forumet med ordet forumet framför, poddens namn utan
      // undertiteln och de insatta medierna med sitt eget namn.
      kalla: (k) => (k.typ === 'forum' ? `forumet ${k.podd}` : k.typ === 'media' ? String(k.podd || '') : poddNamn(k.podd)),
      citaten: 'Citaten är översatta från engelska.',
    },
    omgangen: {
      rubrik: 'Resultaten',
      rattRad: 'Rätt rad',
      kupongen: (ok, n) => `Gängets kupong: ${ok} rätt av ${n}.`,
      datorn: (ok, n) => `Datorns rad: ${ok} rätt av ${n}.`,
      siffror: 'Siffrorna',
      mal: (m, n) => `${m} mål på ${ordet(n)} ${n === 1 ? 'match' : 'matcher'}, ${decimal(m / n)} per match.`,
      utfall: (h, x, b) => `${stor(lista([`${ordet(h)} ${h === 1 ? 'hemmaseger' : 'hemmasegrar'}`, `${ordet(x)} ${x === 1 ? 'oavgjord' : 'oavgjorda'}`, `${ordet(b)} ${b === 1 ? 'bortaseger' : 'bortasegrar'}`]))}.`,
      malrikast: (h, b, s) => `Flest mål: ${h}–${b}, ${s}.`,
      flest: (namn, ok, n) => `Flest rätt: ${lista(namn)}, ${ok} av ${n}.`,
    },
    betyg: {
      ensam: (lag) => `Ensam om rätt i ${lag}.`,
      ensamMer: (n) => `Ensam om rätt i ${ordet(n)} matcher.`,
      ingen: 'Ensam om ingenting.',
      sist: 'Sist i omgången.',
      bast: 'Bäst i omgången.',
      traff: (tecken, h, b, p) => `Bästa träffen var ${tecken} i ${h}–${b}, som datorn gav ${p} %.`,
      miss: (tecken, h, b, p) => `Missade ${tecken} i ${h}–${b}, där datorn gav ${p} %.`,
      borta: 'Lämnade aldrig in någon kupong.',
    },
    skrall: {
      vann: (v, f, s, p) => `${v} slog ${f} med ${s}. Datorn gav det ${p} %.`,
      lika: (h, b, s, p) => `${h} och ${b} spelade ${s}. Datorn gav krysset ${p} %.`,
      ingen: 'Ingen i gänget hade det.',
      alla: 'Alla i gänget hade det.',
      en: (n) => `Bara ${n} hade det.`,
      fler: (l) => `${l} hade det.`,
      citat: 'Det ni skrev',
      blev: (s) => `Det slutade ${s}.`,
      efterat: 'efteråt',
    },
    kronika: {
      rubrik: {
        alla: ['Vad var det jag sa'],
        bra: ['Precis som jag sa', 'Det var väntat'],
        mitten: ['Matcherna hade fel', 'Det var matcherna'],
        lite: ['Matcherna hade fel', 'Skyll inte på mig'],
      },
      namn: [
        (namn) => `”${namn}”, stod det på kupongen. Jag sa redan då att det var fel, men ingen lyssnar i den här baren.`,
        (namn) => `Omgången hette ”${namn}”. Det namnet hade jag aldrig valt, och nu vet ni varför.`,
      ],
      utanNamn: ['Jag sa redan före avspark hur det skulle gå, men ingen lyssnar i den här baren.'],
      alla: (a) => `${stor(ordet(a))} rätt på er kupong. Det var precis vad jag sa.`,
      bra: (a, b) => `${stor(ordet(a))} rätt på er kupong är bra. ${stor(ordet(b))} hade varit bättre.`,
      mitten: (a) => `${stor(ordet(a))} rätt på er kupong är inget att skriva hem om, men det gör jag ändå.`,
      lite: (a) => `${stor(ordet(a))} rätt på er kupong. Jag har sett bättre på en lottsedel.`,
      skrallVann: [
        (v, f, s, p) => `${v} slog ${f} med ${s}, och datorn hade gett det ${p} procent. Jag visste det redan i torsdags, men ingen frågade mig.`,
        (v, f, s, p) => `Att ${v} skulle slå ${f} såg jag på långt håll. Datorn gav det ${p} procent, och det säger mer om datorn än om mig.`,
      ],
      skrallLika: [
        (h, b, s, p) => `${h} mot ${b} slutade ${s}, och datorn hade gett krysset ${p} procent. Jag har sett fler kryss än datorn, och det märktes.`,
      ],
      vinnare: [
        (n, ok) => `${n} vann omgången med ${ordet(ok)} rätt. Det ska jag inte ta ifrån ${n}, men tur är också en sorts begåvning.`,
        (n, ok) => `Grattis till ${n}, som vann med ${ordet(ok)} rätt. Jag hade gjort likadant om jag hade fått tippa i lugn och ro.`,
      ],
      // fler hade lika många rätt, men vinnaren fick mest poäng
      vinnarePoang: [
        (n, ok) => `${n} vann omgången på poängen, fast fler hade ${ordet(ok)} rätt. Det ska jag inte ta ifrån ${n}, men tur är också en sorts begåvning.`,
        (n, ok) => `Fler hade ${ordet(ok)} rätt, men ${n} vann på poängen. Jag hade gjort likadant om jag hade fått tippa i lugn och ro.`,
      ],
      vinnareFler: (l, ok) => `${l} delade på segern med ${ordet(ok)} rätt var. Jag delar gärna ut beröm, men inte i onödan.`,
      jagVann: (ok) => `Omgången vann jag själv, med ${ordet(ok)} rätt. Jag säger det inte för att skryta, utan för att det är sant.`,
      jagVannPoang: 'Omgången vann jag själv, på poängen. Jag säger det inte för att skryta, utan för att det är sant.',
      sist: [
        (n) => `${n} kom sist. Det pratar vi inte mer om här.`,
        (n) => `${n} kom sist, och det får räcka som kommentar.`,
      ],
      jagSist: 'Själv kom jag sist, men det var matcherna som spelades fel.',
      jagBra: (ok) => `Själv fick jag ${ordet(ok)} rätt, men det tänker jag inte skryta om.`,
      jagDaligt: 'Min egen kupong tänker jag inte gå in på, för den var bättre än resultaten.',
      datornBast: (m) => `Datorn fick ${ordet(m)} rätt och slog er allihop. Den har aldrig stått bakom en bardisk, så jag tar det inte personligt.`,
      datornSamst: (m) => `Datorn fick bara ${ordet(m)} rätt. Den har aldrig stått bakom en bardisk, och det märks.`,
      slut: [
        'Nästa vecka blir det bättre. Det blir det alltid.',
        'Kaffet är gratis för den som lyssnar på mig nästa gång.',
        'Nya kuponger ligger på disken på måndag, och jag finns här som vanligt.',
      ],
    },
  };

  // ---------- delarna ----------

  // Sidhuvudet som i en tidning: sidnumret ytterst, tidningens namn och datumet.
  const folio = (u, nr) => {
    const namn = esc(NAMN[u.tid] || NAMN.sb);
    const dag = esc(u.datumText || '');
    return `<div class="tn-folio${nr % 2 ? ' h' : ''}"><b>${nr}</b><span>${namn}</span><span>${dag}</span></div>`;
  };
  // Vinjetten överst på sidan: avdelningen, och till höger det som gäller hela sidan.
  const vinjett = (namn, hoger = '') => `<div class="tn-vinjett"><b>${esc(namn.toUpperCase())}</b>${hoger ? `<span>${esc(hoger)}</span>` : ''}</div>`;
  const rubrik = (text, kl = '') => `<h3 class="tn-rub${kl ? ` ${kl}` : ''}">${esc(text)}</h3>`;
  const bild = (src, w, h, kl = '') => (src ? `<canvas class="tn-foto${kl ? ` ${kl}` : ''}" width="${w}" height="${h}" data-bild="${esc(src)}"></canvas>` : `<span class="tn-foto tom${kl ? ` ${kl}` : ''}"></span>`);
  const bollar = (n) => `<span class="tn-boll" aria-label="${n} av 5">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  // [1], [2, 3] i analyserna pekar på källorna, som tidningen räknar upp efteråt
  const utanRef = (s) => String(s || '').replace(/\s*\[\d+(?:\s*[,;]\s*\d+)*\]/g, '');
  const tecknet = (signs) => (Array.isArray(signs) ? signs.map((n) => SIGNS[n]).filter(Boolean).join('') : String(signs || ''));
  const kallorna = (l) => [...new Set((l || []).map((k) => k && (k.source || k.källa || k.kalla)).filter(Boolean))];

  // Datorns procent för 1, X och 2, det troligaste i fetstil.
  const procent = (p) => {
    if (!p) return '<td class="tn-p" colspan="3">–</td>';
    const max = Math.max(...p);
    return p.map((x) => `<td class="tn-p${x === max ? ' max' : ''}">${pr(x)}</td>`).join('');
  };
  const matchNamn = (h, b) => `${esc(h)}–${esc(b)}`;

  // ---------- Tipsligan ----------

  // l: [{ id, name, pts, ok, rounds }] i ordning (Tippoang.season), fore: samma före omgången eller null.
  function liga(u, l, fore, omg) {
    if (!l || !l.length) return '';
    let p = 0;
    let fk = null;
    const platsFore = new Map();
    if (fore) {
      let q = 0;
      let k0 = null;
      fore.forEach((x, i) => {
        const k = nyckel(x);
        if (k !== k0) { q = i + 1; k0 = k; }
        platsFore.set(x.id, q);
      });
    }
    const rader = l.map((x, i) => {
      const k = nyckel(x);
      if (k !== fk) { p = i + 1; fk = k; }
      const f = platsFore.get(x.id);
      const flytt = fore && f ? (f > p ? '<i class="upp" title="Klättrade">▲</i>' : f < p ? '<i class="ned" title="Föll">▼</i>' : '') : '';
      return `<tr><td class="tn-plac">${p}</td><td class="tn-namn">${esc(u.namnAv(x.id, x.name))}${flytt}</td><td>${x.rounds || ''}</td><td>${x.ok}</td><td class="tn-pts">${poang(x.pts)}</td></tr>`;
    }).join('');
    return `<div class="tn-liga"><div class="tn-rad-rub"><b>${esc(TEXT.liga.rubrik.toUpperCase())}</b><span>${esc(TEXT.liga.efter(omg))}</span></div>` +
      `<table><thead><tr><th></th><th></th><th title="Omgångar">Omg</th><th title="Rätt">Rätt</th><th title="Poäng mot datorn">Poäng</th></tr></thead><tbody>${rader}</tbody></table></div>`;
  }

  // ---------- inför omgången ----------

  function tipset(u) {
    const m = u.matcher || [];
    if (!m.length) return null;
    const rad = m.map((x) => `<tr><td class="tn-nr">${x.nr}</td><td class="tn-match"><span>${matchNamn(x.h, x.b)}</span><small>${esc(avspark(x.avspark))}</small></td>${procent(x.pr)}<td class="tn-tk">${esc(x.expert || '')}</td></tr>`).join('');
    const T = TEXT.tipset;
    const tabell = `<table class="tn-tabell tn-tips"><thead><tr><th></th><th></th><th colspan="3">${esc(T.datorn)}, %</th><th>${esc(T.experten)}</th></tr>` +
      `<tr class="sm"><th></th><th></th><th>1</th><th>X</th><th>2</th><th></th></tr></thead><tbody>${rad}</tbody></table>`;
    const l = u.liga && u.liga.efter && u.liga.efter.length ? liga(u, u.liga.efter, null, u.liga.omg) : '';
    return {
      namn: TEXT.sidor.tipset,
      html: vinjett(TEXT.sidor.tipset, u.nr ? `Kupong ${u.nr}` : '') + rubrik(T.rubrik) + tabell + (l ? `<div class="tn-under">${l}</div>` : ''),
    };
  }

  // Lagen i notisen (lag ur filen, annars ur "Hemma – Borta") och veckans bild för var och en (data/tidning-bilder/,
  // som iMacen hämtar med tidningen), med skölden som reserv (u.skold). → [{ src, reserv, lag, foto }] eller []
  const lagI = (n) => (Array.isArray(n.lag) && n.lag.length === 2 ? n.lag : String(n.match || '').split(/\s+[–-]\s+/).slice(0, 2));
  // Fotografen eller sajten, så kort som under en tidningsbild (Getty Images, Sky Sports).
  function fotograf(b) {
    const f = String(b.foto || '');
    if (/getty/i.test(f)) return 'Getty Images';
    if (f) return f.split('/').pop().replace(/^\s*\(?photo by\s*/i, '').replace(/[()]/g, '').trim() || null;
    return String(b.kalla || '').split(/\s+[-–|]\s+/)[0].trim() || null;
  }
  const fotoText = (l) => {
    const f = [...new Set(l.filter(Boolean))];
    return f.length ? `Foto: ${f.join(', ')}` : '';
  };
  function notisBilder(u, n) {
    const skold = (lag) => (lag && typeof u.skold === 'function' ? u.skold(lag) || '' : '');
    const ut = lagI(n).map((lag, i) => {
      const b = n.bilder && n.bilder[i];
      if (b && b.fil) return { src: `data/tidning-bilder/${b.fil}`, reserv: skold(lag), lag, foto: fotograf(b) };
      const s = skold(lag);
      return s ? { src: s, skold: true, lag } : null;
    });
    return ut.some((x) => x && !x.skold) ? ut : [];
  }
  // Två bilder bredvid varandra, hemma och borta, med lagets namn i underkanten.
  function bildrad(bilder, namn) {
    if (!bilder.length) return '';
    return `<div class="tn-bilder">${bilder.map((b, i) => `<figure>${b ? `<canvas class="tn-foto${b.skold ? ' skold' : ''}" width="320" height="200" data-bild="${esc(b.src)}"${b.reserv ? ` data-reserv="${esc(b.reserv)}"` : ''}${b.foto ? ` data-foto="${esc(b.foto)}"` : ''}></canvas>` : '<span class="tn-foto tom"></span>'}` +
      `<figcaption>${esc(namn[i] || (b && b.lag) || '')}</figcaption></figure>`).join('')}</div>`;
  }

  function notiser(u) {
    const l = (u.notiser || []).filter((n) => n && n.rubrik && n.text);
    if (!l.length) return null;
    // i kupongens ordning, med kupongens nummer
    const match = (n) => (u.matcher || []).find((x) => String(x.id) === String(n.id)) || (u.matcher || []).find((x) => x.nr === n.nr);
    const nr = (n) => (match(n) ? match(n).nr : n.nr);
    const sida = l.slice().sort((a, b) => nr(a) - nr(b)).map((n) => {
      const m = match(n);
      const kicker = m ? matchNamn(m.h, m.b) : esc(n.match || '');
      const k = kallorna(n.kallor);
      const bilder = notisBilder(u, n);
      const foto = fotoText(bilder.filter((x) => x && !x.skold).map((x) => x.foto));
      return `<article class="tn-notis">${bildrad(bilder, m ? [m.h, m.b] : lagI(n))}<p class="tn-kick"><b>${m ? m.nr : n.nr}</b>${kicker}</p><h4>${esc(n.rubrik)}</h4><p>${esc(utanRef(n.text))}</p>` +
        (k.length || bilder.length ? `<p class="tn-kalla">${esc(k.join(', '))}${k.length && foto ? '. ' : ''}<span class="tn-fotoav">${esc(foto)}</span></p>` : '') + '</article>';
    }).join('');
    return {
      namn: TEXT.sidor.notiser,
      html: vinjett(TEXT.sidor.notiser) + `<p class="tn-ingress">${esc(TEXT.notiser.ingress)}</p><div class="tn-spalter">${sida}</div>`,
    };
  }

  function analys(u) {
    const a = u.analys;
    if (!a || !a.title || !(a.paragraphs || []).length) return null;
    const stycken = (a.paragraphs || []).map((s) => `<p>${esc(utanRef(s))}</p>`).join('');
    const k = kallorna(a.sources);
    const t = a.tip;
    const tips = t && t.sign ? `<aside class="tn-tipsruta"><p class="tn-rad-rub"><b>${esc(TEXT.analys.tipset.toUpperCase())}</b></p><p class="tn-tecken"><b>${esc(t.sign)}</b>${t.note ? `<em>${esc(t.note)}</em>` : ''}</p>` +
      (t.text ? `<p>${esc(utanRef(t.text))}</p>` : '') + '</aside>' : '';
    return {
      namn: TEXT.sidor.analys,
      html: vinjett(TEXT.sidor.analys, `${a.nr ? `${a.nr} · ` : ''}${a.h}–${a.b}`) + `<h3 class="tn-rub stor">${esc(a.title)}</h3>` +
        (a.lead ? `<p class="tn-ingress fet">${esc(utanRef(a.lead))}</p>` : '') +
        `<p class="tn-byline">${esc(String(a.author || 'Sixten Bråvall').replace(/\s*\(påhittad\)\s*$/, ''))}${a.avspark ? ` · avspark ${esc(avspark(a.avspark))}` : ''}</p>` +
        `<div class="tn-artikel">${stycken}${tips}</div>` + (k.length ? `<p class="tn-kalla">Källor: ${esc(k.join(', '))}</p>` : ''),
    };
  }

  // Supporterpoddarna: en informationssida per match (data/poddsidor.json, skrivna på iMacen av
  // scripts/tidning/poddar.mjs). Hemmalaget till vänster och bortalaget till höger. Användarens önskemål
  // 2026-11-10: "betydligt mer organiserat/snyggt och överblickbart … kortfattad och snygg information", med
  // datum på referenserna. Under laget står källorna med sina datum (Ur podden SK3 TV (9 nov) och forumet …),
  // sedan ämnena med ett ord i en smal spalt till vänster och punkterna till höger, var och en med en liten
  // markör för slaget (nyckeln står under sidan). Källan och datumet står vid punkten bara när laget har flera
  // källor, eller när punkten har ett eget datum som inte syns i raden (ett foruminlägg). Hela sidan har högst
  // ett citat, det bästa, under laget det gäller. Helgarderat (helgarderat.js) ställer upp sidorna likadant med
  // poddLaget, poddCitat och poddUr härifrån.
  const fKort = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', day: 'numeric', month: 'short' });
  const kortDatum = (d) => (Number.isFinite(Date.parse(d)) ? fKort.format(new Date(d)).replace('.', '') : '');
  // "The Tilehurst End - A Reading FC Podcast" → "The Tilehurst End"
  const poddNamn = (n) => String(n || '').split(/\s+[-–|:]\s+/)[0].trim() || String(n || '');
  const iso = (d) => (typeof d === 'string' && /^\d{4}-\d\d-\d\d/.test(d) ? d.slice(0, 10) : '');
  // ['2026-11-02', '2026-11-09'] → "2 och 9 nov", ['2026-10-28', '2026-11-03'] → "28 okt och 3 nov"
  function datumen(l0) {
    const d = [...new Set([].concat(l0).map(iso).filter(Boolean))].sort().map(kortDatum).filter(Boolean);
    const man = d.map((x) => x.split(' ')[1]);
    return lista(man.every((m) => m === man[0]) ? d.map((x, i) => (i < d.length - 1 ? x.split(' ')[0] : x)) : d);
  }
  const kallansNamn = (k) => (k.typ === 'podd' ? poddNamn(k.podd) : String(k.podd || ''));
  // Lagets källor och punkter. → { kallor: [{podd, typ, adress, datum: [...]}], rader: [{amne, punkter: [{t, s, ref}]}] }
  // Samma podd, forum eller insatta medium står en gång, med alla sina datum (två avsnitt: 2 och 9 nov).
  function poddLaget(d) {
    // i underlagets ordning (poddarna, forumet, de insatta), och länken till det senaste
    const kallor = [];
    for (const k of ((d && d.kallor) || []).filter((y) => y && y.podd)) {
      const typ = ['forum', 'media'].includes(k.typ) ? k.typ : 'podd';
      let x = kallor.find((y) => y.typ === typ && y.podd === k.podd);
      if (!x) kallor.push((x = { podd: k.podd, typ, adress: null, datum: [], senast: '' }));
      const dt = iso(k.datum);
      if (dt && !x.datum.includes(dt)) x.datum = [...x.datum, dt].sort();
      if (k.adress && (!x.adress || dt >= x.senast)) x.adress = k.adress;
      if (dt > x.senast) x.senast = dt;
    }
    const flera = kallor.length > 1;
    // Punktens datum: punktens eget (nattjobbet sparar det från 2026-11-10: foruminläggets dag, avsnittets,
    // artikelns), annars källans när den bara har ett.
    const ref = (p) => {
      const namn = [].concat(p.podd || []).filter(Boolean);
      const egna = Array.isArray(p.datum) ? p.datum : namn.map(() => p.datum);
      return lista(namn.map((n, i) => {
        const k = kallor.find((y) => y.podd === n);
        const eget = iso(egna[i]);
        if (!flera) return eget && k && (k.datum.length > 1 || !k.datum.includes(eget)) ? kortDatum(eget) : '';
        const dt = eget || (k && k.datum.length === 1 ? k.datum[0] : '');
        return [k ? kallansNamn(k) : poddNamn(n), kortDatum(dt)].filter(Boolean).join('\u00a0');
      }).filter(Boolean));
    };
    const rader = ((d && d.grupper) || []).map((g) => ({
      amne: g.amne,
      punkter: (g.punkter || []).filter((p) => p && p.t).map((p) => ({ t: p.t, s: TEXT.poddar.slag[p.s] ? p.s : 'h', ref: ref(p) })),
    })).filter((r) => r.punkter.length);
    return { kallor, rader };
  }
  // Källorna som en rad under laget: Ur podden SK3 TV (9 nov) och forumet Owlstalk (10 nov). lank: med länkar.
  function poddUr(kallor, lank = false) {
    const T = TEXT.poddar;
    if (!kallor.length) return '';
    return esc(T.ur('\u0001')).replace('\u0001', lista(kallor.map((k) => {
      const namn = esc(kallansNamn(k));
      const a = lank && k.adress ? `<a href="${esc(k.adress)}" target="_blank" rel="noopener">${namn}</a>` : namn;
      return `${T.typord[k.typ] ? `${esc(T.typord[k.typ])} ` : ''}${a}${k.datum.length ? ` (${esc(datumen(k.datum))})` : ''}`;
    })));
  }
  // Sidans enda citat: helst om truppen eller elvan, sedan med ett namn, och inte för långt eller för kort. Lika
  // bra: det som står först, alltså det tyngsta.
  // → { i (lagets plats), sagt, vem } eller null
  function poddCitat(delar) {
    const l = [];
    (delar || []).forEach((d, i) => {
      for (const g of (d && d.grupper) || []) for (const p of g.punkter || []) if (p && p.t && p.citat && p.citat.sagt) l.push({ i, d, amne: g.amne, p, c: p.citat });
    });
    const poang = (x) => (['trupp', 'elva'].includes(x.amne) ? 2 : 0) + (x.c.vem ? 1 : 0) - (x.c.sagt.length > 170 ? 4 : 0) - (x.c.sagt.length < 45 ? 2 : 0);
    const x = l.map((y, n) => ({ ...y, n })).sort((a, b) => poang(b) - poang(a) || a.n - b.n)[0];
    if (!x) return null;
    const k = poddLaget(x.d).kallor.find((y) => y.podd === x.c.podd);
    const namn = [].concat(x.p.podd || []);
    const eget = iso(Array.isArray(x.p.datum) ? x.p.datum[namn.indexOf(x.c.podd)] : x.p.datum);
    const dt = eget || (k && k.datum.length === 1 ? k.datum[0] : '');
    return { i: x.i, sagt: x.c.sagt, vem: stor([x.c.vem, TEXT.poddar.kalla(x.c), kortDatum(dt)].filter(Boolean).join(', ')) };
  }
  function poddar(u) {
    const ps = u.poddsidor;
    const l = ((ps && ps.sidor) || []).filter((x) => x && Array.isArray(x.delar) && x.delar.some((d) => d && (d.grupper || []).length));
    if (!l.length) return null;
    const T = TEXT.poddar;
    const kort = (a) => T.kort[a] || T.kort.match;
    const match = (x) => (u.matcher || []).find((m) => String(m.id) === String(x.id));
    const nr = (x) => (match(x) ? match(x).nr : x.nr);
    const mark = (k) => `<i class="tn-mark s-${k}" role="img" aria-label="${esc(T.nyckel[k])}" title="${esc(T.nyckel[k])}"></i>`;
    return l.slice().sort((a, b) => nr(a) - nr(b)).map((x) => {
      const m = match(x);
      const namn = m ? [m.h, m.b] : (x.lag || []);
      const cit = poddCitat(x.delar);
      const delar = x.delar.map((d, i) => {
        const lag = poddLaget(d);
        const ur = poddUr(lag.kallor);
        const rader = lag.rader.map((r) => `<div class="tn-pod-rad"><b>${esc(kort(r.amne))}</b><ul>${r.punkter.map((p) =>
          `<li>${mark(p.s)}${esc(hel(p.t))}${p.ref ? ` <small>${esc(p.ref)}</small>` : ''}</li>`).join('')}</ul></div>`).join('');
        const c = cit && cit.i === i ? `<blockquote class="tn-pod-citat"><p>”${esc(hel(cit.sagt))}”</p><cite>${esc(cit.vem)}</cite></blockquote>` : '';
        return `<section class="tn-pod-lag${rader ? '' : ' tom'}"><h4>${esc(namn[i] || d.lag || '')}</h4>${ur ? `<p class="tn-kalla">${ur}</p>` : ''}` +
          `${rader ? `<div class="tn-pod-rader">${rader}</div>` : `<p class="tn-pod-ingen">${esc(T.ingen)}</p>`}${c}</section>`;
      }).join('');
      const fot = `<p class="tn-pod-fot">${['b', 'h', 'o'].map((k) => `<span>${mark(k)}${esc(T.nyckel[k])}</span>`).join('')}${cit ? `<span>${esc(T.citaten)}</span>` : ''}</p>`;
      return {
        namn: TEXT.sidor.poddar,
        html: vinjett(TEXT.sidor.poddar, `${nr(x) ? `${nr(x)} · ` : ''}${namn.join('–')}`) + `<h3 class="tn-rub stor">${esc(x.rubrik || T.rubrik(namn[0], namn[1]))}</h3>` +
          (x.ingress ? `<p class="tn-ingress fet">${esc(hel(x.ingress))}</p>` : '') + `<div class="tn-pod${x.delar.filter((d) => (d.grupper || []).length).length < 2 ? ' en' : ''}">${delar}</div>${fot}`,
      };
    });
  }

  // ---------- efter omgången ----------

  // De som tippade, och var och ens plats i omgången (lika poäng och rätt ger samma plats).
  function folket(sum) {
    const folk = sum.folk.filter((p) => !p.none);
    const ord = folk.slice().sort((a, b) => nyckel(b) - nyckel(a));
    const plac = new Map();
    let q = 0;
    let k0 = null;
    ord.forEach((p, i) => {
      const k = nyckel(p);
      if (k !== k0) { q = i + 1; k0 = k; }
      plac.set(p.id, q);
    });
    return { folk, plac };
  }

  function omgangen(u) {
    const sum = u.efter;
    const T = TEXT.omgangen;
    const { folk } = folket(sum);
    const rader = sum.rader.map((r) => {
      const p = r.res != null && r.pr ? pr(r.pr[r.res]) : null;
      const ratt = folk.filter((x) => r.ratt.includes(x.id)).length;
      return `<tr><td class="tn-nr">${r.nr}</td><td class="tn-match"><span>${matchNamn(r.h, r.b)}</span></td><td class="tn-res">${esc(r.mal)}</td><td class="tn-tk">${esc(r.tecken)}</td>` +
        `<td class="tn-p${p != null && p <= 25 ? ' rod' : ''}">${p == null ? '–' : `${p} %`}</td><td class="tn-ratt">${folk.length ? `${ratt}/${folk.length}` : ''}</td></tr>`;
    }).join('');
    const tabell = `<table class="tn-tabell tn-res-tab"><thead><tr><th></th><th></th><th>Res</th><th>Tecken</th><th title="Datorns chans för det som hände">Datorn</th><th title="Hur många av er som hade rätt">Rätt</th></tr></thead><tbody>${rader}</tbody></table>`;
    const rad = `<div class="tn-rattrad"><b>${esc(T.rattRad.toUpperCase())}</b><span>${sum.rader.map((r) => `<i>${esc(r.tecken || '–')}</i>`).join('')}</span></div>`;
    // siffrorna
    const spelade = sum.rader.filter((r) => r.res != null);
    const s = [];
    if (spelade.length) {
      const mal = spelade.reduce((a, r) => a + (r.goals || 0), 0);
      s.push(T.mal(mal, spelade.length));
      s.push(T.utfall(...[0, 1, 2].map((j) => spelade.filter((r) => r.res === j).length)));
      const mest = spelade.reduce((a, r) => ((r.goals || 0) > (a.goals || 0) ? r : a));
      if (mest.goals >= 4) s.push(T.malrikast(mest.h, mest.b, mest.mal));
    }
    if (sum.kupong && sum.kupong.n) s.push(T.kupongen(sum.kupong.ok, sum.kupong.n));
    if (sum.dator && sum.dator.n) s.push(T.datorn(sum.dator.ok, sum.dator.n));
    const topp = folk.length ? Math.max(...folk.map((p) => p.ok)) : null;
    if (topp != null && folk.length > 1) s.push(T.flest(folk.filter((p) => p.ok === topp).map((p) => u.namnAv(p.id, p.namn)), topp, sum.n));
    const siffror = s.length ? `<aside class="tn-fakta"><b>${esc(T.siffror.toUpperCase())}</b><div>${s.map((t) => `<p>${esc(hel(t))}</p>`).join('')}</div></aside>` : '';
    return {
      namn: TEXT.sidor.omgangen,
      html: vinjett(TEXT.sidor.omgangen, sum.nr ? `Kupong ${sum.nr}` : '') + rubrik(T.rubrik) + (sum.namn ? `<p class="tn-omgnamn">”${esc(sum.namn.replace(/[.!?…]+$/, ''))}”</p>` : '') +
        tabell + rad + siffror,
    };
  }

  // Vad tidningen skriver om var och en: ensam om rätt, sedan den bästa träffen eller den värsta missen.
  function omdome(u, sum, p, plac) {
    const T = TEXT.betyg;
    if (p.none) return T.borta;
    const lag = p.ensam.map((r) => r.h);
    const ut = [!lag.length ? T.ingen : lag.length <= 2 ? T.ensam(lista(lag)) : T.ensamMer(lag.length)];
    if (p.award === 'best') ut.push(T.bast);
    else if (p.award === 'worst') ut.push(T.sist);
    let bast = null;
    let miss = null;
    sum.rader.forEach((r, i) => {
      const c = p.rows && p.rows[i];
      if (!c || c.pts == null) return;
      if (c.hit && (!bast || c.prob < bast.c.prob)) bast = { r, c };
      if (!c.hit && (!miss || c.prob > miss.c.prob)) miss = { r, c };
    });
    if (bast && bast.c.prob <= 0.45) ut.push(T.traff(bast.c.sign, bast.r.h, bast.r.b, pr(bast.c.prob * 100)));
    else if (miss && miss.c.prob >= 0.6) ut.push(T.miss(miss.c.sign, miss.r.h, miss.r.b, pr(miss.c.prob * 100)));
    return ut.join(' ');
  }

  function betygen(u) {
    const sum = u.efter;
    const { plac } = folket(sum);
    const folk = sum.folk.slice().sort((a, b) => (a.id === HASSE) - (b.id === HASSE) || a.hand - b.hand);
    if (!folk.length) return null;
    const kort = folk.map((p) => {
      const rad = p.none ? '' : `<p class="tn-stat"><b>${p.ok} rätt</b><span>${poang(p.pts)}</span><span>${plats(plac.get(p.id))}</span></p>`;
      return `<div class="tn-betyg-kort">${bild(p.bild, 240, 240)}<div><div class="tn-nm"><span>${esc(u.namnAv(p.id, p.namn))}</span>${bollar(p.betyg)}</div>${rad}<p class="tn-om">${esc(omdome(u, sum, p, plac))}</p></div></div>`;
    }).join('');
    return {
      namn: TEXT.sidor.betygen,
      html: vinjett(TEXT.sidor.betygen, `${ordet(sum.n).toUpperCase()} MATCHER`) + `<div class="tn-betygen">${kort}</div>`,
    };
  }

  // Omgångens skräll: det datorn trodde minst på. → { r, p, text, rub }, eller null
  function skrall(u, sum) {
    const T = TEXT.skrall;
    const r = sum.rader.filter((x) => x.res != null && x.pr).sort((a, b) => a.pr[a.res] - b.pr[b.res])[0];
    if (!r) return null;
    const p = pr(r.pr[r.res]);
    if (p > 40) return null;
    const [v, f, s] = r.res === 2 ? [r.b, r.h, r.mal.split('–').reverse().join('–')] : [r.h, r.b, r.mal];
    const forsta = r.res === 1 ? T.lika(r.h, r.b, r.mal, p) : T.vann(v, f, s, p);
    const folk = sum.folk.filter((x) => !x.none);
    const ratt = folk.filter((x) => r.ratt.includes(x.id)).map((x) => u.namnAv(x.id, x.namn));
    const vem = !folk.length ? '' : !ratt.length ? T.ingen : ratt.length === folk.length ? T.alla : ratt.length === 1 ? T.en(ratt[0]) : T.fler(lista(ratt));
    // som på löpsedeln: favoriten snubblade, eller den ena fällde (hemma) eller sänkte (borta) den andra
    const rub = r.res === 1 ? [r.pr[0] >= r.pr[2] ? r.h : r.b, 'SNUBBLADE'] : [v, r.res === 0 ? 'FÄLLDE' : 'SÄNKTE', f];
    return { r, p, v, f, s, text: `${forsta}${vem ? ` ${vem}` : ''}`, rub };
  }

  // Det ni skrev på kupongen (motiveringen) och efteråt, med facit. Högst fyra, helst från olika personer,
  // och först om skrällen och där någon var ensam om rätt.
  function citaten(u, sum) {
    const c = u.citat;
    if (!c) return [];
    const ut = [];
    for (const r of sum.rader) {
      for (const p of sum.folk) {
        const mot = c.notes && c.notes[r.id] && c.notes[r.id][p.id];
        const eft = c.efter && c.efter[r.id] && c.efter[r.id][p.id];
        const vikt = (r.kol[p.id] && r.kol[p.id].ensam ? 2 : 0) + (r.res != null && r.pr ? (100 - r.pr[r.res]) / 100 : 0);
        if (mot) ut.push({ r, p, text: String(mot).trim(), slag: 'mot', vikt: vikt + 0.5 });
        if (eft) ut.push({ r, p, text: String(eft).trim(), slag: 'eft', vikt });
      }
    }
    ut.sort((a, b) => b.vikt - a.vikt || a.r.nr - b.r.nr);
    const val = [];
    for (const x of ut) if (val.length < 4 && !val.some((y) => y.p.id === x.p.id)) val.push(x);
    for (const x of ut) if (val.length < 4 && !val.includes(x)) val.push(x);
    return val.sort((a, b) => a.r.nr - b.r.nr);
  }

  function skrallen(u) {
    const sum = u.efter;
    const sk = skrall(u, sum);
    const cit = citaten(u, sum);
    if (!sk && !cit.length) return null;
    const T = TEXT.skrall;
    const rub = sk ? `<div class="tn-skrall"><p class="tn-kick"><b>${sk.r.nr}</b>${matchNamn(sk.r.h, sk.r.b)} ${esc(hel(sk.r.mal))}</p><h3 class="tn-rub jatte">${sk.rub.map((t, i) => `<span${i === 1 ? ' class="rod"' : ''}>${esc(t.toUpperCase())}</span>`).join(' ')}</h3>` +
      `<p class="tn-ingress fet">${esc(hel(sk.text))}</p></div>` : '';
    const citat = cit.length ? `<div class="tn-citaten"><div class="tn-rad-rub"><b>${esc(T.citat.toUpperCase())}</b></div>${cit.map((x) => `<blockquote class="tn-citat">${bild(x.p.bild, 96, 96, 'liten')}` +
      `<p>”${esc(x.text.replace(/^[”"»«]+|[”"»«]+$/g, ''))}”</p><div class="tn-cit-fot"><b>${esc(u.namnAv(x.p.id, x.p.namn))}</b> ${x.slag === 'eft' ? `${esc(T.efterat)} ` : ''}om ${matchNamn(x.r.h, x.r.b)}. ${x.slag === 'mot' && x.r.mal ? esc(hel(T.blev(x.r.mal))) : ''}</div></blockquote>`).join('')}</div>` : '';
    return { namn: sk ? TEXT.sidor.skrallen : T.citat, html: vinjett(sk ? TEXT.sidor.skrallen : T.citat) + rub + citat };
  }

  // Hasse Backes krönika: omgångens namn, er kupong, skrällen, vinnaren och den som kom sist, datorn, han
  // själv och en avslutning. Samma omgång ger samma text.
  function kronika(u, sum) {
    const T = TEXT.kronika;
    const id = sum.id || sum.namn || '';
    const N = (p) => u.namnAv(p.id, p.namn);
    const { ok, n } = sum.kupong;
    const lage = n && ok === n ? 'alla' : ok * 13 >= n * 9 ? 'bra' : ok * 13 >= n * 6 ? 'mitten' : 'lite';
    const ut = [];
    ut.push(sum.namn ? valj(T.namn, `${id}n`)(sum.namn.replace(/[.!?…]+$/, '')) : valj(T.utanNamn, id));
    if (n) ut.push(lage === 'alla' ? T.alla(ok) : lage === 'bra' ? T.bra(ok, Math.min(n, ok + 2)) : lage === 'mitten' ? T.mitten(ok) : T.lite(ok));
    const sk = skrall(u, sum);
    if (sk && sk.p <= 30) ut.push(sk.r.res === 1 ? valj(T.skrallLika, `${id}s`)(sk.r.h, sk.r.b, sk.r.mal, sk.p) : valj(T.skrallVann, `${id}s`)(sk.v, sk.f, sk.s, sk.p));
    const { folk } = folket(sum);
    const han = folk.find((p) => p.id === HASSE);
    if (folk.length > 1) {
      const bast = folk.filter((p) => p.award === 'best');
      const sist = folk.filter((p) => p.award === 'worst');
      const delat = bast.length === 1 && folk.filter((p) => p.ok === bast[0].ok).length > 1;
      if (bast.length === 1 && bast[0].id === HASSE) ut.push(delat ? T.jagVannPoang : T.jagVann(bast[0].ok));
      else if (bast.length === 1) ut.push(valj(delat ? T.vinnarePoang : T.vinnare, `${id}v`)(N(bast[0]), bast[0].ok));
      else if (bast.length > 1) ut.push(T.vinnareFler(lista(bast.map(N)), bast[0].ok));
      if (sist.length === 1 && sist[0].id === HASSE) ut.push(T.jagSist);
      else if (sist.length === 1) ut.push(valj(T.sist, `${id}x`)(N(sist[0])));
      if (han && han.award !== 'best' && han.award !== 'worst') {
        const andra = folk.filter((p) => p.id !== HASSE).map((p) => p.ok).sort((a, b) => a - b);
        ut.push(han.ok >= andra[Math.floor(andra.length / 2)] ? T.jagBra(han.ok) : T.jagDaligt);
      }
    }
    const d = sum.dator;
    const manniskor = folk.filter((p) => p.id !== HASSE);
    if (d && d.n && manniskor.length) {
      if (manniskor.every((p) => p.ok < d.ok)) ut.push(T.datornBast(d.ok));
      else if (manniskor.every((p) => p.ok > d.ok)) ut.push(T.datornSamst(d.ok));
    }
    ut.push(valj(T.slut, `${id}e`));
    return { rubrik: valj(T.rubrik[lage], `${id}r`), stycken: ut };
  }

  function kronikan(u) {
    const sum = u.efter;
    const kr = kronika(u, sum);
    const l = u.liga && u.liga.efter && u.liga.efter.length ? liga(u, u.liga.efter, u.liga.fore, u.liga.omg) : '';
    const halva = Math.ceil(kr.stycken.length / 2);
    const text = [kr.stycken.slice(0, halva), kr.stycken.slice(halva)].filter((x) => x.length).map((x) => `<p>${esc(hel(x.join(' ')))}</p>`).join('');
    return {
      namn: TEXT.sidor.kronikan,
      html: vinjett(TEXT.sidor.kronikan, 'Hasse Backe') +
        `<div class="tn-delad${l ? '' : ' en'}"><div class="tn-kronika">${bild(HASSE_BILD, 200, 260, 'hasse')}<h3 class="tn-rub stor">${esc(kr.rubrik)}</h3>` +
        `<p class="tn-byline">Hasse Backe, tobakshandlare och expert</p><div class="tn-artikel kursiv">${text}</div></div>${l ? `<div>${l}</div>` : ''}</div>`,
    };
  }

  // ---------- Tipsguiden ----------

  // Veckans nummer (ISO-veckan) för tiden t, i Stockholm.
  const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
  function vecka(t) {
    const [y, m, d] = fYmd.format(new Date(t)).split('-').map(Number);
    const dag = new Date(Date.UTC(y, m - 1, d));
    dag.setUTCDate(d + 4 - (dag.getUTCDay() || 7));
    return Math.ceil(((dag - Date.UTC(dag.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }
  // Det troligaste tecknet enligt datorn, och hur troligt det är.
  const troligast = (p) => {
    if (!p) return null;
    const max = Math.max(...p);
    return { tecken: SIGNS[p.indexOf(max)], max };
  };

  // Framsidan, 100 × 140 som löpsedeln (zoom i rum.js): namnet, numret och datumet, en rubrik, kupongens
  // matcher med datorns tecken (först på raden, så att Spika inte skymmer dem), och puffarna. Samma på pulten och när den är framme.
  function forsta(u0) {
    const u = { ...u0 };
    const G = TEXT.guide;
    const m = u.matcher || [];
    const nyckel0 = u.id || m.map((x) => x.id).join(',');
    const i = frö(`${nyckel0}tg`) % G.rubrik.length;
    const [r1, r2] = G.rubrik[i];
    const forst = Math.min(...m.map((x) => Date.parse(x.avspark)).filter(Number.isFinite));
    const nr = Number.isFinite(forst) ? vecka(forst) : Number.isFinite(u.datum) ? vecka(u.datum) : null;
    const dag = Number.isFinite(u.datum) ? fDatum.format(new Date(u.datum)) : '';
    const rader = m.map((x) => {
      const t = troligast(x.pr);
      return `<li><b>${x.nr}</b><i>${t ? t.tecken : ''}</i><span>${matchNamn(x.h, x.b)}</span></li>`;
    }).join('');
    const med = m.map((x) => ({ x, t: troligast(x.pr) })).filter((y) => y.t);
    const jamn = med.filter((y) => y.t.max <= 42).sort((a, b) => a.t.max - b.t.max)[0];
    const fav = med.filter((y) => y.t.max >= 68 && y.t.tecken !== 'X').sort((a, b) => b.t.max - a.t.max)[0];
    const puff = (kick, text, kl = '') => `<span class="tg-puff${kl ? ` ${kl}` : ''}"><b>${esc(kick)}</b><span>${esc(text)}</span></span>`;
    const puffar = [
      jamn ? puff(G.rysaren, `${jamn.x.h}–${jamn.x.b}`) : '',
      puff(G.knep[0], G.knep[1], 'gul'),
    ].join('');
    const spik = fav ? `<span class="tg-spik"><b>${esc(G.spika)}</b><span>${esc(fav.t.tecken === '1' ? fav.x.h : fav.x.b)}!</span></span>` : '';
    return `<div class="tg-forsta" aria-label="Tipsguiden${nr ? ` nr ${nr}` : ''}"><div class="tg-namn"><b>TIPSGUIDEN</b></div>` +
      `<div class="tg-linje"><b>${nr ? esc(G.nr(nr)) : ''}</b><span>${esc(dag)}</span><span>${esc(G.pris)}</span></div>` +
      `<h2 class="tg-rub"><b>${esc(r1)}</b><b class="rod">${esc(r2)}</b></h2><p class="tg-under">${esc(G.under[i % G.under.length])}</p>` +
      (rader ? `<div class="tg-kup"><p><b>${esc(G.kupongen.toUpperCase())}</b><span>${esc(G.datorn)}</span></p><ol>${rader}</ol>${spik}</div>` +
        `<div class="tg-puffar">${puffar}</div>`
        // utan kupong: knepen på framsidan
        : `<div class="tg-kup"><p><b>${esc(TEXT.knep.rubrik.toUpperCase())}</b></p><ol>${TEXT.knep.lista.map(([t], n) => `<li><b>${n + 1}</b><span>${esc(t)}</span></li>`).join('')}</ol></div>`) +
      '</div>';
  }

  // Åtta knep, som alltid står i Tipsguiden: kvällstidningens råd, och nummer 5 är det alla gör fel.
  function knep() {
    const K = TEXT.knep;
    const rader = K.lista.map(([t, s], i) => `<li${i === 4 ? ' class="fel"' : ''}><b>${i + 1}</b><div><h4>${esc(t)}</h4><p>${esc(s)}</p>` +
      `${i === 4 ? `<span class="tg-stampel">${esc(K.stampel)}</span>` : ''}</div></li>`).join('');
    return {
      namn: TEXT.sidor.knep,
      html: vinjett(TEXT.sidor.knep) + rubrik(K.rubrik, 'stor') + `<p class="tn-ingress">${esc(K.ingress)}</p><ol class="tg-knep">${rader}</ol>`,
    };
  }

  // ---------- tidningen ----------

  // Sidorna ur listan, med sidnummer från 2 (framsidan är 1). En avdelning kan vara flera sidor: supporterpoddarna
  // har en per match. → { inne, blad, sidor } eller null
  function sidorna(u, lista) {
    const sidor = lista.flatMap((f) => {
      try {
        return f(u);
      } catch (e) {
        if (typeof console !== 'undefined') console.warn('Tidningen:', f.name, e);
        return null;
      }
    }).filter(Boolean);
    if (!sidor.length) return null;
    // I tidningen: avdelningens första sida
    const inne = `<nav class="tn-inne" aria-label="I tidningen"><b>I TIDNINGEN</b>${sidor.map((s, i) => (i && sidor[i - 1].namn === s.namn ? '' : `<button type="button" data-sida="${i + 2}"><span>${esc(s.namn)}</span><i>${i + 2}</i></button>`)).join('')}</nav>`;
    const blad = sidor.map((s, i) => `<section class="tn-ark tn-sida" id="tn-sida-${i + 2}" aria-label="Sidan ${i + 2}: ${esc(s.namn)}">${folio(u, i + 2)}${s.html}</section>`).join('');
    return { inne, blad, sidor: sidor.map((s) => s.namn) };
  }
  const forbered = (u0) => {
    const u = { namnAv: (id, n) => n, ...u0 };
    u.datumText = u.datumText || (Number.isFinite(u.datum) ? fDatum.format(new Date(u.datum)) : '');
    return u;
  };
  // → { inne, blad, sidor: [namn] }: sidorna under sedeln, och innehållet som står under den.
  function html(u0) {
    const u = forbered(u0);
    return sidorna(u, u.efter ? [omgangen, betygen, skrallen, kronikan] : [tipset, notiser, analys, poddar]);
  }
  // Tipsguiden: framsidan och sidorna inför omgången, och Åtta knep sist (finns alltid).
  // → { forsta, inne, blad, sidor }
  function guide(u0) {
    const u = forbered({ ...u0, tid: 'tg', efter: null });
    return { ...sidorna(u, [tipset, notiser, analys, poddar, knep]), forsta: forsta(u) };
  }

  // Tidningsbilderna: svartvita och rastrerade, ritade en gång på dukar (CSS-blandning kostar i telefonen).
  // Hasses porträtt skärs från toppen, så att ansiktet kommer med.
  function rastrera(rot) {
    for (const c of rot.querySelectorAll('canvas[data-bild]')) {
      const img = new Image();
      // ett foto som inte går att hämta ger lagets sköld (data-reserv), som står hel på papperet
      img.onerror = () => {
        if (!c.dataset.reserv || img.src.endsWith(c.dataset.reserv)) return;
        c.classList.add('skold');
        img.src = c.dataset.reserv;
        // och fotografen står inte längre under notisen
        const n = c.closest('.tn-notis');
        const av = n && n.querySelector('.tn-fotoav');
        if (av) {
          av.textContent = fotoText([...n.querySelectorAll('canvas[data-foto]:not(.skold)')].map((x) => x.dataset.foto));
          const k = av.previousSibling;
          if (!av.textContent && k && k.nodeType === 3) k.textContent = k.textContent.replace(/\. $/, '');
        }
      };
      img.onload = () => {
        const x = c.getContext('2d', { willReadFrequently: true });
        const { width: W, height: H } = c;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        if (c.classList.contains('skold')) {
          const k = (Math.min(W / iw, H / ih) * 0.78);
          x.fillStyle = '#fff';
          x.fillRect(0, 0, W, H);
          x.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
        } else {
          const k = Math.max(W / iw, H / ih);
          // Hasse från toppen, så att ansiktet kommer med, och veckans bilder med lite mer av överkanten
          const y = c.classList.contains('hasse') ? 0 : (H - ih * k) * (W > H * 1.3 ? 0.35 : 0.5);
          x.drawImage(img, (W - iw * k) / 2, y, iw * k, ih * k);
        }
        let d;
        try { d = x.getImageData(0, 0, W, H); } catch (e) { return; }
        const p = d.data;
        const ruta = Math.max(4, Math.round(W / 60));
        for (let y = 0; y < H; y++) {
          for (let i = 0; i < W; i++) {
            const o = (y * W + i) * 4;
            const g = Math.min(1, Math.max(0, ((0.3 * p[o] + 0.59 * p[o + 1] + 0.11 * p[o + 2]) / 255 - 0.5) * 1.25 + 0.55));
            // punkternas storlek efter hur mörkt det är: 45 grader, med tonen kvar under
            const uu = ((i + y) / ruta) % 1;
            const vv = ((i - y + 4 * H) / ruta) % 1;
            const r = Math.hypot(uu - 0.5, vv - 0.5) / 0.71;
            const v2 = g * 0.72 + (r < 1 - g ? 0 : 0.28);
            p[o] = 28 + v2 * 208;
            p[o + 1] = 24 + v2 * 208;
            p[o + 2] = 18 + v2 * 200;
          }
        }
        x.putImageData(d, 0, 0);
      };
      img.src = c.dataset.bild;
    }
  }

  return { html, guide, forsta, rastrera, kronika, skrall, citaten, omdome, poddNamn, poddLaget, poddCitat, poddUr, kortDatum, TEXT };
});
