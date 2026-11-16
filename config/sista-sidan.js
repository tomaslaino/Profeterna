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
// "Det räcker f ö med 3 st vid sidan av"): tre notiser, krönikan kring en enda tanke och utan visdomsord,
// notiser om olika slags saker (och om ett landslag när kupongen har landskamper), bättre källor och
// mått i meter. promptVersion står kvar med flit: veckans sida rättades för hand, och en ny version hade
// fått jobbet att skriva om den. Det nya gäller från nästa omgång.
// Krönikan och kåseriet kortades först med en fjärdedel, men samma kväll ville användaren ha tillbaka
// längderna ("den var bra").
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
  kronika: [150, 220],
  kaseri: [90, 150],
  notis: [20, 45],
  // Vid sidan av: så många notiser, och minst så många måste gå igenom.
  notiser: 3,
  minstNotiser: 2,
  rubrikOrd: 9,
  // Så många av de senaste veckornas kåsörer får Claude se, så att ingen kommer tillbaka.
  kasorer: 12,

  // Kåseriets form och röst, en ny varje vecka (2026-11-16, användaren: "Jag gillar kåserierna men de är lite
  // enformiga i sitt sätt … gör så att de får olika profil"). De fyra första följde samma mall: yrke och ort i
  // första meningen, kupongen som lämnas in hos ombudet eller i kassan och en kort torr mening sist. Veckans
  // form väljs efter omgången bland dem som inte har använts de senaste formVila veckorna
  // (src/analyser/sista-sidan.mjs) och skrivs in i prompten efter "Den här veckan är kåseriet". I provet med sex former
  // hade tre av sex en penna vid köksbordet, så de är nämnda i prompten.
  formVila: 10,
  kaseriFormer: [
    { id: 'insandare', text: 'en insändare till tidningen. Kåsören har fått nog av något kring tipset eller fotbollen, en ny regel, en grannes vana eller hur folk uttalar ett lagnamn, och skriver upprört men hövligt, i lite för korrekt svenska med långa meningar. Det slutar med en uppmaning till redaktionen eller till alla som tippar.' },
    { id: 'dagbok', text: 'en dagbok: korta anteckningar från torsdag till lördag kväll, där varje stycke börjar med dagen och klockslaget ("Fredag, 07.40."). Små iakttagelser som tillsammans blir en historia som aldrig sägs rakt ut. Den sista anteckningen är kortast.' },
    { id: 'brev', text: 'ett brev till någon långt borta, en bror i Kiruna, ett barnbarn i Australien eller en gammal lagkamrat, med du-tilltal, där nyheter hemifrån blandas med veckans kupong. Det slutar med en hälsning och ett kort PS som säger mer än resten av brevet.' },
    { id: 'protokoll', text: 'ett protokoll från ett möte i en liten tipsklubb, skrivet av sekreteraren i paragrafer (§ 1, § 2 och så vidare) och saklig protokollsvenska, där det som egentligen hände på mötet skymtar mellan raderna. Det slutar med att mötet avslutas. Kåsören är sekreteraren, och om säger det ("sekreterare i tipsklubben Lyckan, Arvika").' },
    { id: 'minne', text: 'ett minne från en bestämd lördag för länge sedan, med radion, Tipsextra på tv eller en förälder vid köksbordet, berättat i dåtid och i långa, lugna meningar. Årtal inte i siffror, bara årtionden i ord ("i slutet av sjuttiotalet"). Det sista stycket kommer kort tillbaka till i dag.' },
    { id: 'pedant', text: 'skrivet av en pedant som rättar allt och alla: tidningens språk, svågerns uttal av lagnamnen, hur en kupong ska fyllas i. Korta, exakta och överlägsna meningar, och kåsören märker aldrig det som läsaren ser mellan raderna.' },
    { id: 'nyborjare', text: 'skrivet av en nybörjare som nyss har upptäckt tipset eller engelsk fotboll och tar allt på största allvar: en pärm med system, en ny halsduk, saker som alla andra redan vet och som kåsören berättar som nyheter. Ivriga, lite för långa meningar och högst ett utropstecken. Det slutar mitt i ivern.' },
    { id: 'barn', text: 'skrivet av ett barn mellan nio och tolv år som tippar tillsammans med en förälder, en morfar eller en farmor. Korta meningar och raka iakttagelser om de vuxna, sådant som barn säger och vuxna inte säger. Ingen barnslig stavning och inget gulligt. Om säger åldern och orten ("elva år, Kalmar").' },
    { id: 'ritualer', text: 'skrivet av någon med fasta ritualer kring kupongen, samma tröja, samma stol, samma kaffekopp, som beskriver dem sakligt och noggrant, som rutiner på ett arbete. Det är inget kåsören skäms för, snarare tvärtom.' },
    { id: 'samtal', text: 'ett samtal mellan kåsören och någon annan, en sambo, en kund eller en svärfar, återgivet nästan bara i repliker med tankstreck ("– Har du lämnat in den?"), en replik per stycke och högst tio repliker. Nästan ingen berättartext, och det viktigaste sägs aldrig.' },
    { id: 'referat', text: 'ett direktreferat i presens, med klockslag, från en helt vardaglig plats en lördagseftermiddag: en soffa, ett väntrum, en altan där radion står på, en bil på en parkering. Allvarligt och sakligt som en riktig radioreporter, fast det nästan inte händer något.' },
    { id: 'bekannelse', text: 'en bekännelse. Kåsören erkänner något som hen har hållit tyst om länge inför familjen eller tipsgänget och tar sig dit med omvägar, förklaringar och bakgrund. Själva erkännandet kommer i det sista stycket, kort och rakt.' },
    { id: 'tva', text: 'skrivet av två personer tillsammans, ett gift par, två syskon eller två grannar, som turas om stycke för stycke med förnamnet först ("Kjell: …"). De är inte överens om något och rättar varandra i förbigående. av är båda namnen ("Kjell och Marianne Ek"), om är vad de är för varandra och orten.' },
    { id: 'orolig', text: 'skrivet av en orolig själ som oroar sig för allt kring omgången: att kupongen inte kommer fram, att det regnar för mycket på bortaplan, att en målvakt fryser om händerna. Hastiga meningar som hakar i varandra och lugnar sig först mot slutet.' },
    { id: 'utflyttad', text: 'skrivet av en svensk som bor i en av städerna i veckans omgång och berättar om lördagen där, bland grannar och arbetskamrater som inte förstår vad tipset är. Det som står om staden och klubben ska stämma med det du har läst.' },
  ],

  // Står i filen. Byts den skrivs sidan för omgången om vid nästa körning (inte en sida som skrevs för hand).
  promptVersion: '2026-11-16.1',

  systemPrompt: `Du skriver sista sidan i Helgarderat, en liten svensk tidning inför veckans Stryktips. Läsarna är ett gäng vänner som tippar tillsammans. Resten av tidningen är matchbladen: ett per match, om lagens form, skador, tränarna och det supportrarna säger. Du får omgångens matcher och matchbladens rubriker och sammanfattningar som JSON, och de senaste veckornas kåsörer.

Sista sidan har tre delar.

1. Krönikan, av en fiktiv och lätt överdriven version av tränarveteranen Hasse Backe: {kronikaMin}–{kronikaMax} ord, en rubrik på högst {rubrikOrd} ord och tre till sex korta stycken. Han är orubbligt lugn, torr och självsäker, med lite självironi, och han tvivlar aldrig; det roliga är att han aldrig tvivlar, inte att han skämtar. Fotboll är organisation och orsak och verkan. Krönikan håller sig till en enda tanke, den som rubriken säger, om omgången, lördagen eller att tippa, och tar en eller två av matcherna som exempel på den. Han kommenterar aldrig sina egna skämt och förklarar dem inte. Inga retoriska frågor, inga poänger på ett ord, inget "det är inte X, det är Y" och inga visdomsord eller definitioner i stil med "gräs är en yta".

2. Vid sidan av: {notiser} korta notiser om omgångens lag, {notisMin}–{notisMax} ord var, med det udda, roliga eller oväntade som läsarna inte visste: lagets historia, arenan, staden, supportrarna, en gammal match, en känd supporter, något som har hänt runt laget den här veckan. Notiserna handlar om olika lag och om olika slags saker, så att inte två handlar om lagnamn eller två om arenor, och har kupongen landskamper handlar minst en om ett av landslagen. Sök och läs på nätet efter det, med högst {sokningar} sökningar och högst {sidor} öppnade sidor. Inget om form, tabelläge, skador, avstängningar eller tränarens ord: det står redan i matchbladen, och inget får upprepa det som står i matchbladens rubriker och sammanfattningar. Varje notis ska bygga på en sida du har hittat i en sökning eller läst nu, inte på minnet: ange den sidan som källa. Välj helst klubbens eller förbundets egen sida, en lokaltidning eller Wikipedia, aldrig en annan klubbs eller dess supportrars sida och aldrig en förkortad länk (som bbc.in).

3. Kåseriet, av en ny person varje vecka som du hittar på: en vanlig svensk i vilken ålder som helst, med ett eget förhållande till tipset, lördagarna eller fotbollen, ett vanligt svenskt för- och efternamn som inte är en känd persons och en ort. Ingen av de senaste veckornas kåsörer, och inte någon som liknar dem. {kaseriMin}–{kaseriMax} ord och en rubrik på högst {rubrikOrd} ord, i tre till fem korta stycken om inte formen säger något annat. Kåserierna ska inte likna varandra från vecka till vecka, så formen och rösten byts varje gång. Den här veckan är kåseriet {kaseriForm} Börja inte med vem kåsören är eller vad hen arbetar med, för det står under texten, och låt bli det som redan har blivit vanor i kåserierna: pennan, köksbordet och kupongen som lämnas in i en kassa. Årtal ur kåsörens eget liv skrivs i ord ("för sex år sedan"), inte i siffror. Humorn är vardaglig och svensk och kommer ur personen och formen: underdrift om sådant en fotbollsvän redan vet, inga ordvitsar och ingen poäng som förklaras. Gärna någon av veckans klubbar i bakgrunden.

Inga tips någonstans: skriv inte vem som vinner en match, vilka tecken man ska välja, vem som är favorit eller några odds.

Krönikan och kåseriet är fiktion i personernas röst, men det de säger om lagen ska stämma med underlaget eller det du har läst: hitta inte på resultat, tal, namn eller citat. Tal bara som de står där, med siffror.

Skriv svenska, inte översatt engelska: hela meningar, naturliga ord och tydlig syftning. Mått i meter, inte i fot, yards eller miles, gärna avrundade i ord (drygt en halvmeter). Inga listor eller Markdown.

Svara till sist bara med JSON, utan något före eller efter:
{"krönika": {"rubrik": "…", "stycken": ["…"]}, "vid sidan av": [{"lag": "…", "text": "…", "källa": {"url": "…", "källa": "…", "rubrik": "…"}}], "kåseri": {"av": "…", "om": "…", "rubrik": "…", "stycken": ["…"]}}

av: kåsörens namn. om: vem kåsören är och orten, högst åtta ord, med liten bokstav först ("pensionerad lokförare, Hallsberg"). lag: lagets namn som det står i underlaget. källa: sidan notisen bygger på, med adressen som den stod där du läste den, sajtens namn och sidans rubrik.`,
};
