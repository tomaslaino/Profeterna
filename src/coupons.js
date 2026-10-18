'use strict';

// Kupongerna: matcherna som gänget valt ut för en omgång, med ett tecken per
// match (1, X, 2 eller en gardering som 1X). En kupong är en fil i
// data/kuponger/, skapad på sidan (Kupong → Ny kupong) och sparad på GitHub
// med en commit – git-historiken visar då när kupongen lades. Bygget läser
// filerna och skriver data/kuponger.json; rättningen mot resultaten (och
// liveställningen från ESPN) görs på sidan.
//
//   data/kuponger/2026-10-17.json
//   {
//     "namn": "Omgång 9",                      (valfritt)
//     "skapad": "2026-10-16T18:20:11.000Z",
//     "matcher": [
//       { "id": "401879263", "match": "AFC Bournemouth – Sunderland", "tecken": "1" },
//       { "id": "401879260", "match": "Leeds United – Manchester United", "tecken": "X2",
//         "kommentar": "Teijder vägrade tro på United" }
//     ]
//   }
//
// "match" är bara till för den som läser filen; det är id (ESPN:s matchid)
// som räknas. "kommentar" är gängets valfria anteckning om matchen – den följer
// med till historiken och AI:ns kommentar (src/history.js). En trasig fil
// stoppar inte bygget – den visas som fel.

const fs = require('fs');
const path = require('path');

const COUPON_DIR = process.env.KUPONG_DIR || path.join(__dirname, '..', 'data', 'kuponger');

// Repot som kupongerna sparas i (knappen Spara på GitHub). På GitHub Actions
// finns det i GITHUB_REPOSITORY.
const REPO = process.env.GITHUB_REPOSITORY || 'tomaslaino/Profeterna';
const BRANCH = 'main';
// Så många tecken får en anteckning om en match vara.
const NOTE_MAX = 140;

// Tecknen skrivs alltid i ordningen 1, X, 2.
function normSign(s) {
  const t = String(s == null ? '' : s).toUpperCase().replace(/[^12X]/g, '');
  const out = ['1', 'X', '2'].filter((c) => t.includes(c)).join('');
  return out || null;
}

function parseCoupon(id, raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { coupon: null, errors: ['inte ett JSON-objekt'] };
  const list = Array.isArray(raw.matcher) ? raw.matcher : [];
  if (!list.length) errors.push('inga matcher');
  const seen = new Set();
  const matches = [];
  for (const [i, m] of list.entries()) {
    const mid = m && m.id != null ? String(m.id).trim() : '';
    const sign = normSign(m && m.tecken);
    if (!/^\d+$/.test(mid)) { errors.push(`match ${i + 1}: id saknas`); continue; }
    if (!sign) { errors.push(`match ${i + 1}: tecken saknas`); continue; }
    if (seen.has(mid)) { errors.push(`match ${i + 1}: finns redan på kupongen`); continue; }
    seen.add(mid);
    const note = m.kommentar ? String(m.kommentar).trim().slice(0, NOTE_MAX) : '';
    matches.push({ id: mid, sign, label: m.match ? String(m.match) : null, ...(note ? { note } : {}) });
  }
  const created = raw.skapad && !Number.isNaN(Date.parse(raw.skapad)) ? new Date(raw.skapad).toISOString() : null;
  return {
    coupon: matches.length ? { id, name: raw.namn ? String(raw.namn).slice(0, 60) : null, created, matches } : null,
    errors,
  };
}

function readCoupons(dir = COUPON_DIR) {
  const coupons = [];
  const errors = [];
  if (!fs.existsSync(dir)) return { coupons, errors };
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const id = f.replace(/\.json$/, '');
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    } catch (err) {
      errors.push({ file: f, errors: [`kan inte läsas: ${err.message}`] });
      continue;
    }
    const r = parseCoupon(id, raw);
    if (r.coupon) coupons.push(r.coupon);
    if (r.errors.length) errors.push({ file: f, errors: r.errors });
  }
  return { coupons, errors };
}

module.exports = { readCoupons, parseCoupon, normSign, COUPON_DIR, REPO, BRANCH, NOTE_MAX };
