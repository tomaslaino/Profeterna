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
const { COMPETITIONS, NATIONAL_LEAGUE, competition } = require('../config/competitions');
const { readCache, CACHE_DIR } = require('./store');
const { SOURCES, ODDS_WINDOW_DAYS } = require('./sources');
const { keyOf, espnKey } = require('./teams');

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

  return {
    matches,
    byId: new Map(matches.map((m) => [m.id, m])),
    espnTeams,
    teamLeague,
    fixturesFetchedAt,
    fd,
    fdFixtures,
    understat,
    odds,
    standings,
    fpl,
    unmapped: [...unmapped.values()],
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
  unknowns.push('Inbördes möten från tidigare säsonger: historiken finns, men visas först i fas 4.');

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
    meetings: seasonMeetings(D, hk, ak, m),
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

  // Form: senaste matcherna i alla tävlingar före avspark, avgjorda på
  // 90 minuter (straffavgjorda cupmatcher räknas som oavgjorda).
  const form = D.matches
    .filter((m) => m.completed && m.kickoff < before && (m.hk === k || m.ak === k))
    .map((m) => {
      const isHome = m.hk === k;
      const s = m.score90 || (m.status === 'STATUS_FULL_TIME' ? m.score : null);
      const gf = s ? (isHome ? s.home : s.away) : null;
      const ga = s ? (isHome ? s.away : s.home) : null;
      return {
        date: m.kickoff.slice(0, 10),
        comp: competition(m.comp).short,
        home: isHome,
        opponent: isHome ? m.away.name : m.home.name,
        gf, ga,
        result: gf == null ? null : gf > ga ? 'V' : gf < ga ? 'F' : 'O',
        decided: m.shootout ? 'straffar' : m.status === 'STATUS_FINAL_AET' ? 'förlängning' : null,
      };
    });
  if (leagueId === 'nl') {
    for (const r of results) form.push({ date: r.date, comp: 'NL', home: r.home, opponent: null, gf: r.gf, ga: r.ga, result: r.gf > r.ga ? 'V' : r.gf < r.ga ? 'F' : 'O', decided: null });
    form.sort((a, b) => a.date.localeCompare(b.date));
  }
  p.form = form.slice(-FORM_N).reverse();
  return p;
}

function inNationalLeague(D, k) {
  return D.fd.nl.rows.some((r) => r.hk === k || r.ak === k);
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

  groups.push({
    title: 'Skott och xG per match',
    sources: [src(h, 'stats'), src(a, 'stats')],
    through: [h.stats && h.stats.through, a.stats && a.stats.through],
    note: 'Gjorda–insläppta. xG från football-data.co.uk: leverantören är odokumenterad, finns bara 2026/27.',
    rows: [
      { label: 'Skott', values: both((p) => pair(p.stats, 'shotsFor', 'shotsAgainst', 1)) },
      { label: 'Skott på mål', values: both((p) => pair(p.stats, 'sotFor', 'sotAgainst', 1)) },
      { label: 'xG (football-data)', values: both((p) => (p.stats && p.stats.xgN ? pair(p.stats, 'xgFor', 'xgAgainst', 2) : null)) },
      ...(h.understat || a.understat
        ? [{ label: 'xG (Understat)', values: both((p) => pair(p.understat, 'xgFor', 'xgAgainst', 2)) }] : []),
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
      news: p.news,
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

function unmappedNames() {
  return load().unmapped;
}

module.exports = { allMatches, matchIds, matchDetail, unmappedNames, regulationScore, load };
