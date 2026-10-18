'use strict';

// Källorna för spelardatan (trupp och spelarstatistik per liga). Egen fil
// så att registret i src/sources.js bara behöver en rad för att ta med dem.

const { COMPETITIONS } = require('../config/competitions');
const espnPlayers = require('./fetchers/espnplayers');

const PLAYER_SOURCES = COMPETITIONS.filter((c) => c.type === 'league').map((c) => ({
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

module.exports = { PLAYER_SOURCES };
