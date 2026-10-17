'use strict';

// Modellens underlag: alla spelade matcher (mål efter 90 minuter) som
// prognosmotorn får skatta på, med säsong och nivå per lag och säsong.
//
//   Tidigare säsonger  football-data.co.uk E0–E3 och EC (ligor, nivå 1–5)
//                      ESPN FA-cupen 2021/22– (cupmatcher mellan nivåer och
//                      lag under National League)
//   Innevarande        ESPN (ligorna, EFL-cupen, FA-cupen – fräschast) och
//                      football-data.co.uk EC (National League, saknas hos ESPN)
//
// Underlaget är punkt-i-tiden-neutralt: varje match har sitt datum, och
// prognosmotorn tar bara med matcher före prognosens datum.
//
// Nivå per lag och säsong: nivå 1–4 enligt ligan laget spelar i, 5 =
// National League. Lag som inte finns i någon av dem den säsongen (nivå 6
// och lägre, bara i FA-cupen) får den gemensamma nyckeln LOWER: de har ingen
// egen lagdata, och modellen skattar i stället nivån som helhet.

const fs = require('fs');
const path = require('path');
const { COMPETITIONS, NATIONAL_LEAGUE, SEASON, fdSeasonCode } = require('../config/competitions');
const { readCache, CACHE_DIR } = require('./store');
const { keyOf, espnKey } = require('./teams');
const { load, regulationScore } = require('./matches');
const rules = require('../config/forecast-rules');

const LOWER = '~lower';

// Neutral plan: ESPN:s flagga eller cupens Wembley-omgångar (flaggan är inte
// satt för dem hos ESPN, se config/forecast-rules.js).
function neutralOf(m, comp) {
  const r = rules.cups[comp];
  return !!m.neutral || !!(r && r.neutralRounds.includes(m.round));
}
const DIVISIONS = [...COMPETITIONS.filter((c) => c.fdcouk), NATIONAL_LEAGUE]; // nivå 1–5
// understat_hist_epl hämtas bara av kandidatjakten (src/candidates.js) –
// saknas den har Premier League-matcherna helt enkelt ingen xG.
const HIST_IDS = [...DIVISIONS.map((c) => `fdcouk_hist_${c.fdcouk}`), 'espn_hist_fac', 'understat_hist_epl'];

// Skott på mål [hemma, borta] ur en football-data.co.uk-rad, om båda finns.
function sotOf(r) {
  return r && r.HST != null && r.AST != null ? [r.HST, r.AST] : null;
}

function startYear(code) {
  return 2000 + Number(code.slice(0, 2));
}

// ---------- tidigare säsonger (memoiserat på cachefilernas mtime) ----------

let memo = null;

function history() {
  const sig = HIST_IDS.map((id) => {
    try { return fs.statSync(path.join(CACHE_DIR, id + '.json')).mtimeMs; } catch { return 0; }
  }).join(',');
  if (memo && memo.sig === sig) return memo.data;

  const tiers = new Map(); // säsong → Map(lag → nivå)
  const games = [];
  const fetchedAt = {};
  // xG per match (Understat, Premier League): säsong → "hemma|borta" → [h, a]
  const xg = new Map();
  const us = readCache('understat_hist_epl');
  if (us) fetchedAt.understat = us.fetchedAt;
  if (us && us.data) {
    for (const [year, ms] of Object.entries(us.data.seasons)) {
      const byPair = new Map();
      for (const m of ms) if (m.xg) byPair.set(`${keyOf(m.home)}|${keyOf(m.away)}`, [m.xg.home, m.xg.away]);
      xg.set(fdSeasonCode(Number(year)), byPair);
    }
  }
  for (const c of DIVISIONS) {
    const cache = readCache(`fdcouk_hist_${c.fdcouk}`);
    fetchedAt[c.id] = cache ? cache.fetchedAt : null;
    if (!cache || !cache.data) continue;
    for (const [season, rows] of Object.entries(cache.data.seasons)) {
      if (!tiers.has(season)) tiers.set(season, new Map());
      const t = tiers.get(season);
      for (const r of rows) {
        const h = keyOf(r.HomeTeam);
        const a = keyOf(r.AwayTeam);
        t.set(h, c.tier);
        t.set(a, c.tier);
        const g = { date: r.date, season, comp: c.id, h, a, hg: r.FTHG, ag: r.FTAG, neutral: false, row: r, sot: sotOf(r) };
        if (c.id === 'pl' && xg.has(season)) g.xg = xg.get(season).get(`${h}|${a}`) || null;
        games.push(g);
      }
    }
  }

  const fa = readCache('espn_hist_fac');
  fetchedAt.fac = fa ? fa.fetchedAt : null;
  if (fa && fa.data) {
    for (const [season, ms] of Object.entries(fa.data.seasons)) {
      const t = tiers.get(season) || new Map();
      for (const m of ms) {
        const s = regulationScore(m);
        if (!s) continue;
        const hk = espnKey(m.home.name);
        const ak = espnKey(m.away.name);
        games.push({
          date: m.kickoff.slice(0, 10), season, comp: 'fac', round: m.round,
          h: t.has(hk) ? hk : LOWER, a: t.has(ak) ? ak : LOWER,
          names: [m.home.name, m.away.name],
          hg: s.home, ag: s.away, neutral: neutralOf(m, 'fac'), espn: m,
        });
      }
    }
  }
  games.sort((x, y) => x.date.localeCompare(y.date));
  memo = { sig, data: { games, tiers, fetchedAt } };
  return memo.data;
}

