'use strict';

// Divisionsstatistik (sidan Divisioner): beskrivande statistik per division
// som kan påverka matcherna – hemmafördel, mål, halvtid, skott, hörnor, kort,
// domare, marknaden, nykomlingar, målminuter och publik – säsong för säsong
// och för de senaste avslutade säsongerna. Påverkar inte prognoserna: det som
// får styra dem prövas walk-forward först (src/candidates.js).
//
//   football-data.co.uk  fdcouk_stats_<div> (2000/01–, National League
//                        2005/06–) och årets fdcouk_<div>. Saknas statistik-
//                        cachen används fdcouk_hist_<div> (utan halvtid,
//                        hörnor, kort och domare).
//   ESPN                 espn_hist_<liga> (2021/22–2025/26) och årets
//                        spelprogram: målminuter och publik, nivå 1–4.
//
// Allt räknas på grundserien efter 90 minuter. Poängavdrag räknas inte med i
// tabellerna (de används bara för slutplacering och nykomlingar).

const { COMPETITIONS, NATIONAL_LEAGUE, SEASON } = require('../config/competitions');
const { readCache } = require('./store');

const DIVS = [...COMPETITIONS.filter((c) => c.fdcouk), NATIONAL_LEAGUE]; // nivå 1–5
const WINDOW = 10; // avslutade säsonger i fördelningarna och jämförelsen
const REF_SEASONS = 3; // domartabellen: så många avslutade säsonger + i år
const REF_MIN = 10; // minst så många matcher i divisionen för att visas
const GRID_MAX = 5; // resultatmatrisen: 5 = 5 mål eller fler
const TOTAL_MAX = 7; // målfördelningen: 7 = 7 eller fler
const MIN_BINS = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75], [76, 90]];

function startYear(code) {
  return 2000 + Number(code.slice(0, 2));
}
function label(code) {
  return `${startYear(code)}/${code.slice(2)}`;
}
const byYear = (a, b) => startYear(a) - startYear(b);

// ---------- en division: matcher per säsong ur football-data.co.uk ----------

function fdSeasons(div) {
  const stats = readCache(`fdcouk_stats_${div.fdcouk}`);
  const hist = readCache(`fdcouk_hist_${div.fdcouk}`);
  const cur = readCache(`fdcouk_${div.fdcouk}`);
  const out = new Map(); // kod → { rows, teams }
  const add = (code, rows, partial) => {
    const all = rows || [];
    const played = all.filter((r) => r.FTHG != null && r.FTAG != null && r.HomeTeam && r.AwayTeam);
    const teams = new Set();
    for (const r of all) { if (r.HomeTeam) teams.add(r.HomeTeam); if (r.AwayTeam) teams.add(r.AwayTeam); }
    if (played.length) out.set(code, { rows: played, teams, partial });
  };
  const src = stats && stats.data ? stats.data.seasons : hist && hist.data ? hist.data.seasons : {};
  for (const code of Object.keys(src).sort(byYear)) {
    if (code !== SEASON.fdcouk) add(code, src[code], false);
  }
  if (cur && cur.data) add(SEASON.fdcouk, cur.data.rows, true);
  return {
    seasons: out,
    fetchedAt: {
      stats: stats ? stats.fetchedAt : null,
      hist: stats && stats.data ? null : hist ? hist.fetchedAt : null,
      current: cur ? cur.fetchedAt : null,
    },
    full: !!(stats && stats.data),
  };
}

// ---------- sammanfattning av en mängd matcher ----------

const has = (r, ...ks) => ks.every((k) => r[k] != null);

// Marknadssnittets odds 1X2 (Avg från 2019/20, Betbrain-snittet BbAv dessförinnan,
// inget före 2005/06) → sannolikheter utan marginal (proportionellt).
function market(r) {
  const o = [r.AvgH ?? r.BbAvH, r.AvgD ?? r.BbAvD, r.AvgA ?? r.BbAvA];
  if (!o.every((x) => x > 1)) return null;
  const inv = o.map((x) => 1 / x);
  const sum = inv[0] + inv[1] + inv[2];
  return { p: inv.map((x) => x / sum), margin: sum - 1 };
}

