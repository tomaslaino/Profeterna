'use strict';

// ============================================================================
// Landslagen och klubbarna utanför England i Helgarderat (2026-11-16: användaren ville att
// nattjobbet gör tidningen för varje Europatipset av sig självt, "som för Stryktipset, så att
// inget behöver skrivas för hand"). Förut hoppade nattjobbet över landskamperna, och deras
// matchblad skrevs för hand.
//
// Poddarna, forumen, de insatta medierna och lokaltidningarna (config/poddar.js, forum.js,
// media.js, lokal.js) är engelska källor till engelska klubbar. Ett landslag eller en klubb
// utanför England (ett lag i sajtens data utan engelsk liga) läses i stället här, i samma
// nattjobb (scripts/tidning/poddar.mjs) och på samma sätt (src/analyser/media.mjs):
//
//   forbundet  förbundets eller landslagets egen sajt: förbundskaptenens presskonferens,
//              truppen, avbud och skadebesked,
//   klubben    klubbens egen sajt: tränarens presskonferens och truppnyheter,
//   pressen    landets sportpress och tidningen som följer laget närmast, på landets språk.
//
// Artiklarna sparas som klubbens och lokaltidningens (typ 'lokal'), så att matchbladet och
// tidningen tar dem som de tar lokaltidningens. Många utländska tidningar är spärrade på
// iMacen (/etc/hosts): därför söker Claude fram fler artiklar än som läses, och jobbet läser
// de första som går att läsa (lasHogst). Artiklarna är andras och läggs aldrig i repot eller
// på sajten; dit kommer bara tidningens egna meningar, korta citat i svensk översättning,
// källans namn och länken.
// ============================================================================

const mc = require('./media.js');

