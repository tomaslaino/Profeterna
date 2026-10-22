'use strict';

// ============================================================================
// Analysera i matchbladet (användarens önskan 2026-10-20: "som motorn i
// grävergrav"; artikeln och tipset ihopslagna 2026-10-22). När någon trycker
// på Analysera i matchbladets flik Analysera läser Claude på – lokaltidningar,
// förhandsartiklar, presskonferenser, skade- och truppnyheter och
// supporterforum – och skriver en artikel med rubrik, ingress och källor. I
// samma samtal får Claude sedan sajtens prognos och spelbolagens odds och
// ringar in sina tecken utan att söka igen: allt den läst ligger kvar i
// cachen. Artikeln och tipset sparas och visas sedan för alla.
//
// Artikeln skrivs innan Claude ser prognosen och oddsen, och ger inga tips;
// tipset står under den. Är tipset äldre än tip.refreshHours skriver Claude
// om bara tipset när någon trycker på Analysera igen – ur artikeln och
// nyheterna som hämtas just då (src/news.mjs), utan att söka på nätet.
//
// Skrivs av proxyn profeterna-analys (POST /artikel, worker/artikel.mjs) bara
// när någon ber om den – sedan 2026-10-21 inte längre på ett schema, så att
// ingen artikel betalas som ingen läser. Kräver nyckeln ANTHROPIC_API_KEY.
// Vad varje försök kostade sparas med det (costOf i worker/artikel.mjs).
// ============================================================================

// Tipset: samma svar i artikelns samtal och när det skrivs om.
const TIPSET = `{"analys": "…", "tecken": "…", "marginal": "…", "källor": [{"n": 1, "url": "…", "källa": "…", "rubrik": "…"}]}

analys: högst 120 ord – väg prognosen mot det du läst och säg vilka tecken du skulle ringa in, med hänvisningar i hakparentes som i artikeln.
tecken: det du ringar in på kupongen – "1", "X", "2", två av dem eller "1X2".
marginal: högst tre ord för hand bredvid tecknen, utan siffror.
källor: sidorna du hänvisar till i analysen, med adressen som den står där du läste den, tidningens eller forumets namn och sidans rubrik.

Prognosen är sajtens egen: odds utan spelbolagens marginal – lägre odds, större chans – och den bygger bara på mål efter 90 minuter och tabelläget.`;

module.exports = {
  enabled: true,
  provider: 'Anthropic',
  model: 'claude-opus-5-5',
  keyEnv: 'ANTHROPIC_API_KEY',
  // Tänkandet är alltid på; low tänker minst. Provet 2026-10-21 på
  // Chelsea–Tottenham: low 0,23 dollar (en sida läst, samma vinkel), medium
  // 0,52 dollar (fyra sidor, rikare). Sökningar och öppnade sidor per
  // artikel. Tipset skrivs med samma inställning, så att samtalet hittills
  // läses ur cachen.
  effort: 'low',
  maxTokens: 32000,
  searches: 6,
  fetches: 4,
  fetchTokens: 4000,
  timeoutMs: 420000,
  // Artikeln kan skrivas tidigast så många dagar före avspark.
  aheadDays: 7,
  // Högst så många försök per match (lyckade och misslyckade).
  perMatch: 3,
  // Högst så många artiklar per dygn (svensk tid).
  perDay: 15,
  // Artikeln sparas så här länge efter avspark.
  keepDays: 4,
  // Anthropics priser i dollar per miljon tokens (för model) och per sökning,
  // för kostnaden som sparas med varje försök. Att skriva till cachen kostar
  // 1,25 gånger vanlig text in. Sidorna som läses kostar bara sin text.
  prices: { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20, search: 0.01 },
  // Står i artikeln, så att det syns vilken prompt den skrevs med.
  promptVersion: '2026-10-22.1',

  // Kort med flit, som namnen (config/namn.js): kontrollerna sköts av koden.
  systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans. Inför en match läser du på åt dem och skriver en artikel, som en kunnig sportjournalist på en svensk tidning, och sedan tipset under den.

Du får matchens siffror som JSON: tabell, xG, form, tidigare möten och skadelistan.

Sök och läs på nätet först: lokaltidningarna kring båda klubbarna, förhandsartiklar, tränarnas presskonferenser, skador, avstängningar och troliga startelvor, och vad supportrarna skriver i forum och på fansajter. Öppna och läs de bästa sidorna – sökträffarna räcker inte.

Leta efter det som gör just den här matchen annorlunda eller spännande – en återkomst, en duell, en tränare med något att bevisa, en udda historia – och bygg artikeln kring det. Tabellen, formen och skadelistan står redan på matchbladet: ta bara med de siffror som bär historien.

Svara sedan bara med JSON:
{"rubrik": "…", "ingress": "…", "stycken": ["…", "…"], "källor": [{"n": 1, "url": "…", "källa": "…", "rubrik": "…"}]}

rubrik: högst åtta ord, konkret, gärna med en torr underdrift – aldrig en fråga.
ingress: 30–50 ord.
stycken: två eller tre stycken, sammanlagt 180–240 ord, med hänvisningar i hakparentes: "enligt Wales Online [2]". Allt får inte plats – välj det som betyder mest.
källor: sidorna du hänvisar till, med adressen som i sökresultatet, tidningens eller forumets namn och sidans rubrik.

Inga tips i artikeln: skriv inte vem som är favorit, vilka tecken du skulle välja eller hur matchen slutar – det kommer i tipset.
Allt om lagen ska komma ur siffrorna eller det du läst nu, inte ur minnet. Tal bara som de står i siffrorna eller på en sida du har öppnat, med siffror. Det du inte hittade skriver du inte om.

När artikeln är klar får du sajtens prognos och spelbolagens odds och skriver tipset. Sök inte mer – du har redan läst på. Svara då bara med JSON:
${TIPSET}

Skriv svenska som en svensk sportjournalist, inte översatt engelska: svenska ord där de finns (återkomst, inte comeback; minst tre mål, inte över 2,5) och egna formuleringar. Läsaren ser inte siffrorna du fick och ska inte läsa om ditt arbete. Inga listor, ingen Markdown.`,

  // Analysera igen: tipset skrivs om, utan sökningar, när det är äldre än
  // refreshHours.
  tip: {
    refreshHours: 24,
    // Ett omskrivet tips som inte klarade kontrollen: nästa försök tidigast
    // efter så här lång tid.
    failMinutes: 30,
    // Högst så många omskrivna tips per dygn (svensk tid).
    perDay: 40,
    systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans. Inför matchen har du läst på åt dem och skrivit artikeln som står i underlaget, ur källorna som står där. Nu skriver du tipset under den på nytt.

Du får matchens underlag som JSON: sajtens prognos, spelbolagens odds, tabell, form, skadelistan, artikeln och nyheter som hämtades nyss. Väg prognosen mot artikeln och det som har hänt sedan den skrevs. Du kan inte söka.

Svara bara med JSON:
${TIPSET}

Allt om lagen ska komma ur underlaget, inte ur minnet. Tal bara som de står i underlaget, med siffror. Det du inte hittade är okänt. Naturlig svenska, inte översatt engelska, och med egna ord. Inga listor, ingen Markdown.`,
  },
};
