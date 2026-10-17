'use strict';

// Register över alla nätverkskällor. Varje källa har eget hämtintervall
// (maxAgeHours) och en gräns för när datan räknas som gammal
// (staleAfterHours). Metadatan (leverantör, vad den ger, verifieringsdatum)
// visas i källtabellen – samma uppgifter som README:ns källtabell.

const { COMPETITIONS, NATIONAL_LEAGUE, SEASON } = require('../config/competitions');
const espn = require('./fetchers/espn');
const fdcouk = require('./fetchers/fdcouk');
const understat = require('./fetchers/understat');
const fpl = require('./fetchers/fpl');
const { readCache } = require('./store');

const VERIFIED = '2026-10-17';
const ODDS_WINDOW_DAYS = 7;

const SOURCES = [];

for (const c of COMPETITIONS) {
  SOURCES.push({
    id: `espn_fixtures_${c.id}`,
    provider: 'ESPN',
    short: 'ESPN',
    label: `Spelprogram och resultat – ${c.name}`,
    comps: [c.id],
    kinds: ['fixtures'],
    // Under en halvtimme, så att varje schemalagd körning (var 30:e min)
    // hämtar färska resultat.
    maxAgeHours: 0.4,
    staleAfterHours: 6,
    verified: VERIFIED,
    fetch: () => espn.fetchFixtures(c.espn, SEASON),
    summarize: (d) => {
      const played = d.matches.filter((m) => m.completed);
      return {
        n: d.matches.length,
        detail: d.matches.length ? `${played.length} spelade av ${d.matches.length}` : 'inga matcher publicerade än',
        latestData: played.length ? played[played.length - 1].kickoff.slice(0, 10) : null,
      };
    },
  });
}

for (const c of COMPETITIONS.filter((x) => x.type === 'league')) {
  SOURCES.push({
    id: `espn_standings_${c.id}`,
    provider: 'ESPN',
    short: 'ESPN',
    label: `Tabell – ${c.name}`,
    comps: [c.id],
    kinds: ['table'],
    maxAgeHours: 3,
    staleAfterHours: 24,
    verified: VERIFIED,
    fetch: () => espn.fetchStandings(c.espn),
    summarize: (d) => ({ n: d.rows.length, detail: `${d.rows.length} lag` }),
  });
}

SOURCES.push({
  id: 'espn_odds',
  provider: 'ESPN (DraftKings)',
  short: 'DraftKings',
  label: `Odds 1X2 och över/under, matcher inom ${ODDS_WINDOW_DAYS} dagar`,
  comps: COMPETITIONS.map((c) => c.id),
  kinds: ['odds'],
  maxAgeHours: 6,
  staleAfterHours: 24,
  verified: VERIFIED,
  // Läser spelprogrammet ur cachen – körs därför i andra steget.
  stage: 2,
  fetch: () => {
    const events = upcomingEvents(ODDS_WINDOW_DAYS);
    if (events === null) throw new Error('inget spelprogram i cachen än');
    return espn.fetchOdds(events);
  },
  summarize: (d) => ({
    n: Object.keys(d.byEvent).length,
    detail: `${Object.keys(d.byEvent).length} av ${d.requested} matcher har odds`,
  }),
});

for (const c of [...COMPETITIONS.filter((x) => x.fdcouk), NATIONAL_LEAGUE]) {
  SOURCES.push({
    id: `fdcouk_${c.fdcouk}`,
    provider: 'football-data.co.uk',
    short: 'football-data',
    label: `Resultat, skott, xG och odds – ${c.name}`,
    comps: [c.id],
    kinds: c.id === 'nl' ? ['stats', 'odds'] : ['stats', 'xg', 'odds'],
    maxAgeHours: 12,
    staleAfterHours: 48,
    verified: VERIFIED,
    fetch: () => fdcouk.fetchDivision(c.fdcouk, SEASON.fdcouk),
    summarize: (d) => ({
      n: d.rows.length,
      detail: `${d.rows.length} matcher`,
      latestData: d.lastMatchDate,
    }),
  });
}

SOURCES.push({
  id: 'fdcouk_fixtures',
  provider: 'football-data.co.uk',
  short: 'football-data',
  label: 'Kommande ligamatcher med odds',
  comps: ['pl', 'ch', 'l1', 'l2', 'nl'],
  kinds: ['odds'],
  maxAgeHours: 6,
  staleAfterHours: 48,
  verified: VERIFIED,
  fetch: () => fdcouk.fetchFixtures(['E0', 'E1', 'E2', 'E3', 'EC']),
  summarize: (d) => ({ n: d.rows.length, detail: `${d.rows.length} matcher` }),
});

SOURCES.push({
  id: 'understat_epl',
  provider: 'Understat',
  short: 'Understat',
  label: 'xG per match – Premier League',
  comps: ['pl'],
  kinds: ['xg'],
  maxAgeHours: 12,
  staleAfterHours: 48,
  verified: VERIFIED,
  fetch: () => understat.fetchLeague('EPL', SEASON.understat),
  summarize: (d) => {
    const played = d.matches.filter((m) => m.played);
    return {
      n: played.length,
      detail: `${played.length} matcher med xG`,
      latestData: played.length ? played.map((m) => m.kickoff).sort().pop().slice(0, 10) : null,
    };
  },
});

SOURCES.push({
  id: 'fpl',
  provider: 'Fantasy Premier League',
  short: 'FPL',
  label: 'Skador och avstängningar – Premier League',
  comps: ['pl'],
  kinds: ['squad'],
  maxAgeHours: 3,
  staleAfterHours: 24,
  verified: VERIFIED,
  fetch: () => fpl.fetchBootstrap(),
  summarize: (d) => {
    const out = d.players.filter((p) => ['i', 's', 'd'].includes(p.status)).length;
    return { n: d.players.length, detail: `${d.players.length} spelare, ${out} skadade/tveksamma/avstängda` };
  },
});

// Kommande matcher (alla tävlingar) inom `days` dagar ur spelprogramscachen.
// null = inget spelprogram cachat än.
function upcomingEvents(days) {
  const now = Date.now();
  const until = now + days * 86400000;
  let any = false;
  const out = [];
  for (const c of COMPETITIONS) {
    const cache = readCache(`espn_fixtures_${c.id}`);
    if (!cache || !cache.data) continue;
    any = true;
    for (const m of cache.data.matches) {
      const t = new Date(m.kickoff).getTime();
      if (!m.completed && t >= now - 3 * 3600000 && t <= until) out.push({ slug: c.espn, id: m.id });
    }
  }
  return any ? out : null;
}

module.exports = { SOURCES, VERIFIED, ODDS_WINDOW_DAYS };
