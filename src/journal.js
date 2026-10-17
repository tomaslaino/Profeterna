'use strict';

// ============================================================================
// Prognosjournal (fas 3): append-only logg av varje prognos före avspark.
//
// Det enda som ger ett ÄKTA out-of-sample-facit: raderna skrivs innan
// matchen spelas och ändras aldrig i efterhand. En JSON-rad per post i
// data/journal/forecasts-<säsong>.jsonl, committad av GitHub Actions – git-
// historiken visar offentligt när varje rad fanns.
//
// Vad som loggas: varje match i de sex tävlingarna som inte startat och har
// avspark inom HORIZON_DAYS (samma fönster som listan Kommande på sidan).
// Raden har prognosens exakta sannolikheter (fyra decimaler, som sajtens
// data) för 1X2, över 2,5 mål, båda lagen gör mål och – i cuperna – att gå
// vidare, förväntade mål, regelversion, underlagets datum (fitThrough) och
// baslinjerna vid tillfället: (a) naiv, (b) säsongens mål och (c) marknaden
// med odds, källa och hämttid.
//
// En ny rad skrivs bara när prognosinnehållet ändrats sedan matchens senaste
// rad – på den precision sidan visar (hela procent, mål med en decimal),
// plus marknadens odds exakt och regelversionen. Samma princip som
// Gräva guld: avtrycket är det som visas. Omkörning med samma underlag
// skriver alltså inget, och små rörelser i fjärde decimalen ger inga rader.
//
// Den prognos som räknas för en match är den SISTA raden som loggades före
// avspark (beslut 2026-10-17). Rader loggade vid eller efter avspark räknas
// inte. Årets redan spelade matcher har bara återskapade prognoser och
// loggas aldrig – bara matcher med status "schemalagd" och avspark i framtiden.
//
// Bara bygget på GitHub Actions skriver (src/build.js --journal). Lokala
// byggen läser journalen som den ligger i repot, så att arbetskopian inte
// får rader som aldrig publicerats. JOURNAL_DIR pekar om katalogen (test).
// ============================================================================

const fs = require('fs');
const path = require('path');
const { SEASON } = require('../config/competitions');
const { wholePercent } = require('./model');

const DIR = process.env.JOURNAL_DIR
  ? path.resolve(process.env.JOURNAL_DIR)
  : path.join(__dirname, '..', 'data', 'journal');

// Matcher med avspark inom så många dagar loggas (= listan Kommande).
const HORIZON_DAYS = 14;
const DAY = 86400000;

function fileFor(seasonLabel) {
  return path.join(DIR, `forecasts-${seasonLabel.replace('/', '-')}.jsonl`);
}

// ---------- läsning ----------

// Alla journalfiler, äldsta säsongen först. En rad som inte går att läsa
// räknas och hoppas över – den skrivs aldrig om.
function readJournal() {
  let names = [];
  try {
    names = fs.readdirSync(DIR).filter((f) => /^forecasts-.*\.jsonl$/.test(f)).sort();
  } catch {
    names = [];
  }
  const rows = [];
  const files = [];
  let invalid = 0;
  for (const name of names) {
    const text = fs.readFileSync(path.join(DIR, name), 'utf8');
    let n = 0;
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        if (!r || !r.id || !r.loggedAt || !r.kickoff) throw new Error('ofullständig rad');
        rows.push(r);
        n++;
      } catch {
        invalid++;
      }
    }
    files.push({ name, rows: n, bytes: Buffer.byteLength(text) });
  }
  return { rows, files, invalid, dir: DIR };
}

// Raderna per match, i loggningsordning.
function byMatch(rows) {
  const out = new Map();
  for (const r of rows) {
    if (!out.has(r.id)) out.set(r.id, []);
    out.get(r.id).push(r);
  }
  for (const list of out.values()) list.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  return out;
}

// Den rad som räknas: den sista som loggades före avspark. `kickoff` är
// matchens avspark enligt dagens spelprogram – flyttas en match räknas
// rader loggade före den faktiska avsparken.
function counted(list, kickoff) {
  const k = Date.parse(kickoff);
  let pick = null;
  let after = 0;
  for (const r of list) {
    if (Date.parse(r.loggedAt) < k) pick = r;
    else after++;
  }
  return { row: pick, after };
}

