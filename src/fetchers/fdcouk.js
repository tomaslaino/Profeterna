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

const { getText } = require('./http');

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

async function fetchDivision(code, seasonCode) {
  const url = `${BASE}/mmz4281/${seasonCode}/${code}.csv`;
  const rows = parseCsv(await getText(url)).map(pick);
  if (rows.length === 0) throw new Error(`${code}: tom fil`);
  const played = rows.filter((r) => r.FTHG != null);
  return {
    rows,
    lastMatchDate: played.length ? played[played.length - 1].date : null,
    sourceUrl: url,
  };
}

// Kommande matcher med odds (alla ligor hos källan) – behåll engelska.
async function fetchFixtures(codes) {
  const url = `${BASE}/fixtures.csv`;
  const rows = parseCsv(await getText(url))
    .filter((r) => codes.includes(r.Div))
    .map((r) => ({ div: r.Div, ...pick(r) }));
  return { rows, sourceUrl: url };
}

function pick(r) {
  const o = { date: isoDate(r.Date) };
  for (const k of KEEP) {
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

module.exports = { fetchDivision, fetchFixtures };
