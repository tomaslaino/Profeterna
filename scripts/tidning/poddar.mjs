#!/usr/bin/env node
// Supporterpoddarna till tidningen inför omgången (config/poddar.js, src/analyser/poddar.mjs).
// Körs på iMacen av launchd (se.matchfixarna.poddar) varje natt: hittar poddarna för lagen i
// gängets omgång, skriver ut veckans avsnitt med whisper.cpp och låter Claude Code (claude -p
// på Claude-kontot) ta ut det mest intressanta inför matcherna.
//
// Allt sparas utanför repot, i ~/Library/Application Support/Matchfixarna/Tidning/:
//   register.json   lagens poddar (namn och flöde), så att de bara letas upp en gång
//   omgang.json     omgångens avsnitt och uppgifter; tidningen läser den (scripts/analyser/skriv.mjs)
//   utskrifter/     utskrifterna, ett stycke per minut; tas bort efter tre veckor
// Skriptet rör aldrig git. Ljudet tas bort så snart det är utskrivet.
//
//   node scripts/tidning/poddar.mjs                      omgångens lag
//   node scripts/tidning/poddar.mjs --torrt              visar vilka avsnitt som skulle skrivas ut
//   node scripts/tidning/poddar.mjs --visa               visar det som är uttaget för omgången
//   node scripts/tidning/poddar.mjs --lag "Reading" --mot "Stockport County"
//                                                        ett lag på prov (sparas i prov.json)
//   node scripts/tidning/poddar.mjs --prov 401880745,401880747
//                                                        en påhittad omgång av sajtens matcher (prov.json)
//   node scripts/tidning/poddar.mjs --sidor              skriver bara om informationssidorna

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pc from '../../config/poddar.js';
import kupongCfg from '../../config/kupong.js';
import { betalvagar, inloggning, Stopp } from '../../src/analyser/claude.mjs';
import { appleKandidater, fragaEfterPoddar, levandePoddar, skaLetas, hamtaFlode, valjAvsnitt, skrivUt, taUt, whisperLedtrad, poddUnderlag, sidansUnderlag, sidNyckel, skrivSida } from '../../src/analyser/poddar.mjs';

const ARGV = process.argv.slice(2);
const flagga = (n) => ARGV.includes(n);
const varde = (n) => { const i = ARGV.indexOf(n); return i >= 0 ? ARGV[i + 1] : null; };
const TORRT = flagga('--torrt');
const VISA = flagga('--visa');
const ETT_LAG = varde('--lag');
const MOT = varde('--mot');
const PROV = varde('--prov');
const BARA_SIDOR = flagga('--sidor');
const FIL_UT = varde('--fil');

const HEM = os.homedir();
const MAPP = process.env.PODDAR_MAPP || path.join(HEM, 'Library', 'Application Support', 'Matchfixarna', pc.mapp);
const LOGG = path.join(HEM, 'Library', 'Logs', 'Matchfixarna', 'poddar.log');
const REGISTER = path.join(MAPP, 'register.json');
const OMGANG = path.join(MAPP, FIL_UT || (ETT_LAG || PROV ? 'prov.json' : 'omgang.json'));
const LAS = path.join(MAPP, 'las');
const DAG = 86400000;
const site = String(process.env.ANALYSER_SAJT || kupongCfg.site).replace(/\/+$/, '');
const samtalUrl = kupongCfg.endpoint.replace(/kupong$/, 'samtal');

function logg(text) {
  const rad = `${new Date().toISOString()} ${text}`;
  console.log(rad);
  try {
    fs.mkdirSync(path.dirname(LOGG), { recursive: true });
    if (fs.existsSync(LOGG) && fs.statSync(LOGG).size > 1024 * 1024) fs.renameSync(LOGG, `${LOGG}.1`);
    fs.appendFileSync(LOGG, `${rad}\n`);
  } catch { /* loggen är inte värd ett stopp */ }
}
const lasJson = (fil, annars) => { try { return JSON.parse(fs.readFileSync(fil, 'utf8')); } catch { return annars; } };
function skrivJson(fil, v) {
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  const tmp = `${fil}.tmp${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(v, null, 1)}\n`);
  fs.renameSync(tmp, fil);
}
async function hamta(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

let harLas = false;
function tagLas() {
  fs.mkdirSync(MAPP, { recursive: true });
  try {
    const pid = Number(fs.readFileSync(LAS, 'utf8'));
    if (pid) { try { process.kill(pid, 0); return false; } catch { /* finns inte längre */ } }
  } catch { /* inget lås */ }
  fs.writeFileSync(LAS, String(process.pid));
  harLas = true;
  return true;
}
process.on('exit', () => { if (harLas) fs.rmSync(LAS, { force: true }); });
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => { logg(`avbruten (${s})`); process.exit(1); });

