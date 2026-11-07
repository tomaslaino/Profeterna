// Hasse Backe (fiktiv) i tobaksaffären: det viktigaste ur analysen (artikeln och
// tipset) med hans röst, lika kort som tipsets analys. Macen skriver texten i förväg
// (scripts/analyser/skriv.mjs): Claude får den färdiga analysen, spelbolagens odds,
// sajtens prognos och kollegans tecken (oddsen), personan i prompts/hasse-backe.md och
// två lottade uttryck ur frasbanken (config/hasse.js) och skriver utan verktyg. Tecknen
// och resultatet bestämmer han själv, och han får gå emot både oddsen och kollegan när
// han har skäl. På sajten låtsas han analysera (public/rum-hasse.js).
//
// Kontrollerna (granska): inga tal, citat eller namn utanför analysen och oddsen, högst
// maxOrd ord, inga källor ("enligt …"), ingen kollega och inget "i morgon", tecknen som
// "1", "X", "2" och i ord i sista stycket, resultatet 0–4 mål per lag inom tecknen och
// inte i texten, Bielsa-orden bara om de lottats och inget ur den påhittade kollegans värld. Klarar svaret inte det får
// Claude skriva om en gång, och annars blir det ingen text.
//
// Språket (sprakfel): en läsare utan personan pekar ut det som inte är svenska, och då
// får han skriva om. Språket fäller aldrig en text: blir omskrivningen sämre är det
// den förra som gäller.
//
// Texten sparas i analysens post i data/analyser.json: hasse: {stycken, tecken
// ([0 = 1, 1 = X, 2 = 2]), resultat ("3–1", hemma–borta), tips (tipsets writtenAt),
// uppdrag, model, version, writtenAt, attempts}.

import hc from '../../config/hasse.js';
import ac from '../../config/analyser.js';
import { claudeSvar, Stopp } from './claude.mjs';
import { pct3, pctOdds } from './underlag.mjs';

const REF_RE = /\s*\[\d+(?:\s*[,;]\s*\d+)*\]/g;

// Tecknen i tipset (0 = 1, 1 = X, 2 = 2) som kupongen skriver dem och i ord.
const ORD = ['ettan', 'krysset', 'tvåan'];
const KORT = ['1', 'X', '2'];
const TECKEN_RE = [/\b(ettan?|hemmaseger\w*|hemmavinst\w*)\b/i, /\b(kryss\w*|oavgjort)\b/i, /\b(tvåan?|bortaseger\w*|bortavinst\w*)\b/i];

// "1", "X2", "1X2" … → [0], [1, 2], [0, 1, 2], eller null.
export function teckenAv(t) {
  if (typeof t !== 'string') return null;
  const s = t.toUpperCase().replace(/\s+/g, '');
  if (!/^[1X2]{1,3}$/.test(s) || new Set(s).size !== s.length) return null;
  return [0, 1, 2].filter((n) => s.includes(KORT[n]));
}
// "3–1" → {h: 3, b: 1, utfall: 0}, eller null.
export function resultatAv(r) {
  const m = typeof r === 'string' && r.match(/^\s*(\d+)\s*[–—-]\s*(\d+)\s*$/);
  if (!m) return null;
  const h = Number(m[1]);
  const b = Number(m[2]);
  return { h, b, utfall: h > b ? 0 : h === b ? 1 : 2 };
}

// ---------- oddsen: vad alla andra tror ----------

const odds2 = (x) => x.toFixed(2).replace('.', ',');
// Spelbolagens odds (snittet, annars DraftKings), sajtens prognos och kollegans tecken, som
// rader till Claude. d: matchens fil på sajten (data/match/<id>.json), eller null.
export function oddsen(d, article) {
  const ut = [];
  try {
    const m = d && d.match;
    const p = d && d.prediction;
    const trio = (v) => `${m.home} ${v[0]} · oavgjort ${v[1]} · ${m.away} ${v[2]}`;
    const mk = p && p.baselines && p.baselines.market;
    const bolag = mk && Array.isArray(mk.odds) ? mk.odds : d && d.odds && d.odds.espn && d.odds.espn.x12;
    if (m && Array.isArray(bolag) && bolag.length === 3) ut.push(`Spelbolagen: ${trio(bolag.map(odds2))}. Lägre odds, större chans.`);
    if (m && p && Array.isArray(p.p)) ut.push(`Sajtens prognos, odds utan spelbolagens marginal: ${trio(pct3(p.p).map(pctOdds))}.`);
  } catch { /* utan odds */ }
  const signs = (article.tip && article.tip.signs) || [];
  if (signs.length) ut.push(`Kollegan ringade in ${signs.map((n) => ORD[n]).join(' och ')}. Du bestämmer själv.`);
  return ut;
}

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
  const fraser = ta(hc.fraser, 2, sl);
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

