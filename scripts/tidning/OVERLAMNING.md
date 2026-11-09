# Den hemliga tidningen – överlämning (2026-11-09)

Arbetet flyttades från den bärbara datorn till iMacen mitt i bygget av en testtidning.
Grenen `hemliga-tidningen` har mallen, testnumret, anteckningarna och den här texten.
Inget är utlagt på main och inget i rummet är ändrat.

## Vad användaren vill

En tidning som ligger någonstans i rummet (tobaksaffären i 3D). Där samlas "hemlig"
information om varje lag på nästa omgångs stryktipskupong från alternativa, initierade
källor, framför allt supporterpoddar och fansradio. Ljudet skrivs ut och det viktigaste
sammanställs. Det verkliga bygget görs senare utifrån en prompt som vi skriver tillsammans.
Testtidningen är till för att se hur det kan bli.

## Beslut i samtalet

- **En fråga i taget.** Användaren vill tänka fram saken tillsammans: lägg fram en idé och
  ställ en enkel fråga om just den. En numrerad lista att välja ur räknas som många frågor.
- **Källor (alla ja):**
  1. Supporterpoddarna är huvudkällan.
  2. Motståndarens röst: fansajternas intervju inför matchen med en supporter till motståndarlaget.
  3. Bilderna från sista träningen: vem som saknas.
  4. "De som vet" (ITK) på forumen, med en stämpel för hur ofta källan har haft rätt.
  5. Reservlaget och U21: vem som är tillbaka och vem som sitter på bänken.
  6. Oro i klubben: lön, köpstopp, poängavdrag, protester.
  7. Pengarna som rör sig, alltså odds som kantrar utan nyhet. Det blir en mening utan
     siffror, trots att det nästan är ett tips.
  8. Ringa-in-programmen efter matchen. Användaren vill "öppna upp" BBC:s lokalradio för
     just detta. Hämtningen görs i molnet (GitHub Actions). Spärren i /etc/hosts rörs aldrig.
     Det är okontrollerat om BBC släpper fram ljudet utanför Storbritannien.
- **Börja smått.** Första versionen har poddarna och textkällorna (2, 4, 5, 6, 7).
  Ringa-in-programmen och träningsbilderna kommer senare.
- **Allt görs i förväg.** Både utskrift och sammanfattning görs varje omgång när avsnitten
  har kommit, oftast torsdag–fredag, inte först när någon öppnar tidningen.
- **Kvar att fråga om (en i taget):** hela presskonferensen som källa, svenska supportrar
  (Svenskafans), kassettband per lag bredvid tidningen (radions kassettdel spelar inget än),
  platsen i rummet, utseende och namn (arbetsnamn *Enligt uppgift*), om Hasse ska få läsa
  tidningen, om den ska vara tipsfri, och kostnaden per omgång.

## Klart

- `scripts/tidning/tidning.mjs` gör en HTML-sida av en JSON-fil i sajtens papper: tryck i
  terrakotta (Fraunces), skrivmaskin och stämplarna *Bekräftat · Hört i korridoren ·
  Önsketänkande*. Kör `node scripts/tidning/tidning.mjs scripts/tidning/nr1.json ut.html`.
  Skärmbild: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new
  --user-data-dir=<tom mapp> --hide-scrollbars --allow-file-access-from-files --window-size=1000,2340
  --screenshot=ut.png file://$PWD/ut.html`.
  JSON-formatet: se `nr1.json`. `s` är `b`, `h` eller `o`, `t` är texten och `k` är källan.
  `notiser` (rubrik, t, k) ger en inramad notis under matcherna.
- **Testnumret nr 1 (9 nov):** `nr1.json` med Sheffield Wednesday–Plymouth och Stockport–Reading
  plus en notis om de sex uppskjutna matcherna. Skärmbilden `nr1.png` ligger bara lokalt.
- **Anteckningar:** `anteckningar/wednesday-plymouth.md` och `anteckningar/stockport-reading.md`
  (podd + webb, med källor och ungefärliga minuter), och `leicester-bradford.md` (matchen utgår).