function outcome(h, a) {
  return h > a ? 0 : h === a ? 1 : 2;
}

function summarize(rows) {
  const n = rows.length;
  if (!n) return null;
  const res = [0, 0, 0];
  let hg = 0; let ag = 0; let o25 = 0; let btts = 0; let nil = 0;
  const ht = { n: 0, g1: 0, g2: 0, lead: 0, lw: 0, ld: 0, ll: 0 };
  const sh = { n: 0, s: 0, st: 0, g: 0 };
  const co = { n: 0, c: 0 }; const fo = { n: 0, f: 0 };
  const ca = { n: 0, y: 0, yh: 0, r: 0 };
  const mk = { n: 0, margin: 0, fav: 0, ll: 0, p: [0, 0, 0] };
  const at = { n: 0, sum: 0 };
  const xg = { n: 0, x: 0, g: 0 };
  for (const r of rows) {
    const h = r.FTHG; const a = r.FTAG; const k = outcome(h, a);
    res[k]++;
    hg += h; ag += a;
    if (h + a > 2) o25++;
    if (h > 0 && a > 0) btts++;
    if (h + a === 0) nil++;
    if (has(r, 'HTHG', 'HTAG')) {
      ht.n++; ht.g1 += r.HTHG + r.HTAG; ht.g2 += h + a - r.HTHG - r.HTAG;
      const s1 = Math.sign(r.HTHG - r.HTAG); const s2 = Math.sign(h - a);
      if (s1 !== 0) { ht.lead++; if (s2 === s1) ht.lw++; else if (s2 === 0) ht.ld++; else ht.ll++; }
    }
    if (has(r, 'HS', 'AS', 'HST', 'AST') && r.HS + r.AS > 0) {
      sh.n++; sh.s += r.HS + r.AS; sh.st += r.HST + r.AST; sh.g += h + a;
    }
    if (has(r, 'HC', 'AC')) { co.n++; co.c += r.HC + r.AC; }
    if (has(r, 'HF', 'AF')) { fo.n++; fo.f += r.HF + r.AF; }
    if (has(r, 'HY', 'AY')) {
      ca.n++; ca.y += r.HY + r.AY; ca.yh += r.HY;
      ca.r += (r.HR || 0) + (r.AR || 0);
    }
    const m = market(r);
    if (m) {
      mk.n++; mk.margin += m.margin;
      mk.ll -= Math.log(m.p[k]);
      const fav = m.p.indexOf(Math.max(...m.p));
      if (fav === k) mk.fav++;
      for (let i = 0; i < 3; i++) mk.p[i] += m.p[i];
    }
    if (r.Attendance > 0) { at.n++; at.sum += r.Attendance; }
    if (has(r, 'HxG', 'AxG')) { xg.n++; xg.x += r.HxG + r.AxG; xg.g += h + a; }
  }
  return {
    n,
    home: res[0] / n, draw: res[1] / n, away: res[2] / n,
    goals: (hg + ag) / n, hg: hg / n, ag: ag / n,
    homeAdv: (hg - ag) / n,
    ppgH: (3 * res[0] + res[1]) / n, ppgA: (3 * res[2] + res[1]) / n,
    o25: o25 / n, btts: btts / n, nil: nil / n,
    ht: ht.n ? {
      n: ht.n, first: ht.g1 / ht.n, second: ht.g2 / ht.n,
      secondShare: ht.g1 + ht.g2 ? ht.g2 / (ht.g1 + ht.g2) : null,
      lead: ht.lead / ht.n,
      leadWin: ht.lead ? ht.lw / ht.lead : null, leadDraw: ht.lead ? ht.ld / ht.lead : null, leadLoss: ht.lead ? ht.ll / ht.lead : null,
    } : null,
    shots: sh.n ? { n: sh.n, shots: sh.s / sh.n, sot: sh.st / sh.n, conv: sh.st ? sh.g / sh.st : null, acc: sh.st / sh.s } : null,
    corners: co.n ? co.c / co.n : null,
    fouls: fo.n ? fo.f / fo.n : null,
    cards: ca.n ? { n: ca.n, yellow: ca.y / ca.n, red: ca.r / ca.n, homeShare: ca.y ? ca.yh / ca.y : null } : null,
    market: mk.n ? {
      n: mk.n, margin: mk.margin / mk.n, favWin: mk.fav / mk.n, logLoss: mk.ll / mk.n,
      pHome: mk.p[0] / mk.n, pDraw: mk.p[1] / mk.n, pAway: mk.p[2] / mk.n,
    } : null,
    attendance: at.n ? { n: at.n, mean: at.sum / at.n, source: 'football-data.co.uk' } : null,
    xg: xg.n ? { n: xg.n, xg: xg.x / xg.n, goalsMinusXg: (xg.g - xg.x) / xg.n } : null,
  };
}

