// Veckans löpsedel inför omgången: Claude väljer den mest uppseendeväckande nyheten ur det som
// redan har samlats in (matchbladen ur forum, poddar och lokaltidningar, och tidningens notiser)
// och skriver den som en kvällstidnings löpsedel. Skrivs på iMacen med Claude Code på användarens
// konto (scripts/analyser/skriv.mjs), utan verktyg, när omgångens matchblad har kommit och igen
// när de har uppdaterats, fram till första avsparken. Prompten och gränserna står i
// config/lopsedel.js och rubriken sparas i data/lopsedel.json, som löpsedeln ritar
// (public/rum-affischer.js).
//
// Kontrollerna: raderna, vinjetten, raden under och den andra nyheten håller sig inom
// gränserna, varje tal står i underlaget och inget är tips. Det som inte klarar sig får
// Claude skriva om en gång.

import lc from '../../config/lopsedel.js';
import { jsonOf, unknownNumbers } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';

const TIPS_RE = /\b(spik\w*|odds\w*|favorit\w*|helgardera\w*|halvgardera\w*|procent)\b|%/i;
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ord = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ') : null);
const tecken = (s) => [...String(s || '')].length;

export const systemPrompt = () => lc.systemPrompt
  .replace('{raderMin}', lc.rader[0]).replace('{raderMax}', lc.rader[1])
  .replace('{rubrikOrd}', lc.rubrikOrd).replace('{radTecken}', lc.radTecken).replace('{vinjettOrd}', lc.vinjettOrd)
  .replace('{underTecken}', lc.underTecken).replace('{plusTecken}', lc.plusTecken);

// Ska löpsedeln skrivas nu? nu: data/lopsedel.json som den ligger, blad: data/poddsidor.json.
// När omgångens matchblad finns, igen när de har uppdaterats eller prompten är ny, och bara innan
// första avsparken (sedan handlar löpsedeln om gängets tips). → {skriv, varfor}
export function attSkrivaLopsedel(round, nu, blad, { now = Date.now(), tvinga = false } = {}) {
  if (round.matcher.some((x) => Date.parse(x.avspark) <= now)) return { skriv: false, varfor: 'omgången har börjat' };
  if (!blad || blad.omgang !== round.id || !(blad.sidor || []).length) return { skriv: false, varfor: 'inga matchblad än' };
  if (tvinga) return { skriv: true, varfor: 'tvingad' };
  if (!nu || nu.omgang !== round.id) return { skriv: true, varfor: 'ny omgång' };
  if (nu.version !== lc.promptVersion) return { skriv: true, varfor: 'ny prompt' };
  if (nu.underlag !== (blad.uppdaterad || null)) return { skriv: true, varfor: 'nya matchblad' };
  return { skriv: false, varfor: 'aktuell' };
}

// Underlaget: omgångens matcher i kupongens ordning, med matchbladet (rubrik, sammanfattning, det som
// står om varje lag och citatet) och tidningens notis. tidning: data/tidning.json, om den gäller omgången.
export function lopsedelUnderlag(round, blad, tidning = null) {
  const s = new Map(((blad && blad.sidor) || []).map((x) => [String(x.id), x]));
  const n = new Map(((tidning && tidning.omgang === round.id && tidning.notiser) || []).map((x) => [String(x.id), x]));
  const citat = (c) => (c && str(c.sagt) ? `”${str(c.sagt)}”${c.vem ? ` (${c.vem}${c.podd ? `, ${c.podd}` : ''})` : c.podd ? ` (${c.podd})` : ''}` : null);
  return round.matcher.map((x, i) => {
    const b = s.get(String(x.id));
    const t = n.get(String(x.id));
    return {
      nr: i + 1,
      match: x.match || null,
      matchbladet: b ? {
        rubrik: b.rubrik || null,
        sammanfattning: b.summering || null,
        lagen: (b.delar || []).map((d) => ({ lag: d.lag, text: (d.text || []).join(' ').slice(0, lc.perLag), citat: citat(d.citat) })),
      } : null,
      notisen: t ? { rubrik: t.rubrik || null, text: t.text || null } : null,
    };
  });
}

// Svaret som JSON → {match, vinjett, rader, rod, under, plus: {match, text}} eller null.
export function lopsedelAv(content) {
  try {
    const j = jsonOf(content);
    const p = j.plus && typeof j.plus === 'object' ? j.plus : { text: j.plus };
    return {
      match: Number(j.match) || null,
      vinjett: str(j.vinjett),
      rader: Array.isArray(j.rader) ? j.rader.map(str).filter(Boolean) : [],
      rod: Number(j['röd'] ?? j.rod) || null,
      under: str(j.under),
      plus: { match: Number(p.match) || null, text: str(p.text) },
    };
  } catch {
    return null;
  }
}

