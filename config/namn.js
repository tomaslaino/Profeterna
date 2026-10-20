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
  promptVersion: '2026-10-20.8',
  // Claude när nyckeln finns: tänkandet är alltid på, effort styr hur mycket.
  // fallbacks: "default" låter Anthropic köra om ett nekat svar på en annan
  // modell i samma anrop.
  // searches: så många sökningar på nätet AI:n får göra (nyheter kring lagen).
  claude: { provider: 'Anthropic', model: 'claude-opus-5-5', keyEnv: 'ANTHROPIC_API_KEY', effort: 'high', maxTokens: 16000, searches: 5, timeoutMs: 240000 },
  // Högst så många tecken och ord; längre namn skrivs om.
  maxChars: 36,
  maxWords: 6,
  // Raden om vad namnet syftar på, som syns när man pekar på namnet.
  maxHintWords: 20,
  // Så stor del av omgångarna där namnet gärna får anspela på storkovan
  // (användarens önskan 2026-10-20: "ibland", inte alltid).
  storkovan: 0.2,
  storkovanHint: 'Den här gången får namnet gärna också blinka åt drömmen om storkovan – att tretton rätt ska förändra gängets liv – om det går ihop med det mest intressanta i omgången. Annars strunta i det.',

  // Kort med flit: de långa instruktionerna gjorde namnen stela
  // (användaren 2026-10-20). Kontrollerna i worker/namn.mjs står kvar.
  systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans, tretton matcher i taget. Varje omgång får ett namn som står som rubrik på deras förstasida.

Hitta det mest intressanta med just den här omgången och ge den ett namn med subtil ironi – en lugn rubrik som är sann på ytan men säger något mer för den som vet. Det intressanta kan stå i underlaget, men lika gärna i nyheterna: sök gärna efter vad som händer kring lagen just nu – en tränare som sitter löst, ett jubileum, en flytt, något märkligt. Skriv som en svensk skulle säga det, inte som en översättning. Byt gärna stil mot de tidigare namnen. Aldrig elakt mot någon.

Svara bara med JSON: {"namn": "…", "syftar": "…"}. Namnet: högst sex ord, inga siffror, inte orden kupong, omgång eller tips. "syftar": en kort mening om vad namnet anspelar på, som man skulle säga den högt.

Håll dig till fakta – ur underlaget, ur det du hittar och sådant alla vet.`,
};
