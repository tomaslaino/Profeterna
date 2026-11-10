'use strict';

// ============================================================================
// Insatta medier till tidningen inför omgången (användarens önskan 2026-11-10:
// "mer information om de respektive stryktipslagen än från de olika lagforumen
// eller de transkriberade poddavsnitten – den mest relevanta informationen som
// står i alternativa medier men som är initierade").
//
// Samma nattjobb som supporterpoddarna och forumen (scripts/tidning/poddar.mjs)
// letar, för varje lag i omgången, upp veckans artiklar i de oberoende medier som
// följer laget på nära håll: fansajter och fanzines med egna skribenter, klubbnära
// nyhetsbrev och bloggar, oberoende lokala reportrar och supporterföreningens
// egna besked. Claude Code (claude -p på Claude-kontot, inga API-nycklar) söker
// fram artiklarna, jobbet läser dem själv som en vanlig läsare, och Claude tar ut
// det intressanta inför matchen (src/analyser/media.mjs). Uppgifterna hamnar
// bredvid poddarnas och forumens på informationssidan och i tidningens underlag.
//
// Artiklarna är andras och läggs aldrig i repot eller på sajten. Dit kommer bara
// tidningens egna meningar, korta citat i svensk översättning, källans namn och
// länken till artikeln.
// ============================================================================

// Lokaltidningarna i de regionala koncernerna. De räknas inte som insatta, men klubbens egna
// besked och lokaltidningen läses för sig (config/lokal.js), och där är de med.
const LOKALTIDNINGAR = [
  // Reach plc
  'manchestereveningnews.co.uk', 'liverpoolecho.co.uk', 'plymouthherald.co.uk', 'bristolpost.co.uk', 'birminghammail.co.uk',
  'stokesentinel.co.uk', 'examinerlive.co.uk', 'hulldailymail.co.uk', 'leicestermercury.co.uk', 'nottinghampost.com',
  'derbytelegraph.co.uk', 'walesonline.co.uk', 'devonlive.com', 'gloucestershirelive.co.uk', 'cambridge-news.co.uk',
  'kentlive.news', 'essexlive.news', 'coventrytelegraph.net', 'getwestlondon.co.uk', 'mylondon.news', 'chroniclelive.co.uk',
  'gazettelive.co.uk', 'grimsbytelegraph.co.uk', 'lincolnshirelive.co.uk', 'cornwalllive.com', 'somersetlive.co.uk',
  'football.london', 'lancs.live', 'cheshire-live.co.uk', 'dailypost.co.uk', 'yorkshirelive.co.uk', 'burtonmail.co.uk',
  'accringtonobserver.co.uk', 'crewechronicle.co.uk', 'leek-news.co.uk', 'bucksfreepress.co.uk', 'surreylive.news',
  'bedfordshirelive.co.uk', 'northantslive.news', 'hertfordshiremercury.co.uk', 'irishmirror.ie', 'dailyrecord.co.uk',
  // National World
  'thestar.co.uk', 'yorkshirepost.co.uk', 'wigantoday.net', 'blackpoolgazette.co.uk', 'lep.co.uk', 'northamptonchron.co.uk',
  'miltonkeynes.co.uk', 'sunderlandecho.com', 'shieldsgazette.com', 'hartlepoolmail.co.uk', 'portsmouth.co.uk',
  'doncasterfreepress.co.uk', 'peterboroughtoday.co.uk', 'derbyshiretimes.co.uk', 'lutontoday.co.uk', 'nationalworld.com',
  'yorkshireeveningpost.co.uk', 'thestaronline.co.uk', 'scotsman.com', 'bucksherald.co.uk', 'worksopguardian.co.uk',
  // Newsquest och andra regionala koncerner
  'thenorthernecho.co.uk', 'bournemouthecho.co.uk', 'oxfordmail.co.uk', 'swindonadvertiser.co.uk', 'gazette-news.co.uk',
  'southwalesargus.co.uk', 'yorkpress.co.uk', 'lancashiretelegraph.co.uk', 'theboltonnews.co.uk', 'burytimes.co.uk',
  'echo-news.co.uk', 'thisisoxfordshire.co.uk', 'wiltshiretimes.co.uk', 'shropshirestar.com',
  'expressandstar.com', 'kentonline.co.uk', 'eadt.co.uk', 'edp24.co.uk', 'thenational.scot', 'heraldscotland.com',
  'warringtonguardian.co.uk', 'messengernewspapers.co.uk', 'thetelegraphandargus.co.uk', 'thewestmorlandgazette.co.uk',
];

