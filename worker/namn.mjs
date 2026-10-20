// Omgångens namn (Kupong → Omgången och förstasidan), i samma proxy som
// matchanalysen och kommentaren (worker/index.mjs). Claude skriver namnet när
// nyckeln finns (ANTHROPIC_API_KEY), annars samma DeepSeek som analysen
// (config/llm.js). Prompten, modellen och gränserna står i config/namn.js.
//
//   POST /namn  {"id": "<omgångens id>"}
//   → 200 {ok: true, namn, syftar, model, generatedAt, cached}
//   → 4xx/5xx {ok: false, error}
//
// Proxyn tar bara emot omgångens id. Omgången läser den själv där gängets
// tips ligger (samtal:aktuellt eller samtal:<id>, worker/samtal.mjs), och
// matchernas underlag (data/match/<id>.json: arena, odds, tabell, form, vila,
// tidigare möten) och gängets senaste kupong ur den publicerade sajten – så
// nyckeln kan bara användas till att döpa en omgång som gänget har skapat.
// Namnet sparas för alltid per omgång och matcher: alla ser samma namn, och
// den som kommer först får det skrivet. Ändras matcherna får omgången ett nytt
// namn. De senaste namnen (namn:senaste) följer med i underlaget, så att
// namnen inte går i samma mönster.

import Anthropic from '@anthropic-ai/sdk';
import cfg from '../config/llm.js';
import nc from '../config/namn.js';
import { fingerprint, foreignNumbers, pctOdds } from './analysis.mjs';

