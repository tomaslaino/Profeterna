'use strict';

// Speltid per spelare och ligamatch ur ESPN:s matchrapporter
// (/summary?event=<id>, samma öppna API som spelprogrammet). Verifierat
// 2026-10-19 för eng.1–eng.4, säsong 2026: rapporten har båda lagens
// startelvor (alltid 11), avbytarna med bytesminut (tilläggstid som "90'+3'")
// och röda kort (även andra gula), med samma spelar-id som trupperna
// (src/fetchers/espnplayers.js). Stickprov: Birmingham, AFC Wimbledon och
// Accrington – matcher per spelare ur rapporterna var desamma som i truppen
// för alla 84 spelare. Arsenal och Coventry: minuterna högst 6 från FPL:s per
// spelare, 0,4 % över totalt.
//
// Minuter = från in (0 eller bytesminuten) till ut (full tid, bytesminuten
// eller röda kortet). Tilläggstid räknas inte (90'+3' = 90) och förlängning
// ger 120. Den som byts in i tilläggstiden får 1 minut, som hos FPL.
//
// En rapport är ~400 kB, men en spelad match ändras inte: den hämtas en gång
// och sparas kompakt som { k: avspark, t: { lag-id: { spelar-id: minuter } } }.
// Bara nya matcher hämtas, högst MAX_NEW per körning. En match som inte gick
// att hämta eller saknar startelvor prövas igen vid nästa hämtning.

const { getJson, mapLimit } = require('./http');

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const MAX_NEW = 250;
const CONCURRENCY = 3;
// Så många fel i rad utan en enda lyckad hämtning: ESPN svarar inte, sluta
// försöka för den här gången.
const GIVE_UP_AFTER = 5;

// events: spelade matcher [{ id, kickoff, status }]; previous: förra
// hämtningens data (eller null).
async function fetchMinutes(slug, events, previous) {
  const old = (previous && previous.matches) || {};
  const matches = {};
  const todo = [];
  for (const e of events) {
    if (old[e.id]) matches[e.id] = old[e.id];
    else todo.push(e);
  }
  const batch = todo.slice(0, MAX_NEW);
  let ok = 0;
  let failed = 0;
  let lastError = null;
  await mapLimit(batch, CONCURRENCY, async (e) => {
    if (failed >= GIVE_UP_AFTER && ok === 0) { failed++; return; }
    try {
      const m = parseMatch(await getJson(`${SITE}/${slug}/summary?event=${e.id}`), e);
      if (!m) throw new Error(`match ${e.id}: rapporten saknar startelvor`);
      matches[e.id] = m;
      ok++;
    } catch (err) {
      failed++;
      lastError = String(err.message || err);
    }
  });
  // Inget nytt gick att hämta: felet visas i källtabellen och förra datan
  // behålls (src/refresh.js).
  if (batch.length && ok === 0) throw new Error(`${slug}: ingen matchrapport gick att hämta (${lastError})`);
  return {
    matches,
    played: events.length,
    missing: events.length - Object.keys(matches).length,
    sourceUrl: `https://www.espn.com/soccer/schedule/_/league/${slug}`,
  };
}

function parseMatch(j, e) {
  if (!j || !Array.isArray(j.rosters) || j.rosters.length !== 2) return null;
  const comp = j.header && j.header.competitions && j.header.competitions[0];
  const status = (comp && comp.status && comp.status.type && comp.status.type.name) || e.status || '';
  const full = /AET|PEN|EXTRA/.test(status) ? 120 : 90;
  const t = {};
  for (const side of j.rosters) {
    const list = Array.isArray(side.roster) ? side.roster : [];
    if (!side.team || list.filter((p) => p.starter).length !== 11) return null;
    const mins = {};
    for (const p of list) {
      const m = minutesOf(p, full);
      if (m != null && p.athlete) mins[String(p.athlete.id)] = m;
    }
    t[String(side.team.id)] = mins;
  }
  return { k: e.kickoff, t };
}

// null = spelade inte, eller bytesminuten saknas (okänt, inte noll).
function minutesOf(p, full) {
  const plays = Array.isArray(p.plays) ? p.plays : [];
  const subs = plays.filter((x) => x.substitution).map((x) => clock(x.clock)).sort((a, b) => a - b);
  const red = plays.filter((x) => x.redCard).map((x) => clock(x.clock));
  let from;
  if (p.starter) from = 0;
  else if (p.subbedIn) from = subs[0];
  else return null;
  let to = full;
  if (p.subbedOut) to = p.starter ? subs[0] : subs[1];
  if (red.length) to = Math.min(to, red[0]);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.max(1, Math.min(full, to) - from);
}

// "81'" → 81, "90'+3'" → 90.
function clock(c) {
  const m = /^(\d+)/.exec((c && c.displayValue) || '');
  return m ? Number(m[1]) : NaN;
}

module.exports = { fetchMinutes, parseMatch };
