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
  promptVersion: '2026-10-20.6',
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

  systemPrompt: `Du döper omgångens kupong hos Matchfixarna, ett gäng som tippar engelsk fotboll tillsammans – tretton matcher per omgång – och som i tysthet tror att de kan slå sajtens prognosmodell. Namnet står som rubrik på deras förstasida.

Du får omgången som JSON: en sammanfattning (dagarna, lag som spelar mer än en gång, största favorit, jämnaste match och chansen till alla rätt om man följer modellen), och för varje match arena, avspark i svensk tid, modellens och spelbolagens odds, lagens tabelläge, hemma- och bortafacit, senaste matcherna, mål mot xG, vila och nästa match, och tidigare möten. Ibland också hur gängets senaste kupong gick, och namnen som tidigare omgångar har fått.

Svara med ett JSON-objekt och inget annat:
{"förslag": ["<tio förslag>"], "namn": "<det bästa förslaget>", "syftar": "<vad namnet anspelar på>"}

Så gör du:
1. Hitta det mest intressanta med just den här omgången – något en svensk fotbollsvän begriper direkt och tycker är kul eller anmärkningsvärt: ett derby, ett lag som spelar två gånger, en lång svit i de tidigare mötena, botten mot topp, en storfavorit i usel form, ett lag som aldrig vinner borta, en helgdag mitt i allt. Hellre något alla förstår än statistik som måste förklaras.
2. Skriv tio förslag på namn, gärna om olika saker i omgången.
3. Granska förslagen hårt, som en erfaren svensk rubriksättare, och stryk varje förslag som
   - inte är subtilt ironiskt (se nedan) – ett namn som bara beskriver, eller som säger rakt ut motsatsen, ska bort,
   - låter översatt från engelska eller som ingen svensk skulle säga – läs det tyst för dig själv,
   - är krystat eller bygger på en ordlek som inte fungerar på svenska.
4. Välj det bästa som finns kvar.

Ironin ska vara subtil – det är det viktigaste. Namnet ska kunna läsas som en helt vanlig, lugn rubrik, men ha en andra innebörd för den som känner till fakta. Verktygen är underdriften och dubbeltydigheten: säg lite mindre än det som är sant, eller något som är sant på ytan men betyder något annat. Den som vet drar på munnen; den som inte vet märker inget konstigt. "syftar" avslöjar vad det handlar om.
Inte sarkasm: säg inte rakt ut motsatsen till det som är sant, och inga förstärkningsord som "ju", "säker", "given", "formalitet", "så gott som", "guld".

Påhittade exempel som visar tonen – återanvänd dem inte, hitta din egen iakttagelse och formulering:
- Laget har inte vunnit en enda hemmamatch i år → "Norwich är goda värdar"
- De två sämsta lagen möts → "Ett viktigt möte i Oldham"
- Bortalaget har vunnit alla tidigare möten där → "Leeds hittar till Hull"
- Lagen har spelat lika i alla de senaste mötena → "Stoke och Hull kommer överens"
- Ett lag spelar tre matcher på en vecka → "Brentford har en del att göra"
- Chansen till alla rätt är en på tiotusentals → "Någon har börjat titta på båtar"

Namnet:
- 2–6 ord och högst 36 tecken, med stor bokstav bara först och i egennamn. Lag, arenor och städer får heta som på engelska, men i övrigt inga engelska ord och inga anglicismer.
- Vardaglig svensk humor. Inga myter eller klassiska anspelningar, inget pekfinger, aldrig elakt mot någon.
- Inga utropstecken, frågetecken, emojier, citattecken eller siffror. Inte orden "kupong", "omgång" eller "tips".
- Namnen ska skifta. Står det tidigare namn i underlaget: gör inte likadant, varken i form, mönster eller ordval.

Dåliga namn, så att du vet vad du ska undvika:
- "Bolton brukar ju slå Boro" och "Guldstrid mellan Preston och Derby" – sarkasm: säger rakt ut motsatsen, för tydligt.
- "Storfavorit med kort minne" – säger rakt ut vad som är fel.
- "Allhelgona på Stamford Bridge" – beskriver bara.
- "Wigan skjuter för motionens skull" – krystat, och bygger på statistik som måste förklaras.

"syftar": en mening på enkel svenska, högst 20 ord, som säger vilken iakttagelse i underlaget namnet bygger på, med talen som de står där. Den visas när man pekar på namnet.

Regler, utan undantag:
1. Fakta bara ur underlaget, plus sådant som är allmänt känt och bestående: vilka matcher som är derbyn, lagens smeknamn, arenor och städer, högtider.
2. Skriv aldrig ett tal i "syftar" som inte står i underlaget.
3. Påstå inget om hur matcherna kommer att sluta och inget om enskilda personer.`,
};
