'use strict';

// ---------- Helgarderat ----------
//
// Tidningen på pulten i tobaksaffären heter Helgarderat (2026-11-10: förut låg Tipsguiden till vänster om kupongen och
// veckans kvällstidning till höger, och de slogs ihop till en). Den ligger till höger om kupongen, med högen av
// inlämnade kuponger på sin nedre del, och ett klick tar upp den och lägger fram den över rummet (tidningPult och
// tidningen i rum.js). Framsidan är dess egen (forsta, 100 × 140, samma på pulten och i handen), och under den kommer
// sidorna, en under en, med sidnummer, tidningens namn och datumet i huvudet som i en riktig tidning. Vad som står i
// den beror på omgången:
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
// RumTidning.tidning(upplaga) → { forsta, inne, blad, sidor }. upplaga:
//   { id, datum, nr, namnAv(id, namn), skold(lag),
//     efter: sammanställningen (RumBlock.bygg) eller null, citat: { notes, efter } (Samtal.pult.gang()),
//     liga: { fore: [...], efter: [...], omg } (Tippoang.season), matcher, notiser, analys,
//     poddsidor: { amnen, sidor } }
// RumTidning.forsta(upplaga) → framsidan.
// RumTidning.rastrera(rot) ritar porträtten på sina dukar, svartvita och rastrerade.
//
// Helgarderat finns också som ett utkast på en egen sida (helgarderat.js), med det supportrarna vet.

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
  const NAMN = 'Helgarderat';

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
    },
    // Innehållet under framsidan: avdelningarna och kupongens matcher.
    inne: {
      tidningen: 'I tidningen',
      kupongen: 'På kupongen',
    },
    // Framsidan: numret, vilken omgång det gäller och veckans bild. Priset är tre kronor, tre rader: helgarderat.
    forsta: {
      nr: (n) => `Nr ${n}`,
      vecka: (v) => `Vecka ${v}`,
      pris: '3 kr',
      infor: (dag) => `Inför ${dag}`,
      efter: (dag) => `Efter ${dag}`,
      foto: (f) => `Foto: ${f}`,
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
    // Matchbladen ur supportrarnas poddar, forum och insatta medier (samma i helgarderat.html).
    poddar: {
      amnen: { trupp: 'Skador och trupp', elva: 'Väntad uppställning', spel: 'Så spelar laget', klubb: 'Tränaren och klubben', match: 'Inför matchen' },
      // Källans slag framför namnet: podden …, forumet … och (de insatta) bara namnet.
      typord: { podd: 'podden', forum: 'forumet', media: '' },
      rubrik: (h, b) => `${h}–${b}: det supportrarna vet`,
      ingen: 'Ingen supporterpodd, inget forum och inget från de insatta att hämta något ur den här veckan.',
      sammanfattning: 'Sammanfattning',
      kallorna: 'Källorna',
      matchen: 'Matchen',
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
  // Namnet går tillbaka till innehållet under framsidan (tidningen i rum.js), som på Helgarderats egen sida.
  const folio = (u, nr) => {
    const namn = esc(NAMN);
    const dag = esc(u.datumText || '');
    return `<div class="tn-folio${nr % 2 ? ' h' : ''}"><b>${nr}</b><button type="button" data-till="innehall">${namn}</button><span>${dag}</span></div>`;
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
    const rad = m.map((x) => `<tr data-match="${esc(x.id)}"><td class="tn-nr">${x.nr}</td><td class="tn-match"><span>${matchNamn(x.h, x.b)}</span><small>${esc(avspark(x.avspark))}</small></td>${procent(x.pr)}<td class="tn-tk">${esc(x.expert || '')}</td></tr>`).join('');
    const T = TEXT.tipset;
    const tabell = `<table class="tn-tabell tn-tips"><thead><tr><th></th><th></th><th colspan="3">${esc(T.datorn)}, %</th><th>${esc(T.experten)}</th></tr>` +
      `<tr class="sm"><th></th><th></th><th>1</th><th>X</th><th>2</th><th></th></tr></thead><tbody>${rad}</tbody></table>`;
    const l = u.liga && u.liga.efter && u.liga.efter.length ? liga(u, u.liga.efter, null, u.liga.omg) : '';
    return {
      namn: TEXT.sidor.tipset,
      om: m.map((x) => ({ id: String(x.id) })),
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
    const id = (n) => String(match(n) ? match(n).id : n.id || '');
    const ordning = l.slice().sort((a, b) => nr(a) - nr(b));
    const sida = ordning.map((n) => {
      const m = match(n);
      const kicker = m ? matchNamn(m.h, m.b) : esc(n.match || '');
      const k = kallorna(n.kallor);
      const bilder = notisBilder(u, n);
      const foto = fotoText(bilder.filter((x) => x && !x.skold).map((x) => x.foto));
      return `<article class="tn-notis"${id(n) ? ` data-match="${esc(id(n))}"` : ''}>${bildrad(bilder, m ? [m.h, m.b] : lagI(n))}<p class="tn-kick"><b>${m ? m.nr : n.nr}</b>${kicker}</p><h4>${esc(n.rubrik)}</h4><p>${esc(utanRef(n.text))}</p>` +
        (k.length || bilder.length ? `<p class="tn-kalla">${esc(k.join(', '))}${k.length && foto ? '. ' : ''}<span class="tn-fotoav">${esc(foto)}</span></p>` : '') + '</article>';
    }).join('');
    return {
      namn: TEXT.sidor.notiser,
      om: ordning.filter(id).map((n) => ({ id: id(n), rubrik: n.rubrik })),
      vikt: 1,
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
    const m = a.nr ? (u.matcher || []).find((x) => x.nr === a.nr) : null;
    return {
      namn: TEXT.sidor.analys,
      om: m ? [{ id: String(m.id), rubrik: a.title }] : [],
      vikt: 2,
      html: vinjett(TEXT.sidor.analys, `${a.nr ? `${a.nr} · ` : ''}${a.h}–${a.b}`) + `<h3 class="tn-rub stor">${esc(a.title)}</h3>` +
        (a.lead ? `<p class="tn-ingress fet">${esc(utanRef(a.lead))}</p>` : '') +
        `<p class="tn-byline">${esc(String(a.author || 'Sixten Bråvall').replace(/\s*\(påhittad\)\s*$/, ''))}${a.avspark ? ` · avspark ${esc(avspark(a.avspark))}` : ''}</p>` +
        `<div class="tn-artikel">${stycken}${tips}</div>` + (k.length ? `<p class="tn-kalla">Källor: ${esc(k.join(', '))}</p>` : ''),
    };
  }

  // Supporterpoddarna: ett matchblad per match (data/poddsidor.json, skrivna på iMacen av scripts/tidning/poddar.mjs).
  // Användarens önskemål 2026-11-10: "ett matchblad med information. Först en kort introduktion, sen diskussion om
  // ena laget, sen det andra och sist en sammanfattning", snygga artiklar och en aktuell bild för varje match. Sidan
  // har rubriken, veckans bilder av lagen (matchbladets egna, annars notisens ur data/tidning.json), introduktionen, ett stycke eller
  // tre om hemmalaget och om bortalaget, sammanfattningen och sist källorna med datum. Ett nummer från före artiklarna
  // (utan text under laget) får uppgifterna som löptext, ett stycke per ämne. Helgarderat (helgarderat.js) ställer upp
  // samma matchblad med poddText, poddKallor, poddKallText och poddCitat härifrån.
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
  // Lagets text: artikelns stycken (text), och för ett äldre nummer uppgifterna som löptext, ett stycke per ämne.
  function poddText(d) {
    if (d && Array.isArray(d.text) && d.text.some((x) => x && String(x).trim())) return d.text.map((x) => String(x || '').trim()).filter(Boolean);
    return ((d && d.grupper) || []).map((g) => (g.punkter || []).filter((p) => p && p.t).map((p) => String(p.t).trim()).join(' ')).filter(Boolean);
  }
  // Lagets källor i underlagets ordning (poddarna, forumet, de insatta), var och en en gång med alla sina datum och
  // länken till den senaste. → [{podd, typ, adress, datum: [...]}]
  function poddKallor(d) {
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
    return kallor;
  }
  // Källorna som text: podden SK3 TV (9 nov) och forumet Owlstalk (10 nov). lank: med länkar. → html
  function poddKallText(kallor, lank = false) {
    const T = TEXT.poddar;
    return lista(kallor.map((k) => {
      const namn = esc(kallansNamn(k));
      const a = lank && k.adress ? `<a href="${esc(k.adress)}" target="_blank" rel="noopener">${namn}</a>` : namn;
      return `${T.typord[k.typ] ? `${esc(T.typord[k.typ])} ` : ''}${a}${k.datum.length ? ` (${esc(datumen(k.datum))})` : ''}`;
    }));
  }
  // Sidans citat (redaktören väljer högst ett, och bara när det säger något): { sagt, vem, podd, typ, datum }
  // → { sagt, vem: "Stevie, The Wednesday Week, 9 nov" } eller null
  function poddCitat(c) {
    if (!c || !c.sagt) return null;
    return { sagt: c.sagt, vem: stor([c.vem, c.podd ? TEXT.poddar.kalla(c) : '', kortDatum(iso(c.datum))].filter(Boolean).join(', ')) };
  }
  function poddar(u) {
    const ps = u.poddsidor;
    const l = ((ps && ps.sidor) || []).filter((x) => x && Array.isArray(x.delar) && x.delar.some((d) => poddText(d).length));
    if (!l.length) return null;
    const T = TEXT.poddar;
    const match = (x) => (u.matcher || []).find((m) => String(m.id) === String(x.id));
    const nr = (x) => (match(x) ? match(x).nr : x.nr);
    return l.slice().sort((a, b) => nr(a) - nr(b)).map((x) => {
      const m = match(x);
      const namn = m ? [m.h, m.b] : (x.lag || []);
      // veckans bilder av lagen: matchbladets egna (data/matchbilder/, som GitHub Actions hämtar), annars notisens
      const n = (u.notiser || []).find((y) => y && String(y.id) === String(x.id));
      const skold = (lag) => (lag && typeof u.skold === 'function' ? u.skold(lag) || '' : '');
      const egna = Array.isArray(x.bilder) && x.bilder.some((b) => b && b.fil) ? namn.map((lag, i) => {
        const b = x.bilder[i];
        if (b && b.fil) return { src: `data/matchbilder/${b.fil}`, reserv: skold(lag), lag, foto: fotograf(b) };
        return skold(lag) ? { src: skold(lag), skold: true, lag } : null;
      }) : null;
      const bilder = egna || (n ? notisBilder(u, n) : []);
      const foto = fotoText(bilder.filter((b) => b && !b.skold).map((b) => b.foto));
      const lagen = x.delar.map((d, i) => {
        const text = poddText(d);
        return `<h4 class="tn-mb-lag">${esc(namn[i] || d.lag || '')}</h4>${(text.length ? text : [T.ingen]).map((t) => `<p${text.length ? '' : ' class="tom"'}>${esc(hel(t))}</p>`).join('')}`;
      }).join('');
      const cit = poddCitat(x.citat);
      const kallor = x.delar.map((d, i) => {
        const k = poddKallor(d);
        return k.length ? `${esc(namn[i] || d.lag || '')}: ${poddKallText(k)}` : '';
      }).filter(Boolean);
      return {
        namn: TEXT.sidor.poddar,
        om: [{ id: String(m ? m.id : x.id), rubrik: x.rubrik }],
        vikt: 3,
        html: vinjett(TEXT.sidor.poddar, `${nr(x) ? `${nr(x)} · ` : ''}${namn.join('–')}`) + `<h3 class="tn-rub stor">${esc(x.rubrik || T.rubrik(namn[0], namn[1]))}</h3>` +
          bildrad(bilder, namn) + (x.ingress ? `<p class="tn-ingress fet">${esc(hel(x.ingress))}</p>` : '') +
          `<div class="tn-artikel tn-matchblad">${lagen}${cit ? `<blockquote class="tn-mb-citat"><p>”${esc(hel(cit.sagt))}”</p><cite>${esc(cit.vem)}</cite></blockquote>` : ''}</div>` +
          (x.summering ? `<div class="tn-mb-summering"><b>${esc(T.sammanfattning.toUpperCase())}</b><p>${esc(hel(x.summering))}</p></div>` : '') +
          (kallor.length || foto ? `<p class="tn-kalla">${kallor.length ? `${esc(T.kallorna)}: ${kallor.join('. ')}.` : ''}${foto ? ` <span class="tn-fotoav">${esc(foto)}</span>` : ''}${cit ? ` ${esc(T.citaten)}` : ''}</p>` : ''),
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
      return `<tr data-match="${esc(r.id)}"><td class="tn-nr">${r.nr}</td><td class="tn-match"><span>${matchNamn(r.h, r.b)}</span></td><td class="tn-res">${esc(r.mal)}</td><td class="tn-tk">${esc(r.tecken)}</td>` +
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
      om: sum.rader.map((r) => ({ id: String(r.id) })),
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

  // ---------- framsidan ----------

  // Veckans nummer (ISO-veckan) för tiden t, i Stockholm.
  const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
  function vecka(t) {
    const [y, m, d] = fYmd.format(new Date(t)).split('-').map(Number);
    const dag = new Date(Date.UTC(y, m - 1, d));
    dag.setUTCDate(d + 4 - (dag.getUTCDay() || 7));
    return Math.ceil(((dag - Date.UTC(dag.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }
  // Helgarderats nummer för tiden t: det första numret är veckan med lördagen den 14 november 2026 (Nr 1), och sedan
  // ett nummer i veckan, räknat på veckorna (måndag–söndag). Samma på pulten och på utkastets sida (helgarderat.js).
  // → numret, eller null före det första
  const FORSTA = Date.UTC(2026, 10, 9);
  function nummer(t) {
    const [y, m, d] = fYmd.format(new Date(t)).split('-').map(Number);
    const dag = new Date(Date.UTC(y, m - 1, d));
    const mandag = dag.getTime() - ((dag.getUTCDay() + 6) % 7) * 864e5;
    const n = Math.round((mandag - FORSTA) / (7 * 864e5)) + 1;
    return n >= 1 ? n : null;
  }
  // Rutorna 1, X och 2 framför namnet, som på kupongen, alla ikryssade med kulspetspenna: helgarderat. Kryssen är
  // dragna lite olika och går en bit utanför rutan. Samma rutor på löpsedeln (rum-affischer.js) och på Helgarderats
  // egen sida (helgarderat.js), med sin klass (kl).
  const KRYSS = [
    'M4.5 6.2 C13 14.6 24 25.8 35.6 35.1 M34.2 4.6 C25.8 14.1 15.6 25.2 5.3 36.4',
    'M5.6 4.9 C14.6 14.2 23.4 23.6 34.6 36.2 M36.1 6.4 C26.6 15 15.2 26 3.9 34.6',
    'M3.8 7.1 C12.8 15.2 25.4 24.4 36.3 34 M33.4 3.9 C26.3 13.5 17 26.1 7.2 37.1',
  ];
  const rutor = (kl = 'hf-rutor') => `<svg class="${kl}" viewBox="0 0 134 64" aria-hidden="true">${SIGNS.map((t, i) => `<g transform="translate(${i * 46.5 + 0.8} 0)">` +
    `<text x="19.5" y="15" text-anchor="middle">${t}</text><g transform="translate(0 23.2)"><rect width="39" height="39" class="r"/><path d="${KRYSS[i]}" class="k"/></g></g>`).join('')}</svg>`;

  // Inför lördagen den 14 november: omgångens första dag
  const fVdagLang = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long' });
  const fDagManad = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', day: 'numeric', month: 'long' });
  const omgangsdag = (t) => `${fVdagLang.format(new Date(t))}en den ${fDagManad.format(new Date(t))}`;
  // Veckans bild på framsidan: ett av veckans foton av lagen, matchbladets (data/matchbilder/, som GitHub Actions hämtar
  // till varje omgång) eller notisens (data/tidning-bilder/, som iMacen hämtar), med matchbladets eller notisens rubrik.
  // Helst om matchen som Veckans analys handlar om (efter omgången skrällen), annars den första i kupongens ordning som
  // har ett foto. Finns inget foto står lagens sköldar för den matchen där, så att framsidan alltid har en bild.
  // → { foto: { src, reserv, foto } | null, skoldar: [src, src] | null, rubrik, under } eller null
  function veckansBild(u, sum) {
    const m = u.matcher || [];
    let pref = null;
    if (sum) {
      try { pref = (skrall(u, sum) || { r: {} }).r.id; } catch (e) { pref = null; }
    } else if (u.analys) pref = (m.find((x) => x.nr === u.analys.nr) || {}).id;
    const ids = [...new Set([pref, ...m.map((x) => x.id)].filter(Boolean).map(String))];
    const skold = (lag) => (lag && typeof u.skold === 'function' ? u.skold(lag) || '' : '');
    const sidor = (u.poddsidor && u.poddsidor.sidor) || [];
    for (const id of ids) {
      const x = sidor.find((y) => y && String(y.id) === id);
      const i = x && Array.isArray(x.bilder) ? x.bilder.findIndex((b) => b && b.fil) : -1;
      if (i >= 0) {
        const b = x.bilder[i];
        return { foto: { src: `data/matchbilder/${b.fil}`, reserv: skold((x.lag || [])[i]), foto: fotograf(b) }, rubrik: x.rubrik || '' };
      }
      const n = (u.notiser || []).find((y) => y && String(y.id) === id);
      const f = n ? notisBilder(u, n).find((y) => y && !y.skold) : null;
      if (f) return { foto: f, rubrik: n.rubrik || '' };
    }
    // utan foto: sköldarna, med matchen och avsparken (efter omgången resultatet)
    const x = m.find((y) => String(y.id) === ids[0]);
    if (!x) return null;
    const skoldar = [skold(x.hemma), skold(x.borta)];
    if (!skoldar.some(Boolean)) return null;
    const r = sum && (sum.rader || []).find((y) => String(y.id) === String(x.id));
    return { skoldar, rubrik: `${x.h}–${x.b}`, under: r && r.mal ? r.mal : avspark(x.avspark) };
  }

  // Framsidan, 100 × 140 (zoom i rum.js), utan annat än det som säger vilket nummer det är (2026-11-10, användarens
  // önskemål: "Tidningen ser plottrig ut. Ta bort massa saker där som vi är ointresserade av"): veckan, datumet och
  // priset, namnet, numret stort med omgångens dag under, och veckans bild (veckansBild) med rubriken. Samma på pulten
  // och när den är framme.
  function forsta(u0) {
    const u = { namnAv: (id, n) => n, ...u0 };
    const G = TEXT.forsta;
    const sum = u.efter || null;
    const m = u.matcher || [];
    const forst = Math.min(...m.map((x) => Date.parse(x.avspark)).filter(Number.isFinite));
    // numret och veckan: omgångens första matchs, annars dagens
    const dagen = Number.isFinite(forst) ? forst : Number.isFinite(u.datum) ? u.datum : NaN;
    const nr = Number.isFinite(dagen) ? nummer(dagen) : null;
    const v = Number.isFinite(dagen) ? vecka(dagen) : null;
    const dag = Number.isFinite(u.datum) ? fDatum.format(new Date(u.datum)) : '';
    const omg = Number.isFinite(forst) ? (sum ? G.efter : G.infor)(omgangsdag(forst)) : '';
    const b = veckansBild(u, sum);
    const duk = (src, reserv, kl, w, h) => `<canvas class="${kl}" width="${w}" height="${h}" data-bild="${esc(src)}"${reserv ? ` data-reserv="${esc(reserv)}"` : ''}></canvas>`;
    const under = b && (b.foto ? (b.foto.foto ? G.foto(b.foto.foto) : '') : b.under);
    const bild = !b ? '' : `<figure class="hf-bild">${b.foto ? duk(b.foto.src, b.foto.reserv, 'hf-foto', 320, 200)
      : `<div class="hf-foto hf-skoldar">${b.skoldar.map((x) => (x ? duk(x, '', 'skold genom', 160, 160) : '<span></span>')).join('<i>–</i>')}</div>`}` +
      `<figcaption><b>${esc(hel(b.rubrik || ''))}</b>${under ? `<small>${esc(under)}</small>` : ''}</figcaption></figure>`;
    return `<div class="hf-forsta${bild ? '' : ' utan-bild'}" aria-label="${NAMN}${nr != null ? ` nr ${nr}` : ''}">` +
      `<div class="hf-linje"><b>${v != null ? esc(G.vecka(v)) : ''}</b><span>${esc(dag)}</span><span>${esc(G.pris)}</span></div>` +
      `<div class="hf-namn">${rutor()}<b>${NAMN.toUpperCase()}</b></div>` +
      `<div class="hf-numret">${nr != null ? `<b>${esc(G.nr(nr))}</b>` : ''}${omg ? `<span>${esc(omg)}</span>` : ''}</div>` +
      bild + '<span class="hf-blad"></span><span class="hf-yta"></span></div>';
  }

  // ---------- tidningen ----------

  // Innehållet under framsidan (2026-11-10, användarens önskemål: "en innehållsförteckning - med matcherna på
  // kupongen - på ett snyggt sätt", "som man alltså kan klicka sig fram till"), som i en riktig tidning: I tidningen
  // med avdelningarna och deras första sida, och På kupongen med omgångens matcher i kupongens ordning, var och en med
  // sidan som handlar mest om den (s.om och s.vikt: matchbladet, annars Veckans analys, notisen eller raden i Tipset)
  // och under matchen sidans rubrik, som Lördagens matcher på Helgarderats egen sida. Efter omgången står resultatet
  // i stället för sidnumret (alla matcher står i Omgången, och tretton tvåor säger ingenting), och raden går dit. Varje rad har prickar fram till sidnumret och går dit med ett
  // klick (tidningen i rum.js): data-till är sidan och data-match matchen, på en sida med flera matcher.
  function innehall(u, sidor) {
    const T = TEXT.inne;
    // hoger: sidnumret, efter omgången resultatet
    const rad = (nr, namn, under = '', match = '', hoger = `<i>${nr}</i>`) => `<li><button type="button" data-till="sida-${nr}"${match ? ` data-match="${esc(match)}"` : ''}>` +
      `${namn}<em></em>${hoger}${under ? `<small>${esc(hel(under))}</small>` : ''}</button></li>`;
    const avd = sidor.map((s, i) => (i && sidor[i - 1].namn === s.namn ? '' : rad(i + 2, `<span>${esc(s.namn)}</span>`))).join('');
    const matcher = (u.matcher || []).slice().sort((a, b) => a.nr - b.nr).map((m) => {
      const id = String(m.id);
      // sidan med högst vikt, och bland dem den första
      let bast = null;
      sidor.forEach((s, i) => {
        const om = (s.om || []).find((x) => x && x.id === id);
        if (om && (!bast || (s.vikt || 0) > bast.vikt)) bast = { nr: i + 2, vikt: s.vikt || 0, rubrik: om.rubrik || '' };
      });
      if (!bast) return '';
      const r = u.efter ? (u.efter.rader || []).find((x) => String(x.id) === id) : null;
      const namn = `<b>${esc(m.nr)}</b><span>${matchNamn(m.h, m.b)}</span>`;
      return r && r.mal ? rad(bast.nr, namn, '', id, `<strong>${esc(hel(r.mal))}</strong>`) : rad(bast.nr, namn, bast.rubrik, id);
    }).join('');
    const del = (rub, rader, kl) => `<div class="tn-inne-del ${kl}"><p class="tn-inne-rub"><b>${esc(rub.toUpperCase())}</b></p><ol>${rader}</ol></div>`;
    return `<nav class="tn-inne" id="tn-innehall" aria-label="${esc(T.tidningen)}">${del(T.tidningen, avd, 'avd')}${matcher ? del(T.kupongen, matcher, 'matcher') : ''}</nav>`;
  }

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
    const inne = innehall(u, sidor);
    const blad = sidor.map((s, i) => `<section class="tn-ark tn-sida" id="tn-sida-${i + 2}" aria-label="Sidan ${i + 2}: ${esc(s.namn)}">${folio(u, i + 2)}${s.html}</section>`).join('');
    return { inne, blad, sidor: sidor.map((s) => s.namn) };
  }
  // Hela tidningen: framsidan och sidorna, efter omgången (u.efter) om den, annars inför den. Utan omgång står bara
  // framsidan. → { forsta, inne, blad, sidor }
  function tidning(u0) {
    const u = { namnAv: (id, n) => n, ...u0 };
    u.datumText = u.datumText || (Number.isFinite(u.datum) ? fDatum.format(new Date(u.datum)) : '');
    const lista = u.efter ? [omgangen, betygen, skrallen, kronikan] : [tipset, notiser, analys, poddar];
    return { inne: '', blad: '', sidor: [], ...sidorna(u, lista), forsta: forsta(u) };
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
        // (genom: trycket ligger direkt på papperet, utan någon vit ruta – sköldarna på framsidan)
        const genom = c.classList.contains('genom');
        if (c.classList.contains('skold')) {
          const k = (Math.min(W / iw, H / ih) * 0.78);
          if (!genom) {
            x.fillStyle = '#fff';
            x.fillRect(0, 0, W, H);
          }
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
            // (det genomskinliga är papper)
            const a = genom ? p[o + 3] / 255 : 1;
            const g = Math.min(1, Math.max(0, ((a * (0.3 * p[o] + 0.59 * p[o + 1] + 0.11 * p[o + 2]) / 255 + 1 - a) - 0.5) * 1.25 + 0.55));
            // punkternas storlek efter hur mörkt det är: 45 grader, med tonen kvar under
            const uu = ((i + y) / ruta) % 1;
            const vv = ((i - y + 4 * H) / ruta) % 1;
            const r = Math.hypot(uu - 0.5, vv - 0.5) / 0.71;
            const v2 = g * 0.72 + (r < 1 - g ? 0 : 0.28);
            if (genom) {
              // svärtan som täckning: papperet lyser igenom där trycket är ljust
              p[o] = 28;
              p[o + 1] = 24;
              p[o + 2] = 18;
              p[o + 3] = Math.round((1 - v2) * 255);
              continue;
            }
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

  return { tidning, forsta, rastrera, nummer, rutor, kronika, skrall, citaten, omdome, poddNamn, poddText, poddKallor, poddKallText, poddCitat, kortDatum, TEXT };
});
