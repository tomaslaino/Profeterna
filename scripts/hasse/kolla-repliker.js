'use strict';

// Kontrollen av Hasse Backes färdiga repliker (public/rum-hasse-repliker.js). Körs med
// npm run repliker och av GitHub när filen ändras (.github/workflows/repliker.yml);
// den stoppar aldrig publiceringen, men ett kryss syns på ändringen.
//
// Ingen kod kan avgöra om en rad är bra svenska. Det här fångar det som går att fånga:
//   - uttryck som redan har underkänts (UNDERKANT): lägg till dem här när det händer igen,
//   - avhuggna meningar: ett eller två ord ("Modigt.", "Nästa.") tål inte svenskan,
//   - rader som hamnar fel i samtalet: efter "Det slutar 2–1" får raden om kupongen inte
//     börja med ett Det som låter som resultatet,
//   - fält som tomt försvinner (fyll i rum-hasse.js skriver inget för ett okänt fält),
//   - listor som blivit en sträng (lott i rum-hasse.js kräver en lista),
//   - att rösten får exakt de meningar sidan säger.

const repliker = require('../../public/rum-hasse-repliker.js');
const block = require('../../public/rum-block.js');
const tidning = require('../../public/rum-tidning.js');
const { repliktexter } = require('../../src/rost.js');

// Underkänt av Tomas, med det som ska stå i stället.
const UNDERKANT = [
  [/\bVilken match\?/i, 'Vilken match ska jag hjälpa dig med?'],
  [/\bTotal kontroll\b/i, 'Jag har full kontroll.'],
  [/\bBra att du frågar\b/i, 'Där frågade du rätt man.'],
  [/\bVi börjar bakifrån\b/i, 'går inte att förstå'],
  [/\bDet är mest fel\b/i, 'De har fel, som vanligt.'],
  [/\bVilken mer\b/i, 'Vilken match tar vi nu?'],
  [/\bInget mer med det\b/i, 'Mer än så är det inte.'],
  [/\bLyssna bättre\b/i, 'Du kunde ha lyssnat.'],
  [/\bSamma som du\b/i, 'Du har samma tecken som jag.'],
  [/\b(är|redan) löst\b/i, 'klar eller avgjord: en kupong löser man inte'],
  [/\bDu lär dig\b/i, 'Du börjar lära dig.'],
  [/^Tillbaka\b/i, 'Är du här igen?'],
  [/\bEfteråt kan alla\b/i, 'Efteråt är alla kloka.'],
  [/\binget på den\b/i, 'Du har inte tippat den här.'],
  [/\bvad du ska (skriva|sätta)\b/i, 'tippa eller fylla i: på en kupong skriver man inte'],
  [/\bVilken match är det\b/i, 'Vilken match vill du ha hjälp med?'],
  [/\bDet är (tre|fem|tio) nu\b/i, 'Du har frågat om tre matcher.'],
  [/\bgick du bet på\b/i, 'Vilken match har du kört fast på?'],
  [/\bDet ska gå till så här\b/i, 'Man ska inte stressa fram ett tips.'],
  [/\b(live|online|playoff|spoiler)\b/i, 'pågår, på nätet, kval, dölj resultat'],
  [/\bvinner den\b/i, 'vinner matchen: efter "Ge hit kupongen" är den kupongen'],
  [/\bförsäkring\b/i, 'gardering: på en kupong garderar man sig'],
  [/\bDär har du hela\b/i, 'Det var hela gänget.'],
  [/\bfinns inte att säga\b/i, 'Mer än så finns det inte att säga.'],
  [/\bVem (vill du höra om|av er ska jag ta)\b/i, 'Vems kupong ska jag ta nu?: säg att det är en kupong han ska döma'],
  // Den han talar med kan vara den han dömer, och i gänget är han inte med (Tomas 2026-11-10).
  [/\bvi (att )?få höra\b/i, 'det kommer resten att få höra: i gänget är han inte med'],
  [/\b(ni|er) andra\b/i, 'de andra: den han talar med kan vara den han dömer'],
  [/\bandras domar\b/i, 'domarna över de andra: domarna är hans'],
  [/\bVems vill du höra (först|nu)\?/i, 'Vilken vill du höra först? eller Vems kupong tar vi nu?: det är hans bedömning man hör'],
];

