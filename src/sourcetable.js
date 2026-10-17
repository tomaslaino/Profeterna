'use strict';

// Källtabellen: status per källa (färsk / gammal / fel / okänt) och en
// täckningsmatris datatyp × tävling. Det som saknas skrivs ut med orsak.
//
// Statusen räknas här vid bygget, men sidan räknar om den i webbläsaren ur
// fetchedAt och staleAfterHours: stannar den schemalagda hämtningen ska
// sidan visa "gammal", inte fortsätta visa byggets "färsk".

const { COMPETITIONS } = require('../config/competitions');
const { SOURCES } = require('./sources');
const { readCache, ageHours } = require('./store');
const { unmappedNames } = require('./matches');

const KINDS = [
  { id: 'fixtures', label: 'Spelprogram och resultat' },
  { id: 'table', label: 'Tabell' },
  { id: 'stats', label: 'Skott' },
  { id: 'xg', label: 'xG' },
  { id: 'odds', label: 'Odds' },
  { id: 'squad', label: 'Skador och avstängningar' },
  { id: 'history', label: 'Tidigare säsonger' },
];

// Orsak när en cell saknar källa.
const GAPS = {
  table: { cup: 'ej tillämpligt' },
  stats: { cup: 'ligadata används' },
  xg: { cup: 'ligadata används' },
  squad: { default: 'ingen fri källa' },
  history: { cup: 'hämtas inte' },
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
    // omgången lottats) är inte "färsk" data – den är okänd.
    let status;
    if (!has || (summary && summary.n === 0)) status = 'okänt';
    else if (c.lastError) status = 'fel';
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
      empty: !has || !!(summary && summary.n === 0),
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
      if (srcs.length) return { comp: c.id, sourceIds: srcs.map((r) => r.id) };
      const gap = GAPS[k.id] || {};
      return { comp: c.id, sourceIds: [], gap: gap[c.type] || gap.default || 'saknas' };
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
    coverage: coverage(rows),
    competitions: COMPETITIONS.map((c) => ({ id: c.id, name: c.name, short: c.short })),
    unmapped: unmappedNames(),
  };
}

module.exports = { sourceReport };
