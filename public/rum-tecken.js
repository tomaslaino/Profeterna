// Tecknen: det gänget gör när man klickar på dem (tecken i rum-3d.js) – hang
// loose, tummen upp, peace, pistolfingrar, rock, honnör, knogarna, kockens kyss
// och vinkning. Bara siffror här; handen med fingrarna och armen är rum-3d.js.
//
// Allt står i betraktarens axlar, för handen på betraktarens högra sida:
// x utåt från figuren (speglas för den andra armen), y uppåt, z mot den som
// tittar. Då ser tecknet likadant ut var figuren än sitter vid bordet, och man
// ser det framifrån fast figuren är vriden mot bordet.
//
//   lage(T) → var handen är T sekunder in i tecknet:
//     p     handleden från axeln, i armens längd (a + b); längre än 0,95 når
//           den inte. { mun: 1 } i stället: fingertopparna mot munnen
//     y     fingrarnas riktning, z handryggens (som orient i rum-3d.js)
//     pole  åt vilket håll armbågen pekar
//     vrid  handen vrids runt fingrarna (underarmen), vink fingrarna åt sidan,
//           + bort från tummen (radianer)
//   hand(T) → fingrarna:
//     f     krökningen [pek, lång, ring, lill], 0 rak och 1 knuten
//     sp    hur de spretar, + bort från tummen
//     tu    tummens riktning: utåt från handen, längs fingrarna, mot handryggen
//     tb    hur mycket tummens yttre led böjs
//   kropp(T) → { lean, pitch, roll } utöver det vanliga: roll + lutar huvudet
//     åt handen.
//   langd: så länge tecknet hålls (sekunder), innan armen går ner.

const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => a.map((x, i) => x + (b[i] - x) * k);
const POLE = [1, -0.7, -0.3];
// tummen in över fingrarna
const IN = [-0.62, 0.5, -0.72];
const INB = 0.55;
// en liten studs när handen kommer upp
const studs = (T) => 0.035 * Math.exp(-4.5 * Math.max(0, T - 0.32)) * Math.sin(13 * Math.max(0, T - 0.32));

