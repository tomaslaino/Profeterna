// De insatta medierna till tidningen inför omgången (config/media.js): veckans artiklar om laget
// i oberoende medier som följer det på nära håll – fansajter, fanzines, klubbnära nyhetsbrev och
// bloggar, oberoende lokala reportrar. Körs av scripts/tidning/poddar.mjs på iMacen, i samma jobb
// som supporterpoddarna och forumen, och uppgifterna hamnar på samma informationssidor.
//
// Samma kod läser klubben, lokaltidningen och motståndarens intervju med en supporter
// (config/lokal.js): varje funktion tar då den konfigurationen som cfg. Utan cfg gäller de
// insattas (config/media.js).
//
//   1. Claude Code söker fram artiklarna (bara sökningen, inga sidor). En adress räknas bara om den
//      kom upp i en sökning och inte hör till de stora mediehusen, spelsajterna, aggregatorerna,
//      sociala medier eller poddarnas värdar (mc.utesluten).
//   2. Jobbet läser artiklarna själv, som forumen: med ett ärligt namn i förfrågan och med hänsyn
//      till robots.txt (Claude-User). En sida som spärrar, en artikel som är äldre än mc.dagar dagar
//      och en text som är för kort (en puff eller en betalvägg) hoppas över.
//   3. Claude Code tar ut det intressanta, utan verktyg. Varje uppgift måste ha ett citat som står
//      ordagrant i artikeln, och vem som säger det följer bara med om namnet står där.
//
// Artiklarna stannar i mappen utanför repot. Varje artikel sparas som en egen post (typ 'media'),
// så att samma artikel inte läses av Claude två gånger.

import crypto from 'node:crypto';
import mc from '../../config/media.js';
import { jsonOf } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';
import newsCfg from '../../config/news.js';
import { parseRss } from '../news.mjs';
import { citatStar, vemStar } from './poddar.mjs';
import { lasSida, tillText, avkoda, elementVid, Sparrad } from './forum.mjs';

const DAG = 86400000;
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dagFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' });
const antalOrd = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const hash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);
const TIPS_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*|odds\w*|favorit(?:en|er|erna)?|skräll\w*)\b/i;
const AMNEN = ['trupp', 'elva', 'spel', 'klubb', 'match'];

export { Sparrad };

// ---------- adresserna ----------

