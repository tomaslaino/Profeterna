'use strict';

// Spelarnas betyg per ligamatch ur 365Scores öppna webb-API (samma källa som
// startelvorna i matchrutan, public/matchruta.js – ingen nyckel). Verifierat
// 2026-10-20 för Premier League, Championship, League One och League Two:
// efter matchen har alla elva i startelvan ett betyg från 1 till 10 med en
// decimal ("ranking"), och inhopparna som spelat en stund också. Den som bara
// fått några minuter har -1 (inget betyg) och den som inte spelat inget alls.
// 365Scores räknar fram betyget själv ur spelarens statistik i matchen; hur
// står inte någonstans.
//
// Säsongens matcher listas med /web/games/results/ och bläddras bakåt
// (paging.previousPage, ungefär 20 matcher per sida) tills en sida bara har
// förra säsongens (lägre seasonNum). 2026-10-20 gav det 70 matcher i Premier
// League – samma som ESPN. ESPN:s matchid finns inte hos 365Scores: matchen
// hittas på avspark inom tre timmar och lagnamnen, som i matchrutan, och
// hemmalaget hos 365Scores är ESPN:s hemmalag.
//
// En match är ~135 kB men ändras inte när den är spelad: den hämtas en gång
// och sparas kompakt som { k: avspark, g: 365Scores-id, t: { ESPN-lag-id:
// [[athleteId, namn, tröjnummer, betyg, minuter], …] } } med bara de
// betygsatta spelarna. Har matchen inga betyg än prövas den igen vid nästa
// hämtning; efter tre dygn utan betyg sparas den som { k, g, none: 1 }.

const { getJson, mapLimit } = require('./http');

const WEB = 'https://webws.365scores.com';
const PARAMS = 'appTypeId=5&langId=1&timezoneName=UTC&userCountryId=1';
const MAX_PAGES = 15;
const MAX_NEW = 250;
const CONCURRENCY = 3;
const GIVE_UP_AFTER = 5;
const KICKOFF_SLACK_MS = 3 * 3600000;
const NO_RATINGS_AFTER_MS = 3 * 86400000;

// events: spelade ligamatcher [{ id, kickoff, home: { espnId, name }, away }];
// previous: förra hämtningens data (eller null).
async function fetchRatings(compId365, events, previous) {
  const old = (previous && previous.matches) || {};
  const matches = {};
  for (const e of events) if (old[e.id]) matches[e.id] = old[e.id];
  const todo = events.filter((e) => !old[e.id]);
  let listed = 0;
  let unmatched = 0;
  if (todo.length) {
    const games = await seasonGames(compId365);
    listed = games.length;
    const taken = new Set(Object.values(matches).map((m) => m.g));
    const work = [];
    for (const e of todo) {
      const g = findGame(e, games, taken);
      if (!g) { unmatched++; continue; }
      taken.add(g.id);
      work.push({ e, g });
    }
    let ok = 0;
    let failed = 0;
    let lastError = null;
    await mapLimit(work.slice(0, MAX_NEW), CONCURRENCY, async ({ e, g }) => {
      if (failed >= GIVE_UP_AFTER && ok === 0) { failed++; return; }
      try {
        const j = await getJson(`${WEB}/web/game/?${PARAMS}&gameId=${g.id}`);
        const m = parseGame(j && j.game, e, g.id);
        if (m) matches[e.id] = m;
        else if (Date.now() - Date.parse(e.kickoff) > NO_RATINGS_AFTER_MS) matches[e.id] = { k: e.kickoff, g: g.id, none: 1 };
        ok++;
      } catch (err) {
        failed++;
        lastError = String(err.message || err);
      }
    });
    if (work.length && ok === 0) throw new Error(`ingen match gick att hämta från 365Scores (${lastError})`);
  }
  return {
    matches,
    played: events.length,
    missing: events.length - Object.keys(matches).length,
    listed,
    unmatched,
    sourceUrl: 'https://www.365scores.com/football',
  };
}

// Säsongens spelade matcher, nyaste sidan först.
async function seasonGames(compId365) {
  let url = `${WEB}/web/games/results/?${PARAMS}&competitions=${compId365}`;
  const seen = new Map();
  let season = null;
  for (let i = 0; i < MAX_PAGES && url; i++) {
    const d = await getJson(url);
    const list = (d.games || []).filter((g) => g.competitionId === compId365 && g.statusGroup === 4);
    if (season == null) season = Math.max(...list.map((g) => g.seasonNum || 0));
    const now = list.filter((g) => g.seasonNum === season);
    for (const g of now) seen.set(g.id, g);
    if (!now.length || now.length < list.length) break;
    const prev = d.paging && d.paging.previousPage;
    url = prev ? WEB + prev : null;
  }
  return [...seen.values()];
}

// Lagnamnen som i matchrutan: utan FC/AFC och skiljetecken, MK Dons heter
// så hos 365Scores.
const ALIAS = { 'milton keynes dons': 'mk dons' };
function norm(s) {
  const n = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/\b(a ?f ?c|f ?c)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  return ALIAS[n] || n;
}
function sim(a, b) {
  a = norm(a);
  b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.startsWith(`${b} `) || b.startsWith(`${a} `)) return 0.8;
  const A = new Set(a.split(' '));
  const B = new Set(b.split(' '));
  let n = 0;
  for (const x of A) if (B.has(x)) n++;
  return n / Math.max(A.size, B.size);
}
const teamSim = (name, c) => Math.max(sim(name, c && c.name), sim(name, c && c.longName));

function findGame(e, games, taken) {
  const t = Date.parse(e.kickoff);
  let best = null;
  let bs = 0;
  for (const g of games) {
    if (taken.has(g.id) || Math.abs(Date.parse(g.startTime) - t) > KICKOFF_SLACK_MS) continue;
    const s = teamSim(e.home.name, g.homeCompetitor) + teamSim(e.away.name, g.awayCompetitor);
    if (s > bs) { bs = s; best = g; }
  }
  return best && bs >= 1 ? best : null;
}

function parseGame(g, e, id) {
  if (!g) return null;
  const people = new Map((g.members || []).map((p) => [p.id, p]));
  const t = {};
  let rated = 0;
  for (const [side, espn] of [['homeCompetitor', e.home], ['awayCompetitor', e.away]]) {
    const ms = (g[side] && g[side].lineups && g[side].lineups.members) || [];
    t[String(espn.espnId)] = ms.filter((x) => x.ranking > 0).map((x) => {
      const p = people.get(x.id) || {};
      const min = (x.stats || []).find((s) => s.type === 30);
      rated++;
      return [p.athleteId || x.id, p.name || '', p.jerseyNumber > 0 ? p.jerseyNumber : null,
        x.ranking, min ? parseInt(min.value, 10) || null : null];
    });
  }
  return rated ? { k: e.kickoff, g: id, t } : null;
}

module.exports = { fetchRatings };
