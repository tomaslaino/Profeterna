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
