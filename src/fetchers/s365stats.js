'use strict';

// Lagens siffror per match ur 365Scores öppna webb-API (samma källa som
// betygen, src/fetchers/s365ratings.js – ingen nyckel), för landslagen: det
// som ligorna har ur football-data.co.uk (src/teamstats.js). Verifierat
// 2026-11-14 för UEFA Nations League (7016): /web/game/stats/?games=<id> har
// för båda lagen "Expected Goals", "Total Shots", "Shots On Target",
// "Corners", "Fouls", "Yellow Cards" och "Red Cards" (och mycket mer, som
// inte används). Stickprov Turkiet–Belgien 1–2 (12 november): xG 0,63–1,54,
// skott 10–12, på mål 7–6, hörnor 2–3 – skotten och hörnorna som hos ESPN.
//
// Matcherna hittas som betygen: säsongens spelade matcher hos 365Scores och
// ESPN:s match på avspark inom tre timmar och lagnamnen. En spelad match
// ändras inte och hämtas en gång; den sparas kompakt som { k: avspark, g:
// 365Scores-id, t: { ESPN-lag-id: [xG, skott, på mål, hörnor, frisparkar
// begångna, gula, röda] } } – null där en siffra saknas (okänt, inte noll).
// Har matchen inga siffror än prövas den igen vid nästa hämtning; efter tre
// dygn utan siffror sparas den som { k, g, none: 1 }.

const { getJson, mapLimit } = require('./http');
const { seasonGames, findGame } = require('./s365ratings');

const WEB = 'https://webws.365scores.com';
const PARAMS = 'appTypeId=5&langId=1&timezoneName=UTC&userCountryId=1';
const MAX_NEW = 250;
const CONCURRENCY = 3;
const GIVE_UP_AFTER = 5;
const NO_STATS_AFTER_MS = 3 * 86400000;

// Siffrornas namn hos 365Scores, i den ordning de sparas.
const NAMES = ['Expected Goals', 'Total Shots', 'Shots On Target', 'Corners', 'Fouls', 'Yellow Cards', 'Red Cards'];

// events: spelade matcher [{ id, kickoff, home: { espnId, name }, away }];
// previous: förra hämtningens data (eller null).
async function fetchStats(compId365, events, previous) {
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
        const j = await getJson(`${WEB}/web/game/stats/?${PARAMS}&games=${g.id}`);
        const m = parseStats(j, e, g);
        if (m) matches[e.id] = m;
        else if (Date.now() - Date.parse(e.kickoff) > NO_STATS_AFTER_MS) matches[e.id] = { k: e.kickoff, g: g.id, none: 1 };
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
    missing: events.length - Object.keys(matches).filter((id) => matches[id].t).length,
    listed,
    unmatched,
    fields: ['xg', 'sh', 'sot', 'cor', 'fouls', 'yc', 'rc'],
    sourceUrl: 'https://www.365scores.com/football',
  };
}

// "1,54" / "1.54" / "53%" / "7" → tal; annat → null.
function value(v) {
  const n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseStats(j, e, g) {
  const list = (j && Array.isArray(j.statistics)) ? j.statistics : [];
  if (!list.length) return null;
  const t = {};
  for (const [c, espn] of [[g.homeCompetitor, e.home], [g.awayCompetitor, e.away]]) {
    const own = list.filter((s) => s.competitorId === (c && c.id));
    const row = NAMES.map((n) => { const s = own.find((x) => x.name === n); return s ? value(s.value) : null; });
    // Utan skotten och xG är matchen inte färdigräknad hos 365Scores än.
    if (row[0] == null && row[1] == null) return null;
    t[String(espn.espnId)] = row;
  }
  return { k: e.kickoff, g: g.id, t };
}

module.exports = { fetchStats, parseStats };
