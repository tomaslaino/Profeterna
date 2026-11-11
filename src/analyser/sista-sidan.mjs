// Helgarderats sista sida: Hasse Backes krönika, Vid sidan av (det udda om omgångens lag, sådant
// som inte står i matchbladen) och ett kåseri av en påhittad person, en ny varje vecka. Skrivs på iMacen med Claude Code på
// användarens konto (scripts/analyser/skriv.mjs), ett anrop per omgång när matchbladen har kommit.
// Prompten och gränserna står i config/sista-sidan.js och sidan sparas i data/sista-sidan.json,
// som tidningen ritar (public/rum-tidning.js).
//
// Kontrollerna: en notis i Vid sidan av följer bara med om dess källa kom upp i en sökning eller
// på en läst sida och varje tal i den står i underlaget eller i det Claude läste; krönikan och
// kåseriet är fiktion i personernas röst, men årtal och resultat i dem ska också gå att hitta där.
// Ingenting får innehålla tips. Det som inte klarar sig får Claude skriva om en gång, utan verktyg
// men med det den läste.

import sc from '../../config/sista-sidan.js';
import newsCfg from '../../config/news.js';
import { citer, see, jsonOf, unknownNumbers } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';

// Tipsspråk hör inte hemma på sidan (gardera får Hasse säga, men inte om en viss match).
const TIPS_RE = /\b(spik\w*|odds\w*|favorit(?:en|er|erna)?|helgardera\w*|halvgardera\w*)\b/i;
// Årtal och resultat i krönikan och kåseriet: de ska stå i underlaget eller det Claude läste.
const STORA_RE = /\b\d{3,}\b|\b\d+\s*[–-]\s*\d+\b/g;
const MAX_LAST = 60000;
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ord = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const lagI = (round) => round.matcher.flatMap((x) => String(x.match || '').split(/\s+[–-]\s+/)).map((s) => s.trim()).filter(Boolean);

export const systemPrompt = () => sc.systemPrompt
  .replace('{sokningar}', sc.sokningar).replace('{sidor}', sc.sidor).replaceAll('{rubrikOrd}', sc.rubrikOrd)
  .replace('{kronikaMin}', sc.kronika[0]).replace('{kronikaMax}', sc.kronika[1])
  .replace('{kaseriMin}', sc.kaseri[0]).replace('{kaseriMax}', sc.kaseri[1])
  .replace('{notisMin}', sc.notis[0]).replace('{notisMax}', sc.notis[1]).replace('{notiser}', sc.notiser);

// Ska sidan skrivas nu? nu: data/sista-sidan.json som den ligger, blad: data/poddsidor.json. En gång
// per omgång, när omgångens matchblad finns (då vet sidan vad som redan står i tidningen), och igen
// bara med en ny prompt. När alla matcher har börjat står sidan kvar som den är. → {skriv, varfor}
export function attSkrivaSista(round, nu, blad, { now = Date.now(), tvinga = false } = {}) {
  if (!round.matcher.some((x) => Date.parse(x.avspark) > now)) return { skriv: false, varfor: 'alla matcher har börjat' };
  if (!blad || blad.omgang !== round.id || !(blad.sidor || []).length) return { skriv: false, varfor: 'inga matchblad än' };
  if (tvinga) return { skriv: true, varfor: 'tvingad' };
  if (!nu || nu.omgang !== round.id) return { skriv: true, varfor: 'ny omgång' };
  if (nu.version !== sc.promptVersion) return { skriv: true, varfor: 'ny prompt' };
  return { skriv: false, varfor: 'aktuell' };
}

// Underlaget: omgångens matcher i kupongens ordning med matchbladets rubrik, ingress och
// sammanfattning, så att sidan inte upprepar dem, och de senaste veckornas kåsörer (tidigare:
// [{av, om}]), så att kåseriet får en ny.
export function sistaUnderlag(round, blad, tidigare = []) {
  const s = new Map(((blad && blad.sidor) || []).map((x) => [String(x.id), x]));
  return {
    matcher: round.matcher.map((x, i) => {
      const b = s.get(String(x.id));
      return { nr: i + 1, match: x.match || null, avspark: x.avspark || null,
        ...(b ? { matchbladet: { rubrik: b.rubrik || null, ingress: b.ingress || null, sammanfattning: b.summering || null } } : { matchbladet: null }) };
    }),
    'de senaste veckornas kåsörer': tidigare.filter((k) => k && k.av).map((k) => (k.om ? `${k.av}, ${k.om}` : k.av)),
  };
}