export const TECKEN = {
  // Hang loose: tummen och lillfingret ut, och hela handen vaggar i handleden.
  hang: {
    langd: 2.5,
    lage: (T) => ({ p: [0.46, 0.5 + studs(T), 0.34], y: [0.08, 1, 0.1], z: [0.2, 0, -1], pole: POLE, vrid: 0.46 * Math.sin((T - 0.3) * 8) * sm(0.28, 0.5, T) }),
    hand: () => ({ f: [1, 1, 1, 0], sp: [0, 0, 0, 0.5], tu: [1, 0.42, -0.1], tb: 0 }),
    kropp: (T) => ({ roll: 0.08, pitch: -0.03 + 0.03 * Math.sin(T * 8) }),
  },
  // Tummen upp, med en liten knyck.
  tumme: {
    langd: 2.2,
    lage: (T) => ({ p: [0.36, 0.42 + studs(T) + 0.022 * Math.sin((T - 0.5) * 7) * sm(0.5, 0.7, T) * (1 - sm(1.5, 1.9, T)), 0.44], y: [0.55, 0, 0.83], z: [0.83, 0, -0.55], pole: POLE }),
    hand: () => ({ f: [1, 1, 1, 1], sp: [0, 0, 0, 0], tu: [1, 0.1, 0.02], tb: 0 }),
    kropp: () => ({ pitch: 0.06, roll: 0.03 }),
  },
  // Peace: två fingrar upp, handflatan mot en och huvudet på sned.
  peace: {
    langd: 2.3,
    lage: (T) => ({ p: [0.47, 0.54 + studs(T), 0.32], y: [0.14, 1, 0.04], z: [0.06, 0, -1], pole: POLE, vink: 0.07 * Math.sin((T - 0.4) * 3.4) * sm(0.4, 0.7, T) }),
    hand: () => ({ f: [0, 0, 1, 1], sp: [-0.2, 0.2, 0, 0], tu: IN, tb: INB }),
    kropp: () => ({ roll: 0.14, pitch: -0.02 }),
  },
  // Pistolfingrarna: siktar på en och skjuter två gånger.
  pistol: {
    langd: 2.3,
    lage: (T) => {
      const skott = (a) => (T < a ? 0 : Math.exp(-7 * (T - a)) * sm(a, a + 0.04, T));
      return { p: [0.3, 0.4 + studs(T), 0.56], y: [0.72, 0.06, 0.69], z: [0.69, 0, -0.72], pole: POLE, vink: -0.6 * (skott(0.72) + skott(1.34)) };
    },
    hand: () => ({ f: [0, 1, 1, 1], sp: [0, 0, 0, 0], tu: [1, 0.3, 0], tb: 0 }),
    kropp: (T) => ({ pitch: 0.05, roll: -0.06, lean: 0.04 * sm(0.3, 0.6, T) }),
  },
  // Rock: pekfingret och lillfingret upp, armen högt och huvudet med i takten.
  rock: {
    langd: 2.3,
    lage: (T) => ({ p: [0.42, 0.72 + studs(T) + 0.03 * Math.sin(T * 11) * sm(0.35, 0.55, T), 0.24], y: [0.1, 1, 0.14], z: [0.05, 0.14, -1], pole: POLE }),
    hand: () => ({ f: [0, 1, 1, 0], sp: [-0.12, 0, 0, 0.16], tu: IN, tb: INB }),
    kropp: (T) => ({ pitch: 0.1 * Math.sin(T * 11) * sm(0.35, 0.55, T), lean: 0.02, roll: 0.05 }),
  },
  // Honnören: två fingrar vid tinningen, som knycks ut mot en.
  honnor: {
    langd: 2.2,
    lage: (T) => {
      const ut = sm(0.95, 1.2, T);
      return { p: mix([0.5, 0.64 + studs(T), 0.2], [0.68, 0.6, 0.34], ut), y: mix([-0.62, 0.78, 0.06], [0.2, 0.95, 0.14], ut), z: mix([-0.2, -0.1, -1], [0.1, 0, -1], ut), pole: POLE };
    },
    hand: () => ({ f: [0, 0, 1, 1], sp: [0.03, -0.03, 0, 0], tu: IN, tb: INB }),
    kropp: (T) => ({ roll: 0.06, pitch: -0.05 * sm(0.95, 1.2, T) }),
  },
  // Knogarna: näven fram mot den som tittar, en lätt stöt.
  knoge: {
    langd: 2.1,
    lage: (T) => {
      const fram = sm(0.34, 0.5, T) * (1 - 0.14 * sm(0.5, 0.75, T));
      return { p: mix([0.38, 0.14, 0.5], [0.2, 0.2, 0.88], fram), y: [-0.12, 0.04, 1], z: [1, 0, 0.12], pole: POLE };
    },
    hand: () => ({ f: [1, 1, 1, 1], sp: [0, 0, 0, 0], tu: [-0.2, 0.62, -0.75], tb: INB }),
    kropp: (T) => ({ lean: 0.08 * sm(0.34, 0.5, T), pitch: 0.03 }),
  },
  // Kockens kyss: fingertopparna samlade mot munnen, och sedan ut i luften.
  kyss: {
    langd: 2.7,
    lage: (T) => {
      const ut = sm(0.95, 1.3, T);
      return { mun: 1 - ut, p: [0.48, 0.52, 0.62], y: mix([-0.5, 0.72, -0.42], [0.3, 0.92, 0.22], ut), z: mix([0.5, 0.4, -0.75], [0.1, -0.2, -1], ut), pole: [1, -0.85, 0.1], vink: 0.1 * ut * Math.sin((T - 1.2) * 5) };
    },
    hand: (T) => {
      const ut = sm(0.95, 1.22, T);
      return {
        f: mix([0.36, 0.36, 0.38, 0.42], [0, 0, 0, 0], ut),
        sp: mix([0.26, 0.08, -0.08, -0.26], [-0.2, -0.07, 0.07, 0.22], ut),
        tu: mix([-0.3, 0.85, -0.55], [0.9, 0.5, -0.1], ut),
        tb: 0.25 * (1 - ut),
      };
    },
    kropp: (T) => ({ pitch: 0.1 * (1 - sm(0.95, 1.2, T)) - 0.08 * sm(0.95, 1.2, T), roll: -0.06 + 0.14 * sm(0.95, 1.2, T) }),
  },
  // Vinkningen: den öppna handen fram och tillbaka.
  vink: {
    langd: 2.2,
    lage: (T) => ({ p: [0.5, 0.56 + studs(T), 0.3], y: [0.1, 1, 0.05], z: [0.08, 0, -1], pole: POLE, vink: 0.42 * Math.sin((T - 0.3) * 8.5) * sm(0.28, 0.5, T) }),
    hand: () => ({ f: [0.06, 0.02, 0.02, 0.06], sp: [-0.13, -0.04, 0.05, 0.16], tu: [0.85, 0.5, -0.1], tb: 0 }),
    kropp: () => ({ roll: 0.05 }),
  },
};

