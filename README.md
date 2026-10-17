# Profeterna

Hemsida (profeterna.se) som gör matchprognoser för Premier League, Championship,
League One, League Two, FA-cupen och EFL-cupen – och sedan rättar sina egna
prognoser mot facit. Byggd efter samma principer och arbetssätt som Gräva guld
(`~/Kod/Gräverguld`), utan betalda tjänster. Under utvecklingen körs sidan lokalt.

**Principer:** ingen siffra utan källa och datum · "okänt" är ett giltigt värde ·
ingen falsk precision · sidan kraschar aldrig av en död källa · endast fria källor.

## Status

- [x] **Fas 1 – Datapipeline:** källor verifierade per datatyp och tävling, hämtning med
  eget intervall per källa, cache, källtabell, lagnamnsmappning, matchlista och matchunderlag
- [ ] **Fas 2 – Prognosmotor:** baslinjer (naiv, Poisson/Dixon-Coles, marknad), grundmodell,
  prognos i matchvyn
- [ ] **Fas 3 – Journal + utvärdering:** append-only prognosjournal, Brier/logg-poäng,
  kalibrering, per tävling och regelversion
- [ ] **Fas 4 – Backtest + kandidatjakt:** walk-forward på tidigare säsonger,
  kandidatfaktorer, regelversioner
- [ ] **Fas 5 – LLM-modul (valfri)**

## Publicering

Sidan är statisk och ligger på GitHub Pages under profeterna.se – samma upplägg som
gravergrav.se:

```
GitHub Actions (var 30:e min)  →  källorna  →  src/build.js  →  _site/ (HTML + data/*.json)
                                                                   ↓
                                    GitHub Pages serverar sajten på profeterna.se
```

- Workflowen [.github/workflows/publicera.yml](.github/workflows/publicera.yml) körs på
  minut 7 och 37 varje timme, vid push till `main` och manuellt.
- **Skillnad mot gravergrav.se:** den genererade datan committas inte. Den laddas upp som
  Pages-artefakt, eftersom varje körning annars skulle lägga nya versioner av ~2 000
  matchfiler i git-historiken. Det enda som ska committas automatiskt är prognosjournalen
  (fas 3) – där är git-historiken själva poängen: den visar offentligt att en prognos
  fanns före avspark och aldrig skrivits om.
- Källcachen (`data/cache/`) sparas mellan körningarna med `actions/cache`, så att en död
  källa visas med senaste lyckade data och sitt datum.
- **Läge 2026-10-17:** sidan ligger tills vidare på <https://tomaslaino.github.io/Profeterna/>
  utan egen domän, eftersom profeterna.se inte är registrerad än (med domänen inställd
  skickades github.io-adressen vidare till en domän som inte svarar). Sätt tillbaka
  profeterna.se som custom domain när DNS pekar rätt.
- **Engångsinställningar:** registrera profeterna.se (ledig enligt whois 2026-10-17), skapa
  repot på GitHub (publikt, krävs för gratis Pages), välj *Settings → Pages → Source:
  GitHub Actions*, ange profeterna.se som custom domain och peka domänens A-poster på
  GitHub Pages (185.199.108.153, .109.153, .110.153, .111.153), som gravergrav.se hos Loopia.

## Lokalt

Kräver Node.js ≥ 18.

```bash
npm install
npm start              # bygger och serverar _site/ på http://localhost:3001, bygger om var 15:e min
npm run build          # bara bygget (hämtar källor vars cache är för gammal)
npm run refresh        # bygget med omhämtning av alla källor
```

Inga nycklar behövs – alla källor i fas 1 är öppna. Porten är 3001 så att Gräva guld kan
köra på 3000 samtidigt (ändras med `PORT` i `.env`, se `.env.example`). Express används
bara lokalt.

## Datakällor (verifierade 2026-10-17)

