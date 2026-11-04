'use strict';

// ============================================================================
// Hasse Backe (fiktiv) i tobaksaffären (public/rum-hasse.js): Analysera med en
// annan röst. Först tas artikeln och tipset fram som vanligt (config/artikel.js).
// Sedan säger Claude det viktigaste ur dem med personan i prompts/hasse-backe.md,
// utan att söka och lika kort som tipsets analys, och koden kontrollerar att
// inget har hittats på (worker/hasse.mjs). Tipset, de inringade tecknen, kommer
// alltid ur tipset och skrivs aldrig om. Skrivs bara när någon ber om det, och sparas sedan för alla.
// ============================================================================

module.exports = {
  enabled: true,
  provider: 'Anthropic',
  model: 'claude-opus-5-5',
  keyEnv: 'ANTHROPIC_API_KEY',
  effort: 'medium',
  maxTokens: 12000,
  searches: 0,
  timeoutMs: 180000,
  // Högst så många försök per tips och så många texter per dygn (svensk tid).
  perMatch: 3,
  perDay: 40,
  // Så länge sparas texten (artikeln sparas högst elva dagar).
  keepDays: 12,
  // Ändras personan eller frasbanken byts versionen, så att texterna skrivs om.
  promptVersion: '2026-11-04.1',
  prices: { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 },

  // Högst så många ord i texten: prompten säger 120 (som tipsets analys), och
  // koden släpper igenom lite mer.
  maxOrd: 135,

  // Uttrycken: koden lottar två per match (efter matchens id), så att två
  // analyser inte låter likadant. Han tar dem där de passar.
  fraser: [
    'Det är lugnt',
    'Total kontroll',
    'Då är jag jävligt snäll',
    'Här höjer jag ett varningens finger',
    'Lugn nu',
    'Orsak och verkan',
    'Så är det bara',
    'Glöm det',
    'Solklart',
    'Det köper jag aldrig',
    'Nej nej nej',
    'Äsch',
  ],
  // Kryddan: färdiga rader, så att ingen ny historia hittas på om en riktig
  // person. Han tar den om den passar.
  kryddaChans: 0.4,
  kryddor: [
    'Det här pratade vi om redan i Manchester City, Svennis och jag.',
    'Jag har sett det förr, i Manchester. Det gick bra då också.',
    'Ikke noget at tale om, som man säger i Aalborg.',
    'Det er helt i orden, som danskarna säger.',
    'Så er det sagt, som vi sa i Köpenhamn.',
  ],
  // Bielsa-orden lottas bara när analysen visar att ett lag pressar högt eller
  // har ett rörligt anfallsspel.
  bielsaOrd: ['rotasiones', 'intensidá', 'verticalidá', 'transisiones', 'presjón alta', 'ombre libre'],
  bielsaNar: '(högpress\\w*|hög press\\w*|press(ar|a|ande|spel)\\b|pressa\\w* högt|hög linje|rotera\\w*|rotation\\w*|vertikal\\w*|rörlig\\w*|omställning\\w*|anfallsglad\\w*|intensiv\\w*)',
  bielsaTillbaka: 'Ursäkta. Back to basis.',
  bielsaCitat: 'Det finns 28 sätt att bryta ner en backlinje.',

  // Står efter personan: svarets form.
  format: `Du får analysen som JSON och vilka tecken som ringas in. Tecknen skrivs stort ovanför din text.

Svara bara med JSON: {"stycken": ["…", "…"]}

Högst 120 ord i två eller tre korta stycken. Samma tecken av samma skäl som i analysen, utan hänvisningar i hakparentes. Det sista stycket slutar med tecknen.`,
};
