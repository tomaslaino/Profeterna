// Helgarderats familjesida: det som har hänt i omgångens klubbar den här veckan (tränare som kommer,
// går, leder tillfälligt eller sitter löst, återseenden och besked som en klubb väntar på), i en
// dagstidnings familjesidesform. Claude skriver den ur matchbladens underlag (data/poddsidor.json),
// utan verktyg, på iMacen med Claude Code på användarens konto (scripts/analyser/skriv.mjs): när
// omgångens matchblad har kommit och igen när de har uppdaterats, fram till första avsparken, som
// löpsedeln (src/analyser/lopsedel.mjs). Prompten och gränserna står i config/familjesidan.js och
// sidan sparas i data/familjesidan.json, som tidningen ritar (public/rum-tidning.js).
//
// Kontrollerna: varje notis har ett känt slag och ett av omgångens lag, namnet står i underlaget,
// texten håller sig inom gränserna, varje tal står i underlaget och inget är tips. En notis som inte
// klarar sig får Claude skriva om en gång; sedan stryks den. Blir det färre än minstNotiser blir det
// ingen familjesida den veckan (notiser är då tom, så att jobbet inte försöker igen förrän bladen
// har uppdaterats).

import fc from '../../config/familjesidan.js';
import { jsonOf, unknownNumbers } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';

const TIPS_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*|odds\w*|favorit(?:en|er|erna)?|skräll\w*|procent)\b|%/i;
const RAKNEORD = /^(två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv)$/i;
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Notisernas slag i den ordning de står på sidan: de fyra första i var sin ruta, de två sista som listor.
export const SLAG = ['valkommen', 'avflyttad', 'tillforordnad', 'aterseende', 'sitter_lost', 'besked'];
export const LISTOR = ['sitter_lost', 'besked'];

const ord = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ') : null);
const lagI = (round) => [...new Set(round.matcher.flatMap((x) => String(x.match || '').split(/\s+[–-]\s+/)).map((s) => s.trim()).filter(Boolean))];

export const systemPrompt = () => fc.systemPrompt
  .replace('{rubrikOrd}', fc.rubrikOrd).replace('{namnOrd}', fc.namnOrd).replace('{textOrd}', fc.textOrd)
  .replace('{flestNotiser}', fc.flestNotiser).replace('{flestPerLista}', fc.flestPerLista);

// Ska familjesidan skrivas nu? nu: data/familjesidan.json som den ligger, blad: data/poddsidor.json.
// Som löpsedeln: när omgångens matchblad finns, igen när de har uppdaterats eller prompten är ny, och bara
// innan första avsparken. → {skriv, varfor}
export function attSkrivaFamilj(round, nu, blad, { now = Date.now(), tvinga = false } = {}) {
  if (round.matcher.some((x) => Date.parse(x.avspark) <= now)) return { skriv: false, varfor: 'omgången har börjat' };
  if (!blad || blad.omgang !== round.id || !(blad.sidor || []).length) return { skriv: false, varfor: 'inga matchblad än' };
  if (tvinga) return { skriv: true, varfor: 'tvingad' };
  if (!nu || nu.omgang !== round.id) return { skriv: true, varfor: 'ny omgång' };
  if (nu.version !== fc.promptVersion) return { skriv: true, varfor: 'ny prompt' };
  if (nu.underlag !== (blad.uppdaterad || null)) return { skriv: true, varfor: 'nya matchblad' };
  return { skriv: false, varfor: 'aktuell' };
}

// Underlaget: omgångens matcher i kupongens ordning, och för varje lag uppgifterna under det i matchbladet
// (ämne, slag, uppgiften, källan och dagen). blad: data/poddsidor.json.
const SLAGORD = { b: 'bekräftat', h: 'rykte eller källans egen uppgift', o: 'åsikt' };
export function familjUnderlag(round, blad) {
  const s = new Map(((blad && blad.sidor) || []).map((x) => [String(x.id), x]));
  const amnen = (blad && blad.amnen) || {};
  return round.matcher.map((x, i) => {
    const b = s.get(String(x.id));
    return {
      nr: i + 1,
      match: x.match || null,
      lagen: b ? (b.delar || []).map((d) => ({
        lag: d.lag,
        uppgifter: (d.grupper || []).flatMap((g) => (g.punkter || []).map((p) => ({
          amne: amnen[g.amne] || g.amne, slag: SLAGORD[p.s] || p.s, uppgift: p.t, kalla: (p.podd || []).join(', '), dag: (p.datum || []).filter(Boolean).sort().at(-1) || null,
        }))),
      })) : [],
    };
  });
}

// Svaret som JSON → {rubrik, notiser: [{slag, lag, namn, text}]} eller null.
export function familjAv(content) {
  try {
    const j = jsonOf(content);
    return {
      rubrik: str(j.rubrik),
      notiser: (Array.isArray(j.notiser) ? j.notiser : []).filter((n) => n && typeof n === 'object')
        .map((n) => ({ slag: str(n.slag), lag: str(n.lag), namn: str(n.namn), text: str(n.text) })),
    };
  } catch {
    return null;
  }
}

