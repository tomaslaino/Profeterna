// Bakar Hasse Backes bilder: node scripts/hasse/baka.mjs atlas | bak | bak-hog | bak-lys | bak-lys-hog | bak-dag | bak-dag-hog [varv]
// (eller mjuka in.png ut.png: bara filtret mot kornet, mjuka nedan)
// bak ger väggen bakom honom i baren (bak.png, eller bak-hog.png för telefonen på höjden), från figurens kamera
// och i måtten i BAK (public/rum-hasse-scen.js); bak-lys samma vägg med lysröret i affären tänt (bak-lys.png),
// bak-dag bara dagsljuset genom affärens fönster, i vitt (bak-dag.png).
// Med RUTA=x0,y0,x1,y1 bakas bara den rutan (resten genomskinligt): lägg in den i den färdiga bilden med lappa.py.
// Kräver Google Chrome och en filserver på PORT (standard 8765) med public/ i roten och scripts/hasse/ under
// /skiss/bake/, och cwebp för att göra webp av resultatet. Se scripts/hasse/README.md.
import fs from 'node:fs';
import { oppna } from './cdp.mjs';
const vad = process.argv[2] || 'atlas';
const n = +(process.argv[3] || 400);
const ut = process.env.UT || '.';
const lage = vad.endsWith('-hog') ? 'hog' : 'bred';
const lys = (vad.startsWith('bak-lys') ? '&lys=1' : vad.startsWith('bak-dag') ? '&dag=1' : '') + (process.env.RUTA ? `&ruta=${process.env.RUTA}` : '');
async function kor(varv) {
  const c = await oppna({ W: 1000, H: 700, D: 1, tid: 14400000 });
  await c.ga(`/skiss/bake/bak.html?lage=${lage}&n=${varv}${lys}`);
  if (!await c.vantaPa('document.documentElement.dataset.klar==="1"', 200000)) console.log('inte klar', c.fel);
  await c.ev('window.__steg()');
  const url = await c.ev('window.__visa()');
  const tappad = await c.ev('window.__tappad()');
  c.stang();
  // (grafikkortet kan tappa bort duken när skuggaren översätts första gången: då en gång till)
  if (tappad || url.length < (process.env.RUTA ? 20000 : 200000)) { console.log('om igen', tappad, url.length); return kor(varv); }
  return url;
}
// Kornet: väggen är ändå oskarp, så en liten oskärpa (blur, bildpunkter) och sedan ett kantbevarande filter
// jämnar ut det som är kvar av slumpen i träet och karmarna, så att ytorna blir lika rena som i rummet, utan
// att kanterna (karmarna mot glaset, flaskorna, disken) blir suddiga. Färgerna vägs med alfa, och skillnaden i
// alfa räknas som en kant, så att fönstrens hål står kvar.
async function mjuka(url, blur = 0) {
  const c = await oppna({ W: 400, H: 300, D: 1, tid: 300000 });
  const ut = await c.ev(`(async () => {
    const i = new Image(); i.src = ${JSON.stringify(url)}; await i.decode();
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d');
    if (${blur}) x.filter = 'blur(${blur}px)';
    x.drawImage(i, 0, 0);
    x.filter = 'none';
    const W = c.width, H = c.height, d = x.getImageData(0, 0, W, H), s = d.data, u = new Uint8ClampedArray(s.length);
    const R = 3, rum = 2 * 2 * 2, ton = 2 * 3 * 11 * 11;
    const lut = new Float32Array(4 * 256 * 256);
    for (let k = 0; k < lut.length; k++) lut[k] = Math.exp(-k / ton);
    const ner = new Float32Array((2 * R + 1) ** 2);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) ner[(dy + R) * (2 * R + 1) + dx + R] = Math.exp(-(dx * dx + dy * dy) / rum);
    for (let y = 0; y < H; y++) for (let x0 = 0; x0 < W; x0++) {
      const o = (y * W + x0) * 4;
      let sw = 0, sa = 0, sr = 0, sg = 0, sb = 0;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -R; dx <= R; dx++) {
          const xx = x0 + dx; if (xx < 0 || xx >= W) continue;
          const p = (yy * W + xx) * 4;
          const e0 = s[p] - s[o], e1 = s[p + 1] - s[o + 1], e2 = s[p + 2] - s[o + 2], e3 = s[p + 3] - s[o + 3];
          const w = ner[(dy + R) * (2 * R + 1) + dx + R] * lut[Math.min(lut.length - 1, e0 * e0 + e1 * e1 + e2 * e2 + 4 * e3 * e3)];
          const a = w * s[p + 3];
          sw += w; sa += a; sr += a * s[p]; sg += a * s[p + 1]; sb += a * s[p + 2];
        }
      }
      u[o + 3] = sa / sw;
      if (sa > 0) { u[o] = sr / sa; u[o + 1] = sg / sa; u[o + 2] = sb / sa; }
    }
    x.putImageData(new ImageData(u, W, H), 0, 0);
    return c.toDataURL('image/png');
  })()`);
  c.stang();
  return ut;
}
// node scripts/hasse/baka.mjs mjuka in.png ut.png: bara filtret, på en bild som redan är bakad
if (vad === 'mjuka') {
  const [, , , fran, till] = process.argv;
  const url = `data:image/png;base64,${fs.readFileSync(fran).toString('base64')}`;
  fs.writeFileSync(till, Buffer.from((await mjuka(url)).split(',')[1], 'base64'));
  console.log('klart', till);
  process.exit(0);
}
if (vad === 'atlas') {
  const c = await oppna({ W: 1000, H: 700, D: 1, tid: 590000 });
  await c.ga('/skiss/bake/atlas.html');
  if (!await c.vantaPa('document.documentElement.dataset.klar==="1"', 200000)) console.log('inte klar', c.fel);
  fs.writeFileSync(`${ut}/atlas.png`, Buffer.from((await c.ev('__atlas.toDataURL("image/png")')).split(',')[1], 'base64'));
  c.stang();
} else {
  const namn = vad;
  const rum = await kor(n);
  fs.writeFileSync(`${ut}/${namn}.png`, Buffer.from((await mjuka(rum, 1.1)).split(',')[1], 'base64'));
}
console.log('klart', vad);
process.exit(0);
