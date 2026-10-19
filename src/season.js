'use strict';

// Säsongsprognosen (sidan Tabeller → Säsongsprognos): resten av ligasäsongen
// spelas SIMS gånger med prognosmotorns egna förväntade mål för varje
// återstående match, och det som räknas är var lagen hamnar – seger i
// serien, uppflyttning, kval (playoff), Europa och nedflyttning – och hur
// många poäng de slutar på. Dessutom modellens styrka för alla lag (alla
// fem nivåerna på samma skala) och programmet framåt för varje lag.
//
// Osäkerheten i lagens styrka är med: de SIMS simuleringarna fördelas
// jämnt på prognosmotorns omskattningar med slumpvikter (samma som ger
// spannet under varje prognos), så att en säsong spelas med en och samma
// skattning av alla lag – som i verkligheten, där ett lag som är bättre än
// vi tror är det i alla sina matcher.
//
// Förenklingar (står också på sidan):
// - Lagens styrka och tabelläget (prognosens faktor) hålls fasta resten av
//   säsongen – de räknas inte om efter varje simulerad omgång.
// - Lika poäng skiljs på målskillnad, sedan gjorda mål, sedan lott (inbördes
//   möten och omspel räknas inte).
// - Playoff spelas inte – chansen gäller en playoffplats, inte att vinna
//   playoff. Europaplatser via cuperna räknas inte.
// - Poängavdrag (ESPN) dras av; nya avdrag under säsongen kan inte förutses.
//
// Slumpen är seedad med dagen, så att samma data samma dag ger samma
// prognos.

const rules = require('../config/forecast-rules');
const M = require('./model');
const { COMPETITIONS, SEASON } = require('../config/competitions');
const { load } = require('./matches');

const SIMS = 10000;
const NEXT_N = 5;
const DAY = 86400000;
const INACTIVE = new Set(['STATUS_CANCELED', 'STATUS_ABANDONED']);

// Zonerna läses ur ESPN:s tabellnoter (placering → "Promotion", "Promotion
// playoffs", "Champions League", "Relegation"), så att ändrade regler – som
// sex playofflag i Championship från 2026/27 – följer med utan kodändring.
const ZONES = [
  { key: 'cl', label: 'Champions League', short: 'CL', test: (n) => /champions league/i.test(n) },
  { key: 'promo', label: 'Upp direkt', short: 'Upp', test: (n) => /promotion/i.test(n) && !/playoff/i.test(n) },
  { key: 'playoff', label: 'Kval', short: 'Kval', test: (n) => /playoff/i.test(n) },
  { key: 'down', label: 'Åker ur', short: 'Ur', test: (n) => /relegation/i.test(n) },
];

// ctx: prognosmotorns kontext, specs/predictions: alla matcher och deras
// prognoser, sink: omskattningarnas förväntade mål per match och
// omskattningarna själva per skattningsdag (forecast.js, intervals),
// fitAt: (dag) → skattning.
function seasonForecast({ ctx, specs, predictions, sink, fitAt, now = new Date() }) {
  const t0 = Date.now();
  const D = load();
  const today = Math.floor(Date.parse(now.toISOString().slice(0, 10)) / DAY);
  const specById = new Map(specs.map((s) => [s.id, s]));
  const strength = strengthTable(ctx, D, specs, sink, fitAt);
  const divisions = [];
  COMPETITIONS.filter((c) => c.type === 'league').forEach((c, i) => {
    try {
      divisions.push(simulateDivision(c, i, { D, specById, predictions, sink, fitAt, today, now, strength }));
    } catch (err) {
      console.error(`[season] ${c.id}: ${err.message || err}`);
      divisions.push({ id: c.id, name: c.name, unknown: `simuleringen misslyckades: ${err.message || err}` });
    }
  });
  return {
    season: SEASON.label,
    rulesVersion: rules.version,
    sims: SIMS,
    samples: rules.uncertainty.samples,
    fitThrough: strength.fitThrough,
    divisions,
    strength: strength.list,
    ms: Date.now() - t0,
  };
}

// ---------- en division ----------