// ---------- innevarande säsong ----------

function currentSeason() {
  const D = load();
  const season = SEASON.fdcouk;
  const tier = new Map();
  for (const [k, compId] of D.teamLeague) tier.set(k, COMPETITIONS.find((c) => c.id === compId).tier);
  for (const r of D.fd.nl.rows) { tier.set(r.hk, 5); tier.set(r.ak, 5); }
  const games = [];
  for (const m of D.matches) {
    if (!m.completed || !m.score90) continue;
    const c = COMPETITIONS.find((x) => x.id === m.comp);
    const g = {
      date: m.kickoff.slice(0, 10), season, comp: m.comp, round: m.round, cup: c.type === 'cup',
      h: tier.has(m.hk) ? m.hk : LOWER, a: tier.has(m.ak) ? m.ak : LOWER,
      names: [m.home.name, m.away.name],
      hg: m.score90.home, ag: m.score90.away, neutral: neutralOf(m, m.comp), id: m.id,
    };
    // Skott och xG för kandidatjakten: ligamatcherna ur football-data.co.uk
    // och Understat (paras på hemma|borta, unikt inom en ligasäsong).
    if (c.type === 'league') {
      g.sot = sotOf(D.fd[c.id].byPair.get(`${m.hk}|${m.ak}`));
      if (c.id === 'pl') {
        const u = D.understat.byPair.get(`${m.hk}|${m.ak}`);
        g.xg = u && u.xg ? [u.xg.home, u.xg.away] : null;
      }
    }
    games.push(g);
  }
  for (const r of D.fd.nl.rows) {
    if (r.FTHG == null || !r.date) continue;
    games.push({ date: r.date, season, comp: 'nl', h: r.hk, a: r.ak, hg: r.FTHG, ag: r.FTAG, neutral: false, row: r, sot: sotOf(r) });
  }
  games.sort((x, y) => x.date.localeCompare(y.date));
  return { season, games, tier };
}

// Underlaget för en målsäsong: tidigare säsonger + målsäsongens matcher.
// Innevarande säsong läses ur ESPN/football-data enligt ovan; en avslutad
// målsäsong (kontrollen, src/check.js) ur historiken.
function seasonData(target = SEASON.fdcouk) {
  const H = history();
  if (target === SEASON.fdcouk) {
    const cur = currentSeason();
    const tiers = new Map(H.tiers);
    tiers.set(target, cur.tier);
    return { target, games: [...H.games.filter((g) => g.season < target), ...cur.games], tiers, fetchedAt: H.fetchedAt };
  }
  return { target, games: H.games.filter((g) => g.season <= target), tiers: H.tiers, fetchedAt: H.fetchedAt };
}

module.exports = { seasonData, history, neutralOf, LOWER, DIVISIONS, startYear };
