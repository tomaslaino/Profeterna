'use strict';

// ============================================================================
// Klubben, lokaltidningen och motståndarens intervju till Helgarderat (användarens
// önskan 2026-11-10: "Om du kan komma på andra relevanta källor än forum och poddar till
// informationen på 'Helgarderat' än vad det är nu för lagen lägg till det!").
//
// Poddarna, forumen och de insatta medierna (config/media.js) är supportrarnas och de
// oberoendes röst. Det här är tre källor till, som läses i samma nattjobb
// (scripts/tidning/poddar.mjs) och på samma sätt (src/analyser/media.mjs):
//
//   klubben    klubbens egen sajt: tränarens presskonferens inför matchen, skadebesked,
//              U21- och reservlagets matcher där spelare ur a-truppen fick speltid, och
//              klubbens egna uttalanden (ägarna, pengarna, köpstopp, poängavdrag),
//   tidningen  lokaltidningens reporter som följer klubben: truppnyheter, väntad elva,
//              vad tränaren sa på presskonferensen, iakttagelser från träningen,
//   intervju   motståndarens intervju inför matchen med en av lagets supportrar
//              ("opposition view", "Q&A"): det supportern säger om sitt eget lag.
//
// Klubben och lokaltidningen står som källa med sitt eget namn (typ 'lokal'), intervjun som
// "intervjun i …" (typ 'motstand'). Artiklarna är andras och läggs aldrig i repot eller på
// sajten; dit kommer bara tidningens egna meningar, korta citat i svensk översättning,
// källans namn och länken.
// ============================================================================

const mc = require('./media.js');

const LOKALTIDNINGAR = new Set(mc.lokaltidningar);

// Newsquests tidningar säger nej till AI-assistenters läsning (Claude-User i robots.txt, kontrollerat
// 2026-11-10 för alla nedan), så jobbet läser dem aldrig. De stryks ur sökningen, så att platserna går
// till tidningar som går att läsa (Reach, National World, Express & Star, KentOnline m.fl.).
const SAGER_NEJ = [
  'readingchronicle.co.uk', 'oxfordmail.co.uk', 'thisisoxfordshire.co.uk', 'theboltonnews.co.uk', 'lancashiretelegraph.co.uk',
  'thisislancashire.co.uk', 'burytimes.co.uk', 'warringtonguardian.co.uk', 'thenorthernecho.co.uk', 'yorkpress.co.uk',
  'wiltshiretimes.co.uk', 'gazetteandherald.co.uk', 'swindonadvertiser.co.uk', 'southwalesargus.co.uk', 'echo-news.co.uk',
  'gazette-news.co.uk', 'bournemouthecho.co.uk', 'dailyecho.co.uk', 'dorsetecho.co.uk', 'thetelegraphandargus.co.uk',
  'thewestmorlandgazette.co.uk', 'messengernewspapers.co.uk', 'watfordobserver.co.uk', 'newsshopper.co.uk', 'thecomet.net',
  'worcesternews.co.uk', 'northwichguardian.co.uk', 'wirralglobe.co.uk', 'eadt.co.uk', 'edp24.co.uk', 'heraldscotland.com',
  'thenational.scot',
];