// Korta meningar som Tomas själv har valt eller som har ett verb.
const KORTA_OK = new Set(['Bra.', 'Läs här.']);

// Vilka fält som går att fylla var (forstaRad, medDag och omKupongen i rum-hasse.js).
// Står det inget för hela vägen gäller det som står för första delen.
const FALT = {
  oppningNamn: ['namn'], tillbakaNamn: ['namn'],
  ledig: ['dag'],
  resultat: ['res'],
  'kupong.farre': ['du'], 'kupong.fler': ['du'], 'kupong.skilda': ['du'], 'kupong.korsar': ['du', 'Bada'],
  'efter.ratt': ['ratt', 'av'], 'efter.exakt': ['res'],
  domar: ['namn', 'antal', 'Antal'],
  'stallning.ratt': ['ratt', 'av'], 'stallning.leder': ['lag', 'mot', 'res'], 'stallning.lika': ['match', 'res'], 'stallning.mal': ['match', 'res'],
};
// Sidan lottar bland de här, så de måste vara listor.
const LISTOR = ['oppning', 'oppningNamn', 'tillbaka', 'tillbakaNamn', 'nasta', 'halva', 'enKvar', 'alla', 'allaKvar', 'allaIgen', 'ledig', 'val', 'valLasa', 'valVanta',
  'fragaTillbaka', 'lar', 'gissar', 'erbjud', 'erbjudNytt', 'resultat', 'ejKlar', 'ropSvar',
  'fyller.foreslar', 'fyller.hit', 'fyller.skriver.1', 'fyller.skriver.X', 'fyller.skriver.2', 'fyller.gardera', 'fyller.medhall', 'fyller.emot',
  'fyller.suddar', 'fyller.inne', 'fyller.fel',
  'kupong.samma', 'kupong.farre', 'kupong.fler', 'kupong.korsar', 'kupong.skilda',
  'efter.alla', 'efter.bra', 'efter.mitten', 'efter.daligt', 'efter.inget', 'efter.forst', 'efter.sist', 'efter.exakt', 'efter.pagar', 'efter.dolt', 'efter.ofragad',
  'domar.fraga', 'domar.igen', 'domar.alla', 'domar.du.forst', 'domar.du.hort', 'domar.du.inte', 'domar.ledig', 'domar.revisorn', 'domar.borta', 'domar.forsakring',
  ...['forst', 'alla', 'mitten', 'sist', 'sistLika', 'inget'].map((k) => `domar.in.${k}`),
  ...['forsakring', 'forst', 'alla', 'mitten', 'sist', 'sistLika', 'inget'].map((k) => `domar.ut.${k}`),
  'domar.hel.en', 'domar.hel.fler', 'domar.ensam.ingen', 'domar.ensam.en', 'domar.ensam.fler',
  ...['ingen', 'enda', 'endaInte', 'alla', 'inga', 'en', 'fler'].map((k) => `domar.spik.${k}`),
  ...['ratt', 'alla', 'bra', 'mitten', 'daligt', 'leder', 'lika', 'haller', 'hallerLika', 'emot', 'emotLika', 'mal', 'malBra', 'malLugn', 'malFel'].map((k) => `stallning.${k}`),
  ...['italo', 'guld', 'rock', 'p1', 'p3', 'p4g', 'rix', 'sport', 'talksport', 'caroline', 'brus'].map((k) => `radio.${k}`),
  ...['bradskar', 'natt', 'morgon', 'kvall'].map((k) => `tid.${k}`)];
// Knappar och ord, inte meningar.
const INTE_MENINGAR = ['lar', 'tecken', 'tal', 'domord', 'felnamn'];

const fel = [];
const varde = (vag) => vag.split('.').reduce((o, k) => (o == null ? o : o[k]), repliker);