// Handen innan den har format tecknet.
export const LOS = { f: [0.28, 0.3, 0.34, 0.38], sp: [0, 0, 0, 0], tu: [0.7, 0.62, -0.32], tb: 0.2 };

// Blandar två handställningar.
export function blanda(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  return { f: mix(a.f, b.f, k), sp: mix(a.sp, b.sp, k), tu: mix(a.tu, b.tu, k), tb: a.tb + (b.tb - a.tb) * k };
}

// ---------- korstecknet ----------
// Gänget korsar sig ibland inför matcherna (korsaVal, AKTER och korsHand i
// rum-3d.js), också det bara siffror här. Till skillnad från tecknen ovan är det
// riktat mot kroppen, inte mot den som tittar, och man gör det inte när någon
// klickar. Alltid med högerhanden: en flaska eller cigarett i den ställs ner först.
//
//   len    hur länge det pågår (sekunder)
//   upp    [a, b]: armen går upp mellan a och b och ner lika långt från slutet
//   bana   [[tid, ställe] …]: var fingertopparna är. Stället står kvar tills nästa
//          rad tar vid, så samma ställe två gånger är en paus. På kroppen: panna
//          (armarna når inte runt det stora huvudet, så handen stannar framför
//          ansiktet), mun, brost, vanster, hoger (figurens egna axlar). I luften
//          framför bröstet: upp, ner, vl, hl. Högt upp: himmel.
//   hand   (l) → fingrarna, som hand i tecknen
//   topp   hur långt fingertopparna är från handleden (armens tjocklekar)
//   kropp  (l) → { lean, pitch, yaw, roll, lift, knee }: + böjer huvudet, + vrider
//          det åt figurens vänster
//   blund  (l) → sant medan ögonen är stängda
//   litet  (l) → [x, y]: en liten rörelse till kring stället (tummens kors)
//   vrid   handen vriden runt fingrarna (radianer), så att tummen syns
//   sak    i stället för fingrarna: det som är i handen ritar korset i luften
const bump = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t));
const RAK = { f: [0.22, 0.2, 0.6, 0.7], sp: [0.06, -0.06, 0, 0], tu: [-0.3, 0.85, -0.42], tb: 0.2 };
// tummen, pekfingret och långfingret ihop och de två andra i handen
const TRE = { f: [0.3, 0.3, 0.95, 0.95], sp: [0.05, -0.05, 0, 0], tu: [-0.34, 0.85, -0.42], tb: 0.2 };
const SAMLAD = { f: [0.36, 0.36, 0.38, 0.42], sp: [0.26, 0.08, -0.08, -0.26], tu: [-0.3, 0.85, -0.55], tb: 0.25 };
const PEK = { f: [0, 1, 1, 1], sp: [0, 0, 0, 0], tu: IN, tb: INB };
const TUMME = { f: [0.45, 1, 1, 1], sp: [0, 0, 0, 0], tu: [-0.25, 1, -0.05], tb: 0.05 };
// högra axeln fram medan handen är uppe vid pannan, med ansiktet kvar
const strack = (l, a, b, c, d) => { const k = bump(l, a, b, c, d); return { twist: 0.25 * k, yaw: -0.25 * k }; };
// ett litet kors (i tiden a–a + d): först uppifrån och ner, sedan tvärs över
const korsLitet = (l, a, d) => {
  const k = (l - a) / d;
  if (k < 0 || k > 1) return [0, 0];
  return k < 0.5 ? [0, 1 - 4 * k] : [-1 + 4 * (k - 0.5), 0];
};

