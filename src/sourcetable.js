'use strict';

// Källtabellen (sidan Källor): källorna med vad de ger och var på sajten det
// används, status per hämtning (färsk / gammal / fel / okänt) och en
// täckningsmatris datatyp × tävling. Det som saknas skrivs ut med orsak.
//
// Statusen räknas här vid uppdateringen, men sidan räknar om den i
// webbläsaren ur fetchedAt och staleAfterHours: stannar den schemalagda
// hämtningen ska sidan visa "gammal", inte fortsätta visa "färsk".

const { COMPETITIONS } = require('../config/competitions');
const { SOURCES } = require('./sources');
const { readCache, ageHours } = require('./store');
const { unmappedNames } = require('./matches');

// Källorna i den ordning sidan visar dem, med nyckeln `short` ur
// src/sources.js. `live` = det som webbläsaren hämtar själv när man tittar
// (public/matchruta.js, public/kupong.js, public/folket.js) och därför inte
// har någon status här. Svenska Spel hämtas bara så.
const PROVIDERS = [
  {
    id: 'ESPN',
    name: 'ESPN',
    url: 'https://www.espn.com/soccer/',
    gives: 'Spelprogram, resultat och tabeller i alla sex tävlingar, trupperna och matchrapporterna i ligorna, Europacuperna, FA-cupens tidigare säsonger och lagsköldarna.',
    used: 'Matcherna, tabellerna, spelarstatistiken, vilan inför matcherna och prognosens underlag i cuperna',
    live: 'Ställningen och matchhändelserna – mål, kort, byten och statistik – hämtas när kupongen eller matchrutan är öppen, varje minut medan matchen pågår.',
  },
  {
    id: 'football-data',
    name: 'football-data.co.uk',
    url: 'https://www.football-data.co.uk/englandm.php',
    gives: 'Alla ligamatcher sedan 2000/01 med skott, kort, domare och spelbolagens odds, både när de öppnar och vid avspark.',
    used: 'Prognosens underlag, jämförelsen med spelbolagen, domaren och lagstatistiken',
  },
  {
    id: 'Understat',
    name: 'Understat',
    url: 'https://understat.com/league/EPL',
    gives: 'xG per match i Premier League.',
    used: 'xG i matchrutan',
  },
  {
    id: 'FPL',
    name: 'Fantasy Premier League',
    url: 'https://fantasy.premierleague.com/',
    gives: 'Skador, avstängningar, speltid och xG per spelare i Premier League.',
    used: 'Skadorna i matchrutan och spelarstatistiken',
  },
  {
    id: 'DraftKings',
    name: 'DraftKings',
    url: 'https://sportsbook.draftkings.com/',
    gives: 'Odds för veckans matcher, även i cuperna – via ESPN.',
    used: 'Oddsen i matchrutan och jämförelsen med spelbolagen i cuperna',
  },
  {
    id: '365Scores',
    name: '365Scores',
    url: 'https://www.365scores.com/football/england',
    gives: 'Spelarnas betyg efter varje match, 1–10, och startelvorna.',
    used: 'Betygen i statistiken och matchrutan',
    live: 'Startelvorna och vilka som saknas hämtas när matchrutan öppnas.',
  },
  {
    id: 'Svenska Spel',
    name: 'Svenska Spel',
    url: 'https://spela.svenskaspel.se/stryktipset',
    gives: 'Veckans Stryktips och hur Svenska folket spelar det.',
    used: 'Hämta Stryktipset och Svenska folket på kupongen',
    live: 'Hämtas via sajtens kupongtjänst när kupongen är öppen, varje minut fram till spelstoppet.',
  },
  {
    id: 'YouTube',
    name: 'YouTube',
    url: 'https://www.youtube.com/',
    gives: 'Klubbarnas och sändarnas egna sammandrag.',
    used: 'Höjdpunkterna',
  },
  {
    id: 'Viaplay',
    name: 'Viaplay',
    url: 'https://viaplay.se/sport/fotboll',
    gives: 'Gratis sammandrag med reklam.',
    used: 'Höjdpunkterna, när YouTube saknar klipp',
  },
];

