// node scripts/rum/pult.mjs: bakar pultens trä ur pult.html (samma trä och samma form som framför Hasse Backe,
// public/rum-pult.js) till public/rum/pult.webp (scenens y 650–1000, alla), pult-mer.webp (y 1000–1340, bara
// telefonen på höjden, där rummet står längre bort) och pult-kant.webp (framkanten, y 940–1010, inte i telefonen
// på höjden). Kräver Google Chrome (scripts/hasse/cdp.mjs; CHROME=… för en annan); sidan serveras härifrån.
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path';
import { oppna, HERE } from '../hasse/cdp.mjs';
const RUM = path.dirname(new URL(import.meta.url).pathname);
const PUB = path.join(HERE, '../../public');
const typ = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = p.startsWith('/skiss/rum/') ? path.join(RUM, p.slice(11)) : path.join(PUB, p);
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': typ[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
});
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const u = await oppna({ W: 1700, H: 800 });
await u.send('Page.navigate', { url: `http://127.0.0.1:${srv.address().port}/skiss/rum/pult.html` });
for (let i = 0; i < 200 && !(await u.ev('window.klar === true')); i++) await u.sov(100);
if (u.fel.length) console.log(u.fel);
const ut = path.join(PUB, 'rum');
const spara = async (fil, uttryck) => {
  const url = await u.ev(uttryck);
  const b = Buffer.from(url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(ut, fil), b);
  console.log(fil, b.length);
};
await spara('pult.webp', 'window.dela(0, 350, 0.86)');
await spara('pult-mer.webp', 'window.dela(350, 340, 0.7)');
await spara('pult-kant.webp', 'window.kant(0.86)');
await spara('pult-hoger.webp', 'window.hoger(0.8)');
u.stang();
srv.close();
