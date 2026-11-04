// Omgångens namn (Kupong → Omgången och förstasidan). Macen döper omgången med
// Claude Code på användarens konto (scripts/analyser/skriv.mjs), så snart den
// finns. Prompten och gränserna står i config/namn.js. Namnet sparas i
// data/omgangsnamn.json per omgång och matcher: ändras matcherna får omgången
// ett nytt namn. Omgången och matchernas underlag (data/match/<id>.json: arena,
// odds, tabell, form, vila, tidigare möten) och gängets senaste kupong läses ur
// tjänsten och den publicerade sajten. De senaste namnen följer med i
// underlaget, så att namnen inte går i samma mönster.

import nc from '../../config/namn.js';
import { foreignNumbers, pctOdds } from './underlag.mjs';
import { claudeSvar } from './claude.mjs';

const RECENT_MAX = 12;

// Omgången och dess matcher, som sidan räknar den (public/samtal.js, nameKey).
export const namnNyckel = (round) => `${round.id}:${round.matcher.map((x) => String(x.id)).sort().join(',')}`;

const COMP = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two', fac: 'FA-cupen', lc: 'Ligacupen' };
// Tävlingarna i lagens form och schema (ESPN:s förkortningar).
const OTHER = { EFL: 'ligacupen', FAC: 'FA-cupen', CL: 'Champions League', EL: 'Europa League', ECL: 'Conference League' };
const RES = { V: 'seger', O: 'oavgjort', F: 'förlust' };
const tz = { timeZone: 'Europe/Stockholm' };
const kickFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long' });
const todayFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const ordinal = (n) => `${n}:${n % 10 <= 2 && n % 10 >= 1 && ![11, 12].includes(n % 100) ? 'a' : 'e'}`;
const dec = (x, d = 1) => x.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
const odds = (x) => (x ? dec(x, 2) : '–');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
// Som man säger det: "ingen seger", "1 seger", "3 segrar".
const count = (n, none, one, many) => (n === 0 ? none : plural(n, one, many));
// Tabelläget i ord först: "sist i League One (24:e av 24)".
const place = (rank, size, league) => {
  const where = league ? ` i ${league}` : '';
  const word = rank === 1 ? 'etta' : rank === size ? 'sist' : rank === size - 1 ? 'näst sist' : null;
  return word ? `${word}${where} (${ordinal(rank)} av ${size})` : `${ordinal(rank)} av ${size}${where}`;
};

// Lagets läge inför matchen, ur matchens underlag (teams.home/away).
function teamFacts(t, side) {
  if (!t) return null;
  const out = {};
  if (t.table && t.table.rank) {
    out.tabell = `${place(t.table.rank, t.table.size, t.league && t.league.name)}, ${plural(t.table.points, 'poäng', 'poäng')} på ${plural(t.table.played, 'match', 'matcher')}`;
  }
  const rec = t.record && t.record[side];
  if (rec && rec.n) {
    out[side === 'home' ? 'hemma i år' : 'borta i år'] = `${count(rec.w, 'ingen seger', 'seger', 'segrar')}, ${count(rec.d, 'ingen oavgjord', 'oavgjord', 'oavgjorda')}, ${count(rec.l, 'ingen förlust', 'förlust', 'förluster')}, ${plural(rec.gf, 'gjort mål', 'gjorda mål')} och ${plural(rec.ga, 'insläppt', 'insläppta')}`;
  }
  if (Array.isArray(t.form) && t.form.length) {
    const own = t.league ? t.league.id : null;
    out['senaste matcherna, senast först'] = t.form.slice(0, 5).map((f) => `${RES[f.result] || f.result} ${f.gf}–${f.ga} ${f.home ? 'hemma' : 'borta'} mot ${f.opponent}` +
      (f.comp && String(f.comp).toLowerCase() !== own ? ` (${OTHER[f.comp] || f.comp})` : ''));
  }
  const xg = t.stats && t.stats.xgDiff;
  if (xg && xg.n) {
    const vs = (x, what) => `${what} ${dec(Math.abs(x))} ${x >= 0 ? 'fler' : 'färre'} än xG`;
    out['mål mot xG'] = `${vs(xg.for, 'gjort')}, ${vs(xg.against, 'släppt in')} (${plural(xg.n, 'match', 'matcher')})`;
  }
  const sc = t.schedule;
  if (sc) {
    const s2 = [];
    if (sc.last && sc.last.days != null) s2.push(`${plural(sc.last.days, 'dag', 'dagar')} sedan förra matchen`);
    if (sc.next && sc.next.opponent) s2.push(`nästa: ${sc.next.home ? 'hemma' : 'borta'} mot ${sc.next.opponent}${sc.next.comp && OTHER[sc.next.comp] ? ` i ${OTHER[sc.next.comp]}` : ''} ${plural(sc.next.days, 'dag', 'dagar')} senare`);
    if (sc.recentEurope) s2.push(`${plural(sc.recentEurope, 'match', 'matcher')} i Europa de senaste ${sc.windowDays} dagarna`);
    if (s2.length) out.schema = s2.join(', ');
  }
  return Object.keys(out).length ? out : null;
}

