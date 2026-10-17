'use strict';

// Understat – xG per match för Premier League, 2014/15 → idag (verifierat
// 2026-10-17: 380/380 matcher med xG för 2014, 2019 och 2025). Täcker inte
// EFL. Sidan laddar datan via getLeagueData-anropet; det kräver
// X-Requested-With och Referer, annars kommer HTML i stället för JSON.
// Understats egna utfallssannolikheter (fältet "forecast") används inte.

const { getJson } = require('./http');

async function fetchLeague(league, seasonYear) {
  const page = `https://understat.com/league/${league}/${seasonYear}`;
  const j = await getJson(`https://understat.com/getLeagueData/${league}/${seasonYear}`, {
    'X-Requested-With': 'XMLHttpRequest',
    Referer: page,
  });
  if (!j || !Array.isArray(j.dates)) throw new Error('oväntat svar (saknar dates)');
  const matches = j.dates.map((d) => ({
    id: d.id,
    // Understats tid är UTC (stämmer mot ESPN för samma matcher).
    kickoff: d.datetime ? d.datetime.replace(' ', 'T') + 'Z' : null,
    home: d.h.title,
    away: d.a.title,
    played: !!d.isResult,
    goals: d.isResult ? { home: Number(d.goals.h), away: Number(d.goals.a) } : null,
    xg: d.isResult && d.xG && d.xG.h != null
      ? { home: round2(Number(d.xG.h)), away: round2(Number(d.xG.a)) } : null,
  }));
  return { matches, sourceUrl: page };
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

module.exports = { fetchLeague };
