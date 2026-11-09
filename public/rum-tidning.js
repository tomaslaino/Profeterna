'use strict';

// ---------- tidningen bakom löpsedeln ----------
//
// Ett klick på löpsedeln i tobaksaffären (rum-affischer.js) öppnar veckans tidning – Sportbladet eller
// Expressen, samma som löpsedeln – och lägger fram den över rummet (tidningen i rum.js). Överst ligger
// sedeln själv, förstorad, som tidningens framsida, och under den sidorna, en under en, med sidnummer,
// tidningens namn och datumet i huvudet som i en riktig tidning. Vad som står i den beror på omgången:
//
//   inför omgången   Tipset (omgångens matcher med avsparken, datorns procent och Sixten Bråvalls tecken,
//                    och Tipsligan), Så mår tipslagen (notiserna ur data/tidning.json, skrivna på iMacen)
//                    och Veckans analys (Sixtens artikel om matchen som löpsedeln handlar om, annars den
//                    jämnaste, ur data/analyser.json).
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
//     liga: { fore: [...], efter: [...], omg } (Tippoang.season), matcher, notiser, analys }
// RumTidning.rastrera(rot) ritar porträtten på sina dukar, svartvita och rastrerade.

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
  const NAMN = { sb: 'Sportbladet', ex: 'Expressen' };

  // ---------- texterna ----------
  // Tidningens egen röst är kvällstidningens, torr och saklig. Krönikan är Hasse Backes: han har alltid
  // haft rätt, och det som gick fel var matcherna. Till er säger han ni och er.
  const TEXT = {
    sidor: {
      tipset: 'Tipset',
      notiser: 'Så mår tipslagen',
      analys: 'Veckans analys',
      omgangen: 'Omgången',
      betygen: 'Betygen',
      skrallen: 'Skrällen',
      kronikan: 'Krönikan',
    },
    tipset: {
      rubrik: 'Omgångens matcher',
      datorn: 'Datorn',
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

  // ---------- tidningen ----------

  // → { html, sidor: [namn] }: sidorna under sedeln, och innehållet som står under den.
  function html(u0) {
    const u = { namnAv: (id, n) => n, ...u0 };
    u.datumText = u.datumText || (Number.isFinite(u.datum) ? fDatum.format(new Date(u.datum)) : '');
    const sidor = (u.efter ? [omgangen, betygen, skrallen, kronikan] : [tipset, notiser, analys]).map((f) => {
      try {
        return f(u);
      } catch (e) {
        if (typeof console !== 'undefined') console.warn('Tidningen:', f.name, e);
        return null;
      }
    }).filter(Boolean);
    if (!sidor.length) return null;
    const inne = `<nav class="tn-inne" aria-label="I tidningen"><b>I TIDNINGEN</b>${sidor.map((s, i) => `<button type="button" data-sida="${i + 2}"><span>${esc(s.namn)}</span><i>${i + 2}</i></button>`).join('')}</nav>`;
    const blad = sidor.map((s, i) => `<section class="tn-ark tn-sida" id="tn-sida-${i + 2}" aria-label="Sidan ${i + 2}: ${esc(s.namn)}">${folio(u, i + 2)}${s.html}</section>`).join('');
    return { inne, blad, sidor: sidor.map((s) => s.namn) };
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

  return { html, rastrera, kronika, skrall, citaten, omdome, TEXT };
});
