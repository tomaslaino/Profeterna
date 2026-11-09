# Prov: Hasse läser och blir ertappad

Provverktyg för arbetet med att Hasse ska läsa tidningen på riktigt och se ertappad ut (2026-11-09). Inte till main.

- `prov.mjs`: provserver, repots `public/` först och resten från matchfixarna.se, med `window.__H` utlagt.
- `frys.mjs`: öppnar Hasse, fryser honom och ritar bilder vid valda T (läsningen: `lasa` börjar på T 500, läsandet efter `upp` på 502,7, glimten i `lasa` på 507,1–511,7).
- `variant.mjs`: skriver ett läsläge (LAS, las-bitens pitch, LY) i `public/rum-hasse-3d.js` från HEAD. Tillbaka med `git checkout public/rum-hasse-3d.js`.

Exempel: `node scripts/hasse/ertappad/prov.mjs 8931 &`, sedan `node scripts/hasse/ertappad/variant.mjs '{"pitch":1.0,"blund":0.8,"blickY":8,"brynX":0.1,"brynY":0.1}' 1.0 -193` och `PORT=8931 node scripts/hasse/ertappad/frys.mjs /tmp/bilder G 504`.
