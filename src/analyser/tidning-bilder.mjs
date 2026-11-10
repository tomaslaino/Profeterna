// Bilderna i tidningen inför omgången (användarens önskan 2026-11-09: "bilder från veckan i
// tipsguiden, för de olika lagen"): en bild per lag från den senaste veckan, som Hasse Backes
// tidning trycker bredvid notisen. Hämtas på iMacen i samma jobb som tidningen
// (scripts/analyser/skriv.mjs), med vanliga hämtningar och utan någon språkmodell:
//
//   1. ESPN:s lagnyheter, där Premier League-lagen har egna artiklar med bild och fotograf, och BBC Sports
//      flöde för laget (alla ligalag, med bild).
//   2. Notisens egna källor och Bing News (lokaltidningarna och klubbarnas sidor, som skriver om
//      de lägre divisionerna): sidans delningsbild (og:image).
//
// Bara bilder från de senaste DAGAR dagarna, liggande och minst MIN_BREDD bildpunkter breda, inga
// loggor, inga spelbolag och inga sajter som är spärrade på datorn. Samma bild används inte för
// två lag. Bilden förminskas till BREDD bildpunkter (eller bredd) och sparas som <lag>-<hash>.jpg i
// mappen: med sips, som finns i macOS, på iMacen och med ImageMagick på GitHub Actions (matchbladens
// bilder, scripts/tidning/matchbilder.mjs).
//
// veckansBilder(lagen, { mapp, espnId, kallor, bredd }) → Map lag → { lag, fil, kalla, foto, sida, datum }

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import newsCfg from '../../config/news.js';
import { parseRss } from '../news.mjs';

export const DAGAR = 8;
const BREDD = 320;
const MIN_BREDD = 480;
const DAG = 86400000;
// Sajter vars delningsbild är en hopklippt grafik med text och sköldar, inte ett foto, och sajter som skrapar andras
// artiklar (el-balad.com).
const GRAFIK = ['el-balad.com', 'footballleagueworld.co.uk', 'givemesport.com', 'thisisfutbol.com', 'teamtalk.com', 'football365.com', 'sportskeeda.com', 'footballinsider247.com', 'goal.com', 'onefootball.com', 'msn.com', 'aol.com', 'yahoo.com', 'youtube.com'];
const INTE_FOTO = /logo|placeholder|default[-_.]|fallback|badge|crest|favicon|icon[-_.]|share[-_]?image|social[-_]?(share|card)|og[-_]default|blank\./i;
// Damlaget, akademin och ungdomslagen är inte laget i omgången.
const ANDRA_LAG = /\b(women|ladies|wfc|academy|youth|under[- ]?(18|19|21|23)s?|u-?(18|19|21|23)s?)\b/i;
// Liveblogg och resultatsammanfattning har en grafik med sköldar och text som delningsbild.
const LIVE = /\b(live|as it happened|matchday live|recap|highlights)\b/i;
// En jämn grafik (en sköld på färg) packas mycket hårdare än ett foto: under så här många byte per
// bildpunkt i den förminskade bilden är det inte ett foto (foton låg på 0,2–0,6, en sköld på 0,12).
const MIN_BYTE_PER_PX = 0.15;
// ImageMagick sparar utan metadata (sips behåller färgprofilen), så samma bilder blir mindre: foton låg på 0,15–0,31
// och en enfärgad grafik med text på 0,04 (2026-11-10).
const MIN_BYTE_PER_PX_IM = 0.1;

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const pa = (host, lista) => lista.some((d) => host === d || host.endsWith(`.${d}`));
const sparrad = (u) => {
  const h = hostOf(u);
  return !h || pa(h, newsCfg.excludeDomains) || pa(h, newsCfg.noBody) || pa(h, GRAFIK) || newsCfg.excludeUrl.test(u);
};
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const avkoda = (s) => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return ENT[e.toLowerCase()] ?? m;
}).trim();
export const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Lagets namn i texter: söknamnen i config/news.js (Bradford City, Bradford, Bantams).
export const namnen = (lag) => (newsCfg.names && newsCfg.names[lag]) || [lag];
const ordRe = (n) => new RegExp(`[^a-z]${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z]`);
export function namner(text, lag) {
  const t = ` ${String(text || '').toLowerCase()} `;
  return namnen(lag).filter((n) => n.length >= 4).some((n) => ordRe(n).test(t));
}
// Var i texten laget nämns först (999 om inte alls).
const forstI = (t, lag) => Math.min(...namnen(lag).filter((n) => n.length >= 4).map((n) => { const m = ordRe(n).exec(t); return m ? m.index : 999; }));

