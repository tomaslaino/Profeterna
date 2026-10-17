'use strict';

// Lagnamn mellan källor. ESPN är kanonisk; andra källors namn översätts via
// den uttryckliga aliastabellen (config/team-aliases.js) och jämförs efter
// normalisering. Ingen gissande matchning – det som inte går att mappa
// rapporteras som omappat.

const { ALIASES } = require('../config/team-aliases');

function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Nyckel för ett namn från en icke-ESPN-källa.
function keyOf(name) {
  return norm(ALIASES[name] || name);
}

// Nyckel för ett ESPN-namn (aliasen gäller inte ESPN:s egna namn).
function espnKey(name) {
  return norm(name);
}

module.exports = { norm, keyOf, espnKey };
