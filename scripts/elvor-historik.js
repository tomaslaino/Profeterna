'use strict';

// Startelvorna i de fyra ligorna fem säsonger bakåt (2021-22–2025-26), ur
// ESPN:s matchrapporter (samma öppna API som src/fetchers/espnminutes.js).
// Spelade säsonger ändras inte, så de hämtas en gång med det här skriptet
// och sparas i data/elvor-historik.json, som checkas in. Innevarande säsong
// kommer ur cachen (espn_minutes_<liga>) vid varje uppdatering.
//
//   node scripts/elvor-historik.js            hämtar det som saknas
//   node scripts/elvor-historik.js l2 fil.json   bara League Two, till en egen fil
//                                                (två hämtningar samtidigt; fogas
//                                                ihop för hand)
//
// Matchlistan är ESPN:s egen (espn_hist_<liga> i cachen). Varje match sparas
// som en rad: [event-id, datum, hemma-id, borta-id, hemmamål, bortamål,
// hemmaelvan, bortaelvan, inbytta hemma, inbytta borta], där elvorna och de
// inbytta är spelar-id:n åtskilda med mellanslag. Lagens namn (för oddsen
// hos football-data) står i "lag". Matcher utan två hela elvor i rapporten
// hoppas över och prövas igen nästa gång.

const fs = require('fs');
const path = require('path');
const { COMPETITIONS } = require('../config/competitions');
const { readCache } = require('../src/store');
const { getJson, mapLimit } = require('../src/fetchers/http');

const ONLY = process.argv[2] || null;
const FILE = process.argv[3] ? path.resolve(process.argv[3]) : path.join(__dirname, '..', 'data', 'elvor-historik.json');
const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const SEASONS = ['2122', '2223', '2324', '2425', '2526'];
const LEAGUES = COMPETITIONS.filter((c) => c.type === 'league');
const CONCURRENCY = 4;

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return null; }
}

// En rad per match, så att filen går att läsa och jämföra.
function save(db) {
  const out = ['{'];
  out.push(`  "kalla": ${JSON.stringify(db.kalla)},`);
  out.push(`  "lag": ${JSON.stringify(db.lag)},`);
  out.push('  "matcher": {');
  const comps = Object.keys(db.matcher);
  comps.forEach((c, ci) => {
    out.push(`    ${JSON.stringify(c)}: {`);
    const ss = Object.keys(db.matcher[c]).sort();
    ss.forEach((s, si) => {
      const rows = db.matcher[c][s].slice().sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
      out.push(`      ${JSON.stringify(s)}: [`);
      rows.forEach((r, ri) => out.push(`        ${JSON.stringify(r)}${ri < rows.length - 1 ? ',' : ''}`));
      out.push(`      ]${si < ss.length - 1 ? ',' : ''}`);
    });
    out.push(`    }${ci < comps.length - 1 ? ',' : ''}`);
  });
  out.push('  }', '}');
  fs.writeFileSync(FILE + '.tmp', out.join('\n') + '\n');
  fs.renameSync(FILE + '.tmp', FILE);
}

function parse(j, ev) {
  const comp = j && j.header && j.header.competitions && j.header.competitions[0];
  if (!comp || !Array.isArray(j.rosters) || j.rosters.length !== 2) return null;
  const sideOf = (ha) => {
    const c = comp.competitors.find((x) => x.homeAway === ha);
    const r = c && j.rosters.find((x) => x.team && String(x.team.id) === String(c.id));
    if (!r || !Array.isArray(r.roster)) return null;
    const start = r.roster.filter((p) => p.starter && p.athlete).map((p) => String(p.athlete.id));
    if (start.length !== 11) return null;
    const ins = r.roster.filter((p) => !p.starter && p.subbedIn && p.athlete).map((p) => String(p.athlete.id));
    return { id: String(c.id), name: r.team.displayName, start, ins };
  };
  const h = sideOf('home');
  const a = sideOf('away');
  if (!h || !a) return null;
  return { h, a, row: [String(ev.id), ev.kickoff.slice(0, 10), h.id, a.id, ev.score.home, ev.score.away, h.start.join(' '), a.start.join(' '), h.ins.join(' '), a.ins.join(' ')] };
}

async function main() {
  const db = load() || {
    kalla: 'ESPN:s matchrapporter (site.api.espn.com/apis/site/v2/sports/soccer/<liga>/summary?event=<id>), hämtade med scripts/elvor-historik.js',
    lag: {},
    matcher: {},
  };
  for (const c of LEAGUES.filter((x) => !ONLY || x.id === ONLY)) {
    const hist = readCache(`espn_hist_${c.id}`);
    if (!hist || !hist.data) throw new Error(`espn_hist_${c.id} saknas i cachen`);
    db.matcher[c.id] = db.matcher[c.id] || {};
    for (const s of SEASONS) {
      const have = new Set((db.matcher[c.id][s] || []).map((r) => r[0]));
      const todo = (hist.data.seasons[s] || []).filter((m) => m.completed && m.score && !have.has(String(m.id)));
      if (!todo.length) continue;
      const rows = db.matcher[c.id][s] = db.matcher[c.id][s] || [];
      let ok = 0;
      let bad = 0;
      let done = 0;
      await mapLimit(todo, CONCURRENCY, async (ev) => {
        try {
          const p = parse(await getJson(`${SITE}/${c.espn}/summary?event=${ev.id}`), ev);
          if (!p) { bad++; return; }
          db.lag[p.h.id] = p.h.name;
          db.lag[p.a.id] = p.a.name;
          rows.push(p.row);
          ok++;
        } catch (e) {
          bad++;
        }
        if (++done % 100 === 0) save(db);
      });
      save(db);
      console.log(`${c.id} ${s}: ${ok} nya, ${bad} utan elvor eller fel, ${rows.length} av ${(hist.data.seasons[s] || []).length} sparade`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
