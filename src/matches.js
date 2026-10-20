'use strict';

// Sammanställer källorna per match: ESPN:s spelprogram är stommen, och
// football-data.co.uk (skott, xG, odds), Understat (xG, PL), ESPN-odds och
// FPL (trupp, PL) kopplas på via lagnamnsmappningen.
//
// Allt som visas om en match är punkt-i-tiden: lagens statistik bygger bara
// på matcher spelade FÖRE avspark, så att samma underlag kan användas av
// prognosmotorn och backtestet senare. (Undantag: tabell och trupp finns
// bara som aktuell ögonblicksbild – det märks i svaret.)

const fs = require('fs');
const path = require('path');
const { COMPETITIONS, NATIONAL_LEAGUE, EUROPE, competition } = require('../config/competitions');
const { readCache, CACHE_DIR } = require('./store');
const { SOURCES, ODDS_WINDOW_DAYS } = require('./sources');
const { keyOf, espnKey } = require('./teams');
const { newsSv } = require('./skadetext');

const FORM_N = 5;

// ---------- inläsning (memoiserad på cachefilernas mtime) ----------

let memo = null;

function load() {
  const sig = SOURCES.map((s) => {
    try { return fs.statSync(path.join(CACHE_DIR, s.id + '.json')).mtimeMs; } catch { return 0; }
  }).join(',');
  if (!memo || memo.sig !== sig) memo = { sig, data: build() };
  return memo.data;
}

function build() {
  const matches = [];
  const espnTeams = new Map(); // nyckel → { name, espnId }
  const teamLeague = new Map(); // nyckel → ligans comp-id
  const fixturesFetchedAt = {};
  for (const c of COMPETITIONS) {
    const cache = readCache(`espn_fixtures_${c.id}`);
    fixturesFetchedAt[c.id] = cache ? cache.fetchedAt : null;
    if (!cache || !cache.data) continue;
    for (const m of cache.data.matches) {
      matches.push({
        ...m, comp: c.id, score90: regulationScore(m), hk: espnKey(m.home.name), ak: espnKey(m.away.name),
      });
      for (const t of [m.home, m.away]) {
        espnTeams.set(espnKey(t.name), t);
        if (c.type === 'league') teamLeague.set(espnKey(t.name), c.id);
      }
    }
  }
  matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  const unmapped = new Map();
  const noteUnmapped = (source, name, comp) => {
    const k = `${source}|${name}`;
    if (!unmapped.has(k)) unmapped.set(k, { source, name, comp });
  };

  // football-data.co.uk: en rad per (hemma, borta) och division – unikt
  // inom en ligasäsong.
  const fd = {};
  for (const c of [...COMPETITIONS.filter((x) => x.fdcouk), NATIONAL_LEAGUE]) {
    const cache = readCache(`fdcouk_${c.fdcouk}`);
    const rows = cache && cache.data ? cache.data.rows : [];
    const byPair = new Map();
    for (const r of rows) {
      // Lagnycklarna räknas en gång här och återanvänds i alla uppslag.
      const hk = (r.hk = keyOf(r.HomeTeam));
      const ak = (r.ak = keyOf(r.AwayTeam));
      byPair.set(`${hk}|${ak}`, r);
      if (c.id !== 'nl') {
        if (!espnTeams.has(hk)) noteUnmapped('football-data.co.uk', r.HomeTeam, c.name);
        if (!espnTeams.has(ak)) noteUnmapped('football-data.co.uk', r.AwayTeam, c.name);
      }
    }
    fd[c.id] = {
      rows,
      byPair,
      fetchedAt: cache ? cache.fetchedAt : null,
      lastMatchDate: cache && cache.data ? cache.data.lastMatchDate : null,
    };
  }

  const referees = refereeIndex(fd);

  const fdfx = readCache('fdcouk_fixtures');
  const fdFixtures = { byPair: new Map(), fetchedAt: fdfx ? fdfx.fetchedAt : null };
  if (fdfx && fdfx.data) {
    for (const r of fdfx.data.rows) fdFixtures.byPair.set(`${keyOf(r.HomeTeam)}|${keyOf(r.AwayTeam)}`, r);
  }

  const us = readCache('understat_epl');
  const understat = { byPair: new Map(), matches: [], fetchedAt: us ? us.fetchedAt : null };
  if (us && us.data) {
    for (const m of us.data.matches) {
      const hk = keyOf(m.home);
      const ak = keyOf(m.away);
      understat.byPair.set(`${hk}|${ak}`, m);
      understat.matches.push({ ...m, hk, ak });
      if (!espnTeams.has(hk)) noteUnmapped('Understat', m.home, 'Premier League');
      if (!espnTeams.has(ak)) noteUnmapped('Understat', m.away, 'Premier League');
    }
  }

  const oc = readCache('espn_odds');
  const odds = { byEvent: oc && oc.data ? oc.data.byEvent : {}, fetchedAt: oc ? oc.fetchedAt : null };

  const standings = {};
  for (const c of COMPETITIONS.filter((x) => x.type === 'league')) {
    const cache = readCache(`espn_standings_${c.id}`);
    const byTeam = new Map();
    if (cache && cache.data) for (const r of cache.data.rows) byTeam.set(espnKey(r.name), r);
    standings[c.id] = { byTeam, fetchedAt: cache ? cache.fetchedAt : null, size: byTeam.size };
  }

  const fc = readCache('fpl');
  const fpl = { byTeamKey: new Map(), fetchedAt: fc ? fc.fetchedAt : null, nextGameweek: null };
  if (fc && fc.data) {
    fpl.nextGameweek = fc.data.nextGameweek;
    for (const t of fc.data.teams) {
      const k = keyOf(t.name);
      if (!espnTeams.has(k)) noteUnmapped('FPL', t.name, 'Premier League');
      fpl.byTeamKey.set(k, fc.data.players.filter((p) => p.teamId === t.id));
    }
  }

  // Europacuperna: bara matcher med ett engelskt lag, kopplade på ESPN:s
  // lag-id (samma id i alla ESPN:s turneringar). Ingår inte i `matches` – de
  // får ingen prognos och ska inte in i prognosmotorns underlag.
  const keyById = new Map([...espnTeams].map(([k, t]) => [t.espnId, k]));
  const europe = [];
  const europeFetchedAt = {};
  for (const c of EUROPE) {
    const cache = readCache(`espn_europe_${c.id}`);
    europeFetchedAt[c.id] = cache ? cache.fetchedAt : null;
    if (!cache || !cache.data) continue;
    for (const m of cache.data.matches) {
      const hk = keyById.get(m.home.espnId) || null;
      const ak = keyById.get(m.away.espnId) || null;
      if (hk || ak) europe.push({ ...m, comp: c.id, score90: regulationScore(m), hk, ak });
    }
  }
  europe.sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  return {
    matches,
    byId: new Map(matches.map((m) => [m.id, m])),
    espnTeams,
    teamLeague,
    fixturesFetchedAt,
    europe,
    europeFetchedAt,
    referees,
    fd,
    fdFixtures,
    understat,
    odds,
    standings,
    fpl,
    unmapped: [...unmapped.values()],
  };
}

