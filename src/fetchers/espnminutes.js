'use strict';

// Speltid och mål per spelare och ligamatch ur ESPN:s matchrapporter
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
// Målen (verifierat 2026-10-20, Premier League 70 matcher): rapportens
// händelser (keyEvents) ger varje mål med lag, minut, målskytt och sort –
// "Goal - Header", "Penalty - Scored", "Goal - Free-kick", "Own Goal" (laget
// är då det som fick målet) – och en text i Optas ord där "outside the box",
// "long range" och "more than 35 yards" betyder skott utanför straffområdet.
// Alla 70 slutresultat stämde, och målen per spelare var desamma som i
// truppen för alla 443 spelare. Missade straffar: "Penalty - Saved", "Penalty
// - Missed" och "Penalty - Hit Woodwork" med skytten som första deltagare.
// League One och League Two (2026-10-20): bara "Goal" med texten "Victor
// Adeboyejo (Bromley) Goal at 70'" – minut och målskytt men inte sorten.
// Sådana matcher får d: 0 och målens sort är där okänd, inte noll.
//
// En rapport är ~400 kB, men en spelad match ändras inte: den hämtas en gång
// och sparas kompakt som { k: avspark, t: { lag-id: { spelar-id: minuter } },
// g: [mål i tidsordning], pm: [missade straffar] } (se goalsOf). Bara nya
// matcher hämtas, högst MAX_NEW per körning, och därefter matcher sparade
// före 2026-10-20 som saknar målen eller d. En match som inte gick att hämta eller
// saknar startelvor prövas igen vid nästa hämtning.

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
  const upgrade = []; // sparade utan målen: behålls tills de hämtats om
  for (const e of events) {
    if (old[e.id]) matches[e.id] = old[e.id];
    if (!old[e.id]) todo.push(e);
    else if (!('d' in old[e.id])) upgrade.push(e);
  }
  const batch = todo.concat(upgrade).slice(0, MAX_NEW);
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
  const subIns = new Set();
  for (const side of j.rosters) {
    const list = Array.isArray(side.roster) ? side.roster : [];
    if (!side.team || list.filter((p) => p.starter).length !== 11) return null;
    const mins = {};
    for (const p of list) {
      const m = minutesOf(p, full);
      if (m != null && p.athlete) mins[String(p.athlete.id)] = m;
      if (!p.starter && p.subbedIn && p.athlete) subIns.add(String(p.athlete.id));
    }
    t[String(side.team.id)] = mins;
  }
  return { k: e.kickoff, t, ...goalsOf(j, subIns, comp) };
}

// Målen i tidsordning: { t: laget som fick målet, m: minut, p: målskytt,
// s: sort (n = nick, s = straff, f = frispark), u: 1 = utanför
// straffområdet, i: 1 = målskytten var inbytt }. Självmål: { t, m, o: 1 }
// utan målskytt. pm = missade straffar { t: skyttens lag, p: skytten }.
// Straffläggningar räknas inte. d = 1 om rapporten beskriver målen i Optas
// ord, 0 om bara minut och målskytt finns (sorten okänd), null utan mål.
// Stämmer målen inte med slutresultatet blir g, pm och d null: okänt, och
// matchen hämtas inte om.
const KIND = [[/Header/i, 'n'], [/^Penalty/i, 's'], [/Free-kick/i, 'f']];
function goalsOf(j, subIns, comp) {
  const events = Array.isArray(j.keyEvents) ? j.keyEvents.filter((x) => !x.shootout && x.team && x.type) : [];
  const g = [];
  const pm = [];
  let plain = false;
  for (const x of events) {
    const type = x.type.text || '';
    const first = x.participants && x.participants[0] && x.participants[0].athlete;
    const who = first ? String(first.id) : null;
    if (/^Penalty - (Saved|Missed|Hit Woodwork)/i.test(type)) {
      if (who) pm.push({ t: String(x.team.id), p: who });
      continue;
    }
    if (!x.scoringPlay) continue;
    const goal = { t: String(x.team.id), m: clock(x.clock) };
    if (/\bGoal at \d+/.test(x.text || '')) plain = true;
    if (/Own Goal/i.test(type)) goal.o = 1;
    else {
      goal.p = who;
      const kind = KIND.find(([re]) => re.test(type));
      if (kind) goal.s = kind[1];
      if (/outside the box|long range|more than \d+ yards/i.test(x.text || '')) goal.u = 1;
      if (who && subIns.has(who)) goal.i = 1;
    }
    g.push(goal);
  }
  const sides = (comp && Array.isArray(comp.competitors)) ? comp.competitors : [];
  const ok = sides.length === 2 && sides.every((c) => Number(c.score) === g.filter((x) => x.t === String(c.id)).length);
  if (!ok) return { g: null, pm: null, d: null };
  return { g, pm, d: g.length ? (plain ? 0 : 1) : null };
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
