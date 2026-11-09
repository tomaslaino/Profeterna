// Skriver ett läsläge i public/rum-hasse-3d.js (utgår från HEAD): LAS, las-bitens pitch och LY.
// node scripts/hasse/ertappad/variant.mjs '{"pitch":1.0,"blund":0.8,"blickY":8,"brynX":0.1,"brynY":0.1}' 1.0 -193
// Tillbaka: git checkout public/rum-hasse-3d.js
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
let src = execSync('git show HEAD:public/rum-hasse-3d.js', { cwd: REPO, maxBuffer: 1 << 26 }).toString();
const o = JSON.parse(process.argv[2]); const p = +process.argv[3];
const LAS = { pitch: 0.8, yaw: -0.1, lut: 0.03, axV: 10, axH: 10, brynX: -0.12, brynY: -0.08, blund: 0.52, blickY: 8, kis: 0.06, ...o };
src = src.replace(/^const LAS = \{[^\n]*\};$/m, 'const LAS = ' + JSON.stringify(LAS).replace(/"/g, '') + ';');
src = src.replace('pitch: [[0.3, 0.5], [1.6, 0.54], [2.9, 0.58], [4.0, 0.53]]', `pitch: [[0.3, ${p}], [1.6, ${p + 0.04}], [2.9, ${p + 0.08}], [4.0, ${p + 0.03}]]`);
if (process.argv[4]) src = src.replace('const LY = -283;', `const LY = ${process.argv[4]};`);
fs.writeFileSync(path.join(REPO, 'public/rum-hasse-3d.js'), src);