// Domarna: alla ligamatcher nivå 1–5 med domare och kort de senaste
// REF_SEASONS avslutade säsongerna (fdcouk_stats_*, samma filer som sidan
// Statistik) och i år (fdcouk_*). Index per domare och per division, i
// datumordning, så att en match bara ser matcher före sin egen dag.
const REF_SEASONS = 3;
const REF_MIN = 10;
const DIV_IDS = { E0: 'pl', E1: 'ch', E2: 'l1', E3: 'l2', EC: 'nl' };

function refereeIndex(fd) {
  const { SEASON } = require('../config/competitions');
  const byName = new Map();
  const byDiv = new Map();
  const fetchedAt = [];
  const add = (r, div) => {
    if (!r.Referee || r.HY == null || r.AY == null || r.FTHG == null) return;
    const x = {
      date: r.date, div,
      y: r.HY + r.AY, r: (r.HR || 0) + (r.AR || 0),
      f: r.HF != null && r.AF != null ? r.HF + r.AF : null,
      res: r.FTHG > r.FTAG ? 0 : r.FTHG === r.FTAG ? 1 : 2,
    };
    const name = r.Referee.trim().replace(/\s+/g, ' ');
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(x);
    if (!byDiv.has(div)) byDiv.set(div, []);
    byDiv.get(div).push(x);
  };
  for (const [code, div] of Object.entries(DIV_IDS)) {
    const st = readCache(`fdcouk_stats_${code}`);
    if (st && st.data) {
      fetchedAt.push(st.fetchedAt);
      const seasons = Object.keys(st.data.seasons).filter((c) => c !== SEASON.fdcouk).sort().slice(-REF_SEASONS);
      for (const c of seasons) for (const r of st.data.seasons[c]) add(r, div);
    }
    if (fd[div]) {
      fetchedAt.push(fd[div].fetchedAt);
      for (const r of fd[div].rows) add(r, div);
    }
  }
  for (const list of [...byName.values(), ...byDiv.values()]) list.sort((a, b) => a.date.localeCompare(b.date));
  return { byName, byDiv, seasons: REF_SEASONS, fetchedAt: fetchedAt.filter(Boolean).sort()[0] || null };
}

function refSummary(list) {
  const n = list.length;
  const sum = (fn) => list.reduce((t, x) => t + fn(x), 0);
  const withF = list.filter((x) => x.f != null);
  return {
    n,
    yellow: sum((x) => x.y) / n,
    red: sum((x) => x.r) / n,
    fouls: withF.length ? withF.reduce((t, x) => t + x.f, 0) / withF.length : null,
    home: list.filter((x) => x.res === 0).length / n,
    draw: list.filter((x) => x.res === 1).length / n,
    away: list.filter((x) => x.res === 2).length / n,
  };
}