// Det som är fel i svaret. n: antal matcher, known: underlaget.
export function lopsedelFel(r, n, known) {
  if (!r) return ['svaret gick inte att läsa som JSON'];
  const why = [];
  if (!r.match || r.match < 1 || r.match > n) why.push('matchens nummer finns inte i underlaget');
  if (!r.vinjett || ord(r.vinjett) > lc.vinjettOrd) why.push(`vinjetten ska vara en till ${lc.vinjettOrd} ord`);
  if (r.rader.length < lc.rader[0] || r.rader.length > lc.rader[1]) why.push(`rubriken ska ha ${lc.rader[0]}–${lc.rader[1]} rader`);
  const langa = r.rader.filter((x) => tecken(x) > lc.radTecken + 1);
  if (langa.length) why.push(`raderna får ha högst ${lc.radTecken} tecken (${langa.join(', ')})`);
  if (ord(r.rader.join(' ')) > lc.rubrikOrd + 1) why.push(`rubriken ska ha högst ${lc.rubrikOrd} ord`);
  if (!r.rod || r.rod < 1 || r.rod > r.rader.length) why.push('röd ska vara numret på en av raderna');
  if (!r.under || tecken(r.under) > lc.underTecken + 15) why.push(`raden under ska vara högst ${lc.underTecken} tecken`);
  if (!r.plus.text || tecken(r.plus.text) > lc.plusTecken + 4) why.push(`den andra nyheten ska vara högst ${lc.plusTecken} tecken`);
  if (r.plus.match && r.plus.match === r.match) why.push('den andra nyheten ska komma ur en annan match');
  const allt = [r.vinjett, ...r.rader, r.under, r.plus.text].filter(Boolean).join(' ');
  const tips = allt.match(TIPS_RE);
  if (tips) why.push(`tipsspråk eller procent ("${tips[0]}")`);
  const bad = unknownNumbers([allt], known);
  if (bad.length) why.push(`tal som inte står i underlaget (${bad.join(', ')})`);
  return why;
}

// Skriver omgångens löpsedel. blad: data/poddsidor.json, tidning: data/tidning.json.
// → {ok: true, sedel, meta} eller {ok: false, error}. Fel från Claude Code kastas (src/analyser/claude.mjs).
export async function skrivLopsedel(round, blad, { tidning = null, now = () => new Date(), claude = claudeSvar } = {}) {
  const underlag = lopsedelUnderlag(round, blad, tidning);
  const meta = { searches: 0, fetches: 0, seconds: 0, dollars: 0 };
  const opts = { system: systemPrompt(), model: lc.model, effort: lc.effort, timeoutMs: lc.timeoutMs, tools: lc.tools };
  const fraga = `Nu är det ${nowFmt.format(now())} svensk tid.\n\nOmgångens matcher med matchbladen och notiserna (JSON):\n${JSON.stringify(underlag)}`;
  let model = lc.model;
  let r = await claude({ ...opts, prompt: fraga });
  let svar = null;
  let fel = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    meta.seconds += r.seconds;
    if (r.dollars != null) meta.dollars += r.dollars;
    if (r.refused) break;
    model = r.model || model;
    svar = lopsedelAv(r.content);
    fel = lopsedelFel(svar, underlag.length, [underlag]);
    if (!fel.length || attempt === 2) break;
    r = await claude({ ...opts, prompt: `${fraga}\n\nDitt förra svar:\n${r.content}\n\nDet här gick inte igenom:\n${fel.join('\n')}\n\nRätta det och svara bara med samma JSON.` });
  }
  if (fel.length) return { ok: false, error: r.refused ? 'Claude avböjde att skriva löpsedeln.' : `löpsedeln gick inte igenom (${fel.slice(0, 4).join('; ')})` };
  const id = (nr) => (nr && round.matcher[nr - 1] ? String(round.matcher[nr - 1].id) : null);
  const sedel = {
    omgang: round.id,
    matcher: round.matcher.map((x) => String(x.id)),
    skriven: now().toISOString(),
    model,
    version: lc.promptVersion,
    // matchbladen den skrevs ur (data/poddsidor.json, uppdaterad): nya matchblad ger en ny löpsedel
    underlag: (blad && blad.uppdaterad) || null,
    // som löpsedeln ritar den (public/rum-affischer.js): rad [[text, stil]], stil 1 = röd
    rubrik: {
      id: id(svar.match),
      kick: svar.vinjett.toUpperCase(),
      rad: svar.rader.map((t, i) => [t.toUpperCase(), i === svar.rod - 1 ? 1 : 0]),
      // (40 000 bryts inte mitt i talet)
      under: svar.under.replace(/(\d) (?=\d{3}\b)/g, '$1\u00a0'),
      plus: svar.plus.text.toUpperCase(),
      plusId: id(svar.plus.match),
    },
  };
  return { ok: true, sedel, meta };
}
