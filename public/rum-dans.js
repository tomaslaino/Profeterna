// Danserna: det gänget gör när radion spelar (radioNamn, AKTER i rum-3d.js). Italodisco
// som i de italienska tv-programmen runt 1980: härmleken med påhittade gester, armarna
// i kors och på huvudet, fingret i luften, armrullen, robotten, synten i luften, sångaren
// med flaskan som mikrofon och kören som klappar – på en barstol, som också snurrar. Och
// det man gör vid ett bord när en låt kommer på: handjiven, blåssektionen (saxofon, trumpet
// och trombon), twisten på barstolen, fingerpistolerna, klappen och händerna i luften,
// balladen med flaskan uppe som en tändare och sprinklern.
// Ingen dans börjar eller byts på en signal (längst ner: insteget, bytet och takten i kroppen).
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
//     fram: [x, y, z]  handleden en bit från munnen (figurens mått, huvudets axlar)
//     bord: [d, x, lyft]  handen platt på bordet, d in från kanten och x åt sin sida
//     mot: 1  armen mot sångaren (v.rol 0, eller figuren vem), med pekfingret; lyft, vrid
//     sak: 1  det som är i handen blir kvar där
//   kropp(b, v) → lean, pitch, yaw (+ åt höger i bilden), roll (+ åt vänster), twist, side,
//     lift, breath, knee, se: 'sangaren' (eller en figur), seW
//   sjung(b, v) → munnen öppen (1) | blund(b, v) → ögonen stängda | snurr(b, v) → grader
//   alla: 1 behöver alla tre (annars en annan dans), igang: 1 inte som första dans efter vilan
//   Dansen får vara högst 13,5 s (len); radions lucka är 14.

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
  // fingerpistolen: pekfingret ut och tummen upp
  pistol: { f: [0, 1, 1, 1], sp: [0, 0, 0, 0], tu: [1, 0.1, 0.02], tb: 0 },
  // en lös näve, när man bara gungar med
  los: { f: [0.55, 0.62, 0.68, 0.74], sp: [0, 0, 0, 0], tu: [-0.1, 0.75, -0.6], tb: 0.3 },
};
// fingrarna på klaffar eller ventiler (i: vilken hand, fort: hur fort)
const klaffar = (b, i, fort = 1, bas = 0.22) => ({
  f: [0, 1, 2, 3].map((j) => bas + 0.42 * Math.max(0, Math.sin(PI * b * fort + j * 1.7 + i * 2.3)) ** 2),
  sp: [-0.06, -0.02, 0.02, 0.06],
  tu: [0.3, 0.8, -0.4],
  tb: 0.2,
});
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

// ---------- handjiven ----------
// två slag var: på bordet, klapp, höger hand över vänster och tvärtom, näven på näven och
// tvärtom, och tummen åt sidan med var hand (u: 0 i slaget, 1 mitt emellan)
function jive(n, u, s) {
  const over = n === 2 || n === 4 ? s > 0 : s < 0;
  if (n === 0) return { bord: [15, 9, 8 * u], h: HAND.oppen };
  if (n === 1) return klapp(0.15 + 0.85 * u);
  if (n < 4) return arm([0.04, over ? -0.03 + 0.08 * u : -0.1, 0.56], [-1, 0, 0.3], [0, 1, 0.1], HAND.rak, { m: 1, pole: [1, -0.9, -0.2] });
  if (n < 6) return arm([0.03, over ? 0 + 0.09 * u : -0.12, 0.55], [-0.4, 0.15, 1], [0.9, 0.2, 0.3], HAND.nave, { m: 1, pole: [1, -0.9, -0.2] });
  return (n === 6) === s > 0 ? arm([0.52 + 0.08 * (1 - u), 0.2, 0.4], [0.55, 0, 0.83], [0.83, 0, -0.55], HAND.tumme) : HOFT;
}

