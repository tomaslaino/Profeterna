'use strict';

// Säsongens tippare: gängets egna tips inför samtalet (worker/samtal.mjs),
// omgång för omgång. GET …/samtal visar bara den pågående omgången, så bygget
// sparar varje omgång i en fil i repot som bara växer:
//
//   data/tippar-historik.json
//   {
//     "omgangar": [
//       {
//         "id": "2026-10-18-k3x9q2",          omgångens id i tjänsten
//         "namn": "Bolton brukar ju slå Boro", (valfritt) namnet AI:n gav omgången
//         "syftar": "Middlesbrough har …",     (valfritt) vad namnet syftar på
//         "datum": "2026-10-18",              första matchens dag
//         "till": "2026-10-20",               (valfritt) sista matchens dag
//         "gang": [{ "id": "DL", "namn": "Daniel Laino" }, …],
//         "klar": "2026-10-20T22:37:00.000Z", när omgången frystes; saknas = väntar på resultat
//         "matcher": [
//           { "id": "401878771", "match": "Everton – Chelsea", "avspark": "2026-10-18T11:30:00.000Z",
//             "tips": { "DL": "2", "DT": "1X", "DJ": "X" }, "resultat": "1–2", "modell": [27, 24, 49] }
//         ]
//       }
//     ]
//   }
//
// Omgången skrivs in när tipsen visas för alla, med matcherna och var och ens
// tecken. Tipsen går att ändra tills matcherna startar, så tills omgången är
// klar skrivs den om när tjänsten visar andra tips. GET …/samtal ger också den
// förra omgången (forra) om dess tips visades, så att en omgång som ersätts
// av nästa innan ett bygge hunnit se den ändå kommer med. När varje match är
// avgjord fylls resultatet efter 90 minuter och modellens prognos före avspark (1 · X ·
// 2 i hela procent, journalen om den finns, annars sajtens prognos) i, och
// omgången får "klar". Sedan ändras den aldrig. Så finns omgången kvar även om
// nästa startas innan sista matchen är spelad. "slut" visar förlängning och
// straffar, "struken": true en match som inte spelades (räknas inte); saknas
// ställningen efter 90 minuter tre dagar efter avspark fryses raden utan
// resultat.
//
// Filen skrivs bara av bygget på GitHub Actions (--journal), som också
// committar den. Lokalt visas en omgång vars matcher är spelade ändå, bara
// inte fryst. Poängen räknas med public/tippoang.js, samma som sidan.

const fs = require('fs');
const path = require('path');
const Tippoang = require('../public/tippoang.js');

const FILE = process.env.TIPPAR_HISTORIK
  ? path.resolve(process.env.TIPPAR_HISTORIK)
  : path.join(__dirname, '..', 'data', 'tippar-historik.json');

const { SIGNS } = Tippoang;
const DAY = 86400000;
const OFF = /POSTPONED|CANCEL|ABANDON|SUSPEND/;
const dayOf = (iso) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date(iso));
const signIdx = (s) => (s.home > s.away ? 0 : s.home === s.away ? 1 : 2);

function parseScore(s) {
  const m = String(s == null ? '' : s).match(/^\s*(\d+)\s*[-–]\s*(\d+)\s*$/);
  return m ? { home: Number(m[1]), away: Number(m[2]) } : null;
}

// ---------- filen ----------

// rounds är de läsbara omgångarna, raw alla – också de med fel, så att
// bygget aldrig tar bort något när det skriver filen.
function readRounds(file = FILE) {
  if (!fs.existsSync(file)) return { rounds: [], raw: [], errors: [] };
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return { rounds: [], raw: [], errors: [`${path.basename(file)} kan inte läsas: ${err.message}`], broken: true };
  }
  const list = Array.isArray(raw && raw.omgangar) ? raw.omgangar : [];
  const rounds = [];
  const errors = [];
  const seen = new Set();
  for (const [i, r] of list.entries()) {
    const where = r && r.id ? `omgång ${r.id}` : `omgång ${i + 1}`;
    if (!r || typeof r !== 'object' || !r.id || !Array.isArray(r.matcher) || !r.matcher.length || !Array.isArray(r.gang)) {
      errors.push(`${where}: id, gang eller matcher saknas`);
      continue;
    }
    if (seen.has(r.id)) { errors.push(`${where}: finns två gånger`); continue; }
    seen.add(r.id);
    rounds.push(r);
  }
  return { rounds, raw: list, errors };
}

