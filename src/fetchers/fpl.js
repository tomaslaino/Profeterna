'use strict';

// Fantasy Premier League:s öppna API – enda verifierade fria källan för
// skador/avstängningar (2026-10-17: 667 spelare med status, nyhetstext och
// datum). Täcker bara Premier League. Statusar: a = tillgänglig,
// d = tveksam, i = skadad, s = avstängd, u = otillgänglig (lämnat klubben,
// utlånad m.m.), n = ej uttagbar.
//
// Samma svar har speltid, xG/xA (Opta) och FPL:s pris och poäng per spelare
// – underlag för spelartabellen på sidan Statistik (verifierat 2026-10-19:
// Haaland 619 min, 8 mål på 5,69 xG). Namn och födelsedatum kopplar ihop
// spelaren med ESPN-truppen (src/players.js).

const { getJson } = require('./http');

const POS = { 1: 'MV', 2: 'B', 3: 'MF', 4: 'A' };
const dec = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

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
    first: p.first_name || null,
    second: p.second_name || null,
    known: p.known_name || null,
    birth: p.birth_date || null,
    goals: p.goals_scored,
    assists: p.assists,
    xg: dec(p.expected_goals),
    xa: dec(p.expected_assists),
    xgc: dec(p.expected_goals_conceded),
    cs: p.clean_sheets,
    dc: p.defensive_contribution ?? null,
    cost: Number.isFinite(p.now_cost) ? p.now_cost / 10 : null, // miljoner pund
    sel: dec(p.selected_by_percent),
    points: p.total_points,
    bonus: p.bonus,
    pens: p.penalties_order ?? null,
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
