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
//             "tips": { "DL": "2", "DT": "1X", "DJ": "X" },
//             "motivering": { "DT": "Chelsea vinner alltid där" },   (valfritt)
//             "efter": { "DL": "Där satt den" },                     (valfritt)
//             "resultat": "1–2", "modell": [27, 24, 49] }
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
// omgången får "klar". Sedan ändras den aldrig – utom motiveringarna och
// kommentarerna i efterhand (motivering, efter: text per person), som följer
// tjänsten så länge den visar omgången, så att det som skrivs efter sista
// matchen också kommer med (Grupparbetena, src/history.js). Så finns omgången kvar även om
// nästa startas innan sista matchen är spelad. "slut" visar förlängning och
// straffar, "struken": true en match som inte spelades (räknas inte); saknas
// ställningen efter 90 minuter tre dagar efter avspark fryses raden utan
// resultat.
//
// Filen skrivs bara av bygget på GitHub Actions (--journal), som också
// committar den. Lokalt visas en omgång vars matcher är spelade ändå, bara
// inte fryst. Poängen räknas med public/tippoang.js, samma som sidan.
//
// Hasse Backe tävlar också, under samma regel som alla (regel i config/kupong.js,
// Tippoang.regelFor). Hans kupong byggs av det han säger vid disken (hasse.tecken
// och hasse.resultat i data/analyser.json, hasseKupong nedan) och skrivs in här, som
// en tippare till i omgångens gang och tips. Den följer analyserna fram till omgångens
// första avspark, då var och ens egna tips också stänger, och står sedan kvar. I
// tjänsten (worker/samtal.mjs, gang i config/kupong.js) finns han inte, så inlämningen,
// när tipsen visas, jämförelsen inför gängets kupong och kupongen själv går som förut.
// Omgångar som var klara innan han kom med ändras inte.

const fs = require('fs');
const path = require('path');
const Tippoang = require('../public/tippoang.js');
const kupongCfg = require('../config/kupong.js');

const NAMES_FILE = path.join(__dirname, '..', 'data', 'omgangsnamn.json');
const ANALYSER_FILE = path.join(__dirname, '..', 'data', 'analyser.json');
const FILE = process.env.TIPPAR_HISTORIK
  ? path.resolve(process.env.TIPPAR_HISTORIK)
  : path.join(__dirname, '..', 'data', 'tippar-historik.json');

const { SIGNS, HASSE } = Tippoang;
const DAY = 86400000;
const NOTE_MAX = 140; // som motiveringarna och kommentarerna i tjänsten (worker/samtal.mjs)
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
  // Text per person, utan tomma.
  const said = (get) => Object.fromEntries(gang.map((g) => [g.id, get(g.id)])
    .filter(([, t]) => typeof t === 'string' && t.trim()).map(([k, t]) => [k, t.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX)]));
  const matcher = s.matcher.slice().sort((a, b) => String(a.avspark).localeCompare(String(b.avspark))).map((m) => {
    const tips = {};
    for (const g of gang) {
      const t = s.tips[g.id] && s.tips[g.id].tecken;
      const sign = Tippoang.sign(t && t[m.id]);
      if (sign) tips[g.id] = sign;
    }
    const motivering = said((k) => s.tips[k] && s.tips[k].kommentarer && s.tips[k].kommentarer[m.id]);
    const efter = said((k) => s.efter && s.efter[k] && s.efter[k][m.id] && s.efter[k][m.id].text);
    return {
      id: String(m.id), match: String(m.match || ''), avspark: m.avspark, tips,
      ...(Object.keys(motivering).length ? { motivering } : {}),
      ...(Object.keys(efter).length ? { efter } : {}),
    };
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

// Vad Hasse Backe säger per match ({matchens id: {tecken: "2", resultat: "1–3"}}) ur
// analyserna: bara det han sa före avspark, så att en analys som skrivs om efteråt
// inte räknas.
function readHasse(file = ANALYSER_FILE) {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(file, 'utf8')).analyser;
  } catch {
    return {};
  }
  const out = {};
  for (const a of Array.isArray(list) ? list : []) {
    const h = a && a.hasse;
    if (!h || !Array.isArray(h.tecken) || !(Date.parse(h.writtenAt) < Date.parse(a.avspark))) continue;
    const tecken = Tippoang.sign(h.tecken.map((n) => SIGNS[n]).join(''));
    if (tecken) out[String(a.id)] = { tecken, resultat: h.resultat };
  }
  return out;
}

