'use strict';

// Modellens styrka för alla lag i nivå 1–4, på samma skala: förväntad
// målskillnad per match mot ett genomsnittligt Premier League-lag på neutral
// plan, med den senaste skattningen (samma som ger prognoserna för kommande
// matcher). Används som motståndets styrka i lagstatistiken
// (src/teamstats.js). National League skattas i modellen men räknas inte här.

const rules = require('../config/forecast-rules');

// ctx: prognosmotorns kontext, specs: alla matcher, fitAt: (dag) → skattning.
function strengthTable({ ctx, specs, fitAt }) {
  const future = specs.filter((s) => !s.completed);
  const day = future.length ? Math.max(...future.map((s) => s.fitDay)) : Math.max(...specs.map((s) => s.fitDay));
  const fit = fitAt(day);
  const tierKeys = [...ctx.tier].filter(([k, t]) => t <= 4 && fit.teams.has(k) && !fit.teams.get(k).degenerate && fit.teams.get(k).weight >= rules.model.minEffectiveMatches);
  const top = tierKeys.filter(([k, t]) => t === 1 && fit.A.has(k)).map(([k]) => k);
  if (!top.length) return { list: [], fitThrough: fit.through };
  // Premier League-snittets anfall och försvar (geometriskt medel).
  const a1 = Math.exp(top.reduce((acc, k) => acc + Math.log(fit.A.get(k)), 0) / top.length);
  const b1 = Math.exp(top.reduce((acc, k) => acc + Math.log(fit.B.get(k)), 0) / top.length);
  const list = tierKeys.filter(([k]) => fit.A.has(k))
    .map(([k]) => ({ key: k, rating: fit.A.get(k) * b1 - a1 * fit.B.get(k) }));
  return { list, fitThrough: fit.through };
}

module.exports = { strengthTable };
