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

// Europacuperna: ingen prognos, bara underlag om lagens schema (vila och
// matcher i veckan) och formen. ESPN har gruppspel/ligafas och slutspel under
// `espn`, kvalomgångarna (juli–augusti) under `qual` – verifierat 2026-10-18
// (Brighton i Conference Leagues playoffomgång i augusti 2026).
const EUROPE = [
  { id: 'ucl', name: 'Champions League', short: 'CL', espn: 'uefa.champions', qual: 'uefa.champions_qual', type: 'europe' },
  { id: 'uel', name: 'Europa League', short: 'EL', espn: 'uefa.europa', qual: 'uefa.europa_qual', type: 'europe' },
  { id: 'uecl', name: 'Conference League', short: 'ECL', espn: 'uefa.europa.conf', qual: 'uefa.europa.conf_qual', type: 'europe' },
];

// Innevarande säsong. ESPN hämtas månad för månad (datumintervall ger
// HTTP 400, månadsformatet YYYYMM fungerar – verifierat 2026-10-17).
const SEASON = {
  label: '2026/27',
  fdcouk: '2627',
  understat: 2026,
  firstMonth: '2026-07',
  lastMonth: '2027-06',
};

// Tidigare säsonger – underlag för baslinjerna och grundmodellen (fas 2) och
// för walk-forward-backtestet (fas 4). Avslutade säsonger ändras inte, så de
// hämtas sällan (se src/sources.js).
//
// football-data.co.uk: E0–E3 finns från 2000/01, EC (National League) från
// 2005/06 – 2000/01–2004/05 svarar 300 (verifierat 2026-10-17).
// ESPN FA-cupen: från first round proper; behövs för lag under National
// League, som saknar egen lagdata (historiskt utfall för samma nivå).
// Rundornas namn varierar mellan säsongerna ("round-1", "1st-round",
// "first-round") – därför används de inte i historiken.
//
// Domarna (matchrutan): kort och frisparkar de senaste avslutade säsongerna
// ur football-data.co.uk, med samma säsonger på alla nivåer.
const HISTORY = {
  fdcouk: { first: { E0: 2000, E1: 2000, E2: 2000, E3: 2000, EC: 2005 }, last: 2025 },
  espnFaCup: { first: 2021, last: 2025, months: ['10', '11', '12', '01', '02', '03', '04', '05'] },
  referees: { seasons: 3 },
};

// Säsongskod hos football-data.co.uk: startår 2025 → "2526".
function fdSeasonCode(startYear) {
  const yy = (y) => String(y % 100).padStart(2, '0');
  return `${yy(startYear)}${yy(startYear + 1)}`;
}

function competition(id) {
  return COMPETITIONS.find((c) => c.id === id) || (id === NATIONAL_LEAGUE.id ? NATIONAL_LEAGUE : null)
    || EUROPE.find((c) => c.id === id) || null;
}

module.exports = { COMPETITIONS, NATIONAL_LEAGUE, EUROPE, SEASON, HISTORY, fdSeasonCode, competition };
