// node scripts/rum/papper.mjs: bakar pappersstrukturen ur papper.html till public/rum/papper.webp.
// Samma struktur ligger under allt papper (papper.css, --pp-grain). Kräver Google Chrome (scripts/hasse/cdp.mjs).
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { oppna, HERE } from '../hasse/cdp.mjs';
const RUM = path.dirname(new URL(import.meta.url).pathname);
const u = await oppna({ W: 700, H: 700 });
await u.send('Page.navigate', { url: pathToFileURL(path.join(RUM, 'papper.html')).href });
for (let i = 0; i < 100 && !(await u.ev('window.klar === true')); i++) await u.sov(100);
const url = await u.ev('window.bild(0.6)');
const b = Buffer.from(url.split(',')[1], 'base64');
fs.writeFileSync(path.join(HERE, '../../public/rum/papper.webp'), b);
console.log('papper.webp', b.length);
u.stang();
