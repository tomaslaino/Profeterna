// Hasse Backe (fiktiv) i tobaksaffären: artikeln och tipset (worker/artikel.mjs)
// med hans röst. Claude får den färdiga analysen, personan i
// prompts/hasse-backe.md och två–tre lottade fraser ur frasbanken
// (config/hasse.js) och skriver om texten utan att söka. Tecknen kommer alltid
// ur tipset och skrivs aldrig om.
//
// Kontrollerna (granska): varje tal i analysen ska stå kvar och inget nytt ska
// ha kommit till, de inringade tecknen ska stå i sista stycket, inga citat eller
// namn utanför analysen, de lottade fraserna ska användas och inga andra ur
// banken, och Bielsa-orden bara om de lottats. Klarar svaret inte det får Claude
// skriva om en gång, och annars blir det ingen text.
//
// Lagringen (samma KV-namnrymd som analysen):
//   hasse:<match-id>    {hasse, tries} – hasse: {stycken, tips (tipsets
//                       writtenAt), uppdrag, model, version, writtenAt,
//                       attempts}; tries: [{at, ok, error, cost}]
//   hasse:dag:<datum>   antalet texter det dygnet
//
// requestHasse(id, { env, store, persona }) → {status, body}: body är
// {ok: true, hasse} när texten finns, {ok: true, hasse: null, saknas: true} när
// artikeln eller tipset inte är skrivna än (POST /artikel först),
// {ok: true, hasse: null, pending: true} medan någon annan skriver den och
// annars {ok: false, error}.

import hc from '../config/hasse.js';
import { currentArticle } from './artikel.mjs';
import { claudeChat } from './research.mjs';

const ID_RE = /^\d{1,12}$/;
const REF_RE = /\s*\[\d+(?:\s*[,;]\s*\d+)*\]/g;
const key = (id) => `hasse:${id}`;
const dayFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayKey = (now) => `hasse:dag:${dayFmt.format(now)}`;

export const hasseOn = (env) => Boolean(hc.enabled && env[hc.keyEnv]);

// Tecknen i tipset (0 = 1, 1 = X, 2 = 2) som kupongen skriver dem och i ord.
const ORD = ['ettan', 'krysset', 'tvåan'];
const TECKEN_RE = [/\b(ettan?|hemmaseger\w*|hemmavinst\w*)\b/i, /\b(kryss\w*|oavgjort)\b/i, /\b(tvåan?|bortaseger\w*|bortavinst\w*)\b/i];

// ---------- uppdraget: fraserna som lottas ----------

