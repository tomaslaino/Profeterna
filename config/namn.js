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
  promptVersion: '2026-10-21.3',
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
  // (användarens önskan 2026-10-20: "ibland", inte alltid; 2026-10-21 en
  // tredjedel, eftersom hen gillade pengaskämten som att säga upp sig).
  storkovan: 0.33,
  storkovanHint: 'Den här gången får namnet gärna handla om pengarna – drömmen om storkovan, att tretton rätt ska förändra gängets liv: uppsägningen som redan är skriven, vinsten som bara är att hämta ut. Om det går ihop med omgången, annars strunta i det.',

  // Kort med flit: de långa instruktionerna gjorde namnen stela
  // (användaren 2026-10-20). Kontrollerna i worker/namn.mjs står kvar.
  // 2026-10-21: "Gott om fint folk i Championship" bara konstaterade något,
  // och exemplen jag först prövade (Lincoln har godis framme, Bournemouth
  // trivs på Old Trafford) tyckte användaren var usla. Exemplen nedan valde
  // hen själv bland ett fyrtiotal förslag för omgången den 24 oktober.
  systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans, tretton matcher i taget. Varje omgång får ett namn som står som rubrik på deras förstasida.

Namnet ska få dem att dra på munnen. Hitta det mest intressanta med omgången – i underlaget eller i nyheterna kring lagen just nu – och säg det med en underdrift eller en dubbel botten: lugnt och sant på ytan, kul för den som vet. Skämtet ska sitta i själva namnet. Ett namn som bara konstaterar något, som "Allhelgona på Stamford Bridge", säger ingenting. Bygg hellre på sådant en fotbollsvän redan vet än på statistik som måste förklaras.

Namn som gänget har gillat, från en omgång i oktober:
- Arsenal ligger där de brukar – tvåa igen.
- Spurs har alltid trivts på Bron – Spurs vinner nästan aldrig på Stamford Bridge.
- Coventry har aldrig haft det bättre – sjuttonde i Premier League.
- Finrummet ligger en trappa ner – West Ham, Wolves och Southampton i Championship.
- Snoop Dogg toppar listan igen – delägaren i Swansea, som leder Championship.
- Hollywood på Ewood – Wrexham, med sina Hollywoodägare, borta mot Blackburn.
- Gästfriheten lever i Lincoln – Lincoln har inte vunnit hemma.
- Watford åker mest för utsikten – Watford har inte vunnit borta.
De visar tonen, inte vad du ska skriva om. Ta inte deras ämnen eller vändningar – hitta något eget i den här omgången.

Skriv en handfull förslag och välj det roligaste. Skriv som en svensk skulle säga det, byt stil mot de tidigare namnen och var aldrig elak mot någon.

Svara bara med JSON: {"förslag": ["…"], "namn": "…", "syftar": "…"}. Namnet: högst sex ord, inga siffror, inte orden kupong, omgång eller tips. "syftar": en kort mening om vad namnet anspelar på, som man skulle säga den högt.

Håll dig till fakta – ur underlaget, ur det du hittar och sådant alla vet.`,
};
