'use strict';

// Hasse Backes röst (fiktiv) i tobaksaffären: ljudet till allt han säger, så att
// det hörs (public/rum-hasse.js). Han säger två slags saker:
//   - de färdiga replikerna i public/rum-hasse-repliker.js, med fälten ifyllda
//     ({namn} efternamnen i gänget, {dag} när spelstoppet är, {du} och {Bada}
//     tecken i ord, {res} resultatet 0–0 till 4–4), och
//   - sin text till varje analys i data/analyser.json (hasse.stycken), mening för
//     mening, delad som sidan delar den (public/rum-hasse-meningar.js).
//
// Bygget gör två saker (src/build.js):
//   fyll()       tar fram det ljud som saknas med Azures talsyntes på den fria
//                nivån (config/hasse.js, rost) och sparar det i källcachen,
//                data/cache/rost/<avtryck>.mp3. Kommande matcher först, sedan
//                replikerna; högst perBygge anrop, ett var mellanrumMs.
//                Nyckeln är AZURE_SPEECH_KEY; utan den tas inget fram.
//   publicera()  lägger det ljud som finns i _site/data/rost/ och registret
//                _site/data/rost.json: {rost, filer: {"<mening>": "<avtryck>"}}
//                (alltid, också tomt). Sidan slår upp meningen där; saknas den
//                sägs den tyst.
//
// Avtrycket räknas på rösten, takten, tonen, formatet och meningen, så ett nytt
// ljud tas fram när något av det ändras. Ljud som inte använts på sparasDagar
// tas bort ur cachen (data/cache/rost/anvant.json).
//
// Tomas egen röst: iMacen läser upp samma meningar med Chatterbox (scripts/rost/)
// och lägger ljudet i grenen rost: rost.json {filer: {"<mening>": "<avtryck>"}} och
// <avtryck>.mp3. Workflowen hämtar grenen till data/egen-rost/ (EGEN). Där en mening
// finns i den tar publicera() den filen, och fyll() frågar inte Azure om den. Saknas
// grenen eller meningen är det Azure-rösten som förut.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const hc = require('../config/hasse');
const repliker = require('../public/rum-hasse-repliker.js');
const meningar = require('../public/rum-hasse-meningar.js');
const { CACHE_DIR } = require('./store');

const rc = hc.rost;
const ROOT = path.join(__dirname, '..');
const BANK = path.join(CACHE_DIR, 'rost');
const EGEN = process.env.ROST_EGEN ? path.resolve(process.env.ROST_EGEN) : path.join(ROOT, 'data', 'egen-rost');
const DAG = 86400000;

const enkel = (t) => String(t).replace(/\s+/g, ' ').trim();

// ---------- vad han säger ----------

// Tecknen i ord som sidan skriver dem (iOrd i rum-hasse.js).
const ORD = ['etta', 'kryss', 'tvåa'];
const MANGDER = [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]];
const iOrd = (m) => (m.length === 3 ? 'helgardering' : m.map((i) => ORD[i]).join(' och '));
const stor = (t) => t.replace(/^./, (c) => c.toUpperCase());
const DAGAR = ['i dag', 'i morgon', ...['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'].map((d) => `på ${d}`)];
// Resultaten han kan säga: modellens resultatmatris har 0–4 mål per lag (resultatet i rum-hasse.js).
const RESULTAT = [0, 1, 2, 3, 4].flatMap((h) => [0, 1, 2, 3, 4].map((b) => `${h}–${b}`));
// Knapparna (lar, hjalpSvar) sägs inte, och inte heller att han har tappat rösten.
const TYSTA = new Set(['lar', 'hjalpSvar', 'utanRost']);

function mallar(o, ut = [], nyckel = '') {
  if (TYSTA.has(nyckel)) return ut;
  if (typeof o === 'string') ut.push(o);
  else if (Array.isArray(o)) for (const v of o) mallar(v, ut);
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) mallar(v, ut, k);
  return ut;
}