// Domaren för en ligamatch (football-data.co.uk tillsätter namnet när
// oddsen läggs ut, fre/tis) och hans eller hennes matcher före matchdagen.
function refereeInfo(D, m, c, hk, ak) {
  if (c.type !== 'league') return { unknown: true, reason: 'Domare finns bara för ligamatcherna i de fria källorna.' };
  const key = `${hk}|${ak}`;
  const row = (m.completed ? D.fd[c.id].byPair.get(key) : null) || D.fdFixtures.byPair.get(key);
  if (!row || !row.Referee) {
    return { unknown: true, reason: m.completed ? 'Domaren saknas i källan för matchen.' : 'Domaren är inte utsedd än – football-data.co.uk lägger ut namnet med oddsen (fre/tis).' };
  }
  const name = row.Referee.trim().replace(/\s+/g, ' ');
  const date = m.kickoff.slice(0, 10);
  const before = (list) => (list || []).filter((x) => x.date < date);
  const mine = before(D.referees.byName.get(name));
  const div = before(D.referees.byDiv.get(c.id));
  const divs = {};
  for (const x of mine) divs[x.div] = (divs[x.div] || 0) + 1;
  const first = mine.length ? mine[0].date : null;
  const stats = mine.length ? refSummary(mine) : { n: 0 };
  const avg = div.length ? { ...refSummary(div), division: c.name } : null;
  // Ovanligt = mer än två standardfel från divisionens snitt, och bara från
  // REF_MIN matcher (samma gräns som domartabellen på sidan Statistik).
  const flags = {};
  if (avg && stats.n >= REF_MIN) {
    const sd = Math.sqrt(mine.reduce((t, x) => t + (x.y - stats.yellow) ** 2, 0) / (stats.n - 1));
    const zy = (stats.yellow - avg.yellow) / (sd / Math.sqrt(stats.n));
    flags.yellow = zy > 2 ? 'more' : zy < -2 ? 'less' : null;
    const zh = (stats.home - avg.home) / Math.sqrt((avg.home * (1 - avg.home)) / stats.n);
    flags.home = zh > 2 ? 'more' : zh < -2 ? 'less' : null;
  }
  return {
    unknown: false,
    name,
    min: REF_MIN,
    stats,
    flags,
    divisions: Object.entries(divs).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, short: competition(id).short, n })),
    avg,
    since: first,
    seasons: REF_SEASONS,
    source: { provider: 'football-data.co.uk', fetchedAt: D.referees.fetchedAt },
  };
}

// Ställningen efter 90 minuter. Går matchen till förlängning/straffar räknas
// den fram ur målhändelserna; stämmer händelserna inte mot slutresultatet
// är den okänd (null) – den gissas inte.
function regulationScore(m) {
  if (!m.completed || !m.score) return null;
  if (m.status === 'STATUS_FULL_TIME' || m.status === 'STATUS_FINAL') return { ...m.score };
  const goals = m.goals.filter((g) => !g.shootout);
  if (goals.some((g) => minuteOf(g.clock) == null)) return null;
  const h = goals.filter((g) => g.teamId === m.home.espnId);
  const a = goals.filter((g) => g.teamId === m.away.espnId);
  if (h.length !== m.score.home || a.length !== m.score.away) return null;
  const reg = (g) => minuteOf(g.clock) <= 90;
  return { home: h.filter(reg).length, away: a.filter(reg).length };
}

// "45'+2'" → 45, "90'+7'" → 90, "105'" → 105
function minuteOf(clock) {
  const m = /^(\d+)'/.exec(clock || '');
  return m ? Number(m[1]) : null;
}

// ---------- matchlista ----------

// Hela säsongens matcher i kompakt form. Sidan filtrerar själv (kommande /
// spelade, tävling, tidsfönster) i webbläsaren, så att urvalet alltid utgår
// från besökarens klocka och inte från när sajten byggdes.
function allMatches() {
  const D = load();
  return {
    oddsFetchedAt: D.odds.fetchedAt,
    matches: D.matches.map((m) => {
      const c = competition(m.comp);
      const o = D.odds.byEvent[m.id];
      return {
        id: m.id,
        comp: m.comp,
        kickoff: m.kickoff,
        round: roundLabel(m, c),
        status: m.status,
        completed: m.completed,
        home: m.home.name,
        away: m.away.name,
        score: m.score,
        score90: m.score90,
        shootout: m.shootout,
        odds: o ? [o.home, o.draw, o.away] : null,
      };
    }),
  };
}

function matchIds() {
  return load().matches.map((m) => m.id);
}

function summary(D, m) {
  const c = competition(m.comp);
  const o = D.odds.byEvent[m.id];
  return {
    id: m.id,
    comp: m.comp,
    compName: c.name,
    compShort: c.short,
    kickoff: m.kickoff,
    round: roundLabel(m, c),
    status: m.status,
    statusText: m.statusText,
    completed: m.completed,
    home: m.home.name,
    away: m.away.name,
    score: m.score,
    score90: m.score90,
    shootout: m.shootout,
    odds: o ? { home: o.home, draw: o.draw, away: o.away } : null,
  };
}

const ROUNDS = {
  'preliminary-round': 'Förberedande omgång',
  'first-round': 'Omgång 1',
  'second-round': 'Omgång 2',
  'third-round': 'Omgång 3',
  'fourth-round': 'Omgång 4',
  'fifth-round': 'Omgång 5',
  'sixth-round': 'Kvartsfinal',
  quarterfinals: 'Kvartsfinal',
  'quarter-finals': 'Kvartsfinal',
  semifinals: 'Semifinal',
  'semi-finals': 'Semifinal',
  final: 'Final',
};

