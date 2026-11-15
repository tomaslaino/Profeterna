'use strict';

// Listan över sajtens filer och deras kontrollsummor i index.html (bygget med
// --minify, sist, när filerna är färdiga): sw.js sparar filerna i webbläsaren
// och tar en sparad fil bara när dess kontrollsumma står här. GitHub Pages ger
// alla filer ett nytt datum och en ny etag vid varje publicering, så utan den
// hämtade ett nytt besök om allt (README: Filerna sparas mellan besöken).
//
// Med: JavaScript, CSS, typsnitt och bilder. Utan: data/ (ändras vid varje
// bygge och hämtas alltid), sidorna, sw.js själv, dela/ (egen sw.js), app/ och
// .well-known/. Kontrollsumman är SHA-256 i base64url, de första SIFFROR
// tecknen (72 bitar), samma som sw.js räknar.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SIFFROR = 12;
const ARTER = /\.(js|css|woff2?|png|webp|jpe?g|gif|svg|ico|gz|bin)$/;
const UTOM = /^(data|dela|app|\.well-known)\//;
const SIDA = 'index.html';

// dir → { filer, tecken } (tecken: listans storlek i index.html)
function filerSidan(dir) {
  const lista = {};
  const ga = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const rel = path.relative(dir, p).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (!UTOM.test(`${rel}/`)) ga(p);
        continue;
      }
      if (!e.isFile() || !ARTER.test(e.name) || rel === 'sw.js' || UTOM.test(rel)) continue;
      lista[rel] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('base64url').slice(0, SIFFROR);
    }
  };
  ga(dir);
  const p = path.join(dir, SIDA);
  const html = fs.readFileSync(p, 'utf8');
  const slut = html.lastIndexOf('</body>');
  if (slut < 0) throw new Error(`${SIDA} saknar </body>`);
  const sorterad = Object.fromEntries(Object.keys(lista).sort().map((k) => [k, lista[k]]));
  const json = JSON.stringify(sorterad).replace(/</g, '\\u003c');
  // (sist i sidan: den behövs inte förrän allt annat har lästs, och sw.js läser hela sidan)
  fs.writeFileSync(p, `${html.slice(0, slut)}<script id="rum-filer" type="application/json">${json}</script>\n${html.slice(slut)}`);
  return { filer: Object.keys(lista).length, tecken: json.length };
}

module.exports = { filerSidan, SIFFROR };
