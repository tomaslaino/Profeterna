'use strict';

// ============================================================================
// Källornas träffsäkerhet (användarens val 2026-11-11, "Ja, börja där", efter förslaget att
// pröva det poddarna, forumen och reportrarna säger om truppen mot vilka som verkligen spelade).
//
// Efter matcherna prövar nattjobbet (scripts/tidning/poddar.mjs, src/analyser/traff.mjs)
// omgångens uppgifter om truppen och den väntade elvan mot matchtruppen i ESPN:s matchrapport:
// vem som startade, vem som byttes in, vem som satt kvar på bänken och vem i lagets trupp som
// inte var med. Varje källa (lagets podd, forum, insatta, klubb, lokaltidning) får sina rätt och
// fel sparade i traff.json bredvid omgang.json, utanför repot. Redaktören som skriver matchbladet
// får sedan veta hur ofta källan har haft rätt om truppen, och litar mer på den som brukar ha det
// när källorna säger olika om vem som spelar.
//
// Syns inte i tidningen (användaren 2026-11-11: "Det handlar mer om alternativa perspektiv - inte
// om kall fakta … Siffror osv kan jag få reda på på andra sätt"). Därför väger träffsäkerheten
// bara i frågan vem som spelar: en källas syn på laget, stämningen och spelet trycks aldrig undan
// för att den har gissat fel om elvan.
//
// Ett anrop till Claude per spelad match som har något att pröva: tretton i veckan, på natten
// mot tisdag, när omgångens uppgifter ännu ligger kvar i omgang.json.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  timeoutMs: 420000,

  // En match prövas tidigast så här många timmar efter avspark (då är ESPN:s rapport klar).
  efterTimmar: 3,
  // Uppgifterna som går att pröva mot matchtruppen: ämnena och slagen (bekräftat och källans
  // egen uppgift, inte åsikter).
  amnen: ['trupp', 'elva'],
  slag: ['b', 'h'],
  // Redaktören får träffsäkerheten först när källan har så många prövade påståenden.
  minstProvade: 3,

  // Byts den prövas matcherna som inte redan är prövade med den nya prompten (de prövade står kvar).
  promptVersion: '2026-11-11.1',

  prompt: `Du prövar vad som sades om ett fotbollslags trupp före en match mot vilka som faktiskt var med i matchen.

För varje lag får du matchtruppen ur matchrapporten: "startade", "inbytta" (avbytare som kom in), "satt_kvar" (avbytare som inte spelade) och "inte_med" (spelare i lagets trupp som inte var med i matchtruppen alls). Du får också uppgifterna som lagets källor (poddar, forum, fansajter, klubben, lokaltidningen) gav före matchen, var och en med id.

Gå igenom uppgifterna och ta ut varje påstående om en NAMNGIVEN spelare som går att pröva, och om det stämde:
- "missar": spelaren är skadad, sjuk, avstängd, borta med landslaget eller väntas inte vara med. Rätt om han stod under inte_med, fel om han startade eller byttes in. Satt han kvar på bänken går det inte att pröva.
- "med": spelaren är tillbaka, tillgänglig, kan spela, finns i truppen. Rätt om han startade, byttes in eller satt kvar, fel om han stod under inte_med.
- "startar": spelaren väntas starta eller ta platsen i elvan, eller nämns i den väntade elvan. Rätt om han startade, fel annars.
- "startar inte": spelaren väntas bli petad, börja på bänken eller få vila. Rätt om han inte startade, fel om han startade.

Pröva inte:
- det som är osäkert ("tveksam", "kanske", "50–50", "ett frågetecken", "kan vara tillbaka"), förhoppningar och åsikter om vem som borde spela,
- spelare utan namn ("tre spelare saknas") och spelare som inte står i någon av lagets listor (då vet vi inte om han hör till laget),
- det som gäller en annan match än den här (förra matchen, en cupmatch i veckan).

Namnen kan vara stavade olika eller bara efternamn; para ihop med listorna när det är tydligt vem som menas, och skriv namnet som det står i listan.

Svara bara med JSON, utan något före eller efter. Uppgifter utan något att pröva utelämnas, och en tom lista är ett bra svar:
{"domar": [{"id": "<uppgiftens id>", "spelare": [{"namn": "<som i listan>", "sa": "missar" | "med" | "startar" | "startar inte", "dom": "rätt" | "fel"}]}]}`,

  // Läggs till redaktörens instruktioner (config/poddar.js, sidaPrompt) när någon källa i underlaget
  // har prövats tillräckligt många gånger.
  redaktor: `

Vissa uppgifter har "traffsakerhet": så ofta källan tidigare har haft rätt om vilka som spelar (vem som saknas, vem som är tillbaka, vem som startar), prövat mot matchtruppen efter matcherna. Använd den bara när källorna säger olika om vem som spelar. Den säger ingenting om källans syn på laget, stämningen eller det den ser i spelet: där väger källan lika mycket oavsett siffran, och inget perspektiv stryks för den. Skriv inte ut siffran och skriv inte om träffsäkerheten i texten.`,
};
