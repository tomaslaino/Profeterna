# Profeterna

Hemsida (profeterna.se) som gör matchprognoser för Premier League, Championship,
League One, League Two, FA-cupen och EFL-cupen – och sedan rättar sina egna
prognoser mot facit. Byggd efter samma principer och arbetssätt som Gräva guld
(`~/Kod/Gräverguld`), utan betalda tjänster – utom den valfria matchanalysen (fas 5), som
är avstängd som standard. Under utvecklingen körs sidan lokalt.

**Principer:** ingen siffra utan källa och datum · "okänt" är ett giltigt värde ·
ingen falsk precision · sidan kraschar aldrig av en död källa · endast fria källor.

## Status

- [x] **Fas 1 – Datapipeline:** källor verifierade per datatyp och tävling, hämtning med
  eget intervall per källa, cache, källtabell, lagnamnsmappning, matchlista och matchunderlag
- [x] **Fas 2 – Prognosmotor:** historik från 2000/01, tre baslinjer (naiv, Poisson på
  säsongens mål, marknad utan marginal), grundmodell Dixon–Coles över nivå 1–5 med
  cupregler, osäkerhetsintervall och nedbrytning, prognos i matchvyn och matchlistan,
  kontroll mot 2025/26 (regelversion 2026-10-17.1)
- [x] **Fas 3 – Journal + utvärdering:** append-only prognosjournal som GitHub Actions
  committar, Brier- och log-poäng mot baslinjerna (a), (b), (c) och Betfair-stängningen,
  kalibreringskurva, att gå vidare i cuperna, värdespel, per tävling och regelversion,
  äkta före-matchen-prognos i matchvyn
- [x] **Fas 4 – Backtest + kandidatjakt:** walk-forward-backtest 2004/05–2026/27 med samma
  kod som den skarpa prognosen, mot (a), (b), (c) och Pinnacle-stängningen per säsong och
  division; kandidatjakt med förhandsregistrerat krav, 13 kandidater + kombinationssteg,
  kandidatlogg och inbördes möten från tidigare säsonger i matchvyn. Tabelläget infört som
  regelversion **2026-10-17.2** (användarens beslut)
