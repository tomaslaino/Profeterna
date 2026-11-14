// Supporterpoddarna till tidningen inför omgången (config/poddar.js): hitta lagens poddar,
// välj veckans avsnitt, skriv ut det med whisper.cpp och låt Claude Code ta ut det mest
// intressanta inför matchen. Körs av scripts/tidning/poddar.mjs på iMacen.
//
// Ljudet och utskrifterna stannar i mappen utanför repot. Varje uppgift måste ha ett
// ordagrant citat som går att hitta i utskriften, annars stryks den: det är samma tanke som
// analysernas kontroller, att inget får komma ur minnet. Uppgifterna samlas sedan till en
// informationssida per match (skrivSida), grupperad efter ämne, med slag, podd och citat.

import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pc from '../../config/poddar.js';
import fc from '../../config/forum.js';
import mc from '../../config/media.js';
import lc from '../../config/lokal.js';
import fr from '../../config/forra.js';
import tc from '../../config/traff.js';
import newsCfg from '../../config/news.js';
import { jsonOf, unknownNumbers } from './kontroller.mjs';
import { claudeSvar, Stopp } from './claude.mjs';

const DAG = 86400000;
const UA = 'Matchfixarna/1.0 (poddlasare)';
const PATH = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin';
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ren = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
// Lagets namn som de kan stå i en rubrik: ESPN-namnet och söknamnen i config/news.js.
export const namnen = (lag) => [...new Set([lag, ...((newsCfg.names && newsCfg.names[lag]) || [])])];

function kor(cmd, args, { timeoutMs = 600000 } = {}) {
  return new Promise((ok, nej) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PATH } }, (err, stdout, stderr) => {
      if (err) nej(new Error(`${path.basename(cmd)}: ${String(stderr || err.message).trim().slice(-300)}`));
      else ok(stdout);
    });
  });
}

async function hamtaText(url, { timeoutMs = 30000, fetchImpl = globalThis.fetch } = {}) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ---------- flödet ----------

const avkoda = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();
const falt = (xml, namn) => {
  const m = xml.match(new RegExp(`<${namn}(?:\\s[^>]*)?>([\\s\\S]*?)</${namn}>`, 'i'));
  return m ? avkoda(m[1]) : null;
};
// "1:02:33", "62:33" eller sekunder → minuter.
export function minuterAv(s) {
  if (!s) return null;
  const d = String(s).trim().split(':').map(Number);
  if (d.some((x) => !Number.isFinite(x))) return null;
  const sek = d.length === 3 ? d[0] * 3600 + d[1] * 60 + d[2] : d.length === 2 ? d[0] * 60 + d[1] : d[0];
  return Math.round(sek / 60);
}

// Ett poddflöde (RSS) → {namn, avsnitt: [{id, titel, datum, ljud, sida, minuter, text}]}, nyast först.
export function lasFlode(xml) {
  const kanal = xml.split(/<item[\s>]/i)[0];
  const avsnitt = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const x = m[0];
    const ljud = (x.match(/<enclosure[^>]*\burl=["']([^"']+)["']/i) || [])[1];
    const datum = Date.parse(falt(x, 'pubDate') || '');
    if (!ljud || !Number.isFinite(datum)) continue;
    const adress = avkoda(ljud);
    const guid = falt(x, 'guid') || adress;
    avsnitt.push({
      id: crypto.createHash('sha1').update(guid).digest('hex').slice(0, 12),
      titel: falt(x, 'title') || 'Utan titel',
      datum: new Date(datum).toISOString(),
      ljud: adress,
      sida: falt(x, 'link'),
      minuter: minuterAv(falt(x, 'itunes:duration')),
      text: (falt(x, 'description') || falt(x, 'itunes:summary') || '').slice(0, 600),
    });
  }
  avsnitt.sort((a, b) => b.datum.localeCompare(a.datum));
  return { namn: falt(kanal, 'title'), avsnitt };
}

export async function hamtaFlode(url, opts) {
  return lasFlode(await hamtaText(url, opts));
}

// ---------- registret: lagens poddar ----------