const KINDS = [
  { id: 'fixtures', label: 'Spelprogram och resultat' },
  { id: 'table', label: 'Tabell' },
  { id: 'odds', label: 'Odds' },
  { id: 'stats', label: 'Skott och kort' },
  { id: 'xg', label: 'xG' },
  { id: 'referee', label: 'Domare' },
  { id: 'squad', label: 'Skador och avstängningar' },
  { id: 'lineups', label: 'Startelvor' },
  { id: 'players', label: 'Spelarstatistik' },
  { id: 'europe', label: 'Europaspel' },
  { id: 'history', label: 'Tidigare säsonger' },
  { id: 'video', label: 'Höjdpunkter' },
];

// Det som webbläsaren hämtar själv, per datatyp och tävling.
const LIVE = [
  { provider: '365Scores', kinds: ['lineups', 'squad'], comps: COMPETITIONS.map((c) => c.id) },
];

// Orsak när en cell saknar källa.
const GAPS = {
  table: { cup: 'cuperna har ingen tabell' },
  stats: { cup: 'lagens ligadata används' },
  xg: { cup: 'lagens ligadata används' },
  referee: { cup: 'finns inte för cuperna' },
  players: { cup: 'lagens ligadata används' },
  history: { cup: 'hämtas inte' },
  europe: { default: 'inga lag i Europa' },
  video: { default: 'inga gratis sammandrag' },
};

function sourceRows() {
  return SOURCES.map((s) => {
    const c = readCache(s.id);
    const has = !!(c && c.data);
    let summary = null;
    if (has) {
      try { summary = s.summarize(c.data); } catch { summary = null; }
    }
    // En lyckad hämtning utan innehåll (t.ex. FA-cupen innan första
    // omgången lottats) är inte "färsk" data – den är okänd. Misslyckades
    // den senaste hämtningen är det ett fel, med eller utan gammal data.
    const empty = !has || !!(summary && summary.n === 0);
    let status;
    if (c && c.lastError) status = 'fel';
    else if (empty) status = 'okänt';
    else if (ageHours(c.fetchedAt) > s.staleAfterHours) status = 'gammal';
    else status = 'färsk';
    return {
      id: s.id,
      provider: s.provider,
      short: s.short || s.provider,
      label: s.label,
      comps: s.comps,
      kinds: s.kinds,
      status,
      fetchedAt: c ? c.fetchedAt : null,
      staleAfterHours: s.staleAfterHours,
      empty,
      lastError: c ? c.lastError || null : null,
      lastAttempt: c ? c.lastAttempt || null : null,
      detail: summary ? summary.detail : null,
      latestData: summary ? summary.latestData || null : null,
      url: has ? c.data.sourceUrl || null : null,
      cadenceHours: s.maxAgeHours,
      verified: s.verified,
    };
  });
}

function coverage(rows) {
  return KINDS.map((k) => ({
    kind: k.id,
    label: k.label,
    cells: COMPETITIONS.map((c) => {
      const srcs = rows.filter((r) => r.kinds.includes(k.id) && r.comps.includes(c.id));
      const live = LIVE.filter((l) => l.kinds.includes(k.id) && l.comps.includes(c.id)).map((l) => l.provider);
      if (srcs.length || live.length) return { comp: c.id, sourceIds: srcs.map((r) => r.id), live };
      const gap = GAPS[k.id] || {};
      return { comp: c.id, sourceIds: [], live: [], gap: gap[c.type] || gap.default || 'ingen fri källa' };
    }),
  }));
}

function sourceReport() {
  const rows = sourceRows();
  const counts = {};
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  return {
    sources: rows,
    counts,
    providers: PROVIDERS,
    coverage: coverage(rows),
    competitions: COMPETITIONS.map((c) => ({ id: c.id, name: c.name, short: c.short })),
    unmapped: unmappedNames(),
  };
}

module.exports = { sourceReport, PROVIDERS };
