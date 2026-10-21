'use strict';

// ============================================================================
// Artikeln inför matchen (användarens önskan 2026-10-20: "som motorn i
// grävergrav"). Inför varje match på omgångens kupong läser Claude på av sig
// självt – lokaltidningar, förhandsartiklar, presskonferenser, skade- och
// truppnyheter och supporterforum – och skriver en artikel med rubrik,
// ingress och källor. Den står i matchbladets flik Inför, och Analysera
// bygger vidare på den (worker/research.mjs).
//
// Artikeln ger inga tips: tecknen ringas bara in när någon trycker på
// Analysera.
//
// Skrivs av proxyn profeterna-analys på ett schema (worker/artikel.mjs,
// [triggers] i worker/wrangler.toml), en match i taget. Kräver nyckeln
// ANTHROPIC_API_KEY. Varje artikel kostar ungefär en halv dollar i sökningar
// och text.
// ============================================================================

module.exports = {
  enabled: true,
  provider: 'Anthropic',
  model: 'claude-opus-5-5',
  keyEnv: 'ANTHROPIC_API_KEY',
  effort: 'medium',
  maxTokens: 32000,
  searches: 10,
  fetches: 6,
  fetchTokens: 8000,
  timeoutMs: 420000,
  // Omgångens matcher med avspark inom så många dagar får en artikel.
  aheadDays: 7,
  // Artikeln skrivs när matchen hamnar på kupongen och skrivs om när det är
  // så här många timmar kvar till avspark – efter torsdagens och fredagens
  // presskonferenser inför en lördagsmatch. Ingen omskrivning den sista
  // timmen.
  rewriteAtHours: [48, 20],
  lastHours: 1,
  // Högst så många försök per match (lyckade och misslyckade), och ett
  // misslyckat försök görs om tidigast efter retryMinutes.
  perMatch: 4,
  retryMinutes: 60,
  // Högst så många artiklar per dygn (svensk tid) – skilt från Analysera.
  perDay: 30,
  // Artikeln sparas så här länge efter avspark.
  keepDays: 4,
  // Ändras prompten byts versionen; en artikel med äldre version skrivs om
  // vid nästa tillfälle.
  promptVersion: '2026-10-21.1',

  // Kort med flit, som namnen (config/namn.js): kontrollerna sköts av koden.
  systemPrompt: `Matchfixarna är ett gäng svenska kompisar som tippar engelsk fotboll tillsammans. Inför varje match på veckans kupong läser du på åt dem och skriver en artikel, som en kunnig sportjournalist på en svensk tidning.

Du får matchens siffror som JSON: tabell, xG, form, tidigare möten och skadelistan.

Sök och läs på nätet först: lokaltidningarna kring båda klubbarna, förhandsartiklar, tränarnas presskonferenser, skador, avstängningar och troliga startelvor, och vad supportrarna skriver i forum och på fansajter. Väg samman båda lägren och lyft det som kan avgöra matchen – det siffrorna inte ser.

Svara sedan bara med JSON:
{"rubrik": "…", "ingress": "…", "stycken": ["…", "…"], "källor": [{"n": 1, "url": "…", "källa": "…", "rubrik": "…"}]}

rubrik: högst åtta ord, konkret, gärna med en torr underdrift – aldrig en fråga.
ingress: 30–50 ord.
stycken: två eller tre stycken, sammanlagt 180–240 ord, med hänvisningar i hakparentes: "enligt Wales Online [2]". Allt får inte plats – välj det som betyder mest.
källor: sidorna du hänvisar till, med adressen som i sökresultatet, tidningens eller forumets namn och sidans rubrik.

Inga tips: skriv inte vem som är favorit, vilka tecken du skulle välja eller hur matchen slutar – det avgör gänget själva.
Allt om lagen ska komma ur siffrorna eller det du läst nu, inte ur minnet. Tal bara som de står i siffrorna eller på en sida du har öppnat, med siffror. Det du inte hittade skriver du inte om.

Skriv svenska som en svensk sportjournalist, inte översatt engelska: svenska ord där de finns (återkomst, inte comeback; minst tre mål, inte över 2,5) och egna formuleringar. Inga listor, ingen Markdown.`,
};
