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
- [x] **Fas 2 – Prognosmotor:** historik från 2000/01, tre baslinjer (naiv, Poisson på
  säsongens mål, marknad utan marginal), grundmodell Dixon–Coles över nivå 1–5 med
  cupregler, osäkerhetsintervall och nedbrytning, prognos i matchvyn och matchlistan,
  kontroll mot 2025/26 (regelversion 2026-10-17.1)
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
npm run check          # prognosmotorns kontroll mot förra säsongen (se Prognosmotorn)
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
| Tidigare säsonger, ligorna | football-data.co.uk (`mmz4281/<säsong>/E0–E3, EC.csv`) | PL–L2, National League | 30 d | E0–E3 2000/01–2025/26 (26 säsonger, 52 672 matcher), EC 2005/06–2025/26 (11 234; 2000/01–2004/05 svarar 300). Fulla säsonger utom League One/Two 2019/20 (400/440 matcher, avbruten säsong) och EC 2019/20–2021/22 (451, 477, 506). En fil per säsong, ~0,25 s styck – allt hämtas på ~4 s. Äldre filer är Windows-1252 (t.ex. "King’s Lynn" i EC 2021/22), nyare UTF-8; läses därefter. Sparar resultat, skott och odds (marknadssnitt hette `BbAv` före 2019/20). |
| Tidigare säsonger, FA-cupen | ESPN (`eng.fa`, månad för månad) | FA-cupen | 30 d | 2021/22–2025/26, 674 matcher från first round proper (ESPN har längre bak). Enda fria källan till matcher för lag under National League. Rundornas namn varierar mellan säsongerna. ESPN:s flagga för neutral plan är inte satt för Wembley-matcherna. |

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
  För 2021/22–2025/26 är de kontrollerade säsong för säsong mot EC-filerna.
- Cupreglerna 2026/27 (se Prognosmotorn): kontrollerade mot ESPN:s utfall 2025/26 och
  pressuppgifter, inte mot FA:s och EFL:s regelböcker.
- Att ESPN namnger FA-cupens omgångar 2026/27 som 2025/26 (`semifinals`, `final`) – det
  styr vilka matcher som räknas som neutral plan.

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
- **Marginalen tas bort med Shins metod (2026-10-17):** Shin (1993); Štrumbelj (2014) fann
  den träffsäkrare än proportionell normering för fotbollsodds, eftersom den tar hänsyn till
  favorit–longshot-snedheten. Är summan av 1/odds ≤ 1 (kan hända på börsen) normeras bara.
- **Lag under National League (2026-10-17):** slås ihop till ett gemensamt nivåsnitt,
  skattat på alla sådana lags FA-cupmatcher hos ESPN sedan 2021/22 (117 matcher), utan
  tidsavklingning eftersom det är nivån och inte ett lag som skattas. Märks i matchvyn
  och matchlistan (*).
- **Cupmatcher i skattningen (2026-10-17):** ingår med samma vikt som ligamatcher – de är
  de enda direkta mötena mellan nivåerna under en säsong. Rotation i cuperna prövas i fas 4.

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
- **Prognosmotor:** [config/forecast-rules.js](config/forecast-rules.js) (regelversion och
  alla val), [src/model.js](src/model.js) (matematiken), [src/modeldata.js](src/modeldata.js)
  (underlaget: historik + innevarande säsong), [src/forecast.js](src/forecast.js) (modell,
  baslinjer, cuper, osäkerhet) och [src/check.js](src/check.js) (kontrollen). Bygget skriver
  prognosen i `data/match/<id>.json`, en kompakt 1X2 i `data/matches.json` och modellens
  skattningar och kontroll i `data/model.json`. Fallerar motorn byggs sajten ändå, utan
  prognoser och med felet synligt under Modell.
- **Frontend:** ren HTML/CSS/JS i `public/`, flikarna Matcher, Utvärdering, Källor och
  Modell. Läser JSON-filerna ovan. Urvalet av kommande/spelade matcher och källornas status
  räknas i webbläsaren mot besökarens klocka, inte mot byggtiden.

### Lagnamn

ESPN är kanonisk källa. Andra källors namn ("Man City", "Nott'm Forest", "Spurs")
översätts via en uttrycklig aliastabell ([config/team-aliases.js](config/team-aliases.js))
och jämförs efter normalisering. Ingen gissande matchning: ett namn som inte går att
mappa listas i källfliken och används inte. Läge 2026-10-17: 0 omappade.

## Prognosmotorn (fas 2)

Regelversion **2026-10-17.1** i [config/forecast-rules.js](config/forecast-rules.js). Allt
som bestämmer en prognos ligger där; samma data ger alltid samma prognos (även
intervallen – slumpen är seedad). **Ingen kandidatfaktor styr prognosen:** grundmodellen
bygger enbart på mål efter 90 minuter. xG, skott, form, tabell, skador, inbördes möten och
odds visas som underlag men prövas först walk-forward i fas 4.

