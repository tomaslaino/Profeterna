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
  // per lag i tidningens notiser (config/tidning.js).
  uppgifterPerAvsnitt: 12,
  uppgifterPerLag: 4,
  // En uppgift under den här vikten (1–5) följer inte med till tidningen.
  minstVikt: 3,

  // Informationssidan per match (användarens önskan 2026-11-10: längre sidor som man
  // kan hämta kunskap ur, grupperade, med slag, podd, citat och vem som säger det).
  sidan: {
    // Lagets senaste avsnitt som sidan bygger på, och högst så många punkter per lag.
    avsnitt: 3,
    punkterPerLag: 9,
    // Högst så många av punkterna får sitt citat tryckt.
    citatPerLag: 5,
    rubrikOrd: 9,
    ingressOrd: 45,
    effort: 'medium',
  },
  // Ämnena som uppgifterna grupperas i, i den ordning de står på sidan.
  amnen: {
    trupp: 'Skador och trupp',
    elva: 'Väntad uppställning',
    spel: 'Så spelar laget',
    klubb: 'Tränaren och klubben',
    match: 'Inför matchen',
  },

  // Registret: ett lag utan podd letas upp igen efter så här många dagar, ett lag
  // med podd efter så många.
  letaOmDagar: { utan: 7, med: 60 },
  poddarPerLag: 2,
  // En podd räknas som levande om den har ett avsnitt de senaste så här många dagarna.
  levandeDagar: 28,
  // Sökningar på nätet när poddarna letas upp (ett anrop för högst letaPerAnrop nya lag).
  sokningar: 14,
  letaPerAnrop: 10,
  letaEffort: 'medium',

  // Poddarna vi känner: den mest relevanta supporterpodden för vart och ett av de 92
  // ligalagen, och en till där det finns en bra (användarens önskan 2026-11-10). Lagets
  // namn som hos ESPN, poddens namn som hos Apple Podcasts. Var och en är uppslagen med
  // sokPodd och hade ett avsnitt de senaste 28 dagarna den 10 november 2026. Står laget
  // här letas det inte upp, och ändras raden slås poddarna upp på nytt samma natt.
  // Bara lagen i omgången skrivs ut. Saknas här, för att ingen levande supporterpodd
  // hittades: Accrington Stanley, Barnet, Blackpool, Fleetwood Town, Salford City, Stevenage och Tranmere
  // Rovers. De letas upp som förut när de står på kupongen.
  kanda: {
    'AFC Bournemouth': ['Back Of The Net - The AFC Bournemouth Podcast', 'Up The Cherries In All Departments - AFC Bournemouth Fans Podcast'],
    'AFC Wimbledon': ['The Wombles had a Dream Podcast', '9yrspodcast'],
    'Arsenal': ['Arseblog Arsecast, The Arsenal Podcast', 'The ArsenalVision Podcast - Arsenal FC'],
    'Aston Villa': ['The Villa Filler Podcast', 'My Old Man Said — An Aston Villa Podcast'],
    'Barnsley': ['Reds Report'],
    'Birmingham City': ['Tilton Talk Birmingham City podcast', 'We Are Birmingham Podcast'],
    'Blackburn Rovers': ['The 4000 Holes Podcast', 'The Blackburn End Podcast'],
    'Bolton Wanderers': ['The Lion of Vienna - A Bolton Wanderers podcast', 'The Fanzone Pod - Bolton Wanderers Podcast'],
    'Bradford City': ['Chickens On The Loose'],
    'Brentford': ['The Beesotted Brentford Pride of West London Podcast'],
    'Brighton & Hove Albion': ['Seagulls Social', 'The Albion Roar'],
    'Bristol City': ['Forever Bristol City Podcast', '3 Peaps In A PodCast'],
    'Bristol Rovers': ['GasCast - Bristol Rovers Podcast'],
    'Bromley': ['Bromley FC Breakdown'],
    'Burnley': ['TurfCast'],
    'Burton Albion': ['Brewers Babble'],
    'Cambridge United': ['Under The Abbey Stand'],
    'Cardiff City': ['View From the Ninian - A Cardiff City Podcast'],
    'Charlton Athletic': ['Charlton Live', 'From the Valley Floyd - A Charlton Athletic Podcast'],
    'Chelsea': ['London Is Blue - Chelsea FC Podcast', 'Chelsea FanCast'],
    'Cheltenham Town': ['The Robins Report'],
    'Chesterfield': ['Official Chesterfield FC Podcasts'],
    'Colchester United': ['Beyond the Barside'],
    'Coventry City': ['Sky Blue Fans TV'],
    'Crawley Town': ['Reds In Exile - Crawley Town Podcast'],
    'Crewe Alexandra': ['The Railwaymen'],
    'Crystal Palace': ['FYP Podcast'],
    'Derby County': ['The Rams Review Podcast'],
    'Doncaster Rovers': ['DN4 - A Doncaster Rovers podcast'],
    'Everton': ['The Blue Room - Everton FC Podcast', 'The Toffee TV Everton Podcast'],
    'Exeter City': ['The Big Bank Theory'],
    'Fulham': ['Fulhamish', 'Cottage Talk: Fulham Podcast'],
    'Gillingham': ['The ME7 Podcast'],
    'Grimsby Town': ['DN35', 'View From The Findus | A Grimsby Town Podcast'],
    'Huddersfield Town': ['Still Smiling: A Huddersfield Town Podcast'],
    'Hull City': ['To Hull and Back: A Hull City Podcast', 'The 1904 Club - a Hull City podcast'],
    'Ipswich Town': ['Blue Monday: An Ipswich Town Podcast', 'Kings of Anglia - Ipswich Town podcast from the EADT and Ipswich Star'],
    'Leeds United': ['The Square Ball: Leeds United Podcast', 'Leeds, That! - A Leeds United Fan Podcast'],
    'Leicester City': ['The Leicester City Pubcast'],
    'Leyton Orient': ['The Orient Outlook Podcast', 'The View From The East - An Unofficial Leyton Orient Podcast'],
    'Lincoln City': ['The Stacey West Podcast'],
    'Liverpool': ['The Anfield Wrap', 'The Redmen TV - Liverpool FC Podcast'],
    'Luton Town': ['Oh When The Town', '30 Points! Who Gives A Pod'],
    'Manchester City': ['Blue Moon Podcast - A Manchester City Show', 'The City Ramble'],
    'Manchester United': ['United We Stand Podcast', 'No Question About That - a Manchester United podcast'],
    'Mansfield Town': ['Mansfield Matters Podcast'],
    'Middlesbrough': ['The Boro Breakdown Podcast'],
    'Millwall': ['Achtung! Millwall Podcast', 'The 1885 Show - A Millwall Podcast'],
    'Milton Keynes Dons': ['The MK1 Podcast'],
    'Newcastle United': ['True Faith NUFC Podcast'],
    'Newport County': ['1912 Exiles'],
    'Northampton Town': ["It's All Cobblers To Me - Northampton Town Podcast"],
    'Norwich City': ['The TNC Podcast | A Norwich City Podcast', 'The Along Come Norwich Podcast'],
    'Nottingham Forest': ['1865: A View From The Forest', 'Forest Focus'],
    'Notts County': ['The Magpie Circle - A Notts County Podcast'],
    'Oldham Athletic': ['The Boundary Park Alert System'],
    'Oxford United': ['The Manor - Oxford United Podcast', 'The Fence End Podcast'],
    'Peterborough United': ['Up The Poshcast'],
    'Plymouth Argyle': ['Green & White'],
    'Port Vale': ['Ale and the Vale - A Port Vale Podcast!'],
    'Portsmouth': ['PO4cast: Pompey Podcast', 'Pompey Politics Podcast'],
    'Preston North End': ['Preston North End Weekly'],
    'Queens Park Rangers': ['QPR Podcast', 'Hoopsa - a QPR Podcast'],
    'Reading': ['The Tilehurst End Podcast'],
    'Rochdale': ['The RochdaleAFC.com Podcast'],
    'Rotherham United': ['New York Talk'],
    'Sheffield United': ['Sheff United Way', 'Blades Ramble - A Sheffield United Podcast'],
    'Sheffield Wednesday': ['Talking Wednesday', 'The Wednesday Week'],
    'Shrewsbury Town': ['Salopcast'],
    'Southampton': ['Total Saints Podcast', 'In That Number: Southampton FC Podcast'],
    'Stockport County': ['SK3 TV'],
    'Stoke City': ['Every Step Along The Way - A Stoke City Podcast', 'The Potters Podcast - A Stoke City Podcast'],
    'Sunderland': ['Wise Men Say', 'Haway The Podcast – Sunderland AFC'],
    'Swansea City': ['The JackCast'],
    'Swindon Town': ['Loathed Strangers: Swindon Town Podcast'],
    'Tottenham Hotspur': ['The Fighting Cock (Tottenham Hotspur Podcast)', 'The Extra Inch (Spurs Podcast)'],
    'Walsall': ['Walsall Fan TV', 'Bescot Beat'],
    'Watford': ['Do Not Scratch Your Eyes', 'From The Rookery End - A show about Watford FC'],
    'West Bromwich Albion': ['Albion Analysis', 'Baggies Broadcast'],
    'West Ham United': ['Moore Than Just A Podcast - West Ham Podcast', 'The West Ham Way Podcast'],
    'Wigan Athletic': ['Progress With Unity Podcast'],
    'Wolverhampton Wanderers': ['Wolves Fancast', 'Always Wolves Podcast'],
    'Wrexham': ['Fearless in Devotion', 'Rob. Ryan. Red.'],
    'Wycombe Wanderers': ['The Heroes of HP12'],
    'York City': ['Same Old City', 'The Crux of It'],
  },

  // Byts den tas uppgifterna ut på nytt ur utskrifterna som finns.
  promptVersion: '2026-11-10.4',

  letaPrompt: `Du hjälper en svensk tipstidning att hitta engelska fotbollsklubbars supporterpoddar.

Du får en lista med klubbar. Under varje klubb står poddarna som Apple Podcasts hittar på klubbens namn och som har kommit ut den senaste månaden. En del av dem handlar om annat: en annan klubb med liknande namn, hela ligan, fantasy, spel eller ett annat land.

Ange för varje klubb upp till tre poddar som supportrar till just den klubben gör om herrarnas a-lag och som kommer ut regelbundet under säsongen. Den mest regelbundna och mest lyssnade först. Välj i första hand bland träffarna. Känner du till en supporterpodd som inte står där, eller hittar du en genom att söka, får du lägga till den. Inte klubbens egen podd om det finns en oberoende, inte BBC, inte poddar om hela ligan, inte historiepoddar och inte damlaget.

Gå igenom VARJE klubb. För klubbar utan användbar träff ska du söka på nätet ("<klubben> fans podcast"), högst {sokningar} gånger sammanlagt. Skriv poddens namn precis som det står hos Apple Podcasts.

Svara bara med JSON, utan något före eller efter:
{"klubbar": {"<klubbens namn som i listan>": ["<poddens namn>", "…"]}}

En tom lista för en klubb där du inte hittar någon.`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset och vill inför en match veta det som supportrarna vet men som inte står i tabellen eller i de vanliga tidningarna. Tidningen trycker en informationssida per match som läsaren ska kunna hämta kunskap ur.

