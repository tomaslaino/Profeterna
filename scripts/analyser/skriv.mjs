#!/usr/bin/env node
// Skriver allt AI-innehåll på sajten från den här datorn, med Claude Code
// (claude -p) på användarens Claude-konto. Startas av launchd på analysernas tider och
// var 15:e minut (se README, Analyserna); de flesta körningar har inget att göra och
// slutar direkt.
//
//   - Omgångens matcher och namn: så snart gängets omgång finns (oftast
//     Stryktipset, måndag kl. 16) skrivs matcherna i data/analyser.json och namnet
//     i data/omgangsnamn.json.
//   - Analyserna: på varje tid i config/analyser.js (tider) skrivs en ny analys per
//     match som inte har börjat, och Hasse Backes text ur den. Misslyckas en match
//     sparas de andra, en gammal analys ligger kvar tills en ny finns, och nästa
//     körning försöker igen med högst perMatch försök per tid.
//   - Tidningen inför omgången (Hasse Backe läser den): en notis per match i
//     data/tidning.json, när omgången kommer och sedan på tiderna i config/tidning.js,
//     med en bild från veckan per lag (src/analyser/tidning-bilder.mjs, utan Claude).
//     Bilderna läggs i grenen tidning-bilder, en enda commit som skrivs över.
//   - Kommentarerna till färdiga kuponger: i data/kupong-historik.json.
//
// Publicering: varje färdig text sparas först i vantande.json utanför repot, sedan
// commitas och pushas den till main, och GitHub Actions bygger om sajten. Går det
// inte att pusha ligger texten kvar i vantande.json till nästa körning. Med
// --publicera arbetar skriptet i en egen klon (installera.sh) som återställs till
// origin/main varje gång, så att en arbetskopia aldrig rörs.
//
//   node scripts/analyser/skriv.mjs                      skriver i data/ här, utan git
//   node scripts/analyser/skriv.mjs --publicera          som launchd: commit och push
//   node scripts/analyser/skriv.mjs --en-match <id>      en match, oavsett tid
//   node scripts/analyser/skriv.mjs --ut <mapp>          filerna där i stället för i data/
//   node scripts/analyser/skriv.mjs --torrt              visar vad som skulle göras
//   node scripts/analyser/skriv.mjs --tvinga             skriver om omgångens analyser
//   node scripts/analyser/skriv.mjs --tidning            bara tidningen, oavsett tid
//   node scripts/analyser/skriv.mjs --tidning-bilder     bara veckans bilder till tidningen
//                                                        som finns, utan Claude

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ac from '../../config/analyser.js';
import hc from '../../config/hasse.js';
import kupongCfg from '../../config/kupong.js';
import { betalvagar, inloggning, Stopp } from '../../src/analyser/claude.mjs';
import { skrivAnalys } from '../../src/analyser/artikel.mjs';
import { skrivHasse, hasseKlar } from '../../src/analyser/hasse.mjs';
import { skrivNamn, namnNyckel } from '../../src/analyser/namn.mjs';
import { skrivKommentar } from '../../src/analyser/kommentar.mjs';
import { skrivTidning, attSkrivaTidning } from '../../src/analyser/tidning.mjs';
import { poddsidor } from '../../src/analyser/poddar.mjs';
import { veckansBilder, lagenI } from '../../src/analyser/tidning-bilder.mjs';
import { attSkriva } from '../../src/analyser/tider.mjs';