// Skriver någon annan ut just nu (ett prov för hand)? Två på en gång går mycket långsammare.
function annanUtskrift() {
  try { return execFileSync('pgrep', ['-x', path.basename(pc.whisper)], { encoding: 'utf8' }).trim() !== ''; } catch { return false; }
}

// Lagen som har en match kvar i omgången. → [{lag, mot, avspark, spelare}]
async function omgangensLag(round) {
  const ut = [];
  for (const x of round.matcher) {
    if (Date.parse(x.avspark) <= Date.now()) continue;
    const d = await hamta(`${site}/data/match/${x.id}.json?t=${Date.now()}`).catch(() => null);
    const par = d && d.match && d.match.home ? [d.match.home, d.match.away] : String(x.match || '').split(/\s+[–-]\s+/);
    if (par.length !== 2) continue;
    const trupp = (s) => (d && d.squads && d.squads[s] && Array.isArray(d.squads[s].players) ? d.squads[s].players.map((p) => p && p.name).filter(Boolean) : []);
    const spelare = [...trupp('home'), ...trupp('away')];
    ut.push({ lag: par[0], mot: par[1], avspark: x.avspark, spelare, match: String(x.id) }, { lag: par[1], mot: par[0], avspark: x.avspark, spelare, match: String(x.id) });
  }
  return ut;
}

// Registret fylls på för lagen som saknas eller är gamla: ett anrop till Claude för alla.
async function fyllRegistret(register, lagen) {
  const nya = lagen.filter((l) => skaLetas(register[l], Date.now(), pc.kanda[l] || null));
  if (!nya.length) return;
  if (TORRT) { logg(`skulle leta upp poddar för ${nya.join(', ')}`); return; }
  const okanda = nya.filter((l) => !pc.kanda[l]);
  const svar = {};
  const kandidater = {};
  if (okanda.length) {
    logg(`letar poddar för ${okanda.length} lag`);
    for (const lag of okanda) kandidater[lag] = await appleKandidater(lag).catch(() => []);
    // Några lag i taget, så att vart och ett blir ordentligt genomgånget.
    for (let i = 0; i < okanda.length; i += pc.letaPerAnrop) {
      const del = okanda.slice(i, i + pc.letaPerAnrop);
      try {
        Object.assign(svar, await fragaEfterPoddar(del, { kandidater }));
      } catch (err) {
        if (err instanceof Stopp) throw err;
        logg(`poddarna gick inte att leta upp (${del.join(', ')}): ${err.message}`);
      }
    }
  }
  for (const lag of nya) {
    // Gick frågan inte att ställa letas laget upp igen nästa natt.
    if (!pc.kanda[lag] && !svar[lag]) continue;
    const namn = pc.kanda[lag] || svar[lag] || [];
    const poddar = await levandePoddar(namn, { logg, kandidater: kandidater[lag] || [] });
    // Ett lag som hade en podd behåller den om ingen ny hittas (flödet kan ha varit nere).
    const gamla = (register[lag] && register[lag].poddar) || [];
    register[lag] = { poddar: poddar.length ? poddar : gamla, kollad: new Date().toISOString(), ...(pc.kanda[lag] ? { kanda: pc.kanda[lag] } : {}) };
    logg(`${lag}: ${poddar.length ? poddar.map((p) => p.namn).join(', ') : `ingen podd hittad${namn.length ? ` (${namn.join(', ')})` : ''}`}`);
    skrivJson(REGISTER, register);
  }
}

function stada() {
  const ut = path.join(MAPP, 'utskrifter');
  if (!fs.existsSync(ut)) return;
  for (const f of fs.readdirSync(ut)) {
    const fil = path.join(ut, f);
    if (/^[0-9a-f]{12}\./.test(f) && Date.now() - fs.statSync(fil).mtimeMs > 21 * DAG) fs.rmSync(fil, { force: true });
  }
  fs.rmSync(path.join(MAPP, 'ljud'), { recursive: true, force: true });
}