// ---------- tabeller ----------

function table(rows) {
  const t = new Map();
  const row = (name) => {
    if (!t.has(name)) t.set(name, { team: name, p: 0, pts: 0, gf: 0, ga: 0, hp: 0, hpts: 0, ap: 0, apts: 0 });
    return t.get(name);
  };
  for (const r of rows) {
    const h = row(r.HomeTeam); const a = row(r.AwayTeam);
    const ph = r.FTHG > r.FTAG ? 3 : r.FTHG === r.FTAG ? 1 : 0;
    const pa = r.FTAG > r.FTHG ? 3 : r.FTHG === r.FTAG ? 1 : 0;
    h.p++; a.p++; h.pts += ph; a.pts += pa;
    h.gf += r.FTHG; h.ga += r.FTAG; a.gf += r.FTAG; a.ga += r.FTHG;
    h.hp++; h.hpts += ph; a.ap++; a.apts += pa;
  }
  const list = [...t.values()].sort((x, y) => (y.pts / (y.p || 1)) - (x.pts / (x.p || 1))
    || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.team.localeCompare(y.team));
  list.forEach((x, i) => { x.rank = i + 1; x.ppg = x.p ? x.pts / x.p : null; });
  return list;
}

// Jämnhet: spridningen (standardavvikelsen) i poäng per match mellan lagen.
function balance(tab) {
  const ppg = tab.filter((x) => x.p > 0).map((x) => x.ppg);
  if (ppg.length < 4) return null;
  const mean = ppg.reduce((s, x) => s + x, 0) / ppg.length;
  const sd = Math.sqrt(ppg.reduce((s, x) => s + (x - mean) ** 2, 0) / ppg.length);
  return { sd, top: Math.max(...ppg), bottom: Math.min(...ppg) };
}

// ---------- fördelningar över ett fönster av säsonger ----------

function distributions(rows) {
  const grid = Array.from({ length: GRID_MAX + 1 }, () => Array(GRID_MAX + 1).fill(0));
  const totals = Array(TOTAL_MAX + 1).fill(0);
  const htft = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const blank = () => ({ n: 0, h: 0, d: 0, g: 0 });
  const months = Array.from({ length: 12 }, blank);
  const weekdays = Array.from({ length: 7 }, blank);
  const KO = [
    { id: 'lunch', label: 'före 14.00', test: (m) => m < 14 * 60 },
    { id: 'eftermiddag', label: '14.00–16.59', test: (m) => m < 17 * 60 },
    { id: 'sen', label: '17.00–18.59', test: (m) => m < 19 * 60 },
    { id: 'kvall', label: '19.00 och senare', test: () => true },
  ];
  const kickoff = KO.map((k) => ({ id: k.id, label: k.label, ...blank() }));
  const cal = Array.from({ length: 10 }, () => ({ n: 0, p: 0, hit: 0 }));
  const put = (b, k, g) => { b.n++; if (k === 0) b.h++; if (k === 1) b.d++; b.g += g; };
  let htN = 0; let koN = 0; let calN = 0;
  for (const r of rows) {
    const h = r.FTHG; const a = r.FTAG; const k = outcome(h, a);
    grid[Math.min(h, GRID_MAX)][Math.min(a, GRID_MAX)]++;
    totals[Math.min(h + a, TOTAL_MAX)]++;
    if (has(r, 'HTHG', 'HTAG')) { htft[outcome(r.HTHG, r.HTAG)][k]++; htN++; }
    const d = new Date(`${r.date}T12:00:00Z`);
    put(months[d.getUTCMonth()], k, h + a);
    put(weekdays[d.getUTCDay()], k, h + a);
    const t = /^(\d{1,2}):(\d{2})$/.exec(r.Time || '');
    if (t) {
      const min = Number(t[1]) * 60 + Number(t[2]);
      const i = KO.findIndex((x) => x.test(min));
      put(kickoff[i], k, h + a); koN++;
    }
    const m = market(r);
    if (m) {
      calN++;
      for (let i = 0; i < 3; i++) {
        const b = cal[Math.min(9, Math.floor(m.p[i] * 10))];
        b.n++; b.p += m.p[i]; if (i === k) b.hit++;
      }
    }
  }
  const rate = (b) => ({ n: b.n, home: b.n ? b.h / b.n : null, draw: b.n ? b.d / b.n : null, goals: b.n ? b.g / b.n : null });
  return {
    n: rows.length,
    grid,
    totals,
    htft: htN ? htft : null,
    months: months.map((b, i) => ({ month: i + 1, ...rate(b) })),
    weekdays: weekdays.map((b, i) => ({ day: i, ...rate(b) })),
    kickoff: koN ? kickoff.map((b) => ({ id: b.id, label: b.label, ...rate(b) })) : null,
    calibration: calN ? {
      matches: calN,
      bins: cal.map((b, i) => ({ lo: i / 10, hi: (i + 1) / 10, n: b.n, p: b.n ? b.p / b.n : null, hit: b.n ? b.hit / b.n : null })),
    } : null,
  };
}

