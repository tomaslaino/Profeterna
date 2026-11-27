// iMacens loggar till MacBooken (2026-11-27): iMacen står hemma, och den som felsöker är ofta någon annanstans,
// utan att nå den. Analysjobbet (scripts/analyser/skriv.mjs, var 15:e minut) skickar därför slutet av jobbens loggar
// till grenen imac-loggar i repot – krypterat, eftersom repot är öppet. Nyckeln som låser upp ligger bara på MacBooken
// (~/.config/matchfixarna/imac-loggen.pem); iMacen har bara den öppna halvan (config/imac-loggen.pub.pem).
// Läses med: node scripts/analyser/imac-loggen.mjs
//
// Grenen har alltid en enda commit, som skrivs över: inget samlas på hög, och main och sajten rörs inte.

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

export const GREN = 'imac-loggar';
export const FIL = 'loggar.json';
export const OPPEN = path.join('config', 'imac-loggen.pub.pem');
export const NYCKEL = process.env.IMAC_LOGGEN_NYCKEL || path.join(os.homedir(), '.config', 'matchfixarna', 'imac-loggen.pem');

// Högst så ofta, och bara när något har ändrats.
const MINUTER = 30;

// De sista raderna i en fil (läser bara slutet).
function slutet(fil, rader) {
  try {
    const st = fs.statSync(fil);
    const n = Math.min(st.size, 512 * 1024);
    const fd = fs.openSync(fil, 'r');
    const b = Buffer.alloc(n);
    fs.readSync(fd, b, 0, n, st.size - n);
    fs.closeSync(fd);
    return b.toString('utf8').split('\n').slice(-rader).join('\n');
  } catch (err) {
    return `(${err.code === 'ENOENT' ? 'finns inte' : err.message})`;
  }
}

function kommando(cmd, args, filter = null, rader = 40) {
  try {
    const ut = execFileSync(cmd, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const l = ut.split('\n').filter((x) => (filter ? filter.test(x) : x.trim()));
    return l.slice(-rader).join('\n');
  } catch (err) {
    return `(${err.message.slice(0, 200)})`;
  }
}

export function kryptera(text, oppenPem) {
  const nyckel = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', nyckel, iv);
  const data = Buffer.concat([c.update(zlib.gzipSync(Buffer.from(text, 'utf8'))), c.final()]);
  const k = crypto.publicEncrypt({ key: oppenPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, nyckel);
  return { v: 1, k: k.toString('base64'), iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}

export function dekryptera(paket, hemligPem) {
  const nyckel = crypto.privateDecrypt({ key: hemligPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(paket.k, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', nyckel, Buffer.from(paket.iv, 'base64'));
  d.setAuthTag(Buffer.from(paket.tag, 'base64'));
  return zlib.gunzipSync(Buffer.concat([d.update(Buffer.from(paket.data, 'base64')), d.final()])).toString('utf8');
}

// Det som skickas: loggarnas slut, jobbens tillstånd och när datorn har sovit.
function sammanstall({ loggmapp, tillstand }) {
  const delar = [
    ['poddar.log (poddjobbet)', slutet(path.join(loggmapp, 'poddar.log'), 700)],
    ['poddar-launchd.log (poddjobbets oväntade utskrifter)', slutet(path.join(loggmapp, 'poddar-launchd.log'), 150)],
    ['analyser.log (analysjobbet)', slutet(path.join(loggmapp, 'analyser.log'), 400)],
    ['launchd.log (analysjobbets oväntade utskrifter)', slutet(path.join(loggmapp, 'launchd.log'), 150)],
    ['Tidning/tider.json', slutet(path.join(tillstand, 'Tidning', 'tider.json'), 20)],
    ['poddar-knuff.json', slutet(path.join(tillstand, 'poddar-knuff.json'), 20)],
    ['forsok.json', slutet(path.join(tillstand, 'forsok.json'), 60)],
    ['uptime', kommando('uptime', [])],
    ['pmset -g (energiinställningarna)', kommando('pmset', ['-g'], null, 60)],
    ['pmset -g log (sömn och uppvaknanden)', kommando('pmset', ['-g', 'log'], /\b(Sleep|Wake|DarkWake|Shutdown|Restart)\b/, 60)],
  ];
  return delar.map(([rubrik, text]) => `===== ${rubrik}\n${text}`).join('\n\n');
}

// Skickar loggarna om det är dags. Kastar aldrig: loggarna är inte värda ett stopp. → en rad till loggen eller null
export function skickaLoggarna({ root, tillstand, loggmapp, now = Date.now() }) {
  try {
    const oppen = path.join(root, OPPEN);
    if (process.platform !== 'darwin' || !fs.existsSync(oppen)) return null;
    const STATUS = path.join(tillstand, 'loggar-skickade.json');
    let status = {};
    try { status = JSON.parse(fs.readFileSync(STATUS, 'utf8')); } catch { /* första gången */ }
    if (status.at && now - Date.parse(status.at) < MINUTER * 60000) return null;
    const text = sammanstall({ loggmapp, tillstand });
    // (uptime och pmset ändras alltid; bara loggarna avgör om det är nytt)
    const summa = crypto.createHash('sha256').update(text.split('===== uptime')[0]).digest('hex');
    if (summa === status.summa) return null;
    const paket = JSON.stringify(kryptera(`skickat ${new Date(now).toISOString()} från ${os.hostname()}\n\n${text}`, fs.readFileSync(oppen, 'utf8')));
    const git = (args, input) => execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: 120000, input, stdio: [input == null ? 'ignore' : 'pipe', 'pipe', 'pipe'] }).trim();
    const blob = git(['hash-object', '-w', '--stdin'], paket);
    const tree = git(['mktree'], `100644 blob ${blob}\t${FIL}\n`);
    const commit = git(['commit-tree', tree, '-m', 'iMacens loggar (krypterade, läses med scripts/analyser/imac-loggen.mjs)']);
    git(['push', '-q', '-f', 'origin', `${commit}:refs/heads/${GREN}`]);
    fs.writeFileSync(STATUS, JSON.stringify({ at: new Date(now).toISOString(), summa }));
    return `loggarna skickade till grenen ${GREN}`;
  } catch (err) {
    return `loggarna gick inte att skicka: ${String(err.stderr || err.message).trim().slice(0, 200)}`;
  }
}
