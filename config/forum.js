'use strict';

// ============================================================================
// Lagets supporterforum till tidningen inför omgången (användarens önskan
// 2026-11-10: "Lägg till det viktigaste forumet för varje lag som den går igenom
// inför tidningssläppet – som källmaterial för info om laget").
//
// Samma nattjobb som supporterpoddarna (scripts/tidning/poddar.mjs) läser, för
// varje lag i omgången, de mest aktuella trådarna på lagets viktigaste forum:
// matchtråden mot motståndaren först, sedan det som är aktivt nu. Claude Code
// (claude -p på Claude-kontot, inga API-nycklar) tar ut det intressanta inför
// matchen, och uppgifterna hamnar bredvid poddarnas på informationssidan och i
// tidningens underlag (src/analyser/forum.mjs).
//
// Inläggen är andras och läggs aldrig i repot eller på sajten. Dit kommer bara
// tidningens egna meningar, korta citat i svensk översättning, användarnamnet
// och forumets namn som källa.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  timeoutMs: 420000,

  // Så många trådar läses per lag och natt (av högst så många kandidater, de bästa först), och
  // bara inlägg från de senaste så här många dagarna.
  tradar: 3,
  kandidater: 5,
  dagar: 7,
  // Har trådens sista sida färre inlägg än så läses sidan före också.
  minstInlagg: 12,
  // Ett inlägg kortas efter så här många tecken, och allt Claude får efter så många.
  teckenPerInlagg: 1500,
  flestTecken: 60000,
  // Högst så många uppgifter per läsning, och läsningar per lag som sidan och tidningen får.
  uppgifter: 10,
  tillSidan: 2,
  tillTidningen: 1,

  // Registret: ett forum räknas som levande om tavlan har ett inlägg de senaste så här många dagarna.
  levandeDagar: 21,
  letaOmDagar: { utan: 14, med: 60 },
  sokningar: 12,
  letaPerAnrop: 8,
  letaEffort: 'medium',

  // Forumen vi känner: det viktigaste supporterforumet för vart och ett av de 92 ligalagen som
  // går att läsa utan webbläsare och tillåter det (robots.txt), och tavlan där a-laget diskuteras.
  // Lagets namn som hos ESPN. Uppslagna 10 november 2026: var och en lästes med lasForum och hade
  // inlägg den veckan. Står laget här letas det inte upp; ändras raden prövas den på nytt samma natt.
  kanda: {
    'Accrington Stanley': { namn: 'Accrington Web', tavlor: ['https://www.accringtonweb.com/forums/accrington-stanley-forum.93/'] },
    'AFC Bournemouth': { namn: 'Vital Bournemouth', tavlor: ['https://bournemouth-forum.vitalfootball.co.uk/forums/upthecherries-forum.7/'] },
    'Arsenal': { namn: 'Arsenal Mania', tavlor: ['https://arsenal-mania.com/forum/forums/champions-talk.17/'] },
    'Aston Villa': { namn: 'Vital Villa', tavlor: ['https://forums.vitalfootball.co.uk/forums/100-villa.6/'] },
    'Blackburn Rovers': { namn: 'BRFCS', tavlor: ['https://www.brfcs.com/forums/forum/4-blackburn-rovers-fans-messageboard/'] },
    'Bolton Wanderers': { namn: 'Bolton Nuts', tavlor: ['https://boltonnuts.forumotion.co.uk/f1-bolton-wanderers-banter'] },
    'Brighton & Hove Albion': { namn: 'North Stand Chat', tavlor: ['https://www.northstandchat.com/forums/the-big-board.20/'] },
    'Cardiff City': { namn: 'Cardiff City Forum', tavlor: ['https://www.cardiffcityforum.co.uk/viewforum.php?f=2'] },
    'Chelsea': { namn: 'The Shed End', tavlor: ['https://www.theshedend.com/forums/general-chelsea-fc.43/'] },
    'Cheltenham Town': { namn: 'The Robins Nest', tavlor: ['https://robinsnestforum.co.uk/viewforum.php?f=2'] },
    'Colchester United': { namn: 'The U\'sual', tavlor: ['https://theusual.fansnetwork.co.uk/forum/'] },
    'Coventry City': { namn: 'Sky Blues Talk', tavlor: ['https://www.skybluestalk.co.uk/forums/coventry-city-general-chat.7/'] },
    'Crystal Palace': { namn: 'Holmesdale Online', tavlor: ['https://forum.holmesdale.net/forums/palace-talk/'] },
    'Exeter City': { namn: 'Exeweb', tavlor: ['https://www.exeweb.com/forums/forums/the-word-on-well-street.17/'] },
    'Fulham': { namn: 'Friends of Fulham', tavlor: ['https://www.friendsoffulham.com/forum/index.php?board=1.0'] },
    'Grimsby Town': { namn: 'The Fishy', tavlor: ['https://forum.thefishy.co.uk/?b-dr/'] },
    'Ipswich Town': { namn: 'TWTD', tavlor: ['https://www.twtd.co.uk/forum/'] },
    'Leeds United': { namn: 'Marching On Together', tavlor: ['https://www.motforum.com/phpbb/viewforum.php?f=1'] },
    'Leicester City': { namn: 'Talking Balls', tavlor: ['https://talkingballs.uk/forums/leicester-city-forum.9/'] },
    'Lincoln City': { namn: 'Vital Imps', tavlor: ['https://forums.vitalfootball.co.uk/forums/100-imps.70/'] },
    'Manchester City': { namn: 'Vital City Chat', tavlor: ['https://forums.vitalfootball.co.uk/forums/city-chat.19/'] },
    'Millwall': { namn: 'Millwall Online', tavlor: ['https://millwallonline.com/forum/'] },
    'Milton Keynes Dons': { namn: 'The MooCamp', tavlor: ['https://www.moocamp.com/forum/viewforum.php?f=9'] },
    'Newcastle United': { namn: 'Vital Talk of the Tyne', tavlor: ['https://forums.vitalfootball.co.uk/forums/talk-of-the-tyne.54/'] },
    'Newport County': { namn: 'We Are Exiles', tavlor: ['https://weareexiles.forumotion.com/f1-newport-county-football-talk'] },
    'Norwich City': { namn: 'Norwich Talk', tavlor: ['https://www.norwichtalk.com/forums/norwich-city-forum.3/'] },
    'Nottingham Forest': { namn: 'Forest Forum', tavlor: ['https://www.forestforum.co.uk/index.php?forums/forest-banter.6/'] },
    'Notts County': { namn: 'Pride of Nottingham', tavlor: ['https://prideofnottingham.co.uk/community/forum/10-match-talk/'] },
    'Oxford United': { namn: 'Yellows Forum', tavlor: ['https://yellowsforum.co.uk/forums/senior-mens-team.3/'] },
    'Plymouth Argyle': { namn: 'Pasoti', tavlor: ['https://pasoti.co.uk/forums/plymouth-argyle-fans-forum.30/'] },
    'Port Vale': { namn: 'One Vale Fan', tavlor: ['https://www.onevalefan.co.uk/forum/forum/8-port-vale-present/'] },
    'Queens Park Rangers': { namn: 'Loft For Words', tavlor: ['https://www.fansnetwork.co.uk/football/queensparkrangers/forum/'] },
    'Rochdale': { namn: 'RochdaleAFC.com', tavlor: ['https://www.fansnetwork.co.uk/football/rochdale/forum/'] },
    'Rotherham United': { namn: 'Vital Millers Mumblings', tavlor: ['https://forums.vitalfootball.co.uk/forums/millers-mumblings.110/'] },
    'Sheffield United': { namn: 'S24SU', tavlor: ['https://www.s24su.com/forum/forums/general-blades-chat.5/'] },
    'Sheffield Wednesday': { namn: 'Owlstalk', tavlor: ['https://www.owlstalk.co.uk/forums/forum/3-sheffield-wednesday-matchday/'] },
    'Southampton': { namn: 'SaintsWeb', tavlor: ['https://www.saintsweb.co.uk/forum/5-the-saints/'] },
    'Sunderland': { namn: 'Ready To Go', tavlor: ['https://www.readytogo.net/smb/forums/pure-football.86/'] },
    'Swansea City': { namn: 'Vital Swansea', tavlor: ['https://forums.vitalfootball.co.uk/forums/swansea-city.104/'] },
    'Tottenham Hotspur': { namn: 'Glory-Glory', tavlor: ['https://glory-glory.co.uk/forums/spurs-news-views.2/'] },
    'Watford': { namn: 'WFC Forums', tavlor: ['https://www.wfcforums.com/index.php?forums/the-hornets-nest-watford-chat.128/'] },
    'West Ham United': { namn: 'KUMB', tavlor: ['https://www.kumb.com/forum/viewforum.php?f=2'] },
    'Wigan Athletic': { namn: 'Vital Latics Speyk', tavlor: ['https://forums.vitalfootball.co.uk/forums/latics-speyk.76/'] },
    'Wycombe Wanderers': { namn: 'The Gasroom', tavlor: ['https://www.gasroom.org/latest'] },
  },

  // Lagen bland de 92 som inte har något forum att läsa, och som därför inte letas upp: det
  // viktigaste forumet spärrar allt som inte är en webbläsare (Cloudflare, inloggning), säger nej
  // till AI-assistenters läsning i robots.txt (alla ProBoards-forum, UpTheClarets, Stagsnet,
  // One Boro), är nedlagt eller tyst, eller går inte att läsa ut (Luton Outlaws, Tigers Talk).
  // Ett lag som varken står här eller i kanda letas upp när det står på kupongen.
  utan: ['AFC Wimbledon', 'Barnet', 'Barnsley', 'Birmingham City', 'Blackpool', 'Bradford City', 'Brentford', 'Bristol City', 'Bristol Rovers', 'Bromley', 'Burnley', 'Burton Albion', 'Cambridge United', 'Charlton Athletic', 'Chesterfield', 'Crawley Town', 'Crewe Alexandra', 'Derby County', 'Doncaster Rovers', 'Everton', 'Fleetwood Town', 'Gillingham', 'Huddersfield Town', 'Hull City', 'Leyton Orient', 'Liverpool', 'Luton Town', 'Manchester United', 'Mansfield Town', 'Middlesbrough', 'Northampton Town', 'Oldham Athletic', 'Peterborough United', 'Portsmouth', 'Preston North End', 'Reading', 'Salford City', 'Shrewsbury Town', 'Stevenage', 'Stockport County', 'Stoke City', 'Swindon Town', 'Tranmere Rovers', 'Walsall', 'West Bromwich Albion', 'Wolverhampton Wanderers', 'Wrexham', 'York City'],

  // Byts den tas uppgifterna ut på nytt ur forumet.
  promptVersion: '2026-11-10.1',

  letaPrompt: `Du hjälper en svensk tipstidning att hitta fotbollsklubbars supporterforum.

Ange för varje klubb det VIKTIGASTE supporterforumet: det mest aktiva och mest lästa diskussionsforumet där klubbens egna supportrar diskuterar herrarnas a-lag. Inte klubbens egen sajt, inte Reddit, Facebook, X eller Discord, inte nyhetssajters kommentarer och inte forum om alla klubbar.

Ge adressen till forumets huvudtavla där a-laget diskuteras (den sida som listar trådarna, med de senast aktiva först), inte forumets startsida om det finns flera tavlor. Högst två tavlor per klubb.

Sök på nätet ("<klubben> fans forum", "<klubben> message board"), högst {sokningar} gånger sammanlagt. Gissa inte en adress: hittar du inget säkert är svaret null.

Svara bara med JSON, utan något före eller efter:
{"klubbar": {"<klubbens namn som i listan>": {"namn": "<forumets namn>", "tavlor": ["https://…"]}}}`,

  urvalPrompt: `Du arbetar på en svensk tipstidning. Läsarna tippar Stryktipset och vill inför en match veta det som supportrarna vet men som inte står i tabellen eller i de vanliga tidningarna. Tidningen trycker en informationssida per match som läsaren ska kunna hämta kunskap ur.

Du får de senaste inläggen ur lagets supporterforum, tråd för tråd. Varje inlägg har ett nummer i hakparentes, användarnamnet och tiden (brittisk tid). Citat ur andra inlägg är bortplockade. Inläggen är skrivna av supportrar: en del vet saker, de flesta tycker.

Ta ut ALLT SOM ÄR INTRESSANT inför lagets nästa match, högst {flest} uppgifter, bara ur inlägg från de senaste {dagar} dagarna. Hellre fem bra än tio halvbra, men missa inget som en tippare vill veta. En uppgift är intressant om den kan ändra hur man ser på matchen. Varje uppgift hör till ett ämne:
- "trupp": vem som är skadad, sjuk, avstängd, tillbaka i träning eller tveksam, särskilt det som inte är officiellt än (någon har sett träningen, hört något, läst tränarens ord),
- "elva": vilka som väntas starta, byte av målvakt, uppställning eller formation,
- "spel": hur laget egentligen spelar just nu, bortom resultaten: trötthet, självförtroende, var det läcker, vem som bär laget,
- "klubb": tränarens ställning, stämningen i truppen, bråk med ägare, löner, köpstopp, protester,
- "match": något om just den här motståndaren eller matchen (resan, planen, en gammal räkning) och vad de som följer laget varje vecka väntar sig, när det sticker ut.

Ta INTE med: referat av förra matchen, tabelläget, sådant alla redan vet, skämt, gnäll utan innehåll, köp och sälj av biljetter, resor och forumets egna angelägenheter. Samma sak tas upp en gång. Säger många samma sak är det värt att veta: skriv det som det många supportrarna menar. Uppgiften ska handla om laget ovan eller om matchen. Finns inget intressant är listan tom, och det är ett bra svar.

Varje uppgift:
- a: ämnet, ett av "trupp", "elva", "spel", "klubb", "match".
- t: en till två meningar på vanlig svenska, högst 45 ord, som går att läsa utan att ha sett forumet. Skriv vad som sägs, inte att "forumet diskuterar". De som skriver är supportrarna på forumet. Inga tips: inte vem som vinner eller vilket tecken man ska välja.
- s: "b" om inlägget återger något klubben, tränaren eller en spelare har sagt eller något som har hänt (en nyhet, ett uttalande), "h" om det är supporterns egen uppgift: något hen har sett, hört eller fått veta, eller ett rykte, "o" om det är supportrarnas åsikt eller förhoppning.
- inlagg: numret på inlägget där det står.
- citat: 8–30 ord i följd ur just det inlägget, ordagrant som de står där (också med stavfel), där det sägs tydligast eller mest målande.
- sagt: samma citat på svenska, som det ska tryckas: troget men ledigt översatt, med namnen rättstavade. Lägg inte till något som inte sägs.
- vikt: 5 = det här kan avgöra matchen eller är en nyhet, 3 = värt att veta, 1 = kuriosa.

Bara det som står i inläggen, ingenting ur minnet. Tal bara som de står där.

Handlar forumet uppenbart om en annan klubb än laget ovan sätter du "ratt_klubb" till false och lämnar listan tom.

Svara bara med JSON, utan något före eller efter:
{"ratt_klubb": true, "handlar_om": "en mening om vad supportrarna pratar om", "uppgifter": [{"a": "trupp", "t": "…", "s": "h", "inlagg": 12, "citat": "…", "sagt": "…", "vikt": 4}]}`,
};