function visa(fil) {
  for (const [lag, post] of Object.entries(fil.lag || {})) {
    console.log(`\n${lag}${post.mot ? ` (mot ${post.mot})` : ''}`);
    for (const a of post.avsnitt || []) {
      console.log(`  ${a.podd}: "${a.titel}" (${a.datum.slice(0, 10)})${a.handlarOm ? `\n  – ${a.handlarOm}` : ''}`);
      for (const u of a.uppgifter || []) console.log(`    [${u.s} ${u.vikt}] ${u.t}${u.min != null ? ` (min ${u.min})` : ''}`);
      if (!(a.uppgifter || []).length) console.log('    (inget värt att ta med)');
    }
    const t = poddUnderlag(fil, lag);
    if (!t.length) console.log('  → inget till tidningen');
  }
  for (const s of Object.values(fil.sidor || {})) {
    console.log(`\n=== ${s.match}${s.redigerad ? '' : ' (oredigerad)'}\n${s.rubrik || '(ingen rubrik)'}\n${s.ingress || ''}`);
    for (const d of s.delar) {
      console.log(`\n  ${d.lag}${d.kallor.length ? ` – ${d.kallor.map((k) => `${k.podd} (${k.datum})`).join(', ')}` : ' – ingen podd den här veckan'}`);
      for (const g of d.grupper) {
        console.log(`   ${pc.amnen[g.amne]}`);
        for (const p of g.punkter) console.log(`    [${p.s}] ${p.t}${p.citat ? `\n        ”${p.citat.sagt}” (${p.citat.vem || 'i podden'})` : ''}`);
      }
    }
  }
}

// Informationssidorna: en per match där något lag har uppgifter. Skrivs om när uppgifterna ändras.
async function sidorna(fil, matcher) {
  fil.sidor = fil.sidor || {};
  let n = 0;
  for (const m of matcher) {
    const nyckel = sidNyckel(sidansUnderlag(fil, m.lagen));
    const nu = fil.sidor[m.id];
    if (nu && nu.nyckel === nyckel && nu.redigerad) continue;
    if (TORRT) { logg(`skulle skriva sidan ${m.lagen.join(' – ')}`); continue; }
    const s = await skrivSida(fil, m.lagen, { avspark: m.avspark, logg });
    if (!s) { delete fil.sidor[m.id]; continue; }
    fil.sidor[m.id] = { id: m.id, match: m.lagen.join(' – '), lag: m.lagen, avspark: m.avspark, skriven: new Date().toISOString(), ...s };
    fil.uppdaterad = new Date().toISOString();
    skrivJson(OMGANG, fil);
    n++;
    logg(`sidan ${m.lagen.join(' – ')}: ${s.delar.map((d) => d.grupper.reduce((a, g) => a + g.punkter.length, 0)).join(' + ')} punkter${s.redigerad ? '' : ', oredigerad'} (${s.sekunder} s)`);
  }
  return n;
}

