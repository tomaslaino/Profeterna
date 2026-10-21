'use strict';

// Register över alla nätverkskällor. Varje källa har eget hämtintervall
// (maxAgeHours) och en gräns för när datan räknas som gammal
// (staleAfterHours). Metadatan (leverantör, vad den ger, verifieringsdatum)
// visas i källtabellen – samma uppgifter som README:ns källtabell.

const { COMPETITIONS, NATIONAL_LEAGUE, EUROPE, SEASON, HISTORY, fdSeasonCode } = require('../config/competitions');
const espn = require('./fetchers/espn');
const fdcouk = require('./fetchers/fdcouk');
const understat = require('./fetchers/understat');
const fpl = require('./fetchers/fpl');
const viaplay = require('./fetchers/viaplay');
const youtube = require('./fetchers/youtube');
const fs = require('fs');
const path = require('path');
const { readCache, CACHE_DIR } = require('./store');

const VERIFIED = '2026-10-17';
const ODDS_WINDOW_DAYS = 7;

const SOURCES = [];

for (const c of COMPETITIONS) {
  SOURCES.push({
    id: `espn_fixtures_${c.id}`,
    provider: 'ESPN',
    short: 'ESPN',
    label: `Spelprogram och resultat – ${c.name}`,
    comps: [c.id],
    kinds: ['fixtures'],
    // Under en halvtimme, så att varje schemalagd körning (var 30:e min)
    // hämtar färska resultat.
    maxAgeHours: 0.4,
    staleAfterHours: 6,
    verified: VERIFIED,
    fetch: () => espn.fetchFixtures(c.espn, SEASON),
    summarize: (d) => {
      const played = d.matches.filter((m) => m.completed);
      return {
        n: d.matches.length,
        detail: d.matches.length ? `${played.length} spelade av ${d.matches.length}` : 'inga matcher publicerade än',
        latestData: played.length ? played[played.length - 1].kickoff.slice(0, 10) : null,
      };
    },
  });
}

