# Den hemliga tidningen – överlämning (2026-11-09)

Arbetet flyttades från den bärbara datorn till iMacen mitt i bygget av en testtidning.
Grenen `hemliga-tidningen` har mallen, exempeldata, en färdig anteckning och den här texten.
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
  Önsketänkande*. Kör `node scripts/tidning/tidning.mjs scripts/tidning/exempel.json ut.html`.
  Skärmbild: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new
  --hide-scrollbars --allow-file-access-from-files --window-size=1000,1400 --screenshot=ut.png file://$PWD/ut.html`.
  JSON-formatet: se exempel.json. `s` är `b` (bekräftat), `h` (hört i korridoren) eller
  `o` (önsketänkande), `t` är texten och `k` är källan.
- `scripts/tidning/anteckningar/leicester-bradford.md`: färdiga anteckningar. Matchen är
  dock **uppskjuten** (ESPN: STATUS_POSTPONED), så den blir bara en notis i testnumret.
- Utskriften är provad: whisper.cpp med `ggml-large-v3-turbo-q5_0` tar ungefär 5 minuter per
  timme ljud på en M5 när den kör ensam. Tre samtidiga utskrifter gick mycket långsammare.

## Kvar, i ordning

1. Installera utskriften på iMacen: `brew install whisper-cpp`, och modellen (574 MB):
   `curl -L -o ggml-large-v3-turbo-q5_0.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin`.
   Lägg modellen utanför repot.
2. Hämta om avsnitten nedan (iTunes Search API → `feedUrl` → avsnittet efter titel),
   konvertera de första 45 minuterna (`ffmpeg -i in.mp3 -t 2700 -ar 16000 -ac 1 ut.wav`)
   och skriv ut (`whisper-cli -m <modell> -f ut.wav -l en -otxt -of <namn>`). Kör **en i
   taget**. Utskrifterna får **inte** läggas i repot, eftersom det är publikt och ljudet är
   andras.
3. Skriv anteckningar per lag i samma form som leicester-bradford.md: 3–7 punkter per lag
   med stämpel och källa (podd, avsnitt, datum, ungefärlig minut), högst ett kort citat per
   lag och inget påhittat. Lägg till motståndarens röst, ITK, U21 och oro i klubben från
   webben.
4. Fyll en JSON med Sheffield Wednesday–Plymouth, Stockport–Reading och notisen om
   Leicester–Bradford. Kör mallen, ta en skärmbild och visa användaren. Har fler matcher
   hunnit skjutas upp, eller har kupongen lagts, får användaren välja om matcherna ska bytas.
5. Fortsätt frågorna (listan ovan), en i taget, och skriv sedan prompten för det riktiga bygget.

## Avsnitt att hämta om

| Lag | Podd | Avsnitt | Längd |
|---|---|---|---|
| Sheffield Wednesday | Talking Wednesday | nr 278 (efter tränarbytet) | 63 min |
| Sheffield Wednesday | The Wednesday Week | Hello From the Other Side 26/27 – Accrington Stanley (a) | 25 min (inte utskrivet) |
| Plymouth Argyle | Green & White (Argyle Life, i talkSPORT:s fannätverk) | Evans Above The Church: Plymouth Argyle 4-0 Alvechurch | 86 min |
| Stockport County | SK3 TV | #118: Cray Wanderers, Grammar School Scarves and Good Tinfoil | 69 min (avbrutet, inte utskrivet) |
| Reading | Tilehurst End-podden | avsnitt 479 (efter 1–1 mot Plymouth, inför Oxford) | 76 min |
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
- Rör aldrig /etc/hosts och gå aldrig runt spärren (BBC, Reddit, YouTube med flera är spärrade
  på den bärbara datorn).
- Användaren är inte van vid terminalen. Skriv på enkel svenska utan engelska ord och gör
  stegen själv.