function roundLabel(m, c) {
  if (c.type !== 'cup' || !m.round) return null;
  return ROUNDS[m.round] || m.round.replace(/-/g, ' ');
}

// ---------- matchunderlag ----------

function matchDetail(id) {
  const D = load();
  const m = D.byId.get(String(id));
  if (!m) return null;
  const c = competition(m.comp);
  const hk = m.hk;
  const ak = m.ak;
  const unknowns = [];

  const home = teamProfile(D, hk, m.kickoff);
  const away = teamProfile(D, ak, m.kickoff);
  for (const [t, p] of [[m.home.name, home], [m.away.name, away]]) {
    if (!p.league) unknowns.push(`${t}: spelar inte i någon liga som källorna täcker – lagets styrka är okänd.`);
  }

  const odds = matchOdds(D, m, c, hk, ak);
  if (!odds.espn && !m.completed) {
    const daysAway = (new Date(m.kickoff).getTime() - Date.now()) / 86400000;
    odds.note = daysAway > ODDS_WINDOW_DAYS
      ? `Odds hämtas när det är högst ${ODDS_WINDOW_DAYS} dagar kvar till avspark.`
      : 'DraftKings (ESPN) har inga odds för matchen ännu.';
    unknowns.push(odds.note);
  } else if (m.completed && !odds.espn && !odds.fdOpen) {
    odds.note = 'inga odds från före avspark finns sparade för matchen';
  }
  if (c.type === 'cup') unknowns.push('Cupodds finns bara hos DraftKings via ESPN – ingen fri historik att jämföra med.');

  const squad = {
    home: squadInfo(D, hk, home.league),
    away: squadInfo(D, ak, away.league),
  };
  if (squad.home.unknown || squad.away.unknown) {
    unknowns.push('Skador och avstängningar: fri källa finns bara för Premier League (FPL).');
  }
  if (!m.completed) unknowns.push('Startelvor: publiceras först strax före avspark.');

  return {
    match: {
      ...summary(D, m),
      venue: m.venue,
      neutral: m.neutral,
      winner: m.winner,
      type: c.type,
      tierNote: c.type === 'cup' ? tierNote(home, away) : null,
    },
    prediction: null,
    odds,
    teams: { home, away },
    rows: sideBySide(home, away),
    squad,
    referee: refereeInfo(D, m, c, hk, ak),
    meetings: seasonMeetings(D, hk, ak, m),
    pastMeetings: pastMeetings(m),
    unknowns,
  };
}