// Alla rader med sin plats: resultat, kupong.tom, antal.3 …
function rader(o = repliker, vag = '', ut = []) {
  if (typeof o === 'string') ut.push([vag, o]);
  else if (Array.isArray(o)) for (const t of o) rader(t, vag, ut);
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) rader(v, vag ? `${vag}.${k}` : k, ut);
  return ut;
}

const alla = rader();
for (const [vag, t] of alla) {
  if (INTE_MENINGAR.includes(vag.split('.')[0])) continue;
  for (const [re, istallet] of UNDERKANT) if (re.test(t)) fel.push(`${vag}: "${t}" är underkänt. Skriv: ${istallet}`);
  if (vag.startsWith('kupong.') && /^Det\b/.test(t)) fel.push(`${vag}: "${t}" kommer direkt efter resultatet, och Det låter som resultatet. Säg vad det gäller.`);
  if (!/[.?!]$/.test(t)) fel.push(`${vag}: "${t}" saknar punkt`);
  for (const mening of t.split(/(?<=[.?!])\s+/)) if (mening.split(/\s+/).length <= 2 && !KORTA_OK.has(mening)) fel.push(`${vag}: "${mening}" är avhugget. Skriv en hel mening med verb.`);
  const tillatna = FALT[vag] || FALT[vag.split('.')[0]] || [];
  for (const m of t.matchAll(/\{(\w+)\}/g)) if (!tillatna.includes(m[1])) fel.push(`${vag}: {${m[1]}} går inte att fylla här, så det försvinner`);
}

for (const vag of LISTOR) if (!Array.isArray(varde(vag))) fel.push(`${vag} måste vara en lista: sidan lottar bland raderna`);
for (const [n, v] of Object.entries(repliker.antal || {})) if (!Array.isArray(v)) fel.push(`antal.${n} måste vara en lista`);
// Raderna under en vald match ska få plats på en rad, annars flyttar sig knapparna under dem.
for (const vag of ['val', 'valLasa', 'valVanta']) for (const t of varde(vag) || []) if (t.length > 31) fel.push(`${vag}: "${t}" är för lång: högst 31 tecken, annars flyttar sig knapparna`);
for (const vag of LISTOR) {
  const l = varde(vag);
  if (Array.isArray(l) && new Set(l).size !== l.length) fel.push(`${vag} har samma rad två gånger`);
}
// Domarna: ett ord i guld för varje läge, och varje rad en mening (de läses upp mening för mening).
for (const k of ['forsakring', 'forst', 'alla', 'mitten', 'sist', 'sistLika', 'inget']) {
  if (!(repliker.domord && repliker.domord[k])) fel.push(`domord.${k} saknas`);
  if (!(k === 'forsakring' || (repliker.domar && repliker.domar.in && repliker.domar.in[k]))) fel.push(`domar.in.${k} saknas`);
}
// Frågan över listan med gänget (gangLista i rum-hasse.js) sägs i ett svep och får vara två meningar. Den ska
// säga vad han har att ge och att det gäller en kupong (Tomas 2026-11-10: "höra om din kupong" tar för givet att
// man vet att han ska säga något om den), och rymmas på tre rader i den smalaste telefonen med det längsta namnet.
const FRAGOR = ['domar.fraga', 'domar.igen', 'domar.alla', 'domar.du.forst', 'domar.du.hort', 'domar.du.inte'];
const LANGST = Object.entries(repliker.felnamn || {}).flat(2).reduce((a, b) => (b.length > a.length ? b : a), '');
const GOR = /\b(tycker|bedöm\w*|dom|domen|döm\w*|synpunkter|kommenterar|säga något)\b/i;
for (const vag of FRAGOR) {
  for (const t of varde(vag) || []) {
    if (t.replace('{namn}', LANGST).length > 80) fel.push(`${vag}: "${t}" är för lång: högst 80 tecken med namnet, annars flyttar sig gänget`);
    if (vag === 'domar.alla') continue;
    if (/\bhöra om\b/i.test(t)) fel.push(`${vag}: "${t}" säger höra om. Säg vad han ska göra: vad jag tycker om, min bedömning av, domen över.`);
    if (!/kupong/i.test(t) || !GOR.test(t)) fel.push(`${vag}: "${t}" säger inte vad han ska göra med kupongen. Skriv till exempel: Vems kupong ska jag döma nu?`);
  }
}
// Till gruppen säger han ni och er: det är bara ni som använder sidan (Tomas 2026-11-09).
for (const [vag, t] of alla) if (/\bgäng/i.test(t)) fel.push(`${vag}: "${t}" säger gänget. Skriv ni, er eller allihop.`);
for (const [vag, t] of alla) if (vag.startsWith('domar.') && t.split(/(?<=[.?!])\s+/).length > 1 && !FRAGOR.includes(vag)) fel.push(`${vag}: "${t}" är två meningar. Domen läses upp mening för mening, så skriv en.`);
for (const k of ['1', 'X', '2']) {
  const t = repliker.tecken && repliker.tecken[k];
  if (!t || !t.du || !t.bestamd) fel.push(`tecken.${k} saknar du eller bestamd`);
}

