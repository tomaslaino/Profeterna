# Hasse Backes bilder

Sex filer i `public/rum/` byggs härifrån. De behöver bara göras om när utseendet ska ändras.

- `hasse-hand.bin`: handmodellen. `node scripts/hasse/hand.mjs`
- `hasse-atlas.webp`: fotot utan armar, kavajärmen uträtad och huden. `node scripts/hasse/baka.mjs atlas`, sedan `cwebp -q 84 -alpha_q 90 -m 6 atlas.png -o public/rum/hasse-atlas.webp`
- `hasse-bak.webp` och `hasse-nara.webp`: rummet bakom honom, och det nära med genomskinlighet (pultens ände, barstolen och benen), spårade med riktigt ljus i webbläsarens grafikkort. `node scripts/hasse/baka.mjs bak 800`, sedan `cwebp -q 88 -m 6 -sharp_yuv bak.png -o public/rum/hasse-bak.webp` och `cwebp -q 86 -alpha_q 90 -m 6 -sharp_yuv nara.png -o public/rum/hasse-nara.webp`. Med `bak-hog 800 1 0.8` blir det `bak-hog.png` och `nara-hog.png`, och `hasse-bak-hog.webp` och `hasse-nara-hog.webp` på samma sätt, med `-resize 780 0` respektive `-resize 1105 0` (telefonens grafikminne). Ett varv tar ungefär en kvarts sekund.

`atlas.html` läser `c2013.png` i samma mapp: *Hasse Backe 2013-03-26 001.jpg* (C More Entertainment, CC BY 3.0, Wikimedia Commons) i 1280 bildpunkters bredd, urklippt med `klipp.swift`. Den ligger inte i repot.

Provservern ska servera den här mappen under `/skiss/bake/`.
