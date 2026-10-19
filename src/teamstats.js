'use strict';

// Lagstatistik per division (fliken Lag på sidan Statistik): tabellen ur
// ESPN och, ur årets football-data.co.uk-fil, xG, skott, hörnor, kort och
// marknaden – stängningsoddsens förväntade poäng och vad ett spel på laget
// hade gett. Motståndets styrka hittills kommer ur prognosmotorn.
// Beskrivande; inget här styr prognoserna.
//
// football-data.co.uk släpar ofta efter tabellen med en omgång. Tabellens
// kolumner (matcher, poäng, mål) är därför ESPN:s, och allt som räknas ur
// football-data.co.uk har ett eget antal matcher (n) och visas per match
// eller som skillnad inom samma matcher – aldrig blandat med tabellen.
// Saknas ESPN:s tabell räknas den ur football-data.co.uk (utan poängavdrag).
// Sidorna visar nivå 1–4, som prognosmotorn; National League är inte med.

const { COMPETITIONS, SEASON } = require('../config/competitions');
const { readCache } = require('./store');
const { keyOf, espnKey } = require('./teams');

const DIVS = COMPETITIONS.filter((c) => c.fdcouk);

const fin = (x) => typeof x === 'number' && Number.isFinite(x);
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;

// Marknadens sannolikheter ur stängningsoddsen (bookmakernas snitt) med
// marginalen bortdragen proportionellt. Saknas stängningen används öppningen.
function market(r) {
  const close = [r.AvgCH, r.AvgCD, r.AvgCA];
  const open = [r.AvgH, r.AvgD, r.AvgA];
  const odds = close.every((x) => fin(x) && x > 1) ? close : open.every((x) => fin(x) && x > 1) ? open : null;
  if (!odds) return null;
  const inv = odds.map((x) => 1 / x);
  const sum = inv[0] + inv[1] + inv[2];
  return { p: inv.map((x) => x / sum), odds };
}

function blank(name) {
  return {
    name,
    n: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, fts: 0, o25: 0, btts: 0,
    xg: { n: 0, f: 0, a: 0, gf: 0, ga: 0 },
    sh: { n: 0, f: 0, a: 0, of: 0, oa: 0 },
    cor: { n: 0, f: 0, a: 0 },
    fouls: { n: 0, f: 0, a: 0 },
    cards: { n: 0, y: 0, r: 0 },
    mkt: { n: 0, xp: 0, pts: 0, ret: 0, fav: 0 },
    opp: { n: 0, sum: 0 },
  };
}

// En match ur lagets synvinkel. s = 'H' eller 'A'.
function add(e, r, s, strengthOf, oppKey) {
  const H = s === 'H';
  const gf = H ? r.FTHG : r.FTAG;
  const ga = H ? r.FTAG : r.FTHG;
  e.n++;
  if (gf > ga) e.w++; else if (gf === ga) e.d++; else e.l++;
  e.gf += gf;
  e.ga += ga;
  if (ga === 0) e.cs++;
  if (gf === 0) e.fts++;
  if (gf + ga > 2) e.o25++;
  if (gf > 0 && ga > 0) e.btts++;
  const own = (h, a) => (H ? r[h] : r[a]);
  const opp = (h, a) => (H ? r[a] : r[h]);
  if (fin(r.HxG) && fin(r.AxG)) {
    e.xg.n++;
    e.xg.f += own('HxG', 'AxG');
    e.xg.a += opp('HxG', 'AxG');
    e.xg.gf += gf;
    e.xg.ga += ga;
  }
  if (fin(r.HS) && fin(r.AS) && fin(r.HST) && fin(r.AST)) {
    e.sh.n++;
    e.sh.f += own('HS', 'AS');
    e.sh.a += opp('HS', 'AS');
    e.sh.of += own('HST', 'AST');
    e.sh.oa += opp('HST', 'AST');
  }
  if (fin(r.HC) && fin(r.AC)) {
    e.cor.n++;
    e.cor.f += own('HC', 'AC');
    e.cor.a += opp('HC', 'AC');
  }
  if (fin(r.HF) && fin(r.AF)) {
    e.fouls.n++;
    e.fouls.f += own('HF', 'AF');
    e.fouls.a += opp('HF', 'AF');
  }
  if (fin(r.HY) && fin(r.HR) && fin(r.AY) && fin(r.AR)) {
    e.cards.n++;
    e.cards.y += own('HY', 'AY');
    e.cards.r += own('HR', 'AR');
  }
  const m = market(r);
  if (m) {
    const i = H ? 0 : 2;
    const j = H ? 2 : 0;
    e.mkt.n++;
    e.mkt.xp += 3 * m.p[i] + m.p[1];
    e.mkt.pts += gf > ga ? 3 : gf === ga ? 1 : 0;
    // En krona på laget att vinna, till stängningsoddset.
    if (gf > ga) e.mkt.ret += m.odds[i];
    if (m.p[i] > m.p[j]) e.mkt.fav++;
  }
  const os = strengthOf(oppKey);
  if (os != null) {
    e.opp.n++;
    e.opp.sum += os;
  }
}

