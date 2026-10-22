// Analysera i matchbladet (config/artikel.js), som Redaktionens analys på
// gravergrav.se: när någon trycker på Analysera i matchbladets flik Analysera
// (public/app.js) läser Claude på och skriver en artikel med rubrik, ingress,
// stycken och källor, och sedan – i samma samtal, utan att söka igen – tipset
// under den: tecknen den ringar in, raden i marginalen och en kort analys.
// Artikeln och tipset sparas och visas sedan för alla.
//
// Proxyn kör requestArticle() för POST /artikel (worker/index.mjs): finns
// artikeln lämnas den ut, skriver någon annan den just nu svarar proxyn
// pending, och annars skrivs den – högst perMatch försök per match och
// perDay artiklar per dygn. Ingenting skrivs på schema, och en skriven
// artikel skrivs inte om. Saknas tipset, eller är det äldre än
// tip.refreshHours, skrivs bara tipset om (Analysera igen): ur artikeln och
// nyheterna som hämtas just då (src/news.mjs), utan att söka på nätet.
//
// Kontrollerna: varje källa ska ha kommit upp i sökningen, i en läst sida
// eller bland nyheterna, och varje tal ska stå i underlaget eller i det
// Claude läste. Artikeln får inga tipsord, och tipsets tecken ska vara ett
// till tre av 1, X och 2. Klarar svaret inte det får Claude skriva om en
// gång.
//
// Lagringen (samma KV-namnrymd som analysen):
//   artikel:<match-id>     {article, tries, tipTries} – article är artikeln
//                          som klarade kontrollen: {title, lead, paragraphs,
//                          sources, tip, model, version, writtenAt, attempts},
//                          med tip {text, signs, note, sources, model,
//                          version, writtenAt, attempts} eller null; tries
//                          (artikeln) och tipTries (omskrivna tips):
//                          [{at, ok, error, status, cost}], status vid ett
//                          API-fel, cost vad försöket kostade (costOf)
//   artikel:dag:<datum>    antalet artiklar det dygnet
//   artikel:tips:<datum>   antalet omskrivna tips det dygnet

import ac from '../config/artikel.js';
import { payloadOf } from './analysis.mjs';
import { claudeChat, citer, see, unknownNumbers } from './research.mjs';
import { gatherNews, newsPayload } from '../src/news.mjs';

const H = 3600000;
const ID_RE = /^\d{1,12}$/;
const REF_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g;
// Artikeln ger inga tips – ett tipsord i texten ger en omskrivning.
const TIP_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*)\b/i;
const NOTES = { 1: 'spik', 2: 'halvgardera', 3: 'helgardera' };

const tz = { timeZone: 'Europe/Stockholm' };
const nowFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const kickFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, year: 'numeric', month: '2-digit', day: '2-digit' });

const key = (id) => `artikel:${id}`;
const dayKey = (now) => `artikel:dag:${dayFmt.format(now)}`;
const tipDayKey = (now) => `artikel:tips:${dayFmt.format(now)}`;
// Artikeln sparas till keepDays efter avspark.
const ttlOf = (kick, t0) => Math.max(3600, Math.round((kick + ac.keepDays * 86400000 - t0.getTime()) / 1000));

export const articlesOn = (env) => Boolean(ac.enabled && env[ac.keyEnv]);

// Artikeln som visas för matchen, eller null.
export async function currentArticle(store, id) {
  if (!store || !ID_RE.test(String(id))) return null;
  const s = await store.get(key(id));
  return (s && s.article) || null;
}

// Ska tipset skrivas om? Saknas det eller är det äldre än refreshHours.
export function tipDue(article, now) {
  const t = article && article.tip;
  return !t || now.getTime() - Date.parse(t.writtenAt) > ac.tip.refreshHours * H;
}

