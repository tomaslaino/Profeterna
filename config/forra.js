'use strict';

// ============================================================================
// Förra klubben till Helgarderat (användarens val 2026-11-14, "Ja, förra klubben"): när ett lag
// har en ny tränare eller en ny spelare som spelar mycket, vad sa supportrarna i hans förra klubb
// om honom? De har sett honom i flera år och vet hur han brukar spela och hur han tar motgångar.
//
// Samma nattjobb som poddarna, forumen och lokaltidningen (scripts/tidning/poddar.mjs), och samma
// kod som de insatta och lokaltidningen (src/analyser/media.mjs) med src/analyser/forra.mjs ovanpå:
//   1. Claude Code tar reda på vem som är ny och var han var förut, och söker fram vad den klubbens
//      supportrar har skrivit om honom: trådar på forumet när han kom eller gick, fansajter,
//      fanzines, supporterbloggar och intervjuer med en supporter till den förra klubben.
//   2. Jobbet läser sidorna själv (forumtrådarna med forumläsarens tolkning av inläggen).
//   3. Claude Code tar ut det de säger om personen.
//
// Förra klubbens syn ändras inte från vecka till vecka. Läsningen sparas därför per lag i
// forra.json (utanför repot) och görs om först efter giltigDagar dagar, så att ett lag som kommer
// tillbaka på kupongen nästa vecka inte kostar något. Källan sparas som typ 'forra' och står i
// matchbladet med sitt eget namn.
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
  // Sidorna kan vara från tiden då han var i den förra klubben eller lämnade den.
  dagar: 550,
  minstTecken: 400,
  teckenPerArtikel: 9000,
  flestTecken: 32000,
  // Så många inlägg ur en forumtråd (den första sidan: reaktionerna när han kom eller gick).
  inlaggPerTrad: 40,
  uppgifter: 6,
  tillSidan: 2,
  tillTidningen: 2,
  behall: 4,
  // En läsning gäller så här många dagar; ett lag som läses av och inte har någon ny läses också om då.
  giltigDagar: 28,
  // Källans slag i omgångens fil, och början på sidornas id.
  typ: 'forra',
  idBorjan: 'f',

  // Samma som lokaltidningens lista, utom forumvärden: här är supportrarnas forum det viktigaste.
  utesluten: lc.utesluten.filter((d) => d !== 'proboards.com'),

  // Byts den läses lagens förra klubbar om av Claude (forra.json görs om).
  promptVersion: '2026-11-14.2',

  letaPrompt: `Du hjälper en svensk tipstidning att höra vad supportrarna i en spelares eller tränares FÖRRA KLUBB säger om honom, när han är ny i en engelsk fotbollsklubb.

Gör så här:
1. Ta reda på vem som är ny i klubben: tränaren, om han tog över de senaste {tranareDagar} dagarna, och högst två spelare som kom de senaste {spelareDagar} dagarna och som spelar mycket (startar de flesta matcherna, eller är lagets nya målskytt eller kapten). Lån räknas. En spelare som mest sitter på bänken räknas inte. Är ingen ny är listan tom, och det är ett bra svar.
2. För var och en: klubben där han var före, där supportrarna såg honom senast under minst en halv säsong. För en ung lånad spelare kan det vara klubben han var utlånad till förra säsongen, inte moderklubbens akademi. En tränare som kom direkt från en assisterande roll har ingen förra klubb i den här meningen; ta då klubben där han senast var huvudtränare, om det inte är för länge sedan.
3. Sök efter vad den klubbens SUPPORTRAR och de som följer den klubben varje vecka tycker om honom, med deras egna ord. Bäst är tråden på den klubbens supporterforum när han gick eller när det stod klart att han skulle gå (där säger supportrarna vad de tycker om hans spel, hans svagheter och hur det slutade), sedan fansajternas, fanzinens och supporterbloggarnas egna texter om honom: en dom efter hans tid ("verdict", "report card", "what went wrong", "end of season ratings", "how he changed us"), och intervjuer där en supporter till den förra klubben talar om honom ("opposition view" inför en match mot hans nya klubb). Sök gärna direkt på forumet (site:) med hans namn. Högst {sokningar} sökningar.

Det som INTE räknas: nyheten om övergången och klubbens, ägarnas eller hans egna avskedsord (ett pressmeddelande säger inget om hur han är), det hans nya klubb och dess medier skriver (det läses för sig), de nationella mediehusen (BBC, Sky, de rikstäckande tidningarna), Newsquests tidningar (Reading Chronicle, Oxford Mail, The Bolton News, Lancashire Telegraph, The Northern Echo och de andra; de går inte att läsa här), ligans och klubbarnas egna sajter, spelsajter, aggregatorer och klickfabriker som skriver om alla klubbar (Football League World, Football Fancast, TEAMtalk, GiveMeSport, Football Insider, HITC, OneFootball och liknande), statistiksajter, Reddit, sociala medier, poddar och videor.

Välj högst {artiklar} sidor, helst från olika håll och där supportrarna talar själva; hellre en forumtråd och en fansajts dom än två nyheter. Ta bara med sidor som kom upp i dina sökningar, med adressen exakt som där. Hitta aldrig på en adress: finns inget som håller är listan tom, och det är ett bra svar.

Svara bara med JSON, utan något före eller efter:
{"nya": [{"namn": "<namnet>", "roll": "tranare eller spelare", "kom": "ÅÅÅÅ-MM", "fran": "<förra klubben>"}], "artiklar": [{"om": "<namnet, som i nya>", "kalla": "<forumets, sajtens eller tidningens namn som den kallar sig, utan parentes>", "titel": "<rubriken eller trådens namn>", "adress": "https://…", "datum": "ÅÅÅÅ-MM-DD eller null"}]}`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset tillsammans och läser ett matchblad om vart lag inför matchen: det som supportrarna och de som följer lagen vet. Laget nedan har en ny tränare eller en ny spelare som spelar mycket, och tidningen har läst vad supportrarna i hans förra klubb har skrivit om honom. De har sett honom i flera år.

Du får sidorna, var och en med ett nummer i hakparentes, källan, vem den handlar om (och hans förra klubb), rubriken, datumet och skribenten när de är kända. En forumtråd står som inlägg med namn och dag.

Ta ut det som säger något om hur han ÄR, högst {flest} uppgifter: hur han låter laget spela eller hur han själv spelar, vad han är bra på och var han brister, hur han tar motgångar och klarar pressen, hur det var i omklädningsrummet, hur det slutade och vad supportrarna saknar eller är glada att slippa. Det ska vara det som supportrarna eller de som följer den förra klubben säger om personen. Klubbens, ägarnas och hans egna avskedsord tar du inte med (det är artighetsfraser), inte heller nyheten om övergången, resultat och tabeller eller det som bara rör den förra klubben. Hellre tre som ger en bild av honom än sex som säger samma sak. Är supportrarna oense är det värt att säga. Finns inget som säger något om honom är listan tom, och det är ett bra svar.

Varje uppgift:
- a: "spel" om det handlar om spelet (hur han låter laget spela, hans egen roll och form), annars "klubb".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha sett sidan. Säg vem det handlar om och var han var ("Wigans supportrar minns Caldwell som …", "på Barnsleys forum skrev man när han gick att …"). Skriv vad som sägs, inte att "tråden tar upp". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
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