// Adressen utan det som inte skiljer två sidor åt: #, spårningsparametrar och snedstreck sist.
export function renAdress(url) {
  let u;
  try { u = new URL(String(url).trim()); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  u.hash = '';
  for (const k of [...u.searchParams.keys()]) if (/^(utm_\w+|fbclid|gclid|ref|ref_src|s|r)$/i.test(k)) u.searchParams.delete(k);
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
  return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}${u.search}`;
}

// Hör adressen till en sajt som aldrig räknas (eller en underdomän till en)?
export function utesluten(url, lista = mc.utesluten) {
  let v;
  try { v = new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return true; }
  return lista.some((d) => v === d || v.endsWith(`.${d}`));
}

// Claudes svar på sökningen → artiklarna som håller: adressen kom upp i en sökning (found) och hör
// inte till en utesluten sajt. Samma artikel tas en gång. Har konfigurationen slag (config/lokal.js)
// följer artikelns slag med, och en artikel med ett okänt slag stryks. → [{kalla, titel, adress, datum, varfor, slag?}]
export function artiklarAv(content, found = [], { cfg = mc, flest = cfg.artiklar } = {}) {
  let j;
  try { j = jsonOf(content); } catch { return null; }
  if (!j || !Array.isArray(j.artiklar)) return null;
  const sedda = new Set(found.map((f) => renAdress(f && f.url)).filter(Boolean));
  const ut = [];
  const tagna = new Set();
  for (const x of j.artiklar) {
    const adress = x && typeof x.adress === 'string' ? x.adress.trim() : '';
    const ren = renAdress(adress);
    if (!ren || tagna.has(ren) || !sedda.has(ren) || utesluten(adress, cfg.utesluten)) continue;
    const slag = cfg.slag ? (x && typeof x.slag === 'string' ? x.slag.trim().toLowerCase() : '') : null;
    if (cfg.slag && !cfg.slag[slag]) continue;
    tagna.add(ren);
    const datum = x && typeof x.datum === 'string' && /^\d{4}-\d\d-\d\d$/.test(x.datum) ? x.datum : null;
    // Källans namn utan en förklaring inom parentes sist ("Plymouth Live (Plymouth Herald)"): datumet står inom parentes på sidan.
    const kalla = typeof x.kalla === 'string' ? x.kalla.trim().replace(/\s*\([^()]*\)$/, '').trim() : '';
    ut.push({ kalla: kalla ? kalla.slice(0, 80) : null, titel: typeof x.titel === 'string' ? x.titel.trim().slice(0, 200) : null, adress, datum, varfor: typeof x.varfor === 'string' ? x.varfor.trim().slice(0, 300) : null, ...(slag ? { slag } : {}) });
    if (ut.length >= flest) break;
  }
  return ut;
}

// ---------- Bing News ----------
//
// Sökmotorn bakom WebSearch hittar sällan veckans artiklar i lokaltidningarna, men Bing News har dem
// samma dag (provat 2026-11-10: Manchester Evening News om Stockport, Plymouth Live om Plymouth). Med
// cfg.bing (config/lokal.js) hämtar jobbet lagets nyheter från de senaste cfg.dagar dagarna ur Bing News
// RSS och ger dem till Claude som träffar att välja bland. Bing är ett tillskott: går det inte att nå
// söker Claude som vanligt.

const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Lagets namn som de står i en rubrik: söknamnen i config/news.js och ESPN-namnet.
const lagetsNamn = (lag) => [...new Set([...((newsCfg.names && newsCfg.names[lag]) || []), lag])];
// Nämner rubriken laget? Med stor bokstav och på ordgräns: "Reading" ska inte träffa "reading".
export function namnerLaget(titel, lag) {
  const re = new RegExp(`(?<![\\p{L}\\d])(${lagetsNamn(lag).map(escRe).sort((a, b) => b.length - a.length).join('|')})(?![\\p{L}\\d])`, 'u');
  return re.test(String(titel || ''));
}

// Bing News RSS → veckans nyheter om laget på sajter som inte är uteslutna. → [{kalla, titel, adress, datum}]
export function bingNyheter(xml, lag, { cfg = mc, now = Date.now() } = {}) {
  const ut = [];
  for (const x of parseRss(xml)) {
    let adress = x.link;
    try { const u = new URL(x.link); if (/(^|\.)bing\.com$/.test(u.hostname) && u.searchParams.get('url')) adress = u.searchParams.get('url'); } catch { continue; }
    const t = Date.parse(x.pubDate);
    if (!Number.isFinite(t) || now - t > cfg.dagar * DAG || t - now > DAG || !namnerLaget(x.title, lag) || !renAdress(adress) || utesluten(adress, cfg.utesluten)) continue;
    ut.push({ kalla: String(x.source || new URL(adress).hostname.replace(/^www\./, '')).slice(0, 80), titel: String(x.title || '').trim().slice(0, 200), adress, datum: new Date(t).toISOString() });
  }
  return ut;
}

// Lagets nyheter i Bing News, alla cfg.bing.fragor, samma artikel en gång, de nyaste först. → [{kalla, titel, adress, datum}]
export async function bingTraffar(lag, { cfg = mc, now = Date.now(), fetchImpl = globalThis.fetch } = {}) {
  if (!cfg.bing) return [];
  const namn = lagetsNamn(lag)[0];
  const sett = new Set();
  const ut = [];
  for (const f of cfg.bing.fragor) {
    const q = f.replace('{namn}', namn);
    let xml;
    try {
      const res = await fetchImpl(`https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setlang=en-GB&cc=GB`, { headers: { 'user-agent': 'Matchfixarna/1.0 (forumlasare)' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      xml = await res.text();
    } catch { continue; }
    for (const x of bingNyheter(xml, lag, { cfg, now })) {
      const ren = renAdress(x.adress);
      if (sett.has(ren)) continue;
      sett.add(ren);
      ut.push(x);
    }
  }
  return ut.sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, cfg.bing.flest);
}

// Söker fram veckans artiklar om laget, med lagets nyheter i Bing News som träffar när cfg.bing finns.
// → [{kalla, titel, adress, datum, varfor, slag?}]
export async function letaArtiklar({ lag, mot = null, avspark = null, now = () => new Date(), claude = claudeSvar, cfg = mc, fetchImpl = globalThis.fetch } = {}) {
  const bing = cfg.bing ? await bingTraffar(lag, { cfg, now: now().getTime(), fetchImpl }).catch(() => []) : [];
  const r = await claude({
    system: cfg.letaPrompt.replace('{dagar}', cfg.dagar).replace('{sokningar}', cfg.sokningar).replace('{artiklar}', cfg.artiklar),
    prompt: [
      `Idag är det ${nowFmt.format(now())}.`, `Klubben: ${lag}.${mot ? ` Nästa match: mot ${mot}${avspark ? `, ${nowFmt.format(new Date(avspark))}` : ''}.` : ''}`,
      bing.length ? `\nVeckans nyheter om klubben i Bing News (de räknas som träffar i dina sökningar):\n${bing.map((b) => `- ${b.datum.slice(0, 10)} ${b.kalla}: "${b.titel}" ${b.adress}`).join('\n')}` : '',
    ].filter(Boolean).join('\n'),
    tools: ['WebSearch'], model: cfg.model, effort: cfg.letaEffort, timeoutMs: cfg.timeoutMs,
  });
  const l = r.refused ? null : artiklarAv(r.content, [...(r.found || []), ...bing.map((b) => ({ url: b.adress }))], { cfg });
  if (!l) throw new Error(r.refused ? 'Claude avböjde' : 'svaret på sökningen gick inte att läsa');
  return l;
}

// ---------- artikeln ----------

// Taggens attribut → {namn: värde}
function attribut(tagg) {
  const ut = {};
  for (const m of String(tagg).matchAll(/([a-z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) ut[m[1].toLowerCase()] = avkoda(m[2] != null ? m[2] : m[3]);
  return ut;
}

// <meta property|name="…" content="…"> → {namn: värde}, det första för varje namn.
export function metaTaggar(html) {
  const ut = {};
  for (const m of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    const a = attribut(m[0]);
    const namn = (a.property || a.name || a.itemprop || '').toLowerCase();
    if (namn && a.content != null && !(namn in ut)) ut[namn] = a.content.trim();
  }
  return ut;
}

// Artiklarna i sidans JSON-LD (också i @graph). → [{headline, datePublished, author, publisher}]
export function jsonLd(html) {
  const ut = [];
  const ga = (v) => {
    if (Array.isArray(v)) { v.forEach(ga); return; }
    if (!v || typeof v !== 'object') return;
    if (v['@graph']) ga(v['@graph']);
    const typ = [].concat(v['@type'] || []).join(' ');
    if (/Article|BlogPosting|Report|NewsArticle|WebPage/i.test(typ) && (v.datePublished || v.headline)) ut.push(v);
  };
  for (const m of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { ga(JSON.parse(m[1].trim())); } catch { /* trasig JSON-LD: strunt i den */ }
  }
  // Artiklarna före en WebPage-rad, som bara beskriver sidan.
  return ut.sort((a, b) => Number(/WebPage/.test([].concat(a['@type']).join(' '))) - Number(/WebPage/.test([].concat(b['@type']).join(' '))));
}

const namnAv = (v) => {
  const l = [].concat(v || []).map((x) => (typeof x === 'string' ? x : x && x.name)).filter((x) => typeof x === 'string' && x.trim());
  return l.length ? l.map((x) => x.trim()).join(' och ').slice(0, 80) : null;
};
const tidAv = (v) => (v && Number.isFinite(Date.parse(v)) ? new Date(Date.parse(v)).toISOString() : null);

// Sidans html → {titel, datum, forfattare, sajt, text}. Texten är artikelns (<article>, annars
// <main>, annars hela sidan), utan meny, sidfot, formulär och inbäddat.
export function artikelAv(html) {
  const s = String(html || '');
  const meta = metaTaggar(s);
  const ld = jsonLd(s)[0] || {};
  const titel0 = meta['og:title'] || ld.headline || (s.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const tid0 = s.match(/<time\b[^>]*\bdatetime=["']([^"']+)["']/i);
  const datum = tidAv(meta['article:published_time']) || tidAv(ld.datePublished) || tidAv(meta['date']) || tidAv(meta['pubdate']) || tidAv(meta['parsely-pub-date']) || tidAv(meta['sailthru.date']) || tidAv(tid0 && tid0[1]);
  const forfattare = namnAv(ld.author) || (meta.author && !/^https?:/.test(meta.author) ? meta.author.slice(0, 80) : null) || meta['parsely-author'] || null;
  const sajt = meta['og:site_name'] || namnAv(ld.publisher) || null;
  // Den längsta <article> (en sida kan ha puffar för andra artiklar), annars <main>, annars hela sidan.
  const texten = (el) => tillText(el.replace(/<header\b[\s\S]*?<\/header>/gi, ' '));
  let text = '';
  for (const m of s.matchAll(/<article\b/gi)) {
    const el = elementVid(s, m.index);
    const t = el ? texten(el) : '';
    if (t.length > text.length) text = t;
  }
  if (!text) {
    const i = s.search(/<main\b/i);
    const el = i >= 0 ? elementVid(s, i) : null;
    text = texten(el || s.slice(Math.max(0, s.search(/<body\b/i))));
  }
  return { titel: avkoda(titel0).replace(/\s+/g, ' ').trim().slice(0, 200) || null, datum, forfattare: forfattare ? avkoda(forfattare).trim() : null, sajt: sajt ? avkoda(sajt).trim().slice(0, 80) : null, text };
}

const kortad = (text, flest) => (text.length > flest ? `${text.slice(0, flest).replace(/\s+\S*$/, '')} …` : text);

// Läser en artikel som sökningen gav. → {kalla, titel, adress, datum, forfattare, text, nyckel, slag?} eller kastar
// (Sparrad när sidan inte får eller kan läsas, Error när den är för gammal eller för kort).
export async function lasArtikel(a, { now = Date.now(), cfg = mc, ...opts } = {}) {
  const { url, html } = await lasSida(a.adress, opts);
  const art = artikelAv(html);
  const datum = art.datum || (a.datum ? `${a.datum}T12:00:00.000Z` : null);
  if (datum && now - Date.parse(datum) > cfg.dagar * DAG) throw new Error(`för gammal (${datum.slice(0, 10)})`);
  if (art.text.length < cfg.minstTecken) throw new Error(`för kort (${art.text.length} tecken)`);
  const text = kortad(art.text, cfg.teckenPerArtikel);
  return { kalla: a.kalla || art.sajt || new URL(url).hostname.replace(/^www\./, ''), titel: art.titel || a.titel, adress: url || a.adress, datum, forfattare: art.forfattare, text, nyckel: hash(text), ...(a.slag ? { slag: a.slag } : {}) };
}

// Artikelns id: adressen. Samma artikel får samma id varje natt. De insattas börjar på m, klubbens och
// lokaltidningens på l (cfg.idBorjan).
export const artikelId = (adress, cfg = mc) => `${cfg.idBorjan || 'm'}${hash(renAdress(adress) || adress).slice(0, 11)}`;

// Källans slag i omgångens fil: konfigurationens (media, lokal), eller sökningens slag översatt (motstand).
export const typAv = (a, cfg = mc) => (cfg.slag && a && cfg.slag[a.slag]) || cfg.typ || 'media';
// Alla slag som en konfiguration ger: ['media'] eller ['lokal', 'motstand'].
export const typerAv = (cfg = mc) => [...new Set([cfg.typ || 'media', ...Object.values(cfg.slag || {})])];

// ---------- urvalet ----------

// Artiklarna som de ges till Claude: numrerade, med källan (och vad det är för källa, cfg.slagText),
// rubriken, datumet och skribenten. → {text, artiklar: [{nr, …}]}
export function mediaText(artiklar, { cfg = mc, flestTecken = cfg.flestTecken } = {}) {
  const ut = [];
  const delar = [];
  let langd = 0;
  for (const a of artiklar) {
    const nr = ut.length + 1;
    const slag = cfg.slagText && a.slag && cfg.slagText[a.slag] ? ` (${cfg.slagText[a.slag]})` : '';
    const huvud = `[${nr}] ${a.kalla}${slag}: "${a.titel || 'utan rubrik'}"${a.datum ? `, ${dagFmt.format(new Date(a.datum))}` : ''}${a.forfattare ? `, av ${a.forfattare}` : ''}`;
    const rest = flestTecken - langd - huvud.length;
    if (rest < 400) break;
    const text = kortad(a.text, rest);
    langd += huvud.length + text.length;
    ut.push({ ...a, nr, text });
    delar.push(`${huvud}\n\n${text}`);
  }
  return { text: delar.join('\n\n---\n\n'), artiklar: ut };
}

// Claudes svar → uppgifterna som håller: rätt form, citatet står i artikeln (eller i exakt en
// annan av dem), inga tipsord. Vem som säger det följer bara med om namnet står i artikeln.
// → {handlarOm, uppgifter: [{a, t, s, artikel, vikt, citat, sagt, vem}], strukna}
export function mediaUppgifterAv(content, artiklar, { flest = mc.uppgifter } = {}) {
  let j;
  try { j = jsonOf(content); } catch { return null; }
  if (!j || !Array.isArray(j.uppgifter)) return null;
  const uppgifter = [];
  let strukna = 0;
  for (const x of j.uppgifter) {
    const t = x && typeof x.t === 'string' ? x.t.trim() : '';
    const s = x && ['b', 'h', 'o'].includes(x.s) ? x.s : 'h';
    const a = x && AMNEN.includes(x.a) ? x.a : 'match';
    const vikt = Math.max(1, Math.min(5, Math.round(Number(x && x.vikt) || 3)));
    const citat = x && typeof x.citat === 'string' ? x.citat.trim() : '';
    let art = artiklar.find((p) => p.nr === Number(x && x.artikel));
    if (!art || !citatStar(citat, art.text)) {
      const andra = artiklar.filter((p) => citatStar(citat, p.text));
      art = andra.length === 1 ? andra[0] : null;
    }
    if (!t || antalOrd(t) > 65 || TIPS_RE.test(t) || !art) { strukna++; continue; }
    const sagt0 = typeof x.sagt === 'string' ? x.sagt.trim().replace(/^[”"»«'‘’]+|[”"»«'‘’]+$/g, '') : '';
    const sagt = sagt0 && antalOrd(sagt0) >= 4 && antalOrd(sagt0) <= 50 && !TIPS_RE.test(sagt0) ? sagt0 : null;
    const vem0 = x && typeof x.vem === 'string' ? x.vem.trim() : '';
    const vem = sagt && vem0 && vem0.length <= 40 && vemStar(vem0, art.text) ? vem0 : null;
    uppgifter.push({ a, t, s, artikel: art.nr, vikt, citat, sagt, vem });
  }
  uppgifter.sort((p, q) => q.vikt - p.vikt);
  return { handlarOm: typeof j.handlar_om === 'string' ? j.handlar_om.trim() : null, uppgifter: uppgifter.slice(0, flest), strukna };
}

// Tar ut det intressanta ur veckans artiklar. → {handlarOm, uppgifter, strukna, sekunder, artiklar}
export async function taUtMedia(artiklar0, { lag, mot = null, avspark = null, spelare = [], now = () => new Date(), claude = claudeSvar, cfg = mc } = {}) {
  const { text, artiklar } = mediaText(artiklar0, { cfg });
  if (!artiklar.length) return { handlarOm: null, uppgifter: [], strukna: 0, sekunder: 0, artiklar };
  const fraga = [
    `Idag är det ${nowFmt.format(now())}.`,
    `Laget: ${lag}.${mot ? ` Nästa match: mot ${mot}${avspark ? `, ${nowFmt.format(new Date(avspark))}` : ''}.` : ''}`,
    spelare.length ? `Spelare i de två lagens trupper (för stavningen): ${spelare.join(', ')}.` : '',
    `\nArtiklarna:\n\n${text}`,
  ].filter(Boolean).join('\n');
  const r = await claude({ system: cfg.urvalPrompt.replace('{flest}', cfg.uppgifter).replace('{dagar}', cfg.dagar), prompt: fraga, tools: [], model: cfg.model, effort: cfg.effort, timeoutMs: cfg.timeoutMs });
  const u = r.refused ? null : mediaUppgifterAv(r.content, artiklar, { flest: cfg.uppgifter });
  if (!u) throw new Error(r.refused ? 'Claude avböjde' : 'svaret gick inte att läsa');
  return { ...u, sekunder: r.seconds, artiklar };
}

// Artiklarna som de sparas i omgångens fil, en post per artikel bredvid poddavsnitten och
// forumläsningarna. Uppgiftens id är artikelns och platsen i listan.
export function mediaPoster(artiklar, u, { cfg = mc, version = cfg.promptVersion, now = new Date() } = {}) {
  return artiklar.map((a) => {
    const id = artikelId(a.adress, cfg);
    const uppgifter = u.uppgifter.filter((x) => x.artikel === a.nr).map(({ artikel, ...x }, i) => ({ ...x, id: `${id}-${i + 1}` }));
    return {
      id,
      typ: typAv(a, cfg),
      podd: a.kalla,
      titel: a.titel,
      datum: a.datum || now.toISOString(),
      sida: a.adress,
      forfattare: a.forfattare || null,
      nyckel: a.nyckel,
      version,
      uttaget: now.toISOString(),
      handlarOm: u.handlarOm,
      uppgifter,
    };
  });
}

// Lagets nya artiklar: de som inte redan är lästa med samma text och samma prompt.
export function nyaArtiklar(lasta, post, { cfg = mc } = {}) {
  const typer = typerAv(cfg);
  const gamla = new Map(((post && post.avsnitt) || []).filter((a) => typer.includes(a.typ)).map((a) => [a.id, a]));
  return lasta.filter((a) => {
    const g = gamla.get(artikelId(a.adress, cfg));
    return !g || g.nyckel !== a.nyckel || g.version !== cfg.promptVersion;
  });
}

// Artiklarna som den andra läsningen (de insatta, eller klubben och lokaltidningen) redan har i lagets
// post: samma artikel läses bara i en av dem. → Set med rena adresser
export function lastaAvAndra(post, { cfg = mc } = {}) {
  const typer = typerAv(cfg);
  return new Set(((post && post.avsnitt) || []).filter((a) => ['media', 'lokal', 'motstand'].includes(a.typ) && !typer.includes(a.typ) && a.sida)
    .map((a) => renAdress(a.sida)).filter(Boolean));
}

// Lägger lagets nya poster i omgångens fil: samma artikel ersätts, och de cfg.behall nyaste står kvar.
export function laggTill(post, poster, { cfg = mc } = {}) {
  const typer = typerAv(cfg);
  const ids = new Set(poster.map((p) => p.id));
  const media = [...post.avsnitt.filter((a) => typer.includes(a.typ) && !ids.has(a.id)), ...poster]
    .sort((a, b) => String(b.datum).localeCompare(String(a.datum))).slice(0, cfg.behall);
  post.avsnitt = [...post.avsnitt.filter((a) => !typer.includes(a.typ)), ...media];
  return post;
}