// ---------- domare ----------

function referees(seasons, codes) {
  const by = new Map();
  for (const code of codes) {
    for (const r of seasons.get(code).rows) {
      if (!r.Referee || !has(r, 'HY', 'AY')) continue;
      const name = r.Referee.trim().replace(/\s+/g, ' ');
      if (!by.has(name)) by.set(name, { name, n: 0, y: 0, r: 0, f: 0, fn: 0, res: [0, 0, 0], g: 0 });
      const x = by.get(name);
      x.n++; x.y += r.HY + r.AY; x.r += (r.HR || 0) + (r.AR || 0);
      if (has(r, 'HF', 'AF')) { x.f += r.HF + r.AF; x.fn++; }
      x.res[outcome(r.FTHG, r.FTAG)]++; x.g += r.FTHG + r.FTAG;
    }
  }
  const all = [...by.values()];
  if (!all.length) return null;
  const tot = all.reduce((s, x) => ({ n: s.n + x.n, y: s.y + x.y, r: s.r + x.r, h: s.h + x.res[0] }), { n: 0, y: 0, r: 0, h: 0 });
  const rows = all.filter((x) => x.n >= REF_MIN).map((x) => ({
    name: x.name, n: x.n, yellow: x.y / x.n, red: x.r / x.n, fouls: x.fn ? x.f / x.fn : null,
    home: x.res[0] / x.n, draw: x.res[1] / x.n, away: x.res[2] / x.n, goals: x.g / x.n,
  })).sort((a, b) => b.yellow + 2 * b.red - (a.yellow + 2 * a.red));
  return {
    seasons: codes.map(label), min: REF_MIN, referees: all.length,
    avg: { n: tot.n, yellow: tot.y / tot.n, red: tot.r / tot.n, home: tot.h / tot.n },
    rows,
  };
}

// ---------- nykomlingar: uppflyttade och nedflyttade lag ----------

