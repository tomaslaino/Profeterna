'use strict';

// Källorna för spelardatan (trupp och spelarstatistik per liga, speltiden
// utanför Premier League, målen och startelvorna ur matchrapporterna i alla
// fyra ligor och cuperna, och spelarnas betyg och bilder från 365Scores).
// Egen fil så att registret i src/sources.js bara behöver en rad för att ta
// med dem.
//
// Nations League (sedan 2026-11-14) har samma källor som ligorna – landslagens
// trupper med siffrorna i Nations League, matchrapporterna, betygen och
// bilderna – och dessutom lagens siffror per match från 365Scores (xG, skott,
// hörnor, frisparkar och kort), som ligorna har ur football-data.co.uk.

const { COMPETITIONS, INTERNATIONAL } = require('../config/competitions');
const espnPlayers = require('./fetchers/espnplayers');
const espnMinutes = require('./fetchers/espnminutes');
const s365Ratings = require('./fetchers/s365ratings');
const s365Squads = require('./fetchers/s365squads');
const s365Stats = require('./fetchers/s365stats');
const { readCache } = require('./store');

// Ligorna och Nations League: de tävlingar som har spelare och lagens siffror.
const LEAGUES = [...COMPETITIONS.filter((c) => c.type === 'league'), INTERNATIONAL.find((c) => c.id === 'unl')];

const PLAYER_SOURCES = LEAGUES.map((c) => ({
  id: `espn_players_${c.id}`,
  provider: 'ESPN',
  short: 'ESPN',
  label: `Trupper och spelarstatistik – ${c.name}`,
  comps: [c.id],
  kinds: ['players'],
  // En gång per halvdygn räcker: statistiken ändras bara när det spelats.
  maxAgeHours: 12,
  staleAfterHours: 72,
  verified: c.type === 'intl' ? '2026-11-14' : '2026-10-18',
  fetch: () => espnPlayers.fetchLeaguePlayers(c.espn),
  summarize: (d) => {
    const all = d.teams.flatMap((t) => t.players);
    const used = all.filter((p) => p.stats && p.stats.app > 0).length;
    return { n: all.length, detail: `${d.teams.length} lag, ${all.length} spelare, ${used} har spelat` };
  },
}));

// Speltid, mål och startelvor per spelare ur ESPN:s matchrapporter. Premier
// League har speltiden redan från FPL och använder rapporterna för målen och
// startelvorna (den beräknade startelvan, src/startelvor.js). Läser
// spelprogrammet ur cachen (andra steget) och hämtar bara rapporterna för
// matcher som inte redan finns sparade.
for (const c of LEAGUES) {
  const id = `espn_minutes_${c.id}`;
  PLAYER_SOURCES.push({
    id,
    provider: 'ESPN',
    short: 'ESPN',
    label: `${c.fpl ? 'Målen' : c.type === 'intl' ? 'Speltid, mål och spelarnas siffror' : 'Speltid och mål'} per spelare och startelvorna ur matchrapporterna – ${c.name}`,
    comps: [c.id],
    kinds: ['players', 'lineups'],
    maxAgeHours: 6,
    staleAfterHours: 72,
    verified: '2026-10-20',
    stage: 2,
    fetch: () => {
      const fx = readCache(`espn_fixtures_${c.id}`);
      if (!fx || !fx.data) throw new Error('inget spelprogram i cachen än');
      const played = fx.data.matches.filter((m) => m.completed && m.score)
        .map((m) => ({ id: m.id, kickoff: m.kickoff, status: m.status }));
      const prev = readCache(id);
      // Landslagen: spelarnas siffror per match också (src/players.js räknar dem ur rapporterna)
      return espnMinutes.fetchMinutes(c.espn, played, prev && prev.data, { players: c.type === 'intl' });
    },
    summarize: (d) => {
      const n = Object.keys(d.matches).length;
      return {
        n,
        detail: `${n} av ${d.played} spelade matcher${d.missing ? `, ${d.missing} hämtas nästa gång` : ''}`,
        latestData: n ? Object.values(d.matches).map((m) => m.k).sort().pop().slice(0, 10) : null,
      };
    },
  });
}

// Startelvorna i cuperna ur samma matchrapporter, för den beräknade
// startelvan (src/startelvor.js): hur mycket lagen roterar i cupen. Speltiden
// och målen följer med men används inte.
for (const c of COMPETITIONS.filter((x) => x.type === 'cup')) {
  const id = `espn_elvor_${c.id}`;
  PLAYER_SOURCES.push({
    id,
    provider: 'ESPN',
    short: 'ESPN',
    label: `Startelvor ur matchrapporterna – ${c.name}`,
    comps: [c.id],
    kinds: ['lineups'],
    maxAgeHours: 6,
    staleAfterHours: 72,
    verified: '2026-11-07',
    stage: 2,
    fetch: () => {
      const fx = readCache(`espn_fixtures_${c.id}`);
      if (!fx || !fx.data) throw new Error('inget spelprogram i cachen än');
      const played = fx.data.matches.filter((m) => m.completed && m.score)
        .map((m) => ({ id: m.id, kickoff: m.kickoff, status: m.status }));
      const prev = readCache(id);
      return espnMinutes.fetchMinutes(c.espn, played, prev && prev.data);
    },
    summarize: (d) => {
      const n = Object.keys(d.matches).length;
      return {
        n,
        detail: `${n} av ${d.played} spelade matcher${d.missing ? `, ${d.missing} hämtas nästa gång` : ''}`,
        latestData: n ? Object.values(d.matches).map((m) => m.k).sort().pop().slice(0, 10) : null,
      };
    },
  });
}

