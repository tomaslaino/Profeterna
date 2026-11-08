// Danserna: det gänget gör när radion spelar (radioNamn, AKTER i rum-3d.js). Italodisco
// som i de italienska tv-programmen runt 1980: härmleken med påhittade gester, armarna
// i kors och på huvudet, fingret i luften, armrullen, robotten, synten i luften, sångaren
// med flaskan som mikrofon och kören som klappar – på en barstol, som också snurrar.
// Bara siffror här; armarna, händerna och kroppen är rum-3d.js.
//
// Allt räknas i slag (b, DANS_SLAG sekunder per slag, 0 när armarna är uppe) och står i
// bildens axlar, så att dansen ser likadan ut var de än sitter: x utåt på armens sida,
// y uppåt, z mot den som tittar.
//
//   lage(b, s, v) → armen, s = 1 armen till höger i bilden och −1 till vänster, v.rol = 0, 1
//   eller 2 (roller), v.sang: armen med flaskan (DT:s lediga):
//     p      handleden från axeln i armens längd (m: 1 från mitten mellan axlarna);
//            längre än armen når den inte
//     y, z   fingrarnas och handryggens riktning, pole armbågens
//     h      handen (HAND)
//     vink, vrid  handen vrids (som i tecknen)
//     mun    fingertopparna mot munnen (0–1)
//     bal: [x, y, z]  handflatan mot kroppen, i bredden, längden och djupet, med
//     hu: [x, y, z]   eller huvudet i dess radier; y och z i kroppens eller huvudets axlar
//     mik: 1  flaskan (eller näven) som mikrofon framför munnen
//     mot: 1  armen mot sångaren (v.rol 0), med pekfingret
//     sak: 1  det som är i handen blir kvar där
//   kropp(b, v) → lean, pitch, yaw (+ åt höger i bilden), roll (+ åt vänster), twist, side,
//     lift, breath, knee, se: 'sangaren'
//   sjung(b, v) → munnen öppen (1) | blund(b, v) → ögonen stängda | snurr(b, v) → grader
//   alla: 1 behöver alla tre (annars en annan dans)

import { TECKEN, blanda } from './rum-tecken.js';

export const DANS_SLAG = 0.5;
export const DANS_IN = 1;

const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bump = (x, a, b, c, d) => sm(a, b, x) * (1 - sm(c, d, x));
const mod = (x, n) => ((x % n) + n) % n;
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const PI = Math.PI;

const TUMME_IN = [-0.62, 0.5, -0.72];
const HAND = {
  oppen: { f: [0.06, 0.02, 0.02, 0.06], sp: [-0.13, -0.04, 0.05, 0.16], tu: [0.85, 0.5, -0.1], tb: 0 },
  rak: { f: [0.02, 0.02, 0.02, 0.02], sp: [-0.02, 0, 0, 0.02], tu: [0.3, 0.9, -0.1], tb: 0 },
  pek: { f: [0, 1, 1, 1], sp: [0, 0, 0, 0], tu: TUMME_IN, tb: 0.55 },
  nave: { f: [1, 1, 1, 1], sp: [0, 0, 0, 0], tu: [-0.2, 0.62, -0.75], tb: 0.55 },
  tumme: { f: [1, 1, 1, 1], sp: [0, 0, 0, 0], tu: [1, 0.1, 0.02], tb: 0 },
  // fingertopparna samlade: "vad menar du?"
  nyp: { f: [0.3, 0.3, 0.32, 0.36], sp: [0.34, 0.11, -0.11, -0.34], tu: [-0.25, 0.9, -0.5], tb: 0.2 },
  knapp: { f: [0.5, 0.25, 0.8, 0.85], sp: [0, 0, 0, 0], tu: [0.1, 0.9, -0.45], tb: 0.15 },
  spray: { f: [0.3, 1, 1, 1], sp: [0, 0, 0, 0], tu: [0.1, 0.5, -0.8], tb: 0.5 },
};
const POLE = [1, -0.7, -0.3];
const arm = (p, y, z, h, x) => ({ p, y, z, h, pole: POLE, ...x });
// (rum-3d.js räknar ut båda lägena och blandar dem)
const mellan = (a, b, k) => (k <= 0 ? a : k >= 1 ? b : { fran: a, till: b, k });
// Ställningarna i L ([slag, arm]) en i taget, med byt slag att gå över till nästa.
function spar(b, L, byt = 0.5) {
  let i = 0;
  while (i < L.length - 1 && b >= L[i + 1][0]) i++;
  const n = L[i + 1];
  return n ? mellan(L[i][1], n[1], sm(n[0] - byt, n[0], b)) : L[i][1];
}
export const formen = (L) => (L.till ? blanda(formen(L.fran), formen(L.till), L.k) : L.h);