// Rösten: alla fält ifyllda, och tecknen i rätt form.
const tal = repliktexter([{ namn: 'Test Testsson' }]);
for (const t of tal) if (/\{\w+\}/.test(t)) fel.push(`rösten får ett tomt fält: "${t}"`);
for (const t of tal) if (/\b(etta|kryss|tvåa|Etta|Kryss|Tvåa) (får|kan) du behålla\b/.test(t)) fel.push(`obestämd form: "${t}"`);
for (const [vag, t] of alla) {
  if (INTE_MENINGAR.includes(vag.split('.')[0]) || vag === 'utanRost' || /\{/.test(t)) continue;
  if (!tal.includes(t.replace(/\s+/g, ' ').trim())) fel.push(`rösten saknar "${t}"`);
}

// Det han skriver i protokollet och tidningen (public/rum-block.js) sägs inte, och där får en
// anteckning vara ett ord, men det som är underkänt gäller också där.
const blockTexter = (o) => (typeof o === 'string' ? [o] : typeof o === 'function' ? [o(9, 11, '1–0', 18)] : Array.isArray(o) ? o.flatMap(blockTexter) : Object.values(o).flatMap(blockTexter));
for (const t of blockTexter(block.TEXT)) {
  for (const [re, istallet] of UNDERKANT) if (re.test(t)) fel.push(`protokollet: "${t}" är underkänt. Skriv: ${istallet}`);
  if (!/[.?!]$/.test(t) && !/^[A-ZÅÄÖ][a-zåäö]+( [a-zåäö]+){1,4}$/.test(t)) fel.push(`protokollet: "${t}" saknar punkt`);
}

// Tidningen Helgarderat på pulten (public/rum-tidning.js) sägs inte heller. Det som är underkänt gäller, en mening ska
// sluta med punkt (rubrikerna har ingen, och orden i tabellerna är kortare än fem ord), och i krönikan säger Hasse ni och er.
const tidningsTexter = (o, vag = '') => (typeof o === 'string' ? [[vag, o]] : typeof o === 'function' ? [[vag, o(9, 11, '1–0', 18)]]
  : Array.isArray(o) ? o.flatMap((x) => tidningsTexter(x, vag)) : Object.entries(o).flatMap(([k, v]) => tidningsTexter(v, vag ? `${vag}.${k}` : k)));
for (const [vag, t] of tidningsTexter(tidning.TEXT)) {
  for (const [re, istallet] of UNDERKANT) if (re.test(t)) fel.push(`tidningen ${vag}: "${t}" är underkänt. Skriv: ${istallet}`);
  if (!/\.rubrik\b/.test(vag) && t.split(/\s+/).length >= 5 && !/[.?!]$/.test(t)) fel.push(`tidningen ${vag}: "${t}" saknar punkt`);
  if (vag.startsWith('kronika.') && /\bgäng/i.test(t)) fel.push(`tidningen ${vag}: "${t}" säger gänget. Hasse skriver ni, er eller allihop.`);
}

if (fel.length) {
  console.error(`Hasses repliker: ${fel.length} fel\n${fel.map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`Hasses repliker: ${alla.length} rader och ${tal.length} meningar till rösten, inga fel.`);