// Spelarnas betyg per match från 365Scores. Ligorna hos 365Scores
// (verifierat 2026-10-19, samma som i public/matchruta.js). Läser
// spelprogrammet ur cachen och hämtar bara matcher som inte redan är sparade.
// UEFA Nations League är 7016 (verifierat 2026-11-14: 54 landslag, betyg och
// xG i alla matcher).
const COMP365 = { pl: 7, ch: 1, l1: 2, l2: 3, unl: 7016 };
for (const c of LEAGUES) {
  const id = `s365_ratings_${c.id}`;
  PLAYER_SOURCES.push({
    id,
    provider: '365Scores',
    short: '365Scores',
    label: `Spelarnas betyg per match – ${c.name}`,
    comps: [c.id],
    kinds: ['players'],
    maxAgeHours: 6,
    staleAfterHours: 72,
    verified: '2026-10-20',
    stage: 2,
    fetch: () => {
      const fx = readCache(`espn_fixtures_${c.id}`);
      if (!fx || !fx.data) throw new Error('inget spelprogram i cachen än');
      const played = fx.data.matches.filter((m) => m.completed && m.score)
        .map((m) => ({ id: m.id, kickoff: m.kickoff, home: m.home, away: m.away }));
      const prev = readCache(id);
      return s365Ratings.fetchRatings(COMP365[c.id], played, prev && prev.data);
    },
    summarize: (d) => {
      const all = Object.values(d.matches);
      const n = all.filter((m) => m.t).length;
      return {
        n,
        detail: `${n} av ${d.played} spelade matcher med betyg` +
          (d.missing ? `, ${d.missing} saknas${d.unmatched ? ` (${d.unmatched} hittades inte hos 365Scores)` : ''}` : ''),
        latestData: n ? all.filter((m) => m.t).map((m) => m.k).sort().pop().slice(0, 10) : null,
      };
    },
  });
}

// Trupperna hos 365Scores, för spelarnas bilder i spelarkortet. Läser
// ESPN-trupperna ur cachen för att para ihop lagen. En gång per dygn räcker:
// trupper och bilder ändras sällan.
for (const c of LEAGUES) {
  PLAYER_SOURCES.push({
    id: `s365_squads_${c.id}`,
    provider: '365Scores',
    short: '365Scores',
    label: `Spelarnas bilder – ${c.name}`,
    comps: [c.id],
    kinds: ['players'],
    maxAgeHours: 24,
    staleAfterHours: 24 * 7,
    verified: '2026-10-20',
    stage: 2,
    fetch: () => {
      const ep = readCache(`espn_players_${c.id}`);
      if (!ep || !ep.data) throw new Error('inga ESPN-trupper i cachen än');
      return s365Squads.fetchSquads(COMP365[c.id], ep.data.teams.map((t) => ({ espnId: t.espnId, name: t.name })));
    },
    summarize: (d) => {
      const all = Object.values(d.teams).flatMap((t) => t.a);
      const n = all.filter((a) => a[4] > 1).length;
      return {
        n,
        detail: `${Object.keys(d.teams).length} lag, ${n} av ${all.length} spelare med bild` +
          (d.unmatched.length ? `, hittade inte ${d.unmatched.join(', ')}` : ''),
      };
    },
  });
}

// Lagens siffror per match i Nations League från 365Scores (xG, skott,
// hörnor, frisparkar och kort) – det som ligorna har ur football-data.co.uk.
// Läser spelprogrammet ur cachen och hämtar bara matcher som inte är sparade.
for (const c of LEAGUES.filter((x) => x.type === 'intl')) {
  const id = `s365_stats_${c.id}`;
  PLAYER_SOURCES.push({
    id,
    provider: '365Scores',
    short: '365Scores',
    label: `xG, skott, hörnor och kort per match – ${c.name}`,
    comps: [c.id],
    kinds: ['stats', 'xg'],
    maxAgeHours: 6,
    staleAfterHours: 72,
    verified: '2026-11-14',
    stage: 2,
    fetch: () => {
      const fx = readCache(`espn_fixtures_${c.id}`);
      if (!fx || !fx.data) throw new Error('inget spelprogram i cachen än');
      const played = fx.data.matches.filter((m) => m.completed && m.score)
        .map((m) => ({ id: m.id, kickoff: m.kickoff, home: m.home, away: m.away }));
      const prev = readCache(id);
      return s365Stats.fetchStats(COMP365[c.id], played, prev && prev.data);
    },
    summarize: (d) => {
      const all = Object.values(d.matches);
      const n = all.filter((m) => m.t).length;
      return {
        n,
        detail: `${n} av ${d.played} spelade matcher med siffror` +
          (d.missing ? `, ${d.missing} saknas${d.unmatched ? ` (${d.unmatched} hittades inte hos 365Scores)` : ''}` : ''),
        latestData: n ? all.filter((m) => m.t).map((m) => m.k).sort().pop().slice(0, 10) : null,
      };
    },
  });
}

module.exports = { PLAYER_SOURCES };
