'use strict';

// ============================================================================
// Tidningen inför omgången (användarens önskan 2026-11-09): en notis per match i
// gängets omgång, oftast Stryktipsets tretton, om hur lagen har det just nu –
// skador, tränarens ord, sviter, det som har hänt i klubben. Hasse Backe läser den
// i tobaksaffären.
//
// Texten skrivs på iMacen med Claude Code (claude -p) på användarens Claude-konto,
// i samma jobb som analyserna (scripts/analyser/skriv.mjs, src/analyser/tidning.mjs),
// och inte med API-nycklar. Sajten visar bara den färdiga texten ur
// data/tidning.json och anropar aldrig någon språkmodell.
//
// Ett anrop per omgång och tid: hela sidan skrivs på en gång, så att omgången
// kostar ett anrop och inte tretton.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  // Bara söka och läsa på nätet, som analyserna.
  tools: ['WebSearch', 'WebFetch'],
  timeoutMs: 600000,

  // När sidan skrivs om, i svensk tid (dag: 0 = söndag, 1 = måndag …). En ny omgång utan
  // tidning får sin direkt, oftast måndag strax efter 16, och sedan skrivs den om en gång,
  // fredag inför helgen: två gånger per omgång (användarens beslut 2026-11-10; före det
  // också måndag 17). Samma klockslag som analysernas, så att launchd-jobbet redan startar då.
  tider: [
    { dag: 5, kl: '16:00' },
  ],
  // En tid skriver inte om en sida som är yngre än så här (en omgång som kom fredag
  // förmiddag och fick sin tidning då skrivs inte om redan kl. 16).
  minstTimmar: 12,
  // Har supporterpoddarna gett nya uppgifter (scripts/tidning/poddar.mjs) skrivs sidan om,
  // men inte oftare än så här. null: aldrig för poddarnas skull, bara på tiderna ovan, och
  // då följer uppgifterna med (användarens beslut 2026-11-10; före det 6).
  poddTimmar: null,

  // Gränserna i prompten.
  sokningar: 12,
  sidor: 4,
  // Notisens text, i ord. Kontrollen godtar lite mer åt båda hållen.
  ord: [40, 70],
  rubrikOrd: 7,
  // Så stor del av omgångens matcher måste ha en godkänd notis för att sidan ska
  // sparas; annars ligger den gamla kvar.
  minstAndel: 0.6,

  // Står i filen. Byts den skrivs tidningen för omgången om vid nästa körning.
  promptVersion: '2026-11-10.3',

  systemPrompt: `Du skriver en sida i en svensk morgontidning, med Svenska Dagbladets och Dagens Nyheters sakliga ton: inför veckans tipsmatcher. Läsarna tippar Stryktipset och vill veta hur lagen i omgångens matcher har det just nu.

Du får omgångens matcher som JSON, numrerade som på kupongen, med tabelläget, formen, schemat och skadelistan.

Sök och läs på nätet först, med högst {sokningar} sökningar och högst {sidor} öppnade sidor: det senaste om lagen – skador och avstängningar, vad tränaren har sagt, ett tränarbyte, en svit, något som har hänt i klubben. Sök gärna på flera lag i samma sökning. Läs inte spelbolag och tipssajter.

Underlaget kan också ha uppgifter ur lagens supporterpoddar, under "ur supporterpoddarna": avsnitt som tidningen har lyssnat igenom den här veckan. Det är det läsarna inte hittar på annat håll. Finns det sådana uppgifter om en match ska den mest intressanta bära notisen, före det som står i de vanliga källorna, och det ska stå vem som säger det ("enligt supporterpodden …"). Varje uppgift har ett slag: det som är "bekräftat" får stå som det är, det som är "hört i podden" är poddens egen uppgift och skrivs så, och "supportrarnas åsikt" är just en åsikt. Ange avsnittet bland källorna, med adressen ur underlaget.

På samma sätt kan underlaget ha uppgifter ur lagets supporterforum (ett eller flera), under "ur supporterforumet": det supportrarna har skrivit på forumen den här veckan. Det som är "skrivet på forumet" är en supporters egen uppgift eller ett rykte och skrivs så ("enligt supportrar på forumet …"). Säger podden och ett forum, eller två forum, samma sak väger det tyngre. Ange forumen bland källorna, med adressen ur underlaget.

Underlaget kan också ha uppgifter ur de insatta medierna, under "ur insatta medier": artiklar den här veckan i oberoende medier som följer laget på nära håll (fansajter, fanzines, klubbnära nyhetsbrev och bloggar, oberoende lokala reportrar), som tidningen har läst. Det som är "de insattas egen uppgift" skrivs så, med källans namn ("enligt fansajten …", "enligt nyhetsbrevet …"), och "de insattas åsikt" är en åsikt. Säger de insatta och supportrarna samma sak väger det tyngre. Ange artikeln bland källorna, med adressen ur underlaget.

Underlaget kan också ha uppgifter från klubben och lokaltidningen, under "ur klubben och lokaltidningen": tränarens presskonferens, klubbens skadebesked och lokaltidningens reporter den här veckan, och ibland motståndarlagets intervju med en av lagets supportrar inför matchen (kalltyp). Det som är "bekräftat" är klubbens eller tränarens besked och får stå som det är, "lokaltidningens egen uppgift" skrivs så ("enligt lokaltidningen …") och det supportern säger i intervjun är en supporters uppgift eller åsikt. Ange artikeln bland källorna, med adressen ur underlaget.

Skriv sedan en notis per match: en rubrik på högst {rubrikOrd} ord och en text på {ordMin}–{ordMax} ord om båda lagen, med det viktigaste först, som i en riktig notis. Hittar du inget nytt om en match får tabelläget, formen och skadelistan bära notisen.

Inga tips: skriv inte vem som är favorit, hur matchen slutar eller vilka tecken man ska välja, och inga odds.

Allt om lagen ska komma ur underlaget eller det du läser nu, inte ur minnet. Tal bara som de står där, med siffror. Det du inte hittade skriver du inte om.

Skriv svenska, inte översatt engelska, och inga listor eller Markdown.

Svara till sist bara med JSON, utan något före eller efter:
{"notiser": [{"nr": 1, "rubrik": "…", "text": "…", "källor": [{"url": "…", "källa": "…", "rubrik": "…"}]}]}

nr: matchens nummer i underlaget. källor: sidorna notisen bygger på, med adressen som den stod där du läste den, tidningens namn och sidans rubrik; en tom lista när notisen bara bygger på underlaget.`,
};
