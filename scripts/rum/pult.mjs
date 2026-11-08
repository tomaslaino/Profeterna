// node scripts/rum/pult.mjs: bakar pultens trä ur pult.html till public/rum/pult.webp (scenens y 650–1000,
// alla) och pult-mer.webp (y 1000–1340, bara telefonen på höjden, där rummet står längre bort).
import fs from 'node:fs'; import path from 'node:path';
import { oppna, HERE } from '../hasse/cdp.mjs';
const u = await oppna({ W: 1700, H: 800 });
await u.send('Page.navigate', { url: `file://${path.join(path.dirname(new URL(import.meta.url).pathname), 'pult.html')}` });
for (let i = 0; i < 100 && !(await u.ev('window.klar === true')); i++) await u.sov(100);
const ut = path.join(HERE, '../../public/rum');
const spara = async (fil, y, h, q) => {
  const url = await u.ev(`window.dela(${y}, ${h}, ${q})`);
  const b = Buffer.from(url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(ut, fil), b);
  console.log(fil, b.length);
};
await spara('pult.webp', 0, 350, 0.62);
await spara('pult-mer.webp', 350, 340, 0.5);
u.stang();
