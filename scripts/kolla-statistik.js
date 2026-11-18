'use strict';

// Kontrollen av statistiken (sidan Statistik, datorn i tobaksaffären): prövar
// spelar- och lagfilerna som bygget skriver (data/players/<division>.json och
// data/teams/<division>.json) mot sådant som alltid måste stämma, och räkningen
// av målens betydelse (matchGoals i src/players.js) mot påhittade matcher med
// känt facit. Sedan 2026-11-18 (användarens önskemål: "förbättra och säkerställa
// statistiken på sidan"), se README, Beslut.
//
//   npm run statistik                        den byggda sajten (_site/data)
//   npm run statistik -- <mapp>              en mapp med players/ och teams/
//   npm run statistik -- --url <sajt>        den publicerade sajten, t.ex.
//                                            https://matchfixarna.se
//
// Två sorters fynd:
//   fel        något som inte kan vara sant: räkningen är fel, eller ett lag
//              eller en spelare är kopplad till fel rad i en annan källa.
//              Avslutar med kod 1.
//   källorna   källorna säger olika, utan att räkningen är fel (ESPN:s trupp
//              saknar matcher som FPL har, ett lag släpar en omgång). Bara
//              upplysning.
// I GitHub Actions (steget efter bygget i publicera.yml) blir felen varningar
// i körningen och allt hamnar i körningens sammanfattning; publiceringen
// stoppas inte – en död källa eller ett udda värde ska inte släcka sajten.

const fs = require('fs');
const path = require('path');
const { matchGoals } = require('../src/players');

const DIVS = ['pl', 'ch', 'l1', 'l2', 'unl'];
const NAMN = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two', unl: 'Nations League' };

// ---------- matchGoals mot påhittade matcher ----------

// En match: lagen A och B, målen i tidsordning [lag, spelare, minut, självmål].
function match(goals) {
  return {
    t: { A: {}, B: {} },
    d: 1,
    g: goals.map(([t, p, m, o]) => ({ t, p: o ? null : p, m, o: !!o, s: 'g' })),
  };
}
const FACIT = [
  ['två mål i en seger med 2–1 ger 3 poäng och ett segermål', match([['A', 'x', 10], ['B', 'y', 20], ['A', 'x', 80]]),
    { 'A|x': { g: 2, gw: 1, gpts: 3, g1: 1, glate: 1 }, 'B|y': { g: 1, gw: 0, gpts: 0 } }],
  ['hattrick i en seger med 3–2 ger 3 poäng, inte 6', match([['A', 'x', 5], ['B', 'y', 15], ['A', 'x', 30], ['B', 'y', 60], ['A', 'x', 85]]),
    { 'A|x': { g: 3, gw: 1, gpts: 3 } }],
  ['två mål i 2–2 ger 1 poäng', match([['A', 'x', 5], ['A', 'x', 15], ['B', 'y', 60], ['B', 'z', 85]]),
    { 'A|x': { g: 2, gpts: 1, gw: 0 }, 'B|y': { gpts: 1 }, 'B|z': { gpts: 1 } }],
  ['två målskyttar i 2–1 ger 2 poäng var', match([['A', 'x', 5], ['B', 'y', 15], ['A', 'z', 60]]),
    { 'A|x': { gpts: 2, gw: 0 }, 'A|z': { gpts: 2, gw: 1 } }],
  ['i 3–1 ger ett mål inga poäng och två mål två', match([['A', 'x', 5], ['A', 'z', 15], ['B', 'y', 50], ['A', 'z', 60]]),
    { 'A|x': { gpts: 0, gw: 0 }, 'A|z': { g: 2, gpts: 2, gw: 1 } }],
  ['självmål räknas för laget men inte för någon spelare', match([['A', null, 5, true], ['A', 'x', 70], ['B', 'y', 80]]),
    { 'A|x': { g: 1, gw: 1, gpts: 2, g1: 0 } }],
  ['förlust ger inga poäng', match([['B', 'y', 5], ['A', 'x', 50], ['B', 'y', 70]]),
    { 'A|x': { g: 1, gpts: 0, gw: 0 }, 'B|y': { g: 2, gpts: 3, gw: 1, g1: 1 } }],
];