// Lagets säsong fram till (men inte med) avspark `before`.
function teamProfile(D, k, before) {
  const leagueId = D.teamLeague.get(k) || (inNationalLeague(D, k) ? 'nl' : null);
  const league = leagueId ? competition(leagueId) : null;
  const p = { key: k, league: league ? { id: league.id, name: league.name, tier: league.tier } : null };
  if (!league) return p;
  const beforeDate = before.slice(0, 10);

  // Resultat i ligan
  let results;
  let resultsSource;
  if (leagueId === 'nl') {
    results = D.fd.nl.rows
      .filter((r) => r.FTHG != null && r.date < beforeDate && (r.hk === k || r.ak === k))
      .map((r) => ({ date: r.date, home: r.hk === k, gf: r.hk === k ? r.FTHG : r.FTAG, ga: r.hk === k ? r.FTAG : r.FTHG }));
    resultsSource = { provider: 'football-data.co.uk', fetchedAt: D.fd.nl.fetchedAt };
  } else {
    results = D.matches
      .filter((m) => m.comp === leagueId && m.completed && m.score && m.kickoff < before
        && (m.hk === k || m.ak === k))
      .map((m) => {
        const isHome = m.hk === k;
        return { date: m.kickoff.slice(0, 10), home: isHome, gf: isHome ? m.score.home : m.score.away, ga: isHome ? m.score.away : m.score.home };
      });
    resultsSource = { provider: 'ESPN', fetchedAt: D.fixturesFetchedAt[leagueId] };
  }
  p.record = {
    all: record(results),
    home: record(results.filter((r) => r.home)),
    away: record(results.filter((r) => !r.home)),
    through: results.length ? results[results.length - 1].date : null,
    source: resultsSource,
  };
  // Målprofilen i ligan: hur ofta lagets matcher gett över 2,5 mål, mål av
  // båda lagen, hållen nolla och inget eget mål – samma mått som prognosens
  // "över 2,5" och "båda lagen gör mål".
  p.goalProfile = {
    n: results.length,
    over25: results.filter((r) => r.gf + r.ga > 2.5).length,
    btts: results.filter((r) => r.gf > 0 && r.ga > 0).length,
    cleanSheets: results.filter((r) => r.ga === 0).length,
    blanks: results.filter((r) => r.gf === 0).length,
  };

  // Skott och xG (football-data.co.uk) – ligamatcher före avspark
  const fdLeague = D.fd[leagueId];
  if (fdLeague) {
    const rows = fdLeague.rows.filter((r) => r.FTHG != null && r.date < beforeDate
      && (r.hk === k || r.ak === k));
    const side = (r) => (r.hk === k ? ['H', 'A'] : ['A', 'H']);
    const avg = (fn) => mean(rows.map(fn).filter((x) => x != null));
    p.stats = {
      n: rows.length,
      shotsFor: avg((r) => r[side(r)[0] + 'S']),
      shotsAgainst: avg((r) => r[side(r)[1] + 'S']),
      sotFor: avg((r) => r[side(r)[0] + 'ST']),
      sotAgainst: avg((r) => r[side(r)[1] + 'ST']),
      xgFor: avg((r) => r[side(r)[0] + 'xG']),
      xgAgainst: avg((r) => r[side(r)[1] + 'xG']),
      xgN: rows.filter((r) => r.HxG != null).length,
      // Mål minus xG, summerat över matcherna med xG (plus = fler mål än
      // chanserna brukar ge).
      xgDiff: goalsMinusXg(rows.filter((r) => r.HxG != null && r.AxG != null).map((r) => {
        const [f, a] = side(r);
        return { gf: r[`FT${f}G`], ga: r[`FT${a}G`], xf: r[`${f}xG`], xa: r[`${a}xG`] };
      })),
      through: rows.length ? rows[rows.length - 1].date : null,
      source: { provider: 'football-data.co.uk', fetchedAt: fdLeague.fetchedAt },
    };
  }

  // xG från Understat (bara PL)
  if (leagueId === 'pl' && D.understat.matches.length) {
    const ms = D.understat.matches.filter((m) => m.played && m.xg && m.kickoff < before && (m.hk === k || m.ak === k));
    p.understat = {
      n: ms.length,
      xgFor: mean(ms.map((m) => (m.hk === k ? m.xg.home : m.xg.away))),
      xgAgainst: mean(ms.map((m) => (m.hk === k ? m.xg.away : m.xg.home))),
      xgDiff: goalsMinusXg(ms.filter((m) => m.goals).map((m) => (m.hk === k
        ? { gf: m.goals.home, ga: m.goals.away, xf: m.xg.home, xa: m.xg.away }
        : { gf: m.goals.away, ga: m.goals.home, xf: m.xg.away, xa: m.xg.home }))),
      through: ms.length ? ms[ms.length - 1].kickoff.slice(0, 10) : null,
      source: { provider: 'Understat', fetchedAt: D.understat.fetchedAt },
    };
  }

  // Tabell (aktuell – ESPN ger ingen historisk tabell)
  const st = D.standings[leagueId];
  const row = st && st.byTeam.get(k);
  if (row) {
    p.table = {
      rank: row.rank, size: st.size, points: row.points, played: row.played, gd: row.gd,
      deductions: row.deductions || 0,
      source: { provider: 'ESPN', fetchedAt: st.fetchedAt },
    };
  }

  // Form: senaste matcherna i alla tävlingar före avspark (även Europa),
  // avgjorda på 90 minuter (straffavgjorda cupmatcher räknas som oavgjorda).
  const cal = calendar(D, k);
  const form = cal.filter((x) => x.completed && x.kickoff < before).map((x) => {
    const s = x.score90 || (x.status === 'STATUS_FULL_TIME' ? x.score : null);
    const gf = s ? (x.home ? s.home : s.away) : null;
    const ga = s ? (x.home ? s.away : s.home) : null;
    return {
      date: x.kickoff.slice(0, 10),
      comp: competition(x.comp).short,
      home: x.home,
      opponent: x.opponent,
      gf, ga,
      result: gf == null ? null : gf > ga ? 'V' : gf < ga ? 'F' : 'O',
      decided: x.shootout ? 'straffar' : x.status === 'STATUS_FINAL_AET' ? 'förlängning' : null,
    };
  });
  p.schedule = schedule(D, cal, before, leagueId);
  p.form = form.slice(-FORM_N).reverse();
  return p;
}

// Lagets matcher i alla tävlingar som källorna har, i tidsordning: ligan och
// cuperna (ESPN), Europacuperna (ESPN) och – för lag i National League –
// ligaresultaten från football-data.co.uk (bara spelade, utan motståndare i
// ESPN:s namn). Cachad per inläsning.
function calendar(D, k) {
  if (!D.calendars) D.calendars = new Map();
  if (D.calendars.has(k)) return D.calendars.get(k);
  const out = [];
  const add = (m, europe) => {
    if (m.hk !== k && m.ak !== k) return;
    const home = m.hk === k;
    out.push({
      kickoff: m.kickoff, comp: m.comp, europe, home,
      opponent: home ? m.away.name : m.home.name,
      completed: m.completed, status: m.status, score: m.score, score90: m.score90, shootout: m.shootout,
    });
  };
  for (const m of D.matches) add(m, false);
  for (const m of D.europe) add(m, true);
  if (!D.teamLeague.has(k) && inNationalLeague(D, k)) {
    for (const r of D.fd.nl.rows) {
      if (r.FTHG == null || (r.hk !== k && r.ak !== k)) continue;
      const home = r.hk === k;
      const score = { home: r.FTHG, away: r.FTAG };
      out.push({
        kickoff: `${r.date}T15:00Z`, comp: 'nl', europe: false, home, opponent: home ? r.AwayTeam : r.HomeTeam,
        completed: true, status: 'STATUS_FULL_TIME', score, score90: score, shootout: null,
      });
    }
  }
  out.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  D.calendars.set(k, out);
  return out;
}

