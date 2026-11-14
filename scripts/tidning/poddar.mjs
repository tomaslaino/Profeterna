#!/usr/bin/env node
// Supporterpoddarna, supporterforumen, de insatta medierna och klubben, lokaltidningen och motståndarens
// intervju till tidningen inför omgången (config/poddar.js, config/forum.js, config/media.js, config/lokal.js,
// src/analyser/poddar.mjs, forum.mjs och media.mjs). Körs på iMacen av launchd (se.matchfixarna.poddar) på
// tiderna i config/poddar.js: läser lagens forum, letar upp och läser veckans artiklar i de insatta medierna,
// hos klubben och i lokaltidningen, det supportrarna i förra klubben har skrivit om lagets nya tränare eller
// spelare (config/forra.js, src/analyser/forra.mjs), hittar poddarna för lagen i gängets
// omgång, skriver ut veckans avsnitt med whisper.cpp och låter Claude Code (claude -p på
// Claude-kontot) ta ut det mest intressanta inför matcherna.
//
// Allt sparas utanför repot, i ~/Library/Application Support/Matchfixarna/Tidning/:
//   register.json   lagens poddar (namn och flöde), så att de bara letas upp en gång
//   forum.json      lagens forum (namn och tavla), likaså
//   forra.json      lagens nya tränare och spelare (tas fram igen efter några veckor, config/forra.js,
//                   giltigDagar) och vad förra klubbens supportrar har skrivit om dem den senaste veckan
//   omgang.json     omgångens avsnitt, forumläsningar, artiklar och uppgifter; tidningen läser den (scripts/analyser/skriv.mjs)
//   traff.json      källornas träffsäkerhet: det de sa om truppen, prövat mot matchtruppen efter
//                   matcherna (config/traff.js, src/analyser/traff.mjs); redaktören läser den
//   utskrifter/     utskrifterna, ett stycke per minut; tas bort efter tre veckor
// Skriptet rör aldrig git. Ljudet tas bort så snart det är utskrivet.
//
//   node scripts/tidning/poddar.mjs                      omgångens lag, bara på tiderna (som launchd)
//   node scripts/tidning/poddar.mjs --nu                 omgångens lag, oavsett tid
//   node scripts/tidning/poddar.mjs --torrt              visar vilka avsnitt som skulle skrivas ut
//   node scripts/tidning/poddar.mjs --visa               visar det som är uttaget för omgången
//   node scripts/tidning/poddar.mjs --lag "Reading" --mot "Stockport County"
//                                                        ett lag på prov (sparas i prov.json)
//   node scripts/tidning/poddar.mjs --prov 401880745,401880747
//                                                        en påhittad omgång av sajtens matcher (prov.json)
//   node scripts/tidning/poddar.mjs --sidor              skriver bara om informationssidorna
//   node scripts/tidning/poddar.mjs --bara-forum         bara forumen (inga poddar eller medier)
//   node scripts/tidning/poddar.mjs --utan-forum         utan forumen
//   node scripts/tidning/poddar.mjs --bara-media         bara de insatta medierna
//   node scripts/tidning/poddar.mjs --utan-media         utan de insatta medierna
//   node scripts/tidning/poddar.mjs --bara-lokal         bara klubben, lokaltidningen och motståndarens intervju
//   node scripts/tidning/poddar.mjs --utan-lokal         utan dem
//   node scripts/tidning/poddar.mjs --bara-forra         bara förra klubben, också när den är avstängd (fr.pa)
//   node scripts/tidning/poddar.mjs --utan-forra         utan förra klubben
//   node scripts/tidning/poddar.mjs --traff              prövar bara omgångens spelade matcher och visar källornas
//                                                        träffsäkerhet (med --fil en annan omgångsfil)
//
// Varje körning börjar med att pröva den förra omgångens spelade matcher (src/analyser/traff.mjs),
// medan deras uppgifter ännu ligger i omgang.json.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pc from '../../config/poddar.js';
import fc from '../../config/forum.js';
import mc from '../../config/media.js';
import lc from '../../config/lokal.js';
import fr from '../../config/forra.js';
import kupongCfg from '../../config/kupong.js';
import { betalvagar, inloggning, Stopp } from '../../src/analyser/claude.mjs';
import { lasForum, taUtForum, lasningsNyckel, forumPoster, forumenAv, provaForum, fragaEfterForum, forumSkaLetas, Sparrad } from '../../src/analyser/forum.mjs';
import { letaArtiklar, lasArtikel, nyaArtiklar, lastaAvAndra, renAdress, taUtMedia, mediaPoster, laggTill, Sparrad as MediaSparrad } from '../../src/analyser/media.mjs';
import { letaForra, lasForraSida, forraSkaLetas, kandaNya } from '../../src/analyser/forra.mjs';
import { senasteTid, nastaTid } from '../../src/analyser/tider.mjs';
import { provaOmgangen, kallornasTraff, traffText } from '../../src/analyser/traff.mjs';
import { appleKandidater, fragaEfterPoddar, levandePoddar, skaLetas, hamtaFlode, valjAvsnitt, skrivUt, taUt, whisperLedtrad, poddUnderlag, forumUnderlag, mediaUnderlag, lokalUnderlag, forraUnderlag, sidansUnderlag, sidNyckel, skrivSida } from '../../src/analyser/poddar.mjs';

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
const BARA_FORUM = flagga('--bara-forum');
const UTAN_FORUM = flagga('--utan-forum');
const BARA_MEDIA = flagga('--bara-media');
const UTAN_MEDIA = flagga('--utan-media');
const BARA_LOKAL = flagga('--bara-lokal');
const UTAN_LOKAL = flagga('--utan-lokal');
const BARA_FORRA = flagga('--bara-forra');
const UTAN_FORRA = flagga('--utan-forra');
const BARA_TRAFF = flagga('--traff');
// Utan val är det launchd: då går skriptet bara på tiderna (config/poddar.js, tider). --nu
// eller något annat val kör oavsett tid.
const PA_TID = !ARGV.length;
// Vad som körs: forumen, de insatta medierna, klubben och lokaltidningen, och poddarna (informationssidorna
// skrivs alltid).
const BARA = BARA_SIDOR || BARA_FORUM || BARA_MEDIA || BARA_LOKAL || BARA_FORRA || BARA_TRAFF;
const MED_FORUM = !UTAN_FORUM && (!BARA || BARA_FORUM);
const MED_MEDIA = !UTAN_MEDIA && (!BARA || BARA_MEDIA);
const MED_LOKAL = !UTAN_LOKAL && (!BARA || BARA_LOKAL);
// Förra klubben är avstängd (fr.pa i config/forra.js); --bara-forra kör den ändå.
const MED_FORRA = BARA_FORRA || (fr.pa && !UTAN_FORRA && !BARA);
const MED_PODDAR = !BARA;
// Källans slag som det står i loggen och i --visa.
const TYPORD = { forum: 'forumet ', media: 'insatta ', lokal: 'lokalt ', motstand: 'intervjun i ', forra: 'förra klubben ' };