function selfTest(out) {
  for (const [what, m, want] of FACIT) {
    const got = matchGoals(m);
    for (const [k, fields] of Object.entries(want)) {
      const s = got.get(k) || {};
      for (const [f, v] of Object.entries(fields)) {
        if ((s[f] || 0) !== v) out.fel(`Målens betydelse: ${what} – ${k.split('|')[1]} fick ${f} = ${s[f] || 0}, ska vara ${v}`);
      }
    }
  }
}

// ---------- filerna ----------

const fin = (x) => typeof x === 'number' && Number.isFinite(x);
const near = (a, b, tol = 0.0015) => Math.abs(a - b) <= tol;
const espnMin = (p) => (p.emin !== undefined ? p.emin : p.min);

function checkTeams(div, T, out) {
  if (!T || T.unknown) { out.kallor(`${NAMN[div]}: lagstatistiken saknas (${T ? T.reason : 'ingen fil'})`); return; }
  if (T.unmapped && T.unmapped.length) out.fel(`${NAMN[div]}: lag i statistiken som inte hittades i tabellen: ${T.unmapped.join(', ')}`);
  for (const t of T.teams) {
    const n = `${NAMN[div]}, ${t.name}`;
    if (t.w + t.d + t.l !== t.m) out.fel(`${n}: tabellen har ${t.w}+${t.d}+${t.l} matcher men ${t.m} spelade`);
    if (3 * t.w + t.d - (t.ded || 0) !== t.pts) out.fel(`${n}: tabellen har ${t.pts} poäng, ${t.w} vinster och ${t.d} oavgjorda ger ${3 * t.w + t.d - (t.ded || 0)}`);
    if (t.gf - t.ga !== t.gd) out.fel(`${n}: målskillnaden ${t.gd} stämmer inte med ${t.gf}–${t.ga}`);
    const f = t.fd;
    if (!f) continue;
    if (f.w + f.d + f.l !== f.n) out.fel(`${n}: matchstatistiken har ${f.w}+${f.d}+${f.l} men ${f.n} matcher`);
    if (f.n > t.m) out.fel(`${n}: matchstatistiken har ${f.n} matcher men tabellen bara ${t.m} – laget är kopplat till fel rader`);
    else if (f.n < t.m) out.kallor(`${n}: matchstatistiken har ${f.n} av ${t.m} matcher (källan släpar)`);
    else if (f.w !== t.w || f.d !== t.d || f.gf !== t.gf || f.ga !== t.ga) {
      out.fel(`${n}: matchstatistiken (${f.w}-${f.d}-${f.l}, ${f.gf}–${f.ga}) och tabellen (${t.w}-${t.d}-${t.l}, ${t.gf}–${t.ga}) gäller samma antal matcher men stämmer inte`);
    }
    if (f.cs > f.n || f.fts > f.n) out.fel(`${n}: fler nollor än matcher`);
    const res = 3 * f.w + f.d;
    if (f.xg) {
      const x = f.xg;
      if (x.n > f.n || x.d > x.n || x.xd > x.n + 1e-9 || x.xp < 0 || x.xp > 3 * x.n + 1e-9) out.fel(`${n}: xG-siffrorna går inte ihop (${JSON.stringify(x)})`);
      if (x.n === f.n && x.pts !== res) out.fel(`${n}: poängen i xG-matcherna (${x.pts}) är inte lagets ${res}`);
    }
    if (f.mkt) {
      const m = f.mkt;
      if (m.n > f.n || m.fav > m.n || m.xp < 0 || m.xp > 3 * m.n + 1e-9 || m.ret < 0) out.fel(`${n}: oddssiffrorna går inte ihop (${JSON.stringify(m)})`);
      if (m.n === f.n && m.pts !== res) out.fel(`${n}: poängen i oddsmatcherna (${m.pts}) är inte lagets ${res}`);
    }
    if (f.sh && (f.sh.of > f.sh.f || f.sh.oa > f.sh.a)) out.fel(`${n}: fler skott på mål än skott`);
    if (t.hb && t.hb.h && t.hb.b) {
      const { h, b } = t.hb;
      if (h.n + b.n !== t.m || h.gf + b.gf !== t.gf || h.ga + b.ga !== t.ga) out.kallor(`${n}: hemma och borta (${h.n}+${b.n} matcher, ${h.gf + b.gf}–${h.ga + b.ga}) och tabellen (${t.m}, ${t.gf}–${t.ga}) hämtades vid olika tillfällen`);
      for (const [side, e] of [['hemma', h], ['borta', b]]) {
        if (e.w + e.d + e.l !== e.n || e.ovan.n + e.under.n !== e.n) out.fel(`${n}: ${side} går inte ihop (${JSON.stringify(e)})`);
      }
    }
  }
}

