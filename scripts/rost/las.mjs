#!/usr/bin/env node
// Hasse Backes röst med Tomas egen, klonade röst: läser upp allt han säger med
// Chatterbox Multilingual på den här datorn och lägger ljudet i grenen rost, som
// bygget föredrar framför Azure (src/rost.js). Startas av launchd var 15:e minut
// (installera.sh, se README, Hasse Backe, Ljudet); launchd kör aldrig två samtidigt.
//
//   - Vad han säger: texter() i src/rost.js, kommande matchers meningar först och
//     sedan replikerna. Talen läses som ord (uttal()).
//   - Ljudbanken ligger utanför repot (TILLSTAND/ljud/<avtryck>.mp3). Avtrycket räknas
//     på inställningarna i config/hasse.js (rost.egen), referensen och texten, så att
//     ljudet tas fram på nytt när något av det ändras.
//   - Högst perKorning meningar per körning läses upp (chatterbox.py, som laddar
//     modellen en gång), så att ljudet kommer ut successivt. En mening som inte klarar
//     längdkontrollen prövas igen efter omIgenTimmar.
//   - Grenen rost: en enda föräldralös commit med rost.json {filer: {mening: avtryck}}
//     och de mp3-filer som behövs nu. Den byggs med git:s egna verktyg i en tillfällig
//     index och force-pushas bara när innehållet har ändrats. main rörs aldrig.
//
// Med --publicera arbetar skriptet i en egen klon (installera.sh) som återställs till
// origin/main varje gång, så att en arbetskopia aldrig rörs.
//
//   node scripts/rost/las.mjs                 läser upp här, utan git
//   node scripts/rost/las.mjs --publicera     som launchd: klonen, uppläsningen, grenen
//   node scripts/rost/las.mjs --torrt         visar vad som skulle göras
//   node scripts/rost/las.mjs --max 3         högst så många meningar
//   node scripts/rost/las.mjs --latsas        låtsad modell (tonstötar), för prov

import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HAR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HAR, '..', '..');
const ARGV = process.argv.slice(2);
const flagga = (n) => ARGV.includes(n);
const varde = (n) => { const i = ARGV.indexOf(n); return i >= 0 ? ARGV[i + 1] : null; };

const PUBLICERA = flagga('--publicera');
const TORRT = flagga('--torrt');
const LATSAS = flagga('--latsas');
const MAX = varde('--max') ? Number(varde('--max')) : null;

const HEM = os.homedir();
const TILLSTAND = process.env.ROST_TILLSTAND || path.join(HEM, 'Library', 'Application Support', 'Matchfixarna', 'Rost');
const LOGG = process.env.ROST_LOGG || path.join(HEM, 'Library', 'Logs', 'Matchfixarna', 'rost.log');
const MODELLOGG = path.join(path.dirname(LOGG), 'rost-chatterbox.log');
const BANK = path.join(TILLSTAND, 'ljud');
const STATUS = path.join(TILLSTAND, 'status.json');
const LAS = path.join(TILLSTAND, 'las');
const MARKOR = path.join(ROOT, '.rost-klon');
const GREN = 'rost';
const H = 3600000;
const MAX_LOGG = 1024 * 1024;

const hemma = (p) => String(p).replace(/^~(?=$|\/)/, HEM);
const kort = (t, n = 60) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

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
  } catch {
    return annars;
  }
}
function skrivJson(fil, v) {
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  const tmp = `${fil}.tmp${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(v, null, 1)}\n`);
  fs.renameSync(tmp, fil);
}

// En körning i taget, också när någon kör för hand medan launchd kör.
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
process.on('exit', () => { if (harLas) try { fs.rmSync(LAS, { force: true }); } catch { /* */ } });
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => { logg(`avbruten (${s})`); process.exit(1); });

// ---------- git ----------

function git(args, { env, input } = {}) {
  return execFileSync('git', args, {
    cwd: ROOT, encoding: 'utf8', timeout: 300000, input, maxBuffer: 64 * 1024 * 1024,
    env: env ? { ...process.env, ...env } : process.env,
    stdio: [input == null ? 'ignore' : 'pipe', 'pipe', 'pipe'],
  }).trim();
}

function tillMain() {
  git(['fetch', '-q', 'origin', 'main']);
  git(['checkout', '-q', '-f', 'main']);
  git(['reset', '-q', '--hard', 'origin/main']);
}

