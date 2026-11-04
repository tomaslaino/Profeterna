// Kontrollerna av artikeln och tipset (scripts/analyser/skriv.mjs):
//   - varje källa ska vara en adress som kom upp i en sökning eller på en läst
//     sida – annars stryks hänvisningen (citer),
//   - varje tal i texterna ska stå i underlaget eller i det Claude läste
//     (unknownNumbers),
//   - artikeln får inga tipsord, och tipsets tecken ska vara ett till tre av 1,
//     X och 2.

import newsCfg from '../../config/news.js';
import { foreignNumbers } from './underlag.mjs';

// Hänvisningar i texten: [2] eller [1, 4].
const REF_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g;
// Artikeln ger inga tips – ett tipsord i texten ger en omskrivning.
const TIP_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*)\b/i;
const NOTES = { 1: 'spik', 2: 'halvgardera', 3: 'helgardera' };

// Talen i texterna (utan hänvisningarna) som varken står i underlaget eller i
// det Claude läste.
export function unknownNumbers(texts, known) {
  return foreignNumbers(texts.filter(Boolean).join('\n').replace(REF_RE, ''), known);
}

// Hänvisningarna numreras om 1, 2, 3 … i den ordning de först citeras, och
// bara källor med en adress som verkligen kom upp följer med. En hänvisning
// till något annat stryks. → {fix(text), list}: fix numrerar om en text,
// list är källistan för texterna som gått genom fix, i den ordningen.
export function citer(sources, seen) {
  const given = new Map(sources.map((s) => [String(s.n), s]));
  const byUrl = new Map(); // normaliserad adress → nytt nummer
  const list = [];
  const numberOf = (k) => {
    const s = given.get(k);
    const key = s && normUrl(s.url);
    const hit = key && seen.get(key);
    if (!hit || blockedUrl(hit.url)) return null;
    if (!byUrl.has(key)) {
      const host = new URL(hit.url).hostname.replace(/^www\./, '');
      const name = typeof s['källa'] === 'string' && s['källa'].trim().length <= 40 ? s['källa'].trim() : host;
      // Utan sajtens namn på slutet ("… - Yahoo Sports"); det står efter rubriken.
      const title = (hit.title || (typeof s.rubrik === 'string' && s.rubrik.trim()) || host).replace(/^(.{20,}?)\s+[|–-]\s+[^|–-]{2,30}$/, '$1');
      list.push({ n: list.length + 1, source: name, title, url: hit.url, publishedAt: hit.date });
      byUrl.set(key, list.length);
    }
    return byUrl.get(key);
  };
  const fix = (text) => (text ? text.replace(REF_RE, (m, ks) => {
    const ns = [...new Set(ks.split(/\s*[,;]\s*/).map(numberOf).filter(Boolean))].sort((a, b) => a - b);
    return ns.length ? `[${ns.join(', ')}]` : '';
  })
    // [2][3] → [2, 3]
    .replace(/\[(\d+(?:, \d+)*)\](?:\s*\[(\d+(?:, \d+)*)\])+/g, (m) => `[${[...new Set(m.match(/\d+/g).map(Number))].sort((a, b) => a - b).join(', ')}]`)
    .replace(/ {2,}/g, ' ')
    .replace(/ +([.,;:])/g, '$1')
    .trim() : null);
  return { fix, list };
}

export function see(seen, url, title, date) {
  const key = normUrl(url);
  if (!key) return;
  const old = seen.get(key);
  const iso = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null;
  seen.set(key, { url: old ? old.url : String(url).trim(), title: (old && old.title) || (title ? String(title).trim() : null), date: (old && old.date) || iso });
}

// Adressen utan https, www, ankare, spårningsparametrar och snedstreck på slutet.
function normUrl(u) {
  try {
    const x = new URL(String(u || '').trim().replace(/[.,;:]+$/, ''));
    if (!/^https?:$/.test(x.protocol)) return null;
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|ref$)/i.test(k)) x.searchParams.delete(k);
    return `${x.hostname.replace(/^www\./, '').toLowerCase()}${x.pathname.replace(/\/+$/, '')}${x.search}`;
  } catch {
    return null;
  }
}

function blockedUrl(u) {
  const host = new URL(u).hostname.replace(/^www\./, '');
  return newsCfg.excludeDomains.some((d) => host === d || host.endsWith(`.${d}`));
}

// ---------- svaret ----------

export const jsonOf = (content) => {
  const s = String(content || '');
  return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
};
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const sourcesOf = (j) => (Array.isArray(j['källor']) ? j['källor'].filter((x) => x && typeof x.url === 'string') : []);

// {"rubrik", "ingress", "stycken": […], "källor": […], "tips": {…}}, också inom
// ```json … ```. tip: null när tipset saknas eller inte går att läsa.
export function partsOf(content) {
  try {
    const j = jsonOf(content);
    const title = str(j.rubrik);
    const paragraphs = Array.isArray(j.stycken) ? j.stycken.map(str).filter(Boolean) : [];
    if (!title || !paragraphs.length) return null;
    return { title, lead: str(j.ingress), paragraphs, sources: sourcesOf(j), tip: tipPartsOf(j.tips) };
  } catch {
    return null;
  }
}

// {"analys", "tecken", "marginal", "källor": […]}.
function tipPartsOf(j) {
  if (!j || typeof j !== 'object') return null;
  const text = str(j.analys);
  return text ? { text, tip: tipOf(j.tecken, j.marginal), sources: sourcesOf(j) } : null;
}

// "1X" → {signs: [0, 1], note: 'halvgardera'}. Marginalen är Claudes egen
// rad om den är kort och utan siffror, annars tipsspråket för antalet tecken.
function tipOf(raw, note) {
  const s = String(raw || '').toUpperCase();
  if (!s.trim() || /[^1X2\s,/·–-]/.test(s)) return null;
  const signs = ['1', 'X', '2'].map((x, i) => (s.includes(x) ? i : -1)).filter((i) => i >= 0);
  if (!signs.length) return null;
  const n = typeof note === 'string' ? note.trim().replace(/[.!]+$/, '') : '';
  const own = n && n.split(/\s+/).length <= 3 && n.length <= 24 && !/\d/.test(n);
  return { signs, note: own ? n : NOTES[signs.length] };
}

// Det som är fel i artikeln. known: underlaget och det Claude läste.
export function problems(parts, known) {
  const why = [];
  const texts = [parts.title, parts.lead, ...parts.paragraphs];
  const words = parts.paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  if (words < 120 || words > 330) why.push(`${words} ord i styckena i stället för 180–240`);
  if (parts.title.split(/\s+/).length > 12) why.push('en för lång rubrik');
  const tip = texts.join(' ').match(TIP_RE);
  if (tip) why.push(`tips ("${tip[0]}")`);
  const bad = unknownNumbers(texts, known);
  if (bad.length) why.push(`tal som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}

// Det som är fel i tipset.
export function tipProblems(parts, known) {
  if (!parts) return ['inget tips i rätt form'];
  const why = [];
  if (!parts.tip) why.push('inga giltiga tecken');
  const bad = unknownNumbers([parts.text], known);
  if (bad.length) why.push(`tal i tipset som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}
