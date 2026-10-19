'use strict';

// Spelare och spelarstatistik ur ESPN:s öppna (inofficiella) API.
// Verifierat 2026-10-18 för eng.1–eng.4:
//   /teams                          lagen i ligan (20/24/24/24, säsong 2026)
//   /teams/{id}/roster?enable=stats trupp med position, ålder, nationalitet,
//                                   tröjnummer och säsongsstatistik i ligan
//                                   (matcher, inhopp, mål, assist, skott,
//                                   kort, fouls, offside; målvakter även
//                                   räddningar, skott mot och insläppta)
//                                   och födelsedatum (kopplar ihop spelaren
//                                   med FPL, se src/players.js)
// Stickprov: Will Lankshear (Middlesbrough) 10 matcher/8 mål i truppen,
// samma som ESPN:s skytteliga (/statistics). ESPN:s skadefält var tomt för
// alla lag i stickprovet (Middlesbrough, Arsenal) – skador tas inte härifrån.
// Statistiken gäller bara ligan, inte cuperna.
//
// Spelare utan statistikblock (oftast nyförvärv eller ungdomar som inte
// spelat) får stats: null – okänt, inte noll.

const { getJson, mapLimit } = require('./http');

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const WEB = 'https://site.web.api.espn.com/apis/site/v2/sports/soccer';

const POS = { G: 'MV', D: 'B', M: 'MF', F: 'A' };

// ESPN:s statistiknamn → korta fält i cachen.
const FIELDS = {
  appearances: 'app',
  subIns: 'sub',
  totalGoals: 'g',
  goalAssists: 'a',
  totalShots: 'sh',
  shotsOnTarget: 'sot',
  yellowCards: 'yc',
  redCards: 'rc',
  foulsCommitted: 'fc',
  foulsSuffered: 'fs',
  offsides: 'off',
  ownGoals: 'og',
};
const GK_FIELDS = { saves: 'sv', shotsFaced: 'sf', goalsConceded: 'gc' };

async function fetchLeaguePlayers(slug) {
  const tj = await getJson(`${SITE}/${slug}/teams`);
  const league = tj.sports && tj.sports[0] && tj.sports[0].leagues && tj.sports[0].leagues[0];
  if (!league || !Array.isArray(league.teams) || !league.teams.length) {
    throw new Error(`${slug}: oväntat svar (inga lag)`);
  }
  const ids = league.teams.map((t) => t.team.id);
  let season = null;
  const teams = await mapLimit(ids, 4, async (id) => {
    const j = await getJson(`${WEB}/${slug}/teams/${id}/roster?enable=stats`);
    if (!j.team || !Array.isArray(j.athletes)) throw new Error(`${slug} lag ${id}: oväntat svar (ingen trupp)`);
    if (j.season && !season) season = { year: j.season.year, name: j.season.displayName || null };
    return {
      espnId: String(j.team.id),
      name: j.team.displayName,
      abbr: j.team.abbreviation || null,
      players: j.athletes.map(player),
    };
  });
  return {
    season,
    teams,
    sourceUrl: `https://www.espn.com/soccer/stats/_/league/${slug}`,
  };
}

function player(a) {
  const posAbbr = a.position ? a.position.abbreviation : null;
  return {
    id: String(a.id),
    name: a.displayName,
    pos: POS[posAbbr] || null,
    age: Number.isFinite(a.age) ? a.age : null,
    dob: typeof a.dateOfBirth === 'string' ? a.dateOfBirth.slice(0, 10) : null,
    nat: a.citizenship || null,
    jersey: a.jersey || null,
    stats: stats(a, posAbbr === 'G'),
  };
}

function stats(a, gk) {
  const cats = a.statistics && a.statistics.splits && a.statistics.splits.categories;
  if (!Array.isArray(cats) || !cats.length) return null;
  const all = {};
  for (const c of cats) for (const s of c.stats || []) all[s.name] = s.value;
  const out = {};
  for (const [from, to] of Object.entries(FIELDS)) out[to] = num(all[from]);
  if (gk) for (const [from, to] of Object.entries(GK_FIELDS)) out[to] = num(all[from]);
  return out;
}

function num(v) {
  return Number.isFinite(v) ? v : null;
}

module.exports = { fetchLeaguePlayers };
