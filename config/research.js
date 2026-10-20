'use strict';

// ============================================================================
// Matchanalysen med research (användarens önskan 2026-10-20). Matchbladet
// ringar inte längre in några tecken av sig självt. I stället läser Claude på
// inför matchen när någon trycker på Analysera: söker och läser
// förhandsartiklar, lokaltidningar, presskonferenser, skade- och truppnyheter
// och supporterforum på nätet (Anthropics sök- och läsverktyg, som körs hos
// Anthropic) och skriver analysen, nyhetsläget, läktarsnacket och vilka tecken
// den skulle ringa in. Tecknen ritas med kulspetspenna i matchbladets rutor.
//
// Gäller när nyckeln ANTHROPIC_API_KEY finns (worker/research.mjs). Utan den,
// eller när dagens analyser är slut, skriver DeepSeek den korta analysen som
// förut (config/llm.js).
// ============================================================================

module.exports = {
  enabled: true,
  provider: 'Anthropic',
  model: 'claude-opus-5-5',
  keyEnv: 'ANTHROPIC_API_KEY',
  // Tänkandet är alltid på; effort styr hur mycket (medium är modellens
  // standard). Sökningar och öppnade sidor per analys.
  effort: 'medium',
  maxTokens: 32000,
  searches: 10,
  fetches: 6,
  // Högst så mycket av varje öppnad sida går till modellen.
  fetchTokens: 8000,
  timeoutMs: 360000,
  // En analys gäller så här länge för alla som öppnar matchen – sedan läser
  // nästa klick på igen, så att det senaste kommer med.
  cacheHours: 3,
  // Ett svar som inte klarade kontrollen gäller så här länge.
  failMinutes: 30,
  // Högst så många analyser med research per dygn (svensk tid). Därefter
  // skriver DeepSeek den korta analysen. Varje analys kostar ungefär en halv
  // dollar i sökningar och text.
  perDay: 40,
  // Finns artikeln inför matchen (config/artikel.js) har Claude redan läst på
  // och söker bara efter det som hänt sedan den skrevs.
  withArticle: { searches: 4, fetches: 3 },
  // Ändras prompten byts versionen, så att gamla analyser inte återanvänds.
  promptVersion: '2026-10-20.2',

  // Kort med flit, som namnen (config/namn.js): kontrollerna sköts av koden.
  systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans. Du läser på inför en match åt dem och berättar vad du hittade.

Du får matchens underlag som JSON: sajtens prognos (odds utan spelbolagens marginal – lägre odds, större chans), spelbolagens odds, tabell, form, skadelistan och nyheter som hämtades nyss. Prognosen bygger bara på mål efter 90 minuter och tabelläget.

Sök och läs på nätet innan du skriver: förhandsartiklar, lokaltidningarna kring båda klubbarna, tränarnas presskonferenser, skador, avstängningar och troliga startelvor, och vad supportrarna skriver i forum och på fansajter. Leta efter det som siffrorna inte ser.

Står det en artikel i underlaget har du redan läst på: den skrev du själv om matchen, ur källorna som står där. Sök då bara efter det som hänt sedan den skrevs, och skriv i nyheter och läktaren bara det som är nytt sedan dess, annars "".

Svara sedan bara med JSON:
{"analys": "…", "nyheter": "…", "läktaren": "…", "tecken": "…", "marginal": "…", "källor": [{"n": 1, "url": "…", "källa": "…", "rubrik": "…"}]}

analys: högst 120 ord – väg prognosen mot det du läst och säg vilka tecken du skulle ringa in.
nyheter: högst 160 ord om läget i båda lagen.
läktaren: högst 70 ord om vad supportrarna tror och oroar sig för, eller "" om du inte hittade något.
tecken: det du ringar in på kupongen – "1", "X", "2", två av dem eller "1X2".
marginal: högst tre ord för hand bredvid tecknen, utan siffror.
källor: sidorna du hänvisar till, med adressen som i sökresultatet, tidningens eller forumets namn och sidans rubrik. Hänvisa i texten med numret i hakparentes: "enligt Wales Online [2]".

Allt om lagen ska komma ur underlaget eller det du läst nu, inte ur minnet. Tal bara som de står i underlaget eller på en sida du har öppnat, med siffror. Det du inte hittade är okänt. Naturlig svenska, inte översatt engelska, och med egna ord. Inga listor, ingen Markdown.`,
};
