# Matchfixarna

Hemsida (matchfixarna.se) som gör matchprognoser för Premier League, Championship,
League One, League Two, FA-cupen och EFL-cupen – och sedan rättar sina egna
prognoser mot facit. Byggd efter samma principer och arbetssätt som Gräva guld
(`~/Kod/Gräverguld`), utan betalda tjänster. Analyserna skrivs på en dator med Claude Code på ett Claude-konto
(se [Analyserna](#analyserna)). Under utvecklingen körs sidan lokalt.

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
- [x] **Fas 5 – Matchanalys:** knappen Analysera i matchvyn. Skrevs först vid klick via en
  proxy på Cloudflare Workers (DeepSeek, sedan Claude); sedan 2026-11-04 skrivs den i förväg
  på en dator (se [Analyserna](#analyserna))
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
- [x] **Talongen live (2026-11-09, gängets önskemål):** kupongen i handen visar minut och
  ställning när matcherna är igång och uppdateras av sig själv, utan att man lägger tillbaka
  den. Gängets kupong har allas kommentarer under raderna och, igen men bara där, Svenska
  folket, oddsen och favoritskapet från Svenska Spel – var och ens egen kupong har dem inte,
  som sedan 2026-10-21 (se [Kupongen i handen](#kupongen-i-handen))
- [x] **Stryktipset som veckans kupong (2026-10-20):** när Svenska Spel öppnar veckans
  Stryktips (senast måndag kl. 07) och förra omgången är färdigspelad, sedan 2026-11-08 tidigast
  måndagen efter omgången kl. 16, blir dess tretton matcher
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
  har samma tre nya siffror ([src/teamstats.js](src/teamstats.js)). Sedan 2026-11-05 är
  topplistorna anslagstavlans sex (*Statistik som i tobaksaffären* nedan)
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
  nyheterna som hämtas just då, utan sökningar. Sedan 2026-11-04 skrivs allt i förväg och
  *Analysera igen* är borta (se [Analyserna](#analyserna))
- [x] **Gängets kupong efter avspark och regeln som fråga (2026-11-03, användarens beslut):**
  en match går att fylla i på gängets kupong till 30 minuter efter avsparken
  (`efterAvspark` i [config/kupong.js](config/kupong.js)), i uppgörelsen, på pulten, i Ny
  kupong, Ändra och Ladda upp system – och tjänsten tar emot den lika länge. Var och ens egna
  tips stänger som förut vid första avsparken. Följer gängets kupong inte regeln, saknar
  matcher tecken eller är matcher låsta säger sidan det och sparar när man trycker igen –
  förut stoppade regeln gängets kupong helt, och låsta matcher föll bort utan ett ord. Bakgrund:
  31 oktober gick gängets slutliga kupong inte att spara, och när den sparades 16:24 kom bara de
  två matcher med som inte hade startat
- [x] **Analyserna skrivs i förväg på datorn (2026-11-04, användarens beslut):** analyserna,
  Hasse Backes texter, omgångarnas namn och kupongernas kommentarer skrivs på en dator som står
  på dygnet runt, med Claude Code (`claude -p`) på användarens Claude-konto, och committas som
  filer. Sajten visar bara färdiga texter och anropar ingen språkmodell. DeepSeek och proxyn
  `profeterna-analys` är borta, och sajten är inte längre sökbar (`noindex`). Se
  [Analyserna](#analyserna)
- [x] **Statistik som i tobaksaffären (2026-11-05, användarens önskemål):** Statistik → Lagen
  har anslagstavlans topplistor, med samma namn, i samma ordning och ur samma tal: *Formen*
  (de fem senaste i ligan och de engelska cuperna, flest poäng överst), *Starkast & svagast*,
  *Kryssar gärna*, *Tur & otur*, *Mot oddsen* (*Slår oddsen* och *Sviker*) och *Motståndet*
  (*Tufft hittills* och *Lätt hittills*). Listorna åt två håll har de tre högsta och de tre
  lägsta med en stapel från mitten, och *Alla lag* under varje lista visar hela divisionen
  likadant. Tabellen Alla lag har kolumnen *Form* (inte i telefonen, där tabellen ska rymmas
  utan att man sveper). Lagkortet har det kortregistret har om ett lag – nästa match, formen
  match för match, mål och xG för och mot per match och hur ofta laget varit favorit – och
  lagets tal från tavlan under samma namn som i tabellen. Topplistorna under Spelarna delar
  plats vid lika tal, som skytteligan på text-tv:n. I telefonen står topplistorna i en rad som
  man sveper i sidled ([public/divisioner.js](public/divisioner.js),
  [public/divisioner.css](public/divisioner.css))
- [x] **Den beräknade startelvan (2026-11-07, användarens önskemål):** har 365Scores ingen
  elva än – i League One, League Two och cuperna, och i Premier League och Championship mer
  än några dagar före – visar Startelvor en egen elva med stämpeln *Beräknad elva*. Den tar
  med rotationen i Champions League och cuperna: i ligan är den lagets senaste ligaelva, så
  att elvorna från cupen och Europa inte styr, och i cupen tas bänken från förra ligamatchen
  först när lagen i divisionen brukar rotera där. De som saknas enligt 365Scores eller FPL
  stryks och ersätts. Stämde på 8,8 av 11 i säsongens ligamatcher och 7,0 i cupmatcherna (se
  [Den beräknade startelvan](#den-beräknade-startelvan))
- [x] **Snabbare laddning (2026-11-07, användarens önskemål):** "laddas fortare (grafiken o allt)
  utan att grafiken blir sämre eller att det blir mer ansträngt för datorer o mobiler". Samma bild
  och samma arbete i webbläsaren, färre och mindre filer: bygget på GitHub Actions gör JavaScript
  och CSS mindre ([src/minify.js](src/minify.js)), typsnitten ligger på sajten i stället för hos
  Google Fonts ([public/typsnitt.css](public/typsnitt.css)), rummets 3D-filer börjar hämtas redan i
  `<head>`, Hasse Backes handmodell skickas packad och figur- och sköldbilderna är packade om utan
  förlust. Rummet klart i Chrome som telefon på långsamt nät efter 17,0 → 14,3 sekunder, på 4G
  8,5 → 8,1 (11,4 → 10,8 med en långsammare processor), i datorn oförändrat ungefär 2 sekunder; bilden jämförd bildpunkt för bildpunkt (se
  [Mindre filer](#mindre-filer))
- [x] **Gängets kupong i realtid (2026-11-08, användarens önskemål):** den som fyller i gängets
  kupong i uppgörelsen – på papperet eller på pulten i tobaksaffären – gör det på allas kupong.
  Kryssen, det klubbade och *Börja om* syns direkt hos alla som ser kupongen, och knappen blir
  *Sparad* hos alla när någon har sparat. Förut såg var och en bara sina egna kryss tills kupongen
  sparades och sajten hade byggts om (se *Gängets kupong i realtid* under
  [Inför uppgörelsen](#inför-uppgörelsen))
- [x] **Gänget sover på natten (2026-11-09, användarens önskemål):** mellan 22.30 och sju sover
  gänget i tobaksaffären, var och en på sitt sätt och nästan stilla – DL med huvudet bakåt och
  flaskan i famnen, DT med hakan mot bröstet och huvudet som sjunker och rycker till, DJ med
  huvudet på armarna på bordet – med små z som stiger i var och ens takt. Radion, matcherna eller
  ett klick på någon väcker dem på ett av tre sätt (med ett ryck, sakta med en gäspning eller
  bakfull med handen mot pannan och en återställare); först är de groggy med tunga ögonlock och
  påsar under ögonen, sedan kommer de igång, och efter en stund utan musik eller klick somnar de
  om. Lysröret dämpas långsamt från 23 till midnatt (förut släcktes det vid midnatt) och tänds lika
  långsamt från sex till sju (se *Natten* och *Sömnen* under [Tobaksaffären](#tobaksaffären))
- [x] **Tidningen (2026-11-09, användarens önskemål: "förbättra tidningen otroligt mycket"):** veckans tidning i
  tobaksaffären finns också före omgången, och den är en riktig tidning: sedeln som framsida,
  *I tidningen* med sidorna, och sidor med sidhuvud, avdelningar, spalter och tabeller. Före omgången *Tipset*
  (matcherna, datorns procent, Sixten Bråvalls tecken och Tipsligan), *Så mår tipslagen* (notiserna inför
  omgången) och *Veckans analys*; efter den *Omgången* (resultaten, rätt rad och siffrorna), *Betygen*,
  *Skrällen* med det ni skrev på kupongen, och Hasse Backes krönika med Tipsligan. Förut fanns den bara efter
  omgången, med betygen, skrällen och två meningar från Hasse (se *Tidningen* under [Tobaksaffären](#tidningen))
- [x] **Tipsguiden på pulten (2026-11-09, användarens önskemål: "nåt nr av tipsguiden … som man kan plocka upp o
  läsa"):** tidningens tipsbilaga ligger på pulten mellan Hasses nota och kupongen, med kupongen en bit över sig. Ett
  klick eller G lyfter den, och den läggs fram som kvällstidningen, med en egen framsida (namnet, veckans
  nummer, en rubrik, kupongens matcher med datorns tecken, Rysaren och Spika) och sidorna inför omgången och *Åtta
  knep*. Ett nummer finns alltid, också efter omgången och mellan omgångarna (se *Tipsguiden* under
  [Tidningen](#tidningen))
- [x] **Kvällstidningen på pulten (2026-11-10, användarens önskemål: "När man zoomade in den här så fick man hela
  tidningen - så ska det inte vara"):** ett klick på veckans löpsedel går bara fram till sedeln, som de andra
  löpsedlarna. Tidningen ligger i stället hopvikt på pulten till höger om kupongen, bakom högen med de inlämnade
  kupongerna: samma tidning och samma förstasida som löpsedeln, och ett klick eller L lyfter den och lägger fram den
  som förut. Den är ritad som Tipsguiden, i sidan och inte i 3D, och kostar lika lite som den (se
  [Tidningen](#tidningen))

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
- **Analyserna** ingår inte i bygget: datorn committar `data/analyser.json` och
  `data/omgangsnamn.json` till `main`, och den pushen bygger om sajten som vilken annan push
  som helst. Bygget kopierar filerna till sajten. Se [Analyserna](#analyserna).
- **Hasse Backes röst** är i första hand Tomas egen: iMacen läser upp allt han säger och
  force-pushar ljudet till grenen `rost`, en enda föräldralös commit med `rost.json` och de
  mp3-filer som behövs nu. Steget *Hämta Hasse Backes egen röst* hämtar grenen (djup 1) till
  `data/egen-rost/`, som inte committas. Det som saknas där hämtas i bygget från Azures
  talsyntes med hemligheten `AZURE_SPEECH_KEY` och sparas i källcachen (`data/cache/rost/`).
  Allt laddas upp med sajten (`data/rost/`, `data/rost.json`). Inget av det hamnar på main,
  och en push till `rost` startar inget bygge: nästa schemalagda körning tar med det nya. Se
  [Ljudet](#hasse-backe).
- **Mindre filer** (se [Mindre filer](#mindre-filer)): bygget körs med `--minify`, som gör
  JavaScript och CSS i `_site/` mindre. Lokala byggen gör det inte, så att koden går att läsa i
  webbläsaren; `npm run build -- --minify` bygger som på GitHub Actions.
- **Läge 2026-10-19:** sidan ligger på <https://matchfixarna.se/> (custom domain i
  *Settings → Pages*, HTTPS påtvingat). Gamla <https://tomaslaino.github.io/Profeterna/>
  skickas vidare dit, så även `site` i [config/kupong.js](config/kupong.js) fungerar via
  omdirigeringen. profeterna.se registrerades aldrig.
- **Engångsinställningar:** skapa repot på GitHub (publikt, krävs för gratis Pages), välj
  *Settings → Pages → Source: GitHub Actions*, ange matchfixarna.se som custom domain och
  peka domänens A-poster på GitHub Pages (185.199.108.153, .109.153, .110.153, .111.153)
  och `www` som CNAME på tomaslaino.github.io. Domänen måste stå i Pages-inställningen –
  annars visar GitHub "There isn't a GitHub Pages site here" och ett certifikat för
  *.github.io (webbläsaren säger "inte säker").

### Mindre filer

Sajten hämtar samma saker och ritar samma bild som förut, men med färre byte och färre
uppkopplingar (2026-11-07, användarens önskemål: fortare "utan att grafiken blir sämre eller att det
blir mer ansträngt för datorer o mobiler").

- **JavaScript och CSS** görs mindre i bygget med esbuild, fil för fil
  ([src/minify.js](src/minify.js), `--minify`): blanksteg och kommentarer bort och korta namn på det
  som bara syns inuti en funktion. Ingen buntning och samma filnamn, så att sidorna, `import()` och
  importmapen pekar på samma filer; namnen högst upp i ett vanligt skript (som andra filer läser)
  står kvar. Med gzip 701 → 437 kB JavaScript och 155 → 103 kB CSS för hela sajten. Går esbuild
  inte att läsa in, eller en fil inte att tolka, står filen kvar som den är. esbuild är ett
  utvecklingsberoende och installeras av `npm ci` på GitHub Actions.
- **Typsnitten** ligger i [public/typsnitt/](public/typsnitt/) med reglerna i
  [public/typsnitt.css](public/typsnitt.css), som varje sida länkar först. Det är samma woff2-filer
  och samma `@font-face`-regler (vikter, `unicode-range`, `font-display: swap`) som Google Fonts
  skickar – Chrome, Safari i iPhone och Firefox får samma filer därifrån (kontrollerat 2026-11-07).
  Förut låg de som `@import` i theme.css, papper.css, rum.css, rum-anslag.css och rum-register.css:
  sidan → stilmallen → Googles stilmall → typsnittet, och två egna uppkopplingar
  (fonts.googleapis.com, fonts.gstatic.com). Alla har SIL Open Font License utom Skrivmaskin (nedan).
  Ett nytt typsnitt: hämta Googles stilmall med en webbläsares User-Agent, lägg filerna i typsnitt/
  och reglerna i typsnitt.css med de lokala adresserna.
- **Papperets tre röster:** allt papper (kupongen, matchbladet, protokollet, kortregistret,
  anslagstavlan) har samma pappersstruktur och samma tre röster, så att det ser ut att komma ur samma
  låda: det förtryckta (`--tryck`, Fraunces i terrakotta: band, rubriker, rutor, nummer), det
  maskinskrivna (`--skriv`: lag, tider, värden) och pennan (`--pp-hand`). Färgerna står på ett ställe,
  i [public/papper.css](public/papper.css), som också pekar om `--display` och `--sans` till
  skrivmaskinen på papperet. En skrivmaskin har inget fetstilt: det som ska framhållas stryks under.
- **Skrivmaskin** är Special Elite (Apache 2.0) ombyggd av
  [scripts/typsnitt/skrivmaskin.py](scripts/typsnitt/skrivmaskin.py): alla tecken lika breda, och sju
  anslag av varje tecken (högre, lägre, snett, svagt, ojämnt, dubbelslag) som OpenType-funktionen
  `calt` byter mellan, plus ett fel som alltid sitter kvar på varje tecken, som en sned typarm. Ingen
  bokstav blir den andra lik utan att sidan gör något, också på en duk i three.js och utan fler
  element i rummet. `ss01`–`ss06` börjar raden på ett annat anslag; papper.css använder dem (`--anslag`)
  där samma text står på flera rader. Originalen ligger i scripts/typsnitt/kalla/.
  Pappersstrukturen bakas av [scripts/rum/papper.mjs](scripts/rum/papper.mjs).
- **Rummets 3D-filer redan i `<head>`:** står tobaksaffären (klassen `rum-vantar`) lägger ett skript
  efter importmapen `modulepreload` för three.js och dess tre tillägg, rum-3d.js och de moduler den
  läser (samma lista som `forhamta`), sakerna, inredningen, löpsedlarna, neonen och kortlådan – samma filer som `forhamta` i rum.js
  annars börjar hämta när rummet visas, nästan en sekund senare i telefonen. Bilderna hämtas som
  förut av `forhamta`.
- **Hasse Backes hand** ([scripts/hasse/hand.mjs](scripts/hasse/hand.mjs)) är en binär fil, som
  GitHub Pages skickar opackad. Bygget lägger samma fil packad bredvid (`rum/hasse-hand.bin.gz`,
  233 → 163 kB, `packaBinart` i [src/minify.js](src/minify.js), i varje bygge så att den aldrig blir
  äldre än originalet), och [public/rum-hasse-arm.js](public/rum-hasse-arm.js) packar upp den med
  `DecompressionStream`; går det inte hämtas den opackade.
- **Bilderna:** kropp-*.png, skold-*.png och apple-touch-icon.png är packade om utan förlust (samma
  bildpunkter, kontrollerat), med färgbitarna kvar (gAMA, cHRM, sRGB) och utan metadata (EXIF, XMP,
  pHYs): 390 → 342 kB. Kropparna är kvar som PNG: de är märkta med gamma 2,2, som WebP inte bär, så
  de mörkaste tonerna hade blivit en aning andra. JPEG-filerna blev inte mindre utan att göras om till
  progressiv JPEG och är orörda.

**Mätt** i Chrome (headless, Metal) mot en lokal HTTP/2-server som skickar som GitHub Pages (gzip,
`max-age=600`), gammal och ny kod om vartannat, till dess rummets egna delar är klara (`?rum-mat`:
gänget, inredningen och sakerna, och kön i telefonen tom). Som telefon (390 × 844, processorn två
gånger långsammare): på långsamt nät (1,6 Mbit/s, 150 ms) 17,0 → 14,3 sekunder och gänget
11,7 → 10,2; på 4G (9 Mbit/s, 70 ms) 8,5 → 8,1; med processorn fyra gånger långsammare på 4G
11,4 → 10,8 (där är det mest processorn som bromsar). I datorn utan broms ungefär 2,2 → 2,0
sekunder, inom bruset. Hämtat 4,0 → 3,7 MB. Utan förhämtningen i `<head>` blev det 15,3 sekunder
på långsamt nät, med bara gängets filer förhämtade (de som `forhamta` tar) 15,1.

**Samma bild:** rummet med fryst tid (`?rum-t=4`) och sidorna Statistik, Tabeller och Matcher
fotograferade före och efter och jämförda bildpunkt för bildpunkt: minifieringen och bilderna ger
ingen skillnad alls. Med typsnitten och förhämtningen skiljer några hundra bildpunkter av 1,3
miljoner med högst 11 av 255 i kantutjämningen av texten på dörren och tv:n – lagren hinner ritas i
en annan ordning, inte andra bokstäver – och lika mycket som samma kod skiljer mot sig själv
mellan två laddningar på kupongen och Om oss.

**Det som är kvar:** första gången rummet visas i en webbläsare kompilerar grafikkortet ungefär 95
shaderprogram åt fem WebGL-dukar (kortlådan, gänget, sakerna, inredningen och handen), och det tog
5–10 sekunder i datorn med tom shadercache – mer än allt ovan. Sedan har webbläsaren dem sparade.
Färre program kräver färre olika material eller en gemensam duk, alltså ändringar i rum-3d.js,
rum-saker.js och rum-inredning.js; det är inte gjort.

## Lokalt

Kräver Node.js ≥ 18.

```bash
npm install
npm start              # bygger och serverar _site/ på http://localhost:3001, bygger om var 15:e min
npm run build          # bara bygget (hämtar källor vars cache är för gammal)
npm run build -- --minify  # som på GitHub Actions: JavaScript och CSS i mindre form (se Mindre filer)
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
bara lokalt. Analyserna visas som de ligger i `data/analyser.json`; hur de skrivs står under
[Analyserna](#analyserna).

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
| Startelvor bakåt (för den beräknade startelvan) | ESPN matchsammanfattning (samma rapporter som speltiden) | alla fyra ligor och båda cuperna | 6 h, bara nya matcher | Verifierat 2026-11-07 för ligorna, cuperna och Europacuperna (1 410 elvor): lagets formation (`4-2-3-1`) och varje startande spelares platsnummer 1–11 (`formationPlace`, Optas numrering, målvakten 1), avbytarna med plats 0 och samma spelar-id som trupperna. Positionsnamnen (`LB`, `CD-L`, `AM-R` …) ligger på samma sida som platsnumret i 15 490 av 15 510 platser, men följer inte linjen (i 4-2-3-1 heter de defensiva mittfältarna `LM` och `RM`) – därför en egen tabell från plats till linje och sida per formation ([public/elva.js](public/elva.js)). Sparas kompakt i samma cache som speltiden (`e` per match, ligorna) och i `espn_elvor_<cup>`; matcher sparade före 2026-11-07 hämtas om en gång. Styr inte prognosen. |
| National League | football-data.co.uk (`EC`) | underlag för FA-cupens non-league-lag | 12 h | Resultat, skott och odds, ingen xG. |
| Tidigare säsonger, ligorna | football-data.co.uk (`mmz4281/<säsong>/E0–E3, EC.csv`) | PL–L2, National League | 30 d | E0–E3 2000/01–2025/26 (26 säsonger, 52 672 matcher), EC 2005/06–2025/26 (11 234; 2000/01–2004/05 svarar 300). Fulla säsonger utom League One/Two 2019/20 (400/440 matcher, avbruten säsong) och EC 2019/20–2021/22 (451, 477, 506). En fil per säsong, ~0,25 s styck – allt hämtas på ~4 s. Äldre filer är Windows-1252 (t.ex. "King’s Lynn" i EC 2021/22), nyare UTF-8; läses därefter. Sparar resultat, skott och odds (marknadssnitt hette `BbAv` före 2019/20). |
| xG, tidigare säsonger | Understat (`getLeagueData/EPL/<år>`) | PL | 30 d, bara kandidatjakten | 2014/15–2025/26, 380/380 matcher med xG varje säsong (verifierat 2026-10-17), alla 4 560 parade mot football-data.co.uk på (hemma, borta). Hämtas av `npm run kandidater`, inte av bygget – används först om xG-kandidaten klarar kravet. |
| Tidigare säsonger, FA-cupen | ESPN (`eng.fa`, månad för månad) | FA-cupen | 30 d | 2021/22–2025/26, 674 matcher från first round proper (ESPN har längre bak). Enda fria källan till matcher för lag under National League. Rundornas namn varierar mellan säsongerna. ESPN:s flagga för neutral plan är inte satt för Wembley-matcherna. |
| Domare och kort, tidigare säsonger | football-data.co.uk (samma filer som raden ovan, andra kolumner) | PL–L2, National League – domaren i matchrutan | 30 d | Verifierat 2026-10-18. De tre senaste avslutade säsongerna (`HISTORY.referees` i [config/competitions.js](config/competitions.js)), med domare, kort och frisparkar. Egen cache (`fdcouk_stats_*`), så att prognosmotorns underlag och efterhandstestets signatur inte ändras. Domare saknas 2012/13 i E1–EC, och frisparkar saknas i EC från 2016/17. Hämtade fram till 2026-10-20 alla säsonger sedan 2000/01 med halvtid, hörnor och publik för divisionsstatistiken, som togs bort ur Statistik 2026-10-19. |
| Europacuperna (för vila och form) | ESPN (`uefa.champions`, `uefa.europa`, `uefa.europa.conf`, kvalomgångarna i `*_qual` juli–augusti) | PL och cuperna – bara underlag | 3 h | Verifierat 2026-10-18: 234/224/366 matcher 2026/27 med kvalet, nio engelska lag (Brighton i Conference Leagues playoffomgång i augusti). Kopplas på ESPN:s lag-id, samma i alla ESPN:s turneringar. Ingen prognos för matcherna och inte med i prognosmotorns underlag. |
| Domare, kommande ligamatcher | football-data.co.uk (`fixtures.csv`, kolumnen `Referee`) | ligorna | 6 h | Verifierat 2026-10-18: namnet finns för alla 46 kommande matcher i filen (läggs ut med oddsen fre/tis). Domarens historik ur raden *Domare och kort* ovan. |
| Startelvor och frånvaro | 365Scores öppna webb-API (`webws.365scores.com/web/games/` och `/web/game/?gameId=`), hämtas **i webbläsaren** | alla sex | när matchrutan öppnas, varje minut medan matchen pågår | Verifierat 2026-10-19: ingen nyckel, `Access-Control-Allow-Origin: *`. Trolig elva (`NotConfirmed`) dagar före matchen i Premier League och Championship (inte i League One, League Two och EFL-cupen), bekräftad (`Confirmed`) ungefär en timme före avspark, efter matchen elvorna med mål, kort, byten och varje spelares betyg (`ranking`, 1–10; -1 eller inget = inget betyg). Spelarnas plats som linje och sida, så planen ritas utan positionstolkning. Vilka som saknas (skada med orsak och väntad återkomst, avstängning) även utanför Premier League. ESPN:s matchid finns inte där: matchen hittas på tävling (PL 7, CH 1, L1 2, L2 3, FA-cupen 8, EFL-cupen 9), avspark inom tre timmar och lagnamn – 505 av 505 matcher 1/9–8/11 2026 hittades (MK Dons heter så där). Samma källa som Gräver Gravs startelvor. Har 365Scores ingen elva visas den beräknade, och listan över vilka som saknas stryker spelare ur den (se [Den beräknade startelvan](#den-beräknade-startelvan)). Styr inte prognosen. |
| Spelarbetyg | 365Scores öppna webb-API (`/web/games/results/?competitions=<id>` bakåt via `paging.previousPage`, sedan `/web/game/?gameId=`) | ligorna | 6 h, bara nya matcher | Verifierat 2026-10-20: betyg 1–10 med en decimal (`ranking`) för alla i startelvan och för inhoppare som spelat en stund (några minuter ger -1, inget betyg). 365Scores räknar betyget ur spelarens statistik i matchen; metoden är odokumenterad. Snittet är 6,6–6,8 per liga och vart tionde betyg är över 7,5. Alla 70, 131 och 114 spelade matcher i PL, CH och L1 hade betyg; i League Two 66 av 126 – matcherna före 12 september saknar betyg och sparas som utan. Säsongens matcher listas ~20 per sida tills förra säsongens (`seasonNum`) börjar. Matchen hittas på avspark inom tre timmar och lagnamn som i matchrutan (alla 441 hittades). Samma spelare kan ha olika id i olika matcher, så spelarna hålls isär på namnet inom laget. Kopplas till ESPN-truppen inom laget på hela namnet, efternamn med förnamnets initial och sist tröjnummer med lika början på efternamnet (Yarmoliuk–Yarmolyuk, Sávio–Savinho), bara vid entydig träff. En match är ~135 kB men sparas kompakt (~70–140 kB per liga). Svarar även från GitHub Actions (verifierat 2026-10-20); svarar den inte visas topplistan Målvakter som förut. Styr inte prognosen. |
| Spelarbilder | 365Scores öppna webb-API (`/web/standings/?competitions=<id>` för lagen, `/web/squads/?competitors=<id,…>` för trupperna); bilden visas från `imagecache.365scores.com/…/v<imageVersion>/Athletes/<id>` i webbläsaren | ligorna | 24 h | Verifierat 2026-10-20: truppen per lag med id, namn, tröjnummer, födelsedatum, position och `imageVersion`; tränare och domare (`isStaff`) tas inte med. `imageVersion` 1 betyder att bild saknas (alla 13 med version 1 gav 404, alla 46 med högre version en bild). Alla 92 lag hittades på namnet som för betygen (Utd och Wed skrivs ut, så att Sheffieldlagen hålls isär); bild på 539 av 542 spelare i PL, 660 av 671 i CH, 649 av 651 i L1 och 540 av 663 i L2. Kopplas till ESPN-truppen inom laget på hela namnet, födelsedatum med ett gemensamt namn eller tröjnummer, efternamn med förnamnets initial och sist tröjnummer, bara vid entydig träff – 2 329 av 2 818 spelare i ESPN-trupperna fick bild; de övriga saknar bild hos 365Scores eller finns inte i deras trupp (oftast unga spelare och lån). Bilden står i spelarkortet med tröjnumret i hörnet; går den inte att ladda står tröjnumret som förut. ~25–30 kB per liga. Styr inte prognosen. |
| Lagsköldar | ESPN:s bildtjänst (`a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/<id>.png&h=96&w=96`, och `500-dark` för mörk botten) | alla sex | 7 d | Verifierat 2026-10-21: alla 92 ligalag har sköld, 67 av dem också en för mörk botten (Tottenhams tupp vit i stället för marinblå). Lagen tas ur spelprogrammen på ESPN:s lag-id, så att cupmotståndet kommer med; de flesta i National League har sköld, lag längre ner oftast inte (HTTP 404) och får en tom sköld. 96 × 96 px, ~1,5 MB för alla. Sparas i källcachen (`data/cache/skoldar/`) och läggs på sajten av bygget, i stället för att visas direkt från ESPN. Visas i Tabeller (den för mörk botten) och i matchbladets huvud (den vanliga – matchbladet är ljust). Styr inte prognosen. |
| Matchhändelser och lagstatistik | ESPN matchsammanfattning (`summary?event=<id>`, samma som oddsen), hämtas **i webbläsaren** | alla sex | när matchrutan öppnas för en påbörjad match, varje minut medan den pågår | Verifierat 2026-10-19: `Access-Control-Allow-Origin: *`. Mål med assist, självmål och straff, kort, byten, halvtid, lagstatistik (bollinnehav, skott, hörnor, passningar m.m.) och publik. Passningsandelen räknas ur antalen (ESPN avrundar den till en decimal). ~400 kB per match. Styr inte prognosen. |
| Stryktipset, Svenska folket, odds och favoritskap | Svenska Spels öppna API (`api.spela.svenskaspel.se/draw/1/stryktipset/draws` och `…/draws/<nr>`), hämtas av tjänsten profeterna-kupong åt webbläsaren | omgångens kupong | när omgången startas eller man trycker på *Hämta Stryktipset* | Verifierat 2026-10-20: ingen nyckel, men inget `Access-Control-Allow-Origin` för andra sajter – därför via tjänsten, som sparar svaret en minut. Omgångens tretton matcher med nummer, lag (korta namn: *QPR*, *Wolves*, *Bristol C*), avspark och `svenskaFolket` i hela procent. Svenska Spel räknar om fördelningen ungefär varje minut och fryser den vid spelstoppet; `/draws/<nr>` ger den också efteråt. Inget matchid som ESPN:s – matchen hittas på lagen (början av namnet efter några smeknamn) och avspark inom 36 timmar: 13 av 13 i vecka 43. `odds` och `favouriteOdds` (verifierat 2026-11-08 på en öppen omgång av Europatipset, samma gränssnitt) finns medan omgången är öppen men är borta när den är färdigspelad (omgång 4978), medan `svenskaFolket` och `startOdds` ligger kvar; tjänsten sparar därför sista läget (se [Inför uppgörelsen](#inför-uppgörelsen)). Styr inte prognosen. |
| Liveställning | ESPN scoreboard (`site.api.espn.com/…/<liga>/scoreboard?dates=YYYYMMDD`), hämtas **i webbläsaren** | kupongens matcher | 1 min medan en kupongmatch pågår | Verifierat 2026-10-18: svarar med `Access-Control-Allow-Origin: *`, så sidan kan hämta direkt. Samma matchid som spelprogrammet. Status, matchminut och ställning; används bara av kupongen, inte av prognosen eller bygget. |
| Höjdpunkter (sammandrag) | Viaplays öppna innehålls-API (`content.viaplay.se/pcdash-se/sport/fotboll/<tävling>`) | PL, CH, FA-cupen (sidorna för L1 och EFL-cupen svarar 404 sedan oktober 2026) | 30 min | Verifierat 2026-10-20: ingen nyckel, svarar även från USA (GitHub Actions). Viaplay har rättigheterna i Sverige och lägger ut sammandrag som spelas utloggad efter en kort reklamfilm. Listorna *Höjdpunkter* och *Utvalda klipp* per tävling, 40 klipp per sida; sammandragen känns igen på formatet (*Höjdpunkter från Premier League*, *Sporthöjdpunkter*). Premier Leagues femminutersklipp ligger ute en månad, övriga ett år; klipp som faller ur listorna behålls tills de går ut. Inget matchid – matchen hittas på tävling, båda lagen (alias eller ordens början, t.ex. *Bristol C*) och avspark 30 dagar före till 3 dagar efter att klippet lades ut: alla 212 sammandrag med två lag i titeln från säsongens start hittade exakt en match (170 matcher). League Two har inga. Länken går direkt till Viaplays spelare (`viaplay.se/player/default/sport/<guid>`, startar utan Börja titta) och öppnas i ett eget 16:9-fönster på datorn, i ny flik på telefonen – Viaplay tillåter inte att sidorna visas inuti andra sajter (`X-Frame-Options: DENY`, `frame-ancestors 'none'`), så klippen går inte att bädda in. Styr inte prognosen. |
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
- **Analyserna i förväg på datorn (2026-11-04, användarens beslut):** sajten ska bara visa
  färdiga texter, och allt AI-skrivande ska gå på användarens Claude-konto på en dator som står
  på dygnet runt, inte på en API-nyckel. Bara omgångens matcher skrivs, oftast Stryktipsets
  tretton, måndag 17, onsdag 16, fredag 16 och lördag 11. Claude får söka och läsa på nätet (`WebSearch`, `WebFetch`) men inget annat, eftersom
  underlaget i dag är just det Claude hittar. En påhittad tränare skriver analysen, medan Hasse
  Backe ligger kvar i tobaksaffären och låtsas analysera. DeepSeek är borta helt: omgångens namn
  och kupongernas kommentarer skrivs också på datorn.
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
  oraklet och Ikaros som polaroider bredvid omgången, och raden *Väntar på Tejder* i
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
- **Lägre bord i telefonen (2026-11-08, användarens önskemål):** på höjden tog bordet nästan halva
  skärmen. Nu tar det ungefär en tredjedel, och rummet och ett ritat tak får resten; alla i gänget och
  hela kupongen syns fortfarande utan att man drar. Se [I telefonen](#i-telefonen).
- **Tobaksaffären också i telefonen (2026-10-24, användarens önskemål):** rummet står nu i
  alla fönster utom de allra minsta, i telefonen också, och den vanliga förstasidan finns
  kvar som *Vanlig sida*. Scenen fyller höjden, och man ser sig omkring med fingret – scenen
  följer med och kameran vrids som med musen. På höjden är kupongen smal och hög som en
  riktig stryktipskupong, så att den går att fylla i; på bredden står orden bredvid kupongen
  i handen. Se [I telefonen](#i-telefonen).
- **Närbilder i tobaksaffären (2026-10-24, användarens önskemål):** uret, skårtavlan med
  Premier League, Omgångens orakel och VM 94-affischen (sedan 2026-11-03 också IFK-affischen,
  Nacionals förstasida och löpsedeln) går att klicka på, och kameran går
  fram till dem i stället för att sidan byts direkt. Skårtavlan och oraklet leder sedan vidare
  till Tabeller och Olympen. Se [Närbilderna](#närbilderna).
- **Säsongsprognosen tas bort (2026-10-20, användarens beslut):** vyn under Tabeller och
  simuleringen i bygget (`src/season.js`, `data/season.json`) försvinner, liksom
  programmet framåt och prognosdelen i lagkortet. Tabeller visar bara tabellen, med
  divisionerna som numrerade flikar (nivå 1–4); gamla länkar till `#…/prognos` hamnar på
  tabellen. Styrkan för alla lag räknas fortfarande – den är motståndet i lagstatistiken.
- **Skårtavlan blir Tipsligan (2026-11-03, användarens önskemål):** tavlan på väggen visar
  säsongens ställning mellan Laino, Tejder och Dogge i stället för Premier Leagues topp, och
  leder till Olympen i stället för Tabeller. Tavlan är lägre (tre rader i stället för nio),
  och närbilden går lika nära som förut. Tabellerna står kvar på tv:n. Se
  [Tobaksaffären](#tobaksaffären), *Föremålen*.
- **Tipsligan blir symmetrisk (2026-11-04, användarens önskemål):** rubriken fyller bredden, så
  att första och sista bokstaven står rakt över raderna, och placering, namn och poäng står i
  var sin spalt med lika långt till kanten på båda sidor. Tavlan är ett halvt spår högre åt
  båda håll, så att det är lika mycket filt över rubriken som under sista raden, och den står
  mitt emellan grannarna. Bokstäverna sitter mindre snett, och ramen är smalare och lika ljus
  runt om. Pokalhyllan följer med. Se [Tobaksaffären](#tobaksaffären), *Föremålen*.
- **Disken blir en bardisk (2026-11-03, användarens önskemål):** disken längs högra väggen
  var svår att förstå (grå skiva, mörk front). Nu är den en bardisk i mörkt trä med tjock
  rundad kant och fyllningar i ramar, i rummets egna toner och utan något extra att rita.
  Skivan sticker ut över fronten så att man har plats för benen, med konsoler under och
  krokar för jackor på fronten. Se [Tobaksaffären](#tobaksaffären).
- **Barstolar vid disken, och disken i 3D (2026-11-03, användarens önskemål):** den platta
  disken visade inte att det var tomt under skivan. Nu är disken byggd i three.js, med tre
  barstolar likadana som gängets inskjutna under kanten, och skuggorna under skivan visar
  håligheten. Den ritas en gång och kostar inget medan man ser sig omkring. Jackan och
  halsduken på krokarna togs bort samma dag – det blev för plottrigt. Se
  [Tobaksaffären](#tobaksaffären).
- **Gänget följer hur det går för kupongen (2026-11-03, användarens önskemål):** gänget
  har fler rörelser och gör dem efter hur det går för gängets kupong – glada när den går
  bättre än väntat eller blev vinst, nervösa när nästa fel tar vinsten, deppiga när den är
  död – med påhitt som händerna i nacken, skålar över bordet, naglarna, hakan i handen,
  armarna i kors och pannan i bordet, och tre sätt att reagera på ett mål. Se *Gängets humör
  följer kupongen* under [Tobaksaffären](#tobaksaffären).
- **Namnet i skrivstil på kupongen, och gänget gör tecken (2026-11-04, användarens önskemål):**
  ett klick på någon i gänget skriver hens namn för hand på kupongen på pulten, i hens egen
  handstil och bläck, i stället för porträtten, och hen gör ett tecken mot en: hang loose,
  tummen upp, peace, pistolfingrar, rock, honnör, knogarna, kockens kyss eller vinkning, ett
  nytt varje gång. Det ersätter att bara den egna figuren väljer. Se
  [Tobaksaffären](#tobaksaffären), *Klicka på någon i gänget*.
- **Gänget korsar sig ibland inför matcherna (2026-11-08, användarens önskemål):** från ett
  dygn före nästa avspark och oftare ju närmare den det är. Sju sätt, alltid med högerhanden:
  det vanliga med huvudet böjt och ögonen stängda, kvickt som på väg in på plan, med kyss och
  pekfingret mot himlen, tre gånger, med fel axel först, med tummen som i Sydamerika och med
  flaskan eller cigaretten i handen. Någon gång smittar det, och de andra hänger på. Inte på
  klick. Se [Tobaksaffären](#tobaksaffären), *Korstecknet*.
- **Allsången på fem sätt, och gänget sjunger för full hals (2026-11-08, användarens önskemål):**
  "Kan du göra olika sekvenser när vi t ex sjunger alla tillsammans … Och vi är engagerade."
  Förut gungade alla likadant med ölen i luften. Nu blir det ett av fem sätt: gungar och håller
  ut den sista tonen, en börjar och de andra faller in och det slutar med en skål, trummar i
  bordet allt fortare tills alla vrålar med armarna i luften, vågen runt bordet och sedan
  armarna i luften som vajar, och – när matcherna pågår – mot tv:n och pekar på den i takt.
  De sjunger med munnen öppen och ögonen hopknipna. Se [Tobaksaffären](#tobaksaffären),
  *Gänget gör saker tillsammans*.
- **Zen-stunder vid bordet (2026-11-09, användarens önskemål):** "Ge oss som sitter här tillfällen
  när vi bara befinner oss i nån form av zen-mode och chillar. Gör det på olika sätt så att det inte
  blir så många likadana sekvenser." Fem sätt: andas med slutna ögon och tummen mot pekfingret (och
  någon kikar), dagdrömmer med händerna i nacken (och någon slumrar till och vaknar med ett ryck),
  blåser rökringar som de andra följer med blicken (och DL petar sönder den sista), vaggar sakta med
  slutna ögon, och tittar ut i fjärran med en gemensam suck och en klunk var. Samma sätt kommer inte
  tillbaka förrän tre andra har varit. Se [Tobaksaffären](#tobaksaffären), *Gänget gör saker
  tillsammans*.
- **Gänget dansar italodisco när radion spelar (2026-11-08, användarens önskemål):** "Kan du ge dem
  fler dansmoves när man drar igång radion … Det får gärna ha med italiensk discodance att göra." Nio
  danser i tv-programmens anda runt 1980: härmleken, fingret, armrullen, synten, robotten, axlarna,
  armarna i kors, tv-studion och barstolssnurren. Två danser och en sång om vartannat, och skyltarna
  ligger på bordet så länge. Se [Tobaksaffären](#tobaksaffären), *Dansen*.
- **Grabbarna sjunger vid mål, och en radio på fönsterbänken (2026-11-08, användarens önskemål):**
  "Lägg till att de sjunger vid mål. Lägg till en radio … som man kan sätta på och att de då börjar
  sjunga." Efter ett mål som gick någons väg sjunger de när jublet har ebbat ut, och den som tappade
  raden sitter med armarna i kors. Radion är en liten bergsprängare på fönsterbänkens högra ände
  (vald bland fyra utseenden: transistorradio, bakelitradio, bergsprängare och fotbollsradio); ett
  klick sätter på den, och så länge den spelar sjunger de den ena sången efter den andra,
  lysdioderna studsar och noter stiger ur den. Se [Tobaksaffären](#tobaksaffären), *Sången efter ett
  mål* och *Radion*.
- **Bergsprängaren spelar italiensk disco (2026-11-08, användarens önskemål):** "Kan du köra nån
  italiensk discokanal? … Med italienska discohits." När radion sätts på spelar den en riktig
  webbradiokanal med italo disco, ur den fria katalogen radio-browser, och tar nästa om en inte går
  att spela. Se [Tobaksaffären](#tobaksaffären), *Radion*.
- **Kassettradio med FM och AM (2026-11-08, användarens önskemål):** "kan du ordna så att det här blir en
  riktig radio med olika radiokanaler", "en kassettradio – men där man kan ställa in FM- och AM-banden",
  "snyggt animerat/visualiserat" och "välja på olika kanaler som är med där och som man lyckas hitta". Bland
  annat italiensk disco, engelsk fotboll, P4 och Sport 890 på AM, och gubbarna dansar på musikkanalerna. Ett klick
  går fram till radion, och där ställer man in banden, och det man hittar skrivs på tejpen vid
  skalan. Se [Tobaksaffären](#tobaksaffären), *Radion*.
- **Spakar, POWER-knapp och fler stationer på radion (2026-11-08, användarens önskemål):** "lägga till
  radiokanaler", "göra radion bättre/snyggare", "FM- och AM-bandet med en spak istället för en ratt" och "en av-
  och på-knapp". Stationsratten och tangenterna är borta: en spak under skalan sitter på samma ställe som
  visaren, en liten spak slår över mellan FM och AM, och POWER sätter på och stänger av. 49 stationer i stället
  för 22. Se [Tobaksaffären](#tobaksaffären), *Radion*.
- **Alla stationer på tejpen, och frekvenserna på en lapp (2026-11-09, användarens önskemål):** "Kan du ordna
  radiokanalerna så att de står redan från början", "gärna sett vilken nivå de ska vara på (exvis 890 för Sport
  890 - annars blir det otydligt)" och "I värsta fall får du ha en handskriven lapp med information men absolut
  inte den lilla texten där nere". Alla 49 stationer står på tejpen från början (man hittar dem inte längre), och
  frekvenserna står på en handskriven lapp bredvid radion: FM på framsidan, AM på baksidan, och den vänds när
  bandspaken slås om. Ett klick på en rad går dit, och den som hörs är inringad. Orden under radion är borta.
  Frekvenserna fick inte plats på tejpen: där trängs AM-stationerna 610–999 (14 av 21) på en tredjedel av
  skalan, och namnen står redan långt från sina frekvenser. Se [Tobaksaffären](#tobaksaffären), *Radion*.
- **Lappen blir ett blad ur ett spiralblock på fönsterkarmen (2026-11-09, användarens önskemål):** "Kan du göra
  det här betydligt snyggare – inklusive var den är placerad. Kanske som nån post-it vid stereon eller nåt?" och
  "Gör det också tydligt att det är papperskvalitet". Av tre skisser på karmen bredvid radion (post-it, blad ur
  spiralblock, en bit av en cigarettlimpa) valdes spiralblocket: ett rivet blad i 3D med halva spiralhål, blå
  linjer, röd marginal, vikning, gulnad tejp och en skugga där det släpper från karmen, med FM i blått och AM i
  rött i var sin spalt. Det sitter där hela tiden och vänds inte längre. Se [Tobaksaffären](#tobaksaffären),
  *Radion*.
- **Inget sprak när AM-stationen hörs (2026-11-09, användarens önskemål):** "Jag vill inte att det ska spraka något
  när vi har fått in AM-radio-kanalerna. Dessförinnan får det spraka om du tänker att det är realistiskt." Det
  svaga suset och de enstaka knäpparna på AM-stationerna är borta, och en station som har hörts och hackar till blir
  tyst i stället för att spraka. Medan man letar och medan stationen laddas låter det som förut. Se
  [Tobaksaffären](#tobaksaffären), *Radion*.
- **Tio stationer, en tydligare tejp och ett mindre blad (2026-11-09, användarens önskemål):** "Gör radion
  snyggare/bättre och minska antalet radiostationer till de essentiella" och "Gör radiostationspappret
  snyggare/mer anpassat också. Just nu är det lite oklart hur det är uppsatt". 49 stationer blev tio: Italo Disco,
  P1, Guldkanalen 80-tal, Rockklassiker, P3, P4 Göteborg och Rix FM på FM, Sport 890, talkSPORT och Radio Caroline
  på AM. Tejpen har fått större handstil, och varje namn står över sin frekvens; ett tryck på ett namn går dit.
  Bladet är mindre och sitter fritt från antennen, med allt i en spalt: FM med sin rubrik överst, AM under, och
  frekvenserna rakt under varandra. Se [Tobaksaffären](#tobaksaffären), *Radion*.
- **Man väljer sig själv med ett klick på sin figur (2026-11-03, användarens önskemål):**
  ett klick på sin egen figur vid bordet gör en till den som fyller i kupongen – samma val
  som porträtten på kupongen – och figuren räcker upp handen med pennan, lyfter kupongen mot
  en och skriver sedan på den, medan de andra tittar på hen. Har man redan sagt vem man är
  väljer bara den egna figuren, så att ett tryck för att hälsa på någon annan aldrig gör en
  till hen (och ens utkast till hens); att byta gör man med porträtten på kupongen. Se
  [Tobaksaffären](#tobaksaffären), *Gänget är ni*.
- **Statistiken i tobaksaffären står på ett ställe var (2026-11-02, användarens önskemål):**
  samma siffror stod på tv:n, anslagstavlan och kortregistret. Nu står formen bara på
  anslagstavlan, tabellen och hemma/borta bara på tv:n, styrkan, motståndet och poängen mot
  oddsen bara på anslagstavlan, och lagkorten har det som inte står någon annanstans. Se
  [Vad som står var](#vad-som-står-var).
- **Inga länkar ut ur tobaksaffären (2026-11-03, användarens önskemål):** det enda som leder
  till den vanliga sajten är *Vanlig sida* i hörnet. Oraklet och skårtavlan har ingen länk
  under närbilden längre, och pokalhyllan, korktavlan, namnet på dörren och kvittot leder
  inte till Olympen, Om oss och Kupong utan till en närbild: pokalhyllan med hur många
  pokaler var och en har (tv:n framför tonar bort), dörren med Om oss-raderna under och
  korktavlan och kvittot så nära att de går att läsa. Kupongen som inte går att ta i handen
  visas nära på pulten, och guldorden *Statistik* och *Lagen* under anslagstavlan och
  kortregistret är borta. Se [Tobaksaffären](#tobaksaffären) och [Närbilderna](#närbilderna).
- **Spela hos Svenska Spel i tobaksaffären (2026-11-07, användarens beslut):** det enda
  undantaget från att inget leder ut ur rummet. Gängets kupong i handen har *Spela hos Svenska
  Spel* som guldord när den är sparad, eftersom det är hela uppgörelsens mål; länken öppnas i
  en ny flik, så att rummet står kvar. Samma dag lades de tre kupongerna på varandra i
  uppgörelsen, gängets penna blev svart och pennan ringar in de omtvistade matcherna. Se
  *Kupongen i handen* under [Tobaksaffären](#tobaksaffären).
- **Nästa kupong ur kupongstället (2026-11-09, användarens önskemål):** "Kan du ordna så att man
  ständigt - om man vill - har möjlighet att titta på nästa kupong genom att klicka på kupongstället
  och då ta upp kupongen till nästa omgång", "Använd kuponggrafiken som vi använder oss av på
  hemsidan" och "Där ska det såklart inte att gå att klicka fram matcherna". Ett klick på kupongstället
  (eller N) tar en blank kupong för veckans Stryktips i handen, samma kupong som på pulten men bara
  att titta på: inga kryss, ingen penna och inget matchblad. Kupongerna i stället ritas som sajtens
  kupong i den smala formen, och användaren bad om något skrivet på stället: en tryckt skylt *Nästa
  omgång* i bandets färg överst. Skylten är en del av stället och inga ord bredvid det, som beslutet
  nedan säger. Se *Nästa omgång ur kupongstället* under [Kupongen i handen](#kupongen-i-handen).
- **Löpsedeln är en löpsedel, och tidningen ligger på pulten (2026-11-10, användarens önskemål):** "När man zoomade
  in den här så fick man hela tidningen - så ska det inte vara. Då är det bättre om du visualiserar tidningen på ett
  lämpligt ställe på animationsbilden eller hos Hasse Backe (om det tar mycket grafik hos sämre datorer/mobiltelefoner
  att ha den på förstasidan). Jag tänker alltså att löpsedeln ska vara kvar men att det ska finnas en tidning på något
  lämpligt ställe". Ett klick på veckans löpsedel går nu bara fram till sedeln, som de andra. Tidningen ligger hopvikt
  på pulten till höger om kupongen, bakom högen med de inlämnade kupongerna, med löpsedelns förstasida: där syns den
  stort och tydligt, i datorn utan att man drar och i telefonen när man drar åt höger, och den motsvarar Tipsguiden på
  andra sidan kupongen. Den är ritad som Tipsguiden, i sidan och inte i 3D: papperet ritas en gång och flyttas sedan
  bara med rummet, så den kostar inte mer i svaga telefoner än Tipsguiden. Bardisken (för liten, man ser den snett
  uppifrån) och Hasses disk (i telefonen täcker samtalet den) var de andra ställena. Fläkten, fikat och askkoppen står till höger om högen
  och tidningen. Se [Tidningen](#tidningen).
- **Ett nummer av Tipsguiden att ta upp (2026-11-09, användarens önskemål):** "Jag vill att det ska ligga nåt nr av
  tipsguiden på animationssidan nånstans som man kan plocka upp o läsa". Tidningen fanns då bara när man
  klickade på löpsedeln i fönstret, och mellan omgångarna inte alls. Nu ligger Tipsguiden, tidningens tipsbilaga, på pulten
  i tobaksaffären, och ett klick tar upp den. Den har ingen text bredvid sig (beslutet nedan): namnet står på tidningen.
  Hasse Backes rum är oförändrat. Se *Tipsguiden* under [Tidningen](#tidningen).
- **Inga förklarande ord i tobaksaffären (2026-11-09, användarens beslut):** rummet ska vara
  intuitivt. Guldordet bredvid kupongen på pulten (*Läs protokollet*, *Fyll i resten*, *Följ
  kupongen*) är borta: kupongen och protokollet tas fram med ett klick på dem eller K. Kvar
  bredvid kupongen är bara pingklockan till uppgörelsen, som är en sak i rummet och inte en
  text. Inga nya ord eller länkar läggs bredvid sakerna för att säga vad de gör. Se
  [Tobaksaffären](#tobaksaffären).
- **Veckans löpsedel ser äkta ut, och barstolarna står framför den (2026-11-09, användarens
  önskemål):** "snygga till den här löpsedeln så att den ser mer äkta ut". Den liknade inte den man
  ser nära, och den låg över barstolen och bardiskens ände. Papperet är sedan dagen innan
  tidningspapper (se *Löpsedeln på riktigt tidningspapper* nedan). Nu går rubriken från kant till kant och står mitt
  på papperet, som på en riktig löpsedel: raderna dras ut på bredden när de har fått krympa för att
  rymmas på höjden, långa rader klipps inte längre i kanten, och prickarna över Å, Ä och Ö syns i
  vinjetten. På väggen sitter den fritt mellan fönsterbänken, bardisken och den innersta barstolen,
  som är inskjuten under skivan, så att stolen inte skymmer något av den nära (72 %, nästan rak). Se
  [Tobaksaffären](#tobaksaffären), *Affischerna*.
- **Uppgörelsen visar det vi är oeniga om (2026-11-07, användarens önskemål):** "Här är det ju
  meningen att vi ska diskutera de matcher som vi är oense om. Det ser ut som att du redan har
  ordnat med allt." Pennan ringade bara in matcher där vi inte hade något tecken gemensamt, och med
  regeln (4 spikar, 5 halvgarderingar, 4 helgarderingar) har nästan varje match något tecken som
  alla har med – i Kupong 3 alla tretton. Inget var inringat, och förslaget stod ifyllt överallt,
  också där det gjorde Fulham–Newcastle till en spik fast två av tre hade helgarderat. Nu är en
  match omtvistad också när förslaget lämnar ett tecken som någon har med utanför (i Kupong 3 sex
  matcher), gängets kryss där är bleka tills matchen är klubbad, och i handen träder resten av
  kupongen tillbaka tills alla omtvistade är klubbade. Samma dag likadant på papperet under Kupong
  ("Gör samma sak på papperet under Kupong"): samma omtvistade matcher, inringade och med bleka
  kryss, och *Samma grund, olika säkerhet* delad i två – där förslaget lämnar någons tecken
  utanför, och *Alla får med sitt*. Det klubbade delas mellan papperet och rummet, och en klubbad
  match står kvar mörk, så att den går att kryssa färdigt. Samma dag också förstasidans ruta ("Gör
  samma sak på förstasidans ruta"): under *Alla inne* de omtvistade matcherna med inringade nummer,
  bockarna och var och ens tecken i sin färg. Se *Kupongen i handen*, *Pennan visar vägen*, och
  [Inför uppgörelsen](#inför-uppgörelsen), punkt 1 och 4.
- **Det syns vem som står till svars (2026-11-09, användarens önskemål):** "Organisera det vi ska
  diskutera och det som nån ska stå till svars för på ett läckert sätt." Högarna och lappen tar en
  match i taget, men det syns inte på ett ställe vem som ska svara för vad. En tabell med en rad per
  match provades men blev drygt 1 100 punkter lång i telefonen, och användaren valde att behålla
  högarna och lappen och lägga till raden *Till svars* och ringarna. Se *Till svars* under
  [Inför uppgörelsen](#inför-uppgörelsen), punkt 4.
- **Expressens löpsedel från VM 94 (2026-11-03, användarens önskemål):** VM 94-affischen med
  fotot från hemkomsten är utbytt mot en mer verklighetstrogen löpsedel, lite solblekt och
  sliten: *JAAAAAAAA! BRONS!* med Tomas foto från Rose Bowl. Den sitter på skivan som de andra.
  Se [Tobaksaffären](#tobaksaffären), *Affischerna*.
- **Skivan med löpsedlarna (2026-11-03, användarens beslut):** de fasta löpsedlarna satt
  huller om buller: fyra format, tejp och nålar, tre på glaset och en på väggen. Det ska synas
  att en person har hand om det, "manligt" och inte så mycket estetik. Av fyra skisser (skena
  med klämmor, skiva, låst anslagsskåp, ramar) valde användaren skivan: plywood i två kedjor i
  högra delen av fönstret, IFK 1982, Nacional 1988, VM 94 och Chelsea 2021 i årsordning, lika
  stora, med skruv i hörnen, Dymo-remsor, blyertsmåtten kvar och vattenpasset ovanpå. Det får
  inte tynga grafiken. Veckans löpsedel är kvar för hand, men i telefonen på väggen, där
  Chelsea satt. Se [Tobaksaffären](#tobaksaffären), *Affischerna*.
- **Chelseas löpsedel på väggen (2026-11-03, användarens önskemål):** till höger om
  skyltfönstret, under oraklet, sitter The Sun on Sundays löpsedel från dagen efter Chelseas
  seger i Champions League 2021, med Tomas foto av laget med pokalen. Den sitter med två
  häftstift i furun och har gulnat. Se [Tobaksaffären](#tobaksaffären), *Affischerna*.
- **Nacionals förstasida på glaset (2026-11-03, användarens önskemål):** till höger i
  skyltfönstret sitter El Días förstasida dagen efter Nacionals seger i Intercontinental Cup
  1988 (DL:s lag), med Tomas foto av laget med pokalerna. Se [Tobaksaffären](#tobaksaffären),
  *Affischerna*.
- **Fler affischer på glaset (2026-11-03, användarens önskemål):** bredvid VM 94-affischen
  sitter en affisch från IFK Göteborgs seger i UEFA-cupen 1982, och varje vecka en löpsedel
  med det mest dramatiska ur förra omgången eller inför nästa. IFK-affischen var först ritad
  (pokalen i SVG), blev samma dag en plansch med Tomas foto från segern i Hamburg och till
  sist Göteborgs-Postens löpsedel dagen efter, med fotot. Se [Tobaksaffären](#tobaksaffären),
  *Affischerna*.
- **Hasse Backe i en egen bild (2026-11-04, användarens önskemål):** när kameran svängde till honom i
  rummets 3D-värld syntes två världar i samma bild – ett platt rum som en kuliss bredvid en fotografisk man,
  med pulten på högkant och skarven vid hans handled. Nu slår kameran åt vänster med vågrät
  rörelseoskärpa, och hans bild är en egen filmbild: han sitter bakom bardisken mitt emot väggen med
  anslagstavlan, kameran ser snett längs baren, och disken, kaffet och notan hör till hans värld. Kaffet,
  notan och handen ligger kvar på pulten som en ledtråd. Förslaget att han i stället skulle sitta i tv:n som
  expert sades nej till. Se [Hasse Backe](#hasse-backe), *Bilden* och *Panoreringen*.
- **Rummet och Hasse Backe är samma sida (2026-11-09, användarens önskemål):** "få det bättre o tydligare att
  vanliga animationssidan och den med Hasse Backe hör ihop". Namnet och foten står kvar när kameran slår och
  hos honom, neonskyltens sken faller in från affären till höger, och man vänder sig dit och tillbaka med
  samma drag som man ser sig omkring med (eller pilarna). Se [Hasse Backe](#hasse-backe), *Samma sida*.
- **Svaren till Hasse Backe i kupongens tryck (2026-11-04, användarens önskemål):** guldpillren
  och de understrukna länkarna i samtalet var webbknappar som inte hörde hemma i tobaksaffären.
  Svaren är nu lappar i tipskupongens terrakotta och krämvita papper, och det som går härifrån
  står med små spärrade versaler och en pil. Se [Hasse Backe](#hasse-backe), *Samtalet*.
- **Hasse Backe säger resultatet (2026-11-04, användarens önskemål):** efter sin text säger han
  vad matchen slutar, det troligaste resultatet i modellens prognos bland tecknen han har ringat
  in, och resultatet står bredvid tecknen på matchens rad. Se [Hasse Backe](#hasse-backe),
  *Samtalet*. Sedan 2026-11-07 bestämmer han tecknen och resultatet själv (nästa punkt).
- **Hasse Backe vassare, och emot oddsen när han har skäl (2026-11-07, användarens önskemål):**
  "han ska uttrycka sig vassare – alltså inte språkligt precist utan resultatmässigt och hitta
  argument för det", och han får gå emot oddsen "om han finner argument för det", men "efter en
  egen bra bedömning" och inte alltid. Förut upprepade han tipsets tecken och sa det troligaste
  resultatet i modellen, nästan alltid 1–0, 1–1 eller 2–1. Nu väljer han tecken och resultat när
  hans text skrivs, med spelbolagens odds, sajtens prognos och kollegans tecken framför sig. Se
  [Hasse Backe](#hasse-backe), *Rösten*.
- **Hasse Backe med Tomas röst, och tyst tills man slår på ljudet (2026-11-04, användarens
  beslut):** Hasse Backe talar med Tomas egen röst, klonad med Chatterbox Multilingual på
  iMacen, i stället för Azures Mattias. Ett launchd-jobb läser upp allt han säger, ett
  trettiotal meningar per körning, och lägger ljudet i grenen `rost`, som skrivs över varje
  gång så att main inte växer. Bygget tar det egna ljudet där det finns och Azure där det
  saknas, så han blir aldrig tyst. Ljudet är av tills besökaren slår på det. Se
  [Hasse Backe](#hasse-backe), *Ljudet*.
- **Hasse Backe slår domen i disken på fler sätt, och det hörs (2026-11-05, användarens
  önskemål):** han är en bestämd och tydlig herre, så domen slås i disken på ett av fem sätt
  (skrattet, näven, tre slag, båda händerna, fingret och handflatan), och vid ett bestämt ord
  mitt i talet slår han ibland handflatan i disken. Varje slag dunkar i träet och koppen studsar
  och klirrar på fatet, när ljudet är på. Han har också fler sätt att dricka kaffe och röka
  cigarr: han blåser på kaffet, tittar ned i koppen, tar ett kort bloss med röken ur mungipan,
  blåser rökringar och knackar av askan och blåser ut röken genom näsan. Se
  [Hasse Backe](#hasse-backe), *Slaget*, *Kaffet* och *Cigarren*.
- **Hasse Backe dricker kaffe på sex sätt, och njuter (2026-11-05, användarens önskemål):** kaffet
  syntes nästan aldrig och såg skevt ut: koppen stod nästan upprätt framför hakan och handen satt
  inte i örat. Nu lutas koppen mot underläppen och handen följer örat, och han dricker på sex sätt,
  överdrivet och med njutning: klunken med mmm, blåsa och ah, dricka ur och titta i den tomma koppen,
  doften, skål och lillfingret ut. Medan han väntar på att man ska välja tar han kaffet och cigarren
  varannan gång; förut tog han då bara cigarren, så kaffet kom bara medan han låtsades läsa på. Se
  [Hasse Backe](#hasse-backe), *Kaffet*.
- **Hasse Backe fyller i din kupong (2026-11-05, användarens önskemål):** han får samma kupong som
  ligger på pulten, med samma grafik och det du redan har fyllt i, och fyller i den med pennan: lite slarvigt,
  men självklart. Du väljer 1, X eller 2, stort, direkt eller efter analysen, och efter en analys tar han
  den själv om du inte säger *Låt bli*. Se [Hasse Backe](#hasse-backe), *Din kupong*. 2026-11-06 ersatte den
  här versionen en annan som hade lagts ut samma dag från en annan session (9c30df2, där han efter analysen
  frågade om han skulle kryssa i sina tecken och man svarade med knappar). Användaren bad om den bästa av
  de två, och den här ligger närmast önskemålet: stort 1 X 2 som man väljer fritt, och han börjar själv. Därifrån finns frågan
  *Vems kupong ska jag fylla i?* kvar. Samma dag ville användaren kunna fylla i matcher man redan har frågat om
  och välja tecken han inte håller med om: då säger han emot men kryssar ändå. Sedan 2026-11-07 tar han
  inte kupongen själv efter analysen, utan föreslår det (se nedan).
- **Hasse Backe ändrar din inlämnade kupong (2026-11-07, användarens önskemål):** "Jag har fortfarande
  inte möjlighet att fylla i kupongen utefter det här", om hans *Etta, kryss* på en match där kupongen hade
  helgardering. Kupongen var inlämnad, och då visade han inga rutor alls. Nu står 1 X 2 också under en
  inlämnad kupong så länge den går att ändra, och han lämnar in ändringen direkt när den följer gängets regel.
  Gör den inte det (en helgardering som blir 1X ger sex halvgarderingar) säger han vad som fattas och väntar,
  och den väntande ändringen står på kupongen när man tar den ur högen, med *Lämna in ändringen* tänd. Se
  [Hasse Backe](#hasse-backe), *Din kupong*.
- **Hasse Backe föreslår att fylla i kupongen, och du väljer (2026-11-07, användarens önskemål):** "Jag gillar
  inte att Hasse Backe själv fyller i sin egna rekommendation direkt efter sin analys – han kan däremot
  rekommendera att göra det så får man välja om man vill det". Förut tog han kupongen och kryssade sina tecken
  så fort han hade sagt sitt, om man inte hann trycka på *Låt bli*. Nu frågar han (*Så ska det stå på din
  kupong. Ska jag fylla i den?*), hans tecken lyser i guld i rutorna 1 X 2, och man svarar med *Fyll i den*,
  ett eget tecken eller *Alla matcher*. *Låt bli* behövs inte längre och är borttagen. Se
  [Hasse Backe](#hasse-backe), *Din kupong*.
- **Hasse Backe njuter av cigarren på elva sätt (2026-11-05, användarens önskemål):** cigarren såg
  skev ut: ansiktet förvreds när han vred huvudet mot askkoppen, handen höll cigarren som en stång,
  och röken lade sig som en fläck över ögat. Nu tittar han mest med ögonen, håller den löst i
  fingertopparna, och röken far förbi ansiktet. Han njuter också ordentligt och på fler sätt: ett
  långt bloss med *ah*, lutar sig bakåt och blundar, biter om den i mungipan med händerna på disken,
  beundrar den, puffar, visar den mot en och smakar på röken. Se [Hasse Backe](#hasse-backe),
  *Cigarren*.
- **Hasse Backe gör fler saker medan han väntar (2026-11-06, användarens önskemål):** i vilan
  upprepades allt: han blinkade exakt var 4,3:e sekund, huvudet och bröstet rörde sig i jämna vågor, och
  mellan kaffet och cigarren trummade han bara, likadant varje gång. Nu går blinkningarna, blicken,
  huvudet och andningen aldrig i takt, fingrarna trummar på fyra sätt med båda händerna, och han gör
  nio andra småsaker som lottas: tittar mot gänget och längs baren, på notan och kaffet, nickar för sig
  själv, suckar, sträcker på nacken, höjer ett ögonbryn och skrockar. Se [Hasse Backe](#hasse-backe),
  *Vilan*.
- **Hasse Backe snyggare och mindre buggig (2026-11-06, användarens önskemål):** armarna såg ut som
  uppblåsta korvar, med en ballong till armbåge när han böjde dem; händerna var för små och orangea
  bredvid ansiktet, med grå smuts mellan fingrarna och naglar som laxrosa klistermärken; handen gick rakt
  genom koppen när han tog den och ned genom disken när han höll den; manschetten var ett långt vitt rör;
  tänderna i skrattet var ett band med streck, som en linjal; och han såg ut att mumla när han pratade.
  Nu smalnar ärmen av mot ärmslutet, armbågen viker sig i veck på insidan, manschetten sticker fram en
  bit ur ärmen, händerna har en vuxen mans storlek och ansiktets hudton, handen går över koppen, tänderna
  står en och en och munnen rör sig som när man pratar. Se [Hasse Backe](#hasse-backe), *Armarna och
  händerna*.
- **Statistik som i tobaksaffären (2026-11-05, användarens önskemål):** statistiken på den
  vanliga sajten ska stämma med den i tobaksaffären – samma tal under samma namn och samma
  uppdelning: det som jämför lagen står som på anslagstavlan (topplistorna under Lagen), det
  om ett lag som i kortregistret (lagkortet). Skadelistan står redan i lagkortet (Frånvaro) och
  vilan hör till omgången, så de blir inga topplistor. Formen räknas ur `data/matches.json`,
  som på tavlan innan den tas fram, alltså utan Europacuperna, som bara finns i matchens fil.
  Se Status.
- **Kaffet i rummet som i baren (2026-11-05, användarens önskemål):** handen låg under fatet i
  rummet, koppen var en platt teckning sedd från sidan medan papperen bredvid ses uppifrån, och notan
  låg bredvid i stället för under fatet som i baren. Nu är koppen bardiskens kopp i samma ljus,
  ritad i handens duk, fatet står på notan och handen ligger bredvid, och bardisken har pultens
  bruna. Se [Hasse Backe](#hasse-backe), *Kaffet i rummet*.
- **Rummet och baren är samma ställe (2026-11-06, användarens önskemål):** handen låg vid koppen på
  pulten men en bit från den i baren, fingrarna gick ned i bardisken, handen på pulten låg tryckt mot
  bakkanten, och baren var mörk som en kväll fast det var dag i rummet. Nu ligger den vänstra handen
  tätt intill fatet på båda ställena, fingrarna lägger sig på disken, och baren har rummets tid på
  dygnet: lysröret tänt som i rummet (sedan 2026-11-09 dämpat från 23 till midnatt och tänt från sex till sju) och dagsljuset efter klockan och vädret. Se
  [Hasse Backe](#hasse-backe), *Bilden*, *Ljuset* och *Kaffet i rummet*.
- **Hasse Backe vid pultens hörn (2026-11-07, användarens önskemål):** "ser det här och det här ut som
  samma bänk?", "Det ser ju ut som helt olika vinklar" och "Hasse ska ju sitta vid ett hörn". I baren
  satt han bakom en blank, mörk bardisk som sågs i låg vinkel på 2,3 meters håll, medan pulten i
  rummet är matt brunt trä med lister i aluminium som ses snett uppifrån. Nu sitter han vid pultens
  hörn: pulten går fram längs ens högra sida och viker av förbi honom, i samma trä och med samma
  lister, och kameran står närmare och högre, så att koppen, notan och handen ses uppifrån som i
  rummet. Väggen bakom honom är ombakad för den nya kameran. Se [Hasse Backe](#hasse-backe), *Bilden*.
- **Hasse Backe sitter bekvämt (2026-11-07, användarens önskemål):** "Hasse ser lite obekväm ut där han
  sitter med händerna", och de stämde inte med den lugna handen på pulten i rummet. Den högra handen
  pekade tvärs över mot den vänstras handled och var vinklad mot tummen, den vänstra var vriden nästan
  50° ut mot koppen, och armbågarna stod ut. Nu ligger armbågarna nästan rakt framför axlarna och
  underarmarna i ett lugnt V, med händerna i deras förlängning, fingrarna lätt krökta och en bit
  emellan; askkoppen står lite längre till vänster, så att cigarren går fri från handen. Se
  [Hasse Backe](#hasse-backe), *Bilden*.
- **Samma hand, kaffe och nota i rummet och i baren (2026-11-07, användarens önskemål):** "Ser det ut
  som att de här tillhör samma? Kolla handen, kvittot och kaffet." I rummet låg handen platt med raka,
  utspärrade fingrar och pekade åt höger mot fatet, sedd 52° uppifrån och koppen 44°, medan allt i
  baren ses ungefär 31° uppifrån och handen vilar avslappnad; i baren täckte fatet namnet på notan. Nu
  ligger handen i rummet som hans vänstra hand i vila, pekar snett ned mot en och ses som koppen 33°
  uppifrån, och i baren står koppen lite längre bak med fatet på notans övre vänstra hörn som i rummet,
  så att Hasse B. syns. Fingertopparna på hans vänstra hand skars av vid dukens underkant; nu ryms de.
  Se [Hasse Backe](#hasse-backe), *Kaffet i rummet*.
- **Samma papper på notan i rummet och i baren (2026-11-09, användarens önskemål):** "Kvittona ser lite
  olika ut – pappret bland annat som här är lite mer rosa." I baren tog papperet neonskyltens röda färg,
  och raderna från Kaffe och nedåt låg 17 px lägre än i rummet, utan pappersstrukturen. Nu ritas den efter
  notan i rummet, med baslinjerna mätta där, och får bara ljusets styrka, inte dess färg. Se
  [Hasse Backe](#hasse-backe).
- **Vitt porslin på pulten och i baren (2026-11-09, användarens önskemål):** "Gör samma sak med fatet och
  koppen också." Koppen och fatet är samma modell i rummet och i baren, men tog barens ljus med
  neonskyltens röda och blev persikofärgade bredvid den vita notan. Nu får de, som notan, bara ljusets
  styrka. (I rummet ser de gråare ut än i baren: det är rummets vinjett, som mörkar hörnet med notan också.)
  Askkoppen är som förut. Se [Hasse Backe](#hasse-backe), *Kaffet i rummet*.
- **Askkoppen vit, och det vita skiftar med dagsljuset (2026-11-09, användarens önskemål):** "Gör askkoppen
  vit också." och "Vet inte om de skiftar i färg över dygnet – med tanke på att rummets belysning skiftar
  med uteförhållandena." Askkoppen är vit som koppen. Notan, koppen, fatet och askkoppen tog bara ljusets
  styrka och stod därför lika vita i solnedgången som mitt på dagen. Nu tar de dagsljusets färg men inte
  neonens och lampornas, och notan i rummet, som förut alltid var lika krämvit, tonas i koppens ljus. Det vita
  är då likadant i rummet och i baren: svalt vitt mitt på dagen, varmare i den gyllene timmen, grått när det
  är mulet. På kvällen och natten mörknar rummet mer än baren, som förut. Se [Hasse Backe](#hasse-backe),
  *Kaffet i rummet*.
- **Cigarren i samma ljus (2026-11-09, användarens önskemål):** "Gör cigarren likadan också." Cigarren i
  Hasses askkopp tar, som notan och porslinet, bara ljusets styrka och dagsljusets färg, och kantljuset
  bakifrån bara som styrka, så att täckbladet inte får neonskyltens röda. Glöden är som förut. Se
  [Hasse Backe](#hasse-backe).
- **Hasse tar cigarren bekvämt (2026-11-09, användarens önskemål):** "Kan du förbättra hur Hasse tar upp
  cigarren - byt plats på askkoppen o cigarren om det behövs för att det ska se mer bekvämt o avslappnat
  ut" Han sträckte ut armen åt sidan, vred handen 60° utåt från vilan och dök ned på cigarren ovanifrån med
  handleden högt och raka, utspärrade fingrar, efter en hög båge. Nu står askkoppen en bit framför handen
  och cigarren ligger vänd in mot honom, tvärs över fingrarna när han sträcker fram handen, så att han når
  den med underarmen rakt fram från armbågen. Handen går lågt över disken, nyper cigarren med flack hand och
  rak handled, och pek- och långfingret ligger lite samlade. Handen går fri från cigarren när han slår i
  disken, och askkoppen syns hel i telefonen. Se [Hasse Backe](#hasse-backe), *Cigarren*.
- **Hasse tänder cigarren när den har slocknat (2026-11-10, användarens önskemål):** "Kan du göra olika
  sekvenser när cigarren är otänd och Hasse tar upp den, tänder den o njuter på olika sätt. Det kan hända då
  o då i logiska sekvenser med annat". Cigarren brann alltid. Nu slocknar den om han låter den ligga några
  minuter (glöden och röken tonar ut), och nästa gång han tar den tänder han den i stället för att röka, på
  ett av fyra sätt: en tändsticka ur ett ställ i samma porslin som askkoppen, en kaxig sticka mot disken som
  inte tar, tändaren som strejkar en gång och tändaren i en enda rörelse, och varje gång njuter han på sitt
  sätt efteråt. Stickorna blir kvar i askkoppen, och är stället tomt tar han tändaren. Den slocknade cigarren
  han låtsas röka (`slocknad`) kommer bara när den verkligen har slocknat, och har han just sagt sitt om en
  match tänder han den gärna. Lågan lyser upp handen och ansiktet. Se [Hasse Backe](#hasse-backe), *Elden*.
- **Hasse Backe spanar på din kupong (2026-11-08, användarens val):** ibland går blicken ned på kupongen,
  med sex olika miner, och när han har sagt vad han tycker om den passar minen orden. Se
  [Hasse Backe](#hasse-backe), *Vilan*.
- **De gamla protokollen på korktavlan (2026-11-09, användarens önskemål):** "Man vill här kunna klicka in sig på de
  tidigare bettingarna - och hur det gick för alla. Alltså tidigare protokoll." Varje färdigspelad kupong på korktavlan
  tas nära ned från nålen med ett klick och blir omgångens protokoll, samma blad som på pulten med allas tecken, facit,
  rätt och poäng. Samma dag, på frågan om de äldre kupongerna som inte ryms på tavlan: "Ja, gör så att man kan bläddra med
  pilarna" – ←/→, pilarna under bladet eller ett svep i sidled går till omgången före och efter, genom hela säsongen.
  Se *Protokollen på korktavlan* under [Sammanställningen efter omgången](#sammanställningen-efter-omgången).
- **Protokollet som ett äkta papper (2026-11-09, användarens önskemål):** "Jag tycker inte att protokoll-pappret ser
  trovärdigt ut. Gör det snyggare och som att det ser ut som ett äkta papper. Det går gärna likna de vanliga kupongerna".
  Bladet är nu en blankett som kupongen (se *Sammanställningen efter omgången*): de platta gröna rutorna är en grön
  märkpenna, tecknen står kvar i var och ens bläck i stället för att blekna till grått när de var fel, och handstilen står
  aldrig exakt likadant två gånger. Det som stod kvar sedan förut: allas tecken, facit, ringen kring vinnaren och att bladet
  slutar med raden Poäng.
- **Protokollet tydligare, och Hasse förklarar poängen (2026-11-09, användarens önskemål):** "Går det att göra
  protokollet tydligare, mer överblickbart och snyggare. Lägg till en "Hasse-förklaring" av poängen som du har där längst
  ner. Alltså att man kan ropa till honom - precis som anslagstavlan", och "det ska vara tydligt hur många rätt det var
  totalt på protokollet - så att man ser det även när man inte zoomar in på det - och då tänker jag för alla tillsammans".
  Rätt står nu överst, direkt under porträtten, stort med Hasses röda rättningspenna och kupongens (allas) störst, eftersom
  det är bladets nederkant som hamnar utanför bilden på pulten. Bladet ligger större på pulten (0,76 i stället för 0,53),
  så att siffrorna går att läsa på håll, varannan rad är tonad hela vägen över och kupongens spalt har en linje mot de
  andras. Under bladet står *Hasse, hur räknas poängen?*, och han svarar från baren som vid anslagstavlan; det som båda
  använder ligger i [public/rum-hasse-svar.js](public/rum-hasse-svar.js). Se *Sammanställningen efter omgången*.
- **Kupongens rätt som omgångens betyg i protokollet (2026-11-09, användarens önskemål):** "Går det att göra totalpoängen
  för oss alla - vår gemensamma rad - ännu tydligare? Kanske ringa in nån siffra eller annat. Jag är öppen för förslag - men
  gör det tydligare!" Kupongens rätt skrivs nu som kupongens betyg på papperet under Kupong: *10/13* med rödpennan, inringat
  och lite snett, och var och ens rätt står i det egna bläcket i stället för i rött, så att betyget är det enda röda på raden
  och syns först, också på håll på pulten. Se *Sammanställningen efter omgången*.
- **Hasse dömer gänget i baren, och protokollet står utan omdömen (2026-11-08, användarens val):**
  "protokollet ska ligga här utan att Hasse Backe kommenterar något speciellt - i hans vy ska han däremot göra det", "Jag
  vill inte att han kommenterar sig själv här" och "Det här gör han tills att nästa stryktipsmatcher är uppe". Användaren
  valde bland renderade alternativ: protokollet med bara namnteckningen (inte en stämpel eller fakta i tryck), och i baren
  att man väljer vem han dömer (inte domarna uppradade, eller hans eget exemplar av protokollet på disken). Domarna gäller
  så länge protokollet ligger på pulten. Senare samma dag togs också namnteckningen bort på användarens önskemål, så
  bladet slutar med raden Poäng. Se [Hasse Backe](#hasse-backe), *Domarna efter omgången*.
- **Gänget utan siffror och lappen under domen (2026-11-09, användarens önskemål):** "Kan du göra om det här snyggare
  och ta bort länken 'Matcherna' som är meningslös. Utveckla gärna kring de olika personerna sen. Tycker inte att du behöver
  ha poäng och antal rätt på den här sidan. Det tycker jag att du kan visualisera på nästa i så fall. Visualisera det och
  annan relevant bettinginformation för den individen!" Listan hos Hasse är nu stora porträtt sida vid sida i gängets
  ordning (inte bäst först, så att var och en står på samma plats varje omgång och listan inte avslöjar något), och under
  domen ligger en lapp ur protokollet med kupongen rad för rad och siffrorna. Se [Hasse Backe](#hasse-backe), *Domarna
  efter omgången*.
- **Bara protokollet på pulten, och nästa kupong måndag kl. 16 (2026-11-08, användarens önskemål):** "Ta bort
  kupong 3 där nu när allt är klart - ha bara protokollet", och "Den nya kupongen kan dyka upp från och med
  måndagen efter tippningsdagen", "Måndag kl 16". Kupongen låg kvar under protokollet och Stryktipset tog över redan
  när Svenska Spel öppnade det, senast måndag kl. 07. Nu ritas bara bladet på pulten (`couponHtml`), och
  K och klick som tog kupongen i handen tar fram protokollet (`openCoupon`). Tjänsten väntar med veckans Stryktips
  till måndagen efter omgången kl. 16 (`nyKupongFran`), så att hela sajten byter samtidigt. Bara efter en omgång som slutar
  högst tre dygn före den måndagen: en omgång mitt i veckan stoppar inte helgens Stryktips. Eftersom en analystid bara gäller
  omgångar som fanns när klockan slog flyttades måndagens analyser från 08 till 17. Högen med allas inlämnade kuponger
  ligger kvar, och matcher som väljs för hand startar som förut direkt. Dolda resultat ger inget protokoll, och då ligger
  kupongen kvar som förut.
- **Hasse Backe sitter nära pulten och bekvämt (2026-11-08, användarens önskemål):** i baren har han armen
  alldeles vid pultens kant, men i rummet "ser han ut att vara väldigt långt ifrån pulten", och händerna
  och armen in vid koppen såg "ganska obekväma" ut. I rummet går armen nu över pultens bakre kant, som i
  baren, och i baren vilar underarmarna snett in mot mitten med den vänstra handen över den högra, fritt
  från fatet. Slagen i disken landar en bit åt sidan. Se [Hasse Backe](#hasse-backe), *Bilden* och
  *Kaffet i rummet*.
- **Hasses händer avslappnade och som fotot (2026-11-08, användarens val):** "Det viktiga är att de är
  bekväma o passar med den vanliga animationsbilden." Användaren valde bland renderade varianter
  (hållning B och justering 1–4): händerna vilar med handlederna lite upp, fingrarna böjda ned mot
  disken och tummarna intill, så att den vänstra tummen inte längre skärs av av disken; en tät skugga
  under händerna där de ligger an; händerna ungefär 12 % mindre (16 cm i stället för 18); och huden
  matt och lite varmare, som ansiktet. Handen på pulten i rummet följer med. Prövat och bortvalt:
  händerna lagda över varandra (den undre handens fingrar stack fram), en löst knuten näve (såg ut som
  tummen ned) och händerna vilande på lillfingersidan (såg ut som klor). Se [Hasse Backe](#hasse-backe),
  *Bilden* och *Armarna och händerna*.
- **Samma pult och samma armar i rummet och hos Hasse Backe (2026-11-08, användarens önskemål):** vyn mot fönstren och
  vyn mot Hasse skulle "upplevas som samma rum och samma ögonblick, men pulpeten och Hasses arm hänger inte ihop".
  Pulten i rummet var en målad bild med plankor åt en, orange, och utan hörn, medan disken framför honom var
  dämpat brun, ådrad längs L:et och med ett geringssnitt; i rummet låg en ensam hand, i baren korslagda händer.
  Nu är det samma skiva ([public/rum-pult.js](public/rum-pult.js)): samma trä och samma bruna i båda (rummets
  bilder bakas med samma skuggare genom rummets kamera, lite ljusare men inte varmare), ådrad längs pulten och längst
  till vänster, där hörnet med geringssnittet nu syns, längs benet mot en; samma ringar efter glas i båda, samma
  metallist längs bortre kanten och en tjock, mjukt rundad framkant av trä. I rummet ligger hans underarmar
  korslagda på pulten, den vänstra handen över den högra som i baren, med samma ärm, manschett och hud i samma ljus,
  och båda bilderna har samma skuggor under händerna, med en tät kontaktskugga där de ligger an. I baren står kameran
  14 cm högre och lutar 14° i stället för 10°, så att pultens arm till höger ligger vågrät i stället för att se ut som
  en ramp; väggen bakom honom är ombakad. Se [Hasse Backe](#hasse-backe), *Bilden*, *Pulten* och *Kaffet i
  rummet*.
- **Hasse Backe längre ut mot pultens hörn, och notan på samma håll (2026-11-09, användarens önskemål):** "Kvittot och
  bänken ser ju inte riktigt ut att passa ihop på bilderna. Kvittot ser ut att vara på olika håll", och Hasse "verkar
  sitta närmre L-kanten" i rummet än i baren: "Kan du ordna så att han sitter längre ut på kanten på bordet så att
  bilderna matchar bättre. Kaffekoppen och kvittot behöver då självklart följa med!" I rummet ligger händerna vid
  geringssnittet, men i baren satt han 27 cm längre in på benet, och notan låg rättvänd mot en på båda ställena fast
  man har vänt sig nästan ett kvarts varv. Nu sitter han vid hörnet i baren (`PLATS` i
  [public/rum-hasse-scen.js](public/rum-hasse-scen.js)), med händerna vid geringssnittet och pultens arm tätt intill en;
  kaffet följer med, 5 cm längre fram, och notan ligger på tvären framför hans händer, vänd som i rummet, med fatet
  på dess övre vänstra hörn. Rummet är oförändrat. I telefonen blir bilden lite mindre när notan annars skulle
  hamna under samtalets text (`matt` i [public/rum-hasse.js](public/rum-hasse.js)). Väggen bakom honom är
  ombakad för den nya platsen (i bakningen syns pulten bara som skugga och ljus på väggen). Se [Hasse Backe](#hasse-backe),
  *Bilden* och *Kaffet i rummet*.
- **Hasse läser DN och SvD, med läsglasögon (2026-11-09, användarens önskemål):** "Kan du göra tidningarna bättre som
  hasse läser - han läser SVD och DN. Det ska verka vara riktiga tidningar och det behöver inte vara någon sportdel", och
  "Han får sätta på sig och ta av sig glasögonen när han läser tidningarna - ordna olika animeringar kopplat till detta".
  Tidningen var veckans kvällstidning med en rubrik om hans egen omgång och tipsguiden på baksidan. Nu är den dagens
  Dagens Nyheter eller Svenska Dagbladet, en i varje läsklipp: namnet i tidningens stil, datum, nummer och pris, tre
  puffar, en stor bild och dagens nyhet, och på baksidan notiserna inför omgången (*Så mår tipslagen*) eller, utan dem,
  vädret med Sverigekartan och kvällens tv. Nyheterna på förstasidan är påhittade och tidlösa, utan riktiga personer och
  utan sport. Hans läsglasögon sitter i bröstfickan: han tar fram dem,
  fäller ut skalmarna och sätter på sig dem innan han tar upp tidningen, och efteråt tar han av dem och stoppar tillbaka
  dem. Medan han läser skjuter han upp dem med pekfingret, drar ned dem på näsan och tittar på en över dem, eller tar av
  dem, pekar på en med dem och biter tankfullt i skalmen. När han tog upp tidningen ur knät och lade tillbaka den stod
  armbågarna en stund ut som vingar i axelhöjd ("Rätta armbågarna också"): nu håller han den lågt tills den är framme,
  och i knät hänger armarna nedåt. Se [Hasse Backe](#hasse-backe), *Tidningen* och *Glasögonen*.
- **Hasse Backe minns vad han sa (2026-11-06, användarens önskemål):** klickade man på en match
  man redan hade frågat om slog han domen i disken en gång till, och efter en omladdning gjorde han
  om allt, med 15–25 sekunders väntan. Nu står det han sa direkt, sparat på enheten så att det
  finns kvar när analysen skrivs om, och han erbjuder sig ödmjukt, på sitt sätt, att titta igen. Se [Hasse Backe](#hasse-backe), *Samtalet*.
- **Titta igen och Alla matcher hos Hasse Backe, utan Tillbaka (2026-11-07, användarens önskemål):**
  knappen *Nästa match* tog en till listan med alla 13 matcherna och var "helt fel", och *Tillbaka*
  var onödig. Nu står *Titta igen* (hela analysen en gång till) där *Nästa match* stod, både efter
  en analys och vid en match man redan har frågat om, och *Alla matcher* (listan) bredvid. Ett klick
  på bilden utanför samtalet går tillbaka till rummet, som Esc. Se [Hasse Backe](#hasse-backe).
- **Hasse Backe svarar direkt, och läser upp när man vill (2026-11-07, användarens önskemål):** "Kan du ordna så
  att Hasse Backes svar går fortare – just nu är det trögt och ingen orkar lyssna på det" och "Det bästa vore om bara
  texten dök upp och att man hade möjlighet att höra honom läsa upp det". Förut låtsades han läsa på i 15–25 sekunder,
  slog domen i disken och sa sedan texten ord för ord, en dryg minut i allt. Nu står hela texten direkt när man ber om
  analysen, han slår domen i disken medan man läser, och *Läs upp* under texten låter honom läsa den med sin röst.
  Raderna han sa medan han låtsades läsa på är borttagna. Se [Hasse Backe](#hasse-backe), *Samtalet*.
- **Hasse Backe nöjd i stället för hånfull (2026-11-06, användarens önskemål):** i vilan hade han ena
  brynet högt, huvudet på sned och hakan uppe med ett tunt leende, och det såg hånfullt ut. Nu är han
  nöjd och säker på sin sak, fortfarande lite överdrivet: båda brynen lite uppe, huvudet nästan rakt
  och ett leende som når ögonen, också när han pratar. Ögonbrynet han höjer medan han väntar kommer med
  ett brett leende och en nick i stället för ett snett leende. Se [Hasse Backe](#hasse-backe), *Minen*.
- **Hasse Backes händer när han dricker och röker (2026-11-06, användarens önskemål):** handen satt
  ofta nästan i rät vinkel mot underarmen och stack ut ur manschettens sida, så att man såg in i
  manschetten: när han tog koppen från fatet, när han höll den under hakan och när han hade cigarren vid
  munnen. Nu väljs armbågen så att underarmen går i handens förlängning, koppen tas bakifrån med
  fingrarna genom örat, och vid munnen hålls cigarren med fingrarna uppåt och armbågen nere. När han
  rullar cigarren mellan fingrarna rullar bara cigarren, inte handen. Se [Hasse Backe](#hasse-backe),
  *Kaffet* och *Cigarren*.
- **Veckans löpsedel från riktiga tidningar (2026-11-06, användarens önskemål):** KVÄLLSPRESSEN
  finns inte, och rubrikerna var lama. Nu är löpsedeln Sportbladets (rosa papper) eller Expressens
  (det röda namnet), två veckor i taget, med namnet som text och våra rubriker: större ord och mer
  kvällstidning, men torra (*GARANTERAT! ARSENAL VINNER* – *(74 procent enligt datorn)*, *Datorn
  avböjer att kommentera*). Varje slags rubrik har två eller tre varianter som veckan väljer mellan,
  och den näst största nyheten står längst ner, som på en riktig löpsedel. Se
  [Tobaksaffären](#tobaksaffären), *Affischerna*.
- **Löpsedeln på riktigt tidningspapper (2026-11-08, användarens önskemål):** löpsedeln såg för
  blank och osannolik ut: kritvitt papper med ett jämnt prickraster över allt (som tyg eller en skärm),
  ett blänk snett uppifrån, raka kanter och helt jämn svärta. Nu är den matt tidningspapper med fibrer
  och buktor, svärtan och det röda täcker inte överallt, den har legat vikt på mitten och är klippt med
  sax; det vita i texten är papperet, och tejpen i fönstret är maskeringstejp med avslitna ändar. På
  väggen ritades den dessutom framför bardisken och barstolarna när kameran följde musen åt vänster;
  nu hänger den bakom dem, och den är lite mindre (70 % i stället för 78 %), så att den går fri från
  diskens kant. Se [Tobaksaffären](#tobaksaffären), *Affischerna*.
- **Domarens kort i stället för kvittot (2026-11-06, användarens önskemål):** kvittot på pulten
  tillförde inget – vilka som har lämnat in syns redan på högen – och var ett tredje papper
  bredvid notan och kupongen. Där ligger nu domarens gula och röda kort och visselpipan med
  snodden, som passar Matchfixarna bättre, och de är lättare för grafiken än kvittot (ingen bild).
  Se [Tobaksaffären](#tobaksaffären).
- **Högen till höger om kupongen (2026-11-07, användarens önskemål):** högen med de
  inlämnade kupongerna låg till vänster om kupongen, under Hasses nota och hand. Nu ligger den
  till höger, där domarens kort och visselpipa låg – de är borta. En kupong ur högen vänds
  mot mitten när den tas i handen, och i uppgörelsen kommer kupongerna in från höger. Askan,
  smulorna, locket och fikat hamnar aldrig på högen. Se [Tobaksaffären](#tobaksaffären).
- **Gängets kupong med baksidan upp (2026-11-07, användarens önskemål):** när allas tips visas
  syntes allas kryss direkt på pulten. Nu ligger gängets kupong med baksidan upp, med stämpeln
  (*Alla inne*) stort mitt på, och framsidan lyser svagt igenom, spegelvänd, som på tunt papper.
  Ett klick vänder den, och den ligger vänd på enheten tills någon mer har lämnat in; tas den i
  handen (pingklockan) läggs den tillbaka med framsidan upp. Valt bland fem skisser (vikt kant,
  skrapfält, kuvert, bara gängets kryss). Se [Tobaksaffären](#tobaksaffären).
- **Visitkortet i stället för raderna vid dörren (2026-11-06, användarens önskemål):** under
  närbilden av dörren stod raderna från Om oss. De är borta, och i stället sitter Matchfixarnas
  visitkort med ett mässingsstift på väggen mellan stationsuret och orakelramen: namnet, våra autografer och
  devisen. Ett klick går fram till det. Se [Tobaksaffären](#tobaksaffären), *Visitkortet*.
- **Lagen på kupongen (2026-11-07, användarens önskemål):** ett klick på lagen i en rad på
  kupongen i handen lägger ett blad med båda lagen ovanpå kupongen: chansen för 1, X och 2 ur
  spelbolagens odds, mål och xG i ligan hittills och de tio senaste matcherna för vart lag –
  gröna vinster och röda förluster, hemmamatcherna i en rad och bortamatcherna i en annan, med
  lagets och motståndarnas xG under ställningen. Bladet är byggt av det sajten redan visar, med
  samma tal under samma namn och samma grafik (konkordansen står under
  [Kupongen i handen](#kupongen-i-handen), *Matchbladet*). Samma dag blev bladet sidan *Lagen* i
  matchbladet (nästa punkt).
- **Ett matchblad i tobaksaffären (2026-11-07, användarens önskemål):** "Nu verkar det som att du har
  ordnat så att det finns en massa olika matchanalys-lappar. Jag vill ha en som man kan kika i. Kan du
  lägga ihop de som finns på ett snyggt sätt och ordna så att man får fram samma på Hasse
  Backe-sidan och på den vanliga animationssidan." Om en match fanns två blad i rummet: bladet med
  lagen på kupongen i handen och matchrutan från den vanliga sajten, som *Matchbladet* hos Hasse
  Backe, *Matchbladet →* på bladet och matchens rad på tv:n öppnade ovanpå rummet. Nu är de ett blad
  på kupongens papper med flikarna *Lagen* (det som stod på bladet med lagen), *Prognos*, *Analys*,
  *Startelvor*, *Tabellen* och *Mötena*, och det är samma blad på kupongen i handen, hos Hasse och
  från tv:n – där läggs det fram mitt i fönstret, lika stort som kupongen i handen. Inget i rummet
  öppnar längre matchrutan, i linje med att inget leder ut ur tobaksaffären. Matchrutan på den
  vanliga sajten är som förut. Se *Matchbladet* under [Kupongen i handen](#kupongen-i-handen).
- **Vem som säger vad i Hasse Backes matchlista (2026-11-07, användarens önskemål):** rutorna 1 X 2,
  resultatet och tecknen för hand längst ut stod utan avsändare, så det gick inte att se vem som
  tyckte vad. Nu står Hasses porträtt och namn i guld över hans spalt och ditt porträtt med namnet i
  din handstil över din, som spalthuvuden. Av tre skisser i den riktiga vyn (två spalter, samma
  rutor med ditt kryss över hans guld, din kupong med hans ringar i guld) valde användaren två
  spalter. Se [Hasse Backe](#hasse-backe), *Samtalet*.
- **Bakåt lägger bort det översta (2026-11-08):** Androids bakåtgest och webbläsarens bakåtknapp lämnade
  sajten också med matchbladet, kupongen i handen eller en närbild framme, eftersom rummet inte låg i
  historiken. Nu tar bakåt bort ett lager i taget och lämnar sajten först när inget är framme. Namnet
  Matchfixarna i rummet är inte längre en länk, eftersom den bara lade till en rad som nästa bakåt
  stannade på. Se [Bakåt](#bakåt) under Tobaksaffären.
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
- **Analyserna:** [scripts/analyser/skriv.mjs](scripts/analyser/skriv.mjs) (körningen, filerna,
  git), [src/analyser/](src/analyser/) (`claude -p`, underlaget, kontrollerna, artikeln, Hasse,
  namnet och kommentaren), [config/analyser.js](config/analyser.js) och
  [prompts/analys-rost.md](prompts/analys-rost.md). Se [Analyserna](#analyserna).
  [src/news.mjs](src/news.mjs) används inte längre av något men ligger kvar och går att prova med
  [src/news-cli.mjs](src/news-cli.mjs).
- **Den beräknade startelvan:** [src/startelvor.js](src/startelvor.js) läser elvorna ur
  matchrapporterna, tar fram planen (formation, platser och kö) för kommande matcher inom
  14 dagar i `data/match/<id>.json` (fältet `elva`) och mäter i varje bygge hur ofta den
  stämt. Uttagningen och platserna räknas av [public/elva.js](public/elva.js), som både
  bygget och matchrutan använder. Se [Den beräknade startelvan](#den-beräknade-startelvan).
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
  [public/samtal.js](public/samtal.js) och [public/samtal.css](public/samtal.css). Gängets kryss
  delas i realtid genom [worker/kupongen.mjs](worker/kupongen.mjs) (i tjänsten profeterna-rummet)
  och [public/samtal-live.js](public/samtal-live.js). Se
  [Inför uppgörelsen](#inför-uppgörelsen).
- **Kuponghistoriken:** [src/history.js](src/history.js) rättar färdiga kuponger, räknar
  betyget, fryser in dem i `data/kupong-historik.json` och skriver `data/historik.json`.
  Grupparbetena sist i Olympen ritas av [public/historik.js](public/historik.js) med
  [public/historik.css](public/historik.css) (gamla `historik.html` leder dit);
  AI-kommentaren skrivs av [src/analyser/kommentar.mjs](src/analyser/kommentar.mjs) med prompten i
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
  (ansiktena i `public/rum/`), och matchbladet – på kupongen i handen, hos Hasse Backe och från
  tv:n – i [public/rum-matchblad.js](public/rum-matchblad.js) med
  [public/rum-matchblad.css](public/rum-matchblad.css). Se [Tobaksaffären](#tobaksaffären).
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

## Analyserna

Analyserna skrivs i förväg på en dator som står på dygnet runt (iMacen), med Claude Code i
icke-interaktivt läge (`claude -p`) på användarens Claude-konto. Sajten visar bara färdiga texter
och anropar aldrig någon språkmodell. (Fram till 2026-11-04 skrevs texterna vid klick av proxyn
`profeterna-analys` på Cloudflare, med API-nycklar.)

```
launchd               →  scripts/analyser/skriv.mjs  →  claude -p (en gång per match)
                                     ↓
       data/analyser.json, data/omgangsnamn.json, data/kupong-historik.json, data/tidning.json
                                     ↓
          commit och push till main  →  GitHub Actions  →  matchfixarna.se
```

**Vad som skrivs och när.** Omgången är gängets kupong, `GET …/samtal`, oftast Stryktipsets
tretton matcher. Jobbet startar på analysernas tider och kontrollerar dessutom var 15:e minut, men
de flesta körningar har inget att göra och anropar inte Claude.

- **Namnet på omgången** så snart omgången finns, oftast måndag strax efter 16.00.
- **Analyserna** måndag 17.00, onsdag 16.00, fredag 16.00 och lördag 11.00, svensk tid (`tider` i
  [config/analyser.js](config/analyser.js) och `StartCalendarInterval` i
  [plist-filen](scripts/analyser/se.matchfixarna.analyser.plist); användarens önskan 2026-11-04). Varje
  tid skriver nya analyser för omgångens matcher som inte har börjat, och den nya texten ersätter den
  gamla, så hela omgången ger upp till 52 analyser i veckan. En tid gäller omgångar som fanns när klockan
  slog: en omgång som skapas senare väntar till nästa tid, men en match utan analys skrivs ändå när
  det är högst 24 timmar kvar till avspark. Har matcherna ändrats skrivs de nya vid nästa kontroll.
- **Hasse Backes text** direkt efter varje analys.
- **Tidningen inför omgången** så snart omgången finns, och sedan måndag 17.00 och fredag 16.00, och när
  supporterpoddarna eller supporterforumen har gett nya uppgifter (se nedan).
- **Kommentaren till en färdig kupong** när kupongen finns i den publicerade historiken.

**En analys** är ett anrop till `claude -p`: Claude söker och läser på nätet (högst 6 sökningar och
4 sidor enligt prompten, spelbolag spärrade för `WebFetch` och strukna ur källistan), får matchens
underlag ([src/analyser/underlag.mjs](src/analyser/underlag.mjs): det matchbladet visar, med
prognos och odds) och skriver artikeln (rubrik, ingress, 180–240 ord, källor) och tipset (tecken,
marginal, högst 120 ord) i samma svar. Modellen är `claude-opus-5-5` med effort `low`, som förut.
Artikeln skrivs inte längre innan Claude sett prognosen, men får fortfarande inga tipsord.

**Kontrollerna** ([src/analyser/kontroller.mjs](src/analyser/kontroller.mjs)) är desamma som när
texten skrevs vid klick: en källa följer bara med om adressen kom upp i en sökning eller på en
läst sida, varje tal ska stå i underlaget eller i det Claude läste, artikeln får inga tipsord och
tecknen ska vara ett till tre av 1, X och 2. Klarar svaret inte det får Claude skriva om det en
gång, utan verktyg men med det den läste. Klarar artikeln sig men inte tipset sparas artikeln utan tips.

**Tidningen inför omgången** (2026-11-09, användarens önskan): en notis per match i omgången om hur lagen har
det just nu – skador, tränarens ord, sviter, det som har hänt i klubben – i en svensk morgontidnings sakliga ton,
till tidningen som Hasse Backe läser. Den skrivs på iMacen som allt annat här, med `claude -p` på Claude-kontot och
inte med API-nycklar: ett anrop för hela omgången ([src/analyser/tidning.mjs](src/analyser/tidning.mjs), prompten och
gränserna i [config/tidning.js](config/tidning.js)). Claude får högst 12 sökningar och 4 sidor, samma underlag som
namnet (tabelläget, formen, schemat och möten) och skadelistan, men inga odds, och skriver en rubrik på högst sju ord
och 40–70 ord per match. Kontrollerna är analysernas: en källa följer bara med om adressen kom upp, varje tal ska stå
i underlaget eller i det Claude läste, och notisen får inget tipsspråk (spik, gardering, odds, favorit). En notis som
inte klarar det skrivs om en gång utan verktyg; går den inte igenom då står matchen utan notis, och klarar mindre än
60 % av matcherna sig ligger den gamla sidan kvar. En ny omgång får sin tidning direkt, och den skrivs om på tiderna i
config/tidning.js om sidan är äldre än tiden och minst tolv timmar gammal; när alla matcher har börjat står den kvar.
`node scripts/analyser/skriv.mjs --tidning --ut /tmp/prov` skriver den för omgången som pågår, oavsett tid.
`data/tidning.json`, som bygget kopierar till sajten:

```json
{ "omgang": "2026-11-14-st4979", "matcher": ["401878757"], "skriven": "…", "model": "…", "version": "…",
  "notiser": [ { "nr": 1, "id": "401878757", "match": "…", "avspark": "…", "rubrik": "…", "text": "…",
                 "kallor": [ { "source": "…", "title": "…", "url": "…", "publishedAt": null } ],
                 "lag": ["Nottingham Forest", "Manchester City"],
                 "bilder": [ { "fil": "nottingham-forest-4f5f237f.jpg", "kalla": "Sky Sports", "foto": null, "sida": "…" },
                             null ] } ] }
```

`nr` är matchens nummer på kupongen. Tidningen som Hasse Backe läser trycker notiserna på baksidan (se *Tidningen*
under [Hasse Backe](#hasse-backe)), och tidningen bakom löpsedeln på sidan *Så mår tipslagen* (se [Tidningen](#tidningen)).

**Veckans bilder i tidningen** (2026-11-09, användarens önskan: *bilder från veckan i tipsguiden, för de olika
lagen*): när tidningen är skriven hämtar samma jobb en bild från den senaste veckan per lag, med vanliga hämtningar på
iMacen och utan någon språkmodell ([src/analyser/tidning-bilder.mjs](src/analyser/tidning-bilder.mjs)). Premier
League-lagen har egna artiklar hos ESPN (`site.api.espn.com/…/news?team=<id>`, id:t ur `data/skoldar.json`) med bild och
fotograf; för de lägre divisionerna är det delningsbilden (`og:image`) i notisens egna källor och i Bing News sökningar
`<lag> FC` och `<lag> football` (lokaltidningarna och klubbarnas sidor). Rubriken ska nämna laget och handla om
fotboll (*Southampton communities gather* är inte Southampton), inte damlaget, akademin eller ungdomslagen, och
ingen liveblogg; en rubrik som också nämner motståndaren eller ett annat av omgångens lag, en förhandstitt och ett
värvningsrykte (spelaren i den andra klubbens tröja) kommer sist. Bilden ska vara från de senaste åtta dagarna,
liggande, minst 480 bildpunkter bred och inte en logga (adressen) eller en grafik (en jämn bild packas hårt: under
0,15 byte per bildpunkt). Sajter vars delningsbild är en grafik med text och sköldar (GOAL, OneFootball, Football
Insider, Football League World m.fl.) och sajterna som är spärrade på datorn läses inte. Samma bild används inte för två
lag. `sips` förminskar den till 320 bildpunkter (15–35 kB). Provat på omgången 2026-11-07: 25 av 26 lag fick en bild på
15–20 sekunder, och de flesta visar rätt lag. Bilderna läggs i grenen `tidning-bilder`, en enda commit som skrivs över
(som rösten i `rost`), så att main inte växer och förra veckans bilder försvinner; workflowen hämtar den till
`data/tidning-bilder/` och bygget kopierar den till sajten. Går grenen inte att pusha blir det inga bilder och sidan
visar lagens sköldar. Tidningen bakom löpsedeln trycker samma bilder i notiserna (se [Tidningen](#tidningen)). `node scripts/analyser/skriv.mjs --tidning-bilder` hämtar bilderna på nytt till tidningen som
finns, utan Claude (med `--ut <mapp>` hamnar de i `<mapp>/tidning-bilder/`).

**Supporterpoddarna** (2026-11-10, användarens önskan: *transkribera lagens poddar inför nästa stryktips så att
man får initierad info – det mest intressanta ska med*): varje natt kl. 02.15, och lördag kl. 08.00, lyssnar iMacen
igenom veckans avsnitt av supporterpoddarna för lagen i omgången ([scripts/tidning/poddar.mjs](scripts/tidning/poddar.mjs),
launchd-jobbet `se.matchfixarna.poddar`; logiken i [src/analyser/poddar.mjs](src/analyser/poddar.mjs), gränserna och
prompterna i [config/poddar.js](config/poddar.js)).

```
omgångens lag → registret (lagets poddar) → veckans avsnitt → whisper.cpp → claude -p → omgang.json
                                                                                             ↓
                                                   tidningen inför omgången får uppgifterna i sitt underlag
```

- **Poddarna hittas en gång per lag.** Först frågas Apple Podcasts (`itunes.apple.com/search`) efter lagets namn:
  träffarna som är sport och har ett avsnitt de senaste 28 dagarna är kandidater (`appleKandidater`). Sedan får Claude
  lagen med kandidaterna under, tio lag per anrop, och väljer supporterpoddarna bland dem eller lägger till en den
  känner till eller söker fram. En podd räknas bara om flödet lever, så ett påhittat namn faller bort av sig självt.
  Resultatet sparas i `register.json`; ett lag med podd letas upp igen efter 60 dagar, ett utan efter 7. Poddar vi
  redan känner står i `kanda` i config/poddar.js. Visar ett avsnitt att podden handlar om en annan klubb (`ratt_klubb`
  i svaret) tas den bort ur registret.
- **Veckans avsnitt:** högst sex dagar gammalt och minst tolv minuter långt. Nämner rubriken motståndaren är det
  förhandssnacket och går först, annars det nyaste. Ett nytt avsnitt per lag och natt.
- **Utskriften:** `curl` hämtar ljudet, `ffmpeg` tar de första 60 minuterna och `whisper-cli` (whisper.cpp, modellen
  `ggml-large-v3-turbo-q5_0`) skriver ut dem, med lagens och spelarnas namn som ledtråd så att de stavas rätt. Ljudet
  tas bort direkt. Ett avsnitt tar 5–10 minuter på iMacen (M1), en hel omgång några timmar.
- **Uppgifterna:** Claude får utskriften, ett stycke per minut, och tar ut allt som är intressant inför matchen, högst
  tolv uppgifter per avsnitt. Var och en har ett ämne (*skador och trupp*, *väntad uppställning*, *så spelar laget*,
  *tränaren och klubben*, *inför matchen*), ett slag (*bekräftat*, *hört i podden*, *supportrarnas åsikt*), minut,
  vikt 1–5, ett ordagrant citat ur utskriften, citatet på svenska (`sagt`) och vem som säger det (`vem`) när det
  framgår. Referat, tabelläge och småprat ska inte med, och en tom lista är ett godkänt svar.
- **Kontrollen:** citatet på 8–30 ord ska gå att hitta i utskriften (`citatStar`), annars stryks uppgiften. Tipsord
  stryks också. Namnet på den som talar följer bara med om det står i utskriften (`vemStar`); maskinen skiljer inte
  på rösterna, så oftast står bara poddens namn under citatet.
- **Informationssidan per match** (användarens önskan 2026-11-10: *längre informationssidor per match som man kan
  hämta kunskap ur*, med citat och vem som säger det): när uppgifterna för en match har ändrats får Claude båda lagens
  uppgifter (vikt 3 eller mer, ur lagets tre senaste avsnitt) och redigerar sidan, utan verktyg (`skrivSida`): väljer
  högst nio punkter per lag, slår ihop det som sägs två gånger, grupperar under ämnena och skriver rubrik och ingress.
  Varje punkt måste peka på uppgifter som finns (`ur`), och slaget, podden och citatet tas därifrån, inte ur svaret.
  En text, rubrik eller ingress med tipsord eller tal som inte står i uppgifterna stryks: punkten får då uppgiftens
  egen text och sidan en rubrik ur mallen. Högst fem citat per lag trycks, de tyngsta punkternas. Går svaret inte att
  läsa står uppgifterna som de är, grupperade (`sidaUtan`), och sidan redigeras nästa natt. Inga tips.
- **Ut på sajten:** analysjobbet (scripts/analyser/skriv.mjs, var 15:e minut) lägger sidorna i `data/poddsidor.json`
  när de har ändrats, utan något anrop till Claude. Tidningen i rummet visar dem under *Supportrarna*, en sida per
  match (se [Tidningen](#tidningen)).
- **Notiserna** (*Så mår tipslagen*) får fortfarande de bästa uppgifterna per lag (högst fyra) under *ur
  supporterpoddarna* i sitt underlag, och den mest intressanta ska bära notisen, med *enligt supporterpodden …*.
  Har det kommit nya uppgifter sedan sidan skrevs skrivs den om vid nästa kontroll (`poddTimmar` i config/tidning.js,
  högst var sjätte timme).

```json
{ "omgang": "…", "uppdaterad": "…", "amnen": { "trupp": "Skador och trupp" },
  "sidor": [ { "id": "401880745", "nr": 3, "match": "Stockport County – Reading", "lag": ["…", "…"], "rubrik": "…",
               "ingress": "…", "delar": [ { "lag": "…", "kallor": [ { "podd": "…", "avsnitt": "…", "datum": "…", "adress": "…" } ],
                 "grupper": [ { "amne": "trupp", "punkter": [ { "t": "…", "s": "b", "podd": ["…"],
                                "citat": { "sagt": "…", "vem": null, "podd": "…" } } ] } ] } ] } ] }
```

Allt ligger utanför repot, i `~/Library/Application Support/Matchfixarna/Tidning/`: `register.json`, `omgang.json`
(omgångens avsnitt, uppgifter och sidor), `utskrifter/` (tas bort efter tre veckor) och modellen. Ljudet och utskrifterna
är andras och läggs aldrig i repot eller på sajten; dit kommer tidningens egna meningar, poddens namn och korta citat
i svensk översättning, med podden som källa.
Jobbet rör aldrig git och går som allt annat på Claude-kontot, inte med API-nycklar. Loggen:
`~/Library/Logs/Matchfixarna/poddar.log`. Installera med `scripts/tidning/installera.sh` (kräver
`brew install whisper-cpp` och modellen i mappen).

```
node scripts/tidning/poddar.mjs --torrt     vilka avsnitt som skulle skrivas ut
node scripts/tidning/poddar.mjs --visa      det som är uttaget för omgången
node scripts/tidning/poddar.mjs --lag "Reading" --mot "Stockport County"     ett lag på prov (prov.json)
node scripts/tidning/poddar.mjs --prov 401880745,401880747     en påhittad omgång av sajtens matcher (prov.json)
node scripts/tidning/poddar.mjs --sidor     skriver bara om informationssidorna
```

**Provet 2026-11-10**: en påhittad omgång av lördagen den 14 novembers 13 matcher i League One och League Two
(26 lag, 22 av dem nya), körd två gånger i följd. 19 avsnitt skrevs ut, 179 uppgifter togs ut och 12 av 13 matcher
fick en sida (Bristol Rovers–Chesterfield blev utan: Rovers podd hade inget avsnitt den veckan och Chesterfields
handlade inte om laget). Det provet visade och det som ändrades:
- Ett enda anrop för 22 lag gav ingen podd för nio av dem. Nu får Claude Apples träffar per lag och tio lag per
  anrop, och de 85 lag som har en känd podd står i `kanda` i config/poddar.js.
- En podd med rätt namn kan vara fel podd (*Across the Pitch* var japansk, inte Accringtons). `ratt_klubb` i
  uttaget stryker en sådan ur registret; den raden är borttagen ur `kanda`.
- Flera poddar i de lägre serierna kommer ungefär en gång i månaden (Barnsley, MK Dons, Rochdale, Bristol Rovers).
  De lagen står då utan del på sidan, och sidan ställs upp för ett lag.
- Ingressen ströks för räkneord som *fyra* och *sex* (redaktören räknar ihop spelare). Små räkneord i bokstäver
  släpps nu; siffror kontrolleras som förut.
- Rubriken gjorde gammalt till nytt (en tränare som lämnade i juni). Anvisningarna säger nu att bara det som gäller
  laget och matchen får med, och att gammalt inte får bli nyhet.
- Namn under citatet kom med i ungefär vart fjärde citat (utskriften skiljer inte på rösterna); annars står podden.

**Supporterforumen** (2026-11-10, användarens önskan: *lägg till det viktigaste forumet för varje lag som den går
igenom inför tidningssläppet – som källmaterial för info om laget*): samma nattjobb läser, före poddarna, lagets
viktigaste supporterforum för varje lag i omgången ([src/analyser/forum.mjs](src/analyser/forum.mjs), gränserna,
forumen och prompterna i [config/forum.js](config/forum.js)). Uppgifterna hamnar bredvid poddarnas: på
informationssidan och, under *ur supporterforumet*, i tidningens underlag.

```
omgångens lag → lagets forum (config/forum.js) → tavlan → de bästa trådarna → sista sidan → inläggen → claude -p → omgang.json
```

- **Forumen:** det viktigaste supporterforumet för vart och ett av de 92 ligalagen som går att läsa, uppslaget och
  prövat 10 november 2026, står i `kanda`, med tavlan där a-laget diskuteras. 44 lag har ett. De andra 48 står i
  `utan`: det stora forumet spärrar allt som inte är en webbläsare (RedCafe, Bluemoon, Grand Old Team, VillaTalk,
  Charlton Life, OTIB, Pompey Chimes, Red Passion, Molineux Mix …), säger nej till AI-assistenter i robots.txt (alla
  forum hos ProBoards, som The Oatcake och Down At The Mac, och UpTheClarets, Stagsnet och One Boro), är nedlagt eller
  tyst, eller är byggt så att det inte går att läsa ut (Luton Outlaws, Tigers Talk). Där det största forumet var spärrat
  står det näst viktigaste, om det lever (Vital Football för Villa, City, Newcastle, Swansea, Wigan m.fl.). Ett lag som
  varken står i `kanda` eller `utan` (en klubb utanför ligan) letas upp av Claude, åtta lag per anrop, och används
  bara om läsaren kan läsa tavlan och den har inlägg de senaste 21 dagarna. Registret ligger i `forum.json`.
- **Läsningen** görs som en vanlig läsare: några sidor per lag och natt, med namnet *Matchfixarna/1.0 (forumlasare)*,
  och med samma regler i robots.txt som Anthropics användarstyrda läsare (Claude-User). Säger forumet nej till
  AI-assistenters läsning (Claude-User, ChatGPT-User, Perplexity-User eller `Content-Signal: ai-input=no`) läses det
  inte alls; spärrar mot AI-träning (ClaudeBot, GPTBot, CCBot) gäller inte, eftersom inget tränas och bara korta
  översatta citat trycks. En sida som svarar 403, visar Cloudflares kontroll eller kräver inloggning räknas som
  spärrad, och det görs inga försök att ta sig förbi.
- **Trådarna:** tavlans trådar i sidans ordning (den senast aktiva först). Tråden om just den här matchen
  (motståndaren i rubriken) går först, sedan aktiva trådar med en rubrik om laget (skador, uppställning, tränaren,
  ägarna); biljetter, resor, lekar, tävlingar, poddar, historia och annat stryks, liksom trådar utan inlägg den senaste
  veckan. Högst fem kandidater läses tills tre har minst två nya inlägg. Läsaren går till trådens sista sida och tar
  med sidan före om den sista har färre än tolv inlägg.
- **Inläggen:** läsaren känner igen XenForo (1 och 2), Invision, phpBB (och Forumotion), SMF, vBulletin, MyBB, Vanilla,
  FansNetwork (som TWTD), The Fishy och Discourse (via dess JSON). Ur varje inlägg tas användarnamnet, tiden och
  inläggets egen text; citat ur andra inlägg, signaturer och knappar stryks. Bara inlägg från de senaste sju dagarna
  följer med, högst 1 500 tecken per inlägg och 60 000 per lag.
- **Uppgifterna:** Claude får inläggen numrerade, med namn och tid, och tar ut allt som är intressant inför matchen,
  högst tio, med samma ämnen, slag och vikt som poddarnas. Citatet ska stå ordagrant i inlägget (annars stryks
  uppgiften), och namnet under citatet är användarnamnet på det inlägget, inte Claudes. Har inläggen inte ändrats
  sedan förra natten görs inget nytt anrop.
- **Sidan och tidningen:** sidan tar lagets två senaste forumläsningar (utöver de tre senaste poddavsnitten), och
  redaktören slår ihop det podden och forumet säger båda. Tidningens notiser får den senaste läsningens bästa
  uppgifter under *ur supporterforumet*, och forumtrådarna räknas som lästa källor.

```
node scripts/tidning/poddar.mjs --bara-forum                          bara forumen, för omgångens lag
node scripts/tidning/poddar.mjs --utan-forum                          bara poddarna
node scripts/tidning/poddar.mjs --lag "Sheffield Wednesday" --mot "Plymouth Argyle" --bara-forum --fil prov-forum.json
```

**Provet 2026-11-10**: samma påhittade omgång som poddarnas (13 matcher i League One och League Two), med bara
forumen. 11 av de 26 lagen har ett forum, alla 11 lästes (tre trådar och 12–53 inlägg per lag) och gav 67 uppgifter,
1–10 per lag, på 13–46 sekunder per lag. 8 sidor skrevs om; där både podden och forumet hade något (Newport, Colchester)
står de bredvid varandra, och redaktören slog ihop det de båda sa. Inför provet prövades alla 92 lag: av forumen
agenterna hittade gick 44 att läsa, och läsaren fick ut inlägg med namn och tid ur alla 44.

**Rösten** står i [prompts/analys-rost.md](prompts/analys-rost.md): Sixten Bråvall, en påhittad
tränare med egen bakgrund i klubbar som inte finns och egna stående uttryck. Filen går att
finslipa för sig; ändringar på `main` gäller från nästa körning. Ska redan skrivna analyser av
kommande matcher skrivas om, byt `promptVersion` i [config/analyser.js](config/analyser.js).
Verkliga lag och personer nämns bara när underlaget eller det Claude läste tar upp dem.

**Sajten.** Bygget kopierar filerna till `_site/data/`. Matchbladets flik Analysera finns för
omgångens matcher och för matcher som har en analys; knappen visar den sparade texten direkt, eller
en rad om att den inte är klar än ([public/app.js](public/app.js)). I tobaksaffären svarar Hasse
Backe med sin text, och läser upp den om man vill (se [Hasse Backe](#hasse-backe)), och samma analys
med tipset står på sidan *Analys* i matchbladet där (se *Matchbladet* under
[Kupongen i handen](#kupongen-i-handen)). `data/analyser.json`:

```json
{ "uppdaterad": "…", "omgang": { "id": "2026-11-07-st4978", "matcher": ["401878757"] },
  "analyser": [ { "id": "401878757", "match": "…", "avspark": "…", "writtenAt": "…", "text": "…",
                  "author": "…", "title": "…", "lead": "…", "paragraphs": [], "sources": [],
                  "tip": { "text": "…", "signs": [0], "note": "…" }, "hasse": { "stycken": [] } } ] }
```

**Abonnemanget och inte API.** Enligt
[Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
drar `claude -p` med en plan-inloggning från abonnemangets gränser (uppdaterat 2026-10-07). För
att det ska gälla stoppar skriptet om `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` eller en
molnleverantörs variabel är satt, startar `claude` med en egen liten miljö där inget ärvs,
kontrollerar inloggningen först (`claude auth status`) och avbryter om körningen ändå rapporterar en
API-nyckel. `--bare`, som dokumentationen rekommenderar för skript, får inte användas: det
läget läser aldrig abonnemangets inloggning. Beloppet i loggen är Claude Codes egen uppskattning
av värdet. Användningen delas med annat arbete i Claude. Är extra användning (extra usage) påslagen
på kontot kan det som går över gränsen kosta pengar, så håll den avstängd.

**Verktygen.** `claude -p` körs i en tom tillfällig mapp med `--tools WebSearch,WebFetch` för
analysen och tidningen, `WebSearch` för namnet och inga alls för Hasse och kommentaren, utan inställningar,
tillägg och MCP-servrar. Den kan alltså inte läsa eller ändra filer eller köra kommandon, och
webbsidornas innehåll når bara texten, som går genom kontrollerna.

**När något går fel.** Varje färdig text sparas först i `vantande.json` utanför repot. Misslyckas en
match skrivs de andra ändå, en gammal analys ligger kvar tills en ny finns, och matchen försöks igen
efter en timme, högst tre gånger per tid (`forsok.json`; ta bort posten för att försöka igen direkt). Når
abonnemanget sin gräns pausar jobbet en timme. Går det inte att pusha ligger texten kvar till nästa
körning. Spelade matcher faller bort ur filen efter 14 dagar. Loggen står i
`~/Library/Logs/Matchfixarna/analyser.log`, och launchds egen i `launchd.log` bredvid.

**Skripten** arbetar i en egen klon, `~/Library/Application Support/Matchfixarna/Profeterna`, som
återställs till `origin/main` varje körning, så att en arbetskopia aldrig rörs. Kodändringar på
`main` gäller alltså från körningen efter nästa.

```bash
scripts/analyser/installera.sh                                # klonen och jobbets fil, startar inget
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/se.matchfixarna.analyser.plist   # starta
launchctl bootout gui/$(id -u)/se.matchfixarna.analyser       # stoppa
launchctl kickstart -k gui/$(id -u)/se.matchfixarna.analyser  # testkör nu
tail -f ~/Library/Logs/Matchfixarna/analyser.log              # följ
node scripts/analyser/skriv.mjs --en-match <id> --ut /tmp/prov  # prova en match utan git
node scripts/analyser/skriv.mjs --torrt                       # visa vad som skulle göras
```

**launchd** (`StartCalendarInterval`, `StartInterval`, `RunAtLoad`) kör ett tillfälle som missas medan datorn sover när den
vaknar, och flera missade blir ett. Jobbet väcker inte datorn. För att det ska gå att lita på att
analyserna kommer i tid ska automatisk vila vara avstängd, och Claude Code ska vara inloggat
(`claude auth login --claudeai`).

## Styrkan

Modellens styrka för alla lag i nivå 1–4, i [src/strength.js](src/strength.js): förväntad
målskillnad per match mot ett genomsnittligt Premier League-lag på neutral plan, ur den
senaste skattningen – alla fyra ligorna på samma skala. National League skattas men räknas
inte. Används som motståndet i lagstatistiken (kolumnen Motstånd under Statistik → Lag):
snittet av motståndarnas styrka mot vad ett lag i divisionen möter i snitt.

Säsongsprognosen (resten av säsongen spelad 10 000 gånger, under Tabeller) och programmet
framåt fanns 2026-10-18 – 2026-10-20 och togs bort på användarens begäran.

## Den beräknade startelvan

365Scores har en trolig elva bara i Premier League och Championship, och först några dagar
före matchen. För övriga kommande matcher inom 14 dagar räknar sajten fram en egen elva ur
lagens startelvor i säsongens liga- och cupmatcher hos ESPN (användarens önskemål
2026-11-07: ta med rotationen i Champions League och cuperna). Matchrutan visar den med
stämpeln *Beräknad elva* i blyerts när 365Scores inte har någon elva; har 365Scores en
trolig eller bekräftad elva visas den som förut. Stämpelns title säger hur elvan räknats för
vart lag och hur ofta regeln stämt i säsongens matcher. Styr inte prognosen
([src/startelvor.js](src/startelvor.js), [public/elva.js](public/elva.js)).

**Regeln.** Rotationen syns i datan som att elvorna från cupen och Europa säger lite om nästa
ligaelva, och att cupelvan mest består av dem som satt på bänken i ligan:

- *Ligamatch:* lagets senaste elva i ligan. Cup- och Europamatcher däremellan hoppas över.
- *Cupmatch:* roterar lagen i divisionen i säsongens cupmatcher – färre än sex ur ligaelvan
  före startade, i snitt – tas bänken från lagets senaste ligamatch först och ligaelvan
  sedan, annars ligaelvan. Målvakten för sig: stod ligans målvakt kvar i högst hälften av
  divisionens cupmatcher tas målvakten från bänken. Har divisionen färre än fem cupmatcher
  gäller alla fyra divisionerna ihop, och finns inga alls (första omgångarna i augusti)
  roterar lagen – så var det 2026/27 i alla divisionerna.
- *Kön efter det:* resten av truppen efter starter (1) och inhopp (0,5) i de tio senaste
  matcherna, med vikten 0,7 per match bakåt; matcher i en annan sorts tävling väger hälften.
  Bara den som finns i ESPN-truppen, och inte den FPL säger har lämnat klubben (status `u`).
- *Platserna:* formationen är den senaste ligamatchens. Kön tas ut uppifrån, och var och en
  sätts på en ledig plats i sin del av laget – målvakt, försvar (första linjen), anfall
  (sista) eller mittfält – närmast där han brukar stå. Den delen och platsen räknas ur hans
  starter i de tio senaste matcherna; den som inte startat får truppens position. Den som
  startade senaste ligamatchen står på sin plats därifrån. En formation utanför tabellen i
  [public/elva.js](public/elva.js) (19 formationer, alla som förekommit 2026/27) ger ingen elva.
- *De som saknas:* matchrutan stryker dem 365Scores lista för matchen säger saknas (inte de
  osäkra), på 365Scores id eller namnet; har 365Scores ingen lista, dem FPL anger som
  skadade, avstängda eller ej uttagbara (Premier League). Nästa i kön som spelar i samma del
  av laget tar platsen.

**Mätt 2026-11-07** på säsongens matcher fram till dess, med bara matcherna före varje
match och utan skadelistorna (de finns inte bakåt) – hur många av de elva som startade som
fanns i elvan. Bygget räknar om det varje gång (`elva.fit`).

| Lagmatcher | Regeln | Förra elvan, vilken tävling som helst | Förra cupelvan, annars ligaelvan |
|---|---|---|---|
| Liga (1 072) | 8,8 | 8,35 | – |
| – efter en Europamatch (27) | 8,9 | 7,19 (Europaelvan) | – |
| – efter en cupmatch (94) | 9,1 | 4,52 (cupelvan) | – |
| Cup (97) | 7,0 | 4,06 | 5,06 |

I cupen behöll lagen 3,5 (Premier League), 3,2 (Championship), 5,1 (League One) och 7,0
(League Two) ur ligaelvan före, och ligans målvakt stod kvar i 9 av 43, 4 av 24, 15 av 23
och 7 av 7 cupmatcher. Att ta bänken först i alla divisioner gav 6,9, med divisionens
rotation 7,0.

**Prövat och inte infört** (samma matcher):

- *Chans att starta per spelare* (logistisk regression) ur starter och inhopp i ligan,
  starter i cupen och Europa, vila (förra matchen högst 3,5 dagar sedan, och om den var i
  Europa) och en match högst 3,5 dagar efter – skattad på matcherna före 1 oktober och
  prövad på dem efter: 8,74 i ligan mot förra ligaelvans 8,77, och 6,1 i cupen mot förra
  cupelvans 6,6 (19 matcher). Efter
  en Europamatch byter Premier League-lagen något fler (8,9 kvar ur ligaelvan mot 9,2
  annars), men vilka som vilar går inte att se i förväg.
- *Förra cupelvans spelare först bland avbytarna i cupen:* 6,84 mot 6,87.
- *Lagets egen förra cupmatch i stället för divisionens rotation:* 6,92 mot 6,99.
- *Vikter för cup- och Europastarter i kön:* ersättarna stämde lika ofta (0,49 per ersättare)
  med vikten 0, 0,5 och 1 – prövat genom att stryka dem ur förra ligaelvan som inte startade.

**Kända brister:**

- Mätningen saknar skadorna. Med 365Scores eller FPL:s lista bör elvan stämma oftare än
  siffrorna ovan, men det går inte att mäta bakåt.
- FA-cupen och EFL-cupen räknas ihop: 2026-11-07 fanns två FA-cupmatcher. Hur mycket lagen i
  League One och League Two roterar i FA-cupens första omgångar är alltså lånat från
  EFL-cupen, tills FA-cupen gett egna matcher.
- Europacupernas elvor hämtas inte – regeln hoppar över dem, och kön blev inte bättre med dem.
  Bänken i en cupmatch tas ur senaste ligamatchen även när laget spelat i Europa sedan dess.
- Nyförvärv utan start och utan position i ESPN-truppen kommer inte med.
- Namnet på planen är efternamnet ur ESPN:s namn, med "van", "de", "Mac" och liknande ("van de
  Ven", "Mac Allister"), inte 365Scores egna korta namn.

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
  avbruten visas så direkt (inte som slutspelad) och räknas inte, redan före nästa bygge. I
  tobaksaffären följer också kupongen i handen med, rad för rad (*Kupongen i handen*).
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
   **Matcher låses 30 minuter efter avspark:** en match som startade för mer än
   `efterAvspark` minuter sedan ([config/kupong.js](config/kupong.js), 30) – eller har
   ställts in – kan inte läggas till; fram till dess går den att fylla i, så att gängets
   kupong kan föras in också när den spelades i sista stund (sedan 2026-11-03, förut låstes
   den vid avsparken). Hinner en vald match låsas medan man väljer tas den bort, med en rad om
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
med (låsta matcher och rader som inte hittades står där). Har en kupong som inte är
färdigspelad redan minst hälften av matcherna öppnas den i stället i Ändra, så att det
inte blir två kuponger för samma omgång; tecknen från bilden ersätter dess tecken i de
matcherna och anteckningarna ligger kvar. Man ser över kupongen och sparar som vanligt.
Matcher utanför sajtens tävlingar (t.ex. Allsvenskan eller Serie A) kan inte komma med.

**Spara direkt – inställningar (en gång):** en egen tjänst, så att GitHub-nyckeln bara finns där. Driftsätts med
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

**Ändra:** knappen *Ändra* (bara medan någon match återstår). Låsta matcher (startade för
mer än 30 minuter sedan) ligger kvar
som de är, med sina anteckningar – också om de hunnit låsas medan man ändrade; proxyn
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
    { "id": "401879260", "match": "Leeds United – Manchester United", "tecken": "X2", "kommentar": "Tejder drev X2" }
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
   Oftast behövs det inte: när Svenska Spel har öppnat veckans Stryktips (senast måndag kl. 07) och
   måndagen efter förra omgången kl. 16 har kommit (`nyKupongFran` i worker/samtal.mjs; en omgång som
   slutar mitt i veckan väntar bara tre timmar efter sista avsparken) blir Stryktipsets
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
   Tejder*, *Väntar på dig och Tejder*, *Väntar på alla* (vilka som är inne när man
   pekar), och grönt *Alla inne*. När tiden är ute står det *Dags för uppgörelsen* och vem
   som inte lämnade in; när gängets kupong är gjord tar den över. Porträtt står inte där –
   gänget syns redan på polaroiderna (2026-10-22). **När allas tips visas** (2026-11-07) står
   de omtvistade matcherna under raden, som på papperet och i rummet (punkt 4): numret inringat i
   guld, med en bock när matchen är klubbad, lagen med de korta namnen (`Papper.kort`,
   samma som på kupongen i rummet; de öppnar matchrutan) och vad var och en har tippat i sin färg
   (`--gang-0–2`), under små porträtt (`strider` i samtal.js). Matcherna som inte är omtvistade
   står inte där. Knappen heter *Till kupongen*, som i
   rutan för en färdig kupong, och *Fyll i resten* när man har börjat på sin kupong. En
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
   på lappen (se *Högarna*). Matcherna står i högar efter hur oeniga vi är (`hog` i samtal.js),
   i kupongens ordning inom varje hög:
   - *Inget gemensamt* – inget tecken finns hos alla (t.ex. 1, 1X och 2)
   - *Olika modiga* – alla har med samma tecken, men garderar olika mycket (t.ex. 1, 1X och 1X)
   - *Överens* – alla har samma tecken
   - *Saknar tips* – bara en (eller ingen) har tippat matchen

   **De omtvistade matcherna** (2026-11-07) är märkta som på kupongen i tobaksaffären, med samma
   kod (`strid` i `analyse`, se *Pennan visar vägen* under [Kupongen i handen](#kupongen-i-handen)):
   numret är inringat med pennan och gängets kryss där är bleka – ett förslag. *Klubba* på lappen
   klubbar matchen, liksom en ändring av gängets tecken i den: bocken dras vid ringen och kryssen
   fylls i. Det klubbade är detsamma på papperet och i rummet (`profeterna.rum.klubbat` på enheten,
   och hos de andra genom tjänsten, se nedan), och *Börja om* tar bort det.

   **Gängets kupong i realtid** (2026-11-08): det finns bara en kupong. Den som kryssar på papperet
   eller på pulten i tobaksaffären gör det på allas, och ändringen syns på ett ögonblick hos alla som
   ser kupongen: kryssen, bocken vid en klubbad match, antalet kvar, foten och *Börja om*. Inget annat
   på sidan rör sig (bara det som har ändrats ritas om, `ritaLive` i samtal.js och `gangLive` i
   rum.js), och det man själv läser eller skriver på lappen står kvar. Rutan som någon annan just
   kryssade har en ram i hens färg i knappt två sekunder. Var och en har sin egen lapp framme.
   Vägen går genom tjänsten profeterna-rummet ([worker/kupongen.mjs](worker/kupongen.mjs), en
   websocket till ett Durable Object, adressen är `rummet` i config/kupong.js med `/kupong` i stället
   för `/rum`). Tjänsten håller läget för omgången, så att den som kommer in sent ser samma kupong,
   och [public/samtal-live.js](public/samtal-live.js) håller uppkopplingen. Läget skrivs också på
   enheten som förut (`profeterna.samtal.beslut`, `profeterna.rum.klubbat`), så att allt annat ritas
   som det alltid har gjorts.
   - **Vem som kopplas upp:** bara den som får se de andras tips, medan någon match går att fylla i.
     Kryssen avslöjar vad de andra har tippat, så den som inte har lämnat in ser dem inte.
   - **Två samtidigt:** ett tecken gäller per match och den senaste vinner, så två som kryssar i olika
     matcher skriver inte över varandra. Alla hamnar på samma kupong (tjänsten bestämmer ordningen).
   - **När nätet går ner:** det man kryssar under tiden står kvar hos en själv och skickas när
     uppkopplingen är tillbaka; efter fem minuter gäller det de andra har gjort i stället. Fliken
     stänger uppkopplingen när den döljs och hämtar läget när den visas. Utan tjänsten ser var och en
     sina egna kryss, som förut.
   - **Spara:** kupongen som spelas sparas som förut som fil (`postCoupon`). Tjänsten får en kopia av
     den, så att knappen blir *Sparad* hos alla direkt och nästa ändring blir en ändring av den
     (`addPendingFrom` i kupong.js) – sajten visar den för övriga när bygget är klart. Det gäller också
     en kupong som sparas i *Ny kupong*, *Ändra* eller *Ladda upp system*; då blir kryssen dess. Själva
     sidorna *Ny kupong* och *Ändra* delas inte medan de fylls i.
   - **Låsta matcher:** en match som har låsts (`fillable`) visas som den sparades, också om någon har
     kryssat om den utan att spara.

   **Högarna** (2026-11-08, ersätter en dagordning i löptext som fyllde hela första skärmen i
   telefonen): uppgörelsen sker i telefon, så medan någon match går att fylla i står hela kupongen
   tätt (.sm-hog i samtal.css). Raderna har de korta lagnamnen och bara kryss och porträtt i
   rutorna, med 1 X 2 överst, så att alla tretton nästan ryms på en skärm i telefonen, och papperet bläddras
   fram direkt när man öppnar sidan under uppgörelsen. Högarna kommer ur allas tips och inte ur
   gängets kryss, så att ingen rad flyttar sig medan pennan rör sig. Överst står för hand hur många
   omtvistade matcher som är kvar: *Sex kvar*, *Allt klubbat*, *Inget att prata om*. Det vi är
   eniga om och det klubbade träder tillbaka, men inte det vi är eniga om mot modellen.

   **Till svars** (2026-11-09, `svarRad` och `tillSvars` i samtal.js): lappen tar en match i taget,
   så överst på papperet, under antalet kvar, står var och en i ett svagt band av sitt bläck med hur
   många matcher hen har kvar att svara för: *3 till svars*, *Klar*, *Går fri* eller *Inte inne än*.
   I rutorna är porträttet ringat på det tecken man står till svars för, och de andra porträtten i
   matchen träder tillbaka tills den är klubbad. Det är samma personer och tecken som frågan på
   lappen. Ett tryck på ett porträtt, i raden eller överst, lyfter fram hens tips och tonar ner de
   matcher hen inte svarar för. Raden står inte där när ingen särskild ska svara för något, och inte
   när ingen match längre går att fylla i.

   **Lappen** (`lapp`, `fraga` och `visaLapp` i samtal.js): ett tryck på en match tar fram allt som bara behövs
   när man pratar om den, längst ner på skärmen och ovanpå det som står där, så att inget på
   papperet flyttar sig: lagen (länk till matchrutan), avspark, oddsen, vad som ska sägas,
   motiveringarna och kommentaren i efterhand (ett ” vid lagen betyder att någon har skrivit
   något). Vad som ska sägas är en fråga till var och en vars tecken förslaget lämnar utanför –
   eller, när förslaget får med allt, till den som är ensam om ett tecken: *Tvåan, Johansson?*,
   *Din etta?*. Är ingen särskild att fråga står det *Alla olika*, *Ettan eller krysset?* eller
   *Helgardera?*, och annars *Alla har krysset – modellen tror på ettan*, *Ingen behöver backa* eller
   *Klubbas utan snack*. När sidan öppnas är lappen framme för den första omtvistade matchen, och
   *Klubba* tar fram nästa; *Nästa* hoppar över till nästa ej klubbade, och krysset eller ett
   tryck till på raden stänger lappen. *Spara gängets kupong* blir huvudknappen först när inget är
   kvar att klubba, och foten – Spikar, Halvgard, Helgard och Odds – står i raden längst ner.
   Regeln visas där och stoppar inget (se *Regeln*).

   På lappen står också Svenska folket, Svenska Spels odds och favoritskapet (`spelLapp`, 2026-11-09).
   När ingen match längre går att fylla i står matcherna luftigt i samma högar, med flikar för vad
   som står under rutorna: Modellen, Folket, Odds och Favoritskap (`underFlikar`, samma på gängets
   kupong när matcherna spelas), med tiden, oddsen,
   motiveringarna, kommentarerna och resultaten direkt på raden.
5. **Gängets kupong** (så fort man ser de andras tips, också om någon inte har lämnat in):
   man trycker på rutorna (två rutor =
   gardering). Den börjar som förslaget – med regeln ett som följer den (se *Regeln*), annars
   tecknen som fler än hälften har med och matcher där alla tippat olika tomma – och delas i realtid, så en kan hålla i pennan under uppgörelsen medan de andra ser kupongen växa fram (*Börja
   om* går tillbaka till förslaget). Nederst syns kupongen som rutor med antal rader.
   Gängets tecken går att kryssa i till 30 minuter efter matchens avspark (sedan 2026-11-03),
   så att kupongen som spelades hos Svenska Spel i sista stund kan föras in efteråt; därefter
   är matchen låst. Innan kupongen sparas frågar sidan om den inte följer regeln, om matcher
   saknar tecken eller om låsta matcher inte kommer med (*11 matcher startade för mer än 30
   minuter sedan och kommer inte med. Tryck igen för att spara ändå.*).
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
- **Spara gängets kupong** (på papperet och på pulten) stoppas inte av regeln: har den fler av
  något slag än regeln säger sidan det, och ett tryck till sparar ändå – gängets kupong ska vara
  den som spelades (sedan 2026-11-03; förut gick den inte att spara).
- Regeln kontrolleras på sidan, inte i tjänsten, som litar på gänget (se [Säkerhet](#säkerhet)).
- Regeln gäller också Hasse Backe när han tävlar (se [Hasse Backe tävlar](#hasse-backe-tävlar)). All
  kontroll av den står i [public/tippoang.js](public/tippoang.js) (`regelFor`, `slag`, `regelOver`,
  `regelKlar`), som kupongen, pulten och bygget delar. Nya förutsättningar läggs där.

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
tjänsten med samma regler när den startar omgången (`linkDraw`). Svaret har också oddsen och
favoritskapet för varje match. De finns hos Svenska Spel bara så länge omgången är öppen, så
tjänsten sparar dem i KV (`stryktipset:sista:<nr>`, `sparaSista`) med ett schema var tionde minut
(`[triggers]` i [worker/kupong.toml](worker/kupong.toml)): en gång i timmen, och var tionde minut de
sista två timmarna före spelstopp. `oddsSlag` säger vad svaret innehåller: `nu`, `sista` (det sparade)
eller `start` (startoddsen, med favoritskapet räknat ur dem, när inget är sparat). Lokalt
`/api/stryktipset` (med `KUPONG_LOKALT=1`).

**Omgångens namn** (2026-10-20): i stället för *Omgångens kupong* får varje omgång ett eget
namn av AI:n – det mest intressanta med just den omgången, sagt med lågmäld ironi, t.ex.
*Bournemouth trivs på Old Trafford* (Bournemouth har inte vunnit borta i år men vann 0–3 två
gånger där) eller *Man delar notan på Ewood Park* (de senaste mötena slutade oavgjort). Vad
namnet syftar på står när man pekar på det. Ungefär var tredje omgång får namnet gärna handla
om pengarna – drömmen om storkovan. Namnet är rubrik i förstasidans ruta (tiden kvar står
ovanför) och på omgångens sida (datumen ovanför). Datorn skriver det inom en kvart efter att
matcherna valts (så länge står *Omgångens kupong* kvar) och det syns sedan likadant för alla. Ändras matcherna får omgången ett
nytt namn. Gängets kupong får omgångens namn när den sparas (`namn` i kupongfilen, så också i
kuponghistoriken och som rubrik i förstasidans ruta), om den inte redan har ett; saknas det när kupongen
fryses in i kuponghistoriken tar bygget namnet från omgången med flest av kupongens matcher
(minst hälften). Bygget (`--journal`) fryser också in namnet och vad det syftar på i
tipparhistoriken (`namn`, `syftar` per omgång; `tippare.json` har `name` och `hint`), med
`data/omgangsnamn.json`. Namnet skrivs på datorn med Claude Code ([Analyserna](#analyserna),
[src/analyser/namn.mjs](src/analyser/namn.mjs), prompten och modellen i
[config/namn.js](config/namn.js)). Claude får söka på nätet efter nyheter kring lagen (`WebSearch`,
högst fem sökningar), så att det mest intressanta kan vara en nyhet och inte bara statistik – t.ex.
*Mästarbesök i Bromley* (Leicester, mästare för tio år sedan, borta mot en klubb som var utanför
ligasystemet 2024). Instruktionen är medvetet kort; långa regler gjorde namnen stela. I stället
visar den åtta namn som gänget har valt ut bland ett fyrtiotal förslag (t.ex. *Arsenal ligger där de
brukar*, *Spurs har alltid trivts på Bron*), säger att de visar tonen och inte vad namnet ska handla
om, och ber om en handfull förslag där det roligaste vinner (förslagen sparas med namnet). Omgången
och matchernas underlag läses ur tjänsten och den publicerade sajten (`data/match/<id>.json`: arena,
odds, tabell, hemma- och bortafacit, form, mål mot xG, vila, tidigare möten), en sammanfattning
räknas fram (lag som spelar flera gånger, största favorit, jämnaste match, chansen till alla rätt med
modellens troligaste tecken), och gängets senaste kupong och de tolv senaste namnen följer med, så
att namnen skiftar. Tal i förklaringen måste finnas i underlaget. Namnet sparas för alltid per omgång
och matcher. Bygget skriver filens adress i `data/kuponger.json` under `samtal.namn`.

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

**AI-kommentaren** skrivs på datorn med Claude Code, utan verktyg ([Analyserna](#analyserna),
[src/analyser/kommentar.mjs](src/analyser/kommentar.mjs)): 2–4 meningar i saklig ton, utan skämt, som
tar upp anteckningarna ("Tejder drev X2"). Kupongen läses ur den publicerade
`data/historik.json`. Samma regler som analysen: inga egna fakta om lag och matcher, inga påhittade
målförlopp, modellens chans för gängets tecken som odds (som på sidan), och varje tal ska finnas i
underlaget (annars skrivs texten om, därefter ingen text). Texten skrivs in i
`data/kupong-historik.json` och skrivs aldrig om. Prompten står i
[config/kommentar.js](config/kommentar.js). Kuponger från före 2026-11-04 har sin kommentar från
DeepSeek.

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
  anteckningarna – så finns den kvar när säsongens matcher inte längre gör det. Datorn skriver
  sedan in AI:ns kommentar (`"ai"`, se [Analyserna](#analyserna)). Steget *Committa
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
      "ai": { "text": "…", "modell": "claude-opus-5-5", "skriven": "2026-10-12T08:07:00.000Z" }
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

### Hasse Backe tävlar

Hasse Backe (fiktiv) tävlar med gänget från och med omgången efter 2026-11-07 men hör inte till
laget. Han står med i Omgångens tippare, ställningen, kröningen, utmärkelserna, betyget, kurvan,
inbördes möten, spelkassan och Tipsligan i tobaksaffären, med guld som färg. Han lämnar inget in,
finns inte i `gang` i [config/kupong.js](config/kupong.js) och syns inte när tipsen jämförs inför
gängets kupong, så att spelet går som förut: inlämningen, när tipsen visas, *Alla inne*, förslaget och
gängets kupong. *Lagkänsla* och *Den oumbärlige* gäller inte honom, och *Närvaro* räknas från hans
första omgång.

Han spelar under samma regel som alla (`regel` i [config/kupong.js](config/kupong.js), 4 spikar,
5 halvgarderingar och 4 helgarderingar). Kupongen byggs vid bygget (`hasseKupong` i
[src/tippare.js](src/tippare.js)) av det han säger vid disken (`hasse.tecken` och `hasse.resultat` i
`data/analyser.json`), utan något extra anrop till Claude:

- Hans tecken finns alltid med.
- De säkraste matcherna blir spikar: ensamt tecken och störst målskillnad i hans resultat (3–0 före
  2–1 före 1–1), vid lika det modellen tror mest på. De nästa blir halvgarderingar (hans tecken och
  det troligaste av de andra), och de osäkraste helgarderingar.
- Han tippar alla matcher. En match han inte har analyserat får det modellen tror mest på och läggs
  sist, och det gäller också om datorn som skriver analyserna inte har hunnit med någon alls.
  Misslyckas en omskrivning ligger det han sa senast kvar, och när omgången har börjat skrivs det
  han har sagt inte om ([scripts/analyser/skriv.mjs](scripts/analyser/skriv.mjs)).
- Ändras antalen i regeln följer kupongen med. Klarar en kupong inte `regelKlar` spelar han inte, hellre
  än att bryta mot regeln. **Läggs en ny förutsättning in i `regelKlar` ska `hasseKupong` lära sig den
  samtidigt**, annars står han över tills den gör det.
- Kupongen följer analyserna fram till omgångens första avspark, när var och ens egna tips också
  stänger, och står sedan kvar. Bara det han sa före matchens avspark räknas.
- Omgångar med ett annat antal matcher har ingen regel: då gäller det han har sagt, och annars det
  modellen tror mest på.

Kupongen står i `data/tippar-historik.json` som en tippare till (`HB`), och för omgången som pågår
i `hasse` i `data/tippare.json`, som sidan lägger till i poängen (`tpScore` i
[public/tippare.js](public/tippare.js)). `TP.round`, som rummet och kupongen läser, ändras inte.
Kroppen och porträttet (`public/profeterna/kropp-hasse.png`, `hasse.jpg`) ritas av
[scripts/hasse/kropp.html](scripts/hasse/kropp.html). Omgångar som var klara innan han kom med ändras inte.

### Säsongens tippare

Pallen har tre platser. Den som kommer efter dem står i en soptunna bredvid pallen (`KAMP_TUNNA`
och `.km-ute`), med namn och poäng under som de andra. Den som inte har tippat än (Hasse Backe
före sin första omgång) står där utan poäng, och på Tipsligan i tobaksaffären som *4. BACKE*.

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
        { "id": "DT", "namn": "Daniel Tejder" },
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
hackade vridningen förut. I Chrome får världen i stället ett nytt mål var tiondels sekund och
glider dit själv (`folj`, se [När datorn inte hinner med](#när-datorn-inte-hinner-med)). I WebKit (Safari, och alla webbläsare i iPhone) släpper webbläsaren
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
och foten ligger utanför scenen i fönstrets hörn;
någon meny finns inte, och föremålen leder inte ut ur rummet – det gör bara *Vanlig sida* i foten.
Så fort något ligger framme (en närbild, tv:n, tavlan, registret, videon, Hasse) står *Tillbaka* där i
stället, samma ord på samma ställe för alla saker, och lägger bort det översta som bakåtknappen (se
[Bakåt](#bakåt)). Förut var *Vanlig sida* det enda ord som syntes nära något, och det leder bort från rummet.
Tangenterna (K kupongen, T tv:n,
A anslagstavlan, R kortregistret, V videon, H Hasse, N nästa omgång ur kupongstället, G Tipsguiden och L
kvällstidningen) står inte i foten – där låg de över kupongen i
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

Medan sidan laddas syns inte den vanliga förstasidan: skripten ligger sist i sidan, så
rubriken och foten hann annars synas innan rummet var byggt. Ett litet skript i huvudet på
index.html sätter klassen `rum-vantar` på html (samma villkor som `Rum.fits`, och bara utan
adress), rum.css döljer sidan så länge klassen sitter och `showTab` i app.js tar bort den.
Kommer skripten aldrig igång syns sidan ändå efter fem sekunder. Med `#hem`, i de allra
minsta fönstren och om rum.js inte går att hämta visas den vanliga förstasidan som förut.

**Föremålen** – pekar man på ett lyser det (pokalerna också), och snabbvalet
på text-tv:n med samma ämne tänds, som när man pekar på snabbvalet med tv:n nära
(pärmarna Skyttar). Inget föremål byter sida: oraklet, skårtavlan, pokalhyllan, korktavlan,
uret, löpsedlarna i fönstret och namnet på dörren tittar man på nära (se
[Närbilderna](#närbilderna)), och tv:n, videon, anslagstavlan, kortregistret och kupongen
kommer fram var och en på sitt sätt. Föremålen är knappar utan adress (`KNAPP` i rum.js), och
Enter och mellanslag klickar på dem. En match på text-tv:n lägger fram matchbladet mitt i rummet
(se *Matchbladet* under [Kupongen i handen](#kupongen-i-handen)):

- **Omgångens orakel** (tavlan under stationsuret) → närbild: oraklet som regerar
  (`Kronan.holders`) som i Olympen och på förstasidans polaroid (`Kronan.scene`) – det
  urklippta fotot på marmorsockeln med lagerkransen (som inte glimmar här, se [När datorn
  inte hinner med](#när-datorn-inte-hinner-med)) och strålarna som vrider sig – bakom
  glaset i en förgylld ram i 3D med pärlstav, rosetter i hörnen och en palmett överst. Ett
  skimmer drar snett över glaset var elfte sekund. Mässingsskylten under säger
  *Omgångens orakel* och hela efternamnet (delat: *Laino & Johansson*, i mindre stil), och
  ramen och skylten lyser med när man pekar på dem.
- **Visitkortet** (på väggen mellan stationsuret och orakelramen, till höger om palmetten,
  fäst med ett mässingsstift och lite snett; under oraklet sitter veckans löpsedel varannan
  vecka) → närbild: Matchfixarnas visitkort på tjockt gräddvitt papper med en dubbel linje i
  terrakotta, logon och MATCHFIXARNA i guldfolie överst, i mitten våra autografer – efternamnet
  i var och ens handstil och bläck, samma som på kupongen (`sm-k0`–`sm-k2`), med en släng under
  – över var sin linje med namnet tryckt under, och längst ner devisen från Om oss: *Vi tippar
  engelsk fotboll tillsammans.* och *O det handlar om pengarna. Det har alltid handlat om
  pengarna.* (`kortHtml` i rum.js, `.rum-kort` i rum.css). Kortet ritas i sina egna mått
  (440 × 285, ungefär 85 × 55 mm) och förminskas kring stiftet till 44 × 28,5 i scenen, så att
  texten ritas skarpt nära; länken är lite större än kortet, så att det går att träffa med
  fingret.
- **Pokalhyllan** (mitt på högra väggen, över Tipsligan) → närbild: en liten pokal per
  vunnen omgång i vinnarens färg (delat = en var), ur `data/tippare.json`. Nära tonar tv:n, som annars skär in
  överst i bilden, bort del för del (`tvBort` i rum.js; opacitet på lådan själv skulle platta till den i 3D), och
  under hyllan står hur många pokaler var och en har, flest först.
- **Anslagstavlan** (under tv:n, i hörnet) → lapparna om omgångens lag (se
  [Anslagstavlan](#anslagstavlan)).
- **Kortregistret** (på disken under Tipsligan) → ett kort per lag och per möte i
  omgången (se [Kortregistret](#kortregistret)).
- **Skårtavlan** (mitt på högra väggen, under pokalhyllan) → närbild: *Tipsligan*, säsongens ställning i gänget
  – samma poäng och placering som ställningen i Olympen (`kampRounds`, med omgången som
  pågår), lika placering vid lika poäng och antal rätt. Efternamnen står där, och Johansson
  som *Dogge* (`SMEKNAMN` i rum.js); före första omgången bara namnen, i mitten. Vita
  plastbokstäver i spåren på svart filt – rubriken över hela bredden, ett tomt spår och de tre,
  med placering, namn och poäng i var sin spalt och lika mycket filt över och under – i en
  smal aluminiumram (3D). Varje bokstav sitter lite snett för sig (samma frö varje gång, så
  att inget flyttar sig), och lådan har bara fyra O – sedan blir det nollor.
- **Korktavlan** (längst ut på högra väggen, hel i bild, i en träram i 3D) → närbild: de
  färdigspelade kupongerna (`Historik.coupons`, de fyra senaste) rättade med röd penna, en med kaffering.
  Tom tills den första är färdigspelad. Nära lyfter en kupong från tavlan när man pekar på den, och ett
  klick tar den från nålen och fram som omgångens protokoll, där pilarna bläddrar till omgången före och efter –
  också de äldre som inte längre hänger på tavlan (se *Protokollen på korktavlan* under
  [Sammanställningen efter omgången](#sammanställningen-efter-omgången)).
- **Kupongen**: kupongen tas i handen (se nedan), och när den inte går att ta i
  handen går kameran fram till den på pulten (också med K).
  Kupongen är samma kupong som papperet under Kupong, i
  kupongens mått (660 × 470): bandet, under det stämpeln (vem omgången väntar på) och
  spelstoppet, namnet för hand och 1 X 2 överst, en rad per
  match i kupongens ordning med synkmarkeringen i kanten och dag, tid och serie efter lagen
  (dagens rubrik får inte plats), och i foten fälten *Tippat*, *Garderingar*,
  *Kombinationer* (eller *Pris*) och *Odds* och streckkoden med omgångens id (`Samtal.pult.top`
  och `fields`, `Papper.code`). Efter tiden står motiveringen för hand med blyerts, och
  utfallet ringas in (grönt när kupongen hade det, annars rött, streckat medan matchen
  pågår). Kupongerna är inte likadana (2026-11-09, användarens önskemål): varje kupong är sliten
  på sitt sätt – vikt på mitten, på tvären, i fyra eller med ett snett veck, en kaffering (ibland
  två), några stänk, ett tumavtryck av blyerts, ett hörn som vikts in, mer eller mindre gulnad –
  slumpat ur omgången och vems kupong det är (`slitage` och `kupNyckel` i rum.js). Ditt utkast och
  din inlämnade är samma papper, så den ser likadan ut på pulten, i handen, i högen och hos Hasse;
  gängets kupong och den nya som ligger på pulten när du har lämnat in är egna papper. På baksidan
  i högen syns vecken, hörnet och kaffet igenom, spegelvända. Det tryckta – bandet,
  synkmarkeringarna och tryckeriets rad – är likadant på alla, och slitaget är bara gradienter,
  så att rummet inte får mer att rita (förut hade alla samma kaffering och samma veck).
  På pulten ligger ditt utkast med dina kryss och motiveringar och ditt namn;
  har du lämnat in ligger din i högen bredvid och på pulten en ny – och när du
  ser de andras tips ligger gängets kupong där, med gängets kryss med kulspetspenna,
  allas porträtt i rutorna och allas namn överst (uppgörelsen). Allt man
  gör med kupongen tas i handen, utan att man lämnar rummet (se
  [Kupongen i handen](#kupongen-i-handen)). Inget ord bredvid säger vad man ska göra: kupongen
  tas i handen med ett klick på den, och har du lämnat in tas din kupong i högen på samma sätt.
  När du ser de andras tips innan matcherna har börjat står en pingklocka i mässing bredvid:
  man ringer in gänget till uppgörelsen.
- **Högen** till höger om kupongen: de som har lämnat in har lagt sin kupong där med
  baksidan upp, i den ordning de lämnade in (den senaste överst) – porträttet under ett gem,
  initialerna i personens bläck (samma som på papperet under Kupong) och stämpeln
  *Inlämnad*, men inga tecken. Din egen tas i handen, och de andras när du ser deras tips
  (se nedan). Innan dess lyfts en annans kupong bara lite i ena kanten och faller tillbaka.
- **Hasses kaffe** längst till vänster på pulten → Hasse Backe, som sitter i baren
  utanför bilden till vänster, där pulten viker av i ett hörn. Hans händer ligger korslagda på pulten, med
  underarmarna in från bildens kant, och tätt till höger om dem står koppen med blå ränder och ryker på sitt
  fat nära pultens bakre kant. Fatet
  står på hans nota, som i baren: kaffe, fyra påtår och en kanelbulle, Skrivs på Notts County
  (klubben han lämnade efter sju veckor 2009, när lönen inte kom; notan har nummer 0007). Ett klick på kaffet eller notan,
  Enter eller H och man vänder sig mot honom (`hasseHtml`, `tillHasse`, se
  [Hasse Backe](#hasse-backe)).
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
- **Namnet på dörren** (längst till vänster, under Stängt-skylten) → närbild av dörrens övre
  del: *Matchfixarna*
  i bladguld på glaset, spegelvänt inifrån som neonskylten, med TOBAK & SPEL och *Öppet
  till spelstoppet* under. I fönster som är minst 8:5 syns hela dörren, och där står namnet
  inte i menyns hörn; i smalare fönster skärs dörren av och namnet står kvar i hörnet.

Högra väggen är delad i tre fält som inte går in i varandra (`VAGG` i rum.js, som också ger
ramarna i 3D sina mått): anslagstavlan i hörnet under tv:n, i mitten pokalhyllan med
Tipsligan under – säsongen i gänget, pokalerna och ställningen – och längst ut korktavlan,
med samma överkant och underkant som anslagstavlan. Disken under följer fälten:
kortregistret står under Tipsligan, fritt från anslagstavlans nederkant, och videon och
lådan med kassetter under korktavlan. Tv:ns sladd går i en kort båge till ett uttag strax
under väggplattan, ovanför korktavlan.

**Kupongstället** står på bardisken under anslagstavlan, mellan barstolarna och kortregistret:
ett fack av plexiglas, lågt fram och högt bak, med blanka kuponger som lutar bakåt, butikens
pennor i ett rör bredvid och en lapp på plexit: *Pennorna är räknade*. Kupongerna är sajtens
kupong i telefonens smala form, som en blankett (`blankett` i rum-inredning.js): bandet med
*Matchfixarna · Tipskupong* och *Kupong*, spelstoppet, *Nr* och *Match*, tretton rader med
synkmarkeringen i kanten och rutorna 1 X 2, och tryckeriets rad längs högerkanten – samma färger
och tryck som kupongen på pulten. I en skåra i bakstyckets överkant står en tryckt skylt i
bandets färg: *Nästa omgång*. Ett klick på stället (eller N) tar en kupong för nästa omgång i
handen (se *Nästa omgång ur kupongstället* under [Kupongen i handen](#kupongen-i-handen)), och
stället lyser när man pekar på det, som de andra sakerna. Det är byggt i three.js och ses med
samma kamera och ljus som disken (`stall` och `STALL` i rum-inredning.js: platsen, vridningen
och storleken), står in mot väggen och är vänt ut mot rummet och lite mot pulten. Ljuset kommer
ungefär därifrån man ser det, så skuggan faller bakom; en mjuk skugga under foten håller det på
skivan, också utan skuggkarta. Duken ligger över tavlorna på högra väggen, eftersom stället står
framför anslagstavlan, men under kortlådan. Länken över stället (`#rum-stall`) räknas ut ur
stället i 3D – rutan kring skylten, kupongerna och foten i bild – och ligger över kortregistrets
länk där de möts, så att bara stället leder dit. Utan WebGL finns varken stället eller länken.

**Stationsuret** sitter på bakväggen till höger om fönstret och leder bara till en närbild: ett
svarvat hölje i mörk metall från väggen fram till ett glas som buktar lite, vit tavla med
svarta streck, gulnad av röken, och visarna i var sitt lager – den röda sekundvisaren
hoppar varje sekund. Det går efter Stockholms tid, med samma klocka som
utsikten (`Vader.nu()` i vader.js, annars datorns klocka). Med `?rum-t` står det still, på
`?rum-klocka` eller när sidan laddades, och med `prefers-reduced-motion` syns inte sekundvisaren.

Uret visar också hur länge det är kvar till spelstoppet, alltså den första avsparken i
omgången som gänget tippar (`stopp`, från rum.js). I ett fönster vid sexan, som
datumet i ett armbandsur, står dagarna kvar i rött (kalenderdagar i Stockholm), med DAGAR TILL
SPELSTOPP (DAG TILL) tryckt under på två rader; på spelstoppets dag står det en svart nolla. En röd spets i kanten
pekar på klockslaget, och de sista tolv timmarna fyller en röd sektor tavlan från
timvisaren fram till spetsen, så att den krymper medan tiden går. Fönstret ligger över
sektorn och under visarna. Mellan omgångarna och efter spelstoppet står fönstret tomt och
spetsen och sektorn är borta. Med `?rum-klocka` räknar uret från sin egen tid, och
`?rum-stopp=<timmar>` gäller uret också.

**Inredningen i 3D** ([public/rum-inredning.js](public/rum-inredning.js)): lysröret i taket
(en armatur med två rör och gavlar), Stryktipset målat på väggen, neonskylten, Stängt-skylten, stationsuret,
orakelramen med mässingsskylten, cigarettpaketen uppe på högra väggen (två hyllor med
paket i rader om tre till sju, som börjar bakom tv:n; påhittade färger, inga märken), ramarna kring skårtavlan
och korktavlan, kupongstället och bardisken med barstolarna (se nedan) är byggda i three.js som gänget. Neonskylten är glasrör med en
ljus kärna som följer bokstäverna i *Tobak*, spegelvänd inifrån: texten i Fraunces kursiv
tunnas ut till en linje och seriferna tas bort. Den hänger i kedjor från fönsterkarmen med
en svart list och transformatorn under, och glappar som förut. Stängt-skylten hänger lite
snett i ett snöre från en sugpropp på dörrens glas. Sakerna har framsidan där de platta
satt och kroppen tillbaka till väggen, så att sidorna syns och skuggorna faller på väggen
(inte på glaset och inte över anslagstavlan). Allt ritas med en och samma WebGL-duk, som
kopieras till en vanlig duk per sak i det plan där saken står (orakelramen i länken, så
att den lyser med); bara uret ritas om, en gång i sekunden.

**Stryktipset är målat direkt på bakväggen**, mellan taket och fönsterkarmen och lika brett som
fönstret (`malat` och `MAL` i rum-inredning.js, i takets duk): ett band i oxidrött med krämvita
bokstäver i Alfa Slab One, och en stjärna och två linjer på vardera sidan. Färgen har nötts, så att
panelens ådring och fogar syns igenom. Det är färg och inget föremål, så det har ingen kropp och
ingen skugga. Det leder ingenstans, och på natten mörknar det med lysröret.

**Gänget** sitter på barstolar runt ett runt barbord framför fönsterbänken, med benen
hängande: DL och DJ på sidorna, vända in mot bordet, och DT bakom (`BORD` och `FIGS` i
rum-3d.js). Bordet har en skiva av ljust laminat med ringar efter glasen, kromkant och en
kromfot, och barstolarna röd vinyl med söm och en krom ställning med fotring. Ölen, DT:s
askkopp och extraflaska och kupongerna står på bordet, och två tomflaskor står kvar på
fönsterbänken bakom DJ. Fram till vänster på bordet står en pennkopp formad som en fotboll,
med en gul blyertspenna med suddgummi, en röd penna och en blå kulspetspenna (`pennkopp` och
`KOPP` i rum-3d.js). Där skymmer den inget på bordet hur de än sitter, och den står inte i
vägen för tårtan. Den kostar två ritanrop: bollen, och pennorna och kanten i en geometri med
färgerna i hörnen. DL dricker ur en flaska, DT röker
och skrattar, DJ har en flaska i ena handen och pratar med cigaretten i den andra. Var och en
har sin loop (12–21 s) – flaskan till munnen med huvudet bakåt, ett bloss med
glöden som tänds och röken som blåses ut, benen som dinglar – och huvudena nickar efter
musen, med en fjäder som räknas i tid (`NICK` i rum-3d.js), så att de nickar lika fort och lika
mycket hur glest gänget än ritas (se [När datorn inte hinner med](#när-datorn-inte-hinner-med));
räknad ett steg per bild svängde de i telefonen (20 bilder i sekunden) ut en fjärdedel längre
och en och en halv gång så långsamt. Röken från glöden räknas för varje bloss ur var glöden var när det föddes, så att
samma tid alltid ger samma bild. DL och DJ blinkar ungefär var fjärde sekund, ibland två
gånger i rad, med ögonen stängda en dryg tiondels sekund (`blinkar` i rum-3d.js; DT skrattar
med ögonen stängda och blinkar inte – utom när humöret ger honom öppna ögon, se
*Ansiktena följer kupongen* nedan). Ansiktet med stängda ögon är samma ansiktsbild utan
ögonvitorna och ögonen och med det övre ögonlocket nere vid det nedre (`blundar`), och det
byts in medan ögonen är stängda. I en fast bild (`?rum-t`) och med `prefers-reduced-motion`
blinkar de inte. Det röda ljuset från neonskylten bakom dem slocknar när skylten glappar
(`neonOn` i rum.js skickas med till `draw`), så att kanterna på håret och jackorna mörknar
med skylten. Ölen är Pripps Blå i 90-talets returflaska (`bottle` i rum-3d.js): grönt glas,
marinblå folie runt halsen, ett silverband snett över axeln och en silveretikett med skeppet
i en oval mellan två lejon. Förlagan är reklamfilmen från 1992 (glaset och folien) och
flaskan SLM 31192 i Sörmlands museum (formen och etiketten; den är odaterad), och
etiketten är ritad för hand, inte en avbildning. Från första advent till tjugondag Knut står
det PRIPPS JULÖL (röd folie) och i påskveckan PRIPPS PÅSKÖL (grön folie; `ol` i
[public/rum-fika.js](public/rum-fika.js)). Allt tryck ligger på en duk och flaskorna delar
geometrierna, så en flaska kostar två ritanrop.
Var och en bär sitt lag (`LAG` i rum-3d.js): DL en stickad halsduk i Nacionals vitt, blått
och rött med BOLSO på den ena änden, Nacionals sköld på den andra och fransar längst ner,
DT ett lejonhuvud i gammal stil i kungsblått med bandet BLUES på underarmen som håller
cigaretten (Chelsea; ett lejon, inte klubbens), och DJ en blåvitt randig mössa med tofs och
IFK Göteborgs sköld isydd mitt fram på uppviket, med guldkant och BLÅ och VITT på var sin
sida, och solglasögonen uppskjutna på den. Sköldarna är ESPN:s bilder i
`public/rum/skold-nacional.png` och `skold-ifk.png` (256 px; den genomskinliga kanten skärs
bort när de laddas, och saknas en blir det bara text). Halsduken följer bålen, tatueringen
vrids med handen och mössan följer huvudet; håret trycks ner under mössan och sticker ut
under kanten. Kläderna följer vädret utanför (se *Utsikten och vädret* nedan) och högtiderna
(se *Högtiderna* nedan).

**De byter plats var tredje dag** (`PLATSER` och `placering` i rum-3d.js): DL till
vänster, DT bakom och DJ till höger den 25–27 oktober 2026, sedan DL bakom, DT till höger
och DJ till vänster, sedan DL till höger, DT till vänster och DJ bakom, och så vidare.
Dagen är Stockholms (`Vader.nu()`), så alla ser samma placering, och ingen byter plats
medan sidan är öppen – den nya syns vid nästa laddning. Platserna är en tabell: var
barstolen står och är vriden, vilken hand som är mot bordet och var sakerna står på
bordet (ölen, askkoppen, cigaretten, kupongen, handen som vilar och DT:s extraflaska), och
figuren tar sin del ur sidan (`sitt`). Den som hamnar på andra sidan byter hand: flaskan
och cigaretten är alltid i handen mot bordet, och kupongen, pennan, lejonet (med
den uppkavlade ärmen), handen som lyfts vid ett mål och den mot pannan följer med, liksom
blickarna åt sidan. Bakom bordet vilar båda händerna på bordet. Sakerna ligger minst 10
innanför bordskanten och inom räckhåll för alla tre, och när någon kikar ner mot pulten
eller sjunker ihop vid ett mål lutar hen sig utåt, så att huvudet inte hamnar framför den
som sitter bakom bordet.

**Gänget följer omgången** (rum-3d.js, med läget från `gangTv` i rum.js):

- **Den som inte har lämnat in** en öppen omgång sitter med kupongen och pennan i stället
  för flaskan och cigaretten, tuggar på pennan, sneglar på ölen och vänder på
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
  gängets kupong). Den som fick rätt lyfter flaskan (DL, DJ) eller näven (DT)
  snett uppåt, lutar sig bakåt och studsar lite. Den som tappade raden sjunker ihop med
  handen över ögonen (DL, DT) eller flaskan mot pannan (DJ). Den som inte påverkades nickar.
  Dolda resultat ger inga reaktioner, och när rummet öppnas räknas inga gamla mål.
  Var och en reagerar på ett av tre sätt, olika från mål till mål (`malV` i rum-3d.js):
  som ovan, med båda armarna i luften (rätt) eller båda händerna på huvudet och blicken i
  taket (fel), eller med handen i bordet – den dunkar av glädje eller lyfts och slår i en
  gång.

**Gängets humör följer kupongen** (2026-11-03, `spelLage` i rum.js, `HUM` och `AKTER` i
rum-3d.js). Så fort en match på gängets kupong är avgjord – också en som pågår, efter
ställningen just nu – sitter gänget efter hur det går för kupongen:

- **Glad** när kupongen går bättre än modellen väntade sig (z ≥ 0,5, samma z som betyget i
  [Kuponghistoriken](#kuponghistoriken)) eller när allt är spelat och det blev vinst. De
  lutar sig bakåt med livligare ben och huvudena gungar lite.
- **Nervös** när nästa fel tar vinsten (Stryktipset ger pengar från tio rätt av tretton,
  så tre fel är gränsen; på en kortare kupong en fjärdedel av matcherna) eller när den går
  sämre än väntat (z ≤ −0,5). De sitter framåtlutade och benen skakar.
- **Deppig** när kupongen är död – fler fel än den tål. De sjunker ihop med blicken ner
  och benen stilla.
- **Som vanligt** när det går som väntat. Utan avgjorda matcher, med dolda resultat och
  mellan omgångarna gäller dagen efter (se nedan): bra är glad och illa deppig.

Humöret glider över på 2,5 sekunder. Det syns också i **påhitten**: korta rörelser som var
och en gör ibland, en i taget, i luckor om elva sekunder (förskjutna, så att de inte börjar
samtidigt), utan att de vanliga looparna (klunken, blosset, pratet) är i vägen. Vilket
påhitt och hur ofta beror på humöret (`MENY`):

- **Som vanligt** (ungefär fyra luckor av tio): sträcker på sig och gäspar, kliar sig i
  bakhuvudet, trummar med fingrarna på bordet, tittar ner i den tomma flaskan,
  vilar hakan i handen.
- **Glad** (tre av fyra luckor): lutar sig bakåt med handen i nacken, gungar i takt med
  ölen i luften, sträcker på sig.
- **Nervös:** biter på naglarna, knäpper händerna framför munnen (om flaskan)
  och gungar fram och tillbaka, trummar med fingrarna, kliar sig i bakhuvudet.
- **Deppig:** hakan i handen, skakar på huvudet och suckar, armarna i kors med blicken bort
  från bordet, tittar ner i flaskan – och DJ lägger pannan i bordet några gånger.

Den som leder omgången på sina egna tips lutar sig oftare bakåt med handen i nacken, och den
som ligger sist sitter oftare med armarna i kors (när allas tips syns och minst tre matcher
är avgjorda; delad ledning eller jumboplats räknas inte). Inga påhitt medan man väntar på
kupongen, i sömnen och medan man vaknar, vid ett mål eller när man skålar med den som pekar på en, och det som
pågår när humöret ändras gör färdigt sitt. Samma tid ger samma bild: luckorna och valen
räknas ur klockan, och humöret minns när det ändrades.

**Ansiktena följer kupongen** (2026-11-08, [public/rum-uttryck.js](public/rum-uttryck.js),
`ansikten` i rum-3d.js och `senastAv` i rum-folk.js). Hur glada de ser ut beror på hur gängets
senaste kupong gick, ända tills nästa är spelad. Blev det vinst (tio rätt av tretton på
Stryktipset, en fjärdedel fel på en kortare kupong, som humöret ovan) är de glada, och de jublar
när betyget i [Kuponghistoriken](#kuponghistoriken) är Bra eller Utmärkt eller det blev högst
ett fel av tretton. Utan vinst är de nöjda om kupongen ändå gick bättre än väntat (Bra eller
Utmärkt), sura när den gick som väntat och deppiga när den gick sämre (Svagt eller Mycket
svagt). Medan en omgång spelas går den före: glada när den går bra, oroliga när nästa fel tar
vinsten och deppiga när den är död. När allt är spelat räknas läget som i historiken, också innan kupongen
har kommit in där (`ansikte` i `spelLage`). Med dolda resultat och utan historik ser de ut som
bilderna är ritade.

- **Jublar:** munnen öppen i ett skratt, ögonbrynen uppe och kinderna som trycker upp ögonen
  (DT skrattar som han är ritad, med ögonen hopknipna).
- **Glad:** DL ler med tänderna och DJ i skägget, som de är ritade, och DT har öppna ögon och
  ett brett leende med tänderna.
- **Nöjd:** munnen stängd i ett litet leende.
- **Sur:** munnen rak och nedåt i mungiporna, ögonbrynen ihopdragna med en rynka emellan och
  ögonlocken lite tunga.
- **Deppig:** munnen nedåt, ögonbrynen uppåt inåt, tunga ögonlock, påsar under ögonen och
  nästan ingen rodnad på kinderna.
- **Orolig:** läpparna ihoppressade och ögonbrynen uppåt inåt, med rynkor i pannan.

Ansiktsbilderna (`rum/ansikte-*.svg` och DJ:s mun i `rum/skagg-dj.svg`) görs om i webbläsaren
för läget (`uttryck` och `skaggUttryck`): munnen och vecken runt den ritas om, ögonbrynen vrids
kring ytterändan, ett ögonlock i hudens färg läggs över ögat och rodnaden tonas ner eller upp.
Ögonen har samma uppbyggnad som förut, så att blinkningen (`blundar`) görs av det nya ansiktet.
Bilderna för läget byggs när det ändras (sju till som mest: ansiktena, deras blinkningar och
skägget) och de förra släpps; skrattar de åt ett skämt är det de vanliga skrattbilderna.

**Gänget gör saker tillsammans** (2026-11-06, `GRUPP` och `roller` i rum-3d.js): var 31:a
sekund kan det bli något som alla tre gör, med chansen efter humöret – ungefär två gånger av tre
som vanligt, nästan nio av tio när det går bra, tre av tio när det är nervöst och sällan när
kupongen är död. Vem som börjar, vem som svarar och hur var och en skrattar räknas ur luckan:

- **Skämtet** (alla lägen): en lutar sig in och berättar med handen och blicken på de andra,
  en i taget, medan de lutar sig in och lyssnar (någon med hakan i handen). Vid poängen slår
  hen ut med handen, det är tyst ett ögonblick – och sedan skrattar alla i fem sekunder, var
  och en på sitt sätt: handen som dunkar i bordet, dubbelvikt med handen på magen, handen för
  pannan eller pekar på den som skämtade. Huvudet åker bakåt, ansiktet vänds ut från bordet
  så att skrattet syns, bålen skakar, och ögonen kniper ihop sig till bågar med skrattrynkor,
  som på DT, med munnen vidöppen – DL:s leende byts mot ett skratt och DJ:s mun öppnar sig i
  skägget (`skrattar` och `skaggSkratt`: ansiktsbilderna görs om när rummet laddas, `skrattW`).
- **Grälet** (som vanligt och nervös): två pratar i munnen på varandra med handen som hackar
  i luften, och den som lyssnar skakar på huvudet; den tredje tittar från den ena till den
  andra som på tennis. Till sist viftar den ena bort det, den andra sätter sig med armarna i
  kors och tittar bort, och den tredje skrattar eller skakar på huvudet.
- **Tv:n** (som vanligt och nervös): en pekar upp på tv:n, de andra vänder sig dit en efter en
  och tittar en stund; sedan nickar den ena och den andra rycker på axlarna.
- **Skålen** (som vanligt och glad) som förut.
- **Allsången** (glad, 2026-11-08, `SANGER`, `sangVal` och `AKTER.allsang…` i rum-3d.js): de
  sjunger för full hals med munnen öppen och ögonen hopknipna (skrattbilderna), en fras per
  gungning med ett andetag emellan, på ett av fem sätt som lottas ur luckan:
  - *Gungar* (`allsang`): alla gungar i takt med ölen i luften (DT med handen) och tittar på
    varandra, och den sista tonen hålls ut med ölen högre upp och huvudet bakåt.
  - *Försångaren* (`allsangFor`, bara när alla tre är vakna och har lämnat in): en lutar sig in,
    börjar sjunga och slår takten med ölen medan hen tittar på de andra; de tittar på hen och
    faller in en i taget. När alla har gungat en stund möts ölen över bordet – skål! – och de
    tar en klunk (DT ett bloss).
  - *Trumman* (`allsangTrumma`): den lediga handen slår i bordet i takt, allt fortare, med
    huvudet som nickar och benen som sparkar och ett "hej!" vid varje slag; sedan åker båda
    armarna upp, alla vrålar och studsar på stolen.
  - *Armarna* (`allsangArmar`): vågen går två varv runt bordet från vänster, och sedan har alla
    armarna i luften och vajar i takt tills den sista tonen hålls ut med armarna som skakar.
  - *Mot tv:n* (`allsangTv`, bara när matcherna pågår, och då oftare än de andra): alla vänder
    sig mot tv:n och sjunger åt planen, framåtlutade med ölen uppe och den lediga handen som
    pekar på rutan i varje slag – och till sist båda armarna upp.

  Prova med `?rum-akt=dl:allsangTrumma,dt:allsangTrumma,dj:allsangTrumma` (alla tre, som de
  andra påhitten som gänget gör tillsammans).
- **Zen-stunderna** (som vanligt och glad, och nervös bara andningen och tystnaden; 2026-11-09,
  `ZEN`, `zenVal` och `AKTER.zen…` i rum-3d.js): de sitter bara och har det lugnt, på ett av fem
  sätt. Samma sätt kommer inte tillbaka förrän tre andra har varit (`ZEN_K` minns vilket sätt
  varje lucka fick), och vem som börjar, kikar eller somnar räknas ur luckan som i skämtet:
  - *Andningen* (`zenAndas`): flaskan och cigaretten ställs ner, händerna läggs med handflatan
    uppåt på bordet och tummen mot pekfingret, och med rak rygg och slutna ögon tar de tre djupa
    andetag i takt – bröstet och axlarna upp och huvudet som lyfts. Mitt i öppnar en ögonen,
    kikar på de andra och blundar igen.
  - *Dagdrömmen* (`zenDrom`): bakåtlutade med händerna flätade i nacken, blicken som vandrar i
    taket och benen som dinglar sakta. En slumrar till, huvudet sjunker, och hen vaknar med ett
    ryck och tittar sig omkring; en annan tittar på hen och skakar på huvudet, och den tredje
    blundar en stund.
  - *Rökringarna* (`zenRingar`, `ringar` i rum-3d.js): DT och DJ tar ett djupt bloss var, med
    glöden som lyser upp, och blåser tre rökringar, en i taget. Ringarna glider fram åt det håll
    huvudet var vänt (den som sitter bakom bordet vrider huvudet åt sidan och bakåt, så att de inte
    far över ansiktet), saktar in, stiger, vidgas och bleknar, och de andra följer den senaste med
    blicken. DL, som inte röker, petar sönder den sista med pekfingret, och sedan tittar hen och
    den som blåste den på varandra. En ring är en genomskinlig skiva vänd halvvägs mellan det håll
    den far och betraktaren, så att den syns snett men aldrig från kanten; var munnen var när den
    blåstes räknas en gång, som röken.
  - *Vaggningen* (`zenVaggar`): sakta från sida till sida med slutna ögon, som till en låt bara de
    hör, med huvudet på sned, benen med och den lediga handen som flyter i luften. En börjar, de
    andra tittar på hen och faller in en i taget, och efteråt tittar de på varandra och nickar.
  - *Tystnaden* (`zenTyst`): blicken ut i fjärran, var och en åt sitt håll förbi den som tittar,
    en djup suck tillsammans med axlarna upp och ner, och en klunk var (DT ett bloss och röken ut),
    en i taget.

  Händerna med fingrar (tummen mot pekfingret, flätade i nacken, pekfingret) är samma hand som i
  tecknen och dansen (`fing` i påhitten, `aktFingrar`), och det som var i handen står på bordet så
  länge. I en fast bild (`?rum-t`) har bara DJ ett ansikte med slutna ögon, som annars. Prova med
  `?rum-akt=dl:zenRingar,dt:zenRingar,dj:zenRingar`.

**Sången efter ett mål** (2026-11-08, `malSang` och `tvingad` i rum-3d.js): när ett mål har gått
någons väg (`mal` med någon som fick rätt) börjar grabbarna sjunga 3,2 sekunder efter målet, när
jublet ebbar ut – gungar, trumman, armarna eller (när matcherna pågår, och oftast) mot tv:n. Den
som tappade raden sjunger inte med utan sitter med armarna i kors. Det går före allt annat: det som
pågår tonar bort, och inget annat börjar så länge (`tvingStart`). Ett mål som bara sänkte någon ger
ingen sång. Prova med `?rum-mal=dl:1,dt:-1,dj:0&rum-t=6`.

**Radion** (2026-11-08, [public/rum-radio.js](public/rum-radio.js) för band, stationer, ljud och reglage, och
`kassettradio`, `radioRita`, `radioSang` och `narbild` i rum-3d.js för apparaten): en kassettradio i
leksaksstorlek – borstad aluminium och svart front, två högtalare med galler i kromringar, kassett bakom glas,
stationsskala, åtta lysdioder, volymratt, POWER-knapp, bandspak, stationsspak, handtag med grepp och antenn – står
på fönsterbänkens högra ände, under löpsedlarna, där inget annat står hur de än sitter (DJ:s tomflaskor står till
vänster om den). Den valdes bland fyra utseenden (transistorradio, bakelitradio, bergsprängare och fotbollsradio).
Ett klick på den går fram till den (`SAKER.radio` i rum.js), och där sitter genomskinliga reglage över delarna:
POWER (sätter på och stänger av, går in och stannar där, och en lampa över den lyser), bandspaken (ett tryck slår
över den, och den går också att dra upp till FM och ner till AM; är radion av flyttas bara spaken),
stationsspaken (sitter under skalan på samma ställe som visaren: griper man om kulan stannar den där man tog tag i
den, och trycker man på skenan går den dit), skalan själv (visaren följer fingret), volymratten, hjulet och
piltangenterna. Radion är av när man kommer, och POWER sätter på den där den stod.

Skalan lyser med en glödlampa som tänds mjukt, och den valda bandraden lyser starkast. Samma visare går över
båda banden, som på en riktig radio, så ett byte av band hamnar sällan på en station. Släpper man nära en
station drar radion in den, och en liten röd lampa säger att den stämmer. Mellan stationerna hörs brus, på AM
också knaster och en pipton som sjunker tills man står rätt. När stationen väl hörs är det rent, också på AM och
också om strömmen hackar till (då blir det tyst en stund, `A.fick`). AM låter dessutom som AM: smalt band och långsam
fading, som också syns på lampan. Lysdioderna och högtalarna följer det som faktiskt hörs (en analysator i
Web Audio). Stationerna står för hand på maskeringstejpen vid skalan (FM ovanför i blått, AM under i rött): varje
namn mitt över sin frekvens, närmast skalan, och bara när grannen står för nära i raden längre ut, med ett streck
ned till frekvensen (`tejpPlats`). Ett tryck på ett namn går dit, byter band om det behövs och sätter på radion
(`radioEtikett` i rum-3d.js, som hittar namnet under fingret). Frekvenserna står på ett blad ur ett litet
spiralblock som är tejpat på fönsterkarmen till höger om radion, mellan radion och veckans löpsedel (`radiolapp` i
rum-inredning.js, en egen duk i bakväggens plan, så att det sitter fast på karmen när rummet vrids). Bladet är i
3D: rivet ur spiralen med halva hål, blå linjer och röd marginal, vikt en gång, två bitar gulnad tejp överst, och
nedtill släpper det från karmen (mest i hörnet) med en skugga under. Papperet har samma struktur som allt papper
på sajten (rum/papper.webp), fibrer och en kaffering, och mörknar med rummet när lysröret släcks. Bladet är lagom
för tio stationer och sitter fritt från antennen. Allt står i en spalt, en rad per linje: *FM MHz* med ett streck
under och FM-stationerna i blått, en tom rad, och *AM kHz* med AM-stationerna i rött, med samma pennor som på tejpen.
Frekvenserna står till höger i en egen kolumn, så att de står rakt under varandra, och linjerna står så tätt som
stationerna kräver (`PLAN` i `radiolapp`). Namnet står som stationen heter, utan frekvensen en gång till
(*890 Sport*), och den station som hörs ringas in med pennan (ett streck i 3D, `nu`). Nära
radion kommer bladet med i bilden (`RumRadio.ram`, `med` i `SAKER` i rum.js: radion och bladet mäts med rummet
rakt). Där ligger genomskinliga knappar över raderna (`lappen` i rum-radio.js) när de är minst 14 px höga: ett
klick går dit och sätter på radion. Är de mindre (telefonen) går ett tryck på bladet fram till det
(`SAKER.radiolapp`: bara bladet, och Tillbaka går till radion igen). Ett klick på bladet i rummet går också dit,
vilket på en datorskärm är samma bild som radion. Första gången står
visaren på Italo Disco. Visaren och volymen sparas i webbläsaren, och radion är var och ens egen: den syns inte
hos de andra och stängs av när man lämnar rummet.

Gänget dansar och sjunger bara till musik (`musik` i `KANALER`), inte till brus eller prat: något nytt var
fjortonde sekund, två danser och en sång om vartannat, var för sig i en ordning som blandas om varje varv
(mot tv:n bara när matcherna pågår, försångaren och tv-studion bara när alla tre är vakna och har lämnat in).
De slutar först fyra sekunder efter att musiken har försvunnit, så att den som vrider på ratten inte får dem att
börja om. Noter stiger ur radion så länge, stilla med minskad rörelse. Den som väntar på kupongen eller är borta
är inte med. Den som sover vaknar av musiken (se *Sömnen* nedan) och kommer med allt eftersom hen piggnar till.
Ett mål går före radion.

Radion står i gängets duk, som är ritad för hela rummet. När kameran är framme ritas bara det som syns av duken,
i närbildens skärpa (`narbild`), och duken läggs över just den delen: gänget står kvar och rör sig, och rummet
kostar mindre än på håll (en fjärdedel av trianglarna, uppmätt 2026-11-08). Skalans, tejpens och
kassettens dukar ritas om större första gången (`radioFin`), och de små delarna ritas bara på väg fram och nära
(`radioDetalj`). Radion kostar 2 % fler ritningar i rummet än bergsprängaren. `?rum-sak=radio` visar närbilden
och `?rum-radio-lage=fm:90.4` hur den står inställd, utan ljud; `?rum-radio`
sätter på gänget och lysdioderna (`=4` sedan fyra sekunder, med `?rum-t`), också det utan ljud.

**Dansen** (2026-11-08, `DANSER` i rum-dans.js, `dansPose`, `dansHand` och `dansFingrar` i rum-3d.js):
italodisco som i de italienska tv-programmen runt 1980, sittande på barstolen, i 120 slag i minuten
(takten är genrens och inte låtens: högtalarna och lysdioderna följer ljudet, men dansen följer inte en ljudström). Det som är i händerna ställs på bordet och
tas upp igen, som i korstecknet, och skyltarna läggs på bordet så länge radion spelar.
- *Härmleken* (`italoLek`): sex av nio påhittade gester, två sekunder var och i en ny ordning varje
  gång: sover, vinkar, liftar, simmar, åker skidor, sprejar deodorant, spänner musklerna, kör bil och
  tutar, och kastar en kyss. Den tredje är alltid ett slag efter.
- *Fingret* (`italoPek`): upp i luften och ner över kroppen, höger, vänster och om vartannat.
- *Armrullen* (`italoRull`): underarmarna runt varandra, i mitten och åt båda hållen, och fingrarna upp.
- *Synten* (`italoSynt`): tangenter ingen annan ser, med stängda ögon och ett långt finger uppifrån.
- *Robotten* (`italoRobot`): stel i kroppen, ett läge i varje slag och huvudet som knycker.
- *Axlarna* (`italoAxlar`): knäpper med fingrarna och skakar på axlarna, och ibland samlade
  fingertoppar framför sig, som om någon just har sagt något dumt.
- *Armarna i kors* (`italoTuca`): axeln, axeln, huvudet, huvudet, fram, fram och två klappar.
- *Tv-studion* (`italoStudio`): en sjunger i flaskan med handen på hjärtat, de andra klappar och
  pekar till sist på sångaren.
- *Barstolen* (`italoSnurr`): ett varv på stolen, en i taget och sist alla tre.

Allt står i bildens axlar (`bildAxlar`), så att dansen ser likadan ut var de än sitter. Prova en dans med
`?rum-akt=dl:italoPek,dt:italoPek,dj:italoPek`, och i en fast bild `?rum-t=5&rum-akt=dl:italoRobot@3` (tre
sekunder in).

Stationerna är riktiga webbradiokanaler (`KANALER` i rum-radio.js), tio stycken: de som hör hemma i
tobaksaffären (italodiscon som gänget dansar till, svensk radio, IFK:s Göteborg, DL:s Nacional och engelsk
fotboll). De svenska ligger på sina frekvenser i Stockholm och Göteborg, AM-bandets på mellanvågen där de sänder
eller har sänt:
- *FM:* Italo Disco 90,4 (laut.fm), P1 92,4, Guldkanalen 80-tal 93,7, Rockklassiker 97,7, P3 99,3,
  P4 Göteborg 101,9 och Rix FM 106,7.
- *AM:* Sport 890 (Montevideo, DL:s Nacional), talkSPORT 1053 (engelsk fotboll) och Radio Caroline 1159.

Stod visaren på en station som inte finns kvar (den sparas i webbläsaren) börjar den på Italo Disco igen.

Adresserna går direkt till servrarna, eftersom ljudet går genom Web Audio och en omdirigering utan CORS-svar då
inte går att spela (`live1.sr.se`, `stream.laut.fm`). Slutar en adress svara provas reservadressen (där det
finns en) och sedan samma adress utan Web Audio, utan AM-ljud och med lysdioderna i dansens takt. Därefter är det
brus och ett nytt försök om en stund. Alla spelade i Chrome 2026-11-08 på Mac (`A.klar` och att tiden gick). Ljudet
måste sättas igång av ett tryck, och det gör reglagen och lappen. Stationerna hämtas först när visaren står på
dem, och släpps fem sekunder efter att den har lämnat dem. Låtarna är kanalernas; sajten visar inte vad som spelas.

Skämtet, grälet, tv:n och zen-stunderna kommer bara när alla tre har lämnat in och är vakna och
matcherna inte pågår, och inte medan någon är borta (nedan). Ingen gör något eget påhitt samtidigt.

**Någon går iväg** (2026-11-06, `gaNu`, `stalle` och `VAGAR` i rum-3d.js): ungefär var tredje
minut kliver någon ner från barstolen och går ut ur bilden till vänster, mot baren där
Hasse sitter, med flaskan eller cigaretten i handen, och kommer tillbaka efter 5–14 sekunder,
klättrar upp med ett skutt och tar en klunk (DT ett bloss). Golvet ligger bakom pulten, så den
som går syns från midjan och uppåt, med axlarna som gungar och den lediga armen som pendlar;
höjden räknas efter djupet (`golv`), så att benen alltid är under pultens kant också när kameran
lutar. Vägen går efter var man sitter: från vänster rakt ut, bakom bordet förbi den som sitter
till vänster, och från höger bakom den som sitter bakom bordet och sedan förbi den till vänster.
Stolen och det som står på bordet står kvar (`gaFlytta` flyttar tillbaka allt som har
`userData.fast`), de andra tittar efter hen och när hen kommer tillbaka, och ett klick där hen
går går igenom. Gänget gör inget tillsammans medan någon är borta, och ingen går medan någon
väntar på kupongen, sover eller just har vaknat, när matcherna pågår, medan gänget gör något tillsammans eller med
minskad rörelse. Duken som gänget ritas i går därför ända ut till scenens vänsterkant (1440 ×
560 från vänster, `.rum-3d` i rum.css), så att man går ut ur bilden och inte ut ur duken
framför dörren; kameran ritar den del av en bild med mitten i scenens mitt som duken täcker
(`setViewOffset`), så att allt annat står där det stod. Om någon går iväg i en lucka avgörs när
luckan börjar och står fast, så att en promenad går färdigt fast läget ändras.

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
tittar hen på en och skålar: lyfter flaskan (DL, DJ) eller cigaretten (DT) mot en
och nickar, och tittar kvar tills man slutar peka. I telefonen gör ett tryck på figuren
samma sak en stund. Den som väntar på kupongen tittar bara, och ett klick på en figur går
inte vidare till det som står bakom.

**Korstecknet** (2026-11-08, `KORS`, `KORS_MENY` och `korsChans` i rum-tecken.js, `korsHand`
i rum-3d.js, `avspark` i `gangTv` i rum.js): inför matcherna korsar sig gänget ibland. Var och en
kan alla sju sätten (`korsa`, `korsaKvickt`, `korsaKyss`, `korsaTre`, `korsaVilsen`, `korsaTumme`,
`korsaSak`), men DL gör det oftast ordentligt, DT slarvar och DJ är osäker på axlarna. Ibland
smittar det (`korsaSmitta`): en börjar, de andra tittar och gör det fort efteråt. Chansen följer
timmarna till nästa avspark i omgången: inget tidigare än ett dygn före, sedan ett kors ungefär var
fjortonde minut, var fjärde de sista tre timmarna och var tredje den sista kvarten. Det är alltid
högerhanden, och en flaska eller cigarett i den blir kvar på bordet så länge. Armarna töjs inte och
når inte runt det stora huvudet, så handen stannar framför ansiktet i stället för på pannan. Prova
med `?rum-akt=dl:korsaKyss` (`?rum-stopp=0.2` låtsas att avsparken är om tolv minuter).

**Klicka på någon i gänget** (`valj` i rum-folk.js, `tecken` och `vald` i rum-3d.js,
[public/rum-tecken.js](public/rum-tecken.js)): ett klick eller tryck på en figur ger två saker.

Hen gör ett tecken mot en, ett nytt varje gång och inte samma två gånger i rad: först hang
loose och tummen upp, sedan peace, pistolfingrar, rock, honnör, knogarna, kockens kyss och
vinkning i en ordning som blandas om varje varv (`nasta`, gemensamt för gänget). Tecknet står
i betraktarens axlar, så att det ser likadant ut var figuren än sitter och syns framifrån
fast figuren är vänd mot bordet. Vantarna har inga fingrar, så handen byts mot en med riktiga
fingrar (`fingerHand`: fyra fingrar i två leder och tummen, 1 740 trianglar av gängets
256 000) när armen är på väg upp, och den är lite större än de andra, som på en leksaksfigur,
för att tecknet ska synas i rummet. Den byggs först när den behövs och ritas bara medan
tecknet pågår, drygt två sekunder. Medan man väntar är det handen med pennan, och pennan går
bakom örat så länge; annars är det den lediga handen, och DJ:s cigarett ligger på bordet så
länge. Ett klick till medan det pågår byter tecken utan hopp. Figuren tittar på en,
påhitten vilar, och flaskan skålar som förut när man pekar. Den som sover
vaknar i stället (se *Sömnen* nedan). Med minskad rörelse står tecknet som en bild en stund.
I telefonen glider rummet så att den man tryckte på hamnar mitt i bild om hen stod långt ut
(`visa` i rum.js), annars kunde handen hamna utanför.

Går kupongen att fylla i och figuren inte har lämnat in blir du också hen – samma val som
namnen på kupongen (`Samtal.pult.vem`), och utkastet följer med. Pennan på pulten skriver
namnet på kupongen på pulten (`Rum.skriv`, `skrivNamn` i rum.js), i personens bläck och egen
handstil: Laino i Cedarville Cursive, Tejder i Mr Dafoe och Johansson i Reenie Beanie. Det
ersätter porträtten överst på kupongen här i rummet; på papperet under Kupong är de kvar.
Stämpeln och pingklockan ritas om efter vem du är. Den som valdes lyfter kupongen mot en och
sprattlar med benen medan de andra vänder sig mot hen, och efter två sekunder lutar hen sig
över kupongen och skriver ivrigt, rad för rad, innan hen efter knappt sex sekunder är
tillbaka i väntan. Sidan kopplar upp sig mot profeterna-rummet på nytt, så att de andra ser
vad du pekar på (`vemKoll`). Du byter genom att klicka på någon annan; förut valde bara den
egna figuren, men nu är det klicket man byter med. Har du lämnat in, eller har hen gjort det,
blir det bara ett tecken.

**Natten** (`natt` i rum-3d.js och rum-inredning.js, `.natt` i
[public/rum-folk.css](public/rum-folk.css)): lysröret dämpas långsamt från elva på kvällen och är släckt
från midnatt till sex, Stockholms tid, och tänds sedan lika långsamt tills det lyser fullt klockan sju
(2026-11-09, användarens önskemål, så att gänget sover i mörkret; förut släcktes det vid midnatt och blinkade
igång klockan sex). Hur släckt det är (`nattGrad` i rum-folk.js, 0–1) räknas om varje minut: mörkret
(`--natt-grad` på `.rum-mork`), ljuset på gänget (`nattW` i rum-3d.js, som glider dit på 2,5 sekunder) och
rören, reflektorn, det målade bandet och bardisken (rum-inredning.js) följer det. Rummet är mörkt utom där gatan lyser in genom fönstret och dörren, från
tv:n och lite över pulten (samma lager som när lysröret tänds, med en annan mask), och
rören och reflektorn i taket är grå, och text-tv:n lyser svagt blått på gänget (som sover, se
nedan; den som är vaken tittar på den). Nära tv:n, videon,
en sak och med kupongen i handen är mörkret borta. Den som kommer in medan lysröret är dämpat eller
släckt får inget lysrör som tänds.

**Sömnen** (2026-11-09, användarens önskemål; `somn`, `SO`, `VAK`, `sovStil`, `sovKropp`, `VAKNA` och
`groggW` i rum-3d.js, `arSomn` i rum-folk.js): mellan 22.30 och sju, Stockholms tid, sover gänget – också
den första halvtimmen, när lysröret är tänt, och medan det dämpas och tänds. Står sidan öppen klockan 22.30 somnar de en i taget
(DL först, sedan DJ och sist DT): ögonlocken blir tunga, huvudet faller och rycker till några gånger, och
sedan sover de. Var och en sover på sitt sätt och rör sig nästan inte, men andas i sin takt och gör något
eget då och då:
- **DL** sitter med huvudet bakåt och armarna i kors över magen, flaskan i famnen; huvudet rullar ibland
  sakta åt sidan och ligger där en stund, och en fot rycker till.
- **DT** sitter med hakan mot bröstet. Huvudet sjunker sakta i knappt tjugo sekunder tills han rycker till
  och det kommer upp en bit, och kroppen vajar lite. Cigaretten har brunnit ner – ingen glöd, ingen rök.
- **DJ** ligger fram över bordet med huvudet på armarna, vänt utåt, och flaskan ställd på bordet. Ryggen
  häver sig när han andas, och ungefär var tredje minut rättar han till sig: axlarna upp och huvudet som
  vrider sig och lägger sig igen. En hög högtidsbonad tar han av sig.
- Den som inte har lämnat in har somnat med kupongen i handen: hen håller den löst framför magen, lite
  lägre och mer lutad än vaken, med pennan kvar på den, och sitter med hakan mot bröstet som DT.

Ögonen är stängda, och ansiktena är trötta och bakfulla: tunga ögonlock, påsar under ögonen, blek och
munnen lite nedåt (`trott` i rum-uttryck.js; DT får då öppna ögon, som han annars inte har). Ur var och en
stiger små z, ett per utandning: DT:s större och tätare (han snarkar), DJ:s långsamt och DL:s små (`zRita`).
Bilderna av de trötta ansiktena byggs första gången någon sover eller vaknar och släpps en minut efter att
ingen behöver dem (`TROTT`).

**Det som väcker dem** är radion (alla, en i taget), matcher på tv:n (alla), ett klick på någon (bara hen;
i stället för ett tecken), en kupong som lämnas in mitt i natten (den som lämnade in) och morgonen klockan
sju (alla, en i taget). Var och en vaknar på ett av tre sätt, olika när de vaknar samtidigt:
- *Med ett ryck* (`ryck`): sätter sig upp med ett skutt, tittar sig förvirrat omkring med öppna ögon,
  gnuggar sig i ögonen och skakar liv i huvudet.
- *Sakta* (`strack`): lyfter huvudet, sträcker på sig med armarna i luften och gäspar stort med munnen
  vidöppen och ögonen hopknipna, och skakar på huvudet.
- *Bakfull* (`bakis`): lyfter sakta huvudet och håller handen mot pannan en lång stund med ögonen stängda
  (DJ den kalla flaskan), och tar sedan en återställare ur flaskan (DT ett bloss på den slocknade cigaretten).

Efter uppvaknandet (åtta sekunder) är de groggy i drygt tjugo sekunder: framåtlutade med tunga ögonlock och långsamma
blinkningar, huvudet som sjunker och rycker upp allt mer sällan och slappa ben. Under tiden växer det vanliga
fram – klunkarna, blossen, pratet, påhitten och dansen till radion – tills de är som vanligt. De håller sig
vakna så länge radion spelar eller matcherna pågår och två och en halv minut efter det senaste (eller efter
klicket), och somnar sedan om på samma sätt som klockan 22.30. Ett nytt klick håller den vakne vaken längre.
Den som sover tittar inte dit man pekar och skålar inte. Med minskad rörelse är de vakna direkt.

**Dagen efter** (`efter` i rum-3d.js): dagen efter och dagen därpå att gängets kupong
spelades färdigt (Stockholms dag) syns det vid bordet hur det gick, efter betyget i
historiken. Gick det bra (Bra eller Utmärkt) står en prinsesstårta framme på bordet – grön
marsipan med florsocker, en rosa ros och en bit redan uppäten, så att botten, sylten,
krämen och grädden syns i snittet – och omgångens orakel har en papperskrona i guld med
glaspärlor (på mössan om det är DJ). Gick det illa (Svagt eller Mycket svagt) ligger DT:s
extraflaska omkullvält i en pöl och kupongen sönderriven i askkoppen, med ett par bitar på
bordet. Däremellan, och med dolda resultat, syns inget. (En barstol som vält syns inte:
golvet ligger bakom pulten.)

**Högtiderna** ([public/rum-fest.js](public/rum-fest.js), `festen` och `drakt`): runt de stora
högtiderna klär gänget sig för dem, några dagar före och efter, så att det inte bara gäller en
dag. Dagen är Stockholms, som ölen och fikat, och kommer en ny högtid medan sidan är öppen byter
de om (`ute`, som när vädret ändras).

- **Lucia** (12–14 december): vita linnen. Den som sitter bakom bordet bär luciakronan – lingonris
  med röda bär runt en mässingsring och sju levande ljus vars lågor fladdrar (`tick`) och lyser –
  och de två på sidorna stjärngossestrutar av papper med guldstjärnor, guldkant och en stjärna i
  toppen.
- **Jul** (20–28 december): tomteluvor i röd filt med vit pälskant, och toppen som faller ner på
  den sida som syns med tofsen vid kinden. Stickade jultröjor – DL röd, DT grön och DJ marinblå –
  med resår, sicksack, två renar mot en gran mitt fram, snöstjärnor på sidorna och en rad stjärnor
  upptill, stickat maska för maska (`jultroja`), och prickar på ärmarna.
- **Nyår** (29 december – 2 januari): kavaj i sammet (DL midnattsblå, DT svart och DJ vinröd) med
  slag i det mörkare, vit skjorta med kragsnibbar och knappar och en fluga i svart satin.
  Partyhattar i folie med ränder i spiral och en tofs av strimlor (DL guld, DT silver och blått,
  DJ svart och guld), och konfetti på axlarna, i håret och över bordet med några serpentiner.
- **Påsk** (onsdagen före skärtorsdagen till tisdagen efter annandag påsk): påskkärringar med
  huckle knutet under hakan med två snibbar – DL rött med vita prickar, DT gult med blommor och DJ
  blårutigt – och målade röda kinder och fräknar. Mönstret ritas i huvudets vinklar, så att
  prickarna och blommorna är lika stora överallt; öronen är under hucklet.
- **Midsommar** (onsdagen till söndagen kring midsommarafton): blomkransar av blad, prästkragar,
  blåklint, smörblommor och klöver, tätast över pannan.

Vid lucia, jul och nyår byter de om helt – jackorna är av, det är fest inne – och har långbyxor;
DT kavlar ändå upp ärmen med lejonet. Vid påsk och midsommar har de kläderna efter vädret och bara
det på huvudet. Det på huvudet ersätter DJ:s mössa, och håret trycks ner under kanten som under
mössan. Solglasögonen sitter uppskjutna på tomteluvan och hucklet, i håret med partyhatten och är
av med struten, kronan och kransen (på näsan när solen skiner, som vanligt). Oraklet dagen efter en
bra omgång bär papperskronan i stället för högtidens (figuren byggs om när kronan kommer eller går),
och DJ tar av sig struten, kronan och partyhatten när han somnar med huvudet på bordet. Blad,
blommor, bär, ljus och konfetti är sammanslagna till ett nät per sak, så att det blir få ritanrop.

**Askkoppen, snusdosan och fläkten** står på pulten till höger om högen, i three.js som
gänget ([public/rum-saker.js](public/rum-saker.js), med en egen duk i pultens plan): en
askkopp i bärnstensfärgat glas med tre spår, aska och fimpar, där en cigarett ligger i ett
spår och ryker; en öppen dosa lössnus med locket bredvid, lutat mot dosan eller upp och ner;
och en gulnad bordsfläkt med blå propeller, galler och en remsa av en gammal kupong som
fladdrar. Fläkten står där bara när det är varmt i Stockholm: när det känns som 21° eller
mer, samma gräns som gängets tunnaste kläder (vädret från vader.js, läst var tionde
sekund); annars är den borta från pulten. Den svänger fram och tillbaka, och när den pekar
mot askkoppen blåser röken åt sidan (draget räknas för varje puff under dess liv, så att
samma tid ger samma bild). Inga riktiga märken: locket säger SNUS N:o 1, dosan PRIMA
LÖSSNUS.

**Affischerna** – de fyra gamla sitter på **skivan** i högra delen av skyltfönstret
([public/rum-affischer.js](public/rum-affischer.js), rum-affischer.css; rum-saker.js sätter upp
dem): en plywoodskiva i två kedjor från karmen, i årsordning (IFK 1982 och Nacional 1988 överst,
VM 94 och Chelsea 2021 under), lika stora (80 × 120), raka och alltid på samma ställe. Det ska
synas att en person har hand om det: en skruv med bricka i varje hörn, en Dymo-remsa under varje
sedel, blyertsmåtten står kvar på skivan och vattenpasset ligger ovanpå, med bubblan mitt
emellan strecken. Måtten (`SKIVA`) delas med rum-inredning.js, som ritar skivan, kedjorna, remsorna
och passet i 3D en gång (`skiva`, duken `skiva` i `#rum-skiva`) och skarpare i närbilden. Sedlarna
är knappar ovanpå, skruvarna följer med i sedlarnas lager (CSS) och skuggorna är bakade i skivan,
så att sedlarna inte behöver något filter. Innan skivan är ritad är `#rum-skiva` en enda färg, så
att sedlarna inte hänger i luften. Skivan ska inte tynga grafiken, och det gör den inte: mätt i Chrome
som telefon (täthet 2,625, fyra mätningar var, hemma) är ritminnet 158,7–159,0 MB före och 158,5–162,1 MB
efter (tre av fyra 158,5–159,6), lagren 294 → 296. Duken tar 0,75 MB i telefonen (uträknat) och ritas en
gång på 39–79 ms i datorn under hög belastning (taket 213–452, kupongstället 263–729), och inget ritas om
medan kameran rör sig. På natten ritas den om en gång, och framsidan ligger i skugga:

- **VM 94:** Expressens löpsedel söndagen den 17 juli 1994, dagen efter bronsmatchen mot
  Bulgarien (4–0) på Rose Bowl i Pasadena: *JAAAAAAAA! BRONS!* och fotot med medaljerna, lite
  solblekt och vikt. Tidningen är riktig, som Tomas ville, med dess röda namn
  ([logotypen](https://commons.wikimedia.org/wiki/File:Expressen_wordmark.svg) är allmän
  egendom), men rubriken är Tomas och sedeln är vår, ingen avbild av en riktig. Hela sedeln
  (`public/rum/expressen94.jpg`, 900 × 1350, skivans format) är tryckt redan i bilden: fotot i
  CMYK-raster, rött som bleknat mest där solen tagit, bortnött färg längs vecken, gulnat papper
  och märken efter gammal tejp i nederkant. Fotot är från Tomas; fotografen och licensen är
  okända, så ingen rad står under närbilden, som tar 94 % av höjden.
- **IFK Göteborg 1982** (DJ:s lag): Göteborgs-Postens löpsedel morgonen efter segern i
  UEFA-cupen, torsdag 20 maj 1982, som någon har sparat (Tomas önskemål: en löpsedel, inte en
  plansch, och från GP eftersom det är IFK). Tidningens namn på ett blått band, datumet,
  *UEFA-CUPEN*, *IFK BÄST I EUROPA!* i två rader så stora som ryms (samma mätning som veckans
  löpsedel, `passa`), fotot från Volksparkstadion med laget och pokalen i luften under
  skylten STADION HAMBURG – svartvitt i rastret, som i tidningen – och *3–0 i Hamburg –
  pokalen hem till Göteborg*. Fotot (`public/rum/ifk82.jpg`) är beskuret ur ett som Tomas
  skickade; fotografen och licensen är okända, så ingen rad står under närbilden. Titeln har
  båda finalerna: 1–0 på Ullevi onsdag 5 maj (Tord Holmgren) och 3–0 i Hamburg onsdag 19 maj
  (Dan Corneliusson, Torbjörn Nilsson, Stig Fredriksson på straff). Papperet har gulnat,
  legat vikt i fyra delar (vecken, `.veck`) och har en reva i underkanten.

**Nacional 1988** (DL:s lag) är förstasidan i **El Día** (Montevideo) måndagen den 12 december
1988, dagen efter finalen i Intercontinental Cup på Estadio Nacional i Tokyo: *¡NACIONAL
CAMPEÓN DEL MUNDO!*, 2–2 mot PSV Eindhoven efter förlängning (Santiago Ostolaza två mål,
Romário och Ronald Koeman) och 7–6 på straffar (Jorge Seré räddade fyra, Tony Gómez satte den
sista), med fotot av laget med Intercontinental-pokalen och Toyota-pokalen som Tomas skickade
(fotografen är okänd, så ingen rad står under närbilden). Tidningen är riktig, som Tomas
ville, men namnet är skrivet som text (inte tidningens logga) och sidan är vår; det som står
om finalen stämmer, och det källorna inte är överens om (minuten för Koemans mål, vilka i PSV
som missade sina straffar) står inte med, liksom årgång, nummer och pris. Sidan
(`public/rum/nacional88.jpg`, 900 × 1332) är tryckt i raster, gulnad, fläckig och vikt i fyra
delar redan i bilden; rummet lägger bara solens blekning ovanpå, inte affischernas
prickraster, som blir grovt i närbilden. Närbilden tar 94 % av höjden.

**Chelsea 2021** (DT:s lag) är en
brittisk löpsedel (news bill) från **The Sun on Sunday**, söndagen den 30 maj 2021, dagen
efter finalen. Tidningen är riktig, som Tomas ville, men namnet är skrivet som text i det
röda bandet (inte tidningens logga), och rubriken är vår: *CHAMPIONS LEAGUE FINAL*,
*CHELSEA* och *KINGS OF EUROPE!*, fotot av laget med pokalen under WINNERS-bågen
(`public/rum/chelsea21.jpg`, beskuret ur ett foto som Tomas skickade; fotografen och
licensen är okända, så ingen rad står under närbilden) och *Havertz strike sinks Man City
1-0 in Porto* under. Chelsea vann finalen mot Manchester City med 1–0 på Estádio do Dragão
i Porto den 29 maj 2021 (Kai Havertz). Löpsedeln är fem år gammal: papperet har gulnat,
det röda har bleknat och den har legat vikt på mitten.

**Löpsedeln** är veckans, från en riktig kvällstidning som de andra (Tomas önskemål):
**Sportbladet**, Aftonbladets sportdel, på sitt rosa papper, eller **Expressen** på vitt med det
röda namnet, två veckor i taget (`TIDNINGAR` i rum-affischer.js). Namnen är skrivna som text,
inte tidningarnas loggor, och rubrikerna är våra. Papperet ska se ut som en riktig tidning (Tomas
önskemål 2026-11-08): matt tidningspapper, gråaktigt eller blekrosa, med fibrer, ojämn ton och buktor
från fukten, svärta och rött som inte har täckt överallt, ett veck på mitten och kanterna klippta med
sax i några raka klipp (`klipp` i rum-affischer.js, ny varje vecka). Det vita i texten är papperet,
och inget filter ligger på texten, som annars blir suddig i närbilden. Överst namnet så brett som papperet, under det
vinjetten (*SPIKEN*, *KRISEN*, *BARA I SPORTBLADET*) och datumet, rubriken i Anton, mitt på
papperet och från kant till kant – varje rad så stor som ryms i bredden men ingen mer än 1,55
gånger den minsta, och har raderna fått krympa för att rymmas på höjden dras de ut på bredden
igen (högst 1,42 gånger), en av dem röd eller vit på rött, och rader med Å, Ä eller Ö med luft
ovanför (också i vinjetten) – raden under och, under ett streck, veckans näst största nyhet
(helst av ett annat slag) efter ett rött plustecken. Utan någon står något ur
kvällstidningens vanliga utbud där (*HOROSKOPET: TIPPA X*, *BÄST I TEST: TIPSPENNOR*). Tonen är
kvällstidningens, stora ord och allvar på ytan, men torr: modellen heter *datorn* och *avböjer
att kommentera* när den har fel, *GARANTERAT!* står ovanför *(74 procent enligt datorn)*, och
*Är det Sveriges bästa tippare?* handlar om bäst i gänget. Namnen, resultaten och siffrorna
stämmer; det påhittade är kvällstidningens fraser (*Nu krävs svar*, *Hela målfesten i bilder*),
aldrig vad en riktig person har sagt. Varje slags rubrik har två eller tre varianter, och
veckan väljer bland dem. Den är den enda som byts och är uppsatt för hand: varannan vecka (veckan i
Stockholm, måndag till söndag) med tejp i skyltfönstrets nedre vänstra hörn, varannan med två
häftstift på furupanelen till höger om fönstret, under oraklets skylt och till vänster om
bardisken, där den är mindre (72 %, så att den ryms mellan fönsterbänkens ände, diskens kant och
den innersta barstolen, som är inskjuten under skivan) och nästan rak. Den hänger bakom disken och
barstolarna, som står framför väggen (löpsedeln ligger före diskens duk i bakväggens plan). I
telefonen på höjden sitter den alltid på väggen, som syns utan att man drar. (Först satt den
ibland under dörrens handtag och sedan i fönstrets högra hörn: dörren hamnade utanför bilden i
telefonen, och hörnet är nu skivans. Till och med 2026-11-05 var den från den påhittade
kvällstidningen KVÄLLSPRESSEN.) Rubriken är det mest dramatiska som rummet vet om (`rubrik` i
rum-affischer.js):

- *förra omgången* (säsongens omgångar, `TP.season`): den som tippade bäst med minst 82 %
  rätt (*TEJDER 12 RÄTT!*, *TEJDER SLOG ALLA*, *HISTORISKT: TEJDER ALLA RÄTT!*), den som
  tippade sämst med högst hälften rätt (*LAINOS MARDRÖM*, *LAINO I FRITT FALL*, *SANNINGEN OM
  LAINOS TIPS*), modellen mot gänget (*AI-CHOCKEN: DATORN KROSSADE GÄNGET*, *MÄNNISKAN SLÅR
  TILLBAKA: GÄNGET SLOG DATORN*) och en ny ensam etta i Tipsligan (*TEJDER TOG TRONEN*,
  *KUPPEN!*) – ställningen och namnen som på skårtavlan (Dogge för Johansson);
- *en spelad match* i förra omgången eller gängets senaste kupong: skrällen när modellen gav
  utfallet högst 22 % (*BRIGHTON FÄLLDE MAN CITY*, *… SÄNKTE …*), en favorit med minst 58 %
  som bara fick oavgjort (*ARSENAL SNUBBLADE*, *ARSENAL TAPPADE POÄNG*) och segrar med fyra mål
  eller mer (*FÖRNEDRINGEN: QPR KÖRDE ÖVER SWANSEA*, med sju mål eller fler *MÅLFESTEN*);
- *gängets kupong* (Historik): betyg 1 (*KUPONGEN I SPILLROR*, *KUPONGHAVERIET*) eller 5
  (*DRÖMKUPONGEN*, *SÅ KNÄCKTE GÄNGET KODEN*);
- *nästa omgång*, så länge ingen av dess matcher har startat: den jämnaste matchen när
  ingen utgång har över 42 % (*DATORN GER UPP*, *RYSAREN*), den största favoriten med minst 68 %
  (*ARSENAL KAN INTE FÖRLORA* – *Vad kan gå fel?*, *GARANTERAT! ARSENAL VINNER*, *SPIKA
  ARSENAL!* – *Vi lovar ingenting*) och jakten på ledaren i Tipsligan (*JAKTEN PÅ TEJDER*,
  *TEJDER OHOTAD?*).

Varje rubrik har en vikt efter hur dramatisk den är (hur få rätt, hur liten chans …).
Förra omgångens väger fullt tre dagar efter sista avsparken, sedan 55 % och efter sex dagar
30 %; nästa omgångs 90 %. Omgångar och kuponger som spoilerskyddet döljer räknas inte.
Utan något att skriva om står tipsguiden (*STORA TIPSGUIDEN*, *SÅ BLIR DU RIK PÅ TIPSET* – *8
enkla knep – nummer 5 gör alla fel*). Tidningen är från dagen det hände (tre timmar efter sista
avsparken), och för nästa omgång från idag. Ett klick går fram till löpsedeln, som till de andra affischerna
(2026-11-10; förut öppnade det tidningen), och som inget annat i rummet leder den ut ur det. Tidningen den
gör reklam för ligger på pulten (se [Tidningen](#tidningen)). För bilder: `?rum-tidning=sb|ex`, `?rum-rubrik=<typ>` och
`?rum-variant=<tal>`.

**Fikat** står på pulten vissa dagar, i three.js som sakerna
([public/rum-fika.js](public/rum-fika.js)): två semlor i pappersform med mandelmassa,
grädde och lock med florsocker på fettisdagen, två pepparkakshjärtan och en gubbe med vit
glasyr på en servett i december, två lussekatter med russin på luciadagen, två
kanelbullar med pärlsocker i pappersform den 4 oktober, chokladägg i röd, blå, grön och
guldfolie i påskveckan (skärtorsdagen till annandag påsk) och tre chokladbollar på en
servett den 11 maj. Det står till höger om högen, fritt från askkoppen, dosan, locket,
prisen och fläkten (bakom högen ligger kvällstidningen, se [Tidningen](#tidningen); förut stod
fikat där). Dagen är Stockholms (`Vader.nu()`,
läst var tionde sekund som vädret). Går det dåligt med tippningen har någon redan tagit
för sig: locket ligger bredvid den ena semlan och det är en grop i grädden, gubben saknar
huvudet (tandmärken), en lussekatt, en kanelbulle och ett par ägg är borta och ett ägg är
skalat med folien tillplattad bredvid, och det är fler smulor och mer florsocker.

**Platserna och slitaget skiftar från dag till dag** (dagen i Stockholm som frö): sakerna
på pulten står i en av fyra uppställningar (`LAYOUTS` – fläkten längst bak, till höger, i
mitten eller till vänster, askkoppen och dosan om vartannat, några
pixlar hit eller dit), locket och prisen läggs där det finns plats, och inget av det, askan
eller smulorna hamnar på högen (`HOGEN`, samma plats som `HOG` i rum.js) eller på tidningen
bakom den: allt står till höger om dem (`free`, x ≥ 1345 i pultens bildpunkter). Förut kunde
fläkten stå bakom högen, där tidningen ligger nu. Slitaget följer tippningen: andelen fel
bland omgångens avgjorda matcher, annars i den senaste färdigspelade kupongen, och utan
rättning ett mellanläge. Går det dåligt fylls askkoppen (1–11 fimpar), askan hamnar
bredvid, snuset spills, fläkten (om den står där) går på trean och löpsedlarna på skivan bleks;
går det riktigt illa ryker två cigaretter och en använd pris ligger på pulten (sedlarna sitter fast
med skruv, och veckans löpsedel är ny och blir bara lite böjd). Dolda
resultat räknas inte (gradeRow rättar dem inte). Utan WebGL står sedlarna kvar på en slät skiva,
men inte sakerna på pulten.

**Lysröret tänds när man kommer in** (`tand` i rum.js, `.rum-mork` i rum.css; inte medan det är dämpat eller släckt): medan
gänget laddas är rummet mörkt, utom gatan genom skyltfönstret och dörren och tv:n som
lyser igenom, och startarna glöder rosa i rörets ändar. Efter minst 0,7 och högst 2,6
sekunder blinkar det igång (1,2 s). En gång per sidvisning, och inte med
`prefers-reduced-motion` eller `?rum-t`.

**Rummet rör sig också:** utanför rutan och dörren är det Stockholms tid och väder (se
nedan), neonen glappar ibland, röken ligger under lysröret, damm syns i ljuset och stationsurets
sekundvisare hoppar fram. Bakväggen är klädd med lackad furupanel (`furu` i rum.js):
bräder med kvistar och ådring, mörka av röken upptill och ljusare under lysröret och där en
tavla har hängt runt ramen. Disken längs högra väggen är en bardisk som i en pub, i three.js
(`bardisk` och `DISK` i rum-inredning.js): en skiva i lackad mahogny med en rundad kant, som
sticker ut en dryg decimeter över den indragna fronten, så att man har plats för benen. Under
kanten bär konsoler i järn upp skivan, och på fronten sitter en krok i mässing i varje fält.
Fronten har fyllningar i ramar, en halv meter isär. Framför står tre barstolar likadana som gängets (röd vinyl med söm, krom, fotring),
med sitsen 75 cm över golvet och inskjutna under kanten – den innersta ända in under skivan, så
att sitsen går fri från löpsedeln på väggen; den närmaste syns bara till hälften
över pulten. Skivan skuggar fronten och stolarna skuggar fronten och bakväggen under skivan –
det är skuggorna och stolarna som visar att det är tomt under skivan, eftersom man ser disken
lite uppifrån. Disken ritas en gång, som inredningen, i en duk från disken in i videons hörn
(så att den är likadan när kameran går dit) under tavlorna och kortlådan. På disken står
kupongstället, kortregistret, videon och lådan med kassetter. Utan WebGL står den
platta disken kvar (`disk` i rum.js, och i videons hörn `vaggSvg` i rum-video.js), med samma
mått. Stället är slitet: nikotingul högervägg och tak, fläckar, nötta
kanter på disken och pulten, kafferingar, ringar efter glas på disken och brännmärken. Med
`prefers-reduced-motion` står allt still (en bild, ingen kamera efter musen).

**Data:** omgången ur `GET …/samtal` (`TP.round`, tippare.js), annars omgångens kupong;
ställningen och resultaten rättas med `gradeRow` (kupong.js), också med Dölj resultat.
Rummet läser om datan varje minut medan det står öppet.

**Bilder:** `?rum-t=<sekunder>` fryser klockan (figurerna, röken och CSS-animationerna
står på samma tid, och Stockholms klocka – uret, text-tv:n och utsikten – står på `?rum-klocka`,
annars på när sidan laddades), `?rum-mx=&rum-my=` (−1…1) kamerans läge,
`?rum-slit=0…1` slitaget, `?rum-dag=<tal>` dagen för sakerna och affischerna,
`?rum-vecka=<tal>` veckan för löpsedelns plats och `?rum-rubrik=<typ>` en viss rubrik om den
finns (`bast`, `samst`, `datorn`, `ledare`, `skrall`, `kross`, `kupong`, `rysaren`, `spiken`,
`jakten`),
`?rum-fika=semlor` (`pepparkakor`, `lussekatter`, `kanelbullar`, `paskagg`,
`chokladbollar`) fikat, `?rum-ol=jul` (`pask`) ölen och `?rum-fest=jul` (`lucia`, `nyar`,
`pask`, `midsommar`, `inget`) högtidskläderna. Gänget: `?rum-plats=0` (`1`, `2`)
var de sitter vid bordet, `?rum-vantar=DL,DT` som om de inte hade lämnat in,
`?rum-stopp=<timmar>` som om det var så långt kvar till spelstoppet, `?rum-tittar` som
om matcherna pågick och `?rum-mal=dl:1,dt:-1,dj:0` ett mål
(rätt, fel, ingen skillnad; vid tiden 0 med `?rum-t`, annars var femtonde sekund; `dl:1b`
väljer sättet: `a` som förut, `b` båda armarna eller händerna på huvudet, `c` handen i
bordet), `?rum-humor=glad` (`nerv`, `deppig`) humöret, `?rum-rank=dl:1,dj:-1` vem som
leder och ligger sist i omgången, `?rum-akt=dl:kors,dj:dunk` ett påhitt om och om igen
(mitt i det med `?rum-t`, `dl:skamt@6` sex sekunder in; namnen står i `AKTER` i rum-3d.js, och
gängets påhitt `skamt`, `gral`, `titta`, allsångerna och zen-stunderna ges alla tre), `?rum-radio` radion på
(`=4` sedan fyra sekunder), `?rum-ga=dl` att DL går iväg och
kommer tillbaka (var fyrtionde sekund; `dl:5` fem sekunder in med `?rum-t`),
`?rum-pekar=dt:tv,dl:dj` som om de pekade (på en sak eller någon i gänget),
`?rum-ansikte=jublar` (`glad`, `nojd`, `sur`, `deppig`, `orolig`) ansiktena (med `?rum-humor=`
utan värde, så att omgången som spelas inte går före),
`?rum-hej=dl` som om man pekade på DL, `?rum-vald=dl` som om man just hade klickat på
DL (`dl:3` tre sekunder sedan; med `?rum-t` och den som inte har lämnat in), `?rum-natt` (`=0` dag) natten
(gänget sover då också), `?rum-somn` (`=0` vakna) att gänget sover utan att lysröret släcks,
`?rum-vakna=dl:ryck:3` att DL vaknade med ett ryck för tre sekunder sedan (`strack`, `bakis`; flera med komma) och
`?rum-efter=bra` (`illa`, `inget`) dagen efter. Sidan
sätter `data-rum-klar` på `body` när allt är ritat. Vädret och klockan utanför:
`?rum-klocka=2026-12-13T16:00` (eller bara `16:00`, Stockholms tid), `?rum-vader=klart`,
`halvklart`, `mulet`, `dimma`, `dugg`, `regn`, `skurar`, `snoblandat`, `sno` eller `aska`,
`?rum-grader=<°C>`, `?rum-vind=<m/s>` och `?rum-snodjup=<cm>` (med både vädret och graderna
hämtas inget).

Samma adress med `?rum-t` och `?rum-klocka` ger samma bild, också med gänget: två laddningar är lika
bildpunkt för bildpunkt när `data-rum-klar` är satt (provat 2026-11-09 i datorn och som telefon). Förut
skilde text-tv:ns klocka, som gick på datorns tid också med `?rum-klocka` och inte stod still. Gatan
står på den fasta tiden först när rummet är klart (upp till nio sekunder, medan vädret hämtas); en bild
som tas före det visar gatan i rörelse.

### I telefonen

**Hela rummet på höjden (2026-11-08):** i en stående telefon (`.rum.smal`) syns alla tre i gänget, neonen,
lysröret och hela kupongen med alla rader utan att man drar. Förut fyllde scenen fönstrets höjd, så att bara
515 av scenens 1600 punkter fick plats på bredden: en i gänget var utanför bilden och kupongen skars av vid
rad elva. Nu är förstoringen `max(bredd / 760, höjd / 1330)` (`fit` i rum.js), högst så mycket som fyller
fönstret, och scenen räcker inte till fönstrets höjd. Därför är `.rum-stage` inte klippt där, och taket
(`.rum-tak`) och pulten (`.rum-pult-mer`, resten av träet) fortsätter utanför scenen, mest tak över och lite pult
under (`pan`); ljuset (`.rum-warm`, `.rum-vign`) och nattens mörker (rum-folk.css) räcker lika långt, och
medan lysröret tänds täcker `.rum-mork-ut` det som är utanför. Man står vid gänget när man kommer in (`HEM_SMAL`,
`R.pxHem`, som kameran också vrids från), kupongen ligger under dem (`kupX`) och pingklockan står under
kupongen, där tummen är. Pennan vilar nedanför raderna i stället för på rad 9–10. Gänget
är ungefär en fjärdedel mindre på skärmen, och duken har därför färre bildpunkter med samma skärpa (`PR`
i rum-3d.js, 1,2 i stället för 1,5). Vad det kostar: se *Mätt 2026-11-08* i [Ljuset efter klockan](#ljuset-efter-klockan).

**Bordet på höjden (2026-11-08, användarens önskemål):** pulten tog 45 % av fönstrets höjd, och nedre delen av
den var tomt trä. Rummet kan inte förstoras utan att någon i gänget hamnar utanför bilden, så scenen står i stället
längre ner: 60 % av det scenen inte fyller på höjden ligger över den (`TAK_SMAL` i rum.js, förut 24 %), och pulten
tar ungefär 36 %. Aldrig så långt ner att pingklockan hamnar utanför fönstret (`FOT_SMAL`), så i ett riktigt lågt
fönster (375 × 553) tar den 42 %. Kupongen ligger förminskad till 80 % med mitten i (640, 819) (`kupLigg`, `kupY`
och rum.css), så att hela kupongen fortfarande syns utan att man drar; handen och högen räknas från samma mått.
Protokollet fyller kupongens ruta och är lika stort som förut. Taket som då syns är ritat (`tak` i rum.js): i
bakväggens plan, så att det sitter ihop med `bg` när kameran vrids, med plattor mot flyktpunkten, lysrörets sken
som klingar av och högerväggen som fortsätter upp över en list där hyllorna slutar. Färgerna är mätta mot `bg` i
skarven, och `.rum-warm` räcker lika långt upp, annars syntes den.

Rummet står i alla fönster utom de allra minsta (`Rum.fits`: minst 280 × 260 px), i
telefonen också. Scenen täcker fönstret som på datorn, också på höjden i telefonen (en tid
fyllde den 80 % av höjden, med svart över och under; det svarta ville vi inte ha, och mindre
förstorad än så går inte utan det). Det som inte ryms når man med fingret: scenen följer med när man drar,
glider vidare en bit när man släpper den i farten, och kameran vrids efter var i rummet man
står, som med musen (`swipe` och `pan` i rum.js; med musen nedtryckt går det likadant i ett
smalt fönster). I Chrome glider scenen till fingret på 50 ms (`.drar` i rum.css) i stället för
att flyttas direkt, se [När datorn inte hinner med](#när-datorn-inte-hinner-med). Ett tryck på ett föremål gör samma sak som ett klick, och ett tryck efter
ett drag öppnar ingenting. Föremålen lyser inte kvar efter ett tryck (`:hover` bara med
mus), och foten har bara *Vanlig sida* eller *Tillbaka* – utan tangentbord står inga tangenter där. På höjden
står ordet uppe till höger, mitt emot namnet, eftersom kupongen fyller nederkanten
(där låg ordet över kupongens rutor och över guldorden i närbilderna). Sidan
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
riktig stryktipskupong (`KUP` i rum.js; på pulten förminskad, se *Bordet på höjden*). Raderna har två våningar – lagen överst, dagen och motiveringen under – och
rutorna är större (44 × 26). Lagen har de korta namnen (*Tottenham –
Crystal Palace*, *Southampton – QPR*; `short` i rum.js, där Bristol City, Bristol Rovers och
Notts County behåller hela namnet och Milton Keynes Dons blir MK Dons), så att de ryms i
stället för att huggas av. Överst står bara *Vem är du?* och porträtten, utan 1 X 2 –
tecknen står i rutorna, som på papperet i telefonen – annars fick frågan inte plats och
hamnade över första raden. Fälten står över hela bredden i foten, streckkoden får inte
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
- **Det suddiga ritas med färre bildpunkter.** Ljuset och vinjetten med en fjärdedel
  och utsikten med 0,4 (CSS zoom, förstorat igen), tv:ns sken och
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
  bildpunkter per punkt, och med skuggkartor på 1024 i stället för 2048
  (`LATT`). Gängets ansikten ritas där i halva storleken (512 × 576), och gänget sparar
  ingen extra kopia av bilden (`preserveDrawingBuffer`). Telefonen börjar dessutom på steg 1
  (se [När datorn inte hinner med](#när-datorn-inte-hinner-med)), där gänget och sakerna
  ritas med 1,1 bildpunkter per punkt, 20 gånger i sekunden och med färre trianglar.

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

### När datorn inte hinner med

Rummet känner själv av om datorn eller telefonen hinner med (`kanna` i rum.js) och går då
ner ett steg (`KVAL`, steg 0–2). Bilderna räknas i två sekunder åt gången medan rummet står
för sig självt – inte medan kameran är framme vid något, inte medan 3D-delarna startar och
inte när fliken är dold – och kommer det färre än 45 bilder i sekunden, eller är mer än var
tionde bild längre än 50 ms, två perioder i rad tas ett steg ner. I Chrome i datorn räknas
gängets bilder (se Väcks bara när det behövs nedan): färre än 80 % av takten, eller mer än
var tionde bild längre än 50 ms (75 ms på steg 1).

- **Steg 1:** gänget och sakerna på pulten ritas 20 gånger i sekunden i stället för 30, med
  tre fjärdedelar av bildpunkterna på ledden och skuggorna omräknade varannan bild (var tredje i telefonen) (`kval` i
  rum-3d.js och rum-saker.js). Gänget byggs av ungefär 310 000 trianglar i stället för
  745 000 – håret, huvudena och de runda delarna med färre segment (`seg` i rum-3d.js;
  glansen i håret blir lite kantigare) – och byggs om på stället som när kläderna byts.
  Kameran vrids efter musen i samma takt som gänget i stället för i varje bildruta (i Chrome
  glider den ändå jämnt, `folj` nedan).
- **Steg 2:** 15 gånger i sekunden, 55 % av bildpunkterna på ledden (aldrig under 0,75 per
  punkt), skuggorna var fjärde bild, ungefär 240 000 trianglar och inget damm i ljuset.
- **Steg 3:** samma takt, hälften av bildpunkterna på ledden, ungefär 190 000 trianglar och det
  enkla ljuset (`enkeltLjus` i rum-3d.js och rum-saker.js): ingen skuggkarta, ingen miljö, bara
  huvudlampan, neonen och fönstret plus mer ljus från himlen, och tygerna utan knottror och lack.

Gatan utanför glider lika jämnt på alla steg (se *Bilarna och de som går förbi glider jämnt* nedan).

Från steg 1 är det i datorn som i telefonen: ljuset utan blandningslägen och i ett lager (`ljusIhop`), inget korn, och föremålen
lyser upp direkt i stället för med en övergång av filtret (`.enkel` i rum.css).

Rummet börjar på rätt steg (`startSteg` i rum.js): i ett svep byggs gänget om för varje steg ner,
och det är det som hackar mest. Med 4 GB minne eller 4 kärnor börjar det ett steg lägre, med 2 GB
eller 2 kärnor och med mjukvarugrafik på steg 3, och äldre grafikkretsar (Mali, Adreno, PowerVR, Intel
HD/UHD) börjar på steg 1 eller 2. Safari säger inget om sådant, där får `kanna` känna efter. Går det under
45 % av takten hoppar `kanna` direkt till steg 3. Kantutjämningen går inte att stänga av när
grafiken väl har startat; den är på där duken är så gles att trappstegen syns (`kantutjamning` i rum.js,
se *Jämnare kanter och jämnare takt* nedan).

Steget sparas i webbläsaren (`rum-kval` i localStorage), så att nästa besök börjar där, i tre
dagar. I telefonen börjar rummet på steg 1. `?rum-kval=0` (`1`, `2`, `3`) väljer steget och låser
det, också med `?rum-t` (som annars har steg 0).

Gänget var det tyngsta för grafikkortet: drygt 700 000 trianglar med klarlack och
sammetsglans, ritade två gånger per bild (en gång till för skuggorna) 30 gånger i sekunden.
Med mjukvarugrafik (SwiftShader, som en svag grafikkrets) var det gänget som höll nere
bilderna, och mer trianglarna än bildpunkterna.

Också på steg 0 räknade Chrome om alla rummets lager (`PaintArtifactCompositor::Update`) i
varje bildruta, ungefär en millisekund per gång på en snabb dator och flera i en telefon:

- **Gatan utanför:** fotgängarnas ben och armar, hjulen, löven, fåglarnas vingar och flaggan
  rörde sig inne i SVG:er, som grafikkortet inte kan flytta själv. De stod på paus och
  flyttades fram i samma takt som gänget (`uteTakt` i rum.js), men varje steg räknade ändå om
  alla lager (se nedan).
- **Myrornas krig** i videon (`.vhs-brus`) rörde sig också när det var dolt; nu bara när det
  syns.
- **Lagerkransen** bakom oraklet pulserade med en skugga (`kr-glint` i kronan.css); i rummet
  står den still.
- **Neonen:** glappet satte en klass på hela rummet, så att stilen räknades om för alla element
  varje gång; nu sitter den på neonen och skenet (`.av` i rum.css).
- Dagens frö för sakerna på pulten räknades 30 gånger i sekunden; nu en gång i minuten.

Mätt i headless Chrome (Apple M5) med processorn fyra gånger långsammare: huvudtrådens tid
på håll med musen stilla 750 → 570 ms per sekund på steg 0, och med musen i rörelse 900 → 860
(steg 0), 600 (steg 1) och 500 (steg 2). Som telefon (390 × 664, täthet 3, fingret drar,
steg 1): från 50 bilder i sekunden med huvudtråden fullt upptagen (950 ms/s) till 60 bilder
och 450 ms/s. Med SwiftShader i 1366 × 768: 1,7 → 2,5 (steg 1) och 2,9 bilder i sekunden
(steg 2), och rummet gick själv ner till steg 2 på en halv minut. En snabb dator stannar på
steg 0.

Sedan dess räknar Chrome bara om lagren när något i rummet faktiskt ändras, inte när det rör
sig:

- **Gatans figurer är dukar.** Varje steg för benen på gatan, och varje vridning av hjulens
  ekrar, var en ändring inne i en SVG och räknade om alla rummets lager (~380), 20–30 gånger i
  sekunden; oskärpan på varje figur var dessutom ett eget pass på grafikkortet i varje
  bildruta. Nu är de som går, cyklar och åker förbi, löven, fåglarna och flaggan var sin liten
  duk (`duka` i rum-ute.js) som glider över gatan som förut, och ställningen ritas om i duken
  i gängets takt (`takt`), bara för det som syns genom fönstret och dörren, med oskärpan i
  ritningen (`ctx.filter`; utan den, i äldre Safari, får duken oskärpan i CSS). Rörelserna –
  vinklarna, takterna och kurvorna som förut stod i rum-ute.css – står i `rorelse`. Molnen
  ritas en gång med sin oskärpa. SVG:erna ritas i duken med samma former och färger
  (`delar`, `rita`), så gatan ser ut som förut.
- **Kameran efter musen** (och efter var man står med fingret): en ny vridning av världen
  räknade om alla lager. I Chrome får världen nu ett nytt mål var tiondels sekund och glider
  dit själv med en övergång (`folj` i rum.js) – medan en övergång pågår flyttar Chrome bara
  lagren – och gänget och sakerna i 3D ritas med den vridning som syns (`synlig`). Först gled
  den i jämn fart på 180 ms mot varje mål, så att farten ändrades i ryck tio gånger i sekunden
  och världen kom igång en tiondels sekund efter musen. Nu står vridningen upp och ner i
  `rotate` och den åt sidorna i `transform` medan världen följer musen, med var sin övergång
  och en egen kurva för varje (`linear()`, `foljKurva`): samma följning som bild för bild (6 %
  av vägen per trettiondels sekund), med musens nya läge inlagt jämnt över den följande
  tiondelen och med farten världen redan hade, så att farten inte hoppar, inte heller när
  musen svänger. (En animering med nyckelbilder ger samma rörelse, men Chrome räknar om lagren
  varje gång en sådan läggs om, en övergång bara ibland.) Mätt i headless Chrome (Apple M5,
  1440 × 900, täthet 2, steg 0), musen i en båge, omväxlande gammal och ny kod: de största
  fartändringarna från en bildruta till nästa (98:e percentilen) 19–24 → 6 % av farten, och
  12–19 → 0 språng över 15 % utom den mjuka starten från stillastående; lika många
  omräkningar av lagren (3,1–3,5 i sekunden när målet läggs om, förut 3,5–3,6), samma tid på
  huvudtråden (172–175 ms/s, förut 165–188) och 60 bilder i sekunden. Det gänget ritas efter
  avviker högst 0,03° från det som syns, och i vila står världen där den ska. En
  sekund efter närbilderna vrids den direkt: medan världen glider behåller Chrome lagrens
  upplösning, och efter en närbild ska den bli hemmets. När kameran går fram eller tillbaka
  vrids den med kameran (`vrid`, nedan). WebKit vrider världen utan kostnad och gör som förut.
- **Fingret som drar** flyttade scenen och räknade om alla lager vid varje rörelse; i Chrome
  glider den nu till fingret på 50 ms (`pan(…, true)`, `.drar` i rum.css).
- **Röken** från cigaretterna var 182 spritar med eget material, en ritning var i varje bild;
  nu är puffarna en enda mesh som ritas på en gång (`ROK` i rum-saker.js), lika i bild.

Mätt i headless Chrome (Apple M5, 1440 × 900, täthet 2, steg 1) med processorn fyra gånger
långsammare, omväxlande gammal och ny kod: huvudtrådens tid med musen stilla 380 → 250 ms per
sekund, med musen i rörelse 510 → 330, och som telefon (390 × 664, täthet 3) med fingret som
drar 440 → 300; omräkningarna av alla lager från 20–35 i sekunden till 0–2, och
grafikprocessen ungefär en fjärdedel mindre med musen stilla. Sakerna på pulten ritas på
1,7 ms i stället för 3,5. Med datorn hårt belastad gick rummet med musen stilla i 60 bilder i
sekunden i stället för 29. Med SwiftShader utan 3D (1366 × 768, som en svag grafikkrets):
14 → 17 bilder i sekunden för samma arbete, med 15 pass på grafikkortet per bild i stället
för 19. Bilderna av gatan (dag, natt, snö med plogbil, flaggdag), röken
och närbilderna är desamma som förut, och kameran glider in och ut ur närbilderna utan fler
hål i bilden.

Närbilderna av tv:n och anslagstavlan hackade ändå i Chrome, också på en snabb dator. Medan
kameran gled fram – på grafikkortet, i varje bildruta – flyttades två saker en bit i varje
bildruta från huvudtråden, och varje gång räknade Chrome om alla rummets lager: världen, som
vreds rakt mot tv:n och videon (eller färdigt mot musen vid tavlan och kortregistret), och
tavlan på sin flygtur. Med gänget och sakerna i 3D som ritas samtidigt hann huvudtråden bara
var andra eller tredje bildruta, så att rummet och tavlan ryckte fram i 20–30 bilder i
sekunden medan kameran gled i 60. Nära tv:n och videon blev bilden dessutom inte skarp förrän
vridningen hade stannat, efter ett par sekunder. Nu:

- **Världen vrids med kameran.** Vid tv:n, videon, anslagstavlan och kortregistret, och
  tillbaka därifrån och från uret, skårtavlan, oraklet och affischerna, vrids världen dit den
  ska på samma tid och med samma kurva som kameran glider (`vrid` i rum.js, `.vrider` i
  rum.css); tillbaka mot musen (`vridHem`). Gänget och sakerna i 3D ritas med den vridning
  som syns, längs samma kurva. Bara i Chrome.
- **Anslagstavlan flyger på grafikkortet** (se [Anslagstavlan](#anslagstavlan)): vägen räknas
  ut i förväg och flygs som en animering, som börjar samtidigt som kameran. I Safari börjar
  den som förut när tavlan har ritats.
- **Muspekaren över gänget** (ingen hand över det som står bakom) sätts på det som står under
  musen i stället för som en klass på hela rummet (`markor` i rum-folk.js), som räknade om
  stilen för alla rummets ~3 800 element varje gång musen gick in över eller ut från gänget.

Mätt i headless Chrome (Apple M5), omväxlande gammal och ny kod, fram till saken och tillbaka
med musen i rörelse: i 1280 × 740 med täthet 2 omräkningarna av alla lager på vägen fram till
tv:n 96–97 → 3–5 och till tavlan 43–44 → 8–10, och längsta bildrutan vid tavlan 33–50 → 17 ms
fram och tillbaka; med processorn fyra gånger långsammare (1440 × 900) omräkningarna fram till
tv:n 33–36 → 3–14 och till tavlan 35–41 → 9–10, bildrutorna över 20 ms fram till tavlan
7–15 → 1–4.
Tv:n och videohörnet är skarpa när kameran är framme (förut suddiga ett par sekunder), och
tavlan landar på väggen på en hundradels bildpunkt när. I WebKit (WKWebView, 1440 × 900 och
390 × 664 med täthet 3) lika många långa bildrutor som förut och samma minne.

Vägen tillbaka från närbilderna hackade ändå, och mest i ett riktigt Chrome-fönster:
headless Chrome visar inte bilden på skärmen och hackade inte. I ett riktigt fönster (1280 ×
743 med täthet 2, egen profil, uppvärmd) stod bilden still upp till 0,37 sekunder medan
kameran gick tillbaka – från tv:n 23–28 tappade bildrutor av 90 den första och en halv
sekunden, från videon, uret, oraklet och affischen 11–23 – och det var grafikkortet som inte
hann med: allt som kom i bild ritades om, en del två gånger, och rutor fattades. Två orsaker:

- **Muspekaren över gänget** (ingen hand över det som står bakom, `markor` i rum-folk.js)
  sattes som stil på det som låg under musen, oftast scenen eller en vägg. Pekaren ärvs av
  allt inuti, och Chrome ritade då om väggarnas SVG:er – bakväggen är sexton rutor i
  fönstrets bredd – varje gång musen gick in över eller ut från en figur, upp till femton
  gånger i sekunden, också hemma. Nu sätts den bara på länken under musen (`.rum-sak`,
  `.rum-tag`), det enda som annars visar en hand.
- **Skärpan på vägen tillbaka.** Står rummet precis rakt, som framför tv:n, videon, uret,
  skårtavlan, oraklet och affischen, räknar Chrome ut lagrens skärpa exakt, och nära är
  väggarna tre gånger så skarpa som hemma. När kameran började gå tillbaka behöll Chrome
  närbildens skärpa, krympt så att lagren rymdes i minnet, ritade allt som kom i bild i den
  mellanskärpan och sedan allt en gång till i hemmets skärpa när kameran stannade. Lutar
  rummet det minsta i perspektivet tar Chrome hemmets skärpa direkt, så vridningen tillbaka
  mot musen börjar en tusendels grad snett (`vrid` i rum.js) – det syns inte – och rummet
  ritas en gång, i hemmets skärpa. Bara i Chrome.

Mätt i ett riktigt Chrome-fönster, gammal och ny kod om vartannat för varje utzoomning (alla
nio närbilderna två gånger, Esc med musen i rörelse, datorn belastad av annat): längsta tiden
utan ny bild i snitt 184 → 118 ms, visade bildrutor 69 → 76 av 90 den första och en halv
sekunden, rutor som ritas om 383 → 192 och saknade rutor (som syns som hål) 42 → 3. Med datorn
lugnare gick vägen tillbaka från tv:n i alla 90 bildrutorna, längsta glappet 18 ms (förut
50–130). Med mycket hög belastning (load 60–80) hackar det fortfarande, både förut och nu.
Bilderna i närbilderna och hemma är desamma, anslagstavlan landar på en hundradels bildpunkt
när, och i WebKit i telefonstorlek (390 × 664, täthet 3) är bildrutorna och minnet som förut –
i telefonen körs ingen av ändringarna.

Mätsättet: Chrome med egen profil i ett riktigt fönster, startat i bakgrunden (`open -g`) och
med `--disable-features=MacWebContentsOcclusion` (annars slutar det rita när ett annat fönster
täcker det), styrt och spårat via DevTools-protokollet. Tappade bildrutor ur
`PipelineReporter`, väntan på grafikkortet ur `IOSurfaceImageBacking::WaitForCommandsToBeScheduled`,
rutornas skärpa och minne ur `LayerTreeHostImpl:snapshot` (`disabled-by-default-cc.debug`). En
ny profil kompilerar grafikkortets program första gången (upp till en sekund stopp) – värm upp
alla närbilderna först.

Att det hackade så olika från gång till gång berodde på minnet. Lägger man beslag på 10 GB på
en dator med 16 GB (slumpdata som hålls i bruk, `load` 3–10) kommer hacket varje gång: vägen
tillbaka från tv:n står still i 0,2–0,3 sekunder och 15–20 av 39 bildrutor tappas, medan det är
jämnt när kameran väl är hemma. Bara processorbelastning (`load` 75) ger nästan inget hack, och
inte heller ett grafikkort som delvis är upptaget. Medan kameran står nära släpper Chrome det
mesta som ligger utanför bilden, så på vägen tillbaka ritas det om på en gång: grafikminnet går
från ungefär 350 till 530–610 MB på en bråkdel av en sekund, och är minnet fullt måste macOS
först frigöra det. Det syns som väntan på grafikkortet
(`IOSurfaceImageBacking::WaitForCommandsToBeScheduled`).

Det enskilt största var videohörnet. Det ritades i sex gånger sin storlek för att vara skarpt
nära, ungefär 15 miljoner bildpunkter av rummets 99, också på håll där det syns lika stort som
ett frimärke. I Chrome i datorn ritas det nu i 3/8 av de måtten (`.rum.chromium .vhs-in` i
rum-video.css), och Chrome skärper det själv när kameran har stannat nära: bilderna är lika
skarpa, små texter som HQ · STEREO tydligare, och etiketterna får samma storlek. På vägen fram
är hörnet lite mjukare, som väggarna redan var. Med rutan i hela fönstret (`.skarp`), i telefonen
och i andra webbläsare är allt som förut.

Mätt under det pressade minnet, gammal och ny storlek om vartannat för varje utzoomning (1280 ×
743, täthet 2, tappade bildrutor av 39 under glidningen och längsta tiden utan ny bild i snitt):
tv:n 15,8 → 5 tappade och 244 → 52 ms, videon 5,4 → 1,6 och 93 → 50 ms, oraklets ram 15,5 → 1
och 183 → 38 ms, VM 94-affischen 6,8 → 4,5 och 100 → 67 ms, uret 12–13 → 0–1. Skårtavlan, anslagstavlan och kortregistret var jämna förut och är det nu.
Vägen fram till videon blev inte sämre, och med ledigt minne är allt lika jämnt som förut.
Prövat utan effekt, eller sämre: att låsa väggarnas skärpa medan kameran står nära
(`will-change: transform` – bara hälften av bildrutorna när kameran är hemma), en osynlig
animering som håller kvar skärpan, och att byta hörnets storlek när kameran kommer fram eller
går tillbaka (då flyttas hacket dit).

Mätsättet för minnet: ett litet Node-skript som håller 10 GB slumpdata och rör vid det hela tiden,
under en och en halv till fem minuter. Den tyngsta spårningen
(`disabled-by-default-cc.debug`) ritar själv om väggen och kan inte användas för att räkna rutor.

**Väcks bara när det behövs.** I Chrome i datorn gör huvudtråden inget mellan gängets bilder:
grafikkortet flyttar allt annat, och kameran glider själv (`folj`). Att den ändå väcktes i
varje bildruta kostade en omräkning av stilen för allt som är animerat, 60 gånger i sekunden.
Nu väntar `tick` i `loop` med en timer till bildrutan före nästa bild. Så länge kameran rör sig
bild för bild, och i telefonen och Safari, går den i varje bildruta som förut. Mätt i headless
Chrome (Apple M5, 1440 × 900, täthet 2), gammal och ny kod om vartannat, median: på steg 0
huvudtrådens tid 137 → 124 ms/s och stilen 16 → 9 ms/s, på steg 1 med processorn fyra gånger
långsammare 248 → 194 ms/s och stilen 40 → 15 ms/s. Gängets takt och jämnhet är oförändrade
(33,3 ms på steg 0 och 50 ms på steg 1, 95:e percentilen inom 2 ms).

**Att peka på gänget** räknade mot alla gängets trianglar, 4–17 ms på huvudtråden var 60:e ms
när musen rörde sig över figurerna. Nu räknas det mot lådan runt varje del (`under` i rum-3d.js),
högst 0,2 ms. Det används bara för att veta vem man pekar på, så träffytan får vara lite större
än figuren.

**När figurerna byggs om** (kläderna, ett steg ner) släpps material och texturer när de nya har
ritats en gång (`slappOmbyggda`), så att shaderprogrammen de nya ska använda inte kastas.
Förut låg ungefär 13 texturer per ombyggnad kvar tills webbläsaren städade dem.

**Svaga telefoner och datorer (2026-11-04).** En snabb dator visar inte det här. Mätt på tre sätt:
med mjukvarugrafik (SwiftShader, `--use-angle=swiftshader`) som en svag grafikkrets, med processorn
fyra gånger långsammare, och med knappt ritminne (`--force-gpu-mem-available-mb=128` och telefonens
täthet med `--force-device-scale-factor=2.625`). Det sista framkallar flimret: rutor som inte får
plats i minnet ritas inte, och syns som hål.

- **Flimret.** Hemma tog rummet 216 MB att rita i telefonens täthet (det hade vuxit från 199 med
  löpsedlarna), och i en billigare telefon får en sida mindre än så. Nu 98 MB. Utöver ljuset ovan:
  dagsljuset (`dagDuk`), röken under taket, anslagstavlans skugga och himlen ritas på små dukar, och
  sidans egen bakgrund med gradient, som ligger helt bakom rummet, är borta medan rummet syns
  (`rum-pa`).
- **Passen på grafikkortet.** Dagsljuset skulle ha varit utan blandningsläge i telefonen, men rum-ute.css
  läses efter rum.css och skrev över det, så att allt som ritats bakom lästes in igen i varje bildruta,
  med två extra pass över hela skärmen. Nu är det rättat, med en femtedel av täckningen, som ger ungefär
  samma ljus. Neonens sken var tre skuggor i rad som filter, flera pass i varje bildruta; nu ritas de en
  gång i duken (`medSken` i rum-inredning.js). Anslagstavlans skugga och tv:ns sidor hade också filter på
  egna lager (nu oskärpa inuti, respektive en mörk toning i bakgrunden). Från 16 till 12 pass per bild och från
  127 till 74 ytor per bild.
- **Gänget.** Med mjukvarugrafik är gänget över 100 ms per bild och håller tillbaka hela rummet. Skuggorna
  lägger till ungefär 120 ms var tredje bild (därav det ryckiga), miljön kostar 40 %, de svaga lamporna
  ungefär 25 % och bildpunkterna ungefär en tredjedel; klarlacken och tonmappningen nästan inget. Därav steg 3.
- **Ritanropen.** Delar som sitter på samma led och bara skiljer sig i färgen är en enda mesh med färg per hörn
  (`slaIhop` i rum-3d.js, inte på steg 0 och inte med `?rum-hel`): från 273 till 194 anrop per bild, utan att det
  syns. Jämfört i tolv lägen (olika tider, mål, väntan på kupongen, matcher på tv:n, natt, påhitt och tecken):
  61–76 dB.
- **Stoppen under laddningen.** Neonens rör räknades ut ur bokstäverna vid varje start, 1,6 sekunder i
  Chrome som telefon, för samma svar varje gång; nu ligger de färdiga ([public/rum-neon.js](public/rum-neon.js)).
  Grafikprogrammen byggs i bakgrunden (`compileAsync`), och inredningen målas en sak i taget. Längsta stoppet
  1,5–2,1 s → 0,34 s och alla långa stopp tillsammans 3,4–4,3 s → 1,9 s, och allt i rummet är klart efter 7,6–8 s i
  stället för 8,6–9,6.
- **Väckningarna i telefonen.** Huvudtråden väcks inte när den inget har att göra också i Chrome i telefonen
  (`TOMMA`), och sakerna och gatan turas om i stället för att ritas varje gång: 43 väckningar i sekunden i
  stället för 60. Dammet i ljuset, en stor duk som ritas om, är borta i telefonen.

Mätt med gammal och ny kod om vartannat, median:

| | Före | Efter |
|---|---|---|
| Mjukvarugrafik som telefon: bilder i sekunden | 18 | 56–58 |
| Mjukvarugrafik som telefon: bildrutor över 50 ms på 8 s | 85–87 | 0 |
| Mjukvarugrafik som telefon: gängets bilder i sekunden | 11 | 15–16 |
| Mjukvarugrafik som telefon: allt klart | 34–36 s | 24–25 s |
| Mjukvarugrafik som dator (1366 × 768): bilder i sekunden | 4 | 12–13 |
| Mjukvarugrafik som dator: längsta bildrutan | 283–317 ms | 100–117 ms |
| Mjukvarugrafik som dator: allt klart | 70–73 s | 50–52 s |
| Som telefon, 128 MB ritminne: bildrutor med hål hemma | 181 av 181 | 2 av 180 |
| Som telefon, 128 MB ritminne: bildrutor med hål vid tavlan | 90 av 90 | 2 av 89–90 |
| Som telefon, processorn × 4: huvudtråden stilla | 202 ms/s | 166 ms/s |
| Som telefon: grafikprocessen stilla | 50 ms/s | 29 ms/s |
| Snabb dator: bilder i sekunden | 60 | 60 |
| Snabb dator: grafikprocessen stilla | 162 ms/s | 138 ms/s |

Delarna går igenom alla närbilder och Hasse Backe utan fel i Chrome som telefon och som dator, och i WebKit i
telefonstorlek (60 bilder i sekunden stilla, samma tid till klart som förut). Bilderna jämförda hemma: rören i
neonen är desamma och skenet lika, och dagsljuset i telefonen är lite mattare i det svarta (35,7 dB). På steg 3
är gänget matt och mjukare, men det är fortfarande de och samma rum.

Prövat utan effekt: planen som `preserve-3d` (fyra pass mindre, men kupongen skär genom pulten, eftersom den lutar i
rummet), och delar under grupper som ingen flyttar (inga fler ihopslagningar). Inte mätt i en riktig telefon. Kvar:
vägen fram till videon i telefonen är tyngst (ungefär 40 bilder i sekunden med processorn fyra gånger långsammare, som förut).

### Flyt och flimmer på svaga telefoner

Mätt som telefon i Chrome (412 punkter bred, täthet 2,625) med 128 MB ritminne (`--force-gpu-mem-available-mb`,
det som framkallar flimret) och med mjukvarugrafik och processorn fyra gånger långsammare (`--use-angle=swiftshader`,
det som framkallar en svag grafikkrets), gammal och ny kod om vartannat. Tre saker stod för det mesta:

- **Hela rummet ritades om 60 gånger i sekunden fast gänget rör sig 15–20 gånger.** Grafikkortet flyttade ett par
  dussin små dukar på gatan var för sig, regnbanden, ångan ur kaffet och dropparna på rutan, och varje sådan rörelse
  är en bildruta där alla rummets lager läggs igen, ungefär elva skärmytor över varandra. I telefonen är hela gatan nu
  en enda duk (`gatduk` och `ritaGatan` i rum-ute.js, stor som det man ser genom fönstret och dörren, utan
  genomskinlighet): himlen, molnen, fåglarna, husen, de som går förbi, flaggan, löven, regnet och snön ritas där.
  Ställningarna ritas i samma bildruta som gänget, och sakerna på pulten varannan gång (`frame` i rum.js). Först
  ritades också gatan bara i gängets takt; se nästa avsnitt.
  Ångan, dropparna, strålarna bakom oraklet, skimret på glaset och tv:ns ljusband står still från steg 1
  (`.enkel`). I datorn gäller samma sak från steg 1, annars som förut.
- **Tre ljuslager över hela skärmen** (värmen, dagsljuset och vinjetten) är en bild i telefonen i Chrome (`ljusIhop` i
  rum.js), och det svagaste skenet från neonen är borta där. Det syns inte, men grafikkortet lägger ett lager i
  stället för tre i varje bildruta.
- **Ritminnet tog slut i närbilderna.** Vid anslagstavlan ville rummet ha 151 MB och vid kortregistret 142 MB (hemma 65
  MB), och med mindre än så försvann bitar och kom tillbaka: toningen saknades på halva skärmen, en lapp på tavlan var
  tom. Toningen är en liten duk i telefonen (`tonaDuk`, 10 MB mindre), glansen på tavlan i närbilden är borta där (7 MB),
  tv:ns baksida, som aldrig syns, är borttagen (5 MB), och gängets kuponger på pulten (`hogenBort`, 30 MB) tas bort medan
  kameran står vid tavlan eller registret, där de bara skymtar i ett hörn under toningen, och kommer tillbaka när
  kameran har kommit hem. Nu 97 respektive 111 MB.

Mindre saker: gänget har kantutjämning i telefoner som börjar på steg 1 (`kantutjamning` i rum.js), för trappstegen
som kröp längs ansikten och armar såg ut som flimmer. Det kostar ungefär en fjärdedel av gängets tid på grafikkortet
(4,0 → 5,2 ms på Apple-grafik, som ritar i små rutor som telefonerna), men inte på PowerVR, vars drivrutin redan har
kraschat av skuggkartan. När steget byts töms inte gängets och sakernas dukar längre till nästa bild (de blinkade
bort). Spegelbilden i Hasse Backes disk blev tom på kvällen: three läste bildens storlek i sidan i stället för dess egen,
med ett grafikfel som följd.

Mätt före och efter: hemma 60 → 22–26 omritningar av hela rummet per sekund, med fingret som drar lika jämnt som förut
(60 bilder i sekunden). Med 128 MB ritminne bildrutor med hål vid tavlan 164 av 182 → 26 av 122 (bara i början,
saknade rutor 1 359 → 250–500), vid registret 160 av 181 → 4 av 116 (855 → 14), på väg tillbaka från tavlan 718 → 110–180
saknade rutor och från registret 53 → 0–1. Med mjukvarugrafik på steg 3: gängets bilder 12 → 14–15 i sekunden (15 är
takten) och 600 → 460 ms arbete i grafikprocessen per bild; på steg 2 8–9 → 10–11. Närbilderna, dag, kväll, regn och
snö är jämförda bild för bild i Chrome som telefon och som dator, och rummet är provat i WebKit i telefonstorlek. Inte
provat i en riktig gammal telefon: `matchfixarna.se/?rum-mat` ger siffrorna där. Kvar: hål när man drar snabbt till en
del av rummet som inte har ritats än (gängets kuponger och tavlan på väggen, Chrome ritar inte det som ligger långt
utanför bilden i förväg) och på väg tillbaka från videon (ungefär lika många som förut, men inte synliga på en snabb dator).

### Bilarna och de som går förbi glider jämnt

2026-11-09, användarens önskemål: "kan du ordna så att bilar etc utanför fönstret inte längre hackar fram … i
värsta fall justera ner grafiken", och "det gäller självklart även fotgängare". Sedan gatan blev en enda duk (ovan)
ritades den bara när gänget ritades: 20 gånger i sekunden i telefonen och på datorns steg 1, och på datorns steg 2 och
3 bara var andra eller tredje gång, 7,5 respektive 5 gånger i sekunden. En bil kör 150–240 px i sekunden, så den
hoppade 8–12 px åt gången, och på de lägsta stegen 20–48 px.

Nu skiljs ställningen från platsen. Benen, armarna, hjulen, vingarna, löven och flaggan ritas som förut i gängets takt,
men i en ruta per figur i ett gemensamt ark (`stall` och `ark` i rum-ute.js). Var figurerna är på gatan räknas om i
varje bildruta, högst 60 gånger i sekunden, och då läggs bara himlen, husen och rutorna ut i gatans duk (`glid` i
rum-ute.js, `gatan` i rum.js) – ett par dussin kopieringar, 0,1 ms. Arket ligger i processorn: som ett tjugotal egna
små dukar blev figurerna lika många ytor på grafikkortet (i processorn lika många uppladdningar i varje bildruta), och
att rita figurerna direkt i gatans duk i varje bildruta tog för lång tid i grafikprocessen (40 bilder i sekunden som
telefon). Det görs bara medan något som far förbi syns genom fönstret eller dörren
(de som går, cyklar och kör, fåglarna, löven, regnet och snön); syns bara molnen, som driver några px i sekunden, ritas
gatan i gängets takt som förut, och huvudtråden får sova mellan gängets bilder i Chrome. Ställningarna ritas med
varje bild av gänget på alla steg (`ute` i `KVAL`, som gjorde gatan glesare i datorn, är borta). I Chrome räknar
`kanna` nu bara gängets bilder, eftersom huvudtråden väcks i varje bildruta medan något far förbi.

Mätt i Chrome som telefon (412 × 780, täthet 2,625, processorn fyra gånger långsammare, grafikkortets vägar med
SwiftShader, utan gänget), gammal och ny kod om vartannat, tre varv: gatan 20 → 60 gånger i sekunden, en bil flyttar sig
3,3–3,6 px mellan två bildrutor och de som går 0,6 px, rummet lika jämnt (60 bilder i sekunden, 95:e percentilen
16,7–16,8 ms, ingen bildruta över 25 ms i någon). Priset är huvudtråden: 131–156 → 271–300 ms per sekund, mest för att
rummets lager lämnas över till grafikkortet i varje bildruta (`Commit`), och grafikkortet lägger ihop hela rummet 60
gånger i sekunden igen medan något far förbi, som före 2026-11-08 men med en duk i stället för ett par dussin. I
datorstorlek (1300 × 800) hinner SwiftShader inte det, varken med den nya koden eller med den gamla tvingad till 60
gånger i sekunden (25–50 bilder i sekunden); ett riktigt grafikkort gjorde det i datorn på alla steg före 2026-11-08.
Gatans duk är densamma vid samma tidpunkt (62–109 av 126 000 bildpunkter skiljer, i figurernas kanter), dag, regn,
höstlöv och paraplyer. Gänget går inte att mäta i en dator utan grafikkort (1–2 bilder i sekunden med båda); i en
riktig telefon ger `?rum-mat` siffrorna. Hinner telefonen inte med går rummet ner ett steg som förut, men gatan glider
lika jämnt.

### Färre lager att lägga ihop (2026-11-09)

Varje bildruta där något i rummet har ändrats lägger grafikkortet alla rummets lager över varandra (medan något far
förbi utanför 60 gånger i sekunden, se ovan), och på en svag grafikkrets och en skärm med hög täthet är det ytan som kostar: i ett fönster på 2880 × 1800 bildpunkter är varje lager
över hela skärmen 5 miljoner bildpunkter att blanda in. Räknat ur Chromes lagerträd (`LayerTreeHostImpl:snapshot`, hur
mycket av fönstret varje lager som ritar något täcker) låg rummet hemma på ungefär 7 skärmytor i telefonen och 9,4 i datorn
på steg 1, där svagare datorer börjar (sidans och scenens bakgrund under scenen oräknade). En del av det var tomt:

- **Utsikten.** När gatan är en enda duk (`gatduk`, i telefonen och i datorn från steg 1) låg himlens liv, blixten,
  gatans lager, livet på gatan, nederbörden och glaset kvar som tomma eller nästan tomma lager i hela utsiktens storlek
  ovanpå duken. Eftersom de ligger över duken blev de tillsammans med skyltarna ett lager i hela utsiktens storlek, 0,8
  skärmytor i telefonen och 1 i datorn. Nu syns de tomma inte, gatans och glasets lager har ingen egen storlek (det som
  står kvar i dem har sin egen), rännilarna är borta där (dropparna rinner inte från steg 1) och glasets SVG är bara så
  stor som fönstret och dörren (`glas` i rum-ute.js, rum-ute.css). I telefonen är dropparna, snön och frosten på rutan en
  bild i duken (`bakaGlas`; utsikten ritas där ändå med 0,4 bildpunkter per px), i datorn ett lager över glaset som förut,
  i full skärpa.
- **Blixten** vid åska var två lager i hela utsiktens storlek som tonade upp och ner på grafikkortet hela tiden, och
  rummet ville sättas ihop 60 gånger i sekunden för deras skull. Med gatan i en duk blinkar den nu i duken när gatan
  ritas, med samma nyckelbilder (`blixtA`). Mätt före *Bilarna och de som går förbi glider jämnt* ovan, som telefon på
  steg 1 utan 3D: 15 sammansättningar i sekunden med grafikprocessen full → 19–20, gängets takt. (Nu ritas gatan i varje
  bildruta medan det regnar, och åskan har regn: där är vinsten de två lagren.)
- **Ljuset** (värmen, dagsljuset och vinjetten) är en bild i datorn från steg 1 också, som redan i telefonen (`ljusIhop`).
  Där värmen ska vara borta, nära radion och med videon inzoomad, syns vinjetten för sig (rum.css): med ljuset i en bild
  låg värmen förut kvar där i telefonen och tvättade ur det svarta.
- **Det svagaste skenet från neonen** (5 % täckning, över halva rummet) är borta i datorn från steg 1, som i telefonen
  (`.rum-svag`).
- **Taket** ovanför scenen i telefonen på höjden är en duk en bildpunkt bred (`takDuk`). Som bakgrund ritades det i rutor
  över 2000 px bredd, och det var det som oftast fattades när man drog snabbt åt sidan med lite ritminne.

Mätt i Chrome 153 med mjukvarugrafik (SwiftShader) som telefon (412 × 870, täthet 2,625) och som dator (1440 × 900), gammal
och ny kod: skärmytor per bild i telefonen 7,99 → 7,31, också i regn och snö (förut lika mycket), i datorn på steg 1 11,36 →
8,99 och i regn 11,36 → 9,31 (sidans bakgrund, som scenen döljer, räknad: utan den ungefär −10 % i telefonen och −25 % i
datorn). Mjukvarugrafiken visar inte ytan så mycket som ett riktigt grafikkort (den har en fast kostnad för varje lager): i
datorn på steg 1 utan 3D 8,5 → 9,1 sammansättningar i sekunden. Med 128 MB ritminne och fingret som drar snabbt fram och
tillbaka saknas inga rutor i taket längre; det som ibland fattas är tv:ns sidor och anslagstavlan, gammal och ny kod lika.
Bilderna (dag, kväll, regn, åska, frost och snö, telefon och dator på steg 0 och 1) är jämförda punkt för punkt: 48–67 dB,
där det som skiljer är uret, Hasses hand och enstaka kanter. Inte provat i en riktig telefon.

### Jämnare kanter och jämnare takt (2026-11-09)

Användarens önskemål: "Förbättra grafiken på animationssidan … men att det flyter, flimrar och hackar mindre på
begränsade grafikkort och äldre mobiler." Gänget i 3D är det som både ser sämst ut och kostar mest på en svag
enhet, så de tre ändringarna gäller det:

- **Kantutjämning där den behövs.** På steg 2 och 3 (och steg 1 i datorn) ritades gänget utan kantutjämning i en duk
  med en bildpunkt per punkt eller glesare, i en telefon två–tre av skärmens bildpunkter: trappsteg längs huvuden,
  armar och bordskanten, som kryper när gänget rör sig. Nu är den på på steg 0 och överallt där duken har högst 1,15
  bildpunkter per punkt (`kantutjamning` i rum.js): alla steg i telefonen, alla steg på en skärm med täthet 1 och från
  steg 2 med täthet 2. På steg 1 med täthet 2 är duken tät nog och stor nog att den kostar mer än den ger (där som
  förut). Inte med mjukvarugrafik och inte på PowerVR. Den kostar efter dukens yta, och där är duken liten: mätt på
  Apple M1 (som ritar i små rutor som telefonerna) 1080 × 420 bildpunkter 3,2–3,9 → 4,8–4,9 ms per bild på steg 2 och
  1,5–1,8 → 2,3–2,4 ms på steg 3, 15 gånger i sekunden; på steg 1 med täthet 2 (2160 × 840) hade det varit 6,1–6,5 →
  9,4–9,6 ms.
- **Röken ur cigaretterna är en enda mesh** (`ROK` i rum-3d.js, som röken på pulten redan var): förut en sprite med
  eget material per puff, ungefär 145 ritanrop i varje bild av gänget – på steg 3 mer än en tredjedel av alla (382 →
  238), på steg 0 755 → 611 med skuggorna. I en svag telefon är det anropen som tar tiden, på huvudtråden och i
  webbläsarens grafikprocess. Bilden är densamma (56,5 respektive 52,4 dB mot förut i två lägen, där det som skiljer är
  uret och enstaka kanter).
- **Skuggorna ritas i en egen bildruta.** Där skuggorna räknas om var andra–fjärde bild (steg 1 och 2) gjordes det i
  samma bild som gänget, så att den bilden bar alla delar två gånger: 427–458 ritanrop mot 248–279 i de andra, i
  jämn takt, och det är den bilden som blir för lång i en svag telefon. Nu räknas skuggkartan om för sig två
  bildrutor senare, där inget annat ritas (`skuggaSen` i rum-3d.js): tyngsta bildrutan 458 → 249 anrop, skuggkartan
  180 för sig. Lika mycket arbete totalt, men ingen bildruta bär allt. Skuggorna är från ställningen gänget just
  ritades i och syns från nästa bild; de var redan upp till tre bilder gamla.

Mätt i Chrome som telefon (412 × 870, täthet 2,625) med Apple M1:s grafik, gammal och ny kod om vartannat.
Ritanropen är räknade i grafikanropen och är säkra. Tiderna på huvudtråden med processorn fyra gånger långsammare
pekar åt samma håll (gängets bild på steg 1 i median ungefär 9,5 → 8,6 ms, 95:e percentilen 11,5–18,5 → 8,7–14,3) men
datorn var belastad av annat under mätningen, så de är ungefärliga. Rummet och närbilderna (tv:n, tavlan, registret,
videon) går utan fel som telefon på höjden och på tvären på steg 1–3 och som dator (1440 × 900 täthet 2, 1366 × 768
täthet 1 på steg 1 och 2). Inte provat i WebKit och inte i en riktig gammal telefon: `matchfixarna.se/?rum-mat` ger
siffrorna där. Prövat utan effekt: enklare filtrering av skuggorna (`PCFShadowMap`, samma tid på grafikkortet), och
att slå ihop fler av gängets delar (de som är kvar rör sig var för sig eller har olika material).

### När något går fel i rummet

- **Matcherna går inte att hämta:** `whenMatches` väntar inte förgäves, och `load` försöker igen
  varje minut. Förut förblev rummet utan matcher tills sidan laddades om, och varje försök la till
  en lyssnare.
- **Fel i datan:** ett undantag i `fill` lämnar inte rummet mörkt (`tand`). Tv:n klarar en spelad
  match utan resultat.
- **Dold flik:** rummet frågar inte tjänsten varje minut.
- **Musen släpps utanför fönstret:** rummet slutar följa musen vid nästa rörelse utan knapp.
- **Fönstret ändras:** tv:n nära siktas om så att den ryms, och kommer tavlan flygande är den
  framme med en gång, med foten och pekeffekten.
- **Snabba tryck:** anslagstavlan och kortlådan vänder där de är i stället för att hoppa till
  slutläget (hopp på 677 → 48 px mellan två bildrutor med A två gånger).
- **Inget ändrades:** kupongen på pulten skrivs inte om vid varje `fill`. Jämförelsen mot `innerHTML`
  blev aldrig lika, eftersom webbläsaren skriver `<path …/>` som `<path …></path>`. Tv:n vrids inte
  när kupongen tas i handen om den inte var nära (`zoomTv`).

### I Safari i telefonen

I iPhone ritar alla webbläsare med WebKit, Safaris motor. Mätt i WebKit på datorn
(WKWebView i 390 × 664 med täthet 3, som en iPhone: bildrutorna, Safaris lagerträd, dess
räknare för omritningar och filmer av fönstret) hackade rummet på tre sätt:

- **När man drog med fingret** byggdes lager om vid kanten av bilden. Safari lägger det som
  ligger över något som rör sig eller står i 3D i ett eget lager – men bara medan det syns,
  så varje gång anslagstavlan, tv:n eller oraklets ram kom in i eller gick ut ur bild blev
  ett tjugotal lappar, nålar och knappar egna lager eller slutade vara det, och tavlan
  ritades om (50–90 ms på datorn) och blinkade. Polaroiden på väggen stod i 3D fast den bara
  vänds i handen, tv:ns ljusband rullade, och strålarna bakom oraklet och skimret på glaset
  rörde sig. Nu är polaroiden platt på väggen (`#ans-vagg` i rum-anslag.css), och i
  telefonen står ljusbandet, strålarna och skimret still (rum-tv.css, rum.css): när man drar
  över hela rummet ändras antalet lager mellan 453 och 463 i stället för mellan 476 och 523.
  Samma sak gjorde att tv:ns sifferruta, knappar, högtalare och Panasonic-logga inte ritades
  i Safari i telefonen, och att lådan bredvid videon ritades fel; nu syns de.
- **Kameran efter fingret**, och när den gled på plats efter en närbild, vreds i gängets takt
  – 20 gånger i sekunden på steg 1, där telefonen börjar – så att rummet ryckte efter scenen.
  I WebKit vrids den nu i varje bildruta (`loop` i rum.js); där kostar vridningen lite.
- **I början av närbilderna** (och på vägen tillbaka) tog den första bildrutan 100–250 ms på
  datorn medan övergångarnas klocka gick: Safari ritar hela rummet när kameran lämnar
  hemmet (`kvar`), och mycket när tv:n vrids, rummet svängs runt videon eller anslagstavlan och
  kortregistret visas nära. När första bilden syntes hade kameran redan gått två tredjedelar
  av vägen till videon och till anslagstavlan. Nu ritas det nya först, och rörelserna börjar
  efter minst två bildrutor, när en bildruta har gått fort igen (`sedan` i rum.js: kameran,
  rummets sväng, hörnets sväng i rum-video.js och tv:ns vridning i rum-tv.js); rummets plan
  får en osynlig rörelse direkt, eftersom det tunga i Safari börjar först när de rör sig.
  Anslagstavlans och kortlådans flygturer räknar tiden på samma sätt (`fly` i rum-anslag.js,
  `step` i rum-kortlada.js). Chrome gör som förut.

Mätt omväxlande med gammal och ny kod: fingret som drar fram och tillbaka 56–59 → 59–60
bilder i sekunden, med längsta bildrutan 55–103 → 23–49 ms och 3–8 → 0 bildrutor över 50 ms; ett svep
över hela rummet längsta bildrutan 73 → 29 ms; kameran vrids 19 → 59 gånger i sekunden medan
fingret drar, ändå med ungefär en fjärdedel mindre arbete för grafiken. Den första bilden på
väg till videon visar kameran 5–13 % av vägen fram (förut 57–72 %) och 0–6 % tillbaka
(förut 24–30 %), och därifrån glider den jämnt; till tv:n, anslagstavlan och kortregistret
0–1 % (förut upp till två tredjedelar). Minnet är inte högre (topparna när man går till tv:n,
videon, anslagstavlan, kupongen och kortregistret efter varandra 1,3–1,4 GB mot 1,3–1,5), och
närbilderna ser ut som förut.

Telefonen hackade ändå (användaren 2026-11-02), och det mesta av det som återstod märks knappt
på datorn, som har mycket mer grafikkort och minnesbandbredd:

- **Bildrutan väntade på 3D-ritningen.** Innan en bildruta går iväg väntar Safari på att
  grafikprocessen har ritat klart det som har ritats i 3D (`prepareForDisplay`). Gänget, sakerna
  och gatan ritades alla i samma bildruta, var tredje, så att just den blev för lång – det man
  såg som hack när man drog med fingret. Nu ritas de i Safari var och en för sig, en i varje
  bildruta, direkt efter att bildrutan har gått iväg (`efterBild` i rum.js, ett meddelande från
  bildrutan, som kommer efter den), så att grafiken har en hel bildruta på sig. Gänget syns en
  bildruta senare, och det märks inte.
- **Gänget kostar mindre.** Ställningarna räknades två gånger per bild (röken ställer figuren
  där den var när blosset föddes, och den ställdes tillbaka efteråt; nu kommer röken först).
  Håret, en tredjedel av alla trianglar, har drygt hälften så många i telefonen (`hairGeo`), utan
  att det syns i den storleken. Små delar som fingrar och knappar kastar ingen skugga där
  (`utanSmaSkuggor`), och skuggorna räknas om var tredje bild i stället för varannan på steg 1.
- **Oskärpa och blandning i varje bildruta är borta.** Safari saknar `ctx.filter`, så gatans
  figurer, löven, fåglarna och flaggan hade `filter: blur()` i CSS – ett eget pass på grafikkortet
  för var och en, ett tjugotal, i varje bildruta. I telefonen har dukarna en halv bildpunkt per
  px (molnen en femtedels), och förstorade är de lika mjuka. Hela gatan hade samma filter: den
  ritas nu en gång i två grova dukar med 0,4 bildpunkter per px (`bakaGata` i rum-ute.js), som
  ser ut som förut och tar en bråkdel av minnet. (Ett filter inne i SVG:n blev dyrare: Safari
  släpper det som är utanför bilden medan kameran står nära och ritar om gatan vid varje närbild.)
  Blandningslägena över hela rummet (ljuset, dagsljuset, dammet) läses mot allt bakom i varje
  bildruta; i telefonen läggs ljuset ovanpå som vanligt, vilket ser nästan likadant ut. Kornet,
  som knappt syns så litet, och röken under taket, som rör sig några bildpunkter i sekunden, står
  inte på där.
- **Videolådans furu** var ett SVG-filter som räknades om i processorn varje gång lådan ritades
  om, också när kameran gick fram och tillbaka. I telefonen är det bakat som bruset i väggarna
  (`BAKA` i rum.js).
- **Gatan frågade efter tiden.** För att rita bara de figurer som syns läste `takt` i rum-ute.js
  varje figurs läge (`getComputedTiming`), och i Safari räknar varje sådan läsning om stilen och,
  om något har ändrats, alla rummets lager. Nu läses en figur åt gången och läget räknas fram
  däremellan. I telefonen ritas hälften av figurerna åt gången. Kortlådan räknar om skuggorna var
  tredje bild medan den rör sig (ungefär 300 ritanrop per bild).
- **Stegen.** Stadiga 30 bilder i sekunden är en telefon i strömsparläge och räknas inte längre
  som dåligt (`kanna`) – gänget blev bara ryckigare av att gå ner ett steg. Steget sparas under
  ett nytt namn (`rum-kval2`), så att telefoner som hade fastnat på det lägsta börjar om.

Mätt på samma sätt, omväxlande gammal och ny kod (median av tre varv, belastning 4–6): 95:e
percentilen av bildrutorna när rummet står still och när fingret drar 21 → 18 ms, de längsta
1 % 24 → 18 ms, bildrutor över 25 ms när det står still 2 → 0, längsta bildrutan till videon
165 → 132 ms och 80–100 MB mindre minne genom hela turen (1,10 → 1,02 GB hemma, 1,46 → 1,35 GB i
topp). Med gänget ritat fyra gånger per bild, för att efterlikna en långsammare grafikdel: bildrutor
över 25 ms medan fingret drar 13 → 3, och när varje ritning väntar in grafiken 101 → 5 på 5
sekunder (95:e percentilen 41 → 24 ms). Rummet ser likadant ut: jämfört bild för bild dag, natt
och regn, närbilderna, kupongen och anslagstavlan. Anslagstavlans långa bildrutor (150 ms på
datorn) är kvar: de är väntan på grafikkortet när lapparna ritas.

**I Chrome i telefonen** (Pixel 10, Android) ritas gänget, sakerna och gatan också var för sig
(`WEBKIT || LATT` i `frame`), så att fingret inte behöver vänta på att allt ritas i samma bildruta.
Mätt i Chrome som telefon (412 × 780, täthet 2,6, processorn fyra gånger långsammare), omväxlande
före och efter, median av tre varv: 95:e percentilen när rummet står still 24 → 18 ms och när
fingret drar 27 → 18 ms, bildrutor över 25 ms under sex sekunders drag 52 → 1. Kvar: ibland ett
enstaka stopp på ungefär 115 ms när sakerna på pulten ritas under draget (en gång per körning, i
ungefär hälften av körningarna; inte förklarat).

**Ingen skuggkarta på PowerVR** ([public/rum-gpu.js](public/rum-gpu.js)): i en Pixel 10 (grafikkort
PowerVR D-Series, Chrome 156, Android 17) kraschade Chromes grafikprocess alltid vid gängets bild 9–10,
i drivrutinen (`LoadTextureState` i `libGLESv2_powervr.so`) eller med ett grafikkort som hängde sig
(*Restarting GPU process … Context was lost*). Allt på grafikkortet var då borta: gänget försvann,
inredningen blev tom och där sakerna på pulten låg stod en vit ruta med ett ledset ansikte, Chromes bild
för tappad WebGL. Efter en krasch vägrar Chrome dessutom 3D i ungefär två minuter (*Web page caused
context loss and was blocked*). Koden från före ändringarna ovan kraschade likadant, så det var inte de;
när det började vet vi inte. Provat i telefonen med bara gänget på en egen sida, en sak i taget, kraschade
det vid samma bild utan mipmaps, utan anisotropi, med WebGL 1, med täta `flush`, fem gånger långsammare,
med grafikkortet färdigt mellan bilderna (12–18 ms per bild), med skuggorna omräknade varje bild eller
bara en gång, med PCF i stället för mjuka skuggor och med skuggor bara på bordet. Utan skuggkarta höll det
i varje försök, som längst 400 bilder och 162 000 ritanrop. På PowerVR ritas därför gänget, sakerna,
inredningen och kortlådan utan skuggkarta (`utanSkuggor`; `?rum-skuggor` visar dem ändå, för att prova nya
versioner av drivrutinen). Figurerna kastar där ingen skugga, men allt annat ser ut som förut. Hela rummet i
telefonen, tre omgångar med riktiga fingerdrag och närbilder, närmare tre minuter: ingen krasch och
allt på plats. Stilla 60 bilder i sekunden, 95:e percentilen 18–19 ms och längsta bildrutan 19–23 ms; när
fingret drar 57–58 bilder i sekunden, 20–21 ms och 56–72 ms, 1–4 bildrutor över 50 ms på 5,6 sekunder (före
ändringarna, då gänget hade kraschat och inte ritades, 52–55 bilder i sekunden och 130–258 ms). Då var
anslagstavlan kvar (174–273 ms och 7–8 bildrutor över 50 ms på vägen fram), och Chrome skrev ibland *tile memory
limits exceeded*, att minnet för att rita sidan tar slut, vid närbilderna; se de tre följande styckena.

**Gänget före sköldarna:** drygt 90 lagsköldar i de dolda flikarna hämtades först av allt och knuffade gängets
filer bakåt på långsamt nät. Nu hämtas de när de syns (`loading="lazy"` i [public/skoldar.js](public/skoldar.js)
och [public/kronan.js](public/kronan.js)), gängets kod och bilder börjar hämtas när rummet visas (`forhamta` i
rum.js; de hamnar i webbläsarens cache och tar inget minne förrän de används), och när 3D-delarna står där släpps
resten (`slappBilder`): sköldarna i rummet alltid, de i flikarna bara med bra nät. Mätt i Chrome som telefon
(processorn fyra gånger långsammare), gammal och ny kod om vartannat, median: med 60 kB/s syns rummet efter
15,5 → 15,6 sekunder, gänget efter 44,7 → 28,7 och allt i rummet efter 52,7 → 35,5, medan alla sköldar är klara
efter 35,1 → 54,5; utan nätbroms (tio varv) rummet 2,4 → 2,4, gänget 4,0 → 3,9 och allt 9,6 → 8,7; i datorn (utan
broms, sju varv) rummet 0,1 → 0,1 och gänget 1,6 → 1,6. Att vänta med gängets filer tills rummet syns gav inget:
rummet lika sent, gänget 0,4 sekunder senare.

**Ljuset på dukar:** i Chrome ritas ett lager i perspektiv i minst sin egen storlek, hur litet det än syns, så
ljuset, som knappt syns, tog mest av minnet för att rita sidan. `ljusDukar` i rum.js (bara Chromium) lägger de tre
skenen, `.rum-warm`, `.rum-vign` och tv:ns sken på dukar, som är små (tillsammans ungefär 2 MB), ligger utanför det
minnet och inte ritas om nära. Mätt med Chromes egen uppgift om varje lager (412 × 780, täthet 2,625): hemma
199 → 128 MB, nära tavlan 204 → 139, nära tv:n 149 → 81, nära videon 170 → 123, nära kortregistret 175 → 118. Bilderna
jämförda med den gamla koden hemma och nära, i telefonens och datorns storlek: 46–60 dB (två körningar av den gamla
koden i datorns storlek skiljer sig 49–63 dB), ingen skillnad att se.

**Anslagstavlan på vägen fram:** stoppen kom inte av ritandet (8–23 ms av 200) utan av att `draw` byggde om hela
tavlan för varje matchfil som kom under flygningen, ungefär 13 gånger, och att `scan` i
[public/slitage.js](public/slitage.js) gick igenom sidan efter varje gång. Nu samlas matchfilerna ihop (`rita`,
100 ms), tavlan väntar tills flygningen är klar (`A.flyger`, `landat`), bara lappar som ändrats ritas om och
slitage.js bryr sig bara om sina egna element. Mätt som ovan, fyra varv: 41 → 60 bilder i sekunden, längsta
bildrutan 160 → 35 ms, bildrutor över 50 ms 4 → 0, vägen tillbaka oförändrad.

**Väggarna är inte färdigritade i förväg:** provat på samma sätt som ljuset blev de synligt mjukare nära uret, det
tog 0,3 sekunder extra vid start på en Apple M5 och minnet flyttades mest ur ritbudgeten (hemma ner till 102 MB).
Tavlan på väggen hade gett högst 18 MB och 15 lager till, men behöver typsnitten och sköldarna inbäddade och göras
om när datan ändras; stoppen är borta utan det. I WKWebView (390 × 664) byggs rummet som förut och tavlan öppnas och
stängs utan fel; Safari får inga ljusdukar. Inte mätt i den riktiga telefonen än, och därför inte heller om *tile
memory limits exceeded* är borta.

**När grafiken ändå tappas** (`webglcontextlost` i rum.js) göms de tappade dukarna direkt, så att den vita
rutan inte syns, och sidan laddas om, så att allt kommer tillbaka – med det lägsta steget och, om det händer
igen inom tio minuter, utan 3D-delarna (`R.ej3d`, `tur`), så att sidan inte kan krascha grafikprocessen om
och om igen. Kupongen i handen får vara färdig först, och med fliken dold väntar omladdningen tills den syns.
Utan lagring laddas sidan inte om. Provat i Chrome som telefon med `Browser.crashGpuProcess` tre gånger i
rad: omladdad efter 0,3 sekunder med allt tillbaka, sedan utan 3D-delarna, sedan ingen omladdning.

**Mätning i den riktiga telefonen:** datorn visar inte vad en telefon hinner med. Med `?rum-mat`
(matchfixarna.se/?rum-mat, [public/rum-mat.js](public/rum-mat.js), laddas bara då) kör rummet
igenom sig självt på ungefär en minut – står still, dras med ett låtsasfinger, utan gänget och
gatan och fram och tillbaka till närbilderna – och visar bildrutorna i en tabell att ta en
skärmbild av, med hur lång tid gängets kod och grafik tar per bild.

### Ljuset efter klockan

Rummet var lika upplyst överallt. Nu faller eftermiddagssolen in genom skyltfönstret över pulten, och på kvällen
lever rummet av sina egna lampor (`ljusKlockan` i rum.js, från `paintUte`). Inga nya lager, och inget ritas i varje
bildruta: allt är färdiga bilder i det som redan finns, och de byts bara när ljuset har ändrats märkbart, högst
var 15:e minut.

- **Solen:** skyltfönstret vetter åt väster, så solen kommer in från lunch till solnedgången. Solens riktning
  räknas ur klockan och höjden ur [public/vader.js](public/vader.js). Fläcken (`solBild`) har fönstrets två rutor,
  spröjsen emellan och gängets skuggor, ligger snett efter var solen står och kortas av när solen står högt (över
  44° når den inte fram till pulten). Den finns bara när solen lyser (`L.sol`), alltså inte när det är mulet.
  Fläcken ritas i en fjärdedels upplösning och blandas in i pultens egen SVG (`.rum-sol`), så att träet syns i
  ljuset. Rummet utanför solen blir lite mörkare (i `.rum-vign`), och i `.rum-dagsljus` står svaga strimmor.
- **Kvällen:** när det är mörkt ute (`L.dag` under 0,45) blir rummet mörkare i `.rum-vign`, med hål kring neonen och
  tv:n. Neonens färg faller på fönstret, gänget och väggen (`.rum-warm`, `--sken` på `.rum-neonglow`), tv:n färgar
  väggen blå (tv:ns eget sken, som släcks med tv:n), det är varmt över disken och pulten, och gänget lyses rött
  bakifrån (ljuset `win` i rum-3d.js). Nära något är `.rum-vign` svagare, så att det går att läsa.

**Mätt 2026-11-08** med allt det här och [hela rummet i telefonen](#i-telefonen) mot versionen före: Chrome som telefon
(412 × 780, täthet 2,625, processorn fyra gånger långsammare) på M5, `?rum-mat` i klart väder klockan 14, gammal och ny om
vartannat, fem varv, median. Stilla 60 bilder/s i båda. Längsta bildrutan när man drar 47 → 30 ms, fram till videon 188 → 120,
fram till kortregistret 65 → 29, fram till tavlan 60 → 71 och tillbaka 32 → 38 (lika inom bruset, två rutor över 25 ms i
stället för en). Väntan på grafiken i gänget 4,4 → 3,6 ms per bild, eftersom duken har färre bildpunkter (1620 × 630 → 1295 × 503).
Ritminnet hemma 120 → 63 MB, nära tv:n och tavlan oförändrat (63 och 125 MB; i ett fönster om 500 × 693, som är det smalaste
Chrome ritar i rätt skala). Inte mätt i den riktiga telefonen: `?rum-mat` där visar det. I WKWebView (390 × 664) byggs rummet utan fel
och bilden stämmer, men flytet är inte mätt där. Bakom videon nära syns trappor på kanterna av det som står längre bort: det är kvar,
för att rita det skarpare tar flera gånger så mycket ritminne.

### Utsikten och vädret

Tobaksaffären ligger i Stockholm, och genom skyltfönstret och dörren syns gatan som den är
där just nu. [public/vader.js](public/vader.js) räknar solens höjd och månens fas ur
klockan och hämtar vädret från Open-Meteo (fritt, utan nyckel, en gång i kvarten; sparas
på enheten), och [public/rum-ute.js](public/rum-ute.js) ritar gatan med
[public/rum-ute.css](public/rum-ute.css) för det som rör sig; de som går förbi, löven,
fåglarna och flaggan ritas i små dukar (se [När datorn inte hinner med](#när-datorn-inte-hinner-med)).
Utan nätet är det mulet och månadens vanliga temperatur.

- **Kall gata, varmt rum (2026-11-08):** medan det är ljust går färgerna ute mot blågrått, så att gänget och det varma
  rummet lyfter från gatan (`kall` i rum-ute.js). Det görs i färgerna när gatan ritas, också på dem som går förbi,
  inte med ett filter, så det kostar inget sedan. På kvällen och natten står allt som förut.
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
  medan rummet står öppet byter den som behöver om. Runt högtiderna klär de sig för dem (se
  *Högtiderna* under [Tobaksaffären](#tobaksaffären)).

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
ett klick på den eller K. Den lossnar från pulten,
lyfter, vänds upp mot betraktaren och förstoras till mitten av fönstret (så stor som får
plats mellan namnet och orden under den), svänger en aning förbi och stannar; rummet mörknar
bakom, kameran ställer sig rakt framför, och pennan följer med och rullar undan till
foten, mellan fälten och streckkoden. Samma kupong som på pulten, men rutorna är knappar: ett tryck kryssar i eller
ur (två eller tre tecken = gardering), och pennan går dit, drar det ena strecket, lyfter
och drar det andra – ett kryss med blyerts som ser likadant ut varje gång (samma
slumpfrö för matchen och tecknet). Står pennan still en stund lägger den sig vid sidan
igen. Ett kryss som tas bort suddas ut. Ditt namn står för hand överst. Har du inte sagt vem du
är står *Vem är du?* och de tre namnen blekt (den som redan har lämnat in går inte att
välja), och ett klick på ditt namn visar de andra: pennan skriver det du väljer, och stämpeln
säger vem omgången väntar på med dig först. Det går också med ett klick på någon vid bordet
(se *Klicka på någon i gänget* ovan). Fälten i foten räknas om för varje kryss.

**Motiveringen** skrivs för hand efter tiden, som på papperet: när en match är tippad står
en liten penna där, och ett klick var som helst efter tiden och man skriver på samma rad
(högst 140 tecken), så att raden aldrig blir högre – platsen står kvar också innan pennan
syns, så att ingenting flyttar sig. Pennan på kupongen går dit och följer texten medan man
skriver: spetsen står där texten slutar och hoppar lite för varje tecken. Enter eller ett
klick utanför och pennan lägger sig vid sidan igen. Motiveringen står i utkastet (samma
som papperets), syns på kupongen på pulten och följer med när man lämnar in; den som inte
får plats slutar med … och syns hel när man pekar på den.

**Hela matchen är en plats att skriva på** (2026-11-07, användarens önskemål): ett klick på
tiden eller det som står efter den – allt utom lagen och rutorna – och man skriver på raden,
med markören sist (ett klick på lagen lägger matchbladet på kupongen, se *Matchbladet* nedan): kommentaren i efterhand när matchen har startat, annars motiveringen
(`writeOn` i rum.js). Medan man skriver får texten raden: tiden och motiveringen viker
undan och lagen står med de korta namnen, så att det man skriver syns – förut kunde
fältet bli några bildpunkter brett bredvid en lång motivering, och då syntes varken det man
skrev eller det man redan hade skrivit. När man är klar står allt som förut. Raden blir
aldrig högre.

Under kupongen står till vänster *Lägg tillbaka* och, i finstil som på papperet, *Ändra
matcherna* (tills någon har lämnat in; leder till Kupong) och *Ta bort* (tills någon annan
har lämnat in), och till höger *Spara* och guldordet *Lämna in*. *Spara* sparar en kupong
som inte är färdig utan att lämna in – de andra ser tårtbiten vid ditt porträtt – och blir
*Sparad* (med en bock, släckt) tills något ändras. *Ta bort* frågar i samma ruta som på
papperet; sedan faller kupongen ur handen, och på pulten ligger nästa omgångs matcher. Utan
namn står *Vem är du?* och namnen blir röda; saknas tecken blir rutorna i de
matcherna röda och raden säger hur många, som på papperet under Kupong. Annars lämnas
tipsen in med samma kod (`Samtal.pult` och `handIn`, `POST …/samtal {gor: "tips"}`),
stämpeln *Inlämnad* slår i och kupongen vänds och läggs överst i högen; på pulten ligger
en ny. Esc, K, *Lägg tillbaka* eller ett klick utanför lägger tillbaka den samma väg
baklänges. Utkastet är detsamma som på papperet under Kupong (på enheten), så det man har
kryssat och skrivit står kvar på pulten och där; ett utkast utan namn blir ditt när du
säger vem du är.

**Din kupong ur högen.** Har du redan lämnat in tas din kupong ur högen i stället – med ett
klick på den, på kupongen på pulten eller K (så länge du bara ser dina egna
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
motiveringen, i bläck i stället för blyerts, och får minst hälften av platsen efter tiden;
motiveringen kortas i stället. Ett klick på matchen visar den hel (se ovan). Kupongen ser
likadan ut var den än ligger i rummet: kommentaren står också på gängets kupong på pulten,
så att det man skrev i handen står kvar när kupongen läggs tillbaka (förut syntes den bara i
handen).

**De andras kuponger.** När du ser någons tips – du har lämnat in och hen också, eller allas
tips visas – tas hens kupong ur högen på samma sätt: hens kryss, motiveringar och
kommentarer i efterhand, hens porträtt inringat och stämpeln *Inlämnad*, men inget att
ändra – bara *Lägg tillbaka*. Innan dess går den inte att vända (se Högen ovan).

**Uppgörelsen.** När du ser de andras tips (som när papperet visar underlaget) ligger gängets
kupong på pulten, och innan matcherna har börjat står pingklockan bredvid. Klockan, kupongen
eller K tar den i handen – klockan lyser när man pekar på
den och plingar när kupongen tas upp (`bell` och `pling` i rum.js). Gängets kupong är de tre
kupongerna lagda på varandra (2026-11-07): i varje ruta står var och ens kryss kvar, litet och
i ens bläck (blått Laino, grönt Tejder, lila Johansson, som namnen överst), på sin plats i
rutan, så att rutan blir mörkare ju fler som har med tecknet (`seats` och `smaKryss` i rum.js;
förut stod porträtten där, 8 bildpunkter stora). När man pekar på ett kryss syns personens
motivering och, på en rad under, kommentaren i efterhand (*Efteråt: …*, `efter` i
`Samtal.pult.gang`) – på pulten och i handen. Bara din egen kommentar står på raden, eftersom
raden inte blir högre. I telefonen går det inte att peka, och kryssen är för små för ett
finger: där visar ett långt tryck på rutan i handen samma rader för alla i den, på en lapp
ovanför rutan – porträttet, namnet, motiveringen med blyerts och kommentaren i bläck. Rutan
kryssas inte av trycket, och nästa tryck tar bort lappen (`wireHold` och `ordPa` i rum.js).
Gängets kryss dras med en svart kulspetspenna i stället för blyertspennan – förut blå, samma
blå som Lainos bläck, så att gängets kryss såg ut som hans: förslaget – det som fler än
hälften har med – står ikryssat från
början, eller gängets kupong om den redan är sparad, och ett tryck kryssar i eller ur (`Samtal.pult.besluta`,
sparat på enheten som på papperet).

**Pennan visar vägen** (2026-11-07). Numren på de omtvistade matcherna är inringade med
kulspetspennan: de som går att fylla i där vi inte har något tecken gemensamt (*Inget gemensamt*
på papperet), där förslaget lämnar matchen tom eller där förslaget lämnar ett
tecken som någon av oss har med utanför – till exempel en spik där två har helgarderat (`strid` i
`Samtal.pult.gang`). Eniga matcher, och matcher där förslaget får med allt vi har tippat, är inte
omtvistade. Tills en omtvistad match är klubbad står gängets kryss där blekt, som ett förslag,
så att var och ens kryss syns; när den klubbas fylls de i. I handen träder resten av kupongen
tillbaka – de matcher som inte är omtvistade – så länge någon omtvistad match återstår, så att
det mörka är det vi ska prata om; en klubbad match står kvar mörk med sin bock, så att den går
att kryssa färdigt (en halvgardering är två tryck), och när den sista är klubbad står hela
kupongen fram igen (`.strid` och `.klubbad` i rum.css). Papperet under Kupong märker samma
matcher på samma sätt (*Inför uppgörelsen*, punkt 4). På kupongen på pulten står efter tiden en
förklaring i sitt bläck, med de korta lagnamnen och utan tiden så att den får plats: den som avviker,
annars den vars tips gängets tecken just nu lämnar mest utanför, annars den första som har skrivit
något (`avvik` i `Samtal.pult.gang`, `skal` i rum.js). I handen står i stället allas kommentarer under
raden (*Talongen live* nedan). Pennan väntar till
höger om rutorna vid den första omtvistade matchen som inte är klubbad. En match klubbas när
gängets tecken i den ändras, eller med ett klick på raden – numret, tiden eller förklaringen,
medan lagen lägger matchbladet på kupongen som förut – och pennan drar bocken; då får
ringen en bock och pennan går vidare till nästa, och när alla är klubbade lägger den sig vid
sidan. Klubbat sparas på enheten för omgången (`profeterna.rum.klubbat`, `klubba` och `klar` i
samtal.js) och delas med de andra, samma i rummet och på papperet, och *Börja om* tar bort bockarna.
Kupongen i handen och på pulten följer med när någon annan kryssar (*Gängets kupong i realtid* under
[Inför uppgörelsen](#inför-uppgörelsen)). Är gängets kupong
redan sparad och inget klubbat på enheten är alla klubbade (`klar` i `Samtal.pult.gang`), och när
gängets kupong sparas klubbas det som återstår – en sparad kupong står aldrig med bleka kryss. **Första gången** gängets kupong tas i handen på enheten under omgången
(`profeterna.rum.lagda`) läggs de tre kupongerna ur högen på den, en i taget och
genomskinliga, och var och ens kryss stannar kvar i rutorna; sedan dras gängets kryss, ett i
taget, och pennan ringar in numren och väntar vid den första (`uppgorelse` i rum.js, ungefär
fyra sekunder). Därefter står allt där direkt. Man kan kryssa medan det pågår.

*Börja om* i finstil går tillbaka till förslaget, och
guldordet *Spara gängets kupong* (*Spara ändringen* när den finns, *Sparad* när den står som
den sparade) sparar den direkt med samma tjänst som papperet (`Samtal.pult.sparaGang`,
`postCoupon` i kupong.js). Saknar matcher tecken säger raden det och guldordet blir *Spara
ändå*; har någon annan hunnit före blir det *Spara över den* (gängets kupong) eller *Spara
ändå* (en kupong till samma dag), och kan tjänsten inte spara *Spara via Ny kupong*. Utan
tjänsten öppnas Ny kupong (eller Ändra) med tecknen ifyllda. Matcher som har startat går
inte att ändra; där står pennan för kommentaren i efterhand.

**Talongen live** (2026-11-09, gängets önskemål: "Jag skulle också vilja att den uppdateras live,
utan att man behöver lägga tillbaka den, och sedan ta upp den igen"). Användaren valde utseendet bland
flera alternativ: A2 Märkpennan, B4 En rad med tre flikar och C1 Under raden.

- **Minut och ställning** (alla kuponger i rummet, `liveRad` i rum.js): när matchen är igång står minuten
  och ställningen på raden i stället för tiden, i telefonen på andra raden. Bakom ställningen ligger en
  märkpenna: grön när kupongen har tecknet just nu, annars röd. Ringen runt utfallet har samma färg och är
  streckad medan matchen pågår. I förlängningen är märkpennan grå, eftersom det som rättas är ställningen
  efter 90 minuter. Med spoilerskyddet står tiden kvar.
- **Utan att läggas tillbaka** (`levande` i rum.js): kupongen i handen skrevs förut bara när den togs upp.
  Nu byts minuten, ställningen, ringarna, de andras kommentarer och siffrorna rad för rad så fort sidan
  har hämtat dem (varje minut, och `Rum.redraw` efter ESPN i `liveTick`). Kupongen skrivs inte om, så att
  kryssen, pennan och det du skriver står kvar. Vid mål gör ställningen ett litet hopp, utom utan rörelser.
- **Svenska folket, odds och favoritskap** (gängets kupong i handen, Stryktipset, `Folket` i folket.js): ett
  tal under varje ruta och flikarna Folket, Odds och Favoritskap där det förut stod Match. Fliken
  minns på enheten (`profeterna.spelflik`). Fet stil är det vi har kryssat. Svenska folket och oddsen ändras
  ungefär varje minut fram till spelstopp, sedan står de still. Pekar man på Odds står det om det är sista
  läget eller startoddsen. Svarar inte Svenska Spel eller tjänsten står kupongen som förut, utan flikar. Var och
  ens egen kupong har inga sådana siffror.
- **Allas kommentarer** (`komHtml` i rum.js): var och ens motivering från sin egen kupong och kommentar i
  efterhand står under matchen, med porträtt och i eget bläck. Raden blir högre bara där någon har skrivit, och
  din egen kommentar i efterhand står i fältet på raden, där du skriver den. Blir det så mycket att kupongen
  skulle bli för liten står varje kommentar på en rad, och hela när man pekar (`.tat`).
- **Kupongen blir högre** (`mattHand`): siffrorna och kommentarerna tar plats, så gängets kupong i handen är så
  hög som den behöver vara, med samma mitt som på pulten, och görs så stor som får plats. Pennan vilar
  i foten. På pulten är kupongen som förut, utan siffror och kommentarer under raderna.

**Spela hos Svenska Spel** (2026-11-07, användarens beslut). När gängets kupong är sparad som den
står och omgången är Stryktipset som går att spela, står *Sparad* släckt och guldordet blir *Spela hos
Svenska Spel* – samma länk som på kupongsidan (`Spela.href` i spela.js, `spela` i
`Samtal.pult.gang`). Länken öppnar Stryktipset med gängets tecken i en ny flik, och kupongen
skjuts över disken: den sjunker mot disken, glider bort och ligger sedan på pulten igen
(`lamnaOver` i rum.js). Sajten vet inte om kupongen blev betald, så ingen stämpel säger att
den är spelad. Svenska Spels omgång hämtas när den behövs (högst var femte minut), och när den
har kommit får kupongen i handen knappen (händelsen `spela`).

**Matchbladet** (2026-11-07, användarens önskemål: "en massa olika matchanalys-lappar … Jag vill ha en
som man kan kika i"). Allt om en match i rummet står på ett blad med flikar, och det är samma blad var man
än tar fram det. På kupongen i handen är lagen i varje rad en knapp – på alla kuponger i handen, också de
andras och gängets; tiden och det som står efter den är kvar att skriva på (se ovan). Ett klick lägger
matchbladet ovanpå kupongen, på samma papper och i samma mått, så att det står där kupongen står: det
glider upp över den och lägger sig lite snett, med kupongen synlig i kanten (`lagen` i rum.js,
[public/rum-matchblad.js](public/rum-matchblad.js) och [public/rum-matchblad.css](public/rum-matchblad.css)).
*Matchbladet* hos Hasse Backe och matchens rad på tv:ns matchsida lägger fram samma blad mitt i
fönstret, lika stort som kupongen i handen, med det bakom mörkt (`RumMatchblad.fram`); där leder krysset
i bandet tillbaka till Hasse eller tv:n i stället för till kupongen, och man är kvar där man var när bladet
läggs bort. I telefonen på höjden står lagen med de kortare namnen, som på den smala kupongen, där raderna
är snäva (bandet, *Vad drog åt vilket håll* och Mötena). Förut fanns två olika blad: bladet med lagen på kupongen och matchrutan från den vanliga
sajten, som *Matchbladet →* på bladet, *Matchbladet* hos Hasse och matchens rad på tv:n öppnade. Matchrutan
öppnas inte längre från rummet (jfr *Inga länkar ut ur tobaksaffären* under [Beslut](#beslut)).

Överst står bandet med kupongens namn och *Match 3* och lagen med sköldarna, dag, tid och tävling
mellan dem (och över dem resultatet när matchen är spelad och resultaten inte är dolda), och under
dem flikarna – bladets sidor, i den ordning man behöver dem inför ett tecken. Alla flikar står alltid
där, över hela bladets bredd, så att de står still.

Sidorna är byggda av samma delar, så att man känner igen sig (2026-11-08, "få det konkordant"): samma
luft under flikarna och samma hårlinje mellan delarna; en del börjar med en rubrik i små spärrade
versaler till vänster och det den säger till höger; hemmalaget är blått och står till vänster,
bortalaget är terrakotta och står till höger, med en prick där det behövs; 1, X och 2 är kupongens tre
rutor med chansen i stapeln under; en ställning står i formens stämplade ruta; och sidan delas i
tredjedelar (1 X 2) eller halvor (hemma och borta).

- **Lagen** – det som stod på bladet med lagen (2026-11-07):
  - *Spelbolagen* – oddsen för 1, X och 2 i kupongens rutor, och under dem en stapel delad efter
    chansen i hela procent. Chansen är spelbolagens odds med marginalen bortdragen i proportion.
  - *Ligan hittills* – *Mål* och *xG*, lagets först och motståndarnas sedan, hemmalaget till
    vänster. xG är summerat över säsongen; har källan inte hunnit med den senaste omgången står
    antalet matcher det gäller till höger om rubriken (*xG: 10 matcher*). Spelar lagen i olika ligor
    står ligan överst.
  - *Form* – de tio senaste matcherna i alla tävlingar för vart lag, nyast till vänster, en kolumn
    per match: hemmamatcherna i den övre raden och bortamatcherna i den undre, så att det syns direkt
    om ett lag är starkt hemma. Rutan är grön vid vinst, röd vid förlust och grå vid oavgjort (efter
    90 minuter), med ställningen i rutan, lagets först, och lagets och motståndarnas xG i mindre stil
    under. Cupmatcher har inget xG. Datum, tävling, motståndare och xG står i rutans title.
- **Prognos** – sajtens prognos som i matchrutans flik Prognos: 1, X och 2 på samma sätt som på
  Lagen, *Förväntade mål*, de tre troligaste resultaten i formens rutor och *Vad drog åt vilket håll*
  med staplarna i bladets högra halva. För en spelad match prognosen före avspark.
- **Analys** – den färdiga analysen med rubrik, ingress, stycken och källor, och tipset under med
  tecknen inringade och raden i marginalen, som matchrutans flik Analysera. Källorna står som text
  (källan och rubriken när man pekar på numret), utan länkar ut ur rummet. Finns ingen analys än står
  samma rad som i matchrutan.
- **Startelvor** – matchrutans startelvor ([public/matchruta.js](public/matchruta.js)), 365Scores eller
  den beräknade elvan, med en planhalva per lag sida vid sida (under varandra i telefonen) och målet
  nederst: laget, uppställningen och stämpeln över planerna, på planen numret och namnet, betyget i
  hörnet till vänster och målen, korten och bytet till höger. Ett namn får som mest avståndet till
  grannen på samma linje, så att namnen aldrig krockar. Under varje halva lagets frånvaro före matchen
  (bara orsaken; när spelaren väntas tillbaka står i title) och avbytare som en rad namn, efter matchen
  de inbytta med minut och betyg och resten som en rad, och tränaren; domaren står sist. När resultatet
  är dolt står bara *Visa ändå*, eftersom elvorna visar målen. På den vanliga sajten är planen kvar som
  en gemensam plan.
- **Tabellen** – ligatabellen runt lagen: två lag på var sida om vart och ett, och ligger de långt
  ifrån varandra ett utdrag kring vart och ett, med ⋯ där tabellen fortsätter. Har divisionen dolda
  resultat står *Visa ändå* i stället, som i matchrutan.
- **Mötena** – samma möten som kortet i kortregistret: säsongens och tidigare säsongers, de elva
  senaste, med lagens prickar och ställningen i formens rutor sedd från hemmalaget på bladet, och
  hemmalagets V–O–F till höger om rubriken.

En sida som inte ryms flyttas med hjulet eller fingret inom bladet och tonar bort mot papperet nederst.
Bladet gäller en match: man bläddrar inte mellan matcherna (2026-11-08: "Man gör inte det"), utan lägger
bort bladet och tar fram ett annat, och bladet har ingen fot. Sidan man har framme följer med nästa gång
bladet tas fram under besöket. Piltangenterna byter sida; det runda krysset i bandet, Esc eller ett klick
utanför tar bort bladet, och K lägger tillbaka kupongen. Det man
gör med kupongen under den (*Spara*, *Lämna in* …) tar bort bladet först. Matchens fil hämtas när
bladet läggs fram (*Hämtar …* för hand så länge) och sparas medan sidan är öppen. Dolda resultat står
som ? i rutorna, och har ett lag en dold match står dess *Mål* och *xG* också som ?.

Konkordansen – bladet visar inget nytt tal under ett gammalt namn, och inget gammalt tal på ett nytt
sätt:

| På bladet | Samma tal | Ur |
|---|---|---|
| Chansen ur oddsen och oddsen | Spelbolagens rad under prognosens rutor i matchrutan: snittet vid avspark, annars när oddsen öppnade, annars ESPN:s bolag (`bookOdds` i app.js). Procenten avrundas som överallt (`pct3`), stapeln är *Vad drog åt vilket håll* (`.tug-stack`) i matchrutans färger, hemmalaget blått och bortalaget terrakotta | `odds` i matchens fil |
| Mål | *Mål* under *Ligan hittills* i *Lagen sida vid sida* och tabellen (ESPN, före avspark) | `teams.*.record.all` |
| xG | Raden *xG* i *Lagen sida vid sida* gånger antalet matcher: Understat i Premier League, annars football-data.co.uk (`oneXg` i app.js). Kortregistret och Statistik visar football-data.co.uk, så i Premier League skiljer de sig från både matchrutan och bladet | `teams.*.xg` (`xgSource` i src/matches.js) |
| Form | De fem första rutorna är matchrutans *Form*, i samma stämplade rutor och färger (grön vinst, grå oavgjort, röd förlust, avgjort efter 90 minuter) | `teams.*.senaste` |
| xG under rutan | Samma källa som *xG* ovan, så att ligamatchernas xG summerar till säsongens | `teams.*.senaste[].xg` |
| Prognos | Matchrutans *Prognos*: oddsen ur hela procent (`pct3`, `pctOdds`), *Förväntade mål*, *Troligast* och *Vad drog åt vilket håll* räknade som i `forecastCard`, `journalCard` och `stepsCard` i app.js | `prediction`, `journal.counted` |
| Analys och tipset | Matchrutans *Analysera* (`analysOf`, samma regel för när tipset visas som `analysisOn`) | `data/analyser.json` |
| Startelvor | Matchrutans *Startelvor*, samma kod (`Matchruta.lineupPane` och `hydrate`) | 365Scores, `elva` i matchens fil |
| Tabellen | Matchrutans *Tabellen* (`leagueTable`): samma kolumner och rader, men bara utdraget runt lagen | `data/teams/<division>.json` |
| Mötena | Kortregistrets kort om mötet (`motet` i rum-register.js) | `meetings`, `pastMeetings` |

**Nästa omgång ur kupongstället** (2026-11-09, användarens önskemål). Nästa kupong går alltid att
titta på: ett klick på kupongstället på disken eller N tar en blank kupong för nästa omgång i
handen. Det är veckans Stryktips som Svenska Spel har öppet för spel – samma som *Hämta
Stryktipset* (`Folket.open` i folket.js) –, med sajtens matcher i Stryktipsets ordning, och
kupongen är samma kupong i samma mått som den på pulten: numret (*Kupong 8*), spelstoppet, lagen,
dagen och tävlingen. En match som inte finns på sajten står med lagen och tiden från Svenska Spel.
Den är bara att titta på: rutorna är inga knappar, det finns ingen penna, och lagen lägger inte
fram matchbladet. Den lyfts ur stället, liten och vriden som stället, och kommer fram till mitten
som kupongen från pulten; under den står bara *Lägg tillbaka*, och den, Esc, N, K eller ett klick
utanför sätter tillbaka den samma väg (`openStall`, `stallFrames` och `closeCoupon` i rum.js).
Medan protokollet ligger på pulten (efter en spelad omgång, fram till måndagen kl. 16) är det
nästa veckas Stryktips; när det har blivit omgångens kupong är det samma matcher som på pulten,
med samma nummer och streckkod. Är ingen omgång öppen hos Svenska Spel (mellan spelstoppet och
nästa omgång) är kupongen blank, med tretton tomma rader. Omgången hämtas när rummet läser in sina
data och när kupongen tas, högst var femte minut (`stallHamta`), och står den inte klar när
kupongen tas fylls kupongen i när den kommer.

Rummet läser om omgången från tjänsten varje minut (`Samtal.load`), så att högen, gängets
kupong och de andras kuponger följer med när någon lämnar in. Med `prefers-reduced-motion`
(och med `?rum-t=`) står kupongen direkt i handen, kryssen direkt på papperet och pennan
stilla – också i uppgörelsen, där kupongerna inte läggs på och ringarna och bockarna står direkt.
Rörelserna är Web Animations (`openCoupon`, `flipFrames`, `drawCross`, `penTo`, `setSigns`,
`uppgorelse`, `klubba`, `lamnaOver` och `penGo` i [public/rum.js](public/rum.js)); kupongen och högen ligger i samma lager som
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
*Matchfix Text*, datumet och klockan som tickar (Stockholms klocka som uret och utsikten, `Vader.tid()`), ett blått band med rubriken i mosaikgrafik
(gula klossar), sju färger, dubbelhöga rader och snabbvalen i rött, grönt, gult och
cyanblått längst ner – samma fyra på alla sidor: *Matcher* (331), *Tabeller* (371),
*Skyttar* (381) och *Innehåll* (300). Det som ett föremål har för ämne tänds när man pekar på
föremålet (`data-to`). Filerna hämtas när sidan visas första gången.

- **300 Innehåll:** alla sidor med sina nummer; raderna leder dit.
- **331 Matcher:** omgångens matcher i avsparksordning – lagen, avsparken eller ställningen
  (grön med minuten medan matchen pågår, `paus` i halvtid, `?` när resultatet är dolt,
  `struken`) och matchens sida. Fler än 17 matcher ger undersidor.
- **332–369, en sida per match**, ur matchens fil (`data/match/<id>.json`): lagen dubbelhöga
  med ställningen (lägger fram matchbladet, `bladFram` i rum.js), tävlingen och avsparken eller
  läget i bandet, oddsen och prognosen för 1, X och 2 – prognosen också som en stapel i
  mosaik, med 1 i grönt, X i gult och 2 i cyan som siffrorna ovanför – och lagen sida vid
  sida: placering och poäng, och hemmalagets hemmarad och bortalagets bortarad (V-O-F).
  Formen, vilan och skadorna står på anslagstavlan och xG med resten om lagen i
  kortregistret (se [Vad som står var](#vad-som-står-var)). När resultatet är dolt visas inte
  lagen sida vid sida.
- **371–374 Tabeller** (Premier League, Championship, League One, League Two, ur
  `data/teams/<division>.json`): placering i färg efter zonen (uppflyttning och Champions
  League grön, kval och Europa cyan, nedflyttning röd), lag, spelade, vunna, oavgjorda,
  förlorade, målskillnad och poäng. Hela Premier League ryms på en sida;
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
I en stående telefon står tavlan framme på höjden, två spalter och fyra rader (`HW`, `HH`, `HOG`, `hogW`): lapparna blir
ungefär 1,6 gånger så stora och går att läsa utan att lyftas. Tavlan på väggen ser ut som förut.
Lapparna har det på sajten som rummet annars inte visar, om lagen i omgången (samma omgång
som kupongen och fällbladstavlan):

- **Formen** – ett registerkort, maskinskrivet: de fem senaste matcherna för båda lagen före
  avspark (alla tävlingar, den senaste först), V, O eller F. De kommer ur matchens fil, med
  Europacuperna, och ur `data/matches.json` tills filen har hämtats.
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
  lagen i alla tävlingar; skiljer det två dagar eller mer ringas det tröttare lagets siffra in.
  Som formen kommer de ur matchens fil, med Europacuperna.
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

Ryms inte det längsta bladet på lappens plats är bunten vikt (2026-11-03, användarens
önskemål – förut klipptes det som inte fick plats bort): resten är vikt bakom, och i
underkanten syns vecket, där texten försvinner runt böjen och skuggan är tjockare. I handen
vecklas lappen ut, ett veck i taget och i dragspel när den är mer än dubbelt så lång, och
viks ihop igen på vägen tillbaka; vecken syns som linjer i papperet. Längden mäts i
närbilden när lapparna ritas och igen när typsnitten har laddats (`measure` och `panels` i
rum-anslag.js). Den utvikta lappen blir aldrig mindre än att den går att läsa (`MINS`); ryms
den inte i fönstret då, som en lång skadelista i telefonen, flyttas den med hjulet, fingret
eller Page Up/Page Down, och då bläddrar ett svep uppåt eller neråt inte bladen. Det är
framför allt skadelistan som viks: med sju matcher i Premier League rymdes förut ungefär
hälften av lagen och med tio en tredjedel. Övriga lappar ryms med en hel omgång i en division
(tolv matcher): kryssar gärna och slår oddsen är lite högre, så att deras sista rad kommer
med, almanacksbladet är bredare, så att långa namn (Bournemouth, Southampton) står hela, och
polaroidens text blir mindre när lagnamnet är långt.

Ett klick eller A: tavlan lossnar från väggen och flyger fram – en projektiv avbildning
(`matrix3d`) från hörnen på väggen till rakt fram, så att den vrids ut ur väggens vinkel –
medan kameran går lite mot hörnet och rummet mörknar bakom; där den hängde är väggen
ljusare. Framme lutar den lite efter musen, så att ramens djup syns, och lapparna lyfter i
nederkanten när man pekar på dem. Ett klick på en lapp tar den från nålen och fram i läsbar
storlek (polaroiden vänds på vägen) med bunten och flikarna, ←/→ bläddrar mellan lapparna
och ↑/↓ mellan bladen. Esc, ett klick
utanför eller *Häng tillbaka* sätter tillbaka lappen; Esc, A eller ett klick utanför tavlan
hänger tillbaka tavlan – den flyger till hörnen där den hänger när kameran har gått
tillbaka och rummet har vridits mot musen (rum.js mäter dem med kameran och rummet där en
kort stund). Flygturen räknas ut i förväg, en avbildning var 20:e ms, och flygs som en
animering som grafikkortet sköter själv (`fly` i rum-anslag.js), så att den går jämnt också
när datorn har annat att göra (se [När datorn inte hinner med](#när-datorn-inte-hinner-med)).
Pekar man på tavlan i rummet tänds snabbvalet Statistik på
text-tv:n. Med `prefers-reduced-motion` står tavlan framme direkt.

**Ropa till Hasse** (2026-11-06, användarens önskemål): under lappen i handen står det man ropar
till Hasse Backe (fiktiv), som sitter i baren till vänster utanför bilden – *Hasse, vad betyder
procenten?*, *Hasse, vad är tur och otur?* och så vidare, en fråga per lapp – och ett klick eller
H, så lutar han sig in från baren nere till vänster (överkroppen ur kostymfotot,
`rum/hasse-atlas.webp`) och svarar i en mörk pratbubbla med guldkant, vars spets pekar mot hans
mun. Det var för otydligt att det var han som talade när svaret stod som vanlig text (användaren,
2026-11-06; av tre skisser valde hen den där han lutar sig in, framför en ljus serietidningsbubbla
med porträtt och en diskret rad med namn och talstreck). Man står kvar vid tavlan med lappen i
handen, och svaret kommer ord för ord, en mening i taget: bredvid lappen, åt baren till, med
lappen flyttad åt höger, eller över lappen när de inte ryms bredvid varandra (i telefonen och i
smala fönster). Bubblan täcker aldrig hans ansikte (håret får den): står den ovanför honom slutar
den ovanför pannan och rullar om svaret inte ryms, och spetsen går ner till höger om ansiktet. I
telefonen står knapparna under bubblan till höger om spetsen, och i en hög telefon står bubblan
nära honom så att spetsen inte blir lång (`hkPlats` i rum-anslag.js; figuren, bubblan, spetsen och talet i
[public/rum-hasse-svar.js](public/rum-hasse-svar.js), som protokollet också använder). Han lutar sig
in på knappa halvsekunden, och med minskad rörelse står allt direkt. Med ljudet på (knappen i baren) hörs han från
vänster och lite dovt, som från andra sidan affären, och orden kommer i takt med rösten
(`fjarran` i [public/rum-hasse.js](public/rum-hasse.js)). Han säger vad talen är och hur de räknas
(samma innehåll som förklaringarna under Statistik → Lagen), ett exempel ur bladet man har framme
(*Nottingham står överst med 27 %. Det är lite mer än vanligt.*) och vad han själv gör med det, i
sin egen röst ([prompts/hasse-backe.md](prompts/hasse-backe.md)). Meningarna står under `anslag` i
[public/rum-hasse-repliker.js](public/rum-hasse-repliker.js), så att de får hans röst som de andra
replikerna (src/rost.js tar med dem av sig själv); exemplet räknas i sidan ur samma tal som lappen,
ändras med datan och sägs därför tyst, och när bladet räknar med dolda resultat eller saknar data
hoppar han över det. Ett klick på svaret visar resten direkt, och med minskad rörelse står allt
direkt utan ljud, som i baren. *Tack, Hasse*, Esc eller ett klick utanför tystar honom (Esc och ett
klick utanför sätter sedan tillbaka lappen), och han tystnar också när lappen sätts tillbaka eller
man går till nästa lapp. Ändras vad en lapp visar ska hans svar följa med. Förut (samma dag)
förklarade han på ett kort som gled in från baren; användaren ville hellre att han svarade.

Dolda resultat: formen får ? för de dolda matcherna, och lapparna som räknar med
resultaten (styrkan, krysset, turen, oddsen och motståndet) visar bara rubriken och ett
frågetecken när en match i lagens divisioner är dold – den lyfta lappen har då *Visa ändå*.
Lagfilerna hämtas med rummet (om igen efter en kvart), och matchernas filer också, så att
formen och vilan på väggen räknar med Europacuperna redan innan tavlan tas fram.
Slitaget skiftar med dagen: lapparnas och bladens vinklar, nålhålen och hörnen av rivna
lappar.
`?rum-anslag` visar tavlan framme i en fast bild, och `?rum-anslag=<lapp>` (form, skador,
styrka, kryss, tur, odds, vila, motstand) med den lappen i handen, och med
`&rum-anslag-hasse` också Hasses svar om den.

### Kortregistret

På disken under Tipsligan står en kortlåda i lackad teak, byggd i three.js
som inredningen ([public/rum-kortlada.js](public/rum-kortlada.js)), med korten, datan och
kortet i handen i [public/rum-register.js](public/rum-register.js) och
[public/rum-register.css](public/rum-register.css). Fram på lådan sitter en mässingshållare
med en maskinskriven etikett, *KARTOTEK* (`ETIKETT` i rum-kortlada.js). I lådan står,
framifrån:

- **Lagen** – en grön avdelare av pressad kartong, och bakom den ett registerkort per lag i
  omgången i bokstavsordning, med en flik av plast i divisionens färg (som på Tabeller) och
  lagets namn på en papperslapp i den. Kortet är maskinskrivet: namnet, divisionen och
  skölden urklippt i hörnet, och sedan *Mål* och *xG* för och mot per match, *Favorit* (hur
  ofta laget har varit favorit), *Skytten* (bäste målskytten och andelen av lagets mål) och
  *Nästa* (motståndet, hemma eller borta och om hur många dagar, med cupen eller Europacupen
  när det inte är ligan). Ur `data/teams/<division>.json` och matchens fil.
- **Mötena** – en röd avdelare, och bakom den ett blått kort per match: alla möten som
  sajten har (de sex senaste från tidigare säsonger och säsongens) med datum, tävling, lagen
  och resultatet, och hemmalagets V–O–F i dem med blyerts längst ner. Kortet rymmer elva
  möten ovanför summan; förut stod bara de åtta senaste, och det äldsta föll bort när
  säsongen hade gett tre möten (2026-11-03). Inget annat på korten klipps: lagkorten har
  gott om plats också med de längsta namnen, så de behöver inte vikas som anslagstavlans
  lappar.

Flikarna sitter på fem platser (lagen) och tre (mötena), så att varje flik syns ovanför
dem framför. Ett klick eller R: lådan lyfter från disken, vänder sig mot en och lutar så att
man ser ner i den, medan bilden zoomar in och rummet mörknar bakom – närbilden är en egen
duk över hela fönstret med samma perspektiv som rummet, så att lådan är skarp. Den lutar
lite efter musen, och kortet under pekaren reser sig. Ett klick på ett kort (eller en
avdelare: det första kortet bakom den): det reser sig ur lådan och tas i handen i läsbar
storlek, och pilarna (i telefonen ett svep i sidled) bläddrar mellan korten.
I en stående telefon är det skärmens bredd som sätter lådans storlek, så där lutar lådan
brantare (42° i stället för 31°) och använder höjden i stället: raderna av flikar glider
isär, ingen flik skyms längre av korten framför, och flikarna blir i snitt ungefär 30 %
större att trycka på, medan texten på dem bara blir lite lägre (2026-11-06). Med
fingret reser sig kortet under fingret så högt att fliken syns ovanför fingertoppen, byts
när fingret glider över lådan och tas i handen när fingret släpper; släpper det utanför
lådan händer ingenting. Vilket kort som står under fingret räknas som om alla kort stod
nere i lådan, så att det upplyfta kortet inte skymmer de andra, och lådan lutar bara
efter musen: förut lutade den mot fingret i samma ögonblick som kortet valdes.
Esc, ett klick utanför eller *Sätt tillbaka*
sätter tillbaka kortet; Esc, R eller ett klick utanför lådan ställer den på disken igen.
Pekar man på lådan tänds
snabbvalet Statistik på text-tv:n. Med `prefers-reduced-motion` står lådan framme direkt.

Dolda resultat: lagkorten visar bara namnet och ett frågetecken när en match i lagens
divisioner är dold, med *Visa ändå* under kortet – samma nyckel som anslagstavlan, så att
det gäller båda – och dolda möten står som ?. Slitaget skiftar med dagen: kortens lutning i
lådan och vinkel i handen, hörn som har varit vikta och en kaffering. Utan WebGL står
disken tom. `?rum-register` visar lådan framme i en fast bild, och `?rum-register=<lag>`
(eller en del av kortets id, t.ex. `mote:<id>`) med det kortet i handen.

#### Vad som står var

Statistiken om omgången är fördelad efter vad varje sak är bra på, och varje siffra står på
ett ställe (2026-11-02, användarens önskemål):

| | Vad | Innehåll |
|---|---|---|
| **Tv:n** | Matcherna och ligorna, nu | Stryktipset live (377), omgångens matcher (331), en sida per match med odds, prognos, tabelläget och hemma/borta (332–369), tabellerna (371–374) och skytteligorna (381–384) |
| **Anslagstavlan** | Hela omgången jämförd: vem som sticker ut | Formen, skadorna, vilan, starkast och svagast, kryssar gärna, tur och otur, mot oddsen och motståndet |
| **Kortregistret** | Ett lag i taget, och historiken | Ett lagkort per lag (mål och xG per match, hur ofta laget har varit favorit, skytten, nästa match) och mötena med resultaten |
| **Matchbladet** | En match i taget, när man tippar – på kupongen i handen, hos Hasse Backe och från tv:n | Lagen (chansen ur oddsen, mål och xG i ligan hittills och de tio senaste matcherna hemma och borta), prognosen, analysen, startelvorna, tabellen och mötena (se *Matchbladet* under [Kupongen i handen](#kupongen-i-handen)) |

Matchbladet är ett undantag med flit (2026-11-07, användarens önskemål): det samlar allt om en
match på ett ställe, så dess tal står också på andra ställen – men alltid samma tal under samma
namn, ur samma källa (konkordansen under *Matchbladet*).

Ny statistik placeras efter samma roller: det som gäller en match eller en liga nu på tv:n,
det som jämför lagen i omgången på tavlan och det som beskriver ett lag i kortregistret.
En sak liknar en annan med flit: lagets bäste skytt kan stå med samma målantal i
skytteligan, men kortet visar hur mycket laget hänger på en spelare och skytteligan vem som
leder. Skårtavlan på väggen visar inte längre tabellen utan gängets egen ställning
(Tipsligan).
Löpsedeln på glaset (se *Affischerna* ovan) är en rubrik, inte statistik: den citerar bara
den siffra som gör rubriken till en nyhet, som modellens chans för skrällen eller favoriten.

Statistik på den vanliga sajten har samma tal under samma namn, för hela divisionen i stället
för omgången: topplistorna under Lagen är tavlans lappar (utom skadelistan och vilan), och
lagkortet har kortregistrets rader (2026-11-05). Ändras en lapp eller ett kort här bör
Statistik följa med, och tvärtom.

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
Under rutan sitter kassettfacket och displayen, och till höger om rutan en spalt med knapparna ◀◀ ▶ ▶▶ ❚❚ ■ ⏏ under varandra, med högtalargaller över och under. Repriserna på VHS,
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

**Nära** (klick eller V) går kameran fram tills tv:ns och lådans framsidor fyller bilden över
raden med tangenterna, så att etiketterna på kassetterna går att läsa (tv:ns sida får skäras
bort), och svänger samtidigt runt tv:n in mot rummet, så att man ser rutan snett framifrån i
stället för från sidan. Tv:n och lådan vrids inte och flyttas inte –
de står kvar vända mot gänget – utan det är kameran som rör sig (se *Kamerans sväng* och
*Rummet runt tv:n* nedan).
Kassetterna glider ut en bit när man pekar på dem. I telefonen på höjden går kameran bara
fram till lådan (`LADAN`), så att etiketterna går att läsa; där tar en kassett (eller ett
tryck på kanten av tv:n bredvid lådan) kameran vidare till rutan. I telefonen, på höjden och på bredden, spelas en kassett alltid med rutan i hela fönstret. Ett klick på rutan (eller hjulet framåt)
går ännu närmare, så att bilden i rutan och spalten med knapparna nästan fyller fönstret (med en smal kant
runt om, så att bildens gräns syns; knapparna står inom bildens höjd och går att trycka på också här), och kameran
svänger och går rakt framför tv:n, så att rutan syns rakt framifrån. Texten i rutan (*STOPP*,
*▶ SPELA*) står inne i bilden, så att den syns där. Ett klick till, hjulet bakåt eller Esc går
tillbaka till tv:n och lådan, och V,
Esc eller ett klick utanför hörnet tillbaka till rummet, där kameran svänger tillbaka till
där den stod. Ett klick på en kassett: den
lyfts (ur lådan dras den först ut genom öppningen), ställs framför facket och skjuts in,
luckan fälls upp, och de ovanför sjunker ner i
luckan i facket. Rutan är blå med *▶ SPELA* tills bilden kommer, och klippet spelas i
YouTubes spelare (`youtube-nocookie.com`, i 16:9 med svarta kanter i den 4:3-stora rutan)
med displayen som räknar tiden. ↑/↓ byter till kassetten över eller under (efter förra
omgången kommer nästa).

**Mekaniken.** Knapparna gör det de gör på en riktig video, och bandet bestämmer (`bandet` i
rum-video.js): spelaren följer efter.

| Läge | ▶ | ❚❚ | ◀◀ ▶▶ | ■ | ⏏ |
|---|---|---|---|---|---|
| Stopp | spelar | – | spolar, med blå bild | – | matas ut |
| Spelar | – | paus | söker i bilden | stopp | stopp, sedan ut |
| Paus | spelar | spelar | söker i bilden | stopp | stopp, sedan ut |
| Söker | spelar | paus | fortare, åt andra hållet vänder | stopp | stopp, sedan ut |
| Spolar | spelar | – | åt andra hållet vänder | stopp | stopp, sedan ut |

- **Söker:** i en fast fart, 7 gånger, och ett tryck till åt samma håll 21 gånger (`SOK`). Farten
  ändras inte av sig själv. Bilden syns, utan ljud (se *Bildsökningen*).
- **Spolar:** från stopp, ungefär 30 gånger (`VIND`), med bromsning sista biten, med blå bild, ◀◀
  eller ▶▶, räkneverket och bandmätaren. Farten ändras mjukt (`TROG`, `TROGV`), så att bandet
  bromsar och vänder i stället för att hoppa.
- **Paus:** bilden står still och darrar med en brusrand, ❚❚ i hörnet, räkneverket och
  bandmätaren. Efter fem minuter går videon till stopp av sig själv (`PAUSTID`), som en riktig
  för att skona bandet.
- **Stopp:** blå bild med *STOPP*, räkneverket och bandmätaren, och displayen visar ■ och tiden.
- **▶ från paus och sökning:** spelar direkt, utan blå bild (`direkt`). Efter en sökning rullar
  brusränderna genom bilden en gång medan bandet låser (`.vhs-las`, `LAS`).
- **▶ från stopp, och när kassetten har åkt in:** bandet ska ut ur kassetten, så det går en kort
  blå bild med *▶ SPELA* (`BLA`, 0,8 sekunder efter att bandet har börjat gå), och bilden kommer med
  brusränderna där bandet stod. Ett tryck till medan den håller på ändrar inget, och spelar den
  redan händer inget.
- **Efter ▶** står ▶ mitt i rutan, med räkneverket och bandmätaren, i ungefär fyra sekunder
  (`FORVARM`), som texten i rutan på en riktig video.
- **Bandets ändar:** i början stannar bandet på 0:00:00. I slutet, spelat, sökt eller spolat,
  spolar videon tillbaka av sig själv och stannar på 0:00:00 (`bandSlut`); kassetten matas inte ut.
- **⏏:** går bandet stannar det först, och kassetten kommer ut 0,6 sekunder senare (`UT`).
- **Kassetten minns:** läggs den i igen börjar den där den var när den matades ut (`V.band`, så
  länge sidan är öppen).
- **Går man därifrån** pausar videon, och den spelar vidare när man kommer tillbaka. Mitt i en
  sökning står bilden still och spelar därifrån, en spolning stannar där den är, och paus är paus
  även när man kommer tillbaka.
- **Väntar spelaren på data** står bilden kvar, och efter 0,4 sekunder ▶ i mitten över spelarens
  hjul (se *Att det är YouTube syns inte*).

I telefonen på höjden räknas kameran så att hela knappraden får plats (`TATH`), med rutan lite
mindre än fönstret, och ett tryck en bit under en knapp räknas också.

**Tangenterna.** Nära (och när rutan fyller fönstret) styrs videon också
med tangentbordet: ← och → som ◀◀ och ▶▶, mellanslaget pausar när den spelar och spelar annars,
S stoppar som ■, ↑/↓ byter kassett och Esc går tillbaka; en nedtryckt tangent räknas som ett tryck;
utan kassett flyttar ↑/↓ markeringen i listan och ←/→ byter sida.
Med tangentbord och mus står de där i rummets fot (*← → spola · mellanslag spela/paus · S stopp
· ↑ ↓ kassett · Esc tillbaka*, utom i fönster smalare än 700 eller lägre än 500 bildpunkter)
– rummets egna tangenter står inte i foten, eftersom de låg över kupongen, men nära videon
syns inte kupongen – och knapparna säger sin tangent när man pekar på dem (*Stopp · S*), som
sakerna i rummet. Efter ett klick med musen tappar knappen fokus, så att mellanslaget spelar
i stället för att trycka på samma knapp igen; går man till en knapp med tabben trycker
mellanslaget på den.

**Bildsökningen.** Medan den söker visar videon bilden som en riktig video: klippet
självt rusar fram eller bak i rutan, urblekt, lite suddigt och skakigt, med två brusränder
(vita och svarta streck i grått brus, en rad per bildlinje) som rullar nedåt genom bilden
framåt och uppåt bakåt, fortare i 21 gånger. Uppe till vänster står ◀◀ eller ▶▶ och
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

Bruset ritas en gång i en liten duk (`randBrus`, 512 ×
80), och det som rör sig är egna små lager. Med `prefers-reduced-motion` står bilden och
ränderna still medan räkneverket rullar, och klippet byts utan att skaka.
Går inget av matchens klipp att spela här blir det myrornas krig, och klippen hoppas över
nästa gång (samma lista som spelaren på sajten). Rummet stängs och videon
stannar. Med `prefers-reduced-motion` åker kassetterna direkt.

**Att det är YouTube syns inte.** Spelaren har inga egna knappar (`controls=0`), får aldrig
musen och textas inte (`hl=en` och `setOption('captions', 'track', {})` när den börjar spela;
`unloadModule` räcker inte, för då kommer textningen tillbaka vid nästa ▶). Rubriken, kanalens bild, symbolen i
mitten, förslagen och loggan syns ändå i knappt fyra sekunder varje gång ett klipp börjar spela,
hoppar medan det spelar eller spelar vidare efter en paus, men inte vid paus, inte när det hoppar i
paus och inte när ljudet slås av och på. De går inte att stänga av (spelarens fart stannar på en
fjärdedel, och `hideControls` och liknande gör inget utifrån), men de är lika stora hur stor spelaren
än är. Därför ritas spelaren i 2880 × 1620 och förminskas till 1,1 gånger bilden (`.vhs-bild iframe`):
rubriken, förslagen och loggan hamnar i kanten som skärs bort, som på en gammal tv. Kvar är
spelarens runda knapp i mitten (och hjulet när den väntar på data), ungefär 2 % av bredden, och den
täcks av videons egen ▶ (`.vhs-mitt`) från att spelaren börjar spela till 4,4 sekunder efter (`dolj`,
`FORVARM`). Pausar man innan dess står knappen kvar i paus, och ▶ med den. Oskärpa över knappen
provades men blev en ljus fläck, ungefär som en andra boll. I en sökning syns knappen i de fyra
sekunderna, men bilden skakar och är sönderbrusad då. Slutet, och förslagen efter det, täcks direkt.
Klippet väljer samma bildkvalitet som förut (1080p, mätt). Hörnet byter inte storlek medan klippet
syns, för då kommer knappen fram utan ▶: det ritas i den stora storleken innan spelaren börjar (`load`, `resume`, `direkt`) och i
den vanliga igen först när klippet står stilla (`skarp`).

**Ljudet.** I Safari, och i alla webbläsare i iPhone, får en video inte ha ljud förrän någon har
tryckt medan den finns. Videon slog på ljudet när den blå bilden försvann, och då pausade
webbläsaren klippet: efter fyra sekunder frös rutan, och ▶ gjorde samma sak igen. Nu spelar klippet
utan ljud med *TRYCK FÖR LJUD* nere i bilden tills någon trycker – på rutan, en knapp eller en
tangent – och gesten följer med meddelandet in i spelaren (`gest`; på rutan flyttar trycket inte
kameran). Efter det har spelaren lov, så där byts klippen och kassetterna i samma spelare
(`loadVideoById` i `load`), som står kvar på paus när kassetten matas ut (`P.ledig`). Därför finns
bara en spelare där, också efter en sökning. Stannar ett klipp när ljudet slås på i någon annan
webbläsare märks det (`LJUDPAUS`), och det spelar vidare utan ljud. I strömsparläge i iPhone börjar
inget klipp av sig självt; där startar ett tryck på rutan det.

**När något krånglar.** Svarar inte spelaren på 45 sekunder (`SVAR`) provas en ny, och sedan nästa
klipp; tar spelaren inte nästa klipp på sju sekunder börjar en ny. Ett klipp som ger fel, till exempel
för att ägaren inte tillåter det utanför YouTube, byts mot nästa (och blir den sista myrornas krig).
Går man därifrån medan kassetten åker in spelar den när man kommer tillbaka. Har telefonen varit
låst spelar klippet vidare, om det spelade. WebKit lägger ibland inte ut spelaren när hörnet ritas i
`zoom: 2` (0 × 0 bildpunkter, och rutan blir svart medan klippet spelar), så då tvingas det fram
(`knuffa`).

**Minnet i iPhone.** Det var minnet som dödade sidan. Över 1 GB frigör WebKit minne var trettionde
sekund och ritar då om allt som syns, med toppar på ungefär en halv GB, och iPhone dödar sidan runt
1,4–1,5 GB. Mätt i WKWebView i 390 × 664 med täthet 3 och riktiga klipp tog rummet 1,07 GB vid lådan
och 1,15 GB med ett klipp, och var trettionde sekund 1,5–1,68 GB: videon hann aldrig spela länge. Nu tas
det bort som inte syns när kameran har stannat (`lattVideo` i rum.js): vid lådan allt utom väggen och
hörnet, 3D-delarna, gatan och neonen står still, och när rutan fyller fönstret tonar också väggen bort
och lådan, tv:ns sidor och skenet försvinner (`utanLada`). Med en spelare släpps också det WebKit håller
ritat bakom kameran (`kvar`), och hörnet håller sitt eget med samma osynliga rörelse (`haller`) – utan
den räknar WebKit fel på vad som syns av något som står så snett, och kassetterna försvann. Spelaren
försvinner i telefonen när man går från videon (`parkera`), och i telefonen hoppar den inte åtta gånger
i sekunden medan bandet spolar utan YouTubes bildrutor visas hela vägen. Vid lådan är det nu 0,88 GB,
utan toppar, och med ett klipp i rutan 0,66–1,0 GB; vägen hem från lådan går upp till 1,16 GB och första
gången fram till 1,2 GB. Bara om man går fram och tillbaka inom ett par sekunder kommer toppar över
1,4 GB. Kameran börjar gå hem lite senare när en spelare har funnits (när allt är ritat, `sedan`),
utan spelare lika jämnt som förut.

**Lådan i Safari.** Core Animation lade lådans väggar på tvären ovanpå kassetterna, så att bara en del
av etiketterna syntes. Där ritas det innanför öppningen på ett enda plan precis bakom kassetterna, i
samma färger som det syns snett från höger (`.platt`, `ladaYtor`), och kassetternas tak och ändar finns
bara med när de lyfts eller när man pekar på dem.

**Kamerans sväng.** Rummet är målat på platta plan, så kameran kan inte gå runt i det på
riktigt. Svängen är i stället två saker som sker samtidigt, på 0,6 sekunder som
förstoringen: rummets plan vrids 34 grader i 3D kring tv:n (`sving` i rum.js), och hörnet –
tv:n, högen och lådan, som är lådor i 3D i rummets eget perspektiv – ritas nästan från samma
håll, 46 grader runt tv:ns mitt (`SVANG` och `.vhs-kam` i rum-video.js). De tolv graderna
extra ställer etiketterna mer framifrån, så att de går att läsa; mer än så går inte rummet
att vrida utan att gänget och radion kommer in i bild. Lådans bortre ände kommer då mot en,
så hörnet flyttas också lite uppåt (`lyft`), annars skulle lådan hänga utanför disken. När bilden fyller fönstret ritas hörnet 112 grader runt (`VRID`), så att rutan
står parallellt med bilden, och ögat (perspektivets mitt i hörnet, `perspective-origin` på
`.vhs-in`) flyttas rakt framför rutan: kameran går fram genom att förstora en del av bilden,
så vänd mot det vanliga ögat blev rutan sned som i kanten av ett vidvinkelfoto, och därifrån
skymde lådan rutans vänstra kant. Planen vrids som de är, och väggen, skårtavlan, korktavlan och
disken följer med; tv:n och lådan ses från det nya hållet. Hörnets eget plan vrids inte: det
står där rummet vrids kring, och Chrome ritar allt som lutar i perspektiv suddigt nära. Det
flyttas i stället fram lika långt som väggen vrids fram och görs lika mycket mindre, så att det
syns där det syntes – räknat längs synlinjen genom bildens vänstra kant (eller lådans, om den
står längre ut), där den möter den vridna väggen, och vid rutan från där kameran kom (`kant` i
`sving` och `vkant` i rum.js). Förut räknades bara till lådans kant, och Chrome lät då väggen
skära av lådan och halva tv:n nära (provat i Chrome 153 utan synligt fönster). Hörnet går
högst till 20 enheter bakom planet -330. Större vinklar på rummet går inte: vid ungefär 40
grader glider fönsterbänken in över lådan och lådan ser ut att sväva över disken. Nära tar bara
hörnet emot klick – med kameran svängd räknade Chrome annars kortregistret på disken bakom
lådan som närmast, och kassetterna i lådan gick inte att klicka på. Med `prefers-reduced-motion`
och i fasta bilder står kameran direkt i vinkeln.

**Rummet runt tv:n.** Mellan lådan och rutan går kameran 82 grader till runt tv:n, men rummets
plan bara 4: med bara dem såg det ut som att tv:n vände sig mot en på disken medan väggen bakom
stod still, i stället för att kameran gick runt den. Därför finns väggen bakom tv:n – med
Tipsligan och korktavlan – och bardisken som den står på också i 3D i hörnets eget perspektiv
(`rumYtor` och `.vhs-rum` i rum-video.js), i `.vhs-kam`, så att de svänger med tv:n och lådan:
tv:n står kvar på disken mot väggen, och väggen vrids fram bakom den tills den står nästan rakt
framför kameran när rutan fyller bilden. Måtten är rummets (bg, `disk` och `VAGG` i rum.js);
hörnet är rummet förstorat 2⅓ gånger kring ögat (`SK`), så att disken hamnar under tv:ns fot och
väggen där tv:n tar i den. Väggen och disken har rummets toner (`toning`), fronten fyllningarna
och krokarna och skivan strimmorna och fogarna; Tipsligan och korktavlan är kopior av tavlorna i
rum.js när man går fram (`tavlor`), utan ramarna i 3D. Diskens front står 9 enheter längre ut än
i rummet, under skivans kant: ett plan som går genom tv:n eller lådan delar Chrome dem längs, och
då syntes ett svart streck genom rutan. Rummet runt tv:n finns bara på vägen till rutan, vid den
och på vägen tillbaka (`.vhs-tat`, `.vhs-runt`): det tonar in över de målade planen på 0,2
sekunder när kameran börjar, och ut de sista 0,25 sekunderna tillbaka (hela vägen hem till rummet
tidigare, `.vhs-hem`, innan dess kanter syns). I telefonen och Safari tonar det bort när kameran
har stannat vid rutan med en kassett i, som väggen i rum.js gör där, och tas bort med lådan
(`utanLada`). Ytorna ritas i rummets mått och förstoras (väggen och fronten i halva, kopiorna i
dubbla), så att lagren är små. Med `prefers-reduced-motion` syns det direkt vid rutan.

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

### Hasse Backe

*Hasse Backe (fiktiv)* analyserar matcherna på stryktipskupongen och fyller i din kupong (se
*Din kupong*), och det är allt man kan be honom om i baren: inga följdfrågor och ingen textruta. (Vid anslagstavlan kan man också ropa till
honom om en lapp, och vid protokollet om poängen, och han svarar från baren, se [Anslagstavlan](#anslagstavlan) och
*Sammanställningen efter omgången*.) Han sitter i baren till vänster utanför bilden, och
längst ut på pulten står hans kaffe vid notan, och där ligger hans hand. Ett klick på dem, eller H,
och kameran slår snabbt åt vänster till honom. Där sitter han vid pultens hörn: samma pult som man
står vid, som går fram längs ens högra sida och viker av åt vänster förbi honom. Han sitter på andra
sidan om den, vänd mot en, med underarmarna på pulten, kaffet och notan vid den vänstra handen i hörnet
och cigarren i askkoppen vid den högra. Bakom honom är samma slitna affär som gänget sitter i: furupanelen
med paketen på en hylla, skylten *Kredit ges ej* (notan vid hans hand säger *Skrivs på Notts County*), och
bardisken med tidningsbunten, kaffebryggaren och kassan. Samtalet står i en spalt till vänster om honom (på höjden under honom)
och kommer när kameran har stannat. Ett klick på bilden utanför samtalet går tillbaka, liksom Esc. Medan han väntar på att man ska välja gör han något litet då och då – trummar med fingrarna,
tittar bort, nickar för sig själv, suckar (se *Vilan*) – och ibland njuter han av kaffet (på ett av sex
sätt) eller av cigarren (på ett av elva), varannan gång. I rummet ligger kaffet, notan och
handen kvar på pulten som en ledtråd, och handen trummar när man pekar på den eller kaffet, och
ibland ändå.

**Bilden.** Hans bild är en egen filmbild där rummet inte syns, och allt i den hör till hans värld:
väggen, disken, kaffet, notan och han själv har samma kamera
([public/rum-hasse-scen.js](public/rum-hasse-scen.js)). Han sitter vid pultens hörn: pulten man står
vid i rummet går fram längs ens högra sida när man har vänt sig åt vänster, och viker i hörnet av åt
vänster förbi honom (benet framför honom). Han sitter på andra sidan om benet, så långt ut mot hörnet att
händerna ligger vid geringssnittet, med kaffet och notan på hörnet bredvid, som händerna, kaffet och notan på
pulten i rummet (`PLATS`: han sitter 27 cm längre ut än förut, ändrat 2026-11-09). Bakom honom är
affärens vägg med hyllorna. Kameran är ens öga: 1,8 m framför honom, rakt framifrån (kroppen är ett
foto taget framifrån, djupet i [public/rum-hasse-3d.js](public/rum-hasse-3d.js), och tål inte mycket
från sidan), 45 cm högre än hans ögon och lutad 14° nedåt, som när man står och han sitter. Det gör
att pulten ses uppifrån som i rummet: koppen ungefär 35° uppifrån och det inre hörnet 39°, mot 17°
när han satt längre bort bakom en bardisk (ändrat 2026-11-07, se nedan). Pultens arm går fram förbi
kamerans högra sida, och med ögat 31 cm över hans och 10° lutning såg den ut som en ramp som steg mot
hörnet; 14 cm högre och 4° mer nedåt ligger den vågrät (ändrat 2026-11-08, väggen ombakad). Benet är vridet 8° (`BAR`),
så att pultens arm går fram förbi kamerans högra sida, som när man har vänt sig lite mindre än en rät
vinkel. Eftersom han sitter vid hörnet går armen fram tätt intill en, som pulten man står vid.

Han sitter så att fotot inte behöver något under sig: disken framför honom döljer allt nedanför
magen, så det finns inga ben och ingen stol. Pulten är geometri i hans värld, vriden som benet, och
ritas en gång på en egen duk under figuren (`diskBild`): benet framför honom och armen mot en
(`SCEN.HORN`), samma skiva som i rummet (se *Pulten* nedan), och framsidan i fält nedanför, indragen
i skugga under den tjocka skivan. Träet speglar väggen bakom honom svagt: den
speglade strålen träffar väggen, och där hämtas färgen ur väggens bild, suddigare ju längre strålen
går; han själv speglas som en mörk form. Notan ligger under fatet,
samma nota som på pulten, med den främre änden lite uppböjd. Den ritas på en duk efter notan i rummet
(`#rum-hasse .nota` i rum.css): samma typsnitt, rader, vinklar och pappersstruktur, med baslinjerna mätta
där. Notan, koppen, fatet, askkoppen och cigarren får barens ljus, men bara dess styrka och dagsljusets
färg (`ljusDag` i [public/rum-hasse-arm.js](public/rum-hasse-arm.js)): de skiftar med dagsljuset som han och
disken, det vita svalt vitt mitt på dagen och varmare i den gyllene timmen, men blir inte rosa av neonskylten
och barens lampor. Cigarrens kantljus är också bara styrka; glöden är dess egen.
Figuren skuggar det som är under disken eller skyms av den (`BORD_GLSL` i
[public/rum-hasse-arm.js](public/rum-hasse-arm.js)): framför diskens bakre kant det som är under
ovansidan, bakom den det som strålen från kameran bara når genom disken. Kroppen slutar alltså vid
kanten, och armbågar, händer och fat trycks mot disken utan att något sticker igenom. Armarna vilar
med armbågarna på disken och armens riktiga längder (`paDisken`), och gesterna börjar och slutar
där. Han sitter bekvämt: armbågarna lite ute, underarmarna vilande på disken snett in mot mitten och den
vänstra handen över den högra, så att armen går fri från fatet. Händerna ligger i underarmarnas
förlängning, med handlederna lite upp och fingrarna lätt böjda ned mot disken och samlade. Den högra
handens fingrar är mer böjda, så att de slutar under den vänstra hand och inte sticker fram mellan dess
fingrar. Slår han i disken landar handen en bit åt sidan
(`SLAG_A`, `SLAG_B`), annars skulle slaget hamna på hans egen hand, och den högra handen dras ut bakåt
längs sig själv när den lyfts ur vilan, och skjuts in igen på samma sätt, så att fingrarna inte går genom
den vänstra (`UTDRAG`). Det är bara den vänstra som trummar i vilan. Tummarna ligger intill händerna, så
att den vänstra tummen inte går ned i disken (`SAMLA`, `TUMME_VILA`); det tonar bort när handen tar
kaffet, cigarren eller pennan. Askkoppen står till vänster om den högra handen och en bit framför den, så långt ut att handen går fri från cigarren när han slår i disken. Fatet står
på hörnet, och notan ligger på tvären framför hans händer, vänd som i rummet (se *Kaffet i rummet*). Fingrarna lägger sig på disken: ett finger vars två yttre leder skulle nå under
ovansidan böjs mindre, tills den lägsta punkten ligger på ytan (`golv` i
[public/rum-hasse-arm.js](public/rum-hasse-arm.js)), så att fingertopparna aldrig går ned i disken,
inte heller när han trummar eller slår i den. Förut var fingrarna krökta som klor i vilan, topparna
försvann ned i disken och den vänstra handen pekade in mot honom med koppen vid handleden (ändrat
2026-11-06). Sedan låg handen rakt fram med armbågen ute, och ärmen gick genom fatets kant, så att det
såg ut som om armen låg över fatet (ändrat 2026-11-06). Sedan pekade den högra handen tvärs över mot
den vänstras handled, vinklad nästan 20° mot tummen, och den vänstra var vriden ut mot koppen nästan
50° mot underarmen, med armbågarna ute: händerna låg på varandra och såg krampaktiga ut, och de liknade
inte den lugna handen på pulten i rummet (ändrat 2026-11-07). Sedan låg händerna platta med nästan
raka fingrar, och den vänstra tummen gick ned i disken och skars av i en rak kant (ändrat 2026-11-08).
Sedan låg underarmarna nästan rakt fram med händerna isär och den vänstra armen tätt intill fatet, som i
givakt (ändrat samma dag).

Han fyller höjden från hjässan nära överkanten, och pultens inre hörn ligger nära underkanten, så att
man ser att pulten går vidare mot en; mitten av honom står vid 60 % av bredden och samtalet i en spalt
till vänster, och får samtalet inte plats blir han mindre (`matt` i [public/rum-hasse.js](public/rum-hasse.js)). Kaffet och notan får hamna utanför bilden
i smala fönster. På höjden står han överst och samtalet under notan. Ändras fönstret medan han syns
räknas det om; vrids telefonen sitter han på det andra sättet.

**Pulten** är samma i rummet och i hans bild ([public/rum-pult.js](public/rum-pult.js)): formen (L:et i barens
mått, `L`), träet (`PULT_GLSL`), framkanten (`SKIVA`), ringarna efter glas (`ringar`) och rummets kamera mot
pulten (`RUM`). Brunt, matt trä som ådras längs pulten och, längst till vänster i rummet där den viker av mot
en förbi honom, längs benet, så att de möts i ett geringssnitt från det inre hörnet till det yttre; fläckigt och
slitet, med samma ringar efter glas i båda bilderna (de skiftar med dagen: en vid armens bortre kant strax till
höger om hörnet, som syns i båda, en på hörnet, fyra längre bort på armen och två på benet framför honom). En smal
list i aluminium längs de bortre kanterna, och mot en en tjock, mjukt rundad kant av samma trä (6,6 cm skiva, en
rundning överst, en rak bit och en mindre rundning nedtill) med framsidan indragen under den. Hans bild ritar
pulten som geometri med `PULT_GLSL`; rummet visar den som färdiga bilder (`rum/pult.webp`, `pult-mer.webp` och
framkanten `pult-kant.webp`, inte i telefonen på höjden där pulten fortsätter), bakade med samma skuggare genom
rummets kamera ([scripts/rum/pult.mjs](scripts/rum/pult.mjs)), och ringarna ritas ovanpå när rum-pult.js är
hämtad (`ringar` i rum.js). Rummets kamera är ett öga vid pulten som ser mot fönstren, med horisonten och
flyktpunkten där pultens bild alltid har haft dem: bortre kanten ligger kvar på y = 650 och kanten mot en på
984, och hörnet hamnar längst till vänster, där kaffet står på hörnet som i hans bild. Framkanten ligger alltså
precis vid rummets nedre kant: i ett fönster med scenens form (16:10) hamnar den strax nedanför och syns först i
högre fönster. I rummet är ljuset
lysrörets och dagens, svalare än barens lampor och lite ljusare, och rummets egna lager ovanpå är räknade med,
så att träet har samma dämpade bruna som framför honom och inte är orange. Förut var pulten i rummet en målad bild
med plankor som gick mot en, mer orange, utan hörn, med ringarna utspridda för sig, en list i aluminium mot en och
inga ringar i hans bild (ändrat 2026-11-08).

**Panoreringen.** Rummet och hans bild ligger bredvid varandra, med hans till vänster och en bit
vägg emellan, och allt glider åt höger på 0,42 s, som när kameran slås åt vänster: fort i början,
fortast när bilderna byter plats och mjukt på slutet (`ryck`). Oskärpan följer farten och är vågrät,
störst (4,6 % av bredden) mitt i, så att man aldrig ser båda bilderna skarpa. Den ligger på ett
omslag utanför rummets 3D-värld (`.rh-pan`), som dras ut 40 gånger på bredden och suddas
(`filter: blur`) medan rummet och hans bild dras ihop lika mycket inuti: då blir oskärpan 40 gånger
längre på bredden än på höjden. Tillbaka går det likadant åt andra hållet. Panoreringen är 28 färdiga
mellanbilder som grafikprocessen spelar upp själv, och ingen duk ritas om på vägen. Med minskad
rörelse tonar hans bild in och ut på 0,26 s. Rummet rätar upp sig efter musen och står still medan
han syns (`Rum.vila`), och då ritas det inte alls (`visibility: hidden`), men det står kvar som det
var, så att vägen tillbaka inte behöver bygga om något. I vila har omslagen ingen transform och inget
filter. `?rum-hasse-pan=0.5` fryser panoreringen på vägen (för bilder).

**Samma sida.** Rummet och hans bild ska läsas som ett ställe där man bara har vänt sig. Namnet
(*Matchfixarna*, i fönster smalare än 8:5) och foten står därför stilla medan kameran slår och är kvar hos
honom, med *Tillbaka* där *Vanlig sida* stod; samtalet börjar under namnet, namnet leder tillbaka till
rummet, och det tonas bort bakom matchbladet och kupongen i handen. Förut försvann båda i panoreringen och
namnet var borta hos honom, så att det såg ut som en annan sida. Neonskylten i affärens fönster sitter strax
utanför hans bild till höger, och dess röda sken faller in därifrån som över gänget i rummet (`.rh-ton::before`,
`--neon` i `tand`): starkast på natten, tydligt på kvällen och nästan borta i dagsljus; en färdig toning utan
blandning. Man vänder sig med samma drag som man ser sig omkring med i telefonen: när rummets vänstra kant
redan syns och man drar vidare åt höger (minst 64 bildpunkter, mest i sidled) slår kameran till honom, och
hos honom drar man åt vänster för att vända sig tillbaka (inte på kupongen eller matchbladet). Med
tangentbord är det pilen åt vänster i rummet, när inget ligger framme, och pilen åt höger hos honom.

**Ljuset.** Samma ljus på allt i hans bild, på fotot, armarna, händerna, koppen, askkoppen, cigarren
och disken: varmt framifrån till vänster, ett varmt kantljus bakifrån från barens lampor, och
neonskyltens röda sken och gatans kalla ljus från höger, där affären är (`LJUS` i
[public/rum-hasse-arm.js](public/rum-hasse-arm.js); väggen är spårad med samma ljus). På dagen kommer
dagsljuset genom affärens stora fönster till höger (nedan). Över hela
bilden mörknar hörnen, och ett lätt korn rör sig (`.rh-ton`, `.rh-korn`), inte på rummets lägre steg
och inte i telefonen. Händerna på pulten i rummet har samma ljus (se *Kaffet i rummet*).

Baren har samma tid på dygnet som rummet (`ljuset` och `tand` i [public/rum-hasse.js](public/rum-hasse.js)).
Lysröret i affärens tak är tänt och släckt som i rummet (`RumFolk.nattGrad`): från 23 dämpas det under en
timme, från midnatt till sex är det släckt, och från sex tänds det under en timme. När det är tänt
är väggen en egen bild spårad med röret framför baren och affären i dess sken till höger
(`hasse-bak-lys.webp`), och figuren, disken och koppen får ett brett ljus från affären och lite mer
ljus överallt (`uLys` i `LJUS`, `LYS`), medan neonen och gatans kalla ljus syns mindre. Släckt ligger väggen
i neonskyltens och gatans svaga sken (`hasse-bak.webp`). Medan röret dämpas och tänds hämtas båda bilderna, och
väggen ritas på duken med den tända ovanpå den släckta så tänd som röret är (`vagg`, `blandar`); `LYS` och
`--natt` följer samma grad, och nattens mörker i figuren (`nattGrad` i rum-hasse-arm.js) går steglöst. Sitter man
hos honom följer ljuset klockan varje minut (`ljusNu`), och väggen och disken ritas om. Då mörknar också han, pulten, kaffet, notan, röken och din kupong till ungefär 40 % (`natten` i `LJUS`, `--natt` på kupongen), inte lika mörkt som rummet så att man ser honom när man pratar, och bara cigarrens glöd lyser som vanligt. När det ljusnar ute på sommaren kommer ljuset tillbaka gradvis.

Dagsljuset faller in genom affärens stora fönster till höger, efter samma klocka och väder som utsikten
i rummet (`RumUte.light`): så starkt som det är ljust ute, och i himlens färg nere vid taken, men vitare,
som ögat ser dagsljus inne, och svalare än barens varma lampor. Sol gör det starkare och varmare, låg
sol gyllene, den blå timmen blå, och mulet, regn och dimma grått och svagare; på natten finns det inte.
På figuren, disken och koppen är det ett brett, mjukt ljus från höger och lite framifrån (`uDag` i
`LJUS`, `DAG`), så att hans vänstra sida är ljus och den andra faller av mjukt, och när det är dag ger
lamporna, neonen och gatans ljus vika. Skuggorna på disken faller då åt vänster, bort från fönstret,
och disken är ljusast närmast affären, och lika ljus som pulten i rummet. Väggen har fönsterljuset spårat för sig, i vitt, från samma
fönster och med hans skugga (`hasse-bak-dag.webp`, `?dag=1` i [scripts/hasse/bak.html](scripts/hasse/bak.html)),
och sidan lägger det på väggens bild i fönstrets färg och styrka, som ljus läggs till ljus, på en duk
som disken också speglar (`vagg`). Förut var baren alltid en mörk kvällsbar, också mitt på dagen när
rummet bredvid var ljust, och sedan låg ett dis i himlens färg över hela bilden, också över honom, medan
ljuset på honom nästan var detsamma dag som kväll (ändrat 2026-11-06).

**Kaffet i rummet.** Händerna, koppen och notan på pulten är samma som i hans bild, så att man känner
igen dem när kameran slår över: koppen är bardiskens modell (`byggKopp`) med samma ljus, vit som i baren
(`ljusDag`). Notan under fatet tonas i samma ljus: när koppen är ritad räknar grafikkortet ut färgen på något
vitt som ligger där (`vittTon`), och notans papper tar den färgen (`--nota-a` och `--nota-b` i rum.css), så att
notan skiftar med dagsljuset som koppen. Fatet står
på notans övre vänstra hörn så att namnet syns, och till vänster om fatet ligger hans underarmar korslagda på
pulten, den vänstra handen över den högra, som i baren ([public/rum-hasse-hand.js](public/rum-hasse-hand.js)).
Det är samma armar i samma vila (`VILAN` i [public/rum-hasse-arm.js](public/rum-hasse-arm.js), som baren
också läser), i figurens värld och med samma disk, så att fingrarna lägger sig på pulten som där; samma ärm,
manschett och hud, och samma ljus som i baren (lysröret tänt och dagsljuset efter klockan och vädret; på natten
mörknar rummet självt). De ses i rummets blickriktning, mot fönstren, lika långt bort och lika mycket uppifrån
(33°) som från ögat i rummet (`RUM` i rum-pult.js), och kantljuset räknas mot det ögat (`vy`), inte mot
barens kamera: annars blev ärmarnas sidor varmt bruna. Från rummet ses också ärmarnas sida bort från barens
lampor, och den blev nästan svart; ärmens tyg får därför mer ljus i rummet (`bord.tyg`, 1,35 mot 1 i baren), så
att det är samma koksgråa kavaj som framifrån. Underarmarna är lika vida som i baren. Bilden flyttas dit där kaffet och notan ligger, så
att underarmarna kommer in från bildens vänstra kant, den vänstra snett uppifrån över pultens bakre kant och den
högra under den, med armbågarna och axlarna utanför bilden. Under händerna och underarmarna ligger samma skuggor
som i baren (`byggSkugga`), med en tät, mörk kontaktskugga där händerna ligger an mot pulten. Det är bara den
vänstra handen, överst, som trummar. Koppen ritas i handens duk med en egen kamera, 33° uppifrån som pulten och
rakt framifrån, eftersom ögat ser hörnet långt från sin mitt och en kopp där skulle luta. Den är lite mindre
än i baren (`KOPP_SKALA`), där handen pekar rakt mot en och ser kortare ut. Duken tonar in när den är klar, och den ritade koppen i
`hasseHtml` tonar då bort; den står kvar utan WebGL. Bardiskens trä har pultens bruna, inte rödare.
Notan ligger på samma håll på båda ställena: i rummet rättvänd mot en, med raderna längs pulten och överkanten mot
dess bortre kant, och i baren, där man har vänt sig nästan ett kvarts varv, alltså på tvären framför hans händer
med raderna mot en (`NOTAN` och `NV` i [public/rum-hasse-3d.js](public/rum-hasse-3d.js)); i båda står fatet på
dess övre vänstra hörn och händerna ligger vid geringssnittet. Rummets bild av händerna ses som förut, från där han
satt innan han flyttade ut mot hörnet, så att de ses lika mycket uppifrån som koppen.
Förut stod en platt ritad kopp, sedd nästan från sidan, bredvid notan, och handen låg under fatet så
att det såg ut som om den bar det (ändrat 2026-11-05). Sedan låg handen tryckt mot pultens bakre kant
med fingrarna mot fatet, medan den i baren låg en bit från koppen (ändrat 2026-11-06). Sedan kom armen
snett uppifrån, och ärmen låg på pultens bakre kant, så att pulten såg ut att ta slut vid armen (ändrat
2026-11-06). Sedan låg handen platt med raka, utspärrade fingrar rakt åt höger mot fatet och sågs 52°
uppifrån, koppen 44°, och i baren stod fatet mitt på notans överkant och täckte namnet (ändrat
2026-11-07). Sedan låg bara den vänstra handen på pulten, med rummets ljus utan baren, medan han i baren
satt med händerna korslagda, och ärmen var mörkare och brunare än i baren (ändrat 2026-11-08). Sedan satt han i
baren 27 cm längre in på benet än händerna i rummet, och notan låg rättvänd mot en där också, alltså ett kvarts
varv vriden mot rummets (ändrat 2026-11-09).

Tre tidigare försök: först satt han på en barstol vid pultens ände med en arm som ett gummiband över
hörnet till handen långt nere på pulten (armen, benen, hörnet och koppen såg konstiga ut). Sedan gled
rummet och baren i sidled med en mörk vägg emellan, och det såg ut som två olika ställen, med en egen
kopp framför honom. Sedan svängde kameran i rummets egen 3D-värld till honom i baren, som en vägg som
mötte bakväggen i ett hörn, med handen kvar på pulten: rummet är en kuliss av platta skikt, så pulten
med kaffet, notan och handen stod på högkant när den sågs från sidan, hörnet blev 135°, skarven mellan
hans arm och rummets hand hamnade vid handleden, och en fotografisk man satt bredvid ett tecknat rum.

**Rörelserna** är klipp på en tidslinje (`KLIPP` i [public/rum-hasse-3d.js](public/rum-hasse-3d.js)):
T 0–12,4 vilan, skrattet, slaget, gesterna och vägen hem, och efter det ett klipp i taget med var
sin bit av tidslinjen. Varje klipp börjar och slutar där han står (i vilan, eller med händerna på
disken när han pratar) och har sina egna nycklar för huvudet, kroppen, ansiktet och armarna
(`RORELSER`), så att ett nytt klipp bara behöver det som händer i det. Klippen i samma grupp (domen,
kaffet, cigarren, småsakerna, talet) lottas av sidan, utan att samma kommer två gånger innan alla har varit med.

**Minen.** Han är nöjd och säker på sin sak, lite överdrivet: hakan lite upp, huvudet nästan rakt, båda
brynen lite uppe och ett leende som når ögonen, i vilan och när han pratar (`HUV` och `NOJD` i
[public/rum-hasse-3d.js](public/rum-hasse-3d.js)). Leendet viker bara undan när han drar ned brynen, som
när han blir allvarlig före ett slag. Förut hade han ena brynet högt, huvudet på sned och hakan uppe med
ett tunt leende, och det såg hånfullt ut; leendet i skuggaren var också så svagt att det knappt syntes
(ändrat 2026-11-06).

**Vilan.** När han bara sitter och väntar på en upprepar sig ingenting. Det som alltid rör sig går
aldrig i takt: han blinkar ungefär var fjärde sekund men oregelbundet, någon gång mellan en halv och
sju och en halv sekund isär och ibland två gånger i rad (`blinkar`); blicken flyttar sig lite med en
snabb ryckning ungefär varannan sekund, oftast tillbaka till en (`sakkader`); huvudet driver långsamt
i svängningar som inte går jämnt ut (`drift`), och andningen byter takt och djup (`andning`, allt i
[public/rum-hasse-3d.js](public/rum-hasse-3d.js)). Samma klocka ger alltid samma bild, men inget mönster
går igen. Förut blinkade han exakt var 4,3:e sekund, huvudet vaggade och bröstet hävde sig i
rena sinusvågor, och det enda han gjorde mellan kaffet och cigarren var att trumma, likadant varje gång
(ändrat 2026-11-06).

Var 5–11:e sekund gör han något litet (`SMATT` i [public/rum-hasse.js](public/rum-hasse.js)), lottat utan
att samma sak kommer två gånger innan allt har varit med, och fingrarna dubbelt så ofta som det andra.
Fingrarna trummar på ett av fyra sätt, oftast med höger hand och annars med vänster: två varv från
lillfingret till pekfingret, tre fortare, ett långsamt, eller pekfingret som knackar fyra gånger
(`TRUM`). Annars ett av nio klipp med händerna kvar på disken (gruppen `smatt`), där ögonen går först och
huvudet efter, som man gör:

- `affaren`: tittar bort mot gänget i affären, kisar, skakar lite på huvudet och ler åt dem.
- `baren`: tittar längs baren och nickar med brynen upp åt någon han känner.
- `notan`: tittar ned på notan, brynen åker upp och munnen säger oj, och han skakar på huvudet och pustar.
- `nicka`: nickar för sig själv med blicken ned åt sidan och ett leende.
- `suck`: andas in djupt så att bröstet häver sig och axlarna åker upp, och andas ut genom munnen.
- `nacken`: sträcker på nacken åt båda hållen med slutna ögon.
- `brynet`: hakan lite upp, ena brynet högt och ett brett leende, och en långsam nick: visst är det så?
- `skrocka`: skrockar åt något han kommer att tänka på, med axlarna som hoppar.
- `smacka`: tittar på kaffet, smackar och säger mm.

Han spanar också på din kupong (gruppen `spana`). Ligger den på disken framför honom är det ungefär vart
tredje tillfälle, med en lottad min. Har han sagt vad han tycker om den följer minen orden (`H.spana` i
`omKupongen`), också när kupongen inte ligger där. Utan kupong på disken och utan ord om den tittar han
inte ned, eftersom blicken då inte har något mål och bara går ned mot den som sitter framför honom.

- `spanaNojd` (samma tecken som han): ett leende som växer och två små nickar.
- `spanaBryn` (färre tecken än han): ett bryn åker upp, och han tittar på en: jaså.
- `spanaSkaka` (fler tecken än han, eller delvis andra): skakar långsamt på huvudet och pustar ut.
- `spanaBlund` (helt andra tecken): sluter ögonen en stund, i tyst besvikelse.
- `spanaSmyg` (bara lottad): två snabba ögonkast utan att huvudet rör sig, och sedan tittar han oskyldigt bort.
- `spanaKis` (bara lottad): lutar sig fram och kisar, och sätter sig tillbaka med ett oj.

Hakan går inte ned mer än när han tittar på notan: med huvudet längre ned ser han arg ut.

Börjar han prata mitt i ett av dem läggs det undan 2,5 gånger så fort. Kaffet och cigarren kommer som
förut (se *Cigarren*), när han inte gör något annat. Med minskad rörelse gör han inget av det, men han
blinkar och andas.

**Slaget.** När domen är klar slår han den i disken på ett av fem sätt: armarna upp i ett gapskratt
och handen i disken (`slag`); tyst och allvarlig med knuten näve i hakhöjd, som han slår i disken med
lillfingersidan och låter ligga kvar medan han nickar (`naven`); tre slag med handflatan, varje gång
lite högre upp ifrån och lite hårdare, med en nick för varje (`treslag`); båda händerna lyfta medan han
andas in och lutar sig bakåt, och sedan ned i disken samtidigt (`bada`); eller pekfingret i luften
bredvid ansiktet, en stöt fram mot en och sedan handflatan i disken (`fingret`). Domen står i guld i
det ögonblick det hårdaste slaget träffar (`dom`). Vid ett bestämt ord mitt i talet (*solklart*,
*glöm det*) slår han ibland handflatan i disken i stället för att lyfta fingret (`dunka`). Handen
går allt fortare mot disken och stannar tvärt, studsar lite och blir liggande, och han blinkar och
nickar när den träffar. Vid varje slag rycker hela bilden till, mer ju hårdare han slår (`--slag` i
[public/rum-hasse.css](public/rum-hasse.css)), och det som står på disken hoppar: koppen studsar
på fatet, lägre för varje gång, fatet och askkoppen lite och cigarren i urtaget (`hoppar`).

**Kaffet.** Han dricker på sex sätt, och han överdriver och njuter: en ordentlig klunk med slutna
ögon, och sedan smackar han och säger mmm med höjda bryn och ett brett leende medan huvudet vaggar
(`klunk`); blåser på kaffet tre gånger med koppen under hakan, så att ångan far bort från honom,
smakar försiktigt och rycker till av värmen, och tar sedan en riktig klunk och ett långt *ah* med
huvudet bakåt (`blasa`); tittar ned i koppen med höjda bryn, snurrar den och nickar gillande, dricker
ur den i ett svep, tittar förvånat ned i den tomma koppen och ställer ned den med en smäll (`titta`);
håller koppen under näsan och drar in doften länge med slutna ögon, så att ångan sugs mot näsan och
bröstet häver sig, och tar sedan en liten klunk (`dofta`); skålar med en, tar en stor klunk och
ställer ned koppen med en smäll och ett *ah* (`skal`); eller dricker fint med lillfingret ut och
näsan i vädret, två små läppjanden, och smackar och nickar som en vinprovare (`fint`).

Det är koppen som styr, som med cigarren (`kaffeArm` i [public/rum-hasse-3d.js](public/rum-hasse-3d.js)):
dess läge räknas fram (på fatet; vid läppen och under näsan i huvudets mått, så att den följer med när
han lutar huvudet bakåt; under hakan, framför bröstet och upplyft mot en i kroppens), och handen sitter
i örat med samma grepp hela vägen, fingrarna mot koppen och handflatan mot honom. Vid fatet pekar örat
bort från honom, så där håller han det bakifrån, med fingrarna genom örat och tummen ovanpå, och handen
vrids runt örat till greppet medan han lyfter koppen (`GREPP_FAT`). När han dricker lutas
koppen runt kanten mot hans underläpp, så att den ligger kvar där, och örat vrids samtidigt in mot
kinden, så att handen inte stiger upp framför ögat. Förut stod koppen nästan upprätt framför hakan,
snett åt sidan, och handen hade samma vinkel hur koppen än stod (ändrat 2026-11-05). Lillfingret står
rakt ut och spretar (`extra` i `bojFingrar`, [public/rum-hasse-arm.js](public/rum-hasse-arm.js)).
Koppen klirrar mot fatet när han ställer ned den, hårdare efter en smäll. Örat sitter på andra sidan koppen från
handen, så på väg dit och tillbaka går handen upp och över koppen, och pekfingret håller i örats övre
del, så att handen inte går ned i disken medan koppen står på fatet (förut gick handen rakt genom koppen
och fatet, och den nedre delen av handen försvann i disken; ändrat 2026-11-06).

Armbågen läggs där handleden ser naturlig ut (`naturlig`, också för cigarren). Med handen given av det
han håller i kan armbågen bara ligga på en cirkel mellan axeln och handen, och där väljs den så att
underarmen går i handens förlängning: handleden lite bakåtböjd, hellre böjd mot handflatan än åt
sidan, och armbågen inte upp över axeln eller in framför magen. Förut pekade armbågen åt ett fast
håll, och då kunde handen sitta nästan i rät vinkel mot underarmen och sticka ut ur manschettens sida,
så att man såg in i den (ändrat 2026-11-06).

**Cigarren.** Till vänster om hans högra hand och en bit framför den står en tung askkopp av samma gods
som koppen, med två urtag. I det ena ligger cigarren: huvudet på disken och vänt lite in mot honom, ringen
(guld och rött) synlig och glöden över askkoppens mitt, där en tunn rökslinga stiger. Då och då tar han den
och njuter av den en stund, på ett av elva sätt som lottas (nedan). Han tittar ned, för handen lågt över
disken med underarmen rakt fram från armbågen och nyper cigarren med flack hand och rak handled, med
handflatan nedåt och lite framåt (`P_VILA`); förut sträckte han ut armen åt sidan, vred handen 60° utåt och
dök ned på den ovanifrån med raka, utspärrade fingrar (ändrat 2026-11-09). Han håller den löst i
fingertopparna, tummen under och pek- och långfingret ovanpå, med ring- och lillfingret böjda in mot
handflatan; vid munnen sitter handen under den vid käken, med fingrarna uppåt i underarmens förlängning
och armbågen nere (förut satt den vid kinden, och då knäcktes handleden åt sidan). Det är cigarren som
styr: dess läge räknas fram (i askkoppen, vid munnen eller i mungipan i huvudets mått så att den följer
när han rör huvudet, vid axeln, framför bröstet) och handen räknas ur greppet, så att den sitter kvar i
fingrarna hela vägen. Handen kan också släppa den: då sitter den kvar i munnen och handen vilar på
disken. På askkoppen och cigarren tittar han mest med ögonen (`blickX`, `blickY`) och vrider huvudet
bara lite, eftersom ansiktet är ett foto som förvrids vid större vridningar. När han blåser ut far
röken förbi ansiktet åt sidan och blir ett moln bredvid honom. Förut höll han cigarren djupt i den
krökta handen, så att fingrarna såg ut att hänga i den som i en stång, vred huvudet så långt mot
askkoppen att ansiktet förvreds, och röken stannade framför ögat som en blek fläck och kom ur näsan som
en vit mustasch (ändrat 2026-11-05).

Kaffet och cigarren kommer varannan gång, kaffet först: 18–32 sekunder efter att man har vänt sig
mot honom, sedan var 45–80:e sekund (`VANA` i [public/rum-hasse.js](public/rum-hasse.js)), bara när
han väntar på en och inte pratar eller trummar. Medan han väntar på en analys tar han också kaffet och
cigarren varannan gång. Ska något annat spelas medan han har den (slaget med domen, vägen hem efter analysen) lägger han tillbaka den
2,5 gånger så fort (`skynda`). Röken är partiklar i en gemensam luftström: lugn och rak nära glöden,
slingrig högre upp (`byggRok` i [public/rum-hasse-arm.js](public/rum-hasse-arm.js)). Med minskad
rörelse ligger cigarren kvar i askkoppen, men röken stiger, på samma sätt som han fortfarande andas.

Sätten (`KLIPP` i [public/rum-hasse-3d.js](public/rum-hasse-3d.js); de sju sista byggs med
`cigarrKlipp`, som fyller i hur han tar upp den och lägger tillbaka den):

- `cigarr`: två bloss med halvslutna ögon (glöden flammar upp, och mellan blossen pyser lite rök ur
  mungipan), huvudet bakåt och röken ut med slutna ögon, ett leende och en blick på cigarren.
- `bloss`: ett bloss och röken i en tunn stråle ur mungipan, med huvudet på sned och ett höjt bryn.
- `ringar`: två korta bloss och tre rökringar med munnen som ett o, åt sidan så att de far ut i luften
  bredvid honom, och han tittar efter dem. Rökringen är partiklar i en cirkel som far iväg och vidgar
  sig, med svag virvel så att den håller ihop (`ring`).
- `aska`: han knackar av askan över askkoppen med två korta ryck (askan faller), tittar på glöden, drar
  ett bloss och blåser ut röken genom näsan.
- `lang`: ett långt, långsamt bloss med ögonen som sluts och axlarna som stiger, röken kvar i munnen en
  stund, huvudet bakåt och en lång utandning medan axlarna sjunker, och sedan *ah*: ett brett leende,
  en liten skakning på huvudet och en gillande nick mot cigarren.
- `luta`: ett bloss, och sedan lutar han sig bakåt med cigarren i handen och blundar en lång stund,
  andas djupt och långsamt med ett leende som växer medan röken ringlar upp från glöden, och nickar
  nöjt mot en.
- `tand`: han biter om cigarren i mungipan och släpper den, sitter nöjd med händerna på disken och
  puffar, med lite rök ur andra mungipan, och tar den sedan igen.
- `beundra`: han håller upp den framför bröstet, rullar den mellan fingrarna och tittar på den med
  höjda bryn och munnen som säger hm, nickar gillande och tar ett bloss.
- `puffar`: tre korta bloss i rad med lite rök ur mungipan efter vart och ett, ett nöjt moln med
  huvudet bakåt, ett brett leende och ett litet skratt.
- `vifta`: ett bloss, och sedan visar han cigarren mot en med två små knyckar – det här, det är livet –
  och skrockar.
- `smaka`: han håller röken i munnen och smakar på den med slutna ögon och höjda bryn, och släpper sedan
  ut den långsamt.

**Elden.** Cigarren slocknar om han låter den ligga: 2,5–4,7 minuter efter att han rökte sist tonar glöden
och rökslingan ut på en halv minut (`CIG_LIV`, `slocknar` i [public/rum-hasse.js](public/rum-hasse.js)), och
när man kommer har den slocknat ungefär varannan gång (`CIG_SLOCKNAD`); man kan ha varit borta. När vanan
sedan kommer till cigarren tänder han den i stället för att röka (gruppen `tanda`, `cigarrGest`), och efteråt
brinner den. Har han just sagt sitt om en match och den har slocknat tänder han den gärna strax efter. Den
slocknade cigarren han låtsas röka när han verkar upptagen (`slocknad`) kommer bara när den verkligen har
slocknat; har man just kommit kan den ha slocknat då. Med minskad rörelse brinner den.

Bakom askkoppen, mot honom, står ett tändsticksställ i askkoppens porslin, med det blå bandet och en
oglaserad, räfflad plån runt om, med nio långa tändstickor (rödbrun tändsats), och längre ut ligger hans
tändare i borstat stål (allt i [public/rum-hasse-eld.js](public/rum-hasse-eld.js)). De står där han når
dem med höger hand och där underarmen går fri från dem i de andra rörelserna, och syns också i telefonen.
Stickorna han tänder med hamnar brända i askkoppen (högst fyra syns), och stället blir tommare; när det är
tomt tar han tändaren, och det fylls på när man inte tittar (`H.cig`). Lågan står alltid upp, dras mot glöden
när han drar och släpar efter när handen rör sig, flammar upp när stickan tar, och lyser upp handen,
ärmen, ansiktet och cigarren i sitt varma sken (`eldsken` i [public/rum-hasse-arm.js](public/rum-hasse-arm.js)),
också på natten. Det hörs (rum-hasse-ljud.js): stickan mot plånen, blossen, när han skakar ut den, locket och
hjulet.

Han biter om cigarren i mungipan och har höger hand fri. Det är stickan och tändaren som styr, som med
cigarren (`eldArm`, `eldLage` i [public/rum-hasse-3d.js](public/rum-hasse-3d.js)): stickan hålls i
fingertopparna längs fingrarna och snett ut mot tummen, så att underarmen står upp med armbågen nere när
han tänder; där han sträcker sig efter den har handen sin egen riktning med fingrarna snett ned. Handen vrids
den kortaste vägen mellan lägena och armbågen ligger åt ett bestämt håll per läge (`POL_E`), annars slog den
om mellan två lägen. Sätten:

- `tanda`: han drar, men ingenting, och tittar på den med rynkad panna; biter om den, tar en sticka och drar
  den mot plånen så att den flammar upp, låter svavlet brinna av och tittar på lågan, tänder med tre bloss
  och röken ur andra mungipan, skakar ut stickan och släpper den i askkoppen, och tittar nöjt på glöden.
- `disken`: en sticka i ett långt, säkert drag mot disken, med en gest. Ingenting. Han tittar på stickan och
  stelt på en, drar den mot plånen som vanligt och låtsas som ingenting, tänder, och lutar sig bakåt och
  blåser ut ett stort moln.
- `tandaren`: tändaren, locket upp med tummen, och hjulet ger bara gnistor; han tittar misstänksamt på den,
  drar igen, och då tar det. Han slår igen locket så att lågan dör, lägger tillbaka tändaren och blåser tre
  rökringar.
- `tandare2`: locket upp och hjulet på samma gång på vägen upp, och han tittar på en med ett höjt bryn medan
  han tänder (så gör man), slår igen locket med en knyck, ställer ned tändaren med en liten smäll och visar
  cigarren för en.

**Händerna när han pratar.** Han är nöjd med det han säger: han ler medan han pratar (se *Minen*), och händerna
hjälper till på ett av tio sätt (gruppen `tal`). Förut hade han bara ett (`armar`: fingret, handen som
hackar och armen ut åt sidan), och det blev samma rörelse om och om igen (2026-11-06). Nu lottas:

- `armar`: pekfingret upp, handen som hackar och armen ut åt sidan, som förut.
- `oppna`: handflatan upp mot en, med en liten knuff framåt och en nick – där har du det.
- `axla`: båda handflatorna upp och axlarna upp, huvudet på sned och ett belåtet leende – vad ska man säga.
- `lugnt`: handflatorna nedåt över disken, två lugna tryck med en nick och halvslutna ögon för varje, och
  sedan isär.
- `tva`: räknar på fingrarna med handflatan mot en, pekfingret och sedan långfingret, med en nick för varje.
- `tummen`: tummen upp mot en, med en knyck och ett kisande.
- `brost`: handen på bröstet och två klappar, med hakan upp och ögonen halvslutna – det säger jag.
- `gnida`: gnuggar händerna framför sig med axlarna lite uppe – det här blir bra.
- `nojd`: lutar sig bakåt med hakan upp och klappar disken två gånger, så att det hörs lite.
- `rulla`: handen rullar framåt i små cirklar – och så rullar det på.

Några ord har ibland sin egen gest (`ORDGEST` i [public/rum-hasse.js](public/rum-hasse.js)): *två* och
*för det andra* ger fingrarna, *tror jag* och *säger jag* handen på bröstet, och *lugn*, *ordning* och
*kontroll* de lugna händerna. Varje gest börjar och slutar med händerna på disken som när han pratar.
Fingrarna formas per klipp (`fA` och `fB`: hur mycket de spretar, tummen ut, varje finger för sig och
tummen rak fast handen är knuten, nionde talet i `extra` i `bojFingrar`), och handen kan svänga runt
sitt läge (`sv`: när han rullar och gnuggar). Han pekade också på en ett tag, men fingret pekade då
rakt in i kameran och syntes inte, så det sättet är borttaget.

**Samtalet.** Det är han som frågar, *Vilken match ska jag hjälpa dig med?*, och när du kommer tillbaka *Har du kört fast igen, Laino?*, med ditt efternamn om kupongen
vet vem du är. Han talar i hela meningar som går att förstå för sig: han säger vad det gäller (*Vilken match vill du ha hjälp med nu då?*, inte *Vilken match är det nu då?*), och "den" syftar bara på matchen du har valt. Över matchlistan finns alltid plats för två rader, så att listan står still vad han än säger. Man svarar genom att välja en match. Då frågar han tillbaka (*Den är solklar. Vill du
veta, eller ska du gissa?*), och först *Jag är idel öra* ger analysen (knappen lottas som hans repliker: också *Tala om det för mig*), så att ett felklick inte visar ett tips. *Jag gissar* går tillbaka till listan och
*Matchbladet* lägger fram matchbladet över baren – samma blad som när man klickar på lagen på kupongen i
rummet (se *Matchbladet* under [Kupongen i handen](#kupongen-i-handen)), lika stort som kupongen i handen och
med baren mörk bakom; *← Hasse* längst ner, Esc eller ett klick utanför lägger bort det, och man är kvar hos
honom (`bladet` i [public/rum-hasse.js](public/rum-hasse.js)). Svaren står direkt under hans fråga, som lappar i tipskupongens tryck
som ligger på disken: stort 1 X 2 överst (se *Din kupong*), *Jag är idel öra* i terrakotta som kupongens band, *Jag fyller i själv* i krämvitt papper
bredvid (*Jag gissar* när kupongen inte går att fylla i), båda med en tunn ram innanför kanten, och *Matchbladet →* under dem med små spärrade
versaler som texten i bandet. Frågan har sin plats från början, osynlig tills han säger den, så att
knapparna inte flyttar sig. Förut stod svaren som små länkar längst ned i spalten och syntes knappt
i telefonen, och sedan som piller i guld (ändrat 2026-11-04). *Titta igen* efter analysen är samma
lapp i terrakotta, med *Alla matcher* i krämvitt bredvid (*Fyll i den* i stället för *Titta igen* medan han
föreslår att fylla i kupongen, se *Din kupong*), och *Läs upp* står bredvid dem med samma versaler som *Matchbladet →* men
utan pil. Han har alltid svaret (*Den knäckte jag i morse*). Är analysen inte skriven än
säger han det (*Den tar jag sen*). En match du redan har frågat om står direkt, som han sa
den: domen i guld, hans text och resultatet, och sist vad han tycker om det du har på kupongen nu.
Det han sa sparas på enheten, så att det står kvar också när analysen har skrivits om sedan dess
(det görs upp till fyra gånger i veckan, se [Analyserna](#analyserna)). Sedan erbjuder han sig att
titta igen, ödmjukt på sitt sätt (*Jag har haft fel en gång förut. Ska jag titta på den igen, för
säkerhets skull?*), och har analysen skrivits om sedan han sa det säger han det (*Tidningarna har
skrivit mer om den sedan dess.*). *Titta igen* bredvid *Alla matcher* ger hela analysen en gång
till, med slaget, och det nya ersätter det gamla
(`tidigare` i [public/rum-hasse.js](public/rum-hasse.js)). Matcher han svarade på innan texten
sparades (före 2026-11-06) får dagens analys om tecknen är desamma, annars bara domen och
resultatet. När du har bett om analysen står hela hans text direkt (`svara` i [public/rum-hasse.js](public/rum-hasse.js)).
Medan man läser slår han domen i disken (se *Slaget*), och domen står i guld när handen träffar; dess plats är hållen
från början, så att texten står still, och har han något annat i händerna står domen där ändå efter tre sekunder.
*Läs upp* under texten låter honom läsa den med sin röst (`lasUpp`, och det hörs, se *Ljudet*): en mening i taget med
munnen efter ljudet, och meningen han läser står ljus medan resten är dämpad. Det blir en paus mellan meningarna och en
längre före en kort mening, och gesterna kommer vid de bestämda orden (*Nej nej nej* och *varningens finger* ger
fingret, annars handflatan i disken eller en av gesterna i *Händerna när han pratar*) eller vid ungefär var tredje lång
mening, när han sitter så att han kan göra dem. Han läser det som står i rutan: ett stycke som har ljud för sig (en
färdig replik, som resultatet) i ett svep, annars mening för mening, och det som saknar ljud hoppar han över. Knappen
syns när minst hälften av det har ljud, och den slår på ljudet om det är av, som *Ljud på*. Medan han läser heter den
*Ja, ja »* och tystar honom, ett klick i samtalet går till nästa mening, och säger han något annat (om kupongen) slutar
han läsa. Förut låtsades han läsa på i 15–25 sekunder och sa sedan texten ord för ord, och det orkade ingen lyssna på
(ändrat 2026-11-07). Efter texten säger han vad matchen slutar (*Det slutar 3–1.*): resultatet han
valde när texten skrevs (`hasse.resultat`, se *Rösten*). Texter från före 2026-11-07, och analysen
i skrift när hans text saknas, tar i stället det troligaste resultatet i modellens prognos
(resultatmatrisen i `data/match/<id>.json`) bland utfallen han har ringat in, och har modellen
ingen prognos säger han inget resultat (`resultatet` i [public/rum-hasse.js](public/rum-hasse.js)). Sist säger han vad han tycker om det du själv har på
kupongen (*På din kupong har du bara etta. Det var kaxigt.*); har du inget på matchen föreslår han i stället att
fylla i den (se *Din kupong*). Han minns på enheten vad du har
frågat om: på matchens rad står hans tecken ifyllda i guld i rutorna 1 X 2, som på kupongen, med
resultatet bredvid i en rak spalt. *Alla matcher* tar en tillbaka till listan, och där räknar han
(*Nu är halva kupongen klar*). Före omgångens första avspark syns bara tecken du själv har bett om, så
att listan inte blir ett automatiskt tips. När omgången har börjat, och var och ens egna tips har
stängt, står alla hans rader ifyllda, också matcher som inte har startat än, som 18:30-matchen
(`hansRader` i [public/rum-hasse.js](public/rum-hasse.js)): hans kupong i tävlingen om han spelar den,
annars tecknen i hans text, med hans resultat.
Överst i listan står vem som säger vad, utan förklarande text: Hasses porträtt och namn i guld mitt över hans rutor och resultat, och ditt porträtt i din färg med namnet i din handstil (som på kupongen) över din spalt. Får namnen inte plats bredvid varandra, som i telefonen, går ditt namn först och sedan hans, så att porträtten står kvar. En spalt som inte syns på någon rad får inget huvud.
När alla matcher har börjat säger han hur det gick för honom (`efterat`), tills omgången är spelad.

**Ställningen** (2026-11-09). Medan matcherna pågår står ställningen i spalten där facit står efteråt, i kursiv och lite
svagare, och spalten heter *Ställning* så länge någon match pågår (`star` och `facitRuta` i
[public/rum-hasse.js](public/rum-hasse.js), liveställningen ur `KP.live` i [public/kupong.js](public/kupong.js), som hämtas
varje minut). Han ber en inte längre välja match när omgången har börjat (spelstoppet har ju varit), utan säger hur många av
hans tecken som sitter just nu och vad han tycker om det (*Just nu har jag fyra rätt av sju.* *Fotboll spelas i nittio
minuter. Jag tippar på slutresultatet.*), och sedan var 20:e sekund ställningen i en match i taget med en kommentar: sitter
tecknet var det väntat, och gör det inte det är det matchen som har fel (*Burnley leder med 2–0 mot Cardiff.* *Domaren har
inte förstått matchen.*). Var femte sekund ser han efter om något har ändrats (`stallningSteg`): då ritas listan om, och
har det blivit mål i en av hans matcher säger han det så snart han har pratat klart, med en kommentar efter om målet var för
honom, emot men tecknet sitter ändå, eller emot så att det inte gör det (räknat i hur många mål som fattas till hans tecken
och till något annat, före och efter målet). När den sista matchen har slutat säger han hur det gick, som när man öppnar
honom efteråt. Ställningen i ord står med korta lagnamn och sägs tyst, eftersom rösten inte kan ha alla lag och
ställningar; raden om hur många rätt han har och kommentarerna hörs när iMacen har läst in dem. Raderna står under
`stallning` i [public/rum-hasse-repliker.js](public/rum-hasse-repliker.js). Har du valt att dölja resultat står ingen
ställning i listan och han säger inget om den.

**Radion och klockan** (2026-11-09). Radion på fönsterbänken hörs också hos honom, och står den på en station säger han
något om den en gång (per station och besök på sidan) i stället för nästa rad han säger medan han väntar, och nickar med
(*Italodisco är bra musik att tippa till.*, *På talkSPORT har de inte förstått sin egen liga.*); mellan stationerna säger
han något om bruset. Spelar radion musik trummar han med fingrarna eller nickar oftare än annars (`radioNu`, `omRadion`
och `smatt` i [public/rum-hasse.js](public/rum-hasse.js), `RumRadio.lage()` i [public/rum-radio.js](public/rum-radio.js)).
När man kommer märker han också vad klockan är (`tidNu`): mindre än 90 minuter före första avsparken har han alltid
bråttom på sitt sätt (*Du har bråttom, inte jag. Vilken match gäller det?*), och mitt i natten (00–05), tidigt på morgonen
(05–08) och sent på kvällen (22–24) säger han ibland något om det i stället för den vanliga öppningen. Raderna står under
`radio` och `tid` i [public/rum-hasse-repliker.js](public/rum-hasse-repliker.js) och är högst cirka 50 tecken, så att de
ryms på två rader ovanför listan också i den smalaste telefonen.

**Domarna efter omgången** (2026-11-08, listan och lappen 2026-11-09). Så länge protokollet ligger på pulten, alltså från
att omgången är spelad tills nästa Stryktips kommer måndagen efter kl. 16 (`Rum.summa`), dömer han gänget i stället för att
gå igenom matcherna. Han frågar vem han ska börja med, och gänget står sida vid sida i sin ordning, som på kupongen: stora
porträtt i var och ens färg och namnet i sin handstil, utan siffror (`gangLista` i [public/rum-hasse.js](public/rum-hasse.js)).
Den man väljer får sin dom slagen i disken i guld, som domen över en match (*Garderad*, *Turlig*, *Felfri*, *Osynlig*,
*Generös*, *Snuvad*, *Klok*: ordet beskriver personen), och under den några meningar: en inledning efter hur det gick i gänget, en eller två saker ur
kupongen och ett slut (`doma`). Sakerna är räknade ur protokollet: helgarderingarna, hur många spikar som satt och i hur
många matcher ingen annan i gänget hade rätt (läget i `gang` i [public/rum-block.js](public/rum-block.js), raderna i `domar`
i rum-hasse-repliker.js). Raderna väljs efter omgången och personen, inte på lott, så att domen är densamma varje gång och
på alla enheter. Varje rad är en mening, så att domen står i ett stycke och *Läs upp* ändå kan läsa den mening för mening.

Under meningarna ligger *lappen*, en remsa av protokollets blankett om just den kupongen, med samma papper, band och tryck
(`lapp` i [public/rum-block.js](public/rum-block.js), stilen i [public/rum-block.css](public/rum-block.css)). Överst en spalt
per match med rutorna 1, X och 2: kryssen i personens bläck, rutan som satt överstruken med den gröna märkpennan som i
protokollet och facit maskinskrivet under. Rödpennans stjärna vid matchnumret betyder att ingen annan i gänget hade rätt där, och matchen och
resultatet står i spaltens title. Under rutorna siffrorna med tryckta rubriker: *Rätt* av antalet matcher, *Poäng* (med
ringen kring vinnarens, som i protokollet), *Plats* i gänget, *Spelkassan* för omgången (10 kr per match till modellens odds,
garderingar delade som i Olympens spelkassa), *Spikar*, *Halvgarderingar* och *Helgarderingar* som satt av hur många och
*Ensam rätt*. Sedan *Bästa träffen*, tipset med högst odds som satt, och *Största missen*, tipset med lägst odds som inte
satt. Sist *Säsongen* när den är hämtad (`data/tippare.json`, samma som Olympen och utan omgångar som spoilerskyddet döljer,
plus den här omgången om bygget inte har frusit in den än): en stapel per omgång uppåt för plus och nedåt för minus, den här
överstruken, och poängen och platsen hittills. Den visas från andra omgången. Texten och lappen rullar tillsammans, så att
man i telefonen rullar ned till lappen.

*Nästa* tar den man inte har hört om än, i gängets ordning, och *Hela gänget* går tillbaka till listan, där ordet han slog i
disken står som en stämpel i guld under namnet på dem man har hört om (på enheten för den omgången,
`profeterna.hasse.domar`). Om sig själv säger han inget här: han står inte i listan och räknas inte när bäst och sämst i
gänget avgörs, och efter omgången säger han inte heller hur det gick för honom. Förut hade listan rätt och poäng, bäst först,
och länken *Matcherna* till hans rader och facit (borta 2026-11-09). Med dolda resultat finns inget protokoll, och då är allt
som förut.

Till er säger han ni och er, aldrig gänget, eftersom det bara är ni som använder sidan (`npm run repliker` säger till om
ordet). Namnen sitter inte riktigt: ungefär var tredje dom säger han ett namn som nästan stämmer (*Tejler*, *Johanson*;
`felnamn` i rum-hasse-repliker.js, `kallar` i rum-hasse.js), samma i hela domen och på alla enheter, men aldrig om den som
vann. Ungefär var fjärde gång han hälsar på dig händer samma sak. Han rättar sig aldrig och säger inget om det. Står man kvar
vid listan kan han nämna *Revisorn* när någon vann på helgarderingar och *Semesterfiraren* när någon inte lämnade in,
utan att säga vem han menar (`domar.revisorn`, `domar.borta`).

**Tidningen** (2026-11-09). Har det gått dåligt för honom i tippningen låtsas han vara upptagen: han gömmer sig bakom
dagens morgontidning, skyldig men nöjd med sig själv. Har man just kommit läser han redan; han läser rad för rad, tittar upp
över kanten på en med höjda bryn och ler sedan belåtet, lyfter tidningen så att bara ögonen syns, nickar åt det som står,
rycker den rak och tittar längs baren, och mellan gångerna lägger han den i knät bakom disken en stund (klippen `lasa` och
`lasa2`, byggda av bitarna i `LASBIT` i [public/rum-hasse-3d.js](public/rum-hasse-3d.js)). Ur knät lyfter han den med
händerna lågt, för den fram över disken medan den stiger och flyttar sedan upp händerna; i knät hänger armarna nedåt (håller
han den högt medan den är nära honom måste armarna vikas, och armbågarna står ut som vingar). Framme över disken för han den
åt sin högra sida, ut mot askkoppen, och håller den lågt, lutad bakåt, vriden mot sig och halvt hopvikt, inte utbredd mitt
framför sig: det är han man ska se, inte tidningen, och av den ser man förstasidan snett från sidan och baksidan bara som en
kant. Han tittar ned i den med huvudet vridet och böjt mot den i stället för in i kameran (Tomas önskemål 2026-11-09 och
2026-11-10; `LAS` och `LAS_T`, och bitarna utgår från dem. Åt hans vänstra sida vändes baksidan med vädret mot en, därför
den högra; den högra armbågen pekar då ned och ut, `POL_SIDA`). Den är halvt hopvikt också när han tar upp den, gömmer sig
bakom den och lägger ned den. Bara när han gömmer sig för han den framför ansiktet,
och innan han lägger ned den för han in den framför sig igen, så att hörnet inte går genom armen (provat i headless Chrome i
1280 × 800 och i telefonen, 412 × 915, med bilder genom `lasa` och `lasa2`). Behöver han händerna, som när han
slår en dom i disken, läser han klart raden och lägger ned den direkt. Dåligt är inte ett rätt, sämst i gänget, eller rätten
långt under vad chanserna var värda, med tävlingskupongen om han spelade och annars det han sa (`hansOmgang` och `efterat` i
[public/rum-hasse.js](public/rum-hasse.js)); det gäller både när han säger hur det gick och när han dömer gänget. Med
minskad rörelse läser han inte.

Han läser Dagens Nyheter (`lasa`) eller Svenska Dagbladet (`lasa2`), och de ska se ut som de riktiga (Tomas önskemål
2026-11-09): tabloid på grått tidningspapper, med namnet i tidningens stil (skrivet som text, inte loggan: DN:s i en Bodoni,
Playfair Display i [public/typsnitt.css](public/typsnitt.css), SvD:s i spärrade versaler), dagens datum, nummer, årgång och pris,
tre puffar med små bilder, en stor bild och dagens nyhet med vinjett, rubrik, ingress och sidhänvisning, och innehållet längst
ned. SvD har rubriken över bilden och puffarna i en spalt bredvid ingressen. Baksidan är sporten, *Så mår tipslagen*
(2026-11-09, användarens önskan): notiserna inför omgången ur `data/tidning.json`, som iMacen skriver med Claude-kontot (se
*Tidningen inför omgången* under [Analyserna](#analyserna)), som en tipssida: en rad per match med numret i tidningens
färg, lagens bilder från veckan bredvid varandra med namnet på en mörk list i underkanten (lagets sköld där bilden
saknas), rubriken i tidningens rubriktypsnitt och texten, så stort som alla ryms, och fotograferna och sajterna längst ned
(*Foto: Getty Images, Sky Sports …*; `notisRader`). Bilderna trycks som tidningens egna (`tryckt`: blekare, svärtan grå
och korn). Utan notiser, eller med en sida som är äldre än tio dagar, är baksidan vädret, med Sverigekartan, symboler
och grader, prognosen för Stockholm och kvällens tv i SVT1, SVT2 och TV4. Nyheterna och puffarna på förstasidan
(`NYHETER`, `PUFFAR` i [public/rum-hasse-tidning.js](public/rum-hasse-tidning.js)) är påhittade och tidlösa, utan namn på
riktiga personer och utan sport, och dagen väljer dem (`dagens`): samma hela dagen, och aldrig samma nyhet i båda. Bilderna är målade
där (`MALA`: en stad i skymningen, snö på en gata, granskog och en röd stuga vid en sjö, skärgården med färjan, hyreshus och
en julgata) och sedan blekta och korniga som i tryck. Tidningen trycks en gång om dagen (`upptagen` i rum-hasse.js) och
trycks om när han tar upp den andra (`visa`).

**Glasögonen** (2026-11-09). Han läser med läsglasögon i mörk sköldpadd (`byggGlasogon` i
[public/rum-hasse-arm.js](public/rum-hasse-arm.js)), som annars sitter i bröstfickan med det översta hörnet uppstickande.
Före tidningen tar han fram dem med höger hand, håller upp dem framför hakan, fäller ut skalmarna med en knyck och sätter
på sig dem framifrån, blinkar och rynkar näsan tills de sitter (biten `pa`); efter tidningen tar han av dem i hörnet,
fäller ihop dem framför bröstet och stoppar dem i fickan (`av`). Medan han läser håller han tidningen med vänster hand
när den högra behövs (den lutar och sjunker, `enHand`), och han skjuter upp dem med pekfingret på bryggan när de har glidit
(`skjut`), drar ned dem på näsan och tittar på en över dem med höjda bryn och skjuter upp dem igen (`over`), eller tar av
dem, pekar på en med dem, för skalmen till mungipan och tänker efter med blicken uppåt, och sätter på dem igen (`lyft`).
Glasögonen styr som cigarren: deras läge räknas mellan lägena i `GL` i rum-hasse-3d.js (på näsan, längre ned på näsan och
framför ansiktet följer huvudet, fickan och handen kroppen), och handen räknas ur greppet: om bågens hörn framifrån eller
från sidan bakom tidningen, eller med pekfingertoppen på bryggan (`glasArm`). På näsan sitter de så nära ansiktet som
formen tillåter (`paNasan`), och genom glasen ser ögonen lite större ut (`uLins` i ansiktets skuggare). Bågen ritas före
kroppen, så att huvudet och kavajen döljer skalmarna och det som är nere i fickan.

**Sysslorna** (2026-11-09, användarens önskan: fler saker än tidningen, *ertappad men låtsas som att det inte har hänt
och gå vidare*, som John Goodman i *The Big Lebowski*). Har det gått dåligt har han sex andra sätt att verka upptagen,
och de lottas med tidningen (samma grupp `lasa`, klippen `raknar`, `tomKopp`, `slocknad`, `putsa`, `vissla` och
`naglar` i [public/rum-hasse-3d.js](public/rum-hasse-3d.js)). I alla märker han mitt i att man tittar: ögonen kommer
upp på en medan huvudet står kvar, brynen åker upp och leendet han alltid har försvinner (nyckeln `stel`), och han
håller andan en dryg sekund. Sedan låtsas han som ingenting, med eftertryck, som en man som vet att han har rätt också
när han inte har det: hakan upp, brynen ned, en bestämd nick, och leendet tillbaka.

- `raknar`: räknar sina rätt på fingrarna med en nick för varje, ett, två, tre; lillfingret tvekar och fälls ned igen.
  Ertappad med tre fingrar i luften knyter han handen och slår näven i disken.
- `tomKopp`: dricker ur en tom kopp, lutar den mer och mer och skakar ur de sista dropparna, och tittar ned i den.
  Ertappad över koppen tar han en klunk som inte finns, *ah*, och ställer ned den med en smäll.
- `slocknad`: cigarren har slocknat (ingen glöd och ingen rök, `ute`). Han drar, tittar misstänksamt på den, drar
  hårdare och blåser på glöden. Ertappad med läpparna i ett o drar han ett nöjt bloss och blåser ut rök som inte finns.
- `putsa`: andas på läsglasögonen, putsar dem mot skjortan i små cirklar (`gnid`, läget `putsa` i `GL`) och håller upp
  dem mot ljuset (`kika`). Ertappad sätter han på sig dem med en knyck, tittar strängt på en genom dem och nickar.
- `vissla`: visslar en egen liten slinga upp i taket med pekfingret som knackar i takt (`LAT`). Tonen dör när han ser
  en; sedan visslar han vidare längs baren, gladare än förut.
- `naglar`: synar naglarna, blåser på dem och putsar dem mot kavajen. Ertappad blir handen ett pekfinger mot en, två
  stötar: har jag fel?

Har man just kommit håller han redan på, strax före det man ertappar honom med (`fram` i `KLIPP`, `lasNu` i
[public/rum-hasse.js](public/rum-hasse.js)). Visslingen och andetagen räknas fram med Web Audio som de andra ljuden
(`vissla` och `anda` i [public/rum-hasse-ljud.js](public/rum-hasse-ljud.js), `ljud` i `KLIPP`) och hörs bara med ljudet
på.

Går hans röst inte att få säger han det och visar analysen i skrift. Allt han säger runt omkring är
färdiga rader, utan AI, i [public/rum-hasse-repliker.js](public/rum-hasse-repliker.js). Står man kvar säger han något då och då:
över matchlistan (`ledig`), över listan med gänget (`domar.ledig`) och när man inte svarar på hans fråga (`valVanta`). Raderna
lottas när de sägs (`vantar` i rum-hasse.js), så att han inte upprepar sig förrän alla har varit med. `npm run repliker`
([scripts/hasse/kolla-repliker.js](scripts/hasse/kolla-repliker.js)) kontrollerar filen, och GitHub kör den
när filen ändras (ett kryss på ändringen, publiceringen stoppas inte): uttryck som redan har underkänts,
avhuggna meningar på ett eller två ord, rader om kupongen som börjar med ett Det som låter som resultatet,
fält som inte går att fylla, listor som blivit strängar, rader under en vald match som inte får plats på en rad
(högst 31 tecken) och att rösten får samma meningar som sidan. Vad
som är bra svenska kan koden inte avgöra, så de underkända uttrycken läggs till där när det händer. Med minskad
rörelse i systemet står allt direkt, utan gester.

Replikerna går att använda till annat: `RumHasse.repliker(lista, { i, sen, direkt })`, där varje
replik är `{ text, gest?, vid?, ny?, skrift? }` och gesten ett namn i `RumHasse.gester`, ett klipp på
figurens tidslinje. Munnen följer texten också under gesterna (fjärde argumentet till `rita`).

**Din kupong.** Han fyller i din kupong åt dig
([public/rum-hasse-kupong.js](public/rum-hasse-kupong.js)). När du har valt en match står 1, X och 2 stort,
i kupongens tryck och med samma kryss som på kupongen, och du kan välja direkt eller trycka på *Jag är idel öra*
först för att höra analysen. Väljer du ett tecken säger han *Ge hit kupongen* och får den: det är samma kupong som på
pulten, ritad av samma kod (`Rum.kupong`, `couponHtml` i [public/rum.js](public/rum.js)) med samma kryss,
slitage, stämpel, namn och fält, och det han skriver hamnar i samma utkast (`Samtal.pult.tippa`).

Han tar aldrig kupongen själv. Har du inget på raden när han har sagt sitt föreslår han att fylla i det han just har
sagt (*Så ska det stå på din kupong. Ska jag fylla i den?*, `fyller.foreslar` i
[public/rum-hasse-repliker.js](public/rum-hasse-repliker.js)): hans tecken lyser i guld i rutorna 1 X 2, som domen och
som hans tecken i listan, och under dem står *Fyll i den* i terrakotta där *Titta igen* annars står, med *Alla
matcher* bredvid. *Fyll i den* och han tar kupongen och kryssar sina tecken (`sjalv` i rum-hasse-kupong.js); ett eget
tecken i rutorna och han kryssar ditt; *Alla matcher* och kupongen ligger orörd. När förslaget är besvarat står *Titta
igen* där igen. Guldet står kvar i rutorna också när du kommer tillbaka till matchen, så att man ser vad han sa
bredvid det man själv har kryssat. Har kupongen redan något på raden när du har sagt vem du är säger han vad han
tycker om det i stället. Väljer du ett annat tecken medan han kryssar sina skriver han ditt i stället. Står det redan ett kryss i rutan du väljer suddar han det. Väljer du
något han inte har sagt säger han emot (*Jag håller inte med, men det är din kupong.*) men kryssar det ändå, och väljer
du hans tecken håller han med. Rutorna står också under en match du redan har frågat om, under det han sa då, så att
du kan fylla i den eller byta tecken utan att höra analysen igen; det han säger om kupongen står då på raden där han
erbjöd sig att titta igen (i telefonen sist i texten, så att allt ryms). Vet kupongen inte vem du är frågar han först
*Vems kupong ska jag fylla i?*, med efternamnen på dem som inte har lämnat in i rutornas ställe, och den du väljer blir
den du är, som när du väljer namn på kupongen (`Samtal.pult.vem`). Han fyller i kupongen medan den går att fylla i, och ändrar den när du har lämnat
in, tills matcherna startar (`Samtal.pult.state().andra`). Visas allas tips utan att du har lämnat in ser samtalet
ut som förut, med *Jag gissar*.

*Din inlämnade kupong.* Där skriver han bara det du väljer, och efter en analys föreslår han inget: alla rader har
redan tecken, så han säger vad han tycker om dem. Ändringen lämnas
in direkt (`Samtal.pult.lamnaIn`) när kupongen följer gängets regel (`regel` i [config/kupong.js](config/kupong.js),
4 spikar, 5 halvgarderingar och 4 helgarderingar) och alla matcher har tecken. Följer den inte regeln säger han vad som
är för många och vad som fattas (*Nu har du för många halvgarderingar. Helgardera en av de andra, så lämnar jag in
den.*) och väntar, och när den går ihop igen säger han det och lämnar in den. En helgardering som blir 1X behöver
alltså en halvgardering som blir helgardering någon annanstans; vilken är upp till dig. Det som väntar sparas på
enheten (`profeterna.hasse.andring`, med det inlämnade som grund: ändras det någon annanstans gäller det inte längre)
och står också på kupongen när du tar den ur högen vid pulten, med *Ångra* och *Lämna in ändringen* tända. *Ångra*
eller en inlämning där tar bort det. Går inlämningen inte igenom säger han till (*Den gick inte igenom. Lämna in den
vid pulten sedan.*), och ändringen står kvar.

Kupongen kommer upp underifrån så stor att den går att läsa, står en stund och glider in under hans händer på disken. Den
är ett plan i figurens värld: på disken med rätt perspektiv, mellan disken och figurens duk så att händerna ligger
ovanpå den, och på vägen dit ett plan som rör sig genom luften. Varje läge räknas genom figurens kamera om till en
`matrix3d`, och mellanbilderna är färdiga, så att grafikprocessen spelar upp dem själv. Han tar pennan som ligger på
den (klippen `skriv1`–`skriv3`, ett per antal kryss, i [public/rum-hasse-3d.js](public/rum-hasse-3d.js)), den
vänstra handen drar sig undan till kupongens övre hörn, och han tittar ned och sedan upp på en med höjda bryn medan han
skriver, för det är så självklart att han inte behöver titta. Det är pennan som styr, som med cigarren: spetsens väg räknas fram i
kupongens mått, handen ur greppet och armen ur handen, och bläcket följer spetsen bild för bild (`steg`). Pennan hörs
(`skrap`, om ljudet är på). Hans kryss är större än dina och går ut över rutans kanter (`slarv` i rum.js), och de ser
likadana ut på pulten efteråt; vilka kryss som är hans minns enheten (`profeterna.hasse.kryss`), och kryssar du om
det själv är det ditt. På papperet under Kupong är de vanliga kryss.

Första gången under ett besök visar han upp kupongen när han har skrivit, så att man ser vad det blev (ett klick lägger
tillbaka den), och sedan ligger den kvar på disken medan du går vidare.
Ett klick på kupongen och du har den i handen, och ett klick till och den är borta. I listan står det du har på raden för hand, i en egen spalt längst ut, efter tecknen han har sagt. Med minskad rörelse står allt
direkt. På disken är kupongen hopklämd av perspektivet, som notan, och det är därför man får se den stor.

**Armarna och händerna.** Ärmen har fotots bredd på överarmen, där den möter kavajen där armarna satt,
och smalnar sedan av från armbågen mot ärmslutet som en kavajärm (`BREDD` i
[public/rum-hasse-arm.js](public/rum-hasse-arm.js)). Armbågen är en tät böj: på insidan trycks tyget
ihop och lägger sig i veck som skuggar sig själva, och överarmens och underarmens tyg stannar var på sin
sida om armbågens mittplan, så att inget går igenom det andra; normalerna räknas ur formen, så att vecken
syns i ljuset. Mot ärmslutet blir ärmen platt som handleden, med handflatan åt den platta sidan, och
genom ärmslutet syns den mörka insidan. Skjortans manschett går in i ärmen och sticker fram ungefär en
centimeter, platt som handleden och med en söm nära kanten. Händerna är ungefär 16 cm (`HAND` i
rum-hasse-arm.js; greppen om cigarren och koppen räknas med samma skala), så att de ser lagom ut
bredvid ansiktet och koppen i bilden, med fingrar som är lite bredare än tjocka. Huden tar porerna,
vecken och ådrorna ur fotot men tonen från ansiktet: fotots händer låg i skugga och var rödare, och dess
hud är sammansatt av bitar med mörka fläckar, som annars blev streck tvärs över fingrarna. Den är lite
varm och rödare vid knogarna, som ansiktet, och matt som fotots hud: bara naglarna glänser. Skuggan
mellan fingrarna är varm som hud i skugga, och naglarna ligger nära hudens ton med en ljusare kant
ytterst. I vilan ligger fingertopparna på disken i stället för att gå ned i den, och under händerna
ligger en tät skugga där de vilar mot disken, som försvinner när han lyfter dem. Sedan var händerna 18
cm, blekare än ansiktet och blanka som plast på knogarna, och de såg ut att sväva över disken (ändrat
2026-11-08). Munnen inifrån har en tand i taget (framtänderna bredast), tandkött när han skrattar stort
och de nedre tändernas kant när munnen är vidöppen, och när han pratar skiljs läpparna åt och öppnas upp
till en dryg centimeter. Förut hade underarmen överarmens bredd nästan ända ut, armbågen blev en ballong
när armen böjdes, händerna var 15 cm och orangea, manschetten var ett tre centimeter långt vitt rör,
tänderna ett band med streck och munnen öppnades knappt en halv centimeter när han pratade (ändrat
2026-11-06). Skuggorna på disken tonar ut mot figurens dukkant, och duken rymmer handen vid koppens
öra, som förut skars av där.

**Rösten.** Analysen är densamma som i matchbladet, skriven i förväg (se [Analyserna](#analyserna)):
direkt efter artikeln och tipset säger Claude det viktigaste ur dem med hans röst, utan verktyg
([src/analyser/hasse.mjs](src/analyser/hasse.mjs)). Sakuppgifterna tas ur analysen men inte den
påhittade tränarens uttryck och historier. Högst 120 ord
som tipsets analys. Personan står i [prompts/hasse-backe.md](prompts/hasse-backe.md) och
frasbanken i [config/hasse.js](config/hasse.js): två uttryck lottas per match, så att analyserna
inte låter likadant, ibland en krydda (färdiga rader, så att ingen historia hittas på om en
riktig person), och han tar dem där de passar. Bielsa-orden lottas bara när analysen visar att
ett lag pressar högt eller har ett rörligt anfallsspel. Ändras
personan eller frasbanken byts `promptVersion`, så att texterna skrivs om.

**Tecknen och resultatet bestämmer han själv** (2026-11-07). Han får spelbolagens odds, sajtens
prognos och kollegans tecken (`oddsen` i [src/analyser/hasse.mjs](src/analyser/hasse.mjs)) och
svarar med `tecken` och `resultat` bredvid styckena. Personan säger åt honom att inte gardera för
säkerhets skull, att säga det resultat han tror på (3–0, 2–2) i stället för det försiktigaste, och
att gå emot oddsen och tipset när analysen ger honom ett skäl, men aldrig hitta på ett skäl för
att vara annorlunda. Kollegan nämner han inte, och inte heller vilken dag matchen spelas. Det som
står stort, i rutorna och på matchens rad är hans tecken (`hasse.tecken`); tipset under artikeln i
Inför är kollegans och ändras inte. Äldre texter utan egna tecken visar tipsets. Provet på
omgången 2026-11-07: 13 ensamma tecken, emot spelbolagens favorit i fyra matcher (Burnley borta
mot Cardiff som saknar fyra mittbackar, kryss mot West Ham, Middlesbrough och West Brom), och
resultat som 3–0 och 2–2.

**Kontrollerna** (`granska`): inga tal, citat eller namn utanför analysen och oddsen, högst 135
ord, inga källor ("enligt …"), ingen kollega och inget "i morgon", tecknen som "1", "X", "2" och i
ord i sista stycket, resultatet med högst 4 mål per lag (rösten har ljud för 0–0 till 4–4) och inom
tecknen men inte i texten, och inget ur den påhittade tränarens värld.
Klarar svaret inte det får Claude skriva om en gång, och annars visas analysen som den är. Koden ser
inte om en mening ändrar betydelse utan att ett tal ändras. Texten ligger i analysens post i
`data/analyser.json`.

**Språket** (`sprakfel`): när texten har klarat kontrollerna läser en korrekturläsare utan personan
(`sprak` i [config/hasse.js](config/hasse.js)) den mening för mening och pekar ut direktöversättningar
och sådant som inte går att förstå utan analysen, och då får han skriva om. Hans egna uttryck ur
frasbanken ska stå kvar. Språket fäller aldrig en text: går granskningen inte att få, eller blir
omskrivningen sämre, är det den senaste godkända texten som gäller. Läsaren missar ibland något och
klagar ibland i onödan, så det minskar felen men garanterar inget.

Första versionen skrev om hela analysen, och koden krävde att varje tal stod kvar och att de
lottade fraserna användes. Då blev det 350 ord med artikeln återberättad, "enligt Sky Sports" i
munnen och fraser där de inte hörde hemma (2026-11-03: "formulerar sig ytterst märkligt"). Nu är
kraven borta, uttrycken frivilliga och prompten 1 600 tecken i stället för 2 550 (tipsets är
1 400). Prov på sex analyser: 112–127 ord, och i en av dem en tillagd rad om högpress för att
prova Bielsa-utbrottet.

**Ljudet.** Det han säger hörs, när besökaren har slagit på ljudet. Rösten är Tomas egen,
klonad med Chatterbox Multilingual på iMacen (se *Den egna rösten* nedan). Hasse Backe är en
påhittad figur i en verklig persons anda, och rösten är Tomas, inte en kopia av den verklige
Hasse Backes. Där den egna rösten ännu saknas tar bygget fram ljudet med Azures talsyntes på den
fria nivån (F0: 500 000 tecken i månaden; när de är slut stryps tjänsten, och den debiterar
aldrig), med den svenska mansrösten Mattias lite långsammare och mörkare än vanligt (`rost` i
[config/hasse.js](config/hasse.js)). Han säger två slags saker ([src/rost.js](src/rost.js)): de färdiga
replikerna i [public/rum-hasse-repliker.js](public/rum-hasse-repliker.js) med fälten ifyllda på
alla sätt som sidan kan fylla dem (gängets efternamn, dagarna, tecknen i ord och resultaten 0–0
till 4–4 – 183 repliker, 6 000 tecken), och sin text till varje analys, mening för mening, delad som sidan delar den
([public/rum-hasse-meningar.js](public/rum-hasse-meningar.js)). En omgång med tretton matcher är
ungefär 10 000 tecken.

Azures ljud tas fram en gång per mening och sparas i källcachen, `data/cache/rost/<avtryck>.mp3`, där
avtrycket räknas på rösten, takten, tonen och meningen (ändras något av dem tas allt fram på
nytt). Kommande matcher först, sedan replikerna; högst 80 anrop per bygge och ett var 3,2 s,
eftersom den fria nivån tar 20 anrop i minuten. Första gången tar replikerna alltså ett par
byggen, och en ny omgångs text kommer i bygget efter att iMacen har pushat den. Bygget lägger det
som finns i `_site/data/rost/` med registret `data/rost.json` (mening → fil), och ljud som inte har
använts på 30 dagar tas bort ur cachen. Inget av det committas, så repot växer inte (allt ljud
till en omgång är 3–4 MB). Utan nyckeln, eller när Azure inte svarar, blir han tyst där ljudet
saknas, och bygget går som förut. Meningar som redan har egen röst frågas Azure aldrig om, så
den fria kvoten räcker längre. Bygget skriver hur många meningar som har ljud och hur många av
dem med egen röst.

**Den egna rösten** ([scripts/rost/](scripts/rost/)). Launchd-jobbet `se.matchfixarna.rost`
på iMacen körs var 15:e minut (launchd kör det aldrig två gånger samtidigt) i en egen klon som
återställs till origin/main varje gång, som analysernas jobb. Det tar listan över allt han
säger ur `texter()` i [src/rost.js](src/rost.js), kommande matchers meningar först och sedan
replikerna (ca 350 meningar), och läser upp högst 30 som saknas per körning med
[chatterbox_jobb.py](scripts/rost/chatterbox_jobb.py), som laddar modellen en gång (ca 30 s) och räknar
ungefär 5 s per sekund tal. Inställningarna står i `rost.egen` i
[config/hasse.js](config/hasse.js): exaggeration 0,7, cfg_weight 0,5, temperature 0,8 och
referensen `~/Kod/chatterbox-rost/min_rost.wav`. Talen läses som ord ("2–1" blir "två–ett", 0
"noll"), eftersom det är oprövat hur Chatterbox läser siffror; meningen i registret är densamma
som på sidan.

Chatterbox avbryter ibland själv med "forcing EOS token", och ibland blir talet för kort eller
för långt. Därför mäts talet utan tystnad mot den väntade längden (14 tecken i sekunden): under
0,55 eller över 2,2 gånger den, eller med "forcing EOS" av någon annan orsak än
`token_repetition`, görs meningen om med nytt slumpfrö, högst fyra gånger. `token_repetition`
räknas inte: den slog till i 3 av 4 uppläsningar i provet, redan när samma ljudtoken kom två
gånger, och Tomas lyssnade på de klippen 2026-11-05 och slutet var helt. Klarar den sig inte prövas den igen efter ett dygn, och
till dess är det Azures röst. Ljudet sparas som mp3 (64 kbit/s, ffmpeg) i en ljudbank utanför
repot, `~/Library/Application Support/Matchfixarna/Rost/ljud/`, med ett avtryck på
inställningarna, referensen och texten: ändras något av dem läses allt upp på nytt.

Efter varje körning byggs grenen `rost` med git:s egna verktyg: en enda commit utan förälder,
med registret `rost.json` (mening → avtryck) och de mp3-filer som behövs nu. Den force-pushas
bara när innehållet har ändrats, så git-historiken växer inte, varken på main eller i grenen.
Loggen är `~/Library/Logs/Matchfixarna/rost.log`, och Chatterbox egen utskrift från senaste
körningen står i `rost-chatterbox.log` bredvid.

**Sätt upp den egna rösten** på iMacen (Chatterbox ska redan fungera i `~/Kod/chatterbox-rost`):

1. `bash scripts/rost/installera.sh` i repot. Den klonar repot till
   `~/Library/Application Support/Matchfixarna/Rost/Profeterna`, skriver jobbets fil i
   `~/Library/LaunchAgents` och säger till om Python-miljön, referensen eller ffmpeg saknas.
2. Starta jobbet med `launchctl bootstrap` som skriptet skriver ut. Första körningen börjar
   direkt.
3. Följ `rost.log`. Efter första körningen finns grenen `rost` på GitHub, och nästa bygge tar
   med ljudet.

Stoppa med `launchctl bootout gui/$(id -u)/se.matchfixarna.rost`; grenen ligger kvar, och
bygget fortsätter att ta ljudet ur den. Ta bort grenen på GitHub för att gå tillbaka helt till
Azure.

I sidan spelas ljudet med Web Audio ([public/rum-hasse.js](public/rum-hasse.js), *rösten*). Det
hämtas medan han gör annat – hans text när den står, om ljudet är på – och orden kommer i takt med
ljudet, utspridda efter sin längd, medan munnen följer ljudstyrkan. Saknas meningen i registret
eller är ljudet inte framme inom 2,5 s säger han den tyst, som förut, och när han läser upp sin text
hoppar han över den. Ett klick i samtalet visar hela repliken och tystar den, *Ja, ja* tystar
uppläsningen, och han tystnar när man går därifrån. Hans text läses bara upp när man trycker på *Läs
upp* (se *Samtalet*); de korta replikerna runt omkring hörs när ljudet är på. Ljudet är av tills besökaren trycker på
*Ljud på* längst ned till vänster, med samma små versaler som *Matchbladet →*, eller på *Läs upp*; klicket väcker
ljudet i webbläsaren, och valet minns enheten. Sedan heter knappen *Ljud av*. Med minskad
rörelse står allt direkt och inget hörs utom det man ber honom läsa upp. *Jag har tappat rösten* sägs tyst.

När ljudet är på hörs också det som händer på disken
([public/rum-hasse-ljud.js](public/rum-hasse-ljud.js), hämtas när ljudet slås på): handen i
disken, och koppen som klirrar på fatet. Figuren säger när det händer (`handelser` i
rum-hasse-3d.js: slagen, när koppen landar efter dem och när han ställer ned den), och ljudet
räknas fram med Web Audio, utan ljudfiler och lite olika varje gång. Slaget är en dov duns som
sjunker, träets knack, handflatans smäll (näven nästan ingen, båda händerna två strax efter
varandra) och skivan som klingar kort, och allt på disken skramlar till. Klirret är porslin mot
porslin, några deltoner som inte är övertoner och där de höga klingar av fortast; koppens fot slår
oftast två gånger. Allt går genom en mjuk begränsare, så att ett hårt slag inte spräcker ljudet, och
slaget är ungefär lika starkt som rösten. Slaget hörs från hans högra hand till vänster i bilden och
koppen från höger.

**Slå på rösten** (ett gratis konto hos Microsoft Azure; kortet som Azure frågar efter när kontot
skapas debiteras inte på F0):

1. Skapa en resurs av typen *Speech* (Azure AI services) med prisnivån **Free F0** i regionen
   Sweden Central. Väljs en annan region: lägg den som variabeln `AZURE_SPEECH_REGION` under
   *Settings → Secrets and variables → Actions → Variables* (t.ex. `westeurope`).
2. Kopiera *KEY 1* under *Keys and Endpoint*.
3. Lägg den som hemligheten `AZURE_SPEECH_KEY` under *Settings → Secrets and variables →
   Actions → Secrets* i repot på GitHub (eller `gh secret set AZURE_SPEECH_KEY`).
4. Kör workflowen *Hämta data och publicera* (eller vänta på nästa körning). Loggen säger hur
   många meningar som har ljud.

Provat: [src/rost.js](src/rost.js) i Node med låtsad Azure (ordningen, taket per bygge, stopp vid
429, registret och städningen av cachen); sidan i headless Chrome 1440 × 900 med låtsat tal i
cachen (en tonstöt per ord, mp3) publicerat med `publicera()` som i bygget: replikerna och
analysen hördes mening för mening med orden i takt, och *Ljud av* mitt i en mening och ett tomt
register fungerade utan fel i sidan. Inte provat mot Azure på riktigt (ingen nyckel där provet
gjordes), och inte i Safari eller en riktig telefon.

Den egna rösten provades 2026-11-04 utan Chatterbox: [las.mjs](scripts/rost/las.mjs) med låtsad
modell (`--latsas`, tonstötar) mot en låtsad GitHub (ett lokalt repo), som läste upp fem
meningar och pushade grenen `rost`, inte pushade igen när inget hade ändrats och inte
markerade något som misslyckat när modellen kraschade; [chatterbox_jobb.py](scripts/rost/chatterbox_jobb.py)
med låtsad modell, som gjorde om en mening efter "forcing EOS" och gav upp en för kort efter
fyra försök; workflowens steg mot den låtsade grenen; och `npm run build -- --no-fetch`, som
tog de fem egna och Azure för resten, och där `fyll()` inte frågade Azure om de egna.

Med den riktiga modellen provades den 2026-11-05 på iMacen: [las.mjs](scripts/rost/las.mjs) utan
`--publicera` läste upp fyra meningar på 145 s, alla i första försöket. Det provet visade också
varför skriptet inte får heta `chatterbox.py` (det skuggar paketet med samma namn), vilket den
låtsade modellen inte kunde visa.

**Grafiken.** Handen på pulten är en liten WebGL-duk i pultens plan som läggs dit när rummet är
klart, med handens modell (228 kB, 150 kB packad) och fotot (149 kB). Den ritas en gång och sedan bara när fingrarna
trummar, och den behåller sin bild (`preserveDrawingBuffer`), så att den inte är tom om duken låg
utanför bilden när den ritades (i telefonen på höjden och i smala fönster). Resten hämtas först när
någon pekar på kaffet eller klickar: bilden av väggen (61 kB, 33 kB på höjden; på natten 38 och 24 kB), på dagen också fönsterljuset på den (40 kB, 23 kB på höjden) och figuren. Disken
ritas en gång med figurens grafik när han öppnas, och sedan när fönstret har slutat ändras; kameran
väntar högst 1,5 s på den. Figurens duk är bara så stor som han och det han gör, och den ritas efter
rummets steg (`Rum.kval`, se [När datorn inte hinner med](#när-datorn-inte-hinner-med)): högst täthet
2, 1,5, 1,25 och 1, och när han bara sitter och andas 30, 30, 20 och 15 bilder i sekunden. På de två
lägsta stegen och i telefonen utan kantutjämning. Figuren lämnas tillbaka 90 s efter att man har gått
(20 s i telefonen).

Medan han syns ritas rummet inte, så det enda som ritas om är figurens duk. Mätt i headless Chrome
med mjukvarugrafik (som en svag grafikkrets), 1440 × 900, med det steg rummet själv väljer där (3):
19–26 bilder i sekunden medan han syns (9 de första sekunderna), mot 7–12 när rummets hörn låg i bild
bredvid honom. Maskinen var långsam och siffrorna spretar mellan körningar, så de är bara en
jämförelse; inte mätt på en riktig telefon eller i Safari.

Kostymfotot (C More Entertainment, CC BY 3.0, Wikimedia Commons, bearbetat; krediten står sist under
Källor) ligger utan armar på en formad yta, så att huvudet vrids runt nacken och kroppen lutar sig
fram. Ögon, bryn och mun rör sig i skuggaren: locken blinkar utan att ögat tänjs, munnen öppnas med
tänder och tunga, och hakan följer med ([public/rum-hasse-3d.js](public/rum-hasse-3d.js)). Ärmarna är
kavajen ur fotot ([public/rum-hasse-arm.js](public/rum-hasse-arm.js)): fotots armar, uträtade till en
remsa i atlasen, ligger på böjbara rör, så att tyget och färgen är desamma som på
kroppen. Händerna är en modell med 16 ben ([scripts/hasse/hand.mjs](scripts/hasse/hand.mjs)) med
huden ur fotot, naglar och leder (se *Armarna och händerna*). Armar, kropp, händer och kopp har samma ljus. Väggen bakom honom
är en färdig bild, spårad en gång med riktigt ljus ([scripts/hasse/bak.html](scripts/hasse/bak.html)).
Skuggorna på disken är räknade kapslar, utan skuggkarta (också askkoppens och cigarrens). Askkoppen,
cigarren och röken är tre ritanrop och ungefär 3 700 trianglar till. Klippen står i `KLIPP` (se
*Rörelserna*). `?rum-hasse` öppnar honom direkt.

Provat i headless Chrome med mjukvarugrafik (2026-11-04): hans bild i 2000 × 1080, 1440 × 900 och som
telefon 412 × 915, på rummets steg 0 (med kornet) och 3, panoreringen frusen på sex ställen på vägen
(1440 × 900 och 2000 × 1080), minskad rörelse, och figuren ensam med väggen och disken i vilan, skrattet,
slaget, fingret, armen ut, klunken och cigarren (vid munnen, utblåsningen och när han tittar på den).
Väggen är bakad med mjukvarugrafik (200 varv). Att väggen och disken passar honom i andra fönster är
uträknat för storlekarna från 844 × 390 till 3440 × 1440 (`BAK` i rum-hasse-scen.js), inte provat i
bild. Inte provat i Safari eller på en riktig telefon, inte med ändrat fönster medan han syns, och
typsnitten på notan (Caveat) kom inte fram i provet, så den ritades med reservtypsnittet.

Cigarren (2026-11-04) är provad med figuren ensam i headless Chrome (mjukvarugrafik), 1440 × 900 och
412 × 915: vilan, hela klippet bild för bild och i följd, närbilder av munnen och utblåsningen, och
cigarrens, handens och armbågens förflyttning mellan varje hundradels sekund (inga hopp). Inte provad i
hela sidan, i Safari eller i en riktig telefon, och turerna i samtalet (när han tar den, `skynda`) är
bara genomlästa.

Cigarrens elva sätt (2026-11-05) är provade med figuren ensam i headless Chrome (mjukvarugrafik),
900 × 700: varje klipp bild för bild var 0,6 s, närbilder av handen, ögonen och röken, och när handen
släpper cigarren i mungipan och tar den igen; slaget, gesterna och klunken ser ut som förut. I hela
sidan (1440 × 900) finns alla elva i lotten, och `tand` och `ringar` spelades utan fel. Inte provade i
Safari eller i en riktig telefon.

Elden (2026-11-10) är provad i headless Chrome (Metal) med provserver mot sajten: varje klipp bild för bild,
närbilder av handen, stickan, tändaren och lågan, i dag- och nattljus och i 390 × 844; armbågens förflyttning
mellan varje tjugondels sekund (inga hopp utom korta när han lyfter handen), och avståndet mellan underarmen och
stället i alla klipp (som minst 108 enheter i de gamla, när han knackar av askan). Logiken i
en levande sida: släckt cigarr, vanan, tändaren, och tänd efteråt utan att en sticka gick åt. Ljuden är
räknade fram utan fel (OfflineAudioContext), men ingen har lyssnat på dem. Inte provad i Safari eller i en
riktig telefon.

Slagen, kaffet, cigarren och ljuden (2026-11-05) är provade i headless Chrome med mjukvarugrafik: figuren
ensam i 1440 × 900 och 412 × 915, varje klipp bild för bild och de med rök och ånga i följd, och
klippen före ombyggnaden jämförda bild för bild med klippen efter (lika, utom slaget i originalet, som
nu går allt fortare mot disken, och koppens studs). Hela sidan (byggd utan att hämta något, så utan
kupong) med `?rum-hasse` och ljudet på: slagen, `dunka` medan han står som när han pratar, och
kaffet, spelade som repliker med gester, där bilden ryckte till vid varje slag och slagen och klirret
spelades. Ljuden är framräknade i en `OfflineAudioContext` och mätta (toppar 0,44–0,55 för slagen,
0,24 för klirret), men inte lyssnade på, och inte provade i Safari eller på en riktig telefon.
Samtalet med en riktig analys är inte provat (ingen kupong i provet), bara genomläst.

Armarna, händerna och munnen (2026-11-06) är provade i headless Chrome med mjukvarugrafik, i hela sidan med
`?rum-hasse` (byggd utan att hämta något, så utan kupong) och figuren frusen på tidslinjen: alla 34
klipp i sex bilder vardera i 1440 × 900 och jämförda med bilderna före ändringen, närbilder av
armbågarna (skrattet, fingret, klunken), händerna i vilan, vid koppen och med cigarren, manschetterna,
munnen i skrattet och åtta bilder i följd medan han pratar, och telefonen på höjden (412 × 915) mot
samma bilder före. Handen på pulten i rummet är provad i 1440 × 900. Inte provat i Safari eller på en
riktig telefon. Lagt ovanpå main 2026-11-07, där greppen om koppen och pennan hade ändrats under
tiden: de räknas nu i den större handens skala, handen går upp och över koppen till örat, och handen på
pulten ligger 20 bildpunkter till vänster om mains nya läge. Provat i headless Chrome mot main bild för
bild: vilan, talet, slaget, gesterna, klunken (tätt när handen tar och ställer koppen), cigarren och
pennan i 1440 × 900, vilan, klunken och talet i telefonen (412 × 915), och handen på pulten i rummet.

Samma pult och samma armar (2026-11-08) är provade i headless Chromium med mjukvarugrafik, i hela sidan med
`?rum-kval=0` (rummets fulla steg, som på en Mac): rummet och hans bild i 1440 × 900 med täthet 1 och 2, och
telefonen på höjden (390 × 844). Färgerna är mätta i bilderna: pulten i rummet längst bak 24° nyans, 25 % mättnad
och 37 % ljushet, och disken framför honom 24–25°, 30 % och 36 %; ärmens tyg på skärmen i rummet (54, 50, 47)
mot i baren (59, 53, 48), och huden (211, 154, 126) mot (219, 153, 124). Kamerahöjden valdes bland fyra renderade varianter (ögat 31, 39, 45 och 54 cm över
hans), och väggbildens täckning är räknad för fönster från 844 × 390 till 3440 × 1440 och på höjden från 360 × 780
till 1000 × 1000 (minst 11 bildpunkter till godo). Inte provat i Safari eller på en riktig telefon.

Kaffet på sex sätt (2026-11-05) är provat i headless Chromium med mjukvarugrafik, figuren ensam i
1440 × 900 och 412 × 915: varje klipp bild för bild, ångan i följd (med förstärkt ånga, för att se att
den sugs mot näsan), och koppens och handens förflyttning mellan varje hundradels sekund (inga hopp,
och båda exakt tillbaka i vilan när klippet slutar). Inte provat i hela sidan, i Safari eller i en
riktig telefon, och att han tar kaffet varannan gång medan man väljer är bara genomläst.

Förslaget att fylla i kupongen (2026-11-07) är provat i headless Chromium med mjukvarugrafik i hela sidan, med en
påhittad omgång från kupongtjänsten och tre matcher i `data/matches.json` (bygget i provet kunde inte hämta något),
i 1440 × 900 och 412 × 915, med och utan minskad rörelse: frågan och guldet efter analysen (också efter *Ja, ja*),
att kupongen ligger orörd fem sekunder efteråt, *Fyll i den* med och utan att kupongen vet vem man är, ett eget
tecken mot hans och guldet när man kommer tillbaka till matchen. Inte provat i Safari eller i en riktig telefon,
och de nya raderna har Tomas röst först när iMacen har läst upp dem (till dess Azures).

### Sammanställningen efter omgången

När alla matcher i omgången är spelade ligger bara Hasse Backes protokoll på pulten, i kupongens ställe, tills
nästa kupong kommer måndagen efter kl. 16 ([public/rum-block.js](public/rum-block.js), [public/rum-block.css](public/rum-block.css)): en blankett ur
samma tryckeri som kupongen – samma papper, bandet i terrakotta (*Protokoll*, med kupongens nummer), synkmarkeringarna i
vänsterkanten, tryckta linjer, varannan rad tonad hela vägen över och tryckeriets rad längs högerkanten. Omgångens namn står för hand på
en tryckt rad under bandet. Raderna har resultat och facit på skrivmaskin, och spalterna är kupongen (gängets tre
ansikten), var och en i gänget och Hasse, med porträtten uppklistrade som foton. Allas tecken står kvar i var och ens
bläck, så att man ser vad var och en spelade, och det som satt är överstruket med grön märkpenna. Handstilen och
märkpennans drag är lite olika i varje ruta, men samma omgång ser likadan ut varje gång (slumpen utgår från omgången,
raden och spalten). Överst, direkt under porträtten, står *Rätt av 13* stort: det ska synas också på håll, när bladet ligger
på pulten, och där är det bladets nederkant som hamnar utanför bilden (bladet ligger i skala 0,76 på pulten). Kupongen är allas,
och dess rätt är omgångens betyg, skrivet som kupongens betyg på papperet under Kupong (*10/13* med Hasses röda rättningspenna,
inringat och lite snett, `betygRing` i rum-block.js som `ring` i papper.js). Det sticker ut åt vänster, in i den tomma delen av
raden, och är det enda röda på raden: var och ens rätt står i det egna bläcket. Sist står poängen. Vinnaren är inringad, både på
porträttet och runt poängen; utöver betyget är det de enda ringarna på blocket. Hasse har rättat det och skrivit under, och mer står inte där:
domarna över gänget säger han i baren (se [Hasse Backe](#hasse-backe), *Domarna efter omgången*). Förut stod en dom per
person längst ner (ändrat 2026-11-08). I telefonen försvinner namnen under porträtten. Har Hasse ingen kupong i omgången
(han tävlar från omgången efter 2026-11-07) står det han sa vid disken i hans spalt, utanför tävlingen
(`Tippoang.hasseSagt`, samma regel som hans kupong: det ska vara skrivet före avspark).

Ett klick på blocket eller K lyfter det från pulten och lägger fram det stort över rummet, och *Lägg tillbaka*, Esc eller ett
klick utanför lägger tillbaka det (`protokollet` i rum.js).

**Hasse om poängen** (2026-11-09, användarens önskemål). Under bladet står *Hasse, hur räknas poängen?*: ett klick eller H,
så lutar han sig in från baren och svarar som vid anslagstavlan (*Ropa till Hasse* under [Anslagstavlan](#anslagstavlan);
delarna, talet och hans plats i [public/rum-hasse-svar.js](public/rum-hasse-svar.js)). Han säger att antalet rätt inte säger
hur svårt det var, hur poängen räknas (samma regel som i [public/tippoang.js](public/tippoang.js), se
[Omgångens tippare](#omgångens-tippare)), ger ett exempel ur omgången och säger vad han själv gör med det. Exemplet
(`RumBlock.exempel`) handlar bara om gänget, aldrig om honom själv: hade flera lika många rätt men olika poäng fick den mest
som datorn trodde minst på, annars tar han det enskilda tips som gav mest. Svaret står till vänster om bladet, som glider
åt höger så långt som behövs (bubblan upp till 520 px bred när det finns plats, så att svaret ryms ovanför hans huvud),
eller över bladet med knapparna under bubblan när det inte ryms bredvid, i telefonen och i smala fönster (`protHasse` och
`protHassePlats` i rum.js). *Tack, Hasse*, Esc eller ett klick utanför tystar honom, och sedan lägger Esc och ett klick
utanför tillbaka bladet; han tystnar också när bladet läggs tillbaka. Meningarna står under `protokoll` i
[public/rum-hasse-repliker.js](public/rum-hasse-repliker.js) och får hans röst när Macen har läst in dem (till dess säger
han dem tyst); exemplet ändras med omgången och sägs alltid tyst. Ändras poängen ska hans svar följa med.
Provat i headless Chromium i hela sidan (utan 3D-figurerna, och med en påhittad spelad omgång inlagd för hand) i 1440 × 900,
1024 × 768 och 412 × 915, med och utan minskad rörelse: bredvid och över bladet, Tack, Hasse, Esc, H, ett klick utanför och
Lägg tillbaka mitt i svaret. Anslagstavlans svar ser pixel för pixel likadant ut före och efter flytten till
rum-hasse-svar.js. Inte provat i Safari eller i en riktig telefon.

Ett klick på
kvällstidningen på pulten öppnar tidningen om omgången (se [Tidningen](#tidningen)). Gänget håller upp skyltar med sina rätt (`lappar` i rum-3d.js), medan resten av figuren lever som
vanligt. Skyltarna står kvar till måndagen efter omgången kl. 16, också om någon har valt matcher till en ny omgång för hand före det
(`lappar` i rum-block.js läser då den förra omgången, `forra` i GET /samtal), men inte sedan den har börjat. Så länge
lägger ett klick på någon i gänget ner hens skylt på bordet, och ett klick till på hen eller skylten tar upp den igen
(`lappKlick` i rum.js, `lappVand` och `PLATSER[].skylt` i rum-3d.js). Klicket gör inget annat: inget tecken, och man
byter inte vem man är. Läget gäller på enheten för den omgången. Den som somnar eller går iväg lägger ner sin och tar
upp den igen när hen är tillbaka. Modellens siffra står på
videons blå ruta på håll.

**Protokollen på korktavlan** (2026-11-09, användarens önskemål). De färdigspelade kupongerna på korktavlan har var
sitt protokoll: nära tavlan lyfter en kupong när man pekar på den (och lägger sig överst om den ligger under en annan),
och ett klick tar den från nålen – nålen sitter kvar – och lägger fram omgångens protokoll som bladet från pulten.
*Häng tillbaka*, Esc eller ett klick utanför sätter tillbaka den, och kameran står kvar vid tavlan (`korkProtokoll` och
`nalBilder` i rum.js). Med ←/→, pilarna på var sin sida om *Häng tillbaka* eller ett svep i sidled (fingret åt vänster:
omgången efter) bläddrar man mellan säsongens alla protokoll (`korkLista` och `bladdra`): bladet glider ut åt sidan och
nästa in från andra hållet, och en pil syns bara åt det håll där det finns en omgång. Listan är omgångarna i
`data/tippare.json`, så också de äldre än de fyra som hänger på tavlan, och en omgång utan gängets kupong (spalten
Kupong är då tom). Den kupong på tavlan som hör till bladet som är framme är borta från nålen; en omgång som inte hänger
där tonar bara bort när man sätter tillbaka den. Är det omgången vars protokoll ligger på pulten är det samma blad; annars räknas det ur den
frysta omgången i `data/tippare.json` (`RumBlock.fryst`): resultatet efter 90 minuter, modellens chans före avspark och
allas tecken står där, så att bladet går att räkna också när matcherna inte längre finns i spelprogrammet, och poängen
blir desamma som i Olympen. Omgången är den med flest av kupongens matcher, minst hälften (som `roundOf` i
src/history.js); en kupong utan omgång eller med dolda resultat har inget protokoll och går inte att ta ned. Matcherna
står i kupongens ordning när den har dem alla (Stryktipsets), annars efter avsparken. Hasses spalt står bara när
analyserna fortfarande har något han sa om omgångens matcher – `data/analyser.json` har bara den senaste omgången, så
de äldre protokollen har ingen.

**Hur skylten hålls** (2026-11-08, användarens önskemål: "lite olika hålla upp skylt-rörelser så att det inte blir så
enformigt"). Skylten är en bit lite välvd kartong med brun baksida, och den hålls mellan tummen framför och fingrarna
bakom, med handflatan under den. Var och en byter hållning var trettionde sekund, en i taget: så högt armen når, intill
kinden med huvudet på sned, framför ansiktet med ögonen över kanten, med båda händerna framför bröstet, slappt och på sned,
och rakt ut åt sidan (`LAPP_HALL` och `LAPP_MENY` i rum-tecken.js). På sidorna har de aldrig samma hållning samtidigt, och
ordningen är vald så att handen inte går genom huvudet på vägen. Däremellan stöter de upp skylten, viftar, skakar den,
kontrollerar vad det står, har råkat vända den fel eller tröttnar i armen tills de kommer på sig (`LAPP_GOR`). Den som
röker släpper inte cigaretten och håller därför skylten med en hand, utom i mitten, där cigaretten ligger i askkoppen
så länge. Skyltens hörn och kant är genomskinliga i bilden, så att de är mjuka också utan kantutjämning. För bilder:
`?rum-lapp=dl:kinden:kolla@2` (hållningen, vad hen gör och hur långt in).

Allt räknas ur omgångens data och ser likadant ut på alla enheter. Med dolda resultat (Dölj resultat) syns inget av det,
utan stämpeln *Alla inne* ligger kvar. Protokollets texter står i `TEXT` i rum-block.js och tidningens i rum-tidning.js, och
inte i replikfilen, eftersom de inte sägs högt; `npm run repliker` kollar dem mot det som är underkänt.

Kostnad, mätt i Chrome som telefon med processorn ×4: en bild av gänget 5,0 → 5,4 ms och 342 → 382 ritanrop, samma
antal trianglar. Med hållningarna: 327–339 ritanrop med en hand och 355–371 med båda, mot 376–399 i samma mätning
förut, och inte fler trianglar. Blocket och tidningen är platt papper som ritas en gång, och medan de är framme står rummet still.

### Tidningen

Veckans kvällstidning ligger hopvikt på pulten, och ett klick på den lägger fram den över rummet (2026-11-09,
användarens önskemål: "förbättra tidningen otroligt mycket"; förut fanns den bara efter omgången, med betygen, skrällen
och två meningar från Hasse). Den är samma tidning som löpsedeln, Sportbladet eller Expressen, på samma papper, och
överst ligger sedeln själv, förstorad, som framsida (`sedel` i rum-affischer.js kopierar papperet, så att de inte kan
bli olika). Under den står *I tidningen* med
sidorna och deras nummer, och ett klick där rullar fram till sidan. Sidorna ligger under varandra som ark, var och en med
sidnumret ytterst, tidningens namn och datumet (löpsedelns) i huvudet, en avdelning i svart och rubriker i Anton,
brödtext med rak högerkant och avstavning och porträtten rastrerade i svartvitt. I datorn står texten i två spalter och
i telefonen (smalare än 470 bildpunkter) i en. Allt står i [public/rum-tidning.js](public/rum-tidning.js) och
[public/rum-tidning.css](public/rum-tidning.css); rummet samlar ihop det som ska stå där (`upplaga` och `tidningen` i
rum.js).

**På pulten** (2026-11-10, användarens önskemål: "När man zoomade in den här så fick man hela tidningen - så ska det
inte vara"): fram till dess öppnade ett klick på löpsedeln tidningen, och då fanns ingen närbild av sedeln. Nu går ett
klick på löpsedeln bara fram till den, som de andra löpsedlarna, och tidningen ligger till höger om kupongen, bakom
högen med de inlämnade kupongerna, som lägger sig över den (`#rum-kvallstidningen` i rum.js och
[public/rum-tidning.css](public/rum-tidning.css)). Den är vikt på mitten med förstasidan upp: löpsedelns papper, 2,5
gånger så stort, och den övre halvan med namnet, vinjetten och rubrikens början syns. Den ligger lite snett och platt i
pultens perspektiv som Tipsguiden på andra sidan kupongen (`--vila`), i rummets ljus och mörkare mot vecket. Förstasidan
kopieras när löpsedeln har ritats om (`omritad` i rum-affischer.js, `tidningPult` i rum.js), så att de alltid är samma.
Ett klick, eller L, och den lyfts mot en och läggs fram (`tidningen(true, 'tidning')`); *Lägg tillbaka*, Esc och bakåt
lägger tillbaka den på pulten. Med minskad rörelse läggs den fram direkt. Mellan omgångarna, när det inte finns någon
tidning, ligger den inte där. Den är ritad i sidan som Tipsguiden, inte i 3D, och papperet ritas en gång och flyttas
sedan bara med rummet, så den kostar lika lite som Tipsguiden också i svaga telefoner. Fläkten, fikat och askkoppen
(rum-saker.js) står till höger om högen och tidningen. Den som har sagt vem den är pekar på den medan den är framme
(`kvallstidningen` i rum-folk.js).

Provat i headless Chromium med det lokala bygget och en påhittad omgång (matcherna från 2026-11-07 flyttade till
lördagen efter) i 1440 × 900, 1920 × 1080, 390 × 844 (dra åt höger, tryck) och 844 × 390: tidningen ligger på pulten,
ett klick, ett tryck och L lyfter den och lägger fram den, Esc, *Lägg tillbaka* och bakåt lägger tillbaka den, också
med minskad rörelse, och ett klick på löpsedeln går bara fram till sedeln. Fläkten, fikat, askkoppen och dosan i alla
fyra uppställningarna står fritt från tidningen, och högen med tre kuponger (ditritad för provet) lägger sig över dess
nedre del så att namnet syns. Inte provat efter omgången (sammanställningen kräver tjänsten), i Safari eller i en riktig
telefon.

**Före omgången** (omgången finns och är inte spelad):

- *Tipset*: omgångens matcher med numret på kupongen och avsparken, datorns procent för 1, X och 2 (det troligaste i
  fetstil) och Sixten Bråvalls tecken ur analysen, och under dem Tipsligan efter de omgångar som är spelade och syns.
  Ingen annans tips står där: de syns först i uppgörelsen.
- *Så mår tipslagen*: notiserna inför omgången ur `data/tidning.json` (se *Tidningen inför omgången* under
  [Analyserna](#analyserna)), en per match med numret, lagen, rubriken, texten och källornas namn – samma som på
  baksidan av Hasses tidning. Överst i notisen står veckans bilder av lagen (`bilder` i `data/tidning.json`, se *Veckans
  bilder i tidningen*), hemma och borta bredvid varandra, rastrerade i svartvitt som tidningens andra bilder och med
  lagets namn på en mörk list, och fotograferna efter källorna. Saknas en bild, eller går den inte att hämta, står lagets
  sköld där (`Skoldar.src` i [public/skoldar.js](public/skoldar.js)); utan en enda bild står notisen utan bilder. Sidan finns när filen är skriven för omgången (samma id eller minst hälften av matcherna)
  och är högst tio dagar gammal.
- *Veckans analys*: Sixten Bråvalls artikel om matchen som löpsedeln handlar om (`id` i `rubrik` i rum-affischer.js,
  när rubriken gäller en match), annars den jämnaste matchen som inte har börjat: rubriken, ingressen, texten med
  anfang och utan källhänvisningarna i klamrar, och i en ruta hans tecken, marginalen och motiveringen. Källorna står
  sist.
- *Supportrarna*: en informationssida per match ur `data/poddsidor.json` (se *Supporterpoddarna* och
  *Supporterforumen* under [Analyserna](#analyserna)), i kupongens ordning: rubrik och ingress, hemmalaget till
  vänster och bortalaget till höger med poddarna och forumet de bygger på, och punkterna under sina ämnen. Varje punkt
  har slaget som stämpel (*Bekräftat* i svart, poddens eller forumets egen uppgift i rött – *Hört i podden*, *Från
  forumet* eller *Hört bland supportrarna* när båda säger det – och *Supportrarnas åsikt* streckad), och de tyngsta
  har citatet under, med den som säger det och podden, eller användarnamnet och forumet. Har bara det ena laget något
  får det hela bredden i två spalter. Slagen förklaras i sidfoten.
  *I tidningen* pekar på den första av sidorna.

Notiserna och analyserna hämtas när man pekar på eller trycker på tidningen, och klicket väntar på dem i högst två och en
halv sekund. Mellan omgångarna (ingen omgång, bara de närmaste matcherna) finns ingen tidning, och då ligger den inte på
pulten.

**Efter omgången** (sammanställningen finns, se [Sammanställningen efter omgången](#sammanställningen-efter-omgången)):

- *Omgången*: resultaten med rätt tecken, datorns chans för det som hände (rött under 25 %) och hur många av er som
  hade rätt, *Rätt rad* i rutor som i tidningarnas tipsspalt och *Siffrorna*: målen, hemmasegrar, oavgjorda och
  bortasegrar, flest mål i en match, gängets kupong, datorns rad och flest rätt.
- *Betygen*: var och en med porträtt, en till fem bollar (`RumBlock.betyg`), rätt, poäng och plats, och två meningar:
  ensam om rätt i vilka matcher, bäst eller sist, och den bästa träffen (datorn gav den högst 45 %) eller den värsta
  missen (minst 60 %).
- *Skrällen*: det datorn trodde minst på, när det var högst 40 %, med en rubrik som löpsedelns (*FOREST FÄLLDE
  MANCHESTER*, *… SÄNKTE …*, *… SNUBBLADE*) och vilka som hade det. Under den *Det ni skrev*: högst fyra av era
  motiveringar och kommentarer efteråt, helst från olika personer och först om skrällen och där någon var ensam om
  rätt, med porträttet, matchen och hur det slutade.
- *Krönikan*: Hasse Backes, med hans porträtt. Han tar omgångens namn, er kupong, skrällen (högst 30 %), vinnaren
  (på poängen när fler hade lika många rätt), den som kom sist, datorn när den slog er allihop eller kom sist, sig
  själv och en avslutning – han har alltid haft rätt, och det som gick fel var matcherna. Bredvid står Tipsligan
  efter omgången, med pilar för den som har klättrat eller fallit.

Samma omgång ger samma tidning på alla enheter: där texten kan variera väljer omgångens id. Namnen är skårtavlans
(Dogge för Johansson), som på löpsedeln. Inget anropar en språkmodell: notiserna och analysen är skrivna i förväg på
iMacen, och resten är mallar i `TEXT` i rum-tidning.js, som `npm run repliker` kollar mot det som är underkänt (i
krönikan säger Hasse ni och er). Med dolda resultat finns ingen sammanställning, och då är tidningen den före omgången.
Esc, *Lägg tillbaka*, bakåt eller ett klick utanför lägger bort den, pilarna och mellanslag rullar, och medan den är
framme står rummet still.

Provat i headless Chromium med en påhittad sida (omgången 2026-11-07 ur `data/tippar-historik.json`,
`data/kupong-historik.json` och `data/analyser.json`, och påhittade notiser) i 1440 × 900 och 412 × 915, och
kantfallen (Hasse vann och kom sist, någon utan kupong, inga porträtt, ingen notis och ingen analys) med Node. Inte
provat i hela rummet, i Safari eller i en riktig telefon.

#### Tipsguiden

Tidningens tipsbilaga ligger på pulten, på gulnat tidningspapper (2026-11-09, användarens önskemål: "nåt nr av
tipsguiden … som man kan plocka upp o läsa"). Den ligger mellan Hasse Backes nota och kupongen, under dem båda, lite
snett och platt i pultens perspektiv som notan (`#rum-tipsguiden` i [public/rum-tidning.css](public/rum-tidning.css),
`--vila`), så att namnet och rubriken syns i luckan, i datorn och i telefonen. Ett klick, eller G, och den lyfts
mot en, över kupongen, och läggs fram som kvällstidningen (`tidningen(true, 'guide')` i rum.js), med *Lägg
tillbaka*, Esc och bakåt som där; då läggs den tillbaka på pulten. Med minskad rörelse läggs den fram direkt. Den som
har sagt vem den är pekar på den medan den är framme (`tipsguiden` i rum-folk.js).

Framsidan är dess egen och samma på pulten och framme (`forsta` i [public/rum-tidning.js](public/rum-tidning.js),
100 × 140 som sedeln, förstorad med zoom): namnet *TIPSGUIDEN* i rött, *Nr* och veckan för den första matchen,
datumet och priset, en rubrik som omgången väljer (*Så tar du hem 13 rätt*, *Allt om helgens 13*, *Här är den säkra
raden*), kupongens matcher med datorns troligaste tecken, *Spika* för den största favoriten (minst 68 %, inte krysset),
*Rysaren* för den jämnaste (ingen utgång över 42 %) och en puff för knepen. Inuti står sidorna inför omgången – *Tipset*,
*Så mår tipslagen*, *Veckans analys* och *Supportrarna*, samma som i tidningen – och sist *Åtta knep* (*Så blir du rik på tipset*:
kvällstidningens råd, och nummer 5, *Tippa inte med hjärtat*, med stämpeln *Här gör alla fel*), som alltid finns.
Texterna står i `TEXT.guide` och `TEXT.knep` och kollas av `npm run repliker`.

Numret gäller omgången som rummet visar (`guideUpplaga` i rum.js), också när den är spelad: det gamla numret ligger kvar
tills nästa kupong kommer. Mellan omgångarna är det numret för den senaste kupongen, och utan någon kupong står knepen
på framsidan. Det är daterat dagen före den första matchen, eller idag om den dagen inte har kommit än. Notiserna,
supporterpoddarnas sidor och analyserna hämtas när man pekar på eller trycker på den, som på kvällstidningen.

Provat i headless Chrome med det lokala bygget (omgången 2026-11-07, spelad) i 1440 × 900, 1920 × 1080 och 390 × 844:
tidningen syns på pulten, ett klick träffar den, den lyfts över protokollet och läggs fram med alla sidor, och Esc lägger
tillbaka den. *Så mår tipslagen* med en påhittad `data/tidning.json`, och framsidan utan matcher med Node. Inte provat
i Safari eller i en riktig telefon.

### Närbilderna

Uret, skårtavlan, Omgångens orakel, visitkortet, pokalhyllan, korktavlan, löpsedlarna i fönstret (IFK 1982,
Nacional 1988, VM 94 och Chelsea 2021 på skivan och veckans löpsedel) och namnet på dörren
tittar man på nära med ett klick (`sak` i rum.js, `data-sak` på föremålen), och
kupongen på pulten när den inte går att ta i handen: kameran ställer sig rakt framför och går fram tills
saken fyller det mesta av fönstret – högst 90 % av bredden och 74–94 % av höjden mellan
namnet och foten (den låga skårtavlan 50 %, så att den inte kommer närmare än de andra, och
visitkortet 72 %, eftersom det är litet) – i
telefonen också. Rummet vrids rakt medan kameran glider fram och står
sedan still: så länge något vrids ritar webbläsaren lagren i den vanliga skalan och förstorar
dem suddigt, och när det står still ritas de om skarpt. Det som står framför väggen – gänget
vid barbordet och pulten – tonar bort medan kameran går förbi (inte när saken ligger på
pulten), och vid pokalhyllan tv:n. Dörren siktar kameran på en osynlig ruta över dörrens övre
del (`#rum-dorrglas`), så att Stängt-skylten och namnet kommer med. Uret,
orakelramen och ramarna kring skårtavlan och korktavlan är ritade i 3D och ritas om i närbildens skala när
kameran är framme (`skarp` i rum-inredning.js, högst 2600 bildpunkter på längsta ledet);
uret går som vanligt, med sekundvisaren.

Ingen närbild leder ut ur rummet. Under pokalhyllan står hur många pokaler var och en har.
Esc eller ett klick (också på saken) går tillbaka,
och K, T, A, R, V och N går direkt till kupongen, tv:n, anslagstavlan, kortregistret, videon och
kupongen ur kupongstället (K nära kupongen på pulten går tillbaka). Föremålen lyser inte när man
pekar på dem på nära håll. Med `prefers-reduced-motion` går kameran direkt.
`?rum-sak=ur|skar|ram|kort|pokal|kork|vm94|ifk|nacional|lopsedel|chelsea|dorr|kupong|radio` visar en närbild i en fast bild (med `?rum-t`).

### Bakåt

Bakåtgesten i telefonen och bakåtknappen i datorn lägger bort det översta som ligger framme och stannar
i rummet ([public/rum-bak.js](public/rum-bak.js)). Lagren, från det översta: spelarkortet, matchbladet,
Hasses svar om en lapp, en lapp på anslagstavlan eller ett kort i registret, kupongen i handen (också
hos Hasse), rutan i hela fönstret på videon, och sist tv:n, videon, en närbild, anslagstavlan,
kortregistret, tidningen eller Hasses vy. Med inget framme lämnar bakåt sajten, som vanligt.

Varje lager har en osynlig rad i webbläsarens historik: samma adress, med antalet lager i
`history.state.rum`. Bakåt ger `popstate`, och det som ligger över raden man kom till läggs bort, samma
väg som krysset eller Esc. Stängs ett lager på annat sätt tar `stam()` bort raden med `history.go`, så
att nästa bakåt inte stannar på en tom rad. Lager som byts i samma klick (K från en närbild) återanvänder
raden, och en rad som blir över (en länk ut ur ett lager, en omladdning, framåtknappen) räknas som fel
läge och rättas utan att något syns. Adressen ändras aldrig, så `route` i
[public/app.js](public/app.js) märker inget, och matchrutan (`#match/<id>`) ovanpå rummet sköter sina
rader som förut.

Chrome hoppar över alla rader i ett dokument som lägger till en rad innan någon har tryckt på sidan
(`chrome.tabs.goBack` går samma väg som gesten och visar det, `history.back` gör det inte). Därför får
lager utan tryck, som `?rum-sak`, ingen rad. Sveper man bakåt i telefonen visar Chrome själv en bild av
raden under (`hasUAVisualTransition`), och då läggs lagret bort utan rörelse (`RumBak.snabbt`). På Android
stänger Chrome spelarkortet utan att historiken rör sig, och då säger dialogens `close` till.

Ordet *Tillbaka* i rummets fot går samma väg (`RumBak.ned()`), och `RumBak.vid` säger till när det ska stå där.

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
- **Analyserna:** de kommer inte om datorn är avstängd eller sover hela tiden fram till avspark,
  och Hasse Backes och matchbladets texter tar inte med nyheter efter den senaste tiden (en skada
  samma morgon). Claudes tecken sparas inte i journalen och rättas inte. Antalet sökningar och sidor kan
  bara begäras i prompten, inte tvingas fram med `claude -p`, och `WebFetch` ger en sammanfattning
  av sidan, så sifferkontrollen kan säga nej till ett tal som stod på sidan men inte i
  sammanfattningen (då skrivs texten om). `WebSearch` kan inte spärra spelbolag, men deras sidor
  stryks ur källistan. Sajter som är spärrade på datorn kan inte läsas.
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

Analyserna: inga nycklar till språkmodeller finns längre i repot, i workflowen eller hos
Cloudflare. Claude Codes inloggning ligger i datorns nyckelring och används bara av jobbet på datorn.
`claude -p` får bara läsa på nätet och kan inte röra filer eller köra kommandon (se
[Analyserna](#analyserna)). Till Claude skickas matchens publika underlag, gängets kupong och deras
anteckningar i kommentaren. Sajten har `noindex` på varje sida och en
[robots.txt](public/robots.txt), men repot är publikt, så filerna går att hitta via GitHub.
`.dev.vars` och `.wrangler/` (wranglers lokala hemligheter och tillstånd) är gitignorerade.

Inför uppgörelsen: tipsen är dolda av tjänsten, inte av sidan – `GET /samtal` skickar dem inte
förrän de visas för alla, och `se` bara till den som har lämnat in. Vem man är väljer man
själv på enheten, så tjänsten litar på gänget (sedan 2026-10-22, så att de andras tips syns
på alla ens enheter): den som inte har lämnat in kan se tipsen genom att säga att hen är
någon som har det, eller ändra någon annans tips. Sidan hindrar bara att det sker av
misstag – en enhet byter inte till någon som redan har lämnat in. Kommentarerna i
efterhand döljs som tipsen, och vem som helst kan skriva en i någons namn. Gängets kryss i
realtid ([worker/kupongen.mjs](worker/kupongen.mjs)) litar på gänget på samma sätt: tjänsten släpper bara in
sajtens egna ursprung, men vem som helst därifrån kan läsa och ändra dem, och sidan kopplar
upp sig först när man får se de andras tips, så att ingen ser dem av misstag. Det är ett
utkast: kupongen som spelas ändras bara genom *Spara*, med sina vanliga kontroller.
