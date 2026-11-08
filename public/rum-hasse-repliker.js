// Det Hasse Backe (fiktiv) säger själv i tobaksaffären (rum-hasse.js), utan att
// någon AI är inblandad. Analysen av en match skrivs i förväg (src/analyser/hasse.mjs); här står
// allt runt omkring. Han lottar bland raderna, och inget av det här är ett faktum
// om en match eller en person, utom domarna över gänget, som fylls i ur protokollet. Skriv hela meningar med verb: "Vilken match?" och "Modigt."
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
// {du} dina tecken (etta och kryss), {Bada} tecknet ni båda har (Ettan), {res} resultatet (2–1),
// {ratt} och {av} hur många rätt han hade av hur många, i ord (två, sex), {antal} och {Antal} ett tal
// från två till tretton i ord (i domarna).
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
  // Talen i ord, för {ratt} och {av}.
  tal: ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv', 'tretton'],

  // När man kommer till honom.
  oppning: [
    'Vilken match ska jag hjälpa dig med?',
    'Vilken match har du kört fast på?',
    'Vilken match begriper du dig inte på?',
    'Peka på en match, så säger jag hur den slutar.',
    'Jag kan hela kupongen. Vilken match vill du börja med?',
    'Det här är en lätt kupong. Vilken match tar vi först?',
  ],
  oppningNamn: [
    'Vilken match ska jag hjälpa dig med?',
    'Vilken match har du kört fast på?',
    'Vilken match begriper du dig inte på?',
    'Peka på en match, så säger jag hur den slutar.',
    'Jag kan hela kupongen. Vilken match vill du börja med?',
    'Det här är en lätt kupong. Vilken match tar vi först?',
  ],
  // När man har varit här förut.
  tillbaka: [
    'Har du kört fast igen?',
    'Vilken match vill du ha hjälp med nu då?',
    'Är du här igen?',
    'Jag visste att du skulle komma tillbaka.',
    'Det gick väl inte så bra på egen hand.',
    'Jag sitter där jag satt.',
  ],
  tillbakaNamn: [
    'Har du kört fast igen, {namn}?',
    'Vilken match vill du ha hjälp med nu då, {namn}?',
    'Är du här igen, {namn}?',
    'Jag visste att du skulle komma tillbaka, {namn}.',
    'Det gick väl inte så bra på egen hand, {namn}.',
    'Jag sitter där jag satt, {namn}.',
  ],

  // Efter en analys.
  nasta: [
    'Vilken match tar vi nu?',
    'Vi tar nästa match.',
    'Är det någon mer match du undrar över?',
    'Vilken match är nästa?',
    'Så enkelt var det. Vilken match tar vi nu?',
    'Ge mig en svårare match, om du har någon.',
    'Jag har knappt hunnit bli varm. Vilken match tar vi nu?',
    'Då går vi vidare. Vilken match ska jag reda ut nu?',
  ],
  // ... när man har frågat om just så många matcher.
  antal: {
    3: ['Du har frågat om tre matcher. Kupongen börjar likna något.', 'Du har frågat om tre matcher. Du börjar lära dig.', 'Du har frågat om tre matcher. Det börjar sitta.', 'Du har frågat om tre matcher. Du ser redan klokare ut.'],
    5: ['Du har frågat om fem matcher. Du är nyfiken av dig.', 'Du har frågat om fem matcher. Jag borde ta betalt.'],
    8: ['Du har frågat om åtta matcher. Kaffet är varmt än.', 'Du har frågat om åtta matcher. Jag har inte tänkt än.'],
    10: ['Du har frågat om tio matcher. Du kan ta över min stol.', 'Du har frågat om tio matcher. Nu är det min kupong.'],
  },
  halva: ['Nu är halva kupongen klar.', 'Halva matcherna är klara. Resten är också enkla.', 'Vi har tagit halva kupongen. Det var den svåra halvan.', 'Nu är det halvlek på kupongen. Jag gör inga byten.'],
  enKvar: ['Nu är det en match kvar. Den är lika lätt som de andra.', 'Nu är det en match kvar. Den tar jag med vänster hand.', 'Nu är det en match kvar. Du har sparat den lättaste till sist.'],
  // ... när alla är klara, nyss och när man kommer tillbaka.
  alla: ['Nu är hela kupongen klar. Lämna in den.', 'Nu har vi tagit hela kupongen. Resten är en formsak.', 'Nu har vi tagit hela kupongen. Det var inte svårare än så.'],
  // ... när några matcher redan har börjat och du har frågat om alla de andra.
  allaKvar: ['Nu har du fått svar på alla matcher som återstår.', 'Nu vet du hur alla matcher som återstår slutar.'],
  allaIgen: ['Du har redan fått svar på alla matcher.', 'Du har redan fått svar på alla matcher. Du kunde ha lyssnat.', 'Alla matcher har du fått svar på. Du får lyssna nästa gång.', 'Du har redan frågat om alla matcher. Svaren står sig.'],

  // När alla matcher har börjat: hur det gick för honom (efterat i rum-hasse.js). Han tvivlar aldrig:
  // går det bra hade han rätt, och går det dåligt var det matcherna som hade fel. Först säger han ratt,
  // och sedan en rad ur listan för hur det gick. Efter en stund säger han fler rader ur samma lista.
  // Varje rad ska också gå att förstå ensam, och den ska kunna följa efter "Jag hade två rätt av sex."
  efter: {
    ratt: 'Jag hade {ratt} rätt av {av}.',
    // Allt satt.
    alla: [
      'Så här ska en kupong se ut.',
      'Alla matcher slutade som jag sa. Jag är inte förvånad.',
      'Jag har inget att tillägga om den här omgången.',
      'Nu har du sett hur det går till.',
      'Du behöver inte tacka mig för tipsen.',
      'Den här omgången tänker jag rama in.',
      'Ingen av matcherna överraskade mig.',
    ],
    // Fler rätt än chanserna var värda.
    bra: [
      'Vad var det jag sa?',
      'Facit stämde med mig. Det var bra för facit.',
      'Matcherna slutade som jag sa. Det brukar de göra.',
      'Jag sa hur det skulle gå. Det vill jag bara ha sagt.',
      'Den här omgången var inte svårare än så.',
      'Spelbolagen borde ha frågat mig.',
      'Spelbolagen hade fel, som vanligt.',
      'De matcher jag missade spelades fel.',
      'Nu vet du vem du ska fråga nästa gång.',
      'Det är orsak och verkan. Mer än så är det inte.',
      'Jag brukar inte skryta. Jag brukar inte behöva det.',
      'Det är ingen konst när man vet hur det ska gå.',
      'Det var jävligt bra tippat, om jag får säga det själv.',
    ],
    // Ungefär som chanserna var värda.
    mitten: [
      'Allt blev som jag sa, utom det som blev något annat.',
      'Där jag hade fel var det matchen som hade fel.',
      'Jag hade rätt där det gick att ha rätt.',
      'Några av lagen hade inte lyssnat på mig.',
      'De matcher jag missade spelades fel.',
      'Jag hade rätt, och några av lagen hade fel.',
      'Det går inte att gardera sig mot domarna.',
      'Jag räknar inte de matcher som spelades fel.',
      'Jag hade rätt även där det inte syntes.',
      'Facit och jag är inte helt överens än.',
      'Ett par av matcherna borde spelas om.',
    ],
    // Färre rätt än chanserna var värda.
    daligt: [
      'Analysen står jag för. Resultaten får lagen stå för.',
      'Tipsen var rätt. Det var matcherna som slutade fel.',
      'Spelarna hade inte läst mina analyser.',
      'Det är orsak och verkan, och orsaken är inte jag.',
      'Jag har haft fel en gång förut. Det här räknar jag inte.',
      'Lagen har en del att förklara efter den här omgången.',
      'Jag hade rätt. Verkligheten hade en dålig dag.',
      'Det var inget fel på mina tips. Det var fel på målen.',
      'Man måste låta spelbolagen vinna ibland.',
      'Jag gav lagen en chans, men de tog den inte.',
      'Jag sa hur det skulle gå, men lagen lyssnade inte.',
      'Fotbollen hade fel den här omgången.',
      'Efteråt är alla kloka. Jag var det redan före.',
      'Tipsen var rätt tänkta, och det är det som räknas.',
      'Mina tips var bättre än matcherna.',
      'Jag tänker inte be om ursäkt för andras misstag.',
      'Det är lagen som får förklara sig, inte jag.',
      'Domaren och gräsmattan har mycket att svara för.',
      'Omgången var ett blodbad. Jag var inte inblandad.',
    ],
    // Inget satt.
    inget: [
      'Alla matcher slutade fel. Det är mycket ovanligt.',
      'Noll rätt säger mer om matcherna än om mig.',
      'Noll rätt är svårare än man tror.',
      'Inte ett enda lag spelade som jag sa.',
      'Jag har aldrig sett en så felspelad omgång.',
      'Noll rätt ska ingen försöka göra efter mig.',
      'Tippa tvärtemot mig nästa gång, om du vågar.',
    ],
    // I tävlingen, när omgången är klar: bäst och sämst i gänget. Säger han i stället för första raden ovan.
    forst: [
      'Jag slog hela gänget. Det är inget att orda om.',
      'Gänget kan skriva av mig nästa gång. Det är ingen skam.',
      'Nu har gänget sett hur det går till.',
      'Gänget får gärna fråga hur jag bar mig åt.',
    ],
    sist: [
      'Att jag kom sist i gänget beror på matcherna.',
      'Jag kom sist i gänget, men jag tippade rätt.',
      'Någon måste komma sist i gänget. Jag ställde upp.',
      'Jag kom sist i gänget. Det säger mer om gänget.',
      'Gänget hade tur, och jag hade rätt.',
    ],
    // Han sa det exakta resultatet i en av matcherna i listan: det säger han efter en stund.
    exakt: [
      'Jag sa {res}, och matchen slutade {res}. Så är det bara.',
      'En match slutade {res}, precis som jag sa.',
      'En match slutade {res}. Jag sa det redan före avspark.',
    ],
    // Matcherna som räknas har inte slutat än.
    pagar: [
      'Matcherna pågår, men jag behöver inte titta.',
      'Jag vet redan hur matcherna slutar.',
      'Lagen spelar, och jag dricker mitt kaffe.',
      'Matcherna är bara en formsak nu.',
      'Du behöver inte titta. Jag har redan sagt hur det går.',
      'Matcherna spelas nu, men för mig är det repriser.',
      'Lagen spelar nu. Vi får se om de har lyssnat på mig.',
    ],
    // Du har valt att dölja resultat: inget här får avslöja hur det gick.
    dolt: [
      'Jag vet hur det gick, men du har valt att inte veta.',
      'Du har dolt resultaten, så jag säger ingenting.',
      'Hur det gick får du inte veta av mig.',
      'Jag säger inget om omgången. Jag ser alltid ut så här.',
      'Jag har lovat att hålla tyst om omgången.',
    ],
    // Du frågade inte om någon match, och han spelade inte själv.
    ofragad: [
      'Alla matcher har börjat. Du kunde ha frågat mig i tid.',
      'Du frågade inte om en enda match. Så kan man också göra.',
      'Nu är det för sent att fråga om den här omgången.',
      'Nästa omgång får du fråga mig i tid.',
      'Du klarade dig utan mig den här omgången. Hur gick det?',
      'Jag satt här hela omgången. Det var bara att fråga.',
    ],
  },

  // Efter omgången, så länge protokollet ligger på pulten (tills nästa Stryktips kommer): han dömer var och
  // en i gänget, en i taget (gangLista och doma i rum-hasse.js, läget i RumBlock.gang). Om sig själv säger
  // han inget här. En dom är en inledning med namnet, en eller två saker ur kupongen och ett slut, och
  // raderna väljs efter omgången och personen, så att domen är densamma varje gång och på alla enheter.
  // Varje rad är en mening, så att domen står i ett stycke och ändå går att läsa upp mening för mening. Inget
  // han eller hon: skriv namnet, eller om kupongen. Ordet i guld står i domord.
  domar: {
    // Över listan med gänget: första gången, när man har hört om några och när man har hört om alla.
    fraga: ['Jag har rättat omgången. Vem ska jag börja med?', 'Protokollet är klart. Vem vill du höra om först?', 'Jag har gått igenom gängets kuponger. Vem tar vi först?'],
    igen: ['Vem vill du höra om nu?', 'Vem i gänget ska jag ta nu?'],
    alla: ['Nu har du hört om hela gänget.', 'Det var hela gänget. Mer än så finns det inte att säga.'],
    // Över matcherna, med det han sa och hur de slutade.
    matcherna: ['Här är matcherna och hur de slutade.'],
    // Inledningen, efter hur det gick i gänget (forsakring har forst).
    in: {
      forst: ['{namn} var bäst i gänget, och det kommer vi att få höra.', '{namn} slog resten av gänget den här gången.'],
      alla: ['{namn} hade alla rätt.', '{namn} hade varenda match rätt.'],
      mitten: ['{namn} hamnade mitt i gänget, och ingen märkte det.', '{namn} kom varken först eller sist, och det är också en konst.'],
      sist: ['{namn} kom sist i gänget.', '{namn} var sämst i gänget.'],
      sistLika: ['{namn} hade lika många rätt som någon annan i gänget och kom ändå sist.'],
      inget: ['{namn} lämnade inte in någon kupong.'],
    },
    // Sakerna ur kupongen. Helgarderingarna sätts bara när alla satt.
    hel: {
      en: ['Det fanns en helgardering på kupongen, och den satt.'],
      fler: ['Det fanns {antal} helgarderingar på kupongen, och alla satt.'],
    },
    forsakring: ['Där de andra hade fel var det helgarderat.'],
    spik: {
      ingen: ['Det fanns inte en enda spik på kupongen.'],
      enda: ['Den enda spiken satt.'],
      endaInte: ['Den enda spiken satt inte.'],
      alla: ['Alla spikarna satt.'],
      inga: ['Inte en enda spik satt.'],
      en: ['En av spikarna satt.'],
      fler: ['{Antal} av spikarna satt.'],
    },
    ensam: {
      ingen: ['Allt som satt hade någon av de andra också.'],
      en: ['I en match hade ingen av de andra rätt.'],
      fler: ['I {antal} matcher hade ingen av de andra rätt.'],
    },
    // Slutet.
    ut: {
      forsakring: ['Det kallas gardering, inte kunskap.'],
      forst: ['Jag kallar det hela flyt, men det får man inte säga högt.', 'Det kommer att låta om segern vid pulten hela veckan.'],
      alla: ['Den kupongen hade jag kunnat fylla i själv.', 'Jag hade tippat likadant.'],
      mitten: ['En mittenplats är ingen skam, men ingen ära heller.', 'I mitten syns man inte, och det är nog lika bra.'],
      sist: ['Det krävs en viss talang för att komma sist.', 'Någon måste komma sist, och den här gången ställde {namn} upp.'],
      sistLika: ['Man måste ha rätt i rätt matcher, inte bara i många.'],
      inget: ['Den som inte tippar kan inte ha fel.'],
    },
  },
  // Ordet han slår i disken när han dömer någon i gänget, som domen över en match. Sägs inte.
  domord: { forsakring: 'Garderat', forst: 'Flyt', alla: 'Felfritt', mitten: 'Osynlig', sist: 'Talang', sistLika: 'Snöpligt', inget: 'Klokt' },

  // Om man bara står där och inte frågar.
  ledig: [
    'Jag sitter kvar här.',
    'Välj vilken match du vill. Alla är lätta.',
    'Ta god tid på dig. Jag har redan alla svaren.',
    'Spelstoppet är {dag}.',
    'Det kostar inget att fråga.',
    'Kaffet har kallnat. Svaren står sig.',
  ],

  // När man har valt en match: han svarar och frågar tillbaka. valLasa när analysen finns
  // och val när den inte finns. Han har alltid svaret, också när han inte har det.
  val: ['Den är solklar.', 'Den kan jag i sömnen.', 'Glöm allt du har läst.', 'Den är lättare än den ser ut.', 'Tur att du frågade.', 'Den ska du inte chansa på.'],
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
    'Den är lättare än den ser ut.',
    'Tur att du frågade.',
    'Den ska du inte chansa på.',
    'Den tog en halv kopp kaffe.',
    'Där frågade du rätt man.',
    'Den där är jävligt enkel.',
  ],
  fragaTillbaka: ['Vill du veta, eller ska du gissa?', 'Vill du ha svaret, eller gissar du?', 'Ska jag säga hur det går, eller gissar du?', 'Vill du ha rätt, eller vill du gissa?', 'Vill du veta hur den slutar, eller vill du bli överraskad?'],
  // Knappen som tar fram analysen: ditt svar, bredvid Jag fyller i själv (Jag gissar om kupongen inte går att fylla i).
  lar: ['Jag är idel öra', 'Tala om det för mig', 'Låt höra', 'Upplys mig'],
  // Trycker man på Jag fyller i själv eller Jag gissar.
  gissar: ['Då får du skylla dig själv.', 'Gissa du, det har gått förr.', 'Jag sitter kvar här när det har gått åt skogen.', 'Gör som du vill. Jag har rätt ändå.', 'Så där blir man av med pengar.'],

  // En match man redan har frågat om: det han sa står direkt, och han erbjuder sig att
  // titta på den igen, ödmjukt på sitt sätt (han tvivlar ju aldrig). erbjudNytt när
  // analysen har skrivits om sedan han sa det. Knappen under är "Titta igen".
  erbjud: [
    'Jag kan titta på den igen, om du vill. Jag är inte för fin för det.',
    'Ska jag titta på den en gång till? Det blir samma svar, men jag gör det gärna.',
    'Jag har haft fel en gång förut. Ska jag titta på den igen, för säkerhets skull?',
    'Jag kan titta på matchen igen, men jag brukar inte behöva det.',
    'Ska jag titta på matchen en gång till? Det blir lika rätt.',
  ],
  erbjudNytt: [
    'Tidningarna har skrivit mer om den sedan dess. Ska jag titta på den igen?',
    'Det har kommit nytt om den sedan jag sa det här. Vill du att jag tittar igen?',
    'Tidningarna har hunnit ikapp mig. Ska jag titta på matchen igen?',
  ],

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
    'Det slutar {res}, det kan du skriva upp.',
    'Matchen slutar {res}. Du behöver inte ens titta.',
  ],

  // Sist, om din egen kupong.
  kupong: {
    samma: ['På din kupong har du samma tecken som jag. Det är klokt.', 'På din kupong har du samma tecken som jag. Du har lärt dig något.', 'På din kupong har du samma tecken som jag. Då är vi två som har rätt.'],
    farre: ['På din kupong har du bara {du}. Det var kaxigt.', 'På din kupong har du bara {du}. Det kallar jag mod.'],
    fler: ['På din kupong har du {du}. Så många tecken behövs inte.', 'På din kupong har du {du}. Du garderar dig mot något som inte händer.'],
    korsar: ['{Bada} kan du behålla på din kupong, men stryk resten.', 'På din kupong har du {du}. {Bada} får du behålla.', 'På din kupong har du {du}. Hälften av det är rätt.'],
    skilda: [
      'På din kupong har du {du}, och det kan du glömma.',
      'På din kupong har du {du}. Den raden hade jag suddat.',
      'På din kupong har du {du}. Skriv av mig, det är ingen skam.',
      'På din kupong har du {du}. Där är vi inte överens, och du har fel.',
    ],
  },

  // Din kupong: han tar den och fyller i den (rum-hasse-kupong.js), antingen det du väljer eller det han
  // själv har sagt, när du har bett om det. foreslar: efter analysen, när du inte har något på raden
  // (knappen under är "Fyll i den"), hit: när han tar den, skriver: när det är gjort, gardera: när han
  // har skrivit flera.
  fyller: {
    foreslar: [
      'Så ska det stå på din kupong. Ska jag fylla i den?',
      'Jag skulle fylla i den direkt. Ska jag göra det åt dig?',
      'Nu vet du svaret. Ska jag fylla i den på din kupong?',
      'Nu har du facit. Ska jag fylla i raden åt dig?',
      'Jag har pennan här. Ska jag fylla i raden åt dig?',
      'Du har inte hunnit göra fel på den raden än. Ska jag fylla i den?',
    ],
    hit: ['Ge hit kupongen.', 'Ge mig kupongen.', 'Ge hit, så tar jag det.', 'Ge hit kupongen, så blir det rätt.'],
    // när kupongen inte vet vem du är: efternamnen står i rutornas ställe
    vem: 'Vems kupong ska jag fylla i?',
    skriver: {
      1: ['Det blir etta. Så är det bara.', 'Etta, det är självklart.', 'Hemmalaget vinner den. Mer än så är det inte.', 'Etta, och det är inget att diskutera.', 'Hemmalaget vinner matchen. Det ser ju en blind.'],
      X: ['Det blir kryss. Så är det bara.', 'Kryss, det är självklart.', 'Ingen vinner den. Mer än så är det inte.', 'Kryss, och det är inget att diskutera.', 'Det blir oavgjort. Det ser ju en blind.'],
      2: ['Det blir tvåa. Så är det bara.', 'Tvåa, det är självklart.', 'Bortalaget vinner den. Mer än så är det inte.', 'Tvåa, och det är inget att diskutera.', 'Bortalaget vinner matchen. Det ser ju en blind.'],
    },
    gardera: ['Nu är den garderad. Det är också ett svar.', 'Där har du den. Det är solklart.', 'Nu är raden garderad. Det gör jag för din skull.'],
    // du väljer det han sa, och du väljer något annat: då säger han emot, men kryssar det ändå
    medhall: ['Bra, du börjar lära dig.', 'Vad var det jag sa?', 'Där ser du.', 'Det är ett bra tecken. Jag valde det själv.', 'Det där är det klokaste du har gjort i dag.'],
    emot: [
      'Jag håller inte med, men det är din kupong.',
      'Fel tecken, men jag kryssar det.',
      'Jag kryssar, du betalar.',
      'Det är dina pengar, inte mina.',
      'Nej, nej, nej. Men det är din kupong, så jag fyller i det.',
      'Jag fyller i det, men du får säga att du gjorde det själv.',
      'Jag har inget med det där tecknet att göra.',
    ],
    suddar: ['Då suddar vi det.', 'Som om det aldrig hänt.', 'Då suddar jag det, så har ingen sett något.'],
    // Din inlämnade kupong: ändringen lämnas in när den följer gängets regel (4 spikar, 5 halvgarderingar
    // och 4 helgarderingar). Gör den inte det säger han vad som är för många och vad som fattas
    // (för-fattas, eller bara för när en match saknar tecken), och väntar med att lämna in den.
    regel: {
      'halv-hel': 'Nu har du för många halvgarderingar. Helgardera en av de andra, så lämnar jag in den.',
      'halv-spik': 'Nu har du för många halvgarderingar. Spika en av de andra, så lämnar jag in den.',
      'hel-halv': 'Nu har du för många helgarderingar. Halvgardera en av de andra, så lämnar jag in den.',
      'hel-spik': 'Nu har du för många helgarderingar. Spika en av de andra, så lämnar jag in den.',
      'spik-halv': 'Nu har du för många spikar. Halvgardera en av de andra, så lämnar jag in den.',
      'spik-hel': 'Nu har du för många spikar. Helgardera en av de andra, så lämnar jag in den.',
      halv: 'Nu har du för många halvgarderingar. Så lämnar jag inte in den.',
      hel: 'Nu har du för många helgarderingar. Så lämnar jag inte in den.',
      spik: 'Nu har du för många spikar. Så lämnar jag inte in den.',
    },
    // när den går ihop igen, och han lämnar in den
    inne: ['Nu går den ihop. Jag lämnar in den åt dig.', 'Nu stämmer den. Jag lämnar in den direkt.'],
    // när den inte gick att lämna in (den står kvar vid pulten, med Lämna in ändringen)
    fel: ['Maskinen vid kassan krånglar igen. Lämna in den vid pulten sedan.', 'Den gick inte igenom. Lämna in den vid pulten sedan.'],
  },

  // När något inte går.
  ingenKupong: 'Det finns ingen kupong än.',
  ejKlar: ['Den har jag inte kommit till än.', 'Den tar jag sen.', 'Den tar jag när jag har druckit upp kaffet.', 'Den sparar jag till sist.'],
  utanRost: 'Jag har tappat rösten. Läs här.',

  // Anslagstavlan (rum-anslag.js): med en lapp i handen ropar man till honom (Hasse, vad
  // betyder procenten?), och han svarar från baren, utanför bilden. Först en rad ur svar, sedan
  // förklaringen i stycken med en mening i taget, så att varje mening får sitt ljud. Mellan
  // förklaringen och rad (vad han själv gör med det) kommer ett exempel ur lappen som sidan
  // räknar fram; det ändras med datan och har därför inget ljud. Talen förklaras som under
  // Statistik → Lagen (divisioner.js): ändras en lapp ska hans svar följa med.
  anslagSvar: ['Det ska jag tala om för dig.', 'Det är enklare än det ser ut.', 'Hör här, så ska jag förklara.', 'Där frågade du rätt man.', 'Det ska jag förklara så att till och med du förstår.'],
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
