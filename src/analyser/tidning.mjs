// Tidningen inför omgången: en notis per match om hur lagen har det just nu, som Hasse
// Backe läser i tobaksaffären. Skrivs på iMacen med Claude Code på användarens konto
// (scripts/analyser/skriv.mjs), ett anrop för hela omgången. Prompten och gränserna står
// i config/tidning.js och sidan sparas i data/tidning.json.
//
// Kontrollerna är analysernas (src/analyser/kontroller.mjs): en källa följer bara med om
// adressen kom upp i en sökning eller på en läst sida, och varje tal ska stå i underlaget
// eller i det Claude läste. Notisen får inga tips. En notis som inte klarar det får Claude
// skriva om en gång, utan verktyg men med det den läste; klarar den sig inte då står
// matchen utan notis.

import tc from '../../config/tidning.js';
import newsCfg from '../../config/news.js';
import { roundPayload } from './namn.mjs';
import { squadOf } from './underlag.mjs';
import { citer, see, jsonOf, unknownNumbers } from './kontroller.mjs';
import { senasteTid } from './tider.mjs';
import { claudeSvar } from './claude.mjs';

const H = 3600000;
const REF_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g;
// Tipsspråk hör inte hemma i en notis.
const TIPS_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*|odds\w*|favorit(?:en|er|erna)?)\b/i;
// Det Claude läste kan bli långt; så mycket följer med till en omskrivning.
const MAX_LAST = 60000;
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ord = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const sammaMatcher = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => String(x) === String(b[i]));

export const systemPrompt = () => tc.systemPrompt
  .replace('{sokningar}', tc.sokningar).replace('{sidor}', tc.sidor).replace('{rubrikOrd}', tc.rubrikOrd)
  .replace('{ordMin}', tc.ord[0]).replace('{ordMax}', tc.ord[1]);

// Ska tidningen skrivas nu? nu: data/tidning.json som den ligger. En omgång utan tidning
// (eller med en äldre prompt) får sin direkt; annars skriver varje tid i tc.tider om den,
// om omgången fanns när klockan slog och sidan är äldre än tiden och minstTimmar. Matcher
// som har börjat räknas inte, och när alla har börjat står sidan kvar som den är.
// → {skriv, tid, varfor}
export function attSkrivaTidning(round, nu, { now = Date.now(), tvinga = false } = {}) {
  const tid = senasteTid(now, tc.tider);
  const ids = round.matcher.map((x) => String(x.id));
  if (!round.matcher.some((x) => Date.parse(x.avspark) > now)) return { skriv: false, tid, varfor: 'alla matcher har börjat' };
  if (tvinga) return { skriv: true, tid, varfor: 'tvingad' };
  if (!nu || nu.omgang !== round.id || !sammaMatcher(nu.matcher, ids)) return { skriv: true, tid, varfor: 'ny omgång' };
  if (nu.version !== tc.promptVersion) return { skriv: true, tid, varfor: 'ny prompt' };
  const skriven = Date.parse(nu.skriven) || 0;
  const galler = tid >= (Date.parse(round.skapad) || 0);
  if (galler && skriven < tid && now - skriven >= tc.minstTimmar * H) return { skriv: true, tid, varfor: 'ny tid' };
  return { skriv: false, tid, varfor: 'aktuell' };
}

// Underlaget: omgångens matcher i kupongens ordning, numrerade, med det namnet också
// får (tabelläget, formen, schemat, möten) och skadelistan – men utan odds, eftersom
// notisen inte ska handla om dem. details: match-id → data/match/<id>.json.
export function tidningsUnderlag(round, details = {}) {
  const matcher = round.matcher.map((x, i) => {
    const d = details[String(x.id)] || null;
    const rad = roundPayload({ matcher: [x] }, { details }).matcher[0];
    delete rad['modellens odds'];
    delete rad['spelbolagens odds'];
    if (d && d.squad && d.match) {
      rad['skador och avstängningar'] = { [d.match.home]: squadOf(d.squad.home), [d.match.away]: squadOf(d.squad.away) };
    }
    return { nr: i + 1, ...rad };
  });
  return { matcher };
}

// {"notiser": [{nr, rubrik, text, källor}]} → [{nr, rubrik, text, sources}] eller null.
export function notiserAv(content) {
  try {
    const j = jsonOf(content);
    if (!j || !Array.isArray(j.notiser)) return null;
    return j.notiser.map((n) => ({
      nr: Number(n && n.nr),
      rubrik: str(n && n.rubrik),
      text: str(n && n.text),
      sources: Array.isArray(n && n['källor']) ? n['källor'].filter((s) => s && typeof s.url === 'string').map((s, i) => ({ ...s, n: i + 1 })) : [],
    })).filter((n) => Number.isInteger(n.nr) && n.rubrik && n.text);
  } catch {
    return null;
  }
}