export const KORS = {
  // Det vanliga, i lugn och ro: pannan, bröstet, vänster axel, höger axel, och
  // handen stannar en stund på bröstet med huvudet böjt och ögonen stängda.
  korsa: {
    len: 6.2,
    topp: 3.5,
    bana: [[1, 'panna'], [1.4, 'panna'], [1.95, 'brost'], [2.2, 'brost'], [2.7, 'vanster'], [2.95, 'vanster'], [3.45, 'hoger'], [3.7, 'hoger'], [4.2, 'brost'], [5.1, 'brost']],
    hand: () => RAK,
    kropp: (l) => ({ ...strack(l, 0.5, 1, 1.5, 2), pitch: 0.3 * bump(l, 0.5, 1.1, 5, 5.7) - 0.14 * bump(l, 0.5, 1, 1.5, 2), lean: 0.08 * bump(l, 0.5, 1.1, 5, 5.7) }),
    blund: (l) => l > 4.1 && l < 5.1,
  },
  // Som spelaren på väg in på plan: litet och fort, framför bröstet utan att röra
  // det, utan att sluta med det hen gör.
  korsaKvickt: {
    len: 2.7,
    upp: [0.3, 0.7],
    topp: 3.1,
    bana: [[0.72, 'upp'], [0.8, 'upp'], [1.02, 'ner'], [1.08, 'ner'], [1.3, 'vl'], [1.36, 'vl'], [1.58, 'hl'], [2, 'hl']],
    hand: () => TRE,
  },
  // Med kyss: korset, kyssen på fingertopparna och pekfingret upp mot himlen,
  // med blicken efter. Som när någon gjort mål, fast på förhand.
  korsaKyss: {
    len: 7.2,
    topp: 3.3,
    bana: [[1, 'panna'], [1.3, 'panna'], [1.8, 'brost'], [1.95, 'brost'], [2.4, 'vanster'], [2.55, 'vanster'], [3, 'hoger'], [3.15, 'hoger'], [3.65, 'mun'], [4.05, 'mun'], [4.65, 'himmel'], [6.2, 'himmel']],
    hand: (l) => blanda(blanda(RAK, SAMLAD, sm(3.15, 3.6, l)), PEK, sm(4.1, 4.5, l)),
    kropp: (l) => ({ ...strack(l, 0.5, 1, 1.4, 1.9), pitch: 0.2 * bump(l, 0.5, 1, 3, 3.5) + 0.08 * bump(l, 3.4, 3.7, 4, 4.3) - 0.44 * bump(l, 4.2, 4.8, 5.9, 6.6), lean: 0.06 * bump(l, 0.5, 1, 3, 3.5) - 0.05 * bump(l, 4.2, 4.8, 5.9, 6.6) }),
  },
  // Tre gånger, allt fortare: den som inte tar några risker.
  korsaTre: {
    len: 5.3,
    upp: [0.35, 0.8],
    topp: 3.1,
    bana: [[0.82, 'upp'], [1.1, 'ner'], [1.38, 'vl'], [1.66, 'hl'], [1.96, 'upp'], [2.2, 'ner'], [2.44, 'vl'], [2.68, 'hl'], [2.94, 'upp'], [3.14, 'ner'], [3.34, 'vl'], [3.54, 'hl'], [4.5, 'hl']],
    hand: () => TRE,
    kropp: (l) => {
      const k = bump(l, 0.4, 0.9, 4, 4.7);
      return { lean: 0.1 * k, pitch: 0.1 * k, knee: [0.2 * k * Math.sin(l * 9), 0.2 * k * Math.sin(l * 9 + 2)] };
    },
  },
  // Fel axel: pannan och bröstet går bra, men sedan höger axel först. Handen
  // stannar, hen tittar på den, tar den vänstra, den högra – och rycker på axlarna.
  korsaVilsen: {
    len: 7,
    topp: 3.5,
    bana: [[1, 'panna'], [1.35, 'panna'], [1.9, 'brost'], [2.1, 'brost'], [2.6, 'hoger'], [3.6, 'hoger'], [4.15, 'vanster'], [4.5, 'vanster'], [5, 'hoger'], [6, 'hoger']],
    hand: () => RAK,
    kropp: (l) => ({
      twist: strack(l, 0.5, 1, 1.45, 1.95).twist,
      pitch: 0.18 * bump(l, 0.5, 1, 1.8, 2.4) + 0.26 * bump(l, 2.5, 2.9, 4.4, 4.9),
      yaw: strack(l, 0.5, 1, 1.45, 1.95).yaw - 0.5 * bump(l, 2.5, 2.9, 3.5, 3.9) + 0.42 * bump(l, 3.7, 4.1, 4.5, 4.9),
      roll: 0.1 * bump(l, 5.1, 5.4, 5.9, 6.4),
      lift: 3 * bump(l, 5.1, 5.35, 5.8, 6.3),
    }),
  },
  // Med tummen, som man gör i Sydamerika: ett litet kors på pannan, ett på munnen
  // och ett på bröstet, och till sist en kyss på tummen.
  korsaTumme: {
    len: 6.8,
    topp: 2.55,
    vrid: 0.7,
    bana: [[1, 'panna'], [1.75, 'panna'], [2.15, 'mun'], [2.9, 'mun'], [3.4, 'brost'], [4.15, 'brost'], [4.75, 'mun'], [5.8, 'mun']],
    hand: () => TUMME,
    litet: (l) => {
      const a = korsLitet(l, 1.05, 0.65);
      const b = korsLitet(l, 2.2, 0.65);
      const c = korsLitet(l, 3.45, 0.65);
      return [a[0] + b[0] + c[0], a[1] + b[1] + c[1]];
    },
    kropp: (l) => ({ ...strack(l, 0.5, 1, 1.75, 2.15), pitch: 0.2 * bump(l, 0.5, 1, 2, 2.5) + 0.2 * bump(l, 3, 3.5, 4.2, 4.6) + 0.1 * bump(l, 4.6, 4.9, 5.7, 6.2), lean: 0.05 * bump(l, 0.5, 1, 5.7, 6.2) }),
  },
  // Med det som är i handen: flaskan (DT cigaretten) ritar korset i luften och
  // går sedan vidare till munnen. Det är också en sorts förberedelse.
  korsaSak: {
    len: 6.4,
    upp: [0.1, 0.8],
    topp: 0,
    sak: true,
    bana: [[0.85, 'upp'], [1, 'upp'], [1.4, 'ner'], [1.55, 'ner'], [1.95, 'vl'], [2.1, 'vl'], [2.5, 'hl'], [2.8, 'hl']],
    munnen: [3, 3.45, 4.9, 5.4],
    kropp: (l) => ({ pitch: 0.16 * bump(l, 0.4, 0.9, 2.5, 3) - 0.34 * bump(l, 3.1, 3.5, 4.8, 5.3), lean: -0.05 * bump(l, 3.1, 3.5, 4.8, 5.3) }),
  },
};