// Modellens chans för 1, X och 2 i hela procent, ur underlaget eller
// matchlistan.
function chances(d) {
  const p = d && d.prediction && d.prediction.status === 'ok' && Array.isArray(d.prediction.p) ? d.prediction.p : null;
  return p ? p.map((x) => Math.round(x * 100)) : null;
}

// Underlaget som modellen ser: omgången i korthet, matcherna i
// avsparksordning med det som står på matchsidan, gängets senaste kupong och
// namnen som tidigare omgångar fått.
export function roundPayload(round, { details = {}, history = null, recent = [] } = {}) {
  const rows = round.matcher.map((x) => {
    const d = details[String(x.id)] || null;
    const m = d && d.match;
    const p = chances(d);
    const o = m && m.odds;
    const pm = d && d.pastMeetings && Array.isArray(d.pastMeetings.list) ? d.pastMeetings.list : [];
    return {
      t: Date.parse(x.avspark),
      home: m ? m.home : null,
      away: m ? m.away : null,
      p,
      row: {
        match: m ? `${m.home} – ${m.away}` : x.match,
        ...(m && COMP[m.comp] ? { 'tävling': COMP[m.comp] } : {}),
        ...(m && m.venue ? { arena: m.venue } : {}),
        avspark: Number.isFinite(Date.parse(x.avspark)) ? kickFmt.format(new Date(x.avspark)) : 'okänd',
        'modellens odds': p ? `1: ${pctOdds(p[0])} · X: ${pctOdds(p[1])} · 2: ${pctOdds(p[2])}` : 'okända',
        ...(o && o.home ? { 'spelbolagens odds': `1: ${odds(o.home)} · X: ${odds(o.draw)} · 2: ${odds(o.away)}` } : {}),
        ...(d && d.teams ? { hemmalaget: teamFacts(d.teams.home, 'home'), bortalaget: teamFacts(d.teams.away, 'away') } : {}),
        ...(pm.length ? { 'tidigare möten, senast först': pm.slice(0, 6).map((g) => `${g.date.slice(0, 7)} ${g.home} – ${g.away} ${g.score.home}–${g.score.away}`) } : {}),
      },
    };
  }).sort((a, b) => (a.t || 0) - (b.t || 0));

  // Omgången i korthet: det som syns först när man ser hela kupongen.
  const kicks = rows.map((r) => r.t).filter(Number.isFinite);
  const summary = { matcher: rows.length };
  if (kicks.length) summary.dagar = `${dayFmt.format(new Date(Math.min(...kicks)))} – ${dayFmt.format(new Date(Math.max(...kicks)))}`;
  const count = new Map();
  for (const r of rows) for (const team of [r.home, r.away]) if (team) count.set(team, (count.get(team) || 0) + 1);
  const twice = [...count].filter(([, n]) => n > 1).map(([team, n]) => `${team} (${n} matcher)`);
  if (twice.length) summary['lag som spelar mer än en gång'] = twice;
  const known = rows.filter((r) => r.p);
  if (known.length) {
    const best = (r) => Math.max(...r.p);
    const sign = (r) => ['1', 'X', '2'][r.p.indexOf(best(r))];
    const all = known.reduce((a, r) => a * (best(r) / 100), 1);
    summary['chans till alla rätt med modellens troligaste tecken i varje match'] = `1 på ${Math.round(1 / all).toLocaleString('sv-SE')}${known.length < rows.length ? ` (${known.length} av ${rows.length} matcher)` : ''}`;
    const fav = known.reduce((a, r) => (best(r) > best(a) ? r : a));
    const even = known.reduce((a, r) => (best(r) < best(a) ? r : a));
    summary['största favorit'] = `${fav.row.match}, ${sign(fav)} (odds ${pctOdds(best(fav))})`;
    summary['jämnaste match'] = `${even.row.match} (modellens troligaste tecken ${sign(even)} har odds ${pctOdds(best(even))})`;
  }

  const out = { 'omgången i korthet': summary, matcher: rows.map((r) => r.row) };
  const last = history && Array.isArray(history.coupons) && history.coupons.length
    ? [...history.coupons].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] : null;
  if (last) {
    out['gängets senaste kupong'] = `${last.name ? `${last.name}: ` : ''}${last.ok} av ${last.n} rätt, väntat ${dec(last.exp)}, betyg ${last.grade} av 5`;
  }
  if (recent.length) out['namn som tidigare omgångar fått'] = recent.map((r) => r.namn);
  return out;
}

