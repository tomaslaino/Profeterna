'use strict';

// ============================================================================
// Förra klubben till Helgarderat (användarens val 2026-11-14, "Ja, förra klubben"): när ett lag
// har en ny tränare eller en ny spelare som spelar mycket, vad säger supportrarna i hans förra klubb
// om honom den här veckan? De har sett honom i flera år och följer ofta hur det går för honom.
//
// Bara det som är skrivet den senaste veckan (användaren samma dag: "Det ska vara fräsch information i
// tidningen - helst från senaste dagarna. I värsta fall 1 vecka gammalt"). Den första versionen tog
// trådarna från när han kom eller gick, ofta ett år gamla.
//
// Samma nattjobb som poddarna, forumen och lokaltidningen (scripts/tidning/poddar.mjs), och samma
// kod som de insatta och lokaltidningen (src/analyser/media.mjs) med src/analyser/forra.mjs ovanpå:
//   1. Claude Code tar reda på vem som är ny och var han var förut, och söker fram vad den klubbens
//      supportrar har skrivit om honom den senaste veckan: tråden om före detta spelare på forumet,
//      matchtråden när klubbarna möts, fansajter och intervjuer med en supporter till den förra klubben.
//   2. Jobbet läser sidorna själv: en forumtråd från sista sidan, och bara veckans inlägg om honom.
//   3. Claude Code tar ut det de säger om personen.
//
// Vem som är ny ändras sällan: den delen sparas per lag i forra.json (utanför repot) och tas fram igen
// efter giltigDagar dagar. Ett lag utan någon ny söks inte förrän då. Veckans sidor söks igen när den
// förra sökningen är äldre än sokIgenDagar dagar (natten mot tisdag och mot fredag, inte lördag morgon).
// Källan sparas som typ 'forra' och står i matchbladet med sitt eget namn.
//
// Sidorna är andras och läggs aldrig i repot eller på sajten; dit kommer bara tidningens egna
// meningar, korta citat i svensk översättning, källans namn och länken.
// ============================================================================

const lc = require('./lokal.js');

