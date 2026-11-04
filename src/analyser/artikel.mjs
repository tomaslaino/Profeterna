// Analysen av en match: Claude Code läser på (bara WebSearch och WebFetch) och
// skriver artikeln och tipset under den i samma svar, med rösten i
// prompts/analys-rost.md. Prompten står i config/analyser.js och kontrollerna i
// src/analyser/kontroller.mjs. Klarar svaret inte kontrollerna får Claude skriva
// om det en gång, utan verktyg men med allt den läste. Klarar artikeln sig men inte
// tipset sparas artikeln ändå.

import ac from '../../config/analyser.js';
import newsCfg from '../../config/news.js';
import { payloadOf } from './underlag.mjs';
import { citer, see, partsOf, problems, tipProblems } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';

const REF_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g;
const tz = { timeZone: 'Europe/Stockholm' };
const nowFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const kickFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
// Det Claude läste kan bli långt; så mycket följer med till en omskrivning.
const MAX_LAST = 60000;

const harPrognos = (d) => Boolean(d.prediction && d.prediction.status === 'ok');

// Underlaget: det matchbladet visar. Utan prognos bara matchen, och då inget tips.
function underlag(d) {
  if (harPrognos(d)) return payloadOf(d);
  const m = d.match;
  const match = { tävling: m.compName, avspark: `${kickFmt.format(new Date(m.kickoff))} svensk tid`, hemmalag: m.home, bortalag: m.away };
  if (m.round) match.omgång = m.round;
  if (m.venue) match.arena = m.venue;
  return { match };
}

const TECKEN = ['1', 'X', '2'];

// Hela texten i en sträng: posten ska kunna läsas utan sajten.
function helText(a) {
  const tip = a.tip ? [`Tipset: ${a.tip.signs.map((i) => TECKEN[i]).join('')} (${a.tip.note})`, a.tip.text] : [];
  return [a.title, a.lead, ...a.paragraphs, ...tip].filter(Boolean).join('\n\n');
}

// d: data/match/<id>.json, rost: innehållet i prompts/analys-rost.md.
// → {ok: true, entry, tipError, meta: {searches, fetches, seconds, dollars}} eller
// {ok: false, error}. Fel från Claude Code kastas (src/analyser/claude.mjs).
export async function skrivAnalys(d, { rost, now = () => new Date(), claude = claudeSvar }) {
  const base = underlag(d);
  const m = d.match;
  const seen = new Map();
  const read = [];
  const meta = { searches: 0, fetches: 0, seconds: 0, dollars: 0 };
  const opts = { system: `${ac.systemPrompt}\n\n${rost.trim()}`, model: ac.model, effort: ac.effort, timeoutMs: ac.timeoutMs };
  const fraga = `Nu är det ${nowFmt.format(now())} svensk tid.\n\nMatchens siffror (JSON):\n${JSON.stringify(base)}`;

  let r = await claude({ ...opts, prompt: fraga, tools: ac.tools, blocked: newsCfg.excludeDomains });
  let problem = null;
  let artikelnHaller = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const f of r.found) see(seen, f.url, f.title, f.date);
    read.push(...r.read);
    meta.searches += r.searches;
    meta.fetches += r.fetches;
    meta.seconds += r.seconds;
    if (r.dollars != null) meta.dollars += r.dollars;
    if (r.refused) return { ok: false, error: 'Claude avböjde att skriva analysen.' };
    const parts = partsOf(r.content);
    const known = [base, read.join('\n')];
    const artikel = parts ? problems(parts, known) : ['inget svar i rätt form'];
    const tips = parts && harPrognos(d) ? tipProblems(parts.tip, known) : [];
    if (parts && !artikel.length) artikelnHaller = { parts, model: r.model, attempt };
    if (!artikel.length && !tips.length) return { ok: true, meta, entry: bygg(d, parts, seen, r.model, attempt, now) };
    const why = [...artikel, ...tips];
    problem = `Svaret hade ${why.join(' och ')}.`;
    if (attempt === 2) break;
    const sagt = read.join('\n\n').slice(0, MAX_LAST);
    r = await claude({ ...opts, tools: [], prompt: `${fraga}\n\nDu har redan läst på och kan inte söka mer. Det här läste du:\n${sagt}\n\nDitt förra svar:\n${r.content}\n\n${problem} Skriv om det – tal bara som de står i matchens siffror eller på en sida du har öppnat, inga tips i artikeln, och tecknen som "1", "X", "2", två av dem eller "1X2" – och svara bara med samma JSON.` });
  }
  if (artikelnHaller) {
    const { parts, model, attempt } = artikelnHaller;
    return { ok: true, meta, tipError: problem, entry: bygg(d, { ...parts, tip: null }, seen, model, attempt, now) };
  }
  return { ok: false, error: `${m.home} – ${m.away}: ${problem}` };
}

// Posten i data/analyser.json. id, text och writtenAt är hela analysen; resten är
// samma delar som matchbladet ritar.
function bygg(d, parts, seen, model, attempts, now) {
  const m = d.match;
  const { fix, list } = citer(parts.sources, seen);
  const at = now().toISOString();
  const entry = {
    id: String(m.id),
    match: `${m.home} – ${m.away}`,
    avspark: m.kickoff,
    writtenAt: at,
    text: '',
    author: ac.rost.namn,
    title: parts.title.replace(REF_RE, '').replace(/\s{2,}/g, ' ').trim(),
    lead: fix(parts.lead),
    paragraphs: parts.paragraphs.map(fix).filter(Boolean),
    sources: list,
    tip: null,
    hasse: null,
    model,
    version: ac.promptVersion,
    attempts,
  };
  if (parts.tip && parts.tip.tip) {
    const t = citer(parts.tip.sources, seen);
    entry.tip = { text: t.fix(parts.tip.text), signs: parts.tip.tip.signs, note: parts.tip.tip.note, sources: t.list, model, version: ac.promptVersion, writtenAt: at, attempts };
  }
  entry.text = helText(entry);
  return entry;
}