// ---------- loggning ----------

// Loggar kommande matcher vars prognos är ny. matches = matchlistan
// (src/matches.js allMatches), predictions = Map(id → prognos). Returnerar
// de rader som skrevs.
function appendJournal(matches, predictions, now = new Date()) {
  const last = new Map();
  for (const r of readJournal().rows) last.set(r.id, r);
  const t = now.getTime();
  const loggedAt = now.toISOString();
  const out = [];
  for (const m of matches) {
    if (m.completed || m.status !== 'STATUS_SCHEDULED') continue;
    const k = Date.parse(m.kickoff);
    if (!(k > t) || k - t > HORIZON_DAYS * DAY) continue;
    const p = predictions.get(m.id);
    if (!p) continue;
    const row = entry(m, p, loggedAt);
    const prev = last.get(m.id);
    if (prev && fingerprint(prev) === fingerprint(row)) continue;
    out.push(row);
  }
  if (!out.length) return out;
  fs.mkdirSync(DIR, { recursive: true });
  const file = fileFor(SEASON.label);
  // Slutar filen mitt i en rad (avbruten skrivning) börjar de nya raderna på
  // en egen rad – den trasiga raden lämnas orörd och räknas som oläsbar.
  let lead = '';
  try {
    const fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size;
    if (size > 0) {
      const b = Buffer.alloc(1);
      fs.readSync(fd, b, 0, 1, size - 1);
      if (b[0] !== 0x0a) lead = '\n';
    }
    fs.closeSync(fd);
  } catch {
    lead = '';
  }
  fs.appendFileSync(file, lead + out.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return out;
}

function entry(m, p, loggedAt) {
  const b = p.baselines || {};
  const e = {
    loggedAt,
    id: m.id,
    comp: m.comp,
    kickoff: m.kickoff,
    home: m.home,
    away: m.away,
    rulesVersion: p.rulesVersion,
    fitThrough: p.fitThrough,
    status: p.status,
  };
  if (p.status === 'ok') {
    e.p = r4(p.p);
    e.goals = r4(p.goals);
    e.over25 = r4(p.over25);
    e.btts = r4(p.btts);
    if (p.advance) e.advance = p.advance.home == null ? null : r4([p.advance.home, p.advance.away]);
  } else {
    e.reasons = p.reasons || [];
  }
  e.naive = b.naive && b.naive.p ? r4(b.naive.p) : null;
  e.season = b.season && b.season.p ? r4(b.season.p) : null;
  const mk = b.market;
  e.market = mk && mk.p ? {
    p: r4(mk.p),
    odds: r4(mk.odds),
    over25: mk.over25 != null ? r4(mk.over25) : null,
    source: mk.source,
    kind: mk.kind,
    fetchedAt: mk.fetchedAt || null,
  } : null;
  return e;
}

// Innehållsavtryck: det som gör en prognos till "samma" prognos, på den
// precision sidan visar. Loggningstid och marknadens hämttid ingår inte –
// samma odds hämtade på nytt är ingen ny prognos.
function fingerprint(e) {
  const wp = (x) => (x ? wholePercent(x) : null);
  const pc = (x) => (x == null ? null : Math.round(x * 100));
  return JSON.stringify([
    e.rulesVersion, e.kickoff, e.status, e.reasons || null,
    wp(e.p), e.goals ? e.goals.map((x) => Math.round(x * 10)) : null, pc(e.over25), pc(e.btts),
    e.advance ? wp(e.advance) : null,
    wp(e.naive), wp(e.season),
    e.market ? [e.market.source, e.market.kind, e.market.odds, pc(e.market.over25)] : null,
  ]);
}

function r4(x) {
  if (Array.isArray(x)) return x.map(r4);
  return x == null ? null : Math.round(x * 10000) / 10000;
}

module.exports = { readJournal, appendJournal, byMatch, counted, fingerprint, HORIZON_DAYS, DIR, fileFor };