// Hasses kupong för en omgång – samma regel som alla, men hans egna bedömningar:
// hans tecken finns alltid med. Säkrast är ett ensamt tecken med störst målskillnad i
// hans resultat (3–0 före 2–1 före 1–1), sedan det modellen tror mest på. De säkraste
// blir spikar, de nästa halvgarderingar (hans tecken och det troligaste av de andra)
// och de osäkraste helgarderingar. Ändras antalen i regeln följer kupongen med.
// rows: [{id, sagt: {tecken, resultat} | undefined, modell: [1, X, 2] | null}]. Han tippar
// alla matcher: en match han inte har analyserat får det modellen tror mest på och läggs
// sist. Utan regel (ett annat antal matcher) gäller det han har sagt, och annars modellen.
// → {matchens id: tecken}, eller null om varken han eller modellen har något att gå på.
function hasseKupong(rows, regel) {
  if (!rows.some((x) => x.sagt || x.modell)) return null;
  const tro = (x, s) => (x.modell ? x.modell[SIGNS.indexOf(s)] : s === 'X' ? 1 : 0);
  const r = Tippoang.regelFor(regel, rows.length);
  if (!r) return Object.fromEntries(rows.map((x) => [x.id, x.sagt ? x.sagt.tecken : [...SIGNS].sort((a, b) => tro(x, b) - tro(x, a))[0]]));
  const rankade = rows.map((x) => {
    const egna = SIGNS.filter((s) => x.sagt && x.sagt.tecken.includes(s)).sort((a, b) => tro(x, b) - tro(x, a));
    const andra = SIGNS.filter((s) => !egna.includes(s)).sort((a, b) => tro(x, b) - tro(x, a) || (b === 'X') - (a === 'X'));
    const mal = x.sagt && parseScore(x.sagt.resultat);
    return {
      id: x.id,
      ordning: [...egna, ...andra],
      sakerhet: !x.sagt ? -1 : egna.length > 1 ? 0 : 1 + (mal ? Math.abs(mal.home - mal.away) : 0),
      modell: x.modell ? tro(x, egna[0] || andra[0]) : 0,
    };
  }).sort((a, b) => b.sakerhet - a.sakerhet || b.modell - a.modell || a.id.localeCompare(b.id));
  const out = {};
  rankade.forEach((x, i) => {
    const antal = i < r.spik ? 1 : i < r.spik + r.halv ? 2 : 3;
    out[x.id] = Tippoang.sign(x.ordning.slice(0, antal).join(''));
  });
  return Tippoang.regelKlar(r, Object.values(out)) ? out : null;
}

// Omgången med Hasse som tippare. Kupongen följer analyserna (sagt) fram till första
// avspark och står sedan kvar (prev: omgången från förra bygget), också när nästa
// omgångs analyser har tagit över. Spelar han inte ändras inget.
function withHasse(f, { sagt, prev, regel, modellAv, now }) {
  const forst = Math.min(...f.matcher.map((row) => Date.parse(row.avspark)).filter(Number.isFinite));
  const was = Object.fromEntries(((prev && prev.matcher) || [])
    .filter((row) => row.tips && row.tips[HASSE.id]).map((row) => [String(row.id), row.tips[HASSE.id]]));
  const kupong = now >= forst && Object.keys(was).length ? was
    : hasseKupong(f.matcher.map((row) => ({ id: row.id, sagt: sagt[row.id], modell: modellAv(row.id) })), regel);
  if (!kupong) return f;
  return {
    ...f,
    gang: [...f.gang, { id: HASSE.id, namn: HASSE.namn }],
    matcher: f.matcher.map((row) => (kupong[row.id] ? { ...row, tips: { ...row.tips, [HASSE.id]: kupong[row.id] } } : row)),
  };
}