function checkPlayers(div, P, T, out) {
  if (!P || P.unknown) { out.kallor(`${NAMN[div]}: spelarstatistiken saknas (${P ? P.reason : 'ingen fil'})`); return; }
  const table = new Map((T && !T.unknown ? T.teams : []).map((t) => [t.espnId, t]));
  const played = P.players.filter((p) => !p.noStats && p.app > 0);
  const sum = played.reduce((s, p) => s + (p.g || 0), 0);
  if (sum !== P.totals.goals) out.fel(`${NAMN[div]}: spelarnas mål (${sum}) är inte totalen ${P.totals.goals}`);
  const shares = P.goalsByPos.reduce((s, x) => s + x.share, 0);
  if (P.goalsByPos.length && !near(shares, 1, 0.005)) out.fel(`${NAMN[div]}: Vem gör målen? summerar till ${Math.round(shares * 1000) / 10} %`);
  for (const t of P.teams) {
    const n = `${NAMN[div]}, ${t.name}`;
    const g = P.players.filter((p) => p.teamId === t.espnId && !p.noStats).reduce((s, p) => s + (p.g || 0), 0);
    if (g !== t.goals) out.fel(`${n}: spelarnas mål (${g}) är inte lagets ${t.goals}`);
    if (t.goalsFor != null && t.goals > t.goalsFor) out.fel(`${n}: spelarna har ${t.goals} mål men laget bara ${t.goalsFor} i tabellen`);
    if (t.topScorer && t.goals && !near(t.topScorerShare, t.topScorer.g / t.goals)) out.fel(`${n}: beroendet ${t.topScorerShare} är inte ${t.topScorer.g}/${t.goals}`);
    if (t.coverage && t.coverage.behind > 0) out.kallor(`${n}: ESPN:s trupp omfattar ${t.coverage.covered} av ${t.coverage.matches} matcher (släpar)`);
  }
  for (const p of played) {
    const n = `${NAMN[div]}, ${p.name} (${p.team})`;
    const t = table.get(p.teamId);
    const bad = (why) => out.fel(`${n}: ${why}`);
    if (p.starts > p.app) bad(`${p.starts} matcher från start men ${p.app} matcher`);
    if (fin(p.sot) && fin(p.sh) && p.sot > p.sh) bad(`${p.sot} skott på mål men ${p.sh} skott`);
    if (fin(p.g) && fin(p.sh) && p.g > p.sh) out.kallor(`${n}: ${p.g} mål men ${p.sh} skott hos ESPN`);
    for (const k of ['gw', 'g1', 'glate', 'gsub', 'gpen', 'ghd', 'gfk', 'gout']) {
      if (fin(p[k]) && p[k] > (p.g || 0)) bad(`${k} = ${p[k]} är fler än målen (${p.g})`);
    }
    if (fin(p.gpts) && p.gpts > 2 * (p.g || 0)) bad(`${p.gpts} poäng åt laget av ${p.g} mål (högst 2 per mål)`);
    if (fin(p.gpts) && t && p.gpts > t.pts + (t.ded || 0)) bad(`${p.gpts} poäng åt laget, fler än lagets ${t.pts + (t.ded || 0)}`);
    if (fin(p.gw) && t && p.gw > t.w) bad(`${p.gw} segermål men laget har vunnit ${t.w}`);
    if (p.gsub > 0 && p.app - p.starts === 0) bad(`mål som inhoppare utan inhopp`);
    if (fin(espnMin(p)) && espnMin(p) > 90 * p.app) bad(`${espnMin(p)} minuter på ${p.app} matcher`);
    if (fin(p.min) && p.emin !== undefined && p.min > 90 * p.app + 10) {
      out.kallor(`${n}: FPL har ${p.min} minuter men ESPN:s trupp bara ${p.app} matcher (rapporterna: ${p.emin} minuter)`);
    }
    if (fin(p.fg) && fin(p.g) && p.fg < p.g) out.kallor(`${n}: FPL har ${p.fg} mål, ESPN ${p.g}`);
    if (p.pos === 'MV' && fin(p.savePct) && !near(p.savePct, p.sv / (p.sv + p.gc))) bad(`räddningsprocenten ${p.savePct} är inte ${p.sv}/(${p.sv}+${p.gc})`);
    if (fin(p.rt) && (p.rt < 1 || p.rt > 10)) bad(`betyget ${p.rt} är utanför 1–10`);
    if (fin(p.cs) && p.cs > p.app + 2) out.kallor(`${n}: ${p.cs} nollor hos FPL men ${p.app} matcher hos ESPN`);
  }
}