const SCHEDULE_DAYS = 14;
const INACTIVE = new Set(['STATUS_POSTPONED', 'STATUS_CANCELED', 'STATUS_ABANDONED']);
const dateDays = (a, b) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000);

// Schemat runt en match: förra matchen, nästa match och antalet matcher de
// senaste 14 dagarna före avspark. För en match längre fram räknas även
// matcher som är inlagda före den men inte spelade än – laget har spelat dem
// när det är dags. Uppskjutna och inställda räknas inte. Dagar räknas mellan
// matchdagarna (torsdag → söndag = 3). Nästa match är okänd för lag i
// National League – deras ligaprogram finns inte i källorna.
function schedule(D, cal, before, leagueId) {
  const brief = (x, days) => (x ? { date: x.kickoff.slice(0, 10), comp: competition(x.comp).short, compName: competition(x.comp).name, home: x.home, opponent: x.opponent, days, played: x.completed } : null);
  const past = cal.filter((x) => x.kickoff < before && (x.completed || !INACTIVE.has(x.status)));
  const last = past.length ? past[past.length - 1] : null;
  const next = leagueId === 'nl' ? null : cal.find((x) => x.kickoff > before && !INACTIVE.has(x.status)) || null;
  const from = Date.parse(before) - SCHEDULE_DAYS * 86400000;
  const recent = past.filter((x) => Date.parse(x.kickoff) >= from);
  const fetched = [...Object.values(D.fixturesFetchedAt), ...Object.values(D.europeFetchedAt)].filter(Boolean).sort();
  return {
    last: brief(last, last ? dateDays(last.kickoff, before) : null),
    next: brief(next, next ? dateDays(before, next.kickoff) : null),
    nextUnknown: leagueId === 'nl',
    recent: recent.length,
    recentEurope: recent.filter((x) => x.europe).length,
    windowDays: SCHEDULE_DAYS,
    source: { provider: 'ESPN, alla tävlingar inklusive Europacuperna', fetchedAt: fetched[0] || null },
  };
}

function inNationalLeague(D, k) {
  return D.fd.nl.rows.some((r) => r.hk === k || r.ak === k);
}

function goalsMinusXg(rs) {
  if (!rs.length) return null;
  const sum = (fn) => rs.reduce((t, r) => t + fn(r), 0);
  return { n: rs.length, for: sum((r) => r.gf - r.xf), against: sum((r) => r.ga - r.xa) };
}

function record(rs) {
  const w = rs.filter((r) => r.gf > r.ga).length;
  const d = rs.filter((r) => r.gf === r.ga).length;
  const gf = rs.reduce((s, r) => s + r.gf, 0);
  const ga = rs.reduce((s, r) => s + r.ga, 0);
  return { n: rs.length, w, d, l: rs.length - w - d, gf, ga, points: 3 * w + d };
}

function mean(xs) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
}