const ROUND_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{4,10}$/;
const RECENT = 'namn:senaste';
const RECENT_MAX = 12;
const COMP = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two', fac: 'FA-cupen', lc: 'Ligacupen' };
// Tävlingarna i lagens form och schema (ESPN:s förkortningar).
const OTHER = { EFL: 'ligacupen', FAC: 'FA-cupen', CL: 'Champions League', EL: 'Europa League', ECL: 'Conference League' };
const RES = { V: 'vinst', O: 'oavgjort', F: 'förlust' };
const tz = { timeZone: 'Europe/Stockholm' };
const kickFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('sv-SE', { ...tz, weekday: 'long', day: 'numeric', month: 'long' });
const ordinal = (n) => `${n}:${n % 10 <= 2 && n % 10 >= 1 && ![11, 12].includes(n % 100) ? 'a' : 'e'}`;
const dec = (x, d = 1) => x.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
const odds = (x) => (x ? dec(x, 2) : '–');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Lagets läge inför matchen, ur matchens underlag (teams.home/away).
function teamFacts(t, side) {
  if (!t) return null;
  const out = {};
  if (t.table && t.table.rank) {
    out.tabell = `${ordinal(t.table.rank)} av ${t.table.size}${t.league ? ` i ${t.league.name}` : ''}, ${plural(t.table.points, 'poäng', 'poäng')} på ${plural(t.table.played, 'match', 'matcher')}`;
  }
  const rec = t.record && t.record[side];
  if (rec && rec.n) {
    out[side === 'home' ? 'hemma i år' : 'borta i år'] = `${plural(rec.w, 'vinst', 'vinster')}, ${plural(rec.d, 'oavgjord', 'oavgjorda')}, ${plural(rec.l, 'förlust', 'förluster')}, mål ${rec.gf}–${rec.ga}`;
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

export async function roundName(id, { env, loadRound, loadSite, complete, store = null, now = () => new Date() }) {
  id = String(id == null ? '' : id);
  if (!ROUND_ID.test(id)) return fail(400, 'Okänd omgång.');
  let round;
  try {
    round = await loadRound(id);
  } catch (err) {
    return fail(502, `Omgången gick inte att läsa (${err.message}).`);
  }
  if (!round || round.borttagen || !Array.isArray(round.matcher) || !round.matcher.length) return fail(404, 'Omgången finns inte.');

  const ids = round.matcher.map((x) => String(x.id)).sort();
  const key = `namn:${nc.promptVersion}:${id}:${(await fingerprint({ promptVersion: nc.promptVersion, ids })).slice(0, 16)}`;
  const hit = await safely(() => store && store.get(key));
  if (hit) return answer(hit, true);

  const chat = env[nc.claude.keyEnv] ? claudeChat(env[nc.claude.keyEnv])
    : env[cfg.keyEnv] ? deepseekChat(env[cfg.keyEnv], env, complete) : null;
  if (!chat) return fail(503, 'Namnen är inte påslagna (nyckel saknas).');

  // Utan sajtens underlag får modellen bara lagen och avsparkerna.
  let site = {};
  try { site = (await loadSite(round)) || {}; } catch { /* lagen räcker */ }
  const recent = ((await safely(() => store && store.get(RECENT))) || []).filter((r) => r && r.namn);
  const payload = roundPayload(round, { ...site, recent });
  let say = `Omgången (JSON):\n${JSON.stringify(payload)}` + (dreamOf(id) ? `\n\n${nc.storkovanHint}` : '');
  let problem = null;
  for (let attempt = 1; attempt <= cfg.attempts; attempt++) {
    let r;
    try {
      r = await chat.say(say);
    } catch (err) {
      // Nätverk, överlast, saldo, nyckel: inget sparas – nästa besök försöker igen.
      return fail(err.status || 502, err.message);
    }
    if (r.refused) { problem = `${chat.provider} avböjde att döpa omgången.`; break; }
    const parts = partsOf(r.content);
    const why = parts ? problems(parts, payload) : ['inget svar i rätt form'];
    if (!why.length) {
      // Hann någon annan före gäller dess namn, så att alla ser samma.
      const first = await safely(() => store && store.get(key));
      if (first && first.ok) return answer(first, true);
      // Förslagen sparas med, så att det går att se vad AI:n valde mellan.
      const entry = { ok: true, namn: parts.namn, syftar: parts.syftar, forslag: parts.forslag, model: r.model, generatedAt: now().toISOString() };
      await safely(() => store && store.put(key, entry));
      // De senaste namnen, så att nästa omgång inte går i samma mönster.
      await safely(() => store && store.put(RECENT, [{ id, namn: entry.namn }, ...recent.filter((x) => x.id !== id)].slice(0, RECENT_MAX)));
      return answer(entry, false);
    }
    problem = `Namnet hade ${why.join(' och ')}.`;
    say = `Svaret hade ${why.join(' och ')}. Välj ett annat förslag eller hitta på ett nytt och följ reglerna: högst ${nc.maxWords} ord och ${nc.maxChars} tecken i namnet, inga siffror där, och i "syftar" bara tal som står i underlaget. Svara med JSON: {"förslag": [...], "namn": "<namnet>", "syftar": "<vad det anspelar på>"}`;
  }
  // Ett avvisat svar sparas en timme, så att varje sidvisning inte kostar ett
  // nytt anrop. Därefter försöker nästa besök igen.
  const entry = { ok: false, error: problem };
  await safely(() => store && store.put(key, entry, 3600));
  return answer(entry, false);
}

// Ett samtal med språkmodellen: say(text) → {content, model, refused}. Varje
// svar läggs till i samtalet som det kom, så att ett nytt försök bygger på det.
function claudeChat(apiKey) {
  // Adressen anges, så att en ANTHROPIC_BASE_URL i miljön inte styr om anropet.
  const client = new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com', timeout: cfg.timeoutMs, maxRetries: 1 });
  const turns = [];
  return {
    provider: nc.claude.provider,
    async say(text) {
      turns.push({ role: 'user', content: text });
      let r;
      try {
        r = await client.beta.messages.create({
          model: nc.claude.model,
          max_tokens: nc.claude.maxTokens,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: nc.claude.effort },
          system: nc.systemPrompt,
          messages: turns,
        });
      } catch (err) {
        throw claudeProblem(err);
      }
      turns.push({ role: 'assistant', content: r.content });
      // Nekade också reservmodellen finns ingen text att läsa.
      if (r.stop_reason === 'refusal') return { content: '', model: r.model, refused: true };
      const content = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      return { content, model: r.model, refused: false };
    },
  };
}

function claudeProblem(err) {
  const p = nc.claude.provider;
  const problem = (status, message) => Object.assign(new Error(message), { status });
  if (err instanceof Anthropic.AuthenticationError) return problem(502, `Nyckeln godtogs inte av ${p}.`);
  if (err instanceof Anthropic.RateLimitError) return problem(503, `${p} är överbelastat – försök igen om en stund.`);
  if (err instanceof Anthropic.APIConnectionTimeoutError) return problem(504, `${p} svarade inte inom ${Math.round(cfg.timeoutMs / 1000)} sekunder.`);
  if (err instanceof Anthropic.APIConnectionError) return problem(504, `${p} gick inte att nå.`);
  if (err instanceof Anthropic.APIError) return problem(502, err.status >= 500 ? `${p} är överbelastat – försök igen om en stund.` : `${p} avvisade anropet (HTTP ${err.status}).`);
  return problem(502, `${p} gav ett fel (${err && err.message}).`);
}

function deepseekChat(apiKey, env, complete) {
  const messages = [{ role: 'system', content: nc.systemPrompt }];
  return {
    provider: cfg.provider,
    async say(text) {
      messages.push({ role: 'user', content: text });
      const r = await complete(messages, apiKey, env);
      messages.push({ role: 'assistant', content: r.content });
      return { content: r.content, model: r.model, refused: r.finish === 'content_filter' };
    },
  };
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

function problems({ namn, syftar }, payload) {
  const why = [];
  const words = namn.split(/\s+/).filter(Boolean).length;
  if (namn.length > nc.maxChars || words > nc.maxWords) why.push(`för många ord eller tecken (${words} ord, ${namn.length} tecken)`);
  if (/\d/.test(namn)) why.push('siffror');
  if (/[!?]|\p{Extended_Pictographic}/u.test(namn)) why.push('utropstecken, frågetecken eller emojier');
  if (/kupong|omgång|tips/i.test(namn)) why.push('ett av de förbjudna orden');
  if (syftar && syftar.split(/\s+/).length > nc.maxHintWords * 1.5) why.push('en för lång förklaring');
  const bad = syftar ? foreignNumbers(syftar, payload) : [];
  if (bad.length) why.push(`tal i "syftar" som inte finns i underlaget (${bad.join(', ')})`);
  return why;
}

function answer(entry, cached) {
  if (!entry.ok) return { status: 422, body: { ok: false, error: entry.error, cached } };
  return { status: 200, body: { ok: true, namn: entry.namn, syftar: entry.syftar || null, forslag: entry.forslag || [], model: entry.model || null, generatedAt: entry.generatedAt || null, cached } };
}

function fail(status, error) {
  return { status, body: { ok: false, error } };
}

// Lagringen får aldrig stoppa ett namn.
async function safely(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('[namn] lagringen:', err && err.message);
    return null;
  }
}
