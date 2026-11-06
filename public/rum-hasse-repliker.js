// Det Hasse Backe (fiktiv) säger själv i tobaksaffären (rum-hasse.js), utan att
// någon AI är inblandad. Analysen av en match skrivs i förväg (src/analyser/hasse.mjs); här står
// allt runt omkring. Han lottar bland raderna, och inget av det här är ett faktum
// om en match eller en person. Skriv hela meningar med verb: "Vilken match?" och "Modigt."
// är avhuggna på ett sätt som svenskan inte tål. Varje rad ska också gå att förstå ensam:
// "den" och "det" får bara syfta på matchen man just har valt, annars skrivs det ut vad
// det gäller ("Vilken match vill du ha hjälp med?", inte "Vilken match är det?"). Över
// matchlistan finns alltid plats för två rader (ungefär 30 tecken var i ett fönster 1440
// brett och i telefonen), så att listan står still vad han än säger. Läs varje rad efter
// repliken före den: det han säger om kupongen kommer direkt efter "Det slutar 2–1", och
// ett "Det har du också" låter då som att man har tippat resultatet. npm run repliker
// (scripts/hasse/kolla-repliker.js) fäller det som går att fälla, och underkända uttryck
// läggs till där.
//
// {namn} ditt efternamn, {dag} när spelstoppet är (på lördag, i morgon, i dag),
// {du} dina tecken (etta och kryss), {Bada} tecknet ni båda har (Ettan), {res} resultatet (2–1).
//
// Raderna hörs: Macen tar fram ljudet till dem med fälten ifyllda
// (src/rost.js), så filen är både ett skript i sidan
// (window.HasseRepliker) och en modul för Node. lar är knappar och sägs inte.
(function (repliker) {
  if (typeof module === 'object' && module.exports) module.exports = repliker;
  else window.HasseRepliker = repliker;
})({
  // Tecknen i ord, för sidan och rösten: du som i "etta och kryss", bestamd som i "Ettan kan du behålla".
  tecken: { 1: { du: 'etta', bestamd: 'ettan' }, X: { du: 'kryss', bestamd: 'krysset' }, 2: { du: 'tvåa', bestamd: 'tvåan' } },

  // När man kommer till honom.
  oppning: ['Vilken match ska jag hjälpa dig med?', 'Vilken match har du kört fast på?'],
  oppningNamn: ['Vilken match ska jag hjälpa dig med?', 'Vilken match har du kört fast på?'],
  // När man har varit här förut.
  tillbaka: ['Har du kört fast igen?', 'Vilken match vill du ha hjälp med nu då?', 'Är du här igen?'],
  tillbakaNamn: ['Har du kört fast igen, {namn}?', 'Vilken match vill du ha hjälp med nu då, {namn}?', 'Är du här igen, {namn}?'],

  // Efter en analys.
  nasta: ['Vilken match tar vi nu?', 'Vi tar nästa match.', 'Är det någon mer match du undrar över?', 'Vilken match är nästa?'],
  // ... när man har frågat om just så många matcher.
  antal: {
    3: ['Du har frågat om tre matcher. Kupongen börjar likna något.', 'Du har frågat om tre matcher. Du börjar lära dig.', 'Du har frågat om tre matcher. Det börjar sitta.'],
    5: ['Du har frågat om fem matcher. Du är nyfiken av dig.'],
    10: ['Du har frågat om tio matcher. Du kan ta över min stol.'],
  },
  halva: ['Nu är halva kupongen klar.', 'Halva matcherna är klara. Resten är också enkla.'],
  enKvar: 'Nu är det en match kvar. Den är lika lätt som de andra.',
  // ... när alla är klara, nyss och när man kommer tillbaka.
  alla: 'Nu är hela kupongen klar. Lämna in den.',
  allaIgen: ['Du har redan fått svar på alla matcher.', 'Du har redan fått svar på alla matcher. Du kunde ha lyssnat.', 'Alla matcher har du fått svar på. Du får lyssna nästa gång.'],

  // Om man bara står där och inte frågar.
  ledig: ['Jag sitter kvar här.', 'Välj vilken match du vill. Alla är lätta.', 'Spelstoppet är {dag}.'],

  // När man har valt en match: han svarar och frågar tillbaka. valLasa när analysen finns
  // och han ska låtsas läsa på, och val när den inte finns. Han har alltid svaret, också när
  // han inte har det: att han läser på märks först när han väntar (vantar).
  val: ['Den är solklar.', 'Den kan jag i sömnen.', 'Glöm allt du har läst.'],
  valLasa: [
    'Den är solklar.',
    'Den kan jag i sömnen.',
    'Glöm allt du har läst.',
    'Den har jag svaret på.',
    'Den har jag redan klar för mig.',
    'Den vet jag allt om.',
    'Den har jag räknat på.',
    'Den knäckte jag i morse.',
    'Den har jag på en lapp här.',
  ],
  fragaTillbaka: ['Vill du veta, eller ska du gissa?', 'Vill du ha svaret, eller gissar du?', 'Ska jag säga hur det går, eller gissar du?'],
  // Knappen som tar fram analysen: ditt svar, bredvid Jag gissar.
  lar: ['Jag är idel öra', 'Tala om det för mig'],
  // Trycker man på Jag gissar.
  gissar: ['Då får du skylla dig själv.', 'Gissa du, det har gått förr.'],
  // Direkt när man har bett om analysen.
  reaktion: ['Där frågade du rätt man.', 'Nu ska du få höra.'],

  // En match man redan har frågat om: det han sa står direkt, och han erbjuder sig att
  // titta på den igen, ödmjukt på sitt sätt (han tvivlar ju aldrig). erbjudNytt när
  // analysen har skrivits om sedan han sa det. Knappen under är "Ja, titta igen".
  erbjud: [
    'Jag kan titta på den igen, om du vill. Jag är inte för fin för det.',
    'Ska jag titta på den en gång till? Det blir samma svar, men jag gör det gärna.',
    'Jag har haft fel en gång förut. Ska jag titta på den igen, för säkerhets skull?',
  ],
  erbjudNytt: [
    'Tidningarna har skrivit mer om den sedan dess. Ska jag titta på den igen?',
    'Det har kommit nytt om den sedan jag sa det här. Vill du att jag tittar igen?',
  ],
  // Direkt när man har bett honom titta igen.
  tittaIgen: ['Då tar vi den från början.', 'Jag tar den en gång till.'],

  // Medan han låtsas analysera: han börjar, håller på och är nästan klar, en rad lottad ur
  // varje del (vantan i rum-hasse.js). Han hinner säga två eller tre rader, så det är
  // lottningen som gör att det låter olika varje gång. Allt under kontroll.
  vantar: {
    forst: [
      'Jag ska bara titta på en sak.',
      'Ge mig bara en minut.',
      'Vänta lite, var har jag glasögonen?',
      'Jag läser på lite, för formens skull.',
      'Svaret har jag redan, men jag dubbelkollar.',
      'Jag ska bara slå upp tabellen.',
      'Jag ska bara leta fram mina anteckningar.',
    ],
    sedan: [
      'Jag läser tidningarna.',
      'Tidningarna har fel, som vanligt.',
      'Experterna i tidningarna förstår ingenting.',
      'Du har väl inte bråttom?',
      'Spelstoppet är {dag}.',
      'Allt är orsak och verkan, alltså.',
      'Den här sortens match har jag sett förut.',
      'Den här matchen har fler bottnar än man tror.',
      'Man ska inte stressa fram ett tips.',
      'Tyst nu, jag räknar.',
      'Magkänslan har aldrig svikit mig.',
      'Jag har tippat i femtio år.',
      'Jag går igenom skadelistan.',
      'Det gäller att läsa mellan raderna.',
    ],
    sist: [
      'Jag är strax klar.',
      'Nu faller bitarna på plats.',
      'Snart ska du få ditt svar.',
      'Nu vet jag hur matchen slutar.',
      'Jag har full kontroll.',
      'Ta det bara lugnt.',
      'Det är ingen fara.',
    ],
  },

  // Trycker man på Ja, ja mitt i.
  avbruten: ['Då får du läsa själv.', 'Som du vill.'],

  // Direkt efter domen, när han har helgarderat: han har ju alltid svar.
  helgardera: 'Då har jag rätt hur det än går.',

  // Efter texten: vad matchen slutar, hemma–borta. Resultatet är det troligaste i modellens
  // prognos bland tecknen han har ringat in (resultatet i rum-hasse.js).
  resultat: [
    'Det blir {res}, så är det bara.',
    'Det blir {res}, det är solklart.',
    'Det slutar {res}.',
    'Jag säger {res}. Mer än så är det inte.',
    'Jag säger {res}. Så är det bara.',
    'Jag säger {res}. Glöm allt annat.',
  ],

  // Sist, om din egen kupong.
  kupong: {
    samma: ['På din kupong har du samma tecken som jag. Det är klokt.', 'På din kupong har du samma tecken som jag. Du har lärt dig något.'],
    farre: ['På din kupong har du bara {du}. Det var kaxigt.'],
    fler: ['På din kupong har du {du}. Så många tecken behövs inte.'],
    korsar: ['{Bada} kan du behålla på din kupong, men stryk resten.', 'På din kupong har du {du}. {Bada} får du behålla.'],
    skilda: ['På din kupong har du {du}, och det kan du glömma.'],
  },

  // Allra sist erbjuder han sig att fylla i matchen på din kupong (hjalp i rum-hasse.js), när den går
  // att fylla i och du inte redan har hans tecken. "den" är matchen. hjalpSvar är dina svar
  // (knappar, sägs inte): {han} hans tecken i ord (etta och kryss), {en} det troligaste av dem
  // (ettan, krysset, tvåan).
  hjalp: ['Ska jag fylla i den på din kupong?', 'Vill du att jag kryssar i den på din kupong?'],
  hjalpNamn: ['Ska jag fylla i den på din kupong, {namn}?', 'Vill du att jag kryssar i den på din kupong, {namn}?'],
  hjalpSvar: { ja: 'Ja, {han}', helgardera: 'Ja, helgardera', spika: 'Spika {en}', bara: 'Bara {han}', nej: 'Nej tack' },
  // ... när kupongen inte vet vem du är
  hjalpVem: 'Vems kupong ska jag fylla i?',
  // ... när du har svarat: innan kupongen kommer, när den är ifylld och när du inte vill
  hjalpTar: ['Ge hit kupongen.', 'Ge mig kupongen, så fixar jag det.'],
  hjalpKlar: ['Nu står det rätt på din kupong.', 'Nu har du rätt tecken på din kupong. Lämna in kupongen när du är klar.', 'Det där kommer du att tacka mig för.'],
  hjalpNej: ['Som du vill. Det är din kupong.', 'Då får du fylla i den själv.'],
  hjalpGarInte: 'Din kupong går inte att fylla i längre.',

  // När något inte går.
  ingenKupong: 'Det finns ingen kupong än.',
  ejKlar: ['Den har jag inte kommit till än.', 'Den tar jag sen.'],
  utanRost: 'Jag har tappat rösten. Läs här.',

  // Anslagstavlan (rum-anslag.js): med en lapp i handen ropar man till honom (Hasse, vad
  // betyder procenten?), och han svarar från baren, utanför bilden. Först en rad ur svar, sedan
  // förklaringen i stycken med en mening i taget, så att varje mening får sitt ljud. Mellan
  // förklaringen och rad (vad han själv gör med det) kommer ett exempel ur lappen som sidan
  // räknar fram; det ändras med datan och har därför inget ljud. Talen förklaras som under
  // Statistik → Lagen (divisioner.js): ändras en lapp ska hans svar följa med.
  anslagSvar: ['Det ska jag tala om för dig.', 'Det är enklare än det ser ut.', 'Hör här, så ska jag förklara.'],
  anslag: {
    form: {
      forklaring: [[
        'Det är lagens fem senaste matcher, i alla tävlingar.',
        'V betyder vinst, O oavgjort och F förlust, och den senaste matchen står längst till vänster.',
        'Det är ställningen efter nittio minuter som räknas, så en match som avgjordes på straffar står som oavgjord.',
      ]],
      rad: [[
        'Formen visar hur det har gått, men inte vilka lag de har mött.',
        'Har de slagit tre bottenlag i rad säger raden inte så mycket, så titta på Starkast och Motståndet också.',
      ]],
    },
    skador: {
      forklaring: [[
        'Här står spelarna som saknas eller är osäkra i varje lag.',
        'Ett frågetecken efter namnet betyder att han kanske kan spela ändå.',
        'Är någon avstängd står det inom parentes efter namnet, och resten är skadade eller borta av andra skäl.',
        'De tre som har spelat mest står först, och talet efter plustecknet visar hur många fler som saknas.',
      ]],
      rad: [[
        'Räkna inte bara namnen.',
        'Det viktiga är om de som saknas brukar spela, och en ordinarie mittback väger tyngre än fem bänkspelare.',
      ]],
    },
    styrka: {
      forklaring: [[
        'Siffran är modellens bedömning av hur bra laget är.',
        'Den visar hur många mål laget i snitt skulle vinna med mot ett medelbra lag i samma serie, på neutral plan.',
        'Fotot visar omgångens starkaste lag, och på baksidan står de starkaste och de svagaste.',
      ]],
      rad: [[
        'Tidigt på säsongen ljuger tabellen.',
        'Den här siffran tar hänsyn till hur svåra motståndare lagen har mött, och därför tittar jag alltid på den först.',
      ]],
    },
    kryss: {
      forklaring: [[
        'Procenten visar hur stor chansen till oavgjort har varit i lagets matcher hittills, i snitt.',
        'Den räknas fram ur målchanserna som båda lagen har skapat, inte ur resultaten.',
        'Ett tursamt mål på tilläggstid ändrar alltså ingenting.',
      ], [
        'Ungefär var fjärde match slutar oavgjord, så runt 25 % är normalt.',
        'Lagen högt upp på lappen spelar jämna matcher med få chanser åt båda hållen.',
      ]],
      rad: [['När två lag från den här lappen möts funderar jag alltid på krysset.']],
    },
    tur: {
      forklaring: [[
        'Varje skott får ett värde efter hur ofta sådana skott brukar gå in.',
        'Det kallas xG, förväntade mål.',
        'Med båda lagens xG räknar man ut hur många poäng laget borde ha fått, och sedan jämför man med poängen det faktiskt tog.',
      ], [
        'Plus betyder att laget har tagit fler poäng än chanserna var värda, och det är tur.',
        'Minus betyder otur.',
      ]],
      rad: [[
        'Tur jämnar ut sig, det kan du skriva upp.',
        'Ett lag som står under Tur brukar tappa, och ett lag under Otur brukar komma igen.',
      ]],
    },
    odds: {
      forklaring: [[
        'Före varje match visar oddsen hur många poäng laget väntas ta.',
        'Siffran är lagets poäng hittills under säsongen minus de poäng som oddsen räknade med.',
        'Plus betyder att laget slår oddsen, och under Sviker står de som har tagit färre poäng än spelbolagen trodde.',
      ]],
      rad: [[
        'Spelbolagen är jävligt duktiga, så ett lag som slår oddsen har oftast haft tur eller blivit bättre under säsongen.',
        'Står laget dessutom under Tur på lappen bredvid är det mest tur.',
      ]],
    },
    vila: {
      forklaring: [[
        'Siffrorna visar hur många dagar som har gått sedan lagets förra match, i alla tävlingar.',
        'Skiljer det två dagar eller mer är det tröttare lagets siffra inringad.',
      ], [
        'Tre dagars vila mot en hel vecka märks under den sista halvtimmen, särskilt för ett lag som springer mycket.',
        'Mer än en veckas vila ger ingenting extra.',
      ]],
      // i stället för exemplet, när ingen match skiljer två dagar
      lugnt: 'I den här omgången skiljer det mindre än två dagar i alla matcher.',
      rad: [],
    },
    motstand: {
      forklaring: [[
        'Här ser du vilka lag som har haft svårast och lättast motstånd hittills.',
        'Man tar motståndarnas styrka enligt modellen och jämför med vad ett lag i serien möter i snitt, räknat i mål per match.',
        'Plus betyder tuffare motstånd än vanligt och minus lättare.',
      ]],
      rad: [[
        'Den som har haft det lätt står ofta för högt i tabellen och får det tyngre när svårare motstånd kommer.',
        'För den som har haft det tufft gäller det omvända.',
      ]],
    },
  },
});