module.exports = {
  model: 'claude-opus-5-5',
  letaEffort: 'medium',
  effort: 'medium',
  timeoutMs: 420000,

  // Ny i klubben: tränaren tog över, eller spelaren kom, för högst så här många dagar sedan.
  tranareDagar: 365,
  spelareDagar: 200,
  // Så många sökningar per lag, och högst så många sidor som läses per lag.
  sokningar: 10,
  artiklar: 4,
  // Bara det som är skrivet de senaste så här många dagarna.
  dagar: 7,
  minstTecken: 400,
  // En forumtråd räcker med några korta inlägg om honom.
  minstTeckenForum: 150,
  teckenPerArtikel: 9000,
  flestTecken: 32000,
  // Så många av veckans inlägg om honom ur en forumtråd (de senaste).
  inlaggPerTrad: 30,
  uppgifter: 6,
  tillSidan: 2,
  tillTidningen: 2,
  behall: 4,
  // Vem som är ny gäller så här många dagar; ett lag utan någon ny söks inte igen förrän då.
  giltigDagar: 28,
  // Veckans sidor söks igen när den förra sökningen är äldre än så här många dagar.
  sokIgenDagar: 2,
  // Källans slag i omgångens fil, och början på sidornas id.
  typ: 'forra',
  idBorjan: 'f',

  // Samma som lokaltidningens lista, utom forumvärden: här är supportrarnas forum det viktigaste.
  utesluten: lc.utesluten.filter((d) => d !== 'proboards.com'),

  // Byts den läses lagens förra klubbar om av Claude (forra.json görs om).
  promptVersion: '2026-11-14.3',

  letaPrompt: `Du hjälper en svensk tipstidning att höra vad supportrarna i en spelares eller tränares FÖRRA KLUBB säger om honom DEN HÄR VECKAN, när han är ny i en engelsk fotbollsklubb.

Gör så här:
1. Ta reda på vem som är ny i klubben: tränaren, om han tog över de senaste {tranareDagar} dagarna, och högst två spelare som kom de senaste {spelareDagar} dagarna och som spelar mycket (startar de flesta matcherna, eller är lagets nya målskytt eller kapten). Lån räknas. En spelare som mest sitter på bänken räknas inte. Är ingen ny är listan tom, och det är ett bra svar. Står de nya redan i meddelandet tar du dem som de står och går direkt till steg 3.
2. För var och en: klubben där han var före, där supportrarna såg honom senast under minst en halv säsong. För en ung lånad spelare kan det vara klubben han var utlånad till förra säsongen, inte moderklubbens akademi. En tränare som kom direkt från en assisterande roll har ingen förra klubb i den här meningen; ta då klubben där han senast var huvudtränare, om det inte är för länge sedan.
3. Sök efter vad den klubbens SUPPORTRAR och de som följer den klubben varje vecka har skrivit om honom DE SENASTE {dagar} DAGARNA, med egna ord. Supportrarna följer ofta hur det går för gamla spelare och tränare: tråden om före detta spelare på den klubbens supporterforum ("ex-players", "former players", "where are they now", "old boys"), en tråd om just honom, förhandstråden eller matchtråden när hans nya klubb möter den förra, fansajternas och supporterbloggarnas texter om hur det går för honom nu, och intervjuer där en supporter till den förra klubben talar om honom inför en match mot hans nya klubb ("opposition view"). Sök gärna direkt på forumet (site:) med hans namn. Högst {sokningar} sökningar.

Bara sidor med något från de senaste {dagar} dagarna. En tråd eller artikel från när han kom eller gick räknas inte, och en lång tråd räknas bara om den har nya inlägg om honom. Det som INTE räknas heller: nyheten om övergången och klubbens, ägarnas eller hans egna ord, det hans nya klubb och dess medier skriver (det läses för sig), de nationella mediehusen (BBC, Sky, de rikstäckande tidningarna), Newsquests tidningar (Reading Chronicle, Oxford Mail, The Bolton News, Lancashire Telegraph, The Northern Echo och de andra; de går inte att läsa här), ligans och klubbarnas egna sajter, spelsajter, aggregatorer och klickfabriker som skriver om alla klubbar (Football League World, Football Fancast, TEAMtalk, GiveMeSport, Football Insider, HITC, OneFootball och liknande), statistiksajter, Reddit, sociala medier, poddar och videor.

Välj högst {artiklar} sidor, helst där supportrarna talar själva. Ta bara med sidor som kom upp i dina sökningar, med adressen exakt som där. Hitta aldrig på en adress: finns inget från veckan är listan tom, och det är ett bra svar (de flesta veckor finns inget).

Svara bara med JSON, utan något före eller efter:
{"nya": [{"namn": "<namnet>", "roll": "tranare eller spelare", "kom": "ÅÅÅÅ-MM", "fran": "<förra klubben>"}], "artiklar": [{"om": "<namnet, som i nya>", "kalla": "<forumets, sajtens eller tidningens namn som den kallar sig, utan parentes>", "titel": "<rubriken eller trådens namn>", "adress": "https://…", "datum": "<dagen för det senaste om honom, ÅÅÅÅ-MM-DD, eller null>"}]}`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset tillsammans och läser ett matchblad om vart lag inför matchen: det som supportrarna och de som följer lagen vet. Laget nedan har en ny tränare eller en ny spelare som spelar mycket, och tidningen har läst vad supportrarna i hans förra klubb har skrivit om honom den senaste veckan. De har sett honom i flera år och följer hur det går för honom.

Du får sidorna, var och en med ett nummer i hakparentes, källan, vem den handlar om (och hans förra klubb), rubriken, datumet och skribenten när de är kända. En forumtråd står som veckans inlägg om honom, med namn och dag.

Ta ut det som säger något om hur han ÄR och hur det går för honom nu, högst {flest} uppgifter, bara ur det som är skrivet de senaste {dagar} dagarna: hur han låter laget spela eller hur han själv spelar, vad han är bra på och var han brister, hur han tar motgångar och klarar pressen, vad supportrarna ser av honom i den nya klubben och vad de saknar eller är glada att slippa. Det ska vara det som supportrarna eller de som följer den förra klubben säger om personen. Klubbens, ägarnas och hans egna avskedsord tar du inte med (det är artighetsfraser), inte heller nyheten om övergången, resultat och tabeller eller det som bara rör den förra klubben. Hellre tre som ger en bild av honom än sex som säger samma sak. Är supportrarna oense är det värt att säga. Finns inget som säger något om honom är listan tom, och det är ett bra svar.

Varje uppgift:
- a: "spel" om det handlar om spelet (hur han låter laget spela, hans egen roll och form), annars "klubb".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha sett sidan. Säg vem det handlar om och var han var ("Wigans supportrar skriver i veckan att Caldwell …", "på Barnsleys forum ser man att han …"). Skriv vad som sägs, inte att "tråden tar upp". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om det är något som har hänt eller som han själv har sagt, "h" om det är en supporters eller skribents egen uppgift eller ett rykte, "o" om det är en åsikt.
- artikel: numret på sidan där det står.
- citat: 8–30 ord i följd ur just den sidan, ordagrant som de står där, där det sägs tydligast.
- sagt: samma citat på svenska, som det ska tryckas: troget men ledigt översatt, med namnen rättstavade. Lägg inte till något som inte sägs.
- vem: den som säger citatet, om det är en namngiven person på sidan (skribenten, en supporter med namn eller sitt forumnamn), annars null.
- vikt: 5 = det här säger mycket om hur han kommer att vara i den nya klubben, 3 = värt att veta, 1 = kuriosa.

Bara det som står på sidorna, ingenting ur minnet. Tal bara som de står där. Handlar en sida uppenbart om en annan person tar du inget ur den.

Svara bara med JSON, utan något före eller efter:
{"handlar_om": "en mening om vad förra klubbens supportrar säger", "uppgifter": [{"a": "spel", "t": "…", "s": "o", "artikel": 1, "citat": "…", "sagt": "…", "vem": null, "vikt": 4}]}`,
};