// ---------- blåssektionen ----------
// a saxofon, b trumpet och c trombon. fram: handleden från munnen (figurens mått, i huvudets
// axlar, x utåt på armens sida). hog 0–1: instrumentet upp i luften.
function blas(rol, b, s, hog, solo) {
  const h = 6 * hog;
  if (rol === 0) {
    return s < 0
      ? { fram: [-1, -27 + h, 13], y: [-1, -0.15, 0.25], z: [0.2, 0.1, 1], h: klaffar(b, 0, solo ? 4 : 2), pole: [1, -0.8, -0.2] }
      : { fram: [13, -44 + h, 10], y: [-1, -0.25, 0.2], z: [0.2, 0.1, 1], h: klaffar(b, 1, solo ? 4 : 2), pole: [1, -0.8, -0.2] };
  }
  if (rol === 1) {
    return s < 0
      ? { fram: [3, -9 + h, 22 + h], y: [-0.6, 0.8, 0.1], z: [0.9, 0.3, -0.1], h: HAND.nave, pole: [1, -0.8, -0.2] }
      : { fram: [0, 0 + h, 27 + h], y: [-0.2, -0.9, 0.3], z: [0.1, 0.3, 1], h: klaffar(b, 0, 2, 0.1), pole: [1, -0.6, -0.2] };
  }
  if (s < 0) return { fram: [3, -9 + h, 15], y: [-0.5, 0.8, 0.2], z: [0.8, 0.4, -0.3], h: HAND.nave, pole: [1, -0.8, -0.2] };
  // dragstången: ut och in igen på två slag
  const drag = 0.5 - 0.5 * Math.cos(PI * b);
  return arm([0.12, 0.06 + 0.1 * hog, 0.5 + 0.38 * drag], [-0.2, 0.9, 0.2], [0.3, 0.2, 1], HAND.nave, { pole: [1, -0.8, -0.2] });
}
// riffet: stötar på de här slagen i varje takt om åtta
const RIFF = [0, 0.5, 1.5, 3, 4, 4.5, 5.5, 7];
const riff = (b) => { const f = mod(b, 8); let k = 0; for (const r of RIFF) k = Math.max(k, bump(f, r - 0.05, r + 0.05, r + 0.2, r + 0.45)); return k; };

// ---------- klappen ----------
// händerna möts framför pannan (u 0) och isär (u 1)
const klappHog = (u) => arm([0.05 + 0.22 * u, 0.48, 0.6], [-0.15, 0.85, 0.4], [1, 0.1, 0.1], HAND.oppen, { m: 1, pole: [1, -0.5, -0.3] });
const vajar = (b, s) => {
  const v = Math.sin(PI * b / 2);
  return arm([0.44 + 0.1 * v * s, 0.6, 0.22], [0.2 + 0.35 * v * s, 1, -0.05], [0.1, 0.05, -1], HAND.oppen, { pole: [1, -0.5, -0.4] });
};

// ---------- sprinklern ----------
// handen bakom huvudet och den andra armen som sprutar: ryck för ryck utåt på varje halvt slag
// i tre slag, och tillbaka i ett svep
const NACKE = { hu: [0.92, 0.18, -0.45], y: [-0.4, 0.7, -0.6], z: [1, 0.15, 0.1], h: HAND.oppen, pole: [1, 0.5, 0.1] };
function sprinkler(b) {
  const f = mod(b, 4);
  if (f < 3) {
    const n = Math.floor(f * 2);
    return (n + sm(0, 0.18, f * 2 - n)) / 6;
  }
  return 1 - sm(3, 3.9, f);
}
const sprut = (u) => {
  const a = (0.12 + 0.62 * u) * PI / 2;
  return arm([0.86 * Math.sin(a), 0.14, 0.86 * Math.cos(a)], [Math.sin(a), 0.12, Math.cos(a)], [0, 1, 0], HAND.rak, { pole: [0.6, -1, -0.3] });
};

// ---------- pistolerna ----------
// rekylen: handen hoppar upp efter skottet (på slag p, var annat slag)
const rekyl = (b, p) => Math.max(0, 1 - mod(b - p, 2) * 5);
const pistolFram = (rk) => arm([0.5, 0.12 + 0.08 * rk, 0.62], [0.75, 0.1 + 0.75 * rk, 0.65], [0.65, 0, -0.75], HAND.pistol, { pole: [1, -0.7, -0.2] });