// Poddens flöde hos Apple Podcasts, efter namn. → {namn, flode, apple} eller null.
export async function sokPodd(namn, opts = {}) {
  const url = `https://itunes.apple.com/search?media=podcast&entity=podcast&country=gb&limit=8&term=${encodeURIComponent(namn)}`;
  const j = JSON.parse(await hamtaText(url, opts));
  const vill = ren(namn).replace(/\b(the|podcast|pod|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const lik = (r) => {
    const har = ren(r.collectionName).replace(/\b(the|podcast|pod|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim();
    return har === vill ? 2 : har.includes(vill) || vill.includes(har) ? 1 : 0;
  };
  const traff = (j.results || []).filter((r) => r.feedUrl && lik(r)).sort((a, b) => lik(b) - lik(a))[0];
  return traff ? { namn: traff.collectionName, flode: traff.feedUrl, apple: traff.collectionViewUrl || null } : null;
}

const vanta = (ms) => new Promise((ok) => setTimeout(ok, ms));

// Poddarna som Apple Podcasts hittar på lagets namn och som lever: kandidaterna som Claude
// väljer bland (fragaEfterPoddar). Apple tål ungefär tjugo sökningar i minuten, därav pausen.
// → [{namn, av, flode, apple, senast}]
export async function appleKandidater(lag, { now = Date.now(), paus = 3200, ...opts } = {}) {
  const ut = new Map();
  for (const term of [`${lag} podcast`, `${lag} fc`]) {
    let j = null;
    for (let i = 0; i < 2 && !j; i++) {
      try {
        j = JSON.parse(await hamtaText(`https://itunes.apple.com/search?media=podcast&entity=podcast&country=gb&limit=12&term=${encodeURIComponent(term)}`, opts));
      } catch { await vanta(paus * 4); }
    }
    await vanta(paus);
    for (const r of (j && j.results) || []) {
      const sport = [r.primaryGenreName, ...(r.genres || [])].some((g) => /sport|soccer|football/i.test(String(g)));
      const senast = Date.parse(r.releaseDate || '');
      if (!r.feedUrl || !sport || !(now - senast < pc.levandeDagar * DAG) || ut.has(r.feedUrl)) continue;
      ut.set(r.feedUrl, { namn: r.collectionName, av: r.artistName || null, flode: r.feedUrl, apple: r.collectionViewUrl || null, senast: new Date(senast).toISOString().slice(0, 10) });
    }
    if (ut.size >= 3) break;
  }
  return [...ut.values()].slice(0, 8);
}

// Frågar Claude efter poddarnas namn för lagen. kandidater: {lag: [{namn, av, senast}]} ur
// appleKandidater. → {lag: [namn, …]}
export async function fragaEfterPoddar(lagen, { claude = claudeSvar, kandidater = {} } = {}) {
  const rad = (l) => `- ${l}${(kandidater[l] || []).length ? `\n${kandidater[l].map((k) => `    · ${k.namn}${k.av ? ` (av ${k.av})` : ''}, senaste avsnitt ${k.senast}`).join('\n')}` : '\n    (inga träffar hos Apple Podcasts)'}`;
  const r = await claude({
    system: pc.letaPrompt.replace('{sokningar}', pc.sokningar),
    prompt: `Klubbarna, och under var och en poddarna som Apple Podcasts hittar på klubbens namn:\n${lagen.map(rad).join('\n')}`,
    tools: ['WebSearch'], model: pc.model, effort: pc.letaEffort, timeoutMs: pc.timeoutMs,
  });
  const j = jsonOf(r.content);
  const ut = {};
  for (const lag of lagen) {
    const l = j && j.klubbar && j.klubbar[lag];
    ut[lag] = Array.isArray(l) ? l.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, 4) : [];
  }
  return ut;
}

// Poddarna med ett flöde som lever, av namnen. kandidater: lagets träffar hos Apple
// (appleKandidater); står namnet där behövs ingen ny sökning. → [{namn, flode, apple}]
export async function levandePoddar(namnLista, { now = Date.now(), logg = () => {}, kandidater = [], ...opts } = {}) {
  const ut = [];
  for (const namn of namnLista) {
    if (ut.length >= pc.poddarPerLag) break;
    try {
      const k = kandidater.find((x) => ren(x.namn) === ren(namn));
      const p = k ? { namn: k.namn, flode: k.flode, apple: k.apple } : await sokPodd(namn, opts);
      if (!p) { logg(`  ${namn}: finns inte hos Apple Podcasts`); continue; }
      if (ut.some((x) => x.flode === p.flode)) continue;
      const f = await hamtaFlode(p.flode, opts);
      const senast = f.avsnitt[0] ? Date.parse(f.avsnitt[0].datum) : 0;
      if (now - senast > pc.levandeDagar * DAG) { logg(`  ${p.namn}: inget avsnitt på ${pc.levandeDagar} dagar`); continue; }
      ut.push(p);
    } catch (err) {
      logg(`  ${namn}: ${err.message}`);
    }
  }
  return ut;
}

// Ska laget letas upp (igen)? post: registrets rad för laget. kanda: lagets poddar i
// config/poddar.js; har de ändrats sedan raden skrevs gäller de nya genast.
export function skaLetas(post, now = Date.now(), kanda = null) {
  if (!post || !post.kollad) return true;
  if (kanda && JSON.stringify(kanda) !== JSON.stringify(post.kanda || null)) return true;
  const dagar = (post.poddar || []).length ? pc.letaOmDagar.med : pc.letaOmDagar.utan;
  return now - Date.parse(post.kollad) > dagar * DAG;
}

// ---------- veckans avsnitt ----------

// Hur väl passar avsnittet inför matchen? Nämner rubriken motståndaren är det
// förhandssnacket, och det är det bästa; annars vinner det nyaste.
export function avsnittsPoang(a, { mot = null, now = Date.now() } = {}) {
  const alder = (now - Date.parse(a.datum)) / DAG;
  if (alder > pc.dagar || alder < -1) return -1;
  if (a.minuter != null && a.minuter < pc.minstMinuter) return -1;
  const t = ` ${ren(`${a.titel} ${a.text}`)} `;
  let p = 10 - alder;
  if (mot && namnen(mot).some((n) => t.includes(` ${ren(n)} `))) p += 4;
  if (/\b(preview|pre match|prematch|ahead of|look ahead|other side)\b/.test(t)) p += 1;
  return p;
}

// Avsnitten att skriva ut för ett lag, de bästa först. floden: [{podd, avsnitt}].
export function valjAvsnitt(floden, { mot = null, now = Date.now(), gjorda = new Set() } = {}) {
  return floden
    .flatMap((f) => f.avsnitt.slice(0, 8).map((a) => ({ ...a, podd: f.podd, p: avsnittsPoang(a, { mot, now }) })))
    .filter((a) => a.p >= 0 && !gjorda.has(a.id))
    .sort((a, b) => b.p - a.p);
}

// ---------- utskriften ----------

// En srt-fil → ett stycke per minut: "[12] text".
export function perMinut(srt) {
  const ut = new Map();
  for (const b of String(srt).split(/\r?\n\s*\r?\n/)) {
    const m = b.match(/(\d\d):(\d\d):\d\d[,.]\d+ -->/);
    if (!m) continue;
    const min = +m[1] * 60 + +m[2];
    const t = b.split(/\r?\n/).slice(2).join(' ').trim();
    if (t) ut.set(min, `${ut.get(min) || ''} ${t}`.trim());
  }
  return [...ut].sort((a, b) => a[0] - b[0]).map(([k, v]) => `[${k}] ${v}`).join('\n');
}

// Whisper stavar namn bättre om den har sett dem. spelare: namn ur matchens trupper.
export function whisperLedtrad(lag, mot, spelare = []) {
  const s = `A football supporters' podcast about ${lag}${mot ? `, ahead of the match against ${mot}` : ''}.`;
  return spelare.length ? `${s} Players: ${spelare.slice(0, 45).join(', ')}.` : s;
}

// Hämtar ljudet, skriver ut de första pc.minuter minuterna och tar bort ljudet.
// → utskriften, ett stycke per minut. Utskriften sparas i mapp/utskrifter/<id>.min.txt.
export async function skrivUt(a, { mapp, ledtrad = '', logg = () => {} }) {
  const ut = path.join(mapp, 'utskrifter');
  const ljud = path.join(mapp, 'ljud');
  fs.mkdirSync(ut, { recursive: true });
  fs.mkdirSync(ljud, { recursive: true });
  const fil = path.join(ut, `${a.id}.min.txt`);
  if (fs.existsSync(fil) && fs.statSync(fil).size > 500) return fs.readFileSync(fil, 'utf8');
  const mp3 = path.join(ljud, `${a.id}.mp3`);
  const wav = path.join(ljud, `${a.id}.wav`);
  const bas = path.join(ut, a.id);
  try {
    const t0 = Date.now();
    await kor('curl', ['-sSL', '--fail', '--max-time', '900', '--max-filesize', '600000000', '-A', UA, '-o', mp3, a.ljud], { timeoutMs: 960000 });
    await kor('ffmpeg', ['-nostdin', '-loglevel', 'error', '-y', '-i', mp3, '-t', String(pc.minuter * 60), '-ar', '16000', '-ac', '1', wav], { timeoutMs: 600000 });
    fs.rmSync(mp3, { force: true });
    const args = ['-m', path.join(mapp, pc.modell), '-f', wav, '-l', 'en', '-t', String(pc.tradar), '-osrt', '-of', bas];
    if (ledtrad) args.push('--prompt', ledtrad);
    await kor(pc.whisper, args, { timeoutMs: 90 * 60000 });
    const text = perMinut(fs.readFileSync(`${bas}.srt`, 'utf8'));
    fs.rmSync(`${bas}.srt`, { force: true });
    if (text.length < 500) throw new Error('utskriften blev tom');
    fs.writeFileSync(fil, `${text}\n`);
    logg(`  utskrivet på ${Math.round((Date.now() - t0) / 60000)} min: ${a.podd} – ${a.titel}`);
    return text;
  } finally {
    fs.rmSync(mp3, { force: true });
    fs.rmSync(wav, { force: true });
  }
}

// ---------- urvalet ----------

const ordAv = (s) => ren(s).split(' ').filter(Boolean);

// Står citatet i utskriften? Ordagrant, eller så att nästan alla ord står i följd
// (maskinen och Claude kan skilja sig på ett skiljetecken eller ett sammandraget ord).
export function citatStar(citat, utskrift) {
  const c = ordAv(citat);
  if (c.length < 5) return false;
  const u = ordAv(String(utskrift).replace(/\[\d+\]/g, ' '));
  const text = ` ${u.join(' ')} `;
  if (text.includes(` ${c.join(' ')} `)) return true;
  // Fönster på citatets längd: minst 85 % av orden på rätt plats i något fönster.
  const forsta = new Set(c.slice(0, 3));
  for (let i = 0; i + c.length <= u.length + 2; i++) {
    if (!forsta.has(u[i]) && !forsta.has(u[i + 1])) continue;
    for (const d of [0, 1, -1]) {
      let lika = 0;
      for (let k = 0; k < c.length; k++) if (u[i + d + k] === c[k]) lika++;
      if (lika >= Math.ceil(c.length * 0.85)) return true;
    }
  }
  return false;
}

const TIPS_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*|odds\w*|favorit(?:en|er|erna)?|skräll\w*)\b/i;
const antalOrd = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const AMNEN = Object.keys(pc.amnen);

// Står namnet i utskriften? Förnamnet räcker (maskinen stavar efternamn hur som helst).
export function vemStar(vem, utskrift) {
  const n = ordAv(vem).filter((o) => o.length >= 3);
  if (!n.length || n.length > 4) return false;
  return ` ${ordAv(String(utskrift).replace(/\[\d+\]/g, ' ')).join(' ')} `.includes(` ${n[0]} `);
}

// Claudes svar → uppgifterna som håller: rätt form, citatet står i utskriften, inga tips.
// Citatet på svenska (sagt) och vem som säger det följer med när de håller.
// → {handlarOm, uppgifter: [{a, t, s, min, vikt, citat, sagt, vem}], strukna}
export function uppgifterAv(content, utskrift) {
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
    const ok = t && antalOrd(t) <= 65 && !TIPS_RE.test(t) && citatStar(x.citat, utskrift);
    if (!ok) { strukna++; continue; }
    const sagt0 = typeof x.sagt === 'string' ? x.sagt.trim().replace(/^[”"»«'‘’]+|[”"»«'‘’]+$/g, '') : '';
    const sagt = sagt0 && antalOrd(sagt0) >= 4 && antalOrd(sagt0) <= 50 && !TIPS_RE.test(sagt0) ? sagt0 : null;
    const vem0 = typeof x.vem === 'string' ? x.vem.trim() : '';
    const vem = sagt && vem0 && vem0.length <= 40 && vemStar(vem0, utskrift) ? vem0 : null;
    uppgifter.push({ a, t, s, min: Number.isFinite(Number(x.min)) ? Math.round(Number(x.min)) : null, vikt, citat: String(x.citat).trim(), sagt, vem });
  }
  uppgifter.sort((p, q) => q.vikt - p.vikt);
  return { rattKlubb: j.ratt_klubb !== false, handlarOm: typeof j.handlar_om === 'string' ? j.handlar_om.trim() : null, uppgifter: uppgifter.slice(0, pc.uppgifterPerAvsnitt), strukna };
}

// Tar ut det intressanta ur ett utskrivet avsnitt. → {handlarOm, uppgifter, strukna, sekunder}
export async function taUt(a, utskrift, { lag, mot = null, avspark = null, spelare = [], now = () => new Date(), claude = claudeSvar } = {}) {
  const fraga = [
    `Idag är det ${nowFmt.format(now())}.`,
    `Laget: ${lag}.${mot ? ` Nästa match: mot ${mot}${avspark ? `, ${nowFmt.format(new Date(avspark))}` : ''}.` : ''}`,
    `Podden: ${a.podd}. Avsnittet: "${a.titel}", från ${nowFmt.format(new Date(a.datum))}.`,
    spelare.length ? `Spelare i de två lagens trupper (för stavningen): ${spelare.join(', ')}.` : '',
    `\nUtskriften:\n${utskrift}`,
  ].filter(Boolean).join('\n');
  const r = await claude({ system: pc.urvalPrompt.replace('{flest}', pc.uppgifterPerAvsnitt), prompt: fraga, tools: [], model: pc.model, effort: pc.effort, timeoutMs: pc.timeoutMs });
  const u = r.refused ? null : uppgifterAv(r.content, utskrift);
  if (!u) throw new Error(r.refused ? 'Claude avböjde' : 'svaret gick inte att läsa');
  // Uppgiftens id: avsnittet och platsen i listan. Sidan hänvisar till dem.
  u.uppgifter.forEach((x, i) => { x.id = `${a.id}-${i + 1}`; });
  return { ...u, sekunder: r.seconds };
}

// ---------- informationssidan per match ----------

const SAKERHET = ['b', 'h', 'o'];

// Det sidan bygger på: lagets senaste poddavsnitt, forumläsningar (src/analyser/forum.mjs),
// artiklar i de insatta medierna och hos klubben, i lokaltidningen och i motståndarens intervju
// (src/analyser/media.mjs, config/lokal.js), förra klubbens supportrar om lagets nya tränare eller
// spelare (src/analyser/forra.mjs), och deras uppgifter med vikt nog.
// typ: 'podd', 'forum', 'media', 'lokal' (klubben eller lokaltidningen), 'motstand' (intervjun i
// motståndarens medier) eller 'forra' (förra klubben); podd är poddens, forumets eller källans namn.
// datum är uppgiftens dag: foruminläggets, annars avsnittets eller artikelns.
// → {lag: {namn: [{id, a, s, vikt, t, sagt, vem, podd, typ, datum}]}, kallor: {namn: [{podd, avsnitt, datum, adress, typ, om?}]}}
// (om: personen som förra klubbens sida handlar om)
const arPodd = (a) => !a.typ || a.typ === 'podd';
const LOKALA = ['lokal', 'motstand'];
// Källans slag som redaktören får det (skrivSida, pc.sidaPrompt).
const KALLNYCKEL = { forum: 'forum', media: 'insatta', lokal: 'lokalt', motstand: 'intervju', forra: 'förra_klubben' };

// Dagen så många dagar före matchens dag (svensk tid), som 'YYYY-MM-DD': det äldsta som får stå i matchbladet.
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
export function dagarFore(avspark, dagar) {
  const t = Date.parse(avspark);
  if (!Number.isFinite(t)) return null;
  const [y, m, d] = ymd.format(new Date(t)).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - dagar)).toISOString().slice(0, 10);
}

// avspark: matchens avspark. Bara avsnitt, artiklar och foruminlägg från de senaste pc.sidan.dagarFore dagarna
// före matchen tas med (användarens beslut 2026-11-14: "helst från senaste dagarna. I värsta fall 1 vecka gammalt").
export function sidansUnderlag(fil, lagen, { avspark = null } = {}) {
  const ut = { lag: {}, kallor: {} };
  const fran = pc.sidan.dagarFore ? dagarFore(avspark, pc.sidan.dagarFore) : null;
  const dagAv = (x, a) => String(x.tid || a.datum).slice(0, 10);
  for (const lag of lagen) {
    const post = fil && fil.lag && fil.lag[lag];
    const med = (x, a) => x.id && x.vikt >= pc.minstVikt && (!fran || dagAv(x, a) >= fran);
    const alla = ((post && post.avsnitt) || []).filter((a) => (a.uppgifter || []).some((x) => med(x, a)))
      .sort((a, b) => b.datum.localeCompare(a.datum));
    // Forumen och medierna läses vid varje genomgång: de räknas för sig, så att poddarna står kvar,
    // och varje forum för sig (de senaste läsningarna av vart och ett av lagets forum).
    const forum = alla.filter((a) => a.typ === 'forum');
    const avsnitt = [...alla.filter(arPodd).slice(0, pc.sidan.avsnitt), ...forum.filter((a, i) => forum.slice(0, i).filter((x) => x.podd === a.podd).length < fc.tillSidan), ...alla.filter((a) => a.typ === 'media').slice(0, mc.tillSidan),
      ...alla.filter((a) => LOKALA.includes(a.typ)).slice(0, lc.tillSidan), ...alla.filter((a) => a.typ === 'forra').slice(0, fr.tillSidan)];
    ut.lag[lag] = avsnitt.flatMap((a) => a.uppgifter.filter((x) => med(x, a)).map((x) => ({ id: x.id, a: x.a || 'match', s: x.s, vikt: x.vikt, t: x.t, sagt: x.sagt || null, vem: x.vem || null, podd: a.podd, typ: a.typ || 'podd', datum: dagAv(x, a) })));
    ut.kallor[lag] = avsnitt.map((a) => ({ podd: a.podd, avsnitt: a.titel, datum: a.datum.slice(0, 10), adress: a.sida || a.apple || null, typ: a.typ || 'podd', ...(a.om ? { om: a.om } : {}) }));
  }
  return ut;
}

// Uppgifterna sidan bygger på, som en nyckel: ändras den skrivs sidan om. pc.sidan.version skriver om sidorna
// utan att avsnitten tas ut på nytt.
export const sidNyckel = (u) => `${pc.promptVersion}|${pc.sidan.version}|${Object.values(u.lag).flat().map((x) => x.id).sort().join(',')}`;

// En punkt under laget (underlaget till matchbladet) av en eller flera uppgifter. datum står bredvid podd, ett per
// källa: dagen då källan sa det (den senaste när den sa det flera gånger).
function punkt(ur) {
  const kalla = ur.slice().sort((p, q) => q.vikt - p.vikt);
  const typer = [...new Set(kalla.map((x) => x.typ || 'podd'))];
  const podd = [...new Set(kalla.map((x) => x.podd))];
  const datum = podd.map((n) => kalla.filter((x) => x.podd === n).map((x) => x.datum || '').sort().at(-1) || null);
  return {
    t: kalla[0].t,
    // det minst säkra slaget gäller
    s: SAKERHET[Math.max(...kalla.map((x) => SAKERHET.indexOf(x.s)))] || 'h',
    vikt: kalla[0].vikt,
    podd,
    ...(datum.some(Boolean) ? { datum } : {}),
    typ: typer.length > 1 ? 'blandat' : typer[0],
  };
}

// Lagets uppgifter som de är, grupperade i ämnenas ordning, högst pc.sidan.punkterPerLag med de tyngsta först.
// De står under laget i data/poddsidor.json som underlag; tidningen trycker artikeltexten (text).
function delAv(lag, uppgifter, kallor) {
  const alla = uppgifter.slice().sort((p, q) => q.vikt - p.vikt).slice(0, pc.sidan.punkterPerLag);
  const grupper = AMNEN.map((amne) => ({ amne, punkter: alla.filter((x) => x.a === amne).map((x) => { const { vikt, ...r } = punkt([x]); return r; }) })).filter((g) => g.punkter.length);
  return { lag, kallor, grupper };
}

// Lagets text utan redaktör: de tyngsta uppgifterna som löptext, ett stycke per ämne.
function textUtan(uppgifter) {
  const alla = uppgifter.slice().sort((p, q) => q.vikt - p.vikt).slice(0, pc.sidan.punkterPerLag);
  return AMNEN.map((amne) => alla.filter((x) => x.a === amne).map((x) => x.t.trim()).join(' ')).filter(Boolean);
}

// Matchbladet utan redaktör: uppgifterna som löptext under laget, utan rubrik, introduktion och sammanfattning.
export function sidaUtan(underlag, lagen) {
  return {
    rubrik: null,
    ingress: null,
    summering: null,
    citat: null,
    delar: lagen.map((lag) => ({ ...delAv(lag, underlag.lag[lag], underlag.kallor[lag]), text: textUtan(underlag.lag[lag]) })),
  };
}

// Ett citat som det trycks: på svenska, med vem som sa det, källan och dagen (aldrig det engelska).
const citatAv = (c) => ({ sagt: c.sagt, vem: c.vem || null, podd: c.podd, typ: c.typ || 'podd', datum: c.datum || null });

const RAKNEORD = /^(två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv)$/i;

// Redaktörens svar → matchbladet: rubrik, introduktion (ingress; ingen sedan 2026-11-12, när sidan.ingressOrd är 0),
// ett till några stycken per lag med lagets citat (bara ett kort: sidan.citatOrd) och
// personerna som nämns (namn, i fetstil i tidningen), och sammanfattning. Sedan 2026-11-11 har varje lag sitt citat
// (förut högst ett för sidan, som fortfarande tas emot). En text med tipsord, för många ord eller tal som inte står i
// uppgifterna stryks: rubriken får mallen, introduktionen och sammanfattningen faller bort och lagets text blir
// uppgifterna som löptext (textUtan). Citatet tas ur lagets uppgift som redaktören pekar på, aldrig ur svaret, och ett
// namn som inte står i texten stryks. → sidan, eller null om svaret inte går att läsa.
export function sidaAv(content, underlag, lagen) {
  let j;
  try { j = jsonOf(content); } catch { return null; }
  if (!j || !j.lag || typeof j.lag !== 'object') return null;
  const alla = Object.values(underlag.lag).flat();
  const allt = alla.map((x) => `${x.t}\n${x.sagt || ''}`).join('\n');
  // Källornas namn får stå i texten: siffran i "SK3 TV" och "The ME7 Podcast" är inget påhittat tal.
  const kallorna = [...new Set(alla.map((x) => x.podd).filter(Boolean))].join('\n');
  const fel = [];
  const varfor = (t, flest) => {
    const tips = t.match(TIPS_RE);
    // Redaktören får räkna ihop (”fyra spelare borta”): små räkneord i bokstäver släpps.
    const tal = unknownNumbers([t], [allt, lagen.join(' '), kallorna]).filter((x) => !RAKNEORD.test(String(x)));
    return !t ? 'saknas' : antalOrd(t) > flest ? `${antalOrd(t)} ord` : tips ? `tipsord (${tips[0]})` : tal.length ? `okända tal (${tal.join(', ')})` : null;
  };
  const text = (v, flest, vad) => {
    const t = typeof v === 'string' ? v.trim() : '';
    const why = varfor(t, flest);
    if (why) fel.push(`${vad}: ${why}`);
    return why ? null : t;
  };
  const delar = lagen.map((lag) => {
    const egna = underlag.lag[lag];
    const del = delAv(lag, egna, underlag.kallor[lag]);
    if (!egna.length) return { ...del, text: [] };
    const svar = j.lag[lag] && typeof j.lag[lag] === 'object' && !Array.isArray(j.lag[lag]) ? j.lag[lag] : {};
    const stycken = (Array.isArray(svar.text) ? svar.text : [svar.text]).filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
    const ord = stycken.reduce((a, t) => a + antalOrd(t), 0);
    const why = !stycken.length ? 'saknas' : stycken.length > pc.sidan.stycken + 1 ? `${stycken.length} stycken` : ord > pc.sidan.lagOrd + Math.round(pc.sidan.lagOrd / 3) ? `${ord} ord`
      : stycken.map((t) => varfor(t, Infinity)).find(Boolean) || null;
    if (why) fel.push(`${lag}: ${why}`);
    const lc = typeof svar.citat === 'string' && egna.find((x) => x.id === svar.citat && x.sagt && antalOrd(x.sagt) <= pc.sidan.citatOrd + 4);
    const namn = why ? [] : [...new Set((Array.isArray(svar.namn) ? svar.namn : []).filter((n) => typeof n === 'string').map((n) => n.trim()))]
      .filter((n) => n.length > 2 && stycken.some((t) => t.includes(n)));
    return { ...del, text: why ? textUtan(egna) : stycken, ...(lc ? { citat: citatAv(lc) } : {}), ...(namn.length ? { namn } : {}) };
  });
  const c = !delar.some((d) => d.citat) && typeof j.citat === 'string' && alla.find((x) => x.id === j.citat && x.sagt);
  return {
    rubrik: text(j.rubrik, pc.sidan.rubrikOrd + 3, 'rubriken'),
    ingress: pc.sidan.ingressOrd ? text(j.ingress, pc.sidan.ingressOrd + 15, 'introduktionen') : null,
    summering: text(j.summering, pc.sidan.summeringOrd + 15, 'sammanfattningen'),
    citat: c ? citatAv(c) : null,
    delar,
    fel,
  };
}

// Skriver matchbladet av uppgifterna i poddfilen. lagen: [hemma, borta].
// → {rubrik, ingress, summering, citat, delar: [{lag, kallor, grupper, text: [stycken]}], nyckel, redigerad, sekunder}
// eller null om inget lag har något. Fel från Claude Code (Stopp) kastas; annars blir sidan oredigerad.
// kallTraff: (lag, källa) → källans träffsäkerhet om truppen som text, eller null (config/traff.js).
export async function skrivSida(fil, lagen, { avspark = null, now = () => new Date(), claude = claudeSvar, logg = () => {}, kallTraff = () => null } = {}) {
  const underlag = sidansUnderlag(fil, lagen, { avspark });
  if (!Object.values(underlag.lag).some((l) => l.length)) return null;
  const nyckel = sidNyckel(underlag);
  let sida = null;
  let sekunder = 0;
  try {
    const system = pc.sidaPrompt.replace('{rubrikOrd}', pc.sidan.rubrikOrd).replace('{ingressOrd}', pc.sidan.ingressOrd).replace('{stycken}', pc.sidan.stycken)
      .replace('{lagOrd}', pc.sidan.lagOrd).replace('{summeringOrd}', pc.sidan.summeringOrd).replace('{meningar}', pc.sidan.meningar).replace('{citatOrd}', pc.sidan.citatOrd);
    const data = { match: lagen.join(' – '), ...(avspark ? { avspark: nowFmt.format(new Date(avspark)) } : {}), lag: Object.fromEntries(lagen.map((lag) => [lag, underlag.lag[lag].map((x) => ({ id: x.id, amne: x.a, slag: x.s, vikt: x.vikt, [KALLNYCKEL[x.typ] || 'podd']: x.podd, datum: x.datum, uppgift: x.t, ...(x.sagt ? { citat: x.sagt } : {}) }))])) };
    // Källornas träffsäkerhet om truppen, när den är prövad tillräckligt många gånger: redaktören får den
    // vid uppgiften och en rad om hur den ska användas (config/traff.js).
    let traffRad = '';
    for (const lag of lagen) {
      underlag.lag[lag].forEach((x, i) => {
        const t = kallTraff(lag, x.podd);
        if (t) { data.lag[lag][i].traffsakerhet = t; traffRad = tc.redaktor; }
      });
    }
    const r = await claude({ system: system + traffRad, prompt: `Idag är det ${nowFmt.format(now())}.\n\nUnderlaget (JSON):\n${JSON.stringify(data)}`, tools: [], model: pc.model, effort: pc.sidan.effort, timeoutMs: pc.timeoutMs });
    sekunder = r.seconds;
    sida = r.refused ? null : sidaAv(r.content, underlag, lagen);
    if (!sida) logg(`  sidan ${lagen.join(' – ')}: redaktörens svar höll inte, uppgifterna står som löptext`);
    else if (sida.fel.length) logg(`  sidan ${lagen.join(' – ')}: ${sida.fel.join('; ')}`);
    if (sida) delete sida.fel;
  } catch (err) {
    if (err instanceof Stopp) throw err;
    logg(`  sidan ${lagen.join(' – ')}: ${err.message}`);
  }
  const redigerad = Boolean(sida);
  return { ...(sida || sidaUtan(underlag, lagen)), nyckel, redigerad, sekunder };
}

// ---------- till tidningen ----------

const SLAG = { b: 'bekräftat', h: 'hört i podden', o: 'supportrarnas åsikt' };
const FORUMSLAG = { b: 'bekräftat', h: 'skrivet på forumet', o: 'supportrarnas åsikt' };
const MEDIASLAG = { b: 'bekräftat', h: 'de insattas egen uppgift', o: 'de insattas åsikt' };
const LOKALSLAG = { b: 'bekräftat', h: 'lokaltidningens egen uppgift', o: 'en åsikt' };
const INTERVJUSLAG = { b: 'bekräftat', h: 'supporterns egen uppgift', o: 'supporterns åsikt' };
const FORRASLAG = { b: 'bekräftat', h: 'förra klubbens supportrars egen uppgift', o: 'förra klubbens supportrars åsikt' };

// Det tidningen får om ett lag ur omgångens poddfil (scripts/tidning/poddar.mjs):
// de senaste avsnittens bästa uppgifter. → [{podd, avsnitt, datum, adress, uppgifter: [{uppgift, slag}]}]
export function poddUnderlag(fil, lag) {
  const post = fil && fil.lag && fil.lag[lag];
  if (!post || !Array.isArray(post.avsnitt)) return [];
  const avsnitt = post.avsnitt.filter((a) => arPodd(a) && a.uppgifter && a.uppgifter.length).sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, pc.avsnittTillTidningen);
  let kvar = pc.uppgifterPerLag;
  const ut = [];
  for (const a of avsnitt) {
    const u = a.uppgifter.filter((x) => x.vikt >= pc.minstVikt).slice(0, kvar);
    if (!u.length) continue;
    kvar -= u.length;
    ut.push({ podd: a.podd, avsnitt: a.titel, datum: a.datum.slice(0, 10), adress: a.sida || a.apple || null, uppgifter: u.map((x) => ({ uppgift: x.t, slag: SLAG[x.s] || SLAG.h })) });
    if (kvar <= 0) break;
  }
  return ut;
}

