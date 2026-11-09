# Överlämning: Hasse läser tidningen och blir ertappad

Gren `claude/hasse-ertappad` (utgår från main d52ecc4). Bara provverktygen i den här mappen ligger på grenen; mappen ska inte till main. Inget på sajten är ändrat än.

## Vad användaren vill (2026-11-09)

1. "Jag vill också att han ska läsa tidningen (just nu tittar han in i kameran) och verka ertappad när man ser honom."
2. Andra sysslor än tidningen när det gått dåligt: användaren bad om "olika förslag" och fick tretton. Inget är valt – fråga vilka, och skissa dem gärna i rummet innan något byggs (bilder i chatten).
   - Med det som redan ligger framför honom: cigarren har slocknat och han tänder den igen, rökringar, rör länge i kaffet, granskar notan, vänder sin kupong upp och ned.
   - Något nytt på pulten: autografer på kort med eget porträtt (ingen har bett om dem), 90-talsmobil vid örat med fingret upp mot en, taktik på en servett, korsordet, putsar läsglasögonen, armbandsuret mot örat, skraplott, diktafon.

## Vad som är funnet

- Han ser in i kameran eftersom biten `las` i `LASBIT` (`public/rum-hasse-3d.js`) skriver över `LAS.pitch` 0,8 med 0,5 (`0.17 * pitch` rad, alltså cirka 5°). Också `glimt`, `gom`, `nick`, `ryck` och `titta` har 0,5 och `blund` 0,38 som läsläge.
- Lägre lock (`blund` 0,8–0,96) eller mer lutning hjälper inte: ansiktet är ett foto, och det blir en smal, misstänksam springa som ser på en.
- Det som fungerade: tidningen högre, `LY` −193 eller −153 i stället för −283, med `pitch` ≈ 1,0, `blund` 0,8 och brynen +0,1. Då döljer tidningen munnen och han kikar över kanten.

## Kvar, i ordning

1. Välj `LY` (bilder på −193 och −153 bredvid varandra). Höjs den: `gom` lyfter till `LY + 170`, sänk till ungefär `LY + 60`, och låt bitarnas pitch/blund utgå från `LAS` i stället för 0,5/0,38.
2. Den ertappade blicken: en ny bit som börjar och slutar i `LAS`. Han läser ~1 s, ögonen går snabbt upp till en (`blickY` → −1, `blund` → 0), brynen upp, inget leende, han fryser ~1 s och tidningen rycker till; sedan en liten skyldig men självsäker nick och tillbaka bakom tidningen. Leendet `NOJD` ligger alltid kvar i `rita()` (`U.le`), så en ny nyckel (t.ex. `stel`) behövs som tar bort det: `NOJD * (1 - allvar) * (1 - d('stel'))`. Låt `lasNu()` i `public/rum-hasse.js` spela ett klipp där den biten kommer först när man kommer fram.
3. Prova, ta bilder och visa användaren; lägg ut på main när det är klart (färdigt arbete läggs ut utan att fråga igen).
4. Bygg de sysslor användaren väljer, i `lasa`-mönstret (bitar som börjar och slutar i vilan, gräns `slag` för avbrott).

## Så provas det

```
node scripts/hasse/ertappad/prov.mjs 8931 &
node scripts/hasse/ertappad/variant.mjs '{"pitch":1.0,"blund":0.8,"blickY":8,"brynX":0.1,"brynY":0.1}' 1.0 -193
PORT=8931 node scripts/hasse/ertappad/frys.mjs /tmp/bilder G 504,508.1
git checkout public/rum-hasse-3d.js
```

- `frys.mjs` öppnar Hasse, fryser honom (`__H.on = false`) och ritar vid varje T: läsningen från 502,7, glimten i `lasa` 507,1–511,7. `D=2` och `KLIPP='{"x":600,"y":40,"width":300,"height":260}'` ger närbild av ansiktet. Bilder bredvid varandra med `ffmpeg … hstack`.
- Sajten räknar just nu Hasses omgång som dålig (4 av 13), så han läser både live och i provservern.
- Rörelser bedöms bäst i en riktig film: ta bilder var 0,2 s utan att frysa.