// 1 på jämna slag och 0 på udda, med en stund i varje läge
const upp = (b) => sm(0.12, 0.88, Math.abs(mod(b, 2) - 1));
// grunden i varje dans: en studs och en nick i varje slag, och benen
const takt = (b, x = 1) => ({
  lift: 3 * x * Math.cos(PI * b) ** 2,
  pitch: 0.05 * x * Math.cos(2 * PI * b),
  knee: [0.22 * x * Math.sin(PI * b), -0.22 * x * Math.sin(PI * b)],
});

// ---------- ställningar som flera danser delar ----------
const PEK_UPP = arm([0.46, 0.72, 0.24], [0.35, 0.93, 0.1], [0.1, 0.1, -1], HAND.pek, { pole: [1, -0.6, -0.2] });
const PEK_NER = arm([-0.16, -0.1, 0.52], [-0.45, -0.8, 0.4], [0.6, -0.3, 0.7], HAND.pek, { pole: [1, -0.2, -0.5] });
const PEK_TVARS = arm([-0.14, 0.26, 0.58], [-0.75, 0.62, 0.15], [0.45, 0.35, 0.8], HAND.pek, { pole: [1, -0.5, -0.4] });
const HOFT = arm([0.36, -0.2, 0.2], [-0.55, -0.55, 0.5], [0.6, -0.2, 0.75], HAND.oppen, { pole: [1, 0.1, -0.5] });
const MOT_SANGAREN = { mot: 1, h: HAND.pek };
const HJARTA = { bal: [-0.05, 0.7, 1.05], y: [-0.75, 0.6, 0.1], z: [0, 0.1, 1], h: HAND.oppen, pole: [1, -0.8, 0.1] };