// svar: {stycken, tecken, resultat} som Claude skrev dem; odds: raderna ur oddsen().
// → en lista med vad som är fel (tom = godkänd).
export function granska(svar, article, u, odds = []) {
  const fel = [];
  const { stycken } = svar || {};
  if (!Array.isArray(stycken) || !stycken.length || stycken.some((s) => typeof s !== 'string' || !s.trim())) return ['svaret saknar stycken'];
  const text = stycken.join('\n');
  const k = kallan(article);
  const kalla = texten(k);
  const ute = talI(text);
  const tillat = talI(`${kalla}\n${odds.join('\n')}`);
  if (har(text, hc.bielsaCitat)) tillat.add('28');
  const nya = [...ute].filter((x) => !tillat.has(x));
  if (nya.length) fel.push(`talen ${nya.join(', ')} står inte i analysen`);
  const ord = text.split(/\s+/).filter(Boolean).length;
  if (ord > hc.maxOrd) fel.push(`texten är ${ord} ord, högst 120`);
  if (/\benligt\b/i.test(text)) fel.push('nämn inga källor, inget "enligt": det är din egen bedömning');
  const signs = teckenAv(svar.tecken);
  const res = resultatAv(svar.resultat);
  const sista = stycken[stycken.length - 1];
  if (!signs) fel.push('tecken ska vara "1", "X", "2", två av dem eller "1X2"');
  else for (const n of signs) if (!TECKEN_RE[n].test(sista)) fel.push(`${ORD[n]} står inte i sista stycket`);
  if (!res) fel.push('resultat ska vara hemmalagets och bortalagets mål, som "3–1"');
  else {
    if (res.h > 4 || res.b > 4) fel.push('resultatet får ha högst 4 mål per lag');
    if (signs && !signs.includes(res.utfall)) fel.push(`resultatet ${res.h}–${res.b} är ${ORD[res.utfall]}, som du inte har ringat in`);
    const iText = new RegExp(`(?<!\\d)${res.h}\\s*[–—-]\\s*${res.b}(?!\\d)`);
    if (iText.test(text) && !iText.test(kalla)) fel.push('resultatet står inte i texten: det säger du sist för sig');
  }
  if (/\[\d/.test(text)) fel.push('hänvisningar i hakparentes');
  if (/\bkolleg/i.test(text)) fel.push('nämn inte kollegan: det är din egen bedömning');
  if (/\bi ?morgon\b/i.test(text)) fel.push('säg inte "i morgon": texten står kvar fram till avspark');
  const lanat = ac.rost.egnaNamn.filter((o) => har(text, o));
  if (lanat.length) fel.push(`${lanat.join(', ')} hör till kollegans historier, inte matchen`);
  const tillatet = [hc.bielsaCitat, hc.bielsaTillbaka, ...hc.fraser, ...(u.krydda ? [u.krydda] : [])];
  for (const m of text.matchAll(/["“”«»]([^"“”«»]{4,})["“”«»]/g)) {
    if (!har(kalla, m[1]) && !tillatet.some((f) => har(m[1], f) || har(f, m[1]))) fel.push(`citatet "${m[1]}" står inte i analysen`);
  }
  const kanda = new Set([...namnI(kalla), ...kalla.split(/[^\p{L}]+/u)]);
  for (const f of tillatet) for (const o of f.split(/[^\p{L}]+/u)) kanda.add(o);
  for (const o of ['Hasse', 'Backe', 'Bielsa', 'Svennis', 'Manchester', 'City', 'Back', 'Ursäkta', ...u.bielsa]) kanda.add(o);
  const okanda = [...namnI(text)].filter((o) => !kanda.has(o));
  if (okanda.length) fel.push(`namnen ${okanda.join(', ')} står inte i analysen`);
  const bielsa = hc.bielsaOrd.filter((o) => har(text, o));
  const fel2 = bielsa.filter((o) => !u.bielsa.includes(o));
  if (fel2.length) fel.push(`Bielsa-orden ${fel2.join(', ')} är inte med den här gången`);
  if (u.bielsa.length && !har(text, 'Back to basis')) fel.push('Bielsa-orden ska följas av "Ursäkta. Back to basis."');
  return fel;
}

// ---------- samtalet ----------

const jsonOf = (s) => JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));