const require = createRequire(import.meta.url);
const { readHistory, writeHistory } = require('../../src/history.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARGV = process.argv.slice(2);
const flagga = (n) => ARGV.includes(n);
const varde = (n) => { const i = ARGV.indexOf(n); return i >= 0 ? ARGV[i + 1] : null; };

const PUBLICERA = flagga('--publicera');
const TORRT = flagga('--torrt');
const TVINGA = flagga('--tvinga');
const EN_MATCH = varde('--en-match');
const BARA_TIDNING = flagga('--tidning');
const BARA_BILDER = flagga('--tidning-bilder');
const UT = varde('--ut');

const HEM = os.homedir();
const TILLSTAND = process.env.ANALYSER_TILLSTAND || path.join(HEM, 'Library', 'Application Support', 'Matchfixarna');
const LOGG = process.env.ANALYSER_LOGG || path.join(HEM, 'Library', 'Logs', 'Matchfixarna', 'analyser.log');
const MARKOR = path.join(ROOT, '.analyser-klon');
const LAS = path.join(TILLSTAND, 'las');
const VANTANDE = path.join(TILLSTAND, UT || !PUBLICERA ? 'vantande-lokalt.json' : 'vantande.json');
const FORSOK = path.join(TILLSTAND, 'forsok.json');

const dataDir = UT ? path.resolve(UT) : path.join(ROOT, 'data');
const FIL = {
  analyser: path.join(dataDir, 'analyser.json'),
  namn: path.join(dataDir, 'omgangsnamn.json'),
  historik: path.join(dataDir, 'kupong-historik.json'),
  tidning: path.join(dataDir, 'tidning.json'),
  poddsidor: path.join(dataDir, 'poddsidor.json'),
};

const H = 3600000;
const MINUT = 60000;
const MAX_LOGG = 1024 * 1024;
const site = String(process.env.ANALYSER_SAJT || kupongCfg.site).replace(/\/+$/, '');
const samtalUrl = kupongCfg.endpoint.replace(/kupong$/, 'samtal');

// ---------- logg, filer och lås ----------

function logg(text) {
  const rad = `${new Date().toISOString()} ${text}`;
  // Under launchd går stdout till launchd.log, som bara ska ha det oväntade.
  if (process.stdout.isTTY || !PUBLICERA) console.log(rad);
  try {
    fs.mkdirSync(path.dirname(LOGG), { recursive: true });
    if (fs.existsSync(LOGG) && fs.statSync(LOGG).size > MAX_LOGG) fs.renameSync(LOGG, `${LOGG}.1`);
    fs.appendFileSync(LOGG, `${rad}\n`);
  } catch (err) {
    console.error(`Loggen gick inte att skriva: ${err.message}`);
  }
}

function lasJson(fil, annars) {
  try {
    return JSON.parse(fs.readFileSync(fil, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') logg(`${path.basename(fil)} gick inte att läsa: ${err.message}`);
    return annars;
  }
}

// Hel fil eller ingen: en krasch mitt i får inte lämna en halv fil.
function skrivJson(fil, v) {
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  const tmp = `${fil}.tmp${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(v, null, 1)}\n`);
  fs.renameSync(tmp, fil);
}

// En körning i taget. Ett lås från en process som inte längre finns räknas inte.
let harLas = false;
function tagLas() {
  fs.mkdirSync(TILLSTAND, { recursive: true });
  try {
    const pid = Number(fs.readFileSync(LAS, 'utf8'));
    if (pid) {
      try {
        process.kill(pid, 0);
        return false;
      } catch { /* processen finns inte längre */ }
    }
  } catch { /* inget lås */ }
  fs.writeFileSync(LAS, String(process.pid));
  harLas = true;
  return true;
}
const slappLas = () => { if (!harLas) return; try { fs.rmSync(LAS, { force: true }); } catch { /* */ } };
process.on('exit', slappLas);
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => { logg(`avbruten (${s})`); process.exit(1); });

// ---------- försöken ----------

const forsok = lasJson(FORSOK, { poster: {}, pausTill: null });
const sparaForsok = () => skrivJson(FORSOK, forsok);
// Försöken för tider som har passerat behövs inte längre.
function rensaForsok() {
  const gans = Date.now() - 8 * 24 * H;
  for (const [k, f] of Object.entries(forsok.poster)) if (Date.parse(f.senast) < gans) delete forsok.poster[k];
}

// Får saken försökas nu? Högst perMatch försök, med nyttForsokMinuter emellan.
function far(nyckel) {
  if (EN_MATCH || TVINGA || BARA_TIDNING) return true;
  const f = forsok.poster[nyckel];
  return !f || (f.n < ac.perMatch && Date.now() - Date.parse(f.senast) >= ac.nyttForsokMinuter * MINUT);
}
function misslyckat(nyckel, error) {
  const f = forsok.poster[nyckel] || { n: 0 };
  forsok.poster[nyckel] = { n: f.n + 1, senast: new Date().toISOString(), fel: String(error).slice(0, 200) };
  sparaForsok();
}
function lyckat(nyckel) {
  if (!forsok.poster[nyckel]) return;
  delete forsok.poster[nyckel];
  sparaForsok();
}

// ---------- hämtning ----------

async function hamta(url) {
  let sista;
  // Direkt efter att datorn vaknat kan nätet dröja en stund.
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { accept: 'application/json' } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      sista = err;
      if (i < 2) await new Promise((ok) => setTimeout(ok, 15000));
    }
  }
  throw new Error(`${url.replace(/\?.*$/, '')}: ${sista.message}`);
}
const fardata = (p) => hamta(`${site}/data/${p}?t=${Date.now()}`);

