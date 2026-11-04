#!/usr/bin/env node
// Skriver allt AI-innehåll på sajten från den här datorn, med Claude Code
// (claude -p) på användarens Claude-konto. Startas av launchd var 15:e minut
// (se README, Analyserna); de flesta körningar har inget att göra och slutar direkt.
//
//   - Omgångens matcher och namn: så snart gängets omgång finns (oftast
//     Stryktipset, måndag kl. 07) skrivs matcherna i data/analyser.json och namnet
//     i data/omgangsnamn.json.
//   - Analyserna: forhandTimmar före omgångens första avspark skrivs en analys per
//     match (config/analyser.js) och Hasse Backes text ur den. Misslyckas en match
//     sparas de andra, en gammal analys ligger kvar tills en ny finns, och nästa
//     körning försöker igen med högst perMatch försök.
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

// Får saken försökas nu? Högst perMatch försök, med nyttForsokMinuter emellan.
function far(nyckel) {
  if (EN_MATCH || TVINGA) return true;
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

const tomtVantande = () => ({ analyser: {}, hasse: {}, namn: {}, kommentarer: {}, omgang: null });
let vantande = { ...tomtVantande(), ...lasJson(VANTANDE, {}) };
const sparaVantande = () => skrivJson(VANTANDE, vantande);
const finnsVantande = () => Boolean(vantande.omgang) || ['analyser', 'hasse', 'namn', 'kommentarer'].some((k) => Object.keys(vantande[k]).length);

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
      git('add', '--', 'data/analyser.json', 'data/omgangsnamn.json', 'data/kupong-historik.json');
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

async function enAnalys(id, namn, gammal, roster) {
  const nyckel = `analys:${id}`;
  try {
    const d = await fardata(`match/${id}.json`);
    if (!d) throw new Error('matchen finns inte på sajten');
    const r = await skrivAnalys(d, { rost: roster.analys });
    if (!r.ok) throw new Error(r.error);
    const entry = r.entry;
    logg(`analys: ${entry.match} (${metaText(r.meta)})${r.tipError ? ` – utan tips: ${r.tipError}` : ''}`);
    // Hasses text ur den nya analysen. Blir den inte av sparas analysen ändå.
    if (entry.tip) {
      const t = await hasseText(id, entry, roster);
      if (t) entry.hasse = t;
    }
    vantande.analyser[id] = entry;
    lyckat(nyckel);
    spara(`Analys: ${entry.match}`);
    return entry;
  } catch (err) {
    hanteraFel(err, nyckel, `analysen av ${namn}${gammal ? ' (den gamla ligger kvar)' : ''}`);
    return null;
  }
}

async function hasseText(id, entry, roster) {
  const nyckel = `hasse:${id}`;
  try {
    const h = await skrivHasse(id, entry, { persona: roster.hasse });
    if (!h.ok) throw new Error(h.error);
    lyckat(nyckel);
    logg(`hasse: ${entry.match} (${h.meta.seconds} s)`);
    return h.hasse;
  } catch (err) {
    hanteraFel(err, nyckel, `Hasses text till ${entry.match}`);
    return null;
  }
}

// Omgången skrivs forhandTimmar före sin första avspark som inte har varit.
function dags(round, now) {
  const kvar = round.matcher.filter((x) => Date.parse(x.avspark) > now);
  if (!kvar.length) return { kvar, dags: false, vid: null };
  const forsta = Math.min(...kvar.map((x) => Date.parse(x.avspark)));
  return { kvar, dags: forsta - now <= ac.forhandTimmar * H, vid: new Date(forsta - ac.forhandTimmar * H) };
}

async function analyserna(round, roster) {
  const now = Date.now();
  const { kvar, dags: ar, vid } = dags(round, now);
  const per = new Map(lasAnalyser().analyser.map((a) => [String(a.id), a]));
  for (const [id, a] of Object.entries(vantande.analyser)) per.set(id, a);
  const klara = kvar.filter((x) => { const a = per.get(String(x.id)); return a && a.version === ac.promptVersion; });
  if (!ar && !TVINGA) {
    logg(`kontroll: ${round.id}, ${klara.length} av ${kvar.length} analyser klara${vid ? `, skrivs ${vid.toISOString()}` : ''}`);
    return;
  }
  const att = kvar.filter((x) => (TVINGA || !klara.includes(x)) && far(`analys:${x.id}`));
  // Analyser som fick sin text men inte Hasses.
  const hasse = kvar.filter((x) => {
    const a = per.get(String(x.id));
    return a && a.version === ac.promptVersion && a.tip && !att.includes(x) && !hasseKlar(a.hasse, a) && far(`hasse:${x.id}`);
  });
  logg(`kontroll: ${round.id}, dags: ${att.length} analyser och ${hasse.length} Hasse-texter att skriva, ${klara.length} av ${kvar.length} klara`);
  if (TORRT) {
    for (const x of att) logg(`skulle skriva analysen av ${x.match}`);
    return;
  }
  for (const x of att) {
    if (lage.stoppad) return;
    await enAnalys(String(x.id), x.match, per.get(String(x.id)), roster);
  }
  for (const x of hasse) {
    if (lage.stoppad) return;
    const a = per.get(String(x.id));
    const t = await hasseText(String(x.id), a, roster);
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
    if (entry.hasse) console.log(`\n--- Hasse Backe (${entry.tip.signs.map((i) => '1X2'[i]).join('')})\n${entry.hasse.stycken.join('\n\n')}`);
    return;
  }

  if (round) {
    await namnet(round);
    if (!lage.stoppad) await analyserna(round, roster);
  } else {
    logg('kontroll: ingen omgång just nu');
  }
  if (!lage.stoppad) await kommentarerna();
}

main().catch((err) => {
  logg(`FEL: ${(err && err.stack) || err}`);
  process.exit(1);
});