- [x] **Fas 5 – Matchanalys (valfri):** knappen Analysera i matchvyn låter en språkmodell
  (DeepSeek, deepseek-v4-pro) skriva en kort text ur matchens underlag, via en proxy på
  Cloudflare Workers, och ett eget avsnitt *Nyhetsläget* ur nyheter som hämtas online vid
  klicket (artiklar med källa och länk, väder). Sifferkontroll mot underlaget, cache på
  underlagets innehållsavtryck, märkt med modell och tid. **Avstängd som standard** – proxyn är inte driftsatt (se
  [Matchanalysen](#matchanalysen-fas-5))
- [x] **Kupongen:** gängets gemensamma kupong per omgång – utvalda matcher med 1, X, 2 eller
  gardering. Kort på förstasidan, fliken Kupong med liveställning från ESPN, Ny kupong med
  sökning. Sparas som fil i `data/kuponger/` med en commit på GitHub (se [Kupongen](#kupongen))
- [x] **Kuponghistoriken:** sidan Historik med varje färdigspelad kupong – antal rätt,
  betyg 1–5 mot modellens väntade antal rätt, sortering efter hur det gick och en kort
  AI-kommentar som läser gängets anteckningar. Fryses in i `data/kupong-historik.json`
  (se [Kuponghistoriken](#kuponghistoriken))

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
  matchfiler i git-historiken. Det enda som committas automatiskt är prognosjournalen
  (`data/journal/`) – där är git-historiken själva poängen: den visar offentligt att en
  prognos fanns före avspark och aldrig skrivits om. Se
  [Prognosjournalen och utvärderingen](#prognosjournalen-och-utvärderingen-fas-3) – och
  kuponghistoriken (`data/kupong-historik.json`, se [Kuponghistoriken](#kuponghistoriken)).
- **Journalens commit:** bygget körs med `--journal`, och steget *Committa
  prognosjournalen och kuponghistoriken* committar bara `data/journal/` och
  `data/kupong-historik.json`, och bara när de ändrats, som `github-actions[bot]` med
  meddelandet "Prognosjournal: N nya rader" (och/eller "kuponghistoriken uppdaterad"). Jobbet har
  `contents: write`; deploy-jobbet bara `pages`/`id-token`. Steget stoppar körningen om en
  befintlig rad ändrats eller tagits bort (append-only), och har main fått en ny commit
  under körningen läggs journalcommiten ovanpå (`pull --rebase`). Misslyckas committen
  publiceras inte heller sajten – nästa körning loggar raderna på nytt.
- **Ingen loop, ingen krock:** push med `GITHUB_TOKEN` startar aldrig workflows, och
  push-triggern har dessutom `paths-ignore: data/journal/**`. Concurrency-gruppen `pages`
  kör en körning i taget, och checkout tar `ref: main` – grenens läge när jobbet startar,
  inte commiten som köade körningen – så att en körning som väntat på den förra ser dess
  journalrader och inte loggar om dem.
- **Lokalt:** dra bottens commits innan du pushar (`git pull --rebase`). Journalen ändras
  bara av boten, så det blir inga konflikter.
- Källcachen (`data/cache/`) sparas mellan körningarna med `actions/cache`, så att en död
  källa visas med senaste lyckade data och sitt datum.
- **Matchanalysen (fas 5)** ingår inte i bygget och kostar ingenting där: workflowen har
  ingen nyckel. Bygget skriver bara i `data/meta.json` om knappen ska visas. Analysen görs
  på begäran av proxyn i [worker/](worker/), som driftsätts för hand på Cloudflare.
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
npm run backtest       # walk-forward-backtest över alla säsonger, ~1,5 min (se Backtestet)
npm run kandidater     # kandidatjakten, ~15 min första gången (se Kandidatjakten)
```

Lokala byggen **läser** journalen som den ligger i repot men skriver aldrig i den – det gör
bara bygget på GitHub Actions (`npm run build -- --journal`). För att prova loggningen
lokalt utan att röra den riktiga journalen: `JOURNAL_DIR=/tmp/journal npm run build -- --journal`.

Inga nycklar behövs – alla källor är öppna. Porten är 3001 så att Gräva guld kan
köra på 3000 samtidigt (ändras med `PORT` i `.env`, se `.env.example`). Express används
bara lokalt. Med `DEEPSEEK_API_KEY` i `.env` visar `npm start` knappen Analysera och gör
analysen själv (`POST /api/analyze`, samma kod som proxyn); varje ny text kostar då pengar.
Utan nyckel ingen knapp.

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
| xG, tidigare säsonger | Understat (`getLeagueData/EPL/<år>`) | PL | 30 d, bara kandidatjakten | 2014/15–2025/26, 380/380 matcher med xG varje säsong (verifierat 2026-10-17), alla 4 560 parade mot football-data.co.uk på (hemma, borta). Hämtas av `npm run kandidater`, inte av bygget – används först om xG-kandidaten klarar kravet. |
| Tidigare säsonger, FA-cupen | ESPN (`eng.fa`, månad för månad) | FA-cupen | 30 d | 2021/22–2025/26, 674 matcher från first round proper (ESPN har längre bak). Enda fria källan till matcher för lag under National League. Rundornas namn varierar mellan säsongerna. ESPN:s flagga för neutral plan är inte satt för Wembley-matcherna. |
| Halvtid, hörnor, kort och domare, tidigare säsonger | football-data.co.uk (samma filer som raden ovan, fler kolumner) | PL–L2, National League – bara sidan Divisioner | 30 d | Verifierat 2026-10-18. Egen cache (`fdcouk_stats_*`), så att prognosmotorns underlag och backtestets signatur inte ändras. Halvtidsresultat, kort och domare finns i stort sett alla säsonger sedan 2000/01 (EC sedan 2005/06); domare saknas 2012/13 i E1–EC, och skott, hörnor och frisparkar saknas i EC från 2016/17. Avsparkstid (brittisk tid) från 2019/20, publik bara 2000/01–2001/02. Sparar också marknadssnittets 1X2 och över/under 2,5. |
| Liveställning | ESPN scoreboard (`site.api.espn.com/…/<liga>/scoreboard?dates=YYYYMMDD`), hämtas **i webbläsaren** | kupongens matcher | 1 min medan en kupongmatch pågår | Verifierat 2026-10-18: svarar med `Access-Control-Allow-Origin: *`, så sidan kan hämta direkt. Samma matchid som spelprogrammet. Status, matchminut och ställning; används bara av kupongen, inte av prognosen eller bygget. |
| Målminuter och publik, tidigare säsonger | ESPN (`eng.1`–`eng.4`, månad för månad) | ligorna – bara sidan Divisioner | 30 d | Verifierat 2026-10-18. 2021/22–2025/26; grundserien räknas, play-off filtreras bort. Målhändelserna går ihop med slutresultatet i 99,9 % av matcherna, publik finns i 98–100 % per liga och säsong. Kompakt format (`parseCrowd`): målminut med sida och publiksiffra. Årets publik saknas (spelprogrammets format ändras inte). |

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
- **Prognosen som räknas (2026-10-17, användarens beslut):** den sista raden i journalen som
  loggades före avspark. Rader loggade vid eller efter avspark räknas inte.
- **Journalens fönster (2026-10-17):** matcher loggas från 14 dagar före avspark – samma
  fönster som listan Kommande. Hela säsongen varje gång skulle ge hundratals nya rader per
  matchdag (varje resultat flyttar alla lags styrka lite) och tiotals MB i git per säsong,
  utan att tillföra något: det är ändå den sista raden före avspark som räknas.
- **När en ny rad skrivs (2026-10-17):** när prognosen ändrats på den precision sidan visar
  (hela procent; förväntade mål med en decimal), när marknadens odds ändrats, eller vid ny
  regelversion eller ny avspark – samma princip som Gräva guld, där avtrycket är det som
  visas. Raden sparar ändå de exakta sannolikheterna (fyra decimaler).
- **Litet underlag (2026-10-17):** snitt och skillnader visas först från 30 matcher,
  avkastning från 30 spel och en kalibreringskorg från 10 prognoser – före dess "för få"
  med antalet. Skillnader visas med 95 % bootstrap-intervall.
- **Kandidatkravet (2026-10-17, skrivet före första körningen):** walk-forward, log-poäng
  under grundmodellens med hela bootstrap-intervallet under noll (matchdagar dras om; 95 %
  Bonferroni-justerat för antalet kandidater), bättre i båda halvorna av säsongerna och
  Brier inte sämre. Kandidaternas värden (180/730 dagar, 2/6 säsonger, halv vikt, hälften
  skott/xG, fem matcher, sex möten) är a priori-val. Se
  [Kandidatjakten](#kandidatjakten).
- **Tabelläget införs (2026-10-17, användarens beslut):** regelversion 2026-10-17.2. Av de
  tre godkända kandidaterna: tabelläget hade störst effekt bland fotbollsfaktorerna, och
  formen tillför inget utöver det (kombinationen underkänd). Marknaden infördes inte – dess
  skattade vikt blev 100 %, så den hade ersatt modellen och gjort jämförelsen mot (c)
  meningslös. Vikten β = 0,0373 är fryst i regelkonfigen (skattad på backtestets prognoser
  2004/05–2026/27), så att samma data alltid ger samma prognos.
- **En godkänd kandidat ändrar inte prognosen av sig själv (2026-10-17):** den blir en ny
  regelversion med datum först efter användarens beslut, eftersom det ändrar prognoserna
  som loggas i journalen från nästa körning. Backtestet körs då om för den nya versionen.
- **Backtestet körs inte i bygget (2026-10-17):** ~1,5 min för grundmodellen och ~15 min
  för kandidatjakten på 9 trådar – för tungt var 30:e minut. Resultaten committas i
  `data/backtest/` och visas med körningens datum och regelversion; saknas backtestet för
  dagens regelversion står det "okänt" under Modell.
- **Stängningsreferens i backtestet (2026-10-17):** Pinnacle vid stängning (2012/13–), som
  finns för flest säsonger. Betfair Exchange, som journalen och kontrollen använder, finns
  bara från 2024/25.
- **Matchanalysen på begäran (2026-10-18, användarens beslut):** besökaren går in på en
  kommande match och klickar på Analysera; texten skrivs ur underlaget just då. Inga
  analyser i bygget och inga för matcher som ingen öppnar.
- **DeepSeek i stället för `@anthropic-ai/sdk` (2026-10-18, användarens beslut):**
  kravspecen nämner Anthropics SDK; användaren valde DeepSeek, modell deepseek-v4-pro.
  API:t är OpenAI-kompatibelt och anropas med `fetch` – inget nytt beroende. Leverantör,
  adress och modell står i [config/llm.js](config/llm.js), så att byte är en konfigändring.
- **Användaren betalar för allas klick, utan skydd mot missbruk (2026-10-18, användarens
  beslut):** därför en proxy (Cloudflare Workers, användarens val) som håller nyckeln – en
  nyckel i sajtens JavaScript hade kunnat användas till vad som helst. Proxyn tar bara emot
  ett match-id och hämtar underlaget själv från den publicerade sajten, och samma underlag
  genereras aldrig två gånger. Kostnaden begränsas av antalet underlagsversioner, inte av
  antalet klick.
- **Avstängd som standard (2026-10-18, användarens beslut):** modulen är byggd och
  verifierad men inte påslagen på sajten. Den slås på genom att driftsätta proxyn och
  ange dess adress i [config/llm.js](config/llm.js) (se Matchanalysen).
- **Nyhetsläget (2026-10-18, användarens beslut):** Analysera hämtar också det senaste om
  matchen online – förhandsartiklar, skador och trupp, tränarläge, väder – och modellen
  skriver ett eget avsnitt om det under analysen, med en hänvisning till artikeln för varje
  påstående och en källista med länkar. Analysen själv bygger fortfarande bara på sidans
  underlag. Nyheterna är rapporterat i media, inte en källa till prognosen, och ändrar
  inga siffror. Kostnaden per text blir ungefär tre gånger högre (större underlag).
- **En text med ett främmande tal visas inte (2026-10-18):** strängare än Gräva gulds
  flaggning. Varje tal i texten måste finnas i underlaget; annars ett nytt försök med
  talen utpekade, och klarar inte heller det kontrollen visas ingen text alls.

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
  skattningar i `data/model.json`. Fallerar motorn byggs sajten ändå, utan prognoser och med
  felet synligt under Modell.
- **Backtest och kandidatjakt:** [src/backtest.js](src/backtest.js) (walk-forward över alla
  säsonger, parallellt i trådar, prognoserna per match cachade i `data/cache/backtest_*.json`)
  och [src/candidates.js](src/candidates.js) (kandidaterna, kravet, loggen). Körs för hand;
  resultaten committas i `data/backtest/` – `<regelversion>.json` per regelversion och
  `candidates.json` (kandidatloggen) – och bygget läser dem till `data/model.json`. Se
  [Backtestet och kandidatjakten](#backtestet-och-kandidatjakten-fas-4).
- **Journal:** [src/journal.js](src/journal.js) – append-only-loggning, innehållsavtryck,
  läsning och vilken rad som räknas. Filen är `data/journal/forecasts-<säsong>.jsonl`, en
  JSON-rad per post, committad av GitHub Actions; bygget kopierar den till sajten
  (`data/journal/`) så att hela journalen går att ladda ned.
- **Utvärdering:** [src/evaluate.js](src/evaluate.js) rättar journalen mot facit och
  skriver `data/evaluation.json` (fliken Utvärdering) och journalinfo per match i
  `data/match/<id>.json`. Poängen och bootstrap-jämförelsen är samma kod som kontrollen
  ([src/check.js](src/check.js)). Fallerar utvärderingen byggs sajten ändå.
- **Matchanalys (fas 5, valfri):** [config/llm.js](config/llm.js) (av/på, leverantör,
  modell, prompt), [worker/analysis.mjs](worker/analysis.mjs) (underlaget, avtrycket,
  sifferkontrollen), [worker/index.mjs](worker/index.mjs) (`analyze()` och
  Cloudflare-proxyn, [worker/wrangler.toml](worker/wrangler.toml)) och
  [src/news.mjs](src/news.mjs) med [config/news.js](config/news.js) (Nyhetsläget:
  hämtning, urval, källista). Lokalt kör
  [server.js](server.js) samma `analyze()`. Se [Matchanalysen](#matchanalysen-fas-5).
- **Kupongen:** [src/coupons.js](src/coupons.js) läser och kontrollerar filerna i
  `data/kuponger/` och bygget skriver `data/kuponger.json`. Rättningen, liveställningen och
  Ny kupong finns i [public/kupong.js](public/kupong.js) och
  [public/kupong.css](public/kupong.css). Se [Kupongen](#kupongen).
- **Kuponghistoriken:** [src/history.js](src/history.js) rättar färdiga kuponger, räknar
  betyget, fryser in dem i `data/kupong-historik.json` och skriver `data/historik.json`.
  Sidan är [public/historik.html](public/historik.html) med
  [public/historik.js](public/historik.js) och [public/historik.css](public/historik.css);
  AI-kommentaren skrivs av [worker/kommentar.mjs](worker/kommentar.mjs) med prompten i
  [config/kommentar.js](config/kommentar.js). Se [Kuponghistoriken](#kuponghistoriken).
- **Frontend:** ren HTML/CSS/JS i `public/`, flikarna Matcher, Kupong, Utvärdering, Källor och
  Modell (regelversion, backtest, kandidatlogg); i matchvyn kortet Analys när
  matchanalysen är påslagen. Läser JSON-filerna ovan. Urvalet av kommande/spelade matcher och källornas status
  räknas i webbläsaren mot besökarens klocka, inte mot byggtiden.

### Lagnamn

ESPN är kanonisk källa. Andra källors namn ("Man City", "Nott'm Forest", "Spurs")
översätts via en uttrycklig aliastabell ([config/team-aliases.js](config/team-aliases.js))
och jämförs efter normalisering. Ingen gissande matchning: ett namn som inte går att
mappa listas i källfliken och används inte. Läge 2026-10-17: 0 omappade.

## Prognosmotorn (fas 2)

Regelversion **2026-10-17.2** i [config/forecast-rules.js](config/forecast-rules.js). Allt
som bestämmer en prognos ligger där; samma data ger alltid samma prognos (även
intervallen – slumpen är seedad). Grundmodellen bygger på mål efter 90 minuter, och från
2026-10-17.2 vägs **tabelläget** in (se nedan) – den enda faktor som klarat kandidatjakten
och införts. xG, skott, form, skador, inbördes möten och odds visas som underlag men styr
inte prognosen.

| Regelversion | Innehåll |
|---|---|
| 2026-10-17.1 | Grundmodellen: Dixon–Coles på mål efter 90 minuter, cupregler, baslinjer |
| 2026-10-17.2 | + tabelläget som faktor (kandidatjakten 2026-10-17, användarens beslut) |

**Tabelläget (från 2026-10-17.2).** Poäng per match i årets liga för hemmalaget minus
bortalaget, räknat ur resultaten före prognosdagen (mål efter 90 minuter, utan
poängavdrag), flyttar de förväntade målen: log λ<sub>hemma</sub> += β·z,
log λ<sub>borta</sub> −= β·z med β = 0,0373, dvs. +3,8 % mål per poäng per match bättre än
motståndaren. Bara ligamatcher där båda lagen spelat minst fem ligamatcher i år; annars
ingen justering. Ett lag med 2,0 poäng per match mot ett med 1,0 får alltså ~4 % fler
förväntade mål och motståndaren ~4 % färre. Signalen räknas av samma funktion i
prognosen och i kandidatjakten ([src/forecast.js](src/forecast.js), `tableSignal`).

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
mellan nivåer) → hemmalagets egen styrka mot nivåns snitt → bortalagets → tabelläget. Sista steget är
exakt modellens prognos; ordningen är fast och ett stegs effekt beror något på den.

**Kontroll mot 2025/26** (`npm run check`, ~9 s; siffrorna nedan gäller regelversion
2026-10-17.1). Fram till fas 4 körde bygget den och visade den under Modell; nu visas i
stället backtestet över alla säsonger, där 2025/26 ingår. Varje match fick en prognos skattad på
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
Walk-forward över alla säsonger: se [Backtestet](#backtestet-och-kandidatjakten-fas-4).

**Byggtid** (lokalt, 2026-10-17): prognoserna för säsongens 2 120 matcher ~3,5 s, hela
bygget ~7,5 s med vanlig hämtning; med full omhämtning av alla källor och ny kontroll ~25 s.

## Prognosjournalen och utvärderingen (fas 3)

**Journalen.** Varje bygge på GitHub Actions loggar alla matcher i de sex tävlingarna som
inte startat (status schemalagd, avspark i framtiden) och har avspark inom 14 dagar, i
`data/journal/forecasts-2026-27.jsonl`. En rad innehåller:

| Fält | Innehåll |
|---|---|
| `loggedAt` | när raden skrevs (UTC) |
| `id`, `comp`, `kickoff`, `home`, `away` | matchen enligt ESPN |
| `rulesVersion`, `fitThrough` | regelversion och underlagets sista matchdag |
| `status`, `reasons` | `ok`, eller `okänt` med orsak – även det loggas |
| `p`, `goals`, `over25`, `btts`, `advance` | 1X2, förväntade mål, över 2,5, båda lagen gör mål, P(går vidare) i cuperna – fyra decimaler |
| `naive`, `season` | baslinjerna (a) och (b) vid tillfället (`null` = okänd) |
| `market` | (c): sannolikheter utan marginal, odds, över 2,5, källa, slag (öppning/senaste) och hämttid |

En ny rad skrivs bara när innehållet ändrats (se Beslut); omkörning med samma underlag
skriver ingenting (verifierat: andra bygget i rad gav 0 nya rader). Raderna skrivs aldrig
om – bygget lägger bara till, och workflowen stoppar om en befintlig rad ändrats. En
avbruten skrivning lämnar en oläsbar rad som räknas och hoppas över. Årets redan spelade
matcher har bara återskapade prognoser och kommer aldrig in i journalen. Ett provbygge
2026-10-17 (till en tillfällig katalog) loggade 131 matcher – alla inom 14 dagar, inga
dubbletter – och EFL-cupens omgång 4 utan marknad, eftersom DraftKings-oddsen kommer först
7 dagar före avspark.

**Vilken prognos som räknas.** Den sista raden före avspark enligt dagens spelprogram –
flyttas en match räknas raderna före den faktiska avsparken. Matchvyn visar den med
loggningstid, rättad mot facit, och skillnaden mot den återskapade prognosen. Listan Spelade
visar journalens prognos; kursiv = matchen loggades aldrig och prognosen är återskapad.

**Utvärderingen** (fliken Utvärdering), mot ställningen efter 90 minuter (okänd = matchen
utvärderas inte):

- **Brier och log-poäng** per prognos och i snitt, mot (c) marknaden, Betfair Exchange vid
  stängning (ligorna – marknaden vid avspark), (b) och (a), alltid på de matcher där båda
  finns. Skillnad modell − baslinje med 95 % bootstrap-intervall.
- **Kalibrering:** alla tre utfallen per match i korgar om tio procentenheter, med antal
  per korg och Wilson-intervall.
- **Att gå vidare** i cuperna mot vem som gick vidare (ESPN:s vinnarflagga, som tar med
  straffar – kontrollerat på EFL-cupen 2026/27), jämfört med slantsingling.
- **Värdespel (sekundärt):** 1 insatt på varje utfall där modellens sannolikhet × oddsen i
  journalraden > 1, vinst per 100 insatta, med antal spel.
- **Per tävling och per regelversion**, och en kontroll av luckor: spelade matcher utan
  journalpost efter att journalen startat visas i rött.

Verifierat 2026-10-17 lokalt med en **testjournal** (återskapade prognoser loggade ett dygn
före avspark, aldrig committad): 324 matcher gav modellen +0,011 mot marknaden och −0,109
mot (b) i log-poäng, i linje med kontrollen mot 2025/26; rader loggade efter avspark
räknades inte, och "för få"-läget visades med 5 matcher. Den riktiga journalen är tom tills
första körningen på GitHub Actions efter push.

## Backtestet och kandidatjakten (fas 4)

### Backtestet

`npm run backtest` ([src/backtest.js](src/backtest.js), ~1,5 min på 9 trådar). Varje match i
varje säsong som går att använda får en prognos skattad bara på matcherna före matchdagen,
med exakt samma kod som den skarpa prognosen (`predict`/`fitAt`) – fönstret expanderar dag
för dag. Resultatet skrivs till `data/backtest/<regelversion>.json`, committas och visas
under Modell: mot baslinjerna totalt, per säsong (diagram + tabell) och per division.

- **Säsonger:** 2004/05–2025/26 plus pågående 2026/27 till senaste spelade match.
  football-data.co.uk har ligorna från 2000/01 och modellen behöver `historySeasons` (4)
  säsonger bakåt. National League finns från 2005/06, så lag som flyttats upp därifrån har
  kortare historik de första åren. Cupmatcher finns bara från 2021/22 (FA-cupen hos ESPN) –
  före dess skattas modellen utan cupmatcher; EFL-cupen finns bara för 2026/27.
- **Baslinjer:** (a) och (b) som i den skarpa prognosen; (c) marknadssnittet vid öppning
  (Betbrain-snittet t.o.m. 2018/19, därefter football-data.co.uk:s marknadssnitt) från
  2005/06; Pinnacle vid stängning 2012/13–2025/26 (ungefär hälften av 2025/26).
- **Osäkerhet:** 95 % bootstrap-intervall där hela matchdagar dras om (2 000 dragningar) –
  matcher samma dag delar skattning och är inte oberoende.
- **Cache:** prognoserna per match sparas i `data/cache/backtest_<variant>.json` per
  regelversion, variant och historikens innehåll (inte hämttiden – avslutade säsonger
  hämtas om var 30:e dag men ändras inte). Pågående säsong räknas alltid om.

- **Faktorer:** regelkonfigens vikt (tabelläget, β = 0,0373) är skattad på alla säsonger.
  Backtestet skattar i stället vikten om säsong för säsong enbart på tidigare säsongers
  prognoser (den första säsongen utan faktor), så att det förblir walk-forward. Vikten
  varierade mellan 0,022 och 0,055 de första säsongerna och har legat på 0,034–0,040
  sedan 2017/18.

**Resultat** (regelversion 2026-10-17.2, körd 2026-10-17, 45 712 matcher):

| Ligorna, mot | Matcher | Modell | Baslinje | Skillnad | Brier modell / baslinje |
|---|---|---|---|---|---|
| (b) Poisson på säsongens mål | 39 624 | 1,038 | 1,069 | −0,031 (−0,034 till −0,027) | 0,625 / 0,642 |
| (a) Naiv | 44 943 | 1,039 | 1,076 | −0,036 (−0,039 till −0,034) | 0,625 / 0,651 |
| (c) Marknaden, öppning | 42 913 | 1,039 | 1,028 | +0,011 (+0,010 till +0,012) | 0,625 / 0,617 |
| Pinnacle, stängning | 27 001 | 1,038 | 1,022 | +0,016 (+0,014 till +0,018) | 0,624 / 0,613 |

Mot regelversion 2026-10-17.1 på samma matcher: log-poäng 1,0400 → 1,0394 (−0,0006), som i
kandidatjakten. Båda versionernas backtest ligger i `data/backtest/` och visas under Modell.

45 678 av 45 712 matcher fick en modellprognos (övriga: för lite underlag för ett lag).
Modellen slår (b) i **alla 22 hela säsonger** med intervallet under noll, och i alla fyra
divisionerna (−0,028 till −0,035). Den ligger **efter marknaden i alla 21 säsonger med
odds** – intervallet över noll i alla utom 2006/07–2008/09 och 2011/12 – och avståndet har
vuxit: kring +0,004 2006/07–2008/09, kring +0,015 de senaste säsongerna (marknaden har
blivit skarpare). Mot Pinnacle-stängningen är modellen sämre i alla 14 säsonger. FA-cupen
2021/22–2025/26 (672 matcher): 0,992 mot naiv 1,071; att gå vidare 0,597 (slantsingling
0,693). EFL-cupen finns bara för 2026/27 (76 matcher): 0,856 mot naiv 1,072. Pågående
säsong t.o.m. 2026-10-17 (436 ligamatcher): −0,107 mot (b), som är extrem tidigt på
säsongen, och +0,012 mot (c). Siffrorna för regelversion 2026-10-17.1 står i
`data/backtest/2026-10-17.1.json`.

### Kandidatjakten

`npm run kandidater` ([src/candidates.js](src/candidates.js), ~17 min första gången på
9 trådar; avslutade säsonger cachas). Körs för hand när tillräckligt många nya matcher
spelats – inte i bygget. Loggen `data/backtest/candidates.json` committas och visas under
Modell.

**Kravet** (skrivet 2026-10-17, före första körningen):

1. Walk-forward: varje prognos skattas bara på matcher före matchdagen, och en faktors
   vikt bara på tidigare säsonger.
2. Log-poäng: kandidat − grundmodell under noll på samma matcher, med hela
   bootstrap-intervallet under noll (matchdagar dras om). Intervallet är 95 % justerat för
   antalet kandidater i körningen (Bonferroni: 13 kandidater → 99,62 %).
3. Stabilt: lägre log-poäng i både första och andra halvan av säsongerna.
4. Brier-poängen får inte bli sämre.

Två slags kandidater: **regel** – ett annat värde på ett reglage i
[config/forecast-rules.js](config/forecast-rules.js); hela backtestet körs om med värdet,
samma kod som den skarpa prognosen. **Faktor** – en signal ovanpå grundmodellen:
log λ<sub>hemma</sub> += β·z, log λ<sub>borta</sub> −= β·z, där z är skillnaden mellan
lagen och β skattas med maximum likelihood säsong för säsong enbart på tidigare säsongers
backtestprognoser (första säsongen räknas därför inte). Marknaden blandas log-linjärt,
p ∝ modell<sup>1−w</sup> · marknad<sup>w</sup>, med w skattad på samma sätt.
**Kombinationssteget** (lades till efter provkörningen, när två faktorer klarat kravet):
godkända faktorer prövas tillsammans med gemensamt skattade vikter och samma krav, och
kombinationen måste dessutom slå varje del ensam. Marknaden kombineras inte – den ersätter
modellen snarare än justerar den.

**Utfall 2026-10-17** (grundmodell = regelversion 2026-10-17.1; log-poäng, kandidat −
grundmodell, intervall 99,62 %):

| Kandidat | Typ | Matcher | Skillnad | Halvorna | Utfall |
|---|---|---|---|---|---|
| Halveringstid 180 dagar | regel | 45 678 | −0,0005 (−0,0016 till +0,0007) | −0,0007 / −0,0002 | underkänd – intervallet når noll |
| Halveringstid 730 dagar | regel | 45 678 | +0,0033 (+0,0026 till +0,0041) | +0,0034 / +0,0032 | underkänd – sämre |
| Fönster två säsonger bakåt | regel | 45 678 | +0,0003 (−0,0002 till +0,0010) | +0,0003 / +0,0004 | underkänd – sämre |
| Fönster sex säsonger bakåt | regel | 41 627 | ±0,0000 (−0,0002 till +0,0001) | −0,0001 / ±0,0000 | underkänd – ingen skillnad |
| Hemmafördel per division | regel | 45 678 | −0,0001 (−0,0004 till +0,0003) | −0,0003 / +0,0002 | underkänd – intervallet når noll |
| Cupmatcher utanför skattningen (2021/22–) | regel | 11 247 | +0,0010 (−0,0003 till +0,0022) | +0,0012 / +0,0007 | underkänd – sämre |
| Cupmatcher med halv vikt, rotation (2021/22–) | regel | 11 351 | +0,0002 (−0,0003 till +0,0008) | +0,0003 / +0,0001 | underkänd – sämre |
| Skott på mål i skattningen (hälften) | regel | 45 678 | −0,0005 (−0,0015 till +0,0005) | −0,0009 / −0,0002 | underkänd – intervallet når noll |
| xG i skattningen (hälften), PL 2014/15– | regel | 4 625 | −0,0011 (−0,0039 till +0,0013) | −0,0013 / −0,0008 | underkänd – intervallet når noll |
| Form: poäng per match, senaste fem | faktor | 43 656 | −0,0004 (−0,0006 till −0,0002) | −0,0001 / −0,0006 | **godkänd** |
| Tabelläge: poäng per match i år | faktor | 42 921 | −0,0006 (−0,0009 till −0,0002) | −0,0004 / −0,0008 | **godkänd, införd i 2026-10-17.2** |
| Inbördes möten: målskillnad, senaste sex | faktor | 43 656 | ±0,0000 (−0,0001 till +0,0002) | ±0,0000 / ±0,0000 | underkänd – ingen skillnad |
| Marknadens odds som faktor | faktor | 40 884 | −0,0117 (−0,0139 till −0,0098) | −0,0100 / −0,0139 | **godkänd** |
| Kombination: form + tabelläge | kombination | 43 656 | −0,0005 (−0,0009 till −0,0002) | −0,0002 / −0,0008 | underkänd – inte bättre än tabelläget ensamt |

Läsning:

- **Inget i modellens struktur behöver ändras.** Halveringstid 365 dagar, fyra säsonger
  bakåt, gemensam hemmafördel och cupmatcher med full vikt håller; 730 dagar är tydligt
  sämre, och att ta bort cupmatcherna gör prognosen sämre (cupmötena kopplar ihop nivåerna).
  Skott på mål och xG pekar åt rätt håll men räcker inte – xG finns bara för
  Premier League och 4 625 matcher.
- **Form och tabelläge klarar kravet, men effekten är liten:** −0,0004 och −0,0006 i
  log-poäng, en tjugondel av avståndet till marknaden. Skattat: +1,9 % mål per poäng/match
  bättre form, +3,8 % per poäng/match högre i tabellen. Båda håller även med hela månader
  eller hela säsonger som bootstrapenhet. Tillsammans (−0,0005) är de inte bättre än
  tabelläget ensamt – formen tillför inget utöver tabellen.
- **Marknaden klarar kravet med marginal, men vikten blev 100 %:** den bästa log-linjära
  blandningen är marknaden ensam, säsong för säsong. Modellen tillför alltså inget utöver
  öppningsoddsen. Att "införa" kandidaten vore att ersätta modellen med oddsen – då vore
  jämförelsen mot (c) meningslös och sidan inte längre en egen prognos.
- **Tabelläget infördes** som regelversion 2026-10-17.2 efter användarens beslut; formen
  och marknaden inte (se Beslut). En kandidat som blivit regelversion prövas inte igen –
  nästa kandidatjakt prövar övriga kandidater ovanpå version 2026-10-17.2.

**Går inte att pröva än:**

| Idé | Varför |
|---|---|
| xG från football-data.co.uk | Finns bara från 2026/27 och leverantören är odokumenterad. Prövas när säsongen gett tillräckligt med matcher. |
| Skador och avstängningar (FPL) | Bara dagens läge, ingen historik – och bara Premier League. |
| Startelvor | Ingen fri källa med historik. |
| Tabell med poängavdrag (ESPN) | Ögonblicksbild utan historik; prövad i stället som tabell räknad ur resultaten. |
| Rotation i EFL-cupen | EFL-cupens tidigare säsonger hämtas inte; rotationen prövad på FA-cupen 2021/22–. |
| Marknaden i cuperna | Fri cupoddshistorik saknas; kan bara utvärderas framåt i journalen. |

**När en kandidat klarar kravet** ändras prognosen inte av sig själv. Den blir en ny
regelversion med datum i [config/forecast-rules.js](config/forecast-rules.js) först efter
beslut, eftersom det ändrar prognoserna som loggas i journalen från nästa körning; därefter
körs `npm run backtest` för den nya versionen (en fil per regelversion i `data/backtest/`).
En omkörning på samma underlag skriver inga nya poster i loggen; nya matcher, ny data eller
en ny regelversion ger en ny post per kandidat med datum.

## Matchanalysen (fas 5)

Valfri och **avstängd som standard**. När den är påslagen har matchvyn för en kommande
match med prognos ett kort *Analys* med knappen **Analysera**. Ett klick ger en kort text
(3–5 meningar) som DeepSeek skriver ur matchens underlag och, under rubriken
*Nyhetsläget*, 4–8 meningar ur nyheter som hämtas online just då, med hänvisningar och en
källista med länkar. Allt är märkt *genererad text* med modell, när den skrevs, vilket
bygge underlaget kommer ur och när nyheterna hämtades. Är modulen avstängd, saknar
proxyn nyckel eller fallerar API:t ser sidan ut som annars – kortet säger bara varför det
inte blev någon text.

```
knappen  →  proxyn (Cloudflare Worker, nyckeln som hemlighet)  →  DeepSeek
              ↑ hämtar <sajten>/data/match/<id>.json själv
              ↑ hämtar nyheterna (Bing News, ESPN, BBC Sport, Open-Meteo)
```

- **Underlaget** ([worker/analysis.mjs](worker/analysis.mjs)) är det matchvyn visar, med
  sidans precision: prognosen (1X2 i hela procent, osäkerhet, förväntade mål med en
  decimal, över 2,5, båda gör mål, troligaste resultat, gå vidare), stegen i *Vad drog åt
  vilket håll*, baslinjerna och marknaden, oddsen, *Lagen sida vid sida*, form, möten,
  skador och listan med okänt – med källor och "t.o.m."-datum men utan hämttider. Cirka
  1 600 tokens plus prompten (~700).
- **Nyhetsläget** ([src/news.mjs](src/news.mjs), [config/news.js](config/news.js)) läggs i
  underlaget som avsnittet `nyheter`: artiklar från de senaste 10 dagarna om matchen eller
  lagen via Bing News (RSS, brittiska medier), ESPN och BBC Sports lagflöden, högst 14,
  förhandsartiklar och skade- och truppnyheter först; för högst 8 hämtas texten (2 500
  tecken, bara till modellen – den visas aldrig på sajten). Spelreklam, tips och
  tittarguider filtreras bort; betalväggar ger bara rubrik och ingress. Väderprognos vid
  avspark från Open-Meteo. En källa som inte svarar står som okänd och resten används.
  Nyheterna hämtas högst var 30:e minut per match och sparas en timme. Underlaget växer
  till cirka 8 000 tokens. Provkörs utan språkmodell: `node src/news-cli.mjs nästa`.
- **Prompten** står i [config/llm.js](config/llm.js): bara underlaget, ingen egen kunskap om
  lag eller spelare, varje tal skrivet som i underlaget, inga egna uträkningar, okänt
  sägs vara okänt, prognosen är huvudsaken och underlaget som inte styr den sägs inte
  vara orsaker, inga spelråd, lag- och tävlingsnamn på engelska. Med Nyhetsläget
  (`news: true`) en egen prompt: analysen bara ur sidans underlag, nyhetsavsnittet bara ur
  `nyheter`, varje påstående hänvisat till artikeln och källan, sammanfattat med egna
  ord, utan egna sannolikheter, och motsägelser mot sidans skadelista sägs. Svaret är JSON
  (`{"analys": …, "nyheter": …}`, DeepSeeks JSON-läge), tänkande på låg nivå. Hänvisningarna
  numreras om till [1], [2] … i den ordning de citeras, och källistan visar bara de
  citerade artiklarna.
- **Sifferkontroll:** varje tal i texten – siffror och räkneord två–tjugo, i båda
  avsnitten – måste finnas i underlaget (tal ur nyheterna finns där). Annars ett nytt
  försök där talen pekas ut; klarar inte heller det kontrollen visas ingen text ("Texten
  innehöll tal som inte finns i underlaget …"). Samma för hänvisningar till artiklar som
  inte finns.
- **Cache på innehållsavtrycket:** SHA-256 av promptversion, modell och underlag (utan
  nyheternas hämttid, så att samma artiklar ger samma text). Samma
  underlag genereras aldrig två gånger – nästa klick, från vem som helst, får texten ur
  cachen (Cloudflare KV, 60 dagar; lokalt `data/cache/analysis/`). Även en avvisad text
  cachas, så att den inte kostar igen. Tillfälliga fel (överlast, timeout, saldo) cachas
  inte.
- **Samma bygge:** svaret säger vilket bygge underlaget lästes ur (`builtAt`, som bygget
  skriver i varje matchfil). Visar sidan ett annat bygge laddas matchen om, så att talen
  i texten och på sidan stämmer.
- **Bara kommande matcher:** proxyn avvisar spelade och påbörjade matcher, matcher utan
  prognos och allt som inte är ett match-id.
- **Kostnad** (DeepSeeks prislista 2026-10-18, deepseek-v4-pro: $1,32 / $3,96 per miljon
  tokens in/ut, halva priset utanför 01–04 och 06–10 UTC på vardagar): uppskattat
  $0,015–0,02 per ny text med Nyhetsläget ($0,005–0,009 utan), högst två anrop per text.
  Cachade klick kostar inget. Proxyn ryms i Cloudflares gratisnivå (se Kända brister om
  processortiden). DeepSeek är förbetalt, så saldot är taket.

**Verifierat 2026-10-18** med ett simulerat DeepSeek-API (ingen riktig nyckel fanns): den
lokala routen och själva Workern i Cloudflares körmiljö (`wrangler dev`, workerd) – text,
cache-träff utan nytt anrop, avvisad text (och cachad avvisning), godkänd text vid andra
försöket, överlast, långsamt svar ("Skriver …"), proxy utan nyckel, proxy som inte svarar, äldre bygge på
sidan än i analysen. I webbläsaren: av (standardkonfigen – inget kort, ingen extra text,
inga konsolfel), på, utan nyckel, mobilbredd, ljust och mörkt. Nyhetsläget med riktig
hämtning (inte simulerad), lokalt och i workerd: 14 artiklar på 2–3 s, hänvisningar
omnumrerade och källista med länkar, samma artiklar 31 minuter senare gav cachad text,
påhittad hänvisning gav nytt försök och sedan avvisning, alla nyhetskällor nere gav en
text som inte cachades, `news: false` gav samma beteende som utan nyheter. (Provet i
workerd hittade en bugg som Node inte visar – `fetch` anropad som metod gav "Illegal
invocation" – rättad före commit.)
**Inte verifierat:** riktiga svar från deepseek-v4-pro – hur ofta texten klarar
sifferkontrollen, verklig kostnad per text och svarstid.

**Läge 2026-10-18:** påslagen. Proxyn ligger på
<https://profeterna-analys.fritid-moln.workers.dev/analyze> (Cloudflare-kontot fritid-moln,
samma som Fritid; wrangler är inloggad på MacBook Air) och nyckeln är lagd som hemlighet.
Första riktiga svaret (Tottenham–Coventry) kom på 17 s och klarade kontrollen. Proxyn driftsattes från commit 4da2d4e – senare ändringar i `worker/`,
`src/news.mjs` eller `config/llm.js` når den först vid nästa `deploy`.

**Slå på** (kräver konton hos DeepSeek och Cloudflare, och Node ≥ 22 för wrangler):

1. Skapa en API-nyckel på <https://platform.deepseek.com> och fyll på saldo.
2. `npx wrangler@4.147.0 login`
3. `npx wrangler@4.147.0 kv namespace create ANALYSER --config worker/wrangler.toml` och
   byt `id` i [worker/wrangler.toml](worker/wrangler.toml) mot det som skrivs ut.
4. `npx wrangler@4.147.0 secret put DEEPSEEK_API_KEY --config worker/wrangler.toml` – klistra
   in nyckeln när wrangler frågar. Den hamnar bara hos Cloudflare.
5. `npx wrangler@4.147.0 deploy --config worker/wrangler.toml` – skriver ut adressen,
   `https://profeterna-analys.<konto>.workers.dev`.
6. I [config/llm.js](config/llm.js): `enabled: true` och `endpoint:
   'https://profeterna-analys.<konto>.workers.dev/analyze'`. Committa och pusha – nästa
   bygge visar knappen.

**Stänga av:** `enabled: false` och push – knappen försvinner vid nästa bygge. Bara
Nyhetsläget: `news: false` och `deploy` igen. Ändras
prompten, modellen eller underlaget: byt `promptVersion` i konfigen och kör `deploy` igen
(proxyn bygger in konfigen vid deploy).

## Kupongen

Gängets gemensamma kupong för omgången: de utvalda matcherna med ett tecken var – `1`, `X`,
`2` eller en gardering (`1X`, `X2`, `12`, `1X2`). Det som räknas är antal rätt, mot
ställningen efter 90 minuter (samma utfall som prognosen).

**Var den syns**

- **Förstasidan:** ett kort under rubriken med antal rätt och en prick per match – grön
  fylld = rätt, röd fylld = fel, pulserande ring = pågår (grön/röd efter om tecknet håller
  just nu), grå ring = inte startad. Kortet visar kupongen som pågår, annars nästa, annars
  den senaste i fyra dagar efter sista matchen. Utan kupong: knappen *Skapa kupong*.
- **Fliken Kupong** (`#kupong`, `#kupong/<id>`): antal rätt, en skala med rätt, möjliga och
  modellens väntade antal rätt, och varje match med vårt tecken som tre rutor (valda fyllda,
  utfallet grönt om vi hade det och rödringat om inte), modellens tips som en prick under
  rutan och modellens chans för vårt tecken. Under: tidigare kuponger med staplar för andel
  rätt mot hur många rätt modellens tips hade gett, och länken *Historik* (en färdig kupong
  länkas som `historik.html#<id>`).
- **Väntat antal rätt** = spelade matcher som de gick + modellens sannolikhet för vårt tecken
  i resten (prognosen före avspark ur journalen om den finns, annars sajtens prognos).
- **Live:** medan en kupongmatch pågår hämtar sidan ESPN:s scoreboard varje minut, direkt i
  webbläsaren (se Datakällor). Går matchen till förlängning väntar rättningen på nästa
  bygge, som räknar fram ställningen efter 90 minuter ur målminuterna. Svarar inte ESPN
  visas det, och kupongen rättas mot `matches.json` som vanligt.

**Skapa och spara**

1. *Kupong → Ny kupong* (`#kupong/ny`): sök lag eller filtrera på tävling, tryck 1, X
   eller 2 på matcherna (flera tecken = gardering). En vald match får ett fält för en
   valfri anteckning (högst 140 tecken), t.ex. vem som drev tecknet – den visas under
   lagnamnen i kupongvyn och följer med till Historik. Utkastet sparas i webbläsaren.
2. *Spara kupong* → *Spara på GitHub* öppnar GitHub med filen ifylld
   (`data/kuponger/<datum för första matchen>.json`). Tryck **Commit changes** (kräver
   inloggning med skrivrätt till repot). Pushen startar workflowen och kupongen syns för
   alla efter bygget, några minuter senare. Git-historiken visar när kupongen lades.
3. Tills dess visas kupongen i den webbläsaren där den skapades, märkt *väntar på GitHub*.
   Märkningen försvinner när den publicerade kupongen är likadan, och glöms efter tre dygn.

**Ändra:** knappen *Ändra* (bara medan någon match återstår). Startade matcher ligger kvar
som de är, med sina anteckningar. GitHub kan inte fylla i en fil som redan finns, så *Spara på GitHub* kopierar
innehållet och öppnar filen för redigering – markera allt, klistra in, Commit changes.
**Ta bort:** radera filen på GitHub.

**Filen** (går också att skriva för hand; `match` är bara för läsaren, `id` är ESPN:s
matchid):

```json
{
  "namn": "Omgång 9",
  "skapad": "2026-10-16T18:20:11.000Z",
  "matcher": [
    { "id": "401879263", "match": "AFC Bournemouth – Sunderland", "tecken": "1" },
    { "id": "401879260", "match": "Leeds United – Manchester United", "tecken": "X2", "kommentar": "Teijder drev X2" }
  ]
}
```

En trasig fil stoppar inte bygget; felet visas längst ned under fliken Kupong. Lokalt går
det att prova med en egen mapp: `KUPONG_DIR=/tmp/kuponger npm run build`.

## Kuponghistoriken

Sidan **Historik** (`historik.html`, länkad från fliken Kupong) visar varje färdigspelad
kupong: antal rätt, en prick per match, betyget, AI:ns kommentar och – under *Matcherna* –
varje match med tecken, resultat, modellens chans och gängets anteckning. Överst antal
kuponger, andel rätt, snittbetyg och antal rätt mot det väntade, och en stapel per kupong
(andel rätt, strecket = väntat). Sorteras efter *Senaste*, *Betyg*, *Andel rätt* eller
*Mot modellen* (rätt jämfört med modellens tips); ett tryck till vänder ordningen.

**Betyget** (1–5 stjärnor: Mycket svagt, Svagt, Som väntat, Bra, Utmärkt) räknas fram, inte
sätts för hand. Väntat antal rätt = summan av modellens chans för gängets tecken före
avspark (journalen om den finns, annars sajtens prognos). Saknas modellen för en match –
t.ex. på en kupong lagd någon annanstans – används en schablon: 45 % för ett tecken, 75 %
för två. `z = (rätt − väntat) / √(Σ p(1−p))` (spridningen minst √0,5), och betyget är 5
vid z ≥ 1,25, 4 vid ≥ 0,5, 3 vid > −0,5, 2 vid > −1,25, annars 1. En skräll som sitter
lyfter alltså mer än en storfavorit, och en rätt mer än väntat väger tyngre på en kort
kupong. Grunden står i [src/history.js](src/history.js).

**AI-kommentaren** skrivs av samma språkmodell och proxy som matchanalysen
(`POST …/kommentar {"id"}`, [worker/kommentar.mjs](worker/kommentar.mjs)): 2–4 meningar
i saklig ton, utan skämt, som tar upp anteckningarna ("Teijder drev X2"). Proxyn tar bara ett
kupong-id och läser kupongen ur den publicerade `data/historik.json`. Samma regler som
analysen: inga egna fakta om lag och matcher, inga påhittade målförlopp, och varje tal ska
finnas i underlaget (annars skrivs texten om, därefter visas ingen). Texten cachas utan
slutdatum per kupong och underlag. Prompten står i [config/kommentar.js](config/kommentar.js).

**Filen** `data/kupong-historik.json` är själva historiken och committas:

- När varje match på en kupong ur `data/kuponger/` är spelad fryser bygget på GitHub
  Actions (`--journal`) in den med resultat efter 90 minuter, modellens prognos och
  anteckningarna – så finns den kvar när säsongens matcher inte längre gör det. Nästa
  bygge hämtar AI:ns kommentar från proxyn och skriver in den (`"ai"`). Steget *Committa
  prognosjournalen och kuponghistoriken* committar filen. Lokalt visas en färdig kupong
  ändå, bara inte fryst.
- Kuponger lagda någon annanstans (t.ex. Stryktipset) läggs in för hand i samma format,
  utan `"källa"`. `resultat` är ställningen efter 90 minuter; finns bara utfallet, skriv
  `"utfall": "1"`. `"struken": true` = matchen spelades inte. `modell`, `kommentar`, `spel`
  och `till` är valfria. En kupong med fel visas som fel men tas aldrig bort ur filen.

```json
{
  "kuponger": [
    {
      "id": "2026-10-10",
      "namn": "Omgång 8",
      "datum": "2026-10-10",
      "till": "2026-10-11",
      "källa": "sidan",
      "matcher": [
        { "match": "Arsenal – Leeds United", "tecken": "1", "resultat": "2–1", "modell": [68, 20, 12], "id": "401879268" },
        { "match": "Aston Villa – Brentford", "tecken": "1X", "resultat": "2–2", "modell": [52, 25, 23], "kommentar": "Halvgarderad efter lång diskussion", "id": "401878776" }
      ],
      "ai": { "text": "…", "modell": "deepseek-v4-pro", "skriven": "2026-10-12T08:07:00.000Z" }
    }
  ]
}
```

Lokalt med egna filer: `KUPONG_DIR=/tmp/kuponger KUPONG_HISTORIK=/tmp/historik.json npm run build`.

## Statusmärkning

Räknas om i webbläsaren ur hämttid och källans gräns – stannar den schemalagda hämtningen
blir källorna gula av sig själva, och sidhuvudet varnar när senaste bygget är mer än fyra
schemaintervall gammalt.

- **Grön (färsk):** inom källans normala intervall.
- **Gul (gammal):** data finns men är äldre än väntat – visas med sitt datum.
- **Röd (fel):** senaste hämtningen misslyckades; senaste lyckade data visas med sitt datum.
- **Grå (okänt):** inget verifierbart innehåll (t.ex. FA-cupen innan första omgången lottats).

## Kända brister (fas 1–5)

- ESPN-oddsen sparas bara som senaste ögonblicksbild i cachen. Oddsen vid
  prognostillfället finns från fas 3 i journalen, men bara för loggade matcher.
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
  repot. Journalens commits håller det vid liv under säsongen, men i sommaruppehållet
  (slutet av maj–början av augusti) skrivs inga rader – säsongsbytet kräver ändå en push,
  som räknas som aktivitet. Har schemat stängts av: *Actions → workflowen → Enable*.
- **Fas 2:** årets matcher fram till 2026-10-17 har bara återskapade prognoser, inte
  prognoser publicerade före avspark – äkta out-of-sample börjar med journalen.
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
- **Fas 3:** `loggedAt` är byggets klocka; det offentliga beviset är commit-tiden på GitHub,
  som kan ligga någon minut senare. Går en commit inte igenom loggas raderna om i nästa
  körning med ny tid.
- Journalens storlek är uppskattad, inte mätt: ~0,4 kB per rad och omkring 5–15 rader per
  match under 14 dagar ger några MB per säsong. En fil per säsong håller den nere.
- Dubbelmöten (EFL-cupens semifinaler) utvärderas inte för att gå vidare än: hur ESPN
  markerar vinnaren av ett dubbelmöte är inte kontrollerat. 1X2 utvärderas som vanligt.
- Ligamarknaden i journalen är öppningsodds från fixtures.csv (fre/tis) – en match som
  loggas innan de lagts ut har (c) okänd tills nästa rad. Värdespelen räknas mot
  marknadssnittet, inte bästa odds.
- Matchvyn för en spelad match visar resten av underlaget (steg för steg, baslinjerna,
  resultatmatrisen) från den återskapade prognosen, inte från journalraden.
- **Fas 4:** backtestet och kandidatjakten körs inte i bygget. Det som visas under Modell
  gäller körningens datum och regelversion; ändras regelversionen utan ny körning står
  backtestet som okänt.
- Historiken har inga cupmatcher före 2021/22 och EFL-cupen bara för 2026/27, så backtestet
  skattar modellen utan cupmöten de åren – till skillnad från den skarpa prognosen.
- Bootstrap per matchdag tar hänsyn till att matcher samma dag delar skattning, men inte
  till att felen för ett lag hänger ihop över veckor. Kontroll 2026-10-17: med hela månader
  eller hela säsonger som enhet blev intervallen något bredare och samma kandidater klarade
  kravet.
- Kandidaternas värden är a priori-val; andra värden (t.ex. 270 dagars halveringstid) är
  inte prövade. Att pröva många värden och välja det bästa vore datamining – Bonferroni
  täcker bara de kandidater som faktiskt körts.
- Tabelläget räknas ur resultaten, utan poängavdrag – ett lag med avdrag får sin "sportsliga"
  tabell, inte den officiella som ESPN visar. Formen räknar alla tävlingar i underlaget –
  före 2021/22 alltså bara ligamatcher.
- Tabellägets vikt är fryst i regelkonfigen (skattad 2026-10-17). Den skattas inte om
  löpande; en ny vikt kräver en ny regelversion. Skattningen säsong för säsong i backtestet
  har legat på 0,034–0,040 sedan 2017/18.
- Övergången till 2026-10-17.2 ger nya journalrader för alla matcher inom 14 dagar vid
  nästa körning (ny regelversion ändrar avtrycket) – avsiktligt, så att journalen visar
  vilken version som gjorde varje prognos.
- **Rättat i fas 4:** baslinje (b) kunde tidigt på säsongen ge 100 % oavgjort eller
  ogiltiga sannolikheter när skattningen saknade ändligt maximum för några lag (hittat i
  backtestet: 33 av 39 657 matcher, 24 av dem i augusti–september 2022). Nu är (b) okänd för de lagen. Inga
  modellprognoser ändras; i år fick en redan spelad match (5 september) (b) okänd, och
  ingen journalrad har haft felet.
- **Fas 5:** sifferkontrollen ser att varje tal finns i underlaget, inte att det används i
  rätt sammanhang – "3 raka segrar" går igenom om talet 3 står någonstans i underlaget, och
  små tal finns nästan alltid (datum, antal matcher). Ordningstal ("tredje") kontrolleras
  inte. Prompten är det främsta skyddet; kontrollen fångar påhittade siffror som 73 %.
- Två klick på samma match innan den första texten är klar ger två anrop; KV är dessutom
  eventuellt konsistent (upp till ~60 s mellan Cloudflares datacenter).
- Ingen gräns för antalet anrop (användarens beslut). En robot som klickar på alla
  kommande matcher efter varje ändring i underlaget kan kosta: ~1 600 matcher × några
  underlagsversioner per dag × $0,005–0,009. Saldot hos DeepSeek är taket.
- Cloudflares gratisnivå tillåter 1 000 skrivningar i KV per dygn. Därutöver cachas inte
  nya texter (analysen fungerar, men nästa klick kostar igen).
- Texten finns bara för kommande matcher och bara i den webbläsare som klickat (och i
  proxyns cache) – den sparas inte i journalen och visas inte efter avspark.
- Prompten och kontrollen är provade mot ett simulerat API, inte mot riktiga svar från
  deepseek-v4-pro (ingen nyckel 2026-10-18).
- **Nyhetsläget:** Cloudflares gratisnivå ger 10 ms processortid per anrop. Att tolka
  RSS och artikelsidor tog 2–4 ms i Node; i den driftsatta Workern är det inte mätt – slår
  den i taket avbryts anropet och kortet visar ett fel (Workers Paid har 30 s).
- Att Bing News, ESPN, BBC och MSN svarar på anrop från Cloudflares adresser är inte
  provat – lokalt svarade alla. En källa som blockerar står som okänd i underlaget.
- Urvalet av artiklar bygger på lagnamn och nyckelord i rubrikerna; en artikel kan
  hamna fel eller missas, och klubbar som det skrivs lite om får få artiklar. Sajter med
  betalvägg (och de som är spärrade på utvecklingsdatorn) bidrar bara med rubrik och
  ingress.
- Artikeltexten (högst 2 500 tecken per artikel) skickas till DeepSeek och sparas en timme
  i proxyns cache, men visas aldrig på sajten; Nyhetsläget ska sammanfatta med egna ord.
- Nyheterna ger en skrivning i KV per hämtning, utöver texten – taket på 1 000 per dygn
  nås därför ungefär dubbelt så fort.
- Svarar ingen nyhetskälla cachas varken nyheterna eller texten (Nyhetsläget blir då
  "okänt"), så varje klick under ett sådant avbrott är ett nytt betalt anrop.
- **Kupongen:** att GitHub fyller i den nya filen ur länken (`?filename=…&value=…`) är
  provat fram till inloggningen 2026-10-18, inte hela vägen till en commit. Märkningen
  *väntar på GitHub* finns bara i webbläsaren där kupongen skapades. Liveställningen bygger
  på ESPN:s inofficiella API, som resten av sajten.

## Säkerhet

Inga nycklar behövs i fas 1–4. `.env` är gitignorerad. Workflowens commit använder
`GITHUB_TOKEN` med `contents: write` bara i byggjobbet.

Matchanalysen (fas 5): `DEEPSEEK_API_KEY` finns bara som Cloudflare-hemlighet i proxyn och,
lokalt, i `.env` – aldrig i repot, i workflowen eller i webbläsaren. Proxyn tar bara emot ett
match-id (siffror) och hämtar underlaget själv från den publicerade sajten, så nyckeln kan
inte användas för egna frågor. CORS är öppet (`*`), eftersom proxyn bara analyserar sajtens
egna, publika matcher. Till DeepSeek skickas bara matchens publika underlag – inklusive
spelarnamn och skadenyheter från Fantasy Premier League – och inga uppgifter om besökaren.
Nyhetsläget hämtar bara öppna källor utan nyckel (Bing News RSS, ESPN, BBC Sport, MSN,
Open-Meteo) och skickar inget om besökaren dit; artikeltexten går bara till DeepSeek.
`.dev.vars` och `.wrangler/` (wranglers lokala hemligheter och tillstånd) är gitignorerade.