// En klar omgång (r) med motiveringarna och kommentarerna i efterhand som
// tjänsten visar dem nu (f, entryFromSamtal) – resten står kvar. De står
// efter tipsen på raden, som när omgången skrevs in.
const NOTES = ['motivering', 'efter'];
function withNotes(r, f) {
  const by = new Map(f.matcher.map((x) => [String(x.id), x]));
  return {
    ...r,
    matcher: r.matcher.map((row) => {
      const x = by.get(String(row.id));
      if (!x) return row;
      const notes = Object.fromEntries(NOTES.filter((k) => x[k]).map((k) => [k, x[k]]));
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        if (NOTES.includes(k)) continue;
        out[k] = v;
        if (k === 'tips') Object.assign(out, notes);
      }
      return 'tips' in row ? out : { ...out, ...notes };
    }),
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
// omgångarna för sidan, nyaste först, och Hasse Backes kupong (hasse) i omgångarna
// som tjänsten visar, som sidan lägger till i tävlingen (tpScore i public/tippare.js).
function buildTippare({ samtal = null, matches = [], freeze = false, file = FILE, now = Date.now(), hasseFile = ANALYSER_FILE, regel = kupongCfg.regel } = {}) {
  const h = readRounds(file);
  const sagt = readHasse(hasseFile);
  const byId = new Map(matches.map((m) => [String(m.id), m]));
  const modellAv = (id) => {
    const m = byId.get(String(id));
    return (m && (m.j && m.j.p ? m.j.p : m.f ? m.f.p : null)) || null;
  };
  const known = new Set(h.raw.map((r) => r && String(r.id || '')));
  const stored = new Map(h.raw.filter((r) => r && r.id).map((r) => [String(r.id), r]));
  const fresh = new Map();
  const added = [];
  for (const s of [].concat(samtal || [])) {
    const was = s && stored.get(String(s.id));
    const utan = entryFromSamtal(s, was);
    if (!utan) continue;
    const f = withHasse(utan, { sagt, prev: was, regel, modellAv, now });
    fresh.set(f.id, f);
    if (!known.has(f.id)) {
      known.add(f.id);
      added.push(f);
    }
  }
  // Tipsen går att ändra tills matcherna startar, så en omgång som inte är
  // klar följer tjänsten så länge den finns där. En klar omgång får bara
  // motiveringarna och kommentarerna i efterhand därifrån.
  const valid = new Set([...h.rounds, ...added]);
  const changed = [];
  const raw = h.raw.map((r) => {
    const f = valid.has(r) ? fresh.get(String(r.id)) : null;
    const next = f && (r.klar ? withNotes(r, f) : f);
    if (!next || JSON.stringify(next) === JSON.stringify(r)) return r;
    valid.add(next);
    changed.push(next.id);
    return next;
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
  const hasse = {};
  for (const r of list) {
    if (!r || !fresh.has(String(r.id)) || !Array.isArray(r.matcher)) continue;
    for (const row of r.matcher) if (row.tips && row.tips[HASSE.id]) hasse[row.id] = row.tips[HASSE.id];
  }
  return {
    rounds,
    hasse,
    errors: h.errors,
    added: written ? added.map((r) => r.id) : [],
    changed: written ? changed : [],
    frozen: written ? done : [],
    waiting: list.filter((r) => r && !r.klar).length,
  };
}

// Omgångarnas namn, äldst först.
function readNames(file = NAMES_FILE) {
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(j.namn) ? j.namn : [];
  } catch {
    return [];
  }
}

// GET …/samtal → omgången och den förra (om dess tips visades), som en
// lista, eller null om tjänsten inte svarar. Namnet AI:n senast gav varje omgång
// står i data/omgangsnamn.json (scripts/analyser/skriv.mjs). Ett fel stoppar inget
// – nästa bygge försöker igen.
async function fetchSamtal(endpoint, { namesFile = NAMES_FILE, fetchImpl = fetch, log = console.log } = {}) {
  if (!endpoint || !/^https?:/.test(endpoint)) return null;
  try {
    const res = await fetchImpl(endpoint, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j || !j.ok) {
      log(`[tippare] samtalet: ${(j && j.error) || `HTTP ${res.status}`}`);
      return null;
    }
    const list = [j.samtal, j.forra].filter(Boolean);
    const names = readNames(namesFile);
    for (const s of list) {
      const n = names.filter((x) => x && x.id === s.id && x.namn).pop();
      if (n) Object.assign(s, { namn: n.namn, ...(n.syftar ? { syftar: n.syftar } : {}) });
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

// Motiveringarna och kommentarerna i efterhand per omgång – ur filen och ur
// tjänsten (samtal, som är nyare än filen) – så att gängets kupong i
// historiken kan visa dem under matcherna (src/history.js). → [{ids, notes}]
// där notes: matchens id → [{k, text, efter}], först motiveringarna, sedan
// kommentarerna i efterhand, i gängets ordning.
function roundNotes({ samtal = null, file = FILE } = {}) {
  const byId = new Map(readRounds(file).rounds.map((r) => [String(r.id), r]));
  for (const s of [].concat(samtal || [])) {
    const f = entryFromSamtal(s);
    if (f) byId.set(f.id, f);
  }
  return [...byId.values()].map((r) => {
    const notes = new Map();
    for (const row of r.matcher) {
      const list = NOTES.flatMap((k) => r.gang.map((g) => [g.id, row[k] && row[k][g.id]])
        .filter(([, t]) => typeof t === 'string' && t.trim())
        .map(([id, t]) => ({ k: id, text: t.trim(), ...(k === 'efter' ? { efter: true } : {}) })));
      if (list.length) notes.set(String(row.id), list);
    }
    return { ids: new Set(r.matcher.map((m) => String(m.id))), notes };
  });
}

module.exports = { FILE, readRounds, writeRounds, serialize, entryFromSamtal, hasseKupong, finish, summarize, buildTippare, fetchSamtal, roundNames, roundNotes };
