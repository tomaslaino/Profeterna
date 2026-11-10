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
// {namn} det du kallas (efternamnet, Dogge för Johansson), {dag} när spelstoppet är (på lördag, i morgon, i dag),
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
    'Sätt dig ner. Vilken match vill du ha svar på?',
    'Vilken match skulle du ha haft fel på utan mig?',
    'Jag har redan tippat hela kupongen. Vad vill du veta?',
    'Vilken match oroar du dig för? Det behöver du inte.',
    'Välj en match, så slipper du tänka själv.',
    'Vilken match har du legat sömnlös över?',
    'Du ser bekymrad ut. Vilken match gäller det?',
    'Stryktipset är ingen konst. Vilken match tar vi först?',
    'Nu ska vi se. Vilken match har du svårast för?',
  ],
  oppningNamn: [
    'Vilken match ska jag hjälpa dig med?',
    'Vilken match har du kört fast på?',
    'Vilken match begriper du dig inte på?',
    'Peka på en match, så säger jag hur den slutar.',
    'Jag kan hela kupongen. Vilken match vill du börja med?',
    'Det här är en lätt kupong. Vilken match tar vi först?',
    'Sätt dig ner. Vilken match vill du ha svar på?',
    'Vilken match skulle du ha haft fel på utan mig?',
    'Jag har redan tippat hela kupongen. Vad vill du veta?',
    'Vilken match oroar du dig för? Det behöver du inte.',
    'Välj en match, så slipper du tänka själv.',
    'Vilken match har du legat sömnlös över?',
    'Du ser bekymrad ut. Vilken match gäller det?',
    'Stryktipset är ingen konst. Vilken match tar vi först?',
    'Nu ska vi se. Vilken match har du svårast för?',
  ],
  // När man har varit här förut.
  tillbaka: [
    'Har du kört fast igen?',
    'Vilken match vill du ha hjälp med nu då?',
    'Är du här igen?',
    'Jag visste att du skulle komma tillbaka.',
    'Det gick väl inte så bra på egen hand.',
    'Jag sitter där jag satt.',
    'Du klarade dig inte länge på egen hand.',
    'Alla kommer tillbaka till slut.',
    'Vad har du ställt till med nu?',
    'Vilket tecken har du ångrat nu?',
    'Du ser inte klokare ut än sist.',
    'Jag har inte ändrat mig medan du var borta.',
  ],
  tillbakaNamn: [
    'Har du kört fast igen, {namn}?',
    'Vilken match vill du ha hjälp med nu då, {namn}?',
    'Är du här igen, {namn}?',
    'Jag visste att du skulle komma tillbaka, {namn}.',
    'Det gick väl inte så bra på egen hand, {namn}.',
    'Jag sitter där jag satt, {namn}.',
    'Du klarade dig inte länge på egen hand, {namn}.',
    'Alla kommer tillbaka till slut, {namn}.',
    'Vad har du ställt till med nu, {namn}?',
    'Vilket tecken har du ångrat nu, {namn}?',
    'Du ser inte klokare ut än sist, {namn}.',
    'Jag har inte ändrat mig medan du var borta, {namn}.',
  ],
  // När man kommer och klockan säger något (tidNu i rum-hasse.js): strax före spelstopp (bradskar, alltid),
  // mitt i natten (natt), tidigt på morgonen (morgon) och sent på kvällen (kvall), då ibland i stället för
  // de vanliga. Raden står ovanför listan och får ta högst två rader (cirka 50 tecken).
  tid: {
    bradskar: [
      'Spelstoppet är snart. Vilken match tar vi först?',
      'Du har bråttom, inte jag. Vilken match gäller det?',
      'Du kommer i sista stund. Vilken match tar vi?',
      'Spelstoppet närmar sig. Vilken match tar vi?',
    ],
    natt: [
      'Du kan inte sova, ser jag. Vilken match gäller det?',
      'Svaren sover aldrig. Vilken match tar vi?',
      'Affären har stängt, men för dig sitter jag kvar.',
      'Jag sover inte när det finns en kupong kvar.',
    ],
    morgon: [
      'Du är tidigt ute. Vilken match har du vaknat med?',
      'Första koppen är den bästa. Vilken match tar vi?',
      'Jag har läst morgontidningen. Den har fel.',
    ],
    kvall: [
      'Det är sent. Vilken match håller dig vaken?',
      'Vi stänger snart. Vilken match vill du hinna med?',
      'På kvällen tippar man bäst. Vilken match tar vi?',
    ],
  },

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
    'Där satt den. Vilken match vill du ha svar på nu?',
    'Så ska en match läsas. Vilken tar vi nu?',
    'Skriv upp det där, så tar vi nästa match.',
    'Vilken match ska jag göra enkel åt dig nu?',
    'Du hänger med bra. Vilken match ska jag reda ut nu?',
    'Kaffet räcker till fler matcher. Vilken ska det bli?',
    'Jag har fler svar. Vilken match tar vi nu?',
    'Nej nej nej, vi är inte klara. Vilken match tar vi nu?',
    'Fråga på, det är gratis än så länge.',
  ],
  // ... när man har frågat om just så många matcher.
  antal: {
    3: ['Du har frågat om tre matcher. Kupongen börjar likna något.', 'Du har frågat om tre matcher. Du börjar lära dig.', 'Du har frågat om tre matcher. Det börjar sitta.', 'Du har frågat om tre matcher. Du ser redan klokare ut.'],
    4: ['Du har frågat om fyra matcher. Det här blir bra.', 'Du har frågat om fyra matcher. Du har börjat lyssna.'],
    5: ['Du har frågat om fem matcher. Du är nyfiken av dig.', 'Du har frågat om fem matcher. Jag borde ta betalt.', 'Du har frågat om fem matcher. Jag tar inte ens i.', 'Du har frågat om fem matcher. Det är klokt av dig.'],
    6: ['Du har frågat om sex matcher. Det här går ju bra.', 'Du har frågat om sex matcher. Du har börjat lita på mig.'],
    8: ['Du har frågat om åtta matcher. Kaffet är varmt än.', 'Du har frågat om åtta matcher. Jag har inte tänkt än.', 'Du har frågat om åtta matcher. Jag är knappt i gång.'],
    9: ['Du har frågat om nio matcher. Nu kan du inte sluta.', 'Du har frågat om nio matcher. Du gissar inte längre.'],
    10: ['Du har frågat om tio matcher. Du kan ta över min stol.', 'Du har frågat om tio matcher. Nu är det min kupong.', 'Du har frågat om tio matcher. Det hamnar på notan.'],
    11: ['Du har frågat om elva matcher. Det räcker till ett lag.', 'Du har frågat om elva matcher. Jag gör inga byten.'],
  },
  halva: [
    'Nu är halva kupongen klar.',
    'Halva matcherna är klara. Resten är också enkla.',
    'Vi har tagit halva kupongen. Det var den svåra halvan.',
    'Nu är det halvlek på kupongen. Jag gör inga byten.',
    'Nu är det halvlek på kupongen. Jag tar en klunk kaffe.',
    'Vi har tagit halva kupongen. Resten är en transportsträcka.',
    'Vi är halvvägs på kupongen, och jag har inte tagit i.',
  ],
  enKvar: [
    'Nu är det en match kvar. Den är lika lätt som de andra.',
    'Nu är det en match kvar. Den tar jag med vänster hand.',
    'Nu är det en match kvar. Du har sparat den lättaste till sist.',
    'Nu är det en match kvar. Sedan får du klara dig själv.',
    'Nu är det en match kvar. Den hade du nästan klarat själv.',
  ],
  // ... när alla är klara, nyss och när man kommer tillbaka.
  alla: [
    'Nu är hela kupongen klar. Lämna in den.',
    'Nu har vi tagit hela kupongen. Resten är en formsak.',
    'Nu har vi tagit hela kupongen. Det var inte svårare än så.',
    'Nu har vi tagit hela kupongen. Lagen kan börja spela.',
    'Nu har vi tagit hela kupongen. Jag tar en påtår.',
    'Nu har vi tagit hela kupongen. Du får gärna säga tack.',
  ],
  // ... när några matcher redan har börjat och du har frågat om alla de andra.
  allaKvar: [
    'Nu har du fått svar på alla matcher som återstår.',
    'Nu vet du hur alla matcher som återstår slutar.',
    'Alla matcher som återstår är avgjorda nu.',
    'Det finns inga fler matcher att fråga om. Jag tar en påtår.',
  ],
  allaIgen: [
    'Du har redan fått svar på alla matcher.',
    'Du har redan fått svar på alla matcher. Du kunde ha lyssnat.',
    'Alla matcher har du fått svar på. Du får lyssna nästa gång.',
    'Du har redan frågat om alla matcher. Svaren står sig.',
    'Du har frågat om alla matcher. Jag har inte ändrat mig.',
    'Du har redan fått svar på alla matcher. Vad väntar du på?',
    'Du har redan frågat om alla matcher. Nu får du väl gå hem.',
  ],

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
      'Spelbolagen kan stänga för dagen.',
      'Den här omgången borde tas upp på tränarutbildningen.',
      'Så blir det när man är organiserad.',
      'Facit har skrivit av mig.',
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
      'Så ser organisation ut.',
      'Den här omgången var bara uppvärmning.',
      'Felen la jag in så att det inte skulle se misstänkt ut.',
      'Fler rätt hade förstört spelet för alla andra.',
      'Så här går det när man läser på.',
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
      'Det som gick fel får lagen ta upp på nästa träning.',
      'Felen var domarens, men det säger jag inget om.',
      'Felen kan jag förklara, men du skulle inte förstå.',
      'Jag hade rätt i de matcher som betyder något.',
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
      'Det går inte att organisera bort en sådan omgång.',
      'Med rätt resultat hade jag haft alla rätt.',
      'Jag tar på mig ansvaret för allt som gick bra.',
      'Tipsen håller än. Det är resultaten som inte håller.',
      'Den som bara tittar på resultaten förstår ingenting.',
      'Jag ändrar ingenting till nästa omgång.',
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
      'Spelbolagen har skickat blommor.',
      'Alla matcher kan inte sluta rätt.',
      'Tecknen var genomtänkta, men inte matcherna.',
      'Det krävs organisation för att missa alla matcher.',
    ],
    // I tävlingen, när omgången är klar: bäst och sämst i gänget. Säger han i stället för första raden ovan.
    forst: [
      'Jag slog er allihop. Det är inget att orda om.',
      'Ni kan skriva av mig nästa gång. Det är ingen skam.',
      'Nu har ni sett hur det går till.',
      'Ni får gärna fråga hur jag bar mig åt.',
      'Ni tog i, och jag vann ändå.',
      'Ni har mycket att lära, men jag har tid.',
    ],
    sist: [
      'Att jag kom efter er beror på matcherna.',
      'Jag kom sist, men jag tippade rätt.',
      'Någon av oss måste komma sist. Jag ställde upp.',
      'Jag kom sist. Det säger mer om er.',
      'Ni hade tur, och jag hade rätt.',
      'Jag släppte förbi er för att det skulle bli spännande.',
      'Jag kom efter er, och jag är ensam om att ha tänkt.',
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
      'Jag har redan börjat titta på nästa omgång.',
      'Matcherna pågår, men för min del är de färdigspelade.',
      'Håll koll på resultaten, om du inte tror på mig.',
      'Lagen har fått veta hur det ska gå. Resten är deras sak.',
    ],
    // Du har valt att dölja resultat: inget här får avslöja hur det gick.
    dolt: [
      'Jag vet hur det gick, men du har valt att inte veta.',
      'Du har dolt resultaten, så jag säger ingenting.',
      'Hur det gick får du inte veta av mig.',
      'Jag säger inget om omgången. Jag ser alltid ut så här.',
      'Jag har lovat att hålla tyst om omgången.',
      'Du har valt att dölja resultaten, så jag håller käft.',
      'Fråga inte mig hur det gick, om du inte vill veta.',
      'Hur omgången gick ser du inte på mig.',
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

  // Medan matcherna pågår och ställningen syns (stallning i rum-hasse.js): först ratt, hur många av hans tecken
  // som sitter just nu, och sedan en rad för läget (alla, bra, mitten, daligt), som ska kunna följa efter
  // "Just nu har jag fyra rätt av sju." Sedan, då och då, ställningen i en match (leder eller lika) och en
  // kommentar: haller när hans tecken sitter (hallerLika också när det är hans kryss), emot och emotLika när
  // det inte gör det. Han tvivlar aldrig: står det fel är det matchen som har fel. Blir det mål medan man
  // sitter där säger han mal och sedan malBra (för honom, också när det fattas ett mål till), malLugn (emot, men
  // tecknet sitter ändå) eller malFel (tecknet sitter inte, och det fattas mer än förut). Kommentarerna sägs alltid efter ställningen.
  // {lag} är laget som leder, {mot} det andra, och {res} ställningen med ledarens mål först; i lika och mal
  // är {match} matchen med korta lagnamn och {res} som på kupongen. Ställningen sägs tyst.
  stallning: {
    ratt: ['Just nu har jag {ratt} rätt av {av}.'],
    alla: [
      'Allt går som jag har sagt.',
      'Lagen har läst min analys.',
      'Ingen match har överraskat mig än.',
      'Så ser det ut när man har gjort hemläxan.',
      'Spelbolagen har börjat svettas.',
    ],
    bra: [
      'Resten är bara en tidsfråga.',
      'Det går som planerat. Undantagen rättar sig.',
      'De andra matcherna rättar sig snart.',
      'Det ser ut som vanligt.',
    ],
    mitten: [
      'Matcherna är inte slut än.',
      'Det reder ut sig före slutsignalen.',
      'De svåra matcherna avgörs alltid sent.',
      'Det är slutresultatet som räknas, inte ställningen.',
    ],
    daligt: [
      'Fotboll spelas i nittio minuter. Jag tippar på slutresultatet.',
      'Domarna har inte sin bästa dag.',
      'Det är inte jag som spelar, det är lagen.',
      'Lagen har inte förstått vad som gäller än.',
      'Sådana här ställningar brukar inte hålla.',
    ],
    leder: ['{lag} leder med {res} mot {mot}.', '{lag} leder mot {mot} med {res}.'],
    lika: ['Det står {res} i {match}.', 'I {match} står det {res}.'],
    haller: [
      'Precis som jag sa.',
      'Det var inte svårt att räkna ut.',
      'Det är orsak och verkan.',
      'Ingen här är förvånad.',
      'Det kunde du ha läst i min analys.',
      'Så ser det ut när man har läst på.',
    ],
    hallerLika: ['Krysset sitter som det ska.', 'Där sitter krysset.', 'Kryss, som jag sa.', 'Båda lagen vet att det ska bli kryss.'],
    emot: [
      'Matchen är inte slut än.',
      'Det har ingen bett dem om.',
      'Det räknas inte förrän domaren blåser av.',
      'Domaren har inte förstått matchen.',
      'Jag tippar inte på ställningen mitt i matchen.',
      'De har inte läst min analys.',
    ],
    emotLika: [
      'Det här blir inget kryss.',
      'Någon gör mål till slut, och jag vet vem.',
      'Lagen har inte bestämt sig än.',
    ],
    mal: ['Mål i {match}. Det står {res}.'],
    malBra: [
      'Där kom målet jag väntade på.',
      'Det var bara en tidsfråga.',
      'Det går som jag har räknat ut.',
      'Målet kom när det skulle.',
      'Nu börjar matchen likna min analys.',
    ],
    malLugn: [
      'Det gör ingenting.',
      'Det målet hade jag räknat med.',
      'Ett mål hit eller dit spelar ingen roll.',
      'Det målet bjuder jag på. Tecknet sitter ändå.',
    ],
    malFel: [
      'Det ändrar ingenting.',
      'Det målet godkänner inte jag.',
      'Det målet hade inte jag dömt.',
      'Jag låtsas att jag inte såg det.',
    ],
  },

  // Radion på fönsterbänken hörs också hos honom (omRadion i rum-hasse.js): en gång per station säger han
  // något om den, i stället för en rad medan han väntar, och nickar med när det är musik. brus är när radion
  // står mellan stationerna. Varje rad sägs ensam, efter det han sa förut, så den ska säga vad den handlar om.
  // Inget om honom själv som inte går att veta: han är en riktig person. Högst två rader ovanför listan
  // (cirka 50 tecken).
  radio: {
    italo: [
      'Italodisco är bra musik att tippa till.',
      'Italodiscon håller takten i nittio minuter.',
      'Ett lag ska spela som italodisco, i samma takt.',
    ],
    guld: [
      'När den här låten kom hade lagen en backlinje.',
      'Åttiotalsmusik påminner mig om sunt förnuft.',
    ],
    rock: [
      'Rocken har för mycket gitarr och för lite ordning.',
      'Rocken låter som en engelsk match i november.',
    ],
    p1: [
      'P1 pratar om allt utom det som är viktigt.',
      'Lyssna du på P1. Jag har redan alla svaren.',
    ],
    p3: [
      'P3 spelar musik för folk som inte tippar.',
      'Jag lyssnar hellre på pennan mot kupongen än på P3.',
    ],
    p4g: [
      'Göteborgsradion vet vad organisation är.',
      'I Göteborg tippar man hemmaseger i alla väder.',
    ],
    rix: [
      'Rix FM är lika lättsmält som en etta på favoriten.',
      'Rix FM överraskar aldrig. Det gillar jag.',
    ],
    sport: [
      'Radion i Montevideo pratar fotboll på riktigt.',
      'Intensidá, verticalidá … Ursäkta. Back to basis.',
      'Organización förstår jag utan översättning.',
    ],
    talksport: [
      'I engelsk sportradio gissar de, men jag vet.',
      'På talkSPORT har de inte förstått sin egen liga.',
    ],
    caroline: [
      'Radio Caroline låter fortfarande som piratradio.',
      'Caroline sände utan tillstånd. Så ska man spika.',
    ],
    brus: [
      'Radion står mitt emellan, och det blir aldrig bra.',
      'Det där bruset låter som spelbolagens analyser.',
    ],
  },

  // Efter omgången, så länge protokollet ligger på pulten (tills nästa Stryktips kommer): han dömer var och
  // en i gänget, en i taget (gangLista och doma i rum-hasse.js, läget i RumBlock.gang). Om sig själv säger
  // han inget här. En dom är en inledning med namnet, en eller två saker ur kupongen och ett slut, och
  // raderna väljs efter omgången och personen, så att domen är densamma varje gång och på alla enheter.
  // Varje rad är en mening, så att domen står i ett stycke och ändå går att läsa upp mening för mening. Inget
  // han eller hon: skriv namnet, eller om kupongen. Till gruppen säger han ni och er, aldrig gänget: det är
  // bara ni som använder sidan. Ordet i guld står i domord, och namnen han nästan kan i felnamn.
  domar: {
    // Över listan med gänget: första gången, när man har hört om några och när man har hört om alla. Varje
    // fråga säger vad han har att ge (vad han tycker, sin bedömning, sin dom) och att det gäller en kupong,
    // innan den frågar vems: att han ska gå igenom kupongen och säga något om den vet man inte i förväg.
    // "Vem vill du höra om nu?" och "Jag gissar att du vill höra om din kupong" sa inte vad han skulle göra
    // (Tomas 2026-11-10). Högst tre rader i den smalaste telefonen.
    fraga: [
      'Jag har rättat era kuponger och har synpunkter på alla. Vems tar jag först?',
      'Jag har en bedömning av var och en av era kuponger. Vems vill du höra först?',
      'Jag säger gärna vad jag tycker om era kuponger. Vems ska jag börja med?',
      'Omgången är spelad, och jag har en dom över varje kupong. Vems tar vi först?',
      'Rödpennan har gått över era kuponger. Vems vill du höra min dom över?',
    ],
    igen: ['Vems kupong ska jag säga något om nu?', 'Vems kupong vill du höra min bedömning av nu?', 'Vems kupong ska jag döma nu?', 'Jag har synpunkter på fler kuponger. Vems tar vi nu?'],
    alla: ['Nu har jag dömt varenda kupong.', 'Nu har var och en av er fått sitt.', 'Alla era kuponger är dömda. Jag har sett bättre.', 'Det var alla era kuponger. Mer än så finns det inte att säga.'],
    // I stället för fraga och igen när han vet vem du är (den enheten står på) och du lämnade in: först
    // (ingen dömd än), hort (din kupong är dömd) och inte (andras är dömda men inte din). {namn} är ditt.
    du: {
      forst: [
        'Jag gissar att du vill veta vad jag tycker om din kupong, {namn}.',
        'Jag har synpunkter på varje kupong. Ska jag börja med din, {namn}?',
        'Jag kommenterar gärna era kuponger. Din först, {namn}, eller någon annans?',
        'Jag har dömt era kuponger. Vill du höra domen över din först, {namn}?',
        'Jag har en bedömning av din kupong, {namn}. Du gjorde i alla fall ditt bästa.',
      ],
      hort: [
        'Nu vet du vad jag tycker om din kupong. Ska jag ta någon annans?',
        'Din kupong har fått sin dom. Vems kupong ska jag döma nu?',
        'Du har hört min bedömning av din kupong. Vems vill du höra nu?',
        'Mer än så har jag inte att säga om din kupong. Vems ska jag döma nu?',
      ],
      inte: [
        'Jag har synpunkter på din kupong också, {namn}.',
        'Vill du höra vad jag tycker om din egen kupong nu, {namn}?',
        'Din kupong väntar fortfarande på min dom, {namn}.',
        'De andras domar hör du gärna, {namn}. Din kupong har jag också dömt.',
      ],
    },
    // Om man står kvar vid listan med gänget och inte väljer någon.
    ledig: [
      'Ingen av er har bett om ursäkt än.',
      'Ni brukar inte vilja höra mina domar.',
      'Jag har dömt bättre tippare än er.',
      'Trean har fortfarande inte bett om ursäkt.',
      'Protokollet ligger här, om någon vill överklaga.',
      'Mina domar går inte att överklaga.',
      'Jag dömer rättvist, och det är det som gör ont.',
      'Nästa kupong blir lika lätt som den här var.',
    ],
    // Med i ledig när någon vann på helgarderingar (forsakring), och när någon inte lämnade in. Vem han
    // menar säger han inte.
    revisorn: ['Revisorn har inte sagt ett ord i dag.', 'Revisorn har redan gått hem.'],
    borta: ['Semesterfiraren har inte hört av sig.'],
    // Inledningen, efter hur det gick i gänget (forsakring har forst).
    in: {
      forst: ['{namn} var bäst av er, och det kommer vi att få höra.', '{namn} slog resten av er den här gången.', '{namn} vann omgången, och ingen är mer förvånad än {namn}.'],
      alla: ['{namn} hade alla rätt.', '{namn} hade varenda match rätt.', '{namn} hade inte ett enda fel på kupongen.'],
      mitten: ['{namn} hamnade i mitten, och ingen av er märkte det.', '{namn} kom varken först eller sist, och det är också en konst.', '{namn} låg i mitten, där det är lä.'],
      sist: ['{namn} kom sist av er.', '{namn} var sämst av er.', '{namn} hade resten av er framför sig den här omgången.'],
      sistLika: ['{namn} kom sist trots lika många rätt som någon av er andra.', '{namn} hade lika många rätt som någon av er andra och kom ändå sist.'],
      inget: ['{namn} lämnade inte in någon kupong.', '{namn} stod över den här omgången.'],
    },
    // Sakerna ur kupongen. Helgarderingarna sätts bara när alla satt.
    hel: {
      en: ['Det fanns en helgardering på kupongen, och den satt.', 'Helgarderingen satt, och det är inte så konstigt.'],
      fler: ['Det fanns {antal} helgarderingar på kupongen, och alla satt.', 'Alla {antal} helgarderingarna satt, och det är inte så konstigt.'],
    },
    forsakring: ['Där de andra hade fel hade {namn} helgarderat.'],
    spik: {
      ingen: ['Det fanns inte en enda spik på kupongen.', 'Inte en enda match vågade {namn} spika.'],
      enda: ['Den enda spiken satt.', 'Kupongen hade en spik, och den satt.'],
      endaInte: ['Den enda spiken satt inte.', 'Kupongen hade en spik, och den höll inte.'],
      alla: ['Alla spikarna satt.', 'Varenda spik satt.', 'Spikarna höll allihop.'],
      inga: ['Inte en enda spik satt.', 'Ingen av spikarna höll.'],
      en: ['En av spikarna satt.', 'En av spikarna höll, och resten gick av.'],
      fler: ['{Antal} av spikarna satt.', '{Antal} av spikarna höll.'],
    },
    ensam: {
      ingen: ['Allt som satt hade någon av de andra också.', 'Det fanns ingen match där {namn} var ensam om att ha rätt.'],
      en: ['I en match hade ingen av de andra rätt.', 'I en match var {namn} ensam om att ha rätt.'],
      fler: ['I {antal} matcher hade ingen av de andra rätt.', 'I {antal} matcher var {namn} ensam om att ha rätt.'],
    },
    // Slutet.
    ut: {
      forsakring: ['Så kan man också köpa sig en seger.', 'Det kallas gardering, inte kunskap.'],
      forst: ['Jag kallar det hela flyt, men det får man inte säga högt.', 'Det kommer att låta om segern vid pulten hela veckan.', 'Att vinna ska {namn} inte vänja sig vid.', 'Nästa omgång ser vi vad segern var värd.'],
      alla: ['Den kupongen hade jag kunnat fylla i själv.', 'Jag hade tippat likadant.', 'En kupong ska ha alla rätt, det har jag alltid sagt.'],
      mitten: ['En mittenplats är ingen skam, men ingen ära heller.', 'I mitten syns man inte, och det är nog lika bra.', 'I mitten kan man sitta länge utan att någon frågar något.'],
      sist: ['Det krävs en viss talang för att komma sist.', 'Någon måste komma sist, och den här gången ställde {namn} upp.', 'Nästa omgång kan bara bli bättre, och det är det bästa jag kan säga.', 'Den kupongen ska vi inte prata mer om.'],
      sistLika: ['Man måste ha rätt i rätt matcher, inte bara i många.', 'Lätta rätt ger få poäng, och det vet alla utom {namn}.'],
      inget: ['Den som inte tippar kan inte ha fel.', 'Att inte lämna in är det säkraste jag har sett.', 'Att stå över är också ett sätt att spara pengar.'],
    },
  },
  // Ordet han slår i disken när han dömer någon i gänget, som domen över en match. Sägs inte. Det står
  // också ensamt under namnet i listan och ska därför beskriva personen: Garderad, inte Garderat.
  domord: { forsakring: 'Garderad', forst: 'Turlig', alla: 'Felfri', mitten: 'Osynlig', sist: 'Generös', sistLika: 'Snuvad', inget: 'Klok' },
  // Namnen han nästan kan. Ibland säger han ett av dem i stället för det riktiga, i domen (aldrig om den som
  // vann) och när han hälsar på dig (kallar i rum-hasse.js). Han rättar sig aldrig och säger inget om det.
  // Namnen vi kallas (Tippoang.kallas: efternamnen, Dogge för Johansson); rösten får dem också (src/rost.js).
  // Sägs inte som egna rader.
  felnamn: { Laino: ['Lainio', 'Leino'], Tejder: ['Tejler', 'Teider'], Dogge: ['Docke', 'Dugge'] },

  // Om man bara står där och inte frågar: han lottar bland raderna och säger en då och då, så de ska gå
  // att säga i vilken ordning som helst, och när det finns en match kvar att fråga om.
  ledig: [
    'Jag sitter kvar här.',
    'Välj vilken match du vill. Alla är lätta.',
    'Ta god tid på dig. Jag har redan alla svaren.',
    'Spelstoppet är {dag}.',
    'Det kostar inget att fråga.',
    'Kaffet har kallnat. Svaren står sig.',
    'Spelstoppet är {dag}, och jag är redan klar.',
    'Du tänker så det knakar. Det behövs inte.',
    'Läs inte hela listan. Jag har redan gjort det.',
    'Spelbolagen sitter och räknar. Jag dricker kaffe.',
    'Det finns inga svåra matcher, bara dåliga tippare.',
    'Tidningarna gissar, men jag vet.',
    'Du kan gissa själv också, men jag har sett hur det går.',
    'Cigarren håller längre än de flesta tränare.',
    'Utan organisation blir det ingenting. Så är det bara.',
    'Allt är orsak och verkan, också din kupong.',
    'Jag har sett bättre kuponger, men de var mina.',
    'Man blir inte klokare av att stirra på kupongen.',
    'Notan betalar jag med vinsten från kupongen.',
    'Jag väntar inte på dig. Jag sitter bara här.',
    'Alla frågar till slut. Du kan lika gärna göra det nu.',
    'Jag har inte ändrat mig om en enda match.',
    'Spelbolagen har aldrig frågat mig, och det märks.',
    'Här säljs cigarrer, kaffe och rätt svar.',
    'Kaffet här är dåligt, men tipsen är bra.',
    'Fotboll är inte svårt. Det är fotbollsspelare som är svåra.',
    'Den som tänker för mycket får fel.',
  ],

  // När man har valt en match: han svarar och frågar tillbaka. valLasa när analysen finns
  // och val när den inte finns. Han har alltid svaret, också när han inte har det.
  val: [
    'Den är solklar.',
    'Den kan jag i sömnen.',
    'Glöm allt du har läst.',
    'Den är lättare än den ser ut.',
    'Tur att du frågade.',
    'Den ska du inte chansa på.',
    'Den kan jag utantill.',
    'Den är redan avgjord.',
    'Den är inget att fundera på.',
    'Den tar jag på rutin.',
  ],
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
    'Den kan jag utantill.',
    'Den är redan avgjord.',
    'Den är inget att fundera på.',
    'Den tar jag på rutin.',
    'Den har jag spelat färdigt.',
    'Den räknar jag ut i huvudet.',
    'Den är som gjord för mig.',
    'Den hade jag hoppats på.',
    'Den får plats på en servett.',
    'Den borde du ha kunnat själv.',
    'Den ser man ju på långt håll.',
    'Glöm det du har hört om den.',
  ],
  fragaTillbaka: [
    'Vill du veta, eller ska du gissa?',
    'Vill du ha svaret, eller gissar du?',
    'Ska jag säga hur det går, eller gissar du?',
    'Vill du ha rätt, eller vill du gissa?',
    'Vill du veta hur den slutar, eller vill du bli överraskad?',
    'Ska jag tala om hur den slutar, eller vill du ha fel?',
    'Vill du ha mitt svar, eller litar du på ditt eget?',
    'Ska du ha svaret, eller ska du chansa?',
    'Ska jag säga som det är, eller vill du ha kvar hoppet?',
  ],
  // Om man inte svarar på frågan. Högst en rad (cirka 30 tecken), annars flyttar sig knapparna, och raden får
  // inte syfta på frågan: i telefonen syns den inte alltid.
  valVanta: ['Tänk du, jag har redan tänkt.', 'Du tänker för mycket.', 'Svaret ändras inte.', 'Avsparken väntar inte på dig.', 'Jag har svaret här.', 'Kaffet kallnar under tiden.'],
  // Knappen som tar fram analysen: ditt svar, bredvid Jag fyller i själv (Jag gissar om kupongen inte går att fylla i).
  lar: ['Jag är idel öra', 'Tala om det för mig', 'Låt höra', 'Upplys mig', 'Jag lyssnar', 'Säg hur det går'],
  // Trycker man på Jag fyller i själv eller Jag gissar.
  gissar: [
    'Då får du skylla dig själv.',
    'Gissa du, det har gått förr.',
    'Jag sitter kvar här när det har gått åt skogen.',
    'Gör som du vill. Jag har rätt ändå.',
    'Så där blir man av med pengar.',
    'Det är du som betalar.',
    'Jag sparar svaret tills du ångrar dig.',
    'Jag skulle inte göra så, men jag är inte du.',
    'Bra, då har jag något att skratta åt efter matchen.',
    'Spelbolagen tackar för din gissning.',
    'Då har spelbolagen fått en ny vän.',
  ],

  // En match man redan har frågat om: det han sa står direkt, och han erbjuder sig att
  // titta på den igen, ödmjukt på sitt sätt (han tvivlar ju aldrig). erbjudNytt när
  // analysen har skrivits om sedan han sa det. Knappen under är "Titta igen".
  erbjud: [
    'Jag kan titta på den igen, om du vill. Jag är inte för fin för det.',
    'Ska jag titta på den en gång till? Det blir samma svar, men jag gör det gärna.',
    'Jag har haft fel en gång förut. Ska jag titta på den igen, för säkerhets skull?',
    'Jag kan titta på matchen igen, men jag brukar inte behöva det.',
    'Ska jag titta på matchen en gång till? Det blir lika rätt.',
    'Jag kan titta på matchen igen, men jag hittar inga fel.',
    'Vill du att jag tittar igen? Det låter lika bra andra gången.',
    'Du får gärna be mig titta igen. Jag har kaffe kvar.',
  ],
  erbjudNytt: [
    'Tidningarna har skrivit mer om den sedan dess. Ska jag titta på den igen?',
    'Det har kommit nytt om den sedan jag sa det här. Vill du att jag tittar igen?',
    'Tidningarna har hunnit ikapp mig. Ska jag titta på matchen igen?',
    'Det har hänt saker runt matchen sedan jag sa det här. Ska jag titta igen?',
    'Tidningarna har upptäckt det jag sa. Ska jag titta på matchen igen?',
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
    'Det blir {res}, och då är jag jävligt snäll.',
    'Matchen slutar {res}. Den som säger något annat har inte tittat.',
    'Jag säger {res}, och det tänker jag inte ändra på.',
  ],

  // Sist, om din egen kupong.
  kupong: {
    samma: ['På din kupong har du samma tecken som jag. Det är klokt.', 'På din kupong har du samma tecken som jag. Du har lärt dig något.', 'På din kupong har du samma tecken som jag. Då är vi två som har rätt.', 'På din kupong har du samma tecken som jag. Vem har du frågat?', 'På din kupong har du samma tecken som jag. Det finns hopp för dig.'],
    farre: ['På din kupong har du bara {du}. Det var kaxigt.', 'På din kupong har du bara {du}. Det kallar jag mod.', 'På din kupong har du bara {du}. Du har mer mod än förstånd.'],
    fler: ['På din kupong har du {du}. Så många tecken behövs inte.', 'På din kupong har du {du}. Du garderar dig mot något som inte händer.', 'På din kupong har du {du}. Du litar inte på mig än.'],
    korsar: ['{Bada} kan du behålla på din kupong, men stryk resten.', 'På din kupong har du {du}. {Bada} får du behålla.', 'På din kupong har du {du}. Hälften av det är rätt.', 'På din kupong har du {du}. {Bada} har du från mig, men det andra får du stå för själv.'],
    skilda: [
      'På din kupong har du {du}, och det kan du glömma.',
      'På din kupong har du {du}. Den raden hade jag suddat.',
      'På din kupong har du {du}. Skriv av mig, det är ingen skam.',
      'På din kupong har du {du}. Där är vi inte överens, och du har fel.',
      'På din kupong har du {du}. Det har du inte fått av mig.',
      'På din kupong har du {du}. Den raden låtsas jag att jag inte såg.',
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
      'Nu vet du hur det går. Ska jag fylla i raden åt dig?',
      'Den här raden står tom. Ska jag fylla i den?',
      'En tom rad vinner ingenting. Ska jag fylla i den?',
    ],
    hit: ['Ge hit kupongen.', 'Ge mig kupongen.', 'Ge hit, så tar jag det.', 'Ge hit kupongen, så blir det rätt.', 'Ge hit kupongen, så slipper du göra fel.', 'Hit med kupongen, så ska du få se.'],
    // när kupongen inte vet vem du är: efternamnen står i rutornas ställe
    vem: 'Vems kupong ska jag fylla i?',
    skriver: {
      1: ['Det blir etta. Så är det bara.', 'Etta, det är självklart.', 'Hemmalaget vinner matchen. Mer än så är det inte.', 'Etta, och det är inget att diskutera.', 'Hemmalaget vinner matchen. Det ser ju en blind.', 'Etta, och då är jag snäll mot bortalaget.', 'Det blir etta. Bortalaget kan stanna hemma.'],
      X: ['Det blir kryss. Så är det bara.', 'Kryss, det är självklart.', 'Ingen vinner matchen. Mer än så är det inte.', 'Kryss, och det är inget att diskutera.', 'Det blir oavgjort. Det ser ju en blind.', 'Kryss, och då är jag snäll mot båda lagen.', 'Det blir kryss. Båda lagen får skylla sig själva.'],
      2: ['Det blir tvåa. Så är det bara.', 'Tvåa, det är självklart.', 'Bortalaget vinner matchen. Mer än så är det inte.', 'Tvåa, och det är inget att diskutera.', 'Bortalaget vinner matchen. Det ser ju en blind.', 'Tvåa, och då är jag snäll mot hemmalaget.', 'Det blir tvåa. Hemmalaget får ingen hjälp av publiken.'],
    },
    gardera: ['Nu är den garderad. Det är också ett svar.', 'Där har du den. Det är solklart.', 'Nu är raden garderad. Det gör jag för din skull.', 'Nu är raden garderad. Jag brukar inte behöva det, men du brukar.'],
    // du väljer det han sa, och du väljer något annat: då säger han emot, men kryssar det ändå
    medhall: ['Bra, du börjar lära dig.', 'Vad var det jag sa?', 'Där ser du.', 'Det är ett bra tecken. Jag valde det själv.', 'Det där är det klokaste du har gjort i dag.', 'Du har läst på, ser jag.', 'Det tecknet känner jag igen.', 'Du gör som jag säger. Fortsätt med det.', 'Där har du ett klokt tecken.'],
    emot: [
      'Jag håller inte med, men det är din kupong.',
      'Fel tecken, men jag kryssar det.',
      'Jag kryssar, du betalar.',
      'Det är dina pengar, inte mina.',
      'Nej, nej, nej. Men det är din kupong, så jag fyller i det.',
      'Jag fyller i det, men du får säga att du gjorde det själv.',
      'Jag har inget med det där tecknet att göra.',
      'Jag fyller i det, men jag tänker inte skriva under.',
      'Du får ditt tecken, och jag får ha rätt.',
      'Det där tecknet är ditt, och det får du behålla.',
      'Jag blundar och kryssar i det.',
    ],
    suddar: ['Då suddar vi det.', 'Som om det aldrig hänt.', 'Då suddar jag det, så har ingen sett något.', 'Då suddar jag det. Pennan har sudd i andra änden.', 'Det där tecknet har aldrig funnits.'],
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
    inne: ['Nu går den ihop. Jag lämnar in den åt dig.', 'Nu stämmer den. Jag lämnar in den direkt.', 'Nu går kupongen ihop. Jag lämnar in den innan du ångrar dig.'],
    // när den inte gick att lämna in (den står kvar vid pulten, med Lämna in ändringen)
    fel: ['Maskinen vid kassan krånglar igen. Lämna in den vid pulten sedan.', 'Den gick inte igenom. Lämna in den vid pulten sedan.'],
  },

  // När något inte går.
  ingenKupong: 'Det finns ingen kupong än.',
  ejKlar: ['Den har jag inte kommit till än.', 'Den tar jag sen.', 'Den tar jag när jag har druckit upp kaffet.', 'Den sparar jag till sist.', 'Den är så lätt att jag inte har brytt mig om den än.', 'Den ska jag titta på när tidningarna har slutat gissa.', 'Den får ligga till sig en stund.'],
  utanRost: 'Jag har tappat rösten. Läs här.',

  // Anslagstavlan (rum-anslag.js) och protokollet (rum.js): med en lapp eller protokollet framme
  // ropar man till honom (Hasse, vad betyder procenten?), och han svarar från baren, utanför bilden
  // (rum-hasse-svar.js). Först en rad ur ropSvar, sedan förklaringen i stycken med en mening i taget,
  // så att varje mening får sitt ljud. Mellan förklaringen och rad (vad han själv gör med det) kommer
  // ett exempel som sidan räknar fram; det ändras med datan och har därför inget ljud. Talen på
  // lapparna förklaras som under Statistik → Lagen (divisioner.js), och poängen som i tippoang.js:
  // ändras en lapp eller poängen ska hans svar följa med.
  ropSvar: ['Det ska jag tala om för dig.', 'Det är enklare än det ser ut.', 'Hör här, så ska jag förklara.', 'Där frågade du rätt man.', 'Det ska jag förklara så att till och med du förstår.', 'Det trodde jag att alla visste.', 'Jag trodde att du skulle fråga något svårt.', 'Det där frågar bara den som aldrig har tippat.'],
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
  // Protokollet (Hasse, hur räknas poängen?): raden Poäng längst ner, som i tippoang.js. Exemplet
  // (RumBlock.exempel) står mellan förklaringen och rad.
  protokoll: {
    forklaring: [[
      'Antalet rätt säger bara hur ofta du hade rätt, inte hur svårt det var.',
      'Det är det poängen gör.',
    ], [
      'För varje match får du en poäng om tipset satt, och från den drar jag datorns chans för det du tippade.',
      'En favorit på 70 % ger alltså 0,3 om den vinner och kostar 0,7 om den inte gör det.',
      'En skräll på 20 % ger 0,8 om den sitter och kostar bara 0,2 om den spricker.',
      'Garderar du läggs chanserna ihop, så en helgardering ger alltid noll.',
    ], [
      'Den som inte vet mer än datorn hamnar runt noll, vad den än tippar.',
      'Plus betyder att du tippade bättre än datorn, och minus att du tippade sämre.',
    ]],
    rad: [[
      'Rätt kan vem som helst få med tillräckligt många garderingar.',
      'Poängen visar vem som faktiskt kan tippa, och därför ringar jag in den som har högst.',
    ]],
  },
});