| Data | Källa | Tävlingar | Intervall | Kommentar |
|---|---|---|---|---|
| Spelprogram och resultat | ESPN:s öppna API (`eng.1`–`eng.4`, `eng.league_cup`, `eng.fa`) | alla sex | 1 h | Inofficiellt och odokumenterat (används även i VM2026). Datumintervall ger HTTP 400 – månadsformatet `dates=YYYYMM` fungerar, så säsongen hämtas månad för månad. Målminuter och straffläggningsflagga finns, så ställningen efter 90 minuter går att räkna fram. |
| Tabell | ESPN standings | ligorna | 3 h | Med poängavdrag. Bara aktuell tabell, ingen historik. |
| Skott, skott på mål, hörnor, kort | football-data.co.uk (`E0`–`E3`) | ligorna | 12 h | Alla fyra ligor sedan 2000/01, helt ifyllt. Uppdateras ungefär två gånger i veckan och släpar därför 1–3 dagar mot ESPN. `www.` svarar 302 till domänen utan www. |
| xG | football-data.co.uk (`HxG`/`AxG`) | ligorna | 12 h | **Nytt 2026/27 – saknas helt i tidigare säsonger. Leverantören är odokumenterad** (står inte i notes.txt, och värdena skiljer sig från Understat: Coventry–Newcastle 12/10 1,43–1,84 mot 1,66–2,22). Visas märkt; se Beslut. |
| xG | Understat (`getLeagueData/EPL`) | PL | 12 h | 2014/15 → idag (380/380 matcher för 2014, 2019 och 2025). Kräver headers `X-Requested-With` och `Referer`. Täcker inte EFL. |
| Odds, ligorna | football-data.co.uk (resultatfiler + `fixtures.csv`) | ligorna | 12 h / 6 h | 1X2 och över/under 2,5 (asiatiskt handikapp finns men sparas inte än). Öppningsodds (insamlade fre/tis enligt källan) och stängningsodds. Bet365, Betfred, BetVictor, Bwin, Paddy Power, Sky Bet, marknadssnitt/max och Betfair Exchange. **Pinnacle:** fullt 2012/13–2024/25, ungefär halva 2025/26, saknas 2026/27. Marknadssnitt vid stängning från 2019/20 (före dess Betbrain-snitt 2005–2019, bara öppning). Betfair Exchange från 2024/25. |
| Odds, alla tävlingar | ESPN matchsammanfattning (DraftKings) | alla sex | 6 h, matcher inom 7 dagar | Amerikanska odds räknas om till decimalodds. Ögonblicksbild; historiken är luckig (Bet365 2021/22, inget 2022/23–2024/25). Enda fria källan för cupodds. |
| Skador och avstängningar | Fantasy Premier League (`bootstrap-static`) | PL | 3 h | Status, chans att spela och nyhetstext med datum. Status avser nästa omgång. |
| National League | football-data.co.uk (`EC`) | underlag för FA-cupens non-league-lag | 12 h | Resultat, skott och odds, ingen xG. |

**Prövat och inte använt:**

| Källa | Utfall 2026-10-17 |
|---|---|
| FBref | HTTP 403 – blockerar automatisk hämtning |
| FotMob | API:t ändrat, 404 |
| ClubElo | Rating-API:t svarar 502; fixtures-API:t "deactivated". Styrka mellan divisionerna räknas i stället fram ur resultaten (fas 2). |
| ESPN:s skade-endpoint | Svarar, men är tom för alla fyra ligor |
| football-data.org | Gratisnivån täcker bara PL och Championship – behövs inte |
| The Odds API | Kräver registrerad nyckel (gratisnivå 500 anrop/mån). Inte använd: ESPN räcker för cupodds tills vidare. |

**Antaget, inte verifierat:**

- Att FA-cupen 2026/27 dyker upp hos ESPN när first round lottats. 2025/26 fanns den från
  first round till finalen, inklusive non-league-lag; kvalomgångarna saknas.
- Att ESPN:s inofficiella API fortsätter att fungera.
- När football-data.co.uk samlar in öppningsodds (notes.txt: fredag och tisdag eftermiddag).
- När ESPN publicerar startelvor.
- ESPN-namnen för National League-lag som ännu inte spelat FA-cup hos ESPN (aliastabellen).

## Beslut

- **Cupmatcher (2026-10-17):** huvudprognosen gäller 1X2 efter 90 minuter, jämförbar med
  odds och ligorna. Sannolikheten att gå vidare härleds ur samma modell (förlängning och
  straffar). Ställningen efter 90 minuter räknas fram ur ESPN:s målhändelser; stämmer de
  inte mot slutresultatet är den okänd.
- **xG från football-data.co.uk (2026-10-17):** visas märkt "leverantören odokumenterad"
  och testas som kandidatfaktor när säsongen gett tillräckligt med matcher. Styr inget
  förrän den klarat walk-forward-kravet. Understat används för PL.
- **Lag under National League i FA-cupen:** ingen lagdata finns. Prognosen får bygga på
  historiskt utfall för lag på samma nivå, tydligt märkt (fas 2).