// Samma match och version ger samma lottning.
function lotter(s) {
  let h = 1779033703;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
function ta(lista, n, sl) {
  const kvar = [...lista];
  const ut = [];
  while (ut.length < n && kvar.length) ut.push(kvar.splice(Math.floor(sl() * kvar.length), 1)[0]);
  return ut;
}

const utanRef = (t) => String(t || '').replace(REF_RE, '').trim();
// Analysen så som Claude får den: utan hänvisningar och utan källor.
export function kallan(article) {
  return { rubrik: article.title, ingress: utanRef(article.lead), stycken: (article.paragraphs || []).map(utanRef), tips: { text: utanRef(article.tip && article.tip.text), marginal: article.tip && article.tip.note } };
}
const texten = (k) => [k.rubrik, k.ingress, ...k.stycken, k.tips.text, k.tips.marginal].filter(Boolean).join('\n');

export function uppdrag(id, article) {
  const sl = lotter(`${id}:${hc.promptVersion}`);
  const fraser = ta(hc.fraser, sl() < 0.5 ? 2 : 3, sl);
  const krydda = sl() < hc.kryddaChans ? ta(hc.kryddor, 1, sl)[0] : null;
  const bielsa = new RegExp(hc.bielsaNar, 'i').test(texten(kallan(article))) ? ta(hc.bielsaOrd, sl() < 0.5 ? 1 : 2, sl) : [];
  return { fraser, krydda, bielsa };
}

// ---------- kontrollerna ----------

const NUM_RE = /(?<![\d.,])\d+(?:[.,]\d+)?/g;
const ORDTAL = { noll: 0, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12, tretton: 13, fjorton: 14, femton: 15, sexton: 16, sjutton: 17, arton: 18, nitton: 19, tjugo: 20 };
const ORDTAL_RE = new RegExp(`(?<![\\p{L}\\d])(${Object.keys(ORDTAL).join('|')})(?![\\p{L}\\d])`, 'giu');
// Talen i en text, siffror och räkneord lika.
export function talI(t) {
  const s = new Set();
  for (const m of t.matchAll(NUM_RE)) s.add(String(parseFloat(m[0].replace(',', '.'))));
  for (const m of t.matchAll(ORDTAL_RE)) s.add(String(ORDTAL[m[1].toLowerCase()]));
  return s;
}
const enkel = (t) => t.toLowerCase().replace(/[.,!?…:;]/g, ' ').replace(/\s+/g, ' ').trim();
const har = (t, fras) => enkel(t).includes(enkel(fras));

// Namnen: ord med stor bokstav mitt i en mening.
function namnI(t) {
  const ut = new Set();
  for (const mening of t.split(/(?<=[.!?…:])\s+|\n+/)) {
    const ord = mening.trim().replace(/^["“”«]+/, '').split(/\s+/);
    for (const o of ord.slice(1)) {
      const r = o.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
      if (/^\p{Lu}\p{L}{2,}/u.test(r)) ut.add(r);
    }
  }
  return ut;
}

// → en lista med vad som är fel (tom = godkänd).
export function granska(stycken, article, u) {
  const fel = [];
  if (!Array.isArray(stycken) || !stycken.length || stycken.some((s) => typeof s !== 'string' || !s.trim())) return ['svaret saknar stycken'];
  const text = stycken.join('\n');
  const k = kallan(article);
  const kalla = texten(k);
  const inne = talI(kalla);
  const ute = talI(text);
  const tillat = new Set(inne);
  if (har(text, hc.bielsaCitat)) tillat.add('28');
  const nya = [...ute].filter((x) => !tillat.has(x));
  if (nya.length) fel.push(`talen ${nya.join(', ')} står inte i analysen`);
  const borta = [...inne].filter((x) => !ute.has(x));
  if (borta.length) fel.push(`talen ${borta.join(', ')} ur analysen saknas`);
  const signs = (article.tip && article.tip.signs) || [];
  const sista = stycken[stycken.length - 1];
  for (const n of signs) if (!TECKEN_RE[n].test(sista)) fel.push(`${ORD[n]} står inte i sista stycket`);
  if (/\[\d/.test(text)) fel.push('hänvisningar i hakparentes');
  const tillatet = [hc.bielsaCitat, hc.bielsaTillbaka, ...hc.fraser, ...(u.krydda ? [u.krydda] : [])];
  for (const m of text.matchAll(/["“”«»]([^"“”«»]{4,})["“”«»]/g)) {
    if (!har(kalla, m[1]) && !tillatet.some((f) => har(m[1], f) || har(f, m[1]))) fel.push(`citatet "${m[1]}" står inte i analysen`);
  }
  const kanda = new Set([...namnI(kalla), ...kalla.split(/[^\p{L}]+/u)]);
  for (const f of tillatet) for (const o of f.split(/[^\p{L}]+/u)) kanda.add(o);
  for (const o of ['Hasse', 'Backe', 'Bielsa', 'Svennis', 'Manchester', 'City', 'Back', 'Ursäkta', ...u.bielsa]) kanda.add(o);
  const okanda = [...namnI(text)].filter((o) => !kanda.has(o));
  if (okanda.length) fel.push(`namnen ${okanda.join(', ')} står inte i analysen`);
  const fick = u.fraser.filter((f) => har(text, f));
  if (fick.length < Math.min(2, u.fraser.length)) fel.push(`använd fraserna: ${u.fraser.join(', ')}`);
  const andra = hc.fraser.filter((f) => !u.fraser.includes(f) && har(text, f));
  if (andra.length) fel.push(`de här fraserna är inte med den här gången: ${andra.join(', ')}`);
  if (u.krydda && !har(text, u.krydda)) fel.push(`kryddan ska stå ordagrant: ${u.krydda}`);
  const bielsa = hc.bielsaOrd.filter((o) => har(text, o));
  const fel2 = bielsa.filter((o) => !u.bielsa.includes(o));
  if (fel2.length) fel.push(`Bielsa-orden ${fel2.join(', ')} är inte med den här gången`);
  if (u.bielsa.length && !har(text, 'Back to basis')) fel.push('Bielsa-orden ska följas av "Ursäkta. Back to basis."');
  return fel;
}

// ---------- samtalet ----------

const costOf = (usage) => {
  const p = hc.prices;
  const c = (usage || []).reduce((s, u) => s + (u.input_tokens || 0) * p.input + (u.cache_creation_input_tokens || 0) * p.cacheWrite + (u.cache_read_input_tokens || 0) * p.cacheRead + (u.output_tokens || 0) * p.output, 0) / 1e6;
  return c ? Number(c.toFixed(4)) : null;
};
const jsonOf = (s) => JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));

// Texten för artikeln. persona: innehållet i prompts/hasse-backe.md.
export async function writeHasse(id, article, { env, persona, chat = claudeChat }) {
  const u = uppdrag(id, article);
  const c = chat(env[hc.keyEnv], { ...hc, systemPrompt: `${persona.trim()}\n\n${hc.format}` });
  const signs = article.tip.signs;
  const rader = [
    `Analysen:\n${JSON.stringify(kallan(article))}`,
    `Tecknen som ringas in: ${signs.map((n) => ORD[n]).join(' och ')}.`,
    `Dina signaturfraser den här gången: ${u.fraser.join(' · ')}.`,
    u.krydda ? `Din krydda den här gången: ${u.krydda}` : 'Ingen krydda den här gången.',
    u.bielsa.length ? `Dina Bielsa-ord den här gången, för något som står i analysen: ${u.bielsa.join(', ')}.` : 'Inga Bielsa-ord den här gången.',
  ];
  let fel = [];
  let attempts = 0;
  let meddelande = rader.join('\n\n');
  for (; attempts < 2;) {
    attempts++;
    const r = await c.say(meddelande);
    if (r.refused) return { ok: false, error: 'Texten nekades.', usage: c.usage };
    let stycken = null;
    try { stycken = jsonOf(r.content).stycken; } catch { fel = ['svaret gick inte att läsa som JSON']; }
    if (stycken) {
      fel = granska(stycken, article, u);
      if (!fel.length) return { ok: true, usage: c.usage, hasse: { stycken: stycken.map((s) => s.trim()), tips: article.tip.writtenAt, uppdrag: u, model: r.model, version: hc.promptVersion, writtenAt: new Date().toISOString(), attempts } };
    }
    meddelande = `Det här stämmer inte:\n- ${fel.join('\n- ')}\n\nSkriv om hela svaret som JSON.`;
  }
  return { ok: false, error: `Texten klarade inte kontrollen: ${fel.join('; ')}.`, fel, usage: c.usage };
}

// ---------- tjänsten ----------

const giltig = (h, article) => h && article.tip && h.tips === article.tip.writtenAt && h.version === hc.promptVersion;
const fail = (status, error, final = false) => ({ status, body: { ok: false, error, ...(final ? { retry: false } : {}) } });

export async function currentHasse(store, id) {
  if (!store || !ID_RE.test(String(id))) return null;
  const a = await currentArticle(store, id);
  if (!a) return null;
  const s = await store.get(key(id));
  return s && giltig(s.hasse, a) ? s.hasse : null;
}

export async function requestHasse(id, { env, store, persona, now = () => new Date(), write = writeHasse }) {
  if (!ID_RE.test(String(id == null ? '' : id))) return fail(400, 'Okänt match-id.', true);
  if (!hasseOn(env) || !store) return fail(503, 'Hasse är inte på plats.', true);
  const article = await currentArticle(store, id);
  if (!article || !article.tip) return { status: 200, body: { ok: true, hasse: null, saknas: true } };
  const s = (await store.get(key(id))) || { hasse: null, tries: [] };
  if (giltig(s.hasse, article)) return { status: 200, body: { ok: true, hasse: s.hasse } };
  const t0 = now();
  const tries = (s.tries || []).filter((x) => x.tips === article.tip.writtenAt);
  const last = tries[tries.length - 1];
  if (last && last.error === 'pågår' && t0.getTime() - Date.parse(last.at) < hc.timeoutMs + 60000) return { status: 200, body: { ok: true, hasse: null, pending: true } };
  if (tries.length >= hc.perMatch) return fail(429, 'Texten gick inte att skriva.', true);
  const today = Number(await store.get(dayKey(t0))) || 0;
  if (today >= hc.perDay) return fail(429, 'Det räcker för i dag.', true);
  const ttl = hc.keepDays * 86400;
  tries.push({ at: t0.toISOString(), tips: article.tip.writtenAt, ok: false, error: 'pågår' });
  await store.put(key(id), { ...s, tries }, ttl);
  await store.put(dayKey(t0), today + 1, 2 * 86400);
  let r;
  try {
    r = await write(id, article, { env, persona });
  } catch (err) {
    r = { ok: false, error: (err && err.message) || 'okänt fel' };
  }
  const cost = costOf(r.usage);
  tries[tries.length - 1] = { at: t0.toISOString(), tips: article.tip.writtenAt, ok: r.ok, ...(r.ok ? {} : { error: r.error }), ...(cost ? { cost } : {}) };
  await store.put(key(id), { hasse: r.ok ? r.hasse : s.hasse, tries }, ttl);
  console.log('[hasse]', JSON.stringify({ id: String(id), ok: r.ok, error: r.ok ? undefined : r.error, cost, forsok: r.hasse && r.hasse.attempts }));
  return r.ok ? { status: 200, body: { ok: true, hasse: r.hasse } } : fail(502, r.error);
}

export { costOf };