// ---------- läsa filerna ----------

async function readAll(src) {
  const get = src.url
    ? async (rel) => {
      const res = await fetch(`${src.url.replace(/\/$/, '')}/data/${rel}`, { cache: 'no-store' });
      return res.ok ? res.json() : null;
    }
    : async (rel) => {
      const f = path.join(src.dir, rel);
      return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
    };
  const files = {};
  for (const d of DIVS) files[d] = { P: await get(`players/${d}.json`), T: await get(`teams/${d}.json`) };
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--url');
  const src = i >= 0 ? { url: args[i + 1] } : { dir: args[0] || path.join(__dirname, '..', '_site', 'data') };
  const fel = [];
  const kallor = [];
  const out = { fel: (s) => fel.push(s), kallor: (s) => kallor.push(s) };

  selfTest(out);
  const files = await readAll(src);
  if (DIVS.every((d) => !files[d].P && !files[d].T)) {
    console.error(`Hittade inga spelar- eller lagfiler i ${src.url || src.dir}.`);
    process.exit(2);
  }
  for (const d of DIVS) {
    checkTeams(d, files[d].T, out);
    checkPlayers(d, files[d].P, files[d].T, out);
  }

  const where = src.url || path.relative(process.cwd(), src.dir) || '.';
  const lines = [
    `Statistiken i ${where}: ${fel.length ? `${fel.length} fel` : 'inga fel'}, ${kallor.length} skillnader mellan källorna.`,
    ...(fel.length ? ['', 'Fel:', ...fel.map((s) => `  - ${s}`)] : []),
    ...(kallor.length ? ['', 'Källorna:', ...kallor.map((s) => `  - ${s}`)] : []),
  ];
  console.log(lines.join('\n'));
  if (process.env.GITHUB_ACTIONS) {
    for (const s of fel) console.log(`::warning title=Statistiken::${s.replace(/\r?\n/g, ' ')}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Statistiken\n\n${lines[0]}\n\n` +
        (fel.length ? `**Fel**\n\n${fel.map((s) => `- ${s}`).join('\n')}\n\n` : '') +
        (kallor.length ? `<details><summary>Skillnader mellan källorna (${kallor.length})</summary>\n\n${kallor.map((s) => `- ${s}`).join('\n')}\n\n</details>\n` : ''));
    }
  }
  process.exit(fel.length ? 1 : 0);
}

if (require.main === module) main();

module.exports = { checkTeams, checkPlayers, selfTest };
