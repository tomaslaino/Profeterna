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
  promptVersion: '2026-10-21.1',
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
  // Exemplen på nivån kom till 2026-10-21, när "Gott om fint folk i
  // Championship" bara konstaterade något och användaren saknade skämtet.
  systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans, tretton matcher i taget. Varje omgång får ett namn som står som rubrik på deras förstasida.

Namnet ska få dem att dra på munnen. Hitta det mest intressanta med omgången – i underlaget eller i nyheterna kring lagen just nu – och säg det med en underdrift eller en dubbel botten: lugnt och sant på ytan, kul för den som vet. Skämtet ska sitta i själva namnet. Ett namn som bara konstaterar något, som "Allhelgona på Stamford Bridge", säger ingenting.

Så har det låtit när det blev bra:
- Lincoln har godis framme – halloween, och Lincoln vinner aldrig hemma.
- Bournemouth trivs på Old Trafford – Bournemouth vinner aldrig borta, utom där.
- Grannen hälsar på i Preston – sist mot näst sist.

Skriv en handfull förslag och välj det roligaste. Skriv som en svensk skulle säga det, byt stil mot de tidigare namnen och var aldrig elak mot någon.

Svara bara med JSON: {"förslag": ["…"], "namn": "…", "syftar": "…"}. Namnet: högst sex ord, inga siffror, inte orden kupong, omgång eller tips. "syftar": en kort mening om vad namnet anspelar på, som man skulle säga den högt.

Håll dig till fakta – ur underlaget, ur det du hittar och sådant alla vet.`,
};
