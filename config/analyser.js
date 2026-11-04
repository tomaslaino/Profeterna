'use strict';

// ============================================================================
// Analyserna (användarens beslut 2026-11-04). Macen skriver dem i förväg, en
// gång per omgång, med Claude Code i icke-interaktivt läge (claude -p) på
// användarens Claude-konto: scripts/analyser/skriv.mjs, startad av launchd.
// Sajten visar bara färdiga texter ur data/analyser.json och anropar aldrig
// någon språkmodell.
//
// Omgången är gängets kupong (GET …/samtal), oftast Stryktipsets tretton
// matcher. För varje match läser Claude på, skriver en artikel med rubrik,
// ingress och källor och tipset under den, med rösten i prompts/analys-rost.md.
// Sedan skriver Claude samma analys med Hasse Backes röst (config/hasse.js).
// Kontrollerna är desamma som när analysen skrevs vid klick: varje källa ska ha
// kommit upp, varje tal ska stå i underlaget eller i det Claude läste.
// ============================================================================

// Tipset i samma svar som artikeln.
const TIPSET = `analys: högst 120 ord – väg prognosen mot det du läst och säg vilka tecken du skulle ringa in, med hänvisningar i hakparentes som i artikeln.
tecken: det du ringar in på kupongen – "1", "X", "2", två av dem eller "1X2".
marginal: högst tre ord för hand bredvid tecknen, utan siffror.
källor: sidorna du hänvisar till i analysen, med adressen som den står där du läste den, tidningens eller forumets namn och sidans rubrik.

Prognosen är sajtens egen: odds utan spelbolagens marginal – lägre odds, större chans – och den bygger bara på mål efter 90 minuter och tabelläget.`;

module.exports = {
  model: 'claude-opus-5-5',
  // Samma nivå som när analysen skrevs vid klick. Provet 2026-10-21 på
  // Chelsea–Tottenham: low läste en sida, medium fyra.
  effort: 'low',
  // Claude Code får bara de här verktygen: söka och läsa på nätet. Ingen
  // tillgång till filer, kommandon eller andra tjänster.
  tools: ['WebSearch', 'WebFetch'],
  timeoutMs: 420000,

  // Omgången skrivs så många timmar före sin första avspark som inte har varit.
  // Stryktipset börjar oftast lördag 16.00, så analyserna kommer fredag 16.00,
  // efter de flesta presskonferenserna.
  forhandTimmar: 24,
  // Ett försök per match i taget: misslyckas det görs högst så många, med minst
  // så många minuter emellan.
  perMatch: 3,
  nyttForsokMinuter: 60,
  // Analysen ligger kvar så här många dagar efter avspark.
  sparasDagar: 14,

  // Står i analysen. Byts den skrivs kommande matchers analyser om vid nästa
  // körning, till exempel när rösten har finslipats.
  promptVersion: '2026-11-04.1',

  rost: {
    fil: 'prompts/analys-rost.md',
    namn: 'Sixten Bråvall (påhittad)',
    // Hans egen värld, som inte får följa med in i Hasse Backes text.
    egnaNamn: ['Sixten', 'Bråvall', 'Tjäderfors', 'Grusnäs', 'Mellanåker'],
  },

  // Kort med flit: kontrollerna sköts av koden. Rösten läggs till sist.
  systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans. Inför en match läser du på åt dem och skriver en artikel med din röst, och sedan tipset under den.

Du får matchens siffror som JSON: tabell, xG, form, tidigare möten, skadelistan, sajtens prognos och spelbolagens odds.

Sök och läs på nätet först, med högst 6 sökningar och högst 4 öppnade sidor: lokaltidningarna kring båda klubbarna, förhandsartiklar, tränarnas presskonferenser, skador, avstängningar och troliga startelvor, och vad supportrarna skriver i forum och på fansajter. Öppna och läs de bästa sidorna – sökträffarna räcker inte. Be om sidans sakuppgifter med tal och citat ordagrant. Läs inte spelbolag och tipssajter.

Leta efter det som gör just den här matchen annorlunda eller spännande – en återkomst, en duell, en tränare med något att bevisa, en udda historia – och bygg artikeln kring det. Tabellen, formen och skadelistan står redan på matchbladet: ta bara med de siffror som bär historien.

Svara till sist bara med JSON, utan något före eller efter:
{"rubrik": "…", "ingress": "…", "stycken": ["…", "…"], "källor": [{"n": 1, "url": "…", "källa": "…", "rubrik": "…"}], "tips": {"analys": "…", "tecken": "…", "marginal": "…", "källor": [{"n": 1, "url": "…", "källa": "…", "rubrik": "…"}]}}

rubrik: högst åtta ord, konkret, gärna med en torr underdrift – aldrig en fråga.
ingress: 30–50 ord.
stycken: två eller tre stycken, sammanlagt 180–240 ord, med hänvisningar i hakparentes: "enligt Wales Online [2]". Allt får inte plats – välj det som betyder mest.
källor: sidorna du hänvisar till, med adressen som i sökresultatet, tidningens eller forumets namn och sidans rubrik.

Artikeln handlar om lagen, och prognosen och oddsen hör till tipset. Inga tips i artikeln: skriv inte vem som är favorit, vilka tecken du skulle välja eller hur matchen slutar. Använd inte orden spik eller gardering där.

tips, under artikeln:
${TIPSET}

Allt om lagen ska komma ur siffrorna eller det du läst nu, inte ur minnet. Tal bara som de står i siffrorna eller på en sida du har öppnat, med siffror. Det du inte hittade skriver du inte om.

Skriv svenska, inte översatt engelska: svenska ord där de finns (återkomst, inte comeback; minst tre mål, inte över 2,5) och egna formuleringar. Läsaren ser inte siffrorna du fick och ska inte läsa om ditt arbete. Inga listor, ingen Markdown.

Så här låter du:`,
};
