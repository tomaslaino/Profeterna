'use strict';

// Källorna för spelardatan (trupp och spelarstatistik per liga, speltiden
// utanför Premier League). Egen fil så att registret i src/sources.js bara
// behöver en rad för att ta med dem.

const { COMPETITIONS } = require('../config/competitions');
const espnPlayers = require('./fetchers/espnplayers');
const espnMinutes = require('./fetchers/espnminutes');
const { readCache } = require('./store');

const LEAGUES = COMPETITIONS.filter((c) => c.type === 'league');

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
  verified: '2026-10-18',
  fetch: () => espnPlayers.fetchLeaguePlayers(c.espn),
  summarize: (d) => {
    const all = d.teams.flatMap((t) => t.players);
    const used = all.filter((p) => p.stats && p.stats.app > 0).length;
    return { n: all.length, detail: `${d.teams.length} lag, ${all.length} spelare, ${used} har spelat` };
  },
}));

// Speltid per spelare ur ESPN:s matchrapporter – Premier League har den
// redan från FPL. Läser spelprogrammet ur cachen (andra steget) och hämtar
// bara rapporterna för matcher som inte redan finns sparade.
for (const c of LEAGUES.filter((x) => !x.fpl)) {
  const id = `espn_minutes_${c.id}`;
  PLAYER_SOURCES.push({
    id,
    provider: 'ESPN',
    short: 'ESPN',
    label: `Speltid per spelare ur matchrapporterna – ${c.name}`,
    comps: [c.id],
    kinds: ['players'],
    maxAgeHours: 6,
    staleAfterHours: 72,
    verified: '2026-10-19',
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

module.exports = { PLAYER_SOURCES };