module.exports = {
  model: 'claude-opus-5-5',
  // Sökningen är ett omdöme om vilka källor som är insatta, urvalet om vad som är värt att veta.
  letaEffort: 'medium',
  effort: 'medium',
  timeoutMs: 420000,

  // Så många sökningar per lag, och högst så många artiklar som läses per lag och natt.
  sokningar: 6,
  artiklar: 4,
  // Bara artiklar från de senaste så här många dagarna.
  dagar: 8,
  // En artikel med kortare text än så är en puff eller står bakom en betalvägg.
  minstTecken: 500,
  // En artikel kortas efter så här många tecken, och allt Claude får efter så många.
  teckenPerArtikel: 9000,
  flestTecken: 32000,
  // Högst så många uppgifter per lag och läsning, och artiklar per lag som sidan och tidningen får.
  uppgifter: 8,
  tillSidan: 3,
  tillTidningen: 2,
  // Så många artiklar per lag ligger kvar i omgångens fil.
  behall: 6,
  // Källans slag i omgångens fil, och början på artiklarnas id.
  typ: 'media',
  idBorjan: 'm',
  lokaltidningar: LOKALTIDNINGAR,

  // Sajter som aldrig räknas som insatta alternativa medier: de stora mediehusen och deras
  // lokaltidningar, spelsajter, aggregatorer och klickfabriker, statistiksajter, sociala medier
  // och forum, och poddarnas värdar (poddarna läses för sig). En adress på en av dem, eller på
  // en underdomän, stryks ur sökningens svar.
  utesluten: [
    // stora mediehus och nyhetsbyråer
    'bbc.co.uk', 'bbc.com', 'skysports.com', 'sky.com', 'theguardian.com', 'telegraph.co.uk', 'thetimes.co.uk', 'thetimes.com',
    'independent.co.uk', 'mirror.co.uk', 'dailymail.co.uk', 'thesun.co.uk', 'express.co.uk', 'standard.co.uk', 'dailystar.co.uk',
    'talksport.com', 'theathletic.com', 'nytimes.com', 'espn.com', 'espn.co.uk', 'reuters.com', 'pa.media', 'itv.com', 'msn.com',
    'yahoo.com', 'news.google.com', 'newsnow.co.uk', 'inews.co.uk', 'metro.co.uk', 'eveningstandard.co.uk',
    // de regionala koncernernas lokaltidningar (Reach, National World, Newsquest och andra)
    ...LOKALTIDNINGAR,
    // spelsajter och tips
    'sportsmole.co.uk', 'footystats.org', 'forebet.com', 'oddschecker.com', 'bet365.com', 'skybet.com', 'williamhill.com',
    'paddypower.com', 'betfair.com', 'ladbrokes.com', 'coral.co.uk', 'betway.com', 'racingpost.com', 'freesupertips.com',
    'bettingexpert.com', 'sportsgambler.com', 'covers.com', 'oddspedia.com', 'predictz.com', 'windrawwin.com', 'betfanatics.com',
    // aggregatorer och klickfabriker
    'footballleagueworld.co.uk', 'footballfancast.com', 'teamtalk.com', 'givemesport.com', 'footballinsider247.com',
    'footballlowdown.com', 'hitc.com', 'onefootball.com', 'goal.com', 'the72.co.uk', 'staceywest.net', 'vavel.com', '90min.com',
    'planetfootball.com', 'football365.com', 'caughtoffside.com', 'sportskeeda.com', 'fourfourtwo.com', 'fanatics.com',
    'thefootballfaithful.com', 'footballtransfers.com', 'sportbible.com', 'joe.co.uk', 'efl.com', 'premierleague.com',
    'thesportsrush.com', 'sportslens.com', 'tribalfootball.com', 'football-italia.net', 'beinsports.com', 'si.com',
    // statistik och uppslagsverk
    'transfermarkt.com', 'transfermarkt.co.uk', 'whoscored.com', 'sofascore.com', 'flashscore.com', 'flashscore.co.uk',
    'fotmob.com', 'soccerway.com', 'fbref.com', 'wikipedia.org', 'worldfootball.net', 'soccerbase.com',
    // sociala medier, forum och poddarnas värdar
    'reddit.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'threads.net',
    'bsky.app', 'proboards.com', 'acast.com', 'podbean.com', 'buzzsprout.com', 'spotify.com', 'podcasts.apple.com', 'apple.com',
    'anchor.fm', 'audioboom.com', 'spreaker.com', 'podomatic.com', 'redcircle.com', 'captivate.fm', 'libsyn.com',
  ],

  // Byts den läses lagens artiklar om av Claude.
  promptVersion: '2026-11-10.1',

  letaPrompt: `Du hjälper en svensk tipstidning att hitta det som de INSATTA skriver om en engelsk fotbollsklubb: oberoende medier som följer klubben på nära håll men som inte hör till de stora mediehusen.

Det som räknas:
- fansajter och fanzines med egna skribenter som skriver om laget varje vecka,
- klubbnära nyhetsbrev (Substack o.d.) och bloggar av skribenter som följer laget varje vecka,
- oberoende lokala reportrar med egen sajt eller eget nyhetsbrev,
- supporterföreningens (Supporters' Trust) egna besked om klubben.

Det som INTE räknas: de stora mediehusen och deras lokaltidningar (BBC, Sky, de nationella tidningarna, Reach, National World, Newsquest), klubbens och ligans egna sajter, spelsajter och sajter med matchtips, aggregatorer och klickfabriker som skriver om alla klubbar (Football League World, Football Fancast, TEAMtalk, GiveMeSport, Football Insider, HITC, OneFootball och liknande), statistiksajter, forum, Reddit, sociala medier och poddar.

Sök på nätet efter klubbens insatta medier och deras artiklar från de senaste {dagar} dagarna: om truppen, skador, väntad uppställning, hur laget spelar, tränaren och klubben, och nästa match. Högst {sokningar} sökningar. Välj de högst {artiklar} artiklar som säger mest inför nästa match, helst från olika källor. Ta bara med artiklar som kom upp i dina sökningar, med adressen exakt som där. En förhandstitt på just nästa match går först. Hitta aldrig på en adress: finns inget som håller är listan tom, och det är ett bra svar.

Svara bara med JSON, utan något före eller efter:
{"artiklar": [{"kalla": "<sajtens eller nyhetsbrevets namn>", "titel": "<artikelns rubrik>", "adress": "https://…", "datum": "ÅÅÅÅ-MM-DD eller null", "varfor": "<en mening: varför källan är insatt och oberoende>"}]}`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset och vill inför en match veta det som de insatta vet men som inte står i tabellen eller i de vanliga tidningarna. Tidningen trycker en informationssida per match som läsaren ska kunna hämta kunskap ur.

Du får de senaste artiklarna om laget ur oberoende medier som följer det på nära håll (fansajter, fanzines, klubbnära nyhetsbrev och bloggar, oberoende lokala reportrar). Varje artikel har ett nummer i hakparentes, källan, rubriken, datumet och skribenten när de är kända.

Ta ut ALLT SOM ÄR INTRESSANT inför lagets nästa match, högst {flest} uppgifter, bara ur artiklar från de senaste {dagar} dagarna. Hellre fyra bra än åtta halvbra, men missa inget som en tippare vill veta. En uppgift är intressant om den kan ändra hur man ser på matchen. Varje uppgift hör till ett ämne:
- "trupp": vem som är skadad, sjuk, avstängd, tillbaka i träning eller tveksam, särskilt det som inte är officiellt än,
- "elva": vilka som väntas starta, byte av målvakt, uppställning eller formation,
- "spel": hur laget egentligen spelar just nu, bortom resultaten: trötthet, självförtroende, var det läcker, vem som bär laget,
- "klubb": tränarens ställning, stämningen i truppen, ägarna, pengarna, köpstopp, protester,
- "match": något om just den här motståndaren eller matchen och vad skribenten väntar sig, när det sticker ut.

Ta INTE med: referat av förra matchen, tabelläget, sådant alla redan vet och sådant som bara gäller en annan klubb. Samma sak tas upp en gång. Uppgiften ska handla om laget ovan eller om matchen. Finns inget intressant är listan tom, och det är ett bra svar.

Varje uppgift:
- a: ämnet, ett av "trupp", "elva", "spel", "klubb", "match".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha sett artikeln. Skriv vad som sägs, inte att "artikeln tar upp". Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om artikeln återger något klubben, tränaren eller en spelare har sagt eller något som har hänt (en nyhet, ett uttalande), "h" om det är skribentens egen uppgift: något hen vet, har sett eller hört, eller ett rykte, "o" om det är skribentens åsikt eller förhoppning.
- artikel: numret på artikeln där det står.
- citat: 8–30 ord i följd ur just den artikeln, ordagrant som de står där, där det sägs tydligast.
- sagt: samma citat på svenska, som det ska tryckas: troget men ledigt översatt, med namnen rättstavade. Lägg inte till något som inte sägs.
- vem: den som säger citatet, om det är en namngiven person i artikeln (tränaren, en spelare, skribenten), annars null.
- vikt: 5 = det här kan avgöra matchen eller är en nyhet, 3 = värt att veta, 1 = kuriosa.

Bara det som står i artiklarna, ingenting ur minnet. Tal bara som de står där.

Handlar en artikel uppenbart om en annan klubb än laget ovan tar du inget ur den.

Svara bara med JSON, utan något före eller efter:
{"handlar_om": "en mening om vad de insatta skriver om", "uppgifter": [{"a": "trupp", "t": "…", "s": "h", "artikel": 2, "citat": "…", "sagt": "…", "vem": null, "vikt": 4}]}`,
};