// tiers: Map(nivå → Map(kod → { teams, table })). Uppflyttade till divisionen
// = lag som säsongen innan låg en nivå lägre; nedflyttade = en nivå högre.
// "Nästa säsong" avgörs av var laget faktiskt spelade säsongen efter.
function newcomers(div, tiers, from) {
  const here = tiers.get(div.tier);
  const there = tiers.get(div.tier + from);
  if (!here || !there) return null;
  const codes = [...here.keys()].sort(byYear);
  const where = (team, code) => {
    for (const [tier, m] of tiers) if (m.has(code) && m.get(code).teams.has(team)) return tier;
    return null;
  };
  const done = []; const current = [];
  for (let i = 1; i < codes.length; i++) {
    const code = codes[i]; const prev = codes[i - 1];
    if (startYear(code) !== startYear(prev) + 1 || !there.has(prev)) continue;
    const s = here.get(code);
    for (const row of s.table) {
      if (!there.get(prev).teams.has(row.team)) continue;
      const next = codes[i + 1] && startYear(codes[i + 1]) === startYear(code) + 1 ? where(row.team, codes[i + 1]) : undefined;
      const x = { team: row.team, season: label(code), rank: row.rank, of: s.table.length, ppg: row.ppg, p: row.p, avg: s.avgPpg, next };
      if (s.partial) current.push(x); else done.push(x);
    }
  }
  if (!done.length && !current.length) return null;
  const known = done.filter((x) => x.next !== undefined);
  const share = (f) => (known.length ? known.filter(f).length / known.length : null);
  const maxOf = Math.max(0, ...done.map((x) => x.of));
  const rankCounts = Array(maxOf).fill(0);
  for (const x of done) rankCounts[x.rank - 1]++;
  return {
    from: from > 0 ? 'lägre' : 'högre',
    fromName: (DIVS.find((d) => d.tier === div.tier + from) || {}).name || null,
    teamSeasons: done.length,
    seasons: done.length ? [done[0].season, done[done.length - 1].season] : null,
    ppg: done.length ? done.reduce((s, x) => s + x.ppg, 0) / done.length : null,
    avgPpg: done.length ? done.reduce((s, x) => s + x.avg, 0) / done.length : null,
    meanRank: done.length ? done.reduce((s, x) => s + x.rank, 0) / done.length : null,
    topHalf: done.length ? done.filter((x) => x.rank <= x.of / 2).length / done.length : null,
    rankCounts,
    next: { n: known.length, down: share((x) => x.next !== null && x.next > div.tier), up: share((x) => x.next !== null && x.next < div.tier), stayed: share((x) => x.next === div.tier), gone: share((x) => x.next === null) },
    current: current.sort((a, b) => a.rank - b.rank).map(({ team, rank, of, ppg, p }) => ({ team, rank, of, ppg, p })),
  };
}

// ---------- ESPN: målminuter och publik ----------

// "38'" → [38, 0], "90'+3'" → [90, 3]; null om okänt.
function clock(s) {
  const m = /^(\d+)'(?:\+(\d+)')?$/.exec(String(s || '').trim());
  return m ? [Number(m[1]), m[2] ? Number(m[2]) : 0] : null;
}

// Grundserien: den vanligaste "round" säsongen (play-off har egna).
function regular(list) {
  const count = new Map();
  for (const m of list) count.set(m.round, (count.get(m.round) || 0) + 1);
  const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  return main ? list.filter((m) => m.round === main[0]) : [];
}

function espnSeasons(div) {
  const out = new Map();
  const hist = readCache(`espn_hist_${div.id}`);
  if (hist && hist.data) {
    for (const code of Object.keys(hist.data.seasons).sort(byYear)) {
      if (code !== SEASON.fdcouk) out.set(code, regular(hist.data.seasons[code]));
    }
  }
  const fx = readCache(`espn_fixtures_${div.id}`);
  if (fx && fx.data) {
    const played = fx.data.matches.filter((m) => m.completed && m.score);
    out.set(SEASON.fdcouk, regular(played).map((m) => ({
      kickoff: m.kickoff, home: m.home.name, away: m.away.name, score: m.score, attendance: null,
      goals: (m.goals || []).filter((g) => !g.shootout).map((g) => [g.clock, g.teamId === m.home.espnId ? 'h' : 'a']),
    })));
  }
  return { seasons: out, fetchedAt: { hist: hist ? hist.fetchedAt : null, current: fx ? fx.fetchedAt : null } };
}

// Ställningens tecken (hemma − borta) efter en viss minut.
function stateAt(goals, upto) {
  let d = 0;
  for (const g of goals) if (g.t <= upto) d += g.side === 'h' ? 1 : -1;
  return Math.sign(d);
}

