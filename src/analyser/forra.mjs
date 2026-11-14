// Förra klubben till Helgarderat (config/forra.js): när laget har en ny tränare eller en ny spelare som
// spelar mycket, vad har supportrarna i hans förra klubb skrivit om honom? Körs av
// scripts/tidning/poddar.mjs på iMacen, i samma jobb som poddarna, forumen och lokaltidningen.
//
// Byggt på de insattas kod (src/analyser/media.mjs: urvalet, posterna) och forumläsarens tolkning av
// inläggen (src/analyser/forum.mjs). Det som är eget här:
//   - sökningen svarar också med vem som är ny och var han var förut (nya),
//   - en forumtråd läses som inlägg med namn och dag (den första sidan: reaktionerna när han kom eller
//     gick), annat som en artikel,
//   - läsningen gäller i fr.giltigDagar dagar (forra.json i jobbets mapp), inte en vecka.

import crypto from 'node:crypto';
import fr from '../../config/forra.js';
import { jsonOf } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';
import { artiklarAv, artikelAv, kortad } from './media.mjs';
import { lasSida, inlaggen } from './forum.mjs';

const DAG = 86400000;
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const hash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);
const str = (v, flest) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, flest) : null);

// Ska lagets förra klubbar letas upp (igen)? Ja om laget aldrig är läst, om prompten är ny eller om
// läsningen är äldre än fr.giltigDagar dagar.
export function forraSkaLetas(post, now = Date.now()) {
  if (!post || !post.kollad || post.version !== fr.promptVersion) return true;
  return now - Date.parse(post.kollad) > fr.giltigDagar * DAG;
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

// Söker fram de nya i laget och vad deras förra klubbars supportrar har skrivit. En sida om någon som
// inte står bland de nya stryks; de andra får hans förra klubb (fran). → {nya, artiklar}
export async function letaForra({ lag, now = () => new Date(), claude = claudeSvar, cfg = fr } = {}) {
  const r = await claude({
    system: cfg.letaPrompt.replace('{tranareDagar}', cfg.tranareDagar).replace('{spelareDagar}', cfg.spelareDagar)
      .replace('{sokningar}', cfg.sokningar).replace('{artiklar}', cfg.artiklar),
    prompt: `Idag är det ${nowFmt.format(now())}.\nKlubben: ${lag}.`,
    tools: ['WebSearch'], model: cfg.model, effort: cfg.letaEffort, timeoutMs: cfg.timeoutMs,
  });
  const nya = r.refused ? null : nyaAv(r.content);
  const alla = r.refused ? null : artiklarAv(r.content, r.found || [], { cfg });
  if (!nya || !alla) throw new Error(r.refused ? 'Claude avböjde' : 'svaret på sökningen gick inte att läsa');
  const artiklar = alla.map((a) => ({ ...a, fran: (nya.find((n) => n.namn === a.om) || {}).fran || null })).filter((a) => a.fran);
  return { nya, artiklar };
}

// Läser en sida som sökningen gav: en forumtråd som inlägg ("namn (dag): text"), annars artikelns text.
// → {kalla, titel, adress, datum, forfattare, text, nyckel, om, fran} eller kastar (Sparrad när sidan
// inte får eller kan läsas, Error när den är för gammal eller för kort).
export async function lasForraSida(a, { now = Date.now(), cfg = fr, ...opts } = {}) {
  const { url, html } = await lasSida(a.adress, opts);
  const art = artikelAv(html);
  const trad = inlaggen(html, { now });
  const forum = Boolean(trad.motor) && trad.inlagg.length >= 2;
  const inlagg = forum ? trad.inlagg.slice(0, cfg.inlaggPerTrad) : [];
  const text = forum ? inlagg.map((x) => `${x.vem || 'okänd'}${x.tid ? ` (${x.tid.slice(0, 10)})` : ''}: ${x.text}`).join('\n\n') : art.text;
  const forsta = inlagg.map((x) => x.tid).filter(Boolean).sort()[0];
  const datum = (forum ? forsta : art.datum) || (a.datum ? `${a.datum}T12:00:00.000Z` : null);
  if (datum && now - Date.parse(datum) > cfg.dagar * DAG) throw new Error(`för gammal (${datum.slice(0, 10)})`);
  if (text.length < cfg.minstTecken) throw new Error(`för kort (${text.length} tecken)`);
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