// Grenen rost: ett träd med registret och filerna, byggt i en egen index. → trädets id
function tradet(register, filer) {
  const index = path.join(TILLSTAND, `index${process.pid}`);
  const env = { GIT_INDEX_FILE: index };
  fs.rmSync(index, { force: true });
  try {
    const regfil = path.join(TILLSTAND, 'rost.json');
    fs.writeFileSync(regfil, `${JSON.stringify(register, null, 1)}\n`);
    const kallor = [regfil, ...filer.map((h) => path.join(BANK, `${h}.mp3`))];
    const ider = git(['hash-object', '-w', '--stdin-paths'], { input: `${kallor.join('\n')}\n` }).split('\n');
    const namn = ['rost.json', ...filer.map((h) => `${h}.mp3`)];
    git(['update-index', '--add', '--index-info'], { env, input: namn.map((n, i) => `100644 ${ider[i]}\t${n}\n`).join('') });
    return git(['write-tree'], { env });
  } finally {
    fs.rmSync(index, { force: true });
  }
}

// Pushar grenen om innehållet har ändrats. → text till loggen eller null
function grenen(status, register, filer) {
  const traet = tradet(register, filer);
  const pa = git(['ls-remote', 'origin', `refs/heads/${GREN}`]).split(/\s+/)[0] || null;
  if (!pa && !filer.length) return null;
  if (pa && status.gren && status.gren.commit === pa && status.gren.tree === traet) return null;
  const n = filer.length;
  const commit = git(['commit-tree', traet, '-m', `Hasse Backes röst: ${n} ${n === 1 ? 'mening' : 'meningar'}`]);
  if (TORRT) return `skulle pusha grenen ${GREN} (${n} meningar)`;
  git(['push', '-q', '-f', 'origin', `${commit}:refs/heads/${GREN}`]);
  status.gren = { commit, tree: traet, n, tid: new Date().toISOString() };
  return `grenen ${GREN} pushad: ${n} meningar (${commit.slice(0, 7)})`;
}

// ---------- uppläsningen ----------

