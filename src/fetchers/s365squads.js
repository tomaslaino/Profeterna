'use strict';

// Trupperna ur 365Scores öppna webb-API (samma källa som betygen i
// src/fetchers/s365ratings.js – ingen nyckel), för spelarnas bilder i
// spelarkortet. Verifierat 2026-10-20 för Premier League, Championship,
// League One och League Two:
//   /web/standings/?competitions={id}  ligans lag med 365Scores lag-id
//   /web/squads/?competitors={id,…}    truppen per lag: athlete-id, namn,
//                                      tröjnummer, födelsedatum, position och
//                                      imageVersion (flera lag per anrop)
// Bilden ligger på imagecache.365scores.com/…/v{imageVersion}/Athletes/{id}.
// imageVersion 1 betyder att bild saknas: i stickprovet (Tranmere, Barnet)
// gav alla 13 med version 1 HTTP 404 och alla 46 med högre version en bild.
// Premier League-lagen i stickprovet hade bild på alla spelare, League
// Two-lagen på ungefär fyra av fem. Tränare och domare (isStaff) tas inte med.
//
// Lagen kopplas till ESPN:s på namnet som i betygen (teamSim), ett lag
// hos 365Scores till högst ett hos ESPN. Sparas kompakt som
// { teams: { ESPN-lag-id: { c: 365Scores-lag-id, a: [[athleteId, namn,
// tröjnummer, födelsedatum, imageVersion], …] } } }.

const { getJson, mapLimit } = require('./http');
const { teamSim } = require('./s365ratings');

const WEB = 'https://webws.365scores.com';
const PARAMS = 'appTypeId=5&langId=1&timezoneName=UTC&userCountryId=1';
const PER_CALL = 6;

// 365Scores förkortar en del lagnamn (Sheffield Utd, Sheffield Wed); utskrivna
// skiljer de sig från varandra även om båda Sheffieldlagen är i samma liga.
const LONG = [[/\bUtd\b/g, 'United'], [/\bWed\b/g, 'Wednesday']];
const unabbr = (s) => LONG.reduce((x, [re, to]) => x.replace(re, to), String(s || ''));

// espnTeams: [{ espnId, name }] ur ESPN-trupperna.
async function fetchSquads(compId365, espnTeams) {
  const st = await getJson(`${WEB}/web/standings/?${PARAMS}&competitions=${compId365}`);
  const rows = (st.standings && st.standings[0] && st.standings[0].rows) || [];
  if (!rows.length) throw new Error(`365Scores tävling ${compId365}: oväntat svar (ingen tabell)`);
  const free = rows.map((r) => r.competitor).filter(Boolean);

  // Bäst matchande par först, så att ett tydligt namn inte tar ett annat lags plats.
  const pairs = [];
  for (const t of espnTeams) {
    for (const c of free) pairs.push({ t, c, s: teamSim(t.name, { name: unabbr(c.name), longName: c.longName }) });
  }
  pairs.sort((a, b) => b.s - a.s);
  const byEspn = new Map();
  const taken = new Set();
  for (const { t, c, s } of pairs) {
    if (s < 0.5 || byEspn.has(t.espnId) || taken.has(c.id)) continue;
    byEspn.set(t.espnId, c.id);
    taken.add(c.id);
  }

  const ids = [...taken];
  const chunks = [];
  for (let i = 0; i < ids.length; i += PER_CALL) chunks.push(ids.slice(i, i + PER_CALL));
  const squads = new Map();
  await mapLimit(chunks, 2, async (ch) => {
    const j = await getJson(`${WEB}/web/squads/?${PARAMS}&competitors=${ch.join(',')}`);
    for (const s of j.squads || []) {
      const staff = new Set((s.positions || []).filter((p) => p.isStaff).map((p) => p.id));
      squads.set(s.competitorId, (s.athletes || [])
        .filter((a) => a.position && !staff.has(a.position.id))
        .map((a) => [a.id, a.name || '', a.jerseyNum > 0 ? a.jerseyNum : null,
          typeof a.birthdate === 'string' ? a.birthdate.slice(0, 10) : null, a.imageVersion || 1]));
    }
  });

  const teams = {};
  for (const [espnId, c] of byEspn) if (squads.has(c)) teams[espnId] = { c, a: squads.get(c) };
  if (!Object.keys(teams).length) throw new Error(`365Scores tävling ${compId365}: inga trupper`);
  return {
    teams,
    unmatched: espnTeams.filter((t) => !teams[t.espnId]).map((t) => t.name),
    sourceUrl: 'https://www.365scores.com/football',
  };
}

module.exports = { fetchSquads };