// Svaret som JSON → {kronika: {rubrik, stycken}, sidan: [{lag, text, kalla}], kaseri: {rubrik, stycken}} eller null.
export function sidanAv(content) {
  try {
    const j = jsonOf(content);
    const text = (x) => (x && str(x.rubrik) && Array.isArray(x.stycken) ? { rubrik: str(x.rubrik), stycken: x.stycken.map(str).filter(Boolean) } : null);
    const k = j['kåseri'];
    const notiser = Array.isArray(j['vid sidan av']) ? j['vid sidan av'] : [];
    return {
      kronika: text(j['krönika']),
      sidan: notiser.map((n) => ({ lag: str(n && n.lag), text: str(n && n.text), kalla: n && n['källa'] && typeof n['källa'].url === 'string' ? n['källa'] : null }))
        .filter((n) => n.lag && n.text),
      kaseri: text(k) && { av: str(k.av), om: str(k.om), ...text(k) },
    };
  } catch {
    return null;
  }
}

// Det som är fel i krönikan eller kåseriet. granser: [min, max] ord. known: underlaget och det Claude läste.
export function textFel(t, granser, known) {
  if (!t || !t.stycken.length) return ['saknas'];
  const why = [];
  const helt = t.stycken.join(' ');
  const w = ord(helt);
  if (w < granser[0] - 20 || w > granser[1] + 40) why.push(`${w} ord i stället för ${granser[0]}–${granser[1]}`);
  if (ord(t.rubrik) > sc.rubrikOrd + 2) why.push('en för lång rubrik');
  const tips = `${t.rubrik} ${helt}`.match(TIPS_RE);
  if (tips) why.push(`tipsspråk ("${tips[0]}")`);
  const stora = [...`${t.rubrik} ${helt}`.matchAll(STORA_RE)].map((m) => m[0]).join(' ');
  const bad = stora ? unknownNumbers([stora], known) : [];
  if (bad.length) why.push(`årtal eller resultat som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  return why;
}

// Det som är fel i kåsören: namnet, vem hen är, och att hen inte har skrivit förut. tidigare: [{av, om}].
export function kasorFel(k, tidigare = []) {
  if (!k) return [];
  const why = [];
  if (!k.av || ord(k.av) > 4) why.push('inget namn på kåsören, eller ett för långt');
  if (!k.om || ord(k.om) > 10) why.push('inte vem kåsören är, eller för mycket om det');
  const enkelt = (s) => String(s || '').toLowerCase().replace(/[^\p{L} ]/gu, '').trim();
  if (k.av && tidigare.some((x) => x && enkelt(x.av) === enkelt(k.av))) why.push(`${k.av} har redan skrivit ett kåseri`);
  return why;
}

// Det som är fel i en notis i Vid sidan av. lagen: omgångens lag.
export function notisFel(n, known, seen, lagen) {
  const why = [];
  const w = ord(n.text);
  if (w < sc.notis[0] - 8 || w > sc.notis[1] + 15) why.push(`${w} ord i stället för ${sc.notis[0]}–${sc.notis[1]}`);
  if (!lagen.includes(n.lag)) why.push(`laget "${n.lag}" finns inte i omgången`);
  const tips = n.text.match(TIPS_RE);
  if (tips) why.push(`tipsspråk ("${tips[0]}")`);
  const bad = unknownNumbers([n.text], known);
  if (bad.length) why.push(`tal som varken står i underlaget eller på en läst sida (${bad.join(', ')})`);
  if (!n.kalla || !citer([{ ...n.kalla, n: 1 }], seen).fix('[1]')) why.push('ingen källa som kom upp i en sökning eller på en läst sida');
  return why;
}

// Notisen som den sparas, med källan som tidningen anger den.
function byggNotis(n, seen) {
  const { fix, list } = citer([{ ...n.kalla, n: 1 }], seen);
  fix('[1]');
  const k = list[0];
  return { lag: n.lag, text: n.text, kalla: { source: k.source, title: k.title, url: k.url, publishedAt: k.publishedAt } };
}

// Skriver omgångens sista sida. blad: data/poddsidor.json, forra: data/sista-sidan.json som den
// ligger (för de senaste kåsörerna). → {ok: true, sida, meta} eller {ok: false, error}. Fel från
// Claude Code kastas (src/analyser/claude.mjs).
export async function skrivSista(round, blad, { forra = null, now = () => new Date(), claude = claudeSvar } = {}) {
  // De senaste kåsörerna, utom den som skrev en tidigare version av den här omgångens sida.
  const tidigare = ((forra && forra.kasorer) || []).filter((k) => !(forra.omgang === round.id && forra.kaseri && k.av === forra.kaseri.av)).slice(0, sc.kasorer);
  const underlag = sistaUnderlag(round, blad, tidigare);
  const lagen = lagI(round);
  const seen = new Map();
  const read = [];
  const meta = { searches: 0, fetches: 0, seconds: 0, dollars: 0 };
  const opts = { system: systemPrompt(), model: sc.model, effort: sc.effort, timeoutMs: sc.timeoutMs };
  const fraga = `Nu är det ${nowFmt.format(now())} svensk tid.\n\nOmgångens matcher och matchbladen (JSON):\n${JSON.stringify(underlag)}`;
  let model = sc.model;
  let kronika = null;
  let kaseri = null;
  const notiser = [];

  let r = await claude({ ...opts, prompt: fraga, tools: sc.tools, blocked: newsCfg.excludeDomains });
  let fel = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const f of r.found) see(seen, f.url, f.title, f.date);
    read.push(...r.read);
    meta.searches += r.searches;
    meta.fetches += r.fetches;
    meta.seconds += r.seconds;
    if (r.dollars != null) meta.dollars += r.dollars;
    if (r.refused) break;
    model = r.model || model;
    const known = [underlag, read.join('\n')];
    const svar = sidanAv(r.content) || { kronika: null, sidan: [], kaseri: null };
    fel = [];
    if (!kronika) {
      const why = textFel(svar.kronika, sc.kronika, known);
      if (why.length) fel.push(`krönikan: ${why.join(' och ')}`);
      else kronika = svar.kronika;
    }
    if (!kaseri) {
      const why = [...textFel(svar.kaseri, sc.kaseri, known), ...kasorFel(svar.kaseri, tidigare)];
      if (why.length) fel.push(`kåseriet: ${why.join(' och ')}`);
      else kaseri = svar.kaseri;
    }
    for (const n of svar.sidan) {
      if (notiser.length >= sc.notiser || notiser.some((x) => x.lag === n.lag)) continue;
      const why = notisFel(n, known, seen, lagen);
      if (why.length) fel.push(`notisen om ${n.lag}: ${why.join(' och ')}`);
      else notiser.push(byggNotis(n, seen));
    }
    const klar = kronika && kaseri && notiser.length >= sc.minstNotiser;
    if (klar || attempt === 2) break;
    const sagt = read.join('\n\n').slice(0, MAX_LAST);
    r = await claude({ ...opts, tools: [], prompt: `${fraga}\n\nDu har redan läst på och kan inte söka mer. Det här läste du:\n${sagt}\n\nDitt förra svar:\n${r.content}\n\nDet här gick inte igenom:\n${fel.join('\n')}\n\nSkriv om de delarna – inga tips eller odds, tal bara som de står i underlaget eller på en sida du har läst, och varje notis med en källa du har läst – och svara bara med samma JSON.` });
  }
  if (!kronika || !kaseri || notiser.length < sc.minstNotiser) {
    return { ok: false, error: r.refused ? 'Claude avböjde att skriva sista sidan.' : `sista sidan gick inte igenom (${fel.slice(0, 4).join('; ') || 'inget svar'})` };
  }
  // Notiserna i kupongens ordning.
  const ordning = (lag) => lagen.indexOf(lag);
  const sida = {
    omgang: round.id,
    matcher: round.matcher.map((x) => String(x.id)),
    skriven: now().toISOString(),
    model,
    version: sc.promptVersion,
    kronika: { av: 'Hasse Backe', ...kronika },
    sidan: notiser.sort((a, b) => ordning(a.lag) - ordning(b.lag)),
    kaseri,
    // De senaste veckornas kåsörer, den här först, så att nästa vecka får en ny.
    kasorer: [{ av: kaseri.av, om: kaseri.om }, ...tidigare].slice(0, sc.kasorer),
  };
  return { ok: true, sida, meta };
}