// Det som är fel i en notis (tom lista om den håller). lagen: omgångens lag, allt: underlaget som text.
export function notisFel(n, lagen, allt) {
  const why = [];
  if (!SLAG.includes(n.slag)) why.push(`okänt slag (${n.slag})`);
  if (!lagen.includes(n.lag)) why.push(`laget finns inte i omgången (${n.lag})`);
  if (!n.namn || ord(n.namn) > fc.namnOrd) why.push(`namnet ska vara ett till ${fc.namnOrd} ord`);
  else if (n.namn !== n.lag && !allt.toLowerCase().includes(n.namn.toLowerCase())) why.push(`namnet står inte i underlaget (${n.namn})`);
  if (!n.text || ord(n.text) > fc.textOrd + 4) why.push(`texten ska vara högst ${fc.textOrd} ord`);
  const tips = `${n.namn || ''} ${n.text || ''}`.match(TIPS_RE);
  if (tips) why.push(`tipsord ("${tips[0]}")`);
  const tal = unknownNumbers([n.text], [allt, lagen.join(' ')]).filter((x) => !RAKNEORD.test(String(x)));
  if (tal.length) why.push(`tal som inte står i underlaget (${tal.join(', ')})`);
  return why;
}

// Hela svarets fel: rubriken, för många notiser och varje notis (med sitt nummer).
export function familjFel(r, lagen, allt) {
  if (!r) return ['svaret gick inte att läsa som JSON'];
  const why = [];
  if (!r.rubrik || ord(r.rubrik) > fc.rubrikOrd + 2) why.push(`rubriken ska vara högst ${fc.rubrikOrd} ord`);
  const rtal = r.rubrik ? unknownNumbers([r.rubrik], [allt]).filter((x) => !RAKNEORD.test(String(x))) : [];
  if (rtal.length) why.push(`tal i rubriken som inte står i underlaget (${rtal.join(', ')})`);
  if (r.notiser.length > fc.flestNotiser) why.push(`högst ${fc.flestNotiser} notiser`);
  for (const l of LISTOR) if (r.notiser.filter((n) => n.slag === l).length > fc.flestPerLista) why.push(`högst ${fc.flestPerLista} notiser av slaget ${l}`);
  r.notiser.forEach((n, i) => { const f = notisFel(n, lagen, allt); if (f.length) why.push(`notis ${i + 1} (${n.namn || '?'}): ${f.join(', ')}`); });
  return why;
}

// Skriver omgångens familjesida. blad: data/poddsidor.json.
// → {ok: true, sida, meta} eller {ok: false, error}. Fel från Claude Code kastas (src/analyser/claude.mjs).
export async function skrivFamilj(round, blad, { now = () => new Date(), claude = claudeSvar } = {}) {
  const underlag = familjUnderlag(round, blad);
  const lagen = lagI(round);
  const allt = JSON.stringify(underlag);
  const meta = { searches: 0, fetches: 0, seconds: 0, dollars: 0 };
  const opts = { system: systemPrompt(), model: fc.model, effort: fc.effort, timeoutMs: fc.timeoutMs, tools: fc.tools };
  const fraga = `Nu är det ${nowFmt.format(now())} svensk tid.\n\nOmgångens matcher med uppgifterna om lagen (JSON):\n${allt}`;
  let model = fc.model;
  let r = await claude({ ...opts, prompt: fraga });
  let svar = null;
  let fel = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    meta.seconds += r.seconds;
    if (r.dollars != null) meta.dollars += r.dollars;
    if (r.refused) break;
    model = r.model || model;
    svar = familjAv(r.content);
    fel = familjFel(svar, lagen, allt);
    if (!fel.length || attempt === 2) break;
    r = await claude({ ...opts, prompt: `${fraga}\n\nDitt förra svar:\n${r.content}\n\nDet här gick inte igenom:\n${fel.join('\n')}\n\nRätta det och svara bara med samma JSON.` });
  }
  if (!svar || !svar.rubrik) return { ok: false, error: r.refused ? 'Claude avböjde att skriva familjesidan.' : `familjesidan gick inte igenom (${fel.slice(0, 4).join('; ')})` };
  // Efter två försök stryks det som fortfarande inte håller; listorna kortas till flestPerLista.
  const per = new Map();
  const notiser = svar.notiser.filter((n) => !notisFel(n, lagen, allt).length).filter((n) => {
    if (!LISTOR.includes(n.slag)) return true;
    per.set(n.slag, (per.get(n.slag) || 0) + 1);
    return per.get(n.slag) <= fc.flestPerLista;
  }).slice(0, fc.flestNotiser);
  const sida = {
    omgang: round.id,
    matcher: round.matcher.map((x) => String(x.id)),
    skriven: now().toISOString(),
    model,
    version: fc.promptVersion,
    // matchbladen den skrevs ur (data/poddsidor.json, uppdaterad): nya matchblad ger en ny familjesida
    underlag: (blad && blad.uppdaterad) || null,
    rubrik: svar.rubrik,
    // färre än minstNotiser: ingen familjesida den veckan
    notiser: notiser.length >= fc.minstNotiser ? notiser.sort((a, b) => SLAG.indexOf(a.slag) - SLAG.indexOf(b.slag)) : [],
  };
  return { ok: true, sida, meta };
}
