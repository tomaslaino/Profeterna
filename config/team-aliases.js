'use strict';

// Lagnamn i andra källor → ESPN:s visningsnamn (ESPN är kanonisk källa för
// spelprogrammet). Namn som redan stämmer efter normalisering (gemener,
// "&" = "and", utan punkt/apostrof) behöver ingen rad här.
//
// Tabellen är uttrycklig med avsikt: ett namn som inte finns här och inte
// stämmer efter normalisering mappas INTE på gissning (t.ex. prefixmatchning,
// där "Bristol" eller "Sheffield" vore tvetydiga), utan listas som omappat i
// källtabellen. Byggd 2026-10-17 ur samtliga namn i football-data.co.uk
// E0–E3 + EC, Understat EPL och FPL för säsongen 2026/27.
//
// Non-league-namnen (EC) pekar på ESPN-namnen som de använde i FA-cupen
// 2025/26 där de fanns; övriga är antagna och syns som omappade om ESPN
// skriver annorlunda.
const ALIASES = {
  // football-data.co.uk (E0–E3)
  'Accrington': 'Accrington Stanley',
  'Birmingham': 'Birmingham City',
  'Blackburn': 'Blackburn Rovers',
  'Bolton': 'Bolton Wanderers',
  'Bournemouth': 'AFC Bournemouth',
  'Bradford': 'Bradford City',
  'Brighton': 'Brighton & Hove Albion',
  'Bristol Rvs': 'Bristol Rovers',
  'Burton': 'Burton Albion',
  'Cambridge': 'Cambridge United',
  'Cardiff': 'Cardiff City',
  'Charlton': 'Charlton Athletic',
  'Cheltenham': 'Cheltenham Town',
  'Colchester': 'Colchester United',
  'Coventry': 'Coventry City',
  'Crewe': 'Crewe Alexandra',
  'Derby': 'Derby County',
  'Doncaster': 'Doncaster Rovers',
  'Exeter': 'Exeter City',
  'Grimsby': 'Grimsby Town',
  'Huddersfield': 'Huddersfield Town',
  'Hull': 'Hull City',
  'Ipswich': 'Ipswich Town',
  'Leeds': 'Leeds United',
  'Leicester': 'Leicester City',
  'Lincoln': 'Lincoln City',
  'Luton': 'Luton Town',
  'Man City': 'Manchester City',
  'Man United': 'Manchester United',
  'Mansfield': 'Mansfield Town',
  'Newcastle': 'Newcastle United',
  'Northampton': 'Northampton Town',
  'Norwich': 'Norwich City',
  "Nott'm Forest": 'Nottingham Forest',
  'Oldham': 'Oldham Athletic',
  'Oxford': 'Oxford United',
  'Peterboro': 'Peterborough United',
  'Plymouth': 'Plymouth Argyle',
  'Preston': 'Preston North End',
  'QPR': 'Queens Park Rangers',
  'Rotherham': 'Rotherham United',
  'Salford': 'Salford City',
  'Sheffield Weds': 'Sheffield Wednesday',
  'Shrewsbury': 'Shrewsbury Town',
  'Stockport': 'Stockport County',
  'Stoke': 'Stoke City',
  'Swansea': 'Swansea City',
  'Swindon': 'Swindon Town',
  'Tottenham': 'Tottenham Hotspur',
  'Tranmere': 'Tranmere Rovers',
  'West Brom': 'West Bromwich Albion',
  'West Ham': 'West Ham United',
  'Wigan': 'Wigan Athletic',
  'Wolves': 'Wolverhampton Wanderers',
  'Wycombe': 'Wycombe Wanderers',
  'York': 'York City',

  // football-data.co.uk (EC, National League)
  'Aldershot': 'Aldershot Town',
  'Boston Utd': 'Boston United',
  'Carlisle': 'Carlisle United',
  'Forest Green': 'Forest Green Rovers',
  'Fylde': 'AFC Fylde',
  'Halifax': 'FC Halifax Town',
  'Harrogate': 'Harrogate Town',
  'Hartlepool': 'Hartlepool United',
  'Kidderminster': 'Kidderminster Harriers',
  'Scunthorpe': 'Scunthorpe United',
  'Solihull': 'Solihull Moors',
  'Southend': 'Southend United',
  'Sutton': 'Sutton United',
  'Yeovil': 'Yeovil Town',

  // FPL (det som inte redan täcks ovan)
  'Man Utd': 'Manchester United',
  'Spurs': 'Tottenham Hotspur',
  'Sheffield Utd': 'Sheffield United',
};

module.exports = { ALIASES };