Du får utskriften av ett avsnitt ur en engelsk supporterpodd, ett stycke per minut med minuten i hakparentes. Utskriften är gjord av en maskin: namn kan vara felstavade, så rätta dem efter spelarlistan om du får en. Det står inte vem som talar.

Ta ut ALLT SOM ÄR INTRESSANT inför lagets nästa match, högst {flest} uppgifter. Hellre fem bra än tolv halvbra, men missa inget som en tippare vill veta. En uppgift är intressant om den kan ändra hur man ser på matchen. Varje uppgift hör till ett ämne:
- "trupp": vem som är skadad, sjuk, avstängd, tillbaka i träning eller tveksam, särskilt det som inte är officiellt än,
- "elva": vilka som väntas starta, byte av målvakt, uppställning eller formation,
- "spel": hur laget egentligen spelar just nu, bortom resultaten: trötthet, självförtroende, var det läcker, vem som bär laget,
- "klubb": tränarens ställning, stämningen i truppen, bråk med ägare, löner, köpstopp, protester,
- "match": något om just den här motståndaren eller matchen (resan, planen, en gammal räkning) och vad de som följer laget varje vecka väntar sig, när det sticker ut.

Ta INTE med: referat av förra matchen, tabelläget, sådant alla redan vet, skämt, småprat, reklam, biljetter, tävlingar och poddens egna angelägenheter. Samma sak tas upp en gång. Uppgiften ska handla om laget ovan eller om matchen; det som bara rör en annan klubb hör inte hit. Finns inget intressant är listan tom, och det är ett bra svar.