**Grundmodell – Dixon–Coles (1997).** Varje lag har en anfalls- och en försvarsstyrka,
gemensam hemmafördel och en korrektion ρ för 0–0, 1–0, 0–1 och 1–1. Maximum likelihood på
tidsviktade matcher (halveringstid 365 dagar, ungefär Dixon & Coles ξ), i två steg: först
Poisson-parametrarna (iterativ skalning, varmstart dag för dag), sedan ρ givet dem. Alla
fem nivåerna (PL–National League, 2022/23 → idag, ~11 600 matcher) och årets cupmatcher
skattas i **en** modell, så att styrkorna hamnar på samma skala: divisionerna kopplas ihop
av upp- och nedflyttade lag (som behåller sina parametrar) och av cupmöten. Lag under
National League skattas som ett nivåsnitt (se Beslut). Skattat 2026-10-17: hemmafördel
+21 % mål, ρ = −0,012. Ett genomsnittslag på nivån mot ett genomsnittslag i PL på neutral
plan: Championship 15/22/63, League One 8/16/76, League Two 4/11/85, National League
2/6/92, under National League 1/2/97.

Ur samma resultatmatris härleds 1X2, förväntade mål per lag, resultatfördelningen,
över/under 2,5 och båda lagen gör mål.

**Punkt-i-tiden.** Prognosen för en match skattas bara på matcher före matchdagen. Kommande
matcher får dagens skattning; årets spelade matcher får en *återskapad* prognos med samma
regler och det underlag som fanns före avspark – märkt så i matchvyn. Riktiga
före-matchen-prognoser börjar med journalen i fas 3.

**Cuper.** Huvudprognosen gäller 90 minuter. Chansen att gå vidare räknas ur samma modell:
förlängning med samma målfrekvens per minut (30/90 av matchens förväntade mål, oberoende
Poisson) och straffar 50/50. Regler 2026/27, kontrollerade mot ESPN:s utfall 2025/26 (där
FA-cupen har förlängning från first round och EFL-cupen inga förlängningar alls före
semifinal) och pressuppgifter:

| | Oavgjort efter 90 | Två möten | Neutral plan |
|---|---|---|---|
| FA-cupen | förlängning, straffar (inga omspel sedan 2024/25) | – | semifinal, final |
| EFL-cupen | straffar direkt; förlängning bara i semifinal (efter returen) och final | semifinal (sammanlagt) | final |

**Baslinjer.** (a) *Naiv:* divisionens andel 1/X/2 de tio senaste avslutade säsongerna
(cupmatcher: alla ligamatcher nivå 1–4). (b) *Poisson på säsongens mål:* anfall, försvar och
hemmafördel enbart på årets matcher, utan historik, tidsvikt eller ρ; okänd tills båda lagen
spelat fem matcher och hänger ihop via årets matcher. (c) *Marknaden:* odds utan marginal
med Shins metod – ligorna marknadssnittet (football-data.co.uk, öppningsodds), cuperna
DraftKings via ESPN; för spelade ligamatcher även Betfair Exchange vid stängning.

**Osäkerhet.** Spannet under varje sannolikhet är de mittersta 80 % av 50 omskattningar med
Bayesiansk bootstrap (slumpvikter Exp(1) på matcherna, ρ fast) – osäkerheten i lagens
styrka, inte modellfel. Räknas för kommande matcher.

**Vad drog åt vilket håll.** Prognosen byggs upp steg för steg på log-skala: två
genomsnittslag på hemmalagets nivå på neutral plan → hemmaplan → nivåskillnad (cupmöten
mellan nivåer) → hemmalagets egen styrka mot nivåns snitt → bortalagets. Sista steget är
exakt modellens prognos; ordningen är fast och ett stegs effekt beror något på den.

**Kontroll mot 2025/26** (`npm run check`, ~9 s; bygget kör den bara när regelversionen
eller historiken ändrats och visar den under Modell). Varje match fick en prognos skattad på
matcherna före matchdagen med samma kod. Log-poäng, lägre = bättre; skillnad modell −
baslinje med 95 % bootstrap-intervall:

| Ligorna, mot | Matcher | Modell | Baslinje | Skillnad | Brier modell / baslinje |
|---|---|---|---|---|---|
| (b) Poisson på säsongens mål | 1 804 | 1,046 | 1,080 | −0,034 (−0,050 till −0,018) | 0,630 / 0,647 |
| (a) Naiv | 2 036 | 1,047 | 1,077 | −0,029 (−0,039 till −0,019) | 0,631 / 0,652 |
| (c) Marknaden, öppning | 2 036 | 1,047 | 1,026 | +0,022 (+0,015 till +0,029) | 0,631 / 0,616 |
| Betfair Exchange, stängning | 1 919 | 1,051 | 1,029 | +0,022 (+0,014 till +0,029) | 0,633 / 0,619 |

