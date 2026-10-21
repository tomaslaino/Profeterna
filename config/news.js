'use strict';

// ============================================================================
// Nyheter till matchanalysen. När någon trycker på Analysera hämtar
// src/news.mjs det senaste om matchen och lagen online – förhandsartiklar,
// trupp- och skadeläge, presskonferenser, väder – och lägger det i underlaget
// som datapunkter med källa, datum och länk, på samma sätt som Gräva guld gör
// med sin datatabell. Nyheterna är rapporterat i media, inte kontrollerat av
// Matchfixarna, och påverkar aldrig prognosens siffror.
//
// Alla källor är öppna och kräver ingen nyckel, så samma kod kan köras både i
// proxyn (Cloudflare Workers) och lokalt i Express-servern.
//
// Ändras källorna, filtren eller formatet byts versionen, så att gamla
// nyhetsunderlag i cachen inte återanvänds.
// ============================================================================

module.exports = {
  version: '2026-10-18.1',

  // Artiklar från de senaste så här många dagarna tas med.
  windowDays: 10,
  // Så många artiklar går till språkmodellen (de mest relevanta först) …
  maxItems: 14,
  // … och för så många av dem hämtas själva texten, högst bodyChars tecken.
  // Texten går bara till modellen och visas aldrig på sajten.
  maxBodies: 8,
  bodyChars: 2500,
  // Ett hämtat nyhetsunderlag återanvänds så här länge för samma match, så att
  // flera klick i rad ger samma underlag (och samma cachade analys).
  cacheMinutes: 30,
  // Per anrop. Allt hämtas parallellt, så en analys väntar högst ungefär så
  // här länge på nyheterna (plus artikeltexterna).
  timeoutMs: 10000,
  // Längre sidor än så läses inte (begränsar processortiden i proxyn).
  maxPageBytes: 400000,

  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',

  sources: {
    // Bing News som RSS: artiklar från alla brittiska medier (lokaltidningar,
    // Sky, Sports Mole, Football365, ESPN m.fl.) med riktiga länkar. {home}
    // och {away} ersätts med lagens söknamn (names nedan).
    bing: {
      enabled: true,
      market: 'en-GB',
      // Matchen, lagens truppläge och det senaste om varje lag (det sista ger
      // mindre klubbar, som det skrivs lite om, något att gå på).
      queries: ['{home} {away}', '{home} team news', '{away} team news', '{home} FC', '{away} FC'],
    },
    // ESPN:s öppna API: lagens nyheter (med hel artikeltext) och arenans stad.
    espn: { enabled: true },
    // BBC Sports nyhetsflöde per lag (feeds.bbci.co.uk). Slug = namnet med
    // gemener och bindestreck – stämmer för alla 92 ligalag (kontrollerat
    // 2026-10-18); avvikelser läggs i bbcSlugs.
    bbc: { enabled: true },
    // Väderprognos för arenans stad vid avspark (Open-Meteo, finns 16 dagar
    // fram).
    weather: { enabled: true },
  },

  // Rubriker och adresser som aldrig tas med: spelreklam och tittarguider.
  // Spelrådens odds och tips hör inte hemma i en analys som inte ger spelråd.
  excludeTitle: /\b(bet builder|betting|picks|tips and odds|tips & odds|welcome offer|sign[- ]?up offer|free bets?|bet £|acca|accumulator|odds boost|enhanced odds|best odds|how to watch|where to watch|live stream|tv channel|kick-off time and tv|tickets?)\b/i,
  excludeUrl: /\/(betting|bet|tips|free-bets|offers?)\//i,
  excludeDomains: [
    'racingpost.com', 'oddschecker.com', 'freesupertips.com', 'bettingexpert.com',
    'covers.com', 'sportsgambler.com', 'betfair.com', 'bet365.com', 'paddypower.com',
    'skybet.com', 'williamhill.com', 'ladbrokes.com', 'coral.co.uk', 'betway.com',
    'betfanatics.com',
  ],

  // Sajter vars artikeltext inte hämtas – rubrik och ingress från sökningen
  // räcker. Dels betalväggar, dels sajter som är spärrade i hosts-filen på
  // utvecklingsdatorn, så att analysen blir densamma lokalt och i proxyn.
  noBody: [
    'bbc.co.uk', 'bbc.com', 'theguardian.com', 'telegraph.co.uk', 'independent.co.uk',
    'dailymail.co.uk', 'nytimes.com', 'theathletic.com', 'thetimes.com', 'thetimes.co.uk',
    'reuters.com', 'ft.com',
  ],

  // ESPN-namn → [söknamn, fler namn som räknas som laget i en rubrik]. Söknamnet
  // används i Bing-frågorna; alla namnen (plus ESPN-namnet) när en artikel ska
  // knytas till ett lag. Smeknamn bara där de är entydiga ("Blues", "Robins"
  // och liknande delas av flera klubbar och står inte här). Lag som saknas får
  // ESPN-namnet utan "AFC"/"FC".
  names: {
    'AFC Bournemouth': ['Bournemouth', 'Cherries'],
    'AFC Wimbledon': ['AFC Wimbledon', 'Wimbledon'],
    'Accrington Stanley': ['Accrington Stanley', 'Accrington'],
    'Arsenal': ['Arsenal', 'Gunners'],
    'Aston Villa': ['Aston Villa', 'Villa'],
    'Barnet': ['Barnet'],
    'Barnsley': ['Barnsley', 'Tykes'],
    'Birmingham City': ['Birmingham City', 'Birmingham'],
    'Blackburn Rovers': ['Blackburn Rovers', 'Blackburn'],
    'Blackpool': ['Blackpool', 'Tangerines'],
    'Bolton Wanderers': ['Bolton Wanderers', 'Bolton', 'Trotters'],
    'Bradford City': ['Bradford City', 'Bradford', 'Bantams'],
    'Brentford': ['Brentford'],
    'Brighton & Hove Albion': ['Brighton', 'Seagulls'],
    'Bristol City': ['Bristol City'],
    'Bristol Rovers': ['Bristol Rovers', 'Gas'],
    'Bromley': ['Bromley'],
    'Burnley': ['Burnley', 'Clarets'],
    'Burton Albion': ['Burton Albion', 'Burton', 'Brewers'],
    'Cambridge United': ['Cambridge United', 'Cambridge'],
    'Cardiff City': ['Cardiff City', 'Cardiff', 'Bluebirds'],
    'Charlton Athletic': ['Charlton Athletic', 'Charlton', 'Addicks'],
    'Chelsea': ['Chelsea'],
    'Cheltenham Town': ['Cheltenham Town', 'Cheltenham'],
    'Chesterfield': ['Chesterfield', 'Spireites'],
    'Colchester United': ['Colchester United', 'Colchester'],
    'Coventry City': ['Coventry City', 'Coventry', 'Sky Blues'],
    'Crawley Town': ['Crawley Town', 'Crawley'],
    'Crewe Alexandra': ['Crewe Alexandra', 'Crewe'],
    'Crystal Palace': ['Crystal Palace', 'Palace'],
    'Derby County': ['Derby County', 'Derby', 'Rams'],
    'Doncaster Rovers': ['Doncaster Rovers', 'Doncaster'],
    'Everton': ['Everton', 'Toffees'],
    'Exeter City': ['Exeter City', 'Exeter', 'Grecians'],
    'Fleetwood Town': ['Fleetwood Town', 'Fleetwood'],
    'Fulham': ['Fulham', 'Cottagers'],
    'Gillingham': ['Gillingham', 'Gills'],
    'Grimsby Town': ['Grimsby Town', 'Grimsby', 'Mariners'],
    'Huddersfield Town': ['Huddersfield Town', 'Huddersfield', 'Terriers'],
    'Hull City': ['Hull City', 'Hull', 'Tigers'],
    'Ipswich Town': ['Ipswich Town', 'Ipswich', 'Tractor Boys'],
    'Leeds United': ['Leeds United', 'Leeds'],
    'Leicester City': ['Leicester City', 'Leicester', 'Foxes'],
    'Leyton Orient': ['Leyton Orient', 'Orient'],
    'Lincoln City': ['Lincoln City', 'Lincoln', 'Imps'],
    'Liverpool': ['Liverpool'],
    'Luton Town': ['Luton Town', 'Luton', 'Hatters'],
    'Manchester City': ['Manchester City', 'Man City'],
    'Manchester United': ['Manchester United', 'Man United', 'Man Utd', 'Red Devils'],
    'Mansfield Town': ['Mansfield Town', 'Mansfield', 'Stags'],
    'Middlesbrough': ['Middlesbrough', 'Boro'],
    'Millwall': ['Millwall'],
    'Milton Keynes Dons': ['MK Dons', 'Milton Keynes Dons'],
    'Newcastle United': ['Newcastle United', 'Newcastle'],
    'Newport County': ['Newport County', 'Newport'],
    'Northampton Town': ['Northampton Town', 'Northampton', 'Cobblers'],
    'Norwich City': ['Norwich City', 'Norwich', 'Canaries'],
    'Nottingham Forest': ['Nottingham Forest', 'Forest', "Nott'm Forest"],
    'Notts County': ['Notts County'],
    'Oldham Athletic': ['Oldham Athletic', 'Oldham'],
    'Oxford United': ['Oxford United', 'Oxford'],
    'Peterborough United': ['Peterborough United', 'Peterborough', 'Posh'],
    'Plymouth Argyle': ['Plymouth Argyle', 'Plymouth', 'Pilgrims'],
    'Port Vale': ['Port Vale', 'Valiants'],
    'Portsmouth': ['Portsmouth', 'Pompey'],
    'Preston North End': ['Preston North End', 'Preston', 'PNE'],
    'Queens Park Rangers': ['QPR', 'Queens Park Rangers'],
    'Reading': ['Reading FC', 'Reading', 'Royals'],
    'Rochdale': ['Rochdale'],
    'Rotherham United': ['Rotherham United', 'Rotherham', 'Millers'],
    'Salford City': ['Salford City', 'Salford'],
    'Sheffield United': ['Sheffield United', 'Sheff Utd', 'Blades'],
    'Sheffield Wednesday': ['Sheffield Wednesday', 'Sheff Wed', 'Owls'],
    'Shrewsbury Town': ['Shrewsbury Town', 'Shrewsbury', 'Shrews'],
    'Southampton': ['Southampton', 'Saints'],
    'Stevenage': ['Stevenage'],
    'Stockport County': ['Stockport County', 'Stockport'],
    'Stoke City': ['Stoke City', 'Stoke', 'Potters'],
    'Sunderland': ['Sunderland', 'Black Cats'],
    'Swansea City': ['Swansea City', 'Swansea', 'Swans'],
    'Swindon Town': ['Swindon Town', 'Swindon'],
    'Tottenham Hotspur': ['Tottenham', 'Spurs'],
    'Tranmere Rovers': ['Tranmere Rovers', 'Tranmere'],
    'Walsall': ['Walsall', 'Saddlers'],
    'Watford': ['Watford', 'Hornets'],
    'West Bromwich Albion': ['West Brom', 'West Bromwich Albion', 'Baggies'],
    'West Ham United': ['West Ham', 'Hammers'],
    'Wigan Athletic': ['Wigan Athletic', 'Wigan'],
    'Wolverhampton Wanderers': ['Wolves', 'Wolverhampton Wanderers', 'Wolverhampton'],
    'Wrexham': ['Wrexham'],
    'Wycombe Wanderers': ['Wycombe Wanderers', 'Wycombe', 'Chairboys'],
    'York City': ['York City'],
  },

  // BBC-slugs som avviker från regeln (gemener, "&" → "and", bindestreck).
  bbcSlugs: {},
};