module.exports = {
  model: 'claude-opus-5-5',
  letaEffort: 'medium',
  effort: 'medium',
  timeoutMs: 420000,

  // Så många sökningar per lag, så många artiklar Claude får föreslå och så många som läses.
  sokningar: 6,
  artiklar: 8,
  lasHogst: 4,
  dagar: 7,
  minstTecken: 400,
  teckenPerArtikel: 9000,
  flestTecken: 32000,
  uppgifter: 8,
  tillSidan: 3,
  tillTidningen: 2,
  behall: 6,
  // Källans slag i omgångens fil (samma som lokaltidningens), och början på artiklarnas id.
  typ: 'lokal',
  idBorjan: 'u',
  slag: { forbundet: 'lokal', klubben: 'lokal', pressen: 'lokal' },
  slagText: {
    forbundet: 'förbundets eller landslagets egen sajt',
    klubben: 'klubbens egen sajt',
    pressen: 'landets sportpress',
  },
  // Så heter laget i frågan (ett landslag är ingen klubb).
  lagOrd: 'Laget',
  // Ingen Bing: den söker på engelska i Storbritannien.
  bing: null,

  // Samma som de insattas (rikstidningarna och lokaltidningarna i England, spelsajterna, aggregatorerna),
  // och UEFA och FIFA.
  utesluten: [...mc.utesluten, 'uefa.com', 'fifa.com'],

  // Byts den läses lagens artiklar om av Claude.
  promptVersion: '2026-11-16.1',

  letaPrompt: `Du hjälper en svensk tipstidning att hitta det som skrivs om ett lag inför dess nästa match. Laget är ett landslag eller en klubb utanför England, och det som räknas är det som förbundet, klubben och landets egen sportpress skriver, på landets eget språk.

Det som räknas, med slaget inom citattecken:
- "forbundet": förbundets eller landslagets egen sajt: förbundskaptenens presskonferens, truppen, avbud, skadebesked och nya spelare i truppen,
- "klubben": klubbens egen sajt: tränarens presskonferens inför matchen, skadebesked och truppnyheter,
- "pressen": landets sportpress och tidningen som följer laget närmast: truppnyheter, väntad startelva, vad förbundskaptenen eller tränaren sa, iakttagelser från träningen, stämningen kring laget.

Det som INTE räknas: biljetter och matchdagsinformation, butiken och reklam, spelsajter och sajter med matchtips, aggregatorer och klickfabriker som skriver om alla lag (OneFootball, GiveMeSport, 90min, Goal och liknande), UEFA:s och FIFA:s sajter, statistiksajter, Wikipedia, forum, Reddit, sociala medier, poddar och videor, och engelska medier som inte följer laget.

Sök på nätet efter artiklar från de senaste {dagar} dagarna, på lagets eget språk och gärna direkt på förbundets eller klubbens sajt och de största sporttidningarnas sajter (site:). Högst {sokningar} sökningar. Föreslå högst {artiklar} artiklar som säger mest inför just nästa match, de viktigaste först och helst från olika källor: förbundets eller klubbens senaste besked om truppen, förbundskaptenens eller tränarens presskonferens och pressens senaste truppnyheter. Många tidningar går inte att läsa här, så ta gärna med flera tidningar. Bara skrivna artiklar (inte videor) som kom upp i dina sökningar, med adressen exakt som där. Hitta aldrig på en adress: finns inget som håller är listan tom, och det är ett bra svar.

Svara bara med JSON, utan något före eller efter:
{"artiklar": [{"slag": "pressen", "kalla": "<sajtens eller tidningens namn som den kallar sig, utan parentes>", "titel": "<artikelns rubrik>", "adress": "https://…", "datum": "ÅÅÅÅ-MM-DD eller null"}]}`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset och Europatipset och vill inför en match veta läget i laget: vem som är skadad, vem som är tillbaka, vad förbundskaptenen eller tränaren säger och vad de som följer laget varje vecka har sett. Tidningen trycker en informationssida per match som läsaren ska kunna hämta kunskap ur.

Du får de senaste artiklarna om laget, ett landslag eller en klubb utanför England, ur förbundets eller klubbens egen sajt och ur landets sportpress, ofta på ett annat språk än svenska. Varje artikel har ett nummer i hakparentes, källan och vad det är för källa, rubriken, datumet och skribenten när de är kända.

Ta ut ALLT SOM ÄR INTRESSANT inför lagets nästa match, högst {flest} uppgifter, bara ur artiklar från de senaste {dagar} dagarna. Hellre fyra bra än åtta halvbra, men missa inget som en tippare vill veta. En uppgift är intressant om den kan ändra hur man ser på matchen. Varje uppgift hör till ett ämne:
- "trupp": vem som är skadad, sjuk, avstängd, har lämnat återbud, är inkallad eller tveksam,
- "elva": vilka som väntas starta, byte av målvakt, uppställning eller formation,
- "spel": hur laget spelar just nu, bortom resultaten: trötthet, självförtroende, var det läcker, vem som bär laget,
- "klubb": förbundskaptenens eller tränarens ställning, stämningen i truppen, förbundet eller klubbens ledning, pengarna, vad som står på spel för laget i turneringen,
- "match": vad förbundskaptenen, tränaren eller pressen säger om just den här motståndaren eller matchen, när det sticker ut.

Ta INTE med: referat av förra matchen, tabelläget, sådant alla redan vet, biljetter, evenemang och reklam, och sådant som bara gäller ett annat lag. Samma sak tas upp en gång. Uppgiften ska handla om laget ovan eller om matchen. Finns inget intressant är listan tom, och det är ett bra svar.

Varje uppgift:
- a: ämnet, ett av "trupp", "elva", "spel", "klubb", "match".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha sett artikeln. Skriv vad som sägs och vem som säger det ("förbundskaptenen sa på presskonferensen …", "den polska sporttidningen skriver …"), inte att "artikeln tar upp". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om det är förbundets eller klubbens besked, något förbundskaptenen, tränaren eller en spelare har sagt eller något som har hänt, "h" om det är reporterns egen uppgift: något hen vet, har sett eller hört, eller ett rykte, "o" om det är en åsikt eller förhoppning.
- artikel: numret på artikeln där det står.
- citat: 8–30 ord i följd ur just den artikeln, ordagrant som de står där och på artikelns eget språk, där det sägs tydligast.
- sagt: samma citat på svenska, som det ska tryckas: troget men ledigt översatt, med namnen rättstavade. Lägg inte till något som inte sägs.
- vem: den som säger citatet, om det är en namngiven person i artikeln (förbundskaptenen, tränaren, en spelare, reportern), annars null.
- vikt: 5 = det här kan avgöra matchen eller är en nyhet, 3 = värt att veta, 1 = kuriosa.

Bara det som står i artiklarna, ingenting ur minnet. Tal bara som de står där.

Handlar en artikel uppenbart om ett annat lag än laget ovan (en annan klubb, ett annat landslag, ett dam- eller ungdomslandslag när laget är herrarnas) tar du inget ur den.

Svara bara med JSON, utan något före eller efter:
{"handlar_om": "en mening om vad förbundet, klubben och pressen skriver om", "uppgifter": [{"a": "trupp", "t": "…", "s": "b", "artikel": 2, "citat": "…", "sagt": "…", "vem": null, "vikt": 4}]}`,
};
