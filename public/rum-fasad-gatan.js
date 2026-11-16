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
// de röda bussarna och den blåa fyran och plogbilen när det har snöat. Fler i rusningen, få på natten och ingen buss mitt i natten (RumUte.trafik), och i
// rusningen ibland en kö mot ljuset till vänster: bilarna bromsar in och står med bromsljusen tända, och kör sedan
// iväg en efter en.
//
// Enkelriktat: allt kommer från höger, från bron, i två filer, och kör två–tre gånger så fort som de som går (så att
// man hinner se vad det är). Allt räknas ur tiden: den delas i luckor om LUCKA sekunder per fil och i varje lucka
// kommer ett fordon (ibland två efter varandra) eller inget, lottat ur luckans nummer, så att bilden är densamma hur
// ofta den än ritas och en stillbild (?rum-t) visar det som kör just då. Ett fordon kommer bara när de i luckorna före
// är ute ur världen, så ingen kör igenom någon annan; köerna har egna, längre luckor (KO), och medan en kö står kör
// ingen annan i den filen.
//
// Fordonen ritas i fasadens främre duk (rf-fram), efter dem som går och före regnet, med vektorer (inga bilder, för
// minnets skull i telefonen) i två eller tre toner som resten av fasaden: kaross, rutor med himlen i, list, stötfångare,
// stänkskydd och hjul med navkapslar; strålkastarna är alltid tända (det är Sverige), och i mörkret lyser de upp gatan
// framför och baklyktorna glöder, bussarna är upplysta inne med folk i, och i regnet stänker det om hjulen och fordonen
// speglas i den våta gatan. Med snö på taken när det har snöat, och avgaser i kylan när de står still.
//
//   RumFasadGatan.mark(V, v, L, G) → gatan som SVG (står still, med marken)
//   RumFasadGatan.trafik(v, L, G) → trafiken S; .syns(S, t, V) det som syns vid tiden t (null: inget);
//   .rita(c, S, lista, t) ritar det i duken (världens enheter; lista: [{ b, f, x, fart, broms }])
//   .FORM fordonens former; .fordon.nytt(S, R, typ, T, f) ett fordon, .fordon.valj(S, R, T, f, I) vilket slag
//   G: måtten och hjälparna ur rum-fasad.js (markY, skala, tone, mix, rng …)

