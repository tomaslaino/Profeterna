'use strict';

// Sajtens JavaScript och CSS i mindre form (bygget med --minify, som på GitHub
// Actions): blanksteg och kommentarer bort och korta namn på det som bara syns
// inuti en funktion, med esbuild, fil för fil. Ingen buntning och inget nytt
// filnamn, så att sidorna, import() och importmapen pekar på samma filer som
// förut. Namnen högst upp i ett vanligt skript (de som andra filer läser)
// lämnas som de är – esbuild döper bara om dem i moduler (import/export).
//
// Sajten gör samma sak som förut: det är bara färre byte att hämta och tolka
// (2026-11-07: JavaScript 701 → 437 kB och CSS 155 → 103 kB med gzip).
// Går esbuild inte att läsa in, eller en fil inte att tolka, står den filen
// kvar som den är.

const fs = require('fs');
const path = require('path');

// filerna i dir (utan data/, som är bygget självt) → { filer, fore, efter, fel }
function minifySite(dir) {
  let esbuild;
  try {
    esbuild = require('esbuild');
  } catch (err) {
    console.error('[minify] esbuild saknas, sajten byggs utan:', err.message);
    return { filer: 0, fore: 0, efter: 0, fel: ['esbuild saknas'] };
  }
  const ut = { filer: 0, fore: 0, efter: 0, fel: [] };
  const gå = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!(d === dir && e.name === 'data')) gå(p);
        continue;
      }
      const loader = e.name.endsWith('.js') ? 'js' : e.name.endsWith('.css') ? 'css' : null;
      if (!loader) continue;
      const src = fs.readFileSync(p, 'utf8');
      try {
        // charset utf8: å, ä och ö står kvar som tecken (GitHub Pages skickar
        // utf-8); legalComments inline: licenser står kvar
        const { code } = esbuild.transformSync(src, { loader, minify: true, charset: 'utf8', legalComments: 'inline', logLevel: 'silent' });
        fs.writeFileSync(p, code);
        ut.filer++;
        ut.fore += Buffer.byteLength(src);
        ut.efter += Buffer.byteLength(code);
      } catch (err) {
        ut.fel.push(`${path.relative(dir, p)}: ${String(err.message || err).split('\n')[0]}`);
      }
    }
  };
  gå(dir);
  for (const f of ut.fel) console.error('[minify]', f);
  return ut;
}

// Binära filer som GitHub Pages skickar opackade (application/octet-stream):
// samma fil packad med gzip bredvid (fil.gz), som sidan packar upp med
// DecompressionStream och annars hämtar opackad (rum-hasse-arm.js).
// Görs i varje bygge, så att .gz-filen aldrig blir äldre än originalet.
const PACKA = ['rum/hasse-hand.bin'];

function packaBinart(dir) {
  const zlib = require('zlib');
  let fore = 0;
  let efter = 0;
  for (const rel of PACKA) {
    const p = path.join(dir, rel);
    if (!fs.existsSync(p)) continue;
    const buf = fs.readFileSync(p);
    const gz = zlib.gzipSync(buf, { level: 9 });
    fs.writeFileSync(`${p}.gz`, gz);
    fore += buf.length;
    efter += gz.length;
  }
  return { fore, efter };
}

module.exports = { minifySite, packaBinart };