function simulateDivision(c, index, { D, specById, predictions, sink, fitAt, today, now, strength }) {
  const league = D.matches.filter((m) => m.comp === c.id && !INACTIVE.has(m.status));
  const st = D.standings[c.id];
  // Lagen: alla som finns i ligans spelprogram.
  const teams = new Map();
  for (const m of league) {
    for (const [k, t] of [[m.hk, m.home], [m.ak, m.away]]) {
      if (!teams.has(k)) {
        const row = st && st.byTeam.get(k);
        teams.set(k, {
          key: k, name: t.name, espnId: t.espnId,
          played: 0, points: 0, gd: 0, gf: 0,
          ded: row ? row.deductions || 0 : 0,
        });
      }
    }
  }
  const keys = [...teams.keys()];
  const idx = new Map(keys.map((k, i) => [k, i]));
  const T = keys.length;

  // Läget nu: ur ESPN:s resultat (grundserien, inga förlängningar), med
  // ESPN:s poängavdrag.
  const remaining = [];
  for (const m of league) {
    if (m.completed && m.score) {
      const h = teams.get(m.hk);
      const a = teams.get(m.ak);
      const [hg, ag] = [m.score.home, m.score.away];
      h.played++; a.played++;
      h.gf += hg; a.gf += ag; h.gd += hg - ag; a.gd += ag - hg;
      if (hg > ag) h.points += 3; else if (hg < ag) a.points += 3; else { h.points++; a.points++; }
    } else if (!m.completed) {
      remaining.push(m);
    }
  }
  for (const t of teams.values()) t.points -= t.ded;

  // Placeringarnas zoner ur ESPN:s noter.
  const zones = [{ key: 'title', label: 'Vinner serien', short: 'Vinner', ranks: [1] }];
  if (st && st.size) {
    const byRank = [...st.byTeam.values()].sort((a, b) => a.rank - b.rank);
    for (const z of ZONES) {
      const ranks = byRank.filter((r) => r.note && z.test(r.note)).map((r) => r.rank);
      if (ranks.length) zones.push({ key: z.key, label: z.label, short: z.short, ranks });
    }
  }

  const missing = remaining.filter((m) => {
    const p = predictions.get(m.id);
    return !p || p.status !== 'ok';
  });
  const base = {
    id: c.id, name: c.name, short: c.short, tier: c.tier,
    played: league.filter((m) => m.completed).length,
    remaining: remaining.length,
    zones: zones.map(({ key, label, short, ranks }) => ({ key, label, short, ranks })),
    standingsFetchedAt: st ? st.fetchedAt : null,
    fixturesFetchedAt: D.fixturesFetchedAt[c.id],
  };
  if (missing.length) {
    return { ...base, unknown: `${missing.length} av ${remaining.length} återstående matcher saknar prognos – säsongen kan inte spelas klart` };
  }

  // Varje återstående match: förväntade mål per omskattning (eller
  // prognosens egna om omskattningen saknar ett av lagen) och ρ för dagen.
  const S = Math.max(1, rules.uncertainty.samples);
  const G = rules.model.maxGoals + 1;
  const games = remaining.map((m) => {
    const p = predictions.get(m.id);
    const spec = specById.get(m.id);
    const draws = centered((sink && sink.goals.get(m.id)) || [], p.goals);
    return { h: idx.get(m.hk), a: idx.get(m.ak), base: p.goals, draws, rho: fitAt(spec.fitDay).rho };
  });
  const usedDraws = games.every((g) => g.draws.length === S);

  const rand = M.rng(rules.uncertainty.seed + today * 7 + index);
  const perSample = Math.ceil(SIMS / S);
  const sims = perSample * S;
  const pos = Array.from({ length: T }, () => new Float64Array(T));
  const finalPts = Array.from({ length: T }, () => new Int16Array(sims));
  const cdf = games.map(() => new Float64Array(G * G));
  const pts = new Int32Array(T);
  const gd = new Int32Array(T);
  const gf = new Int32Array(T);
  const tie = new Float64Array(T);
  const order = keys.map((_, i) => i);
  const start = keys.map((k) => teams.get(k));
  let sim = 0;

  for (let s = 0; s < S; s++) {
    games.forEach((g, i) => {
      const [lh, la] = g.draws[s] || g.base;
      const mx = M.scoreMatrix(lh, la, g.rho, G - 1);
      const out = cdf[i];
      let acc = 0;
      for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) { acc += mx[x][y]; out[x * G + y] = acc; }
      out[G * G - 1] = Infinity; // avrundningen får aldrig ge "inget resultat"
    });
    for (let r = 0; r < perSample; r++, sim++) {
      for (let t = 0; t < T; t++) { pts[t] = start[t].points; gd[t] = start[t].gd; gf[t] = start[t].gf; tie[t] = rand(); }
      for (let i = 0; i < games.length; i++) {
        const u = rand();
        const c2 = cdf[i];
        let lo = 0;
        let hi = c2.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (c2[mid] < u) lo = mid + 1; else hi = mid; }
        const hg = (lo / G) | 0;
        const ag = lo % G;
        const g = games[i];
        gf[g.h] += hg; gf[g.a] += ag; gd[g.h] += hg - ag; gd[g.a] += ag - hg;
        if (hg > ag) pts[g.h] += 3; else if (hg < ag) pts[g.a] += 3; else { pts[g.h]++; pts[g.a]++; }
      }
      order.sort((x, y) => pts[y] - pts[x] || gd[y] - gd[x] || gf[y] - gf[x] || tie[y] - tie[x]);
      for (let r2 = 0; r2 < T; r2++) pos[order[r2]][r2]++;
      for (let t = 0; t < T; t++) finalPts[t][sim] = pts[t];
    }
  }

  const strengthByKey = new Map(strength.list.map((x) => [x.key, x]));
  const list = keys.map((k, t) => {
    const x = teams.get(k);
    const share = Array.from(pos[t], (n) => n / sims);
    const sorted = Array.from(finalPts[t]).sort((a, b) => a - b);
    const p = {};
    for (const z of zones) p[z.key] = z.ranks.reduce((acc, r) => acc + (share[r - 1] || 0), 0);
    const meanPos = share.reduce((acc, v, r) => acc + v * (r + 1), 0);
    const sx = strengthByKey.get(k);
    return {
      key: k, name: x.name, espnId: x.espnId,
      now: { played: x.played, points: x.points, gd: x.gd, gf: x.gf, ded: x.ded },
      points: { mean: sorted.reduce((a, b) => a + b, 0) / sims, lo: Math.round(M.quantile(sorted, 0.1)), hi: Math.round(M.quantile(sorted, 0.9)) },
      pos: share,
      meanPos,
      p,
      strength: sx ? { rank: sx.rank, rating: sx.rating } : null,
      next: nextFixtures(D, k, c.id, predictions, now),
    };
  });
  list.sort((a, b) => b.points.mean - a.points.mean || a.meanPos - b.meanPos);
  for (const x of list) {
    const xs = x.next.list.filter((n) => n.p);
    x.next.xp = xs.length ? xs.reduce((acc, n) => acc + 3 * n.p[0] + n.p[1], 0) / xs.length : null;
  }
  return { ...base, sims, uncertainty: usedDraws, teams: list };
}

