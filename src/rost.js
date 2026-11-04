'use strict';

// Hasse Backes röst (fiktiv) i tobaksaffären: ljudet till allt han säger, så att
// det hörs (public/rum-hasse.js). Han säger två slags saker:
//   - de färdiga replikerna i public/rum-hasse-repliker.js, med fälten ifyllda
//     ({namn} efternamnen i gänget, {dag} när spelstoppet är, {du} och {Bada}
//     tecken i ord), och
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
const DAG = 86400000;

const enkel = (t) => String(t).replace(/\s+/g, ' ').trim();

// ---------- vad han säger ----------

// Tecknen i ord som sidan skriver dem (iOrd i rum-hasse.js).
const ORD = ['etta', 'kryss', 'tvåa'];
const MANGDER = [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]];
const iOrd = (m) => (m.length === 3 ? 'helgardering' : m.map((i) => ORD[i]).join(' och '));
const stor = (t) => t.replace(/^./, (c) => c.toUpperCase());
const DAGAR = ['i dag', 'i morgon', ...['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'].map((d) => `på ${d}`)];
// Knapparna (lar) sägs inte, och inte heller att han har tappat rösten.
const TYSTA = new Set(['lar', 'utanRost']);

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

const avtryck = (t) => crypto.createHash('sha256').update(JSON.stringify([rc.voice, rc.rate, rc.pitch, rc.format, enkel(t)])).digest('hex').slice(0, 16);

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
async function fyll({ env = process.env, bank = BANK, gang = [], analyser, now = Date.now(), fetcher, vila = (ms) => new Promise((ok) => setTimeout(ok, ms)), max = rc.perBygge } = {}) {
  const alla = texter({ analyser, gang, now });
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
// cachen. → {filer: antal meningar med ljud, av: antal meningar}
function publicera(dataDir, { bank = BANK, gang = [], analyser, now = Date.now() } = {}) {
  const alla = texter({ analyser, gang, now });
  const filer = {};
  for (const t of alla) {
    const h = avtryck(t);
    if (fs.existsSync(path.join(bank, `${h}.mp3`))) filer[t] = h;
  }
  const n = Object.keys(filer).length;
  if (n) {
    const mapp = path.join(dataDir, 'rost');
    fs.mkdirSync(mapp, { recursive: true });
    for (const h of new Set(Object.values(filer))) fs.copyFileSync(path.join(bank, `${h}.mp3`), path.join(mapp, `${h}.mp3`));
  }
  // Registret finns alltid, så att sidan inte får 404 när han är tyst.
  fs.writeFileSync(path.join(dataDir, 'rost.json'), JSON.stringify({ rost: rc.voice, filer }));
  // Det som används nu får dagens datum; det som inte använts på sparasDagar tas bort.
  if (fs.existsSync(bank)) {
    const anvant = lasAnvant(bank);
    const idag = new Date(now).toISOString().slice(0, 10);
    for (const h of Object.values(filer)) anvant[h] = idag;
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
  return { filer: n, av: alla.length };
}

module.exports = { fyll, publicera, texter, repliktexter, analystexter, avtryck, ssml, BANK };
