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

  // När genomgången körs, i svensk tid (dag: 0 = söndag, 1 = måndag …; användarens beslut
  // 2026-11-10, före det varje natt): natten mot tisdag för helgens efterhandsavsnitt, natten
  // mot fredag för veckans presskonferenser och lördag morgon för förhandsavsnitten som kom på
  // fredagen. launchd startar skriptet varje natt kl. 02.15 och lördag kl. 08.00 (plist-filen),
  // och skriptet går bara när en av tiderna här har slagit sedan förra gången, så tiderna kan
  // ändras här utan att jobbet installeras om – men bara till de klockslagen.
  tider: [
    { dag: 2, kl: '02:15' },
    { dag: 5, kl: '02:15' },
    { dag: 6, kl: '08:00' },
  ],

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

  // Matchbladet per match. Användarens önskemål 2026-11-10, sist: "ett matchblad med information.
  // Först en kort introduktion, sen diskussion om ena laget, sen det andra och sist en
  // sammanfattning", snygga artiklar med inför-information och något citat ibland (förut
  // punkter under ämnen, med stämplar och citat). Källorna och datumen står under texten i tidningen.
  // 2026-11-11, när lagen fick stå i två spalter mot varandra (Sköldarna möts): "lite mycket text",
  // "Ta fram essensen och skriv på bra svenska/undvik swenglish. Ha gärna med citat", och sedan
  // "liiite längre. Det blir lite torrt här med enbart det essentiella - det går jag ju från
  // statistik och andra API:er. Ta det som är intressant och som möjligtvis inte alltid kommer med i
  // statistiken" och "Det ska vara en njutning att läsa texten också": kortare lagtext (150 → 120
  // ord), det som inte syns i siffrorna, ett citat per lag och personernas namn (i fetstil i tidningen).
  // 2026-11-11 (kväll), "skriva om texten i tidningen helgarderat": bättre svenska och mer levande.
  // Rubriken med en enda vinkel i stället för båda lagens läge, ingressen som drar in läsaren,
  // lagets text som börjar i en scen eller replik, supportrarnas ord i texten, källan inte i varje
  // mening, och de engelska ord som uppgifterna har kvar (comeback, wingback, Trophy) på svenska.
  // 2026-11-12, när tidningen skulle bli lättare att läsa: "kan du göra texten kortare kanske och att
  // det på något sätt skulle göra det mer läsbart? Vi har inte så mycket tid på oss när vi fattar de
  // där besluten - då ska den mest intressanta informationen in - som inte är något som vi kan få
  // info om på andra ställen på sidan såsom viss statistik och skador." Två längder provades på
  // veckans nummer (Kort, 55 ord per lag, och Kortast, 30), och valet blev "någonstans mellan kort
  // och så som det är nu": 95 ord per lag (förut 120), ingen introduktion (rubriken bär vinkeln och
  // sammanfattningen läget), det viktigaste i lagets första mening, två eller tre saker per lag och
  // inget som redan står på sajten (skadelistor, resultat, tabell). Kort får inte bli torrt: det var
  // faktana som var torra förra gången, inte kortheten.
  sidan: {
    // Byts den skrivs bladen om nästa natt, utan att avsnitten tas ut på nytt.
    version: '2026-11-12.1',
    // Lagets senaste avsnitt som bladet bygger på, och så många av uppgifterna som sparas
    // under laget (och blir löptext när redaktörens text inte håller).
    avsnitt: 3,
    punkterPerLag: 8,
    // Rubriken, varje lags text (högst så många stycken, så många meningar och ord) och sammanfattningen.
    rubrikOrd: 9,
    // Ingen introduktion (0): rubriken bär vinkeln och sammanfattningen läget.
    ingressOrd: 0,
    stycken: 3,
    meningar: 'fem till sju',
    lagOrd: 95,
    summeringOrd: 35,
    // Ett citat trycks bara när det är kort.
    citatOrd: 22,
    effort: 'medium',
    // Bara källor från de senaste så här många dagarna före matchen (användarens beslut
    // 2026-11-14: "Det ska vara fräsch information i tidningen - helst från senaste dagarna.
    // I värsta fall 1 vecka gammalt"). Ersatte baraVeckan (måndag till matchen), som var
    // avstängd under provperioden (2026-11-10). Ändras den skrivs bladen om nästa natt.
    dagarFore: 7,
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

  // Byts den tas uppgifterna ut på nytt ur utskrifterna som finns. 2026-11-11.1, perspektiv före fakta (användaren:
  // "Det handlar mer om alternativa perspektiv - inte om kall fakta. Men det kan komma mycket relevant
  // information från forum och poddar också"): urvalet letar efter supportrarnas synsätt, en väl
  // underbyggd åsikt väger som en nyhet, och skador och elva tas bara med när de inte är officiella,
  // kort. Provat på Wednesday–Plymouth och Exeter–Cheltenham med samma forum och poddar: skador och
  // elva gick från 42 av 68 uppgifter till 13 av 71, åsikterna från 26 till 62.
  promptVersion: '2026-11-11.1',

  letaPrompt: `Du hjälper en svensk tipstidning att hitta engelska fotbollsklubbars supporterpoddar.

Du får en lista med klubbar. Under varje klubb står poddarna som Apple Podcasts hittar på klubbens namn och som har kommit ut den senaste månaden. En del av dem handlar om annat: en annan klubb med liknande namn, hela ligan, fantasy, spel eller ett annat land.

Ange för varje klubb upp till tre poddar som supportrar till just den klubben gör om herrarnas a-lag och som kommer ut regelbundet under säsongen. Den mest regelbundna och mest lyssnade först. Välj i första hand bland träffarna. Känner du till en supporterpodd som inte står där, eller hittar du en genom att söka, får du lägga till den. Inte klubbens egen podd om det finns en oberoende, inte BBC, inte poddar om hela ligan, inte historiepoddar och inte damlaget.

Gå igenom VARJE klubb. För klubbar utan användbar träff ska du söka på nätet ("<klubben> fans podcast"), högst {sokningar} gånger sammanlagt. Skriv poddens namn precis som det står hos Apple Podcasts.

Svara bara med JSON, utan något före eller efter:
{"klubbar": {"<klubbens namn som i listan>": ["<poddens namn>", "…"]}}

En tom lista för en klubb där du inte hittar någon.`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna vet redan tabellen, formen, skadelistan, den väntade elvan och oddsen; det får de på andra håll. Det de inte får någon annanstans är hur de som lever med laget ser på det. Tidningen trycker ett matchblad per match som ska ge läsaren supportrarnas egna perspektiv, en annan bild än siffrornas.

Du får utskriften av ett avsnitt ur en engelsk supporterpodd, ett stycke per minut med minuten i hakparentes. Utskriften är gjord av en maskin: namn kan vara felstavade, så rätta dem efter spelarlistan om du får en. Det står inte vem som talar.

Ta ut DE INTRESSANTASTE PERSPEKTIVEN inför lagets nästa match, högst {flest} uppgifter. Ett perspektiv är intressant när det får läsaren att se laget eller matchen på ett annat sätt än siffrorna gör: en motbild mot resultaten, en iakttagelse som bara den som ser varje match gör, en rädsla eller en förväntan med skäl, en tro eller misstro som går emot tabellen. En väl underbyggd åsikt är värd lika mycket som en nyhet. Är värdarna oense är det också värt att veta. Hellre fem skarpa än tolv halvbra. Varje uppgift hör till ett ämne:
- "spel": det supportrarna ser i spelet och som inte syns i resultaten: vem som bär laget och vem som har tappat, var det läcker, vad tränaren håller på med, mönster de har sett vecka efter vecka,
- "klubb": hur de ser på laget och klubben just nu: tron eller misstron, stämningen på läktaren, synen på tränaren och ägarna, oron och hoppet, särskilt när den skiljer sig från bilden utifrån,
- "match": hur de ser på just den här matchen och motståndaren: vad de är rädda för, vad de ser fram emot, gamla räkningar, vad de väntar sig och varför,
- "trupp": skador, avstängningar och vem som är tillbaka, bara det som inte är officiellt än (någon har sett träningen eller hört något), i en mening,
- "elva": vilka som väntas starta, bara när supportrarna ser något särskilt i det (ett val de tycker är fel, en spelare i en ny roll).

Ta INTE med: referat av förra matchen (men gärna vad värdarna drog för slutsatser av den), tabelläget, officiella skadebesked och sådant som står i varje tidning, skämt, småprat, reklam, biljetter, tävlingar och poddens egna angelägenheter. Samma sak tas upp en gång. Uppgiften ska handla om laget ovan eller om matchen; det som bara rör en annan klubb hör inte hit. Finns inget intressant är listan tom, och det är ett bra svar.

Varje uppgift:
- a: ämnet, ett av "trupp", "elva", "spel", "klubb", "match".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha hört podden. Skriv vad som sägs, inte att "podden diskuterar" och inte att det är ett perspektiv eller hur skarpt det är. De som pratar är poddens värdar eller supportrarna, inte "poddarna". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om podden återger något klubben, tränaren eller en spelare har sagt eller något som har hänt, "h" om det är poddens egna uppgifter, intryck från läktaren eller ett rykte, "o" om det är supportrarnas förhoppning eller tyckande.
- min: minuten i utskriften där det sägs.
- citat: 8–30 ord i följd ur utskriften, ordagrant som de står där (också med maskinens stavfel), där det sägs. Välj det ställe där det sägs tydligast eller mest målande, och helst en persons ord i ett stycke, inte ett replikskifte.
- sagt: samma citat på svenska, som det ska tryckas: troget men ledigt översatt, med namnen rättstavade och utan hummanden och omtagningar. Lägg inte till något som inte sägs.
- vem: namnet på den som säger det, bara om det framgår av utskriften (någon tilltalas med namn alldeles före, eller presenteras som gäst). Annars null. Gissa aldrig.
- vikt: 5 = ett perspektiv eller en uppgift som får läsaren att se laget eller matchen på ett nytt sätt, 3 = värt att veta, 1 = kuriosa eller sådant som står i varje tidning. Officiella besked om skador och elva får högst 3.

Bara det som sägs i utskriften, ingenting ur minnet. Tal bara som de sägs.

Handlar podden uppenbart om en annan klubb än laget ovan (tidningen kan ha fått tag i fel podd) sätter du "ratt_klubb" till false och lämnar listan tom.

Svara bara med JSON, utan något före eller efter:
{"ratt_klubb": true, "handlar_om": "en mening om vad avsnittet handlar om", "uppgifter": [{"a": "trupp", "t": "…", "s": "b", "min": 12, "citat": "…", "sagt": "…", "vem": null, "vikt": 4}]}`,

  sidaPrompt: `Du skriver ett matchblad i en svensk tipstidning: en kort text inför en match, byggd på det som supportrarna och de som följer lagen varje vecka säger i sina poddar, forum och insatta medier, och på det klubben och lokaltidningen säger. Läsarna är ett gäng som tippar Stryktipset tillsammans, och de läser bladet medan de bestämmer sig. De har ont om tid. Varje mening ska ge dem något de inte redan vet.

Du får matchen och, för varje lag, uppgifter som tidningen har tagit ut den här veckan ur lagets supporterpoddar, supporterforum och insatta medier (artiklar i fansajter, fanzines, klubbnära nyhetsbrev och hos oberoende lokala reportrar), ur klubbens egen sajt och lokaltidningen (tränarens presskonferens, klubbens skadebesked, lokaltidningens reporter) och ur motståndarlagets intervju med en av lagets supportrar inför matchen. Har laget en ny tränare eller en ny spelare som spelar mycket kan det också finnas det som supportrarna i hans förra klubb har skrivit om honom den senaste veckan: de har sett honom i flera år. Varje uppgift har ett id, ett ämne, ett slag (b = bekräftat, h = källans egen uppgift eller ett rykte, o = supportrarnas eller skribentens åsikt), en vikt 1–5, källans namn (podd, forum, insatta, lokalt = klubben eller lokaltidningen, intervju = motståndarens intervju med en av lagets supportrar, eller förra_klubben = supportrarna i den nyes förra klubb), dagen då det sades och ibland ett citat.

Välj först, skriv sedan. Läsaren har redan tabellen, formen, resultaten, målen, skadelistan, avstängningarna, den väntade elvan och oddsen på andra ställen på sajten, så sådant ska inte stå här. Här ska det stå som bara de som följer laget varje vecka vet och som inte syns i siffrorna: vad de ser i spelet, vem som bär laget och vem som har tappat, stämningen kring laget och tränaren, vad de fruktar eller hoppas inför just den här matchen, rykten och det som rör sig i klubben. En skada, en avstängning eller ett resultat nämns bara i förbigående, när det behövs för att man ska förstå vad supportrarna säger, aldrig som en egen upplysning. Av det som då återstår väljer du det mest intressanta för vart lag, två eller högst tre saker, och stryker resten, också sådant som är sant och hyggligt intressant. Hellre två saker som fastnar än fem som går förbi.

Skriv så här:
- rubrik: högst {rubrikOrd} ord. En riktig tidningsrubrik med en enda vinkel: det mest talande i veckans underlag, gärna med en torr underton när underlaget bjuder på det, men aldrig krystad. Inte en uppräkning av läget i båda lagen.
- lag: ett avsnitt per lag, hemmalaget först. Högst {stycken} korta stycken, sammanlagt {meningar} meningar och högst {lagOrd} ord. Den första meningen bär det viktigaste och ska gå att läsa ensam. Ange i "ur" id för uppgifterna avsnittet bygger på, i "citat" id för en av lagets egna uppgifter vars citat är kort (högst {citatOrd} ord), talande och säger något som texten inte säger (hellre null än ett svagt eller långt), och i "namn" personerna (spelare och tränare) som nämns i texten, så som de står där. Har laget inga uppgifter blir texten en tom lista.
- summering: läget före avspark i en eller två meningar, högst {summeringOrd} ord: det som väger tyngst i vart och ett av lagen, med nya ord och inte rubriken en gång till.

Kort är inte torrt. Det ska vara en njutning att läsa, som några rader från någon som står på läktaren varje vecka:
- Börja lagets text i det mest talande, en iakttagelse, en replik eller en detalj, inte i bakgrund eller en sammanfattning.
- Låt supportrarna höras: väv gärna in en kort fras ur ett av citaten i underlaget, inom citattecken (”…”).
- Säg varifrån det kommer en gång per lag, kort och på olika sätt ("i podden … tror man", "på forumet … är man oense om", "lokaltidningen skriver", "i Wigan minns man honom som …"), inte i varje mening. Håll isär det bekräftade, ryktena och supportrarnas åsikter.
- Hela, raka meningar med konkreta detaljer ur underlaget. Inga listor, klichéer, upprepningar eller utfyllnad, och inget om själva underlaget ("det finns bara en uppgift", "inget att hämta den här veckan").
- Högst ett tal per lag, och bara när talet är själva poängen.

Språket: skriv som en svensk sportjournalist, i hela meningar med svensk ordföljd och svenska fotbollsord. Uppgifterna är översatta från engelska och har ibland kvar engelska ord och uttryck: skriv dem på svenska (comeback → återkomst, wingback → vingback, forward → anfallare, fans → supportrar, Trophy → EFL Trophy, "i den röda zonen" → säg vad det betyder). Ett smeknamn som en svensk läsare inte förstår ersätts med spelarens namn eller stryks. Läs igenom allt innan du svarar och skriv om varje mening som låter översatt, hackar eller inte håller ihop.

Bara det som står i uppgifterna: inga nya fakta, namn eller tal, och gör inte en gammal sak till en nyhet. Skriv tal precis som de står i uppgifterna. Inga tips: inte vem som vinner, vilket tecken man ska välja eller vem som är favorit, och inga odds.

Svara bara med JSON, utan något före eller efter:
{"rubrik": "…", "lag": {"<lagets namn som i underlaget>": {"ur": ["<id>"], "text": ["…"], "citat": null, "namn": ["…"]}}, "summering": "…"}`,
};
