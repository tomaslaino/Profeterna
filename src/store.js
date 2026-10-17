'use strict';
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'data', 'cache');

// Cachepost: { fetchedAt, data, lastError?, lastAttempt? }
// Vid lyckad hämtning skrivs fetchedAt + data. Vid misslyckad behålls
// senaste lyckade data och lastError/lastAttempt uppdateras.
function readCache(id) {
  try {
    return JSON.parse(fs.readFileSync(path.join(CACHE_DIR, id + '.json'), 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(id, entry) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, id + '.json'), JSON.stringify(entry, null, 2));
}

function ageHours(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

module.exports = { readCache, writeCache, ageHours, CACHE_DIR };