module.exports = {
  model: 'claude-opus-5-5',
  letaEffort: 'medium',
  effort: 'medium',
  timeoutMs: 420000,

  // Så många sökningar per lag, och högst så många artiklar som läses per lag och natt.
  sokningar: 6,
  artiklar: 4,
  // Bara artiklar från de senaste så här många dagarna: presskonferensen är från veckan.
  dagar: 7,
  // Klubbens besked kan vara korta (några stycken under en video); kortare än så är en puff.
  minstTecken: 400,
  teckenPerArtikel: 9000,
  flestTecken: 32000,
  uppgifter: 8,
  tillSidan: 3,
  tillTidningen: 2,
  behall: 6,
  // Källans slag i omgångens fil, och början på artiklarnas id (de insattas börjar på m).
  typ: 'lokal',
  idBorjan: 'l',
  // Sökningens slag → källans slag i omgångens fil.
  slag: { klubben: 'lokal', tidningen: 'lokal', intervju: 'motstand' },
  // Så står slaget i det Claude får läsa.
  slagText: {
    klubben: 'klubbens egen sajt',
    tidningen: 'lokaltidningen',
    intervju: 'motståndarlagets medier: intervju med en av lagets supportrar',
  },

  // Lagets nyheter i Bing News som Claude får att välja bland före sina egna sökningar ({namn}: lagets
  // söknamn i config/news.js). Sökmotorn bakom WebSearch hittar sällan veckans lokala artiklar; Bing har dem.
  bing: { fragor: ['{namn}', '{namn} boss', '{namn} injury'], flest: 20 },

  // Samma som de insattas lista, utom lokaltidningarna (här är de med), och Newsquests tidningar.
  utesluten: [...mc.utesluten.filter((d) => !LOKALTIDNINGAR.has(d)), ...SAGER_NEJ],

  // Byts den läses lagens artiklar om av Claude.
  promptVersion: '2026-11-10.1',

  letaPrompt: `Du hjälper en svensk tipstidning att hitta det som KLUBBEN SJÄLV och LOKALTIDNINGEN säger om en engelsk fotbollsklubb inför nästa match, och vad en av klubbens supportrar säger i motståndarlagets medier.

Det som räknas, med slaget inom citattecken:
- "klubben": klubbens egen sajt: tränarens presskonferens inför matchen, skadebesked och truppnyheter, matchrapporter från U21- eller reservlaget där spelare ur a-truppen fick speltid, och klubbens egna uttalanden (ägarna, pengarna, ett köpstopp, ett poängavdrag),
- "tidningen": lokaltidningens reporter som följer klubben, också i Reach och National World: truppnyheter, väntad startelva, vad tränaren sa på presskonferensen, iakttagelser från träningen,
- "intervju": inför just nästa match, motståndarlagets fansajt, lokaltidning eller nyhetsbrev som intervjuar en supporter till klubben ("opposition view", "Q&A", "enemy lines", "the view from …").

Det som INTE räknas: biljetter, matchdagsinformation, butiken och klubbens reklam, klubbens egna fansajter, fanzines och supporternyhetsbrev (de läses för sig), de nationella mediehusen (BBC, Sky, de rikstäckande tidningarna), Newsquests tidningar (Reading Chronicle, Oxford Mail, The Bolton News, Lancashire Telegraph, The Northern Echo och de andra; de går inte att läsa här), ligans sajter, spelsajter och sajter med matchtips, aggregatorer och klickfabriker som skriver om alla klubbar (Football League World, Football Fancast, TEAMtalk, GiveMeSport, Football Insider, HITC, OneFootball och liknande), statistiksajter, forum, Reddit, sociala medier, poddar och videor.

Du får ofta veckans nyheter om klubben ur Bing News; välj gärna bland dem. Sök på nätet efter klubbens och lokaltidningens artiklar från de senaste {dagar} dagarna och efter intervjun inför nästa match. Sök gärna direkt på klubbens sajt och lokaltidningens sajt (site:). Det senaste skadebeskedet räknas också när det kom efter förra matchen och inte nämner nästa. Högst {sokningar} sökningar. Välj de högst {artiklar} artiklar som säger mest inför nästa match: helst tränarens presskonferens eller klubbens senaste skadebesked, lokaltidningens senaste truppnyheter och, om den finns, intervjun. Många klubbsajter visar texten först i webbläsaren och går inte att läsa här, så ta hellre lokaltidningens referat av presskonferensen än klubbens, och klubbens sajt bara när det är en skriven artikel (inte en video). Ta bara med artiklar som kom upp i dina sökningar, med adressen exakt som där. Hitta aldrig på en adress: finns inget som håller är listan tom, och det är ett bra svar.

Svara bara med JSON, utan något före eller efter:
{"artiklar": [{"slag": "klubben", "kalla": "<sajtens eller tidningens namn som den kallar sig, utan parentes>", "titel": "<artikelns rubrik>", "adress": "https://…", "datum": "ÅÅÅÅ-MM-DD eller null"}]}`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset och vill inför en match veta läget i laget: vem som är skadad, vem som är tillbaka, vad tränaren säger och vad de som följer laget varje vecka har sett. Tidningen trycker en informationssida per match som läsaren ska kunna hämta kunskap ur.

Du får de senaste artiklarna om laget ur klubbens egen sajt och lokaltidningen, och ibland en intervju inför matchen med en av lagets supportrar i motståndarlagets medier. Varje artikel har ett nummer i hakparentes, källan och vad det är för källa, rubriken, datumet och skribenten när de är kända.

Ta ut ALLT SOM ÄR INTRESSANT inför lagets nästa match, högst {flest} uppgifter, bara ur artiklar från de senaste {dagar} dagarna. Hellre fyra bra än åtta halvbra, men missa inget som en tippare vill veta. En uppgift är intressant om den kan ändra hur man ser på matchen. Varje uppgift hör till ett ämne:
- "trupp": vem som är skadad, sjuk, avstängd, tillbaka i träning eller tveksam, och vem som fick speltid i U21- eller reservlaget efter en skada,
- "elva": vilka som väntas starta, byte av målvakt, uppställning eller formation,
- "spel": hur laget spelar just nu, bortom resultaten: trötthet, självförtroende, var det läcker, vem som bär laget,
- "klubb": tränarens ställning, stämningen i truppen, ägarna, pengarna, köpstopp, poängavdrag,
- "match": vad tränaren eller supportern säger om just den här motståndaren eller matchen, när det sticker ut.

Ur intervjun med supportern tar du bara det supportern säger om sitt eget lag, inte frågorna och inte det som rör motståndaren.

Ta INTE med: referat av förra matchen, tabelläget, sådant alla redan vet, biljetter, evenemang och klubbens reklam, och sådant som bara gäller en annan klubb. Samma sak tas upp en gång. Uppgiften ska handla om laget ovan eller om matchen. Finns inget intressant är listan tom, och det är ett bra svar.

Varje uppgift:
- a: ämnet, ett av "trupp", "elva", "spel", "klubb", "match".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha sett artikeln. Skriv vad som sägs och vem som säger det ("tränaren sa på presskonferensen …", "lokaltidningen skriver …", "en supporter säger …"), inte att "artikeln tar upp". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om det är klubbens besked, något tränaren eller en spelare har sagt eller något som har hänt, "h" om det är reporterns eller supporterns egen uppgift: något hen vet, har sett eller hört, eller ett rykte, "o" om det är en åsikt eller förhoppning.
- artikel: numret på artikeln där det står.
- citat: 8–30 ord i följd ur just den artikeln, ordagrant som de står där, där det sägs tydligast.
- sagt: samma citat på svenska, som det ska tryckas: troget men ledigt översatt, med namnen rättstavade. Lägg inte till något som inte sägs.
- vem: den som säger citatet, om det är en namngiven person i artikeln (tränaren, en spelare, reportern, supportern), annars null.
- vikt: 5 = det här kan avgöra matchen eller är en nyhet, 3 = värt att veta, 1 = kuriosa.

Bara det som står i artiklarna, ingenting ur minnet. Tal bara som de står där.

Handlar en artikel uppenbart om en annan klubb än laget ovan tar du inget ur den.

Svara bara med JSON, utan något före eller efter:
{"handlar_om": "en mening om vad klubben och lokaltidningen skriver om", "uppgifter": [{"a": "trupp", "t": "…", "s": "b", "artikel": 2, "citat": "…", "sagt": "…", "vem": null, "vikt": 4}]}`,
};
