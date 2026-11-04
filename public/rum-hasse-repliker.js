// Det Hasse Backe (fiktiv) säger själv i tobaksaffären (rum-hasse.js), utan att
// någon AI är inblandad. Analysen av en match skrivs i förväg (src/analyser/hasse.mjs); här står
// allt runt omkring. Han lottar bland raderna, och inget av det här är ett faktum
// om en match eller en person. Raderna ska rymmas på en rad (ungefär 30 tecken),
// annars knuffar de ner matcherna under sig.
//
// {namn} ditt efternamn, {dag} när spelstoppet är (på lördag, i morgon, i dag),
// {du} dina tecken (etta och kryss), {bada} tecknen ni båda har, {res} resultatet (2–1).
//
// Raderna hörs: Macen tar fram ljudet till dem med fälten ifyllda
// (src/analyser/rost.mjs), så filen är både ett skript i sidan
// (window.HasseRepliker) och en modul för Node. lar är knappar och sägs inte.
(function (repliker) {
  if (typeof module === 'object' && module.exports) module.exports = repliker;
  else window.HasseRepliker = repliker;
})({
  // När man kommer till honom.
  oppning: ['Nå. Vilken match?', 'Säg en match.', 'Vilken match förstår du inte?', 'Jag har svaret. Vilken match?', 'Fråga på. Vilken match?'],
  oppningNamn: ['Nå, {namn}. Vilken match?', '{namn}. Vilken match?', 'Säg en match, {namn}.'],
  // När man har varit här förut.
  tillbaka: ['Du igen. Vilken match?', 'Tillbaka. Vilken match?', 'Fler frågor?'],
  tillbakaNamn: ['{namn} igen. Vilken match?', 'Tillbaka, {namn}?'],

  // Efter en analys.
  nasta: ['Nästa.', 'Vilken mer?', 'Fråga på.', 'Vidare.'],
  // ... när man har frågat om just så många matcher.
  antal: {
    3: 'Tre stycken. Du lär dig.',
    5: 'Fem stycken. Du är nyfiken.',
    10: 'Tio. Snart kan du ta över här.',
  },
  halva: 'Halva kupongen är löst.',
  enKvar: 'En kvar. Den är också enkel.',
  // ... när alla är klara, nyss och när man kommer tillbaka.
  alla: 'Klart. Nu kan det inte gå fel.',
  allaIgen: 'Du har fått alla. Lyssna bättre.',

  // Om man bara står där och inte frågar.
  ledig: ['Jag har tid.', 'Ta den översta. Den är enkel.', 'Spelstoppet är {dag}.'],

  // När man har valt en match: han svarar och frågar tillbaka. valKlar när man redan
  // har frågat om den, valLasa när analysen finns och han ska låtsas läsa på, och val när
  // den inte finns. Han har alltid svaret, också när han inte har det: att han läser på
  // märks först när han väntar (vantar).
  val: ['Den är enkel.', 'Den där, ja.', 'Den är inte svår.'],
  valKlar: ['Den har jag tittat på.', 'Den har jag svaret på.', 'Den är redan löst.'],
  valLasa: [
    'Den har jag svaret på.',
    'Den har jag redan klar för mig.',
    'Den vet jag allt om.',
    'Den har jag räknat på.',
    'Den knäckte jag i morse.',
    'Den har jag på en lapp här.',
    'Den pratade vi om i går kväll.',
    'Den är solklar.',
  ],
  fragaTillbaka: ['Vill du veta, eller ska du gissa?', 'Vill du ha svaret, eller gissar du?', 'Ska jag säga det, eller gissar du?'],
  // Knappen som tar fram analysen: ditt svar, bredvid Jag gissar.
  lar: ['Lär mig', 'Jag lyssnar och lär', 'Upplys mig'],
  // Trycker man på Jag gissar.
  gissar: ['Modigt. Vilken mer?', 'Det har gått förr. Vilken mer?', 'Gissa på. Vilken mer?', 'Det är din kupong. Nästa.'],
  // Direkt när man har bett om analysen.
  reaktion: ['Bra att du frågar.', 'Det är lugnt.', 'Ja, den.', 'Den tar vi.'],
  // Samma match en gång till.
  igen: ['Den tog vi nyss.', 'Den har du redan fått.', 'Lyssnade du inte?'],

  // Medan han låtsas analysera: en i taget, i den här ordningen. Allt under kontroll.
  vantar: [
    'Jag ska bara titta på en sak.',
    'Vi börjar bakifrån.',
    'Bra analys tar sin tid.',
    'Jag läser vad de skriver.',
    'Det är mest fel.',
    'Total kontroll.',
    'Du har väl inte bråttom?',
    'Spelstoppet är {dag}.',
    'Det här är helt normalt.',
    'Orsak och verkan tar en stund.',
    'Jag har sett det förr.',
    'Lugn nu.',
    'Det är ingen fara.',
    'Det är lugnt.',
  ],

  // Trycker man på Ja, ja mitt i.
  avbruten: ['Som du vill.', 'Läs själv, då.', 'Det är lugnt. Du får läsa själv.'],

  // Direkt efter domen, när han har helgarderat: han har ju alltid svar.
  helgardera: 'Det är också ett svar.',

  // Efter texten: vad matchen slutar, hemma–borta. Resultatet är det troligaste i modellens
  // prognos bland tecknen han har ringat in (resultatet i rum-hasse.js).
  resultat: ['Det slutar {res}.', 'Det blir {res}. Skriv upp det.', 'Jag säger {res}. Inget mer med det.', 'Slutresultat {res}. Det är bara att vänta.'],

  // Sist, om din egen kupong.
  kupong: {
    samma: ['Det har du också. Då kan det inte gå fel.', 'Samma som du har. Du har lärt dig något.'],
    farre: ['Du har bara {du}. Modigt.', 'Du har {du} och inget mer. Modigt.'],
    fler: ['Du har {du}. Det behövs inte.', 'Du har {du}. Det är ett sätt att slippa bestämma sig.'],
    korsar: ['Du har {du}. {Bada} får du behålla.'],
    skilda: ['Du har {du}. Det är din kupong. Och dina pengar.', 'Du har {du}. Det får stå för dig.'],
    tom: ['Du har inget på den här än. Nu vet du vad du ska skriva.'],
  },

  // När något inte går.
  ingenKupong: 'Ingen kupong än. Det är lugnt.',
  igang: 'Efteråt kan alla ha rätt.',
  ejKlar: ['Den tar jag sen.', 'Inte än. Fråga mig sen.', 'Den har jag inte läst än.'],
  utanRost: 'Jag har tappat rösten. Här har du det i skrift.',
});