// Ibland – för ungefär var femte omgång, samma varje gång för samma omgång –
// får namnet gärna anspela på drömmen om storkovan (config/namn.js).
export function dreamOf(id) {
  let h = 2166136261;
  for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return (h % 1000) / 1000 < nc.storkovan;
}

const unquote = (s) => String(s).trim().replace(/^["'”“«»‘’]+|["'”“«»‘’.]+$/g, '').trim();

// JSON-objektet i svaret, också om det står inom ```json … ```.
function partsOf(content) {
  try {
    const text = String(content || '');
    const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    const namn = j && typeof j.namn === 'string' ? unquote(j.namn) : '';
    const syftar = j && typeof j.syftar === 'string' ? j.syftar.trim() : '';
    const forslag = j && Array.isArray(j['förslag']) ? j['förslag'].filter((x) => typeof x === 'string').map(unquote).slice(0, 12) : [];
    return namn ? { namn, syftar: syftar || null, forslag } : null;
  } catch {
    return null;
  }
}

// known: underlaget (och det som hittades på nätet) – talen i förklaringen
// måste finnas där.
function problems({ namn, syftar }, known) {
  const why = [];
  const words = namn.split(/\s+/).filter(Boolean).length;
  if (namn.length > nc.maxChars || words > nc.maxWords) why.push(`för många ord eller tecken (${words} ord, ${namn.length} tecken)`);
  if (/\d/.test(namn)) why.push('siffror');
  if (/[!?]|\p{Extended_Pictographic}/u.test(namn)) why.push('utropstecken, frågetecken eller emojier');
  if (/kupong|omgång|tips/i.test(namn)) why.push('ett av de förbjudna orden');
  if (syftar && syftar.split(/\s+/).length > nc.maxHintWords * 1.5) why.push('en för lång förklaring');
  const bad = syftar ? foreignNumbers(syftar, known) : [];
  if (bad.length) why.push(`tal i "syftar" som inte finns i underlaget (${bad.join(', ')})`);
  return why;
}

// Döper omgången. site: {details, history} ur den publicerade sajten, recent:
// tidigare namn, senaste först. → {ok: true, entry, meta} eller {ok: false, error}.
export async function skrivNamn(round, { site = {}, recent = [], now = () => new Date(), claude = claudeSvar }) {
  const payload = roundPayload(round, { ...site, recent: recent.slice(0, RECENT_MAX) });
  const fraga = `Idag är det ${todayFmt.format(now())}.\n\nOmgången (JSON):\n${JSON.stringify(payload)}` + (dreamOf(round.id) ? `\n\n${nc.storkovanHint}` : '');
  const opts = { system: nc.systemPrompt, model: nc.model, effort: nc.effort, timeoutMs: nc.timeoutMs };
  let r = await claude({ ...opts, prompt: fraga, tools: nc.tools });
  const read = [...r.read];
  let problem = null;
  for (let attempt = 1; attempt <= nc.attempts; attempt++) {
    if (r.refused) return { ok: false, error: 'Claude avböjde att döpa omgången.' };
    const parts = partsOf(r.content);
    // Tal i förklaringen får också komma ur det Claude hittade på nätet.
    const why = parts ? problems(parts, [payload, read.join('\n')]) : ['inget svar i rätt form'];
    // Sista försöket: håller namnet men inte förklaringen visas namnet utan den.
    if (why.length && parts && attempt === nc.attempts && !problems({ ...parts, syftar: null }, payload).length) {
      parts.syftar = null;
      why.length = 0;
    }
    if (!why.length) {
      return {
        ok: true,
        meta: r,
        // Förslagen sparas med, så att det går att se vad Claude valde mellan.
        entry: { key: namnNyckel(round), id: round.id, namn: parts.namn, syftar: parts.syftar, forslag: parts.forslag, model: r.model, generatedAt: now().toISOString() },
      };
    }
    problem = `Namnet hade ${why.join(' och ')}.`;
    if (attempt < nc.attempts) {
      r = await claude({ ...opts, tools: [], prompt: `${fraga}\n\nDitt förra svar:\n${r.content}\n\nSvaret hade ${why.join(' och ')}. Hitta på ett nytt utan att söka: högst ${nc.maxWords} ord och ${nc.maxChars} tecken i namnet, inga siffror där, och i "syftar" bara tal som står i underlaget. Svara bara med samma JSON.` });
    }
  }
  return { ok: false, error: problem };
}
