// Bakar Hasse Backes bilder: node scripts/hasse/baka.mjs atlas | bak | bak-hog [varv] [skala nära] [skala rummet]
// bak ger rummet (bak.png) och det nära med genomskinlighet (nara.png): pulten, barstolen och benen.
// Kräver Google Chrome och en filserver på PORT (standard 8765) med scripts/hasse/ under /skiss/bake/,
// och cwebp för att göra webp av resultatet. Se scripts/hasse/README.md.
import fs from 'node:fs';
import { oppna } from './cdp.mjs';
const vad = process.argv[2] || 'atlas';
const n = +(process.argv[3] || 1600);
// rummet behöver inte vara lika skarpt som det nära
const kNara = +(process.argv[4] || 0.8);
const kRum = +(process.argv[5] || 0.6);
const ut = process.env.UT || '.';
const lage = vad === 'bak-hog' ? 'hog' : 'bred';
async function kor(lag, varv, k = kNara) {
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
  const hel = await kor(1, n);
  const tack = await kor(2, Math.min(n, 64));
  const c = await oppna({ W: 400, H: 300, D: 1, tid: 120000 });
  // rummet är ändå oskarpt: en liten oskärpa tar bort kornet, som annars blir fläckar i webp
  const mjuk = await c.ev(`(async () => {
    const i = new Image(); i.src = ${JSON.stringify(rum)}; await i.decode();
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d');
    x.filter = 'blur(1.1px)'; x.drawImage(i, 0, 0); return c.toDataURL('image/png');
  })()`);
  fs.writeFileSync(`${ut}/${namn}.png`, Buffer.from(mjuk.split(',')[1], 'base64'));
  // det nära: hela bilden, genomskinlig utanför täckningen
  const nara = await c.ev(`(async () => {
    const las = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
    const a = await las(${JSON.stringify(hel)}), b = await las(${JSON.stringify(tack)});
    const c = document.createElement('canvas'); c.width = a.width; c.height = a.height; const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(b, 0, 0); const m = x.getImageData(0, 0, a.width, a.height);
    x.drawImage(a, 0, 0); const f = x.getImageData(0, 0, a.width, a.height);
    for (let i = 0; i < f.data.length; i += 4) f.data[i + 3] = m.data[i];
    x.putImageData(f, 0, 0); return c.toDataURL('image/png');
  })()`);
  fs.writeFileSync(`${ut}/nara${vad === 'bak-hog' ? '-hog' : ''}.png`, Buffer.from(nara.split(',')[1], 'base64'));
  // hela bilden också, för att se resultatet
  fs.writeFileSync(`${ut}/${namn}-hel.png`, Buffer.from(hel.split(',')[1], 'base64'));
  c.stang();
}
console.log('klart', vad);
process.exit(0);
