'use strict';

// ESPN:s öppna (inofficiella, odokumenterade) API – samma som VM2026 använder.
// Verifierat 2026-10-17: spelprogram + resultat för eng.1–eng.4,
// eng.league_cup och eng.fa (FA-cupen från first round proper), tabeller för
// ligorna, och DraftKings-odds i matchsammanfattningen.
//
// Kvirk: scoreboard tar inte datumintervall (HTTP 400) – månadsformatet
// dates=YYYYMM fungerar, så säsongen hämtas månad för månad.

const { getJson, mapLimit } = require('./http');

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer';

function seasonMonths(first, last) {
  const out = [];
  let [y, m] = first.split('-').map(Number);
  const [ly, lm] = last.split('-').map(Number);
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

// Hela säsongens matcher för en tävling. Faller en månad fallerar hela
// hämtningen – cachen behåller då senaste kompletta spelprogram.
async function fetchFixtures(slug, season) {
  const months = seasonMonths(season.firstMonth, season.lastMonth);
  const byId = new Map();
  await mapLimit(months, 3, async (m) => {
    const j = await getJson(`${SITE}/${slug}/scoreboard?dates=${m}&limit=1000`);
    for (const e of j.events || []) byId.set(e.id, parseEvent(e));
  });
  const matches = [...byId.values()].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  return { matches, sourceUrl: `https://www.espn.com/soccer/schedule/_/league/${slug}` };
}

// Tidigare säsonger av en tävling: { startår: [månader YYYYMM] }. Bara
// spelade matcher sparas. parse = hur en match sparas (standard: som i
// spelprogrammet).
async function fetchHistory(slug, monthsBySeason, parse = parseEvent) {
  const jobs = [];
  for (const [season, months] of Object.entries(monthsBySeason)) {
    for (const m of months) jobs.push({ season, m });
  }
  const bySeason = {};
  await mapLimit(jobs, 3, async ({ season, m }) => {
    const j = await getJson(`${SITE}/${slug}/scoreboard?dates=${m}&limit=1000`);
    const ms = (bySeason[season] = bySeason[season] || new Map());
    for (const e of j.events || []) {
      const p = parse(e);
      if (p.completed && p.score) ms.set(p.id, p);
    }
  });
  const seasons = {};
  for (const [season, ms] of Object.entries(bySeason)) {
    seasons[season] = [...ms.values()].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    if (!seasons[season].length) throw new Error(`${slug} ${season}: inga matcher`);
  }
  return { seasons, sourceUrl: `https://www.espn.com/soccer/schedule/_/league/${slug}` };
}

function parseEvent(e) {
  const c = e.competitions[0];
  const home = c.competitors.find((t) => t.homeAway === 'home') || c.competitors[0];
  const away = c.competitors.find((t) => t.homeAway === 'away') || c.competitors[1];
  const st = e.status.type;
  const completed = !!st.completed;
  return {
    id: e.id,
    kickoff: e.date,
    status: st.name,
    statusText: st.shortDetail || st.detail || st.description || null,
    completed,
    round: e.season && e.season.slug ? e.season.slug : null,
    neutral: !!c.neutralSite,
    venue: c.venue ? c.venue.fullName || null : null,
    home: team(home),
    away: team(away),
    score: completed ? { home: num(home.score), away: num(away.score) } : null,
    shootout: completed && home.shootoutScore != null
      ? { home: num(home.shootoutScore), away: num(away.shootoutScore) } : null,
    winner: home.winner ? 'home' : away.winner ? 'away' : null,
    // Målhändelser: behövs för att räkna fram ställningen efter 90 minuter i
    // cupmatcher som gått till förlängning/straffar. team = lag som krediteras
    // målet (även vid självmål).
    goals: completed
      ? (c.details || []).filter((d) => d.scoringPlay).map((d) => ({
        clock: d.clock ? d.clock.displayValue : null,
        teamId: d.team ? d.team.id : null,
        shootout: !!d.shootout,
      }))
      : [],
  };
}

function team(t) {
  return { espnId: t.team.id, name: t.team.displayName, abbr: t.team.abbreviation || null };
}

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

async function fetchStandings(slug) {
  const j = await getJson(`${STANDINGS}/${slug}/standings`);
  const entries = (j.children && j.children[0] && j.children[0].standings
    && j.children[0].standings.entries) || [];
  if (!entries.length) throw new Error('tom tabell i svaret');
  const rows = entries.map((e) => {
    const s = {};
    for (const x of e.stats || []) s[x.name] = x.value;
    return {
      espnId: e.team.id,
      name: e.team.displayName,
      rank: s.rank,
      played: s.gamesPlayed,
      won: s.wins,
      drawn: s.ties,
      lost: s.losses,
      gf: s.pointsFor,
      ga: s.pointsAgainst,
      gd: s.pointDifferential,
      points: s.points,
      deductions: s.deductions || 0,
      note: e.note ? e.note.description || null : null,
    };
  }).sort((a, b) => a.rank - b.rank);
  return { rows, sourceUrl: `https://www.espn.com/soccer/standings/_/league/${slug}` };
}

// Odds (DraftKings via ESPN) för kommande matcher. Finns bara i
// matchsammanfattningen, ett anrop per match. Amerikanska odds räknas om
// till decimalodds; inget annat görs med dem här (marginalen tas bort i
// prognosmotorn).
async function fetchOdds(events) {
  const byEvent = {};
  let missing = 0;
  await mapLimit(events, 4, async ({ slug, id }) => {
    const j = await getJson(`${SITE}/${slug}/summary?event=${id}`);
    const o = Array.isArray(j.odds) ? j.odds.find(Boolean) : null;
    const h = o && o.homeTeamOdds && o.homeTeamOdds.moneyLine;
    const a = o && o.awayTeamOdds && o.awayTeamOdds.moneyLine;
    const d = o && o.drawOdds && o.drawOdds.moneyLine;
    if (h == null || a == null || d == null) { missing++; return; }
    byEvent[id] = {
      provider: (o.provider && o.provider.name) || 'okänd',
      fetchedAt: new Date().toISOString(),
      home: decimal(h),
      draw: decimal(d),
      away: decimal(a),
      american: { home: h, draw: d, away: a },
      totalLine: o.overUnder != null ? o.overUnder : null,
      over: o.overOdds != null ? decimal(o.overOdds) : null,
      under: o.underOdds != null ? decimal(o.underOdds) : null,
    };
  });
  return { byEvent, requested: events.length, missing };
}

function decimal(american) {
  const a = Number(american);
  if (!Number.isFinite(a) || a === 0) return null;
  const d = a > 0 ? 1 + a / 100 : 1 + 100 / -a;
  return Math.round(d * 1000) / 1000;
}

module.exports = { fetchFixtures, fetchHistory, fetchStandings, fetchOdds, seasonMonths, decimal };
