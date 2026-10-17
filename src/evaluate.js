'use strict';

// ============================================================================
// Utvärdering mot facit (fas 3). För varje spelad match med en rad i
// journalen räknas den sista raden före avspark (src/journal.js) mot
// ställningen efter 90 minuter. Okänd ställning efter 90 minuter = okänt –
// matchen utvärderas inte.
//
//   Brier (summan av kvadratfelen över 1/X/2, 0–2) och log-poäng (−ln p för
//   utfallet) per prognos och i snitt, mot baslinjerna (a), (b) och (c) på
//   SAMMA matcher – och för ligamatcherna mot Betfair Exchange vid stängning
//   (marknaden vid avspark, tuffaste referensen). Samma mått och bootstrap-
//   intervall som kontrollen mot förra säsongen (src/check.js).
//   Kalibrering: alla tre utfallen per match i korgar om tio procentenheter
//   – sa modellen 60 %, blev det så i 60 % av fallen?
//   Att gå vidare (cupmatcher som avgörs i en match) mot vem som gick vidare,
//   med slantsingling som jämförelse. Dubbelmöten (EFL-cupens semifinaler)
//   utvärderas inte än: hur ESPN markerar vinnaren av ett dubbelmöte är inte
//   kontrollerat.
//   Sekundärt: teoretisk avkastning på modellens värdespel mot marknadens
//   odds i raden – 1 insatt på varje utfall där p · odds > 1.
//   Allt nedbrutet per tävling och per regelversion.
//
// Litet underlag visas som litet: snitt, skillnader och avkastning visas
// först från MIN_MATCHES matcher (MIN_BETS spel), och en kalibreringskorg
// får en frekvens först från MIN_BIN prognoser. Före dess står antalet och
// "för få" – hellre det än falsk precision.
// ============================================================================

const { COMPETITIONS } = require('../config/competitions');
const { compare, outcome, logLoss, brier } = require('./check');
const { byMatch, counted, HORIZON_DAYS } = require('./journal');
const { cupRule } = require('./forecast');
const { load } = require('./matches');

const MIN_MATCHES = 30;
const MIN_BIN = 10;
const MIN_BETS = 30;
const LIST_N = 30; // senast utvärderade matcher i fliken
const LATEST_N = 30; // senaste journalraderna i fliken

const BASELINES = [
  { key: 'market', label: '(c) Marknaden' },
  { key: 'closing', label: 'Betfair Exchange, stängning' },
  { key: 'season', label: '(b) Säsongens mål' },
  { key: 'naive', label: '(a) Naiv' },
];

// journal = readJournal(), matches = matchlistan (allMatches), predictions =
// Map(id → dagens prognos; för spelade matcher den återskapade). Ger
// rapporten till fliken Utvärdering och journalinfo per match till matchvyn.
function evaluate(journal, matches, predictions) {
  const D = load();
  const rowsBy = byMatch(journal.rows);
  const firstAt = minOf(journal.rows.map((r) => r.loggedAt));
  const lastAt = maxOf(journal.rows.map((r) => r.loggedAt));
  const perMatch = new Map();
  const scored = [];
  const advance = [];
  const counts = { played: 0, evaluated: 0, noScore: 0, modelUnknown: 0, lateOnly: 0, missed: 0, pending: 0 };
  let next = null;

  for (const m of matches) {
    const list = rowsBy.get(m.id);
    if (!list) {
      // Spelad efter att journalen startade men aldrig loggad – en lucka.
      if (m.completed && firstAt && m.kickoff > firstAt) counts.missed++;
      continue;
    }
    const { row, after } = counted(list, m.kickoff);
    const info = { rows: list.length, after, latestAt: list[list.length - 1].loggedAt, counted: null };
    perMatch.set(m.id, info);
    if (!m.completed) {
      counts.pending++;
      if (!next || m.kickoff < next.kickoff) next = { id: m.id, comp: m.comp, kickoff: m.kickoff, home: m.home, away: m.away };
      continue;
    }
    if (!row) { counts.lateOnly++; continue; }
    counts.played++;
    info.counted = row;
    if (!m.score90) { counts.noScore++; continue; }
    if (row.status !== 'ok') { counts.modelUnknown++; continue; }

    const o = outcome(m.score90);
    const pred = predictions.get(m.id);
    const closing = pred && pred.baselines && pred.baselines.closing ? pred.baselines.closing.p : null;
    const r = {
      id: m.id, comp: m.comp, kickoff: m.kickoff, home: m.home, away: m.away, score90: m.score90,
      version: row.rulesVersion, loggedAt: row.loggedAt, o,
      model: row.p, naive: row.naive, season: row.season, market: row.market ? row.market.p : null, closing,
      odds: row.market ? row.market.odds : null,
    };
    scored.push(r);
    info.outcome = o;
    info.scores = scoreSet(r);

    const raw = D.byId.get(m.id);
    const rule = raw && cupRule(m.comp, raw.round);
    if (row.advance && rule && !rule.twoLeg && raw.winner) {
      const y = raw.winner === 'home' ? 1 : 0;
      advance.push({ comp: m.comp, version: row.rulesVersion, p: row.advance[0], y });
      info.advanced = raw.winner;
    }
  }
  counts.evaluated = scored.length;

  const versions = [...new Set(scored.map((r) => r.version))].sort();
  const report = {
    minMatches: MIN_MATCHES,
    minBin: MIN_BIN,
    minBets: MIN_BETS,
    counts,
    next,
    overall: group(scored),
    byComp: COMPETITIONS.map((c) => ({ comp: c.id, name: c.name, ...group(scored.filter((r) => r.comp === c.id)) })),
    byVersion: versions.map((v) => ({ version: v, ...group(scored.filter((r) => r.version === v)) })),
    calibration: calibration(scored),
    advance: {
      all: advanceSummary(advance),
      byComp: COMPETITIONS.filter((c) => c.type === 'cup').map((c) => ({ comp: c.id, name: c.name, ...advanceSummary(advance.filter((a) => a.comp === c.id)) })),
    },
    recent: [...scored].sort((a, b) => b.kickoff.localeCompare(a.kickoff)).slice(0, LIST_N).map((r) => ({
      id: r.id, comp: r.comp, kickoff: r.kickoff, home: r.home, away: r.away, score90: r.score90,
      loggedAt: r.loggedAt, version: r.version, p: r.model, o: r.o,
      logLoss: logLoss(r.model, r.o), market: r.market ? logLoss(r.market, r.o) : null,
    })),
    journal: {
      rows: journal.rows.length,
      matches: rowsBy.size,
      invalid: journal.invalid,
      files: journal.files.map((f) => ({ name: f.name, rows: f.rows, bytes: f.bytes })),
      firstLoggedAt: firstAt,
      lastLoggedAt: lastAt,
      horizonDays: HORIZON_DAYS,
      latest: [...journal.rows].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)).slice(0, LATEST_N).map((r) => ({
        loggedAt: r.loggedAt, id: r.id, comp: r.comp, kickoff: r.kickoff, home: r.home, away: r.away,
        rulesVersion: r.rulesVersion, status: r.status, p: r.p || null,
        market: r.market ? { p: r.market.p, source: r.market.source, kind: r.market.kind } : null,
      })),
    },
  };
  return { report, perMatch };
}

