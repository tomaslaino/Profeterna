# Hasse Backes bilder

Fyra filer i `public/rum/` byggs härifrån. De behöver bara göras om när utseendet ska ändras.

- `hasse-hand.bin`: handmodellen, både till figuren och till handen på pulten i rummet (`public/rum-hasse-hand.js`). `node scripts/hasse/hand.mjs`
- `hasse-atlas.webp`: fotot utan armar, kavajärmen uträtad och huden. `node scripts/hasse/baka.mjs atlas`, sedan `cwebp -q 84 -alpha_q 90 -m 6 atlas.png -o public/rum/hasse-atlas.webp`
- `hasse-bak.webp`: väggen bakom honom i baren (hyllorna, lamporna, flaskorna och bardisken bakom honom), spårad med riktigt ljus i webbläsarens grafikkort. `node scripts/hasse/baka.mjs bak 800`, sedan `cwebp -q 88 -m 6 -sharp_yuv bak.png -o public/rum/hasse-bak.webp`. Med `bak-hog 800 0.8` blir det `bak-hog.png`, och `hasse-bak-hog.webp` på samma sätt med `-resize 780 0` (telefonens grafikminne). Ett varv tar ungefär en kvarts sekund.

Disken framför honom bakas inte: den är en yta i CSS (`.rh-disk` i `public/rum-hasse.css`). `bak.html` kan fortfarande baka det nära från när han satt på en barstol vid pultens ände (`lag=1` och `2`: pultens ände, stolen och benen), men det används inte längre.

`atlas.html` läser `c2013.png` i samma mapp: *Hasse Backe 2013-03-26 001.jpg* (C More Entertainment, CC BY 3.0, Wikimedia Commons) i 1280 bildpunkters bredd, urklippt med `klipp.swift`. Den ligger inte i repot.

Provservern ska servera den här mappen under `/skiss/bake/`.