// Varje replik med fälten ifyllda på alla sätt som sidan kan fylla dem.
function repliktexter(gang = []) {
  const namn = [...new Set(gang.map((g) => String(g.namn || '').trim().split(/\s+/).pop()).filter(Boolean))];
  const ut = new Set();
  for (const mall of mallar(repliker)) {
    const falt = new Set([...mall.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
    let fyllningar = [{}];
    const med = (lista, f) => { fyllningar = fyllningar.flatMap((o) => lista.map((v) => f(o, v))); };
    if (falt.has('namn')) med(namn, (o, v) => ({ ...o, namn: v }));
    if (falt.has('dag')) med(DAGAR, (o, v) => ({ ...o, dag: v }));
    if (falt.has('res')) med(RESULTAT, (o, v) => ({ ...o, res: v }));
    if (falt.has('du') && falt.has('Bada')) {
      // det ni båda har är en del av ditt, men inte allt
      const par = MANGDER.flatMap((du) => MANGDER.filter((b) => b.length < du.length && b.every((x) => du.includes(x))).map((b) => [du, b]));
      med(par, (o, [du, b]) => ({ ...o, du: iOrd(du), Bada: stor(iOrd(b)) }));
    } else {
      if (falt.has('du')) med(MANGDER, (o, v) => ({ ...o, du: iOrd(v) }));
      if (falt.has('Bada')) med(MANGDER, (o, v) => ({ ...o, Bada: stor(iOrd(v)) }));
    }
    for (const o of fyllningar) {
      const t = mall.replace(/\{(\w+)\}/g, (_, k) => (o[k] == null ? '' : o[k]));
      if (!/\{\w+\}/.test(t)) ut.add(enkel(t));
    }
  }
  return [...ut];
}

// Meningarna i hans text till analyserna, i analysernas ordning.
function analystexter(analyser = []) {
  const ut = [];
  for (const a of analyser) {
    const st = a && a.hasse && Array.isArray(a.hasse.stycken) ? a.hasse.stycken : [];
    for (const s of st) for (const m of meningar(String(s))) ut.push(enkel(m));
  }
  return ut;
}

function lasAnalyser() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'analyser.json'), 'utf8'));
    return Array.isArray(j.analyser) ? j.analyser : [];
  } catch {
    return [];
  }
}

// Allt han kan säga: kommande matchers text först, sedan replikerna, sedan resten.
function texter({ analyser = lasAnalyser(), gang = [], now = Date.now() } = {}) {
  const kommande = analyser.filter((a) => Date.parse(a.avspark) > now).sort((a, b) => String(a.avspark).localeCompare(String(b.avspark)));
  const spelade = analyser.filter((a) => !kommande.includes(a));
  return [...new Set([...analystexter(kommande), ...repliktexter(gang), ...analystexter(spelade)])];
}

// ---------- talen i ord ----------
//
// Chatterbox får talen som ord: "2–1" blir "två–ett", "28" "tjugoåtta", "40 %"
// "fyrtio procent". Det är oprövat hur den läser siffror. Bara uppläsningen ändras;
// meningen i registret är densamma som på sidan.
const ENTAL = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton'];
const TIOTAL = ['', '', 'tjugo', 'trettio', 'fyrtio', 'femtio', 'sextio', 'sjuttio', 'åttio', 'nittio'];
function iOrdTal(n) {
  if (n < 20) return ENTAL[n];
  if (n < 100) return TIOTAL[Math.floor(n / 10)] + (n % 10 ? ENTAL[n % 10] : '');
  if (n < 1000) return `${n < 200 ? '' : ENTAL[Math.floor(n / 100)]}hundra${n % 100 ? iOrdTal(n % 100) : ''}`;
  // årtal som 1988 och 2026
  if (n >= 1100 && n < 2000) return `${iOrdTal(Math.floor(n / 100))}hundra${n % 100 ? iOrdTal(n % 100) : ''}`;
  if (n < 1000000) return `${n < 2000 ? '' : iOrdTal(Math.floor(n / 1000))}tusen${n % 1000 ? iOrdTal(n % 1000) : ''}`;
  return String(n);
}
function uttal(text) {
  const tal = (d) => iOrdTal(Number(String(d).replace(/\s/g, '')));
  return enkel(text)
    .replace(/(\d+)\s*[–-]\s*(\d+)/g, (_, a, b) => `${tal(a)}–${tal(b)}`)
    .replace(/(\d+),(\d+)/g, (_, a, b) => `${tal(a)} komma ${[...b].map((c) => ENTAL[c]).join(' ')}`)
    .replace(/\d{1,3}(?: \d{3})+|\d+/g, (d) => tal(d))
    .replace(/\s*%/g, ' procent');
}