// Det tidningen får ur lagets supporterforum: de bästa uppgifterna ur den senaste läsningen av
// vart och ett av forumen, högst pc.uppgifterPerLag tillsammans, och forumen i den ordningen.
// → [{forum, tradar, datum, adress, uppgifter: [{uppgift, slag}]}]
export function forumUnderlag(fil, lag) {
  const post = fil && fil.lag && fil.lag[lag];
  if (!post || !Array.isArray(post.avsnitt)) return [];
  const lasningar = post.avsnitt.filter((a) => a.typ === 'forum' && (a.uppgifter || []).some((x) => x.vikt >= pc.minstVikt))
    .sort((a, b) => b.datum.localeCompare(a.datum));
  const senaste = lasningar.filter((a, i) => lasningar.slice(0, i).filter((x) => x.podd === a.podd).length < fc.tillTidningen);
  const basta = senaste.flatMap((a) => a.uppgifter.filter((x) => x.vikt >= pc.minstVikt).map((x) => ({ a, x })))
    .sort((p, q) => q.x.vikt - p.x.vikt).slice(0, pc.uppgifterPerLag);
  return senaste.filter((a) => basta.some((b) => b.a === a)).sort((p, q) => Math.max(...basta.filter((b) => b.a === q).map((b) => b.x.vikt)) - Math.max(...basta.filter((b) => b.a === p).map((b) => b.x.vikt)))
    .map((a) => ({ forum: a.podd, tradar: (a.tradar || []).map((t) => t.titel), datum: a.datum.slice(0, 10), adress: a.sida || null, uppgifter: basta.filter((b) => b.a === a).map(({ x }) => ({ uppgift: x.t, slag: FORUMSLAG[x.s] || FORUMSLAG.h })) }));
}