// ---------- mellan danserna ----------
// lösa nävar framför bröstet som gungar i takt, medan man ser vad som kommer
const vagga = (b, s) => arm([0.3, -0.1 + 0.05 * Math.sin(PI * b + (s > 0 ? 0 : PI)), 0.44], [-0.3, 0.7, 0.3], [0.1, 0.3, -1], HAND.los, { pole: [1, -0.8, 0] });

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

  // Handjiven vid bordet, två gånger om: på bordet, klapp, händerna över varandra, nävarna
  // på varandra och tummen ut.
  italoJive: {
    len: 12.8,
    lage: (b, s) => {
      const f = mod(b, 16);
      const n = Math.floor(f / 2);
      const u = Math.sin(PI * mod(f, 1));
      return mellan(jive(n, u, s), jive((n + 1) % 8, 0, s), sm(1.72, 2, mod(f, 2)));
    },
    kropp: (b) => {
      const n = Math.floor(mod(b, 16) / 2);
      const bord = n === 0 ? 1 : n === 7 ? sm(15.6, 16, mod(b, 16)) : n === 1 ? 1 - sm(2, 2.4, mod(b, 16)) : 0;
      return { ...takt(b, 0.6), lean: 0.05 + 0.08 * bord, pitch: 0.06 * bord + 0.04 * Math.cos(2 * PI * b), roll: 0.05 * Math.sin(PI * b / 2), side: 0.03 * Math.sin(PI * b / 2), yaw: n >= 6 ? 0.25 * (n === 6 ? 1 : -1) : 0 };
    },
    sjung: (b) => mod(b, 16) >= 12,
  },

  // Blåssektionen: saxofon, trumpet och trombon i luften. Riffet tillsammans, sedan ett
  // saxofonsolo medan de andra två gungar och tittar på, riffet igen och den sista tonen
  // med instrumenten mot taket. (roller)
  italoBlas: {
    len: 13,
    lage: (b, s, v) => {
      const solo = bump(b, 7.6, 8.2, 15.6, 16.2);
      const hog = sm(19.6, 20.4, b) * (1 - sm(23.2, 24, b));
      const L = blas(v.rol, b, s, hog, solo > 0.5);
      return v.rol === 0 || solo <= 0 ? L : mellan(L, vagga(b, s), solo);
    },
    kropp: (b, v) => {
      const solo = bump(b, 7.6, 8.2, 15.6, 16.2);
      const hog = sm(19.6, 20.4, b) * (1 - sm(23.2, 24, b));
      const r = riff(b) * (1 - solo) * (1 - hog);
      if (v.rol === 0) {
        const sv = Math.sin(PI * b / 2);
        return { lift: 1.5 * r, pitch: 0.06 * r - 0.2 * solo - 0.24 * hog + 0.04 * sv * solo, lean: -0.08 * solo - 0.05 * hog, roll: 0.1 * sv * solo + 0.04 * Math.sin(PI * b), side: 0.06 * sv * solo, knee: [0.2 * Math.sin(PI * b), -0.2 * Math.sin(PI * b)] };
      }
      return { ...takt(b, 0.6 * solo), lift: 1.5 * r + 2 * solo * Math.cos(PI * b) ** 2, pitch: 0.06 * r - 0.24 * hog, lean: -0.05 * hog, roll: 0.04 * Math.sin(PI * b), se: 'sangaren', seW: 0.6 * solo };
    },
    blund: (b, v) => (v.rol === 0 ? bump(b, 7.6, 8.2, 15.6, 16.2) > 0.5 || b > 20 : b > 20.5),
  },

  // Twisten på barstolen: stolen vrids hit och dit i varje slag och axlarna åt andra hållet,
  // ner mot bordet och upp igen, och till sist fingret i luften.
  italoTwist: {
    len: 12.8,
    lage: (b, s) => {
      const c = Math.sin(PI * b);
      const ner = bump(b, 7.4, 9, 13, 14.6);
      const tw = arm([0.3 + 0.2 * c * s, -0.12 - 0.1 * ner, 0.42 - 0.08 * c * s], [-0.35, 0.65, 0.4], [0.1, 0.3, -1], HAND.los, { pole: [1, -0.8, -0.1] });
      if (s < 0) return tw;
      return mellan(tw, arm([0.46, 0.72 + 0.03 * c, 0.24], [0.35 + 0.2 * c, 0.93, 0.1], [0.1, 0.1, -1], HAND.pek, { pole: [1, -0.6, -0.2] }), sm(15.6, 16.4, b));
    },
    kropp: (b) => {
      const c = Math.sin(PI * b);
      const ner = bump(b, 7.4, 9, 13, 14.6);
      const pek = sm(15.6, 16.4, b);
      return { twist: -0.24 * c, lean: 0.03 + 0.16 * ner - 0.05 * pek, lift: -2.5 * ner + 1.2 * Math.abs(c), pitch: 0.04 * Math.cos(2 * PI * b) - 0.06 * ner - 0.12 * pek, knee: [0.18 * c + 0.2 * ner, -0.18 * c + 0.2 * ner], side: 0.03 * c, yaw: 0.12 * c, roll: -0.06 * pek };
    },
    snurr: (b) => 16 * Math.sin(PI * b) * sm(-1.5, 0.5, b) * (1 - 0.4 * sm(15.6, 16.4, b)),
    sjung: (b) => mod(b, 8) > 6,
  },

  // Fingerpistolerna: mot den som tittar, en hand i taget i varje slag, sedan mot grannen,
  // röken blåses bort från pekfingret och pistolerna går ner i hölstret.
  italoPistol: {
    len: 12.8,
    lage: (b, s, v) => {
      const fram = pistolFram(rekyl(b, s > 0 ? 0 : 1));
      const mot = { mot: 1, vem: v.vem[(v.rol + 1) % 3], h: HAND.pistol, lyft: 4 * rekyl(b, 0), vrid: 1.3, pole: [1, -0.7, -0.2] };
      const blas_ = s > 0 ? arm([0.12, 0.3, 0.6], [0, 1, 0.15], [0.9, 0, -0.3], HAND.pistol, { mun: 0.9, pole: [1, -0.6, -0.3] }) : HOFT;
      return spar(b, [[0, fram], [8, mot], [16, blas_], [20, HOFT]], 0.6);
    },
    kropp: (b) => {
      const sk = Math.sin(PI * b * 2);
      const hol = sm(19.4, 20, b);
      const r = rekyl(b, 0) + rekyl(b, 1);
      return { ...takt(b, 0.5 * (1 - bump(b, 15.4, 16, 19.4, 20))), lean: -0.04 * r * (1 - sm(7.4, 8, b)), pitch: 0.08 * bump(b, 15.4, 16, 19.4, 20), twist: 0.22 * sk * hol, side: 0.04 * Math.sin(PI * b) * hol };
    },
    blund: (b) => bump(b, 16.2, 16.6, 19, 19.4) > 0.5,
    sjung: (b) => b > 20 && mod(b, 4) > 2.4,
  },

  // Klappen: händerna ihop framför pannan på 2 och 4, armarna i luften som vajar, och till
  // sist klapp i varje slag.
  italoKlapp: {
    len: 12.8,
    lage: (b, s) => {
      const k1 = bump(b, 7.4, 8.2, 15.4, 16.2);
      const k2 = sm(15.4, 16.2, b);
      return mellan(mellan(klappHog(upp(b)), vajar(b, s), k1), klappHog(upp(2 * b + 1)), k2);
    },
    kropp: (b) => {
      const sv = Math.sin(PI * b / 2);
      const k1 = bump(b, 7.4, 8.2, 15.4, 16.2);
      const k2 = sm(15.4, 16.2, b);
      return { ...takt(b, 0.45 + 0.4 * k2), roll: 0.08 * sv * (1 + k1), side: 0.05 * sv * (1 + k1), pitch: -0.1 * k1 + 0.03 * Math.cos(2 * PI * b), yaw: 0.1 * sv * k1 };
    },
    sjung: (b) => b > 8 && mod(b, 4) < 3.3,
  },

  // Balladen: det man håller i (flaskan, DT:s cigarett) högt i luften som en tändare på en
  // konsert, handen på hjärtat, ögonen stängda och munnen med i texten.
  italoBallad: {
    len: 13,
    lage: (b, s, v) => {
      const sv = Math.sin(PI * b / 4);
      if (!v.skal) return HJARTA;
      return { ...arm([0.38 + 0.12 * sv * s, 0.56, 0.3], [0.12 + 0.28 * sv * s, 1, 0.05], [-0.55, -0.75, -0.3], HAND.nave, { pole: [1, -0.6, -0.3] }), sak: 1 };
    },
    kropp: (b) => {
      const sv = Math.sin(PI * b / 4);
      return { roll: 0.13 * sv, side: 0.08 * sv, pitch: -0.13 + 0.03 * Math.sin(PI * b / 2), lean: -0.04, yaw: 0.1 * sv, breath: 0.04, knee: [0.08 * sv, 0.08 * sv] };
    },
    sjung: (b) => mod(b, 4) < 3.3,
    blund: (b) => mod(b, 16) < 12,
  },

  // Sprinklern: handen bakom huvudet och den andra armen som sprutar, ryck för ryck, och
  // sedan med den andra armen.
  italoSprinkler: {
    len: 12.8,
    lage: (b, s) => {
      const sida = mod(Math.floor((b + 0.5) / 8), 2) ? -1 : 1;
      const byt = bump(mod(b + 0.5, 8), 0, 0.5, 7.5, 8);
      const L = sida === s ? sprut(sprinkler(b)) : NACKE;
      return mellan(vagga(b, s), L, byt);
    },
    kropp: (b) => {
      const sida = mod(Math.floor((b + 0.5) / 8), 2) ? -1 : 1;
      const u = sprinkler(b);
      const byt = bump(mod(b + 0.5, 8), 0, 0.5, 7.5, 8);
      return { yaw: sida * (0.1 + 0.5 * u) * byt, twist: sida * 0.16 * u * byt, roll: -0.05 * sida * byt, pitch: -0.05 * byt, lift: 1.2 * Math.cos(PI * b) ** 2 };
    },
    sjung: (b) => mod(b, 8) > 6.2 && mod(b, 8) < 7.4,
  },
};
// Snurrar man redan fullt måste alla vara igång (radioNamn): inte som första dans.
DANSER.italoSnurr.igang = 1;
// När var och en snurrar (slag), och alla tre.
const SNURR = [4, 8, 12];
const SNURR_ALLA = 18;
function snurrNar(b, v) {
  const a = SNURR[v.rol];
  return Math.max(bump(b, a - 0.5, a + 0.2, a + 3.8, a + 4.5), bump(b, SNURR_ALLA - 0.5, SNURR_ALLA + 0.2, SNURR_ALLA + 3.8, SNURR_ALLA + 4.5));
}

