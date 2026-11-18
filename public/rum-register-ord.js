// Datorns förklaringar (sedan 2026-11-14, användarens val bland fyra skisser:
// rutan, med ord och ett konkret exempel). Ett tryck på ett tals etikett i
// lagkortet, spelarkortet eller matchakten öppnar en ruta över talen med vad
// talet är och hur det räknas (t), och ett exempel med lagets eller
// spelarens egna siffror (ex). Matchakten har egna ord för sina rader
// (akten, och land för en landskamp; sedan 2026-11-14 har varje rad där en
// förklaring). Rutan ritas i rum-register.js; här står bara
// orden. Texterna följer förklaringarna på Statistik (title i TCOLS och PCOLS
// i divisioner.js), skrivna om till hela meningar.
//
// Enkla tal (samma dag, användaren om VILAN: "alldeles för lång förklaring
// för något så enkelt"): en kort mening om det som inte redan står i rutans
// ram (etiketten och undertiteln), till exempel vilka matcher som räknas,
// och inget exempel. Exempel står bara där talet räknas på ett sätt som inte
// syns direkt: xG, turen, kryssen, modellen, oddsen, motståndets styrka,
// spelarens del av lagets mål och poängen som målen gav.
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
// och ger en mening, eller null när siffrorna saknas. Ett tal utan ex har
// inget exempel. I matchakten står ett exempel per lag (se matchakten nedan).
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
  const kr = (n) => `${hel(n)} kr`;
  // genitiv: Citys, Leeds, Haalands
  const gen = (n) => (/[sxz]$/i.test(n) ? n : `${n}s`);
  const xgOrd = 'Varje skott får ett värde efter hur ofta ett sådant skott blir mål. En straff är värd ungefär 0,8 och ett långskott några hundradelar.';
  const fpl = 'Siffrorna kommer från Fantasy Premier League.';

  // ---------- lagen ----------
  const xgOf = (t) => (t && t.fd && t.fd.xg && t.fd.xg.n ? t.fd.xg : null);
  const mkt = (t) => (t && t.fd && t.fd.mkt && t.fd.mkt.n ? t.fd.mkt : null);
  const lag = {
    form: { t: 'De fem senaste matcherna i ligan och de engelska cuperna, den senaste först och efter 90 minuter. V är vinst (3 poäng), O oavgjort (1 poäng) och F förlust.' },
    gjorda: { t: 'Lagets mål i ligan delat med antalet ligamatcher.' },
    inslappta: { t: 'Insläppta mål i ligan delat med antalet ligamatcher.' },
    nollor: { t: 'Andelen ligamatcher där laget inte har släppt in något mål.' },
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
    skott: { t: 'Lagets avslut i ligan, även de som går utanför eller täcks.' },
    skottmot: { t: 'Motståndarnas avslut i ligan, även de som går utanför eller täcks.' },
    pamal: { t: 'Skott på mål är mål och skott som målvakten räddar, inte skott utanför eller i stolpen.' },
    gula: { t: 'Lagets gula kort i ligan delat med antalet ligamatcher.' },
    favorit: { t: 'Hur ofta laget har haft större chans än motståndaren att vinna, enligt spelbolagens odds vid avspark.' },
    vantat: {
      t: 'Så många poäng oddsen räknade med att laget skulle ta. Oddsen vid avspark görs om till chanser, utan spelbolagens påslag, och varje match blir värd 3 × vinstchansen + chansen till oavgjort i poäng.',
      ex: ({ t, namn }) => { const x = mkt(t); return x ? `En match där oddsen ger 60 % chans att vinna och 25 % chans till oavgjort är värd 3 × 0,60 + 0,25 = 2,05 poäng. ${gen(namn)} ${x.n} matcher var tillsammans värda ${dec(x.xp)} poäng.` : null; },
    },
    tog: { t: 'Poängen laget tog i de matcher som det finns odds för. De kan vara färre än i tabellen, eftersom oddsen ibland ligger en omgång efter.' },
    odds: {
      t: 'Tagna poäng minus de poäng som oddsen räknade med. Plus betyder att laget har tagit fler poäng än spelbolagen trodde, och minus färre.',
      ex: ({ t, namn }) => { const x = mkt(t); if (!x) return null; const xp = rund(x.xp, 1); return `${namn} har tagit ${st(x.pts, 'poäng', 'poäng')}. Oddsen räknade med ${dec(xp)}: ${x.pts} − ${dec(xp)} = ${tk(x.pts - xp)}.`; },
    },
    seger: {
      t: 'Vinsten eller förlusten, i procent av insatserna, för den som hade spelat lika mycket på seger för laget i varje match, till oddset vid avspark. Spelbolagens påslag är inräknat.',
      ex: ({ t, namn }) => { const x = mkt(t); if (!x || !ok(x.ret)) return null; const i = x.n === 1 ? 'i den enda matchen' : `i var och en av de ${x.n} matcherna, sammanlagt ${kr(100 * x.n)},`; return `100 kr på seger för ${namn} ${i} hade gett tillbaka ${kr(100 * x.ret)}: ${tpr((x.ret - x.n) / x.n)}.`; },
    },
    malspelare: { t: 'Mål av lagets spelare enligt ESPN. Motståndarnas självmål räknas inte, så summan kan vara lägre än i tabellen.' },
    skytten: { t: 'Lagets bästa målskytt i ligan och antalet mål.' },
    beroende: { t: 'Hur stor del av lagets mål den bästa målskytten har gjort.' },
  };

  // ---------- matchakten ----------
  //
  // Matchaktens egna ord (sedan 2026-11-14, användarens önskemål: "pedagogiska
  // förklaringar på bra svenska … så kort som möjligt", med ett konkret
  // exempel där det behövs): raderna som visar något annat än kortet (MÅL och
  // xG som gjorda–insläppta, raderna ur matchens fil) och raderna som bara
  // finns i matchakten (vilan, nästa match, hemma och borta, skadorna,
  // domaren, mötena). Nyckeln är talets k (#lista:…) eller radens (#ord:…);
  // spelarnas tal heter spelare:k. Ett tal som saknas här har kortets ord
  // (lag ovan). ex får h för ett av lagen (hAkt i rum-register.js: lagets h
  // som ovan, och form5 [{ mot, tav, niva }], mott och visar(etikett)) och
  // ger en mening per lag. exm får h för matchen ({ hem, bort, p, dom }) och
  // ger en mening om hela matchen. t kan vara en funktion av matchens h.
  // ex: null betyder inget exempel (och inte kortets).
  const MANAD = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
  // efternamnet med "van", "de" och liknande som hör till (som startelvan i src/startelvor.js)
  const PARTIKLAR = new Set(['van', 'von', 'de', 'der', 'den', 'da', 'das', 'do', 'dos', 'di', 'del', 'della', 'du', 'le', 'la', 'ter', 'ten', 'mac', 'al', 'el', 'bin', 'ben']);
  // ett litet tal först i en mening: 'Sex', annars siffrorna
  const ORDTAL = ['Ingen', 'En', 'Två', 'Tre', 'Fyra', 'Fem', 'Sex', 'Sju', 'Åtta', 'Nio', 'Tio', 'Elva', 'Tolv'];
  const forst = (n) => ORDTAL[n] || hel(n);
  const efternamn = (s) => {
    const d = String(s || '').trim().split(/\s+/).filter(Boolean);
    if (d.length < 2) return d[0] || '';
    const i = d.findIndex((w, j) => j > 0 && j < d.length - 1 && PARTIKLAR.has(w.toLowerCase()));
    return d.slice(i > 0 ? i : d.length - 1).join(' ');
  };
  // '2024-09-05' → '5 september 2024', eller med bara månaden: 'september 2024'
  const datumAr = (s, dag = true) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return `${dag ? `${d} ` : ''}${MANAD[m - 1]} ${y}`; };
  // ett exempel ur lagfilen bara när det ger samma tal som matchsidans rad
  const somRaden = (h, etikett, v) => { const r = h.visar ? h.visar(etikett) : null; return r == null || String(r).replace(/-/g, '−') === String(v).replace(/-/g, '−'); };
  const malxgEx = (h) => { const x = xgOf(h.t); if (!x) return null; const f = rund(x.f, 1); return somRaden(h, 'Gjorda mål mot xG', tk(x.gf - f)) ? lag.malxg.ex(h) : null; };
  const inslxgEx = (h) => { const x = xgOf(h.t); if (!x) return null; const a = rund(x.a, 1); return somRaden(h, 'Insläppta mål mot xG', tk(x.ga - a)) ? lag.inslxg.ex(h) : null; };
  const SNITT = 'SNITT är genomsnittet i divisionen under samma tid.';

  // De tio senaste i xG-fliken (sedan 2026-11-16): motståndet med den
  // starkaste och den svagaste motståndaren som exempel, som formens
  // (h.tio: { snitt, mot: [{ mot, tav, niva }] })
  const tioMotEx = ({ namn, tio }) => {
    const l = (tio && tio.mot) || [];
    const snitt = tio && tio.snitt ? tio.snitt.mott : null;
    if (!ok(snitt) || l.length < 2) return null;
    const max = l.reduce((a, b) => (b.niva > a.niva ? b : a));
    const min = l.reduce((a, b) => (b.niva < a.niva ? b : a));
    const vem = (x) => `${x.mot}${x.tav ? ` i ${x.tav}` : ''} (${x.niva})`;
    return max.niva === min.niva ? `Alla ${gen(namn)} motståndare låg på ${max.niva}.` : `${gen(namn)} tio senaste motståndare låg i genomsnitt på ${snitt}. Starkast var ${vem(max)} och svagast ${vem(min)}.`;
  };
  const TIO = 'Lagets tio senaste matcher i alla tävlingar räknas, efter 90 minuter.';

  const akten = {
    'tio-poang': { e: 'POÄNG/MATCH', n: 'DE TIO SENASTE MATCHERNA', t: `${TIO} En vinst ger 3 poäng och en oavgjord match 1.`, ex: null },
    'tio-malen': { e: 'MÅLEN', n: 'GJORDA–INSLÄPPTA, DE TIO SENASTE', t: `Alla mål tillsammans. ${TIO}`, ex: null },
    'tio-motstand': {
      e: 'MOTSTÅNDET', n: 'MOTSTÅNDARNAS STYRKA I SNITT',
      t: 'Hur svåra lagets tio senaste motståndare är i genomsnitt, enligt modellens styrka just nu. Talet är motståndarens chans mot divisionens mittenlag på neutral plan, där oavgjort räknas som en halv vinst: 50 är lika bra som mittenlaget, och ju högre, desto svårare. Inget lag ligger på 0 eller 100, eftersom ingen match är avgjord på förhand. Ett högt tal betyder att resultaten har kommit mot svårt motstånd.',
      ex: tioMotEx,
    },
    // KURVAN i xG-fliken (sedan 2026-11-18): början av säsongen mot de
    // senaste tre matcherna, som exempel
    kurvan: {
      e: 'KURVAN', n: 'xG MATCH FÖR MATCH',
      t: ({ m }) => `Lagets chanser i ${m && ['unl', 'emk', 'vsk'].includes(m.comp) ? 'Nations League' : 'ligan'} match för match, med den första matchen till vänster och den senaste till höger. Varje punkt är snittet av tre matcher, så att en enstaka match inte drar iväg. Den ljusa linjen är lagets egen xG och den gröna motståndarnas. Där den ljusa ligger över den gröna är fältet mellan dem fyllt: där skapade laget mer än det släppte till.`,
      ex: ({ namn, t }) => {
        const l = t && t.fd && t.fd.serie;
        if (!l || l.length < 6) return null;
        const s3 = (x, j) => dec(x.reduce((a, y) => a + y[j], 0) / x.length);
        const forst = l.slice(0, 3);
        const sist = l.slice(-3);
        return `${namn} skapade ${s3(forst, 1)} xG per match i de tre första matcherna och ${s3(sist, 1)} i de tre senaste, och släppte till ${s3(forst, 2)} och ${s3(sist, 2)}.`;
      },
    },
    'tio-matcher': {
      e: 'MATCH FÖR MATCH', n: 'DE TIO SENASTE MATCHERNA',
      t: 'Den senaste matchen står först: utfallet, resultatet efter 90 minuter, H för hemma och B för borta, motståndaren och dess styrka från 0 till 100 med en mätare – samma skala som MOTSTÅNDET.',
      ex: null,
    },
    form: {
      e: 'FORMEN', n: 'DE FEM SENASTE MATCHERNA',
      t: 'Matcher i alla tävlingar, den senaste först och efter 90 minuter. Talet efter bokstäverna är motståndarnas styrka i genomsnitt: deras chans mot divisionens mittenlag, där 50 är lika bra som mittenlaget.',
      ex: ({ namn, form5, mott }) => {
        const l = (form5 || []).filter((x) => ok(x.niva));
        if (!ok(mott) || l.length < 2) return null;
        const max = l.reduce((a, b) => (b.niva > a.niva ? b : a));
        const min = l.reduce((a, b) => (b.niva < a.niva ? b : a));
        const vem = (x) => `${x.mot}${x.tav ? ` i ${x.tav}` : ''} (${x.niva})`;
        return max.niva === min.niva ? `Alla ${gen(namn)} motståndare låg på ${max.niva}.` : `${gen(namn)} motståndare låg i genomsnitt på ${mott}. Starkast var ${vem(max)} och svagast ${vem(min)}.`;
      },
    },
    vila: { e: 'VILAN', n: 'DAGAR SEDAN FÖRRA MATCHEN', t: 'Alla tävlingar räknas. Under dagarna står tävlingen när det inte är ligan.', ex: null },
    nasta: { e: 'NÄSTA', n: 'DAGAR TILL NÄSTA MATCH', t: 'Alla tävlingar räknas. Under dagarna står tävlingen när det inte är ligan.', ex: null },
    matcher: { n: 'MATCHER DE SENASTE DAGARNA', t: 'Alla tävlingar räknas.', ex: null },
    // spelarnas egen vila (sedan 2026-11-16), också för landskamperna
    'vila-elvan': {
      e: 'ELVANS VILA', n: 'DAGAR SEDAN SPELARNAS SENASTE MATCH',
      t: 'Snittet för startelvan. Varje spelares senaste match räknas, för klubben eller landslaget, och ett inhopp räknas också. En landskamp som inte är spelad än räknas när spelaren står i landslagets troliga elva eller redan har spelat under uppehållet. Mer än två veckor räknas som två veckor. Elvan under dagarna är den uttagna, 365Scores troliga, sajtens beräknade eller den i förra matchen.',
      ex: ({ namn, sv }) => {
        const x = sv && sv.elva;
        if (!x || !x.p || x.p.length < 2) return null;
        const tak = (d) => (d == null ? 14 : Math.min(14, d));
        const per = new Map();
        for (const [, d] of x.p) per.set(tak(d), (per.get(tak(d)) || 0) + 1);
        const g = [...per].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
        const vem = { uttagen: 'uttagna elva', trolig: 'troliga elva', 'beräknad': 'beräknade elva', 'förra': 'elva i förra matchen' }[x.k] || 'elva';
        const hur = (d) => (d >= 14 ? 'två veckor eller mer' : d === 1 ? '1 dag' : `${d} dagar`);
        // de som räknas från en landskamp som inte är spelad än (namnen när de är få)
        const land = x.p.filter((y) => y[2]);
        const namnen = land.map((y) => efternamn(y[0]));
        const efter = !land.length ? ''
          : land.length <= 3 ? ` ${namnen.length > 1 ? `${namnen.slice(0, -1).join(', ')} och ${namnen[namnen.length - 1]}` : namnen[0]} räknas från en landskamp som inte är spelad än.`
            : ` ${forst(land.length)} av dem räknas från en landskamp som inte är spelad än.`;
        if (g.length === 1) return `Alla i ${gen(namn)} ${vem} har vilat ${hur(g[0][0])} när matchen börjar.${efter}`;
        const delar = g.map(([d, n]) => `${hel(n)} vilat ${hur(d)}`);
        const summa = x.p.reduce((s, [, d]) => s + tak(d), 0);
        return `I ${gen(namn)} ${vem} har ${delar.slice(0, -1).join(', ')} och ${delar[delar.length - 1]} när matchen börjar: (${g.map(([d, n]) => `${n} × ${d}`).join(' + ')}) / ${x.p.length} = ${dec(summa / x.p.length)}.${efter}`;
      },
    },
    'vila-truppen': {
      e: 'TRUPPENS VILA', n: 'DAGAR SEDAN SPELARNAS SENASTE MATCH',
      t: 'Snittet för alla i truppen som har spelat den senaste månaden, i alla tävlingar och för landslaget också. En landskamp som inte är spelad än räknas som för elvan. Mer än två veckor räknas som två veckor.',
      ex: ({ namn, sv }) => (sv && sv.trupp ? `${st(sv.trupp.n, 'spelare', 'spelare')} i ${gen(namn)} trupp har spelat den senaste månaden.${sv.trupp.l ? ` ${forst(sv.trupp.l)} av dem räknas från en landskamp som inte är spelad än.` : ''}` : null),
    },
    gjorda: { e: 'MÅL', n: 'GJORDA–INSLÄPPTA PER MATCH', t: 'Bara ligamatcherna räknas.', ex: null },
    hemma: { e: 'HEMMA', n: 'HEMMAMATCHERNA I LIGAN', t: 'Vinster, oavgjorda och förluster den här säsongen.', ex: null },
    borta: { e: 'BORTA', n: 'BORTAMATCHERNA I LIGAN', t: 'Vinster, oavgjorda och förluster den här säsongen.', ex: null },
    nollor: { e: 'NOLLOR', n: 'HÅLLNA NOLLOR I LIGAN', t: 'Ligamatcher där laget inte har släppt in något mål.', ex: null },
    utanmal: { e: 'UTAN MÅL', n: 'MATCHER UTAN EGET MÅL', t: 'Ligamatcher där laget inte har gjort något mål.', ex: null },
    skapar: {
      e: 'SKAPAR', n: 'LAGETS xG PER MATCH',
      t: `Förväntade mål (xG) per ligamatch: vad lagets chanser är värda. ${xgOrd}`,
      ex: lag.skapar.ex,
    },
    slapper: {
      e: 'SLÄPPER TILL', n: 'MOTSTÅNDARNAS xG PER MATCH',
      t: 'Motståndarnas förväntade mål (xG) per ligamatch: hur bra chanser laget släpper till. Ju lägre, desto bättre.',
      ex: lag.slapper.ex,
    },
    pamal: { e: 'SKJUTER', n: 'LAGETS SKOTT PÅ MÅL PER MATCH', t: 'Skott på mål är mål och skott som målvakten räddar. Bara ligamatcherna räknas.', ex: null },
    'pamal-mot': { e: 'SLÄPPER TILL', n: 'MOTSTÅNDARNAS SKOTT PÅ MÅL PER MATCH', t: 'Skott på mål är mål och skott som målvakten räddar. Ju färre, desto bättre. Bara ligamatcherna räknas.', ex: null },
    malxg: {
      e: 'GJORDA MÅL', n: 'GJORDA MÅL MOT xG',
      t: 'Gjorda mål minus xG den här säsongen. Plus betyder fler mål än chanserna var värda, alltså bra avslut eller tur. Stora skillnader brukar jämna ut sig.',
      ex: malxgEx,
    },
    inslxg: {
      e: 'INSLÄPPTA MÅL MOT xG', n: '',
      t: 'Insläppta mål minus motståndarnas xG den här säsongen. Minus betyder färre insläppta mål än motståndarnas chanser var värda, alltså en bra målvakt eller tur. Plus betyder fler.',
      ex: inslxgEx,
    },
    'spelare:assist': { e: 'ASSIST', n: 'FLEST ASSIST I LAGET', t: 'En assist är den sista passningen före ett mål. Bara ligan räknas.', ex: null },
    'spelare:segermal': {
      e: 'SEGERMÅL', n: 'FLEST SEGERMÅL I LAGET',
      t: 'Segermålet gav en ledning som laget sedan aldrig tappade: vid 3–1 är lagets andra mål segermålet. Bara ligan räknas.',
      ex: null,
    },
    'spelare:gula': { e: 'GULA KORT', n: 'FLEST GULA KORT I LAGET', t: 'Bara ligan räknas.', ex: null },
    skador: {
      e: 'SKADORNA', n: 'SKADADE OCH AVSTÄNGDA',
      t: 'Uppgifterna kommer från Fantasy Premier League, och de som har spelat mest står först. (AVST.) betyder avstängd och ? att det är osäkert om spelaren kan spela.',
      ex: null,
    },
    domaren: {
      e: 'DOMAREN', n: 'DOMARENS LIGAMATCHER',
      t: ({ dom }) => `Ligamatcher som domaren har dömt ${dom && dom.since ? `sedan ${datumAr(dom.since, false)}` : 'de senaste säsongerna'}. Raderna under gäller de matcherna.`,
      ex: null,
    },
    'dom-gula': { e: 'GULA KORT', n: 'I DOMARENS MATCHER', t: `Gula kort per match i domarens ligamatcher, båda lagen tillsammans. ${SNITT}`, ex: null },
    'dom-frisparkar': { e: 'FRISPARKAR', n: 'I DOMARENS MATCHER', t: `Frisparkar per match i domarens ligamatcher, båda lagen tillsammans. ${SNITT}`, ex: null },
    'dom-hemmaseger': { e: 'HEMMASEGER', n: 'I DOMARENS MATCHER', t: `Hur stor andel av domarens ligamatcher som hemmalaget har vunnit. ${SNITT} Med få matcher beror skillnaden mest på slumpen.`, ex: null },
    moten: {
      e: 'MÖTENA', n: 'DE SENASTE FEM ÅREN',
      t: 'Matcherna mellan lagen de senaste fem åren, det senaste mötet först. Raden under räknar vinster, oavgjorda och förluster för hemmalaget i den här matchen.',
      ex: null,
    },
    // förra mötet överst i MÖTENA (sedan 2026-11-15)
    forra: { e: 'FÖRRA MÖTET', n: 'HÖGST ETT HALVÅR SEDAN', t: 'Lagens siffror från förra gången de möttes, när det var högst ett halvår sedan. Siffrorna kommer från 365Scores.', ex: null },
    'forra-mal': { e: 'MÅL', n: 'I FÖRRA MÖTET', t: 'Målen i förra mötet efter 90 minuter.', ex: null },
    'forra-xg': { e: 'xG', n: 'I FÖRRA MÖTET', t: 'Hur många mål lagets chanser i förra mötet brukar ge. Ett högt tal betyder att laget skapade bra lägen, oavsett om bollen gick in.', ex: null },
    'forra-sh': { e: 'SKOTT', n: 'I FÖRRA MÖTET', t: 'Alla lagets skott i förra mötet, också de som gick utanför eller täcktes.', ex: null },
    'forra-sot': { e: 'PÅ MÅL', n: 'I FÖRRA MÖTET', t: 'Lagets skott i förra mötet som hade gått in om målvakten inte hade räddat.', ex: null },
    'forra-bc': { e: 'STORA CHANSER', n: 'I FÖRRA MÖTET', t: 'Lägen i förra mötet där ett mål var att vänta, till exempel ensam med målvakten.', ex: null },
    'forra-poss': { e: 'BOLLINNEHAV', n: 'I FÖRRA MÖTET', t: 'Hur stor del av förra mötet laget hade bollen.', ex: null },
    'forra-yc': { e: 'GULA KORT', n: 'I FÖRRA MÖTET', t: 'Lagets gula kort i förra mötet.', ex: null },
    'forra-rc': { e: 'RÖDA KORT', n: 'I FÖRRA MÖTET', t: 'Lagets röda kort i förra mötet.', ex: null },
    // hemmalaget hemma mot bortalaget borta överst i MÅLEN (sedan 2026-11-15)
    'hb-vof': { e: 'V-O-F', n: 'HEMMALAGET HEMMA, BORTALAGET BORTA', t: 'Vinster, oavgjorda och förluster i ligan den här säsongen: hemmalagets hemmamatcher och bortalagets bortamatcher.', ex: null },
    'hb-ppm': { e: 'POÄNG/MATCH', n: 'HEMMALAGET HEMMA, BORTALAGET BORTA', t: 'Poäng per ligamatch: hemmalagets på hemmaplan och bortalagets på bortaplan.', ex: null },
    'hb-mal': { e: 'MÅL', n: 'HEMMALAGET HEMMA, BORTALAGET BORTA', t: 'Gjorda och insläppta mål per ligamatch: hemmalagets på hemmaplan och bortalagets på bortaplan.', ex: null },
    'hb-xg': { e: 'xG', n: 'HEMMALAGET HEMMA, BORTALAGET BORTA', t: 'Skapade och insläppta chanser per ligamatch, räknade i mål de brukar ge: hemmalagets på hemmaplan och bortalagets på bortaplan.', ex: null },
    'hb-boll': { e: 'BOLLINNEHAV', n: 'HEMMALAGET HEMMA, BORTALAGET BORTA', t: 'Hur stor del av ligamatcherna laget har haft bollen i snitt: hemmalaget på hemmaplan och bortalaget på bortaplan. Siffrorna kommer från 365Scores.', ex: null },
    'hb-ovan': { e: 'LAG OVANFÖR', n: 'HEMMALAGET HEMMA, BORTALAGET BORTA', t: 'Poäng mot lag som står över laget i tabellen just nu: hemmalaget på hemmaplan och bortalaget på bortaplan.', ex: null },
    'hb-under': { e: 'LAG NEDANFÖR', n: 'HEMMALAGET HEMMA, BORTALAGET BORTA', t: 'Poäng mot lag som står under laget i tabellen just nu: hemmalaget på hemmaplan och bortalaget på bortaplan.', ex: null },
  };

  // Vad lagen spelar för i Nations Leagues sista omgångar (sedan 2026-11-15):
  // reglerna för gruppens liga i Nations League 2026–27 och ett exempel per
  // lag ur insatsen (rum-register.js: h.ins = { liga, lag: [{ n, mal,
  // villkor, minst, klart, etta, annars }], andra: de andra matcherna i
  // gruppen }).
  const EM = ' Ettorna i A, B och C får dessutom en reservplats till EM: ett sista kval i mars 2028 för de ettor som inte tar sig dit den vanliga vägen.';
  const REGLER = {
    A: `Ettan och tvåan i en A-grupp går till kvartsfinal i mars. Av de fyra treorna stannar de två bästa i A, och de två andra spelar kval mot en tvåa ur B. Av fyrorna spelar de två bästa samma kval och de två andra åker ur.${EM}`,
    B: `Ettan i en B-grupp går upp i A. Tvåan spelar kval i mars mot ett av de sämsta lagen i A om en plats där. Trean stannar i B, och fyran spelar kval mot en tvåa ur C om att få stanna.${EM}`,
    C: `Ettan i en C-grupp går upp i B, och tvåan spelar kval i mars mot en fyra ur B om en plats där. Trean och fyran stannar i C.${EM}`,
    D: 'Alla lag i D går upp i C, eftersom D läggs ner efter den här säsongen.',
  };
  // målet som [presens, infinitiv]
  const MALORD = (mal, liga) => ({
    KVARTSFINAL: ['går till kvartsfinal', 'gå till kvartsfinal'],
    TREA: ['blir trea', 'bli trea'],
    FYRA: ['blir fyra', 'bli fyra'],
    'UPP I A': ['går upp i A', 'gå upp i A'],
    'UPP I B': ['går upp i B', 'gå upp i B'],
    'UPP I C': ['går upp i C', 'gå upp i C'],
    'KVAL OM A': ['spelar kval om en plats i A', 'spela kval om en plats i A'],
    'KVAL OM B': liga === 'B' ? ['spelar kval om att få stanna i B', 'spela kval om att få stanna i B'] : ['spelar kval om en plats i B', 'spela kval om en plats i B'],
    'KVAR I B': ['stannar i B', 'stanna i B'],
    'KVAR I C': ['stannar i C', 'stanna i C'],
  })[mal] || [mal.toLowerCase(), mal.toLowerCase()];
  function insatsEx(h) {
    const I = h.ins;
    if (!I) return null;
    const andra = I.andra.length ? I.andra.join(' och ') : null;
    return I.lag.map((x, j) => {
      const namn = (j ? h.bort : h.hem).namn;
      const [pres, inf] = MALORD(x.mal, I.liga);
      if (x.klart) return x.etta ? `${namn} är klart som etta och ${pres}${I.liga !== 'D' ? ', med en reservplats till EM' : ''}.` : `${namn} är klart och ${pres}.`;
      if (x.villkor === 'POÄNG RÄCKER') return `${namn} ${pres} med minst en poäng.`;
      if (x.villkor === 'VINST RÄCKER') return `${namn} ${pres} med en vinst.${x.annars && andra ? ` Annars avgörs det av ${andra}.` : ''}`;
      if (x.villkor === 'MÅLEN AVGÖR') return x.minst === 'V' ? `${namn} måste vinna för att ${inf}, och då avgör målen.` : `${namn} kan ${inf} med minst en poäng, men då avgör målen.`;
      if (x.villkor === 'VINST + HJÄLP') return `${namn} måste vinna och få hjälp${andra ? ` av ${andra}` : ''} för att ${inf}.`;
      return `${namn} kan ${inf}, men det avgörs också av ${andra || 'de andra resultaten'}.`;
    }).join(' ');
  }

  // En landskamp: samma rader med landslagens siffror – Nations League
  // hittills, alla landskamper sedan hösten 2024 och marknadens chans (och
  // ingen styrka, eftersom modellen inte räknar på landslagen; motståndets
  // styrka i formen och de tio senaste är sedan 2026-11-16 Elo-talen).
  const landet = {
    'tio-poang': akten['tio-poang'],
    'tio-malen': akten['tio-malen'],
    'tio-motstand': {
      e: 'MOTSTÅNDET', n: 'MOTSTÅNDARNAS STYRKA I SNITT',
      t: 'Hur svåra lagets tio senaste motståndare är i genomsnitt, enligt landslagens Elo-tal just nu (eloratings.net). Talet är motståndarens chans mot mittenlaget i lagets liga i Nations League på neutral plan, där oavgjort räknas som en halv vinst: 50 är lika bra som mittenlaget, och ju högre, desto svårare. Ett högt tal betyder att resultaten har kommit mot svårt motstånd.',
      ex: tioMotEx,
    },
    'tio-matcher': {
      e: 'MATCH FÖR MATCH', n: 'DE TIO SENASTE LANDSKAMPERNA',
      t: 'Den senaste landskampen står först: utfallet, resultatet efter 90 minuter, H för hemma och B för borta, motståndaren och dess styrka från 0 till 100 enligt Elo-talen, med en mätare – samma skala som MOTSTÅNDET.',
      ex: null,
    },
    spelarfor: { e: 'SPELAR FÖR', n: 'NATIONS LEAGUE', t: (h) => REGLER[(h.ins && h.ins.liga) || 'B'], exm: insatsEx },
    form: {
      e: 'FORMEN', n: 'DE FEM SENASTE LANDSKAMPERNA',
      t: 'Den senaste landskampen står först, och det är resultatet efter 90 minuter som gäller. Talet efter bokstäverna är motståndarnas styrka i genomsnitt enligt landslagens Elo-tal: deras chans mot mittenlaget i lagets liga i Nations League, där 50 är lika bra som mittenlaget.',
      ex: akten.form.ex,
    },
    vila: { e: 'VILAN', n: 'DAGAR SEDAN FÖRRA LANDSKAMPEN', t: 'Spelarna har spelat för sina klubbar under tiden, så vilan säger lite om hur trötta de är.', ex: null },
    nasta: { e: 'NÄSTA', n: 'DAGAR TILL NÄSTA LANDSKAMP', t: 'Under dagarna står tävlingen när den är en annan än i den här matchen.', ex: null },
    matcher: { n: 'LANDSKAMPER DE SENASTE DAGARNA', t: 'Bara landskamperna räknas, inte spelarnas matcher i klubblagen.', ex: null },
    grupp: { n: 'PLATSEN I GRUPPEN', t: 'Lagets plats i sin grupp i Nations League och hur många lag gruppen har.', ex: null },
    poang: { e: 'POÄNG', n: 'POÄNG PÅ SPELADE MATCHER', t: 'En vinst ger 3 poäng och en oavgjord match 1.', ex: null },
    favorit: {
      e: 'FAVORIT', n: 'FAVORIT ENLIGT ODDSEN',
      t: 'Hur ofta laget har haft större chans än motståndaren att vinna i Nations League, enligt spelbolagens odds vid avspark.',
      ex: null,
    },
    odds: {
      e: 'MOT ODDSEN', n: 'POÄNG MOT ODDSEN',
      t: 'Tagna poäng i Nations League minus de poäng som oddsen räknade med. Plus betyder att laget har tagit fler poäng än spelbolagen trodde, och minus färre.',
      ex: lag.odds.ex,
    },
    marknaden: {
      e: 'MARKNADEN', n: 'CHANSEN ENLIGT ODDSEN',
      t: 'Chansen att hemmalaget vinner (till vänster) och att bortalaget vinner (till höger), räknad ur spelbolagens odds. Chansen till oavgjort står under. Spelbolagens påslag är borträknat, så att de tre chanserna tillsammans blir 100 %.',
      exm: ({ hem, bort, p }) => (p ? `Enligt oddsen skulle ${hem.namn} vinna ${p[0]} av 100 sådana matcher och ${bort.namn} ${p[2]}, medan ${p[1]} skulle sluta oavgjort.` : null),
    },
    'nl-vof': { e: 'V-O-F', n: 'I NATIONS LEAGUE', t: 'Vinster, oavgjorda och förluster hittills.', ex: null },
    'nl-mal': { e: 'MÅL', n: 'GJORDA–INSLÄPPTA PER MATCH', t: 'Bara matcherna i Nations League räknas.', ex: null },
    'nl-nollor': { e: 'NOLLOR', n: 'HÅLLNA NOLLOR', t: 'Matcher i Nations League där laget inte har släppt in något mål.', ex: null },
    skytten: { e: 'SKYTTEN', n: 'BÄSTE MÅLSKYTTEN', t: 'Bara målen i Nations League räknas.', ex: null },
    'spelare:assist': { e: 'ASSIST', n: 'FLEST ASSIST I LAGET', t: 'En assist är den sista passningen före ett mål. Bara Nations League räknas.', ex: null },
    'alla-vof': { e: 'V-O-F', n: 'ALLA LANDSKAMPER', t: 'Alla landskamper sedan hösten 2024 räknas, också vänskapsmatcherna.', ex: null },
    'alla-mal': { e: 'MÅL', n: 'GJORDA–INSLÄPPTA PER MATCH', t: 'Alla landskamper sedan hösten 2024 räknas, också vänskapsmatcherna.', ex: null },
    'alla-nollor': { e: 'NOLLOR', n: 'HÅLLNA NOLLOR', t: 'Landskamper sedan hösten 2024 där laget inte har släppt in något mål.', ex: null },
    skapar: {
      e: 'SKAPAR', n: 'LAGETS xG PER MATCH',
      t: `Förväntade mål (xG) per match i Nations League: vad lagets chanser är värda. ${xgOrd}`,
      ex: lag.skapar.ex,
    },
    slapper: {
      e: 'SLÄPPER TILL', n: 'MOTSTÅNDARNAS xG PER MATCH',
      t: 'Motståndarnas förväntade mål (xG) per match i Nations League: hur bra chanser laget släpper till. Ju lägre, desto bättre.',
      ex: lag.slapper.ex,
    },
    pamal: { e: 'SKJUTER', n: 'LAGETS SKOTT PÅ MÅL PER MATCH', t: 'Skott på mål är mål och skott som målvakten räddar. Bara Nations League räknas.', ex: null },
    'pamal-mot': { e: 'SLÄPPER TILL', n: 'MOTSTÅNDARNAS SKOTT PÅ MÅL PER MATCH', t: 'Skott på mål är mål och skott som målvakten räddar. Ju färre, desto bättre. Bara Nations League räknas.', ex: null },
    malxg: {
      e: 'GJORDA MÅL', n: 'GJORDA MÅL MOT xG',
      t: 'Gjorda mål minus xG i Nations League. Plus betyder fler mål än chanserna var värda, alltså bra avslut eller tur. Stora skillnader brukar jämna ut sig.',
      ex: lag.malxg.ex,
    },
    inslxg: {
      e: 'INSLÄPPTA MÅL MOT xG', n: '',
      t: 'Insläppta mål minus motståndarnas xG i Nations League. Minus betyder färre insläppta mål än motståndarnas chanser var värda, alltså en bra målvakt eller tur. Plus betyder fler.',
      ex: lag.inslxg.ex,
    },
    moten: {
      e: 'MÖTENA', n: 'DE SENASTE FEM ÅREN',
      t: 'Alla landskamper mellan lagen de senaste fem åren, också vänskapsmatcherna, den senaste först. Raden under räknar vinster, oavgjorda och förluster för hemmalaget i den här matchen.',
      ex: null,
    },
  };

  // ---------- spelarna ----------
  const fg = (p) => (p.fg !== undefined ? p.fg : p.g);
  const fa = (p) => (p.fg !== undefined ? p.fa : p.a);
  const spelare = {
    matcher: { t: 'Ligamatcher den här säsongen, både från start och som inhoppare.' },
    start: { t: 'Ligamatcher där spelaren var med i startelvan.' },
    inhopp: { t: 'Ligamatcher där spelaren byttes in i stället för att starta.' },
    speltid: { t: 'Spelade minuter i ligan den här säsongen.' },
    permatch: { t: 'Spelade minuter i ligan delat med antalet ligamatcher.' },
    betyg: { t: 'Spelarens genomsnittliga betyg i ligan enligt 365Scores, på en skala från 1 till 10. En vanlig insats ger ungefär 6,7.' },
    bast: { t: 'Matcher där spelaren fick högst betyg av alla på planen, enligt 365Scores.' },
    mal: { t: 'Mål i ligan den här säsongen. Självmål räknas inte.' },
    assist: { t: 'Den sista passningen före ett mål, eller ett skott som målvakten räddar och en lagkamrat sätter in på returen. Siffrorna kommer från ESPN.' },
    inblandad: {
      t: 'Hur stor del av lagets mål spelaren har gjort själv eller slagit den sista passningen till: mål och assist delade med lagets mål.',
      ex: ({ p, namn, lagM }) => (lagM && ok(p.g) ? `${namn} har ${antal(p.g, 'mål', 'mål', 'inga mål')} och ${antal(p.a || 0, 'assist', 'assist', 'inga assist')}, och laget har gjort ${lagM}: (${p.g} + ${p.a || 0}) / ${lagM} = ${pr((p.g + (p.a || 0)) / lagM)}.` : null),
    },
    andel: { t: 'Hur stor del av lagets mål spelaren har gjort.' },
    skott: { t: 'Alla avslut i ligan, även de som går utanför eller täcks.' },
    pamal: { t: 'Skott på mål är mål och skott som målvakten räddar, inte skott utanför eller i stolpen.' },
    malskott: { t: 'Hur stor andel av skotten som har blivit mål. Med färre än tio skott är talet osäkert.' },
    malmatch: { t: 'Mål per match, där ett inhopp räknas som en hel match.' },
    mal90: { t: 'Mål per 90 minuters speltid. Talet är rättvisare än mål per match för den som ofta byts in eller ut.' },
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
    xg90: { t: 'Förväntade mål per 90 minuters speltid: hur ofta och hur bra lägen spelaren kommer till, oavsett om de blir mål.' },
    ma90: { t: 'Mål och assist tillsammans per 90 minuters speltid.' },
    segermal: { t: 'Mål som gav en ledning som laget sedan aldrig tappade. Vid 3–1 är lagets andra mål segermålet.' },
    poangmal: {
      t: 'Poängen som laget hade gått miste om utan spelarens mål. Ett mål i en uddamålsseger är värt två poäng, eftersom matchen annars hade slutat oavgjort. Ett mål i en oavgjord match är värt en poäng, eftersom laget annars hade förlorat.',
      ex: ({ p, namn, lag: l }) => (ok(p.gpts) && p.g ? `Utan ${gen(namn)} ${st(p.g, 'mål', 'mål')} hade ${l || 'laget'} haft ${st(p.gpts, 'poäng', 'poäng')} färre.` : null),
    },
    forsta: { t: 'Mål som gav laget ledningen med 1–0.' },
    sena: { t: 'Mål från och med den 80:e minuten, tilläggstiden inräknad.' },
    straffar: { t: 'Hur många av sina straffar i ligan spelaren har satt. Räddade och missade straffar räknas som slagna.' },
    inhoppmal: { t: 'Mål som spelaren har gjort efter att ha bytts in.' },
    raddningar: { t: 'Målvaktens räddningar i ligan den här säsongen.' },
    raddade: { t: 'Hur stor andel av skotten på mål som målvakten har räddat. Med färre än tio skott på mål är talet osäkert.' },
    motskott: { t: 'Räddningarna plus de insläppta målen.' },
    inslappta: { t: 'Mål som har gått in medan målvakten stod i mål.' },
    inslmatch: { t: 'Insläppta mål delat med antalet matcher.' },
    tacklingar: { t: `Hur många gånger spelaren har tagit bollen från en motståndare i en närkamp. ${fpl}` },
    rensningar: { t: `Hur många gånger spelaren har rensat bort bollen, täckt ett skott eller en passning eller brutit en passning. ${fpl}` },
    bollvinster: { t: `Hur många gånger spelaren har tagit hand om en lös boll åt laget. Målvakter får många, eftersom de plockar ner inlägg och långa bollar. ${fpl}` },
    insatser90: { t: 'Tacklingar, rensningar, täckningar och brytningar per 90 minuters speltid.' },
    nollor: { t: `Matcher där spelaren var med i minst 60 minuter och laget inte släppte in något mål medan spelaren var på planen. ${fpl}` },
    sjalvmal: { t: 'Självmål i ligan den här säsongen.' },
    falld: { t: 'Hur många gånger spelaren har blivit fälld eller utsatt för ett annat regelbrott som domaren har blåst för.' },
    falld90: { t: 'Hur många gånger spelaren blir fälld per 90 minuters speltid.' },
    faller: { t: 'Regelbrott som spelaren har begått och som domaren har blåst frispark eller straff för.' },
    faller90: { t: 'Begångna regelbrott per 90 minuters speltid.' },
    gula: { t: 'Gula kort i ligan den här säsongen.' },
    roda: { t: 'Röda kort i ligan den här säsongen. Två gula kort i samma match ger ett rött.' },
  };

  window.RumRegisterOrd = { lag, akten, land: landet, spelare };
})();
