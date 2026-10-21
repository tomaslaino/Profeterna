// Artikeln inför matchen (config/artikel.js), som Redaktionens analys på
// gravergrav.se: när någon trycker på Läs på i matchbladets flik Inför
// (public/app.js) läser Claude på och skriver en artikel med rubrik, ingress,
// stycken och källor. Den sparas och visas sedan för alla, och Analysera
// bygger vidare på den (worker/research.mjs). Artikeln ger inga tips.
//
// Proxyn kör requestArticle() för POST /artikel (worker/index.mjs): finns
// artikeln lämnas den ut, skriver någon annan den just nu svarar proxyn
// pending, och annars skrivs den – högst perMatch försök per match och
// perDay artiklar per dygn. Ingenting skrivs på schema, och en skriven
// artikel skrivs inte om.
//
// Samma kontroller som analysen: varje källa ska ha kommit upp i sökningen
// eller i en läst sida, och varje tal ska stå i underlaget eller i det Claude
// läste. Klarar svaret inte det får Claude skriva om en gång.
//
// Lagringen (samma KV-namnrymd som analysen):
//   artikel:<match-id>     {article, tries: [{at, ok, error, cost}]} – article
//                          är artikeln som klarade kontrollen: {title, lead,
//                          paragraphs, sources, model, version, writtenAt,
//                          attempts}; cost vad försöket kostade (costOf)
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

// Läs på: artikeln för matchen, skriven nu om den saknas. store: {get(k),
// put(k, v, ttlSekunder)}, loadMatch(id) → data/match/<id>.json ur den
// publicerade sajten, write: den som skriver (writeArticle, utbytbar i prov).
// → {status, body}: body är {ok: true, article} när artikeln finns,
// {ok: true, article: null, pending: true} medan någon annan skriver den och
// annars {ok: false, error} – med retry: false när ett nytt klick inte hjälper.
export async function requestArticle(id, { env, store, loadMatch, now = () => new Date(), write = writeArticle }) {
  const fail = (status, error, final = false) => ({ status, body: { ok: false, error, ...(final ? { retry: false } : {}) } });
  if (!ID_RE.test(String(id == null ? '' : id))) return fail(400, 'Okänt match-id.', true);
  if (!articlesOn(env) || !store) return fail(503, 'Artiklarna är avstängda.', true);
  const s = (await store.get(key(id))) || { article: null, tries: [] };
  if (s.article) return { status: 200, body: { ok: true, article: s.article } };
  const t0 = now();
  const last = s.tries[s.tries.length - 1];
  // Ett försök som inte har sparat något svar pågår – eller avbröts, och då
  // får nästa klick skriva när det borde ha varit klart.
  if (last && last.error === 'pågår' && t0.getTime() - Date.parse(last.at) < ac.timeoutMs + 60000) {
    return { status: 200, body: { ok: true, article: null, pending: true } };
  }
  if (s.tries.length >= ac.perMatch) return fail(429, 'Artikeln gick inte att skriva.', true);
  const today = Number(await store.get(dayKey(t0))) || 0;
  if (today >= ac.perDay) return fail(429, 'Dagens artiklar är slut – försök igen i morgon.', true);
  const d = await loadMatch(String(id));
  if (!d) return fail(404, 'Matchen finns inte på sajten.', true);
  const kick = Date.parse(d.match.kickoff);
  if (d.match.completed || !(kick > t0.getTime())) return fail(409, 'Matchen har redan börjat.', true);
  if (kick - t0.getTime() > ac.aheadDays * 24 * H) return fail(409, `Artikeln kan skrivas tidigast ${ac.aheadDays} dagar före avspark.`, true);

  const ttl = Math.max(3600, Math.round((kick + ac.keepDays * 86400000 - t0.getTime()) / 1000));
  // Försöket och dygnets räkning sparas innan Claude anropas, så att ett klick
  // till på samma match väntar in den här i stället för att betala en till.
  const tries = [...s.tries, { at: t0.toISOString(), ok: false, error: 'pågår' }];
  await store.put(key(id), { article: null, tries }, ttl);
  await store.put(dayKey(t0), today + 1, 2 * 86400);

  let r;
  try {
    r = await write(d, { env, now });
  } catch (err) {
    r = { ok: false, error: (err && err.message) || 'okänt fel' };
  }
  const cost = costOf(r.usage);
  tries[tries.length - 1] = { at: t0.toISOString(), ok: r.ok, ...(r.ok ? {} : { error: r.error }), ...(cost ? { cost } : {}) };
  await store.put(key(id), { article: r.ok ? r.article : null, tries }, ttl);
  console.log('[artikel]', JSON.stringify({ id: String(id), match: `${d.match.home} – ${d.match.away}`, ok: r.ok, error: r.ok ? undefined : r.error, cost }));
  return r.ok ? { status: 200, body: { ok: true, article: r.article } } : fail(r.status || 502, r.error);
}

// Vad ett försök kostade, ur förbrukningen i varje anrop (usage) och
// priserna i config/artikel.js: text in (ny, skriven till cachen och läst ur
// den), text ut med tänkandet, och sökningarna. → {dollars, input, cacheWrite,
// cacheRead, output, searches, fetches}, eller null utan förbrukning.
export function costOf(usage, p = ac.prices) {
  if (!Array.isArray(usage) || !usage.length) return null;
  const sum = (f) => usage.reduce((a, u) => a + (Number(u && f(u)) || 0), 0);
  const t = {
    input: sum((u) => u.input_tokens),
    cacheWrite: sum((u) => u.cache_creation_input_tokens),
    cacheRead: sum((u) => u.cache_read_input_tokens),
    output: sum((u) => u.output_tokens),
    searches: sum((u) => u.server_tool_use && u.server_tool_use.web_search_requests),
    fetches: sum((u) => u.server_tool_use && u.server_tool_use.web_fetch_requests),
  };
  const dollars = (t.input * p.input + t.cacheWrite * p.cacheWrite + t.cacheRead * p.cacheRead + t.output * p.output) / 1e6 + t.searches * p.search;
  return { dollars: Math.round(dollars * 1000) / 1000, ...t };
}

// Claude läser på och skriver artikeln. → {ok: true, article, usage} eller
// {ok: false, error, usage} – vid ett API-fel också status.
export async function writeArticle(d, { env, now = () => new Date() }) {
  const t0 = now();
  const base = underlag(d);
  const seen = new Map();
  const read = [];
  const chat = claudeChat(env[ac.keyEnv], ac);
  let say = `Nu är det ${nowFmt.format(t0)} svensk tid.\n\nMatchens siffror (JSON):\n${JSON.stringify(base)}`;
  let problem = null;
  let model = ac.model;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let r;
    try {
      r = await chat.say(say);
    } catch (err) {
      return { ok: false, error: err.message, status: err.status, usage: chat.usage };
    }
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
    say = `Svaret hade ${why.join(' och ')}. Skriv om det – tal bara som de står i matchens siffror eller på en sida du har öppnat, inga tips – och svara bara med samma JSON.`;
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
  if (words < 120 || words > 330) why.push(`${words} ord i styckena i stället för 180–240`);
  if (parts.title.split(/\s+/).length > 12) why.push('en för lång rubrik');
  const tip = texts.join(' ').match(TIP_RE);
  if (tip) why.push(`tips ("${tip[0]}")`);
  const bad = unknownNumbers(texts, known);
  if (bad.length) why.push(`tal som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}
