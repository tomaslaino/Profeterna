// Hasse Backe i tobaksaffären (rum-hasse.js), i three.js: han sitter vid pultens hörn, vänd mot en, med
// underarmarna på pulten, kaffet och notan vid den vänstra handen i hörnet och cigarren i askkoppen vid den
// högra. Kameran står framför honom, lite högre, och pulten går fram förbi dess högra sida (rum-hasse-scen.js).
// Kostymfotot (C More Entertainment, CC BY 3.0, Wikimedia Commons) ligger på en formad yta, så att huvudet vrids på riktigt runt nacken och kroppen lutar sig
// fram. Ögon, bryn och mun rör sig i skuggaren. Armarna, händerna, koppen, askkoppen, cigarren, röken och
// läsglasögonen finns i rum-hasse-arm.js.
//
// Disken är pulten vid hörnet, geometri i hans värld, och ritas en gång på en egen duk under figuren
// (diskBild): pultens trä som speglar väggen bakom honom svagt (bilden från scripts/hasse/bak.html), lister
// i aluminium som pultens, och notan. Det som är under disken eller skyms av den döljs i skuggarna
// (BORD_GLSL), så att kroppen slutar vid diskens bakre kant och det som ligger på disken trycks mot den.
// Skuggorna på disken är räknade kapslar, utan skuggkarta.
//
// Världen: 1 enhet = 1 bildpunkt i fotot, x = fotots x − 660, y = 900 − fotots y, z mot betraktaren.
//
// figuren(duk, { hog, latt, pr }) → { kamera(v), diskBild(duk2d, v, bak), rita(T, n, tal, mun), handelser(T0, T1), info(), borta() }
// Klipp: T 0–12,4 (vila, skrattet, domen, gesterna, hem), och sedan ett klipp i taget på var sin bit av
// tidslinjen (KLIPP): fler sätt att slå domen i disken, kaffet (sex sätt), cigarren, småsakerna medan han
// väntar, händerna medan han pratar (talet) och tidningen när det har gått dåligt för honom (lasa, papperet i
// rum-hasse-tidning.js), med glasögonen på, och de andra sysslorna då (raknar, tomKopp, slocknad, putsa, vissla,
// naglar), där han blir ertappad och låtsas som ingenting.
import * as THREE from 'three';
import { ATLAS, LJUS, ARM, HAND, KAMERA, BORD_GLSL, CIGARR, ASKKOPP, DAG, LYS, VILOHOJD, VILAN, paDisken, inat, laddaFoto, laddaHand, byggArm, byggKopp, byggCigarr, byggAskkopp, byggRok, byggPenna, byggSkugga, byggGlasogon, GLAS, PENNA } from './rum-hasse-arm.js';
import { SCEN, BAK, kamera as scenKamera, iKamera, disken, franBaren, franPulten } from './rum-hasse-scen.js';
import { PULT_GLSL, SKIVA, ringar, NRING } from './rum-pult.js';
import { byggTidning, ytan } from './rum-hasse-tidning.js';
import { byggStall, byggSticka, byggBranda, byggTandare, byggLaga, brandLage, STALL, STICKA, TANDARE, BRANDA } from './rum-hasse-eld.js';
export { dagens } from './rum-hasse-tidning.js';

const DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const spar = (k, t) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ss(k[i - 1][0], k[i][0], t);
  return k[k.length - 1][1];
};

// Tiderna när han skriver på din kupong (s, i klippets tid): armen till pennan och greppet, pennan till
// första rutan, kryssen med en stund emellan och vägen tillbaka.
const SKRIV = { MOT: 0.85, LYFT: 0.6, NED: 0.09, DRAG: 0.17, UPP: 0.06, OVER: 0.14, NED2: 0.05, DRAG2: 0.2, EFTER: 0.14, MELLAN: 0.2, HALL: 0.65, TILLBAKA: 0.7, HEM: 1 };
SKRIV.KRYSS = SKRIV.NED + SKRIV.DRAG + SKRIV.UPP + SKRIV.OVER + SKRIV.NED2 + SKRIV.DRAG2 + SKRIV.EFTER;
function skrivSlut(n) { return SKRIV.MOT + SKRIV.LYFT + n * SKRIV.KRYSS + (n - 1) * SKRIV.MELLAN; }
function skrivTid(n) { return skrivSlut(n) + SKRIV.HALL + SKRIV.TILLBAKA + SKRIV.HEM; }

// ---------- tidningen ----------
// När det har gått dåligt för honom i tippningen gömmer han sig bakom tidningen (rum-hasse.js väljer när,
// rum-hasse-tidning.js är papperet): han sätter på sig glasögonen, tar upp den bakom disken, slår upp den och läser, och
// emellanåt tittar han upp över den på en, skyldig men nöjd med sig själv, och gömmer sig igen. Klippen byggs av
// bitar (LASBIT) som alla börjar och slutar i samma läsande läge (LAS för huvudet, LAS_T för tidningen),
// utom pa och upp före och ned och av efter. Då kan han hoppa från gränsen mellan två bitar (slag) direkt till ned
// (och av) när något annat väntar, utan att något rycker.
// Huvudet och ansiktet som i de andra klippen (skillnad mot vilan); tidningen: ryggens nedre ände (x, y, z),
// lutningen mot honom (tilt, negativ: överkanten bort från honom), vridningen (yaw, roll), halvornas vinkel mot
// planet (beta), hur mjukt den faller bakåt (buk), vågen (vag), händerna från vilan till kanterna (mot) och greppets
// höjd (gy).
// Han håller den lågt framför sig, strax över disken och lite åt sin högra sida, uppslagen och halvt hopvikt, och
// lutad framåt så att sidorna vänds upp mot hans ögon, som när man läser något i knät: det är han man ska se, inte
// tidningen, och kameran, som står högre än han, ser den snett uppifrån, så att sidorna inte går att läsa (Tomas
// önskemål 2026-11-09 och 2026-11-10). Lutad bakåt, mot honom, vändes förstasidan rakt mot kameran, och kanterna,
// som viks mot honom, sjönk ned i disken. I läget LAS tittar han ned i den, med huvudet lite vridet
// och böjt mot den och blicken ned åt den (blickX åt hans högra sida, blickY nedåt), brynen lite nere (då ler han
// mindre: NOJD i rita) och axlarna uppe. Bitarna utgår från LAS (L) och LAS_T, så att han läser där tidningen är och
// inte tittar in i kameran; där han ser på en är blicken satt för sig (EN_X med huvudet kvar mot tidningen).
const LAS = { pitch: 1.25, yaw: -0.3, lut: 0.03, axV: 10, axH: 10, brynX: -0.12, brynY: -0.08, blund: 0.66, blickY: 11, blickX: -3, kis: 0.06 };
const L = (x, d = 0) => LAS[x] + d;
// blicken längs raderna: d åt vänster (−) eller höger (+) om mitten av spalten
const rad = (d) => L('blickX', 0.6 * d);
// ögonen på en medan huvudet är kvar vridet mot tidningen (glimt), och med huvudet halvvägs mot en (over)
const EN_X = 2;
const OVER_X = 0.5;
// (ryggens nedre ände en bit över disken, lite åt hans högra sida; framåtlutad står kanterna, som halvorna viks mot
// honom med (beta), högre än ryggen, och händerna håller en bit ned på dem (gy))
const LX = -70;
const LY = -235;
const LZ = 540;
const LAS_T = { x: LX, y: LY, z: LZ, tilt: -0.8, yaw: -0.15, roll: 0, beta: 0.55, buk: -0.06, vag: 0, mot: 1, gy: 0.25 };
// I knät bakom disken, uppslagen och stående mellan honom och diskens kant, med överkanten under det man
// ser: där tar han den och dit lägger han den. Han håller den en bit ned (gy), med armarna nästan raka: högt upp,
// strax under diskens kant, stod armbågarna ut som vingar i axelhöjd.
// (på väg upp ur knät och ned i det: ryggens nedre ände strax över diskens kant medan den passerar den, annars går
// tidningen genom disken)
const UPP_Y = SCEN.DISK.Y + 12;
const KNA_T = { x: 0, y: -985, z: 140, tilt: 0, yaw: 0, roll: 0, beta: 0.3, buk: 0, vag: 0, mot: 0, gy: 0.38 };
// Med glasögonen i höger hand håller han tidningen med den vänstra (t0–t1 i biten): den lutar ned åt den högra
// sidan som ingen håller, glider åt den vänstra handen, sjunker lite och faller framåt (ned, mer när han ska synas
// bakom den; den sjönk förut så mycket att den gick ned i disken).
function enHand(t0, t1, ned = 12) {
  const k = (v0, v) => [[t0, v0], [t0 + 0.45, v], [t1 - 0.45, v], [t1, v0]];
  return { roll: k(0, 0.06), x: k(LX, LX + 24), y: k(LY, LY - 0.15 * ned), tilt: k(LAS_T.tilt, LAS_T.tilt - 0.0015 * ned), beta: k(LAS_T.beta, LAS_T.beta + 0.08), buk: k(LAS_T.buk, 0.1) };
}
// Glasögonen (läget gk i figurens GLASLAGE, och när det ändras: [tid, läge, båge uppåt]): de bitar som inte säger
// något har dem på näsan. Höger hand håller dem när motA är 1: med tummen och pekfingret om bågens högra hörn (framifrån,
// eller från sidan bakom tidningen: sido 1), eller med pekfingret på bryggan (finger 1, peka). fall: skalmarna (1
// utfällda), krok: fingrarna.
const LASBIT = {
  // Glasögonen ur bröstfickan med höger hand, upp framför ansiktet där skalmarna fälls ut med en knyck, och på. Han
  // tittar ned efter dem och på dem, blinkar när de kommer på och rynkar näsan tills de sitter. Tidningen är kvar i knät.
  pa: {
    dur: 5.6, fran: null, till: null,
    k: {
      pitch: [[0.2, 0], [0.8, 1.1], [1.5, 1.0], [2.2, 0.35], [3.4, 0.3], [4.1, 0.05], [4.8, -0.12], [5.6, 0]],
      blickY: [[0.2, 0], [0.7, 7], [1.6, 7], [2.2, 4], [3.5, 4], [4.0, 0]], blickX: [[0.2, 0], [0.7, 2.5], [1.6, 2.5], [2.2, -1], [3.5, -1], [4.0, 0]],
      blund: [[4.1, 0], [4.35, 0.6], [4.6, 0.6], [4.8, 0]], kis: [[4.7, 0], [4.95, 0.35], [5.3, 0]],
      brynX: [[3.9, 0], [4.4, 0.5], [5.0, 0.45], [5.6, 0]], brynY: [[3.9, 0], [4.4, 0.5], [5.0, 0.45], [5.6, 0]],
    },
    t: { tf: KNA_T, tt: KNA_T },
    g: {
      fran: { fall: 0 }, gk: [[0, 'ficka'], [0.95, 'ficka'], [1.55, 'ute'], [2.4, 'oppna', 40], [3.5, 'oppna'], [4.2, 'fore'], [4.85, 'pa']],
      fall: [[2.6, 0], [3.1, 1]], motA: [[0.1, 0], [0.95, 1], [4.9, 1], [5.5, 0]], krok: [[0.7, 0.2], [0.95, 0.62], [4.85, 0.62], [5.15, 0.25]],
    },
  },
  // Av: tar dem i bågens hörn och drar av dem framåt, fäller ihop skalmarna framför bröstet och stoppar dem i fickan.
  av: {
    dur: 4.6, fran: null, till: null,
    k: {
      blund: [[0.6, 0], [0.85, 0.55], [1.05, 0]], brynX: [[0.5, 0], [0.9, 0.45], [1.8, 0.3], [2.4, 0]], brynY: [[0.5, 0], [0.9, 0.45], [1.8, 0.3], [2.4, 0]],
      pitch: [[1.8, 0], [2.4, 0.4], [3.0, 1.05], [3.8, 1.0], [4.5, 0]], blickY: [[1.8, 0], [2.3, 4], [3.0, 7], [3.8, 7], [4.3, 0]], blickX: [[2.6, 0], [3.0, 2.5], [3.8, 2.5], [4.3, 0]],
    },
    t: { tf: KNA_T, tt: KNA_T },
    g: {
      till: { fall: 0 }, gk: [[0, 'pa'], [0.75, 'pa'], [1.35, 'fore'], [2.0, 'oppna'], [2.7, 'oppna'], [3.35, 'ute', 30], [3.85, 'ficka']],
      fall: [[2.05, 1], [2.6, 0]], motA: [[0.05, 0], [0.7, 1], [3.9, 1], [4.5, 0]], krok: [[0.45, 0.2], [0.7, 0.62], [3.85, 0.62], [4.1, 0.25]],
    },
  },
  // De har glidit ned lite: han skjuter upp dem med pekfingret på bryggan, med hakan upp och en grimas.
  skjut: {
    dur: 2.6,
    k: { pitch: [[0.9, L('pitch', 0.05)], [1.15, L('pitch', -0.14)], [1.7, L('pitch', 0.05)]], kis: [[0.85, 0.06], [1.05, 0.32], [1.45, 0.06]], brynX: [[0.9, -0.12], [1.1, 0.2], [1.7, -0.12]], brynY: [[0.9, -0.08], [1.1, 0.25], [1.7, -0.08]] },
    t: enHand(0.15, 2.45, 35),
    g: { gk: [[0, 'pa'], [0.75, 'glid'], [1.0, 'glid'], [1.25, 'pa']], motA: [[0.15, 0], [0.8, 1], [1.4, 1], [2.2, 0]], peka: [[0.3, 0], [0.75, 1], [1.5, 1], [1.9, 0]], finger: [[0, 1], [2.45, 1]] },
  },
  // Över glasögonen: drar ned dem på näsan med pekfingret, tittar på en över dem med höjda bryn (jaså?) och skjuter
  // upp dem igen. Handen är tillbaka på tidningen medan han tittar, och tidningen sjunker lite.
  over: {
    dur: 5.6,
    k: {
      pitch: [[0.8, L('pitch', 0.05)], [1.3, L('pitch', 0.2)], [3.7, L('pitch', 0.2)], [4.3, L('pitch', 0.05)]], yaw: [[0.8, L('yaw')], [1.3, -0.1], [3.7, -0.1], [4.3, L('yaw')]],
      blickY: [[1.2, L('blickY')], [1.45, -2.5], [3.6, -2.5], [3.85, L('blickY')]], blund: [[1.2, L('blund')], [1.4, 0.02], [3.6, 0.02], [3.8, L('blund')]],
      blickX: [[1.2, L('blickX')], [1.45, OVER_X], [3.6, OVER_X], [3.85, L('blickX')]], brynX: [[1.3, -0.3], [1.6, 0.85], [3.5, 0.8], [4.0, -0.12]], brynY: [[1.3, -0.25], [1.6, 1.0], [3.5, 0.95], [4.0, -0.08]],
      le: [[1.9, 0], [2.5, 0.35], [3.4, 0.3], [3.9, 0]],
    },
    t: enHand(0.2, 5.4, 60),
    g: {
      gk: [[0, 'pa'], [0.9, 'pa'], [1.25, 'nasa'], [3.95, 'nasa'], [4.25, 'pa']], finger: [[0, 1], [5.4, 1]],
      motA: [[0.2, 0], [0.85, 1], [1.3, 1], [1.95, 0], [3.25, 0], [3.9, 1], [4.3, 1], [4.95, 0]], peka: [[0.4, 0], [0.8, 1], [1.4, 1], [1.8, 0], [3.4, 0], [3.8, 1], [4.4, 1], [4.8, 0]],
    },
  },
  // Tar av dem och tittar på en med ett menande leende, pekar på en med dem, för skalmen till läpparna och tänker
  // efter en stund med blicken uppåt, nickar och sätter på dem igen. Tidningen sänks så att man ser.
  lyft: {
    dur: 8.4,
    k: {
      pitch: [[0.6, L('pitch')], [1.4, 0.05], [3.3, 0.05], [3.9, 0.15], [5.4, 0.15], [5.65, 0.32], [5.9, 0.12], [6.2, 0.3], [6.8, L('pitch')]],
      blickY: [[0.6, L('blickY')], [1.3, 0], [3.3, 0], [3.8, -3], [5.2, -3], [5.7, 2], [6.6, L('blickY')]],
      blickX: [[0.6, L('blickX')], [1.3, 0], [3.6, 0], [3.9, -3], [5.2, -3], [5.5, 0], [6.0, 0], [6.6, L('blickX')]],
      blund: [[0.6, L('blund')], [1.2, 0.05], [3.3, 0.05], [3.8, 0.2], [5.3, 0.2], [6.5, L('blund')]],
      brynX: [[0.8, -0.12], [1.5, 0.7], [3.2, 0.6], [3.8, 0.35], [5.3, 0.3], [6.6, -0.12]], brynY: [[0.8, -0.08], [1.5, 0.45], [3.2, 0.4], [3.8, 0.75], [5.3, 0.7], [6.6, -0.08]],
      le: [[1.4, 0], [2.0, 0.55], [3.2, 0.45], [3.8, 0.1], [5.3, 0.1], [5.8, 0.4], [6.4, 0]],
      rund: [[3.9, 0], [4.2, 0.35], [5.1, 0.35], [5.3, 0]], munn: [[3.9, 0], [4.2, 0.06], [5.1, 0.06], [5.3, 0]],
      yaw: [[0.6, L('yaw')], [1.4, -0.1], [3.6, -0.1], [4.1, 0.2], [5.2, 0.2], [5.8, -0.1], [6.0, -0.1], [6.8, L('yaw')]],
    },
    t: enHand(0.15, 8.2, 110),
    g: {
      gk: [[0, 'pa'], [0.8, 'pa'], [1.35, 'fore'], [2.0, 'hall'], [2.45, 'visa'], [2.85, 'hall'], [3.3, 'hall'], [3.95, 'tanka'], [5.2, 'tanka'], [5.8, 'hall'], [6.7, 'fore'], [7.2, 'pa']],
      motA: [[0.1, 0], [0.75, 1], [7.25, 1], [7.85, 0]], krok: [[0.45, 0.2], [0.75, 0.62], [7.2, 0.62], [7.5, 0.25]], sido: [[0, 1], [8.2, 1]],
    },
  },
  // Ned bakom disken efter den, upp med den ur knät och fram över disken medan den stiger, och ett ryck så att den
  // står rak. Han håller den lågt (gy) tills den är framme och flyttar sedan upp händerna: håller han den högt medan
  // den är nära honom måste armarna vikas så att armbågarna står ut som vingar i axelhöjd.
  upp: {
    dur: 2.7, fran: null, till: LAS,
    k: {
      pitch: [[0.15, 0.1], [0.55, 0.62], [1.4, 0.58], [2.1, L('pitch')]], yaw: [[0.5, -0.04], [1.4, -0.04], [2.1, L('yaw')]], blickY: [[0.15, 0], [0.4, 7], [2.1, L('blickY')]],
      blickX: [[1.3, 0], [1.9, L('blickX')]], blund: [[0.2, 0], [0.45, 0.45], [2.1, L('blund')]], lut: [[0.5, 0.07], [1.5, 0.04]], axV: [[0.5, -6], [1.6, 12]], axH: [[0.5, -6], [1.6, 12]],
      brynX: [[1.3, 0], [2.2, -0.3]], brynY: [[1.3, 0], [2.2, -0.25]],
    },
    // (rakt upp bakom diskens kant tills ryggen är över den (UPP_Y), redan lite framåtlutad så att den skymmer mindre av
    // honom, och sedan fram över disken medan den lutas mot honom och vrids lite åt hans högra sida)
    t: {
      tf: KNA_T, mot: [[0.12, 0], [0.8, 1]], gy: [[0.8, 0.38], [1.15, 0.12], [1.85, 0.12], [2.3, LAS_T.gy]], y: [[0.8, -985], [1.3, -560], [1.65, UPP_Y], [2.2, LY]], z: [[1.3, 140], [1.65, 170], [2.2, LZ]],
      x: [[1.35, 0], [2.25, LX]], yaw: [[1.35, 0], [2.25, LAS_T.yaw]], tilt: [[1.3, 0], [1.65, -0.35], [2.3, LAS_T.tilt]],
      beta: [[0.9, 0.3], [1.5, 0.25], [1.9, 0.3], [2.3, LAS_T.beta + 0.02]], vag: [[2.3, 0], [2.4, 12], [2.68, 0]],
    },
  },
  // läser: blicken går rad för rad, huvudet sjunker lite längs spalten
  las: {
    dur: 4.4,
    k: {
      blickX: [[0.3, rad(-3)], [0.7, rad(-1.2)], [1.1, rad(0.6)], [1.5, rad(2.6)], [1.62, rad(-3)], [2.0, rad(-1.2)], [2.4, rad(0.6)], [2.8, rad(2.6)], [2.92, rad(-3)], [3.3, rad(-1.2)], [3.7, rad(0.6)], [4.05, rad(2)]],
      pitch: [[0.3, L('pitch')], [1.6, L('pitch', 0.04)], [2.9, L('pitch', 0.08)], [4.0, L('pitch', 0.03)]], yaw: [[1.0, L('yaw', -0.04)], [3.0, L('yaw', 0.02)]], andas: [[3.3, 0], [3.7, -4], [4.2, 0]],
    },
    t: { y: [[2.0, LY + 4]], roll: [[2.0, 0.012]] },
  },
  // Ögonen upp på en över tidningen medan huvudet står kvar: ertappad. Brynen upp, och sedan ett leende som
  // växer och en liten nick (jajamän), och tillbaka till tidningen.
  glimt: {
    dur: 4.6,
    k: {
      blickY: [[0.5, L('blickY')], [0.62, -1.5], [1.6, -1.5], [1.75, L('blickY')]], blund: [[0.5, L('blund')], [0.6, 0.04], [1.6, 0.04], [1.75, L('blund')]],
      blickX: [[0.5, L('blickX')], [0.62, EN_X], [1.6, EN_X], [1.75, L('blickX')]],
      brynX: [[0.5, -0.3], [0.75, 0.55], [1.7, 0.5], [2.6, 0.15], [4.0, -0.3]], brynY: [[0.5, -0.25], [0.75, 0.75], [1.7, 0.7], [2.6, 0.2], [4.0, -0.25]],
      le: [[0.9, 0], [1.5, 0.78], [3.2, 0.62], [4.1, 0]], kis: [[1.3, 0.06], [1.7, 0.35], [3.2, 0.3], [4.0, 0.06]],
      pitch: [[0.5, L('pitch')], [0.7, L('pitch', -0.08)], [1.6, L('pitch', -0.08)], [1.9, L('pitch', 0.1)], [2.15, L('pitch', -0.04)], [2.4, L('pitch', 0.06)], [2.7, L('pitch')]], roll: [[0.7, 0.05], [1.8, 0.05], [2.6, 0]],
    },
    t: { y: [[0.5, LY], [0.7, LY - 14], [1.7, LY - 14], [2.0, LY]] },
  },
  // Han lyfter tidningen så att den gömmer ansiktet och kikar över kanten, åt ena hållet och åt det andra,
  // och sänker den igen.
  gom: {
    dur: 5.4,
    k: {
      pitch: [[0.3, L('pitch')], [1.0, 0.05], [4.0, 0.05], [4.7, L('pitch')]], yaw: [[0.3, L('yaw')], [1.0, -0.1], [4.0, -0.1], [4.7, L('yaw')]],
      blickY: [[0.3, L('blickY')], [0.9, 0], [1.4, -1], [2.5, -1], [2.65, 3], [3.0, 3], [3.15, -1], [4.0, -1], [4.6, L('blickY')]],
      blund: [[0.3, L('blund')], [0.9, 0.1], [4.0, 0.1], [4.6, L('blund')]], blickX: [[0.3, L('blickX')], [0.9, 0], [1.4, 0], [1.6, 2], [2.4, 2], [2.6, -2.5], [3.5, -2.5], [3.7, 0], [4.0, 0], [4.6, L('blickX')]],
      brynX: [[0.6, -0.3], [1.2, 0.65], [4.0, 0.6], [4.7, -0.3]], brynY: [[0.6, -0.25], [1.2, 0.85], [4.0, 0.8], [4.7, -0.25]], lut: [[0.8, -0.01], [4.2, -0.01]],
    },
    // (han för den upp framför ansiktet, hopvikt som ett V med ryggen mot en och överkanten lite framåt, så att båda
    // sidorna står snett och han kikar över vecket, och sedan ned igen; rak framför honom syntes förstasidan rakt
    // framifrån, och bara vriden vändes den ena halvan mot en)
    t: {
      y: [[0.3, LY], [1.0, LY + 209], [4.0, LY + 209], [4.7, LY]], z: [[0.3, LZ], [1.0, 620], [4.0, 620], [4.7, LZ]], tilt: [[0.3, LAS_T.tilt], [1.0, -0.3], [4.0, -0.3], [4.7, LAS_T.tilt]],
      x: [[0.3, LX], [1.0, -20], [4.0, -20], [4.7, LX]], yaw: [[0.3, LAS_T.yaw], [1.0, 0], [4.0, 0], [4.7, LAS_T.yaw]], beta: [[0.3, LAS_T.beta], [1.0, 1.0], [4.0, 1.0], [4.7, LAS_T.beta]],
    },
  },
  // läser, håller med det som står och nickar belåtet för sig själv
  nick: {
    dur: 3.9,
    k: {
      blickX: [[0.3, rad(-2.5)], [0.8, rad(0)], [1.2, rad(2)]], pitch: [[1.4, L('pitch')], [1.65, L('pitch', 0.16)], [1.9, L('pitch', 0.02)], [2.15, L('pitch', 0.14)], [2.4, L('pitch', 0.02)]],
      brynX: [[1.3, -0.3], [1.6, 0.3], [3.0, 0.25], [3.7, -0.3]], brynY: [[1.3, -0.25], [1.6, 0.35], [3.0, 0.3], [3.7, -0.25]], le: [[1.3, 0], [1.8, 0.55], [3.0, 0.45], [3.8, 0]],
    },
    t: {},
  },
  // rycker tidningen rak med ett knäpp, som om något i den kräver hans fulla uppmärksamhet
  ryck: {
    dur: 2.6,
    k: { brynX: [[0.3, -0.3], [0.5, -0.55], [1.4, -0.45], [2.2, -0.3]], brynY: [[0.3, -0.25], [0.5, -0.5], [1.4, -0.4], [2.2, -0.25]], pitch: [[0.3, L('pitch')], [0.55, L('pitch', -0.06)], [0.9, L('pitch', 0.05)]] },
    t: { beta: [[0.3, LAS_T.beta], [0.5, LAS_T.beta + 0.2], [0.68, LAS_T.beta - 0.1], [1.0, LAS_T.beta + 0.01]], y: [[0.3, LY], [0.5, LY - 16], [0.68, LY + 16], [1.0, LY]], vag: [[0.62, 0], [0.72, 14], [1.6, 0]] },
  },
  // tittar längs baren över tidningen, som om något där är mer intressant, och tillbaka
  titta: {
    dur: 4.2,
    k: {
      yaw: [[0.4, L('yaw')], [1.1, 0.8], [2.6, 0.8], [3.4, L('yaw')]], pitch: [[0.4, L('pitch')], [1.0, 0.14], [2.6, 0.14], [3.3, L('pitch')]],
      blickY: [[0.4, L('blickY')], [0.9, 0], [2.6, 0], [3.2, L('blickY')]], blund: [[0.4, L('blund')], [0.9, 0.08], [2.6, 0.08], [3.2, L('blund')]],
      blickX: [[0.45, L('blickX')], [0.9, 4], [2.6, 4], [3.1, L('blickX')]],
      brynX: [[0.9, -0.3], [1.3, 0.3], [2.5, 0.3], [3.2, -0.3]], brynY: [[0.9, -0.25], [1.3, 0.3], [2.5, 0.3], [3.2, -0.25]],
    },
    t: { yaw: [[0.8, LAS_T.yaw], [1.4, LAS_T.yaw - 0.06], [2.6, LAS_T.yaw - 0.06], [3.2, LAS_T.yaw]] },
  },
  // händerna ned längs kanterna, tillbaka över diskens kant och ned i knät på samma gång, och händerna tillbaka på
  // disken (lågt, som när han tar upp den)
  ned: {
    dur: 2.1, fran: LAS, till: null,
    k: {
      pitch: [[0.3, L('pitch')], [0.9, L('pitch')], [1.6, 0.12]], yaw: [[0.3, L('yaw')], [1.5, 0]], blickY: [[0.2, L('blickY')], [1.2, L('blickY')], [1.7, 0]], blickX: [[0.3, L('blickX')], [1.3, 0]],
      blund: [[1.2, L('blund')], [1.7, 0]], brynX: [[0.5, -0.2], [1.6, 0]], brynY: [[0.5, -0.15], [1.6, 0]], axV: [[0.7, 12], [1.6, 0]], axH: [[0.7, 12], [1.6, 0]],
    },
    // (först in framför honom, rak och över diskens kant, och sedan ned bakom den)
    t: {
      tt: KNA_T, gy: [[0.05, LAS_T.gy], [0.4, 0.12], [1.0, 0.12], [1.3, 0.38]], z: [[0.3, LZ], [0.8, 170], [1.0, 140]], y: [[0.3, LY], [0.8, UPP_Y], [1.35, -985]], x: [[0.05, LX], [0.7, 0]],
      yaw: [[0.05, LAS_T.yaw], [0.7, 0]], tilt: [[0.05, LAS_T.tilt], [0.8, -0.35], [1.15, 0]], beta: [[0.05, LAS_T.beta], [0.5, 0.3], [1.0, 0.3]], mot: [[1.3, 1], [1.95, 0]],
    },
  },
};
// Ett klipp ur bitarna: nycklarna i klippets tid, och gränserna mellan bitarna (slag) och var ned börjar.
function lasKlipp(bitar) {
  const k = {};
  const t = {};
  const slag = [];
  let at = 0;
  let ner = 0;
  const kanK = new Set(bitar.flatMap((b) => [...Object.keys(LASBIT[b].k), ...Object.keys(LAS)]));
  const kanT = Object.keys(LAS_T);
  // glasögonen: lägena, och kanalerna med sina värden där inget sägs
  const G_KAN = { fall: 1, motA: 0, peka: 0, krok: 0.55, finger: 0, sido: 0 };
  const g = { gk: [] };
  const lagg = (ut, x, v) => {
    const l = (ut.k = ut.k || []);
    if (l.length && Math.abs(l[l.length - 1][0] - x[0]) < 1e-6) l[l.length - 1][1] = v;
    else l.push([x[0], v]);
  };
  let forra = null;
  for (const namn of bitar) {
    const b = LASBIT[namn];
    if (namn === 'ned') ner = at;
    // (bara där han läser: inte före upp eller efter ned)
    else if (at > 0 && forra.till !== null && b.fran !== null) slag.push(at);
    forra = b;
    const bg = b.g || {};
    for (const [tt, l, h] of bg.gk || [[0, 'pa'], [b.dur, 'pa']]) {
      const x = [at + tt, l, h || 0];
      const sist = g.gk[g.gk.length - 1];
      if (sist && Math.abs(sist[0] - x[0]) < 1e-6) g.gk[g.gk.length - 1] = x;
      else g.gk.push(x);
    }
    for (const x of Object.keys(G_KAN)) {
      const ut = (g[x] = g[x] || { k: [] });
      lagg(ut, [at], bg.fran && x in bg.fran ? bg.fran[x] : G_KAN[x]);
      for (const [tt, v] of bg[x] || []) lagg(ut, [at + tt], v);
      lagg(ut, [at + b.dur], bg.till && x in bg.till ? bg.till[x] : G_KAN[x]);
    }
    for (const x of kanK) {
      const ut = (k[x] = k[x] || { k: [] });
      const a = b.fran === null ? 0 : (LAS[x] || 0);
      const e = b.till === null ? 0 : (LAS[x] || 0);
      lagg(ut, [at], a);
      for (const [tt, v] of b.k[x] || []) lagg(ut, [at + tt], v);
      lagg(ut, [at + b.dur], e);
    }
    for (const x of kanT) {
      const ut = (t[x] = t[x] || { k: [] });
      const a = (b.t.tf || LAS_T)[x];
      const e = (b.t.tt || LAS_T)[x];
      lagg(ut, [at], a);
      for (const [tt, v] of b.t[x] || []) lagg(ut, [at + tt], v);
      lagg(ut, [at + b.dur], e);
    }
    at += b.dur;
  }
  const ut = (o) => Object.fromEntries(Object.entries(o).map(([x, v]) => [x, v.k]));
  const { gk, ...gn } = g;
  return { dur: at, k: ut(k), t: ut(t), g: { gk, ...ut(gn) }, slag, ner };
}
// Två ordningar, så att det inte blir samma varje gång, och glasögonen på före och av efter.
export const LASA = {
  lasa: lasKlipp(['pa', 'upp', 'las', 'glimt', 'las', 'skjut', 'gom', 'nick', 'las', 'over', 'las', 'titta', 'las', 'ned', 'av']),
  lasa2: lasKlipp(['pa', 'upp', 'ryck', 'las', 'nick', 'lyft', 'las', 'glimt', 'las', 'gom', 'skjut', 'las', 'ned', 'av']),
};
// var läsandet börjar (med glasögonen på, efter upp): dit hoppar sidan när han redan läser när man kommer
export const LAS_START = LASBIT.pa.dur + LASBIT.upp.dur;

// Visslingen (klippet vissla, ljudet i rum-hasse-ljud.js): [tid, Hz, ms, Hz i slutet]. En egen liten slinga,
// lugn och oskyldig; den sista tonen glider ned och dör när han ser en, och sedan en glad fortsättning, lite
// för hög.
const LAT = [
  [0.9, 880, 330], [1.28, 1175, 300], [1.63, 1480, 560], [2.28, 1319, 240], [2.57, 1175, 240], [2.86, 988, 560],
  [3.52, 1175, 300], [3.88, 880, 300], [4.24, 988, 260], [4.56, 1109, 300, 1319], [4.88, 1319, 420, 620],
  [6.3, 1175, 200], [6.55, 1480, 200], [6.8, 1760, 460], [7.34, 1568, 200], [7.6, 1480, 200], [7.86, 1319, 200], [8.12, 1175, 560, 1109],
];
const VISSLA = LAT.map(([t, f, ms, f1], i) => [t, { typ: 'vissla', f, f1: f1 || f, ms, styrka: i < 10 ? 0.75 : i === 10 ? 0.55 : 0.95 }]);

// ---------- klippen ----------
// Rörelserna är klipp på en tidslinje (rum-hasse.js spelar dem): fran–till, och där han står efteråt
// (vila: 0 är vilan, 5,5 när han pratar). fri: får börja var som helst, skynda: läggs undan fortare
// när något annat väntar, grupp: sidan lottar bland klippen i gruppen (domen, kaffet, cigarren, småsakerna).
// dunk: [tid i klippet, styrka, sort] när handen slår i disken, dom: när domen slås i disken (det
// starkaste slaget), ned: [tid, styrka] när koppen ställs tillbaka på fatet.
export const KLIPP = {
  // armarna upp, skrattet och slaget
  slag: { fran: 2.5, till: 5.5, vila: 5.5, fri: true, grupp: 'dom', dunk: [[2.5, 1, 'hand']] },
  // fingret, handen som hackar, armen ut
  armar: { fran: 5.5, till: 9.95, vila: 5.5, grupp: 'tal' },
  // nöjd, ögonen igen, tillbaka
  hem: { fran: 9.95, till: 12.4, vila: 0 },
  // kaffet: en klunk, och sedan smackar han och säger mmm med huvudet som vaggar
  klunk: { fran: 20, till: 27, vila: 0, grupp: 'kaffe', ned: [[6.35, 0.32]] },
  // cigarren ur askkoppen, två bloss, röken ut och tillbaka
  cigarr: { fran: 30, till: 40, vila: 0, skynda: true, grupp: 'cigarr' },
  // tyst, knyter näven, håller den uppe och slår den i disken
  naven: { fran: 50, till: 53.8, vila: 5.5, fri: true, grupp: 'dom', dunk: [[1.72, 1.2, 'nave']] },
  // tre slag med handflatan, det sista hårdast: så – är – det
  treslag: { fran: 55, till: 59.6, vila: 5.5, fri: true, grupp: 'dom', dunk: [[0.62, 0.5, 'hand'], [1.14, 0.7, 'hand'], [1.98, 1.15, 'hand']] },
  // båda händerna upp och ned i disken samtidigt
  bada: { fran: 60, till: 64, vila: 5.5, fri: true, grupp: 'dom', dunk: [[1.22, 1.45, 'bada']] },
  // pekfingret i luften, och sedan handflatan i disken
  fingret: { fran: 65, till: 69.6, vila: 5.5, fri: true, grupp: 'dom', dunk: [[1.86, 1.05, 'hand']] },
  // medan han pratar: handflatan i disken vid ett bestämt ord
  dunka: { fran: 70, till: 71.9, vila: 5.5, start: 5.5, dunk: [[0.62, 0.75, 'hand']] },
  // kaffet: blåser på det, smakar, bränner sig nästan, och en riktig klunk och ett långt ah
  blasa: { fran: 75, till: 84.1, vila: 0, grupp: 'kaffe', ned: [[8.5, 0.3]] },
  // kaffet: tittar ned i koppen, snurrar den, dricker ur den i ett svep och ställer ned den med en smäll
  titta: { fran: 85, till: 94, vila: 0, grupp: 'kaffe', ned: [[7.55, 0.75]] },
  // cigarren: ett bloss, och röken i en tunn stråle ur mungipan medan han tittar på en
  bloss: { fran: 95, till: 103, vila: 0, skynda: true, grupp: 'cigarr' },
  // cigarren: ett bloss och tre rökringar, som han tittar efter
  ringar: { fran: 105, till: 116, vila: 0, skynda: true, grupp: 'cigarr' },
  // cigarren: knackar av askan över askkoppen, ett bloss och röken ut genom näsan
  aska: { fran: 120, till: 131, vila: 0, skynda: true, grupp: 'cigarr' },
  // kaffet: drar in doften under näsan så att bröstet häver sig, och en liten klunk
  dofta: { fran: 135, till: 144.2, vila: 0, grupp: 'kaffe', ned: [[8.55, 0.3]] },
  // kaffet: skålar med en, en stor klunk och koppen ned med en smäll
  skal: { fran: 150, till: 158.5, vila: 0, grupp: 'kaffe', ned: [[7.25, 0.8]] },
  // kaffet: lillfingret ut, näsan i vädret och två små läppjanden, som en vinprovare
  fint: { fran: 160, till: 168.8, vila: 0, grupp: 'kaffe', ned: [[8.1, 0.18]] },
  // Han njuter av cigarren (cigarrKlipp nedan), med cigarren ur askkoppen och tillbaka:
  // ett långt bloss med slutna ögon, lutar sig bakåt och blåser ut röken länge, ah, och tittar nöjt på den
  lang: { fran: 175, till: 189.8, vila: 0, skynda: true, grupp: 'cigarr' },
  // ett bloss, och sedan lutar han sig bakåt och blundar en lång stund med cigarren i handen
  luta: { fran: 192, till: 206.4, vila: 0, skynda: true, grupp: 'cigarr' },
  // biter om den i mungipan och släpper den, sitter nöjd och puffar med händerna på disken
  tand: { fran: 208, till: 224.4, vila: 0, skynda: true, grupp: 'cigarr' },
  // håller upp den, rullar den mellan fingrarna och beundrar den, nickar gillande och tar ett bloss
  beundra: { fran: 227, till: 240.0, vila: 0, skynda: true, grupp: 'cigarr' },
  // tre korta bloss, ett nöjt moln och ett litet skratt
  puffar: { fran: 242, till: 253.2, vila: 0, skynda: true, grupp: 'cigarr' },
  // ett bloss, och sedan visar han den mot en: det här, det är livet
  vifta: { fran: 255, till: 267.2, vila: 0, skynda: true, grupp: 'cigarr' },
  // ett bloss som han håller kvar i munnen och smakar på, och röken ut långsamt
  smaka: { fran: 270, till: 283.4, vila: 0, skynda: true, grupp: 'cigarr' },
  // Småsakerna medan han väntar på en (grupp smatt, lottas med fingrarna som trummar), några sekunder
  // var, med händerna på disken:
  // tittar bort mot gänget i affären, skakar lite på huvudet och ler
  affaren: { fran: 290, till: 295, vila: 0, skynda: true, grupp: 'smatt' },
  // tittar längs baren, och nickar åt någon där
  baren: { fran: 297, till: 301.3, vila: 0, skynda: true, grupp: 'smatt' },
  // tittar ned på notan, höjer brynen och skakar på huvudet
  notan: { fran: 303, till: 307.6, vila: 0, skynda: true, grupp: 'smatt' },
  // nickar för sig själv, nöjd med något han har tänkt
  nicka: { fran: 309, till: 312.6, vila: 0, skynda: true, grupp: 'smatt' },
  // en djup, belåten suck
  suck: { fran: 314, till: 318.6, vila: 0, skynda: true, grupp: 'smatt' },
  // sträcker på nacken åt båda hållen med slutna ögon
  nacken: { fran: 320, till: 324, vila: 0, skynda: true, grupp: 'smatt' },
  // höjer ett ögonbryn mot en och ler: visst är det så?
  brynet: { fran: 326, till: 329.6, vila: 0, skynda: true, grupp: 'smatt' },
  // skrockar åt något han kommer att tänka på
  skrocka: { fran: 331, till: 335.2, vila: 0, skynda: true, grupp: 'smatt' },
  // tittar på kaffet och smackar
  smacka: { fran: 337, till: 340.4, vila: 0, skynda: true, grupp: 'smatt' },
  // Medan han pratar, nöjd med det han säger (talet, lottas med armar):
  // handflatan upp mot en: där har du det
  oppna: { fran: 345, till: 348.4, vila: 5.5, start: 5.5, grupp: 'tal' },
  // båda handflatorna upp och axlarna upp: vad ska man säga
  axla: { fran: 350, till: 353.6, vila: 5.5, start: 5.5, grupp: 'tal' },
  // handflatorna nedåt över disken, två lugna tryck och isär: lugnt, lugnt
  lugnt: { fran: 355, till: 358.6, vila: 5.5, start: 5.5, grupp: 'tal' },
  // räknar på fingrarna: ett, två
  tva: { fran: 360, till: 364, vila: 5.5, start: 5.5, grupp: 'tal' },
  // tummen upp mot en
  tummen: { fran: 365, till: 368, vila: 5.5, start: 5.5, grupp: 'tal' },
  // handen på bröstet, två klappar: det säger jag
  brost: { fran: 370, till: 373.4, vila: 5.5, start: 5.5, grupp: 'tal' },
  // gnuggar händerna, belåten: det här blir bra
  gnida: { fran: 375, till: 378.6, vila: 5.5, start: 5.5, grupp: 'tal' },
  // lutar sig bakåt och klappar disken två gånger
  nojd: { fran: 380, till: 383.6, vila: 5.5, start: 5.5, grupp: 'tal', dunk: [[1.15, 0.22, 'hand'], [1.75, 0.28, 'hand']] },
  // handen rullar framåt: och så rullar det på
  rulla: { fran: 385, till: 388.6, vila: 5.5, start: 5.5, grupp: 'tal' },
  // din kupong: tar pennan, skriver ett, två eller tre kryss (SKRIV) och lägger tillbaka den
  skriv1: { fran: 395, till: 395 + skrivTid(1), vila: 0, skynda: true },
  skriv2: { fran: 405, till: 405 + skrivTid(2), vila: 0, skynda: true },
  skriv3: { fran: 415, till: 415 + skrivTid(3), vila: 0, skynda: true },
  // din kupong: han spanar på den (grupp spana, rum-hasse.js väljer när), med olika miner:
  // höjer ett bryn åt det och tittar på en: jaså
  spanaBryn: { fran: 425, till: 428.8, vila: 0, skynda: true, grupp: 'spana' },
  // skakar långsamt på huvudet åt det, och pustar ut
  spanaSkaka: { fran: 430, till: 434.6, vila: 0, skynda: true, grupp: 'spana' },
  // ett leende som växer och två små nickar: det där var inte dumt
  spanaNojd: { fran: 436, till: 439.6, vila: 0, skynda: true, grupp: 'spana' },
  // sluter ögonen en stund, i tyst besvikelse
  spanaBlund: { fran: 441, till: 445.4, vila: 0, skynda: true, grupp: 'spana' },
  // bara ögonen, två snabba ögonkast, och sedan tittar han oskyldigt bort
  spanaSmyg: { fran: 447, till: 451.2, vila: 0, skynda: true, grupp: 'spana' },
  // lutar sig fram och kisar för att se vad det står, och sätter sig tillbaka med ett oj
  spanaKis: { fran: 453, till: 457.4, vila: 0, skynda: true, grupp: 'spana' },
  // tidningen (LASA ovan): tar upp den, läser och lägger ned den. slag: där han kan sluta läsa, ner: där
  // han lägger ned den (båda i klippets tid)
  // (han läser Dagens Nyheter eller Svenska Dagbladet, rum-hasse-tidning.js)
  lasa: { fran: 500, till: 500 + LASA.lasa.dur, vila: 0, skynda: true, grupp: 'lasa', tidning: 'dn', slag: LASA.lasa.slag, ner: LASA.lasa.ner },
  lasa2: { fran: 570, till: 570 + LASA.lasa2.dur, vila: 0, skynda: true, grupp: 'lasa', tidning: 'svd', slag: LASA.lasa2.slag, ner: LASA.lasa2.ner },
  // Det andra han gör när det har gått dåligt (grupp lasa, som tidningen; sysslorna i figuren): han håller
  // på med något för att verka upptagen, märker att man tittar och fryser (ertappad, utan leende: stel),
  // och sedan låtsas han att inget har hänt, med eftertryck. fram: där sidan börjar när han redan håller på
  // när man kommer (strax före det man ertappar honom med). ljud: [tid, ljud] (rum-hasse-ljud.js).
  // räknar sina rätt på fingrarna, kommer inte längre än till tre och slår näven i disken
  raknar: { fran: 650, till: 659.4, vila: 0, skynda: true, grupp: 'lasa', fram: 1.3, dunk: [[6.5, 1.1, 'nave']] },
  // dricker ur en tom kopp, skakar ur de sista dropparna och tittar ned i den, och låtsas sedan att det var gott
  tomKopp: { fran: 670, till: 682.4, vila: 0, skynda: true, grupp: 'lasa', fram: 2.6, ned: [[11.4, 0.62]] },
  // cigarren har slocknat: han drar och drar, tittar på den och blåser på glöden, och blåser sedan ut rök som inte finns
  slocknad: { fran: 690, till: 706.6, vila: 0, skynda: true, grupp: 'lasa', fram: 5.6 },
  // putsar läsglasögonen och håller upp dem mot ljuset, och sätter sedan på sig dem och tittar strängt på en
  putsa: { fran: 710, till: 727.6, vila: 0, skynda: true, grupp: 'lasa', fram: 3.6, ljud: [[2.45, { typ: 'anda', sort: 'ha', ms: 420 }], [3.05, { typ: 'anda', sort: 'ha', ms: 380 }]] },
  // visslar oskyldigt upp i taket, tystnar mitt i en ton och visslar vidare åt andra hållet
  vissla: { fran: 730, till: 740.8, vila: 0, skynda: true, grupp: 'lasa', fram: 2.4, ljud: VISSLA },
  // synar naglarna, putsar dem på slaget, och pekar sedan på en: har jag fel?
  naglar: { fran: 745, till: 755.4, vila: 0, skynda: true, grupp: 'lasa', fram: 4.6, ljud: [[2.4, { typ: 'anda', sort: 'blas', ms: 300 }], [2.85, { typ: 'anda', sort: 'blas', ms: 260 }]] },
  // Cigarren har slocknat (grupp tanda, rum-hasse.js väljer när), och han tänder den, på olika sätt (tander: med
  // en sticka ur stället eller med tändaren, rum-hasse-eld.js), och njuter sedan av den:
  // drar, men den har slocknat; biter om den, tar en sticka och drar den mot plånen, låter svavlet brinna av,
  // tänder den med tre bloss, skakar ut stickan och lägger den i askkoppen, och tittar nöjt på glöden
  tanda: { fran: 760, till: 777.8, vila: 0, skynda: true, grupp: 'tanda', tander: 'sticka', ljud: [[6.6, { typ: 'fras' }], [8.85, { typ: 'puff' }], [9.5, { typ: 'puff' }], [10.15, { typ: 'puff' }], [11.2, { typ: 'skak' }]] },
  // tändaren: fäller upp locket, hjulet ger bara gnistor första gången, tänder den, slår igen locket och
  // lägger tillbaka den, och blåser tre rökringar som han tittar efter
  tandaren: { fran: 780, till: 796.8, vila: 0, skynda: true, grupp: 'tanda', tander: 'tandare',
    ljud: [[4.5, { typ: 'lock' }], [5.0, { typ: 'hjul' }], [5.9, { typ: 'hjul', tar: true }], [6.95, { typ: 'puff' }], [7.6, { typ: 'puff' }], [8.25, { typ: 'puff' }], [9.15, { typ: 'lock', upp: false }]] },
  // tändsticka mot disken, med en gest: ingenting; han tittar på stickan och på en, och drar den mot plånen som
  // vanligt, tänder, och lutar sig bakåt och blåser ut ett stort moln
  disken: { fran: 800, till: 818.8, vila: 0, skynda: true, grupp: 'tanda', tander: 'sticka',
    ljud: [[4.07, { typ: 'skrap', styrka: 1, ms: 240 }], [6.75, { typ: 'fras' }], [8.85, { typ: 'puff' }], [9.5, { typ: 'puff' }], [10.15, { typ: 'puff' }], [11.05, { typ: 'skak' }]] },
  // tändaren i en enda rörelse: upp med locket och hjulet på samma gång, och han tittar på en medan han tänder,
  // slår igen locket med en knyck, ställer ned tändaren med en smäll, och visar cigarren för en
  tandare2: { fran: 820, till: 834.0, vila: 0, skynda: true, grupp: 'tanda', tander: 'tandare',
    ljud: [[3.6, { typ: 'lock' }], [3.82, { typ: 'hjul', tar: true }], [5.0, { typ: 'puff' }], [5.6, { typ: 'puff' }], [6.4, { typ: 'lock', upp: false }]], dunk: [[7.0, 0.25, 'hand']] },
};
for (const k of Object.values(KLIPP)) {
  if (k.dunk) k.dom = k.fran + k.dunk.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// ---------- figuren ----------

export { KAMERA, SCEN, BAK, DAG, LYS, KAM };
export const D = KAMERA.CZ;
const KAM = scenKamera();
const DK = disken();
// diskens bakre kant: dess z vid x
const kantZ = (x) => (DK.c - DK.n[0] * x) / DK.n[1];
// Disken: ovansidan (y), och den bakre kanten (z) mitt framför honom.
export const BORD = { Y: DK.Y, Z: kantZ(0) };
// Armarna på disken: armbågens och handledens höjd (rum-hasse-arm.js).
export const VILA = VILOHOJD;
// Koppen på sitt fat, till höger om hans vänstra hand och fritt från armen: en bit disk mellan fatet och
// handen (handen i VILA_B); askkoppen till vänster om hans högra hand och en bit framför den, där han når
// cigarren med underarmen rakt fram från armbågen, och så långt ut att handen går fri från cigarren när han
// slår i disken. På disken, i figurens värld. (Koppen stod 50 längre fram, och fatet täckte då namnet på
// notan, 2026-11-07; sedan stod den 35 längre åt vänster och 80 längre bak, med notan rättvänd mot en,
// 2026-11-09. Askkoppen stod 190 längre bak och 20 längre ut, vid armbågen, 2026-11-09.)
export const KOPP = [410, BORD.Y, 860];
export const ASK = [-400, BORD.Y, 880];
// Tändsticksstället och tändaren (rum-hasse-eld.js) till vänster om askkoppen och lite bakom den, där han når
// dem med höger hand när han sträcker ut armen: stället närmast, tändaren liggande på disken längre ut, vriden
// TANDARE_V från att peka mot en.
export const STALL_P = [-515, BORD.Y, 640];
export const TANDARE_P = [-650, BORD.Y, 560];
const TANDARE_V = 0.75;
// Notan under fatet, vänd som i rummet (rum.css): raderna längs pultens arm och överkanten mot armens bortre
// kant, så att den ligger på tvären framför hans händer och läses uppifrån och ned. Samma lapp som man ser
// rättvänd från rummet, alltså vriden nästan ett kvarts varv här (NV), när man har vänt sig mot honom (BAR).
// Fatet står på notans övre vänstra hörn som i rummet: fatets mitt FAT[0] från notans vänstra kant och FAT[1]
// bortom dess överkant, så långt ut att namnet (Hasse B.) syns bredvid fatet. Förut låg notan rättvänd mot
// en med fatet på överkanten, raderna tvärs över armen (ändrat 2026-11-09).
const NOTA = { B: 270, L: 430 };
const FAT = [40, 42];
const NV = -76 * DEG;
// notans mitt och hörn i figurens värld (hörnen till samtalet under den i telefonen, rum-hasse.js)
export const NOTAN = (() => {
  const c = Math.cos(NV);
  const s = Math.sin(NV);
  const ut = (x, z) => [x * c + z * s, -x * s + z * c];
  const [fx, fz] = ut(FAT[0] - NOTA.B / 2, -NOTA.L / 2 - FAT[1]);
  const mitt = [KOPP[0] - fx, BORD.Y, KOPP[2] - fz];
  const horn = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => {
    const [x, z] = ut((a * NOTA.B) / 2, (b * NOTA.L) / 2);
    return [mitt[0] + x, BORD.Y, mitt[2] + z];
  });
  return { mitt, horn };
})();
// En punkt i världen i fönstret: (cx, ey) är där kamerans axel träffar fönstret och s bildpunkter på en
// enhet på avståndet D.
export function iBild(v, x, y, z = 0) {
  const [u, w] = iKamera([x, y, z], KAM);
  return [v.cx + v.s * u, v.ey + v.s * w];
}
// Det som ska rymmas: hjässan, och allt som rör sig (armarna i gesterna, koppen när han dricker,
// händerna, koppen, askkoppen och skuggorna på disken). Gesten där armen går ut åt sidan är smalare på höjden.
export const MATT = {
  topp: [0, 772, 120],
  // pultens inre hörn, där armen mot en börjar: ska synas
  horn: franPulten([SCEN.HORN.X, BORD.Y, SCEN.DISK.Z + SCEN.DISK.DJUP]),
  // hans bredd i vila (ärmarna), till samtalet bredvid honom
  vanster: [-500, -200, 300],
  hoger: [480, -200, 340],
  ram: (hog) => [[hog ? -640 : -790, 860, 330], [660, 860, 330], [hog ? -640 : -790, BORD.Y, 330], [-260, BORD.Y, 1000],
    [KOPP[0] + 190, BORD.Y, KOPP[2] + 60], [KOPP[0] - 60, BORD.Y + 150, KOPP[2] + 150], [ASK[0] - 140, BORD.Y, ASK[2] + 120],
    // (fingertopparna på den vänstra handen i vila, vid pultens framkant: förut skars de av rakt vid
    // dukens underkant)
    [100, BORD.Y, 1120],
    // handen i koppens öra, med manschetten och ärmen (förut skars de av vid dukens kant)
    [KOPP[0] + 330, BORD.Y - 10, KOPP[2] + 170], [KOPP[0] + 360, BORD.Y + 220, KOPP[2] + 40]],
};
// fotot: urklippt, armarna borta, ljuset anpassat (bakat ur originalet)
const X0 = 280;
const Y0 = 130;
const TW = 860;
const W_ = (x, y, z = 0) => new THREE.Vector3(x - 660, 900 - y, z);
const P_ = (x, y, z) => [x - 660, 900 - y, z];
const g2 = (x, y, cx, cy, sx, sy) => { const a = (x - cx) / sx; const b = (y - cy) / sy; return Math.exp(-(a * a + b * b)); };
const smax = (a, b, k = 34) => { const h = clamp(0.5 + 0.5 * (a - b) / k); return b + (a - b) * h + k * h * (1 - h); };
// formen: huvudet som en ellipsoid med ansiktets drag ur fotots mått (Vision), halsen och bålen
function djup(x, y, drag = true) {
  const hx = (x - 660) / 182;
  const hy = (y - 385) / 240;
  const dh = hx * hx + hy * hy;
  let zh = dh < 2.4 ? 70 : -400;
  if (dh < 1) {
    zh = 70 + 170 * Math.sqrt(1 - dh);
  }
  if (dh < 1 && drag) {
    zh += 40 * g2(x, y, 662, 432, 17, 52) + 26 * g2(x, y, 662, 464, 24, 17) + 7 * g2(x, y, 632, 468, 14, 14) + 7 * g2(x, y, 692, 468, 14, 14);
    zh += -22 * g2(x, y, 608, 391, 34, 15) - 22 * g2(x, y, 716, 392, 34, 15);
    zh += 9 * g2(x, y, 603, 360, 50, 14) + 9 * g2(x, y, 727, 362, 50, 14);
    zh += 10 * g2(x, y, 570, 452, 48, 40) + 10 * g2(x, y, 752, 452, 48, 40);
    zh += 8 * g2(x, y, 662, 495, 42, 10) + 9 * g2(x, y, 662, 520, 36, 8) - 6 * g2(x, y, 662, 541, 34, 8) + 13 * g2(x, y, 660, 573, 46, 22);
  }
  let zn = -400;
  const nx = (x - 650) / 130;
  if (Math.abs(nx) < 1 && y > 520 && y < 760) zn = 40 + 100 * Math.sqrt(1 - nx * nx);
  const tx = (x - 715) / 360;
  let zt = y > 620 ? (x - 715) * 0.14 : -400;
  if (Math.abs(tx) < 1 && y > 620) {
    const rz = 165 * (0.42 + 0.58 * ss(640, 860, y));
    zt = rz * Math.sqrt(1 - tx * tx) + (x - 715) * 0.14;
    const v = clamp(1 - (y - 660) / 600);
    const c = 690 - (y - 660) * 0.33;
    const b = 150 * v;
    const inne = 1 - ss(b * 0.8, b + 6, Math.abs(x - c));
    zt += -14 * inne + 8 * inne * g2(x, y, c, y, 26, 400);
  }
  return Math.max(40, smax(smax(zh, zn), zt));
}

export async function figuren(duk, { hog = false, latt = false, pr = 1 } = {}) {
  const r = new THREE.WebGLRenderer({ canvas: duk, alpha: true, antialias: !latt, powerPreference: latt ? 'default' : 'high-performance' });
  r.setPixelRatio(pr);
  r.setClearColor(0, 0);
  const S = new THREE.Scene();
  // kameran framför honom (rum-hasse-scen.js); den bortre gränsen räcker till diskens bortre ände
  const C = new THREE.PerspectiveCamera(30, 1, 200, 30000);
  C.position.fromArray(KAM.pos);
  C.rotation.set(KAM.euler[0], KAM.euler[1], 0, 'YXZ');
  C.updateMatrixWorld();
  // disken i skuggarna: dess bakre plan och ovansidan
  // (eld: lågan när han tänder cigarren, eldsken i rum-hasse-arm.js)
  const bord = { value: new THREE.Vector4(DK.n[0], DK.n[1], DK.c, DK.Y), butik: { value: 1 }, eld: { value: new THREE.Vector4() } };
  const [foto, handModell] = await Promise.all([laddaFoto(), laddaHand()]);
  // ytan: tätare kring huvudet, och bara ned till disken
  const nx = latt ? 88 : 128;
  const Xs = Array.from({ length: nx }, (_, i) => X0 + (i / (nx - 1)) * TW);
  const Ys = [];
  for (let y = Y0; y < 720; y += latt ? 8 : 5.2) Ys.push(y);
  for (let y = 720; y <= 1350; y += latt ? 26 : 17) Ys.push(y);
  const ny = Ys.length;
  const pos = new Float32Array(nx * ny * 3);
  const uvs = new Float32Array(nx * ny * 2);
  const aW = new Float32Array(nx * ny);
  const aAx = new Float32Array(nx * ny * 2);
  for (let j = 0, o = 0; j < ny; j++) for (let i = 0; i < nx; i++, o++) {
    const x = Xs[i];
    const y = Ys[j];
    pos[o * 3] = x - 660;
    pos[o * 3 + 1] = 900 - y;
    pos[o * 3 + 2] = djup(x, y);
    uvs[o * 2] = x;
    uvs[o * 2 + 1] = y;
    const hd = Math.hypot((x - 660) / 215, (y - 385) / 270);
    aW[o] = Math.max(1 - ss(0.95, 1.22, hd), (1 - ss(585, 680, y)) * (1 - ss(100, 165, Math.abs(x - 650))));
    aAx[o * 2] = g2(x, y, 420, 780, 170, 130);
    aAx[o * 2 + 1] = g2(x, y, 975, 790, 170, 130);
  }
  const idx = [];
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i;
    const b = a + 1;
    const c = a + nx;
    const d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const G = new THREE.BufferGeometry();
  G.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  G.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  G.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
  G.setAttribute('aAx', new THREE.BufferAttribute(aAx, 2));
  G.setIndex(idx);
  G.computeVertexNormals();
  // Ljuset faller på huvudets släta form (aNs: utan näsa, bryn, kinder och mun), och bara en fjärdedel på
  // dragen. Fotot har redan sina egna skuggor kring näsan; när ljuset föll på den handbyggda näsan fick
  // den en ljus rand på ena sidan och en rosa skugga på den andra, och näsan såg inte ut som hans.
  {
    const ps = new Float32Array(pos);
    for (let j = 0, o = 0; j < ny; j++) for (let i = 0; i < nx; i++, o++) ps[o * 3 + 2] = djup(Xs[i], Ys[j], false);
    const GS = new THREE.BufferGeometry();
    GS.setAttribute('position', new THREE.BufferAttribute(ps, 3));
    GS.setIndex(idx);
    GS.computeVertexNormals();
    G.setAttribute('aNs', GS.getAttribute('normal'));
    GS.dispose();
  }
  const U = {
    foto: { value: foto }, uHuvud: { value: new THREE.Matrix3() }, uPiv: { value: W_(650, 650, 40) }, uKropp: { value: new THREE.Matrix4() }, uAx: { value: new THREE.Vector2() }, uAndas: { value: 0 },
    blund: { value: 0 }, kis: { value: 0 }, munn: { value: 0 }, rund: { value: 0 }, le: { value: 0 }, bryn: { value: new THREE.Vector2() }, blick: { value: new THREE.Vector2() }, uLins: { value: new THREE.Vector2(0, 400) },
    uArm: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uBord: bord, uButik: bord.butik, uDag: DAG, uLys: LYS, uEld: bord.eld,
  };
  const yta = new THREE.Mesh(G, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
    vertexShader: `attribute float aW; attribute vec2 aAx; attribute vec3 aNs; uniform mat3 uHuvud; uniform vec3 uPiv; uniform mat4 uKropp; uniform vec2 uAx; uniform float uAndas; uniform vec3 uArm[6];
    varying vec2 vQ; varying vec3 vN, vN0, vW; varying float vAo, vHuv;
    float seg3(vec3 p, vec3 a, vec3 b) { vec3 ab = b - a; return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.)); }
    void main(){ vec3 p = position; vec3 n = normalize(mix(aNs, normal, .25)); vN0 = n; vQ = uv;
      // (huvudet och halsen ned till kragen)
      vHuv = (1. - smoothstep(.95, 1.22, length(vec2(p.x / 215., (515. - p.y) / 270.)))) * (1. - smoothstep(590., 640., 900. - p.y));
      p.y += aAx.x * uAx.x + aAx.y * uAx.y; p.x += aAx.x * -uAx.x * .25 + aAx.y * uAx.y * .25;
      float bar = (1. - aW) * smoothstep(620., 300., abs(p.y + 100.));
      p.z += uAndas * bar; p.y += uAndas * .5 * bar;
      vec3 h = uPiv + uHuvud * (p - uPiv); p = mix(p, h, aW);
      n = normalize(mix(n, uHuvud * n, aW));
      vec4 w = uKropp * vec4(p, 1.); vN = mat3(uKropp) * n; vW = w.xyz;
      // armarna skuggar kroppen
      float dA = min(seg3(w.xyz, uArm[0], uArm[1]), seg3(w.xyz, uArm[1], uArm[2]));
      float dB = min(seg3(w.xyz, uArm[3], uArm[4]), seg3(w.xyz, uArm[4], uArm[5]));
      vAo = exp(-pow(max(0., dA - 80.) / 80., 2.)) * .3 + exp(-pow(max(0., dB - 80.) / 80., 2.)) * .3;
      gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform sampler2D foto; uniform float blund, kis, munn, rund, le; uniform vec2 bryn, blick, uLins; varying vec2 vQ; varying vec3 vN, vN0, vW; varying float vAo, vHuv;
    ${LJUS}
    ${BORD_GLSL}
    const vec2 O0 = vec2(${X0}., ${Y0}.), TS = vec2(${ATLAS.W}., ${ATLAS.H}.);
    float g(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
    float seg2(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.)); }
    // ögat: locken är kurvor; blinkningen drar ned huden ovanför, blicken flyttar bara det som är inne i ögat
    vec2 oga(vec2 q, vec2 c, float hw, float b, float ks, vec2 bl, inout float frans) {
      float x = (q.x - c.x) / hw;
      float pr = max(0., 1. - x * x);
      float yU = c.y - 7.5 * pr, yL = c.y + 6.5 * pr;
      float yUb = mix(yU, yL - .4, b), yLb = mix(yL, c.y + 1.5, ks);
      float win = 1. - smoothstep(.92, 1.3, abs(x));
      float yy = q.y;
      float inne = smoothstep(yUb - .4, yUb + 1.2, yy) * (1. - smoothstep(yLb - 1.2, yLb + .4, yy)) * (1. - smoothstep(.9, 1., abs(x)));
      frans = max(frans, b * win * exp(-pow((yy - yUb) / 1.5, 2.)));
      float top = c.y - 23.;
      if (yy < yUb && yy > top) q.y = mix(yy, top + (yy - top) * (yU - top) / (yUb - top), win);
      float bot = c.y + 20.;
      if (yy > yLb && yy < bot) q.y = mix(yy, bot - (bot - yy) * (bot - yL) / (bot - yLb), win);
      q -= bl * inne * pr;
      return q;
    }
    void main(){
      if (underBord(vW)) discard;
      vec2 q = vQ;
      vec2 q0 = q;
      // (atlasens högra kant: där börjar ärmens remsa, som annars blöder in när han ses snett)
      if (q0.x > ${X0 + TW - 6}.) discard;
      float frans = 0., inre = 0., lipp = 0., n01 = 0., dx = 0., xn = 0., uU = 0., uL = 0., A = 0.;
      // bara där det finns ett ansikte
      bool ansikte = q.y > 300. && q.y < 700. && abs(q.x - 660.) < 215.;
      if (ansikte) {
      // läsglasögonen förstorar ögonen lite där glasen är (uLins: hur mycket de sitter på näsan, och glasens mitt i
      // fotot på höjden)
      if (uLins.x > 0.) {
        for (int i = 0; i < 2; i++) {
          vec2 c = vec2(${(662.75 - GLAS.C).toFixed(2)} + float(i) * ${(2 * GLAS.C).toFixed(2)}, uLins.y);
          vec2 d = (q - c) / vec2(${GLAS.A}., ${GLAS.B}.);
          float inne = 1. - smoothstep(.85, 1., pow(pow(abs(d.x), 4.) + pow(abs(d.y), 4.), .25));
          q = mix(q, c + (q - c) / (1. + .08 * uLins.x), inne);
        }
      }
      // leendet: mungiporna ut och upp, kinderna följer med (förut ungefär två tredjedelar så mycket, och
      // då syntes ett leende knappt)
      q += le * vec2(10., 15.) * g(q, vec2(613., 505.), vec2(40.));
      q += le * vec2(-10., 15.) * g(q, vec2(711., 505.), vec2(40.));
      q.y += le * 9. * (g(q, vec2(585., 450.), vec2(42.)) + g(q, vec2(740., 450.), vec2(42.)));
      // brynen: flyttar pannan men aldrig ögat
      float grind = 1. - smoothstep(361., 372., q.y);
      q.y += bryn.x * 10. * g(q, vec2(599., 356.), vec2(66., 24.)) * grind;
      q.y += bryn.y * 10. * g(q, vec2(727., 358.), vec2(66., 24.)) * grind;
      q = oga(q, vec2(608.5, 391.), 24., blund, kis, blick, frans);
      q = oga(q, vec2(717., 392.), 24., blund, kis, blick, frans);
      // munnen: en lins mellan läpparna; underläppen och hakan följer med ned
      const vec2 MC = vec2(662., 508.5);
      float W = 50. + le * 9. - rund * 16.;
      dx = q.x - MC.x;
      xn = dx / W;
      float prm = max(0., 1. - xn * xn);
      A = munn * (31. + rund * 5.);
      float a = A * pow(prm, .78);
      uU = a * .27; uL = a * .73;
      float y0 = MC.y - le * 6. * xn * xn;
      float d = q.y - y0;
      inre = smoothstep(-1., .4, d + uU) * (1. - smoothstep(-.4, 1., d - uL)) * smoothstep(.2, .8, A) * (1. - smoothstep(.96, 1., abs(xn)));
      n01 = clamp((d + uU) / max(.1, uU + uL), 0., 1.);
      lipp = exp(-pow(min(abs(d + uU), abs(d - uL)) / 3., 2.)) * smoothstep(.5, 3., A) * (1. - smoothstep(.9, 1.2, abs(xn)));
      if (d < -uU) { float t = clamp((-d - uU) / 26., 0., 1.); q.y += uU * (1. - t) * (1. - t); }
      else if (d > uL) {
        float ty = d - uL;
        float J = A * .73 * (1. - smoothstep(58., 135., abs(dx)));
        float sh = mix(uL, J, smoothstep(0., 26., ty)) * (1. - smoothstep(92., 170., ty));
        q.y -= sh;
      }
      }
      vec4 c = texture2D(foto, vec2((q.x - O0.x) / TS.x, 1. - (q.y - O0.y) / TS.y));
      // Sidorna nedtill är där armarna satt i fotot: där är klippet ojämnt, så kroppen slutar i en
      // mjuk linje (ärmarna ligger framför).
      if (q0.y > 1030.) c *= 1. - smoothstep(-2.5, 2.5, q0.x - (952. - (q0.y - 1030.) * .12));
      if (q0.y > 1300.) c *= smoothstep(-2.5, 2.5, q0.x - (360. + (q0.y - 1300.) * .12));
      if (c.a < .02) discard;
      // Munnen inifrån: mörkröd framtill och nästan svart längre in och i mungiporna, den övre tandraden
      // med en tand i taget (framtänderna bredast, mjuk skugga mellan dem och en rundad, lite genomskinlig
      // egg), tandköttet när han skrattar stort, de nedre tändernas kant bakom underläppen och tungan längst
      // ned. (Förut var tandraden ett platt band med svarta streck, som en linjal.)
      if (inre > .001) {
        float h = uU + uL;
        float ax = abs(dx);
        vec3 m = mix(vec3(.25, .08, .07), vec3(.05, .012, .012), smoothstep(.12, .95, n01));
        m *= mix(1., .55, pow(abs(xn), 2.2));
        float tungan = exp(-pow(xn / .58, 2.) - pow((n01 - 1.) / .4, 2.)) * smoothstep(12., 26., h);
        m = mix(m, vec3(.48, .19, .18) * (.7 + .3 * smoothstep(.6, 1., n01)), tungan * .85);
        // tänderna: [0, 1) över varje tand, framtänderna 10 bildpunkter breda och smalare utåt
        float tu = ax / 10.2 - .06 * ax * ax / 400.;
        float f = fract(tu);
        float mitt = 1. - (2. * f - 1.) * (2. * f - 1.);
        float tb = min(15. / max(h, 1.), .6);
        float tk = .07 * le * smoothstep(10., 24., h);
        float ny = n01 - .1 * xn * xn;
        float egg = tk + tb * (1. - .07 * floor(tu)) + .035 * mitt;
        float tand = smoothstep(tk - .03, tk + .02, ny) * (1. - smoothstep(egg - .035, egg + .02, ny)) * (1. - smoothstep(.8, .97, abs(xn)));
        float glipa = min(f, 1. - f);
        vec3 tc = vec3(.9, .865, .78) * (.74 + .26 * smoothstep(0., .45, glipa)) * (1. - .22 * exp(-glipa * glipa / .003));
        tc *= mix(1., .36, pow(abs(xn), 1.6));
        tc *= .8 + .2 * smoothstep(tk, tk + .3, ny);
        tc = mix(tc, tc * vec3(.84, .87, .92), smoothstep(egg - .14, egg, ny) * .7);
        m = mix(m, tc, tand * smoothstep(3., 9., h));
        // tandköttet ovanför tänderna
        float tkott = (1. - smoothstep(tk - .03, tk + .01, ny)) * smoothstep(.002, .02, tk);
        m = mix(m, vec3(.58, .27, .26) * mix(1., .5, pow(abs(xn), 1.6)), tkott);
        // de nedre tänderna: bara kanten, bakom underläppen när munnen är vidöppen
        float ned = smoothstep(.87, .93, n01 + .1 * xn * xn) * smoothstep(22., 34., h) * (1. - smoothstep(.25, .5, abs(xn)));
        m = mix(m, vec3(.66, .62, .55) * (.75 + .25 * smoothstep(0., .4, min(fract(ax / 7.5), 1. - fract(ax / 7.5)))), ned * .6);
        c.rgb = mix(c.rgb, m * c.a, inre);
      }
      // läpparna: rödare och skuggade närmast öppningen
      c.rgb *= mix(vec3(1.), vec3(.74, .5, .47), lipp * (1. - inre));
      c.rgb *= 1. - .62 * frans;
      // vecken från näsan till mungiporna när han ler
      if (ansikte && le > .01) {
        float vk = min(seg2(q0, vec2(634., 462.), vec2(598., 522.)), seg2(q0, vec2(690., 462.), vec2(726., 522.)));
        c.rgb *= 1. - .2 * le * exp(-vk * vk / 28.);
      }
      // samma ljus som på armarna
      vec3 n = normalize(vN);
      vec3 r = mix(vec3(1.), ljus(n) / fotoLjus(normalize(vN0)), .82);
      // Ansiktet: fotot är redan ljust där, så det får bli högst lite ljusare än fotot (annars fräts huden
      // ut och blir blekare än händerna). Hela huvudet lika mycket, så att kontrasten är fotots.
      r /= mix(1., max(1., dot(r, vec3(.3, .59, .11)) / 1.12), vHuv);
      vec3 ut = c.rgb * (r + eldsken(vW, n));
      ut *= 1. - min(.5, vAo);
      ut += kant(n, .3) * c.a;
      gl_FragColor = vec4(ton(ut), c.a); }`,
  }));
  yta.frustumCulled = false;
  S.add(yta);
  // armarna (rum-hasse-arm.js). Kroppen får inte skymma dem: djupet börjar om efter kroppen.
  yta.renderOrder = 1;
  yta.onAfterRender = (re) => re.clearDepth();
  const A = byggArm(S, 1, foto, handModell, 0.94, bord);
  const B = byggArm(S, -1, foto, handModell, 1, bord);
  // koppen på sitt fat, till höger om hans vänstra hand
  const K = byggKopp(bord);
  const kopp = K.kopp;
  kopp.position.set(KOPP[0], KOPP[1] + 11, KOPP[2]);
  kopp.rotation.y = -0.5;
  K.fat.position.set(KOPP[0], KOPP[1] + 0.5, KOPP[2]);
  S.add(kopp, K.fat);
  // askkoppen till vänster om hans högra hand, med cigarren i urtaget som pekar åt höger och lite in mot
  // honom, tvärs över fingrarna när han sträcker fram handen: huvudet ligger på disken, glöden över
  // askkoppens mitt och röken stiger därifrån. (Förut pekade den lite mot en, och då måste handen vridas
  // 60° utåt från vilan för att ta den, med armbågen ute.)
  const ASKV = -0.25;
  const ask = byggAskkopp(bord);
  ask.mesh.position.fromArray(ASK);
  const ASKV3 = ask.mesh.position;
  ask.mesh.rotation.y = -ASKV;
  const cig = byggCigarr(bord);
  cig.mesh.matrixAutoUpdate = false;
  const rok = byggRok(latt ? 200 : 280, bord);
  S.add(ask.mesh, cig.mesh, rok.mesh);
  // Elden (rum-hasse-eld.js): tändsticksstället och tändaren på disken, stickan han tänder med, de brända i
  // askkoppen och lågan. ELD: cigarren tänd (tand, 0–1, mot mal: den slocknar sakta) när den ligger i
  // askkoppen, och hur många stickor som är kvar i stället och brända i askkoppen (cigarr() nedan).
  const ELD = { tand: 1, mal: 1, n: null, kvar: STALL.ANTAL, branda: 0 };
  const stall = byggStall(bord);
  stall.mesh.position.fromArray(STALL_P);
  stall.mesh.updateMatrixWorld();
  const sticka = byggSticka(bord);
  const branda = byggBranda(bord);
  ask.mesh.add(branda.mesh);
  const tand = byggTandare(bord);
  const laga = byggLaga();
  S.add(stall.mesh, sticka.mesh, tand.mesh, laga.mesh);
  // tändaren liggande på rygg på disken: höjden längs disken, locket bort från honom
  const TV = new THREE.Vector3(Math.sin(TANDARE_V), 0, Math.cos(TANDARE_V));
  const TAND_VILA = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(TV, new THREE.Vector3(0, 1, 0)), TV, new THREE.Vector3(0, 1, 0))
    .setPosition(TANDARE_P[0] - TV.x * TANDARE.H / 2, BORD.Y + TANDARE.D / 2 + 0.3, TANDARE_P[2] - TV.z * TANDARE.H / 2);
  tand.mesh.matrix.copy(TAND_VILA);
  // skuggorna på disken: kapslar som faller bakåt och bort från ljuset, ingen skuggkarta
  const NK = 13;
  const skuggGeo = new THREE.BufferGeometry();
  {
    // pultens ovansida: benet framför honom och armen mot en (i pultens mått)
    const z0 = SCEN.DISK.Z;
    const z1 = z0 + SCEN.DISK.DJUP;
    const { X: xi, B } = SCEN.HORN;
    const xo = xi + B;
    const h = [[-3000, z0], [xo, z0], [-3000, z1], [xo, z1], [xi, z1], [xo, z1], [xi, 5000], [xo, 5000]].flatMap(([x, z]) => franPulten([x, BORD.Y, z]));
    skuggGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(h), 3));
    skuggGeo.setIndex([0, 2, 1, 1, 2, 3, 4, 6, 5, 5, 6, 7]);
  }
  // (samma skuggor som under handen på pulten i rummet, rum-hasse-arm.js)
  const { mesh: skugga, kapA, kapH } = byggSkugga(skuggGeo, NK);
  // (först: kroppen slutar vid diskens kant, och skuggorna ligger framför den)
  skugga.renderOrder = 0.5;
  skugga.frustumCulled = false;
  S.add(skugga);
  // kroppen nära disken skuggar dess bakre kant
  kapA[6].set(-330, kantZ(-330) + 10, 330, kantZ(330) + 10);
  kapH[6].set(64, 26);
  // tändsticksstället (10), och tändaren (11) och stickan (12) sätts i rita
  kapA[10].set(STALL_P[0], STALL_P[2], STALL_P[0], STALL_P[2]);
  kapH[10].set(30, 1);
  // ---------- disken (diskBild) ----------
  // Pulten från rummet, vid hörnet: geometri i pultens mått (x längs benet), vriden som baren och flyttad så att
  // han sitter vid SCEN.PLATS, med händerna vid geringssnittet. Benet framför
  // honom och armen som går mot en (SCEN.HORN) är samma skiva som pulten i rummet (rum-pult.js): samma trä,
  // som ådras längs benet och längs armen och möts i ett geringssnitt i hörnet, samma ringar efter glas, en
  // smal list i aluminium längs de bortre kanterna, och en tjock, mjukt rundad framkant mot en (SKIVA), med
  // framsidan indragen i skugga under den. Den ritas en gång på en egen duk under figuren. Träet speglar
  // väggen bakom honom svagt: den speglade strålen träffar väggen, och där hämtas färgen ur väggens bild
  // (samma kamera), suddigare ju längre strålen går. Han själv speglas som en mörk form.
  const SD = new THREE.Scene();
  // framkantens profil [ut, ned] från skivans framkant och ovansida, med normalen: en kvartscirkel överst
  // (RADIE), en kort rak bit och en mindre rundning nedtill, så att skivan ser tjock och tung ut
  const R1 = SKIVA.RADIE * 0.75;
  const R2 = SKIVA.TJOCK - R1 - 26;
  const PROFIL = [];
  for (let i = 0; i <= 10; i++) {
    const a = (Math.PI / 2) * (1 - i / 10);
    PROFIL.push([-R1 + R1 * Math.cos(a), -R1 + R1 * Math.sin(a), Math.cos(a), Math.sin(a)]);
  }
  for (let i = 0; i <= 6; i++) {
    const a = -(Math.PI / 2) * (i / 6);
    PROFIL.push([-R2 + R2 * Math.cos(a), -(SKIVA.TJOCK - R2) + R2 * Math.sin(a), Math.cos(a), Math.sin(a)]);
  }
  const ringU = Array.from({ length: NRING }, () => new THREE.Vector4());
  const diskU = {
    uBak: { value: null }, uBakRam: { value: new THREE.Vector4(0, 0, 1, 1) }, uBakSt: { value: new THREE.Vector2(1, 1) },
    uKr: { value: new THREE.Vector3(...KAM.hoger) }, uKu: { value: new THREE.Vector3(...KAM.upp) }, uKb: { value: new THREE.Vector3(...KAM.bak) }, uD: { value: D },
    uNb: { value: new THREE.Vector2(DK.n[0], DK.n[1]) }, uVagg: { value: SCEN.VAGG + 180 }, uButik: bord.butik, uDag: DAG, uLys: LYS, uRing: { value: ringU },
  };
  const diskG = new THREE.BufferGeometry();
  {
    const { Y, Z, DJUP } = SCEN.DISK;
    const X = 9000;
    const zf = Z + DJUP;
    const pos = [];
    const nor = [];
    const del = [];
    const idx = [];
    const quad = (a, b, c, d, n, k) => {
      const o = pos.length / 3;
      for (const q of [a, b, c, d]) { pos.push(...q); nor.push(...n); del.push(k); }
      idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
    };
    // armen mot en: vänstra kanten xi, högra xo, och den går förbi kameran (zl)
    const xi = SCEN.HORN.X;
    const xo = xi + SCEN.HORN.B;
    const zl = 6000;
    // ovansidan: benet med hörnet, och armen (utom framkanterna)
    quad([-X, Y, Z], [xo, Y, Z], [-X, Y, zf - R1], [xo, Y, zf - R1], [0, 1, 0], 0);
    quad([xi + R1, Y, zf - R1], [xo, Y, zf - R1], [xi + R1, Y, zl], [xo, Y, zl], [0, 1, 0], 0);
    // framkanterna: profilen längs benets framkant (fram till hörnet) och längs armens vänstra kant. I hörnet
    // går de in i varandra, och djupet ger snittet.
    const kant = (langs) => {
      for (let i = 0; i < PROFIL.length - 1; i++) {
        const o = pos.length / 3;
        for (const [u, v, nu, nv] of [PROFIL[i], PROFIL[i], PROFIL[i + 1], PROFIL[i + 1]]) {
          if (langs) nor.push(-nu, nv, 0);
          else nor.push(0, nv, nu);
        }
        const [u0, v0] = PROFIL[i];
        const [u1, v1] = PROFIL[i + 1];
        if (langs) pos.push(xi - u0, Y + v0, zf - R1, xi - u0, Y + v0, zl, xi - u1, Y + v1, zf - R1, xi - u1, Y + v1, zl);
        else pos.push(-X, Y + v0, zf + u0, xi + R1, Y + v0, zf + u0, -X, Y + v1, zf + u1, xi + R1, Y + v1, zf + u1);
        del.push(1, 1, 1, 1);
        idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
      }
    };
    kant(false);
    kant(true);
    // skivans undersida in till framsidan, och framsidan indragen under den: benets mot en och armens vänstra
    const T = SKIVA.TJOCK;
    const ui = -R2 - SKIVA.INDRAG;
    quad([-X, Y - T, zf - R2], [xi + R2, Y - T, zf - R2], [-X, Y - T, zf + ui], [xi - ui, Y - T, zf + ui], [0, -1, 0], 3);
    quad([xi + R2, Y - T, zf - R2], [xi + R2, Y - T, zl], [xi - ui, Y - T, zf + ui], [xi - ui, Y - T, zl], [0, -1, 0], 3);
    quad([-X, Y - T, zf + ui], [xi - ui, Y - T, zf + ui], [-X, Y - 2400, zf + ui], [xi - ui, Y - 2400, zf + ui], [0, 0, 1], 2);
    quad([xi - ui, Y - T, zf + ui], [xi - ui, Y - T, zl], [xi - ui, Y - 2400, zf + ui], [xi - ui, Y - 2400, zl], [-1, 0, 0], 2);
    diskG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    diskG.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
    diskG.setAttribute('aDel', new THREE.BufferAttribute(new Float32Array(del), 1));
    diskG.setIndex(idx);
  }
  const diskM = new THREE.Mesh(diskG, new THREE.ShaderMaterial({
    uniforms: diskU,
    vertexShader: `attribute float aDel; varying vec3 vB, vW, vN, vNb; varying float vDel;
    void main() { vB = position; vNb = normal; vDel = aDel; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float;
    uniform sampler2D uBak; uniform vec4 uBakRam; uniform vec2 uBakSt; uniform vec3 uKr, uKu, uKb; uniform float uD, uVagg; uniform vec2 uNb;
    varying vec3 vB, vW, vN, vNb; varying float vDel;
    ${LJUS}
    ${PULT_GLSL}
    float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float nz(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * nz(p); p = p * 2.03 + 11.; a *= .5; } return s; }
    // en punkt i världen i väggens bild (samma kamera)
    vec2 iBak(vec3 p) { vec3 d = p - cameraPosition; float z = -dot(d, uKb); vec2 uw = uD * vec2(dot(d, uKr), -dot(d, uKu)) / z; vec2 q = (uBakRam.xy + uBakRam.z * uw) / uBakSt; return vec2(q.x, 1. - q.y); }
    // det som speglas i riktningen R från p: väggen, eller han (mörkt)
    vec3 spegel(vec3 p, vec3 R, float grov) {
      float t = (uVagg - dot(uNb, p.xz)) / min(-.05, dot(uNb, R.xz));
      vec3 q = p + R * t;
      vec3 c = texture2D(uBak, iBak(q), log2(1. + t * grov)).rgb;
      // han: kroppen och huvudet på fotots plan
      float th = (70. - p.z) / min(-.05, R.z);
      vec3 h = p + R * th;
      float kropp = max(1. - smoothstep(330., 380., abs(h.x - 30.) + max(0., h.y - 250.) * .5), 0.) * (1. - smoothstep(560., 640., h.y));
      vec2 hu = (h.xy - vec2(0., 520.)) / vec2(175., 255.);
      float huvud = 1. - smoothstep(.85, 1.05, length(hu));
      c = mix(c, vec3(.035, .03, .032), kropp * step(0., th) * .9);
      c = mix(c, vec3(.32, .2, .15), huvud * step(0., th) * .8);
      return c;
    }
    void main() {
      vec3 n = normalize(vN);
      vec3 V = normalize(vW - cameraPosition);
      float cs = clamp(dot(-V, n), 0., 1.);
      float F = .04 + .96 * pow(1. - cs, 5.);
      vec3 ut;
      // ljuset faller av mot en och åt vänster, bort från lamporna över honom
      float pol = exp(-pow((vB.x + 250.) / 2600., 2.)) * (.55 + .45 * exp(-pow((vB.z - 300.) / 900., 2.)));
      // neonen och gatan från höger, där affären ligger
      float hoger = smoothstep(-200., 2600., vB.x);
      float dag = uDag.w;
      vec3 l = ljus(n) * mix(.32 + .9 * pol, 1.15 + .7 * hoger, .6 * dag) + (vec3(.5, .06, .04) * hoger * .35 + vec3(.16, .2, .3) * hoger * .2) * (1. - .75 * dag);
      if (vDel < .5) {
        // pultens trä (rum-pult.js), som i rummet. (På dagen lyser fönstret till höger upp hela disken, mest
        // närmast affären, och neonen syns mindre. Pulten i rummet är lika ljus dag som kväll, så den här ska
        // vara det också; förut var den mörkare på dagen än på natten.)
        ut = pultTra(vB.xz) * l;
        vec3 R = reflect(V, n);
        float grov = .006 + .01 * fbm(vB.xz * vec2(.004, .03));
        // matt som pulten: bara en svag glans
        ut = mix(ut, spegel(vW, R, grov) * 1.1, min(1., F * 1.3) * .32);
        // de bortre kanterna (bakom honom och armens högra): en smal list i aluminium, som pultens bortre
        // kant i rummet, med en ljus kant där lamporna fångas
        float ytter = pultKant(vB.xz);
        float al = 1. - smoothstep(${(SKIVA.ALU - 1).toFixed(1)}, ${(SKIVA.ALU + 1).toFixed(1)}, ytter);
        vec3 alu = vec3(.42, .42, .4) * ljus(n) * (.35 + .6 * pol) + spegel(vW, R, .03) * .35;
        alu += vec3(1., .78, .52) * exp(-pow((ytter - 2.) / 2.5, 2.)) * .3 * (.4 + pol);
        ut = mix(ut, alu, al);
        // (och en mörk fog där listen möter träet)
        ut *= 1. - .35 * exp(-pow((ytter - ${(SKIVA.ALU + 1.5).toFixed(1)}) / 1.6, 2.));
      } else if (vDel < 1.5) {
        // framkanten: samma trä, rundat ned mot en; där den vänder sig mot lamporna fångar den ljuset i en
        // mjuk, ljus rand, och längre ned mot framsidan mörknar den
        vec2 b = vB.xz;
        ut = pultTra(b) * l * (.62 + .38 * smoothstep(-.6, .7, n.y));
        vec3 R = reflect(V, n);
        ut = mix(ut, spegel(vW, R, .02) * 1.1, min(1., F * 1.3) * .22 * step(0., R.y));
        ut += vec3(1., .86, .7) * pow(max(0., dot(R, NYCKEL)), 14.) * .07 * (.5 + pol);
      } else if (vDel < 2.5) {
        // framsidan: mörkt trä i fält, indragen under skivan och i dess skugga (benets längs x, armens längs z)
        float x = (abs(vNb.x) > .5 ? vB.z : vB.x) / 520.;
        float spar = smoothstep(0., .015, fract(x)) * smoothstep(0., .015, 1. - fract(x));
        vec2 g = vec2(vB.x * .02, vB.y * .0026);
        vec3 tra = mix(vec3(.16, .085, .045), vec3(.25, .14, .075), fbm(g * vec2(1.6, 1.)));
        float ned = exp((vB.y - ${SCEN.DISK.Y.toFixed(1)}) / 380.);
        float under = .3 + .7 * smoothstep(0., 140., ${(SCEN.DISK.Y - SKIVA.TJOCK).toFixed(1)} - vB.y);
        ut = tra * (ljus(n) * (.2 + .5 * pol) * (.25 + .75 * ned)) * (.55 + .45 * spar) * under;
        ut += vec3(.5, .06, .04) * hoger * .08 * ned * under * (1. - .75 * uDag.w);
      } else {
        // skivans undersida: i skugga
        ut = pultTra(vB.xz) * ljus(n) * .22 * (.4 + .6 * pol);
      }
      gl_FragColor = vec4(ton(ut), 1.);
    }`,
  }));
  diskM.rotation.y = SCEN.BAR * DEG;
  diskM.position.fromArray(franBaren([-SCEN.PLATS, 0, 0]));
  diskM.frustumCulled = false;
  SD.add(diskM);
  // Notan under fatet, samma som i rummet (rum.js), ritad på en duk.
  const notaDuk = document.createElement('canvas');
  const notaTex = new THREE.CanvasTexture(notaDuk);
  notaTex.colorSpace = THREE.NoColorSpace;
  notaTex.anisotropy = 8;
  const notaG = new THREE.PlaneGeometry(NOTA.B, NOTA.L, 1, 8);
  {
    // liggande, med den nedre änden lite uppböjd
    const p = notaG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = (-y / NOTA.L) + 0.5;
      p.setXYZ(i, p.getX(i), Math.max(0, t - 0.78) ** 2 * 120 + 0.6, -y);
    }
    notaG.computeVertexNormals();
  }
  // I barens ljus, men bara dess styrka och dagsljusets färg (ljusDag i rum-hasse-arm.js): papperet är vitt
  // som på pulten i rummet och skiftar med dagsljuset som där. (Med neonskyltens röda och ett rött tillägg
  // blev papperet rosa, 2026-11-09.)
  const nota = new THREE.Mesh(notaG, new THREE.ShaderMaterial({
    uniforms: { uT: { value: notaTex }, uButik: bord.butik, uDag: DAG, uLys: LYS },
    transparent: true,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; void main() { vUv = uv; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }',
    fragmentShader: `precision highp float; uniform sampler2D uT; varying vec2 vUv; varying vec3 vN;
    ${LJUS}
    void main() { vec4 c = texture2D(uT, vUv); if (c.a < .02) discard; vec3 n = normalize(vN); gl_FragColor = vec4(c.rgb * ton(ljusDag(n)), c.a); }`,
  }));
  // på pulten, med fatet på dess övre vänstra hörn (NOTAN ovan)
  nota.position.fromArray(NOTAN.mitt);
  nota.rotation.y = NV;
  nota.renderOrder = 1;
  SD.add(nota);
  let notaKlar = null;
  function ritaNota() {
    if (!notaKlar) {
      notaKlar = (async () => {
        // Samma som notan i rummet (#rum-hasse .nota i rum.css), i dess mått: raderna, vinklarna och
        // baslinjerna är mätta där, och pappersstrukturen (--pp-grain) ligger överst som där.
        try { await Promise.all(['600 19px Caveat', '700 27px Caveat', '900 10px Fraunces', '14px VT323'].map((f) => document.fonts.load(f))); } catch (e) { /* då med reservtypsnitten */ }
        let korn = new Image();
        korn.src = 'rum/papper.webp';
        try { await korn.decode(); } catch (e) { korn = null; }
        const k = 3;
        notaDuk.width = 148 * k;
        notaDuk.height = 236 * k;
        const x = notaDuk.getContext('2d');
        x.scale(k, k);
        // rivet ur blocket i överkanten
        x.beginPath();
        x.moveTo(0, 3.3);
        for (let i = 1; i <= 20; i++) x.lineTo(148 * (i / 20), i % 2 ? 0 : 3.3);
        x.lineTo(148, 236);
        x.lineTo(0, 236);
        x.closePath();
        const bg = x.createLinearGradient(0, 0, 0, 236);
        bg.addColorStop(0, '#f3efe3');
        bg.addColorStop(1, '#e2dbc8');
        x.fillStyle = bg;
        x.fill();
        x.save();
        x.clip();
        x.fillStyle = 'rgba(70, 100, 170, 0.2)';
        for (let y = 13 + 22; y < 236; y += 23) x.fillRect(0, y, 148, 1);
        if (korn) {
          const m = x.createPattern(korn, 'repeat');
          m.setTransform(new DOMMatrix().scale(320 / korn.naturalWidth));
          x.fillStyle = m;
          x.fillRect(0, 0, 148, 236);
        }
        x.restore();
        x.textBaseline = 'alphabetic';
        x.textAlign = 'right';
        x.fillStyle = '#c0392b';
        x.font = '14px VT323, monospace';
        x.letterSpacing = '0.5px';
        x.fillText('NR 0007', 137, 25);
        const nr = x.measureText('NR 0007').width;
        x.fillStyle = '#a8402c';
        x.font = '900 10px Fraunces, Georgia, serif';
        x.letterSpacing = '2.6px';
        x.fillText('NOTA', 137 - nr - 8, 25);
        x.letterSpacing = '0px';
        x.fillStyle = '#25336f';
        // en rad med baslinjen bas, vriden vinkel grader kring o (transform-origin i rum.css)
        const text = (t, px, bas, { vinkel = 0, o = [px, bas], font = '600 19px Caveat, cursive', hoger = false } = {}) => {
          x.save();
          x.translate(o[0], o[1]);
          x.rotate(vinkel * DEG);
          x.font = font;
          x.textAlign = hoger ? 'right' : 'left';
          x.fillText(t, px - o[0], bas - o[1]);
          const b = x.measureText(t).width;
          x.restore();
          return b;
        };
        text('Hasse B.', 15, 53, { vinkel: -3, o: [15, 44.5], font: '700 27px Caveat, cursive' });
        const rad = [['Kaffe', '32:–', 73], ['Påtår ×4', '–', 96], ['Kanelbulle', '28:–', 119], ['S:a', '60:–', 143]];
        rad.forEach(([a, b, y], i) => { text(a, 15, y); text(b, i === 3 ? 141 : 137, y, { hoger: true }); });
        x.fillRect(15, 125, 126, 1.5);
        text('Skrivs på', 15, 167, { vinkel: -4, o: [76, 161.5] });
        const o = [11, 184.5];
        const b = text('Notts County', 11, 192, { vinkel: -5, o, font: '700 24px Caveat, cursive' });
        // dubbelt understruken, som text-decoration: underline double
        x.save();
        x.translate(o[0], o[1]);
        x.rotate(-5 * DEG);
        x.fillRect(0, 192 - o[1] + 4, b, 1.5);
        x.fillRect(0, 192 - o[1] + 7.5, b, 1.5);
        x.restore();
        notaTex.needsUpdate = true;
      })();
    }
    return notaKlar;
  }
  let bakTex = null;
  let bakKalla = null;
  // Disken i fönstret (v som kamera), från dess bakre kant ned till fönstrets underkant, på duken ut.
  // bak: väggens bild { bild, px, py, S, W, H } (scripts/hasse/bak.html).
  async function diskBild(ut, v, bak) {
    await ritaNota();
    // dagens ringar efter glas, samma som i rummet (rum-pult.js)
    ringar().forEach(([x, z, rr, a], i) => ringU[i].set(x, z, rr, a));
    if (!bakTex || bakKalla !== bak.bild || bak.ny) {
      if (bakTex) bakTex.dispose();
      bakKalla = bak.bild;
      // (three läser en bilds storlek ur width och height, som är dess storlek i sidan och inte
      // bildens: på kvällen, med bilden direkt, blev texturen för liten och förblev tom)
      let kalla = bak.bild;
      if (kalla instanceof HTMLImageElement && kalla.naturalWidth) {
        const k = Math.min(1, 1024 / kalla.naturalWidth);
        const c = document.createElement('canvas');
        c.width = Math.round(kalla.naturalWidth * k);
        c.height = Math.round(kalla.naturalHeight * k);
        c.getContext('2d').drawImage(kalla, 0, 0, c.width, c.height);
        kalla = c;
      }
      bakTex = new THREE.Texture(kalla);
      bakTex.colorSpace = THREE.NoColorSpace;
      bakTex.generateMipmaps = true;
      bakTex.minFilter = THREE.LinearMipmapLinearFilter;
      bakTex.needsUpdate = true;
      diskU.uBak.value = bakTex;
    }
    diskU.uBakRam.value.set(bak.px, bak.py, bak.S, 0);
    diskU.uBakSt.value.set(bak.W, bak.H);
    // den bakre kanten i fönstret: dess högsta punkt där den syns
    const ka = iBild(v, ...franPulten([-9000, BORD.Y, SCEN.DISK.Z]));
    const kb = iBild(v, ...franPulten([SCEN.HORN.X + SCEN.HORN.B, BORD.Y, SCEN.DISK.Z]));
    const yVid = (x) => ka[1] + ((kb[1] - ka[1]) * (x - ka[0])) / (kb[0] - ka[0]);
    const y0 = Math.max(0, Math.floor(Math.min(yVid(0), yVid(v.W)) - 4));
    const box = { x: 0, y: y0, w: v.W, h: Math.max(1, v.H - y0) };
    Object.assign(ut.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    const pr = r.getPixelRatio();
    ut.width = Math.round(box.w * pr);
    ut.height = Math.round(box.h * pr);
    r.setSize(box.w, box.h, false);
    C.fov = (2 * Math.atan(v.H / 2 / (v.s * D))) / DEG;
    C.aspect = v.W / v.H;
    C.setViewOffset(v.W, v.H, v.W / 2 - v.cx + box.x, v.H / 2 - v.ey + box.y, box.w, box.h);
    r.render(SD, C);
    const g = ut.getContext('2d');
    g.clearRect(0, 0, ut.width, ut.height);
    g.drawImage(r.domElement, 0, 0, ut.width, ut.height);
    // och figuren igen
    kamera(v);
    return box;
  }
  // ---------- rörelserna ----------
  const SA = W_(352, 792, -52);
  const SB = W_(987, 800, 8);
  const LA = ARM.LA;
  const LB = ARM.LB;
  // Vilan: han har lagt underarmarna på disken, med armbågarna lite ute och underarmarna snett in mot
  // mitten, och den vänstra handen vilar över den högra. Ur axeln (s), armbågens vinkel ut från rakt fram
  // (a) och underarmens vinkel in (b): armbågen och handleden ligger på disken, med armens längder (lyft:
  // handleden lite högre). Handen pekar några grader mindre in än underarmen, som en hand som vilar
  // (handleden lite vinklad mot lillfingret), med fingrarna lätt krökta. Förut låg underarmarna nästan rakt
  // fram med händerna isär, platt på disken som i givakt och den vänstra armen tätt intill fatet: han såg ut
  // att sitta obekvämt (ändrat 2026-11-08). Den högra handens fingrar är böjda och den vänstras samlade, så
  // att den undre handens fingrar inte sticker fram. Han slår i disken där händerna låg då, en bit isär
  // (SLAG_A, SLAG_B): i vilan skulle slaget hamna på hans egen hand.
  // (paDisken och inat i rum-hasse-arm.js, och vilan själv: VILAN)
  // (den högra handen lite rullad mot lillfingret, med handleden lite högre så att den inte går ned i disken)
  const va = VILAN.A;
  const vb = VILAN.B;
  const slagAr = paDisken(SA, 1, 10, 30, 22);
  const slagBr = paDisken(SB, -1, 0, 22, 16);
  // [handled, armbågens riktning, fingrarna, handflatan, krok, peka]
  const VILA_A = [va.W, va.pol, va.F, va.P, va.krok, 0];
  const VILA_B = [vb.W, vb.pol, vb.F, vb.P, vb.krok, 0];
  const SLAG_A = [slagAr.W, slagAr.pol, inat(1, 18), [0.45, -0.88, 0.1], 0.55, 0];
  const SLAG_B = [slagBr.W, slagBr.pol, inat(-1, 8), [-0.2, -0.97, 0.05], 0.5, 0];
  // [t, handled, armbågens riktning, fingrarna, handflatan, krok, peka, slag]. slag: på vägen dit går
  // handen allt fortare och stannar tvärt, som när den slår i disken (annars mjukt in och ut).
  const VA = [
    [0, ...VILA_A], [2.5, ...VILA_A],
    // gapskrattet: båda armarna upp framför kroppen
    [3.0, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.35, P_(210, 505, 300), [-0.6, -0.5, 0.65], [-0.12, 0.97, 0.12], [0.12, -0.06, 1], 0.1, 0],
    [4.78, P_(270, 680, 340), [-0.8, -0.6, 0.2], [-0.05, 0.95, 0.3], [0.9, 0, 0.3], 0.06, 0],
    // slaget i disken
    [5.0, ...SLAG_A, true], [5.5, ...VILA_A],
    // pekfingret: så är det bara
    [5.95, P_(310, 640, 390), [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
    [6.8, P_(310, 640, 390), [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
    // karateslaget
    [7.1, P_(300, 690, 400), [-0.8, -0.75, 0.15], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    [8.15, P_(300, 690, 400), [-0.8, -0.75, 0.15], [0.2, 0.8, 0.55], [0.95, 0, -0.2], 0.06, 0],
    // armen ut åt sidan, inom bilden (på höjden är bilden smalare)
    [8.7, P_(hog ? 210 : 70, 790, 330), [-0.7, -0.75, 0.1], [-0.72, 0.6, 0.25], [0.12, -0.25, 1], 0.1, 0],
    [9.25, P_(hog ? 235 : 95, 830, 320), [-0.7, -0.75, 0.1], [-0.76, 0.5, 0.3], [0.12, -0.25, 1], 0.1, 0],
    [9.95, ...VILA_A], [12.4, ...VILA_A],
  ];
  const VB = [
    [0, ...VILA_B], [2.55, ...VILA_B],
    [3.0, P_(1110, 505, 310), [0.6, -0.5, 0.65], [0.12, 0.97, 0.12], [-0.12, -0.06, 1], 0.1, 0],
    [4.2, P_(1110, 505, 310), [0.6, -0.5, 0.65], [0.12, 0.97, 0.12], [-0.12, -0.06, 1], 0.1, 0],
    [4.72, ...VILA_B], [12.4, ...VILA_B],
  ];
  // Huvudet, kroppen och brynen i T 0–12,4 (efter det: vilan). I vilan är han nöjd och säker på sin sak:
  // hakan lite upp, huvudet nästan rakt, båda brynen lite uppe och ett leende som når ögonen (NOJD). Förut
  // hade han ena brynet högt, huvudet på sned och hakan uppe med ett tunt leende, och det såg hånfullt ut
  // (ändrat 2026-11-06).
  const HUV = {
    yaw: [[0, -0.3], [2.5, -0.3], [3.0, 0.15], [4.5, 0.1], [5.0, 0], [8.2, 0], [8.7, -0.8], [9.3, -0.65], [9.95, 0], [10.6, 0.25], [11.6, 0.25], [12.4, -0.3]],
    pitch: [[0, -0.3], [2.5, -0.3], [3.0, -1.2], [4.4, -1.1], [4.8, -0.55], [5.0, 0.95], [5.2, 0.05], [8.2, 0.05], [9.95, 0.05], [10.6, -0.6], [11.6, -0.6], [12.4, -0.3]],
    roll: [[0, -0.025], [2.5, -0.025], [3.0, 0.09], [4.4, 0.07], [5.0, 0], [8.2, 0], [8.7, -0.06], [9.3, -0.05], [9.95, 0], [10.6, 0.05], [11.6, 0.05], [12.4, -0.025]],
    lut: [[0, 0.02], [2.5, 0.02], [3.0, -0.03], [4.72, -0.04], [5.0, 0.09], [5.5, 0.06], [8.2, 0.05], [9.95, 0.06], [12.4, 0.02]],
    vrid: [[0, -0.09], [2.5, -0.09], [3, 0], [4.72, 0.05], [5.0, -0.1], [5.5, -0.08], [8.2, -0.03], [8.7, -0.17], [9.3, -0.14], [9.95, -0.08], [12.4, -0.09]],
    sid: [[0, -0.008], [2.5, -0.008], [3, -0.006], [4.72, 0.015], [5, -0.012], [8.7, 0.015], [9.95, -0.012], [12.4, -0.008]],
    axV: [[0, -8], [2.5, -8], [3.0, 42], [4.35, 42], [4.78, 26], [5.0, -8], [5.5, -8], [5.95, 18], [8.15, 18], [8.7, 26], [9.95, -8], [12.4, -8]],
    axH: [[0, 0], [2.55, 0], [3.0, 42], [4.2, 42], [4.72, 0], [12.4, 0]],
    brynX: [[0, 0.45], [2.5, 0.45], [3.0, 0.5], [4.4, 0.5], [5.0, 1], [5.6, 0.4], [9.4, 0.3], [9.95, 0.4], [10.6, 0.6], [11.6, 0.6], [12.4, 0.45]],
    brynY: [[0, 0.45], [2.5, 0.45], [3.0, 0.6], [4.4, 0.6], [5.0, 1], [5.6, 0.5], [9.4, 0.4], [9.95, 0.5], [10.6, 0.6], [11.6, 0.6], [12.4, 0.45]],
  };
  const KANAL = Object.keys(HUV);
  // ansiktet i klippen: läggs till som det största av det som rör sig (blicken läggs till: blickX åt hans
  // vänstra sida, blickY nedåt, i fotots bildpunkter; andas läggs till andningen)
  // (stel: 0–1, tar bort leendet han alltid har, när han blir ertappad)
  const ANSIKTE = ['le', 'kis', 'blund', 'munn', 'rund', 'dricker', 'blickX', 'blickY', 'andas', 'stel'];
  const lage = (T) => Object.fromEntries(KANAL.map((x) => [x, spar(HUV[x], T)]));
  const S0 = lage(0);

  // ---------- klippen (KLIPP) ----------
  // Varje klipp utom de första tre: huvudet, kroppen och brynen (k) som skillnad mot där han står när
  // klippet börjar (start, 0 eller 5,5), ansiktet som det är, och armarnas nycklar (A, B), allt i klippets
  // egen tid. Klippet börjar och slutar där han står, så det behöver bara nycklarna däremellan.
  // kaffe: koppen till munnen och tillbaka, cig: cigarren (se nedan).
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const lang = (p, l) => { const x = Math.hypot(...p); return p.map((c) => (c * l) / x); };
  // armbågens riktning: lika lång som vilans, så att den inte tar över först på slutet
  const polA = (p) => lang(p, Math.hypot(...va.pol));
  const polB = (p) => lang(p, Math.hypot(...vb.pol));
  const PA = polA(slagAr.pol);
  const PB = polB(slagBr.pol);
  // handen tillbaka i vilan
  const vilaA = (t) => [t, ...VILA_A];
  // handen i disken (slag: på vägen dit), en bit ovanför (studsen efter ett slag)
  const slagA = (t, slag = false) => [t, ...SLAG_A, slag];
  const slagB = (t, slag = false) => [t, ...SLAG_B, slag];
  const studsA = (t, h) => [t, [slagAr.W[0], slagAr.W[1] + h, slagAr.W[2]], ...SLAG_A.slice(1)];
  const studsB = (t, h) => [t, [slagBr.W[0], slagBr.W[1] + h, slagBr.W[2]], ...SLAG_B.slice(1)];
  // fingrarnas krok när han håller cigarren (ring- och lillfingret böjs mer, EXTRA_C)
  const KG = 0.3;
  // tummen (0 mot handen, 1 ut)
  const TUMME = 0.45;
  // I vilan ligger fingrarna lite samlade (SAMLA: 0 som när han gestikulerar, 1 raka bredvid varandra) och
  // den vänstra tummen intill handen, så att händerna inte når varandra. Det tonar bort när handen tar
  // något (bortA, bortB: 0–1, från cigarren, pennan och kaffet) och när han skrattar med armarna uppe, och
  // klippen börjar och slutar med det (form).
  const SAMLA = { A: VILAN.A.spar, B: VILAN.B.spar };
  const TUMME_VILA = { A: VILAN.A.tumme, B: VILAN.B.tumme };
  let bortA = 0;
  let bortB = 0;
  // kaffet: handen till koppens öra och tillbaka (mot) och fingrarna runt örat (krok), när koppen står
  // på fatet igen vid ned
  const grepp = (ned) => ({ mot: [0.1, 1.05, ned + 0.05, ned + 0.5], krok: [[0, 0.1], [1, 0.18], [1.2, 0.72], [ned, 0.72], [ned + 0.2, 0.18], [ned + 0.5, VILA_B[4]]] });
  const RORELSER = {
    // Näven: han blir tyst och allvarlig, knyter höger hand och lyfter den, håller den uppe en stund och
    // slår den i disken med lillfingersidan; tittar en rakt i ögonen och nickar.
    naven: {
      k: {
        yaw: [[0.4, 0.35], [1.6, 0.35], [2.2, 0.3]],
        pitch: [[0.35, 0], [0.9, 0.35], [1.6, 0.25], [1.72, 0.2], [1.82, 1.3], [2.1, 0.45], [2.35, 0.9], [2.65, 0.5]],
        roll: [[0.9, 0.06], [1.6, 0.06], [2.2, 0.04]],
        lut: [[0.4, 0], [1.5, 0.05], [1.74, 0.12], [2.1, 0.05]],
        vrid: [[0.4, 0], [1.5, -0.07], [1.74, 0.05], [2.2, 0.02]],
        axV: [[0.3, 0], [1.05, 26], [1.5, 40], [1.74, 4], [2.0, 8]],
        axH: [[1.5, 6], [1.74, -4], [2.0, 0]],
        brynX: [[0.35, 0], [0.7, -0.6], [1.6, -0.7], [1.8, 0.5], [2.6, 0.5]],
        brynY: [[0.35, 0], [0.7, -0.9], [1.6, -1.0], [1.8, -0.3], [2.6, -0.45]],
        kis: [[0.35, 0], [0.8, 0.4], [1.6, 0.45], [1.85, 0.1], [2.2, 0]],
        blund: [[1.7, 0], [1.76, 0.85], [1.92, 0]],
        munn: [[1.7, 0], [1.78, 0.08], [1.95, 0]],
        le: [[2.3, 0], [2.7, 0.3], [3.3, 0.18]],
      },
      A: [
        vilaA(0.35),
        [1.05, [-255, 70, 520], [-0.8, -0.6, 0.2], [0.1, 0.92, 0.38], [0.45, -0.1, -0.88], 0.95, 0],
        [1.5, [-262, 120, 505], [-0.8, -0.6, 0.2], [0.08, 0.95, 0.3], [0.45, -0.1, -0.88], 1, 0],
        [1.72, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0, true],
        [1.8, [-175, -214, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0],
        [1.95, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0],
        [2.7, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 0.95, 0],
        [3.25, [-150, -240, 590], PA, [0.75, -0.08, 0.65], [0.4, -0.9, -0.1], 0.5, 0],
      ],
    },
    // Tre slag med handflatan, varje gång lite högre upp ifrån och lite hårdare, och han nickar med.
    treslag: {
      k: {
        yaw: [[0.4, 0.3], [2.2, 0.3]],
        pitch: [[0.3, 0.1], [0.62, 0.1], [0.68, 0.9], [0.9, 0.2], [1.14, 0.2], [1.2, 1.0], [1.45, 0.15], [1.8, -0.1], [1.98, -0.1], [2.05, 1.3], [2.35, 0.45], [2.6, 0.8], [2.9, 0.5]],
        lut: [[0.62, 0.06], [0.9, 0.04], [1.14, 0.08], [1.45, 0.05], [1.8, 0.02], [2.0, 0.12], [2.4, 0.06]],
        vrid: [[0.3, -0.02], [1.8, -0.05], [2.0, 0.04], [2.4, 0.01]],
        axV: [[0.3, 10], [0.62, -2], [1.0, 16], [1.14, -2], [1.65, 30], [1.8, 34], [2.0, 2], [2.3, 6]],
        brynX: [[0.3, -0.4], [1.8, -0.5], [2.05, 0.7], [2.8, 0.6]],
        brynY: [[0.3, -0.8], [1.8, -0.9], [2.05, -0.2], [2.8, -0.45]],
        kis: [[0.3, 0.3], [1.9, 0.35], [2.2, 0]],
        blund: [[0.6, 0], [0.65, 0.8], [0.78, 0], [1.12, 0], [1.17, 0.8], [1.3, 0], [1.96, 0], [2.02, 0.9], [2.18, 0]],
        munn: [[0.6, 0], [0.66, 0.1], [0.8, 0], [1.12, 0], [1.18, 0.12], [1.3, 0], [1.96, 0], [2.04, 0.1], [2.25, 0]],
        le: [[2.7, 0], [3.1, 0.28], [3.8, 0.15]],
      },
      A: [
        [0.3, [-205, -100, 545], PA, [0.8, 0.3, 0.52], [0.2, -0.93, 0.3], 0.25, 0],
        slagA(0.62, true), studsA(0.7, 10), slagA(0.8),
        [1.0, [-215, -40, 530], PA, [0.78, 0.38, 0.5], [0.2, -0.9, 0.38], 0.25, 0],
        slagA(1.14, true), studsA(1.22, 12), slagA(1.32),
        [1.65, [-230, 70, 500], PA, [0.7, 0.5, 0.5], [0.25, -0.85, 0.45], 0.2, 0],
        [1.8, [-232, 85, 495], PA, [0.7, 0.5, 0.5], [0.25, -0.85, 0.45], 0.2, 0],
        slagA(1.98, true), studsA(2.07, 16), slagA(2.2), slagA(3.7),
      ],
    },
    // Båda händerna: han andas in, lutar sig bakåt med händerna lyfta, och slår båda i disken samtidigt.
    bada: {
      k: {
        yaw: [[0.5, 0.3], [2.4, 0.3]],
        pitch: [[0.55, -0.3], [1.02, -0.45], [1.22, -0.2], [1.3, 1.35], [1.6, 0.4], [1.9, 0.9], [2.2, 0.5]],
        lut: [[0.55, -0.04], [1.02, -0.06], [1.24, 0.13], [1.6, 0.06]],
        axV: [[0.55, 24], [1.02, 34], [1.24, -4], [1.6, 4]],
        axH: [[0.55, 24], [1.02, 34], [1.24, -4], [1.6, 2]],
        brynX: [[0.55, 0.4], [1.02, 0.6], [1.26, -0.2], [1.6, 0.6]],
        brynY: [[0.55, -0.4], [1.02, -0.3], [1.26, -0.9], [1.6, -0.45]],
        kis: [[1.0, 0], [1.24, 0.5], [1.7, 0.1], [2.2, 0]],
        blund: [[1.2, 0], [1.25, 0.9], [1.42, 0]],
        munn: [[0.5, 0], [0.8, 0.12], [1.02, 0.1], [1.2, 0], [1.27, 0.12], [1.5, 0]],
        rund: [[0.5, 0], [0.8, 0.5], [1.02, 0.4], [1.15, 0]],
        le: [[2.0, 0], [2.4, 0.3], [3.2, 0.15]],
      },
      A: [
        [0.55, [-235, -30, 520], PA, [0.72, 0.32, 0.6], [0.2, -0.92, 0.3], 0.2, 0],
        [1.02, [-240, 20, 500], PA, [0.7, 0.4, 0.58], [0.22, -0.9, 0.35], 0.2, 0],
        slagA(1.22, true), studsA(1.3, 14), slagA(1.45), slagA(3.1),
      ],
      B: [
        [0.55, [255, -30, 600], PB, [-0.68, 0.3, 0.66], [-0.2, -0.92, 0.3], 0.2, 0],
        [1.02, [262, 20, 585], PB, [-0.66, 0.4, 0.63], [-0.22, -0.9, 0.35], 0.2, 0],
        slagB(1.22, true), studsB(1.3, 14), slagB(1.45), slagB(3.3),
      ],
    },
    // Fingret: pekfingret upp bredvid ansiktet, en stöt fram mot en, och sedan handflatan i disken.
    fingret: {
      k: {
        yaw: [[0.45, 0.4], [2.0, 0.3]],
        pitch: [[0.45, 0.2], [0.95, 0.45], [1.35, 0.3], [1.62, 0], [1.86, 0], [1.93, 1.3], [2.2, 0.45], [2.45, 0.85], [2.75, 0.5]],
        roll: [[0.45, 0.06], [1.4, 0.08], [1.8, 0]],
        lut: [[0.45, 0.02], [0.95, 0.07], [1.62, 0.02], [1.88, 0.11], [2.2, 0.06]],
        vrid: [[0.45, -0.04], [0.95, -0.02], [1.88, 0.04], [2.3, 0.01]],
        axV: [[0.45, 20], [1.4, 22], [1.62, 22], [1.88, 0], [2.1, 4]],
        brynX: [[0.45, 0.8], [1.4, 0.9], [1.7, -0.3], [1.95, 0.6]],
        brynY: [[0.45, 0.2], [1.4, 0.2], [1.7, -0.9], [1.95, -0.45]],
        kis: [[0.45, 0.15], [1.4, 0.2], [1.9, 0.4], [2.3, 0]],
        blund: [[1.84, 0], [1.89, 0.85], [2.04, 0]],
        munn: [[1.84, 0], [1.9, 0.08], [2.1, 0]],
        le: [[2.5, 0], [2.9, 0.26], [3.6, 0.15]],
      },
      A: [
        [0.45, [-350, 240, 400], [-0.8, -0.75, 0.15], [0.2, 0.9, 0.38], [0.9, -0.1, -0.3], 0.62, 1],
        [0.95, [-335, 250, 470], [-0.8, -0.75, 0.15], [0.15, 0.82, 0.55], [0.9, -0.1, -0.3], 0.62, 1],
        [1.35, [-340, 248, 450], [-0.8, -0.75, 0.15], [0.15, 0.85, 0.5], [0.9, -0.1, -0.3], 0.62, 1],
        [1.62, [-250, 60, 500], PA, [0.75, 0.4, 0.52], [0.2, -0.9, 0.38], 0.2, 0],
        slagA(1.86, true), studsA(1.94, 14), slagA(2.08), slagA(3.7),
      ],
    },
    // Medan han pratar: handflatan upp och ned i disken, och en nick.
    dunka: {
      k: {
        pitch: [[0.38, -0.2], [0.62, -0.1], [0.68, 1.1], [0.95, 0.2], [1.3, 0]],
        lut: [[0.38, -0.01], [0.64, 0.06], [1.0, 0]],
        axV: [[0.38, 14], [0.64, -2], [1.0, 0]],
        brynX: [[0.38, 0.2], [0.68, -0.3], [1.2, 0]],
        blund: [[0.6, 0], [0.65, 0.7], [0.8, 0]],
      },
      A: [
        [0.38, [-215, -60, 540], PA, [0.78, 0.32, 0.53], [0.2, -0.93, 0.3], 0.25, 0],
        slagA(0.62, true), studsA(0.7, 10), slagA(0.85), slagA(1.25),
      ],
    },
    // Kaffet (se kaffeArm): koppens lägen (kk), hur mycket han lutar den mot läppen (tipp), och
    // lillfingret ut (lill), armbågen ut (arm) och koppen i små cirklar (snurr), 0–1.
    // En klunk, och han njuter: en ordentlig klunk med slutna ögon och huvudet bakåt, och sedan sänker
    // han koppen en bit, smackar och säger mmm med höjda bryn och ett brett leende medan huvudet
    // vaggar, innan han ställer ned den.
    klunk: {
      k: {
        dricker: [[1.7, 0], [2.1, 1], [3.05, 1], [3.4, 0]],
        pitch: [[2.0, 0], [2.6, -0.5], [3.0, -0.6], [3.5, 0.2], [3.9, -0.3], [5.4, -0.3], [6.0, 0]],
        yaw: [[3.7, 0], [4.15, 0.35], [4.6, -0.3], [5.05, 0.25], [5.5, 0]],
        roll: [[3.7, 0], [4.15, 0.1], [4.6, -0.09], [5.05, 0.07], [5.5, 0]],
        lut: [[3.4, 0], [3.9, -0.03], [5.4, -0.03], [6.0, 0]],
        axV: [[3.6, 0], [4.0, 10], [5.2, 8], [5.8, 0]],
        axH: [[3.6, 0], [4.0, 10], [5.2, 8], [5.8, 0]],
        brynX: [[3.5, 0], [3.9, 0.9], [5.3, 0.8], [5.9, 0]],
        brynY: [[3.5, 0], [3.9, 0.3], [5.3, 0.25], [5.9, 0]],
        blund: [[3.4, 0], [3.6, 0.9], [5.3, 0.85], [5.6, 0]],
        munn: [[3.45, 0], [3.55, 0.12], [3.65, 0], [3.78, 0.12], [3.88, 0]],
        rund: [[3.95, 0], [4.15, 0.35], [5.2, 0.3], [5.4, 0]],
        le: [[3.6, 0], [4.0, 0.6], [5.3, 0.55], [6.2, 0.2]],
      },
      kaffe: {
        // [t, läge, båge uppåt på vägen dit]
        kk: [[1.1, 'fat'], [2.0, 'mun', 70], [3.15, 'mun'], [3.6, 'ah'], [5.6, 'ah'], [6.35, 'fat', 25]],
        tipp: [[1.95, 0], [2.4, 0.5], [3.0, 0.62], [3.35, 0]],
        ...grepp(6.35),
      },
    },
    // Cigarren: se cigarrArm.
    cigarr: {
      k: {
        yaw: [[0.15, 0], [0.75, -0.55], [1.3, -0.4], [2.0, 0.05], [3.9, 0.05], [4.4, 0.2], [6.2, 0.2], [6.75, -0.6], [7.6, -0.55], [8.0, -0.5], [8.5, -0.55], [9.3, 0]],
        pitch: [[0.15, 0], [0.75, 0.75], [1.3, 0.5], [2.0, 0.25], [3.9, 0.25], [4.05, 0.1], [4.6, -1.0], [5.9, -1.0], [6.45, 0.1], [6.85, 0.35], [7.6, 0.35], [8.0, 0.75], [8.5, 0.8], [9.3, 0]],
        blickX: [[0.2, 0], [0.6, -3], [1.3, -2], [1.9, 0], [6.5, 0], [6.85, -4], [7.6, -4], [8.0, -3], [8.6, -3], [9.2, 0]],
        blickY: [[0.2, 0], [0.6, 4], [1.2, 3.5], [1.8, 0], [6.5, 0], [6.85, 1.5], [7.6, 1.5], [8.0, 4], [8.6, 4], [9.2, 0]],
        roll: [[6.4, 0], [6.9, 0.07], [7.6, 0.07], [8.0, 0]],
        lut: [[0.75, 0.03], [1.4, 0.01], [2, 0], [4.15, 0], [4.7, -0.05], [6.0, -0.05], [6.6, 0], [8.0, 0.02], [8.5, 0.03], [9.4, 0]],
        vrid: [[0.75, -0.07], [1.6, -0.02], [6.4, -0.02], [6.9, -0.06], [7.6, -0.06], [8.45, -0.07], [9.4, 0]],
        axV: [[1.2, 6], [2.0, 20], [3.9, 20], [4.6, 12], [6.3, 12], [6.9, 16], [7.6, 16], [8.2, 4], [9.2, 0]],
        brynX: [[2.15, 0], [2.5, 0.3], [3.8, 0.3], [4.4, 0.1], [6.1, 0.1], [6.75, 0.65], [7.6, 0.55], [8.1, 0]],
        brynY: [[2.15, 0], [2.5, 0.24], [3.8, 0.24], [4.4, 0.08], [6.1, 0.08], [6.75, 0.52], [7.6, 0.44], [8.1, 0]],
        blund: [[0.2, 0], [0.6, 0.28], [1.3, 0.2], [1.8, 0], [2.15, 0], [2.45, 0.5], [3.8, 0.5], [4.05, 0.25], [4.4, 0.85], [5.75, 0.85], [6.2, 0], [7.8, 0], [8.1, 0.28], [8.6, 0.28], [9.2, 0]],
        le: [[5.9, 0], [6.4, 0.45], [7.6, 0.35], [8.3, 0.08]],
        kis: [[6.0, 0], [6.4, 0.32], [6.9, 0.1]],
      },
      cig: {
        // [t, läge, båge uppåt på vägen dit]
        ck: [[1.0, 'vila'], [2.1, 'mun', 70], [3.9, 'mun'], [4.35, 'bort'], [4.95, 'hall'], [6.25, 'hall'], [6.9, 'se'], [7.6, 'se'], [8.45, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.3], [0.8, 0.2], [1.0, KG], [8.4, KG], [8.6, 0.14], [9.1, 0.2], [9.6, VILA_A[4]]],
        // fram till askkoppen och tillbaka, upp mot ansiktet och ned, och när fingrarna har den
        mot: [0.05, 0.85, 8.5, 9.4],
        upp: [1.0, 1.9, 7.7, 8.4],
        grepp: [0.8, 1.0, 8.4, 8.6],
        // glöden (två bloss), läpparna om cigarren, munnen när han blåser ut och pusten mellan blossen
        glod: [[2.2, 0], [2.5, 1], [2.95, 0.12], [3.25, 0.12], [3.55, 1], [3.85, 0]],
        iMun: [[1.95, 0], [2.15, 1], [3.9, 1], [4.05, 0]],
        blaser: [[4.15, 0], [4.35, 1], [5.9, 1], [6.3, 0]],
        pust: [[2.93, 0], [3.0, 1], [3.12, 1], [3.22, 0]],
        // röken: en pust i mungipan, och ut med den, mest i början
        rok: [{ fran: 2.95, till: 3.2, sort: 'pust' }, { fran: 4.25, till: 6.2, sort: 'blas', styrka: 75, avtag: 1.3 }],
      },
    },
    // Kaffet är varmt: han håller koppen under hakan och blåser på det tre gånger med runda läppar (ångan
    // far bort från honom), smakar försiktigt och rycker till av värmen, och tar sedan en riktig klunk och
    // ett långt ah med huvudet bakåt, slutna ögon och höjda bryn innan han ställer ned den.
    blasa: {
      k: {
        dricker: [[3.75, 0], [4.0, 0.6], [4.2, 0.6], [4.4, 0], [4.9, 0], [5.2, 1], [5.8, 1], [6.05, 0]],
        yaw: [[1.75, 0.2], [3.3, 0.2], [3.6, 0], [4.25, 0], [4.45, -0.3], [4.8, -0.2], [5.1, 0]],
        pitch: [[1.2, 0], [1.75, 0.8], [3.3, 0.8], [3.6, 0], [4.3, 0], [4.45, 0.35], [4.9, 0], [6.1, -0.3], [6.5, -1.7], [7.5, -1.6], [8.1, 0]],
        lut: [[4.25, 0], [4.4, -0.03], [4.9, 0], [6.1, 0], [6.5, -0.05], [7.5, -0.05], [8.1, 0]],
        axV: [[6.1, 0], [6.4, 14], [7.0, -8], [7.6, -6], [8.2, 0]],
        axH: [[4.25, 0], [4.4, 12], [4.9, 0], [6.1, 0], [6.4, 14], [7.0, -8], [7.6, -6], [8.2, 0]],
        munn: [[1.85, 0], [1.95, 0.2], [2.2, 0.12], [2.3, 0], [2.4, 0.2], [2.65, 0.12], [2.75, 0], [2.85, 0.2], [3.1, 0.12], [3.2, 0],
          [4.4, 0], [4.48, 0.16], [4.7, 0], [6.1, 0], [6.35, 0.6], [7.4, 0.5], [7.7, 0.1], [7.9, 0]],
        rund: [[1.8, 0], [1.9, 1], [3.15, 1], [3.3, 0], [6.1, 0], [6.35, 0.25], [7.4, 0.2], [7.7, 0]],
        brynX: [[4.3, 0], [4.45, 0.9], [4.9, 0], [6.1, 0], [6.4, 1.0], [7.4, 0.9], [8.0, 0]],
        brynY: [[4.3, 0], [4.45, 0.4], [4.9, 0], [6.1, 0], [6.4, 0.4], [7.4, 0.35], [8.0, 0]],
        kis: [[4.3, 0], [4.42, 0.7], [4.8, 0]],
        blund: [[6.1, 0], [6.3, 0.95], [7.5, 0.9], [7.8, 0]],
        le: [[7.3, 0], [7.7, 0.55], [8.4, 0.25]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [1.8, 'hake', 50], [3.3, 'hake'], [3.75, 'mun'], [5.9, 'mun'], [6.35, 'ah'], [7.9, 'ah'], [8.5, 'fat', 20]],
        tipp: [[3.75, 0], [4.0, 0.3], [4.25, 0.3], [4.45, 0.12], [4.9, 0.12], [5.25, 0.65], [5.8, 0.7], [6.1, 0]],
        ...grepp(8.5),
        // ångan: stiger ur koppen, och far bort när han blåser
        rok: [{ fran: 1.5, till: 3.4, sort: 'anga', styrka: 14 }, { fran: 1.92, till: 2.25, sort: 'anga', styrka: 60, blas: true },
          { fran: 2.4, till: 2.72, sort: 'anga', styrka: 60, blas: true }, { fran: 2.88, till: 3.2, sort: 'anga', styrka: 60, blas: true }],
      },
    },
    // Han lyfter koppen till bröstet och tittar ned i den med höjda bryn, snurrar den och nickar gillande,
    // och dricker ur den i ett svep med huvudet långt bakåt och armbågen ute; tittar förvånat ned i den
    // tomma koppen och ställer ned den med en smäll och ett brett leende.
    titta: {
      k: {
        dricker: [[3.95, 0], [4.25, 1], [5.55, 1], [5.85, 0]],
        yaw: [[1.3, 0.2], [1.8, 0.45], [3.0, 0.45], [3.6, 0], [5.9, 0], [6.3, 0.35], [7.0, 0.35], [7.5, 0]],
        pitch: [[1.3, 0.4], [1.8, 1.5], [2.9, 1.5], [3.1, 0.6], [3.3, 1.4], [3.55, 0.6], [3.9, 0], [4.4, -0.5], [5.1, -0.9], [5.5, -1.0], [5.95, 0], [6.3, 1.4], [7.0, 1.4], [7.5, 0.2], [8.0, -0.2], [8.6, 0]],
        lut: [[1.8, 0.04], [3.0, 0.04], [3.6, 0], [4.4, -0.03], [5.4, -0.06], [5.9, 0], [6.3, 0.04], [7.0, 0.04], [7.6, -0.02], [8.4, 0]],
        axH: [[4.3, 0], [5.0, 14], [5.6, 14], [6.0, 0]],
        brynX: [[1.8, 0], [2.1, 0.8], [3.0, 0.8], [3.6, 0.3], [5.9, 0], [6.25, 1.1], [7.0, 1.0], [7.5, 0]],
        brynY: [[1.8, 0], [2.1, 0.3], [3.0, 0.3], [3.6, 0], [5.9, 0], [6.25, 0.5], [7.0, 0.45], [7.5, 0]],
        kis: [[1.8, 0], [2.1, 0.2], [3.0, 0.2], [3.3, 0]],
        munn: [[6.2, 0], [6.4, 0.18], [6.9, 0.15], [7.1, 0]],
        rund: [[6.2, 0], [6.4, 0.6], [6.9, 0.6], [7.1, 0]],
        le: [[3.1, 0], [3.4, 0.35], [3.8, 0.1], [7.5, 0], [7.8, 0.65], [8.6, 0.3]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [1.8, 'brost', 30], [3.6, 'brost'], [4.1, 'mun', 40], [5.6, 'mun'], [6.15, 'brost'], [7.0, 'brost'], [7.55, 'fat', 15]],
        snurr: [[1.9, 0], [2.1, 1], [2.85, 1], [3.05, 0]],
        tipp: [[4.0, 0], [4.4, 0.6], [5.1, 0.95], [5.5, 1.0], [5.9, 0]],
        arm: [[4.1, 0], [4.8, 0.3], [5.5, 0.3], [6.0, 0]],
        ...grepp(7.55),
      },
    },
    // Ett bloss, och sedan ut med röken i en tunn stråle ur mungipan, med huvudet lite på sned och ett
    // höjt bryn, medan han tittar på en.
    bloss: {
      k: {
        yaw: [[0.15, 0], [0.75, -0.55], [1.3, -0.4], [2.0, 0.05], [3.3, 0.05], [3.8, 0.45], [5.4, 0.45], [6.0, 0.1], [6.4, -0.5], [6.9, -0.55], [7.6, 0]],
        pitch: [[0.15, 0], [0.75, 0.75], [1.3, 0.5], [2.0, 0.25], [3.3, 0.25], [3.8, -0.2], [5.4, -0.2], [6.0, 0.2], [6.4, 0.75], [6.9, 0.8], [7.6, 0]],
        blickX: [[0.2, 0], [0.6, -3], [1.3, -2], [1.9, 0], [6.0, 0], [6.4, -3], [6.9, -3], [7.5, 0]],
        blickY: [[0.2, 0], [0.6, 4], [1.2, 3.5], [1.8, 0], [6.0, 0], [6.4, 4], [6.9, 4], [7.5, 0]],
        roll: [[3.3, 0], [3.8, -0.06], [5.4, -0.06], [6.0, 0]],
        lut: [[0.75, 0.03], [1.4, 0.01], [2, 0], [3.3, 0], [3.8, -0.02], [5.5, -0.02], [6.4, 0.02], [6.9, 0.03], [7.7, 0]],
        vrid: [[0.75, -0.07], [1.6, -0.02], [5.6, -0.02], [6.85, -0.07], [7.7, 0]],
        axV: [[1.2, 6], [2.0, 20], [3.3, 20], [3.9, 12], [5.8, 12], [6.6, 4], [7.5, 0]],
        brynX: [[2.15, 0], [2.5, 0.2], [3.3, 0.2], [3.9, 0.1], [5.3, 0.1], [5.8, 0]],
        brynY: [[2.15, 0], [2.5, 0.16], [3.3, 0.16], [3.9, 0.7], [5.3, 0.7], [5.8, 0]],
        blund: [[0.2, 0], [0.6, 0.28], [1.3, 0.2], [1.8, 0], [2.15, 0], [2.45, 0.45], [3.3, 0.45], [3.5, 0], [6.1, 0], [6.4, 0.28], [6.9, 0.28], [7.5, 0]],
        le: [[3.9, 0], [4.3, 0.22], [5.4, 0.22], [5.9, 0.3], [6.4, 0.1]],
        kis: [[3.9, 0], [4.3, 0.25], [5.4, 0.25], [5.9, 0]],
      },
      cig: {
        ck: [[1.0, 'vila'], [2.1, 'mun', 70], [3.3, 'mun'], [3.7, 'bort'], [4.3, 'hall'], [5.9, 'hall'], [6.85, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.3], [0.8, 0.2], [1.0, KG], [6.75, KG], [6.95, 0.14], [7.45, 0.2], [7.9, VILA_A[4]]],
        mot: [0.05, 0.85, 6.9, 7.75],
        upp: [1.0, 1.9, 6.0, 6.75],
        grepp: [0.8, 1.0, 6.75, 6.95],
        glod: [[2.2, 0], [2.6, 1], [3.05, 0.85], [3.3, 0]],
        iMun: [[1.95, 0], [2.15, 1], [3.3, 1], [3.45, 0]],
        blaser: [[3.85, 0], [4.0, 0.55], [5.3, 0.55], [5.6, 0]],
        rok: [{ fran: 3.9, till: 5.5, sort: 'strale', styrka: 60, avtag: 0.8 }],
      },
    },
    // Ett bloss, och sedan tre rökringar med munnen som ett o. Han lutar sig bakåt och tittar efter dem,
    // nöjd, och lägger tillbaka cigarren.
    ringar: {
      k: {
        yaw: [[0.15, 0], [0.75, -0.55], [1.3, -0.4], [2.0, 0.05], [3.5, 0.05], [4.3, 0.75], [6.8, 0.75], [7.4, 0.55], [8.3, 0.45], [8.9, -0.3], [9.4, -0.45], [10.0, -0.55], [10.8, 0]],
        pitch: [[0.15, 0], [0.75, 0.75], [1.3, 0.5], [2.0, 0.25], [3.5, 0.25], [4.3, -0.4], [6.7, -0.4], [7.3, -0.9], [8.2, -0.75], [8.9, 0.3], [9.4, 0.4], [10.0, 0.8], [10.8, 0]],
        blickX: [[0.2, 0], [0.6, -3], [1.3, -2], [1.9, 0], [8.7, 0], [9.2, -3], [10.0, -3], [10.6, 0]],
        blickY: [[0.2, 0], [0.6, 4], [1.2, 3.5], [1.8, 0], [7.0, 0], [7.4, -2.5], [8.2, -2], [8.7, 0], [9.4, 2], [10.0, 4], [10.6, 0]],
        lut: [[0.75, 0.03], [1.4, 0.01], [2, 0], [3.6, 0], [4.3, -0.03], [6.7, -0.03], [7.4, -0.05], [8.2, -0.04], [9.0, 0], [10.0, 0.03], [10.9, 0]],
        vrid: [[0.75, -0.07], [1.6, -0.02], [8.6, -0.02], [9.4, -0.06], [10.0, -0.07], [10.9, 0]],
        axV: [[1.2, 6], [2.0, 20], [3.5, 20], [4.3, 14], [8.3, 14], [9.0, 16], [9.6, 10], [10.6, 0]],
        munn: [[4.6, 0], [4.8, 0.3], [4.95, 0.4], [5.08, 0.18], [5.6, 0.3], [5.75, 0.4], [5.88, 0.18], [6.4, 0.3], [6.55, 0.4], [6.68, 0.18], [7.0, 0]],
        rund: [[4.5, 0], [4.7, 1], [6.75, 1], [7.05, 0]],
        brynX: [[7.0, 0], [7.4, 0.7], [8.2, 0.6], [8.8, 0]],
        brynY: [[7.0, 0], [7.4, 0.56], [8.2, 0.48], [8.8, 0]],
        le: [[7.1, 0], [7.5, 0.5], [8.3, 0.4], [8.9, 0.1]],
        kis: [[7.1, 0], [7.5, 0.3], [8.3, 0.25], [8.9, 0]],
        blund: [[0.2, 0], [0.6, 0.28], [1.3, 0.2], [1.8, 0], [2.15, 0], [2.45, 0.4], [3.4, 0.4], [3.6, 0], [9.6, 0], [10.0, 0.28], [10.6, 0]],
      },
      cig: {
        ck: [[1.0, 'vila'], [2.1, 'mun', 70], [3.5, 'mun'], [3.9, 'bort'], [4.5, 'hall'], [8.4, 'hall'], [8.9, 'se'], [9.3, 'se'], [9.95, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.3], [0.8, 0.2], [1.0, KG], [9.9, KG], [10.1, 0.14], [10.6, 0.2], [10.95, VILA_A[4]]],
        mot: [0.05, 0.85, 10.0, 10.85],
        upp: [1.0, 1.9, 9.2, 9.9],
        grepp: [0.8, 1.0, 9.9, 10.1],
        glod: [[2.2, 0], [2.55, 1], [2.95, 0.35], [3.1, 1], [3.45, 0]],
        iMun: [[1.95, 0], [2.15, 1], [3.5, 1], [3.65, 0]],
        rok: [{ t: 4.95, sort: 'ring' }, { t: 5.75, sort: 'ring' }, { t: 6.55, sort: 'ring' }, { fran: 6.8, till: 8.0, sort: 'blas', styrka: 16, avtag: 1.2 }],
      },
    },
    // Han tar cigarren och knackar av askan över askkoppen med två korta ryck, tittar på glöden, drar ett
    // bloss och blåser ut röken genom näsan med halvslutna ögon.
    aska: {
      k: {
        yaw: [[0.15, 0], [0.75, -0.55], [1.3, -0.5], [2.8, -0.55], [3.3, -0.5], [3.8, -0.5], [4.4, 0.05], [5.8, 0.05], [6.2, 0.55], [7.9, 0.5], [8.6, 0], [9.1, -0.45], [9.6, -0.55], [10.4, 0]],
        pitch: [[0.15, 0], [0.75, 0.8], [1.3, 0.75], [2.8, 0.8], [3.3, 0.4], [3.8, 0.35], [4.4, 0.25], [5.7, 0.25], [6.1, -0.5], [7.8, -0.5], [8.4, 0], [9.1, 0.75], [9.6, 0.8], [10.4, 0]],
        blickX: [[0.2, 0], [0.6, -3], [2.8, -3], [3.3, -4], [3.8, -4], [4.3, 0], [8.8, 0], [9.2, -3], [9.6, -3], [10.3, 0]],
        blickY: [[0.2, 0], [0.6, 4.5], [2.8, 4.5], [3.3, 1.5], [3.8, 1.5], [4.3, 0], [8.8, 0], [9.2, 4], [9.6, 4], [10.3, 0]],
        lut: [[0.75, 0.03], [1.4, 0.04], [2.8, 0.04], [3.3, 0.01], [6.1, -0.03], [7.8, -0.03], [8.4, 0], [9.3, 0.03], [10.4, 0]],
        vrid: [[0.75, -0.07], [2.8, -0.08], [3.4, -0.04], [6.4, -0.02], [8.6, -0.04], [9.5, -0.07], [10.4, 0]],
        axV: [[1.2, 4], [2.8, 6], [3.6, 14], [4.4, 20], [5.7, 22], [6.3, 12], [8.2, 12], [9.2, 2]],
        brynX: [[2.9, 0], [3.4, 0.5], [3.9, 0.45], [4.5, 0.1], [6.1, 0.2], [7.8, 0.2], [8.4, 0]],
        brynY: [[2.9, 0], [3.4, 0.4], [3.9, 0.36], [4.5, 0.08], [6.1, 0.16], [7.8, 0.16], [8.4, 0]],
        blund: [[0.2, 0], [0.6, 0.28], [2.8, 0.28], [3.2, 0], [4.65, 0], [4.9, 0.5], [5.6, 0.5], [6.0, 0.3], [6.3, 0.65], [7.6, 0.65], [8.0, 0], [8.8, 0], [9.2, 0.28], [9.6, 0.28], [10.3, 0]],
        le: [[3.2, 0], [3.5, 0.25], [3.9, 0.2], [4.3, 0], [7.6, 0], [8.0, 0.4], [9.0, 0.25], [9.8, 0.05]],
        kis: [[7.8, 0], [8.0, 0.25], [8.6, 0.05]],
      },
      cig: {
        ck: [[1.0, 'vila'], [1.85, 'knack', 45], [2.08, 'knackN'], [2.22, 'knack'], [2.46, 'knackN'], [2.6, 'knack'], [3.2, 'se'], [3.8, 'se'], [4.6, 'mun', 40], [5.7, 'mun'], [6.1, 'bort'], [6.7, 'hall'], [8.6, 'hall'], [9.5, 'vila', 90]],
        krok: [[0, VILA_A[4]], [0.5, 0.3], [0.8, 0.2], [1.0, KG], [9.4, KG], [9.6, 0.14], [10.1, 0.2], [10.6, VILA_A[4]]],
        mot: [0.05, 0.85, 9.55, 10.4],
        upp: [3.0, 3.8, 8.7, 9.4],
        grepp: [0.8, 1.0, 9.4, 9.6],
        glod: [[4.7, 0], [5.05, 1], [5.45, 0.85], [5.7, 0]],
        iMun: [[4.45, 0], [4.65, 1], [5.7, 1], [5.85, 0]],
        rok: [{ t: 2.08, sort: 'aska' }, { t: 2.46, sort: 'aska' }, { fran: 6.0, till: 7.9, sort: 'nasa', styrka: 60, avtag: 0.9 }],
      },
    },
    // Doften: koppen under näsan, och han blundar och drar in den länge, så att ångan sugs mot näsan,
    // bröstet häver sig och axlarna åker upp, med huvudet bakåt och brynen högt; andas ut med ett saligt
    // leende, tar en liten klunk och nickar långsamt med slutna ögon.
    dofta: {
      k: {
        dricker: [[4.75, 0], [5.05, 0.8], [5.75, 0.8], [6.0, 0]],
        pitch: [[1.4, 0], [2.0, 0.5], [2.3, 0.3], [3.7, -0.9], [4.1, -0.7], [4.6, 0], [6.1, 0], [6.5, 0.7], [6.9, 0.1], [7.3, 0.6], [7.7, 0.1], [8.4, 0]],
        roll: [[2.3, 0], [3.7, 0.08], [4.4, 0.04], [4.9, 0]],
        lut: [[2.2, 0], [3.7, -0.06], [4.2, -0.02], [4.8, 0]],
        axV: [[2.2, 0], [3.7, 34], [4.2, 4], [4.7, -4], [5.5, 0]],
        axH: [[2.2, 0], [3.7, 34], [4.2, 4], [4.7, -4], [5.5, 0]],
        brynX: [[2.2, 0], [3.6, 1.0], [4.3, 0.9], [4.9, 0.2], [6.2, 0.2], [6.6, 0.7], [8.0, 0.5], [8.6, 0]],
        brynY: [[2.2, 0], [3.6, 0.45], [4.3, 0.4], [4.9, 0.1], [6.2, 0.1], [6.6, 0.3], [8.0, 0.2], [8.6, 0]],
        blund: [[2.0, 0], [2.3, 0.95], [4.5, 0.9], [4.8, 0.3], [6.2, 0.3], [6.5, 0.85], [7.9, 0.8], [8.3, 0]],
        munn: [[3.8, 0], [4.0, 0.14], [4.4, 0.1], [4.6, 0]],
        le: [[2.6, 0], [3.7, 0.35], [4.1, 0.7], [4.7, 0.6], [5.0, 0.2], [6.1, 0.3], [6.5, 0.65], [8.0, 0.55], [8.8, 0.2]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [2.0, 'nasa', 70], [4.5, 'nasa'], [4.85, 'mun'], [5.9, 'mun'], [6.35, 'ah'], [7.9, 'ah'], [8.55, 'fat', 20]],
        tipp: [[4.8, 0], [5.1, 0.45], [5.7, 0.5], [6.0, 0]],
        ...grepp(8.55),
        rok: [{ fran: 1.4, till: 2.2, sort: 'anga', styrka: 16 }, { fran: 2.2, till: 3.7, sort: 'anga', styrka: 30, sug: true }, { fran: 3.7, till: 4.6, sort: 'anga', styrka: 16 }],
      },
    },
    // Skål: han lyfter koppen mot en med ett brett leende och en nick, tar en stor klunk med huvudet
    // bakåt och armbågen högt, och ställer ned koppen med en smäll och ett nöjt ah.
    skal: {
      k: {
        dricker: [[3.75, 0], [4.05, 1], [5.2, 1], [5.5, 0]],
        yaw: [[1.4, 0], [2.1, 0.3], [3.3, 0.3], [3.8, 0]],
        pitch: [[1.5, 0], [2.2, -0.3], [2.55, 0.9], [2.9, 0.1], [3.3, 0], [4.2, -0.6], [5.0, -0.9], [5.5, -0.3], [6.6, -0.4], [7.2, 0.4], [7.7, 0]],
        lut: [[1.5, 0], [2.2, 0.05], [3.2, 0.04], [3.7, 0], [4.6, -0.05], [5.3, -0.06], [5.8, 0]],
        axH: [[1.6, 0], [2.2, 26], [3.2, 22], [3.8, 8], [5.0, 26], [5.5, 0]],
        brynX: [[1.5, 0], [2.1, 0.9], [3.2, 0.8], [3.7, 0], [5.6, 0], [5.9, 0.8], [6.8, 0.6], [7.4, 0]],
        brynY: [[1.5, 0], [2.1, 0.3], [3.2, 0.25], [3.7, 0], [5.6, 0], [5.9, 0.3], [6.8, 0.2], [7.4, 0]],
        kis: [[2.0, 0], [2.4, 0.35], [3.2, 0.3], [3.6, 0]],
        blund: [[2.5, 0], [2.6, 0.9], [2.75, 0], [5.6, 0], [5.8, 0.85], [6.7, 0.8], [7.0, 0]],
        munn: [[5.55, 0], [5.8, 0.55], [6.6, 0.45], [6.9, 0]],
        rund: [[5.55, 0], [5.8, 0.2], [6.6, 0.15], [6.9, 0]],
        le: [[1.6, 0], [2.2, 0.75], [3.3, 0.7], [3.7, 0.2], [6.6, 0.2], [7.0, 0.7], [7.9, 0.4]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [2.1, 'skal', 40], [3.25, 'skal'], [3.85, 'mun', 30], [5.3, 'mun'], [5.75, 'ah'], [6.7, 'ah'], [7.25, 'fat', 10]],
        tipp: [[3.8, 0], [4.2, 0.6], [5.0, 0.9], [5.25, 0.9], [5.55, 0]],
        arm: [[1.4, 0], [2.1, 0.5], [3.3, 0.4], [4.3, 0.3], [5.3, 0.3], [5.8, 0]],
        ...grepp(7.25),
      },
    },
    // Fint: lillfingret rakt ut och armbågen ute, näsan i vädret och halvslutna ögon, två små läppjanden
    // med munnen i en trut emellan, och sedan smackar han eftertänksamt och nickar gillande, som en
    // vinprovare.
    fint: {
      k: {
        dricker: [[2.1, 0], [2.35, 0.55], [2.85, 0.55], [3.05, 0], [4.25, 0], [4.5, 0.55], [5.0, 0.55], [5.2, 0]],
        pitch: [[1.3, 0], [2.0, -0.7], [5.3, -0.7], [5.9, -0.5], [6.3, 0.3], [6.6, -0.4], [6.9, 0.3], [7.3, -0.2], [8.2, 0]],
        yaw: [[1.3, 0], [2.0, -0.25], [5.3, -0.25], [5.8, 0.2], [7.0, 0.2], [7.6, 0]],
        roll: [[1.3, 0], [2.0, -0.06], [5.3, -0.06], [5.8, 0]],
        lut: [[1.3, 0], [2.0, -0.03], [5.3, -0.03], [5.8, 0]],
        brynX: [[1.3, 0], [2.0, 0.9], [5.3, 0.9], [5.8, 0.4], [7.2, 0.4], [7.8, 0]],
        brynY: [[1.3, 0], [2.0, 0.4], [5.3, 0.4], [5.8, 0.1], [7.8, 0]],
        kis: [[1.3, 0], [2.0, 0.55], [5.3, 0.55], [5.6, 0.2], [7.6, 0]],
        munn: [[5.4, 0], [5.5, 0.1], [5.6, 0], [5.75, 0.1], [5.85, 0], [6.0, 0.1], [6.1, 0]],
        rund: [[3.1, 0], [3.3, 0.8], [3.9, 0.8], [4.1, 0], [6.1, 0], [6.3, 0.9], [7.4, 0.8], [7.7, 0]],
        le: [[7.4, 0], [7.8, 0.4], [8.4, 0.2]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [2.1, 'mun', 60], [3.1, 'mun'], [3.45, 'lyft'], [4.0, 'lyft'], [4.3, 'mun'], [5.2, 'mun'], [5.6, 'ah'], [7.4, 'ah'], [8.1, 'fat', 15]],
        tipp: [[2.1, 0], [2.35, 0.35], [2.85, 0.35], [3.05, 0], [4.3, 0], [4.5, 0.4], [5.0, 0.4], [5.2, 0]],
        lill: [[1.2, 0], [1.9, 1], [7.7, 1], [8.1, 0]],
        arm: [[1.2, 0], [2.0, 0.55], [7.5, 0.55], [8.1, 0]],
        ...grepp(8.1),
      },
    },
  };
  // Ett cigarrklipp där han njuter: han tittar ned och tar cigarren ur askkoppen (0–2), och lägger
  // tillbaka den så att den ligger där vid E. k och cig är det som händer däremellan; början och slutet
  // fylls i här (av början det som kommer före klippets första nyckel i en kanal, av slutet det som kommer
  // efter den sista). Klippet är E + 1,4 s långt.
  const CIG_START = {
    yaw: [[0.15, 0], [0.75, -0.55], [1.3, -0.4], [2.0, 0.05]],
    pitch: [[0.15, 0], [0.75, 0.75], [1.3, 0.5], [2.0, 0.25]],
    lut: [[0.75, 0.03], [1.4, 0.01], [2.0, 0]],
    vrid: [[0.75, -0.07], [1.6, -0.02]],
    axV: [[1.2, 6], [2.0, 20]],
    blickX: [[0.2, 0], [0.6, -3], [1.3, -2], [1.9, 0]],
    blickY: [[0.2, 0], [0.6, 4], [1.2, 3.5], [1.8, 0]],
    blund: [[0.2, 0], [0.6, 0.28], [1.3, 0.2], [1.8, 0]],
  };
  const cigSlut = (E) => ({
    yaw: [[E - 0.45, -0.5], [E + 0.05, -0.55], [E + 0.85, 0]],
    pitch: [[E - 0.45, 0.75], [E + 0.05, 0.8], [E + 0.85, 0]],
    lut: [[E - 0.45, 0.02], [E + 0.05, 0.03], [E + 0.95, 0]],
    vrid: [[E - 0.45, -0.06], [E, -0.07], [E + 0.95, 0]],
    axV: [[E - 0.25, 4], [E + 0.75, 0]],
    blickX: [[E - 0.75, 0], [E - 0.35, -3], [E + 0.15, -3], [E + 0.75, 0]],
    blickY: [[E - 0.75, 0], [E - 0.35, 4], [E + 0.15, 4], [E + 0.75, 0]],
    blund: [[E - 0.7, 0], [E - 0.35, 0.28], [E + 0.15, 0.28], [E + 0.75, 0]],
  });
  function cigarrKlipp(E, k, cig) {
    const S = cigSlut(E);
    const ut = {};
    for (const x of new Set([...Object.keys(CIG_START), ...Object.keys(k), ...Object.keys(S)])) {
      const m = k[x] || [];
      const a = m.length ? m[0][0] : Infinity;
      const b = m.length ? m[m.length - 1][0] : -Infinity;
      ut[x] = [...(CIG_START[x] || []).filter((p) => p[0] < a), ...m, ...(S[x] || []).filter((p) => p[0] > b)];
    }
    return {
      k: ut,
      cig: {
        ...cig,
        ck: [[1.0, 'vila'], ...cig.ck, [E, 'vila', 90]],
        krok: cig.krok || [[0, VILA_A[4]], [0.5, 0.3], [0.8, 0.2], [1.0, KG], [E - 0.05, KG], [E + 0.15, 0.14], [E + 0.65, 0.2], [E + 1.15, VILA_A[4]]],
        mot: cig.mot || [0.05, 0.85, E + 0.05, E + 0.9],
        upp: cig.upp || [1.0, 1.9, E - 0.75, E - 0.05],
        grepp: cig.grepp || [0.8, 1.0, E - 0.05, E + 0.15],
      },
    };
  }
  Object.assign(RORELSER, {
    // Det långa blosset: han drar länge och långsamt med ögonen som sluts och axlarna som stiger, håller
    // röken en stund, lutar huvudet bakåt och blåser ut den länge medan axlarna sjunker. Sedan ah: ett
    // brett leende och en liten skakning på huvudet, och han tittar nöjt på cigarren och nickar.
    lang: cigarrKlipp(13.4, {
      yaw: [[2.0, 0.05], [5.2, 0.05], [6.8, 0.3], [8.8, 0.3], [9.4, 0.3], [9.75, 0.05], [10.1, 0.3], [10.45, 0.1], [10.9, 0.05], [11.3, -0.45], [12.4, -0.45]],
      pitch: [[2.0, 0.25], [5.2, -0.15], [6.0, -0.15], [6.9, -1.0], [8.7, -1.0], [9.5, 0], [10.6, 0], [11.2, 0.3], [11.55, 0.6], [11.85, 0.3], [12.1, 0.55], [12.4, 0.35]],
      lut: [[2.0, 0], [5.2, -0.03], [6.9, -0.05], [8.8, -0.05], [9.6, -0.01]],
      axV: [[2.0, 20], [3.6, 30], [5.2, 34], [6.4, 34], [9.0, 8], [9.8, 12], [10.6, 14]],
      brynX: [[2.4, 0], [3.6, 0.35], [6.2, 0.4], [6.9, 0.15], [8.7, 0.15], [9.4, 0.7], [10.4, 0.55], [11.0, 0.2], [11.5, 0.5], [12.6, 0.2]],
      brynY: [[2.4, 0], [3.6, 0.3], [6.2, 0.32], [6.9, 0.12], [8.7, 0.12], [9.4, 0.6], [10.4, 0.45], [11.0, 0.16], [11.5, 0.4], [12.6, 0.16]],
      blund: [[2.15, 0], [2.8, 0.55], [4.2, 0.85], [8.7, 0.85], [9.4, 0.35], [10.6, 0.3], [11.0, 0]],
      kis: [[9.0, 0], [9.5, 0.35], [10.6, 0.3], [11.0, 0.1]],
      le: [[5.5, 0], [6.2, 0.15], [8.7, 0.1], [9.4, 0.6], [10.6, 0.55], [11.2, 0.35], [12.6, 0.3]],
      munn: [[5.45, 0], [5.6, 0.04], [5.8, 0], [6.0, 0.05], [6.2, 0]],
      blickX: [[10.9, 0], [11.3, -4], [12.4, -4]],
      blickY: [[10.9, 0], [11.3, 1.5], [12.4, 1.5]],
    }, {
      ck: [[2.1, 'mun', 70], [5.2, 'mun'], [5.65, 'bort'], [6.3, 'hall'], [10.6, 'hall'], [11.1, 'se'], [12.4, 'se']],
      glod: [[2.2, 0], [2.9, 0.7], [4.0, 1], [5.05, 1], [5.5, 0]],
      iMun: [[1.95, 0], [2.15, 1], [5.2, 1], [5.35, 0]],
      blaser: [[6.35, 0], [6.6, 0.8], [8.4, 0.7], [8.9, 0]],
      rok: [{ fran: 6.45, till: 8.9, sort: 'blas', styrka: 95, avtag: 0.45, fart: 0.8 }],
    }),
    // Han drar ett bloss och blåser ut röken, och sedan lutar han sig bakåt med cigarren i handen och
    // blundar en lång stund: andas djupt och långsamt, med ett leende som växer och röken som ringlar upp
    // från glöden bredvid honom. Han öppnar ögonen, nickar nöjt mot en och lägger tillbaka den.
    luta: cigarrKlipp(13.0, {
      yaw: [[2.0, 0.05], [3.4, 0.05], [3.9, 0.35], [5.2, 0.35], [6.0, 0.15], [10.2, 0.2], [10.8, 0.05], [11.6, 0.05]],
      pitch: [[2.0, 0.25], [3.4, 0.25], [3.9, -0.3], [5.2, -0.3], [6.2, -0.75], [10.2, -0.7], [10.8, 0], [11.1, 0.4], [11.4, 0.05], [11.7, 0.3], [12.0, 0.1]],
      roll: [[5.0, 0], [6.2, 0.07], [10.2, 0.06], [10.9, 0]],
      lut: [[2.0, 0], [3.4, 0], [5.0, -0.02], [6.4, -0.065], [10.2, -0.065], [11.0, 0]],
      vrid: [[5.0, -0.02], [6.4, 0.02], [10.2, 0.02], [11.0, 0]],
      axV: [[2.0, 20], [3.4, 26], [4.4, 14], [5.6, 6], [6.8, 22], [8.0, 6], [9.2, 22], [10.4, 8], [11.2, 12]],
      brynX: [[3.4, 0], [4.0, 0.25], [5.4, 0.2], [6.4, 0.3], [10.2, 0.3], [10.8, 0.6], [11.6, 0.3]],
      brynY: [[3.4, 0], [4.0, 0.2], [5.4, 0.16], [6.4, 0.25], [10.2, 0.25], [10.8, 0.5], [11.6, 0.24]],
      blund: [[2.15, 0], [2.45, 0.45], [3.3, 0.45], [3.9, 0.75], [5.2, 0.7], [6.0, 0.92], [10.2, 0.92], [10.7, 0.15], [11.6, 0.1]],
      le: [[4.6, 0], [5.4, 0.15], [7.0, 0.3], [9.4, 0.45], [10.2, 0.5], [10.9, 0.55], [11.8, 0.35]],
      kis: [[10.5, 0], [10.9, 0.3], [11.8, 0.15]],
      munn: [[7.9, 0], [8.05, 0.05], [8.5, 0.05], [8.7, 0]],
    }, {
      ck: [[2.1, 'mun', 70], [3.3, 'mun'], [3.7, 'bort'], [4.3, 'hall'], [11.6, 'hall']],
      glod: [[2.2, 0], [2.6, 1], [3.05, 0.85], [3.3, 0.2], [6.0, 0.2], [11.6, 0.15], [12.6, 0]],
      iMun: [[1.95, 0], [2.15, 1], [3.3, 1], [3.45, 0]],
      blaser: [[3.8, 0], [4.0, 0.7], [5.0, 0.6], [5.3, 0]],
      rok: [{ fran: 3.85, till: 5.3, sort: 'blas', styrka: 85, avtag: 0.9 }],
    }),
    // Tänderna: han biter om cigarren i mungipan och släpper den, och sitter nöjd med händerna på disken,
    // lutar sig lite bakåt och puffar, med röken ur andra mungipan, innan han tar den igen.
    tand: cigarrKlipp(15.0, {
      yaw: [[2.0, 0.05], [3.4, 0.05], [4.4, 0.3], [7.0, 0.35], [9.0, 0.2], [11.2, 0.3], [12.0, 0.05]],
      pitch: [[2.0, 0.25], [3.4, 0.2], [4.6, -0.35], [6.8, -0.3], [7.1, -0.05], [7.4, -0.3], [9.4, -0.35], [11.4, -0.25], [12.0, 0.2], [12.7, -0.2], [14.0, -0.1]],
      roll: [[3.4, 0], [4.6, 0.05], [10.8, 0.05], [11.6, 0]],
      lut: [[2.0, 0], [3.6, 0], [4.8, -0.045], [11.0, -0.045], [12.0, 0]],
      axV: [[2.0, 20], [3.4, 20], [4.6, 2], [5.4, 8], [6.4, 4], [7.6, 9], [8.6, 4], [9.6, 9], [10.8, 4], [12.0, 14]],
      brynX: [[4.0, 0], [4.8, 0.25], [10.8, 0.25], [11.6, 0], [13.0, 0.35]],
      brynY: [[4.0, 0], [4.8, 0.2], [10.8, 0.2], [11.6, 0], [13.0, 0.3]],
      blund: [[2.15, 0], [2.45, 0.45], [3.0, 0.45], [3.3, 0], [4.4, 0], [5.0, 0.45], [5.4, 0.6], [6.2, 0.45], [7.6, 0.6], [8.4, 0.45], [9.6, 0.6], [10.5, 0.45], [11.2, 0], [12.8, 0], [13.1, 0.6], [13.9, 0.5], [14.2, 0]],
      le: [[3.3, 0], [4.6, 0.32], [10.8, 0.32], [11.4, 0.15], [13.3, 0.35]],
      kis: [[4.6, 0], [5.2, 0.2], [10.8, 0.2], [11.4, 0]],
      munn: [[3.3, 0], [3.5, 0.03], [5.95, 0.03], [6.05, 0.1], [6.4, 0.1], [6.5, 0.03], [8.25, 0.03], [8.35, 0.1], [8.7, 0.1], [8.8, 0.03], [10.35, 0.03], [10.45, 0.1], [10.8, 0.1], [10.9, 0.03], [12.0, 0.03], [12.1, 0]],
    }, {
      ck: [[2.1, 'mun', 70], [3.0, 'mun'], [3.35, 'tand'], [12.1, 'tand'], [12.6, 'bort'], [13.2, 'hall'], [14.0, 'hall']],
      // handen släpper den och lägger sig på disken (mot 0), och kommer tillbaka och tar den
      mot: [[0.05, 0], [0.85, 1], [3.4, 1], [4.3, 0], [11.3, 0], [12.1, 1], [15.05, 1], [15.9, 0]],
      upp: [[1.0, 0], [1.9, 1], [3.4, 1], [4.3, 0], [11.3, 0], [12.0, 1], [14.25, 1], [14.95, 0]],
      grepp: [[0.8, 0], [1.0, 1], [3.35, 1], [3.55, 0], [11.95, 0], [12.1, 1], [14.95, 1], [15.15, 0]],
      krok: [[0, VILA_A[4]], [0.5, 0.3], [0.8, 0.2], [1.0, KG], [3.35, KG], [3.6, 0.15], [4.3, VILA_A[4]], [11.3, VILA_A[4]], [11.6, 0.12], [11.95, 0.12], [12.1, KG], [14.95, KG], [15.15, 0.14], [15.65, 0.2], [16.15, VILA_A[4]]],
      glod: [[2.2, 0], [2.5, 1], [2.95, 0.2], [3.4, 0.12], [5.3, 0.12], [5.6, 0.9], [6.0, 0.15], [7.6, 0.15], [7.9, 0.9], [8.3, 0.15], [9.7, 0.15], [10.0, 0.85], [10.4, 0.12], [12.0, 0.1], [12.5, 0]],
      iMun: [[1.95, 0], [2.15, 1], [3.0, 1], [3.3, 0]],
      blaser: [[12.65, 0], [12.85, 0.6], [13.9, 0.5], [14.2, 0]],
      rok: [{ fran: 6.05, till: 6.5, sort: 'strale', styrka: 30, avtag: 1 }, { fran: 8.35, till: 8.8, sort: 'strale', styrka: 30, avtag: 1 }, { fran: 10.45, till: 10.9, sort: 'strale', styrka: 30, avtag: 1 }, { fran: 12.7, till: 14.2, sort: 'blas', styrka: 60, avtag: 1.0 }],
    }),
    // Han håller upp cigarren och beundrar den: rullar den mellan fingrarna med höjda bryn och mun som
    // säger hm, nickar gillande, och tar ett bloss med röken i en stråle ur mungipan.
    beundra: cigarrKlipp(11.6, {
      yaw: [[2.0, -0.5], [5.6, -0.55], [6.3, 0.05], [7.6, 0.05], [8.1, 0.45], [9.4, 0.45], [10.2, 0.1]],
      pitch: [[2.0, 0.35], [4.3, 0.3], [4.6, 0.65], [4.9, 0.3], [5.2, 0.6], [5.5, 0.3], [6.3, 0.25], [7.6, 0.25], [8.1, -0.2], [9.4, -0.2], [9.9, 0.3], [10.2, 0.1]],
      roll: [[2.0, 0.04], [4.2, 0.05], [5.6, 0]],
      axV: [[2.0, 22], [5.6, 22], [6.4, 20], [7.6, 26], [8.4, 14]],
      brynX: [[2.0, 0.2], [2.6, 0.7], [4.3, 0.75], [5.0, 0.35], [6.4, 0.1], [7.6, 0.2], [8.1, 0.65], [9.4, 0.6], [10.0, 0.2]],
      brynY: [[2.0, 0.15], [2.6, 0.55], [4.3, 0.6], [5.0, 0.28], [6.4, 0.08], [7.6, 0.16], [8.1, 0.5], [9.4, 0.48], [10.0, 0.16]],
      rund: [[2.6, 0], [3.0, 0.4], [4.2, 0.4], [4.5, 0]],
      munn: [[2.6, 0], [3.0, 0.04], [4.2, 0.04], [4.5, 0]],
      le: [[4.3, 0], [4.8, 0.4], [5.8, 0.3], [6.4, 0], [8.1, 0.2], [9.4, 0.3], [10.0, 0.45]],
      blund: [[6.45, 0], [6.75, 0.5], [7.6, 0.5], [7.8, 0]],
      blickX: [[1.9, -2], [2.3, -6], [5.4, -6], [5.9, 0]],
      blickY: [[1.9, 1], [2.3, 3.5], [5.4, 3.5], [5.9, 0]],
    }, {
      ck: [[2.0, 'visa', 40], [5.6, 'visa'], [6.4, 'mun', 30], [7.6, 'mun'], [8.0, 'bort'], [8.6, 'hall'], [10.6, 'hall']],
      rull: [[2.2, 0], [2.9, 0.6], [3.6, -0.35], [4.3, 0.45], [5.0, 0]],
      glod: [[6.6, 0], [6.95, 1], [7.4, 0.85], [7.7, 0]],
      iMun: [[6.3, 0], [6.5, 1], [7.6, 1], [7.75, 0]],
      blaser: [[8.1, 0], [8.25, 0.5], [9.3, 0.5], [9.6, 0]],
      rok: [{ fran: 8.15, till: 9.5, sort: 'strale', styrka: 60, avtag: 0.8 }],
    }),
    // Tre korta bloss i rad med kisande ögon och lite rök ur mungipan efter vart och ett, sedan ut med ett
    // nöjt moln med huvudet bakåt, ett brett leende och ett litet skratt, och en blick på cigarren.
    puffar: cigarrKlipp(9.8, {
      yaw: [[2.0, 0.05], [4.6, 0.05], [5.4, 0.3], [6.4, 0.3], [7.0, 0.1], [7.6, 0.1], [8.2, -0.45], [8.9, -0.45]],
      pitch: [[2.0, 0.25], [4.6, 0.2], [5.4, -0.8], [6.4, -0.8], [6.9, 0], [7.6, 0], [8.2, 0.35], [8.5, 0.55], [8.9, 0.35]],
      lut: [[2.0, 0], [4.6, 0], [5.4, -0.04], [6.4, -0.04], [7.0, 0]],
      axV: [[2.0, 20], [2.5, 24], [2.75, 20], [3.2, 24], [3.45, 20], [3.9, 26], [4.6, 26], [6.4, 10], [6.6, 14], [6.75, 20], [6.9, 14], [7.05, 19], [7.2, 14], [7.6, 14]],
      brynX: [[2.2, 0], [2.5, -0.3], [4.2, -0.3], [4.6, 0.2], [6.4, 0.2], [6.8, 0.7], [7.6, 0.5], [8.2, 0.3]],
      brynY: [[2.2, 0], [2.5, -0.2], [4.2, -0.2], [4.6, 0.16], [6.4, 0.16], [6.8, 0.56], [7.6, 0.4], [8.2, 0.24]],
      kis: [[2.2, 0], [2.5, 0.35], [4.3, 0.35], [4.7, 0], [6.5, 0], [6.8, 0.45], [7.6, 0.35], [8.0, 0.1]],
      blund: [[2.15, 0], [2.4, 0.3], [4.4, 0.3], [4.8, 0.8], [6.3, 0.8], [6.6, 0], [7.9, 0], [8.2, 0.2], [8.9, 0.2]],
      le: [[6.2, 0], [6.6, 0.6], [7.6, 0.5], [8.2, 0.3], [8.9, 0.3]],
      munn: [[6.55, 0], [6.65, 0.14], [6.8, 0.04], [6.95, 0.12], [7.1, 0.03], [7.3, 0]],
      blickX: [[7.8, 0], [8.2, -4], [8.9, -4]],
      blickY: [[7.8, 0], [8.2, 1.5], [8.9, 1.5]],
    }, {
      ck: [[2.1, 'mun', 70], [4.6, 'mun'], [5.0, 'bort'], [5.6, 'hall'], [7.6, 'hall'], [8.2, 'se'], [8.9, 'se']],
      glod: [[2.2, 0], [2.45, 0.9], [2.7, 0.3], [3.15, 0.95], [3.4, 0.3], [3.85, 1], [4.2, 0.2], [4.6, 0]],
      iMun: [[1.95, 0], [2.15, 1], [4.6, 1], [4.75, 0]],
      pust: [[2.7, 0], [2.75, 1], [2.9, 1], [2.98, 0], [3.4, 0], [3.45, 1], [3.6, 1], [3.68, 0], [4.15, 0], [4.2, 1], [4.35, 1], [4.43, 0]],
      blaser: [[4.85, 0], [5.05, 0.8], [6.1, 0.7], [6.4, 0]],
      rok: [{ fran: 2.72, till: 2.95, sort: 'pust' }, { fran: 3.42, till: 3.65, sort: 'pust' }, { fran: 4.17, till: 4.4, sort: 'pust' }, { fran: 4.95, till: 6.4, sort: 'blas', styrka: 95, avtag: 1.1 }],
    }),
    // Ett bloss och ut med röken, och sedan visar han cigarren mot en, två små knyckar som säger: det här,
    // det är livet. Han skrockar och tittar gillande på den.
    vifta: cigarrKlipp(10.8, {
      yaw: [[2.0, 0.05], [3.3, 0.05], [3.9, 0.4], [5.0, 0.4], [5.5, 0.2], [6.7, 0.2], [7.6, 0.1], [8.6, -0.45], [9.8, -0.45]],
      pitch: [[2.0, 0.25], [3.3, 0.25], [3.9, -0.2], [5.0, -0.2], [5.5, 0.1], [5.8, 0.35], [6.1, 0.1], [6.7, 0], [7.6, 0], [8.6, 0.35], [8.9, 0.6], [9.2, 0.35], [9.8, 0.4]],
      lut: [[2.0, 0], [5.0, 0], [5.5, 0.03], [6.4, 0.03], [7.2, 0]],
      axV: [[2.0, 20], [3.3, 24], [4.0, 14], [6.7, 14], [6.85, 20], [7.0, 14], [7.15, 19], [7.3, 14]],
      brynX: [[3.4, 0], [3.8, 0.3], [5.0, 0.2], [5.4, 0.8], [6.4, 0.75], [7.2, 0.4], [8.6, 0.3]],
      brynY: [[3.4, 0], [3.8, 0.24], [5.0, 0.16], [5.4, 0.65], [6.4, 0.6], [7.2, 0.32], [8.6, 0.24]],
      blund: [[2.15, 0], [2.45, 0.45], [3.3, 0.45], [3.9, 0.7], [4.9, 0.6], [5.3, 0]],
      kis: [[5.3, 0], [5.6, 0.25], [6.6, 0.3], [7.0, 0.45], [7.6, 0.2]],
      le: [[4.0, 0], [4.5, 0.3], [5.4, 0.45], [6.6, 0.5], [7.0, 0.6], [7.8, 0.4], [9.8, 0.3]],
      munn: [[6.7, 0], [6.8, 0.12], [6.95, 0.03], [7.1, 0.1], [7.25, 0]],
      blickX: [[8.2, 0], [8.6, -4], [9.8, -4]],
      blickY: [[8.2, 0], [8.6, 1.5], [9.8, 1.5]],
    }, {
      ck: [[2.1, 'mun', 70], [3.3, 'mun'], [3.7, 'bort'], [4.3, 'hall'], [5.0, 'hall'], [5.5, 'vift'], [5.8, 'vift2'], [6.1, 'vift'], [6.7, 'hall'], [8.0, 'hall'], [8.6, 'se'], [9.8, 'se']],
      glod: [[2.2, 0], [2.6, 1], [3.05, 0.85], [3.3, 0]],
      iMun: [[1.95, 0], [2.15, 1], [3.3, 1], [3.45, 0]],
      blaser: [[3.8, 0], [4.0, 0.7], [4.8, 0.6], [5.1, 0]],
      rok: [{ fran: 3.85, till: 5.1, sort: 'blas', styrka: 80, avtag: 1.1 }],
    }),
    // Han drar ett bloss och håller röken i munnen och smakar på den, med slutna ögon och höjda bryn, och
    // släpper sedan ut den långsamt så att den ringlar uppåt, och ler brett.
    smaka: cigarrKlipp(12.0, {
      yaw: [[2.0, 0.05], [4.0, 0.05], [6.4, 0.1], [7.0, 0.45], [8.9, 0.45], [9.6, 0.15], [10.4, 0.1]],
      pitch: [[2.0, 0.25], [4.0, 0.15], [4.6, 0.25], [5.0, 0.05], [5.4, 0.25], [6.4, 0.1], [7.0, -0.45], [8.9, -0.45], [9.6, 0.1], [9.9, 0.4], [10.2, 0.1]],
      roll: [[4.0, 0], [4.8, 0.06], [6.4, 0.06], [7.0, 0]],
      lut: [[2.0, 0], [6.4, 0], [7.0, -0.03], [8.9, -0.03], [9.6, 0]],
      axV: [[2.0, 20], [3.6, 30], [6.4, 28], [9.0, 10], [10.0, 12]],
      brynX: [[2.5, 0], [3.6, 0.3], [4.4, 0.7], [6.4, 0.7], [7.0, 0.3], [8.9, 0.3], [9.5, 0.6], [10.4, 0.3]],
      brynY: [[2.5, 0], [3.6, 0.25], [4.4, 0.55], [6.4, 0.55], [7.0, 0.24], [8.9, 0.24], [9.5, 0.48], [10.4, 0.24]],
      blund: [[2.15, 0], [2.6, 0.5], [3.6, 0.6], [4.2, 0.85], [8.9, 0.85], [9.4, 0.2], [10.2, 0.15]],
      kis: [[9.2, 0], [9.6, 0.4], [10.4, 0.25]],
      munn: [[3.85, 0], [4.25, 0], [4.4, 0.05], [4.6, 0], [4.9, 0.06], [5.1, 0], [5.5, 0.05], [5.7, 0], [6.0, 0.04], [6.2, 0]],
      le: [[4.0, 0], [5.6, 0.2], [6.4, 0.25], [7.0, 0.15], [8.9, 0.2], [9.5, 0.6], [10.4, 0.45]],
    }, {
      ck: [[2.1, 'mun', 70], [3.6, 'mun'], [4.0, 'bort'], [4.6, 'hall'], [10.4, 'hall']],
      glod: [[2.2, 0], [2.6, 0.9], [3.4, 1], [3.75, 0]],
      iMun: [[1.95, 0], [2.15, 1], [3.6, 1], [3.75, 0]],
      blaser: [[6.6, 0], [7.0, 0.32], [8.8, 0.28], [9.1, 0]],
      rok: [{ fran: 6.9, till: 9.0, sort: 'blas', styrka: 45, avtag: 0.3, fart: 0.75, broms: 1.0, lyft: 46 }],
    }),
  });
  // Elden (grupp tanda): cigarrklipp där cigarren har slocknat och han tänder den, med cigarren mellan tänderna
  // och höger hand fri för stickan eller tändaren (eld, se eldArm). Den tänds (tand) när han drar med lågan vid
  // glöden.
  Object.assign(RORELSER, {
    // Den riktiga: han drar, men ingenting; tittar på den med rynkad panna, biter om den och tar en sticka ur
    // stället, drar den mot plånen så att den flammar upp och håller den upp en stund medan svavlet brinner av,
    // och tittar på lågan. Han tänder cigarren med tre bloss, med blicken på glöden och röken ur andra
    // mungipan, skakar ut stickan och släpper den i askkoppen, tar ut cigarren och tittar nöjt på glöden och
    // nickar, och blåser ut röken i en stråle.
    tanda: Object.assign(cigarrKlipp(16.4, {
      yaw: [[2.0, 0.05], [2.9, 0.05], [3.4, -0.5], [4.2, -0.55], [4.7, 0.05], [5.0, 0.0], [5.5, -0.75], [6.8, -0.72], [7.3, -0.4], [8.0, -0.38], [8.5, -0.15], [10.7, -0.15],
        [11.0, -0.35], [11.6, -0.4], [12.0, -0.55], [12.4, -0.5], [12.9, 0.05], [13.4, -0.5], [14.2, -0.55], [14.5, 0.3], [15.4, 0.35]],
      pitch: [[2.0, 0.25], [2.9, 0.25], [3.4, 0.7], [4.2, 0.75], [4.7, 0.25], [5.0, 0.3], [5.5, 0.95], [6.8, 0.95], [7.3, 0.55], [8.0, 0.5], [8.5, 0.6], [10.7, 0.6],
        [11.0, 0.45], [11.6, 0.45], [12.0, 0.9], [12.4, 0.85], [12.9, 0.25], [13.4, 0.75], [13.75, 0.95], [14.0, 0.7], [14.2, 0.8], [14.5, -0.1], [15.4, -0.15]],
      lut: [[2.0, 0], [5.0, 0], [5.6, 0.04], [6.8, 0.04], [7.4, 0.01], [8.5, 0.02], [10.7, 0.02], [11.4, 0], [12.0, 0.03], [12.5, 0.01], [14.4, 0], [14.8, -0.02]],
      vrid: [[2.0, 0], [5.0, -0.02], [5.6, -0.08], [6.8, -0.08], [7.4, -0.03], [11.4, -0.03], [12.0, -0.06], [12.6, -0.02], [14.4, -0.03]],
      axV: [[2.0, 20], [2.9, 26], [3.4, 14], [4.7, 18], [5.6, 10], [6.8, 10], [7.4, 18], [8.5, 22], [8.9, 28], [9.15, 22], [9.55, 30], [9.8, 24], [10.2, 32], [10.6, 22], [11.4, 16], [12.0, 8], [12.9, 18], [14.4, 14]],
      brynX: [[2.2, 0.2], [2.9, 0.3], [3.4, -0.35], [4.2, -0.45], [4.7, -0.1], [5.6, 0.1], [6.6, 0.1], [6.75, 0.7], [7.3, 0.55], [8.0, 0.3], [8.5, -0.15], [10.7, -0.15], [11.4, 0.2], [13.4, 0.2], [13.8, 0.6], [14.4, 0.45], [15.2, 0.3]],
      brynY: [[2.2, 0.2], [2.9, 0.25], [3.4, -0.5], [4.2, -0.6], [4.7, -0.15], [5.6, 0.08], [6.6, 0.08], [6.75, 0.6], [7.3, 0.45], [8.0, 0.25], [8.5, -0.1], [10.7, -0.1], [11.4, 0.16], [13.4, 0.16], [13.8, 0.5], [14.4, 0.38], [15.2, 0.24]],
      blickX: [[2.0, 0], [2.9, 0], [3.3, -3.5], [4.3, -3.5], [4.7, 0], [5.3, -5], [6.8, -5], [7.2, -3], [8.2, -3], [8.5, -2], [10.7, -2], [11.0, -3], [11.8, -3], [12.0, -4], [12.5, -4], [12.9, 0], [13.3, -3], [14.3, -3], [14.6, 0]],
      blickY: [[2.0, 0], [2.9, 0], [3.3, 2], [4.3, 2], [4.7, 0], [5.3, 4], [6.8, 4], [7.2, 1.5], [8.2, 1.5], [8.5, 5], [10.7, 5], [11.0, 2], [11.8, 2], [12.0, 4.5], [12.5, 4.5], [12.9, 0], [13.3, 3.5], [14.3, 3.5], [14.6, 0]],
      blund: [[2.15, 0], [2.4, 0.45], [2.9, 0.4], [3.2, 0], [5.3, 0.3], [6.8, 0.3], [7.0, 0], [8.5, 0.35], [10.7, 0.35], [11.0, 0], [12.0, 0.3], [12.5, 0.3], [12.8, 0], [13.4, 0.2], [14.3, 0.2], [14.6, 0.5], [15.3, 0.45], [15.6, 0]],
      kis: [[3.3, 0], [3.6, 0.35], [4.3, 0.35], [4.6, 0], [6.75, 0], [7.0, 0.4], [7.6, 0.3], [8.5, 0.4], [10.7, 0.45], [11.1, 0], [13.7, 0], [14.0, 0.3], [14.4, 0.2]],
      le: [[2.9, 0.1], [3.4, 0], [6.8, 0], [7.4, 0.2], [8.2, 0.15], [8.5, 0], [10.7, 0], [11.3, 0.2], [13.4, 0.15], [13.8, 0.45], [14.4, 0.4], [15.2, 0.3]],
      munn: [[4.75, 0], [4.9, 0.03], [8.75, 0.03], [8.85, 0.1], [9.05, 0.03], [9.4, 0.03], [9.5, 0.1], [9.7, 0.03], [10.05, 0.03], [10.15, 0.1], [10.35, 0.03], [12.9, 0.03], [13.05, 0]],
    }, {
      ck: [[2.1, 'mun', 70], [2.9, 'mun'], [3.3, 'bort'], [3.75, 'se'], [4.25, 'se'], [4.6, 'mun', 20], [4.9, 'tand'], [12.9, 'tand'], [13.3, 'bort'], [13.8, 'se'], [14.3, 'se'], [14.6, 'hall'], [15.2, 'hall']],
      // slocknad tills lågan har tagit (tand), och glöden när han drar med lågan vid den
      tand: [[8.7, 0], [10.4, 1]],
      glod: [[2.2, 0], [8.7, 0], [8.95, 0.45], [9.2, 0.2], [9.6, 0.7], [9.85, 0.35], [10.25, 1], [10.6, 0.5], [11.2, 0.25], [13.5, 0.15], [13.9, 0.6], [14.3, 0.2]],
      iMun: [[1.95, 0], [2.15, 1], [2.9, 1], [3.05, 0], [4.55, 0], [4.7, 1], [4.85, 0]],
      blaser: [[14.45, 0], [14.6, 0.55], [15.4, 0.5], [15.7, 0]],
      rok: [{ fran: 9.0, till: 9.2, sort: 'pust' }, { fran: 9.65, till: 9.85, sort: 'pust' }, { fran: 10.3, till: 10.5, sort: 'pust' }, { fran: 14.5, till: 15.6, sort: 'strale', styrka: 55, avtag: 0.9 }],
    }), {
      eld: {
        sort: 'sticka',
        ek: [[4.9, 'stall'], [5.75, 'stall'], [6.15, 'lyft', 10], [6.45, 'stryk0', 15], [6.62, 'stryk1'], [6.9, 'stryk2'], [7.45, 'se', 20], [8.0, 'se'], [8.55, 'fot', 25], [10.75, 'fot'], [11.05, 'skak'],
          [11.17, 'skak1'], [11.3, 'skak2'], [11.43, 'skak1'], [11.6, 'skak'], [12.05, 'ask', 30], [12.3, 'ask']],
        mot: [[4.85, 0], [5.75, 1], [12.25, 1], [13.0, 0]],
        krok: [[4.9, 0.2], [5.55, 0.14], [5.75, 0.3], [12.2, 0.3], [12.35, 0.12], [12.9, 0.2]],
        ta: 5.75,
        slapp: 12.3,
        laga: [[6.6, 0], [6.64, 1.7], [6.9, 1.45], [7.3, 1.05], [7.6, 1], [11.15, 1], [11.22, 0]],
        sug: [[8.7, 0], [8.95, 0.9], [9.2, 0.2], [9.6, 0.9], [9.85, 0.2], [10.25, 1], [10.6, 0.2], [10.75, 0]],
        brand: [[6.62, 0], [11.2, 0.75]],
        glo: [[11.18, 0], [11.25, 1], [11.9, 0.4], [12.6, 0]],
        ryk: [[11.18, 0], [11.25, 1], [12.4, 0.5], [13.4, 0]],
        rok: [{ t: 6.66 }],
      },
    }),
    // Tändaren: han biter om cigarren, tar tändaren från disken och fäller upp locket med tummen, drar på hjulet
    // men det blir bara gnistor, tittar misstänksamt på den och drar igen, och då tar det. Han tänder cigarren
    // med tre bloss, slår igen locket så att lågan dör, och lägger tillbaka tändaren. Sedan tar han ut cigarren
    // och blåser tre rökringar och tittar efter dem, nöjd.
    tandaren: Object.assign(cigarrKlipp(15.4, {
      yaw: [[2.0, 0.05], [2.5, 0.0], [3.0, -0.85], [4.0, -0.82], [4.4, -0.35], [5.0, -0.32], [5.3, -0.42], [5.6, -0.3], [6.2, -0.32], [6.6, -0.15], [8.7, -0.15], [9.0, -0.3], [9.3, -0.3],
        [9.7, -0.82], [10.2, -0.8], [10.7, 0.05], [11.3, 0.05], [11.8, 0.55], [13.9, 0.6], [14.3, 0.35]],
      pitch: [[2.0, 0.25], [2.5, 0.3], [3.0, 1.0], [4.0, 0.95], [4.4, 0.6], [5.0, 0.6], [5.3, 0.7], [5.6, 0.55], [6.2, 0.6], [6.6, 0.6], [8.7, 0.6], [9.0, 0.55], [9.3, 0.55],
        [9.7, 1.0], [10.2, 0.95], [10.7, 0.25], [11.3, 0.2], [11.8, -0.35], [13.9, -0.45], [14.3, -0.2]],
      lut: [[2.0, 0], [2.6, 0], [3.1, 0.04], [4.0, 0.04], [4.5, 0.01], [9.5, 0.01], [9.9, 0.04], [10.3, 0.03], [10.8, 0], [11.8, -0.03], [13.9, -0.04]],
      vrid: [[2.0, 0], [2.6, -0.02], [3.1, -0.09], [4.0, -0.09], [4.5, -0.03], [9.5, -0.03], [9.9, -0.08], [10.3, -0.07], [10.8, -0.02], [11.8, 0.02], [13.9, 0.02]],
      axV: [[2.0, 20], [2.6, 14], [3.1, 8], [4.0, 10], [4.6, 16], [6.6, 20], [6.95, 28], [7.2, 22], [7.6, 30], [7.85, 24], [8.25, 32], [8.6, 22], [9.4, 14], [10.0, 6], [10.8, 16], [11.8, 26], [13.9, 14]],
      brynX: [[2.2, 0.2], [2.8, 0.1], [4.4, 0.15], [5.05, 0.15], [5.25, -0.4], [5.75, -0.45], [5.95, 0.45], [6.4, 0.3], [6.6, -0.1], [8.7, -0.1], [9.2, 0.2], [11.8, 0.3], [12.4, 0.6], [13.9, 0.55], [14.4, 0.3]],
      brynY: [[2.2, 0.2], [2.8, 0.08], [4.4, 0.12], [5.05, 0.12], [5.25, -0.55], [5.75, -0.6], [5.95, 0.35], [6.4, 0.25], [6.6, -0.08], [8.7, -0.08], [9.2, 0.16], [11.8, 0.24], [12.4, 0.5], [13.9, 0.45], [14.4, 0.24]],
      blickX: [[2.0, 0], [2.4, 0], [2.9, -5.5], [4.0, -5.5], [4.4, -3], [6.3, -3], [6.6, -2], [8.7, -2], [9.0, -3], [9.4, -3], [9.7, -5.5], [10.3, -5.5], [10.7, 0], [11.8, 3.5], [13.9, 3.5], [14.3, 0]],
      blickY: [[2.0, 0], [2.4, 0], [2.9, 4.5], [4.0, 4.5], [4.4, 3], [6.3, 3], [6.6, 5], [8.7, 5], [9.0, 3], [9.4, 3], [9.7, 4.5], [10.3, 4.5], [10.7, 0], [11.8, -3], [13.9, -3], [14.3, 0]],
      blund: [[2.15, 0], [2.9, 0.3], [4.0, 0.3], [4.3, 0.1], [6.6, 0.35], [8.7, 0.35], [9.0, 0.1], [9.7, 0.3], [10.3, 0.3], [10.6, 0]],
      kis: [[5.2, 0], [5.4, 0.45], [5.8, 0.45], [6.0, 0.1], [6.6, 0.4], [8.7, 0.45], [9.0, 0], [12.4, 0], [12.8, 0.3], [13.9, 0.25]],
      le: [[2.5, 0.05], [5.2, 0.05], [5.3, 0], [5.9, 0], [6.3, 0.15], [6.6, 0], [8.7, 0], [9.3, 0.25], [11.3, 0.2], [12.8, 0.4], [13.9, 0.5], [14.5, 0.35]],
      munn: [[2.35, 0], [2.5, 0.03], [6.85, 0.03], [6.95, 0.1], [7.15, 0.03], [7.5, 0.03], [7.6, 0.1], [7.8, 0.03], [8.15, 0.03], [8.25, 0.1], [8.45, 0.03], [10.9, 0.03], [11.05, 0],
        [12.2, 0], [12.35, 0.3], [12.5, 0.4], [12.62, 0.18], [12.9, 0.3], [13.05, 0.4], [13.17, 0.18], [13.45, 0.3], [13.6, 0.4], [13.72, 0.18], [13.95, 0]],
      rund: [[12.1, 0], [12.3, 1], [13.85, 1], [14.1, 0]],
    }, {
      ck: [[2.1, 'mun', 70], [2.4, 'mun'], [2.65, 'tand'], [10.9, 'tand'], [11.3, 'bort'], [11.9, 'hall'], [14.4, 'hall']],
      tand: [[6.8, 0], [8.5, 1]],
      glod: [[2.2, 0], [6.8, 0], [7.05, 0.45], [7.3, 0.2], [7.7, 0.7], [7.95, 0.35], [8.35, 1], [8.7, 0.5], [9.2, 0.25], [11.4, 0.15], [11.9, 0]],
      iMun: [[1.95, 0], [2.15, 1], [2.4, 1], [2.55, 0]],
      rok: [{ fran: 7.1, till: 7.3, sort: 'pust' }, { fran: 7.75, till: 7.95, sort: 'pust' }, { fran: 8.4, till: 8.6, sort: 'pust' }, { t: 12.45, sort: 'ring' }, { t: 13.0, sort: 'ring' }, { t: 13.55, sort: 'ring' }, { fran: 13.7, till: 14.6, sort: 'blas', styrka: 14, avtag: 1.2 }],
    }), {
      eld: {
        sort: 'tandare',
        ek: [[2.6, 'disk'], [3.4, 'disk'], [3.9, 'lyft', 20], [4.4, 'se'], [6.3, 'se'], [6.7, 'fot', 20], [8.8, 'fot'], [9.2, 'se'], [9.5, 'lyft'], [10.05, 'disk', 15]],
        mot: [[2.55, 0], [3.4, 1], [10.05, 1], [10.85, 0]],
        krok: [[2.6, 0.2], [3.3, 0.2], [3.45, 0.7], [10.0, 0.7], [10.15, 0.2]],
        lock: [[4.45, 0], [4.62, 1], [9.1, 1], [9.2, 0]],
        gnista: [5.0],
        laga: [[5.89, 0], [5.95, 1], [9.1, 1], [9.15, 0]],
        sug: [[6.85, 0], [7.05, 0.9], [7.3, 0.2], [7.7, 0.9], [7.95, 0.2], [8.35, 1], [8.7, 0.2], [8.8, 0]],
      },
    }),
    // Disken: han biter om cigarren, tar en sticka och drar den i ett långt, säkert drag mot disken, med en
    // gest. Ingenting händer. Han tittar på stickan, och sedan på en, stel och utan leende (ertappad), drar den
    // mot plånen som vanligt och låtsas som ingenting. Han tänder cigarren, skakar ut stickan och släpper den i
    // askkoppen, tar ut cigarren och lutar sig bakåt och blåser ut röken i ett stort moln, och nickar nöjt.
    disken: Object.assign(cigarrKlipp(17.4, {
      yaw: [[2.0, 0.05], [2.5, 0.0], [3.0, -0.75], [3.7, -0.72], [4.1, -0.55], [4.35, -0.45], [4.7, -0.35], [5.4, -0.35], [5.8, 0.15], [6.3, 0.2], [6.5, -0.7], [6.9, -0.7], [7.4, -0.4], [8.1, -0.38],
        [8.5, -0.15], [10.7, -0.15], [11.0, -0.35], [11.5, -0.4], [11.9, -0.55], [12.3, -0.5], [12.8, 0.05], [13.4, 0.05], [14.0, 0.3], [15.6, 0.3], [16.1, -0.45], [16.8, -0.45]],
      pitch: [[2.0, 0.25], [2.5, 0.3], [3.0, 0.95], [3.7, 0.95], [4.1, 0.9], [4.35, 0.85], [4.7, 0.55], [5.4, 0.6], [5.8, 0.05], [6.3, 0.05], [6.5, 0.95], [6.9, 0.95], [7.4, 0.55], [8.1, 0.5],
        [8.5, 0.6], [10.7, 0.6], [11.0, 0.45], [11.5, 0.45], [11.9, 0.9], [12.3, 0.85], [12.8, 0.25], [13.4, 0.2], [14.0, -0.95], [15.6, -1.0], [16.1, 0.6], [16.4, 0.85], [16.8, 0.7]],
      lut: [[2.0, 0], [2.6, 0], [3.1, 0.04], [4.0, 0.05], [4.4, 0.02], [5.8, 0], [6.4, 0.04], [6.9, 0.04], [7.4, 0.01], [8.5, 0.02], [10.7, 0.02], [11.4, 0], [12.0, 0.03], [12.5, 0.01], [13.4, 0], [14.0, -0.06], [15.6, -0.06], [16.2, 0]],
      vrid: [[2.0, 0], [2.6, -0.02], [3.1, -0.08], [4.0, -0.1], [4.4, -0.04], [5.8, 0], [6.4, -0.08], [6.9, -0.08], [7.4, -0.03], [11.4, -0.03], [12.0, -0.06], [12.6, -0.02], [14.0, 0.02], [15.6, 0.02], [16.2, 0]],
      axV: [[2.0, 20], [2.6, 14], [3.1, 8], [4.0, 4], [4.4, 14], [5.4, 14], [5.8, 22], [6.3, 22], [6.6, 10], [6.9, 10], [7.4, 18], [8.5, 22], [8.9, 28], [9.15, 22], [9.55, 30], [9.8, 24], [10.2, 32], [10.6, 22],
        [11.4, 16], [12.0, 8], [12.9, 18], [13.4, 30], [14.2, 34], [15.4, 8], [16.0, 12]],
      brynX: [[2.2, 0.2], [3.0, 0.3], [3.9, 0.55], [4.3, 0.6], [4.6, -0.2], [5.4, -0.4], [5.75, 0.95], [6.3, 0.9], [6.5, 0.1], [6.9, 0.1], [7.0, 0.5], [7.5, 0.3], [8.5, -0.15], [10.7, -0.15], [11.4, 0.2], [13.4, 0.3], [14.0, 0.15], [15.4, 0.2], [15.9, 0.65], [16.6, 0.4]],
      brynY: [[2.2, 0.2], [3.0, 0.25], [3.9, 0.45], [4.3, 0.5], [4.6, -0.3], [5.4, -0.55], [5.75, 0.85], [6.3, 0.8], [6.5, 0.08], [6.9, 0.08], [7.0, 0.4], [7.5, 0.25], [8.5, -0.1], [10.7, -0.1], [11.4, 0.16], [13.4, 0.24], [14.0, 0.12], [15.4, 0.16], [15.9, 0.55], [16.6, 0.32]],
      blickX: [[2.0, 0], [2.4, 0], [2.9, -5], [4.3, -4.5], [4.7, -3], [5.4, -3], [5.7, 0], [6.3, 0], [6.5, -5], [6.9, -5], [7.2, -3], [8.2, -3], [8.5, -2], [10.7, -2], [11.0, -3], [11.8, -3], [12.0, -4], [12.5, -4], [12.9, 0], [15.9, 0], [16.2, -3], [16.8, -3]],
      blickY: [[2.0, 0], [2.4, 0], [2.9, 4.5], [4.3, 4.5], [4.7, 2.5], [5.4, 2.5], [5.7, -0.5], [6.3, -0.5], [6.5, 4.5], [6.9, 4.5], [7.2, 1.5], [8.2, 1.5], [8.5, 5], [10.7, 5], [11.0, 2], [11.8, 2], [12.0, 4.5], [12.5, 4.5], [12.9, 0], [15.9, 0], [16.2, 3.5], [16.8, 3.5]],
      blund: [[2.15, 0], [2.9, 0.3], [4.0, 0.2], [4.3, 0], [8.5, 0.35], [10.7, 0.35], [11.0, 0], [12.0, 0.3], [12.5, 0.3], [12.8, 0], [13.6, 0.4], [14.2, 0.85], [15.5, 0.85], [15.9, 0.1]],
      kis: [[4.6, 0], [4.9, 0.4], [5.4, 0.4], [5.6, 0], [6.75, 0], [7.0, 0.4], [7.6, 0.3], [8.5, 0.4], [10.7, 0.45], [11.1, 0], [15.8, 0], [16.2, 0.3], [16.8, 0.25]],
      stel: [[5.6, 0], [5.7, 1], [6.35, 1], [6.8, 0]],
      le: [[2.5, 0.05], [3.6, 0.2], [4.1, 0.35], [4.4, 0.1], [4.7, 0], [6.8, 0], [7.4, 0.2], [8.2, 0.1], [8.5, 0], [10.7, 0], [11.3, 0.2], [13.4, 0.2], [14.2, 0.15], [15.5, 0.25], [15.9, 0.6], [16.8, 0.45]],
      munn: [[2.35, 0], [2.5, 0.03], [8.75, 0.03], [8.85, 0.1], [9.05, 0.03], [9.4, 0.03], [9.5, 0.1], [9.7, 0.03], [10.05, 0.03], [10.15, 0.1], [10.35, 0.03], [12.9, 0.03], [13.05, 0]],
    }, {
      ck: [[2.1, 'mun', 70], [2.4, 'mun'], [2.65, 'tand'], [12.9, 'tand'], [13.3, 'bort'], [13.9, 'hall'], [16.2, 'hall']],
      tand: [[8.7, 0], [10.4, 1]],
      glod: [[2.2, 0], [8.7, 0], [8.95, 0.45], [9.2, 0.2], [9.6, 0.7], [9.85, 0.35], [10.25, 1], [10.6, 0.5], [11.2, 0.25], [13.0, 0.15], [13.4, 0.8], [13.8, 0.3]],
      iMun: [[1.95, 0], [2.15, 1], [2.4, 1], [2.55, 0]],
      blaser: [[13.55, 0], [13.8, 0.8], [15.2, 0.7], [15.6, 0]],
      rok: [{ fran: 9.0, till: 9.2, sort: 'pust' }, { fran: 9.65, till: 9.85, sort: 'pust' }, { fran: 10.3, till: 10.5, sort: 'pust' }, { fran: 13.6, till: 15.6, sort: 'blas', styrka: 95, avtag: 0.5, fart: 0.8 }],
    }), {
      eld: {
        sort: 'sticka',
        ek: [[2.6, 'stall'], [3.4, 'stall'], [3.75, 'lyft', 10], [4.05, 'disk0', 40], [4.3, 'disk1'], [4.65, 'disk2', 20], [5.1, 'se'], [6.15, 'se'], [6.55, 'stryk0', 20], [6.72, 'stryk1'],
          [6.95, 'stryk2'], [7.5, 'se', 20], [8.05, 'se'], [8.55, 'fot', 25], [10.75, 'fot'], [10.95, 'skak'], [11.07, 'skak1'], [11.2, 'skak2'], [11.33, 'skak1'], [11.5, 'skak'], [11.95, 'ask', 30], [12.2, 'ask']],
        mot: [[2.55, 0], [3.4, 1], [12.15, 1], [12.9, 0]],
        krok: [[2.6, 0.2], [3.25, 0.14], [3.4, 0.3], [12.1, 0.3], [12.25, 0.12], [12.8, 0.2]],
        ta: 3.4,
        slapp: 12.2,
        laga: [[6.7, 0], [6.74, 1.7], [7.0, 1.45], [7.4, 1.05], [7.7, 1], [11.05, 1], [11.12, 0]],
        sug: [[8.7, 0], [8.95, 0.9], [9.2, 0.2], [9.6, 0.9], [9.85, 0.2], [10.25, 1], [10.6, 0.2], [10.75, 0]],
        brand: [[6.72, 0], [11.1, 0.75]],
        glo: [[11.08, 0], [11.15, 1], [11.8, 0.4], [12.5, 0]],
        ryk: [[11.08, 0], [11.15, 1], [12.3, 0.5], [13.3, 0]],
        rok: [{ t: 6.76 }],
      },
    }),
    // Tändaren i en enda rörelse: han biter om cigarren, tar tändaren och fäller upp locket och drar på hjulet på
    // vägen upp, och lågan tar direkt; han tittar på en med ett höjt bryn medan han tänder (så gör man), slår
    // igen locket med en knyck och ställer ned tändaren med en liten smäll. Han tar ut cigarren, blåser ut röken
    // och visar den för en: det här, det är livet.
    tandare2: Object.assign(cigarrKlipp(12.6, {
      yaw: [[2.0, 0.05], [2.5, 0.0], [2.9, -0.85], [3.4, -0.8], [3.8, -0.3], [4.3, 0.15], [6.2, 0.2], [6.6, -0.3], [6.85, -0.75], [7.2, -0.7], [7.6, 0.05], [8.3, 0.05], [8.8, 0.4], [9.4, 0.35],
        [9.8, 0.2], [10.9, 0.2], [11.6, -0.45], [12.2, -0.45]],
      pitch: [[2.0, 0.25], [2.5, 0.3], [2.9, 1.0], [3.4, 0.95], [3.8, 0.5], [4.3, 0.15], [6.2, 0.15], [6.6, 0.4], [6.85, 0.95], [7.2, 0.9], [7.6, 0.25], [8.3, 0.2], [8.8, -0.25], [9.4, -0.2],
        [9.8, 0.1], [10.1, 0.35], [10.4, 0.1], [10.9, 0], [11.6, 0.5], [11.9, 0.75], [12.2, 0.55]],
      lut: [[2.0, 0], [2.6, 0], [3.0, 0.04], [3.4, 0.04], [3.9, 0], [4.4, -0.02], [6.2, -0.02], [6.8, 0.04], [7.2, 0.03], [7.7, 0], [9.6, 0.03], [10.6, 0.03], [11.2, 0]],
      axV: [[2.0, 20], [2.6, 14], [3.1, 8], [3.6, 12], [4.3, 22], [4.95, 30], [5.2, 22], [5.55, 32], [5.9, 22], [6.6, 14], [7.0, 4], [7.6, 16], [8.3, 26], [9.4, 12], [10.4, 14]],
      brynX: [[2.2, 0.2], [3.4, 0.2], [3.9, 0.3], [4.3, 0.9], [6.0, 0.8], [6.5, 0.3], [7.2, 0.4], [8.3, 0.3], [9.4, 0.4], [9.8, 0.85], [10.9, 0.75], [11.5, 0.3]],
      brynY: [[2.2, 0.2], [3.4, 0.16], [3.9, 0.2], [4.3, 0.15], [6.0, 0.15], [6.5, 0.24], [7.2, 0.32], [8.3, 0.24], [9.4, 0.32], [9.8, 0.7], [10.9, 0.6], [11.5, 0.24]],
      blickX: [[2.0, 0], [2.4, 0], [2.8, -5.5], [3.4, -5.5], [3.9, 0], [6.3, 0], [6.7, -5.5], [7.2, -5.5], [7.6, 0], [11.2, 0], [11.6, -3], [12.2, -3]],
      blickY: [[2.0, 0], [2.4, 0], [2.8, 4.5], [3.4, 4.5], [3.9, 0], [6.3, 0], [6.7, 4.5], [7.2, 4.5], [7.6, 0], [11.2, 0], [11.6, 3.5], [12.2, 3.5]],
      blund: [[2.15, 0], [2.8, 0.3], [3.4, 0.3], [3.8, 0], [8.4, 0], [8.7, 0.5], [9.3, 0.45], [9.6, 0]],
      kis: [[4.0, 0], [4.4, 0.35], [6.0, 0.3], [6.4, 0], [9.8, 0.2], [10.6, 0.4], [11.2, 0.2]],
      le: [[2.5, 0.05], [3.8, 0.2], [4.3, 0.55], [6.0, 0.5], [6.5, 0.3], [7.4, 0.35], [8.3, 0.3], [9.8, 0.55], [10.9, 0.65], [11.6, 0.4]],
      munn: [[2.35, 0], [2.5, 0.03], [4.9, 0.03], [5.0, 0.1], [5.2, 0.03], [5.5, 0.03], [5.6, 0.1], [5.8, 0.03], [7.7, 0.03], [7.85, 0], [10.2, 0], [10.3, 0.1], [10.45, 0.03], [10.6, 0.08], [10.75, 0]],
    }, {
      ck: [[2.1, 'mun', 70], [2.4, 'mun'], [2.65, 'tand'], [7.8, 'tand'], [8.2, 'bort'], [8.7, 'hall'], [9.6, 'hall'], [10.0, 'vift'], [10.25, 'vift2'], [10.5, 'vift'], [11.0, 'hall'], [11.6, 'se'], [12.1, 'se']],
      tand: [[4.7, 0], [5.9, 1]],
      glod: [[2.2, 0], [4.7, 0], [5.0, 0.6], [5.3, 0.3], [5.65, 1], [6.0, 0.4], [6.5, 0.25], [8.3, 0.15], [8.6, 0.5], [9.0, 0.2]],
      iMun: [[1.95, 0], [2.15, 1], [2.4, 1], [2.55, 0]],
      blaser: [[8.3, 0], [8.5, 0.7], [9.3, 0.6], [9.6, 0]],
      rok: [{ fran: 5.1, till: 5.3, sort: 'pust' }, { fran: 5.7, till: 5.9, sort: 'pust' }, { fran: 8.35, till: 9.6, sort: 'blas', styrka: 85, avtag: 1.0 }],
    }), {
      eld: {
        sort: 'tandare',
        ek: [[2.6, 'disk'], [3.3, 'disk'], [3.8, 'lyft', 15], [4.4, 'fot', 30], [6.1, 'fot'], [6.4, 'se'], [6.65, 'lyft'], [6.98, 'disk', 25]],
        mot: [[2.55, 0], [3.3, 1], [7.0, 1], [7.75, 0]],
        krok: [[2.6, 0.2], [3.2, 0.2], [3.35, 0.7], [6.95, 0.7], [7.1, 0.2]],
        lock: [[3.55, 0], [3.68, 1], [6.35, 1], [6.43, 0]],
        laga: [[3.81, 0], [3.86, 1], [6.35, 1], [6.4, 0]],
        sug: [[4.85, 0], [5.0, 0.9], [5.3, 0.2], [5.6, 1], [5.9, 0.2], [6.1, 0]],
      },
    }),
  });
  // Småsakerna (grupp smatt): bara huvudet, kroppen och ansiktet, med händerna kvar på disken. Han
  // tittar med ögonen först och vrider huvudet efter, som man gör; blickX åt hans vänstra sida (mot
  // affären), blickY nedåt. andas läggs till andningen (bröstet).
  Object.assign(RORELSER, {
    // Bort mot gänget i affären: ögonen först och huvudet efter, brynen upp, och sedan kisar han, skakar
    // lite på huvudet och ler åt dem innan blicken kommer tillbaka.
    affaren: {
      k: {
        blickX: [[0.1, 0], [0.2, 5.5], [0.8, 3.5], [2.6, 3.5], [2.7, 4.5], [3.5, 4.5], [3.6, 0]],
        blickY: [[0.1, 0], [0.2, -0.5], [3.5, -0.5], [3.6, 0]],
        yaw: [[0.15, 0], [0.9, 0.4], [2.6, 0.4], [2.85, 0.28], [3.1, 0.42], [3.35, 0.3], [3.6, 0.35], [4.5, 0]],
        pitch: [[0.15, 0], [0.9, -0.15], [2.6, -0.15], [3.6, -0.1], [4.5, 0]],
        roll: [[0.2, 0], [1.0, 0.04], [3.6, 0.04], [4.5, 0]],
        vrid: [[0.3, 0], [1.2, 0.03], [3.6, 0.03], [4.6, 0]],
        brynX: [[0.2, 0], [0.7, 0.5], [2.4, 0.4], [3.0, 0.2], [4.6, 0]],
        brynY: [[0.2, 0], [0.7, 0.4], [2.4, 0.3], [3.0, 0.1], [4.6, 0]],
        kis: [[0.9, 0], [1.4, 0.25], [2.5, 0.25], [3.0, 0.3], [4.4, 0]],
        le: [[2.4, 0], [3.0, 0.32], [3.8, 0.35], [4.9, 0]],
      },
    },
    // Längs baren: blicken och huvudet åt andra hållet, hakan lite upp, och en kort nick med brynen upp
    // och ett litet leende, som åt någon han känner.
    baren: {
      k: {
        blickX: [[0.1, 0], [0.2, -5], [0.9, -3.5], [3.0, -3.5], [3.1, 0]],
        yaw: [[0.15, 0], [0.9, -0.45], [3.0, -0.45], [3.9, 0]],
        pitch: [[0.15, 0], [0.9, -0.2], [1.6, -0.2], [1.85, 0.3], [2.15, -0.15], [3.0, -0.15], [3.9, 0]],
        brynX: [[1.5, 0], [1.75, 0.8], [2.2, 0.7], [2.8, 0]],
        brynY: [[1.5, 0], [1.75, 0.6], [2.2, 0.5], [2.8, 0]],
        le: [[1.5, 0], [1.85, 0.3], [2.6, 0.25], [3.3, 0]],
        munn: [[1.8, 0], [1.9, 0.05], [2.05, 0]],
      },
    },
    // Notan: han tittar ned på den, brynen åker upp och munnen säger oj, han skakar på huvudet och pustar
    // ut, och ler snett.
    notan: {
      k: {
        blickX: [[0.1, 0], [0.2, 3], [3.2, 3], [3.3, 0]],
        blickY: [[0.1, 0], [0.2, 5], [3.2, 5], [3.3, 0]],
        pitch: [[0.15, 0], [0.8, 0.45], [3.2, 0.45], [3.9, 0]],
        yaw: [[0.15, 0], [0.8, 0.2], [1.9, 0.2], [2.15, 0.05], [2.4, 0.3], [2.65, 0.08], [2.9, 0.22], [3.3, 0.2], [3.9, 0]],
        brynX: [[0.8, 0], [1.2, 0.9], [2.0, 0.85], [3.4, 0]],
        brynY: [[0.8, 0], [1.2, 0.8], [2.0, 0.75], [3.4, 0]],
        rund: [[1.0, 0], [1.25, 0.45], [1.9, 0.4], [2.2, 0]],
        munn: [[1.0, 0], [1.25, 0.04], [1.9, 0.04], [2.2, 0]],
        andas: [[2.0, 0], [2.4, -6], [3.0, 0]],
        le: [[3.0, 0], [3.5, 0.2], [4.3, 0]],
      },
    },
    // Han nickar för sig själv, två gånger och en liten, med blicken ned åt sidan och ett leende.
    nicka: {
      k: {
        blickX: [[0.1, 0], [0.25, -2], [2.6, -2], [2.75, 0]],
        blickY: [[0.1, 0], [0.25, 1.5], [2.6, 1.5], [2.75, 0]],
        pitch: [[0.2, 0], [0.6, 0.1], [0.95, 0.55], [1.3, 0.05], [1.65, 0.5], [2.0, 0.05], [2.3, 0.3], [2.7, 0]],
        roll: [[0.2, 0], [0.8, 0.05], [2.3, 0.05], [2.9, 0]],
        le: [[0.3, 0], [1.0, 0.3], [2.6, 0.35], [3.4, 0]],
        brynX: [[0.3, 0], [0.9, 0.3], [2.4, 0.3], [3.2, 0]],
        brynY: [[0.3, 0], [0.9, 0.2], [2.4, 0.2], [3.2, 0]],
      },
    },
    // Suckan: han andas in djupt så att bröstet häver sig och axlarna åker upp, med hakan upp och
    // halvslutna ögon, och andas ut genom munnen medan axlarna sjunker.
    suck: {
      k: {
        andas: [[0.1, 0], [1.3, 16], [1.7, 16], [3.2, -5], [4.2, 0]],
        axV: [[0.1, 0], [1.3, 16], [1.7, 16], [3.2, -4], [4.2, 0]],
        axH: [[0.1, 0], [1.3, 16], [1.7, 16], [3.2, -4], [4.2, 0]],
        lut: [[0.1, 0], [1.3, -0.025], [1.7, -0.025], [3.2, 0.01], [4.2, 0]],
        pitch: [[0.1, 0], [1.3, -0.35], [1.7, -0.35], [3.2, 0.15], [4.2, 0]],
        brynX: [[0.1, 0], [1.3, 0.6], [1.7, 0.6], [3.0, 0.1], [4.0, 0]],
        brynY: [[0.1, 0], [1.3, 0.5], [1.7, 0.5], [3.0, 0.1], [4.0, 0]],
        blund: [[0.6, 0], [1.3, 0.45], [2.6, 0.55], [3.2, 0]],
        munn: [[1.65, 0], [1.85, 0.07], [2.8, 0.05], [3.1, 0]],
        rund: [[1.65, 0], [1.85, 0.5], [2.8, 0.4], [3.1, 0]],
        le: [[2.6, 0], [3.2, 0.2], [4.3, 0]],
      },
    },
    // Nacken: huvudet åt ena sidan och sedan den andra, med slutna ögon och axeln som åker upp på andra
    // sidan.
    nacken: {
      k: {
        roll: [[0.2, 0], [0.9, 0.14], [1.5, 0.14], [2.3, -0.12], [2.9, -0.12], [3.6, 0]],
        yaw: [[0.2, 0], [0.9, -0.1], [1.5, -0.1], [2.3, 0.1], [2.9, 0.1], [3.6, 0]],
        pitch: [[0.2, 0], [0.9, -0.1], [2.9, -0.1], [3.6, 0]],
        axV: [[0.2, 0], [0.9, -4], [1.5, -4], [2.3, 12], [2.9, 12], [3.6, 0]],
        axH: [[0.2, 0], [0.9, 12], [1.5, 12], [2.3, -4], [2.9, -4], [3.6, 0]],
        blund: [[0.4, 0], [0.9, 0.8], [2.9, 0.8], [3.3, 0]],
        kis: [[0.6, 0], [1.0, 0.2], [2.9, 0.2], [3.3, 0]],
        munn: [[0.9, 0], [1.2, 0.03], [2.6, 0.03], [2.9, 0]],
      },
    },
    // Ögonbrynet: hakan lite upp, ena brynet högt och ett brett leende, och en långsam nick mot en:
    // visst är det så? Förut drog han ned det andra brynet och hakan och log snett, och det såg hånfullt ut
    // (ändrat 2026-11-06).
    brynet: {
      k: {
        yaw: [[0.2, 0], [0.7, 0.15], [2.3, 0.15], [3.0, 0]],
        pitch: [[0.2, 0], [0.7, -0.3], [1.5, -0.3], [1.85, 0.35], [2.3, 0.05], [3.0, 0]],
        brynX: [[0.25, 0], [0.7, 1.4], [2.3, 1.3], [3.0, 0]],
        brynY: [[0.25, 0], [0.7, 0.15], [2.3, 0.15], [3.0, 0]],
        kis: [[0.3, 0], [0.8, 0.28], [2.3, 0.28], [2.9, 0]],
        le: [[0.3, 0], [0.8, 0.55], [2.3, 0.6], [3.3, 0]],
      },
    },
    // Han skrockar för sig själv: blicken ned åt sidan, ett leende som växer, och axlarna och bröstet
    // som hoppar tre gånger; sedan tittar han upp på en med leendet kvar.
    skrocka: {
      k: {
        blickX: [[0.1, 0], [0.25, -2.5], [1.0, -2.5], [1.1, -1.5], [2.4, -1.5], [2.55, 0]],
        blickY: [[0.1, 0], [0.25, 2.5], [2.4, 2.5], [2.55, 0]],
        pitch: [[0.2, 0], [0.8, 0.3], [1.2, 0.35], [1.4, 0.2], [1.6, 0.4], [1.8, 0.25], [2.0, 0.42], [2.5, 0.1], [3.4, 0]],
        yaw: [[0.2, 0], [0.8, -0.15], [2.3, -0.1], [2.8, 0.15], [3.6, 0]],
        le: [[0.3, 0], [0.9, 0.35], [1.2, 0.65], [2.4, 0.6], [3.0, 0.45], [4.0, 0]],
        kis: [[0.9, 0], [1.2, 0.45], [2.3, 0.4], [3.0, 0.2], [3.8, 0]],
        axV: [[1.1, 0], [1.3, 7], [1.45, 1], [1.65, 8], [1.8, 1], [2.0, 6], [2.2, 0]],
        axH: [[1.1, 0], [1.3, 7], [1.45, 1], [1.65, 8], [1.8, 1], [2.0, 6], [2.2, 0]],
        andas: [[1.1, 0], [1.3, 4], [1.45, -1], [1.65, 4], [1.8, -1], [2.0, 3], [2.2, 0]],
        munn: [[1.15, 0], [1.3, 0.1], [1.45, 0.02], [1.65, 0.11], [1.8, 0.02], [2.0, 0.08], [2.2, 0]],
        brynX: [[1.0, 0], [1.3, 0.4], [2.6, 0.4], [3.5, 0]],
        brynY: [[1.0, 0], [1.3, 0.3], [2.6, 0.3], [3.5, 0]],
      },
    },
    // Kaffet: han tittar på koppen, smackar två gånger och säger mm med höjda bryn.
    smacka: {
      k: {
        blickX: [[0.1, 0], [0.22, 4.5], [1.9, 4.5], [2.05, 0]],
        blickY: [[0.1, 0], [0.22, 3.5], [1.9, 3.5], [2.05, 0]],
        yaw: [[0.15, 0], [0.7, 0.2], [1.9, 0.2], [2.6, 0]],
        pitch: [[0.15, 0], [0.7, 0.25], [1.9, 0.25], [2.6, 0]],
        munn: [[0.8, 0], [0.9, 0.06], [1.0, 0], [1.12, 0.07], [1.22, 0]],
        rund: [[1.4, 0], [1.6, 0.35], [2.3, 0.3], [2.5, 0]],
        brynX: [[1.3, 0], [1.6, 0.5], [2.4, 0.4], [3.0, 0]],
        brynY: [[1.3, 0], [1.6, 0.4], [2.4, 0.3], [3.0, 0]],
        le: [[2.2, 0], [2.6, 0.2], [3.2, 0]],
      },
    },
  });
  // Medan han pratar (talet): han är nöjd med det han säger, lugn och säker på sin sak, och händerna
  // hjälper till. Varje gest börjar och slutar med händerna på disken som när han pratar (5,5). Händernas
  // form (fA, fB) och svängning: se handForm och svang.
  // handen på väg ned mot disken igen, handflatan nedåt
  const nedA = (t, kr = 0.35) => [t, [-175, -215, 640], PA, [0.75, 0.15, 0.64], [0.2, -0.95, 0.25], kr, 0];
  const nedB = (t, kr = 0.3) => [t, [205, -215, 715], PB, [-0.35, 0.05, 0.94], [-0.1, -0.97, 0.15], kr, 0];
  // handflatan uppåt, fingrarna mot en
  const UPP_A = [[-0.35, 0.28, 0.9], [-0.1, 0.95, -0.3]];
  const UPP_B = [[0.45, 0.25, 0.86], [0.1, 0.95, -0.3]];
  const POL_UT_A = [-0.8, -0.55, 0.22];
  const POL_UT_B = [0.8, -0.55, 0.22];
  Object.assign(RORELSER, {
    // Handflatan upp mot en, med en liten knuff framåt: där har du det. Han lutar sig fram lite och nickar.
    oppna: {
      k: {
        yaw: [[0.5, 0.15], [2.3, 0.12], [3.0, 0]],
        pitch: [[0.4, -0.15], [0.85, 0.35], [1.2, 0.05], [2.3, 0.05], [2.9, 0]],
        roll: [[0.6, 0.07], [2.3, 0.06], [2.9, 0]],
        lut: [[0.6, 0.03], [2.3, 0.03], [3.0, 0]],
        axV: [[0.5, 8], [2.3, 8], [2.9, 0]],
        brynX: [[0.5, 0.5], [2.3, 0.4], [2.9, 0]],
        brynY: [[0.5, 0.3], [2.3, 0.25], [2.9, 0]],
        le: [[0.4, 0], [0.8, 0.5], [2.4, 0.45], [3.3, 0]],
        kis: [[0.4, 0], [0.8, 0.25], [2.3, 0.2], [2.9, 0]],
      },
      A: [
        [0.55, [-265, -105, 760], POL_UT_A, ...UPP_A, 0.15, 0],
        [0.85, [-270, -82, 795], POL_UT_A, ...UPP_A, 0.12, 0],
        [2.3, [-265, -95, 780], POL_UT_A, ...UPP_A, 0.15, 0],
        nedA(2.95),
      ],
      fA: { spar: [[0.5, 0.45], [2.3, 0.45], [2.9, 0]], tumme: [[0.5, 0.85], [2.3, 0.85], [2.9, TUMME]] },
    },
    // Båda handflatorna upp och axlarna upp, huvudet på sned och ett belåtet leende: vad ska man säga.
    axla: {
      k: {
        yaw: [[1.0, 0.2], [2.2, 0.15], [2.8, 0]],
        pitch: [[0.6, -0.2], [1.0, -0.35], [2.0, -0.3], [2.6, 0]],
        roll: [[0.6, 0.05], [1.0, 0.12], [2.0, 0.1], [2.6, 0]],
        lut: [[0.7, -0.03], [2.2, -0.03], [2.8, 0]],
        axV: [[0.6, 20], [1.0, 34], [1.9, 34], [2.4, 6], [2.9, 0]],
        axH: [[0.6, 20], [1.0, 34], [1.9, 34], [2.4, 6], [2.9, 0]],
        brynX: [[0.7, 0.9], [2.0, 0.8], [2.6, 0]],
        brynY: [[0.7, 0.6], [2.0, 0.5], [2.6, 0]],
        le: [[0.6, 0.2], [1.0, 0.55], [2.2, 0.5], [3.0, 0]],
        kis: [[0.6, 0], [1.0, 0.3], [2.2, 0.25], [2.8, 0]],
      },
      A: [
        [0.6, [-330, -100, 640], [-0.85, -0.5, 0.2], [-0.6, 0.2, 0.77], [0.05, 0.97, -0.2], 0.18, 0],
        [1.0, [-355, -65, 645], [-0.85, -0.5, 0.2], [-0.6, 0.2, 0.77], [0.05, 0.97, -0.2], 0.15, 0],
        [2.1, [-345, -80, 642], [-0.85, -0.5, 0.2], [-0.6, 0.2, 0.77], [0.05, 0.97, -0.2], 0.18, 0],
        nedA(2.8),
      ],
      B: [
        [0.45, [250, -150, 640], [0.85, -0.5, 0.2], [0.3, 0.2, 0.93], [-0.05, 0.97, -0.2], 0.2, 0],
        [0.75, [380, -95, 600], [0.85, -0.5, 0.2], [0.55, 0.2, 0.8], [-0.05, 0.97, -0.2], 0.18, 0],
        [1.05, [405, -60, 605], [0.85, -0.5, 0.2], [0.55, 0.2, 0.8], [-0.05, 0.97, -0.2], 0.15, 0],
        [2.15, [395, -75, 602], [0.85, -0.5, 0.2], [0.55, 0.2, 0.8], [-0.05, 0.97, -0.2], 0.18, 0],
        [2.5, [250, -160, 640], [0.85, -0.5, 0.2], [0.0, 0.1, 1], [-0.1, -0.9, 0.3], 0.25, 0],
        nedB(2.9),
      ],
      fA: { spar: [[0.6, 0.4], [2.1, 0.4], [2.8, 0]], tumme: [[0.6, 0.8], [2.1, 0.8], [2.8, TUMME]] },
      fB: { spar: [[0.6, 0.4], [2.1, 0.4], [2.8, 0]], tumme: [[0.6, 0.8], [2.1, 0.8], [2.8, TUMME]] },
    },
    // Handflatorna nedåt över disken, två lugna tryck med en nick för varje och halvslutna ögon, och sedan
    // isär: lugnt, lugnt, det här har vi koll på.
    lugnt: {
      k: {
        pitch: [[0.55, 0], [0.85, 0.45], [1.15, 0.1], [1.45, 0.45], [1.75, 0.1], [2.4, 0.15], [3.0, 0]],
        lut: [[0.85, 0.02], [1.45, 0.03], [2.4, -0.02], [3.0, 0]],
        brynX: [[0.6, 0.3], [2.5, 0.3], [3.1, 0]],
        blund: [[0.6, 0], [0.85, 0.35], [1.1, 0.2], [1.45, 0.4], [1.8, 0.15], [2.5, 0]],
        le: [[0.5, 0.3], [1.0, 0.5], [2.6, 0.45], [3.4, 0]],
        kis: [[0.5, 0], [1.0, 0.2], [2.6, 0.2], [3.2, 0]],
      },
      A: [
        [0.55, [-175, -130, 660], [-0.6, -0.75, 0.25], [0.62, -0.08, 0.78], [0.08, -0.99, 0.1], 0.12, 0],
        [0.85, [-178, -175, 665], [-0.6, -0.75, 0.25], [0.62, -0.12, 0.78], [0.08, -0.99, 0.1], 0.12, 0],
        [1.15, [-180, -135, 668], [-0.6, -0.75, 0.25], [0.62, -0.08, 0.78], [0.08, -0.99, 0.1], 0.12, 0],
        [1.45, [-185, -178, 672], [-0.6, -0.75, 0.25], [0.62, -0.12, 0.78], [0.08, -0.99, 0.1], 0.12, 0],
        [1.75, [-200, -140, 672], [-0.6, -0.75, 0.25], [0.62, -0.08, 0.78], [0.08, -0.99, 0.1], 0.12, 0],
        [2.35, [-300, -150, 640], [-0.7, -0.65, 0.25], [0.5, -0.08, 0.86], [0.05, -0.99, 0.1], 0.1, 0],
        [2.6, [-305, -152, 640], [-0.7, -0.65, 0.25], [0.5, -0.08, 0.86], [0.05, -0.99, 0.1], 0.1, 0],
        nedA(3.1),
      ],
      B: [
        [0.6, [210, -130, 700], [0.6, -0.75, 0.25], [-0.5, -0.08, 0.86], [-0.08, -0.99, 0.1], 0.12, 0],
        [0.88, [212, -175, 703], [0.6, -0.75, 0.25], [-0.5, -0.12, 0.86], [-0.08, -0.99, 0.1], 0.12, 0],
        [1.18, [214, -135, 705], [0.6, -0.75, 0.25], [-0.5, -0.08, 0.86], [-0.08, -0.99, 0.1], 0.12, 0],
        [1.48, [218, -178, 707], [0.6, -0.75, 0.25], [-0.5, -0.12, 0.86], [-0.08, -0.99, 0.1], 0.12, 0],
        [1.78, [228, -140, 705], [0.6, -0.75, 0.25], [-0.5, -0.08, 0.86], [-0.08, -0.99, 0.1], 0.12, 0],
        [2.38, [275, -150, 640], [0.7, -0.65, 0.25], [-0.4, -0.08, 0.91], [-0.05, -0.99, 0.1], 0.1, 0],
        [2.63, [278, -152, 640], [0.7, -0.65, 0.25], [-0.4, -0.08, 0.91], [-0.05, -0.99, 0.1], 0.1, 0],
        nedB(3.15),
      ],
      fA: { spar: [[0.5, 0.3], [2.3, 0.5], [3.0, 0]] },
      fB: { spar: [[0.5, 0.3], [2.3, 0.5], [3.0, 0]] },
    },
    // Räknar på fingrarna, med handen uppe vid axeln och handflatan mot en: pekfingret (ett), en nick,
    // långfingret också (två), och en nick till.
    tva: {
      k: {
        yaw: [[0.5, 0.1], [2.8, 0.08], [3.4, 0]],
        pitch: [[0.5, 0.1], [0.75, 0.45], [1.05, 0.1], [1.75, 0.5], [2.05, 0.1], [2.9, 0.1], [3.4, 0]],
        roll: [[0.6, 0.05], [2.8, 0.05], [3.3, 0]],
        axV: [[0.5, 14], [2.8, 14], [3.3, 0]],
        brynX: [[0.6, 0.6], [1.75, 0.8], [2.8, 0.6], [3.3, 0]],
        brynY: [[0.6, 0.3], [1.75, 0.4], [2.8, 0.3], [3.3, 0]],
        le: [[0.6, 0.3], [1.8, 0.5], [3.0, 0.4], [3.8, 0]],
        kis: [[0.6, 0], [1.8, 0.3], [3.0, 0.25], [3.6, 0]],
      },
      A: [
        [0.5, [-330, 90, 520], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [0.75, [-325, 100, 545], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [1.4, [-328, 95, 530], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [1.75, [-322, 105, 560], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [2.8, [-325, 100, 550], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        nedA(3.4),
      ],
      fA: { tumme: [[0.4, 0.1], [2.8, 0.1], [3.4, TUMME]], e1: [[1.45, 0], [1.7, -0.98], [2.85, -0.98], [3.3, 0]] },
    },
    // Tummen upp mot en, med en liten knyck, en nick och ett belåtet kisande.
    tummen: {
      k: {
        yaw: [[0.8, 0.15], [2.0, 0.1], [2.6, 0]],
        pitch: [[0.5, 0], [0.8, 0.4], [1.1, 0.05], [2.0, 0.05], [2.6, 0]],
        roll: [[0.8, 0.08], [2.0, 0.06], [2.6, 0]],
        brynX: [[0.6, 0.6], [2.0, 0.5], [2.6, 0]],
        brynY: [[0.6, 0.3], [2.0, 0.25], [2.6, 0]],
        le: [[0.4, 0.3], [0.8, 0.6], [2.1, 0.55], [2.9, 0]],
        kis: [[0.4, 0], [0.8, 0.45], [2.0, 0.4], [2.6, 0]],
      },
      A: [
        [0.5, [-280, -50, 640], POL_UT_A, [0.8, 0.15, 0.58], [0.55, 0, -0.83], 1, 0],
        [0.78, [-282, -25, 655], POL_UT_A, [0.8, 0.15, 0.58], [0.55, 0, -0.83], 1, 0],
        [0.95, [-280, -55, 645], POL_UT_A, [0.8, 0.15, 0.58], [0.55, 0, -0.83], 1, 0],
        [2.0, [-280, -48, 648], POL_UT_A, [0.8, 0.15, 0.58], [0.55, 0, -0.83], 1, 0],
        nedA(2.6, 0.5),
      ],
      fA: { tumme: [[0.4, 1], [2.1, 1], [2.6, TUMME]], e8: [[0.3, 0], [0.5, 1], [2.1, 1], [2.5, 0]] },
    },
    // Handen på bröstet och två klappar, hakan upp och ögonen halvslutna: det säger jag.
    brost: {
      k: {
        pitch: [[0.5, -0.2], [1.1, -0.45], [1.5, -0.5], [2.4, -0.4], [3.0, 0]],
        lut: [[0.6, -0.03], [2.4, -0.04], [3.0, 0]],
        axV: [[0.6, 10], [2.4, 10], [3.0, 0]],
        brynX: [[0.6, 0.5], [2.4, 0.5], [3.0, 0]],
        brynY: [[0.6, 0.4], [2.4, 0.4], [3.0, 0]],
        blund: [[0.9, 0], [1.2, 0.45], [2.3, 0.4], [2.7, 0]],
        le: [[0.5, 0.3], [1.0, 0.55], [2.5, 0.5], [3.3, 0]],
      },
      A: [
        [0.6, [-160, 95, 235], [-0.9, -0.4, 0.15], [0.9, 0.25, -0.1], [0.1, 0, -1], 0.15, 0],
        [0.95, [-160, 100, 270], [-0.9, -0.4, 0.15], [0.9, 0.25, -0.1], [0.1, 0, -1], 0.15, 0],
        [1.1, [-160, 95, 235], [-0.9, -0.4, 0.15], [0.9, 0.25, -0.1], [0.1, 0, -1], 0.15, 0],
        [1.35, [-160, 100, 270], [-0.9, -0.4, 0.15], [0.9, 0.25, -0.1], [0.1, 0, -1], 0.15, 0],
        [1.5, [-160, 95, 235], [-0.9, -0.4, 0.15], [0.9, 0.25, -0.1], [0.1, 0, -1], 0.15, 0],
        [2.4, [-160, 95, 235], [-0.9, -0.4, 0.15], [0.9, 0.25, -0.1], [0.1, 0, -1], 0.15, 0],
        [2.95, [-200, -150, 560], PA, [0.6, 0.2, 0.75], [0.2, -0.9, 0.35], 0.3, 0],
      ],
    },
    // Gnuggar händerna framför sig, belåten, med axlarna lite uppe: det här blir bra.
    gnida: {
      k: {
        yaw: [[0.6, 0.12], [2.6, 0.1], [3.2, 0]],
        pitch: [[0.5, 0.25], [1.0, 0.1], [1.6, 0.25], [2.2, 0.1], [2.8, 0.15], [3.3, 0]],
        lut: [[0.6, 0.04], [2.6, 0.04], [3.2, 0]],
        axV: [[0.6, 16], [2.6, 16], [3.2, 0]],
        axH: [[0.6, 16], [2.6, 16], [3.2, 0]],
        brynX: [[0.6, 0.7], [2.6, 0.6], [3.2, 0]],
        brynY: [[0.6, 0.4], [2.6, 0.35], [3.2, 0]],
        le: [[0.4, 0.4], [0.9, 0.65], [2.7, 0.6], [3.5, 0]],
        kis: [[0.4, 0], [0.9, 0.45], [2.7, 0.4], [3.3, 0]],
      },
      A: [
        [0.55, [-48, -115, 540], [-0.7, -0.7, 0.15], [0.02, 0.4, 0.92], [1, 0, -0.05], 0.15, 0],
        [2.65, [-48, -115, 540], [-0.7, -0.7, 0.15], [0.02, 0.4, 0.92], [1, 0, -0.05], 0.15, 0],
        nedA(3.2),
      ],
      B: [
        [0.55, [52, -115, 555], [0.7, -0.7, 0.15], [0.02, 0.4, 0.92], [-1, 0, 0.05], 0.15, 0],
        [2.65, [52, -115, 555], [0.7, -0.7, 0.15], [0.02, 0.4, 0.92], [-1, 0, 0.05], 0.15, 0],
        nedB(3.2),
      ],
      fA: { sv: { amp: [[0.6, 0], [0.8, 1], [2.4, 1], [2.6, 0]], f: 2.6, x: [0, 22, 14] } },
      fB: { sv: { amp: [[0.6, 0], [0.8, 1], [2.4, 1], [2.6, 0]], f: 2.6, x: [0, -22, -14] } },
    },
    // Lutar sig bakåt, belåten, med hakan upp, och klappar disken två gånger.
    nojd: {
      k: {
        pitch: [[0.5, -0.35], [1.15, -0.1], [1.4, -0.35], [1.75, -0.05], [2.1, -0.35], [2.8, -0.3], [3.4, 0]],
        lut: [[0.6, -0.05], [2.6, -0.05], [3.4, 0]],
        axV: [[0.6, 10], [2.6, 10], [3.2, 0]],
        axH: [[0.6, 10], [2.6, 10], [3.2, 0]],
        brynX: [[0.7, 0.4], [2.7, 0.4], [3.3, 0]],
        blund: [[0.7, 0], [1.0, 0.35], [2.6, 0.3], [3.0, 0]],
        le: [[0.4, 0.4], [0.9, 0.65], [2.8, 0.6], [3.6, 0]],
        kis: [[0.4, 0], [0.9, 0.4], [2.8, 0.35], [3.4, 0]],
      },
      A: [
        [0.9, [slagAr.W[0] - 10, slagAr.W[1] + 80, slagAr.W[2] + 10], ...SLAG_A.slice(1)],
        slagA(1.15, true), studsA(1.22, 10),
        [1.5, [slagAr.W[0] - 10, slagAr.W[1] + 80, slagAr.W[2] + 10], ...SLAG_A.slice(1)],
        slagA(1.75, true), studsA(1.82, 8), slagA(2.0), slagA(2.9),
      ],
    },
    // Handen rullar framåt i små cirklar: och så rullar det på.
    rulla: {
      k: {
        yaw: [[0.6, -0.1], [2.6, -0.1], [3.2, 0]],
        pitch: [[0.6, 0.1], [2.6, 0.1], [3.2, 0]],
        brynX: [[0.6, 0.5], [2.6, 0.5], [3.2, 0]],
        brynY: [[0.6, 0.3], [2.6, 0.3], [3.2, 0]],
        le: [[0.5, 0.4], [2.8, 0.45], [3.5, 0]],
        kis: [[0.5, 0], [0.8, 0.25], [2.8, 0.25], [3.4, 0]],
      },
      A: [
        [0.6, [-300, -45, 640], POL_UT_A, [0.2, 0.3, 0.93], [0.85, 0.35, -0.3], 0.12, 0],
        [2.8, [-300, -45, 640], POL_UT_A, [0.2, 0.3, 0.93], [0.85, 0.35, -0.3], 0.12, 0],
        nedA(3.2),
      ],
      fA: { spar: [[0.6, 0.3], [2.8, 0.3], [3.2, 0]], sv: { amp: [[0.5, 0], [0.9, 1], [2.5, 1], [2.95, 0]], f: 1.5, x: [0, 0, 45], y: [0, 45, 0], F: [0, 0.35, 0] } },
    },
  });
  // Klippen in i tidslinjen: nycklarna i tidslinjens tid, med början och slut.
  const KL = [];
  const tom = (a = 0, b = 0) => [[0, a], [1e-3, b]];
  const HALLER_B = [[slagBr.W[0] + 85, slagBr.W[1] - 6, slagBr.W[2] - 190], [0.7, -0.62, 0.32], [-0.08, -0.2, 0.97], [-0.1, -0.98, 0.12], 0.34, 0];
  // Din kupong: han tittar ned och tar pennan, och när han skriver tittar han på en med höjda bryn, för
  // det är så självklart att han inte behöver titta. När det är gjort är han nöjd.
  for (const n of [1, 2, 3]) {
    const E = skrivSlut(n);
    const T = skrivTid(n);
    RORELSER[`skriv${n}`] = {
      k: {
        yaw: [[0.1, 0], [0.6, -0.25], [SKRIV.MOT + 0.35, -0.2], [SKRIV.MOT + 0.75, 0.1], [T - 1.2, 0.1], [T, 0]],
        pitch: [[0.1, 0], [0.55, 1.2], [SKRIV.MOT + 0.35, 1.2], [SKRIV.MOT + 0.75, 0.5], [E, 0.45], [E + 0.3, 0.15], [T - 1.3, 0.15], [T - 0.9, 0.75], [T - 0.4, 0.5], [T, 0]],
        lut: [[0.3, 0.03], [SKRIV.MOT + 0.3, 0.075], [E, 0.08], [E + 0.5, 0.025], [T - 0.9, 0.04], [T, 0]],
        vrid: [[0.3, -0.02], [SKRIV.MOT + 0.3, 0.05], [E, 0.06], [E + 0.5, 0.01], [T, 0]],
        axV: [[0.3, 8], [SKRIV.MOT, 20], [E, 22], [E + 0.5, 12], [T - 0.6, 8], [T, 0]],
        brynX: [[0.2, 0], [SKRIV.MOT + 0.4, 0.1], [SKRIV.MOT + 0.8, 0.55], [E, 0.6], [E + 0.3, 0.7], [T - 0.9, 0.35], [T - 0.2, 0]],
        brynY: [[0.2, 0], [SKRIV.MOT + 0.4, 0.1], [SKRIV.MOT + 0.8, 0.5], [E, 0.55], [E + 0.3, 0.65], [T - 0.9, 0.3], [T - 0.2, 0]],
        blund: [[0.2, 0], [0.55, 0.42], [SKRIV.MOT + 0.35, 0.42], [SKRIV.MOT + 0.65, 0], [T - 1.1, 0], [T - 0.85, 0.3], [T - 0.5, 0.12], [T, 0]],
        le: [[E - 0.1, 0], [E + 0.45, 0.72], [T - 1, 0.55], [T - 0.1, 0.1]],
        kis: [[E + 0.1, 0], [E + 0.5, 0.25], [T - 1, 0.1]],
      },
      // den vänstra handen drar sig undan till kupongens övre hörn och håller i den, så att rutorna syns
      B: [[0.2, ...VILA_B], [0.95, ...HALLER_B], [T - 1, ...HALLER_B], [T - 0.2, ...VILA_B]],
      pen: { n },
    };
  }
  // Din kupong (grupp spana): blicken går ned på den, ögonen först och huvudet efter, och det är minen som
  // skiljer klippen åt. Kupongen ligger framför honom, så blicken stannar på disken mellan händerna. Hakan
  // går inte ned mer än till notan (notan): lutar huvudet mer ser han arg ut, så det är ögonen och locken som
  // visar vart han tittar. spanNed: ögonen ned vid a och upp igen vid b, spanLock: locken samtidigt,
  // spanHuv: huvudet samtidigt.
  const spanNed = (a, b) => ({
    blickX: [[a, 0], [a + 0.12, -2], [b, -2], [b + 0.15, 0]],
    blickY: [[a, 0], [a + 0.12, 6], [b, 6], [b + 0.15, 0]],
  });
  const spanLock = (a, b) => [[a + 0.1, 0], [a + 0.35, 0.42], [b, 0.42], [b + 0.15, 0]];
  const SPAN_P = 0.5;
  const SPAN_Y = -0.18;
  Object.assign(RORELSER, {
    // Ett bryn åker upp medan han läser, och det står kvar när han tittar upp på en med hakan lite upp.
    spanaBryn: {
      k: {
        ...spanNed(0.1, 1.7),
        blund: spanLock(0.1, 1.7),
        pitch: [[0.15, 0], [0.6, SPAN_P], [1.65, SPAN_P], [2.05, -0.25], [3.0, -0.25]],
        yaw: [[0.15, 0], [0.6, SPAN_Y], [1.65, SPAN_Y], [2.05, 0.12], [3.0, 0.12]],
        brynX: [[0.9, 0], [1.25, 1.7], [3.0, 1.6], [3.7, 0]],
        brynY: [[0.9, 0], [1.25, 0.1], [3.0, 0.1], [3.7, 0]],
        le: [[2.0, 0], [2.5, 0.6], [3.0, 0.6], [3.7, 0]],
      },
    },
    // Han läser, leendet viker undan lite, och huvudet går långsamt fram och tillbaka. Sedan pustar han ut
    // och tittar upp.
    spanaSkaka: {
      k: {
        ...spanNed(0.1, 3.1),
        blund: spanLock(0.1, 3.1),
        pitch: [[0.15, 0], [0.6, SPAN_P], [3.05, SPAN_P], [3.5, 0]],
        yaw: [[0.15, 0], [0.6, SPAN_Y], [1.15, SPAN_Y], [1.6, -0.8], [2.1, 0.35], [2.6, -0.7], [3.05, SPAN_Y], [3.5, 0]],
        brynX: [[0.6, 0], [1.0, -0.25], [3.0, -0.25], [3.6, 0]],
        brynY: [[0.6, 0], [1.0, -0.3], [3.0, -0.3], [3.6, 0]],
        andas: [[2.9, 0], [3.3, -7], [3.9, 0]],
      },
    },
    // Leendet växer medan han läser, två små nickar, och han tittar upp med leendet i ögonen.
    spanaNojd: {
      k: {
        ...spanNed(0.1, 2.1),
        blund: spanLock(0.1, 2.1),
        pitch: [[0.15, 0], [0.6, SPAN_P], [1.25, SPAN_P], [1.5, 0.2], [1.75, 0.65], [2.0, 0.25], [2.45, 0]],
        yaw: [[0.15, 0], [0.6, SPAN_Y], [2.0, SPAN_Y], [2.45, 0]],
        brynX: [[0.8, 0], [1.3, 0.35], [2.7, 0.35], [3.4, 0]],
        brynY: [[0.8, 0], [1.3, 0.3], [2.7, 0.3], [3.4, 0]],
        le: [[0.8, 0], [1.4, 0.8], [2.7, 0.85], [3.5, 0]],
        kis: [[0.9, 0], [1.5, 0.45], [2.7, 0.45], [3.4, 0]],
      },
    },
    // Han läser, ögonen sluts långsamt medan han andas in, och sedan andas han ut och tittar på en igen.
    spanaBlund: {
      k: {
        ...spanNed(0.1, 2.95),
        blund: [[0.2, 0], [0.45, 0.42], [1.3, 0.42], [1.8, 0.92], [2.8, 0.92], [3.1, 0]],
        pitch: [[0.15, 0], [0.6, SPAN_P], [1.3, SPAN_P], [1.8, 0.35], [2.8, 0.3], [3.3, 0]],
        yaw: [[0.15, 0], [0.6, SPAN_Y], [2.8, SPAN_Y], [3.3, 0]],
        brynX: [[1.2, 0], [1.8, 0.5], [2.8, 0.5], [3.4, 0]],
        brynY: [[1.2, 0], [1.8, 0.5], [2.8, 0.5], [3.4, 0]],
        andas: [[1.2, 0], [1.7, 8], [2.0, 8], [2.9, -7], [3.6, 0]],
        axV: [[1.2, 0], [1.7, 7], [2.0, 7], [2.9, -3], [3.6, 0]],
        axH: [[1.2, 0], [1.7, 7], [2.0, 7], [2.9, -3], [3.6, 0]],
      },
    },
    // Huvudet står nästan still och bara ögonen går ned, två gånger. Andra gången märker han att man ser
    // det: brynen upp, blicken bort längs baren och hakan upp, som om inget har hänt.
    spanaSmyg: {
      k: {
        blickX: [[0.3, 0], [0.4, -2], [0.95, -2], [1.05, 0], [1.5, 0], [1.6, -2], [2.1, -2], [2.2, 0], [2.3, -4.5], [3.2, -4.5], [3.32, 0]],
        blickY: [[0.3, 0], [0.4, 6.5], [0.95, 6.5], [1.05, 0], [1.5, 0], [1.6, 6.5], [2.1, 6.5], [2.2, 0], [2.3, -2], [3.2, -2], [3.32, 0]],
        blund: [[0.3, 0], [0.42, 0.3], [0.95, 0.3], [1.05, 0], [1.5, 0], [1.62, 0.3], [2.1, 0.3], [2.2, 0]],
        pitch: [[0.3, 0], [0.5, 0.15], [2.1, 0.15], [2.6, -0.4], [3.3, -0.4], [4.0, 0]],
        yaw: [[2.15, 0], [2.65, -0.3], [3.3, -0.3], [4.0, 0]],
        brynX: [[2.1, 0], [2.3, 0.9], [3.2, 0.8], [3.9, 0]],
        brynY: [[2.1, 0], [2.3, 0.9], [3.2, 0.8], [3.9, 0]],
        le: [[3.1, 0], [3.5, 0.6], [4.1, 0]],
      },
    },
    // Han lutar sig fram och kisar: vad står det där? Sedan sätter han sig tillbaka med brynen uppe, och
    // munnen säger oj.
    spanaKis: {
      k: {
        ...spanNed(0.1, 2.3),
        pitch: [[0.15, 0], [0.8, 0.6], [2.25, 0.6], [2.7, -0.2], [3.5, -0.2]],
        yaw: [[0.15, 0], [0.8, SPAN_Y], [2.25, SPAN_Y], [2.7, 0.1], [3.5, 0.1]],
        lut: [[0.2, 0], [0.9, 0.05], [2.25, 0.05], [2.8, -0.015], [3.5, -0.015]],
        kis: [[0.5, 0], [0.9, 0.75], [2.25, 0.75], [2.5, 0]],
        brynX: [[2.25, 0], [2.55, 0.9], [3.4, 0.8], [4.1, 0]],
        brynY: [[2.25, 0], [2.55, 0.9], [3.4, 0.8], [4.1, 0]],
        rund: [[2.45, 0], [2.7, 0.45], [3.2, 0.4], [3.5, 0]],
        munn: [[2.45, 0], [2.7, 0.04], [3.2, 0.04], [3.5, 0]],
      },
    },
  });
  // ---------- sysslorna (KLIPP raknar …) ----------
  // Ertappad: ögonen upp på en medan huvudet står kvar, brynen upp, locken öppna och inget leende (stel tar
  // bort det han alltid har, NOJD i rita), och han håller andan. Sedan låtsas han som ingenting, med
  // eftertryck: hakan upp, brynen ned, en bestämd nick, och leendet tillbaka. Han rör sig som en man som
  // vet att han har rätt, också när han inte har det.
  Object.assign(RORELSER, {
    // Fingrarna: knuten hand upp bredvid sig, och han räknar sina rätt med en nick för varje: ett, två,
    // tre. Lillfingret är på väg upp men tvekar och fälls ned igen, och han tittar på handen med huvudet på
    // sned. Då ser han en. Han fryser med tre fingrar i luften, och sedan knyts handen, han tittar en i
    // ögonen och slår näven i disken: så är det. Hakan upp och ett höjt bryn: något mer?
    raknar: {
      k: {
        yaw: [[0.4, -0.3], [4.3, -0.32], [5.5, -0.3], [5.85, 0.25], [6.45, 0.3], [7.3, 0.15], [8.6, 0]],
        pitch: [[0.4, 0.3], [1.0, 0.25], [1.15, 0.5], [1.4, 0.25], [1.7, 0.25], [1.85, 0.5], [2.1, 0.25], [2.45, 0.25], [2.6, 0.5], [2.85, 0.28], [3.4, 0.35], [4.3, 0.35], [4.42, 0.18], [4.7, 0.24], [5.5, 0.25],
          [5.85, -0.05], [6.4, 0.1], [6.5, 0.1], [6.6, 1.2], [6.85, 0.4], [7.05, 0.75], [7.3, 0.2], [7.6, -0.35], [8.4, -0.3], [9.2, 0]],
        roll: [[0.5, 0.03], [3.3, 0.03], [3.7, 0.1], [4.3, 0.1], [5.5, 0.1], [5.85, 0], [7.6, 0.03], [8.6, 0]],
        lut: [[0.5, 0.03], [4.3, 0.04], [4.42, 0.01], [5.5, 0.02], [6.2, 0.06], [6.52, 0.13], [6.9, 0.05], [7.6, -0.02], [8.6, 0]],
        vrid: [[0.5, -0.05], [5.5, -0.05], [6.4, -0.08], [6.55, 0.05], [7.2, 0.02], [8.6, 0]],
        axV: [[0.5, 12], [4.3, 14], [5.5, 14], [6.0, 28], [6.4, 38], [6.52, 4], [6.8, 8], [7.6, 4], [8.6, 0]],
        brynX: [[0.5, 0.2], [1.2, 0.35], [2.6, 0.5], [3.4, 0.55], [3.8, 0.35], [4.25, 0.3], [4.4, 1.15], [5.4, 1.05], [5.75, -0.6], [6.45, -0.75], [6.6, 0.4], [7.0, 0.2], [7.6, 1.2], [8.4, 1.1], [9.1, 0]],
        brynY: [[0.5, 0.2], [1.2, 0.3], [2.6, 0.45], [3.4, -0.25], [3.8, -0.3], [4.25, -0.2], [4.4, 1.1], [5.4, 1.0], [5.75, -0.85], [6.45, -0.95], [6.6, -0.3], [7.0, -0.4], [7.6, 0.15], [8.4, 0.15], [9.1, 0]],
        blickX: [[0.3, 0], [0.5, -3.2], [4.3, -3.2], [4.42, 1.8], [5.45, 1.8], [5.7, 0]],
        blickY: [[0.3, 0], [0.5, 3.5], [4.3, 3.5], [4.42, -1.2], [5.45, -1.2], [5.7, 0]],
        blund: [[0.3, 0], [0.5, 0.3], [4.3, 0.3], [4.4, 0], [6.5, 0], [6.55, 0.85], [6.7, 0]],
        stel: [[4.3, 0], [4.4, 1], [5.6, 1], [6.2, 0]],
        kis: [[5.6, 0], [6.0, 0.4], [6.5, 0.45], [6.8, 0.2], [7.6, 0.3], [8.4, 0.3], [9.0, 0]],
        munn: [[1.08, 0], [1.16, 0.05], [1.3, 0], [1.78, 0], [1.86, 0.06], [2.0, 0], [2.53, 0], [2.61, 0.05], [2.75, 0], [4.35, 0], [4.45, 0.05], [5.5, 0.04], [5.6, 0], [6.5, 0], [6.58, 0.08], [6.75, 0]],
        rund: [[3.4, 0], [3.65, 0.35], [4.2, 0.3], [4.4, 0]],
        andas: [[3.9, 0], [4.15, -5], [4.3, -2], [4.45, 4], [5.4, 4], [5.9, 0]],
        le: [[0.5, 0.25], [2.6, 0.35], [3.3, 0.05], [7.6, 0.35], [8.4, 0.4], [9.4, 0]],
      },
      A: [
        [0.55, [-300, 40, 520], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 0],
        [0.9, [-330, 88, 520], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 0],
        [1.15, [-326, 98, 534], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [1.7, [-330, 90, 522], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [1.85, [-326, 99, 535], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [2.45, [-330, 91, 523], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [2.6, [-326, 100, 536], [-0.85, -0.5, 0.15], [0.12, 0.96, 0.25], [0.35, -0.05, 0.93], 0.95, 1],
        [3.5, [-332, 94, 524], [-0.85, -0.5, 0.15], [0.1, 0.96, 0.28], [0.4, -0.05, 0.91], 0.95, 1],
        [4.3, [-334, 92, 520], [-0.85, -0.5, 0.15], [0.1, 0.96, 0.28], [0.4, -0.05, 0.91], 0.95, 1],
        [5.5, [-334, 92, 520], [-0.85, -0.5, 0.15], [0.1, 0.96, 0.28], [0.4, -0.05, 0.91], 0.95, 1],
        [5.75, [-300, 95, 515], [-0.8, -0.6, 0.2], [0.1, 0.95, 0.3], [0.95, -0.1, 0.2], 1, 0],
        [6.05, [-262, 125, 505], [-0.8, -0.6, 0.2], [0.08, 0.95, 0.3], [0.45, -0.1, -0.88], 1, 0],
        [6.3, [-258, 140, 500], [-0.8, -0.6, 0.2], [0.08, 0.95, 0.3], [0.45, -0.1, -0.88], 1, 0],
        [6.5, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0, true],
        [6.58, [-175, -214, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0],
        [6.73, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 1, 0],
        [7.6, [-175, -232, 575], PA, [0.55, -0.05, 0.83], [0.83, 0.05, -0.55], 0.95, 0],
        [8.2, [-150, -240, 590], PA, [0.75, -0.08, 0.65], [0.4, -0.9, -0.1], 0.5, 0],
      ],
      // (ett, två och tre: pekfingret med armens peka, långfingret e1 och ringfingret e2; lillfingret e3
      // tvekar; tummen in mot handen)
      fA: {
        tumme: [[0.5, 0.1], [5.5, 0.1], [5.8, 0.05], [8.2, 0.1], [8.9, TUMME]],
        e1: [[1.7, 0], [1.85, -0.98], [5.5, -0.98], [5.68, 0]],
        e2: [[2.45, 0], [2.6, -0.97], [5.5, -0.97], [5.7, 0]],
        e3: [[3.15, 0], [3.5, -0.55], [3.75, -0.5], [4.0, 0]],
        e5: [[1.7, 0], [1.85, 4], [5.5, 4], [5.7, 0]],
        e6: [[2.45, 0], [2.6, 6], [5.5, 6], [5.7, 0]],
      },
    },
    // Koppen är tom: han dricker, lutar den mer och mer med huvudet bakåt och armbågen ute, och skakar ur
    // de sista dropparna. Han sänker den till bröstet, tittar ned i den och snurrar den. Då ser han en, med
    // huvudet kvar över koppen och bara ögonen uppe. Han lyfter den igen och tar en klunk som inte finns, ah,
    // med slutna ögon och höjda bryn, nickar bestämt mot en och ställer ned den med en smäll.
    tomKopp: {
      k: {
        dricker: [[2.0, 0], [2.35, 1], [3.3, 1], [3.5, 0.6], [4.2, 0.6], [4.45, 0], [8.0, 0], [8.3, 1], [8.8, 1], [9.0, 0]],
        pitch: [[2.3, -0.2], [3.0, -0.75], [3.5, -1.1], [4.15, -1.1], [4.6, 0.4], [5.0, 1.45], [6.3, 1.45], [6.42, 1.38], [7.4, 1.4], [7.9, -0.2], [8.8, -0.2],
          [9.2, -0.55], [9.9, -0.6], [10.15, -0.25], [10.3, 0.45], [10.5, -0.05], [10.65, 0.35], [10.85, -0.1], [11.3, 0.1], [12.0, 0]],
        yaw: [[2.0, 0], [4.4, 0.05], [5.0, 0.2], [6.3, 0.2], [7.4, 0.18], [7.9, 0.05], [10.1, 0], [10.3, 0.12], [11.2, 0.1], [12.0, 0]],
        roll: [[3.4, 0], [3.6, 0.05], [3.8, -0.03], [4.0, 0.05], [4.3, 0], [5.0, 0.04], [7.4, 0.04], [7.9, 0]],
        lut: [[3.0, -0.02], [3.6, -0.05], [4.2, -0.05], [4.8, 0.04], [7.4, 0.04], [7.9, 0], [9.2, -0.03], [9.9, -0.03], [10.3, 0.03], [11.0, 0]],
        axH: [[2.8, 0], [3.5, 16], [4.2, 16], [4.6, 0], [9.1, 0], [9.4, 10], [9.9, 8], [10.3, 0]],
        axV: [[9.1, 0], [9.4, 8], [9.9, 6], [10.3, 0]],
        brynX: [[3.4, 0], [3.7, -0.35], [4.2, -0.4], [4.8, 0.2], [5.2, 0.75], [6.3, 0.7], [6.42, 1.15], [7.3, 1.05], [7.8, -0.35], [8.8, -0.3], [9.2, 1.0], [9.9, 0.9], [10.2, -0.25], [10.9, -0.3], [11.5, 0.8], [12.2, 0]],
        brynY: [[3.4, 0], [3.7, -0.5], [4.2, -0.55], [4.8, 0.1], [5.2, 0.6], [6.3, 0.55], [6.42, 1.1], [7.3, 1.0], [7.8, -0.45], [8.8, -0.4], [9.2, 0.4], [9.9, 0.35], [10.2, -0.4], [10.9, -0.45], [11.5, 0.1], [12.2, 0]],
        blickY: [[3.5, 0], [3.7, 3], [4.3, 3], [4.6, 0], [4.8, 4], [6.3, 4], [6.42, -3.2], [7.4, -3.2], [7.9, 0]],
        blickX: [[4.8, 0], [5.0, 1.5], [6.3, 1.5], [6.42, -0.6], [7.4, -0.6], [7.9, 0]],
        blund: [[3.45, 0], [3.6, 0], [4.8, 0], [5.0, 0.3], [6.3, 0.3], [6.4, 0], [9.0, 0], [9.2, 0.85], [9.9, 0.85], [10.1, 0]],
        stel: [[6.35, 0], [6.45, 1], [7.5, 1], [8.0, 0]],
        rund: [[5.3, 0], [5.45, 0.4], [5.8, 0.35], [5.95, 0], [9.1, 0], [9.25, 0.3], [9.9, 0.3], [10.05, 0]],
        munn: [[5.3, 0], [5.45, 0.04], [5.8, 0.03], [5.95, 0], [6.4, 0], [6.5, 0.04], [7.4, 0.04], [7.55, 0], [9.1, 0], [9.25, 0.12], [9.9, 0.1], [10.05, 0]],
        andas: [[6.3, 0], [6.5, 5], [7.4, 5], [7.8, 0], [9.0, 0], [9.3, 8], [9.9, -4], [10.3, 0]],
        kis: [[10.1, 0], [10.3, 0.45], [10.9, 0.4], [11.4, 0.2], [12.0, 0]],
        le: [[9.2, 0], [9.6, 0.6], [10.1, 0.4], [10.9, 0.35], [11.6, 0.55], [12.4, 0]],
      },
      kaffe: {
        kk: [[1.1, 'fat'], [2.0, 'mun', 60], [4.3, 'mun'], [4.95, 'brost', 10], [7.4, 'brost'], [8.0, 'mun', 20], [8.85, 'mun'], [9.3, 'ah'], [10.8, 'ah'], [11.4, 'fat', 20]],
        tipp: [[2.0, 0], [2.35, 0.5], [2.8, 0.75], [3.2, 0.95], [3.5, 1.15], [3.65, 1.05], [3.8, 1.2], [3.95, 1.07], [4.1, 1.18], [4.4, 0], [8.0, 0], [8.3, 0.5], [8.75, 0.55], [8.95, 0]],
        snurr: [[5.35, 0], [5.55, 1], [6.1, 1], [6.3, 0]],
        arm: [[2.8, 0], [3.5, 0.45], [4.2, 0.45], [4.7, 0]],
        ...grepp(11.4),
      },
    },
    // Cigarren har slocknat: han drar ett bloss, men ingenting. Han tittar misstänksamt på den, drar
    // hårdare, och tittar igen, och blåser på glöden med runda läppar. Då ser han en, med läpparna kvar i ett
    // o. Han stoppar den i munnen, drar ett nöjt bloss med slutna ögon och blåser ut röken, som inte finns,
    // länge och med huvudet bakåt, nickar mot en och lägger tillbaka den.
    slocknad: cigarrKlipp(15.2, {
      yaw: [[2.0, 0.05], [3.7, 0.05], [4.2, -0.3], [4.7, -0.5], [5.9, -0.5], [6.4, 0.05], [7.9, 0.05], [8.35, -0.3], [8.9, -0.55], [10.0, -0.55], [11.0, -0.5], [11.4, 0.05],
        [12.4, 0.05], [12.9, 0.3], [13.9, 0.3], [14.2, 0.05], [14.6, 0.1]],
      pitch: [[2.0, 0.25], [3.7, 0.25], [4.7, 0.4], [5.9, 0.4], [6.4, 0.2], [7.0, 0.1], [7.9, 0.1], [8.9, 0.45], [10.0, 0.45], [10.12, 0.32], [11.0, 0.35], [11.4, -0.25], [12.4, -0.25],
        [12.9, -0.95], [13.8, -1.0], [14.15, 0], [14.3, 0.45], [14.45, 0.05], [14.6, 0.35]],
      roll: [[4.4, 0], [4.8, 0.06], [5.9, 0.06], [6.3, 0], [8.9, 0.05], [10.0, 0.05], [11.2, 0]],
      lut: [[2.0, 0], [3.4, -0.01], [6.4, 0], [7.2, -0.04], [7.9, -0.04], [8.4, 0], [10.12, -0.02], [11.0, -0.02], [12.9, -0.05], [13.8, -0.05], [14.4, 0.02]],
      axV: [[2.0, 20], [3.0, 26], [3.7, 22], [4.6, 14], [6.4, 20], [7.6, 36], [7.9, 34], [8.6, 16], [10.0, 16], [11.4, 20], [12.3, 28], [13.6, 8], [14.4, 12]],
      brynX: [[2.2, 0.2], [3.5, 0.3], [4.4, -0.35], [5.8, -0.5], [6.6, 0.6], [7.8, 0.7], [8.6, -0.1], [9.2, 0.3], [10.0, 0.3], [10.12, 1.15], [11.0, 1.05], [11.4, -0.3], [12.3, 0.4], [13.8, 0.3], [14.1, -0.2], [14.6, 0.3]],
      brynY: [[2.2, 0.2], [3.5, 0.25], [4.4, -0.5], [5.8, -0.65], [6.6, 0.6], [7.8, 0.7], [8.6, -0.1], [9.2, 0.3], [10.0, 0.3], [10.12, 1.1], [11.0, 1.0], [11.4, -0.4], [12.3, 0.4], [13.8, 0.3], [14.1, -0.3], [14.6, 0.1]],
      blickX: [[2.0, 0], [4.2, 0], [4.6, -3.5], [5.9, -3.5], [6.3, 0], [8.4, 0], [8.8, -4], [10.0, -4], [10.12, 2.4], [11.0, 2.4], [11.3, 0]],
      blickY: [[2.0, 0], [4.2, 0], [4.6, 1.5], [5.9, 1.5], [6.3, 0], [8.4, 0], [8.8, 1.8], [10.0, 1.8], [10.12, -1.6], [11.0, -1.6], [11.3, 0]],
      blund: [[2.15, 0], [2.5, 0.55], [3.2, 0.5], [3.5, 0], [6.5, 0], [6.9, 0.45], [7.8, 0.45], [8.0, 0], [11.6, 0], [11.9, 0.6], [12.3, 0.6], [12.9, 0.85], [13.8, 0.85], [14.0, 0]],
      kis: [[4.4, 0], [4.7, 0.4], [5.9, 0.4], [6.2, 0], [8.9, 0.2], [9.9, 0.2], [10.1, 0], [14.0, 0], [14.2, 0.45], [14.7, 0.35]],
      stel: [[10.05, 0], [10.15, 1], [11.0, 1], [11.6, 0]],
      rund: [[9.15, 0], [9.3, 1], [10.9, 1], [11.1, 0]],
      munn: [[9.15, 0], [9.3, 0.12], [9.9, 0.1], [10.12, 0.06], [10.9, 0.06], [11.1, 0]],
      andas: [[9.2, 0], [9.9, -6], [10.15, 4], [11.0, 4], [11.4, 0]],
      le: [[3.4, 0.1], [4.4, 0], [11.4, 0], [12.3, 0.35], [13.8, 0.45], [14.2, 0.6], [14.8, 0.4]],
    }, {
      ck: [[2.1, 'mun', 70], [3.7, 'mun'], [4.15, 'bort'], [4.7, 'se'], [5.9, 'se'], [6.4, 'mun', 20], [7.9, 'mun'], [8.35, 'bort'], [8.9, 'se'], [11.0, 'se'], [11.5, 'mun', 15],
        [12.3, 'mun'], [12.7, 'bort'], [13.2, 'hall'], [14.3, 'hall']],
      // (ingen glöd och ingen rök: ute)
      ute: true,
      glod: [[2.0, 0], [14.0, 0]],
      iMun: [[1.95, 0], [2.15, 1], [3.7, 1], [3.85, 0], [6.3, 0], [6.45, 1], [7.9, 1], [8.05, 0], [11.4, 0], [11.55, 1], [12.3, 1], [12.45, 0]],
      blaser: [[12.6, 0], [12.85, 1], [13.8, 1], [14.1, 0]],
      rok: [],
    }),
    // Glasögonen: upp ur fickan, hopfällda, och han andas på dem två gånger, putsar dem mot skjortan i små
    // cirklar och håller upp dem mot ljuset med huvudet bakåt och kisar. Då ser han en under dem. Han fäller ut
    // skalmarna med en knyck och sätter på sig dem, tittar strängt på en genom dem (de förstorar ögonen) och
    // nickar, tar av dem igen och stoppar dem i fickan.
    putsa: {
      k: {
        pitch: [[0.2, 0], [0.8, 1.1], [1.5, 1.0], [2.2, 0.15], [3.5, 0.15], [4.0, 1.0], [6.1, 1.0], [6.9, -0.7], [7.9, -0.75], [8.05, -0.6], [9.1, -0.6],
          [9.6, 0.1], [10.5, -0.12], [11.2, -0.3], [11.4, 0.35], [11.6, -0.2], [11.75, 0.25], [11.95, -0.25], [12.6, -0.2], [13.6, 0], [14.2, 0.4], [14.8, 1.05], [15.6, 1.0], [16.3, 0]],
        yaw: [[0.4, 0.1], [2.2, 0], [4.0, 0.05], [6.1, 0.05], [6.9, -0.25], [8.0, -0.25], [9.1, -0.2], [9.6, 0], [16.3, 0]],
        lut: [[2.0, 0.02], [3.5, 0.02], [4.0, 0.05], [6.1, 0.05], [6.9, -0.04], [9.1, -0.04], [10.0, 0], [11.2, -0.03], [12.6, -0.02], [13.4, 0]],
        axV: [[4.0, 8], [6.1, 10], [6.9, 22], [9.1, 22], [9.6, 6], [11.2, 0], [12.6, 4], [13.4, 0]],
        brynX: [[2.2, 0.2], [3.5, 0.3], [4.0, 0], [6.1, 0.1], [6.9, -0.25], [7.9, -0.3], [8.05, 1.15], [9.0, 1.05], [9.5, 0.2], [10.6, 0.4], [11.0, -0.45], [12.4, -0.5], [13.2, 0.6], [14.2, 0.4], [15.2, 0]],
        brynY: [[2.2, 0.2], [3.5, 0.3], [4.0, 0], [6.1, 0.1], [6.9, -0.25], [7.9, -0.3], [8.05, 1.1], [9.0, 1.0], [9.5, 0.2], [10.6, 0.4], [11.0, -0.6], [12.4, -0.65], [13.2, 0.2], [14.2, 0.3], [15.2, 0]],
        blickY: [[0.2, 0], [0.7, 7], [1.6, 7], [2.2, 1], [3.5, 1], [4.0, 5], [6.1, 5], [6.8, -3.5], [7.9, -3.5], [8.05, 1.2], [9.0, 1.2], [9.4, 5], [10.2, 2], [10.6, 0], [14.0, 0], [14.6, 7], [15.6, 7], [16.1, 0]],
        blickX: [[0.2, 0], [0.7, 2.5], [1.6, 2.5], [2.2, 0], [6.1, 0], [6.8, -2.5], [7.9, -2.5], [8.05, 1.8], [9.0, 1.8], [9.5, 0], [14.6, 2.5], [15.6, 2.5], [16.1, 0]],
        blund: [[0.2, 0], [2.2, 0], [2.4, 0.4], [3.4, 0.4], [3.6, 0], [4.0, 0.35], [6.1, 0.35], [6.6, 0], [10.4, 0], [10.6, 0.6], [10.8, 0], [13.6, 0], [13.85, 0.55], [14.05, 0]],
        kis: [[6.5, 0], [6.9, 0.7], [7.9, 0.7], [8.05, 0], [10.8, 0], [11.1, 0.35], [12.4, 0.35], [12.8, 0]],
        stel: [[8.0, 0], [8.1, 1], [9.1, 1], [9.6, 0]],
        munn: [[2.4, 0], [2.5, 0.22], [2.85, 0.18], [2.95, 0], [3.05, 0.22], [3.4, 0.18], [3.5, 0], [6.9, 0], [7.1, 0.03], [7.9, 0.03], [8.1, 0.05], [9.0, 0.04], [9.2, 0]],
        rund: [[2.4, 0], [2.5, 0.35], [3.4, 0.35], [3.5, 0]],
        andas: [[2.2, 0], [2.4, 6], [2.9, -5], [3.0, 5], [3.45, -5], [3.7, 0], [8.0, 0], [8.2, 5], [9.0, 5], [9.4, 0]],
        le: [[11.0, 0], [12.4, 0.1], [13.0, 0.55], [14.0, 0.45], [15.0, 0.2]],
      },
      glas: {
        gk: [[0, 'ficka'], [0.95, 'ficka'], [1.55, 'ute'], [2.25, 'oppna', 30], [3.55, 'oppna'], [4.05, 'putsa'], [6.15, 'putsa'], [6.95, 'kika', 40], [9.1, 'kika'], [9.7, 'oppna'],
          [10.25, 'fore'], [10.7, 'pa'], [13.4, 'pa'], [13.95, 'fore'], [14.55, 'oppna'], [15.2, 'oppna'], [15.8, 'ute', 30], [16.3, 'ficka']],
        fall: [[0, 0], [9.45, 0], [9.65, 1], [14.6, 1], [15.1, 0]],
        motA: [[0.1, 0], [0.95, 1], [10.75, 1], [11.3, 0], [12.8, 0], [13.35, 1], [16.35, 1], [16.95, 0]],
        krok: [[0.7, 0.2], [0.95, 0.62], [10.7, 0.62], [11.0, 0.25], [13.1, 0.2], [13.35, 0.62], [16.3, 0.62], [16.6, 0.25]],
        gnid: [[4.1, 0], [4.35, 1], [5.9, 1], [6.15, 0]],
      },
    },
    // Visslingen (LAT ovan): blicken upp i taket, läpparna i ett o och huvudet som vaggar i takt, och
    // pekfingret knackar på disken. Ögonen kommer ned på en, och tonen dör. Han håller läpparna kvar en
    // stund, tittar sedan längs baren och visslar vidare, gladare än förut, smackar och nickar för sig själv,
    // och tittar till sist på en med ett höjt bryn.
    vissla: {
      k: {
        pitch: [[0.3, 0], [0.8, -0.35], ...LAT.slice(0, 10).flatMap(([t]) => [[t, -0.35], [t + 0.12, -0.2], [t + 0.26, -0.35]]), [4.88, -0.35], [5.0, -0.25], [6.0, -0.25],
          [6.25, -0.15], ...LAT.slice(11).flatMap(([t]) => [[t, -0.15], [t + 0.1, 0.05], [t + 0.22, -0.15]]), [8.8, -0.1], [9.0, 0.25], [9.25, 0], [9.5, 0.2], [9.8, -0.15], [10.6, 0]],
        yaw: [[0.3, 0], [0.8, 0.25], [4.9, 0.25], [6.0, 0.22], [6.4, -0.45], [8.7, -0.45], [9.4, 0.05], [10.4, 0.1]],
        roll: [[0.8, 0], [1.6, 0.05], [2.6, -0.04], [3.6, 0.05], [4.6, -0.03], [4.9, 0], [6.4, 0], [7.0, -0.06], [7.6, 0.05], [8.2, -0.05], [8.8, 0], [9.6, 0.05], [10.4, 0]],
        lut: [[0.5, 0], [1.0, -0.02], [4.9, -0.02], [5.0, 0.01], [6.0, 0.01], [6.5, -0.03], [8.6, -0.03], [9.2, 0]],
        brynX: [[0.6, 0.3], ...LAT.slice(0, 10).map(([t], i) => [t + 0.1, i % 2 ? 0.35 : 0.65]), [4.88, 0.5], [5.0, 1.15], [6.0, 1.05], [6.3, 0.6], ...LAT.slice(11).map(([t], i) => [t + 0.08, i % 2 ? 0.55 : 0.95]),
          [8.9, 0.3], [9.7, 1.25], [10.3, 1.1], [10.8, 0]],
        brynY: [[0.6, 0.3], ...LAT.slice(0, 10).map(([t], i) => [t + 0.1, i % 2 ? 0.3 : 0.6]), [4.88, 0.45], [5.0, 1.1], [6.0, 1.0], [6.3, 0.55], ...LAT.slice(11).map(([t], i) => [t + 0.08, i % 2 ? 0.5 : 0.9]),
          [8.9, 0.3], [9.7, 0.15], [10.3, 0.15], [10.8, 0]],
        blickX: [[0.3, 0], [0.6, 2.5], [4.88, 2.5], [5.0, -1.4], [6.0, -1.4], [6.3, -5], [8.7, -5], [9.2, -2], [9.5, 0]],
        blickY: [[0.3, 0], [0.6, -5.5], [4.88, -5.5], [5.0, -0.6], [6.0, -0.6], [6.3, -4], [8.7, -4], [9.2, 0]],
        blund: [[0.3, 0], [0.6, 0], [4.88, 0], [6.0, 0], [8.8, 0], [9.0, 0.3], [9.3, 0.3], [9.45, 0]],
        stel: [[0.6, 0], [0.85, 0.85], [4.88, 0.85], [5.0, 1], [6.0, 1], [6.25, 0.85], [8.7, 0.85], [9.0, 0]],
        rund: [[0.6, 0], [0.85, 1], [5.6, 1], [5.9, 0], [6.15, 0], [6.25, 1], [8.7, 1], [8.85, 0]],
        munn: [[0.6, 0], [0.85, 0.13], [4.85, 0.13], [5.0, 0.1], [5.6, 0.08], [5.9, 0], [6.15, 0], [6.25, 0.13], [8.7, 0.13], [8.85, 0],
          [8.95, 0.06], [9.05, 0], [9.17, 0.07], [9.27, 0]],
        andas: [[0.5, 0], [0.8, 6], [4.8, -4], [5.0, 4], [6.0, 4], [6.2, 7], [8.7, -5], [9.2, 0]],
        le: [[8.8, 0], [9.2, 0.45], [10.3, 0.6], [10.8, 0.3]],
        kis: [[9.4, 0], [9.7, 0.3], [10.3, 0.3], [10.8, 0]],
      },
      // (pekfingret knackar i takt: lyfts och slår ned)
      fA: {
        e0: [[0.7, 0], ...LAT.slice(0, 10).flatMap(([t]) => [[t - 0.16, -0.4], [t, 0.05], [t + 0.08, 0]]), [4.9, 0], [6.1, 0],
          ...LAT.slice(11).flatMap(([t]) => [[t - 0.12, -0.45], [t, 0.05], [t + 0.07, 0]]), [8.6, 0]],
      },
    },
    // Naglarna: höger hand upp framför bröstet med handflatan mot honom och fingrarna krökta, och han tittar
    // ned på naglarna, blåser på dem och putsar dem mot slaget på kavajen, och tittar igen, nöjd. Då ser han
    // en över handen. Han fryser, och sedan blir handen ett pekfinger mot en, två stötar och brynen nere, hakan
    // upp: har jag fel? Handen tillbaka, och ett belåtet leende.
    naglar: {
      k: {
        pitch: [[0.3, 0], [0.9, 0.5], [2.2, 0.5], [2.5, 0.35], [3.0, 0.35], [3.4, 0.6], [4.6, 0.6], [5.0, 0.45], [5.9, 0.4], [6.02, 0.3], [7.1, 0.32],
          [7.5, -0.25], [7.85, -0.1], [8.0, -0.3], [8.3, -0.1], [8.45, -0.3], [9.0, -0.25], [9.3, 0.2], [9.5, 0], [10.2, 0]],
        yaw: [[0.3, 0], [0.9, -0.2], [2.9, -0.2], [3.4, 0.2], [4.6, 0.2], [5.0, -0.2], [7.1, -0.2], [7.5, 0.05], [9.0, 0.05], [10.0, 0]],
        roll: [[0.6, 0], [1.2, 0.07], [2.2, 0.07], [3.0, 0], [5.0, 0.06], [5.9, 0.08], [7.1, 0.08], [7.5, 0], [9.6, 0]],
        lut: [[0.6, 0.02], [2.2, 0.02], [3.4, 0.05], [4.6, 0.05], [5.2, 0.02], [7.1, 0.02], [7.6, 0.08], [7.85, 0.05], [8.0, 0.09], [8.3, 0.05], [8.45, 0.09], [9.0, 0.04], [9.8, 0]],
        axV: [[0.5, 10], [7.1, 12], [7.6, 22], [9.0, 18], [9.8, 0]],
        brynX: [[0.6, 0.2], [1.3, 0.5], [2.2, 0.45], [3.4, 0.2], [4.6, 0.2], [5.2, 0.8], [5.9, 0.75], [6.02, 1.15], [7.0, 1.05], [7.45, -0.55], [8.9, -0.6], [9.3, 0.9], [9.9, 0.8], [10.4, 0]],
        brynY: [[0.6, 0.2], [1.3, 0.3], [2.2, 0.3], [3.4, 0.2], [4.6, 0.2], [5.2, 0.55], [5.9, 0.5], [6.02, 1.1], [7.0, 1.0], [7.45, -0.75], [8.9, -0.8], [9.3, 0.1], [9.9, 0.1], [10.4, 0]],
        blickX: [[0.3, 0], [0.7, -2.5], [2.9, -2.5], [3.3, 3], [4.6, 3], [5.0, -2.5], [5.9, -2.5], [6.02, 1.0], [7.0, 1.0], [7.4, 0]],
        blickY: [[0.3, 0], [0.7, 5], [2.9, 5], [3.3, 4], [4.6, 4], [5.0, 5], [5.9, 5], [6.02, -1.6], [7.0, -1.6], [7.4, 0]],
        blund: [[0.3, 0], [0.7, 0.35], [2.2, 0.35], [2.5, 0.2], [2.95, 0.2], [3.3, 0.35], [5.9, 0.35], [6.0, 0]],
        stel: [[5.95, 0], [6.05, 1], [7.1, 1], [7.6, 0]],
        kis: [[1.0, 0], [1.4, 0.3], [2.2, 0.3], [2.5, 0], [5.2, 0], [5.6, 0.25], [5.9, 0.2], [6.0, 0], [7.3, 0], [7.6, 0.5], [8.9, 0.5], [9.3, 0.3], [9.9, 0.3], [10.4, 0]],
        rund: [[2.3, 0], [2.4, 0.9], [2.7, 0.8], [2.8, 0.9], [3.05, 0.8], [3.15, 0]],
        munn: [[2.3, 0], [2.4, 0.06], [3.05, 0.05], [3.15, 0], [6.0, 0], [6.1, 0.04], [7.1, 0.04], [7.2, 0], [7.8, 0], [7.88, 0.06], [8.0, 0], [8.25, 0], [8.33, 0.06], [8.45, 0]],
        andas: [[2.2, 0], [2.35, 6], [2.7, -2], [2.8, 4], [3.1, -3], [3.4, 0], [5.95, 0], [6.15, 5], [7.0, 5], [7.4, 0]],
        le: [[1.2, 0.35], [2.2, 0.3], [5.2, 0.4], [5.9, 0.45], [6.0, 0], [9.3, 0.3], [9.9, 0.6], [10.6, 0.3]],
      },
      A: [
        [0.7, [-190, 175, 585], [-0.85, -0.5, 0.15], [0.3, 0.9, 0.3], [0.55, 0.2, -0.8], 0.95, 0],
        [2.2, [-186, 178, 590], [-0.85, -0.5, 0.15], [0.3, 0.9, 0.3], [0.55, 0.2, -0.8], 0.95, 0],
        [2.4, [-195, 205, 640], [-0.85, -0.5, 0.15], [0.3, 0.9, 0.3], [0.55, 0.2, -0.8], 0.95, 0],
        [3.0, [-195, 205, 640], [-0.85, -0.5, 0.15], [0.3, 0.9, 0.3], [0.55, 0.2, -0.8], 0.95, 0],
        [3.4, [-20, 150, 420], [-0.9, -0.4, 0.1], [0.6, 0.8, 0.05], [0.05, -0.05, 1], 0.9, 0],
        [4.6, [-20, 150, 420], [-0.9, -0.4, 0.1], [0.6, 0.8, 0.05], [0.05, -0.05, 1], 0.9, 0],
        [5.0, [-190, 178, 585], [-0.85, -0.5, 0.15], [0.3, 0.9, 0.3], [0.55, 0.2, -0.8], 0.95, 0],
        [5.9, [-192, 182, 588], [-0.85, -0.5, 0.15], [0.3, 0.9, 0.3], [0.55, 0.2, -0.8], 0.95, 0],
        [7.1, [-192, 182, 588], [-0.85, -0.5, 0.15], [0.3, 0.9, 0.3], [0.55, 0.2, -0.8], 0.95, 0],
        [7.4, [-275, 300, 620], [-0.85, -0.5, 0.15], [0.02, 0.5, 0.87], [0.3, -0.82, 0.48], 0.95, 1],
        [7.8, [-272, 312, 665], [-0.85, -0.5, 0.15], [0.02, 0.5, 0.87], [0.3, -0.82, 0.48], 0.95, 1],
        [7.95, [-275, 300, 625], [-0.85, -0.5, 0.15], [0.02, 0.5, 0.87], [0.3, -0.82, 0.48], 0.95, 1],
        [8.25, [-272, 312, 670], [-0.85, -0.5, 0.15], [0.02, 0.5, 0.87], [0.3, -0.82, 0.48], 0.95, 1],
        [8.4, [-275, 300, 628], [-0.85, -0.5, 0.15], [0.02, 0.5, 0.87], [0.3, -0.82, 0.48], 0.95, 1],
        [9.0, [-277, 298, 626], [-0.85, -0.5, 0.15], [0.02, 0.5, 0.87], [0.3, -0.82, 0.48], 0.95, 1],
        [9.6, [-200, -150, 560], PA, [0.6, 0.2, 0.75], [0.2, -0.9, 0.35], 0.3, 0],
      ],
      // (gnider dem mot slaget: handen fram och tillbaka)
      fA: { sv: { amp: [[3.45, 0], [3.6, 1], [4.4, 1], [4.55, 0]], f: 3.2, x: [18, -9, 0] } },
    },
  });
  // tidningen (LASA): huvudet och ansiktet som i de andra klippen, händerna räknas ur tidningen (tidningArm)
  for (const [namn, l] of Object.entries(LASA)) RORELSER[namn] = { k: l.k, las: l.t, glas: l.g };
  for (const [namn, o] of Object.entries(RORELSER)) {
    const m = KLIPP[namn];
    const { fran, till, vila = 0, start = 0 } = m;
    const dur = till - fran;
    const Sa = lage(start);
    const Sb = lage(vila);
    // nycklar i klippets tid → tidslinjens, med början a och slut b (det som står på gränserna faller bort)
    const abs = (k = [], a = 0, b = 0, bas = 0) => [[fran, a], ...k.filter((x) => x[0] > 0 && x[0] < dur).map(([t, v]) => [fran + t, v + bas]), [till, b]];
    const d = {};
    for (const x of KANAL) d[x] = abs(o.k && o.k[x], Sa[x] - S0[x], Sb[x] - S0[x], Sa[x] - S0[x]);
    for (const x of ANSIKTE) if (o.k && o.k[x]) d[x] = abs(o.k[x]);
    const k = { namn, fran, till, d, kaffe: o.kaffe, cig: o.cig, pen: o.pen, tidning: m.tidning, dunk: (m.dunk || []).map(([t, s, sort]) => [fran + t, s, sort]) };
    // armarna: mellan klippen i vilan
    const armar = (K, nycklar, vila_, pol) => {
      if (!nycklar) return;
      K.push([fran, ...vila_]);
      for (const [t, W, p, ...r] of nycklar) K.push([fran + t, W, p === vila_[1] ? p : pol(p), ...r]);
      K.push([till, ...vila_]);
    };
    armar(VA, o.A, VILA_A, polA);
    armar(VB, o.B, VILA_B, polB);
    // händernas form och svängning (fA, fB: se handForm), med vilans värden på gränserna
    const form = (f, h) => f && {
      spar: abs(f.spar, SAMLA[h], SAMLA[h]), tumme: abs(f.tumme, TUMME_VILA[h], TUMME_VILA[h], 0),
      ex: Array.from({ length: 9 }, (_, i) => (f[`e${i}`] ? abs(f[`e${i}`]) : null)),
      sv: f.sv && { ...f.sv, amp: abs(f.sv.amp), t0: fran },
    };
    k.fA = form(o.fA, 'A');
    k.fB = form(o.fB, 'B');
    const tid = (k2) => k2.map(([t, ...r]) => [fran + t, ...r]);
    // röken: under en tid (fran–till) eller på en gång (t)
    const rokTid = (l = []) => l.map((r) => ({ ...r, fran: fran + (r.fran ?? r.t), till: fran + (r.till ?? r.t), t: fran + (r.t ?? r.fran) }));
    if (o.kaffe) {
      const c = o.kaffe;
      const kan_ = (x) => (c[x] ? tid(c[x]) : tom());
      k.kaffe = {
        kk: [[fran, 'fat'], ...tid(c.kk), [till, 'fat']], tipp: kan_('tipp'), snurr: kan_('snurr'), lill: kan_('lill'), arm: kan_('arm'),
        mot: c.mot.map((t) => fran + t), krok: tid(c.krok), rok: rokTid(c.rok),
      };
    }
    if (o.cig) {
      const c = o.cig;
      // (mot, upp och grepp: fyra tider, upp och ned igen, eller nycklar [t, 0–1])
      const tb = (x) => (Array.isArray(x[0]) ? tid(x) : x.map((t) => fran + t));
      k.cig = {
        ck: tid(c.ck), krok: tid(c.krok), mot: tb(c.mot), upp: tb(c.upp), grepp: tb(c.grepp), rull: c.rull ? tid(c.rull) : tom(),
        glod: tid(c.glod), iMun: tid(c.iMun), blaser: c.blaser ? tid(c.blaser) : tom(), pust: c.pust ? tid(c.pust) : tom(),
        rok: rokTid(c.rok), ute: Boolean(c.ute), tand: c.tand ? tid(c.tand) : null,
      };
    }
    if (o.eld) {
      const e = o.eld;
      const kan_ = (x, a = 0) => (e[x] ? tid(e[x]) : tom(a, a));
      k.eld = {
        sort: e.sort, ek: tid(e.ek), mot: tid(e.mot), krok: tid(e.krok), laga: kan_('laga'), brand: kan_('brand'), glo: kan_('glo'),
        lock: kan_('lock'), sug: kan_('sug'), ryk: kan_('ryk'), skak: kan_('skak'), tumme: kan_('tumme'), hojd: kan_('hojd'),
        ta: fran + (e.ta ?? -1e3), slapp: fran + (e.slapp ?? 1e3), gnista: (e.gnista || []).map((x) => fran + x), rok: rokTid(e.rok),
      };
    }
    if (o.las) k.las = Object.fromEntries(Object.entries(o.las).map(([x, kk]) => [x, tid(kk)]));
    if (o.glas) k.glas = Object.fromEntries(Object.entries(o.glas).map(([x, kk]) => [x, tid(kk)]));
    KL.push(k);
  }
  KL.sort((a, b) => a.fran - b.fran);
  VA.sort((a, b) => a[0] - b[0]);
  VB.sort((a, b) => a[0] - b[0]);
  const aktivt = (t) => KL.find((k) => t > k.fran && t < k.till) || null;
  // Slagen i disken: [T, styrka, sort]; och när koppen ställs ned på fatet [T, styrka]
  const DUNK = Object.values(KLIPP).flatMap((m) => (m.dunk || []).map(([t, s, sort]) => [m.fran + t, s, sort]));
  const NED = Object.values(KLIPP).flatMap((m) => (m.ned || []).map(([t, s]) => [m.fran + t, s]));
  // Det andra som hörs i sysslorna (ljud: [tid, ljud]), som han visslar
  const LJUD = Object.values(KLIPP).flatMap((m) => (m.ljud || []).map(([t, e]) => [m.fran + t, e]));

  // Det som står på disken hoppar när han slår i den: koppen studsar på fatet, lägre för varje gång,
  // fatet lite, askkoppen knappt och cigarren i urtaget. Höjden (i världens enheter) vid dt efter slaget.
  const TYNGD = 3100;
  const STUDS = [1, 0.13, 0.02];
  const KOPPHOPP = 38;
  function studs(dt, h) {
    let t0 = 0;
    for (const k of STUDS) {
      const v = Math.sqrt(2 * TYNGD * h * k);
      const T = (2 * v) / TYNGD;
      if (dt < t0 + T) { const x = dt - t0; return Math.max(0, v * x - 0.5 * TYNGD * x * x); }
      t0 += T;
    }
    return 0;
  }
  // när koppen landar på fatet efter ett slag: [tid efter slaget, hur hårt (0–1)]
  function landar(s) {
    let t0 = 0;
    return STUDS.map((k) => { t0 += (2 * Math.sqrt(2 * TYNGD * KOPPHOPP * s * k)) / TYNGD; return [t0, s * Math.sqrt(k)]; });
  }
  const HOPP = { kopp: 0, fat: 0, ask: 0, cig: 0 };
  function hoppar(t) {
    HOPP.kopp = HOPP.fat = HOPP.ask = HOPP.cig = 0;
    for (const [td, s] of DUNK) {
      const dt = t - td;
      if (dt < 0 || dt > 0.8) continue;
      HOPP.kopp += studs(dt, KOPPHOPP * s);
      HOPP.fat += studs(dt, 9 * s);
      HOPP.ask += studs(dt, 2.5 * s);
      HOPP.cig += studs(dt, 11 * s);
    }
    return HOPP;
  }
  const UTDRAG = 110;
  function nyckel(K, t, ut) {
    let i = 1;
    while (i < K.length - 1 && t > K[i][0]) i++;
    const a = K[i - 1];
    const b = K[i];
    const x = clamp((t - a[0]) / (b[0] - a[0]));
    // ett slag: allt fortare, och tvärt stopp
    const f = b[7] ? x ** 2.2 : x * x * (3 - 2 * x);
    const l3 = (o, x, y) => o.set(x[0] + (y[0] - x[0]) * f, x[1] + (y[1] - x[1]) * f, x[2] + (y[2] - x[2]) * f);
    l3(ut.w, a[1], b[1]); l3(ut.pol, a[2], b[2]); l3(ut.F, a[3], b[3]); l3(ut.P, a[4], b[4]);
    ut.krok = a[5] + (b[5] - a[5]) * f;
    ut.peka = a[6] + (b[6] - a[6]) * f;
    // Den högra handen ligger under den vänstra i vilan. När den lyfts dras den först ut bakåt längs sig
    // själv, och skjuts in på samma sätt när den kommer tillbaka, annars går fingrarna genom den andra handen.
    if (K === VA && a[1] !== b[1] && (a[1] === va.W || b[1] === va.W)) {
      const fran = a[1] === va.W ? b[1] : a[1];
      if (Math.abs(fran[1] - va.W[1]) > 30) {
        const u = a[1] === va.W ? x : 1 - x;
        const dra = UTDRAG * ss(0, 0.22, u) * (1 - ss(0.3, 0.8, u));
        ut.w.x -= VILA_A[2][0] * dra;
        ut.w.z -= VILA_A[2][2] * dra;
      }
    }
    return ut;
  }
  const v = () => new THREE.Vector3();
  const na = { w: v(), pol: v(), F: v(), P: v(), krok: 0, peka: 0 };
  const nb = { w: v(), pol: v(), F: v(), P: v(), krok: 0, peka: 0 };
  const d_ = v();
  const dir_ = v();
  const pp_ = v();
  const E_ = v();
  const Wr_ = v();
  function ik(Sk, Wr, pol, Eut, Wut) {
    d_.subVectors(Wr, Sk);
    // (utsträckt får den vara något längre än i fotot: det syns inte på en raklång arm)
    const hel = d_.length();
    const tj = Math.min(1.3, Math.max(1, hel / (0.97 * (LA + LB))));
    const la = LA * tj;
    const lb = LB * tj;
    const len = Math.min(hel, la + lb - 4);
    dir_.copy(d_).normalize();
    const a = (la * la - lb * lb + len * len) / (2 * len);
    const h = Math.sqrt(Math.max(0, la * la - a * a));
    pp_.copy(pol).addScaledVector(dir_, -pol.dot(dir_)).normalize();
    Eut.copy(Sk).addScaledVector(dir_, a).addScaledVector(pp_, h);
    Wut.copy(Sk).addScaledVector(dir_, len);
  }
  const FA = v();
  const eu = new THREE.Euler();
  const mh = new THREE.Matrix4();
  const mk = new THREE.Matrix4();
  const mr = new THREE.Matrix4();
  const HOFT = new THREE.Vector3(0, -413, 60);
  const h1 = v();
  const sa = v();
  const sb = v();

  // Handens form i ett klipp (fA, fB): fingrarna isär (spar), tummen ut (tumme), och e0–e8 som extra
  // i bojFingrar (rum-hasse-arm.js): e0–e3 mer böjning per finger (negativt: rakare, e1 = −krok sträcker
  // långfingret), e4–e7 hur mycket mer de spretar (grader), e8 tummen rak fast handen är knuten.
  const exA = new Array(9).fill(0);
  const exB = new Array(9).fill(0);
  function handForm(f, t, ut) {
    for (let i = 0; i < 9; i++) ut[i] = f.ex[i] ? spar(f.ex[i], t) : 0;
    return ut;
  }
  // Svängningen (sv): handen och handleden runt sitt läge medan amp (0–1) är uppe, f varv i sekunden,
  // x och y förflyttningen (sinus och cosinus: en cirkel om båda finns) och F fingrarnas vickning.
  function svang(f, t, h) {
    const s = f.sv;
    if (!s) return;
    const m = spar(s.amp, t);
    if (!m) return;
    const v = 2 * Math.PI * s.f * (t - s.t0);
    const si = m * Math.sin(v);
    const co = m * Math.cos(v);
    if (s.x) { h.w.x += s.x[0] * si; h.w.y += s.x[1] * si; h.w.z += s.x[2] * si; }
    if (s.y) { h.w.x += s.y[0] * co; h.w.y += s.y[1] * co; h.w.z += s.y[2] * co; }
    if (s.F) { h.F.x += s.F[0] * si; h.F.y += s.F[1] * si; h.F.z += s.F[2] * si; }
  }

  // Fingrarna trummar otåligt på disken (trumma), på ett av fyra sätt, med den vänstra handen som ligger
  // överst i vilan:
  // från lillfingret till pekfingret två varv (varv), tre fortare (fort), ett långsamt (lugnt), eller
  // pekfingret som knackar fyra gånger (peka). [hur länge, varv i sekunden, varv]; fingrarna 0–3 är
  // pek- till lillfingret.
  const TRUM = { varv: [0.86, 3.2], fort: [0.78, 4.4], lugnt: [0.95, 1.1], peka: [1.45, 2.8] };
  let trumT = -9;
  let trumS = TRUM.varv;
  let trumPeka = false;
  let trumHand = 'B';
  const trumF = [0, 0, 0, 0];
  function trummar(n) {
    const t = n - trumT;
    if (t < 0 || t > trumS[0]) return null;
    for (let i = 0; i < 4; i++) {
      if (trumPeka) {
        const f = (t * trumS[1]) % 1;
        trumF[i] = i ? 0.05 : -Math.sin(Math.min(1, f * 1.6) * Math.PI) * 0.42;
        continue;
      }
      const f = ((t * trumS[1]) % 1) * 4 - (3 - i);
      trumF[i] = f > 0 && f < 1 ? -Math.sin(f * Math.PI) * 0.3 : 0;
    }
    return trumF;
  }

  // ---------- det som alltid rör sig ----------
  // Blinkningarna, blicken, huvudet och andningen går aldrig i takt, så att inget upprepar sig när han
  // bara sitter: samma klocka ger alltid samma bild (hash), men inget mönster går igen.
  const hash = (x) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // Han blinkar ungefär var fjärde sekund, någon gång mellan 0,6 och 7,8 s isär och ibland två gånger
  // i rad.
  const BLINK = 4.2;
  function blinkar(n) {
    const k = Math.floor(n / BLINK);
    let b = 0;
    for (let j = k - 1; j <= k; j++) {
      const d = n - (j * BLINK + hash(j * 7.3) * (BLINK - 0.6));
      b = Math.max(b, 1 - clamp(Math.abs(d - 0.085) / 0.085));
      if (hash(j * 3.7 + 1) < 0.22) b = Math.max(b, 1 - clamp(Math.abs(d - 0.4) / 0.085));
    }
    return b;
  }
  // Blicken vilar aldrig helt: varannan sekund eller så flyttar den sig lite (en snabb ryckning), oftast
  // tillbaka till en. [x, y] i fotots bildpunkter.
  const SAKK = 1.7;
  const sakkMal = (j) => (hash(j * 2.9) < 0.45 ? [0, 0] : [(hash(j * 1.31) - 0.5) * 3.2, (hash(j * 2.17) - 0.5) * 1.8]);
  const blickUt = [0, 0];
  function sakkader(n) {
    const k = Math.floor(n / SAKK);
    const t0 = k * SAKK + hash(k * 5.1) * SAKK * 0.7;
    const [j, f] = n < t0 ? [k - 1, 1] : [k, ss(t0, t0 + 0.06, n)];
    const a = sakkMal(j - 1);
    const b = sakkMal(j);
    blickUt[0] = a[0] + (b[0] - a[0]) * f;
    blickUt[1] = a[1] + (b[1] - a[1]) * f;
    return blickUt;
  }
  // Huvudet driver långsamt (svängningar som inte går jämnt ut), och andningen byter takt och djup.
  const drift = (n, a, b, c) => 0.6 * Math.sin(n * a) + 0.4 * Math.sin(n * b + 2) + 0.25 * Math.sin(n * c + 1);
  const andning = (n) => 7 * (0.85 + 0.2 * Math.sin(n * 0.17 + 1)) * Math.sin(n * 1.45 + 0.9 * Math.sin(n * 0.21));

  // ---------- cigarren ----------
  // Han tar cigarren ur askkoppen med höger hand, och det är cigarren som styr: dess läge räknas fram
  // (i askkoppen, vid munnen i huvudets mått, vid axeln) och handen räknas ur greppet, så att den
  // sitter kvar i fingrarna hela vägen. Klippets cig: lägena (ck), fingrarna (krok), när armen går
  // fram och tillbaka (mot) och upp mot ansiktet (upp), när fingrarna har den (grepp), glöden, läpparna
  // om den (iMun), munnen när han blåser ut (blaser) och pustar (pust), och röken.
  // Greppet (handens mått, skalad som handen): löst i fingertopparna, tummen under och pek- och
  // långfingret ovanpå, ring- och lillfingret böjda in mot handflatan. I cigarrens läge är x fingrarnas
  // riktning, y från huvudet mot glöden och z ut ur handflatan. (Förut låg den djupt i den krökta handen,
  // och fingrarna såg ut att hänga i den som i en stång.)
  const GREPP = new THREE.Vector3(52, 178, 82).multiplyScalar(HAND.SK);
  const SG = 60;
  const EXTRA_C = [0, 0.03, 0.45, 0.55];
  const extraC = [0, 0, 0, 0];
  const mq = new THREE.Matrix4();
  const nyPose = () => ({ p: v(), q: new THREE.Quaternion() });
  const pA_ = v();
  const pF_ = v();
  const pP_ = v();
  // läget ur greppets punkt p, cigarrens riktning A (huvudet mot glöden) och handflatans P
  function pose(ut, p, A, P) {
    pA_.copy(A).normalize();
    pF_.crossVectors(pA_, P).normalize();
    pP_.crossVectors(pF_, pA_);
    mq.makeBasis(pF_, pA_, pP_);
    ut.q.setFromRotationMatrix(mq);
    ut.p.copy(p);
    return ut;
  }
  // I askkoppen: huvudet på disken, cigarren över urtagets yttre kant och glöden över mitten.
  // Han nyper den med handflatan nedåt och lite framåt (P_VILA: vriden 30° runt cigarren), så att handen
  // ligger lågt och flackt och handleden är rak. (Förut tog han den rakt ovanifrån, med handleden högt och
  // fingrarna rakt ned som en klo.)
  const CU = new THREE.Vector3(Math.cos(ASKV), 0, Math.sin(ASKV));
  const SN = 105;
  const sinA = (ASKKOPP.URTAG + 0.2) / SN;
  const A_VILA = CU.clone().multiplyScalar(-Math.sqrt(1 - sinA * sinA));
  A_VILA.y = sinA;
  const HUV_C = new THREE.Vector3(...ASK).addScaledVector(CU, ASKKOPP.R + SN * Math.sqrt(1 - sinA * sinA));
  HUV_C.y += CIGARR.R + 0.4;
  const P_VILA = new THREE.Vector3(0, -1, 0).applyAxisAngle(A_VILA.clone().normalize(), 0.52);
  // läget ur handen: handens origo H, fingrarnas riktning F och handflatans P
  const fA = v();
  function fraHand(ut, H, F, P) {
    fA.crossVectors(F, P).negate().normalize();
    return pose(ut, H.clone().addScaledVector(fA, -GREPP.x).addScaledVector(F, GREPP.y).addScaledVector(P, GREPP.z), fA, P);
  }
  const PV = {
    vila: pose(nyPose(), HUV_C.clone().addScaledVector(A_VILA, SG), A_VILA, P_VILA),
    // armbågen på disken och handen uppe vid axeln, cigarren tvärs över och glöden utåt och lite uppåt
    hall: fraHand(nyPose(), V3(-310, 165, 540), V3(0.4, 0.82, 0.42).normalize(), V3(0.25, -0.45, 0.86).normalize()),
    // lite högre och vriden, glöden uppåt: han tittar på den
    se: fraHand(nyPose(), V3(-290, 215, 560), V3(0.3, 0.85, 0.43).normalize(), V3(0.1, -0.48, 0.87).normalize()),
    // framför bröstet under hakan, snett uppåt, så att han ser ringen när han beundrar den
    visa: pose(nyPose(), V3(10, 310, 790), V3(-0.6, 0.6, 0.5).normalize(), V3(0.2, -0.5, 0.85)),
    // fram mot en, glöden mot en (vift2 lite högre: knycken)
    vift: pose(nyPose(), V3(-160, 180, 800), V3(-0.55, 0.25, 0.8).normalize(), V3(0.3, -0.9, 0.2)),
    vift2: pose(nyPose(), V3(-150, 215, 830), V3(-0.5, 0.4, 0.77).normalize(), V3(0.3, -0.85, 0.3)),
  };
  // Över askkoppen, med glöden över skålen och cigarren snett nedåt ut från handen; han knackar av
  // askan med ett kort ryck nedåt (knackN).
  {
    const A = V3(-0.82, -0.42, 0.38).normalize();
    const glod = V3(ASK[0] + 10, BORD.Y + 55, ASK[2] - 10);
    const P = V3(0.25, -0.92, 0.3);
    PV.knack = pose(nyPose(), glod.clone().addScaledVector(A, -(CIGARR.L + 1 - SG)), A, P);
    PV.knackN = pose(nyPose(), PV.knack.p.clone().add(V3(0, -14, 0)), A, P);
  }
  // Vid munnen räknas läget i huvudets mått: huvudet en bit in mellan läpparna, cigarren ut åt
  // hans högra sida och lite nedåt. Handen sitter under greppet och lite ut åt sidan (d), vid käken,
  // med fingrarna uppåt i underarmens förlängning: armbågen nere och handleden nästan rak. (Förut satt
  // den ut åt sidan vid kinden, och då gick handleden inte att räta: antingen knäcktes den åt sidan eller
  // så for armbågen upp över huvudet.)
  const MUND = W_(662, 509, 0);
  MUND.z = djup(662, 509) - 6;
  // handflatan när cigarren pekar åt A och handen sitter åt d från greppet (tummen mot cigarrens huvud)
  const flata = (A, d) => {
    const T = A.clone().negate();
    const e = d.clone().addScaledVector(T, -d.dot(T)).normalize().negate();
    const e2 = new THREE.Vector3().crossVectors(T, e);
    return e2.multiplyScalar(GREPP.y).addScaledVector(e, GREPP.z).normalize();
  };
  const A_MUN = new THREE.Vector3(-0.7, -0.2, 0.68).normalize();
  const P_MUN = flata(A_MUN, V3(-0.6, -0.8, -0.1));
  // utdragen: rakt ut längs sig själv och lite ned, fri från käken
  const BORT = A_MUN.clone().multiplyScalar(55).add(V3(0, -30, 35));
  // Lägen i huvudets mått: [cigarrens huvud, dess riktning, handflatan]. Fast i mungipan (tand): han
  // biter om den och släpper den, och den pekar ut och ned.
  const MUNHORN_H = W_(622, 509, 0);
  MUNHORN_H.z = djup(622, 509) - 10;
  const A_TAND = V3(-0.62, -0.42, 0.66).normalize();
  const HL = {
    mun: [MUND, A_MUN, P_MUN],
    bort: [MUND.clone().add(BORT), A_MUN, P_MUN],
    tand: [MUNHORN_H, A_TAND, flata(A_TAND, V3(-0.6, -0.8, -0.1))],
  };
  const PIV = U.uPiv.value;
  const iHuvud = (p, ut) => ut.copy(p).sub(PIV).applyMatrix3(U.uHuvud.value).add(PIV).applyMatrix4(mk);
  const riktH = (d, ut) => ut.copy(d).applyMatrix3(U.uHuvud.value).transformDirection(mk);
  const hA = v();
  const hP = v();
  const hp = v();
  const PM = Object.fromEntries(Object.keys(HL).map((n) => [n, nyPose()]));
  function vidMunnen() {
    for (const n in HL) {
      const [h, A, P] = HL[n];
      riktH(A, hA);
      riktH(P, hP);
      iHuvud(h, hp);
      pose(PM[n], hp.addScaledVector(hA, SG), hA, hP);
    }
  }
  const posen = (namn) => PM[namn] || PV[namn];
  function cigarrLage(t, ut, c) {
    const CK = c && c.ck;
    if (!CK || t <= CK[0][0] || t >= CK[CK.length - 1][0]) return pose(ut, PV.vila.p, A_VILA, P_VILA);
    let i = 1;
    while (t > CK[i][0]) i++;
    const f = ss(CK[i - 1][0], CK[i][0], t);
    const a = posen(CK[i - 1][1]);
    const b = posen(CK[i][1]);
    ut.p.lerpVectors(a.p, b.p, f);
    ut.p.y += (CK[i][2] || 0) * Math.sin(f * Math.PI);
    ut.q.slerpQuaternions(a.q, b.q, f);
    return ut;
  }
  const cp = nyPose();
  const fot = v();
  const cA = v();
  const cF = v();
  const cP = v();
  const cX = v();
  const cH = v();
  const cW = v();
  const cE = v();
  const cWr = v();
  const POL_UPP = new THREE.Vector3(-0.62, -0.78, 0.1).normalize();
  const cPol = v();
  // cigarren på sin plats, och var handen ska vara för att hålla den
  function cigarrSatt(cp) {
    cA.set(0, 1, 0).applyQuaternion(cp.q);
    cF.set(1, 0, 0).applyQuaternion(cp.q);
    cP.set(0, 0, 1).applyQuaternion(cp.q);
    cig.mesh.matrix.makeRotationFromQuaternion(cp.q).setPosition(cX.copy(cp.p).addScaledVector(cA, -SG));
    cig.mesh.matrixWorldNeedsUpdate = true;
    fot.copy(cig.FOT).applyMatrix4(cig.mesh.matrix);
    // handens origo: tummen (handens x) pekar mot huvudet
    cH.copy(cp.p).addScaledVector(cA, GREPP.x).addScaledVector(cF, -GREPP.y).addScaledVector(cP, -GREPP.z);
  }
  // handleden för handen i H: handen sitter 26 bortom handleden längs underarmen
  function vristTill(Sk, H, pol, ut) {
    ut.copy(H).sub(Sk).normalize();
    for (let i = 0; i < 3; i++) {
      cW.copy(H).addScaledVector(ut, -26);
      ik(Sk, cW, pol, cE, cWr);
      ut.subVectors(cWr, cE).normalize();
    }
    return cW.copy(H).addScaledVector(ut, -26);
  }
  // Armbågen där handleden ser naturlig ut. Handen är given av det han håller i (handens origo H,
  // fingrarna F, handflatan P), och armbågen kan bara ligga på en cirkel: överarmen från axeln och
  // underarmen till handen. Förut valdes den efter en fast riktning (pol), och då kunde handen sitta
  // nästan i rät vinkel mot underarmen och sticka ut ur manschettens sida. Nu ligger den där underarmen
  // går i handens förlängning: handleden lite bakåtböjd, hellre böjd mot handflatan än åt sidan, och
  // armbågen inte för långt från pol. sida: 1 höger hand (A), −1 vänster (B). → handleden i cW och
  // armbågens riktning i polUt.
  // (handledens vila: BAK bakåt och ULNAR mot lillfingret; hur långt den går lätt: BOJ fram, BAKAT bak,
  // TUM mot tummen och LILL mot lillfingret. POL: hur gärna armbågen ligger åt pol, HOJD: hur ogärna den
  // går upp mot axelns höjd, från HOJD0 under den, och INN: hur ogärna den går in framför magen, från
  // INN0 innanför axeln, båda i överarmens längder)
  const NAT = { BAK: 12 * DEG, BOJ: 34 * DEG, BAKAT: 40 * DEG, ULNAR: 6 * DEG, TUM: 14 * DEG, LILL: 26 * DEG, POL: 0.5, HOJD: 14, HOJD0: 0.3, INN: 10, INN0: 0.35, N: 36 };
  const nD = v();
  const nC = v();
  const n1 = v();
  const n2 = v();
  const nF = v();
  const nP = v();
  const nT = v();
  const nE = v();
  const nU = v();
  function naturlig(Sk, H, F, P, sida, pol, polUt, polVikt = NAT.POL) {
    const LH = LB + 26;
    nD.subVectors(H, Sk);
    const d = nD.length();
    // utsträckt eller hopvikt: som förut
    if (d > LA + LH - 8 || d < Math.abs(LA - LH) + 8) {
      polUt.copy(pol);
      return vristTill(Sk, H, pol, cU);
    }
    nD.divideScalar(d);
    const a = (LA * LA - LH * LH + d * d) / (2 * d);
    const r = Math.sqrt(Math.max(0, LA * LA - a * a));
    nC.copy(Sk).addScaledVector(nD, a);
    n1.copy(pol).addScaledVector(nD, -pol.dot(nD));
    if (n1.lengthSq() < 1e-6) n1.set(0, -1, 0).addScaledVector(nD, -nD.y);
    n1.normalize();
    n2.crossVectors(nD, n1);
    nF.copy(F).normalize();
    nP.copy(P).addScaledVector(nF, -P.dot(nF)).normalize();
    nT.crossVectors(nF, nP).multiplyScalar(sida);
    // handledens böjning när armbågen ligger vid vinkeln th (0 = pol): bakåt (−) och framåt mot
    // handflatan, och mot tummen (+) eller lillfingret
    const kost = (th) => {
      nE.copy(nC).addScaledVector(n1, r * Math.cos(th)).addScaledVector(n2, r * Math.sin(th));
      nU.subVectors(H, nE).normalize();
      const fram = nU.dot(nF);
      const boj = Math.atan2(-nU.dot(nP), fram) + NAT.BAK;
      const tum = Math.atan2(-nU.dot(nT), fram) + NAT.ULNAR;
      const hojd = Math.max(0, (nE.y - Sk.y) / LA + NAT.HOJD0);
      const inn = Math.max(0, (sida * (nE.x - Sk.x)) / LA - NAT.INN0);
      return (boj / (boj > 0 ? NAT.BOJ : NAT.BAKAT)) ** 2 + (tum / (tum > 0 ? NAT.TUM : NAT.LILL)) ** 2 + polVikt * (1 - Math.cos(th)) + NAT.HOJD * hojd * hojd + NAT.INN * inn * inn;
    };
    let bast = 0;
    let bk = Infinity;
    for (let i = 0; i < NAT.N; i++) {
      const th = ((i / NAT.N) * 2 - 1) * Math.PI;
      const k = kost(th);
      if (k < bk) { bk = k; bast = th; }
    }
    // och finare runt den bästa (gyllene snittet)
    let lo = bast - (2 * Math.PI) / NAT.N;
    let hi = bast + (2 * Math.PI) / NAT.N;
    const G = 0.381966;
    let x1 = lo + G * (hi - lo);
    let x2 = hi - G * (hi - lo);
    let k1 = kost(x1);
    let k2 = kost(x2);
    for (let i = 0; i < 10; i++) {
      if (k1 < k2) { hi = x2; x2 = x1; k2 = k1; x1 = lo + G * (hi - lo); k1 = kost(x1); } else { lo = x1; x1 = x2; k1 = k2; x2 = hi - G * (hi - lo); k2 = kost(x2); }
    }
    const th = (lo + hi) / 2;
    nE.copy(nC).addScaledVector(n1, r * Math.cos(th)).addScaledVector(n2, r * Math.sin(th));
    nU.subVectors(H, nE).normalize();
    polUt.subVectors(nE, Sk).normalize();
    return cW.copy(H).addScaledVector(nU, -26);
  }
  const cU = v();
  // upp och ned igen (fyra tider), eller nycklar
  const bump = (x, t) => (Array.isArray(x[0]) ? spar(x, t) : ss(x[0], x[1], t) * (1 - ss(x[2], x[3], t)));
  const rq = new THREE.Quaternion();
  const rq2 = new THREE.Quaternion();
  function cigarrArm(t, Sk, a, c) {
    vidMunnen();
    cigarrLage(t, cp, c);
    cigarrSatt(cp);
    // han rullar den mellan fingrarna: cigarren runt sin egen längd, och handen står kvar (förut vreds
    // handen med, så att handleden knäcktes fram och tillbaka)
    const rull = spar(c.rull, t);
    if (rull) {
      rq.copy(cp.q).multiply(rq2.setFromAxisAngle(UPP, rull));
      cig.mesh.matrix.makeRotationFromQuaternion(rq).setPosition(cX);
    }
    // fram till askkoppen och tillbaka i en låg båge, nära disken; däremellan håller han den (eller har den
    // i munnen). Pek- och långfingret ligger lite samlade medan han håller den. (Förut for handen upp i en
    // hög båge med raka, utspärrade fingrar och dök sedan ned på cigarren.)
    const mot = bump(c.mot, t);
    bortA = mot * 0.5;
    const upp = bump(c.upp, t);
    // (vilans riktning är armbågens hela längd: båda som enhetsvektorer, annars tar den nya över först på slutet)
    cPol.fromArray(VILA_A[1]).normalize().lerp(POL_UPP, upp);
    naturlig(Sk, cH, cF, cP, 1, cPol, cPol);
    a.w.lerp(cW, mot);
    a.w.y += 110 * mot * (1 - mot);
    a.pol.normalize().lerp(cPol, mot);
    a.F.lerp(cF, mot);
    a.P.lerp(cP, mot);
    a.krok = spar(c.krok, t);
    a.peka = 0;
    const g = bump(c.grepp, t);
    for (let i = 0; i < 4; i++) extraC[i] = EXTRA_C[i] * g;
    return extraC;
  }
  // ---------- elden ----------
  // Han tänder cigarren med en tändsticka ur stället eller med tändaren, med cigarren mellan tänderna (ck
  // 'tand') och höger hand fri. Det är stickan och tändaren som styr, som med cigarren: läget räknas fram och
  // handen ur greppet. Klippets eld: lägena (ek: [t, läge, båge]), när handen går dit och tillbaka (mot),
  // fingrarna (krok), lågan (laga, över 1 när stickan flammar upp) och hur den dras mot cigarren när han drar
  // (sug), hur långt stickan har brunnit (brand), glöden (glo) och röken (ryk) när han har skakat ut den;
  // tändarens lock (lock); när han tar stickan ur stället (ta), släpper den i askkoppen (slapp), och gnistorna
  // när hjulet inte tar (gnista).
  // Stickan hålls i fingertopparna längs fingrarna, mellan tummen och pekfingret och snett ut mot tummen
  // (VS), med toppen bortom fingertopparna (langs): då står underarmen upp med armbågen nere när han tänder.
  // Där han sträcker sig efter den, drar den mot plånen och släpper den har handen sin egen riktning (fri),
  // med fingrarna snett ned. (Tvärs över fingrarna som cigarren gick armbågen upp i axelhöjd.) SG_E: var på
  // stickan han håller, från änden; GS: nypet i handens mått (mot tummen, längs fingrarna, ut ur handflatan).
  const SG_E = 84;
  const GS = new THREE.Vector3(34, 166, 62).multiplyScalar(HAND.SK / 0.92);
  const VS = 37 * DEG;
  const EXTRA_E = [0, 0.06, 0.5, 0.62];
  const extraE = [0, 0, 0, 0];
  const E_UPP = new THREE.Vector3(0, 1, 0);
  const eM = new THREE.Matrix4();
  const eV = Array.from({ length: 8 }, () => new THREE.Vector3());
  const ePose = nyPose();
  const eH = new THREE.Vector3();
  const eF = new THREE.Vector3();
  const eP = new THREE.Vector3();
  const eX = new THREE.Vector3();
  const eY = new THREE.Vector3();
  const eZ = new THREE.Vector3();
  const eTopp = new THREE.Vector3();
  const eTopp0 = new THREE.Vector3();
  const eLagaUpp = new THREE.Vector3();
  const ePol = new THREE.Vector3();
  let eT0 = null;
  // Stickans lägen: greppets punkt och stickans ram (y mot toppen, z åt handflatan), och greppet (g).
  const PE = {};
  const peUr = (namn, end, dir, P, g = 'langs') => {
    eV[7].copy(dir).normalize();
    const ut = pose(PE[namn] || (PE[namn] = nyPose()), eV[6].copy(end).addScaledVector(eV[7], SG_E), eV[7], P);
    ut.g = g;
    return ut;
  };
  // (fri: handen vänd åt ett eget håll, fingrarna hF och handflatan hP, med nypet om stickan)
  const fri = (ps, hF, hP) => { ps.g = 'fri'; ps.hF = hF; ps.hP = hP; return ps; };
  const peGrepp = (namn, gp, dir, P, g) => peUr(namn, eV[4].copy(gp).addScaledVector(eV[3].copy(dir).normalize(), -SG_E), dir, P, g);
  const peTopp = (namn, topp, dir, P, g) => peUr(namn, eV[4].copy(topp).addScaledVector(eV[3].copy(dir).normalize(), -(STICKA.L - 2)), dir, P, g);
  // Handens ram i stickans (qRel, per läge): fingrarna (x), handflatan (y) och tummen (z = x × y). Längs
  // fingrarna (langs) är den fast (i stickans ram: x, y mot toppen, z åt handflatan); fri räknas ur handens
  // riktning i världen (hF, hP) och stickans läge.
  const qRelLangs = new THREE.Quaternion();
  {
    const F = V3(-Math.sin(VS), Math.cos(VS), 0);
    const P = V3(0, 0, 1);
    qRelLangs.setFromRotationMatrix(eM.makeBasis(F, P, new THREE.Vector3().crossVectors(F, P)));
  }
  const eQi = new THREE.Quaternion();
  function relUr(l) {
    if (l.g === 'fri') {
      eM.makeBasis(l.hF, l.hP, eV[5].crossVectors(l.hF, l.hP));
      l.qRel = (l.qRel || new THREE.Quaternion()).setFromRotationMatrix(eM).premultiply(eQi.copy(l.q).invert());
    } else l.qRel = l.g === 'hand' ? qRelTand : qRelLangs;
    // (handens ram i världen)
    l.qH = (l.qH || new THREE.Quaternion()).copy(l.q).multiply(l.qRel);
    return l;
  }
  const eQh = new THREE.Quaternion();
  // stickans läge vid t (ut), och handen ur det (eH, eF, eP): handen vrids den kortaste vägen från det ena
  // lägets ram till det andras (med samma grepp följer den stickan), och nypet sitter kvar om stickan
  const stickLage = (t, E, ut) => eldLage(t, E.ek, PE, GS, ut);
  // (M: lägena, stickans eller tändarens, och G: greppet i handens mått)
  function eldLage(t, K, M, G, ut) {
    let i = 1;
    while (i < K.length - 1 && t > K[i][0]) i++;
    const a = M[K[i - 1][1]];
    const b = M[K[i][1]];
    const f = ss(K[i - 1][0], K[i][0], t);
    ut.p.lerpVectors(a.p, b.p, f);
    ut.p.y += (K[i][2] || 0) * Math.sin(f * Math.PI);
    ut.q.slerpQuaternions(a.q, b.q, f);
    eQh.slerpQuaternions(a.qH, b.qH, f);
    ePol.copy(a.pol).lerp(b.pol, f).normalize();
    eF.set(1, 0, 0).applyQuaternion(eQh);
    eP.set(0, 1, 0).applyQuaternion(eQh);
    eV[5].set(0, 0, 1).applyQuaternion(eQh);
    eH.copy(ut.p).addScaledVector(eF, -G.y).addScaledVector(eP, -G.z).addScaledVector(eV[5], -G.x);
    return ut;
  }
  // (handflatan: mot stället från hans sida; mot hans vänstra sida och lite bakåt när han håller den upp; mot
  // stället när han drar den mot plånen; nedåt mot disken; fram över askkoppen)
  const P_STALL = V3(-0.55, 0, 0.83);
  // (handen när han nyper stickan i stället ovanifrån: fingrarna snett ned mot den, handflatan nedåt och
  // tummen mot hans vänstra sida; och när han drar upp den, lite mer upprätt)
  const vinkelratt = (F, h) => { const f = F.clone().normalize(); return [f, h.clone().addScaledVector(f, -h.dot(f)).normalize()]; };
  const [F_STALL, P_STALL_H] = vinkelratt(V3(-0.45, -0.42, 0.79), V3(0, -1, 0));
  const [F_STALL2, P_STALL_H2] = vinkelratt(V3(-0.3, -0.25, 0.92), V3(0.2, -1, 0));
  const [F_STRYK, P_STRYK_H] = vinkelratt(V3(-0.5, -0.42, 0.76), V3(0.1, -1, -0.2));
  const [F_ASK, P_ASK_H] = vinkelratt(V3(-0.2, -0.5, 0.84), V3(0, -1, 0));
  const P_SE = V3(0.85, 0, -0.5);
  const P_STRYK = V3(-0.55, 0, 0.83);
  const P_DISK = V3(0.3, 0, 0.95);
  const P_ASK = V3(-0.3, 0, 0.95);
  // plånen: på stället, på sidan mot honom och hans hand (nS), och han drar stickan snett nedåt längs den
  const nS = V3(0.55, 0, -0.83).normalize();
  const tS = new THREE.Vector3().crossVectors(E_UPP, nS);
  const D_STRYK = V3(0, 0, 0).addScaledVector(nS, -0.3).addScaledVector(E_UPP, -0.92).addScaledVector(tS, 0.15).normalize();
  const D_DISK = V3(-0.6, -0.6, 0.3).normalize();
  const D_SE = V3(0.12, 1, 0.08).normalize();
  const D_ASK = V3(-0.15, -1, 0.12).normalize();
  // Armbågen: ned och bakåt ut åt sidan när han sträcker sig mot stället och disken, och rakt ned när han
  // håller stickan upp framför sig (upp), bakåt över askkoppen. (Den väger tyngre än i naturlig annars, så att
  // den inte slår om mellan två lägen.)
  const POL_NA = V3(-0.55, -0.7, -0.45).normalize();
  const POL_E = { stall: POL_NA, lyft: POL_NA, stryk0: POL_NA, stryk1: POL_NA, disk0: POL_NA, disk1: POL_NA, upp: V3(-0.42, -0.88, -0.2).normalize(), ask: V3(-0.4, -0.75, -0.5).normalize() };
  const POL_VIKT_E = 20;
  // i handen framför bröstet, där han tittar på lågan, och där han skakar den
  const G_SE = V3(-235, 60, 560);
  const G_SKAK = V3(-245, 20, 560);
  function stickLagen() {
    // i stället: den sista som står kvar (stallets mått → världen), och uppdragen ur det
    eM.multiplyMatrices(stall.mesh.matrixWorld, stall.lage(Math.max(0, ELD.kvar - 1)));
    eV[0].setFromMatrixColumn(eM, 1).normalize();
    eV[1].setFromMatrixPosition(eM);
    fri(peUr('stall', eV[1], eV[0], P_STALL), F_STALL, P_STALL_H);
    fri(peUr('lyft', eV[2].copy(eV[1]).addScaledVector(E_UPP, 100), eV[0], P_STALL), F_STALL2, P_STALL_H2);
    // mot plånen: toppen överst och nederst på den
    const C = eV[1].fromArray(STALL_P);
    const r = STALL.R + STICKA.HR;
    fri(peTopp('stryk0', eV[2].copy(C).addScaledVector(nS, r).addScaledVector(E_UPP, STALL.PLAN[1] - 4).addScaledVector(tS, -8), D_STRYK, P_STRYK), F_STRYK, P_STRYK_H);
    fri(peTopp('stryk1', eV[2].copy(C).addScaledVector(nS, r + 1).addScaledVector(E_UPP, STALL.PLAN[0] + 6).addScaledVector(tS, 6), D_STRYK, P_STRYK), F_STRYK, P_STRYK_H);
    // och efter draget: ut och upp från stället, toppen uppåt
    peTopp('stryk2', eV[2].copy(C).addScaledVector(nS, r + 60).addScaledVector(E_UPP, 120), D_SE, P_SE);
    // mot disken: ett långt drag i sidled precis bakom askkoppen (framför stället skulle armen gå genom det)
    fri(peTopp('disk0', eV[2].set(-420, BORD.Y + STICKA.HR, 692), D_DISK, P_DISK), F_STRYK, P_STRYK_H);
    fri(peTopp('disk1', eV[2].set(-245, BORD.Y + STICKA.HR, 650), D_DISK, P_DISK), F_STRYK, P_STRYK_H);
    peTopp('disk2', eV[2].set(-290, BORD.Y + 110, 600), D_SE, P_SE);
    peGrepp('se', G_SE, D_SE, P_SE);
    // vid cigarrens glöd: toppen under den och lite utanför, så att lågan når den
    peTopp('fot', eV[2].copy(fot).addScaledVector(cA, 10).addScaledVector(E_UPP, -26), D_SE, P_SE);
    // skakar ut den: handen vrids fram och tillbaka
    peGrepp('skak', G_SKAK, D_SE, P_SE);
    peGrepp('skak1', G_SKAK, eV[2].set(0.5, 0.86, -0.05), P_SE);
    peGrepp('skak2', G_SKAK, eV[2].set(-0.38, 0.92, 0.05), P_SE);
    // över askkoppen, toppen ned
    fri(peTopp('ask', eV[2].set(ASK[0] + 8, BORD.Y + 46, ASK[2] - 6), D_ASK, P_ASK), F_ASK, P_ASK_H);
    for (const [namn, l] of Object.entries(PE)) {
      relUr(l);
      l.pol = POL_E[namn] || POL_E.upp;
    }
  }
  // stickan på plats ur läget (änden i origo, toppen längs y), och toppen i eTopp
  function stickSatt(ps) {
    eX.set(1, 0, 0).applyQuaternion(ps.q);
    eY.set(0, 1, 0).applyQuaternion(ps.q);
    eZ.set(0, 0, 1).applyQuaternion(ps.q);
    eV[0].copy(ps.p).addScaledVector(eY, -SG_E);
    sticka.mesh.matrix.makeBasis(eX, eY, eZ).setPosition(eV[0]);
    sticka.mesh.matrixWorldNeedsUpdate = true;
    eTopp.copy(eV[0]).addScaledVector(eY, STICKA.L - 1);
  }
  // den släppta stickan faller ned i askkoppen, på plats i (BRANDA)
  const eFall = new THREE.Matrix4();
  const eQ0 = new THREE.Quaternion();
  const eQ1 = new THREE.Quaternion();
  const eS = new THREE.Vector3();
  function stickFall(t, E) {
    const f = clamp((t - E.slapp) / 0.32);
    stickLage(E.slapp, E, ePose);
    stickSatt(ePose);
    eM.copy(sticka.mesh.matrix);
    eFall.multiplyMatrices(ask.mesh.matrixWorld, brandLage(Math.min(ELD.branda, BRANDA.length - 1)));
    eQ0.setFromRotationMatrix(eM);
    eQ1.setFromRotationMatrix(eFall);
    eV[0].setFromMatrixPosition(eM);
    eV[1].setFromMatrixPosition(eFall);
    const g = f * f;
    eQ0.slerp(eQ1, ss(0.1, 1, f));
    eV[0].lerp(eV[1], g);
    sticka.mesh.matrix.compose(eV[0], eQ0, eS.set(1, 1, 1));
    sticka.mesh.matrixWorldNeedsUpdate = true;
  }
  // ---------- tändaren ----------
  // Tändarens lägen (ram: origo i greppet T_GY upp på kroppen, x mot gångjärnet, y uppåt längs höjden, z ut
  // ur framsidan): på disken som den ligger, där han tar den ovanifrån (fri), och upprätt i handen (hand):
  // handflatan mot framsidan, fingrarna om sidan utan gångjärn och tummen ovanpå, vid locket och hjulet. Han
  // håller den framför bröstet med framsidan mot sin vänstra sida (TZ), och med veken under cigarrens glöd.
  const T_GY = 30;
  const GT = new THREE.Vector3(24, 104, 40).multiplyScalar(HAND.SK / 0.92);
  const PT = {};
  const qRelTand = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(-1, 0, 0), V3(0, 0, 1), V3(0, 1, 0)));
  const tPose = nyPose();
  const tX = new THREE.Vector3();
  const tY = new THREE.Vector3();
  const tZ = new THREE.Vector3();
  const tO = new THREE.Vector3();
  const TZ = V3(0.97, 0, 0.25).normalize();
  const TXu = new THREE.Vector3().crossVectors(E_UPP, TZ);
  const [F_TDISK, P_TDISK] = vinkelratt(V3(-0.25, -0.5, 0.83), V3(0, -1, 0));
  const POL_T = { disk: POL_NA, lyft: POL_NA };
  function ptUr(namn, o, x, y, z) {
    eM.makeBasis(x, y, z);
    const ut = PT[namn] || (PT[namn] = nyPose());
    ut.q.setFromRotationMatrix(eM);
    ut.p.copy(o).addScaledVector(y, T_GY);
    ut.g = 'hand';
    return ut;
  }
  function tandLagen() {
    tX.setFromMatrixColumn(TAND_VILA, 0);
    tY.setFromMatrixColumn(TAND_VILA, 1);
    tZ.setFromMatrixColumn(TAND_VILA, 2);
    tO.setFromMatrixPosition(TAND_VILA);
    fri(ptUr('disk', tO, tX, tY, tZ), F_TDISK, P_TDISK);
    ptUr('lyft', eV[0].set(-500, -170, 640), TXu, E_UPP, TZ);
    ptUr('se', eV[0].set(-300, -30, 560), TXu, E_UPP, TZ);
    // veken under glöden: origo = veken − ramen · VEKE
    eV[1].copy(fot).addScaledVector(cA, 8).addScaledVector(E_UPP, -34);
    eV[0].copy(eV[1]).addScaledVector(TXu, -TANDARE.VEKE[0]).addScaledVector(E_UPP, -TANDARE.VEKE[1]).addScaledVector(TZ, -TANDARE.VEKE[2]);
    ptUr('fot', eV[0], TXu, E_UPP, TZ);
    for (const [namn, l] of Object.entries(PT)) {
      relUr(l);
      l.pol = POL_T[namn] || POL_E.upp;
    }
  }
  // tändaren där den ligger på disken, med locket stängt
  function tandVilar() {
    tand.mesh.matrix.copy(TAND_VILA);
    tand.mesh.matrixWorldNeedsUpdate = true;
    tand.U.uLock.value = 0;
  }
  function eldArm(t, n, Sk, a, E, ex0) {
    const mot = spar(E.mot, t);
    const harSticka = E.sort === 'sticka' && t >= E.ta;
    sticka.mesh.visible = harSticka;
    stall.antal(ELD.kvar - (harSticka ? 1 : 0));
    // lågan: hur stark (l), hur hög och bred, och om det är stickans (0) eller tändarens (1)
    let l = 0;
    let lh = 30;
    let lb = 10.5;
    let lsort = 0;
    if (E.sort === 'sticka') {
      // stickan: i handen, eller släppt i askkoppen
      stickLagen();
      tandVilar();
      if (t < E.slapp) {
        stickLage(t, E, ePose);
        stickSatt(ePose);
      } else stickFall(t, E);
      sticka.U.uBrand.value = spar(E.brand, t);
      sticka.U.uGlo.value = spar(E.glo, t);
      sticka.U.uTid.value = n;
      l = t < E.slapp ? spar(E.laga, t) : 0;
      const flamma = Math.max(0, l - 1);
      lh = 30 * (1 + 1.3 * flamma);
      lb = 10.5 * (1 + 1.6 * flamma);
    } else {
      // tändaren: lyft ur sitt läge på disken, locket uppfällt (lock) och lågan när hjulet tar; gnistorna när
      // det inte tar
      tandLagen();
      eldLage(t, E.ek, PT, GT, tPose);
      tX.set(1, 0, 0).applyQuaternion(tPose.q);
      tY.set(0, 1, 0).applyQuaternion(tPose.q);
      tZ.set(0, 0, 1).applyQuaternion(tPose.q);
      tO.copy(tPose.p).addScaledVector(tY, -T_GY);
      tand.mesh.matrix.makeBasis(tX, tY, tZ).setPosition(tO);
      tand.mesh.matrixWorldNeedsUpdate = true;
      const lk = spar(E.lock, t);
      tand.U.uLock.value = lk;
      eTopp.copy(tO).addScaledVector(tX, TANDARE.VEKE[0]).addScaledVector(tY, TANDARE.VEKE[1] + 1).addScaledVector(tZ, TANDARE.VEKE[2]);
      l = spar(E.laga, t) * ss(0.5, 0.8, lk);
      lh = 44;
      lb = 11;
      lsort = 1;
      for (const g of E.gnista) {
        if (t > g && t < g + 0.09 && l < 0.3) {
          l = 0.6 * (1 - (t - g) / 0.09);
          lh = 15;
          lb = 9;
        }
      }
    }
    // lågan: står upp, dras mot cigarrens glöd när han drar (sug), och släpar efter när handen rör sig
    if (l > 0.004) {
      eLagaUpp.copy(E_UPP).lerp(eV[0].subVectors(fot, eTopp).normalize(), 0.75 * spar(E.sug, t));
      const dt = eT0 === null ? 0 : t - eT0;
      if (dt > 1e-3 && dt < 0.1) eLagaUpp.addScaledVector(eV[1].subVectors(eTopp, eTopp0), -0.012 / dt).normalize();
      laga.satt(eTopp, eLagaUpp, lh, lb, Math.min(1.25, l), lsort, n);
      // skenet: lite över toppen, och fladdrar med lågan
      bord.eld.value.set(eTopp.x, eTopp.y + 14, eTopp.z, Math.min(1.6, l) * (0.9 + 0.1 * Math.sin(n * 31) * Math.sin(n * 17.3)));
    } else {
      laga.satt(eTopp, E_UPP, 0, 0, 0, 0, n);
      bord.eld.value.w = 0;
    }
    eTopp0.copy(eTopp);
    eT0 = t;
    if (mot <= 0) return null;
    // handen ur greppet (eldLage), och armbågen där handleden ser naturlig ut
    if (E.sort === 'sticka' && t >= E.slapp) stickLage(E.slapp, E, ePose);
    naturlig(Sk, eH, eF, eP, 1, ePol, ePol, POL_VIKT_E);
    a.w.lerp(cW, mot);
    a.w.y += 70 * mot * (1 - mot);
    a.pol.normalize().lerp(ePol, mot);
    a.F.lerp(eF, mot);
    a.P.lerp(eP, mot);
    a.krok += (spar(E.krok, t) - a.krok) * mot;
    a.peka *= 1 - mot;
    bortA = Math.max(bortA, mot);
    for (let i = 0; i < 4; i++) extraE[i] = (ex0 ? ex0[i] : 0) * (1 - mot) + EXTRA_E[i] * mot;
    return extraE;
  }
  // ---------- pennan ----------
  // Din kupong ligger på disken (rum-hasse-kupong.js säger var), med pennan på sig. Det är pennan som
  // styr, som med cigarren: spetsens väg räknas fram i kupongens mått, handen räknas ur greppet och
  // armen ur handen. Han håller den som man håller en penna: den går från greppet (mellan tummen och
  // fingrarna) snett bakåt mot tumsidan och spetsen ut bortom fingertopparna. Så skriver han lite
  // snett över rutan, och handen skymmer inte rutan.
  const pen = byggPenna(bord);
  S.add(pen.mesh);
  // greppet i handens mått (mot tummen, längs fingrarna, ut ur handflatan), hur långt det är från
  // spetsen, spetsens riktning när han skriver och handflatan då
  // (x, y och z i handens skala: måtten är tagna med handen i skala 0,92)
  const PG = { x: 34 * HAND.SK / 0.92, y: 122 * HAND.SK / 0.92, z: 84 * HAND.SK / 0.92, SP: 80 };
  const T_SKRIV = V3(0.5, -0.7, 0.5).normalize();
  const P_SKRIV = V3(0.75, -0.45, -0.1);
  const P_TA = V3(0, -1, 0);
  // vinkeln (i handens plan) från tummen till spetsen när han skriver och när han tar pennan
  const V_SKRIV = 128 * DEG;
  const V_TA = 180 * DEG;
  const KPG = { o: v(), ex: v(), ey: v(), upp: V3(0, 1, 0), vila: null, vilaA: v(), kryss: [], bana: [], synlig: false };
  const pp = (x, y, h, ut) => ut.copy(KPG.o).addScaledVector(KPG.ex, x).addScaledVector(KPG.ey, y).addScaledVector(KPG.upp, h);
  // Spetsens väg: [t0, t1, a, b, c] i klippets tid, från a till b (c: böjen), [x, y, höjd] i kupongens
  // mått. Bläcket följer dragen: varje kryss har tiderna för sina två drag (drag).
  function banan(kryss) {
    const bana = [];
    let t = SKRIV.MOT + SKRIV.LYFT;
    const ut = [];
    const H_LUFT = 26;
    kryss.forEach((k, i) => {
      const steg = (dur, a, b, c = null) => { bana.push([t, t + dur, a, b, c]); t += dur; };
      const [s1, s2] = k.drag;
      if (i) steg(SKRIV.MELLAN, [...kryss[i - 1].drag[1].b, H_LUFT], [...s1.a, H_LUFT]);
      steg(SKRIV.NED, [...s1.a, H_LUFT], [...s1.a, 0]);
      const d1 = [t, t + SKRIV.DRAG];
      steg(SKRIV.DRAG, [...s1.a, 0], [...s1.b, 0], [...s1.c, 0]);
      steg(SKRIV.UPP, [...s1.b, 0], [...s1.b, H_LUFT]);
      steg(SKRIV.OVER, [...s1.b, H_LUFT], [...s2.a, H_LUFT]);
      steg(SKRIV.NED2, [...s2.a, H_LUFT], [...s2.a, 0]);
      const d2 = [t, t + SKRIV.DRAG2];
      steg(SKRIV.DRAG2, [...s2.a, 0], [...s2.b, 0], [...s2.c, 0]);
      steg(SKRIV.EFTER, [...s2.b, 0], [...s2.b, 60]);
      ut.push([d1, d2]);
    });
    return { bana, tider: ut };
  }
  const tipp = v();
  function spets(tau, ut) {
    const b = KPG.bana;
    if (!b.length) return pp(0, 0, 40, ut);
    if (tau <= b[0][0]) { const a = b[0][2]; return pp(a[0], a[1], a[2], ut); }
    for (const [t0, t1, a, e, c] of b) {
      if (tau > t1) continue;
      const u = ss(t0, t1, tau);
      if (c) {
        const w = 1 - u;
        return pp(w * w * a[0] + 2 * w * u * c[0] + u * u * e[0], w * w * a[1] + 2 * w * u * c[1] + u * u * e[1], 0, ut);
      }
      return pp(a[0] + (e[0] - a[0]) * u, a[1] + (e[1] - a[1]) * u, a[2] + (e[2] - a[2]) * u, ut);
    }
    const a = b[b.length - 1][3];
    return pp(a[0], a[1], a[2], ut);
  }
  const qV = new THREE.Quaternion();
  const qS = new THREE.Quaternion();
  const qN = new THREE.Quaternion();
  const pA = v();
  const pP = v();
  const pF = v();
  const pW = v();
  const pH = v();
  const pX = v();
  const pK = v();
  const pB = new THREE.Matrix4();
  // pennans läge som kvaternion: y mot änden, z ut ur handflatan
  function pennQ(q, A, P) {
    pA.copy(A).normalize();
    pF.crossVectors(pA, P).normalize();
    pP.crossVectors(pF, pA);
    pB.makeBasis(pF, pA, pP);
    return q.setFromRotationMatrix(pB);
  }
  pennQ(qS, T_SKRIV.clone().negate(), P_SKRIV);
  // Spetsen och pennans riktning vid tau. → hur mycket fingrarna har den (0–1), vinkeln i handen
  function pennLage(tau, n) {
    const E = skrivSlut(n);
    const G0 = SKRIV.MOT;
    const LYFT1 = G0 + SKRIV.LYFT;
    const G1 = E + SKRIV.HALL + SKRIV.TILLBAKA;
    const liggerH = (x) => pp(KPG.vila.x, KPG.vila.y, PENNA.R + 0.5, x);
    let f = 0;
    if (tau <= G0) { liggerH(tipp); qN.copy(qV); f = 0; } else if (tau < LYFT1) {
      f = ss(G0, LYFT1, tau);
      liggerH(tipp);
      spets(LYFT1, pX);
      tipp.lerp(pX, f);
      tipp.y += 60 * Math.sin(f * Math.PI);
      qN.slerpQuaternions(qV, qS, f);
    } else if (tau < E + SKRIV.HALL) {
      f = 1;
      spets(tau, tipp);
      // han håller pennan uppe en stund efteråt
      tipp.y += 34 * ss(E, E + 0.3, tau);
      qN.copy(qS);
    } else {
      f = 1 - ss(E + SKRIV.HALL, G1, tau);
      spets(E + SKRIV.HALL, pX);
      pX.y += 34;
      liggerH(tipp);
      tipp.lerp(pX, f);
      tipp.y += 70 * Math.sin(f * Math.PI);
      qN.slerpQuaternions(qV, qS, f);
    }
    return f;
  }
  function pennArm(t, Sk, a, c) {
    const n = c.n;
    const tau = t - c.fran;
    const E = skrivSlut(n);
    const T = skrivTid(n);
    const f = pennLage(tau, n);
    pA.set(0, 1, 0).applyQuaternion(qN);
    pP.set(0, 0, 1).applyQuaternion(qN);
    // pennan på sin plats
    pB.makeRotationFromQuaternion(qN).setPosition(tipp);
    pen.mesh.matrix.copy(pB);
    pen.mesh.matrixWorldNeedsUpdate = true;
    // handens mått ur pennans: spetsens riktning T, och i handens plan w = P × T
    const vk = V_TA + (V_SKRIV - V_TA) * f;
    pX.copy(pA).negate();
    pW.crossVectors(pP, pX);
    pF.copy(pX).multiplyScalar(Math.sin(vk)).addScaledVector(pW, Math.cos(vk));
    pK.copy(pX).multiplyScalar(Math.cos(vk)).addScaledVector(pW, -Math.sin(vk));
    pH.copy(tipp).addScaledVector(pA, PG.SP).addScaledVector(pK, -PG.x).addScaledVector(pF, -PG.y).addScaledVector(pP, -PG.z);
    // handleden, och armbågen ut åt sidan och nedåt
    cPol.fromArray(VILA_A[1]).normalize();
    vristTill(Sk, pH, cPol, cU);
    const mot = ss(0.05, SKRIV.MOT, tau) * (1 - ss(T - SKRIV.HEM, T - 0.05, tau));
    bortA = mot;
    a.w.lerp(cW, mot);
    a.w.y += 90 * mot * (1 - mot);
    a.pol.normalize().lerp(cPol, mot);
    a.F.lerp(pF, mot);
    a.P.lerp(pP, mot);
    const lg = T - SKRIV.HEM;
    a.krok = tau < 0.55 ? VILA_A[4] + (0.1 - VILA_A[4]) * ss(0.1, 0.55, tau)
      : tau < lg + 0.2 ? 0.1 + 0.38 * ss(SKRIV.MOT - 0.2, SKRIV.MOT, tau) * (1 - ss(lg - 0.1, lg + 0.1, tau))
        : 0.1 + (VILA_A[4] - 0.1) * ss(lg + 0.2, T - 0.1, tau);
    a.peka = 0;
    const g = ss(SKRIV.MOT - 0.2, SKRIV.MOT, tau) * (1 - ss(lg - 0.1, lg + 0.1, tau));
    for (let i = 0; i < 4; i++) extraC[i] = [0, 0.04, 0.16, 0.26][i] * g;
    void E;
    return extraC;
  }

  // ---------- tidningen ----------
  // Tidningen styr som cigarren och pennan: dess läge räknas ur klippets nycklar (las), och händerna håller
  // i kanterna på höjden gy. Handen sitter utanför kanten med handflatan in mot ryggen och fingrarna böjda
  // runt kanten, så att fingertopparna ligger på utsidan (mot en), och underarmen kommer bakifrån utanför
  // papperet. (Med handen på utsidan gick underarmen genom papperet.) På vägen mellan vilan och kanterna går
  // handen först bakåt och sedan ned (eller upp och sedan fram), så att den inte går genom disken.
  const tidning = byggTidning(bord);
  S.add(tidning.mesh);
  const TS = { beta: 0, buk: 0, vag: 0, fas: 0 };
  // greppet: handflatan så långt utanför kanten, handens origo så långt bakom papperet (längs fingrarna),
  // fingrarnas vinkel uppåt och deras krok
  const TG = { UT: 24, BAK: 64, UPP: 22 * DEG, KROK: 0.62 };
  const tM = new THREE.Matrix4();
  const tQ = new THREE.Quaternion();
  const tE = new THREE.Euler();
  const tPos = v();
  const ETT = new THREE.Vector3(1, 1, 1);
  const tg0 = v();
  const tg1 = v();
  const tg2 = v();
  const tgX = v();
  const tgY = v();
  const tgN = v();
  const tH = v();
  const tF = v();
  const tP = v();
  const tW = [v(), v()];
  const tPl = [v(), v()];
  const tFs = [v(), v()];
  const tPs = [v(), v()];
  // handen vid kanten på sidan sida (1 hans högra, till vänster i bild): tH, tF och tP i världen
  function tGrepp(sida, gy) {
    const qx = -sida;
    const e = 0.01;
    ytan(qx, gy, TS, tg0).applyMatrix4(tM);
    ytan(qx + e, gy, TS, tg1).applyMatrix4(tM);
    ytan(qx - e, gy, TS, tg2).applyMatrix4(tM);
    tgX.subVectors(tg1, tg2).normalize();
    ytan(qx, gy + e, TS, tg1).applyMatrix4(tM);
    ytan(qx, gy - e, TS, tg2).applyMatrix4(tM);
    tgY.subVectors(tg1, tg2).normalize();
    tgN.crossVectors(tgX, tgY).normalize();
    // fingrarna fram mot en (utsidan) och lite uppåt, handflatan in mot ryggen (+x för den högra handen)
    tF.copy(tgN).multiplyScalar(Math.cos(TG.UPP)).addScaledVector(tgY, Math.sin(TG.UPP)).normalize();
    tP.copy(tgX).multiplyScalar(sida);
    tH.copy(tg0).addScaledVector(tP, -TG.UT).addScaledVector(tF, -TG.BAK);
  }
  // → hur mycket händerna håller den (0–1)
  function tidningArm(t, n, kl, a, b) {
    const L = kl.las;
    const s = (x) => spar(L[x], t);
    TS.beta = s('beta');
    TS.buk = s('buk');
    TS.vag = s('vag');
    TS.fas = n * 15;
    const U_ = tidning.U;
    U_.uBeta.value = TS.beta;
    U_.uBuk.value = TS.buk;
    U_.uVag.value = TS.vag;
    U_.uFas.value = TS.fas;
    tE.set(-s('tilt'), s('yaw'), s('roll'), 'YXZ');
    tQ.setFromEuler(tE);
    tM.compose(tPos.set(s('x'), s('y'), s('z')), tQ, ETT);
    tidning.mesh.matrix.copy(tM);
    tidning.mesh.matrixWorldNeedsUpdate = true;
    tidning.mesh.visible = true;
    const mot = s('mot');
    const gy = s('gy');
    for (let i = 0; i < 2; i++) {
      const sida = i ? -1 : 1;
      const vila = i ? VILA_B : VILA_A;
      tGrepp(sida, gy);
      // armbågen nedåt, lite ut åt sidan och bakåt (aldrig framåt: då hamnar ärmen framför papperet medan han lyfter
      // den bakom diskens kant; och med armbågen ut och bakåt stod armarna ut som vingar när han läste)
      cPol.set(-sida * 0.42, -0.88, -0.3).normalize();
      // (en fast riktning för armbågen, inte naturlig: med handen given av papperet valde den ibland armbågen
      // uppe vid örat medan tidningen kom upp)
      vristTill(i ? sb : sa, tH, cPol, cU);
      tPl[i].copy(cPol);
      tW[i].copy(cW);
      tFs[i].copy(tF);
      tPs[i].copy(tP);
    }
    for (let i = 0; i < 2; i++) {
      const h = i ? b : a;
      const w0 = (i ? VILA_B : VILA_A)[0];
      if (mot >= 1) h.w.copy(tW[i]);
      else {
        // bakåt först och sedan ned (z före y), med ett litet lyft
        const fz = ss(0, 0.6, mot);
        const fy = ss(0.4, 1, mot);
        h.w.set(w0[0] + (tW[i].x - w0[0]) * mot, w0[1] + (tW[i].y - w0[1]) * fy + 70 * Math.sin(Math.PI * mot), w0[2] + (tW[i].z - w0[2]) * fz);
      }
      h.pol.normalize().lerp(tPl[i], mot);
      h.F.lerp(tFs[i], mot);
      h.P.lerp(tPs[i], mot);
      h.krok += (TG.KROK - h.krok) * mot;
      h.peka *= 1 - mot;
    }
    bortA = Math.max(bortA, mot);
    bortB = Math.max(bortB, mot);
    return mot;
  }

  // ---------- glasögonen ----------
  // Läsglasögonen (rum-hasse-arm.js) styr som cigarren: deras läge räknas ur klippets nycklar (glas.gk) mellan de
  // namngivna lägena i GL, och höger hand räknas ur greppet: tummen och pekfingret om bågens högra hörn (bakom
  // och framför), eller pekfingertoppen på bryggan (finger). Lägena på näsan och framför ansiktet följer huvudet
  // (h), de andra kroppen. Utanför läsningen sitter de i bröstfickan, där bara det översta hörnet sticker upp.
  const glas = byggGlasogon(bord);
  S.add(glas.grupp);
  const ETT3 = new THREE.Vector3(1, 1, 1);
  const lagM = (p, rx, ry = 0, rz = 0) => new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), ETT3);
  // Punkterna som ska gå fria från ansiktet (glasens kanter, bryggan) och näsdynorna som vilar på näsan, i bågens
  // mått: [punkt, luft]
  const PROV = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      PROV.push([V3(s * GLAS.C + Math.cos(a) * GLAS.A, Math.sin(a) * GLAS.B, 0), 7]);
    }
    PROV.push([V3(s * 11, -6, -7), 0.5]);
  }
  // på näsan, med glasens mitt på höjden fy i fotot och lutade tilt: så nära ansiktet som det går (djup)
  function paNasan(fy, tilt) {
    const R = new THREE.Matrix4().makeRotationX(tilt);
    const q = v();
    let z = -1e9;
    for (const [p, luft] of PROV) {
      q.copy(p).applyMatrix4(R);
      z = Math.max(z, djup(662.75 + q.x, fy - q.y) + luft - q.z);
    }
    return lagM(W_(662.75, fy, z), tilt);
  }
  // bröstfickan: på hans vänstra sida, öppningen vid (752, 928) i fotot
  const FICKA = W_(752, 928, djup(752, 928));
  const GL = {
    // på näsan, lite lägre (glid) och längst ned, så att han ser över dem (nasa); framför ansiktet på väg på och av
    pa: { h: true, m: paNasan(403, 0.14) },
    glid: { h: true, m: paNasan(410, 0.16) },
    nasa: { h: true, m: paNasan(426, 0.24) },
    // i fickan: hopfällda och på högkant med det högra hörnet uppåt, och resten nere i fickan bakom kavajen
    ficka: { m: new THREE.Matrix4().makeBasis(V3(0, -1, -0.1).normalize(), V3(0.99, 0, -0.14).normalize(), V3(0.14, -0.1, 0.98).normalize()).setPosition(FICKA.x - 4, FICKA.y - 32, FICKA.z - 3) },
    // uppdragna ur fickan
    ute: { m: new THREE.Matrix4().makeBasis(V3(0.15, -0.95, 0.25).normalize(), V3(0.98, 0.15, 0).normalize(), V3(-0.05, 0.25, 0.97).normalize()).setPosition(FICKA.x - 20, FICKA.y + 90, FICKA.z + 70) },
    // framför hakan, framsidan bort från honom (skalmarna mot honom): där fälls de ut och ihop
    oppna: { m: lagM(V3(-20, 390, 520), -0.35, 0.1, 0.05) },
    // i handen framför bröstet när han har tagit av dem, och en knyck mot en
    hall: { m: lagM(V3(-180, 390, 500), -0.15, -0.55, 0.12) },
    visa: { m: lagM(V3(-160, 430, 540), -0.1, -0.3, 0.05) },
    // hopfällda mot skjortan och slipsen, där han putsar dem (gnid i klippet: små cirklar), och uppe mot
    // ljuset på armlängds avstånd, där han tittar genom dem (putsa)
    putsa: { m: lagM(W_(690, 800, djup(690, 800) + 22), 0.3, -0.1, 0.15) },
    kika: { m: lagM(V3(-40, 600, 600), -0.3, -0.2, 0.1) },
  };
  GL.fore = { h: true, m: GL.pa.m.clone().premultiply(new THREE.Matrix4().makeTranslation(0, -14, 120)) };
  // Skalmens ände i munnen (tanka): bågen vänd så att den högra skalmen pekar in mot mungipan.
  {
    const R = lagM(V3(), -0.15, -1.3, 0.2);
    const ande = glas.ande(-1, 1).applyMatrix4(R);
    const mun = W_(628, 506, djup(628, 506) - 4);
    GL.tanka = { h: true, m: R.setPosition(mun.sub(ande)) };
  }
  // greppet i bågens mått: tummen och pekfingret om det högra hörnet (punkten, riktningen genom bågen och
  // handflatan in mot ansiktet), och pekfingertoppen på bryggan med fingret uppåt och handflatan mot honom
  const NYP = { p: V3(-(GLAS.C + GLAS.A - 6), 6, 0), A: V3(0, 0, 1), P: V3(1, 0, 0) };
  // (bakom tidningen: om gångjärnet från sidan, med fingrarna framåt och handen bakom och under, så att underarmen
  // går bakom tidningen; sido 1)
  const SIDO = { p: V3(-(GLAS.C + GLAS.A - 1), 7, -4), F: V3(0.15, 0.8, 0.58).normalize(), P: V3(1, 0, 0) };
  SIDO.P.addScaledVector(SIDO.F, -SIDO.P.dot(SIDO.F)).normalize();
  SIDO.A = new THREE.Vector3().crossVectors(SIDO.P, SIDO.F);
  const FINGER = { p: V3(0, 14, 3), F: V3(0.35, 0.8, -0.48).normalize(), P: V3(0, -0.5, -0.85), L: 250 * HAND.SK, U: 16 * HAND.SK };
  FINGER.P.addScaledVector(FINGER.F, -FINGER.P.dot(FINGER.F)).normalize();
  const HM = new THREE.Matrix4();
  const hm3 = new THREE.Matrix4();
  const hT = new THREE.Matrix4();
  // huvudets matris (som i skuggaren: runt PIV, sedan kroppen)
  function huvudM() {
    hm3.setFromMatrix3(U.uHuvud.value);
    HM.copy(mk).multiply(hT.makeTranslation(PIV.x, PIV.y, PIV.z)).multiply(hm3).multiply(hT.makeTranslation(-PIV.x, -PIV.y, -PIV.z));
    return HM;
  }
  const gA = { p: v(), q: new THREE.Quaternion(), s: v() };
  const gB = { p: v(), q: new THREE.Quaternion(), s: v() };
  const gW = new THREE.Matrix4();
  const gM = new THREE.Matrix4();
  const iVarld = (namn, ut) => gM.multiplyMatrices(GL[namn].h ? HM : mk, GL[namn].m).decompose(ut.p, ut.q, ut.s);
  const PA_ANSIKTET = new Set(['pa', 'glid', 'nasa']);
  // glasen över ögonen (förstorar dem i skuggaren): hur mycket, och glasens mitt i fotot (y)
  const LINS = { styrka: 0, y: 400 };
  const linsY = (namn) => 900 - GL[namn].m.elements[13];
  // bågens läge i världen (gW) vid t; → hur mycket den sitter i fickan (0–1)
  function glasLage(t, G) {
    huvudM();
    const gk = G && G.gk;
    let a = 'ficka';
    let b = 'ficka';
    let f = 0;
    let h = 0;
    if (gk && t > gk[0][0] && t < gk[gk.length - 1][0]) {
      let i = 1;
      while (t > gk[i][0]) i++;
      f = ss(gk[i - 1][0], gk[i][0], t);
      a = gk[i - 1][1];
      b = gk[i][1];
      h = gk[i][2] || 0;
    } else if (gk) a = b = t <= gk[0][0] ? gk[0][1] : gk[gk.length - 1][1];
    iVarld(a, gA);
    iVarld(b, gB);
    gA.p.lerp(gB.p, f);
    gA.p.y += h * Math.sin(f * Math.PI);
    // (gnid: han putsar dem i små cirklar)
    const gn = G && G.gnid ? spar(G.gnid, t) : 0;
    if (gn) {
      gA.p.x += 12 * gn * Math.cos(t * 17);
      gA.p.y += 8 * gn * Math.sin(t * 17);
    }
    gA.q.slerp(gB.q, f);
    gW.compose(gA.p, gA.q, ETT3);
    const pa = (PA_ANSIKTET.has(a) ? 1 - f : 0) + (PA_ANSIKTET.has(b) ? f : 0);
    LINS.styrka = pa;
    LINS.y = PA_ANSIKTET.has(a) && PA_ANSIKTET.has(b) ? linsY(a) + (linsY(b) - linsY(a)) * f : linsY(PA_ANSIKTET.has(a) ? a : PA_ANSIKTET.has(b) ? b : 'pa');
    return (a === 'ficka' ? 1 - f : 0) + (b === 'ficka' ? f : 0);
  }
  const gp = nyPose();
  const gq = v();
  const gF = v();
  const gP = v();
  const gH = v();
  // (armbågen ut åt sidan och bakåt: underarmen går bakom tidningen, inte framför den)
  const POL_G = V3(-0.55, -0.8, -0.25).normalize();
  const EXTRA_G = [0, 0.05, 0.4, 0.5];
  const extraG = [0, 0, 0, 0];
  // Glasögonen på sin plats vid t, och höger hand i dem när han håller dem (motA). → fingrarnas extra, eller null
  function glasArm(t, kl, Sk, a) {
    const G = kl && kl.glas;
    const iFickan = glasLage(t, G);
    const s = (x, d) => (G && G[x] ? spar(G[x], t) : d);
    const fall = s('fall', G ? 1 : 0);
    glas.satt(gW, fall, clamp(fall * 1.15 - 0.15), 1 - iFickan);
    const mot = s('motA', 0);
    if (mot <= 0) return null;
    if (s('finger', 0) > 0.5) {
      // pekfingertoppen på bryggan
      gq.copy(FINGER.p).applyMatrix4(gW);
      gF.copy(FINGER.F).transformDirection(gW);
      gP.copy(FINGER.P).transformDirection(gW);
      gH.copy(gq).addScaledVector(gF, -FINGER.L).addScaledVector(gP, -FINGER.U);
    } else if (s('sido', 0) > 0.5) {
      gq.copy(SIDO.p).applyMatrix4(gW);
      cA.copy(SIDO.A).transformDirection(gW);
      gF.copy(SIDO.F).transformDirection(gW);
      gP.copy(SIDO.P).transformDirection(gW);
      gH.copy(gq).addScaledVector(cA, GREPP.x).addScaledVector(gF, -GREPP.y).addScaledVector(gP, -GREPP.z);
    } else {
      // tummen och pekfingret om hörnet (som cigarren, cigarrSatt)
      gq.copy(NYP.p).applyMatrix4(gW);
      pose(gp, gq, gF.copy(NYP.A).transformDirection(gW), gP.copy(NYP.P).transformDirection(gW));
      cA.set(0, 1, 0).applyQuaternion(gp.q);
      gF.set(1, 0, 0).applyQuaternion(gp.q);
      gP.set(0, 0, 1).applyQuaternion(gp.q);
      gH.copy(gp.p).addScaledVector(cA, GREPP.x).addScaledVector(gF, -GREPP.y).addScaledVector(gP, -GREPP.z);
    }
    cPol.fromArray(VILA_A[1]).normalize().lerp(POL_G, mot);
    naturlig(Sk, gH, gF, gP, 1, cPol, cPol);
    // på vägen dit: bakåt först, sedan in och upp, så att handen går bakom tidningen och längs disken
    const fz = ss(0, 0.45, mot);
    const fx = ss(0.25, 0.9, mot);
    const fy = ss(0.3, 1, mot);
    a.w.set(a.w.x + (cW.x - a.w.x) * fx, a.w.y + (cW.y - a.w.y) * fy, a.w.z + (cW.z - a.w.z) * fz);
    // (handen vänds tidigt, så att fingrarna inte går genom tidningen medan handen går in bakom den)
    const fv = ss(0, 0.5, mot);
    a.pol.normalize().lerp(cPol, fv);
    a.F.lerp(gF, fv);
    a.P.lerp(gP, fv);
    a.krok += (s('krok', 0.55) - a.krok) * mot;
    a.peka += (s('peka', 0) - a.peka) * mot;
    bortA = Math.max(bortA, mot);
    const g = mot * (1 - s('peka', 0));
    for (let i = 0; i < 4; i++) extraG[i] = EXTRA_G[i] * g;
    return extraG;
  }

  // ---------- kaffet ----------
  // Det är koppen som styr, som med cigarren: dess läge räknas fram och handen sitter i örat med samma
  // grepp hela vägen, fingrarna mot koppen, pekfingret genom örat, tummen ovanpå och handflatan mot
  // honom. Lägena: på fatet; vid läppen, lite lägre (lyft) och under näsan i huvudets mått, så att
  // koppen följer med när han lutar huvudet bakåt; under hakan, en bit ned från munnen (ah), framför
  // bröstet och upplyft mot en (skal) i kroppens. Klippets kaffe: lägena (kk), lutningen mot läppen
  // (tipp, radianer: koppen vrids runt kanten mot hans underläpp, så att den ligger kvar där medan han
  // dricker), lillfingret ut (lill), armbågen ut (arm), koppen i små cirklar (snurr), när armen går
  // dit och tillbaka (mot), fingrarna (krok) och ångan (rok).
  const KUP = V3(KOPP[0], KOPP[1] + 11, KOPP[2]);
  // kanten: höjden och radien, och kanten mot honom i koppens mått (örat åt +x, han åt −z)
  const KH = 113;
  const KR = 62;
  const NARA = V3(0, KH, -KR);
  // greppet i koppens mått: fingrarna, handflatan och handleden (örat vid fingrarnas första led)
  const GF = V3(-1, 0.12, 0.3).normalize();
  const GP = V3(0.1, -0.3, -1).normalize();
  // handens origo (26 bortom handleden), i handens skala, med pekfingret i örats övre del så att handen
  // inte går ned i disken när koppen står på fatet
  const GH = K.ORA.clone().add(V3(0, 24, 0)).addScaledVector(GF, -151 * HAND.SK);
  // Vid fatet pekar örat bort från honom: med greppet ovan skulle handen sitta i rät vinkel mot
  // underarmen. Där håller han det bakifrån, med fingrarna genom örat och tummen ovanpå (greppet vridet
  // GREPP_FAT runt örat), och handen vrids till greppet medan han lyfter koppen.
  const GREPP_FAT = 73 * DEG;
  const GREPP_LYFT = 480;
  const qG = new THREE.Quaternion();
  // armbågen: nedåt och utåt, och ut åt sidan (arm)
  const POLK = V3(0.5, -0.82, 0.2).normalize();
  const POLK_UT = V3(0.9, -0.45, 0.1).normalize();
  // ett läge ur botten p, axeln A (botten mot kanten) och örat åt H
  function koppPose(ut, p, A, H) {
    pA_.copy(A).normalize();
    pF_.copy(H).addScaledVector(pA_, -H.dot(pA_)).normalize();
    pP_.crossVectors(pF_, pA_);
    mq.makeBasis(pF_, pA_, pP_);
    ut.q.setFromRotationMatrix(mq);
    ut.p.copy(p);
    return ut;
  }
  // vid läppen: kanten mot honom dy och dz från underläppen, koppen lutad v mot honom
  const LAPP = W_(662, 530, 0);
  LAPP.z = djup(662, 530) + 4;
  function vidLappen(dy, dz, v) {
    const A = V3(0, Math.cos(v), -Math.sin(v));
    const N = V3(0, -Math.sin(v), -Math.cos(v));
    return { p: LAPP.clone().add(V3(0, dy, dz)).addScaledVector(A, -KH).addScaledVector(N, -KR), A, H: V3(1, 0, 0.6) };
  }
  const KHUV = { mun: vidLappen(0, 0, 0.35), lyft: vidLappen(-55, 45, 0.25), nasa: vidLappen(26, 34, 0.06) };
  const KKROPP = {
    hake: vidLappen(-160, 150, 0.1),
    ah: vidLappen(-150, 130, 0.15),
    brost: { p: V3(70, -10, 480), A: V3(0, 1, -0.3), H: V3(1, 0, 0.45) },
    skal: { p: V3(250, 330, 620), A: V3(0.05, 1, 0.3), H: V3(1, 0, -0.3) },
  };
  const KP = { fat: koppPose(nyPose(), KUP, V3(0, 1, 0), V3(Math.cos(0.5), 0, Math.sin(0.5))) };
  for (const n of [...Object.keys(KHUV), ...Object.keys(KKROPP)]) KP[n] = nyPose();
  const kA = v();
  const kH = v();
  const kp_ = v();
  function kaffeLagen() {
    for (const [n, l] of Object.entries(KHUV)) koppPose(KP[n], iHuvud(l.p, kp_), riktH(l.A, kA), riktH(l.H, kH));
    for (const [n, l] of Object.entries(KKROPP)) koppPose(KP[n], kp_.copy(l.p).applyMatrix4(mk), kA.copy(l.A).transformDirection(mk), kH.copy(l.H).transformDirection(mk));
  }
  const qT = new THREE.Quaternion();
  const VRID_K = 0.5;
  function kaffeLage(t, ut, c) {
    const KK = c.kk;
    let i = 1;
    while (i < KK.length - 1 && t > KK[i][0]) i++;
    const f = ss(KK[i - 1][0], KK[i][0], t);
    const a = KP[KK[i - 1][1]];
    const b = KP[KK[i][1]];
    ut.p.lerpVectors(a.p, b.p, f);
    ut.p.y += (KK[i][2] || 0) * Math.sin(f * Math.PI);
    ut.q.slerpQuaternions(a.q, b.q, f);
    // lutad mot läppen, runt kanten mot honom; örat vrids samtidigt in mot kinden (runt koppens axel,
    // så att koppen står kvar), annars stiger handen upp framför ögat
    const fi = spar(c.tipp, t);
    if (fi) {
      kH.set(1, 0, 0).applyQuaternion(ut.q);
      kp_.copy(NARA).applyQuaternion(ut.q).add(ut.p);
      qT.setFromAxisAngle(kA.set(0, 1, 0).applyQuaternion(ut.q), VRID_K * Math.min(1, fi));
      ut.q.premultiply(qT);
      qT.setFromAxisAngle(kH, -fi);
      ut.q.premultiply(qT);
      ut.p.sub(kp_).applyQuaternion(qT).add(kp_);
    }
    const sn = spar(c.snurr, t);
    if (sn) {
      ut.p.x += sn * 16 * Math.cos(t * 13);
      ut.p.z += sn * 16 * Math.sin(t * 13);
    }
    return ut;
  }
  const kp = nyPose();
  const kPol = v();
  const extraK = [0, 0, 0, 0, 0, 0, 0, 0];
  function kaffeArm(t, b, c) {
    kaffeLagen();
    kaffeLage(t, kp, c);
    kopp.position.copy(kp.p);
    kopp.quaternion.copy(kp.q);
    kopp.updateMatrix();
    // på väg dit, och kvar medan han håller
    const [m0, m1, m2, m3] = c.mot;
    const mot = ss(m0, m1, t) * (1 - ss(m2, m3, t));
    bortB = mot;
    // handen i örat, och armbågen där handleden ser naturlig ut (naturlig): nedåt och utåt, och ut åt
    // sidan (arm) så långt det behövs
    qG.setFromAxisAngle(UPP, GREPP_FAT * (1 - ss(0, GREPP_LYFT, kp.p.y - KUP.y)));
    kp_.copy(GH).sub(K.ORA).applyQuaternion(qG).add(K.ORA).applyQuaternion(kp.q).add(kp.p);
    kH.copy(GF).applyQuaternion(qG).applyQuaternion(kp.q);
    kA.copy(GP).applyQuaternion(qG).applyQuaternion(kp.q);
    kPol.copy(POLK).lerp(POLK_UT, spar(c.arm, t));
    naturlig(sb, kp_, kH, kA, -1, kPol, kPol);
    b.w.fromArray(VILA_B[0]).lerp(cW, mot);
    // örat sitter på andra sidan koppen: handen går upp och över den, en bit fram (förut gick den rakt
    // genom koppen och fatet)
    const bue = 4 * mot * (1 - mot);
    b.w.y += 175 * bue;
    b.w.z += 45 * bue;
    // (vilans riktning som enhetsvektor, annars tar den nya över först på slutet)
    b.pol.fromArray(VILA_B[1]).normalize().lerp(kPol, mot);
    b.F.fromArray(VILA_B[2]).lerp(kH, mot);
    b.P.fromArray(VILA_B[3]).lerp(kA, mot);
    b.krok = VILA_B[4] + (spar(c.krok, t) - VILA_B[4]) * mot;
    b.peka = 0;
    // lillfingret rakt ut och ut från de andra, och ringfingret lite
    const l = spar(c.lill, t) * mot;
    if (!l) return null;
    extraK[2] = -0.3 * b.krok * l;
    extraK[3] = -(b.krok + 0.25) * l;
    extraK[6] = -5 * l;
    extraK[7] = -18 * l;
    return extraK;
  }
  // röken: glöden ryker hela tiden (mer när han drar), och han blåser ut röken: genom munnen (blas), i
  // en stråle ur mungipan (strale), i ringar (ring) eller genom näsan (nasa). Askan faller när han
  // knackar av den (aska), och ur kaffet stiger ånga (anga, blas: han blåser bort den).
  const fot0 = v();
  const rv = v();
  const rd = v();
  const rm = v();
  const rj = v();
  let rokN = null;
  let rokSkuld = 0;
  let eldSkuld = 0;
  const skuld = new Map();
  // (snett uppåt åt hans vänstra sida och fram, så att den far förbi ansiktet och inte stannar framför det)
  const BLAS = new THREE.Vector3(0.9, 0.32, 0.3).normalize();
  const PUFF = new THREE.Vector3(0.35, 0.28, 0.9).normalize();
  const MUNHORN = W_(680, 511, 0);
  MUNHORN.z = djup(680, 511);
  // (strålen åt hans vänstra sida, ringarna uppåt framåt, näsan nedåt framåt)
  const STRALE = V3(0.85, 0.3, 0.45).normalize();
  const RINGEN = V3(0.86, 0.36, 0.36).normalize();
  const NASAN = [W_(645, 476, 0), W_(679, 476, 0)].map((p) => { p.z = djup(p.x + 660, 900 - p.y) + 4; return p; });
  const NASDIR = V3(0.42, -0.74, 0.52).normalize();
  // (ångan han blåser bort från koppen: åt hans vänstra sida och uppåt, så att den syns framifrån)
  const ANGA = V3(0.82, 0.4, 0.4).normalize();
  const UPP = V3(0, 1, 0);
  const ru = v();
  const rw = v();
  let rokT = null;
  let nasa = 0;
  // en rökring: partiklar i en cirkel runt munnen, som far iväg och vidgar sig
  function ring(c, d) {
    ru.crossVectors(d, UPP);
    if (ru.lengthSq() < 1e-4) ru.set(1, 0, 0);
    ru.normalize();
    rw.crossVectors(d, ru);
    const N = 28;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      rj.copy(ru).multiplyScalar(Math.cos(a)).addScaledVector(rw, Math.sin(a));
      rm.copy(c).addScaledVector(rj, 6).addScaledVector(d, 10);
      rv.copy(d).multiplyScalar(330).addScaledVector(rj, 85).add(rd.set(slump(), slump(), slump()).multiplyScalar(5));
      rok.slapp(rm, rv, { liv: 4, r0: 5, r1: 20, a: 0.42, broms: 1, lyft: 6, sort: 1, virv: 0.1, inn: 0.06 });
    }
  }
  const slump = () => Math.random() - 0.5;
  function roken(n, t, glod, kl, tand = 1) {
    const dt = rokN === null ? 0 : clamp(n - rokN, 0, 0.1);
    rokN = n;
    const t0 = rokT === null ? t : rokT;
    rokT = t;
    const c = kl && kl.cig;
    if (dt > 0) {
      // en tunn tråd ur glöden, utspridd längs vägen om cigarren rör sig (inte när den har slocknat: ute)
      rokSkuld += c && c.ute ? 0 : dt * (14 * tand + 34 * glod);
      const k = Math.floor(rokSkuld);
      rokSkuld -= k;
      for (let i = 0; i < k; i++) {
        rm.lerpVectors(fot0, fot, (i + 1) / k);
        rok.slapp(rm, rv.set(slump() * 4, 26 + slump() * 8, slump() * 4), { liv: 3.4, r0: 1.7, r1: 22, a: 0.2, lyft: 16 });
      }
      // stickan som ryker när han har skakat ut den, och svavelröken när den flammar upp
      const el = kl && kl.eld;
      if (el && t < el.slapp + 2) {
        const ry = spar(el.ryk, t);
        eldSkuld += dt * 26 * ry;
        for (; eldSkuld >= 1; eldSkuld--) rok.slapp(eTopp, rv.set(slump() * 5, 20 + slump() * 8, slump() * 5), { liv: 2.2, r0: 1.2, r1: 12, a: 0.22, lyft: 14, sort: 1, virv: 0.5 });
        for (const r of el.rok) {
          if (r.t <= t0 || r.t > t) continue;
          for (let i = 0; i < 9; i++) rok.slapp(eTopp, rv.set(slump() * 60, 30 + slump() * 40, slump() * 60), { liv: 1.3, r0: 3, r1: 26, a: 0.16, broms: 1.6, lyft: 30, sort: 1, virv: 0.6 });
        }
      }
      const listor = [c && c.rok, kl && kl.kaffe && kl.kaffe.rok];
      for (const l of listor) if (l) for (const r of l) {
        // på en gång: en ring, eller askan som faller
        if (r.sort === 'ring' || r.sort === 'aska') {
          if (r.t <= t0 || r.t > t) continue;
          if (r.sort === 'ring') ring(iHuvud(MUND, rm).clone(), riktH(RINGEN, rd).clone());
          else for (let i = 0; i < 12; i++) rok.slapp(fot, rv.set(slump() * 50, -25 + slump() * 30, slump() * 50), { liv: 0.5, r0: 3.2, r1: 4.2, a: 0.95, lyft: -360, sort: 1, virv: 0, inn: 0.01 });
          continue;
        }
        if (t <= r.fran || t >= r.till) continue;
        // en liten pust mellan blossen i mungipan, ångan ur kaffet, och annars ut med röken, mest i början
        const sort = r.sort;
        const takt = sort === 'pust' ? 40 : sort === 'anga' ? r.styrka : r.styrka * Math.exp(-(t - r.fran) * r.avtag);
        const s = (skuld.get(r) || 0) + dt * takt;
        const kb = Math.floor(s);
        skuld.set(r, s - kb);
        if (!kb) continue;
        if (sort === 'anga') {
          // ur koppens yta; när han blåser far den bort från honom, och när han drar in doften mot näsan
          if (r.sug) iHuvud(NASAN[0], rd).add(iHuvud(NASAN[1], ru)).multiplyScalar(0.5);
          for (let i = 0; i < kb; i++) {
            rm.set(0, 118, 0).applyQuaternion(kopp.quaternion).add(kopp.position).add(rj.set(slump() * 50, 0, slump() * 50));
            if (r.blas) rv.copy(ANGA).multiplyScalar(150 + slump() * 40).add(rj.set(slump() * 30, slump() * 30, slump() * 30));
            else if (r.sug) rv.subVectors(rd, rm).multiplyScalar(2.2).add(rj.set(slump() * 12, slump() * 12, slump() * 12));
            else rv.set(slump() * 10, 34 + slump() * 12, slump() * 10);
            rok.slapp(rm, rv, { liv: r.blas ? 1.5 : 2.4, r0: r.blas ? 12 : 10, r1: r.blas ? 60 : 44, a: r.blas ? 0.2 : 0.13, broms: 1.3, lyft: 22, sort: 1, virv: 0.8, inn: 0.15 });
          }
          continue;
        }
        const pust = sort === 'pust';
        const strale = sort === 'strale';
        const nas = sort === 'nasa';
        if (!nas) {
          iHuvud(pust || strale ? MUNHORN : MUND, rm);
          riktH(pust ? PUFF : strale ? STRALE : BLAS, rd);
        } else riktH(NASDIR, rd);
        for (let i = 0; i < kb; i++) {
          if (nas) iHuvud(NASAN[nasa++ % 2], rm);
          if (pust) rv.copy(rd).multiplyScalar(35).add(rj.set(slump(), slump(), slump()).multiplyScalar(14));
          else if (strale) rv.copy(rd).multiplyScalar(230 + slump() * 40).add(rj.set(slump(), slump(), slump()).multiplyScalar(16));
          else if (nas) rv.copy(rd).multiplyScalar(175 + slump() * 40).add(rj.set(slump(), slump(), slump()).multiplyScalar(18));
          else rv.copy(rd).multiplyScalar((420 + slump() * 80) * (r.fart ?? 1)).add(rj.set(slump(), slump(), slump()).multiplyScalar(50 * (r.fart ?? 1)));
          rok.slapp(rm, rv, pust ? { liv: 2.2, r0: 3, r1: 28, a: 0.12, broms: 1.2, lyft: 15, sort: 1, virv: 0.7 }
            : strale ? { liv: 2.8, r0: 3, r1: 48, a: 0.12, broms: 1.5, lyft: 20, sort: 1, virv: 0.6, inn: 0.15 }
              : nas ? { liv: 2.4, r0: 2.5, r1: 42, a: 0.1, broms: 1.0, lyft: 26, sort: 1, virv: 0.6, inn: 0.25 }
                : { liv: 3.2, r0: 3, r1: 64, a: 0.1, broms: r.broms ?? 1.25, lyft: r.lyft ?? 30, sort: 1, virv: 0.7, inn: 0.25 });
        }
      }
    }
    fot0.copy(fot);
    rok.steg(dt, n, BORD.Y);
  }

  // Huvudet vänt mot kameran (rum-hasse-scen.js, VRID): ansiktet ses nästan rakt framifrån.
  const YAW0 = SCEN.VRID * DEG + 0.04;
  // Leendet han alltid har, i vilan och när han pratar: nöjd och säker på sin sak, och lite överdrivet
  // (kisandet följer leendet, så att det når ögonen). Det viker undan när han drar ned brynen, som när
  // han blir allvarlig före ett slag: man ler inte och rynkar pannan på en gång. Förut log han 0,14 i
  // vilan och 0,24 när han pratade, med ett svagare leende i skuggaren (ändrat 2026-11-06).
  const NOJD = 0.5;
  let sistaT = 0;
  let sistaN = 0;
  // T: var i rörelserna (0–2,5 vilan, 2,5–5,5 fram till domen, 5,5–9,95 gesterna
  // medan han pratar, hemåt till 12,4, sedan klippen i KLIPP), n: klockan för det som alltid rör sig,
  // tal: 1 medan han pratar med händerna vilande, mun: hur mycket munnen rör sig
  // (annars följer den tal och gesterna)
  function rita(T, n, tal = 0, mun = null) {
    const t = T;
    sistaT = T; sistaN = n;
    const kl = aktivt(t);
    // klippets skillnad mot vilan, och huvudet, kroppen och brynen
    const d = (x) => (kl && kl.d[x] ? spar(kl.d[x], t) : 0);
    const kan = (x) => spar(HUV[x], t) + d(x);
    const skratt = ss(2.75, 3.05, t) * (1 - ss(4.25, 4.6, t));
    const talar = Math.max(tal, ss(5.55, 5.7, t) * (1 - ss(9.4, 9.6, t)));
    const dricker = d('dricker');
    // cigarren: i munnen, och när han blåser ut
    const cc = kl && kl.cig;
    const iMun = cc ? spar(cc.iMun, t) : 0;
    const blaser = cc ? spar(cc.blaser, t) : 0;
    const glod = cc ? spar(cc.glod, t) : 0;
    const yaw = YAW0 + 0.22 * (kan('yaw') + 0.1 * drift(n, 0.8, 0.37, 1.33) * (1 - iMun * 0.6) + talar * 0.28 * Math.sin(n * 2.7 + 1));
    const pitch = 0.17 * (kan('pitch') + 0.07 * drift(n, 0.53, 0.23, 0.97) + talar * 0.3 * Math.sin(n * 6.1) + skratt * 0.16 * Math.sin(n * 15) - dricker * 1.15);
    const roll = -(kan('roll') + 0.012 * drift(n, 0.29, 0.61, 0.13) + talar * 0.03 * Math.sin(n * 3.3));
    eu.set(pitch, yaw, roll, 'YXZ');
    mh.makeRotationFromEuler(eu);
    U.uHuvud.value.setFromMatrix4(mh);
    const lut = kan('lut');
    const vrid = kan('vrid') + talar * 0.015 * Math.sin(n * 2.1);
    const sid = kan('sid') + 0.003 * Math.sin(n * 0.55);
    eu.set(lut, vrid, sid, 'YXZ');
    mr.makeRotationFromEuler(eu);
    mk.copy(mr);
    h1.copy(HOFT).applyMatrix4(mr);
    mk.setPosition(HOFT.x - h1.x, HOFT.y - h1.y, HOFT.z - h1.z);
    U.uKropp.value.copy(mk);
    const axV = kan('axV') + skratt * 5 * Math.sin(n * 15);
    const axH = kan('axH') + skratt * 5 * Math.sin(n * 15);
    U.uAx.value.set(axV, axH);
    U.uAndas.value = andning(n) + d('andas') + skratt * 5 * Math.sin(n * 15);
    const lyft = talar * 0.38 * Math.max(0, Math.sin(n * 4.3));
    U.bryn.value.set(kan('brynX') + lyft, kan('brynY') + lyft);
    // (nöjd, utom när brynen dras ned)
    const allvar = clamp(-(d('brynX') + d('brynY')) * 0.7);
    U.le.value = Math.max(NOJD * (1 - allvar) * (1 - d('stel')), skratt, 0.6 * ss(10, 10.5, t) * (1 - ss(11.6, 12.4, t)), d('le'));
    // talet: stavelser med små pauser, ibland rundare läppar; läpparna skiljs åt hela tiden han pratar och
    // öppnas upp till en dryg centimeter (förut knappt en halv, så att han såg ut att mumla)
    const stav = Math.abs(Math.sin(n * 7.3)) * (0.42 + 0.58 * ss(-0.35, 0.5, Math.sin(n * 2.3 + 0.7))) * (0.72 + 0.28 * Math.sin(n * 17.3));
    const talMun = (mun === null ? talar : mun) * (1 - dricker) * (1 - Math.max(iMun, blaser));
    // läpparna om cigarren, en pust mellan blossen och ett o när han blåser ut
    const puff = cc ? spar(cc.pust, t) : 0;
    U.munn.value = Math.max(talMun * (0.06 + 0.8 * stav), skratt * (0.92 + 0.14 * Math.sin(n * 14)), ss(4.9, 5.0, t) * (1 - ss(5.0, 5.25, t)) * 0.72, iMun * (0.15 + 0.12 * puff), blaser * (0.27 + 0.05 * Math.sin(n * 7)), d('munn'));
    U.rund.value = talMun * Math.max(0, Math.sin(n * 3.1 + 1.3)) * 0.8;
    U.kis.value = Math.max(skratt * 0.75, U.le.value * 0.35, d('kis'));
    // blinkningarna och blicken som flyttar sig lite (blinkar, sakkader)
    const bl = blinkar(n);
    const sk = sakkader(n);
    U.rund.value = Math.max(U.rund.value, dricker * 0.7, iMun * 0.85, blaser, d('rund'));
    U.blund.value = Math.max(dricker * 0.82, skratt * 0.42, bl, ss(10.7, 10.9, t) * (1 - ss(11.25, 11.45, t)), d('blund'));
    U.blick.value.set(4 * clamp((yaw - YAW0) / 0.2, -1, 1) + d('blickX') + sk[0], d('blickY') + sk[1]);
    sa.copy(SA);
    sa.y += axV;
    sa.x -= axV * 0.25;
    sa.applyMatrix4(mk);
    sb.copy(SB);
    sb.y += axH;
    sb.x += axH * 0.25;
    sb.applyMatrix4(mk);
    const a = nyckel(VA, t, na);
    const b = nyckel(VB, t, nb);
    // det som står på disken, om han har slagit i den
    hoppar(t);
    // cigarren ligger i askkoppen, eller i hans hand
    let extraA = null;
    bortA = 0;
    bortB = 0;
    const pc = kl && kl.pen;
    if (pc) extraA = pennArm(t, sa, a, { n: pc.n, fran: kl.fran });
    else if (KPG.synlig) {
      // pennan ligger på kupongen
      pp(KPG.vila.x, KPG.vila.y, PENNA.R + 0.5, tipp);
      pB.makeRotationFromQuaternion(qV).setPosition(tipp);
      pen.mesh.matrix.copy(pB);
      pen.mesh.matrixWorldNeedsUpdate = true;
    }
    pen.mesh.visible = KPG.synlig;
    if (cc) extraA = cigarrArm(t, sa, a, cc);
    else {
      cigarrLage(0, cp, null);
      cp.p.y += HOPP.cig;
      cigarrSatt(cp);
    }
    ask.mesh.position.y = ASK[1] + HOPP.ask;
    // elden: stickan eller tändaren i handen, och lågan
    const el = kl && kl.eld;
    if (el) extraA = eldArm(t, n, sa, a, el, extraA) || extraA;
    else {
      sticka.mesh.visible = false;
      tandVilar();
      laga.satt(eTopp, E_UPP, 0, 0, 0, 0, n);
      bord.eld.value.w = 0;
      stall.antal(ELD.kvar);
      eT0 = null;
    }
    branda.antal(ELD.branda);
    // tänd eller slocknad: när han tänder den följer det klippet, annars tonar glöden och röken sakta ut när
    // den slocknar (ELD.mal 0)
    const dn = ELD.n === null ? 0 : clamp(n - ELD.n, 0, 0.5);
    ELD.n = n;
    ELD.tand += clamp(ELD.mal - ELD.tand, -dn / 25, dn / 25);
    const tandNu = cc && cc.tand ? spar(cc.tand, t) : cc && cc.ute ? 0 : ELD.tand;
    cig.U.uTand.value = tandNu;
    cig.U.uGlod.value = glod;
    cig.U.uTid.value = n;
    const kaffe = kl && kl.kaffe;
    const extraB = kaffe ? kaffeArm(t, b, kaffe) : null;
    // tidningen: i hans händer under klippen lasa, annars borta
    if (kl && kl.las) {
      tidning.visa(kl.tidning);
      tidningArm(t, n, kl, a, b);
    }
    else tidning.mesh.visible = false;
    // glasögonen: i fickan, på näsan eller i höger hand
    const gx = glasArm(t, kl, sa, a);
    if (gx) extraA = gx;
    U.uLins.value.set(LINS.styrka, LINS.y);
    const isar = ss(2.5, 3, t) * (1 - ss(4.3, 4.8, t));
    if (t > 5.95 && t < 8.15) {
      const k = Math.sin(n * 6.6) * ss(5.95, 6.15, t) * (1 - ss(7.95, 8.15, t));
      a.w.y += k * 34;
      a.w.x += k * 10;
      a.F.z += k * 0.25;
    }
    a.w.y += skratt * 7 * Math.sin(n * 15);
    b.w.y += skratt * 7 * Math.sin(n * 15 + 1);
    const fA = kl && kl.fA;
    const fB = kl && kl.fB;
    if (fA) svang(fA, t, a);
    if (fB) svang(fB, t, b);
    ik(sa, a.w, a.pol, E_, Wr_);
    // fingrarna trummar bara i vilan, med den ena eller den andra handen
    const iVila = t < 2.5 || (t > 9.95 && t < 20);
    const trumA = iVila && trumHand === 'A' ? trummar(n) : extraA;
    const trumB = iVila && trumHand === 'B' ? trummar(n) : extraB;
    // (fingrarna samlade och tummen i vilan, utom när handen tar något och när han skrattar)
    const vA = (1 - isar) * (1 - bortA);
    const vB = (1 - isar) * (1 - bortB);
    if (fA) A.satt(sa, E_, Wr_, a.F, a.P, a.krok, a.peka, spar(fA.spar, t), spar(fA.tumme, t), handForm(fA, t, exA));
    else A.satt(sa, E_, Wr_, a.F, a.P, a.krok, a.peka, isar + SAMLA.A * vA, TUMME + (TUMME_VILA.A - TUMME) * vA, trumA);
    U.uArm.value[0].copy(sa); U.uArm.value[1].copy(E_); U.uArm.value[2].copy(Wr_);
    ik(sb, b.w, b.pol, E_, Wr_);
    if (fB) B.satt(sb, E_, Wr_, b.F, b.P, b.krok, b.peka, spar(fB.spar, t), spar(fB.tumme, t), handForm(fB, t, exB));
    else B.satt(sb, E_, Wr_, b.F, b.P, b.krok, b.peka, isar * 0.8 + SAMLA.B * vB, TUMME + (TUMME_VILA.B - TUMME) * vB, trumB);
    U.uArm.value[3].copy(sb); U.uArm.value[4].copy(E_); U.uArm.value[5].copy(Wr_);
    // koppen och fatet hoppar när han slår i disken
    K.fat.position.y = KOPP[1] + 0.5 + HOPP.fat;
    if (!kaffe) {
      const h = Math.max(HOPP.kopp, HOPP.fat);
      kopp.position.set(KOPP[0], KOPP[1] + 11 + h, KOPP[2]);
      kopp.rotation.set(0, -0.5, h * 0.0045);
    }
    // skuggorna: hand och underarm för båda armarna, och koppen
    const skk = (i, p, q, rd, h) => { kapA[i].set(p.x, p.z, q.x, q.z); kapH[i].set(rd, Math.max(0, h)); };
    const ah = (o) => o.y - BORD.Y;
    const LA_ = A.lage;
    const LB_ = B.lage;
    const HS = HAND.SK / 0.92;
    FA.copy(LA_.W).addScaledVector(LA_.F, 170 * HS);
    skk(0, LA_.W, FA, 50 * HS, ah(LA_.W) - 24);
    skk(1, LA_.E, LA_.W, 70, (ah(LA_.E) + ah(LA_.W)) / 2 - 20);
    FA.copy(LB_.W).addScaledVector(LB_.F, 170 * HS);
    skk(2, LB_.W, FA, 50 * HS, ah(LB_.W) - 24);
    skk(3, LB_.E, LB_.W, 70, (ah(LB_.E) + ah(LB_.W)) / 2 - 20);
    skk(4, kopp.position, kopp.position, 60, ah(kopp.position));
    skk(5, K.fat.position, K.fat.position, 96, 1 + HOPP.fat);
    skk(7, ASKV3, ASKV3, 92, 1 + HOPP.ask);
    skk(8, cX, fot, 14, Math.min(ah(cX), ah(fot)));
    eV[0].set(0, TANDARE.H / 2, 0).applyMatrix4(tand.mesh.matrix);
    skk(11, eV[0], eV[0], 30, ah(eV[0]) - TANDARE.D / 2 + 1);
    // tidningens nederkant, när han håller den ovanför disken
    kapH[9].set(0, 0);
    if (tidning.mesh.visible) {
      ytan(-1, 0, TS, tg0).applyMatrix4(tM);
      ytan(1, 0, TS, tg1).applyMatrix4(tM);
      const h = Math.min(ah(tg0), ah(tg1));
      if (h > -5) skk(9, tg0, tg1, 38, h);
    }
    roken(n, t, glod, kl, tandNu);
    r.render(S, C);
  }

  // Det som hörs mellan T0 och T1 (rum-hasse.js): slagen i disken, koppen som landar på fatet efter
  // dem, och när han ställer ned koppen. [{ typ: 'dunk' | 'klirr', styrka, sort }]
  function handelser(T0, T1) {
    const ut = [];
    const i = (t) => t > T0 && t <= T1;
    for (const [td, s, sort] of DUNK) {
      if (i(td)) ut.push({ typ: 'dunk', styrka: s, sort });
      for (const [dl, h] of landar(s)) if (i(td + dl)) ut.push({ typ: 'klirr', styrka: h });
    }
    for (const [tn, s] of NED) if (i(tn)) ut.push({ typ: 'klirr', styrka: s, mjuk: true });
    for (const [tl, e] of LJUD) if (i(tl)) ut.push({ ...e });
    return ut;
  }

  // Kameran: v är fönstret (W, H), var ögonhöjden står i det (cx, ey), s bildpunkter på en enhet på
  // avståndet 0, och dukens ruta (x, y, w, h), allt i fönstrets bildpunkter.
  function kamera(v) {
    Object.assign(duk.style, { left: `${v.x}px`, top: `${v.y}px`, width: `${v.w}px`, height: `${v.h}px` });
    r.setSize(v.w, v.h, false);
    skugga.material.uniforms.uRuta.value.set(v.w * r.getPixelRatio(), v.h * r.getPixelRatio(), r.getPixelRatio());
    C.fov = (2 * Math.atan(v.H / 2 / (v.s * D))) / DEG;
    C.aspect = v.W / v.H;
    C.setViewOffset(v.W, v.H, v.W / 2 - v.cx + v.x, v.H / 2 - v.ey + v.y, v.w, v.h);
    rita(sistaT, sistaN);
  }
  return {
    rita,
    kamera,
    diskBild,
    handelser,
    // fingrarna trummar en stund (bara i vilan), på ett av sätten i TRUM och med höger (A) eller vänster
    // hand (B); ror() medan de gör det
    trumma(sort = 'varv', hand = 'B') {
      if (sistaN - trumT < trumS[0] + 0.35) return;
      trumS = TRUM[sort] || TRUM.varv;
      trumPeka = sort === 'peka';
      trumHand = hand;
      trumT = sistaN + 0.05;
    },
    // Din kupong på disken, eller null när den inte ligger där: o, ex, ey (kupongens mått → världen),
    // vila: var pennan ligger { x, y, a } (spetsen, och riktningen mot änden i grader).
    kupong(k) {
      KPG.synlig = Boolean(k);
      if (!k) { pen.mesh.visible = false; return; }
      KPG.o.fromArray(k.o);
      KPG.ex.fromArray(k.ex);
      KPG.ey.fromArray(k.ey);
      KPG.vila = k.vila;
      const a = k.vila.a * DEG;
      KPG.vilaA.copy(KPG.ex).normalize().multiplyScalar(Math.cos(a)).addScaledVector(pX.copy(KPG.ey).normalize(), Math.sin(a)).normalize();
      pennQ(qV, KPG.vilaA, P_TA);
    },
    // Vad han ska skriva: [{ drag: [{ a, b, c }, { a, b, c }] }] med [x, y] i kupongens mått. → klippets
    // namn och tiderna för dragen, [[[t0, t1], [t0, t1]], …] i klippets tid.
    skriv(kryss) {
      const { bana, tider } = banan(kryss);
      KPG.bana = bana;
      KPG.kryss = kryss;
      return { klipp: `skriv${kryss.length}`, tider };
    },
    ror: () => sistaN - trumT < trumS[0] + 0.05,
    // Cigarren och elden (rum-hasse.js håller reda på dem): tand (true/false: tänd när den ligger i askkoppen;
    // slocknar den tonar glöden och röken ut, utom med direkt), kvar (stickor i stället) och branda (i askkoppen)
    cigarr(o) {
      if ('tand' in o) {
        ELD.mal = o.tand ? 1 : 0;
        if (o.direkt) ELD.tand = ELD.mal;
      }
      if (o.kvar != null) ELD.kvar = o.kvar;
      if (o.branda != null) ELD.branda = o.branda;
    },
    // Trycker dagens tidningar som han läser (dagens() i rum-hasse-tidning.js)
    tidning: (d) => tidning.tryck(d),
    info: () => ({ trianglar: r.info.render.triangles, ritanrop: r.info.render.calls, texturer: r.info.memory.textures }),
    ctx: r.getContext(),
    borta() {
      G.dispose();
      skuggGeo.dispose();
      K.borta();
      ask.borta();
      cig.borta();
      stall.borta();
      sticka.borta();
      branda.borta();
      tand.borta();
      laga.borta();
      pen.borta();
      tidning.borta();
      glas.borta();
      rok.borta();
      A.borta();
      B.borta();
      r.dispose();
      r.forceContextLoss();
    },
  };
}