// Lagets artiklar av slagen typer, de senaste flest med uppgifter, och deras bästa uppgifter.
// slag: (artikeln) → {b, h, o} med uppgifternas slag i ord. extra: (artikeln) → fler fält.
function artikelUnderlag(fil, lag, { typer, flest, slag, extra = () => ({}) }) {
  const post = fil && fil.lag && fil.lag[lag];
  if (!post || !Array.isArray(post.avsnitt)) return [];
  let kvar = pc.uppgifterPerLag;
  const ut = [];
  for (const a of post.avsnitt.filter((x) => typer.includes(x.typ) && (x.uppgifter || []).some((u) => u.vikt >= pc.minstVikt)).sort((p, q) => String(q.datum).localeCompare(String(p.datum))).slice(0, flest)) {
    const u = a.uppgifter.filter((x) => x.vikt >= pc.minstVikt).slice(0, kvar);
    if (!u.length) continue;
    kvar -= u.length;
    const ord = slag(a);
    ut.push({ kalla: a.podd, ...extra(a), titel: a.titel, datum: String(a.datum).slice(0, 10), adress: a.sida || null, uppgifter: u.map((x) => ({ uppgift: x.t, slag: ord[x.s] || ord.h })) });
    if (kvar <= 0) break;
  }
  return ut;
}