// ---------- det som väntar på att sparas ----------

const tomtVantande = () => ({ analyser: {}, hasse: {}, namn: {}, kommentarer: {}, omgang: null, tidning: null, poddsidor: null });
let vantande = { ...tomtVantande(), ...lasJson(VANTANDE, {}) };
const sparaVantande = () => skrivJson(VANTANDE, vantande);
const finnsVantande = () => Boolean(vantande.omgang || vantande.tidning || vantande.poddsidor) || ['analyser', 'hasse', 'namn', 'kommentarer'].some((k) => Object.keys(vantande[k]).length);

function lasAnalyser() {
  const d = lasJson(FIL.analyser, null) || {};
  return { uppdaterad: d.uppdaterad || null, omgang: d.omgang || null, analyser: Array.isArray(d.analyser) ? d.analyser : [] };
}
function lasNamn() {
  const d = lasJson(FIL.namn, null) || {};
  return Array.isArray(d.namn) ? d.namn : [];
}

// Lägger in det väntande i filerna. Spelade matcher som är äldre än sparasDagar
// faller bort; allt annat ligger kvar tills en ny text finns.
function laggIn() {
  const d = lasAnalyser();
  const per = new Map(d.analyser.map((a) => [String(a.id), a]));
  let nytt = false;
  for (const [id, a] of Object.entries(vantande.analyser)) { per.set(id, a); nytt = true; }
  for (const [id, h] of Object.entries(vantande.hasse)) {
    const a = per.get(id);
    if (a) { a.hasse = h; nytt = true; }
  }
  const gans = Date.now() - ac.sparasDagar * 24 * H;
  const analyser = [...per.values()].filter((a) => Date.parse(a.avspark) > gans).sort((a, b) => a.avspark.localeCompare(b.avspark) || a.match.localeCompare(b.match));
  const omgang = vantande.omgang || d.omgang;
  const ut = { uppdaterad: nytt ? new Date().toISOString() : d.uppdaterad, omgang, analyser };
  if (JSON.stringify(ut) !== JSON.stringify(d)) skrivJson(FIL.analyser, ut);

  const nyaNamn = Object.values(vantande.namn);
  if (nyaNamn.length) {
    const lista = lasNamn().filter((n) => !nyaNamn.some((x) => x.key === n.key));
    skrivJson(FIL.namn, { namn: [...lista, ...nyaNamn] });
  }

  if (vantande.tidning) skrivJson(FIL.tidning, vantande.tidning);
  if (vantande.poddsidor) skrivJson(FIL.poddsidor, vantande.poddsidor);

  const ids = Object.keys(vantande.kommentarer);
  if (ids.length) {
    const h = readHistory(FIL.historik);
    if (!h.broken) {
      for (const e of h.raw) if (e && vantande.kommentarer[e.id]) e.ai = vantande.kommentarer[e.id];
      writeHistory(h.raw, FIL.historik);
    }
  }
}

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// Klonen till origin/main. Bara i klonen: den har inget eget arbete att förlora.
function tillMain() {
  if (!fs.existsSync(MARKOR)) throw new Error(`${ROOT} är inte analysernas klon (installera.sh), så git rörs inte.`);
  git('fetch', '-q', 'origin', 'main');
  git('checkout', '-q', '-f', 'main');
  git('reset', '-q', '--hard', 'origin/main');
}