// Omskattningarnas förväntade mål flyttas så att deras geometriska medel är
// prognosens egna – spridningen (och att ett lag är starkare eller svagare i
// alla sina matcher i samma omskattning) behålls, men säsongen spelas runt
// samma skattning som prognoserna på sidan. Utan flytten låg de förväntade
// poängen upp till drygt en poäng från summan av matchprognoserna
// (kontroll 2026-10-18).
function centered(draws, base) {
  const ok = draws.filter(Boolean);
  if (!ok.length) return draws;
  const mean = (i) => ok.reduce((acc, d) => acc + Math.log(d[i]), 0) / ok.length;
  const shift = [Math.log(base[0]) - mean(0), Math.log(base[1]) - mean(1)];
  return draws.map((d) => (d ? [d[0] * Math.exp(shift[0]), d[1] * Math.exp(shift[1])] : d));
}

// Lagets närmaste ligamatcher med modellens sannolikheter ur lagets
// perspektiv: [vinst, oavgjort, förlust].
function nextFixtures(D, k, comp, predictions, now) {
  const from = now.getTime() - 3 * 3600000;
  const list = D.matches
    .filter((m) => m.comp === comp && !m.completed && !INACTIVE.has(m.status) && m.status !== 'STATUS_POSTPONED'
      && Date.parse(m.kickoff) >= from && (m.hk === k || m.ak === k))
    .slice(0, NEXT_N)
    .map((m) => {
      const home = m.hk === k;
      const pr = predictions.get(m.id);
      const p = pr && pr.status === 'ok' ? (home ? pr.p : [pr.p[2], pr.p[1], pr.p[0]]) : null;
      const opp = home ? m.away : m.home;
      return { id: m.id, date: m.kickoff, home, opponent: opp.name, abbr: opp.abbr || null, p };
    });
  return { n: NEXT_N, list };
}