async function main() {
  if (VISA) { visa(lasJson(OMGANG, {})); return; }
  const fel = betalvagar();
  if (fel.length) { logg(`STOPP: ${fel.join(', ')} är satt. Då skulle Claude Code kunna debiteras som API. Ta bort variabeln.`); process.exit(1); }
  if (!tagLas()) { logg('en körning pågår redan'); return; }
  if (!fs.existsSync(path.join(MAPP, pc.modell))) { logg(`STOPP: whisper-modellen saknas (${path.join(MAPP, pc.modell)})`); process.exit(1); }

  let round = null;
  let lagen;
  if (ETT_LAG) {
    lagen = [{ lag: ETT_LAG, mot: MOT, avspark: null, spelare: [], match: 'prov' }];
  } else if (PROV) {
    const ids = PROV.split(',').map((x) => x.trim()).filter(Boolean);
    const matcher = [];
    for (const id of ids) {
      const d = await hamta(`${site}/data/match/${id}.json?t=${Date.now()}`);
      if (!d || !d.match) { logg(`matchen ${id} finns inte på sajten`); continue; }
      matcher.push({ id, match: `${d.match.home} – ${d.match.away}`, avspark: new Date(d.match.kickoff).toISOString() });
    }
    round = { id: `prov:${ids.join(',')}`, matcher };
    lagen = await omgangensLag(round);
  } else {
    const j = await hamta(`${samtalUrl}?t=${Date.now()}`);
    round = j && j.ok && j.samtal && Array.isArray(j.samtal.matcher) && j.samtal.matcher.length ? j.samtal : null;
    if (!round) { logg('ingen omgång just nu'); return; }
    lagen = await omgangensLag(round);
    if (!lagen.length) { logg(`${round.id}: alla matcher har börjat`); return; }
  }

  if (!TORRT) {
    const inne = await inloggning().catch((err) => err);
    const inloggad = inne && inne.loggedIn && inne.apiProvider === 'firstParty' && !/api.?key|console/i.test(String(inne.authMethod));
    if (!inloggad) { logg('STOPP: Claude Code är inte inloggat med abonnemanget. Kör: claude auth login --claudeai'); process.exit(1); }
    stada();
  }

  const register = lasJson(REGISTER, {});
  await fyllRegistret(register, lagen.map((l) => l.lag));

  const id = round ? round.id : `prov:${ETT_LAG}`;
  let fil = lasJson(OMGANG, null);
  if (!fil || fil.omgang !== id) fil = { omgang: id, uppdaterad: null, lag: {}, sidor: {} };
  // Matcherna som får en sida: [{id, lagen: [hemma, borta], avspark}]
  const matcher = [...new Map(lagen.map((l) => [l.match, l])).keys()].map((m) => {
    const par = lagen.filter((l) => l.match === m);
    return { id: m, lagen: par.length === 2 ? [par[0].lag, par[1].lag] : [par[0].lag, par[0].mot].filter(Boolean), avspark: par[0].avspark };
  });

  let gjorda = 0;
  let nya = 0;
  for (const l of BARA_SIDOR ? [] : lagen) {
    const poddar = (register[l.lag] && register[l.lag].poddar) || [];
    if (!poddar.length) continue;
    const post = fil.lag[l.lag] || (fil.lag[l.lag] = { mot: l.mot, avsnitt: [] });
    post.mot = l.mot;
    const floden = [];
    for (const p of poddar) {
      try {
        const f = await hamtaFlode(p.flode);
        floden.push({ podd: p.namn, avsnitt: f.avsnitt.map((a) => ({ ...a, apple: p.apple })) });
      } catch (err) {
        logg(`${l.lag}: flödet för ${p.namn} gick inte att läsa (${err.message})`);
      }
    }
    const val = valjAvsnitt(floden, { mot: l.mot, gjorda: new Set(post.avsnitt.filter((a) => a.version === pc.promptVersion).map((a) => a.id)) }).slice(0, pc.avsnittPerKorning);
    if (!val.length) continue;
    for (const a of val) {
      if (gjorda >= pc.flestAvsnitt) break;
      if (TORRT) { logg(`skulle skriva ut ${l.lag}: ${a.podd} – "${a.titel}" (${a.datum.slice(0, 10)}, ${a.minuter || '?'} min)`); continue; }
      gjorda++;
      try {
        for (let i = 0; annanUtskrift() && i < 30; i++) await new Promise((ok) => setTimeout(ok, 60000));
        const utskrift = await skrivUt(a, { mapp: MAPP, ledtrad: whisperLedtrad(l.lag, l.mot, l.spelare), logg });
        const u = await taUt(a, utskrift, { lag: l.lag, mot: l.mot, avspark: l.avspark, spelare: l.spelare });
        if (!u.rattKlubb) {
          // Fel podd i registret (en annan klubb med liknande namn): den tas bort och laget letas upp igen om en vecka.
          logg(`${l.lag}: ${a.podd} handlar om en annan klubb (${u.handlarOm || '–'}) och tas bort ur registret`);
          if (register[l.lag]) { register[l.lag].poddar = register[l.lag].poddar.filter((p) => p.namn !== a.podd); skrivJson(REGISTER, register); }
          u.uppgifter = [];
        }
        post.avsnitt = post.avsnitt.filter((x) => x.id !== a.id);
        post.avsnitt.push({ id: a.id, podd: a.podd, titel: a.titel, datum: a.datum, sida: a.sida, apple: a.apple || null, version: pc.promptVersion, uttaget: new Date().toISOString(), handlarOm: u.handlarOm, uppgifter: u.uppgifter });
        nya += u.uppgifter.length;
        fil.uppdaterad = new Date().toISOString();
        skrivJson(OMGANG, fil);
        logg(`${l.lag}: ${a.podd} – "${a.titel}": ${u.uppgifter.length} uppgifter${u.strukna ? `, ${u.strukna} strukna` : ''} (${u.sekunder} s)`);
      } catch (err) {
        if (err instanceof Stopp) { logg(`STOPP (${err.slag}): ${err.message}`); process.exit(1); }
        logg(`FEL ${l.lag}: ${a.podd} – "${a.titel}": ${err.message}`);
      }
    }
  }
  let sidor = 0;
  try {
    sidor = await sidorna(fil, matcher);
  } catch (err) {
    if (err instanceof Stopp) { logg(`STOPP (${err.slag}): ${err.message}`); process.exit(1); }
    throw err;
  }
  if (!TORRT) logg(`klart: ${id}, ${gjorda} avsnitt, ${nya} nya uppgifter, ${sidor} sidor`);
  if ((ETT_LAG || PROV) && !TORRT) visa(fil);
}

main().catch((err) => {
  logg(`FEL: ${(err && err.stack) || err}`);
  process.exit(1);
});
