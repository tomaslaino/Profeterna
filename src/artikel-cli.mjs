// Provskriv Analysera – artikeln och tipset (worker/artikel.mjs) – lokalt, med
// ANTHROPIC_API_KEY ur .env. Kostar som en riktig analys och skriver ut vad
// den kostade. Sparar ingenting.
//
//   node src/artikel-cli.mjs <match-id>          läsbar artikel och tips
//   node src/artikel-cli.mjs <match-id> --json   artikeln som den sparas
//   node src/artikel-cli.mjs <match-id> --igen   också tipset omskrivet, som
//                                                 Analysera igen (utan sökningar)
//
// Matchen läses ur den publicerade sajten, som i proxyn.

import { createRequire } from 'node:module';
import llm from '../config/llm.js';
import { writeArticle, rewriteTip, costOf } from '../worker/artikel.mjs';
import { gatherNews } from './news.mjs';

createRequire(import.meta.url)('./env.js').loadEnv();
const [id, flag] = process.argv.slice(2);
if (!/^\d{1,12}$/.test(id || '')) {
  console.error('Användning: node src/artikel-cli.mjs <match-id> [--json | --igen]');
  process.exit(1);
}
const res = await fetch(`${llm.site}/data/match/${id}.json?t=${Date.now()}`);
if (!res.ok) {
  console.error(`Matchen gick inte att läsa (HTTP ${res.status}).`);
  process.exit(1);
}
const d = await res.json();
const t0 = Date.now();
const r = await writeArticle(d, { env: process.env });
const secs = Math.round((Date.now() - t0) / 1000);

if (flag === '--json') {
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
console.log(`${d.match.home} – ${d.match.away}, ${secs} s`);
usageOf(r.usage);
if (!r.ok) {
  console.log(`Ingen artikel: ${r.error}`);
  process.exit(0);
}
const a = r.article;
console.log(`\n${a.title}\n\n${a.lead || ''}\n\n${a.paragraphs.join('\n\n')}\n`);
for (const s of a.sources) console.log(`[${s.n}] ${s.source}: ${s.title}\n    ${s.url}`);
showTip(a.tip, r.tipError);

if (flag === '--igen') {
  const t1 = Date.now();
  const news = await gatherNews(d.match, { now: new Date() });
  const t = await rewriteTip(d, a, news, { env: process.env });
  console.log(`\n--- Analysera igen, ${Math.round((Date.now() - t1) / 1000)} s`);
  usageOf(t.usage);
  showTip(t.ok ? t.tip : null, t.ok ? null : t.error);
}

// Förbrukningen per anrop – så att det syns vad tipset kostade och hur mycket
// som lästes ur cachen – och kostnaden för alla.
function usageOf(usage) {
  for (const [i, u] of usage.entries()) {
    const st = u.server_tool_use || {};
    console.log(`  anrop ${i + 1}: ${u.input_tokens} in, ${u.cache_creation_input_tokens || 0} till cachen, ${u.cache_read_input_tokens || 0} ur cachen, ${u.output_tokens} ut, ${st.web_search_requests || 0} sökningar, ${st.web_fetch_requests || 0} lästa sidor`);
  }
  const c = costOf(usage);
  if (c) console.log(`  ${c.dollars} dollar`);
}

function showTip(tip, error) {
  if (!tip) {
    console.log(`\nInget tips${error ? `: ${error}` : ''}`);
    return;
  }
  console.log(`\nTipset: ${tip.signs.map((i) => '1X2'[i]).join('')} (${tip.note})\n${tip.text}`);
  for (const s of tip.sources) console.log(`[${s.n}] ${s.source}: ${s.title}\n    ${s.url}`);
}
