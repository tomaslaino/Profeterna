# Matchfixarna

Hemsida (matchfixarna.se) som gör matchprognoser för Premier League, Championship,
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
- [x] **Mer statistik (2026-10-18):** i matchvyn vila och Europaspel (ny källa: ESPN:s
  Europacuper), domaren med kortsnitt, lagens målprofil och mål mot xG; under Divisioner
  en säsongsprognos (Prognos), programmet framåt och modellens styrka för alla lag. Inget
  av det styr prognoserna (se [Säsongsprognosen](#säsongsprognosen))
- [x] **Statistik som på gravergrav.se (2026-10-19):** Spelare får kolumngrupperna Översikt
  och Avslut, Topp 20 för varje topplista och – i Premier League – speltid, xG, ±xG, xA, per
  90 minuter och FPL-pris. Lag är en ny lagtabell för nivå 1–4 med grupperna Tabell, xG
  (för, emot, ±, motståndets styrka), Spelet (skott, hörnor, kort, över 2,5, båda gör mål),
  Oddsen (poäng mot stängningsoddsen, avkastning) och Truppen; lagkortet visar samma siffror.
  Tabellen är ESPN:s, resten räknas ur football-data.co.uk och visas per match eller som
  skillnad inom samma matcher, eftersom den källan släpar en omgång
  ([src/teamstats.js](src/teamstats.js), `data/teams/<division>.json`). Inget styr prognoserna
- [x] **Speltid och per 90 i hela EFL (2026-10-19):** spelartabellen visar Min, Mål/90 och
  M+A/90 även för Championship, League One och League Two. Minuterna räknas ur ESPN:s
  matchrapporter (startelva, byten och röda kort) för samma matcher som målen i truppen;
  går rapporterna och truppen isär är speltiden okänd. xG per spelare finns fortfarande
  bara i Premier League ([src/fetchers/espnminutes.js](src/fetchers/espnminutes.js))
- [x] **Kupongen:** gängets gemensamma kupong per omgång – utvalda matcher med 1, X, 2 eller
  gardering. Fliken Kupong har omgångens kupong med liveställning från ESPN och
  historiken; förstasidan visar kupongen i korthet. Ny kupong med
  sökning. Matcherna har en egen flik. Sparas som fil i `data/kuponger/` med en commit på GitHub (se [Kupongen](#kupongen))
- [x] **Inför uppgörelsen:** någon skapar omgångens kupong (väljer matcherna) och var och en
  fyller i den för sig (gärna med garderingar). Man ser de andras tips först när man själv
  har lämnat in, och ens egna går att ändra tills matcherna startar. Allas tips blir ett underlag sorterat
  efter hur oeniga vi är, där gängets kupong växer fram (se [Inför uppgörelsen](#inför-uppgörelsen))
- [x] **Kuponghistoriken:** Kupong → Historik med varje färdigspelad kupong – antal rätt,
  betyg 1–5 mot modellens väntade antal rätt, sortering efter hur det gick och en kort
  AI-kommentar som läser gängets anteckningar. Fryses in i `data/kupong-historik.json`
  (se [Kuponghistoriken](#kuponghistoriken))
- [x] **Säsongens tippare:** förstasidan visar under omgångens ruta en topplista över
  säsongen för gängets egna tips – poäng, omgångar, rätt och antal gånger som omgångens
  bästa och sämsta, med modellen som jämförelse. Varje omgång sparas i
  `data/tippar-historik.json` (se [Säsongens tippare](#säsongens-tippare))
- [x] **Olympen (2026-10-19):** en egen flik (`#olympen`) för gängets inbördes kamp om
  tipsen – ställningen med den pågående omgången, en kurva omgång för omgång, inbördes
  möten, spelkassan (10 kr per match till modellens odds), höjdpunkter och hur var och en
  tippar (se [Olympen](#olympen))
- [x] **Enklare sidor (2026-10-19):** matchsidan visar prognosen, jämförelsen med
  spelbolagen, vad som drog åt vilket håll, oddsen, formen och skadorna (namnen i korthet);
  Lagen sida vid sida, Domaren och Trupperna fälls ut. De enkla baslinjerna, FPL:s
  skadetext och lagens skadekort utanför Premier League syns med *Visa detaljer*, xG visas
  på en rad (Understat där den finns) och inbördes möten bara de senaste fem åren.
  Matchlistan visar prognosen i procent som resten av sajten, Ny kupong visar först
  närmaste omgången, fliken Styrka under Tabeller är borta och Modell börjar med en
  förklaring på vanlig svenska
- [x] **Matchrutan (2026-10-19):** en match öppnas i en ruta ovanpå sidan man är på (som
  på gravergrav.se), med flikarna Matchen (mål, kort, byten, statistik och publik från
  ESPN, varje minut medan matchen pågår – bara för påbörjade matcher), Prognos, Startelvor
  (trolig elva, sedan den bekräftade och efter matchen elvorna med mål, kort och byten, på
  en plan, plus avbytare, tränare och vilka som saknas – från 365Scores), Form (formen,
  möten och lagen sida vid sida), Lagen (skador och trupperna) och Domaren. Startelvorna
  och matchhändelserna hämtas i webbläsaren när rutan öppnas och styr inte prognoserna
  ([public/matchruta.js](public/matchruta.js))
- [x] **Höjdpunkter (2026-10-20):** spelade matcher länkar till Viaplays sammandrag, som
  repriserna på gravergrav.se – en spelikon på matchraden och *Höjdpunkter* med längden
  i matchrutans rubrik. Klippet startar direkt i ett litet eget fönster ovanpå sidan. Klippen är gratis med reklam och kräver
  inget konto. Finns för Premier League, Championship, Ligacupen, FA-cupen och enstaka
  League One-matcher; League Two saknas hos Viaplay. Bygget hämtar klippen och knyter dem
  till matcherna på tävling, lag och datum ([src/hojdpunkter.js](src/hojdpunkter.js))
- [x] **Höjdpunkter på YouTube (2026-10-20):** klubbarnas och sändarnas egna sammandrag
  (Sky Sports, Premier League, EFL, FA-cupen och de 92 ligaklubbarnas kanaler) spelas på
  sajten, i en liten spelare nere i hörnet som går att förstora och ligger kvar medan man
  bläddrar. Går ett klipp inte att spela här (spärrat i landet) tar spelaren nästa, och
  när inget går visas Viaplays sammandrag. Viaplay länkas bara för matcher utan
  YouTube-klipp ([public/hojdpunkter.js](public/hojdpunkter.js),
  [config/youtube.js](config/youtube.js))
- [x] **Ladda upp system (2026-10-20):** en skärmbild av systemet ni spelat (Svenska Spels
  app) blir gängets kupong med matcher och tecken. Bilden läses i webbläsaren och lämnar
  aldrig telefonen (se [Ladda upp system](#ladda-upp-system))

## Publicering

Sidan är statisk och ligger på GitHub Pages under matchfixarna.se – samma upplägg som
gravergrav.se:

```
GitHub Actions (var 30:e min)  →  källorna  →  src/build.js  →  _site/ (HTML + data/*.json)
                                                                   ↓
                                    GitHub Pages serverar sajten på matchfixarna.se
```

- Workflowen [.github/workflows/publicera.yml](.github/workflows/publicera.yml) körs på
  minut 7 och 37 varje timme, vid push till `main` och manuellt.
- **Skillnad mot gravergrav.se:** den genererade datan committas inte. Den laddas upp som
  Pages-artefakt, eftersom varje körning annars skulle lägga nya versioner av ~2 000
  matchfiler i git-historiken. Det enda som committas automatiskt är prognosjournalen
  (`data/journal/`) – där är git-historiken själva poängen: den visar offentligt att en
  prognos fanns före avspark och aldrig skrivits om. Se
  [Prognosjournalen och utvärderingen](#prognosjournalen-och-utvärderingen-fas-3) – och
  kuponghistoriken (`data/kupong-historik.json`, se [Kuponghistoriken](#kuponghistoriken))
  och tipparhistoriken (`data/tippar-historik.json`, se [Säsongens tippare](#säsongens-tippare)).
- **Journalens commit:** bygget körs med `--journal`, och steget *Committa
  prognosjournalen och kuponghistoriken* committar bara `data/journal/`,
  `data/kupong-historik.json` och `data/tippar-historik.json`, och bara när de ändrats, som
  `github-actions[bot]` med meddelandet "Prognosjournal: N nya rader" (och/eller
  "kuponghistoriken uppdaterad", "tipparhistoriken uppdaterad"). Jobbet har
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
- **Läge 2026-10-19:** sidan ligger på <https://matchfixarna.se/> (custom domain i
  *Settings → Pages*, HTTPS påtvingat). Gamla <https://tomaslaino.github.io/Profeterna/>
  skickas vidare dit, så även proxyns `site` i [config/llm.js](config/llm.js) fungerar via
  omdirigeringen. profeterna.se registrerades aldrig.
- **Engångsinställningar:** skapa repot på GitHub (publikt, krävs för gratis Pages), välj
  *Settings → Pages → Source: GitHub Actions*, ange matchfixarna.se som custom domain och
  peka domänens A-poster på GitHub Pages (185.199.108.153, .109.153, .110.153, .111.153)
  och `www` som CNAME på tomaslaino.github.io. Domänen måste stå i Pages-inställningen –
  annars visar GitHub "There isn't a GitHub Pages site here" och ett certifikat för
  *.github.io (webbläsaren säger "inte säker").

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
| Skador och avstängningar; speltid, xG/xA, pris och poäng per spelare | Fantasy Premier League (`bootstrap-static`) | PL | 3 h | Status, chans att spela och nyhetstext med datum. Status avser nästa omgång. Speltid och xG (Opta) gäller säsongen hittills, verifierat 2026-10-19. Kopplas till ESPN-truppen inom laget på födelsedatum, annars namnet, bara vid entydig träff (547 av 592 spelare 2026-10-19; okopplade får inga FPL-siffror). |
| Speltid per spelare | ESPN matchsammanfattning (`summary?event=<id>`, samma som oddsen) | CH, L1, L2 | 6 h, bara nya matcher | Verifierat 2026-10-19 för `eng.1`–`eng.4`: båda startelvorna (alltid 11), byten med minut (tilläggstid som `90'+3'`) och röda kort (även andra gula), med samma spelar-id som trupperna. Minuter = in till ut (full tid, byte eller rött), tilläggstid räknas inte, inbytt i tilläggstid = 1 min. Stickprov: matcher per spelare ur rapporterna = truppens för alla 84 spelare i Birmingham, AFC Wimbledon och Accrington; Arsenal och Coventry högst 6 min från FPL per spelare (0,4 % totalt). En rapport är ~400 kB men hämtas en gång per match och sparas kompakt (~50 kB per liga och säsong); 371 matcher tog 10 s. Minuterna räknas för spelarens första matcher i laget upp till truppens antal (truppen släpar ofta en omgång); har rapporterna färre matcher än truppen är speltiden okänd (1 av 1 846 spelare 2026-10-19). |
| National League | football-data.co.uk (`EC`) | underlag för FA-cupens non-league-lag | 12 h | Resultat, skott och odds, ingen xG. |
| Tidigare säsonger, ligorna | football-data.co.uk (`mmz4281/<säsong>/E0–E3, EC.csv`) | PL–L2, National League | 30 d | E0–E3 2000/01–2025/26 (26 säsonger, 52 672 matcher), EC 2005/06–2025/26 (11 234; 2000/01–2004/05 svarar 300). Fulla säsonger utom League One/Two 2019/20 (400/440 matcher, avbruten säsong) och EC 2019/20–2021/22 (451, 477, 506). En fil per säsong, ~0,25 s styck – allt hämtas på ~4 s. Äldre filer är Windows-1252 (t.ex. "King’s Lynn" i EC 2021/22), nyare UTF-8; läses därefter. Sparar resultat, skott och odds (marknadssnitt hette `BbAv` före 2019/20). |
| xG, tidigare säsonger | Understat (`getLeagueData/EPL/<år>`) | PL | 30 d, bara kandidatjakten | 2014/15–2025/26, 380/380 matcher med xG varje säsong (verifierat 2026-10-17), alla 4 560 parade mot football-data.co.uk på (hemma, borta). Hämtas av `npm run kandidater`, inte av bygget – används först om xG-kandidaten klarar kravet. |
| Tidigare säsonger, FA-cupen | ESPN (`eng.fa`, månad för månad) | FA-cupen | 30 d | 2021/22–2025/26, 674 matcher från first round proper (ESPN har längre bak). Enda fria källan till matcher för lag under National League. Rundornas namn varierar mellan säsongerna. ESPN:s flagga för neutral plan är inte satt för Wembley-matcherna. |
| Halvtid, hörnor, kort och domare, tidigare säsonger | football-data.co.uk (samma filer som raden ovan, fler kolumner) | PL–L2, National League – bara sidan Statistik | 30 d | Verifierat 2026-10-18. Egen cache (`fdcouk_stats_*`), så att prognosmotorns underlag och backtestets signatur inte ändras. Halvtidsresultat, kort och domare finns i stort sett alla säsonger sedan 2000/01 (EC sedan 2005/06); domare saknas 2012/13 i E1–EC, och skott, hörnor och frisparkar saknas i EC från 2016/17. Avsparkstid (brittisk tid) från 2019/20, publik bara 2000/01–2001/02. Sparar också marknadssnittets 1X2 och över/under 2,5. |
| Europacuperna (för vila och form) | ESPN (`uefa.champions`, `uefa.europa`, `uefa.europa.conf`, kvalomgångarna i `*_qual` juli–augusti) | PL och cuperna – bara underlag | 3 h | Verifierat 2026-10-18: 234/224/366 matcher 2026/27 med kvalet, nio engelska lag (Brighton i Conference Leagues playoffomgång i augusti). Kopplas på ESPN:s lag-id, samma i alla ESPN:s turneringar. Ingen prognos för matcherna och inte med i prognosmotorns underlag. |
| Domare, kommande ligamatcher | football-data.co.uk (`fixtures.csv`, kolumnen `Referee`) | ligorna | 6 h | Verifierat 2026-10-18: namnet finns för alla 46 kommande matcher i filen (läggs ut med oddsen fre/tis). Domarens historik ur samma statistikfiler som sidan Statistik. |
| Startelvor och frånvaro | 365Scores öppna webb-API (`webws.365scores.com/web/games/` och `/web/game/?gameId=`), hämtas **i webbläsaren** | alla sex | när matchrutan öppnas, varje minut medan matchen pågår | Verifierat 2026-10-19: ingen nyckel, `Access-Control-Allow-Origin: *`. Trolig elva (`NotConfirmed`) dagar före matchen i Premier League och Championship (inte i League One, League Two och EFL-cupen), bekräftad (`Confirmed`) ungefär en timme före avspark, efter matchen elvorna med mål, kort och byten. Spelarnas plats som linje och sida, så planen ritas utan positionstolkning. Vilka som saknas (skada med orsak och väntad återkomst, avstängning) även utanför Premier League. ESPN:s matchid finns inte där: matchen hittas på tävling (PL 7, CH 1, L1 2, L2 3, FA-cupen 8, EFL-cupen 9), avspark inom tre timmar och lagnamn – 505 av 505 matcher 1/9–8/11 2026 hittades (MK Dons heter så där). Samma källa som Gräver Gravs startelvor. Styr inte prognosen. |
| Matchhändelser och lagstatistik | ESPN matchsammanfattning (`summary?event=<id>`, samma som oddsen), hämtas **i webbläsaren** | alla sex | när matchrutan öppnas för en påbörjad match, varje minut medan den pågår | Verifierat 2026-10-19: `Access-Control-Allow-Origin: *`. Mål med assist, självmål och straff, kort, byten, halvtid, lagstatistik (bollinnehav, skott, hörnor, passningar m.m.) och publik. Passningsandelen räknas ur antalen (ESPN avrundar den till en decimal). ~400 kB per match. Styr inte prognosen. |
| Liveställning | ESPN scoreboard (`site.api.espn.com/…/<liga>/scoreboard?dates=YYYYMMDD`), hämtas **i webbläsaren** | kupongens matcher | 1 min medan en kupongmatch pågår | Verifierat 2026-10-18: svarar med `Access-Control-Allow-Origin: *`, så sidan kan hämta direkt. Samma matchid som spelprogrammet. Status, matchminut och ställning; används bara av kupongen, inte av prognosen eller bygget. |
| Målminuter och publik, tidigare säsonger | ESPN (`eng.1`–`eng.4`, månad för månad) | ligorna – bara sidan Statistik | 30 d | Verifierat 2026-10-18. 2021/22–2025/26; grundserien räknas, play-off filtreras bort. Målhändelserna går ihop med slutresultatet i 99,9 % av matcherna, publik finns i 98–100 % per liga och säsong. Kompakt format (`parseCrowd`): målminut med sida och publiksiffra. Årets publik saknas (spelprogrammets format ändras inte). |
| Höjdpunkter (sammandrag) | Viaplays öppna innehålls-API (`content.viaplay.se/pcdash-se/sport/fotboll/<tävling>`) | PL, CH, L1, FA-cupen, EFL-cupen | 30 min | Verifierat 2026-10-20: ingen nyckel, svarar även från USA (GitHub Actions). Viaplay har rättigheterna i Sverige och lägger ut sammandrag som spelas utloggad efter en kort reklamfilm. Listorna *Höjdpunkter* och *Utvalda klipp* per tävling, 40 klipp per sida; sammandragen känns igen på formatet (*Höjdpunkter från Premier League*, *Sporthöjdpunkter*). Premier Leagues femminutersklipp ligger ute en månad, övriga ett år; klipp som faller ur listorna behålls tills de går ut. Inget matchid – matchen hittas på tävling, båda lagen (alias eller ordens början, t.ex. *Bristol C*) och avspark 30 dagar före till 3 dagar efter att klippet lades ut: alla 212 sammandrag med två lag i titeln från säsongens start hittade exakt en match (170 matcher). League Two har inga. Länken går direkt till Viaplays spelare (`viaplay.se/player/default/sport/<guid>`, startar utan Börja titta) och öppnas i ett eget 16:9-fönster på datorn, i ny flik på telefonen – Viaplay tillåter inte att sidorna visas inuti andra sajter (`X-Frame-Options: DENY`, `frame-ancestors 'none'`), så klippen går inte att bädda in. Styr inte prognosen. |
| Höjdpunkter (YouTube) | Kanalernas öppna flöden (`youtube.com/feeds/videos.xml?channel_id=<id>`, de 15 senaste klippen) och oEmbed (`youtube.com/oembed`) | alla sex | 30 min | Ingen nyckel. Kanalerna i [config/youtube.js](config/youtube.js): Premier League, Sky Sports Premier League, Sky Sports Football, EFL och FA-cupen, plus de 92 ligaklubbarnas egna kanaler (id ur Wikidata P2397 och länkarna på klubbarnas sajter, 2026-10-20). Bara klipp med *highlights* i titeln; damlag, ungdomslag, träningsmatcher, EFL Trophy och gamla matcher sorteras bort. oEmbed sorterar bort klipp som inte får bäddas in (401) eller är borta (404). Flödet har ingen landsspärr – spärrade klipp märks i spelaren, som tar nästa. Matchen hittas på lag och tid: utlagt 95 minuter till sex dygn efter avspark; i en klubbs kanal ska motståndaren stå i titeln, i en sändares båda lagen; ett resultat i titeln ska vara matchens. Spelas inbäddat från `youtube-nocookie.com`. Styr inte prognosen. |

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
- När 365Scores publicerar de bekräftade startelvorna (antaget: ungefär en timme före
  avspark, när klubbarna lämnar dem). Troliga elvor fanns 2026-10-19 för 14 av 23
  kommande matcher i Premier League och Championship upp till fem dagar fram (ingen sex
  dagar fram), men för ingen av 61 i League One, League Two och EFL-cupen.
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
  fönster som de kommande matcherna i matchlistan. Hela säsongen varje gång skulle ge hundratals nya rader per
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
- **Mer statistik (2026-10-18, användarens beslut):** sex tillägg byggs på en gång – vila
  och Europaspel, domaren, målprofilen och mål mot xG i matchvyn; säsongsprognos,
  programmet framåt och modellens styrka för alla lag under Divisioner. Allt är underlag
  eller härlett ur prognosmotorns skattningar – ingen ny faktor i prognosen. Vila och
  Europaspel kan prövas som kandidat i kandidatjakten senare.
- **Säsongsprognosen spelas med modellens egna förväntade mål (2026-10-18):** samma som
  prognoserna under Matcher, med osäkerheten i lagens styrka från omskattningarna med
  slumpvikter. Omskattningarna centreras på prognosens förväntade mål; utan det låg de
  förväntade slutpoängen upp till 1,3 poäng från summan av matchprognoserna, med det
  högst 0,25 (inom slumpen för 10 000 simuleringar).
- **Zonerna i säsongsprognosen ur ESPN:s tabellnoter (2026-10-18):** uppflyttning, playoff,
  Champions League och nedflyttning läses per placering, så att regeländringar följer med
  (Championship har playoff för plats 3–8 från 2026/27). Europaplatser via cuperna räknas
  inte, och playoff spelas inte – chansen gäller en playoffplats.
- **Domaren mot divisionens snitt (2026-10-18):** de senaste tre avslutade säsongerna och
  i år, alla nivå 1–5, bara matcher före matchdagen. ▲▼ först från tio matcher och mer
  än två standardfel från snittet – samma gräns som domartabellen på Statistik.
- **Divisioner delas i Tabeller och Statistik (2026-10-18, användarens beslut):** menyvalet
  Divisioner ersätts av två: Tabeller (tabellen, säsongsprognosen och modellens styrka för
  alla lag) och Statistik (översikten, spelarna, lagen, matchbilden och jämförelsen mellan
  divisionerna). Gamla länkar till `divisioner.html` leds vidare till rätt sida.
- **National League tas bort från Tabeller och Statistik (2026-10-19, användarens
  beslut):** sidorna visar nivå 1–4 – inget divisionsval för National League, inga
  National League-lag i Styrka och fyra divisioner i Jämför divisioner. Prognosmotorn
  skattar fortfarande alla fem nivåerna, och National League läses fortfarande för att
  visa var League Twos nykomlingar kom ifrån och tog vägen. Gamla länkar till `#nl/…`
  hamnar på Premier League.
- **Förstasidan och Kupong delas, historiken flyttar till Kupong (2026-10-19, användarens
  önskemål):** förstasidan var samma sida som fliken Kupong. Nu är förstasidan en överblick
  (rubriken, omgångens kupong i korthet och Säkraste spelen) och fliken Kupong har lägena
  Omgången (hela kupongen) och Historik (förut en egen sida, länkad i sidfoten på alla
  sidor). Länken Kuponghistorik i sidfoten tas bort; `historik.html` leder till
  `#kupong/historik`.

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
  skriver `data/evaluation.json` (Utvärdering, sist på Modell-sidan) och journalinfo per match i
  `data/match/<id>.json`. Poängen och bootstrap-jämförelsen är samma kod som kontrollen
  ([src/check.js](src/check.js)). Fallerar utvärderingen byggs sajten ändå.
- **Matchanalys (fas 5, valfri):** [config/llm.js](config/llm.js) (av/på, leverantör,
  modell, prompt), [worker/analysis.mjs](worker/analysis.mjs) (underlaget, avtrycket,
  sifferkontrollen), [worker/index.mjs](worker/index.mjs) (`analyze()` och
  Cloudflare-proxyn, [worker/wrangler.toml](worker/wrangler.toml)) och
  [src/news.mjs](src/news.mjs) med [config/news.js](config/news.js) (Nyhetsläget:
  hämtning, urval, källista). Lokalt kör
  [server.js](server.js) samma `analyze()`. Se [Matchanalysen](#matchanalysen-fas-5).
- **Säsongsprognos:** [src/season.js](src/season.js) körs i slutet av prognosmotorn och
  skriver `data/season.json`: simuleringen per liga, programmet framåt per lag och
  modellens styrka för alla lag i nivå 1–4. Se [Säsongsprognosen](#säsongsprognosen).
- **Kupongen:** [src/coupons.js](src/coupons.js) läser och kontrollerar filerna i
  `data/kuponger/` och bygget skriver `data/kuponger.json`. Rättningen, liveställningen och
  Ny kupong finns i [public/kupong.js](public/kupong.js) och
  [public/kupong.css](public/kupong.css). Se [Kupongen](#kupongen).
- **Inför uppgörelsen:** [worker/samtal.mjs](worker/samtal.mjs) håller omgången och gängets
  egna tips (Cloudflare KV, i tjänsten profeterna-kupong; lokalt filer via
  [server.js](server.js)); vyerna under Kupong → Omgången (steg 1–3) finns i
  [public/samtal.js](public/samtal.js) och [public/samtal.css](public/samtal.css). Se
  [Inför uppgörelsen](#inför-uppgörelsen).
- **Kuponghistoriken:** [src/history.js](src/history.js) rättar färdiga kuponger, räknar
  betyget, fryser in dem i `data/kupong-historik.json` och skriver `data/historik.json`.
  Vyn Kupong → Historik ritas av [public/historik.js](public/historik.js) med
  [public/historik.css](public/historik.css) (gamla `historik.html` leder dit);
  AI-kommentaren skrivs av [worker/kommentar.mjs](worker/kommentar.mjs) med prompten i
  [config/kommentar.js](config/kommentar.js). Se [Kuponghistoriken](#kuponghistoriken).
- **Omgångens och säsongens tippare:** [src/tippare.js](src/tippare.js) sparar varje
  omgång av gängets egna tips i `data/tippar-historik.json` och skriver `data/tippare.json`;
  rutorna på förstasidan ritas av [public/tippare.js](public/tippare.js) med
  [public/tippare.css](public/tippare.css). Poängen räknas av
  [public/tippoang.js](public/tippoang.js), som både bygget och sidan använder. Se
  [Omgångens tippare](#omgångens-tippare).
- **Frontend:** ren HTML/CSS/JS i `public/`, flikarna Matcher, Kupong, Källor och
  Modell (regelversion, backtest, kandidatlogg och sist Utvärdering; `#utvardering`
  leder dit); matchen öppnas i matchrutan (`#match/<id>`, en `<dialog>` ovanpå sidan man
  var på – stängs den går man tillbaka dit) med flikarna Matchen, Prognos, Startelvor,
  Form, Lagen och Domaren och, i Prognos, kortet Analys när matchanalysen är påslagen;
  Startelvor och Matchen hämtas av [public/matchruta.js](public/matchruta.js). Sidorna Tabeller och Statistik
  ([public/tabeller.html](public/tabeller.html), [public/statistik.html](public/statistik.html),
  båda med [public/divisioner.js](public/divisioner.js)); Tabeller har vyn Säsongsprognos. Läser JSON-filerna ovan. Urvalet av kommande/spelade matcher och källornas status
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
loggningstid, rättad mot facit, och skillnaden mot den återskapade prognosen. Matchlistan visar
spelade och kommande matcher i en följd med en nu-linje emellan (de senaste resultaten först,
resten bakom knappen Tidigare matcher). Spelade matcher visar bara resultatet, med
höjdpunkternas spelikon i en egen kolumn framför; journalens prognos och om den slog in efter
90 minuter står i resultatets tooltip (återskapad prognos om matchen aldrig loggades).

**Utvärderingen** (sist på Modell-sidan), mot ställningen efter 90 minuter (okänd = matchen
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
  sidans precision: prognosen som odds (1X2, osäkerhet, över 2,5, båda gör mål, troligaste
  resultat, gå vidare – 58 % blir 1,72, som på sidan), förväntade mål med en decimal,
  stegen i *Vad drog åt vilket håll* (odds, och dragen i procentenheter som staplarna),
  baslinjerna och marknaden som odds utan marginal och i ord om modellen ger lägre eller
  högre odds än marknaden, spelbolagens odds, *Lagen sida vid sida*, form, möten,
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
  lag eller spelare, varje tal skrivet som i underlaget, chanser som odds och aldrig som
  procent, inga egna uträkningar, okänt sägs vara okänt, prognosen är huvudsaken och
  underlaget som inte styr den sägs inte vara orsaker, inga spelråd, lag- och tävlingsnamn
  på engelska. Med Nyhetsläget (`news: true`) en egen prompt: analysen bara ur sidans
  underlag, nyhetsavsnittet bara ur `nyheter`, varje påstående hänvisat till artikeln och
  källan, sammanfattat med egna ord, utan egna sannolikheter, och motsägelser mot sidans
  skadelista sägs. Svaret är JSON (`{"analys": …, "nyheter": …}`, DeepSeeks JSON-läge),
  tänkande på låg nivå. Hänvisningarna numreras om till [1], [2] … i den ordning de citeras,
  och källistan visar bara de citerade artiklarna.
- **Sifferkontroll:** varje tal i texten – siffror och räkneord två–tjugo, i båda
  avsnitten – måste finnas i underlaget (tal ur nyheterna finns där). Prognosen står bara
  som odds, så en chans som modellen räknat om till procent stoppas också. Annars ett nytt
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
Första riktiga svaret (Tottenham–Coventry) kom på 17 s och klarade kontrollen. Senast
driftsatt 2026-10-19 med commiten "AI-texterna anger modellens chanser som odds" (analys
och kupongkommentar med odds i stället för procent; provad mot proxyn samma kväll) –
senare ändringar i `worker/`, `src/news.mjs`, `config/llm.js` eller `config/kommentar.js`
når den först vid nästa `deploy`.

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

## Säsongsprognosen

Under Tabeller → Säsongsprognos. Resten av ligasäsongen spelas 10 000 gånger: varje
återstående match får ett resultat dragen ur prognosmotorns resultatmatris (Dixon–Coles,
samma förväntade mål som prognosen under Matcher), och tabellen räknas ut med poäng,
målskillnad, gjorda mål och sist lott. Läget nu räknas ur ESPN:s resultat med ESPN:s
poängavdrag (kontrollerat mot ESPN:s tabell 2026-10-18: alla 92 lag stämmer).

- **Osäkerheten:** simuleringarna fördelas på de 50 omskattningarna med slumpvikter som
  ger spannet under varje prognos – 200 säsonger per omskattning. Inom en simulering är
  ett lag alltså lika mycket bättre eller sämre än skattningen i alla sina matcher.
- **Kontroll 2026-10-18:** de förväntade slutpoängen ligger högst 0,25 poäng från läget
  nu plus summan av 3 × vinst + oavgjort i lagets återstående matchprognoser; varje
  placering och varje zon summerar till rätt antal lag.
- **Visas:** chansen per zon i hela procent (0 och 100 = i ingen respektive alla
  simuleringar, `<1` och `>99` i stället för att avrunda dit), förväntade poäng med
  spannet för 80 % av simuleringarna, fördelningen över alla placeringar och modellens
  styrka. Programmet framåt: de fem närmaste ligamatcherna med vinstchansen och de
  förväntade poängen per match.
- **Styrkan:** förväntad målskillnad per match mot ett genomsnittligt Premier League-lag
  på neutral plan, ur den senaste skattningen – alla fyra ligorna på samma skala
  (kolumnen Styrka i säsongsprognosen; egen flik fanns till 2026-10-19). National
  League skattas men visas inte.
- **Slumpen** är seedad med dagen och divisionen: samma data samma dag ger samma prognos.
- Körtid ~0,8 s i bygget.

## Kupongen

Gängets gemensamma kupong för omgången: de utvalda matcherna med ett tecken var – `1`, `X`,
`2` eller en gardering (`1X`, `X2`, `12`, `1X2`). Det som räknas är antal rätt, mot
ställningen efter 90 minuter (samma utfall som prognosen).

**Var den syns**

- **Förstasidan** (utan adress, ingen flik – dit leder namnet): rubriken, omgångens kupong
  i korthet och Säkraste spelen. Omgångens kupong är gängets kupong ur omgången som alla
  tippade (se [Inför uppgörelsen](#inför-uppgörelsen)) tills den är färdigspelad, annars den som
  pågår, annars nästa, annars den som spelades färdigt senast; rutan visar antal rätt
  (eller antal matcher), läget, en prick per match och knappen in till kupongen – och
  *+ Ny kupong* när den är färdigspelad.
- **Fliken Kupong** har två lägen överst, *Omgången* och *Historik*.
  *Omgången* (`#kupong`) är hela omgångens kupong: antal rätt, en skala med
  rätt, möjliga och modellens väntade antal rätt, och varje match med vårt tecken som tre
  rutor (valda fyllda, utfallet grönt om vi hade det och rödringat om inte), modellens tips
  som en prick under rutan och modellens chans för vårt tecken. När alla matcher är spelade
  (även om spoilerskyddet döljer resultaten) visas knappen *Skapa ny kupong*, och
  *Betyg och kommentar* leder till kupongen under Historik. Under den står andra kuponger
  som inte är färdigspelade (t.ex. nästa omgångs). Utan kupong: knappen *Skapa kupong*.
  *Historik* (`#kupong/historik`), se [Kuponghistoriken](#kuponghistoriken). Matchlistan ligger under fliken Matcher (`#matcher`) och visar
  prognosen som svenska decimalodds (1 / sannolikheten, t.ex. 1,85), räknade från hela
  procent; på smala mobiler står oddsen på en egen rad under lagen.
- **En viss kupong** (`#kupong/<id>`): samma vy för den kupongen.
- **Väntat antal rätt** = spelade matcher som de gick + modellens sannolikhet för vårt tecken
  i resten (prognosen före avspark ur journalen om den finns, annars sajtens prognos).
- **Live:** medan en kupongmatch pågår hämtar sidan ESPN:s scoreboard varje minut, direkt i
  webbläsaren (se Datakällor) – också för omgångens matcher inför uppgörelsen innan gängets
  kupong finns, så att underlaget och Omgångens tippare visar ställningen. Går matchen till
  förlängning väntar rättningen på nästa bygge, som räknar fram ställningen efter 90
  minuter ur målminuterna. Svarar inte ESPN visas det, och kupongen rättas mot
  `matches.json` som vanligt. En match som ESPN anger som uppskjuten, inställd eller
  avbruten visas så direkt (inte som slutspelad) och räknas inte, redan före nästa bygge.
- **Spoilerskyddet:** en kupong där alla matcher är slut räknas som klar även när skyddet
  döljer resultaten – då visar förstasidan nästa kupong i stället för den gamla.

**Skapa och spara**

1. *Kupong → Ny kupong* (`#kupong/ny`): sök lag eller filtrera på tävling, tryck 1, X
   eller 2 på matcherna (flera tecken = gardering). En vald match får ett fält för en
   valfri anteckning (högst 140 tecken), t.ex. vem som drev tecknet – den visas under
   lagnamnen i kupongvyn och följer med till Historik. Utkastet sparas i webbläsaren.
   Listan visar först närmaste omgången – till och med måndagen efter nästa lördag –
   och *Visa fler dagar* resten av de 14 dagarna; sökningen och *Bara valda* gäller alla
   dagar.
2. *Spara kupong* sparar direkt. Tjänsten *profeterna-kupong* på
   Cloudflare (`POST …/kupong`, [worker/kupong-proxy.mjs](worker/kupong-proxy.mjs) och
   [worker/kupong.mjs](worker/kupong.mjs), adressen i [config/kupong.js](config/kupong.js))
   kontrollerar kupongen och committar filen `data/kuponger/<datum för första
   matchen>.json` via GitHubs API. Pushen startar workflowen och kupongen syns för alla
   efter bygget, några minuter senare. Git-historiken visar när kupongen lades; tiden i
   `skapad` sätts av proxyn. Går det inte står *Spara* kvar för ett nytt försök.
   Är datumet redan taget av en kupong som sidan kände till får filen `-2` (osv.). Har
   någon annan just sparat en kupong för samma dag – som sidan inte visar än – frågar sidan
   först: *Visa den* eller *Spara ändå, som en kupong till*.
   **Startade matcher är låsta:** en match som har startat (eller ställts in) kan inte
   läggas till. Hinner en vald match starta medan man väljer tas den bort, med en rad om
   det, innan något sparas. Proxyn kontrollerar detsamma mot avsparkstiderna i den
   publicerade `data/matches.json`, inte mot det sidan skickar.
3. Tills dess visas kupongen i den webbläsaren där den skapades, märkt *väntar på GitHub*.
   Märkningen försvinner när bygget visar den sparade kupongen – eller en senare version
   som någon annan sparat – och glöms efter tre dygn.
4. **Reserv:** *Spara via GitHub i stället* (eller automatiskt erbjudet om proxyn inte kan
   spara) öppnar GitHub med filen ifylld – tryck **Commit changes** (kräver inloggning med
   skrivrätt till repot).

### Ladda upp system

Knappen *Ladda upp system* (i Ny kupong och Ändra, under omgångens kupong och i
underlagets rad för gängets kupong) tar en eller flera skärmbilder av ett spelat system –
som raderna i Svenska Spels app, med lagen och rutorna 1, X och 2 där de valda är
färgade – och fyller i kupongen. Allt sker i webbläsaren
([public/systembild.js](public/systembild.js)); ingen tjänst och ingen nyckel behövs:

1. **Texten** läses med [Tesseract.js](https://github.com/naptha/tesseract.js) 7.0.0
   (OCR i WebAssembly, engelsk språkdata), som hämtas från jsDelivr första gången man
   trycker. Bilden skickas ingenstans.
2. **Matcherna:** orden läggs ihop till rader efter höjden, och varje rad knyts till en
   match i spelprogrammet (från tre dagar bakåt till 14 dagar framåt): hemmalaget följt av
   bortalaget, där namnet på bilden får vara början av sajtens ("Sheffield U", "Queens
   Par…", "Hull") och ett fel per namn tolereras. Några smeknamn översätts (Wolves, Spurs,
   QPR, Man Utd, MK Dons, Nott'm Forest, Boro). Möts samma lag två gånger avgör
   avsparkstiden på raden.
3. **Tecknen:** rutorna till höger på raden letas upp i bildpunkterna, och en färgad ruta
   räknas som vald, en vit eller grå som tom. Går tecknen på en rad inte att läsa kommer
   matchen med utan tecken, med en rad om att trycka i dem.
4. **Namnet:** vecka och system blir kupongens namn, t.ex. *Vecka 42 · R0-7-16* (eller
   systemet efter ett namn som redan finns). Kupongen rättas per match som vanligt; ett
   R-systems reducering räknas inte.

Sedan öppnas Ny kupong med bara de valda matcherna synliga och en rad om vad som kom
med (startade matcher och rader som inte hittades står där). Har en kupong som inte är
färdigspelad redan minst hälften av matcherna öppnas den i stället i Ändra, så att det
inte blir två kuponger för samma omgång; tecknen från bilden ersätter dess tecken i de
matcherna och anteckningarna ligger kvar. Man ser över kupongen och sparar som vanligt.
Matcher utanför sajtens tävlingar (t.ex. Allsvenskan eller Serie A) kan inte komma med.

**Spara direkt – inställningar (en gång):** en egen tjänst, skild från proxyn för
matchanalysen, så att GitHub-nyckeln bara finns där. Driftsätts med
`npx wrangler@4.147.0 deploy --config worker/kupong.toml` och behöver en hemlighet.

- `GITHUB_TOKEN`: på GitHub, *Settings → Developer settings → Personal access tokens →
  Fine-grained tokens → Generate new token*. *Repository access: Only select repositories*
  → Profeterna; *Permissions → Contents: Read and write* (inget annat). Lägg in den med
  `npx wrangler@4.147.0 secret put GITHUB_TOKEN --config worker/kupong.toml`. Tokenen
  har ett slutdatum – när den gått ut svarar Spara att GitHub nekar, och reservvägen
  gäller tills en ny lagts in.
- Inget kodord sedan 2026-10-20 – gänget valde bort det (se Kända brister).
- Lokalt: `KUPONG_LOKALT=1` i `.env` ger samma knapp mot `POST /api/kupong`, som skriver
  filen direkt i `data/kuponger/` (eller `KUPONG_DIR`) utan GitHub.

**Ändra:** knappen *Ändra* (bara medan någon match återstår). Startade matcher ligger kvar
som de är, med sina anteckningar – också om de hunnit starta medan man ändrade; proxyn
nekar att de ändras eller tas bort. Spara direkt skriver över filen (behåller filens
`skapad`, lägger till `ändrad`), men bara den version som ändringen utgick från: varje
kupong i `kuponger.json` har filens version (`sha`, git-blobbens, samma som GitHubs API
anger), sidan skickar den med (`bas`), och har någon annan sparat en ändring under tiden
svarar proxyn att någon annan har ändrat kupongen. Ingenting skrivs över; sidan visar den
nya versionen och erbjuder *Börja om från den nya versionen*. Ett sparat utkast till en
kupong som ändrats sedan dess kastas på samma sätt när man öppnar Ändra. Via GitHub kan inte en befintlig fil fyllas i, så *Spara på GitHub*
kopierar innehållet och öppnar filen för redigering – markera allt, klistra in, Commit
changes.

**Ta bort:** knappen *Ta bort* (`#kupong/bort/<id>`, bara medan kupongen inte är
färdigspelad – en färdigspelad fryses in i historiken och står kvar där) → *Ta bort
kupongen*. Inget skickas förrän man tryckt.
Proxyn (`POST …/kupong {"bort": "<id>", "bas"}`) tar bort filen med en commit, men
bara den version som sidan visade (`bas`) – har någon annan ändrat kupongen under tiden
svarar den som vid Ändra, och sidan visar den nya versionen. Proxyn nekar en kupong där
varje match är spelad eller inställd. Tills bygget publicerat det är kupongen borta i den
webbläsaren där den togs bort. Reserv: *Ta bort via GitHub i stället* öppnar GitHubs sida
för att radera filen – tryck **Commit changes**. Git-historiken har kupongen kvar.

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

## Inför uppgörelsen

Någon i gänget skapar omgångens kupong – väljer matcherna – och var och en fyller i den för
sig: ett tecken, en halvgardering eller en helgardering per match. Man ser de andras tips
först när man själv har lämnat in. Allas tips blir underlaget för uppgörelsen i telefon där
gängets kupong bestäms.

Allt ligger under *Kupong → Omgången* (bredvid *Historik*). Överst visar fyra steg var
omgången står: *Välj matcher*, *Alla tippar* (med hur många som har lämnat in), *Uppgörelsen*
och *Matcherna*. Medan kupongen fylls i och tipsen jämförs visar
`#kupong` omgången; när gängets kupong är gjord visar den gängets kupong, med knappen
*Allas tips* tillbaka till underlaget (`#kupong/samtal`). Kuponger som spelas under tiden står
under omgången.

**Gången**

1. **Skapa kupong** (*Kupong → Skapa kupong* eller *+ Ny kupong*, `#kupong/samtal/ny`):
   någon väljer matcherna (samma sökning och tävlingsfilter som Ny kupong). Ingen tid för
   uppgörelsen behövs – tipsen visas av sig själva (punkt 4). En åt gången; fylls en i (någon match har inte startat) frågar sidan
   först *Ersätt den*. *Ändra matcherna* går tills någon har lämnat in. Den gamla vägen –
   gängets kupong direkt – finns kvar under länken *Eller gör gängets kupong direkt*.
   Medan kupongen fylls i står den överst på förstasidan och under Kupong → Omgången.
   Förstasidans ruta visar hur många som har lämnat in och hur lång tid som är kvar –
   till första avsparken, då inlämningen stänger (nedräkningen går av sig själv och blir
   bärnstensfärgad den sista timmen). När alla har lämnat in, eller tiden är ute, står det
   *Dags för uppgörelsen* (och vem som inte lämnade in) utan någon tid; när gängets kupong
   är gjord tar den över rutan. En färdigspelad kupong visas inte bredvid medan en ny
   omgång fylls i – den står under Historik.
2. **Fyll i kupongen** (`#kupong/samtal/tips`): man väljer vem man är (DL, DT, DJ – sparas
   på enheten), tippar varje match och kan skriva en kort motivering (högst 140 tecken).
   Nederst står hur många rader tipsen blir. *Lämna in och se de andras* kräver tecken i
   alla matcher. Har matcherna ändrats sedan sidan öppnades säger tjänsten till, och sidan
   visar de nya matcherna med ens tecken kvar där matchen fortfarande är med.
   *Ändra din kupong* (på omgångens sida) öppnar de inlämnade tipsen igen – också efter att
   allas tips visas, tills matcherna startar. Matcher som har startat står kvar som de var,
   och knappen heter *Spara ändringarna*. Det går bara på enheten där man lämnade in (med
   nyckeln, se Tjänsten).
3. **De andras tips** (`#kupong`): den som inte har lämnat in ser bara vem som har
   gjort det och när. Den som har lämnat in ser allas inlämnade tips – så fort minst en
   till är inne – och vilka som fortfarande fyller i. Sidan frågar tjänsten var 20:e sekund
   och visar nya tips av sig själv – också förstasidans ruta, medan tipsen lämnas in.
4. **Underlaget** – för alla när alla har lämnat in, eller senast när första matchen
   startar; sedan kan den som inte har lämnat in inte göra det. Överst allas
   garderingar, rader och (när matcher spelats) antal rätt. Varje match har rutorna
   1, X och 2 med initialerna på dem som tippat tecknet (streckad ram = del av en
   gardering), hur många av gänget som har med det och modellens chans. Motiveringarna står
   under lagen. Matcherna sorteras efter hur oeniga vi är:
   - *Alla olika* – inget tecken har mer än en
   - *Två mot en* – den som avviker förklarar
   - *Samma grund, olika säkerhet* – alla har med samma tecken, men någon har garderat
   - *Eniga mot modellen* – alla har samma tecken, och modellens troligaste är inte med
   - *Eniga* – klubbas utan snack
5. **Gängets kupong** (så fort man ser de andras tips, också om någon inte har lämnat in):
   man trycker på rutorna (två rutor =
   gardering). Den börjar som förslaget – tecknen som fler än hälften har med; *Alla olika*
   lämnas tomma – och sparas bara på enheten, så en håller i pennan under uppgörelsen (*Börja
   om* går tillbaka till förslaget). Nederst syns kupongen som rutor med antal rader.
   - *Spara gängets kupong* sparar den direkt därifrån – samma tjänst och kontroller som *Spara kupong*
     under Ny kupong (se [Kupongen](#kupongen)). Matcher utan tecken kommer inte med; sidan
     frågar först. Därefter står gängets kupong under Omgången, med en rad om att den är
     sparad och syns för alla efter bygget.
   - *Justera först* öppnar i stället Ny kupong (eller *Ändra*) med tecknen ifyllda – för
     namn, anteckningar eller fler matcher. Utan tjänsten heter knappen *Gör gängets
     kupong* och gör samma sak.
   - Finns gängets kupong redan blir knappen *Spara ändringen* (kupongen ändras, ingen ny
     görs), och står rutorna som den sparade kupongen visas *Sparad*. Har man inte själv
     tryckt på rutorna följer de den sparade kupongen – så den som öppnar underlaget på en
     annan enhet ser gängets kupong, inte förslaget, och kan inte skriva över den av misstag.
   - Har någon annan sparat eller ändrat gängets kupong under tiden säger sidan till, med
     *Visa den* och *Spara våra tecken över den* (en ändring av den, ingen dubblett).
   - Gängets kupong räknas som gjord också när alla dess matcher har startat, så att
     underlaget inte ber om den igen medan omgångens sista matcher återstår. *Allas tips*
     under Omgången leder tillbaka till underlaget så länge omgången finns.

**Tjänsten** är samma som sparar kupongen (*profeterna-kupong*, adressen i
[config/kupong.js](config/kupong.js) med `/samtal` i stället för `/kupong`; bygget skriver
den i `data/kuponger.json` under `samtal`, med `gang` – vilka som tippar). Tipsen ligger i
KV-bindningen `KUPONG`, inte på GitHub: `samtal:aktuellt` (omgången),
`samtal:<id>:tips:<vem>` (en nyckel per person, så att två som lämnar in samtidigt inte
skriver över varandra) och `samtal:<id>` (en tidigare omgång, sparad när nästa startas).
`GET /samtal` ger omgången och vem som lämnat in – tipsen bara när de visas för alla – och
`forra`, omgången före, om dess tips visades när den ersattes (`samtal:forra`; så att
bygget hinner spara den i tipparhistoriken). `POST /samtal`: `starta`,
`matcher`, `tips` och `se`. `tips` skickar med omgångens matcher som sidan visade dem
(ändrade matcher → 409 med `andrade`) och svarar med en slumpad nyckel som sidan sparar på
enheten; med den ger `se` allas inlämnade tips, och `tips` med nyckeln ändrar ens tips (i
matcher som inte har startat; `ändrad` sparas bredvid `inne`). Tjänsten lämnar aldrig ut
någons tips med bara namnet – nyckeln är det som hindrar att man tittar innan man själv har
lämnat in, eller ändrar någon annans.
Lokalt: med `KUPONG_LOKALT=1` i `.env` finns
`/api/samtal`, som sparar i `data/cache/samtal/` (eller `SAMTAL_DIR`).

## Kuponghistoriken

**Kupong → Historik** (`#kupong/historik`, en viss kupong `#kupong/historik/<id>`; gamla
länkar till `historik.html#<id>` leds dit) visar varje färdigspelad
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
analysen: inga egna fakta om lag och matcher, inga påhittade målförlopp, modellens chans
för gängets tecken som odds (som på sidan), och varje tal ska finnas i underlaget (annars
skrivs texten om, därefter visas ingen). Texten cachas utan slutdatum per kupong och
underlag. Prompten står i [config/kommentar.js](config/kommentar.js).

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

## Omgångens tippare

Förstasidan har under kupongen en ruta som visar vem i gänget som tippade bäst och sämst i
omgången. Underlaget är var och ens egna tips inför samtalet (`GET …/samtal`,
[worker/samtal.mjs](worker/samtal.mjs)). Rutan syns när tipsen visas för alla och första
matchen är spelad. Poängen räknas i webbläsaren ([public/tippare.js](public/tippare.js))
med samma rättning som kupongen: ställningen efter 90 minuter, liveställningen och
spoilerskyddet. Själva poängen, placeringen och bäst/sämst finns i
[public/tippoang.js](public/tippoang.js), som bygget också använder för säsongen.

**Poäng per match = 1 om tipset satt (annars 0) − modellens chans för tipset före avspark**
(journalen om den finns, annars sajtens prognos; för en gardering chanserna ihop, så att en
helgardering alltid ger 0). Poängen läggs ihop för omgången.

| Tips | Modellens chans | Rätt | Fel |
|---|---|---|---|
| Storfavorit | 70 % | +0,30 | −0,70 |
| Jämn match | 40 % | +0,60 | −0,40 |
| Skräll | 20 % | +0,80 | −0,20 |

- Räknat med modellens egna sannolikheter blir det väntade 0, vad man än tippar. Plus
  betyder alltså bättre än modellen och minus sämre. Att alltid ta favoriten eller att jaga
  skrällar lönar sig inte i sig – det som ger poäng är att ha rätt där modellen tvekade. Det
  är samma tanke som kupongens betyg (rätt − väntat), men per person.
- Ren oddspoäng (1/chansen vid rätt) valdes bort: med 6–10 matcher per omgång skulle en
  enda skräll avgöra.
- **Modellen** räknas likadant med sitt troligaste utfall och står med som jämförelse,
  utan placering.
- Placering efter poängen med en decimal, sedan antal rätt. Högst blir *Omgångens
  orakel* och lägst *Omgångens Ikaros*. Medan matcher återstår står det *Leder* och *Sist*,
  och rutan är märkt *Preliminärt*. Har alla samma poäng delas inga etiketter ut. Den som
  inte lämnade in står under listan och placeras inte.
- Rutan heter efter omgångens datum, t.ex. *Omgången 17–18 okt*.
- Överst i rutan kröns de med bild (`public/kronan.js`, `kronan.css`): oraklet på en
  marmorsockel framför en lagerkrans och solstrålar. Ikaros är en åttasekunders slinga:
  han flyger kaxigt upp mot solen med hela vingar, vingarna smälter (hänger, glöder,
  droppar och ryker) och han störtar i havet med plask. Ansiktet syns rättvänt större
  delen av tiden. Utan rörelse (prefers-reduced-motion) står han stilla mitt i fallet.
  Kropparna är urklippta foton i `public/profeterna/kropp-*.png` (klippta med macOS
  Vision); `KRONAN_KROPPAR` i kronan.js säger var huvudet och axlarna sitter i varje bild
  så att vingarna fäster rätt. Delat vid lika står alla med samma utmärkelse ihop.
- Pågår ingen omgång (eller är inget spelat än) står den senaste avslutade omgångens
  orakel och Ikaros kvar i en egen ruta med den omgångens datum. Före första omgången
  heter rutan *Före första omgången* och det är `KRONAN_START` i kronan.js: Daniel Laino
  som orakel och Daniel Johansson som Ikaros.
- Saknas modellen för en match används kuponghistorikens schablon: 45 % för ett tecken,
  75 % för två. Uppskjutna och inställda matcher räknas inte.
- *Poäng per match* (utfällbar) visar varje tips med poängen.

Bara den pågående omgången finns i `GET …/samtal`. När nästa omgång startas försvinner
rutan – men omgången finns kvar i säsongen nedan.

### Säsongens tippare

Under omgångens ruta står en topplista över säsongen: summan av omgångarnas poäng, antal
omgångar, antal rätt av de spelade matcherna och antal gånger som *Omgångens orakel*
(bäst) och *Omgångens Ikaros* (sämst), som märken under namnet. Modellen står med som
jämförelse, utan placering. Placering efter summan med en decimal, sedan antal rätt. En
omgång räknas för den som tippade i den. *Poäng per omgång* (utfällbar) visar varje
omgång med orakel och Ikaros inramade i guld och rött. Döljer spoilerskyddet någon match i
en omgång räknas hela omgången bort, med *Visa ändå*.

**Filen** `data/tippar-historik.json` committas och växer bara. Bygget på GitHub Actions
(`--journal`) hämtar `GET …/samtal` och skriver in omgången **när tipsen visas för alla**,
med matcherna och var och ens tecken. Tipsen går att ändra tills matcherna startar, så
omgången skrivs om när tjänsten visar andra tips, tills den är klar. När varje match är
avgjord fylls resultatet efter 90 minuter och modellens prognos före avspark i, och
omgången får `klar`. Sedan ändras den aldrig. Eftersom tipsen sparas redan när de visas
finns omgången kvar även om nästa omgång startas innan sista matchen är spelad –
resultaten tas ur sajtens egna matcher, inte ur tjänsten. Startas nästa omgång innan något
bygge hunnit se tipsen ger `GET …/samtal` den ändå, som `forra`, tills omgången därefter
startas. En omgång som ersattes innan tipsen visades räknas inte.

```json
{
  "omgangar": [
    {
      "id": "2026-10-17-k3x9q2",
      "datum": "2026-10-17",
      "till": "2026-10-18",
      "gang": [
        { "id": "DL", "namn": "Daniel Laino" },
        { "id": "DT", "namn": "Daniel Teijder" },
        { "id": "DJ", "namn": "Daniel Johansson" }
      ],
      "klar": "2026-10-18T18:07:00.000Z",
      "matcher": [
        { "id": "401878771", "match": "Everton – Chelsea", "avspark": "2026-10-17T11:30:00.000Z", "tips": { "DL": "2", "DT": "X", "DJ": "1X" }, "resultat": "0–2", "modell": [35, 26, 39] }
      ]
    }
  ]
}
```

- `resultat` är ställningen efter 90 minuter, `slut` förlängning och straffar, `struken`:
  `true` en match som inte spelades (räknas inte). `modell` är 1 · X · 2 i hela procent
  (journalen om den finns, annars sajtens prognos); saknas den används schablonen.
- Saknas ställningen efter 90 minuter tre dagar efter avspark fryses raden utan resultat.
- Bygget skriver poängen per omgång och person i `data/tippare.json`
  ([src/tippare.js](src/tippare.js)); sidan lägger ihop dem. Varje omgång har också
  matcherna med utfallet, modellens prognos och allas tecken, för Olympen.
- Lokalt (utan `--journal`) läses filen bara. Prova med en egen fil:
  `TIPPAR_HISTORIK=/tmp/tippare.json npm run build`.

## Olympen

Fliken **Olympen** (`#olympen`, [public/kampen.js](public/kampen.js), `kampen.css` – den hette
Kampen först, och `#kampen` leder hit) följer
gängets inbördes kamp om tipsen säsongen igenom. Underlaget är detsamma som Säsongens
tippare: de avslutade omgångarna i `data/tippare.json` och – medan den pågår – omgången ur
`GET …/samtal`, preliminärt och rättad som kupongen (ställningen efter 90 minuter, aktuell
ställning, Dölj resultat). Poängen är också densamma, 1 för rätt minus modellens chans
för tipset före avspark ([public/tippoang.js](public/tippoang.js)).

- **Ställningen:** summan av omgångarnas poäng med avståndet till ledaren, antal rätt och
  antal gånger som orakel och Ikaros. Den pågående omgången räknas med och står vid namnet
  (*+0,4 i omgången*); orakel och Ikaros delas ut först när den är klar.
- **Omgång för omgång:** poängen hittills efter varje omgång, en linje per tippare och
  modellen streckad. Ritas i sidans bredd. Den pågående omgången är prickad (*nu*).
- **Inbördes:** för varje par antal omgångar som var och en vann, med samma ordning som
  placeringen (poängen med en decimal, sedan antal rätt), lika och poängen mot varandra – i
  de avslutade omgångar som båda tippade.
- **Spelkassan:** som om var och en satsat 10 kr per match på sitt tips till modellens odds
  före avspark (samma odds som sajten visar). En gardering delar tian så att vinsten blir
  densamma vilket av tecknen som än sitter: insatsen genom tecknens chans ihop. Väntat
  utfall med modellens egna chanser är 0 kr. Modellen spelar sitt troligaste utfall.
- **Höjdpunkterna:** säsongens skräll (tipset med högst odds som satt), bästa och sämsta
  omgången.
- **Så tippar vi:** snittodds för tipsen (1 / modellens chans i snitt – högre är djärvare),
  andel garderingar, andel tips där modellens troligaste utfall är med, matcher där man var
  ensam om rätt, skrällar som satt (odds över 3,00) och bästa omgången.
- **Omgångarna:** alla omgångar med poängen, orakel och Ikaros inramade.

Före första omgången står alla på noll med en länk till Kupong → Omgången. Säsongens
tippare på förstasidan länkar hit (*Till Olympen*).

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
- **Mer statistik (2026-10-18):** säsongsprognosen håller lagens styrka och tabelläget
  fasta resten av säsongen; skador, övergångar, tränarbyten och nya poängavdrag räknas
  inte in. Lika poäng efter gjorda mål avgörs med lott, inte inbördes möten. Playoff spelas
  inte, och Europaplatser via cuperna räknas inte.
- Säsongsprognosen sparas inte i journalen och utvärderas inte – den är ett härlett mått
  ur prognoserna, inte en egen prognos med facit.
- Vilan räknas i hela dagar mellan matchdagarna (UTC-datum): torsdag kväll → söndag lunch
  blir 3 dagar, fast det är under tre dygn. För lag i National League finns bara spelade
  ligamatcher – nästa match är okänd.
- Domaren identifieras med football-data.co.uk:s namnform ("C Pawson"); två domare med
  samma initial och efternamn slås ihop. Domare i cupmatcherna finns inte i de fria
  källorna.
- Mål mot xG jämför PL mot Understat och övriga ligor mot football-data.co.uk:s xG, vars
  leverantör är odokumenterad. I en cupmatch mellan nivåerna kan lagen alltså ha olika
  xG-källa.
- Europacupernas kvalomgångar hämtas bara för juli–augusti.
- **Kupongen:** att GitHub fyller i den nya filen ur länken (`?filename=…&value=…`) är
  provat fram till inloggningen 2026-10-18, inte hela vägen till en commit. Spara direkt
  är provat lokalt och mot ett låtsas-GitHub. Det finns inget kodord (borttaget
  2026-10-20): den som hittar tjänstens adress kan lägga, ändra och ta bort kuponger och
  lämna in tips i någons namn. Märkningen
  *väntar på GitHub* finns bara i webbläsaren där kupongen skapades. Liveställningen bygger
  på ESPN:s inofficiella API, som resten av sajten.
- Låset för startade matcher och versionskontrollen (2026-10-18) är provade lokalt och mot
  ett låtsas-GitHub, inte mot den driftsatta tjänsten – den måste driftsättas om
  (`npx wrangler@4.147.0 deploy --config worker/kupong.toml`) för att de ska gälla där.
  Proxyn läser hela `matches.json` (~0,5 MB) vid varje sparning; processortiden på
  Cloudflares gratisnivå (10 ms) är inte mätt. Svarar inte sajten kan inget sparas direkt
  (reservvägen via GitHub finns kvar). Avsparkstiderna är byggets, högst en halvtimme
  gamla: en match som flyttats till en tidigare tid efter senaste bygget låses först vid
  den gamla tiden. En sida laddad före ändringen skickar ingen version, och då görs ingen
  versionskontroll (låset gäller ändå).

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

Inför uppgörelsen: tipsen är dolda av tjänsten, inte av sidan – `GET /samtal` skickar dem inte
förrän de visas för alla, och `se` bara mot nyckeln som den som lämnade in fick. Vem man är
väljer man själv på enheten, så det är nyckeln som hindrar att någon tittar på de andras
tips innan den själv har lämnat in.
