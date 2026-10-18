'use strict';

// Kuponghistoriken (sidan Historik): gängets färdigspelade kuponger med facit,
// ett betyg och AI:ns kommentar. Historiken är en fil i repot som bara växer:
//
//   data/kupong-historik.json
//   {
//     "kuponger": [
//       {
//         "id": "2026-10-17",
//         "namn": "Omgång 9",                    (valfritt)
//         "spel": "Stryktipset",                 (valfritt – lagd någon annanstans)
//         "datum": "2026-10-17",                 första matchens dag
//         "till": "2026-10-19",                  (valfritt) sista matchens dag
//         "källa": "sidan",                      fryst ur data/kuponger/; saknas = inlagd för hand
//         "matcher": [
//           { "match": "Everton – Chelsea", "tecken": "2", "resultat": "1–2", "modell": [27, 24, 49],
//             "kommentar": "Teijder lovade", "id": "401878771" }
//         ],
//         "ai": { "text": "…", "modell": "deepseek-v4-pro", "skriven": "2026-10-19T08:07:00.000Z" }
//       }
//     ]
//   }
//
// En rad: "resultat" är ställningen efter 90 minuter (det tecknet gäller) –
// eller "utfall" (1, X, 2) om bara det är känt. "slut" visar förlängning och
// straffar, "struken": true en match som inte spelades (räknas inte).
// "modell" är prognosen 1 · X · 2 i hela procent före avspark, om den finns.
// "kommentar" är gängets egen anteckning om matchen.
//
// Kuponger som görs på sidan (data/kuponger/, src/coupons.js) fryses in här
// när varje match är spelad – med resultat och modellens prognos, så att
// historiken finns kvar när säsongens matcher inte längre gör det. Det, och
// AI:ns kommentar, skriver bara bygget på GitHub Actions (--journal), som
// också committar filen. Lokalt visas en färdig kupong ändå, bara inte fryst.
// Äldre kuponger, lagda före sidan, läggs in för hand i samma format.

const fs = require('fs');
const path = require('path');
const { normSign } = require('./coupons');

const HISTORY_FILE = process.env.KUPONG_HISTORIK
  ? path.resolve(process.env.KUPONG_HISTORIK)
  : path.join(__dirname, '..', 'data', 'kupong-historik.json');

const SIGNS = ['1', 'X', '2'];
const DAY = 86400000;
const dayOf = (iso) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date(iso));
const signIdx = (s) => (s.home > s.away ? 0 : s.home === s.away ? 1 : 2);

// ---------- betyget ----------
//
// Antal rätt mot det väntade: väntat är summan av modellens chans för gängets
// tecken före avspark. En match utan modell får en schablon efter hur många
// tecken raden har (ett typiskt tecken sitter ungefär 45 % av gångerna, en
// halvgardering 75 %). Skillnaden delas med spridningen, så att en rätt mer än
// väntat väger tyngre på en kort kupong än på en lång, och en skräll som sitter
// lyfter mer än en storfavorit.
const BASE = { 1: 0.45, 2: 0.75, 3: 1 };
const GRADES = [
  { min: 1.25, grade: 5, label: 'Profetiskt' },
  { min: 0.5, grade: 4, label: 'Starkt' },
  { min: -0.5, grade: 3, label: 'Godkänt' },
  { min: -1.25, grade: 2, label: 'Svagt' },
  { min: -Infinity, grade: 1, label: 'Haveri' },
];

function gradeOf(z) {
  return GRADES.find((g) => z >= g.min);
}

// ---------- filen ----------

function parseScore(s) {
  const m = String(s == null ? '' : s).match(/^\s*(\d+)\s*[-–]\s*(\d+)\s*$/);
  return m ? { home: Number(m[1]), away: Number(m[2]) } : null;
}

function parseModel(x) {
  if (!Array.isArray(x) || x.length !== 3 || !x.every((v) => Number.isFinite(v) && v >= 0)) return null;
  return x.map(Number);
}

const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

function parseEntry(raw, i) {
  const errors = [];
  const where = raw && raw.id ? `kupong ${raw.id}` : `kupong ${i + 1}`;
  if (!raw || typeof raw !== 'object') return { entry: null, errors: [`${where}: inte ett JSON-objekt`] };
  const id = String(raw.id || '');
  if (!/^[\w-]{1,40}$/.test(id)) errors.push(`${where}: id saknas eller har andra tecken än a–z, 0–9 och -`);
  if (!isDay(raw.datum)) errors.push(`${where}: datum saknas (ÅÅÅÅ-MM-DD)`);
  const rows = [];
  for (const [j, r] of (Array.isArray(raw.matcher) ? raw.matcher : []).entries()) {
    const sign = normSign(r && r.tecken);
    if (!r || !r.match || !sign) { errors.push(`${where}, match ${j + 1}: match eller tecken saknas`); continue; }
    if (r.resultat != null && !parseScore(r.resultat)) errors.push(`${where}, match ${j + 1}: resultatet ska skrivas som 2–1`);
    if (r.modell != null && !parseModel(r.modell)) errors.push(`${where}, match ${j + 1}: modellen ska vara [1, X, 2] i procent`);
    rows.push(r);
  }
  if (!rows.length) errors.push(`${where}: inga matcher`);
  if (errors.length) return { entry: null, errors };
  return { entry: raw, errors };
}

