'use strict';

// Divisionerna på Tabeller och Statistik (data/divisions.json): vilka
// ligor sidorna visar, i nivåordning, och säsongen. Sidorna läser bara
// namnen härifrån – tabellerna, spelarna och lagen har egna filer
// (data/players/, data/teams/).
//
// Fram till 2026-10-19 räknades här också beskrivande statistik per division
// (hemmafördel, målminuter, publik, domare med mera) för flikarna Översikt,
// Matchbilden och Jämför divisioner. Flikarna togs bort, och 2026-10-20
// statistiken och källorna som bara den behövde (ESPN:s målminuter och
// publik).

const { COMPETITIONS, SEASON } = require('../config/competitions');

function divisionStats() {
  return {
    season: SEASON.label,
    divisions: COMPETITIONS.filter((c) => c.type === 'league')
      .map((c) => ({ id: c.id, name: c.name, short: c.short, tier: c.tier })),
  };
}

module.exports = { divisionStats };
