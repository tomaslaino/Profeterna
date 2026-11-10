#!/usr/bin/env node
// Matchbladens bilder (Helgarderat, användarens önskemål 2026-11-10: "Fixa så att det kommer riktiga bilder nu"):
// veckans bild av varje lag i data/poddsidor.json, hämtad på GitHub Actions före bygget med samma kod som
// tidningens bilder på iMacen (src/analyser/tidning-bilder.mjs: de insatta mediernas artiklar om laget och Bing
// News, sidans delningsbild från den senaste veckan, inga loggor eller grafik), förminskad med ImageMagick. Bara
// artiklar som handlar om laget självt räknas (MIN_POANG): inte en annan klubbs sajt eller artikel, inte ett rykte.
// Ett lag som blir utan får ett andra försök: lagets eget BBC-flöde, med artiklar upp till två veckor gamla.
//
// Bilderna sparas i källcachen (data/cache/matchbilder/), som workflowen behåller mellan körningarna, så att de
// hämtas en gång per omgång; ett lag utan bild prövas igen efter FORSOK_TIMMAR. Ut: data/matchbilder/<fil>.jpg och
// data/matchbilder.json { omgang, lag: { <lag>: {fil, kalla, foto, sida, datum, w, h} } }, som bygget
// (src/build.js) lägger i matchbladen i sajtens data/poddsidor.json (bilder: [hemma, borta]).
//
//   node scripts/tidning/matchbilder.mjs            hämtar det som saknas och skriver ut filerna
//   node scripts/tidning/matchbilder.mjs --behover  slutar med 0 om något ska hämtas, annars 3, utan att hämta

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { veckansBilder, bildverktyg } from '../../src/analyser/tidning-bilder.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = path.join(ROOT, 'data');
const CACHE = path.join(DATA, 'cache', 'matchbilder');
const INDEX = path.join(CACHE, 'index.json');
const UT = path.join(DATA, 'matchbilder');
const UT_JSON = path.join(DATA, 'matchbilder.json');
// Ett lag utan bild prövas igen efter så här många timmar.
const FORSOK_TIMMAR = 6;
// Bildernas bredd: halva matchbladet i dubbel upplösning.
const BREDD = 800;
// Bara artiklar som handlar om laget (poang i tidning-bilder.mjs minst 0): inte om en annan klubb, ett rykte eller
// en minnesstund, så att bilden hellre saknas än visar fel lag (2026-11-10, efter den första hämtningen).
const MIN_POANG = 0;
// Byts den väljs bilderna om (cachen gäller bara samma version).
const VERSION = 6;
// Andra försöket för ett lag utan bild: allt i lagets eget BBC-flöde duger utom rykten och minnesord (en
// matchrapport där motståndaren står först, cupförlusten), och artiklar upp till så här många dagar gamla.
const ANDRA_DAGAR = 14;
const BEHOVER = process.argv.includes('--behover');

const las = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

const ps = las(path.join(DATA, 'poddsidor.json'), null);
if (!ps || !Array.isArray(ps.sidor) || !ps.sidor.length) {
  console.log('matchbilder: inga matchblad i data/poddsidor.json');
  process.exit(BEHOVER ? 3 : 0);
}
const omgang = String(ps.omgang || '');
const lagen = [...new Set(ps.sidor.flatMap((s) => s.lag || []).filter(Boolean))];
const mot = Object.fromEntries(ps.sidor.flatMap((s) => (s.lag && s.lag.length === 2 ? [[s.lag[0], s.lag[1]], [s.lag[1], s.lag[0]]] : [])));
// De insatta mediernas artiklar om laget är veckans och handlar om laget: de prövas före Bing News.
const kallor = {};
for (const s of ps.sidor) {
  for (const [i, d] of (s.delar || []).entries()) {
    const lag = (s.lag || [])[i] || d.lag;
    for (const k of d.kallor || []) {
      if (k && k.typ === 'media' && k.adress) (kallor[lag] = kallor[lag] || []).push({ url: k.adress, title: k.avsnitt || '', source: k.podd, publishedAt: k.datum ? `${k.datum}T12:00:00.000Z` : null });
    }
  }
}

let index = las(INDEX, null);
if (!index || index.omgang !== omgang || index.version !== VERSION || !index.lag) index = { omgang, version: VERSION, lag: {} };
const now = Date.now();
const harBild = (lag) => { const x = index.lag[lag]; return Boolean(x && x.fil && fs.existsSync(path.join(CACHE, x.fil))); };
const nyligen = (lag) => { const x = index.lag[lag]; return Boolean(x && x.forsokt && now - Date.parse(x.forsokt) < FORSOK_TIMMAR * 36e5); };
const saknas = lagen.filter((lag) => !harBild(lag) && !nyligen(lag));

if (BEHOVER) {
  console.log(`matchbilder: ${saknas.length ? `${saknas.length} lag ska få en bild` : 'inget att hämta'}`);
  process.exit(saknas.length ? 0 : 3);
}

fs.mkdirSync(CACHE, { recursive: true });
if (saknas.length && !bildverktyg()) {
  console.log('matchbilder: varken sips eller ImageMagick finns, inga nya bilder');
} else if (saknas.length) {
  console.log(`matchbilder: hämtar bilder för ${saknas.length} lag (omgången ${omgang})`);
  // samma bild används inte för två lag, inte heller mellan försöken
  const tagna = new Set();
  const opts = { mapp: CACHE, mot, kallor, bredd: BREDD, minPoang: MIN_POANG, alla: lagen, tagna, now, logg: (t) => console.log(`  ${t}`) };
  const hittade = await veckansBilder(saknas, opts);
  const kvar = saknas.filter((lag) => !hittade.get(lag));
  if (kvar.length) {
    console.log(`matchbilder: andra försöket för ${kvar.join(', ')}`);
    const fler = await veckansBilder(kvar, { ...opts, egnaBbc: true, dagar: ANDRA_DAGAR });
    for (const [lag, x] of fler) hittade.set(lag, x);
  }
  for (const lag of saknas) index.lag[lag] = hittade.get(lag) || { forsokt: new Date(now).toISOString() };
}

// Cachen: bara omgångens bilder.
const behall = new Set(Object.values(index.lag).map((x) => x && x.fil).filter(Boolean));
for (const f of fs.readdirSync(CACHE)) if (/\.jpg$/.test(f) && !behall.has(f)) fs.rmSync(path.join(CACHE, f), { force: true });
fs.writeFileSync(INDEX, `${JSON.stringify(index, null, 1)}\n`);

fs.rmSync(UT, { recursive: true, force: true });
fs.mkdirSync(UT, { recursive: true });
const ut = {};
for (const lag of lagen) {
  if (!harBild(lag)) continue;
  const { fil, kalla, foto, sida, datum, w, h } = index.lag[lag];
  fs.copyFileSync(path.join(CACHE, fil), path.join(UT, fil));
  ut[lag] = { fil, kalla: kalla || null, foto: foto || null, sida: sida || null, datum: datum || null, w, h };
}
fs.writeFileSync(UT_JSON, `${JSON.stringify({ omgang, lag: ut }, null, 1)}\n`);
console.log(`matchbilder: ${Object.keys(ut).length} av ${lagen.length} lag har en bild`);
for (const lag of lagen) {
  const x = ut[lag];
  console.log(`  ${lag}: ${x ? `${x.kalla || '?'}${x.datum ? ` (${String(x.datum).slice(0, 10)})` : ''} ${x.sida || ''}` : 'ingen bild'}`);
}