function divisionTeams(div, season) {
  const cur = readCache(`fdcouk_${div.fdcouk}`);
  if (!cur || !cur.data || !Array.isArray(cur.data.rows)) {
    return { comp: div.id, unknown: true, reason: 'Ingen matchstatistik hämtad än för divisionen.' };
  }
  const strength = new Map(((season && season.strength) || []).map((t) => [t.key, t.rating]));
  const strengthOf = (k) => (strength.has(k) ? strength.get(k) : null);

  const byKey = new Map();
  const get = (name) => {
    const k = keyOf(name);
    if (!byKey.has(k)) byKey.set(k, blank(name));
    return [k, byKey.get(k)];
  };
  const rows = cur.data.rows.filter((r) => fin(r.FTHG) && fin(r.FTAG));
  for (const r of rows) {
    const [hk, h] = get(r.HomeTeam);
    const [ak, a] = get(r.AwayTeam);
    add(h, r, 'H', strengthOf, ak);
    add(a, r, 'A', strengthOf, hk);
  }

  // Tabellen: ESPN för de fyra ligorna, annars ur football-data.co.uk.
  const st = div.espn ? readCache(`espn_standings_${div.id}`) : null;
  const espnRows = st && st.data ? st.data.rows : null;
  let teams;
  const unmapped = [];
  if (espnRows) {
    const seen = new Set();
    teams = espnRows.map((x) => {
      const k = espnKey(x.name);
      seen.add(k);
      return {
        key: k,
        name: x.name,
        espnId: String(x.espnId),
        table: { rank: x.rank, m: x.played, w: x.won, d: x.drawn, l: x.lost, gf: x.gf, ga: x.ga, gd: x.gd, pts: x.points, ded: x.deductions || 0, note: x.note || null },
        e: byKey.get(k) || null,
      };
    });
    for (const [k, e] of byKey) if (!seen.has(k)) unmapped.push(e.name);
  } else {
    teams = [...byKey.entries()].map(([k, e]) => ({
      key: k,
      name: e.name,
      espnId: null,
      table: { m: e.n, w: e.w, d: e.d, l: e.l, gf: e.gf, ga: e.ga, gd: e.gf - e.ga, pts: 3 * e.w + e.d, ded: 0, note: null },
      e,
    }))
      .sort((x, y) => y.table.pts - x.table.pts || y.table.gd - x.table.gd || y.table.gf - x.table.gf || x.name.localeCompare(y.name));
    teams.forEach((t, i) => { t.table.rank = i + 1; });
  }

  // Motståndets styrka hittills, mot vad ett lag i divisionen möter i snitt
  // (alla andra lag en gång): + = tuffare program än snittet.
  const ratings = teams.map((t) => strengthOf(t.key));
  const known = ratings.filter((x) => x != null);
  const total = known.reduce((s, x) => s + x, 0);

  const out = teams.map((t, i) => {
    const e = t.e;
    const own = ratings[i];
    const expOpp = own != null && known.length > 1 ? (total - own) / (known.length - 1) : null;
    return {
      key: t.key,
      name: t.name,
      espnId: t.espnId,
      ...t.table,
      fd: e ? {
        n: e.n, w: e.w, d: e.d, l: e.l, gf: e.gf, ga: e.ga,
        cs: e.cs, fts: e.fts, o25: e.o25, btts: e.btts,
        xg: e.xg.n ? { n: e.xg.n, f: r2(e.xg.f), a: r2(e.xg.a), gf: e.xg.gf, ga: e.xg.ga } : null,
        sh: e.sh.n ? e.sh : null,
        cor: e.cor.n ? e.cor : null,
        fouls: e.fouls.n ? e.fouls : null,
        cards: e.cards.n ? e.cards : null,
        mkt: e.mkt.n ? { n: e.mkt.n, xp: r2(e.mkt.xp), pts: e.mkt.pts, ret: r2(e.mkt.ret), fav: e.mkt.fav } : null,
        opp: e.opp.n && expOpp != null ? r3(e.opp.sum / e.opp.n - expOpp) : null,
      } : null,
    };
  });

  return {
    comp: div.id,
    name: div.name,
    season: SEASON.label,
    unknown: false,
    hasXg: out.some((t) => t.fd && t.fd.xg),
    source: {
      table: espnRows ? { provider: 'ESPN', fetchedAt: st.fetchedAt } : { provider: 'football-data.co.uk', fetchedAt: cur.fetchedAt },
      stats: { provider: 'football-data.co.uk', fetchedAt: cur.fetchedAt, last: cur.data.lastMatchDate || null, matches: rows.length, url: cur.data.sourceUrl || null },
      strength: season && season.fitThrough ? { fitThrough: season.fitThrough } : null,
    },
    unmapped,
    teams: out,
  };
}

// Filerna bygget skriver: teams/<division>.json för nivå 1–4.
function teamFiles(season) {
  return DIVS.map((d) => ({ path: `teams/${d.id}.json`, data: divisionTeams(d, season) }));
}

module.exports = { teamFiles, divisionTeams };