// Poäng för en utvärderad match: modellen och varje baslinje som fanns.
function scoreSet(r) {
  const out = {};
  for (const key of ['model', ...BASELINES.map((b) => b.key)]) {
    if (r[key]) out[key] = { p: r[key], logLoss: logLoss(r[key], r.o), brier: brier(r[key], r.o) };
  }
  return out;
}

// Snitt för modellen, jämförelse med varje baslinje på samma matcher och
// värdespelen – för en grupp matcher (alla, en tävling, en regelversion).
function group(rs) {
  return {
    n: rs.length,
    model: rs.length >= MIN_MATCHES
      ? { logLoss: mean(rs.map((r) => logLoss(r.model, r.o))), brier: mean(rs.map((r) => brier(r.model, r.o))) }
      : null,
    vs: BASELINES.map((b) => {
      const n = rs.filter((r) => r[b.key]).length;
      if (n < MIN_MATCHES) return { key: b.key, label: b.label, n };
      return { key: b.key, ...compare(rs, (r) => r[b.key], b.label) };
    }),
    value: valueBets(rs),
  };
}

// Kalibrering: varje match ger tre prognoser (1, X, 2) med utfall 0/1.
function calibration(rs) {
  const bins = Array.from({ length: 10 }, (_, i) => ({ lo: i / 10, hi: (i + 1) / 10, n: 0, sum: 0, hits: 0 }));
  for (const r of rs) {
    for (let k = 0; k < 3; k++) {
      const b = bins[Math.min(9, Math.floor(r.model[k] * 10))];
      b.n++;
      b.sum += r.model[k];
      if (r.o === k) b.hits++;
    }
  }
  return {
    forecasts: rs.length * 3,
    bins: bins.map((b) => ({
      lo: b.lo, hi: b.hi, n: b.n,
      meanP: b.n ? b.sum / b.n : null,
      freq: b.n >= MIN_BIN ? b.hits / b.n : null,
      ci: b.n >= MIN_BIN ? wilson(b.hits, b.n) : null,
    })),
  };
}

// 1 insatt på varje utfall där modellens sannolikhet gånger marknadens odds
// (oddsen i journalraden) är större än 1.
function valueBets(rs) {
  let bets = 0;
  let wins = 0;
  let back = 0;
  let matches = 0;
  for (const r of rs) {
    if (!r.odds) continue;
    matches++;
    for (let k = 0; k < 3; k++) {
      if (!(r.model[k] * r.odds[k] > 1)) continue;
      bets++;
      if (r.o === k) { wins++; back += r.odds[k]; }
    }
  }
  return { matches, bets, wins, profitPer100: bets >= MIN_BETS ? ((back - bets) / bets) * 100 : null };
}

function advanceSummary(list) {
  const n = list.length;
  if (n < MIN_MATCHES) return { n };
  return {
    n,
    logLoss: mean(list.map((a) => -Math.log(Math.max(a.y ? a.p : 1 - a.p, 1e-12)))),
    brier: mean(list.map((a) => (a.p - a.y) ** 2)),
    coin: { logLoss: Math.log(2), brier: 0.25 },
  };
}

// Wilsons 95 %-intervall för en andel.
function wilson(h, n, z = 1.96) {
  const p = h / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const w = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - w), Math.min(1, c + w)];
}

function mean(xs) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
}

function minOf(xs) {
  return xs.length ? xs.reduce((a, b) => (b < a ? b : a)) : null;
}

function maxOf(xs) {
  return xs.length ? xs.reduce((a, b) => (b > a ? b : a)) : null;
}

module.exports = { evaluate, MIN_MATCHES };