// Analysera: artikeln och tipset för matchen, skrivna nu om de saknas – och
// tipset omskrivet om det är gammalt. store: {get(k), put(k, v, ttlSekunder)},
// loadMatch(id) → data/match/<id>.json ur den publicerade sajten; write,
// rewrite och news: den som skriver artikeln, den som skriver om tipset och
// nyhetshämtningen (utbytbara i prov).
// → {status, body}: body är {ok: true, article} när artikeln finns (med
// tipError om artikeln skrevs nu men tipset inte klarade kontrollen),
// {ok: true, article: null, pending: true} medan någon annan skriver den och
// annars {ok: false, error} – med retry: false när ett nytt klick inte hjälper.
export async function requestArticle(id, { env, store, loadMatch, now = () => new Date(), write = writeArticle, rewrite = rewriteTip, news = gatherNews }) {
  if (!ID_RE.test(String(id == null ? '' : id))) return fail(400, 'Okänt match-id.', true);
  if (!articlesOn(env) || !store) return fail(503, 'Analyserna är avstängda.', true);
  const s = (await store.get(key(id))) || { article: null, tries: [] };
  const t0 = now();
  if (s.article) {
    if (!tipDue(s.article, t0)) return { status: 200, body: { ok: true, article: s.article } };
    return refreshTip(String(id), s, { env, store, loadMatch, t0, now, rewrite, news });
  }
  const last = s.tries[s.tries.length - 1];
  // Ett försök som inte har sparat något svar pågår – eller avbröts, och då
  // får nästa klick skriva när det borde ha varit klart.
  if (last && last.error === 'pågår' && t0.getTime() - Date.parse(last.at) < ac.timeoutMs + 60000) {
    return { status: 200, body: { ok: true, article: null, pending: true } };
  }
  if (s.tries.length >= ac.perMatch) return fail(429, 'Analysen gick inte att skriva.', true);
  const today = Number(await store.get(dayKey(t0))) || 0;
  if (today >= ac.perDay) return fail(429, 'Dagens analyser är slut – försök igen i morgon.', true);
  const d = await loadMatch(String(id));
  if (!d) return fail(404, 'Matchen finns inte på sajten.', true);
  const kick = Date.parse(d.match.kickoff);
  if (d.match.completed || !(kick > t0.getTime())) return fail(409, 'Matchen har redan börjat.', true);
  if (kick - t0.getTime() > ac.aheadDays * 24 * H) return fail(409, `Analysen kan skrivas tidigast ${ac.aheadDays} dagar före avspark.`, true);

  const ttl = ttlOf(kick, t0);
  // Försöket och dygnets räkning sparas innan Claude anropas, så att ett klick
  // till på samma match väntar in den här i stället för att betala en till.
  const tries = [...s.tries, { at: t0.toISOString(), ok: false, error: 'pågår' }];
  await store.put(key(id), { ...s, article: null, tries }, ttl);
  await store.put(dayKey(t0), today + 1, 2 * 86400);

  let r;
  try {
    r = await write(d, { env, now });
  } catch (err) {
    r = { ok: false, error: (err && err.message) || 'okänt fel' };
  }
  const cost = costOf(r.usage);
  tries[tries.length - 1] = { at: t0.toISOString(), ok: r.ok, ...(r.ok ? {} : { error: r.error }), ...(cost ? { cost } : {}) };
  await store.put(key(id), { ...s, article: r.ok ? r.article : null, tries }, ttl);
  console.log('[artikel]', JSON.stringify({ id: String(id), match: `${d.match.home} – ${d.match.away}`, ok: r.ok, error: r.ok ? undefined : r.error, tip: r.ok ? Boolean(r.article.tip) : undefined, tipError: r.tipError, cost }));
  if (!r.ok) return fail(r.status || 502, r.error);
  return { status: 200, body: { ok: true, article: r.article, ...(r.tipError ? { tipError: r.tipError } : {}) } };
}