// Sparar det väntande: i filerna och, med --publicera, med commit och push.
function spara(vad) {
  sparaVantande();
  if (TORRT) return true;
  if (!PUBLICERA) {
    laggIn();
    vantande = tomtVantande();
    sparaVantande();
    return true;
  }
  for (let i = 0; i < 3; i++) {
    try {
      // Har main ändrats (botens journal, ny kod) läggs texten ovanpå det senaste.
      tillMain();
      laggIn();
      // (tidning.json finns inte förrän den första tidningen är skriven)
      git('add', '--', ...['analyser.json', 'omgangsnamn.json', 'kupong-historik.json', 'tidning.json', 'poddsidor.json'].map((f) => `data/${f}`).filter((f) => fs.existsSync(path.join(ROOT, f))));
      if (git('status', '--porcelain', '--', 'data').trim()) {
        git('commit', '-q', '-m', vad);
        git('push', '-q', 'origin', 'HEAD:main');
        logg(`publicerat: ${vad}`);
      }
      vantande = tomtVantande();
      sparaVantande();
      return true;
    } catch (err) {
      logg(`publiceringen misslyckades (försök ${i + 1}): ${String(err.stderr || err.message).trim().slice(0, 300)}`);
    }
  }
  // Texten ligger kvar i vantande.json till nästa körning.
  return false;
}

// ---------- jobben ----------

const lage = { stoppad: null };
function hanteraFel(err, nyckel, vad) {
  if (err instanceof Stopp) {
    lage.stoppad = err;
    logg(`STOPP (${err.slag}) vid ${vad}: ${err.message}`);
    if (err.slag === 'grans') {
      forsok.pausTill = new Date(Date.now() + H).toISOString();
      sparaForsok();
    }
    return;
  }
  misslyckat(nyckel, err.message);
  logg(`FEL ${vad}: ${err.message}`);
}

const metaText = (m) => `${m.seconds} s, ${m.searches} sökningar, ${m.fetches} sidor${m.dollars ? `, uppskattat värde ca ${m.dollars.toFixed(2)} USD` : ''}`;

// Omgångens matcher i data/analyser.json, så att sidan vet vilka som får en analys.
function omgangenIFilen(round) {
  const ny = { id: round.id, matcher: round.matcher.map((x) => String(x.id)) };
  const nu = lasAnalyser().omgang;
  if (JSON.stringify(nu) === JSON.stringify(ny)) return;
  logg(`ny omgång i filen: ${round.id}, ${ny.matcher.length} matcher`);
  if (TORRT) return;
  vantande.omgang = ny;
  spara(`Analyser: omgång ${round.id}`);
}

async function namnet(round) {
  const key = namnNyckel(round);
  const lista = lasNamn();
  if (lista.some((n) => n.key === key) || vantande.namn[key] || !far(`namn:${key}`)) return;
  if (TORRT) { logg(`skulle döpa omgången ${round.id}`); return; }
  try {
    const list = await Promise.all(round.matcher.map((x) => fardata(`match/${x.id}.json`).catch(() => null)));
    const details = Object.fromEntries(round.matcher.map((x, i) => [String(x.id), list[i]]).filter(([, d]) => d));
    const history = await fardata('historik.json').catch(() => null);
    const recent = lista.filter((n) => n.id !== round.id).slice(-12).reverse();
    const r = await skrivNamn(round, { site: { details, history }, recent });
    if (!r.ok) throw new Error(r.error);
    vantande.namn[key] = r.entry;
    lyckat(`namn:${key}`);
    logg(`namn: "${r.entry.namn}" (${round.id})`);
    spara(`Omgångens namn: ${r.entry.namn}`);
  } catch (err) {
    hanteraFel(err, `namn:${key}`, `namnet på ${round.id}`);
  }
}

// ---------- tidningens bilder ----------

// Grenen med bilderna: en enda commit med filerna, som skrivs över varje gång (som rösten i
// grenen rost), så att main inte växer och förra veckans bilder inte ligger kvar. Workflowen
// hämtar den till data/tidning-bilder/. → commitens id
const BILDGREN = 'tidning-bilder';
function bildGrenen(mapp, filer, vad) {
  const kor = (args, { env, input } = {}) => execFileSync('git', args, {
    cwd: ROOT, encoding: 'utf8', timeout: 180000, input, maxBuffer: 64 * 1024 * 1024,
    env: env ? { ...process.env, ...env } : process.env,
    stdio: [input == null ? 'ignore' : 'pipe', 'pipe', 'pipe'],
  }).trim();
  const index = path.join(TILLSTAND, `bild-index${process.pid}`);
  fs.rmSync(index, { force: true });
  try {
    const ider = kor(['hash-object', '-w', '--stdin-paths'], { input: `${filer.map((f) => path.join(mapp, f)).join('\n')}\n` }).split('\n');
    kor(['update-index', '--add', '--index-info'], { env: { GIT_INDEX_FILE: index }, input: filer.map((f, i) => `100644 ${ider[i]}\t${f}\n`).join('') });
    const trad = kor(['write-tree'], { env: { GIT_INDEX_FILE: index } });
    const commit = kor(['commit-tree', trad, '-m', vad]);
    kor(['push', '-q', '-f', 'origin', `${commit}:refs/heads/${BILDGREN}`]);
    return commit;
  } finally {
    fs.rmSync(index, { force: true });
  }
}

