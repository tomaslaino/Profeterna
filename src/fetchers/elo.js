'use strict';

// World Football Elo Ratings (eloratings.net): alla landslags Elo-tal, för
// motståndets styrka i landslagens form och tio senaste (sedan 2026-11-16).
// Två öppna tabbseparerade filer, ingen nyckel:
//   World.tsv     ett landslag per rad: plats i sin världsdel, plats i
//                 världen, kod (ES, EN, AR …) och Elo-talet (sedan ändringar
//                 och matcher, som inte används)
//   en.teams.tsv  koden och landets namn på engelska, med andra stavningar
//                 efter (Bosnia and Herzegovina, Bosnia & Herzegovina …);
//                 koder med _loc är "i landet" och hoppas över
// Verifierat 2026-11-16: 243 landslag, Spanien 1:a på 2258, England 2:a på
// 2182. Filerna skrivs om efter varje landskamp (Last-Modified).

const { getText } = require('./http');

const BAS = 'https://www.eloratings.net';

const rader = (s) => String(s).trim().split(/\r?\n/).map((l) => l.split('\t'));

async function fetchElo() {
  const [world, teams] = await Promise.all([getText(`${BAS}/World.tsv`), getText(`${BAS}/en.teams.tsv`)]);
  const namn = new Map();
  for (const [kod, ...n] of rader(teams)) if (kod && !kod.includes('_')) namn.set(kod, n.filter(Boolean));
  const lag = [];
  for (const r of rader(world)) {
    const rank = Number(r[1]);
    const rating = Number(r[3]);
    if (!r[2] || !Number.isFinite(rank) || !Number.isFinite(rating)) continue;
    lag.push({ kod: r[2], namn: namn.get(r[2]) || [], rank, rating });
  }
  if (lag.length < 150) throw new Error(`oväntat svar (${lag.length} landslag)`);
  return { lag, sourceUrl: `${BAS}/` };
}

module.exports = { fetchElo };