window.RumFasadGatan = (() => {
  const TAU = 2 * Math.PI;

  // ---------- måtten (meter ut från fasaden) ----------
  // Trottoaren är smal (de som går håller sig innanför 0,85 m), och gatan är tecknad snarare än uppmätt: fordonen står
  // nära kanten, så att de syns med hjulen i ett vanligt brett fönster (där syns marken ungefär 1,3 m ut).
  const KANT = 0.88;
  const RANN = 1.0;
  const LINJE = 1.13;
  const MOT = 1.48;
  const FILER = [{ d: 1.02, dir: -1 }, { d: 1.24, dir: -1 }];
  const LUCKA = 12;
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
  // taket ligger hopvikt bak (sufflett). nav 'vit': vita däcksidor.
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
      stot: [[-243, -61, 12, 27], [230, -61, 13, 27]], spegel: [78, -100],
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
      stot: [[-242, -61, 10, 27], [232, -61, 10, 27]], spegel: [88, -99], spegelLack: true,
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
      stot: [[-242, -62, 14, 22], [228, -62, 14, 22]], stotKrom: true, spegel: [86, -100],
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
      stot: [[-226, -61, 9, 26], [216, -61, 9, 26]], spegel: [84, -98], spegelLack: true,
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
      stot: [[-218, -68, 12, 22], [206, -68, 12, 22]], spegel: [62, -112],
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
      stot: [[-243, -61, 12, 27], [230, -61, 13, 27]], spegel: [78, -100],
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
      stot: [[-276, -60, 16, 20], [262, -60, 16, 20]], stotKrom: true, spegel: [62, -96],
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

  // Hur ofta det kommer något per fil (s), ur RumUte.trafik: rusning, dag, kväll och natt.
  function intervall(T, v) {
    const s = T.rusning ? 16 : T.natt ? 170 : T.dag ? 32 : 60;
    return s * (v.snotackt || (v.fall === 'sno' && v.mangd > 0.5) ? 1.3 : 1);
  }

  function trafik(v, L, G) {
    const S = {
      G, L, v,
      filer: FILER.map((f, i) => {
        const sk = G.skala(f.d);
        return { i, d: f.d, dir: f.dir, sk, k: (G.M * sk) / 100, y: G.markY(f.d), um: G.M * sk };
      }),
      fro: v.ar * 7919 + v.manad * 613 + v.dag * 31,
      luckor: new Map(),
      koer: new Map(),
      T: null, tT: -1e9,
      lamps: L.lampor || L.dag < 0.35 || L.dimma > 0.4,
      vat: (L.wet || v.blott) && !v.snotackt,
      regn: v.fall === 'regn' || v.fall === 'blandat',
      snoTak: v.snotackt || (v.fall === 'sno' && v.mangd > 0.4),
      kallt: v.temp < 6,
    };
    // färgerna i gatans ljus: i mörkret siluetter med en aning av lacken, som de som går
    S.ton = (c) => G.mix(G.mix('#06070a', c, 0.13 + 0.87 * L.dag), '#ffb060', 0.07 * (1 - L.dag));
    S.glas = S.lamps ? '#0c0d10' : G.mix(S.ton('#1d252e'), L.sky[2], 0.35 * L.dag);
    S.himmel = L.sky[0];
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
      b.fart = (3.1 + R() * 0.8) * halt;
    } else if (typ === 'plog') {
      b.F = PLOG;
      b.lack = '#e07a1a';
      b.fart = 2.8 + R() * 0.6;
    } else {
      b.taxi = typ === 'taxi';
      const modell = b.taxi ? lotta(R, TAXIBILAR) : typ;
      b.F = FORM[modell === 's900cab' && varmt(S, 18) ? 's900cabO' : modell];
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
      // (i m/s: 12–18 km/h på dagen, lugnare i rusningen och lite fortare på natten)
      b.fart = (T.natt ? 4.6 + R() * 1.4 : T.rusning ? 3.2 + R() * 0.9 : 3.6 + R() * 1.2) * halt;
    }
    b.L = b.F.L;
    b.c = S.ton(b.lack);
    b.cM = S.G.mix(b.c, '#000000', 0.32);
    b.cL = S.G.mix(b.c, '#ffffff', 0.05 + 0.16 * S.L.dag);
    return b;
  }

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

  // Luckan n i filen f: fordonen i den (oftast inget), var och när de kommer in (t0) och när de är ute (slut). Är
  // ett fordon i de två luckorna före inte ute ur världen när det här kommer in, kommer det inte (då kör ingen igenom
  // någon). Allt är ute två luckor efter sin egen.
  function lucka(S, f, n) {
    const fore = [...luckaRa(S, f, n - 2), ...luckaRa(S, f, n - 1)].reduce((m, a) => Math.max(m, a.slut), -1e9);
    return luckaRa(S, f, n).filter((a) => a.t0 > fore + 0.3);
  }
  function luckaRa(S, f, n) {
    const key = f.i * 1e7 + n;
    if (S.luckor.has(key)) return S.luckor.get(key);
    const R = S.G.rng(S.fro + f.i * 104729 + n * 7907);
    const T = nu(S);
    const I = intervall(T, S.vNu || S.v);
    const ut = [];
    if (R() < LUCKA / I) {
      const t0 = n * LUCKA + f.i * 2.1 + R() * 0.8;
      const a = nyttFordon(S, R, valjTyp(S, R, T, f, I), T, f);
      a.t0 = t0;
      a.slut = t0 + (XR - XL + a.L / 100 * f.um) / (a.fart * f.um);
      ut.push(a);
      // ibland en till efter, i samma fart
      if (a.L < 600 && R() < (T.rusning ? 0.4 : 0.2)) {
        const b = nyttFordon(S, R, valjTyp(S, R, T, f, 0), T, f);
        if (b.L < 600) {
          b.fart = a.fart;
          b.t0 = t0 + (a.L / 100 + 4 + R() * 9) / a.fart;
          b.slut = b.t0 + (XR - XL + b.L / 100 * f.um) / (b.fart * f.um);
          if (b.slut < (n + 2) * LUCKA + f.i * 2.1 - 0.2) ut.push(b);
        }
      }
    }
    for (const a of ut) a.f = f;
    S.luckor.set(key, ut);
    if (S.luckor.size > 60) S.luckor.delete(S.luckor.keys().next().value);
    return ut;
  }

  // ---------- kön ----------
  //
  // I den närmre filen: några bilar kommer i följd, bromsar in och ställer sig bakom varandra med den första en bit
  // till vänster om affären; de står med bromsljusen tända tills det slår om, och kör sedan iväg en efter en med en
  // dryg sekund emellan. Rörelsen ur tiden: fram (v0) – broms (a) – står – start (a2 upp till v1).
  const KOF = { v0: 4.2, a: 1.6, a2: 1.2, v1: 5, glapp: 1.2 };
  function ko(S, f, q) {
    const key = f.i * 1e7 + q;
    if (S.koer.has(key)) return S.koer.get(key);
    const R = S.G.rng(S.fro + 977 + q * 3571);
    const T = nu(S);
    const p = T.rusning ? 0.55 : T.dag && !T.helg ? 0.12 : T.dag ? 0.08 : 0;
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
        const typ = j > 0 && T.bussar && R() < 0.12 ? 'buss' : valjTyp(S, R, T, f, 0);
        const b = nyttFordon(S, R, typ === 'plog' ? 'v245' : typ, T, f);
        b.f = f;
        b.s = s;
        b.tStopp = ts;
        bilar.push(b);
        s -= b.L / 100 + KOF.glapp + R() * 0.6;
        ts += 1.8 + R() * 1.6;
      }
      const tGa = ts + 5 + R() * 9;
      bilar.forEach((b, j) => { b.tGa = tGa + j * 1.1 + R() * 0.4; });
      const { v0, a, a2, v1 } = KOF;
      const b0 = bilar[0];
      const tIn = b0.tStopp - v0 / a - (b0.s - (v0 * v0) / (2 * a)) / v0;
      const sist = bilar[n - 1];
      const D = (XR - XL) / f.um + sist.L / 100 - sist.s;
      const tUt = sist.tGa + (D <= (v1 * v1) / (2 * a2) ? Math.sqrt((2 * D) / a2) : v1 / a2 + (D - (v1 * v1) / (2 * a2)) / v1);
      k = { bilar, tIn, tUt };
    }
    S.koer.set(key, k);
    if (S.koer.size > 12) S.koer.delete(S.koer.keys().next().value);
    return k;
  }
  // var fordonets front är (m från världens kant), hur fort det går och om det bromsar
  function iKo(b, t) {
    const { v0, a, a2, v1 } = KOF;
    const tb = b.tStopp - v0 / a;
    if (t < tb) return { p: b.s - (v0 * v0) / (2 * a) - v0 * (tb - t), fart: v0, broms: false };
    if (t < b.tStopp) { const tau = b.tStopp - t; return { p: b.s - (a * tau * tau) / 2, fart: a * tau, broms: true }; }
    if (t < b.tGa) return { p: b.s, fart: 0, broms: true };
    const tau = t - b.tGa;
    if (tau < v1 / a2) return { p: b.s + (a2 * tau * tau) / 2, fart: a2 * tau, broms: tau < 0.3 };
    return { p: b.s + (v1 * v1) / (2 * a2) + v1 * (tau - v1 / a2), fart: v1, broms: false };
  }

  // Det som syns vid tiden t i bilden V: den bortre filen först (den ritas bakom).
  function syns(S, t, V) {
    if (!window.RumUte || !RumUte.trafik) return null;
    const ut = [];
    const marg = S.lamps ? 1400 : 120;
    const fram = (b, f, xf, fart, broms) => {
      const w = (b.L / 100) * f.um;
      const xa = f.dir > 0 ? xf - w : xf;
      if (xa > V.x + V.w + marg || xa + w < V.x - marg) return;
      ut.push({ b, f, x: xa + w / 2, fart, broms });
    };
    for (const f of S.filer) {
      // köerna, och de vanliga fordonen när ingen kö står i vägen
      const q = Math.floor(t / KO);
      const koer = [ko(S, f, q - 1), ko(S, f, q)].filter(Boolean);
      const n = Math.floor((t - f.i * 2.1) / LUCKA);
      for (const m of [n - 2, n - 1, n]) {
        for (const b of lucka(S, f, m)) {
          if (t < b.t0 || t > b.slut) continue;
          const qb = Math.floor(b.t0 / KO);
          const krock = [ko(S, f, qb - 1), ko(S, f, qb), ko(S, f, qb + 1)].some((k) => k && b.slut > k.tIn - 1 && b.t0 < k.tUt + 1);
          if (krock) continue;
          const xf = f.dir > 0 ? XL + (t - b.t0) * b.fart * f.um : XR - (t - b.t0) * b.fart * f.um;
          fram(b, f, xf, b.fart, false);
        }
      }
      for (const k of koer) {
        if (t < k.tIn || t > k.tUt) continue;
        // (de bakre först, så att den framför ritas ovanpå om de nuddar)
        for (let j = k.bilar.length - 1; j >= 0; j--) {
          const b = k.bilar[j];
          const l = iKo(b, t);
          if (l.p < 0 || l.p > (XR - XL) / f.um + b.L / 100) continue;
          fram(b, f, f.dir > 0 ? XL + l.p * f.um : XR - l.p * f.um, l.fart, l.broms);
        }
      }
    }
    return ut.length ? ut : null;
  }

  // ---------- att rita ----------

  function ritaHjul(c, x, r, nav, falg, botten, S, vrid = 0) {
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
      else c.fillRect(-h, -300, b.L, 300);
      c.restore();
      if (S.lamps) {
        for (const [x, rgb, a] of ljus) {
          const g = c.createLinearGradient(0, 4, 0, 280);
          g.addColorStop(0, `rgba(${rgb},${a})`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          c.fillStyle = g;
          c.fillRect(x - 9, 4, 18, 276);
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
    if (S.vat && fart > 2 && (S.regn || v.blott)) {
      // (en mjuk dimma av vatten bakom hjulen, låg och utdragen)
      const a = Math.min(1, fart / 7) * (S.lamps ? 0.1 : 0.2);
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
    if (S.kallt && fart < 1.5) {
      // (mjuka moln ur avgasröret som växer, stiger och bleknar)
      const x0 = -b.L / 2 + 6;
      for (let i = 0; i < 3; i++) {
        const p = (((t * 0.5 + i / 3 + b.L * 0.001) % 1) + 1) % 1;
        sken(c, x0 - 10 - p * 80, botten - 2 - p * 40, 12 + p * 38, '226,230,236', 0.3 * Math.sin(Math.PI * Math.min(1, p * 1.4)) * (S.lamps ? 0.5 : 1));
      }
    }
  }

  // Strålkastaren och baklyktan som de lyser i mörkret: skenet kring dem, ljuset på gatan framför och bromsljuset.
  function lyktor(c, b, S, fram, bak, broms) {
    const [fx, fy, fw, fh] = fram;
    const [bx, by, bw, bh] = bak;
    const fxe = fx + fw;
    const byc = by + bh / 2;
    if (S.lamps) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      // ljuset på gatan framför
      const g = c.createLinearGradient(fxe, 0, fxe + 450, 0);
      g.addColorStop(0, 'rgba(255,236,196,0.22)');
      g.addColorStop(1, 'rgba(255,236,196,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(fxe, fy - 2);
      c.lineTo(fxe + 450, -24);
      c.lineTo(fxe + 450, 4);
      c.lineTo(fxe, fy + fh);
      c.closePath();
      c.fill();
      c.beginPath();
      c.ellipse(fxe + 200, -2, 230, 9, 0, 0, TAU);
      c.fill();
      sken(c, fxe - 2, fy + fh / 2, 70, '255,244,214', 0.6);
      sken(c, bx, byc, broms ? 70 : 46, '255,48,32', broms ? 0.6 : 0.38);
      c.restore();
    } else {
      sken(c, fxe - 2, fy + fh / 2, 22, '255,250,232', 0.35);
      if (broms) sken(c, bx, byc, 34, '255,40,24', 0.45);
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

  // En bil (eller skåpbilen): lacken i tre toner, rutorna med himlen i, listen, stötfångarna, hjulen och lyktorna.
  function ritaBil(c, b, dir, S, fart, broms, t, vrid) {
    const F = b.F;
    const P = vag(F.kaross);
    const h = F.L / 2;
    under(c, b, S, [[F.fram[0], '255,240,210', 0.32], [F.bak[0], '255,60,40', 0.28]]);
    if (F.oppen) {
      // de som åker i den öppna bilen (före karossen, som täcker dem nedanför axlarna)
      const fo = [F.forare];
      if (b.passagerare) fo.push([F.forare[0] - 105, F.forare[1] + 2]);
      fo.forEach(([x, y], i) => {
        c.fillStyle = S.ton(b.klader[i]);
        c.beginPath(); c.ellipse(x - 2, y + 24, 22, 16, 0, 0, TAU); c.fill();
        c.fillStyle = S.ton('#d9b49a');
        c.beginPath(); c.arc(x, y, 11, 0, TAU); c.fill();
        c.fillStyle = S.ton(b.har[i]);
        c.beginPath(); c.arc(x - 2, y - 2, 11, Math.PI * 0.55, Math.PI * 1.95); c.fill();
      });
    }
    c.fillStyle = b.c;
    c.fill(P);
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
    // rutorna: det mörka bandet, glaset, föraren och himlen i glaset
    c.fillStyle = S.ton('#141518');
    c.fill(vag(F.hus));
    const R = vag(F.rutor);
    c.fillStyle = S.glas;
    c.fill(R);
    c.save();
    c.clip(R);
    if (!S.lamps) {
      c.fillStyle = 'rgba(8,9,12,0.5)';
      const fo = [F.forare];
      if (b.passagerare && !F.hog) fo.push([F.forare[0] - 105, F.forare[1] + 2]);
      for (const [x, y] of fo) {
        c.beginPath();
        c.arc(x, y, 11, 0, TAU);
        c.ellipse(x - 2, y + 30, 22, 16, 0, 0, TAU);
        c.fill();
      }
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
    for (const x of F.hj) ritaHjul(c, x, F.r, b.nav || F.nav, b.falg, -26, S, vrid);
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
    c.fillStyle = broms || S.lamps ? '#ff3a26' : S.ton('#a8201a');
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
    for (const [x0, x1, fram, bak] of F.delar) {
      const p = new Path2D();
      p.moveTo(x0, -30);
      if (bak) { p.lineTo(x0 - 2, -44); p.lineTo(x0 - 2, -290); p.quadraticCurveTo(x0 - 2, -302, x0 + 10, -302); } else p.lineTo(x0, -302);
      if (fram) { p.lineTo(x1 - 12, -302); p.quadraticCurveTo(x1, -302, x1, -288); p.lineTo(x1 + 2, -44); p.lineTo(x1 - 2, -30); } else { p.lineTo(x1, -302); p.lineTo(x1, -30); }
      p.closePath();
      c.fillStyle = b.c;
      c.fill(p);
      c.save();
      c.clip(p);
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
    // rutorna med folk i, och dörrarna
    c.fillStyle = ruta;
    for (const [a, e] of F.rutor) c.fillRect(a, -270, e - a, 100);
    c.save();
    c.beginPath();
    for (const [a, e] of F.rutor) c.rect(a, -270, e - a, 100);
    c.clip();
    F.rutor.forEach(([a, e], i) => {
      const f = b.folk[i];
      if (f < 0 || e - a < 60) return;
      const x = a + (e - a) * f;
      c.fillStyle = S.lamps ? 'rgba(30,24,20,0.75)' : 'rgba(8,9,12,0.45)';
      c.beginPath();
      c.arc(x, -212, 12, 0, TAU);
      c.ellipse(x, -180, 24, 18, 0, 0, TAU);
      c.fill();
    });
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
      c.fillRect(d0 - 5, -280, d1 - d0 + 10, 246);
      c.fillStyle = ruta;
      c.fillRect(d0, -272, (d1 - d0) / 2 - 3, 230);
      c.fillRect((d0 + d1) / 2 + 3, -272, (d1 - d0) / 2 - 3, 230);
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
    c.fillStyle = broms || S.lamps ? '#ff3a26' : S.ton('#a8201a');
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
    c.fillStyle = S.lamps ? '#1a1814' : S.glas;
    c.fill(vag('M174 -162 V-248 H244 Q251 -248 252 -241 L267 -162 Z'));
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

  function rita(c, S, lista, t) {
    for (const { b, f, x, fart, broms } of lista) {
      c.save();
      c.translate(x, f.y);
      c.scale(f.dir * f.k, f.k);
      if (b.typ === 'buss' || b.typ === 'ledbuss') ritaBuss(c, b, f.dir, S, fart, broms, t);
      else if (b.typ === 'plog') ritaPlog(c, b, f.dir, S, fart, broms, t);
      else ritaBil(c, b, f.dir, S, fart, broms, t, (f.dir * x) / f.k);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  return { mark, trafik, syns, rita, KANT, FILER, FORM, fordon: { nytt: nyttFordon, valj: valjTyp, BUSS, PLOG } };
})();