// En omgång per block, en match per rad – går att läsa och rätta för hand.
function inline(v) {
  if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }`;
  return JSON.stringify(v);
}

function serialize(list) {
  const block = (r) => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return `    ${JSON.stringify(r)}`;
    const lines = Object.entries(r).filter(([, v]) => v !== undefined).map(([k, v]) => {
      if ((k === 'matcher' || k === 'gang') && Array.isArray(v) && v.length) {
        return `      ${JSON.stringify(k)}: [\n${v.map((x) => `        ${inline(x)}`).join(',\n')}\n      ]`;
      }
      return `      ${JSON.stringify(k)}: ${inline(v)}`;
    });
    return `    {\n${lines.join(',\n')}\n    }`;
  };
  return `{\n  "omgangar": [\n${list.map(block).join(',\n')}\n  ]\n}\n`;
}

function writeRounds(list, file = FILE) {
  const key = (r) => `${(r && r.datum) || ''} ${(r && r.id) || ''}`;
  const sorted = list.slice().sort((a, b) => key(a).localeCompare(key(b)));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, serialize(sorted));
}

// ---------- in i filen ----------

// Omgången från GET …/samtal som ny rad, när tipsen visas – annars null.
// Namnet (fetchSamtal) följer med; gick det inte att hämta den här gången
// står namnet från förra bygget (prev) kvar.
function entryFromSamtal(s, prev = null) {
  if (!s || !s.visas || !s.tips || !s.id || !Array.isArray(s.matcher) || !s.matcher.length) return null;
  const gang = (s.gang || []).filter((g) => g && g.id).map((g) => ({ id: String(g.id), namn: String(g.namn || g.id) }));
  const matcher = s.matcher.slice().sort((a, b) => String(a.avspark).localeCompare(String(b.avspark))).map((m) => {
    const tips = {};
    for (const g of gang) {
      const t = s.tips[g.id] && s.tips[g.id].tecken;
      const sign = Tippoang.sign(t && t[m.id]);
      if (sign) tips[g.id] = sign;
    }
    return { id: String(m.id), match: String(m.match || ''), avspark: m.avspark, tips };
  });
  const first = dayOf(matcher[0].avspark);
  const last = dayOf(matcher[matcher.length - 1].avspark);
  const named = s.namn ? s : prev && prev.namn ? prev : null;
  return {
    id: String(s.id),
    ...(named ? { namn: String(named.namn).slice(0, 60), ...(named.syftar ? { syftar: String(named.syftar).slice(0, 200) } : {}) } : {}),
    datum: first,
    ...(last !== first ? { till: last } : {}),
    gang,
    matcher,
  };
}

// Matchens utfall ur sajtens matcher, eller null om den inte är avgjord än.
function outcome(row, m, now) {
  const late = Date.parse(row.avspark) < now - 3 * DAY;
  if (!m) return late ? {} : null;
  const off = OFF.test(m.status || '');
  if (off) return { struken: true };
  if (!m.completed) return late ? {} : null;
  const s90 = m.score90 || (/STATUS_(FULL_TIME|FINAL)$/.test(m.status || '') ? m.score : null);
  if (!s90 && !late) return null;
  const end = [];
  if (m.score && (!s90 || m.score.home !== s90.home || m.score.away !== s90.away)) end.push(`e.fl. ${m.score.home}–${m.score.away}`);
  if (m.shootout) end.push(`str. ${m.shootout.home}–${m.shootout.away}`);
  return {
    ...(s90 ? { resultat: `${s90.home}–${s90.away}` } : {}),
    ...(end.length ? { slut: end.join(', ') } : {}),
  };
}

// Omgången fylld med resultat och modellens prognos – eller null om någon
// match inte är avgjord.
function finish(r, byId, now) {
  const rows = [];
  for (const row of r.matcher) {
    const m = byId.get(String(row.id));
    const o = outcome(row, m, now);
    if (!o) return null;
    const p = m && (m.j && m.j.p ? m.j.p : m.f ? m.f.p : null);
    rows.push({ ...row, ...o, ...(p && !o.struken ? { modell: p } : {}) });
  }
  const { matcher, ...head } = r;
  return { ...head, klar: new Date(now).toISOString(), matcher: rows };
}

// ---------- poängen ----------

function resOf(row) {
  if (row.struken === true) return null;
  const s = parseScore(row.resultat);
  return s ? signIdx(s) : null;
}

const validModel = (x) => (Array.isArray(x) && x.length === 3 && x.every((v) => Number.isFinite(v) && v >= 0) ? x : null);

function scoreRows(r, signOf) {
  return r.matcher.map((row) => {
    const sign = Tippoang.sign(signOf(row));
    if (!sign) return null;
    const res = resOf(row);
    const prob = Tippoang.chance(sign, Tippoang.pct(sign, validModel(row.modell)));
    if (res == null) return { sign, hit: null, prob, pts: null };
    const hit = sign.includes(SIGNS[res]);
    return { sign, hit, prob, pts: Tippoang.points(hit, prob) };
  });
}

// En fryst omgång som sidan visar den: poängen per person och modellen.
function summarize(r) {
  const people = r.gang.map((g) => {
    const rows = scoreRows(r, (row) => row.tips && row.tips[g.id]);
    if (rows.every((x) => !x)) return { id: g.id, name: g.namn || g.id, none: true };
    return { id: g.id, name: g.namn || g.id, ...Tippoang.tally(rows) };
  });
  const played = r.matcher.some((row) => resOf(row) != null);
  Tippoang.rank(people.filter((p) => !p.none), played);
  const kicks = r.matcher.map((row) => row.avspark).filter(Boolean).sort();
  return {
    id: r.id,
    ...(r.namn ? { name: String(r.namn) } : {}),
    ...(r.syftar ? { hint: String(r.syftar) } : {}),
    from: kicks[0] || null,
    to: kicks[kicks.length - 1] || null,
    // Matcherna för spoilerskyddet (döljs någon av dem döljs omgången) och för
    // Kampen (public/kampen.js): utfallet, modellens prognos och allas tecken.
    matches: r.matcher.map((row) => {
      const res = resOf(row);
      const model = validModel(row.modell);
      return {
        id: String(row.id),
        kickoff: row.avspark,
        ...(row.struken ? { off: true } : {}),
        match: String(row.match || ''),
        ...(res != null ? { res: SIGNS[res], score: row.resultat } : {}),
        ...(model ? { model } : {}),
        tips: row.tips && typeof row.tips === 'object' ? row.tips : {},
      };
    }),
    n: r.matcher.filter((row) => resOf(row) != null).length,
    people,
    model: Tippoang.tally(scoreRows(r, (row) => Tippoang.modelSign(validModel(row.modell)))),
  };
}

// ---------- bygget ----------

// samtal: omgången ur GET …/samtal, eller en lista med den och den förra
// (fetchSamtal), eller null. Med freeze (bygget på GitHub Actions) skrivs nya
// omgångar och färdiga resultat in i filen. Tillbaka: de avslutade
// omgångarna för sidan, nyaste först.
function buildTippare({ samtal = null, matches = [], freeze = false, file = FILE, now = Date.now() } = {}) {
  const h = readRounds(file);
  const byId = new Map(matches.map((m) => [String(m.id), m]));
  const known = new Set(h.raw.map((r) => r && String(r.id || '')));
  const stored = new Map(h.raw.filter((r) => r && r.id).map((r) => [String(r.id), r]));
  const fresh = new Map();
  const added = [];
  for (const s of [].concat(samtal || [])) {
    const f = entryFromSamtal(s, s && stored.get(String(s.id)));
    if (!f) continue;
    fresh.set(f.id, f);
    if (!known.has(f.id)) {
      known.add(f.id);
      added.push(f);
    }
  }
  // Tipsen går att ändra tills matcherna startar, så en omgång som inte är
  // klar följer tjänsten så länge den finns där.
  const valid = new Set([...h.rounds, ...added]);
  const changed = [];
  const raw = h.raw.map((r) => {
    const f = valid.has(r) && !r.klar ? fresh.get(String(r.id)) : null;
    if (!f || JSON.stringify(f) === JSON.stringify(r)) return r;
    valid.add(f);
    changed.push(f.id);
    return f;
  });
  // Omgångar som väntar på resultat fylls i när alla matcher är avgjorda.
  const done = [];
  const list = [...raw, ...added].map((r) => {
    if (!valid.has(r) || r.klar) return r;
    const f = finish(r, byId, now);
    if (!f) return r;
    done.push(f.id);
    return f;
  });
  let written = false;
  if (freeze && (added.length || changed.length || done.length) && !h.broken) {
    writeRounds(list, file);
    written = true;
  }
  const rounds = list
    .filter((r) => r && r.klar && Array.isArray(r.matcher) && Array.isArray(r.gang))
    .map(summarize)
    .sort((a, b) => String(b.from).localeCompare(String(a.from)) || b.id.localeCompare(a.id));
  return {
    rounds,
    errors: h.errors,
    added: written ? added.map((r) => r.id) : [],
    changed: written ? changed : [],
    frozen: written ? done : [],
    waiting: list.filter((r) => r && !r.klar).length,
  };
}

// GET …/samtal → omgången och den förra (om dess tips visades), som en
// lista, eller null om tjänsten inte svarar. Med nameEndpoint (…/namn)
// hämtas också namnet AI:n senast gav varje omgång – bara läsning, inget nytt
// skrivs. Ett fel stoppar inget – nästa bygge försöker igen.
async function fetchSamtal(endpoint, { nameEndpoint = null, fetchImpl = fetch, log = console.log } = {}) {
  if (!endpoint || !/^https?:/.test(endpoint)) return null;
  try {
    const res = await fetchImpl(endpoint, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j || !j.ok) {
      log(`[tippare] samtalet: ${(j && j.error) || `HTTP ${res.status}`}`);
      return null;
    }
    const list = [j.samtal, j.forra].filter(Boolean);
    if (nameEndpoint && /^https?:/.test(nameEndpoint)) {
      await Promise.all(list.map(async (s) => {
        try {
          const r = await fetchImpl(nameEndpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id: s.id, las: true }),
            signal: AbortSignal.timeout(15000),
          });
          const n = await r.json().catch(() => null);
          if (r.ok && n && n.ok && n.namn) Object.assign(s, { namn: n.namn, ...(n.syftar ? { syftar: n.syftar } : {}) });
        } catch (err) {
          log(`[tippare] namnet på ${s.id}: ${err.message || err}`);
        }
      }));
    }
    return list;
  } catch (err) {
    log(`[tippare] samtalet: ${err.message || err}`);
    return null;
  }
}

// Omgångarnas namn med sina matcher – ur filen och ur tjänsten (samtal) –
// så att gängets kupong i historiken kan få namnet på omgången den gjordes ur
// (src/history.js).
function roundNames({ samtal = null, file = FILE } = {}) {
  const out = [];
  for (const r of [...readRounds(file).raw, ...[].concat(samtal || [])]) {
    if (r && r.namn && Array.isArray(r.matcher)) out.push({ namn: String(r.namn), ids: new Set(r.matcher.map((m) => String(m.id))) });
  }
  return out;
}

module.exports = { FILE, readRounds, writeRounds, serialize, entryFromSamtal, finish, summarize, buildTippare, fetchSamtal, roundNames };