// Europacuperna (ESPN): bara underlag om de engelska lagens schema – vila,
// matcher i veckan och formen. Ingen prognos görs för matcherna, och de ingår
// inte i prognosmotorns underlag. Kvalomgångarna hämtas för juli–augusti.
for (const c of EUROPE) {
  SOURCES.push({
    id: `espn_europe_${c.id}`,
    provider: 'ESPN',
    short: 'ESPN',
    label: `Spelprogram och resultat – ${c.name} (för vila och form)`,
    // Engelska lag i Europa spelar i PL och i cuperna.
    comps: ['pl', 'fac', 'lc'],
    kinds: ['europe'],
    maxAgeHours: 3,
    staleAfterHours: 24,
    verified: '2026-10-18',
    fetch: async () => {
      const [main, qual] = await Promise.all([
        espn.fetchFixtures(c.espn, SEASON),
        espn.fetchFixtures(c.qual, { ...SEASON, lastMonth: SEASON.firstMonth.replace(/-\d\d$/, '-08') }),
      ]);
      const matches = [...qual.matches, ...main.matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
      return { matches, sourceUrl: main.sourceUrl };
    },
    summarize: (d) => {
      const played = d.matches.filter((m) => m.completed);
      return {
        n: d.matches.length,
        detail: d.matches.length ? `${played.length} spelade av ${d.matches.length}, alla lag` : 'inga matcher publicerade än',
        latestData: played.length ? played[played.length - 1].kickoff.slice(0, 10) : null,
      };
    },
  });
}

for (const c of COMPETITIONS.filter((x) => x.type === 'league')) {
  SOURCES.push({
    id: `espn_standings_${c.id}`,
    provider: 'ESPN',
    short: 'ESPN',
    label: `Tabell – ${c.name}`,
    comps: [c.id],
    kinds: ['table'],
    maxAgeHours: 3,
    staleAfterHours: 24,
    verified: VERIFIED,
    fetch: () => espn.fetchStandings(c.espn),
    summarize: (d) => ({ n: d.rows.length, detail: `${d.rows.length} lag` }),
  });
}

SOURCES.push({
  id: 'espn_odds',
  provider: 'ESPN (DraftKings)',
  short: 'DraftKings',
  label: `Odds 1X2 och över/under, matcher inom ${ODDS_WINDOW_DAYS} dagar`,
  comps: COMPETITIONS.map((c) => c.id),
  kinds: ['odds'],
  maxAgeHours: 6,
  staleAfterHours: 24,
  verified: VERIFIED,
  // Läser spelprogrammet ur cachen – körs därför i andra steget.
  stage: 2,
  fetch: () => {
    const events = upcomingEvents(ODDS_WINDOW_DAYS);
    if (events === null) throw new Error('inget spelprogram i cachen än');
    return espn.fetchOdds(events);
  },
  summarize: (d) => ({
    n: Object.keys(d.byEvent).length,
    detail: `${Object.keys(d.byEvent).length} av ${d.requested} matcher har odds`,
  }),
});

for (const c of [...COMPETITIONS.filter((x) => x.fdcouk), NATIONAL_LEAGUE]) {
  SOURCES.push({
    id: `fdcouk_${c.fdcouk}`,
    provider: 'football-data.co.uk',
    short: 'football-data',
    label: `Resultat, skott, kort, xG och odds – ${c.name}`,
    comps: [c.id],
    kinds: c.id === 'nl' ? ['stats', 'odds', 'referee'] : ['stats', 'xg', 'odds', 'referee'],
    maxAgeHours: 12,
    staleAfterHours: 48,
    verified: VERIFIED,
    fetch: () => fdcouk.fetchDivision(c.fdcouk, SEASON.fdcouk),
    summarize: (d) => ({
      n: d.rows.length,
      detail: `${d.rows.length} matcher`,
      latestData: d.lastMatchDate,
    }),
  });
}

// Tidigare säsonger (avslutade, ändras inte) – hämtas om en gång i månaden.
// Fallerar hämtningen behålls senaste kompletta historik.
for (const c of [...COMPETITIONS.filter((x) => x.fdcouk), NATIONAL_LEAGUE]) {
  const { first, last } = HISTORY.fdcouk;
  const codes = [];
  for (let y = first[c.fdcouk]; y <= last; y++) codes.push(fdSeasonCode(y));
  SOURCES.push({
    id: `fdcouk_hist_${c.fdcouk}`,
    provider: 'football-data.co.uk',
    short: 'football-data',
    label: `Tidigare säsonger ${seasonLabel(first[c.fdcouk])}–${seasonLabel(last)} – ${c.name}`,
    comps: [c.id],
    kinds: ['history'],
    maxAgeHours: 24 * 30,
    staleAfterHours: 24 * 60,
    verified: VERIFIED,
    fetch: () => fdcouk.fetchHistory(c.fdcouk, codes),
    summarize: (d) => {
      const n = Object.values(d.seasons).reduce((s, rows) => s + rows.length, 0);
      const last = d.seasons[Object.keys(d.seasons).sort().pop()] || [];
      return {
        n,
        detail: `${Object.keys(d.seasons).length} säsonger, ${n} matcher`,
        latestData: last.map((r) => r.date).sort().pop() || null,
      };
    },
  });
}

// Domarna (matchrutan): kort och frisparkar per domare de senaste avslutade
// säsongerna – samma filer som historiken ovan men med domaren. Egen cache,
// så att prognosmotorns och efterhandstestets underlag inte ändras. Årets
// domare kommer ur säsongens fil (fdcouk_<div>) och kommande matchers ur
// fdcouk_fixtures.
for (const c of [...COMPETITIONS.filter((x) => x.fdcouk), NATIONAL_LEAGUE]) {
  const { last } = HISTORY.fdcouk;
  const first = last - HISTORY.referees.seasons + 1;
  const codes = [];
  for (let y = first; y <= last; y++) codes.push(fdSeasonCode(y));
  SOURCES.push({
    id: `fdcouk_stats_${c.fdcouk}`,
    provider: 'football-data.co.uk',
    short: 'football-data',
    label: `Domare och kort ${seasonLabel(first)}–${seasonLabel(last)} – ${c.name}`,
    comps: [c.id],
    kinds: ['referee'],
    maxAgeHours: 24 * 30,
    staleAfterHours: 24 * 60,
    verified: VERIFIED,
    fetch: () => fdcouk.fetchHistory(c.fdcouk, codes, fdcouk.KEEP_STATS),
    // En äldre hämtning kan ha fler säsonger – bara de som används räknas.
    summarize: (d) => {
      const used = codes.filter((k) => d.seasons[k]);
      const n = used.reduce((s, k) => s + d.seasons[k].length, 0);
      return { n, detail: `${used.length} säsonger, ${n} matcher` };
    },
  });
}

{
  const { first, last, months } = HISTORY.espnFaCup;
  const bySeason = {};
  for (let y = first; y <= last; y++) {
    bySeason[fdSeasonCode(y)] = months.map((m) => `${Number(m) >= 7 ? y : y + 1}${m}`);
  }
  SOURCES.push({
    id: 'espn_hist_fac',
    provider: 'ESPN',
    short: 'ESPN',
    label: `Tidigare säsonger ${seasonLabel(first)}–${seasonLabel(last)} – FA Cup`,
    comps: ['fac'],
    kinds: ['history'],
    maxAgeHours: 24 * 30,
    staleAfterHours: 24 * 60,
    verified: VERIFIED,
    fetch: () => espn.fetchHistory('eng.fa', bySeason),
    summarize: (d) => {
      const n = Object.values(d.seasons).reduce((s, ms) => s + ms.length, 0);
      const last = d.seasons[Object.keys(d.seasons).sort().pop()] || [];
      return {
        n,
        detail: `${Object.keys(d.seasons).length} säsonger, ${n} matcher från första omgången`,
        latestData: last.length ? last[last.length - 1].kickoff.slice(0, 10) : null,
      };
    },
  });
}

SOURCES.push({
  id: 'fdcouk_fixtures',
  provider: 'football-data.co.uk',
  short: 'football-data',
  label: 'Kommande ligamatcher med odds och domare',
  comps: ['pl', 'ch', 'l1', 'l2', 'nl'],
  kinds: ['odds', 'referee'],
  maxAgeHours: 6,
  staleAfterHours: 48,
  verified: VERIFIED,
  fetch: () => fdcouk.fetchFixtures(['E0', 'E1', 'E2', 'E3', 'EC']),
  summarize: (d) => ({ n: d.rows.length, detail: `${d.rows.length} matcher` }),
});

SOURCES.push({
  id: 'understat_epl',
  provider: 'Understat',
  short: 'Understat',
  label: 'xG per match – Premier League',
  comps: ['pl'],
  kinds: ['xg'],
  maxAgeHours: 12,
  staleAfterHours: 48,
  verified: VERIFIED,
  fetch: () => understat.fetchLeague('EPL', SEASON.understat),
  summarize: (d) => {
    const played = d.matches.filter((m) => m.played);
    return {
      n: played.length,
      detail: `${played.length} matcher med xG`,
      latestData: played.length ? played.map((m) => m.kickoff).sort().pop().slice(0, 10) : null,
    };
  },
});

SOURCES.push({
  id: 'fpl',
  provider: 'Fantasy Premier League',
  short: 'FPL',
  label: 'Skador, speltid och xG per spelare – Premier League',
  comps: ['pl'],
  kinds: ['squad', 'players'],
  maxAgeHours: 3,
  staleAfterHours: 24,
  verified: VERIFIED,
  fetch: () => fpl.fetchBootstrap(),
  summarize: (d) => {
    const out = d.players.filter((p) => ['i', 's', 'd'].includes(p.status)).length;
    return { n: d.players.length, detail: `${d.players.length} spelare, ${out} skadade/tveksamma/avstängda` };
  },
});

// Höjdpunkterna (src/hojdpunkter.js): Viaplays gratis sammandrag. Läser sin
// egen förra hämtning, så att klipp som fallit ur Viaplays listor men ligger
// ute ändå finns kvar. Varje körning, så att ett nytt sammandrag syns inom en
// halvtimme.
SOURCES.push({
  id: 'viaplay_hojdpunkter',
  provider: 'Viaplay',
  short: 'Viaplay',
  label: 'Höjdpunkter – gratis sammandrag med reklam',
  comps: Object.keys(viaplay.PAGES),
  kinds: ['video'],
  maxAgeHours: 0.4,
  staleAfterHours: 24,
  verified: '2026-10-20',
  fetch: () => {
    const prev = readCache('viaplay_hojdpunkter');
    return viaplay.fetchClips(prev && prev.data, `${SEASON.firstMonth}-01`);
  },
  summarize: (d) => ({ n: d.clips.length, detail: `${d.clips.length} sammandrag` }),
});

// Höjdpunkterna på YouTube (src/hojdpunkter.js): klubbarnas och sändarnas
// kanaler (config/youtube.js), som spelas på sajten. Läser sin egen förra
// hämtning, eftersom kanalernas flöden bara har de 15 senaste klippen.
SOURCES.push({
  id: 'youtube_hojdpunkter',
  provider: 'YouTube',
  short: 'YouTube',
  label: 'Höjdpunkter – klubbarnas och sändarnas egna klipp',
  comps: COMPETITIONS.map((c) => c.id),
  kinds: ['video'],
  maxAgeHours: 0.4,
  staleAfterHours: 24,
  verified: '2026-10-20',
  fetch: () => {
    const prev = readCache('youtube_hojdpunkter');
    return youtube.fetchVideos(prev && prev.data, `${SEASON.firstMonth}-01`);
  },
  summarize: (d) => {
    const n = d.videos.filter(youtube.playable).length;
    return {
      n,
      detail: `${n} klipp ur ${d.channels - d.failed.length} kanaler` +
        (d.failed.length ? ` (${d.failed.length} svarade inte)` : ''),
    };
  },
});

// Lagsköldarna (Tabeller och matchbladet): bilderna sparas som filer i
// data/cache/skoldar/ (<id>.png och <id>-m.png för mörk botten) och kopieras
// till sajten av bygget; datan är indexet lagnamn → [ESPN-id, mörk finns].
// Lagen tas ur spelprogrammen, så att cupmotståndet också kommer med. En gång
// i veckan räcker: sköldar byts sällan.
SOURCES.push({
  id: 'espn_skoldar',
  provider: 'ESPN',
  short: 'ESPN',
  label: 'Lagsköldar',
  comps: COMPETITIONS.map((c) => c.id),
  kinds: ['crests'],
  maxAgeHours: 24 * 7,
  staleAfterHours: 24 * 30,
  verified: '2026-10-21',
  stage: 2,
  fetch: async () => {
    const byId = new Map();
    for (const c of COMPETITIONS) {
      const cache = readCache(`espn_fixtures_${c.id}`);
      for (const m of (cache && cache.data && cache.data.matches) || []) {
        for (const t of [m.home, m.away]) if (t && t.espnId) byId.set(t.espnId, { espnId: t.espnId, name: t.name });
      }
    }
    if (!byId.size) throw new Error('inget spelprogram i cachen än');
    const dir = path.join(CACHE_DIR, 'skoldar');
    fs.mkdirSync(dir, { recursive: true });
    const teams = {};
    const missing = [];
    for (const t of await espn.fetchCrests([...byId.values()])) {
      if (!t.light) { missing.push(t.name); continue; }
      fs.writeFileSync(path.join(dir, `${t.espnId}.png`), t.light);
      if (t.dark) fs.writeFileSync(path.join(dir, `${t.espnId}-m.png`), t.dark);
      teams[t.name] = [t.espnId, t.dark ? 1 : 0];
    }
    return { teams, missing: missing.sort(), sourceUrl: 'https://www.espn.com/soccer/teams/_/league/eng.1' };
  },
  summarize: (d) => {
    const n = Object.keys(d.teams).length;
    return { n, detail: `${n} lag` + (d.missing.length ? `, ingen sköld för ${d.missing.join(', ')}` : '') };
  },
});

// 2000 → "2000/01"
function seasonLabel(y) {
  return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
}

// Kommande matcher (alla tävlingar) inom `days` dagar ur spelprogramscachen.
// null = inget spelprogram cachat än.
function upcomingEvents(days) {
  const now = Date.now();
  const until = now + days * 86400000;
  let any = false;
  const out = [];
  for (const c of COMPETITIONS) {
    const cache = readCache(`espn_fixtures_${c.id}`);
    if (!cache || !cache.data) continue;
    any = true;
    for (const m of cache.data.matches) {
      const t = new Date(m.kickoff).getTime();
      if (!m.completed && t >= now - 3 * 3600000 && t <= until) out.push({ slug: c.espn, id: m.id });
    }
  }
  return any ? out : null;
}

// Trupper och spelarstatistik per liga (src/playersources.js).
SOURCES.push(...require('./playersources').PLAYER_SOURCES);

module.exports = { SOURCES, VERIFIED, ODDS_WINDOW_DAYS };