Modellen har lägre log-poäng än (b) i alla fyra ligorna – säkert i League One och League
Two, medan intervallet i PL och Championship precis täcker noll – och slår (a), men ligger
~0,02 efter marknaden, vilket är väntat för en modell som bara ser mål. FA-cupen 2025/26 (122 matcher):
0,949 mot naiv 1,067; att gå vidare log-poäng 0,608 (slantsingling 0,693). Kontrollen är
**ingen utvärdering**: reglerna valdes med vetskap om att 2025/26 skulle användas här.
Walk-forward över många säsonger kommer i fas 4.

**Byggtid** (lokalt, 2026-10-17): prognoserna för säsongens 2 120 matcher ~3,5 s, hela
bygget ~7,5 s med vanlig hämtning; med full omhämtning av alla källor och ny kontroll ~25 s.

## Statusmärkning

Räknas om i webbläsaren ur hämttid och källans gräns – stannar den schemalagda hämtningen
blir källorna gula av sig själva, och sidhuvudet varnar när senaste bygget är mer än fyra
schemaintervall gammalt.

- **Grön (färsk):** inom källans normala intervall.
- **Gul (gammal):** data finns men är äldre än väntat – visas med sitt datum.
- **Röd (fel):** senaste hämtningen misslyckades; senaste lyckade data visas med sitt datum.
- **Grå (okänt):** inget verifierbart innehåll (t.ex. FA-cupen innan första omgången lottats).

## Kända brister (fas 1–2)

- ESPN-oddsen sparas bara som senaste ögonblicksbild. Historik över odds vid
  prognostillfället börjar med journalen i fas 3.
- Tabell och trupp är aktuella ögonblicksbilder, inte punkt-i-tiden, och kan inte användas
  i backtest.
- Inbördes möten visas bara för innevarande säsong; historiken finns nu men visas i fas 4.
- Skottstatistik från cupmatcher (finns hos ESPN) hämtas inte – lagens ligastatistik används.
- ESPN anger ingen omgång för ligamatcher, så listan grupperas per datum.
- Alla källor svarade från GitHub Actions servrar vid första körningen (2026-10-17).
  Börjar någon blockera molnadresser visas den som fel i källtabellen; sidan fungerar ändå.
- Actions-stegen (checkout, setup-node, cache, Pages) är v4/v3 och ger varningen att
  Node 20 fasas ut på GitHub; de körs ändå. Själva bygget körs på Node 22.
- GitHub stänger av schemalagda workflows i publika repon efter 60 dagar utan aktivitet i
  repot. Journalens commits (fas 3) håller det vid liv; tills dess räcker en push.
- **Fas 2:** årets spelade matcher har återskapade prognoser, inte prognoser publicerade
  före avspark – journalen (fas 3) behövs för äkta out-of-sample.
- Osäkerhetsintervallen fångar bara osäkerheten i lagens styrka (ρ hålls fast), inte
  modellfel; de räknas inte för spelade matcher.
- Förlängning antas ha samma målfrekvens per minut som de 90 minuterna, och straffar är
  50/50. Ingen av dem är skattad.
- Cupmatcher väger som ligamatcher i skattningen; storlagens rotation i cuperna kan dra ned
  deras styrka något och syns inte i prognosen.
- Marknaden för ligamatcher finns först när football-data.co.uk lagt ut öppningsodds
  (fre/tis) – före dess är (c) okänd. DraftKings-odds visas som underlag men används inte
  som (c) för ligorna.
- Naiva baslinjen för cupmatcher använder ligamatcher, eftersom fri cuphistorik bara finns
  för FA-cupen sedan 2021/22. EFL-cupens tidigare säsonger hämtas inte.
- Nivåsnittet för lag under National League bygger på FA-cupmatcher från first round
  proper; lag från kvalomgångarna är ett urval av de bästa på sina nivåer.
- Säsongsbaslinjen (b) är extrem tidigt på säsongen (t.ex. 93/5/2) – avsiktligt enkel.
- Matchunderlaget (fas 1) tar ~3,4 s av bygget, eftersom varje match filtrerar hela
  säsongen; prognoserna ~3,5 s.
- football-data.co.uk:s datum är brittisk lokal tid. Matchningen mot ESPN sker på
  (hemmalag, bortalag) inom ligan, som är unikt under en säsong, så datumet spelar ingen roll.

## Säkerhet

Inga nycklar behövs i fas 1–2. `.env` är gitignorerad.