// ---------- att komma igång, byta dans och sluta ----------
// Ingen dans börjar på en signal. Musiken går en stund, sedan kör en igång och de andra kommer
// efter, var och en på sitt sätt (INSTEG: nickar med, trummar på bordet, knäpper med fingrarna,
// gungar med flaskan – eller tittar på den som började och skakar på huvudet innan hen ger
// med sig). Mellan två danser fortsätter man en stund, gungar sedan i takt (vagga) och tittar
// på den som byter först innan man hänger på, i en ny ordning varje gång. Ingen är exakt i
// takt (sen) eller dansar lika stort (amp), och man slutar inte heller samtidigt.
//
// rum-3d.js ger v: rol, a, vem (rollernas figurer), i (figuren), fro (när radion sattes på),
// k (radions lucka, saknas när man provar en dans), per (slag per lucka), sang, skal (armen
// med flaskan eller DT:s cigarett), ting (armen har något att ställa ner), flaskan (figuren
// har en flaska), och forra / nasta ({ d, v }: dansen före och efter, utan vila emellan).

const norm = (x) => x - 360 * Math.round(x / 360);
const slutB = (d) => (d.len - DANS_IN) / DANS_SLAG;
const senOf = (v) => 0.02 + 0.1 * hash(v.fro * 0.77 + v.i * 3.9 + 0.3);
const ampOf = (v) => 0.86 + 0.28 * hash(v.fro * 0.41 + v.i * 5.3 + 1.7);
const pers = (v, n) => hash(v.fro * 1.37 + v.i * 7.13 + (v.k ?? 0) * 0.61 + n * 3.31);

