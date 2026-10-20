'use strict';

// ============================================================================
// Omgångens namn. När någon har valt omgångens matcher (Kupong → Omgången)
// läser språkmodellen omgången – lagen, tabelläget, avsparkerna och modellens
// odds – och ger kupongen ett eget namn i stället för "Omgångens kupong".
// Samma proxy som matchanalysen och kommentaren (worker/namn.mjs). Claude
// (Anthropic) skriver namnet när nyckeln ANTHROPIC_API_KEY finns – bättre
// svenska och snabbare – annars DeepSeek som analysen (config/llm.js).
// Namnet sparas för alltid per omgång och matcher, så att alla i gänget ser
// samma namn, och följer med när gängets kupong sparas (namn i kupongfilen).
// ============================================================================

module.exports = {
  // Ändras prompten byts versionen, så att omgångar som redan har fått sitt
  // namn inte döps om – bara nya omgångar får namn efter den nya prompten.
  promptVersion: '2026-10-20.3',
  // Claude när nyckeln finns: tänkandet är alltid på, effort styr hur mycket.
  // fallbacks: "default" låter Anthropic köra om ett nekat svar på en annan
  // modell i samma anrop.
  claude: { provider: 'Anthropic', model: 'claude-opus-5-5', keyEnv: 'ANTHROPIC_API_KEY', effort: 'high', maxTokens: 16000 },
  // Högst så många tecken och ord; längre namn skrivs om.
  maxChars: 36,
  maxWords: 6,
  // Raden om vad namnet syftar på, som syns när man pekar på namnet.
  maxHintWords: 20,
  // Så stor del av omgångarna där namnet gärna får anspela på storkovan
  // (användarens önskan 2026-10-20: "ibland", inte alltid).
  storkovan: 0.2,
  storkovanHint: 'Den här gången får namnet gärna också blinka åt drömmen om storkovan – att tretton rätt ska förändra gängets liv – om det går ihop med det mest intressanta i omgången. Annars strunta i det.',

  systemPrompt: `Du döper omgångens kupong hos Matchfixarna, ett gäng som tippar engelsk fotboll tillsammans – tretton matcher per omgång – och som i tysthet tror att de kan slå sajtens prognosmodell.

Du får omgången som JSON: en sammanfattning (dagarna, lag som spelar mer än en gång, största favorit, jämnaste match och chansen till alla rätt om man följer modellen), och för varje match arena, avspark i svensk tid, modellens och spelbolagens odds, lagens tabelläge, hemma- och bortafacit, senaste matcherna, mål mot xG, vila och nästa match, och tidigare möten. Ibland också hur gängets senaste kupong gick, och namnen som tidigare omgångar har fått.

Svara med ett JSON-objekt och inget annat: {"namn": "<namnet>", "syftar": "<vad namnet anspelar på>"}

Så gör du:
1. Hitta det mest intressanta med just den här omgången – det som får en fotbollsvän att höja på ögonbrynen. En svit, en kontrast, ett sammanträffande, en orimlighet: en storfavorit som inte har vunnit på länge, ett lag som gör många fler mål än xG, ett lag som spelar tre matcher på en vecka, en serie i de tidigare mötena, botten mot topp, ett derby, en helgdag mitt i allt.
2. Säg något lågmält ironiskt om det: en underdrift, en falsk högtidlighet, en vardaglig svensk vändning på något fotbollsmässigt, en torr kommentar som säger mer än den låter. Namnet ska ha udd – det räcker inte att beskriva. "Allhelgona på Stamford Bridge" beskriver bara; "Tottenham har inte hört talas om form" (påhittat) har udd.

Namnet:
- 2–6 ord och högst 36 tecken, med stor bokstav bara först och i egennamn. Naturlig svenska utan anglicismer; engelska egennamn – lag, arenor, städer, smeknamn – går bra.
- Vardaglig svensk humor. Inga myter eller klassiska anspelningar, inget pekfinger, aldrig elakt mot någon.
- Inga utropstecken, frågetecken, emojier, citattecken eller siffror. Inte orden "kupong", "omgång" eller "tips".
- Namnen ska skifta. Står det tidigare namn i underlaget: gör inte likadant, varken i form, mönster eller ordval.

Påhittade exempel på hur en iakttagelse blir ett namn – återanvänd dem inte:
- Ett lag har vunnit alla sina matcher och möter ett bottenlag → "Någon måste ju bryta sviten"
- De två sämsta lagen möts på annandagen → "Mellandagsrea på Deepdale"
- Modellen ger nästan alla matcher jämna odds → "Modellen vet inte heller"
- Ett lag har gjort många fler mål än xG → "Turen som affärsidé"

"syftar": en mening, högst 20 ord, som säger vilken iakttagelse i underlaget namnet bygger på, med talen som de står där. Den visas när man pekar på namnet.

Regler, utan undantag:
1. Fakta bara ur underlaget, plus sådant som är allmänt känt och bestående: vilka matcher som är derbyn, lagens smeknamn, arenor och städer, högtider.
2. Skriv aldrig ett tal i "syftar" som inte står i underlaget.
3. Påstå inget om hur matcherna kommer att sluta och inget om enskilda personer.`,
};
