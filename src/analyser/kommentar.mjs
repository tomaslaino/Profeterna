// Kommentaren till en färdig kupong (Olympen → Grupparbetena). Macen skriver den
// med Claude Code på användarens konto, utan verktyg (scripts/analyser/skriv.mjs):
// kupongen läses ur den publicerade data/historik.json (src/history.js) och texten
// skrivs in i data/kupong-historik.json, så att den aldrig skrivs om. Prompten och
// reglerna står i config/kommentar.js.

import kc from '../../config/kommentar.js';
import { foreignNumbers, pctOdds } from './underlag.mjs';
import { claudeSvar } from './claude.mjs';

const SIGNS = ['1', 'X', '2'];
const dec = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');

// Underlaget som modellen ser: det som står på kupongens kort på sidan.
export function couponPayload(c) {
  return {
    kupong: c.name || null,
    spel: c.game || 'Matchfixarnas kupong',
    datum: c.till ? `${c.date} – ${c.till}` : c.date,
    'antal rätt': `${c.ok} av ${c.n}`,
    'väntat antal rätt': dec(c.exp),
    betyg: `${c.grade} av 5 stjärnor – ${c.label}`,
    'modellens tips hade rätt': c.modelN ? `${c.modelOk} av ${c.modelN}` : 'okänt',
    matcher: c.rows.map((r) => ({
      match: r.match,
      'gängets tecken': r.sign,
      resultat: r.off ? 'struken, räknas inte' : r.score || (r.res != null ? SIGNS[r.res] : 'okänt'),
      ...(r.end ? { slutresultat: r.end } : {}),
      satt: r.hit == null ? 'räknas inte' : r.hit ? 'ja' : 'nej',
      // Odds som på sidan: chansen i hela procent, 58 blir 1,72.
      'modellens odds för gängets tecken': r.p != null ? pctOdds(r.p) : 'okänt',
      'modellens tips': r.tip != null ? SIGNS[r.tip] : 'okänt',
      ...(r.note ? { anteckning: r.note } : {}),
    })),
  };
}

function textOf(content) {
  try {
    const raw = String(content || '');
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const t = j && typeof j.kommentar === 'string' ? j.kommentar.trim().replace(/^["”“]+|["”“]+$/g, '') : '';
    return t || null;
  } catch {
    return null;
  }
}

// → {ok: true, ai: {text, modell, skriven}, meta} eller {ok: false, error}.
export async function skrivKommentar(c, { now = () => new Date(), claude = claudeSvar }) {
  const payload = couponPayload(c);
  const fraga = `Kupongen (JSON):\n${JSON.stringify(payload)}`;
  const opts = { system: kc.systemPrompt, model: kc.model, effort: kc.effort, timeoutMs: kc.timeoutMs, tools: [] };
  let meddelande = fraga;
  let problem = null;
  for (let attempt = 1; attempt <= kc.attempts; attempt++) {
    const r = await claude({ ...opts, prompt: meddelande });
    if (r.refused) return { ok: false, error: 'Claude avböjde att skriva kommentaren.' };
    const text = textOf(r.content);
    const why = [];
    if (!text) {
      why.push('inget svar i rätt form');
    } else {
      const bad = foreignNumbers(text, payload);
      if (bad.length) why.push(`tal som inte finns i underlaget (${bad.join(', ')})`);
      const words = text.split(/\s+/).filter(Boolean).length;
      if (words > kc.maxWords * 1.25) why.push(`för många ord (${words})`);
    }
    if (!why.length) return { ok: true, meta: r, ai: { text, modell: r.model, skriven: now().toISOString() } };
    problem = `Kommentaren hade ${why.join(' och ')}.`;
    meddelande = `${fraga}\n\nDitt förra svar:\n${r.content}\n\nTexten hade ${why.join(' och ')}. Skriv om den och följ reglerna, högst ${kc.maxWords} ord. Svara med JSON: {"kommentar": "<text>"}`;
  }
  return { ok: false, error: problem };
}