function timing(es) {
  const bins = MIN_BINS.map(([lo, hi]) => ({ lo, hi, n: 0 }));
  let stop1 = 0; let stop2 = 0; let goals = 0; let timed = 0; let matches = 0;
  const first = { n: 0, home: 0, win: 0, draw: 0, loss: 0 };
  let changed75 = 0; let changed90 = 0; let late = 0; let used = 0;
  const seasons = [];
  for (const [code, list] of es.seasons) {
    if (!list.length) continue;
    seasons.push(label(code));
    for (const m of list) {
      matches++;
      const total = m.score.home + m.score.away;
      goals += total;
      const gs = m.goals.map(([c, side]) => ({ c: clock(c), side })).filter((g) => g.c);
      // Matcher där målhändelserna inte går ihop med resultatet används inte
      // för ordningsfrågorna (först i mål, ändrat resultat).
      const ok = gs.length === total;
      for (const g of gs) {
        timed++;
        const [mm, plus] = g.c;
        if (mm === 45 && plus > 0) stop1++;
        else if (mm === 90 && plus > 0) stop2++;
        else {
          const b = bins.find((x) => mm >= x.lo && mm <= x.hi) || (mm < 1 ? bins[0] : null);
          if (b) b.n++;
        }
        if (mm >= 76) late++;
      }
      if (!ok) continue;
      used++;
      // Tidsordning: tilläggstid i första halvlek före minut 46.
      for (const g of gs) g.t = g.c[0] + (g.c[1] ? g.c[1] / 100 : 0);
      gs.sort((a, b) => a.t - b.t);
      const fin = Math.sign(m.score.home - m.score.away);
      if (gs.length) {
        first.n++;
        const s = gs[0].side === 'h' ? 1 : -1;
        if (s === 1) first.home++;
        if (fin === s) first.win++; else if (fin === 0) first.draw++; else first.loss++;
      }
      if (stateAt(gs, 75.99) !== fin) changed75++;
      if (stateAt(gs, 90) !== fin) changed90++;
    }
  }
  if (!matches) return null;
  return {
    seasons, matches, goals, timed, used,
    bins: [...bins.slice(0, 3), { lo: 45, hi: 45, stoppage: true, n: stop1 }, ...bins.slice(3), { lo: 90, hi: 90, stoppage: true, n: stop2 }],
    lateShare: timed ? late / timed : null,
    first: first.n ? { n: first.n, home: first.home / first.n, win: first.win / first.n, draw: first.draw / first.n, loss: first.loss / first.n } : null,
    changedAfter75: used ? changed75 / used : null,
    changedInStoppage: used ? changed90 / used : null,
  };
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
}

// Publik per säsong och per lag och säsong (hemmasnitt mot hemma- och
// bortapoäng per match). Årets spelprogram saknar publik.
function crowd(es) {
  const seasons = []; const teams = [];
  for (const [code, list] of es.seasons) {
    const withAtt = list.filter((m) => m.attendance > 0);
    if (!withAtt.length) continue;
    const att = withAtt.map((m) => m.attendance);
    seasons.push({ code, label: label(code), n: att.length, of: list.length, mean: att.reduce((s, x) => s + x, 0) / att.length, median: median(att) });
    const by = new Map();
    const row = (t) => { if (!by.has(t)) by.set(t, { att: [], hp: 0, hn: 0, ap: 0, an: 0 }); return by.get(t); };
    for (const m of list) {
      const ph = m.score.home > m.score.away ? 3 : m.score.home === m.score.away ? 1 : 0;
      const pa = m.score.away > m.score.home ? 3 : m.score.home === m.score.away ? 1 : 0;
      const h = row(m.home); const a = row(m.away);
      if (m.attendance > 0) h.att.push(m.attendance);
      h.hp += ph; h.hn++; a.ap += pa; a.an++;
    }
    for (const [team, x] of by) {
      if (x.att.length < 10 || !x.hn || !x.an) continue;
      teams.push({ team, season: label(code), att: x.att.reduce((s, v) => s + v, 0) / x.att.length, hp: x.hp / x.hn, ap: x.ap / x.an });
    }
  }
  if (!seasons.length) return null;
  // Samband mellan publik (log) och hemmafördel i poäng per match, lag för lag.
  let r = null;
  if (teams.length >= 20) {
    const xs = teams.map((t) => Math.log(t.att)); const ys = teams.map((t) => t.hp - t.ap);
    const mx = xs.reduce((s, v) => s + v, 0) / xs.length; const my = ys.reduce((s, v) => s + v, 0) / ys.length;
    let sxy = 0; let sxx = 0; let syy = 0;
    xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; });
    r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
  }
  return { seasons, teams, r };
}

