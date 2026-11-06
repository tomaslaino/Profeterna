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

  // När man har valt en match: han svarar och frågar tillbaka. valKlar när man redan
  // har frågat om den, valLasa när analysen finns och han ska låtsas läsa på, och val när
  // den inte finns. Han har alltid svaret, också när han inte har det: att han läser på
  // märks först när han väntar (vantar).
  val: ['Den är solklar.', 'Den kan jag i sömnen.', 'Glöm allt du har läst.'],
  valKlar: ['Den har jag tittat på.', 'Den har jag svaret på.', 'Den är redan klar.'],
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
  // Samma match en gång till.
  igen: ['Du får samma svar som nyss.', 'Den tog vi ju nyss.'],

  // Medan han låtsas analysera: en i taget, i den här ordningen. Allt under kontroll.
  vantar: [
    'Jag ska bara titta på en sak.',
    'Jag läser tidningarna.',
    'Tidningarna har fel, som vanligt.',
    'Det här får ta sin tid.',
    'Du har väl inte bråttom?',
    'Spelstoppet är {dag}.',
    'Allt är orsak och verkan, alltså.',
    'Det här har jag sett förut.',
    'Ta det bara lugnt.',
    'Jag har full kontroll.',
    'Det är ingen fara.',
    'Man ska inte stressa fram ett tips.',
    'Jag är strax klar.',
    'Allt är under kontroll.',
  ],

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
    skilda: ['På din kupong har du {du}, och det kan du glömma.', 'På din kupong har du {du}, och det är dina pengar.'],
    tom: ['Du har inte fyllt i den här matchen än. Nu vet du vad du ska sätta.'],
  },

  // När något inte går.
  ingenKupong: 'Det finns ingen kupong än.',
  igang: 'Matcherna har redan börjat. Efteråt är alla kloka.',
  ejKlar: ['Den har jag inte kommit till än.', 'Den tar jag sen.'],
  utanRost: 'Jag har tappat rösten. Läs här.',
});