// Alla klubbarna i config/news.js. En artikel där en annan klubb står före laget i rubriken (York City smash
// Northampton Town), eller som ligger på en annan klubbs egen sajt (fleetwoodtownfc.com om Rochdale) eller hos en
// annan klubbs lokaltidning (readingchronicle.co.uk), handlar om den klubben, och bilden visar dess spelare.
const KLUBBAR = Object.keys(newsCfg.names || {});
const kompakt = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export function annanKlubbForst(titel, lag) {
  const t = ` ${String(titel || '').toLowerCase()} `;
  const var_ = forstI(t, lag);
  const egna = new Set(namnen(lag).map((n) => n.toLowerCase()));
  return KLUBBAR.some((k) => k !== lag && !namnen(k).some((n) => egna.has(n.toLowerCase())) && forstI(t, k) < var_);
}
export function annanKlubbsSajt(url, lag) {
  const h = kompakt(hostOf(url));
  const i = (k) => namnen(k).some((n) => kompakt(n).length >= 6 && h.includes(kompakt(n)));
  return !i(lag) && KLUBBAR.some((k) => k !== lag && i(k));
}

// Sidans delningsbild, namn och datum ur <meta> och JSON-LD.
export function sidansBild(html) {
  const meta = {};
  for (const m of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    const a = {};
    for (const x of m[0].matchAll(/([a-z:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi)) a[x[1].toLowerCase()] = x[3] ?? x[4];
    const k = (a.property || a.name || a.itemprop || '').toLowerCase();
    if (k && a.content && !(k in meta)) meta[k] = avkoda(a.content);
  }
  const ld = String(html).match(/"datePublished"\s*:\s*"([^"]+)"/);
  return {
    bild: meta['og:image:secure_url'] || meta['og:image'] || meta['twitter:image'] || meta['twitter:image:src'] || null,
    namn: meta['og:site_name'] || null,
    datum: meta['article:published_time'] || meta['og:article:published_time'] || meta['datepublished'] || (ld && ld[1]) || meta['article:modified_time'] || meta['og:updated_time'] || null,
  };
}

async function hamta(url, { fetchImpl, typ = 'text', max = 800000 }) {
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': newsCfg.userAgent, Accept: typ === 'bild' ? 'image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8' : 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-GB,en;q=0.9' },
    signal: AbortSignal.timeout(20000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (typ === 'bild') {
    if (!/^image\//.test(res.headers.get('content-type') || '')) throw new Error('inte en bild');
    const b = Buffer.from(await res.arrayBuffer());
    if (b.length > 12e6) throw new Error('för stor');
    return b;
  }
  const t = await res.text();
  return t.length > max ? t.slice(0, max) : t;
}

// ---------- kandidaterna ----------

// En artikel om staden (Southampton, Watford, Stevenage) är inte en artikel om laget.
// Står lagets hela namn med fler ord än staden i rubriken (Charlton Athletic, Oxford United) räcker
// det; annars ska rubriken eller adressen handla om fotboll.
const FOTBOLL = /\b(football|soccer|sport|fc|afc|efl|premier league|championship|league|cup|club|season|manager|boss|head coach|coach|striker|midfielder|defender|goalkeeper|keeper|winger|forward|players?|signing|signs|transfer|loan|injury|injured|squad|team news|goals?|scored?|wins?|won|defeat|draw|vs?|fixture|match|clash|derby|promotion|relegation|play-?offs?|stadium|fans|supporters|sack(ed|ing)?|predictions?)\b/i;
const ordI = (titel, url) => `${titel || ''} ${String(url || '').replace(/[-_/.]/g, ' ')}`;

// Ett rykte om en värvning eller en övergång, och en minnesartikel om en tidigare spelare.
const RYKTE = /\b(racing|race|target(s|ed|ing)?|eye(s|ing)?|linked|interest(ed)?|swoop|bid|chase|chasing|pursuit|rekindle[sd]?|monitor(s|ing)?|scout(s|ed|ing)?|joins|joined|signs for|should have signed|could sign|wants? to sign|january|transfer)\b/;
const MINNE = /\b(tributes?|dies|died|death|funeral|passed away|obituary|rip)\b/;

// Hur väl en rubrik handlar om just laget. En match mot motståndaren eller en artikel om flera av
// omgångens lag kan ha bilden från det andra laget, och en förhandstitt har ofta en grafik.
export function poang(titel, lag, { mot = null, alla = [] } = {}) {
  const t = String(titel || '').toLowerCase();
  let p = 0;
  const forst = Math.min(...namnen(lag).map((n) => { const i = t.indexOf(n.toLowerCase()); return i < 0 ? 999 : i; }));
  if (forst < 25) p += 1;
  if (mot && namner(titel, mot)) p -= 2;
  if (alla.some((x) => x !== lag && x !== mot && namner(titel, x))) p -= 1;
  if (/\b(vs?\.?|versus)\b|\d+\s*-\s*\d+/.test(t)) p -= 1;
  if (/predict|preview|odds|tips\b|line-?ups?|player ratings/.test(t)) p -= 1;
  // ett rykte om en värvning eller en övergång har spelaren i den andra klubbens tröja
  if (RYKTE.test(t)) p -= 2;
  // en annan klubb först i rubriken, och minnesord om en tidigare spelare
  if (annanKlubbForst(titel, lag)) p -= 2;
  if (MINNE.test(t)) p -= 2;
  return p;
}

// ESPN: artiklar om laget med bild och fotograf. Kategorin räcker inte (Arteta efter matchen mot
// Hull har Hull som kategori): rubriken ska nämna laget.
async function espn(lag, id, { fetchImpl, now, rang, dagar = DAGAR }) {
  if (!id) return [];
  const j = JSON.parse(await hamta(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?team=${id}&limit=25`, { fetchImpl }));
  return (j.articles || [])
    .filter((a) => a.type !== 'Media' && a.images && a.images[0] && a.images[0].url && a.published && now - Date.parse(a.published) < dagar * DAG)
    .filter((a) => (a.categories || []).some((c) => String(c.teamId || (c.team && c.team.id)) === String(id)))
    .filter((a) => namner(a.headline, lag) && !ANDRA_LAG.test(a.headline) && !LIVE.test(a.headline))
    .map((a) => ({
      bild: a.images[0].url,
      kalla: 'ESPN',
      foto: a.images[0].credit || null,
      sida: (a.links && a.links.web && a.links.web.href) || null,
      datum: new Date(a.published).toISOString(),
      poang: rang(a.headline),
    }));
}

// BBC Sport: lagets eget flöde (feeds.bbci.co.uk/sport/football/teams/<lag>/rss.xml) har veckans artiklar och
// matchrapporter med bild (ichef.bbci.co.uk), också för de lägre divisionerna. Bilden finns i flera bredder; 976
// bildpunkter räcker (…/ace/standard/240/…, …/news/240/… och …/images/ic/240x135/…). En artikel i lagets eget flöde
// handlar om laget: ett poäng till, och egen = true (matchbladens andra försök, veckansBilder med egnaBbc).
export const bbcBild = (u) => avkoda(u)
  .replace(/\/ace\/([a-z]+)\/\d{2,4}\//, '/ace/$1/976/')
  .replace(/\/news\/\d{2,4}\//, '/news/976/')
  .replace(/\/images\/ic\/(\d+)x(\d+|n)\//, (a, w, h) => `/images/ic/976x${h === 'n' ? 'n' : Math.round((976 * Number(h)) / Number(w))}/`);
async function bbc(lag, { fetchImpl, now, rang, dagar = DAGAR }) {
  const xml = await hamta(`https://feeds.bbci.co.uk/sport/football/teams/${slug(lag)}/rss.xml`, { fetchImpl });
  const ut = [];
  for (const m of String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const x = m[1];
    const falt = (tag) => { const r = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`).exec(x); return r ? avkoda(r[1]) : ''; };
    const titel = falt('title');
    const d = Date.parse(falt('pubDate'));
    const t = /<media:thumbnail\b[^>]*\burl="([^"]+)"/.exec(x);
    // BBC Sounds och iPlayer har programmets bild, inte ett foto från veckan
    if (/\/(sounds|iplayer)\//.test(falt('link'))) continue;
    if (!t || !Number.isFinite(d) || now - d > dagar * DAG || !namner(titel, lag) || ANDRA_LAG.test(titel) || LIVE.test(titel)) continue;
    const tl = titel.toLowerCase();
    ut.push({ bild: bbcBild(t[1]), titel, kalla: 'BBC Sport', foto: null, sida: falt('link').split('?')[0] || null, datum: new Date(d).toISOString(), poang: rang(titel) + 1, egen: !RYKTE.test(tl) && !MINNE.test(tl) });
  }
  return ut;
}

// Bing News: de senaste fotbollsartiklarna som nämner laget i rubriken (lokaltidningarna).
async function bing(lag, { fetchImpl, now, rang, dagar = DAGAR }) {
  // och tränaren (bilden av honom är oftast i klubbens kläder, från lokaltidningen)
  const fragor = [`${namnen(lag)[0]} FC`, `${lag} football`, `${namnen(lag)[0]} boss`];
  const sett = new Set();
  const ut = [];
  for (const q of fragor) {
    const xml = await hamta(`https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setlang=en-GB&cc=GB`, { fetchImpl });
    for (const x of parseRss(xml)) {
      let url = x.link;
      try { const u = new URL(x.link); if (/(^|\.)bing\.com$/.test(u.hostname) && u.searchParams.get('url')) url = u.searchParams.get('url'); } catch { /* */ }
      if (sett.has(url)) continue;
      sett.add(url);
      ut.push({ sida: url, titel: x.title, kalla: x.source || hostOf(url), datum: x.pubDate ? new Date(x.pubDate).toISOString() : null });
    }
  }
  return ut.filter((x) => x.datum && now - Date.parse(x.datum) < dagar * DAG && sidanDuger(x.titel, x.sida, lag))
    .map((x) => ({ ...x, poang: rang(x.titel) }));
}

// Rubriken nämner laget, handlar om fotboll och om A-laget, och sajten går att läsa.
function sidanDuger(titel, url, lag) {
  const ord = ordI(titel, url);
  const helt = /\s/.test(lag) && String(titel || '').toLowerCase().includes(lag.toLowerCase());
  return namner(titel, lag) && (helt || FOTBOLL.test(ord)) && !sparrad(url) && !annanKlubbsSajt(url, lag) && !newsCfg.excludeTitle.test(ord) && !ANDRA_LAG.test(ord) && !LIVE.test(ord);
}

// En sida → kandidat med sidans delningsbild, om sidan är från veckan.
async function franSidan(k, { fetchImpl, now, dagar = DAGAR }) {
  const s = sidansBild(await hamta(k.sida, { fetchImpl }));
  if (!s.bild) return null;
  const bild = new URL(s.bild, k.sida).href;
  const datum = k.datum || (s.datum && !Number.isNaN(Date.parse(s.datum)) ? new Date(s.datum).toISOString() : null);
  if (!datum || now - Date.parse(datum) > dagar * DAG) return null;
  return { bild, kalla: s.namn || k.kalla || hostOf(k.sida), foto: null, sida: k.sida, datum, poang: k.poang };
}

// Lagets kandidater, bäst först: rubriken som handlar mest om laget, ESPN (med fotograf) före
// sidorna, och den nyaste. Sidorna läses i den ordningen tills det finns sex bilder att välja på.
async function kandidater(lag, { espnId, kallor, mot, alla, fetchImpl, now, logg, minPoang = -Infinity, egnaBbc = false, dagar = DAGAR }) {
  const rang = (titel) => poang(titel, lag, { mot, alla });
  const opts = { fetchImpl, now, rang, dagar };
  const lista = [];
  try { lista.push(...(await espn(lag, espnId, opts))); } catch (err) { logg(`bilder: ESPN för ${lag}: ${err.message}`); }
  try { lista.push(...(await bbc(lag, opts))); } catch (err) { logg(`bilder: BBC för ${lag}: ${err.message}`); }
  for (const k of kallor || []) {
    if (k && k.url && sidanDuger(k.title, k.url, lag)) lista.push({ sida: k.url, titel: k.title, kalla: k.source, datum: k.publishedAt || null, poang: rang(k.title) });
  }
  try { lista.push(...(await bing(lag, opts))); } catch (err) { logg(`bilder: Bing för ${lag}: ${err.message}`); }
  lista.sort((a, b) => b.poang - a.poang || Boolean(b.bild) - Boolean(a.bild) || Date.parse(b.datum || 0) - Date.parse(a.datum || 0));
  // Med minPoang (matchbladen) tas bara artiklar som handlar om laget och inte om en annan klubb, ett rykte eller en
  // minnesstund. Med egnaBbc (andra försöket) duger också allt i lagets eget BBC-flöde utom rykten och minnesord.
  const fore = lista.slice(0, 6);
  for (let i = lista.length - 1; i >= 0; i--) if (lista[i].poang < minPoang && !(egnaBbc && lista[i].egen)) lista.splice(i, 1);
  const ut = [];
  const sett = new Set();
  for (const k of lista) {
    if (ut.length >= 6) break;
    if (k.bild) { ut.push(k); continue; }
    if (sett.has(k.sida)) continue;
    sett.add(k.sida);
    try {
      const x = await franSidan(k, opts);
      if (x) ut.push(x);
    } catch (err) {
      logg(`bilder: ${lag}, ${hostOf(k.sida)}: ${err.message}`);
    }
  }
  // Utan kandidater: de bästa som fanns, i loggen, så att det syns varför.
  if (!ut.length) logg(`bilder: ${lag}: ingen kandidat${fore.length ? ` (${fore.map((k) => `${k.poang} ${k.kalla || hostOf(k.sida)} "${String(k.titel || '').slice(0, 70)}"`).join('; ')})` : ' alls'}`);
  return ut;
}

// ---------- bilden ----------

// Verktyget som läser och förminskar bilden: sips i macOS, annars ImageMagick (magick i version 7,
// identify och convert i version 6). → 'sips', 'magick', 'convert' eller null
let verktyget;
export function bildverktyg() {
  if (verktyget !== undefined) return verktyget;
  const finns = (cmd) => { try { execFileSync(cmd, ['-version'], { stdio: 'ignore', timeout: 10000 }); return true; } catch { return false; } };
  verktyget = fs.existsSync('/usr/bin/sips') ? 'sips' : finns('magick') ? 'magick' : finns('convert') ? 'convert' : null;
  return verktyget;
}
const kor = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] });
// Bildens storlek. → { w, h }
function storlek(fil) {
  const v = bildverktyg();
  if (v === 'sips') {
    const g = kor('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', fil]);
    return { w: Number((g.match(/pixelWidth:\s*(\d+)/) || [])[1]), h: Number((g.match(/pixelHeight:\s*(\d+)/) || [])[1]) };
  }
  const [w, h] = kor(v === 'magick' ? 'magick' : 'identify', [...(v === 'magick' ? ['identify'] : []), '-format', '%w %h', `${fil}[0]`]).trim().split(/\s+/).map(Number);
  return { w, h };
}
// Förminskar till bredd bildpunkter, som jpeg i kvalitet 72.
function forminska(inn, ut, bredd) {
  const v = bildverktyg();
  if (v === 'sips') kor('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '--resampleWidth', String(bredd), inn, '--out', ut]);
  else kor(v, [`${inn}[0]`, '-auto-orient', '-resize', `${bredd}x`, '-strip', '-interlace', 'Plane', '-quality', '72', ut]);
}

// Hämtar, kontrollerar och förminskar bilden. → { data (jpeg), w, h } eller kastar
async function bilden(url, { fetchImpl, bredd = BREDD }) {
  if (INTE_FOTO.test(url) || sparrad(url)) throw new Error('inte ett foto');
  if (!bildverktyg()) throw new Error('varken sips eller ImageMagick');
  const b = await hamta(url, { fetchImpl, typ: 'bild' });
  if (b.length < 12000) throw new Error('för liten fil');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tidning-bild-'));
  try {
    const inn = path.join(dir, 'in');
    const ut = path.join(dir, 'ut.jpg');
    fs.writeFileSync(inn, b);
    const { w, h } = storlek(inn);
    if (!w || !h) throw new Error('okänt format');
    if (w < MIN_BREDD) throw new Error(`för smal (${w} px)`);
    if (w / h < 1.2 || w / h > 2.1) throw new Error(`inte liggande (${w}×${h})`);
    // En jämn grafik känns igen i BREDD bildpunkter, som gränsen är satt för.
    forminska(inn, ut, BREDD);
    const hk = Math.round((BREDD * h) / w);
    if (fs.statSync(ut).size / (BREDD * hk) < (bildverktyg() === 'sips' ? MIN_BYTE_PER_PX : MIN_BYTE_PER_PX_IM)) throw new Error('en grafik, inte ett foto');
    const b2 = Math.min(bredd, w);
    if (b2 !== BREDD) forminska(inn, ut, b2);
    return { data: fs.readFileSync(ut), w: b2, h: Math.round((b2 * h) / w) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- alla lagen ----------

async function iTur(lista, n, f) {
  const ut = new Array(lista.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, lista.length) }, async () => {
    while (i < lista.length) { const k = i++; ut[k] = await f(lista[k], k); }
  }));
  return ut;
}

// lagen: lagnamnen. espnId: lag → ESPN:s id (data/skoldar.json). kallor: lag → notisens källor
// [{url, title, source, publishedAt}]. mot: lag → motståndaren i omgången. mapp: dit bilderna skrivs.
// bredd: bildens bredd i bildpunkter (BREDD i tidningen, större i matchbladen). minPoang: lägsta poäng för artikeln
// (poang), så att en bild hellre saknas än visar fel lag. egnaBbc: allt i lagets eget BBC-flöde duger utom rykten och
// minnesord. dagar: hur gammal artikeln får vara. tagna: bilder som redan används (delas mellan anropen). alla: lagen i
// omgången, för poang (annars lagen i anropet).
// → Map lag → { lag, fil, kalla, foto, sida, datum, w, h } för de lag som fick en bild
export async function veckansBilder(lagen, { mapp, espnId = {}, kallor = {}, mot = {}, now = Date.now(), fetchImpl = globalThis.fetch, logg = () => {}, bredd = BREDD, minPoang = -Infinity, egnaBbc = false, dagar = DAGAR, tagna = new Set(), alla = null } = {}) {
  const unika = [...new Set(lagen.filter(Boolean))];
  const kand = await iTur(unika, 4, (lag) => kandidater(lag, { espnId: espnId[lag], kallor: kallor[lag], mot: mot[lag] || null, alla: alla || unika, fetchImpl, now, logg, minPoang, egnaBbc, dagar }));
  // bilderna i tur och ordning, så att samma bild inte hamnar hos två lag
  fs.mkdirSync(mapp, { recursive: true });
  const ut = new Map();
  for (const [i, lag] of unika.entries()) {
    for (const k of kand[i]) {
      const nyckel = k.bild.replace(/[?#].*$/, '');
      if (tagna.has(nyckel)) continue;
      try {
        const b = await bilden(k.bild, { fetchImpl, bredd });
        const hash = crypto.createHash('sha1').update(b.data).digest('hex');
        if (tagna.has(hash)) continue;
        tagna.add(nyckel);
        tagna.add(hash);
        const fil = `${slug(lag)}-${hash.slice(0, 8)}.jpg`;
        fs.writeFileSync(path.join(mapp, fil), b.data);
        ut.set(lag, { lag, fil, kalla: k.kalla || null, foto: k.foto || null, sida: k.sida || null, datum: k.datum || null, w: b.w, h: b.h });
        break;
      } catch (err) {
        logg(`bilder: ${lag}, ${String(k.bild).slice(0, 110)}: ${err.message}`);
      }
    }
  }
  return ut;
}

// Lagen i en notis: hemma och borta ur matchfilen, annars ur "Hemma – Borta".
export function lagenI(notis, details = {}) {
  const d = details[String(notis.id)];
  if (d && d.match && d.match.home && d.match.away) return [d.match.home, d.match.away];
  const m = String(notis.match || '').split(/\s+[–-]\s+/);
  return m.length === 2 ? m : [];
}
