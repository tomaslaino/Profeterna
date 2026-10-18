'use strict';

// football-data.co.uk – fria CSV-filer per division och säsong.
// Verifierat 2026-10-17 för E0–E3 och EC (National League) 2026/27:
// resultat, skott, hörnor, kort, xG (HxG/AxG – nytt 2026/27, leverantören
// odokumenterad, se README) och odds (öppning fre/tis + stängning) från sex
// spelbolag, marknadssnitt/max och Betfair Exchange. Pinnacle saknas
// 2026/27. Filerna uppdateras ungefär två gånger i veckan.
//
// www.football-data.co.uk svarar 302 till domänen utan www – därför den
// direkt.

const { getBytes, mapLimit } = require('./http');

const BASE = 'https://football-data.co.uk';

// Kolumner som sparas. Övriga (enskilda bolag utöver Bet365, asiatiskt
// handikapp) behövs inte i fas 1–2 och tas med först om en kandidat kräver dem.
const KEEP = [
  'Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR', 'HTHG', 'HTAG', 'Referee',
  'HxG', 'AxG', 'HS', 'AS', 'HST', 'AST', 'HC', 'AC', 'HF', 'AF', 'HY', 'AY', 'HR', 'AR',
  // öppningsodds (insamlade fre/tis före matchen)
  'AvgH', 'AvgD', 'AvgA', 'MaxH', 'MaxD', 'MaxA', 'BFEH', 'BFED', 'BFEA', 'B365H', 'B365D', 'B365A',
  'PSH', 'PSD', 'PSA', 'Avg>2.5', 'Avg<2.5', 'BFE>2.5', 'BFE<2.5',
  // stängningsodds
  'AvgCH', 'AvgCD', 'AvgCA', 'MaxCH', 'MaxCD', 'MaxCA', 'BFECH', 'BFECD', 'BFECA',
  'B365CH', 'B365CD', 'B365CA', 'PSCH', 'PSCD', 'PSCA',
  'AvgC>2.5', 'AvgC<2.5', 'BFEC>2.5', 'BFEC<2.5',
];
const TEXT_COLS = new Set(['Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTR', 'Referee', 'Div']);

// Tidigare säsonger: resultat, skott och odds – det baslinjerna, modellen
// och backtestets kandidater (fas 4) kan behöva. Kolumnnamnen har ändrats
// över åren: marknadssnitt/max hette BbAv/BbMx (Betbrain, 2005–2019) innan
// Avg/Max; stängningsodds finns från 2019/20, Betfair Exchange från 2024/25.
const KEEP_HISTORY = [
  'Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'HS', 'AS', 'HST', 'AST',
  'AvgH', 'AvgD', 'AvgA', 'BbAvH', 'BbAvD', 'BbAvA', 'BFEH', 'BFED', 'BFEA', 'PSH', 'PSD', 'PSA',
  'B365H', 'B365D', 'B365A', 'Avg>2.5', 'Avg<2.5', 'BbAv>2.5', 'BbAv<2.5',
  'AvgCH', 'AvgCD', 'AvgCA', 'BFECH', 'BFECD', 'BFECA', 'PSCH', 'PSCD', 'PSCA', 'AvgC>2.5', 'AvgC<2.5',
];

// Divisionsstatistiken (sidan Statistik): halvtid, hörnor, frisparkar, kort,
// domare, avsparkstid (från 2019/20) och publik (bara de första säsongerna)
// plus marknadssnittets odds. Egen källa, så att prognosmotorns historik
// (och backtestets signatur på den) inte ändras.
const KEEP_STATS = [
  'Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'HTHG', 'HTAG', 'Referee', 'Attendance',
  'HS', 'AS', 'HST', 'AST', 'HC', 'AC', 'HF', 'AF', 'HY', 'AY', 'HR', 'AR',
  'AvgH', 'AvgD', 'AvgA', 'BbAvH', 'BbAvD', 'BbAvA', 'Avg>2.5', 'Avg<2.5', 'BbAv>2.5', 'BbAv<2.5',
];

async function fetchDivision(code, seasonCode) {
  const url = `${BASE}/mmz4281/${seasonCode}/${code}.csv`;
  const rows = parseCsv(await getCsv(url)).map((r) => pick(r));
  if (rows.length === 0) throw new Error(`${code}: tom fil`);
  const played = rows.filter((r) => r.FTHG != null);
  return {
    rows,
    lastMatchDate: played.length ? played[played.length - 1].date : null,
    sourceUrl: url,
  };
}

// Alla avslutade säsonger för en division, en fil per säsong. Fallerar en
// säsong fallerar hela hämtningen – cachen behåller då senaste kompletta
// historik med sitt datum.
async function fetchHistory(code, seasonCodes, keep = KEEP_HISTORY) {
  const seasons = {};
  await mapLimit(seasonCodes, 3, async (sc) => {
    const rows = parseCsv(await getCsv(`${BASE}/mmz4281/${sc}/${code}.csv`))
      .map((r) => pick(r, keep))
      .filter((r) => r.date && r.FTHG != null && r.FTAG != null);
    if (rows.length === 0) throw new Error(`${code} ${sc}: tom fil`);
    seasons[sc] = rows;
  });
  return { seasons, sourceUrl: `${BASE}/englandm.php` };
}

// Kommande matcher med odds (alla ligor hos källan) – behåll engelska.
async function fetchFixtures(codes) {
  const url = `${BASE}/fixtures.csv`;
  const rows = parseCsv(await getCsv(url))
    .filter((r) => codes.includes(r.Div))
    .map((r) => ({ div: r.Div, ...pick(r) }));
  return { rows, sourceUrl: url };
}

function pick(r, keep = KEEP) {
  const o = { date: isoDate(r.Date) };
  for (const k of keep) {
    if (!(k in r) || k === 'Date') continue;
    const v = r[k];
    if (v === '' || v == null) continue;
    if (TEXT_COLS.has(k)) { o[k] = v; continue; }
    const n = Number(v);
    if (Number.isFinite(n)) o[k] = n;
  }
  return o;
}

// dd/mm/yyyy (äldre säsonger dd/mm/yy) → yyyy-mm-dd
function isoDate(s) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s || '');
  if (!m) return null;
  const y = m[3].length === 2 ? (Number(m[3]) > 50 ? '19' : '20') + m[3] : m[3];
  return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// Nyare filer är UTF-8 (med BOM), äldre Windows-1252 – t.ex. "King’s Lynn"
// i EC 2021/22 med byte 0x92. Ogiltig UTF-8 läses därför som latin1, och
// Windows-1252:s typografiska apostrofer (0x91/0x92) blir vanliga.
async function getCsv(url) {
  const bytes = await getBytes(url);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return bytes.toString('latin1').replace(/[\u0091\u0092]/g, "'");
  }
}

// Enkel CSV: källans filer har inga citerade fält (verifierat 2026-10-17).
function parseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const head = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const o = {};
    head.forEach((h, i) => { o[h] = cells[i] !== undefined ? cells[i].trim() : ''; });
    return o;
  }).filter((o) => o.HomeTeam && o.AwayTeam);
}

module.exports = { fetchDivision, fetchFixtures, fetchHistory, KEEP_STATS };
