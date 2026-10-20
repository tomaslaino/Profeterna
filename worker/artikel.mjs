// Artikeln inför matchen (config/artikel.js), som Redaktionens analys på
// gravergrav.se: inför varje match på omgångens kupong läser Claude på av sig
// självt och skriver en artikel med rubrik, ingress, stycken och källor.
// Matchbladet visar den i fliken Inför (public/artikel.js), och Analysera
// bygger vidare på den (worker/research.mjs). Artikeln ger inga tips.
//
// Proxyn kör articleTick() på ett schema ([triggers] i worker/wrangler.toml):
// varje gång skrivs högst en artikel – den match på omgångens kupong
// (samtal:aktuellt, worker/samtal.mjs) som står på tur. En match står på tur
// när den hamnar på kupongen och igen när det är rewriteAtHours timmar kvar
// till avspark, högst perMatch gånger och högst perDay artiklar per dygn.
//
// Samma kontroller som analysen: varje källa ska ha kommit upp i sökningen
// eller i en läst sida, och varje tal ska stå i underlaget eller i det Claude
// läste. Klarar svaret inte det får Claude skriva om en gång; annars står den
// förra artikeln kvar.
//
// Lagringen (samma KV-namnrymd som analysen):
//   artikel:<match-id>     {article, tries: [{at, ok, error}]} – article är
//                          den senaste artikeln som klarade kontrollen:
//                          {title, lead, paragraphs, sources, model, version,
//                          writtenAt}
//   artikel:dag:<datum>    antalet artiklar det dygnet

import ac from '../config/artikel.js';
import { payloadOf } from './analysis.mjs';
import { claudeChat, citer, see, unknownNumbers } from './research.mjs';

const H = 3600000;
const ID_RE = /^\d{1,12}$/;
const REF_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g;
// Artikeln ger inga tips – ett tipsord i texten ger en omskrivning.
const TIP_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*)\b/i;

const tz = { timeZone: 'Europe/Stockholm' };
const nowFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const kickFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, year: 'numeric', month: '2-digit', day: '2-digit' });

const key = (id) => `artikel:${id}`;
const dayKey = (now) => `artikel:dag:${dayFmt.format(now)}`;

export const articlesOn = (env) => Boolean(ac.enabled && env[ac.keyEnv]);

// Artikeln som visas för matchen, eller null.
export async function currentArticle(store, id) {
  if (!store || !ID_RE.test(String(id))) return null;
  const s = await store.get(key(id));
  return (s && s.article) || null;
}

// En körning på schemat: skriver artikeln för den match som står på tur.
// store: {get(k), put(k, v, ttlSekunder)}, loadRound() → samtal:aktuellt,
// loadMatch(id) → data/match/<id>.json ur den publicerade sajten, write: den
// som skriver (writeArticle, utbytbar i prov).
// → {id, ok, error} för matchen som skrevs, eller {skipped: varför}.
export async function articleTick({ env, store, loadRound, loadMatch, now = () => new Date(), write = writeArticle }) {
  if (!articlesOn(env) || !store) return { skipped: 'av' };
  const round = await loadRound();
  const list = round && Array.isArray(round.matcher) ? round.matcher.filter((m) => m && ID_RE.test(String(m.id))) : [];
  if (!list.length) return { skipped: 'ingen omgång' };
  const t0 = now();
  const today = Number(await store.get(dayKey(t0))) || 0;
  if (today >= ac.perDay) return { skipped: 'dagens artiklar är slut' };

  const states = await Promise.all(list.map((m) => store.get(key(m.id))));
  const next = list
    .map((m, i) => ({ m, s: states[i] || { article: null, tries: [] }, kick: Date.parse(m.avspark) }))
    .filter((x) => due(x.kick, x.s, t0))
    .sort((a, b) => a.kick - b.kick)[0];
  if (!next) return { skipped: 'inget på tur' };

  const { m, s } = next;
  const ttl = Math.max(3600, Math.round((next.kick + ac.keepDays * 86400000 - t0.getTime()) / 1000));
  // Försöket och dygnets räkning sparas innan Claude anropas, så att nästa
  // körning inte tar samma match medan den här fortfarande läser.
  const tries = [...s.tries, { at: t0.toISOString(), ok: false, error: 'pågår' }];
  await store.put(key(m.id), { ...s, tries }, ttl);
  await store.put(dayKey(t0), today + 1, 2 * 86400);

  let r;
  try {
    const d = await loadMatch(String(m.id));
    if (!d) r = { ok: false, error: 'matchen finns inte på sajten' };
    else if (d.match.completed || Date.parse(d.match.kickoff) <= t0.getTime()) r = { ok: false, error: 'matchen har börjat' };
    else r = await write(d, { env, now });
  } catch (err) {
    r = { ok: false, error: (err && err.message) || 'okänt fel' };
  }
  tries[tries.length - 1] = { at: t0.toISOString(), ok: r.ok, ...(r.ok ? {} : { error: r.error }) };
  await store.put(key(m.id), { article: r.ok ? r.article : s.article, tries }, ttl);
  return { id: m.id, match: m.match, ok: r.ok, error: r.ok ? null : r.error, usage: r.usage };
}

