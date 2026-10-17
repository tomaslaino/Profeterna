'use strict';

// De sex tävlingarna appen gör prognoser för. espn = ligakod i ESPN:s öppna
// API, fdcouk = divisionskod hos football-data.co.uk (finns bara för ligorna),
// tier = nivå i ligasystemet (cuperna har ingen egen nivå).
const COMPETITIONS = [
  { id: 'pl', name: 'Premier League', short: 'PL', espn: 'eng.1', fdcouk: 'E0', understat: 'EPL', fpl: true, tier: 1, type: 'league' },
  { id: 'ch', name: 'Championship', short: 'CH', espn: 'eng.2', fdcouk: 'E1', tier: 2, type: 'league' },
  { id: 'l1', name: 'League One', short: 'L1', espn: 'eng.3', fdcouk: 'E2', tier: 3, type: 'league' },
  { id: 'l2', name: 'League Two', short: 'L2', espn: 'eng.4', fdcouk: 'E3', tier: 4, type: 'league' },
  { id: 'fac', name: 'FA Cup', short: 'FAC', espn: 'eng.fa', tier: null, type: 'cup' },
  { id: 'lc', name: 'EFL Cup', short: 'EFL', espn: 'eng.league_cup', tier: null, type: 'cup' },
];

// National League (nivå 5) är ingen egen tävling i appen, men underlag för
// non-league-lagen i FA-cupen (football-data.co.uk "EC").
const NATIONAL_LEAGUE = { id: 'nl', name: 'National League', short: 'NL', fdcouk: 'EC', tier: 5, type: 'league' };

// Innevarande säsong. ESPN hämtas månad för månad (datumintervall ger
// HTTP 400, månadsformatet YYYYMM fungerar – verifierat 2026-10-17).
const SEASON = {
  label: '2026/27',
  fdcouk: '2627',
  understat: 2026,
  firstMonth: '2026-07',
  lastMonth: '2027-06',
};

function competition(id) {
  return COMPETITIONS.find((c) => c.id === id) || (id === NATIONAL_LEAGUE.id ? NATIONAL_LEAGUE : null);
}

module.exports = { COMPETITIONS, NATIONAL_LEAGUE, SEASON, competition };