// Var och ens sätt att gunga med en hel radiokväll.
const STILAR = ['nick', 'gung', 'axel'];
export const dansStil = (fro, i) => STILAR[Math.floor(hash(fro * 0.913 + i * 2.71 + 0.2) * STILAR.length)];
// Takten i kroppen (b i slag, w hur mycket): nickar, gungar från sida till sida eller studsar
// med axlarna. Också när man inte dansar, så länge radion spelar (rum-3d.js).
export function gung(b, stil, w = 1) {
  const c = Math.cos(PI * b);
  const sn = Math.sin(PI * b);
  if (stil === 'gung') return { roll: 0.075 * sn * w, side: 0.05 * sn * w, pitch: 0.03 * Math.cos(2 * PI * b) * w, knee: [0.1 * sn * w, 0.1 * sn * w] };
  if (stil === 'axel') return { lift: 2.2 * c * c * w, twist: 0.08 * sn * w, pitch: 0.035 * Math.cos(2 * PI * b) * w, knee: [0.14 * Math.max(0, sn) * w, 0.14 * Math.max(0, -sn) * w] };
  const n = (0.5 + 0.5 * Math.cos(2 * PI * b)) ** 2;
  return { pitch: (0.08 * n - 0.02) * w, lift: 1.1 * c * c * w, knee: [0.12 * Math.max(0, sn) * w, 0] };
}

