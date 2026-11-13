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
// perspektiv). Musen flyttar kameran som ett öga, och bilden står still i
// djupet där radion och tomflaskorna står, så att de följer bakväggen och
// fönstret när rummet vrids (OGA_Z, sikta). Allt rör sig efter klockan t
// (sekunder): samma t ger samma bild, också röken, som räknas fram för varje
// rökbloss ur var glöden var när det föddes.
//
// Rörelserna är ojämna med flit (2026-11-12): huvudet följer bålen en aning senare, och DJ:s tofs
// och ändarna på DL:s halsduk släpar efter och svänger förbi (body, SLAP); de stora gesterna –
// måljublet, skålen, den som blir vald – tar sats och far förbi målet innan de sätter sig (fj);
// handen går i en båge med handleden strax efter (bage); vilans gungning upprepar sig inte (gung);
// och man blinkar när blicken flyttas (blickBlink). Allt är räkning i ställningarna: inga nya
// bilder eller lager, och två ritanrop till (halsdukens ändar).
// Inga slingor (2026-11-13): det som återkommer – klunken, blosset, en blick åt sidan, en nick, bort
// från tv:n en stund – kom förut på exakt samma sekund i varje varv (t % 22), lika fort och lika länge,
// och efter en stund såg man takten. Nu har varje varv sin egen stund för det, sin fart och ibland
// inget alls (vana, ibland), en klunk kan vara snabb eller två, ett bloss kort eller långt, och den
// som just har ett påhitt för sig tar klunken en annan stund (vanaNu). Påhitten börjar var som helst i
// sin lucka och går olika fort och olika långt (egen); bålen börjar och slutar dem en aning före
// armen och svänger förbi när den sätter sig (aktNu: wk och wh). DJ pratar med händerna i slag i
// stället för i en jämn åtta (pratSlag).
// Armarna går runt huvudena (2026-11-13): handen flyttas ut ur huvudet och armbågen vrids undan,
// så att armen inte går igenom det egna huvudet eller grannens när handen är uppe, bakom huvudet,
// vid ansiktet eller ute över bordet (huvudFri).
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
// gång, med en hand med riktiga fingrar. Den som sover vaknar i stället.
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
// öppen, skrattar), grälar medan den tredje tittar på, tittar upp på tv:n
// när någon pekar, eller sitter bara och har det lugnt (zen-stunderna, på fem
// sätt: andas med slutna ögon, dagdrömmer med händerna i nacken, blåser
// rökringar, vaggar sakta eller tittar ut i fjärran).
//
// Efter ett mål som gick någons väg sjunger de (malSang), och den som tappade
// raden sitter med armarna i kors. På fönsterbänken står en kassettradio: ett klick går
// fram till den (FM, AM och stationerna i rum-radio.js), och så länge den spelar musik
// dansar de (DANSER i rum-dans.js) och sjunger om vartannat (radioSang, radioNamn),
// med skyltarna på bordet; däremellan gungar var och en i takt på sitt sätt (radioGung).
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
// På natten (natt) är lysröret släckt. Mellan 22.30 och sju sover de (somn), var
// och en på sitt sätt och nästan stilla (sovStil): DL med huvudet bakåt och flaskan i
// famnen, DT med hakan mot bröstet och huvudet som sjunker och rycker till, och DJ
// med huvudet på armarna på bordet – med z:an som stiger i var och ens takt. Radion,
// matcherna eller ett klick på någon väcker dem (vakna), på ett av tre sätt: med ett
// ryck, sakta med en gäspning, eller bakfull med handen mot pannan och en
// återställare. Först är de groggy, sedan kommer de igång; efter en stund utan
// musik eller klick somnar de om.
// Under dagen gör de saker efter klockan (dygnet, DYGN_MENY): sträcker på sig och gäspar
// stort på morgonen, gnuggar ögonen och rullar på nacken, klappar sig på magen efter
// lunch, nickar till på eftermiddagen och gäspar med handen för munnen på kvällen – och
// sent på kvällen smittar gäspningen (gaspSmitta).
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
// prova(vem, påhitt, at), ga(vem, t, l), pekar(vem, [x, y, z] | null, t), spegel(vem | null, nx, ny, t),
// hej(vem, t, ut), vald(vem, t), tecken(vem, t, namn), lappar(vem, t), lappVand(vem, ner, t), lappProva(vem, hållning, gör, at), natt(på, t), somn(på, t),
// vakna(vem, t, sätt), efter({ lage, krona }), under(nx, ny), huvud(vem), topp(vem) }: neon säger om
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
// spegel att vem (din egen figur) tittar på markören i punkten (nx, ny, −1…1 i duken) en stund,
// null släpper,
// hej att man pekar på vem (ut = när man slutade, Infinity = pekar fortfarande),
// vald att vem just valdes som den som fyller i kupongen, tecken att man
// klickade på vem (namn: vilket tecken, annars nästa),
// natt hur släckt lysröret är (0–1), somn om gänget sover (22.30–07), vakna att vem väcktes
// vid t (för bilder; sätt 'ryck' | 'strack' | 'bakis'), efter dagen efter (lage 'bra' | 'illa' | null,
// krona = oraklen, 'dl' …), under vem i gänget (eller 'radio') som syns i punkten
// och kval({ pr, skugga, detalj }) hur fint gänget ritas (KVAL i rum.js; detalj
// också från början)
// (nx, ny, −1…1 i duken) eller null, huvud var vems huvud är och topp var i duken
// lappen ovanför vems huvud sitter (0–1).
import * as THREE from 'three';
import { utanSkuggor } from './rum-gpu.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ol } from './rum-fika.js';
import { festen, drakt, festklader } from './rum-fest.js';
import { TECKEN, LOS, blanda, nasta as nastaTecken, KORS, KORS_MENY, korsChans, LAPP_HALL, LAPP_GOR, LAPP_MENY, LAPP_GREPP, lappBlanda, lappKropp } from './rum-tecken.js';
import { uttryck, skaggUttryck, ansiktsLage } from './rum-uttryck.js';
import { DANSER, DANS_SLAG, DANS_IN, formen, dansLage, dansKropp, dansSjung, dansBlund, dansVarv, gung as dansGung, dansStil } from './rum-dans.js';
import { vaxter } from './rum-vaxter.js';

const DEG = Math.PI / 180;
const D = 1400;
const SILL = -168;
// Rummet vrids kring planet -330, där duken ligger, men fönsterbänken sitter på bakväggen i planet -600
// (rum.js), 270 bakom och 1400/2000 så stor på skärmen. Musen flyttar därför ögat (draw, sikta) så att
// bilden står still i djupet OGA_Z: då rör sig det som står på bänken (BANK_Z: radion och tomflaskorna,
// z 8–30) lika mycket som väggen bakom. Förut vreds gänget kring duken, så att radion och flaskorna
// gled upp till 15 px mot fönstret, löpsedlarna och bladet med stationerna.
const BANK_Z = 16;
const OGA_Z = BANK_Z + 270 * (1400 / 2000) * (D - BANK_Z) / D;
// Barbordet: runt, framför fönsterbänken, med skivan y över sitsarna
// (barstolarnas sitsar är i fönsterbänkens höjd, SILL).
const BORD = { x: -186, z: 250, r: 118, y: 32 };
// Pennkoppen på bordet (pennkopp): var den står i bordets axlar (x åt höger,
// z mot betraktaren) och bollens radie.
const KOPP = { x: -88, z: 30, r: 11 };
// Växterna (rum-vaxter.js): ampelliljan bakåt på fönsterbänkens vänstra ände
// (LILJA, i rummet), där inget annat står hur de än sitter (DJ:s tomflaskor står
// till höger om den) och ingen går förbi, och pilean fram till vänster på bordet
// (PILEA, i bordets axlar som KOPP), framför pennkoppen och vänster om tårtan:
// bordets enda fläck där varken huvudet på den som sover eller dunkar pannan i
// bordet, händerna, skyltarna eller tårtan kommer närmare växten än 13 (uppmätt
// i alla tre placeringarna).
const LILJA = { x: -535, z: -60 };
const PILEA = { x: -62, z: 84 };
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
// 0 → 1 över [a, b] som sm, men med ansats och överslag: först en aning åt fel håll (an), sedan förbi
// målet (ov) och tillbaka, framme vid a + FJ (b − a). Det ger tyngd åt de stora gesterna (målet,
// skålen, den som blir vald): sm och bump är lika mjuka i båda ändar, och då ser rörelsen styrd ut.
const FJ = 1.6;
const fj = (a, b, x, an = 0.06, ov = 0.1) => {
  const u = (x - a) / (b - a);
  if (u <= 0) return 0;
  if (u >= FJ) return 1;
  return sm(0.2, 1, u) - an * bump(u, 0, 0.14, 0.24, 0.5) + ov * bump(u, 0.55, 1, 1.02, FJ);
};
// Vilans gungning: två vågor i takter som inte går jämnt upp i varandra (det gyllene snittet), så
// att slingan aldrig kommer tillbaka likadan. Som Math.sin, och högst 1.
const gung = (x) => 0.62 * Math.sin(x) + 0.38 * Math.sin(x * 1.618 + 1.9);
// mjuk gräns: x nära noll, aldrig över m
const grans = (x, m) => m * Math.tanh(x / m);
// Det som återkommer, i varv om per sekunder: förut på samma sekund i varje varv (bump(t % per, …)),
// lika fort varje gång. Här har varje varv sin egen stund: var i varvet det börjar, hur fort det går
// (s, 0,85–1,2 av len) och ibland (hoppa) inte alls – och ett tal v för hur just den gången är. Bara
// ur klockan (hash per varv, fro skiljer vanorna åt), så samma t ger fortfarande samma bild.
function vana(t, per, fro, len, hoppa = 0.12) {
  const n = Math.floor(t / per);
  const s = 0.85 + 0.35 * hash(n * 1.37 + fro);
  const t0 = n * per + hash(n * 2.71 + fro + 0.5) * Math.max(0, per - len * s - 0.3);
  const l = (t - t0) / s;
  if (l < 0 || l >= len || hash(n * 4.13 + fro + 0.25) < hoppa) return null;
  return { l, n, t0, s, v: hash(n * 5.93 + fro + 0.75) };
}
// som bump(t % per, a, b, c, d), fast i sin egen stund i varje varv och lite olika långt (amp)
function ibland(t, per, fro, a, b, c, d, amp = 0.3, hoppa = 0.12) {
  const x = vana(t, per, fro, d - a, hoppa);
  return x ? bump(x.l + a, a, b, c, d) * (1 - amp * x.v) : 0;
}

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

// Prasseloverallerna (2026-11-11, användarens val): utom när det är hett har
// gänget glansiga träningsoveraller från 90-talet – jacka med hög krage och
// dragkedja och byxor i samma tyg, mönstret över jackan och ärmarna och
// kragen, muddarna och fållen i mönstrets färg. Var och en har tre som byts
// varje dag (dagen i Stockholm, räknat från den 25 oktober 2026 som
// placeringen), och samma dag har alla tre olika mönster: sicksack (två
// sicksackband över bröstet och en rand under), sned (ett brett fält snett över
// bröstet), axel (oket över axlarna i en annan färg och en rand under) och
// trianglar (splitter över bröstet). c: [jackan och byxorna, mönstret,
// randen, byxornas fåll]. ?rum-overall=0|1|2 för bilder.
const OVERALLER = {
  dl: [
    { m: 'sned', c: ['#c8264a', '#1d2b6b', '#f2efe6', '#931a36'] },
    { m: 'sicksack', c: ['#0e7d8a', '#4b2a86', '#f0487a', '#0a5a64'] },
    { m: 'trianglar', c: ['#5b2a86', '#18b2a4', '#f5d33a', '#3f1c60'] },
  ],
  dt: [
    { m: 'sicksack', c: ['#1f4fb8', '#f1ede2', '#d3263a', '#163a88'] },
    { m: 'axel', c: ['#1b2550', '#2f74d0', '#f2c033', '#121a3a'] },
    { m: 'sned', c: ['#2456b8', '#121c3a', '#e9e4d6', '#173f8c'] },
  ],
  dj: [
    { m: 'trianglar', c: ['#1a5cab', '#f3f0e8', '#e8762c', '#123f78'] },
    { m: 'sned', c: ['#151619', '#e0287a', '#21b6c8', '#0b0c0e'] },
    { m: 'sicksack', c: ['#26244a', '#14a49a', '#f2c033', '#1b1a36'] },
  ],
};
// det glansiga tyget (jackan och byxorna)
const PRASSEL = { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 };
function overallNr(v) {
  const q = new URLSearchParams(location.search).get('rum-overall');
  let n = Number(q);
  if (q == null || !Number.isFinite(n)) {
    const [ar, man, dag] = v ? [v.ar, v.manad, v.dag] : fDag.format(Date.now()).split('-').map(Number);
    n = Math.round((Date.UTC(ar, man - 1, dag) - Date.UTC(2026, 9, 25)) / 864e5);
  }
  return ((Math.floor(n) % 3) + 3) % 3;
}

// Kläderna efter vädret i Stockholm (v = Vader.nu(), via rum.js): känns-
// temperaturen avgör – 0 hett (21° och mer), 1 varmt (15–21), 2 svalt (8–15),
// 3 kallt (1–8), 4 vinter (under 1) – sol ger solglasögonen på näsan och
// snöfall snö på axlarna. När det är hett har de t-tröja och shorts (DT
// jeansshorts), annars overallerna (OVERALLER), med jackan öppen över
// t-tröjan när det är varmt och stängd annars. DT kavlar alltid upp ärmen på
// armen med lejonet. Runt högtiderna (fest, rum-fest.js) har de något på
// huvudet, och vid jul, lucia och nyår andra kläder (drakt). Jackorna efter
// vädret (fältjacka, skinnjacka, flanellskjorta, dunjackor, parkas och
// regnjackor) togs bort med overallerna 2026-11-11; tygerna finns kvar i
// jackMat.
//   ben: kort|lang, byxa: [färg, mörkare], troja: { farg, farg2, luva, ficka,
//            jul (jultröjan), skjorta (med fluga), upp: lejon },
//   jacka: { typ: oppen|stangd, tyg: bomull|skinn|dun|parka|regn|flanell|sammet|prassel,
//            farg, farg2, luva: slat|pals, krage, tjock, tunn, upp: lejon|bada,
//            monster, c (overallens mönster och färger) },
//   prassel: byxorna i overallens tyg,
//   fest: lucia|jul|nyar|pask|midsommar
function dress(key, v) {
  const k = v ? v.kanns : 17;
  const n = k >= 21 ? 0 : k >= 15 ? 1 : k >= 8 ? 2 : k >= 1 ? 3 : 4;
  const d = { n, ben: n <= 1 ? 'kort' : 'lang', glas: !!v && !v.fall && v.sol > 8 && v.moln < 45, sno: !!v && v.fall === 'sno' && n >= 3 };
  const fest = festen(v);
  if (n >= 1 && fest !== 'jul' && fest !== 'lucia' && fest !== 'nyar') {
    const O = OVERALLER[key][overallNr(v)];
    d.ben = 'lang';
    d.prassel = true;
    d.byxa = [O.c[0], O.c[3]];
    d.jacka = { typ: n === 1 ? 'oppen' : 'stangd', tyg: 'prassel', farg: '#ffffff', farg2: O.c[1], krage: true, monster: O.m, c: O.c, ...(key === 'dt' ? { upp: 'lejon' } : {}) };
  }
  // högtiderna (rum-fest.js): vid jul, lucia och nyår byter de om
  if (fest) { d.fest = fest; drakt(key, d); }
  return d;
}