// Står matchen på tur? Första gången när den är på kupongen (inom aheadDays),
// sedan när en omskrivningstid (rewriteAtHours före avspark) har passerats
// efter att artikeln skrevs, och när prompten har bytts. Ett misslyckat
// försök görs om efter retryMinutes.
export function due(kick, s, now) {
  const t = now.getTime();
  if (!Number.isFinite(kick) || kick - t <= ac.lastHours * H || kick - t > ac.aheadDays * 24 * H) return false;
  const tries = (s && s.tries) || [];
  if (tries.length >= ac.perMatch) return false;
  const last = tries[tries.length - 1];
  if (last && !last.ok) return t - Date.parse(last.at) >= ac.retryMinutes * 60000;
  const a = s && s.article;
  if (!a) return true;
  if (a.version !== ac.promptVersion) return true;
  const written = Date.parse(a.writtenAt);
  return ac.rewriteAtHours.some((h) => kick - h * H <= t && written < kick - h * H);
}

// Claude läser på och skriver artikeln. → {ok: true, article, usage} eller
// {ok: false, error, usage}. API-fel kastas.
export async function writeArticle(d, { env, now = () => new Date() }) {
  const t0 = now();
  const base = underlag(d);
  const seen = new Map();
  const read = [];
  const chat = claudeChat(env[ac.keyEnv], ac);
  let say = `Nu är det ${nowFmt.format(t0)} svensk tid.\n\nUnderlag (JSON):\n${JSON.stringify(base)}`;
  let problem = null;
  let model = ac.model;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = await chat.say(say);
    model = r.model || model;
    for (const f of r.found) see(seen, f.url, f.title, f.date);
    read.push(...r.read);
    if (r.refused) { problem = `${ac.provider} avböjde att skriva artikeln.`; break; }
    const parts = partsOf(r.content);
    const why = parts ? problems(parts, [base, read.join('\n')]) : ['inget svar i rätt form'];
    if (!why.length) {
      const { fix, list } = citer(parts.sources, seen);
      const lead = fix(parts.lead);
      const paragraphs = parts.paragraphs.map(fix).filter(Boolean);
      return {
        ok: true,
        article: {
          title: parts.title.replace(REF_RE, '').replace(/\s{2,}/g, ' ').trim(),
          lead,
          paragraphs,
          sources: list,
          model,
          version: ac.promptVersion,
          writtenAt: now().toISOString(),
          attempts: attempt,
        },
        usage: chat.usage,
      };
    }
    problem = `Artikeln hade ${why.join(' och ')}.`;
    say = `Svaret hade ${why.join(' och ')}. Skriv om det – tal bara som de står i underlaget eller på en sida du har öppnat, inga tips – och svara bara med samma JSON.`;
  }
  return { ok: false, error: problem, usage: chat.usage };
}

// Underlaget: det analysen får, utan prognosen och oddsen – artikeln handlar
// om lagen, och tipset är Analyseras. Utan prognos bara matchen.
function underlag(d) {
  const m = d.match;
  if (d.prediction && d.prediction.status === 'ok') {
    const { prognos, 'vad drog åt vilket håll': steps, 'mot baslinjerna': baselines, odds, ...rest } = payloadOf(d);
    return rest;
  }
  const match = { tävling: m.compName, avspark: `${kickFmt.format(new Date(m.kickoff))} svensk tid`, hemmalag: m.home, bortalag: m.away };
  if (m.round) match.omgång = m.round;
  if (m.venue) match.arena = m.venue;
  return { match };
}

// {"rubrik", "ingress", "stycken": […], "källor": […]}, också inom ```json … ```.
function partsOf(content) {
  try {
    const s = String(content || '');
    const j = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
    const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const title = str(j.rubrik);
    const paragraphs = Array.isArray(j.stycken) ? j.stycken.map(str).filter(Boolean) : [];
    if (!title || !paragraphs.length) return null;
    const sources = Array.isArray(j['källor']) ? j['källor'].filter((x) => x && typeof x.url === 'string') : [];
    return { title, lead: str(j.ingress), paragraphs, sources };
  } catch {
    return null;
  }
}

function problems(parts, known) {
  const why = [];
  const texts = [parts.title, parts.lead, ...parts.paragraphs];
  const words = parts.paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  if (words < 200 || words > 550) why.push(`${words} ord i styckena i stället för 300–400`);
  if (parts.title.split(/\s+/).length > 12) why.push('en för lång rubrik');
  const tip = texts.join(' ').match(TIP_RE);
  if (tip) why.push(`tips ("${tip[0]}")`);
  const bad = unknownNumbers(texts, known);
  if (bad.length) why.push(`tal som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}
