// Det Hasse Backe (fiktiv) säger själv i tobaksaffären (rum-hasse.js), utan att
// någon AI är inblandad. Analysen av en match skrivs i worker/hasse.mjs; här står
// allt runt omkring. Han lottar bland raderna, och inget av det här är ett faktum
// om en match eller en person. Raderna ska rymmas på en rad (ungefär 30 tecken),
// annars knuffar de ner matcherna under sig.
//
// {namn} ditt efternamn, {dag} när spelstoppet är (på lördag, i morgon, i dag),
// {du} dina tecken (etta och kryss), {bada} tecknen ni båda har.
window.HasseRepliker = {
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

  // Direkt när man har valt en match.
  reaktion: ['Den är enkel.', 'Bra att du frågar.', 'Den där, ja.', 'Den har jag tittat på.', 'Det är lugnt.', 'Den är inte svår.', 'Ja, den.', 'Den tar vi.'],
  // Samma match en gång till.
  igen: ['Den tog vi nyss.', 'Den har du redan fått.', 'Lyssnade du inte?'],

  // Medan analysen skrivs: en i taget, i den här ordningen. Allt under kontroll.
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
  fel: 'Den får vi ta en annan gång.',
  utanRost: 'Jag har tappat rösten. Här har du det i skrift.',
};