// ---------- härmleken: en gest var fjärde slag, som på tv ----------
// (var och en: (g slag in i gesten, s) → armen, och kroppen)
const GEST = {
  // sover med kinden i handen
  sova: {
    lage: (g, s) => (s > 0
      ? { hu: [1.02, -0.2, 0.3], y: [-0.2, 0.8, -0.5], z: [1, 0.1, 0.2], h: HAND.oppen, pole: [1, -0.6, 0.1] }
      : arm([-0.14, 0.04, 0.5], [-0.8, 0.5, 0.1], [0, 0.3, 1], HAND.oppen, { pole: [1, -0.8, -0.3] })),
    kropp: () => ({ roll: -0.32, side: -0.09, pitch: 0.04, lean: 0.02 }),
    blund: () => true,
  },
  // vinkar med båda händerna
  vinka: {
    lage: (g, s) => arm([0.52, 0.56, 0.3], [0.1, 1, 0.05], [0.08, 0, -1], HAND.oppen, { vink: 0.45 * Math.sin(PI * g + (s > 0 ? 0 : PI)) }),
    kropp: (g) => ({ roll: 0.07 * Math.sin(PI * g), side: 0.05 * Math.sin(PI * g), ...takt(g, 0.6) }),
  },
  // liftar: tummen ut åt sidan i varje slag, med blicken efter bilen
  lifta: {
    lage: (g, s) => (s > 0
      ? arm([0.68 + 0.08 * Math.abs(Math.sin(PI * g)), 0.2, 0.4], [0.55, 0, 0.83], [0.83, 0, -0.55], HAND.tumme)
      : HOFT),
    kropp: (g) => ({ yaw: 0.55, side: -0.08, ...takt(g, 0.5) }),
  },
  // crawl, med huvudet åt sidan för att andas
  simma: {
    lage: (g, s) => {
      const f = PI * g + (s > 0 ? 0 : PI);
      return arm([0.38, 0.24 + 0.24 * Math.sin(f), 0.42 + 0.2 * Math.cos(f)], [0.1, 0.7 * Math.cos(f), 0.6 - 0.8 * Math.sin(f)], [0, 1, 0.1], HAND.rak, { pole: [1, 0.1, -0.5] });
    },
    kropp: (g) => ({ yaw: 0.42 * Math.sin(PI * g / 2), twist: 0.2 * Math.sin(PI * g), lean: 0.07, roll: 0.05 * Math.sin(PI * g) }),
    sjung: (g) => Math.sin(PI * g / 2) ** 2 > 0.7,
  },
  // skidstavarna: båda händerna fram och drar bakåt, med knäna
  skidor: {
    lage: (g) => {
      const u = 0.5 + 0.5 * Math.cos(PI * g);
      return arm([0.34 + 0.06 * (1 - u), -0.14 + 0.28 * u, 0.2 + 0.42 * u], [0, -0.35, 1], [0, 1, 0.35], HAND.nave, { pole: [1, -0.5, -0.6] });
    },
    kropp: (g) => {
      const u = 0.5 + 0.5 * Math.cos(PI * g);
      return { lean: 0.1 * u, lift: 3.5 * (1 - u), pitch: 0.02, knee: [0.26 * u, 0.26 * u] };
    },
  },
  // deodoranten: armen upp, sprejar under den och luktar
  spray: {
    lage: (g, s) => (s > 0
      ? arm([0.62, 0.48, 0.1], [0.25, 1, 0], [0.1, 0.1, -1], HAND.oppen, { pole: [1, 0.25, -0.2] })
      : arm([-0.58, -0.02 + 0.018 * Math.sin(4 * PI * g), 0.5], [-0.8, 0.25, -0.35], [0, 1, 0.2], HAND.spray, { m: 1, pole: [1, -0.6, -0.1] })),
    kropp: () => ({ yaw: 0.35, pitch: 0.2, roll: 0.14, side: 0.07 }),
  },
  // musklerna, i varje slag
  macho: {
    lage: (g, s) => arm([0.56, 0.28 + 0.04 * Math.abs(Math.sin(PI * g + (s > 0 ? 0 : PI / 2))), 0.14], [-0.28, 1, 0.14], [0.2, 0.2, -1], HAND.nave, { pole: [1, -0.05, -0.25] }),
    kropp: (g) => ({ lean: -0.09, pitch: -0.13, breath: 0.08, side: 0.05 * Math.sin(PI * g), twist: 0.09 * Math.sin(PI * g) }),
  },
  // ratten, och till sist tutan: italienaren i trafiken
  ratten: {
    lage: (g, s) => {
      const v = 0.7 * Math.sin(PI * g / 2);
      const a = s * 1.1 + v;
      const ratt = arm([s * 0.34 * Math.sin(a), 0.04 + 0.34 * Math.cos(a), 0.62], [-0.75, -0.15, 0.6], [0.4, 0.4, 0.8], HAND.nave, { m: 1, pole: [1, -0.8, -0.2] });
      if (s < 0) return ratt;
      const tut = arm([0, 0.06 + 0.02 * Math.abs(Math.sin(2 * PI * g)), 0.66 - 0.06 * Math.abs(Math.sin(2 * PI * g))], [-0.1, 0.4, 0.9], [0, 0.9, -0.4], HAND.rak, { m: 1, pole: [1, -0.8, -0.2] });
      return mellan(ratt, tut, sm(2.6, 3, g));
    },
    kropp: (g) => ({ roll: -0.3 * Math.sin(PI * g / 2), side: -0.09 * Math.sin(PI * g / 2), lean: 0.1, pitch: 0.05 * Math.sin(2 * PI * g) }),
    sjung: (g) => g > 2.8,
  },
  // en kyss på fingertopparna, ut i luften, med handen på hjärtat
  kyss: {
    lage: (g, s) => {
      if (s < 0) return HJARTA;
      const T = g * 0.68;
      const K = TECKEN.kyss.lage(T);
      return { ...K, p: K.p, h: TECKEN.kyss.hand(T) };
    },
    kropp: (g) => ({ pitch: 0.1 * (1 - sm(1.3, 1.9, g)) - 0.1 * sm(1.3, 1.9, g), roll: -0.05 + 0.13 * sm(1.3, 1.9, g) }),
    blund: (g) => g < 1.5,
  },
};
const GESTER = Object.keys(GEST);
// (sex av gesterna, i en ny ordning varje gång; samma lista frågas efter många gånger i varje bild)
const gestMinne = { t0: null, L: null };
const gestLista = (t0) => {
  if (gestMinne.t0 !== t0) {
    gestMinne.t0 = t0;
    gestMinne.L = GESTER.map((g, i) => [hash(t0 * 0.73 + i * 1.31), g]).sort((a, b) => a[0] - b[0]).slice(0, 6).map((x) => x[1]);
  }
  return gestMinne.L;
};
const GEST_LEN = 4;
// den tredje är alltid ett slag efter
const lekB = (b, v) => (v.rol === 2 ? b - 1 : b);
const gestNu = (b, v) => {
  const n = Math.max(0, Math.min(5, Math.floor(b / GEST_LEN)));
  return { n, g: b - n * GEST_LEN, L: gestLista(v.t0) };
};

