// Datorns förklaringar (sedan 2026-11-14, användarens val bland fyra skisser:
// rutan, med ord och ett konkret exempel). Ett tryck på ett tals etikett i
// lagkortet, spelarkortet eller matchakten öppnar en ruta över talen med vad
// talet är och hur det räknas (t), och ett exempel med lagets eller
// spelarens egna siffror (ex). Rutan ritas i rum-register.js; här står bara
// orden. Texterna följer förklaringarna på Statistik (title i TCOLS och PCOLS
// i divisioner.js), skrivna om till hela meningar.
//
// Språket (genomgånget samma dag, användaren: "bra svenska och undvik
// swenglish"): "Ju lägre, desto bättre" (inte "Lägre är bättre"), "Ett högt
// tal betyder", "chansen till oavgjort", "täcks" (inte blockeras), "odds vid
// avspark", "uddamålsseger", poäng är "färre" (inte "mindre"), och varje
// mening ska säga vad den syftar på även när den läses ensam.
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
  // heltal med mellanrum mellan tusentalen: 1 234
  const hel = (n) => Math.round(n).toLocaleString('sv-SE');
  const st = (n, en, fler) => `${hel(n)} ${n === 1 ? en : fler}`;
  // noll skrivs ut: "inga assist", "inget mål" (inte "0 assist")
  const antal = (n, en, fler, ingen) => (n === 0 ? ingen : st(n, en, fler));
  const stor = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // "i alla 10 matcherna", "i ingen av de 10 matcherna"
  const iAv = (k, n, en, fler, vad) => (k === n && n > 1 ? `${vad} i alla ${n} ${fler}na` : `${vad} i ${k} av ${st(n, en, fler)}`);
  const iIngen = (n, en, fler, vad) => (n === 1 ? `inte ${vad} i sin enda ${en}` : `inte ${vad} i någon av de ${n} ${fler}na`);
  const kr = (n) => `${hel(n)} kr`;
  // genitiv: Citys, Leeds, Haalands
  const gen = (n) => (/[sxz]$/i.test(n) ? n : `${n}s`);
  // vart fjärde skott
  const VART = ['', '', 'andra', 'tredje', 'fjärde', 'femte', 'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde'];
  const vart = (andel) => { const n = Math.round(1 / andel); return n >= 2 ? `alltså ungefär vart ${VART[n] || `${n}:e`} skott` : null; };
  // per match
  const perMatch = (n, app, ord, d = 1, ingen = `inga ${ord[1]}`) => (ok(n) && app ? `${stor(antal(n, ord[0], ord[1], ingen))} på ${st(app, 'match', 'matcher')}${n ? ` blir ${dec(n / app, d)} per match` : ''}.` : null);
  const xgOrd = 'Varje skott får ett värde efter hur ofta ett sådant skott blir mål. En straff är värd ungefär 0,8 och ett långskott några hundradelar.';
  const fpl = 'Siffrorna kommer från Fantasy Premier League.';

  // ---------- lagen ----------
  const xgOf = (t) => (t && t.fd && t.fd.xg && t.fd.xg.n ? t.fd.xg : null);
  const mkt = (t) => (t && t.fd && t.fd.mkt && t.fd.mkt.n ? t.fd.mkt : null);
  const lag = {
    form: {
      t: 'De fem senaste matcherna i ligan och de engelska cuperna, den senaste först. V betyder vinst, O oavgjort och F förlust, och det är ställningen efter 90 minuter som gäller. Talet efter bokstäverna är poängen som matcherna gav: 3 för vinst och 1 för oavgjort, alltså högst 15.',
      ex: ({ namn, form }) => {
        if (!form || form.length !== 5 || !form.every((c) => 'VOF'.includes(c))) return null;
        const n = (c) => form.filter((x) => x === c).length;
        const [v, o, f] = [n('V'), n('O'), n('F')];
        // bara det som finns: "4 vinster och 1 förlust", inte "0 oavgjorda"
        const d = [[v, 'vinst', 'vinster'], [o, 'oavgjord match', 'oavgjorda matcher'], [f, 'förlust', 'förluster']].filter((x) => x[0]).map((x) => st(...x));
        const lista = d.length > 1 ? `${d.slice(0, -1).join(', ')} och ${d[d.length - 1]}` : d[0];
        return `${gen(namn)} form, ${form.join('')}, betyder ${lista}: ${v} × 3 + ${o} = ${3 * v + o} poäng av 15 möjliga.`;
      },
    },
    gjorda: {
      t: 'Lagets mål i ligan per match: antalet gjorda mål delat med antalet ligamatcher. Då går lagen att jämföra även om de har spelat olika många matcher.',
      ex: ({ t, namn }) => (t.m ? `${namn} har gjort ${st(t.gf, 'mål', 'mål')} på ${st(t.m, 'match', 'matcher')}: ${t.gf} / ${t.m} = ${dec(t.gf / t.m, 2)}.` : null),
    },
    inslappta: {
      t: 'Insläppta mål i ligan per match: antalet insläppta mål delat med antalet ligamatcher. Ju lägre, desto bättre.',
      ex: ({ t, namn }) => (t.m ? `${namn} har släppt in ${st(t.ga, 'mål', 'mål')} på ${st(t.m, 'match', 'matcher')}: ${t.ga} / ${t.m} = ${dec(t.ga / t.m, 2)}.` : null),
    },
    nollor: {
      t: 'Hur stor andel av ligamatcherna laget har hållit nollan i, alltså inte släppt in något mål.',
      ex: ({ t, namn }) => (t.fd && t.fd.n && ok(t.fd.cs) ? `${namn} har ${t.fd.cs ? iAv(t.fd.cs, t.fd.n, 'match', 'matcher', 'hållit nollan') : iIngen(t.fd.n, 'match', 'matcher', 'hållit nollan')}: ${t.fd.cs} / ${t.fd.n} = ${pr(t.fd.cs / t.fd.n)}.` : null),
    },
    skapar: {
      t: `Förväntade mål (xG) per match: hur många mål lagets chanser är värda. ${xgOrd} Ju högre, desto bättre.`,
      ex: ({ t, namn }) => { const x = xgOf(t); return x ? `${gen(namn)} skott på ${st(x.n, 'match', 'matcher')} var tillsammans värda ${dec(x.f)} mål: ${dec(x.f)} / ${x.n} = ${dec(x.f / x.n, 2)} per match. I verkligheten blev det ${antal(x.gf, 'mål', 'mål', 'inget mål')}.` : null; },
    },
    slapper: {
      t: 'Motståndarnas förväntade mål (xG) per match: hur bra chanser laget släpper till. Ju lägre, desto bättre.',
      ex: ({ t, namn }) => { const x = xgOf(t); return x ? `Motståndarnas skott mot ${namn} på ${st(x.n, 'match', 'matcher')} var tillsammans värda ${dec(x.a)} mål: ${dec(x.a)} / ${x.n} = ${dec(x.a / x.n, 2)} per match. I verkligheten blev det ${antal(x.ga, 'mål', 'mål', 'inget mål')}.` : null; },
    },
    xgdiff: {
      t: 'Lagets xG minus motståndarnas, per match. Talet säger mer om lagets styrka än målskillnaden, eftersom slumpen i avsluten spelar mindre roll.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const f = rund(x.f / x.n, 2); const a = rund(x.a / x.n, 2); return `${namn} skapar chanser värda ${dec(f, 2)} mål per match och släpper till chanser värda ${dec(a, 2)}: ${dec(f, 2)} − ${dec(a, 2)} = ${tk(f - a, 2)}.`; },
    },
    malxg: {
      t: 'Gjorda mål minus xG under säsongen. Plus betyder fler mål än chanserna var värda, alltså bra avslut eller tur. Stora skillnader brukar jämna ut sig.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const f = rund(x.f, 1); return `${namn} har gjort ${st(x.gf, 'mål', 'mål')} på chanser värda ${dec(f)}: ${x.gf} − ${dec(f)} = ${tk(x.gf - f)}.`; },
    },
    inslxg: {
      t: 'Insläppta mål minus motståndarnas xG under säsongen. Minus betyder färre insläppta mål än motståndarnas chanser var värda, alltså en bra målvakt eller tur. Plus betyder fler.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const a = rund(x.a, 1); return `${namn} har släppt in ${st(x.ga, 'mål', 'mål')} på chanser värda ${dec(a)}: ${x.ga} − ${dec(a)} = ${tk(x.ga - a)}.`; },
    },
    tur: {
      t: 'Ur båda lagens xG räknas varje match om till en chans att vinna och en chans att spela oavgjort. Matchen är då värd 3 × vinstchansen + chansen till oavgjort i poäng. Turen är lagets poäng minus summan av de värdena. Plus betyder fler poäng än chanserna var värda. Sådan tur brukar inte hålla i sig.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x) return null; const xp = rund(x.xp, 1); return `${namn} har tagit ${st(x.pts, 'poäng', 'poäng')} på ${st(x.n, 'match', 'matcher')}. Chanserna var värda ${dec(xp)} poäng: ${x.pts} − ${dec(xp)} = ${tk(x.pts - xp)}.`; },
    },
    kryss: {
      t: 'Hur stor chans lagets matcher har haft att sluta oavgjort, i genomsnitt. Chansen räknas ur båda lagens xG och inte ur resultaten. Ungefär var fjärde match slutar oavgjort. Ett högt tal betyder jämna matcher med få chanser åt båda hållen, där krysset ligger nära till hands.',
      ex: ({ t, namn }) => { const x = xgOf(t); if (!x || !ok(x.xd)) return null; return `Enligt chanserna borde ${dec(x.xd)} av ${gen(namn)} ${x.n} matcher ha slutat oavgjort: ${dec(x.xd)} / ${x.n} = ${pr(x.xd / x.n)}.${ok(x.d) ? ` I verkligheten blev det ${x.d ? st(x.d, 'kryss', 'kryss') : 'inget kryss'}.` : ''}`; },
    },
    styrka: {
      t: 'Prognosmodellens bedömning av laget: med hur många mål per match laget väntas vinna eller förlora mot ett genomsnittligt lag i samma division, på neutral plan. Modellen tar hänsyn till motståndet och i mindre grad till tidigare säsonger. Prognoserna bygger på samma tal.',
      ex: ({ t, namn, div }) => {
        if (!ok(t.str)) return null;
        const mot = `mot ett genomsnittligt lag i ${div || 'divisionen'}`;
        return Number(Math.abs(t.str).toFixed(2)) === 0
          ? `${namn} har ${tk(t.str, 2)}: laget väntas spela jämnt ${mot}.`
          : `${namn} har ${tk(t.str, 2)}: laget väntas ${t.str > 0 ? 'vinna' : 'förlora'} med ${dec(Math.abs(t.str), 2)} mål per match ${mot}.`;
      },
    },
    motstand: {
      t: 'Hur starka motståndarna har varit jämfört med ett genomsnittligt spelschema i divisionen, mätt i mål per match med prognosmodellen. Plus betyder svårare motstånd än genomsnittet och minus lättare.',
      ex: ({ t, namn }) => { const v = t.fd && t.fd.opp; if (!ok(v)) return null; return Number(Math.abs(v).toFixed(2)) === 0 ? `${gen(namn)} motståndare har varit lika starka som i ett genomsnittligt spelschema.` : `${gen(namn)} motståndare har varit ${dec(Math.abs(v), 2)} mål per match ${v > 0 ? 'starkare' : 'svagare'} än i ett genomsnittligt spelschema.`; },
    },
    skott: {
      t: 'Lagets avslut per match, även de som går utanför eller täcks.',
      ex: ({ t, namn }) => { const s = t.fd && t.fd.sh; return s && s.n ? `${namn} har skjutit ${st(s.f, 'gång', 'gånger')} på ${st(s.n, 'match', 'matcher')}: ${s.f} / ${s.n} = ${dec(s.f / s.n)}.` : null; },
    },
    skottmot: {
      t: 'Motståndarnas avslut per match. Ju färre, desto bättre.',
      ex: ({ t, namn }) => { const s = t.fd && t.fd.sh; return s && s.n ? `Motståndarna har skjutit ${st(s.a, 'gång', 'gånger')} mot ${namn} på ${st(s.n, 'match', 'matcher')}: ${s.a} / ${s.n} = ${dec(s.a / s.n)}.` : null; },
    },
    pamal: {
      t: 'Lagets skott på mål per match, alltså mål och skott som målvakten räddar. Skott utanför eller i stolpen räknas inte.',
      ex: ({ t, namn }) => { const s = t.fd && t.fd.sh; return s && s.n && ok(s.of) ? `${namn} har skjutit ${st(s.f, 'gång', 'gånger')} på ${st(s.n, 'match', 'matcher')}, och ${s.of} av skotten gick på mål: ${s.of} / ${s.n} = ${dec(s.of / s.n)} per match.` : null; },
    },
    gula: {
      t: 'Lagets gula kort per match. En spelare som visas ut efter två varningar räknas med två gula kort och ett rött.',
      ex: ({ t, namn }) => { const c = t.fd && t.fd.cards; return c && c.n ? `${namn} har fått ${st(c.y, 'gult kort', 'gula kort')} på ${st(c.n, 'match', 'matcher')}: ${c.y} / ${c.n} = ${dec(c.y / c.n, 2)}.` : null; },
    },
    favorit: {
      t: 'Hur ofta laget har haft större chans än motståndaren att vinna, enligt spelbolagens odds vid avspark.',
      ex: ({ t, namn }) => { const x = mkt(t); return x ? `${namn} var ${x.fav ? iAv(x.fav, x.n, 'match', 'matcher', 'favorit') : iIngen(x.n, 'match', 'matcher', 'favorit')}: ${pr(x.fav / x.n)}.` : null; },
    },
    vantat: {
      t: 'Så många poäng oddsen räknade med att laget skulle ta. Oddsen vid avspark görs om till chanser, utan spelbolagens påslag, och varje match blir värd 3 × vinstchansen + chansen till oavgjort i poäng.',
      ex: ({ t, namn }) => { const x = mkt(t); return x ? `En match där oddsen ger 60 % chans att vinna och 25 % chans till oavgjort är värd 3 × 0,60 + 0,25 = 2,05 poäng. ${gen(namn)} ${x.n} matcher var tillsammans värda ${dec(x.xp)} poäng.` : null; },
    },
    tog: {
      t: 'Poängen laget tog i de matcher som det finns odds för. De kan vara färre än i tabellen, eftersom oddsen ibland ligger en omgång efter.',
      ex: ({ t, namn }) => { const x = mkt(t); return x ? `${namn} tog ${st(x.pts, 'poäng', 'poäng')} i de ${x.n} matcher som det finns odds för. I tabellen har laget ${st(t.pts, 'poäng', 'poäng')}.` : null; },
    },
    odds: {
      t: 'Tagna poäng minus de poäng som oddsen räknade med. Plus betyder att laget har tagit fler poäng än spelbolagen trodde, och minus färre.',
      ex: ({ t, namn }) => { const x = mkt(t); if (!x) return null; const xp = rund(x.xp, 1); return `${namn} har tagit ${st(x.pts, 'poäng', 'poäng')}. Oddsen räknade med ${dec(xp)}: ${x.pts} − ${dec(xp)} = ${tk(x.pts - xp)}.`; },
    },
    seger: {
      t: 'Vinsten eller förlusten, i procent av insatserna, för den som hade spelat lika mycket på seger för laget i varje match, till oddset vid avspark. Spelbolagens påslag är inräknat.',
      ex: ({ t, namn }) => { const x = mkt(t); if (!x || !ok(x.ret)) return null; const i = x.n === 1 ? 'i den enda matchen' : `i var och en av de ${x.n} matcherna, sammanlagt ${kr(100 * x.n)},`; return `100 kr på seger för ${namn} ${i} hade gett tillbaka ${kr(100 * x.ret)}: ${tpr((x.ret - x.n) / x.n)}.`; },
    },
    malspelare: {
      t: 'Mål av lagets spelare enligt ESPN. Motståndarnas självmål räknas inte, så summan kan vara lägre än i tabellen.',
      ex: ({ t, namn, sq }) => (sq && ok(sq.goals) ? `Enligt tabellen har ${namn} gjort ${st(t.gf, 'mål', 'mål')}, och lagets egna spelare står för ${sq.goals === t.gf ? 'alla' : `${sq.goals} av dem`}.` : null),
    },
    skytten: {
      t: 'Lagets bästa målskytt i ligan och antalet mål.',
      ex: ({ namn, sq }) => (sq && sq.topScorer && sq.topScorer.g && sq.goals ? `${sq.topScorer.name} har gjort ${sq.topScorer.g} av ${gen(namn)} ${st(sq.goals, 'mål', 'mål')}.` : null),
    },
    beroende: {
      t: 'Hur stor del av lagets mål den bästa målskytten har gjort. Ett högt tal betyder att laget är beroende av en enda spelare.',
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
      e: 'xG', n: 'LAGETS–MOTSTÅNDARNAS xG PER MATCH',
      t: `Förväntade mål (xG) per match, först lagets egna chanser och sedan motståndarnas. ${xgOrd}`,
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
  // början på en mening om k av spelarens mål: "4 av Haalands 14 mål",
  // "Alla Haalands 3 mål", "Inget av Haalands 14 mål", "Haalands enda mål"
  const avMal = (p, namn, k) => {
    if (p.g === 1) return `${gen(namn)} enda mål`;
    if (k === p.g) return `Alla ${gen(namn)} ${p.g} mål`;
    return `${k ? k : 'Inget'} av ${gen(namn)} ${st(p.g, 'mål', 'mål')}`;
  };
  const spelare = {
    matcher: {
      t: 'Ligamatcher den här säsongen, både från start och som inhoppare.',
      ex: ({ p, namn }) => {
        if (!ok(p.app) || !ok(p.starts)) return null;
        if (p.app === 1) return `${namn} har spelat 1 ligamatch och ${p.starts ? 'var med från start' : 'byttes in i den'}.`;
        const hur = p.starts === p.app ? 'alla från start' : !p.starts ? 'alla som inhoppare' : `${p.starts} från start och ${p.app - p.starts} som inhoppare`;
        return `${namn} har spelat ${st(p.app, 'ligamatch', 'ligamatcher')}, ${hur}.`;
      },
    },
    start: {
      t: 'Ligamatcher där spelaren var med i startelvan.',
      ex: ({ p, namn, lagN }) => {
        if (!ok(p.starts) || !ok(p.app)) return null;
        const [n, vems] = lagN ? [lagN, 'lagets'] : [p.app, 'sina'];
        if (!p.starts) return `${namn} har inte startat någon ligamatch.`;
        return p.starts === n && n > 1 ? `${namn} har startat alla ${vems} ${n} ligamatcher.` : `${namn} har startat ${p.starts} av ${vems} ${st(n, 'ligamatch', 'ligamatcher')}.`;
      },
    },
    inhopp: {
      t: 'Ligamatcher där spelaren byttes in i stället för att starta.',
      ex: ({ p, namn }) => {
        if (!ok(p.app) || !ok(p.starts) || !p.app) return null;
        if (p.starts === p.app) return `${namn} har startat ${p.app === 1 ? 'sin enda ligamatch' : `alla sina ${p.app} ligamatcher`} och har inte bytts in någon gång.`;
        if (!p.starts) return `${namn} har inte startat någon ligamatch, så ${p.app === 1 ? 'matchen var ett inhopp' : `alla ${p.app} matcherna var inhopp`}.`;
        return `${st(p.app, 'match', 'matcher')}, varav ${p.starts} från start: ${p.app} − ${p.starts} = ${st(p.app - p.starts, 'inhopp', 'inhopp')}.`;
      },
    },
    speltid: {
      t: 'Spelade minuter i ligan den här säsongen.',
      ex: ({ p }) => (ok(p.min) ? `${st(p.min, 'minut', 'minuter')} motsvarar ${dec(p.min / 90)} hela matcher.` : null),
    },
    permatch: {
      t: 'Genomsnittlig speltid per match. Ett lågt tal betyder ofta att spelaren byts in eller ut.',
      ex: ({ p }) => (ok(p.min) && p.app ? `${st(p.min, 'minut', 'minuter')} på ${st(p.app, 'match', 'matcher')}: ${hel(p.min)} / ${p.app} = ${Math.round(p.min / p.app)} minuter per match.` : null),
    },
    betyg: {
      t: 'Spelarens genomsnittliga betyg i ligan enligt 365Scores, på en skala från 1 till 10. En vanlig insats ger ungefär 6,7.',
      ex: ({ p, namn }) => (ok(p.rt) && p.rn ? `${namn} har fått betyg i ${st(p.rn, 'match', 'matcher')}, i genomsnitt ${dec(p.rt)}.` : null),
    },
    bast: {
      t: 'Matcher där spelaren fick högst betyg av alla på planen, enligt 365Scores.',
      ex: ({ p, namn }) => (ok(p.rb) && p.rn ? `${namn} var ${p.rb ? iAv(p.rb, p.rn, 'betygsatt match', 'betygsatta matcher', 'bäst på planen') : iIngen(p.rn, 'betygsatta match', 'betygsatta matcher', 'bäst på planen')}.` : null),
    },
    mal: {
      t: 'Mål i ligan den här säsongen. Självmål räknas inte.',
      ex: ({ p }) => perMatch(p.g, p.app, ['mål', 'mål'], 2),
    },
    assist: {
      t: 'Den sista passningen före ett mål, eller ett skott som målvakten räddar och en lagkamrat sätter in på returen. Siffrorna kommer från ESPN.',
      ex: ({ p }) => perMatch(p.a, p.app, ['assist', 'assist'], 2),
    },
    inblandad: {
      t: 'Hur stor del av lagets mål spelaren har gjort själv eller slagit den sista passningen till: mål och assist delade med lagets mål.',
      ex: ({ p, namn, lagM }) => (lagM && ok(p.g) ? `${namn} har ${antal(p.g, 'mål', 'mål', 'inga mål')} och ${antal(p.a || 0, 'assist', 'assist', 'inga assist')}, och laget har gjort ${lagM}: (${p.g} + ${p.a || 0}) / ${lagM} = ${pr((p.g + (p.a || 0)) / lagM)}.` : null),
    },
    andel: {
      t: 'Hur stor del av lagets mål spelaren har gjort.',
      ex: ({ p, namn, lagM }) => (lagM && ok(p.g) ? `${namn} har gjort ${p.g} av lagets ${st(lagM, 'mål', 'mål')}: ${p.g} / ${lagM} = ${pr(p.g / lagM)}.` : null),
    },
    skott: {
      t: 'Alla avslut i ligan, även de som går utanför eller täcks.',
      ex: ({ p }) => perMatch(p.sh, p.app, ['skott', 'skott']),
    },
    pamal: {
      t: 'Skott på mål, alltså mål och skott som målvakten räddar. Skott utanför eller i stolpen räknas inte.',
      ex: ({ p, namn }) => (ok(p.sot) && p.sh ? `${p.sot} av ${gen(namn)} ${st(p.sh, 'skott', 'skott')} har gått på mål: ${pr(p.sot / p.sh)}.` : null),
    },
    malskott: {
      t: 'Hur stor andel av skotten som har blivit mål. Med färre än tio skott är talet osäkert.',
      ex: ({ p }) => { if (!p.sh || !ok(p.g)) return null; const v = p.g ? vart(p.g / p.sh) : null; return `${stor(antal(p.g, 'mål', 'mål', 'inga mål'))} på ${st(p.sh, 'skott', 'skott')}: ${p.g} / ${p.sh} = ${pr(p.g / p.sh)}${v ? `, ${v}` : ''}.`; },
    },
    malmatch: {
      t: 'Mål per match, där ett inhopp räknas som en hel match.',
      ex: ({ p }) => (p.app && ok(p.g) ? `${stor(antal(p.g, 'mål', 'mål', 'inga mål'))} på ${st(p.app, 'match', 'matcher')}: ${p.g} / ${p.app} = ${dec(p.g / p.app, 2)}.` : null),
    },
    mal90: {
      t: 'Mål per 90 minuters speltid. Talet är rättvisare än mål per match för den som ofta byts in eller ut.',
      ex: ({ p }) => { const g = fg(p); return ok(g) && p.min ? `${stor(antal(g, 'mål', 'mål', 'inga mål'))} på ${st(p.min, 'minut', 'minuter')}: ${g} / ${hel(p.min)} × 90 = ${dec((g / p.min) * 90, 2)}.` : null; },
    },
    xg: {
      t: `Förväntade mål (xG): hur många mål spelarens chanser är värda. ${xgOrd} ${fpl}`,
      ex: ({ p, namn }) => (ok(p.xg) ? `${gen(namn)} ${p.sh ? st(p.sh, 'skott', 'skott') : 'skott'} var tillsammans värda ${dec(p.xg)} mål. I verkligheten blev det ${antal(fg(p), 'mål', 'mål', 'inget mål')}.` : null),
    },
    malmotxg: {
      t: 'Gjorda mål minus xG. Plus betyder fler mål än chanserna var värda, alltså en skicklig avslutare eller tur. Stora skillnader brukar jämna ut sig.',
      ex: ({ p }) => { if (!ok(p.xg) || !ok(p.fg)) return null; const x = rund(p.xg, 1); return `${stor(antal(p.fg, 'mål', 'mål', 'inga mål'))} på chanser värda ${dec(x)}: ${p.fg} − ${dec(x)} = ${tk(p.fg - x)}.`; },
    },
    xa: {
      t: `Förväntade assist (xA): hur många mål spelarens passningar till lagkamraternas avslut är värda, oavsett om skotten går in. ${fpl}`,
      ex: ({ p, namn }) => (ok(p.xa) ? `${gen(namn)} passningar till lagkamraternas avslut var värda ${dec(p.xa)} mål. I verkligheten blev det ${antal(fa(p) || 0, 'assist', 'assist', 'ingen assist')}.` : null),
    },
    xg90: {
      t: 'Förväntade mål per 90 minuters speltid: hur ofta och hur bra lägen spelaren kommer till, oavsett om de blir mål.',
      ex: ({ p }) => (ok(p.xg) && p.min ? `${dec(p.xg)} xG på ${st(p.min, 'minut', 'minuter')}: ${dec(p.xg)} / ${hel(p.min)} × 90 = ${dec((p.xg / p.min) * 90, 2)}.` : null),
    },
    ma90: {
      t: 'Mål och assist tillsammans per 90 minuters speltid.',
      ex: ({ p }) => { const g = fg(p); const a = fa(p) || 0; return ok(g) && p.min ? `${stor(antal(g, 'mål', 'mål', 'inga mål'))} och ${antal(a, 'assist', 'assist', 'inga assist')} på ${st(p.min, 'minut', 'minuter')}: (${g} + ${a}) / ${hel(p.min)} × 90 = ${dec(((g + a) / p.min) * 90, 2)}.` : null; },
    },
    segermal: {
      t: 'Mål som avgjorde matcher som laget vann, alltså målet som gav en ledning som laget sedan aldrig tappade. Vid 3–1 är lagets andra mål segermålet.',
      ex: ({ p, namn }) => (ok(p.gw) && p.g ? `${avMal(p, namn, p.gw)} ${p.g === 1 ? (p.gw ? 'avgjorde en match som laget vann' : 'avgjorde ingen match') : `avgjorde ${p.gw > 1 ? 'matcher' : 'en match'} som laget vann`}.` : null),
    },
    poangmal: {
      t: 'Poängen som laget hade gått miste om utan spelarens mål. Ett mål i en uddamålsseger är värt två poäng, eftersom matchen annars hade slutat oavgjort. Ett mål i en oavgjord match är värt en poäng, eftersom laget annars hade förlorat.',
      ex: ({ p, namn, lag: l }) => (ok(p.gpts) && p.g ? `Utan ${gen(namn)} ${st(p.g, 'mål', 'mål')} hade ${l || 'laget'} haft ${st(p.gpts, 'poäng', 'poäng')} färre.` : null),
    },
    forsta: {
      t: 'Matchens första mål, alltså mål som gav laget ledningen med 1–0.',
      ex: ({ p, namn }) => (ok(p.g1) && p.g ? `${avMal(p, namn, p.g1)} ${p.g === 1 && !p.g1 ? 'var inte matchens första' : 'var matchens första'}.` : null),
    },
    sena: {
      t: 'Mål från och med den 80:e minuten, tilläggstiden inräknad.',
      ex: ({ p, namn }) => (ok(p.glate) && p.g ? `${avMal(p, namn, p.glate)} ${p.g === 1 && !p.glate ? 'kom före den 80:e minuten' : 'kom i den 80:e minuten eller senare'}.` : null),
    },
    straffar: {
      t: 'Hur många av sina straffar i ligan spelaren har satt. Räddade och missade straffar räknas som slagna.',
      ex: ({ p, namn }) => {
        if (!ok(p.gpen)) return null;
        const s = p.gpen + (p.pmiss || 0);
        if (!s) return `${namn} har inte slagit någon straff i ligan.`;
        if (s === 1) return `${namn} har ${p.gpen ? 'satt' : 'missat'} sin enda straff.`;
        return `${namn} har ${p.gpen === s ? `satt alla sina ${s} straffar` : !p.gpen ? `missat alla sina ${s} straffar` : `satt ${p.gpen} av ${s} straffar`}.`;
      },
    },
    inhoppmal: {
      t: 'Mål som spelaren har gjort efter att ha bytts in.',
      ex: ({ p, namn }) => (ok(p.gsub) && p.g ? `${avMal(p, namn, p.gsub)} ${p.g === 1 && !p.gsub ? 'kom inte efter ett inhopp' : 'kom efter ett inhopp'}.` : null),
    },
    raddningar: {
      t: 'Målvaktens räddningar i ligan den här säsongen.',
      ex: ({ p, namn }) => (ok(p.sv) && ok(p.gc) ? (p.sv + p.gc ? `${namn} har räddat ${p.sv} av ${st(p.sv + p.gc, 'skott', 'skott')} på mål.` : `${namn} har inte mött något skott på mål.`) : null),
    },
    raddade: {
      t: 'Hur stor andel av skotten på mål som målvakten har räddat. Med färre än tio skott på mål är talet osäkert.',
      ex: ({ p }) => (ok(p.sv) && p.sv + (p.gc || 0) ? `${stor(antal(p.sv, 'räddning', 'räddningar', 'inga räddningar'))} och ${antal(p.gc || 0, 'insläppt mål', 'insläppta mål', 'inga insläppta mål')}: ${p.sv} / ${p.sv + (p.gc || 0)} = ${pr(p.sv / (p.sv + (p.gc || 0)))}.` : null),
    },
    motskott: {
      t: 'Skott på mål mot målvakten: räddningarna plus de insläppta målen.',
      ex: ({ p }) => (ok(p.sv) && ok(p.gc) ? `${stor(antal(p.sv, 'räddning', 'räddningar', 'inga räddningar'))} och ${antal(p.gc, 'insläppt mål', 'insläppta mål', 'inga insläppta mål')}: ${p.sv} + ${p.gc} = ${p.sv + p.gc}.` : null),
    },
    inslappta: {
      t: 'Mål som har gått in medan målvakten stod i mål.',
      ex: ({ p }) => perMatch(p.gc, p.app, ['insläppt mål', 'insläppta mål']),
    },
    inslmatch: {
      t: 'Insläppta mål per match. Ju färre, desto bättre.',
      ex: ({ p }) => (ok(p.gc) && p.app ? `${st(p.gc, 'insläppt mål', 'insläppta mål')} på ${st(p.app, 'match', 'matcher')}: ${p.gc} / ${p.app} = ${dec(p.gc / p.app)}.` : null),
    },
    tacklingar: {
      t: `Hur många gånger spelaren har tagit bollen från en motståndare i en närkamp. ${fpl}`,
      ex: ({ p }) => perMatch(p.tk, p.app, ['tackling', 'tacklingar']),
    },
    rensningar: {
      t: `Hur många gånger spelaren har rensat bort bollen, täckt ett skott eller en passning eller brutit en passning. ${fpl}`,
      ex: ({ p }) => (ok(p.cbi) && p.app ? `${hel(p.cbi)} rensningar, täckningar och brytningar på ${st(p.app, 'match', 'matcher')} blir ${dec(p.cbi / p.app)} per match.` : null),
    },
    bollvinster: {
      t: `Hur många gånger spelaren har tagit hand om en lös boll åt laget. Målvakter får många, eftersom de plockar ner inlägg och långa bollar. ${fpl}`,
      ex: ({ p }) => perMatch(p.rec, p.app, ['bollvinst', 'bollvinster']),
    },
    insatser90: {
      t: 'Tacklingar, rensningar, täckningar och brytningar per 90 minuters speltid.',
      ex: ({ p }) => (ok(p.tk) && ok(p.cbi) && p.min ? `${stor(antal(p.tk, 'tackling', 'tacklingar', 'inga tacklingar'))} och ${hel(p.cbi)} rensningar, täckningar och brytningar på ${st(p.min, 'minut', 'minuter')}: ${p.tk + p.cbi} / ${hel(p.min)} × 90 = ${dec(((p.tk + p.cbi) / p.min) * 90)}.` : null),
    },
    nollor: {
      t: `Matcher där spelaren var med i minst 60 minuter och laget inte släppte in något mål medan spelaren var på planen. ${fpl}`,
      ex: ({ p, namn }) => (ok(p.cs) && p.app ? (p.cs ? `${namn} har varit med och hållit nollan ${st(p.cs, 'gång', 'gånger')} på ${st(p.app, 'match', 'matcher')}.` : `${namn} har inte varit med om en enda nolla på ${st(p.app, 'match', 'matcher')}.`) : null),
    },
    sjalvmal: {
      t: 'Självmål i ligan den här säsongen.',
      ex: ({ p }) => perMatch(p.og, p.app, ['självmål', 'självmål'], 2),
    },
    falld: {
      t: 'Hur många gånger spelaren har blivit fälld eller utsatt för ett annat regelbrott som domaren har blåst för.',
      ex: ({ p, namn }) => (ok(p.fs) && p.app && !p.fs ? `${namn} har inte blivit fälld en enda gång på ${st(p.app, 'match', 'matcher')}.` : perMatch(p.fs, p.app, ['gång', 'gånger'])),
    },
    falld90: {
      t: 'Hur många gånger spelaren blir fälld per 90 minuters speltid.',
      ex: ({ p, namn }) => (ok(p.fs) && emin(p) && !p.fs ? `${namn} har inte blivit fälld en enda gång på ${st(emin(p), 'minut', 'minuter')}.` : ok(p.fs) && emin(p) ? `${st(p.fs, 'gång', 'gånger')} på ${st(emin(p), 'minut', 'minuter')}: ${p.fs} / ${hel(emin(p))} × 90 = ${dec((p.fs / emin(p)) * 90)}.` : null),
    },
    faller: {
      t: 'Regelbrott som spelaren har begått och som domaren har blåst frispark eller straff för.',
      ex: ({ p }) => perMatch(p.fc, p.app, ['regelbrott', 'regelbrott']),
    },
    faller90: {
      t: 'Begångna regelbrott per 90 minuters speltid.',
      ex: ({ p }) => (ok(p.fc) && emin(p) ? `${stor(antal(p.fc, 'regelbrott', 'regelbrott', 'inga regelbrott'))} på ${st(emin(p), 'minut', 'minuter')}: ${p.fc} / ${hel(emin(p))} × 90 = ${dec((p.fc / emin(p)) * 90)}.` : null),
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
