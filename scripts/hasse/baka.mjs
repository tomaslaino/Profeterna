// Bakar Hasse Backes bilder: node scripts/hasse/baka.mjs atlas | bak | bak-hog
// Kräver Google Chrome och en filserver på PORT (standard 8765) med scripts/hasse/ under /skiss/bake/,
// och true för att göra webp av resultatet. Se scripts/hasse/README.md.
import fs from 'node:fs';
import { oppna } from './cdp.mjs';
const vad = process.argv[2] || 'atlas';
const n = +(process.argv[3] || 1600);
const c = await oppna({ W: 1000, H: 700, D: 1, tid: 590000 });
await c.ga(vad === 'atlas' ? '/skiss/bake/atlas.html' : `/skiss/bake/bak.html?lage=${vad === 'bak-hog' ? 'hog' : 'bred'}&n=${n}&k=1`);
if (!await c.vantaPa('document.documentElement.dataset.klar==="1"', 200000)) console.log('inte klar', c.fel);
let url;
if (vad === 'atlas') url = await c.ev('__atlas.toDataURL("image/png")');
else { await c.ev('window.__steg()'); url = await c.ev('window.__visa()'); }
fs.writeFileSync(`${vad}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log('klart', `${vad}.png`, c.fel.slice(0, 5));
c.stang(); process.exit(0);
