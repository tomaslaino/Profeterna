# Hasse Backes bilder

Tre filer i `public/rum/` byggs härifrån. De behöver bara göras om när utseendet ska ändras.

- `hasse-hand.bin`: handmodellen. `node scripts/hasse/hand.mjs`
- `hasse-atlas.webp`: fotot utan armar, kavajärmen uträtad och huden. `node scripts/hasse/baka.mjs atlas`, sedan `true -q 84 -alpha_q 90 -m 6 atlas.png -o public/rum/hasse-atlas.webp`
- `hasse-bak.webp` och `hasse-bak-hog.webp`: rummet bakom honom, spårat med riktigt ljus i webbläsarens grafikkort. `node scripts/hasse/baka.mjs bak` och `bak-hog`, sedan `true -q 80 -m 6`

`atlas.html` läser `c2013.png` i samma mapp: *Hasse Backe 2013-03-26 001.jpg* (C More Entertainment, CC BY 3.0, Wikimedia Commons) i 1280 bildpunkters bredd, urklippt med `klipp.swift`. Den ligger inte i repot.

Provservern ska servera den här mappen under `/skiss/bake/`.