// ---------- styrkan: alla lag på samma skala ----------

// Modellens styrka för alla lag i nivå 1–4: förväntade mål för och emot mot
// ett genomsnittligt lag i Premier League på neutral plan, med den senaste
// skattningen (samma som ger prognoserna för kommande matcher). Spannet för
// placeringen kommer ur omskattningarna med slumpvikter. National League
// skattas i modellen men visas inte på sajten.
function strengthTable(ctx, D, specs, sink, fitAt) {
  const future = specs.filter((s) => !s.completed);
  const day = future.length ? Math.max(...future.map((s) => s.fitDay)) : Math.max(...specs.map((s) => s.fitDay));
  const fit = fitAt(day);
  const names = new Map();
  for (const [k, t] of D.espnTeams) names.set(k, t.name);
  const tierKeys = [...ctx.tier].filter(([k, t]) => t <= 4 && fit.teams.has(k) && !fit.teams.get(k).degenerate && fit.teams.get(k).weight >= rules.model.minEffectiveMatches);
  const top = tierKeys.filter(([, t]) => t === 1).map(([k]) => k);
  const rate = (f) => {
    const n = top.filter((k) => f.A.has(k)).length;
    if (!n) return null;
    const a1 = Math.exp(top.reduce((acc, k) => acc + (f.A.has(k) ? Math.log(f.A.get(k)) : 0), 0) / n);
    const b1 = Math.exp(top.reduce((acc, k) => acc + (f.B.has(k) ? Math.log(f.B.get(k)) : 0), 0) / n);
    const out = new Map();
    for (const [k] of tierKeys) if (f.A.has(k)) out.set(k, { gf: f.A.get(k) * b1, ga: a1 * f.B.get(k) });
    return out;
  };
  const r0 = rate(fit);
  if (!r0) return { list: [], fitThrough: fit.through };
  const ranked = (m) => [...m].map(([k, v]) => [k, v.gf - v.ga]).sort((a, b) => b[1] - a[1]).map(([k], i) => [k, i + 1]);
  // Placeringen i varje omskattning (samma skattningsdag).
  const boots = (sink && sink.fits.get(day)) || [];
  const rankDraws = new Map(tierKeys.map(([k]) => [k, []]));
  for (const f of boots) {
    const r = rate(f);
    if (!r) continue;
    for (const [k, rk] of ranked(r)) rankDraws.get(k).push(rk);
  }
  const rankOf = new Map(ranked(r0));
  const list = tierKeys.filter(([k]) => r0.has(k)).map(([k, tier]) => {
    const v = r0.get(k);
    const ds = rankDraws.get(k).sort((a, b) => a - b);
    return {
      key: k,
      name: names.get(k) || k,
      tier,
      division: (COMPETITIONS.find((c) => c.tier === tier) || {}).short,
      gf: v.gf,
      ga: v.ga,
      rating: v.gf - v.ga,
      rank: rankOf.get(k),
      range: ds.length >= boots.length / 2 && ds.length ? [M.quantile(ds, 0.1), M.quantile(ds, 0.9)].map(Math.round) : null,
      matches: Math.round(fit.teams.get(k).weight * 10) / 10,
    };
  }).sort((a, b) => a.rank - b.rank);
  return { list, fitThrough: fit.through, teams: list.length };
}

module.exports = { seasonForecast, SIMS };