- **Utskriften på iMacen:** whisper.cpp (`brew install whisper-cpp`) och modellen ligger i
  `~/Library/Application Support/Matchfixarna/Tidning/` tillsammans med `skriv-ut2.sh` (läser
  `avsnitt.txt`: namn + ljudadress per rad, hämtar, tar 45 min, skriver ut, tar bort ljudet),
  `perminut.mjs` (srt → ett stycke per minut, `[mm] text`) och `utskrifter/`. 45 minuter ljud tar
  4–9 minuter på iMacen (M1). Utskrifterna ligger bara där, aldrig i repot.

## Lärdomar från testnumret

- **Motståndarens röst finns som podd:** The Wednesday Week gör "Hello From the Other Side" med en
  supporter till nästa motståndare inför varje match (Plymouth-avsnittet väntas ca 12–13 nov).
  Sådana serier bör letas upp för alla lag.
- **Fyra medhjälpare, en per klubb,** letade webbkällor parallellt (8–13 min, 65–95 hämtningar var).
  De hittade mest i lokaltidningar (Plymouth Herald, Reading Chronicle), The72, klubbarnas sajter och
  forumen (Owlstalk, Pasoti). The Star, Yorkshire Post, Manchester Evening News och Hob Nob Anyones
  forum stoppar hämtning; stockportcounty.com och readingfc.co.uk kräver JavaScript.
- **Webbsökningens sammanfattningar ljög igen:** de påstod att Challinor gick från Stockport i
  november, men han gick i juni (McNulty är tränare). Kontrollera alltid datumet på själva sidan.
- **Poddarna börjar med småprat** (Talking Wednesday: 15 min). 45 minuter räcker ibland inte.
- **Pengarna som rör sig** kom inte med: spelbolagen är spärrade. Behöver en öppen oddskälla.

## Kvar

1. Visa testnumret för användaren och fortsätt frågorna (listan ovan), en i taget.
2. Skriv sedan prompten för det riktiga bygget.

## Avsnitten i testnumret

Alla utom de två sista är utskrivna (45 min var). Flöden: Talking Wednesday och Tilehurst End på
podbean, de andra på acast (adresserna via iTunes Search API).

| Lag | Podd | Avsnitt | Längd |
|---|---|---|---|
| Sheffield Wednesday | Talking Wednesday | nr 278 (efter tränarbytet) | 63 min |
| Sheffield Wednesday | The Wednesday Week | Hello From the Other Side 26/27 – Accrington Stanley (a) | 25 min (handlar om Accrington, inte med i numret) |
| Plymouth Argyle | Green & White (Argyle Life, i talkSPORT:s fannätverk) | Evans Above The Church: Plymouth Argyle 4-0 Alvechurch | 85 min |
| Stockport County | SK3 TV | #118: Cray Wanderers, Grammar School Scarves and Good Tinfoil | 69 min |
| Reading | Tilehurst End-podden | avsnitt 479 "Proboscis" (efter 0–0 mot Plymouth, före 0–2 mot Oxford) | 76 min |
| Leicester City | The Leicester City Pubcast | We can beat one Oxford then! (8 nov) | 60 min (redan sammanfattat) |
| Bradford City | Chickens On The Loose | Bradford vs Huddersfield | 57 min (behövs inte om matchen utgår) |

## Fällor

- `data/matches.json` på matchfixarna.se visade Leicester–Bradford som planerad fast ESPN hade
  den som uppskjuten. Sex av tolv League One-matcher 14/11 är uppskjutna på grund av
  landslagsuttagningar. Kontrollera med
  `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.3/scoreboard?dates=20261114`.
- Foxes Talk och Yorkshire Posts artiklar gav 403. Webbsökningens sammanfattningar blandade
  ihop säsonger, så räkna allt därifrån som obekräftat.
- Medhjälpare som kör whisper i bakgrunden lämnar kvar processer när de stoppas. Kontrollera
  med `pgrep -x whisper-cli`.
- I en `while read`-slinga läser ffmpeg och whisper-cli upp resten av listan från stdin. Kör
  `ffmpeg -nostdin` och `whisper-cli … < /dev/null` (så gör `skriv-ut2.sh`).
- Rör aldrig /etc/hosts och gå aldrig runt spärren (BBC, Reddit, YouTube med flera är spärrade
  på den bärbara datorn).
- Användaren är inte van vid terminalen. Skriv på enkel svenska utan engelska ord och gör
  stegen själv.
