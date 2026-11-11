// Källornas träffsäkerhet (config/traff.js): efter matcherna prövas det källorna sa om truppen
// mot matchtruppen i ESPN:s matchrapport, och varje källa får sina rätt och fel. Körs av
// scripts/tidning/poddar.mjs på iMacen; resultatet ligger i traff.json utanför repot.
//
// traff.json: {matcher: {<match-id>: {omgang, match, avspark, provad, version, domar: [{lag, kalla, typ,
//   id, datum, namn, sa, dom}]}}}. En match som är prövad (också utan något att pröva) prövas inte igen.

import tc from '../../config/traff.js';
import comp from '../../config/competitions.js';
import { jsonOf } from './kontroller.mjs';
import { claudeSvar, Stopp } from './claude.mjs';

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const ESPN_LIGA = Object.fromEntries(comp.COMPETITIONS.filter((c) => c.espn).map((c) => [c.id, c.espn]));
const DOMAR = { 'rätt': 'ratt', ratt: 'ratt', fel: 'fel' };
const SA = ['missar', 'med', 'startar', 'startar inte'];
const ren = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function hamtaJson(url, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(30000), headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  return res.json();
}

// Omgångens matcher med det som går att pröva, ur omgang.json. Lagets match står på lagets post
// (match, avspark) sedan träffsäkerheten kom; för äldre filer tas den ur matchbladen (fil.sidor).
// → [{id, lagen: [hemma, borta] eller [lag], avspark, pastaenden: {lag: [{id, kalla, typ, datum, amne, uppgift}]}}]
export function omgangensPastaenden(fil) {
  const matcher = new Map();
  const iSidor = new Map();
  for (const s of Object.values((fil && fil.sidor) || {})) for (const lag of s.lag || []) iSidor.set(lag, { id: String(s.id), avspark: s.avspark, lagen: s.lag });
  for (const [lag, post] of Object.entries((fil && fil.lag) || {})) {
    const m = post.match ? { id: String(post.match), avspark: post.avspark || null } : iSidor.get(lag);
    if (!m || !m.id || m.id === 'prov') continue;
    const pastaenden = [];
    for (const a of post.avsnitt || []) {
      for (const x of a.uppgifter || []) {
        if (!x.id || !tc.amnen.includes(x.a) || !tc.slag.includes(x.s)) continue;
        pastaenden.push({ id: x.id, kalla: a.podd, typ: a.typ || 'podd', datum: String(x.tid || a.datum || '').slice(0, 10), amne: x.a, uppgift: x.t });
      }
    }
    if (!matcher.has(m.id)) matcher.set(m.id, { id: m.id, lagen: [], avspark: m.avspark || null, pastaenden: {} });
    const match = matcher.get(m.id);
    match.lagen.push(lag);
    if (!match.avspark && m.avspark) match.avspark = m.avspark;
    match.pastaenden[lag] = pastaenden;
  }
  return [...matcher.values()];
}

// Matchtruppen ur ESPN:s matchrapport, per lag med sajtens lagnamn. Lagets trupp (för inte_med)
// kommer ur sajtens matchfil. → {klar, match: "A – B", lag: {namn: {startade, inbytta, satt_kvar, inte_med}}}
// eller null när matchen inte finns.
export async function matchtruppen(matchId, { site, fetchImpl } = {}) {
  const d = await hamtaJson(`${site}/data/match/${matchId}.json`, fetchImpl);
  if (!d || !d.match) return null;
  const liga = ESPN_LIGA[d.match.comp];
  if (!liga) return null;
  const r = await hamtaJson(`${ESPN}/${liga}/summary?event=${matchId}`, fetchImpl);
  const status = r && r.header && r.header.competitions && r.header.competitions[0] && r.header.competitions[0].status;
  const klar = Boolean(status && status.type && status.type.completed);
  const namn = { home: d.match.home, away: d.match.away };
  const lag = {};
  for (const t of (r && r.rosters) || []) {
    const vem = namn[t.homeAway];
    const roster = (t.roster || []).filter((p) => p && p.athlete && p.athlete.displayName);
    if (!vem || !roster.some((p) => p.starter)) continue;
    const med = new Set(roster.map((p) => ren(p.athlete.displayName)));
    const trupp = ((d.squads && d.squads[t.homeAway] && d.squads[t.homeAway].players) || []).map((p) => p && p.name).filter(Boolean);
    lag[vem] = {
      startade: roster.filter((p) => p.starter).map((p) => p.athlete.displayName),
      inbytta: roster.filter((p) => !p.starter && p.subbedIn).map((p) => p.athlete.displayName),
      satt_kvar: roster.filter((p) => !p.starter && !p.subbedIn).map((p) => p.athlete.displayName),
      inte_med: [...new Set(trupp.filter((n) => !med.has(ren(n))))],
    };
  }
  return { klar, match: `${d.match.home} – ${d.match.away}`, lag };
}

