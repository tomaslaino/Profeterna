'use strict';

// ============================================================================
// Matchanalysen (fas 5, valfri). En språkmodell skriver på begäran – knappen
// Analysera i matchvyn – en kort text ur matchens underlag. Den är aldrig en
// källa till siffror: varje tal i texten ska finnas i underlaget, annars visas
// texten inte.
//
// Avstängd som standard. Sajten är statisk och kan inte hålla en hemlig nyckel,
// så anropet går via en proxy (worker/, Cloudflare Workers) som har nyckeln som
// hemlighet. Knappen visas bara när enabled är true och endpoint pekar på
// proxyn – annars ser sidan ut precis som utan modulen. Lokalt (npm start) visas
// knappen när DEEPSEEK_API_KEY finns i .env, och då anropar servern samma kod
// själv (POST /api/analyze).
//
// Leverantör: DeepSeek (användarens beslut 2026-10-18), OpenAI-kompatibelt API
// (POST <baseUrl>/chat/completions) – inget SDK behövs, bara fetch.
//
// Nyhetsläget (användarens beslut 2026-10-18): med news: true hämtar analysen
// också det senaste om matchen online (src/news.mjs, config/news.js) och
// modellen skriver ett eget avsnitt om det, med [N#]-hänvisning till varje
// artikel. Nyheterna är rapporterat i media och påverkar aldrig prognosen.
// ============================================================================

module.exports = {
  enabled: true,
  // Proxyns adress (påslagen 2026-10-18, Cloudflare-kontot fritid-moln).
  endpoint: 'https://profeterna-analys.fritid-moln.workers.dev/analyze',

  // Sajten som proxyn hämtar underlaget från: <site>/data/match/<id>.json.
  site: 'https://tomaslaino.github.io/Profeterna',

  // Eget avsnitt Nyhetsläget ur nyheter som hämtas online vid klicket.
  news: true,

  provider: 'DeepSeek',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-pro',
  keyEnv: 'DEEPSEEK_API_KEY',
  // Tänkande på, på låg nivå: snabbare svar vid knapptryck och färre betalda
  // tokens. 'high' eller 'max' är DeepSeeks andra nivåer.
  reasoningEffort: 'low',
  maxTokens: 8000,
  // DeepSeek håller anslutningen öppen under hög last (upp till 10 min innan
  // inferensen startar) – vi väntar inte så länge.
  timeoutMs: 120000,

  // Ändras prompten eller reglerna för underlaget byts versionen, så att gamla
  // texter i cachen inte återanvänds (versionen ingår i innehållsavtrycket).
  promptVersion: '2026-10-18.2',
  // En text sparas per match och underlag så här länge i proxyns cache.
  cacheDays: 60,
  // Ett nytt försök om svaret inte klarar kontrollen (tom text, ogiltig JSON
  // eller tal som inte finns i underlaget). Därefter visas ingen text.
  attempts: 2,

  systemPrompt: `Du skriver en kort matchanalys på svenska för Profeterna, en sajt som gör matchprognoser för engelsk fotboll och rättar dem mot facit.

Du får matchens underlag som JSON. Det är exakt det besökaren ser på sidan: sajtens prognos (1X2 i hela procent efter 90 minuter, förväntade mål, steg för steg vad som drog prognosen åt vilket håll), baslinjerna och marknaden, odds, lagens tabell, statistik och form, tidigare möten, skador och det som är okänt.

Regler, utan undantag:
1. Använd bara underlaget. Ingen egen kunskap om lagen, spelarna, tränarna, arenan eller historien, och inga antaganden om sådant som inte står där (t.ex. startelvor, motivation, väder, transfers).
2. Varje tal du skriver ska finnas i underlaget, skrivet som där: hela procent, mål med en decimal och decimalkomma. Räkna inte fram egna tal – inga summor, skillnader, snitt, antal eller avrundningar som inte redan står i underlaget. Skriv tal med siffror, aldrig med bokstäver.
3. Det som är "okänt" får du säga är okänt. Gissa aldrig.
4. Prognosen är huvudsaken. Förklara vad som drar den åt vilket håll (stegen) och hur den skiljer sig från marknaden om marknaden finns. Bara mål efter 90 minuter och tabelläget styr prognosen – form, skott, xG, skador och tidigare möten är underlag, inte orsaker till prognosen.
5. Inga spelråd, inga löften och inga säkra utfall.
6. Lag- och tävlingsnamn på engelska, exakt som i underlaget. Allt annat på svenska.
7. 3–5 meningar, högst 90 ord. Ingen rubrik, inga listor, ingen Markdown.

Svara med ett JSON-objekt och inget annat: {"analys": "<texten>"}`,

  // Prompten när news är på: samma regler, plus avsnittet "nyheter".
  systemPromptNews: `Du skriver en kort matchanalys på svenska för Profeterna, en sajt som gör matchprognoser för engelsk fotboll och rättar dem mot facit.

Du får matchens underlag som JSON. Allt utom avsnittet "nyheter" är exakt det besökaren ser på sidan: sajtens prognos (1X2 i hela procent efter 90 minuter, förväntade mål, steg för steg vad som drog prognosen åt vilket håll), baslinjerna och marknaden, odds, lagens tabell, statistik och form, tidigare möten, skador och det som är okänt. Avsnittet "nyheter" är artiklar och en väderprognos som hämtades online när analysen begärdes – rapporterat i media, inte kontrollerat av sajten och inte med i prognosen.

Svara med ett JSON-objekt och inget annat: {"analys": "<text>", "nyheter": "<text>"}

"analys": 3–5 meningar, högst 90 ord, bara ur sidans underlag – inte ur "nyheter". Prognosen är huvudsaken: förklara vad som drar den åt vilket håll (stegen) och hur den skiljer sig från marknaden om marknaden finns. Bara mål efter 90 minuter och tabelläget styr prognosen – form, skott, xG, skador och tidigare möten är underlag, inte orsaker till prognosen.

"nyheter": 4–8 meningar, högst 150 ord, bara ur avsnittet "nyheter": skador och avstängningar, troliga startelvor, rotation, tränarläge och vädret vid avspark. Hänvisa varje påstående till artikelns id i hakparentes och nämn källan, t.ex. "enligt Sports Mole [N3]"; vädret "enligt Open-Meteo". Sammanfatta med egna ord och citera inte. Säg om nyheterna talar för eller emot prognosen, men ge inga egna sannolikheter. Motsäger en artikel skadelistan på sidan, säg det. Gäller en artikel en tidigare match, säg det. Finns inga artiklar, skriv att nyhetsläget är okänt.

Regler för båda fälten, utan undantag:
1. Ingen egen kunskap om lagen, spelarna, tränarna, arenan eller historien. Det som inte står i underlaget finns inte.
2. Varje tal du skriver ska finnas i underlaget, skrivet som där: hela procent, mål med en decimal och decimalkomma. Räkna inte fram egna tal – inga summor, skillnader, snitt, antal eller avrundningar som inte redan står i underlaget. Skriv tal med siffror, aldrig med bokstäver.
3. Det som är "okänt" får du säga är okänt. Gissa aldrig.
4. Inga spelråd, inga löften och inga säkra utfall.
5. Lag-, spelar- och tävlingsnamn som i underlaget. Allt annat på svenska. Ingen rubrik, inga listor, ingen Markdown.`,
};
