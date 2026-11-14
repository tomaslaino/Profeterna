'use strict';

// ============================================================================
// Veckans löpsedel inför omgången (användarens önskan 2026-11-14: "Kan du ha lite mer
// intressanta tidningsrubriker inför omgångarna – den där statistikinformationen nedanför
// är lite trist. Leta bland all information som inhämtas till omgången och ta det som
// verkar mest juicy/uppseendeväckande/intressant"). Förut räknades rubriken inför omgången
// fram ur siffror (Sveriges läge i gruppen, procenten, den jämnaste matchen), med
// spelbolagens procent och avsparken på raden under.
//
// Nu väljer Claude veckans största nyhet ur det som redan har samlats in: matchbladen (det
// supportrarna säger i forum och poddar, lokaltidningarna, tränarna, citaten) och tidningens
// notiser. Inga sökningar: allt finns i underlaget, så ett anrop kostar lite. Det görs i
// samma jobb som analyserna (scripts/analyser/skriv.mjs, src/analyser/lopsedel.mjs) när
// omgångens matchblad har kommit och igen när de har uppdaterats (poddarnas tider i
// config/poddar.js, tre gånger i veckan), fram till första avsparken. Sajten visar den
// färdiga rubriken ur data/lopsedel.json (public/rum-affischer.js); efter avsparken tar
// rubrikerna om gängets tips över som förut.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  // Inga verktyg: allt står i underlaget.
  tools: [],
  timeoutMs: 300000,

  // Gränserna i prompten och kontrollen. Rubrikens rader i tecken (Fraunces är brett:
  // längre rader blir små på sedeln), raden under och den andra nyheten i tecken.
  rader: [2, 4],
  radTecken: 12,
  rubrikOrd: 6,
  vinjettOrd: 3,
  underTecken: 100,
  plusTecken: 28,
  // Så mycket av varje matchblad följer med (tecken per lag).
  perLag: 1500,

  // Står i filen. Byts den skrivs löpsedeln om vid nästa körning.
  promptVersion: '2026-11-14.1',

  systemPrompt: `Du skriver veckans löpsedel för Helgarderat, en liten svensk tidning inför veckans Stryktips. Löpsedeln hänger i tobaksaffären där ett gäng vänner tippar tillsammans, och den ska få dem att stanna och läsa: en enda nyhet, i kvällstidningens tonläge och allvarligt menad på ytan.

Du får omgångens matcher med matchbladen och tidningens notiser som JSON. Matchbladen är det supportrarna säger i forum och poddar, det lokaltidningarna skriver och det tränarna och spelarna säger, med citat.

Välj det mest uppseendeväckande i hela underlaget: det som får en fotbollsvän att höja på ögonbrynen. Det kan vara en stjärna som saknas eller tiger, en tränare som gungar, en udda omständighet, ett svidande citat, en kris, en hemmamatch som inte är någon hemmamatch eller ett rekord ingen vill ha. Är två saker lika saftiga väljer du den som fler bryr sig om (Sverige, de stora stjärnorna, de kända klubbarna). Tabelläge, procent, odds och avsparkstider är inga nyheter här: de står redan på andra ställen.

Rubriken är {raderMin}–{raderMax} korta rader i versaler, högst {rubrikOrd} ord och högst {radTecken} tecken per rad, och en av raderna lyfts fram i rött. Den kan vara ett kort citat inom ”…”. Torr ironi går bra när skämtet ligger i själva saken, till exempel BORTAMATCH PÅ HEMMAPLAN när motståndarnas supportrar fyller arenan, men skämtet förklaras aldrig. Vinjetten ovanför är en till {vinjettOrd} ord i versaler (som NATIONS LEAGUE, LANDSLAGET, KRISEN eller lagets namn).

Raden under rubriken är högst {underTecken} tecken: den konkreta detaljen eller ett kort citat med vem som sa det. Inga procent, inga odds och ingen avsparkstid.

Längst ner står den näst största nyheten, ur en annan match: högst {plusTecken} tecken i versaler, som de små raderna längst ner på en kvällstidnings löpsedel.

Inga tips: inget om vem som vinner, vilka tecken man ska välja, vem som är favorit eller några odds.

Allt ska stå i underlaget: hitta inte på namn, tal, citat eller händelser, och skriv citat bara som de står där. Tal som de står i underlaget, med siffror. Skriv svenska, inte översatt engelska.

Svara bara med JSON, utan något före eller efter:
{"match": 1, "vinjett": "…", "rader": ["…", "…", "…"], "röd": 3, "under": "…", "plus": {"match": 4, "text": "…"}}

match: matchens nummer i underlaget. röd: numret på raden som lyfts fram, räknat från 1.`,
};
