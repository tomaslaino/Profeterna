// Läser iMacens loggar på MacBooken (src/analyser/loggar.mjs): hämtar grenen imac-loggar och låser upp den med
// nyckeln i ~/.config/matchfixarna/imac-loggen.pem.
//
//   node scripts/analyser/imac-loggen.mjs            hela texten
//   node scripts/analyser/imac-loggen.mjs --ny-nyckel  skapar nyckelparet (den öppna halvan i config/, som ska committas)

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GREN, FIL, OPPEN, NYCKEL, dekryptera } from '../../src/analyser/loggar.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

if (process.argv.includes('--ny-nyckel')) {
  if (fs.existsSync(NYCKEL)) { console.error(`Nyckeln finns redan: ${NYCKEL}`); process.exit(1); }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
  fs.mkdirSync(path.dirname(NYCKEL), { recursive: true });
  fs.writeFileSync(NYCKEL, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  fs.writeFileSync(path.join(ROOT, OPPEN), publicKey.export({ type: 'spki', format: 'pem' }));
  console.log(`Nyckeln: ${NYCKEL}\nDen öppna halvan: ${OPPEN}`);
  process.exit(0);
}

execFileSync('git', ['fetch', '-q', 'origin', GREN], { cwd: ROOT, stdio: 'inherit' });
const paket = JSON.parse(execFileSync('git', ['show', `FETCH_HEAD:${FIL}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
process.stdout.write(dekryptera(paket, fs.readFileSync(NYCKEL, 'utf8')) + '\n');