// ---------- robotten ----------
const R_UPP = arm([0.42, 0.24, 0.2], [0, 1, 0.1], [0.1, 0, -1], HAND.rak, { pole: [1, -1, -0.1] });
const R_FRAM = arm([0.36, -0.06, 0.56], [0, 0, 1], [0, 1, 0], HAND.rak, { pole: [1, -1, -0.1] });
const R_UT = arm([0.8, 0.02, 0.2], [1, 0, 0.1], [0, 1, 0], HAND.rak, { pole: [0.1, -1, -0.3] });
// [höger arm, vänster arm, huvudet] för varje slag
const ROBOT = [[R_UPP, R_FRAM, 0.5], [R_FRAM, R_UPP, 0.5], [R_UPP, R_FRAM, -0.5], [R_FRAM, R_UPP, -0.5], [R_UT, R_UT, 0], [R_UPP, R_UPP, 0], [R_UT, R_UPP, 0.55], [R_UPP, R_UT, -0.55]];

// ---------- armarna i kors ----------
const ATIL = { bal: [-0.5, 0.92, 1.05], y: [-0.2, 0.9, -0.3], z: [0.2, 0.3, 1], h: HAND.oppen, pole: [1, -0.8, 0.1] };
const HUV = { hu: [1.02, 0.02, -0.08], y: [-0.15, 0.75, -0.6], z: [1, 0.1, 0.1], h: HAND.oppen, pole: [1, 0.4, 0.2] };
const FRAM_HAND = arm([0.26, 0.02, 0.62], [-0.35, 0.2, 1], [0.1, -1, 0.2], HAND.oppen, { pole: [1, -0.7, -0.3] });
const TUCA = 1.5;
const klapp = (u) => arm([0.02 + 0.2 * u, 0.1, 0.56], [-0.1, 0.9, 0.35], [1, 0.1, 0], HAND.oppen, { m: 1, pole: [1, -0.7, -0.2] });

