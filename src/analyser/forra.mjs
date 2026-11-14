// Förra klubben till Helgarderat (config/forra.js): när laget har en ny tränare eller en ny spelare som
// spelar mycket, vad har supportrarna i hans förra klubb skrivit om honom den senaste veckan? Körs av
// scripts/tidning/poddar.mjs på iMacen, i samma jobb som poddarna, forumen och lokaltidningen.
//
// Byggt på de insattas kod (src/analyser/media.mjs: urvalet, posterna) och forumläsaren
// (src/analyser/forum.mjs: trådens sista sida och inläggen). Det som är eget här:
//   - sökningen svarar också med vem som är ny och var han var förut (nya); det sparas i
//     fr.giltigDagar dagar (forra.json i jobbets mapp) och ges till nästa sökning,
//   - en forumtråd läses från sista sidan, och bara veckans inlägg om honom tas med, annat som en
//     artikel med ett känt datum från veckan.

import crypto from 'node:crypto';
import fr from '../../config/forra.js';
import { jsonOf } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';
import { artiklarAv, artikelAv, kortad } from './media.mjs';
import { lasSida, inlaggen, lasTrad, tradAdress } from './forum.mjs';

const DAG = 86400000;
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const hash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);
const str = (v, flest) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, flest) : null);

// De nya i laget som registret vet, om det är framtaget med samma prompt de senaste fr.giltigDagar
// dagarna; annars null (då tar sökningen fram dem igen). → [{namn, roll, kom, fran}] eller null
export function kandaNya(post, now = Date.now(), cfg = fr) {
  if (!post || !post.kollad || post.version !== cfg.promptVersion || !Array.isArray(post.nya)) return null;
  return now - Date.parse(post.kollad) > cfg.giltigDagar * DAG ? null : post.nya;
}

// Ska veckans sidor om lagets nya sökas? Ja om de nya inte är kända (då söks de också), annars om det
// finns någon ny och den förra sökningen är äldre än fr.sokIgenDagar dagar.
export function forraSkaLetas(post, now = Date.now(), cfg = fr) {
  const nya = kandaNya(post, now, cfg);
  if (!nya) return true;
  if (!nya.length) return false;
  return !post.sokt || now - Date.parse(post.sokt) > cfg.sokIgenDagar * DAG;
}

// Claudes svar → de nya i laget: [{namn, roll, kom, fran}]. Utan förra klubb räknas han inte.
export function nyaAv(content) {
  let j;
  try { j = jsonOf(content); } catch { return null; }
  if (!j || !Array.isArray(j.nya)) return null;
  return j.nya.map((x) => ({
    namn: str(x && x.namn, 60),
    roll: x && x.roll === 'tranare' ? 'tranare' : 'spelare',
    kom: x && typeof x.kom === 'string' && /^\d{4}-\d\d/.test(x.kom) ? x.kom.slice(0, 7) : null,
    fran: str(x && x.fran, 60),
  })).filter((x) => x.namn && x.fran).slice(0, 3);
}

// Söker fram de nya i laget (om de inte redan är kända: nya) och vad deras förra klubbars supportrar har
// skrivit den senaste veckan. En sida om någon som inte står bland de nya stryks; de andra får hans förra
// klubb (fran). → {nya, artiklar}
export const nyaText = (nya) => nya.map((n) => `${n.namn} (${n.roll === 'tranare' ? 'tränare' : 'spelare'}${n.kom ? `, kom ${n.kom}` : ''}, förut i ${n.fran})`).join('; ');
export async function letaForra({ lag, nya: kanda = null, now = () => new Date(), claude = claudeSvar, cfg = fr } = {}) {
  const r = await claude({
    system: cfg.letaPrompt.replace('{tranareDagar}', cfg.tranareDagar).replace('{spelareDagar}', cfg.spelareDagar)
      .replace('{sokningar}', cfg.sokningar).replace('{artiklar}', cfg.artiklar).replaceAll('{dagar}', cfg.dagar),
    prompt: `Idag är det ${nowFmt.format(now())}.\nKlubben: ${lag}.${kanda && kanda.length ? `\nDe nya i klubben: ${nyaText(kanda)}.` : ''}`,
    tools: ['WebSearch'], model: cfg.model, effort: cfg.letaEffort, timeoutMs: cfg.timeoutMs,
  });
  const nya = r.refused ? null : kanda && kanda.length ? kanda : nyaAv(r.content);
  const alla = r.refused ? null : artiklarAv(r.content, r.found || [], { cfg });
  if (!nya || !alla) throw new Error(r.refused ? 'Claude avböjde' : 'svaret på sökningen gick inte att läsa');
  const artiklar = alla.map((a) => ({ ...a, fran: (nya.find((n) => n.namn === a.om) || {}).fran || null })).filter((a) => a.fran);
  return { nya, artiklar };
}