// Är texten skriven för det här tipset och den här versionen?
export const hasseKlar = (h, article) => Boolean(h && article.tip && h.tips === article.tip.writtenAt && h.version === hc.promptVersion);

// Det som inte är svenska i texten, som rader att skriva om efter. Tomt om allt är i
// ordning, och också om granskningen inte går att få: den får aldrig stoppa en text.
export async function sprakfel(stycken, { claude = claudeSvar } = {}) {
  try {
    const egna = [...hc.fraser, ...hc.kryddor, hc.bielsaCitat, hc.bielsaTillbaka].join(' · ');
    const r = await claude({ system: `${hc.sprak.system}\n\nHans egna uttryck: ${egna}`, prompt: stycken.join('\n\n'), model: hc.model, effort: hc.sprak.effort, timeoutMs: hc.sprak.timeoutMs, tools: [] });
    const lista = jsonOf(r.content).fel;
    if (!Array.isArray(lista)) return [];
    return lista.filter((f) => f && f.mening).map((f) => `"${f.mening}" är inte svenska: ${f.varfor || 'det säger man inte'}${f.forslag ? ` (till exempel "${f.forslag}")` : ''}`);
  } catch (e) {
    if (e instanceof Stopp) throw e;
    return [];
  }
}

// Texten för analysen. persona: innehållet i prompts/hasse-backe.md; match: matchens fil
// på sajten (data/match/<id>.json) för oddsen, eller null.
// → {ok: true, hasse, meta} eller {ok: false, error}.
export async function skrivHasse(id, article, { persona, match = null, now = () => new Date(), claude = claudeSvar }) {
  const u = uppdrag(id, article);
  const odds = oddsen(match, article);
  const rader = [
    `Analysen:\n${JSON.stringify(kallan(article))}`,
    ...odds,
    `Uttryck du kan ta till där de passar, annars inte alls: ${u.fraser.join(' · ')}.`,
    u.krydda && `En rad du gärna får lägga in ordagrant: ${u.krydda}`,
    u.bielsa.length && `Dina Bielsa-ord, för något som står i analysen: ${u.bielsa.join(', ')}. Den enda Bielsa-repliken du citerar är din favorit: "${hc.bielsaCitat}"`,
  ].filter(Boolean);
  const opts = { system: `${persona.trim()}\n\n${hc.format}`, model: hc.model, effort: hc.effort, timeoutMs: hc.timeoutMs, tools: [] };
  let fel = [];
  let meddelande = rader.join('\n\n');
  // Tredje försöket finns bara för språket: en text som har klarat kontrollerna ligger i reserv.
  let reserv = null;
  const klar = (svar, r, attempts) => {
    const res = resultatAv(svar.resultat);
    const hasse = { stycken: svar.stycken.map((s) => s.trim().replace(/([^.?!…"”])$/, '$1.')), tecken: teckenAv(svar.tecken), resultat: `${res.h}–${res.b}`, tips: article.tip.writtenAt, uppdrag: u, model: r.model, version: hc.promptVersion, writtenAt: now().toISOString(), attempts };
    return { ok: true, meta: r, hasse };
  };
  for (let attempts = 1; attempts <= 3; attempts++) {
    const r = await claude({ ...opts, prompt: meddelande });
    if (r.refused) return reserv || { ok: false, error: 'Texten nekades.' };
    let svar = null;
    try { svar = jsonOf(r.content); } catch { fel = ['svaret gick inte att läsa som JSON']; }
    if (svar) {
      fel = granska(svar, article, u, odds);
      if (!fel.length) {
        reserv = klar(svar, r, attempts);
        fel = attempts < 3 ? await sprakfel(svar.stycken, { claude }) : [];
        if (!fel.length) return reserv;
      }
    }
    if (attempts === 2 && !reserv) break;
    meddelande = `${rader.join('\n\n')}\n\nDitt förra svar:\n${r.content}\n\nDet här stämmer inte:\n- ${fel.join('\n- ')}\n\nSkriv om hela svaret som JSON.`;
  }
  return reserv || { ok: false, error: `Texten klarade inte kontrollen: ${fel.join('; ')}.` };
}