// Omgångens matchfiler ur den publicerade sajten: match-id → data/match/<id>.json.
async function matchfilerna(round) {
  const list = await Promise.all(round.matcher.map((x) => fardata(`match/${x.id}.json`).catch(() => null)));
  return Object.fromEntries(round.matcher.map((x, i) => [String(x.id), list[i]]).filter(([, d]) => d));
}

// En bild från veckan per lag i tidningen (src/analyser/tidning-bilder.mjs): lagen i
// notiserna (lag: [hemma, borta]) och bilderna (bilder: [{fil, kalla, foto, sida} | null, …]).
// Med --publicera hamnar filerna i grenen tidning-bilder; går den inte att pusha blir det inga
// bilder, och sidan visar lagens sköldar.
async function tidningensBilder(t, details) {
  const par = t.notiser.map((n) => lagenI(n, details));
  t.notiser.forEach((n, i) => { n.lag = par[i]; delete n.bilder; });
  if (TORRT) return;
  const mot = {};
  const kallor = {};
  for (const [i, [a, b]] of par.entries()) {
    if (!a || !b) continue;
    mot[a] = b;
    mot[b] = a;
    kallor[a] = kallor[b] = t.notiser[i].kallor || [];
  }
  try {
    const skoldar = await fardata('skoldar.json').catch(() => null);
    const espnId = Object.fromEntries(Object.entries((skoldar && skoldar.lag) || {}).map(([k, v]) => [k, v[0]]));
    const mapp = path.join(PUBLICERA ? TILLSTAND : dataDir, 'tidning-bilder');
    fs.rmSync(mapp, { recursive: true, force: true });
    const t0 = Date.now();
    const bilder = await veckansBilder(par.flat(), { mapp, espnId, kallor, mot, logg: PUBLICERA ? () => {} : logg });
    const lag = par.flat().filter(Boolean).length;
    if (!bilder.size) { logg(`bilder: inga av ${lag} lag fick en bild`); return; }
    if (PUBLICERA) {
      const commit = bildGrenen(mapp, [...bilder.values()].map((b) => b.fil), `Tidningens bilder: ${t.omgang}, ${bilder.size} lag`);
      logg(`grenen ${BILDGREN} pushad (${commit.slice(0, 7)})`);
    }
    t.notiser.forEach((n, i) => {
      n.bilder = par[i].map((x) => { const b = bilder.get(x); return b ? { fil: b.fil, kalla: b.kalla, foto: b.foto, sida: b.sida } : null; });
    });
    logg(`bilder: ${bilder.size} av ${lag} lag (${Math.round((Date.now() - t0) / 1000)} s)`);
  } catch (err) {
    t.notiser.forEach((n) => { delete n.bilder; });
    logg(`bilder: ${String(err.stderr || err.message).trim().slice(0, 300)}`);
  }
}

// Tidningen inför omgången: en gång när omgången kommer och sedan på tidningens tider.
async function tidningen(round) {
  const nu = vantande.tidning || lasJson(FIL.tidning, null);
  // Det mest intressanta ur lagens supporterpoddar, uttaget av scripts/tidning/poddar.mjs.
  const poddar = lasJson(path.join(TILLSTAND, 'Tidning', 'omgang.json'), null);
  const v = attSkrivaTidning(round, nu, { now: Date.now(), tvinga: BARA_TIDNING, poddar });
  const nyckel = `tidning:${round.id}:${v.tid}`;
  if (!v.skriv || !far(nyckel)) return;
  if (TORRT) { logg(`skulle skriva tidningen för ${round.id} (${v.varfor})`); return; }
  try {
    const details = await matchfilerna(round);
    const r = await skrivTidning(round, { details, poddar });
    if (!r.ok) throw new Error(r.error);
    await tidningensBilder(r.tidning, details);
    vantande.tidning = r.tidning;
    lyckat(nyckel);
    logg(`tidning: ${round.id}, ${r.tidning.notiser.length} notiser${r.saknas.length ? ` (utan ${r.saknas.join(', ')})` : ''} (${metaText(r.meta)}; ${v.varfor})`);
    spara(`Tidningen inför omgången ${round.id}`);
  } catch (err) {
    hanteraFel(err, nyckel, `tidningen för ${round.id}`);
  }
}