function uppdrag(att, egen, referens) {
  const jobbfil = path.join(TILLSTAND, 'jobb.json');
  const resultat = path.join(TILLSTAND, 'resultat.jsonl');
  fs.rmSync(resultat, { force: true });
  skrivJson(jobbfil, {
    installningar: { ...egen, referens },
    resultat,
    jobb: att.map((x) => ({ avtryck: x.h, text: x.uttal, ut: path.join(BANK, `${x.h}.mp3`) })),
  });
  const python = hemma(process.env.ROST_PYTHON || egen.python);
  fs.mkdirSync(path.dirname(MODELLOGG), { recursive: true });
  const ut = fs.openSync(MODELLOGG, 'w');
  const t0 = Date.now();
  const r = spawnSync(python, [path.join(HAR, 'chatterbox.py'), jobbfil, ...(LATSAS ? ['--latsas'] : [])], {
    cwd: TILLSTAND, stdio: ['ignore', ut, ut], timeout: 50 * 60000,
    env: { ...process.env, PYTHONUNBUFFERED: '1', PYTORCH_ENABLE_MPS_FALLBACK: '1' },
  });
  fs.closeSync(ut);
  const svar = fs.existsSync(resultat) ? fs.readFileSync(resultat, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const fel = r.error ? r.error.message : r.status ? `slutade med kod ${r.status}` : r.signal ? `stoppad (${r.signal})` : null;
  return { svar, fel, sek: Math.round((Date.now() - t0) / 1000) };
}

// ---------- körningen ----------

async function main() {
  if (!tagLas()) {
    logg('en körning pågår redan');
    return;
  }
  if (PUBLICERA) {
    if (!fs.existsSync(MARKOR)) {
      logg(`STOPP: ${ROOT} är inte röstjobbets klon. Kör scripts/rost/installera.sh.`);
      process.exitCode = 1;
      return;
    }
    try {
      tillMain();
    } catch (err) {
      logg(`git: ${String(err.stderr || err.message).trim().slice(0, 300)}`);
      process.exitCode = 1;
      return;
    }
  }
  // Efter återställningen, så att det är main:s inställningar och texter som gäller.
  const rost = require(path.join(ROOT, 'src', 'rost.js'));
  const egen = require(path.join(ROOT, 'config', 'hasse.js')).rost.egen;
  const gang = require(path.join(ROOT, 'config', 'kupong.js')).gang || [];

  const referens = hemma(egen.referens);
  if (!fs.existsSync(referens)) {
    logg(`STOPP: referensen ${referens} finns inte (rost.egen.referens i config/hasse.js).`);
    process.exitCode = 1;
    return;
  }
  const ref = crypto.createHash('sha256').update(fs.readFileSync(referens)).digest('hex').slice(0, 16);
  fs.mkdirSync(BANK, { recursive: true });
  const status = lasJson(STATUS, { misslyckade: {}, gren: null });
  status.misslyckade = status.misslyckade || {};

  const alla = rost.texter({ gang }).map((t) => ({ t, uttal: rost.uttal(t), h: rost.egenAvtryck(t, ref, egen) }));
  const finns = (x) => fs.existsSync(path.join(BANK, `${x.h}.mp3`));
  const vila = (x) => {
    const m = status.misslyckade[x.h];
    return m && Date.now() - Date.parse(m.senast) < egen.omIgenTimmar * H;
  };
  const saknas = alla.filter((x) => !finns(x));
  const att = saknas.filter((x) => !vila(x)).slice(0, MAX || egen.perKorning);

  if (att.length) {
    logg(`läser upp ${att.length} av ${saknas.length} meningar som saknas (${alla.length - saknas.length} av ${alla.length} klara)`);
    if (TORRT) {
      for (const x of att) logg(`  skulle läsa: ${x.uttal}`);
    } else {
      const { svar, fel, sek } = uppdrag(att, egen, referens);
      const per = new Map(att.map((x) => [x.h, x]));
      let gjorda = 0;
      for (const s of svar) {
        const x = per.get(s.avtryck);
        if (!x) continue;
        if (s.ok) {
          gjorda++;
          delete status.misslyckade[x.h];
          logg(`  ${s.sek} s${s.forsok > 1 ? `, ${s.forsok} försök` : ''}: ${kort(x.t)}`);
        } else {
          const m = status.misslyckade[x.h] || { ganger: 0 };
          status.misslyckade[x.h] = { ganger: m.ganger + 1, senast: new Date().toISOString(), fel: s.fel };
          logg(`  MISSLYCKAD (${s.fel}): ${kort(x.t)}`);
        }
      }
      logg(`uppläst: ${gjorda} av ${att.length} på ${sek} s${fel ? ` – Chatterbox ${fel}, se ${MODELLOGG}` : ''}`);
    }
  } else if (saknas.length) {
    logg(`${saknas.length} meningar väntar efter misslyckade försök; ${alla.length - saknas.length} av ${alla.length} klara`);
  }

  // Det som inte behövs längre: misslyckade som inte sägs nu, och ljud som inte
  // behövts på sparasDagar (ligger kvar så länge, om texten kommer tillbaka).
  const nu = new Set(alla.map((x) => x.h));
  for (const h of Object.keys(status.misslyckade)) if (!nu.has(h)) delete status.misslyckade[h];
  const gans = Date.now() - require(path.join(ROOT, 'config', 'hasse.js')).rost.sparasDagar * 24 * H;
  for (const f of fs.readdirSync(BANK)) {
    const h = f.replace(/\.mp3$/, '');
    if (h === f || nu.has(h)) continue;
    const fil = path.join(BANK, f);
    if (fs.statSync(fil).mtimeMs < gans) fs.rmSync(fil, { force: true });
  }
  // Det som används får ny tid, så att det inte städas bort.
  const idag = new Date();
  for (const x of alla) if (finns(x)) fs.utimesSync(path.join(BANK, `${x.h}.mp3`), idag, idag);

  const klara = alla.filter(finns);
  const register = { rost: 'chatterbox', referens: ref, filer: Object.fromEntries(klara.map((x) => [x.t, x.h])) };
  if (PUBLICERA) {
    try {
      const vad = grenen(status, register, [...new Set(klara.map((x) => x.h))]);
      if (vad) logg(vad);
    } catch (err) {
      logg(`grenen ${GREN}: ${String(err.stderr || err.message).trim().slice(0, 300)}`);
      process.exitCode = 1;
    }
  } else {
    skrivJson(path.join(TILLSTAND, 'rost.json'), register);
    logg(`${klara.length} av ${alla.length} meningar har ljud i ${BANK} (utan --publicera pushas inget)`);
  }
  if (!TORRT) skrivJson(STATUS, status);
}

main().catch((err) => {
  logg(`FEL: ${(err && err.stack) || err}`);
  process.exitCode = 1;
});