// Vilket korstecken var och en brukar göra: alla kan alla, men DL (Nacional) gör
// det ordentligt, DT slarvar och DJ är osäker på axlarna.
export const KORS_MENY = {
  dl: ['korsa', 'korsaTumme', 'korsaKyss', 'korsaKvickt', 'korsa', 'korsaTumme', 'korsaTre', 'korsaSak', 'korsaVilsen'],
  dt: ['korsaKvickt', 'korsaSak', 'korsa', 'korsaKvickt', 'korsaKyss', 'korsaTre', 'korsaSak', 'korsaTumme', 'korsaVilsen'],
  dj: ['korsaVilsen', 'korsaKvickt', 'korsaTre', 'korsa', 'korsaVilsen', 'korsaKyss', 'korsaKvickt', 'korsaSak', 'korsaTumme'],
};

// Hur ofta: chansen för var och en i varje lucka (11 sekunder, AKT_SLOT i
// rum-3d.js), efter hur många timmar det är kvar till nästa avspark. Luckan står
// tom när gänget gör något tillsammans, så med tre i gänget blir det i simulering
// ett kors ungefär var fjortonde minut dagen före, var fjärde minut de sista tre
// timmarna och var tredje minut den sista kvarten.
export const korsChans = (h) => (!(h > 0) ? 0 : h <= 0.25 ? 0.04 : h <= 3 ? 0.02 : h <= 24 ? 0.01 : 0);

// Vilket tecken som är nästa: först de två man väntar sig, sedan alla i en
// ordning som blandas om varje varv, utan samma två gånger i rad. Gemensamt för
// gänget, så att de inte gör samma sak efter varandra.
const FORST = ['hang', 'tumme'];
let kvar = FORST.slice();
let senast = null;
export function nasta() {
  if (!kvar.length) {
    kvar = Object.keys(TECKEN);
    for (let i = kvar.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [kvar[i], kvar[j]] = [kvar[j], kvar[i]];
    }
    if (kvar[0] === senast) kvar.push(kvar.shift());
  }
  senast = kvar.shift();
  return senast;
}