// Analysera igen: bara tipset skrivs om, utan sökningar. s är det som är
// sparat för matchen, med artikeln.
async function refreshTip(id, s, { env, store, loadMatch, t0, now, rewrite, news }) {
  const tc = ac.tip;
  const tipTries = s.tipTries || [];
  const last = tipTries[tipTries.length - 1];
  const since = last ? t0.getTime() - Date.parse(last.at) : Infinity;
  if (last && last.error === 'pågår' && since < ac.timeoutMs + 60000) {
    return { status: 200, body: { ok: true, article: null, pending: true } };
  }
  // Ett tips som inte klarade kontrollen kostar inte igen på en stund. Efter
  // ett API-fel (status) får nästa klick försöka direkt.
  if (last && !last.ok && !last.status && last.error !== 'pågår' && since < tc.failMinutes * 60000) {
    return fail(429, `${last.error} Ett nytt försök går att göra om ${Math.ceil((tc.failMinutes * 60000 - since) / 60000)} minuter.`, true);
  }
  const today = Number(await store.get(tipDayKey(t0))) || 0;
  if (today >= tc.perDay) return fail(429, 'Dagens analyser är slut – försök igen i morgon.', true);
  const d = await loadMatch(id);
  if (!d) return fail(404, 'Matchen finns inte på sajten.', true);
  const kick = Date.parse(d.match.kickoff);
  if (d.match.completed || !(kick > t0.getTime())) return fail(409, 'Matchen har redan börjat.', true);
  if (!d.prediction || d.prediction.status !== 'ok') return fail(409, 'Prognosen är okänd för matchen – det finns inget att tippa.', true);

  const ttl = ttlOf(kick, t0);
  const tries = [...tipTries.slice(-9), { at: t0.toISOString(), ok: false, error: 'pågår' }];
  await store.put(key(id), { ...s, tipTries: tries }, ttl);
  await store.put(tipDayKey(t0), today + 1, 2 * 86400);

  let r;
  try {
    // Nyheterna sparas bara en timme i cachen. Hämtningen kastar aldrig.
    const n = await news(d.match, { store: { get: (k) => store.get(k), put: (k, v) => store.put(k, v, 3600) }, now: t0 });
    r = await rewrite(d, s.article, n, { env, now });
  } catch (err) {
    r = { ok: false, error: (err && err.message) || 'okänt fel' };
  }
  const cost = costOf(r.usage);
  tries[tries.length - 1] = { at: t0.toISOString(), ok: r.ok, ...(r.ok ? {} : { error: r.error }), ...(r.status ? { status: r.status } : {}), ...(cost ? { cost } : {}) };
  const article = r.ok ? { ...s.article, tip: r.tip } : s.article;
  await store.put(key(id), { ...s, article, tipTries: tries }, ttl);
  console.log('[tipset]', JSON.stringify({ id, match: `${d.match.home} – ${d.match.away}`, ok: r.ok, error: r.ok ? undefined : r.error, cost }));
  return r.ok ? { status: 200, body: { ok: true, article } } : fail(r.status || 502, r.error);
}

function fail(status, error, final = false) {
  return { status, body: { ok: false, error, ...(final ? { retry: false } : {}) } };
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

// Claude läser på och skriver artikeln, och sedan tipset i samma samtal.
// → {ok: true, article, tipError, usage} eller {ok: false, error, usage} –
// vid ett API-fel också status. Ett tips som inte blev av stoppar inte
// artikeln: den sparas med tip null, och tipError säger varför.
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
      const article = {
        title: parts.title.replace(REF_RE, '').replace(/\s{2,}/g, ' ').trim(),
        lead,
        paragraphs,
        sources: list,
        tip: null,
        model,
        version: ac.promptVersion,
        writtenAt: now().toISOString(),
        attempts: attempt,
      };
      // Utan prognos finns inget att tippa – tipset skrivs när den finns.
      const odds = oddsOf(d);
      if (!odds) return { ok: true, article, usage: chat.usage };
      const tip = await safeTip(() => writeTip(chat, `Artikeln är klar. Nu tipset.\n\nSajtens prognos och spelbolagens odds (JSON):\n${JSON.stringify(odds)}`, { known: [base, odds], seen, read, now }));
      return { ok: true, article: { ...article, tip: tip.ok ? tip.tip : null }, ...(tip.ok ? {} : { tipError: tip.error }), usage: chat.usage };
    }
    problem = `Artikeln hade ${why.join(' och ')}.`;
    say = `Svaret hade ${why.join(' och ')}. Skriv om det – tal bara som de står i matchens siffror eller på en sida du har öppnat, inga tips – och svara bara med samma JSON.`;
  }
  return { ok: false, error: problem, usage: chat.usage };
}

// Analysera igen: Claude skriver om tipset ur artikeln, sajtens underlag och
// nyheterna som hämtades nyss (news, gatherNews() eller null), utan att söka.
// → {ok: true, tip, usage} eller {ok: false, error, usage} – vid ett API-fel
// också status.
export async function rewriteTip(d, article, news, { env, now = () => new Date() }) {
  const t0 = now();
  const seen = new Map();
  for (const s of article.sources) see(seen, s.url, s.title, s.publishedAt);
  if (news) for (const it of news.items) see(seen, it.url, it.title, it.publishedAt);
  const base = { ...payloadOf(d), artikel: articleFor(article) };
  if (news) base.nyheter = newsFor(news);
  const read = [article.title, article.lead || '', ...article.paragraphs];
  const chat = claudeChat(env[ac.keyEnv], { ...ac, searches: 0, systemPrompt: ac.tip.systemPrompt });
  const r = await safeTip(() => writeTip(chat, `Nu är det ${nowFmt.format(t0)} svensk tid.\n\nUnderlag (JSON):\n${JSON.stringify(base)}`, { known: [base], seen, read, now }));
  return { ...r, usage: chat.usage };
}

