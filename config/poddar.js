'use strict';

// ============================================================================
// Supporterpoddarna till tidningen inför omgången (användarens önskan 2026-11-09
// och 2026-11-10): lagens egna supporterpoddar skrivs ut på iMacen och det mest
// intressanta inför matchen tas ut, så att tidningen får veta det som inte står i
// de vanliga källorna.
//
//   scripts/tidning/poddar.mjs (launchd: se.matchfixarna.poddar)
//     1. hittar lagens poddar (en gång per lag, sedan ur registret),
//     2. hämtar veckans avsnitt och skriver ut det med whisper.cpp,
//     3. låter Claude Code (claude -p på Claude-kontot, inga API-nycklar) ta ut
//        de få uppgifter som säger mest om matchen,
//     4. sparar dem utanför repot. Tidningen (src/analyser/tidning.mjs) får dem
//        i sitt underlag nästa gång den skrivs.
//
// Ljudet och utskrifterna är andras och läggs aldrig i repot eller på sajten.
// Dit kommer bara tidningens egna meningar och poddens namn som källa.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  // Urvalet är ett omdöme: vad är värt att veta och vad är småprat?
  effort: 'medium',
  timeoutMs: 420000,

  // Mappen utanför repot, under ~/Library/Application Support/Matchfixarna/.
  mapp: 'Tidning',
  whisper: 'whisper-cli',
  modell: 'ggml-large-v3-turbo-q5_0.bin',
  tradar: 4,

  // Ett avsnitt räknas om det kom ut de senaste så här många dagarna …
  dagar: 6,
  // … och är minst så här långt (kortare är oftast en puff eller reklam).
  minstMinuter: 12,
  // Så mycket av avsnittet skrivs ut. Poddarna börjar ofta med en kvarts småprat,
  // så 45 minuter räckte inte alltid i testnumret.
  minuter: 60,
  // Nya avsnitt per lag och körning, och avsnitt per lag som tidningen får.
  avsnittPerKorning: 1,
  avsnittTillTidningen: 2,
  // Högst så många avsnitt per körning (en körning tar 5–10 minuter per avsnitt).
  flestAvsnitt: 30,

  // Det mest intressanta: högst så många uppgifter ur ett avsnitt, och så många
  // per lag i tidningens underlag.
  uppgifterPerAvsnitt: 4,
  uppgifterPerLag: 4,
  // En uppgift under den här vikten (1–5) följer inte med till tidningen.
  minstVikt: 3,

  // Registret: ett lag utan podd letas upp igen efter så här många dagar, ett lag
  // med podd efter så många.
  letaOmDagar: { utan: 7, med: 60 },
  poddarPerLag: 2,
  // En podd räknas som levande om den har ett avsnitt de senaste så här många dagarna.
  levandeDagar: 28,
  // Sökningar på nätet när poddarna letas upp (ett anrop för alla nya lag).
  sokningar: 14,

  // Poddar vi redan känner (testnumret 2026-11-09). Lagets namn som hos ESPN.
  // Står laget här letas det inte upp.
  kanda: {
    'Sheffield Wednesday': ['Talking Wednesday', 'The Wednesday Week'],
    'Plymouth Argyle': ['Green & White'],
    'Stockport County': ['SK3 TV'],
    'Reading': ['The Tilehurst End Podcast'],
    'Leicester City': ['The Leicester City Pubcast'],
    'Bradford City': ['Chickens On The Loose'],
  },

  // Byts den tas uppgifterna ut på nytt ur utskrifterna som finns.
  promptVersion: '2026-11-10.2',

  letaPrompt: `Du hjälper en svensk tipstidning att hitta engelska fotbollsklubbars supporterpoddar.

Du får en lista med klubbar. Ange för varje klubb upp till tre poddar som supportrar till just den klubben gör om herrarnas a-lag, som kommer ut varje vecka under säsongen och som finns hos Apple Podcasts. Den mest lyssnade och mest regelbundna först. Inte klubbens egen podd om det finns en oberoende, inte BBC, inte poddar om hela ligan, inte historiepoddar och inte damlaget.

Du får söka på nätet, högst {sokningar} gånger, för klubbar där du är osäker. Skriv poddens namn precis som det står hos Apple Podcasts.

Svara bara med JSON, utan något före eller efter:
{"klubbar": {"<klubbens namn som i listan>": ["<poddens namn>", "…"]}}

En tom lista för en klubb där du inte hittar någon.`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset och vill inför en match veta det som supportrarna vet men som inte står i tabellen eller i de vanliga tidningarna.

Du får utskriften av ett avsnitt ur en engelsk supporterpodd, ett stycke per minut med minuten i hakparentes. Utskriften är gjord av en maskin: namn kan vara felstavade, så rätta dem efter spelarlistan om du får en.

Ta ut det MEST INTRESSANTA inför lagets nästa match, högst {flest} uppgifter och hellre två bra än fyra halvbra. En uppgift är intressant om den kan ändra hur man ser på matchen:
- vem som är skadad, sjuk, avstängd, tillbaka i träning eller tveksam, särskilt det som inte är officiellt än,
- vilka som väntas starta, byte av målvakt, uppställning eller spelsätt,
- hur laget egentligen spelar just nu, bortom resultaten: trötthet, självförtroende, var det läcker,
- tränarens ställning, stämningen i truppen, bråk med ägare, löner, köpstopp, protester,
- något om just den här motståndaren eller matchen: resan, planen, en gammal räkning,
- vad de som följer laget varje vecka väntar sig av matchen, när det sticker ut.

Ta INTE med: referat av förra matchen, tabelläget, sådant alla redan vet, skämt, småprat, reklam, biljetter, tävlingar och poddens egna angelägenheter. Finns inget intressant är listan tom, och det är ett bra svar.

Varje uppgift:
- t: en till två meningar på vanlig svenska, högst 40 ord, som går att läsa utan att ha hört podden. Skriv vad som sägs, inte att "podden diskuterar". De som pratar är poddens värdar eller supportrarna, inte "poddarna". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om podden återger något klubben, tränaren eller en spelare har sagt eller något som har hänt, "h" om det är poddens egna uppgifter, intryck från läktaren eller ett rykte, "o" om det är supportrarnas förhoppning eller tyckande.
- min: minuten i utskriften där det sägs.
- citat: 8–20 ord i följd ur utskriften, ordagrant som de står där (också med maskinens stavfel), som visar att det sades. Citatet trycks inte.
- vikt: 5 = det här kan avgöra matchen eller är en nyhet, 3 = värt att veta, 1 = kuriosa.

Bara det som sägs i utskriften, ingenting ur minnet. Tal bara som de sägs.

Svara bara med JSON, utan något före eller efter:
{"handlar_om": "en mening om vad avsnittet handlar om", "uppgifter": [{"t": "…", "s": "b", "min": 12, "citat": "…", "vikt": 4}]}`,
};
