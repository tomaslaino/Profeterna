'use strict';

// Fantasy Premier League:s öppna API – enda verifierade fria källan för
// skador/avstängningar (2026-10-17: 667 spelare med status, nyhetstext och
// datum). Täcker bara Premier League. Statusar: a = tillgänglig,
// d = tveksam, i = skadad, s = avstängd, u = otillgänglig (lämnat klubben,
// utlånad m.m.), n = ej uttagbar.

const { getJson } = require('./http');

const POS = { 1: 'MV', 2: 'B', 3: 'MF', 4: 'A' };

async function fetchBootstrap() {
  const url = 'https://fantasy.premierleague.com/api/bootstrap-static/';
  const j = await getJson(url);
  if (!j || !Array.isArray(j.elements)) throw new Error('oväntat svar (saknar elements)');
  const teams = j.teams.map((t) => ({ id: t.id, name: t.name, short: t.short_name }));
  const players = j.elements.map((p) => ({
    id: p.id,
    name: p.web_name,
    teamId: p.team,
    pos: POS[p.element_type] || null,
    status: p.status,
    chanceNext: p.chance_of_playing_next_round,
    news: p.news || null,
    newsAdded: p.news_added || null,
    minutes: p.minutes,
    starts: p.starts,
  }));
  const next = (j.events || []).find((e) => e.is_next);
  return {
    teams,
    players,
    nextGameweek: next ? { name: next.name, deadline: next.deadline_time } : null,
    sourceUrl: 'https://fantasy.premierleague.com/',
  };
}

module.exports = { fetchBootstrap };