// Rader för "lagen sida vid sida". Värden formateras här (en plats), null =
// okänt. Varje grupp bär sin källa och sitt datum.
function sideBySide(h, a) {
  const groups = [];
  const both = (fn) => [fn(h), fn(a)];
  const src = (p, key) => (p[key] ? p[key].source : null);

  groups.push({
    title: 'Liga',
    rows: [{ label: 'Spelar i', values: both((p) => (p.league ? `${p.league.name}${p.league.tier ? ` (nivå ${p.league.tier})` : ''}` : null)) }],
  });

  if (h.table || a.table) {
    groups.push({
      title: 'Tabell just nu',
      sources: [src(h, 'table'), src(a, 'table')],
      rows: [
        { label: 'Placering', values: both((p) => (p.table ? `${p.table.rank} av ${p.table.size}` : null)) },
        { label: 'Poäng', values: both((p) => (p.table ? `${p.table.points} på ${p.table.played}` : null)) },
        { label: 'Målskillnad', values: both((p) => (p.table ? signed(p.table.gd) : null)) },
        ...(h.table && h.table.deductions) || (a.table && a.table.deductions)
          ? [{ label: 'Poängavdrag', values: both((p) => (p.table ? String(p.table.deductions) : null)) }] : [],
      ],
    });
  }

  if (h.schedule || a.schedule) {
    const sc = (p) => p.schedule;
    const tag = (x) => (x ? `${x.days} (${x.comp})` : null);
    groups.push({
      title: 'Schemat',
      sources: [h.schedule && h.schedule.source, a.schedule && a.schedule.source],
      note: 'Dagar räknas mellan matchdagarna. Inom parentes: tävlingen för förra respektive nästa match.',
      rows: [
        { label: 'Dagar sedan förra matchen', values: both((p) => (sc(p) ? tag(sc(p).last) : null)) },
        { label: `Matcher senaste ${(h.schedule || a.schedule).windowDays} dagarna`, values: both((p) => (sc(p) ? `${sc(p).recent}${sc(p).recentEurope ? ` (${sc(p).recentEurope} i Europa)` : ''}` : null)) },
        { label: 'Dagar till nästa match', values: both((p) => (sc(p) && sc(p).next ? tag(sc(p).next) : sc(p) && !sc(p).nextUnknown ? 'ingen inlagd' : null)) },
      ],
    });
  }

  groups.push({
    title: 'Ligan hittills',
    sources: [src(h, 'record'), src(a, 'record')],
    through: [h.record && h.record.through, a.record && a.record.through],
    rows: [
      { label: 'Matcher', values: both((p) => (p.record ? String(p.record.all.n) : null)) },
      { label: 'V–O–F', values: both((p) => (p.record ? vof(p.record.all) : null)) },
      { label: 'Mål', values: both((p) => (p.record ? `${p.record.all.gf}–${p.record.all.ga}` : null)) },
      { label: 'Hemma V–O–F', values: both((p) => (p.record ? vof(p.record.home) : null)) },
      { label: 'Borta V–O–F', values: both((p) => (p.record ? vof(p.record.away) : null)) },
      { label: 'Mål per match', values: both((p) => (p.record && p.record.all.n ? `${dec(p.record.all.gf / p.record.all.n, 1)}–${dec(p.record.all.ga / p.record.all.n, 1)}` : null)) },
    ],
  });

  const gp = (p, key) => (p.goalProfile && p.goalProfile.n ? `${p.goalProfile[key]} av ${p.goalProfile.n}` : null);
  groups.push({
    title: 'Målprofil i ligan',
    sources: [src(h, 'record'), src(a, 'record')],
    through: [h.record && h.record.through, a.record && a.record.through],
    rows: [
      { label: 'Över 2,5 mål', values: both((p) => gp(p, 'over25')) },
      { label: 'Båda lagen gör mål', values: both((p) => gp(p, 'btts')) },
      { label: 'Hållit nollan', values: both((p) => gp(p, 'cleanSheets')) },
      { label: 'Inte gjort mål', values: both((p) => gp(p, 'blanks')) },
    ],
  });

  // Mål mot xG: Understat för PL (etablerad leverantör), annars
  // football-data.co.uk.
  const xgd = (p) => (p.understat && p.understat.xgDiff) || (p.stats && p.stats.xgDiff) || null;
  groups.push({
    title: 'Skott och xG per match',
    sources: [src(h, 'stats'), src(a, 'stats')],
    through: [h.stats && h.stats.through, a.stats && a.stats.through],
    note: 'Gjorda–insläppta. xG från football-data.co.uk: leverantören är odokumenterad, finns bara 2026/27. '
      + 'Mål mot xG: mål minus xG i år, summerat – plus betyder fler mål än chanserna brukar ge, och sådant brukar jämna ut sig. '
      + 'Premier League räknas mot Understat, övriga mot football-data.co.uk.',
    rows: [
      { label: 'Skott', values: both((p) => pair(p.stats, 'shotsFor', 'shotsAgainst', 1)) },
      { label: 'Skott på mål', values: both((p) => pair(p.stats, 'sotFor', 'sotAgainst', 1)) },
      { label: 'xG (football-data)', values: both((p) => (p.stats && p.stats.xgN ? pair(p.stats, 'xgFor', 'xgAgainst', 2) : null)) },
      ...(h.understat || a.understat
        ? [{ label: 'xG (Understat)', values: both((p) => pair(p.understat, 'xgFor', 'xgAgainst', 2)) }] : []),
      { label: 'Gjorda mål mot xG', values: both((p) => (xgd(p) ? signedDec(xgd(p).for, 1) : null)) },
      { label: 'Insläppta mål mot xG', values: both((p) => (xgd(p) ? signedDec(xgd(p).against, 1) : null)) },
    ],
  });

  return groups;
}

function pair(o, a, b, d) {
  if (!o || o[a] == null || o[b] == null) return null;
  return `${dec(o[a], d)}–${dec(o[b], d)}`;
}

function vof(r) {
  return r.n ? `${r.w}–${r.d}–${r.l}` : '0 matcher';
}

