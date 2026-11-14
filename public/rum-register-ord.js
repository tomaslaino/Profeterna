// Datorns förklaringar (sedan 2026-11-14, användarens val bland fyra skisser:
// rutan, med ord och ett konkret exempel). Ett tryck på ett tals etikett i
// lagkortet, spelarkortet eller matchakten öppnar en ruta över talen med vad
// talet är och hur det räknas (t), och ett exempel med lagets eller
// spelarens egna siffror (ex). Rutan ritas i rum-register.js; här står bara
// orden. Texterna följer förklaringarna på Statistik (title i TCOLS och PCOLS
// i divisioner.js), skrivna om till hela meningar.
//
// Nycklarna är talens k i LAGTAL och SPTAL (rum-register.js). ex får h:
//   lag:     { t (lagets rad i ligornas filer), namn, div (divisionens namn),
//              form (formens bokstäver, senaste först), sq (laget i spelarfilen) }
//   spelare: { p (spelarens rad), namn, lag (lagets namn), lagM (lagets mål),
//              lagN (lagets ligamatcher) }
// och ger en mening, eller null när siffrorna saknas. I matchakten står ett
// exempel per lag (akten: rader som visar något annat än kortet).
(function () {
  const ok = (x) => x != null && Number.isFinite(x);
  // talen som i datorn: decimalkomma och riktigt minustecken
  const dec = (x, d = 1) => { const s = Math.abs(x).toFixed(d).replace('.', ','); return x < 0 && Number(Math.abs(x).toFixed(d)) !== 0 ? `−${s}` : s; };
  const tk = (x, d = 1) => (x > 0 && Number(x.toFixed(d)) !== 0 ? `+${dec(x, d)}` : dec(x, d));
  const pr = (x) => `${Math.round(x * 100)} %`;
  const tpr = (x) => (Math.round(x * 100) === 0 ? '±0 %' : `${x > 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)} %`);
  const rund = (x, d) => Number(x.toFixed(d));
  const st = (n, en, fler) => `${n} ${n === 1 ? en : fler}`;
  const kr = (n) => `${Math.round(n).toLocaleString('sv-SE')} kr`;
  // genitiv: Citys, Leeds, Haalands
  const gen = (n) => (/[sxz]$/i.test(n) ? n : `${n}s`);
  // vart fjärde skott
  const VART = ['', '', 'andra', 'tredje', 'fjärde', 'femte', 'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde'];
  const vart = (andel) => { const n = Math.round(1 / andel); return n >= 2 ? `ungefär vart ${VART[n] || `${n}:e`} skott` : null; };
  // per match
  const perMatch = (n, app, ord, d = 1) => (ok(n) && app ? `${st(n, ord[0], ord[1])} på ${st(app, 'match', 'matcher')}${n ? ` är ${dec(n / app, d)} per match` : ''}.` : null);

  // ---------- lagen ----------
  const xgOf = (t) => (t && t.fd && t.fd.xg && t.fd.xg.n ? t.fd.xg : null);
  const mkt = (t) => (t && t.fd && t.fd.mkt && t.fd.mkt.n ? t.fd.mkt : null);
  const lag = {
    form: {
      t: 'De fem senaste matcherna i ligan och de engelska cuperna, den senaste längst till vänster: V är vinst, O oavgjort och F förlust. Ställningen efter 90 minuter gäller. Talet är poängen som matcherna gav, 3 för vinst och 1 för oavgjort, högst 15.',
      ex: ({ namn, form }) => {
        if (!form || form.length !== 5 || !form.every((c) => 'VOF'.includes(c))) return null;
        const n = (c) => form.filter((x) => x === c).length;
        const [v, o, f] = [n('V'), n('O'), n('F')];
        return `${gen(namn)} ${form.join('')} är ${st(v, 'vinst', 'vinster')}, ${st(o, 'oavgjord match', 'oavgjorda matcher')} och ${st(f, 'förlust', 'förluster')}: ${v} × 3 + ${o} = ${3 * v + o} poäng av 15 möjliga.`;
      },
    },
    gjorda: {
      t: 'Gjorda mål i ligan delat med antalet ligamatcher. Talet går att jämföra även när lagen har spelat olika många matcher.',
      ex: ({ t, namn }) => (t.m ? `${namn} har gjort ${st(t.gf, 'mål', 'mål')} på ${st(t.m, 'match', 'matcher')}: ${t.gf} / ${t.m} = ${dec(t.gf / t.m, 2)}.` : null),
    },
    inslappta: {
      t: 'Insläppta mål i ligan delat med antalet ligamatcher. Lägre är bättre.',
      ex: ({ t, namn }) => (t.m ? `${namn} har släppt in ${st(t.ga, 'mål', 'mål')} på ${st(t.m, 'match', 'matcher')}: ${t.ga} / ${t.m} = ${dec(t.ga / t.m, 2)}.` : null),
    },
    nollor: {
      t: 'Hur stor andel av ligamatcherna laget har klarat utan att släppa in något mål.',
      ex: ({ t, namn }) => (t.fd && t.fd.n && ok(t.fd.cs) ? `${namn} har hållit nollan i ${t.fd.cs} av ${st(t.fd.n, 'match', 'matcher')}: ${t.fd.cs} / ${t.fd.n} = ${pr(t.fd.cs / t.fd.n)}.` : null),
    },
    skapar: {
      t: 'Förväntade mål (xG) per match: hur många mål lagets chanser brukar ge. Varje skott får ett värde efter hur ofta ett sådant skott blir mål, en straff ungefär 0,8 och ett långskott några hundradelar. Högre är bättre.',
      ex: ({ t, namn }) => { const x = xgOf(t); return x ? `${gen(namn)} skott på ${st(x.n, 'match', 'matcher')} var tillsammans värda ${dec(x.f)} mål: ${dec(x.f)} / ${x.n} = ${dec(x.f / x.n, 2)} per match. Det blev ${st(x.gf, 'mål', 'mål')}.` : null; },
    },
    slapper: {
      t: 'Motståndarnas förväntade mål (xG) per match: hur bra chanser laget släpper till. Lägre är bättre.',
      ex: ({ t, namn }) => { const x = xgOf(t); return x ? `Motståndarnas skott mot ${namn} på ${st(x.n, 'match', 'matcher')} var värda ${dec(x.a)} mål: ${dec(x.a)} / ${x.n} = ${dec(x.a / x.n, 2)} per match. Det blev ${st(x.ga, 'mål', 'mål')}.` : null; },
    },
    xgdiff: {
      t: 'Lagets xG minus motståndarnas, per match. Talet visar lagets styrka säkrare än målskillnaden, eftersom slumpen i avsluten spelar mindre roll.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const f = rund(x.f / x.n, 2); const a = rund(x.a / x.n, 2); return `${namn} skapar ${dec(f, 2)} och släpper till ${dec(a, 2)} per match: ${dec(f, 2)} − ${dec(a, 2)} = ${tk(f - a, 2)}.`; },
    },
    malxg: {
      t: 'Gjorda mål minus xG under säsongen. Plus betyder fler mål än chanserna brukar ge, alltså bra avslut eller tur. Stora avvikelser brukar jämna ut sig.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const f = rund(x.f, 1); return `${namn} har gjort ${st(x.gf, 'mål', 'mål')} på chanser värda ${dec(f)}: ${x.gf} − ${dec(f)} = ${tk(x.gf - f)}.`; },
    },
    inslxg: {
      t: 'Insläppta mål minus motståndarnas xG under säsongen. Minus betyder färre insläppta mål än chanserna brukar ge, alltså en bra målvakt eller tur. Plus betyder fler.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const a = rund(x.a, 1); return `${namn} har släppt in ${st(x.ga, 'mål', 'mål')} på chanser värda ${dec(a)}: ${x.ga} − ${dec(a)} = ${tk(x.ga - a)}.`; },
    },
    tur: {
      t: 'Varje match räknas om till chanser att vinna och spela oavgjort ur båda lagens xG, och blir värd 3 × vinstchansen + oavgjortchansen i poäng. Turen är de poäng laget tog minus de poängen. Plus betyder fler poäng än chanserna var värda, och sådant brukar jämna ut sig.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const xp = rund(x.xp, 1); return `${namn} har tagit ${st(x.pts, 'poäng', 'poäng')} på ${st(x.n, 'match', 'matcher')}, där chanserna var värda ${dec(xp)}: ${x.pts} − ${dec(xp)} = ${tk(x.pts - xp)}.`; },
    },
    kryss: {
      t: 'Chansen att lagets matcher skulle sluta oavgjort, i snitt, räknad ur båda lagens xG och inte ur resultaten. Ungefär var fjärde match slutar oavgjord. Högt betyder jämna matcher med få chanser åt båda hållen, där krysset ligger nära.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x || !ok(x.xd)) return null; return `Enligt chanserna borde ${dec(x.xd)} av ${gen(namn)} ${x.n} matcher ha slutat oavgjort: ${dec(x.xd)} / ${x.n} = ${pr(x.xd / x.n)}.${ok(x.d) ? ` I verkligheten blev det ${x.d} kryss.` : ''}`; },
    },
    styrka: {
      t: 'Prognosmodellens bedömning av laget: hur många mål det väntas vinna eller förlora med per match mot ett snittlag i samma division, på neutral plan. Den tar hänsyn till motståndet och, med mindre vikt, till tidigare säsonger. Samma styrka ger prognoserna.',
      ex: ({ t, namn, div }) => (ok(t.str) ? `${namn} ${tk(t.str, 2)}: mot ett snittlag i ${div || 'divisionen'} väntas ${namn} göra ${dec(Math.abs(t.str), 2)} mål ${t.str >= 0 ? 'mer' : 'mindre'} än motståndaren per match.` : null),
    },
    motstand: {
      t: 'Hur starka motståndarna har varit jämfört med ett vanligt spelschema i divisionen, i mål per match enligt prognosmodellen. Plus betyder svårare motstånd än snittet och minus lättare.',
      ex: ({ t, namn }) => { const v = t.fd && t.fd.opp; if (!ok(v)) return null; return Number(Math.abs(v).toFixed(2)) === 0 ? `${gen(namn)} motståndare har varit lika starka som i ett vanligt spelschema.` : `${gen(namn)} motståndare har i snitt varit ${dec(Math.abs(v), 2)} mål per match ${v > 0 ? 'starkare' : 'svagare'} än i ett vanligt spelschema.`; },
    },
    skott: {
      t: 'Lagets avslut per match, också de som går utanför eller blockeras.',
      ex: ({ t, namn }) => { const s = t.fd && t.fd.sh; return s && s.n ? `${namn} har skjutit ${s.f} gånger på ${st(s.n, 'match', 'matcher')}: ${s.f} / ${s.n} = ${dec(s.f / s.n)}.` : null; },
    },
    skottmot: {
      t: 'Motståndarnas avslut per match. Lägre är bättre.',
      ex: ({ t, namn }) => { const s = t.fd && t.fd.sh; return s && s.n ? `Motståndarna har skjutit ${s.a} gånger mot ${namn} på ${st(s.n, 'match', 'matcher')}: ${s.a} / ${s.n} = ${dec(s.a / s.n)}.` : null; },
    },
    pamal: {
      t: 'Lagets skott per match som hade gått in om målvakten inte hade räddat. Skott utanför och i stolpen räknas inte.',
      ex: ({ t, namn }) => { const s = t.fd && t.fd.sh; return s && s.n && ok(s.of) ? `${s.of} av ${gen(namn)} ${s.f} skott har gått på mål, på ${st(s.n, 'match', 'matcher')}: ${s.of} / ${s.n} = ${dec(s.of / s.n)} per match.` : null; },
    },
    gula: {
      t: 'Lagets gula kort per match. Den som visas ut efter två gula kort har fått två gula och ett rött.',
      ex: ({ t, namn }) => { const c = t.fd && t.fd.cards; return c && c.n ? `${namn} har fått ${st(c.y, 'gult kort', 'gula kort')} på ${st(c.n, 'match', 'matcher')}: ${c.y} / ${c.n} = ${dec(c.y / c.n, 2)}.` : null; },
    },
    favorit: {
      t: 'Hur ofta laget hade större chans än motståndaren att vinna, enligt spelbolagens odds före avspark.',
      ex: ({ t, namn }) => { const x = mkt(t); return x ? `${namn} var favorit i ${x.fav} av ${st(x.n, 'match', 'matcher')}: ${pr(x.fav / x.n)}.` : null; },
    },
    vantat: {
      t: 'Så många poäng oddsen räknade med att laget skulle ta. Före varje match görs oddsen om till chanser, utan spelbolagens påslag, och matchen blir värd 3 × vinstchansen + oavgjortchansen i poäng.',
      ex: ({ t, namn }) => { const x = mkt(t); return x ? `En match där oddsen ger 60 % vinst och 25 % oavgjort är värd 3 × 0,60 + 0,25 = 2,05 poäng. ${gen(namn)} ${x.n} matcher var värda ${dec(x.xp)} poäng.` : null; },
    },
    tog: {
      t: 'Poängen laget faktiskt tog i de matcher som oddsen finns för. Det kan vara färre än i tabellen, eftersom oddsen ibland kommer en omgång efter.',
      ex: ({ t, namn }) => { const x = mkt(t); return x ? `${namn} tog ${st(x.pts, 'poäng', 'poäng')} i de ${x.n} matcher som oddsen finns för och har ${t.pts} i tabellen.` : null; },
    },
    odds: {
      t: 'Tagna minus väntade poäng enligt oddsen. Plus betyder att laget har tagit fler poäng än spelbolagen räknade med, och minus färre.',
      ex: ({ t, namn }) => { const x = mkt(t); if (!x) return null; const xp = rund(x.xp, 1); return `${namn} har tagit ${st(x.pts, 'poäng', 'poäng')} där oddsen räknade med ${dec(xp)}: ${x.pts} − ${dec(xp)} = ${tk(x.pts - xp)}.`; },
    },
    seger: {
      t: 'Om man hade satsat lika mycket på att laget vinner i varje match, till oddset före avspark: så stor del av insatsen hade man vunnit eller förlorat. Spelbolagens påslag är inräknat.',
      ex: ({ t, namn }) => { const x = mkt(t); return x && ok(x.ret) ? `Med 100 kr på ${namn} i var och en av ${st(x.n, 'match', 'matcher')}, alltså ${kr(100 * x.n)}, hade man fått tillbaka ${kr(100 * x.ret)}: ${tpr((x.ret - x.n) / x.n)}.` : null; },
    },
    malspelare: {
      t: 'Mål som ESPN har skrivit på lagets spelare. Självmål räknas inte, så summan kan vara lägre än i tabellen.',
      ex: ({ t, namn, sq }) => (sq && ok(sq.goals) ? (sq.goals === t.gf ? `${namn} har gjort ${st(t.gf, 'mål', 'mål')} i tabellen, och alla står på lagets spelare.` : `${namn} har gjort ${st(t.gf, 'mål', 'mål')} i tabellen, och ${sq.goals} av dem står på lagets spelare.`) : null),
    },
    skytten: {
      t: 'Spelaren med flest ligamål i laget, och antalet mål.',
      ex: ({ namn, sq }) => (sq && sq.topScorer && sq.topScorer.g && sq.goals ? `${sq.topScorer.name} har gjort ${sq.topScorer.g} av ${gen(namn)} ${st(sq.goals, 'mål', 'mål')}.` : null),
    },
    beroende: {
      t: 'Hur stor del av lagets mål den bäste målskytten har gjort. Högt betyder att laget hänger mycket på en enda spelare.',
      ex: ({ sq }) => (sq && sq.topScorer && sq.topScorer.g && sq.goals ? `${sq.topScorer.name} har gjort ${sq.topScorer.g} av lagets ${st(sq.goals, 'mål', 'mål')}: ${sq.topScorer.g} / ${sq.goals} = ${pr(sq.topScorer.g / sq.goals)}.` : null),
    },
  };

  // Matchaktens rader som visar något annat än kortets: MÅL och xG står som
  // gjorda–insläppta (en decimal), och raderna ur matchens fil (nollorna,
  // skotten på mål och målen mot xG) får inget exempel, eftersom de räknas där.
  const akten = {
    gjorda: {
      e: 'MÅL', n: 'GJORDA–INSLÄPPTA PER MATCH',
      t: 'Gjorda och insläppta mål per ligamatch, de gjorda först.',
      ex: ({ t, namn }) => (t.m ? `${namn} har gjort ${t.gf} och släppt in ${t.ga} på ${st(t.m, 'match', 'matcher')}: ${dec(t.gf / t.m)}–${dec(t.ga / t.m)}.` : null),
    },
    skapar: {
      e: 'xG', n: 'SKAPADE–TILLÅTNA CHANSER PER MATCH',
      t: 'Förväntade mål (xG) per match, lagets egna chanser först och motståndarnas sedan. Varje skott får ett värde efter hur ofta ett sådant skott blir mål, en straff ungefär 0,8 och ett långskott några hundradelar.',
      ex: ({ t, namn }) => { const x = xgOf(t); return x ? `${gen(namn)} chanser på ${st(x.n, 'match', 'matcher')} var värda ${dec(x.f)} mål och motståndarnas ${dec(x.a)}: ${dec(x.f / x.n)}–${dec(x.a / x.n)} per match.` : null; },
    },
    nollor: { ex: null },
    pamal: { ex: null },
    malxg: { ex: null },
    inslxg: { ex: null },
  };

  // ---------- spelarna ----------
  const fg = (p) => (p.fg !== undefined ? p.fg : p.g);
  const fa = (p) => (p.fg !== undefined ? p.fa : p.a);
  const emin = (p) => (p.emin !== undefined ? p.emin : p.min);
  const spelare = {
    matcher: {
      t: 'Ligamatcher den här säsongen, både från start och som inhoppare.',
      ex: ({ p, namn }) => (ok(p.app) && ok(p.starts) ? `${namn} har spelat ${st(p.app, 'ligamatch', 'ligamatcher')}, ${p.starts} från start och ${p.app - p.starts} som inhoppare.` : null),
    },
    start: {
      t: 'Ligamatcher där spelaren fanns med i startelvan.',
      ex: ({ p, namn, lagN }) => (ok(p.starts) && ok(p.app) ? (lagN ? `${namn} har startat ${p.starts} av lagets ${st(lagN, 'ligamatch', 'ligamatcher')}.` : `${namn} har startat ${p.starts} av sina ${st(p.app, 'ligamatch', 'ligamatcher')}.`) : null),
    },
    inhopp: {
      t: 'Ligamatcher där spelaren kom in under matchen i stället för att starta.',
      ex: ({ p }) => (ok(p.app) && ok(p.starts) ? `${st(p.app, 'match', 'matcher')}, varav ${p.starts} från start: ${p.app} − ${p.starts} = ${st(p.app - p.starts, 'inhopp', 'inhopp')}.` : null),
    },
    speltid: {
      t: 'Spelade minuter i ligan den här säsongen.',
      ex: ({ p }) => (ok(p.min) ? `${p.min} minuter är lika mycket som ${dec(p.min / 90)} hela matcher.` : null),
    },
    permatch: {
      t: 'Speltiden delad med antalet matcher. Lågt betyder ofta att spelaren byts in eller ut.',
      ex: ({ p }) => (ok(p.min) && p.app ? `${p.min} minuter på ${st(p.app, 'match', 'matcher')}: ${p.min} / ${p.app} = ${Math.round(p.min / p.app)} minuter per match.` : null),
    },
    betyg: {
      t: 'Snittet av spelarens betyg från 365Scores, på en skala från 1 till 10, i ligans matcher. En vanlig insats ger ungefär 6,7.',
      ex: ({ p, namn }) => (ok(p.rt) && p.rn ? `${namn} har fått betyg i ${st(p.rn, 'match', 'matcher')}, i snitt ${dec(p.rt)}.` : null),
    },
    bast: {
      t: 'Matcher där spelaren fick det högsta betyget av alla på planen, enligt 365Scores.',
      ex: ({ p, namn }) => (ok(p.rb) && p.rn ? `${namn} var bäst på plan i ${p.rb} av ${st(p.rn, 'match', 'matcher')} med betyg.` : null),
    },
    mal: {
      t: 'Mål i ligan den här säsongen. Självmål räknas inte.',
      ex: ({ p }) => perMatch(p.g, p.app, ['mål', 'mål'], 2),
    },
    assist: {
      t: 'Den sista passningen före ett mål, eller ett skott som räddas och slås in av en lagkamrat. Enligt ESPN.',
      ex: ({ p }) => perMatch(p.a, p.app, ['assist', 'assist'], 2),
    },
    inblandad: {
      t: 'Mål och assist delat med lagets mål: hur stor del av lagets mål spelaren har gjort eller lagt den sista passningen till.',
      ex: ({ p, namn, lagM }) => (lagM && ok(p.g) ? `${namn} har ${st(p.g, 'mål', 'mål')} och ${st(p.a || 0, 'assist', 'assist')}, och laget har gjort ${lagM}: (${p.g} + ${p.a || 0}) / ${lagM} = ${pr((p.g + (p.a || 0)) / lagM)}.` : null),
    },
    andel: {
      t: 'Spelarens mål delat med lagets mål.',
      ex: ({ p, namn, lagM }) => (lagM && ok(p.g) ? `${namn} har gjort ${p.g} av lagets ${st(lagM, 'mål', 'mål')}: ${p.g} / ${lagM} = ${pr(p.g / lagM)}.` : null),
    },
    skott: {
      t: 'Alla avslut i ligan, också de som går utanför eller blockeras.',
      ex: ({ p }) => perMatch(p.sh, p.app, ['skott', 'skott']),
    },
    pamal: {
      t: 'Skott som hade gått in om målvakten inte hade räddat. Skott utanför och i stolpen räknas inte.',
      ex: ({ p, namn }) => (ok(p.sot) && p.sh ? `${p.sot} av ${gen(namn)} ${st(p.sh, 'skott', 'skott')} har gått på mål: ${pr(p.sot / p.sh)}.` : null),
    },
    malskott: {
      t: 'Hur stor andel av skotten som har blivit mål. Med färre än tio skott är talet osäkert.',
      ex: ({ p }) => { if (!p.sh || !ok(p.g)) return null; const v = p.g ? vart(p.g / p.sh) : null; return `${st(p.g, 'mål', 'mål')} på ${st(p.sh, 'skott', 'skott')}: ${p.g} / ${p.sh} = ${pr(p.g / p.sh)}${v ? `, ${v}` : ''}.`; },
    },
    malmatch: {
      t: 'Mål delat med antalet matcher, där inhopp räknas som hela matcher.',
      ex: ({ p }) => (p.app && ok(p.g) ? `${st(p.g, 'mål', 'mål')} på ${st(p.app, 'match', 'matcher')}: ${p.g} / ${p.app} = ${dec(p.g / p.app, 2)}.` : null),
    },
    mal90: {
      t: 'Mål per 90 minuters speltid. Talet är rättvisare än mål per match för den som ofta byts in eller ut.',
      ex: ({ p }) => { const g = fg(p); return ok(g) && p.min ? `${st(g, 'mål', 'mål')} på ${p.min} minuter: ${g} / ${p.min} × 90 = ${dec((g / p.min) * 90, 2)}.` : null; },
    },
    xg: {
      t: 'Hur många mål spelarens chanser brukar ge. Varje skott får ett värde efter hur ofta ett sådant skott blir mål, en straff ungefär 0,8 och ett långskott några hundradelar. Från Fantasy Premier League.',
      ex: ({ p, namn }) => (ok(p.xg) ? `${gen(namn)} ${p.sh ? `${st(p.sh, 'skott', 'skott')}` : 'skott'} var tillsammans värda ${dec(p.xg)} mål, och det blev ${st(fg(p), 'mål', 'mål')}.` : null),
    },
    malmotxg: {
      t: 'Gjorda mål minus xG. Plus betyder fler mål än chanserna brukar ge, alltså en skicklig avslutare eller tur. Stora avvikelser brukar jämna ut sig.',
      ex: ({ p }) => { if (!ok(p.xg) || !ok(p.fg)) return null; const x = rund(p.xg, 1); return `${st(p.fg, 'mål', 'mål')} på chanser värda ${dec(x)}: ${p.fg} − ${dec(x)} = ${tk(p.fg - x)}.`; },
    },
    xa: {
      t: 'Hur många mål spelarens passningar före lagkamraternas skott brukar ge, oavsett om skotten gick in. Från Fantasy Premier League.',
      ex: ({ p, namn }) => (ok(p.xa) ? `${gen(namn)} passningar före lagkamraternas skott var värda ${dec(p.xa)} mål, och det blev ${st(fa(p) || 0, 'assist', 'assist')}.` : null),
    },
    xg90: {
      t: 'Förväntade mål per 90 minuters speltid: hur ofta spelaren kommer till lägen, oavsett om de blir mål.',
      ex: ({ p }) => (ok(p.xg) && p.min ? `${dec(p.xg)} xG på ${p.min} minuter: ${dec(p.xg)} / ${p.min} × 90 = ${dec((p.xg / p.min) * 90, 2)}.` : null),
    },
    ma90: {
      t: 'Mål och assist tillsammans per 90 minuters speltid.',
      ex: ({ p }) => { const g = fg(p); const a = fa(p) || 0; return ok(g) && p.min ? `${st(g, 'mål', 'mål')} och ${st(a, 'assist', 'assist')} på ${p.min} minuter: (${g} + ${a}) / ${p.min} × 90 = ${dec(((g + a) / p.min) * 90, 2)}.` : null; },
    },
    segermal: {
      t: 'Mål som avgjorde en vunnen match: målet som gav laget den ledning det sedan aldrig tappade. Vid 3–1 är lagets andra mål segermålet.',
      ex: ({ p, namn }) => (ok(p.gw) && p.g ? `${p.gw} av ${gen(namn)} ${st(p.g, 'mål', 'mål')} avgjorde en vunnen match.` : null),
    },
    poangmal: {
      t: 'Poängen laget hade tappat utan spelarens mål. Ett mål i en match som vanns med ett mål är värt två poäng, seger i stället för oavgjort, och ett mål i en oavgjord match en poäng.',
      ex: ({ p, namn, lag: l }) => (ok(p.gpts) && p.g ? `Utan ${gen(namn)} ${st(p.g, 'mål', 'mål')} hade ${l || 'laget'} haft ${st(p.gpts, 'poäng', 'poäng')} mindre.` : null),
    },
    forsta: {
      t: 'Mål som var matchens första, alltså de som gav laget ledningen med 1–0.',
      ex: ({ p, namn }) => (ok(p.g1) && p.g ? `${p.g1} av ${gen(namn)} ${st(p.g, 'mål', 'mål')} var matchens första.` : null),
    },
    sena: {
      t: 'Mål från den 80:e minuten och framåt, tilläggstiden inräknad.',
      ex: ({ p, namn }) => (ok(p.glate) && p.g ? `${p.glate} av ${gen(namn)} ${st(p.g, 'mål', 'mål')} kom från den 80:e minuten.` : null),
    },
    straffar: {
      t: 'Mål på straffar i ligan, av de straffar spelaren har slagit. Räddade och missade straffar räknas som slagna, straffläggningar inte.',
      ex: ({ p, namn }) => (ok(p.gpen) ? `${namn} har gjort ${st(p.gpen, 'mål', 'mål')} på ${st(p.gpen + (p.pmiss || 0), 'straff', 'straffar')}.` : null),
    },
    inhoppmal: {
      t: 'Mål gjorda efter att spelaren har bytts in.',
      ex: ({ p, namn }) => (ok(p.gsub) && p.g ? `${p.gsub} av ${gen(namn)} ${st(p.g, 'mål', 'mål')} kom efter ett inhopp.` : null),
    },
    raddningar: {
      t: 'Målvaktens räddningar i ligan den här säsongen.',
      ex: ({ p, namn }) => (ok(p.sv) && ok(p.gc) ? `${namn} har räddat ${p.sv} av ${st(p.sv + p.gc, 'skott', 'skott')} på mål.` : null),
    },
    raddade: {
      t: 'Räddningarna delade med de skott på mål som målvakten har mött. Med färre än tio skott på mål är talet osäkert.',
      ex: ({ p }) => (ok(p.sv) && p.sv + (p.gc || 0) ? `${st(p.sv, 'räddning', 'räddningar')} och ${st(p.gc || 0, 'insläppt mål', 'insläppta mål')}: ${p.sv} / ${p.sv + (p.gc || 0)} = ${pr(p.sv / (p.sv + (p.gc || 0)))}.` : null),
    },
    motskott: {
      t: 'Skott på mål som målvakten har mött: räddningarna och de insläppta målen.',
      ex: ({ p }) => (ok(p.sv) && ok(p.gc) ? `${st(p.sv, 'räddning', 'räddningar')} och ${st(p.gc, 'insläppt mål', 'insläppta mål')}: ${p.sv} + ${p.gc} = ${p.sv + p.gc}.` : null),
    },
    inslappta: {
      t: 'Mål som har gått in medan målvakten stod i mål.',
      ex: ({ p }) => perMatch(p.gc, p.app, ['insläppt mål', 'insläppta mål']),
    },
    inslmatch: {
      t: 'Insläppta mål delat med antalet matcher. Lägre är bättre.',
      ex: ({ p }) => (ok(p.gc) && p.app ? `${st(p.gc, 'insläppt mål', 'insläppta mål')} på ${st(p.app, 'match', 'matcher')}: ${p.gc} / ${p.app} = ${dec(p.gc / p.app)}.` : null),
    },
    tacklingar: {
      t: 'Gånger spelaren har tagit bollen från en motståndare i en närkamp. Från Fantasy Premier League.',
      ex: ({ p }) => perMatch(p.tk, p.app, ['tackling', 'tacklingar']),
    },
    rensningar: {
      t: 'Bollar som spelaren har rensat bort, skott och passningar som spelaren har täckt och passningar som spelaren har brutit. Från Fantasy Premier League.',
      ex: ({ p }) => (ok(p.cbi) && p.app ? `${p.cbi} rensningar, täckningar och brytningar på ${st(p.app, 'match', 'matcher')} är ${dec(p.cbi / p.app)} per match.` : null),
    },
    bollvinster: {
      t: 'Gånger spelaren har tagit hand om en lös boll åt laget. Målvakter får många när de plockar inlägg och långbollar. Från Fantasy Premier League.',
      ex: ({ p }) => perMatch(p.rec, p.app, ['bollvinst', 'bollvinster']),
    },
    insatser90: {
      t: 'Tacklingar, rensningar, täckningar och brytningar per 90 minuters speltid.',
      ex: ({ p }) => (ok(p.tk) && ok(p.cbi) && p.min ? `${st(p.tk, 'tackling', 'tacklingar')} och ${p.cbi} rensningar, täckningar och brytningar på ${p.min} minuter: ${p.tk + p.cbi} / ${p.min} × 90 = ${dec(((p.tk + p.cbi) / p.min) * 90)}.` : null),
    },
    nollor: {
      t: 'Matcher där laget inte släppte in något mål medan spelaren var på planen, minst 60 minuter. Från Fantasy Premier League.',
      ex: ({ p, namn }) => (ok(p.cs) && p.app ? `${namn} har varit med om ${st(p.cs, 'nolla', 'nollor')} på ${st(p.app, 'match', 'matcher')}.` : null),
    },
    sjalvmal: {
      t: 'Självmål i ligan den här säsongen.',
      ex: ({ p }) => perMatch(p.og, p.app, ['självmål', 'självmål'], 2),
    },
    falld: {
      t: 'Gånger spelaren har blivit fälld eller utsatt för en annan förseelse som domaren har blåst för.',
      ex: ({ p }) => perMatch(p.fs, p.app, ['gång', 'gånger']),
    },
    falld90: {
      t: 'Gånger spelaren har blivit fälld per 90 minuters speltid.',
      ex: ({ p }) => (ok(p.fs) && emin(p) ? `${st(p.fs, 'gång', 'gånger')} på ${emin(p)} minuter: ${p.fs} / ${emin(p)} × 90 = ${dec((p.fs / emin(p)) * 90)}.` : null),
    },
    faller: {
      t: 'Regelbrott som spelaren har begått och som domaren har blåst frispark eller straff för.',
      ex: ({ p }) => perMatch(p.fc, p.app, ['regelbrott', 'regelbrott']),
    },
    faller90: {
      t: 'Begångna regelbrott per 90 minuters speltid.',
      ex: ({ p }) => (ok(p.fc) && emin(p) ? `${st(p.fc, 'regelbrott', 'regelbrott')} på ${emin(p)} minuter: ${p.fc} / ${emin(p)} × 90 = ${dec((p.fc / emin(p)) * 90)}.` : null),
    },
    gula: {
      t: 'Gula kort i ligan den här säsongen.',
      ex: ({ p }) => perMatch(p.yc, p.app, ['gult kort', 'gula kort'], 2),
    },
    roda: {
      t: 'Röda kort i ligan den här säsongen. Två gula kort i samma match ger ett rött.',
      ex: () => null,
    },
  };

  window.RumRegisterOrd = { lag, akten, spelare };
})();