// Claudes domar för en match. → [{lag, kalla, typ, id, datum, namn, sa, dom}], en per källa och
// spelare: säger källan samma sak om samma spelare flera gånger räknas det en gång (det senaste).
export function domarAv(content, match) {
  let j;
  try { j = jsonOf(content); } catch { return null; }
  if (!j || !Array.isArray(j.domar)) return null;
  const perId = new Map();
  for (const [lag, lista] of Object.entries(match.pastaenden)) for (const p of lista) perId.set(p.id, { ...p, lag });
  const ut = new Map();
  for (const d of j.domar) {
    const p = d && perId.get(String(d.id));
    if (!p || !Array.isArray(d.spelare)) continue;
    for (const s of d.spelare) {
      const dom = s && DOMAR[String(s.dom || '').toLowerCase()];
      const sa = s && SA.includes(String(s.sa || '').toLowerCase()) ? String(s.sa).toLowerCase() : null;
      if (!dom || !sa || typeof s.namn !== 'string' || !s.namn.trim()) continue;
      const nyckel = `${p.lag}\n${p.kalla}\n${ren(s.namn)}`;
      const forut = ut.get(nyckel);
      if (forut && forut.datum > p.datum) continue;
      ut.set(nyckel, { lag: p.lag, kalla: p.kalla, typ: p.typ, id: p.id, datum: p.datum, namn: s.namn.trim(), sa, dom });
    }
  }
  return [...ut.values()];
}

// Prövar en match. → domarna, eller null när Claudes svar inte gick att läsa.
export async function provaMatch(match, trupp, { claude = claudeSvar } = {}) {
  const data = {
    match: trupp.match,
    lag: Object.fromEntries(match.lagen.filter((l) => trupp.lag[l]).map((l) => [l, {
      matchtruppen: trupp.lag[l],
      uppgifter: (match.pastaenden[l] || []).map((p) => ({ id: p.id, kalla: p.kalla, datum: p.datum, amne: p.amne, uppgift: p.uppgift })),
    }])),
  };
  const r = await claude({ system: tc.prompt, prompt: `Matchen och uppgifterna (JSON):\n${JSON.stringify(data)}`, tools: [], model: tc.model, effort: tc.effort, timeoutMs: tc.timeoutMs });
  if (r.refused) return { domar: null, sekunder: r.seconds };
  return { domar: domarAv(r.content, match), sekunder: r.seconds };
}

// Prövar omgångens spelade matcher som inte redan är prövade (traff ändras på plats).
// spara: (traff) → sparar filen efter varje match. → antal prövade matcher
export async function provaOmgangen(fil, traff, { site, now = Date.now(), claude = claudeSvar, fetchImpl, logg = () => {}, spara = () => {}, torrt = false } = {}) {
  traff.matcher = traff.matcher || {};
  let n = 0;
  for (const match of omgangensPastaenden(fil)) {
    const forut = traff.matcher[match.id];
    if (forut && forut.version === tc.promptVersion) continue;
    if (!match.avspark || Date.parse(match.avspark) + tc.efterTimmar * 3600000 > now) continue;
    const antal = Object.values(match.pastaenden).reduce((s, l) => s + l.length, 0);
    try {
      const trupp = await matchtruppen(match.id, { site, fetchImpl });
      if (!trupp || !trupp.klar || !match.lagen.some((l) => trupp.lag[l])) { logg(`träffsäkerhet: ${match.lagen.join(' – ')} har ingen färdig matchrapport än`); continue; }
      const post = { omgang: fil.omgang, match: trupp.match, avspark: match.avspark, provad: new Date(now).toISOString(), version: tc.promptVersion, domar: [] };
      if (!antal) { if (!torrt) { traff.matcher[match.id] = post; spara(traff); } continue; }
      if (torrt) { logg(`skulle pröva ${antal} uppgifter i ${trupp.match}`); continue; }
      const r = await provaMatch(match, trupp, { claude });
      if (!r.domar) { logg(`träffsäkerhet: ${trupp.match}: svaret gick inte att läsa (${r.sekunder} s)`); continue; }
      post.domar = r.domar;
      traff.matcher[match.id] = post;
      spara(traff);
      n++;
      const ratt = r.domar.filter((d) => d.dom === 'ratt').length;
      logg(`träffsäkerhet: ${trupp.match}: ${antal} uppgifter, ${r.domar.length} prövade påståenden, ${ratt} rätt (${r.sekunder} s)`);
    } catch (err) {
      if (err instanceof Stopp) throw err;
      logg(`FEL träffsäkerhet: ${match.lagen.join(' – ')}: ${err.message}`);
    }
  }
  return n;
}

// Varje källas rätt och fel genom alla prövade matcher, per lag (NOT606 och andra delade forum är
// olika för olika lag). → {"<lag>\n<källa>": {lag, kalla, typ, ratt, fel}}
export function kallornasTraff(traff) {
  const ut = {};
  for (const m of Object.values((traff && traff.matcher) || {})) {
    for (const d of m.domar || []) {
      const k = `${d.lag}\n${d.kalla}`;
      const t = ut[k] || (ut[k] = { lag: d.lag, kalla: d.kalla, typ: d.typ, ratt: 0, fel: 0 });
      t[d.dom === 'ratt' ? 'ratt' : 'fel']++;
    }
  }
  return ut;
}

// Det redaktören får om källan, när den är prövad tillräckligt många gånger. → text eller null
export function traffText(t) {
  if (!t || t.ratt + t.fel < tc.minstProvade) return null;
  return `${t.ratt} av ${t.ratt + t.fel} rätt om truppen`;
}
