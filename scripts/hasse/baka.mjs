// Bakar Hasse Backes bilder: node scripts/hasse/baka.mjs atlas | bak | bak-hog [varv]
// bak ger väggen bakom honom i baren (bak.png, eller bak-hog.png för telefonen på höjden), från figurens kamera
// och i måtten i BAK (public/rum-hasse-scen.js).
// Kräver Google Chrome och en filserver på PORT (standard 8765) med public/ i roten och scripts/hasse/ under
// /skiss/bake/, och cwebp för att göra webp av resultatet. Se scripts/hasse/README.md.
import fs from 'node:fs';
import { oppna } from './cdp.mjs';
const vad = process.argv[2] || 'atlas';
const n = +(process.argv[3] || 400);
const ut = process.env.UT || '.';
const lage = vad === 'bak-hog' ? 'hog' : 'bred';
async function kor(varv) {
  const c = await oppna({ W: 1000, H: 700, D: 1, tid: 14400000 });
  await c.ga(`/skiss/bake/bak.html?lage=${lage}&n=${varv}`);
  if (!await c.vantaPa('document.documentElement.dataset.klar==="1"', 200000)) console.log('inte klar', c.fel);
  await c.ev('window.__steg()');
  const url = await c.ev('window.__visa()');
  const tappad = await c.ev('window.__tappad()');
  c.stang();
  // (grafikkortet kan tappa bort duken när skuggaren översätts första gången: då en gång till)
  if (tappad || url.length < 200000) { console.log('om igen', tappad, url.length); return kor(varv); }
  return url;
}
if (vad === 'atlas') {
  const c = await oppna({ W: 1000, H: 700, D: 1, tid: 590000 });
  await c.ga('/skiss/bake/atlas.html');
  if (!await c.vantaPa('document.documentElement.dataset.klar==="1"', 200000)) console.log('inte klar', c.fel);
  fs.writeFileSync(`${ut}/atlas.png`, Buffer.from((await c.ev('__atlas.toDataURL("image/png")')).split(',')[1], 'base64'));
  c.stang();
} else {
  const namn = vad === 'bak-hog' ? 'bak-hog' : 'bak';
  const rum = await kor(n);
  const c = await oppna({ W: 400, H: 300, D: 1, tid: 120000 });
  // väggen är ändå oskarp: en liten oskärpa tar bort kornet, som annars blir fläckar i webp
  const mjuk = await c.ev(`(async () => {
    const i = new Image(); i.src = ${JSON.stringify(rum)}; await i.decode();
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d');
    x.filter = 'blur(1.1px)'; x.drawImage(i, 0, 0); return c.toDataURL('image/png');
  })()`);
  fs.writeFileSync(`${ut}/${namn}.png`, Buffer.from(mjuk.split(',')[1], 'base64'));
  c.stang();
}
console.log('klart', vad);
process.exit(0);
