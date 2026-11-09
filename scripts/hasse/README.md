# Hasse Backes bilder

Åtta filer i `public/rum/` byggs härifrån. De behöver bara göras om när utseendet ska ändras.

- `hasse-hand.bin`: handmodellen, både till figuren och till handen på pulten i rummet (`public/rum-hasse-hand.js`). `node scripts/hasse/hand.mjs`
- `hasse-atlas.webp`: fotot utan armar, kavajärmen uträtad och huden. `node scripts/hasse/baka.mjs atlas`, sedan `cwebp -q 84 -alpha_q 90 -m 6 atlas.png -o public/rum/hasse-atlas.webp`
- `hasse-bak.webp`: väggen bakom honom, samma slitna affär som gänget sitter i (furupanelen med paketen på en hylla, skylten och bardisken med tidningsbunten, kaffebryggaren och kassan), spårad med riktigt ljus i webbläsarens grafikkort från figurens kamera, framför honom vid pultens hörn och med skärpedjup (`public/rum-hasse-scen.js`). `node scripts/hasse/baka.mjs bak 400`, sedan `cwebp -q 88 -m 6 -sharp_yuv bak.png -o public/rum/hasse-bak.webp`. Med `bak-hog` blir det `bak-hog.png` och `hasse-bak-hog.webp` till telefonen på höjden. Med `bak-lys` och `bak-lys-hog` blir det samma vägg med lysröret i affärens tak tänt (`hasse-bak-lys.webp`, `hasse-bak-lys-hog.webp`), som sidan visar från sex på morgonen till midnatt; ljusen står sist i `LJ` i `bak.html` (`?lys=1`). Med `bak-dag` och `bak-dag-hog` blir det bara dagsljuset genom affärens stora fönster till höger, i vitt och utan affärens andra ljus (`hasse-bak-dag.webp`, `hasse-bak-dag-hog.webp`, `?dag=1`); sidan lägger det på väggen i fönstrets färg och styrka efter klockan och vädret (`vagg` i `public/rum-hasse.js`), så ljuset ska stå i samma riktning som `FONSTER` i `public/rum-hasse-arm.js`. Det bakades om 2026-11-08 med grafikkort, 400 varv, när väggen blev rummets: furan (`furu`) ska ha samma färg som i `furu()` i `public/rum.js`, bardisken (`barTra`) som `bardisk` i `public/rum-inredning.js`, och bakom matchlistan till vänster ska det vara lugnt. Bildernas mått och var kamerans axel träffar dem står i `BAK` i `rum-hasse-scen.js`; sidan lägger bilden efter dem, så de ska ändras tillsammans. Ett varv tar ungefär en tiondels sekund med grafikkort (11 s med mjukvarugrafik).

Ändras kameran, baren, pulten eller var han sitter vid den (`DISK`, `HORN`, `PLATS`) i `rum-hasse-scen.js` ska väggen bakas om. Pulten framför honom bakas inte: sidan ritar den en gång i hans värld (`diskBild` i `public/rum-hasse-3d.js`), med väggens bild svagt speglad i träet. I bakningen finns den och han själv bara som något som skuggar och kastar ljus.

Alla sex väggbilderna bakades om 2026-11-08 när kameran flyttades upp (`HOJD` 750, `LUT` 14), med mjukvarugrafik i Chromium (`CHROME=…`, se nedan): 160 varv för de breda och 240 för telefonen på höjden, i stället för 400. De har något mer brus än förut; med grafikkort på Macen går det att baka om dem med 400 varv som ovan. När han flyttade ut mot pultens hörn 2026-11-09 (`PLATS`) bakades alla sex om på samma sätt; pulten skuggar väggen lite annorlunda, mest i telefonens bilder på höjden.

Pultens bilder i rummet (`public/rum/pult.webp`, `pult-mer.webp` och framkanten `pult-kant.webp`) är samma pult som framför honom, med samma trä och form (`public/rum-pult.js`), och bakas med `node scripts/rum/pult.mjs`. Ändras träet, formen eller rummets kamera (`RUM`) där ska de bakas om.

`cdp.mjs` startar Google Chrome på Macen. Med `CHROME=<sökväg>` startar den en annan Chrome eller Chromium, med mjukvarugrafik (SwiftShader), till exempel på Linux.

- `public/profeterna/kropp-hasse.png` och `hasse.jpg`: kroppen till pallen och kröningen i Olympen (320 × 420 som de andras) och porträttet. `kropp.html` ritar dem ur `hasse-atlas.webp` (uppackad till `atlas.png` i samma mapp, `dwebp`): fotot, ärmen som saknas, byxor och skor. Hämta duken med `toDataURL` i headless Chrome, skalad till halva storleken.

`atlas.html` läser `c2013.png` i samma mapp: *Hasse Backe 2013-03-26 001.jpg* (C More Entertainment, CC BY 3.0, Wikimedia Commons) i 1280 bildpunkters bredd, urklippt med `klipp.swift`. Den ligger inte i repot.

Provservern ska servera `public/` i roten och den här mappen under `/skiss/bake/` (bak.html läser `/rum-hasse-scen.js`).