const HEM = os.homedir();
const MAPP = process.env.PODDAR_MAPP || path.join(HEM, 'Library', 'Application Support', 'Matchfixarna', pc.mapp);
const LOGG = path.join(HEM, 'Library', 'Logs', 'Matchfixarna', 'poddar.log');
const REGISTER = path.join(MAPP, 'register.json');
const FORUMREG = path.join(MAPP, 'forum.json');
const FORRAREG = path.join(MAPP, 'forra.json');
const OMGANG = path.join(MAPP, FIL_UT || (ETT_LAG || PROV ? 'prov.json' : 'omgang.json'));
const TRAFF = path.join(MAPP, 'traff.json');
const LAS = path.join(MAPP, 'las');
const TIDER = path.join(MAPP, 'tider.json');
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

// Är det dags (config/poddar.js, tider)? launchd startar skriptet varje natt och lördag morgon,
// och en körning går bara när en tid har slagit sedan den senaste lyckade (tider.json: den
// tiden). En tid som missas medan datorn sover körs när den vaknar, och en körning som stoppas
// försöks igen vid nästa start. Saknas filen räknas den senaste tiden som körd, så att ett nytt
// schema inte ger en extra körning. → {dags, tid, nasta}
function schemat(now = Date.now()) {
  const tid = senasteTid(now, pc.tider || []);
  const nasta = nastaTid(now, pc.tider || []);
  const fil = lasJson(TIDER, null);
  if (!fil) { skrivJson(TIDER, { senast: new Date(tid).toISOString() }); return { dags: false, tid, nasta }; }
  return { dags: tid > (Date.parse(fil.senast) || 0), tid, nasta };
}
const klockan = (ms) => (ms ? new Date(ms).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', hour: '2-digit', minute: '2-digit' }) : '–');

// Lagen som har en match kvar i omgången. → [{lag, mot, avspark, spelare}]
async function omgangensLag(round) {
  const ut = [];
  for (const x of round.matcher) {
    if (Date.parse(x.avspark) <= Date.now()) continue;
    const d = await hamta(`${site}/data/match/${x.id}.json?t=${Date.now()}`).catch(() => null);
    // Landslagen har inga supporterpoddar, forum eller lokaltidningar att läsa: deras matchblad skrivs för hand
    // (2026-11-13), och de står kvar när bladen läggs ut (poddsidor i src/analyser/poddar.mjs).
    if (d && d.match && d.match.type === 'intl') continue;
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

// Forumregistret: lagens forum i config/forum.js prövas (lever tavlan och går den att läsa?), lagen
// som varken står där eller bland dem utan forum letas upp av Claude, några i taget. Registret har
// en lista per lag: alla forum som gick att läsa, det viktigaste först.
async function fyllForum(reg, lagen) {
  const nya = lagen.filter((l) => !fc.utan.includes(l) && forumSkaLetas(reg[l], Date.now(), fc.kanda[l] || null));
  if (!nya.length) return;
  if (TORRT) { logg(`skulle pröva forumen för ${nya.join(', ')}`); return; }
  const okanda = nya.filter((l) => !fc.kanda[l]);
  const svar = {};
  for (let i = 0; i < okanda.length; i += fc.letaPerAnrop) {
    const del = okanda.slice(i, i + fc.letaPerAnrop);
    logg(`letar forum för ${del.join(', ')}`);
    try {
      Object.assign(svar, await fragaEfterForum(del));
    } catch (err) {
      if (err instanceof Stopp) throw err;
      logg(`forumen gick inte att leta upp (${del.join(', ')}): ${err.message}`);
    }
  }
  for (const lag of nya) {
    if (!fc.kanda[lag] && !(lag in svar)) continue;
    const kanda = forumenAv(fc.kanda[lag]);
    const forut = forumenAv(reg[lag] && reg[lag].forum);
    const prova = kanda.length ? kanda : forumenAv(svar[lag]);
    const forum = [];
    const fel = {};
    for (const f of prova.slice(0, fc.flestForum)) {
      const p = await provaForum(f).catch((err) => ({ ok: false, orsak: err.message }));
      // Ett känt forum som inte svarar just nu får stå kvar; det prövas igen nästa gång.
      if (p.ok || (kanda.length && forut.some((x) => x.namn === f.namn))) forum.push(f);
      if (!p.ok) fel[f.namn] = p.orsak;
      logg(`${lag}: ${p.ok ? `forumet ${f.namn} (${p.tradar} trådar)` : `forumet ${f.namn} gick inte att läsa (${p.orsak})${forum.includes(f) ? ', står kvar' : ''}`}`);
    }
    if (!prova.length) logg(`${lag}: inget forum hittat`);
    reg[lag] = { forum, kollad: new Date().toISOString(), ...(fc.kanda[lag] ? { kant: fc.kanda[lag] } : {}), ...(Object.keys(fel).length ? { fel } : !prova.length ? { fel: 'inget forum hittat' } : {}) };
    skrivJson(FORUMREG, reg);
  }
}

// Läser alla lagets forum och tar ut det intressanta ur dem tillsammans, ett anrop per lag. Samma
// inlägg som förra läsningen läses inte av Claude igen. Varje forum sparas som en egen läsning,
// så att det står som källa för sig. → antal nya uppgifter
async function lasForumen(fil, reg, lagen) {
  let nya = 0;
  for (const l of lagen) {
    const forumen = forumenAv(reg[l.lag] && reg[l.lag].forum);
    if (!forumen.length) continue;
    const post = fil.lag[l.lag] || (fil.lag[l.lag] = { mot: l.mot, avsnitt: [] });
    post.mot = l.mot;
    post.match = l.match;
    post.avspark = l.avspark;
    const lasningar = [];
    for (const forum of forumen) {
      try {
        const lasning = await lasForum(forum, { mot: l.mot, logg });
        if (lasning.tradar.length) lasningar.push(lasning);
        else logg(`${l.lag}: ${forum.namn} – inga nya inlägg i trådarna inför matchen`);
      } catch (err) {
        if (err instanceof Stopp) throw err;
        logg(`${err instanceof Sparrad ? 'SPÄRRAT' : 'FEL'} ${l.lag}: ${forum.namn}: ${err.message}`);
      }
    }
    if (!lasningar.length) continue;
    const namn = lasningar.map((x) => x.forum.namn).join(', ');
    try {
      const nyckel = lasningsNyckel(lasningar);
      const forra = post.avsnitt.filter((a) => a.typ === 'forum').sort((a, b) => b.uttaget.localeCompare(a.uttaget))[0];
      if (forra && (forra.lasning || forra.nyckel) === nyckel && forra.version === fc.promptVersion) { logg(`${l.lag}: ${namn} – inget nytt sedan förra läsningen`); continue; }
      if (TORRT) { logg(`skulle läsa ${l.lag}: ${lasningar.map((x) => `${x.forum.namn} – ${x.tradar.map((t) => `"${t.titel}" (${t.inlagg.length})`).join(', ')}`).join('; ')}`); continue; }
      const u = await taUtForum(lasningar, { lag: l.lag, mot: l.mot, avspark: l.avspark, spelare: l.spelare });
      if (u.felForum.length) {
        logg(`${l.lag}: ${u.felForum.join(', ')} handlar om en annan klubb (${u.handlarOm || '–'}) och tas bort ur registret`);
        const kvar = forumenAv(reg[l.lag] && reg[l.lag].forum).filter((f) => !u.felForum.includes(f.namn));
        reg[l.lag] = { ...(reg[l.lag] || {}), forum: kvar, kollad: new Date().toISOString(), fel: { ...((reg[l.lag] && typeof reg[l.lag].fel === 'object' && reg[l.lag].fel) || {}), ...Object.fromEntries(u.felForum.map((n) => [n, 'fel klubb'])) } };
        skrivJson(FORUMREG, reg);
      }
      const poster = forumPoster(lasningar, u, { lag: l.lag, nyckel, version: fc.promptVersion });
      if (!poster.length) continue;
      // Högst fyra läsningar per forum ligger kvar i omgången (sidan och tidningen tar de senaste).
      const nyaId = new Set(poster.map((p) => p.id));
      const gamla = post.avsnitt.filter((a) => a.typ === 'forum' && !nyaId.has(a.id) && !u.felForum.includes(a.podd)).sort((a, b) => b.uttaget.localeCompare(a.uttaget));
      const behall = gamla.filter((a, i) => gamla.slice(0, i).filter((x) => x.podd === a.podd).length < 3);
      post.avsnitt = [...post.avsnitt.filter((a) => a.typ !== 'forum'), ...behall, ...poster];
      nya += u.uppgifter.length;
      fil.uppdaterad = new Date().toISOString();
      skrivJson(OMGANG, fil);
      logg(`${l.lag}: ${poster.map((p) => `${p.podd} – ${p.tradar.length} trådar, ${p.tradar.reduce((n, t) => n + t.inlagg, 0)} inlägg, ${p.uppgifter.length} uppgifter`).join('; ')}${u.strukna ? ` (${u.strukna} strukna)` : ''} (${u.sekunder} s)`);
    } catch (err) {
      if (err instanceof Stopp) throw err;
      logg(`FEL ${l.lag}: ${namn}: ${err.message}`);
    }
  }
  return nya;
}

// Letar upp veckans artiklar om laget i de insatta medierna (cfg = config/media.js) eller hos klubben, i
// lokaltidningen och i motståndarens intervju (cfg = config/lokal.js), läser dem och tar ut det intressanta.
// En artikel som redan är läst med samma text läses inte av Claude igen, och en som den andra läsningen
// redan har läses inte alls. vad: källorna som de står i loggen. → antal nya uppgifter
async function lasMedierna(fil, lagen, { cfg = mc, vad = 'de insatta medierna' } = {}) {
  let nya = 0;
  for (const l of lagen) {
    if (TORRT) { logg(`skulle leta i ${vad} för ${l.lag}`); continue; }
    const post = fil.lag[l.lag] || (fil.lag[l.lag] = { mot: l.mot, avsnitt: [] });
    post.mot = l.mot;
    post.match = l.match;
    post.avspark = l.avspark;
    try {
      const andras = lastaAvAndra(post, { cfg });
      const hittade = (await letaArtiklar({ lag: l.lag, mot: l.mot, avspark: l.avspark, cfg })).filter((a) => !andras.has(renAdress(a.adress)));
      if (!hittade.length) { logg(`${l.lag}: inga artiklar i ${vad}`); continue; }
      const lasta = [];
      for (const a of hittade) {
        try {
          lasta.push(await lasArtikel(a, { cfg }));
        } catch (err) {
          logg(`${err instanceof MediaSparrad ? 'SPÄRRAT' : 'hoppar över'} ${l.lag}: ${a.kalla || a.adress} – ${err.message}`);
        }
      }
      const nyaA = nyaArtiklar(lasta, post, { cfg });
      if (!nyaA.length) { logg(`${l.lag}: ${lasta.length ? 'inga nya artiklar sedan förra läsningen' : 'ingen av artiklarna gick att läsa'}`); continue; }
      const u = await taUtMedia(nyaA, { lag: l.lag, mot: l.mot, avspark: l.avspark, spelare: l.spelare, cfg });
      laggTill(post, mediaPoster(u.artiklar, u, { cfg }), { cfg });
      nya += u.uppgifter.length;
      fil.uppdaterad = new Date().toISOString();
      skrivJson(OMGANG, fil);
      logg(`${l.lag}: ${u.artiklar.map((a) => a.kalla).join(', ')} – ${u.artiklar.length} artiklar: ${u.uppgifter.length} uppgifter${u.strukna ? `, ${u.strukna} strukna` : ''} (${u.sekunder} s)`);
    } catch (err) {
      if (err instanceof Stopp) throw err;
      logg(`FEL ${l.lag}: ${vad}: ${err.message}`);
    }
  }
  return nya;
}

// Förra klubben (config/forra.js): Claude tar reda på vem som är ny i laget (eller får de nya ur registret,
// om de är framtagna de senaste fr.giltigDagar dagarna) och söker fram vad hans förra klubbs supportrar har
// skrivit den senaste veckan; jobbet läser sidorna och Claude tar ut det de säger om honom. Ett lag utan
// någon ny söks inte, och ett lag som söktes de senaste fr.sokIgenDagar dagarna inte igen. Registret
// (forra.json) har lagets poster från veckan, och lagets poster i omgångens fil byts mot dem: det som är
// äldre än fr.dagar dagar faller bort. → antal nya uppgifter
async function lasForra(fil, reg, lagen) {
  let nya = 0;
  const farsk = (p) => Date.now() - Date.parse(p.datum) <= fr.dagar * DAG;
  for (const l of lagen) {
    let r = reg[l.lag];
    if (forraSkaLetas(r)) {
      if (TORRT) { logg(`skulle leta upp förra klubben för ${l.lag}`); continue; }
      const kanda = kandaNya(r);
      try {
        const hittat = await letaForra({ lag: l.lag, nya: kanda });
        const tidigare = ((r && r.poster) || []).filter(farsk);
        const lasta = [];
        for (const a of hittat.artiklar) {
          try {
            lasta.push(await lasForraSida(a));
          } catch (err) {
            logg(`${err instanceof MediaSparrad ? 'SPÄRRAT' : 'hoppar över'} ${l.lag}: förra klubben ${a.kalla || a.adress} – ${err.message}`);
          }
        }
        // En sida som redan är läst med samma inlägg tas inte ut igen.
        const nyaSidor = nyaArtiklar(lasta, { avsnitt: tidigare }, { cfg: fr });
        const u = nyaSidor.length ? await taUtMedia(nyaSidor, { lag: l.lag, mot: l.mot, avspark: l.avspark, spelare: l.spelare, cfg: fr }) : null;
        const poster = u ? mediaPoster(u.artiklar, u, { cfg: fr }).filter((p) => p.uppgifter.length) : [];
        const behall = laggTill({ avsnitt: tidigare }, poster, { cfg: fr }).avsnitt;
        r = reg[l.lag] = { kollad: kanda ? r.kollad : new Date().toISOString(), version: fr.promptVersion, nya: hittat.nya, sokt: new Date().toISOString(), poster: behall };
        skrivJson(FORRAREG, reg);
        const antal = poster.reduce((n, p) => n + p.uppgifter.length, 0);
        nya += antal;
        const vem = hittat.nya.length ? hittat.nya.map((p) => `${p.namn} (förut i ${p.fran})`).join(', ') : 'ingen ny';
        logg(`${l.lag}: förra klubben – ${vem}; ${lasta.length} av ${hittat.artiklar.length} sidor från veckan, ${antal} uppgifter${u && u.strukna ? `, ${u.strukna} strukna` : ''}${u ? ` (${u.sekunder} s)` : ''}`);
      } catch (err) {
        if (err instanceof Stopp) throw err;
        logg(`FEL ${l.lag}: förra klubben: ${err.message}`);
        continue;
      }
    }
    const poster = ((r && r.poster) || []).filter(farsk);
    const post = fil.lag[l.lag] || (poster.length ? (fil.lag[l.lag] = { mot: l.mot, avsnitt: [] }) : null);
    if (!post) continue;
    const forut = post.avsnitt.filter((a) => a.typ === 'forra').map((a) => a.id).sort().join(',');
    if (forut === poster.map((p) => p.id).sort().join(',')) continue;
    post.mot = l.mot;
    post.match = l.match;
    post.avspark = l.avspark;
    post.avsnitt = [...post.avsnitt.filter((a) => a.typ !== 'forra'), ...poster];
    fil.uppdaterad = new Date().toISOString();
    skrivJson(OMGANG, fil);
  }
  return nya;
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
      console.log(`  ${TYPORD[a.typ] || ''}${a.podd}${a.om ? ` om ${a.om}${a.fran ? ` (förut i ${a.fran})` : ''}` : ''}: "${a.titel}" (${String(a.datum).slice(0, 10)})${a.handlarOm ? `\n  – ${a.handlarOm}` : ''}`);
      for (const u of a.uppgifter || []) console.log(`    [${u.s} ${u.vikt}] ${u.t}${u.min != null ? ` (min ${u.min})` : ''}${u.vem ? ` – ${u.vem}` : ''}`);
      if (!(a.uppgifter || []).length) console.log('    (inget värt att ta med)');
    }
    const t = [...poddUnderlag(fil, lag), ...forumUnderlag(fil, lag), ...mediaUnderlag(fil, lag), ...lokalUnderlag(fil, lag), ...forraUnderlag(fil, lag)];
    if (!t.length) console.log('  → inget till tidningen');
  }
  for (const s of Object.values(fil.sidor || {})) {
    console.log(`\n=== ${s.match}${s.redigerad ? '' : ' (oredigerad)'}\n${s.rubrik || '(ingen rubrik)'}\n${s.ingress || ''}`);
    for (const d of s.delar) {
      console.log(`\n  ${d.lag}${d.kallor.length ? ` – ${d.kallor.map((k) => `${TYPORD[k.typ] || ''}${k.podd} (${k.datum})`).join(', ')}` : ' – ingen podd, inget forum, inget från de insatta och inget från klubben eller lokaltidningen den här veckan'}`);
      for (const t of d.text || []) console.log(`    ${t}`);
    }
    if (s.summering) console.log(`\n  Sammanfattning: ${s.summering}`);
    if (s.citat) console.log(`  ”${s.citat.sagt}” (${[s.citat.vem, s.citat.podd, s.citat.datum].filter(Boolean).join(', ')})`);
  }
  visaTraff();
}

// Den förra omgångens spelade matcher prövas mot matchtruppen (src/analyser/traff.mjs).
async function traffen() {
  const fil = lasJson(OMGANG, null);
  if (!fil || !fil.lag) return;
  const traff = lasJson(TRAFF, {});
  await provaOmgangen(fil, traff, { site, logg, torrt: TORRT, spara: (t) => skrivJson(TRAFF, t) });
}

// Källornas träffsäkerhet; med detaljer också varje prövat påstående.
function visaTraff({ detaljer = false } = {}) {
  const traff = lasJson(TRAFF, {});
  if (detaljer) {
    for (const m of Object.values(traff.matcher || {})) {
      console.log(`\n${m.match} (${String(m.avspark).slice(0, 10)})${m.domar.length ? '' : ' – inget att pröva'}`);
      for (const d of m.domar) console.log(`  ${d.dom === 'ratt' ? 'rätt' : 'FEL '}  ${d.lag}: ${d.namn} ${d.sa} – ${TYPORD[d.typ] || ''}${d.kalla} (${d.datum})`);
    }
  }
  const t = Object.values(kallornasTraff(traff)).sort((a, b) => a.lag.localeCompare(b.lag) || (b.ratt + b.fel) - (a.ratt + a.fel));
  if (!t.length) { console.log('\nTräffsäkerhet: inget prövat än'); return; }
  console.log('\nTräffsäkerhet (rätt av prövade påståenden om truppen):');
  for (const x of t) console.log(`  ${x.lag}: ${TYPORD[x.typ] || ''}${x.kalla} – ${x.ratt} av ${x.ratt + x.fel}`);
}

// Informationssidorna: en per match där något lag har uppgifter. Skrivs om när uppgifterna ändras.
async function sidorna(fil, matcher) {
  fil.sidor = fil.sidor || {};
  let n = 0;
  // Källornas träffsäkerhet om truppen (traff.json), till redaktören.
  const tabell = kallornasTraff(lasJson(TRAFF, {}));
  const kallTraff = (lag, kalla) => traffText(tabell[`${lag}\n${kalla}`]);
  for (const m of matcher) {
    const nyckel = sidNyckel(sidansUnderlag(fil, m.lagen, { avspark: m.avspark }));
    const nu = fil.sidor[m.id];
    if (nu && nu.nyckel === nyckel && nu.redigerad) continue;
    if (TORRT) { logg(`skulle skriva sidan ${m.lagen.join(' – ')}`); continue; }
    const s = await skrivSida(fil, m.lagen, { avspark: m.avspark, logg, kallTraff });
    if (!s) { delete fil.sidor[m.id]; continue; }
    fil.sidor[m.id] = { id: m.id, match: m.lagen.join(' – '), lag: m.lagen, avspark: m.avspark, skriven: new Date().toISOString(), ...s };
    fil.uppdaterad = new Date().toISOString();
    skrivJson(OMGANG, fil);
    n++;
    logg(`matchbladet ${m.lagen.join(' – ')}: ${s.delar.map((d) => (d.text || []).length).join(' + ')} stycken${s.redigerad ? '' : ', oredigerat'} (${s.sekunder} s)`);
  }
  return n;
}

async function main() {
  if (VISA) { visa(lasJson(OMGANG, {})); return; }
  const schema = PA_TID ? schemat() : null;
  if (schema && !schema.dags) { logg(`inte dags, nästa gång ${klockan(schema.nasta)}`); return; }
  const fel = betalvagar();
  if (fel.length) { logg(`STOPP: ${fel.join(', ')} är satt. Då skulle Claude Code kunna debiteras som API. Ta bort variabeln.`); process.exit(1); }
  if (!tagLas()) { logg('en körning pågår redan'); return; }
  if (MED_PODDAR && !fs.existsSync(path.join(MAPP, pc.modell))) { logg(`STOPP: whisper-modellen saknas (${path.join(MAPP, pc.modell)})`); process.exit(1); }

  if (!TORRT) {
    const inne = await inloggning().catch((err) => err);
    const inloggad = inne && inne.loggedIn && inne.apiProvider === 'firstParty' && !/api.?key|console/i.test(String(inne.authMethod));
    if (!inloggad) { logg('STOPP: Claude Code är inte inloggat med abonnemanget. Kör: claude auth login --claudeai'); process.exit(1); }
    stada();
  }

  // Först prövas den förra omgångens spelade matcher, medan deras uppgifter ännu ligger i omgang.json
  // (den byts mot den nya omgången längre ner).
  if (BARA_TRAFF || (!ETT_LAG && !PROV)) {
    try {
      await traffen();
    } catch (err) {
      if (err instanceof Stopp) { logg(`STOPP (${err.slag}): ${err.message}`); process.exit(1); }
      logg(`FEL träffsäkerhet: ${err.message}`);
    }
    if (BARA_TRAFF) { visaTraff({ detaljer: true }); return; }
  }

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

  const register = lasJson(REGISTER, {});
  const forumreg = lasJson(FORUMREG, {});
  const forrareg = lasJson(FORRAREG, {});
  try {
    if (MED_FORUM) await fyllForum(forumreg, lagen.map((l) => l.lag));
    if (MED_PODDAR) await fyllRegistret(register, lagen.map((l) => l.lag));
  } catch (err) {
    if (err instanceof Stopp) { logg(`STOPP (${err.slag}): ${err.message}`); process.exit(1); }
    throw err;
  }

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
  // Forumen och medierna först: de går fort (några sidor och ett eller två anrop per lag), poddarna tar timmar.
  let nyaForum = 0;
  let nyaMedia = 0;
  let nyaLokal = 0;
  let nyaForra = 0;
  try {
    if (MED_FORUM) nyaForum = await lasForumen(fil, forumreg, lagen);
    if (MED_MEDIA) nyaMedia = await lasMedierna(fil, lagen);
    if (MED_LOKAL) nyaLokal = await lasMedierna(fil, lagen, { cfg: lc, vad: 'klubben och lokaltidningen' });
    if (MED_FORRA) nyaForra = await lasForra(fil, forrareg, lagen);
  } catch (err) {
    if (err instanceof Stopp) { logg(`STOPP (${err.slag}): ${err.message}`); process.exit(1); }
    throw err;
  }
  for (const l of MED_PODDAR ? lagen : []) {
    const poddar = (register[l.lag] && register[l.lag].poddar) || [];
    if (!poddar.length) continue;
    const post = fil.lag[l.lag] || (fil.lag[l.lag] = { mot: l.mot, avsnitt: [] });
    post.mot = l.mot;
    post.match = l.match;
    post.avspark = l.avspark;
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
  if (!TORRT) logg(`klart: ${id}, ${gjorda} avsnitt, ${nya} nya uppgifter ur poddarna, ${nyaForum} ur forumen, ${nyaMedia} ur de insatta medierna, ${nyaLokal} ur klubben och lokaltidningen, ${nyaForra} ur förra klubben, ${sidor} sidor`);
  if (schema) skrivJson(TIDER, { senast: new Date(schema.tid).toISOString() });
  if ((ETT_LAG || PROV) && !TORRT) visa(fil);
}

main().catch((err) => {
  logg(`FEL: ${(err && err.stack) || err}`);
  process.exit(1);
});