// Informationssidorna ur supporterpoddarna (scripts/tidning/poddar.mjs skriver dem på poddarnas tider):
// läggs ut när de har ändrats. Inget anrop till Claude här.
function poddsidorna(round) {
  const ny = poddsidor(lasJson(path.join(TILLSTAND, 'Tidning', 'omgang.json'), null), round);
  if (!ny) return;
  const nu = vantande.poddsidor || lasJson(FIL.poddsidor, null);
  if (nu && nu.omgang === ny.omgang && JSON.stringify(nu.sidor) === JSON.stringify(ny.sidor)) return;
  if (TORRT) { logg(`skulle lägga ut ${ny.sidor.length} informationssidor ur poddarna`); return; }
  vantande.poddsidor = ny;
  logg(`poddsidor: ${round.id}, ${ny.sidor.length} matcher`);
  spara(`Supporterpoddarna inför omgången ${round.id}`);
}

async function kommentarerna() {
  const h = readHistory(FIL.historik);
  if (h.broken) return;
  const saknas = h.entries.filter((e) => !(e.ai && e.ai.text) && !vantande.kommentarer[e.id] && far(`kommentar:${e.id}`)).slice(0, 5);
  if (!saknas.length) return;
  let pub;
  try {
    pub = await fardata('historik.json');
  } catch (err) {
    logg(`historiken gick inte att läsa: ${err.message}`);
    return;
  }
  for (const e of saknas) {
    if (lage.stoppad) return;
    // En kupong som frysts in nyss är inte publicerad än; den får sin kommentar sedan.
    const c = pub && Array.isArray(pub.coupons) ? pub.coupons.find((x) => x.id === e.id) : null;
    if (!c || !c.n) continue;
    if (TORRT) { logg(`skulle kommentera kupongen ${e.id}`); continue; }
    try {
      const r = await skrivKommentar(c, {});
      if (!r.ok) throw new Error(r.error);
      vantande.kommentarer[e.id] = r.ai;
      lyckat(`kommentar:${e.id}`);
      logg(`kommentar: ${e.id}`);
      spara(`Kommentar till kupongen ${e.id}`);
    } catch (err) {
      hanteraFel(err, `kommentar:${e.id}`, `kommentaren till ${e.id}`);
    }
  }
}

// hasseNyckel: försöken med Hasses text. borjad: omgången har börjat, så att det han redan
// har sagt står fast.
async function enAnalys(id, namn, gammal, roster, nyckel = `analys:${id}`, { hasseNyckel, borjad = false } = {}) {
  try {
    const d = await fardata(`match/${id}.json`);
    if (!d) throw new Error('matchen finns inte på sajten');
    const r = await skrivAnalys(d, { rost: roster.analys });
    if (!r.ok) throw new Error(r.error);
    const entry = r.entry;
    logg(`analys: ${entry.match} (${metaText(r.meta)})${r.tipError ? ` – utan tips: ${r.tipError}` : ''}`);
    // Hasses text ur den nya analysen. Blir den inte av sparas analysen ändå, och det han sa
    // senast ligger kvar: han ska ha tippat alla matcher när omgången börjar.
    const gamla = gammal && gammal.hasse;
    const ny = entry.tip && !(borjad && gamla) ? await hasseText(id, entry, roster, d, hasseNyckel) : null;
    if (ny || gamla) entry.hasse = ny || gamla;
    vantande.analyser[id] = entry;
    lyckat(nyckel);
    spara(`Analys: ${entry.match}`);
    return entry;
  } catch (err) {
    hanteraFel(err, nyckel, `analysen av ${namn}${gammal ? ' (den gamla ligger kvar)' : ''}`);
    return null;
  }
}