const avtryck = (t) => crypto.createHash('sha256').update(JSON.stringify([rc.voice, rc.rate, rc.pitch, rc.format, enkel(t)])).digest('hex').slice(0, 16);

// Avtrycket för Tomas egen röst: inställningarna, referensens avtryck (ref) och det som
// läses upp. Ändras något av det tas ljudet fram på nytt.
const egenAvtryck = (t, ref, e = rc.egen) => crypto.createHash('sha256')
  .update(JSON.stringify(['chatterbox', ref, e.sprak, e.exaggeration, e.cfgWeight, e.temperature, e.kbps, uttal(t)]))
  .digest('hex').slice(0, 16);

// Registret i grenen rost, med de filer som finns: {"<mening>": "<avtryck>"}.
function lasEgen(egen = EGEN) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(egen, 'rost.json'), 'utf8'));
    const ut = {};
    for (const [t, h] of Object.entries((j && j.filer) || {})) {
      if (/^[0-9a-f]{16}$/.test(h) && fs.existsSync(path.join(egen, `${h}.mp3`))) ut[enkel(t)] = h;
    }
    return ut;
  } catch {
    return {};
  }
}

// ---------- talsyntesen ----------

const xml = (t) => t.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const ssml = (t) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="sv-SE"><voice name="${rc.voice}"><prosody rate="${rc.rate}" pitch="${rc.pitch}">${xml(enkel(t))}</prosody></voice></speak>`;

// → {ok, ljud: Buffer} eller {ok: false, error, sluta}: sluta = inget mer i det här bygget.
async function syntes(t, { key, region, fetcher = fetch }) {
  let res;
  try {
    res = await fetcher(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': rc.format,
        'User-Agent': 'matchfixarna',
      },
      body: ssml(t),
      signal: AbortSignal.timeout(rc.timeoutMs),
    });
  } catch (err) {
    return { ok: false, error: `Azure svarade inte (${err.message})`, sluta: true };
  }
  if (!res.ok) {
    const text = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
    // 401: fel nyckel; 403: månadens tecken är slut; 429: för många anrop
    return { ok: false, error: `Azure HTTP ${res.status}${text ? `: ${text}` : ''}`, sluta: [401, 403, 429].includes(res.status) || res.status >= 500 };
  }
  const ljud = Buffer.from(await res.arrayBuffer());
  return ljud.length ? { ok: true, ljud } : { ok: false, error: 'Azure gav inget ljud' };
}

// ---------- cachen ----------

function lasAnvant(bank) {
  try {
    return JSON.parse(fs.readFileSync(path.join(bank, 'anvant.json'), 'utf8')) || {};
  } catch {
    return {};
  }
}

// Tar fram det ljud som saknas. → {gjorda, saknas, fel}
async function fyll({ env = process.env, bank = BANK, egen = EGEN, gang = [], analyser, now = Date.now(), fetcher, vila = (ms) => new Promise((ok) => setTimeout(ok, ms)), max = rc.perBygge } = {}) {
  // Det som finns med Tomas egen röst behöver inte Azure.
  const egna = lasEgen(egen);
  const alla = texter({ analyser, gang, now }).filter((t) => !egna[t]);
  const saknas = alla.filter((t) => !fs.existsSync(path.join(bank, `${avtryck(t)}.mp3`)));
  const key = String(env.AZURE_SPEECH_KEY || '').trim();
  if (!saknas.length || !key) return { gjorda: 0, saknas: saknas.length, fel: saknas.length && !key ? 'ingen AZURE_SPEECH_KEY' : null };
  const region = String(env.AZURE_SPEECH_REGION || rc.region).trim();
  fs.mkdirSync(bank, { recursive: true });
  let gjorda = 0;
  let fel = null;
  for (const t of saknas) {
    if (gjorda >= max) break;
    if (gjorda) await vila(rc.mellanrumMs);
    const r = await syntes(t, { key, region, fetcher });
    if (!r.ok) {
      fel = r.error;
      if (r.sluta) break;
      continue;
    }
    const fil = path.join(bank, `${avtryck(t)}.mp3`);
    fs.writeFileSync(`${fil}.tmp`, r.ljud);
    fs.renameSync(`${fil}.tmp`, fil);
    gjorda++;
  }
  return { gjorda, saknas: saknas.length - gjorda, fel };
}

// Lägger ljudet i <dataDir>/rost/ och registret i <dataDir>/rost.json, och städar
// cachen. Tomas egen röst först, Azure där den saknas.
// → {filer: antal meningar med ljud, egna: av dem med egen röst, av: antal meningar}
function publicera(dataDir, { bank = BANK, egen = EGEN, gang = [], analyser, now = Date.now() } = {}) {
  const alla = texter({ analyser, gang, now });
  const egna = lasEgen(egen);
  const filer = {};
  const kalla = {};
  const azure = [];
  for (const t of alla) {
    if (egna[t]) {
      filer[t] = egna[t];
      kalla[egna[t]] = egen;
      continue;
    }
    const h = avtryck(t);
    if (fs.existsSync(path.join(bank, `${h}.mp3`))) {
      filer[t] = h;
      kalla[h] = bank;
      azure.push(h);
    }
  }
  const n = Object.keys(filer).length;
  if (n) {
    const mapp = path.join(dataDir, 'rost');
    fs.mkdirSync(mapp, { recursive: true });
    for (const [h, k] of Object.entries(kalla)) fs.copyFileSync(path.join(k, `${h}.mp3`), path.join(mapp, `${h}.mp3`));
  }
  // Registret finns alltid, så att sidan inte får 404 när han är tyst.
  fs.writeFileSync(path.join(dataDir, 'rost.json'), JSON.stringify({ rost: azure.length < n ? `egen+${rc.voice}` : rc.voice, filer }));
  // Det som används nu får dagens datum; det som inte använts på sparasDagar tas bort.
  if (fs.existsSync(bank)) {
    const anvant = lasAnvant(bank);
    const idag = new Date(now).toISOString().slice(0, 10);
    for (const h of azure) anvant[h] = idag;
    for (const f of fs.readdirSync(bank)) {
      const h = f.replace(/\.mp3$/, '');
      if (h === f) continue;
      if (!anvant[h]) anvant[h] = idag;
      else if (now - Date.parse(anvant[h]) > rc.sparasDagar * DAG) {
        fs.rmSync(path.join(bank, f), { force: true });
        delete anvant[h];
      }
    }
    for (const h of Object.keys(anvant)) if (!fs.existsSync(path.join(bank, `${h}.mp3`))) delete anvant[h];
    fs.writeFileSync(path.join(bank, 'anvant.json'), JSON.stringify(anvant));
  }
  return { filer: n, egna: n - azure.length, av: alla.length };
}

module.exports = { fyll, publicera, texter, repliktexter, analystexter, avtryck, egenAvtryck, uttal, lasEgen, ssml, BANK, EGEN };
