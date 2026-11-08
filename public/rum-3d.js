// Gänget i tobaksaffären (rum.js): DL, DT och DJ som leksaksfigurer i
// three.js. De sitter på barstolar runt barbordet framför fönstret med benen
// hängande, dricker Pripps Blå ur 90-talets flaskor (julöl och påsköl
// i sin tid), röker (glöden och röken som stiger) och pratar med händerna, i
// lugna loopar. Huvudena nickar efter musen.
// De byter plats vid bordet var tredje dag (PLATSER, placering): var och en
// får sin tur bakom bordet och på var sida, efter dagen i Stockholm, så att
// alla ser samma sak och ingen flyttar sig medan sidan är öppen. Den som
// hamnar på andra sidan byter hand (sitt): flaskan och cigaretten är i
// handen mot bordet, och kupongen, pennan, lejonet och målen följer med.
// Figurerna är tobak-a7 v2: ansiktena (rum/ansikte-*.svg, ritade av
// ansikten.py), skulpterat hår, riktiga händer, kläddetaljer och blank vinyl,
// utan sockel.
//
// Världen: x = scenens x − 800, y = 400 − scenens y, z mot betraktaren;
// 1 enhet = 1 px i fönsterbänkens plan (kameran 1400 px bort, som scenens
// perspektiv). Allt rör sig efter klockan t (sekunder): samma t ger samma bild,
// också röken, som räknas fram för varje rökbloss ur var glöden var när det
// föddes.
//
// Den som inte har lämnat in en öppen omgång sitter med kupongen och pennan i
// stället för flaskan och cigaretten, som står på bordet. Fem saker
// turas om (vanta.ordning): tuggar på pennan och kliar sig bakom örat med den,
// sneglar på ölen, otåliga ben, kikar ner mot pulten och håller upp kupongen
// mot lysröret och vänder på den. När kupongen är inne sätts pennan bakom
// örat, kupongen läggs upp och ner på bordet och handen tar flaskan
// eller cigaretten – först ett bloss eller en lång klunk, sedan de vanliga
// looparna.
//
// När spelstoppet närmar sig och omgången väntar på någon tittar de andra på
// hen, oftare ju närmare det är, och den sista timmen vänder de sig mot hen
// samtidigt – då tittar hen upp från kupongen.
//
// Den man klickar på blir den som fyller i kupongen (vald, rum-folk.js):
// figuren studsar till, lyfter kupongen mot en och sprattlar med benen medan
// de andra tittar på hen, och lutar sig sedan över kupongen och skriver ivrigt,
// rad för rad. (Handen med pennan räcks upp där tecknet inte tar den, ?rum-vald.)
//
// Klickar man på någon i gänget gör hen ett tecken mot en (tecken,
// rum-tecken.js): hang loose, tummen upp, peace och så vidare, ett nytt varje
// gång, med en hand med riktiga fingrar. Den som sover vaknar inte, men tummen
// kommer upp.
//
// När matcherna pågår vänder de sig mot tv:n (och tittar bort ibland). Vid
// ett mål reagerar var och en efter sitt eget tips: den som fick rätt lyfter
// flaskan eller näven, den som tappade raden tar sig för pannan och
// sjunker ihop, och den som inte påverkades nickar bara – eller (malV) med
// båda armarna i luften, båda händerna på huvudet eller handen i bordet.
//
// Humöret följer gängets kupong (spel, HUM): glada när den går bättre än
// väntat eller blev vinst, nervösa när nästa fel tar vinsten, deppiga när den
// är död. Ansiktena följer den också (ansikten, rum-uttryck.js), och mellan
// omgångarna hur den senaste gick (senast): jublar, glad, nöjd, sur eller
// deppig efter om det blev vinst och betyget. Humöret syns i hur de sitter
// och i påhitten (AKTER, MENY): korta
// rörelser som var och en gör då och då – händerna i nacken, naglarna, hakan i
// handen, armarna i kors, pannan i bordet … – och ibland tillsammans (GRUPP):
// skålar över bordet, sjunger (på fem sätt: gungar i takt, faller in efter en
// försångare, trummar i bordet, gör vågen och vajar med armarna, eller mot tv:n
// när matcherna pågår), skrattar åt ett skämt (med ögonen hopknipna och munnen
// öppen, skrattar), grälar medan den tredje tittar på, eller tittar upp på tv:n
// när någon pekar.
//
// Efter ett mål som gick någons väg sjunger de (malSang), och den som tappade
// raden sitter med armarna i kors. På fönsterbänken står en kassettradio: ett klick går
// fram till den (FM, AM och stationerna i rum-radio.js), och så länge den spelar musik
// dansar de (DANSER i rum-dans.js) och sjunger om vartannat (radioSang, radioNamn),
// med skyltarna på bordet.
//
// Inför matcherna korsar de sig ibland (KORS i rum-tecken.js, korsHand), oftare
// ju närmare nästa avspark det är: på sju olika sätt med högerhanden, och någon
// gång smittar det (korsaSmitta).
//
// Ibland går någon iväg (gaNu, stalle): kliver ner från barstolen, går ut ur
// bilden till vänster mot baren och kommer tillbaka och klättrar upp. Golvet
// ligger bakom pulten, så man ser bara överkroppen; stolen och det som står på
// bordet står kvar (gaFlytta). Duken går därför ut till scenens vänsterkant.
//
// DL och DJ blinkar (DT skrattar med ögonen stängda, utom när humöret ger
// honom öppna ögon), det röda ljuset från
// neonskylten bakom dem slocknar när skylten glappar, och medan matcherna
// pågår lyser tv:n blått i ansiktena.
//
// Var och en tittar dit hen pekar i rummet (pekar: den som har sidan öppen,
// rum-folk.js), och den man pekar på i gänget tittar på en och skålar (hej).
// På natten (natt) är lysröret släckt: DJ sover med huvudet på bordet, DT:s
// cigarett har brunnit ner och han nickar till, och DL tittar på text-tv.
// Dagen efter en omgång (efter) står en prinsesstårta på bordet och oraklet
// har en papperskrona när det gick bra, och när det gick illa ligger DT:s
// extraflaska omkullvält i en pöl och kupongen sönderriven i askkoppen.
// Runt högtiderna (rum-fest.js) klär de sig för dem: luciakrona och
// stjärngossestrutar, tomteluvor och jultröjor, sammetskavaj, fluga och
// partyhatt, påskkärringens huckle och midsommarens blomkrans.
//
// figurer(canvas, { calm, vader, detalj, spel, senast, rita }) → { draw(t, mx, my, neon), inne(vem, t), ute(vader),
// lage({ tv, nag }, t), mal({ dl: 1, dt: -1, dj: 0 }, t, sätt), radio(på, t), radioPa(), spel({ lage, rank, ansikte }, t),
// senast(lage), uttryck(),
// prova(vem, påhitt, at), ga(vem, t, l), pekar(vem, [x, y, z] | null, t),
// hej(vem, t, ut), vald(vem, t), tecken(vem, t, namn), lappar(vem, t), lappVand(vem, ner, t), lappProva(vem, hållning, gör, at), natt(på, t), efter({ lage, krona }), under(nx, ny), huvud(vem) }: neon säger om
// neonskylten lyser (false när den glappar), ute klär om gänget
// efter vädret (dress) och sätter ljuset från fönstret, lage säger om
// matcherna pågår (tv) och hur nära spelstoppet är (nag 0–1), mal ett mål
// (sätt: { dl: 0|1|2 }, annars efter tiden), radio sätter på radion eller stänger av den
// (radioPa: är den på?), spel hur det går för kupongen
// (lage 'glad' | 'nerv' | 'deppig' | null, rank { dl: 1, dj: -1 }, ansikte när
// allt är spelat), senast hur den senaste kupongen gick för ansiktena
// (rum-uttryck.js LAGEN, null = inget), uttryck ett löfte som är klart när
// ansiktena för läget är ritade (rita anropas då också), prova ett
// påhitt om och om igen för bilder (utan påhitt som vanligt), ga att vem går
// iväg från t − l (för bilder),
// pekar punkten i rummet som vem pekar på (världens koordinater, null = inget),
// hej att man pekar på vem (ut = när man slutade, Infinity = pekar fortfarande),
// vald att vem just valdes som den som fyller i kupongen, tecken att man
// klickade på vem (namn: vilket tecken, annars nästa),
// natt om lysröret är släckt, efter dagen efter (lage 'bra' | 'illa' | null,
// krona = oraklen, 'dl' …), under vem i gänget (eller 'radio') som syns i punkten
// och kval({ pr, skugga, detalj }) hur fint gänget ritas (KVAL i rum.js; detalj
// också från början)
// (nx, ny, −1…1 i duken) eller null, och huvud var vems huvud är.
import * as THREE from 'three';
import { utanSkuggor } from './rum-gpu.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ol } from './rum-fika.js';
import { festen, drakt, festklader } from './rum-fest.js';
import { TECKEN, LOS, blanda, nasta as nastaTecken, KORS, KORS_MENY, korsChans, LAPP_HALL, LAPP_GOR, LAPP_MENY, LAPP_GREPP, lappBlanda, lappKropp } from './rum-tecken.js';
import { uttryck, skaggUttryck, ansiktsLage } from './rum-uttryck.js';
import { DANSER, DANS_SLAG, DANS_IN, formen } from './rum-dans.js';

const DEG = Math.PI / 180;
const D = 1400;
const SILL = -168;
// Barbordet: runt, framför fönsterbänken, med skivan y över sitsarna
// (barstolarnas sitsar är i fönsterbänkens höjd, SILL).
const BORD = { x: -186, z: 250, r: 118, y: 32 };
// Pennkoppen på bordet (pennkopp): var den står i bordets axlar (x åt höger,
// z mot betraktaren) och bollens radie.
const KOPP = { x: -88, z: 30, r: 11 };
// Platserna runt bordet – till vänster, bakom och till höger: var barstolen
// står (x, z) och hur den är vriden in mot bordet (turn), armen mot bordet
// (inre; bakom vilar båda på bordet, och arm 0 har flaskan eller
// cigaretten) och armen som håller kupongen medan man väntar (kupong; pennan
// i den andra). På bordet, i stolens axlar (x åt figurens vänster, z framåt):
// flaskan (sak), askkoppen (aska), cigaretten som ligger där
// medan man väntar (cigg), kupongen när den är inne (lagg: x, z, vridning),
// handen som vilar på bordet (vila) och DT:s extraflaska (flaska); tomma: DJ:s
// tomflaskor på fönsterbänken (x och z i rummet och vinkeln, 0 = står) – bakom
// honom på sidorna och längst till höger när han sitter bakom bordet, där de syns.
// skylt: var skylten ligger på bordet när den är nere (lappar), i bordets axlar som
// KOPP, och hur den är vriden i grader.
const PLATSER = [
  { x: -338, z: 194, turn: 46, inre: 1, kupong: 1, sak: [47, 46], aska: [50, 62], cigg: [8, 58], lagg: [27.5, 52, 1.25], flaska: [80, 72],
    tomma: [[-412, 16, 0], [-442, 30, -1.45]], skylt: [-50, -2, 5] },
  { x: -186, z: 106, turn: 2, inre: 0, kupong: 1, sak: [-27, 47], aska: [-29.7, 45], cigg: [4, 58], vila: [24.3, 48.3], lagg: [28.4, 47.4, -0.25], flaska: [54.5, 56.1],
    tomma: [[40, 16, 0], [70, 30, 1.45]], skylt: [2, -52, -4] },
  { x: -38, z: 194, turn: -46, inre: 0, kupong: 0, sak: [-44.5, 43.2], aska: [-50, 62], cigg: [-2.1, 55.6], lagg: [-21, 52, 0.3], flaska: [-80, 72],
    tomma: [[40, 16, 0], [70, 30, 1.45]], skylt: [52, -4, -6] },
];
// Vem som sitter var: FIGS[i] sitter på PLATSER[(i + n) % 3]. De byter var
// tredje dag (dagen i Stockholm ur Vader.nu(), räknat från den 25 oktober
// 2026, då de satte sig vid bordet så som de står i FIGS);
// ?rum-plats=0|1|2 för bilder.
const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
function placering(v) {
  const q = new URLSearchParams(location.search).get('rum-plats');
  let n = Number(q);
  if (q == null || !Number.isFinite(n)) {
    const [ar, man, dag] = v ? [v.ar, v.manad, v.dag] : fDag.format(Date.now()).split('-').map(Number);
    n = (Date.UTC(ar, man - 1, dag) - Date.UTC(2026, 9, 25)) / 864e5 / 3;
  }
  return ((Math.floor(n) % 3) + 3) % 3;
}
const v3 = (a) => new THREE.Vector3(...a);
const sm = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
// 0 → 1 → 0 över [a, d] med kanterna [a, b] och [c, d]
const bump = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Blank vinyl (v2): hud, tyg, hår och skor.
const P0 = {
  hud: { roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.1, envMapIntensity: 0.7 },
  tyg: { roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.18, envMapIntensity: 0.6 },
  har: { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.08, envMapIntensity: 0.8 },
  sko: { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 },
};

const CHARS = {
  dl: { skin: '#f0c3a6', skin2: '#d99a82', blush: '#e9806e', hair: '#9b7048', hair2: '#caa070', hair3: '#5e4029', tee: '#26324f', tee2: '#1a2236', pants: 'shorts', trou: '#d8ccb0', trou2: '#c2b493', sock: '#1d1d1f', shoe: '#3a3d40', sole: '#e8762c', sole2: '#f1ece2', lace: '#e9e3d6' },
  dt: { skin: '#ecbc9c', skin2: '#d0957a', blush: '#e27e66', hair: '#7f5a40', hair2: '#b08a66', hair3: '#4e3424', tee: '#a9a98a', tee2: '#8d8c6e', pants: 'jeans', trou: '#2b3448', trou2: '#222a3a', cuff: '#4b5d80', sock: '#1d1d1f', shoe: '#ece8df', sole: '#c9c2b4', sole2: '#ddd6c8', lace: '#ffffff' },
  dj: { skin: '#e9b593', skin2: '#cd8f70', blush: '#d9765e', hair: '#4a3021', hair2: '#7a5236', hair3: '#2a1a11', tee: '#1c1c1e', tee2: '#0f0f10', pants: 'shorts', trou: '#e6dcc6', trou2: '#cfc4ab', sock: '#e8e4dc', shoe: '#3b3e44', sole: '#e26a4f', sole2: '#f1ece2', lace: '#2a2b2f' },
};

// Lagen: färgerna, ränderna och smeknamnen, och på halsduken och mössan
// sköldarna (ESPN:s bilder, rum/skold-*.png). DL håller på Nacional (vitt,
// blått och rött, Bolso), DT på Chelsea (kungsblått; lejonet är inte
// klubbens) och DJ på IFK Göteborg (blåvitt).
const LAG = {
  dl: { vit: '#f3eee3', bla: '#1d3683', rod: '#c4202e', skold: 'rum/skold-nacional.png' },
  dt: { bla: '#2456b8', mork: '#121c3a', vit: '#f1ede4' },
  dj: { bla: '#1a5cab', vit: '#f3f0e8', guld: '#d9b14e', skold: 'rum/skold-ifk.png' },
};

// Måtten ur v2 (alt7.py) och vad var och en gör: arm 0 är figurens högra
// (betraktarens vänstra) och arm 1 den vänstra. a/b = över- och underarm.
// Attiraljerna: DL en stickad halsduk, DT ett lejon på underarmen som håller
// cigaretten och DJ en randig mössa med tofs och märke (solglasögonen
// uppskjutna på den). Var de sitter och vilken arm som gör vad står inte här
// utan följer platsen (PLATSER, sitt): does är vad handen mot bordet och den
// andra handen gör. Som FIGS står sitter de på PLATSER i tur och ordning: DL
// till vänster, DT bakom bordet och DJ till höger.
// vanta: foten som trummar medan man väntar och i vilken ordning de fem
// sakerna kommer (förskjutna med fas, så att ingen gör samma sak som någon
// annan samtidigt).
// mal: handen som lyfts vid ett mål (jubel) och den som tas mot pannan (panna;
// DJ trycker flaskan mot pannan), efter vad den gör.
const FIGS = [
  { key: 'dl', tilt: -4, legs: 74, torso: 86, w: 50, depth: 30, neck: 12, neckR: 17, arm: 8.5, leg: 9, a: 42, b: 36,
    head: { rx: 56.7, ry: 70.65, rz: 54, hw: 63, hh: 78.5, cy: -5.5, taper: 0.06, noseY: 19, nose: [8, 7.6, 7.2], cheek: 0.08, ear: [0.15, 0.21, 0.16, 0.5] }, glasses: 0,
    hair: { style: 'krona', f: 41, s: 80, b: 135, temple: 17, templeW: 0.2, vol: 0.06, lift: 3, back: 0, n: 22, fine: 3, fineW: 0.32, g: 0.08, dark: 0.42, wob: 0.8, tip: 3, tipAt: 'fram', edge: 0.7, sideCut: 0.6, quiff: { dir: [0, 0.62, 0.78], h: 0.1, w: 0.3 } },
    halsduk: { text: 'BOLSO' }, does: ['flaska', 'vila'],
    vanta: { fot: 1, ordning: [0, 3, 1, 4, 2], fas: 0 },
    mal: { jubel: 'flaska', panna: 'vila' } },
  { key: 'dt', tilt: 3, legs: 60, torso: 78, w: 45, depth: 28, neck: 11, neckR: 15, arm: 8, leg: 9.5, a: 39, b: 35,
    head: { rx: 50.16, ry: 75.33, rz: 52, hw: 57, hh: 81, cy: -5, taper: 0.25, noseY: 17, nose: [6, 10, 7], cheek: 0.03, noseRot: -0.35 }, glasses: 36,
    hair: { style: 'bakat', f: 44, s: 96, b: 156, temple: 6, vol: 0.12, lift: 6, back: 12, n: 20, fine: 4, fineW: 0.35, g: 0.06, dark: 0.36, wob: 0.3, slat: 0.55, tip: 7, tipAt: 'bak', edge: 0.7, sideCut: 0.3, quiff: { dir: [0, 0.72, 0.69], h: 0.08, w: 0.5 }, gr: 1.05 },
    tatuering: { text: 'BLUES', rot: -50 }, does: ['cigg', 'vila'],
    vanta: { fot: 0, ordning: [1, 4, 2, 0, 3], fas: 2.5 },
    mal: { jubel: 'vila', panna: 'vila' } },
  { key: 'dj', tilt: -2, legs: 104, torso: 100, w: 42, depth: 24, neck: 18, neckR: 13, arm: 7, leg: 8, a: 48, b: 44,
    head: { rx: 49, ry: 75, rz: 50, hw: 54, hh: 84, cy: -6, taper: 0.22, noseY: 18, nose: [5.8, 9, 7.2], noseRot: -0.3 }, glasses: 36,
    hair: { style: 'svep', sw: 28, f: 50, s: 82, b: 140, temple: 5, vol: 0.1, lift: 7, back: 2, n: 18, fine: 4, fineW: 0.3, g: 0.075, dark: 0.4, wob: 0.4, tip: 6, tipAt: 'bak', edge: 0.7, sideCut: 0.45, quiff: { dir: [-0.3, 0.62, 0.72], h: 0.13, w: 0.42 }, gr: 1.07 },
    mossa: { f: 56, s: 76, b: 104, text: ['BLÅ', 'VITT'] }, beard: [1.024, -2], does: ['flaska', 'prat'],
    vanta: { fot: 0, ordning: [4, 2, 0, 3, 1], fas: 5 },
    mal: { jubel: 'flaska', panna: 'flaska' } },
];

// Figuren F på platsen P: armarna efter sidan (does, vanta.penna/kupong,
// tatuering.arm och mal i armarnas ordning), sidan som bordet är åt (inn: 1
// åt figurens vänster, −1 åt höger – blickarna åt sidan i body vänds med den)
// och vridningen mot ölen som man sneglar på medan man väntar (vanta.blick;
// DT:s är extraflaskan).
function sitt(F, P) {
  const does = P.inre ? [F.does[1], F.does[0]] : F.does;
  const sak = F.key === 'dt' ? P.flaska : P.sak;
  return {
    ...F, x: P.x, z: P.z, turn: P.turn, plats: P, does, inn: P.inre ? 1 : -1,
    tatuering: F.tatuering && { ...F.tatuering, arm: does.indexOf('cigg') },
    vanta: { ...F.vanta, kupong: P.kupong, penna: 1 - P.kupong, blick: Math.atan2(sak[0], sak[1]) },
    mal: { jubel: does.indexOf(F.mal.jubel), panna: does.indexOf(F.mal.panna) },
  };
}

// Kläderna efter vädret i Stockholm (v = Vader.nu(), via rum.js): känns-
// temperaturen avgör lagren – 0 hett (21° och mer), 1 varmt (15–21), 2 svalt
// (8–15), 3 kallt (1–8), 4 vinter (under 1) – regn ger regnjackor, sol
// solglasögonen på näsan och snöfall snö på axlarna. DT kavlar alltid upp
// ärmen på armen med lejonet. Runt högtiderna (fest, rum-fest.js) har de
// något på huvudet, och vid jul, lucia och nyår andra kläder.
//   ben: kort|lang, byxa: [färg, mörkare], troja: { farg, farg2, luva, ficka,
//            jul (jultröjan), skjorta (med fluga), upp: lejon },
//   jacka: { typ: oppen|stangd, tyg: bomull|skinn|dun|parka|regn|flanell|sammet,
//            farg, farg2, luva: slat|pals, krage, tjock, tunn, upp: lejon|bada },
//   fest: lucia|jul|nyar|pask|midsommar
function dress(key, v) {
  const k = v ? v.kanns : 17;
  const n = k >= 21 ? 0 : k >= 15 ? 1 : k >= 8 ? 2 : k >= 1 ? 3 : 4;
  const regn = !!v && (v.fall === 'regn' || v.fall === 'blandat') && n >= 1 && n <= 3;
  const d = { n, ben: n <= 1 ? 'kort' : 'lang', glas: !!v && !v.fall && v.sol > 8 && v.moln < 45, sno: !!v && v.fall === 'sno' && n >= 3 };
  if (key === 'dl') {
    if (n >= 2) { d.byxa = ['#c9bb98', '#b1a27d']; d.troja = { farg: '#2a3658', farg2: '#1c2642' }; }
    if (n === 3) d.jacka = { typ: 'oppen', tyg: 'bomull', farg: '#5d6142', farg2: '#43472f', krage: true };
    if (n === 4) d.jacka = { typ: 'stangd', tyg: 'parka', farg: '#24323f', farg2: '#172230', luva: 'slat', tjock: 1.6 };
    if (regn) d.jacka = { typ: n === 3 ? 'stangd' : 'oppen', tyg: 'regn', farg: '#e9b724', farg2: '#c99a12', luva: 'slat' };
  } else if (key === 'dt') {
    d.ben = n === 0 ? 'kort' : 'lang';
    if (n === 2) d.jacka = { typ: 'oppen', tyg: 'flanell', farg: '#8c2a24', farg2: '#1e1a1a', krage: true, tunn: true, upp: 'bada' };
    if (n === 3) d.jacka = { typ: 'oppen', tyg: 'skinn', farg: '#4a2e1e', farg2: '#2e1c12', krage: true, upp: 'lejon' };
    if (n === 4) d.jacka = { typ: 'stangd', tyg: 'dun', farg: '#2f3e33', farg2: '#1f2a22', krage: true, tjock: 1.8, upp: 'lejon' };
    if (regn) d.jacka = { typ: 'oppen', tyg: 'regn', farg: '#4f5a3a', farg2: '#39422a', luva: 'slat', upp: 'lejon' };
  } else if (key === 'dj') {
    if (n >= 2) { d.byxa = ['#b8b4ab', '#a29d93']; d.troja = { farg: '#1d1d20', farg2: '#111113', luva: true, ficka: true }; }
    if (n === 3) d.jacka = { typ: 'stangd', tyg: 'dun', farg: '#161618', farg2: '#0b0b0c', krage: true, tjock: 1.5 };
    if (n === 4) d.jacka = { typ: 'stangd', tyg: 'dun', farg: '#161618', farg2: '#0b0b0c', krage: true, tjock: 2.2, luva: 'pals' };
    if (regn) d.jacka = { typ: 'stangd', tyg: 'regn', farg: '#18191c', farg2: '#0e0f11', luva: 'slat' };
  }
  // högtiderna (rum-fest.js): vid jul, lucia och nyår byter de om
  const fest = festen(v);
  if (fest) { d.fest = fest; drakt(key, d); }
  return d;
}

export async function figurer(canvas, opt = {}) {
  const W = canvas.clientWidth || 1440;
  const H = canvas.clientHeight || 560;
  // i telefonen färre bildpunkter, ingen kantutjämning och mindre skuggkartor,
  // så att minnet räcker
  const LATT = matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  const SKUGGA = LATT ? 1024 : 2048;
  const SMA_SKUGGA = 7;
  // hur fint de ritas (kval nedan)
  const Q = { skugga: 1, n: 0, enkel: Boolean(opt.enkel) };
  const HEMI_ENKEL = 3;
  // hur många trianglar de byggs av (detalj i KVAL i rum.js): håret, huvudena
  // och de runda delarna har färre när datorn inte hinner med – gänget var
  // drygt 700 000 trianglar, två gånger per bild med skuggorna
  let DET = opt.detalj || 1;
  const seg = (n, min) => Math.max(min, Math.round(n * DET));
  // (kantutjämning bara när datorn hinner med från början, kant i rum.js: den går
  // inte att stänga av sedan, och den är dyr på en svag grafikkrets)
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !LATT && opt.kant !== false });
  // (i telefonen på höjden står rummet längre bort, fit i rum.js: gänget är mindre på skärmen och blir
  // lika skarpt med färre bildpunkter)
  const PR = LATT ? (innerWidth < 600 && innerHeight > innerWidth ? 1.2 : 1.5) : Math.min(window.devicePixelRatio || 1, 2);
  r.setPixelRatio(PR);
  r.setSize(W, H, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  const POWERVR = utanSkuggor(r);
  r.shadowMap.enabled = !POWERVR && !opt.enkel;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  // (det enkla ljuset, enkeltLjus nedan, klarar sig utan miljön)
  if (!opt.enkel) {
    const pmrem = new THREE.PMREMGenerator(r);
    if (LATT) pmrem._setSize = (n) => THREE.PMREMGenerator.prototype._setSize.call(pmrem, Math.min(n, 128));
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  // Världens x = 0 är scenens mitt (800), men duken börjar vid scenens
  // vänsterkant (rum.css): kameran ritar den del av en bild med mitten där
  // som duken täcker, så att perspektivet är detsamma som när duken var mitt i.
  const L0 = parseFloat(getComputedStyle(canvas).left) || 0;
  const FW = 2 * Math.max(800 - L0, L0 + W - 800);
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(H / 2 / D) / DEG, FW / H, 50, 5000);
  cam.position.set(0, 0, D);
  cam.lookAt(0, 0, 0);
  cam.setViewOffset(FW, H, L0 - (800 - FW / 2), 0, W, H);

  // ljuset: lysröret framifrån ovan, neonen bakom till vänster, terminalen till höger
  // (lysröret och det allmänna ljuset dämpas på natten, draw)
  const hemi = new THREE.HemisphereLight('#d8d0b8', '#3a2a20', 0.42);
  scene.add(hemi);
  const KEY = 2.0;
  const key = new THREE.DirectionalLight('#fff0d6', KEY);
  key.position.set(120, 520, 520);
  key.castShadow = true;
  key.shadow.mapSize.set(SKUGGA, SKUGGA);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -650, right: 350, top: 450, bottom: -450, near: 10, far: 2000 });
  key.target.position.set(-150, -50, 0);
  scene.add(key, key.target);
  // (neonen släcks när skylten glappar, draw)
  const NEON = 4.2;
  const neon = new THREE.DirectionalLight('#ff3a26', NEON);
  neon.position.set(-260, 260, -420);
  scene.add(neon);
  // tv:n uppe till höger (TV nedan), mot barbordet: tänds medan matcherna
  // pågår (tvW, draw)
  const TVLJUS = 5;
  const tvLjus = new THREE.DirectionalLight('#9ab8ff', 0);
  tvLjus.position.set(490, 250, -140);
  tvLjus.target.position.set(BORD.x, 0, BORD.z);
  scene.add(tvLjus, tvLjus.target);
  const term = new THREE.DirectionalLight('#5ff0dc', 1.1);
  term.position.set(520, 80, -120);
  scene.add(term);
  const FILL = 0.5;
  const fill = new THREE.DirectionalLight('#ffd9b0', FILL);
  fill.position.set(-300, -50, 400);
  scene.add(fill);
  // fönstret bakom gänget: gatlyktorna på natten, dagsljuset på dagen (ute)
  const win = new THREE.DirectionalLight('#ffb35c', 0.35);
  win.position.set(-150, 320, -700);
  win.target.position.set(-150, -40, 0);
  scene.add(win, win.target);

  const pivot = new THREE.Group();
  pivot.position.y = -100;
  scene.add(pivot);
  const root = new THREE.Group();
  root.position.y = 100;
  pivot.add(root);

  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(1100, 220), new THREE.ShadowMaterial({ opacity: 0.42 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.set(-170, SILL, -24);
  catcher.receiveShadow = true;
  catcher.visible = !POWERVR && !opt.enkel;
  root.add(catcher);

  const mat = (color, o = {}, sort) => {
    const m = new THREE.MeshPhysicalMaterial(Object.assign({ color, envMapIntensity: 0.45 }, sort ? P0[sort] : {}, o));
    if (m.sheen && !o.sheenColor) m.sheenColor = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35);
    return m;
  };
  const mesh = (g, m, parent) => { const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; parent.add(x); return x; };
  const UP = new THREE.Vector3(0, 1, 0);
  function capsule(a, b, rad, m, parent) {
    a = v3(a); b = v3(b);
    const x = mesh(new THREE.CapsuleGeometry(rad, a.distanceTo(b), seg(8, 4), seg(24, 12)), m, parent);
    x.position.copy(a).add(b).multiplyScalar(0.5);
    x.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    return x;
  }
  // en kapsel med fast längd som flyttas varje bild
  const rod = (len, rad, m, parent) => Object.assign(mesh(new THREE.CapsuleGeometry(rad, len, seg(8, 4), seg(24, 12)), m, parent), { len });
  function place(x, a, b) {
    x.position.copy(a).add(b).multiplyScalar(0.5);
    x.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  }
  function ellipsoid(pos, sc, m, parent, rot) {
    const x = mesh(new THREE.SphereGeometry(1, seg(40, 20), seg(28, 14)), m, parent);
    x.position.set(...pos);
    x.scale.set(...sc);
    if (rot) x.rotation.set(...rot);
    return x;
  }
  function ring(at, dir, R, tube, m, parent) {
    const x = mesh(new THREE.TorusGeometry(R, tube, seg(12, 6), seg(64, 28)), m, parent);
    x.position.copy(v3(at));
    x.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v3(dir).normalize());
    return x;
  }
  // Ögonen stängda (blinkningarna, blinkar): ansiktsbilden utan ögonvitorna
  // och ögonen, och det övre ögonlocket nere vid det nedre. Ett ansikte utan
  // ögonvitor (DT skrattar med ögonen stängda) blinkar inte (null).
  function blundar(svg) {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const vitor = [...doc.querySelectorAll('path[fill="#f7f1ea"]')];
    if (!vitor.length) return null;
    const tal = (el) => el.getAttribute('d').match(/-?[\d.]+/g).map(Number);
    for (const v of vitor) {
      const ogat = doc.querySelector(`g[clip-path="url(#${v.nextElementSibling.id})"]`);
      const lock = ogat.nextElementSibling;
      const [x0, y0, cx, , x1, y1] = tal(lock);
      lock.setAttribute('d', `M${x0} ${y0} Q${cx} ${tal(v)[7] - 2} ${x1} ${y1}`);
      v.remove();
      ogat.remove();
    }
    return new XMLSerializer().serializeToString(doc);
  }
  // Skrattet (skrattW): ögonen hopknipna till bågar med skrattrynkor utåt, som
  // DT:s ansikte, och (DL) munnen vidöppen med tänderna och tungan. DJ:s mun
  // sitter i skägget (skaggSkratt). Ett ansikte utan ögonvitor skrattar redan (null).
  const MUN = (d) => `<path d="${d}" fill="#4a1712"/><clipPath id="skr-m"><path d="${d}"/></clipPath>`;
  function skrattar(svg, mun) {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const vitor = [...doc.querySelectorAll('path[fill="#f7f1ea"]')];
    if (!vitor.length) return null;
    const tal = (el) => el.getAttribute('d').match(/-?[\d.]+/g).map(Number);
    let ny = '';
    for (const v of vitor) {
      const [x0, y0, cx, , x1, y1] = tal(v);
      const ogat = doc.querySelector(`g[clip-path="url(#${v.nextElementSibling.id})"]`);
      const lock = ogat.nextElementSibling;
      const farg = lock.getAttribute('stroke');
      const yy = (y0 + y1) / 2 + 1.5;
      const ut = Math.abs(x0) > Math.abs(x1) ? x0 : x1;
      const s = Math.sign(ut);
      ny += `<path d="M${x0 + 1} ${yy} Q${cx} ${yy - 10} ${x1 - 1} ${yy}" fill="none" stroke="${farg}" stroke-width="3.2" stroke-linecap="round"/>`
        + `<path d="M${x0 + 4} ${yy - 1} Q${cx} ${yy - 7.5} ${x1 - 4} ${yy - 1} Q${cx} ${yy - 3.5} ${x0 + 4} ${yy - 1} Z" fill="${farg}" opacity=".8"/>`
        + [-6.6, 0, 6.6].map((dy, i) => `<path d="M${ut + s * 2} ${yy - 3 + 3 * i} l${s * 7} ${dy}" fill="none" stroke="#a86a52" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>`).join('');
      v.nextElementSibling.remove();
      v.remove();
      ogat.remove();
      lock.remove();
    }
    if (mun) {
      for (const x of doc.querySelectorAll(`[fill="${mun.bort}"], [stroke="${mun.lapp}"], clipPath[id="${mun.klipp}"], g[clip-path="url(#${mun.klipp})"]`)) x.remove();
      ny += MUN(mun.d) + `<g clip-path="url(#skr-m)"><path d="${mun.tander}" fill="#f4efe6"/><ellipse cx="0" cy="${mun.tunga}" rx="9" ry="4" fill="#a8473f"/></g>`
        + `<path d="M-13 21 Q-24 26 -27 37 M13 21 Q24 26 27 37" fill="none" stroke="#b06e5c" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/>`;
    }
    doc.documentElement.insertAdjacentHTML('beforeend', ny);
    return new XMLSerializer().serializeToString(doc);
  }
  // DL:s leende byts mot ett skratt i samma storlek
  const SKRATT_MUN = {
    dl: { bort: '#6b2a24', lapp: '#8a3c33', klipp: 'mdl', d: 'M-20 33 Q0 38 20 33 Q17 52 0 55 Q-17 52 -20 33 Z', tander: 'M-21 32 Q0 37 21 32 L21 40 Q0 45 -21 40 Z', tunga: 50 },
  };
  // DJ:s mun i skägget, som skrattar: mörk och öppen med tänderna överst
  function skaggSkratt(svg) {
    const d = 'M-16 31 Q0 35 16 31 Q13 47 0 50 Q-13 47 -16 31 Z';
    return svg.replace('</svg>', `${MUN(d)}<g clip-path="url(#skr-m)"><path d="M-17 30 Q0 34 17 30 L17 37 Q0 41 -17 37 Z" fill="#f1ebe0"/><ellipse cx="0" cy="46" rx="7" ry="3.5" fill="#9c4038"/></g></svg>`);
  }
  // Ansiktsuttrycken (rum-uttryck.js): hur glada de ser ut efter hur gängets
  // senaste kupong gick (senast) och, medan omgången spelas, hur det går för
  // den (spel). Bilderna för läget – ansiktena, deras blinkningar och DJ:s mun
  // i skägget – byggs när läget ändras och ligger i tex som ans_dl,
  // ans_dl_blund … ans_skagg; de förra släpps när de nya är klara. Utan läge
  // (null) och där bilden redan är så (DL och DJ glada) används de vanliga.
  // Skrattar de åt något (skrattW) är det de vanliga skrattbilderna, och DT:s
  // ritade ansikte. När de nya är klara ritas rummet om (opt.rita, när gänget
  // finns: ute), och ANS.p är klart då.
  const ANS = { svg: {}, mal: null, nr: 0, spel: opt.spel ? opt.spel.ansikte || opt.spel.lage : null, senast: opt.senast || null, p: Promise.resolve(), ute: false };
  const svgTex = async (s) => {
    const u = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
    try { return await imgTex(u); } finally { URL.revokeObjectURL(u); }
  };
  function ansikten(lage) {
    if (lage !== ANS.mal) {
      ANS.mal = lage;
      ANS.p = byggAnsikten(lage, ++ANS.nr);
    }
    return ANS.p;
  }
  async function byggAnsikten(lage, nr) {
    const ny = {};
    const jobb = [];
    const bygg = (k, s) => jobb.push(svgTex(s).then((t) => { ny[k] = t; }, () => {}));
    try {
      for (const k of ['dl', 'dt', 'dj']) {
        const s0 = ANS.svg[k];
        const s = s0 && uttryck(s0, k, lage);
        if (!s || s === s0) continue;
        bygg(k, s);
        const b = (!opt.calm || k === 'dj') && blundar(s);
        if (b) bygg(`${k}_blund`, b);
      }
      const sk = ANS.svg.skagg && skaggUttryck(ANS.svg.skagg, lage);
      if (sk && sk !== ANS.svg.skagg) bygg('skagg', sk);
    } catch (err) {
      console.warn('Rummet: ansiktsuttrycket kunde inte ritas', err);
    }
    await Promise.all(jobb);
    if (nr !== ANS.nr) {
      for (const t of Object.values(ny)) t.dispose();
      return;
    }
    const gamla = Object.keys(tex).filter((k) => k.startsWith('ans_')).map((k) => { const t = tex[k]; delete tex[k]; return t; });
    for (const [k, t] of Object.entries(ny)) tex[`ans_${k}`] = t;
    for (const t of gamla) t.dispose();
    // de vanliga som byttes ut behövs inte på grafikkortet så länge (three.js
    // laddar upp dem igen om de används); DT:s ritade ansikte är hans skratt
    for (const k of Object.keys(ny)) if (k !== 'dt' && tex[k]) tex[k].dispose();
    if (opt.rita && ANS.ute) opt.rita();
  }
  // ansiktet som vem har nu, och samma ansikte med ögonen stängda
  function ansiktet(k) {
    const a = tex[`ans_${k}`];
    return a ? { bas: a, blund: tex[`ans_${k}_blund`] } : { bas: tex[k], blund: tex[`${k}_blund`] };
  }
  const imgTex = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      // i telefonen räcker hälften (ansiktena är små där)
      c.width = LATT ? 512 : 1024;
      c.height = LATT ? 576 : 1152;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      res(t);
    };
    img.onerror = rej;
    img.src = src;
  });
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function hairTex(c1, c2, c3, seed) {
    const t = canvasTex(1024, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, c3); gr.addColorStop(0.35, c1); gr.addColorStop(1, c1);
      g.fillStyle = gr;
      g.fillRect(0, 0, 1024, 256);
      let s = seed;
      const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 900; i++) {
        const x = rnd() * 1024;
        g.strokeStyle = rnd() < 0.5 ? c2 : c3;
        g.globalAlpha = 0.25 + rnd() * 0.35;
        g.lineWidth = 1 + rnd() * 2.5;
        g.beginPath(); g.moveTo(x, rnd() * 40);
        g.bezierCurveTo(x + (rnd() - 0.5) * 30, 90, x + (rnd() - 0.5) * 40, 170, x + (rnd() - 0.5) * 30, 256);
        g.stroke();
      }
    });
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }
  // tygets struktur: fin trikå eller diagonal denim, som bumpkarta
  function weaveTex(kind) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#808080';
    g.fillRect(0, 0, 256, 256);
    let s = kind === 'denim' ? 11 : 5;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    if (kind === 'denim') {
      g.lineWidth = 2;
      for (let i = -256; i < 512; i += 5) { g.strokeStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${0.25 + rnd() * 0.3})`; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); }
    } else {
      for (let y = 0; y < 256; y += 4) for (let x = 0; x < 256; x += 4) { g.fillStyle = `rgba(0,0,0,${0.15 + rnd() * 0.25})`; g.fillRect(x + ((y / 4) % 2) * 2, y, 2, 3); }
    }
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.12})`; g.fillRect(rnd() * 256, rnd() * 256, 1, 1); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(kind === 'denim' ? 10 : 14, kind === 'denim' ? 10 : 14);
    return t;
  }
  const knit = weaveTex('knit');
  const denim = weaveTex('denim');

  // huvudet: en deformerad sfär; ansiktsdragen målas på ett skal framtill
  function headGeo(P, front, scale = 1, dy = 0) {
    const g = front ? new THREE.SphereGeometry(1, seg(96, 44), seg(72, 32), 0, Math.PI) : new THREE.SphereGeometry(1, seg(96, 44), seg(72, 32));
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      let X = p.getX(i);
      const Y = p.getY(i);
      let Z = p.getZ(i);
      if (Y < 0) X *= 1 - P.taper * Math.pow(-Y, 1.6);
      if (P.cheek) { const w = Math.exp(-(((Y + 0.32) / 0.3) ** 2)) * Math.max(0, Z); X *= 1 + P.cheek * w; Z *= 1 + P.cheek * 0.6 * w; }
      const px = X * P.rx * scale;
      const py = Y * P.ry * scale + dy;
      const pz = Z * P.rz * (front ? scale : 1);
      p.setXYZ(i, px, py, pz);
      if (front) uv.setXY(i, (px * P.hw / P.rx + 80) / 160, 1 - ((-py * P.hh / P.ry + P.cy) + 100) / 180);
    }
    g.computeVertexNormals();
    return g;
  }
  // skulpterat hår som på en vinylfigur: grova testar med fina fåror, rundade
  // spetsar, tjock kant mot huden, volym framtill, mörkare i fårorna
  function hairGeo(P, h, seed) {
    // (i telefonen är huvudena några dussin punkter breda: håret var en
    // tredjedel av gängets alla trianglar)
    const N = LATT ? seg(360, 180) : seg(480, 300);
    const M = LATT ? seg(72, 32) : seg(96, 48);
    const pos = [];
    const uv = [];
    const col = [];
    const idx = [];
    let s0 = seed;
    const rnd = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
    const ph = Array.from({ length: 6 }, () => rnd() * 6.283);
    const sw = (h.sw || 0) * DEG;
    const cap = h.cap; // mössan: håret under den trycks ner, under kanten sticker det ut
    const Q = h.quiff ? v3(h.quiff.dir).normalize() : null;
    const wob = h.wob ?? 1;
    const S = THREE.MathUtils.smoothstep;
    const ridge = (p, e) => Math.pow(0.5 + 0.5 * Math.cos(p), e);
    const phaseAt = (a, t, dx, dy, dz) => (h.style === 'krona'
      ? h.n * a + wob * (0.8 * Math.sin(a * 5 + ph[2]) + 1.4 * t * Math.sin(a * 2 + ph[3]))
      : h.n * Math.atan2(dx * Math.cos(sw) - dz * Math.sin(sw), dy) + wob * (0.7 * Math.sin(dz * 4 + ph[2]) + 0.4 * Math.sin(dx * 7 + ph[3])));
    for (let i = 0; i <= N; i++) {
      const a = i / N * 2 * Math.PI;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const wf = Math.max(0, ca) ** 2;
      const wb = Math.max(0, -ca) ** 2;
      const ws = sa * sa;
      let lim = (h.f * wf + h.s * ws + h.b * wb) * DEG;
      const ang = Math.abs(Math.atan2(sa, ca));
      lim -= (h.temple || 0) * DEG * Math.exp(-(((ang - 0.62) / (h.templeW || 0.22)) ** 2));
      if (h.tip) {
        const ex = Math.sin(lim) * sa; const ey = Math.cos(lim); const ez = Math.sin(lim) * ca;
        const w = h.tipAt === 'bak' ? wb + 0.6 * ws * (ca < 0) : h.tipAt === 'fram' ? wf + 0.5 * ws * (ca > 0) : 1;
        lim += h.tip * DEG * w * (ridge(phaseAt(a, 1, ex, ey, ez), 2.2) - 0.35);
      }
      for (let j = 0; j <= M; j++) {
        const t = j / M;
        const th = t * lim;
        const dx = Math.sin(th) * sa; const dy = Math.cos(th); const dz = Math.sin(th) * ca;
        const fall = 1 - S(t, h.edge || 0.55, 1);
        const fall2 = 1 - S(t, 0.9, 1);
        const phase = phaseAt(a, t, dx, dy, dz);
        const fade = h.style === 'krona' ? S(Math.sin(th), 0.08, 0.4) : S(Math.hypot(dx * Math.cos(sw) - dz * Math.sin(sw), dy), 0.12, 0.45);
        const smooth = 1 - (h.slat || 0) * wf * S(t, 0.45, 0.95);
        const big = ridge(phase, 0.5); const fine = ridge(phase * (h.fine || 3) + 1.3, 0.9); const fw = h.fineW ?? 0.3;
        const rid = big * (1 - fw) + fine * fw;
        const side = 1 - (h.sideCut || 0) * ws * (1 - Math.max(0, dy)) * (ca > -0.3);
        let k = 1.012 + h.vol * fall * side * (0.55 + 0.45 * dy) + h.g * (rid - 0.5) * fall2 * fade * smooth;
        if (Q) { const dd = 1 - (dx * Q.x + dy * Q.y + dz * Q.z); k += h.quiff.h * Math.exp(-dd * dd / (h.quiff.w ** 2)) * fall; }
        const sq = cap ? 0.12 + 0.88 * S(th, (cap.f * wf + cap.s * ws + cap.b * wb) * DEG - 0.06, (cap.f * wf + cap.s * ws + cap.b * wb) * DEG + 0.05) : 1;
        k = 1 + (k - 1) * sq;
        pos.push(dx * k * P.rx, dy * k * P.ry + (h.lift || 0) * fall * dy * sq, dz * k * P.rz - (h.back || 0) * fall * dy * sq);
        const sh = (1 - h.dark * (1 - rid) * fade * smooth) * (1 - 0.25 * (1 - fall2));
        col.push(sh, sh, sh);
        uv.push(phase / 6.283 / 5, 1 - t);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j; const b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  function glasses(P, parent, at, rr = 1) {
    const g = new THREE.Group();
    parent.add(g);
    const m = new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.32, envMapIntensity: 0.2 });
    for (const s of [-1, 1]) { const l = mesh(new RoundedBoxGeometry(P.rx * 0.62, P.ry * 0.2, 3, 3, 2.5), m, g); l.position.x = s * P.rx * 0.36; }
    mesh(new THREE.BoxGeometry(P.rx * 0.14, 2.4, 2.4), m, g).position.y = P.ry * 0.03;
    for (const s of [-1, 1]) { const arm = mesh(new THREE.BoxGeometry(2.4, 2.4, P.rz * 1.05), m, g); arm.position.set(s * P.rx * 0.66, 0, -P.rz * 0.5); }
    const th = at * DEG;
    g.position.set(0, Math.cos(th) * P.ry * 1.1 * rr, Math.sin(th) * P.rz * 1.18 * rr + 2);
    g.rotation.x = 8 * DEG;
    return g;
  }

  // ---------- attiraljerna: halsduken, tatueringen och mössan ----------

  // stickningen som bumpkarta: rätmaskor (V) i rader längs u (along) eller v
  function knitTex(along, cols, rows) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#3a3a3a';
    g.fillRect(0, 0, 128, 128);
    if (along === 'v') { g.translate(128, 0); g.rotate(Math.PI / 2); }
    g.filter = 'blur(1.2px)';
    g.fillStyle = '#d0d0d0';
    const cw = 128 / cols; const rh = 128 / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        for (const s of [-1, 1]) {
          g.save();
          g.translate((i + 0.5) * cw, (j + 0.5 + s * 0.22) * rh);
          g.rotate(s * 0.5);
          g.beginPath(); g.ellipse(0, 0, cw * 0.36, rh * 0.2, 0, 0, 2 * Math.PI); g.fill();
          g.restore();
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  // resåren i mössans uppvik: upphöjda ränder tvärs över
  const ribTex = canvasTex(64, 8, (g) => { for (let x = 0; x < 64; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, '#303030'); gr.addColorStop(0.5, '#d8d8d8'); gr.addColorStop(1, '#303030'); g.fillStyle = gr; g.fillRect(x, 0, 8, 8); } });
  ribTex.colorSpace = THREE.NoColorSpace;
  ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping;

  // Ett stickat band längs mittlinjen pts med normalerna nrm (tjockleken åt
  // det hållet): tvärsnittet är en rundad rektangel w × th och ändarna är
  // slutna. u = längden i enheter, v = tvärs över.
  function band(pts, nrm, w, th, n = 24) {
    const pos = []; const uv = []; const idx = [];
    const M = pts.length;
    const rows = [];
    let len = 0;
    for (let i = 0; i < M; i++) {
      if (i) len += pts[i].distanceTo(pts[i - 1]);
      const tg = pts[Math.min(i + 1, M - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
      const B = new THREE.Vector3().crossVectors(tg, nrm[i]).normalize();
      const N = new THREE.Vector3().crossVectors(B, tg);
      rows.push({ c: pts[i], N, B, k: 1, u: len });
    }
    rows.unshift({ ...rows[0], k: 0 });
    rows.push({ ...rows[rows.length - 1], k: 0 });
    for (const r of rows) {
      for (let j = 0; j <= n; j++) {
        const a = j / n * 2 * Math.PI;
        const ca = Math.cos(a); const sa = Math.sin(a);
        const bx = Math.sign(ca) * Math.abs(ca) ** 0.35 * w / 2 * r.k;
        const ny = Math.sign(sa) * Math.abs(sa) ** 0.35 * th / 2 * r.k;
        pos.push(r.c.x + r.B.x * bx + r.N.x * ny, r.c.y + r.B.y * bx + r.N.y * ny, r.c.z + r.B.z * bx + r.N.z * ny);
        uv.push(r.u, (1 - ca) / 2);
      }
    }
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j; const b = a + n + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    g.userData.len = len;
    return g;
  }
  // halsdukens färger längs bandet: segs = [[u0, u1, färg]] på botten
  // (färgen bg), text = [u0, u1, ord, färg], skold = [u0, u1, bild] (upprätt
  // på en hängande ände); ppu bildpunkter per enhet
  function scarfTex(L, w, bg, segs, text, skold) {
    const ppu = 16; const H = 128;
    return canvasTex(Math.ceil(L * ppu), H, (g, W) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (const [a, b, col] of segs) { g.fillStyle = col; g.fillRect(a * ppu, 0, (b - a) * ppu, H); }
      if (skold && skold[2]) {
        const [a, b, img] = skold;
        const s = Math.min((b - a) / img.height, w * 0.82 / img.width) * (H / w);
        g.save();
        g.translate((a + b) / 2 * ppu, H / 2);
        g.scale(ppu / (H / w), 1);
        g.rotate(-Math.PI / 2);
        g.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s);
        g.restore();
      }
      if (text) {
        const [a, b, str, col] = text;
        g.save();
        g.translate((a + b) / 2 * ppu, H / 2 + 4);
        g.scale(ppu / (H / w), 1);
        g.font = '900 84px "Arial Black", "Helvetica Neue", Arial, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        const fit = Math.min(1, (b - a) * (H / w) / g.measureText(str).width);
        g.scale(fit, 1);
        g.fillStyle = col; g.fillText(str, 0, 0);
        g.restore();
      }
    });
  }

  // DL:s halsduk i Nacionals trikolor: ett varv runt halsen och båda ändarna
  // fram på ena sidan, den längre med BOLSO, den kortare med skölden, fransar
  // längst ner.
  // Byggd i bröstets axlar så att den följer bålen.
  function halsduk(F, prof, parent) {
    const C = LAG[F.key];
    const T = F.torso; const sz = F.depth / F.w;
    const rAt = (y) => { if (y <= prof[0].y) return prof[0].x; for (let i = 1; i < prof.length; i++) { const a = prof[i - 1]; const b = prof[i]; if (y <= b.y) return b.y > a.y ? a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y) : b.x; } return 0; };
    const zAt = (x, y) => Math.sqrt(Math.max(0, rAt(y) ** 2 - x * x)) * sz + 1.8;
    const W = 16; const TH = 5;
    const knit = knitTex('u', 1, 7);
    knit.repeat.set(1 / 1.6, 1);
    const wool = (map) => mat('#ffffff', { map, bumpMap: knit, bumpScale: 1.4, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') });
    const grp = [[0, 4, C.bla], [4, 6.5, C.rod], [6.5, 10.5, C.bla]];
    const at = (u0) => grp.map(([a, b, col]) => [u0 + a, u0 + b, col]);
    // en ände: kontrollpunkter (x, y) längs bröstet; under bysten hänger den
    // fritt och lite framåt (bålen lutar fram)
    function end(ctrl, off) {
      const cur = new THREE.CatmullRomCurve3(ctrl.map(([x, y]) => new THREE.Vector3(x, y, 0)));
      const pts = []; const nrm = [];
      let zMax = -1e9; let yPrev = 0;
      for (const q of cur.getSpacedPoints(48)) {
        let z = zAt(q.x, q.y);
        const e = 0.5;
        const n = new THREE.Vector3(-(zAt(q.x + e, q.y) - zAt(q.x - e, q.y)) / (2 * e), -(zAt(q.x, q.y + e) - zAt(q.x, q.y - e)) / (2 * e), 1).normalize();
        if (z < zMax) { z = zMax + 0.12 * (yPrev - q.y); n.set(0, 0.12, 1).normalize(); }
        zMax = z; yPrev = q.y;
        pts.push(new THREE.Vector3(q.x, q.y, z).addScaledVector(n, off));
        nrm.push(n);
      }
      return { pts, nrm };
    }
    function fringe(e, cols) {
      const P = e.pts[e.pts.length - 1];
      const tg = P.clone().sub(e.pts[e.pts.length - 3]).normalize();
      const B = new THREE.Vector3().crossVectors(tg, e.nrm[e.nrm.length - 1]).normalize();
      const down = new THREE.Vector3(0, -1, 0.1).normalize();
      for (let i = 0; i < 8; i++) {
        const x = (i / 7 - 0.5) * (W - 2.6);
        const a = P.clone().addScaledVector(B, x).addScaledVector(tg, -0.6);
        const b = a.clone().addScaledVector(down.clone().lerp(tg, 0.4).normalize(), 5.5 + 2.2 * hash(i + F.x)).add(new THREE.Vector3(0.6 * Math.sin(i * 2.3), 0, 0.5 * Math.cos(i * 1.7)));
        capsule(a.toArray(), b.toArray(), 0.85, mat(cols[i % cols.length], { roughness: 0.7, sheen: 0.5 }), parent);
      }
    }
    // varvet runt halsen, lite lägre fram
    const ring = []; const rn = [];
    const R = F.neckR * 1.1 + 5.5;
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * 2 * Math.PI;
      ring.push(new THREE.Vector3(R * Math.sin(a), T + 5.5 - 2.2 * Math.cos(a), R * Math.cos(a)));
      rn.push(new THREE.Vector3(Math.sin(a), 0.25, Math.cos(a)).normalize());
    }
    const rt = scarfTex(34, 13, C.vit, at(20));
    rt.wrapS = THREE.RepeatWrapping; rt.repeat.x = 1 / 34;
    mesh(band(ring, rn, 13, 8.5, 28), wool(rt), parent);
    // ändarna: A (längre, med texten) och B (kortare, med skölden) ovanpå den
    const A = end([[-7, T + 1], [-8, T - 6], [-9, T - 16], [-10, T - 30], [-11, T - 44], [-12, T - 56]], TH / 2);
    const Bn = end([[-17, T + 1], [-21, T - 6], [-25, T - 15], [-29, T - 27], [-32, T - 38]], TH * 1.4);
    for (const [e, len] of [[A, 'A'], [Bn, 'B']]) {
      const g = band(e.pts, e.nrm, W, TH);
      const L = g.userData.len;
      const tx = len === 'A'
        ? scarfTex(L, W, C.vit, [...at(L - 10.5), ...at(L - 53)], [L - 40.5, L - 13, F.halsduk.text, C.bla])
        : scarfTex(L, W, C.vit, [...at(L - 10.5), ...at(L - 37)], null, [L - 26, L - 10.5, skold[F.key]]);
      tx.repeat.x = 1 / L;
      mesh(g, wool(tx), parent);
      fringe(e, [C.rod, C.vit, C.bla]);
    }
  }

  // DT:s tatuering: ett lejonhuvud i gammal stil (manen kungsblå, konturerna
  // mörkblå, ansiktet i hudens färg) med ett band under; målad på ett skal
  // runt underarmen. Lejonet är inget klubbmärke.
  function tatTex(text) {
    const C = LAG.dt;
    return canvasTex(512, 600, (g) => {
      // upp och ner: lejonet står upprätt när armen hänger (huvudet mot armbågen)
      g.translate(512, 600); g.rotate(Math.PI);
      g.lineJoin = 'round'; g.lineCap = 'round';
      const cx = 256; const cy = 222;
      // manen: lockar i två lager runt huvudet, svängda åt samma håll
      const locks = (n, r0, r1, w, fill, off) => {
        for (let i = 0; i < n; i++) {
          const a = ((i + off) / n) * 2 * Math.PI;
          const L = r1 + [0, 22, 8, 30, 14][i % 5];
          const tip = [cx + Math.cos(a + 0.34) * L, cy + Math.sin(a + 0.34) * L * 1.06];
          g.beginPath();
          g.moveTo(cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0 * 1.06);
          g.quadraticCurveTo(cx + Math.cos(a - w * 0.4) * (r0 + L) / 2 * 1.1, cy + Math.sin(a - w * 0.4) * (r0 + L) / 2 * 1.16, ...tip);
          g.quadraticCurveTo(cx + Math.cos(a + w * 0.9) * (r0 + L) / 2, cy + Math.sin(a + w * 0.9) * (r0 + L) / 2 * 1.06, cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0 * 1.06);
          g.closePath();
          g.fillStyle = fill; g.fill(); g.lineWidth = 9; g.strokeStyle = C.mork; g.stroke();
        }
      };
      locks(20, 120, 205, 0.24, C.bla, 0);
      locks(16, 105, 165, 0.27, '#4d84de', 0.5);
      // öronen, halvt i manen
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(cx + s * 52, cy - 84); g.quadraticCurveTo(cx + s * 92, cy - 132, cx + s * 104, cy - 70); g.closePath();
        g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore();
        g.lineWidth = 10; g.stroke();
        g.beginPath(); g.moveTo(cx + s * 66, cy - 86); g.quadraticCurveTo(cx + s * 88, cy - 112, cx + s * 94, cy - 78); g.closePath(); g.fillStyle = C.mork; g.fill();
      }
      // ansiktet: brett över ögonen, smalare mot nosen; huden syns
      const face = new Path2D();
      face.moveTo(cx, cy - 98);
      face.bezierCurveTo(cx + 70, cy - 98, cx + 100, cy - 62, cx + 98, cy - 8);
      face.bezierCurveTo(cx + 96, cy + 46, cx + 66, cy + 100, cx, cy + 112);
      face.bezierCurveTo(cx - 66, cy + 100, cx - 96, cy + 46, cx - 98, cy - 8);
      face.bezierCurveTo(cx - 100, cy - 62, cx - 70, cy - 98, cx, cy - 98);
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(face); g.restore();
      g.strokeStyle = C.mork; g.lineWidth = 12; g.stroke(face);
      // pannan och nosryggen: bryn som sänks mot mitten, ryggen ner mot nosen
      g.lineWidth = 10;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(cx + s * 14, cy - 30); g.quadraticCurveTo(cx + s * 40, cy - 52, cx + s * 78, cy - 40); g.stroke();
        g.beginPath(); g.moveTo(cx + s * 16, cy - 26); g.quadraticCurveTo(cx + s * 10, cy + 6, cx + s * 22, cy + 30); g.stroke();
        // ögat: smalt och snett, med en ljus glimt
        g.beginPath(); g.moveTo(cx + s * 26, cy - 18); g.quadraticCurveTo(cx + s * 50, cy - 34, cx + s * 74, cy - 24); g.quadraticCurveTo(cx + s * 52, cy - 6, cx + s * 26, cy - 18); g.closePath();
        g.fillStyle = C.mork; g.fill();
        g.beginPath(); g.ellipse(cx + s * 50, cy - 21, 8, 6, 0, 0, 2 * Math.PI); g.fillStyle = '#6f9fe8'; g.fill();
        g.beginPath(); g.arc(cx + s * 50, cy - 21, 3, 0, 2 * Math.PI); g.fillStyle = C.mork; g.fill();
        // morrhårsdynorna med prickar
        g.beginPath(); g.arc(cx + s * 24, cy + 60, 26, s > 0 ? -0.3 : Math.PI + 0.3, s > 0 ? 2.1 : Math.PI - 2.1, s < 0); g.lineWidth = 9; g.stroke();
        g.fillStyle = C.mork;
        for (const [dx, dy] of [[22, 56], [36, 50], [36, 66]]) { g.beginPath(); g.arc(cx + s * dx, cy + dy, 4.5, 0, 2 * Math.PI); g.fill(); }
      }
      // nosen: bred och mörk
      g.beginPath(); g.moveTo(cx - 34, cy + 28); g.quadraticCurveTo(cx, cy + 16, cx + 34, cy + 28); g.quadraticCurveTo(cx + 26, cy + 48, cx, cy + 56); g.quadraticCurveTo(cx - 26, cy + 48, cx - 34, cy + 28); g.closePath();
      g.fillStyle = C.mork; g.fill();
      g.beginPath(); g.ellipse(cx - 10, cy + 30, 8, 4, -0.2, 0, 2 * Math.PI); g.fillStyle = '#6f9fe8'; g.fill();
      // munnen, lite öppen
      g.beginPath(); g.moveTo(cx - 24, cy + 86); g.quadraticCurveTo(cx, cy + 78, cx + 24, cy + 86); g.quadraticCurveTo(cx, cy + 104, cx - 24, cy + 86); g.closePath();
      g.fillStyle = C.mork; g.fill();
      g.beginPath(); g.moveTo(cx, cy + 56); g.lineTo(cx, cy + 80); g.lineWidth = 8; g.stroke();
      // bandet med texten
      const by = 492; const bw = 132; const bh = 50;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(cx + s * (bw - 16), by - bh / 2 + 16); g.lineTo(cx + s * (bw + 44), by - bh / 2 + 16); g.lineTo(cx + s * (bw + 26), by + 14); g.lineTo(cx + s * (bw + 44), by + bh / 2 + 16); g.lineTo(cx + s * (bw - 16), by + bh / 2 + 16); g.closePath();
        g.fillStyle = C.mork; g.fill(); g.lineWidth = 9; g.stroke();
      }
      g.beginPath();
      g.moveTo(cx - bw, by - bh / 2); g.quadraticCurveTo(cx, by - bh / 2 - 22, cx + bw, by - bh / 2);
      g.lineTo(cx + bw, by + bh / 2); g.quadraticCurveTo(cx, by + bh / 2 - 22, cx - bw, by + bh / 2); g.closePath();
      g.fillStyle = C.bla; g.fill(); g.lineWidth = 10; g.stroke();
      g.font = '900 52px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = C.vit; g.fillText(text, cx, by - 6);
    });
  }
  function tatuering(F, A) {
    const r = F.arm * 0.92 + 0.22;
    const h = F.b * 0.76;
    const L = (h * 512 / 600) / r;
    const m = mat('#ffffff', { map: tatTex(F.tatuering.text), transparent: true, opacity: 0.94, alphaTest: 0.04, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }, 'hud');
    const x = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true, -L / 2, L), m);
    x.receiveShadow = true;
    x.position.y = -F.b * 0.1;
    A.lo.add(x);
    return x;
  }

  // DJ:s mössa i blåvitt: lodräta ränder (som tröjan), uppvik med skölden
  // som märke mellan BLÅ och VITT, och en tofs. Följer huvudet; kanten
  // (f/s/b = grader från hjässan fram, på sidan och bak) bestämmer också var
  // håret trycks ner.
  function mossa(F, P, parent) {
    const C = LAG[F.key];
    const m = F.mossa;
    const lim = (a) => { const ca = Math.cos(a); const sa = Math.sin(a); return (m.f * Math.max(0, ca) ** 2 + m.s * sa * sa + m.b * Math.max(0, -ca) ** 2) * DEG; };
    const dir = (th, a) => new THREE.Vector3(Math.sin(th) * Math.sin(a), Math.cos(th), Math.sin(th) * Math.cos(a));
    const at = (th, a, k) => dir(th, a).multiply(new THREE.Vector3(P.rx, P.ry, P.rz)).multiplyScalar(k);
    const N = seg(160, 96); const M = seg(48, 24);
    const NS = 18; // ränderna
    const ch = 12.5; // uppvikets höjd i enheter
    const hAt = (a, L) => ch / at(L, a, 1.1).length();
    // själva mössan: ett skal över hjässan, lite kupigt, tätt mot huvudet under uppviket
    const pos = []; const uv = []; const idx = [];
    for (let i = 0; i <= N; i++) {
      const a = i / N * 2 * Math.PI;
      const L = lim(a);
      const hth = hAt(a, L);
      for (let j = 0; j <= M; j++) {
        const t = j / M;
        const k = 1.085 + 0.035 * (1 - t) ** 1.5 + 0.012 * Math.sin(t * Math.PI) - 0.065 * (1 - THREE.MathUtils.smoothstep(L - t * L, 0.02, hth * 0.8));
        const p = at(t * L, a, k);
        pos.push(p.x, p.y, p.z);
        uv.push(i / N + 0.5 / NS, 1 - t);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j; const b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const stripes = canvasTex(NS * 32, 8, (c, w) => { for (let i = 0; i < NS; i++) { c.fillStyle = i % 2 ? C.bla : C.vit; c.fillRect(i * 32, 0, 32, 8); } });
    stripes.wrapS = THREE.RepeatWrapping;
    const kn = knitTex('v', 2, 2);
    kn.repeat.set(48, 14);
    const wool = { bumpMap: kn, bumpScale: 1.1, roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.3, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') };
    mesh(g, mat('#ffffff', { map: stripes, ...wool }), parent);
    // uppviket: ett rundat band längs kanten, nertill tätt mot pannan, med texten fram
    const cp = []; const cu = []; const ci = [];
    const n = 24;
    for (let i = 0; i <= N; i++) {
      const a = i / N * 2 * Math.PI;
      const L = lim(a);
      const hth = hAt(a, L);
      for (let j = 0; j <= n; j++) {
        const q = j / n * 2 * Math.PI;
        const cq = Math.cos(q); const sq = Math.sin(q);
        const f = 0.5 - Math.sign(cq) * Math.abs(cq) ** 0.4 / 2; // 0 nertill, 1 upptill
        const th = L + 0.012 - f * hth;
        const k = 1.014 + 0.062 * f + 0.031 + Math.sign(sq) * Math.abs(sq) ** 0.4 * 0.031;
        const p = at(th, a, k);
        cp.push(p.x, p.y, p.z);
        cu.push(i / N + 0.5, (1 - cq) / 2);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j; const b = a + n + 1; ci.push(a, b, a + 1, a + 1, b, b + 1); }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    cg.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2));
    cg.setIndex(ci);
    cg.computeVertexNormals();
    const img = skold[F.key];
    const PH = ch * 0.96; // märkets höjd och halva bredd i enheter
    const PW = img ? (PH - 1) * img.width / img.height / 2 + 0.5 : 0;
    const circ = 2 * Math.PI * P.rx * 1.12;
    const circF = 2 * Math.PI * Math.sin(lim(0)) * P.rx * 1.11; // omkretsen fram
    const cuffTex = canvasTex(2048, 128, (c, w, h) => {
      c.fillStyle = C.bla; c.fillRect(0, 0, w, h);
      c.fillStyle = C.vit; c.fillRect(0, 10, w, 7); c.fillRect(0, h - 17, w, 7);
      c.save();
      c.translate(w / 2, h / 2 + 3);
      const sx = (w / circ) / (h / ch);
      c.scale(sx, 1);
      c.font = '900 64px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      c.textBaseline = 'middle';
      // BLÅ och VITT på var sin sida om märket
      const gap = img ? (PW + 1.6) * w / circF / sx : 0;
      if (img) { c.textAlign = 'right'; c.fillText(m.text[0], -gap, 0); c.textAlign = 'left'; c.fillText(m.text[1], gap, 0); }
      else { c.textAlign = 'center'; c.fillText(m.text.join(''), 0, 0); }
      c.restore();
    });
    cuffTex.wrapS = THREE.RepeatWrapping;
    const rib = ribTex.clone();
    rib.repeat.set(140, 1);
    mesh(cg, mat('#ffffff', { map: cuffTex, ...wool, bumpMap: rib, bumpScale: 1.2 }), parent);
    // märket: skölden isydd mitt fram på uppviket, med en kant av guldtråd
    if (img) {
      const badge = canvasTex(256, Math.round(256 * PH / (2 * PW)), (c, w, h) => {
        const e = 256 * 0.5 / (2 * PW); // kanten (en halv enhet)
        const iw = w - 2 * e; const ih = h - 2 * e;
        const sil = document.createElement('canvas');
        sil.width = w; sil.height = h;
        const sc = sil.getContext('2d');
        sc.drawImage(img, e, e, iw, ih);
        sc.globalCompositeOperation = 'source-in';
        sc.fillStyle = C.guld; sc.fillRect(0, 0, w, h);
        for (let i = 0; i < 16; i++) { const a = i / 16 * 2 * Math.PI; c.drawImage(sil, Math.cos(a) * e * 0.9, Math.sin(a) * e * 0.9); }
        c.drawImage(img, e, e, iw, ih);
      });
      const bp = []; const bu = []; const bi = [];
      const NI = 24;
      const da = PW / (Math.sin(lim(0)) * P.rx * 1.11);
      for (let i = 0; i <= NI; i++) {
        const a = (i / NI * 2 - 1) * da;
        const L = lim(a);
        const hth = hAt(a, L);
        for (let j = 0; j <= NI; j++) {
          const f = 0.02 + 0.96 * j / NI;
          const p = at(L + 0.012 - f * hth, a, 1.083 + 0.062 * f);
          bp.push(p.x, p.y, p.z);
          bu.push(i / NI, j / NI);
        }
      }
      for (let i = 0; i < NI; i++) for (let j = 0; j < NI; j++) { const a = i * (NI + 1) + j; const b = a + NI + 1; bi.push(a, b, a + 1, a + 1, b, b + 1); }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
      bg.setAttribute('uv', new THREE.Float32BufferAttribute(bu, 2));
      bg.setIndex(bi);
      bg.computeVertexNormals();
      mesh(bg, mat('#ffffff', { map: badge, alphaTest: 0.5, bumpMap: badge, bumpScale: 0.8, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.2, polygonOffset: true, polygonOffsetFactor: -2 }), parent);
    }
    // tofsen: en lurvig boll av garn i båda färgerna
    const pg = new THREE.SphereGeometry(1, seg(64, 32), seg(48, 24));
    const pp = pg.attributes.position;
    const pc = [];
    const blue = new THREE.Color(C.bla); const white = new THREE.Color(C.vit);
    for (let i = 0; i < pp.count; i++) {
      const d = new THREE.Vector3(pp.getX(i), pp.getY(i), pp.getZ(i));
      const lump = 0.1 * Math.sin(d.x * 9 + 1) * Math.sin(d.y * 8 + 2) * Math.sin(d.z * 10) + 0.06 * Math.sin(d.x * 23 + d.y * 19 - d.z * 17) + 0.04 * Math.sin(d.x * 41 - d.z * 37 + d.y * 29);
      d.multiplyScalar(12 * (1 + lump));
      pp.setXYZ(i, d.x, d.y, d.z);
      const w = Math.sin(d.x * 0.9 + 0.4) * Math.sin(d.y * 1.1) * Math.sin(d.z * 0.8 + 1) > 0 ? white : blue;
      pc.push(w.r, w.g, w.b);
    }
    pg.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
    pg.computeVertexNormals();
    const yarn = knitTex('v', 6, 1);
    yarn.repeat.set(6, 4);
    const pom = mesh(pg, mat('#ffffff', { vertexColors: true, bumpMap: yarn, bumpScale: 2, roughness: 0.75, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff') }), parent);
    pom.position.copy(at(0.1, Math.PI, 1.135)).add(new THREE.Vector3(0, 6, 0));
    // solglasögonens plats: precis ovanför uppviket fram
    return at(m.f * DEG - ch / (P.ry * 0.9) - 0.12, 0, 1.14);
  }

  // ---------- sakerna: flaskan, cigaretten, askkoppen ----------

  // Gängets öl är Pripps Blå i 90-talets returflaska: grönt glas, marinblå
  // folie runt halsen, ett silverband snett över axeln och en silveretikett
  // med skeppet i en oval mellan två lejon (reklamfilmen från 1992 och flaskan
  // SLM 31192 i Sörmlands museum). Från första advent till tjugondag Knut står
  // det JULÖL och i påskveckan PÅSKÖL på samma flaska (ol i rum-fika.js).
  // Allt tryck ligger på en duk och alla flaskor delar geometrierna, så att en
  // flaska kostar två ritanrop.
  const OL = ol(opt.vader);
  const FLASKA = [[0, -24], [6.9, -24], [7.4, -23.4], [7.6, -22.4], [7.6, -0.3], [7.35, 2], [5.9, 7.5], [4.2, 11.9], [3.1, 15], [2.85, 17], [2.8, 23], [3.25, 23.4], [3.4, 24.5], [3.3, 26], [2.9, 26.4], [2.1, 26.4], [1.9, 23], [0, 23]];
  const flaskRadie = (y) => {
    for (let i = 5; i < 11; i++) {
      const [r0, y0] = FLASKA[i - 1]; const [r1, y1] = FLASKA[i];
      if (y <= y1) return r0 + (r1 - r0) * Math.max(0, (y - y0) / (y1 - y0));
    }
    return FLASKA[10][0];
  };
  // duken uppifrån: etiketten (y 0–276), axelbandet och halsfolien
  const FD = { w: 768, h: 352, etikett: [0, 276], axel: [282, 322], hals: [328, 352] };
  const ritaFolie = (g, w, h) => {
    const TAU = Math.PI * 2;
    const NAVY = '#12306e'; const GULD = '#c79f35'; const ROD = '#b3202a';
    const band = { jul: '#8a1d1f', pask: '#2e6a3c' }[OL] || '#1b47a0';
    const folie = { jul: '#8a1d1f', pask: '#2e6a3c' }[OL] || NAVY;
    const ord = { jul: 'JULÖL', pask: 'PÅSKÖL' }[OL] || 'BLÅ';
    g.setTransform(1, 0, 0, 1, 0, 0);
    const silver = g.createLinearGradient(0, 0, 0, FD.etikett[1]);
    silver.addColorStop(0, '#e9ecef'); silver.addColorStop(0.5, '#c6ccd2'); silver.addColorStop(1, '#e2e5e9');
    g.fillStyle = silver; g.fillRect(0, 0, w, h);
    const H = FD.etikett[1];
    g.fillStyle = folie; g.fillRect(0, 0, w, 6); g.fillRect(0, H - 6, w, 6);
    g.fillStyle = GULD; g.fillRect(0, 8, w, 3); g.fillRect(0, H - 11, w, 3);
    const lejon = (x, y, m) => {
      g.save(); g.translate(x, y); g.scale(m, 1);
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [c, e] of [['#6f5210', 3], [GULD, 0]]) {
        g.strokeStyle = g.fillStyle = c;
        const linje = (b, ...p) => { g.lineWidth = b + e; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
        // kroppen, manen, frambenen mot ovalen, bakbenen och svansen
        g.lineWidth = e; g.beginPath(); g.ellipse(-3, 7, 11 + e / 2, 23 + e / 2, 0.32, 0, TAU); g.fill();
        g.beginPath(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; const r = (i % 2 ? 18 : 14) + e / 2; g.lineTo(7 + r * Math.cos(a), -22 + r * Math.sin(a)); } g.closePath(); g.fill();
        linje(6, 6, -6, 26, -14, 31, -8);
        linje(6, 6, 2, 25, 6, 31, 2);
        linje(8, -9, 25, 4, 36, 11, 42);
        linje(8, -11, 26, -14, 41, -6, 47);
        g.lineWidth = 4 + e; g.beginPath(); g.moveTo(-11, 24); g.bezierCurveTo(-36, 26, -36, 0, -26, -10); g.stroke();
        g.beginPath(); g.arc(-25, -13, 5 + e / 2, 0, TAU); g.fill();
      }
      g.fillStyle = '#6f5210'; g.beginPath(); g.arc(11, -24, 1.6, 0, TAU); g.fill();
      g.restore();
    };
    const segel = (x, y, b, s) => {
      g.beginPath(); g.moveTo(x - b, y); g.quadraticCurveTo(x, y + s * 0.2, x + b, y);
      g.quadraticCurveTo(x + b * 1.3, y + s * 0.55, x + b * 1.05, y + s); g.quadraticCurveTo(x, y + s * 0.78, x - b * 1.05, y + s);
      g.quadraticCurveTo(x - b * 1.3, y + s * 0.55, x - b, y); g.fill();
    };
    for (const cx of [w * 0.25, w * 0.75]) {
      // den röda bågen överst, namnet
      g.fillStyle = ROD; g.beginPath(); g.moveTo(cx - 72, 39); g.quadraticCurveTo(cx, -4, cx + 72, 39); g.closePath(); g.fill();
      g.strokeStyle = GULD; g.lineWidth = 2.5; g.stroke();
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = NAVY; g.font = '800 42px Fraunces, Georgia, serif';
      if ('letterSpacing' in g) g.letterSpacing = '3px';
      g.fillText('PRIPPS', cx, 78);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      // lejonen och ovalen med skeppet
      lejon(cx - 92, 128, 1); lejon(cx + 92, 128, -1);
      const CY = 130;
      g.save();
      g.beginPath(); g.ellipse(cx, CY, 54, 46, 0, 0, TAU); g.fillStyle = NAVY; g.fill();
      g.clip();
      g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineWidth = 1.6;
      for (const [mx, t, b0] of [[-21, -33, 10], [2, -39, 12], [25, -31, 9]]) {
        g.beginPath(); g.moveTo(cx + mx, CY + t); g.lineTo(cx + mx, CY + 12); g.stroke();
        segel(cx + mx, CY + t + 4, b0 * 0.62, 10);
        segel(cx + mx, CY + t + 15, b0 * 0.82, 11);
        segel(cx + mx, CY + t + 27, b0, 12);
      }
      g.fillStyle = GULD;
      g.beginPath(); g.moveTo(cx - 44, CY + 7); g.lineTo(cx - 38, CY + 24); g.quadraticCurveTo(cx, CY + 31, cx + 34, CY + 24); g.lineTo(cx + 46, CY + 9); g.lineTo(cx + 14, CY + 15); g.lineTo(cx - 26, CY + 15); g.lineTo(cx - 30, CY + 7); g.closePath(); g.fill();
      g.strokeStyle = '#8fb6e8'; g.lineWidth = 2;
      for (const [yy, f] of [[CY + 31, 0], [CY + 38, 7]]) { g.beginPath(); for (let x = -60 + f; x < 60; x += 14) { g.moveTo(cx + x, yy); g.quadraticCurveTo(cx + x + 7, yy - 5, cx + x + 14, yy); } g.stroke(); }
      g.restore();
      g.strokeStyle = GULD; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, CY, 54, 46, 0, 0, TAU); g.stroke();
      // bandet med BLÅ
      g.fillStyle = band;
      g.beginPath(); g.moveTo(cx - 96, 180); g.lineTo(cx + 96, 180); g.lineTo(cx + 84, 203); g.lineTo(cx + 96, 228); g.lineTo(cx - 96, 228); g.lineTo(cx - 84, 203); g.closePath(); g.fill();
      g.strokeStyle = GULD; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#ffffff'; g.font = `800 ${ord.length > 3 ? 36 : 44}px Fraunces, Georgia, serif`; g.textBaseline = 'middle';
      g.fillText(ord, cx, 205);
      g.fillStyle = NAVY; g.font = '700 16px Fraunces, Georgia, serif'; g.textBaseline = 'alphabetic';
      g.fillText('KLASS I  ·  ANNO 1828', cx, 253);
    }
    // axelbandet: bokstäverna breddas, duken har fler punkter på längden
    const [a0, a1] = FD.axel;
    g.fillStyle = '#d7dbe0'; g.fillRect(0, a0, w, a1 - a0);
    g.fillStyle = folie; g.fillRect(0, a0, w, 4); g.fillRect(0, a1 - 4, w, 4);
    g.fillStyle = NAVY; g.font = '800 22px Fraunces, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const namn = `PRIPPS ${ord}`;
    for (let i = 0; i < 3; i++) {
      g.save(); g.translate((i + 0.5) * w / 3, (a0 + a1) / 2 + 1); g.scale(1.75, 1); g.fillText(namn, 0, 0); g.restore();
    }
    // halsfolien med en guldkant upptill och nedtill
    const [h0, h1] = FD.hals;
    g.fillStyle = folie; g.fillRect(0, h0, w, h1 - h0);
    g.fillStyle = GULD; g.fillRect(0, h0, w, 2); g.fillRect(0, h1 - 2, w, 2);
  };
  const folieTex = canvasTex(FD.w, FD.h, ritaFolie);
  const flaskGeo = new THREE.LatheGeometry(FLASKA.map(([x, y]) => new THREE.Vector2(x, y)), 24);
  // en yta runt flaskan: rad(v, u) ger y för raden v (0–1 uppifrån) och r ger radien
  const folieGeo = (() => {
    const pos = []; const uv = []; const ix = [];
    const yta = (rader, y, r, [p0, p1]) => {
      const n = 24; const b = pos.length / 3;
      for (let j = 0; j <= rader; j++) for (let i = 0; i <= n; i++) {
        const u = i / n; const v = j / rader; const a = (u - 0.25) * Math.PI * 2;
        const yy = y(v, a); const rr = r(yy);
        pos.push(rr * Math.sin(a), yy, rr * Math.cos(a));
        uv.push(u, 1 - (p0 + (p1 - p0) * v) / FD.h);
      }
      for (let j = 0; j < rader; j++) for (let i = 0; i < n; i++) {
        const A = b + j * (n + 1) + i; const B = A + n + 1;
        ix.push(A, B, A + 1, B, B + 1, A + 1);
      }
    };
    yta(1, (v) => -2.8 - 17.4 * v, () => 7.72, FD.etikett);
    yta(2, (v, a) => 10.4 - 3.2 * v + 1.9 * Math.sin(a + 0.5), (y) => flaskRadie(y) + 0.1, FD.axel);
    yta(3, (v) => 23.1 - 11.3 * v, (y) => flaskRadie(y) + 0.07, FD.hals);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(ix);
    g.computeVertexNormals();
    return g;
  })();
  const folieMat = mat('#ffffff', { map: folieTex, metalness: 0.55, roughness: 0.34, clearcoat: 0.4, envMapIntensity: 1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#143a18', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.88, envMapIntensity: 1.2 });
  function bottle(parent) {
    const g = new THREE.Group();
    parent.add(g);
    mesh(flaskGeo, glass, g);
    g.userData.folie = mesh(folieGeo, folieMat, g);
    g.userData.top = 26;
    g.userData.bottom = -24;
    return g;
  }
  // en flaska som står stilla vänder etiketten mot rummet, ungefär: figurens och
  // flaskans vridning ska inte gömma skeppet i kanten
  const framsida = (b, fig) => {
    const q = new THREE.Quaternion().setFromEuler(fig.rotation).multiply(b.quaternion);
    const x = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const z = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    b.userData.folie.rotation.y = Math.atan2(x.z, z.z) + 0.22 * Math.sin(b.position.x * 1.7 + b.position.z);
  };
  const ember = new THREE.MeshBasicMaterial({ color: '#ff6a24' });
  const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,180,90,1)'); gr.addColorStop(0.4, 'rgba(255,90,30,.5)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  // cigaretten längs x: filtret vid −x, glöden vid +x
  function cigarette(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const paper = mesh(new THREE.CylinderGeometry(1.25, 1.25, 15, 14), mat('#f4f1ea', { roughness: 0.7 }), g);
    paper.rotation.z = Math.PI / 2; paper.position.x = 1.5;
    const filt = mesh(new THREE.CylinderGeometry(1.3, 1.3, 6, 14), mat('#d9924a', { roughness: 0.7 }), g);
    filt.rotation.z = Math.PI / 2; filt.position.x = -9;
    const ash = mesh(new THREE.CylinderGeometry(1.2, 1.1, 2.2, 12), mat('#9a948a', { roughness: 1 }), g);
    ash.rotation.z = Math.PI / 2; ash.position.x = 10;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 8), ember.clone());
    tip.position.x = 9.6; g.add(tip);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 }));
    halo.scale.set(10, 10, 1); halo.position.x = 9.8; g.add(halo);
    g.userData = { tip, halo, end: new THREE.Vector3(11, 0, 0), filter: new THREE.Vector3(-12, 0, 0) };
    return g;
  }
  // kupongpennan längs x, spetsen vid +x – gul, så att den syns mot händerna
  // och tröjorna
  const PEN_TIP = 11.6;
  const PEN_END = -9;
  function pencil(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const along = (x, geo, m) => { const e = mesh(geo, m, g); e.rotation.z = -Math.PI / 2; e.position.x = x; return e; };
    along(0, new THREE.CylinderGeometry(1.05, 1.05, 15, 6), mat('#e8b52c', { roughness: 0.4, clearcoat: 0.5 }));
    along(9.3, new THREE.ConeGeometry(1.05, 3.6, 6), mat('#e2c08c', { roughness: 0.75 }));
    along(10.9, new THREE.ConeGeometry(0.32, 1.4, 8), mat('#2a2a2a', { roughness: 0.4 }));
    along(-8.2, new THREE.CylinderGeometry(1.12, 1.12, 1.6, 12), mat('#9a978f', { metalness: 0.6, roughness: 0.35 }));
    return g;
  }
  // kupongen: ett litet papper, tryckt på båda sidorna (texturerna ritas när
  // typsnitten har laddats, se nedan)
  const KW = 34;
  const KH = 24;
  const kupTex = {};
  function coupon(parent) {
    const g = new THREE.Group();
    parent.add(g);
    const paper = { roughness: 0.85, clearcoat: 0, envMapIntensity: 0.3 };
    mesh(new THREE.PlaneGeometry(KW, KH), mat('#ffffff', { map: kupTex.fram, ...paper }), g).position.z = 0.06;
    const back = mesh(new THREE.PlaneGeometry(KW, KH), mat('#ffffff', { map: kupTex.bak, ...paper }), g);
    back.position.z = -0.06;
    back.rotation.y = Math.PI;
    return g;
  }
  function drawCoupon(g, w, h, back) {
    g.fillStyle = '#f3e9d4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8643a'; g.fillRect(0, 0, w, 34);
    g.fillStyle = '#f6ecd9'; g.textBaseline = 'middle';
    g.font = '800 17px Fraunces, Georgia, serif';
    g.fillText(back ? 'MATCHFIXARNA' : 'TIPSKUPONG', 14, 18);
    if (back) {
      g.fillStyle = 'rgba(90, 70, 40, 0.28)';
      for (let i = 0; i < 6; i++) g.fillRect(14, 52 + i * 20, i % 3 === 2 ? 120 : 220, 5);
      return;
    }
    g.strokeStyle = '#9a876a'; g.lineWidth = 1.6;
    for (let r = 0; r < 8; r++) {
      const y = 44 + r * 16.5;
      g.fillStyle = 'rgba(70, 58, 40, 0.45)'; g.fillRect(14, y + 4, 70 + (r * 37) % 50, 4);
      for (let c = 0; c < 3; c++) g.strokeRect(160 + c * 30, y, 22, 12);
    }
    // två tveksamma kryss och ett suddat
    g.strokeStyle = '#3a3632'; g.lineWidth = 2.4; g.lineCap = 'round';
    for (const [c, r, a] of [[0, 1, 1], [2, 3, 1], [1, 5, 0.25]]) {
      g.globalAlpha = a;
      const x = 160 + c * 30; const y = 44 + r * 16.5;
      g.beginPath(); g.moveTo(x + 3, y + 2); g.lineTo(x + 19, y + 10); g.moveTo(x + 19, y + 2); g.lineTo(x + 3, y + 10); g.stroke();
    }
    g.globalAlpha = 1;
  }

  // ---------- händerna ----------
  // Byggda i handens egna axlar och placerade varje bild:
  //   grepp: fingrarna runt något längs y (flaskan), handryggen mot +z;
  //   nyp:   vante med fingrarna längs +y och cigaretten i topparna, längs x;
  //   vila:  vante som vilar, fingrarna längs +y, handflatan mot −z.
  function hand(kind, q, skin, parent, r0 = 7.6) {
    const g = new THREE.Group();
    parent.add(g);
    if (kind === 'grepp') {
      const back = mesh(new RoundedBoxGeometry(q * 2.3, q * 2.6, q * 1.3, 4, q * 0.55), skin, g);
      back.position.set(0, 0, r0 + q * 0.5);
      for (let i = 0; i < 4; i++) {
        const f = mesh(new THREE.TorusGeometry(r0 + q * 0.32, q * 0.36, 10, 24, Math.PI * 1.05), skin, g);
        f.rotation.x = Math.PI / 2;
        f.rotation.z = -Math.PI * 0.02 + Math.PI;
        f.position.y = (i - 1.5) * q * 0.72;
      }
      capsule([q * 0.9, q * 0.8, r0 + q * 0.2], [q * 0.4, q * 1.6, -r0 * 0.4], q * 0.42, skin, g);
      g.userData.wrist = new THREE.Vector3(0, -q * 0.3, r0 + q * 1.2);
    } else {
      ellipsoid([0, q * 1.1, 0], [q * 0.62, q * 1.3, q * 1.05], skin, g);
      ellipsoid([-q * 0.12, q * 2.25, 0], [q * 0.55, q * 0.95, q * 0.98], skin, g, [0, 0, 0.25]);
      capsule([q * 0.15, q * 0.7, -q * 0.75], [q * 0.4, q * 1.7, -q * 1.02], q * 0.36, skin, g);
      g.userData.wrist = new THREE.Vector3(0, 0, 0);
    }
    return g;
  }

  // Handen med fingrar, till tecknen (rum-tecken.js): samma axlar som vila
  // (fingrarna längs +y, handflatan mot −z, handleden i origo), med tummen åt s.
  // Byggs första gången den behövs. Fyra fingrar i två leder och tummen; leden
  // är grupper som tecknet vrider (fingrar).
  function fingerHand(q, skin, parent, s) {
    const g = new THREE.Group();
    parent.add(g);
    const led = (par, x, y, z, len, rad) => {
      const j = new THREE.Group();
      j.position.set(x, y, z);
      par.add(j);
      mesh(new THREE.CapsuleGeometry(rad, len, seg(4, 2), seg(14, 8)), skin, j).position.y = len / 2;
      return j;
    };
    const flata = mesh(new RoundedBoxGeometry(q * 2.2, q * 2.05, q * 1.12, seg(4, 2), q * 0.46), skin, g);
    flata.position.y = q * 1.02;
    const fing = [[0.8, 0.84, 0.74, 0.32], [0.27, 0.92, 0.8, 0.33], [-0.27, 0.86, 0.74, 0.32], [-0.79, 0.68, 0.6, 0.29]].map(([x, l1, l2, r]) => {
      const a = led(g, s * x * q, q * 2, 0, l1 * q, r * q);
      return { a, b: led(a, 0, l1 * q, 0, l2 * q, r * q * 0.95) };
    });
    const a = led(g, s * q * 0.94, q * 0.82, -q * 0.12, q * 0.86, q * 0.37);
    const tum = { a, b: led(a, 0, q * 0.86, 0, q * 0.72, q * 0.34) };
    g.userData = { wrist: new THREE.Vector3(0, 0, 0), fing, tum, s };
    g.visible = false;
    return g;
  }
  const TUM = new THREE.Vector3();
  // Ställer fingrarna (blanda, rum-tecken.js).
  function fingrar(H, x) {
    const { fing, tum, s } = H.userData;
    fing.forEach((f, i) => {
      f.a.rotation.set(-x.f[i] * 1.62, 0, s * x.sp[i]);
      f.b.rotation.x = -x.f[i] * 1.95;
    });
    tum.a.quaternion.setFromUnitVectors(UP, TUM.set(s * x.tu[0], x.tu[1], x.tu[2]).normalize());
    tum.b.rotation.x = -x.tb;
  }

  // ---------- kläderna efter vädret ----------

  // flanellens rutor: mörka band över tygets färg (map gånger färgen)
  const plaidTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(24,18,18,.62)'; g.fillRect(0, 44, 128, 40); g.fillRect(44, 0, 40, 128);
    g.fillStyle = 'rgba(24,18,18,.35)'; g.fillRect(0, 104, 128, 6); g.fillRect(104, 0, 6, 128);
    g.fillStyle = 'rgba(255,236,210,.3)'; g.fillRect(0, 20, 128, 3); g.fillRect(20, 0, 3, 128);
  });
  plaidTex.colorSpace = THREE.NoColorSpace;
  const plaid = (rx, ry) => { const t = plaidTex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return t; };
  // jackans tyg: matt bomull och parkas, blankt skinn, glänsande nylon (dun, regn), rutig flanell,
  // sammet (nyårskavajen)
  function jackMat(J, extra = {}) {
    const o = {
      bomull: { roughness: 0.62, clearcoat: 0.3, bumpMap: denim, bumpScale: 0.5 },
      parka: { roughness: 0.72, clearcoat: 0.25, bumpMap: knit, bumpScale: 0.4 },
      skinn: { roughness: 0.32, clearcoat: 0.75, clearcoatRoughness: 0.28, bumpMap: knit, bumpScale: 0.25 },
      dun: { roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.16 },
      regn: { roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 },
      flanell: { roughness: 0.82, clearcoat: 0.12, sheen: 0.5, sheenRoughness: 0.7, map: plaid(5, 3) },
      sammet: { roughness: 0.8, clearcoat: 0.05, sheen: 1, sheenRoughness: 0.35, bumpMap: knit, bumpScale: 0.15 },
    }[J.tyg] || {};
    return mat(J.farg, { side: J.typ === 'oppen' ? THREE.DoubleSide : THREE.FrontSide, ...o, ...extra });
  }
  const edgeMat = (J) => mat(J.farg2, { roughness: J.tyg === 'regn' || J.tyg === 'dun' || J.tyg === 'skinn' ? 0.28 : 0.62, clearcoat: 0.5 });
  const snowMat = mat('#f4f7fa', { roughness: 0.9, clearcoat: 0, sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff') });

  // Jackan: ett skal utanpå tröjan (bålens profil, lite vidare och längre),
  // öppen fram med kanterna markerade eller stängd med dragkedja; dunjackan
  // har kanaler. Krage, luva och pälskant efter J. Ger profilen tillbaka, så
  // att halsduken kan ligga utanpå.
  function jacka(F, J, chest) {
    const Wd = F.w; const T = F.torso; const sz = F.depth / Wd;
    const tk = J.tunn ? 0.4 : J.tjock || 1;
    const base = [[0.86, -0.04], [0.89, 0.1], [0.93, 0.45], [1, 0.75], [1.03, 0.86], [0.95, 0.96], [0.64, 1.02], [0.38, 1.05]];
    const rAt = (h) => { for (let i = 1; i < base.length; i++) if (h <= base[i][1]) { const [a0, b0] = base[i - 1]; const [a1, b1] = base[i]; return a0 + (a1 - a0) * (h - b0) / (b1 - b0); } return base[base.length - 1][0]; };
    const pts = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const h = base[0][1] + (base[base.length - 1][1] - base[0][1]) * i / N;
      let r = rAt(h) * Wd + 2.6 + 1.6 * tk;
      if (J.tyg === 'dun') r += 1.6 * Math.sqrt(tk) * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * (h + 0.04) / 0.17), 0.6) * (h < 0.97 ? 1 : 0.3);
      pts.push(new THREE.Vector2(r, h * T));
    }
    const open = J.typ === 'oppen';
    const gap = open ? 0.34 : 0;
    const m = jackMat(J);
    const edge = edgeMat(J);
    mesh(new THREE.LatheGeometry(pts, seg(120, 56), gap, 2 * Math.PI - 2 * gap), m, chest).scale.z = sz;
    // en tub längs skalet: lodrätt vid vinkeln phi, eller vågrätt runt på höjden y
    const at = (phi, r, y) => new THREE.Vector3(Math.sin(phi) * r, y, Math.cos(phi) * r * sz);
    const tube = (list, rad, mt) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(list), Math.max(24, list.length * 3), rad, 8, false), mt, chest);
    const around = (i, off, rad, mt) => tube(Array.from({ length: 41 }, (_, j) => at(gap + (2 * Math.PI - 2 * gap) * j / 40, pts[i].x + off, pts[i].y)), rad, mt);
    if (open) for (const s of [-1, 1]) tube(pts.filter((_, i) => i % 3 === 0).map((p) => at(s * gap, p.x + 0.4, p.y)), 1.7, edge);
    else {
      tube(pts.filter((_, i) => i % 3 === 0).map((p) => at(0, p.x + 0.5, p.y)), 0.8, mat('#1a1a1c', { roughness: 0.4, metalness: 0.4 }));
      const pull = mesh(new RoundedBoxGeometry(2.6, 4.2, 1.2, 2, 0.5), mat('#9a9a96', { metalness: 0.8, roughness: 0.3 }), chest);
      pull.position.copy(at(0, pts[N - 4].x + 1.6, pts[N - 4].y - 3));
    }
    around(0, 0.4, 1.6 + 0.3 * tk, edge);
    // kragen: nedvikt på den öppna, en hög krage på den stängda
    const top = pts[N];
    if (J.krage) {
      const cp = open ? [new THREE.Vector2(top.x - 1, top.y), new THREE.Vector2(top.x + 5, top.y + 4)] : [new THREE.Vector2(top.x - 0.5, top.y - 1), new THREE.Vector2(F.neckR + 5, top.y + 9)];
      mesh(new THREE.LatheGeometry(cp, seg(64, 32), gap * 0.8, 2 * Math.PI - 1.6 * gap), mat(J.tyg === 'flanell' ? J.farg : J.farg2, { side: THREE.DoubleSide, roughness: 0.55, clearcoat: 0.4 }), chest).scale.z = sz;
    } else around(N, 0.3, 1.5, edge);
    // luvan nedfälld på ryggen, och pälskanten runt halsen
    if (J.luva) ellipsoid([0, T * 1.0, -(F.depth * 0.62 + 4)], [Wd * 0.48, 10, 9], m, chest);
    if (J.luva === 'pals') {
      const fg = new THREE.TorusGeometry(F.neckR + 7.5, 5, seg(14, 8), seg(64, 32));
      const fp = fg.attributes.position;
      for (let i = 0; i < fp.count; i++) { const x = fp.getX(i); const y = fp.getY(i); const z = fp.getZ(i); const k = 1 + 0.08 * Math.sin(x * 1.7 + y * 2.3) * Math.sin(z * 3.1 + x); fp.setXYZ(i, x * k, y * k, z * k); }
      fg.computeVertexNormals();
      const fur = mesh(fg, mat('#8d7c64', { roughness: 1, clearcoat: 0, sheen: 1, sheenRoughness: 0.9, sheenColor: new THREE.Color('#e8dcc8'), bumpMap: knit, bumpScale: 3 }), chest);
      fur.rotation.x = Math.PI / 2;
      fur.position.y = T * 1.04;
      fur.scale.y = sz * 1.15;
    }
    // fickor på bomullsjackan och parkasen
    if (J.tyg === 'bomull' || J.tyg === 'parka') {
      for (const s of [-1, 1]) {
        const y = T * 0.26; const x = s * Wd * 0.52; const r = rAt(0.26) * Wd + 2.6 + 1.6 * tk;
        const flap = mesh(new RoundedBoxGeometry(Wd * 0.42, 5, 1.6, 2, 0.6), edge, chest);
        flap.position.set(x, y, Math.sqrt(Math.max(0, r * r - x * x)) * sz + 0.6);
        flap.rotation.y = Math.atan2(x, Math.sqrt(Math.max(0, r * r - x * x)) * sz) * 0.9;
      }
    }
    return pts;
  }

  // högtidskläderna (rum-fest.js)
  const FEST = festklader({ mat, mesh, seg, canvasTex, ellipsoid, band, headGeo });

  // ---------- figurerna ----------

  const tex = {};
  const skold = {}; // lagsköldarna, utan den genomskinliga kanten; saknas en blir det text i stället
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  function trim(img) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width; let y0 = c.height; let x1 = 0; let y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 16) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const o = document.createElement('canvas');
    o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext('2d').drawImage(c, -x0, -y0);
    return o;
  }
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('800 42px Fraunces').catch(() => {}),
    ...['dl', 'dt', 'dj'].map(async (k) => { tex[k] = await imgTex(`rum/ansikte-${k}.svg`); }),
    // ansiktena med ögonen stängda (blinkar, och DJ när han sover), som en
    // blob-adress som släpps när bilden är ritad
    ...(opt.calm ? ['dj'] : ['dl', 'dt', 'dj']).map((k) => fetch(`rum/ansikte-${k}.svg`).then((x) => x.text()).then(async (svg) => {
      const s = blundar(svg);
      if (!s) return;
      const u = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
      try { tex[`${k}_blund`] = await imgTex(u); } finally { URL.revokeObjectURL(u); }
    }).catch(() => {})),
    // ansiktena när de skrattar (skrattar), och DJ:s skägg med munnen öppen
    ...['dl', 'dj'].map((k) => fetch(`rum/ansikte-${k}.svg`).then((x) => x.text()).then(async (svg) => {
      const s = skrattar(svg, SKRATT_MUN[k]);
      if (!s) return;
      const u = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
      try { tex[`${k}_skratt`] = await imgTex(u); } finally { URL.revokeObjectURL(u); }
    }).catch(() => {})),
    fetch('rum/skagg-dj.svg').then((x) => x.text()).then(async (svg) => {
      const u = URL.createObjectURL(new Blob([skaggSkratt(svg)], { type: 'image/svg+xml' }));
      try { tex.dj_skagg_skratt = await imgTex(u); } finally { URL.revokeObjectURL(u); }
    }).catch(() => {}),
    imgTex('rum/skagg-dj.svg').then((t) => { tex.dj_skagg = t; }),
    // bilderna som text, för ansiktsuttrycken (ansikten)
    ...['dl', 'dt', 'dj'].map((k) => fetch(`rum/ansikte-${k}.svg`).then((x) => x.text()).then((s) => { ANS.svg[k] = s; }).catch(() => {})),
    fetch('rum/skagg-dj.svg').then((x) => x.text()).then((s) => { ANS.svg.skagg = s; }).catch(() => {}),
    ...Object.entries(LAG).filter(([, c]) => c.skold).map(([k, c]) => loadImg(c.skold).then((i) => { skold[k] = trim(i); }, () => {})),
  ]);
  // ansiktena efter hur det gick senast, redan från början (opt.senast, opt.spel)
  await ansikten(ansiktsLage(ANS.spel, ANS.senast));
  ritaFolie(folieTex.image.getContext('2d'), FD.w, FD.h);
  folieTex.needsUpdate = true;
  kupTex.fram = canvasTex(260, 180, (g, w, h) => drawCoupon(g, w, h, false));
  kupTex.bak = canvasTex(260, 180, (g, w, h) => drawCoupon(g, w, h, true));

  // ---------- barbordet och barstolarna ----------

  const krom = mat('#d8d8d4', { metalness: 1, roughness: 0.18, envMapIntensity: 1.3 });
  const vinyl = mat('#8b2e2a', { roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.6 });
  const som = mat('#c9b18a', { roughness: 0.8 });
  // Barbordet (BORD): en rund skiva av ljust laminat med ringar efter
  // glasen, kromkant och en kromfot som slutar under pulten.
  const lam = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e9dfc8';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = ['rgba(150,60,50,.22)', 'rgba(70,80,90,.18)', 'rgba(120,100,70,.2)'][i % 3];
      g.fillRect(hash(i) * w, hash(i + 0.5) * h, 1 + hash(i + 0.25) * 2.5, 1 + hash(i + 0.75) * 1.5);
    }
    g.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = `rgba(110,72,30,${0.1 + hash(i + 40) * 0.08})`;
      g.beginPath();
      g.arc(110 + hash(i + 41) * 290, 110 + hash(i + 42) * 290, 15, 0, 2 * Math.PI);
      g.stroke();
    }
  });
  const bord = new THREE.Group();
  bord.position.set(BORD.x, SILL + BORD.y, BORD.z);
  root.add(bord);
  mesh(new THREE.CylinderGeometry(BORD.r, BORD.r, 3, 96), [krom, mat('#ffffff', { map: lam, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.2 }), krom], bord).position.y = -1.5;
  mesh(new THREE.CylinderGeometry(BORD.r + 0.6, BORD.r + 0.6, 5, 96, 1, true), krom, bord).position.y = -2.2;
  ring([0, 0.1, 0], [0, 1, 0], BORD.r + 0.4, 0.9, krom, bord);
  mesh(new THREE.CylinderGeometry(15, 6, 6, 32), krom, bord).position.y = -8;
  mesh(new THREE.CylinderGeometry(4.5, 4.5, 320, 24), krom, bord).position.y = -170;
  bord.add(pennkopp());

  // Fotbollens yta mellan polvinklarna t0 och t0 + tl (pennkoppen), w × h bildpunkter.
  function bollTex(t0, tl, w, h) {
    // bollen ritas punkt för punkt ur ytan den hamnar på: femhörningarna
    // runt ikosaederns hörn, sexhörningarna runt dodekaederns, och sömmar där
    // två möts (kvoten mellan ytornas avstånd från mitten, 1,0265)
    const f = (1 + Math.sqrt(5)) / 2;
    const cyc = ([a, b, c]) => [[a, b, c], [b, c, a], [c, a, b]];
    const tecken = (v) => v.reduce((ut, a) => ut.flatMap((o) => (a ? [[...o, a], [...o, -a]] : [[...o, a]])), [[]]);
    const riktn = (l) => l.map((v) => new THREE.Vector3(...v).normalize());
    const fem = riktn(cyc([0, 1, f]).flatMap(tecken));
    const sex = riktn([...tecken([1, 1, 1]), ...cyc([0, f, 1 / f]).flatMap(tecken)]);
    const vrid = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4, 0.9, 0.2));
    return canvasTex(w, h, (c) => {
      const bild = c.createImageData(w, h);
      const p = new THREE.Vector3();
      for (let py = 0; py < h; py++) {
        const th = t0 + ((py + 0.5) / h) * tl;
        for (let px = 0; px < w; px++) {
          const ph = ((px + 0.5) / w) * 2 * Math.PI;
          p.set(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th)).applyQuaternion(vrid);
          let a5 = -1;
          let a6 = -1;
          let b6 = -1;
          for (const n of fem) a5 = Math.max(a5, p.dot(n));
          for (const n of sex) {
            const d = p.dot(n);
            if (d > a6) { b6 = a6; a6 = d; } else if (d > b6) b6 = d;
          }
          a5 *= 1.0265;
          const svart = a5 > a6;
          const som = Math.min(Math.abs(a5 - a6), svart ? 1 : a6 - b6) < 0.012;
          const v = som ? 70 : svart ? 34 : 238;
          const i = (py * w + px) * 4;
          bild.data[i] = v + (svart ? 0 : 4);
          bild.data[i + 1] = v + (svart ? 0 : 2);
          bild.data[i + 2] = v;
          bild.data[i + 3] = 255;
        }
      }
      c.putImageData(bild, 0, 0);
    });
  }

  // Pennkoppen: en kopp formad som en fotboll, med en gul blyertspenna med
  // suddgummi, en röd penna (den som rättar kupongerna) och en blå
  // kulspetspenna. Den står fram till vänster på bordet (KOPP, i bordets
  // axlar): där skymmer den inget som står på bordet, hur de än sitter
  // (PLATSER), och den är inte i vägen för tårtan. Två ritanrop: bollen, och
  // pennorna och kanten i en geometri med färgerna i hörnen.
  function pennkopp() {
    const { x, z, r } = KOPP;
    const T0 = 0.3 * Math.PI;
    const TL = Math.PI - T0;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const y0 = r - 1;
    mesh(new THREE.SphereGeometry(r, 28, 12, 0, 2 * Math.PI, T0, TL), mat('#ffffff', { map: bollTex(T0, TL, 256, 128), roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.15, side: THREE.DoubleSide }), g).position.y = y0;
    // pennorna längs y från botten, lutade utåt åt var sitt håll
    const delar = [];
    const del = (geo, farg, m) => delar.push([geo, farg, m]);
    const kant = r * Math.sin(T0);
    del(new THREE.TorusGeometry(kant, 0.45, 6, 32), '#efece4', new THREE.Matrix4().compose(new THREE.Vector3(0, y0 + r * Math.cos(T0), 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2), new THREE.Vector3(1, 1, 1)));
    const penna = (vinkel, lut, delarna) => {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(vinkel), 0, -Math.sin(vinkel)), lut);
      const ut = new THREE.Vector3(Math.sin(vinkel), 0, Math.cos(vinkel));
      const fot = ut.multiplyScalar(-3.5).setY(1.2);
      let y = 0;
      for (const [geo, farg, langd, sid = 0] of delarna) {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(sid, y + langd / 2, 0).applyQuaternion(q).add(fot), q, new THREE.Vector3(1, 1, 1));
        del(geo, farg, m);
        if (!sid) y += langd;
      }
    };
    // blyertspennan: sexkantig, spetsen nere i koppen och suddet upp
    penna(-1.9, 0.33, [
      [new THREE.CylinderGeometry(1.5, 1.5, 30, 6), '#e8b52c', 30],
      [new THREE.CylinderGeometry(1.6, 1.6, 2.4, 10), '#9a978f', 2.4],
      [new THREE.CylinderGeometry(1.45, 1.5, 2.2, 10), '#e58c93', 2.2],
    ]);
    // den röda: rund kropp, mörkare hatt med en klämma
    penna(1.3, 0.3, [
      [new THREE.CylinderGeometry(1.6, 1.6, 22, 10), '#c3262f', 22],
      [new THREE.CylinderGeometry(1.8, 1.8, 7.5, 10), '#8e1820', 7.5],
      [new THREE.BoxGeometry(0.6, 6, 1.1), '#d8d8d4', -6.5, 1.95],
      [new THREE.CylinderGeometry(1.1, 1.8, 1.2, 10), '#8e1820', 1.2],
    ]);
    // kulspetspennan: vit kropp och blå ände, något bakåt
    penna(3.1, 0.16, [
      [new THREE.CylinderGeometry(1.45, 1.45, 26, 6), '#f1ede4', 26],
      [new THREE.CylinderGeometry(1.5, 1.5, 5, 10), '#2456b8', 5],
      [new THREE.BoxGeometry(0.6, 5.5, 1), '#2456b8', -6, 1.75],
      [new THREE.SphereGeometry(1.5, 10, 5, 0, 2 * Math.PI, 0, Math.PI / 2), '#2456b8', 0],
    ]);
    const pos = [];
    const nor = [];
    const col = [];
    for (const [geo, farg, m] of delar) {
      const e = geo.toNonIndexed().applyMatrix4(m);
      const c = new THREE.Color(farg);
      pos.push(...e.attributes.position.array);
      nor.push(...e.attributes.normal.array);
      for (let i = 0; i < e.attributes.position.count; i++) col.push(c.r, c.g, c.b);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    pg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    mesh(pg, mat('#ffffff', { vertexColors: true, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.2 }), g);
    return g;
  }

  // ---------- radion ----------
  // En kassettradio (80-tal) på fönsterbänkens högra ände, under löpsedlarna (RADIO_PLATS): där står
  // inget annat hur de än sitter (DJ:s tomflaskor står till vänster om den). Ett klick går fram till
  // den (sak i rum.js), och där ställer man in FM och AM (rum-radio.js, som säger vad som gäller med
  // radioLage). Stationsskalan lyser med en glödlampa, stationsspaken sitter på samma ställe som visaren
  // under skalan, bandspaken slår över mellan FM och AM, POWER-knappen går in, lysdioderna och högtalarna
  // följer det som hörs och stationerna man har hittat står för hand på maskeringstejpen vid skalan
  // (radioEtiketter, radioSkriv). Så länge det är musik sjunger gänget (radioSang) och noter stiger ur
  // den (radioRita).
  const RADIO_PLATS = { x: 127, z: 8, vrid: -0.38 };
  // en lampa: mellan släckt och tänd (lys), utan tonkurvan, som annars gör starkt ljus vitt
  const lampa = (pa, av) => {
    const m = new THREE.MeshBasicMaterial({ color: av, toneMapped: false });
    m.userData.pa = new THREE.Color(pa);
    m.userData.av = new THREE.Color(av);
    return m;
  };
  const lys = (m, v) => m.color.copy(m.userData.av).lerp(m.userData.pa, Math.min(1, Math.max(0, v)));
  const vrid = (m, x = 0, y = 0, z = 0) => { m.rotation.set(x, y, z); return m; };
  const RB3 = (w, h, d, r, n = 3) => new RoundedBoxGeometry(w, h, d, n, r);
  // en teleskopantenn från p, lutad (a: åt sidan, b: bakåt), med en kula i toppen
  function antenn(g, p, len, a, b) {
    const ant = new THREE.Group();
    ant.position.set(...p);
    ant.rotation.set(-b, 0, a);
    g.add(ant);
    [[0.75, 0], [0.6, len * 0.4], [0.45, len * 0.75]].forEach(([r, y0], i) => { mesh(new THREE.CylinderGeometry(r, r, len * (i ? 0.4 : 0.45), 8), krom, ant).position.y = y0 + len * 0.2; });
    mesh(new THREE.SphereGeometry(1, 10, 6), krom, ant).position.y = len * 1.1;
  }
  // Måtten i modellens enheter, med botten i y = 0 och fronten mot +z. SK: lika bred som den alltid har
  // varit i rummet. Visaren går mellan sx0 (p = 0) och sx1 (p = 1).
  const RM = {
    W: 64, H: 39.8, D: 11, F: 5.5, SK: 0.816,
    gx0: -30, gx1: 30, gy0: 27.4, gy1: 33.8,
    sx0: -25.8, sx1: 28.2,
    tf: [33.95, 37.35], ta: [23.85, 27.25],
    skena: { y: 22.65, h: 1.05 },
    hog: 21.5,
    ratt: { x: -9, y: 5, r: 2.85 },
    kraft: { x: 0, y: 4.5, w: 5.4, h: 4.8 },
    bspak: { x: 9, y: 5, w: 6.4, h: 7.4 },
  };
  // RL: det som rum-radio.js säger (band, sist: bandspaken, p: visaren 0–1, vol, s: hur väl stationen tas
  // in, lampa, niva: det som hörs) och där delarna är just nu (in: POWER, bV: bandspaken).
  const RL = { band: 'av', sist: 'fm', p: 0.14, vol: 0.55, s: 0, lampa: 0, niva: null, lampaNu: 0, sNu: 0, ledNu: 0, sen: null, in: 0, bV: -1, nara: false, naraV: 0, fin: 0, bytt: false };
  const FONT = 'Arial, Helvetica, sans-serif';
  // Dukar som ritas om större när kameran går fram (radioFin): rita(c, w, h) ska rita efter måtten.
  const RDUKAR = [];
  const rduk = (w, h, rita) => {
    const t = canvasTex(w, h, rita);
    t.anisotropy = 8;
    t.userData.rita = rita;
    RDUKAR.push(t);
    return t;
  };
  // Stationsskalan. lys: det som lyser (den valda bandraden starkast), annars tryckfärgen.
  function ritaSkala(c, w, h, lys) {
    const band = RL.sist;
    const B = (window.RumRadio && RumRadio.BAND) || { fm: { fran: 87.5, till: 108.5 }, am: { fran: 520, till: 1620 } };
    const X = (b, f) => (((RM.sx0 + ((f - B[b].fran) / (B[b].till - B[b].fran)) * (RM.sx1 - RM.sx0)) - RM.gx0) / (RM.gx1 - RM.gx0)) * w;
    c.fillStyle = lys ? '#000' : '#0a0a0c';
    c.fillRect(0, 0, w, h);
    if (lys) {
      // glödlampans sken bakom glaset, varmast på mitten och med lite ljus i kanterna
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#2c1503');
      g.addColorStop(0.2, '#7a4209');
      g.addColorStop(0.5, '#a65e10');
      g.addColorStop(0.8, '#7a4209');
      g.addColorStop(1, '#2c1503');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      const v = c.createLinearGradient(0, 0, 0, h);
      v.addColorStop(0, 'rgba(0,0,0,0.55)');
      v.addColorStop(0.5, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = v;
      c.fillRect(0, 0, w, h);
    }
    const farg = (b) => (lys ? (b === band ? '#fff6e2' : '#6a4a22') : (b === band ? '#c9c4b8' : '#8c887e'));
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const rad = (b, yTal, y0, y1, toppar, sma, tal) => {
      c.strokeStyle = c.fillStyle = farg(b);
      c.lineWidth = Math.max(1, h * 0.012);
      c.beginPath();
      for (let f = toppar[0]; f <= toppar[1]; f += sma) {
        const k = Math.abs(f / (sma * 2) - Math.round(f / (sma * 2))) < 1e-6;
        const x = X(b, f);
        c.moveTo(x, y0);
        c.lineTo(x, k ? y1 : y0 + (y1 - y0) * 0.55);
      }
      c.stroke();
      c.font = `700 ${Math.round(h * 0.2)}px ${FONT}`;
      for (const [f, s] of tal) c.fillText(s, X(b, f), yTal);
    };
    rad('fm', h * 0.2, h * 0.47, h * 0.33, [88, 108], 1, [88, 92, 96, 100, 104, 108].map((f) => [f, String(f)]));
    rad('am', h * 0.8, h * 0.53, h * 0.67, [550, 1600], 50, [600, 700, 800, 900, 1000, 1200, 1400, 1600].map((f) => [f, String(f / 100)]));
    // bandens namn och enheterna längst till vänster
    c.textAlign = 'left';
    for (const [b, y] of [['fm', 0.25], ['am', 0.75]]) {
      c.fillStyle = farg(b);
      c.font = `800 ${Math.round(h * 0.21)}px ${FONT}`;
      c.fillText(b.toUpperCase(), w * 0.012, h * y - h * 0.045);
      c.font = `600 ${Math.round(h * 0.09)}px ${FONT}`;
      c.fillText(b === 'fm' ? 'MHz' : '×100 kHz', w * 0.012, h * y + h * 0.1);
    }
    // lampan som säger att stationen stämmer (tuneLed) sitter längst till höger
    c.textAlign = 'center';
    c.fillStyle = lys ? '#6a4a22' : '#8c887e';
    c.font = `600 ${Math.round(h * 0.085)}px ${FONT}`;
    c.fillText('TUNE', w * 0.984, h * 0.66);
  }
  const SKALA = rduk(512, 62, (c, w, h) => ritaSkala(c, w, h, false));
  const SKALA_LYS = rduk(512, 62, (c, w, h) => ritaSkala(c, w, h, true));
  SKALA_LYS.colorSpace = THREE.SRGBColorSpace;
  // Tejpen vid skalan: FM ovanför, AM under, med stationerna för hand i två rader, varannan närmast
  // skalan. Varje station har sin plats från början (tejpPlats), så att det som redan står inte flyttar
  // sig när en ny skrivs dit.
  const TEJP = { rutor: { fm: [], am: [] }, hittade: new Set(), skrivs: null };
  function tejpPlats(band, c, w, h) {
    const l = TEJP.rutor[band];
    const fs = Math.round(h * 0.47);
    c.font = `700 ${fs}px Caveat, cursive`;
    const utx = (p) => (((RM.sx0 + p * (RM.sx1 - RM.sx0)) - RM.gx0) / (RM.gx1 - RM.gx0)) * w;
    const lucka = fs * 0.32;
    const rad = l.map((e) => ({ e, x: utx(e.p), b: c.measureText(e.kort).width })).sort((a, b) => a.x - b.x);
    rad.forEach((a, i) => { a.r = i % 2; });
    for (const r of [0, 1]) {
      const denna = rad.filter((a) => a.r === r);
      let v = w * 0.012;
      for (const a of denna) { a.c = Math.max(a.x, v + a.b / 2); v = a.c + a.b / 2 + lucka; }
      let h1 = w * 0.988;
      for (const a of [...denna].reverse()) { a.c = Math.min(a.c, h1 - a.b / 2); h1 = a.c - a.b / 2 - lucka; }
    }
    return { rad, fs };
  }
  function ritaTejp(band, c, w, h) {
    c.clearRect(0, 0, w, h);
    // en ojämn remsa med rivna ändar
    const f = band === 'fm' ? 0.37 : 0.91;
    c.beginPath();
    c.moveTo(w * 0.004, h * 0.06);
    for (let i = 1; i <= 8; i++) c.lineTo(w * (0.002 + 0.004 * hash(i * f)), h * (0.06 + 0.11 * i));
    c.lineTo(w * (0.996 - 0.003 * hash(f * 3)), h * 0.94);
    for (let i = 7; i >= 0; i--) c.lineTo(w * (0.994 + 0.004 * hash(i * f + 9)), h * (0.06 + 0.11 * i));
    c.closePath();
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f1e7cc');
    g.addColorStop(0.5, '#ebdfbf');
    g.addColorStop(1, '#e2d5b1');
    c.fillStyle = g;
    c.fill();
    // fibrer, och där tummen har varit
    c.save();
    c.clip();
    c.globalAlpha = 0.06;
    c.fillStyle = '#6a5a3a';
    for (let i = 0; i < 90; i++) c.fillRect(hash(i + f) * w, hash(i * 2.1 + f) * h, w * 0.01 * (0.3 + hash(i)), Math.max(1, h * 0.02));
    c.globalAlpha = 0.035;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(hash(i * 3.3 + f) * w, hash(i * 1.7 + f) * h, w * 0.03, h * 0.7, 0, 0, 7); c.fill(); }
    c.restore();
    const { rad, fs } = tejpPlats(band, c, w, h);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineCap = 'round';
    const penna = band === 'fm' ? '#1b2a66' : '#7a1f1a';
    // (y uppifrån: r 0 närmast skalan, som ligger under FM-tejpen och över AM-tejpen)
    const upp = band === 'fm';
    const radY = (r) => (upp === (r === 0) ? h * 0.74 : h * 0.29);
    for (const a of rad) {
      if (!TEJP.hittade.has(a.e.id)) continue;
      const nu = TEJP.skrivs && TEJP.skrivs.id === a.e.id ? TEJP.skrivs.u : 1;
      // strecket mot skalan, sedan namnet från vänster till höger. Står namnet nära sin frekvens och
      // det är fritt går strecket fram till det, annars är det bara en liten bock vid kanten.
      const fot = upp ? h * 0.98 : h * 0.02;
      const dx = Math.max(-fs * 0.8, Math.min(fs * 0.8, a.c - a.x));
      const fritt = a.r === 1 && Math.abs(a.c - a.x) < fs * 0.8 && !rad.some((n) => n.r === 0 && Math.abs(n.c - a.x - dx / 2) < n.b / 2 + 2 && TEJP.hittade.has(n.e.id));
      const hals = upp ? (fritt ? h * 0.47 : h * 0.93) : (fritt ? h * 0.53 : h * 0.07);
      c.strokeStyle = penna;
      c.lineWidth = Math.max(1, h * 0.03);
      const u1 = Math.min(1, nu * 4);
      c.beginPath();
      c.moveTo(a.x, fot);
      c.lineTo(a.x + (fritt ? dx : Math.sign(dx) * Math.min(fs * 0.3, Math.abs(dx))) * u1, fot + (hals - fot) * u1);
      c.stroke();
      if (nu <= 0.25) continue;
      c.save();
      c.beginPath();
      c.rect(a.c - a.b / 2 - 2, 0, (a.b + 4) * Math.min(1, (nu - 0.25) / 0.75), h);
      c.clip();
      c.fillStyle = penna;
      c.font = `700 ${fs}px Caveat, cursive`;
      c.fillText(a.e.kort, a.c, radY(a.r) + (hash(a.x) - 0.5) * h * 0.06);
      c.restore();
    }
  }
  const TEJPF = rduk(512, 29, (c, w, h) => ritaTejp('fm', c, w, h));
  const TEJPA = rduk(512, 29, (c, w, h) => ritaTejp('am', c, w, h));
  // Kassetten bakom luckan: grå med handskriven etikett, två spolar och bandet som syns i fönstret.
  const KASSETT = rduk(128, 56, (c, w, h) => {
    c.fillStyle = '#34353a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ece4cf';
    c.fillRect(w * 0.05, h * 0.07, w * 0.9, h * 0.62);
    c.fillStyle = '#c7372e';
    c.fillRect(w * 0.05, h * 0.07, w * 0.9, h * 0.07);
    c.strokeStyle = 'rgba(40,50,110,0.28)';
    c.lineWidth = Math.max(1, h * 0.008);
    c.beginPath();
    for (const y of [0.3, 0.4]) { c.moveTo(w * 0.09, h * y); c.lineTo(w * 0.91, h * y); }
    c.stroke();
    c.fillStyle = '#1b2a66';
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.font = `700 ${Math.round(h * 0.17)}px Caveat, cursive`;
    c.fillText('Blandband', w * 0.1, h * 0.285);
    // fönstret med spolarna
    c.fillStyle = '#17171a';
    c.fillRect(w * 0.26, h * 0.43, w * 0.48, h * 0.22);
    for (const [x, r] of [[0.33, 0.1], [0.67, 0.075]]) {
      c.fillStyle = '#4a3320';
      c.beginPath(); c.arc(w * x, h * 0.54, h * r * 1.15, 0, 7); c.fill();
    }
    for (const x of [0.33, 0.67]) {
      c.fillStyle = '#e8e4da';
      c.beginPath(); c.arc(w * x, h * 0.54, h * 0.065, 0, 7); c.fill();
      c.fillStyle = '#17171a';
      c.beginPath(); c.arc(w * x, h * 0.54, h * 0.03, 0, 7); c.fill();
    }
    // bandets väg nederst
    c.fillStyle = '#26272b';
    c.beginPath();
    c.moveTo(w * 0.14, h);
    c.lineTo(w * 0.2, h * 0.76);
    c.lineTo(w * 0.8, h * 0.76);
    c.lineTo(w * 0.86, h);
    c.fill();
    c.fillStyle = '#6a6a6e';
    for (const x of [0.28, 0.5, 0.72]) { c.beginPath(); c.arc(w * x, h * 0.88, h * 0.022, 0, 7); c.fill(); }
  });
  // Text i tryck på fronten: en liten duk per text (bredd efter texten).
  function tryck(parent, text, x, y, z, hojd, o = {}) {
    const px = 44;
    const font = `${o.vikt || 700} ${px}px ${o.font || FONT}`;
    const mat0 = document.createElement('canvas').getContext('2d');
    mat0.font = font;
    const b = Math.ceil(mat0.measureText(text).width) + 12;
    const t = canvasTex(b, px + 12, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.font = font;
      c.fillStyle = o.farg || '#d8d4c8';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, w / 2, h / 2 + 2);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry((b / (px + 12)) * hojd, hojd), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  // En ratt: räfflad kant, borstad topp och ett märke, som vrids med .rotation.z.
  const RFINT = [];
  function ratt(parent, x, y, r, skalaDuk) {
    const F = RM.F;
    if (skalaDuk) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.5, r * 2.5), new THREE.MeshBasicMaterial({ map: skalaDuk, transparent: true, depthWrite: false }));
      m.position.set(x, y, F + 0.34);
      parent.add(m);
      m.visible = false;
      RFINT.push(m);
    }
    const g = new THREE.Group();
    g.position.set(x, y, F + 0.3);
    parent.add(g);
    const kant = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, 2.1, 36), mat('#a7a9ac', { metalness: 0.92, roughness: 0.38, flatShading: true }));
    kant.rotation.x = Math.PI / 2;
    kant.position.z = 1.05;
    g.add(kant);
    const topp = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 32), mat('#ffffff', { map: RATT_TOPP, metalness: 0.85, roughness: 0.34 }));
    topp.position.z = 2.13;
    g.add(topp);
    RFINT.push(topp);
    topp.visible = false;
    const krage = new THREE.Mesh(new THREE.TorusGeometry(r * 0.88, r * 0.05, 6, 32), krom);
    krage.position.z = 2.12;
    g.add(krage);
    RFINT.push(krage);
    krage.visible = false;
    const marke = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, r * 0.52, 0.06), mat('#141416', { roughness: 0.6 }));
    marke.position.set(0, r * 0.55, 2.17);
    g.add(marke);
    RFINT.push(marke);
    marke.visible = false;
    return g;
  }
  const RATT_TOPP = canvasTex(192, 192, (c, w, h) => {
    const g = c.createConicGradient(0.6, w / 2, h / 2);
    for (let i = 0; i <= 12; i++) g.addColorStop(i / 12, i % 2 ? '#6e7074' : '#b4b6b9');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  // Prickarna runt volymratten.
  const RATT_SKALA = canvasTex(128, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#c8c4b8';
    for (let i = 0; i <= 10; i++) {
      const a = (-135 + i * 27) * (Math.PI / 180);
      c.beginPath();
      c.arc(w / 2 + Math.sin(a) * w * 0.46, h / 2 - Math.cos(a) * h * 0.46, w * (i % 5 ? 0.009 : 0.015), 0, 7);
      c.fill();
    }
  });
  // Borstad aluminium runt skalan.
  const BORSTAT = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#afb2b7';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      c.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(30,32,38,0.05)';
      c.fillRect(hash(i * 2.11) * w - 40, hash(i * 1.37) * h, 60 + hash(i * 3.3) * 260, 1);
    }
  });
  // Högtalargallret: svart plåt med hål i förband.
  const GALLER = canvasTex(512, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#25262a';
    c.beginPath();
    c.arc(w / 2, h / 2, w / 2, 0, 7);
    c.fill();
    c.globalCompositeOperation = 'destination-out';
    const s = w / 44;
    let rad = 0;
    for (let y = s / 2; y < h; y += s * 0.866) {
      for (let x = rad % 2 ? s / 2 : 0; x < w; x += s) {
        c.beginPath();
        c.arc(x, y, s * 0.33, 0, 7);
        c.fill();
      }
      rad++;
    }
    c.globalCompositeOperation = 'source-over';
  });
  // Spakens mjuka skugga på fronten.
  const SPAKSKUGGA = canvasTex(64, 64, (c, w, h) => {
    const v = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    v.addColorStop(0, 'rgba(0,0,0,0.6)');
    v.addColorStop(0.5, 'rgba(0,0,0,0.28)');
    v.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = v;
    c.fillRect(0, 0, w, h);
  });
  // En avlång spalt med runda ändar.
  function pille(w, h) {
    const r = h / 2;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -r);
    s.lineTo(w / 2 - r, -r);
    s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
    s.lineTo(-w / 2 + r, r);
    s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    return new THREE.ShapeGeometry(s, 8);
  }
  function kassettradio() {
    const g = new THREE.Group();
    const k = new THREE.Group();
    k.scale.setScalar(RM.SK);
    g.add(k);
    const { W, H, D: Dd, F } = RM;
    // (småsakerna kastar inga skuggor: det är lådan som syns i rummet, och närbilden ska vara lätt)
    const del = (geo, m, p = k) => { const x = new THREE.Mesh(geo, m); p.add(x); return x; };
    // det som inte syns på håll ritas bara på väg fram och nära (radioDetalj): radion är några tiotal
    // bildpunkter bred i rummet, och varje del är en ritning till i varje bild
    const fint = (x) => { x.visible = false; RFINT.push(x); return x; };
    const silver = mat('#c6c9cd', { metalness: 0.4, roughness: 0.46, envMapIntensity: 0.3 });
    const svart = mat('#141417', { roughness: 0.5 });
    const plast = mat('#2a2b30', { metalness: 0.5, roughness: 0.4 });
    const kropp = mesh(RB3(W, H, Dd, 2.5), silver, k);
    kropp.position.y = H / 2;
    // den borstade plåten runt skalan, och en kromlist mot fronten
    const plat = fint(del(new THREE.PlaneGeometry(W - 5.2, H - 2.5 - 20.9), mat('#ffffff', { map: BORSTAT, metalness: 0.55, roughness: 0.46 })));
    plat.position.set(0, (20.9 + H - 2.5) / 2, F + 0.012);
    fint(del(new THREE.BoxGeometry(W - 3.4, 0.28, 0.14), krom)).position.set(0, 20.95, F + 0.32);
    // den svarta fronten med högtalarna och kassettdelen
    del(RB3(W - 3, 19.6, 1, 0.6), svart).position.set(0, 11, F - 0.2);
    const pump = [];
    const koner = canvasTex(8, 96, (c, w, h) => {
      for (let i = 0; i < h; i++) { c.fillStyle = i % 12 < 2 ? '#3a3a3d' : `hsl(240,2%,${13 + (i / h) * 7}%)`; c.fillRect(0, i, w, 1); }
    });
    const konMat = mat('#ffffff', { map: koner, roughness: 0.85, side: THREE.DoubleSide });
    const kapMat = mat('#37373b', { roughness: 0.28, metalness: 0.45 });
    const gallerMat = mat('#ffffff', { map: GALLER, transparent: true, depthWrite: false, metalness: 0.55, roughness: 0.5 });
    for (const x of [-21.5, 21.5]) {
      // en kromring som står ut, med gallret, membranet och dammkåpan i (membranet går i takten)
      fint(del(new THREE.CircleGeometry(7.5, 40), gallerMat)).position.set(x, 11, F + 1.4);
      const ring = vrid(del(new THREE.TorusGeometry(8.1, 0.82, 10, 40), krom));
      ring.position.set(x, 11, F + 1.05);
      const kant = vrid(del(new THREE.TorusGeometry(7.3, 0.42, 6, 36), mat('#141416', { roughness: 0.7 })));
      kant.position.set(x, 11, F + 0.95);
      const kon = vrid(del(new THREE.CylinderGeometry(7.2, 2.5, 1.5, 30, 1, true), konMat), Math.PI / 2);
      kon.position.set(x, 11, F + 0.32);
      const kapa = del(new THREE.SphereGeometry(2.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), kapMat);
      kapa.rotation.x = Math.PI / 2;
      kapa.scale.y = 0.5;
      kapa.position.set(x, 11, F - 0.42);
      pump.push(kon, kapa);
    }
    // kassettluckan: ram, kassetten bakom glas och märket över
    del(RB3(20.4, 10, 0.9, 0.4), mat('#28292d', { roughness: 0.4, metalness: 0.5 })).position.set(0, 15.6, F + 0.05);
    const kas = del(new THREE.PlaneGeometry(16.6, 7.3), mat('#ffffff', { map: KASSETT, roughness: 0.7 }));
    kas.position.set(0, 14.7, F + 0.52);
    const lucka = fint(del(new THREE.PlaneGeometry(17.6, 8), mat('#a8b0bc', { transparent: true, opacity: 0.2, metalness: 0.9, roughness: 0.08, depthWrite: false, envMapIntensity: 1.2 })));
    lucka.position.set(0, 14.7, F + 0.6);
    fint(tryck(k, 'SHARP', -6.3, 19.55, F + 0.54, 1.25, { vikt: 800 }));
    fint(tryck(k, 'STEREO RADIO CASSETTE', 3.6, 19.55, F + 0.54, 0.72, { vikt: 600, farg: '#a8a59c' }));
    // lysdioderna i en svart ränna: gröna, sedan gula och en röd
    fint(del(RB3(11.6, 1.08, 0.2, 0.08, 1), mat('#050506', { roughness: 0.55 }))).position.set(0, 9.55, F + 0.3);
    const led = ['#35f068', '#35f068', '#35f068', '#35f068', '#35f068', '#ffc832', '#ffc832', '#ff3a2e'].map((c, i) => lampa(c, i < 5 ? '#0d2a16' : i < 7 ? '#2e2408' : '#30100c'));
    led.forEach((m, i) => { fint(del(new THREE.BoxGeometry(1.08, 0.66, 0.3), m)).position.set(-4.75 + i * 1.357, 9.55, F + 0.34); });
    // volymratten till vänster
    const R0 = RM.ratt;
    const vol = ratt(k, R0.x, R0.y, R0.r, RATT_SKALA);
    fint(tryck(k, 'VOLUME', R0.x, 9.42, F + 0.34, 0.72, { vikt: 700, farg: '#a8a59c' }));
    // POWER i mitten, med en lampa över: knappen stannar inne när radion är på
    const K0 = RM.kraft;
    fint(del(RB3(K0.w + 0.7, K0.h + 0.7, 0.5, 0.24, 2), plast)).position.set(K0.x, K0.y, F + 0.42);
    const kraft = new THREE.Group();
    kraft.position.set(K0.x, K0.y, F + 0.72);
    k.add(kraft);
    del(RB3(K0.w, K0.h, 2, 0.42, 2), mat('#8e1c19', { roughness: 0.36 }), kraft);
    const kraftText = fint(tryck(kraft, 'POWER', 0, 0.05, 1.03, 1.05, { vikt: 800, farg: '#ffffff' }));
    const kraftLed = lampa('#ff4a36', '#3a0d0a');
    fint(del(new THREE.CircleGeometry(0.42, 16), kraftLed)).position.set(K0.x, K0.y + K0.h / 2 + 1.05, F + 0.36);
    // spakarna: krom med en kula i änden, framåt (+z) från vridpunkten
    const kula = mat('#d2481c', { roughness: 0.34, envMapIntensity: 0.25 });
    const spakDelar = (p, len, r) => {
      const stam = new THREE.CylinderGeometry(r * 0.26, r * 0.4, len, 12);
      stam.rotateX(Math.PI / 2);
      stam.translate(0, 0, len / 2);
      fint(del(stam, krom, p));
      const krage = fint(del(new THREE.CylinderGeometry(r * 0.46, r * 0.46, r * 0.36, 16), krom, p));
      krage.rotation.x = Math.PI / 2;
      krage.position.z = len + r * 0.1;
      fint(del(new THREE.SphereGeometry(r, 28, 20), kula, p)).position.z = len + r * 0.86;
    };
    // bandspaken till höger: FM upp och AM ner, i en lodrät spalt
    const B0 = RM.bspak;
    fint(del(RB3(B0.w, B0.h, 0.5, 0.24, 2), plast)).position.set(B0.x, B0.y, F + 0.42);
    const BX = B0.x - 1.1;
    const spalt = fint(del(pille(4.2, 1), mat('#050506', { roughness: 0.7 })));
    spalt.rotation.z = Math.PI / 2;
    spalt.position.set(BX, B0.y, F + 0.68);
    const bandSkugga = fint(del(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: SPAKSKUGGA, transparent: true, depthWrite: false })));
    bandSkugga.position.set(BX + 0.25, B0.y, F + 0.69);
    const bsp = new THREE.Group();
    bsp.position.set(BX, B0.y, F + 0.6);
    k.add(bsp);
    spakDelar(bsp, 3.1, 0.95);
    const fmT = fint(tryck(k, 'FM', BX + 2.75, B0.y + 1.85, F + 0.7, 1.15, { vikt: 800, farg: '#ffffff' }));
    const amT = fint(tryck(k, 'AM', BX + 2.75, B0.y - 1.85, F + 0.7, 1.15, { vikt: 800, farg: '#ffffff' }));
    fint(tryck(k, 'BAND', B0.x, 9.42, F + 0.34, 0.72, { vikt: 700, farg: '#a8a59c' }));
    // stationsspaken: en skena under skalan och en spak på samma ställe som visaren, som lutar ner mot fronten
    const S0 = RM.skena;
    const sL = RM.sx0 - 1.9;
    const sR = RM.sx1 + 1.9;
    // (kanten är en hel yta bakom spalten: tunna lister blir streckade i telefonen)
    fint(del(pille(sR - sL + 0.46, S0.h + 0.46), mat('#8f9195', { metalness: 0.7, roughness: 0.38 }))).position.set((sL + sR) / 2, S0.y, F + 0.02);
    del(pille(sR - sL, S0.h), mat('#08080a', { roughness: 0.65 })).position.set((sL + sR) / 2, S0.y, F + 0.03);
    fint(tryck(k, 'TUNING', sL + 2.1, RM.hog, F + 0.04, 0.72, { vikt: 700, farg: '#3a3b40' }));
    const spak = new THREE.Group();
    spak.position.set(0, S0.y, F + 0.06);
    k.add(spak);
    // (skuggan ligger på fronten nedanför kulan)
    const spakSkugga = fint(del(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: SPAKSKUGGA, transparent: true, depthWrite: false }), spak));
    spakSkugga.position.set(0.5, -3.7, 0.52);
    // vagnen i skenan och ett streck upp mot skalan, i visarens färg
    fint(del(RB3(3.4, S0.h + 0.42, 0.7, 0.2, 2), plast, spak)).position.z = 0.26;
    const stamV = new THREE.Group();
    stamV.rotation.x = 0.62;
    stamV.position.z = 0.3;
    spak.add(stamV);
    spakDelar(stamV, 4.4, 1.4);
    fint(del(new THREE.PlaneGeometry(0.3, 0.72), new THREE.MeshBasicMaterial({ color: '#ff5a1c', toneMapped: false }), spak)).position.set(0, S0.h / 2 + 0.42, 0.04);
    // skalan: ram, tryck, visare, glas
    del(RB3(RM.gx1 - RM.gx0 + 1.2, RM.gy1 - RM.gy0 + 0.8, 0.8, 0.35), mat('#141416', { roughness: 0.4 })).position.set(0, (RM.gy0 + RM.gy1) / 2, F);
    const skalaM = mat('#ffffff', { map: SKALA, roughness: 0.32, emissive: new THREE.Color('#ffffff'), emissiveMap: SKALA_LYS, emissiveIntensity: 0, envMapIntensity: 0.2 });
    const skala = del(new THREE.PlaneGeometry(RM.gx1 - RM.gx0, RM.gy1 - RM.gy0), skalaM);
    skala.position.set(0, (RM.gy0 + RM.gy1) / 2, F + 0.42);
    const nalM = lampa('#ff4a12', '#8a2a10');
    const nal = del(new THREE.BoxGeometry(0.3, RM.gy1 - RM.gy0 - 0.5, 0.08), nalM);
    nal.position.set(0, (RM.gy0 + RM.gy1) / 2, F + 0.5);
    const glas = fint(del(new THREE.PlaneGeometry(RM.gx1 - RM.gx0, RM.gy1 - RM.gy0), mat('#d8e0e8', { transparent: true, opacity: 0.1, metalness: 1, roughness: 0.06, depthWrite: false, envMapIntensity: 1.6 })));
    glas.position.set(0, (RM.gy0 + RM.gy1) / 2, F + 0.6);
    // skenet runt visaren, som är det som syns av lampan
    const sken = new THREE.Sprite(new THREE.SpriteMaterial({
      map: canvasTex(64, 64, (c, w, h) => {
        const v = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        v.addColorStop(0, 'rgba(255,170,70,0.75)');
        v.addColorStop(0.4, 'rgba(255,130,40,0.2)');
        v.addColorStop(1, 'rgba(255,110,20,0)');
        c.fillStyle = v;
        c.fillRect(0, 0, w, h);
      }),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    }));
    sken.scale.set(9, 9, 1);
    sken.position.set(0, (RM.gy0 + RM.gy1) / 2, F + 0.46);
    k.add(sken);
    // stationen stämmer: en liten röd lampa längst till höger i skalan
    const tuneLed = lampa('#ff2a18', '#3a0d0a');
    fint(del(new THREE.CircleGeometry(0.42, 14), tuneLed)).position.set(29.05, (RM.gy0 + RM.gy1) / 2 + 0.25, F + 0.48);
    // tejpen
    const remsa = (duk, [y0, y1], vr) => {
      const m = del(new THREE.PlaneGeometry(RM.gx1 - RM.gx0, y1 - y0), mat('#ffffff', { map: duk, roughness: 0.78, alphaTest: 0.5, envMapIntensity: 0.25 }));
      m.position.set(0, (y0 + y1) / 2, F + 0.03);
      m.rotation.z = vr;
      return m;
    };
    remsa(TEJPF, RM.tf, 0.0016);
    remsa(TEJPA, RM.ta, -0.0012);
    // kassettdelens tangenter ovanpå, handtaget med sitt grepp och antennen
    const tangent = (i) => { const b = new THREE.BoxGeometry(2.6, 1.4, 3.2); b.translate(-7.6 + i * 3, H + 0.5, 1); return b; };
    del(tangent(0), mat('#c4232c'));
    del(mergeGeometries([1, 2, 3, 4, 5].map(tangent)), svart);
    const stolpar = [-18, 18].map((x) => { const m = mesh(new THREE.CylinderGeometry(0.9, 0.9, 6, 8), krom, k); m.position.set(x, H + 3, -1.5); return m; });
    const handtag = vrid(mesh(new THREE.CylinderGeometry(1.3, 1.3, 37, 10), krom, k), 0, 0, Math.PI / 2);
    handtag.position.set(0, H + 6, -1.5);
    fint(vrid(del(new THREE.CylinderGeometry(1.62, 1.62, 21, 18), mat('#141417', { roughness: 0.82 })), 0, 0, Math.PI / 2)).position.set(0, H + 6, -1.5);
    antenn(k, [W / 2 - 4, H, -3], 32, -0.35, 0.1);
    return { g, k, led, pump, vol, spak, bsp, fmT, amT, kraft, kraftText, kraftLed, nal, nalM, skalaM, sken, tuneLed, traff: [kropp, handtag, ...stolpar] };
  }
  const RADIO = kassettradio();
  RADIO.g.position.set(RADIO_PLATS.x, SILL, RADIO_PLATS.z);
  RADIO.g.rotation.y = RADIO_PLATS.vrid;
  root.add(RADIO.g);
  for (const m of RADIO.pump) m.userData.z0 = m.position.z;
  // (på väg fram till radion och nära)
  function radioDetalj(pa) {
    RL.nara = Boolean(pa);
    for (const x of RFINT) x.visible = Boolean(pa);
    if (opt.calm && opt.rita) opt.rita();
  }
  function radioLage(x) {
    const bytt = (x.band && x.band !== RL.band) || (x.sist && x.sist !== RL.sist);
    Object.assign(RL, x);
    if (bytt) {
      SKALA.userData.rita(SKALA.image.getContext('2d'), SKALA.image.width, SKALA.image.height);
      SKALA_LYS.userData.rita(SKALA_LYS.image.getContext('2d'), SKALA_LYS.image.width, SKALA_LYS.image.height);
      SKALA.needsUpdate = SKALA_LYS.needsUpdate = true;
    }
    // (utan rörelser ritas bara en bild när något har hänt)
    if (opt.calm && opt.rita) opt.rita();
  }
  const tejpOm = (band) => {
    const d = band === 'fm' ? TEJPF : TEJPA;
    d.userData.rita(d.image.getContext('2d'), d.image.width, d.image.height);
    d.needsUpdate = true;
  };
  // alla: { id, band, p, kort } för varje station, hittade: id:n
  function radioEtiketter(alla, hittade) {
    TEJP.rutor = { fm: alla.filter((e) => e.band === 'fm'), am: alla.filter((e) => e.band === 'am') };
    TEJP.hittade = new Set(hittade);
    tejpOm('fm');
    tejpOm('am');
  }
  // en ny station skrivs dit, med pennan
  function radioSkriv(id, t) {
    if (TEJP.skrivs) tejpOm(TEJP.skrivs.band);
    const band = TEJP.rutor.fm.some((e) => e.id === id) ? 'fm' : 'am';
    TEJP.hittade.add(id);
    TEJP.skrivs = { id, band, at: t, u: opt.calm ? 1 : 0 };
    tejpOm(band);
    if (opt.calm) TEJP.skrivs = null;
  }
  // Dukarna ritas om så stora som närbilden visar dem (px: radions bredd i bildpunkter), en gång.
  async function radioFin(px) {
    const k = Math.min(4, 2 ** Math.ceil(Math.log2(Math.max(1, px / 512))));
    if (k <= RL.fin) return;
    RL.fin = k;
    try { await Promise.all(['700 40px Caveat'].map((f) => document.fonts.load(f))); } catch (e) { /* då med reservtypsnittet */ }
    if (k < RL.fin) return;
    for (const t of RDUKAR) {
      const c = t.image;
      if (t.userData.w0 == null) { t.userData.w0 = c.width; t.userData.h0 = c.height; }
      c.width = t.userData.w0 * k;
      c.height = t.userData.h0 * k;
      t.userData.rita(c.getContext('2d'), c.width, c.height);
      t.dispose();
      t.needsUpdate = true;
    }
    if (opt.rita) opt.rita();
  }
  // Noterna som stiger ur radion när den spelar: ♪ och ♫ som gungar åt sidan och bleknar
  // (stilla med minskad rörelse).
  const NOTER = ['♪', '♫', '♪', '♬', '♪'].map((tecken, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      // (ljus med en tjock mörk kant: syns mot löpsedlarna och mot väggen)
      map: rduk(96, 96, (c, w, h) => {
        c.clearRect(0, 0, w, h);
        c.font = `bold ${Math.round(h * 0.79)}px serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineJoin = 'round';
        c.lineWidth = h / 8;
        c.strokeStyle = '#2e1c0c';
        c.strokeText(tecken, w / 2, h / 2 + h / 24);
        c.fillStyle = '#fff1c8';
        c.fillText(tecken, w / 2, h / 2 + h / 24);
      }),
      transparent: true,
      depthWrite: false,
      opacity: 0,
    }));
    sp.userData.i = i;
    root.add(sp);
    return sp;
  });
  // hur mycket radion spelar vid t (0–1, en halv sekund att tändas och släckas)
  const radioW = (t) => { const R = SJUNG.radio; const k = sm(R.at, R.at + 0.5, t); return R.pa ? k : 1 - k; };
  function radioRita(t) {
    const w = radioW(t);
    const R = SJUNG.radio;
    const dt = RL.sen == null ? 0 : Math.max(0, Math.min(0.25, t - RL.sen));
    RL.sen = t;
    // (mot målet med en tidskonstant; utan rörelser och i en fast bild direkt)
    const mot = (a, b, k) => (opt.calm || !dt ? b : a + (b - a) * (1 - Math.exp(-dt * k)));
    // (pumpar i sångens takt, två gånger per gungning, eller dansens)
    const sang = radioSang(t);
    const slag = Math.max(0, Math.cos((t - (sang ? sang.t0 : R.fran)) * (sang && AKTER[sang.namn].per ? (2 * Math.PI) / AKTER[sang.namn].per : TAKT * 2))) ** 4 * w;
    // det som hörs (utan ljud, ?rum-radio, sångens takt)
    const n = RL.band !== 'av' && RL.niva ? RL.niva() : null;
    const bas = n ? n.bas ** 2 : slag;
    const tot = n ? n.tot : w * (slag * 0.7 + 0.2 + 0.1 * Math.sin(t * 9));
    // lampan är en glödlampa: den tänds mjukt och släcks fort
    const lampa = Math.max(RL.lampa, w > 0.5 ? 1 : 0);
    RL.lampaNu = mot(RL.lampaNu, lampa, lampa > RL.lampaNu ? 3.2 : 9);
    RADIO.skalaM.emissiveIntensity = RL.lampaNu * (1.25 + 0.03 * Math.sin(t * 2.7));
    lys(RADIO.nalM, RL.lampaNu);
    RADIO.sken.material.opacity = RL.lampaNu * 0.55;
    // visaren och stationsspaken, som sitter ihop, och volymratten
    const x = RM.sx0 + RL.p * (RM.sx1 - RM.sx0);
    RADIO.nal.position.x = x;
    RADIO.sken.position.x = x;
    RADIO.spak.position.x = x;
    RADIO.vol.rotation.z = -(RL.vol - 0.5) * Math.PI * 1.5;
    // stationen stämmer (och flämtar lite med fadingen)
    RL.sNu = mot(RL.sNu, RL.s, 10);
    lys(RADIO.tuneLed, RL.lampaNu * RL.sNu);
    // POWER går in och stannar där, och lampan över den lyser
    RL.in = mot(RL.in, RL.band !== 'av' ? 1 : 0, 26);
    RADIO.kraft.position.z = RM.F + 0.72 - 0.62 * RL.in;
    RADIO.kraftText.material.color.setRGB(0.72 + 0.28 * RL.in, 0.66 + 0.26 * RL.in, 0.62 + 0.14 * RL.in);
    lys(RADIO.kraftLed, RL.in);
    // bandspaken slår över, och bandet den står på lyser upp
    RL.bV = mot(RL.bV, RL.sist === 'fm' ? -1 : 1, 22);
    RADIO.bsp.rotation.x = 0.56 * RL.bV;
    const fmV = (1 - RL.bV) / 2;
    RADIO.fmT.material.color.setRGB(0.42 + 0.58 * fmV, 0.41 + 0.56 * fmV, 0.38 + 0.5 * fmV);
    RADIO.amT.material.color.setRGB(1 - 0.58 * fmV, 0.97 - 0.56 * fmV, 0.88 - 0.5 * fmV);
    // lysdioderna (toppen faller sakta) och högtalarna
    RL.ledNu = Math.max(tot, RL.ledNu - dt * 1.5);
    const tanda = RL.ledNu * RADIO.led.length;
    RADIO.led.forEach((m, i) => lys(m, RL.lampaNu * (tanda > i + 0.15 ? 1 : 0)));
    for (const m of RADIO.pump) m.position.z = m.userData.z0 + 0.5 * bas;
    // tejpen: den nya stationen skrivs
    if (TEJP.skrivs) {
      TEJP.skrivs.u = Math.min(1, TEJP.skrivs.u + dt / 0.85);
      tejpOm(TEJP.skrivs.band);
      if (TEJP.skrivs.u >= 1) TEJP.skrivs = null;
    }
    // (matrisen räknas annars först när scenen ritas, och en fast bild ritas en gång)
    RADIO.g.updateMatrix();
    const topp = new THREE.Vector3(0, 36, 0).applyMatrix4(RADIO.g.matrix);
    // (noterna ska synas från andra sidan rummet: nära är de små, annars täcker de radion)
    RL.naraV = mot(RL.naraV, RL.nara ? 1 : 0, 2.5);
    const notSk = 1 - 0.74 * RL.naraV;
    for (const sp of NOTER) {
      const i = sp.userData.i;
      // (med minskad rörelse står de stilla)
      const u = opt.calm ? (i + 0.6) / (NOTER.length + 1) : (((t - R.fran) * 0.32 + i / NOTER.length) % 1 + 1) % 1;
      sp.visible = w > 0.01;
      if (!sp.visible) continue;
      sp.position.set(topp.x + notSk * (14 * Math.sin(u * 4 + i * 2.4) + (i % 2 ? 8 : -8) * u), topp.y + notSk * u * 80, topp.z + 4);
      sp.scale.setScalar(notSk * (19 + 7 * u));
      sp.material.opacity = w * bump(u, 0, 0.12, 0.65, 1);
      sp.material.rotation = 0.25 * Math.sin(u * 7 + i);
    }
  }

  // ---------- dagen efter ----------
  // DE: hur det gick i omgången som spelades färdigt i går eller i förrgår
  // (efter, från rum.js): 'bra', 'illa' eller null, och oraklen (krona).
  // efterFig sätter det som hör till en figur: papperskronan på oraklet när
  // det gick bra, och när det gick illa DT:s extraflaska omkullvält i en pöl
  // och kupongen sönderriven i hans askkopp. Prinsesstårtan står på bordet
  // (tarta). Allt som läggs dit har userData.efter, så att det kan tas bort.
  const DE = { lage: null, krona: [] };
  const kronTex = canvasTex(1024, 160, (g, w, h) => {
    // uddarna runt om, ett band under dem och glaspärlor i rött och blått
    const n = 8;
    const dal = h * 0.46;
    g.fillStyle = '#e7bf4c';
    g.beginPath();
    g.moveTo(0, h);
    g.lineTo(0, dal);
    for (let i = 0; i < n; i++) {
      g.lineTo(((i + 0.5) / n) * w, 6);
      g.lineTo(((i + 1) / n) * w, dal);
    }
    g.lineTo(w, h);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(150,100,20,.55)';
    g.fillRect(0, h * 0.62, w, 3);
    g.fillRect(0, h - 10, w, 3);
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? '#2f58b8' : '#c3262f';
      g.beginPath();
      g.arc(((i + 0.5) / n) * w, h * 0.8, 9, 0, 2 * Math.PI);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)';
      g.beginPath();
      g.arc(((i + 0.5) / n) * w - 3, h * 0.8 - 3, 3, 0, 2 * Math.PI);
      g.fill();
      g.fillStyle = '#c3262f';
      g.beginPath();
      g.arc(((i + 0.5) / n) * w, 30, 5, 0, 2 * Math.PI);
      g.fill();
    }
  });
  const kronMat = new THREE.MeshPhysicalMaterial({ map: kronTex, alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.45, roughness: 0.4, clearcoat: 0.4 });
  const polMat = new THREE.MeshPhysicalMaterial({ color: '#9a5a12', transparent: true, opacity: 0.78, roughness: 0.03, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false });
  function efterFig(o) {
    const F = o.F;
    for (const x of [...o.hc.children, ...o.fig.children, ...(o.aska ? o.aska.children : [])]) if (x.userData.efter) x.parent.remove(x);
    // papperskronan på huvudet (och på mössan), lite på sned
    if (DE.lage === 'bra' && DE.krona.includes(F.key)) {
      const P = F.head;
      const r = P.rx * (F.mossa ? 0.86 : 0.8);
      const k = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, 24, 64, 1, true), kronMat);
      k.castShadow = true;
      k.position.set(0, P.ry * (F.mossa ? 1.04 : 0.93), -P.rz * 0.08);
      k.rotation.set(-0.1, 0.4, 0.13 * (F.inn || 1));
      k.userData.efter = true;
      o.hc.add(k);
    }
    if (o.extra) delete o.extra.userData.hem;
    if (DE.lage !== 'illa' || !o.extra) {
      if (o.extra) {
        o.extra.rotation.set(0, 0, 0);
        o.extra.position.set(F.plats.flaska[0], BORD.y + 24.4, F.plats.flaska[1]);
        framsida(o.extra, o.fig);
      }
      return;
    }
    // flaskan på sidan med halsen utåt, och pölen där den runnit ut
    const [fx, fz] = F.plats.flaska;
    const ut = Math.atan2(fx, fz);
    o.extra.rotation.set(0, ut + Math.PI / 2, Math.PI / 2 + 0.1);
    o.extra.position.set(fx, BORD.y + 7.7, fz);
    framsida(o.extra, o.fig);
    const hals = new THREE.Vector3(Math.sin(ut), 0, Math.cos(ut));
    const pol = new THREE.Mesh(new THREE.CircleGeometry(1, 40), polMat);
    pol.rotation.set(-Math.PI / 2, 0, ut - Math.PI / 2);
    pol.scale.set(19, 12, 1);
    pol.position.set(fx + hals.x * 28, BORD.y + 0.25, fz + hals.z * 28);
    pol.renderOrder = 2;
    pol.userData.efter = true;
    o.fig.add(pol);
    // kupongen i bitar i askkoppen och två på bordet bredvid
    const R0 = (i) => hash(i * 9.17 + 3.3);
    for (let i = 0; i < 9; i++) {
      const w = 8 + 5 * R0(i);
      const h = 6 + 4 * R0(i + 0.5);
      const g = new THREE.PlaneGeometry(w, h, 2, 2);
      // en bit av kupongens framsida eller baksida, lite skrynklig
      const u0 = R0(i + 0.2) * (1 - w / KW);
      const v0 = R0(i + 0.7) * (1 - h / KH);
      const uv = g.attributes.uv;
      const pos = g.attributes.position;
      for (let j = 0; j < uv.count; j++) {
        uv.setXY(j, u0 + uv.getX(j) * (w / KW), v0 + uv.getY(j) * (h / KH));
        pos.setZ(j, (hash(i * 31 + j) - 0.5) * 1.6);
      }
      g.computeVertexNormals();
      const bit = new THREE.Mesh(g, mat('#ffffff', { map: i % 3 === 2 ? kupTex.bak : kupTex.fram, roughness: 0.85, clearcoat: 0, envMapIntensity: 0.3, side: THREE.DoubleSide }));
      bit.castShadow = bit.receiveShadow = true;
      bit.userData.efter = true;
      const a = R0(i + 0.9) * Math.PI * 2;
      if (i < 7) {
        const rr = 9 * Math.sqrt(R0(i + 0.4));
        bit.position.set(Math.cos(a) * rr, 5.6 + i * 0.35, Math.sin(a) * rr);
        bit.rotation.set(-Math.PI / 2 + (R0(i + 0.1) - 0.5) * 0.9, (R0(i + 0.3) - 0.5) * 0.5, a);
        o.aska.add(bit);
      } else {
        bit.position.set(F.plats.aska[0] + Math.cos(a) * 24, BORD.y + 0.6, F.plats.aska[1] + Math.sin(a) * 20);
        bit.rotation.set(-Math.PI / 2, 0, a);
        o.fig.add(bit);
      }
    }
  }

  // Prinsesstårtan (bra) framme på bordet, där ingen sitter: grön marsipan
  // med florsocker över en kupol av grädde, en rosa ros, och en bit är redan
  // uppäten (snittet visar botten, sylten, krämen och grädden), på ett
  // tårtfat med en spets under.
  const TR_R = 23;
  const TR_B = 7;
  const TR_K = 15;
  function tarta() {
    const g = new THREE.Group();
    g.userData.efter = true;
    const gap = 0.8;
    const mitt = 0.45;
    const a0 = mitt + gap / 2;
    const y0 = 1.8;
    mesh(new THREE.CylinderGeometry(31, 27, 1.6, 64), mat('#f7f4ee', { roughness: 0.18, clearcoat: 1 }), g).position.y = 0.8;
    ring([0, 1.62, 0], [0, 1, 0], 30.4, 0.45, mat('#d4aa4a', { metalness: 0.9, roughness: 0.3 }), g);
    const spets = canvasTex(256, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#fffdf6';
      c.beginPath();
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const r = w * (0.47 + 0.03 * Math.cos(i * Math.PI));
        c[i ? 'lineTo' : 'moveTo'](w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
      }
      c.fill();
      c.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        c.beginPath();
        c.arc(w / 2 + Math.cos(a) * w * 0.4, h / 2 + Math.sin(a) * w * 0.4, 4, 0, 2 * Math.PI);
        c.fill();
      }
    });
    const sp = new THREE.Mesh(new THREE.CircleGeometry(28, 64), new THREE.MeshStandardMaterial({ map: spets, alphaTest: 0.5, roughness: 0.9 }));
    sp.rotation.x = -Math.PI / 2;
    sp.position.y = 1.66;
    sp.receiveShadow = true;
    g.add(sp);
    const marsTex = canvasTex(512, 256, (c, w, h) => {
      c.fillStyle = '#a3cd84';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        c.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * hash(i + 0.3)})`;
        const y = h * hash(i + 0.6) ** 1.6;
        c.fillRect(w * hash(i), y, 1 + 2 * hash(i + 0.1), 1 + 2 * hash(i + 0.2));
      }
    });
    const mars = mat('#ffffff', { map: marsTex, roughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.1, envMapIntensity: 0.4 });
    const kant = mesh(new THREE.CylinderGeometry(TR_R, TR_R, TR_B, 64, 1, true, a0, Math.PI * 2 - gap), mars, g);
    kant.position.y = y0 + TR_B / 2;
    const kupol = mesh(new THREE.SphereGeometry(TR_R, 64, 24, a0 + Math.PI / 2, Math.PI * 2 - gap, 0, Math.PI / 2), mars, g);
    kupol.scale.y = TR_K / TR_R;
    kupol.position.y = y0 + TR_B;
    // snitten: lagren i genomskärning, med marsipanen ytterst
    const H = TR_B + TR_K;
    const snittTex = canvasTex(256, 256, (c, w, h) => {
      const v = (y) => h - (y / H) * h;
      for (const [a, b, f] of [[0, 2.2, '#e8c476'], [2.2, 2.9, '#a3203a'], [2.9, 4.5, '#f2d98a'], [4.5, 6.6, '#e8c476'], [6.6, H, '#fbf6ea']]) {
        c.fillStyle = f;
        c.fillRect(0, v(b), w, v(a) - v(b));
      }
      c.strokeStyle = '#94c274';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(w, h);
      c.lineTo(w, v(TR_B));
      for (let i = 0; i <= 24; i++) {
        const f = (i / 24) * Math.PI / 2;
        c.lineTo(w * Math.cos(f), v(TR_B + TR_K * Math.sin(f)));
      }
      c.stroke();
    });
    snittTex.repeat.set(1 / TR_R, 1 / H);
    const form = new THREE.Shape();
    form.moveTo(0, 0);
    form.lineTo(TR_R, 0);
    form.lineTo(TR_R, TR_B);
    for (let i = 1; i <= 24; i++) {
      const f = (i / 24) * Math.PI / 2;
      form.lineTo(TR_R * Math.cos(f), TR_B + TR_K * Math.sin(f));
    }
    const snittMat = mat('#ffffff', { map: snittTex, roughness: 0.75, side: THREE.DoubleSide, envMapIntensity: 0.3 });
    for (const a of [mitt - gap / 2, mitt + gap / 2]) {
      const s = mesh(new THREE.ShapeGeometry(form), snittMat, g);
      s.position.y = y0;
      s.rotation.y = a - Math.PI / 2;
    }
    // rosen och bladet överst
    const ros = mat('#ec8fab', { roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#ffe0ea') });
    const topp = y0 + H - 0.6;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ellipsoid([Math.cos(a) * 2.6, topp + 1.4, Math.sin(a) * 2.6], [2.6, 1.9, 1.3], ros, g, [0.5, -a + Math.PI / 2, 0]);
    }
    ellipsoid([0, topp + 2.4, 0], [2, 2.2, 2], ros, g);
    ellipsoid([5.4, topp + 0.6, 1.5], [4.2, 0.7, 1.9], mat('#5f9a45', { roughness: 0.5 }), g, [0, -0.4, 0.15]);
    g.position.set(6, 0, 56);
    g.rotation.y = -0.2;
    return g;
  }
  // tårtan på bordet och det som hör till var och en (efterFig)
  function efter(x) {
    const lage = x && (x.lage === 'bra' || x.lage === 'illa') ? x.lage : null;
    const krona = ((x && x.krona) || []).map((k) => String(k).toLowerCase());
    if (lage === DE.lage && krona.join() === DE.krona.join()) return;
    DE.lage = lage;
    DE.krona = krona;
    for (const c of [...bord.children]) if (c.userData.efter) bord.remove(c);
    if (lage === 'bra') bord.add(tarta());
    for (const o of figs) efterFig(o);
    // den som bär högtidens huvudbonad och får kronan (eller blir av med den)
    // byggs om, så att kronan sitter där bonaden satt (build)
    let om = false;
    for (const o of figs) {
      const k = lage === 'bra' && krona.includes(o.F.key);
      if (k !== o.kront && o.fest) { o.key = null; om = true; }
    }
    if (om) ute(vNu);
  }

  const figs = [];
  const n = placering(opt.vader || (window.Vader && window.Vader.nu()));
  // I telefonen kastar de små delarna (fingrarna, knapparna, smycket …) ingen
  // skugga: deras skuggor syns inte där, och varje del är ett eget ritanrop
  // varje gång skuggorna räknas om.
  const utanSmaSkuggor = (o) => {
    if (LATT) {
      o.fig.traverse((x) => {
        if (!x.isMesh || !x.castShadow) return;
        if (!x.geometry.boundingSphere) x.geometry.computeBoundingSphere();
        if (x.geometry.boundingSphere.radius * Math.max(x.scale.x, x.scale.y, x.scale.z) < SMA_SKUGGA) x.castShadow = false;
      });
    }
    return o;
  };

  // Gänget är ett par hundra delar, och varje del är ett ritanrop: i en svag
  // telefon är det de anropen, i koden här och i webbläsarens grafikprocess, som
  // tar tiden. Delar som sitter fast på samma led och bara skiljer sig i färgen
  // slås ihop till en (färgen per hörn), så att det ser likadant ut. Det som
  // figuren flyttar för sig (allt som står i o, o.arms och userData) och det
  // med bilder eller genomskinlighet får vara i fred. Inte på steg 0: där är det
  // inte anropen som är problemet.
  const KARTOR = ['map', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'lightMap', 'clearcoatMap', 'sheenColorMap', 'sheenRoughnessMap'];
  function delNyckel(x) {
    const m = x.material;
    const g = x.geometry;
    if (!x.isMesh || !m || Array.isArray(m) || !m.isMeshStandardMaterial || m.transparent || m.vertexColors || m.alphaTest) return null;
    if (KARTOR.some((k) => m[k]) || !g.index || Object.keys(g.attributes).sort().join() !== 'normal,position,uv') return null;
    x.updateMatrix();
    if (x.children.length || x.matrix.determinant() <= 0) return null;
    return [m.type, m.side, m.roughness, m.metalness, m.envMapIntensity, m.clearcoat, m.clearcoatRoughness, m.sheen, m.sheenRoughness, m.sheen ? m.sheenColor.getHex() : 0,
      m.emissive.getHex(), m.emissiveIntensity, m.bumpMap ? m.bumpMap.uuid : '', m.bumpScale, m.polygonOffset, m.depthWrite, x.castShadow, x.receiveShadow, x.renderOrder, x.visible].join('|');
  }
  function slaIhopUnder(rot, skydd) {
    const foraldrar = [];
    rot.traverse((x) => { if (x.children.length > 1) foraldrar.push(x); });
    for (const p of foraldrar) {
      const grupper = new Map();
      for (const x of p.children) {
        if (skydd.has(x)) continue;
        const k = delNyckel(x);
        if (!k) continue;
        if (!grupper.has(k)) grupper.set(k, []);
        grupper.get(k).push(x);
      }
      for (const delar of grupper.values()) {
        if (delar.length < 2) continue;
        const g = mergeGeometries(delar.map((x) => {
          const d = x.geometry.clone().applyMatrix4(x.matrix);
          const n = d.attributes.position.count;
          const f = new Float32Array(n * 3);
          const c = x.material.color;
          for (let i = 0; i < n; i++) { f[i * 3] = c.r; f[i * 3 + 1] = c.g; f[i * 3 + 2] = c.b; }
          d.setAttribute('color', new THREE.BufferAttribute(f, 3));
          return d;
        }), false);
        if (!g) continue;
        const m = delar[0].material.clone();
        m.vertexColors = true;
        m.color.set('#ffffff');
        const hel = new THREE.Mesh(g, m);
        hel.castShadow = delar[0].castShadow;
        hel.receiveShadow = delar[0].receiveShadow;
        hel.renderOrder = delar[0].renderOrder;
        for (const x of delar) { p.remove(x); x.geometry.dispose(); }
        p.add(hel);
      }
    }
  }
  function slaIhop(o) {
    if ((!LATT && DET >= 1) || /[?&]rum-hel\b/.test(location.search)) return o;
    const skydd = new Set();
    const sok = (v, d) => {
      if (!v || typeof v !== 'object' || d > 5) return;
      if (v.isObject3D) {
        skydd.add(v);
        sok(v.userData, d + 1);
      } else if (Array.isArray(v)) {
        for (const x of v) sok(x, d + 1);
      } else if (Object.getPrototypeOf(v) === Object.prototype) {
        for (const x of Object.values(v)) sok(x, d + 1);
      }
    };
    sok(o, 0);
    o.fig.traverse((x) => sok(x.userData, 1));
    // (högtidens bonad flyttar sina delar själv, H.tick)
    if (o.H && o.H.grupp) o.H.grupp.traverse((x) => skydd.add(x));
    slaIhopUnder(o.fig, skydd);
    return o;
  }

  // Det enkla ljuset, det lägsta steget (enkel i KVAL i rum.js): figurerna utan
  // miljö, skuggkarta och de svaga lamporna, och tygerna utan knottror och
  // lack. Mätt med mjukvarugrafik är miljön och skuggorna det dyraste i varje
  // bild. Himlen (hemi) tar över en del av det ljus som försvinner.
  const FYLLER = [tvLjus, term, fill];
  function enkelMaterial(rot) {
    rot.traverse((x) => {
      const m = x.material;
      if (!m || Array.isArray(m) || !m.isMeshStandardMaterial) return;
      m.bumpMap = null;
      if (m.isMeshPhysicalMaterial) { m.clearcoat = 0; m.sheen = 0; }
      m.needsUpdate = true;
    });
  }
  function enkeltLjus() {
    Q.enkel = true;
    scene.environment = null;
    r.shadowMap.enabled = false;
    catcher.visible = false;
    for (const l of FYLLER) l.visible = false;
    enkelMaterial(scene);
    hemi.intensity = hemiDag * HEMI_ENKEL;
  }
  if (opt.enkel) for (const l of FYLLER) l.visible = false;
  const klar = (o) => { slaIhop(utanSmaSkuggor(o)); if (Q.enkel) enkelMaterial(o.fig); return o; };
  FIGS.forEach((F, i) => figs.push(klar(build(sitt(F, PLATSER[(i + n) % 3]), dress(F.key, opt.vader)))));

  // D: kläderna (dress)
  function build(F, D) {
    const c = CHARS[F.key];
    const L = F.legs;
    const T = F.torso;
    const Wd = F.w;
    const thigh = L * 0.5;
    const shin = L * 0.44;
    const fig = new THREE.Group();
    fig.position.set(F.x, SILL, F.z);
    fig.rotation.y = F.turn * DEG;
    root.add(fig);
    const skin = mat(c.skin, { sheenColor: new THREE.Color(c.blush), sheen: 0.3 }, 'hud');
    const fab = (col, extra = {}) => mat(col, extra, 'tyg');
    // jultröjan: mönstret stickat runt bålen och prickar på ärmarna (rum-fest.js)
    const jul = Boolean(D.troja && D.troja.jul);
    const tee = jul ? fab('#ffffff', { map: FEST.jultroja(F.key), bumpMap: knit, bumpScale: 0.6 }) : fab(D.troja ? D.troja.farg : c.tee, { bumpMap: knit, bumpScale: 0.6 });
    const teeArm = jul ? fab('#ffffff', { map: FEST.armar(F.key), bumpMap: knit, bumpScale: 0.6 }) : tee;
    // DT har jeans (jeansshorts när det är hett), DL och DJ shorts eller långbyxor
    const jeans = c.pants === 'jeans';
    const lang = D.ben === 'lang';
    const trou = fab(lang && D.byxa ? D.byxa[0] : c.trou, { bumpMap: jeans ? denim : knit, bumpScale: jeans ? 0.9 : 0.5 });
    const tee2 = fab(D.troja ? D.troja.farg2 : c.tee2);
    const trou2 = fab(lang && D.byxa ? D.byxa[1] : c.trou2);
    const shoe = mat(c.shoe, {}, 'sko');
    const sole = mat(c.sole, { roughness: 0.6 });
    const hipY = 11;

    // benen: låren framåt över kanten, underbenen hänger och dinglar
    const knees = [];
    const feet = [];
    for (const s of [-1, 1]) {
      const fx = s * Wd * 0.36;
      // låret lutar lite nedåt och utåt mot knät
      const hip = new THREE.Vector3(fx, hipY, 0);
      const kn = new THREE.Vector3(fx + s * 7, hipY - 7, thigh);
      const along = kn.clone().sub(hip).normalize();
      if (lang) {
        capsule(hip.toArray(), kn.toArray(), F.leg * 1.25, trou, fig);
      } else {
        capsule(hip.clone().lerp(kn, 0.5).toArray(), kn.toArray(), F.leg * 1.05, skin, fig);
        // shortsen: ett rör tätt om låret med uppvik ytterst (DT:s jeansshorts med ljus kant)
        const sh = mesh(new THREE.CylinderGeometry(F.leg * 1.32, F.leg * 1.45, thigh * 0.74, 32, 1, true), fab(c.trou, { bumpMap: jeans ? denim : knit, bumpScale: jeans ? 0.9 : 0.5, side: THREE.DoubleSide }), fig);
        sh.position.copy(hip.clone().lerp(kn, 0.33));
        sh.quaternion.setFromUnitVectors(UP, along);
        ring(hip.clone().lerp(kn, 0.68).toArray(), along.toArray(), F.leg * 1.3, 2.2, jeans ? fab(c.cuff, { bumpMap: denim, bumpScale: 0.6 }) : trou2, fig);
        const inner = mesh(new THREE.CircleGeometry(F.leg * 1.3, 24), mat('#3a3128', { roughness: 1 }), fig);
        inner.position.copy(hip.clone().lerp(kn, 0.66));
        inner.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), along);
      }
      const knee = new THREE.Group();
      knee.position.copy(kn);
      fig.add(knee);
      if (lang && jeans) {
        capsule([0, 0, 0], [0, -shin, 0], F.leg * 1.25, trou, knee);
        const cuff = mesh(new THREE.CylinderGeometry(F.leg * 1.42, F.leg * 1.45, 7, 32), fab(c.cuff, { bumpMap: denim, bumpScale: 0.6 }), knee);
        cuff.position.y = -shin + 4;
        capsule([s * F.leg * 1.22, -shin + 8, 0], [s * F.leg * 1.22, -2, 0], 0.55, mat('#c08a42', { roughness: 0.8 }), knee);
      } else if (lang) {
        // chinos: raka ben med en fåll vid vristen
        capsule([0, 0, 0], [0, -shin + 2, 0], F.leg * 1.25, trou, knee);
        mesh(new THREE.CylinderGeometry(F.leg * 1.33, F.leg * 1.36, 4, 32), trou2, knee).position.y = -shin + 2.5;
      } else {
        capsule([0, 0, 0], [0, -shin, 0], F.leg, skin, knee);
        mesh(new THREE.CylinderGeometry(F.leg * 1.08, F.leg * 1.08, 9, 24), mat(c.sock, { roughness: 0.9 }), knee).position.y = -shin + 2;
      }
      const foot = new THREE.Group();
      foot.position.set(0, -shin - 5, 2);
      foot.rotation.x = 0.5;
      knee.add(foot);
      ellipsoid([0, 0, 6], [11, 8, 19], shoe, foot);
      ellipsoid([0, -4.5, 6], [11.5, 3, 19.5], sole, foot);
      ellipsoid([0, -1.8, 6], [11.6, 1, 19.6], mat(c.sole2, { roughness: 0.6 }), foot);
      const lace = mat(c.lace, { roughness: 0.8 });
      for (const zz of [9, 13.5, 18]) { const yy = 8 * Math.sqrt(Math.max(0, 1 - ((zz - 6) / 19) ** 2)) - 0.4; capsule([-4.6, yy, zz], [4.6, yy, zz], 1.15, lace, foot); }
      knees.push(knee);
      feet.push(foot);
    }

    // barstolen: röd vinyl med söm på en krom ställning, med fotringen i höjd
    // med fötterna (benen slutar under pulten)
    const stol = new THREE.Group();
    // (stolen och sakerna på bordet står kvar när figuren går iväg, gaFlytta)
    stol.userData.fast = true;
    fig.add(stol);
    const sits = [[0, 0], [19, 0], [22, 1.2], [23, 4], [22.2, 7], [19, 8.4], [0, 8.6]].map(([a, q]) => new THREE.Vector2(a, q));
    mesh(new THREE.LatheGeometry(sits, seg(64, 32)), vinyl, stol).position.y = -6.6;
    ring([0, -2.6, 0], [0, 1, 0], 22.6, 0.35, som, stol);
    ring([0, -7.6, 0], [0, 1, 0], 15, 1.3, krom, stol);
    ring([0, 4 - shin - 18, 0], [0, 1, 0], 19.5, 1.2, krom, stol);
    for (const a of [45, 135, 225, 315].map((x) => x * DEG)) {
      const p0 = new THREE.Vector3(Math.cos(a) * 15, -7.6, Math.sin(a) * 15);
      const p1 = new THREE.Vector3(Math.cos(a) * 24, -280, Math.sin(a) * 24);
      place(mesh(new THREE.CylinderGeometry(1.6, 1.6, p0.distanceTo(p1), 16), krom, stol), p0, p1);
    }

    // bålen: höfterna, tröjan med veck, fållen och kragen, halsen och huvudet
    const torso = new THREE.Group();
    torso.position.set(0, hipY + 3, 0);
    fig.add(torso);
    const hipPts = lang ? [[Wd * 0.74, -6], [Wd * 0.82, 6], [Wd * 0.86, 14]] : [[Wd * 0.7, -12], [Wd * 0.82, 0], [Wd * 0.86, 14]];
    const hips = mesh(new THREE.LatheGeometry([new THREE.Vector2(0, hipPts[0][1]), ...hipPts.map(([a, b]) => new THREE.Vector2(a, b)), new THREE.Vector2(0, 14)], 48), trou, torso);
    hips.scale.z = F.depth / Wd;
    const prof = [[0, -0.02], [0.84, -0.02], [0.86, 0.1], [0.9, 0.45], [0.97, 0.75], [1, 0.86], [0.92, 0.96], [0.6, 1.02], [0.25, 1.04], [0, 1.04]].map(([a, b]) => new THREE.Vector2(a * Wd, b * T));
    const tg = new THREE.LatheGeometry(prof, seg(160, 64));
    const p = tg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i); const rr = Math.hypot(x, z);
      if (rr < Wd * 0.5) continue;
      const th = Math.atan2(x, z); const h = y / T;
      const f = 1.7 * (0.5 + 0.5 * Math.sin(th * 7 + h * 9 + F.x)) * Math.exp(-(((h - 0.12) / 0.16) ** 2)) + 1.4 * (0.5 + 0.5 * Math.sin(th * 4 - h * 8 + 1)) * Math.exp(-(((h - 0.7) / 0.18) ** 2)) * Math.abs(Math.sin(th));
      const k = (rr + f) / rr;
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    tg.computeVertexNormals();
    // (jultröjans mönster efter höjden, inte efter profilens punkter)
    if (jul) for (let i = 0; i < p.count; i++) tg.attributes.uv.setY(i, (p.getY(i) + T * 0.02) / (T * 1.06));
    const chest = new THREE.Group();
    torso.add(chest);
    mesh(tg, tee, chest).scale.z = F.depth / Wd;
    ring([0, -T * 0.015, 0], [0, 1, 0], Wd * 0.86, 2.2, tee2, chest).scale.y = F.depth / Wd;
    ring([0, T * 1.03, 0], [0, 1, 0], F.neckR + 2.6, 2.3, tee2, chest);
    mesh(new THREE.CylinderGeometry(F.neckR, F.neckR * 1.1, F.neck + 26, 24), skin, torso).position.y = T + F.neck / 2 - 2;
    // luvtröjans luva på ryggen och snörena fram
    if (D.troja && D.troja.luva) {
      ellipsoid([0, T * 0.99, -(F.depth * 0.6 + 2)], [Wd * 0.46, 9, 8], tee, chest);
      for (const s of [-1, 1]) capsule([s * 4, T * 0.99, F.depth * 0.62 + 1], [s * 4.6, T * 0.8, F.depth * 0.98 + 1.2], 0.8, mat('#d8d4cc', { roughness: 0.8 }), chest);
    }
    // jackan utanpå, och halsduken utanpå jackan
    const outer = D.jacka ? jacka(F, D.jacka, chest) : prof;
    // nyår: flugan och skjortans krage och knappar, och konfetti på axlarna (rum-fest.js)
    if (D.troja && D.troja.skjorta) FEST.fluga(F, chest, T, prof);
    if (F.halsduk) halsduk(F, outer, chest);
    // snö på axlarna när det snöar
    if (D.sno) {
      for (const s of [-1, 1]) {
        ellipsoid([s * Wd * 0.56, T * 1.02 + 2, -1], [11, 2.6, 8], snowMat, chest, [0.1, 0, s * 0.3]);
        for (let j = 0; j < 4; j++) ellipsoid([s * Wd * (0.3 + 0.15 * j), T * (1.0 - 0.06 * j) + 3, 4 + 3 * hash(j + F.x)], [2.2, 1.2, 2], snowMat, chest);
      }
    }

    const P = F.head;
    const hg = new THREE.Group();
    // vrids först åt sidan, sedan upp eller ner: blickarna åt sidan (tv:n)
    hg.rotation.order = 'YXZ';
    hg.position.set(0, T + F.neck, 0);
    torso.add(hg);
    const hc = new THREE.Group();
    hc.position.y = P.ry * 0.84;
    hg.add(hc);
    mesh(headGeo(P, false), skin, hc);
    // högtidens huvudbonad (rum-fest.js) i stället för DJ:s mössa – men oraklet
    // dagen efter en bra omgång bär papperskronan (efterFig) i stället
    const kront = DE.lage === 'bra' && DE.krona.includes(F.key);
    const H = D.fest && !kront ? FEST.huvud(F, P, hc, D.fest, F.plats === PLATSER[1], opt.calm) : null;
    const fm = new THREE.Mesh(headGeo(P, true, 1.003), mat('#ffffff', { map: ansiktet(F.key).bas, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }, 'hud'));
    fm.receiveShadow = true;
    hc.add(fm);
    let skagg = null;
    if (F.beard) {
      const bm = skagg = new THREE.Mesh(headGeo(P, true, F.beard[0], F.beard[1]), mat('#ffffff', { map: tex.ans_skagg || tex.dj_skagg, transparent: true, alphaTest: 0.3, roughness: 0.85, bumpMap: tex.dj_skagg, bumpScale: 1.5 }));
      bm.castShadow = bm.receiveShadow = true;
      hc.add(bm);
    }
    const ny = -(P.noseY - P.cy) / P.hh;
    ellipsoid([0, ny * P.ry, Math.sqrt(Math.max(0, 1 - ny * ny)) * P.rz * 0.9], P.nose, skin, hc, P.noseRot ? [P.noseRot, 0, 0] : undefined);
    const ear = P.ear || [0.13, 0.19, 0.15, 0.35];
    if (!H || H.oron !== false) for (const s of [-1, 1]) ellipsoid([s * P.rx * 0.95, -P.ry * 0.04, -P.rz * 0.08], [P.rx * ear[0], P.ry * ear[1], P.rz * ear[2]], mat(c.skin2, { roughness: 0.55 }), hc, [0, s * ear[3], 0]);
    const ht = hairTex(c.hair, c.hair2, c.hair3, F.key.charCodeAt(1));
    const cap = H ? H.cap : F.mossa;
    mesh(hairGeo(P, cap ? { ...F.hair, cap } : F.hair, F.key.charCodeAt(1) * 131), mat('#ffffff', { map: ht, vertexColors: true, bumpMap: ht, bumpScale: 1.5 }, 'har'), hc);
    const onCap = F.mossa && !H ? mossa(F, P, hc) : null;
    if (D.fest === 'nyar') FEST.konfetti(F, outer, chest, P, hc);
    if (D.fest === 'pask') FEST.kinder(F, P, hc);
    if (F.glasses) {
      const gl = glasses(P, hc, F.glasses, F.hair.gr || 1);
      if (D.glas) {
        // solen skiner: glasögonen på näsan (ögonen i ansiktsbilden y ≈ −3)
        const ey = -(-3 - P.cy) * P.ry / P.hh;
        gl.position.set(0, ey, Math.sqrt(Math.max(0, 1 - (ey / P.ry) ** 2)) * P.rz + 3);
        gl.rotation.x = 0;
      } else if (onCap) {
        // uppskjutna på mössan
        gl.position.copy(onCap); gl.rotation.x = -35 * DEG;
      } else if (H && H.glas !== 'har') {
        // uppskjutna på tomteluvan eller hucklet, eller av (struten, kronan, kransen)
        if (H.glas) { gl.position.copy(H.glas); gl.rotation.x = -35 * DEG; } else gl.visible = false;
      }
    }
    if (D.sno && !H) ellipsoid([0, P.ry * (F.mossa ? 1.13 : 1.05), -P.rz * 0.1], [P.rx * 0.42, 3, P.rz * 0.38], snowMat, hc);
    // munnen i huvudets axlar (ansiktsbildens y ≈ 42)
    const my = -(42 - P.cy) * P.ry / P.hh;
    const mouth = new THREE.Vector3(0, my, Math.sqrt(Math.max(0, 1 - (my / P.ry) ** 2)) * P.rz * 0.98 + 2);

    // armarna: kapslar med fast längd som IK placerar varje bild
    // ärmarna: korta på t-tröjan, långa på tröjan och jackan, eller
    // uppkavlade till armbågen (DT:s arm med lejonet)
    const J = D.jacka;
    const arms = [0, 1].map((i) => {
      const s = i === 0 ? -1 : 1;
      const kind = F.does[i];
      const lejon = F.tatuering && F.tatuering.arm === i;
      const sleeve = J ? (J.upp === 'bada' || (J.upp === 'lejon' && lejon) ? 'upp' : 'jacka') : D.troja ? (D.troja.upp === 'lejon' && lejon ? 'upp' : 'lang') : 'kort';
      const sm = J ? jackMat(J, { side: THREE.FrontSide, ...(J.tyg === 'flanell' ? { map: plaid(2, 2) } : {}) }) : teeArm;
      const tk = J ? (J.tunn ? 0.3 : J.tjock || 1) : 0;
      const rU = F.arm * (sleeve === 'kort' ? 1.45 : 1.22 + 0.12 * tk);
      const rL = F.arm * (1.1 + 0.1 * tk);
      const A = {
        s,
        kind,
        sleeveKind: sleeve,
        S: new THREE.Vector3(s * Wd * 0.88, T - 10, 0),
        up: rod(F.a, F.arm, skin, fig),
        lo: rod(F.b, F.arm * 0.92, skin, fig),
        sleeve: rod(sleeve === 'kort' ? F.a * 0.48 : F.a, rU, sm, fig),
        cuff: sleeve === 'kort' ? ring([0, 0, 0], [0, 1, 0], F.arm * 1.45, 1.3, tee2, fig)
          : sleeve === 'upp' ? ring([0, 0, 0], [0, 1, 0], rU * 1.02, 3 + 0.4 * tk, sm, fig)
            : ring([0, 0, 0], [0, 1, 0], rL * 1.02, J ? 1.5 + 0.3 * tk : 1.9, J ? edgeMat(J) : tee2, fig),
      };
      if (sleeve === 'lang' || sleeve === 'jacka') A.loS = rod(Math.max(1, F.b * 0.84 - 2 * rL), rL, sm, fig);
      // dunjackans kanaler runt ärmarna
      if (J && J.tyg === 'dun' && sleeve !== 'kort') A.quilt = [[0, 0.38, rU], [0, 0.72, rU], ...(A.loS ? [[1, 0.32, rL], [1, 0.62, rL]] : [])].map(([seg, f, r]) => ({ seg, f, x: ring([0, 0, 0], [0, 1, 0], r * 0.98, 1.2 + 0.2 * tk, sm, fig) }));
      const q = F.arm;
      if (kind === 'flaska') {
        A.hand = hand('grepp', q, skin, fig, 7.6);
        A.thing = bottle(A.hand);
      } else if (kind === 'cigg' || kind === 'prat') {
        A.hand = hand('nyp', q, skin, fig);
        A.cig = cigarette(A.hand);
        A.cig.position.set(-q * 0.2, q * 2.5, -q * 0.9);
      } else {
        A.hand = hand('vila', q, skin, fig);
      }
      if (F.tatuering && F.tatuering.arm === i) A.tat = tatuering(F, A);
      // en knuten näve i stället för den öppna handen när den lyfts vid ett mål
      if (kind === 'vila' && F.mal.jubel === i) {
        A.fist = hand('grepp', q, skin, fig, 2.2);
        A.fist.visible = false;
      }
      return A;
    });
    // en flaska till på bordet bredvid DT och askkoppen
    const Pl = F.plats;
    let extra = null;
    let aska = null;
    if (F.key === 'dt') {
      const b2 = bottle(fig);
      b2.position.set(Pl.flaska[0], BORD.y + 24.4, Pl.flaska[1]);
      framsida(b2, fig);
      extra = b2;
      b2.userData.fast = true;
      const tray = new THREE.Group();
      aska = tray;
      tray.userData.fast = true;
      tray.position.set(Pl.aska[0], BORD.y, Pl.aska[1]);
      fig.add(tray);
      const tm = new THREE.MeshPhysicalMaterial({ color: '#9fb2b0', roughness: 0.1, transmission: 0, transparent: true, opacity: 0.75, clearcoat: 1 });
      mesh(new THREE.CylinderGeometry(15, 13, 5, 28), tm, tray).position.y = 2.5;
      mesh(new THREE.CylinderGeometry(11, 11, 1, 20), mat('#5a554c', { roughness: 1 }), tray).position.y = 4.4;
      for (const [x, z, a] of [[-4, 2, 0.6], [3, -3, -0.9], [5, 4, 2.1]]) {
        const b = mesh(new THREE.CylinderGeometry(1.25, 1.25, 7, 10), mat('#e6dcc8', { roughness: 0.9 }), tray);
        b.rotation.set(Math.PI / 2, 0, a); b.position.set(x, 5.4, z);
      }
    }
    // två tomflaskor kvar på fönsterbänken (tomma)
    if (F.key === 'dj') {
      for (const [x, z, tilt] of Pl.tomma) {
        const e = bottle(fig);
        e.rotation.z = tilt;
        e.position.set(x - F.x, tilt ? 7.6 : 24.4, z - F.z).applyAxisAngle(UP, -F.turn * DEG);
        framsida(e, fig);
        e.userData.fast = true;
      }
    }

    // väntan på kupongen: pennan nyps som cigaretten, kupongen hålls i en
    // vilande hand; flaskan och cigaretten (släckt) står bredvid
    const V = F.vanta;
    const pen = arms[V.penna];
    const kp = arms[V.kupong];
    const q = F.arm;
    const vt = new THREE.Object3D();
    for (const A of arms) {
      if (A === pen) {
        A.wHand = A.cig ? A.hand : hand('nyp', q, skin, fig);
        A.pen = pencil(A.wHand);
        A.pen.position.set(-q * 0.2, q * 2.5, -q * 0.9);
      } else {
        A.wHand = A.kind === 'vila' ? A.hand : hand('vila', q, skin, fig);
        A.kup = coupon(A.wHand);
        // handen bakom kupongens yttre kant, handflatan mot den som läser
        new THREE.Matrix4().makeRotationY(Math.PI).setPosition(-A.s * KW * 0.42, -q * 1.1, -q * 1.15).invert()
          .decompose(A.kup.position, A.kup.quaternion, A.kup.scale);
      }
      if (A.thing) {
        A.bench = bottle(fig);
        A.bench.userData.fast = true;
        A.bench.position.set(Pl.sak[0], BORD.y + 0.4 - A.thing.userData.bottom, Pl.sak[1]);
        // handryggen utåt när den tas
        A.bench.rotation.y = A.s * Math.PI / 4;
        // samma etikett när handen tar den
        framsida(A.bench, fig);
        A.thing.userData.folie.rotation.y = A.bench.userData.folie.rotation.y;
      }
      if (A.cig) {
        A.bench = cigarette(fig);
        A.bench.userData.fast = true;
        A.bench.userData.tip.visible = A.bench.userData.halo.visible = false;
        // där handen tar den: fingrarna framåt, handryggen upp, cigaretten vågrät
        const at = A.kind === 'cigg' ? new THREE.Vector3(Pl.aska[0], BORD.y + 6.4, Pl.aska[1]) : new THREE.Vector3(Pl.cigg[0], BORD.y + 1.3, Pl.cigg[1]);
        const y = new THREE.Vector3(0, -0.3, 1);
        const z = new THREE.Vector3(0, 1, 0.3);
        orient(vt, new THREE.Vector3(), y, z);
        orient(vt, at.sub(A.cig.position.clone().applyQuaternion(vt.quaternion)), y, z);
        vt.updateMatrix();
        A.cig.updateMatrix();
        vt.matrix.clone().multiply(A.cig.matrix).decompose(A.bench.position, A.bench.quaternion, A.bench.scale);
      }
      for (const x of [A.pen, A.kup, A.bench, A.thing, A.cig]) if (x) x.updateMatrix();
    }
    // pennan bakom örat och kupongen upp och ner på bordet när den är inne
    const earPen = pencil(hc);
    // utanför håret och mössan, snett framåt och nedåt, så att den syns framifrån
    frameOf(earPen, new THREE.Vector3(pen.s * P.rx * 1.15, P.ry * 0.16, -P.rz * 0.1), new THREE.Vector3(-pen.s * 0.1, -0.8, 0.6), new THREE.Vector3(0, 0.6, 0.8));
    const kupBench = coupon(fig);
    kupBench.userData.fast = true;
    const [lx, lz, lr] = Pl.lagg;
    frameOf(kupBench, new THREE.Vector3(lx, BORD.y + 0.3, lz), new THREE.Vector3(Math.cos(lr), 0, -Math.sin(lr)), new THREE.Vector3(Math.sin(lr), 0, Math.cos(lr)));
    earPen.updateMatrix();
    kupBench.updateMatrix();

    const o = { F, fig, hud: skin, torso, chest, hg, hc, face: fm, knees, feet, arms, mouth, thigh, hipY, T, phase: hash(F.x) * 20, pen, kp, earPen, kupBench, extra, aska, inneAt: -1e9, key: JSON.stringify(D), H, kront, fest: D.fest,
      skratt: tex[`${F.key}_skratt`], skagg, turnNu: F.turn };
    efterFig(o);
    return o;
  }

  // Ett föremåls matris i c med x-axeln X och y-axeln Y (rätas upp).
  function frameM(c, X, Y) {
    const x = X.clone().normalize();
    const z = new THREE.Vector3().crossVectors(x, Y).normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    return new THREE.Matrix4().makeBasis(x, y, z).setPosition(c);
  }
  function frameOf(obj, c, X, Y) {
    frameM(c, X, Y).decompose(obj.position, obj.quaternion, obj.scale);
  }

  // ---------- rörelserna ----------

  const scratch = new THREE.Group();
  // Tvåledad IK: armbågen E ur axeln S, handleden Wr, längderna och en
  // riktning som armbågen ska peka åt.
  function ik(S, Wr, a, b, pole) {
    const d = Wr.clone().sub(S);
    let len = d.length();
    len = Math.min(Math.max(len, Math.abs(a - b) + 0.5), a + b - 0.3);
    const dir = d.normalize();
    const x = (a * a - b * b + len * len) / (2 * len);
    const h = Math.sqrt(Math.max(0, a * a - x * x));
    const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    return S.clone().add(dir.clone().multiplyScalar(x)).add(perp.multiplyScalar(h));
  }
  // Handens axlar ur y (fingrarna/flaskan) och z (handryggen).
  function orient(g, pos, y, z) {
    const Y = y.clone().normalize();
    const Z = z.clone().sub(Y.clone().multiplyScalar(z.dot(Y))).normalize();
    const X = new THREE.Vector3().crossVectors(Y, Z);
    g.position.copy(pos);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  }

  // Bålens och huvudets läge: lutning framåt, andning och blickar – och medan
  // man väntar på kupongen (waitBody) det man gör då.
  function body(o, t) {
    const k = o.F.key;
    const tt = t + o.phase;
    const drink = drinkW(o, t);
    const drag = dragW(o, t);
    let lean = 0.1 - 0.12 * drink + 0.02 * Math.sin(tt * 0.4);
    o.torso.rotation.z = 0.015 * Math.sin(tt * 0.23);
    let breath = 1;
    let pitch = -0.05 + 0.03 * Math.sin(tt * 0.31);
    let yaw = 0;
    // blickarna åt sidan mot bordet (inn, sitt)
    const inn = o.F.inn;
    if (k === 'dl') yaw = inn * (0.18 * bump((t % 21), 12, 13.5, 17, 18.5) - 0.05);
    if (k === 'dt') { pitch += 0.06 * Math.sin(t * 5.2) * bump(t % 13, 8.5, 9, 10.5, 11.5); yaw = inn * 0.12 * bump(t % 17, 2, 3, 6, 7); }
    if (k === 'dj') { yaw = inn * (0.22 - 0.06 * Math.sin(t * 0.7)); pitch += 0.04 * Math.sin(t * 2.1) * talkW(o, t); }
    const knee = [0, 1].map((i) => 0.06 + 0.16 * Math.sin(t * (k === 'dj' ? 0.9 : 1.15) + o.phase + i * 2.4) * (k === 'dt' ? 0.6 : 1));
    const foot = [0.5, 0.5];
    // väntan: rätar på sig när kupongen är inne
    const vw = 1 - sm(0, 0.3, uOf(o, t));
    let side = 0;
    if (vw > 0) {
      const w = waitBody(o, Math.min(t, o.inneAt));
      side = w.side * vw;
      lean += (w.lean - lean) * vw;
      pitch += (w.pitch - pitch) * vw;
      yaw += (w.yaw - yaw) * vw;
      breath += (w.breath - 1) * vw;
      for (let i = 0; i < 2; i++) { knee[i] += (w.knee[i] - knee[i]) * vw; foot[i] += (w.foot[i] - foot[i]) * vw; }
    }
    // vald: rätar på sig och sprattlar med benen medan handen är uppe, och
    // lutar sig sedan över kupongen och skriver, med huvudet som följer raden
    const jag = jagW(o, t);
    const skriv = skrivW(o, t);
    if (jag > 0) {
      lean += (-0.06 - lean) * jag;
      side *= 1 - jag;
      for (let i = 0; i < 2; i++) knee[i] += (0.1 + 0.34 * Math.sin(t * 8.5 + o.phase + i * 2.6) - knee[i]) * jag;
    }
    if (skriv > 0) {
      const { x } = skrivRad(o, t);
      lean += (0.1 - lean) * skriv;
      pitch += (0.55 + 0.03 * Math.sin(t * 11) - pitch) * skriv;
      yaw += (-0.09 * x - yaw) * skriv;
      side *= 1 - skriv;
    }
    // blickarna (looks): det som inte ryms i nacken tar bålen, och huvudet
    // hålls rakt fast bålen lutar sig (annars blir det på sned åt sidan)
    // (den som just tappade raden sjunker ihop och tittar ner i stället)
    const up = cheerW(o, t);
    const sink = sinkW(o, t);
    // på sidorna sjunker man ihop utåt, inte in framför den bakom bordet
    side += sink * o.F.turn * DEG * 0.3;
    let twist = 0;
    let roll = 0;
    // påhittet (akt) kan ha en blick (se: en punkt i rummet), före de andra
    const ak = aktNu(o, t);
    const kb = ak && ak.a.kropp ? ak.a.kropp(o, t, ak.l, ak) : null;
    const blickar = looks(o, t);
    if (kb && kb.se && kb.seW !== 0) blickar.unshift([kb.se, ak.w * (kb.seW ?? 1)]);
    for (const [P, w0] of blickar) {
      const w = w0 * (1 - 0.75 * sink) * (1 - skriv);
      if (w <= 0) continue;
      const L = aim(o, P);
      // inte så långt ner att man tittar rakt ner i bordet (pulten)
      L.pitch = Math.min(0.42, L.pitch);
      const tw = Math.max(-0.42, Math.min(0.42, L.yaw * 0.3));
      const hy = Math.max(-1.25, Math.min(1.25, L.yaw - tw));
      twist += (tw - twist) * w;
      yaw += (hy - yaw) * w;
      pitch += (1.3 * L.pitch - lean * Math.cos(hy) - pitch) * w;
      roll += (-lean * Math.sin(hy) - roll) * w;
    }
    // målen: bakåt med huvudet upp och lite studs, ihopsjunken, en nick –
    // eller med händerna på huvudet bakåt och upp i taket (malV 1) och
    // framåt med en knyck när handen slår i bordet (malV 2)
    const mv = malV(o);
    const smal = mv === 2 ? bump(t - (M[k] ? M[k].at : 0), 0.45, 0.55, 0.6, 0.9) : 0;
    lean += -0.1 * up + (mv === 1 ? -0.1 : 0.2) * sink + 0.08 * smal;
    pitch += -0.22 * up + (mv === 1 ? -0.34 : 0.42) * sink + 0.12 * nodW(o, t);
    // påhitten (akt): lutningen, blicken, benen och andningen
    let lift = 0;
    if (kb) {
      const w = ak.w;
      lean += (kb.lean || 0) * w;
      pitch += (kb.pitch || 0) * w;
      yaw += (kb.yaw || 0) * w;
      roll += (kb.roll || 0) * w;
      twist += (kb.twist || 0) * w;
      side += (kb.side || 0) * w;
      breath += (kb.breath || 0) * w;
      lift += (kb.lift || 0) * w;
      if (kb.knee) for (let i = 0; i < 2; i++) knee[i] += kb.knee[i] * w;
      // framåt lutar man sig utåt, inte in framför den bakom bordet (som sink)
      if (kb.lean > 0 && !kb.mitt) side += kb.lean * w * o.F.turn * DEG * 1.5;
    }
    // skålen: en nick när flaskan lyfts mot en
    const h = HEJ[k];
    if (h) pitch += 0.12 * skalW(o, t) * bump(t - h.at, 0.55, 0.75, 0.9, 1.25);
    // natten: DT nickar till, och DJ sover med huvudet på armarna på bordet
    const slum = slumW(o, t);
    if (slum > 0) {
      const nick = bump((t + o.phase) % 23, 6, 9, 14, 14.4);
      pitch += (0.2 + 0.16 * nick) * slum;
      lean += 0.06 * slum;
      breath += 0.02 * Math.sin(t * 1.3) * slum;
    }
    const sov = sovW(o, t);
    if (sov > 0) {
      const andas = Math.sin(t * 1.15 + o.phase);
      lean += (SOV.lean + 0.012 * andas - lean) * sov;
      pitch += (SOV.pitch - pitch) * sov;
      yaw += (SOV.yaw * inn - yaw) * sov;
      roll += (SOV.roll * inn - roll) * sov;
      twist *= 1 - sov;
      side *= 1 - sov;
      breath += 0.04 * andas * sov;
      for (let i = 0; i < 2; i++) knee[i] += (0.1 - knee[i]) * sov;
    }
    // humöret (humW): glad bakåtlutad med livligare ben och huvudet som
    // gungar lite, nervös framåt med benen som skakar, deppig ihopsjunken med
    // blicken ner och benen stilla – inte i sömnen eller på natten
    const hv = ready(o, t) * (1 - Math.max(sov, slum)) * (1 - nattW(t) * (1 - tvW(t)));
    if (hv > 0) {
      const gl = humW('glad', t) * hv;
      const ne = humW('nerv', t) * hv;
      const de = humW('deppig', t) * hv;
      lean += -0.04 * gl + 0.06 * ne + 0.1 * de;
      side += (0.06 * ne + 0.1 * de) * o.F.turn * DEG * 1.5;
      pitch += -0.04 * gl + 0.03 * gl * Math.sin(tt * 3.1) + 0.12 * de;
      breath -= 0.02 * de;
      for (let i = 0; i < 2; i++) {
        knee[i] += ne * (0.2 * Math.sin(t * 2.9 + o.phase + i * 2.1) + 0.05 * Math.sin(t * 5.3 + i)) + gl * 0.08 * Math.sin(t * 1.9 + o.phase + i * 2.4);
        knee[i] += (0.06 - knee[i]) * 0.6 * de;
      }
    }
    // tecknet (rum-tecken.js): huvudet på sned åt handen och lite till, också
    // om man redan tittar på en
    const tk = teckenNu(o, t);
    if (tk && TECKEN[tk.x.namn].kropp) {
      const b = TECKEN[tk.x.namn].kropp(tk.T);
      const vak = tk.w * (1 - sovW(o, t));
      lean += (b.lean || 0) * vak;
      pitch += (b.pitch || 0) * vak;
      roll -= tk.A.s * (b.roll || 0) * vak;
    }
    // skylten: huvudet mot den eller från den (LAPP_HALL)
    const lk = lappNu(o, t);
    if (lk && lk.w > 0) {
      const b = lk.kropp;
      const w = lk.w * lk.lyft;
      lean += b.lean * w;
      pitch += b.pitch * w;
      roll -= lk.A.s * b.roll * w;
      yaw += lk.A.s * b.titta * w;
      twist += b.twist * w;
      // ner till bordet och upp igen: man böjer sig fram och tittar ner
      const ned = lk.w * (1 - lk.lyft);
      lean += 0.2 * ned;
      pitch += 0.16 * ned;
    }
    breath -= 0.05 * sink;
    pitch -= 0.38 * drink - 0.06 * drag;
    // på väg från stolen och tillbaka (gaKropp): i stället för allt det andra
    const st = o.st;
    if (st && st.w > 0) {
      const g = gaKropp(o, st);
      const w = st.w;
      lean += (g.lean - lean) * w;
      pitch += (g.pitch - pitch) * w;
      yaw += (0 - yaw) * w;
      roll += (g.roll - roll) * w;
      twist *= 1 - w;
      side += (g.side - side) * w;
      breath += (1 - breath) * w;
      lift *= 1 - w;
    }
    o.torso.rotation.y = twist;
    o.torso.rotation.z += side;
    // (och ett skutt när man blir vald)
    o.torso.position.y = o.hipY + 3 + lift + (up > 0 ? 2.4 * up * Math.abs(Math.sin((t - M[k].at) * 7.5)) : 0) + (jag > 0 ? 3 * bump(valdD(o, t), 0.02, 0.14, 0.24, 0.5) : 0);
    o.torso.rotation.x = lean;
    o.chest.scale.set(1 + 0.008 * Math.sin(tt * 1.6), (1 + 0.012 * Math.sin(tt * 1.6)) * breath, 1);
    o.hg.rotation.x = pitch;
    o.hg.rotation.y = yaw;
    // huvudena nickar efter musen (headA, draw)
    o.hg.rotation.z = o.F.tilt * DEG + headA * (1 + figs.indexOf(o) * 0.15) * (1 - sov) + roll - 0.7 * side;
    for (let i = 0; i < 2; i++) { o.knees[i].rotation.x = knee[i]; o.feet[i].rotation.x = foot[i]; }
  }

  // ---------- blickarna och målen ----------
  // S: pågår matcherna (tv, sedan tvAt, från tvFrom) och hur nära spelstoppet
  // är (nag 0–1); M: det senaste målet för var och en ({ k: 1|-1|0, at }).
  const S = { tv: false, tvAt: -1e9, tvFrom: 0, nag: 0 };
  const M = {};
  // AV: när nästa avspark är (i t; lage), den förra och när den ändrades, så att
  // ett påhitt som redan har börjat inte försvinner när bollen rullar.
  const AV = { t: Infinity, fran: Infinity, at: -1e9 };
  const korsChansAt = (t) => korsChans(((t >= AV.at ? AV.t : AV.fran) - t) / 3600);
  // tv:ns ruta (rum.js: uppe till höger på högra väggen, planet −470)
  const TV = new THREE.Vector3(490, 250, -140);
  const tvW = (t) => S.tvFrom + ((S.tv ? 1 : 0) - S.tvFrom) * sm(S.tvAt, S.tvAt + 1.6, t);
  // huvudets mitt i figurens axlar och i rummets
  const headAt = (o) => new THREE.Vector3(0, o.hipY + 3 + o.T + o.F.neck + o.F.head.ry * 0.84, 0);
  const headIn = (o) => headAt(o).applyAxisAngle(UP, o.turnNu * DEG).add(o.fig.position);
  // vridningen (yaw) och lutningen (pitch, nedåt +) mot punkten P i rummet
  function aim(o, P) {
    const d = P.clone().sub(o.fig.position).applyAxisAngle(UP, -o.turnNu * DEG).sub(headAt(o));
    return { yaw: Math.atan2(d.x, d.z), pitch: Math.atan2(-d.y, Math.hypot(d.x, d.z)) };
  }
  const nearest = (o, list) => list.reduce((a, b) => (Math.abs(b.F.x - o.F.x) < Math.abs(a.F.x - o.F.x) ? b : a));
  // Vart man tittar ([punkt, vikt]): mot tv:n medan matcherna pågår, utom en
  // stund då och då (DJ pratar med DT, DL och DT ser på varandra) – och mot den
  // som omgången väntar på (inneAt = Infinity): en i taget, oftare ju närmare
  // spelstoppet, och den sista timmen (nag 1) båda samtidigt, då hen tittar upp.
  function looks(o, t) {
    const out = looks0(o, t);
    // på natten tittar DL på text-tv (och bort ibland)
    const n = nattW(t) * (1 - tvW(t));
    if (n > 0 && o.F.key === 'dl') out.push([TV, n * (1 - bump((t + o.phase) % 31, 0, 1, 4, 5.2))]);
    // dit man pekar, och på den som pekar på en
    const x = PK[o.F.key];
    const w = pekW(o, t);
    if (w > 0) out.push([x.fran.clone().lerp(x.p, sm(x.at, x.at + 0.45, t)), w]);
    const h = hejW(o, t);
    if (h > 0) out.push([OGA, h]);
    // den man klickade på tittar på en (den som sover vaknar inte)
    const tk = teckenW(o, t) * (1 - sovW(o, t));
    if (tk > 0) out.push([OGA, tk]);
    // den som valdes tittar på en medan handen är uppe, och de andra på hen
    const j = jagW(o, t);
    if (j > 0) out.push([OGA, j]);
    const v = VAL.k && VAL.k !== o.F.key ? figs.find((x) => x.F.key === VAL.k) : null;
    const jv = v ? jagW(v, t) * (1 - sovW(o, t)) : 0;
    if (jv > 0) out.push([headIn(v), 0.85 * jv]);
    // den som går iväg: en blick efter hen, och när hen kommer tillbaka
    const g = gaNu(t);
    if (g && g.o !== o && g.l < g.T.e) {
      const T = g.T;
      const gw = (bump(g.l, 0.2 + 0.3 * FI(o), 0.7 + 0.3 * FI(o), T.a + 1.6, T.a + 2.6) + bump(g.l, T.d - 2.2, T.d - 1.5, T.e - 0.2, T.e + 0.4)) * 0.85;
      if (gw > 0) out.push([huvudVid(g.o, t), gw]);
    }
    return out;
  }
  function looks0(o, t) {
    const out = [];
    const tv = tvW(t);
    if (tv > 0) out.push([TV, tv * (1 - bump((t + o.phase * 1.7) % 26, 0, 0.8, 3.6, 4.4))]);
    if (!S.nag) return out;
    const wait = figs.filter((x) => x.inneAt === Infinity);
    const by = figs.filter((x) => x.inneAt !== Infinity);
    if (!wait.length || !by.length) return out;
    const both = S.nag >= 1 ? bump(t % 27, 0, 0.5, 3.8, 4.5) : 0;
    if (o.inneAt === Infinity) {
      if (both > 0) out.push([headIn(nearest(o, by)), bump(t % 27, 1.4, 1.8, 2.9, 3.4)]);
      return out;
    }
    const per = 34 - 20 * S.nag;
    const x = t + figs.indexOf(o) * per * 0.5 + o.phase;
    const n = Math.floor(x / per);
    out.push([headIn(wait[n % wait.length]), Math.max(bump(x - n * per, 0, 0.6, 2.4 + 2 * S.nag, 3.1 + 2 * S.nag), both)]);
    return out;
  }
  // PK: dit var och en pekar ({ p, fran, at, on, w0, wAt }: punkten, den
  // förra, när den byttes, och vikten som tonar in och ut från w0 vid wAt);
  // HEJ: när man började och slutade peka på någon i gänget ({ at, ut }).
  const PK = {};
  const HEJ = {};
  // betraktaren
  const OGA = new THREE.Vector3(0, 0, D);
  const pekW = (o, t) => { const x = PK[o.F.key]; return x ? x.w0 + ((x.on ? 1 : 0) - x.w0) * sm(x.wAt, x.wAt + 0.5, t) : 0; };
  // den som sover vaknar inte
  const hejW = (o, t) => { const h = HEJ[o.F.key]; return h ? sm(h.at, h.at + 0.35, t) * (1 - sm(h.ut, h.ut + 0.6, t)) * (1 - sovW(o, t)) : 0; };
  // flaskan eller cigaretten lyfts en stund (inte medan man väntar)
  const skalW = (o, t) => { const h = HEJ[o.F.key]; return h ? bump(t - h.at, 0.15, 0.7, 2.4, 3.2) * (1 - sm(h.ut, h.ut + 0.5, t)) * ready(o, t) * (1 - sovW(o, t)) : 0; };
  // N: natten (lysröret släckt), som tonar in och ut på 2,5 sekunder
  const N = { on: false, at: -1e9, fran: 0 };
  const nattW = (t) => N.fran + ((N.on ? 1 : 0) - N.fran) * sm(N.at, N.at + 2.5, t);
  // DJ sover och DT slumrar – inte medan matcherna pågår eller man väntar på kupongen
  const sovW = (o, t) => (o.F.key === 'dj' ? nattW(t) * (1 - tvW(t)) * ready(o, t) : 0);
  const slumW = (o, t) => (o.F.key === 'dt' ? nattW(t) * (1 - tvW(t)) * ready(o, t) : 0);
  const cheerW = (o, t) => { const m = M[o.F.key]; return m && m.k > 0 ? bump(t - m.at, 0, 0.45, 3.4, 4.6) : 0; };
  const sinkW = (o, t) => { const m = M[o.F.key]; return m && m.k < 0 ? bump(t - m.at, 0.2, 0.9, 4.2, 5.4) : 0; };
  const nodW = (o, t) => { const m = M[o.F.key]; return m && m.k === 0 ? bump(t - m.at, 0, 0.35, 1.0, 1.7) : 0; };

  // Blinkningarna (ansiktet, de med ögonvitor): en gång i varje period
  // om BLINK sekunder, på ett ställe i den som klockan ger, och var femte gång
  // två i rad – ögonen stängda en dryg tiondels sekund.
  const BLINK = 4.2;
  function blinkar(o, t) {
    const x = t + o.phase * 3.1;
    const n = Math.floor(x / BLINK);
    const d = x - n * BLINK - hash(n * 7.3 + o.phase) * (BLINK - 0.6);
    return (d >= 0 && d < 0.13) || (hash(n * 3.7 + o.phase) < 0.2 && d >= 0.34 && d < 0.47);
  }

  // ---------- väntan på kupongen ----------
  // o.inneAt: när kupongen lämnades in (Infinity = väntar, −1e9 = inne sedan
  // länge). u = 0 → 1 är övergången: pennan bakom örat (u 0,28), kupongen på
  // bordet (0,3), flaskan eller cigaretten i handen (0,55),
  // som vanligt (0,82) och strax därpå det första blosset eller klunken.
  const TR = 4.4;
  const SLOT = 7.5;
  const uOf = (o, t) => (t - o.inneAt) / TR;
  const ready = (o, t) => sm(0.8, 0.9, uOf(o, t));
  const after = (o, t, a, b, c, d) => bump(t - o.inneAt - TR * 0.85, a, b, c, d);
  // VAL: vem som just valdes som den som fyller i kupongen (vald) och när.
  // Hen räcker upp handen med pennan och lyfter kupongen mot en (jagW, ett
  // par sekunder) och skriver sedan på kupongen (skrivW, drygt tre) – bara
  // den som väntar på kupongen; valW är hela stunden, då de fem sakerna
  // vilar. d = sekunder sedan hen valdes (−1 = inte hen).
  const VAL = { k: null, at: -1e9 };
  const VAL_SLUT = 5.6;
  const valdD = (o, t) => (VAL.k === o.F.key && t >= VAL.at ? t - VAL.at : -1);
  const valdW = (o, t, a, b, c, d) => { const x = valdD(o, t); return x < 0 ? 0 : bump(x, a, b, c, d) * (1 - sm(0, 0.3, uOf(o, t))); };
  const jagW = (o, t) => valdW(o, t, 0, 0.35, 1.7, 2.15);
  const skrivW = (o, t) => valdW(o, t, 1.9, 2.3, 5.0, VAL_SLUT);
  const valW = (o, t) => valdW(o, t, 0, 0.3, 5.0, VAL_SLUT);
  // TK: tecknet man klickade fram, för var och en ({ namn, at, i: armen, fran:
  // det förra om det fortfarande pågick, w0: hur högt armen redan var }).
  // Armen är den med pennan medan man väntar och annars den lediga. Handen med
  // fingrarna tar över när armen är på väg upp (TK_BYT).
  const TK = {};
  const TK_IN = 0.34;
  const TK_UT = 0.5;
  const TK_BYT = 0.3;
  const TK_STOR = 1.28;
  function teckenNu(o, t) {
    const x = TK[o.F.key];
    if (!x || t < x.at) return null;
    const T = t - x.at;
    const L = TECKEN[x.namn].langd;
    if (T >= L + TK_UT) return null;
    return { x, T, w: (x.w0 + (1 - x.w0) * sm(0, TK_IN, T)) * (1 - sm(L, L + TK_UT, T)), A: o.arms[x.i] };
  }
  const teckenW = (o, t) => { const g = teckenNu(o, t); return g ? g.w : 0; };
  // Lapparna (lappar): vem som har hur många rätt ({ tal, ink, ner: ligger på bordet, p0, at: var
  // skylten var när den började röra sig och när, ut, i: armen, meny, forst }). Vägen är en enda:
  // 0 ligger på bordet och armen vilar, LP_BORD handen är framme vid skylten, 1 uppe. Den som går
  // iväg eller somnar lägger ner den på samma väg, och när tiden är ute tonar den bort på bordet.
  // Uppe är armarna upptagna, men resten av figuren lever som vanligt. Var och en byter hållning
  // var trettionde sekund, med en tredjedels period emellan, och gör ibland något med skylten
  // (LAPP_GOR) i två luckor i varje hållning. Luckorna ligger förskjutna (2 s per person), så
  // att två sällan gör något samtidigt.
  const LP = {};
  const LP_TID = 1.35;
  const LP_BORD = 0.42;
  const LP_VILA = { tva: 0 };
  const LAPP_P = 30;
  const LAPP_BYT = 1.3;
  const LAPP_LUCKA = [6, 17];
  const LPV = {};
  // (så länge radion spelar ligger skylten på bordet: de behöver båda händerna)
  const radioLapp = (t) => { const R = SJUNG.radio; const k = sm(R.at, R.at + LP_TID, t); return R.pa ? k : 1 - k; };
  function lappVag(x, t) {
    const mal = x.ner ? 0 : 1;
    const tid = LP_TID * Math.abs(mal - x.p0);
    const d = t - x.at;
    if (d <= 0) return x.p0;
    return d >= tid ? mal : x.p0 + ((mal - x.p0) * d) / tid;
  }
  // → { w: hur mycket armen är med, lyft: 0 på bordet, 1 uppe, ton: 1 utom när tiden är ute, … }, null: ingen skylt
  function lappNu(o, t) {
    const x = LP[o.F.key];
    if (!x) return null;
    const bort = x.ut == null ? 0 : Math.max(0, t - x.ut) / LP_TID;
    if (bort >= 1) return null;
    const p = lappVag(x, t) * (1 - sm(0, 0.7, bort)) * (1 - sovW(o, t)) * (1 - (o.st ? o.st.w : 0)) * (1 - radioLapp(t));
    const w = sm(0, LP_BORD, p);
    const lyft = sm(LP_BORD, 1, p);
    const ton = 1 - sm(0.7, 1, bort);
    if (w <= 0.001) return { t, x, w: 0, lyft: 0, ton, A: o.arms[x.i], L: LP_VILA };
    if (x.nu && x.nu.t === t && x.nu.x === x) { x.nu.w = w; x.nu.lyft = lyft; x.nu.ton = ton; return x.nu; }
    const i = figs.indexOf(o);
    const c = (t + (i * LAPP_P) / 3) / LAPP_P;
    const n = Math.floor(c);
    const l = (c - n) * LAPP_P;
    const len = x.meny.length;
    const pv = LPV[o.F.key];
    const ha = LAPP_HALL[pv ? pv.hall : x.meny[(n + x.forst) % len]];
    const hb = LAPP_HALL[pv ? pv.hall : x.meny[(n + 1 + x.forst) % len]];
    const k = sm(LAPP_P - LAPP_BYT, LAPP_P, l);
    // vad man gör: en lucka i taget, och inte i varje
    let d = null;
    if (pv && pv.gor) d = LAPP_GOR[pv.gor].f(Math.min(t - pv.at, LAPP_GOR[pv.gor].len));
    else if (!pv) {
      for (let j = 0; j < LAPP_LUCKA.length; j++) {
        if (hash(n * 1.71 + i * 3.1 + j * 5.3 + KORS_FRO) > 0.72) continue;
        const g = LAPP_GOR[ha.gor[Math.floor(hash(n * 2.37 + i * 1.9 + j * 7.7 + KORS_FRO) * ha.gor.length)]];
        const dl = l - LAPP_LUCKA[j] - 2 * i;
        if (dl >= 0 && dl < g.len) d = g.f(dl);
      }
    }
    const tt = t + o.phase;
    const L = lappBlanda(ha.lage(tt), hb.lage(tt), k, d);
    const A = o.arms[x.i];
    x.nu = { t, x, w, lyft, ton, A, B: o.arms.find((b) => b !== A), L, kropp: lappKropp(ha.kropp(tt), hb.kropp(tt), k, d && d.kropp) };
    return x.nu;
  }
  // Raden man skriver på: 0,75 sekunder per rad, och den sista sjättedelen
  // tillbaka till början av nästa med pennan lyft. → { n: radens nummer, x:
  // var på raden (−1 … 1), lyft: 0–1 }
  const RAD = 0.75;
  function skrivRad(o, t) {
    const d = Math.max(0, valdD(o, t) - 2.1);
    const n = Math.floor(d / RAD);
    const f = d / RAD - n;
    return { n, x: f < 0.84 ? -1 + 2 * (f / 0.84) : 1 - 2 * sm(0.84, 1, f), lyft: bump(f, 0.8, 0.86, 0.95, 1) };
  }
  // Vad man gör just nu: de fem sakerna turas om, en i taget, med en stund
  // emellan. b = [tugga på pennan, snegla på ölen, otåliga ben, kika ner mot
  // pulten, vända på kupongen], l = sekunder in i den.
  function acts(o, t) {
    const V = o.F.vanta;
    const x = t + V.fas;
    const n = Math.floor(x / SLOT);
    const l = x - n * SLOT;
    const b = [0, 0, 0, 0, 0];
    b[V.ordning[((n % 5) + 5) % 5]] = bump(l, 0.3, 1.3, 5.9, 6.9) * (1 - valW(o, t));
    return { b, l };
  }
  function waitBody(o, t) {
    const { b, l } = acts(o, t);
    const [tugg, ol, ben, kika, vrid] = b;
    const F = o.F;
    // en suck efter blicken på ölen och efter kupongen mot lysröret
    const suck = (ol + vrid) * bump(l, 4.5, 5.0, 5.6, 6.4);
    const glance = ol * bump(l, 1.1, 1.7, 3.5, 4.3);
    const scratch = tugg * sm(3.4, 4.2, l);
    const chew = tugg - scratch;
    return {
      lean: 0.2 + 0.24 * kika + 0.08 * suck - 0.08 * vrid + 0.02 * Math.sin(t * 0.5 + o.phase),
      pitch: 0.26 + 0.3 * kika - 0.32 * vrid + 0.1 * suck + 0.1 * glance - chew * (0.22 + 0.03 * Math.sin(t * 9)) + 0.12 * scratch,
      yaw: F.vanta.blick * glance - kika * F.turn * DEG * 0.8 + 0.04 * Math.sin(t * 0.37 + o.phase),
      // och lutar sig ut åt sidan mot pulten, inte in framför den bakom bordet
      side: kika * F.turn * DEG * 0.3,
      breath: 1 - 0.04 * suck,
      knee: [0, 1].map((i) => 0.06 + (1 - ben) * 0.16 * Math.sin(t * 1.15 + o.phase + i * 2.4) + ben * (0.3 * Math.sin(t * 2.9 + o.phase + i * 2.1) + 0.06 * Math.sin(t * 5.3 + i))),
      foot: [0, 1].map((i) => 0.5 - (i === F.vanta.fot ? ben * 0.34 * Math.max(0, Math.sin(t * 9.5)) ** 2 : 0)),
    };
  }

  // Handen som håller ett föremål med matrisen M (figurens axlar), när
  // föremålet sitter som local i handen.
  const IM = new THREE.Matrix4();
  function grip(M, local, pole) {
    const e = M.clone().multiply(IM.copy(local).invert()).elements;
    return { p: new THREE.Vector3(e[12], e[13], e[14]), y: new THREE.Vector3(e[4], e[5], e[6]), z: new THREE.Vector3(e[8], e[9], e[10]), pole };
  }
  function lerpPose(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    const y = a.y.clone().lerp(b.y, k);
    const z = a.z.clone().lerp(b.z, k);
    return { p: a.p.clone().lerp(b.p, k), y: y.lengthSq() > 1e-3 ? y : b.y, z: z.lengthSq() > 1e-3 ? z : b.z, pole: a.pole.clone().lerp(b.pole, k) };
  }
  // en punkt i huvudets axlar i figurens
  const inHead = (o, v) => {
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    return v.clone().applyMatrix4(o.hc.matrix).applyMatrix4(o.hg.matrix).applyMatrix4(o.torso.matrix);
  };
  // pennan med spetsen i tip, riktad dir
  const penAt = (tip, dir) => frameM(tip.clone().addScaledVector(dir, -PEN_TIP), dir, Math.abs(dir.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0));

  // Kupongen i handen: framför magen, lutad mot den som läser – eller (vrid)
  // uppe i ansiktshöjd, där den vänds så att framsidan syns. Den som just
  // valdes lyfter den mot en (jagW) och lutar den bakåt för att skriva (skrivW).
  function paperM(o, t) {
    const { b, l } = acts(o, t);
    const vrid = b[4];
    const Wd = o.F.w;
    const sk = o.kp.s;
    const jag = jagW(o, t);
    const skriv = skrivW(o, t);
    // så långt fram att den går fri från bröstet när han lutar sig över den
    const c = new THREE.Vector3(sk * Wd * 0.14, o.hipY + o.T * 0.5 + 0.8 * Math.sin(t * 0.9 + o.phase), o.F.depth + 24)
      .lerp(new THREE.Vector3(sk * Wd * 0.02, o.hipY + o.T * 0.98, o.F.depth + 34), vrid)
      .lerp(new THREE.Vector3(sk * Wd * 0.3, o.hipY + o.T * 0.8, o.F.depth + 36), jag)
      // (lite längre fram, där den syns under huvudet)
      .lerp(new THREE.Vector3(sk * Wd * 0.08, o.hipY + o.T * 0.52, o.F.depth + 34), skriv);
    // nästan upprätt, så att baksidan syns framifrån
    const be = (24 - 14 * vrid + 8 * skriv) * DEG;
    const ph = Math.PI * vrid * bump(l, 1.7, 2.6, 3.9, 4.8);
    const Y = new THREE.Vector3(0, Math.cos(be), Math.sin(be));
    const X0 = new THREE.Vector3(-1, 0, 0);
    const Z0 = new THREE.Vector3().crossVectors(X0, Y);
    return frameM(c, X0.multiplyScalar(Math.cos(ph)).addScaledVector(Z0, Math.sin(ph)), Y);
  }
  function kupPose(o, A, t) {
    return grip(paperM(o, Math.min(t, o.inneAt)), A.kup.matrix, new THREE.Vector3(A.s, -0.5, -0.5));
  }
  // Pennan: mot kupongen (och knackar på den), i munnen, bakom örat där det
  // kliar, eller vilande på låret medan kupongen hålls upp.
  function penPose(o, A, t) {
    t = Math.min(t, o.inneAt);
    const { b, l } = acts(o, t);
    const [tugg, , ben, , vrid] = b;
    const L = A.pen.matrix;
    const sp = A.s;
    const pole = new THREE.Vector3(sp, -0.45, -0.55);
    const M = paperM(o, t);
    const e = M.elements;
    const X = new THREE.Vector3(e[0], e[1], e[2]);
    const Y = new THREE.Vector3(e[4], e[5], e[6]);
    const Z = new THREE.Vector3(e[8], e[9], e[10]);
    const tap = 1.4 * (ben + 0.3 * (1 - ben)) * Math.max(0, Math.sin(t * (ben > 0.5 ? 9.5 : 3.1))) ** 6;
    const tip = new THREE.Vector3(e[12], e[13], e[14]).addScaledVector(Y, KH * 0.22).addScaledVector(X, -sp * KW * 0.12).addScaledVector(Z, 1.2 + tap);
    let hp = grip(penAt(tip, Y.clone().multiplyScalar(-0.8).addScaledVector(new THREE.Vector3(sp, 0, 0), -0.45).addScaledVector(Z, -0.4).normalize()), L, pole);
    if (tugg > 0) {
      const dir = new THREE.Vector3(sp * 0.35, -0.38, 0.86).normalize();
      const end = mouthIn(o).add(new THREE.Vector3(0, 0.7 * Math.sin(t * 9), 1.2));
      const chew = grip(penAt(end.addScaledVector(dir, PEN_TIP - PEN_END), dir), L, new THREE.Vector3(sp, -0.7, 0.1));
      const P = o.F.head;
      const spot = inHead(o, new THREE.Vector3(sp * P.rx * 0.8, P.ry * 0.05 + 2 * Math.sin(t * 12), -P.rz * 0.62));
      const scratch = grip(penAt(spot, new THREE.Vector3(-sp * 0.45, 0.25, -0.86).normalize()), L, new THREE.Vector3(sp, -0.2, -0.4));
      hp = lerpPose(hp, lerpPose(chew, scratch, sm(3.4, 4.2, l)), tugg);
    }
    if (vrid > 0) {
      const knee = grip(penAt(new THREE.Vector3(sp * o.F.w * 0.36, o.hipY + 13, o.thigh * 1.05), new THREE.Vector3(-sp * 0.25, -0.15, 0.95).normalize()), L, pole);
      hp = lerpPose(hp, knee, vrid);
    }
    // vald: handen med pennan upp (snett utåt, huvudena är stora) och viftar,
    // och sedan skriver den på kupongen rad för rad, med pennan lyft mellan raderna
    const skriv = skrivW(o, t);
    if (skriv > 0) {
      const r = skrivRad(o, t);
      const pa = 1 - r.lyft;
      const at = new THREE.Vector3(e[12], e[13], e[14])
        .addScaledVector(X, KW * (-0.04 + 0.3 * r.x) + 0.5 * Math.sin(t * 23) * pa)
        .addScaledVector(Y, KH * (0.3 - 0.16 * (r.n % 4) - 0.08 * r.lyft) + 1.1 * Math.sin(t * 41) * pa)
        .addScaledVector(Z, 0.9 + 2.6 * r.lyft);
      const dir = Y.clone().multiplyScalar(-0.75).addScaledVector(new THREE.Vector3(sp, 0, 0), -0.4).addScaledVector(Z, -0.5).normalize();
      hp = lerpPose(hp, grip(penAt(at, dir), L, pole), skriv);
    }
    const jag = jagW(o, t);
    if (jag > 0) {
      const d = valdD(o, t);
      const n = o.F.a + o.F.b;
      const vift = Math.sin((d - 0.35) * 9) * sm(0.3, 0.55, d);
      const dir = new THREE.Vector3(sp * (0.3 + 0.32 * vift), 1, 0.1).normalize();
      const uppe = shoulder(o, o.pen).add(new THREE.Vector3(sp * n * (0.42 + 0.05 * vift), n * 0.7, n * 0.18));
      hp = lerpPose(hp, grip(penAt(uppe.addScaledVector(dir, PEN_TIP + 3), dir), L, new THREE.Vector3(sp, -0.6, -0.3)), jag);
    }
    return hp;
  }
  function earPose(o, A) {
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    const M = o.torso.matrix.clone().multiply(o.hg.matrix).multiply(o.hc.matrix).multiply(o.earPen.matrix);
    return grip(M, A.pen.matrix, new THREE.Vector3(A.s, -0.3, -0.5));
  }

  // när var och en dricker och drar ett bloss (0 → 1 → 0) – inte medan man
  // väntar, och strax efter inlämningen den första klunken eller blosset
  // (inte i sömnen, och DT:s cigarett har brunnit ner när han slumrar)
  // (och inte medan man gör något annat, aktW)
  const drinkW = (o, t) => Math.max(o.F.key === 'dt' ? 0 : gaKlunk(o, t), ready(o, t) * (1 - sovW(o, t)) * (1 - aktW(o, t)) * (o.F.key === 'dl' ? bump(t % 15, 6, 7.4, 9.6, 11) : o.F.key === 'dj' ? bump((t + 4) % 19, 11, 12.4, 14.2, 15.6) : 0),
    o.F.key === 'dl' ? after(o, t, 0, 1.0, 2.6, 3.6) : 0);
  const dragW = (o, t) => Math.max(o.F.key === 'dt' ? gaKlunk(o, t) : 0, ready(o, t) * (1 - sovW(o, t) - slumW(o, t)) * (1 - aktW(o, t)) * (o.F.key === 'dt' ? bump(t % 12, 3, 4.2, 5.4, 6.6) : o.F.key === 'dj' ? bump((t + 5) % 16, 1, 2.2, 3.2, 4.4) : 0),
    o.F.key === 'dl' ? 0 : after(o, t, 0, 1.0, 2.6, 3.6));
  const talkW = (o, t) => (o.F.key === 'dj' ? ready(o, t) * (1 - dragW(o, t)) * (1 - sovW(o, t)) * (1 - aktW(o, t)) : 0);
  const glowAt = (o, t) => Math.max(ready(o, t) * (1 - sovW(o, t) - slumW(o, t)) * (1 - aktW(o, t)) * (o.F.key === 'dt' ? bump(t % 12, 4, 4.4, 5.2, 5.8) : bump((t + 5) % 16, 2.1, 2.5, 3.0, 3.6)), after(o, t, 1.0, 1.4, 2.2, 2.8));

  const mouthIn = (o) => {
    o.fig.updateMatrix(); o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    return o.mouth.clone().applyMatrix4(o.hc.matrix).applyMatrix4(o.hg.matrix).applyMatrix4(o.torso.matrix);
  };
  const shoulder = (o, A) => { o.torso.updateMatrix(); return A.S.clone().applyMatrix4(o.torso.matrix); };

  // Handens läge (figurens axlar): position, y- och z-axel och armbågens
  // riktning – medan man väntar, på väg från kupongen och pennan till det man
  // får när den är inne, och sedan (handDone) som vanligt.
  function handPose(o, A, t) {
    const u = uOf(o, t);
    if (u >= 1) return handDone(o, A, t);
    const wait = A === o.pen ? penPose(o, A, t) : kupPose(o, A, t);
    if (u < 0) return wait;
    const pick = () => grip(A.bench.matrix, (A.thing || A.cig).matrix, new THREE.Vector3(A.s, -0.4, -0.6));
    if (A === o.pen) {
      if (u < 0.28) return lerpPose(wait, earPose(o, A), sm(0, 0.28, u));
      const next = A.bench ? pick() : handDone(o, A, t);
      if (u < 0.55) return lerpPose(earPose(o, A), next, sm(0.28, 0.55, u));
      if (A.bench && u < 0.82) return lerpPose(next, handDone(o, A, t), sm(0.55, 0.82, u));
      return handDone(o, A, t);
    }
    const put = grip(o.kupBench.matrix, A.kup.matrix, new THREE.Vector3(A.s, -0.2, -0.8));
    if (u < 0.3) return lerpPose(wait, put, sm(0, 0.3, u));
    const next = A.bench ? pick() : handDone(o, A, t);
    if (u < 0.55) return lerpPose(put, next, sm(0.3, 0.55, u));
    if (A.bench && u < 0.82) return lerpPose(next, handDone(o, A, t), sm(0.55, 0.82, u));
    return handDone(o, A, t);
  }
  // Vid ett mål: flaskan eller näven upp, handen eller flaskan mot
  // pannan – från det man gjorde, och tillbaka.
  function handDone(o, A, t) {
    let base = handRest(o, A, t);
    const sov = sovW(o, t);
    if (sov > 0) base = lerpPose(base, sovPose(o, A, t), sov);
    const sk = A === skalArm(o) ? skalW(o, t) : 0;
    if (sk > 0) base = lerpPose(base, skalPose(o, A, t), sk);
    // påhitten (akt): armen som påhittet använder
    const ak = aktNu(o, t);
    const ap = ak && ak.a.hand ? ak.a.hand(o, A, t, ak.l, ak) : null;
    if (ap) base = lerpPose(base, ap, ak.w);
    // målen, på tre sätt (malV): 0 som förut, 1 båda armarna upp (rätt) eller
    // båda händerna på huvudet (fel), 2 handen som dunkar i bordet av glädje
    // eller slår i det en gång
    const i = o.arms.indexOf(A);
    const v = malV(o);
    const up = cheerW(o, t);
    if (up > 0) {
      if (v === 1) return lerpPose(base, A.thing || A.fist ? cheerPose(o, A, t) : armUpp(o, A, t), up);
      if (v === 2 ? A === fri(o) : i === o.F.mal.jubel) return lerpPose(base, v === 2 ? slag(o, A, t, true) : cheerPose(o, A, t), up);
    }
    const sink = sinkW(o, t);
    if (sink > 0) {
      if (v === 1) return lerpPose(base, haret(o, A, t), sink);
      if (v === 2 ? A === fri(o) : i === o.F.mal.panna) return lerpPose(base, v === 2 ? slag(o, A, t, false) : palmPose(o, A, t), sink);
    }
    return base;
  }
  // Armen snett uppåt, utåt och lite framåt (huvudena är stora: rakt upp når
  // den inte över dem) och skakar lite: flaskan upprätt, näven
  // med underarmen – p är handleden för näven (pose).
  function cheerPose(o, A, t) {
    const s = A.s;
    const dt = t - M[o.F.key].at;
    const shake = Math.sin(dt * 15) * 2.2 * sm(0.4, 0.7, dt) * (1 - sm(2.6, 3.4, dt));
    const S0 = shoulder(o, A);
    if (A.thing) {
      const n = o.F.a + o.F.b;
      return { p: S0.add(new THREE.Vector3(s * n * 0.5, n * 0.58 + shake, n * 0.3)), y: new THREE.Vector3(s * 0.25, 1, 0.05), z: new THREE.Vector3(-s * 0.55, -0.75, -0.3), pole: new THREE.Vector3(s, -0.6, -0.3) };
    }
    const n = o.F.a + o.F.b;
    return { p: S0.add(new THREE.Vector3(s * n * 0.42, n * 0.62 + shake, n * 0.1)), y: new THREE.Vector3(s * 0.2, 0.1, 1), z: new THREE.Vector3(-s * 0.45, -0.9, 0), pole: new THREE.Vector3(s, -0.6, -0.3) };
  }
  // Skålen: flaskan (DT cigaretten) lyfts fram mot den som
  // pekar på en, med en liten stöt framåt när man nickar.
  const skalArm = (o) => o.arms.find((A) => A.thing) || o.arms.find((A) => A.kind === 'cigg');
  function skalPose(o, A, t) {
    const s = A.s;
    const n = o.F.a + o.F.b;
    const h = HEJ[o.F.key];
    const fram = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, -o.F.turn * DEG);
    const sid = new THREE.Vector3(1, 0, 0).applyAxisAngle(UP, -o.F.turn * DEG);
    const stot = h ? 3 * bump(t - h.at, 0.55, 0.75, 0.9, 1.3) : 0;
    const S0 = shoulder(o, A);
    if (A.thing) {
      const p = S0.addScaledVector(sid, s * n * 0.12).addScaledVector(fram, n * 0.6 + stot).add(new THREE.Vector3(0, n * 0.36, 0));
      return { p, y: new THREE.Vector3(0, 1, 0).addScaledVector(fram, 0.3), z: sid.clone().multiplyScalar(s * 0.9).addScaledVector(fram, 0.35), pole: new THREE.Vector3(s, -0.6, -0.4) };
    }
    const p = S0.addScaledVector(sid, s * n * 0.16).addScaledVector(fram, n * 0.5 + stot).add(new THREE.Vector3(0, n * 0.3, 0));
    return { p, y: new THREE.Vector3(0, 0.75, 0).addScaledVector(fram, 0.6).addScaledVector(sid, s * 0.15), z: sid.clone().multiplyScalar(s * 0.85).add(new THREE.Vector3(0, 0.4, 0)), pole: new THREE.Vector3(s, -0.6, -0.4) };
  }
  // Sömnen (DJ): lutad fram över bordet med armarna i kors på skivan och
  // huvudet på dem, vänt utåt (SOV: bålen, huvudet och var händerna ligger).
  const SOV = { lean: 0.85, pitch: 0.45, yaw: -0.7, roll: -0.8, fram: 58, sid: 11, lyft: 4 };
  function sovPose(o, A, t) {
    const s = A.s;
    // mot bordets mitt i figurens axlar
    const mot = new THREE.Vector3(BORD.x - o.F.x, 0, BORD.z - o.F.z).applyAxisAngle(UP, -o.F.turn * DEG);
    mot.y = 0;
    const kant = mot.length() - BORD.r;
    mot.normalize();
    const tvar = new THREE.Vector3(mot.z, 0, -mot.x);
    const p = mot.clone().multiplyScalar(kant + SOV.fram).addScaledVector(tvar, s * SOV.sid).add(new THREE.Vector3(0, BORD.y + 3 + (s > 0 ? SOV.lyft : 0), 0));
    return { p, y: tvar.clone().multiplyScalar(-s).addScaledVector(mot, 0.25), z: new THREE.Vector3(0, 1, 0), pole: new THREE.Vector3(s, -0.2, -0.3) };
  }
  // Handflatan över ögonen och pannan – eller den kalla flaskan mot pannan.
  function palmPose(o, A, t) {
    const s = A.s;
    const P = o.F.head;
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    const Mh = o.torso.matrix.clone().multiply(o.hg.matrix).multiply(o.hc.matrix);
    const dir = (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(Mh);
    if (A.thing) {
      const r = 7.6;
      return { p: inHead(o, new THREE.Vector3(s * P.rx * 0.12, P.ry * 0.12, P.rz * 0.96 + r + 1)), y: dir(0, 1, 0.15), z: dir(s * 0.7, -0.5, 0.5), pole: new THREE.Vector3(s, -0.7, 0.2) };
    }
    return { p: inHead(o, new THREE.Vector3(s * P.rx * 0.14, -P.ry * 0.3, P.rz * 0.96 + o.F.arm * 1.1)), y: dir(-s * 0.25, 1, -0.12), z: dir(0, 0, 1), pole: new THREE.Vector3(s, -0.7, 0.3) };
  }
  // Flaskan vid munnen, lutad mer ju längre in i klunken (w).
  function supAt(o, A, t, w) {
    const s = A.s;
    const top = A.thing.userData.top;
    const m = mouthIn(o);
    const u = new THREE.Vector3(-s * 0.12, 0.52 + 0.25 * w, -0.85).normalize();
    u.y += 0.03 * Math.sin(t * 3) * w;
    const at = m.clone().sub(u.clone().multiplyScalar(top - 1)).add(new THREE.Vector3(0, 0, 1.5));
    return { p: at, y: u, z: new THREE.Vector3(s * 0.85, -0.3, 0.2), pole: new THREE.Vector3(s, -0.35, -0.2) };
  }
  // Ett bloss: filtret mot läpparna, handen framför munnen och fingrarna uppåt.
  function blossAt(o, A) {
    const s = A.s;
    const m = mouthIn(o);
    const y = new THREE.Vector3(s * 0.25, 1, 0.35);
    const z = new THREE.Vector3(0, 0.1, 1);
    const q = o.F.arm;
    orient(scratch, new THREE.Vector3(), y, z); scratch.updateMatrix();
    const filt = A.cig.position.clone().add(new THREE.Vector3(-12, 0, 0)).applyMatrix4(scratch.matrix);
    const at = m.clone().sub(filt).add(new THREE.Vector3(0, -q * 0.2, 2));
    return { p: at, y, z, pole: new THREE.Vector3(s, -0.7, 0.1) };
  }
  function handRest(o, A, t) {
    const { s } = A;
    const Wd = o.F.w;
    const th = o.thigh;
    const y0 = o.hipY;
    if (A.kind === 'flaska') {
      // står på bordet i handen, där den stod medan man väntade
      const rest = grip(A.bench.matrix, A.thing.matrix, new THREE.Vector3(s, -0.6, -0.6));
      const w = drinkW(o, t);
      if (w <= 0) return rest;
      const d = supAt(o, A, t, w);
      return { p: rest.p.clone().lerp(d.p, w), y: rest.y.clone().lerp(d.y, w), z: rest.z.clone().lerp(d.z, w), pole: d.pole };
    }
    if (A.kind === 'cigg' || A.kind === 'prat') {
      // vilar på bordet (DT, vid askkoppen) med glöden framåt, gestikulerar
      // (DJ) och tar ett bloss
      const ak = o.F.plats.aska;
      const rest = A.kind === 'cigg'
        ? { p: new THREE.Vector3(ak[0] - s * 8.1, BORD.y + 7, ak[1] + 4.5), y: new THREE.Vector3(s * 0.2, 0.6, 1), z: new THREE.Vector3(s * 0.9, 0.4, -0.2), pole: new THREE.Vector3(s, -0.4, -0.7) }
        : { p: new THREE.Vector3(s * Wd * 0.4, y0 + 13, th * 0.78), y: new THREE.Vector3(-s * 0.15, 0.25, 1), z: new THREE.Vector3(s * 0.4, 1, -0.1), pole: new THREE.Vector3(s, -0.5, -0.5) };
      if (A.kind === 'prat') {
        const k = talkW(o, t);
        const a = t * 0.9;
        rest.p.lerp(new THREE.Vector3(s * (Wd * 1.15 + 9 * Math.sin(a)), o.T * 0.42 + 8 * Math.sin(a * 1.7) + y0, th * 0.9 + 6 * Math.cos(a * 1.3)), k);
        rest.y.lerp(new THREE.Vector3(s * 0.2 + 0.25 * Math.sin(a * 1.1), 1, 0.55), k);
        rest.z.lerp(new THREE.Vector3(s * 0.3, -0.2, -1), k);
      }
      const w = dragW(o, t);
      if (w <= 0) return rest;
      const d = blossAt(o, A);
      return { p: rest.p.clone().lerp(d.p, w), y: rest.y.clone().lerp(d.y, w), z: rest.z.clone().lerp(d.z, w), pole: d.pole };
    }
    // vila: handflatan mot bordet bakom det, annars på knät
    const bv = o.F.plats.vila;
    if (bv) return { p: new THREE.Vector3(bv[0], BORD.y + 3, bv[1]), y: new THREE.Vector3(-s * 0.1, -0.05, 1), z: new THREE.Vector3(0, 1, 0.05), pole: new THREE.Vector3(s, -0.3, -0.6) };
    return { p: new THREE.Vector3(s * Wd * 0.36, y0 + 9, th * 0.92), y: new THREE.Vector3(-s * 0.1, -0.15, 1), z: new THREE.Vector3(0, 1, 0.1), pole: new THREE.Vector3(s, -0.3, -0.6) };
  }

  // ---------- humöret och påhitten ----------
  // Hur det går för gängets kupong (spel, från rum.js): 'glad' (bättre än
  // väntat, eller vinst när allt är spelat), 'nerv' (ett fel till och vinsten
  // är borta, eller sämre än väntat) eller 'deppig' (kupongen är död) – och
  // utan det dagen efter (DE: bra → glad, illa → deppig). HUM har läget, när
  // det ändrades och det förra, så att samma tid ger samma bild; rank vem
  // som leder omgången (1) och ligger sist (−1) på sina egna tips.
  const HUM = { lage: null, fran: null, at: -1e9, rank: {}, rankFran: {}, rankAt: -1e9 };
  const humOf = (x) => x || (DE.lage === 'bra' ? 'glad' : DE.lage === 'illa' ? 'deppig' : null);
  const humAt = (t) => humOf(t >= HUM.at ? HUM.lage : HUM.fran);
  const rankAt = (k, t) => (t >= HUM.rankAt ? HUM.rank : HUM.rankFran)[k] || 0;
  // hur mycket av läget x som syns vid t (övergången tar 2,5 sekunder)
  function humW(x, t) {
    const k = sm(HUM.at, HUM.at + 2.5, t);
    return (humOf(HUM.lage) === x ? k : 0) + (humOf(HUM.fran) === x ? 1 - k : 0);
  }

  // Påhitten: korta rörelser (AKTER) som var och en gör då och då, ett i
  // taget, i luckor om AKT_SLOT sekunder (förskjutna, så att de inte börjar
  // samtidigt). Vilket påhitt och hur ofta beror på humöret (MENY): utan
  // läge ibland något lugnt, glad bakåtlutad med händerna i nacken och ölen i
  // luften, nervös naglarna, händerna knäppta framför munnen och fingrarna som
  // trummar, deppig hakan i handen, huvudet som skakas, armarna i kors och
  // blicken ner i flaskan. Den som leder omgången lutar sig oftare bakåt med
  // händerna i nacken, och den som ligger sist sitter oftare med armarna i
  // kors. Gänget gör också saker tillsammans (grupp, GRUPP), oftast när det går
  // bra: skålar över bordet och tar en klunk (DT ett bloss), sjunger allsång
  // som på läktaren (allsången nedan), skrattar åt ett skämt (skamt), grälar om
  // något medan den tredje tittar på (gral) eller tittar upp på tv:n när någon
  // pekar (titta). Inget påhitt medan man väntar på kupongen,
  // sover, reagerar på ett mål eller skålar med den som pekar på en (vaken).
  const AKT_SLOT = 11;
  const GRUPP_SLOT = 31;
  const MENY = {
    lugn: { chans: 0.4, dl: ['strack', 'klia', 'trumma', 'stirrar', 'hakan'], dt: ['strack', 'klia', 'trumma', 'hakan', 'nacke'], dj: ['strack', 'klia', 'trumma', 'stirrar', 'hakan'] },
    glad: { chans: 0.75, dl: ['gung', 'nacke', 'strack', 'gung'], dt: ['nacke', 'gung', 'strack', 'nacke'], dj: ['gung', 'nacke', 'trumma', 'strack'] },
    nerv: { chans: 0.85, dl: ['naglar', 'knappt', 'trumma', 'klia'], dt: ['knappt', 'trumma', 'naglar', 'klia'], dj: ['naglar', 'knappt', 'trumma', 'klia'] },
    deppig: { chans: 0.85, dl: ['hakan', 'skakar', 'kors', 'stirrar'], dt: ['hakan', 'skakar', 'kors', 'hakan'], dj: ['dunk', 'hakan', 'skakar', 'stirrar', 'kors'] },
  };
  const FI = (o) => FIGS.findIndex((F) => F.key === o.F.key);
  // PROV: ett påhitt som var och en gör om och om igen från at (prova, ?rum-akt)
  const PROV = {};
  // Gänget tillsammans: i var GRUPP_SLOT:e sekund ett påhitt ur GRUPP efter
  // humöret, med chansen efter namnet (fyra gånger av fem när det går bra,
  // varannan som vanligt, sällan när kupongen är död). Skämtet, grälet och tv:n kräver
  // att alla tre är vakna och har lämnat in, och att matcherna inte pågår (ALLA).
  const GRUPP = {
    lugn: [['skamt', 0.18], ['gral', 0.12], ['titta', 0.1], ['skal', 0.06]],
    glad: [['skal', 0.33], ['allsang', 0.27], ['skamt', 0.2]],
    nerv: [['gral', 0.14], ['titta', 0.06]],
    deppig: [['skamt', 0.07]],
  };
  const ALLA = new Set(['skamt', 'gral', 'titta', 'korsaSmitta']);
  const allaVakna = (t) => nattW(t) < 0.01 && tvW(t) < 0.01 && figs.every((o) => ready(o, t) > 0.99);
  // (utan hänsyn till den som går iväg, gaNu)
  function grupp0(t) {
    const n = Math.floor((t - 4) / GRUPP_SLOT);
    const t0 = n * GRUPP_SLOT + 4;
    const r = hash(n * 5.71 + 2.3);
    let namn = null;
    let acc = 0;
    for (const [k, p] of GRUPP[humAt(t0) || 'lugn']) if (!namn && r < (acc += p)) namn = k;
    if (hash(n * 3.19 + KORS_FRO) < 1.5 * korsChansAt(t0)) namn = 'korsaSmitta';
    // (allsången på ett av sina sätt)
    if (namn === 'allsang') namn = sangVal(n, t0);
    if (!namn || (ALLA.has(namn) && !allaVakna(t0))) return null;
    const l = t - t0;
    return l < AKTER[namn].len ? { namn, l, t0, n } : null;
  }
  // och inte medan någon är borta
  function grupp(t) {
    const x = grupp0(t);
    if (!x) return null;
    const len = AKTER[x.namn].len;
    return gaNu(x.t0) || gaNu(x.t0 + len / 2) || gaNu(x.t0 + len) ? null : x;
  }
  // Var och ens eget påhitt i luckan där t är (inte samtidigt som gänget gör något).
  function egen(o, t) {
    const i = FI(o);
    const fas = 1.3 + i * 3.7;
    const n = Math.floor((t + fas) / AKT_SLOT);
    const t0 = n * AKT_SLOT - fas + 0.5;
    const l = t - t0;
    const meny = MENY[humAt(t0) || 'lugn'];
    const ks = hash(n * 2.93 + i * 7.7 + KORS_FRO) < korsChansAt(t0) ? korsaVal(o, n, i) : null;
    if (l < 0 || (!ks && hash(n * 7.31 + i * 13.7 + 0.5) > meny.chans)) return null;
    const val = meny[o.F.key].slice();
    const r = rankAt(o.F.key, t0);
    if (r > 0) val.push('nacke', 'nacke');
    if (r < 0) val.push('kors', 'kors');
    const namn = ks || val[Math.floor(hash(n * 3.17 + i * 5.3 + 0.25) * val.length)];
    const len = AKTER[namn].len;
    if (l >= len || grupp(t0) || grupp(t0 + len / 2) || grupp(t0 + len)) return null;
    return { namn, l, t0 };
  }
  function aktRa(o, t) {
    const pv = PROV[o.F.key];
    if (!pv) {
      // sången efter ett mål och från radion går före, och det som pågår när den börjar tonar bort (av)
      const f = tvingad(o, t);
      if (f) return f;
      const x = grupp(t) || egen(o, t);
      const s = x && tvingStart(x.t0, x.t0 + AKTER[x.namn].len);
      return s == null ? x : s > x.t0 ? { ...x, av: s } : null;
    }
    const per = AKTER[pv.namn].len + 1.5;
    const l = (((t - pv.at) % per) + per) % per;
    return { namn: pv.namn, l, t0: t - l };
  }
  const vaken = (o, t) => ready(o, t) * (1 - sovW(o, t) - slumW(o, t)) * (1 - nattW(t) * (1 - tvW(t)))
    * (1 - Math.max(cheerW(o, t), sinkW(o, t), nodW(o, t))) * (1 - hejW(o, t)) * (1 - teckenW(o, t)) * (1 - gaHar(o, t));
  // Påhittet som pågår vid t ({ namn, a, l, t0, w }) eller null.
  function aktNu(o, t) {
    const x = aktRa(o, t);
    if (!x) return null;
    const a = AKTER[x.namn];
    const w = bump(x.l, 0, a.in, a.len - a.ut, a.len) * vaken(o, t) * (x.av != null ? 1 - sm(x.av, x.av + 0.9, t) : 1);
    return w > 0.001 ? { ...x, a, w } : null;
  }
  const aktW = (o, t) => { const x = aktNu(o, t); return x ? x.w : 0; };
  // utandningen efter blosset i skålen (DT)
  const blasW = (o, t) => {
    const x = aktNu(o, t);
    if (x && x.namn === 'korsaSak' && !skalArm(o).thing) return bump(x.l, 5, 5.3, 6, 6.4) * vaken(o, t);
    return x && x.namn === 'skal' && !skalArm(o).thing ? bump(x.l, 5.4, 5.7, 6.6, 7.3) * vaken(o, t) : 0;
  };

  // Armarna: den fria (DL:s och DT:s lediga hand, DJ:s med cigaretten) och
  // den med flaskan eller (DT) cigaretten (skalArm).
  const fri = (o) => o.arms.find((A) => A.kind === 'vila' || A.kind === 'prat');
  // en punkt i bålens axlar i figurens
  const iBal = (o, v) => { o.torso.updateMatrix(); return v.clone().applyMatrix4(o.torso.matrix); };
  // en punkt i rummet i figurens axlar
  const iFig = (o, P) => P.clone().sub(o.fig.position).applyAxisAngle(UP, -o.turnNu * DEG);
  // riktningar i huvudets axlar i figurens
  function huvudAxlar(o) {
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    const Mh = o.torso.matrix.clone().multiply(o.hg.matrix).multiply(o.hc.matrix);
    return (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(Mh);
  }
  // mot bordets mitt (vågrätt, figurens axlar), avståndet till kanten och tvärs
  function motBord(o) {
    const mot = new THREE.Vector3(BORD.x - o.F.x, 0, BORD.z - o.F.z).applyAxisAngle(UP, -o.F.turn * DEG);
    mot.y = 0;
    const kant = mot.length() - BORD.r;
    mot.normalize();
    return { mot, kant, tvar: new THREE.Vector3(mot.z, 0, -mot.x) };
  }
  // Den öppna handen med handflatan mot punkten P (fingrarna y, handryggen z).
  function handflata(o, P, y, z, pole) {
    const q = o.F.arm;
    const Y = y.clone().normalize();
    return { p: P.clone().addScaledVector(Y, -q * 1.15).addScaledVector(z.clone().normalize(), q * 0.9), y: Y, z, pole };
  }
  // Handen platt på bordet, d in från kanten och x åt sin sida (bakom bordet
  // där den brukar vila), lyft en bit.
  function paBordet(o, A, d, x, lyft = 0) {
    const bv = o.F.plats.vila;
    const { mot, kant, tvar } = motBord(o);
    const p = bv && A.kind === 'vila' ? new THREE.Vector3(bv[0], 0, bv[1]) : mot.clone().multiplyScalar(kant + d).addScaledVector(tvar, A.s * x);
    p.y = BORD.y + 3 + lyft;
    return { p, y: mot.clone().addScaledVector(tvar, -A.s * 0.25).add(new THREE.Vector3(0, -0.06, 0)), z: new THREE.Vector3(0, 1, 0.05), pole: new THREE.Vector3(A.s, -0.3, -0.6) };
  }
  // Armen upp med flaskan eller den öppna handen, snett utåt.
  function upp(o, A, x, y, z) {
    const s = A.s;
    const n = o.F.a + o.F.b;
    const p = shoulder(o, A).add(new THREE.Vector3(s * n * x, n * y, n * z));
    return A.thing
      ? { p, y: new THREE.Vector3(s * 0.25, 1, 0.05), z: new THREE.Vector3(-s * 0.55, -0.75, -0.3), pole: new THREE.Vector3(s, -0.6, -0.3) }
      : { p, y: new THREE.Vector3(s * 0.3, 1, -0.1), z: new THREE.Vector3(s * 0.15, 0.1, -1), pole: new THREE.Vector3(s, -0.5, -0.4) };
  }
  // takten när de gungar (en gungning åt varje håll på SLAG sekunder)
  const SLAG = 1.7;
  const TAKT = (2 * Math.PI) / SLAG;
  // armen med ölen (DT den lediga handen) uppe och gungar i takten (x: påhittet,
  // samma takt för alla från början)
  const sangArm = (o) => (skalArm(o).thing ? skalArm(o) : fri(o));
  function gungHand(o, A, t, x) {
    const w = Math.sin((t - x.t0) * TAKT);
    const h = upp(o, A, 0.3, 0.5, 0.38);
    h.p.x += 6 * w;
    h.p.y += 2 * Math.abs(w);
    h.y.x += 0.2 * w;
    return h;
  }
  function gungKropp(t, x) {
    const w = Math.sin((t - x.t0) * TAKT);
    return { side: 0.09 * w, roll: 0.06 * w, pitch: -0.08 + 0.05 * Math.sin((t - x.t0) * TAKT * 2), lean: -0.05 };
  }
  // Ölen (DT cigaretten) fram mot bordets mitt, med en stöt framåt (stot 0–1) när det klirrar.
  function motMitten(o, A, stot = 0) {
    const mitt = iFig(o, new THREE.Vector3(BORD.x, SILL + BORD.y + 62, BORD.z));
    const S0 = shoulder(o, A);
    const n = o.F.a + o.F.b;
    const dir = mitt.clone().sub(S0);
    const len = dir.length();
    dir.normalize();
    const p = S0.clone().addScaledVector(dir, Math.min(len - 12, n * 0.95) + 3 * stot);
    return A.thing
      ? { p, y: new THREE.Vector3(0, 1, 0).addScaledVector(dir, 0.35), z: new THREE.Vector3(A.s * 0.8, 0, 0).addScaledVector(dir, -0.4), pole: new THREE.Vector3(A.s, -0.6, -0.4) }
      : { p, y: dir.clone().add(new THREE.Vector3(0, 0.8, 0)), z: new THREE.Vector3(A.s * 0.85, 0.4, 0), pole: new THREE.Vector3(A.s, -0.6, -0.4) };
  }

  const AKTER = {
    // sträcker på sig: armarna upp och ut, huvudet bakåt (en gäspning)
    strack: {
      len: 5, in: 1.1, ut: 1.2,
      hand: (o, A, t, l) => {
        const h = upp(o, A, 0.48, 0.64, -0.1);
        h.p.y += 0.6 * Math.sin(l * 9) * bump(l, 1.2, 1.6, 3.0, 3.6);
        return h;
      },
      kropp: (o, t, l) => ({ lean: -0.14, pitch: -0.32 * bump(l, 0.8, 1.6, 3.2, 4.2), breath: 0.05 * bump(l, 0.8, 1.6, 3.2, 4.2) }),
    },
    // lutar sig bakåt med den lediga handen i nacken
    nacke: {
      len: 8, in: 1.2, ut: 1.2,
      hand: (o, A) => {
        if (A !== fri(o)) return null;
        const s = A.s;
        const P = o.F.head;
        const d = huvudAxlar(o);
        return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.82, -P.ry * 0.2, -P.rz * 0.5)), d(-s * 0.4, 0.45, -0.8), d(s * 0.85, 0.1, -0.5), new THREE.Vector3(s, 0.6, 0.1));
      },
      kropp: (o, t) => ({ lean: -0.13, pitch: -0.1, knee: [0.12 * Math.sin(t * 2.2), 0.12 * Math.sin(t * 2.2 + 1.7)] }),
    },
    // kliar sig i bakhuvudet, med huvudet på sned
    klia: {
      len: 4.5, in: 0.9, ut: 1,
      hand: (o, A, t) => {
        if (A !== fri(o)) return null;
        const s = A.s;
        const P = o.F.head;
        const d = huvudAxlar(o);
        return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.86, -P.ry * 0.12 + 2.2 * Math.sin(t * 13), -P.rz * 0.42)), d(-s * 0.35, 0.55, -0.75), d(s * 0.9, 0.15, -0.3), new THREE.Vector3(s, 0.3, -0.3));
      },
      kropp: (o) => { const s = fri(o).s; return { roll: -s * 0.12, pitch: 0.12, yaw: -s * 0.1 }; },
    },
    // fingrarna trummar på bordet
    trumma: {
      len: 6, in: 0.8, ut: 0.9,
      hand: (o, A, t) => {
        if (A !== fri(o)) return null;
        const k = Math.max(0, Math.sin(t * 15 + o.phase)) ** 2;
        const h = paBordet(o, A, 16, 14, 0.6 + 1.8 * k);
        h.y.y -= 0.35 * k;
        return h;
      },
      kropp: (o, t) => ({ lean: 0.06, pitch: 0.05, knee: [0.18 * Math.sin(t * 3.1 + o.phase), 0.18 * Math.sin(t * 3.1 + o.phase + 2)] }),
    },
    // biter på naglarna
    naglar: {
      len: 5, in: 0.8, ut: 0.9,
      hand: (o, A, t) => {
        if (A !== fri(o)) return null;
        const s = A.s;
        const y = new THREE.Vector3(s * 0.2, 0.85, -0.45).normalize();
        const m = mouthIn(o).add(new THREE.Vector3(0.7 * Math.sin(t * 23), 0.5 * Math.sin(t * 17) - 1, 2));
        return { p: m.addScaledVector(y, -o.F.arm * 3), y, z: new THREE.Vector3(0, 0.3, 1), pole: new THREE.Vector3(s, -0.8, 0.1) };
      },
      kropp: (o, t) => ({ lean: 0.12, pitch: 0.02, knee: [0.26 * Math.sin(t * 3.6 + o.phase), 0.26 * Math.sin(t * 3.6 + o.phase + 2.2)] }),
    },
    // händerna knäppta framför munnen (om flaskan eller cigaretten),
    // och gungar fram och tillbaka
    knappt: {
      len: 6.5, in: 1, ut: 1,
      hand: (o, A, t) => {
        const s = A.s;
        const C = mouthIn(o).add(new THREE.Vector3(0, -9 + 1.2 * Math.sin(t * 2.4), 14));
        if (A.thing) return { p: C.addScaledVector(new THREE.Vector3(0, 1, 0), -A.thing.userData.top - 3), y: new THREE.Vector3(0, 1, 0.1), z: new THREE.Vector3(s, 0, 0.35), pole: new THREE.Vector3(s, -0.8, -0.2) };
        return handflata(o, C.add(new THREE.Vector3(s * 4.5, -4, 0)), new THREE.Vector3(-s * 0.25, 1, 0.1), new THREE.Vector3(s, 0, 0.3), new THREE.Vector3(s, -0.8, -0.2));
      },
      kropp: (o, t) => ({ lean: 0.1 + 0.05 * Math.sin(t * 2.4), pitch: -0.04, knee: [0.2 * Math.sin(t * 3.3 + o.phase), 0.2 * Math.sin(t * 3.3 + o.phase + 2)] }),
    },
    // hakan i handen, armbågen ner mot bordet
    hakan: {
      len: 7.5, in: 1.3, ut: 1.2,
      hand: (o, A) => {
        if (A !== fri(o)) return null;
        const s = A.s;
        const P = o.F.head;
        const d = huvudAxlar(o);
        return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.62, -P.ry * 0.6, P.rz * 0.42)), d(-s * 0.15, 1, 0.15), d(s, 0, -0.1), new THREE.Vector3(s * 0.3, -1, 0.5));
      },
      kropp: (o) => { const s = fri(o).s; return { lean: 0.18, pitch: 0.06, roll: -s * 0.12, yaw: s * 0.08, breath: -0.02 }; },
    },
    // skakar på huvudet med blicken ner och suckar
    skakar: {
      len: 5, in: 0.9, ut: 1,
      kropp: (o, t, l) => ({ yaw: 0.3 * Math.sin((l - 0.9) * 4.4) * bump(l, 0.9, 1.3, 3.3, 3.9), pitch: 0.24, lean: 0.08, breath: -0.05 * bump(l, 3.4, 3.8, 4.2, 4.8) }),
    },
    // armarna i kors, bakåtlutad och med blicken bort från bordet
    kors: {
      len: 8, in: 1.2, ut: 1.2,
      hand: (o, A) => {
        const s = A.s;
        const W = o.F.w;
        const ovan = A === fri(o);
        const p = iBal(o, new THREE.Vector3(-s * W * (ovan ? 0.5 : 0.56), o.T * (ovan ? 0.64 : 0.55), o.F.depth * 0.85 + (ovan ? 11 : 5)));
        if (A.thing) return { p, y: new THREE.Vector3(-s * 0.3, 1, 0.2), z: new THREE.Vector3(-s * 0.2, 0, 1), pole: new THREE.Vector3(s, -0.5, 0.2) };
        return { p, y: new THREE.Vector3(-s, 0.12, 0.05), z: new THREE.Vector3(0, 0.15, 1), pole: new THREE.Vector3(s, -0.5, 0.2) };
      },
      kropp: (o) => ({ lean: -0.06, yaw: -o.F.inn * 0.42, pitch: -0.06 }),
    },
    // tittar ner i flaskan, som är tom
    stirrar: {
      len: 5.5, in: 1.1, ut: 1,
      hand: (o, A, t) => {
        if (!A.thing) return null;
        const s = A.s;
        const P = o.F.head;
        const oga = inHead(o, new THREE.Vector3(0, P.ry * 0.05, P.rz * 0.95)).add(new THREE.Vector3(0, 0, 10));
        const u = new THREE.Vector3(-s * 0.15, 0.25 + 0.06 * Math.sin(t * 2), -1).normalize();
        return { p: oga.addScaledVector(u, -A.thing.userData.top), y: u, z: new THREE.Vector3(s * 0.9, 0.2, 0.2), pole: new THREE.Vector3(s, -0.6, -0.2) };
      },
      kropp: () => ({ pitch: -0.08, lean: 0.04 }),
    },
    // pannan i bordet, två–tre gånger (DJ), med händerna på bordet
    dunk: {
      len: 6.5, in: 1.2, ut: 1.3,
      hand: (o, A) => (A.thing ? null : paBordet(o, A, 22, 20)),
      kropp: (o, t, l) => {
        const k = bump(l, 1.6, 1.8, 4.4, 4.7);
        return { lean: 0.5 - 0.1 * k * Math.abs(Math.cos((l - 1.7) * 3.4)), pitch: 0.55, breath: -0.03 };
      },
    },
    // gungar i takt med ölen i luften (DT med handen)
    gung: {
      len: 7, in: 1, ut: 1,
      hand: (o, A, t, l, x) => (A === sangArm(o) ? gungHand(o, A, t, x) : null),
      kropp: (o, t, l, x) => gungKropp(t, x),
    },
    // skålar över bordet och tar en klunk (DT ett bloss)
    skal: {
      len: 7.5, in: 0.9, ut: 1.1,
      hand: (o, A, t, l) => {
        if (A !== skalArm(o)) return null;
        const ut = motMitten(o, A, bump(l, 1.5, 1.7, 1.9, 2.3));
        const dw = bump(l, 3.0, 3.8, 5.0, 5.8);
        return dw > 0 ? lerpPose(ut, A.thing ? supAt(o, A, t, dw) : blossAt(o, A), dw) : ut;
      },
      kropp: (o, t, l) => {
        const dw = bump(l, 3.0, 3.8, 5.0, 5.8);
        return { lean: 0.14 * bump(l, 0, 0.8, 2.4, 3.2) - (skalArm(o).thing ? 0.12 * dw : 0), pitch: skalArm(o).thing ? -0.38 * dw : 0.06 * dw };
      },
    },
  };
  // ---------- gänget tillsammans: skämtet, grälet och tv:n ----------
  // Rollerna i ett gemensamt påhitt (x: { n, t0 }, samma för alla tre): a
  // börjar (berättar skämtet, grälar, pekar på tv:n), b svarar och c tittar
  // på – och v (0–3) hur var och en skrattar: handen som dunkar i bordet,
  // dubbelvikt med handen på magen, handen för pannan eller pekar på den som
  // skämtade. (FIGS-ordningen, så att det inte beror på var de sitter.)
  function roller(x) {
    const f = x.n != null ? x.n * 1.37 + 0.5 : x.t0 * 0.731;
    const a = Math.floor(hash(f + 0.11) * 3);
    const b = (a + 1 + Math.floor(hash(f + 0.53) * 2)) % 3;
    return { a, b, c: 3 - a - b, v: [0, 1, 2].map((i) => Math.floor(hash(f + i * 3.3 + 0.7) * 4)) };
  }
  const huvudPa = (i) => headIn(figs[i]);
  // riktningar i bålens axlar i figurens
  const balAxlar = (o) => { o.torso.updateMatrix(); return (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(o.torso.matrix); };
  // Skrattet i kroppen, k (0–1) hur mycket och l sekunder in: huvudet bakåt,
  // ansiktet ut från bordet (så att skrattet syns) och bålen som skakar – eller
  // (v 1) dubbelvikt framåt med ansiktet upp.
  function skratta(o, l, v, k) {
    const i = FI(o);
    const sk = Math.abs(Math.sin(l * 12 + i * 1.3)) * (0.7 + 0.3 * Math.sin(l * 2.3 + i));
    const ut = -o.F.inn * (o.F.plats === PLATSER[1] ? 0.15 : 0.45);
    if (v === 1) return { lean: 0.3 * k, pitch: (-0.12 + 0.06 * sk) * k, yaw: ut * k, lift: 3 * sk * k, roll: 0.05 * Math.sin(l * 12 + i) * k, breath: 0.05 * sk * k };
    return { lean: (-0.14 + 0.04 * sk) * k, pitch: (-0.36 + 0.1 * sk) * k, yaw: ut * k, lift: 4 * sk * k, roll: 0.06 * Math.sin(l * 6 + i) * k, breath: 0.06 * sk * k, mitt: true };
  }
  // Den lediga handen i skrattet (mot: huvudet man pekar på).
  function skrattHand(o, A, l, v, mot) {
    if (A !== fri(o)) return null;
    const s = A.s;
    if (v === 0) return paBordet(o, A, 18, 12, 10 * Math.max(0, Math.sin(l * 9)) ** 1.5 * (1 - sm(2.6, 3.6, l)));
    if (v === 1) {
      const d = balAxlar(o);
      return handflata(o, iBal(o, new THREE.Vector3(-s * o.F.w * 0.12, o.T * 0.3, o.F.depth * 0.95)), d(-s, 0.3, 0.15), d(0.1, 0, 1), new THREE.Vector3(s, -0.5, 0.3));
    }
    if (v === 2) {
      const P = o.F.head;
      const d = huvudAxlar(o);
      return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.12, P.ry * 0.36, P.rz * 0.92)), d(-s * 0.35, 0.9, 0.25), d(0.05, 0.25, 1), new THREE.Vector3(s, -0.6, 0.3));
    }
    return mot ? pekaPa(o, A, mot, 0.8, 2 * Math.sin(l * 13)) : null;
  }
  // Armen rakt mot punkten P i rummet (lyft: lite upp och ner).
  function pekaPa(o, A, P, rack, lyft = 0) {
    const S0 = shoulder(o, A);
    const dir = iFig(o, P).sub(S0).normalize();
    const n = o.F.a + o.F.b;
    return { p: S0.addScaledVector(dir, n * rack).add(new THREE.Vector3(0, lyft, 0)), y: dir, z: new THREE.Vector3(0, 1, 0), pole: new THREE.Vector3(A.s, -0.6, -0.3) };
  }
  // Handen framför en mot bordet: x åt sin sida, y upp, fram mot bordet (i
  // armens längder), med handflatan upp (upp = true) eller vänd inåt.
  function framfor(o, A, x, y, fram, upp = true) {
    const s = A.s;
    const n = o.F.a + o.F.b;
    const mot = motBord(o).mot;
    const p = shoulder(o, A).addScaledVector(mot, n * fram).add(new THREE.Vector3(s * n * x, n * y, 0));
    return upp
      ? { p, y: mot.clone().add(new THREE.Vector3(s * (0.25 + x), 0.3, 0)), z: new THREE.Vector3(s * 0.25, -1, 0), pole: new THREE.Vector3(s, -0.6, -0.4) }
      : { p, y: mot.clone().add(new THREE.Vector3(0, 0.25, 0)), z: new THREE.Vector3(s, 0.15, 0), pole: new THREE.Vector3(s, -0.6, -0.4) };
  }

  // Skämtet: a lutar sig in och berättar med handen och blicken på de andra,
  // en i taget, medan de lutar sig in och lyssnar (den som skrattar med handen
  // för pannan med hakan i handen). Vid poängen slår a ut med handen, det är
  // tyst ett ögonblick – och sedan skrattar alla, var och en på sitt sätt (v),
  // med ögonen hopknipna och munnen öppen (skrattW).
  const SKAMT = { poang: 4.3, skratt: 4.8, slut: 10.4 };
  AKTER.skamt = {
    len: 12, in: 0.8, ut: 1.5,
    hand: (o, A, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      if (l >= SKAMT.skratt) return skrattHand(o, A, l - SKAMT.skratt, R.v[i], huvudPa(i === R.a ? R.b : R.a));
      if (i !== R.a) return R.v[i] === 2 ? AKTER.hakan.hand(o, A) : null;
      if (A !== fri(o)) return null;
      const a = l * 4.2;
      const prat = framfor(o, A, 0.16, -0.22, 0.42);
      prat.p.add(new THREE.Vector3(5 * Math.sin(a), 6 * Math.sin(a * 1.7), 4 * Math.cos(a * 1.3)));
      return lerpPose(prat, framfor(o, A, 0.5, 0.04, 0.3), bump(l, 3.6, 4.0, 4.6, 4.9));
    },
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      if (l >= SKAMT.skratt) {
        // (en blick på den som skämtade först, sedan bakåt i skrattet)
        const k = bump(l, SKAMT.skratt, SKAMT.skratt + 0.25, SKAMT.slut - 1.2, SKAMT.slut);
        return { ...skratta(o, l - SKAMT.skratt, R.v[i], k), se: huvudPa(i === R.a ? R.b : R.a), seW: 1 - sm(SKAMT.skratt + 0.1, SKAMT.skratt + 0.7, l) };
      }
      if (i === R.a) return { lean: 0.13 * (1 - sm(3.7, 4.3, l)) - 0.05 * sm(3.7, 4.3, l), pitch: 0.05 * Math.sin(l * 7) * (1 - sm(3.4, 3.9, l)), se: huvudPa([R.b, R.c][Math.floor(l / 1.5) % 2]), mitt: true };
      const nick = 0.1 * bump(l, 2.0, 2.2, 2.4, 2.7);
      if (R.v[i] === 2) return { ...AKTER.hakan.kropp(o), pitch: 0.06 + nick, se: huvudPa(R.a), seW: 0.75 };
      return { lean: 0.1 + 0.03 * bump(l, 4.0, 4.3, 4.6, 4.8), pitch: nick, se: huvudPa(R.a), seW: 0.75, mitt: true };
    },
    skratt: (o, t, l) => bump(l, SKAMT.skratt - 0.05, SKAMT.skratt + 0.15, SKAMT.slut - 1, SKAMT.slut),
  };

  // Grälet: a och b pratar i munnen på varandra med handen som hackar i
  // luften och blicken på den andra – den som lyssnar skakar på huvudet – och
  // c tittar från den ena till den andra som på tennis. Till sist viftar a
  // bort det, b sätter sig med armarna i kors och tittar bort, och c skrattar
  // med handen för pannan eller skakar på huvudet (v).
  const GRAL = { start: 0.7, tur: 1.45, slut: 8.1 };
  const talare = (R, l) => (l < GRAL.start || l >= GRAL.slut ? -1 : Math.floor((l - GRAL.start) / GRAL.tur) % 2 ? R.b : R.a);
  const garSkrattar = (R) => R.v[R.c] % 2 === 0;
  AKTER.gral = {
    len: 10.6, in: 0.8, ut: 1.3,
    hand: (o, A, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      if (i === R.c) return l > GRAL.slut && garSkrattar(R) ? skrattHand(o, A, l - GRAL.slut, 2) : null;
      if (l >= GRAL.slut) {
        if (i === R.b) return AKTER.kors.hand(o, A);
        if (A !== fri(o)) return null;
        // viftar bort det: handen från bröstet ut åt sidan, med handryggen först
        return lerpPose(framfor(o, A, -0.02, -0.12, 0.34, false), framfor(o, A, 0.5, -0.04, 0.24, false), sm(0.1, 0.45, l - GRAL.slut));
      }
      if (talare(R, l) !== i || A !== fri(o)) return null;
      const h = pekaPa(o, A, huvudPa(i === R.a ? R.b : R.a), 0.5, -14 + 8 * Math.abs(Math.sin(l * 8.5)));
      h.z = new THREE.Vector3(A.s, 0.15, 0);
      return h;
    },
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      const tal = talare(R, l);
      if (i === R.c) {
        const t2 = talare(R, l - 0.25);
        if (l < GRAL.slut) return { se: huvudPa(t2 >= 0 ? t2 : R.a), lean: 0.03 };
        const k = bump(l, GRAL.slut, GRAL.slut + 0.3, 9.5, 10.2);
        if (garSkrattar(R)) return { ...skratta(o, l - GRAL.slut, 2, k * 0.8), se: huvudPa(R.a), seW: 1 - sm(GRAL.slut + 0.1, GRAL.slut + 0.6, l) };
        return { yaw: 0.26 * Math.sin((l - GRAL.slut) * 6.5) * k, pitch: 0.14 * k, lean: 0.05 * k };
      }
      const andra = huvudPa(i === R.a ? R.b : R.a);
      if (l >= GRAL.slut) return i === R.b ? AKTER.kors.kropp(o) : { se: andra, lean: -0.05, pitch: -0.04 };
      if (tal === i) return { lean: 0.15, mitt: true, se: andra, pitch: 0.06 * Math.sin(l * 8.5) };
      return { lean: 0.03, se: andra, yaw: tal >= 0 ? 0.16 * Math.sin(l * 6) : 0 };
    },
    skratt: (o, t, l, x) => {
      const R = roller(x);
      return FI(o) === R.c && garSkrattar(R) ? bump(l, GRAL.slut + 0.1, GRAL.slut + 0.3, 9.3, 9.8) : 0;
    },
  };

  // Tv:n: a pekar upp på tv:n, de andra vänder sig dit en efter en och tittar
  // en stund; sedan nickar b och c rycker på axlarna med handflatan upp.
  AKTER.titta = {
    len: 8, in: 0.7, ut: 1.4,
    hand: (o, A, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      if (A !== fri(o)) return null;
      if (i === R.a) return lerpPose(handRest(o, A, t), pekaPa(o, A, TV, 0.86), bump(l, 0.2, 0.7, 4.4, 5.1));
      if (i === R.c) return lerpPose(handRest(o, A, t), framfor(o, A, 0.4, -0.18, 0.3), bump(l, 5.2, 5.6, 6.4, 7));
      return null;
    },
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      if (i === R.a) return { se: l < 5.2 ? TV : huvudPa(R.b), lean: -0.03 };
      const sen = 0.6 + (i === R.c ? 0.5 : 0);
      if (l < sen) return { se: huvudPa(R.a) };
      if (l < 5.4) return { se: TV, lean: -0.02 };
      if (i === R.b) return { se: huvudPa(R.a), pitch: 0.12 * (bump(l, 5.4, 5.6, 5.8, 6.1) + bump(l, 6.1, 6.3, 6.5, 6.8)) };
      return { se: huvudPa(R.a), lift: 2.5 * bump(l, 5.3, 5.6, 6.3, 6.8), roll: 0.08 * bump(l, 5.3, 5.6, 6.3, 6.8) };
    },
  };

  // ---------- allsången ----------
  // När det går bra (GRUPP, glad) sjunger gänget tillsammans, på ett av fem sätt
  // (sangVal): gungar i takt med ölen i luften och håller ut den sista tonen
  // (allsang); en börjar och de andra faller in, och det slutar med en skål
  // (allsangFor); trummar i bordet allt fortare tills alla vrålar med armarna i
  // luften (allsangTrumma); vågen runt bordet och sedan armarna i luften som vajar
  // (allsangArmar); och – bara när matcherna pågår – vända mot tv:n och pekar på
  // den i takt (allsangTv). De sjunger med munnen öppen och ögonen hopknipna
  // (skratt): en fras per gungning, med ett andetag emellan.
  const SANGER = ['allsang', 'allsangFor', 'allsangTrumma', 'allsangArmar'];
  // (försångaren behöver alla tre: de andra tittar på hen innan de faller in)
  const allaUppe = (t) => figs.every((o) => ready(o, t) > 0.99 && sovW(o, t) < 0.01 && slumW(o, t) < 0.01);
  function sangVal(n, t0) {
    const val = tvW(t0) > 0.5 ? [...SANGER, 'allsangTv', 'allsangTv'] : SANGER;
    const v = val[Math.floor(hash(n * 6.37 + 1.1) * val.length)];
    return v !== 'allsangFor' || allaUppe(t0) ? v : 'allsang';
  }
  // Sången som inte väntar på luckan (SJUNG): efter ett mål som gick någons väg
  // börjar de sjunga när jublet ebbar ut (malSang), och den som målet sänkte sitter
  // med armarna i kors så länge; och så länge radion är på sjunger de den ena sången
  // efter den andra (radioSang), en ny var RADIO_SLOT:e sekund i en ordning som
  // blandas om varje varv. Målets sång går före radions. Det som pågår när sången
  // börjar tonar bort (av i aktNu), och inget annat börjar så länge (tvingStart).
  // Radions sånger är oftast danser (radioNamn, rum-dans.js).
  const SJUNG = { mal: null, radio: { pa: false, at: -1e9, fran: -1e9, till: -1e9 } };
  const MAL_SANG = 3.2;
  const RADIO_IN = 1.5;
  const RADIO_SLOT = 14;
  // (försångaren tar för lång tid på sig efter ett mål)
  const MALSANGER = ['allsang', 'allsangTrumma', 'allsangArmar'];
  function malSang(vem, t) {
    const k = Object.keys(vem || {});
    if (!k.some((x) => Math.sign(vem[x]) > 0)) return;
    const val = tvW(t) > 0.5 ? [...MALSANGER, 'allsangTv', 'allsangTv'] : MALSANGER;
    const ute = new Set(k.filter((x) => Math.sign(vem[x]) < 0).map((x) => x.toLowerCase()));
    SJUNG.mal = { namn: val[Math.floor(hash(t * 2.17 + 0.4) * val.length)], at: t, t0: t + MAL_SANG, ute };
  }
  const malSlut = (m) => m.t0 + AKTER[m.namn].len;
  // Radions k:te: två danser och en sång (rum-dans.js), om och om igen, var för sig i en
  // ordning som blandas om varje varv. Sparas (RADIO_K, töms när radion sätts på): det frågas
  // många gånger i varje bild, och det som har börjat ska inte bytas när någon lämnar in.
  const RADIO_K = new Map();
  const blandad = (val, fro) => val.map((x, i) => [hash(fro + i * 0.77), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  function radioNamn(k, t0) {
    if (RADIO_K.has(k)) return RADIO_K.get(k);
    const fro = (SJUNG.radio.fran * 7.3) % 97;
    const tre = Math.floor(k / 3);
    let v;
    if (k % 3 < 2) {
      const val = Object.keys(DANSER);
      const j = tre * 2 + k % 3;
      v = blandad(val, fro + 1.7 + Math.floor(j / val.length) * 3.1)[j % val.length];
      if (DANSER[v].alla && !allaUppe(t0)) v = 'italoPek';
    } else {
      const val = tvW(t0) > 0.5 ? [...SANGER, 'allsangTv'] : SANGER;
      v = blandad(val, fro + Math.floor(tre / val.length) * 3.1)[tre % val.length];
      if (v === 'allsangFor' && !allaUppe(t0)) v = 'allsang';
    }
    RADIO_K.set(k, v);
    return v;
  }
  function radioSang(t) {
    const R = SJUNG.radio;
    if (t < R.fran + RADIO_IN) return null;
    const k = Math.floor((t - R.fran - RADIO_IN) / RADIO_SLOT);
    const t0 = R.fran + RADIO_IN + k * RADIO_SLOT;
    if (t0 >= R.till) return null;
    const namn = radioNamn(k, t0);
    const l = t - t0;
    if (l >= AKTER[namn].len) return null;
    return R.till < t0 + AKTER[namn].len ? { namn, l, t0, av: R.till } : { namn, l, t0 };
  }
  // Sången som vem sjunger vid t, eller (efter ett mål som sänkte hen) armarna i kors.
  function tvingad(o, t) {
    const m = SJUNG.mal;
    if (m && t >= m.t0) {
      const l = t - m.t0;
      if (m.ute.has(o.F.key)) {
        if (l < AKTER.kors.len) return { namn: 'kors', l, t0: m.t0 };
      } else if (l < AKTER[m.namn].len) return { namn: m.namn, l, t0: m.t0 };
    }
    const r = radioSang(t);
    if (!r || !m || r.t0 + AKTER[r.namn].len <= m.at || r.t0 >= malSlut(m)) return r;
    // (radions sång tonar bort vid målet, och den som skulle börja under målets sång blir inte av)
    return r.t0 < m.at ? { ...r, av: Math.min(r.av ?? Infinity, m.at) } : null;
  }
  // När sången (efter ett mål eller från radion) börjar mellan a och b, första gången, eller null.
  function tvingStart(a, b) {
    let s = Infinity;
    const m = SJUNG.mal;
    if (m && m.at < b && malSlut(m) > a) s = Math.max(a, m.at);
    const R = SJUNG.radio;
    if (R.fran < b && R.till > a) s = Math.min(s, Math.max(a, R.fran));
    return s === Infinity ? null : s;
  }

  // munnen (1 öppen) mellan a och b, med ett andetag i slutet av varje gungning
  const sjunger = (l, a, b) => (l >= a && l < b && l % SLAG > 0.08 && l % SLAG < SLAG - 0.3 ? 1 : 0);
  // båda armarna rakt upp (huvudena är stora: snett utåt), och skakar (skak 0–1)
  function armarUpp(o, A, l, skak = 0) {
    const h = upp(o, A, 0.42, 0.62, 0.1);
    h.p.y += 2.2 * Math.sin(l * 15) * skak;
    return h;
  }

  // Gungar: alla gungar i takt med ölen i luften och tittar på varandra, och
  // den sista tonen hålls ut med ölen högre upp och huvudet bakåt.
  const GUNG = { ton: 6.6, slut: 8.6 };
  const gungTon = (l) => bump(l, GUNG.ton, GUNG.ton + 0.5, GUNG.slut - 0.4, GUNG.slut + 0.3);
  AKTER.allsang = {
    len: 9.5, in: 1, ut: 1.1,
    hand: (o, A, t, l, x) => (A === sangArm(o) ? lerpPose(gungHand(o, A, t, x), upp(o, A, 0.34, 0.68, 0.22), gungTon(l)) : null),
    kropp: (o, t, l, x) => {
      const k = gungTon(l);
      const g = gungKropp(t, x);
      // (blicken på grannarna, en i taget, två gungningar var)
      const i = FI(o);
      const vem = (i + 1 + (Math.floor(l / (2 * SLAG)) % 2)) % 3;
      return { side: g.side * (1 - k), roll: g.roll * (1 - k), pitch: g.pitch * (1 - k) - 0.28 * k, lean: g.lean - 0.05 * k, breath: 0.05 * k, se: huvudPa(vem), seW: 0.55 * (1 - k) };
    },
    skratt: (o, t, l) => Math.max(sjunger(l, 0.7, GUNG.ton), l >= GUNG.ton && l < GUNG.slut ? 1 : 0),
  };

  // Försångaren: a lutar sig in och börjar sjunga, slår takten med ölen och
  // tittar på de andra, en i taget; b och c tittar på hen och faller in, och
  // när alla gungar i takt en stund möts ölen över bordet – skål, och en klunk
  // (DT ett bloss). (roller)
  const FOR = { b: 2.1, c: 3.5, skal: 8.2, klirr: 9.0, klunk: 9.6, slut: 11.6 };
  const forIn = (R, i) => (i === R.a ? 0 : i === R.b ? FOR.b : FOR.c);
  // a slår takten: ölen (DT handen) upp och ner två gånger per gungning
  function dirigent(o, A, t, x) {
    return upp(o, A, 0.24, 0.36 + 0.06 * Math.cos((t - x.t0) * TAKT * 2), 0.5);
  }
  AKTER.allsangFor = {
    len: 12.4, in: 0.7, ut: 0.9,
    hand: (o, A, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      const ska = skalArm(o);
      const vila = handRest(o, A, t);
      let p = null;
      if (A === sangArm(o)) {
        const ino = forIn(R, i);
        const k = sm(ino, ino + 0.7, l) * (A === ska ? 1 : 1 - sm(FOR.skal - 0.2, FOR.skal + 0.5, l));
        if (k > 0) {
          const g = gungHand(o, A, t, x);
          p = lerpPose(vila, i === R.a ? lerpPose(dirigent(o, A, t, x), g, sm(FOR.c, FOR.c + 0.8, l)) : g, k);
        }
      }
      if (A === ska) {
        const k = sm(FOR.skal, FOR.skal + 0.7, l);
        if (k > 0) {
          const ut = motMitten(o, A, bump(l, FOR.klirr, FOR.klirr + 0.15, FOR.klirr + 0.25, FOR.klirr + 0.5));
          const dw = bump(l, FOR.klunk, FOR.klunk + 0.6, FOR.slut - 0.6, FOR.slut);
          p = lerpPose(p || vila, dw > 0 ? lerpPose(ut, A.thing ? supAt(o, A, t, dw) : blossAt(o, A), dw) : ut, k);
        }
      }
      return p;
    },
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      const ino = forIn(R, i);
      const k = sm(ino, ino + 0.7, l) * (1 - sm(FOR.skal - 0.2, FOR.skal + 0.5, l));
      const g = gungKropp(t, x);
      const leder = i === R.a ? 1 - sm(FOR.c, FOR.c + 0.8, l) : 0;
      const fram = bump(l, FOR.skal, FOR.skal + 0.8, FOR.klirr + 0.4, FOR.klunk + 0.4);
      const dw = bump(l, FOR.klunk, FOR.klunk + 0.6, FOR.slut - 0.6, FOR.slut);
      const kropp = {
        side: g.side * k,
        roll: g.roll * k,
        pitch: g.pitch * k * (1 - leder) + 0.06 * Math.cos((t - x.t0) * TAKT * 2) * leder + (skalArm(o).thing ? -0.38 : 0.06) * dw,
        lean: g.lean * k * (1 - leder) + 0.13 * leder + 0.14 * fram,
        mitt: leder > 0.5,
      };
      // blicken: på de andra (a) eller på a (b och c) tills alla är med
      if (i === R.a) return { ...kropp, se: huvudPa(l < FOR.b + 0.4 ? R.b : R.c), seW: bump(l, 0.3, 0.8, FOR.c + 0.6, FOR.c + 1.3) };
      return { ...kropp, se: huvudPa(R.a), seW: bump(l, 0.3, 0.9, ino + 0.6, ino + 1.4) };
    },
    skratt: (o, t, l, x) => {
      const R = roller(x);
      const ino = forIn(R, FI(o));
      // (och ett "skål!" när det klirrar)
      return Math.max(sjunger(l, ino + 0.3, FOR.skal), bump(l, FOR.klirr - 0.35, FOR.klirr - 0.3, FOR.klirr + 0.3, FOR.klirr + 0.35));
    },
  };

  // Trumman: den lediga handen slår i bordet i takt, allt fortare, med huvudet
  // som nickar med slagen och benen som sparkar – och sedan åker båda armarna upp
  // och alla vrålar och studsar på stolen.
  const TRUMMA = { start: 1.2, a: 2.8, b: 6.6, f0: 1 / 0.85, f1: 4.4, slut: 7.2, upp: 7.6, ner: 9.4 };
  // slagen: ett i varje heltal (slaget i bordet), med takten som ökar från f0 till f1 mellan a och b
  function trumFas(l) {
    const T = TRUMMA;
    if (l < T.a) return (l - T.start) * T.f0;
    const u = Math.min(l, T.b) - T.a;
    return (T.a - T.start) * T.f0 + T.f0 * u + (T.f1 - T.f0) * u * u / (2 * (T.b - T.a)) + Math.max(0, l - T.b) * T.f1;
  }
  const trumUpp = (l) => sm(TRUMMA.slut, TRUMMA.upp, l);
  AKTER.allsangTrumma = {
    len: 11, in: 0.8, ut: 1.6,
    hand: (o, A, t, l) => {
      const T = TRUMMA;
      const vila = handRest(o, A, t);
      const fi = trumFas(l);
      const slagW = Math.abs(Math.sin(Math.PI * fi));
      const kt = sm(T.start - 0.9, T.start - 0.4, l);
      let p = vila;
      if (A === fri(o)) p = lerpPose(vila, paBordet(o, A, 18, 12, (22 - 12 * sm(T.a, T.b, l)) * slagW ** 0.8), kt);
      else if (A.thing) {
        // ölen i den andra handen, uppe och studsar med slagen
        const h = upp(o, A, 0.3, 0.42, 0.4);
        h.p.y += 3 * slagW;
        p = lerpPose(vila, h, kt);
      }
      return lerpPose(p, armarUpp(o, A, l, bump(l, T.upp, T.upp + 0.2, T.ner - 0.5, T.ner)), trumUpp(l));
    },
    kropp: (o, t, l) => {
      const T = TRUMMA;
      const kd = bump(l, T.start - 0.9, T.start - 0.4, T.slut, T.upp);
      const kv = trumUpp(l);
      const fi = trumFas(l);
      const slag = (1 - Math.abs(Math.sin(Math.PI * fi))) ** 4;
      const studs = Math.abs(Math.sin(l * 7)) * bump(l, T.upp, T.upp + 0.3, T.ner, T.ner + 0.6);
      return {
        lean: 0.08 * kd - 0.12 * kv,
        pitch: (0.06 + 0.12 * slag) * kd - 0.3 * kv,
        lift: 4 * studs,
        breath: 0.05 * kv,
        knee: [0, 1].map((j) => (0.22 * Math.sin(Math.PI * fi + j * 1.6) * kd) + 0.3 * studs),
      };
    },
    // ett "hej!" vid varje slag, i ett enda vrål när det går fort och armarna är uppe
    skratt: (o, t, l) => {
      const T = TRUMMA;
      if (l >= T.b - 1 && l < T.ner) return 1;
      if (l < T.start - 0.1 || l >= T.ner) return 0;
      return ((trumFas(l) % 1) + 1) % 1 < 0.4 ? 1 : 0;
    },
  };

  // Armarna: vågen går två varv runt bordet – var och en upp med båda armarna,
  // från vänster till höger – och sedan är alla armarna uppe och vajar i takt
  // medan de sjunger, tills den sista tonen hålls ut med armarna som skakar.
  const ARMAR = { vag: [0.5, 2.1], steg: 0.45, upp: 3.9, ton: 8.6, slut: 9.9 };
  function vagW(o, l) {
    const k = PLATSER.indexOf(o.F.plats);
    let w = 0;
    for (const v of ARMAR.vag) {
      const s = v + ARMAR.steg * k;
      w = Math.max(w, bump(l, s, s + 0.25, s + 0.55, s + 0.9));
    }
    return w;
  }
  AKTER.allsangArmar = {
    len: 11.4, in: 0.6, ut: 1.4,
    hand: (o, A, t, l, x) => {
      const w = Math.sin((t - x.t0) * TAKT) * (1 - sm(ARMAR.ton - 0.3, ARMAR.ton + 0.2, l));
      const h = armarUpp(o, A, l, bump(l, ARMAR.ton, ARMAR.ton + 0.2, ARMAR.slut - 0.3, ARMAR.slut));
      // (åt samma håll med båda händerna)
      h.p.x += 9 * w;
      h.y.x += 0.25 * w;
      return lerpPose(handRest(o, A, t), h, Math.max(vagW(o, l), sm(ARMAR.upp, ARMAR.upp + 0.8, l)));
    },
    kropp: (o, t, l, x) => {
      const v = vagW(o, l);
      const k = sm(ARMAR.upp, ARMAR.upp + 0.8, l);
      const ton = bump(l, ARMAR.ton, ARMAR.ton + 0.4, ARMAR.slut - 0.3, ARMAR.slut + 0.4);
      const w = Math.sin((t - x.t0) * TAKT) * k * (1 - ton);
      return { lift: 5 * v, side: 0.1 * w, roll: 0.07 * w, pitch: -0.14 * v - 0.08 * k - 0.2 * ton, lean: -0.05 * Math.max(v, k), breath: 0.05 * ton };
    },
    skratt: (o, t, l) => Math.max(vagW(o, l) > 0.5 ? 1 : 0, sjunger(l, ARMAR.upp + 0.4, ARMAR.ton), l >= ARMAR.ton && l < ARMAR.slut ? 1 : 0),
  };

  // Mot tv:n (bara när matcherna pågår): alla vänder sig mot tv:n och sjunger
  // åt planen, framåtlutade med ölen uppe, och den lediga handen pekar på rutan i
  // varje slag – och till sist båda armarna upp mot tv:n.
  const TVS = { in: 0.6, slut: 8.0, upp: 8.4, ner: 9.4 };
  AKTER.allsangTv = {
    len: 10.6, in: 0.8, ut: 1.2,
    hand: (o, A, t, l, x) => {
      const slag = Math.max(0, Math.cos((t - x.t0) * TAKT * 2)) ** 3;
      const vila = handRest(o, A, t);
      const k = sm(TVS.in, TVS.in + 0.6, l);
      let p = vila;
      if (A === fri(o)) p = lerpPose(vila, pekaPa(o, A, TV, 0.62 + 0.26 * slag, 3 * slag), k);
      else if (A.thing) {
        const h = upp(o, A, 0.3, 0.52, 0.34);
        h.p.y += 3 * slag;
        p = lerpPose(vila, h, k);
      }
      return lerpPose(p, armarUpp(o, A, l, bump(l, TVS.upp, TVS.upp + 0.2, TVS.ner - 0.3, TVS.ner)), sm(TVS.slut, TVS.upp, l));
    },
    kropp: (o, t, l, x) => {
      const slag = Math.max(0, Math.cos((t - x.t0) * TAKT * 2)) ** 3;
      const k = bump(l, TVS.in, TVS.in + 0.6, TVS.slut, TVS.upp);
      const upp = sm(TVS.slut, TVS.upp, l);
      return { lean: 0.1 * k - 0.08 * upp, pitch: 0.06 * slag * k - 0.2 * upp, lift: 3 * Math.abs(Math.sin(l * 7)) * bump(l, TVS.upp, TVS.upp + 0.3, TVS.ner, TVS.ner + 0.5), se: TV };
    },
    skratt: (o, t, l) => Math.max(sjunger(l, TVS.in + 0.2, TVS.slut), l >= TVS.slut && l < TVS.ner ? 1 : 0),
  };

  // ---------- korstecknet ----------
  // Inför matcherna (AV, korsChans) korsar sig var och en ibland, på något av
  // sätten i KORS (rum-tecken.js) med högerhanden och handen med fingrar (pose).
  // Det som är i högerhanden blir kvar på bordet så länge. KORS_FRO är nytt för
  // varje gång sidan öppnas: t börjar om från noll, så annars skulle det komma vid
  // samma tid varje gång, eller aldrig för den som tittar in en kort stund.
  const KORS_FRO = Math.random() * 97;
  const KORS_STOR = 1.05;
  const korsUpp = (d, l) => { const [a, b] = d.upp || [0.45, 1]; return bump(l, a, b, d.len - b, d.len - a); };
  // Vilket av sätten (med flaskan bara när flaskan är i högerhanden).
  function korsaVal(o, n, i) {
    const m = KORS_MENY[o.F.key];
    const namn = m[Math.floor(hash(n * 1.77 + i * 3.1 + KORS_FRO) * m.length)];
    return namn === 'korsaSak' && skalArm(o) !== o.arms[0] ? 'korsaKvickt' : namn;
  }
  // Var fingertopparna är på ett ställe i banan, och hur handen är vänd.
  function korsStalle(o, A, namn) {
    const s = A.s;
    const { w: W, head: P } = o.F;
    // (utanpå halsduken, som hänger framför bröstet)
    const Dp = o.F.depth + (o.F.halsduk ? 9 : 0);
    const T = o.T;
    const b = balAxlar(o);
    const tvars = (x) => (x * s > 0 ? { y: b(-s * 0.22, 0.88, -0.42), z: b(s * 0.1, 0.4, 1) } : { y: b(-s * 0.78, 0.55, -0.3), z: b(-s * 0.1, 0.3, 1) });
    const pa = (x, y, z, r) => ({ c: iBal(o, new THREE.Vector3(x, y, z)), ...r });
    const framfor = { y: b(-s * 0.5, 0.82, -0.25), z: b(0, 0.2, 1) };
    switch (namn) {
      // (huvudet är stort: armarna når inte runt det till pannan, så handen stannar
      // framför ansiktet, så högt som armen räcker)
      case 'panna': {
        const h = huvudAxlar(o);
        const f = -0.3 + 0.022 * (o.F.a + o.F.b - 74);
        return { c: inHead(o, new THREE.Vector3(s * 3, P.ry * f, P.rz * Math.sqrt(1 - f * f) + o.F.arm * 1.5)), y: h(-s * 0.22, 0.92, -0.2), z: h(0, 0.2, 1) };
      }
      case 'mun': { const h = huvudAxlar(o); return { c: mouthIn(o).add(new THREE.Vector3(0, -1, 2)), y: h(-s * 0.35, 0.7, -0.6), z: h(0, 0.6, 0.8) }; }
      case 'brost': return pa(0, T * 0.8, Dp + 5, { y: b(-s * 0.6, 0.78, -0.15), z: b(0, 0.1, 1) });
      case 'vanster': return pa(W * 0.7, T * 0.98, Dp * 0.85, tvars(1));
      case 'hoger': return pa(-W * 0.7, T * 0.98, Dp * 0.85, tvars(-1));
      case 'upp': return pa(0, T * 1, Dp + 16, framfor);
      case 'ner': return pa(0, T * 0.6, Dp + 16, framfor);
      case 'vl': return pa(W * 0.62, T * 0.84, Dp + 16, tvars(1));
      case 'hl': return pa(-W * 0.62, T * 0.84, Dp + 16, tvars(-1));
      default: { const n = o.F.a + o.F.b; return { c: shoulder(o, A).add(new THREE.Vector3(s * n * 0.2, n * 1.05, n * 0.34)), y: new THREE.Vector3(-s * 0.06, 1, 0.1), z: new THREE.Vector3(s * 0.1, 0, -1) }; }
    }
  }
  const korsBlund = (o, t) => { const x = aktNu(o, t); return Boolean(x && x.a.blund && x.a.blund(o, x)); };
  // Handen i banan vid l: mellan två ställen en båge ut från ansiktet.
  function korsBana(o, A, d, l) {
    const B = d.bana;
    let i = 0;
    while (i < B.length - 1 && l >= B[i + 1][0]) i++;
    const f = B[i];
    const g = B[Math.min(i + 1, B.length - 1)];
    const k = g[0] > f[0] ? sm(f[0], g[0], l) : 1;
    const a = korsStalle(o, A, f[1]);
    const c = f[1] === g[1] || k <= 0 ? a : korsStalle(o, A, g[1]);
    const P = a.c.clone().lerp(c.c, k);
    const y = a.y.clone().lerp(c.y, k);
    const z = a.z.clone().lerp(c.z, k);
    const b = balAxlar(o);
    if ((f[1] === 'panna' || f[1] === 'mun' || g[1] === 'panna' || g[1] === 'mun') && f[1] !== g[1]) P.addScaledVector(b(0, 0, 1), 16 * Math.sin(Math.PI * k));
    if (d.litet) { const [x, v] = d.litet(l); P.addScaledVector(b(1, 0, 0), x * o.F.arm * 1.1).addScaledVector(b(0, 1, 0), v * o.F.arm * 1.1); }
    if (d.vrid) z.applyAxisAngle(y.clone().normalize(), A.s * d.vrid);
    P.addScaledVector(y.clone().normalize(), -o.F.arm * KORS_STOR * d.topp);
    // (armen töjs inte: dit den når)
    const S0 = shoulder(o, A);
    const ut = P.clone().sub(S0);
    const n = o.F.a + o.F.b - 1;
    if (ut.length() > n) P.copy(S0).addScaledVector(ut.normalize(), n);
    return { p: P, y, z, pole: new THREE.Vector3(A.s * 0.8, -1, 0) };
  }
  // Armen i korstecknet (d, l sekunder in), eller null om det inte är den.
  function korsHand(o, A, d, l, t) {
    const k = korsUpp(d, l);
    if (d.sak) {
      if (A !== skalArm(o) || k <= 0) return null;
      const s = A.s;
      const P = korsBana(o, A, d, l);
      // (det som är i handen står upp: handleden under korset)
      P.p.y -= o.T * 0.3;
      Object.assign(P, A.thing ? { y: new THREE.Vector3(s * 0.1, 1, 0.1), z: new THREE.Vector3(-s * 0.55, -0.75, -0.3) } : { y: new THREE.Vector3(s * 0.25, 1, 0.35), z: new THREE.Vector3(0, 0.1, 1) });
      P.pole = new THREE.Vector3(s, -0.6, -0.2);
      const m = d.munnen;
      const v = bump(l, m[0], m[1], m[2], m[3]);
      return lerpPose(handRest(o, A, t), v > 0 ? lerpPose(P, A.thing ? supAt(o, A, t, 0.8) : blossAt(o, A), v) : P, k);
    }
    if (A !== o.arms[0]) return null;
    // (först ner med det som är i handen, och upp igen med det efteråt)
    const [a] = d.upp || [0.45];
    let ner = handRest(o, A, t);
    if (A.bench) ner = lerpPose(ner, grip(A.bench.matrix, (A.thing || A.cig).matrix, new THREE.Vector3(A.s, -0.4, -0.6)), bump(l, 0, a, d.len - a, d.len));
    return k > 0 ? lerpPose(ner, korsBana(o, A, d, l), k) : ner;
  }
  // Var det pågår (AKTER): { d, l } för vem, eller null.
  const korsDel = (o, x) => (x && x.a.kors ? x.a.kors(o, x) : null);
  // Hur högt armen är (för handen med fingrar, och glöden i cigaretten som ligger).
  function korsK(o, t) {
    const x = aktNu(o, t);
    const v = korsDel(o, x);
    return v && !v.d.sak ? korsUpp(v.d, v.l) * x.w : 0;
  }
  // Handen med fingrar just nu, för pose.
  function korsFingrar(o, t) {
    const x = aktNu(o, t);
    const v = korsDel(o, x);
    if (!v || v.d.sak) return null;
    const k = korsUpp(v.d, v.l) * x.w;
    return k > 0.02 ? { A: o.arms[0], form: blanda(LOS, v.d.hand(v.l), sm(0.1, 0.7, k)), stor: 1 + (KORS_STOR - 1) * sm(0, 0.6, k) } : null;
  }
  for (const namn of Object.keys(KORS)) {
    const d = KORS[namn];
    AKTER[namn] = {
      len: d.len, in: 0.3, ut: 0.3,
      kors: (o, x) => ({ d, l: x.l }),
      hand: (o, A, t, l) => korsHand(o, A, d, l, t),
      kropp: (o, t, l) => (d.kropp ? d.kropp(l) : {}),
      blund: (o, x) => Boolean(d.blund && d.blund(x.l)),
    };
  }
  // Det smittar: a korsar sig ordentligt, de andra tittar på hen och gör det
  // sedan själva, en efter en, fort och utan att se på någon. (roller)
  const SMITTA = (i, R) => (i === R.b ? 3 : 4.3);
  AKTER.korsaSmitta = {
    len: 8.4, in: 0.3, ut: 0.3,
    kors: (o, x) => {
      const R = roller(x);
      const i = FI(o);
      return i === R.a ? { d: KORS.korsa, l: x.l } : { d: KORS.korsaKvickt, l: x.l - SMITTA(i, R) };
    },
    hand: (o, A, t, l, x) => { const v = AKTER.korsaSmitta.kors(o, x); return korsHand(o, A, v.d, v.l, t); },
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      if (i === R.a) return KORS.korsa.kropp(l);
      const sen = SMITTA(i, R);
      return { se: huvudPa(R.a), seW: bump(l, 1.1 + 0.3 * (i === R.c), 1.6 + 0.3 * (i === R.c), sen - 0.1, sen + 0.4), lean: 0.04 * bump(l, 1.1, 1.6, sen + 2, sen + 2.5) };
    },
    blund: (o, x) => FI(o) === roller(x).a && KORS.korsa.blund(x.l),
  };

  // ---------- dansen ----------
  // När radion spelar dansar de (DANSER i rum-dans.js): ner med det som är i händerna, som i
  // korstecknet, och upp med händerna med fingrar. Den som håller upp sin skylt dansar med
  // den i handen (pose). Allt står i bildens axlar (bildAxlar), utom det som rör kroppen.
  const DANS_STOR = 1.12;
  const dansUpp = (d, l) => bump(l, 0.45, DANS_IN, d.len - DANS_IN, d.len - 0.45);
  const dansB = (l) => (l - DANS_IN) / DANS_SLAG;
  function dansV(o, A, x) {
    const R = roller(x);
    const i = FI(o);
    return { rol: i === R.a ? 0 : i === R.b ? 1 : 2, a: R.a, sang: A && A === sangArm(o), t0: x.t0 };
  }
  function dansPose(o, A, L, v) {
    if (L.till) return lerpPose(dansPose(o, A, L.fran, v), dansPose(o, A, L.till, v), L.k);
    const s = A.s;
    const n = o.F.a + o.F.b;
    const S = shoulder(o, A);
    // flaskan (eller näven) som mikrofon, framför munnen
    if (L.mik) {
      const h = huvudAxlar(o);
      const m = mouthIn(o).addScaledVector(h(0, 0, 1), 7).addScaledVector(h(0, 1, 0), -7);
      const y = new THREE.Vector3(s * 0.14, 0.9, 0.42).normalize();
      if (A.thing) return { p: m.addScaledVector(y, -A.thing.userData.top), y, z: new THREE.Vector3(-s * 0.55, -0.75, -0.3), pole: new THREE.Vector3(s, -0.6, -0.2) };
      return { p: m.addScaledVector(y, -o.F.arm * DANS_STOR * 2.4), y, z: new THREE.Vector3(s * 0.8, -0.2, 0.3), pole: new THREE.Vector3(s, -0.6, -0.2) };
    }
    if (L.mot) return pekaPa(o, A, huvudPa(v.a), 0.82, 0);
    const B = bildAxlar(o);
    const V = (a) => B.x.clone().multiplyScalar(s * a[0]).addScaledVector(B.y, a[1]).addScaledVector(B.z, a[2]);
    // handflatan mot kroppen eller huvudet
    if (L.bal || L.hu) {
      const P = L.bal
        ? iBal(o, new THREE.Vector3(s * o.F.w * L.bal[0], o.T * L.bal[1], o.F.depth * L.bal[2]))
        : inHead(o, new THREE.Vector3(s * o.F.head.rx * L.hu[0], o.F.head.ry * L.hu[1], o.F.head.rz * L.hu[2]));
      const d = L.bal ? balAxlar(o) : huvudAxlar(o);
      const e = handflata(o, P, d(s * L.y[0], L.y[1], L.y[2]), d(s * L.z[0], L.z[1], L.z[2]), new THREE.Vector3(s * L.pole[0], L.pole[1], L.pole[2]));
      const ut = e.p.clone().sub(S);
      if (ut.length() > n * 0.97) e.p.copy(S).addScaledVector(ut.normalize(), n * 0.97);
      return e;
    }
    const y = V(L.y).normalize();
    const z = V(L.z);
    z.addScaledVector(y, -z.dot(y)).normalize();
    const P = (L.m ? S.clone().lerp(shoulder(o, o.arms.find((b) => b !== A)), 0.5) : S.clone()).addScaledVector(V(L.p), n);
    if (L.mun > 0) P.lerp(mouthIn(o).add(new THREE.Vector3(0, -2, 3)).addScaledVector(y, -o.F.arm * DANS_STOR * 3.2), L.mun);
    // (armen töjs inte: dit den når)
    const ut = P.clone().sub(S);
    if (ut.length() > n * 0.97) P.copy(S).addScaledVector(ut.normalize(), n * 0.97);
    if (L.vrid) z.applyAxisAngle(y, L.vrid * s);
    if (L.vink) y.applyAxisAngle(z, L.vink * s);
    return { p: P, y, z, pole: V(L.pole || [1, -0.7, -0.3]) };
  }
  function dansHand(o, A, t, l, x, d) {
    const v = dansV(o, A, x);
    const L = d.lage(dansB(l), A.s, v);
    if (!L) return null;
    const k = dansUpp(d, l);
    let ner = handRest(o, A, t);
    // (först ner med det som är i handen, och upp igen med det efteråt)
    if (A.bench && !L.sak) ner = lerpPose(ner, grip(A.bench.matrix, (A.thing || A.cig).matrix, new THREE.Vector3(A.s, -0.4, -0.6)), bump(l, 0, 0.45, d.len - 0.45, d.len));
    return k > 0 ? lerpPose(ner, dansPose(o, A, L, v), k) : ner;
  }
  // (bara när radion spelar eller nyss har spelat: annars kostar det ingenting)
  const dansKan = (o, t) => t >= SJUNG.radio.fran && (t < SJUNG.radio.till + 2 || SJUNG.radio.pa) || PROV[o.F.key];
  // Handen med fingrar just nu (null: den vanliga, med det som är i den), för pose.
  function dansFingrar(o, A, t) {
    const x = dansKan(o, t) && aktNu(o, t);
    if (!x || !x.a.dans) return null;
    const d = x.a.dans;
    const L = d.lage(dansB(x.l), A.s, dansV(o, A, x));
    if (!L || (L.sak && (A.thing || A.cig))) return null;
    const k = dansUpp(d, x.l) * x.w;
    return k > 0.02 ? { form: blanda(LOS, formen(L), sm(0.1, 0.7, k)), stor: 1 + (DANS_STOR - 1) * sm(0, 0.6, k) } : null;
  }
  // Hur högt armen är (glöden i cigaretten som ligger).
  function dansK(o, A, t) {
    const x = dansKan(o, t) && aktNu(o, t);
    if (!x || !x.a.dans) return 0;
    const L = x.a.dans.lage(dansB(x.l), A.s, dansV(o, A, x));
    return L && !L.sak ? dansUpp(x.a.dans, x.l) * x.w : 0;
  }
  // Varvet på barstolen, i grader.
  function dansSnurr(o, t) {
    const x = dansKan(o, t) && aktNu(o, t);
    if (!x || !x.a.dans || !x.a.dans.snurr) return 0;
    return x.a.dans.snurr(dansB(x.l), dansV(o, null, x)) * x.w;
  }
  for (const namn of Object.keys(DANSER)) {
    const d = DANSER[namn];
    AKTER[namn] = {
      len: d.len, in: 0.3, ut: 0.3, per: DANS_SLAG,
      dans: d,
      hand: (o, A, t, l, x) => dansHand(o, A, t, l, x, d),
      kropp: (o, t, l, x) => {
        const v = dansV(o, null, x);
        const b = d.kropp(dansB(l), v);
        const k = dansUpp(d, l);
        const ut = { mitt: true };
        for (const y of Object.keys(b)) ut[y] = y === 'knee' ? b.knee.map((q) => q * k) : y === 'se' ? b.se : b[y] * k;
        if (b.se === 'sangaren') { ut.se = huvudPa(v.a); ut.seW = b.seW * k; }
        return ut;
      },
      skratt: (o, t, l, x) => (d.sjung && d.sjung(dansB(l), dansV(o, null, x)) ? dansUpp(d, l) : 0),
      blund: (o, x) => Boolean(d.blund && dansUpp(d, x.l) > 0.5 && d.blund(dansB(x.l), dansV(o, null, x))),
    };
  }

  // Hur mycket vem skrattar just nu (ansiktet med hopknipna ögon, draw).
  function skrattW(o, t) {
    const x = aktNu(o, t);
    return x && x.a.skratt ? x.a.skratt(o, t, x.l, x) * x.w : 0;
  }

  // ---------- en går iväg ----------
  // Då och då (GA) kliver någon ner från barstolen och går ut ur bilden till
  // vänster, mot baren där Hasse sitter, med flaskan eller cigaretten i
  // handen, och kommer tillbaka en stund senare, klättrar upp och tar en
  // klunk (DT ett bloss). Golvet ligger bakom pulten, så den som går syns från
  // midjan och uppåt: höjden (golv) räknas så att benen alltid är under
  // pultens kant. Vägen (VAGAR) går runt bordet och de andra, efter var man
  // sitter – den som sitter till höger går bakom den som sitter bakom bordet –
  // och ut framför fönstret och dörren (duken räcker till scenens vänsterkant).
  // Stolen och det som står på bordet står kvar (gaFlytta). De andra tittar
  // efter hen och när hen kommer tillbaka. Inte medan någon väntar på
  // kupongen, på natten, när matcherna pågår, med minskad rörelse eller när
  // gänget gör något tillsammans – och gänget gör inget tillsammans medan
  // någon är borta (grupp).
  const GA = { slot: 97, start: 23, chans: 0.5, fart: 125, steg: 36, ner: 1.15, upp: 1.35, efter: 3.5 };
  // var fötterna står (figurens origo) i djupet z: pultens kant är scenens
  // y ≈ 655 (y = −255 i duken), med marginal för kamerans lutning och höften
  const golv = (z) => -250 * (D - z) / D - 36;
  // från platsen (PLATSER) och ut: först där man hamnar när man har klivit ner
  const VAGAR = [
    [[-385, 245], [-520, 250], [-700, 250], [-830, 250]],
    [[-240, 92], [-400, 95], [-650, 95], [-900, 95]],
    [[12, 138], [-30, 45], [-110, -15], [-250, -12], [-335, 88], [-480, 95], [-650, 95], [-900, 95]],
  ];
  const vagar = new Map();
  function vag(o) {
    const P = o.F.plats;
    if (!vagar.has(P)) {
      const k = new THREE.CatmullRomCurve3(VAGAR[PLATSER.indexOf(P)].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
      vagar.set(P, { k, len: k.getLength() });
    }
    return vagar.get(P);
  }
  // GAX: en promenad för bilder (ga, ?rum-ga)
  const GAX = { i: -1, t0: -1e9, bort: 4 };
  const kanGa = (t) => !Object.keys(PROV).length && allaVakna(t) && !grupp0(t) && tvingStart(t, t + 30) == null;
  // Den som går iväg vid t: { o, i, t0, l, bort: sekunder utanför bilden, T:
  // tiderna – nere (a), utanför bilden (b), på väg tillbaka (c), nere vid
  // stolen (d) och uppe (e) } – och klunken efteråt.
  // Svaret sparas per tid (GA_T, töms i varje bild: det frågas efter samma
  // tider många gånger, röken för var och en av sina tussar) och om någon går i
  // en lucka när luckan har börjat (GA_N), så att en promenad som har börjat
  // går färdigt fast läget ändras (någon lämnar in, natten …).
  const GA_T = new Map();
  const GA_N = new Map();
  function gaNu(t) {
    if (GA_T.has(t)) return GA_T.get(t);
    if (GA_T.size > 400) GA_T.clear();
    const x = gaNu0(t);
    GA_T.set(t, x);
    return x;
  }
  function gaNu0(t) {
    const med = (x) => {
      const o = figs[x.i];
      const g = vag(o).len / GA.fart;
      const a = GA.ner;
      const T = { a, b: a + g, c: a + g + x.bort, d: a + 2 * g + x.bort };
      T.e = T.d + GA.upp;
      const l = t - x.t0;
      return l >= 0 && l < T.e + GA.efter ? { ...x, o, T, l } : null;
    };
    const p = GAX.i >= 0 ? med(GAX) : null;
    if (p || opt.calm) return p;
    const n = Math.floor((t - GA.start) / GA.slot);
    if (hash(n * 4.13 + 8.1) > GA.chans) return null;
    if (!GA_N.has(n)) {
      const x = { i: Math.floor(hash(n * 2.71 + 1.9) * 3), t0: n * GA.slot + GA.start, bort: 5 + 9 * hash(n * 6.07 + 0.3) };
      if (GA_N.size > 20) GA_N.clear();
      GA_N.set(n, kanGa(x.t0) ? x : null);
    }
    const x = GA_N.get(n);
    return x ? med(x) : null;
  }
  // hela promenaden och klunken efteråt (då gör hen inget annat, vaken)
  const gaHar = (o, t) => { const g = gaNu(t); return g && g.o === o ? 1 - sm(g.T.e + GA.efter - 0.5, g.T.e + GA.efter, g.l) : 0; };
  // klunken (DT blosset) när hen har satt sig igen
  const gaKlunk = (o, t) => { const g = gaNu(t); return g && g.o === o ? bump(g.l - g.T.e, 0.3, 1.1, 2.2, 3.0) : 0; };
  const vinkel = (a, b, k) => a + (((((b - a) % 360) + 540) % 360) - 180) * k;
  const riktning = (v) => Math.atan2(v.x, v.z) / DEG;
  // Var figuren står ({ x, y, z, turn, w: hur mycket den går i stället för att
  // sitta, gar: hur mycket den tar steg, fas: stegen, l och T }).
  function stalle(o, t) {
    const F = o.F;
    const hem = { x: F.x, y: SILL, z: F.z, turn: F.turn + dansSnurr(o, t), w: 0, gar: 0, fas: 0 };
    const g = gaNu(t);
    if (!g || g.o !== o || g.l >= g.T.e) return hem;
    const { k, len } = vag(o);
    const { a, b, c, d, e } = g.T;
    const l = g.l;
    const w = sm(0, 0.35, l) * (1 - sm(e - 0.45, e, l));
    // lite långsammare i början och slutet av varje sträcka
    const mjuk = (u) => u - Math.sin(2 * Math.PI * u) / (2 * Math.PI) * 0.3;
    if (l < a || l >= d) {
      // ner från stolen och upp igen: vänder sig mot vägen och glider ner med
      // ett litet hopp – och tillbaka upp med ett skutt
      const ner = l < a;
      const u = ner ? l / a : (l - d) / (e - d);
      const f = ner ? sm(0.3, 0.95, u) : 1 - sm(0.2, 0.75, u);
      const E = k.getPointAt(0);
      const dir = ner ? riktning(k.getTangentAt(0)) : riktning(k.getTangentAt(0).negate());
      const x = F.x + (E.x - F.x) * f;
      const z = F.z + (E.z - F.z) * f;
      const y = SILL + (golv(z) - SILL) * f + (ner ? 7 * bump(u, 0.15, 0.32, 0.38, 0.6) : 16 * bump(u, 0.15, 0.42, 0.48, 0.78));
      return { x, y, z, turn: vinkel(F.turn, dir, ner ? sm(0, 0.45, u) : 1 - sm(0.5, 1, u)), w, gar: 0, fas: 0, l, T: g.T, ner };
    }
    // ut (a–b), borta (b–c) och tillbaka (c–d), med stegen över hela vägen
    const tillbaka = l >= c;
    const u = tillbaka ? 1 - mjuk((l - c) / (d - c)) : mjuk(Math.min(1, (l - a) / (b - a)));
    const P = k.getPointAt(u);
    const tg = k.getTangentAt(u);
    const s = tillbaka ? len * (2 - u) : len * u;
    const gar = tillbaka ? sm(c, c + 0.3, l) * (1 - sm(d - 0.25, d, l)) : sm(a - 0.1, a + 0.3, l) * (1 - sm(b - 0.25, b, l));
    return { x: P.x, y: golv(P.z) + 2.2 * Math.abs(Math.sin(Math.PI * s / GA.steg)) * gar, z: P.z, turn: riktning(tillbaka ? tg.negate() : tg), w, gar, fas: Math.PI * s / GA.steg, l, T: g.T };
  }
  // Huvudets mitt i rummet där figuren står vid t (de andra tittar efter den som går).
  const huvudVid = (o, t) => { const s = stalle(o, t); return headAt(o).add(new THREE.Vector3(s.x, s.y, s.z)); };
  // Figuren dit den står, och det som står kvar (stolen och sakerna på bordet,
  // userData.fast och efter) tillbaka dit det stod.
  const MH = new THREE.Matrix4();
  const MK = new THREE.Matrix4();
  const ML = new THREE.Matrix4();
  const QY = new THREE.Quaternion();
  const ETT = new THREE.Vector3(1, 1, 1);
  function gaFlytta(o, st) {
    const F = o.F;
    o.fig.position.set(st.x, st.y, st.z);
    o.fig.rotation.y = st.turn * DEG;
    o.turnNu = st.turn;
    const hemma = st.x === F.x && st.y === SILL && st.z === F.z && st.turn === F.turn;
    if (hemma && !o.borta) return;
    o.borta = !hemma;
    if (!hemma) {
      MH.compose(new THREE.Vector3(F.x, SILL, F.z), QY.setFromAxisAngle(UP, F.turn * DEG), ETT);
      MK.compose(o.fig.position, QY.setFromAxisAngle(UP, st.turn * DEG), ETT).invert().multiply(MH);
    }
    for (const x of o.fig.children) {
      if (!x.userData.fast && !x.userData.efter) continue;
      const h = x.userData.hem;
      if (hemma) {
        if (h) { x.position.copy(h.p); x.quaternion.copy(h.q); x.scale.copy(h.s); delete x.userData.hem; }
      } else {
        const hh = h || (x.userData.hem = { p: x.position.clone(), q: x.quaternion.clone(), s: x.scale.clone() });
        ML.compose(hh.p, hh.q, hh.s).premultiply(MK).decompose(x.position, x.quaternion, x.scale);
      }
      x.updateMatrix();
    }
  }
  // Bålen och huvudet medan man går: lite framåt, blicken framåt, och axlarna
  // som gungar med stegen; framåtlutad när man skjuter ifrån och hoppar upp.
  function gaKropp(o, st) {
    const { l, T } = st;
    const kliv = T ? 0.22 * bump(l, 0.1, 0.4, 0.7, 1.05) + 0.25 * bump(l, T.d + 0.05, T.d + 0.35, T.d + 0.6, T.e) : 0;
    return { lean: 0.06 + kliv, pitch: -0.04 + 0.025 * Math.sin(2 * st.fas) * st.gar, roll: 0.05 * Math.sin(st.fas) * st.gar, side: 0.03 * Math.sin(st.fas) * st.gar };
  }
  // Händerna medan man går (figurens axlar, fram = z): flaskan bärs upprätt
  // vid sidan, cigaretten framåt i midjans höjd och den lediga handen hänger
  // och pendlar mot stegen. När man kliver ner och klättrar upp tar den lediga
  // handen i sitsen.
  function gaHand(o, A, t, st) {
    const s = A.s;
    const n = o.F.a + o.F.b;
    const S0 = shoulder(o, A);
    const sw = Math.sin(st.fas + (s > 0 ? 0 : Math.PI)) * st.gar;
    if (A.thing) return { p: S0.add(new THREE.Vector3(s * 3, -n * 0.6, n * 0.16 + 6 * sw)), y: new THREE.Vector3(s * 0.05, 1, 0.12), z: new THREE.Vector3(s, 0, -0.15), pole: new THREE.Vector3(s, -0.5, -0.7) };
    if (A.cig) return { p: S0.add(new THREE.Vector3(s * 4, -n * 0.56, n * 0.26 + 5 * sw)), y: new THREE.Vector3(-s * 0.1, 0.3, 1), z: new THREE.Vector3(s * 0.3, 1, -0.2), pole: new THREE.Vector3(s, -0.6, -0.5) };
    const hang = { p: S0.add(new THREE.Vector3(s * 7, -n * 0.84, 3 + 15 * sw)), y: new THREE.Vector3(-s * 0.05, -1, 0.12 + 0.35 * sw), z: new THREE.Vector3(s, 0, 0), pole: new THREE.Vector3(s * 0.3, 0, -1) };
    const { l, T } = st;
    const tag = T ? bump(l, 0, 0.12, 0.45, 0.8) + bump(l, T.d - 0.3, T.d + 0.1, T.d + 0.55, T.d + 0.95) : 0;
    if (tag <= 0) return hang;
    // sitsen i figurens axlar
    const sits = new THREE.Vector3(o.F.x - st.x, SILL + 3 - st.y, o.F.z - st.z).applyAxisAngle(UP, -st.turn * DEG);
    const tar = { p: sits.add(new THREE.Vector3(s * 14, 0, 0)), y: new THREE.Vector3(0, -0.2, 1), z: new THREE.Vector3(0, 1, 0), pole: new THREE.Vector3(s, 0, -1) };
    return lerpPose(hang, tar, tag);
  }

  // ---------- målen på tre sätt ----------
  const malV = (o) => (M[o.F.key] ? M[o.F.key].v || 0 : 0);
  // båda armarna upp: den öppna handen som flaskan
  function armUpp(o, A, t) {
    const dt = t - M[o.F.key].at;
    const h = upp(o, A, 0.42, 0.62, 0.1);
    h.p.y += Math.sin(dt * 15) * 2.2 * sm(0.4, 0.7, dt) * (1 - sm(2.6, 3.4, dt));
    return h;
  }
  // båda händerna på huvudet: handflatorna mot tinningarna, armbågarna ut
  // (flaskan i handen bredvid)
  function haret(o, A) {
    const s = A.s;
    const P = o.F.head;
    const d = huvudAxlar(o);
    if (A.thing) return { p: inHead(o, new THREE.Vector3(s * (P.rx + 12), P.ry * 0.05, -P.rz * 0.1)), y: d(s * 0.1, 1, -0.3), z: d(s, 0.1, 0.4), pole: new THREE.Vector3(s, 0.3, 0.1) };
    return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.95, P.ry * 0.08, -P.rz * 0.08)), d(-s * 0.15, 0.75, -0.6), d(s, 0.1, 0.1), new THREE.Vector3(s, 0.4, 0.2));
  }
  // handen i bordet: dunkar av glädje (glad) eller lyfts och slår en gång
  function slag(o, A, t, glad) {
    const dt = t - M[o.F.key].at;
    const lyft = glad ? 10 * Math.max(0, Math.sin(dt * 9)) ** 1.5 * sm(0.2, 0.4, dt) * (1 - sm(2.6, 3.2, dt)) : 24 * bump(dt, 0.1, 0.38, 0.42, 0.55);
    return paBordet(o, A, 20, 12, lyft);
  }

  // Var handen är i tecknet (rum-tecken.js), i figurens axlar: betraktarens
  // axlar vridna tillbaka, med x åt armens sida.
  function teckenLage(o, A, namn, T) {
    const L = TECKEN[namn].lage(T, o.F.plats === PLATSER[1]);
    const ut = new THREE.Vector3(A.s, 0, 0).applyAxisAngle(UP, -o.F.turn * DEG);
    const fram = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, -o.F.turn * DEG);
    const V = (a) => ut.clone().multiplyScalar(a[0]).add(new THREE.Vector3(0, a[1], 0)).addScaledVector(fram, a[2]);
    const n = o.F.a + o.F.b;
    const S0 = shoulder(o, A);
    let y = V(L.y).normalize();
    let z = V(L.z);
    z.addScaledVector(y, -z.dot(y)).normalize();
    // (innan handen vrids: var handleden ska vara för att fingertopparna ska nå munnen)
    let d = V(L.p);
    // bakom bordet är grannarnas huvuden nära: handen närmare det egna och
    // lägre, där huvudena smalnar av, och lite fram
    if (o.F.plats === PLATSER[1]) d.addScaledVector(ut, -0.24 * L.p[0]).add(new THREE.Vector3(0, -0.2 * Math.min(1, L.p[1] / 0.4), 0)).addScaledVector(fram, 0.1);
    if (L.mun > 0) {
      const topp = o.F.arm * TK_STOR * 3.2;
      const hit = mouthIn(o).add(new THREE.Vector3(0, -2, 3)).addScaledVector(y, -topp).sub(S0).divideScalar(n);
      d.lerp(hit, L.mun);
    }
    if (d.length() > 0.95) d.setLength(0.95);
    if (L.vrid) z.applyAxisAngle(y, L.vrid * A.s);
    if (L.vink) y.applyAxisAngle(z, L.vink * A.s);
    return { p: S0.addScaledVector(d, n), y, z, pole: V(L.pole) };
  }
  // Bildens axlar i figurens (x åt höger, y uppåt, z mot kameran): skylten och dansen vänds
  // mot den som tittar. Räknas ur stolen, för figuren kan vara på väg eller mitt i ett snurr,
  // och står sedan kvar (kameran rör sig bara lite).
  const bildQ = new THREE.Quaternion();
  function bildAxlar(o) {
    if (!o.bild) {
      o.fig.parent.getWorldQuaternion(bildQ).multiply(QY.setFromAxisAngle(UP, o.F.turn * DEG));
      bildQ.invert().multiply(cam.quaternion);
      o.bild = { x: new THREE.Vector3(1, 0, 0).applyQuaternion(bildQ), y: new THREE.Vector3(0, 1, 0).applyQuaternion(bildQ), z: new THREE.Vector3(0, 0, 1).applyQuaternion(bildQ) };
    }
    return o.bild;
  }
  // Handen som håller skylten, i figurens axlar (rum-tecken.js, LAPP_HALL).
  function lappLage(o, A, lp) {
    const L = lp.L;
    const B = bildAxlar(o);
    const V = (a) => B.x.clone().multiplyScalar(A.s * a[0]).addScaledVector(B.y, a[1]).addScaledVector(B.z, a[2]);
    const n = o.F.a + o.F.b;
    const S0 = shoulder(o, A);
    if (L.tva > 0) S0.lerp(shoulder(o, lp.B), L.tva * 0.5);
    const d = V(L.p);
    if (L.tva < 0.5 && d.length() > 0.95) d.setLength(0.95);
    const y = V(L.y).normalize();
    const z = V(L.z);
    z.addScaledVector(y, -z.dot(y)).normalize();
    if (L.vrid) z.applyAxisAngle(y, L.vrid * A.s);
    if (L.vink) y.applyAxisAngle(z, L.vink * A.s);
    return { p: S0.addScaledVector(d, n), y, z, pole: V(L.pole) };
  }
  // Den andra handen i skyltens andra hörn: den första speglad i skyltens mittlinje (lappStall).
  function lappAndra(o, A, lp) {
    const c = lp.kort;
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(c.q);
    const p = c.hp.clone().addScaledVector(r, 2 * c.p.clone().sub(c.hp).dot(r));
    const y = new THREE.Vector3(0, 1, 0).applyQuaternion(c.hq);
    y.addScaledVector(r, -2 * y.dot(r));
    const B = bildAxlar(o);
    const pole = B.x.clone().multiplyScalar(A.s * lp.L.pole[0]).addScaledVector(B.y, lp.L.pole[1]).addScaledVector(B.z, lp.L.pole[2]);
    return { p, y, z: new THREE.Vector3(0, 0, 1).applyQuaternion(c.hq), pole };
  }
  // Handen och armen i tecknet just nu – från det förra tecknet om det pågick.
  function teckenPose(o, A, g) {
    const { x, T } = g;
    const P = teckenLage(o, A, x.namn, T);
    return x.fran ? lerpPose(teckenLage(o, A, x.fran.namn, T + x.fran.T), P, sm(0, TK_IN, T)) : P;
  }
  function teckenHand(g) {
    const { x, T, w } = g;
    const h = TECKEN[x.namn].hand(T);
    const form = x.fran ? blanda(TECKEN[x.fran.namn].hand(T + x.fran.T), h, sm(0, TK_IN, T)) : h;
    return blanda(LOS, form, sm(TK_BYT, 0.85, w));
  }

  function pose(o, t) {
    // var figuren står (stalle, gaFlytta): på stolen, eller på väg
    o.st = stalle(o, t);
    gaFlytta(o, o.st);
    body(o, t);
    o.torso.updateMatrix();
    // pennan i handen eller bakom örat, kupongen i handen eller på bordet,
    // flaskan och cigaretten bredvid eller i handen
    const u = uOf(o, t);
    o.earPen.visible = u >= 0.28;
    o.kupBench.visible = u >= 0.3;
    const tk = teckenNu(o, t);
    const ks = korsFingrar(o, t);
    const lp = lappNu(o, t);
    if (o.lapp && !lp) o.lapp.visible = false;
    if (lp && lp.lyft <= 0) lappStall(o, lp);
    // (handen som håller skylten först: den andra tar tag i den, lappAndra)
    for (const A of lp && lp.L.tva > 0 && lp.A !== o.arms[0] ? [o.arms[1], o.arms[0]] : o.arms) {
      const taken = u >= 0.55;
      if (A.pen) A.pen.visible = u < 0.28;
      if (A.kup) A.kup.visible = u < 0.3;
      if (A.bench) A.bench.visible = !taken;
      if (A.cig) A.cig.visible = taken;
      const useW = A.wHand !== A.hand && !taken;
      // (också när det är samma hand: efter tecknet och dansen ska den fram igen)
      A.wHand.visible = useW;
      A.hand.visible = !useW;
      let H = useW ? A.wHand : A.hand;
      let hp = handPose(o, A, t);
      const iLapp = lp && lp.A === A && lp.w > 0 && !(ks && ks.A === A);
      const iAndra = lp && lp.B === A && lp.L.tva > 0 && lp.lyft > 0 && lp.kort && !(ks && ks.A === A);
      if (iLapp) {
        const upp = lp.lyft > 0 ? lappLage(o, A, lp) : null;
        if (lp.lyft < 1) lp.bord = lappBord(o, A);
        hp = lerpPose(hp, !upp ? lp.bord : lp.lyft < 1 ? lappBage(o, lerpPose(lp.bord, upp, lp.lyft), lp.lyft) : upp, lp.w);
      } else if (iAndra) hp = lerpPose(hp, lappAndra(o, A, lp), lp.L.tva * sm(0.25, 0.9, lp.lyft));
      const grepp = iLapp ? lp.w : iAndra ? lp.L.tva * sm(0.25, 0.9, lp.lyft) : 0;
      if (tk && tk.A === A) hp = lerpPose(hp, teckenPose(o, A, tk), tk.w);
      if (o.st.w > 0) hp = lerpPose(hp, gaHand(o, A, t, o.st), o.st.w);
      if (A.fist) {
        const f = cheerW(o, t) > 0.35 && malV(o) !== 2;
        A.fist.visible = f;
        H.visible = !f;
        if (f) H = A.fist;
      }
      // tecknet: handen med fingrar. Pennan har gått bakom örat och DJ:s
      // cigarett ligger på bordet så länge.
      if (A.fingerHand) A.fingerHand.visible = false;
      // (eller korstecknet: flaskan står på bordet så länge)
      const fg = tk && tk.A === A && tk.w > TK_BYT ? { form: teckenHand(tk), stor: 1 + (TK_STOR - 1) * sm(TK_BYT, 0.8, tk.w) } : grepp > TK_BYT ? { form: blanda(LOS, LAPP_GREPP, sm(TK_BYT, 0.85, grepp)), stor: 1 + (TK_STOR - 1) * sm(TK_BYT, 0.8, grepp) * sm(0.05, 0.9, lp.lyft) } : ks && ks.A === A ? ks : dansFingrar(o, A, t);
      if (fg) {
        if (!A.fingerHand) A.fingerHand = fingerHand(o.F.arm, o.hud, o.fig, A.s);
        // (den vanliga handen följer med osynlig: röken räknas ur cigaretten i den)
        orient(A.hand, hp.p, hp.y, hp.z);
        for (const x of [A.hand, A.wHand, A.fist]) if (x) x.visible = false;
        H = A.fingerHand;
        H.visible = true;
        H.scale.setScalar(fg.stor);
        fingrar(H, fg.form);
        if (A.pen) o.earPen.visible = true;
        if (A.bench) A.bench.visible = true;
        if (iLapp && A.cig) A.cig.visible = false;
      }
      orient(H, hp.p, hp.y, hp.z);
      if (iLapp && lp.lyft > 0) { H.updateMatrix(); lappStall(o, lp, H, fg && (!tk || tk.A !== A)); }
      // näven: handleden där den öppna handens handled var
      if (H === A.fist) H.position.sub(H.userData.wrist.clone().applyQuaternion(H.quaternion));
      H.updateMatrix();
      const Wr = H.userData.wrist.clone().applyMatrix4(H.matrix);
      const S = shoulder(o, A);
      const E = ik(S, Wr, o.F.a, o.F.b, hp.pole);
      const du = E.clone().sub(S).normalize();
      const sl = S.clone().add(du.clone().multiplyScalar(o.F.a * 0.48));
      place(A.up, S, E);
      place(A.lo, E, Wr);
      if (A.tat) {
        // tatueringen sitter på handryggens sida av underarmen och vrids med handen
        const z = new THREE.Vector3(0, 0, 1).applyQuaternion(A.hand.quaternion).applyQuaternion(A.lo.quaternion.clone().invert());
        A.tat.rotation.y = Math.atan2(z.x, z.z) - A.s * o.F.tatuering.rot * DEG;
      }
      const Z = new THREE.Vector3(0, 0, 1);
      if (A.sleeveKind === 'kort') {
        place(A.sleeve, S, sl);
        A.cuff.position.copy(sl);
        A.cuff.quaternion.setFromUnitVectors(Z, du);
      } else {
        // långa ärmar till strax före handleden, uppkavlade till armbågen
        place(A.sleeve, S, E);
        const dl = Wr.clone().sub(E).normalize();
        const end = E.clone().addScaledVector(dl, o.F.b * 0.84);
        if (A.loS) {
          place(A.loS, E, end);
          A.cuff.position.copy(end).addScaledVector(dl, -1);
          A.cuff.quaternion.setFromUnitVectors(Z, dl);
        } else {
          A.cuff.position.copy(E).addScaledVector(du, -2);
          A.cuff.quaternion.setFromUnitVectors(Z, du);
        }
        if (A.quilt) for (const q of A.quilt) {
          q.x.position.copy(q.seg ? E.clone().addScaledVector(dl, o.F.b * q.f) : S.clone().addScaledVector(du, o.F.a * q.f));
          q.x.quaternion.setFromUnitVectors(Z, q.seg ? dl : du);
        }
      }
      if (A.cig) {
        const g = glowAt(o, t);
        const tip = A.cig.userData.tip;
        // nerbrunnen på natten: askan grå och ingen glöd
        const slack = Math.max(slumW(o, t), sovW(o, t));
        tip.material.color.setRGB(1 - 0.45 * slack, (0.32 + 0.25 * g) * (1 - slack) + 0.55 * slack, (0.1 + 0.08 * g) * (1 - slack) + 0.52 * slack);
        A.cig.userData.halo.material.opacity = (0.35 + 0.6 * g + 0.08 * Math.sin(t * 13 + o.phase)) * (1 - slack);
        A.cig.userData.halo.scale.setScalar(8 + 7 * g);
      }
    }
  }

  // Skylten i handen: en bit kartong, lite välvd, med handen under och tummen framför.
  // Hörnen och kanten är genomskinliga i bilden (lappMask), så att de är mjuka också
  // utan kantutjämning. Baksidan är brun, och den syns när någon vänder på skylten.
  const LAPP_V = 56;
  const LAPP_H = 70;
  const lappGeo = new THREE.PlaneGeometry(LAPP_V, LAPP_H, 8, 1);
  {
    const p = lappGeo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, -2.2 * (p.getX(i) / (LAPP_V / 2)) ** 2);
    lappGeo.computeVertexNormals();
  }
  let lappMask = null;
  let lappBak = null;
  function rundRekt(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function lappMaskBild() {
    if (lappMask) return lappMask;
    lappMask = canvasTex(128, 160, (g, w, h) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff';
      rundRekt(g, 2, 2, w - 4, h - 4, 7);
      g.fill();
    });
    lappMask.colorSpace = THREE.NoColorSpace;
    return lappMask;
  }
  const lappTex = new Map();
  // Kartongens yta: små fibrer och en ton som mörknar mot kanterna.
  function kartong(g, w, h, bas, fiber) {
    g.fillStyle = bas;
    g.fillRect(0, 0, w, h);
    let f = 7;
    const r = () => { f = (f * 16807) % 2147483647; return f / 2147483647; };
    for (let i = 0; i < 260; i++) {
      g.fillStyle = r() < 0.5 ? fiber : 'rgba(255,255,255,.07)';
      g.fillRect(r() * w, r() * h, 1 + r() * 7, 1);
    }
    const gr = g.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h * 0.5, h * 0.72);
    gr.addColorStop(0, 'rgba(80,50,15,0)');
    gr.addColorStop(1, 'rgba(80,50,15,.2)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }
  function lappBild(tal, ink) {
    const k = `${tal}|${ink}`;
    if (!lappTex.has(k)) {
      lappTex.set(k, canvasTex(256, 320, (g, w, h) => {
        kartong(g, w, h, '#f8f3e4', 'rgba(110,85,45,.08)');
        g.strokeStyle = 'rgba(70,50,25,.34)';
        g.lineWidth = 2.5;
        rundRekt(g, 14, 14, w - 28, h - 28, 12);
        g.stroke();
        const stort = String(tal).length > 1 ? 196 : 276;
        g.fillStyle = g.strokeStyle = ink;
        g.lineWidth = 8;
        g.lineJoin = 'round';
        g.font = `700 ${stort}px Caveat, cursive`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(tal, w / 2, h * 0.47);
        g.strokeText(tal, w / 2, h * 0.47);
      }));
    }
    return lappTex.get(k);
  }
  // Skylten på bordet (PLATSER, skylt): i figurens axlar när hen sitter på stolen, siffran uppåt och
  // överkanten bort från kameran. Var och en på sin höjd, så att två som ligger omlott inte flimrar.
  function lappVila(o) {
    if (o.lappPlats) return o.lappPlats;
    const F = o.F;
    const [x, z, v] = F.plats.skylt;
    const vrid = -F.turn * DEG;
    const p = new THREE.Vector3(BORD.x + x - F.x, BORD.y + 0.6 + 0.25 * PLATSER.indexOf(F.plats), BORD.z + z - F.z).applyAxisAngle(UP, vrid);
    const upp = new THREE.Vector3(Math.sin(v * DEG), 0, -Math.cos(v * DEG)).applyAxisAngle(UP, vrid);
    const n = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(upp, n), upp, n));
    o.lappPlats = { p, q };
    return o.lappPlats;
  }
  // Handen vid skylten på bordet, handflatan neråt: på väg från axeln mot skyltens mitt, vid
  // kanten eller så långt armen når (armarna töjs inte).
  function lappBord(o, A) {
    const { p: mitt } = lappVila(o);
    const S = shoulder(o, A);
    const y = BORD.y + 5;
    const mot = new THREE.Vector3(mitt.x - S.x, 0, mitt.z - S.z);
    const d = mot.length();
    mot.divideScalar(d);
    const n = (o.F.a + o.F.b) * 0.97;
    const r = Math.min(d - LAPP_V * 0.4, Math.sqrt(Math.max(0, n * n - (S.y - y) * (S.y - y))));
    return { p: new THREE.Vector3(S.x + mot.x * r, y, S.z + mot.z * r), y: mot.clone().setY(-0.12), z: new THREE.Vector3(0, 1, 0.05), pole: new THREE.Vector3(A.s, -0.3, -0.6) };
  }
  // På vägen mellan bordet och uppe går handen framför hakan, inte genom huvudet.
  function lappBage(o, P, lyft) {
    P.p.add(new THREE.Vector3(0, 0, 0.3 * (o.F.a + o.F.b) * Math.sin(Math.PI * lyft)).applyAxisAngle(UP, -o.F.turn * DEG));
    return P;
  }
  const lappUt = new THREE.Vector3();
  const lappRz = new THREE.Quaternion();
  const lappRy = new THREE.Quaternion().setFromAxisAngle(UP, Math.PI);
  const LAPP_Z = new THREE.Vector3(0, 0, 1);
  // Utan H ligger skylten på bordet (lappVila). I handen sitter den som hållningen säger, och på väg
  // ner tippar överkanten bakåt tills den ligger där.
  function lappStall(o, lp, H, syns) {
    let m = o.lapp;
    const k = `${lp.x.tal}|${lp.x.ink}`;
    if (!m || m.userData.k !== k) {
      if (m) o.fig.remove(m);
      const bild = lappBild(lp.x.tal, lp.x.ink);
      const mask = lappMaskBild();
      m = new THREE.Mesh(lappGeo, new THREE.MeshStandardMaterial({ map: bild, alphaMap: mask, transparent: true, alphaTest: 0.04, roughness: 0.88, metalness: 0, envMapIntensity: 0.3, emissive: '#ffffff', emissiveMap: bild, emissiveIntensity: 0.14 }));
      if (!lappBak) {
        lappBak = canvasTex(128, 160, (g, w, h) => kartong(g, w, h, '#b79b70', 'rgba(70,48,20,.18)'));
      }
      const bak = new THREE.Mesh(lappGeo, new THREE.MeshStandardMaterial({ map: lappBak, alphaMap: mask, transparent: true, alphaTest: 0.04, roughness: 0.92, metalness: 0, envMapIntensity: 0.2, side: THREE.BackSide, emissive: '#ffffff', emissiveMap: lappBak, emissiveIntensity: 0.3 }));
      bak.receiveShadow = true;
      bak.userData.lapp = true;
      m.add(bak);
      m.castShadow = m.receiveShadow = true;
      m.userData.k = k;
      m.userData.lapp = true;
      m.userData.fast = true;
      m.matrixAutoUpdate = false;
      o.fig.add(m);
      o.lapp = m;
    }
    // (tonar bort när tiden är ute)
    m.material.opacity = m.children[0].material.opacity = lp.ton;
    if (!H) {
      m.visible = true;
      if (m.userData.ligger) return;
      m.userData.ligger = true;
      const v = lappVila(o);
      m.position.copy(v.p);
      m.quaternion.copy(v.q);
      // (går hen iväg just nu ligger skylten kvar på bordet, gaFlytta)
      if (o.borta) m.userData.hem = { p: v.p.clone(), q: v.q.clone(), s: m.scale.clone() };
      m.updateMatrix();
      return;
    }
    m.userData.ligger = false;
    delete m.userData.hem;
    m.visible = Boolean(syns);
    const L = lp.L;
    const s = lp.A.s;
    const q = o.F.arm * H.scale.x;
    const a = s * L.rot;
    const sa = Math.sin(a);
    const ca = Math.cos(a);
    const e = q * LAPP_GREPP.under + Math.abs(ca) * (LAPP_H / 2) + Math.abs(sa) * (LAPP_V / 2);
    const xs = s * L.x * LAPP_V;
    // (handen under skylten: den vrids kring handen; i dess sida: ute i fingrarnas riktning)
    m.position.set((-sa * e + ca * xs) * (1 - L.sida), (ca * e + sa * xs) * (1 - L.sida) + e * L.sida, -(q * 0.6 + 0.5)).applyQuaternion(H.quaternion).add(H.position);
    lappRz.setFromAxisAngle(LAPP_Z, a);
    m.quaternion.copy(H.quaternion).multiply(lappRz).multiply(lappRy);
    if (lp.lyft < 1) {
      const v = lappVila(o);
      // (skylten på samma avstånd från handen hela vägen, så att handen inte går igenom den)
      const fran = v.p.clone().sub(lp.bord.p);
      const till = m.position.clone().sub(H.position);
      const langd = fran.length() + (till.length() - fran.length()) * lp.lyft;
      lappUt.copy(fran).lerp(till, lp.lyft).setLength(langd);
      m.position.copy(H.position).add(lappUt);
      m.quaternion.slerpQuaternions(v.q, m.quaternion.clone(), lp.lyft);
    }
    m.updateMatrix();
    lp.kort = { p: m.position, q: m.quaternion, hp: H.position, hq: H.quaternion };
  }

  // ---------- röken ----------
  // Varje bloss föds på en fast tid; läget räknas ur var glöden (eller
  // munnen, när man blåser ut) var då, plus drift uppåt och åt sidan.
  const smokeTex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(228,230,234,.9)'); gr.addColorStop(0.45, 'rgba(214,218,224,.38)'); gr.addColorStop(1, 'rgba(200,205,212,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const smokers = [];
  for (const o of figs) for (const A of o.arms) if (A.cig) smokers.push({ o, A });
  const SM = { every: 0.09, life: 5.5, n: 0 };
  SM.n = Math.ceil(SM.life / SM.every) + 2;
  const puffs = [];
  for (const sk of smokers) {
    for (const src of ['glod', 'mun']) {
      const list = [];
      for (let i = 0; i < SM.n; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, color: '#e4e6ea', toneMapped: false }));
        root.add(sp);
        list.push(sp);
      }
      puffs.push({ sk, src, list, born: new Map() });
    }
  }
  const fp = new THREE.Vector3();
  function emitter(sk, src, t) {
    pose(sk.o, t);
    sk.o.fig.updateMatrix();
    if (src === 'mun') return mouthIn(sk.o).applyMatrix4(sk.o.fig.matrix);
    sk.A.hand.updateMatrix();
    sk.A.cig.updateMatrix();
    return sk.A.cig.userData.end.clone().applyMatrix4(sk.A.cig.matrix).applyMatrix4(sk.A.hand.matrix).applyMatrix4(sk.o.fig.matrix);
  }
  function smoke(t) {
    for (const { sk, src, list, born } of puffs) {
      const o = sk.o;
      const base = Math.floor(t / SM.every);
      // var glöden (munnen) var när varje bloss föddes räknas en gång
      for (const k of born.keys()) if (k < base - SM.n || k > base) born.delete(k);
      list.forEach((sp, i) => {
        const k = base - i;
        const tb = k * SM.every;
        const age = t - tb;
        const seed = k * 7.13 + o.F.x;
        let alpha = 0;
        // ingen rök medan cigaretten ligger släckt och man väntar på kupongen
        if (src === 'glod') {
          const tk = teckenNu(o, tb);
          alpha = 0.8 * (1 - dragW(o, tb) * 0.7) * sm(0.55, 0.62, uOf(o, tb)) * (1 - Math.max(slumW(o, tb), sovW(o, tb))) * (tk && tk.A === sk.A ? 1 - tk.w : 1) * (sk.A === o.arms[0] ? 1 - korsK(o, tb) : 1) * (1 - dansK(o, sk.A, tb)) * (LP[o.F.key] && o.arms[LP[o.F.key].i] === sk.A && LP[o.F.key].ut == null && !LP[o.F.key].ner ? 0 : 1);
        }
        else {
          // utandningen: strax efter blosset (och det första efter inlämningen)
          // (inget bloss när man gjorde något annat, aktW, och ett efter blosset i skålen)
          const out = o.F.key === 'dt' ? bump(tb % 12, 6.0, 6.3, 7.4, 8.6) : bump((tb + 5) % 16, 4.4, 4.7, 5.8, 7);
          alpha = 0.85 * Math.max(ready(o, tb) * out * (1 - aktW(o, tb - 2)), after(o, tb, 3.0, 3.3, 4.4, 5.6), blasW(o, tb));
        }
        if (alpha < 0.01 || age < 0 || age > SM.life) { sp.material.opacity = 0; sp.visible = false; return; }
        let e = born.get(k);
        if (!e) { e = emitter(sk, src, tb); born.set(k, e); }
        const life = age / SM.life;
        const rise = src === 'glod' ? 11 + 2 * hash(seed) : 5;
        fp.copy(e);
        // ett tunt band närmast glöden som slingrar sig och löses upp högre upp
        const curl = Math.sin(age * 1.7 + tb * 0.8) * (1.2 + age * 3.2) + Math.sin(age * 0.6 + hash(seed + 1) * 6) * age * 2.5;
        fp.y += rise * age + 0.9 * age * age;
        fp.x += curl + age * 3.6;
        fp.z += (src === 'mun' ? 18 * (1 - Math.exp(-age * 1.6)) : 0) + Math.cos(age * 0.9 + tb) * age * 1.5;
        sp.position.copy(fp);
        const size = src === 'glod' ? 3.2 + age * 5.5 + age * age * 0.7 : 9 + age * 14;
        sp.scale.set(size, size, 1);
        sp.material.opacity = alpha * Math.min(1, age * 4) * (1 - life) ** (src === 'glod' ? 1.8 : 1.3);
        sp.material.rotation = hash(seed + 2) * 6 + age * 0.3;
        sp.visible = true;
      });
    }
  }

  // ---------- en bild ----------

  // Huvudena nickar efter när musen rör sig: en fjäder mot vridningen och
  // dess fart, räknad i tid (240 steg i sekunden), så att de nickar lika
  // fort och lika mycket hur glest gänget än ritas (KVAL i rum.js) – i ett
  // steg per bild svängde de i telefonen ut längre och långsammare.
  const NICK = { w: 8.19, z: 0.276 };
  let headA = 0;
  let headV = 0;
  let lastMx = 0;
  let lastT = null;
  function draw(t, mx, my, neonPa) {
    GA_T.clear();
    const dt = lastT === null ? 0 : Math.min(0.1, t - lastT);
    lastT = t;
    if (dt > 0) {
      const mal = ((mx - lastMx) / dt * (40 / 30) + mx * 3) * DEG;
      const n = Math.ceil(dt * 240);
      for (let i = 0; i < n; i++) {
        headV += (NICK.w * NICK.w * (mal - headA) - 2 * NICK.z * NICK.w * headV) * (dt / n);
        headA += headV * (dt / n);
      }
    } else {
      // första bilden, och en fast bild (?rum-t): huvudena i vila
      headA = mx * 3 * DEG;
      headV = 0;
    }
    lastMx = mx;
    // (röken först: den ställer figuren när blosset föddes, emitter)
    smoke(t);
    for (const o of figs) pose(o, t);
    radioRita(t);
    // högtidens huvudbonad: lågorna i luciakronan fladdrar, och en hög bonad
    // tar DJ av sig när han sover med huvudet på bordet
    for (const o of figs) {
      if (!o.H) continue;
      if (o.H.hog) o.H.grupp.visible = sovW(o, t) < 0.5;
      if (o.H.tick) o.H.tick(t);
    }
    // (inte i en fast bild), och DJ blundar när han sover
    // och skrattar (skrattW) med ögonen hopknipna och munnen öppen (DJ:s i
    // skägget) – annars ansiktet efter humöret (ansiktet)
    for (const o of figs) {
      const sk = skrattW(o, t) > 0.3;
      const a = ansiktet(o.F.key);
      const skratt = o.skratt || (a.bas !== tex[o.F.key] ? tex[o.F.key] : null);
      o.face.material.map = sk && skratt ? skratt : a.blund && ((!opt.calm && blinkar(o, t)) || sovW(o, t) > 0.5 || korsBlund(o, t)) ? a.blund : a.bas;
      if (o.skagg) o.skagg.material.map = sk && tex.dj_skagg_skratt ? tex.dj_skagg_skratt : tex.ans_skagg || tex.dj_skagg;
    }
    // neonen bakom dem slocknar när skylten glappar, och tv:n lyser i
    // ansiktena när de tittar på matcherna (svagt, och fladdrar som rutan)
    neon.intensity = neonPa === false ? 0 : NEON;
    // på natten är lysröret släckt och text-tv:n lyser svagt på dem
    const natt = nattW(t);
    key.intensity = KEY * (1 - 0.86 * natt);
    fill.intensity = FILL * (1 - 0.6 * natt);
    hemi.intensity = hemiDag * (Q.enkel ? HEMI_ENKEL : 1) * (1 - 0.55 * natt);
    const tv = Math.max(tvW(t), 0.55 * natt);
    tvLjus.intensity = tv > 0 ? TVLJUS * tv * (0.86 + 0.08 * Math.sin(t * 2.3) + 0.06 * Math.sin(t * 13.1 + Math.sin(t * 3.7))) : 0;
    pivot.rotation.y = mx * 4.5 * DEG;
    pivot.rotation.x = my * 2.6 * DEG;
    if (Q.skugga > 1) r.shadowMap.needsUpdate = Q.n++ % Q.skugga === 0;
    r.render(scene, cam);
    if (ombyggda.length) slappOmbyggda();
  }

  // Hur fint gänget ritas, när datorn inte hinner med (KVAL i rum.js): pr
  // gånger de vanliga bildpunkterna (aldrig under 0,75 per punkt),
  // skuggorna räknade var skugga:e bild – figurerna rör sig lite, så att
  // skuggorna hänger med ändå – och figurerna byggda av färre trianglar
  // (detalj; de byggs om som när kläderna byts, ute).
  // Närbilden av radion (rum.js): ruta { x, y, w, h, pr, bred } i dukens mått är det som syns, och bara den
  // ritas, med pr bildpunkter per dukens punkt. Duken läggs över just den delen, så att gänget står kvar
  // och rör sig i närbildens skärpa och resten av rummet inte kostar något. null: hela duken igen.
  // Allt görs före nästa bild, så att duken aldrig hinner visas tom.
  let NARA = null;
  let prNu = PR;
  const T0 = parseFloat(getComputedStyle(canvas).top) || 0;
  function narbild(ruta) {
    if (!ruta && !NARA) return;
    if (ruta) {
      // (längsta sidan högst 2880 bildpunkter)
      const pr = Math.min(ruta.pr, 2880 / Math.max(ruta.w, ruta.h));
      NARA = Object.assign({}, ruta, { pr });
      cam.setViewOffset(FW, H, L0 - (800 - FW / 2) + ruta.x, ruta.y, ruta.w, ruta.h);
      r.setPixelRatio(pr);
      r.setSize(ruta.w, ruta.h, false);
      Object.assign(canvas.style, { left: `${L0 + ruta.x}px`, top: `${T0 + ruta.y}px`, width: `${ruta.w}px`, height: `${ruta.h}px` });
      radioFin(ruta.bred * (RM.W * RM.SK) / W);
    } else {
      NARA = null;
      cam.setViewOffset(FW, H, L0 - (800 - FW / 2), 0, W, H);
      r.setPixelRatio(prNu);
      r.setSize(W, H, false);
      for (const k of ['left', 'top', 'width', 'height']) canvas.style.removeProperty(k);
    }
    cam.updateMatrixWorld();
    r.render(scene, cam);
    if (opt.rita) opt.rita();
  }
  // Radions delar sedda ur kameran (utan musens vridning): radioRuta i dukens punkter (det kameran siktar
  // på), radioDelar som andelar av duken ([vänster, topp, höger, botten]), radioP var på skalan punkten
  // (nx, ny) i duken (−1…1) är.
  const rVek = new THREE.Vector3();
  function rProj(box) {
    const K = RADIO.k.matrixWorld;
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    for (const [x, y] of [[box[0], box[1]], [box[2], box[1]], [box[0], box[3]], [box[2], box[3]]]) {
      rVek.set(x, y, box[4] ?? RM.F).applyMatrix4(K).project(cam);
      x0 = Math.min(x0, rVek.x); x1 = Math.max(x1, rVek.x);
      y0 = Math.min(y0, rVek.y); y1 = Math.max(y1, rVek.y);
    }
    return [(x0 + 1) / 2, (1 - y1) / 2, (x1 + 1) / 2, (1 - y0) / 2];
  }
  function radioRuta() {
    const a = pivot.rotation.x;
    const b = pivot.rotation.y;
    pivot.rotation.set(0, 0, pivot.rotation.z);
    scene.updateMatrixWorld(true);
    cam.updateMatrixWorld();
    const fram = rProj([-RM.W / 2, -0.5, RM.W / 2, RM.H + 7.5]);
    const bak = rProj([-RM.W / 2, -0.5, RM.W / 2, RM.H + 7.5, -RM.F]);
    const [x0, y0, x1, y1] = [Math.min(fram[0], bak[0]), Math.min(fram[1], bak[1]), Math.max(fram[2], bak[2]), Math.max(fram[3], bak[3])];
    pivot.rotation.x = a;
    pivot.rotation.y = b;
    return { x: x0 * W, y: y0 * H, w: (x1 - x0) * W, h: (y1 - y0) * H };
  }
  function radioDelar() {
    scene.updateMatrixWorld(true);
    cam.updateMatrixWorld();
    const ruta = (x, y, w, h) => rProj([x - w / 2, y - h / 2, x + w / 2, y + h / 2, RM.F + 0.8]);
    const R0 = RM.ratt;
    const K0 = RM.kraft;
    const B0 = RM.bspak;
    const S0 = RM.skena;
    const d = 2 * R0.r + 1.2;
    return {
      kropp: rProj([-RM.W / 2, 0, RM.W / 2, RM.H, RM.F]),
      skala: rProj([RM.sx0 - 1.5, RM.ta[0], RM.sx1 + 1.5, RM.tf[1], RM.F + 0.4]),
      // (skenan, och kulan som hänger ner framför fronten)
      spak: rProj([RM.sx0 - 2.5, S0.y - 5, RM.sx1 + 2.5, S0.y + 1.05, RM.F + 0.4]),
      vol: ruta(R0.x, R0.y, d, d),
      kraft: ruta(K0.x, K0.y, K0.w + 0.7, K0.h + 0.7),
      band: ruta(B0.x, B0.y, B0.w, B0.h),
    };
  }
  const rPlan = new THREE.Plane();
  function radioP(nx, ny) {
    scene.updateMatrixWorld(true);
    cam.updateMatrixWorld();
    ray.setFromCamera(new THREE.Vector2(nx, ny), cam);
    const K = RADIO.k.matrixWorld;
    const o = new THREE.Vector3(0, 0, RM.F + 0.5).applyMatrix4(K);
    const n = new THREE.Vector3(0, 0, 1).transformDirection(K);
    rPlan.setFromNormalAndCoplanarPoint(n, o);
    const u = ray.ray.intersectPlane(rPlan, new THREE.Vector3());
    if (!u) return RL.p;
    u.applyMatrix4(delInv.copy(K).invert());
    return Math.min(1, Math.max(0, (u.x - RM.sx0) / (RM.sx1 - RM.sx0)));
  }

  function kval({ pr = 1, skugga = 1, detalj = 1, enkel = false } = {}) {
    if (enkel && !Q.enkel) enkeltLjus();
    if (detalj !== DET) {
      DET = detalj;
      for (const o of figs) o.key = null;
      ute(vNu);
    }
    const p = Math.max(0.75, Math.min(PR, PR * pr));
    if (p !== prNu) {
      prNu = p;
      if (!NARA) {
        r.setPixelRatio(p);
        r.setSize(W, H, false);
      }
    }
    Q.skugga = skugga;
    r.shadowMap.autoUpdate = skugga <= 1;
    r.shadowMap.needsUpdate = true;
  }

  // Material och texturer från figurer som har byggts om (hår, halsduk,
  // tatuering ... en bit över 10 MB per gång). De släpps när de nya har ritats:
  // annars kastas shaderprogrammen som de nya ska använda, och de måste
  // kompileras om. (ansiktena, tex, och det de nya figurerna delar står kvar)
  const ombyggda = [];
  function slappOmbyggda() {
    const matOf = (x) => (Array.isArray(x.material) ? x.material : x.material ? [x.material] : []);
    const texOf = (m) => Object.values(m).filter((v) => v && v.isTexture);
    const kvar = new Set(Object.values(tex));
    for (const o of figs) {
      o.fig.traverse((x) => {
        for (const m of matOf(x)) {
          kvar.add(m);
          for (const t of texOf(m)) kvar.add(t);
        }
      });
    }
    for (const f of ombyggda.splice(0)) {
      f.traverse((x) => {
        for (const m of matOf(x)) {
          for (const t of texOf(m)) if (!kvar.has(t)) t.dispose();
          if (!kvar.has(m)) m.dispose();
        }
      });
    }
  }

  // ---------- vädret ----------

  // Ljuset från fönstret efter dagsljuset ute (rum-ute.js), och kläderna:
  // den vars kläder (dress) har ändrats byggs om, och röken följer med.
  let hemiDag = 0.42;
  let vNu = opt.vader;
  // det som hör till högtiden på bordet (nyår: konfetti och serpentiner)
  let bordFest = { namn: undefined, g: null };
  function ute(v) {
    vNu = v;
    const fest = festen(v);
    if (fest !== bordFest.namn) {
      if (bordFest.g) { bord.remove(bordFest.g); bordFest.g.traverse((x) => { if (x.geometry) x.geometry.dispose(); }); }
      bordFest = { namn: fest, g: FEST.bord(fest, BORD.r) };
      if (bordFest.g) bord.add(bordFest.g);
    }
    const L = v && window.RumUte ? window.RumUte.light(v) : null;
    const dag = L ? L.dag : 0;
    win.color.set('#ffb35c').lerp(new THREE.Color(L ? L.sky[2] : '#ffb35c'), dag);
    // på kvällen lyser neonen dem bakifrån (ljusKlockan i rum.js)
    const kv = 1 - Math.min(1, Math.max(0, (dag - 0.12) / 0.33));
    win.color.lerp(new THREE.Color('#ff5a48'), 0.55 * kv);
    win.intensity = 0.35 + 1.7 * dag + 0.25 * kv;
    hemiDag = 0.42 + 0.2 * dag;
    hemi.intensity = hemiDag;
    figs.forEach((o, i) => {
      const D = dress(o.F.key, v);
      if (JSON.stringify(D) === o.key) return;
      root.remove(o.fig);
      o.fig.traverse((x) => { if (x.geometry) x.geometry.dispose(); });
      ombyggda.push(o.fig);
      figs[i] = Object.assign(klar(build(o.F, D)), { inneAt: o.inneAt });
    });
    for (const sk of smokers) {
      const o = figs.find((x) => x.F === sk.o.F);
      if (o === sk.o) continue;
      sk.A = o.arms[sk.o.arms.indexOf(sk.A)];
      sk.o = o;
    }
    for (const p of puffs) p.born.clear();
  }
  ute(opt.vader);

  // Vem som har lämnat in ({ dl: true, dt: false, … }; den som saknas är
  // inne) och klockan t. Första gången sitter var och en som det är; den som
  // blir inne sedan lägger ifrån sig kupongen och tar ölen eller cigaretten.
  let told = false;
  function inne(vem, t) {
    for (const o of figs) {
      const v = vem[o.F.key] !== false;
      if (!v) o.inneAt = Infinity;
      else if (!told) o.inneAt = -1e9;
      else if (o.inneAt === Infinity) o.inneAt = t;
    }
    told = true;
  }

  // Matcherna och spelstoppet ({ tv, nag }): första gången som det är, sedan
  // vänder de sig mot tv:n (eller tillbaka) på en stund.
  let toldTv = false;
  function lage(x, t) {
    const on = Boolean(x && x.tv);
    if (on !== S.tv) {
      S.tvFrom = toldTv ? tvW(t) : on ? 1 : 0;
      S.tvAt = toldTv ? t : -1e9;
      S.tv = on;
    }
    S.nag = Math.max(0, Math.min(1, (x && x.nag) || 0));
    const av = x && x.avspark > 0 ? t + x.avspark * 3600 : Infinity;
    if (av !== AV.t && !(Math.abs(av - AV.t) < 60)) { AV.fran = AV.t; AV.at = t; AV.t = av; }
    toldTv = true;
  }
  // Ett mål ({ dl: 1, dt: -1, dj: 0 }): rätt, fel eller ingen skillnad – och
  // på vilket av de tre sätten var och en reagerar (sätt, { dl: 0|1|2 };
  // annars efter tiden, olika för var och en).
  function mal(vem, t, satt = {}) {
    for (const k of Object.keys(vem || {})) {
      const key = k.toLowerCase();
      const v = Number(satt[k] ?? satt[key]);
      M[key] = { k: Math.sign(vem[k]), at: t, v: [0, 1, 2].includes(v) ? v : Math.floor(hash(t * 1.37 + FIGS.findIndex((F) => F.key === key) * 7.1) * 3) };
    }
    // (och sedan sjunger de, om målet gick någons väg)
    malSang(vem, t);
  }
  // Radion på fönsterbänken (pa: på eller av, från t): gänget sjunger så länge
  // den är på (radioSang), och den lyser och spelar (radioRita).
  function radio(pa, t) {
    const R = SJUNG.radio;
    if (Boolean(pa) === R.pa) return;
    R.pa = Boolean(pa);
    R.at = t;
    if (R.pa) {
      R.fran = t;
      R.till = Infinity;
      RADIO_K.clear();
    } else R.till = t;
  }

  // Hur det går för gängets kupong ({ lage: 'glad' | 'nerv' | 'deppig' | null,
  // rank: { dl: 1, dj: -1 }, ansikte }): första gången som det är, sedan glider
  // humöret över på 2,5 sekunder; påhittet som pågår gör färdigt sitt.
  // Ansiktena följer läget, eller ansikte när allt är spelat (ansikten).
  let toldSpel = false;
  function spel(x, t) {
    const lage = x && ['glad', 'nerv', 'deppig'].includes(x.lage) ? x.lage : null;
    const rank = {};
    for (const [k, v] of Object.entries((x && x.rank) || {})) if (Math.sign(v)) rank[k.toLowerCase()] = Math.sign(v);
    if (lage !== HUM.lage || !toldSpel) {
      HUM.fran = toldSpel ? HUM.lage : lage;
      HUM.at = toldSpel ? t : -1e9;
      HUM.lage = lage;
    }
    if (JSON.stringify(rank) !== JSON.stringify(HUM.rank) || !toldSpel) {
      HUM.rankFran = toldSpel ? HUM.rank : rank;
      HUM.rankAt = toldSpel ? t : -1e9;
      HUM.rank = rank;
    }
    toldSpel = true;
    ANS.spel = (x && x.ansikte) || lage;
    ansikten(ansiktsLage(ANS.spel, ANS.senast));
  }
  // Hur gängets senaste kupong gick (rum-folk.js, rum-uttryck.js LAGEN:
  // 'jublar' … 'deppig', null = inget att gå efter): ansiktena när ingen
  // omgång spelas som säger något annat (spel).
  function senast(x) {
    ANS.senast = x || null;
    ansikten(ansiktsLage(ANS.spel, ANS.senast));
  }
  // Ett påhitt (AKTER) som vem gör om och om igen från at, för bilder
  // (?rum-akt); utan namn som vanligt igen.
  function prova(vem, namn, at = 0) {
    const k = String(vem).toLowerCase();
    if (namn && AKTER[namn]) PROV[k] = { namn, at };
    else delete PROV[k];
    GA_T.clear();
    GA_N.clear();
  }

  // vem går iväg från t − l (för bilder, ?rum-ga): borta i fyra sekunder.
  function ga(vem, t, l = 0) {
    GAX.i = FIGS.findIndex((F) => F.key === String(vem).toLowerCase());
    GAX.t0 = t - l;
    GA_T.clear();
  }
  // Var vem pekar ([x, y, z] i världen, eller null): blicken går dit på en
  // halv sekund och tillbaka när man slutar peka.
  function pekar(vem, p, t) {
    const k = String(vem).toLowerCase();
    const x = PK[k] || (PK[k] = { p: new THREE.Vector3(), fran: new THREE.Vector3(), at: -1e9, on: false, w0: 0, wAt: -1e9 });
    const o = figs.find((f) => f.F.key === k);
    if (!o) return;
    const w = pekW(o, t);
    if (p) {
      const ny = v3(p);
      if (x.on && ny.distanceTo(x.p) < 1) return;
      x.fran.copy(w > 0.02 ? x.fran.clone().lerp(x.p, sm(x.at, x.at + 0.45, t)) : ny);
      x.p.copy(ny);
      x.at = t;
      if (!x.on) { x.w0 = w; x.wAt = t; x.on = true; }
    } else if (x.on) {
      x.w0 = w;
      x.wAt = t;
      x.on = false;
    }
  }
  // vem blev just den som fyller i kupongen (ett klick på sin figur,
  // rum-folk.js). Ett klick till medan det pågår gör ingenting.
  function vald(vem, t) {
    const k = String(vem).toLowerCase();
    if (VAL.k === k && t >= VAL.at && t - VAL.at < VAL_SLUT) return;
    VAL.k = k;
    VAL.at = t;
  }
  // Någon klickade på vem: ett tecken mot en, ett nytt varje gång (namn: vilket).
  // Den som sover vaknar inte men räcker upp tummen. Ett klick medan armen just
  // är på väg upp räknas inte, annars byter hen tecken direkt.
  function tecken(vem, t, namn) {
    const k = String(vem).toLowerCase();
    const o = figs.find((f) => f.F.key === k);
    if (!o) return;
    const g = teckenNu(o, t);
    if (g && g.T < 0.3) return;
    const val = namn && TECKEN[namn] ? namn : sovW(o, t) > 0.5 ? 'tumme' : nastaTecken();
    const A = g ? g.A : uOf(o, t) < 0.55 ? o.pen : fri(o);
    TK[k] = { namn: val, at: t, i: o.arms.indexOf(A), w0: g ? g.w : 0, fran: g ? { namn: g.x.namn, T: g.T } : null };
  }
  // Hur många rätt var och en håller upp ({ dl: { tal, ink, ner: ligger på bordet }, … }, null:
  // inget). Första gången sitter de så, sedan tas skylten upp från bordet på en stund. Med den yttre armen, så att
  // skylten inte hamnar framför grannen; den i mitten håller upp sin mellan huvudena, med en
  // eventuell cigarett i askkoppen så länge. Annars släpper den som röker inte cigaretten,
  // så båda händerna på skylten är inget för den.
  let lappSist = undefined;
  function lappar(x, t) {
    const k = JSON.stringify(x || null);
    if (k === lappSist) return;
    const forsta = lappSist === undefined;
    lappSist = k;
    for (const o of figs) {
      const key = o.F.key;
      const v = x && x[key];
      const g = LP[key];
      if (!v) {
        if (g && g.ut == null) g.ut = t;
        continue;
      }
      const ner = Boolean(v.ner);
      // (den som redan har sin skylt sitter kvar när någon annan lägger ner sin)
      if (g && g.ut == null) {
        g.tal = v.tal;
        g.ink = v.ink;
        lappVand(key, ner, t);
        continue;
      }
      const sida = o.F.plats === PLATSER[2] ? 1 : -1;
      const A = o.arms.find((a) => Math.sign(a.s) === sida) || o.arms[0];
      const plats = PLATSER.indexOf(o.F.plats);
      const andra = o.arms.find((a) => a !== A);
      const meny = LAPP_MENY[plats].filter((h) => !LAPP_HALL[h].lage(0).tva || !andra || andra.kind !== 'cigg');
      // (borta på de två sidorna: de har aldrig samma hållning samtidigt)
      LP[key] = { tal: v.tal, ink: v.ink, ner, p0: forsta && !ner ? 1 : 0, at: t, ut: null, i: o.arms.indexOf(A), meny, forst: Math.floor(KORS_FRO) + (plats === 2 ? 2 : 0) };
    }
  }
  // Vem lägger ner sin skylt eller tar upp den. Den som sover rör den inte, och ett klick på hen ska
  // inte ändra något i smyg. → om det blev så.
  function lappVand(vem, ner, t) {
    const k = String(vem).toLowerCase();
    const x = LP[k];
    const o = figs.find((f) => f.F.key === k);
    if (!x || !o || x.ut != null || sovW(o, t) > 0.5) return false;
    if (x.ner !== ner) {
      x.p0 = lappVag(x, t);
      x.at = t;
      x.ner = ner;
    }
    return true;
  }
  // Hur vem håller skylten och vad hen gör med den från at, för bilder (?rum-lapp).
  function lappProva(vem, hall, gor, at = 0) {
    const k = String(vem).toLowerCase();
    if (hall && LAPP_HALL[hall]) LPV[k] = { hall, gor: gor && LAPP_GOR[gor] ? gor : null, at };
    else delete LPV[k];
    if (LP[k]) LP[k].nu = null;
  }
  // Någon pekar på vem i gänget (ut = när hen slutade).
  function hej(vem, t, ut = Infinity) {
    const k = String(vem).toLowerCase();
    const h = HEJ[k];
    // pekar fortfarande, slutade peka, eller ett tryck medan det förra pågår
    if (h && h.ut === Infinity) {
      if (ut !== Infinity) h.ut = ut;
      return;
    }
    if (h && h.ut > t) {
      h.ut = ut === Infinity ? ut : Math.max(h.ut, ut);
      return;
    }
    HEJ[k] = { at: t, ut };
  }
  // Natten (lysröret släckt): första gången som det är, sedan på en stund.
  let toldNatt = false;
  function natt(on, t) {
    on = Boolean(on);
    if (on === N.on && toldNatt) return;
    N.fran = toldNatt ? nattW(t) : on ? 1 : 0;
    N.at = toldNatt ? t : -1e9;
    N.on = on;
    toldNatt = true;
  }
  // Vem i gänget syns i punkten (nx, ny) i duken (−1…1, y uppåt)?
  // (mot varje dels låda, inte dess trianglar: det är bara för att veta vem man
  // pekar på, och trianglarna tog 12–17 ms av huvudtråden var 60:e ms när musen
  // rörde sig över gänget)
  const ray = new THREE.Raycaster();
  const delRay = new THREE.Ray();
  const delInv = new THREE.Matrix4();
  const delPt = new THREE.Vector3();
  function under(nx, ny) {
    ray.setFromCamera(new THREE.Vector2(nx, ny), cam);
    let best = null;
    for (const o of figs) {
      // (den som går iväg klickar man igenom)
      if (o.st && o.st.w > 0.2) continue;
      o.fig.traverseVisible((x) => {
        if (!x.isMesh || !x.material || (x.material.transparent && !x.userData.lapp)) return;
        const g = x.geometry;
        if (!g.boundingBox) g.computeBoundingBox();
        delRay.copy(ray.ray).applyMatrix4(delInv.copy(x.matrixWorld).invert());
        if (!delRay.intersectBox(g.boundingBox, delPt)) return;
        const d = delPt.applyMatrix4(x.matrixWorld).distanceTo(ray.ray.origin);
        if (!best || d < best.d) best = { k: o.F.key, d };
      });
    }
    // (radion: klicket går fram till den, rum-folk.js)
    RADIO.traff.forEach((x) => {
      const g = x.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      delRay.copy(ray.ray).applyMatrix4(delInv.copy(x.matrixWorld).invert());
      if (!delRay.intersectBox(g.boundingBox, delPt)) return;
      const d = delPt.applyMatrix4(x.matrixWorld).distanceTo(ray.ray.origin);
      if (!best || d < best.d) best = { k: 'radio', d };
    });
    return best && best.k;
  }

  // Huvudets mitt för vem, i världen (när man pekar på någon i gänget).
  function huvud(vem) {
    const o = figs.find((f) => f.F.key === String(vem).toLowerCase());
    return o ? headIn(o).toArray() : null;
  }

  if (opt.enkel) enkelMaterial(scene);
  // Grafikprogrammen byggs i bakgrunden innan gänget ritas första gången: annars
  // står huvudtråden still medan grafikdrivern arbetar, och rummet svarar inte på
  // fingret så länge.
  try {
    await r.compileAsync(scene, cam);
  } catch (err) { /* då byggs de när gänget ritas, som förut */ }
  ANS.ute = true;
  return { draw, inne, ute, lage, mal, radio, radioPa: () => SJUNG.radio.pa, radioLage, radioEtiketter, radioSkriv, radioDetalj, narbild, radioRuta, radioDelar, radioP, spel, senast, uttryck: () => ANS.p, prova, ga, pekar, hej, vald, tecken, lappar, lappVand, lappProva, natt, efter, under, huvud, kval };
}