// Tipset ur samtalet: say är frågan, known underlaget som talen får komma ur
// utöver det Claude läst (read). → {ok: true, tip} eller {ok: false, error}.
// API-fel kastas.
async function writeTip(chat, say, { known, seen, read, now }) {
  let problem = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = await chat.say(say);
    for (const f of r.found) see(seen, f.url, f.title, f.date);
    read.push(...r.read);
    if (r.refused) return { ok: false, error: `${ac.provider} avböjde att skriva tipset.` };
    const parts = tipPartsOf(r.content);
    const why = parts ? tipProblems(parts, [...known, read.join('\n')]) : ['inget svar i rätt form'];
    if (!why.length) {
      const { fix, list } = citer(parts.sources, seen);
      return {
        ok: true,
        tip: {
          text: fix(parts.text),
          signs: parts.tip.signs,
          note: parts.tip.note,
          sources: list,
          model: r.model || ac.model,
          version: ac.promptVersion,
          writtenAt: now().toISOString(),
          attempts: attempt,
        },
      };
    }
    problem = `Tipset hade ${why.join(' och ')}.`;
    say = `Svaret hade ${why.join(' och ')}. Skriv om det – tal bara som de står i underlaget eller på en sida du har öppnat, och tecknen som "1", "X", "2", två av dem eller "1X2" – och svara bara med samma JSON.`;
  }
  return { ok: false, error: problem };
}

// Ett API-fel i tipset blir ett tips som inte blev av, med felet.
async function safeTip(fn) {
  try {
    return await fn();
  } catch (err) {
    return { ok: false, error: (err && err.message) || 'okänt fel', status: err && err.status };
  }
}

// Underlaget: det analysen får, utan prognosen och oddsen – artikeln handlar
// om lagen, och dem får Claude först till tipset (oddsOf). Utan prognos bara
// matchen.
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

// Det artikeln skrevs utan: prognosen, vad som drog åt vilket håll,
// baslinjerna och spelbolagens odds. null utan prognos.
function oddsOf(d) {
  if (!d.prediction || d.prediction.status !== 'ok') return null;
  const { prognos, 'vad drog åt vilket håll': steps, 'mot baslinjerna': baselines, odds } = payloadOf(d);
  return { prognos, 'vad drog åt vilket håll': steps, 'mot baslinjerna': baselines, odds };
}

// Artikeln som Claude skrev, med källornas adresser.
function articleFor(a) {
  return {
    skriven: `${nowFmt.format(new Date(a.writtenAt))} svensk tid`,
    rubrik: a.title,
    ingress: a.lead || '',
    text: a.paragraphs.join('\n\n'),
    källor: a.sources.map((s) => ({ n: s.n, källa: s.source, rubrik: s.title, adress: s.url })),
  };
}

// Nyheterna som hämtades nyss, med adressen i stället för id – Claude
// hänvisar till dem som till artikelns källor.
function newsFor(news) {
  const out = newsPayload(news);
  out.förklaring = 'Hämtat på nätet nyss. Rapporterat i media, inte kontrollerat av Matchfixarna och inte med i prognosen. Hänvisa till en artikel med dess adress under källor.';
  if (Array.isArray(out.artiklar)) out.artiklar = out.artiklar.map(({ id, ...a }, i) => ({ ...a, adress: news.items[i].url }));
  return out;
}

// {"rubrik", "ingress", "stycken": […], "källor": […]}, också inom ```json … ```.
function partsOf(content) {
  try {
    const j = jsonOf(content);
    const title = str(j.rubrik);
    const paragraphs = Array.isArray(j.stycken) ? j.stycken.map(str).filter(Boolean) : [];
    if (!title || !paragraphs.length) return null;
    return { title, lead: str(j.ingress), paragraphs, sources: sourcesOf(j) };
  } catch {
    return null;
  }
}

// {"analys", "tecken", "marginal", "källor": […]}.
function tipPartsOf(content) {
  try {
    const j = jsonOf(content);
    const text = str(j.analys);
    if (!text) return null;
    return { text, tip: tipOf(j.tecken, j.marginal), sources: sourcesOf(j) };
  } catch {
    return null;
  }
}

const jsonOf = (content) => {
  const s = String(content || '');
  return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
};
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const sourcesOf = (j) => (Array.isArray(j['källor']) ? j['källor'].filter((x) => x && typeof x.url === 'string') : []);

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

function tipProblems(parts, known) {
  const why = [];
  if (!parts.tip) why.push('inga giltiga tecken');
  const bad = unknownNumbers([parts.text], known);
  if (bad.length) why.push(`tal som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}