function dec(x, d) {
  return x.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// +1,4 / −0,3 / ±0,0 (minustecken, inte bindestreck)
function signedDec(x, d) {
  const r = Number(x.toFixed(d));
  if (r === 0) return `±${dec(0, d)}`;
  return r > 0 ? `+${dec(r, d)}` : `−${dec(-r, d)}`;
}

function signed(x) {
  return x > 0 ? `+${x}` : String(x);
}

function tierNote(h, a) {
  const th = h.league && h.league.tier;
  const ta = a.league && a.league.tier;
  if (!th || !ta || th === ta) return null;
  return 'Lagen spelar i olika divisioner – deras ligastatistik är inte direkt jämförbar.';
}

// Odds för matchen. DraftKings (ESPN) för alla tävlingar; för ligamatcher
// även football-data.co.uk: öppningsodds (insamlade fre/tis) och – när
// matchen spelats – stängningsodds.
function matchOdds(D, m, c, hk, ak) {
  const out = { espn: null, fdOpen: null, fdClose: null };
  const o = D.odds.byEvent[m.id];
  if (o) {
    out.espn = {
      provider: o.provider, fetchedAt: o.fetchedAt,
      x12: [o.home, o.draw, o.away],
      total: o.totalLine != null ? { line: o.totalLine, over: o.over, under: o.under } : null,
    };
  }
  if (c.type === 'league') {
    // Spelad match: resultatfilen (öppning + stängning). Den uppdateras bara
    // ett par gånger i veckan – tills dess finns öppningsoddsen kvar i
    // fixtures.csv.
    const result = m.completed ? D.fd[c.id].byPair.get(`${hk}|${ak}`) : null;
    const fixture = D.fdFixtures.byPair.get(`${hk}|${ak}`);
    if (result) {
      out.fdOpen = fdOdds(result, '', D.fd[c.id].fetchedAt);
      out.fdClose = fdOdds(result, 'C', D.fd[c.id].fetchedAt);
    } else if (fixture) {
      out.fdOpen = fdOdds(fixture, '', D.fdFixtures.fetchedAt);
    }
  }
  return out;
}

function fdOdds(r, c, fetchedAt) {
  const tri = (p) => (r[`${p}${c}H`] != null ? [r[`${p}${c}H`], r[`${p}${c}D`], r[`${p}${c}A`]] : null);
  const res = {
    provider: 'football-data.co.uk',
    fetchedAt,
    avg: tri('Avg'),
    max: tri('Max'),
    betfair: tri('BFE'),
    total25: r[`Avg${c}>2.5`] != null ? { over: r[`Avg${c}>2.5`], under: r[`Avg${c}<2.5`] } : null,
  };
  return res.avg || res.betfair ? res : null;
}

function squadInfo(D, k, league) {
  if (!league || league.id !== 'pl') {
    return { unknown: true, reason: 'Ingen fri källa för skador och avstängningar utanför Premier League.' };
  }
  const players = D.fpl.byTeamKey.get(k);
  if (!players) return { unknown: true, reason: 'FPL-data saknas för laget.' };
  const STATUS = { i: 'skadad', s: 'avstängd', d: 'tveksam', n: 'ej uttagbar' };
  const out = players
    .filter((p) => STATUS[p.status])
    .sort((x, y) => (y.minutes || 0) - (x.minutes || 0))
    .map((p) => ({
      name: p.name,
      pos: p.pos,
      status: STATUS[p.status],
      chance: p.chanceNext,
      news: newsSv(p.news),
      since: p.newsAdded ? p.newsAdded.slice(0, 10) : null,
      minutes: p.minutes,
    }));
  return {
    unknown: false,
    players: out,
    source: { provider: 'Fantasy Premier League', fetchedAt: D.fpl.fetchedAt },
    note: D.fpl.nextGameweek ? `Status inför ${D.fpl.nextGameweek.name.replace('Gameweek', 'omgång')}.` : null,
  };
}

// Tidigare möten mellan lagen denna säsong (alla tävlingar).
function seasonMeetings(D, hk, ak, current) {
  return D.matches
    .filter((m) => m.id !== current.id && m.completed && m.kickoff < current.kickoff
      && ((m.hk === hk && m.ak === ak)
        || (m.hk === ak && m.ak === hk)))
    .map((m) => summary(D, m));
}

// Inbördes möten från tidigare säsonger (football-data.co.uk:s ligor och
// ESPN:s FA-cuphistorik, mål efter 90 minuter), senaste först. Indexeras en
// gång per inläst historik.
const PAST_MEETINGS_N = 6;
let pastIndex = null;

function pastMeetings(m) {
  const { history } = require('./modeldata'); // sent: modeldata kräver den här modulen
  const H = history();
  if (!pastIndex || pastIndex.H !== H) {
    const byPair = new Map();
    for (const g of H.games) {
      const k = [g.h, g.a].sort().join('|');
      if (!byPair.has(k)) byPair.set(k, []);
      byPair.get(k).push(g);
    }
    pastIndex = { H, byPair };
  }
  const names = new Map([[m.hk, m.home.name], [m.ak, m.away.name]]);
  const list = (pastIndex.byPair.get([m.hk, m.ak].sort().join('|')) || []).slice(-PAST_MEETINGS_N).reverse().map((g) => ({
    date: g.date,
    season: `20${g.season.slice(0, 2)}/${g.season.slice(2)}`,
    compShort: competition(g.comp).short,
    home: names.get(g.h),
    away: names.get(g.a),
    score: { home: g.hg, away: g.ag },
  }));
  const fetchedAt = [H.fetchedAt.pl, H.fetchedAt.fac].filter(Boolean).sort()[0] || null;
  return { list, first: '2000/01', source: { provider: 'football-data.co.uk och ESPN (FA-cupen från 2021/22)', fetchedAt } };
}

function unmappedNames() {
  return load().unmapped;
}

module.exports = { allMatches, matchIds, matchDetail, unmappedNames, regulationScore, load };
