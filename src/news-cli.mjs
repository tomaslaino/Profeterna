// Provkör nyhetsinsamlingen för en match, utan språkmodell:
//
//   node src/news-cli.mjs <match-id>          läsbar sammanställning
//   node src/news-cli.mjs <match-id> --json   underlaget som modellen får
//   node src/news-cli.mjs nästa               nästa kommande match
//
// Matchen läses ur den byggda sajten (_site/data/match/<id>.json).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gatherNews, newsPayload } from './news.mjs';

const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '_site', 'data');
const [arg, flag] = process.argv.slice(2);

function nextMatch() {
  const { matches } = JSON.parse(fs.readFileSync(path.join(SITE, 'matches.json'), 'utf8'));
  const now = Date.now();
  const m = matches.filter((x) => !x.completed && Date.parse(x.kickoff) > now).sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
  if (!m) throw new Error('ingen kommande match i _site/data/matches.json');
  return m.id;
}

const id = !arg || arg === 'nästa' ? nextMatch() : arg;
const file = path.join(SITE, 'match', `${id}.json`);
if (!fs.existsSync(file)) {
  console.error(`Hittar inte ${file} – kör npm run build först.`);
  process.exit(1);
}
const { match } = JSON.parse(fs.readFileSync(file, 'utf8'));
const t0 = Date.now();
const news = await gatherNews(match);
const secs = ((Date.now() - t0) / 1000).toFixed(1);

if (flag === '--json') {
  console.log(JSON.stringify(newsPayload(news), null, 2));
} else {
  console.log(`${match.home} – ${match.away} (${match.compName}, ${match.kickoff}), ${secs} s`);
  for (const s of news.sources) console.log(`  ${s.ok ? 'ok ' : s.error ? 'FEL' : 'av '} ${s.name}${s.n != null ? `: ${s.n} träffar` : ''}${s.error ? ` – ${s.error}` : ''}`);
  console.log(`\n${news.items.length} artiklar:`);
  for (const it of news.items) {
    console.log(`  [${it.id}] ${it.publishedAt.slice(0, 16)} ${it.source} (${it.kind}; ${it.teams.join(', ')})${it.text ? ` – text ${it.text.length} tecken` : ''}`);
    console.log(`       ${it.title}`);
    console.log(`       ${it.url}`);
  }
  const w = newsPayload(news).väder;
  console.log(`\nVäder: ${typeof w === 'string' ? w : `${w.plats}, ${w.väder}, ${w.temperatur}, ${w.nederbörd}, ${w.vind}`}`);
}
