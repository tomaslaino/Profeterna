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
};
// Sidan lottar bland de här, så de måste vara listor.
const LISTOR = ['oppning', 'oppningNamn', 'tillbaka', 'tillbakaNamn', 'nasta', 'halva', 'allaIgen', 'ledig', 'val', 'valLasa',
  'fragaTillbaka', 'lar', 'gissar', 'erbjud', 'erbjudNytt', 'resultat', 'ejKlar', 'anslagSvar',
  'fyller.foreslar', 'fyller.hit', 'fyller.skriver.1', 'fyller.skriver.X', 'fyller.skriver.2', 'fyller.gardera', 'fyller.medhall', 'fyller.emot',
  'fyller.suddar', 'fyller.inne', 'fyller.fel',
  'kupong.samma', 'kupong.farre', 'kupong.fler', 'kupong.korsar', 'kupong.skilda',
  'efter.alla', 'efter.bra', 'efter.mitten', 'efter.daligt', 'efter.inget', 'efter.forst', 'efter.sist', 'efter.exakt', 'efter.pagar', 'efter.dolt', 'efter.ofragad'];
// Knappar och ord, inte meningar.
const INTE_MENINGAR = ['lar', 'tecken', 'tal'];

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
for (const vag of LISTOR) {
  const l = varde(vag);
  if (Array.isArray(l) && new Set(l).size !== l.length) fel.push(`${vag} har samma rad två gånger`);
}
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

if (fel.length) {
  console.error(`Hasses repliker: ${fel.length} fel\n${fel.map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`Hasses repliker: ${alla.length} rader och ${tal.length} meningar till rösten, inga fel.`);
