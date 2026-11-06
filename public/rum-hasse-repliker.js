// Det Hasse Backe (fiktiv) säger själv i tobaksaffären (rum-hasse.js), utan att
// någon AI är inblandad. Analysen av en match skrivs i förväg (src/analyser/hasse.mjs); här står
// allt runt omkring. Han lottar bland raderna, och inget av det här är ett faktum
// om en match eller en person. Skriv hela meningar med verb: "Vilken match?" och "Modigt."
// är avhuggna på ett sätt som svenskan inte tål. Varje rad ska också gå att förstå ensam:
// "den" och "det" får bara syfta på matchen man just har valt, annars skrivs det ut vad
// det gäller ("Vilken match vill du ha hjälp med?", inte "Vilken match är det?"). Över
// matchlistan finns alltid plats för två rader (ungefär 30 tecken var i ett fönster 1440
// brett och i telefonen), så att listan står still vad han än säger.
//
// {namn} ditt efternamn, {dag} när spelstoppet är (på lördag, i morgon, i dag),
// {du} dina tecken (etta och kryss), {Bada} tecknen ni båda har, {res} resultatet (2–1).
//
// Raderna hörs: Macen tar fram ljudet till dem med fälten ifyllda
// (src/rost.js), så filen är både ett skript i sidan
// (window.HasseRepliker) och en modul för Node. lar är knappar och sägs inte.
(function (repliker) {
  if (typeof module === 'object' && module.exports) module.exports = repliker;
  else window.HasseRepliker = repliker;
})({
  // När man kommer till honom.
  oppning: ['Vilken match ska jag hjälpa dig med?', 'Vilken match har du kört fast på?'],
  oppningNamn: ['Vilken match ska jag hjälpa dig med?', 'Vilken match har du kört fast på?'],
  // När man har varit här förut.
  tillbaka: ['Har du kört fast igen?', 'Vilken match vill du ha hjälp med nu då?'],
  tillbakaNamn: ['Har du kört fast igen, {namn}?', 'Vilken match vill du ha hjälp med nu då, {namn}?'],

  // Efter en analys.
  nasta: ['Vilken match tar vi nu?', 'Vi tar nästa match.', 'Är det någon mer match du undrar över?'],
  // ... när man har frågat om just så många matcher.
  antal: {
    3: 'Du har frågat om tre matcher. Kupongen börjar likna något.',
    5: 'Du har frågat om fem matcher. Du är nyfiken av dig.',
    10: 'Du har frågat om tio matcher. Du kan ta över min stol.',
  },
  halva: 'Nu är halva kupongen klar.',
  enKvar: 'Nu är det en match kvar. Den är lika lätt som de andra.',
  // ... när alla är klara, nyss och när man kommer tillbaka.
  alla: 'Nu är hela kupongen klar. Lämna in den.',
  allaIgen: 'Du har redan fått svar på alla matcher.',

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
  resultat: ['Det blir {res}, så är det bara.', 'Det blir {res}, det är solklart.', 'Det slutar {res}.'],

  // Sist, om din egen kupong.
  kupong: {
    samma: ['På din kupong har du samma tecken som jag. Det är klokt.'],
    farre: ['På din kupong har du bara {du}. Det var kaxigt.'],
    fler: ['På din kupong har du {du}. Så många tecken behövs inte.'],
    korsar: ['{Bada} kan du behålla på din kupong, men stryk resten.'],
    skilda: ['På din kupong har du {du}, och det kan du glömma.'],
  },

  // När något inte går.
  ingenKupong: 'Det finns ingen kupong än.',
  ejKlar: ['Den har jag inte kommit till än.', 'Den tar jag sen.'],
  utanRost: 'Jag har tappat rösten. Läs här.',
});
