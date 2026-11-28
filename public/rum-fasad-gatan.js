'use strict';

// ---------- gatan framför tobaksaffären ----------
//
// S:t Eriksgatan mellan en själv och affären (rum-fasad.js): trottoarkanten i granit, rännstenen med gatsten och en
// brunn, asfalten med mittlinjen och, i en telefon på höjden, kanten på trottoaren där man själv står. På gatan kör det
// förbi då och då, och då täcker de affären, bussarna nästan helt: Stockholms bilar i mitten av nittiotalet, ungefär
// som i bilregistret (MODELLER: en tredjedel Volvo med 240:n, 740/940, 850, 440 och 480, Saab 900 (också cabriolet)
// och 9000, Golf, Mercedes 190 och W124, Audi 100, Passat och de andra kombibilarna, Sierra, Kadett, Corolla, BMW, de
// små franska och BX:en, Cherokeen och Voyagern, och de äldre som fanns kvar: Amazon, PV, 144 och 145, Saab 96 och 99,
// Bubblan, Mercedes 123, Ankan, Ladan, Nivan, Minin och amerikanaren när det är varmt), skåpbilar och VW-bussar, taxi,
// de röda bussarna och den blåa fyran, lastbilar med skåp (mest på vardagarna), motorcyklar (den nakna och sporthojen,
// flest när det är varmt och torrt) och plogbilen när det har snöat; längs kanten på affärens sida cyklarna (herr- och
// damcyklar) och mopederna (skotern och Puch Maxin), som bilarna kör om. Fler i rusningen, få på natten och ingen buss
// mitt i natten (RumUte.trafik), och i
// rusningen ibland en kö mot ljuset till vänster: bilarna bromsar in och står med bromsljusen tända, och kör sedan
// iväg en efter en.
//
// Enkelriktat: allt kommer från höger, från bron, i två filer en bit ut på gatan (lägre i bilden än de som går), och
// kör två–tre gånger så fort som de som går, så att man hinner se vad det är. De kör som bilar: var och en har sin
// färd (D), där den ibland släpper gasen, bromsar in med bromsljusen tända och tar fart igen, eller stannar en stund;
// den som kör efter en annan gör som den, en stund senare (Newells modell), och karossen niger när de bromsar och
// gungar tillbaka när de stannar. Allt räknas ur tiden: den delas i luckor om LUCKA sekunder per fil och i varje lucka
// kommer ett fordon (ibland två efter varandra) eller inget, lottat ur luckans nummer, så att bilden är densamma hur
// ofta den än ritas och en stillbild (?rum-t) visar det som kör just då. Ett fordon kommer bara om det aldrig hamnar för
// nära något som kör före, så ingen kör igenom någon annan; köerna har egna, längre luckor (KO), och medan en kö står
// kör ingen annan i den filen.
//
// Fordonen ritas i fasadens främre duk (rf-fram), efter dem som går och före regnet, med vektorer (inga bilder, för
// minnets skull i telefonen) i två eller tre toner som resten av fasaden: kaross, rutor med himlen och de som åker i
// (föraren vid ratten, passagerarna, i bussen sätena; se de som åker nedan), list, stötfångare,
// stänkskydd och hjul med navkapslar och märket i mitten (och på några också på karossen, där det satt från sidan);
// strålkastarna är alltid tända (det är Sverige), och i mörkret lyser de upp gatan
// framför och baklyktorna glöder, bussarna är upplysta inne med folk i, och i regnet stänker det om hjulen och fordonen
// speglas i den våta gatan. Med snö på taken när det har snöat, och avgaser i kylan när de står still.
//
//   RumFasadGatan.mark(V, v, L, G) → gatan som SVG (står still, med marken)
//   RumFasadGatan.trafik(v, L, G) → trafiken S; .syns(S, t, V) det som syns vid tiden t (null: inget);
//   .rita(c, S, lista, t) ritar det i duken (världens enheter; lista: [{ b, f, x, fart, broms, nig }])
//   .SYNS hur långt ut (m) marken ska synas i ett brett fönster (vy i rum-fasad.js)
//   .FORM fordonens former; .fordon.nytt(S, R, typ, T, f) ett fordon, .fordon.valj(S, R, T, f, I) vilket slag
//   G: måtten och hjälparna ur rum-fasad.js (markY, skala, tone, mix, rng …)