export async function figurer(canvas, opt = {}) {
  const W = canvas.clientWidth || 1440;
  const H = canvas.clientHeight || 560;
  // i telefonen färre bildpunkter och mindre skuggkartor,
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
  // (kantutjämning efter vad enheten klarar, kantutjamning i rum.js)
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: opt.kant !== false });
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
  // Ögat, där betraktaren står (OGA: gänget tittar dit, looks), flyttas efter musen (draw), och bilden
  // förskjuts så att djupet OGA_Z står kvar (en bit av en större bild, som när duken inte är mitt i).
  // Ljuset står kvar, som när man själv rör sig: förut vreds gänget och skuggorna mot lamporna. NARA är
  // den del av duken som ritas i närbilden av radion (narbild), annars hela duken.
  const OGA = new THREE.Vector3(0, 0, D);
  let NARA = null;
  function sikta() {
    const k = D / (D - OGA_Z);
    const [x, y, w, h] = NARA ? [NARA.x, NARA.y, NARA.w, NARA.h] : [0, 0, W, H];
    cam.position.copy(OGA);
    cam.setViewOffset(FW, H, L0 - (800 - FW / 2) + x - OGA.x * k, y + OGA.y * k, w, h);
    cam.updateMatrixWorld();
  }
  sikta();

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

  const root = new THREE.Group();
  scene.add(root);

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
  // sitter i skägget (skaggSkratt). Ett ansikte utan ögonvitor skrattar redan (null) – utom
  // när munnen ska bytas (gäspningen, GASP_MUN). Skrattrynkorna vid munnen bara med rynk.
  const MUN = (d) => `<path d="${d}" fill="#4a1712"/><clipPath id="skr-m"><path d="${d}"/></clipPath>`;
  function skrattar(svg, mun) {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const vitor = [...doc.querySelectorAll('path[fill="#f7f1ea"]')];
    if (!vitor.length && !mun) return null;
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
      ny += MUN(mun.d) + `<g clip-path="url(#skr-m)"><path d="${mun.tander}" fill="#f4efe6"/><ellipse cx="0" cy="${mun.tunga}" rx="${mun.tungaR || 9}" ry="4" fill="#a8473f"/></g>`
        + (mun.rynk === false ? '' : `<path d="M-13 21 Q-24 26 -27 37 M13 21 Q24 26 27 37" fill="none" stroke="#b06e5c" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/>`);
    }
    doc.documentElement.insertAdjacentHTML('beforeend', ny);
    return new XMLSerializer().serializeToString(doc);
  }
  // DL:s leende byts mot ett skratt i samma storlek
  const SKRATT_MUN = {
    dl: { bort: '#6b2a24', lapp: '#8a3c33', klipp: 'mdl', d: 'M-20 33 Q0 38 20 33 Q17 52 0 55 Q-17 52 -20 33 Z', tander: 'M-21 32 Q0 37 21 32 L21 40 Q0 45 -21 40 Z', tunga: 50 },
  };
  // Gäspningen (gaspW): ögonen hopknipna som i skrattet och munnen som ett avlångt O,
  // med en rad tänder överst och tungan längst ner – DT med sina egna stängda ögon, och
  // DJ:s mun i skägget (skaggGasp).
  const GASP_O = (b, h, y) => `M${-b} ${y + h * 0.36} Q${-b} ${y} 0 ${y} Q${b} ${y} ${b} ${y + h * 0.36} Q${b} ${y + h * 0.97} 0 ${y + h} Q${-b} ${y + h * 0.97} ${-b} ${y + h * 0.36} Z`;
  const GASP_TAND = (b, y) => `M${-b - 1} ${y - 1} L${b + 1} ${y - 1} L${b + 1} ${y + 3.5} Q0 ${y + 5.5} ${-b - 1} ${y + 3.5} Z`;
  const GASP_MUN = {
    dl: { bort: '#6b2a24', lapp: '#8a3c33', klipp: 'mdl', d: GASP_O(11, 30, 30), tander: GASP_TAND(11, 30), tunga: 57, tungaR: 6.5, rynk: false },
    dt: { bort: '#45150f', lapp: '#b5604f', klipp: 'mdt', d: GASP_O(13, 33, 30), tander: GASP_TAND(13, 30), tunga: 60, tungaR: 7.5, rynk: false },
  };
  function skaggGasp(svg) {
    const d = GASP_O(9.5, 26, 29);
    return svg.replace('</svg>', `${MUN(d)}<g clip-path="url(#skr-m)"><path d="${GASP_TAND(9.5, 29)}" fill="#f1ebe0"/><ellipse cx="0" cy="52" rx="6" ry="3.2" fill="#9c4038"/></g></svg>`);
  }
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
    // Fårorna är mindre än en bildpunkt där gänget står, men som trianglar var
    // de 92 000 per frisyr – med skuggorna 39 % av allt som ritades i rummet.
    // Formen räknas därför två gånger: fint (NF × MF), bara för att baka hur
    // ytan lutar och hur mörk den är i fårorna till en liten bild (harBak), och
    // grovt (N × M), det som ritas: testarna syns i konturen, fårorna i bilden.
    const NF = LATT ? 360 : 480;
    const MF = LATT ? 72 : 96;
    // (fler runt huvudet än uppåt: luggens spetsar sitter i kanten)
    const N = LATT ? seg(180, 96) : seg(240, 120);
    const M = LATT ? seg(20, 10) : seg(28, 14);
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
    const rutnat = (N, M) => {
    const pos = [];
    const uv = [];
    const col = [];
    const idx = [];
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
    g.setIndex(idx);
    g.computeVertexNormals();
    return { g, col };
    };
    // den fina formen som bild: ytans riktning (i hårets egna axlar) i rött,
    // grönt och blått, mörkheten i fårorna i genomskinligheten; en bildpunkt
    // per hörn, kolumnerna runt huvudet och raderna från hjässan till kanten
    const fin = rutnat(NF, MF);
    const fn = fin.g.attributes.normal.array;
    const bw = NF + 1; const bh = MF + 1;
    const data = new Uint8Array(bw * bh * 4);
    for (let i = 0; i < bw; i++) {
      for (let j = 0; j < bh; j++) {
        const v = i * bh + j; const o = (j * bw + i) * 4;
        for (let k = 0; k < 3; k++) data[o + k] = Math.round((fn[v * 3 + k] * 0.5 + 0.5) * 255);
        data[o + 3] = Math.round(Math.min(1, fin.col[v * 3]) * 255);
      }
    }
    fin.g.dispose();
    const bak = new THREE.DataTexture(data, bw, bh, THREE.RGBAFormat);
    bak.minFilter = bak.magFilter = THREE.LinearFilter;
    bak.channel = 1;
    bak.needsUpdate = true;
    // det grova håret, med var varje hörn ligger i den bilden (uv1)
    const { g } = rutnat(N, M);
    const uv1 = [];
    for (let i = 0; i <= N; i++) for (let j = 0; j <= M; j++) uv1.push((i / N * NF + 0.5) / bw, (j / M * MF + 0.5) / bh);
    g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1, 2));
    g.userData.bak = bak;
    return g;
  }
  // Hårets material läser den bakade bilden (hairGeo): riktningen ersätter den
  // grova ytans (three: normalMap i föremålets axlar), mörkheten läggs på färgen
  // som förut färgen per hörn. Med en sådan bild hoppar three över bumpkartan
  // (stråna i hairTex) och låter lacken följa den grova ytan – båda läggs
  // tillbaka här, så att håret blänker i fårorna som när de var trianglar.
  function harBak(sh) {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\n\tdiffuseColor.rgb *= texture2D( normalMap, vNormalMapUv ).a;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n\tvec3 harN = normal;\n\t#ifdef USE_BUMPMAP\n\t\tnormal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );\n\t#endif')
      .replace('#include <clearcoat_normal_fragment_begin>', '#include <clearcoat_normal_fragment_begin>\n\t#ifdef USE_CLEARCOAT\n\t\tclearcoatNormal = harN;\n\t#endif');
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
    function fringe(e, cols, parent) {
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
    // Varje ände är en egen del med leden där den kommer fram under varvet, så att den kan svänga ut
    // från bröstet (duk, body): leden står i ändens första punkt, och det som hänger i den ritas i
    // bröstets axlar som förut (inre).
    const duk = [];
    for (const [e, len] of [[A, 'A'], [Bn, 'B']]) {
      const led = new THREE.Group();
      led.position.copy(e.pts[0]);
      parent.add(led);
      const inre = new THREE.Group();
      inre.position.copy(e.pts[0]).negate();
      led.add(inre);
      duk.push(led);
      const g = band(e.pts, e.nrm, W, TH);
      const L = g.userData.len;
      const tx = len === 'A'
        ? scarfTex(L, W, C.vit, [...at(L - 10.5), ...at(L - 53)], [L - 40.5, L - 13, F.halsduk.text, C.bla])
        : scarfTex(L, W, C.vit, [...at(L - 10.5), ...at(L - 37)], null, [L - 26, L - 10.5, skold[F.key]]);
      tx.repeat.x = 1 / L;
      mesh(g, wool(tx), inre);
      fringe(e, [C.rod, C.vit, C.bla], inre);
    }
    parent.userData.duk = duk;
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
    // (tofsen släpar efter huvudet, body: var den sitter i vila)
    pom.userData.hem = pom.position.clone();
    parent.userData.tofs = pom;
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
      // (handens mitt, som armarna runt huvudet prövar: huvudFri)
      g.userData.mitt = new THREE.Vector3(0, 0, r0 + q * 0.45);
    } else {
      ellipsoid([0, q * 1.1, 0], [q * 0.62, q * 1.3, q * 1.05], skin, g);
      ellipsoid([-q * 0.12, q * 2.25, 0], [q * 0.55, q * 0.95, q * 0.98], skin, g, [0, 0, 0.25]);
      capsule([q * 0.15, q * 0.7, -q * 0.75], [q * 0.4, q * 1.7, -q * 1.02], q * 0.36, skin, g);
      g.userData.wrist = new THREE.Vector3(0, 0, 0);
      g.userData.mitt = new THREE.Vector3(0, q * 1.4, 0);
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
    g.userData = { wrist: new THREE.Vector3(0, 0, 0), mitt: new THREE.Vector3(0, q * 1.1, 0), fing, tum, s };
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
  // Overallens mönster på en duk per mönster och färger: u går runt kroppen med
  // mitten fram i 0 (och 1), v från fållen upp till kragen, och duken vänds, så
  // att bröstet ligger ungefär vid y 45–105 av 256. Det som korsar kanten ritas
  // också på andra sidan, så att det inte blir någon söm mitt fram.
  const prasselDukar = new Map();
  function prasselTex(J) {
    const k = J.monster + J.c.join();
    if (prasselDukar.has(k)) return prasselDukar.get(k);
    const [bas, m1, m2] = J.c;
    const t = canvasTex(512, 256, (g, w) => {
      g.fillStyle = bas;
      g.fillRect(0, 0, w, 256);
      // ett band mellan två kanter y(x) och y(x) + tjock
      const falt = (y, tjock, col) => {
        g.fillStyle = col;
        g.beginPath();
        for (let x = 0; x <= w; x += 8) g.lineTo(x, y(x));
        for (let x = w; x >= 0; x -= 8) g.lineTo(x, y(x) + tjock);
        g.closePath();
        g.fill();
      };
      if (J.monster === 'sicksack') {
        const sick = (y0, a) => (x) => y0 + a * (2 * Math.abs(((x / 64) % 2) - 1) - 1);
        falt(sick(52, 16), 34, m1);
        falt(sick(86, 16), 34, m2);
        falt(() => 120, 6, m1);
      } else if (J.monster === 'sned') {
        // snett fram (och åt andra hållet bak)
        const sned = (y0) => (x) => y0 + 34 * Math.sin(2 * Math.PI * x / w);
        falt(sned(50), 40, m1);
        falt(sned(96), 8, m2);
      } else if (J.monster === 'axel') {
        falt(() => 0, 62, m1);
        falt(() => 66, 9, m2);
      } else {
        for (let i = 0; i < 28; i++) {
          const x0 = hash(i * 3.1 + 1) * w;
          const y0 = 44 + hash(i * 5.7 + 2) * 76;
          const r = 14 + hash(i * 2.3 + 3) * 16;
          const a = hash(i * 7.9 + 4) * 6.28;
          g.fillStyle = i % 2 ? m1 : m2;
          for (const dx of [-w, 0, w]) {
            g.beginPath();
            for (let j = 0; j < 3; j++) {
              const rr = r * (0.75 + 0.5 * hash(i * 11.3 + j));
              g.lineTo(x0 + dx + Math.cos(a + j * 2.094) * rr, y0 + Math.sin(a + j * 2.094) * rr);
            }
            g.closePath();
            g.fill();
          }
        }
      }
    });
    prasselDukar.set(k, t);
    return t;
  }
  // jackans tyg: matt bomull och parkas, blankt skinn, glänsande nylon (dun, regn, overallen), rutig
  // flanell, sammet (nyårskavajen)
  function jackMat(J, extra = {}) {
    const o = {
      bomull: { roughness: 0.62, clearcoat: 0.3, bumpMap: denim, bumpScale: 0.5 },
      parka: { roughness: 0.72, clearcoat: 0.25, bumpMap: knit, bumpScale: 0.4 },
      skinn: { roughness: 0.32, clearcoat: 0.75, clearcoatRoughness: 0.28, bumpMap: knit, bumpScale: 0.25 },
      dun: { roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.16 },
      regn: { roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 },
      prassel: { ...PRASSEL, map: J.c ? prasselTex(J) : null },
      flanell: { roughness: 0.82, clearcoat: 0.12, sheen: 0.5, sheenRoughness: 0.7, map: plaid(5, 3) },
      sammet: { roughness: 0.8, clearcoat: 0.05, sheen: 1, sheenRoughness: 0.35, bumpMap: knit, bumpScale: 0.15 },
    }[J.tyg] || {};
    return mat(J.farg, { side: J.typ === 'oppen' ? THREE.DoubleSide : THREE.FrontSide, ...o, ...extra });
  }
  const edgeMat = (J) => mat(J.farg2, { roughness: J.tyg === 'regn' || J.tyg === 'prassel' || J.tyg === 'dun' || J.tyg === 'skinn' ? 0.28 : 0.62, clearcoat: 0.5 });
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
  // färgen i hörnen: pennkoppen och växterna (samma material, så att växterna
  // inte kostar en egen shader)
  const FARGER = mat('#ffffff', { vertexColors: true, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  bord.add(pennkopp());
  // Växterna: båda i en geometri, ett ritanrop (rum-vaxter.js).
  mesh(vaxter(new THREE.Vector3(LILJA.x, SILL, LILJA.z), new THREE.Vector3(BORD.x + PILEA.x, SILL + BORD.y, BORD.z + PILEA.z)), FARGER, root);

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
    mesh(pg, FARGER, g);
    return g;
  }

  // ---------- radion ----------
  // En kassettradio (80-tal) på fönsterbänkens högra ände, under löpsedlarna (RADIO_PLATS): där står
  // inget annat hur de än sitter (DJ:s tomflaskor står till vänster om den). Ett klick går fram till
  // den (sak i rum.js), och där ställer man in FM och AM (rum-radio.js, som säger vad som gäller med
  // radioLage). Stationsskalan lyser med en glödlampa, stationsspaken sitter på samma ställe som visaren
  // under skalan, bandspaken slår över mellan FM och AM, POWER-knappen går in, lysdioderna och högtalarna
  // följer det som hörs och alla stationer står för hand på maskeringstejpen vid skalan
  // (radioEtiketter). Så länge det är musik sjunger gänget (radioSang) och noter stiger ur
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
  // Tejpen vid skalan: FM ovanför, AM under, med stationerna för hand. Ett namn står närmast skalan, mitt
  // över sin frekvens, och bara när det inte får plats där i raden längre ut (tejpPlats). Frekvenserna står
  // på lappen bredvid radion (rum-radio.js), och ett tryck på ett namn går dit (radioEtikett, TEJP.hit).
  const TEJP = { rutor: { fm: [], am: [] }, hit: { fm: [], am: [] } };
  function tejpPlats(band, c, w, h) {
    const l = TEJP.rutor[band];
    const fs = Math.round(h * 0.52);
    c.font = `700 ${fs}px Caveat, cursive`;
    const utx = (p) => (((RM.sx0 + p * (RM.sx1 - RM.sx0)) - RM.gx0) / (RM.gx1 - RM.gx0)) * w;
    // (så mycket luft mellan två namn att de inte läses som ett)
    const lucka = fs * 0.7;
    const rad = l.map((e) => ({ e, x: utx(e.p), b: c.measureText(e.kort).width })).sort((a, b) => a.x - b.x);
    let slut = -Infinity;
    for (const a of rad) {
      a.r = a.x - a.b / 2 < slut + lucka ? 1 : 0;
      if (!a.r) slut = a.x + a.b / 2;
    }
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
      // strecket mot skalan, sedan namnet från vänster till höger. Står namnet nära sin frekvens och
      // det är fritt går strecket fram till det, annars är det bara en liten bock vid kanten.
      const fot = upp ? h * 0.98 : h * 0.02;
      const dx = Math.max(-fs * 0.8, Math.min(fs * 0.8, a.c - a.x));
      const fritt = a.r === 1 && Math.abs(a.c - a.x) < fs * 0.8 && !rad.some((n) => n.r === 0 && Math.abs(n.c - a.x - dx / 2) < n.b / 2 + 2);
      const hals = upp ? (fritt ? h * 0.47 : h * 0.93) : (fritt ? h * 0.53 : h * 0.07);
      c.strokeStyle = penna;
      c.lineWidth = Math.max(1, h * 0.03);
      c.beginPath();
      c.moveTo(a.x, fot);
      c.lineTo(a.x + (fritt ? dx : Math.sign(dx) * Math.min(fs * 0.3, Math.abs(dx))), hals);
      c.stroke();
      c.fillStyle = penna;
      c.fillText(a.e.kort, a.c, radY(a.r) + (hash(a.x) - 0.5) * h * 0.06);
    }
    TEJP.hit[band] = rad.map((a) => ({ id: a.e.id, x0: (a.c - a.b / 2) / w, x1: (a.c + a.b / 2) / w, y: radY(a.r) / h }));
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
  // alla: { id, band, p, kort } för varje station
  function radioEtiketter(alla) {
    TEJP.rutor = { fm: alla.filter((e) => e.band === 'fm'), am: alla.filter((e) => e.band === 'am') };
    tejpOm('fm');
    tejpOm('am');
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
  // En i taget, och i telefonen får det som väntar på huvudtråden gå före mellan dem (ljuset som
  // tänds, ett tryck, en bildruta): alla tre i ett svep var det längsta stoppet medan rummet
  // laddades, en halv sekund i en långsam telefon. (En kanal i stället för en timer: den väntar
  // inte i en flik i bakgrunden.) Inte i datorn: där byggs inredningen och sakerna samtidigt,
  // och de gick då före, så att gänget stod där tre–sex tiondelar senare.
  const slappFram = () => new Promise((ok) => {
    const k = new MessageChannel();
    k.port1.onmessage = () => { k.port1.close(); ok(); };
    k.port2.postMessage(0);
  });
  for (let i = 0; i < FIGS.length; i++) {
    figs.push(klar(build(sitt(FIGS[i], PLATSER[(i + n) % 3]), dress(FIGS[i].key, opt.vader))));
    if (LATT) await slappFram();
  }

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
    // DT har jeans (jeansshorts när det är hett), DL och DJ shorts eller långbyxor; i
    // overallen byxor av samma glansiga tyg som jackan
    const jeans = c.pants === 'jeans' && !D.prassel;
    const lang = D.ben === 'lang';
    const trou = D.prassel ? fab(D.byxa[0], PRASSEL) : fab(lang && D.byxa ? D.byxa[0] : c.trou, { bumpMap: jeans ? denim : knit, bumpScale: jeans ? 0.9 : 0.5 });
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
    const harG = hairGeo(P, cap ? { ...F.hair, cap } : F.hair, F.key.charCodeAt(1) * 131);
    mesh(harG, Object.assign(mat('#ffffff', { map: ht, bumpMap: ht, bumpScale: 1.5, normalMap: harG.userData.bak, normalMapType: THREE.ObjectSpaceNormalMap }, 'har'), { onBeforeCompile: harBak }), hc);
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
      // överarmens och underarmens tjocklek med ärmen (huvudFri)
      A.rU = rU;
      A.rL = A.loS ? rL : F.arm * 0.92;
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
      skratt: tex[`${F.key}_skratt`], skagg, turnNu: F.turn, tofs: hc.userData.tofs || null, duk: chest.userData.duk || null };
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

  // Armarna runt huvudena (2026-11-13). Huvudena är stora – bredare än axlarna – och påhitten säger
  // bara var handen ska vara och åt vilket håll armbågen ska peka, så när handen gick upp, bakom
  // huvudet eller fram till ansiktet kunde armen gå rakt igenom huvudet (allsången mot tv:n,
  // dansen, händerna i nacken), och någon gång under dansen och målen in i grannens. Ett huvud är
  // här ellipsoiden i headGeo – smalare mot hakan och lite större upptill för håret eller mössan –
  // (huvudForm), och varje bild prövas handen och armen mot det egna huvudet och grannarnas som
  // armen når (allaHuvuden, armHuvuden) med sin tjocklek runt om (huvudFri, i pose): handflatan och
  // handleden flyttas ut till ytan om de har hamnat inne i ett huvud (den som tar sig för pannan
  // eller lägger handen i nacken rör fortfarande vid det), och armbågen vrids runt linjen från
  // axeln till handleden, åt det håll där armen går fri först och inte längre än så (armbageFri).
  // Går armen inte fri någonstans flyttas handen ut så mycket som fattas. Grannarnas huvuden är
  // deras vid samma t (stallKropp), så samma t ger samma bild i vilken ordning figurerna än ställs,
  // och utan krock kostar det bara några punkter per arm och huvud.
  const HL = new THREE.Vector3();
  const HR = new THREE.Vector3();
  const HT = new THREE.Vector3();
  const HD = new THREE.Vector3();
  const NOLL = new THREE.Vector3();
  const HA = new THREE.Vector3();
  const HB = new THREE.Vector3();
  let HK = null;
  // huvudet i figurens axlar: { m, inv, mitt, P, har, r } (r: hur långt ut det når, med håret)
  function huvudForm(o) {
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    const m = o.torso.matrix.clone().multiply(o.hg.matrix).multiply(o.hc.matrix);
    const P = o.F.head;
    // (håret står ut en tiondel upptill, mössan och högtidens huvudbonader lite mer)
    const har = o.F.mossa || o.H ? 0.14 : 0.1;
    return { m, inv: m.clone().invert(), mitt: new THREE.Vector3().setFromMatrixPosition(m), P, har, r: Math.max(P.rx, P.ry, P.rz) * (1 + har) };
  }
  // Huvudena som armarna på o går runt, i o:s axlar: det egna först och grannarnas vid t – de
  // ställs om de inte redan står där (stallKropp) – om någon av armarna når dem.
  function allaHuvuden(o, t) {
    const ut = [o.huvForm.K];
    const inv = o.fig.matrix.clone().invert();
    for (const x of figs) {
      if (x === o) continue;
      if (!x.huvForm || x.huvForm.t !== t) stallKropp(x, t);
      const K = x.huvForm.K;
      const m = inv.clone().multiply(x.fig.matrix).multiply(K.m);
      const g = { ...K, m, inv: m.clone().invert(), mitt: new THREE.Vector3().setFromMatrixPosition(m) };
      if (o.arms.some((A) => armHuvuden(o, A, [g]).length)) ut.push(g);
    }
    return ut;
  }
  // de av huvudena Ks som armen A når (armen, handen och tjockleken), och alltid det egna
  function armHuvuden(o, A, Ks) {
    const S = shoulder(o, A);
    const n = o.F.a + o.F.b + o.F.arm * 4.5;
    return Ks.filter((K) => K.P === o.F.head || K.mitt.distanceTo(S) < n + K.r);
  }
  // huvudets radier i höjden y (huvudets axlar), med rad runt om
  function huvudRadier(K, y, rad) {
    const P = K.P;
    const ny = y / P.ry;
    const smal = ny < 0 ? 1 - P.taper * Math.min(1, -ny) ** 1.6 : 1;
    const har = 1 + K.har * sm(-0.2, 0.7, ny);
    return HR.set(P.rx * smal * har + rad, P.ry * har + rad, P.rz * har + rad);
  }
  // hur långt in i huvudet punkten p (figurens axlar) är med rad runt om (ungefär, i enheter; < 0: ute)
  function iHuvudet(K, p, rad) {
    HL.copy(p).applyMatrix4(K.inv);
    const R = huvudRadier(K, HL.y, rad);
    return (1 - Math.hypot(HL.x / R.x, HL.y / R.y, HL.z / R.z)) * (R.x + R.y + R.z) / 3;
  }
  // vägen ut till ytan från p, rakt ut från huvudets mitt (null: redan ute)
  function urHuvudet(K, p, rad) {
    HL.copy(p).applyMatrix4(K.inv);
    let R = huvudRadier(K, HL.y, rad);
    const d = Math.hypot(HL.x / R.x, HL.y / R.y, HL.z / R.z);
    if (d >= 1) return null;
    // (radierna beror på höjden: ett par varv till)
    let k = 1 / Math.max(d, 0.05);
    for (let i = 0; i < 3; i++) {
      R = huvudRadier(K, HL.y * k, rad);
      k /= Math.hypot(HL.x * k / R.x, HL.y * k / R.y, HL.z * k / R.z);
    }
    return HL.multiplyScalar(k).applyMatrix4(K.m).sub(p).clone();
  }
  // avståndet från punkten c till sträckan a–b
  function tillStracka(c, a, b) {
    HA.subVectors(b, a);
    const f = Math.max(0, Math.min(1, HB.subVectors(c, a).dot(HA) / Math.max(1e-6, HA.lengthSq())));
    return HB.copy(a).addScaledVector(HA, f).distanceTo(c);
  }
  // Hur djupt överarmen (S–E) och underarmen (E–Wr) går in i huvudena Ks, utom närmast axeln och
  // handleden, som armbågen inte rår på (HD: var det är djupast, och HK i vilket huvud). Ett
  // grannhuvud som armen inte är i närheten av prövas inte.
  function armIHuvudet(Ks, A, S, E, Wr) {
    if (Ks.length > 1) Ks = Ks.filter((K, i) => !i || tillStracka(K.mitt, S, E) < K.r + A.rU || tillStracka(K.mitt, E, Wr) < K.r + A.rL);
    let m = -Infinity;
    for (let i = 0; i <= 6; i++) {
      for (const [a, b, f, rad] of [[S, E, 0.3 + 0.7 * i / 6, A.rU], [E, Wr, 0.8 * i / 6, A.rL]]) {
        HT.lerpVectors(a, b, f);
        for (const K of Ks) {
          const d = iHuvudet(K, HT, rad);
          if (d > m) { m = d; HD.copy(HT); HK = K; }
        }
      }
    }
    return m;
  }
  // Armbågen (ik) vriden runt linjen från axeln till handleden tills armen går fri från huvudena,
  // i steg om KR_STEG åt båda hållen och sedan fint till gränsen: { E, f }, f hur djupt armen ändå
  // går in (≤ 0: fri). Går den inte fri, där den går minst in.
  const KR_STEG = 10 * DEG;
  function armbageFri(Ks, A, S, Wr, a, b, pole) {
    const E = ik(S, Wr, a, b, pole);
    const f0 = armIHuvudet(Ks, A, S, E, Wr);
    if (f0 <= 0) return { E, f: f0 };
    const ax = Wr.clone().sub(S).normalize();
    const C = S.clone().addScaledVector(ax, E.clone().sub(S).dot(ax));
    const e0 = E.clone().sub(C);
    const h = e0.length();
    if (h < 0.5) return { E, f: f0 };
    e0.divideScalar(h);
    const e1 = new THREE.Vector3().crossVectors(ax, e0);
    const vid = (v) => C.clone().addScaledVector(e0, h * Math.cos(v)).addScaledVector(e1, h * Math.sin(v));
    const fVid = (v) => armIHuvudet(Ks, A, S, vid(v), Wr);
    let bast = 0;
    let fb = f0;
    for (let k = 1; k * KR_STEG <= Math.PI + 1e-6; k++) {
      let sida = 0;
      let fs = Infinity;
      for (const s of [1, -1]) {
        const f = fVid(s * k * KR_STEG);
        if (f < fb) { fb = f; bast = s * k * KR_STEG; }
        if (f <= 0 && f < fs) { fs = f; sida = s; }
      }
      if (sida) {
        let lo = (k - 1) * KR_STEG;
        let hi = k * KR_STEG;
        for (let i = 0; i < 6; i++) { const v = (lo + hi) / 2; if (fVid(sida * v) <= 0) hi = v; else lo = v; }
        return { E: vid(sida * hi), f: fVid(sida * hi) };
      }
    }
    let lo = bast - KR_STEG;
    let hi = bast + KR_STEG;
    for (let i = 0; i < 8; i++) {
      const v1 = lo + (hi - lo) / 3;
      const v2 = hi - (hi - lo) / 3;
      if (fVid(v1) < fVid(v2)) hi = v2; else lo = v1;
    }
    const v = (lo + hi) / 2;
    return { E: vid(v), f: fVid(v) };
  }
  // Handen H i ställningen hp ut ur huvudena Ks: handflatans mitt och handleden med sin tjocklek,
  // och – går armen inte fri med armbågen – ut så mycket som fattas, rakt ut från huvudet där armen
  // går djupast in. Ger hp, eller en ny med handen flyttad.
  function huvudFri(o, Ks, A, H, hp) {
    // handens axlar som i orient, och näven flyttas så att handleden är där hp säger (pose)
    const Y = hp.y.clone().normalize();
    const Z = hp.z.clone().sub(Y.clone().multiplyScalar(hp.z.dot(Y))).normalize();
    const X = new THREE.Vector3().crossVectors(Y, Z);
    const sc = H.scale.x;
    const lok = (p, v) => p.clone().addScaledVector(X, v.x * sc).addScaledVector(Y, v.y * sc).addScaledVector(Z, v.z * sc);
    const mitt = H === A.fist ? H.userData.mitt.clone().sub(H.userData.wrist) : H.userData.mitt;
    const vrist = H === A.fist ? NOLL : H.userData.wrist;
    const p = hp.p.clone();
    let flytt = false;
    for (const K of Ks) {
      for (const [v, rad] of [[mitt, o.F.arm * 0.8], [vrist, A.rL * 0.8]]) {
        const d = urHuvudet(K, lok(p, v), rad);
        if (d) { p.add(d); flytt = true; }
      }
    }
    const S = shoulder(o, A);
    for (let i = 0; i < 3; i++) {
      const r = armbageFri(Ks, A, S, lok(p, vrist), o.F.a, o.F.b, hp.pole);
      if (r.f <= 0) break;
      p.addScaledVector(HD.sub(HK.mitt).normalize(), r.f + 0.5);
      flytt = true;
    }
    return flytt ? { ...hp, p } : hp;
  }

  // Eftersläpet. Allt i body0 händer i samma ögonblick, och då rör sig figuren som ett stycke. Här
  // följer huvudet bålen SLAP sekunder senare, och det som hänger löst – DJ:s tofs och ändarna på DL:s
  // halsduk – släpar efter huvudet och bålen och svänger förbi när de stannar. Allt räknas ur klockan
  // (body0 vid t, t − SLAP …, fem miljondels sekund var), så samma t ger fortfarande samma bild:
  // farten nu (a) är skillnaden mellan två ställningar, och farten nyss (b) den mellan de två före.
  // Det lösa går mot farten nu och med farten nyss – det släpar när rörelsen börjar och far förbi när
  // den slutar. Inte utan rörelser (calm).
  const SLAP = 0.08;
  const las = (o) => ({ lean: o.torso.rotation.x, tw: o.torso.rotation.y, side: o.torso.rotation.z, y: o.torso.position.y, hx: o.hg.rotation.x, hy: o.hg.rotation.y, hz: o.hg.rotation.z });
  function body(o, t) {
    if (opt.calm) { body0(o, t); slapVila(o); return; }
    const n = o.tofs ? 3 : o.duk ? 2 : 1;
    const s = [];
    for (let i = n; i >= 0; i--) { body0(o, t - i * SLAP); s[i] = las(o); }
    o.hg.rotation.set(s[1].hx, s[1].hy, s[1].hz);
    if (o.tofs) {
      // huvudets vridning i rummet: bålens nu och nackens för SLAP sedan (framåt, åt sidan) och höjden
      const P = (i) => s[i].lean + s[i + 1].hx;
      const R = (i) => s[i].side + s[i + 1].hz;
      const svang = (f) => (-(f(0) - f(1)) + 0.7 * (f(1) - f(2))) / SLAP;
      // tofsen sitter överst på mössan, en hävarm från nacken: bakåt när huvudet nickar fram, åt
      // sidan när det lutas och nedtryckt när man far uppåt (högst en halv tofs)
      const dz = grans(4.5 * svang(P), 6);
      const dx = grans(-4.5 * svang(R), 6);
      const dy = grans(0.05 * svang((i) => s[i].y), 2.5);
      const hem = o.tofs.userData.hem;
      o.tofs.position.set(hem.x + dx, hem.y + dy, hem.z + dz);
      o.tofs.rotation.set(dz * 0.04, 0, -dx * 0.04);
    }
    if (o.duk) {
      // halsdukens ändar hänger från halsen framför bröstet: ut från bröstet när bålen far bakåt
      // eller stannar efter att ha lutat sig fram (inte in i det), och när man studsar; åt sidan när
      // bålen vrids eller lutas. Den korta änden är lättare och svänger mer.
      const fram = (-(s[0].lean - s[1].lean) + 0.7 * (s[1].lean - s[2].lean)) / SLAP;
      const hopp = Math.abs(s[1].y - s[2].y) / SLAP;
      const W = (i) => s[i].side + 0.5 * s[i].tw;
      const sida = (-(W(0) - W(1)) + 0.7 * (W(1) - W(2))) / SLAP;
      o.duk.forEach((g, i) => {
        const latt = 1 + 0.35 * i;
        g.rotation.x = -grans(Math.max(0, 0.32 * latt * fram) + 0.004 * latt * hopp, 0.4);
        g.rotation.z = grans(0.35 * latt * sida, 0.22);
      });
    }
  }
  // (utan rörelser: det lösa hänger rakt)
  function slapVila(o) {
    if (o.tofs) { o.tofs.position.copy(o.tofs.userData.hem); o.tofs.rotation.set(0, 0, 0); }
    if (o.duk) for (const g of o.duk) g.rotation.set(0, 0, 0);
  }
  // Bålens och huvudets läge: lutning framåt, andning och blickar – och medan
  // man väntar på kupongen (waitBody) det man gör då.
  function body0(o, t) {
    const k = o.F.key;
    const tt = t + o.phase;
    const drink = drinkW(o, t);
    const drag = dragW(o, t);
    // (lugna och trygga: rak i ryggen med hakan lite upp, och allt går sakta)
    let lean = 0.07 - 0.12 * drink + 0.015 * gung(tt * 0.3);
    o.torso.rotation.z = 0.01 * gung(tt * 0.18);
    let breath = 1;
    let pitch = -0.07 + 0.02 * gung(tt * 0.25);
    let yaw = 0;
    // blickarna åt sidan mot bordet (inn, sitt)
    const inn = o.F.inn;
    if (k === 'dl') yaw = inn * (0.18 * ibland(t, 21, 0.13, 12, 13.5, 17, 18.5) - 0.05);
    // (DT nickar instämmande ibland, sakta)
    if (k === 'dt') { pitch += 0.05 * Math.sin(t * 2.6) * ibland(t, 26, 0.41, 8.5, 9.3, 11.6, 12.6); yaw = inn * 0.12 * ibland(t, 17, 0.67, 2, 3, 6, 7); }
    // (DJ nickar med betoningarna när han pratar, pratSlag)
    if (k === 'dj') { yaw = inn * (0.22 - 0.04 * gung(t * 0.45)); pitch += (0.012 * gung(t * 1.1) + 0.035 * pratSlag(t, DJ_PRAT).nick) * talkW(o, t); }
    // benen hänger lugnt och gungar bara lite (gung: i en takt som inte upprepar sig, som bålen ovan)
    const knee = [0, 1].map((i) => 0.07 + 0.06 * gung(t * (k === 'dj' ? 0.5 : 0.6) + o.phase + i * 2.4) * (k === 'dt' ? 0.6 : 1));
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
      lean += (-0.06 - lean) * jagW(o, t, true);
      side *= 1 - jag;
      for (let i = 0; i < 2; i++) knee[i] += (0.1 + 0.2 * Math.sin(t * 5.5 + o.phase + i * 2.6) - knee[i]) * jag;
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
    const upF = cheerF(o, t);
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
    lean += -0.1 * upF + (mv === 1 ? -0.1 : 0.2) * sink + 0.08 * smal;
    pitch += -0.22 * upF + (mv === 1 ? -0.34 : 0.42) * sink + 0.12 * nodW(o, t);
    // påhitten (akt): lutningen, blicken, benen och andningen
    let lift = 0;
    if (kb) {
      const w = ak.wk;
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
    // takten så länge radion spelar och ingen dans eller sång pågår (radioGung)
    if (dansKan(o, t)) {
      const g = radioGung(o, t, ak);
      if (g) {
        pitch += g.pitch || 0;
        lift += g.lift || 0;
        roll += g.roll || 0;
        side += g.side || 0;
        twist += g.twist || 0;
        if (g.knee) for (let i = 0; i < 2; i++) knee[i] += g.knee[i];
      }
    }
    // skålen: en nick när flaskan lyfts mot en
    const h = HEJ[k];
    if (h) pitch += 0.12 * skalW(o, t) * bump(t - h.at, 0.55, 0.75, 0.9, 1.25);
    // sömnen (somnW): var och en på sitt sätt (sovKropp), och medan man somnar
    // eller vaknar faller huvudet och rycker till
    const sov = somnW(o, t);
    if (sov > 0) {
      const b = sovKropp(o, t, sovStil(o));
      const fall = 4 * sov * (1 - sov) * bump((t + o.phase) % 2.6, 0, 1.1, 1.5, 1.9);
      lean += (b.lean - lean) * sov;
      pitch += (b.pitch - pitch) * sov + 0.25 * fall;
      yaw += (b.yaw - yaw) * sov;
      roll += (b.roll - roll) * sov;
      twist *= 1 - sov;
      side += (b.side - side) * sov;
      breath += (b.breath - breath) * sov;
      lift += (b.lift - lift) * sov;
      for (let i = 0; i < 2; i++) { knee[i] += (b.knee[i] - knee[i]) * sov; foot[i] += (b.foot - foot[i]) * sov; }
    }
    // uppvaknandet (VAKNA): på sitt sätt, och sedan groggy en stund – framåtlutad med tungt
    // huvud som sjunker och rycker upp, allt mer sällan, och slappa ben
    const vk = vaknaNu(o, t);
    if (vk) {
      const b = VAKNA[vk.satt].kropp(o, t, vk.l);
      lean += (b.lean || 0) * vk.w;
      pitch += (b.pitch || 0) * vk.w;
      yaw += (b.yaw || 0) * vk.w;
      roll += (b.roll || 0) * vk.w;
      breath += (b.breath || 0) * vk.w;
      lift += (b.lift || 0) * vk.w;
    }
    const gr = groggW(o, t);
    if (gr > 0) {
      const x = (t - VAK[k].at + o.phase) % 6.7;
      const dip = bump(x, 0, 2.2, 2.5, 2.8) * gr;
      lean += 0.1 * gr + 0.05 * dip;
      pitch += 0.13 * gr + 0.24 * dip;
      roll += 0.05 * gr * Math.sin(t * 0.8 + o.phase);
      for (let i = 0; i < 2; i++) knee[i] += (0.08 - knee[i]) * 0.7 * gr;
    }
    // humöret (humW): glad bakåtlutad med benen och huvudet som gungar lite,
    // nervös bara lite framåt (de är trygga: nerverna syns i ansiktet), deppig ihopsjunken med
    // blicken ner och benen stilla – inte i sömnen eller när man just har vaknat
    const hv = ready(o, t) * (1 - sov) * (1 - gr) * (1 - vaknaW(o, t));
    if (hv > 0) {
      const gl = humW('glad', t) * hv;
      const ne = humW('nerv', t) * hv;
      const de = humW('deppig', t) * hv;
      lean += -0.04 * gl + 0.03 * ne + 0.1 * de;
      side += (0.03 * ne + 0.1 * de) * o.F.turn * DEG * 1.5;
      pitch += -0.04 * gl + 0.02 * gl * Math.sin(tt * 1.8) + 0.12 * de;
      breath -= 0.02 * de;
      for (let i = 0; i < 2; i++) {
        knee[i] += ne * 0.06 * Math.sin(t * 1.4 + o.phase + i * 2.1) + gl * 0.05 * Math.sin(t * 1.2 + o.phase + i * 2.4);
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
    o.chest.scale.set(1 + 0.009 * Math.sin(tt * 1.15), (1 + 0.014 * Math.sin(tt * 1.15)) * breath, 1);
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
    if (n > 0 && o.F.key === 'dl') out.push([TV, n * (1 - ibland(t + o.phase, 31, 0.29, 0, 1, 4, 5.2, 0))]);
    // din egen figur på markören (spegeln), före det man pekar på och hej, som går före
    const sp = spW(o, t) * (1 - sovW(o, t)) * (1 - vaknaW(o, t));
    if (sp > 0) out.push([SP[o.F.key].nu.clone(), sp]);
    // dit man pekar, och på den som pekar på en
    const x = PK[o.F.key];
    const w = pekW(o, t);
    if (w > 0) out.push([x.fran.clone().lerp(x.p, sm(x.at, x.at + 0.45, t)), w]);
    const h = hejW(o, t, true);
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
    if (tv > 0) out.push([TV, tv * (1 - ibland(t + o.phase * 1.7, 26, 0.53 + FI(o) * 0.17, 0, 0.8, 3.6, 4.4))]);
    if (!S.nag) return out;
    const wait = figs.filter((x) => x.inneAt === Infinity);
    const by = figs.filter((x) => x.inneAt !== Infinity);
    if (!wait.length || !by.length) return out;
    // (båda samtidigt: samma stund för alla, vana)
    const bv = S.nag >= 1 ? vana(t, 27, 0.87, 4.5, 0) : null;
    const both = bv ? bump(bv.l, 0, 0.5, 3.8, 4.5) : 0;
    if (o.inneAt === Infinity) {
      if (both > 0) out.push([headIn(nearest(o, by)), bump(bv.l, 1.4, 1.8, 2.9, 3.4)]);
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
  const pekW = (o, t) => { const x = PK[o.F.key]; return x ? x.w0 + ((x.on ? 1 : 0) - x.w0) * sm(x.wAt, x.wAt + 0.5, t) : 0; };
  // Spegeln (spegel): din egen figur tittar på markören, var den än är i rummet, och följer den
  // medan musen eller fingret rör sig, som en spegelbild – så att man ser vem av de tre man är.
  // Punkten är där strålen genom markören går genom planet z framför bordet: figuren tittar ut
  // mot en och vrider huvudet efter markören. Blicken glider efter (tau, sekunder), tonar in på
  // in och, när markören har stått still i kvar, tillbaka på ut till det figuren annars gör.
  // SP: per figur { mal, nu, at, w0, wAt } – markörens punkt, blickens punkt på väg dit, när
  // markören senast rörde sig, och vikten som tonar in från w0 vid wAt.
  const SPEGEL = { z: 640, tau: 0.12, in: 0.35, kvar: 3, ut: 0.9 };
  const SP = {};
  const spW = (o, t) => {
    const s = SP[o.F.key];
    return s ? (s.w0 + (1 - s.w0) * sm(s.wAt, s.wAt + SPEGEL.in, t)) * (1 - sm(s.at + SPEGEL.kvar, s.at + SPEGEL.kvar + SPEGEL.ut, t)) : 0;
  };
  // den som sover vaknar inte (och den som håller på att vakna gör det först)
  // (f: med överslag, fj – blicken far lite förbi en och tillbaka, och flaskan lite för långt fram)
  const hejW = (o, t, f) => { const h = HEJ[o.F.key]; return h ? (f ? fj(h.at, h.at + 0.35, t, 0, 0.1) : sm(h.at, h.at + 0.35, t)) * (1 - sm(h.ut, h.ut + 0.6, t)) * (1 - sovW(o, t)) * (1 - vaknaW(o, t)) : 0; };
  // flaskan eller cigaretten lyfts en stund (inte medan man väntar)
  const skalW = (o, t, f) => { const h = HEJ[o.F.key]; return h ? (f ? fj(0.15, 0.7, t - h.at, 0, 0.08) * (1 - sm(2.4, 3.2, t - h.at)) : bump(t - h.at, 0.15, 0.7, 2.4, 3.2)) * (1 - sm(h.ut, h.ut + 0.5, t)) * ready(o, t) * (1 - sovW(o, t)) * (1 - vaknaW(o, t)) : 0; };
  // N: natten (hur släckt lysröret är, 0–1, mal), som glider dit på 2,5 sekunder
  const N = { mal: 0, at: -1e9, fran: 0 };
  const nattW = (t) => N.fran + (N.mal - N.fran) * sm(N.at, N.at + 2.5, t);

  // ---------- sömnen ----------
  // Mellan 22.30 och sju (somn, från rum-folk.js) sover gänget, var och en på sitt sätt
  // (sovStil): DL med huvudet bakåt och flaskan i famnen, DT med hakan mot bröstet och huvudet
  // som sjunker och rycker till, och DJ med huvudet på armarna på bordet. Den som inte har lämnat in har somnat
  // med kupongen i handen. SO är sömnen, som var och en somnar in i på sin egen tid (SOMN_FORE),
  // på SOMNA sekunder med huvudet som faller och rycker till.
  const SO = { on: false, at: -1e9, fran: 0 };
  const SOMNA = 9;
  const SOMN_FORE = { dl: 0, dt: 7, dj: 3 };
  const somnTid = (o, t) => { const d = SO.at + SOMN_FORE[o.F.key]; return SO.fran + ((SO.on ? 1 : 0) - SO.fran) * sm(d, d + SOMNA, t); };
  // VAK: när var och en väcktes – ett klick på hen, radion, matcherna, en inlämnad kupong eller
  // morgonen ({ at, w0: hur vaken hen redan var, djup: hur djupt hen sov, satt, till }). Hen vaknar
  // på sitt sätt (VAKNA) från at, är groggy en stund (groggW) och håller sig vaken till till – och
  // så länge radion spelar eller matcherna pågår, och KVAR sekunder efter (hall) – och somnar
  // sedan om på SOMNA sekunder.
  const VAK = {};
  const KVAR = 150;
  const VAKNA_LEN = 8;
  const NYKTER = 22;
  const hall = (t) => Math.max(SJUNG.radio.pa ? Infinity : SJUNG.radio.till + KVAR, S.tv ? Infinity : S.tvAt + KVAR);
  function vakW(o, t) {
    const v = VAK[o.F.key];
    if (!v) return 0;
    const upp = v.w0 + (1 - v.w0) * sm(v.at, v.at + VAKNA[v.satt].upp, t);
    const till = Math.max(v.till, hall(t));
    return upp * (1 - sm(till, till + SOMNA, t));
  }
  // hur mycket vem sover vid t (0–1): inte medan matcherna pågår
  const somnW = (o, t) => somnTid(o, t) * (1 - tvW(t)) * (1 - vakW(o, t));
  const sovW = somnW;
  // Uppvaknandet som pågår ({ v, satt, l, w }) och hur groggy hen är efteråt (0–1): mest
  // i början, och borta efter VAKNA_LEN + NYKTER sekunder – lika länge som djupt hen sov.
  function vaknaNu(o, t) {
    const v = VAK[o.F.key];
    if (!v || !v.djup || t < v.at || t >= v.at + VAKNA_LEN) return null;
    const l = t - v.at;
    const w = v.djup * bump(l, 0, 0.25, VAKNA_LEN - 1.6, VAKNA_LEN) * (1 - somnW(o, t));
    return w > 0.001 ? { v, satt: v.satt, l, w } : null;
  }
  const vaknaW = (o, t) => { const x = vaknaNu(o, t); return x ? x.w : 0; };
  function groggW(o, t) {
    const v = VAK[o.F.key];
    if (!v || !v.djup || t < v.at) return 0;
    return v.djup * (1 - sm(v.at + VAKNA_LEN * 0.6, v.at + VAKNA_LEN + NYKTER, t)) * (1 - somnW(o, t));
  }
  // Väck vem vid t (satt: hur, annars ett av de tre) – eller håll hen vaken längre om hen redan är vaken.
  // (prov: för bilder, med uppvaknandet också i en fast bild)
  function vakna(o, t, satt, prov = false) {
    const k = o.F.key;
    const v = VAK[k];
    const djup = somnW(o, t);
    if (djup > 0.05) {
      VAK[k] = { at: t, w0: vakW(o, t), djup, satt: VAKNA[satt] ? satt : VAKNA_SATT[Math.floor(hash(t * 0.71 + FI(o) * 3.3) * 3)], till: t + KVAR };
      // (utan rörelser är hen vaken direkt)
      if (opt.calm && !prov) VAK[k].at = t - VAKNA_LEN - NYKTER;
    } else if (v) v.till = Math.max(v.till, t + KVAR);
    else VAK[k] = { at: -1e9, w0: 1, djup: 0, satt: 'ryck', till: t + KVAR };
  }
  // Alla vaknar (radion, matcherna, morgonen) – en i taget och på olika sätt, efter d sekunder var.
  function allaVakna0(t, d) {
    const fro = hash(t * 0.37 + 1.3);
    const ordning = [0, 1, 2].sort((a, b) => hash(fro + a * 1.7) - hash(fro + b * 1.7));
    ordning.forEach((i, n) => vakna(figs[i], t + d[n], VAKNA_SATT[(Math.floor(fro * 3) + n) % 3]));
  }
  // De som är vakna när sömnen börjar, eller när matcherna slutar, hålls vakna av radion och matcherna (hall).
  function hallVakna(t) {
    for (const o of figs) if (!VAK[o.F.key] && somnW(o, t) < 0.5) VAK[o.F.key] = { at: -1e9, w0: 1, djup: 0, satt: 'ryck', till: t };
  }
  const SOVER = { dl: 'bak', dt: 'nick', dj: 'bord' };
  const sovStil = (o) => (o.inneAt === Infinity ? 'nick' : SOVER[o.F.key]);
  const cheerW = (o, t) => { const m = M[o.F.key]; return m && m.k > 0 ? bump(t - m.at, 0, 0.45, 3.4, 4.6) : 0; };
  // (jublet med ansats och överslag, fj: bålen och huvudet tar sats framåt innan de far bakåt, och armen
  // far förbi och sätter sig – bage)
  const cheerF = (o, t) => { const m = M[o.F.key]; return m && m.k > 0 ? fj(0, 0.45, t - m.at, 0.12, 0.12) * (1 - sm(3.4, 4.6, t - m.at)) : 0; };
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
    return (d >= 0 && d < 0.13) || (hash(n * 3.7 + o.phase) < 0.2 && d >= 0.34 && d < 0.47) || blickBlink(o, t);
  }
  // Och när blicken flyttas: man blinkar i början av en vridning, och utan det ser huvudet ut att vridas
  // i stället för att titta. Vid det man vet när det hände – man pekar på hen eller slutar (HEJ), ett
  // klick på hen (TK), någon blir vald (VAL), någon börjar peka i rummet eller slutar (PK) och tv:n går
  // på eller av (S.tvAt, var och en i sin tur) – strax efter att huvudet har börjat röra sig.
  function blickBlink(o, t) {
    const k = o.F.key;
    const vid = (at) => t - at >= 0.06 && t - at < 0.19;
    const h = HEJ[k];
    const tk = TK[k];
    const pk = PK[k];
    return Boolean((h && (vid(h.at) || vid(h.ut + 0.05))) || (tk && vid(tk.at)) || vid(VAL.at) || (pk && vid(pk.wAt)) || vid(S.tvAt + 0.25 + 0.2 * FI(o)));
  }

  // ---------- väntan på kupongen ----------
  // o.inneAt: när kupongen lämnades in (Infinity = väntar, −1e9 = inne sedan
  // länge). u = 0 → 1 är övergången: pennan bakom örat (u 0,28), kupongen på
  // bordet (0,3), flaskan eller cigaretten i handen (0,55),
  // som vanligt (0,82) och strax därpå det första blosset eller klunken.
  const TR = 4.4;
  const SLOT = 10;
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
  const valdW = (o, t, a, b, c, d, f) => { const x = valdD(o, t); return x < 0 ? 0 : (f ? fj(a, b, x, 0.1, 0.12) * (1 - sm(c, d, x)) : bump(x, a, b, c, d)) * (1 - sm(0, 0.3, uOf(o, t))); };
  // (f: med ansats och överslag, fj – för bålen, handen med pennan och kupongen)
  const jagW = (o, t, f) => valdW(o, t, 0, 0.35, 1.7, 2.15, f);
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
    b[V.ordning[((n % 5) + 5) % 5]] = bump(l, 0.3, 1.3, 5.9, 6.9) * (1 - valW(o, t)) * (1 - sovW(o, t)) * (1 - vaknaW(o, t));
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
      lean: 0.2 + 0.24 * kika + 0.08 * suck - 0.08 * vrid + 0.02 * gung(t * 0.5 + o.phase),
      pitch: 0.26 + 0.3 * kika - 0.32 * vrid + 0.1 * suck + 0.1 * glance - chew * (0.22 + 0.02 * Math.sin(t * 4)) + 0.12 * scratch,
      yaw: F.vanta.blick * glance - kika * F.turn * DEG * 0.8 + 0.04 * gung(t * 0.37 + o.phase),
      // och lutar sig ut åt sidan mot pulten, inte in framför den bakom bordet
      side: kika * F.turn * DEG * 0.3,
      breath: 1 - 0.04 * suck,
      knee: [0, 1].map((i) => 0.07 + (1 - ben) * 0.06 * gung(t * 0.6 + o.phase + i * 2.4) + ben * 0.14 * Math.sin(t * 1.8 + o.phase + i * 2.1)),
      foot: [0, 1].map((i) => 0.5 - (i === F.vanta.fot ? ben * 0.22 * Math.max(0, Math.sin(t * 4.5)) ** 2 : 0)),
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
  // Som lerpPose, men som en arm rör sig: handen går i en båge (ett lyft mitt på vägen, större ju
  // längre den ska, och lite framåt så att den går fri från bålen och bordet) i stället för rakt, och
  // handens vridning kommer strax efter läget, så att handleden följer armen. I ändarna är det samma
  // ställningar som förut. forbi: k får gå över 1 (överslaget i fj) – inte under 0, där handen
  // skulle tryckas ner i det den vilar på.
  const BAGE = new THREE.Vector3(0, 0.94, 0.34);
  function bage(a, b, k, forbi = false) {
    if (k <= 0) return a;
    if (k >= 1 && !forbi) return b;
    const kk = Math.min(1, k);
    const kv = kk * kk;
    const y = a.y.clone().lerp(b.y, kv);
    const z = a.z.clone().lerp(b.z, kv);
    const p = a.p.clone().lerp(b.p, Math.min(1.2, k)).addScaledVector(BAGE, Math.min(9, 0.14 * a.p.distanceTo(b.p)) * 4 * kk * (1 - kk));
    return { p, y: y.lengthSq() > 1e-3 ? y : b.y, z: z.lengthSq() > 1e-3 ? z : b.z, pole: a.pole.clone().lerp(b.pole, kk) };
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
  // Den som har somnat med den håller den löst, lite lägre och mer lutad, med pennan kvar på den.
  function paperM(o, t) {
    const { b, l } = acts(o, t);
    const vrid = b[4];
    const Wd = o.F.w;
    const sk = o.kp.s;
    const jag = Math.max(0, jagW(o, t, true));
    const skriv = skrivW(o, t);
    // så långt fram att den går fri från bröstet när han lutar sig över den
    const c = new THREE.Vector3(sk * Wd * 0.14, o.hipY + o.T * 0.5 + 0.8 * Math.sin(t * 0.9 + o.phase), o.F.depth + 24)
      .lerp(new THREE.Vector3(sk * Wd * 0.02, o.hipY + o.T * 0.98, o.F.depth + 34), vrid)
      .lerp(new THREE.Vector3(sk * Wd * 0.3, o.hipY + o.T * 0.8, o.F.depth + 36), jag)
      // (lite längre fram, där den syns under huvudet)
      .lerp(new THREE.Vector3(sk * Wd * 0.08, o.hipY + o.T * 0.52, o.F.depth + 34), skriv);
    const sov = sovW(o, t) * (1 - jag) * (1 - skriv);
    c.lerp(new THREE.Vector3(sk * Wd * 0.12, o.hipY + o.T * 0.44, o.F.depth + 27), sov);
    // nästan upprätt, så att baksidan syns framifrån (i sömnen lite mer lutad)
    const be = (24 - 14 * vrid + 8 * skriv + 14 * sov) * DEG;
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
    const tap = 1.2 * (ben + 0.3 * (1 - ben)) * Math.max(0, Math.sin(t * (ben > 0.5 ? 4.5 : 2.2))) ** 6;
    const tip = new THREE.Vector3(e[12], e[13], e[14]).addScaledVector(Y, KH * 0.22).addScaledVector(X, -sp * KW * 0.12).addScaledVector(Z, 1.2 + tap);
    let hp = grip(penAt(tip, Y.clone().multiplyScalar(-0.8).addScaledVector(new THREE.Vector3(sp, 0, 0), -0.45).addScaledVector(Z, -0.4).normalize()), L, pole);
    if (tugg > 0) {
      const dir = new THREE.Vector3(sp * 0.35, -0.38, 0.86).normalize();
      const end = mouthIn(o).add(new THREE.Vector3(0, 0.5 * Math.sin(t * 4.5), 1.2));
      const chew = grip(penAt(end.addScaledVector(dir, PEN_TIP - PEN_END), dir), L, new THREE.Vector3(sp, -0.7, 0.1));
      const P = o.F.head;
      const spot = inHead(o, new THREE.Vector3(sp * P.rx * 0.8, P.ry * 0.05 + 1.5 * Math.sin(t * 6), -P.rz * 0.62));
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
      hp = bage(hp, grip(penAt(uppe.addScaledVector(dir, PEN_TIP + 3), dir), L, new THREE.Vector3(sp, -0.6, -0.3)), jagW(o, t, true), true);
    }
    return hp;
  }
  function earPose(o, A) {
    o.torso.updateMatrix(); o.hg.updateMatrix(); o.hc.updateMatrix();
    const M = o.torso.matrix.clone().multiply(o.hg.matrix).multiply(o.hc.matrix).multiply(o.earPen.matrix);
    return grip(M, A.pen.matrix, new THREE.Vector3(A.s, -0.3, -0.5));
  }

  // Klunken och blosset: ungefär var 22:a sekund för DL och var 27:e för DJ en klunk, och ungefär var
  // 17:e för DT och var 23:e för DJ ett bloss (blosset, glöden och röken i samma stund) – men i varje
  // varv när det passar (som vana), och olika: en klunk är ibland snabb och ibland två, ett bloss kort
  // eller långt (v). Och när inget påhitt pågår: förut tonades klunken bort mitt i när ett påhitt
  // började och kom tillbaka efteråt, som två klipp på varandra. Nu tas den på en ledig stund i
  // varvet (fyra försök, LEDIG), och finns ingen blir det ingen det varvet.
  const VANOR = {
    klunk: { dl: { per: 22, fro: 0.31 }, dj: { per: 27, fro: 0.77 }, len: 6.8 },
    bloss: { dt: { per: 17, fro: 0.23 }, dj: { per: 23, fro: 0.61 }, len: 7 },
  };
  // (stunden räknas en gång per varv)
  const LEDIG = new Map();
  function vanaNu(o, namn, t) {
    const V = VANOR[namn];
    const K = V[o.F.key];
    if (!K) return null;
    const n = Math.floor(t / K.per);
    const nyckel = `${o.F.key}${namn}${n}`;
    let x = LEDIG.get(nyckel);
    if (x === undefined) {
      x = null;
      if (hash(n * 4.13 + K.fro + 0.25) >= 0.08) {
        const s = 0.85 + 0.35 * hash(n * 1.37 + K.fro);
        const len = V.len * s;
        const rum = Math.max(0, K.per - len - 0.3);
        const h = hash(n * 2.71 + K.fro + 0.5);
        for (let i = 0; i < 4 && !x; i++) {
          const t0 = n * K.per + ((h + i * 0.382) % 1) * rum;
          if ([0, 1 / 3, 2 / 3, 1].every((f) => !aktRa(o, t0 + len * f))) x = { t0, s, n, v: hash(n * 5.93 + K.fro + 0.75) };
        }
      }
      LEDIG.set(nyckel, x);
      if (LEDIG.size > 60) LEDIG.delete(LEDIG.keys().next().value);
    }
    if (!x) return null;
    const l = (t - x.t0) / x.s;
    return l >= 0 && l < V.len ? { ...x, l } : null;
  }
  function klunk(o, t) {
    const x = vanaNu(o, 'klunk', t);
    if (!x) return 0;
    const l = x.l;
    if (x.v < 0.22) return bump(l, 0, 1.4, 5.4, 6.8) - 0.45 * bump(l, 2.5, 3.1, 3.7, 4.4);
    if (x.v > 0.75) return bump(l, 0, 1.15, 2.4, 3.6);
    return bump(l, 0, 1.4, 3.6, 5);
  }
  // blosset ({ l, e }: e hur mycket längre eller kortare än vanligt, i sekunder)
  function bloss(o, t) {
    const x = vanaNu(o, 'bloss', t);
    if (!x) return null;
    return { l: x.l, e: x.v < 0.2 ? 0.8 : x.v > 0.8 ? -0.4 : 0 };
  }
  const blossW = (o, t) => { const b = bloss(o, t); return b ? bump(b.l, 0, 1.2, (o.F.key === 'dt' ? 2.4 : 2.2) + b.e, (o.F.key === 'dt' ? 3.6 : 3.4) + b.e) : 0; };
  const blossGlod = (o, t) => { const b = bloss(o, t); return b ? (o.F.key === 'dt' ? bump(b.l, 1, 1.4, 2.2 + b.e, 2.8 + b.e) : bump(b.l, 1.1, 1.5, 2.0 + b.e, 2.6 + b.e)) : 0; };
  const blossUt = (o, t) => { const b = bloss(o, t); return b ? (o.F.key === 'dt' ? bump(b.l, 3.0 + b.e, 3.3 + b.e, 4.4 + b.e, 5.6 + b.e) : bump(b.l, 3.4 + b.e, 3.7 + b.e, 4.8 + b.e, 6.0 + b.e)) : 0; };
  // när var och en dricker och drar ett bloss (0 → 1 → 0) – inte medan man
  // väntar, och strax efter inlämningen den första klunken eller blosset
  // (inte i sömnen eller medan man vaknar, och cigaretten har brunnit ner i sömnen)
  // (och inte medan man gör något annat, aktW)
  const drinkW = (o, t) => Math.max(o.F.key === 'dt' ? 0 : gaKlunk(o, t), ready(o, t) * (1 - sovW(o, t)) * (1 - vaknaW(o, t)) * (1 - aktW(o, t)) * klunk(o, t),
    o.F.key === 'dl' ? after(o, t, 0, 1.0, 2.6, 3.6) : 0);
  const dragW = (o, t) => Math.max(o.F.key === 'dt' ? gaKlunk(o, t) : 0, ready(o, t) * (1 - sovW(o, t)) * (1 - vaknaW(o, t)) * (1 - aktW(o, t)) * blossW(o, t),
    o.F.key === 'dl' ? 0 : after(o, t, 0, 1.0, 2.6, 3.6));
  const talkW = (o, t) => (o.F.key === 'dj' ? ready(o, t) * (1 - dragW(o, t)) * (1 - sovW(o, t)) * (1 - vaknaW(o, t)) * (1 - 0.6 * groggW(o, t)) * (1 - aktW(o, t)) : 0);
  const glowAt = (o, t) => Math.max(ready(o, t) * (1 - sovW(o, t)) * (1 - vaknaW(o, t)) * (1 - aktW(o, t)) * blossGlod(o, t), after(o, t, 1.0, 1.4, 2.2, 2.8), aktGlod(o, t));
  // DJ pratar med händerna (talkW) – förut i en jämn åtta i luften, tre vågor som aldrig stannade.
  // Nu i slag, som när man pratar: handen far till ett nytt ställe på en knapp halv sekund, lite förbi
  // och tillbaka, och står där till nästa slag, efter ungefär en sekund; ungefär vart femte slag står
  // den kvar, och ungefär vart femte är en betoning – större och med en nick (nick). x, y, z och vrid
  // är −1,3…1,3.
  const DJ_PRAT = 0.47;
  function pratSlag(t, fro) {
    const B = 0.95;
    const st = (m) => m * B + 0.5 * hash(m * 1.31 + fro);
    const paus = (m) => hash(m * 4.9 + fro + 0.3) < 0.2;
    const tung = (m) => hash(m * 3.7 + fro + 0.1) < 0.2;
    const mal = (m) => { const e = tung(m) ? 1.3 : 1; return [0, 1, 2, 3].map((c) => e * (2 * hash(m * 2.3 + c * 0.71 + fro) - 1)); };
    // (det senaste slaget som inte var en paus, högst fyra bakåt)
    const sist = (m) => { for (let i = 0; i < 4 && paus(m); i++) m--; return m; };
    let m = Math.floor(t / B);
    if (t < st(m)) m--;
    const fran = mal(sist(m - 1));
    if (paus(m)) return { x: fran[0], y: fran[1], z: fran[2], vrid: fran[3], nick: 0 };
    const till = mal(m);
    const d = 0.18 + 0.12 * hash(m * 5.3 + fro);
    const k = fj(st(m), st(m) + d, t, 0, 0.14);
    const v = fran.map((a, i) => a + (till[i] - a) * k);
    return { x: v[0], y: v[1], z: v[2], vrid: v[3], nick: tung(m) ? bump(t - st(m), 0.08, 0.2, 0.3, 0.6) : 0 };
  }

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
      if (u < 0.28) return bage(wait, earPose(o, A), sm(0, 0.28, u));
      const next = A.bench ? pick() : handDone(o, A, t);
      if (u < 0.55) return bage(earPose(o, A), next, sm(0.28, 0.55, u));
      if (A.bench && u < 0.82) return bage(next, handDone(o, A, t), sm(0.55, 0.82, u));
      return handDone(o, A, t);
    }
    const put = grip(o.kupBench.matrix, A.kup.matrix, new THREE.Vector3(A.s, -0.2, -0.8));
    if (u < 0.3) return bage(wait, put, sm(0, 0.3, u));
    const next = A.bench ? pick() : handDone(o, A, t);
    if (u < 0.55) return bage(put, next, sm(0.3, 0.55, u));
    if (A.bench && u < 0.82) return bage(next, handDone(o, A, t), sm(0.55, 0.82, u));
    return handDone(o, A, t);
  }
  // Vid ett mål: flaskan eller näven upp, handen eller flaskan mot
  // pannan – från det man gjorde, och tillbaka.
  function handDone(o, A, t) {
    let base = handRest(o, A, t);
    // sömnen (sovHand) och uppvaknandet (VAKNA)
    const sov = sovW(o, t);
    const sp = sov > 0 ? sovHand(o, A, t, sovStil(o)) : null;
    if (sp) base = lerpPose(base, sp, sov);
    const vk = vaknaNu(o, t);
    const vp = vk && VAKNA[vk.satt].hand ? VAKNA[vk.satt].hand(o, A, t, vk.l, base) : null;
    if (vp) base = lerpPose(base, vp, vk.w);
    const sk = A === skalArm(o) ? skalW(o, t, true) : 0;
    if (sk > 0) base = bage(base, skalPose(o, A, t), sk, true);
    // påhitten (akt): armen som påhittet använder
    const ak = aktNu(o, t);
    const ap = ak && ak.a.hand ? ak.a.hand(o, A, t, ak.l, ak) : null;
    if (ap) base = bage(base, ap, ak.wh);
    // målen, på tre sätt (malV): 0 som förut, 1 båda armarna upp (rätt) eller
    // båda händerna på huvudet (fel), 2 handen som dunkar i bordet av glädje
    // eller slår i det en gång
    const i = o.arms.indexOf(A);
    const v = malV(o);
    const up = cheerW(o, t);
    if (up > 0) {
      // (armen upp i en båge och lite förbi, cheerF; slaget i bordet som förut, så att handen träffar skivan)
      const upF = cheerF(o, t);
      if (v === 1) return bage(base, A.thing || A.fist ? cheerPose(o, A, t) : armUpp(o, A, t), upF, true);
      if (v === 2 ? A === fri(o) : i === o.F.mal.jubel) return v === 2 ? lerpPose(base, slag(o, A, t, true), up) : bage(base, cheerPose(o, A, t), upF, true);
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
  // Sömnen, på tre sätt (sovStil). Var och en andas i sin takt (SOVTAKT, en utandning och ett z
  // per period) och rör sig nästan inte – men på sitt sätt:
  // - bord: fram över bordet med armarna i kors på skivan och huvudet på dem, vänt utåt (SOV:
  //   bålen, huvudet och var händerna ligger). Ryggen häver sig, och då och då rättar hen till
  //   sig: axlarna upp och huvudet som vrider sig och lägger sig igen. Flaskan står på bordet.
  // - nick: sitter med hakan mot bröstet, och huvudet sjunker sakta tills det rycker till och
  //   kommer upp en bit; kroppen vajar lite. Händerna vilar som de brukar (cigaretten har brunnit ner).
  // - bak: huvudet bakåt och armarna i kors över magen med flaskan i famnen; huvudet rullar
  //   ibland sakta åt sidan och ligger där en stund innan det kommer tillbaka.
  const SOV = { lean: 0.85, pitch: 0.45, yaw: -0.7, roll: -0.8, fram: 58, sid: 11, lyft: 4 };
  const SOVTAKT = { dl: 4.6, dt: 3.6, dj: 5.4 };
  const andas = (o, t) => Math.sin((t * 2 * Math.PI) / SOVTAKT[o.F.key] + o.phase);
  // (bord: när hen rättar till sig, 0–1, ungefär var 83:e sekund)
  const sovRatt = (o, t) => ibland(t + o.phase * 5, 83, 0.19, 0, 1.0, 2.2, 3.4, 0.4, 0);
  function sovKropp(o, t, stil) {
    const a = andas(o, t);
    const inn = o.F.inn;
    // (framåt lutar man sig utåt, inte in framför den bakom bordet, som påhitten)
    const ut = o.F.turn * DEG * 1.5;
    if (stil === 'bord') {
      const r = sovRatt(o, t);
      return { lean: SOV.lean + 0.012 * a - 0.05 * r, pitch: SOV.pitch, yaw: (SOV.yaw + 0.16 * r) * inn, roll: (SOV.roll + 0.14 * r) * inn, side: 0, breath: 1 + 0.045 * a, lift: 1.8 * r, knee: [0.1, 0.1 + 0.18 * ibland(t + o.phase * 3, 47, 0.37, 0, 0.3, 0.6, 1.2)], foot: 0.5 };
    }
    if (stil === 'bak') {
      // (åt vartannat håll varje gång huvudet rullar åt sidan)
      const n = Math.floor((t + o.phase * 2) / 53);
      const rull = bump((t + o.phase * 2) - n * 53, 30, 36, 44, 49) * (n % 2 ? 1 : -1);
      return { lean: -0.06 + 0.006 * a, pitch: -0.34 + 0.025 * a, yaw: 0.04 * Math.sin(t * 0.3 + o.phase) + 0.1 * rull, roll: 0.24 * rull, side: 0, breath: 1 + 0.035 * a, lift: 0, knee: [0.06, 0.06 + 0.15 * ibland(t + o.phase * 3, 61, 0.59, 0, 0.3, 0.6, 1.2)], foot: 0.5 };
    }
    // nick: sjunker i 18 sekunder (lite olika länge), rycker upp en bit och sjunker tillbaka
    const nv = vana(t + o.phase * 3, 30, 0.71, 24, 0);
    const x = nv ? nv.l : 23.9;
    const sjunk = sm(0, 18, x) * (1 - sm(18, 18.35, x));
    const ryck = bump(x, 18, 18.3, 18.8, 23.5);
    const vaj = Math.sin(t * 0.37 + o.phase);
    const lean = 0.14 + 0.06 * sjunk - 0.04 * ryck + 0.008 * a;
    // (huvudet faller också åt sidan, utåt, så att det inte hamnar framför den bakom bordet)
    return { lean, pitch: 0.26 + 0.2 * sjunk - 0.08 * ryck, yaw: -inn * 0.14 + 0.05 * vaj, roll: inn * (0.14 + 0.16 * sjunk) + 0.05 * vaj, side: lean * ut + 0.02 * vaj, breath: 1 + 0.03 * a, lift: 0.6 * bump(x, 18, 18.15, 18.4, 18.9), knee: [0.12 + 0.03 * Math.sin(t * 0.6 + o.phase), 0.12 + 0.03 * Math.sin(t * 0.6 + o.phase + 2)], foot: 0.5 };
  }
  // Händerna i sömnen (null: som de brukar vila).
  function sovHand(o, A, t, stil) {
    if (stil === 'bord') return sovPose(o, A, t);
    if (stil === 'bak') return famnPose(o, A);
    return null;
  }
  function sovPose(o, A, t) {
    const s = A.s;
    // mot bordets mitt i figurens axlar
    const mot = new THREE.Vector3(BORD.x - o.F.x, 0, BORD.z - o.F.z).applyAxisAngle(UP, -o.F.turn * DEG);
    mot.y = 0;
    const kant = mot.length() - BORD.r;
    mot.normalize();
    const tvar = new THREE.Vector3(mot.z, 0, -mot.x);
    const r = sovRatt(o, t);
    const p = mot.clone().multiplyScalar(kant + SOV.fram - 3 * r).addScaledVector(tvar, s * SOV.sid).add(new THREE.Vector3(0, BORD.y + 3 + (s > 0 ? SOV.lyft : 0) + 1.5 * r, 0));
    return { p, y: tvar.clone().multiplyScalar(-s).addScaledVector(mot, 0.25), z: new THREE.Vector3(0, 1, 0), pole: new THREE.Vector3(s, -0.2, -0.3) };
  }
  // Armarna i kors över magen (som kors, men lägre), den lediga ovanpå och flaskan i famnen.
  function famnPose(o, A) {
    const s = A.s;
    const W = o.F.w;
    const ovan = A === fri(o);
    const p = iBal(o, new THREE.Vector3(-s * W * (ovan ? 0.44 : 0.52), o.T * (ovan ? 0.44 : 0.36), o.F.depth * 0.85 + (ovan ? 11 : 5)));
    if (A.thing) return { p, y: new THREE.Vector3(-s * 0.3, 1, 0.2), z: new THREE.Vector3(-s * 0.2, 0, 1), pole: new THREE.Vector3(s, -0.5, 0.2) };
    return { p, y: new THREE.Vector3(-s, 0.12, 0.05), z: new THREE.Vector3(0, 0.15, 1), pole: new THREE.Vector3(s, -0.5, 0.2) };
  }

  // Uppvaknandet (vakna, VAK), på tre sätt; upp: hur många sekunder sömnen tar på sig att släppa.
  // - ryck: hen sätter sig upp med ett ryck, tittar sig förvirrat omkring med öppna ögon,
  //   gnuggar sig i ögonen och skakar liv i huvudet.
  // - strack: lyfter sakta huvudet, sträcker på sig med armarna i luften och gäspar stort
  //   (munnen vidöppen och ögonen hopknipna) och skakar på huvudet.
  // - bakis: lyfter sakta huvudet och håller handen mot pannan en lång stund med ögonen
  //   stängda (DJ den kalla flaskan), och tar sedan en återställare ur flaskan (DT ett bloss
  //   på den slocknade cigaretten).
  // kropp(o, t, l) och hand(o, A, t, l, vila) som påhitten (AKTER), l sekunder in.
  const VAKNA_SATT = ['ryck', 'strack', 'bakis'];
  const pannArm = (o) => (o.F.key === 'dj' ? o.arms.find((A) => A.thing) || fri(o) : fri(o));
  const VAKNA = {
    ryck: {
      upp: 0.4,
      kropp: (o, t, l) => {
        const j = bump(l, 0, 0.12, 0.35, 0.9);
        const se = bump(l, 0.5, 0.8, 2.4, 2.9);
        const gn = bump(l, 3.0, 3.5, 5.6, 6.2);
        const sk = bump(l, 6.0, 6.3, 7.0, 7.5);
        return { lean: -0.12 * j + 0.06 * gn, pitch: -0.25 * j - 0.05 * se + 0.14 * gn, yaw: 0.5 * Math.sin((l - 0.5) * 3.2) * se + 0.18 * Math.sin((l - 6) * 14) * sk, lift: 3 * j, breath: 0.04 * j };
      },
      hand: (o, A, t, l, vila) => {
        if (A !== fri(o)) return null;
        const gn = bump(l, 3.0, 3.5, 5.6, 6.2);
        if (gn <= 0) return null;
        const s = A.s;
        const P = o.F.head;
        const d = huvudAxlar(o);
        // knogarna mot ögat, och gnuggar
        const at = inHead(o, new THREE.Vector3(s * P.rx * 0.22 + 1.6 * Math.sin(l * 15), P.ry * 0.06 + 0.8 * Math.sin(l * 11), P.rz * 0.96 + o.F.arm * 1.05));
        return lerpPose(vila, { p: at, y: d(-s * 0.3, 1, -0.1), z: d(0, 0, 1), pole: new THREE.Vector3(s, -0.7, 0.3) }, gn);
      },
    },
    strack: {
      upp: 2.6,
      kropp: (o, t, l) => {
        const g = bump(l, 2.2, 3.2, 5.0, 6.2);
        const sk = bump(l, 6.2, 6.5, 7.3, 7.8);
        return { lean: -0.14 * g, pitch: -0.34 * g, breath: 0.07 * g, yaw: 0.2 * Math.sin((l - 6.2) * 12) * sk };
      },
      hand: (o, A, t, l, vila) => {
        const g = bump(l, 2.0, 3.2, 5.0, 6.4);
        if (g <= 0) return null;
        const h = upp(o, A, 0.48, 0.64, -0.1);
        h.p.y += 0.7 * Math.sin(l * 9) * bump(l, 3.2, 3.6, 4.6, 5.0);
        return lerpPose(vila, h, g);
      },
      // (gäspningen: gäspansiktet med munnen som ett O och ögonen hopknipna, gaspBygg)
      gaspar: (l) => l > 3.0 && l < 4.9,
    },
    bakis: {
      upp: 2.2,
      kropp: (o, t, l) => {
        const h = bump(l, 1.2, 2.2, 5.0, 5.8);
        const dr = bump(l, 5.4, 6.2, 7.2, 7.9);
        const ol = Boolean(skalArm(o).thing);
        return { lean: 0.15 * h - 0.1 * dr, pitch: 0.25 * h + 0.04 * Math.sin(l * 1.6) * h + (ol ? -0.38 : 0.06) * dr, roll: 0.06 * Math.sin(l * 1.3) * h };
      },
      hand: (o, A, t, l, vila) => {
        const h = bump(l, 1.2, 2.2, 5.0, 5.8);
        const dr = bump(l, 5.4, 6.2, 7.2, 7.9);
        if (A === pannArm(o) && h > 0) return lerpPose(vila, palmPose(o, A, t), h);
        if (A === skalArm(o) && dr > 0) return lerpPose(vila, A.thing ? supAt(o, A, t, dr) : blossAt(o, A), dr);
        return null;
      },
      // (ögonen stängda medan handen är mot pannan)
      blund: (l) => l > 1.6 && l < 5.4,
    },
  };
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
      // (i en båge, och flaskan lutas när den är framme, bage)
      const d = supAt(o, A, t, w);
      return { ...bage(rest, d, w), pole: d.pole };
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
        // (i slag, pratSlag, och lite rörelse också när handen står)
        const g = pratSlag(t, DJ_PRAT);
        const a = t * 0.6;
        rest.p.lerp(new THREE.Vector3(s * (Wd * 1.15 + 6 * g.x + gung(a)), o.T * 0.42 + 5 * g.y + 0.8 * gung(a * 1.3 + 2) + y0, th * 0.9 + 4 * g.z), k);
        rest.y.lerp(new THREE.Vector3(s * 0.2 + 0.22 * g.vrid, 1, 0.55), k);
        rest.z.lerp(new THREE.Vector3(s * 0.3, -0.2, -1), k);
      }
      const w = dragW(o, t);
      if (w <= 0) return rest;
      const d = blossAt(o, A);
      return { ...bage(rest, d, w), pole: d.pole };
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
  // läge då och då något lugnt (oftast bakåtlutad med handen i nacken), glad
  // ölen i luften, nervös – men trygg – hakan i handen, händerna knäppta
  // framför munnen och fingrarna som trummar sakta (naglarna och kliandet finns
  // kvar för ?rum-akt men väljs inte), deppig hakan i handen, huvudet som
  // skakas, armarna i kors och blicken ner i flaskan. Den som leder omgången lutar sig oftare bakåt med
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
    lugn: { chans: 0.3, dl: ['nacke', 'strack', 'hakan', 'stirrar'], dt: ['nacke', 'strack', 'hakan', 'nacke'], dj: ['nacke', 'strack', 'hakan', 'stirrar'] },
    glad: { chans: 0.55, dl: ['gung', 'nacke', 'strack', 'nacke'], dt: ['nacke', 'gung', 'strack', 'nacke'], dj: ['gung', 'nacke', 'trumma', 'nacke'] },
    nerv: { chans: 0.5, dl: ['hakan', 'knappt', 'nacke', 'trumma'], dt: ['knappt', 'hakan', 'nacke', 'trumma'], dj: ['hakan', 'knappt', 'nacke', 'trumma'] },
    deppig: { chans: 0.6, dl: ['hakan', 'skakar', 'kors', 'stirrar'], dt: ['hakan', 'skakar', 'kors', 'hakan'], dj: ['dunk', 'hakan', 'skakar', 'stirrar', 'kors'] },
  };
  const FI = (o) => FIGS.findIndex((F) => F.key === o.F.key);
  // PROV: ett påhitt som var och en gör om och om igen från at (prova, ?rum-akt)
  const PROV = {};
  // Gänget tillsammans: i var GRUPP_SLOT:e sekund ett påhitt ur GRUPP efter
  // humöret, med chansen efter namnet (nästan nio gånger av tio när det går bra,
  // två av tre som vanligt, sällan när kupongen är död). Skämtet, grälet, tv:n och
  // zen-stunderna kräver att alla tre är vakna och har lämnat in, och att matcherna
  // inte pågår (ALLA).
  const GRUPP = {
    lugn: [['skamt', 0.16], ['gral', 0.05], ['titta', 0.08], ['skal', 0.08], ['zen', 0.3]],
    glad: [['skal', 0.33], ['allsang', 0.25], ['skamt', 0.2], ['zen', 0.12]],
    nerv: [['gral', 0.04], ['titta', 0.06], ['zen', 0.3]],
    deppig: [['skamt', 0.07]],
  };
  const ALLA = new Set(['skamt', 'gral', 'titta', 'korsaSmitta', 'gaspSmitta', 'zenAndas', 'zenDrom', 'zenRingar', 'zenVaggar', 'zenTyst']);
  const allaVakna = (t) => tvW(t) < 0.01 && figs.every((o) => ready(o, t) > 0.99 && sovW(o, t) < 0.01 && groggW(o, t) < 0.05 && !vaknaNu(o, t));
  // (utan hänsyn till den som går iväg, gaNu)
  function grupp0(t) {
    const n = Math.floor((t - 4) / GRUPP_SLOT);
    const t0 = n * GRUPP_SLOT + 4;
    const r = hash(n * 5.71 + 2.3);
    let namn = null;
    let acc = 0;
    for (const [k, p] of GRUPP[humAt(t0) || 'lugn']) if (!namn && r < (acc += p)) namn = k;
    // (sent på kvällen smittar gäspningen, gaspChansAt)
    if (hash(n * 2.47 + 6.1) < gaspChansAt(t0)) namn = 'gaspSmitta';
    if (hash(n * 3.19 + KORS_FRO) < 1.5 * korsChansAt(t0)) namn = 'korsaSmitta';
    // (allsången på ett av sina sätt)
    if (namn === 'allsang') namn = sangVal(n, t0);
    // (och zen-stunderna på sina)
    if (namn === 'zen') namn = zenVal(n, t0);
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
  // Var och ens eget påhitt i luckan där t är (inte samtidigt som gänget gör något). Det börjar var
  // som helst i luckan där det får plats, och går olika fort (s: l är påhittets egen tid) och olika
  // långt (amp, för bålen) – förut började det alltid en halv sekund in i luckan och var likadant.
  function egen(o, t) {
    const i = FI(o);
    const fas = 1.3 + i * 3.7;
    const n = Math.floor((t + fas) / AKT_SLOT);
    const t1 = n * AKT_SLOT - fas + 0.5;
    if (t < t1) return null;
    const meny = MENY[humAt(t1) || 'lugn'];
    const ks = hash(n * 2.93 + i * 7.7 + KORS_FRO) < korsChansAt(t1) ? korsaVal(o, n, i) : null;
    // (tiden på dygnet: utöver humörets påhitt, dygnVal)
    const dv = ks ? null : dygnVal(o, n, i, t1);
    if (!ks && !dv && hash(n * 7.31 + i * 13.7 + 0.5) > meny.chans) return null;
    const val = meny[o.F.key].slice();
    const r = rankAt(o.F.key, t1);
    if (r > 0) val.push('nacke', 'nacke');
    if (r < 0) val.push('kors', 'kors');
    const namn = ks || dv || val[Math.floor(hash(n * 3.17 + i * 5.3 + 0.25) * val.length)];
    const len = AKTER[namn].len;
    // (farten och var i luckan: det ska hinna ta slut innan nästa lucka börjar)
    const fs = 0.87 + 0.28 * hash(n * 1.93 + i * 4.1 + 0.6);
    const fart = Math.min(fs, (AKT_SLOT - 0.8) / len);
    const t0 = t1 + hash(n * 2.39 + i * 3.3 + 0.15) * Math.max(0, AKT_SLOT - 0.8 - len * fart);
    const l = (t - t0) / fart;
    const slut = t0 + len * fart;
    if (l < 0 || l >= len || grupp(t0) || grupp((t0 + slut) / 2) || grupp(slut)) return null;
    return { namn, l, t0, slut, amp: 0.86 + 0.22 * hash(n * 6.07 + i * 2.2 + 0.4) };
  }
  function aktRa(o, t) {
    const pv = PROV[o.F.key];
    if (!pv) {
      // sången efter ett mål och från radion går före, och det som pågår när den börjar tonar bort (av)
      const f = tvingad(o, t);
      if (f) return f;
      const x = grupp(t) || egen(o, t);
      const s = x && tvingStart(x.t0, x.slut ?? x.t0 + AKTER[x.namn].len);
      return s == null ? x : s > x.t0 ? { ...x, av: s } : null;
    }
    const per = AKTER[pv.namn].len + 1.5;
    const l = (((t - pv.at) % per) + per) % per;
    return { namn: pv.namn, l, t0: t - l };
  }
  // (den som just har vaknat kommer igång allt eftersom: dansen och påhitten växer fram)
  const vaken = (o, t) => ready(o, t) * (1 - sovW(o, t)) * (1 - vaknaW(o, t)) * (1 - 0.85 * groggW(o, t))
    * (1 - Math.max(cheerW(o, t), sinkW(o, t), nodW(o, t))) * (1 - hejW(o, t)) * (1 - teckenW(o, t)) * (1 - gaHar(o, t));
  // Påhittet som pågår vid t ({ namn, a, l, t0, w, wk, wh }) eller null. w är hur mycket av det som
  // syns, wk för bålen och wh för armarna: bålen börjar en aning före armen och slutar en aning efter,
  // tar lite sats och svänger förbi när den sätter sig (fj) – förut gick allt in och ut samtidigt och
  // lika mjukt, som en övertoning mellan två ställningar.
  function aktNu(o, t) {
    const x = aktRa(o, t);
    if (!x) return null;
    const a = AKTER[x.namn];
    // (mellan två danser på radion tonar man inte bort: somIn, somUt)
    const f = vaken(o, t) * (x.av != null ? 1 - sm(x.av, x.av + 0.9, t) : 1);
    const w = (x.somIn ? 1 : sm(0, a.in, x.l)) * (x.somUt ? 1 : 1 - sm(a.len - a.ut, a.len, x.l)) * f;
    if (w <= 0.001) return null;
    const di = Math.min(0.16, a.in * 0.25);
    const du = Math.min(0.14, a.ut * 0.25);
    const wh = (x.somIn ? 1 : sm(di, a.in + di * 0.5, x.l)) * (x.somUt ? 1 : 1 - sm(a.len - a.ut - du, a.len - du * 0.5, x.l)) * f;
    const ai = Math.max(0.05, a.in);
    const au = Math.max(0.05, a.ut);
    const ut = a.len - au;
    const wk = (x.somIn ? 1 : fj(0, ai / FJ, x.l, 0.04, 0.07)) * (x.somUt ? 1 : 1 - fj(ut, ut + au / FJ, x.l, 0.03, 0.07)) * f * (x.amp ?? 1);
    return { ...x, a, w, wh, wk };
  }
  const aktW = (o, t) => { const x = aktNu(o, t); return x ? x.w : 0; };
  // utandningen efter blosset i skålen (DT)
  const blasW = (o, t) => {
    const x = aktNu(o, t);
    if (x && x.a.blas) return x.a.blas(o, x.l, x) * vaken(o, t);
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
      len: 5, in: 1.3, ut: 1.4,
      hand: (o, A, t, l) => {
        const h = upp(o, A, 0.48, 0.64, -0.1);
        h.p.y += 0.4 * Math.sin(l * 6) * bump(l, 1.2, 1.6, 3.0, 3.6);
        return h;
      },
      kropp: (o, t, l) => ({ lean: -0.14, pitch: -0.32 * bump(l, 0.8, 1.6, 3.2, 4.2), breath: 0.05 * bump(l, 0.8, 1.6, 3.2, 4.2) }),
    },
    // lutar sig bakåt med den lediga handen i nacken
    nacke: {
      len: 9, in: 1.5, ut: 1.5,
      hand: (o, A) => {
        if (A !== fri(o)) return null;
        const s = A.s;
        const P = o.F.head;
        const d = huvudAxlar(o);
        return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.82, -P.ry * 0.2, -P.rz * 0.5)), d(-s * 0.4, 0.45, -0.8), d(s * 0.85, 0.1, -0.5), new THREE.Vector3(s, 0.6, 0.1));
      },
      kropp: (o, t) => ({ lean: -0.13, pitch: -0.1, knee: [0.05 * Math.sin(t * 1.1), 0.05 * Math.sin(t * 1.1 + 1.7)] }),
    },
    // kliar sig i bakhuvudet, med huvudet på sned
    klia: {
      len: 4.5, in: 1.1, ut: 1.1,
      hand: (o, A, t) => {
        if (A !== fri(o)) return null;
        const s = A.s;
        const P = o.F.head;
        const d = huvudAxlar(o);
        return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.86, -P.ry * 0.12 + 1.6 * Math.sin(t * 7), -P.rz * 0.42)), d(-s * 0.35, 0.55, -0.75), d(s * 0.9, 0.15, -0.3), new THREE.Vector3(s, 0.3, -0.3));
      },
      kropp: (o) => { const s = fri(o).s; return { roll: -s * 0.12, pitch: 0.12, yaw: -s * 0.1 }; },
    },
    // fingrarna trummar på bordet
    trumma: {
      len: 6, in: 1.1, ut: 1.1,
      hand: (o, A, t) => {
        if (A !== fri(o)) return null;
        const k = Math.max(0, Math.sin(t * 8 + o.phase)) ** 2;
        const h = paBordet(o, A, 16, 14, 0.6 + 1.4 * k);
        h.y.y -= 0.28 * k;
        return h;
      },
      kropp: (o, t) => ({ lean: 0.03, pitch: 0.05, knee: [0.05 * Math.sin(t * 1.4 + o.phase), 0.05 * Math.sin(t * 1.4 + o.phase + 2)] }),
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
      len: 6.5, in: 1.2, ut: 1.2,
      hand: (o, A, t) => {
        const s = A.s;
        const C = mouthIn(o).add(new THREE.Vector3(0, -9 + 0.8 * Math.sin(t * 1.4), 14));
        if (A.thing) return { p: C.addScaledVector(new THREE.Vector3(0, 1, 0), -A.thing.userData.top - 3), y: new THREE.Vector3(0, 1, 0.1), z: new THREE.Vector3(s, 0, 0.35), pole: new THREE.Vector3(s, -0.8, -0.2) };
        return handflata(o, C.add(new THREE.Vector3(s * 4.5, -4, 0)), new THREE.Vector3(-s * 0.25, 1, 0.1), new THREE.Vector3(s, 0, 0.3), new THREE.Vector3(s, -0.8, -0.2));
      },
      kropp: (o, t) => ({ lean: 0.08 + 0.03 * Math.sin(t * 1.4), pitch: -0.04, knee: [0.05 * Math.sin(t * 1.4 + o.phase), 0.05 * Math.sin(t * 1.4 + o.phase + 2)] }),
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
      hand: (o, A, t, l) => (A === sangArm(o) ? gungHand(o, A, t, { t0: t - l }) : null),
      kropp: (o, t, l) => gungKropp(t, { t0: t - l }),
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
  const allaUppe = (t) => figs.every((o) => ready(o, t) > 0.99 && sovW(o, t) < 0.01 && groggW(o, t) < 0.05);
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
  // Radions sånger är oftast danser (radioNamn, rum-dans.js), och två danser i rad glider
  // över i varandra (forra, nasta). Var och en kommer igång och byter i sin egen takt där.
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
      // (den första dansen efter vilan ska gå att hänga på allt eftersom)
      if (k % 3 === 0 && DANSER[v].igang) v = ['italoPek', 'italoAxlar', 'italoKlapp', 'italoJive'][Math.floor(hash(fro + k * 0.37) * 4)];
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
    const x = { namn, l, t0, k, fro: R.fran };
    // (två danser i rad: man glider över i nästa utan att vila emellan, rum-dans.js)
    if (DANSER[namn] && k % 3 === 1) {
      x.forra = radioNamn(k - 1, t0 - RADIO_SLOT);
      x.somIn = true;
    }
    if (DANSER[namn] && k % 3 === 0 && t0 + RADIO_SLOT < R.till) {
      x.nasta = radioNamn(k + 1, t0 + RADIO_SLOT);
      x.somUt = true;
    }
    if (R.till < t0 + AKTER[namn].len) x.av = R.till;
    return x;
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

  // ---------- zen-stunderna ----------
  // Ibland sitter gänget bara och har det lugnt (GRUPP: oftast som vanligt, ibland
  // när det går bra, och när det är nervöst andas de eller tittar ut i fjärran), på
  // ett av fem sätt (zenVal):
  //   zenAndas: ner med det som är i händerna, händerna uppåt på bordet med tummen
  //     mot pekfingret, ryggen rak och ögonen stängda – djupa andetag i takt, och
  //     mitt i kikar en på de andra och blundar igen;
  //   zenDrom: bakåtlutade med händerna i nacken och blicken i taket, benen som
  //     dinglar sakta – en slumrar till och vaknar med ett ryck, och en annan
  //     skakar på huvudet åt hen;
  //   zenRingar: de som röker blåser rökringar, en i taget (rökringarna nedan), och
  //     de andra följer dem med blicken – den som inte röker petar sönder den sista;
  //   zenVaggar: vaggar sakta med slutna ögon som till en låt bara de hör – en
  //     börjar och de andra faller in – och nickar till varandra efteråt;
  //   zenTyst: tittar ut i fjärran, suckar tillsammans och tar en klunk var (DT
  //     ett bloss), en i taget.
  // Samma sätt kommer inte tillbaka förrän tre andra har varit (ZEN_K).
  const ZEN = ['zenAndas', 'zenDrom', 'zenRingar', 'zenVaggar', 'zenTyst'];
  // Luckan → sättet. Sparas, så att det som har börjat inte byts (som RADIO_K), och
  // sätten i de tre närmaste luckorna med zen kommer inte nu.
  const ZEN_K = new Map();
  function zenVal(n, t0) {
    if (ZEN_K.has(n)) return ZEN_K.get(n);
    const nara = [...ZEN_K].sort((a, b) => Math.abs(a[0] - n) - Math.abs(b[0] - n)).slice(0, 3).map((x) => x[1]);
    const val = humAt(t0) === 'nerv' ? ['zenAndas', 'zenTyst'] : ZEN;
    const fria = val.filter((v) => !nara.includes(v));
    const av = fria.length ? fria : val;
    const v = av[Math.floor(hash(n * 4.13 + 0.7) * av.length)];
    ZEN_K.set(n, v);
    return v;
  }
  // Händerna med fingrar: tummen mot pekfingret, flätade i nacken och pekfingret.
  const MUDRA = { f: [0.6, 0.08, 0.14, 0.2], sp: [0.04, 0, 0.06, 0.12], tu: [0.15, 0.85, -0.5], tb: 0.25 };
  const FLATAD = { f: [0.45, 0.48, 0.52, 0.55], sp: [0, 0, 0, 0], tu: [0.3, 0.85, -0.3], tb: 0.3 };
  const PEK = { f: [0, 0.95, 1, 1], sp: [0, 0, 0, 0], tu: [-0.62, 0.5, -0.72], tb: 0.55 };
  const ZEN_STOR = 1.08;
  // Ner med det som är i handen på bordet (ner 0–1, som i dansen) och upp med handen till mal (k 0–1).
  function zenHand(o, A, t, ner, mal, k) {
    let p = handRest(o, A, t);
    if (A.bench && ner > 0) p = lerpPose(p, grip(A.bench.matrix, (A.thing || A.cig).matrix, new THREE.Vector3(A.s, -0.4, -0.6)), ner);
    return k > 0 ? lerpPose(p, mal, k) : p;
  }
  // Handen med handflatan uppåt på bordet, d in från kanten och x åt sin sida.
  function handUpp(o, A, d, x) {
    const { mot, kant, tvar } = motBord(o);
    const p = mot.clone().multiplyScalar(kant + d).addScaledVector(tvar, A.s * x);
    p.y = BORD.y + 4.5;
    return { p, y: mot.clone().addScaledVector(tvar, A.s * 0.3).add(new THREE.Vector3(0, 0.04, 0)), z: new THREE.Vector3(0, -1, 0.05), pole: new THREE.Vector3(A.s, -0.4, -0.5) };
  }
  // Handen bakom huvudet (som nacke), för båda armarna.
  function iNacken(o, A) {
    const s = A.s;
    const P = o.F.head;
    const d = huvudAxlar(o);
    return handflata(o, inHead(o, new THREE.Vector3(s * P.rx * 0.8, -P.ry * 0.16, -P.rz * 0.52)), d(-s * 0.42, 0.45, -0.8), d(s * 0.85, 0.1, -0.5), new THREE.Vector3(s, 0.6, 0.1));
  }
  // Fingrarna i ett påhitt (AKTER[…].fing → { form, k }), för pose; aktFingK hur mycket.
  function aktFing(o, A, t) {
    const x = aktNu(o, t);
    const f = x && x.a.fing ? x.a.fing(o, A, x.l, x) : null;
    return f ? { form: f.form, k: f.k * x.wh } : null;
  }
  function aktFingrar(o, A, t) {
    const f = aktFing(o, A, t);
    return f && f.k > 0.02 ? { form: blanda(LOS, f.form, sm(0.1, 0.7, f.k)), stor: 1 + (ZEN_STOR - 1) * sm(0, 0.6, f.k) } : null;
  }
  const aktFingK = (o, A, t) => { const f = aktFing(o, A, t); return f ? f.k : 0; };
  // Glöden i ett bloss i ett påhitt (AKTER[…].glod), för glowAt.
  function aktGlod(o, t) {
    const x = aktNu(o, t);
    return x && x.a.glod ? x.a.glod(o, x.l, x) * x.wh : 0;
  }
  // Var och ens plats i rollerna (a börjar, b och c följer efter).
  const rollNr = (R, i) => (i === R.a ? 0 : i === R.b ? 1 : 2);
  const rollVem = (R, j) => [R.a, R.b, R.c][j];

  // Andas: tre djupa andetag i takt (andasIn 0 → 1 → 0 på ANDAS.per sekunder).
  const ANDAS = { ner: 0.3, bord: 1.1, upp: 2.0, start: 2.5, per: 4.6, n: 3, kik: [6.6, 9.6], len: 18.6 };
  ANDAS.slut = ANDAS.start + ANDAS.n * ANDAS.per;
  const andasIn = (l) => { const f = (l - ANDAS.start) / ANDAS.per; return f < 0 || f > ANDAS.n ? 0 : 0.5 - 0.5 * Math.cos(2 * Math.PI * f); };
  const andasK = (l) => bump(l, ANDAS.bord, ANDAS.upp, ANDAS.slut + 0.1, ANDAS.slut + 1.0);
  AKTER.zenAndas = {
    len: ANDAS.len, in: 0.4, ut: 0.4,
    hand: (o, A, t, l) => {
      const mal = handUpp(o, A, 9, 15);
      mal.p.y += 0.8 * andasIn(l);
      return zenHand(o, A, t, bump(l, ANDAS.ner, ANDAS.bord, ANDAS.len - 1.4, ANDAS.len - 0.5), mal, andasK(l));
    },
    fing: (o, A, l) => ({ form: MUDRA, k: andasK(l) }),
    kropp: (o, t, l, x) => {
      const e = bump(l, 0.8, 2.2, ANDAS.slut, ANDAS.slut + 1.2);
      const a = andasIn(l);
      const ut = { lean: -0.04 * e, pitch: (0.12 - 0.17 * a) * e, lift: 2.4 * a, breath: 0.08 * a - 0.02 * e, knee: [-0.05 * e, -0.05 * e] };
      // c kikar: på a, sedan på b, med huvudet lite upp
      const R = roller(x);
      if (FI(o) !== R.c) return ut;
      const [k0, k1] = ANDAS.kik;
      return { ...ut, pitch: ut.pitch - 0.08 * bump(l, k0, k0 + 0.4, k1 - 0.4, k1), se: huvudPa(l < (k0 + k1) / 2 ? R.a : R.b), seW: 0.5 * bump(l, k0 + 0.1, k0 + 0.5, k1 - 0.5, k1 - 0.1) };
    },
    blund: (o, x) => x.l > ANDAS.upp && x.l < ANDAS.slut + 0.3 && !(FI(o) === roller(x).c && x.l > ANDAS.kik[0] && x.l < ANDAS.kik[1]),
  };

  // Dagdrömmen: händerna i nacken, bakåtlutad, blicken som vandrar i taket och benen
  // som dinglar sakta. a slumrar till (huvudet sjunker), vaknar med ett ryck och
  // tittar sig omkring; b tittar på hen och skakar på huvudet; c blundar en stund.
  const DROM = { ner: 0.3, bord: 1.1, upp: 2.2, somn: [5.8, 9.4], ryck: 9.6, slut: 15.4, len: 17.4 };
  const dromK = (l) => bump(l, DROM.bord, DROM.upp, DROM.slut, DROM.slut + 1.0);
  AKTER.zenDrom = {
    len: DROM.len, in: 0.4, ut: 0.4,
    hand: (o, A, t, l) => zenHand(o, A, t, bump(l, DROM.ner, DROM.bord, DROM.len - 1.4, DROM.len - 0.5), iNacken(o, A), dromK(l)),
    fing: (o, A, l) => ({ form: FLATAD, k: dromK(l) }),
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      const e = bump(l, 1.0, 2.6, DROM.slut - 0.4, DROM.slut + 1.0);
      const g = 0.5 + i * 1.9;
      const ut = {
        lean: -0.16 * e,
        pitch: (-0.26 + 0.05 * Math.sin(l * 0.47 + g)) * e,
        yaw: 0.22 * Math.sin(l * 0.29 + g) * e,
        knee: [0.2 * Math.sin(l * 1.2 + g) * e, 0.2 * Math.sin(l * 1.2 + g + 1.5) * e],
      };
      if (i === R.a) {
        // somnar: huvudet sjunker framåt, och rycket: bakåt och upp, och blicken på de andra
        const [s0, s1] = DROM.somn;
        const sov = sm(s0, s1, l) * (1 - sm(DROM.ryck, DROM.ryck + 0.12, l));
        const ryck = bump(l, DROM.ryck, DROM.ryck + 0.1, DROM.ryck + 0.25, DROM.ryck + 0.7);
        const r = DROM.ryck;
        ut.pitch += 0.62 * sov - 0.12 * ryck;
        ut.yaw *= 1 - Math.max(sov, sm(r, r + 0.3, l) * (1 - sm(r + 2.6, r + 3.4, l)));
        ut.lift = 3.5 * ryck;
        ut.knee = ut.knee.map((k) => k * (1 - sov) + 0.25 * ryck);
        return { ...ut, se: huvudPa(l < r + 1.4 ? R.b : R.c), seW: 0.6 * bump(l, r + 0.3, r + 0.6, r + 2.6, r + 3.4) };
      }
      if (i === R.b) {
        const r = DROM.ryck;
        const kv = bump(l, r + 0.3, r + 0.7, r + 2.8, r + 3.5);
        return { ...ut, yaw: ut.yaw * (1 - kv) + 0.14 * Math.sin((l - r) * 7) * bump(l, r + 1.0, r + 1.3, r + 2.2, r + 2.6), se: huvudPa(R.a), seW: 0.85 * kv };
      }
      return ut;
    },
    blund: (o, x) => {
      const R = roller(x);
      const i = FI(o);
      if (i === R.a) return x.l > DROM.somn[0] - 0.4 && x.l < DROM.ryck;
      return i === R.c && x.l > 4.0 && x.l < 12.6;
    },
  };

  // Rökringarna: den ena som röker (DT eller DJ, efter rollerna) tar ett djupt bloss,
  // lutar huvudet bakåt och blåser tre ringar, en åt gången; en stund senare gör den
  // andra likadant. De andra följer den senaste ringen med blicken, och den som inte
  // röker (DL) petar sönder den sista med pekfingret – och de två tittar på varandra.
  const RINGAR = { s: [0.5, 5.6], blas: [2.4, 3.15, 3.9], pet: 2.0, len: 16.6 };
  const rokArm = (o) => o.arms.find((A) => A.cig);
  function rokOrdning(x) {
    const r = figs.filter(rokArm);
    return roller(x).a % 2 ? [r[1], r[0]] : r;
  }
  const ringTider = (j) => RINGAR.blas.map((b) => RINGAR.s[j] + b);
  const ringPet = () => ringTider(1)[2] + RINGAR.pet;
  // Den yngsta ringen som syns ({ p, … } ur ringLage), för blickarna.
  function nyssRing(x, t) {
    let bast = null;
    rokOrdning(x).forEach((o, j) => ringTider(j).forEach((b, i) => {
      const L = ringLage(o, x, i, t);
      if (L && L.age < 3.8 && L.brist < 0.5 && (!bast || L.age < bast.age)) bast = L;
    }));
    return bast;
  }
  AKTER.zenRingar = {
    len: RINGAR.len, in: 0.6, ut: 1.0,
    ringar: (o, x) => { const j = rokOrdning(x).indexOf(o); return j < 0 ? null : ringTider(j); },
    stick: (o, x, i) => (rokOrdning(x).indexOf(o) === 1 && i === 2 ? ringPet() : null),
    hand: (o, A, t, l, x) => {
      const j = rokOrdning(x).indexOf(o);
      if (j >= 0) {
        if (A !== rokArm(o)) return null;
        const s = RINGAR.s[j];
        const dw = bump(l, s, s + 0.8, s + 1.6, s + 2.2);
        return dw > 0 ? lerpPose(handRest(o, A, t), blossAt(o, A), dw) : null;
      }
      // den som inte röker: pekfingret till där den sista ringen är när den brister
      if (A !== fri(o)) return null;
      const pt = ringPet();
      const pk = bump(l, pt - 0.9, pt - 0.1, pt + 0.4, pt + 1.2);
      const L = pk > 0 ? ringLage(rokOrdning(x)[1], x, 2, x.t0 + pt) : null;
      if (!L) return null;
      const S0 = shoulder(o, A);
      const P = iFig(o, L.p);
      const dir = P.clone().sub(S0);
      const n = o.F.a + o.F.b;
      const len = dir.length();
      dir.normalize();
      const z = new THREE.Vector3(0, 1, 0).addScaledVector(dir, -dir.y).normalize();
      const mal = { p: S0.clone().addScaledVector(dir, Math.min(len - o.F.arm * ZEN_STOR * 3.4, n * 0.95)), y: dir, z, pole: new THREE.Vector3(A.s, -0.6, -0.3) };
      return lerpPose(handRest(o, A, t), mal, pk);
    },
    fing: (o, A, l, x) => {
      if (rokOrdning(x).includes(o) || A !== fri(o)) return null;
      const pt = ringPet();
      return { form: PEK, k: bump(l, pt - 0.9, pt - 0.1, pt + 0.4, pt + 1.2) };
    },
    glod: (o, l, x) => {
      const j = rokOrdning(x).indexOf(o);
      if (j < 0) return 0;
      const s = RINGAR.s[j];
      return bump(l, s + 0.7, s + 1.0, s + 1.6, s + 1.9);
    },
    kropp: (o, t, l, x) => {
      const ro = rokOrdning(x);
      const j = ro.indexOf(o);
      const pt = ringPet();
      const ut = { lean: -0.04 * bump(l, 0.4, 1.4, RINGAR.len - 1.6, RINGAR.len - 0.6) };
      const r = nyssRing(x, t);
      if (j >= 0) {
        const s = RINGAR.s[j];
        const tider = ringTider(j);
        // huvudet bakåt efter blosset, och en liten stöt framåt för varje ring
        ut.pitch = -0.3 * bump(l, s + 1.8, s + 2.3, tider[2] + 0.4, tider[2] + 1.2)
          + tider.reduce((a, b) => a + 0.07 * bump(l, b - 0.16, b - 0.05, b + 0.04, b + 0.3), 0);
        // (bakom bordet vänd mot betraktaren: huvudet åt sidan, så att ringarna inte far över ansiktet)
        ut.yaw = (o.F.plats === PLATSER[1] ? 0.6 : 0) * bump(l, s + 1.6, s + 2.2, tider[2] + 0.4, tider[2] + 1.2);
        const blaser = l > s + 1.8 && l < tider[2] + 0.3;
        if (j === 1 && l > pt + 0.2) {
          const k = bump(l, pt + 0.3, pt + 0.7, pt + 2.4, pt + 3.0);
          return { ...ut, se: huvudPa(FI(figs.find((q) => !ro.includes(q)))), seW: 0.6 * k };
        }
        if (!blaser && r) return { ...ut, se: r.p, seW: 0.75 };
        if (l < s && j === 1) return { ...ut, se: huvudPa(FI(ro[0])), seW: 0.6 * bump(l, s - 4.6, s - 4.2, s - 0.6, s) };
        return ut;
      }
      // den som inte röker: följer ringarna, lutar sig fram när hen petar och tittar sedan på den som blåste
      const pk = bump(l, pt - 0.9, pt - 0.1, pt + 0.4, pt + 1.2);
      ut.lean += 0.08 * pk;
      ut.mitt = true;
      if (l > pt + 0.2) return { ...ut, se: huvudPa(FI(ro[1])), seW: 0.6 * bump(l, pt + 0.3, pt + 0.7, pt + 2.4, pt + 3.0) };
      if (r) return { ...ut, se: r.p, seW: 0.8 };
      return { ...ut, se: huvudPa(FI(ro[0])), seW: 0.6 * bump(l, 0.3, 0.8, RINGAR.s[0] + 2, RINGAR.s[0] + 2.5) };
    },
  };

  // Vaggar: sakta från sida till sida med slutna ögon (VAGG.per sekunder fram och
  // tillbaka, i samma takt för alla), huvudet på sned med vaggningen, benen med och
  // den lediga handen som flyter i luften. a börjar, b och c tittar på hen och faller
  // in, och efteråt öppnar de ögonen, tittar på varandra och nickar.
  const VAGG = { per: 3.8, in: [0.6, 2.6, 4.4], slut: 12.6, len: 16.4 };
  const vaggW = (l, j) => sm(VAGG.in[j], VAGG.in[j] + 1.4, l) * (1 - sm(VAGG.slut, VAGG.slut + 1.2, l));
  AKTER.zenVaggar = {
    len: VAGG.len, in: 0.6, ut: 1.0,
    hand: (o, A, t, l, x) => {
      if (A !== fri(o)) return null;
      const j = rollNr(roller(x), FI(o));
      const w = vaggW(l, j);
      if (w <= 0) return null;
      const s = Math.sin((2 * Math.PI * l) / VAGG.per);
      const n = o.F.a + o.F.b;
      const { mot, tvar } = motBord(o);
      const p = shoulder(o, A).addScaledVector(mot, n * 0.4).addScaledVector(tvar, A.s * (n * 0.12 + 4 * s)).add(new THREE.Vector3(0, -n * 0.24 + 2.5 * Math.sin((4 * Math.PI * l) / VAGG.per), 0));
      const y = mot.clone().addScaledVector(tvar, 0.25 * s).add(new THREE.Vector3(0, -0.1 + 0.12 * s, 0));
      return lerpPose(handRest(o, A, t), { p, y, z: new THREE.Vector3(0.12 * s, 1, 0.05), pole: new THREE.Vector3(A.s, -0.6, -0.4) }, w);
    },
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const i = FI(o);
      const j = rollNr(R, i);
      const w = vaggW(l, j);
      const s = Math.sin((2 * Math.PI * l) / VAGG.per);
      const ut = { side: 0.08 * s * w, roll: 0.17 * s * w, twist: 0.03 * s * w, lean: -0.03 * w, pitch: 0.05 * w, knee: [0.14 * s * w, -0.14 * s * w] };
      // efteråt: blicken på nästa, och en nick
      const efter = bump(l, VAGG.slut + 0.3, VAGG.slut + 0.8, VAGG.len - 1.4, VAGG.len - 0.8);
      if (efter > 0) return { ...ut, pitch: ut.pitch + 0.12 * bump(l, VAGG.slut + 1.3, VAGG.slut + 1.6, VAGG.slut + 1.8, VAGG.slut + 2.3), se: huvudPa(rollVem(R, (j + 1) % 3)), seW: 0.6 * efter };
      // innan man faller in: blicken på den som har börjat
      if (j > 0 && l < VAGG.in[j] + 0.4) return { ...ut, se: huvudPa(R.a), seW: 0.75 * bump(l, 0.9, 1.3, VAGG.in[j] - 0.1, VAGG.in[j] + 0.4) };
      return ut;
    },
    blund: (o, x) => {
      const j = rollNr(roller(x), FI(o));
      return x.l > VAGG.in[j] + 0.6 && x.l < VAGG.slut + 0.3;
    },
  };

  // Tystnaden: blicken ut i fjärran (var och en åt sitt håll, förbi den som tittar),
  // en djup suck tillsammans – axlarna upp och ner – och en klunk var (DT ett bloss),
  // en i taget, och sedan bakåtlutad en stund.
  const TYST = { blick: [0.6, 2.2], suck: 3.8, klunk: [6.6, 8.6, 10.6], slut: 13.0, len: 15.2 };
  const tystKlunk = (l, j) => { const s = TYST.klunk[j]; return bump(l, s, s + 0.7, s + 1.5, s + 2.2); };
  AKTER.zenTyst = {
    len: TYST.len, in: 0.6, ut: 1.0,
    hand: (o, A, t, l, x) => {
      if (A !== skalArm(o)) return null;
      const dw = tystKlunk(l, rollNr(roller(x), FI(o)));
      return dw > 0 ? lerpPose(handRest(o, A, t), A.thing ? supAt(o, A, t, dw) : blossAt(o, A), dw) : null;
    },
    glod: (o, l, x) => {
      if (skalArm(o).thing) return 0;
      const s = TYST.klunk[rollNr(roller(x), FI(o))];
      return bump(l, s + 0.7, s + 1.0, s + 1.5, s + 1.8);
    },
    blas: (o, l, x) => {
      if (skalArm(o).thing) return 0;
      const s = TYST.klunk[rollNr(roller(x), FI(o))];
      return bump(l, s + 2.0, s + 2.3, s + 3.0, s + 3.6);
    },
    kropp: (o, t, l, x) => {
      const i = FI(o);
      const dw = tystKlunk(l, rollNr(roller(x), i));
      const su = TYST.suck;
      const e = bump(l, TYST.blick[0], TYST.blick[1], TYST.slut, TYST.slut + 1.4);
      const fjarran = new THREE.Vector3(BORD.x + 320 * (i - 1), 420, 2800);
      return {
        lean: -0.07 * e - (skalArm(o).thing ? 0.12 * dw : 0),
        pitch: 0.08 * bump(l, su + 1.2, su + 1.8, su + 2.6, su + 3.6) - 0.06 * bump(l, su, su + 1.0, su + 1.2, su + 1.8) + (skalArm(o).thing ? -0.38 * dw : 0.06 * dw),
        lift: 2.6 * bump(l, su, su + 1.0, su + 1.2, su + 2.0),
        breath: 0.08 * bump(l, su, su + 1.0, su + 1.2, su + 1.9) - 0.04 * bump(l, su + 1.4, su + 2.0, su + 2.6, su + 3.4),
        knee: [0.1 * Math.sin(l * 1.05 + i) * e, 0.1 * Math.sin(l * 1.05 + i + 1.8) * e],
        se: fjarran,
        seW: 0.8 * e * (1 - dw),
      };
    },
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
    return v && !v.d.sak ? korsUpp(v.d, v.l) * x.wh : 0;
  }
  // Handen med fingrar just nu, för pose.
  function korsFingrar(o, t) {
    const x = aktNu(o, t);
    const v = korsDel(o, x);
    if (!v || v.d.sak) return null;
    const k = korsUpp(v.d, v.l) * x.wh;
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

  // ---------- dygnet ----------
  // Klockan i Stockholm (ute: Vader.nu()) ger påhitt efter tiden på dygnet, utöver humörets
  // (dygnVal i egen, DYGN_MENY): på morgonen sträcker de på sig med en stor gäspning
  // (morgon), gnuggar sig i ögonen (gnugga) och rullar på nacken (nackrull); efter lunch
  // klappar de sig på magen (magen); på eftermiddagen nickar någon till och rycker upp
  // och tittar sig omkring som om inget hänt (nickarTill); och på kvällen – och när
  // någon har väckts mitt i natten – gäspar de med handen för munnen (gaspa), gnuggar
  // ögonen och sträcker på sig. Sent på kvällen smittar gäspningen (gaspSmitta, GRUPP):
  // en gäspar, nästa ser det och gäspar, och den tredje försöker låta bli men gäspar ändå.
  // DYGN: klockan som timmar (h) vid t, räknad fram med t så att samma t ger samma bild.
  const DYGN = { h: null, t: 0 };
  const dygnH = (t) => (DYGN.h == null ? null : (((DYGN.h + (t - DYGN.t) / 3600) % 24) + 24) % 24);
  function dygnSatt(v, t) {
    if (!v || v.timme == null) return;
    const h = v.timme + (v.minut || 0) / 60;
    const nu = dygnH(t);
    // (bara när klockan har sprungit ifrån, t.ex. efter att datorn sovit)
    if (nu == null || Math.abs((((h - nu) % 24) + 36) % 24 - 12) > 0.05) { DYGN.h = h; DYGN.t = t; }
  }
  // hur mycket det är morgon, lunch, eftermiddag och kväll vid h (0–1)
  const dygnFas = (h) => ({
    morgon: bump(h, 6.8, 7.2, 9.2, 10.3),
    lunch: bump(h, 11.6, 12.1, 13.2, 13.8),
    efter: bump(h, 14.1, 14.7, 16.2, 17),
    kvall: h >= 12 ? sm(19.6, 21.4, h) : 1 - sm(6.6, 7.4, h),
  });
  // per lucka (AKT_SLOT) och person: chansen när det är fullt ut morgon …, och vad
  const DYGN_MENY = {
    morgon: { chans: 0.065, val: ['morgon', 'morgon', 'gnugga', 'nackrull', 'gaspa'] },
    lunch: { chans: 0.04, val: ['magen'] },
    efter: { chans: 0.045, val: ['nickarTill', 'nickarTill', 'gaspa'] },
    kvall: { chans: 0.06, val: ['gaspa', 'gaspa', 'gnugga', 'strack'] },
  };
  // (medan matcherna pågår bara en gäspning)
  function dygnVal(o, n, i, t0) {
    const h = dygnH(t0);
    if (h == null) return null;
    const F = dygnFas(h);
    const r = hash(n * 5.37 + i * 2.9 + 0.83);
    let acc = 0;
    for (const [k, M] of Object.entries(DYGN_MENY)) {
      if (r >= (acc += M.chans * F[k])) continue;
      const v = M.val[Math.floor(hash(n * 6.11 + i * 1.7 + 0.29) * M.val.length)];
      return tvW(t0) > 0.5 && v !== 'gaspa' ? null : v;
    }
    return null;
  }
  // gäspningen smittar (GRUPP), per lucka: sent på kvällen och lite på morgonen
  const gaspChansAt = (t0) => { const h = dygnH(t0); if (h == null) return 0; const F = dygnFas(h); return 0.07 * F.kvall * sm(20.5, 21.5, h >= 12 ? h : 24) + 0.025 * F.morgon; };

  // En gäspning, l sekunder in (GASP.len): huvudet bakåt medan hen andas in, munnen öppen
  // (gäspansiktet med ögonen hopknipna, gaspMun och gaspW) och handen för munnen (gaspHandK),
  // och sedan en lång utandning.
  const GASP = { len: 4.6 };
  const gaspMun = (l) => bump(l, 0.6, 0.85, 2.9, 3.15);
  const gaspHandK = (l) => bump(l, 0.8, 1.4, 2.9, 3.6);
  // Medan handen är för munnen vänder hen ansiktet lite mot den och lutar huvudet mindre
  // bakåt (munnen ligger annars precis där armen inte når, som pannan).
  function gaspKropp(o, l) {
    const i = bump(l, 0, 0.9, 2.5, 3.2);
    const u = bump(l, 2.8, 3.4, 3.9, 4.6);
    const h = gaspHandK(l) * fri(o).s;
    return { pitch: -0.24 * i + 0.05 * u + 0.12 * Math.abs(h), lean: -0.06 * i + 0.03 * u, breath: 0.07 * i - 0.03 * u, lift: 1.2 * i, yaw: 0.24 * h, roll: -0.06 * h };
  }
  // handflatan för munnen, fingrarna snett uppåt och tvärs över mot andra sidan
  function gaspHand(o, A) {
    const s = A.s;
    const d = huvudAxlar(o);
    const P = mouthIn(o).addScaledVector(d(0, 0, 1), 1.5).addScaledVector(d(1, 0, 0), s * 4);
    return handflata(o, P, d(-s * 0.6, 0.72, 0.1), d(s * 0.1, 0.05, 1), new THREE.Vector3(s, -0.8, 0.1));
  }
  AKTER.gaspa = {
    len: 5.6, in: 0.7, ut: 0.9,
    hand: (o, A, t, l) => (A === fri(o) && gaspHandK(l - 0.5) > 0 ? lerpPose(handRest(o, A, t), gaspHand(o, A), gaspHandK(l - 0.5)) : null),
    kropp: (o, t, l) => gaspKropp(o, l - 0.5),
    gasp: (o, t, l) => gaspMun(l - 0.5),
  };

  // Morgonens sträckning: armarna högt upp och ut och darrar till, ryggen bakåt, en stor
  // gäspning utan hand för munnen – och en liten skakning på huvudet efteråt.
  AKTER.morgon = {
    len: 6.6, in: 1.2, ut: 1.3,
    hand: (o, A, t, l) => {
      const h = upp(o, A, 0.42, 0.85, -0.06);
      h.p.y += 0.5 * Math.sin(l * 7) * bump(l, 2.0, 2.5, 3.6, 4.2);
      return h;
    },
    kropp: (o, t, l) => {
      const g = bump(l, 0.8, 1.9, 3.8, 5.0);
      const sk = bump(l, 4.8, 5.1, 5.6, 6.0);
      return { lean: -0.16 * g, pitch: -0.36 * g, breath: 0.07 * g, lift: 1.5 * g, yaw: 0.14 * Math.sin((l - 4.8) * 9) * sk };
    },
    gasp: (o, t, l) => bump(l, 1.9, 2.1, 3.8, 4.0),
  };

  // Knogarna mot ögonen och gnuggar, sakta, med ögonen stängda (som i uppvaknandet).
  AKTER.gnugga = {
    len: 4.8, in: 1.0, ut: 1.0,
    hand: (o, A, t, l) => {
      if (A !== fri(o)) return null;
      const s = A.s;
      const P = o.F.head;
      const d = huvudAxlar(o);
      const at = inHead(o, new THREE.Vector3(s * P.rx * 0.22 + 1.5 * Math.sin(l * 8), P.ry * 0.06 + 0.8 * Math.sin(l * 6), P.rz * 0.96 + o.F.arm * 1.05));
      return { p: at, y: d(-s * 0.3, 1, -0.1), z: d(0, 0, 1), pole: new THREE.Vector3(s, -0.7, 0.3) };
    },
    kropp: () => ({ lean: 0.06, pitch: 0.14 }),
    blund: (o, x) => x.l > 0.8 && x.l < 4.0,
  };

  // Rullar sakta på nacken, två varv med ögonen stängda, och drar upp axlarna först.
  const RULL = { start: 1.0, per: 3.0, n: 2 };
  AKTER.nackrull = {
    len: RULL.start + RULL.n * RULL.per + 1.4, in: 0.9, ut: 1.0,
    kropp: (o, t, l) => {
      const k = bump(l, RULL.start - 0.3, RULL.start + 0.6, RULL.start + RULL.n * RULL.per - 0.4, RULL.start + RULL.n * RULL.per + 0.4);
      const f = (2 * Math.PI * (l - RULL.start)) / RULL.per;
      const ax = bump(l, 0.1, 0.6, 0.9, 1.4);
      return { pitch: (0.04 + 0.17 * Math.cos(f)) * k, roll: 0.2 * Math.sin(f) * k, lift: 2.2 * ax, breath: 0.05 * ax };
    },
    blund: (o, x) => x.l > RULL.start && x.l < RULL.start + RULL.n * RULL.per,
  };

  // Mätt efter lunchen: bakåtlutad med handen på magen som klappar två gånger två, och en
  // nöjd utandning.
  AKTER.magen = {
    len: 7, in: 1.2, ut: 1.2,
    hand: (o, A, t, l) => {
      if (A !== fri(o)) return null;
      const s = A.s;
      const d = balAxlar(o);
      const klapp = Math.max(0, Math.sin((l - 1.6) * 7.5)) ** 2 * (bump(l, 1.6, 1.7, 3.2, 3.4) + bump(l, 4.1, 4.2, 5.4, 5.6));
      return handflata(o, iBal(o, new THREE.Vector3(-s * o.F.w * 0.08, o.T * 0.5, o.F.depth * 1.0 + 4.5 * klapp)), d(-s, 0.25, 0.15), d(0.1, 0, 1), new THREE.Vector3(s, -0.5, 0.3));
    },
    kropp: (o, t, l) => {
      const u = bump(l, 3.4, 3.8, 4.2, 4.8);
      return { lean: -0.17, pitch: -0.02 - 0.06 * u, breath: 0.04 - 0.06 * u };
    },
  };

  // Eftermiddagen: huvudet sjunker sakta med ögonen stängda, rycker upp, och hen tittar sig
  // omkring med öppna ögon som om inget hänt.
  const NICK_TILL = { ryck: 3.7, slut: 6.4 };
  AKTER.nickarTill = {
    len: 7.6, in: 0.8, ut: 1.0,
    kropp: (o, t, l) => {
      const r = NICK_TILL.ryck;
      const ner = sm(0.6, r - 0.2, l) * (1 - sm(r, r + 0.22, l));
      const upp = bump(l, r, r + 0.12, r + 0.25, r + 0.7);
      const se = bump(l, r + 0.4, r + 0.8, NICK_TILL.slut - 0.6, NICK_TILL.slut);
      return { pitch: 0.48 * ner - 0.12 * upp, lean: 0.08 * ner, roll: 0.07 * ner * (FI(o) % 2 ? 1 : -1), lift: 2.2 * upp, yaw: 0.32 * Math.sin((l - r - 0.4) * 2.6) * se, breath: -0.03 * ner };
    },
    blund: (o, x) => x.l > 1.3 && x.l < NICK_TILL.ryck,
  };

  // Gäspningen smittar: a gäspar, b ser det och gäspar, c ser på b, försöker låta bli
  // (huvudet ner och en liten skakning) men gäspar ändå – och skakar på huvudet åt sig själv.
  const SMITTGASP = [0.6, 3.9, 7.1];
  const gaspFor = (x, o) => SMITTGASP[rollNr(roller(x), FI(o))];
  AKTER.gaspSmitta = {
    len: 12.6, in: 0.4, ut: 0.7,
    hand: (o, A, t, l, x) => {
      const k = gaspHandK(l - gaspFor(x, o));
      return A === fri(o) && k > 0 ? lerpPose(handRest(o, A, t), gaspHand(o, A), k) : null;
    },
    kropp: (o, t, l, x) => {
      const R = roller(x);
      const j = rollNr(R, FI(o));
      const g0 = SMITTGASP[j];
      const ut = gaspKropp(o, l - g0);
      if (j === 0) return ut;
      // (tittar på den som gäspade före en, tills det är ens egen tur)
      const fore = rollVem(R, j - 1);
      const se = { se: huvudPa(fore), seW: 0.8 * bump(l, SMITTGASP[j - 1] + 0.4, SMITTGASP[j - 1] + 0.9, g0 - 0.3, g0 + 0.2) };
      if (j === 1) return { ...ut, ...se };
      const emot = bump(l, g0 - 1.5, g0 - 1.1, g0 - 0.2, g0 + 0.1);
      const efter = bump(l, g0 + GASP.len - 0.4, g0 + GASP.len, g0 + GASP.len + 0.6, g0 + GASP.len + 1.0);
      return { ...ut, ...se, pitch: ut.pitch + 0.08 * emot, yaw: 0.08 * Math.sin(l * 8) * emot + 0.12 * Math.sin(l * 8) * efter, breath: ut.breath - 0.02 * emot };
    },
    gasp: (o, t, l, x) => gaspMun(l - gaspFor(x, o)),
  };

  // ---------- dansen ----------
  // När radion spelar dansar de (DANSER i rum-dans.js): ner med det som är i händerna, som i
  // korstecknet, och upp med händerna med fingrar. Den som håller upp sin skylt dansar med
  // den i handen (pose). Allt står i bildens axlar (bildAxlar), utom det som rör kroppen.
  const DANS_STOR = 1.12;
  const dansB = (l) => (l - DANS_IN) / DANS_SLAG;
  // Det dansen behöver veta (rum-dans.js): rollerna, vem, radions lucka och armen – och dansen
  // före och efter när två danser följer på varandra (granne).
  function dansV(o, A, x, granne = true) {
    const R = roller(x);
    const i = FI(o);
    const v = {
      rol: i === R.a ? 0 : i === R.b ? 1 : 2, a: R.a, vem: [R.a, R.b, R.c], i, t0: x.t0, k: x.k, fro: x.fro ?? 0, per: RADIO_SLOT / DANS_SLAG,
      sang: A && A === sangArm(o), skal: A && A === skalArm(o), ting: Boolean(A && A.bench), flaskan: o.arms.some((B) => B.thing),
    };
    if (granne && x.forra) v.forra = { d: DANSER[x.forra], v: dansV(o, A, { t0: x.t0 - RADIO_SLOT, k: x.k - 1, fro: x.fro }, false) };
    if (granne && x.nasta) v.nasta = { d: DANSER[x.nasta], v: dansV(o, A, { t0: x.t0 + RADIO_SLOT, k: x.k + 1, fro: x.fro }, false) };
    return v;
  }
  function dansPose(o, A, L, v) {
    if (L.till) return lerpPose(dansPose(o, A, L.fran, v), dansPose(o, A, L.till, v), L.k);
    const s = A.s;
    const n = o.F.a + o.F.b;
    const S = shoulder(o, A);
    // det som är i handen ner på bordet (på väg mellan två danser)
    if (L.bank && A.bench) return grip(A.bench.matrix, (A.thing || A.cig).matrix, new THREE.Vector3(A.s, -0.4, -0.6));
    // handen platt på bordet, lyft en bit
    if (L.bord) return paBordet(o, A, L.bord[0], L.bord[1], L.bord[2] || 0);
    // flaskan (eller näven) som mikrofon, framför munnen
    if (L.mik) {
      const h = huvudAxlar(o);
      const m = mouthIn(o).addScaledVector(h(0, 0, 1), 7).addScaledVector(h(0, 1, 0), -7);
      const y = new THREE.Vector3(s * 0.14, 0.9, 0.42).normalize();
      if (A.thing) return { p: m.addScaledVector(y, -A.thing.userData.top), y, z: new THREE.Vector3(-s * 0.55, -0.75, -0.3), pole: new THREE.Vector3(s, -0.6, -0.2) };
      return { p: m.addScaledVector(y, -o.F.arm * DANS_STOR * 2.4), y, z: new THREE.Vector3(s * 0.8, -0.2, 0.3), pole: new THREE.Vector3(s, -0.6, -0.2) };
    }
    // armen mot någons huvud (mot: 1, vem: figuren, annars sångaren), vriden och med rekyl
    if (L.mot) {
      const e = pekaPa(o, A, huvudPa(L.vem ?? v.a), 0.82, L.lyft || 0);
      if (L.vrid) e.z.applyAxisAngle(e.y, L.vrid * s);
      return e;
    }
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
    let P;
    if (L.fram) {
      // handleden en bit från munnen (instrumenten), i huvudets axlar
      const h = huvudAxlar(o);
      P = mouthIn(o).addScaledVector(h(1, 0, 0), s * L.fram[0]).addScaledVector(h(0, 1, 0), L.fram[1]).addScaledVector(h(0, 0, 1), L.fram[2]);
    } else P = (L.m ? S.clone().lerp(shoulder(o, o.arms.find((b) => b !== A)), 0.5) : S.clone()).addScaledVector(V(L.p), n);
    if (L.mun > 0) P.lerp(mouthIn(o).add(new THREE.Vector3(0, -2, 3)).addScaledVector(y, -o.F.arm * DANS_STOR * 3.2), L.mun);
    // (armen töjs inte: dit den når)
    const ut = P.clone().sub(S);
    if (ut.length() > n * 0.97) P.copy(S).addScaledVector(ut.normalize(), n * 0.97);
    if (L.vrid) z.applyAxisAngle(y, L.vrid * s);
    if (L.vink) y.applyAxisAngle(z, L.vink * s);
    return { p: P, y, z, pole: V(L.pole || [1, -0.7, -0.3]) };
  }
  // upp (rum-dans.js, 0–1): först ner med det som är i handen, sedan upp med armen
  const dansNer = (u) => sm(0, 0.4, u);
  const dansArm = (u) => sm(0.35, 1, u);
  // (armens ställning frågas efter flera gånger i varje bild: en gång per arm och bild, dansM)
  function dansArmNu(o, A, x, d) {
    const m = A.dansM || (A.dansM = {});
    if (m.l !== x.l || m.t0 !== x.t0 || m.d !== d) {
      m.l = x.l; m.t0 = x.t0; m.d = d;
      m.v = dansV(o, A, x);
      m.L = dansLage(d, dansB(x.l), A.s, m.v);
    }
    return m;
  }
  // (och kroppens: dansV utan arm, en gång per figur och bild)
  function dansVNu(o, x) {
    const m = o.dansM || (o.dansM = {});
    if (m.l !== x.l || m.t0 !== x.t0) { m.l = x.l; m.t0 = x.t0; m.v = dansV(o, null, x); }
    return m.v;
  }
  function dansHand(o, A, t, l, x, d) {
    const { v, L } = dansArmNu(o, A, x, d);
    if (!L) return null;
    let ner = handRest(o, A, t);
    if (A.bench && !L.sak) ner = lerpPose(ner, grip(A.bench.matrix, (A.thing || A.cig).matrix, new THREE.Vector3(A.s, -0.4, -0.6)), dansNer(L.upp));
    const k = dansArm(L.upp);
    return k > 0 ? lerpPose(ner, dansPose(o, A, L, v), k) : ner;
  }
  // (bara när radion spelar eller nyss har spelat: annars kostar det ingenting)
  const dansKan = (o, t) => t >= SJUNG.radio.fran && (t < SJUNG.radio.till + 2 || SJUNG.radio.pa) || PROV[o.F.key];
  // Handen med fingrar just nu (null: den vanliga, med det som är i den), för pose.
  function dansFingrar(o, A, t) {
    const x = dansKan(o, t) && aktNu(o, t);
    if (!x || !x.a.dans) return null;
    const { L } = dansArmNu(o, A, x, x.a.dans);
    if (!L || (L.sak && (A.thing || A.cig))) return null;
    const k = dansArm(L.upp) * x.wh;
    return k > 0.02 ? { form: blanda(LOS, formen(L), sm(0.1, 0.7, k)), stor: 1 + (DANS_STOR - 1) * sm(0, 0.6, k) } : null;
  }
  // Hur högt armen är (glöden i cigaretten som ligger).
  function dansK(o, A, t) {
    const x = dansKan(o, t) && aktNu(o, t);
    if (!x || !x.a.dans) return 0;
    const { L } = dansArmNu(o, A, x, x.a.dans);
    return L && !L.sak ? dansArm(L.upp) * x.wh : 0;
  }
  // Varvet på barstolen, i grader.
  function dansSnurr(o, t) {
    const x = dansKan(o, t) && aktNu(o, t);
    if (!x || !x.a.dans) return 0;
    return dansVarv(x.a.dans, dansB(x.l), dansVNu(o, x)) * x.w;
  }
  // Takten i kroppen så länge radion spelar och ingen dans eller sång pågår: var och en på
  // sitt sätt (dansStil) och när hen hör den (efter en stund), också mellan sångerna.
  function radioGung(o, t, ak) {
    const R = SJUNG.radio;
    const i = FI(o);
    const d0 = R.fran + 0.3 + 1.6 * hash(R.fran * 0.37 + i * 5.1);
    const w = sm(d0, d0 + 1.4, t) * (1 - sm(R.till, R.till + 1.2, t)) * (1 - (ak ? ak.w : 0));
    if (w < 0.01) return null;
    return dansGung((t - R.fran - RADIO_IN - DANS_IN) / DANS_SLAG - 0.02 - 0.1 * hash(R.fran * 0.77 + i * 3.9 + 0.3), dansStil(R.fran, i), w * vaken(o, t));
  }
  // (radions luckor är lika långa som dansen får vara: rum-dans.js räknar med dansens egen längd)
  for (const namn of Object.keys(DANSER)) {
    const d = DANSER[namn];
    AKTER[namn] = {
      len: RADIO_SLOT, in: 0.3, ut: 0.3, per: DANS_SLAG,
      dans: d,
      hand: (o, A, t, l, x) => dansHand(o, A, t, l, x, d),
      kropp: (o, t, l, x) => {
        const v = dansVNu(o, x);
        const b = dansKropp(d, dansB(l), v);
        const ut = { mitt: true, ...b };
        if (b.se === 'sangaren') ut.se = huvudPa(v.a);
        else if (typeof b.se === 'number') ut.se = huvudPa(b.se);
        return ut;
      },
      skratt: (o, t, l, x) => dansSjung(d, dansB(l), dansVNu(o, x)),
      blund: (o, x) => dansBlund(d, dansB(x.l), dansVNu(o, x)),
    };
  }

  // Hur mycket vem skrattar just nu (ansiktet med hopknipna ögon, draw).
  function skrattW(o, t) {
    const x = aktNu(o, t);
    return x && x.a.skratt ? x.a.skratt(o, t, x.l, x) * x.w : 0;
  }
  // och gäspar (gäspansiktet, ansiktsBild)
  function gaspW(o, t) {
    const x = aktNu(o, t);
    return x && x.a.gasp ? x.a.gasp(o, t, x.l, x) * x.w : 0;
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

  // Figuren vid t utom armarna: var den står (stalle, gaFlytta) – på stolen eller på väg – bålen
  // och huvudet (body) och huvudets form (huvudForm), som också grannarnas armar går runt (allaHuvuden).
  function stallKropp(o, t) {
    o.st = stalle(o, t);
    gaFlytta(o, o.st);
    body(o, t);
    o.torso.updateMatrix();
    o.fig.updateMatrix();
    o.huvForm = { t, K: huvudForm(o) };
  }
  // Figuren vid t (klar: utom armarna är den redan ställd, draw).
  function pose(o, t, klar = false) {
    if (!klar) stallKropp(o, t);
    const Ks = allaHuvuden(o, t);
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
    // (den som sover med huvudet på armarna har ställt flaskan på bordet)
    const lagt = sovStil(o) === 'bord' && sovW(o, t) > 0.2;
    // (handen som håller skylten först: den andra tar tag i den, lappAndra)
    for (const A of lp && lp.L.tva > 0 && lp.A !== o.arms[0] ? [o.arms[1], o.arms[0]] : o.arms) {
      const taken = u >= 0.55;
      if (A.pen) A.pen.visible = u < 0.28;
      if (A.kup) A.kup.visible = u < 0.3;
      if (A.bench) A.bench.visible = !taken;
      if (A.cig) A.cig.visible = taken;
      if (A.thing) {
        A.thing.visible = !(taken && lagt);
        if (taken && lagt) A.bench.visible = true;
      }
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
      if (tk && tk.A === A) hp = bage(hp, teckenPose(o, A, tk), tk.w);
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
      const fg = tk && tk.A === A && tk.w > TK_BYT ? { form: teckenHand(tk), stor: 1 + (TK_STOR - 1) * sm(TK_BYT, 0.8, tk.w) } : grepp > TK_BYT ? { form: blanda(LOS, LAPP_GREPP, sm(TK_BYT, 0.85, grepp)), stor: 1 + (TK_STOR - 1) * sm(TK_BYT, 0.8, grepp) * sm(0.05, 0.9, lp.lyft) } : ks && ks.A === A ? ks : dansFingrar(o, A, t) || aktFingrar(o, A, t);
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
      // handen ut ur huvudet, och armen runt det (huvudFri)
      const KA = armHuvuden(o, A, Ks);
      const fri = huvudFri(o, KA, A, H, hp);
      if (fri !== hp) {
        hp = fri;
        if (fg) orient(A.hand, hp.p, hp.y, hp.z);
      }
      orient(H, hp.p, hp.y, hp.z);
      if (iLapp && lp.lyft > 0) { H.updateMatrix(); lappStall(o, lp, H, fg && (!tk || tk.A !== A)); }
      // näven: handleden där den öppna handens handled var
      if (H === A.fist) H.position.sub(H.userData.wrist.clone().applyQuaternion(H.quaternion));
      H.updateMatrix();
      const Wr = H.userData.wrist.clone().applyMatrix4(H.matrix);
      const S = shoulder(o, A);
      const { E } = armbageFri(KA, A, S, Wr, o.F.a, o.F.b, hp.pole);
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
        // nerbrunnen i sömnen: askan grå och ingen glöd
        const slack = sovW(o, t);
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
  // Puffarna är en enda mesh som ritas på en gång, vända mot kameran som
  // spritar (som röken på pulten, ROK i rum-saker.js). Förut en sprite med
  // eget material per puff: ungefär 160 ritningar i varje bild av gänget, mer
  // än allt annat i gänget tillsammans på de lägre stegen, och det är
  // huvudtråden i en gammal telefon som betalar för dem. mitt: puffens mitt i
  // root; puff: storleken, genomskinligheten och hur den är vriden.
  const puffs = [];
  for (const sk of smokers) for (const src of ['glod', 'mun']) puffs.push({ sk, src, i0: puffs.length * SM.n, born: new Map() });
  const ROK = (() => {
    const n = Math.max(1, puffs.length * SM.n);
    const q = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = q.index;
    g.setAttribute('position', q.attributes.position);
    g.setAttribute('uv', q.attributes.uv);
    const attr = () => new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('mitt', attr());
    g.setAttribute('puff', attr());
    g.instanceCount = n;
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: smokeTex }, color: { value: new THREE.Color('#e4e6ea') } },
      vertexShader: `
        attribute vec3 mitt;
        attribute vec3 puff;
        varying vec2 vUv;
        varying float vA;
        void main() {
          vUv = uv;
          vA = puff.y;
          vec4 mv = modelViewMatrix * vec4(mitt, 1.0);
          vec2 p = position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz)) * puff.x;
          float s = sin(puff.z);
          float c = cos(puff.z);
          mv.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 color;
        varying vec2 vUv;
        varying float vA;
        void main() {
          vec4 t = texture2D(map, vUv);
          gl_FragColor = vec4(color * t.rgb, t.a * vA);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    root.add(mesh);
    return { mesh, mitt: g.attributes.mitt, puff: g.attributes.puff };
  })();
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
    const M = ROK.mitt.array;
    const P = ROK.puff.array;
    let syns = false;
    for (const { sk, src, i0, born } of puffs) {
      const o = sk.o;
      const base = Math.floor(t / SM.every);
      // var glöden (munnen) var när varje bloss föddes räknas en gång
      for (const k of born.keys()) if (k < base - SM.n || k > base) born.delete(k);
      for (let i = 0; i < SM.n; i++) {
        const j = (i0 + i) * 3;
        const k = base - i;
        const tb = k * SM.every;
        const age = t - tb;
        const seed = k * 7.13 + o.F.x;
        let alpha = 0;
        // ingen rök medan cigaretten ligger släckt och man väntar på kupongen
        if (src === 'glod') {
          const tk = teckenNu(o, tb);
          alpha = 0.8 * (1 - dragW(o, tb) * 0.7) * sm(0.55, 0.62, uOf(o, tb)) * (1 - sovW(o, tb)) * (tk && tk.A === sk.A ? 1 - tk.w : 1) * (sk.A === o.arms[0] ? 1 - korsK(o, tb) : 1) * (1 - dansK(o, sk.A, tb)) * (1 - aktFingK(o, sk.A, tb)) * (LP[o.F.key] && o.arms[LP[o.F.key].i] === sk.A && LP[o.F.key].ut == null && !LP[o.F.key].ner ? 0 : 1);
        }
        else {
          // utandningen: strax efter blosset (och det första efter inlämningen)
          // (inget bloss när man gjorde något annat, aktW, och ett efter blosset i skålen)
          const out = blossUt(o, tb);
          alpha = 0.85 * Math.max(ready(o, tb) * out * (1 - aktW(o, tb - 2)), after(o, tb, 3.0, 3.3, 4.4, 5.6), blasW(o, tb));
        }
        if (alpha < 0.01 || age < 0 || age > SM.life) { P[j] = P[j + 1] = 0; continue; }
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
        M[j] = fp.x;
        M[j + 1] = fp.y;
        M[j + 2] = fp.z;
        P[j] = src === 'glod' ? 3.2 + age * 5.5 + age * age * 0.7 : 9 + age * 14;
        P[j + 1] = alpha * Math.min(1, age * 4) * (1 - life) ** (src === 'glod' ? 1.8 : 1.3);
        P[j + 2] = hash(seed + 2) * 6 + age * 0.3;
        syns = true;
      }
    }
    // (ingen som röker just nu: inget att rita)
    ROK.mesh.visible = syns;
    ROK.mitt.needsUpdate = ROK.puff.needsUpdate = true;
  }

  // ---------- rökringarna ----------
  // Ringar som blåses i ett påhitt (AKTER[…].ringar: när, i sekunder in i det, för
  // den som röker; zenRingar). Var och en föds vid munnen och glider fram åt det
  // håll huvudet var vänt, saktar in, stiger, vidgas och bleknar – en skiva vänd
  // halvvägs mellan det håll den far och betraktaren, så att den syns snett men
  // aldrig från kanten. Var munnen var och hur
  // huvudet var vänt räknas en gång per ring (ringFodd, som emitter för röken), i
  // den ordning de föds, så att samma tid ger samma bild. En ring som petas
  // (AKTER[…].stick: när) brister: vidgas och försvinner.
  const RING = { liv: 5.6, n: 3, fart: 42, broms: 0.45 };
  const ringTex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(228,230,234,0)');
    gr.addColorStop(0.42, 'rgba(228,230,234,0.08)');
    gr.addColorStop(0.6, 'rgba(232,234,238,0.75)');
    gr.addColorStop(0.74, 'rgba(238,240,244,1)');
    gr.addColorStop(0.88, 'rgba(228,231,235,0.45)');
    gr.addColorStop(1, 'rgba(220,224,228,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
  const ringGeo = new THREE.PlaneGeometry(2, 2);
  const RING_Z = new THREE.Vector3(0, 0, 1);
  const RINGM = new Map();
  for (const o of figs) {
    if (!o.arms.some((A) => A.cig)) continue;
    RINGM.set(o, Array.from({ length: RING.n }, () => {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0, color: '#e4e6ea', toneMapped: false }));
      m.visible = false;
      root.add(m);
      return m;
    }));
  }
  const RING_F = new Map();
  const ringNyckel = (o, tb) => `${o.F.key}${tb.toFixed(3)}`;
  // Munnen och huvudets riktning när ringen föddes (i rummets axlar), och om
  // påhittet var i gång då (ok).
  function ringFodd(o, tb) {
    const k = ringNyckel(o, tb);
    if (RING_F.has(k)) return RING_F.get(k);
    pose(o, tb);
    o.fig.updateMatrix();
    const h = huvudAxlar(o);
    const x = aktNu(o, tb);
    const dir = h(0, 0.85, 1).transformDirection(o.fig.matrix).normalize();
    const f = { tb, p: mouthIn(o).addScaledVector(h(0, -0.1, 1), 3).applyMatrix4(o.fig.matrix), dir, vand: dir.clone().add(RING_Z).normalize(), ok: Boolean(x && x.w > 0.5) };
    RING_F.set(k, f);
    return f;
  }
  // Ring i av dem som o blåser i påhittet x, vid t: { p, r, age, brist, vand } eller
  // null. Räknar bara med ringar som redan är födda (ringFodd i ringar): blickarna
  // och handen frågar mitt i en ställning.
  function ringLage(o, x, i, t) {
    const a = x.a.ringar ? x.a.ringar(o, x) : null;
    const b = a ? a[i] : null;
    if (b == null) return null;
    const tb = x.t0 + b;
    const age = t - tb;
    const f = RING_F.get(ringNyckel(o, tb));
    if (age < 0 || age > RING.liv || !f || !f.ok) return null;
    const p = f.p.clone().addScaledVector(f.dir, (RING.fart / RING.broms) * (1 - Math.exp(-RING.broms * age)));
    p.y += 7 * age + 0.8 * age * age;
    p.x += 1.6 * Math.sin(age * 1.3 + tb) * age;
    const st = x.a.stick ? x.a.stick(o, x, i) : null;
    return { p, age, vand: f.vand, r: 4 + 13 * (1 - Math.exp(-0.6 * age)), brist: st == null ? 0 : sm(st, st + 0.35, t - x.t0) };
  }
  function ringar(t) {
    for (const [k, f] of RING_F) if (f.tb < t - 30 || f.tb > t + 30) RING_F.delete(k);
    const fodda = [];
    for (const [o, ms] of RINGM) {
      const r = aktRa(o, t);
      const x = r && AKTER[r.namn].ringar ? { ...r, a: AKTER[r.namn] } : null;
      const a = x ? x.a.ringar(o, x) : null;
      // (alla som är födda, också de som har bleknat: blickarna när en ring föds kan gå
      // till en tidigare, så att samma tid ger samma bild)
      ms.forEach((m, i) => {
        const b = a ? a[i] : null;
        if (b == null || t < x.t0 + b) m.visible = false;
        else fodda.push({ o, m, i, x, tb: x.t0 + b });
      });
    }
    if (!fodda.length) return;
    fodda.sort((p, q) => p.tb - q.tb);
    for (const r of fodda) ringFodd(r.o, r.tb);
    for (const r of fodda) {
      const L = ringLage(r.o, r.x, r.i, t);
      if (!L || L.brist >= 1) { r.m.visible = false; continue; }
      r.m.position.copy(L.p);
      r.m.quaternion.setFromUnitVectors(RING_Z, L.vand);
      const sc = L.r * (1 + 0.6 * L.brist);
      const wob = 0.07 * Math.sin(L.age * 4.2 + r.tb);
      r.m.scale.set(sc * (1 + wob), sc * (1 - wob), 1);
      r.m.material.opacity = 0.9 * Math.min(1, L.age * 5) * (1 - L.age / RING.liv) ** 0.9 * (1 - L.brist);
      r.m.visible = true;
    }
  }

  // ---------- en bild ----------

  // ---------- sömnens ansikten och z:ana ----------
  // Ansiktena trötta och bakfulla (trott i rum-uttryck.js): med ögonen stängda i sömnen och med
  // tunga ögonlock och påsar under ögonen medan man vaknar och är groggy (tex.trott_dl,
  // trott_dl_blund … trott_skagg, DJ:s mun). De byggs första gången någon sover eller vaknar och
  // släpps en minut efter att ingen behöver dem, så att de inte tar plats på grafikkortet på dagen.
  const TROTT = { p: null, nr: 0, sist: -1e9 };
  function trottBygg() {
    if (TROTT.p) return;
    const nr = ++TROTT.nr;
    TROTT.p = (async () => {
      const ny = {};
      const jobb = [];
      const bygg = (k, s) => { if (s) jobb.push(svgTex(s).then((x) => { ny[k] = x; }, () => {})); };
      try {
        for (const k of ['dl', 'dt', 'dj']) {
          if (!ANS.svg[k]) continue;
          const s = uttryck(ANS.svg[k], k, 'trott');
          bygg(`trott_${k}`, s);
          bygg(`trott_${k}_blund`, blundar(s));
        }
        if (ANS.svg.skagg) bygg('trott_skagg', skaggUttryck(ANS.svg.skagg, 'trott'));
      } catch (err) {
        console.warn('Rummet: de trötta ansiktena kunde inte ritas', err);
      }
      await Promise.all(jobb);
      if (nr !== TROTT.nr) {
        for (const x of Object.values(ny)) x.dispose();
        return;
      }
      Object.assign(tex, ny);
      if (opt.rita && ANS.ute) opt.rita();
    })();
  }
  function trottSlapp() {
    TROTT.nr++;
    TROTT.p = null;
    for (const k of Object.keys(tex)) if (k.startsWith('trott_')) { tex[k].dispose(); delete tex[k]; }
  }
  // Gäspansiktena (GASP_MUN, skaggGasp: tex.gasp_dl … gasp_skagg) byggs när någon snart ska
  // gäspa och släpps en minut efter den sista gäspningen, som de trötta. Tills de är klara
  // gäspar man med skrattets ansikte.
  const GASPEN = { p: null, nr: 0, sist: -1e9 };
  function gaspBygg() {
    if (GASPEN.p) return;
    const nr = ++GASPEN.nr;
    GASPEN.p = (async () => {
      const ny = {};
      const jobb = [];
      const bygg = (k, s) => { if (s) jobb.push(svgTex(s).then((x) => { ny[k] = x; }, () => {})); };
      try {
        for (const k of ['dl', 'dt', 'dj']) if (ANS.svg[k]) bygg(`gasp_${k}`, skrattar(ANS.svg[k], GASP_MUN[k]));
        if (ANS.svg.skagg) bygg('gasp_skagg', skaggGasp(ANS.svg.skagg));
      } catch (err) {
        console.warn('Rummet: gäspningarna kunde inte ritas', err);
      }
      await Promise.all(jobb);
      if (nr !== GASPEN.nr) {
        for (const x of Object.values(ny)) x.dispose();
        return;
      }
      Object.assign(tex, ny);
    })();
  }
  function gaspSlapp() {
    GASPEN.nr++;
    GASPEN.p = null;
    for (const k of Object.keys(tex)) if (k.startsWith('gasp_')) { tex[k].dispose(); delete tex[k]; }
  }
  // gäspar någon nu eller om en stund (påhitten med gasp, och uppvaknandet med en sträckning)?
  const gaspSnart = (t) => figs.some((o) => {
    const x = aktRa(o, t + 1.5) || aktRa(o, t);
    if (x && AKTER[x.namn].gasp) return true;
    const vk = vaknaNu(o, t);
    return Boolean(vk && vk.satt === 'strack');
  });
  // tunga, långsamma blinkningar när man just har vaknat (längre ju groggyare)
  const trottBlink = (o, t, gr) => (t + o.phase * 2.3) % 2.6 < 0.2 + 0.4 * Math.max(gr, 0.3);
  // Ansiktet: skrattet (och gäspningen), sömnen och uppvaknandet, annars efter humöret med blinkningarna.
  function ansiktsBild(o, t) {
    const k = o.F.key;
    const a = ansiktet(k);
    const skratt = o.skratt || (a.bas !== tex[k] ? tex[k] : null);
    const T = { bas: tex[`trott_${k}`], blund: tex[`trott_${k}_blund`] };
    const sov = sovW(o, t);
    const vk = vaknaNu(o, t);
    const gr = groggW(o, t);
    const V = vk && VAKNA[vk.satt];
    const gasp = Boolean(V && V.gaspar && V.gaspar(vk.l)) || gaspW(o, t) > 0.3;
    const G = gasp ? tex[`gasp_${k}`] : null;
    // (ögonlocken blir tunga redan medan hen somnar)
    const trott = sov > 0.15 || vk || gr > 0.3;
    let bild;
    if (G) bild = G;
    else if ((skrattW(o, t) > 0.3 || gasp) && skratt) bild = skratt;
    else if (sov > 0.5 || gasp || (V && V.blund && V.blund(vk.l))) bild = T.blund || a.blund || a.bas;
    // (med ett ryck: ögonen vidöppna en stund)
    else if (vk && vk.satt === 'ryck' && vk.l < 2.9 && a.blund) bild = a.bas;
    else if (trott && T.bas) bild = !opt.calm && trottBlink(o, t, gr) && T.blund ? T.blund : T.bas;
    else bild = a.blund && ((!opt.calm && blinkar(o, t)) || korsBlund(o, t)) ? a.blund : a.bas;
    return { bild, skagg: gasp && tex.gasp_skagg ? tex.gasp_skagg : (skrattW(o, t) > 0.3 || gasp) && tex.dj_skagg_skratt ? tex.dj_skagg_skratt : trott && tex.trott_skagg ? tex.trott_skagg : tex.ans_skagg || tex.dj_skagg };
  }
  // Z:ana som stiger från den som sover, ett per utandning i hens takt (SOVTAKT): DT snarkar
  // (större och tätare), DJ andas djupt och DL lätt. De driver uppåt och utåt och bleknar, och
  // står stilla med minskad rörelse.
  const ZSTOR = { dl: 15, dt: 21, dj: 18 };
  const ZTEX = canvasTex(64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.font = `bold ${Math.round(h * 0.8)}px Georgia, serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = h / 9;
    c.strokeStyle = '#1d2233';
    c.strokeText('z', w / 2, h / 2 - h / 16);
    c.fillStyle = '#eef2ff';
    c.fillText('z', w / 2, h / 2 - h / 16);
  });
  const ZZ = figs.map((o) => [0, 1, 2].map((i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ZTEX, transparent: true, depthWrite: false, opacity: 0 }));
    sp.visible = false;
    sp.userData.i = i;
    root.add(sp);
    return sp;
  }));
  function zRita(t) {
    figs.forEach((o, j) => {
      const sov = sovW(o, t);
      const zs = ZZ[j];
      if (sov < 0.5 || (o.st && o.st.w > 0)) { for (const sp of zs) sp.visible = false; return; }
      // ovanför huvudet (rakt upp från dess mitt, också när det ligger på bordet), på den sida som är ut från bordet
      const P = o.F.head;
      const ut = Math.sign(o.F.x - BORD.x) || 1;
      const topp = inHead(o, new THREE.Vector3(0, 0, 0)).applyAxisAngle(UP, o.turnNu * DEG).add(o.fig.position).add(new THREE.Vector3(ut * P.rx * 0.3, P.ry * 0.85, 0));
      const per = SOVTAKT[o.F.key];
      const stor = ZSTOR[o.F.key];
      for (const sp of zs) {
        const i = sp.userData.i;
        const u = opt.calm ? (i + 0.6) / 3.4 : (((t + o.phase) / (3 * per) + i / 3) % 1 + 1) % 1;
        sp.visible = true;
        sp.position.set(topp.x + ut * (6 + 16 * u) + 3 * Math.sin(u * 6 + i), topp.y + 6 + 46 * u, topp.z + 6);
        sp.scale.setScalar(stor * (0.6 + 0.7 * u));
        sp.material.opacity = 0.85 * sm(0.5, 0.8, sov) * bump(u, 0, 0.12, 0.6, 1);
        sp.material.rotation = -ut * (0.15 + 0.2 * u);
      }
    });
  }

  // Huvudena nickar efter när musen rör sig: en fjäder mot vridningen och
  // dess fart, räknad i tid (240 steg i sekunden), så att de nickar lika
  // fort och lika mycket hur glest gänget än ritas (KVAL i rum.js) – i ett
  // steg per bild svängde de i telefonen ut längre och långsammare.
  const NICK = { w: 6.6, z: 0.55 };
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
    // ögat efter musen, som rummets vridning i rum.js (camT: 4,5 grader åt sidorna, 2,6 upp och ner)
    OGA.x = -Math.tan(mx * 4.5 * DEG) * (D - OGA_Z);
    OGA.y = Math.tan(my * 2.6 * DEG) * (D - OGA_Z);
    // spegeln: blicken glider efter markören, lika fort hur glest gänget än ritas
    const glid = dt > 0 ? 1 - Math.exp(-dt / SPEGEL.tau) : 1;
    for (const s of Object.values(SP)) s.nu.lerp(s.mal, glid);
    // (röken först: den ställer figuren när blosset föddes, emitter)
    smoke(t);
    ringar(t);
    // (bålarna och huvudena först: armarna går runt grannarnas huvuden, allaHuvuden)
    for (const o of figs) stallKropp(o, t);
    for (const o of figs) pose(o, t, true);
    radioRita(t);
    zRita(t);
    // högtidens huvudbonad: lågorna i luciakronan fladdrar, och en hög bonad
    // tar den av sig som sover med huvudet på bordet
    for (const o of figs) {
      if (!o.H) continue;
      if (o.H.hog) o.H.grupp.visible = !(sovStil(o) === 'bord' && sovW(o, t) > 0.5);
      if (o.H.tick) o.H.tick(t);
    }
    // de trötta ansiktena (TROTT) medan någon sover eller just har vaknat
    if (SO.on || figs.some((o) => sovW(o, t) > 0.01 || groggW(o, t) > 0.01)) {
      TROTT.sist = t;
      trottBygg();
    } else if (TROTT.p && t - TROTT.sist > 60) trottSlapp();
    // gäspansiktena (GASPEN) när någon snart ska gäspa
    if (gaspSnart(t)) {
      GASPEN.sist = t;
      gaspBygg();
    } else if (GASPEN.p && t - GASPEN.sist > 60) gaspSlapp();
    // ansiktena (ansiktsBild): blinkar (inte i en fast bild), skrattar (skrattW)
    // med ögonen hopknipna och munnen öppen (DJ:s i skägget), sover, vaknar –
    // annars ansiktet efter humöret (ansiktet)
    for (const o of figs) {
      const b = ansiktsBild(o, t);
      o.face.material.map = b.bild;
      if (o.skagg) o.skagg.material.map = b.skagg;
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
    sikta();
    r.render(scene, cam);
    if (Q.skugga > 1 && Q.n++ % Q.skugga === 0) skuggaSen();
    if (ombyggda.length) slappOmbyggda();
  }

  // Skuggorna för sig, när de räknas om mer sällan än gänget ritas (skugga i KVAL
  // i rum.js). Förut räknades de om i samma bild som gänget, så att var tredje
  // eller fjärde bild var dubbelt så tung som de andra – alla delar ritade en
  // gång till – och det är den bilden som blir för lång i en svag telefon: rummet
  // rycker till i jämn takt. Nu ritas skuggkartan för sig, två bildrutor efter
  // gänget, där inget annat ritas (frame i rum.js): lika mycket arbete, men
  // ingen bild bär allt. Skuggorna är från den ställning gänget just ritades i
  // och syns från nästa bild – de var redan upp till tre bilder gamla.
  // three räknar bara om skuggkartan inifrån render, så scenen ritas en gång
  // till, men med en kamera som ser åt ett annat håll (inget är i bild, så
  // inget ritas utöver skuggkartan) och till en duk på en bildpunkt i stället
  // för den som syns.
  const skuggDuk = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const skuggKam = new THREE.PerspectiveCamera(1, 1, 1, 2);
  skuggKam.position.set(0, 1e7, 0);
  skuggKam.lookAt(0, 2e7, 0);
  skuggKam.updateMatrixWorld();
  let skuggVantar = false;
  function skuggaSen() {
    if (skuggVantar || !r.shadowMap.enabled) return;
    skuggVantar = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      skuggVantar = false;
      if (!r.shadowMap.enabled || Q.skugga <= 1) return;
      r.shadowMap.needsUpdate = true;
      r.setRenderTarget(skuggDuk);
      r.render(scene, skuggKam);
      r.setRenderTarget(null);
    }));
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
  let prNu = PR;
  const T0 = parseFloat(getComputedStyle(canvas).top) || 0;
  function narbild(ruta) {
    if (!ruta && !NARA) return;
    if (ruta) {
      // (längsta sidan högst 2880 bildpunkter)
      const pr = Math.min(ruta.pr, 2880 / Math.max(ruta.w, ruta.h));
      NARA = Object.assign({}, ruta, { pr });
      sikta();
      r.setPixelRatio(pr);
      r.setSize(ruta.w, ruta.h, false);
      Object.assign(canvas.style, { left: `${L0 + ruta.x}px`, top: `${T0 + ruta.y}px`, width: `${ruta.w}px`, height: `${ruta.h}px` });
      radioFin(ruta.bred * (RM.W * RM.SK) / W);
    } else {
      NARA = null;
      sikta();
      r.setPixelRatio(prNu);
      r.setSize(W, H, false);
      for (const k of ['left', 'top', 'width', 'height']) canvas.style.removeProperty(k);
    }
    r.render(scene, cam);
    if (opt.rita) opt.rita();
  }
  // Radions delar sedda ur kameran (med ögat i vila): radioRuta i dukens punkter (det kameran siktar
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
    const [ox, oy] = [OGA.x, OGA.y];
    OGA.x = OGA.y = 0;
    sikta();
    scene.updateMatrixWorld(true);
    const fram = rProj([-RM.W / 2, -0.5, RM.W / 2, RM.H + 7.5]);
    const bak = rProj([-RM.W / 2, -0.5, RM.W / 2, RM.H + 7.5, -RM.F]);
    const [x0, y0, x1, y1] = [Math.min(fram[0], bak[0]), Math.min(fram[1], bak[1]), Math.max(fram[2], bak[2]), Math.max(fram[3], bak[3])];
    OGA.x = ox;
    OGA.y = oy;
    sikta();
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
  // punkten (nx, ny) i duken på radions front, i modellens enheter (eller null)
  function rPunkt(nx, ny) {
    scene.updateMatrixWorld(true);
    cam.updateMatrixWorld();
    ray.setFromCamera(new THREE.Vector2(nx, ny), cam);
    const K = RADIO.k.matrixWorld;
    const o = new THREE.Vector3(0, 0, RM.F + 0.5).applyMatrix4(K);
    const n = new THREE.Vector3(0, 0, 1).transformDirection(K);
    rPlan.setFromNormalAndCoplanarPoint(n, o);
    const u = ray.ray.intersectPlane(rPlan, new THREE.Vector3());
    return u ? u.applyMatrix4(delInv.copy(K).invert()) : null;
  }
  function radioP(nx, ny) {
    const u = rPunkt(nx, ny);
    return u ? Math.min(1, Math.max(0, (u.x - RM.sx0) / (RM.sx1 - RM.sx0))) : RL.p;
  }
  // Stationen vars namn på tejpen är vid punkten (nx, ny), eller null
  function radioEtikett(nx, ny) {
    const u = rPunkt(nx, ny);
    if (!u) return null;
    const x = (u.x - RM.gx0) / (RM.gx1 - RM.gx0);
    for (const [band, [y0, y1]] of [['fm', RM.tf], ['am', RM.ta]]) {
      if (u.y < y0 - 0.3 || u.y > y1 + 0.3) continue;
      const y = (y1 - u.y) / (y1 - y0);
      let bast = null;
      let d = Infinity;
      for (const e of TEJP.hit[band]) {
        const dx = Math.max(0, e.x0 - x, x - e.x1);
        const dy = Math.abs(y - e.y);
        if (dx < 0.015 && dy < 0.32 && dx * 20 + dy < d) {
          d = dx * 20 + dy;
          bast = e.id;
        }
      }
      return bast;
    }
    return null;
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
        // (en duk som får ny storlek är tom: annars blinkar gänget bort till nästa bild)
        r.render(scene, cam);
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
    // (klockan för påhitten efter tiden på dygnet)
    dygnSatt(v, lastT ?? 0);
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
      else if (o.inneAt === Infinity) {
        // (den som lämnar in mitt i natten vaknar)
        vakna(o, t);
        o.inneAt = t;
      }
    }
    told = true;
  }

  // Matcherna och spelstoppet ({ tv, nag }): första gången som det är, sedan
  // vänder de sig mot tv:n (eller tillbaka) på en stund.
  let toldTv = false;
  function lage(x, t) {
    const on = Boolean(x && x.tv);
    if (on !== S.tv) {
      // (matcherna väcker den som sover, och när de är slut håller de sig vakna en stund: hall)
      if (on && toldTv) allaVakna0(t, [0, 0.8, 1.7]);
      if (!on) hallVakna(t);
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
    // (musiken väcker dem, en i taget och var och en på sitt sätt)
    if (pa) allaVakna0(t, [0.3, 1.3, 2.5]);
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
  // Spegeln: vem tittar på markören i (nx, ny), −1…1 i duken (också utanför den);
  // vem null släpper, och de andra släpps alltid. Inte med minskad rörelse, utom
  // bild: som om markören hade stått där länge, och blicken står kvar (?rum-spegel).
  const spRay = new THREE.Raycaster();
  const spPlan = new THREE.Plane(new THREE.Vector3(0, 0, 1), -SPEGEL.z);
  const spPt = new THREE.Vector3();
  function spegel(vem, nx, ny, t, bild = false) {
    const k = vem ? String(vem).toLowerCase() : null;
    // (tillbaka från och med nu)
    for (const [j, s] of Object.entries(SP)) if (j !== k) s.at = Math.min(s.at, t - SPEGEL.kvar);
    const o = k && (!opt.calm || bild) ? figs.find((f) => f.F.key === k) : null;
    if (!o || !Number.isFinite(nx) || !Number.isFinite(ny)) return;
    spRay.setFromCamera(new THREE.Vector2(nx, ny), cam);
    if (!spRay.ray.intersectPlane(spPlan, spPt)) return;
    const s = SP[k] || (SP[k] = { mal: new THREE.Vector3(), nu: new THREE.Vector3(), at: -1e9, w0: 0, wAt: -1e9 });
    if (bild) {
      Object.assign(s, { w0: 1, wAt: -1e9, at: 1e9 });
      s.nu.copy(spPt);
      s.mal.copy(spPt);
      return;
    }
    const w = spW(o, t);
    // (stod markören still: tonar in igen därifrån, och från ingenting börjar blicken på markören)
    if (t > s.at + SPEGEL.kvar) {
      s.w0 = w;
      s.wAt = t;
    }
    if (w < 0.02) s.nu.copy(spPt);
    s.mal.copy(spPt);
    s.at = t;
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
  // Den som sover vaknar i stället (vakna), och den som är vaken på natten håller
  // sig vaken en stund till. Ett klick medan armen just är på väg upp räknas
  // inte, annars byter hen tecken direkt.
  function tecken(vem, t, namn) {
    const k = String(vem).toLowerCase();
    const o = figs.find((f) => f.F.key === k);
    if (!o) return;
    const sov = sovW(o, t);
    vakna(o, t);
    if (sov > 0.3 || vaknaNu(o, t)) return;
    const g = teckenNu(o, t);
    if (g && g.T < 0.3) return;
    const val = namn && TECKEN[namn] ? namn : nastaTecken();
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
  // Natten (hur släckt lysröret är, 0–1, eller på/av): första gången som det är, sedan på en stund.
  let toldNatt = false;
  function natt(g, t) {
    g = typeof g === 'number' ? Math.max(0, Math.min(1, g)) : g ? 1 : 0;
    if (g === N.mal && toldNatt) return;
    N.fran = toldNatt ? nattW(t) : g;
    N.at = toldNatt ? t : -1e9;
    N.mal = g;
    toldNatt = true;
  }
  // Sömnen (22.30–07): första gången som det är. Sedan somnar de en i taget (SOMN_FORE) –
  // utom de som radion eller matcherna håller vakna – och på morgonen vaknar de en i taget,
  // var och en på sitt sätt (vakna), innan sömnen släpper helt.
  let toldSomn = false;
  function somn(on, t) {
    on = Boolean(on);
    if (on === SO.on && toldSomn) return;
    if (!toldSomn) {
      SO.fran = on ? 1 : 0;
      SO.at = -1e9;
    } else if (on) {
      hallVakna(t);
      SO.fran = 0;
      SO.at = t;
    } else {
      allaVakna0(t, [0, 3.5, 7.5]);
      SO.fran = 1;
      SO.at = t + 20;
    }
    SO.on = on;
    toldSomn = true;
  }
  // Väck vem vid t (för bilder, ?rum-vakna: satt ryck, strack eller bakis).
  function vakna1(vem, t, satt) {
    const o = figs.find((f) => f.F.key === String(vem).toLowerCase());
    if (o) vakna(o, t, satt, true);
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
  // Rakt ovanför huvudet på vem, där lappen sitter på den du har valt att vara (markera i rum.js): punkten i
  // duken, 0–1 från vänster och uppifrån, som gänget just ritades. Huvudets höjd med det som sitter på det
  // (håret, mössan och tofsen, högtidens bonad) räknas i huvudets egna axlar en gång, och igen när något läggs
  // på eller tas av; lappen står sedan så högt över huvudets mitt, också när hen lutar sig eller sover på bordet.
  // → [x, y], eller null om hen inte finns eller går iväg.
  const toppV = new THREE.Vector3();
  const toppBox = new THREE.Box3();
  const toppInv = new THREE.Matrix4();
  const toppM = new THREE.Matrix4();
  function topp(vem) {
    const o = figs.find((f) => f.F.key === String(vem).toLowerCase());
    if (!o || (o.st && o.st.w > 0.2)) return null;
    const n = o.hc.children.length;
    if (!o.topp || o.topp.n !== n) {
      o.hc.updateMatrixWorld(true);
      toppInv.copy(o.hc.matrixWorld).invert();
      let y = o.F.head.ry;
      o.hc.traverse((x) => {
        if (!x.isMesh || !x.geometry) return;
        if (!x.geometry.boundingBox) x.geometry.computeBoundingBox();
        toppBox.copy(x.geometry.boundingBox).applyMatrix4(toppM.multiplyMatrices(toppInv, x.matrixWorld));
        y = Math.max(y, toppBox.max.y);
      });
      o.topp = { n, y };
    }
    toppV.setFromMatrixPosition(o.hc.matrixWorld);
    toppV.y += o.topp.y;
    toppV.project(cam);
    return [(toppV.x + 1) / 2, (1 - toppV.y) / 2];
  }

  if (opt.enkel) enkelMaterial(scene);
  // Grafikprogrammen byggs i bakgrunden innan gänget ritas första gången: annars
  // står huvudtråden still medan grafikdrivern arbetar, och rummet svarar inte på
  // fingret så länge.
  try {
    await r.compileAsync(scene, cam);
  } catch (err) { /* då byggs de när gänget ritas, som förut */ }
  ANS.ute = true;
  return { draw, inne, ute, lage, mal, radio, radioPa: () => SJUNG.radio.pa, radioLage, radioEtiketter, radioDetalj, narbild, radioRuta, radioDelar, radioP, radioEtikett, spel, senast, uttryck: () => ANS.p, prova, ga, pekar, spegel, hej, vald, tecken, lappar, lappVand, lappProva, natt, somn, vakna: vakna1, efter, under, huvud, topp, kval };
}
