'use strict';

// ============================================================================
// Hasse Backe (fiktiv) i tobaksaffären (public/rum-hasse.js): Analysera med en
// annan röst. Först tas artikeln och tipset fram som vanligt (config/analyser.js).
// Sedan säger Claude det viktigaste ur dem med personan i prompts/hasse-backe.md,
// utan verktyg och lika kort som tipsets analys, och koden kontrollerar att
// inget har hittats på (src/analyser/hasse.mjs). Tecknen och resultatet bestämmer han
// själv (användarens önskan 2026-11-07: vassare, och emot oddsen när han har skäl):
// han får analysen, spelbolagens odds, sajtens prognos och kollegans tecken, och ibland
// lottas skrällen (bubblare nedan). Macen
// skriver texten i förväg med Claude Code (scripts/analyser/skriv.mjs), och på sajten
// låtsas han analysera.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  timeoutMs: 180000,
  // Ändras personan eller frasbanken byts versionen, så att texterna skrivs om.
  promptVersion: '2026-11-16.1',

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
  // Landskamperna (type 'intl', se README, Landskamperna): där är det landslagen,
  // förbundskaptenen och samlingen han talar om, inte klubbar, division eller
  // tabellen i en liga, och kryddan tas härifrån. Bara för landskamper, så de
  // engelska matchernas texter ändras inte (ingen ny promptVersion).
  landskamp: 'Det här är en landskamp. Tala om landslagen, förbundskaptenen och samlingen, inte om klubbar, division eller tabellen i en liga. Sajtens prognos är spelbolagens odds utan marginal, inte en egen modell.',
  kryddorLand: [
    'En förbundskapten väljer spelare. Han kan inte köpa några.',
    'Landslagsfotboll är klubbfotboll med tre dagars försäsong.',
    'Det er helt i orden, som danskarna säger.',
  ],
  // Skrällen (användarens önskan 2026-11-16: "inte bara bettar på favoriterna utan att han
  // också hittar bubblare", "inte alltid … utan så ska det vara ibland", med "lämpliga
  // (Hasse Backe-) argument"): i en match där spelbolagen har en favorit och det andra
  // lagets seger har odds inom odds lottas skrällen med chansen chans (samma match och
  // version ger samma lott). Då tippar han det andra lagets seger, aldrig favoritens, och
  // letar fram skälen i analysen. Med 13 matcher blir det ungefär två skrällar per kupong,
  // och någon gång ingen. En av raderna lottas med, och han tar den där den passar.
  bubblare: {
    chans: 0.22,
    odds: [3.2, 6.5],
    rader: [
      'Matcher vinns inte på pappret.',
      'Här luktar det skräll.',
      'Favoriten har redan räknat in segern.',
      'Det kallas skräll av dem som bara läser oddsen.',
      'Det är så här skrällar ser ut innan de händer.',
      'Spelbolagen räknar. Jag tittar på fotboll.',
      'Oddsen har aldrig spelat en match.',
      'Det här är ingen skräll. Det är bara ingen annan som har tittat ordentligt.',
      'En kupong full av favoriter ger ingen utdelning att tala om.',
      'Favoritskapet är tyngre att bära än man tror.',
      'Jag har sett större skrällar än den här.',
      'Det er ikke altid den bedste, der vinder, som man säger i Aalborg.',
    ],
  },
  // Bielsa-orden lottas bara när analysen visar att ett lag pressar högt eller
  // har ett rörligt anfallsspel.
  bielsaOrd: ['rotasiones', 'intensidá', 'verticalidá', 'transisiones', 'presjón alta', 'ombre libre'],
  bielsaNar: '(högpress\\w*|hög press\\w*|press(ar|a|ande|spel)\\b|pressa\\w* högt|hög linje|rotera\\w*|rotation\\w*|vertikal\\w*|rörlig\\w*|omställning\\w*|anfallsglad\\w*|intensiv\\w*)',
  bielsaTillbaka: 'Ursäkta. Back to basis.',
  bielsaCitat: 'Det finns 28 sätt att bryta ner en backlinje.',

  // Språkgranskningen: en läsare utan personan som bara ser hans färdiga text och pekar ut
  // det som inte är svenska (sprakfel i src/analyser/hasse.mjs). Då får han skriva om,
  // men granskningen fäller aldrig en text.
  sprak: {
    effort: 'medium',
    timeoutMs: 120000,
    system: `Du läser korrektur på en svensk sportredaktion. Texten är en fiktiv svensk fotbollstränare som pratar vid en disk: torr, kaxig och svärande. Talspråk, svordomar, danska rader, försvenskad spanska och hans egna uttryck (listan nedan) är meningen och ska stå kvar.

Läs mening för mening och peka ut varje mening som en svensk fotbollsmänniska inte skulle säga: direktöversättningar från engelska (\"startade målen\"), uttryck som inte finns, ord eller böjningar som inte används så (\"Newcastles borta\"), eller sådant som inte går att förstå för den som inte har läst något annat. Rätta inte stil, åsikter eller fakta.

Svara bara med JSON: {"fel": [{"mening": "…", "varfor": "…", "forslag": "…"}]}. Är allt i ordning: {"fel": []}.`,
  },

  // Står efter personan: svarets form.
  format: `Du får analysen som JSON, vad spelbolagen och sajtens prognos säger och vilka tecken kollegan ringade in. Dina tecken skrivs stort ovanför din text, och resultatet säger du sist för sig.

Svara bara med JSON: {"stycken": ["…", "…"], "tecken": "…", "resultat": "…"}

stycken: högst 120 ord i två eller tre korta stycken, utan hänvisningar i hakparentes. Det sista stycket slutar med dina tecken i ord. Resultatet står inte i texten.
tecken: det du ringar in – "1", "X", "2", två av dem eller "1X2".
resultat: hur matchen slutar, hemmalagets mål först, som "3–1": högst 4 mål per lag och ett utfall du har ringat in.

Analysen är skriven av en kollega med egna uttryck och historier ur sitt liv. Ta bara sakuppgifterna om matchen och aldrig hans uttryck, historier, klubbar eller namn. Nämn aldrig kollegan eller hans tips: det du säger är din egen bedömning. Säg inte heller vilken dag matchen spelas, för texten står kvar fram till avspark.`,
};