export const DANSER = {
  // Fingret: rakt upp i luften och ner över kroppen, höger, vänster och till sist om vartannat.
  italoPek: {
    len: 12.6,
    lage: (b, s) => {
      const w = s > 0 ? 1 - bump(b, 7.5, 8, 15.5, 16) : sm(7.5, 8, b);
      const k = s < 0 && b >= 16 ? 1 - upp(b) : upp(b);
      return mellan(HOFT, mellan(PEK_NER, PEK_UPP, k), w);
    },
    kropp: (b) => {
      const dir = b < 8 ? 1 : b < 16 ? -1 : upp(b) * 2 - 1;
      const k = b < 16 ? upp(b) : 1;
      return { ...takt(b), side: -0.1 * dir * k, roll: 0.1 * dir * k, pitch: -0.14 * k + 0.05 * Math.cos(2 * PI * b), yaw: 0.2 * dir * k };
    },
    sjung: (b) => mod(b, 8) > 6,
  },

  // Armrullen: underarmarna runt varandra framför bröstet, i mitten och åt båda håll,
  // och till sist fingrarna i luften.
  italoRull: {
    len: 12.6,
    lage: (b, s) => {
      const C = [0, 1, -1, 0];
      const n = Math.max(0, Math.floor(b / 8));
      const f = b - n * 8;
      const sida = C[n % 4];
      const fore = n ? C[(n - 1) % 4] : 0;
      const c = fore + (sida - fore) * sm(0, 1.5, f);
      const cx = 0.3 * c;
      const cy = 0.02 + 0.14 * Math.abs(c);
      const fi = PI * b + (s > 0 ? 0 : PI);
      const rulle = arm([s * (cx + 0.16 * Math.cos(fi)), cy + 0.15 * Math.sin(fi), 0.68], [-1, 0.05, 0.25], [0, 0.35, 1], HAND.nave, { m: 1, pole: [1, -0.8, -0.1] });
      const pang = sida === 0 ? PEK_UPP : sida * s > 0 ? PEK_UPP : PEK_TVARS;
      return mellan(rulle, pang, bump(f, 5.6, 6, 7.5, 8));
    },
    kropp: (b) => {
      const n = Math.max(0, Math.floor(b / 8));
      const f = b - n * 8;
      const sida = [0, 1, -1, 0][n % 4];
      const p = bump(f, 5.6, 6, 7.5, 8);
      return { ...takt(b), twist: 0.14 * Math.sin(PI * b) * (1 - p), side: -0.1 * sida + 0.03 * Math.sin(PI * b), yaw: 0.35 * sida, pitch: -0.12 * p + 0.05 * Math.cos(2 * PI * b), lean: 0.03 };
    },
    sjung: (b) => bump(mod(b, 8), 5.6, 6, 7.5, 8) > 0.5,
  },

  // Synten: båda händerna på tangenter ingen annan ser, med allvarlig min och stängda ögon,
  // och var åttonde slag ett enda långt finger uppifrån.
  italoSynt: {
    len: 12.6,
    lage: (b, s) => {
      const f = mod(b, 8);
      const X = s * 0.24 + 0.1 * Math.sin(PI * b / 2);
      const tangent = arm([s * X, -0.04 + 0.016 * Math.abs(Math.sin(2 * PI * b)), 0.62], [-0.12, -0.35, 1], [0, 1, 0.35], {
        f: [0, 1, 2, 3].map((i) => 0.12 + 0.36 * Math.max(0, Math.sin(2 * PI * b + i * 1.9 + s)) ** 2),
        sp: [-0.14, -0.05, 0.05, 0.14],
        tu: [0.85, 0.3, -0.25],
        tb: 0.1,
      }, { m: 1, pole: [1, -0.8, -0.4] });
      if (s !== (mod(Math.floor(b / 8), 2) ? -1 : 1)) return tangent;
      const uppe = arm([0.56 + 0.012 * Math.sin(b * 14), 0.52, 0.42], [0.1, 0.55, 0.8], [0, 0.85, -0.5], HAND.pek, { pole: [1, -0.5, -0.3] });
      return mellan(tangent, uppe, bump(f, 4.6, 5.6, 7.2, 7.6));
    },
    kropp: (b) => {
      const f = mod(b, 8);
      const u = bump(f, 4.6, 5.6, 7.2, 7.6);
      return { lean: 0.1 - 0.13 * u, pitch: 0.14 * (1 - u) * (0.6 + 0.4 * Math.cos(2 * PI * b)) - 0.26 * u, roll: 0.06 * Math.sin(PI * b / 2), side: 0.05 * Math.sin(PI * b / 2), knee: [0.16 * Math.sin(PI * b), -0.16 * Math.sin(PI * b)] };
    },
    blund: () => true,
  },

  // Robotten: stel i kroppen, ett läge i varje slag och huvudet som knycker.
  italoRobot: {
    len: 12.6,
    lage: (b, s) => {
      const n = Math.floor(b);
      const u = sm(n, n + 0.16, b);
      const a = ROBOT[mod(n - 1, 8)];
      const c = ROBOT[mod(n, 8)];
      return mellan(a[s > 0 ? 0 : 1], c[s > 0 ? 0 : 1], u);
    },
    kropp: (b) => {
      const n = Math.floor(b);
      const u = sm(n, n + 0.16, b);
      const a = ROBOT[mod(n - 1, 8)][2];
      const c = ROBOT[mod(n, 8)][2];
      const y = a + (c - a) * u;
      return { yaw: y, twist: -0.3 * y, lean: -0.03, pitch: -0.03 + 0.03 * (1 - u), lift: 1.6 * (1 - u) };
    },
  },

  // Axlarna: knäpper med fingrarna och skakar på axlarna – och två gånger samlade
  // fingertoppar framför sig, som om någon just har sagt något dumt.
  italoAxlar: {
    len: 12.6,
    lage: (b, s) => {
      const f = mod(b, 12);
      const knapp = arm([0.62, 0.2 + 0.03 * Math.cos(2 * PI * b), 0.38], [0.15, 1, 0.25], [0.15, -0.1, -1], HAND.knapp, { pole: [1, -0.8, -0.2] });
      const hop = 0.05 * Math.abs(Math.sin(2 * PI * b));
      const nyp = arm([0.24, 0.2 + hop, 0.62], [0, 1, 0.3], [0.1, 0.25, -1], HAND.nyp, { pole: [1, -0.8, -0.1] });
      return mellan(knapp, nyp, bump(f, 7.5, 8, 11.4, 11.9));
    },
    kropp: (b) => {
      const f = mod(b, 12);
      const n = bump(f, 7.5, 8, 11.4, 11.9);
      const sk = Math.sin(PI * b * 2);
      return {
        ...takt(b, 0.7 * (1 - n)),
        twist: 0.3 * sk * (1 - n),
        side: 0.05 * Math.sin(PI * b) * (1 - n),
        lean: -0.06 * (1 - n) + 0.05 * n,
        roll: 0.16 * n * (mod(Math.floor(b / 12), 2) ? -1 : 1),
        pitch: 0.1 * n * Math.abs(Math.sin(2 * PI * b)) - 0.1 * (1 - n),
      };
    },
    sjung: (b) => bump(mod(b, 12), 8.5, 9, 11, 11.4) > 0.5,
  },

  // Armarna i kors: axeln, axeln, huvudet, huvudet, fram, fram och två klappar.
  italoTuca: {
    len: 12.6,
    lage: (b, s) => {
      const f = mod(b / TUCA, 8);
      const L = s > 0
        ? [[0, ATIL], [1, ATIL], [2, HUV], [3, HUV], [4, FRAM_HAND], [5, FRAM_HAND], [6, klapp(0)], [6.5, klapp(1)], [7, klapp(0)], [7.5, klapp(1)], [8, ATIL]]
        : [[0, klapp(1)], [1, ATIL], [2, ATIL], [3, HUV], [4, HUV], [5, FRAM_HAND], [6, klapp(0)], [6.5, klapp(1)], [7, klapp(0)], [7.5, klapp(1)], [8, klapp(1)]];
      return spar(f, L, 0.32);
    },
    kropp: (b) => {
      const f = mod(b / TUCA, 8);
      const v = mod(Math.floor(b / TUCA / 8), 2) ? -1 : 1;
      return { ...takt(b, 0.8), twist: 0.2 * v * bump(f, 3.6, 4.2, 5.6, 6), yaw: 0.3 * v * bump(f, 3.6, 4.2, 5.6, 6), roll: 0.08 * Math.sin(PI * b / 2), side: 0.06 * Math.sin(PI * b / 2) };
    },
    sjung: (b) => mod(b / TUCA, 8) >= 5.9,
  },

  // Tv-studion: en sjunger i flaskan med handen på hjärtat och armen ut mot publiken,
  // och de andra två är kören, som klappar och till sist pekar på sångaren.
  italoStudio: {
    len: 13,
    alla: 1,
    lage: (b, s, v) => {
      if (v.rol === 0) {
        if (v.sang) return { mik: 1, sak: 1, h: HAND.nave };
        const ut = arm([0.62, 0.1 + 0.16 * sm(4, 8, mod(b, 8)), 0.46], [0.5, 0.15, 0.8], [0.1, -1, 0.2], HAND.oppen, { pole: [1, -0.8, -0.2] });
        const hog = arm([0.6, 0.56, 0.4], [0.4, 0.8, 0.45], [0.1, -0.4, -0.9], HAND.oppen, { pole: [1, -0.7, -0.2] });
        return spar(b, [[0, HJARTA], [8, ut], [12, HJARTA], [16, ut], [20, hog]], 0.9);
      }
      return mellan(klapp(upp(b + 1)), MOT_SANGAREN, sm(19.2, 19.9, b));
    },
    kropp: (b, v) => {
      if (v.rol === 0) {
        const ton = sm(19.5, 20.5, b);
        return { pitch: -0.1 - 0.22 * ton + 0.03 * Math.sin(PI * b / 4), roll: 0.08 * Math.sin(PI * b / 4), side: 0.05 * Math.sin(PI * b / 4), lean: -0.05 - 0.05 * ton, breath: 0.05 * ton };
      }
      const sv = Math.sin(PI * b / 2);
      return { ...takt(b, 0.7), side: 0.11 * sv, roll: 0.09 * sv, se: 'sangaren', seW: 0.55 };
    },
    sjung: (b, v) => (v.rol === 0 ? mod(b, 4) < 3.4 : mod(b, 4) > 2.2),
    blund: (b, v) => v.rol === 0,
  },

  // Barstolen: knäpper med fingrarna och snurrar ett varv, en i taget och sist alla tre.
  italoSnurr: {
    len: 13,
    lage: (b, s, v) => {
      const per = snurrNar(b, v);
      const knapp = arm([0.6, 0.18 + 0.03 * Math.cos(2 * PI * b), 0.36], [0.15, 1, 0.25], [0.15, -0.1, -1], HAND.knapp, { pole: [1, -0.8, -0.2] });
      const tatt = arm([0.3, 0.04, 0.42], [-0.3, 0.7, 0.3], [0.1, 0.3, -1], HAND.nave, { pole: [1, -0.8, 0] });
      return mellan(knapp, s > 0 ? PEK_UPP : tatt, per);
    },
    kropp: (b, v) => {
      const per = snurrNar(b, v);
      return { ...takt(b, 0.8 * (1 - per)), twist: 0.12 * Math.sin(PI * b) * (1 - per), pitch: -0.14 * per, lean: -0.05 * per, side: 0.05 * Math.sin(PI * b) * (1 - per) };
    },
    snurr: (b, v) => {
      const a = SNURR[v.rol];
      return 360 * (sm(a, a + 4, b) + sm(SNURR_ALLA, SNURR_ALLA + 4, b));
    },
    sjung: (b, v) => snurrNar(b, v) > 0.5,
  },

  // Härmleken.
  italoLek: {
    len: 13,
    lage: (b0, s, v) => {
      const b = lekB(b0, v);
      const { n, g, L } = gestNu(b, v);
      const a = GEST[L[n]].lage(Math.max(0, g), s);
      if (n >= 5 || g < GEST_LEN - 0.55) return a;
      return mellan(a, GEST[L[n + 1]].lage(0, s), sm(GEST_LEN - 0.55, GEST_LEN, g));
    },
    kropp: (b0, v) => {
      const b = lekB(b0, v);
      const { n, g, L } = gestNu(b, v);
      const a = GEST[L[n]].kropp(Math.max(0, g));
      const k = g < GEST_LEN - 0.55 || n >= 5 ? 0 : sm(GEST_LEN - 0.55, GEST_LEN, g);
      if (!k) return a;
      const c = GEST[L[n + 1]].kropp(0);
      const ut = {};
      for (const x of new Set([...Object.keys(a), ...Object.keys(c)])) {
        if (x === 'knee') ut.knee = [0, 1].map((i) => ((a.knee ? a.knee[i] : 0) * (1 - k)) + ((c.knee ? c.knee[i] : 0) * k));
        else ut[x] = (a[x] || 0) * (1 - k) + (c[x] || 0) * k;
      }
      return ut;
    },
    sjung: (b0, v) => {
      const { n, g, L } = gestNu(lekB(b0, v), v);
      const f = GEST[L[n]].sjung;
      return Boolean(f && f(g));
    },
    blund: (b0, v) => {
      const { n, g, L } = gestNu(lekB(b0, v), v);
      const f = GEST[L[n]].blund;
      return Boolean(f && f(g));
    },
  },
};
// När var och en snurrar (slag), och alla tre.
const SNURR = [4, 8, 12];
const SNURR_ALLA = 18;
function snurrNar(b, v) {
  const a = SNURR[v.rol];
  return Math.max(bump(b, a - 0.5, a + 0.2, a + 3.8, a + 4.5), bump(b, SNURR_ALLA - 0.5, SNURR_ALLA + 0.2, SNURR_ALLA + 3.8, SNURR_ALLA + 4.5));
}
