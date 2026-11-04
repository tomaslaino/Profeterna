// Bakar Hasse Backes bilder: node scripts/hasse/baka.mjs atlas | bak | bak-hog [varv] [skala rummet]
// bak ger väggen bakom honom i baren (bak.png). (bak.html kan också baka det nära, pultens ände,
// barstolen och benen, från när han satt på en stol vid pulten; det används inte längre.)
// Kräver Google Chrome och en filserver på PORT (standard 8765) med scripts/hasse/ under /skiss/bake/,
// och cwebp för att göra webp av resultatet. Se scripts/hasse/README.md.
import fs from 'node:fs';
import { oppna } from './cdp.mjs';
const vad = process.argv[2] || 'atlas';
const n = +(process.argv[3] || 1600);
// väggen är ändå oskarp bakom honom
const kRum = +(process.argv[4] || 0.6);
const ut = process.env.UT || '.';
const lage = vad === 'bak-hog' ? 'hog' : 'bred';
async function kor(lag, varv, k = kRum) {
  const c = await oppna({ W: 1000, H: 700, D: 1, tid: 14400000 });
  await c.ga(`/skiss/bake/bak.html?lage=${lage}&n=${varv}&k=${k}&lag=${lag}`);
  if (!await c.vantaPa('document.documentElement.dataset.klar==="1"', 200000)) console.log('inte klar', c.fel);
  await c.ev('window.__steg()');
  const url = await c.ev('window.__visa()');
  const tappad = await c.ev('window.__tappad()');
  c.stang();
  // (grafikkortet kan tappa bort duken när skuggaren översätts första gången: då en gång till)
  if (tappad || (lag < 2 && url.length < 200000)) { console.log('om igen', lag, tappad, url.length); return kor(lag, varv, k); }
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
  const rum = await kor(0, n, kRum);
  const c = await oppna({ W: 400, H: 300, D: 1, tid: 120000 });
  // rummet är ändå oskarpt: en liten oskärpa tar bort kornet, som annars blir fläckar i webp
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