// ---------- allt ----------

function divisionStats() {
  const fd = new Map(DIVS.map((d) => [d.id, fdSeasons(d)]));

  // Lag och tabell per nivå och säsong – för nykomlingarna.
  const tiers = new Map();
  for (const d of DIVS) {
    const m = new Map();
    for (const [code, s] of fd.get(d.id).seasons) {
      const tab = table(s.rows);
      const sum = summarize(s.rows);
      m.set(code, { teams: s.teams, table: tab, partial: s.partial, avgPpg: (sum.ppgH + sum.ppgA) / 2 });
    }
    tiers.set(d.tier, m);
  }

  const completedCodes = new Set();
  for (const d of DIVS) for (const [code, s] of fd.get(d.id).seasons) if (!s.partial) completedCodes.add(code);
  const lastDone = [...completedCodes].sort(byYear).slice(-WINDOW);

  const divisions = DIVS.map((d) => {
    const F = fd.get(d.id);
    const codes = [...F.seasons.keys()];
    const done = codes.filter((c) => !F.seasons.get(c).partial);
    const win = done.filter((c) => lastDone.includes(c));
    const winRows = win.flatMap((c) => F.seasons.get(c).rows);
    const curS = F.seasons.get(SEASON.fdcouk);
    const es = d.espn ? espnSeasons(d) : null;
    const cr = es ? crowd(es) : null;
    const crowdBy = new Map(cr ? cr.seasons.map((x) => [x.code, x]) : []);

    const seasons = codes.map((code) => {
      const s = F.seasons.get(code);
      const sum = summarize(s.rows);
      // Publik: football-data.co.uk (2000/01–2001/02) eller ESPN (2021/22–).
      if (!sum.attendance && crowdBy.has(code)) {
        const c = crowdBy.get(code);
        sum.attendance = { n: c.n, mean: c.mean, source: 'ESPN' };
      }
      return { code, label: label(code), partial: s.partial, ...sum, balance: balance(tiers.get(d.tier).get(code).table) };
    });

    const refCodes = [...done.slice(-REF_SEASONS), ...(curS ? [SEASON.fdcouk] : [])];
    const windowSum = winRows.length ? summarize(winRows) : null;
    if (windowSum && !windowSum.attendance && cr) {
      const xs = cr.seasons.filter((x) => win.includes(x.code));
      const n = xs.reduce((s, x) => s + x.n, 0);
      if (n) windowSum.attendance = { n, mean: xs.reduce((s, x) => s + x.mean * x.n, 0) / n, source: 'ESPN', seasons: xs.map((x) => x.label) };
    }
    return {
      id: d.id, name: d.name, short: d.short, tier: d.tier, inApp: d.id !== NATIONAL_LEAGUE.id,
      full: F.full,
      seasons,
      window: windowSum ? { seasons: [label(win[0]), label(win[win.length - 1])], count: win.length, ...windowSum } : null,
      current: curS ? summarize(curS.rows) : null,
      dist: winRows.length ? distributions(winRows) : null,
      referees: F.full ? referees(F.seasons, refCodes.filter((c) => F.seasons.has(c))) : null,
      promoted: newcomers(d, tiers, +1),
      relegated: newcomers(d, tiers, -1),
      timing: es ? timing(es) : null,
      crowd: cr,
      fetchedAt: { ...F.fetchedAt, espn: es ? es.fetchedAt : null },
    };
  });

  return {
    season: SEASON.label,
    window: lastDone.length ? { first: label(lastDone[0]), last: label(lastDone[lastDone.length - 1]), count: lastDone.length } : null,
    refSeasons: REF_SEASONS,
    divisions,
  };
}

module.exports = { divisionStats, summarize, table, clock };