window.RumFasadGatan = (() => {
  const TAU = 2 * Math.PI;

  // ---------- måtten (meter ut från fasaden) ----------
  // Trottoaren är smal (de som går håller sig innanför 0,85 m), och gatan är tecknad snarare än uppmätt. Filerna ligger
  // en bit ut på gatan, så att fordonen kör tydligt lägre i bilden än de som går (förut nästan i deras höjd, som om de
  // körde på trottoaren); i ett brett fönster syns marken ut till SYNS (vy i rum-fasad.js), med hjulen i den närmre
  // filen och lite gata under dem.
  const KANT = 0.88;
  const RANN = 1.0;
  const LINJE = 1.51;
  const MOT = 2.02;
  const FILER = [{ d: 1.3, dir: -1 }, { d: 1.72, dir: -1 }];
  // Cyklarna och mopederna håller till höger (förarnas höger, affärens sida), längs kanten en bit innanför bilarnas
  // fil, så att bilarna kör om dem framför dem.
  const CYKELKANT = { d: 1.12, dir: -1, cykel: true };
  const SYNS = 1.95;
  const LUCKA = 12;
  const LIV = 5 * LUCKA - 2;
  const KO = 234;
  // världens kanter i sidled, där fordonen kommer in och försvinner (så långt ut att strålkastarnas ljus på gatan
  // inte når in i bilden när de kommer)
  const XL = -2300;
  const XR = 4300;

  // ---------- fordonen ----------
  //
  // Från sidan, vända åt höger, i centimeter med marken i y 0 och mitten i x 0 (uppåt negativt), efter de riktiga
  // bilarnas mått (längd, hjulbas, höjd). kaross, hus (det mörka bandet kring rutorna), rutor, fog (dörrarnas fogar)
  // och grepp (handtagen) är vägar; belt rutornas underkant, list stötlisten (y0, y1), stot stötfångarna, ljus: fram
  // (strålkastaren), blink och bak som rektanglar [x, y, b, h], hj hjulens x och r deras radie, nav navkapseln, tak
  // [x0, x1, y], forare förarens huvud, spegel backspegelns fäste [x, y] (spegelLack: i lackens färg), skarm
  // stänkskydden, krom kromlister, kjol en annan färg under stötlisten, galler ventilerna, rails takräcket (kanske:
  // ibland) och hog de höga (ingen bak). De äldre: listKrom och stotKrom kromad list och kromade stötfångare, duk taket i
  // en annan färg (tygtaket; dukFarg, dukKanske: ibland), flank skärmar som sitter för sig, efter kjolen över bakhjulet
  // (ritas efter hjulen) och enkel: alltid plåtfälgar. Den öppna bilen (oppen): de som åker syns ovanför dörrarna, och
  // taket ligger hopvikt bak (sufflett). nav 'vit': vita däcksidor. Märket på sidan, där det satt på de riktiga
  // bilarna (se märkena nedan): emblem [text, x, y, höjd, slag] och stjarna Mercedesstjärnan på huven [x, y].
  const FORM = {
    // Volvo 240 kombi: lådan, den lodräta bakluckan, de höga baklyktorna och de stora stötfångarna
    v245: {
      L: 479, hj: [-112, 152], r: 31, nav: 'plat', belt: -97, list: [-62, -55], tak: [-228, 36, -145], forare: [8, -118], rails: 'kanske',
      kaross: 'M-236 -26 L-239 -36 V-134 Q-239 -145 -228 -145 H36 Q45 -145 50 -139 L101 -98 L228 -89 Q240 -88 240 -78 V-36 L237 -26 Z',
      hus: 'M-234 -95 V-134 Q-234 -140 -227 -140 H35 Q41 -140 45 -135 L94 -95 Z',
      rutor: 'M-229 -99 V-132 Q-229 -136 -225 -136 H-140 V-99 Z M-131 -99 V-136 H-28 V-99 Z M-17 -99 V-136 H34 Q38 -136 40 -133 L83 -99 Z',
      fog: 'M-23 -97 V-28 M90 -96 L89 -42 M-136 -97 V-72', grepp: 'M-46 -89 h14 M60 -89 h14',
      stot: [[-248, -55, 16, 24], [232, -55, 16, 24]], skarm: [[-156, -40, 9, 36], [109, -40, 9, 36]], spegel: [90, -99],
      fram: [234, -78, 6, 16], blink: [225, -78, 9, 12], bak: [-240, -104, 6, 52],
    },
    // Volvo 240 sedan: samma nos och stötfångare, den sluttande bakrutan och bagageluckan
    v240: {
      L: 479, hj: [-112, 152], r: 31, nav: 'plat', belt: -97, list: [-62, -55], tak: [-104, 36, -143], forare: [8, -118],
      kaross: 'M-236 -26 L-239 -36 V-96 Q-239 -103 -232 -103 L-160 -105 Q-154 -106 -150 -110 L-114 -139 Q-109 -143 -101 -143 H36 Q45 -143 50 -139 L101 -98 L228 -89 Q240 -88 240 -78 V-36 L237 -26 Z',
      hus: 'M-148 -95 L-112 -136 Q-108 -140 -101 -140 H35 Q41 -140 45 -135 L94 -95 Z',
      rutor: 'M-134 -99 L-107 -131 Q-104 -136 -99 -136 H-28 V-99 Z M-17 -99 V-136 H34 Q38 -136 40 -133 L83 -99 Z',
      fog: 'M-23 -97 V-28 M90 -96 L89 -42 M-138 -97 V-72', grepp: 'M-46 -89 h14 M60 -89 h14',
      stot: [[-248, -55, 16, 24], [232, -55, 16, 24]], skarm: [[-156, -40, 9, 36], [109, -40, 9, 36]], spegel: [90, -99],
      fram: [234, -78, 6, 16], blink: [225, -78, 9, 12], bak: [-241, -100, 7, 27],
    },
    // Volvo 740/940: kantig sedan med lång, låg motorhuv och hög bagagelucka
    v740: {
      L: 479, hj: [-123, 154], r: 31, nav: 'plat', belt: -97, list: [-64, -57], tak: [-108, 33, -141], forare: [6, -116],
      kaross: 'M-236 -28 L-240 -38 V-96 Q-240 -101 -234 -101 L-152 -104 L-114 -137 Q-110 -141 -103 -141 H33 Q40 -141 45 -136 L97 -97 L229 -88 Q240 -87 240 -78 V-38 L236 -28 Z',
      hus: 'M-147 -95 L-112 -133 Q-109 -136 -103 -136 H33 Q38 -136 41 -132 L89 -95 Z',
      rutor: 'M-139 -99 L-110 -129 Q-108 -132 -104 -132 H-27 V-99 Z M-16 -99 V-132 H32 Q36 -132 38 -129 L80 -99 Z',
      fog: 'M-21 -97 V-30 M90 -95 L89 -42 M-141 -96 V-74', grepp: 'M-48 -89 h14 M58 -89 h14',
      stot: [[-246, -57, 14, 25], [232, -57, 14, 25]], spegel: [86, -99],
      fram: [234, -78, 6, 13], blink: [224, -78, 10, 13], bak: [-241, -98, 9, 26],
    },
    // Volvo 740/940 kombi: tegelstenen, långt tak och stor bakre sidoruta
    v745: {
      L: 479, hj: [-123, 154], r: 31, nav: 'plat', belt: -97, list: [-64, -57], tak: [-229, 33, -144], forare: [6, -116], rails: 'kanske',
      kaross: 'M-236 -28 L-240 -38 V-132 Q-240 -144 -229 -144 H33 Q40 -144 45 -139 L97 -97 L229 -88 Q240 -87 240 -78 V-38 L236 -28 Z',
      hus: 'M-235 -95 V-134 Q-235 -140 -228 -140 H32 Q38 -140 41 -135 L89 -95 Z',
      rutor: 'M-229 -99 V-132 Q-229 -136 -225 -136 H-152 V-99 Z M-142 -99 V-136 H-27 V-99 Z M-16 -99 V-136 H32 Q36 -136 38 -132 L80 -99 Z',
      fog: 'M-21 -97 V-30 M90 -95 L89 -42 M-147 -97 V-74', grepp: 'M-48 -89 h14 M58 -89 h14',
      stot: [[-246, -57, 14, 25], [232, -57, 14, 25]], spegel: [86, -99],
      fram: [234, -78, 6, 13], blink: [224, -78, 10, 13], bak: [-241, -106, 7, 50],
    },
    // Volvo 850 kombi: kilen med stigande midja och baklyktorna högt upp längs bakstolpen
    v855: {
      L: 471, hj: [-126, 141], r: 31, nav: 'ekrar', belt: -97, list: [-58, -52], tak: [-221, 20, -141], forare: [-4, -114], rails: 'kanske',
      kaross: 'M-232 -26 L-236 -36 V-100 L-232 -133 Q-230 -141 -221 -141 H20 Q28 -141 34 -136 L92 -96 L224 -84 Q235 -82 236 -72 V-36 L232 -26 Z',
      hus: 'M-228 -101 L-225 -133 Q-224 -137 -218 -137 H19 Q25 -137 29 -133 L84 -95 Z',
      rutor: 'M-221 -100.5 L-219 -130 Q-218 -133 -214 -133 H-152 V-99.5 Z M-142 -99.3 V-133 H-30 V-97.6 Z M-20 -97.4 V-133 H18 Q23 -133 26 -130 L74 -95.2 Z',
      fog: 'M-25 -96 V-28 M86 -94 L85 -40 M-147 -98 V-72', grepp: 'M-52 -88 h14 M54 -87 h14',
      stot: [[-240, -57, 7, 9], [231, -56, 7, 9]], spegel: [82, -97], spegelLack: true,
      fram: [229, -75, 7, 13], blink: [221, -74, 8, 10], bak: [-238, -134, 7, 76],
    },
    // Volvo 850 sedan: samma nos, kort bakruta och hög bagagelucka
    v854: {
      L: 467, hj: [-126, 142], r: 31, nav: 'ekrar', belt: -97, list: [-58, -52], tak: [-106, 20, -141], forare: [-4, -114],
      kaross: 'M-230 -26 L-234 -36 V-100 Q-234 -107 -227 -107 L-160 -109 L-120 -137 Q-114 -141 -106 -141 H20 Q28 -141 34 -136 L92 -96 L222 -84 Q233 -82 234 -72 V-36 L230 -26 Z',
      hus: 'M-153 -101 L-118 -134 Q-114 -137 -106 -137 H19 Q25 -137 29 -133 L84 -95 Z',
      rutor: 'M-138 -99.4 L-112 -128 Q-109 -133 -104 -133 H-30 V-97.6 Z M-20 -97.4 V-133 H18 Q23 -133 26 -130 L74 -95.2 Z',
      fog: 'M-25 -96 V-28 M86 -94 L85 -40 M-143 -98 V-72', grepp: 'M-52 -88 h14 M54 -87 h14',
      stot: [[-238, -57, 7, 9], [229, -56, 7, 9]], spegel: [82, -97], spegelLack: true,
      fram: [227, -75, 7, 13], blink: [219, -74, 8, 10], bak: [-235, -106, 6, 32],
    },
    // Volvo 340: liten kilformad halvkombi med stora svarta stötfångare
    v340: {
      L: 430, hj: [-110, 130], r: 29, nav: 'stal', belt: -96, list: [-60, -53], tak: [-140, 12, -137], forare: [-8, -114],
      kaross: 'M-211 -26 L-214 -36 V-90 Q-214 -98 -210 -101 L-200 -104 L-156 -133 Q-150 -137 -140 -137 H12 Q20 -137 26 -132 L78 -94 L202 -84 Q214 -83 214 -73 V-36 L211 -26 Z',
      hus: 'M-194 -96 L-156 -129 Q-152 -133 -143 -133 H11 Q17 -133 21 -129 L71 -95 Z',
      rutor: 'M-181 -99 L-154 -123 Q-151 -126 -146 -126 H-130 V-99 Z M-120 -99 V-129 H-28 V-99 Z M-18 -99 V-129 H10 Q15 -129 18 -126 L63 -99 Z',
      fog: 'M-23 -97 V-28 M72 -94 L71 -40 M-125 -97 V-70', grepp: 'M-48 -88 h13 M50 -88 h13',
      stot: [[-221, -55, 14, 23], [207, -55, 14, 23]], spegel: [72, -97],
      fram: [209, -78, 5, 13], blink: [201, -77, 8, 10], bak: [-215, -98, 6, 27],
    },
    // Saab 900: lång, böjd motorhuv, den svepande rutan och halvkombins mjuka rygg
    s900: {
      L: 474, hj: [-120, 132], r: 31, nav: 'turbin', belt: -99, list: [-62, -54], tak: [-110, 4, -144], forare: [-12, -117],
      kaross: 'M-233 -28 L-237 -38 V-82 Q-237 -94 -228 -98 L-212 -104 Q-188 -128 -150 -140 Q-136 -144 -110 -144 H4 Q20 -144 32 -136 L90 -99 Q172 -97 226 -86 Q237 -83 237 -72 V-38 L233 -28 Z',
      hus: 'M-206 -98 Q-184 -123 -150 -135 Q-136 -139 -110 -139 H3 Q17 -139 27 -132 L82 -98 Z',
      rutor: 'M-190 -101 Q-172 -120 -148 -130 Q-140 -133 -130 -134 V-101 Z M-122 -101 V-134 H-40 V-101 Z M-30 -101 V-134 H2 Q14 -134 22 -128 L72 -101 Z',
      fog: 'M-35 -99 V-30 M84 -97 L83 -42 M-127 -99 V-72', grepp: 'M-62 -91 h12 M44 -91 h12',
      stot: [[-243, -61, 12, 27], [230, -61, 13, 27]], spegel: [78, -100], emblem: ['SAAB', 104, -77, 6, 'krom'],
      fram: [232, -77, 6, 12], blink: [222, -77, 10, 10], bak: [-238, -95, 7, 19],
    },
    // Saab 9000: upprätt och luftig, med stora rutor och en kort bagagelucka bakom bakluckan
    s9000: {
      L: 470, hj: [-130, 137], r: 31, nav: 'ekrar', belt: -96, list: [-60, -53], tak: [-162, 16, -142], forare: [-6, -116],
      kaross: 'M-231 -28 L-235 -38 V-96 Q-235 -104 -228 -106 L-214 -108 L-178 -137 Q-172 -142 -162 -142 H16 Q26 -142 33 -137 L94 -96 L224 -86 Q235 -84 235 -74 V-38 L231 -28 Z',
      hus: 'M-207 -95 L-176 -133 Q-172 -137 -164 -137 H15 Q23 -137 28 -133 L86 -95 Z',
      rutor: 'M-197 -99 L-173 -128 Q-170 -133 -164 -133 H-146 V-99 Z M-137 -99 V-133 H-32 V-99 Z M-22 -99 V-133 H14 Q20 -133 24 -130 L76 -99 Z',
      fog: 'M-27 -97 V-30 M88 -95 L87 -40 M-141 -97 V-70', grepp: 'M-58 -89 h13 M52 -89 h13',
      stot: [[-240, -59, 9, 23], [230, -59, 9, 23]], spegel: [82, -98], spegelLack: true,
      fram: [229, -75, 6, 12], blink: [222, -75, 8, 10], bak: [-236, -104, 7, 23],
    },
    // Golf: kort halvkombi med den breda bakre stolpen i lackens färg och stora svarta stötfångare
    golf: {
      L: 399, hj: [-128, 119], r: 29, nav: 'stal', belt: -97, list: [-60, -53], tak: [-170, 8, -141], forare: [-24, -116],
      kaross: 'M-196 -28 L-200 -38 V-86 Q-200 -100 -195 -110 L-184 -133 Q-180 -141 -170 -141 H8 Q16 -141 22 -135 L72 -97 L188 -88 Q200 -87 200 -76 V-38 L196 -28 Z',
      hus: 'M-147 -95 L-151 -132 Q-151 -136 -146 -136 H8 Q13 -136 17 -132 L63 -95 Z',
      rutor: 'M-140 -100 L-143 -129 Q-143 -132 -140 -132 H-75 V-100 Z M-64 -100 V-132 H8 Q12 -132 15 -129 L55 -100 Z',
      fog: 'M-70 -97 V-30 M66 -96 L65 -42', grepp: 'M-62 -90 h14',
      stot: [[-206, -59, 16, 29], [190, -59, 17, 29]], spegel: [60, -99],
      fram: [195, -76, 5, 13], blink: [186, -71, 8, 8], bak: [-201, -98, 6, 23],
    },
    // Mercedes W124: kilen med kromlister kring rutorna och grå plastpaneler längs sidan
    w124: {
      L: 474, hj: [-125, 155], r: 31, nav: 'hal', belt: -97, list: [-60, -56], tak: [-107, 28, -143], forare: [8, -118], kjol: '#55595e',
      kaross: 'M-233 -26 L-237 -36 V-97 Q-237 -104 -230 -105 L-162 -108 L-122 -138 Q-116 -143 -107 -143 H28 Q37 -143 43 -138 L100 -98 L226 -88 Q237 -87 237 -76 V-36 L233 -26 Z',
      hus: 'M-154 -101 L-120 -135 Q-116 -139 -108 -139 H27 Q34 -139 38 -134 L91 -97 Z',
      rutor: 'M-142 -100 L-115 -128 Q-112 -133 -106 -133 H-26 V-100 Z M-15 -100 V-133 H26 Q31 -133 34 -130 L81 -100 Z',
      krom: 'M-154 -101 L-120 -135 Q-116 -139 -108 -139 H27 Q34 -139 38 -134 L91 -97 M-150 -98 H88',
      fog: 'M-21 -97 V-28 M92 -96 L91 -42 M-146 -97 V-72', grepp: 'M-44 -89 h14 M62 -89 h14',
      stot: [[-242, -61, 10, 27], [232, -61, 10, 27]], spegel: [88, -99], spegelLack: true, stjarna: [221, -88.4],
      fram: [232, -79, 6, 13], blink: [224, -79, 8, 13], bak: [-238, -104, 8, 30],
    },
    // Ford Sierra: den runda kilen med sned nos och en tredje sidoruta
    sierra: {
      L: 443, hj: [-121, 140], r: 30, nav: 'stal', belt: -96, list: [-58, -50], tak: [-120, 8, -139], forare: [-8, -115],
      kaross: 'M-217 -26 L-221 -36 V-90 Q-221 -100 -214 -103 L-194 -110 Q-172 -132 -140 -137 Q-128 -139 -110 -139 H8 Q20 -139 30 -132 L94 -94 L208 -82 Q221 -80 221 -68 V-36 L217 -26 Z',
      hus: 'M-198 -97 Q-172 -127 -140 -133 Q-128 -135 -110 -135 H7 Q17 -135 25 -129 L86 -94 Z',
      rutor: 'M-186 -99 Q-166 -121 -142 -128 L-130 -130 V-99 Z M-121 -99 V-131 H-30 V-99 Z M-20 -99 V-131 H6 Q15 -131 21 -126 L74 -98 Z',
      fog: 'M-25 -97 V-30 M88 -93 L87 -40 M-126 -97 V-72', grepp: 'M-54 -89 h13 M52 -88 h13',
      stot: [[-226, -57, 9, 23], [214, -55, 10, 21]], spegel: [80, -96],
      fram: [215, -71, 7, 12], blink: [208, -71, 8, 9], bak: [-222, -99, 6, 25],
    },
    // Opel Kadett, Ford Escort, Mazda 323: kompakt halvkombi med sluttande baklucka
    kadett: {
      L: 400, hj: [-130, 122], r: 29, nav: 'stal', belt: -96, list: [-58, -51], tak: [-130, 6, -138], forare: [-10, -115],
      kaross: 'M-196 -26 L-200 -36 V-88 Q-200 -98 -196 -101 L-186 -104 L-146 -133 Q-140 -138 -130 -138 H6 Q16 -138 24 -132 L84 -94 L188 -83 Q200 -81 200 -70 V-36 L196 -26 Z',
      hus: 'M-180 -97 L-146 -129 Q-142 -134 -133 -134 H5 Q12 -134 18 -130 L76 -95 Z',
      rutor: 'M-166 -100 L-144 -122 Q-141 -126 -136 -126 H-129 V-100 Z M-121 -99 V-130 H-34 V-99 Z M-24 -99 V-130 H4 Q10 -130 15 -127 L66 -99 Z',
      fog: 'M-29 -97 V-30 M78 -94 L77 -40 M-125 -97 V-66', grepp: 'M-58 -89 h13 M46 -88 h13',
      stot: [[-205, -57, 11, 25], [192, -55, 11, 23]], spegel: [72, -96],
      fram: [195, -73, 6, 12], blink: [188, -73, 8, 9], bak: [-201, -98, 6, 25],
    },
    // Toyota Corolla, Nissan Sunny, Opel Vectra: liten sedan med kort, hög bagagelucka
    corolla: {
      L: 430, hj: [-113, 130], r: 29, nav: 'plat', belt: -96, list: [-58, -52], tak: [-102, 12, -138], forare: [-2, -114],
      kaross: 'M-211 -26 L-215 -36 V-94 Q-215 -101 -208 -102 L-150 -104 L-116 -133 Q-110 -138 -102 -138 H12 Q22 -138 29 -132 L88 -95 L204 -84 Q215 -82 215 -72 V-36 L211 -26 Z',
      hus: 'M-144 -98 L-114 -131 Q-110 -134 -103 -134 H11 Q18 -134 23 -129 L80 -95 Z',
      rutor: 'M-132 -99 L-110 -126 Q-107 -130 -102 -130 H-24 V-99 Z M-14 -99 V-130 H10 Q16 -130 20 -127 L70 -99 Z',
      fog: 'M-19 -97 V-30 M82 -94 L81 -40 M-128 -97 V-68', grepp: 'M-44 -89 h13 M54 -88 h13',
      stot: [[-220, -55, 9, 23], [208, -53, 9, 21]], spegel: [76, -97],
      fram: [209, -75, 6, 12], blink: [202, -75, 7, 9], bak: [-216, -101, 6, 23],
    },
    // BMW 3-serie och Audi 80: kantig liten sedan med tunna stolpar och knycken i bakre sidorutan
    e30: {
      L: 433, hj: [-115, 142], r: 29, nav: 'ekrar', belt: -98, list: [-60, -54], tak: [-103, 26, -138], forare: [6, -114],
      kaross: 'M-213 -26 L-216 -36 V-94 Q-216 -100 -210 -101 L-148 -103 L-116 -134 Q-111 -138 -103 -138 H26 Q34 -138 39 -133 L92 -96 L208 -90 Q216 -89 216 -80 V-36 L213 -26 Z',
      hus: 'M-142 -98 L-114 -132 Q-111 -135 -104 -135 H25 Q31 -135 35 -131 L86 -96 Z',
      rutor: 'M-128 -100 L-118 -111 L-106 -127 Q-103 -131 -98 -131 H-22 V-100 Z M-12 -100 V-131 H24 Q29 -131 32 -128 L78 -100 Z',
      fog: 'M-17 -98 V-30 M86 -95 L85 -42 M-130 -98 V-68', grepp: 'M-40 -90 h13 M58 -90 h13',
      stot: [[-221, -57, 11, 21], [209, -57, 11, 21]], spegel: [80, -99],
      fram: [210, -85, 6, 11], blink: [203, -71, 8, 7], bak: [-217, -99, 6, 21],
    },
    // Peugeot 205, Fiat Uno, Renault 5: den lilla halvkombin
    p205: {
      L: 371, hj: [-127, 115], r: 28, nav: 'stal', belt: -95, list: [-56, -50], tak: [-134, 4, -136], forare: [-14, -113],
      kaross: 'M-181 -26 L-185 -36 V-88 Q-185 -98 -182 -102 L-174 -106 L-148 -131 Q-143 -136 -134 -136 H4 Q14 -136 21 -130 L76 -92 L174 -82 Q185 -81 185 -70 V-36 L181 -26 Z',
      hus: 'M-167 -96 L-146 -127 Q-143 -132 -135 -132 H3 Q10 -132 15 -128 L68 -94 Z',
      rutor: 'M-156 -98 L-142 -120 Q-140 -123 -136 -123 H-121 V-98 Z M-112 -98 V-128 H-40 V-98 Z M-30 -98 V-128 H2 Q8 -128 12 -125 L58 -98 Z',
      fog: 'M-35 -96 V-30 M70 -92 L69 -40 M-116 -96 V-62', grepp: 'M-62 -88 h12 M40 -87 h12',
      stot: [[-190, -55, 10, 23], [178, -53, 10, 21]], spegel: [62, -95],
      fram: [180, -73, 5, 11], blink: [174, -73, 7, 8], bak: [-186, -97, 5, 23],
    },
    // skåpbilen: hög låda med kort nos, skjutdörr och glas bara fram
    skap: {
      L: 490, hj: [-150, 150], r: 33, nav: 'stal', belt: -124, list: [-70, -64], tak: [-235, 126, -210], forare: [128, -158], hog: true,
      kaross: 'M-241 -32 L-245 -42 V-200 Q-245 -210 -235 -210 H126 Q142 -210 150 -198 L192 -122 L234 -112 Q245 -109 245 -96 V-42 L241 -32 Z',
      hus: 'M106 -122 V-196 H128 Q138 -196 144 -188 L183 -122 Z',
      rutor: 'M112 -126 V-190 H126 Q134 -190 139 -184 L175 -126 Z',
      fog: 'M101 -200 V-34 M-20 -203 V-34 M-122 -203 V-34 M-122 -150 H-20', grepp: 'M82 -112 h14 M-34 -112 h12',
      stot: [[-251, -63, 12, 31], [237, -63, 12, 31]], spegel: [178, -128],
      fram: [239, -93, 6, 15], blink: [230, -93, 10, 12], bak: [-245, -114, 6, 44],
    },
    // Volkswagen Transporter (T3): platt front, föraren ovanför framhjulen och motorns galler baktill
    t3: {
      L: 457, hj: [-108, 138], r: 32, nav: 'stal', belt: -116, list: [-70, -64], tak: [-216, 184, -194], forare: [176, -156], hog: true,
      kaross: 'M-224 -30 L-228 -40 V-182 Q-228 -194 -216 -194 H184 Q197 -194 201 -183 L221 -116 Q228 -110 228 -98 V-40 L224 -30 Z',
      hus: 'M150 -114 V-184 H184 Q193 -184 196 -177 L215 -114 Z',
      rutor: 'M156 -118 V-178 H182 Q189 -178 191 -173 L208 -118 Z',
      fog: 'M146 -186 V-34 M28 -186 V-34 M-120 -186 V-124', grepp: 'M128 -110 h16 M42 -110 h14',
      galler: 'M-212 -168 h22 M-212 -163 h22 M-212 -158 h22 M-212 -153 h22 M-212 -148 h22',
      stot: [[-234, -63, 11, 27], [222, -63, 11, 27]], spegel: [212, -128],
      fram: [223, -102, 5, 16], blink: [219, -82, 8, 8], bak: [-229, -116, 6, 32],
    },
    // De äldre som fanns kvar på gatorna på nittiotalet (sextio- och sjuttiotalets bilar, med kromade stötfångare):
    // Volvo Amazon: de runda framskärmarna, kromlisten från strålkastaren bakåt och de små fenorna bak
    amazon: {
      L: 445, hj: [-120, 140], r: 32, nav: 'plat', belt: -101, list: [-40, -37], listKrom: true, tak: [-100, 14, -150], forare: [-6, -122],
      kaross: 'M-214 -34 Q-222 -40 -222 -60 V-80 Q-222 -95 -212 -98 L-152 -104 Q-142 -130 -118 -145 Q-106 -151 -86 -151 H2 Q24 -151 36 -140 L72 -102 Q130 -100 176 -97 Q204 -95 212 -84 Q218 -74 218 -58 L216 -40 Q214 -34 208 -34 Z',
      hus: 'M-146 -100 Q-136 -127 -116 -141 Q-105 -147 -86 -147 H2 Q20 -147 30 -138 L66 -100 Z',
      rutor: 'M-138 -103 Q-129 -125 -113 -137 Q-104 -142 -88 -142 H-34 V-103 Z M-24 -103 V-142 H2 Q16 -142 24 -135 L58 -103 Z',
      krom: 'M-146 -100 Q-136 -127 -116 -141 Q-105 -147 -86 -147 H2 Q20 -147 30 -138 L66 -100 M26 -103 L18 -138 M206 -82 Q150 -80 100 -74 L-216 -72',
      fog: 'M64 -100 Q60 -66 62 -38 M-29 -101 V-38 M-136 -101 V-76', grepp: 'M-50 -92 h14 M38 -92 h14',
      stot: [[-228, -56, 20, 11], [210, -56, 20, 11], [-224, -68, 7, 26], [215, -68, 7, 26]], stotKrom: true,
      fram: [211, -90, 7, 14], blink: [208, -67, 8, 7], bak: [-224, -94, 6, 22],
    },
    // Volvo PV 444/544: puckelryggen, den lodräta grillen och strålkastarna högt upp på skärmarna
    pv: {
      L: 445, hj: [-120, 140], r: 33, nav: 'plat', belt: -110, list: [-42, -39], listKrom: true, tak: [-60, 20, -156], forare: [-6, -126],
      kaross: 'M-210 -34 Q-220 -36 -221 -50 Q-222 -70 -212 -84 Q-186 -112 -140 -136 Q-100 -156 -40 -156 H8 Q30 -156 40 -146 L70 -110 Q130 -104 180 -95 Q206 -90 212 -76 Q218 -60 214 -44 Q212 -34 204 -34 Z',
      hus: 'M-150 -106 Q-120 -132 -84 -146 Q-64 -152 -40 -152 H7 Q24 -152 33 -144 L62 -108 Z',
      rutor: 'M-138 -110 Q-112 -133 -82 -144 Q-66 -148 -50 -148 H-34 V-110 Z M-24 -110 V-148 H6 Q20 -148 27 -142 L54 -110 Z',
      krom: 'M-150 -106 Q-120 -132 -84 -146 Q-64 -152 -40 -152 H7 Q24 -152 33 -144 L62 -108',
      fog: 'M66 -108 Q62 -70 64 -40 M-29 -107 V-40 M64 -88 Q120 -96 160 -98 Q196 -96 208 -84 M-40 -62 Q-90 -84 -150 -86 Q-196 -84 -214 -72',
      grepp: 'M-44 -100 h13',
      stot: [[-226, -58, 18, 11], [206, -58, 18, 11], [-222, -70, 7, 26], [211, -70, 7, 26]], stotKrom: true,
      fram: [205, -94, 7, 14], blink: [200, -70, 8, 7], bak: [-219, -86, 5, 14],
    },
    // Volvo 144: som 240:n men slankare, med låg front, smala kromade stötfångare och lodräta baklyktor
    v144: {
      L: 464, hj: [-113, 147], r: 31, nav: 'plat', belt: -98, list: [-62, -59], listKrom: true, tak: [-104, 30, -143], forare: [4, -116],
      kaross: 'M-228 -30 L-231 -38 V-96 Q-231 -102 -224 -102 L-156 -104 Q-150 -105 -146 -109 L-112 -139 Q-107 -143 -99 -143 H34 Q43 -143 48 -139 L98 -98 L222 -92 Q231 -91 231 -82 V-38 L228 -30 Z',
      hus: 'M-146 -96 L-112 -135 Q-108 -139 -100 -139 H33 Q39 -139 43 -135 L90 -96 Z',
      rutor: 'M-132 -100 L-106 -130 Q-103 -135 -98 -135 H-26 V-100 Z M-16 -100 V-135 H32 Q36 -135 38 -132 L82 -100 Z',
      krom: 'M-146 -96 L-112 -135 Q-108 -139 -100 -139 H33 Q39 -139 43 -135 L90 -96 M52 -100 L40 -132',
      fog: 'M-21 -98 V-32 M88 -97 L87 -40 M-136 -98 V-74', grepp: 'M-44 -90 h14 M60 -90 h14',
      stot: [[-238, -60, 14, 10], [224, -60, 14, 10]], stotKrom: true, spegel: [86, -100],
      fram: [225, -82, 6, 12], blink: [223, -66, 8, 7], bak: [-233, -100, 6, 32],
    },
    // Saab 96: droppen, med den sluttande ryggen och den långa, nedåtböjda nosen
    s96: {
      L: 420, hj: [-132, 118], r: 30, nav: 'plat', belt: -106, list: [-44, -41], tak: [-60, 10, -148], forare: [-10, -120],
      kaross: 'M-204 -32 Q-212 -38 -212 -56 Q-212 -78 -198 -94 Q-170 -122 -120 -138 Q-80 -148 -30 -148 H2 Q24 -148 36 -140 L64 -106 Q140 -102 182 -92 Q204 -86 208 -70 Q212 -54 208 -40 Q206 -32 198 -32 Z',
      hus: 'M-150 -102 Q-124 -126 -96 -138 Q-70 -144 -30 -144 H1 Q18 -144 28 -138 L56 -104 Z',
      rutor: 'M-138 -106 Q-118 -124 -96 -134 Q-74 -140 -56 -140 V-106 Z M-46 -106 V-140 H0 Q14 -140 22 -134 L48 -106 Z',
      fog: 'M56 -104 Q52 -70 54 -38 M-51 -105 V-38', grepp: 'M-44 -96 h12',
      stot: [[-218, -58, 14, 20], [202, -58, 14, 20]], spegel: [56, -106],
      fram: [203, -80, 6, 12], blink: [198, -60, 8, 7], bak: [-213, -92, 6, 16],
    },
    // Saab 99: tvådörrars, med den runda vindrutan, hög midja och kort nos
    s99: {
      L: 435, hj: [-111, 136], r: 31, nav: 'plat', belt: -104, list: [-60, -53], tak: [-108, 14, -144], forare: [-8, -118],
      kaross: 'M-212 -30 L-216 -40 V-94 Q-216 -101 -208 -102 L-160 -104 Q-150 -112 -134 -128 Q-118 -144 -104 -144 H16 Q26 -144 32 -138 L60 -102 Q150 -98 202 -90 Q214 -88 216 -78 V-40 L212 -30 Z',
      hus: 'M-152 -100 Q-138 -116 -126 -128 Q-114 -140 -104 -140 H15 Q22 -140 27 -135 L54 -100 Z',
      rutor: 'M-140 -104 Q-128 -118 -120 -126 Q-110 -136 -102 -136 H-62 V-104 Z M-52 -104 V-136 H14 Q19 -136 23 -132 L48 -104 Z',
      fog: 'M54 -102 L52 -36 M-58 -103 V-36', grepp: 'M-50 -94 h13',
      stot: [[-222, -60, 12, 26], [210, -60, 12, 26]], spegel: [52, -102],
      fram: [209, -82, 7, 12], blink: [205, -66, 8, 7], bak: [-217, -98, 6, 24],
    },
    // Volkswagen typ 1, Bubblan: den runda kupan, skärmarna för sig och fotsteget emellan
    bubbla: {
      L: 407, hj: [-114, 126], r: 32, nav: 'plat', belt: -110, list: [-62, -60], listKrom: true, tak: [-80, 10, -152], forare: [-12, -124],
      kaross: 'M-200 -36 Q-205 -44 -204 -62 Q-200 -88 -172 -112 Q-130 -146 -60 -152 H-10 Q22 -152 34 -142 L58 -112 Q132 -110 176 -92 Q202 -80 205 -60 Q206 -44 200 -36 Z',
      flank: 'M76 -38 Q82 -80 128 -91 Q176 -94 196 -78 Q207 -64 205 -44 L201 -38 Z M-64 -38 Q-70 -80 -114 -92 Q-170 -96 -192 -80 Q-206 -66 -205 -46 L-201 -38 Z',
      hus: 'M-126 -106 Q-118 -128 -90 -140 Q-64 -148 -20 -148 H-6 Q18 -148 28 -140 L50 -108 Z',
      rutor: 'M-114 -110 Q-104 -128 -84 -136 Q-66 -142 -46 -142 V-110 Z M-36 -110 V-143 H-6 Q14 -143 22 -137 L44 -110 Z',
      krom: 'M30 -110 L20 -139',
      fog: 'M52 -110 Q57 -80 54 -44 M-40 -110 V-44', grepp: 'M-32 -100 h12',
      stot: [[-212, -54, 16, 9], [196, -54, 16, 9]], stotKrom: true, skarm: [[-66, -44, 144, 8]],
      fram: [190, -90, 9, 14], blink: [150, -97, 9, 5], bak: [-204, -86, 6, 18],
    },
    // Mercedes W123: upprätt och tung, med krom kring rutorna, längs sidan och på stötfångarna
    w123: {
      L: 472, hj: [-131, 149], r: 31, nav: 'plat', belt: -103, list: [-48, -43], tak: [-114, 30, -144], forare: [8, -118],
      kaross: 'M-230 -30 L-234 -40 V-98 Q-234 -104 -227 -105 L-160 -107 L-126 -138 Q-120 -144 -110 -144 H26 Q35 -144 40 -139 L92 -100 L224 -94 Q234 -93 234 -84 V-40 L230 -30 Z',
      hus: 'M-152 -102 L-123 -134 Q-118 -139 -110 -139 H25 Q32 -139 36 -135 L84 -99 Z',
      rutor: 'M-140 -103 L-117 -129 Q-114 -134 -108 -134 H-26 V-103 Z M-15 -103 V-134 H24 Q29 -134 32 -131 L74 -103 Z',
      krom: 'M-152 -102 L-123 -134 Q-118 -139 -110 -139 H25 Q32 -139 36 -135 L84 -99 M-148 -100 H82 M-232 -46 H232',
      fog: 'M-21 -100 V-30 M86 -98 L85 -40 M-144 -100 V-74', grepp: 'M-44 -92 h14 M62 -92 h14',
      stot: [[-242, -62, 14, 22], [228, -62, 14, 22]], stotKrom: true, spegel: [86, -100], stjarna: [219, -94.2],
      fram: [229, -84, 6, 14], blink: [222, -84, 8, 14], bak: [-236, -102, 8, 28],
    },
    // Citroën 2CV, Ankan: hög och smal, med tygtaket, den räfflade huven, de svepande framskärmarna och kjolen bak
    ank: {
      L: 383, hj: [-118, 122], r: 31, nav: 'stal', enkel: true, belt: -114, list: [-40, -40], tak: [-170, 30, -162], forare: [-10, -128],
      kaross: 'M-184 -34 Q-196 -38 -197 -56 L-190 -98 Q-184 -134 -156 -152 Q-128 -162 -60 -162 H0 Q30 -162 40 -150 L48 -118 Q110 -110 160 -94 Q174 -88 176 -76 L178 -50 Q178 -36 170 -34 Z',
      duk: 'M-200 -147 L-190 -98 Q-184 -134 -156 -152 Q-128 -162 -60 -162 H0 Q30 -162 40 -150 L41 -147 Z',
      flank: 'M34 -36 Q40 -70 80 -84 Q130 -98 170 -94 Q190 -90 192 -70 L190 -46 Q188 -38 180 -38 Z',
      efter: 'M-66 -40 Q-66 -84 -112 -92 Q-164 -96 -188 -82 Q-198 -70 -197 -50 L-195 -40 Z',
      hus: 'M-180 -110 Q-176 -134 -154 -147 H30 Q36 -148 38 -144 L46 -112 Z',
      rutor: 'M-173 -114 Q-169 -133 -151 -143 H-130 V-114 Z M-122 -114 V-143 H-50 V-114 Z M-42 -114 V-143 H30 L38 -114 Z',
      galler: 'M58 -113 L146 -99 M60 -106 L122 -96',
      fog: 'M40 -116 L36 -40 M-46 -114 V-40 M-126 -114 V-62', grepp: 'M-60 -104 h10 M22 -104 h10',
      stot: [[-203, -50, 12, 8], [182, -50, 12, 8]], stotKrom: true,
      fram: [144, -110, 12, 13], blink: [176, -82, 6, 6], bak: [-197, -82, 5, 12],
    },
    // Lada Niva: den lilla lådan på höga hjul, med raka sidor och stora hjulhus
    niva: {
      L: 372, hj: [-104, 116], r: 35, nav: 'stal', belt: -116, list: [-62, -56], tak: [-176, 20, -164], forare: [-6, -136], rails: 'kanske',
      kaross: 'M-182 -40 L-186 -50 V-154 Q-186 -164 -176 -164 H22 Q30 -164 34 -158 L62 -114 L176 -108 Q186 -107 186 -98 V-50 L182 -40 Z',
      hus: 'M-182 -112 V-156 Q-182 -160 -176 -160 H21 Q27 -160 30 -155 L56 -112 Z',
      rutor: 'M-176 -116 V-154 Q-176 -156 -172 -156 H-70 V-116 Z M-60 -116 V-156 H20 Q24 -156 26 -152 L50 -116 Z',
      fog: 'M56 -114 L54 -44 M-64 -114 V-44', grepp: 'M-56 -104 h14',
      stot: [[-192, -62, 12, 20], [180, -62, 12, 20]], stotKrom: true, spegel: [56, -114],
      fram: [180, -100, 6, 14], blink: [178, -80, 7, 8], bak: [-188, -104, 5, 26],
    },
    // Mini: den lilla lådan på tiotumshjul, ofta med vitt tak
    mini: {
      L: 305, hj: [-101, 103], r: 22, nav: 'stal', belt: -94, list: [-28, -26], tak: [-118, 20, -134], forare: [-6, -108],
      kaross: 'M-148 -22 L-152 -30 V-88 Q-152 -93 -146 -93 L-140 -94 L-128 -126 Q-124 -134 -114 -134 H22 Q30 -134 34 -128 L56 -92 L140 -86 Q150 -85 151 -76 L152 -30 L148 -22 Z',
      duk: 'M-140 -118 L-128 -126 Q-124 -134 -114 -134 H22 Q30 -134 34 -128 L36 -125 H-140 Z', dukFarg: '#e7e3d8', dukKanske: true,
      hus: 'M-136 -90 L-127 -120 Q-123 -127 -114 -127 H20 Q26 -127 29 -123 L50 -90 Z',
      rutor: 'M-128 -94 L-121 -118 Q-119 -123 -113 -123 H-56 V-94 Z M-48 -94 V-123 H19 Q23 -123 25 -119 L44 -94 Z',
      fog: 'M50 -92 L48 -26 M-52 -94 V-26 M56 -92 L58 -26', grepp: 'M-44 -84 h10',
      stot: [[-156, -42, 12, 8], [146, -42, 12, 8]], stotKrom: true, spegel: [46, -94],
      fram: [143, -78, 8, 13], blink: [146, -56, 6, 6], bak: [-153, -80, 5, 16],
    },
    // Volvo 145, herrgårdsvagnen: 144:an med det långa taket och lodrät baklucka
    v145: {
      L: 464, hj: [-113, 147], r: 31, nav: 'plat', belt: -98, list: [-62, -59], listKrom: true, tak: [-221, 30, -144], forare: [4, -116], rails: 'kanske',
      kaross: 'M-228 -30 L-231 -38 V-134 Q-231 -144 -221 -144 H34 Q43 -143 48 -139 L98 -98 L222 -92 Q231 -91 231 -82 V-38 L228 -30 Z',
      hus: 'M-227 -96 V-135 Q-227 -140 -220 -140 H33 Q39 -139 43 -135 L90 -96 Z',
      rutor: 'M-222 -100 V-133 Q-222 -136 -218 -136 H-136 V-100 Z M-126 -100 V-136 H-26 V-100 Z M-16 -100 V-135 H32 Q36 -135 38 -132 L82 -100 Z',
      krom: 'M-227 -96 V-135 Q-227 -140 -220 -140 H33 Q39 -139 43 -135 L90 -96 M52 -100 L40 -132',
      fog: 'M-21 -98 V-32 M88 -97 L87 -40 M-131 -98 V-74', grepp: 'M-44 -90 h14 M60 -90 h14',
      stot: [[-238, -60, 14, 10], [224, -60, 14, 10]], stotKrom: true, spegel: [86, -100],
      fram: [225, -82, 6, 12], blink: [223, -66, 8, 7], bak: [-233, -106, 6, 40],
    },
    // Lada 2105/2107: Fiatens låda, med rak huv, upprätta rutor, krom kring dem och kromade stötfångare
    lada: {
      L: 413, hj: [-114, 128], r: 29, nav: 'stal', belt: -97, list: [-62, -58], listKrom: true, tak: [-103, 20, -142], forare: [0, -117],
      kaross: 'M-203 -28 L-206 -38 V-92 Q-206 -96 -202 -96 L-140 -98 L-112 -138 Q-109 -142 -103 -142 H20 Q26 -142 29 -138 L66 -98 L200 -92 Q206 -92 206 -86 V-38 L203 -28 Z',
      hus: 'M-135 -96 L-110 -134 Q-108 -137 -103 -137 H19 Q24 -137 26 -134 L59 -96 Z',
      rutor: 'M-124 -99 L-106 -128 Q-104 -131 -100 -131 H-24 V-99 Z M-14 -99 V-131 H18 Q22 -131 24 -128 L50 -99 Z',
      krom: 'M-135 -96 L-110 -134 Q-108 -137 -103 -137 H19 Q24 -137 26 -134 L59 -96 M-132 -98 H58',
      fog: 'M-19 -97 V-30 M62 -96 L61 -40 M-128 -97 V-72', grepp: 'M-44 -90 h13 M46 -90 h13',
      stot: [[-214, -60, 14, 14], [200, -60, 14, 14]], stotKrom: true, spegel: [58, -98],
      fram: [200, -86, 6, 14], blink: [198, -68, 8, 7], bak: [-207, -94, 6, 24],
    },
    // Volvo 440: den kilformade halvkombin med hög bakdel, kort lucka och stora svarta stötfångare
    v440: {
      L: 431, hj: [-120, 130], r: 29, nav: 'stal', belt: -97, list: [-60, -53], tak: [-134, 8, -138], forare: [-8, -115],
      kaross: 'M-212 -26 L-215 -36 V-108 Q-215 -114 -209 -115 L-196 -116 L-150 -136 Q-144 -138 -134 -138 H8 Q16 -138 22 -133 L76 -94 L204 -86 Q215 -84 215 -74 V-36 L212 -26 Z',
      hus: 'M-190 -96 V-112 L-150 -131 Q-146 -133 -138 -133 H7 Q13 -133 17 -129 L68 -95 Z',
      rutor: 'M-184 -100 V-110 L-152 -126 Q-150 -127 -146 -127 H-130 V-100 Z M-121 -100 V-129 H-32 V-100 Z M-22 -100 V-129 H6 Q11 -129 15 -125 L60 -100 Z',
      fog: 'M-27 -97 V-30 M70 -94 L69 -40 M-126 -97 V-70', grepp: 'M-56 -89 h13 M48 -88 h13',
      stot: [[-224, -58, 14, 26], [206, -56, 14, 24]], spegel: [66, -97],
      fram: [208, -76, 6, 13], blink: [200, -76, 8, 10], bak: [-216, -108, 6, 34],
    },
    // Volvo 480: den låga kilen med glasbaklucka och uppfällda strålkastare (de är alltid tända)
    v480: {
      L: 426, hj: [-120, 130], r: 30, nav: 'ekrar', belt: -92, list: [-56, -50], tak: [-150, 0, -132], forare: [-14, -110],
      kaross: 'M-210 -28 L-213 -38 V-84 L-205 -118 Q-203 -123 -196 -124 L-150 -130 Q-80 -133 0 -132 Q10 -132 16 -127 L66 -91 L164 -78 L166 -88 H192 L194 -75 L200 -72 Q213 -70 213 -60 V-38 L210 -28 Z',
      hus: 'M-207 -86 L-200 -116 Q-198 -120 -192 -120 L-150 -126 Q-80 -128 -1 -127 Q6 -127 11 -123 L58 -91 Z',
      rutor: 'M-199 -100 L-195 -114 Q-193 -116 -188 -117 L-150 -122 Q-110 -123 -80 -123 V-92 Z M-70 -92 V-123 H-2 Q4 -123 8 -119 L50 -92 Z',
      fog: 'M-75 -90 V-30 M60 -90 L59 -40 M-205 -86 L-207 -66', grepp: 'M-66 -82 h13',
      stot: [[-220, -56, 12, 22], [205, -50, 12, 20]], spegel: [56, -92], spegelLack: true,
      fram: [190, -86, 5, 10], blink: [204, -58, 8, 6], bak: [-214, -80, 6, 20],
    },
    // Mercedes 190: den lilla W124:an, kortare och med högre bagagelucka
    w201: {
      L: 442, hj: [-121, 145], r: 30, nav: 'hal', belt: -96, list: [-60, -56], tak: [-102, 24, -138], forare: [6, -115], kjol: '#55595e',
      kaross: 'M-218 -26 L-221 -36 V-96 Q-221 -103 -214 -104 L-152 -106 L-116 -134 Q-110 -138 -102 -138 H24 Q33 -138 38 -133 L92 -96 L212 -88 Q221 -87 221 -77 V-36 L218 -26 Z',
      hus: 'M-146 -99 L-114 -131 Q-110 -134 -103 -134 H23 Q30 -134 34 -129 L84 -96 Z',
      rutor: 'M-134 -99 L-110 -124 Q-107 -128 -101 -128 H-24 V-99 Z M-14 -99 V-128 H22 Q27 -128 30 -125 L74 -99 Z',
      krom: 'M-146 -99 L-114 -131 Q-110 -134 -103 -134 H23 Q30 -134 34 -129 L84 -96 M-142 -97 H80',
      fog: 'M-19 -96 V-28 M86 -95 L85 -42 M-138 -96 V-72', grepp: 'M-42 -88 h13 M58 -88 h13',
      stot: [[-226, -61, 9, 26], [216, -61, 9, 26]], spegel: [84, -98], spegelLack: true, stjarna: [207, -88.3],
      fram: [216, -78, 6, 12], blink: [209, -78, 8, 12], bak: [-222, -102, 7, 28],
    },
    // Audi 100: den släta, strömlinjeformade sedanen med rutorna i jämnhöjd med plåten och en liten tredje sidoruta
    a100: {
      L: 479, hj: [-130, 139], r: 31, nav: 'plat', belt: -98, list: [-58, -52], tak: [-108, 20, -142], forare: [2, -117],
      kaross: 'M-236 -28 L-240 -38 V-94 Q-240 -102 -232 -104 L-170 -108 Q-150 -122 -128 -136 Q-120 -142 -108 -142 H20 Q32 -142 40 -136 L100 -96 Q170 -92 228 -84 Q240 -82 240 -72 V-38 L236 -28 Z',
      hus: 'M-160 -100 Q-144 -116 -126 -131 Q-118 -137 -108 -137 H19 Q29 -137 35 -132 L92 -96 Z',
      rutor: 'M-151 -100 Q-141 -111 -130 -120 V-100 Z M-122 -100 V-126 Q-116 -132 -108 -132 H-30 V-100 Z M-20 -100 V-132 H18 Q26 -132 31 -128 L82 -100 Z',
      fog: 'M-25 -98 V-30 M92 -96 L91 -42 M-126 -98 V-72', grepp: 'M-54 -90 h13 M58 -89 h13',
      stot: [[-246, -60, 8, 22], [234, -58, 8, 20]], spegel: [86, -98], spegelLack: true,
      fram: [233, -76, 7, 12], blink: [226, -76, 7, 10], bak: [-241, -100, 6, 26],
    },
    // VW Passat kombi, och de andra mellanstora kombibilarna (Audi 100 Avant, Mazda 626, Carina, Omega): runda hörn
    passat: {
      L: 457, hj: [-128, 134], r: 30, nav: 'plat', belt: -97, list: [-58, -52], tak: [-212, 18, -142], forare: [0, -117], rails: 'kanske',
      kaross: 'M-225 -28 L-228 -38 V-98 L-224 -132 Q-222 -142 -212 -142 H18 Q28 -142 35 -136 L94 -96 L218 -86 Q229 -84 229 -74 V-38 L225 -28 Z',
      hus: 'M-222 -97 L-218 -132 Q-217 -137 -210 -137 H17 Q25 -137 30 -132 L86 -95 Z',
      rutor: 'M-216 -100 L-213 -130 Q-212 -133 -207 -133 H-150 V-100 Z M-140 -100 V-133 H-28 V-100 Z M-18 -100 V-133 H16 Q22 -133 26 -129 L76 -100 Z',
      fog: 'M-23 -97 V-30 M88 -95 L87 -42 M-145 -98 V-72', grepp: 'M-50 -89 h13 M56 -88 h13',
      stot: [[-234, -58, 9, 22], [223, -56, 9, 20]], spegel: [80, -98],
      fram: [222, -76, 7, 12], blink: [215, -76, 7, 10], bak: [-229, -104, 6, 30],
    },
    // Citroën BX: den vassa kilen med låg nos, sluttande lucka och kjol över bakhjulet
    bx: {
      L: 423, hj: [-136, 130], r: 29, nav: 'plat', belt: -96, list: [-56, -50], tak: [-104, -10, -136], forare: [-18, -112],
      kaross: 'M-208 -28 L-212 -38 V-100 Q-212 -106 -206 -107 L-198 -108 L-104 -136 H-10 Q-2 -136 6 -130 L72 -92 L200 -72 Q211 -70 211 -62 V-38 L208 -28 Z',
      hus: 'M-192 -96 L-104 -131 H-11 Q-4 -131 2 -127 L64 -92 Z',
      rutor: 'M-180 -98 L-108 -125 Q-104 -126 -100 -126 V-98 Z M-90 -98 V-127 H-30 V-96 Z M-20 -96 V-127 H-12 Q-6 -127 -1 -123 L52 -93 Z',
      efter: 'M-171 -42 V-58 Q-171 -65 -163 -65 H-109 Q-101 -65 -101 -58 V-42 Z',
      fog: 'M-25 -96 V-30 M66 -91 L65 -40 M-95 -97 V-50', grepp: 'M-58 -88 h12 M44 -86 h12',
      stot: [[-218, -56, 10, 22], [205, -52, 10, 18]], spegel: [62, -94],
      fram: [203, -66, 8, 9], blink: [195, -66, 8, 7], bak: [-213, -100, 6, 20],
    },
    // Jeep Cherokee: lådan på höga hjul, med svart plast nertill och takräcke
    jeep: {
      L: 424, hj: [-122, 136], r: 34, nav: 'ekrar', belt: -113, list: [-66, -60], tak: [-202, 22, -160], forare: [-4, -134], rails: 'kanske', kjol: '#2a2b2e',
      kaross: 'M-209 -40 L-212 -50 V-150 Q-212 -160 -202 -160 H22 Q30 -160 34 -154 L68 -110 L204 -104 Q212 -103 212 -95 V-50 L209 -40 Z',
      hus: 'M-208 -112 V-152 Q-208 -155 -202 -155 H21 Q27 -155 30 -151 L61 -110 Z',
      rutor: 'M-202 -114 V-150 H-128 V-114 Z M-118 -114 V-150 H-30 V-114 Z M-20 -114 V-150 H20 Q24 -150 26 -147 L54 -114 Z',
      fog: 'M-25 -112 V-46 M63 -108 L62 -50 M-123 -112 V-62', grepp: 'M-52 -104 h14 M48 -104 h14',
      stot: [[-218, -68, 12, 22], [206, -68, 12, 22]], spegel: [62, -112], emblem: ['CHEROKEE', 18, -77, 7, 'dekal'],
      fram: [206, -100, 6, 12], blink: [204, -86, 8, 8], bak: [-213, -122, 5, 36],
    },
    // Chrysler Voyager: enlådsbilen med kort nos och skjutdörr (ibland storbilstaxi)
    voyager: {
      L: 470, hj: [-145, 145], r: 32, nav: 'plat', belt: -108, list: [-62, -56], tak: [-224, 30, -170], forare: [44, -138],
      kaross: 'M-232 -28 L-235 -38 V-160 Q-234 -170 -224 -170 H30 Q40 -170 46 -163 L114 -108 L224 -90 Q235 -88 235 -78 V-38 L232 -28 Z',
      hus: 'M-231 -106 V-160 Q-231 -165 -224 -165 H29 Q37 -165 41 -160 L106 -106 Z',
      rutor: 'M-226 -110 V-158 Q-226 -160 -222 -160 H-120 V-110 Z M-110 -110 V-160 H8 V-110 Z M18 -110 V-160 H28 Q34 -160 38 -156 L96 -110 Z',
      fog: 'M13 -108 V-30 M106 -106 L104 -42 M-116 -108 V-30 M-116 -84 H8', grepp: 'M-12 -98 h14 M84 -98 h14',
      stot: [[-241, -60, 10, 24], [229, -58, 10, 22]], spegel: [100, -108],
      fram: [228, -86, 7, 13], blink: [222, -86, 7, 10], bak: [-236, -122, 6, 42],
    },
    // Saab 900 cabriolet: tvådörrars med tygtaket, och en varm och torr dag med taket nere (s900cabO nedan)
    s900cab: {
      L: 474, hj: [-120, 132], r: 31, nav: 'turbin', belt: -99, list: [-62, -54], tak: [-106, 4, -142], forare: [-12, -117],
      kaross: 'M-233 -28 L-237 -38 V-90 Q-237 -100 -228 -101 L-180 -103 Q-160 -128 -126 -140 Q-118 -142 -106 -142 H4 Q20 -142 32 -136 L90 -99 Q172 -97 226 -86 Q237 -83 237 -72 V-38 L233 -28 Z',
      duk: 'M-240 -100 H4 V-150 H-240 Z',
      hus: 'M-150 -99 Q-138 -118 -122 -131 Q-116 -135 -106 -135 H3 Q16 -135 26 -129 L82 -98 Z',
      rutor: 'M-140 -101 Q-130 -116 -118 -126 Q-112 -130 -104 -130 H-56 V-101 Z M-46 -101 V-131 H2 Q14 -131 22 -126 L72 -101 Z',
      fog: 'M-52 -99 V-30 M84 -97 L83 -42', grepp: 'M-40 -91 h12',
      stot: [[-243, -61, 12, 27], [230, -61, 13, 27]], spegel: [78, -100], emblem: ['SAAB', 104, -77, 6, 'krom'],
      fram: [232, -77, 6, 12], blink: [222, -77, 10, 10], bak: [-238, -95, 7, 19],
    },
    // Amerikanaren en sommarkväll: lång och låg, med fenor, krom längs sidan, vita däcksidor och ibland vitt tak
    amis: {
      L: 535, hj: [-135, 167], r: 32, nav: 'vit', belt: -96, list: [-48, -45], listKrom: true, tak: [-76, 20, -138], forare: [0, -112],
      kaross: 'M-264 -32 L-268 -42 V-80 Q-268 -90 -262 -92 L-250 -95 L-160 -88 L-120 -94 L-92 -132 Q-86 -138 -76 -138 H20 Q30 -138 36 -132 L72 -96 L256 -86 Q267 -85 267 -76 V-42 L264 -32 Z',
      duk: 'M-130 -95 H70 V-150 H-130 Z', dukFarg: '#ece8dc', dukKanske: true,
      hus: 'M-114 -94 L-88 -128 Q-84 -133 -76 -133 H19 Q27 -133 31 -128 L64 -95 Z',
      rutor: 'M-104 -96 L-84 -124 Q-81 -128 -76 -128 H-10 V-96 Z M0 -96 V-128 H18 Q24 -128 27 -125 L56 -96 Z',
      krom: 'M-114 -94 L-88 -128 Q-84 -133 -76 -133 H19 Q27 -133 31 -128 L64 -95 M-252 -76 Q-100 -72 252 -70',
      fog: 'M-6 -94 V-36 M68 -95 L67 -42', grepp: 'M-24 -86 h14',
      stot: [[-276, -60, 16, 20], [262, -60, 16, 20]], stotKrom: true, spegel: [62, -96], emblem: ['Bel Air', -75, -84, 11, 'skrift'],
      fram: [262, -80, 6, 14], blink: [258, -54, 8, 6], bak: [-270, -92, 6, 14],
    },
  };
  // T3:an som buss (Caravelle): samma kaross med rutor längs hela sidan
  FORM.t3buss = {
    ...FORM.t3,
    hus: 'M-218 -116 V-184 H-118 V-116 Z M-112 -116 V-184 H20 V-116 Z M34 -116 V-184 H144 V-116 Z M150 -114 V-184 H184 Q193 -184 196 -177 L215 -114 Z',
    rutor: 'M-213 -120 V-179 H-123 V-120 Z M-107 -120 V-179 H15 V-120 Z M39 -120 V-179 H139 V-120 Z M156 -118 V-178 H182 Q189 -178 191 -173 L208 -118 Z',
    fog: 'M146 -186 V-34 M28 -116 V-34 M-120 -116 V-60',
  };
  // Ladans kombi (2104): samma nos, taket ända bak
  FORM.lada4 = {
    ...FORM.lada,
    L: 412, tak: [-200, 20, -142], rails: 'kanske',
    kaross: 'M-203 -28 L-206 -38 V-136 Q-206 -142 -200 -142 H20 Q26 -142 29 -138 L66 -98 L200 -92 Q206 -92 206 -86 V-38 L203 -28 Z',
    hus: 'M-202 -96 V-134 Q-202 -137 -198 -137 H19 Q24 -137 26 -134 L59 -96 Z',
    rutor: 'M-198 -99 V-131 H-134 V-99 Z M-124 -99 V-131 H-24 V-99 Z M-14 -99 V-131 H18 Q22 -131 24 -128 L50 -99 Z',
    krom: 'M-202 -96 V-134 Q-202 -137 -198 -137 H19 Q24 -137 26 -134 L59 -96 M-200 -98 H58',
    fog: 'M-19 -97 V-30 M62 -96 L61 -40 M-129 -97 V-72',
    bak: [-207, -110, 6, 40],
  };
  // Saaben med taket nere: bara vindrutan står upp, taket ligger hopvikt bak (sufflett) och de som åker syns
  FORM.s900cabO = {
    ...FORM.s900cab,
    oppen: true, duk: null,
    kaross: 'M-233 -28 L-237 -38 V-90 Q-237 -100 -228 -101 L-180 -103 H44 L28 -137 Q28 -141 33 -139 L90 -99 Q172 -97 226 -86 Q237 -83 237 -72 V-38 L233 -28 Z',
    sufflett: 'M-206 -101 Q-206 -113 -192 -115 H-150 Q-136 -113 -134 -101 Z',
    hus: 'M44 -103 L28 -137 Q28 -140 33 -139 L88 -100 Z',
    rutor: 'M50 -103 L34 -133 L80 -102 Z',
  };
  const BUSS = {
    // stadsbussen, tolv meter: en del med tre dörrar
    buss: { L: 1200, hj: [-255, 340], r: 50, delar: [[-600, 600, true, true]], dorrar: [[420, 530], [-60, 60], [-480, -380]], skylt: [300, 540] },
    // ledbussen, arton meter: två delar och bälgen emellan
    ledbuss: { L: 1800, hj: [-620, 60, 640], r: 50, delar: [[-900, -232, false, true], [-168, 900, true, false]], led: [-232, -168], dorrar: [[720, 830], [180, 290], [-470, -360]], skylt: [600, 840] },
  };
  // Plogbilen: hytt, flak med sandspridare, det sneda plogbladet och det gula blinkljuset.
  const PLOG = { L: 860, hj: [-250, 160], r: 46 };
  // Lastbilen med skåp (distributionsbilen, som en FL6 eller en Scania): frambyggd hytt och skåpet bakom.
  const LASTBIL = { L: 770, hj: [-190, 262], r: 48 };

  // På två hjul, som bilarna i centimeter och vända åt höger: herrcykeln och damcykeln (med stänkskärmar,
  // kedjeskydd och pakethållare), skotern, mopeden (en Puch Maxi) och motorcyklarna (den nakna och sporthojen med
  // kåpan). sadel: där den som åker har höften, axel: axlarna (hur upprätt den sitter), styre: händerna, fot:
  // vristen (på fotpinnen eller golvet; cyklarna trampar runt vev med pedalarmen pv), ram: vägarna för ramen och
  // styret på cyklarna, fram och bak: lyktorna [x, y, b, h].
  const TVA = {
    herr: {
      L: 180, hj: [-54, 52], r: 34, sadel: [-22, -106], axel: [2, -154], styre: [23, -107], vev: [-6, -30], pv: 17,
      ram: 'M-54 -34 L-6 -30 L-16 -88 Z M-16 -88 L34 -94 M-6 -30 L37 -78 M34 -94 L37 -78 Q45 -62 52 -34',
      styret: 'M34 -94 L33 -103 Q31 -108 21 -107', stolpe: 'M-16 -88 L-18 -98',
      sits: 'M-36 -99 Q-24 -104 -8 -100 Q-9 -96 -14 -96 H-31 Q-36 -96 -36 -99 Z', lampa: [38, -86], reflex: [-89, -60],
    },
    dam: {
      L: 180, hj: [-54, 52], r: 34, sadel: [-24, -104], axel: [-14, -156], styre: [19, -112], vev: [-6, -30], pv: 17,
      ram: 'M-54 -34 L-6 -30 L-17 -86 Z M37 -80 Q14 -42 -6 -30 M35 -88 Q10 -60 -14 -62 M35 -96 L37 -80 Q45 -62 52 -34',
      styret: 'M35 -96 L34 -106 Q30 -114 17 -112', stolpe: 'M-17 -86 L-19 -96',
      sits: 'M-38 -97 Q-26 -102 -10 -98 Q-11 -94 -16 -94 H-33 Q-38 -94 -38 -97 Z', lampa: [39, -88], reflex: [-89, -60],
    },
    skoter: {
      L: 172, hj: [-56, 62], r: 22, sadel: [-44, -98], axel: [-22, -148], styre: [34, -118], fot: [6, -47],
      fram: [60, -116, 5, 8], bak: [-103, -64, 4, 9],
    },
    maxi: {
      L: 168, hj: [-54, 56], r: 29, sadel: [-38, -104], axel: [-18, -154], styre: [29, -118], fot: [-6, -46],
      fram: [48, -110, 5, 11], bak: [-94, -97, 5, 7],
    },
    mc: {
      L: 214, hj: [-72, 76], r: 32, sadel: [-30, -110], axel: [-14, -162], styre: [37, -125], fot: [-14, -54],
      fram: [72, -118, 4, 16], bak: [-106, -98, 5, 8],
    },
    mcSport: {
      L: 210, hj: [-72, 74], r: 31, sadel: [-36, -112], axel: [10, -148], styre: [40, -112], fot: [-26, -60], sport: true,
      fram: [84, -100, 5, 9], bak: [-100, -116, 5, 6],
    },
  };

  const vagar = {};
  const vag = (s) => vagar[s] || (vagar[s] = new Path2D(s));

  // Bussens rutor: luckorna mellan dörrarna delade i rutor om ungefär en meter, med stolpar emellan.
  for (const B of Object.values(BUSS)) {
    B.rutor = [];
    for (const [x0, x1, fram] of B.delar) {
      let fria = [[x0 + 12, x1 - (fram ? 62 : 12)]];
      for (const [d0, d1] of B.dorrar) fria = fria.flatMap(([a, b]) => (d1 + 10 <= a || d0 - 10 >= b ? [[a, b]] : [[a, d0 - 10], [d1 + 10, b]].filter(([p, q]) => q - p > 30)));
      for (const [a, b] of fria) {
        const n = Math.max(1, Math.round((b - a) / 110));
        const w = (b - a - (n - 1) * 8) / n;
        for (let i = 0; i < n; i++) B.rutor.push([a + i * (w + 8), a + i * (w + 8) + w]);
      }
      // förarens ruta längst fram
      if (fram) B.rutor.push([x1 - 54, x1 - 8]);
    }
  }

  // ---------- färgerna ----------

  // nittiotalets lack: vinrött, beige, marinblått, flaskgrönt, vitt, brunt, svart, gråblått, silver och de nya
  // metallicfärgerna (plommon, petrol)
  const LACK = ['#7a1f22', '#d6c9a8', '#24345a', '#2e4a3c', '#e7e3d8', '#5a4632', '#1b1d22', '#6e7f8c', '#9a9fa6', '#3c5a7a', '#9a2a1e', '#b8b2a2', '#5e2a44', '#2f5a58'];
  const VOLVO = ['#7a1f22', '#e7e3d8', '#24345a', '#1b1d22', '#9a9fa6', '#5b6f63', '#3c5a7a', '#c9b98f', '#2e4a3c', '#6e7f8c', '#8a2a1e', '#e7e3d8'];
  const SAAB = ['#7a1f22', '#1b1d22', '#e7e3d8', '#2e4a3c', '#9aa0a6', '#3a4a6a', '#a8262a'];
  const MERC = ['#1b1d22', '#24345a', '#9aa0a6', '#d9cfb4', '#4a5560', '#e7e3d8', '#3a2a2a'];
  // (skåpbilarna oftast vita, ibland Postens gula)
  const SKAP = ['#e9e7e0', '#d9d6cc', '#2a3f66', '#c9c3b2', '#e9e7e0', '#f0c419'];
  const T3 = ['#e9e7e0', '#d9cfb4', '#8fa6b8', '#9a2a1e', '#3f5a48', '#c9c3b2'];
  // De som har egna färger. De äldre i sina tiders färger: ljusblått, gräddvitt, rött, svart och grågrönt; Bubblan och
  // Ankan i glada färger, Nivan och Ladan i beige, vitt, grönt, ljusblått och rödorange, Minin i rött, grönt och
  // marinblått, amerikanaren i turkos, grädde, rosa och ljusblått, och jeepen och Voyagern i nittiotalets mörka färger.
  const EGNA = {
    amazon: ['#8fb0c8', '#e3d8bc', '#9a2a24', '#1b1d22', '#7d8c78', '#2a3a5a', '#e7e3d8', '#b8b2a2'],
    pv: ['#1b1d22', '#8fa0a8', '#e3d8bc', '#7d8c78', '#9a2a24', '#3a4a5a'],
    bubbla: ['#c9a227', '#d8692a', '#8fb3c9', '#2e4a3c', '#a8262a', '#e7e3d8', '#5a7a4a', '#b8b2a2', '#24345a'],
    ank: ['#a8262a', '#8f9498', '#e3d8bc', '#d9b23a', '#3a4a6a', '#7a8a6a', '#e7e3d8'],
    niva: ['#d6c9a8', '#e7e3d8', '#4a5a3a', '#b8452a', '#6a8aa0', '#7a1f22'],
    mini: ['#a8262a', '#2e4a3c', '#e7e3d8', '#24345a', '#c9a227', '#1b1d22', '#8fb0c8'],
    lada: ['#d6c9a8', '#e7e3d8', '#8fb0c8', '#a8452a', '#4a6a4a', '#c9a227', '#6a2a2a', '#3a4a6a'],
    amis: ['#5fa8a0', '#e8dcc0', '#a8262a', '#1b1d22', '#d9a0a8', '#8fb8d0', '#2a3a5a', '#e7e3d8'],
    jeep: ['#1b1d22', '#2e4a3c', '#5e2a2a', '#e7e3d8', '#9aa0a6', '#24345a'],
    voyager: ['#24345a', '#5e2a2a', '#9aa0a6', '#e7e3d8', '#2e4a3c', '#1b1d22'],
  };
  EGNA.lada4 = EGNA.lada;
  const TAXI = ['#1b1d22', '#e7e3d8', '#2a2c30', '#24345a', '#9aa0a6'];
  // Cyklarna i Crescents och Monarks färger, skotrarna och mopederna i glada färger, motorcyklarna i nittiotalets
  // (och sporthojarnas kåpor med en rand i en andra färg), lastbilarnas hytter mest vita.
  const CYKLAR = ['#1b1d22', '#24345a', '#7a1f22', '#2e4a3c', '#e7e3d8', '#9a2a1e', '#3c5a7a', '#5e2a44', '#c9a227', '#9aa0a6'];
  const SKOTRAR = ['#a8262a', '#e9e7e0', '#1b1d22', '#2a6ab0', '#c9a227', '#5fa8a0', '#9aa0a6'];
  const MAXI = ['#a8262a', '#2a6ab0', '#1b1d22', '#e9e7e0', '#3f5a48', '#c9a227'];
  const MCLACK = ['#a8262a', '#1b1d22', '#2a4a9a', '#e9e7e0', '#c9a227', '#2f5a58', '#5e2a44', '#9aa0a6'];
  const RANDER = ['#e9e7e0', '#1b1d22', '#c9a227', '#2a6ab0', '#a8262a'];
  const HYTTER = ['#e9e7e0', '#e9e7e0', '#e9e7e0', '#a8262a', '#24345a', '#2e4a3c', '#d8692a'];
  const SKAPEN = ['#e9e7e0', '#e9e7e0', '#d9d6cc', '#c9c3b2', '#24345a', '#9a2a1e'];

  // Bilarna på Stockholms gator i mitten av nittiotalet, ungefär som i bilregistret: en tredjedel Volvo (240:n
  // vanligast), Saab, Golf och de japanska och tyska, fördelade på formerna ovan (siffran: hur många av hundra).
  const MODELLER = [
    ['v245', 9], ['v240', 7], ['v740', 6], ['v745', 6], ['v855', 4], ['v854', 3], ['v440', 5], ['v340', 2], ['v480', 1],
    ['s900', 9], ['s9000', 4], ['s900cab', 1], ['golf', 10], ['w124', 5], ['w201', 3], ['a100', 3], ['passat', 6], ['sierra', 4],
    ['kadett', 10], ['corolla', 9], ['e30', 5], ['p205', 5], ['bx', 2], ['jeep', 2], ['voyager', 2],
    ['v144', 4], ['v145', 3], ['amazon', 2], ['pv', 1], ['s96', 3], ['s99', 3], ['bubbla', 3], ['w123', 3], ['ank', 1],
    ['lada', 2], ['lada4', 1], ['niva', 2], ['mini', 1], ['amis', 1],
  ];
  // (amerikanaren bara när det är varmt och torrt)
  const MODELLER_KALLT = MODELLER.filter(([m]) => m !== 'amis');
  // taxin: oftast en 740/940 eller en Mercedes (ibland en gammal 123:a), ibland en 850, en 9000 eller en Voyager
  const TAXIBILAR = [['v740', 4], ['w124', 3], ['v745', 1], ['v854', 1], ['s9000', 1], ['w123', 2], ['voyager', 1]];
  const lotta = (R, lista) => {
    let x = R() * lista.reduce((s, [, n]) => s + n, 0);
    for (const [m, n] of lista) if ((x -= n) < 0) return m;
    return lista[0][0];
  };
  const lackFor = (m) => (EGNA[m] ? EGNA[m] : m[0] === 'v' ? VOLVO : m[0] === 's' && m !== 'skap' ? SAAB : m[0] === 'w' ? MERC : m === 'skap' ? SKAP : m.startsWith('t3') ? T3 : LACK);

  // ---------- märkena ----------
  //
  // Märket syns där det syns från sidan på de riktiga bilarna: i navkapselns eller fälgens mitt på alla (navMarke; det
  // snurrar med hjulet och läses när bilen står eller rullar sakta), och på några också på karossen: Saab 900:ans
  // SAAB-emblem bakom framhjulet, CHEROKEE på jeepens framdörr, amerikanarens förgyllda Bel Air på bakskärmen
  // (emblem i FORM) och Mercedesstjärnan på huven, som från sidan är en smal blank stav (stjarna). De former som är
  // flera bilar (Kadetten är också Escort och 323:a, Corollan Sunny och Vectra …) får ett av märkena per bil. Minin
  // och amerikanaren har inget i navet.
  const MARKEN = {
    kadett: ['opel', 'ford', 'mazda'], corolla: ['toyota', 'nissan', 'opel'], e30: ['bmw', 'audi'], p205: ['peugeot', 'fiat', 'renault'],
    passat: ['vw', 'audi', 'mazda', 'toyota', 'opel'], skap: ['ford', 'vw', 'mercedes', 'toyota'], sierra: ['ford'], a100: ['audi'],
    golf: ['vw'], t3: ['vw'], t3buss: ['vw'], bubbla: ['vw'], bx: ['citroen'], ank: ['citroen'], jeep: ['jeep'], voyager: ['chrysler'],
    lada: ['lada'], lada4: ['lada'], niva: ['lada'], s96: ['saabText'], s99: ['saabText'], amazon: ['volvo'], pv: ['volvo'], mini: [], amis: [],
  };
  const markenFor = (m) => MARKEN[m] || (m[0] === 'v' ? ['volvo'] : m[0] === 's' ? ['saab'] : m[0] === 'w' ? ['mercedes'] : []);

  // ---------- gatan ----------

  function mark(V, v, L, G) {
    const { markY, mix, r1, VARLD, OGA_X, skala } = G;
    const sno = v.snotackt ? G.snoC(L) : null;
    const vat = (L.wet || v.blott) && !sno;
    const x0 = VARLD.x0;
    const W = VARLD.x1 - VARLD.x0;
    const yTopp = markY(KANT - 0.025);
    const yK = markY(KANT);
    const yF = yK + 6;
    const yR = markY(RANN);
    const yM = markY(MOT);
    const sten = mix('#141518', '#b3b0a8', L.dag);
    let s = '';
    // asfalten: mörkare och blank när den är våt, slask med hjulspår när det har snöat
    const asf = sno ? mix(sno, mix('#2a2b2e', '#6a6c70', L.dag), 0.4) : vat ? mix('#0b0c0e', '#3b3d41', L.dag) : mix('#111215', '#5a5b5f', L.dag);
    s += `<rect x="${x0}" y="${r1(yR)}" width="${W}" height="${r1(yM - yR)}" fill="${asf}"/>`;
    if (vat && L.dag > 0.2) s += `<rect x="${x0}" y="${r1(yR)}" width="${W}" height="${r1(yM - yR)}" fill="${L.sky[2]}" opacity="${r1(0.2 * L.dag)}"/>`;
    if (sno) {
      // hjulspåren i slasket, där fordonen kör
      let sp = '';
      for (const f of FILER) {
        const y = markY(f.d);
        sp += `<rect x="${x0}" y="${r1(y - 3)}" width="${W}" height="7" fill="${mix(asf, '#1a1b1e', 0.35)}" opacity=".7"/>`;
      }
      s += sp;
    } else {
      // mittlinjen: tre meter streck, nio meter mellan
      const k = skala(LINJE);
      const y = markY(LINJE);
      let d = '';
      for (let X = -1800; X < 3600; X += 12 * 207) {
        const a = OGA_X + (X - OGA_X) * k;
        d += `M${r1(a)} ${r1(y - 1.6)} h${r1(3 * 207 * k)} v3.2 h${r1(-3 * 207 * k)} Z`;
      }
      s += `<path d="${d}" fill="${mix('#2a2a28', '#e8e4d6', 0.15 + 0.85 * L.dag)}" opacity="${vat ? 0.7 : 0.85}"/>`;
    }
    // rännstenen: gatsten längs kanten, och en brunn med galler
    s += `<rect x="${x0}" y="${r1(yF)}" width="${W}" height="${r1(yR - yF)}" fill="${mix(sten, '#000000', sno ? 0.1 : 0.3)}"/>`;
    let gs = '';
    for (let x = x0 + 8; x < VARLD.x1; x += 34) gs += `M${x} ${r1(yF)} V${r1(yR)}`;
    s += `<path d="${gs}" stroke="${mix(sten, '#000000', 0.55)}" stroke-width="2" opacity="${sno ? 0.3 : 0.6}"/>`;
    if (!sno) s += `<rect x="742" y="${r1(yF + 0.5)}" width="88" height="${r1(yR - yF - 1)}" fill="#0a0a0b"/><path d="M752 ${r1(yF + 1)} V${r1(yR - 1)} M764 ${r1(yF + 1)} V${r1(yR - 1)} M776 ${r1(yF + 1)} V${r1(yR - 1)} M788 ${r1(yF + 1)} V${r1(yR - 1)} M800 ${r1(yF + 1)} V${r1(yR - 1)} M812 ${r1(yF + 1)} V${r1(yR - 1)}" stroke="${mix('#1a1a1c', '#6a6a68', L.dag)}" stroke-width="3"/>`;
    // trottoarkanten i granit: ovansidan ljus och kanten mot gatan mörkare
    s += `<rect x="${x0}" y="${r1(yTopp)}" width="${W}" height="${r1(yK - yTopp)}" fill="${mix(sten, '#ffffff', 0.12)}"/>`;
    s += `<rect x="${x0}" y="${r1(yK)}" width="${W}" height="6" fill="${mix(sten, '#000000', 0.22)}"/>`;
    let fog = '';
    for (let x = x0 + 60; x < VARLD.x1; x += 240) fog += `M${x} ${r1(yTopp)} V${r1(yF)}`;
    s += `<path d="${fog}" stroke="${mix(sten, '#000000', 0.5)}" stroke-width="1.6"/>`;
    // höstlöven samlas i rännstenen
    if (G.lovet(v) === 'host' && !sno) {
      const R = G.rng(83);
      const cols = ['#c7682a', '#d99a2b', '#a8452a', '#8a5a2a', '#c9a23a'];
      for (let i = 0; i < 26; i++) {
        const x = r1(x0 + R() * W);
        const y = r1(yF + R() * (yR - yF + 4));
        s += `<ellipse cx="${x}" cy="${y}" rx="${r1(5 + R() * 5)}" ry="${r1(2.4 + R() * 1.6)}" fill="${G.pick(R, cols)}" opacity="${r1(0.4 + 0.5 * L.dag)}" transform="rotate(${r1(R() * 180)} ${x} ${y})"/>`;
      }
    }
    // plogvallen längs kanten när det har snöat
    if (sno) {
      const R = G.rng(19);
      let p = `M${x0} ${r1(yF + 3)}`;
      for (let x = x0; x <= VARLD.x1; x += 60) p += ` Q${r1(x + 30)} ${r1(yTopp - 6 - R() * 9)} ${x + 60} ${r1(yTopp - 2 - R() * 5)}`;
      p += ` V${r1(yF + 3)} Z`;
      s += `<path d="${p}" fill="${mix(sno, '#8a8f98', 0.12)}"/><path d="${p}" fill="none" stroke="${mix(sno, '#5a606a', 0.3)}" stroke-width="1.4" opacity=".5"/>`;
    }
    // kanten mittemot (syns bara i en telefon på höjden): stenen och trottoaren där man själv står
    s += `<rect x="${x0}" y="${r1(yM)}" width="${W}" height="${r1(markY(MOT + 0.04) - yM)}" fill="${mix(sten, '#ffffff', 0.08)}"/>`;
    return s;
  }

  // ---------- trafiken ----------

  // Hur ofta det kommer något per fil (s), ur RumUte.trafik: rusning, dag, kväll och natt. (Glesare än förr, när de
  // körde fortare: varje fordon syns längre, och skyltfönstret ska inte skymmas mer än det gjorde.) Lugnare sedan
  // 2026-11-17 ("lugnare/mindre stressig"): ungefär hälften så ofta som förut, lite långsammare (LUGN.fart), färre
  // bussar (LUGN.buss), och färre som bromsar, stannar eller står i kö framför affären (kor, ko). Tätare igen sedan
  // 2026-11-19 ("knappt så att det åker några öht"): ungefär dubbelt så ofta och lite fler bussar, men inte fler som
  // bromsar eller står i kö, och det mesta av det nya är det som inte skymmer affären: motorcyklarna i filerna och
  // cyklarna och mopederna längs kanten (intervallCykel).
  const LUGN = { fart: 0.88, buss: 0.8 };
  function intervall(T, v) {
    const s = T.rusning ? 27 : T.natt ? 130 : T.dag ? 38 : 58;
    return s * (v.snotackt || (v.fall === 'sno' && v.mangd > 0.5) ? 1.3 : 1);
  }
  // Längs kanten: cyklarna och mopederna, flest i rusningen och på sommaren, färre i kylan, på vintern och i regnet,
  // och inga på natten, i snön eller i ösregnet (T.cyklar, som på bron). 0: inga.
  function intervallCykel(T, v) {
    if (!T.cyklar) return 0;
    const s = T.rusning ? 30 : T.dag ? 46 : 80;
    return s * (T.cyklar === 1 ? 2.2 : T.cyklar === 3 ? 0.7 : 1) * (v.fall ? 1.7 : 1) * (v.temp < 3 ? 1.5 : 1);
  }

  function trafik(v, L, G) {
    const S = {
      G, L, v,
      filer: [...FILER, CYKELKANT].map((f, i) => {
        const sk = G.skala(f.d);
        return { i, d: f.d, dir: f.dir, sk, k: (G.M * sk) / 100, y: G.markY(f.d), um: G.M * sk, cykel: Boolean(f.cykel) };
      }),
      fro: v.ar * 7919 + v.manad * 613 + v.dag * 31,
      luckor: new Map(),
      fria: new Map(),
      koer: new Map(),
      T: null, tT: -1e9,
      lamps: L.lampor || L.dag < 0.35 || L.dimma > 0.4,
      // (hur mycket i luften som fångar strålkastarnas ljus: regn, snö och dimma; 0 i klar luft)
      luft: Math.min(1, (v.fall ? 0.35 + 0.65 * v.mangd : 0) + (L.dimma || 0)),
      vat: (L.wet || v.blott) && !v.snotackt,
      regn: v.fall === 'regn' || v.fall === 'blandat',
      snoTak: v.snotackt || (v.fall === 'sno' && v.mangd > 0.4),
      kallt: v.temp < 6,
    };
    // färgerna i gatans ljus: i mörkret siluetter med en aning av lacken, som de som går
    S.ton = (c) => G.mix(G.mix('#06070a', c, 0.13 + 0.87 * L.dag), '#ffb060', 0.07 * (1 - L.dag));
    S.glas = S.lamps ? '#0c0d10' : G.mix(S.ton('#1d252e'), L.sky[2], 0.35 * L.dag);
    S.himmel = L.sky[0];
    // (filerna i den ordning de ritas: den bortersta, närmast affären, först)
    S.ordning = [...S.filer].sort((a, b) => a.d - b.d);
    return S;
  }

  // trafiken just nu (läses om en gång i minuten)
  function nu(S) {
    const ms = performance.now();
    if (!S.T || ms - S.tT > 60e3) {
      const v = (window.Vader && Vader.nu()) || S.v;
      S.T = window.RumUte.trafik.nu(v);
      S.tT = ms;
      S.vNu = v;
    }
    return S.T;
  }

  // Ett fordon av slaget typ, med lack, fart (m/s) och vad som är i det.
  function nyttFordon(S, R, typ, T, f) {
    const { pick } = S.G;
    const b = { typ, taxi: false };
    const v = S.vNu || S.v;
    const halt = v.snotackt || (v.fall === 'sno' && v.mangd > 0.3) ? 0.8 : 1;
    if (typ === 'buss' || typ === 'ledbuss') {
      b.F = BUSS[typ];
      // de röda bussarna (trean och 77:an) och den blåa fyran, med slutstationen åt det håll den kör
      b.nr = typ === 'ledbuss' ? '4' : pick(R, ['3', '77']);
      b.lack = typ === 'ledbuss' ? '#2468b8' : '#b8262a';
      b.mal = typ === 'ledbuss' ? (f.dir > 0 ? 'RADIOHUSET' : 'GULLMARSPLAN') : '';
      b.folk = b.F.rutor.map(() => (R() < 0.55 ? 0.25 + R() * 0.5 : -1));
      b.fart = (1.8 + R() * 0.4) * halt;
    } else if (typ === 'plog') {
      b.F = PLOG;
      b.lack = '#e07a1a';
      b.fart = 1.5 + R() * 0.3;
    } else if (typ === 'cykel') {
      // (en och en halv gång så fort som de som går; damcykeln oftast med korg)
      b.F = TVA[R() < 0.55 ? 'dam' : 'herr'];
      b.lack = pick(R, CYKLAR);
      b.fart = (1.25 + R() * 0.4) * halt;
      b.ry = ryttare(S, R, v, 'cykel');
      b.korg = R() < (b.F === TVA.dam ? 0.4 : 0.1) ? S.ton(pick(R, ['#a07a4a', '#1a1a1a', '#c9b98f'])) : null;
      b.vaska = R() < 0.3 ? S.ton(pick(R, ['#3a2a1e', '#1a1a1a', '#24345a', '#5a4632', '#7a1f22'])) : null;
      b.lampa = R() < 0.6;
      b.kromSkarm = R() < 0.5;
    } else if (typ === 'skoter' || typ === 'maxi') {
      b.F = TVA[typ];
      b.lack = pick(R, typ === 'maxi' ? MAXI : SKOTRAR);
      b.fart = (1.6 + R() * 0.35) * halt;
      b.ry = ryttare(S, R, v, 'moped');
    } else if (typ === 'mc') {
      b.F = TVA[R() < 0.5 ? 'mcSport' : 'mc'];
      b.lack = pick(R, MCLACK);
      b.lack2 = S.ton(pick(R, RANDER));
      b.fart = (T.natt ? 2.6 + R() * 0.7 : T.rusning ? 2.0 + R() * 0.5 : 2.2 + R() * 0.6) * halt;
      b.ry = ryttare(S, R, v, 'mc');
      // (ibland någon där bak, på den nakna)
      b.bak = b.F === TVA.mc && R() < 0.25 ? ryttare(S, R, v, 'mc') : null;
    } else if (typ === 'lastbil') {
      b.F = LASTBIL;
      b.lack = pick(R, HYTTER);
      b.skap = S.ton(pick(R, SKAPEN));
      b.rand = R() < 0.6 ? S.ton(pick(R, RANDER.slice(2))) : null;
      b.fart = (1.8 + R() * 0.35) * halt;
    } else {
      b.taxi = typ === 'taxi';
      const modell = b.taxi ? lotta(R, TAXIBILAR) : typ;
      b.F = FORM[modell === 's900cab' && varmt(S, 18) ? 's900cabO' : modell];
      b.modell = modell;
      b.lack = pick(R, b.taxi ? TAXI : lackFor(modell));
      b.falg = pick(R, ['#b9bdc2', '#a4a8ae', '#c8ccd0']);
      // (navkapslar eller lättmetall och takräcke: olika på varje bil av samma slag)
      b.nav = b.F.nav === 'plat' && R() < 0.25 ? 'stal' : b.F.nav === 'stal' && !b.F.hog && !b.F.enkel && R() < 0.15 ? 'ekrar' : b.F.nav;
      b.rails = b.F.rails === 'kanske' ? R() < 0.6 : Boolean(b.F.rails);
      b.duk = b.F.duk && (!b.F.dukKanske || R() < 0.5);
      b.passagerare = R() < 0.3;
      // (i den öppna bilen syns de som åker: tröjan och håret)
      if (b.F.oppen) {
        b.klader = [pick(R, KLADER), pick(R, KLADER)];
        b.har = [pick(R, HAR), pick(R, HAR)];
        b.passagerare = R() < 0.6;
      }
      // (i m/s i den tecknade gatan: 2,1–2,7 på dagen, lugnare i rusningen och lite fortare på natten, så att de på
      // skärmen kör två–tre gånger så fort som de som går och hinner synas i fyra–fem sekunder)
      b.fart = (T.natt ? 2.5 + R() * 0.7 : T.rusning ? 1.9 + R() * 0.5 : 2.1 + R() * 0.6) * halt;
      // märket (ur farten, inte ur R: allt annat i luckan lottas som förut)
      const mk = markenFor(modell);
      b.marke = mk.length ? mk[Math.floor((b.fart * 7919) % mk.length)] : null;
    }
    b.L = b.F.L;
    return lacka(S, b);
  }
  // lacken i scenens ljus
  function lacka(S, b) {
    b.c = S.ton(b.lack);
    b.cM = S.G.mix(b.c, '#000000', 0.32);
    b.cL = S.G.mix(b.c, '#ffffff', 0.05 + 0.16 * S.L.dag);
    return b;
  }
  // samma fordon i en annan scens ljus (bron bakom Hasse Backe, rum-hasse-ute.js)
  const somFordon = (S, b) => lacka(S, { ...b });

  // varmt och torrt (amerikanaren kommer ut, cabben fäller ner taket)
  function varmt(S, grader) {
    const v = S.vNu || S.v;
    return v.temp >= grader && !v.fall && !v.snotackt;
  }
  const KLADER = ['#e7e3d8', '#24345a', '#a8262a', '#1b1d22', '#5fa8a0', '#c9a227', '#8fb0c8'];
  const HAR = ['#2a2018', '#5a3a22', '#c9a86a', '#1b1d22', '#8a6a4a', '#b8b2a2'];

  function valjTyp(S, R, T, f, I) {
    const v = S.vNu || S.v;
    if (T.bussar && !T.natt && R() < I / (T.dag ? 420 : 600)) return R() < 0.5 ? 'ledbuss' : 'buss';
    if (f.i === 1 && (v.snotackt || (v.fall === 'sno' && v.mangd > 0.3)) && R() < I / 400) return 'plog';
    if (R() < (T.natt ? 0.4 : 0.1)) return 'taxi';
    // skåpbilarna (och VW-bussarna), färre på helgen
    if (R() < (T.helg ? 0.06 : 0.11)) { const x = R(); return x < 0.5 ? 'skap' : x < 0.8 ? 't3' : 't3buss'; }
    return lotta(R, varmt(S, 15) ? MODELLER : MODELLER_KALLT);
  }

  // Vad som kommer i bilarnas filer framför affären: ibland en motorcykel (flest när det är varmt och torrt, få i
  // regnet och ingen i snön) eller en lastbil med varor (mest på vardagarna), annars som valjTyp. (Bara här: bron
  // bakom Hasse Backe lottar med valjTyp och ritar bara bilar och bussar.)
  function valjFasad(S, R, T, f, I) {
    const v = S.vNu || S.v;
    const mc = v.snotackt || v.fall === 'sno' ? 0 : v.fall ? 0.008 : v.temp >= 15 ? 0.08 : v.temp >= 8 ? 0.06 : v.temp >= 3 ? 0.045 : 0.025;
    if (R() < mc * (T.natt ? 0.5 : 1)) return 'mc';
    if (R() < (!T.helg && T.h > 6 && T.h < 17 ? 0.05 : T.natt ? 0.01 : 0.02)) return 'lastbil';
    return valjTyp(S, R, T, f, I * LUGN.buss);
  }
  // Längs kanten: mest cyklar, och skotrar och mopeder (färre i kylan).
  function valjCykel(S, R) {
    const v = S.vNu || S.v;
    if (R() < (v.temp < 2 ? 0.1 : v.arstid === 'sommar' ? 0.3 : 0.2)) return R() < 0.6 ? 'skoter' : 'maxi';
    return 'cykel';
  }

  // Den som åker på två hjul: kläderna (mössa och vantar i kylan, ibland en lång rock på cykeln), och hjälmen:
  // cykelhjälm på några (det var nittiotal), alltid hjälm på mopeden (öppen eller hel) och hel på motorcykeln, där
  // de flesta har skinnjacka. Färgerna i gatans ljus (S.ton) redan här.
  const JACKOR = ['#24345a', '#1b1d22', '#a8262a', '#2f5a58', '#5e2a44', '#c9b98f', '#3f5a48', '#6e7f8c', '#8a5a2a', '#e7e3d8', '#3a4a8a'];
  const BYXOR = ['#2a3448', '#1b1d22', '#3a4a66', '#4a4236', '#5a5a5a', '#c9b98f'];
  const HY = ['#e0b896', '#d9a982', '#c48a62', '#8a5a3a', '#f0cdb0'];
  const MOSSOR = ['#a8322a', '#1a1a1a', '#d8d0c0', '#2a4a7a', '#5a5a5a', '#3f5a48'];
  const HJALMAR = ['#e9e7e0', '#a8262a', '#1b1d22', '#24345a', '#c9a227', '#2f5a58', '#9aa0a6'];
  function ryttare(S, R, v, slag) {
    const { pick, mix } = S.G;
    const kallt = v.temp < 5;
    const mc = slag === 'mc';
    const r = {
      jacka: S.ton(mc ? pick(R, ['#1b1d22', '#1b1d22', '#3a2a22', '#24345a', '#a8262a']) : pick(R, JACKOR)),
      byxor: S.ton(mc ? pick(R, ['#1b1d22', '#2a3448', '#1b1d22']) : pick(R, BYXOR)),
      sko: S.ton(pick(R, ['#1a1a1a', '#1a1a1a', '#3a2a1e', '#5a4632', '#e7e3d8'])),
      hy: S.ton(pick(R, HY)),
      har: S.ton(pick(R, HAR)),
      lang: slag === 'cykel' && R() < (kallt ? 0.35 : 0.15),
      langtHar: R() < 0.35,
    };
    r.jackaM = mix(r.jacka, '#000000', 0.3);
    r.byxorM = mix(r.byxor, '#000000', 0.35);
    r.skoM = mix(r.sko, '#000000', 0.35);
    r.hand = mc ? S.ton('#1a1a1a') : kallt ? S.ton(pick(R, ['#1a1a1a', '#5a4632', '#a8322a'])) : r.hy;
    if (slag === 'cykel') {
      if (R() < 0.15) {
        r.hjalm = 'cykel';
        r.hjalmF = S.ton(pick(R, ['#e9e7e0', '#c9a227', '#2a6ab0', '#a8262a', '#5fa8a0']));
      } else if (kallt && R() < 0.6) r.mossa = S.ton(pick(R, MOSSOR));
    } else {
      r.hjalm = mc || R() < 0.3 ? 'hel' : 'oppen';
      r.hjalmF = S.ton(pick(R, HJALMAR));
      r.rand = R() < 0.5 ? S.ton(pick(R, HJALMAR)) : null;
    }
    return r;
  }

  // ---------- hur de kör ----------
  //
  // Ett fordons färd är en följd av delar med jämn acceleration (D: [{ t, p, v, a }]: från tiden t (s) är fronten p m
  // in i filen, farten v m/s och accelerationen a m/s²), så att det kör som en bil: i jämn fart, bromsar in, står, tar
  // fart igen. Var det är och hur fort det går vid tiden t räknas ur delen (lage), och när det når en plats ur den
  // (nar). Nigningen (nosen ner när det bromsar, upp när det tar fart, och en gungning tillbaka när det stannar) är
  // accelerationen genom fjädringen: en dämpad svängning efter varje ändring (fjader).
  function fard(t0, v) {
    return [{ t: t0, p: 0, v, a: 0 }];
  }
  // från tiden t accelerationen a (0: jämn fart, eller stilla när farten har nått noll)
  function byt(D, t, a) {
    const d = D[D.length - 1];
    const u = t - d.t;
    const v = d.v + d.a * u;
    D.push({ t, p: d.p + d.v * u + (d.a * u * u) / 2, v: v < 1e-6 ? 0 : v, a });
  }
  function lage(D, t) {
    let i = D.length - 1;
    while (i > 0 && D[i].t > t) i--;
    const d = D[i];
    const u = t - d.t;
    // (före den första delen: i dess fart, utanför världen)
    if (u < 0) return { p: d.p + d.v * u, v: d.v, a: 0, i };
    return { p: d.p + d.v * u + (d.a * u * u) / 2, v: Math.max(0, d.v + d.a * u), a: d.a, i };
  }
  // när fronten når s m in i filen (den sista delen är jämn fart)
  function nar(D, s) {
    for (let i = 0; i < D.length; i++) {
      const d = D[i];
      if (D[i + 1] && D[i + 1].p < s) continue;
      const r = s - d.p;
      if (!d.a) return d.t + (d.v ? r / d.v : 0);
      return d.t + (Math.sqrt(Math.max(0, d.v * d.v + 2 * d.a * r)) - d.v) / d.a;
    }
    return Infinity;
  }
  // accelerationen som karossen känner den: ett steg i accelerationen ger en dämpad svängning (1,3 gånger i sekunden)
  const FJ = { w: TAU * 1.3, z: 0.45 };
  function fjader(D, t) {
    const { w, z } = FJ;
    const wd = w * Math.sqrt(1 - z * z);
    let s = 0;
    for (let i = 1; i < D.length && D[i].t < t; i++) {
      const u = t - D[i].t;
      const da = D[i].a - D[i - 1].a;
      s += u > 8 ? da : da * (1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + ((z * w) / wd) * Math.sin(wd * u)));
    }
    return s;
  }
  // bromsljuset: när det bromsar (inte när föraren bara släpper gasen), när det står, och strax när det tar fart
  function bromsar(D, l, t) {
    if (l.a < -0.45 || l.v < 0.05) return true;
    const d = D[l.i];
    return d.a > 0 && d.v === 0 && t - d.t < 0.35;
  }

  // Vad föraren gör framför affären: oftast kör den förbi i jämn fart, men ibland släpper den gasen en stund, bromsar
  // in (för något längre fram: någon som går över, en som svänger) och tar fart igen, eller stannar och står en stund.
  // Var: fronten någonstans framför affären när det börjar, så att det syns i alla fönster. Bussarna och lastbilarna
  // stannar inte, och plogbilen och cyklarna kör jämnt.
  function kor(R, b, T, f, t0) {
    const v = b.fart;
    const D = fard(t0, v);
    const typ = b.typ;
    if (typ === 'plog' || typ === 'cykel') return D;
    const buss = typ === 'buss' || typ === 'ledbuss' || typ === 'lastbil';
    const stopp = buss ? 0 : T.natt ? 0.01 : T.rusning ? 0.05 : 0.03;
    const broms = (T.natt ? 0.05 : T.rusning ? 0.14 : 0.09) * (buss ? 0.5 : 1);
    const slapp = T.natt ? 0.1 : 0.14;
    const r = R();
    let v2;
    let a;
    let a2;
    let sta;
    if (r < stopp) {
      v2 = 0; a = 1.0 + R() * 0.5; a2 = 0.9 + R() * 0.4; sta = 1 + R() * 2.5;
    } else if (r < stopp + broms) {
      v2 = v * (0.3 + R() * 0.35); a = 0.7 + R() * 0.6; a2 = 0.6 + R() * 0.4; sta = R() * 1.2;
    } else if (r < stopp + broms + slapp) {
      v2 = v * (0.65 + R() * 0.2); a = 0.25 + R() * 0.15; a2 = 0.3 + R() * 0.2; sta = 0.5 + R() * 1.5;
    } else return D;
    const xs = 250 + R() * 1200;
    const tb = t0 + (f.dir > 0 ? xs - XL : XR - xs) / f.um / v;
    const t1 = tb + (v - v2) / a;
    const t2 = t1 + sta;
    byt(D, tb, -a);
    byt(D, t1, 0);
    byt(D, t2, a2);
    byt(D, t2 + (v - v2) / a2, 0);
    return D;
  }
  // Den som kör efter ett annat gör som det, en stund senare och på samma ställe (som i Newells modell: tau s efter,
  // med fronten d m bakom dess): bromsar där det bromsade, och står bakom när det står.
  function efter(D, tau, d) {
    return D.map((x) => ({ t: x.t + tau, p: x.p - d, v: x.v, a: x.a }));
  }
  // Kommer b aldrig närmare a, som kör före i samma fil, än en dryg meter och en bit till för farten?
  function haller(a, b) {
    const t2 = Math.min(a.slut, b.slut);
    for (let t = Math.max(a.t0, b.t0); t <= t2; t += 0.25) {
      const l = lage(b.D, t);
      if (lage(a.D, t).p - a.L / 100 - l.p < 1.2 + 0.5 * l.v) return false;
    }
    return true;
  }

  // Luckan n i filen f: fordonen i den (oftast inget), deras färd (D), när de kommer in (t0) och när de är ute
  // (slut). Ett fordon som skulle komma närmare något i de fyra luckorna före än det går att hålla (haller) kommer
  // inte, och inte det som skulle följa efter det heller, så att ingen kör igenom någon; inte heller när det står en
  // kö i filen. Allt är ute ur världen fem luckor efter sin egen (LIV).
  function lucka(S, f, n) {
    const key = f.i * 1e7 + n;
    if (S.fria.has(key)) return S.fria.get(key);
    const fore = [1, 2, 3, 4].flatMap((k) => luckaRa(S, f, n - k));
    const ut = [];
    for (const b of luckaRa(S, f, n)) {
      if (b.efter && !ut.includes(b.efter)) continue;
      if (b.slut - n * LUCKA > LIV || koar(S, f, b)) continue;
      if (fore.every((a) => haller(a, b))) ut.push(b);
    }
    S.fria.set(key, ut);
    if (S.fria.size > 40) S.fria.delete(S.fria.keys().next().value);
    return ut;
  }
  function luckaRa(S, f, n) {
    const key = f.i * 1e7 + n;
    if (S.luckor.has(key)) return S.luckor.get(key);
    const R = S.G.rng(S.fro + f.i * 104729 + n * 7907);
    const T = nu(S);
    const I = f.cykel ? intervallCykel(T, S.vNu || S.v) : intervall(T, S.vNu || S.v);
    const ut = [];
    if (I && R() < LUCKA / I) {
      const t0 = n * LUCKA + f.i * 2.1 + R() * 0.8;
      const a = nyttFordon(S, R, f.cykel ? valjCykel(S, R) : valjFasad(S, R, T, f, I), T, f);
      if (!f.cykel) a.fart *= LUGN.fart;
      a.D = kor(R, a, T, f, t0);
      ut.push(a);
      // ibland en till efter, som följer den (längs kanten två som cyklar ihop)
      if (a.L < 600 && R() < (f.cykel ? (a.typ === 'cykel' ? 0.15 : 0) : T.rusning ? 0.25 : 0.12)) {
        const b = nyttFordon(S, R, f.cykel ? 'cykel' : valjTyp(S, R, T, f, 0), T, f);
        if (b.L < 600) {
          b.fart = a.fart;
          b.D = efter(a.D, (T.rusning ? 0.9 : 1.2) + R() * 1.2, a.L / 100 + 1.6 + R() * 0.9);
          b.efter = a;
          ut.push(b);
        }
      }
    }
    for (const b of ut) {
      b.f = f;
      b.t0 = nar(b.D, 0);
      b.slut = nar(b.D, (XR - XL) / f.um + b.L / 100);
    }
    S.luckor.set(key, ut);
    if (S.luckor.size > 80) S.luckor.delete(S.luckor.keys().next().value);
    return ut;
  }

  // ---------- kön ----------
  //
  // I den närmre filen (förarnas vänstra, där de som ska svänga vänster ställer sig): några bilar kommer i följd,
  // bromsar in och ställer sig bakom varandra med den första en bit till vänster om affären; de står med bromsljusen
  // tända tills det slår om, och kör sedan iväg en efter en med en dryg sekund emellan. Var och en kommer i v0,
  // bromsar med a, står, tar fart med a2 upp till v1.
  const KOF = { v0: 1.95, a: 1.1, a2: 0.9, v1: 2.2, glapp: 1.2 };
  function ko(S, f, q) {
    const key = f.i * 1e7 + q;
    if (S.koer.has(key)) return S.koer.get(key);
    const R = S.G.rng(S.fro + 977 + q * 3571);
    const T = nu(S);
    const p = T.rusning ? 0.2 : T.dag && !T.helg ? 0.05 : T.dag ? 0.03 : 0;
    let k = null;
    if (f.i === 1 && R() < p) {
      const tq = q * KO + 4 + R() * KO * 0.35;
      const n = 3 + Math.floor(R() * (T.rusning ? 5 : 3));
      const bilar = [];
      // (den första stannar vid sidan av affären, i färdriktningen, så att den bakom står framför affären; s: m från
      // där filen börjar)
      const xs = f.dir > 0 ? 1750 + R() * 500 : -110 - R() * 500;
      let s = (f.dir > 0 ? xs - XL : XR - xs) / f.um;
      let ts = tq;
      for (let j = 0; j < n; j++) {
        const typ = j > 0 && T.bussar && R() < 0.06 ? 'buss' : valjTyp(S, R, T, f, 0);
        const b = nyttFordon(S, R, typ === 'plog' ? 'v245' : typ, T, f);
        b.f = f;
        b.s = s;
        b.tStopp = ts;
        bilar.push(b);
        s -= b.L / 100 + KOF.glapp + R() * 0.6;
        ts += 1.8 + R() * 1.6;
      }
      const tGa = ts + 5 + R() * 9;
      const { v0, a, a2, v1 } = KOF;
      const ut = (XR - XL) / f.um;
      bilar.forEach((b, j) => {
        const ga = tGa + j * 1.1 + R() * 0.4;
        const tb = b.tStopp - v0 / a;
        b.D = fard(tb - (b.s - (v0 * v0) / (2 * a)) / v0, v0);
        byt(b.D, tb, -a);
        byt(b.D, b.tStopp, 0);
        byt(b.D, ga, a2);
        byt(b.D, ga + v1 / a2, 0);
        b.t0 = b.D[0].t;
        b.slut = nar(b.D, ut + b.L / 100);
      });
      k = { bilar, tIn: bilar[0].t0, tUt: Math.max(...bilar.map((b) => b.slut)) };
    }
    S.koer.set(key, k);
    if (S.koer.size > 12) S.koer.delete(S.koer.keys().next().value);
    return k;
  }
  // står en kö i filen medan b är i världen?
  function koar(S, f, b) {
    const q = Math.floor(b.t0 / KO);
    return [ko(S, f, q - 1), ko(S, f, q), ko(S, f, q + 1)].some((k) => k && b.slut > k.tIn - 1 && b.t0 < k.tUt + 1);
  }

  // Det som syns vid tiden t i bilden V: den bortre filen först (den ritas bakom). nig: hur mycket karossen lutar
  // (radianer, nosen ner när det bromsar; bussarna och plogbilen mindre).
  function syns(S, t, V) {
    if (!window.RumUte || !RumUte.trafik) return null;
    const ut = [];
    const marg = S.lamps ? 1400 : 120;
    const fram = (b, f) => {
      if (t < b.t0 || t > b.slut) return;
      const l = lage(b.D, t);
      const w = (b.L / 100) * f.um;
      const xf = f.dir > 0 ? XL + l.p * f.um : XR - l.p * f.um;
      const xa = f.dir > 0 ? xf - w : xf;
      if (xa > V.x + V.w + marg || xa + w < V.x - marg) return;
      const tung = b.typ === 'buss' || b.typ === 'ledbuss' || b.typ === 'plog' || b.typ === 'lastbil' ? 0.4 : b.F.sadel ? 0.6 : 1;
      const nig = Math.max(-0.016, Math.min(0.016, -0.008 * fjader(b.D, t))) * tung;
      ut.push({ b, f, x: xa + w / 2, fart: l.v, broms: bromsar(b.D, l, t), nig });
    };
    for (const f of S.ordning) {
      const n = Math.floor((t - f.i * 2.1) / LUCKA);
      for (let m = n - 4; m <= n; m++) for (const b of lucka(S, f, m)) fram(b, f);
      const q = Math.floor(t / KO);
      for (const k of [ko(S, f, q - 1), ko(S, f, q)]) {
        if (!k || t < k.tIn || t > k.tUt) continue;
        // (de bakre först, så att den framför ritas ovanpå om de nuddar)
        for (let j = k.bilar.length - 1; j >= 0; j--) fram(k.bilar[j], f);
      }
    }
    return ut.length ? ut : null;
  }

  // De fordon som kommer in på gatan, från bron till höger, mellan ta och tb (s), i den ordning de kommer: för bron
  // bakom Hasse Backe (rum-hasse.js), där de kör över bron innan de kör förbi affären.
  function kommer(S, ta, tb) {
    if (!window.RumUte || !RumUte.trafik) return [];
    const ut = [];
    const med = (b) => { if (b.t0 > ta && b.t0 <= tb) ut.push(b); };
    for (const f of S.filer) {
      for (let n = Math.floor((ta - f.i * 2.1) / LUCKA) - 1; n <= Math.floor((tb - f.i * 2.1) / LUCKA); n++) lucka(S, f, n).forEach(med);
      for (let q = Math.floor(ta / KO) - 1; q <= Math.floor(tb / KO) + 1; q++) { const k = ko(S, f, q); if (k) k.bilar.forEach(med); }
    }
    return ut.sort((a, b) => a.t0 - b.t0);
  }

  // ---------- att rita ----------

  // Nigningen: karossen lutar kring hjulens mitt (niga, efter skuggan under), men hjulen och hjulhusen står kvar på
  // gatan (ritaHjul vrider tillbaka). NIG sätts av rita för fordonet som ritas.
  let NIG = 0;
  function niga(c, F) {
    if (!NIG) return;
    c.translate(0, -F.r);
    c.rotate(NIG);
    c.translate(0, F.r);
  }
  function ritaHjul(c, x, r, nav, falg, botten, S, vrid = 0, marke = null, dir = 1) {
    if (!NIG) return hjulet(c, x, r, nav, falg, botten, S, vrid, marke, dir);
    c.save();
    c.translate(0, -r);
    c.rotate(-NIG);
    c.translate(0, r);
    hjulet(c, x, r, nav, falg, botten, S, vrid, marke, dir);
    c.restore();
  }
  function hjulet(c, x, r, nav, falg, botten, S, vrid, marke, dir) {
    // hjulhuset
    c.fillStyle = '#09090a';
    c.beginPath();
    c.arc(x, -r, r + 5, Math.PI, 0);
    c.lineTo(x + r + 5, botten);
    c.lineTo(x - r - 5, botten);
    c.closePath();
    c.fill();
    // däcket och fälgen (navkapslarna snurrar inte: de är släta)
    c.fillStyle = '#121214';
    c.beginPath();
    c.arc(x, -r, r, 0, TAU);
    c.fill();
    const f = S.ton(falg);
    if (nav === 'stal') {
      // plåtfälg i grått med en liten kapsel i mitten
      c.fillStyle = S.ton('#6a6e74');
      c.beginPath(); c.arc(x, -r, r * 0.62, 0, TAU); c.fill();
      c.strokeStyle = S.ton('#45484d');
      c.lineWidth = r * 0.06;
      c.beginPath(); c.arc(x, -r, r * 0.46, 0, TAU); c.stroke();
      c.fillStyle = f;
      c.beginPath(); c.arc(x, -r, r * 0.22, 0, TAU); c.fill();
    } else if (nav === 'ekrar' || nav === 'hal') {
      // lättmetall: fem ekrar (850, 9000, BMW) eller Mercedes hål i en ring; de snurrar med farten
      const a0 = vrid / r;
      c.fillStyle = f;
      c.beginPath(); c.arc(x, -r, r * 0.68, 0, TAU); c.fill();
      c.fillStyle = S.ton('#2a2c30');
      if (nav === 'ekrar') {
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = a0 + (i * TAU) / 5;
          c.moveTo(x + Math.cos(a + 0.2) * r * 0.26, -r + Math.sin(a + 0.2) * r * 0.26);
          c.arc(x, -r, r * 0.58, a + 0.3, a + TAU / 5 - 0.3);
          c.arc(x, -r, r * 0.26, a + TAU / 5 - 0.2, a + 0.2, true);
          c.closePath();
        }
        c.fill();
      } else {
        c.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = a0 + (i * TAU) / 12;
          c.moveTo(x + Math.cos(a) * r * 0.5 + r * 0.07, -r + Math.sin(a) * r * 0.5);
          c.arc(x + Math.cos(a) * r * 0.5, -r + Math.sin(a) * r * 0.5, r * 0.07, 0, TAU);
        }
        c.fill();
      }
      c.strokeStyle = S.G.mix(f, '#000000', 0.3);
      c.lineWidth = r * 0.05;
      c.beginPath(); c.arc(x, -r, r * 0.68, 0, TAU); c.stroke();
      c.fillStyle = S.G.mix(f, '#ffffff', 0.15);
      c.beginPath(); c.arc(x, -r, r * 0.17, 0, TAU); c.fill();
    } else if (nav === 'vit') {
      // vita däcksidor och en stor kromad navkapsel (amerikanaren)
      c.fillStyle = S.ton('#e9e7df');
      c.beginPath(); c.arc(x, -r, r * 0.8, 0, TAU); c.fill();
      c.fillStyle = '#121214';
      c.beginPath(); c.arc(x, -r, r * 0.6, 0, TAU); c.fill();
      c.fillStyle = f;
      c.beginPath(); c.arc(x, -r, r * 0.54, 0, TAU); c.fill();
      c.strokeStyle = S.G.mix(f, '#000000', 0.35);
      c.lineWidth = r * 0.05;
      c.beginPath(); c.arc(x, -r, r * 0.3, 0, TAU); c.stroke();
    } else {
      c.fillStyle = f;
      c.beginPath(); c.arc(x, -r, r * (nav === 'buss' ? 0.56 : 0.66), 0, TAU); c.fill();
      c.strokeStyle = S.G.mix(f, '#000000', 0.35);
      c.lineWidth = r * 0.05;
      c.beginPath(); c.arc(x, -r, r * (nav === 'turbin' ? 0.5 : 0.42), 0, TAU); c.stroke();
      if (nav === 'turbin') { c.beginPath(); c.arc(x, -r, r * 0.32, 0, TAU); c.stroke(); }
      c.fillStyle = S.G.mix(f, '#000000', 0.3);
      c.beginPath(); c.arc(x, -r, r * 0.16, 0, TAU); c.fill();
    }
    // märket i mitten, som snurrar med hjulet och läses rättvänt också när bilen kör åt vänster (duken är spegelvänd då)
    if (marke) {
      c.save();
      c.translate(x, -r);
      c.rotate(vrid / r);
      c.scale(dir, 1);
      const R = r * (nav === 'stal' ? 0.26 : nav === 'ekrar' || nav === 'hal' ? 0.24 : nav === 'turbin' ? 0.3 : 0.34);
      const T = c.getTransform ? c.getTransform() : null;
      const d = T ? navBild(marke, R * Math.hypot(T.a, T.b), S) : null;
      if (d) {
        const k = R / (d.width / 2 - 1);
        c.drawImage(d, -k * d.width / 2, -k * d.width / 2, k * d.width, k * d.width);
      } else navMarke(c, marke, R, S);
      c.restore();
    }
    // en glans uppe till vänster på fälgen
    c.globalAlpha = 0.35 * (0.3 + 0.7 * S.L.dag);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(x - r * 0.25, -r * 1.3, r * 0.22, r * 0.09, -0.6, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
  }

  // text som läses rätt också när fordonet kör åt vänster (duken är spegelvänd då)
  function text(c, s, x, y, h, dir, farg) {
    c.save();
    c.translate(x, y);
    c.scale(dir, 1);
    c.font = `${h}px VT323, "Courier New", monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = farg;
    c.fillText(s, 0, 0);
    c.restore();
  }

  // ---------- märkena ----------

  // märkenas färger i gatans ljus, en gång per färg och scen (S.ton blandar om färgen varje gång)
  function tonad(S, c) {
    let m = S.tonMinne;
    if (!m || m.f !== S.ton) m = S.tonMinne = { f: S.ton, c: new Map() };
    let x = m.c.get(c);
    if (x === undefined) m.c.set(c, (x = S.ton(c)));
    return x;
  }

  // är lacken ljus? (då är jeepens dekal mörk)
  const ljus = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255) > 140; };

  // Märket på sidan (F.emblem: [text, x, y, höjd, slag]): krom är blanka bokstäver med en mörk kant (Saabens på
  // framskärmen, synliga på ljus lack också), dekal mörk på ljus lack och ljus på mörk (jeepens framdörr) och skrift
  // förgylld handstil (amerikanaren). Läses rätt också när bilen kör åt vänster.
  function emblem(c, b, S, dir) {
    const [s, x, y, h, slag] = b.F.emblem;
    c.save();
    c.translate(x, y);
    c.scale(dir, 1);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    if (slag === 'skrift') {
      c.font = `italic 700 ${h}px "Brush Script MT", "Segoe Script", "Snell Roundhand", "URW Chancery L", cursive`;
      c.lineWidth = 1.4;
      c.strokeStyle = tonad(S, '#4a3818');
      c.strokeText(s, 0, 0);
      c.fillStyle = tonad(S, '#e3c26a');
    } else {
      c.font = `700 ${h}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      if (slag === 'krom') {
        c.lineWidth = 1.6;
        c.strokeStyle = tonad(S, '#17181b');
        c.strokeText(s, 0, 0);
        c.fillStyle = tonad(S, '#dfe2e5');
      } else c.fillStyle = tonad(S, ljus(b.lack) ? '#26272a' : '#d9dce0');
    }
    c.fillText(s, 0, 0);
    c.restore();
  }

  // Mercedesstjärnan på huven: från sidan ses ringen från kanten, en smal blank stav på sin fot
  function stjarna(c, S, [x, y]) {
    const k = tonad(S, '#d6d9dd');
    c.fillStyle = k;
    c.beginPath();
    c.ellipse(x, y, 3.2, 1.6, 0, Math.PI, 0);
    c.fill();
    c.fillRect(x - 0.6, y - 3.2, 1.2, 3.2);
    c.lineWidth = 1.1;
    c.strokeStyle = k;
    c.beginPath();
    c.ellipse(x, y - 7, 1.3, 3.8, 0, 0, TAU);
    c.stroke();
    c.fillRect(x - 0.35, y - 10.6, 0.7, 7.4);
  }

  // Märkets vägar i en ruta med radien 1 (y nedåt): Peugeots lejon (vänt åt vänster), Saabs grip med kronan och
  // Ladas skepp.
  const LEJON = [[-0.18, -0.86], [0.12, -0.78], [0.2, -0.5], [0.32, -0.2], [0.42, 0.15], [0.5, 0.12], [0.66, -0.12], [0.6, -0.42],
    [0.74, -0.36], [0.76, -0.08], [0.58, 0.26], [0.5, 0.55], [0.46, 0.86], [0.24, 0.86], [0.3, 0.62], [0.22, 0.42], [0, 0.3],
    [-0.18, 0.32], [-0.52, 0.18], [-0.5, 0.06], [-0.18, 0.08], [-0.12, -0.08], [-0.5, -0.2], [-0.56, -0.32], [-0.44, -0.38],
    [-0.18, -0.32], [-0.3, -0.5], [-0.5, -0.56], [-0.5, -0.68], [-0.36, -0.8]];
  const GRIP = [[-0.32, 0.72], [-0.42, 0.3], [-0.6, 0.2], [-0.44, 0.1], [-0.62, -0.02], [-0.4, -0.06], [-0.3, -0.28], [-0.12, -0.38],
    [0.12, -0.36], [0.34, -0.24], [0.56, -0.1], [0.64, 0.08], [0.5, 0.02], [0.4, 0.1], [0.22, 0.12], [0.12, 0.3], [0.12, 0.5], [0.22, 0.72]];
  const KRONA = [[-0.3, -0.3], [-0.34, -0.64], [-0.2, -0.46], [-0.08, -0.72], [0.02, -0.46], [0.14, -0.64], [0.12, -0.34]];

  // Märket i navet som en liten bild, en gång per märke, storlek (i bildpunkter, R × skalan) och scen, som sedan läggs ut
  // vriden: ett par dussin vägar per bil och bild blev en femtedel till en tredjedel mer arbete för bilen (bilderna är
  // högst 32, ungefär 16 kB var i datorn).
  function navBild(m, rpx, S) {
    if (typeof document === 'undefined' || !(rpx > 2)) return null;
    const n = Math.min(160, Math.ceil(rpx / 2) * 2);
    let minne = S.navMinne;
    if (!minne || minne.f !== S.ton) minne = S.navMinne = { f: S.ton, b: new Map() };
    const key = m + n;
    let d = minne.b.get(key);
    if (!d) {
      d = document.createElement('canvas');
      d.width = d.height = 2 * n + 2;
      const g = d.getContext('2d');
      g.translate(n + 1, n + 1);
      navMarke(g, m, n, S);
      minne.b.set(key, d);
      if (minne.b.size > 32) minne.b.delete(minne.b.keys().next().value);
    }
    return d;
  }

  // Märket i navet, i radien R kring mitten (i lackens ljus, så att det mörknar med resten på kvällen).
  function navMarke(c, m, R, S) {
    const t = (f) => tonad(S, f);
    const MORK = t('#1c1f26');
    const BLANK = t('#d8dbdf');
    const disk = (f, rr = R) => { c.fillStyle = f; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill(); };
    const ring = (f, rr, w) => { c.strokeStyle = f; c.lineWidth = w; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); };
    const yta = (f, P) => {
      c.fillStyle = f;
      c.beginPath();
      P.forEach(([x, y], i) => (i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R)));
      c.closePath();
      c.fill();
    };
    const linje = (f, w, ...L) => {
      c.strokeStyle = f;
      c.lineWidth = w * R;
      c.beginPath();
      for (const P of L) P.forEach(([x, y], i) => (i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R)));
      c.stroke();
    };
    const ellips = (f, w, x, y, rx, ry) => {
      c.strokeStyle = f;
      c.lineWidth = w * R;
      c.beginPath();
      c.ellipse(x * R, y * R, rx * R, ry * R, 0, 0, TAU);
      c.stroke();
    };
    const ord = (s, h, f, font = `700 ${h * R}px "Helvetica Neue", Helvetica, Arial, sans-serif`) => {
      c.fillStyle = f;
      c.font = font;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(s, 0, R * 0.04);
    };
    c.lineJoin = 'miter';
    c.miterLimit = 3;
    c.lineCap = 'butt';
    switch (m) {
      case 'volvo': {
        // järntecknet: ringen med pilen snett uppåt framåt, mörkt på den blanka kapseln
        disk(t('#c4c8cd'));
        const k = t('#1f2836');
        ring(k, R * 0.52, R * 0.15);
        c.save();
        c.rotate(-Math.PI / 4);
        c.fillStyle = k;
        c.fillRect(R * 0.54, -R * 0.075, R * 0.18, R * 0.15);
        yta(k, [[0.97, 0], [0.68, -0.24], [0.68, 0.24]]);
        c.restore();
        break;
      }
      case 'saab':
        // griphuvudet med kronan, rött på blått
        disk(t('#e7e3d8'));
        disk(t('#1f4c9e'), R * 0.86);
        yta(t('#c62a2e'), GRIP);
        yta(t('#e2b23a'), KRONA);
        c.fillStyle = t('#f2efe6');
        c.beginPath(); c.arc(R * 0.22, -R * 0.17, R * 0.06, 0, TAU); c.fill();
        break;
      case 'saabText':
        disk(t('#c4c8cd'));
        ord('SAAB', 0.5, MORK);
        break;
      case 'mercedes': {
        // den trearmade stjärnan i ringen
        disk(MORK);
        ring(BLANK, R * 0.84, R * 0.1);
        const P = [];
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i * TAU) / 3;
          P.push([Math.cos(a) * 0.8, Math.sin(a) * 0.8], [Math.cos(a + Math.PI / 3) * 0.16, Math.sin(a + Math.PI / 3) * 0.16]);
        }
        yta(BLANK, P);
        break;
      }
      case 'bmw': {
        // svart ring kring de blå och vita fälten
        disk(t('#141519'));
        ring(BLANK, R * 0.95, R * 0.07);
        for (let i = 0; i < 4; i++) {
          c.fillStyle = t(i % 2 ? '#eef0f2' : '#2a6cc0');
          c.beginPath();
          c.moveTo(0, 0);
          c.arc(0, 0, R * 0.6, -Math.PI + (i * Math.PI) / 2, -Math.PI / 2 + (i * Math.PI) / 2);
          c.closePath();
          c.fill();
        }
        ring(BLANK, R * 0.62, R * 0.05);
        break;
      }
      case 'vw':
        disk(t('#1d3a70'));
        ring(BLANK, R * 0.84, R * 0.11);
        // (V:et och W:et möts i mitten)
        c.lineJoin = 'round';
        linje(BLANK, 0.12, [[-0.44, -0.7], [0, 0.12], [0.44, -0.7]], [[-0.8, -0.34], [-0.4, 0.72], [0, 0.12], [0.4, 0.72], [0.8, -0.34]]);
        break;
      case 'audi':
        disk(MORK);
        for (const x of [-0.48, -0.16, 0.16, 0.48]) ellips(BLANK, 0.07, x, 0, 0.2, 0.2);
        break;
      case 'opel':
        // blixten genom ringen
        disk(MORK);
        ring(BLANK, R * 0.7, R * 0.1);
        yta(BLANK, [[-1, 0.12], [0.18, -0.24], [0.05, -0.04], [1, -0.12], [-0.18, 0.24], [-0.05, 0.04]]);
        break;
      case 'ford':
        // den blå ovalen med namnet
        disk(t('#2a2d33'));
        c.fillStyle = t('#1f4596');
        c.beginPath(); c.ellipse(0, 0, R * 0.92, R * 0.56, 0, 0, TAU); c.fill();
        c.strokeStyle = t('#e9ecef');
        c.lineWidth = R * 0.06;
        c.stroke();
        ord('Ford', 0.6, t('#ffffff'), `italic 700 ${R * 0.6}px Georgia, "Times New Roman", serif`);
        break;
      case 'toyota':
        disk(MORK);
        ellips(BLANK, 0.09, 0, 0, 0.84, 0.58);
        ellips(BLANK, 0.09, 0, 0.04, 0.26, 0.54);
        ellips(BLANK, 0.09, 0, -0.28, 0.56, 0.2);
        break;
      case 'nissan':
        disk(MORK);
        ring(BLANK, R * 0.66, R * 0.1);
        c.fillStyle = BLANK;
        c.fillRect(-R * 0.92, -R * 0.2, R * 1.84, R * 0.4);
        ord('NISSAN', 0.27, MORK);
        break;
      case 'mazda':
        disk(MORK);
        ord('mazda', 0.5, BLANK);
        break;
      case 'peugeot':
        disk(t('#1f2d5c'));
        yta(BLANK, LEJON);
        break;
      case 'fiat':
        // de fem sneda balkarna
        disk(t('#1e3c80'));
        for (let i = 0; i < 5; i++) {
          const x = -0.7 + i * 0.25;
          yta(BLANK, [[x, 0.6], [x + 0.13, 0.6], [x + 0.43, -0.6], [x + 0.3, -0.6]]);
        }
        break;
      case 'renault':
        // romben
        disk(MORK);
        linje(BLANK, 0.13, [[0, -0.84], [0.5, 0], [0, 0.84], [-0.5, 0], [0, -0.84], [0.5, 0]]);
        linje(BLANK, 0.1, [[0, -0.44], [0.26, 0], [0, 0.44], [-0.26, 0], [0, -0.44], [0.26, 0]]);
        break;
      case 'citroen':
        // dubbelvinkeln
        disk(MORK);
        for (const y of [-0.32, 0.16]) yta(BLANK, [[-0.66, y + 0.22], [0, y - 0.16], [0.66, y + 0.22], [0.66, y + 0.42], [0, y + 0.04], [-0.66, y + 0.42]]);
        break;
      case 'lada':
        // skeppet med seglet, på rött
        disk(t('#9e2328'));
        c.fillStyle = BLANK;
        c.beginPath();
        c.moveTo(R * 0.12, -R * 0.68);
        c.quadraticCurveTo(-R * 0.5, -R * 0.2, -R * 0.5, R * 0.28);
        c.lineTo(R * 0.12, R * 0.28);
        c.closePath();
        c.fill();
        yta(BLANK, [[-0.6, 0.38], [0.6, 0.38], [0.42, 0.6], [-0.42, 0.6]]);
        break;
      case 'jeep':
        disk(MORK);
        ord('Jeep', 0.5, BLANK);
        break;
      case 'chrysler': {
        // femstjärnan med femhörningen i mitten
        disk(MORK);
        const P = [];
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rr = i % 2 ? 0.36 : 0.84;
          P.push([Math.cos(a) * rr, Math.sin(a) * rr]);
        }
        yta(BLANK, P);
        const Q = [];
        for (let i = 0; i < 5; i++) {
          const a = Math.PI / 2 + (i * TAU) / 5;
          Q.push([Math.cos(a) * 0.2, Math.sin(a) * 0.2]);
        }
        yta(MORK, Q);
        break;
      }
      default:
    }
  }

  // ljusets sken: en rund toning (i fordonets enheter)
  function sken(c, x, y, r, farg, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${farg},${a})`);
    g.addColorStop(0.35, `rgba(${farg},${a * 0.35})`);
    g.addColorStop(1, `rgba(${farg},0)`);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  // Under fordonet: skuggan, och i den våta gatan spegelbilden och, i mörkret, lyktornas strimmor.
  function under(c, b, S, ljus) {
    const h = b.L / 2;
    if (S.vat) {
      c.save();
      c.scale(1, -0.5);
      c.globalAlpha = 0.16;
      c.fillStyle = b.c;
      if (b.F.kaross) c.fill(vag(b.F.kaross));
      // (på två hjul bara lyktornas strimmor: en låda vore fel)
      else if (!b.F.sadel) c.fillRect(-h, -300, b.L, 300);
      c.restore();
      if (S.lamps) {
        // (smalnar av nedåt, som ljus i blöt asfalt, i stället för ett rakt band)
        for (const [x, rgb, a] of ljus) {
          const g = c.createLinearGradient(0, 4, 0, 280);
          g.addColorStop(0, `rgba(${rgb},${a})`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(x - 7, 4);
          c.quadraticCurveTo(x - 1.5, 70, x, 280);
          c.quadraticCurveTo(x + 1.5, 70, x + 7, 4);
          c.closePath();
          c.fill();
        }
      }
    }
    c.fillStyle = 'rgba(0,0,0,0.34)';
    c.beginPath();
    c.ellipse(0, -1, h + 10, 9, 0, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(0, -1, h - 20, 4, 0, 0, TAU);
    c.fill();
  }

  // Stänk om hjulen i regnet, och avgaser i kylan när fordonet står still eller kryper.
  function stank(c, b, S, fart, t, botten) {
    const v = S.vNu || S.v;
    if (S.vat && fart > 0.8 && (S.regn || v.blott)) {
      // (en mjuk dimma av vatten bakom hjulen, låg och utdragen)
      const a = Math.min(1, fart / 4) * (S.lamps ? 0.1 : 0.2);
      const rgb = S.lamps ? '140,142,146' : '226,230,236';
      for (const x of b.F.hj) {
        const r = b.F.r;
        const f = 1 + 0.08 * Math.sin(t * 13 + x);
        c.save();
        c.translate(x - r * 1.6, -r * 0.35);
        c.scale(1, 0.4);
        sken(c, 0, 0, r * 2.4 * f, rgb, a);
        c.restore();
      }
    }
    if (S.kallt && fart < 0.6 && b.typ !== 'cykel') {
      // (mjuka moln ur avgasröret som växer, stiger och bleknar)
      const x0 = -b.L / 2 + 6;
      for (let i = 0; i < 3; i++) {
        const p = (((t * 0.5 + i / 3 + b.L * 0.001) % 1) + 1) % 1;
        sken(c, x0 - 10 - p * 80, botten - 2 - p * 40, 12 + p * 38, '226,230,236', 0.3 * Math.sin(Math.PI * Math.min(1, p * 1.4)) * (S.lamps ? 0.5 : 1));
      }
    }
  }

  // Strålkastaren och baklyktan som de lyser i mörkret: skenet kring dem, ljuset på gatan framför och bromsljuset.
  // Ljuset på gatan är en mjuk fläck på asfalten framför bilen, och strålen syns bara när det finns något i luften
  // som fångar den (S.luft: regn, snö, dimma), som ett mjukt sken från lyktan och framåt. Förut var fläcken en ellips
  // med skarpa kanter och strålen en kil med raka kanter också i klar luft, som lade ett grått sken över dem som gick
  // och bilen framför. Lika många ritanrop som förut.
  function lyktor(c, b, S, fram, bak, broms) {
    const [fx, fy, fw, fh] = fram;
    const [bx, by, bw, bh] = bak;
    const fxe = fx + fw;
    const byc = by + bh / 2;
    if (S.lamps) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      // ljuset på gatan framför: en fläck som tonar ut åt alla håll, starkast ett par meter fram
      c.save();
      c.translate(fxe + 190, -2);
      c.scale(1, 0.04);
      const g = c.createRadialGradient(-70, 0, 0, 0, 0, 260);
      g.addColorStop(0, 'rgba(255,236,196,0.24)');
      g.addColorStop(0.55, 'rgba(255,236,196,0.09)');
      g.addColorStop(1, 'rgba(255,236,196,0)');
      c.fillStyle = g;
      c.fillRect(-260, -260, 520, 520);
      c.restore();
      // strålen i regnet, snön eller dimman: starkast vid lyktan, mjuka kanter, lite nedåt
      if (S.luft > 0.05) {
        c.save();
        c.translate(fxe + 200, fy + fh / 2 + 10);
        c.rotate(0.07);
        c.scale(1, 0.15);
        const s = c.createRadialGradient(-190, 0, 0, 0, 0, 230);
        s.addColorStop(0, `rgba(255,240,210,${(0.2 * S.luft).toFixed(3)})`);
        s.addColorStop(0.45, `rgba(255,240,210,${(0.07 * S.luft).toFixed(3)})`);
        s.addColorStop(1, 'rgba(255,240,210,0)');
        c.fillStyle = s;
        c.fillRect(-230, -230, 460, 460);
        c.restore();
      }
      sken(c, fxe - 2, fy + fh / 2, 70, '255,244,214', 0.6);
      // (bromsljuset mjukare sedan 2026-11-17: det lyste som en varningslampa i mörkret)
      sken(c, bx, byc, broms ? 60 : 44, '255,48,32', broms ? 0.44 : 0.32);
      c.restore();
    } else {
      sken(c, fxe - 2, fy + fh / 2, 22, '255,250,232', 0.35);
      if (broms) sken(c, bx, byc, 32, '255,40,24', 0.36);
    }
  }

  // Skärmarna som sitter för sig (Bubblan, Ankan) och kjolarna över bakhjulet (Ankan, BX): i lackens färg, ljusare
  // upptill och med en mörk kant; kjolen nertill som karossen bakom (S, F: med stötlisten och den mörkare kanten).
  function skarmar(c, b, d, S, F) {
    const P = vag(d);
    c.fillStyle = b.c;
    c.fill(P);
    c.save();
    c.clip(P);
    c.fillStyle = b.cL;
    c.fillRect(-b.L, -120, 2 * b.L, 34);
    if (F) {
      c.fillStyle = F.kjol ? S.ton(F.kjol) : b.cM;
      c.fillRect(-b.L, F.list[1], 2 * b.L, 60);
      c.fillStyle = S.ton(F.listKrom ? '#b9bdc2' : '#18191c');
      c.fillRect(-b.L, F.list[0], 2 * b.L, F.list[1] - F.list[0]);
    }
    c.restore();
    c.lineWidth = 1.6;
    c.strokeStyle = b.cM;
    c.stroke(P);
  }

  // ---------- de som åker ----------
  //
  // Föraren och de som åker med (i bilarna, skåpbilarna, taxin, lastbilen, plogbilen och bussarna) är människor i
  // profil som de som går förbi: huvudet med näsan och hakan, örat, ögat med locket, brynet, näsborren och läpparna
  // (läppstift på några, rosiga kinder i kylan), håret med glans eller lockar och mössorna efter rum-fasad.js (i
  // centimeter med huvudets mitt i (1, −166), vända åt höger), halsen och axlarna i jackan, dunjackan, prasselåket,
  // kavajen eller jeansjackan med fårskinnskrage, ibland skjortkrage och slips eller polokrage, och bältet över axeln på
  // dem som kör. De sitter: sätets rygg och nackstödet bakom (inga nackstöd i de gamla), och föraren har handen på
  // ratten, som från sidan är en smal ring med överkanten framåt (nästan platt i bussen och lastbilen), eller
  // mobiltelefonen vid örat. Nittiotal: page, permanent, hockeyfrilla, hästsvans med snodd och gelé i håret,
  // mustasch, stora glasögon, solglasögon i solen, walkman och en cigarett i mungipan (inte i bussen); i bilen ibland
  // en Wunderbaum som svänger i backspegeln när den bromsar, ett barn i baksätet och en hund bakom baksätet i kombin.
  // I bussen sätenas ryggar med handtaget, de som sitter (några baklänges), de som står och håller sig i stången
  // ovanför (fler i rusningen) och chauffören i SL:s blå, och de gula stängerna i dörrarnas glas.
  //
  // De lever (livet, räknat ur tiden, var och en i sin takt): andas och blinkar, föraren pratar med den i baksätet i
  // tur och ordning eller nickar i takten till radion, barnet vinkar, hunden flämtar, någon läser kvällstidningen i
  // bussen, de som står gungar, cigaretten ger ett bloss, och alla lutar sig fram när det bromsar. Rutorna är glas:
  // de står öppna i karossen, så att affären och de som går förbi syns svagt genom bilen (bussen bara på dagen, då
  // den inte är upplyst inne).
  //
  // Nittiotal (2026-11-28): biltelefonen med spiralsladd i de stora bilarna, hantverkaren i arbetsjacka och keps i
  // skåpbilen och brevbäraren i Postens blå i den gula, raggaren med flottfrilla i amerikanaren med tärningarna i
  // backspegeln, någon som sover i bussen (huvudet sjunker och rycker upp), och en varm dag står förarrutan nedvevad med
  // armbågen i (armUte).
  //
  // Allt lottas en gång per fordon och scen (inne) ur ett eget frö, inte ur luckans R, så att trafiken är densamma
  // som förut, och ritas med sparade vägar (vag), utan bilder. Glaset lägger ett dis över dem och himlen speglas i
  // det; på kvällen är de mörka, med instrumentens sken (grönt i Saabarna, rött i de tyska, gult i de andra) i
  // ansiktet på föraren och glöden från cigaretten, och i bussen syns de i inneljuset. När ett huvud blir mindre än
  // 16 punkter på skärmen ritas det utan de små dragen och sakerna (finare).
  function froet(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const r1 = (x) => Math.round(x * 10) / 10;
  const hashS = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h; };
  const ellS = (cx, cy, rx, ry) => `M${r1(cx - rx)} ${cy} a${rx} ${ry} 0 1 0 ${r1(2 * rx)} 0 a${rx} ${ry} 0 1 0 ${r1(-2 * rx)} 0 Z`;
  // huvudet i profil med näsan och hakan (som huvudForm i rum-fasad.js, med munnen stängd)
  const NASOR = {
    rak: 'Q11 -166 13.6 -162.5 Q12 -161 10.6 -160.6',
    liten: 'Q11 -165.6 12.6 -162.6 Q11.8 -161.2 10.6 -160.8',
    uppat: 'Q11.4 -165.2 13.4 -163.6 Q13 -161.2 10.6 -160.8',
    stor: 'Q11.8 -166.8 15.4 -162 Q13.6 -160.2 10.6 -160.4',
    krok: 'Q13 -168 14.8 -163.4 Q14.6 -161.2 12.4 -161 Q11.2 -160.8 10.6 -160.6',
    knol: 'Q11 -166.6 12.6 -164.4 Q15 -164 14.6 -161.6 Q13.6 -160 10.6 -160.6',
  };
  // (hakan med käken nerfälld d cm när munnen är öppen)
  const HAKOR = {
    rak: (y, n) => `Q11.4 ${y(-156)} 7 ${y(-154.5)} Q2 ${y(-153)} -3 ${n}`,
    svag: (y, n) => `Q10.4 ${y(-156.6)} 6 ${y(-155.2)} Q1.6 ${y(-154)} -3 ${n}`,
    stark: (y, n) => `Q12.2 ${y(-155.6)} 8.6 ${y(-153.4)} Q3 ${y(-152.2)} -3 ${n}`,
    dubbel: (y, n) => `Q11.6 ${y(-156.6)} 8.4 ${y(-155.4)} Q8.8 ${y(-152.6)} 4 ${y(-152)} Q0 ${y(-152.4)} -3 ${n}`,
  };
  const huvudForm = (nasa, haka, d = 0) => `M-9.5 -163 Q-10.5 -177 0 -178 Q10 -178 10.5 -169 ${NASOR[nasa]} ${HAKOR[haka]((v) => r1(v + d), r1(-154 + d * 0.5))} Q-9 -156 -9.5 -163 Z`;
  const skaggForm = (d) => { const y = (v) => r1(v + d); return `M0.6 -167 H2.6 Q2.8 -161.6 4.8 -160.2 Q6.6 -158.8 8.3 -158.9 L8.6 ${y(-157.8)} Q9.8 ${y(-157.3)} 11 ${y(-157.7)} Q12.2 ${y(-154.2)} 8.4 ${y(-152)} Q2.4 ${y(-150.6)} -2.8 ${r1(-153.4 + d * 0.5)} Q0.2 -158 0.6 -167 Z`; };
  // (munnen öppen när de pratar)
  const SVALG = 'M10.9 -159.3 Q8.9 -159.5 8.5 -158.6 Q8.8 -157.9 10.8 -157.9 Z';
  // ögonlocket, näsborren, läpparna, kinderna, glansen och lockarna i håret, och kläderna
  const LOCK = 'M6.3 -167.6 Q7.6 -168.5 8.9 -167.5';
  const NASBORRE = 'M10.9 -161.5 Q11.7 -161.2 12.1 -161.9';
  const LAPPAR = 'M8.3 -159.1 Q9.7 -159.7 10.9 -159.1 Q10.9 -158.1 9.9 -157.9 Q8.9 -158.1 8.3 -159.1 Z';
  const KIND = ellS(5.4, -161.2, 2.7, 2);
  const HAR_LYS = { bakat: 'M-7.5 -175 Q-1 -179 7 -177.6', flott: 'M-3.6 -181.4 Q3 -185.4 10.6 -182.6', kort: 'M-7.5 -174.5 Q-2 -178.3 5.5 -177.2', gel: 'M-6 -177 Q-1 -179.4 5 -178.4', knut: 'M-7.5 -174.5 Q-2 -178.3 5.5 -177.2', page: 'M-9.4 -169 Q-7 -177.6 2 -178.8', flint: 'M-4 -175.6 Q1 -177.4 5.4 -175.8' };
  const HAR_LOCKAR = 'M-15.6 -163 q1.6 -2.6 3.2 0 M-14.2 -170.6 q1.6 -2.6 3.2 0 M-10 -177.6 q1.6 -2.6 3.2 0 M-3 -181.2 q1.6 -2.6 3.2 0 M4.4 -180 q1.6 -2.6 3.2 0 M-12.4 -155 q1.6 -2.6 3.2 0 M8.6 -173.8 q1.6 -2.6 3.2 0';
  const HAR_STRA = { lang: 'M-8.6 -156 Q-9.6 -149 -7.4 -142', hockey: 'M-9 -158 Q-10.4 -153 -9.6 -148.4', svans: 'M-12 -169 Q-17 -164 -17 -154' };
  const NACK_SOM = 'M-23.4 -165 H-12.4';
  const DUN = 'M-15.4 -140 Q-1 -136.6 12.4 -139.2 M-16.4 -127 Q-1 -123.6 13.6 -126.6 M-16.8 -114 Q-1 -110.6 14.2 -113.6 M-16.8 -101 Q-1 -97.6 14.4 -100.6';
  const DUN_KRAGE = 'M-6.8 -158.6 Q-1 -156.4 5.2 -158 L6.8 -148.6 Q0 -146 -8.4 -148.4 Z';
  const PRASSEL_FALT = 'M-17.1 -124.8 L12.7 -139.4 Q14.3 -133 14.9 -124 L-17.4 -108.4 Z';
  const PRASSEL_RAND = 'M-16.4 -125.1 L12.3 -139.2';
  const KAVAJ_SLAG = 'M4.8 -152 L9.6 -139 L7 -132.5';
  const JEANS_KRAGE = 'M-7.6 -156.4 Q-1 -152.6 6.2 -155.6 L8 -146.6 Q0 -143.8 -9.4 -146.6 Z';
  const JEANS_SOM = 'M-16.6 -137 Q-1 -133 13.6 -136.4 M3 -134 V-124';
  const ARMEN = 'M-1.5 -147.5 Q8.5 -145 9.6 -132 L10 -108';
  const PRASSEL = [['#2fa8a8', '#6a3a9a'], ['#e0408a', '#2a4a9a'], ['#1b1d22', '#c9262a'], ['#2a6ab0', '#e7e3d8'], ['#3f7a3a', '#5a3a7a'], ['#6a3a9a', '#e0c02a']];
  const KAVAJER = ['#2a3040', '#3a3a3e', '#4a3e34', '#24345a', '#5a5a58', '#6a5a48'];
  // handen som vinkar och tidningen i bussen
  const HANDFLATA = 'M-3.6 2 Q-4.4 -4 -3.2 -8.6 Q-2.4 -9.6 -1.6 -8.6 L-1.4 -5 Q-0.8 -9.8 0.4 -9.6 Q1.4 -9.4 1.2 -5 Q2 -9 3 -8.4 Q3.8 -7.8 3 -4 Q4.6 -6.4 5.4 -5.4 Q6 -4.4 3.6 0 Q2.6 3.6 -1 3.6 Q-3.2 3.4 -3.6 2 Z';
  const TIDNING = 'M13 -177 L25 -181 L27.5 -147 L15.5 -143 Z';
  const TIDNING_HUVUD = 'M13.2 -175 L25.1 -179 L25.5 -173.4 L13.6 -169.4 Z';
  const TIDNING_RADER = 'M14 -165.5 L25.8 -169.4 M14.3 -161.4 L26.1 -165.3 M14.6 -157.3 L26.4 -161.2 M14.9 -153.2 L26.7 -157.1';
  const TUNGA = 'M12.6 5 Q14.6 10 12.4 12.6 Q10.4 10.6 11 5.2 Z';
  // håret (som HAR, HAR_BAK och HAR_UNDER i rum-fasad.js): framtill, det som hänger bakom (hockeyfrillan, det långa
  // och hästsvansen) och det som syns under mössan; TOPP var det högsta är (för walkmanens bygel)
  const HARET = {
    kort: 'M-10 -160 Q-12 -179.5 1 -179.5 Q11 -179 11 -170 Q6 -173 1 -170 Q-3 -166 -5 -160 Q-7 -157 -10 -155 Z',
    gel: 'M-10 -160 Q-12 -178 -6 -181 L-4 -186 L-1 -181.5 L2 -187 L4 -181.5 L7.5 -185.5 L8 -180 Q11.5 -178 11 -170 Q6 -173 1 -170 Q-3 -166 -5 -160 Q-7 -157 -10 -155 Z',
    page: 'M-11 -152 Q-13.5 -166 -10 -175 Q-4 -181.5 3 -180.5 Q11.5 -179 12 -169.5 Q7 -173 2 -170.5 Q-1 -166 0 -158 Q0 -153 -2 -151.5 Q-7 -150 -11 -152 Z',
    lockar: 'M-13 -150 Q-19 -160 -14 -171 Q-12 -183 -1 -184 Q11 -184.5 13 -173 Q14 -169 12 -167.5 Q7 -172 2 -169.5 Q-2 -165 -2 -158 Q-3 -151 -7 -147 Q-11 -146 -13 -150 Z',
    flint: 'M-10 -157 Q-11.5 -167 -7.5 -171 Q-4 -168 -4.5 -162 Q-5 -158 -6.5 -155.5 Z',
    knut: 'M-10 -160 Q-12 -179.5 1 -179.5 Q11 -179 11 -170 Q6 -173 1 -170 Q-3 -166 -5 -160 Q-7 -157 -10 -155 Z M-17.5 -176 a6 5.6 0 1 0 12 0 a6 5.6 0 1 0 -12 0 Z',
    afro: 'M-12 -152 Q-21 -160 -18 -174 Q-14 -190 1 -191 Q15 -191 17 -177 Q18 -170 13.5 -167 Q7 -173 2 -170 Q-2 -165 -3 -158 Q-5 -151 -12 -152 Z',
    // (bakåtkammat, och raggarnas flottfrilla med luggen i en våg framåt; som HAR i rum-fasad.js)
    bakat: 'M-10 -160 Q-12.6 -178 -2.5 -180.6 Q7.6 -181.6 11.4 -174 Q8 -175.6 3.4 -174.8 Q-1.6 -173.6 -4.4 -167 Q-6.6 -160 -10 -155 Z',
    flott: 'M-10 -160 Q-12.4 -178.5 -3.4 -183 Q5.6 -187.4 13.2 -183.6 Q15.8 -181 12.6 -178.2 Q11.2 -176 10.8 -172.6 Q6 -175 1.4 -172.4 Q-3 -167 -5 -160 Q-7 -157 -10 -155 Z',
  };
  const HARET_BAK = {
    lang: 'M-10 -160 Q-13 -150 -9 -139 L-3 -141 Q-6 -150 -5 -160 Z',
    hockey: 'M-10 -161 Q-12.5 -152 -11 -146 Q-8 -144.5 -4.5 -147.5 Q-5.5 -153 -5 -160 Z',
    svans: 'M-9 -173 Q-19 -172 -19.5 -158 Q-19 -149 -15 -146 Q-15.5 -156 -8.5 -165 Z',
  };
  const HARET_UNDER = {
    kort: HARET.kort, gel: HARET.kort, knut: HARET.kort, flint: HARET.flint, bakat: HARET.kort, flott: HARET.kort,
    page: 'M-11 -152 Q-13.5 -166 -10 -174.5 Q-4.5 -179.6 2.5 -179 Q10.5 -178.2 11.4 -169.5 Q7 -173 2 -170.5 Q-1 -166 0 -158 Q0 -153 -2 -151.5 Q-7 -150 -11 -152 Z',
    lockar: 'M-13 -150 Q-19 -160 -14.6 -170.5 Q-13 -178.6 -3 -179.4 Q9.6 -179.8 12.2 -172 Q13.4 -169 12 -167.5 Q7 -172 2 -169.5 Q-2 -165 -2 -158 Q-3 -151 -7 -147 Q-11 -146 -13 -150 Z',
    afro: 'M-12 -152 Q-21.5 -158.5 -20 -168 Q-18.6 -177 -9 -178.6 Q4 -180.4 11.4 -175.6 Q14.6 -172 13.5 -167 Q7 -173 2 -170 Q-2 -165 -3 -158 Q-5 -151 -12 -152 Z',
  };
  const TOPP = { kort: -179.6, gel: -181.4, page: -181.4, lockar: -184, afro: -190.8, flint: -178.2, knut: -179.6, bakat: -180.8, flott: -186.4, mossa: -188.5, keps: -180, kepa: -181.4 };
  // frisyrerna: håret framtill och det som hänger bakom
  const FRISYRER = {
    kort: ['kort'], gel: ['gel'], flint: ['flint'], perm: ['lockar'], page: ['page'], knut: ['knut'], afro: ['afro'],
    hockey: ['kort', 'hockey'], lang: ['kort', 'lang'], svans: ['kort', 'svans'], bakat: ['bakat'], flott: ['flott'],
  };
  const FRISYR_MAN = [['kort', 34], ['hockey', 14], ['flint', 8], ['gel', 8], ['perm', 6], ['page', 3], ['lang', 3], ['svans', 2], ['afro', 1], ['bakat', 4], ['flott', 1]];
  const FRISYR_ALDRE = [['kort', 10], ['flint', 12], ['perm', 2]];
  const FRISYR_KV = [['page', 24], ['perm', 22], ['lang', 18], ['svans', 13], ['knut', 8], ['kort', 10], ['afro', 2]];
  const FRISYR_BARN = [['kort', 4], ['page', 3], ['svans', 3], ['hockey', 1]];
  // mössorna: kullen och kanten (mössans uppvikta kant)
  const MOSSAN = {
    keps: ['M-10 -167 Q-10 -180 1 -180 Q10.5 -180 11 -171 L19.5 -168.5 Q15 -166 10 -166.5 L-10 -165 Z'],
    mossa: ['M-10.8 -166.4 Q-11.8 -188.5 0.5 -188.5 Q12 -188.5 11.6 -171.4 Z', 'M-11.2 -170.6 L12 -175 L11.8 -170.4 L-11 -166 Z'],
    kepa: ['M-11 -168.5 Q-12 -178 -3 -180.5 Q9 -182 14 -173.5 L18.5 -170 Q14.5 -168 9.5 -168.6 L-11 -166 Z'],
  };
  // ansiktet: örat, ögat, brynet, munnen, mustaschen och helskägget, glasögonen (de stora bågarna och skalmen),
  // solglasögonen, walkmanens lur, cigaretten och glöden, och snodden i hästsvansen
  const ORAT = ellS(-1.5, -164, 2, 3);
  const OGA = ellS(7.6, -166.5, 1, 1);
  const BRYNET = 'M5.5 -169.5 Q8 -170.6 10 -169.4';
  const MUNNEN = {
    lugn: 'M8.3 -158.7 Q9.6 -158.5 10.9 -158.6',
    glad: 'M7.9 -159.6 Q8.9 -158.3 10.9 -158.6',
    sur: 'M8 -157.8 Q9.1 -159 10.9 -158.6',
    le: 'M7.5 -160.1 Q8.7 -158.1 10.9 -158.6',
  };
  const MUSTASCH = 'M8.2 -160.4 Q9.8 -161.2 11.2 -160.6 Q11.4 -159.3 10.6 -159.2 Q9.2 -159.5 8 -159.7 Z';
  const SKAGGET = 'M0.6 -167 H2.6 Q2.8 -161.6 4.8 -160.2 Q6.6 -158.8 8.3 -158.9 L8.6 -157.8 Q9.8 -157.3 11 -157.7 Q12.2 -154.2 8.4 -152 Q2.4 -150.6 -2.8 -153.4 Q0.2 -158 0.6 -167 Z';
  const BAGAR = ellS(8.6, -166.2, 3.3, 2.8);
  const SKALM = 'M5.3 -167 L-2 -166';
  const SOLGLAS = 'M4.5 -169 H12.6 L12.2 -165.2 Q9 -163.4 5.2 -165.2 Z';
  const LUREN = ellS(-1.8, -164.5, 3.4, 3.9);
  const CIGG = 'M10.4 -158.4 L17.4 -157.6';
  // (biltelefonens lur med spiralsladden ned mot instrumentbrädan, 2026-11-28)
  const BILTEL = 'M-2.8 -165 L0.4 -168.4 L11.8 -157.4 L8.6 -154 Z';
  const SLADD = (() => { let d = 'M9.6 -154.6'; for (let i = 1; i <= 14; i++) { const u = i / 14; d += ` L${r1(9.6 + 22 * u + (i % 2 ? 2.2 : -2.2))} ${r1(-154.6 + 30 * u + (i % 2 ? -1.6 : 1.6))}`; } return d; })();
  const GLODEN = ellS(17.9, -157.6, 0.95, 0.95);
  const GLORIA = ellS(17.9, -157.6, 3.4, 3.4);
  const SNODD = ellS(-13.4, -170.4, 2.2, 2.8);
  // halsen, kroppen med den mörkare ryggen, skjortkragen (och slipsen) och polokragen
  const HALS = 'M-4.6 -157.5 Q-4.4 -151.5 -6 -147 H5.4 Q3.6 -151 4.2 -155.6 Z';
  const KROPP = 'M-5 -153 Q-12 -151.5 -15 -145 Q-18 -135 -17.5 -60 H14 Q15.5 -112 13.5 -134 Q11.5 -147 4.5 -152 Z';
  const RYGG = 'M-15 -145 Q-18 -135 -17.5 -60 H-11.5 Q-12.5 -118 -11 -138 Q-11.5 -146 -15 -145 Z';
  const KRAGAR = {
    skjorta: 'M-6 -154.5 Q-1 -151 4.8 -154.4 L6.2 -149 Q1 -146.5 -6.4 -148.6 Z',
    polo: 'M-5.2 -159 Q-0.5 -156.5 4.6 -158 L5.8 -148 Q0 -146 -6.6 -148 Z',
  };
  const BALTE = 'M-15 -151 Q-6 -151 0 -147 Q8 -139 13 -122';
  const SLIPS = 'M4.4 -151.5 L7.4 -150 Q11 -142 12.6 -132 L11 -131 Q8 -141 4.6 -148 Z';
  // sätet: ryggen, nackstödet och dess stång
  const SATE = 'M-27.5 -144.5 Q-27.5 -150 -22 -150 H-13 Q-9 -150 -9.4 -145 L-11 -60 H-30 Z';
  const NACKSTOD = 'M-24 -173.5 Q-24 -178.5 -19.5 -178.5 H-15.5 Q-11.4 -178.5 -11.6 -173.5 L-12.2 -160.5 Q-12.4 -157 -16 -157 H-20 Q-24.2 -157 -24.2 -160.5 Z';
  // mobiltelefonen mot kinden (en Ericsson med antennen) och handen som håller den
  const MOBIL = 'M-2.5 -164.4 L0.5 -167.6 L11.5 -157.6 L8.5 -154.4 Z';
  const ANTENN = 'M-0.6 -166.6 L-3.4 -175';
  const MOBIL_H = [3.6, -160.4];
  // axeln (där armen sitter)
  const AXEL = [-1, -143];
  // Bussens säten från sidan (mitten i x 0, i bussens höjd): ryggen och handtaget ovanpå.
  // (alla säten i en väg per slag, så att de ritas med tre anrop)
  const BUSS_SATE = (x) => `M${r1(x - 9)} -193 Q${r1(x - 9.5)} -203 ${r1(x - 1.5)} -203.5 H${r1(x + 2)} Q${r1(x + 9)} -203 ${r1(x + 9)} -195 L${r1(x + 10.5)} -150 H${r1(x - 9.5)} Z`;
  const BUSS_SATE_M = (x) => `M${r1(x - 9)} -193 Q${r1(x - 9.5)} -203 ${r1(x - 1.5)} -203.5 H${r1(x + 0.5)} Q${r1(x - 4)} -202 ${r1(x - 4.2)} -194 L${r1(x - 3.6)} -150 H${r1(x - 9.5)} Z`;
  const BUSS_HANDTAG = (x) => `M${r1(x - 5)} -203 Q${r1(x + 1.5)} -211 ${r1(x + 8)} -202`;
  // Hunden bakom baksätet (en labrador, vänd framåt, huvudets mitt i 0) och Wunderbaumen i backspegeln.
  const HUND = {
    hals: 'M-7 2 Q-11 14 -12 34 H9 Q6 16 4 6 Z', huvud: ellS(0, 0, 8.2, 7.4), nos: 'M4 -3.5 L15 0 Q16.5 5 12 6 L3 6.5 Z',
    ora: 'M-4.5 -4 Q-1 -6 0.5 -2 Q0 6 -3 9 Q-6.5 8 -6 1 Z', tipp: ellS(15.2, 1, 1.8, 1.6), oga: ellS(4, -2.4, 1, 1),
  };
  const HUNDAR = [['#c9a06a', '#a07a48'], ['#1e1c1a', '#121110'], ['#7a4a26', '#5a361c'], ['#d8c8a8', '#b8a07a']];
  const DOFT = 'M0 0 L-1.6 2.6 H-0.8 L-2.8 5.6 H-1.4 L-3.6 8.8 H-0.6 V10.2 H0.6 V8.8 H3.6 L1.4 5.6 H2.8 L0.8 2.6 H1.6 Z';
  const DOFTER = ['#2e7a3a', '#2e7a3a', '#2e7a3a', '#c8262a', '#e0c02a', '#2a5ab0'];

  // färgerna: hyn (HY), håret (och det gråa), tröjorna och jackorna (nittiotalets turkos, lila och senapsgult också),
  // skjortorna, slipsarna, mössorna, kepsarna, snoddarna, sätena (velour i grått, blått och brunt, svart skinn, beige)
  const HARF = ['#2a2018', '#5a3a22', '#c9a86a', '#1b1d22', '#8a6a4a', '#d8c08a', '#7a4a2a'];
  const GRAHAR = ['#9a958c', '#c8c4bc', '#6e6a64'];
  const TROJOR = ['#24345a', '#1b1d22', '#a8262a', '#2f5a58', '#5e2a44', '#c9b98f', '#3f5a48', '#6e7f8c', '#8a5a2a', '#e7e3d8', '#3a4a8a', '#2f8a8a', '#5a3a7a', '#c9a227', '#7a1f22', '#9a9fa6'];
  const SKJORTOR = ['#e9e7e0', '#c8d4e4', '#e8e0c8', '#f0f0ec'];
  const SLIPSAR = ['#7a1f22', '#24345a', '#2e4a3c', '#5e2a44', '#c9a227'];
  const KEPSAR = ['#1b1d22', '#24345a', '#a8262a', '#e7e3d8', '#2e4a3c', '#c9a227'];
  const SNODDAR = ['#d84a8a', '#2fa8a8', '#1b1d22', '#6a3a9a', '#e7e3d8', '#c9262a'];
  const SATEN = ['#45474c', '#3a4458', '#5a4636', '#1e1f22', '#8a7458', '#4a3a3a', '#55575c'];
  // (de stora bilarna, där en och annan hade biltelefon)
  const STORA = new Set(['w124', 'w201', 'w123', 's9000', 'v740', 'v745', 'v855', 'v854', 'voyager', 'jeep']);
  // Rutorna utom den främsta (förarens), för den bil där den är nedvevad: null om bilen bara har en ruta eller den
  // sista inte är den främsta.
  function rutorBak(F) {
    if (F.rutorBak !== undefined) return F.rutorBak;
    const delar = F.rutor.split(/(?=M)/).map((d) => d.trim()).filter(Boolean);
    const x0 = (d) => parseFloat(d.slice(1));
    const sist = delar[delar.length - 1];
    F.rutorBak = delar.length > 1 && delar.slice(0, -1).every((d) => x0(d) < x0(sist)) ? delar.slice(0, -1).join(' ') : null;
    return F.rutorBak;
  }
  // de gamla utan nackstöd, och instrumentens sken på kvällen
  const UTAN_NACKSTOD = new Set(['pv', 'amazon', 'bubbla', 'ank', 'mini', 's96', 'amis', 'v144', 'v145', 'lada', 'lada4']);
  const skenFor = (m) => (/^s\d/.test(m) ? '110,230,140' : ['golf', 'passat', 'a100', 't3', 't3buss', 'bubbla', 'e30', 'w124', 'w201', 'w123'].includes(m) ? '255,96,64' : '255,178,92');

  // Ratten (m: mitten, a: lutningen från lodrätt med överkanten framåt, r: radien) och föraren armen dit: handen
  // strax bakom överkanten, armbågen nedåt. I bilen så att överkanten syns ovanför dörren (belt: rutornas underkant).
  function ratten(slag, belt) {
    const R = slag === 'bil' ? { a: 0.5, r: 19 } : slag === 'hog' ? { a: 0.95, r: 20, m: [24, -134] } : slag === 'buss' ? { a: 1.25, r: 25, m: [26, -128] } : { a: 1.05, r: 22, m: [28, -130] };
    if (!R.m) R.m = [36, Math.max(belt - 8, -152) + R.r * Math.cos(R.a)];
    const s = Math.sin(R.a);
    const k = Math.cos(R.a);
    R.H = [R.m[0] + R.r * 0.82 * s, R.m[1] - R.r * 0.82 * k];
    R.E = led(AXEL, R.H, 28, 29, -1);
    return R;
  }
  // En människa (V: färgerna och vädret, o: barn, forare, kv, aldre, kostym)
  function person(R, V, o = {}) {
    const { t, mix, pick } = V;
    const mk = (c, k) => mix(c, '#000000', k);
    const barn = Boolean(o.barn);
    const kv = o.kv !== undefined ? o.kv : R() < (o.forare ? 0.35 : 0.5);
    const aldre = !barn && R() < (o.aldre !== undefined ? o.aldre : 0.2);
    const ung = !barn && !aldre && R() < 0.35;
    const p = { s: barn ? 0.8 : 1, spegel: false };
    p.hy = t(pick(R, HY));
    p.hyM = mk(p.hy, 0.2);
    p.lapp = mix(p.hy, '#5a1e1a', 0.42);
    p.ogaF = t('#2a2018');
    p.har = t(aldre && R() < 0.65 ? pick(R, GRAHAR) : pick(R, HARF));
    p.brynF = mk(p.har, 0.25);
    const nasa = pick(R, ['rak', 'rak', 'liten', 'uppat', 'stor', 'krok', 'knol']);
    const haka = barn || kv ? (R() < 0.5 ? 'svag' : 'rak') : pick(R, aldre ? ['rak', 'dubbel', 'stark', 'svag'] : ['rak', 'rak', 'stark', 'svag']);
    p.nasa = barn ? 'liten' : nasa;
    p.haka = haka;
    p.huvud = huvudForm(p.nasa, haka);
    p.mun = o.forare ? pick(R, ['lugn', 'lugn', 'lugn', 'glad', 'le', 'sur']) : pick(R, ['lugn', 'lugn', 'glad', 'le', 'sur']);
    const fr = lotta(R, barn ? FRISYR_BARN : kv ? FRISYR_KV : aldre ? FRISYR_ALDRE : FRISYR_MAN);
    [p.frisyr, p.bak] = FRISYRER[fr];
    if (p.bak === 'svans') p.snodd = t(pick(R, SNODDAR));
    // (mössan i kylan, kepsen ibland, kepan på några äldre män)
    const h = R();
    if (V.kallt && h < 0.28) { p.hatt = 'mossa'; p.hattF = t(pick(R, MOSSOR)); }
    else if (h < 0.36 && !aldre) { p.hatt = 'keps'; p.hattF = t(pick(R, KEPSAR)); }
    else if (aldre && !kv && h < 0.5) { p.hatt = 'kepa'; p.hattF = t(pick(R, ['#5a4a3a', '#3a3a3a', '#6a5a4a', '#4a4a3e'])); }
    if (p.hatt) p.hattM = mk(p.hattF, 0.3);
    if (p.hatt && (p.frisyr === 'gel' || p.frisyr === 'knut')) p.frisyr = 'kort';
    p.jacka = t(pick(R, TROJOR));
    p.jackaM = mk(p.jacka, 0.3);
    const kr = R();
    if (o.kostym || kr < 0.2) {
      p.krage = 'skjorta';
      p.krageF = t(pick(R, SKJORTOR));
      if (!kv && !barn && (o.kostym || R() < 0.4)) p.slips = t(pick(R, SLIPSAR));
    } else if (kr < 0.32) {
      p.krage = 'polo';
      p.krageF = t(pick(R, TROJOR));
    }
    if (!kv && !barn) {
      const s = R();
      if (s < 0.14) p.skagg = MUSTASCH;
      else if (s < 0.22) p.skagg = SKAGGET;
    }
    if (!barn) {
      if (V.sol && R() < 0.22) { p.sol = t('#0e0e10'); p.bage = p.sol; }
      else if (R() < (aldre ? 0.45 : 0.14)) { p.glas = true; p.bage = t(pick(R, ['#2a2a2a', '#2a2a2a', '#7a5a3a', '#b8a070'])); }
    }
    p.hand = V.kallt && R() < 0.3 ? t(pick(R, ['#2a2a2c', '#4a3626', '#6a5440'])) : p.hy;
    if (ung && !o.forare && R() < 0.14) {
      const topp = TOPP[p.hatt || p.frisyr];
      p.lurar = `M-2.4 -167 Q-2.8 ${r1(topp + 6)} -1.2 ${r1(topp - 0.6)}`;
      p.lurF = t('#e2762a');
      p.lurB = t('#1a1a1a');
    }
    // (röka fick man inte i bussen)
    if (!barn && !V.buss && R() < 0.06) p.cigg = t('#ece8e0');
    // (kläderna, läpparna, kinderna och hur de rör sig lottas ur ett eget frö, så att alla andra drag är som förut)
    const R2 = froet(hashS(p.hy + p.har + p.jacka + p.huvud + (p.hatt || '') + o.forare));
    p.fas = R2() * 100;
    p.blink = 2.6 + R2() * 3.4;
    p.rok = t('#d8dce0');
    const pl = lotta(R2, barn ? [['jacka', 4], ['dun', 3], ['prassel', 3]] : [['jacka', 30], ['dun', V.kallt ? 26 : 10], ['prassel', ung ? 22 : 6], ['kavaj', aldre ? 30 : 10], ['jeans', ung ? 14 : 8]]);
    p.plagg = o.kostym ? 'kavaj' : pl;
    if (p.plagg === 'prassel') {
      const [a, b] = pick(R2, PRASSEL);
      p.jacka = t(a);
      p.jacka2 = t(b);
      p.rand = t('#e8e6e0');
    } else if (p.plagg === 'kavaj') {
      p.jacka = t(pick(R2, KAVAJER));
      if (!p.krage || p.krage === 'polo') { p.krage = 'skjorta'; p.krageF = t(pick(R2, SKJORTOR)); }
    } else if (p.plagg === 'jeans') {
      p.jacka = t(pick(R2, ['#4a6a9a', '#3a5478', '#5a7aa8']));
      p.krage = null;
      p.slips = null;
      p.fall = t('#e8dcc4');
      p.som2 = mix(p.jacka, '#ffffff', 0.25);
    } else if (p.plagg === 'dun') {
      p.krage = null;
      p.slips = null;
    }
    p.jackaM = mk(p.jacka, 0.3);
    p.som = mk(p.jacka, 0.24);
    p.harLjus = mix(p.har, '#ffffff', 0.24);
    p.harM = mk(p.har, 0.28);
    p.hyLjus = mix(p.hy, '#ffffff', 0.3);
    p.lappF = kv && R2() < 0.5 ? t(pick(R2, ['#9a2a3a', '#b0404a', '#7a2a3a'])) : mix(p.hy, '#a84a4a', 0.3);
    p.kind = barn ? 0.35 : V.kallt ? 0.22 : kv ? 0.12 : 0;
    p.kindF = t('#e05866');
    return p;
  }
  // Föraren: handen på ratten, eller ibland (inte de gamla) mobiltelefonen vid örat.
  function forare(R, V, o, slag, belt) {
    const p = person(R, V, { ...o, forare: true });
    if (slag === 'bil' && !o.gammal && !p.cigg && R() < 0.05) {
      p.mobil = { H: MOBIL_H, E: led(AXEL, MOBIL_H, 28, 29, 1), f: V.t('#1c1d20') };
      p.hand = p.hy;
    } else {
      p.ratt = ratten(slag, belt);
      // (biltelefonen i de stora bilarna: luren vid örat och spiralsladden ner till instrumentbrädan)
      if (slag === 'bil' && o.stor && !p.cigg && R() < 0.07) {
        p.biltel = { H: MOBIL_H, E: led(AXEL, MOBIL_H, 28, 29, 1), f: V.t('#1c1d20'), s: V.t('#2a2b30') };
        p.hand = p.hy;
      }
    }
    p.rattF = V.t('#2e2f33');
    if (slag !== 'buss') p.balte = V.t('#26272b');
    return p;
  }

  // Vilka som åker i fordonet b, lottat en gång per scen ur ett eget frö (fordonets tid, fart, längd och lack).
  function inne(S, b) {
    if (b.inneS === S) return b.inne;
    const { mix, pick } = S.G;
    let fro = Math.round((b.t0 || 0) * 977) ^ Math.round(b.fart * 1e5) ^ (b.L * 31);
    for (const ch of String(b.lack)) fro = Math.imul(fro ^ ch.charCodeAt(0), 16777619);
    const R = froet(fro);
    const v = S.vNu || S.v;
    const bussen = b.typ === 'buss' || b.typ === 'ledbuss';
    const lyst = bussen && S.lamps;
    // (i bussens inneljus på kvällen: sina färger, lite varmare och mörkare)
    const t = lyst ? (c) => mix(mix(c, '#ffd9a0', 0.12), '#000000', 0.14) : S.ton;
    const V = { t, mix, pick, buss: bussen, kallt: v.temp < 5, varmt: v.temp >= 16 && !v.fall, sol: !S.lamps && S.L.dag > 0.75 && !v.fall, rus: Boolean(S.T && S.T.rusning) };
    const I = { folk: [], dis: lyst ? 0.1 : S.lamps ? 0.24 : 0.08 + 0.16 * (1 - S.L.dag) };
    const F = b.F;
    if (bussen) bussFolk(I, R, V, b);
    else if (b.typ === 'lastbil' || b.typ === 'plog') {
      const p = forare(R, V, { kv: R() < 0.1 }, 'lastbil');
      if (b.typ === 'plog') { p.hatt = 'mossa'; p.hattF = t(pick(R, MOSSOR)); p.hattM = mix(p.hattF, '#000000', 0.3); p.jacka = t(pick(R, ['#e07a1a', '#1b1d22', '#2a3448'])); p.jackaM = mix(p.jacka, '#000000', 0.3); }
      [p.x, p.y] = b.typ === 'plog' ? [212, -212] : [300, -252];
      I.folk.push(p);
    } else if (F.forare) {
      const [fx, fy] = F.forare;
      const m = b.modell || '';
      const gammal = UTAN_NACKSTOD.has(m);
      const sate = t(pick(R, SATEN));
      const stang = t('#8a8e94');
      const satt = (p) => { p.sate = sate; p.nackstod = !gammal; p.stang = stang; return p; };
      // (i baksätet: ibland ett barn, oftare någon i taxin; i VW-bussen också längre bak)
      if (b.passagerare && (!F.hog || m === 't3buss')) {
        const barn = !b.taxi && R() < 0.3;
        const q = person(R, V, { barn, kostym: b.taxi && R() < 0.4 });
        q.x = fx - 105;
        q.y = fy + 2 + (barn ? 8 : 0);
        I.folk.push(q);
        if (m === 't3buss' && R() < 0.5) {
          const q2 = person(R, V, { barn: R() < 0.4 });
          q2.x = fx - 232;
          q2.y = fy + 2 + (q2.s < 1 ? 8 : 0);
          I.folk.push(q2);
        }
      }
      const yb = -166 + F.belt - fy;
      const d = satt(forare(R, V, { gammal, stor: STORA.has(m), aldre: b.taxi ? 0.3 : gammal ? 0.4 : 0.2, kv: b.taxi ? R() < 0.1 : undefined }, F.hog ? 'hog' : 'bil', yb));
      d.x = fx;
      d.y = fy;
      d.sill = yb;
      d.sken = skenFor(m);
      I.folk.push(d);
      // (2026-11-28) Hantverkaren i arbetsjacka och ofta keps i skåpbilen, och brevbäraren i Postens blå i den gula;
      // raggaren med flottfrillan i amerikanaren, i jeansjacka med fårskinnskrage eller skinnjacka, med tärningarna i
      // backspegeln (nedan). Ur ett eget frö, så att resten är som förut.
      const R4 = froet(fro + 11);
      const jacka = (c, plagg = null) => { d.jacka = t(c); d.jackaM = mix(d.jacka, '#000000', 0.3); d.som = mix(d.jacka, '#000000', 0.24); d.plagg = plagg; d.krage = null; d.slips = null; };
      const keps = (c) => { d.hatt = 'keps'; d.hattF = t(c); d.hattM = mix(d.hattF, '#000000', 0.3); if (d.frisyr === 'gel' || d.frisyr === 'knut' || d.frisyr === 'flott') d.frisyr = 'kort'; };
      if (m === 'skap' || m === 't3') {
        if (b.lack === '#f0c419') { jacka('#1f3a7a'); if (R4() < 0.5) keps('#1d2a4a'); } else {
          jacka(pick(R4, ['#1d2a4a', '#1a1a1e', '#2a3a5a', '#8a1e1e', '#3a4430', '#e9e7e0']));
          if (R4() < 0.55) keps(pick(R4, ['#1b1d22', '#24345a', '#a8262a', '#e7e3d8', '#c9a227']));
        }
      }
      if (m === 'amis' && !d.mobil && !d.biltel) {
        if (d.frisyr !== 'lockar' && d.frisyr !== 'page' && R4() < 0.75) { d.frisyr = 'flott'; d.bak = null; d.hatt = null; d.har = t(pick(R4, ['#1b1d22', '#2a2018', '#5a3a22', '#d8c08a'])); d.brynF = mix(d.har, '#000000', 0.25); d.harLjus = mix(d.har, '#ffffff', 0.24); d.harM = mix(d.har, '#000000', 0.28); }
        if (R4() < 0.6) { jacka(pick(R4, ['#4a6a9a', '#3a5478']), 'jeans'); d.fall = t('#e8dcc4'); d.som2 = mix(d.jacka, '#ffffff', 0.25); } else jacka('#1b1d22');
        I.tarn = { x: fx + 26, y: F.tak[2] + 12, f: t(pick(R4, ['#f0ece4', '#c8262a', '#f0ece4'])), prick: t('#141414'), sp: t('#1a1b1e'), tr: t('#d8d4cc'), ph: R4() * 6 };
      }
      // Nedvevat en varm dag: armbågen i rutan (armUte; kortärmat när det är riktigt varmt), och inget glas framför
      // föraren (rutorBak).
      if (V.varmt && !F.hog && !F.oppen && rutorBak(F) && R4() < (m === 'amis' ? 0.8 : 0.35)) {
        I.oppen = true;
        if (!d.mobil && !d.biltel && R4() < 0.65) {
          d.armUte = true;
          d.kortArm = v.temp >= 18 && R4() < 0.75;
        }
      }
      // (i den öppna bilen tröjorna och håret som förut, b.klader och b.har)
      if (F.oppen) {
        const [q] = I.folk.filter((p) => p !== d && p.s === 1 && p.x < fx - 50);
        for (const [i, p] of [[0, d], [1, q]]) if (p) { p.jacka = t(b.klader[i]); p.jackaM = mix(p.jacka, '#000000', 0.3); p.har = t(b.har[i]); p.brynF = mix(p.har, '#000000', 0.25); }
      }
      if (!F.hog && !F.oppen && F.tak[0] < -180 && R() < 0.15) {
        const [f, fm] = pick(R, HUNDAR);
        I.hund = { x: F.tak[0] + 46, y: F.belt - 17, s: 1.15, f: t(f), m: t(fm), n: t('#141210') };
      }
      if (!F.hog && !F.oppen && R() < (b.taxi ? 0.5 : 0.25) && !I.tarn) I.doft = { x: fx + 26, y: F.tak[2] + 12, f: t(pick(R, DOFTER)), sp: t('#1a1b1e'), tr: t('#d8d4cc') };
      d.sateM = mix(d.sate, '#000000', 0.25);
      // (föraren pratar med den bak, eller nickar i takten till radion; barnet vinkar; hunden flämtar)
      const R3 = froet(fro + 7);
      const bak = I.folk.find((p) => p !== d);
      if (bak && bak.s === 1 && R3() < 0.6) {
        d.liv = bak.liv = 'prat';
        d.tur = 0;
        bak.tur = 1;
        d.fasP = bak.fasP = R3() * 50;
      } else if (R3() < 0.3) {
        d.liv = 'musik';
        d.takt = 1.9 + R3() * 0.35;
      }
      if (bak && bak.s < 1 && R3() < 0.5) bak.liv = 'vinkar';
      if (I.hund) I.hund.fas = R3() * 10;
    }
    if ((b.typ === 'lastbil' || b.typ === 'plog') && froet(fro + 7)() < 0.35) Object.assign(I.folk[0], { liv: 'musik', takt: 2 });
    b.inneS = S;
    b.inne = I;
    return I;
  }
  // Bussen: i varje ruta ett säte (bakom den som sitter, eller i mitten), den som sitter (ibland baklänges) eller
  // står och håller sig i stången (fler i rusningen), och chauffören längst fram.
  function bussFolk(I, R, V, b) {
    const { t, mix, pick } = V;
    const F = b.F;
    I.star = [];
    I.saten = [];
    I.sateF = t('#6a2e2c');
    I.sateM = mix(I.sateF, '#000000', 0.3);
    I.handtag = t('#c8ccd0');
    I.stang = t('#d9a82a');
    F.rutor.forEach(([a, e], i) => {
      if (e - a < 60) return;
      const f = b.folk[i];
      const x = a + (e - a) * (f >= 0 ? f : 0.5);
      const bak = R() < 0.25;
      // (sätena i rad, ett par per ruta när den är bred)
      const n = Math.max(1, Math.round((e - a - 20) / 72));
      const saten = Array.from({ length: n }, (_, k) => a + ((e - a) / n) * (k + 0.5) - 6);
      const star = f >= 0 ? R() < (V.rus ? 0.35 : 0.12) : V.rus && R() < 0.35;
      if (star) {
        const p = person(R, V);
        p.x = f >= 0 ? x : a + (e - a) * (0.3 + R() * 0.4);
        p.y = -247 + (R() - 0.5) * 8 + (p.s < 1 ? 26 : 0);
        p.spegel = R() < 0.35;
        p.upp = true;
        I.star.push(p);
      }
      if (f >= 0 && !star) {
        const p = person(R, V);
        p.x = saten[Math.min(n - 1, Math.floor(f * n))] + (bak ? -17 : 17);
        p.y = -212 + (R() - 0.5) * 6 + (p.s < 1 ? 8 : 0);
        p.spegel = bak;
        I.folk.push(p);
        // (några läser kvällstidningen, några pratar med den bredvid)
        const u = (p.fas * 7.31) % 1;
        if (u < 0.2 && p.s === 1) { p.liv = 'tidning'; p.papper = t('#e8e4da'); p.tryck = t('#4a4a4a'); p.tryck2 = t('#c8262a'); }
        else if (u < 0.45) { p.liv = 'prat'; p.tur = Math.floor(p.fas) % 2; p.fasP = p.fas; }
        else if (u < 0.53 && p.s === 1) p.liv = 'sover';
      }
      I.saten.push(...saten);
    });
    I.satenP = [BUSS_SATE, BUSS_SATE_M, BUSS_HANDTAG].map((f) => new Path2D(I.saten.map(f).join(' ')));
    // chauffören i SL:s blå, med den platta ratten
    const [, x1] = F.rutor[F.rutor.length - 1];
    const p = forare(R, V, { kostym: true }, 'buss');
    p.jacka = t('#2a3448');
    p.jackaM = mix(p.jacka, '#000000', 0.3);
    p.krageF = t('#b8c8dc');
    p.slips = t('#24345a');
    p.x = x1 - 23;
    p.y = -216;
    I.folk.push(p);
  }

  // Hur de rör sig just nu (räknat ur tiden): huvudet andas och vrids lite, blinkar, nickar i takten och trummar
  // med handen, pratar (käken) i tur och ordning och nickar när den andra pratar, vinkar, läser
  function livet(p, t) {
    const L = { vrid: 0.012 * Math.sin(t * 0.7 + p.fas), kak: 0, blund: (t + p.fas) % p.blink < 0.14, gung: p.upp ? 0.014 * Math.sin(t * 1.2 + p.fas) : 0, hand: 0, vink: 0 };
    if (p.liv === 'musik') {
      const s = Math.sin(TAU * p.takt * t + p.fas);
      L.vrid += 0.04 * Math.max(0, s);
      L.hand = -2.2 * Math.max(0, -s);
    } else if (p.liv === 'prat') {
      const seg = Math.floor((t + p.fasP) / 2.4);
      if ((seg + p.tur) % 2 === 0 && (seg * 7919) % 10 > 2) {
        L.kak = Math.sin(t * 12.5 + p.fas) > 0 ? 1.3 : 0;
        L.vrid += 0.025 * Math.sin(t * 2.7 + p.fas);
      } else if (Math.sin(t * 1.9 + p.fas) > 0.9) L.vrid += 0.05;
    } else if (p.liv === 'vinkar') L.vink = Math.sin(t * 8 + p.fas);
    else if (p.liv === 'sover') {
      // (huvudet sjunker sakta mot bröstet och rycker upp igen, ögonen stängda)
      const u = (((t + p.fas) % 8) + 8) % 8 / 8;
      const ss = (x) => { const q = Math.min(1, Math.max(0, x)); return q * q * (3 - 2 * q); };
      L.vrid += u < 0.92 ? 0.05 + 0.32 * ss(u / 0.92) : 0.37 - 0.32 * ss((u - 0.92) / 0.05);
      L.blund = true;
    }
    else if (p.liv === 'tidning') L.vrid += 0.08;
    return L;
  }
  // Kläderna (dunjackans sömmar, prasselåkets fält och rand, kavajens slag, jeansjackans fårskinnskrage) och den
  // närmre armen mot kroppen
  function plagget(c, p, fin) {
    c.lineWidth = 1.2;
    c.strokeStyle = p.som;
    if (p.plagg === 'dun' && fin) c.stroke(vag(DUN));
    else if (p.plagg === 'prassel') {
      c.fillStyle = p.jacka2;
      c.fill(vag(PRASSEL_FALT));
      c.strokeStyle = p.rand;
      c.lineWidth = 1.4;
      c.stroke(vag(PRASSEL_RAND));
    } else if (p.plagg === 'kavaj' && fin) c.stroke(vag(KAVAJ_SLAG));
    else if (p.plagg === 'jeans' && fin) {
      c.strokeStyle = p.som2;
      c.stroke(vag(JEANS_SOM));
    }
    if (!p.ratt && !p.mobil && fin) {
      c.lineWidth = 1.3;
      c.strokeStyle = p.som;
      c.stroke(vag(ARMEN));
    }
    if (p.plagg === 'dun') {
      c.fillStyle = p.jacka;
      c.fill(vag(DUN_KRAGE));
    } else if (p.plagg === 'jeans') {
      c.fillStyle = p.fall;
      c.fill(vag(JEANS_KRAGE));
    }
  }
  // barnet vinkar (handen framför ansiktet, mot rutan)
  function vinka(c, p, v) {
    const E = [15, -151];
    const H = [21 + 2.5 * v, -177];
    c.strokeStyle = p.jacka;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(AXEL[0], AXEL[1]);
    c.lineTo(E[0], E[1]);
    c.lineTo(H[0], H[1]);
    c.stroke();
    c.save();
    c.translate(H[0], H[1] - 2);
    c.rotate(0.25 * v);
    c.fillStyle = p.hy;
    c.fill(vag(HANDFLATA));
    c.restore();
  }
  // kvällstidningen, vikt och hållen framför
  function tidningen(c, p) {
    c.fillStyle = p.papper;
    c.fill(vag(TIDNING));
    c.fillStyle = p.tryck2;
    c.fill(vag(TIDNING_HUVUD));
    c.strokeStyle = p.tryck;
    c.lineWidth = 1.6;
    c.stroke(vag(TIDNING_RADER));
    c.fillStyle = p.hand;
    c.beginPath();
    c.ellipse(16.5, -146, 4.2, 3.4, -0.3, 0, TAU);
    c.fill();
  }
  // stort nog för ansiktets små drag? (huvudet minst 16 punkter på skärmen; i en telefon med täta bildpunkter
  // ritas inte det som ändå inte syns)
  // (fasadens duk har högst två bildpunkter per punkt, rum-fasad.js)
  const DPR = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  const finare = (c) => { const m = c.getTransform(); return Math.hypot(m.a, m.b) / DPR > 0.72; };
  // En människa: sätet och nackstödet, den andra armen uppåt (de som står i bussen), halsen och kroppen, kragen,
  // håret bakom, huvudet och ansiktet, skägget, håret och mössan, glasögonen, luren och cigaretten, och sist ratten
  // med armen och handen, eller telefonen. Lutar fram när fordonet bromsar (NIG).
  function manniska(c, p, fin, t = 0) {
    const L = livet(p, t);
    c.save();
    if (NIG || L.gung) {
      c.translate(p.x, p.y + 70);
      c.rotate(NIG * (p.upp ? 2.6 : 1.4) + L.gung);
      c.translate(0, -70);
    } else c.translate(p.x, p.y);
    c.scale(p.spegel ? -p.s : p.s, p.s);
    c.translate(-1, 166);
    if (p.sate) {
      c.fillStyle = p.sate;
      c.fill(vag(SATE));
      if (p.nackstod) {
        c.fill(vag(NACKSTOD));
        c.fillStyle = p.stang;
        c.fillRect(-19, -157.5, 2.4, 8);
        if (fin && p.sateM) {
          c.strokeStyle = p.sateM;
          c.lineWidth = 0.8;
          c.stroke(vag(NACK_SOM));
        }
      }
    }
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (p.upp) {
      // (handen i stången ovanför, bakom huvudet)
      c.strokeStyle = p.jackaM;
      c.lineWidth = 8.5;
      c.beginPath();
      c.moveTo(-3, -145);
      c.lineTo(-10, -176);
      c.lineTo(-6, -212);
      c.stroke();
    }
    c.fillStyle = p.hyM;
    c.fill(vag(HALS));
    c.fillStyle = p.jacka;
    c.fill(vag(KROPP));
    c.fillStyle = p.jackaM;
    c.fill(vag(RYGG));
    if (p.plagg) plagget(c, p, fin);
    if (p.krage) {
      c.fillStyle = p.krageF;
      c.fill(vag(KRAGAR[p.krage]));
      if (p.slips) {
        c.fillStyle = p.slips;
        c.fill(vag(SLIPS));
      }
    }
    if (p.balte) {
      c.strokeStyle = p.balte;
      c.lineWidth = 3.4;
      c.lineCap = 'butt';
      c.stroke(vag(BALTE));
      c.lineCap = 'round';
    }
    // huvudet (vrids kring nacken)
    c.save();
    if (L.vrid) {
      c.translate(-2, -154);
      c.rotate(L.vrid);
      c.translate(2, 154);
    }
    const kak = L.kak;
    if (p.bak) {
      c.fillStyle = p.har;
      c.fill(vag(HARET_BAK[p.bak]));
      if (fin && !p.hatt) {
        c.strokeStyle = p.harM;
        c.lineWidth = 0.9;
        c.stroke(vag(HAR_STRA[p.bak]));
      }
      if (p.snodd && fin) {
        c.fillStyle = p.snodd;
        c.fill(vag(SNODD));
      }
    }
    c.fillStyle = p.hy;
    c.fill(vag(kak ? huvudForm(p.nasa, p.haka, kak) : p.huvud));
    if (fin) {
      c.fillStyle = p.hyM;
      c.fill(vag(ORAT));
      if (p.kind) {
        c.globalAlpha = p.kind;
        c.fillStyle = p.kindF;
        c.fill(vag(KIND));
        c.globalAlpha = 1;
      }
      if (L.blund) {
        c.lineWidth = 0.8;
        c.strokeStyle = p.ogaF;
        c.stroke(vag('M6.4 -166.3 Q7.6 -165.5 8.8 -166.3'));
      } else if (!p.sol) {
        c.fillStyle = p.ogaF;
        c.fill(vag(OGA));
        c.lineWidth = 0.6;
        c.strokeStyle = p.hyM;
        c.stroke(vag(LOCK));
      }
      c.lineWidth = 0.9;
      c.strokeStyle = p.brynF;
      c.stroke(vag(BRYNET));
      if (kak) {
        c.fillStyle = '#2a0c0e';
        c.fill(vag(SVALG));
      } else {
        c.fillStyle = p.lappF;
        c.fill(vag(LAPPAR));
        c.lineWidth = 0.5;
        c.strokeStyle = p.lapp;
        c.stroke(vag(MUNNEN[p.mun]));
      }
      c.lineWidth = 0.6;
      c.strokeStyle = p.hyM;
      c.stroke(vag(NASBORRE));
    }
    if (p.skagg) {
      c.fillStyle = p.har;
      c.fill(vag(kak && p.skagg === SKAGGET ? skaggForm(kak) : p.skagg));
    }
    c.fillStyle = p.har;
    c.fill(vag(p.hatt ? HARET_UNDER[p.frisyr] : HARET[p.frisyr]));
    if (fin && !p.hatt) {
      if (p.frisyr === 'lockar' || p.frisyr === 'afro') {
        c.strokeStyle = p.harM;
        c.lineWidth = 0.9;
        c.stroke(vag(HAR_LOCKAR));
      } else if (HAR_LYS[p.frisyr]) {
        c.strokeStyle = p.frisyr === 'flint' ? p.hyLjus : p.harLjus;
        c.lineWidth = 1.3;
        c.stroke(vag(HAR_LYS[p.frisyr]));
      }
    }
    if (p.hatt) {
      const [kulle, kant] = MOSSAN[p.hatt];
      c.fillStyle = p.hattF;
      c.fill(vag(kulle));
      if (kant) {
        c.fillStyle = p.hattM;
        c.fill(vag(kant));
      }
    }
    if (p.sol) {
      c.fillStyle = p.sol;
      c.fill(vag(SOLGLAS));
    }
    if (fin) {
      if (p.glas || p.sol) {
        c.lineWidth = 0.9;
        c.strokeStyle = p.bage;
        if (p.glas) c.stroke(vag(BAGAR));
        c.stroke(vag(SKALM));
      }
      if (p.lurar) {
        c.lineWidth = 1.6;
        c.strokeStyle = p.lurB;
        c.stroke(vag(p.lurar));
        c.fillStyle = p.lurF;
        c.fill(vag(LUREN));
      }
      if (p.cigg) {
        c.lineWidth = 1.5;
        c.strokeStyle = p.cigg;
        c.stroke(vag(CIGG));
        c.fillStyle = '#ff7a2a';
        c.fill(vag(GLODEN));
        // (ett bloss då och då, som stiger och tunnas ut)
        const u = ((t + p.fas * 1.7) % 6) / 6;
        if (u < 0.45) {
          const k = u / 0.45;
          c.globalAlpha = 0.3 * (1 - k);
          c.fillStyle = p.rok;
          c.beginPath();
          c.ellipse(18 - 6 * k, -161 - 16 * k, 1.5 + 5 * k, 1.2 + 3.5 * k, -0.6, 0, TAU);
          c.fill();
          c.globalAlpha = 1;
        }
      }
    }
    if (p.liv === 'tidning') tidningen(c, p);
    c.restore();
    if (p.ratt) {
      const { m, a, r, E, H } = p.ratt;
      c.strokeStyle = p.rattF;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(m[0], m[1]);
      c.lineTo(m[0] + 18 * Math.cos(a), m[1] + 18 * Math.sin(a));
      c.stroke();
      c.lineWidth = 3.8;
      c.beginPath();
      c.ellipse(m[0], m[1], 4.2, r, a, 0, TAU);
      c.stroke();
      if (!p.biltel && !p.armUte) armTill(c, p, E, L.hand ? [H[0], H[1] + L.hand] : H);
    }
    if (p.biltel) {
      c.strokeStyle = p.biltel.s;
      c.lineWidth = 0.9;
      c.stroke(vag(SLADD));
      c.fillStyle = p.biltel.f;
      c.fill(vag(BILTEL));
      armTill(c, p, p.biltel.E, p.biltel.H);
    } else if (p.mobil) {
      c.fillStyle = p.mobil.f;
      c.fill(vag(MOBIL));
      c.strokeStyle = p.mobil.f;
      c.lineWidth = 1.2;
      c.stroke(vag(ANTENN));
      armTill(c, p, p.mobil.E, p.mobil.H);
    }
    if (L.vink) vinka(c, p, L.vink);
    c.restore();
  }
  // Armbågen i den nedvevade rutan: överarmen ut över dörrens överkant och underarmen framåt längs den, kortärmat när
  // det är riktigt varmt. Ritas efter glaset (ritaBil), i förarens mått (p.sill: rutans underkant).
  function armUte(c, p) {
    c.save();
    if (NIG) {
      c.translate(p.x, p.y + 70);
      c.rotate(NIG * 1.4);
      c.translate(0, -70);
    } else c.translate(p.x, p.y);
    c.scale(p.s, p.s);
    c.translate(-1, 166);
    const y = p.sill;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = 9;
    c.strokeStyle = p.kortArm ? p.hy : p.jacka;
    c.beginPath();
    c.moveTo(12, y + 2.5);
    c.lineTo(32, y - 0.5);
    c.stroke();
    c.strokeStyle = p.jacka;
    c.beginPath();
    c.moveTo(AXEL[0], AXEL[1]);
    c.lineTo(p.kortArm ? 9 : 12, y + (p.kortArm ? 1.8 : 2.5));
    c.stroke();
    c.fillStyle = p.kortArm ? p.hy : p.hand;
    c.beginPath();
    c.ellipse(35.5, y - 1, 4.8, 3.4, -0.1, 0, TAU);
    c.fill();
    c.restore();
  }
  // de luddiga tärningarna i amerikanarens backspegel, som svänger när den bromsar och gungar lite med vägen
  function tarningar(c, d, t) {
    c.save();
    c.translate(d.x, d.y);
    c.fillStyle = d.sp;
    c.fillRect(-4.5, -2, 9, 4.5);
    c.rotate(-NIG * 6 + 0.07 * Math.sin(t * 2.3 + d.ph));
    c.strokeStyle = d.tr;
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(-1, 2.5);
    c.lineTo(-2.4, 7.4);
    c.moveTo(1, 2.5);
    c.lineTo(2.6, 9);
    c.stroke();
    c.fillStyle = d.f;
    c.fillRect(-5, 7.4, 4.6, 4.6);
    c.fillRect(0.4, 9, 4.6, 4.6);
    c.fillStyle = d.prick;
    for (const [x, y] of [[-3.8, 8.6], [-1.6, 10.8], [1.6, 10.2], [3.8, 12.4], [2.7, 11.3]]) c.fillRect(x - 0.45, y - 0.45, 0.9, 0.9);
    c.restore();
  }
  // den närmre armen från axeln via armbågen E till handen H
  function armTill(c, p, E, H) {
    c.strokeStyle = p.jacka;
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(AXEL[0], AXEL[1]);
    c.lineTo(E[0], E[1]);
    c.lineTo(H[0], H[1]);
    c.stroke();
    c.fillStyle = p.hand;
    c.beginPath();
    c.ellipse(H[0], H[1], 5, 3.6, Math.atan2(H[1] - E[1], H[0] - E[0]), 0, TAU);
    c.fill();
  }
  // Det som lyser genom glaset på kvällen (efter diset): instrumentens sken i förarens ansikte och cigarettens glöd.
  function lysen(c, I, S) {
    if (!S.lamps) return;
    c.globalCompositeOperation = 'lighter';
    for (const p of I.folk) {
      if (!p.sken && !p.cigg) continue;
      c.save();
      c.translate(p.x, p.y);
      c.scale(p.spegel ? -p.s : p.s, p.s);
      c.translate(-1, 166);
      if (p.sken) {
        if (p.skenC !== c) {
          const g = c.createRadialGradient(42, -150, 2, 42, -150, 40);
          g.addColorStop(0, `rgba(${p.sken},0.24)`);
          g.addColorStop(1, `rgba(${p.sken},0)`);
          p.skenG = g;
          p.skenC = c;
        }
        c.fillStyle = p.skenG;
        c.fillRect(-6, -196, 98, 92);
      }
      if (p.cigg) {
        c.fillStyle = 'rgba(255,122,42,0.9)';
        c.fill(vag(GLODEN));
        c.fillStyle = 'rgba(255,138,58,0.22)';
        c.fill(vag(GLORIA));
      }
      c.restore();
    }
    c.globalCompositeOperation = 'source-over';
  }
  // hunden bakom baksätet
  function hunden(c, h, t) {
    c.save();
    c.translate(h.x, h.y + 0.8 * Math.sin(t * 9 + (h.fas || 0)));
    c.scale(h.s, h.s);
    c.fillStyle = '#c8607a';
    c.fill(vag(TUNGA));
    c.fillStyle = h.f;
    c.fill(vag(HUND.hals));
    c.fill(vag(HUND.huvud));
    c.fill(vag(HUND.nos));
    c.fillStyle = h.m;
    c.fill(vag(HUND.ora));
    c.fillStyle = h.n;
    c.fill(vag(HUND.tipp));
    c.fill(vag(HUND.oga));
    c.restore();
  }
  // backspegeln och Wunderbaumen, som svänger fram när det bromsar
  function doften(c, d) {
    c.save();
    c.translate(d.x, d.y);
    c.fillStyle = d.sp;
    c.fillRect(-4.5, -2, 9, 4.5);
    if (NIG) c.rotate(-NIG * 6);
    c.strokeStyle = d.tr;
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(0, 2.5);
    c.lineTo(0, 8);
    c.stroke();
    c.translate(0, 8);
    c.fillStyle = d.f;
    c.fill(vag(DOFT));
    c.restore();
  }

  // En bil (eller skåpbilen): lacken i tre toner, rutorna med himlen i, listen, stötfångarna, hjulen och lyktorna.
  function ritaBil(c, b, dir, S, fart, broms, t, vrid) {
    const F = b.F;
    const P = vag(F.kaross);
    const h = F.L / 2;
    under(c, b, S, [[F.fram[0], '255,240,210', 0.32], [F.bak[0], '255,60,40', 0.28]]);
    niga(c, F);
    if (F.oppen) {
      // de som åker i den öppna bilen (före karossen, som täcker dem nedanför axlarna; sätena slutar ovanför golvet)
      const fin = finare(c);
      c.save();
      c.beginPath();
      c.rect(-h, -300, F.L, 250);
      c.clip();
      for (const p of inne(S, b).folk) manniska(c, p, fin, t);
      c.restore();
    }
    c.fillStyle = b.c;
    // (rutorna står öppna i karossen, så att det bakom syns genom bilen)
    const genom = !F.oppen;
    if (genom) c.fill(vag(F.kaross + ' ' + F.rutor), 'evenodd');
    else c.fill(P);
    // (inom karossen: ljusare under rutorna, där himlen speglas, mörkare nertill och stötlisten)
    c.save();
    c.clip(P);
    c.fillStyle = b.cL;
    c.fillRect(-h - 10, F.belt, F.L + 20, 12);
    c.fillStyle = F.kjol ? S.ton(F.kjol) : b.cM;
    c.fillRect(-h - 10, F.list[1], F.L + 20, 60);
    c.fillStyle = S.ton(F.listKrom ? '#b9bdc2' : '#18191c');
    c.fillRect(-h - 10, F.list[0], F.L + 20, F.list[1] - F.list[0]);
    c.restore();
    if (b.duk) {
      c.save();
      c.clip(P);
      c.fillStyle = S.ton(F.dukFarg || '#2b2c2f');
      c.fill(vag(F.duk));
      c.restore();
    }
    if (F.flank) skarmar(c, b, F.flank);
    if (F.sufflett) {
      c.fillStyle = S.ton(F.dukFarg || '#2b2c2f');
      c.fill(vag(F.sufflett));
    }
    // rutorna: det mörka bandet, glaset, de som åker (inne) med glasets dis över dem och himlen i glaset
    c.fillStyle = S.ton('#141518');
    if (genom) c.fill(vag(F.hus + ' ' + F.rutor), 'evenodd');
    else c.fill(vag(F.hus));
    const R = vag(F.rutor);
    const I = F.oppen ? null : inne(S, b);
    // (i den nedvevade rutan, I.oppen, finns inget glas: varken toning, dis eller himmel)
    const glas = I && I.oppen ? vag(rutorBak(F)) : R;
    c.fillStyle = S.glas;
    if (genom) c.globalAlpha = S.lamps ? 0.32 : 0.36;
    c.fill(glas);
    c.globalAlpha = 1;
    c.save();
    c.clip(R);
    if (I) {
      const fin = finare(c);
      for (const p of I.folk) manniska(c, p, fin, t);
      if (I.hund) hunden(c, I.hund, t);
      if (I.doft && fin) doften(c, I.doft);
      if (I.tarn && fin) tarningar(c, I.tarn, t);
      c.globalAlpha = I.dis;
      c.fillStyle = S.glas;
      c.fill(glas);
      c.globalAlpha = 1;
      lysen(c, I, S);
      if (I.oppen) c.clip(glas);
    }
    if (!S.lamps) {
      c.globalAlpha = 0.18 + 0.22 * S.L.dag;
      c.fillStyle = S.himmel;
      for (const a of [-h * 0.55, h * 0.05]) {
        c.beginPath();
        c.moveTo(a, -150);
        c.lineTo(a + 70, -150);
        c.lineTo(a + 20, -90);
        c.lineTo(a - 50, -90);
        c.closePath();
        c.fill();
      }
    } else if (S.L.lampor) {
      // gatlyktornas glans i glaset
      c.globalAlpha = 0.3;
      c.fillStyle = '#ffd9a0';
      c.beginPath();
      c.ellipse(-h * 0.3, F.belt - 30, 7, 2, -0.3, 0, TAU);
      c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
    if (I && I.oppen) for (const p of I.folk) if (p.armUte) armUte(c, p);
    // kromlisterna kring rutorna, fogar och handtag
    if (F.krom) {
      c.lineWidth = 2.4;
      c.strokeStyle = S.ton('#c4c8cc');
      c.stroke(vag(F.krom));
    }
    c.lineWidth = 1.6;
    c.strokeStyle = b.cM;
    c.stroke(vag(F.fog));
    if (F.galler) {
      c.lineWidth = 2.2;
      c.strokeStyle = S.G.mix(b.cM, '#000000', 0.3);
      c.stroke(vag(F.galler));
    }
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.strokeStyle = S.ton('#1a1b1e');
    c.stroke(vag(F.grepp));
    // märket på sidan och stjärnan på huven
    if (F.emblem) emblem(c, b, S, dir);
    if (F.stjarna) stjarna(c, S, F.stjarna);
    // stötfångarna och stänkskydden
    c.fillStyle = S.ton(F.stotKrom ? '#aeb2b7' : '#1d1e21');
    for (const [x, y, w, hh] of F.stot) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, hh, 4) : c.rect(x, y, w, hh); c.fill(); }
    if (F.stotKrom) {
      // (kromet: en ljus glans överst och en mörk kant nederst)
      for (const [x, y, w, hh] of F.stot) {
        c.fillStyle = S.ton('#eef0f2');
        c.fillRect(x + 2, y + 1.5, w - 4, Math.min(3, hh / 4));
        c.fillStyle = S.ton('#5c6066');
        c.fillRect(x + 2, y + hh - 2.5, w - 4, 2);
      }
    }
    if (F.skarm) for (const [x, y, w, hh] of F.skarm) c.fillRect(x, y, w, hh);
    // backspegeln (i lackens färg på de nyare)
    if (F.spegel) {
      const [sx, sy] = F.spegel;
      c.fillStyle = F.spegelLack ? b.cM : S.ton('#1a1b1e');
      c.beginPath();
      c.moveTo(sx - 3, sy);
      c.lineTo(sx + 1, sy - 9);
      c.quadraticCurveTo(sx + 2, sy - 15, sx + 9, sy - 15);
      c.lineTo(sx + 17, sy - 15);
      c.quadraticCurveTo(sx + 21, sy - 14, sx + 20, sy - 9);
      c.lineTo(sx + 17, sy - 3);
      c.quadraticCurveTo(sx + 15, sy, sx + 10, sy);
      c.closePath();
      c.fill();
    }
    // takräcket, taxiskylten och snön på taket
    const [t0, t1, ty] = F.tak;
    if (b.rails) {
      // takräcket på sina fötter
      c.fillStyle = S.ton('#1a1b1e');
      c.fillRect(t0 + 6, ty - 6, t1 - t0 - 26, 3.5);
      for (const x of [t0 + 8, (t0 + t1) / 2 - 10, t1 - 30]) c.fillRect(x, ty - 6, 10, 6);
    }
    if (b.taxi) {
      const mx = (t0 + t1) / 2;
      c.fillStyle = S.lamps ? '#ffe68a' : S.ton('#e8c43a');
      c.fillRect(mx - 24, ty - 16, 48, 15);
      text(c, 'TAXI', mx, ty - 8.5, 13, dir, '#1a1a1a');
      if (S.lamps) { c.save(); c.globalCompositeOperation = 'lighter'; sken(c, mx, ty - 9, 60, '255,226,140', 0.35); c.restore(); }
    }
    if (S.snoTak) {
      c.fillStyle = S.G.snoC(S.L);
      c.beginPath();
      c.ellipse((t0 + t1) / 2, ty + 1, (t1 - t0) / 2 - 4, 7, 0, Math.PI, 0);
      c.fill();
    } else if (S.L.lampor) {
      // gatlyktornas sken på taket
      c.fillStyle = 'rgba(255,214,160,0.3)';
      c.fillRect(t0 + 4, ty, t1 - t0 - 8, 3);
    }
    for (const x of F.hj) ritaHjul(c, x, F.r, b.nav || F.nav, b.falg, -26, S, vrid, b.marke, dir);
    // (kjolen över bakhjulet)
    if (F.efter) skarmar(c, b, F.efter, S, F);
    // lyktorna: strålkastaren, blinkersen och baklyktan (bromsljuset lyser starkare)
    const [fx, fy, fw, fh] = F.fram;
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(fx, fy, fw, fh);
    const [kx, ky, kw, kh] = F.blink;
    c.fillStyle = S.ton('#d88a2a');
    c.fillRect(kx, ky, kw, kh);
    const [bx, by, bw, bh] = F.bak;
    c.fillStyle = broms ? '#ff3a26' : S.lamps ? '#cc2c1e' : S.ton('#a8201a');
    c.fillRect(bx, by, bw, bh);
    stank(c, b, S, fart, t, -30);
    lyktor(c, b, S, F.fram, F.bak, broms);
  }

  // Bussen: en eller två delar (ledbussen med bälgen emellan), rutor och dörrar, skylten med linjen och, på kvällen,
  // upplyst inne med folk i.
  function ritaBuss(c, b, dir, S, fart, broms, t) {
    const F = b.F;
    const mix = S.G.mix;
    const kjol = mix(b.c, '#000000', 0.42);
    const tak = S.ton('#c9ccd0');
    const ruta = S.lamps ? '#e6d6a6' : S.glas;
    under(c, b, S, [[F.L / 2 - 4, '255,240,210', 0.32], [-F.L / 2 + 2, '255,60,40', 0.28]]);
    niga(c, F);
    // (på dagen syns det bakom genom rutorna och dörrarnas glas; på kvällen är den upplyst inne)
    const genom = !S.lamps;
    for (const [x0, x1, fram, bak] of F.delar) {
      const p = new Path2D();
      if (genom) {
        for (const [a, e] of F.rutor) if (a >= x0 && e <= x1) p.rect(a, -270, e - a, 100);
        for (const [d0, d1] of F.dorrar) if (d0 >= x0 && d1 <= x1) { p.rect(d0, -272, (d1 - d0) / 2 - 3, 230); p.rect((d0 + d1) / 2 + 3, -272, (d1 - d0) / 2 - 3, 230); }
      }
      p.moveTo(x0, -30);
      if (bak) { p.lineTo(x0 - 2, -44); p.lineTo(x0 - 2, -290); p.quadraticCurveTo(x0 - 2, -302, x0 + 10, -302); } else p.lineTo(x0, -302);
      if (fram) { p.lineTo(x1 - 12, -302); p.quadraticCurveTo(x1, -302, x1, -288); p.lineTo(x1 + 2, -44); p.lineTo(x1 - 2, -30); } else { p.lineTo(x1, -302); p.lineTo(x1, -30); }
      p.closePath();
      c.fillStyle = b.c;
      c.fill(p, 'evenodd');
      c.save();
      c.clip(p, 'evenodd');
      c.fillStyle = tak;
      c.fillRect(x0 - 4, -306, x1 - x0 + 8, 18);
      c.fillStyle = kjol;
      c.fillRect(x0 - 4, -80, x1 - x0 + 8, 52);
      c.fillStyle = S.ton('#121418');
      c.fillRect(x0 + 6, -276, x1 - x0 - 12, 112);
      c.restore();
      // aggregatet på taket
      c.fillStyle = tak;
      c.fillRect(x0 + (x1 - x0) * 0.3, -316, (x1 - x0) * 0.3, 14);
    }
    if (F.led) {
      const [a, e] = F.led;
      c.fillStyle = S.ton('#1c1d20');
      c.fillRect(a, -296, e - a, 262);
      c.strokeStyle = S.ton('#3a3c40');
      c.lineWidth = 3;
      c.beginPath();
      for (let x = a + 8; x < e; x += 9) { c.moveTo(x, -294); c.lineTo(x, -36); }
      c.stroke();
    }
    // rutorna med folk i (inne), och dörrarna
    c.fillStyle = ruta;
    if (genom) c.globalAlpha = 0.45;
    for (const [a, e] of F.rutor) c.fillRect(a, -270, e - a, 100);
    c.globalAlpha = 1;
    c.save();
    const RB = new Path2D();
    for (const [a, e] of F.rutor) RB.rect(a, -270, e - a, 100);
    c.clip(RB);
    // (de som står längre in, sätena, de som sitter och chauffören, och glasets dis över dem)
    const I = inne(S, b);
    const fin = finare(c);
    for (const p of I.star) manniska(c, p, fin, t);
    const [sate, sateM, handtag] = I.satenP;
    c.fillStyle = I.sateF;
    c.fill(sate);
    c.fillStyle = I.sateM;
    c.fill(sateM);
    c.strokeStyle = I.handtag;
    c.lineWidth = 2;
    c.stroke(handtag);
    for (const p of I.folk) manniska(c, p, fin, t);
    c.globalAlpha = I.dis;
    c.fillStyle = ruta;
    c.fill(RB);
    c.globalAlpha = 1;
    if (!S.lamps) {
      c.globalAlpha = 0.16 + 0.2 * S.L.dag;
      c.fillStyle = S.himmel;
      for (let a = -F.L / 2 + 80; a < F.L / 2; a += 420) {
        c.beginPath(); c.moveTo(a, -270); c.lineTo(a + 90, -270); c.lineTo(a + 20, -170); c.lineTo(a - 70, -170); c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
    }
    c.restore();
    for (const [d0, d1] of F.dorrar) {
      c.fillStyle = S.ton('#121418');
      if (genom) {
        const q = new Path2D();
        q.rect(d0 - 5, -280, d1 - d0 + 10, 246);
        q.rect(d0, -272, (d1 - d0) / 2 - 3, 230);
        q.rect((d0 + d1) / 2 + 3, -272, (d1 - d0) / 2 - 3, 230);
        c.fill(q, 'evenodd');
        c.globalAlpha = 0.45;
      } else c.fillRect(d0 - 5, -280, d1 - d0 + 10, 246);
      c.fillStyle = ruta;
      c.fillRect(d0, -272, (d1 - d0) / 2 - 3, 230);
      c.fillRect((d0 + d1) / 2 + 3, -272, (d1 - d0) / 2 - 3, 230);
      c.globalAlpha = 1;
      // (de gula stängerna innanför)
      c.fillStyle = I.stang;
      c.fillRect(d0 + 9, -272, 3.5, 230);
      c.fillRect(d1 - 12.5, -272, 3.5, 230);
    }
    // skylten: linjen och slutstationen i orange
    const [s0, s1] = F.skylt;
    c.fillStyle = '#0c0a06';
    c.fillRect(s0, -298, s1 - s0, 22);
    text(c, b.mal ? `${b.nr}  ${b.mal}` : b.nr, (s0 + s1) / 2, -286, 20, dir, '#ffaa2a');
    if (S.snoTak) {
      c.fillStyle = S.G.snoC(S.L);
      c.fillRect(-F.L / 2 + 20, -322, F.L - 40, 8);
    }
    for (const x of F.hj) ritaHjul(c, x, F.r, 'buss', '#b8bcc2', -30, S);
    // lyktorna
    const h = F.L / 2;
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(h - 6, -96, 8, 20);
    c.fillStyle = broms ? '#ff3a26' : S.lamps ? '#cc2c1e' : S.ton('#a8201a');
    c.fillRect(-h - 2, -130, 8, 60);
    stank(c, b, S, fart, t, -36);
    lyktor(c, b, S, [h - 6, -96, 8, 20], [-h - 2, -130, 8, 60], broms);
    if (S.lamps) {
      // inneljuset lyser ut lite kring rutorna
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.12;
      c.fillStyle = '#ffe2a8';
      c.fillRect(-h + 10, -280, F.L - 20, 120);
      c.restore();
    }
  }

  // Plogbilen: orange, med flaket, plogbladet snett framför och det gula blinkljuset på hytten.
  function ritaPlog(c, b, dir, S, fart, broms, t) {
    const F = b.F;
    under(c, b, S, [[440, '255,240,210', 0.3], [-430, '255,60,40', 0.25]]);
    niga(c, F);
    const or = b.c;
    const orM = S.G.mix(or, '#000000', 0.25);
    c.fillStyle = S.ton('#18191c');
    c.fillRect(-430, -96, 740, 26);
    // flaket med sandspridaren
    c.fillStyle = orM;
    c.fillRect(-440, -250, 470, 160);
    c.fillStyle = S.G.mix(orM, '#000000', 0.25);
    for (let x = -420; x < 30; x += 70) c.fillRect(x, -246, 6, 152);
    c.fillStyle = S.ton('#2a2c30');
    c.fillRect(-450, -110, 40, 40);
    // hytten
    const h = new Path2D('M70 -84 V-262 Q70 -276 84 -276 H252 Q268 -276 272 -260 L292 -150 L300 -84 Z');
    c.fillStyle = or;
    c.fill(h);
    c.fillStyle = S.ton('#141518');
    c.fill(vag('M168 -156 V-254 H246 Q256 -254 258 -244 L274 -156 Z'));
    const RP = vag('M174 -162 V-248 H244 Q251 -248 252 -241 L267 -162 Z');
    c.fillStyle = S.lamps ? '#1a1814' : S.glas;
    c.fill(RP);
    c.save();
    c.clip(RP);
    const I = inne(S, b);
    for (const p of I.folk) manniska(c, p, finare(c), t);
    c.globalAlpha = I.dis;
    c.fillStyle = S.lamps ? '#1a1814' : S.glas;
    c.fill(RP);
    c.globalAlpha = 1;
    lysen(c, I, S);
    c.restore();
    c.strokeStyle = S.G.mix(or, '#000000', 0.35);
    c.lineWidth = 2;
    c.stroke(vag('M160 -262 V-90'));
    // plogbladet: fästet på fronten och det böjda bladet framför, lågt, med stålkanten mot gatan och två
    // markeringspinnar
    c.fillStyle = S.ton('#2a2c30');
    c.fillRect(296, -72, 70, 14);
    c.fillStyle = or;
    c.fill(vag('M360 -6 Q352 -60 372 -112 L404 -116 Q384 -62 396 -6 Z'));
    c.fillStyle = S.ton('#9a9a96');
    c.fillRect(358, -10, 40, 7);
    c.strokeStyle = S.ton('#1a1a1a');
    c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(388, -114); c.lineTo(384, -190); c.stroke();
    c.fillStyle = S.ton('#e8541a');
    c.fillRect(379, -196, 10, 22);
    for (const x of F.hj) ritaHjul(c, x, F.r, 'stal', '#b8bcc2', -40, S);
    // blinkljuset: två gånger i sekunden
    const p = (t * 2) % 1;
    c.fillStyle = p < 0.5 ? '#ffc21a' : S.ton('#8a6a10');
    c.fillRect(196, -292, 26, 16);
    if (p < 0.5) { c.save(); c.globalCompositeOperation = 'lighter'; sken(c, 209, -284, S.lamps ? 160 : 70, '255,190,40', S.lamps ? 0.55 : 0.4); c.restore(); }
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(288, -110, 10, 18);
    c.fillStyle = S.lamps ? '#ff3a26' : S.ton('#a8201a');
    c.fillRect(-452, -150, 8, 30);
    stank(c, b, S, fart, t, -40);
    lyktor(c, b, S, [288, -110, 10, 18], [-452, -150, 8, 30], broms);
  }

  // Lastbilen: skåpet med reglar och ibland en rand, den frambyggda hytten med föraren, dörren och steget,
  // dieseltanken mellan hjulen, backspegeln och stötfångaren.
  function ritaLastbil(c, b, dir, S, fart, broms, t) {
    const F = b.F;
    const mix = S.G.mix;
    const svart = tonad(S, '#18191c');
    under(c, b, S, [[386, '255,240,210', 0.3], [-386, '255,60,40', 0.25]]);
    niga(c, F);
    c.fillStyle = svart;
    c.fillRect(-372, -100, 742, 26);
    c.fillStyle = b.skap;
    c.fillRect(-386, -352, 556, 250);
    c.fillStyle = mix(b.skap, '#000000', 0.12);
    for (let x = -330; x < 170; x += 62) c.fillRect(x, -346, 3, 238);
    c.fillRect(-386, -352, 556, 7);
    if (b.rand) {
      c.fillStyle = b.rand;
      c.fillRect(-386, -176, 556, 20);
    }
    c.fillStyle = mix(b.skap, '#000000', 0.32);
    c.fillRect(-386, -110, 556, 8);
    // hytten, rutan med föraren, dörrens fog och handtag och steget
    const RS = 'M206 -286 H354 Q359 -286 360 -281 L369 -202 H206 Z';
    const ev = ' ' + RS;
    c.fillStyle = b.c;
    c.fill(vag('M180 -92 V-298 Q180 -312 194 -312 H356 Q370 -312 374 -298 L388 -160 L390 -92 Z' + ev), 'evenodd');
    c.fillStyle = tonad(S, '#141518');
    c.fill(vag('M200 -292 H356 Q364 -292 366 -284 L376 -196 H200 Z' + ev), 'evenodd');
    const R = vag(RS);
    c.fillStyle = S.lamps ? '#1a1814' : S.glas;
    c.globalAlpha = S.lamps ? 0.32 : 0.36;
    c.fill(R);
    c.globalAlpha = 1;
    c.save();
    c.clip(R);
    const I = inne(S, b);
    for (const p of I.folk) manniska(c, p, finare(c), t);
    c.globalAlpha = I.dis;
    c.fillStyle = S.lamps ? '#1a1814' : S.glas;
    c.fill(R);
    c.globalAlpha = 1;
    lysen(c, I, S);
    if (!S.lamps) {
      c.globalAlpha = 0.18 + 0.22 * S.L.dag;
      c.fillStyle = S.himmel;
      c.beginPath(); c.moveTo(230, -286); c.lineTo(300, -286); c.lineTo(250, -202); c.lineTo(180, -202); c.closePath(); c.fill();
    }
    c.restore();
    c.lineCap = 'round';
    c.strokeStyle = b.cM;
    c.lineWidth = 2;
    c.stroke(vag('M196 -296 V-104'));
    c.strokeStyle = svart;
    c.lineWidth = 4;
    c.stroke(vag('M214 -184 h22'));
    c.fillStyle = svart;
    c.fillRect(214, -114, 64, 8);
    c.fillStyle = tonad(S, '#2a2c30');
    c.fillRect(366, -106, 30, 32);
    c.strokeStyle = svart;
    c.lineWidth = 3;
    c.stroke(vag('M372 -262 L396 -262'));
    c.fillRect(392, -284, 9, 58);
    c.fillStyle = tonad(S, '#9a9ea4');
    c.fillRect(20, -106, 130, 38);
    for (const x of F.hj) ritaHjul(c, x, F.r, 'buss', '#b8bcc2', -40, S);
    if (S.snoTak) {
      c.fillStyle = S.G.snoC(S.L);
      c.fillRect(-380, -360, 544, 8);
      c.fillRect(196, -318, 160, 7);
    }
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(384, -124, 8, 18);
    c.fillStyle = tonad(S, '#d88a2a');
    c.fillRect(377, -146, 8, 12);
    c.fillStyle = broms ? '#ff3a26' : S.lamps ? '#cc2c1e' : tonad(S, '#a8201a');
    c.fillRect(-390, -136, 8, 30);
    stank(c, b, S, fart, t, -40);
    lyktor(c, b, S, [384, -124, 8, 18], [-390, -136, 8, 30], broms);
  }

  // ---------- på två hjul ----------

  // en båge (utan linjen dit från förra biten av vägen)
  function bage(c, x, y, r, a0, a1) {
    c.moveTo(x + r * Math.cos(a0), y + r * Math.sin(a0));
    c.arc(x, y, r, a0, a1);
  }
  // Leden (knät, armbågen) mellan p och q, l1 från p och l2 till q, böjd framåt (s 1) eller nedåt (s -1); når
  // benen inte fram blir de raka.
  function led(p, q, l1, l2, s) {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.5, Math.hypot(dx, dy)));
    const a = Math.atan2(dy, dx) - s * Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
    return [p[0] + l1 * Math.cos(a), p[1] + l1 * Math.sin(a)];
  }
  // Benet från höften H till vristen P, med knät framåt och skon på foten.
  function benet(c, H, P, farg, sko) {
    const K = led(H, P, 44, 46, 1);
    c.strokeStyle = farg;
    c.lineWidth = 13;
    c.beginPath();
    c.moveTo(H[0], H[1]);
    c.lineTo(K[0], K[1]);
    c.lineTo(P[0], P[1]);
    c.stroke();
    c.fillStyle = sko;
    c.beginPath();
    c.ellipse(P[0] + 6, P[1] + 4, 12, 5.5, 0, 0, TAU);
    c.fill();
  }
  // Kroppen från höften H till axlarna A: jackan, lite bredare över bröstet och mörkare längs ryggen, och den
  // långa rocken som hänger ned bakom sadeln. (p: a längs ryggen från höften, b framåt)
  function kroppen(c, H, A, r) {
    const l = Math.hypot(A[0] - H[0], A[1] - H[1]);
    const ux = (A[0] - H[0]) / l;
    const uy = (A[1] - H[1]) / l;
    const p = (a, b) => [H[0] + ux * a - uy * b, H[1] + uy * a + ux * b];
    const lin = (q) => c.lineTo(q[0], q[1]);
    const kv = (k, q) => c.quadraticCurveTo(k[0], k[1], q[0], q[1]);
    c.fillStyle = r.jacka;
    if (r.lang) {
      // (rocken hänger rakt ned kring sadeln, över låret)
      const [hx, hy] = H;
      c.beginPath();
      c.moveTo(hx - 12, hy - 10);
      c.lineTo(hx - 19, hy + 20);
      c.quadraticCurveTo(hx, hy + 24, hx + 18, hy + 17);
      c.lineTo(hx + 12, hy - 4);
      c.closePath();
      c.fill();
    }
    c.beginPath();
    const s = p(-6, -13);
    c.moveTo(s[0], s[1]);
    lin(p(-6, 12));
    kv(p(l * 0.55, 17), p(l - 6, 12));
    kv(p(l + 7, 9), p(l + 5, -5));
    kv(p(l * 0.5, -17), s);
    c.closePath();
    c.fill();
    c.fillStyle = r.jackaM;
    c.beginPath();
    const s2 = p(-4, -13);
    c.moveTo(s2[0], s2[1]);
    kv(p(l * 0.5, -17), p(l + 4, -6));
    kv(p(l * 0.5, -9), p(-4, -6));
    c.closePath();
    c.fill();
  }
  // Armen från axeln A till handen på styret Hd, med armbågen nedåt.
  function armen(c, A, Hd, r) {
    const E = led(A, Hd, 30, 32, -1);
    const l = Math.hypot(Hd[0] - E[0], Hd[1] - E[1]) || 1;
    const k = Math.max(0, 1 - 5 / l);
    c.strokeStyle = r.jacka;
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(A[0], A[1]);
    c.lineTo(E[0], E[1]);
    c.lineTo(E[0] + (Hd[0] - E[0]) * k, E[1] + (Hd[1] - E[1]) * k);
    c.stroke();
    c.fillStyle = r.hand;
    c.beginPath();
    c.arc(Hd[0], Hd[1], 4.6, 0, TAU);
    c.fill();
  }
  // Huvudet över axlarna (framåt när ryggen lutar), i profil åt höger: nacken, ansiktet med näsan och ögat, håret
  // och mössan, eller hjälmen (cykelhjälmen, den öppna med hakremmen, den hela med visiret).
  function huvudet(c, A, H, r) {
    const l = Math.hypot(A[0] - H[0], A[1] - H[1]);
    const ux = (A[0] - H[0]) / l;
    const uy = (A[1] - H[1]) / l;
    const x = A[0] + ux * 19 + 4;
    const y = A[1] + uy * 19 - 2;
    c.strokeStyle = r.hy;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(A[0] + ux * 3, A[1] + uy * 3);
    c.lineTo(x - 1, y + 7);
    c.stroke();
    if (r.hjalm === 'hel') {
      c.fillStyle = r.hjalmF;
      c.beginPath();
      c.ellipse(x + 1, y + 1, 16, 15, 0, 0, TAU);
      c.fill();
      if (r.rand) {
        c.strokeStyle = r.rand;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x + 1, y + 1, 12, Math.PI * 1.05, Math.PI * 1.75);
        c.stroke();
      }
      c.fillStyle = '#121418';
      c.beginPath();
      c.moveTo(x + 4, y - 6);
      c.quadraticCurveTo(x + 15, y - 7, x + 17, y + 1);
      c.lineTo(x + 16, y + 5);
      c.lineTo(x + 5, y + 5);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.beginPath();
      c.ellipse(x - 4, y - 8, 6, 2.6, -0.5, 0, TAU);
      c.fill();
      return;
    }
    c.fillStyle = r.hy;
    c.beginPath();
    c.arc(x, y, 11, 0, TAU);
    c.moveTo(x + 9.5, y - 2);
    c.lineTo(x + 14.5, y + 3.5);
    c.lineTo(x + 9.5, y + 5.5);
    c.fill();
    c.fillStyle = 'rgba(20,14,10,0.8)';
    c.beginPath();
    c.arc(x + 5.5, y - 1.5, 1.3, 0, TAU);
    c.fill();
    // (håret bak och upptill, så att pannan och ögat syns)
    c.fillStyle = r.har;
    c.beginPath();
    c.arc(x - 0.5, y - 0.5, 12, Math.PI * 0.72, Math.PI * 1.78);
    c.closePath();
    c.fill();
    if (r.langtHar && r.hjalm !== 'oppen') {
      c.beginPath();
      c.ellipse(x - 8, y + 9, 6, 11, 0.2, 0, TAU);
      c.fill();
    }
    if (r.hjalm === 'oppen') {
      c.fillStyle = r.hjalmF;
      c.beginPath();
      c.arc(x - 1, y, 14.5, Math.PI * 0.55, Math.PI * 1.9);
      c.lineTo(x + 7, y - 5);
      c.lineTo(x + 3, y + 6);
      c.closePath();
      c.fill();
      if (r.rand) {
        c.strokeStyle = r.rand;
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(x - 1, y, 11.5, Math.PI * 1.1, Math.PI * 1.7);
        c.stroke();
      }
      c.strokeStyle = '#1a1a1a';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x + 3, y + 6);
      c.lineTo(x + 7, y + 11);
      c.stroke();
    } else if (r.hjalm === 'cykel') {
      c.fillStyle = r.hjalmF;
      c.beginPath();
      c.arc(x - 1, y - 3.5, 13.5, Math.PI, Math.PI * 2);
      c.closePath();
      c.fill();
      // (ventilerna)
      c.strokeStyle = 'rgba(10,10,12,0.6)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x - 8, y - 11); c.lineTo(x - 4, y - 14);
      c.moveTo(x - 1, y - 13); c.lineTo(x + 3, y - 14);
      c.moveTo(x + 6, y - 11); c.lineTo(x + 9, y - 10);
      c.stroke();
    } else if (r.mossa) {
      c.fillStyle = r.mossa;
      c.beginPath();
      c.arc(x, y - 3, 12.8, Math.PI * 1.02, Math.PI * 1.98);
      c.closePath();
      c.fill();
    }
  }

  // Cykelns hjul: däcket, fälgen och ekrarna, som snurrar.
  function ekerhjul(c, x, r, S, vrid) {
    const y = -r;
    c.strokeStyle = '#141416';
    c.lineWidth = 4.4;
    c.beginPath();
    c.arc(x, y, r - 2.2, 0, TAU);
    c.stroke();
    c.strokeStyle = tonad(S, '#a9adb3');
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(x, y, r - 5, 0, TAU);
    c.stroke();
    c.globalAlpha = 0.65;
    c.lineWidth = 0.8;
    c.beginPath();
    const a0 = vrid / r;
    for (let i = 0; i < 16; i++) {
      const a = a0 + (i * TAU) / 16;
      c.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3);
      c.lineTo(x + Math.cos(a + 0.18) * (r - 5), y + Math.sin(a + 0.18) * (r - 5));
    }
    c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = tonad(S, '#8a8e94');
    c.beginPath();
    c.arc(x, y, 3.2, 0, TAU);
    c.fill();
  }
  // Mopedens och motorcykelns hjul: det tjocka däcket, och fälgen med n ekrar som snurrar (ekrade på mopeden,
  // gjutna på skotern och motorcyklarna) och bromsskivan fram.
  function hojhjul(c, x, r, S, vrid, n, skiva) {
    const y = -r;
    const d = r * 0.22;
    const fa = tonad(S, '#a9adb3');
    const a0 = vrid / r;
    if (n > 6) {
      c.strokeStyle = '#121214';
      c.lineWidth = d;
      c.beginPath();
      c.arc(x, y, r - d / 2, 0, TAU);
      c.stroke();
    } else {
      c.fillStyle = '#121214';
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
      c.fillStyle = tonad(S, '#3a3c40');
      c.beginPath();
      c.arc(x, y, r - d, 0, TAU);
      c.fill();
    }
    if (skiva) {
      c.strokeStyle = tonad(S, '#8a8e94');
      c.lineWidth = r * 0.1;
      c.beginPath();
      c.arc(x, y, r * 0.42, 0, TAU);
      c.stroke();
    }
    c.strokeStyle = fa;
    c.lineWidth = n > 6 ? 0.8 : r * 0.13;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const a = a0 + (i * TAU) / n;
      c.moveTo(x + Math.cos(a) * r * 0.16, y + Math.sin(a) * r * 0.16);
      c.lineTo(x + Math.cos(a) * (r - d), y + Math.sin(a) * (r - d));
    }
    c.stroke();
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(x, y, r - d, 0, TAU);
    c.stroke();
    c.fillStyle = tonad(S, '#8a8e94');
    c.beginPath();
    c.arc(x, y, r * 0.16, 0, TAU);
    c.fill();
  }

  // Cykeln och den som cyklar: hjulen och stänkskärmarna, det bortre benet bakom ramen, pakethållaren (ibland med
  // en väska), ramen med kedjeskyddet, sadeln och styret, korgen, lyktan och reflexen, och sedan kroppen, det
  // närmre benet, armen och huvudet. Vevarna går runt med hjulen (ett varv på två och ett halvt hjulvarv) och
  // står still när cykeln står; lyktan lyser i mörkret på dem som har dynamo.
  function ritaCykel(c, b, dir, S, fart, broms, t, vrid) {
    const F = b.F;
    const r = b.ry;
    const ljus = S.lamps && b.lampa;
    under(c, b, S, ljus ? [[F.lampa[0], '255,240,210', 0.14]] : []);
    niga(c, F);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const krom = tonad(S, '#b4b8bd');
    const svart = tonad(S, '#18191c');
    const a = vrid / F.r / 2.5;
    const [vx, vy] = F.vev;
    const ca = F.pv * Math.cos(a);
    const sa = F.pv * Math.sin(a);
    const p1 = [vx + ca, vy + sa];
    const p2 = [vx - ca, vy - sa];
    const vrist = (p) => [p[0] - 2, p[1] - 8];
    for (const x of F.hj) ekerhjul(c, x, F.r, S, vrid);
    c.strokeStyle = b.kromSkarm ? krom : b.c;
    c.lineWidth = 3.4;
    c.beginPath();
    bage(c, F.hj[0], -F.r, F.r + 4.5, Math.PI * 0.8, Math.PI * 1.88);
    bage(c, F.hj[1], -F.r, F.r + 4.5, Math.PI * 1.02, Math.PI * 1.95);
    c.stroke();
    c.strokeStyle = tonad(S, '#6a6e74');
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(vx, vy);
    c.lineTo(p2[0], p2[1]);
    c.stroke();
    c.fillStyle = svart;
    c.fillRect(p2[0] - 5, p2[1] - 1.5, 10, 3);
    benet(c, F.sadel, vrist(p2), r.byxorM, r.skoM);
    c.strokeStyle = krom;
    c.lineWidth = 1.8;
    c.stroke(vag('M-22 -82 L-80 -82 M-78 -82 L-54 -34 M-62 -82 L-55 -36'));
    if (b.vaska) {
      c.fillStyle = b.vaska;
      c.beginPath();
      if (c.roundRect) c.roundRect(-80, -103, 42, 21, 4); else c.rect(-80, -103, 42, 21);
      c.fill();
    }
    c.strokeStyle = b.c;
    c.lineWidth = 3.8;
    c.stroke(vag(F.ram));
    c.fillStyle = b.cM;
    c.fill(vag('M-52 -41 L-6 -43 Q6 -43 7 -33 Q6 -25 -4 -24 L-50 -29 Q-55 -35 -52 -41 Z'));
    c.strokeStyle = krom;
    c.lineWidth = 2.4;
    c.stroke(vag(F.stolpe));
    c.stroke(vag(F.styret));
    c.fillStyle = svart;
    c.fill(vag(F.sits));
    if (b.korg) {
      c.fillStyle = b.korg;
      c.fill(vag('M30 -116 H58 L55 -92 H33 Z'));
      c.strokeStyle = S.G.mix(b.korg, '#000000', 0.35);
      c.lineWidth = 1;
      c.stroke(vag('M31 -108 H57 M32 -100 H56 M40 -116 L40 -92 M48 -116 L47.5 -92'));
    }
    const [lx, ly] = F.lampa;
    c.fillStyle = ljus ? '#fffbea' : tonad(S, '#d8d6cc');
    c.fillRect(lx, ly, 7, 6);
    const [rx, ry] = F.reflex;
    c.fillStyle = tonad(S, '#b8201a');
    c.fillRect(rx, ry, 4, 7);
    kroppen(c, F.sadel, F.axel, r);
    c.strokeStyle = tonad(S, '#8a8e94');
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(vx, vy);
    c.lineTo(p1[0], p1[1]);
    c.stroke();
    c.fillStyle = svart;
    c.fillRect(p1[0] - 5, p1[1] - 1.5, 10, 3);
    c.fillStyle = krom;
    c.beginPath();
    c.arc(vx, vy, 3, 0, TAU);
    c.fill();
    benet(c, F.sadel, vrist(p1), r.byxor, r.sko);
    armen(c, F.axel, F.styre, r);
    huvudet(c, F.axel, F.sadel, r);
    if (ljus) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      sken(c, lx + 6, ly + 3, 40, '255,244,214', 0.5);
      sken(c, rx + 2, ry + 3, 16, '255,48,32', 0.25);
      c.restore();
    }
    stank(c, b, S, fart, t, -20);
  }

  // Skotern: golvet, kåpan bak över motorn och bakhjulet, benskölden, framskärmen, styret och sadeln.
  function skotern(c, b, S, F, krom, svart, gra) {
    c.fillStyle = gra;
    c.fill(vag('M-8 -42 L40 -42 L44 -30 L-8 -30 Z'));
    c.fillStyle = b.c;
    c.fill(vag('M-102 -48 Q-104 -72 -84 -80 L-16 -82 Q-6 -82 -6 -70 L-6 -36 L-56 -34 Q-90 -34 -102 -48 Z'));
    c.fill(vag('M36 -30 Q48 -36 48 -60 L50 -104 L61 -106 Q67 -62 61 -36 Q59 -28 50 -26 Z'));
    c.fill(vag('M46 -104 L45 -116 Q45 -122 52 -122 L62 -120 L62 -106 Z'));
    c.fillStyle = b.cL;
    c.fill(vag('M-98 -62 Q-92 -76 -82 -78 L-16 -80 L-16 -74 L-90 -70 Z'));
    c.strokeStyle = b.c;
    c.lineWidth = 5;
    c.beginPath();
    bage(c, F.hj[1], -F.r, F.r + 5, Math.PI * 1.05, Math.PI * 1.75);
    c.stroke();
    c.strokeStyle = svart;
    c.lineWidth = 4.4;
    c.stroke(vag('M48 -118 L28 -118'));
    c.fillStyle = svart;
    c.fill(vag('M-86 -80 Q-84 -90 -64 -90 L-24 -88 Q-14 -88 -14 -82 L-14 -80 Z'));
    c.strokeStyle = krom;
    c.lineWidth = 4;
    c.stroke(vag('M-44 -30 L-92 -26'));
  }
  // Mopeden (Puch Maxi): gaffeln, ramen, tanken under sadeln, motorn med flänsarna och avgasröret, stänkskärmarna,
  // stötdämparen, pakethållaren, sadeln, styret och pedalen.
  function maxin(c, b, S, F, krom, svart, gra) {
    c.strokeStyle = krom;
    c.lineWidth = 3;
    c.stroke(vag('M40 -100 L47 -64 L56 -29'));
    c.strokeStyle = b.c;
    c.lineWidth = 7;
    c.stroke(vag('M40 -100 Q22 -68 0 -50 L-14 -44'));
    c.lineWidth = 3.4;
    c.beginPath();
    bage(c, F.hj[0], -F.r, F.r + 4, Math.PI * 0.95, Math.PI * 1.8);
    bage(c, F.hj[1], -F.r, F.r + 4, Math.PI * 1.1, Math.PI * 1.85);
    c.stroke();
    c.strokeStyle = svart;
    c.lineWidth = 4;
    c.stroke(vag('M-14 -40 L-54 -29'));
    c.strokeStyle = krom;
    c.lineWidth = 3;
    c.stroke(vag('M-58 -66 L-52 -34'));
    c.fillStyle = b.c;
    c.fill(vag('M-66 -86 L-18 -86 Q-10 -86 -8 -78 L-4 -58 Q-6 -52 -14 -52 L-58 -60 Q-66 -62 -66 -70 Z'));
    c.fillStyle = gra;
    c.fill(vag('M-24 -56 H2 Q8 -56 8 -48 V-30 Q8 -24 2 -24 H-20 Q-26 -24 -26 -30 Z'));
    c.strokeStyle = svart;
    c.lineWidth = 1.2;
    c.stroke(vag('M-22 -48 H4 M-22 -42 H4 M-22 -36 H4'));
    c.strokeStyle = krom;
    c.lineWidth = 4;
    c.stroke(vag('M4 -28 Q-6 -20 -40 -24 L-78 -28'));
    c.fillStyle = krom;
    c.beginPath();
    c.ellipse(-80, -29, 14, 4.5, 0.05, 0, TAU);
    c.fill();
    c.lineWidth = 2;
    c.stroke(vag('M-66 -90 L-92 -90 M-90 -90 L-78 -66'));
    c.fillStyle = svart;
    c.fill(vag('M-68 -88 Q-66 -97 -48 -97 H-22 Q-14 -97 -14 -91 L-14 -87 H-68 Z'));
    c.strokeStyle = krom;
    c.lineWidth = 2.6;
    c.stroke(vag('M40 -100 L39 -112 Q36 -118 27 -118'));
    c.beginPath();
    c.arc(48, -104, 7, 0, TAU);
    c.stroke();
    c.lineWidth = 2.4;
    c.stroke(vag('M-6 -36 L0 -40'));
  }
  // Den nakna motorcykeln: svingarmen och stötdämparen, motorn med kylflänsarna, avgasröret och ljuddämparen,
  // tanken med randen, sadeln och bakskärmen, gaffeln, framskärmen, den runda lyktan och styret med backspegeln.
  function nakenHoj(c, b, S, F, krom, svart, gra) {
    c.strokeStyle = svart;
    c.lineWidth = 6;
    c.stroke(vag('M-12 -50 L-72 -32'));
    c.strokeStyle = krom;
    c.lineWidth = 4.5;
    c.stroke(vag('M-38 -98 L-56 -50'));
    c.fillStyle = gra;
    c.fill(vag('M-24 -84 L28 -88 L36 -62 L30 -36 H-18 Q-26 -36 -26 -46 Z'));
    c.strokeStyle = svart;
    c.lineWidth = 1.4;
    c.stroke(vag('M-18 -78 L28 -81 M-18 -72 L30 -74 M-18 -66 L32 -67 M-18 -60 L33 -60'));
    c.strokeStyle = krom;
    c.lineWidth = 5;
    c.stroke(vag('M32 -60 Q40 -34 18 -30 L-40 -36'));
    c.fillStyle = krom;
    c.fill(vag('M-38 -42 L-98 -54 Q-104 -50 -100 -45 L-38 -34 Z'));
    c.fillStyle = gra;
    c.fill(vag('M-98 -54 Q-104 -50 -100 -45 L-96 -46 Q-99 -50 -95 -53 Z'));
    c.fillStyle = b.c;
    c.fill(vag('M-14 -106 Q-2 -122 26 -118 Q44 -114 46 -100 L36 -88 L-12 -88 Z'));
    c.fillStyle = b.lack2;
    c.fill(vag('M-6 -104 Q6 -114 30 -110 L28 -104 Q8 -106 -4 -98 Z'));
    c.fillStyle = b.c;
    c.fill(vag('M-78 -96 L-104 -98 Q-108 -92 -104 -86 L-78 -88 Z'));
    c.fillStyle = svart;
    c.fill(vag('M-14 -106 L-76 -106 Q-88 -104 -90 -96 L-76 -92 L-14 -92 Z'));
    c.strokeStyle = krom;
    c.lineWidth = 5;
    c.stroke(vag('M54 -120 L76 -32'));
    c.strokeStyle = b.c;
    c.beginPath();
    bage(c, F.hj[1], -F.r, F.r + 5, Math.PI * 1.1, Math.PI * 1.7);
    c.stroke();
    c.fillStyle = krom;
    c.beginPath();
    c.arc(68, -110, 10, 0, TAU);
    c.fill();
    c.strokeStyle = svart;
    c.lineWidth = 3.6;
    c.stroke(vag('M54 -122 L36 -126'));
    c.strokeStyle = gra;
    c.lineWidth = 2.4;
    c.stroke(vag('M50 -124 L46 -144'));
    c.fillStyle = svart;
    c.beginPath();
    c.ellipse(45, -148, 3, 5, 0, 0, TAU);
    c.fill();
  }
  // Sporthojen: svingarmen, motorn under kåpan, ljuddämparen upp mot stjärten, gaffeln och framskärmen, kåpan i
  // lacken med randen i den andra färgen och vindrutan, tanken, stjärten och sadeln, och styret lågt.
  function sportHoj(c, b, S, F, krom, svart, gra) {
    c.strokeStyle = svart;
    c.lineWidth = 6;
    c.stroke(vag('M-14 -50 L-72 -31'));
    c.fillStyle = gra;
    c.fill(vag('M-20 -86 L30 -90 L34 -40 H-16 Z'));
    c.fillStyle = krom;
    c.fill(vag('M-34 -44 L-92 -64 Q-98 -60 -95 -55 L-36 -36 Z'));
    c.strokeStyle = krom;
    c.lineWidth = 5;
    c.stroke(vag('M62 -118 L74 -31'));
    c.strokeStyle = b.c;
    c.beginPath();
    bage(c, F.hj[1], -F.r, F.r + 4, Math.PI * 1.1, Math.PI * 1.75);
    c.stroke();
    // (kåpan: nosen över framhjulet och sidan ned bakom det, över motorn)
    const kapa = vag('M60 -132 Q76 -122 88 -102 L90 -94 L72 -88 L56 -86 L44 -46 Q38 -37 26 -37 L-8 -38 Q-18 -40 -18 -50 L-16 -84 L-8 -96 L28 -104 Z');
    c.fillStyle = b.c;
    c.fill(kapa);
    c.save();
    c.clip(kapa);
    c.fillStyle = b.lack2;
    c.beginPath();
    c.moveTo(96, -96);
    c.lineTo(-20, -78);
    c.lineTo(-20, -66);
    c.lineTo(96, -82);
    c.closePath();
    c.fill();
    c.restore();
    c.fillStyle = svart;
    c.fill(vag('M10 -62 L34 -66 L32 -56 L10 -54 Z'));
    c.fillStyle = S.glas;
    c.globalAlpha = 0.85;
    c.fill(vag('M60 -132 L48 -148 Q55 -151 62 -145 L76 -124 Z'));
    c.globalAlpha = 1;
    // tanken, stjärten (som slutar ovanför bakhjulet, med randen) och sadeln
    c.fillStyle = b.c;
    c.fill(vag('M-10 -104 Q2 -124 32 -120 L44 -106 L36 -98 L-10 -96 Z'));
    c.fill(vag('M-10 -100 L-58 -106 L-92 -118 Q-99 -116 -98 -108 L-86 -96 L-64 -86 L-16 -84 Z'));
    c.fillStyle = b.lack2;
    c.fill(vag('M-58 -100 L-92 -112 L-92 -106 L-62 -94 Z'));
    c.fillStyle = svart;
    c.fill(vag('M-8 -104 L-56 -110 L-60 -103 L-10 -99 Z'));
    c.strokeStyle = svart;
    c.lineWidth = 3.6;
    c.stroke(vag('M50 -110 L38 -112'));
  }

  // Skotern, mopeden och motorcyklarna med den som åker (och ibland någon där bak på motorcykeln): det bortre
  // benet bakom, hjulen, hojen, kroppen, det närmre benet på fotpinnen eller golvet, armen och huvudet med hjälmen,
  // och lyktorna, som alltid är tända.
  function ritaHoj(c, b, dir, S, fart, broms, t, vrid) {
    const F = b.F;
    const r = b.ry;
    under(c, b, S, [[F.fram[0], '255,240,210', 0.26], [F.bak[0], '255,60,40', 0.22]]);
    niga(c, F);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const krom = tonad(S, '#b9bdc2');
    const svart = tonad(S, '#18191c');
    const gra = tonad(S, '#5a5e64');
    const [fx, fy] = F.fot;
    benet(c, F.sadel, [fx + 4, fy - 2], r.byxorM, r.skoM);
    const n = b.typ === 'maxi' ? 24 : b.typ === 'skoter' ? 5 : 3;
    hojhjul(c, F.hj[0], F.r, S, vrid, n, false);
    hojhjul(c, F.hj[1], F.r, S, vrid, n, b.typ === 'mc');
    if (b.typ === 'skoter') skotern(c, b, S, F, krom, svart, gra);
    else if (b.typ === 'maxi') maxin(c, b, S, F, krom, svart, gra);
    else if (F.sport) sportHoj(c, b, S, F, krom, svart, gra);
    else nakenHoj(c, b, S, F, krom, svart, gra);
    const p = b.bak;
    if (p) {
      kroppen(c, [-64, -114], [-60, -166], p);
      benet(c, [-64, -114], [-44, -62], p.byxor, p.sko);
      huvudet(c, [-60, -166], [-64, -114], p);
    }
    kroppen(c, F.sadel, F.axel, r);
    benet(c, F.sadel, F.fot, r.byxor, r.sko);
    armen(c, F.axel, F.styre, r);
    huvudet(c, F.axel, F.sadel, r);
    if (p) armen(c, [-58, -160], [-28, -126], p);
    const [lx, ly, lw, lh] = F.fram;
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(lx, ly, lw, lh);
    const [bx, by, bw, bh] = F.bak;
    c.fillStyle = broms ? '#ff3a26' : S.lamps ? '#cc2c1e' : tonad(S, '#a8201a');
    c.fillRect(bx, by, bw, bh);
    stank(c, b, S, fart, t, -24);
    lyktor(c, b, S, F.fram, F.bak, broms);
  }

  function rita(c, S, lista, t) {
    for (const { b, f, x, fart, broms, nig } of lista) {
      c.save();
      c.translate(x, f.y);
      c.scale(f.dir * f.k, f.k);
      NIG = nig || 0;
      if (b.typ === 'buss' || b.typ === 'ledbuss') ritaBuss(c, b, f.dir, S, fart, broms, t);
      else if (b.typ === 'plog') ritaPlog(c, b, f.dir, S, fart, broms, t);
      else if (b.typ === 'lastbil') ritaLastbil(c, b, f.dir, S, fart, broms, t);
      else if (b.typ === 'cykel') ritaCykel(c, b, f.dir, S, fart, broms, t, (f.dir * x) / f.k);
      else if (b.F.sadel) ritaHoj(c, b, f.dir, S, fart, broms, t, (f.dir * x) / f.k);
      else ritaBil(c, b, f.dir, S, fart, broms, t, (f.dir * x) / f.k);
      c.restore();
    }
    NIG = 0;
    c.globalAlpha = 1;
  }

  return { mark, trafik, syns, kommer, rita, KANT, FILER, SYNS, FORM, fordon: { nytt: nyttFordon, som: somFordon, valj: valjTyp, BUSS, PLOG } };
})();