// Det tidningen får ur de insatta medierna: de senaste artiklarnas bästa uppgifter.
// → [{kalla, titel, datum, adress, uppgifter: [{uppgift, slag}]}]
export function mediaUnderlag(fil, lag) {
  return artikelUnderlag(fil, lag, { typer: ['media'], flest: mc.tillTidningen, slag: () => MEDIASLAG });
}

// Det tidningen får från klubben, lokaltidningen och motståndarens intervju med en av lagets supportrar
// (config/lokal.js): de senaste artiklarnas bästa uppgifter. → [{kalla, kalltyp, titel, datum, adress, uppgifter: [{uppgift, slag}]}]
export function lokalUnderlag(fil, lag) {
  return artikelUnderlag(fil, lag, {
    typer: LOKALA, flest: lc.tillTidningen,
    slag: (a) => (a.typ === 'motstand' ? INTERVJUSLAG : LOKALSLAG),
    extra: (a) => ({ kalltyp: a.typ === 'motstand' ? 'motståndarens intervju med en av lagets supportrar' : 'klubben eller lokaltidningen' }),
  });
}

// Det förra klubbens supportrar har skrivit om lagets nya tränare eller spelare (config/forra.js): de senaste
// sidornas bästa uppgifter. → [{kalla, om, fran, titel, datum, adress, uppgifter: [{uppgift, slag}]}]
export function forraUnderlag(fil, lag) {
  return artikelUnderlag(fil, lag, { typer: ['forra'], flest: fr.tillTidningen, slag: () => FORRASLAG, extra: (a) => ({ om: a.om || null, fran: a.fran || null }) });
}