const INSTEG = ['nick', 'trumma', 'knapp', 'flaska'];
function insteg(v) {
  if (v.k == null || v.k > 0) return 'nick';
  if (v.rol === 2 && pers(v, 4) < 0.4) return 'tittar';
  const s = INSTEG[Math.floor(pers(v, 5) * INSTEG.length)];
  return s === 'flaska' && !v.flaskan ? 'knapp' : s;
}
// När man hänger på (slag in i dansen): när radion just har satts på dröjer det, efter en sång
// går det fortare. Den som provar en dans (utan k) börjar genast.
function inSlag(v) {
  if (v.k == null) return 0;
  const h = pers(v, 1);
  if (v.k === 0) return [0.5 + 1.5 * h, 4 + 4 * h, 8.5 + 5 * h][v.rol] + (insteg(v) === 'tittar' ? 3 : 0);
  return [0, 0.5 + 1.5 * h, 1.5 + 2.5 * h][v.rol];
}
const utSlag = (d, v) => slutB(d) - (v.k == null ? 0 : 1.6 * pers(v, 2));
// Ordningen i bytet vid sömmen kD (radions lucka för den nya dansen).
const bytOrdning = (v, kD) => [0, 1, 2].map((i) => [hash(v.fro * 0.53 + kD * 1.91 + i * 0.37), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
function bytSlag(v, kD) {
  const o = bytOrdning(v, kD).indexOf(v.i);
  return o <= 0 ? 0 : o === 1 ? 1 + hash(v.fro + kD * 2.3 + v.i) : 2.2 + 1.3 * hash(v.fro * 1.1 + kD * 0.7 + v.i);
}

// Från ställningen A till B (k 0–1). Den som har flaskan i handen i den ena och inte i den
// andra ställer ner den på bordet på vägen (eller tar upp den).
const BANK = { bank: 1, h: HAND.nave };
function byt(A, B, k, v) {
  if (k <= 0) return A;
  if (k >= 1) return B;
  const sa = Boolean(A.sak);
  const sb = Boolean(B.sak);
  if (sa === sb || !v.ting) return { ...mellan(A, B, k), sak: sa && sb };
  return k < 0.5 ? { ...mellan(A, BANK, sm(0, 0.5, k)), sak: sa } : { ...mellan(BANK, B, sm(0.5, 1, k)), sak: sb };
}
export function blandaKropp(a, c, k) {
  if (k <= 0) return a;
  if (k >= 1) return c;
  const ut = {};
  for (const x of new Set([...Object.keys(a), ...Object.keys(c)])) {
    if (x === 'knee') ut.knee = [0, 1].map((i) => (a.knee ? a.knee[i] : 0) * (1 - k) + (c.knee ? c.knee[i] : 0) * k);
    else if (x === 'se') {
      const ka = a.se != null ? (a.seW ?? 1) * (1 - k) : 0;
      const kc = c.se != null ? (c.seW ?? 1) * k : 0;
      ut.se = kc > ka ? c.se : a.se;
      ut.seW = ka + kc;
    } else if (x !== 'seW') ut[x] = (a[x] || 0) * (1 - k) + (c[x] || 0) * k;
  }
  return ut;
}
function skala(b, amp) {
  if (amp === 1) return b;
  const ut = {};
  for (const x of Object.keys(b)) ut[x] = x === 'knee' ? b.knee.map((q) => q * amp) : x === 'se' || x === 'seW' ? b[x] : b[x] * amp;
  return ut;
}

// Före dansen: armen (null: vilar) och kroppen, på vart och ett av sätten.
function forLage(satt, b, s, v) {
  if (satt === 'trumma' && !v.skal) return { bord: [14, 8, 6 * Math.sin(PI * mod(b, 1)) ** 2], h: HAND.oppen };
  if ((satt === 'knapp' || (satt === 'flaska' && !v.flaskan)) && !v.skal) {
    const kn = bump(mod(b, 2), 0.85, 1, 1.1, 1.4);
    return arm([0.55, 0.14 - 0.04 * kn, 0.4], [0.15, 1, 0.25], [0.15, -0.1, -1], HAND.knapp, { pole: [1, -0.8, -0.2] });
  }
  if (satt === 'flaska' && v.flaskan && v.skal) {
    const sv = Math.sin(PI * b / 2);
    return { ...arm([0.3 + 0.06 * sv * s, 0.02 + 0.03 * Math.cos(PI * b) ** 2, 0.48], [0.1 + 0.2 * sv * s, 1, 0.15], [-0.55, -0.75, -0.3], HAND.nave, { pole: [1, -0.6, -0.3] }), sak: 1 };
  }
  return null;
}
function forKropp(satt, b, v, stil) {
  if (satt === 'tittar') {
    const inn = inSlag(v);
    return { ...gung(b, stil, 0.5), se: 'sangaren', seW: 0.75 * bump(b, -1.5, -0.5, inn - 3, inn - 1.5), yaw: 0.12 * Math.sin(PI * b * 3) * bump(b, inn - 6, inn - 5.5, inn - 4.2, inn - 3.6), pitch: 0.02 };
  }
  if (satt === 'trumma') return { ...gung(b, stil, 0.9), lean: 0.06 };
  if (satt === 'knapp' || satt === 'flaska') return gung(b, 'gung', 1.2);
  return gung(b, stil, 1.3);
}

// Övergången från P till D (bD: slag i D:s tid, kD: D:s lucka): hur långt man har kommit.
function overK(P, bD, v, kD) {
  const lag = bytSlag(v, kD);
  const pe = slutB(P) - v.per;
  return { k1: sm(pe - 1 + lag, pe + lag, bD), k2: sm(lag - 1, lag, bD), lag };
}
const OVER_D = 3.6;
// Var man är just nu: { over: [P, vP, D, vD, bD, kD] } eller den egna dansen.
function fas(d, b, v) {
  if (v.forra && b < OVER_D) return [v.forra.d, v.forra.v, d, v, b, v.k];
  if (v.nasta && b >= slutB(d) - 1) return [d, v, v.nasta.d, v.nasta.v, b - v.per, v.k + 1];
  return null;
}
// Hur mycket man är med i den egna dansen (0–1): i början och i slutet.
function med(d, b, v) {
  const ut = v.nasta ? 1 : 1 - sm(utSlag(d, v) - 2, utSlag(d, v), b);
  const inn = v.forra ? 1 : sm(inSlag(v) - 2, inSlag(v), b);
  return { inn, ut };
}

// Armen i dansen d vid slag b (för rum-3d.js): ställningen, med upp (0–1: hur mycket armen är
// med; först ner med det som är i handen) och sak (det som är i handen blir kvar där).
export function dansLage(d, b, s, v) {
  const sen = senOf(v);
  const f = fas(d, b, v);
  if (f) {
    const [P, vP, D, vD, bD, kD] = f;
    const { k1, k2 } = overK(P, bD, v, kD);
    const L = k1 < 1 ? byt(P.lage(bD + v.per - sen, s, vP), vagga(bD - sen, s), k1, v) : byt(vagga(bD - sen, s), D.lage(bD - sen, s, vD), k2, v);
    return { ...L, upp: 1 };
  }
  const { inn, ut } = med(d, b, v);
  const L = d.lage(b - sen, s, v);
  if (inn >= 1) return { ...L, upp: ut };
  const W = forLage(insteg(v), b - sen, s, v);
  if (!W) return { ...L, upp: inn * ut };
  const wu = sm(-2, -0.7, b);
  return { ...byt(W, L, inn, v), upp: (wu + (1 - wu) * inn) * ut };
}
// Kroppen (lean, pitch …) med allt det där inräknat.
export function dansKropp(d, b, v) {
  const sen = senOf(v);
  const amp = ampOf(v);
  const stil = dansStil(v.fro, v.i);
  const f = fas(d, b, v);
  if (f) {
    const [P, vP, D, vD, bD, kD] = f;
    const { k1, k2, lag } = overK(P, bD, v, kD);
    const mitt = { ...gung(bD - sen, stil, 1.2) };
    // (de som byter senare tittar på den som bytte först)
    if (lag > 0) { mitt.se = bytOrdning(v, kD)[0]; mitt.seW = 0.5 * bump(bD, lag - 4, lag - 3, lag - 1, lag); }
    return k1 < 1 ? blandaKropp(skala(P.kropp(bD + v.per - sen, vP), amp), mitt, k1) : blandaKropp(mitt, skala(D.kropp(bD - sen, vD), amp), k2);
  }
  const { inn, ut } = med(d, b, v);
  const r = inn * ut;
  const egen = r > 0 ? skala(d.kropp(b - sen, v), amp) : null;
  if (r >= 1) return egen;
  const fore = forKropp(inn < 1 ? insteg(v) : 'nick', b - sen, v, stil);
  return egen ? blandaKropp(fore, egen, r) : fore;
}
// Munnen öppen (0–1) och ögonen stängda.
export function dansSjung(d, b, v) {
  const sen = senOf(v);
  const f = fas(d, b, v);
  if (f) {
    const [P, vP, D, vD, bD, kD] = f;
    const { k1, k2 } = overK(P, bD, v, kD);
    if (k1 < 0.5) return P.sjung && P.sjung(bD + v.per - sen, vP) ? 1 : 0;
    return k2 > 0.5 && D.sjung && D.sjung(bD - sen, vD) ? 1 : 0;
  }
  const { inn, ut } = med(d, b, v);
  if (inn < 0.5) return insteg(v) === 'flaska' && mod(b, 8) > 5 ? 1 : 0;
  return d.sjung && d.sjung(b - sen, v) ? sm(0.5, 0.8, inn * ut) : 0;
}
export function dansBlund(d, b, v) {
  const sen = senOf(v);
  const f = fas(d, b, v);
  if (f) {
    const [P, vP, D, vD, bD, kD] = f;
    const { k1, k2 } = overK(P, bD, v, kD);
    if (k1 < 0.5) return Boolean(P.blund && P.blund(bD + v.per - sen, vP));
    return k2 > 0.5 && Boolean(D.blund && D.blund(bD - sen, vD));
  }
  const { inn, ut } = med(d, b, v);
  if (inn < 0.5) return insteg(v) === 'nick' && dansStil(v.fro, v.i) === 'nick' && mod(b, 8) > 2 && mod(b, 8) < 6;
  return inn * ut > 0.5 && Boolean(d.blund && d.blund(b - sen, v));
}
// Varvet på barstolen (grader).
export function dansVarv(d, b, v) {
  const sen = senOf(v);
  const f = fas(d, b, v);
  if (f) {
    const [P, vP, D, vD, bD, kD] = f;
    const { k1, k2 } = overK(P, bD, v, kD);
    return (P.snurr ? norm(P.snurr(bD + v.per - sen, vP)) * (1 - k1) : 0) + (D.snurr ? norm(D.snurr(bD - sen, vD)) * k2 : 0);
  }
  if (!d.snurr) return 0;
  const { inn, ut } = med(d, b, v);
  return norm(d.snurr(b - sen, v)) * inn * ut;
}