- **Marknadsbaslinjen (c):** ligorna – marknadssnittet vid prognostillfället, med
  stängningsodds från Betfair Exchange som tuffaste referens. Cuperna – DraftKings via ESPN,
  loggat i journalen; kan bara utvärderas framåt eftersom fri cupoddshistorik saknas.

## Arkitektur

Samma beståndsdelar som Gräva guld, men byggda till en statisk sajt i stället för en
server:

- **Källor:** register med eget intervall per källa ([src/sources.js](src/sources.js)).
  [src/refresh.js](src/refresh.js) hämtar det som är för gammalt, i två steg eftersom
  ESPN-oddsen läser spelprogrammet ur cachen.
- **Bygge:** [src/build.js](src/build.js) hämtar och skriver `_site/`: `public/` plus
  `data/meta.json`, `data/sources.json`, `data/matches.json` (hela säsongen, kompakt) och
  `data/match/<id>.json` (underlaget per match). Katalogen byts på en gång, så att en
  halvfärdig sajt aldrig publiceras. En trasig match stoppar inte bygget.
- **Cache:** JSON i `data/cache/` (gitignorerad). Vid fel behålls senaste lyckade data med
  sitt datum och felet visas i källtabellen – verifierat genom simulerat fel.
- **Hämtare:** [src/fetchers/](src/fetchers/) – en fil per källa.
- **Matchunderlag:** [src/matches.js](src/matches.js) kopplar ihop källorna per match.
  Lagstatistiken är punkt-i-tiden (bara matcher före avspark), så att samma underlag kan
  användas av prognosmotorn och backtestet. Tabell och trupp finns bara som aktuell
  ögonblicksbild och märks så.
- **Källtabell:** [src/sourcetable.js](src/sourcetable.js) – status per källa och täckning
  per datatyp och tävling, med orsak där något saknas.
- **Frontend:** ren HTML/CSS/JS i `public/`, flikarna Matcher, Utvärdering, Källor och
  Modell. Läser JSON-filerna ovan. Urvalet av kommande/spelade matcher och källornas status
  räknas i webbläsaren mot besökarens klocka, inte mot byggtiden.

### Lagnamn

ESPN är kanonisk källa. Andra källors namn ("Man City", "Nott'm Forest", "Spurs")
översätts via en uttrycklig aliastabell ([config/team-aliases.js](config/team-aliases.js))
och jämförs efter normalisering. Ingen gissande matchning: ett namn som inte går att
mappa listas i källfliken och används inte. Läge 2026-10-17: 0 omappade.

## Statusmärkning

Räknas om i webbläsaren ur hämttid och källans gräns – stannar den schemalagda hämtningen
blir källorna gula av sig själva, och sidhuvudet varnar när senaste bygget är mer än fyra
schemaintervall gammalt.

- **Grön (färsk):** inom källans normala intervall.
- **Gul (gammal):** data finns men är äldre än väntat – visas med sitt datum.
- **Röd (fel):** senaste hämtningen misslyckades; senaste lyckade data visas med sitt datum.
- **Grå (okänt):** inget verifierbart innehåll (t.ex. FA-cupen innan första omgången lottats).

## Kända brister (fas 1)

- ESPN-oddsen sparas bara som senaste ögonblicksbild. Historik över odds vid
  prognostillfället börjar med journalen i fas 3.
- Tabell och trupp är aktuella ögonblicksbilder, inte punkt-i-tiden, och kan inte användas
  i backtest.
- Inbördes möten visas bara för innevarande säsong; historiken kommer i fas 4.
- Skottstatistik från cupmatcher (finns hos ESPN) hämtas inte – lagens ligastatistik används.
- ESPN anger ingen omgång för ligamatcher, så listan grupperas per datum.
- Alla källor svarade från GitHub Actions servrar vid första körningen (2026-10-17).
  Börjar någon blockera molnadresser visas den som fel i källtabellen; sidan fungerar ändå.
- Actions-stegen (checkout, setup-node, cache, Pages) är v4/v3 och ger varningen att
  Node 20 fasas ut på GitHub; de körs ändå. Själva bygget körs på Node 22.
- GitHub stänger av schemalagda workflows i publika repon efter 60 dagar utan aktivitet i
  repot. Journalens commits (fas 3) håller det vid liv; tills dess räcker en push.
- football-data.co.uk:s datum är brittisk lokal tid. Matchningen mot ESPN sker på
  (hemmalag, bortalag) inom ligan, som är unikt under en säsong, så datumet spelar ingen roll.

## Säkerhet

Inga nycklar behövs i fas 1. `.env` är gitignorerad.