// d: matchens fil på sajten, för oddsen han får (hämtas om den saknas; går den inte att
// hämta skriver han utan oddsen).
async function hasseText(id, entry, roster, d = null, nyckel = `hasse:${id}`) {
  try {
    const match = d || await fardata(`match/${id}.json`).catch(() => null);
    const h = await skrivHasse(id, entry, { persona: roster.hasse, match });
    if (!h.ok) throw new Error(h.error);
    lyckat(nyckel);
    logg(`hasse: ${entry.match} (${h.meta.seconds} s)`);
    return h.hasse;
  } catch (err) {
    hanteraFel(err, nyckel, `Hasses text till ${entry.match}`);
    return null;
  }
}

async function analyserna(round, roster) {
  const per = new Map(lasAnalyser().analyser.map((a) => [String(a.id), a]));
  for (const [id, a] of Object.entries(vantande.analyser)) per.set(id, a);
  const v = attSkriva(round, per, { now: Date.now(), tider: ac.tider, forhandTimmar: ac.forhandTimmar, version: ac.promptVersion, tvinga: TVINGA });
  const nyckel = (x) => `analys:${x.id}:${v.tid}`;
  // (Hasses försök räknas per tid, som analysernas: tre misslyckade får inte stänga av honom i en vecka)
  const hasseNyckel = (x) => `hasse:${x.id}:${v.tid}`;
  const att = v.att.filter((x) => far(nyckel(x)));
  // När omgången har börjat står hans tips fast, också för matcher som inte har startat (18:30-matchen).
  const borjad = round.matcher.some((x) => Date.parse(x.avspark) <= Date.now());
  // Analyser som fick sin text men inte Hasses.
  const hasse = v.kvar.filter((x) => {
    const a = per.get(String(x.id));
    return a && a.version === ac.promptVersion && a.tip && !v.att.includes(x) && !(borjad && a.hasse) && !hasseKlar(a.hasse, a) && far(hasseNyckel(x));
  });
  const nasta = v.nasta ? new Date(v.nasta).toISOString() : 'okänt';
  if (!att.length && !hasse.length) {
    logg(`kontroll: ${round.id}, ${v.klara.length} av ${v.kvar.length} analyser aktuella, nästa tid ${nasta}`);
    return;
  }
  logg(`kontroll: ${round.id}, ${att.length} analyser och ${hasse.length} Hasse-texter att skriva, ${v.klara.length} av ${v.kvar.length} aktuella`);
  if (TORRT) {
    for (const x of att) logg(`skulle skriva analysen av ${x.match}`);
    return;
  }
  for (const x of att) {
    if (lage.stoppad) return;
    await enAnalys(String(x.id), x.match, per.get(String(x.id)), roster, nyckel(x), { hasseNyckel: hasseNyckel(x), borjad });
  }
  for (const x of hasse) {
    if (lage.stoppad) return;
    const a = per.get(String(x.id));
    const t = await hasseText(String(x.id), a, roster, null, hasseNyckel(x));
    if (t) {
      vantande.hasse[String(x.id)] = t;
      spara(`Hasse Backe: ${a.match}`);
    }
  }
}

// ---------- start ----------

