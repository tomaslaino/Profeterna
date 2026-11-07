'use strict';

// ============================================================================
// Hasse Backe (fiktiv) i tobaksaffären (public/rum-hasse.js): Analysera med en
// annan röst. Först tas artikeln och tipset fram som vanligt (config/analyser.js).
// Sedan säger Claude det viktigaste ur dem med personan i prompts/hasse-backe.md,
// utan verktyg och lika kort som tipsets analys, och koden kontrollerar att
// inget har hittats på (src/analyser/hasse.mjs). Tecknen och resultatet bestämmer han
// själv (användarens önskan 2026-11-07: vassare, och emot oddsen när han har skäl):
// han får analysen, spelbolagens odds, sajtens prognos och kollegans tecken. Macen
// skriver texten i förväg med Claude Code (scripts/analyser/skriv.mjs), och på sajten
// låtsas han analysera.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  timeoutMs: 180000,
  // Ändras personan eller frasbanken byts versionen, så att texterna skrivs om.
  promptVersion: '2026-11-07.1',

  // Högst så många ord i texten: prompten säger 120 (som tipsets analys), och
  // koden släpper igenom lite mer.
  maxOrd: 135,

  // Rösten (src/rost.js): bygget tar fram ljudet till allt han säger – hans text och
  // de färdiga replikerna i public/rum-hasse-repliker.js – med Azures talsyntes på den
  // fria nivån (F0), som ger 500 000 tecken i månaden och sedan stryps; den debiterar
  // aldrig. Nyckeln är hemligheten AZURE_SPEECH_KEY i GitHub. Ljudet sparas i
  // källcachen (data/cache/rost/) och tas fram en gång per mening. Mattias är den enda
  // svenska mansrösten, här lite långsammare och mörkare, för lugnet. Ändras rösten,
  // takten eller tonen tas allt ljud fram på nytt (det ingår i filnamnen). Finns
  // meningen med Tomas egen röst (egen nedan) tas den i stället, och Azure tillfrågas inte.
  rost: {
    region: 'swedencentral',
    voice: 'sv-SE-MattiasNeural',
    rate: '-8%',
    pitch: '-6%',
    format: 'audio-24khz-48kbitrate-mono-mp3',
    // Den fria nivån tar 20 anrop i minuten: ett var 3,2 s, högst så många per bygge.
    mellanrumMs: 3200,
    perBygge: 80,
    timeoutMs: 30000,
    // Ljud som inte har använts på så länge tas bort ur cachen.
    sparasDagar: 30,

    // Tomas egen röst, klonad med Chatterbox Multilingual på iMacen (scripts/rost/):
    // jobbet läser upp allt han säger och lägger ljudet i grenen rost, som bygget
    // föredrar framför Azure. Ändras något här (utom perKorning och sökvägarna) tas
    // allt ljud fram på nytt, eftersom det ingår i avtrycket. Det gör referensen också.
    egen: {
      // ~ är hemkatalogen på iMacen.
      python: '~/Kod/chatterbox-rost/.venv/bin/python',
      referens: '~/Kod/chatterbox-rost/min_rost.wav',
      sprak: 'sv',
      exaggeration: 0.7,
      cfgWeight: 0.5,
      temperature: 0.8,
      // mp3 till sajten: mono, så här många kbit/s.
      kbps: 64,
      // Högst så många meningar per körning (var 15:e minut), så att ljudet kommer
      // ut successivt: med ca 5 s räknetid per sekund tal är det 10–15 minuter.
      perKorning: 30,
      // Kontrollen av längden: talet (tystnaden borträknad) ska vara mellan kortast
      // och langst gånger den väntade längden, tecknen / tecknenPerSekund, men aldrig
      // under minstaSek. Annars görs meningen om med nytt slumpfrö, högst forsok gånger
      // i allt. Säger Chatterbox "forcing EOS token" av någon annan orsak än
      // token_repetition görs den också om.
      tecknenPerSekund: 14,
      kortast: 0.55,
      langst: 2.2,
      minstaSek: 0.5,
      forsok: 4,
      // En mening som inte klarar kontrollen prövas igen efter så många timmar; tills
      // dess tas Azure-rösten.
      omIgenTimmar: 24,
    },
  },

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