// Avsnitten (forumläsningarna och artiklarna) som ligger i poddfilen, som en nyckel: ändras den har det kommit nytt.
export function poddNyckel(fil) {
  if (!fil || !fil.lag) return '';
  return Object.values(fil.lag).flatMap((p) => (p.avsnitt || []).filter((a) => a.uppgifter && a.uppgifter.some((x) => x.vikt >= pc.minstVikt)).map((a) => a.id)).sort().join(',');
}

// Matchbladen som de läggs ut (data/poddsidor.json): omgångens matcher i kupongens ordning, bara de
// som har ett blad. Citaten på engelska och utskrifterna följer aldrig med; sidans citat är på svenska.
// matcher är hela kupongen, också matcherna utan blad, för innehållet i Helgarderat (public/helgarderat.js).
// nu är numret som ligger ute: ett blad där för en match som jobbet inte har något eget blad till står kvar
// (2026-11-13, landskamperna: lagen har inga supporterpoddar eller forum, och deras blad är handskrivna i
// data/poddsidor.json, "hand": true). Det gäller bara samma omgång (samma lördag; numret kan vara lagt innan
// omgångens id fanns).
// → {omgang, uppdaterad, amnen, matcher: [{id, nr, match, avspark}], sidor: [{id, nr, match, lag, rubrik, ingress,
//   summering, citat, delar}]} eller null
export const sammaOmgang = (a, b) => Boolean(a && b) && String(a).slice(0, 10) === String(b).slice(0, 10);
export function poddsidor(fil, round, nu = null) {
  if (!round) return null;
  const egen = fil && fil.omgang === round.id && fil.sidor ? fil.sidor : {};
  const forra = new Map(nu && sammaOmgang(nu.omgang, round.id) && Array.isArray(nu.sidor) ? nu.sidor.map((s) => [String(s.id), s]) : []);
  const sidor = round.matcher.map((x, i) => {
    const s = egen[String(x.id)];
    if (!s || !Array.isArray(s.delar) || !s.delar.some((d) => (d.grupper || []).length || (d.text || []).length)) {
      const kvar = forra.get(String(x.id));
      return kvar ? { ...kvar, nr: i + 1, avspark: x.avspark || kvar.avspark || null } : null;
    }
    return { id: String(x.id), nr: i + 1, match: s.match, lag: s.lag, avspark: x.avspark || s.avspark || null, skriven: s.skriven, rubrik: s.rubrik || null, ingress: s.ingress || null,
      summering: s.summering || null, ...(s.citat ? { citat: s.citat } : {}), delar: s.delar };
  }).filter(Boolean);
  const matcher = round.matcher.map((x, i) => ({ id: String(x.id), nr: i + 1, match: x.match || null, avspark: x.avspark || null }));
  const uppdaterad = (fil && fil.omgang === round.id && fil.uppdaterad) || (nu && nu.uppdaterad) || null;
  return sidor.length ? { omgang: round.id, uppdaterad, amnen: pc.amnen, matcher, sidor } : null;
}