Varje uppgift:
- a: ämnet, ett av "trupp", "elva", "spel", "klubb", "match".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha hört podden. Skriv vad som sägs, inte att "podden diskuterar". De som pratar är poddens värdar eller supportrarna, inte "poddarna". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om podden återger något klubben, tränaren eller en spelare har sagt eller något som har hänt, "h" om det är poddens egna uppgifter, intryck från läktaren eller ett rykte, "o" om det är supportrarnas förhoppning eller tyckande.
- min: minuten i utskriften där det sägs.
- citat: 8–30 ord i följd ur utskriften, ordagrant som de står där (också med maskinens stavfel), där det sägs. Välj det ställe där det sägs tydligast eller mest målande, och helst en persons ord i ett stycke, inte ett replikskifte.
- sagt: samma citat på svenska, som det ska tryckas: troget men ledigt översatt, med namnen rättstavade och utan hummanden och omtagningar. Lägg inte till något som inte sägs.
- vem: namnet på den som säger det, bara om det framgår av utskriften (någon tilltalas med namn alldeles före, eller presenteras som gäst). Annars null. Gissa aldrig.
- vikt: 5 = det här kan avgöra matchen eller är en nyhet, 3 = värt att veta, 1 = kuriosa.

Bara det som sägs i utskriften, ingenting ur minnet. Tal bara som de sägs.

