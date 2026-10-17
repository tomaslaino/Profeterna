'use strict';
const { SOURCES } = require('./sources');
const { readCache, writeCache, ageHours } = require('./store');

const RETRY_AFTER_ERROR_HOURS = 0.5;

// Uppdaterar alla källor vars cache är äldre än maxAge (eller alla, med
// force). Vid fel behålls senaste lyckade data i cachen med sitt datum;
// felet sparas i posten och visas i källtabellen. Källor med stage: 2 läser
// andra källors cache och körs därför efter de övriga.
async function refreshAll({ force = false, only = null } = {}) {
  const selected = only ? SOURCES.filter((s) => only.includes(s.id)) : SOURCES;
  const results = [];
  for (const stage of [1, 2]) {
    await Promise.all(selected.filter((s) => (s.stage || 1) === stage)
      .map((src) => refreshOne(src, force).then((r) => results.push(r))));
  }
  return results;
}

async function refreshOne(src, force) {
  const cached = readCache(src.id);
  const stale = !cached || !cached.fetchedAt || ageHours(cached.fetchedAt) > src.maxAgeHours;
  const errRetry = cached && cached.lastError && ageHours(cached.lastAttempt) > RETRY_AFTER_ERROR_HOURS;
  if (!force && !stale && !errRetry) {
    return { id: src.id, action: 'cache', fetchedAt: cached.fetchedAt };
  }
  try {
    const data = await src.fetch();
    writeCache(src.id, { fetchedAt: new Date().toISOString(), data });
    return { id: src.id, action: 'fetched' };
  } catch (err) {
    const msg = String(err.message || err);
    writeCache(src.id, {
      fetchedAt: cached ? cached.fetchedAt : null,
      data: cached ? cached.data : null,
      lastError: msg,
      lastAttempt: new Date().toISOString(),
    });
    console.error(`[refresh] ${src.id}: ${msg}`);
    return { id: src.id, action: 'error', error: msg };
  }
}

module.exports = { refreshAll };
