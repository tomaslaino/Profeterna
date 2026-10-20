// Provskriv artikeln inför en match (worker/artikel.mjs) lokalt, med
// ANTHROPIC_API_KEY ur .env. Kostar som en riktig artikel, ungefär en halv
// dollar. Sparar ingenting.
//
//   node src/artikel-cli.mjs <match-id>          läsbar artikel
//   node src/artikel-cli.mjs <match-id> --json   artikeln som den sparas
//
// Matchen läses ur den publicerade sajten, som i proxyn.

import { createRequire } from 'node:module';
import llm from '../config/llm.js';
import { writeArticle } from '../worker/artikel.mjs';

createRequire(import.meta.url)('./env.js').loadEnv();
const [id, flag] = process.argv.slice(2);
if (!/^\d{1,12}$/.test(id || '')) {
  console.error('Användning: node src/artikel-cli.mjs <match-id> [--json]');
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
const tools = r.usage.reduce((a, u) => ({ s: a.s + ((u.server_tool_use && u.server_tool_use.web_search_requests) || 0), f: a.f + ((u.server_tool_use && u.server_tool_use.web_fetch_requests) || 0) }), { s: 0, f: 0 });

if (flag === '--json') {
  console.log(JSON.stringify(r, null, 2));
} else {
  console.log(`${d.match.home} – ${d.match.away}, ${secs} s, ${tools.s} sökningar, ${tools.f} lästa sidor`);
  if (!r.ok) {
    console.log(`Ingen artikel: ${r.error}`);
  } else {
    const a = r.article;
    console.log(`\n${a.title}\n\n${a.lead || ''}\n\n${a.paragraphs.join('\n\n')}\n`);
    for (const s of a.sources) console.log(`[${s.n}] ${s.source}: ${s.title}\n    ${s.url}`);
  }
}