Handlar podden uppenbart om en annan klubb än laget ovan (tidningen kan ha fått tag i fel podd) sätter du "ratt_klubb" till false och lämnar listan tom.

Svara bara med JSON, utan något före eller efter:
{"ratt_klubb": true, "handlar_om": "en mening om vad avsnittet handlar om", "uppgifter": [{"a": "trupp", "t": "…", "s": "b", "min": 12, "citat": "…", "sagt": "…", "vem": null, "vikt": 4}]}`,

  sidaPrompt: `Du redigerar en informationssida i en svensk tipstidning: allt det intressanta ur supporterpoddarna och supporterforumet inför en match, samlat så att läsaren kan hämta kunskap ur det.

Du får matchen och, för varje lag, uppgifter som tidningen har tagit ut ur lagets supporterpoddar och supporterforum den här veckan. Varje uppgift har ett id, ett ämne, ett slag (b = bekräftat, h = poddens eller forumets egen uppgift, o = supportrarnas åsikt), en vikt 1–5 och podden eller forumet den kommer ur.

Gör så här:
- Välj det mest intressanta, högst {punkter} punkter per lag. Stryk det som är svagt, det som en annan uppgift redan säger och det som varken rör laget eller matchen (en nyhet om en tredje klubb).
- Säger två uppgifter samma sak (ur två avsnitt, två poddar eller podden och forumet) blir de EN punkt, med bådas id i "ur". Slå aldrig ihop en bekräftad uppgift med en åsikt.
- Gruppera punkterna per lag under ämnena, och ställ den viktigaste först i varje grupp. Flytta en uppgift till ett annat ämne om den passar bättre där.
- Texten i en punkt är en till två meningar, högst 45 ord. Du får skriva om den så att den blir rak och lättläst, men bara med det som står i uppgifterna: inga nya fakta, namn eller tal.
- Skriv en rubrik för sidan på högst {rubrikOrd} ord, om det som är viktigast att veta inför matchen, och en ingress på högst {ingressOrd} ord som säger det viktigaste om båda lagen (om bara det ena laget har uppgifter: om det). Rubriken och ingressen får bara säga det som står i punkterna, och inte göra en gammal sak till en nyhet. Skriv tal i ingressen precis som de står i uppgifterna.

Inga tips: inte vem som vinner, vilket tecken man ska välja eller vem som är favorit, och inga odds. Vanlig svenska utan engelska ord där det finns svenska.

Svara bara med JSON, utan något före eller efter:
{"rubrik": "…", "ingress": "…", "lag": {"<lagets namn som i underlaget>": [{"amne": "trupp", "punkter": [{"ur": ["<id>"], "t": "…"}]}]}}`,
};
