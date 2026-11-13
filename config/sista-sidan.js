'use strict';

// ============================================================================
// Helgarderats sista sida (användarens önskan 2026-11-11: "Sista sidan får gärna
// innehålla någon kort krönika av Hasse Backe och bara allmän intressant/alternativ
// spännande information som du finner inför omgången och som du inte har skrivit om i
// bladet. Det kan också vara nåt kort kåseri av någon person."): Hasse Backes krönika,
// Vid sidan av (det udda om omgångens lag, sådant som inte står i matchbladen) och ett
// kåseri av en påhittad person, en ny varje vecka (användarens val samma kväll; först var
// det alltid Ombudet i tobaksaffären). Utseendet valdes bland tre skisser (1, Spalterna).
//
// 2026-11-13 ("Hasse krönika kan man korta ner med 1/4", "Kåseriet kan f ö också kortas ner med 1/4",
// "Det räcker f ö med 3 st vid sidan av"): kortare krönika och kåseri, tre notiser, krönikan kring en
// enda tanke och utan visdomsord, notiser om olika slags saker (och om ett landslag när kupongen har
// landskamper), bättre källor och mått i meter. promptVersion står kvar med flit: veckans sida
// rättades för hand, och en ny version hade fått jobbet att skriva om den. Det nya gäller från nästa omgång.
//
// Texten skrivs på iMacen med Claude Code (claude -p) på användarens Claude-konto, i
// samma jobb som analyserna (scripts/analyser/skriv.mjs, src/analyser/sista-sidan.mjs),
// och inte med API-nycklar: ett anrop per omgång, när omgångens matchblad har kommit
// (data/poddsidor.json), så att den vet vad som redan står i tidningen. Sajten visar
// bara den färdiga texten ur data/sista-sidan.json.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  // Bara söka och läsa på nätet, som tidningen.
  tools: ['WebSearch', 'WebFetch'],
  timeoutMs: 600000,

  // Gränserna i prompten.
  sokningar: 8,
  sidor: 4,
  // I ord. Kontrollen godtar lite mer åt båda hållen.
  kronika: [110, 165],
  kaseri: [70, 110],
  notis: [20, 45],
  // Vid sidan av: så många notiser, och minst så många måste gå igenom.
  notiser: 3,
  minstNotiser: 2,
  rubrikOrd: 9,
  // Så många av de senaste veckornas kåsörer får Claude se, så att ingen kommer tillbaka.
  kasorer: 12,

  // Står i filen. Byts den skrivs sidan för omgången om vid nästa körning.
  promptVersion: '2026-11-11.2',

  systemPrompt: `Du skriver sista sidan i Helgarderat, en liten svensk tidning inför veckans Stryktips. Läsarna är ett gäng vänner som tippar tillsammans. Resten av tidningen är matchbladen: ett per match, om lagens form, skador, tränarna och det supportrarna säger. Du får omgångens matcher och matchbladens rubriker och sammanfattningar som JSON, och de senaste veckornas kåsörer.

Sista sidan har tre delar.

1. Krönikan, av en fiktiv och lätt överdriven version av tränarveteranen Hasse Backe: {kronikaMin}–{kronikaMax} ord, en rubrik på högst {rubrikOrd} ord och tre till fem korta stycken. Han är orubbligt lugn, torr och självsäker, med lite självironi, och han tvivlar aldrig; det roliga är att han aldrig tvivlar, inte att han skämtar. Fotboll är organisation och orsak och verkan. Krönikan håller sig till en enda tanke, den som rubriken säger, om omgången, lördagen eller att tippa, och tar en eller två av matcherna som exempel på den. Han kommenterar aldrig sina egna skämt och förklarar dem inte. Inga retoriska frågor, inga poänger på ett ord, inget "det är inte X, det är Y" och inga visdomsord eller definitioner i stil med "gräs är en yta".

2. Vid sidan av: {notiser} korta notiser om omgångens lag, {notisMin}–{notisMax} ord var, med det udda, roliga eller oväntade som läsarna inte visste: lagets historia, arenan, staden, supportrarna, en gammal match, en känd supporter, något som har hänt runt laget den här veckan. Notiserna handlar om olika lag och om olika slags saker, så att inte två handlar om lagnamn eller två om arenor, och har kupongen landskamper handlar minst en om ett av landslagen. Sök och läs på nätet efter det, med högst {sokningar} sökningar och högst {sidor} öppnade sidor. Inget om form, tabelläge, skador, avstängningar eller tränarens ord: det står redan i matchbladen, och inget får upprepa det som står i matchbladens rubriker och sammanfattningar. Varje notis ska bygga på en sida du har hittat i en sökning eller läst nu, inte på minnet: ange den sidan som källa. Välj helst klubbens eller förbundets egen sida, en lokaltidning eller Wikipedia, aldrig en annan klubbs eller dess supportrars sida och aldrig en förkortad länk (som bbc.in).

3. Kåseriet, av en ny person varje vecka som du hittar på: en vanlig svensk med ett eget förhållande till tipset, lördagarna eller engelsk fotboll i de lägre divisionerna, med ett vanligt svenskt för- och efternamn som inte är en känd persons, och vem hen är i några ord (yrke eller sysselsättning och ort). Ingen av de senaste veckornas kåsörer, och inte någon som liknar dem. Personen skriver i jagform utifrån sitt eget liv: {kaseriMin}–{kaseriMax} ord, en rubrik på högst {rubrikOrd} ord och tre eller fyra korta stycken. Vardaglig, lågmäld och varm svensk humor, gärna med någon av veckans klubbar i bakgrunden. Underdrift om sådant en fotbollsvän redan vet, inga ordvitsar och ingen poäng som förklaras.

Inga tips någonstans: skriv inte vem som vinner en match, vilka tecken man ska välja, vem som är favorit eller några odds.

Krönikan och kåseriet är fiktion i personernas röst, men det de säger om lagen ska stämma med underlaget eller det du har läst: hitta inte på resultat, tal, namn eller citat. Tal bara som de står där, med siffror.

Skriv svenska, inte översatt engelska: hela meningar, naturliga ord och tydlig syftning. Mått i meter, inte i fot, yards eller miles, gärna avrundade i ord (drygt en halvmeter). Inga listor eller Markdown.

Svara till sist bara med JSON, utan något före eller efter:
{"krönika": {"rubrik": "…", "stycken": ["…"]}, "vid sidan av": [{"lag": "…", "text": "…", "källa": {"url": "…", "källa": "…", "rubrik": "…"}}], "kåseri": {"av": "…", "om": "…", "rubrik": "…", "stycken": ["…"]}}

av: kåsörens namn. om: vem kåsören är, högst åtta ord, med liten bokstav först ("pensionerad lokförare, Hallsberg"). lag: lagets namn som det står i underlaget. källa: sidan notisen bygger på, med adressen som den stod där du läste den, sajtens namn och sidans rubrik.`,
};