// entries är de giltiga kupongerna, raw alla – också de som har fel, så att
// bygget aldrig tar bort en handskriven kupong med ett stavfel när det skriver
// filen.
function readHistory(file = HISTORY_FILE) {
  if (!fs.existsSync(file)) return { entries: [], errors: [], raw: [] };
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return { entries: [], errors: [`${path.basename(file)} kan inte läsas: ${err.message}`], raw: [], broken: true };
  }
  const list = Array.isArray(raw && raw.kuponger) ? raw.kuponger : [];
  const entries = [];
  const errors = [];
  const seen = new Set();
  for (const [i, x] of list.entries()) {
    const r = parseEntry(x, i);
    errors.push(...r.errors);
    if (!r.entry) continue;
    if (seen.has(r.entry.id)) { errors.push(`kupong ${r.entry.id}: finns två gånger`); continue; }
    seen.add(r.entry.id);
    entries.push(r.entry);
  }
  return { entries, errors, raw: list };
}

// Filen ska gå att läsa och ändra för hand: en kupong per block, en match
// per rad.
function inline(v) {
  if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }`;
  return JSON.stringify(v);
}

function serialize(entries) {
  const block = (e) => {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return `    ${JSON.stringify(e)}`;
    const lines = Object.entries(e).filter(([, v]) => v !== undefined).map(([k, v]) => {
      if (k === 'matcher' && Array.isArray(v) && v.length) return `      "matcher": [\n${v.map((r) => `        ${inline(r)}`).join(',\n')}\n      ]`;
      return `      ${JSON.stringify(k)}: ${JSON.stringify(v, null, 2).replace(/\n/g, '\n      ')}`;
    });
    return `    {\n${lines.join(',\n')}\n    }`;
  };
  return `{\n  "kuponger": [\n${entries.map(block).join(',\n')}\n  ]\n}\n`;
}

function writeHistory(entries, file = HISTORY_FILE) {
  const key = (e) => `${(e && e.datum) || ''} ${(e && e.id) || ''}`;
  const sorted = entries.slice().sort((a, b) => key(a).localeCompare(key(b)));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, serialize(sorted));
}

// ---------- sidans kuponger ----------

// En kupong från sidan som rad i historiken, eller null om någon match inte
// är klar. Ställningen efter 90 minuter i en match med förlängning kommer med
// målminuterna; saknas den tre dagar efter avspark fryses raden utan resultat.
function entryFromCoupon(c, byId, now = Date.now()) {
  const rows = [];
  for (const x of c.matches) {
    const m = byId.get(x.id);
    if (!m) return null;
    const off = /POSTPONED|CANCEL|ABANDON|SUSPEND/.test(m.status || '');
    if (!m.completed && !off) return null;
    const s90 = m.score90 || (/STATUS_(FULL_TIME|FINAL)$/.test(m.status || '') ? m.score : null);
    if (m.completed && !s90 && Date.parse(m.kickoff) > now - 3 * DAY) return null;
    const end = [];
    if (m.completed && m.score && (!s90 || m.score.home !== s90.home || m.score.away !== s90.away)) end.push(`e.fl. ${m.score.home}–${m.score.away}`);
    if (m.shootout) end.push(`str. ${m.shootout.home}–${m.shootout.away}`);
    const p = m.j && m.j.p ? m.j.p : m.f ? m.f.p : null;
    rows.push({
      kick: m.kickoff,
      row: {
        match: `${m.home} – ${m.away}`,
        tecken: x.sign,
        ...(s90 && !off ? { resultat: `${s90.home}–${s90.away}` } : {}),
        ...(end.length ? { slut: end.join(', ') } : {}),
        ...(off ? { struken: true } : {}),
        ...(p ? { modell: p } : {}),
        ...(x.note ? { kommentar: x.note } : {}),
        id: x.id,
      },
    });
  }
  if (!rows.length) return null;
  rows.sort((a, b) => a.kick.localeCompare(b.kick));
  const first = dayOf(rows[0].kick);
  const last = dayOf(rows[rows.length - 1].kick);
  return {
    id: c.id,
    ...(c.name ? { namn: c.name } : {}),
    datum: first,
    ...(last !== first ? { till: last } : {}),
    'källa': 'sidan',
    matcher: rows.map((r) => r.row),
  };
}

function finishedFromCoupons(coupons, matches, now = Date.now()) {
  const byId = new Map(matches.map((m) => [m.id, m]));
  return coupons.map((c) => entryFromCoupon(c, byId, now)).filter(Boolean);
}

// ---------- sammanställningen för sidan ----------

function summarize(e) {
  const rows = e.matcher.map((r) => {
    const sign = normSign(r.tecken);
    const score = parseScore(r.resultat);
    const off = r.struken === true;
    const u = normSign(r.utfall);
    const res = off ? null : score ? signIdx(score) : u && u.length === 1 ? SIGNS.indexOf(u) : null;
    const model = parseModel(r.modell);
    return {
      match: String(r.match),
      sign,
      res,
      score: score ? `${score.home}–${score.away}` : null,
      end: r.slut ? String(r.slut) : null,
      off,
      model,
      p: model ? sign.split('').reduce((a, s) => a + model[SIGNS.indexOf(s)], 0) : null,
      tip: model ? model.indexOf(Math.max(...model)) : null,
      note: r.kommentar ? String(r.kommentar) : null,
      hit: res == null ? null : sign.includes(SIGNS[res]),
      id: r.id ? String(r.id) : null,
    };
  });
  const counted = rows.filter((r) => r.res != null);
  const chance = (r) => (r.p != null ? r.p / 100 : BASE[r.sign.length]);
  const ok = counted.filter((r) => r.hit).length;
  const exp = counted.reduce((a, r) => a + chance(r), 0);
  const variance = counted.reduce((a, r) => a + chance(r) * (1 - chance(r)), 0);
  const z = counted.length ? (ok - exp) / Math.sqrt(Math.max(variance, 0.5)) : 0;
  const withModel = counted.filter((r) => r.tip != null);
  const g = gradeOf(z);
  return {
    id: e.id,
    name: e.namn ? String(e.namn) : null,
    game: e.spel ? String(e.spel) : null,
    date: e.datum,
    till: e.till || null,
    source: e['källa'] === 'sidan' ? 'sidan' : 'egen',
    frozen: Boolean(e.frozen),
    rows,
    n: counted.length,
    ok,
    exp,
    z,
    grade: counted.length ? g.grade : null,
    label: counted.length ? g.label : null,
    basis: withModel.length === counted.length ? 'modell' : withModel.length ? 'delvis' : 'schablon',
    modelOk: withModel.filter((r) => r.tip === r.res).length,
    modelN: withModel.length,
    ai: e.ai && e.ai.text ? { text: String(e.ai.text), model: e.ai.modell || null, at: e.ai.skriven || null } : null,
  };
}

// Historiken som sidan visar: filen plus sidans färdiga kuponger som inte
// frysts in än. Med freeze (bygget på GitHub Actions) skrivs de in i filen.
function buildHistory({ coupons, matches, freeze = false, file = HISTORY_FILE, now = Date.now() }) {
  const h = readHistory(file);
  const known = new Set(h.raw.map((e) => e && String(e.id || '').trim()));
  const fresh = finishedFromCoupons(coupons, matches, now).filter((e) => !known.has(e.id));
  let frozen = [];
  if (freeze && fresh.length && !h.broken) {
    writeHistory([...h.raw, ...fresh], file);
    frozen = fresh.map((e) => e.id);
  }
  const all = [...h.entries.map((e) => ({ ...e, frozen: true })), ...fresh.map((e) => ({ ...e, frozen: frozen.includes(e.id) }))];
  const list = all.map(summarize).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return { coupons: list, errors: h.errors, frozen };
}

// AI:ns kommentarer skrivs in i filen av bygget på GitHub Actions: för varje
// kupong i filen utan kommentar frågas proxyn, som läser kupongen ur den
// publicerade sajten. En kupong som frysts in i det här bygget är inte
// publicerad än – den får sin kommentar i nästa bygge. Ett fel stoppar inget.
async function writeComments({ endpoint, file = HISTORY_FILE, max = 5, fetchImpl = fetch, log = console.log }) {
  if (!endpoint) return [];
  const h = readHistory(file);
  if (h.broken) return [];
  const missing = h.entries.filter((e) => !(e.ai && e.ai.text)).slice(0, max);
  const done = [];
  for (const e of missing) {
    try {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: e.id }),
        signal: AbortSignal.timeout(180000),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j || !j.ok || !j.text) {
        log(`[historik] ${e.id}: ingen kommentar (${(j && j.error) || `HTTP ${res.status}`})`);
        continue;
      }
      e.ai = { text: j.text, modell: j.model || null, skriven: j.generatedAt || new Date().toISOString() };
      done.push(e.id);
    } catch (err) {
      log(`[historik] ${e.id}: ingen kommentar (${err.message || err})`);
    }
  }
  if (done.length) writeHistory(h.raw, file);
  return done;
}

module.exports = {
  HISTORY_FILE,
  GRADES,
  readHistory,
  writeHistory,
  serialize,
  entryFromCoupon,
  finishedFromCoupons,
  summarize,
  buildHistory,
  writeComments,
};