// Det som är fel i en notis. known: underlaget och det Claude läste.
export function notisFel(n, known) {
  const why = [];
  const w = ord(n.text);
  if (w < tc.ord[0] - 15 || w > tc.ord[1] + 30) why.push(`${w} ord i stället för ${tc.ord[0]}–${tc.ord[1]}`);
  if (ord(n.rubrik) > tc.rubrikOrd + 2) why.push('en för lång rubrik');
  const tips = `${n.rubrik} ${n.text}`.match(TIPS_RE);
  if (tips) why.push(`tipsspråk ("${tips[0]}")`);
  const bad = unknownNumbers([n.rubrik, n.text], known);
  if (bad.length) why.push(`tal som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}

// Notisen som den sparas: hänvisningar i texten stryks (den trycks som i en tidning), och
// bara källor vars adress verkligen kom upp följer med.
function bygg(n, x, seen) {
  const { fix, list } = citer(n.sources, seen);
  // citer tar med de källor som hänvisas till; här är det alla notisen anger.
  fix(n.sources.map((s) => `[${s.n}]`).join(' '));
  const ren = (s) => s.replace(REF_RE, '').replace(/ {2,}/g, ' ').replace(/ +([.,;:])/g, '$1').trim();
  return {
    nr: n.nr,
    id: String(x.id),
    match: x.match || null,
    avspark: x.avspark || null,
    rubrik: ren(n.rubrik),
    text: ren(n.text),
    kallor: list.map(({ source, title, url, publishedAt }) => ({ source, title, url, publishedAt })),
  };
}

// Skriver omgångens tidning. details: match-id → data/match/<id>.json ur den publicerade
// sajten. → {ok: true, tidning, saknas, meta} eller {ok: false, error}. Fel från Claude
// Code kastas (src/analyser/claude.mjs).
export async function skrivTidning(round, { details = {}, now = () => new Date(), claude = claudeSvar } = {}) {
  const underlag = tidningsUnderlag(round, details);
  const seen = new Map();
  const read = [];
  const meta = { searches: 0, fetches: 0, seconds: 0, dollars: 0 };
  const opts = { system: systemPrompt(), model: tc.model, effort: tc.effort, timeoutMs: tc.timeoutMs };
  const fraga = `Nu är det ${nowFmt.format(now())} svensk tid.\n\nOmgångens matcher (JSON):\n${JSON.stringify(underlag)}`;
  const n = round.matcher.length;
  const klara = new Map();
  let model = tc.model;

  let r = await claude({ ...opts, prompt: fraga, tools: tc.tools, blocked: newsCfg.excludeDomains });
  let kvar = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const f of r.found) see(seen, f.url, f.title, f.date);
    read.push(...r.read);
    meta.searches += r.searches;
    meta.fetches += r.fetches;
    meta.seconds += r.seconds;
    if (r.dollars != null) meta.dollars += r.dollars;
    if (r.refused) break;
    model = r.model || model;
    const known = [underlag, read.join('\n')];
    const svar = notiserAv(r.content) || [];
    kvar = [];
    for (let i = 1; i <= n; i++) {
      if (klara.has(i)) continue;
      const notis = svar.find((x) => x.nr === i);
      const why = notis ? notisFel(notis, known) : ['ingen notis'];
      if (why.length) kvar.push({ nr: i, why, notis });
      else klara.set(i, bygg(notis, round.matcher[i - 1], seen));
    }
    if (!kvar.length || attempt === 2) break;
    const sagt = read.join('\n\n').slice(0, MAX_LAST);
    const lista = kvar.map((k) => `${k.nr}: ${k.why.join(' och ')}`).join('\n');
    r = await claude({ ...opts, tools: [], prompt: `${fraga}\n\nDu har redan läst på och kan inte söka mer. Det här läste du:\n${sagt}\n\nDitt förra svar:\n${r.content}\n\nNotiserna med de här numren gick inte igenom:\n${lista}\n\nSkriv om bara dem – ${tc.ord[0]}–${tc.ord[1]} ord, tal bara som de står i underlaget eller på en sida du har läst, och inga tips eller odds – och svara bara med samma JSON.` });
  }
  if (klara.size < Math.ceil(n * tc.minstAndel)) {
    const fel = kvar.slice(0, 4).map((k) => `${k.nr}: ${k.why.join(' och ')}`).join('; ');
    return { ok: false, error: r.refused ? 'Claude avböjde att skriva tidningen.' : `bara ${klara.size} av ${n} notiser gick igenom (${fel})` };
  }
  const tidning = {
    omgang: round.id,
    matcher: round.matcher.map((x) => String(x.id)),
    skriven: now().toISOString(),
    model,
    version: tc.promptVersion,
    notiser: [...klara.values()].sort((a, b) => a.nr - b.nr),
  };
  return { ok: true, tidning, saknas: kvar.map((k) => k.nr), meta };
}
