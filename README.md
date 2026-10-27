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
  av det styr prognoserna. Säsongsprognosen och programmet framåt togs bort 2026-10-20;
  styrkan finns kvar som motståndet i lagstatistiken (se [Styrkan](#styrkan))
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
  gardering. Fliken Kupong har omgångens kupong med liveställning från ESPN – de
  färdigspelade ligger i Olympen; förstasidan visar kupongen i korthet. Ny kupong med
  sökning. Matcherna har en egen flik. Sparas som fil i `data/kuponger/` med en commit på GitHub (se [Kupongen](#kupongen))
- [x] **Inför uppgörelsen:** någon skapar omgångens kupong (väljer matcherna) och var och en
  fyller i den för sig (gärna med garderingar). Man ser de andras tips först när man själv
  har lämnat in, och ens egna går att ändra tills matcherna startar. Allas tips blir ett underlag sorterat
  efter hur oeniga vi är, där gängets kupong växer fram (se [Inför uppgörelsen](#inför-uppgörelsen))
- [x] **Kuponghistoriken:** Olympen → Grupparbetena med varje färdigspelad kupong – antal rätt,
  betyg 1–5 mot modellens väntade antal rätt, sortering efter hur det gick och en kort
  AI-kommentar som läser gängets anteckningar. Fryses in i `data/kupong-historik.json`
  (se [Kuponghistoriken](#kuponghistoriken))
- [x] **Säsongens tippare:** Olympen visar ställningen över säsongen för gängets egna
  tips – poäng, rätt och antal gånger som omgångens bästa och sämsta, med modellen som
  jämförelse. Varje omgång sparas i
  `data/tippar-historik.json` (se [Säsongens tippare](#säsongens-tippare))
- [x] **Utmärkelserna (2026-10-20):** när omgången är färdigspelad delas utmärkelser ut
  efter hur var och en tippade – titlar som låter som dygder (*Den diplomatiske*) med en
  rad om hur det gick (*Tog inte ställning i 3 matcher*), och en bild var under orakel och
  Ikaros (se [Utmärkelserna](#utmärkelserna))
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
  ([public/matchruta.js](public/matchruta.js)). Efter matchen står varje spelares betyg
  från 365Scores (1–10) på planen och i listorna, matchens högsta i guld; inhoppare som
  bara spelat några minuter har inget (2026-10-20)
- [x] **Matchbladets flikar (2026-10-20):** Startelvor står först, sedan Matchen (påbörjad
  match), Prognos, Form, Tabellen och Trupperna. Under startelvorna står vilka som saknas –
  365Scores lista för matchen, och Fantasy Premier Leagues när 365Scores inte har något än –
  och domaren med fyra tal mot divisionens snitt, som i ett matchprogram; Lagen och Domaren
  är borta som egna flikar. Tabellen är ny: divisionens tabell med matchens lag markerade
  (i cupen lagens placering i var sin division), bakom samma ridå som Tabeller när resultat
  är dolda. Trolig och bekräftad elva är en stämpel, och utan elva står planen tom med
  stämpeln Ingen startelva än. Prognosens rutor har bara tecknet och oddset (chansen i
  procent i rutans title), spelbolagens odds står i en tabell under modellens, och knappen
  Visa detaljer är borta med källraderna, osäkerhetsspannet och de enkla baslinjerna
- [x] **Färre dubbletter i matchbladet (2026-10-21, användarens beslut):** varje tal står
  på ett ställe. Spelbolagets odds står på en rad under prognosens rutor (snittet vid
  avspark för en spelad match, annars snittet när oddsen öppnade, annars ESPN:s bolag),
  och kortet Spelbolagen med raden Modellen är borta, liksom Slutprognos sist i *Vad drog
  åt vilket håll*. I *Lagen sida vid sida* står Matcher, V–O–F, Mål och Mål per match bara
  när matchen saknar fliken Tabellen; Skott, Snittålder och Använda spelare är borta.
  Domaren har tre tal, utan röda kort. *Tipset* under artikeln i Inför har bara rutorna
  och texten – *Nyhetsläget*, *Läktarsnacket* och den egna källistan visas inte, eftersom
  artikeln ovanför redan har läst på
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
- [x] **Stryktipset och Svenska folket (2026-10-20):** *Hämta Stryktipset* i Välj matcher
  fyller omgångens kupong med veckans Stryktips från Svenska Spel, i deras ordning, och
  kupongen visar Svenska folket – hur stor del av raderna som har med 1, X och 2 – under
  modellens odds, grönt där modellen ger tecknet klart större chans än folket spelar det.
  Siffrorna uppdateras varje minut fram till spelstoppet. Matcherna står i den ordning de
  valdes, och numret syns också i telefonen (se [Inför uppgörelsen](#inför-uppgörelsen))
- [x] **Svenska folket borta från kupongen (2026-10-21):** procenten under oddsen och fältet
  *Svenska folket* i foten är borttagna – under rutorna står bara modellens odds. *Hämta
  Stryktipset* finns kvar
- [x] **Stryktipset som veckans kupong (2026-10-20):** när Svenska Spel öppnar veckans
  Stryktips (måndagar kl. 07) och förra omgången är färdigspelad blir dess tretton matcher
  omgångens kupong av sig själv, utan att någon väljer. *Ändra matcherna* går som förut
  tills någon har lämnat in, och *Välj matcher* börjar med Stryktipset ifyllt. Gängets
  kupong behåller Stryktipsets ordning 1–13 – också när den sparas, ändras och hamnar i
  Olympen – i stället för att sorteras efter avsparken
- [x] **Spelarbetyg (2026-10-20):** Statistik → Spelare visar spelarnas snittbetyg från
  365Scores, som sätter ett betyg från 1 till 10 efter varje match: topplistan *Högst betyg*
  i stället för Målvakter (som finns kvar under Försvar), kolumnen Betyg under Översikt
  och i spelarkortet betyget och hur ofta spelaren fått högst betyg på planen. Betygen
  hämtas en gång per spelad ligamatch och kopplas till ESPN-truppen inom laget på namn
  och tröjnummer – 421 av 443 som spelat i Premier League 2026-10-20, de övriga har bara
  hoppat in några minuter. League Two har betyg först från 12 september. Styr inte
  prognoserna ([src/fetchers/s365ratings.js](src/fetchers/s365ratings.js))
- [x] **Lagen inför 1X2 (2026-10-20):** topplistorna överst i Statistik → Lag visar det
  som säger mest inför ett 1X2-tips i stället för xG för och emot: *Starkast* och
  *Svagast* (modellens styrka – väntad målskillnad per match mot divisionens snittlag, med
  motståndet inräknat), *Kryssar gärna* (oavgjortchansen i lagets matcher ur båda lagens
  xG), *Förtjänar mer* och *Förtjänar mindre* (tagna poäng mot vad chanserna var värda,
  3 × vinstchansen + oavgjortchansen ur matchens xG med oberoende Poisson – tur som
  brukar jämna ut sig, och där tabellen lurar) och *Slår oddsen*. xG-fliken och lagkortet
  har samma tre nya siffror ([src/teamstats.js](src/teamstats.js))
- [x] **Modell och Källor (2026-10-20):** Modell börjar med fyra steg på vanlig svenska
  och ett räknat exempel ur nästa match i Premier League (väntade mål och odds efter varje
  steg), sedan avståndet mellan divisionerna som staplar, *Hur bra är den?* – domen i ord,
  modellen bland måttstockarna på en skala, säsong för säsong och division för division i
  grönt och rött – *I skarpt läge* (prognosjournalen, `#utvardering`), *Prövat och
  förkastat* (kandidatjakten i grupper) och sist detaljerna i en hopfälld ruta. Samma namn
  på måttstockarna som i matchrutan (Ligasnittet, Bara årets mål, Spelbolagen, Spelbolagen
  vid avspark). Källor har läget i tre rutor, vad som kommer varifrån (även det webbläsaren
  hämtar själv) och ett kort per källa – vad den ger, var den används, hur ofta den hämtas
  och alla hämtningar hopfällda ([src/sourcetable.js](src/sourcetable.js), `PROVIDERS`).
  ESPN:s målminuter och publik slutade hämtas, och football-data.co.uks statistikfiler
  hämtar bara domare och kort för de tre senaste säsongerna – resten användes bara av
  divisionsstatistiken som togs bort ur Statistik; `data/divisions.json` har bara
  divisionernas namn
- [x] **Spela hos Svenska Spel och pris i kronor (2026-10-22):** gängets kupong för
  Stryktipset har knappen *Spela hos Svenska Spel* (huvudknappen på kupongsidan och i
  förstasidans ruta) fram till spelstoppet. Den öppner veckans Stryktips med gängets tecken
  ifyllda (`spela.svenskaspel.se/stryktipset?product=1&draw=<nr>&signs=1:1,2:1X,…&share=valid`),
  med Svenska Spels nummer på matcherna ur omgången där (samma hämtning som *Hämta
  Stryktipset*, högst var femte minut), och står bara när varje match utom strukna har ett
  tecken. På en kupong för Stryktipset står *Pris* i foten i stället för *Kombinationer* –
  en krona per rad, och på gängets kupong vad det blir per person
  ([public/spela.js](public/spela.js))
- [x] **Allt heter Analysera (2026-10-22, användarens önskan):** matchbladets flik *Inför*
  heter *Analysera*, och knappen där heter också *Analysera* (förut *Läs på*). Ett klick
  låter Claude läsa på och skriva artikeln och sedan, i samma samtal och utan att söka
  igen, tipset under den – förut två knappar, två väntetider och två sökpass. Är tipset
  äldre än ett dygn står *Analysera igen* under det: tipset skrivs om ur artikeln och
  nyheterna som hämtas just då, utan sökningar (se Matchanalysen, *Analysera*)

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
| Domare och kort, tidigare säsonger | football-data.co.uk (samma filer som raden ovan, andra kolumner) | PL–L2, National League – domaren i matchrutan | 30 d | Verifierat 2026-10-18. De tre senaste avslutade säsongerna (`HISTORY.referees` i [config/competitions.js](config/competitions.js)), med domare, kort och frisparkar. Egen cache (`fdcouk_stats_*`), så att prognosmotorns underlag och efterhandstestets signatur inte ändras. Domare saknas 2012/13 i E1–EC, och frisparkar saknas i EC från 2016/17. Hämtade fram till 2026-10-20 alla säsonger sedan 2000/01 med halvtid, hörnor och publik för divisionsstatistiken, som togs bort ur Statistik 2026-10-19. |
| Europacuperna (för vila och form) | ESPN (`uefa.champions`, `uefa.europa`, `uefa.europa.conf`, kvalomgångarna i `*_qual` juli–augusti) | PL och cuperna – bara underlag | 3 h | Verifierat 2026-10-18: 234/224/366 matcher 2026/27 med kvalet, nio engelska lag (Brighton i Conference Leagues playoffomgång i augusti). Kopplas på ESPN:s lag-id, samma i alla ESPN:s turneringar. Ingen prognos för matcherna och inte med i prognosmotorns underlag. |
| Domare, kommande ligamatcher | football-data.co.uk (`fixtures.csv`, kolumnen `Referee`) | ligorna | 6 h | Verifierat 2026-10-18: namnet finns för alla 46 kommande matcher i filen (läggs ut med oddsen fre/tis). Domarens historik ur raden *Domare och kort* ovan. |
| Startelvor och frånvaro | 365Scores öppna webb-API (`webws.365scores.com/web/games/` och `/web/game/?gameId=`), hämtas **i webbläsaren** | alla sex | när matchrutan öppnas, varje minut medan matchen pågår | Verifierat 2026-10-19: ingen nyckel, `Access-Control-Allow-Origin: *`. Trolig elva (`NotConfirmed`) dagar före matchen i Premier League och Championship (inte i League One, League Two och EFL-cupen), bekräftad (`Confirmed`) ungefär en timme före avspark, efter matchen elvorna med mål, kort, byten och varje spelares betyg (`ranking`, 1–10; -1 eller inget = inget betyg). Spelarnas plats som linje och sida, så planen ritas utan positionstolkning. Vilka som saknas (skada med orsak och väntad återkomst, avstängning) även utanför Premier League. ESPN:s matchid finns inte där: matchen hittas på tävling (PL 7, CH 1, L1 2, L2 3, FA-cupen 8, EFL-cupen 9), avspark inom tre timmar och lagnamn – 505 av 505 matcher 1/9–8/11 2026 hittades (MK Dons heter så där). Samma källa som Gräver Gravs startelvor. Styr inte prognosen. |
| Spelarbetyg | 365Scores öppna webb-API (`/web/games/results/?competitions=<id>` bakåt via `paging.previousPage`, sedan `/web/game/?gameId=`) | ligorna | 6 h, bara nya matcher | Verifierat 2026-10-20: betyg 1–10 med en decimal (`ranking`) för alla i startelvan och för inhoppare som spelat en stund (några minuter ger -1, inget betyg). 365Scores räknar betyget ur spelarens statistik i matchen; metoden är odokumenterad. Snittet är 6,6–6,8 per liga och vart tionde betyg är över 7,5. Alla 70, 131 och 114 spelade matcher i PL, CH och L1 hade betyg; i League Two 66 av 126 – matcherna före 12 september saknar betyg och sparas som utan. Säsongens matcher listas ~20 per sida tills förra säsongens (`seasonNum`) börjar. Matchen hittas på avspark inom tre timmar och lagnamn som i matchrutan (alla 441 hittades). Samma spelare kan ha olika id i olika matcher, så spelarna hålls isär på namnet inom laget. Kopplas till ESPN-truppen inom laget på hela namnet, efternamn med förnamnets initial och sist tröjnummer med lika början på efternamnet (Yarmoliuk–Yarmolyuk, Sávio–Savinho), bara vid entydig träff. En match är ~135 kB men sparas kompakt (~70–140 kB per liga). Svarar även från GitHub Actions (verifierat 2026-10-20); svarar den inte visas topplistan Målvakter som förut. Styr inte prognosen. |
| Spelarbilder | 365Scores öppna webb-API (`/web/standings/?competitions=<id>` för lagen, `/web/squads/?competitors=<id,…>` för trupperna); bilden visas från `imagecache.365scores.com/…/v<imageVersion>/Athletes/<id>` i webbläsaren | ligorna | 24 h | Verifierat 2026-10-20: truppen per lag med id, namn, tröjnummer, födelsedatum, position och `imageVersion`; tränare och domare (`isStaff`) tas inte med. `imageVersion` 1 betyder att bild saknas (alla 13 med version 1 gav 404, alla 46 med högre version en bild). Alla 92 lag hittades på namnet som för betygen (Utd och Wed skrivs ut, så att Sheffieldlagen hålls isär); bild på 539 av 542 spelare i PL, 660 av 671 i CH, 649 av 651 i L1 och 540 av 663 i L2. Kopplas till ESPN-truppen inom laget på hela namnet, födelsedatum med ett gemensamt namn eller tröjnummer, efternamn med förnamnets initial och sist tröjnummer, bara vid entydig träff – 2 329 av 2 818 spelare i ESPN-trupperna fick bild; de övriga saknar bild hos 365Scores eller finns inte i deras trupp (oftast unga spelare och lån). Bilden står i spelarkortet med tröjnumret i hörnet; går den inte att ladda står tröjnumret som förut. ~25–30 kB per liga. Styr inte prognosen. |
| Lagsköldar | ESPN:s bildtjänst (`a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/<id>.png&h=96&w=96`, och `500-dark` för mörk botten) | alla sex | 7 d | Verifierat 2026-10-21: alla 92 ligalag har sköld, 67 av dem också en för mörk botten (Tottenhams tupp vit i stället för marinblå). Lagen tas ur spelprogrammen på ESPN:s lag-id, så att cupmotståndet kommer med; de flesta i National League har sköld, lag längre ner oftast inte (HTTP 404) och får en tom sköld. 96 × 96 px, ~1,5 MB för alla. Sparas i källcachen (`data/cache/skoldar/`) och läggs på sajten av bygget, i stället för att visas direkt från ESPN. Visas i Tabeller (den för mörk botten) och i matchbladets huvud (den vanliga – matchbladet är ljust). Styr inte prognosen. |
| Matchhändelser och lagstatistik | ESPN matchsammanfattning (`summary?event=<id>`, samma som oddsen), hämtas **i webbläsaren** | alla sex | när matchrutan öppnas för en påbörjad match, varje minut medan den pågår | Verifierat 2026-10-19: `Access-Control-Allow-Origin: *`. Mål med assist, självmål och straff, kort, byten, halvtid, lagstatistik (bollinnehav, skott, hörnor, passningar m.m.) och publik. Passningsandelen räknas ur antalen (ESPN avrundar den till en decimal). ~400 kB per match. Styr inte prognosen. |
| Stryktipset och Svenska folket | Svenska Spels öppna API (`api.spela.svenskaspel.se/draw/1/stryktipset/draws` och `…/draws/<nr>`), hämtas av tjänsten profeterna-kupong åt webbläsaren | omgångens kupong | när omgången startas eller man trycker på *Hämta Stryktipset* | Verifierat 2026-10-20: ingen nyckel, men inget `Access-Control-Allow-Origin` för andra sajter – därför via tjänsten, som sparar svaret en minut. Omgångens tretton matcher med nummer, lag (korta namn: *QPR*, *Wolves*, *Bristol C*), avspark och `svenskaFolket` i hela procent. Svenska Spel räknar om fördelningen ungefär varje minut och fryser den vid spelstoppet; `/draws/<nr>` ger den också efteråt. Inget matchid som ESPN:s – matchen hittas på lagen (början av namnet efter några smeknamn) och avspark inom 36 timmar: 13 av 13 i vecka 43. Styr inte prognosen. |
| Liveställning | ESPN scoreboard (`site.api.espn.com/…/<liga>/scoreboard?dates=YYYYMMDD`), hämtas **i webbläsaren** | kupongens matcher | 1 min medan en kupongmatch pågår | Verifierat 2026-10-18: svarar med `Access-Control-Allow-Origin: *`, så sidan kan hämta direkt. Samma matchid som spelprogrammet. Status, matchminut och ställning; används bara av kupongen, inte av prognosen eller bygget. |
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
- **Inga tecken av sig självt – Claude läser på (2026-10-20, användarens önskan):**
  matchbladet ringar inte längre in modellens tecken automatiskt. Analysera låter i stället
  Claude söka och läsa förhandsartiklar, lokaltidningar, presskonferenser, skade- och
  truppnyheter och supporterforum på nätet och ringa in sina tecken med kulspetspenna i
  rutorna 1 X 2 (se Matchanalysen, *Analysera*). Efter matchen ringas utfallet in med
  samma penna som ställningen, utan bock eller kryss – det fanns inget tips att rätta.
- **Artikeln och tipset ihopslagna (2026-10-22, användarens önskan):** *Läs på* och
  *Analysera* sökte båda på nätet, och det andra sökpasset hittade mest det som artikeln
  redan hade läst. Nu läser Claude på en gång: artikeln skrivs först, utan prognosen och
  oddsen, och tipset i samma samtal när de kommer, med det lästa ur cachen. Eftersom
  artikeln kan skrivas 7 dagar före avspark och aldrig skrivs om kan tipset bli gammalt;
  därför *Analysera igen* efter ett dygn, utan sökningar men med nyheterna som hämtas
  gratis. Flik och knappar heter alla Analysera.
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
- **Lugnare förstasida (2026-10-22, användarens önskemål):** förstasidan visar det
  väsentliga – omgången och vad man ska göra – med mycket luft. Jätterubriken
  *Matchfixarna* (namnet står redan i toppbaren) och lagbilden är borta; i stället står
  oraklet och Ikaros som polaroider bredvid omgången, och raden *Väntar på Teijder* i
  stället för porträtten. Omgångens tippare med utmärkelserna flyttar upp överst i
  Olympen, och Säsongens tippare försvinner – Olympens ställning visar samma sak.
- **Tobaksaffären blir förstasidan på stora skärmar (2026-10-22, användarens önskemål):**
  utan adress står ett rum i stället för den vanliga förstasidan – en sliten tobaksaffär vid
  spelpulten där gänget sitter som leksaksfigurer på fönsterbänken, och föremålen i rummet
  leder till sajtens delar, som i rummet på felixrieseberg.com. Den vanliga förstasidan finns
  kvar som *Vanlig sida* (`#hem`) och står alltid i telefonen och i smala fönster. Se
  [Tobaksaffären](#tobaksaffären).
- **Kupongen fylls i på pulten (2026-10-23, användarens önskemål):** den som inte har lämnat
  in tar kupongen på pulten i handen – den lyfter, vänds upp och förstoras medan rummet
  mörknar bakom – och kryssar i rutorna med pennan, som drar varje kryss. *Lämna in* under
  kupongen lämnar in som papperet under Kupong, och kupongen läggs tillbaka med stämpeln
  *Inlämnad*. Samma kväll också för den som redan har lämnat in: kupongen lyfts med dina kryss
  och stämpeln, och tipsen går att ändra där tills matcherna startar – också när du ser de
  andras tips, som på papperet (först låstes de när någon annans tips syntes, vilket
  papperet inte gör). Startade matcher står fast. Se [Kupongen i handen](#kupongen-i-handen).
- **Kupongen i rummet ser ut som papperet (2026-10-23, användarens önskemål):** kupongen på
  pulten och i handen hade en egen form (sidokolumn med Spelstopp, Insats, Inlämnade och
  Tippare-rutor, finstil). Papperet under Kupong fick vara förlagan, eftersom det måste
  fungera i telefonen och i alla steg, och kupongen i rummet ritas nu med samma delar i
  sitt fasta mått: stämpeln och spelstoppet under bandet, porträtten i stället för
  initialerna, en synkmarkering per rad och fälten och streckkoden i foten. Papperet fick
  streckkoden i foten. Se [Kupongen i handen](#kupongen-i-handen).
- **Gänget vid ett barbord (2026-10-25, användarens önskemål):** gänget sitter på tre
  barstolar i krom och röd vinyl runt ett runt barbord framför fönstret i stället för på
  fönsterbänken – DL och DJ på sidorna, DT bakom – med ölen, askkoppen och kupongerna på
  bordet. Barstolen vid disken är borta. Se [Tobaksaffären](#tobaksaffären).
- **Gänget byter plats vid bordet (2026-10-25, användarens önskemål):** var tredje dag
  sitter de på en ny plats, så att var och en får sin tur bakom bordet och på var sida –
  samma för alla som tittar, efter dagen i Stockholm. Se [Tobaksaffären](#tobaksaffären).
- **Tobaksaffären också i telefonen (2026-10-24, användarens önskemål):** rummet står nu i
  alla fönster utom de allra minsta, i telefonen också, och den vanliga förstasidan finns
  kvar som *Vanlig sida*. Scenen fyller höjden, och man ser sig omkring med fingret – scenen
  följer med och kameran vrids som med musen. På höjden är kupongen smal och hög som en
  riktig stryktipskupong, så att den går att fylla i; på bredden står orden bredvid kupongen
  i handen. Se [I telefonen](#i-telefonen).
- **Närbilder i tobaksaffären (2026-10-24, användarens önskemål):** uret, skårtavlan med
  Premier League, Omgångens orakel och VM 94-affischen går att klicka på, och kameran går
  fram till dem i stället för att sidan byts direkt. Skårtavlan och oraklet leder sedan vidare
  till Tabeller och Olympen. Se [Närbilderna](#närbilderna).
- **Säsongsprognosen tas bort (2026-10-20, användarens beslut):** vyn under Tabeller och
  simuleringen i bygget (`src/season.js`, `data/season.json`) försvinner, liksom
  programmet framåt och prognosdelen i lagkortet. Tabeller visar bara tabellen, med
  divisionerna som numrerade flikar (nivå 1–4); gamla länkar till `#…/prognos` hamnar på
  tabellen. Styrkan för alla lag räknas fortfarande – den är motståndet i lagstatistiken.
- **Kuponghistoriken flyttar till Olympen (2026-10-20, användarens önskemål):** Kupong
  handlar bara om nästa kupong – växlaren Omgången | Historik försvinner. De färdigspelade
  kupongerna står sist i Olympen under rubriken *Grupparbetena* (`#olympen/kuponger`, en
  viss kupong `#olympen/kuponger/<id>`), och tabellen Omgångarna visar gängets kupong ur
  varje omgång med länk ner till den. Gamla länkar till `#kupong/historik/<id>` och
  `historik.html#<id>` leds dit.

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
- **Styrkan:** [src/strength.js](src/strength.js) körs i slutet av prognosmotorn och ger
  modellens styrka för alla lag i nivå 1–4 – motståndet i lagstatistiken
  (`data/teams/<division>.json`). Se [Styrkan](#styrkan).
- **Kupongen:** [src/coupons.js](src/coupons.js) läser och kontrollerar filerna i
  `data/kuponger/` och bygget skriver `data/kuponger.json`. Rättningen, liveställningen och
  Ny kupong finns i [public/kupong.js](public/kupong.js) och
  [public/kupong.css](public/kupong.css). Se [Kupongen](#kupongen).
- **Inför uppgörelsen:** [worker/samtal.mjs](worker/samtal.mjs) håller omgången och gängets
  egna tips (Cloudflare KV, i tjänsten profeterna-kupong; lokalt filer via
  [server.js](server.js)); vyerna under Kupong (steg 1–3) finns i
  [public/samtal.js](public/samtal.js) och [public/samtal.css](public/samtal.css). Se
  [Inför uppgörelsen](#inför-uppgörelsen).
- **Kuponghistoriken:** [src/history.js](src/history.js) rättar färdiga kuponger, räknar
  betyget, fryser in dem i `data/kupong-historik.json` och skriver `data/historik.json`.
  Grupparbetena sist i Olympen ritas av [public/historik.js](public/historik.js) med
  [public/historik.css](public/historik.css) (gamla `historik.html` leder dit);
  AI-kommentaren skrivs av [worker/kommentar.mjs](worker/kommentar.mjs) med prompten i
  [config/kommentar.js](config/kommentar.js). Se [Kuponghistoriken](#kuponghistoriken).
- **Omgångens och säsongens tippare:** [src/tippare.js](src/tippare.js) sparar varje
  omgång av gängets egna tips i `data/tippar-historik.json` och skriver `data/tippare.json`;
  rutan överst i Olympen och polaroiderna på förstasidan ritas av
  [public/tippare.js](public/tippare.js) med
  [public/tippare.css](public/tippare.css). Poängen räknas av
  [public/tippoang.js](public/tippoang.js), som både bygget och sidan använder. Se
  [Omgångens tippare](#omgångens-tippare). Utmärkelserna räknas och ritas av
  [public/utmarkelser.js](public/utmarkelser.js) med
  [public/utmarkelser.css](public/utmarkelser.css), se [Utmärkelserna](#utmärkelserna).
- **Tobaksaffären:** förstasidan, [public/rum.js](public/rum.js) med
  [public/rum.css](public/rum.css) och gänget i three.js i [public/rum-3d.js](public/rum-3d.js)
  (ansiktena i `public/rum/`). Se [Tobaksaffären](#tobaksaffären).
- **Frontend:** ren HTML/CSS/JS i `public/`, flikarna Matcher, Kupong och Olympen och
  sidorna Källor och Modell i sidfoten ([public/kallor.js](public/kallor.js),
  [public/modell.js](public/modell.js); `#utvardering` leder till *I skarpt läge* på
  Modell); matchen öppnas i matchrutan (`#match/<id>`, en `<dialog>` ovanpå sidan man
  var på – stängs den går man tillbaka dit) med flikarna Startelvor (med domaren), Matchen,
  Prognos, Form, Tabellen och Trupperna och, i Prognos, kortet Analys när matchanalysen är påslagen;
  Startelvor och Matchen hämtas av [public/matchruta.js](public/matchruta.js). Sidorna Tabeller och Statistik
  ([public/tabeller.html](public/tabeller.html), [public/statistik.html](public/statistik.html),
  båda med [public/divisioner.js](public/divisioner.js)). Läser JSON-filerna ovan. Urvalet av kommande/spelade matcher och källornas status
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

Valfri och **avstängd som standard**. När den är påslagen har matchbladet för en kommande
match inom 7 dagar fliken **Analysera** med knappen **Analysera**: Claude läser på och
skriver en artikel om matchen och tipset under den (se *Analysera* nedan). Är modulen
avstängd, saknar proxyn nyckel eller fallerar API:t ser sidan ut som annars – kortet säger
bara varför det inte blev någon text.

```
knappen  →  proxyn (Cloudflare Worker, nycklarna som hemligheter)  →  Claude (söker och läser)
              ↑ hämtar <sajten>/data/match/<id>.json själv
              ↑ hämtar nyheterna (Bing News, ESPN, BBC Sport, Open-Meteo) till Analysera igen
```

**Analysera (Claude, 2026-10-20; artikeln och tipset ihopslagna 2026-10-22):** knappen
anropar `POST …/artikel` ([worker/artikel.mjs](worker/artikel.mjs), prompten och gränserna
i [config/artikel.js](config/artikel.js), samtalet och kontrollerna i
[worker/research.mjs](worker/research.mjs), fliken i [public/app.js](public/app.js)).

- **Artikeln:** Claude (`claude-opus-5-5`, effort `low`) söker och läser på nätet med
  Anthropics sök- och läsverktyg (högst 6 sökningar och 4 öppnade sidor à högst 4 000
  tokens; spelbolag och tipssajter spärrade) – lokaltidningar, förhandsartiklar,
  presskonferenser, skador och troliga startelvor, supporterforum och fansajter – och
  skriver rubrik, ingress, två–tre stycken (180–240 ord) och källor, byggd kring det som
  gör matchen annorlunda eller spännande. Underlaget är DeepSeek-analysens (nedan) utan
  prognosen och oddsen, och artikeln ger inga tips: ett tipsord (spik, gardering) ger en
  omskrivning.
- **Tipset, i samma samtal:** när artikeln har klarat kontrollen får Claude prognosen,
  *Vad drog åt vilket håll*, baslinjerna och spelbolagens odds och skriver tipset utan att
  söka igen – `analys` (högst 120 ord), `tecken` (1, X, 2, två av dem eller 1X2),
  `marginal` (högst tre ord, utan siffror) och `källor`. Allt Claude har läst ligger kvar i
  cachen. *Tipset* under artikeln visar kupongens rutor 1 X 2 med tecknen inringade med
  kulspetspenna och raden i marginalen (annars spik, halvgardera eller helgardera), och
  texten med hänvisningar som länkar direkt till sidorna. Blir tipset inte av sparas
  artikeln ändå; kortet säger varför och har knappen *Analysera*. Utan prognos inget tips.
- **Analysera igen:** är tipset äldre än ett dygn (`tip.refreshHours`) står knappen under
  det. Claude skriver då om bara tipset ur artikeln, sajtens underlag och nyheterna som
  hämtas just då (*Nyhetsläget* nedan), utan sökverktyg. Klarar det nya tipset inte
  kontrollen står det gamla kvar, och nästa försök går att göra efter 30 minuter (efter
  ett API-fel direkt). Högst 40 omskrivna tips per dygn.
- **Kontroller:** en källa följer bara med om adressen verkligen kom upp i en sökning, en
  läst sida, artikelns källor eller bland nyheterna – annars stryks hänvisningen. Varje tal
  i texterna ska stå i underlaget eller i det Claude läste (rubriker, öppnade sidor,
  citerade stycken); tecknen ska vara ett till tre av 1, X och 2. Annars ett nytt försök i
  samma samtal (ur cachen), och därefter ingen text.
- **Vid behov, inte på schema (sedan 2026-10-21):** förut skrevs varje match på kupongen
  tre gånger (när den kom med, 48 och 20 timmar före avspark), ungefär $20 i veckan även
  för matcher ingen läste. Nu skrivs artikeln bara när någon ber om den, och en skriven
  artikel skrivs inte om – det nya fram till avspark kommer med *Analysera igen*.
- `POST …/artikel {"id": "<match-id>"}` lämnar ut artikeln om den finns, skriver den
  annars (en till ett par minuter) och skriver om ett gammalt tips. Medan någon annan
  skriver svarar proxyn `pending: true`, och knappen frågar igen var 15:e sekund; den visar
  *Analyserar …* med tiden. Tidigast 7 dagar före avspark, högst 3 försök per match och 15
  artiklar per dygn. Lokalt samma sak via `/api/artikel` (server.js), sparat bredvid
  analyserna i `data/cache/analysis/`.
- `GET …/artikel?id=<match-id>` lämnar ut artikeln med tipset (KV-nyckeln `artikel:<id>`,
  sparad 4 dagar efter avspark); matchbladet hämtar den samtidigt som matchen.
- **Kostnad:** varje försök sparas med vad det kostade (`cost` i `tries` och `tipTries`,
  räknat ur förbrukningen och prislistan i konfigen). Prov 2026-10-22 på Ipswich–Forest:
  artikeln och tipset 63 s och $0,23 (4 sökningar och 4 sidor; tipset ur cachen ungefär
  $0,05, med ett nytt försök), *Analysera igen* 15 s och $0,10. Förut kom Analysera med ett
  eget sökpass ovanpå artikeln (provet 2026-10-20: $0,40). Provskrivs lokalt utan att
  sparas, med förbrukningen per anrop utskriven: `node src/artikel-cli.mjs <match-id>`
  (`--igen` skriver också om tipset).
- **2026-10-20–22** sökte Analysera på nytt efter det som hänt sedan artikeln skrevs, i ett
  eget samtal, och skrev också *Nyhetsläget* och *Läktarsnacket*, som inte visades
  (`config/research.js`, borttagen).

**DeepSeeks analys** (`POST …/analyze`, [worker/index.mjs](worker/index.mjs)) stod förut
under knappen Analysera och anropas inte längre av matchbladet (2026-10-22). Den ger en kort
text (3–5 meningar) som DeepSeek skriver ur matchens underlag och, under rubriken
*Nyhetsläget*, 4–8 meningar ur nyheter som hämtas online just då, med hänvisningar och en
källista med länkar.

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
driftsatt 2026-10-22 med commiten "Allt heter Analysera, och artikeln och tipset skrivs i
ett samtal" (wrangler 4.147.0 under Node 22, ur en ren utcheckning av commiten); provad
samma kväll med Analysera igen på Ipswich–Forest, 12 s – senare ändringar i `worker/`,
`src/news.mjs` eller `config/` når den först vid nästa `deploy`.

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

## Styrkan

Modellens styrka för alla lag i nivå 1–4, i [src/strength.js](src/strength.js): förväntad
målskillnad per match mot ett genomsnittligt Premier League-lag på neutral plan, ur den
senaste skattningen – alla fyra ligorna på samma skala. National League skattas men räknas
inte. Används som motståndet i lagstatistiken (kolumnen Motstånd under Statistik → Lag):
snittet av motståndarnas styrka mot vad ett lag i divisionen möter i snitt.

Säsongsprognosen (resten av säsongen spelad 10 000 gånger, under Tabeller) och programmet
framåt fanns 2026-10-18 – 2026-10-20 och togs bort på användarens begäran.

## Kupongen

Gängets gemensamma kupong för omgången: de utvalda matcherna med ett tecken var – `1`, `X`,
`2` eller en gardering (`1X`, `X2`, `12`, `1X2`). Det som räknas är antal rätt, mot
ställningen efter 90 minuter (samma utfall som prognosen).

**Var den syns**

- **Förstasidan** (utan adress [Tobaksaffären](#tobaksaffären), med `#hem` den
  vanliga – ingen flik, dit leder namnet): till vänster oraklet och
  Ikaros som två polaroider med mottot under (se [Omgångens tippare](#omgångens-tippare)),
  till höger omgången utan kort runt sig – i telefonen bilderna överst och omgången
  centrerad under. Omgångens kupong är gängets kupong ur omgången som alla tippade (se
  [Inför uppgörelsen](#inför-uppgörelsen)) tills den är färdigspelad; den visar datumen,
  Kupong 1 med namnet under, *Startar lör 16:00* före första avsparken och därefter antal
  rätt och en prick per match, och knappen in till kupongen. Är den färdigspelad står
  nästa omgång där (*Matcherna väljer inte sig själva* med *Välj matcher*).
- **Fliken Kupong** (`#kupong`) handlar bara om nästa kupong – de färdigspelade står i
  Olympen. Den är hela omgångens kupong: antal rätt, en skala med
  rätt, möjliga och modellens väntade antal rätt, och varje match med vårt tecken som tre
  rutor (valda fyllda, utfallet grönt om vi hade det och rödringat om inte), modellens tips
  som en prick under rutan och modellens chans för vårt tecken. När alla matcher är spelade
  (även om spoilerskyddet döljer resultaten) visas knappen *Skapa ny kupong*, och
  *Betyg och kommentar* leder till kupongen i Olympen. Under den står andra kuponger
  som inte är färdigspelade (t.ex. nästa omgångs). Utan kupong: knappen *Skapa kupong*.
  De färdigspelade: se [Kuponghistoriken](#kuponghistoriken). Matchlistan ligger under fliken Matcher (`#matcher`) och visar
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
   lagnamnen i kupongvyn och följer med till kuponghistoriken. Utkastet sparas i webbläsaren.
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

Knappen *Ladda upp system* (i Ny kupong och Ändra och under omgångens kupong) tar en eller flera skärmbilder av ett spelat system –
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
Utan dator: *Actions → Driftsätt kupongtjänsten → Run workflow*
([.github/workflows/kupongtjansten.yml](.github/workflows/kupongtjansten.yml), sedan
2026-10-22). Den kräver hemligheten `CLOUDFLARE_API_TOKEN` i repot (*Settings → Secrets
and variables → Actions*): en nyckel från Cloudflare, *My Profile → API Tokens → Create
Token*, mallen *Edit Cloudflare Workers*.

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

Matcherna står efter avsparken. En kupong som gjordes ur en omgång från Stryktipset har
`"spel": "Stryktipset"` och står i filens ordning – Stryktipsets nummer – på sidan, när den
ändras och i historiken (matcher som läggs till efteråt hamnar sist). Går matcherna då inte
i datumordning står veckodagen på raden i stället för dagens rubrik.

En trasig fil stoppar inte bygget; felet visas längst ned under fliken Kupong. Lokalt går
det att prova med en egen mapp: `KUPONG_DIR=/tmp/kuponger npm run build`.

## Inför uppgörelsen

Någon i gänget skapar omgångens kupong – väljer matcherna – och var och en fyller i den för
sig: ett tecken, en halvgardering eller en helgardering per match. Man ser de andras tips
först när man själv har lämnat in. Allas tips blir underlaget för uppgörelsen i telefon där
gängets kupong bestäms.

Allt ligger under *Kupong*. Överst visar fyra steg var
omgången står: *Välj matcher*, *Alla tippar*, *Uppgörelsen* och *Matcherna* (hur många
som har lämnat in stod förut under *Alla tippar*; sedan 2026-10-22 säger stämpeln på
papperet det). Medan kupongen fylls i och tipsen jämförs visar
`#kupong` omgången; när gängets kupong är gjord visar den gängets kupong, med knappen
*Allas tips* tillbaka till underlaget (`#kupong/samtal`). Kuponger som spelas under tiden står
under omgången.

**Gången**

1. **Skapa kupong** (*Kupong → Skapa kupong* eller *+ Ny kupong*, `#kupong/samtal/ny`):
   någon väljer kupongens tretton matcher (samma sökning och tävlingsfilter som Ny kupong).
   Oftast behövs det inte: när Svenska Spel öppnar veckans Stryktips (måndagar kl. 07) och
   förra omgången är färdigspelad – tre timmar efter sista avsparken – blir Stryktipsets
   matcher omgångens kupong av sig själv, och *Ändra matcherna* (steg 1) byter ut dem man
   vill. Det händer bara om alla tretton finns på sajten och ingen har startat, och bara en
   gång per Stryktipsomgång – en som tas bort eller ersätts kommer inte tillbaka.
   Matcherna står i den ordning de valdes – det är numren på kupongen. *Välj matcher*
   börjar med veckans Stryktips ifyllt (utom när omgången som pågår redan är det), och
   *Hämta Stryktipset* fyller kupongen med det igen, i Svenska Spels ordning (matcher som
   inte finns på sajten eller har startat kommer inte med, med en rad om vilka). Kommer
   matcherna inte i datumordning står veckodagen på raden i stället för dagens rubrik.
   Kupongen bredvid programmet har tretton tryckta rader som fylls i uppifrån; när den är
   full tonas plustecknen ner, och *Skapa kupongen* (och *Spara matcherna*) kräver precis
   tretton. Papperet i Ny kupong har samma tretton rader men inget krav. Ingen tid för
   uppgörelsen behövs – tipsen visas av sig själva (punkt 4). En åt gången; fylls en i (någon match har inte startat) frågar sidan
   först *Ersätt den*. *Ändra matcherna* går tills någon har lämnat in. Den gamla vägen –
   gängets kupong direkt – finns kvar under länken *Eller gör gängets kupong direkt*.
   Medan kupongen fylls i står den överst på förstasidan och under Kupong.
   Förstasidan visar hur lång tid som är kvar – till första avsparken, då inlämningen
   stänger (nedräkningen går av sig själv och blir bärnstensfärgad den sista timmen) – och
   en rad som säger samma sak som stämpeln på papperet, med efternamnen: *Väntar på
   Teijder*, *Väntar på dig och Teijder*, *Väntar på alla* (vilka som är inne när man
   pekar), och grönt *Alla inne*. När tiden är ute står det *Dags för uppgörelsen* och vem
   som inte lämnade in; när gängets kupong är gjord tar den över. Porträtt står inte där –
   gänget syns redan på polaroiderna (2026-10-22). Har man börjat på sin kupong heter
   knappen *Fyll i resten*. En
   färdigspelad kupong visas inte bredvid medan en ny omgång fylls i – den står bland
   Grupparbetena i Olympen.
2. **Fyll i kupongen** (direkt under Omgången, `#kupong`): kupongen står på papper med en
   kolumn per person – DL, DT och DJ i gängets ordning, var och en i sin färg (blått,
   grönt, lila) – och spelstoppet (första avsparken) i hörnet. Överst i varje kolumn
   porträttet: i färg med en grön bock på porträttet när kupongen är inne (som på
   förstasidan), grått tills dess, med en tårtbit (så stor del av kupongen som är tippad
   när den inte är färdig – bärnsten medan den fylls i, grön om den är inlämnad med tomma
   matcher; antalet när man pekar) eller tre prickar (fyller i) bredvid. Stämpeln på
   papperet säger vem omgången väntar på – *Väntar på DL*, *Väntar på dig och DJ*, *Väntar på
   alla* (vilka som är inne när man pekar) – och blir grön *Alla inne* när alla har lämnat in
   (2026-10-22; förut stod *Inlämnad* där när man själv var inne, och det sa inte vem). Har
   man lämnat in står en grön bock *Inlämnad* där *Lämna in* stod. Ens egen tårtbit följer
   kupongen medan man kryssar, de andras syns när de har sparat. Man trycker på sina
   initialer (*Vem är du?* – sparas på enheten, de ringas in), kryssar i sin kolumn med
   modellens odds under rutorna och kan skriva en kort motivering under matchen man just
   tippade (högst 140 tecken). I telefonen står matchens nummer före lagen. Raden med initialerna står kvar överst när man bläddrar.
   Nederst hur många matcher som är tippade, garderingar och rader (med regeln spikarna och
   garderingarna mot den och oddset, se *Regeln* nedan), med streckkoden och
   omgångens id till höger (som på kupongen på pulten i tobaksaffären), och under dem raden
   med allt man gör med kupongen, som står kvar nederst medan man bläddrar (som raden med
   initialerna överst): till höger *Spara* och *Lämna in*, till vänster
   *Ändra matcherna* och *Ta bort* i finstil (i telefonen bakom ⋯). *Ta bort* tar med de
   andras inlämnade tips, så den finns bara tills någon annan har lämnat in (2026-10-22). *Spara* sparar en
   kupong som inte är färdig utan att lämna in – tipsen stannar på enheten, tjänsten får
   bara antalet tippade, så att de andra ser tårtbiten – och blir *Sparad* tills man
   ändrar något. *Lämna in* kräver tecken i alla matcher – annars blir
   rutorna som saknar kryss röda – och att kupongen följer regeln. Har
   matcherna ändrats sedan sidan öppnades säger tjänsten till, och sidan visar de nya
   matcherna med ens tecken kvar där matchen fortfarande är med.
   **Ändra sin kupong** (2026-10-22): har man lämnat in går ens kolumn fortfarande att
   kryssa i direkt på papperet, tills man ser någon annans tips – då står ens tips fast.
   Ändrar man något blir *Inlämnad* till *Ångra* och *Lämna in ändringen*; matcher som har
   startat står kvar som de var. En ändring får lämna matcher tomma; då blir ens bock en
   grön tårtbit tills de är tippade. Det går på vilken av ens enheter som helst. Förut
   öppnade knappen *Ändra din kupong* (`#kupong/samtal/tips`) kolumnen på en egen sida,
   också efter att man sett de andras tips; den är borta.
3. **De andras tips** (`#kupong`): den som inte har lämnat in ser bara sina egna kryss
   (raden *Lämna in, så ser du hur DL och DJ har tippat* är borta sedan 2026-10-22 –
   stämpeln säger *Väntar på dig*).
   Den som har lämnat in ser allas inlämnade tips – så fort minst en
   till är inne – och vilka som fortfarande fyller i. Ett tryck på någons porträtt överst
   lyfter fram den personens tips: de andras porträtt i rutorna och deras motiveringar tonas
   ner, så att hens kupong står som en egen kolumn (ett tryck till visar allas igen). Samma sak i uppgörelsen och på
   gängets kupong. **Alla ens enheter** (2026-10-22): de andras tips och ens egen kolumn
   finns på varje enhet där man är sig själv, inte bara på den där man lämnade in (förut
   krävdes en nyckel som bara fanns där). På en ny enhet trycker man på sitt porträtt
   (*Vem är du?*). En enhet som redan är någon som inte har lämnat in kan inte byta till
   någon som har det – så ser ingen de andras tips av misstag. Sidan frågar tjänsten var 20:e sekund
   och visar nya tips av sig själv – också förstasidans ruta, medan tipsen lämnas in.
4. **Underlaget** – för alla när alla har lämnat in, eller senast när första matchen
   startar; sedan kan den som inte har lämnat in inte göra det. Överst allas
   garderingar, rader och (när matcher spelats) antal rätt. Varje match har rutorna
   1, X och 2 med porträtten på dem som tippat tecknet – utan tomma ringar för de andra
   (2026-10-22) – (streckad ram = del av en gardering), hur många av gänget som har med det och modellens chans. Motiveringarna står
   under lagen. Matcherna sorteras efter hur oeniga vi är:
   - *Alla olika* – inget tecken har mer än en
   - *Två mot en* – den som avviker förklarar
   - *Samma grund, olika säkerhet* – alla har med samma tecken, men någon har garderat
   - *Eniga mot modellen* – alla har samma tecken, och modellens troligaste är inte med
   - *Eniga* – klubbas utan snack
5. **Gängets kupong** (så fort man ser de andras tips, också om någon inte har lämnat in):
   man trycker på rutorna (två rutor =
   gardering). Den börjar som förslaget – med regeln ett som följer den (se *Regeln*), annars
   tecknen som fler än hälften har med och *Alla olika* tomma – och sparas bara på enheten, så en håller i pennan under uppgörelsen (*Börja
   om* går tillbaka till förslaget). Nederst syns kupongen som rutor med antal rader.
   - *Spara gängets kupong* sparar den direkt därifrån – samma tjänst och kontroller som *Spara kupong*
     under Ny kupong (se [Kupongen](#kupongen)). Matcher utan tecken kommer inte med; sidan
     frågar först. Därefter står gängets kupong under Omgången, med en rad om att den är
     sparad och syns för alla efter bygget.
   - Utan tjänsten heter knappen *Gör gängets kupong* och öppnar Ny kupong (eller *Ändra*)
     med tecknen ifyllda. Raden längst ner har bara *Börja om* bredvid, och *+ Ny kupong*
     när gängets kupong är gjord eller alla matcher har startat (2026-10-22: *Ändra din
     kupong*, *Justera först*, *Ladda upp system* och *Ta bort* är borta därifrån).
   - Finns gängets kupong redan blir knappen *Spara ändringen* (kupongen ändras, ingen ny
     görs), och står rutorna som den sparade kupongen visas *Sparad*. Har man inte själv
     tryckt på rutorna följer de den sparade kupongen – så den som öppnar underlaget på en
     annan enhet ser gängets kupong, inte förslaget, och kan inte skriva över den av misstag.
   - Har någon annan sparat eller ändrat gängets kupong under tiden säger sidan till, med
     *Visa den* och *Spara våra tecken över den* (en ändring av den, ingen dubblett).
   - Gängets kupong räknas som gjord också när alla dess matcher har startat, så att
     underlaget inte ber om den igen medan omgångens sista matcher återstår. *Allas tips*
     under Omgången leder tillbaka till underlaget så länge omgången finns.
6. **Kommentarer i efterhand** (2026-10-21): i underlaget och på gängets kupong ur omgången
   har varje match som har startat en penna i ens bläck efter tiden – samma som motiveringen
   när man tippar, och man skriver på samma rad (högst 140 tecken). Före avspark syns pennan
   bara om man redan har skrivit något (2026-10-22). Kommentaren sparas när man lämnar fältet
   eller trycker Enter (Esc ångrar); går det inte blir den röd och står kvar tills nästa
   försök. De andras kommentarer står under motiveringarna, med porträttet. Det går så fort
   matchen har startat för den som ser de andras tips, och efter att matchen är spelad, så
   länge omgången finns. En per person och match; en tom tar bort den.
   Motiveringarna och kommentarerna sparas i tipparhistoriken och står sedan under matcherna
   i Grupparbetena (se [Kuponghistoriken](#kuponghistoriken)).

**Regeln** (2026-10-25): gänget spelar Stryktipset med 4 spikar, 5 halvgarderingar och 4
helgarderingar (2 592 rader) – `regel: {spik: 4, halv: 5, hel: 4}` i
[config/kupong.js](config/kupong.js), som bygget skriver i `data/kuponger.json` under
`samtal.regel` ([public/samtal.js](public/samtal.js), `regel`, `brott` och `fit`). Den gäller
omgångar med lika många matcher som regeln (tretton); `regel: null` stänger av den. Med regeln:

- **Foten** på papperet, i uppgörelsen och på kupongen på pulten i tobaksaffären visar
  *Spikar*, *Halvgard* och *Helgard* mot regeln (t.ex. 3/4) och *Odds* – fyra fält på en rad.
  Siffran blir röd när det är fler än regeln har. *Tippat*, *Garderingar* och priset står inte
  där: med regeln är priset alltid detsamma.
- **Lämna in** (på papperet och på pulten) går bara när kupongen har precis regelns spikar och
  garderingar; annars står t.ex. *6 spikar – regeln är 4 spikar, 5 halvgarderingar och 4
  helgarderingar.* En ändring av inlämnade tips får lämna matcher tomma, men inte ha fler av
  något slag än regeln.
- **Förslaget** till gängets kupong följer regeln, ur allas tips: varje tecken får det gänget
  har med av det – en spik väger 3, en halvgardering 2 och en helgardering 1 – och spikarna,
  halvgarderingarna och helgarderingarna läggs så att så mycket som möjligt av det kommer med.
  De mest eniga matcherna blir spikar och de mest oeniga helgarderingar. Står två tecken lika
  där ett av dem ska bort lämnas matchen tom åt uppgörelsen; ett tecken som ingen har med kommer
  inte med. *Börja om* går tillbaka till förslaget.
- **Spara gängets kupong** (på papperet och på pulten) går inte när den har fler av något slag
  än regeln; matcher utan tecken frågar sidan om som förut.
- Regeln kontrolleras på sidan, inte i tjänsten, som litar på gänget (se [Säkerhet](#säkerhet)).

**Tjänsten** är samma som sparar kupongen (*profeterna-kupong*, adressen i
[config/kupong.js](config/kupong.js) med `/samtal` i stället för `/kupong`; bygget skriver
den i `data/kuponger.json` under `samtal`, med `gang` – vilka som tippar – och `regel`). Tipsen ligger i
KV-bindningen `KUPONG`, inte på GitHub: `samtal:aktuellt` (omgången),
`samtal:<id>:tips:<vem>` (en nyckel per person, så att två som lämnar in samtidigt inte
skriver över varandra), `samtal:<id>:utkast:<vem>` (en sparad kupong som inte är inlämnad:
bara antalet tippade, för omgångens matcher som de var då), `samtal:<id>:efter:<vem>`
(kommentarerna i efterhand, `{<matchid>: {text, skriven}}`) och `samtal:<id>` (en tidigare
omgång, sparad när nästa startas). En omgång som skapades med *Hämta Stryktipset* – eller
av sig själv – har
`spel: {"namn": "Stryktipset", "nr": <Svenska Spels omgång>}` (`starta` och `matcher` tar
`spel`; utan det står omgångens kvar).
`GET /samtal` startar veckans Stryktips när ingen omgång pågår (id:t slutar på `st<nr>`, så
två som frågar samtidigt startar samma omgång) och minns det i `samtal:auto`
(`{nr, startad, id}`, eller `{nr, provad}` när inte alla matcherna fanns – då prövas det igen
efter en timme). Svarar inte Svenska Spel eller sajten visas omgången som den är.
`GET /samtal` ger omgången, vem som lämnat in och hur många matcher var och en har tippat
(`gang[].tippat`, ur de inlämnade tipsen eller en sparad kupong) – tipsen bara när de visas
för alla – och
`forra`, omgången före, om dess tips visades när den ersattes (`samtal:forra`; så att
bygget hinner spara den i tipparhistoriken). `POST /samtal`: `starta`,
`matcher`, `spara`, `tips`, `se` och `efter`. `efter` (`id`, `vem`, `match`, `text`) sparar en
kommentar i efterhand när tipsen visas för alla, före det för den som har lämnat in; GET, `se` och
svaren ger dem under `efter` på samma villkor som tipsen.
`spara` tar antalet tippade (`tippat`) för den som inte
har lämnat in. `tips` skickar med omgångens matcher som sidan visade dem
(ändrade matcher → 409 med `andrade`); för den som redan har lämnat in ändrar det tipsen (i
matcher som inte har startat, gärna med tomma matcher; `ändrad` sparas bredvid `inne`).
`se` ger allas inlämnade tips till den som själv har lämnat in. Vem man är väljer man själv,
så tjänsten litar på gänget (se [Säkerhet](#säkerhet)). Fram till 2026-10-22 fick den som
lämnade in en nyckel som `se`, `efter` och ändringar krävde; sidan skickar den fortfarande
med om enheten har den, så att den fungerar mot en tjänst som inte har driftsatts om.
Lokalt: med `KUPONG_LOKALT=1` i `.env` finns
`/api/samtal`, som sparar i `data/cache/samtal/` (eller `SAMTAL_DIR`).

**Stryktipset** hämtas av samma tjänst, `GET /stryktipset` (den öppna omgången) och
`GET /stryktipset?nr=<omgång>` ([worker/stryktipset.mjs](worker/stryktipset.mjs)) – Svenska
Spel svarar inte på anrop direkt från sajten. Svaret sparas en minut i tjänsten. Sidan
([public/folket.js](public/folket.js)) knyter matcherna till sajtens på lagen och avsparken –
tjänsten med samma regler när den startar omgången (`linkDraw`). Lokalt
`/api/stryktipset` (med `KUPONG_LOKALT=1`).

**Omgångens namn** (2026-10-20): i stället för *Omgångens kupong* får varje omgång ett eget
namn av AI:n – det mest intressanta med just den omgången, sagt med lågmäld ironi, t.ex.
*Bournemouth trivs på Old Trafford* (Bournemouth har inte vunnit borta i år men vann 0–3 två
gånger där) eller *Man delar notan på Ewood Park* (de senaste mötena slutade oavgjort). Vad
namnet syftar på står när man pekar på det. Ungefär var tredje omgång får namnet gärna handla
om pengarna – drömmen om storkovan. Namnet är rubrik i förstasidans ruta (tiden kvar står
ovanför) och på omgångens sida (datumen ovanför). Det skrivs när någon först öppnar omgången
efter att matcherna valts (några sekunder med Claude; så länge står *Omgångens kupong* kvar,
sedan tonar namnet fram) och syns sedan likadant för alla. Ändras matcherna får omgången ett
nytt namn. Gängets kupong får omgångens namn när den sparas (`namn` i kupongfilen, så också i
kuponghistoriken och som rubrik i förstasidans ruta), om den inte redan har ett; saknas det när kupongen
fryses in i kuponghistoriken tar bygget namnet från omgången med flest av kupongens matcher
(minst hälften). Bygget (`--journal`) fryser också in namnet och vad det syftar på i
tipparhistoriken (`namn`, `syftar` per omgång; `tippare.json` har `name` och `hint`), med
`POST /namn {"id", "las": true}` – läsläget ger namnet omgången senast fick och skriver inget
nytt. Namnet syns då i Olympens omgångar, höjdpunkter och kurva, i *Poäng per omgång* och i
rutan för förra omgången på förstasidan, med datumen under. Namnet skrivs i samma
proxy som matchanalysen och kommentaren (`POST /namn {"id": "<omgångens id>"}`,
[worker/namn.mjs](worker/namn.mjs), prompten och modellen i [config/namn.js](config/namn.js))
– av Claude (`claude-opus-5-5`, med Anthropics officiella SDK och `fallbacks: "default"`) när
hemligheten `ANTHROPIC_API_KEY` finns, annars av DeepSeek som analysen. Claude får också söka på
nätet efter nyheter kring lagen (Anthropics sökverktyg, högst fem sökningar), så att det mest
intressanta kan vara en nyhet och inte bara statistik – t.ex. *Mästarbesök i Bromley*
(Leicester, mästare för tio år sedan, borta mot en klubb som var utanför ligasystemet 2024).
Instruktionen är medvetet kort; långa regler gjorde namnen stela. I stället visar den åtta namn
som gänget har valt ut bland ett fyrtiotal förslag (t.ex. *Arsenal ligger där de brukar*, *Spurs
har alltid trivts på Bron*), säger att de visar tonen och inte vad namnet ska handla om, och ber
om en handfull förslag där det roligaste vinner (förslagen sparas med namnet). Proxyn läser omgången
ur samma KV-namnrymd som tipsen och matchernas underlag ur den publicerade sajten
(`data/match/<id>.json`: arena, odds, tabell, hemma- och bortafacit, form, mål mot xG, vila,
tidigare möten), räknar fram en sammanfattning (lag som spelar flera gånger, största favorit,
jämnaste match, chansen till alla rätt med modellens troligaste tecken) och tar med gängets
senaste kupong och de tolv senaste namnen (`namn:senaste`), så att namnen skiftar. Tal i
förklaringen måste finnas i underlaget. Namnet sparas för alltid per omgång och matcher
(`namn:<promptversion>:<omgång>:<matcherna>`). Bygget skriver adressen i
`data/kuponger.json` under `samtal.namn`. Lokalt `/api/namn` (med en av nycklarna i `.env`
och `KUPONG_LOKALT=1`). Claudes nyckel läggs in en gång:

    npx wrangler@4.147.0 secret put ANTHROPIC_API_KEY --config worker/wrangler.toml

## Kuponghistoriken

**Olympen → Grupparbetena** (sist i Olympen, `#olympen/kuponger`, en viss kupong
`#olympen/kuponger/<id>`; gamla länkar till `#kupong/historik/<id>` och
`historik.html#<id>` leds dit, [public/historik.js](public/historik.js)) visar varje
färdigspelad kupong: antal rätt, en prick per match, betyget, AI:ns kommentar och – under *Matcherna* –
varje match med tecken, resultat, modellens chans och gängets anteckning – och under den
allas motiveringar och kommentarer i efterhand, en rad var med porträttet i personens färg,
ur omgången som kupongen gjordes ur (den i tipparhistoriken med flest av kupongens matcher,
minst hälften; bygget läser dem därifrån varje gång, de fryses inte in i kupongen).
*Matcherna* säger hur många anteckningar och kommentarer kupongen har. Överst antal
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

**Rättningen på papperet** ([public/rattning.js](public/rattning.js)): första gången man ser
en färdigspelad kupong under *Kupong* rättas den inför ögonen – ringen runt utfallet dras en
match i taget, ställningen skrivs och bocken sätts, sedan antalet rätt i hörnet och sist
stämpeln *Rättad*. Webbläsaren minns vilka kuponger som rättats; ett tryck på stämpeln rättar
en gång till, och med reducerad rörelse står allt klart direkt. Under raderna skriver
*Klassföreståndaren* betyget och AI-kommentaren i rödpenna, ur historiken – de kommer när
bygget har tagit in kupongen där, och skrivs fram när man skrollat dit.

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

Olympen har överst en ruta som visar vem i gänget som tippade bäst och sämst i omgången
(fram till 2026-10-22 stod den under kupongen på förstasidan). Underlaget är var och ens egna tips inför samtalet (`GET …/samtal`,
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
  orakel och Ikaros kvar i en egen ruta med den omgångens datum. Före första omgången är
  det `KRONAN_START` i kronan.js – Daniel Laino som orakel och Daniel Johansson som Ikaros
  – och då står ingen ruta i Olympen; de syns på polaroiderna och på pallen.
- **Polaroiderna på förstasidan** (`Kronan.polaroids`, `hem.css`): de som regerar – samma
  två som i rutan – i varsin polaroid med titeln och namnet i kanten. Det är stillbilder
  ur scenerna (som utan rörelse: Ikaros mitt i fallet), som spelas när man pekar på dem,
  och de leder till Olympen. Färgövergångarna i dem har egna id:n, så att de inte hämtas
  ur Olympens ruta när den är dold.
- Saknas modellen för en match används kuponghistorikens schablon: 45 % för ett tecken,
  75 % för två. Uppskjutna och inställda matcher räknas inte.
- *Poäng per match* (utfällbar) visar varje tips med poängen.

Bara den pågående omgången finns i `GET …/samtal`. När nästa omgång startas försvinner
rutan – men omgången finns kvar i säsongen nedan och i Olympens ställning.

### Utmärkelserna

När omgången är färdigspelad delas utmärkelser ut efter hur var och en tippade, som en rad
bilder under orakel och Ikaros ([public/utmarkelser.js](public/utmarkelser.js),
`utmarkelser.css`). De står kvar i rutan med den senaste omgången tills nästa omgång är
igång. Titeln låter som en dygd; raden under säger hur det gick. Allt räknas i webbläsaren
ur tipsen, resultaten efter 90 minuter, modellens prognos före avspark och gängets kupong
– samma underlag för den pågående omgången (`GET …/samtal`) och de avslutade
(`data/tippare.json`), så inget nytt sparas.

| Utmärkelse | Går till | Raden | Bilden |
|---|---|---|---|
| Den oumbärlige | gav laget flest rätt (minst 2) | *7 av lagets 8 rätt* | bär templets tak |
| Den missförstådde | ensam om rätt | *Ensam om rätt i Leeds – Man Utd* | i strålkastarljuset, pratbubblan krymper |
| Finansgeniet | största skrällen som satt (odds över 3,00) | *10 kr blev 42 kr* | mynt som regnar |
| Den våghalsige | högst snittodds (minst 2,60, minst 3 matcher) | *Snittodds 3,80 · 1 rätt* | hjälm på i forsen |
| Den diplomatiske | flest helgarderingar | *Tog inte ställning i 3 matcher* | vit flagg |
| Den självständige | som modellens troligaste i minst 75 % | *Som modellen i alla 8* | marionett med M i trådarna |
| Den konflikträdde | flest kryss (minst 2 och en tredjedel) | *Kryss i 5 av 8* | tittar fram bakom en låda |
| Den konsekvente | 0 rätt (minst 3 matcher) | *0 av 8* | ett monument över nollan |
| Den upptagne | lämnade inte in | *Tippade inte* | bakom en dörr med Stör ej |
| Den storsinte | ledde ensam inför de sista matcherna men slutade inte överst | *Ledde till sista matchen* | kransen flyger sin väg |
| Den självsäkre | fel på sitt säkraste tips (minst 60 %) | *Fel på Leicester City · odds 1,35* | solglasögon, marken spricker |
| Otursfågeln | flest tips ett mål från rätt (minst 2) | *Ett mål ifrån i 3 matcher* | regnmoln bara över en, och en kråka |
| Den optimistiske | minst 2 skrällar, ingen satt | *4 skrällar, ingen satt* | ballongerna spricker |
| Den förutseende | garderade och hade fel ändå (minst 2) | *Garderade 3, fel i alla 3* | paraply och livboj, regnet från sidan |

- Var och en får högst en utmärkelse per omgång, och varje utmärkelse kräver en ensam
  vinnare – bara Den konsekvente och Den upptagne kan delas. Alla delas inte ut varje gång.
- **Den som gav laget fler rätt än de andra** får bara en positiv utmärkelse (de sju
  första i tabellen, och Den oumbärlige först). Att ge laget en rätt = ha rätt tecken i en
  match där gängets kupong satt. Gängets kupong är den sparade kupongen med flest av
  omgångens matcher (minst hälften); utan kupong räknas ens egna rätt.
- Annars får man den första man vann i ordningen *Den upptagne, Den oumbärlige, Den
  konsekvente, Den storsinte, Finansgeniet, Den förutseende, Den optimistiske, Den
  missförstådde, Den konflikträdde, Den våghalsige, Den diplomatiske, Den självsäkre,
  Otursfågeln, Den självständige* – de ovanligaste först.
- Bilderna använder kröningens kroppar (`KRONAN_KROPPAR`); var vänstra handen, ögonen och
  midjan sitter och vem som redan har hjälm står i `KROPP` i utmarkelser.js. Utan rörelse
  (prefers-reduced-motion) står allt stilla.

### Säsongens tippare

Säsongen står i Olympen ([public/kampen.js](public/kampen.js)): ställningen som en
prispall med summan av omgångarnas poäng, antal rätt av de spelade matcherna och antal
gånger som *Omgångens orakel* (bäst) och *Omgångens Ikaros* (sämst), som märken under
namnet, och modellen som jämförelse, utan placering. Placering efter summan med en
decimal, sedan antal rätt. En omgång räknas för den som tippade i den. Tabellen
*Omgångarna* visar varje omgång med orakel och Ikaros inramade i guld och rött. Döljer
spoilerskyddet någon match i en omgång räknas hela omgången bort, med *Visa ändå*. (Fram
till 2026-10-22 stod samma topplista också under omgångens ruta på förstasidan.)

**Filen** `data/tippar-historik.json` committas och växer bara. Bygget på GitHub Actions
(`--journal`) hämtar `GET …/samtal` och skriver in omgången **när tipsen visas för alla**,
med matcherna och var och ens tecken. Tipsen går att ändra tills matcherna startar, så
omgången skrivs om när tjänsten visar andra tips, tills den är klar. När varje match är
avgjord fylls resultatet efter 90 minuter och modellens prognos före avspark i, och
omgången får `klar`. Sedan ändras den aldrig – utom motiveringarna (`motivering`) och
kommentarerna i efterhand (`efter`), text per person och match, som följer tjänsten så länge
den visar omgången (som omgången eller `forra`), så att det som skrivs efter sista matchen
också kommer med. Eftersom tipsen sparas redan när de visas
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
        { "id": "401878771", "match": "Everton – Chelsea", "avspark": "2026-10-17T11:30:00.000Z", "tips": { "DL": "2", "DT": "X", "DJ": "1X" }, "motivering": { "DL": "Chelsea vinner alltid där" }, "efter": { "DT": "Typiskt" }, "resultat": "0–2", "modell": [35, 26, 39] }
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
- **Omgångarna:** alla omgångar med poängen, orakel och Ikaros inramade – och gängets
  kupong ur omgången (antal rätt i betygets färg, länk ner till den i Grupparbetena). Kupongen
  är den färdigspelade med flest av omgångens matcher, minst hälften av kupongens. I
  telefonen står den som en rad under omgångens namn i stället för en egen kolumn.
- **Grupparbetena:** de färdigspelade kupongerna, se [Kuponghistoriken](#kuponghistoriken).
  Syns inte förrän den första är färdigspelad.

Före första omgången står alla på noll med en länk till Kupong. Säsongens
tippare på förstasidan länkar hit (*Till Olympen*).

## Tobaksaffären

Förstasidan (utan adress), på datorn och i telefonen (se [I telefonen](#i-telefonen)):
tobaksaffären vid spelpulten. Scenen ritas i 1600 × 1000 och skalas så att den täcker
fönstret; lagren ligger på olika djup (CSS 3D) och vrids lite när musen rör sig. Vridningen
sätts som `transform` direkt på `.rum-world` (`setCam` i rum.js), inte som CSS-variabler:
variabler ärvs av varje element i rummet, så Chrome räknade om stilen för hela rummet och
målade om allt i varje bildruta medan musen rörde sig, hann inte rita det och visade bildrutor
där väggen, fönsterbänken och pulten var svarta (flimmer). Text i SVG står i egna små SVG:er (namnet på
dörren, skyltarna på gatan, texten på videon): Chrome lägger ut text i SVG på nytt i varje
bildruta medan rummet vrids, och SVG:en den stod i – hela bakväggen, gatan, videons ritning –
målades om varje gång (målningen tog dubbelt så lång tid per bildruta). När kameran glider fram
till en närbild eller tillbaka (tv:n, videon, anslagstavlan, kortregistret, uret …) ritade
Chrome hela rummet i närbildens skärpa, också det som strax hamnade utanför bilden, eftersom
förstoringen i övergången gäller allt under kameran: lagren tog 450–540 MB i 1400 × 743 med
täthet 2, mer än de 512 MB Chrome ger en sida, så att rutor fattades medan kameran gick fram och
tillbaka, och rummet låg kvar i närbildens skärpa efteråt. I Chromium (`navigator.userAgentData`,
klassen `chromium` på `.rum`) har kamerans transform därför ett `perspective()` som inte syns
(det som ligger i kameran är platt). Då kan Chromium inte räkna ut förstoringen och ritar
lagren i den skärpa de redan har medan kameran glider – suddigt på vägen fram, som när rummet
vrids. Sakerna i planen har där `will-change: opacity` i stället för `transform`, så att det som
syns ritas skarpt när kameran står still, nära och på håll (ett lager med
`will-change: transform` behåller sin skärpa). Lagren tar nu 150–280 MB genom tv:n, videon,
skårtavlan, oraklet, affischen och anslagstavlan i rad, och närbilderna är lika skarpa som förut
(mätt i Chrome 153). Safari har kvar `will-change: transform`. Ändå flimrade tv:n, videon
och anslagstavlan när kameran gick fram till dem, av två skäl. Kameran ställdes in med
CSS-variablerna `--z`, `--dx` och `--dy`, som ärvs av allt i rummet, och Chrome målade då om
allt som har en variabel i stilen – tv:ns och anslagstavlans sidor (`var(--plast)`,
`var(--ek)`), videons ritningar och väggarna – varje gång kameran började gå fram eller
tillbaka; nu sätter `aim` i rum.js kamerans transform direkt. Och med grafikkortet ritar
Chrome i rutor över hela fönstrets bredd: rummet tog redan ungefär 440 MB av de 512 MB på
håll, så att minnet inte räckte till rutorna som syns när närbilden behövde nya – de ritades
inte, och det som fattades blinkade. Mest tog tv:n och videohörnet (60 och 95 MB), som
ritades i närbildens skärpa också på håll; nu gör de det bara nära (se [Tv:n](#tvn) och
[Videon](#videon)), och rummet tar ungefär 320 MB på håll. Synliga rutor som fattades under
närbilderna av tv:n, videon, anslagstavlan, oraklet och skårtavlan: från 126–200 till 0–42
(Chrome 153 med grafikkortets sätt att rita, SwiftShader, i 1400 × 743 med täthet 2).
Anslagstavlans lutning efter musen sätts av samma skäl som transform direkt; den ritar om
ungefär hälften så mycket. Vridningen efter musen (och efter var man står med fingret) följer
i varje bildruta (`kamera` i rum.js), inte 30 gånger i sekunden som gänget och sakerna i 3D:
att vrida världen ritar inte om något, och på skärmar med 60 eller 120 bilder i sekunden
hackade vridningen förut. I WebKit (Safari, och alla webbläsare i iPhone) släpper webbläsaren
det den har ritat av rummet utanför bilden medan kameran står nära något, och när kameran gick
tillbaka ritades allt det om på en gång medan glidningens klocka gick: kameran stod still
150–300 ms och hoppade sedan 30–100 % av vägen på en bildruta. Så länge något pågår på kameran
behåller WebKit allt, så medan kameran är borta från sin plats har den en osynlig rörelse som
aldrig tar slut – kamerans translate en hundradels bildpunkt fram och tillbaka (`kvar` i
rum.js) – som tas bort när den är hemma igen. Mätt i WebKit (WKWebView, 390 × 664, täthet 3,
median av tre varv): förlorad tid i bildrutorna på vägen tillbaka från tv:n 127 → 23 ms, uret
175 → 9, skårtavlan 244 → 13, kortregistret 124 → 38 och anslagstavlan 688 → 241, och den
längsta bildrutan 100–180 → 23–35 ms; på vägen tillbaka från tv:n stod bilden still 40–70 ms
och gled sedan jämnt (största steget 10–30 % av vägen). Minnet blev inte högre (toppen
870–1150 MB mot 990–1270), och närbilderna är lika skarpa. Att i stället pausa glidningen tills
WebKit hade ritat, ge den en fördröjning, en mjukare början eller dölja det som ligger utanför
bilden hela vägen hjälpte inte – WebKit ritar först när kameran rör sig. Chrome behöver inte
den osynliga rörelsen och får den inte. Namnet
och foten (*Vanlig sida*) ligger utanför scenen i fönstrets hörn;
någon meny finns inte, det är föremålen som leder vidare. Tangenterna (K kupongen, T tv:n,
A anslagstavlan, R kortregistret, V videon) står inte i foten – där låg de över kupongen i
mindre fönster – utan när man pekar på saken (*Tv:n · T*, `tangenter` i rum.js), och bara
med mus. [public/rum.js](public/rum.js)
ritar rummet och fyller det med sajtens data, [public/rum.css](public/rum.css) ger det utseendet och
rörelserna, [public/rum-tv.js](public/rum-tv.js) och [public/rum-tv.css](public/rum-tv.css)
bygger tv:n (se [Tv:n](#tvn)), [public/rum-anslag.js](public/rum-anslag.js) och
[public/rum-anslag.css](public/rum-anslag.css) anslagstavlan (se [Anslagstavlan](#anslagstavlan)),
[public/rum-register.js](public/rum-register.js), [public/rum-register.css](public/rum-register.css)
och [public/rum-kortlada.js](public/rum-kortlada.js) kortregistret (se [Kortregistret](#kortregistret)),
[public/rum-video.js](public/rum-video.js) och [public/rum-video.css](public/rum-video.css) videon
på disken (se [Videon](#videon)), och [public/rum-3d.js](public/rum-3d.js) ritar gänget och
[public/rum-inredning.js](public/rum-inredning.js) inredningen (se *Inredningen i 3D* nedan) i
three.js 0.160.0 (från jsdelivr, importmap i `index.html`), som hämtas först när rummet
visas – utan WebGL eller utan nätet står rummet kvar utan dem.

**Föremålen** – pekar man på ett lyser det (pokalerna också), och snabbvalet
på text-tv:n med samma ämne tänds, som när man pekar på snabbvalet med tv:n nära
(skårtavlan Tabeller, pärmarna Skyttar). Klickar man går kameran fram mot föremålet innan
sidan byts; oraklet, skårtavlan, uret och VM 94-affischen tittar man först på nära (se
[Närbilderna](#närbilderna)):

- **Omgångens orakel** (tavlan under stationsuret) → närbild → Olympen: oraklet som regerar
  (`Kronan.holders`) som i Olympen och på förstasidans polaroid (`Kronan.scene`) – det
  urklippta fotot på marmorsockeln med lagerkransen som glimmar och strålarna som vrider
  sig – bakom glaset i en förgylld ram i 3D med pärlstav, rosetter i hörnen och en palmett
  överst. Ett skimmer drar snett över glaset var elfte sekund. Mässingsskylten under säger
  *Omgångens orakel* och hela efternamnet (delat: *Laino & Johansson*, i mindre stil), och
  ramen och skylten lyser med när man pekar på dem.
- **Pokalhyllan** (högra väggen) → Olympen: en liten pokal per vunnen omgång i vinnarens
  färg (delat = en var), ur `data/tippare.json`.
- **Anslagstavlan** (under tv:n, i hörnet) → lapparna om omgångens lag, och därifrån
  Statistik (se [Anslagstavlan](#anslagstavlan)).
- **Kortregistret** (på disken under anslagstavlan) → ett kort per lag och per möte i
  omgången, och därifrån Lagen på Statistik (se [Kortregistret](#kortregistret)).
- **Skårtavlan** (under tv:n) → närbild → Tabeller: Premier Leagues topp ur `data/teams/pl.json`
  med vita plastbokstäver i spåren på svart filt, i en aluminiumram som sticker ut från
  väggen (3D). Varje bokstav sitter
  lite snett för sig (samma frö varje gång, så att inget flyttar sig), och lådan har bara
  fyra O – sedan blir det nollor.
- **Korktavlan** (längst till höger, i en träram i 3D) → gängets kuponger i Olympen
  (`#olympen/kuponger`): de färdigspelade kupongerna (`Historik.coupons`) rättade med röd penna, en med kaffering.
  Tom tills den första är färdigspelad.
- **Kupongen och kvittot** → Kupong. Kupongen är samma kupong som papperet under Kupong, i
  kupongens mått (660 × 470): bandet, under det stämpeln (vem omgången väntar på) och
  spelstoppet, porträtten med bock, tårtbit eller prickar och 1 X 2 överst, en rad per
  match i kupongens ordning med synkmarkeringen i kanten och dag, tid och serie efter lagen
  (dagens rubrik får inte plats), och i foten fälten *Tippat*, *Garderingar*,
  *Kombinationer* (eller *Pris*) och *Odds* och streckkoden med omgångens id (`Samtal.pult.top`
  och `fields`, `Papper.code`). Efter tiden står motiveringen för hand med blyerts, och
  utfallet ringas in (grönt när kupongen hade det, annars rött, streckat medan matchen
  pågår). På pulten ligger ditt utkast med dina kryss och motiveringar och ditt porträtt
  inringat; har du lämnat in ligger din i högen bredvid och på pulten en ny – och när du
  ser de andras tips ligger gängets kupong där, med gängets kryss med kulspetspenna och
  allas porträtt i rutorna (uppgörelsen). Kvittot visar när var och en lämnade in. Allt man
  gör med kupongen tas i handen, utan att man lämnar rummet (se
  [Kupongen i handen](#kupongen-i-handen)). Guldordet bredvid säger vad som väntar: *Fyll i
  kupongen*, *Fyll i resten*, inget alls när du har lämnat in och bara ser dina egna tips
  (din kupong i högen tas i handen med ett klick) och *Följ kupongen* när matcherna har
  börjat. När du ser de andras tips står en pingklocka i mässing där i stället för ordet:
  man ringer in gänget till uppgörelsen.
- **Högen** till vänster om kupongen: de som har lämnat in har lagt sin kupong där med
  baksidan upp, i den ordning de lämnade in (den senaste överst) – porträttet under ett gem,
  initialerna i personens bläck (samma som på papperet under Kupong) och stämpeln
  *Inlämnad*, men inga tecken. Din egen tas i handen, och de andras när du ser deras tips
  (se nedan). Innan dess lyfts en annans kupong bara lite i ena kanten och faller tillbaka.
- **Tv:n** uppe i hörnet till höger, en mörkgrå Panasonic från nittiotalet med text-tv på en arm från väggen, zoomas in med ett
  klick eller T och vrids då mot en; den står på kupongens matcher live (377), och där finns
  också omgångens matcher, tabellerna och skytteligorna (se [Tv:n](#tvn)). Esc eller ett
  klick utanför zoomar ut.
- **Videon** nere i hörnet till höger, en liten Sony-tv med inbyggd video som står på disken med
  ryggen mot väggen och rutan vänd mot gänget, med repriserna på VHS i en fruktlåda med två
  fack bredvid (förra omgången och lagen i nästa), zoomas in med ett klick eller V; tv:n och
  lådan står kvar som de står, och en kassett spelar matchens höjdpunkter i rutan.
  Ett klick på rutan går ännu närmare (se [Videon](#videon)). Esc, V eller ett klick utanför
  zoomar ut.
- **Namnet på dörren** (längst till vänster, under Stängt-skylten) → Om oss: *Matchfixarna*
  i bladguld på glaset, spegelvänt inifrån som neonskylten, med TOBAK & SPEL och *Öppet
  till spelstoppet* under. I fönster som är minst 8:5 syns hela dörren, och där står namnet
  inte i menyns hörn; i smalare fönster skärs dörren av och namnet står kvar i hörnet.

**Kupongstället** står på pulten vid fönstret (till vänster) och leder ingenstans: ett
fack av plexiglas, lågt fram och högt bak, med blanka kuponger (samma terrakottaband som
kupongen på pulten) som lutar bakåt, butikens pennor i ett rör bredvid och en lapp på
plexit: *Pennorna är räknade*.

**Stationsuret** sitter på bakväggen till höger om fönstret och leder bara till en närbild: ett
svarvat hölje i mörk metall från väggen fram till ett glas som buktar lite, vit tavla med
svarta streck, gulnad av röken, och visarna i var sitt lager – den röda sekundvisaren
hoppar varje sekund. Det går efter Stockholms tid, med samma klocka som
utsikten (`Vader.nu()` i vader.js, annars datorns klocka). Med `?rum-t` står det på den
tid det visade först, och med `prefers-reduced-motion` syns inte sekundvisaren.

Uret visar också hur länge det är kvar till spelstoppet, alltså den första avsparken i
omgången som gänget tippar (`stopp`, från rum.js). I ett fönster vid sexan, som
datumet i ett armbandsur, står dagarna kvar i rött (kalenderdagar i Stockholm), med DAGAR
(DAG) tryckt under; på spelstoppets dag står det en svart nolla. En röd spets i kanten
pekar på klockslaget, och de sista tolv timmarna fyller en röd sektor tavlan från
timvisaren fram till spetsen, så att den krymper medan tiden går. Fönstret ligger över
sektorn och under visarna. Mellan omgångarna och efter spelstoppet står fönstret tomt och
spetsen och sektorn är borta. Med `?rum-klocka` räknar uret från sin egen tid, och
`?rum-stopp=<timmar>` gäller uret också.

**Inredningen i 3D** ([public/rum-inredning.js](public/rum-inredning.js)): lysröret i taket
(en armatur med två rör och gavlar), neonskylten, Stängt-skylten, stationsuret,
orakelramen med mässingsskylten, cigarettpaketen uppe på högra väggen (två hyllor med
paket i rader om tre till sju; påhittade färger, inga märken), ramarna kring skårtavlan
och korktavlan och kupongstället är byggda i three.js som gänget. Neonskylten är glasrör med en
ljus kärna som följer bokstäverna i *Tobak*, spegelvänd inifrån: texten i Fraunces kursiv
tunnas ut till en linje och seriferna tas bort. Den hänger i kedjor från fönsterkarmen med
en svart list och transformatorn under, och glappar som förut. Stängt-skylten hänger lite
snett i ett snöre från en sugpropp på dörrens glas. Sakerna har framsidan där de platta
satt och kroppen tillbaka till väggen, så att sidorna syns och skuggorna faller på väggen
(inte på glaset och inte över anslagstavlan). Allt ritas med en och samma WebGL-duk, som
kopieras till en vanlig duk per sak i det plan där saken står (orakelramen i länken, så
att den lyser med); bara uret ritas om, en gång i sekunden.

**Gänget** sitter på barstolar runt ett runt barbord framför fönsterbänken, med benen
hängande: DL och DJ på sidorna, vända in mot bordet, och DT bakom (`BORD` och `FIGS` i
rum-3d.js). Bordet har en skiva av ljust laminat med ringar efter glasen, kromkant och en
kromfot, och barstolarna röd vinyl med söm och en krom ställning med fotring. Ölen, DT:s
askkopp och extraflaska och kupongerna står på bordet, och två tomflaskor står kvar på
fönsterbänken bakom DJ. DL dricker ur en flaska, DT röker
och skrattar, DJ har en burk i ena handen och pratar med cigaretten i den andra. Var och en
har sin loop (12–21 s) – flaskan och burken till munnen med huvudet bakåt, ett bloss med
glöden som tänds och röken som blåses ut, benen som dinglar – och huvudena nickar efter
musen. Röken från glöden räknas för varje bloss ur var glöden var när det föddes, så att
samma tid alltid ger samma bild. DL och DJ blinkar ungefär var fjärde sekund, ibland två
gånger i rad, med ögonen stängda en dryg tiondels sekund (`blinkar` i rum-3d.js; DT skrattar
med ögonen stängda och blinkar inte). Ansiktet med stängda ögon är samma ansiktsbild utan
ögonvitorna och ögonen och med det övre ögonlocket nere vid det nedre (`blundar`), och det
byts in medan ögonen är stängda. I en fast bild (`?rum-t`) och med `prefers-reduced-motion`
blinkar de inte. Det röda ljuset från neonskylten bakom dem slocknar när skylten glappar
(`neonOn` i rum.js skickas med till `draw`), så att kanterna på håret och jackorna mörknar
med skylten. Inga riktiga märken: flaskan säger PILSNER, burken ÖL –
från första advent till tjugondag Knut JULÖL (grön etikett, röd burk) och i påskveckan
PÅSKÖL (gul etikett, grön burk; `ol` i [public/rum-fika.js](public/rum-fika.js)).
Var och en bär sitt lag (`LAG` i rum-3d.js): DL en stickad halsduk i Nacionals vitt, blått
och rött med BOLSO på den ena änden, Nacionals sköld på den andra och fransar längst ner,
DT ett lejonhuvud i gammal stil i kungsblått med bandet BLUES på underarmen som håller
cigaretten (Chelsea; ett lejon, inte klubbens), och DJ en blåvitt randig mössa med tofs och
IFK Göteborgs sköld isydd mitt fram på uppviket, med guldkant och BLÅ och VITT på var sin
sida, och solglasögonen uppskjutna på den. Sköldarna är ESPN:s bilder i
`public/rum/skold-nacional.png` och `skold-ifk.png` (256 px; den genomskinliga kanten skärs
bort när de laddas, och saknas en blir det bara text). Halsduken följer bålen, tatueringen
vrids med handen och mössan följer huvudet; håret trycks ner under mössan och sticker ut
under kanten. Kläderna följer vädret utanför (se *Utsikten och vädret* nedan).

**De byter plats var tredje dag** (`PLATSER` och `placering` i rum-3d.js): DL till
vänster, DT bakom och DJ till höger den 25–27 oktober 2026, sedan DL bakom, DT till höger
och DJ till vänster, sedan DL till höger, DT till vänster och DJ bakom, och så vidare.
Dagen är Stockholms (`Vader.nu()`), så alla ser samma placering, och ingen byter plats
medan sidan är öppen – den nya syns vid nästa laddning. Platserna är en tabell: var
barstolen står och är vriden, vilken hand som är mot bordet och var sakerna står på
bordet (ölen, askkoppen, cigaretten, kupongen, handen som vilar och DT:s extraflaska), och
figuren tar sin del ur sidan (`sitt`). Den som hamnar på andra sidan byter hand: flaskan,
burken och cigaretten är alltid i handen mot bordet, och kupongen, pennan, lejonet (med
den uppkavlade ärmen), handen som lyfts vid ett mål och den mot pannan följer med, liksom
blickarna åt sidan. Bakom bordet vilar båda händerna på bordet. Sakerna ligger minst 10
innanför bordskanten och inom räckhåll för alla tre, och när någon kikar ner mot pulten
eller sjunker ihop vid ett mål lutar hen sig utåt, så att huvudet inte hamnar framför den
som sitter bakom bordet.

**Gänget följer omgången** (rum-3d.js, med läget från `gangTv` i rum.js):

- **Den som inte har lämnat in** en öppen omgång sitter med kupongen och pennan i stället
  för flaskan, burken och cigaretten, tuggar på pennan, sneglar på ölen och vänder på
  kupongen. Från ett dygn före spelstoppet tittar de som har lämnat in på hen en stund i
  taget, oftare ju närmare spelstoppet det är. Den sista timmen vänder de sig mot hen
  samtidigt, och då tittar hen upp från kupongen.
- **När matcherna pågår** (någon match live, också med dolda resultat) vänder de sig mot
  tv:n: huvudet så långt nacken räcker och resten med bålen. Då och då tittar var och en
  bort en stund (DJ pratar med DT). Tv:n lyser då svagt blått i ansiktena, från rutan uppe
  till höger, och skenet fladdrar lite som rutan (`tvLjus` i rum-3d.js, tänds och släcks
  med vändningen mot tv:n).
- **Vid ett mål** – när ställningen i en match har ändrats sedan rummet läste datan förra
  gången – reagerar var och en efter sitt eget tips (allas tips när de visas, annars
  gängets kupong). Den som fick rätt lyfter flaskan (DL), näven (DT) eller burken (DJ)
  snett uppåt, lutar sig bakåt och studsar lite. Den som tappade raden sjunker ihop med
  handen över ögonen (DL, DT) eller burken mot pannan (DJ). Den som inte påverkades nickar.
  Dolda resultat ger inga reaktioner, och när rummet öppnas räknas inga gamla mål.

**Gänget är ni** ([public/rum-folk.js](public/rum-folk.js), `pekar` och `hej` i
rum-3d.js): den som har rummet öppet syns i sin figur, som tittar dit hen pekar med musen –
på tv:n, anslagstavlan, oraklet, kupongen … eller på någon annan i gänget – och på det hen
har framme (tv:n eller videon nära, anslagstavlan, kortregistret, en närbild eller
kupongen i handen). Blicken går dit på en halv sekund, tar det som inte ryms i nacken med
bålen och går tillbaka när man slutar peka. Din egen figur gör det direkt (vem du är:
samma val som på kupongen), och de andras kommer genom tjänsten profeterna-rummet
([worker/rummet.mjs](worker/rummet.mjs)): en websocket till ett Durable Object som
håller reda på vilka som är inne och vad de pekar på och skickar det till alla när något
ändras. Inget sparas, sidan skickar högst var 150:e millisekund, och den stänger
websocketen när fliken döljs. Adressen är `rummet` i config/kupong.js (`samtal.rummet` i
data/kuponger.json); utan den gör bara din egen figur det. Pekar man på någon i gänget
tittar hen på en och skålar: lyfter flaskan (DL), burken (DJ) eller cigaretten (DT) mot en
och nickar, och tittar kvar tills man slutar peka. I telefonen gör ett tryck på figuren
samma sak en stund. Den som väntar på kupongen tittar bara, och ett klick på en figur går
inte vidare till det som står bakom.

**Natten** (`natt` i rum-3d.js och rum-inredning.js, `.natt` i
[public/rum-folk.css](public/rum-folk.css)): mellan midnatt och sex, Stockholms tid, är
lysröret släckt. Rummet är mörkt utom där gatan lyser in genom fönstret och dörren, från
tv:n och lite över pulten (samma lager som när lysröret tänds, med en annan mask), och
rören och reflektorn i taket är grå. DJ sover med huvudet på bordet och ögonen stängda
(armarna i kors under), DT:s cigarett har brunnit ner – ingen glöd, ingen rök – och han
nickar till ibland, och DL tittar på text-tv, som lyser svagt blått på dem. Matcher på
tv:n väcker dem, och den som inte har lämnat in är vaken med kupongen. Nära tv:n, videon,
en sak och med kupongen i handen är mörkret borta. Den som kommer in på natten får inget
lysrör som tänds; är sidan öppen klockan sex blinkar det igång som när man kommer in.

**Dagen efter** (`efter` i rum-3d.js): dagen efter och dagen därpå att gängets kupong
spelades färdigt (Stockholms dag) syns det vid bordet hur det gick, efter betyget i
historiken. Gick det bra (Bra eller Utmärkt) står en prinsesstårta framme på bordet – grön
marsipan med florsocker, en rosa ros och en bit redan uppäten, så att botten, sylten,
krämen och grädden syns i snittet – och omgångens orakel har en papperskrona i guld med
glaspärlor (på mössan om det är DJ). Gick det illa (Svagt eller Mycket svagt) ligger DT:s
extraflaska omkullvält i en pöl och kupongen sönderriven i askkoppen, med ett par bitar på
bordet. Däremellan, och med dolda resultat, syns inget. (En barstol som vält syns inte:
golvet ligger bakom pulten.)

**Kvittot** ligger på pulten i three.js med sakerna nedan
([public/rum-saker.js](public/rum-saker.js)): termopapper som har legat i rulle, så att änden
med huvudet har böjt sig upp och den rivna änden lyfter lite, med en mjuk skugga under. Texten
är den som `receiptHtml` skriver i `#rum-kvitto` (huvudet i dubbeltryck, ojämnt termotryck och
en streckkod efter texten) och ritas om när någon lämnar in; länken blir en osynlig yta över
papperet att klicka på (`i-3d` i rum-saker.css, kanten räknad ur papperet), och papperet lyser
upp när musen är över den. Utan WebGL ligger det platta kvittot kvar (rum.css).

**Askkoppen, snusdosan och fläkten** står på pulten till höger om kvittot, i three.js som
gänget ([public/rum-saker.js](public/rum-saker.js), med en egen duk i pultens plan): en
askkopp i bärnstensfärgat glas med tre spår, aska och fimpar, där en cigarett ligger i ett
spår och ryker; en öppen dosa lössnus med locket bredvid, lutat mot dosan eller upp och ner;
och en gulnad bordsfläkt med blå propeller, galler och en remsa av en gammal kupong som
fladdrar. Fläkten står där bara när det är varmt i Stockholm: när det känns som 21° eller
mer, samma gräns som gängets tunnaste kläder (vädret från vader.js, läst var tionde
sekund); annars är den borta från pulten. Den svänger fram och tillbaka, och när den pekar
mot askkoppen blåser röken åt sidan (draget räknas för varje puff under dess liv, så att
samma tid ger samma bild). Inga riktiga märken: locket säger SNUS N:o 1, dosan PRIMA
LÖSSNUS. **VM 94-affischen** är tejpad
på insidan av skyltfönstret, i vänstra rutan under neonskyltens list (så att *VM 94* och
*BRONS* syns): ett riktigt foto från
landslagets hemkomst (Henrik Larsson och Pontus Kåmark med bronsmedaljerna, Norr
Mälarstrand 18 juli 1994; foto Sniper Zeta,
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Football_players_Pontus_K%C3%A5mark_Henrik_Larsson,_July_18,_1994.jpg)),
beskuret i `public/rum/vm94.jpg` och med fotografen i affischens title och under den i
närbilden (se [Närbilderna](#närbilderna)). Uppe till höger i
fönstret syns himlen (rum-ute.js), så där hänger den inte.

**Fikat** står på pulten vissa dagar, i three.js som sakerna
([public/rum-fika.js](public/rum-fika.js)): två semlor i pappersform med mandelmassa,
grädde och lock med florsocker på fettisdagen, två pepparkakshjärtan och en gubbe med vit
glasyr på en servett i december, två lussekatter med russin på luciadagen, två
kanelbullar med pärlsocker i pappersform den 4 oktober, chokladägg i röd, blå, grön och
guldfolie i påskveckan (skärtorsdagen till annandag påsk) och tre chokladbollar på en
servett den 11 maj. Det står bakom kvittot om det får plats där, annars till höger, fritt
från askkoppen, dosan, locket, prisen och fläkten. Dagen är Stockholms (`Vader.nu()`,
läst var tionde sekund som vädret). Går det dåligt med tippningen har någon redan tagit
för sig: locket ligger bredvid den ena semlan och det är en grop i grädden, gubben saknar
huvudet (tandmärken), en lussekatt, en kanelbulle och ett par ägg är borta och ett ägg är
skalat med folien tillplattad bredvid, och det är fler smulor och mer florsocker.

**Platserna och slitaget skiftar från dag till dag** (dagen i Stockholm som frö): sakerna
på pulten står i en av fyra uppställningar (`LAYOUTS` – fläkten längst bak till höger, i
mitten eller bakom kvittot och då vänd åt höger, askkoppen och dosan om vartannat, några
pixlar hit eller dit), kvittot ligger någonstans till vänster om dem, vridet åt det ena eller
andra hållet och mer eller mindre uppböjt (det första av elva lägen som går fritt från
askkoppen, dosan och fläkten), locket och prisen läggs där det finns plats, och affischen sitter
till vänster eller till höger under neonskylten. Slitaget följer tippningen: andelen fel
bland omgångens avgjorda matcher, annars i den senaste färdigspelade kupongen, och utan
rättning ett mellanläge. Går det dåligt fylls askkoppen (1–11 fimpar), askan hamnar
bredvid, snuset spills, fläkten (om den står där) går på trean, affischen bleks och ett hörn
släpper; går det riktigt illa ryker två cigaretter, en använd pris ligger på pulten och
affischen hänger i en tejpbit. Dolda resultat räknas inte (gradeRow rättar dem inte). Utan
WebGL står affischen kvar men inte sakerna på pulten.

**Lysröret tänds när man kommer in** (`tand` i rum.js, `.rum-mork` i rum.css; inte på natten): medan
gänget laddas är rummet mörkt, utom gatan genom skyltfönstret och dörren och tv:n som
lyser igenom, och startarna glöder rosa i rörets ändar. Efter minst 0,7 och högst 2,6
sekunder blinkar det igång (1,2 s). En gång per sidvisning, och inte med
`prefers-reduced-motion` eller `?rum-t`.

**Rummet rör sig också:** utanför rutan och dörren är det Stockholms tid och väder (se
nedan), neonen glappar ibland, röken ligger under lysröret, damm syns i ljuset och stationsurets
sekundvisare hoppar fram. Bakväggen är klädd med lackad furupanel (`furu` i rum.js):
bräder med kvistar och ådring, mörka av röken upptill och ljusare under lysröret och där en
tavla har hängt runt ramen. Stället är slitet: nikotingul högervägg och tak, fläckar, nötta
kanter på disken och pulten, kafferingar och brännmärken. Med `prefers-reduced-motion` står
allt still (en bild, ingen kamera efter musen).

**Data:** omgången ur `GET …/samtal` (`TP.round`, tippare.js), annars omgångens kupong;
ställningen och resultaten rättas med `gradeRow` (kupong.js), också med Dölj resultat.
Rummet läser om datan varje minut medan det står öppet.

**Bilder:** `?rum-t=<sekunder>` fryser klockan (figurerna, röken och CSS-animationerna
står på samma tid), `?rum-mx=&rum-my=` (−1…1) kamerans läge,
`?rum-slit=0…1` slitaget och `?rum-dag=<tal>` dagen för sakerna och affischen,
`?rum-fika=semlor` (`pepparkakor`, `lussekatter`, `kanelbullar`, `paskagg`,
`chokladbollar`) fikat och `?rum-ol=jul` (`pask`) ölen. Gänget: `?rum-plats=0` (`1`, `2`)
var de sitter vid bordet, `?rum-vantar=DL,DT` som om de inte hade lämnat in,
`?rum-stopp=<timmar>` som om det var så långt kvar till spelstoppet, `?rum-tittar` som
om matcherna pågick och `?rum-mal=dl:1,dt:-1,dj:0` ett mål
(rätt, fel, ingen skillnad; vid tiden 0 med `?rum-t`, annars var femtonde sekund),
`?rum-pekar=dt:tv,dl:dj` som om de pekade (på en sak eller någon i gänget),
`?rum-hej=dl` som om man pekade på DL, `?rum-natt` (`=0` dag) natten och
`?rum-efter=bra` (`illa`, `inget`) dagen efter. Sidan
sätter `data-rum-klar` på `body` när allt är ritat. Vädret och klockan utanför:
`?rum-klocka=2026-12-13T16:00` (eller bara `16:00`, Stockholms tid), `?rum-vader=klart`,
`halvklart`, `mulet`, `dimma`, `dugg`, `regn`, `skurar`, `snoblandat`, `sno` eller `aska`,
`?rum-grader=<°C>`, `?rum-vind=<m/s>` och `?rum-snodjup=<cm>` (med både vädret och graderna
hämtas inget).

### I telefonen

Rummet står i alla fönster utom de allra minsta (`Rum.fits`: minst 280 × 260 px), i
telefonen också. Scenen täcker fönstret som på datorn, också på höjden i telefonen (en tid
fyllde den 80 % av höjden, med svart över och under; det svarta ville vi inte ha, och mindre
förstorad än så går inte utan det). Det som inte ryms når man med fingret: scenen följer med när man drar,
glider vidare en bit när man släpper den i farten, och kameran vrids efter var i rummet man
står, som med musen (`swipe` och `pan` i rum.js; med musen nedtryckt går det likadant i ett
smalt fönster). Ett tryck på ett föremål gör samma sak som ett klick, och ett tryck efter
ett drag öppnar ingenting. Föremålen lyser inte kvar efter ett tryck (`:hover` bara med
mus), och foten har bara *Vanlig sida* – utan tangentbord står inga tangenter där. Sidan
zoomar och rullar inte i rummet (`touch-action: none`).

Närbilderna ryms i fönstret: tv:n går så nära att den fyller bredden (på datorn 3,6 gånger
som förut; kameran siktar på frontens mått, och Safari i iPhone ger mått i något med CSS
zoom delade med zoomen – utan GetBoundingClientRectZoomed – så att tv:n hamnade utanför
bilden: `rekt` i rum.js förstorar dem tillbaka), anslagstavlan och lapparna får smalare kanter, och nära tv:n, videon och med en
lapp i handen gör ett svep i sidled som pilarna – tv:n bläddrar till nästa sida, videon
spolar (■ eller ▶ under rutan stannar) och anslagstavlan går till nästa lapp. Vid anslagstavlan bläddrar ett
svep uppåt eller neråt bladen i lapparna till nästa division.

**Kupongen på höjden** (`.rum.smal`: smalare än 600 px och högre än bred): kupongen på
pulten, i handen och i högen är smal och hög, 420 × 620 i stället för 660 × 470, som en
riktig stryktipskupong, med samma mitt så att högen och handen ligger där de ligger (`KUP`
i rum.js). Raderna har två våningar – lagen överst, dagen och motiveringen under – och
rutorna är större (44 × 26). Fälten står över hela bredden i foten, streckkoden får inte
plats och pennan vilar i kanten under fälten. I handen fyller kupongen bredden, orden under
den får gå på två rader, och meddelandet (*2 matcher saknar tecken.*) står ovanför kupongen
där namnet annars står. Papperets regler för telefonen i papper.css gäller inte kupongen i
rummet.

**På bredden i telefonen** (`.rum.lag`: lägre än 500 px): kupongen i handen fyller höjden,
och orden står i en spalt bredvid den – *Lägg tillbaka* överst och guldordet längst ner.

**Minnet:** Safari ritar varje lager i rummet i dess egen storlek gånger skärmens
pixeltäthet (3 i en iPhone), hur förminskat eller förstorat det än visas – ett lager som är
högst 1280 punkter brett och högt i sin helhet så fort en bit av det syns, ett större bara där
det syns – och en sida får använda ungefär 1,5 GB i de flesta iPhone (upp till 3 GB i nyare
Pro-modeller). Rummet kraschade därför i telefonen (Det går inte att öppna den här sidan).
Därför:

- **Planen ritar inget själva.** Varje sak i ett plan är ett eget lager (`.rum-pl > *` i
  rum.css), och SVG:erna är bara så stora som det de ritar (rutan i `svg` i rum.js). Ett plan
  som ritade något fick en yta i hela scenens storlek också när det var litet – tv:ns sken
  gav tv:ns plan en, och pokalhyllan och neonskenet var lager i hela scenens storlek.
- **Filtren bakas.** Brus- och oskärpefiltren i SVG:n ritas en gång till bilder (`baka` i
  rum.js, på datorn också – de ser likadana ut). Bruset (feTurbulence och en färgmatris med
  fast färg) räknas ut i rum.js med specifikationens algoritm och samma frö (`turbulens`,
  `brus`), och oskärpan av en form i en färg med tre lådfilter som i specifikationen
  (`oskarpa`, `sudda`); bilderna sparas som PNG utan duk (`png`). Bara det som inte går
  så (skenet från lysröret, med en gradient) ritas som förut via en bild av SVG:n. Safari
  höll kvar fyra–fem kopior av varje bild som gick via en SVG-bild och en duk, ungefär 350 MB
  för furun, väggen och pulten (oavsett pixeltäthet), och bakningen tog flera sekunder. Bruset
  får bara så många bildpunkter som dess finaste oktav behöver (högst 2 per px; ådringen
  färre på höjden), och alla bilder byts in på en gång. I Chrome blev de bakade skenen tomma
  förut (neonskenet, ljuset på pulten); nu syns de som i Safari.
- **Rummet syns först när det är klart.** I telefonen är världen (`.rum-world`) dold
  (`.laddar` i rum.css) tills filtren är bakade, datan ifylld och typsnitten laddade, högst
  4 sekunder – under tiden är rummet mörkt som när lysröret tänds. Annars ritades varje lager
  först utan och sedan med de bakade bilderna, och ett lager som ritas om hålls i två
  buffertar en stund.
- **3D-delarna startar en i taget** i telefonen (`tur` i rum.js): gänget, inredningen,
  sakerna och sist kortlådan (`o.tur` i rum-register.js), var och en när den förra är klar
  och rummet syns, med en paus på 0,8 sekunder före den första och mellan dem (Safari släpper
  buffertar som inte används efter ungefär en sekund). Var och en tar några hundra MB medan
  den startar (shaders, texturer, ljuset). En fast bild (`?rum-t`) väntar på alla.
  Hjälpbufferten till miljöljuset (PMREMGenerator) släpps när ljuset är klart, i alla fyra,
  och i telefonen räknas ljuset i 128 i stället för 256 (`_setSize`; glansen ser likadan ut).
  Inredningens skuggkartor släpps i telefonen när saken är ritad, utom urets som ritas om
  varje sekund – three gör en ny när saken ritas om.
- **Den mörka starten** (`.rum-mork`, masken med oskärpa runt fönstret) ritas med en
  fjärdedels bildpunkter i telefonen som ljuset – masken låg annars kvar i minnet efteråt –
  och så gör toningen bakom kupongen i handen (`.rum-dimma`, 2400 × 1800), som annars tog
  ungefär 80 MB i en iPhone.
- **Bakväggen och pulten** (SVG:erna utan text) ritas i telefonen med 2/3 av bildpunkterna –
  lika många som syns där, där scenen visas förminskad – och neonens sken genom fönstret,
  runt skylten och över fönsterbänken är egna lager med en fjärdedel (`z` i `svg` i rum.js).
  Skenet genom fönstret låg förut i väggens SVG, så att hela väggen ritades om när neonen
  blinkade.
- **Det som ritas i större storlek för att vara skarpt nära** ritas mindre i telefonen: tv:n i
  1,5 gånger lådans mått i stället för 3 (se [Tv:n](#tvn)) och videohörnet i halva storleken på
  håll (se [Videon](#videon)). Anslagstavlans yta står före ramens sidor, så att den inte blir ett
  eget lager, och flaggan i utsikten är ett eget lager – annars ritades hela utsikten om hela
  tiden, och ett lager som ritas om hålls i två buffertar.
- **Det suddiga ritas med färre bildpunkter.** Ljuset, vinjetten och kornet med en fjärdedel
  respektive hälften och utsikten med 0,4 (CSS zoom, förstorat igen), tv:ns sken och
  anslagstavlans glans en fjärdedel så stora och förstorade med transform. Zoom går inte på
  det som har text mellan 9 och 18 px (Safari gör text som blir mindre än 9 px större) och
  flyttar det som inte står i 0,0.
- **Det som inte syns ritas inte** (`sikt` i rum.js, IntersectionObserver): gänget,
  sakerna på pulten och dammet ritas bara när de syns – de står kvar som de var – och gatan
  utanför står still (`.vila`, rum-ute.css) när fönstret och dörren inte syns. Duken med
  gänget och utsikten är större än det de visar, så där följs en osynlig ruta (`.rum-syn`,
  först i planet så att den inte blir ett eget lager) över figurerna och röken respektive
  fönstret och dörren. Nära tv:n, videon och anslagstavlan och när scenen är dragen åt
  sidan slipper telefonen alltså rita gänget 30 gånger i sekunden (1920 × 840 bildpunkter
  med mjuka skuggor). Utan rörelser och i en fast bild ritas allt som förut.
- **3D-delarna** (gänget, sakerna, inredningen och kortlådan) ritas i telefonen med 1,5
  bildpunkter per punkt, utan kantutjämning och med skuggkartor på 1024 i stället för 2048
  (`LATT`). Gängets ansikten ritas där i halva storleken (512 × 576), och gänget sparar
  ingen extra kopia av bilden (`preserveDrawingBuffer`).

Mätt i Safaris motor (WKWebView, täthet 2) i 390 × 664 före planen, tv:n, videon och
blobarna: från ungefär 1,9 GB till 1,1–1,3 GB. Med WebKits eget lagerträd (WebKitGTK, via
inspektören) räknat som i en iPhone (täthet 3, rutor över 1280 punkter) tar lagren efter dem i
390 × 664 ungefär 140 MB i stället för 260, längst åt höger 240 i stället för 570 och på
bredden (844 × 390) 300 i stället för 690 – och bakningen håller inte längre kvar 350 MB.
Med bruset och oskärpan i rum.js, den dolda världen och 3D-delarna en i taget, mätt i
WKWebView i 390 × 664 när allt har startat: täthet 2 från 1,24 GB efter laddningen och 1,3–1,7
GB i topp till ungefär 0,70 och 0,9–1,0 GB, täthet 3 (som en iPhone) från 1,4 och 1,6–1,9 GB
till ungefär 0,94 och 1,4 GB. Med resten ovan (lägre upplösning för det utan text, videon,
toningen, skuggkartorna, ljuset i 128 och pauserna): täthet 2 ungefär 0,59 GB efter
laddningen och 0,75 GB i topp, täthet 3 ungefär 0,75–0,80 och 1,03–1,07 GB – och när man går
fram till kupongen, tv:n, videon, uret, anslagstavlan och kortregistret högst ungefär 0,87
respektive 1,19 GB (förut 1,4–1,6 GB i täthet 3).

### Utsikten och vädret

Tobaksaffären ligger i Stockholm, och genom skyltfönstret och dörren syns gatan som den är
där just nu. [public/vader.js](public/vader.js) räknar solens höjd och månens fas ur
klockan och hämtar vädret från Open-Meteo (fritt, utan nyckel, en gång i kvarten; sparas
på enheten), och [public/rum-ute.js](public/rum-ute.js) ritar gatan med
[public/rum-ute.css](public/rum-ute.css) för det som rör sig. Utan nätet är det mulet och
månadens vanliga temperatur.

- **Ljuset:** himlen över de lägre taken går från natt via blå timme och solnedgång till
  dag, grå när det är mulet. Fasaderna mittemot (gul, terrakotta och ljus puts) är nästan
  svarta på natten, blåaktiga i skymningen och varma i låg sol, med skuggan från huset vi
  sitter i nertill; bakom syns ett kyrktorn med ärgad spira och en byggkran med en röd lampa.
  Fönstren tänds efter klockan (många på kvällen, nästan inga mitt i natten),
  gatlyktorna när det skymmer, pizzerian är öppen 11–23 (till 1 fredag och lördag) och
  konditoriet 7–19 utom på söndagar. På klara nätter syns stjärnorna och månen när den är
  uppe. Dagsljuset faller in i rummet och på gänget bakifrån, på natten gatlyktornas sken.
- **Vädret:** moln som driver, regn och duggregn som lutar i vinden, snö som driver i
  sidled, blöt gata med lyktornas spegling, dimma, blixtar vid åska (som också lyser upp
  rummet). Droppar sitter på glaset efter regn, snö samlas i rutornas nederkant och frosten
  kryper in från hörnen när det är kallare än −3°. Snötäcke ger vita tak, fönsterbleck,
  trottoarer och plogvallar.
- **Folk och trafik:** på trottoaren mittemot går folk förbi (fler på dagen och kvällen,
  nästan ingen mitt i natten), klädda efter vädret och med paraply när det regnar – i
  hård vind vänder det sig ut och in – med hund, på cykel eller med pulka när det ligger
  snö. Bilar och taxi kör åt var sitt håll med strålkastarna tända när det är mörkt, och
  blåbussen kommer var fjärde minut.
- **Årstiderna:** löv som blåser förbi och ligger på trottoaren på hösten, plogbilen när
  det snöar, adventsstjärnor och ljusstakar i fönstren från första advent till
  tjugondag Knut, en gran som bärs hem i december och fyrverkerier på nyårsnatten (och
  lite här och var på nyårsafton). Måsar och kråkor på dagen, tornseglare på
  sommarkvällarna, räven som springer förbi mitt i natten och flaggan på flaggdagarna
  (påsk, pingst, midsommar och valdagen räknas ut) från morgonen till solnedgången.
- **Kläderna:** gänget klär sig efter hur kallt det känns ute (`dress` i
  [public/rum-3d.js](public/rum-3d.js)). Över 21° t-tröja och shorts – DT i jeansshorts –
  och solglasögonen på näsan när solen skiner; 15–21° som förut; 8–15° långärmat och
  långbyxor (DL sweatshirt och chinos, DT öppen flanellskjorta med uppkavlade ärmar, DJ
  luvtröja); 1–8° jackor (DL fältjacka, DT skinnjacka, DJ dunjacka) och under 1° vinter (DL
  parkas, DT och DJ dunjackor, DJ med pälskant). När det regnar har de regnjackor (DL gul,
  DT olivgrön, DJ svart), och när det snöar ligger snö på axlarna och huvudet. DT kavlar
  alltid upp ärmen på armen med lejonet, och halsduken ligger utanpå jackan. Ändras vädret
  medan rummet står öppet byter den som behöver om.

Utsikten ligger bakom väggen i det bakersta planet och syns genom hålen i den (masken
`rum-hal` och måtten `WIN` och `DORR` i rum.js), i scenens koordinater, så att den som går
förbi syns först i dörren och sedan i fönstret. Bara de lager vars ljus eller väder har
ändrats ritas om (`RumUte.paint`), och det som rör sig har bara transform och opacity.
Med `prefers-reduced-motion` står gatan still och ingen går förbi.

### Kupongen i handen

Allt man gör med kupongen på papperet under Kupong görs också i rummet, med kupongen i
handen: fylla i, skriva motiveringar, spara, lämna in, ändra och ångra, läsa de andras
kuponger, skriva kommentarer i efterhand, göra gängets kupong i uppgörelsen, ändra
matcherna och ta bort omgången – med samma kod och samma tjänst som papperet
(`Samtal.pult` i [public/samtal.js](public/samtal.js)). Kupongen på pulten tas i handen med
ett klick på den, på guldordet eller K. Den lossnar från pulten,
lyfter, vänds upp mot betraktaren och förstoras till mitten av fönstret (så stor som får
plats mellan namnet och orden under den), svänger en aning förbi och stannar; rummet mörknar
bakom, kameran ställer sig rakt framför, och pennan följer med och rullar undan till
foten, mellan fälten och streckkoden. Samma kupong som på pulten, men rutorna är knappar: ett tryck kryssar i eller
ur (två eller tre tecken = gardering), och pennan går dit, drar det ena strecket, lyfter
och drar det andra – ett kryss med blyerts som ser likadant ut varje gång (samma
slumpfrö för matchen och tecknet). Står pennan still en stund lägger den sig vid sidan
igen. Ett kryss som tas bort suddas ut. Vem man är väljer man bland porträtten överst, som
på papperet (*Vem är du?*; den som redan har lämnat in går inte att välja): pennan ringar in
ditt porträtt, och stämpeln säger vem omgången väntar på med dig först. Fälten i foten
räknas om för varje kryss.

**Motiveringen** skrivs för hand efter tiden, som på papperet: när en match är tippad står
en liten penna där, och ett klick var som helst efter tiden och man skriver på samma rad
(högst 140 tecken), så att raden aldrig blir högre – platsen står kvar också innan pennan
syns, så att ingenting flyttar sig. Pennan på kupongen går dit och följer texten medan man
skriver: spetsen står där texten slutar och hoppar lite för varje tecken. Enter eller ett
klick utanför och pennan lägger sig vid sidan igen. Motiveringen står i utkastet (samma
som papperets), syns på kupongen på pulten och följer med när man lämnar in; den som inte
får plats slutar med … och syns hel när man pekar på den.

Under kupongen står till vänster *Lägg tillbaka* och, i finstil som på papperet, *Ändra
matcherna* (tills någon har lämnat in; leder till Kupong) och *Ta bort* (tills någon annan
har lämnat in), och till höger *Spara* och guldordet *Lämna in*. *Spara* sparar en kupong
som inte är färdig utan att lämna in – de andra ser tårtbiten vid ditt porträtt – och blir
*Sparad* (med en bock, släckt) tills något ändras. *Ta bort* frågar i samma ruta som på
papperet; sedan faller kupongen ur handen, och på pulten ligger nästa omgångs matcher. Utan
namn står *Vem är du?* och porträtten får en röd ring; saknas tecken blir rutorna i de
matcherna röda och raden säger hur många, som på papperet under Kupong. Annars lämnas
tipsen in med samma kod (`Samtal.pult` och `handIn`, `POST …/samtal {gor: "tips"}`),
stämpeln *Inlämnad* slår i och kupongen vänds och läggs överst i högen; på pulten ligger
en ny. Esc, K, *Lägg tillbaka* eller ett klick utanför lägger tillbaka den samma väg
baklänges. Utkastet är detsamma som på papperet under Kupong (på enheten), så det man har
kryssat och skrivit står kvar på pulten och där; ett utkast utan namn blir ditt när du
säger vem du är.

**Din kupong ur högen.** Har du redan lämnat in tas din kupong ur högen i stället – med ett
klick på den, på kupongen på pulten, på guldordet eller K (så länge du bara ser dina egna
tips): den lyfts, vänds över långsidan på vägen upp (innehållet byts när den står på kant)
och stannar i handen med dina kryss och motiveringar, ditt porträtt inringat och stämpeln
*Inlämnad* bredvid stämpeln om vem omgången väntar på. *Lägg tillbaka* och inlämningen
vänder den tillbaka ner i högen. Rutorna och motiveringarna går att ändra, och till höger
står *Ångra* och guldordet *Lämna in ändringen*, släckta tills något är ändrat. *Ångra*
suddar ut det nya och drar de gamla kryssen igen, ett i taget. Ändringen stannar i handen
tills den lämnas in (som på papperet, där en ändring får lämna matcher tomma), och då slår
stämpeln i igen. Det går tills matcherna startar, också när du ser de andras tips –
samma regel som papperet under Kupong (`Samtal.pult.state().andra` är papperets
`canEdit`). Matcher som har startat står kvar som de var: bleka, med *har startat* efter
tiden, och rutorna är inga knappar.

**Kommentarer i efterhand.** När en match har startat står pennan för kommentaren i
efterhand efter tiden på din kupong ur högen och på gängets kupong, i ditt bläck (före
avspark bara om du redan har skrivit något) – samma kommentar som pennan på papperet
(`POST …/samtal {gor: "efter"}`). Den sparas när du lämnar fältet eller trycker Enter; Esc
ångrar, och går den inte att spara blir den röd tills nästa försök. Den står efter
motiveringen, i bläck i stället för blyerts.

**De andras kuponger.** När du ser någons tips – du har lämnat in och hen också, eller allas
tips visas – tas hens kupong ur högen på samma sätt: hens kryss, motiveringar och
kommentarer i efterhand, hens porträtt inringat och stämpeln *Inlämnad*, men inget att
ändra – bara *Lägg tillbaka*. Innan dess går den inte att vända (se Högen ovan).

**Uppgörelsen.** När du ser de andras tips (som när papperet visar underlaget) ligger gängets
kupong på pulten, och pingklockan där guldordet annars står (eller *Följ kupongen* när
matcherna har börjat), kupongen eller K tar den i handen – klockan lyser när man pekar på
den och plingar när kupongen tas upp (`bell` och `pling` i rum.js). I varje ruta står
porträtten för dem som har med tecknet, var och en på sin plats som överst, och deras
motivering syns när man pekar på porträttet. Gängets kryss dras med en blå kulspetspenna i
stället för blyertspennan: förslaget – det som fler än hälften har med – står ikryssat från
början, eller gängets kupong om den redan är sparad, och ett tryck kryssar i eller ur (`Samtal.pult.besluta`,
sparat på enheten som på papperet). *Börja om* i finstil går tillbaka till förslaget, och
guldordet *Spara gängets kupong* (*Spara ändringen* när den finns, *Sparad* när den står som
den sparade) sparar den direkt med samma tjänst som papperet (`Samtal.pult.sparaGang`,
`postCoupon` i kupong.js). Saknar matcher tecken säger raden det och guldordet blir *Spara
ändå*; har någon annan hunnit före blir det *Spara över den* (gängets kupong) eller *Spara
ändå* (en kupong till samma dag), och kan tjänsten inte spara *Spara via Ny kupong*. Utan
tjänsten öppnas Ny kupong (eller Ändra) med tecknen ifyllda. Matcher som har startat går
inte att ändra; där står pennan för kommentaren i efterhand.

Rummet läser om omgången från tjänsten varje minut (`Samtal.load`), så att högen, gängets
kupong och de andras kuponger följer med när någon lämnar in. Med `prefers-reduced-motion`
(och med `?rum-t=`) står kupongen direkt i handen, kryssen direkt på papperet och pennan
stilla. Rörelserna är Web Animations (`openCoupon`, `flipFrames`, `drawCross`, `penTo`, `setSigns`
och `penGo` i [public/rum.js](public/rum.js)); kupongen och högen ligger i samma lager som
pulten, och kupongerna i högen har kupongens mått, förminskade, så att kupongen börjar
exakt där den låg och landar exakt på sin plats i högen.

### Tv:n

En mörkgrå Panasonic från nittiotalet står på en svartlackerad hylla på en arm från högra
väggen uppe i hörnet, vriden ut mot rummet så att gänget vid fönstret också ser den, men
mest mot pulten, och lite nedåt ([public/rum-tv.js](public/rum-tv.js),
[public/rum-tv.css](public/rum-tv.css)). Lådan är byggd i CSS 3D i samma värld som resten av
rummet (planet -470, som därför bevarar djupet): grå plast, högersidan och hyllan under som
syns och följer musen, bildrörets kåpa med luftspringor bakom och kaninöronen på taket med
en bit folie på det ena. Armen går från leden mitt bak till en väggplatta, och sladden
hänger i en båge från armen till ett uttag under plattan; armen står still när tv:n vrids
kring leden. Allt är förminskat mot väggen, så att tv:n inte sticker ut så långt i rummet,
och nära zoomar kameran in lite mer (3,6). Rutan är lite buktig med rundade hörn, svepljus
och ett svagt ljusband som rullar nedför glaset, i en svart ram med en silverlist, och den
lyser blått på väggen. Under rutan står Panasonic. Till höger sitter panelen i en svart
nisch: en grön sifferdisplay med sidnumret, knappsatsen med runda grå knappar (1–9 och
▼ 0 ▲ längst ner, pilarna ljusare), högtalargallret med springor och strömbrytaren med
lampan, och under den FASTEXT – snabbvalen i fyra färger.

**Text-tv som SVT:s:** 40 × 25 tecken (VT323, utan ligaturer), rubrikraden med sidnumret,
*Matchfix Text*, datumet och klockan som tickar, ett blått band med rubriken i mosaikgrafik
(gula klossar), sju färger, dubbelhöga rader och snabbvalen i rött, grönt, gult och
cyanblått längst ner – samma fyra på alla sidor: *Matcher* (331), *Tabeller* (371),
*Skyttar* (381) och *Innehåll* (300). Det som ett föremål har för ämne tänds när man pekar på
föremålet (`data-to`). Filerna hämtas när sidan visas första gången.

- **300 Innehåll:** alla sidor med sina nummer; raderna leder dit.
- **331 Matcher:** omgångens matcher i avsparksordning – lagen, avsparken eller ställningen
  (grön med minuten medan matchen pågår, `paus` i halvtid, `?` när resultatet är dolt,
  `struken`) och matchens sida. Fler än 17 matcher ger undersidor.
- **332–369, en sida per match**, ur matchens fil (`data/match/<id>.json`): lagen dubbelhöga
  med ställningen (leder till matchbladet, `#match/<id>`), tävlingen och avsparken eller
  läget i bandet, oddsen och prognosen för 1, X och 2 – prognosen också som en stapel i
  mosaik, med 1 i grönt, X i gult och 2 i cyan som siffrorna ovanför – och lagen sida vid
  sida: placering och poäng, formen (de fem senaste i alla tävlingar, den senaste först, V
  grön, O gul, F röd) och hemmalagets hemmarad och bortalagets bortarad (V-O-F). Vilan och
  skadorna står på anslagstavlan och xG med resten om lagen i kortregistret (se
  [Vad som står var](#vad-som-står-var)). När resultatet är dolt visas inte lagen sida vid
  sida.
- **371–374 Tabeller** (Premier League, Championship, League One, League Two, ur
  `data/teams/<division>.json`): placering i färg efter zonen (uppflyttning och Champions
  League grön, kval och Europa cyan, nedflyttning röd), lag, spelade, målskillnad, poäng och
  formen i ligan (de fem senaste ur `data/matches.json`). Hela Premier League ryms på en sida;
  24 lag delas i två undersidor (1–12, 13–24). Divisionerna står i bandet och leder till
  varandra.
- **377 Stryktipset matcher live:** sidan tv:n står på när man kommer in, i stället för
  fällbladstavlan som satt på bakväggen. Kupongens matcher numrerade – i Stryktipsets
  ordning när omgången är Stryktipset, annars i avsparksordning – med spelstoppet överst,
  avsparken eller ställningen (som på 331) och tecknet längst ut: grönt medan matchen pågår
  (det som gäller i ordinarie tid just nu), gult när den är slut. Raderna leder till
  matchernas sidor. Mellan omgångarna står de närmaste matcherna där, utan nummer.
- **381–384 Skyttar:** skytteligorna ur `data/players/<division>.json` – de 19 med flest
  ligamål, delad placering med numret bara på den första.

Har en division matcher som döljs just nu (Dölj resultat) visar tabellen och skytteligan bara
hur många som är dolda och *Visa ändå* – samma nyckel som på Tabeller och Statistik, så att
det gäller där också.

**Nära** (klick eller T) vrids tv:n rakt fram och kameran ställer sig rakt framför (musen
vrider inte rummet medan tv:n är nära), så att rutan blir en rak rektangel – vriden mot
ögat blir den sned, eftersom den sitter högt upp till höger. Man byter sida med ▲ ▼ på
knappsatsen eller piltangenterna (undersidorna först, sedan nästa sida i nummerordning, runt
från 384 till 300), snabbvalen, raderna som leder vidare, divisionerna i bandet eller tre
siffror på knappsatsen eller tangentbordet; displayen och rubrikraden visar siffrorna medan
man slår dem (*37-*), och den tredje söker sidan. Knapparna tar hela mellanrummet runt sig,
så att de går att träffa med fingret i telefonen. På håll
bläddrar undersidorna själva var tolfte sekund. Tv:n söker
som förr: sidnumret i rubrikraden rullar fram i grönt tills sidan kommer, och sidan ritas
uppifrån och ner – finns den inte går tv:n tillbaka. Strömbrytaren stänger av: bilden dras
ihop till ett streck och en prick, lampan blir röd och skenet på väggen slocknar; ett tryck
till tänder den. Esc, T eller ett klick utanför zoomar ut. Med `prefers-reduced-motion`
byts sidan direkt och tv:n står still.

Nära ritas lådan i tre gånger storleken (`zoom: 3`) och förminskas igen (`scale3d`): Chrome
ritar inte om lager i perspektiv när kameran går fram, så utan skärpan i reserv blir
text-tv:n suddig på nära håll. På håll ritas den i sin egen storlek: Chrome ritar ett lager i
perspektiv minst i dess egen storlek hur litet det än syns, så i tre gånger storleken tog tv:n
ungefär 60 MB grafikminne också på håll. Storleken byts med vridningen avstängd (`.skarp` på
`.rum-tvpos`, `zoom` i rum-tv.js): innan tv:n vrids fram och när den har vridits tillbaka.
I telefonen räcker 1,5 gånger (`zoom: 1.5`), nära och på håll: där går kameran
högst så nära att tv:n fyller bredden eller höjden mellan namnet och foten, ungefär 1,4 gånger
lådans mått, och lagren tar en fjärdedel så mycket minne (se [I telefonen](#i-telefonen)).
Kameran siktar på frontens mått med tv:n vriden (`zoom(on, rekt)`); Safari i iPhone delar
måtten med zoomen, och rum.js rättar dem (`rekt`). Tv:n sköter sig själv: rum.js bygger den (`RumTv.html`),
kopplar in den (`RumTv.mount`), ger den omgångens rader vid varje `fill` (med Stryktipsets
ordning när omgången är Stryktipset, och om raderna bara är de närmaste matcherna) och skickar
siffror och pilar dit när den är nära.

### Anslagstavlan

Under tv:n, i hörnet på högra väggen där pärmarna stod, hänger en anslagstavla: juteväv i
en ram av lackad ek, byggd i CSS 3D på väggen bredvid skårtavlan
([public/rum-anslag.js](public/rum-anslag.js), [public/rum-anslag.css](public/rum-anslag.css)).
Lapparna har det på sajten som rummet annars inte visar, om lagen i omgången (samma omgång
som kupongen och fällbladstavlan):

- **Formen** – ett registerkort, maskinskrivet: de fem senaste matcherna för båda lagen före
  avspark (alla tävlingar, den senaste först), V, O eller F efter 90 minuter.
- **Skadelistan** – ett genomslag: de skadade, avstängda och osäkra (?) per lag ur matchens
  fil (Fantasy Premier League) – de tre som har spelat mest, och resten som +n.
- **Starkast** – en polaroid med skölden för divisionens starkaste lag i omgången; på
  baksidan modellens starkaste och svagaste lag i omgången (styrkan ur
  `data/teams/<division>.json`, som på Statistik; cupbladet per division).
- **Kryssar gärna** – en gul lapp: chansen till oavgjort i lagets matcher, ur xG.
- **Tur & otur** – rutat papper ur ett spiralblock: poäng mot chanserna (xG), med staplar i
  blyerts.
- **Slår oddsen** – ett tidningsurklipp: poäng mot vad oddsen väntade sig, och *Sviker*.
- **Vilan** – ett almanacksblad med omgångens första dag: dagar sedan förra matchen för båda
  lagen; skiljer det två dagar eller mer ringas det tröttare lagets siffra in.
- **Motståndet** – ett anteckningsblock: *Tufft hittills* och *Lätt hittills*, de lag i
  omgången som har mött svårast och lättast motstånd jämfört med ett normalt spelschema i
  divisionen (mål per match enligt modellen, som Motstånd på Statistik).

Mötena, som tidigare stod här som Inbördes, står i kortregistret med resultaten.

Varje lapp är en bunt blad på samma nål, ett per division i omgången – Premier League
överst, sedan Championship, League One, League Two och sist cupmatcherna – och bladen under
sticker fram lite i kanten, vridna kring nålen. På bladens högerkant sitter indexflikar av
genomskinlig plast i divisionens färg (som på Tabeller), med förkortningen i tusch: *PL*,
*CH*, *L1*, *L2* och *Cup*, i samma ordning uppifrån och med lika långt mellan sig. Ett
klick på en flik, ↑/↓ eller ett svep uppåt/neråt i telefonen bläddrar alla lappar till den
divisionen: bladen ovanpå lyfts från nålen ett i taget och läggs under bunten (bakåt tas de
nedersta fram och läggs överst), lapp för lapp över tavlan från vänster. Listorna räknas då
bara på divisionens lag, så att styrkan och motståndet jämförs inom divisionen; en lista
som blir tom står som *Ingen*. Det valda bladet ligger kvar överst tills sidan laddas om.

Ett klick eller A: tavlan lossnar från väggen och flyger fram – en projektiv avbildning
(`matrix3d`) från hörnen på väggen till rakt fram, så att den vrids ut ur väggens vinkel –
medan kameran går lite mot hörnet och rummet mörknar bakom; där den hängde är väggen
ljusare. Framme lutar den lite efter musen, så att ramens djup syns, och lapparna lyfter i
nederkanten när man pekar på dem. Ett klick på en lapp tar den från nålen och fram i läsbar
storlek (polaroiden vänds på vägen) med bunten och flikarna, ←/→ bläddrar mellan lapparna
och ↑/↓ mellan bladen. Esc, ett klick
utanför eller *Häng tillbaka* sätter tillbaka lappen; Esc, A eller ett klick utanför tavlan
hänger tillbaka tavlan – den flyger till hörnen där den hänger när kameran har gått
tillbaka (rum.js mäter dem med kameran där en kort stund). Guldordet *Statistik* under
tavlan leder till Statistik, och pekar man på tavlan i rummet tänds snabbvalet Statistik på
text-tv:n. Med `prefers-reduced-motion` står tavlan framme direkt.

Dolda resultat: formen får ? för de dolda matcherna, och lapparna som räknar med
resultaten (styrkan, krysset, turen, oddsen och motståndet) visar bara rubriken och ett
frågetecken när en match i lagens divisioner är dold – den lyfta lappen har då *Visa ändå*.
Lagfilerna hämtas med rummet (om igen efter en kvart), matchernas filer när tavlan tas fram.
Slitaget skiftar med dagen: lapparnas och bladens vinklar, nålhålen och hörnen av rivna
lappar.
`?rum-anslag` visar tavlan framme i en fast bild, och `?rum-anslag=<lapp>` (form, skador,
styrka, kryss, tur, odds, vila, motstand) med den lappen i handen.

### Kortregistret

På disken under anslagstavlans högra hörn står en kortlåda i lackad teak, byggd i three.js
som inredningen ([public/rum-kortlada.js](public/rum-kortlada.js)), med korten, datan och
kortet i handen i [public/rum-register.js](public/rum-register.js) och
[public/rum-register.css](public/rum-register.css). Fram på lådan sitter en mässingshållare
med etiketten *KRITAN*, överstruket med kulspets och *Lagen* skrivet bredvid – lådan har
haft ett annat jobb. I lådan står, framifrån:

- **Lagen** – en grön avdelare av pressad kartong, och bakom den ett registerkort per lag i
  omgången i bokstavsordning, med en flik av plast i divisionens färg (som på Tabeller) och
  lagets namn på en papperslapp i den. Kortet är maskinskrivet: namnet, divisionen och
  placeringen (inringad med rödpenna) och skölden urklippt i hörnet, och sedan *Ligan*
  (V–O–F, mål och poäng), *Hemma* och *Borta* (V–O–F i ligan), *Formen* (de fem senaste i
  alla tävlingar, den senaste först, förlusterna i rött), *xG* för och mot per match,
  *Styrka* (modellens, med placeringen i divisionen), *Motstånd* (hittills, tufft eller
  lätt), *Oddsen* (hur ofta laget har varit favorit och poäng mot oddsen), *Skytten* (bäste
  målskytten och andelen av lagets mål) och *Nästa* (motståndet, hemma eller borta och om hur
  många dagar, med cupen eller Europacupen när det inte är ligan). Ur
  `data/teams/<division>.json`, matcherna och matchens fil.
- **Mötena** – en röd avdelare, och bakom den ett blått kort per match: de senaste åtta
  mötena med datum, tävling, lagen och resultatet, och hemmalagets V–O–F i dem med blyerts
  längst ner.

Flikarna sitter på fem platser (lagen) och tre (mötena), så att varje flik syns ovanför
dem framför. Ett klick eller R: lådan lyfter från disken, vänder sig mot en och lutar så att
man ser ner i den, medan bilden zoomar in och rummet mörknar bakom – närbilden är en egen
duk över hela fönstret med samma perspektiv som rummet, så att lådan är skarp. Den lutar
lite efter musen, och kortet under pekaren reser sig. Ett klick på ett kort (eller en
avdelare: det första kortet bakom den): det reser sig ur lådan och tas i handen i läsbar
storlek, och pilarna (i telefonen ett svep i sidled) bläddrar mellan korten.
Esc, ett klick utanför eller *Sätt tillbaka*
sätter tillbaka kortet; Esc, R eller ett klick utanför lådan ställer den på disken igen.
Guldordet *Lagen* under lådan leder till Lagen på Statistik, och pekar man på lådan tänds
snabbvalet Statistik på text-tv:n. Med `prefers-reduced-motion` står lådan framme direkt.

Dolda resultat: lagkorten visar bara namnet och ett frågetecken när en match i lagens
divisioner är dold, med *Visa ändå* under kortet – samma nyckel som anslagstavlan, så att
det gäller båda – och dolda möten står som ?. Slitaget skiftar med dagen: kortens lutning i
lådan och vinkel i handen, hörn som har varit vikta och en kaffering. Utan WebGL står
disken tom. `?rum-register` visar lådan framme i en fast bild, och `?rum-register=<lag>`
(eller en del av kortets id, t.ex. `mote:<id>`) med det kortet i handen.

#### Vad som står var

Statistiken om omgången är fördelad efter vad varje sak är bra på:

| | Vad | Innehåll |
|---|---|---|
| **Tv:n** | Matcherna och ligorna, nu | Stryktipset live (377), omgångens matcher (331), en sida per match med odds, prognos, tabelläget, formen och hemma/borta (332–369), tabellerna (371–374) och skytteligorna (381–384) |
| **Anslagstavlan** | Omgången på ett bräde: vem som sticker ut | Formen, skadorna, vilan, starkast och svagast, kryssar gärna, tur och otur, mot oddsen och motståndet |
| **Kortregistret** | Lagen ett och ett, och historiken | Ett lagkort per lag (ligan, hemma/borta, formen, xG, styrka, motstånd, oddsen, skytten, nästa match) och mötena med resultaten |

### Videon

En liten Sony-tv med inbyggd video står på disken nere i hörnet till höger, med ryggen mot
väggen och rutan vänd ut mot rummet och gänget, i svart plast med blå bild när ingen kassett
spelar, *STOPP* i hörnet och klockan på displayen som blinkar på 12:00, som den alltid gjort
([public/rum-video.js](public/rum-video.js), [public/rum-video.css](public/rum-video.css)).
SONY står i silver mitt ovanför rutan och Trinitron under den, som på Sonys tv-apparater; båda
är ritade som former i framsidans ritning (`SONY` och `TRINITRON` – en fet, bred antikva med
raka seriffer och en jämntjock linje), inte som text, så att de är skarpa nära.
Den är en låda i CSS 3D – framsidan, sidorna med springor, taket och skuggan och skenet på
disken – i rummets eget perspektiv (1000 bildpunkter från flyktpunkten 760, 400, som högra
väggen), vriden 112 grader mot gänget mitt i rummet och så långt in längs väggen att den
ryms i bilden; i det perspektivet ser en tv som bara är vriden lite ut att stå rakt mot en.
Under rutan sitter kassettfacket, displayen och knapparna ◀◀ ▶ ▶▶ ■ ⏏. Repriserna på VHS,
också de lådor (ryggen, taket och ändarna), står i en fruktlåda i furu bredvid, lite längre
in längs väggen: två fack med en mellanvägg (`MV`), tretton kassetter höga, med en tejpbit
över varje fack – dagen för förra omgången (*LÖR 24/10*) och *INFÖR 31/10* – och ÄPPLEN ·
KLASS I på brädan. Lådan är också en låda i 3D (sidan med springor mellan brädorna, taket,
och innanför öppningen väggen, mellanväggen, botten och baksidan), i tv:ns mått och vriden
likadant, med öppningen mot gänget.

**Kassetterna** är matcher med YouTube-klipp (samma klipp som spelaren på sajten,
[public/hojdpunkter.js](public/hojdpunkter.js)), högst 13 i varje fack (`FACKEN`): till vänster förra
omgångens matcher i kupongens ordning, med kupongens nummer på en rund röd lapp (en match
utan klipp lämnar sitt nummer tomt), och till höger den senaste matchen med klipp (högst tre
veckor gammal) för lagen i nästa omgång, match för match – de som inte redan står till
vänster. Omgången som gänget tippar (`round()` i rum.js) är nästa så länge ingen av dess
matcher har börjat, och förra när någon har det; den andra är kupongen som spelades senast
(historiken och kupongerna), eller efter förra de närmaste matcherna i Premier League och
Championship efter den helgen (`omgangar`). Ryggen är kassetten själv eller ett pappfodral
(vitt med rött, blått, svart med gult, grått med orange, samma för samma match) med en
maskinskriven etikett (Special Elite): lagen och resultatet, så stort som det får plats
(`passa`, högst 20 bildpunkter i ritningen) – resultatet kortas aldrig. Med Dolda resultat
står inget resultat på etiketten eller i listan, och klippets rubrik täcks i rutan.

**Listan i rutan.** När ingen kassett är i visar den blå rutan kassetterna i stället för
*STOPP*, ett fack per sida: *LÖR 24/10* med kupongens nummer (matcherna utan klipp svaga)
och *INFÖR 31/10*, med *1/2 ▶* och *◀ 2/2* uppe till höger. Den markerade kassetten står i
vitt; ↑/↓ (eller musen) flyttar markeringen, ←/→, ◀◀/▶▶, ett svep i sidled eller ett klick på
rubriken byter sida, och ett klick på en rad, mellanslaget eller ▶ spelar den. Listan står i
bildens 16:9, så att den syns hel när rutan fyller fönstret. När kassetten matas ut kommer
listan tillbaka på samma sida, med den markerad.

**Nära** (klick eller V) går kameran fram tills tv:n och lådan ryms mellan namnet och
foten (högst sex gånger), och svänger samtidigt runt tv:n in mot rummet, så att man ser
rutan snett framifrån i stället för från sidan. Tv:n och lådan vrids inte och flyttas inte –
de står kvar vända mot gänget – utan det är kameran som rör sig (se *Kamerans sväng* nedan).
Kassetterna glider ut en bit när man pekar på dem. I telefonen på höjden går kameran bara
fram till lådan (`LADAN`), så att etiketterna går att läsa; där tar en kassett (eller ett
tryck på kanten av tv:n bredvid lådan) kameran vidare till rutan. Ett klick på rutan (eller hjulet framåt)
går ännu närmare, så att bilden i rutan nästan fyller fönstret (med en smal svart kant runt
om, så att bildens gräns syns; i telefonen på höjden syns knapparna under den), och kameran
svänger och går rakt framför tv:n, så att rutan syns rakt framifrån. Texten i rutan (*STOPP*,
*▶ SPELA*) står inne i bilden, så att den syns där. Ett klick till, hjulet bakåt eller Esc går
tillbaka till tv:n och lådan, och V,
Esc eller ett klick utanför hörnet tillbaka till rummet, där kameran svänger tillbaka till
där den stod. Ett klick på en kassett: den
lyfts (ur lådan dras den först ut genom öppningen), ställs framför facket och skjuts in,
luckan fälls upp, och de ovanför sjunker ner i
luckan i facket. Rutan är blå med *▶ SPELA* tills bilden kommer, och klippet spelas i
YouTubes spelare (`youtube-nocookie.com`, i 16:9 med svarta kanter i den 4:3-stora rutan)
med displayen som räknar tiden. ▶ spelar eller pausar, och ⏏ matar ut – kassetten åker
tillbaka till sin plats. ◀◀ och ▶▶ (och ←/→, eller ett svep i sidled i telefonen) spolar som
på en riktig video, fortare och fortare, tills man trycker ▶ eller ■: 4 sekunder i sekunden
i början och dubbelt så fort var och en halv sekund (`FART`, `DUBBEL`), upp till 64 (`MAX`).
Ett tryck till åt samma håll spolar dubbelt så fort på en gång (ett nytt tryck räknas, inte
en nedtryckt tangent), och åt andra hållet vänder den; farten ändras mjukt (`TROG`), så att
bandet bromsar och vänder i stället för att hoppa. ▶ spelar därifrån. ■ stoppar: rutan blir
blå med *STOPP*, räkneverket och bandmätaren, displayen visar ■ och tiden, och ▶ spelar
därifrån. I början och slutet av klippet stannar den av sig själv. ↑/↓ byter till kassetten
över eller under (efter förra omgången kommer nästa). När klippet är slut matas den ut av sig själv. Går man därifrån mitt i
en spolning stannar bandet där, och det spelar därifrån när man kommer tillbaka.

**Tangenterna.** Nära (och när rutan fyller fönstret, där knapparna inte syns) styrs videon
med tangentbordet: ← och → spolar som ◀◀ och ▶▶, mellanslaget spelar och pausar som ▶ (och
spelar därifrån medan den spolar), S stoppar som ■, ↑/↓ byter kassett och Esc går tillbaka;
utan kassett flyttar ↑/↓ markeringen i listan och ←/→ byter sida.
Med tangentbord och mus står de där i rummets fot (*← → spola · mellanslag spela · S stopp
· ↑ ↓ kassett · Esc tillbaka*, utom i fönster smalare än 700 eller lägre än 500 bildpunkter)
– rummets egna tangenter står inte i foten, eftersom de låg över kupongen, men nära videon
syns inte kupongen – och knapparna säger sin tangent när man pekar på dem (*Stopp · S*), som
sakerna i rummet. Efter ett klick med musen tappar knappen fokus, så att mellanslaget spelar
i stället för att trycka på samma knapp igen; går man till en knapp med tabben trycker
mellanslaget på den.

**Bildsökningen.** Medan den spolar söker videon i bilden som en riktig video: klippet
självt rusar fram eller bak i rutan, urblekt, lite suddigt och skakigt, med två brusränder
(vita och svarta streck i grått brus, en rad per bildlinje) som rullar nedåt genom bilden
framåt och uppåt bakåt, fortare när den spolar fort. Uppe till vänster står ◀◀ eller ▶▶ och
till höger räkneverket (0:01:23), och nere bandmätaren – var i klippet bandet är, i tjugo
steg: fyllda block dit det har kommit och streck resten av vägen, lika långt in från
kanterna som texten uppe. Displayen på videon räknar likadant. YouTubes spelare står på
paus och hoppar dit räkneverket är ungefär åtta gånger i sekunden (`HOPP`, 120 ms, `hoppa` i
rum-video.js): i paus kommer rubriken, knappen och loggan inte fram, bara bildrutan – fram
och bak, hur fort det än går (provat i 4, 16 och 40 sekunder i sekunden: en ny bild vid varje
hopp). Medan spelaren nyss har börjat spela kan dess saker ännu synas, och då visar rutan i
stället den av YouTubes tre bildrutor ur klippet (`i.ytimg.com/vi/<id>/hq1–3.jpg`, ungefär en
fjärdedel, hälften och tre fjärdedelar in, i 4:3 med svarta kanter som klippet i rutan) som
ligger närmast räkneverket – riktiga bildrutor, inte omslagsbilden, som kan ha resultatet
(utan `.vhs-ram`). Med Dolda resultat täcks överkanten av bildsökningen som av klippet.

När man trycker ▶ står bilden still och darrar, som en video på paus, med en rand kvar och ▶
i hörnet, tills klippet kommer. Spelaren kan inte börja spela utan att visa sina saker, så en
ny spelare värms upp bakom stillbilden, från 4,4 sekunder före räkneverket, och den gamla med
stillbilden (`.still`) tas bort när den nya kommer fram (`load` med `kvar`, `spelaHar`). I
telefonen, där två spelare tar för mycket minne, står YouTubes bildruta still i stället
medan samma spelare värms upp bakom den. Räkneverket och bandmätaren står kvar 2,5 sekunder in
i klippet (`EFTER`) och räknar vidare. Bruset ritas en gång i en liten duk (`randBrus`, 512 ×
80), och det som rör sig är egna små lager. Med `prefers-reduced-motion` står bilden och
ränderna still medan räkneverket rullar, och klippet byts utan att skaka.
Går inget av matchens klipp att spela här blir det myrornas krig, och klippen hoppas över
nästa gång (samma lista som spelaren på sajten). Går man därifrån pausar videon, och den
frusna bilden står kvar i rutan; tillbaka och den spelar vidare. Rummet stängs och videon
stannar. Med `prefers-reduced-motion` åker kassetterna direkt.

**Att det är YouTube syns inte.** Spelaren har inga egna knappar (`controls=0`), får aldrig
musen och textas inte (`hl=en` och `unloadModule('captions')`). Rubriken, kanalens bild,
knappen i mitten och loggan syns ändå i knappt fyra sekunder varje gång ett klipp börjar
spela, hoppar medan det spelar eller spelar vidare efter en paus – men inte vid paus, inte när
det hoppar i paus och inte när ljudet slås av och på (mätt med bilder var 1/60 sekund: borta
mellan 3,7 och 4,0 sekunder efter att spelaren sa att den spelade). Därför visar videon sin
blå bild med *▶ SPELA*, utan ljud, tills klippet har spelat i 4,4 sekunder (`FORVARM`; förut
3,6, då en skymt av rubriken kunde synas); när den spelar vidare efter en paus spolar den
först tillbaka lika mycket, så att bilden fortsätter där den stannade, och efter en sökning
börjar den nya spelaren lika långt före räkneverket. Slutet, och förslagen efter det, täcks
direkt.

**Kamerans sväng.** Rummet är målat på platta plan, så kameran kan inte gå runt i det på
riktigt. Svängen är i stället två saker som sker samtidigt, på 0,6 sekunder som
förstoringen: rummets plan vrids 30 grader i 3D kring tv:n (34 när bilden fyller fönstret;
`sving` i rum.js), och hörnet – tv:n, högen och lådan, som är lådor i 3D i rummets eget
perspektiv – ritas från samma håll, 30 grader runt tv:ns mitt (`SVANG` och `.vhs-kam` i
rum-video.js). När bilden fyller fönstret ritas hörnet 112 grader runt (`VRID`), så att rutan
står parallellt med bilden, och ögat (perspektivets mitt i hörnet, `perspective-origin` på
`.vhs-in`) flyttas rakt framför rutan: kameran går fram genom att förstora en del av bilden,
så vänd mot det vanliga ögat blev rutan sned som i kanten av ett vidvinkelfoto, och därifrån
skymde lådan rutans vänstra kant. Att rummet bara vrids 34 grader där syns inte, eftersom
bilden fyller fönstret. Planen vrids som de är, och väggen, skårtavlan, korktavlan och
disken följer med; tv:n och lådan ses från det nya hållet. Hörnets eget plan vrids inte: det
står där rummet vrids kring, och Chrome ritar allt som lutar i perspektiv suddigt nära. Det
flyttas i stället fram lika långt som väggen vrids fram bakom lådan och görs lika mycket
mindre, så att det syns där det syntes – räknat längs synlinjen genom lådans vänstra kant,
där den möter den vridna väggen (rakt bakom kanten räckte inte, och väggen skar av lådans
vänstra kassettrad). Större vinklar på rummet går inte: vid ungefär 40 grader glider
fönsterbänken in över lådan och lådan ser ut att sväva över disken. Nära tar bara hörnet
emot klick – med kameran svängd räknade Chrome annars kortregistret på disken bakom lådan
som närmast, och kassetterna i lådan gick inte att klicka på. Med `prefers-reduced-motion`
och i fasta bilder står kameran direkt i vinkeln. Lagren blir inte fler eller större.

Hörnet ritas i sex gånger storleken och förminskas, som tv:n, och dubbelt till (`zoom: 2`)
när rutan fyller bilden (det andra klicket), så att det är skarpt också där; ritningarna är
bara så stora som tv:n och lådan, så att lagren inte blir större än de behöver. På håll och
vid första närbilden räcker de sex gångerna (`zoom: 1`): Chrome ritar lager i perspektiv
minst i sin egen storlek, och dubbelt ritat tog hörnet ungefär 95 MB grafikminne också på
håll. I telefonen (smalare än 700 eller lägre än 500 bildpunkter) räcker hälften av det
(`zoom: 1` när rutan fyller bilden, annars `zoom: 0.5`) – Safari ritar lagren i full storlek
gånger pixeltätheten, och tobaksaffären fick slut på minne i iPhone. Storleken byts med övergångarna
avstängda (`skarp` och `tat` i rum-video.js, `zoomVideo` i rum.js), innan kameran går
fram till rutan och när den har gått tillbaka, eftersom zoom också ändrar måtten i
övergångarna. Spelaren är dubbelt så stor som
rutan och förminskas, så att klippet är skarpt nära. Väggen, disken och pulten fortsätter till
höger om bilden (`vagg` och `pult` i rum-video.js, i samma plan och med samma toner som i
rum.js), så att bilden inte tar slut när kameran går fram. `?rum-video` visar videon nära i
en fast bild.

### Närbilderna

Uret, skårtavlan, Omgångens orakel och VM 94-affischen tittar man på nära med ett klick
(`sak` i rum.js, `data-sak` på föremålen): kameran ställer sig rakt framför och går fram tills
saken fyller det mesta av fönstret – högst 90 % av bredden och 74–94 % av höjden mellan
namnet och foten – i telefonen också. Rummet vrids rakt medan kameran glider fram och står
sedan still: så länge något vrids ritar webbläsaren lagren i den vanliga skalan och förstorar
dem suddigt, och när det står still ritas de om skarpt. Det som står framför väggen – gänget
vid barbordet och pulten – tonar bort medan kameran går förbi. Uret,
orakelramen och ramen kring skårtavlan är ritade i 3D och ritas om i närbildens skala när
kameran är framme (`skarp` i rum-inredning.js, högst 2600 bildpunkter på längsta ledet);
uret går som vanligt, med sekundvisaren.

Under skårtavlan och oraklet står guldordet dit de leder (*Tabeller*, *Olympen*); det, eller
ett klick till på saken, tonar bort rummet och byter sida. Under affischen står fotografen
och licensen med en länk till fotot på Wikimedia Commons. Esc, ett klick någon annanstans
eller ett klick till på uret eller affischen går tillbaka, och K, T, A, R och V går direkt
till kupongen, tv:n, anslagstavlan, kortregistret och videon. Föremålen lyser inte när man
pekar på dem på nära håll. Med `prefers-reduced-motion` går kameran direkt.
`?rum-sak=ur|skar|ram|vm94` visar en närbild i en fast bild.

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
- **Analysera (Claude):** svaret från Claude med alla sökträffar är stort, och att tolka det
  tar processortid. Med Cloudflares gratisnivå (10 ms per anrop) är det inte mätt i den
  driftsatta Workern – slår det i taket visar kortet ett fel. Claudes tecken sparas inte
  i journalen och rättas inte; sajter som är spärrade på utvecklingsdatorn (t.ex. Reddit)
  kan stå i källistan, och länkarna öppnas då inte där.
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
  lämna in tips i någons namn – och, sedan 2026-10-22, se och ändra de inlämnade tipsen
  (se [Säkerhet](#säkerhet)). Märkningen
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
förrän de visas för alla, och `se` bara till den som har lämnat in. Vem man är väljer man
själv på enheten, så tjänsten litar på gänget (sedan 2026-10-22, så att de andras tips syns
på alla ens enheter): den som inte har lämnat in kan se tipsen genom att säga att hen är
någon som har det, eller ändra någon annans tips. Sidan hindrar bara att det sker av
misstag – en enhet byter inte till någon som redan har lämnat in. Kommentarerna i
efterhand döljs som tipsen, och vem som helst kan skriva en i någons namn.