async function main() {
  // Ska inte kunna debiteras som API: finns en sådan variabel körs ingenting.
  const fel = betalvagar();
  if (fel.length) {
    logg(`STOPP: ${fel.join(', ')} är satt. Då skulle Claude Code kunna debiteras som API i stället för att gå via abonnemanget. Ta bort variabeln.`);
    process.exit(1);
  }
  if (!tagLas()) {
    logg('en körning pågår redan');
    return;
  }
  if (PUBLICERA && !TORRT && !fs.existsSync(MARKOR)) {
    logg(`STOPP: ${ROOT} är inte analysernas klon. Kör scripts/analyser/installera.sh.`);
    process.exit(1);
  }
  if (forsok.pausTill && Date.now() < Date.parse(forsok.pausTill) && !EN_MATCH) {
    logg(`abonnemangets gräns: väntar till ${forsok.pausTill}`);
    return;
  }
  forsok.pausTill = null;
  rensaForsok();

  // Det som inte hann publiceras förra gången.
  if (finnsVantande() && !TORRT) {
    logg('sparar det som väntar sedan förra körningen');
    spara('Analyser: det som väntade');
  } else if (PUBLICERA && !TORRT) {
    try {
      tillMain();
    } catch (err) {
      logg(`git: ${String(err.stderr || err.message).trim().slice(0, 300)}`);
      return;
    }
  }

  const roster = {
    analys: fs.readFileSync(path.join(ROOT, ac.rost.fil), 'utf8'),
    hasse: fs.readFileSync(path.join(ROOT, 'prompts', 'hasse-backe.md'), 'utf8'),
  };
  let round = null;
  if (!EN_MATCH) {
    try {
      const j = await hamta(`${samtalUrl}?t=${Date.now()}`);
      round = j && j.ok && j.samtal && Array.isArray(j.samtal.matcher) && j.samtal.matcher.length ? j.samtal : null;
    } catch (err) {
      logg(`omgången gick inte att läsa: ${err.message}`);
      return;
    }
    if (round) omgangenIFilen(round);
  }

  // Bara bilderna till tidningen som finns: utan Claude, så inloggningen behövs inte.
  if (BARA_BILDER) {
    const t = vantande.tidning || lasJson(FIL.tidning, null);
    if (!round || !t || t.omgang !== round.id) { logg('ingen tidning för omgången, så inga bilder'); return; }
    await tidningensBilder(t, await matchfilerna(round));
    vantande.tidning = t;
    spara(`Tidningen inför omgången ${round.id}: veckans bilder`);
    for (const n of t.notiser) console.log(`${n.nr}. ${(n.lag || []).map((x, i) => `${x}: ${n.bilder && n.bilder[i] ? `${n.bilder[i].fil} (${n.bilder[i].foto || n.bilder[i].kalla})` : '–'}`).join(', ')}`);
    return;
  }

  // Inloggningen först: den kostar inget, och utan den blir det inga texter.
  const inne = await inloggning().catch((err) => err);
  const inloggad = inne && inne.loggedIn && inne.apiProvider === 'firstParty' && !/api.?key|console/i.test(String(inne.authMethod));
  if (!TORRT && !inloggad) {
    logg(`STOPP: Claude Code är inte inloggat med abonnemanget (${inne instanceof Error ? inne.message : `${inne.authMethod || 'okänt'}`}). Kör: claude auth login --claudeai`);
    process.exit(1);
  }

  if (EN_MATCH) {
    const d = await fardata(`match/${EN_MATCH}.json`);
    if (!d) throw new Error(`Matchen ${EN_MATCH} finns inte på sajten.`);
    const entry = await enAnalys(EN_MATCH, `${d.match.home} – ${d.match.away}`, null, roster);
    if (lage.stoppad || !entry) process.exit(1);
    console.log(`\n${entry.text}\n`);
    for (const s of entry.sources) console.log(`[${s.n}] ${s.source}: ${s.title}\n    ${s.url}`);
    if (entry.hasse) console.log(`\n--- Hasse Backe (${(entry.hasse.tecken || entry.tip.signs).map((i) => '1X2'[i]).join('')}, ${entry.hasse.resultat || '–'}; kollegan ${entry.tip.signs.map((i) => '1X2'[i]).join('')})\n${entry.hasse.stycken.join('\n\n')}`);
    return;
  }

  if (BARA_TIDNING) {
    if (!round) { logg('ingen omgång just nu, så ingen tidning'); return; }
    await tidningen(round);
    if (lage.stoppad) process.exit(1);
    const t = vantande.tidning || lasJson(FIL.tidning, null);
    if (t && t.omgang === round.id) for (const n of t.notiser) console.log(`\n${n.nr}. ${n.rubrik}\n${n.text}${n.kallor.length ? `\n   (${n.kallor.map((k) => k.source).join(', ')})` : ''}`);
    return;
  }

  if (round) {
    poddsidorna(round);
    await namnet(round);
    if (!lage.stoppad) await analyserna(round, roster);
    if (!lage.stoppad) await tidningen(round);
  } else {
    logg('kontroll: ingen omgång just nu');
  }
  if (!lage.stoppad) await kommentarerna();
}

main().catch((err) => {
  logg(`FEL: ${(err && err.stack) || err}`);
  process.exit(1);
});