// Inläggen som handlar om honom: de som nämner hans efternamn, eller alla om trådens rubrik gör det.
const utanAccent = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function omHonom(inlagg, om, titel = '') {
  const efternamn = utanAccent(String(om || '').trim().split(/\s+/).pop());
  if (efternamn.length < 3) return inlagg;
  const re = new RegExp(`(^|[^a-z])${efternamn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`);
  return re.test(utanAccent(titel)) ? inlagg : inlagg.filter((x) => re.test(utanAccent(x.text)));
}

// Läser en sida som sökningen gav. En forumtråd läses från sista sidan, och bara inläggen från de senaste
// cfg.dagar dagarna som handlar om honom tas med ("namn (dag): text"). Annars artikelns text, som måste ha
// ett datum från samma dagar. → {kalla, titel, adress, datum, forfattare, text, nyckel, om, fran} eller kastar
// (Sparrad när sidan inte får eller kan läsas, Error när inget är från veckan eller texten är för kort).
export async function lasForraSida(a, { now = Date.now(), cfg = fr, ...opts } = {}) {
  const { url, html } = await lasSida(a.adress, opts);
  const art = artikelAv(html);
  const trad = inlaggen(html, { now });
  const forum = Boolean(trad.motor) && trad.inlagg.length >= 1;
  const farsk = (tid) => tid && now - Date.parse(tid) <= cfg.dagar * DAG;
  let inlagg = trad.inlagg;
  if (forum) {
    const t = tradAdress(url) || tradAdress(a.adress);
    if (t && t.nyckel) {
      const discourse = t.nyckel.startsWith('d') ? { id: t.nyckel.slice(1), inlagg: 1e6 } : null;
      try {
        const sista = await lasTrad({ titel: a.titel, adress: url, nyckel: t.nyckel, sista: t.slag === 'sista' ? url : null, discourse }, opts);
        if (sista.inlagg.length) inlagg = sista.inlagg;
      } catch { /* sidan som sökningen gav får räcka */ }
    }
    inlagg = omHonom(inlagg.filter((x) => farsk(x.tid)), a.om, a.titel || art.titel).slice(-cfg.inlaggPerTrad);
    if (!inlagg.length) throw new Error('inga inlägg om honom från veckan');
  }
  const text = forum ? inlagg.map((x) => `${x.vem || 'okänd'} (${x.tid.slice(0, 10)}): ${x.text}`).join('\n\n') : art.text;
  const datum = forum ? inlagg.map((x) => x.tid).sort().pop() : art.datum || (a.datum ? `${a.datum}T12:00:00.000Z` : null);
  if (!farsk(datum)) throw new Error(datum ? `för gammal (${datum.slice(0, 10)})` : 'utan datum');
  const minst = forum ? cfg.minstTeckenForum : cfg.minstTecken;
  if (text.length < minst) throw new Error(`för kort (${text.length} tecken)`);
  const kort = kortad(text, cfg.teckenPerArtikel);
  return {
    kalla: a.kalla || art.sajt || new URL(url).hostname.replace(/^www\./, ''),
    titel: (forum ? a.titel || art.titel : art.titel || a.titel) || null,
    adress: url || a.adress,
    datum,
    forfattare: forum ? null : art.forfattare,
    text: kort,
    nyckel: hash(kort),
    om: a.om || null,
    fran: a.fran || null,
  };
}
