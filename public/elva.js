'use strict';

// ---------- den beräknade startelvan ----------
//
// Delas av bygget (src/startelvor.js, som tar fram underlaget och mäter hur
// ofta elvan stämmer) och matchrutan (public/matchruta.js, som tar bort dem
// som saknas och ritar elvan), så att båda räknar likadant. I webbläsaren är
// den window.Elva, i Node module.exports.
//
// Underlaget för ett lag (en "plan") är formationen, dess elva platser och en
// kö av spelare i den ordning de tas ut. fill() går kön uppifrån och sätter
// varje spelare på en ledig plats i hans del av laget (målvakt, försvar,
// mittfält, anfall) – den närmast där han brukar spela – tills alla elva
// platser är fyllda. Den som saknas hoppas över, och nästa i kön som spelar
// i samma del av laget tar platsen. Vem som står först i kön avgörs i
// src/startelvor.js.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Elva = factory();
})(typeof self !== 'undefined' ? self : this, () => {
  // ESPN:s platsnummer (formationPlace, Optas numrering) per formation, linje
  // för linje från försvaret och fram, från vänster till höger sett från
  // lagets eget mål. Målvakten är plats 1. Kontrollerat mot säsongens 1 410
  // elvor 2026-11-07: ESPN:s positioner (LB, CD-L, AM-R …) ligger på samma
  // sida som i tabellen på 15 490 av 15 510 platser. Positionsnamnen följer
  // inte linjen (i 4-2-3-1 heter de två defensiva mittfältarna LM och RM),
  // därför tabellen. En formation som saknas här ger ingen plan.
  const FORMATIONS = {
    '4-2-3-1': [[3, 6, 5, 2], [4, 8], [11, 10, 7], [9]],
    '4-4-2': [[3, 6, 5, 2], [11, 8, 4, 7], [9, 10]],
    '4-1-4-1': [[3, 6, 5, 2], [4], [11, 10, 8, 7], [9]],
    '4-3-3': [[3, 6, 5, 2], [8, 4, 7], [11, 9, 10]],
    '4-4-1-1': [[3, 6, 5, 2], [11, 8, 4, 7], [10], [9]],
    '4-3-2-1': [[3, 6, 5, 2], [7, 4, 8], [11, 10], [9]],
    '4-2-2-2': [[3, 6, 5, 2], [8, 4], [11, 7], [9, 10]],
    '4-3-1-2': [[3, 6, 5, 2], [11, 4, 7], [8], [10, 9]],
    '4-5-1': [[3, 6, 5, 2], [11, 8, 10, 4, 7], [9]],
    '4-1-3-2': [[3, 6, 5, 2], [4], [11, 8, 7], [10, 9]],
    '4-1-2-1-2': [[3, 6, 5, 2], [4], [11, 7], [8], [9, 10]],
    '3-4-2-1': [[4, 5, 6], [3, 8, 7, 2], [11, 10], [9]],
    '3-4-1-2': [[4, 5, 6], [3, 8, 7, 2], [9], [11, 10]],
    '3-4-3': [[4, 5, 6], [3, 8, 7, 2], [11, 9, 10]],
    '3-5-2': [[4, 5, 6], [3, 8, 11, 7, 2], [9, 10]],
    '3-5-1-1': [[4, 5, 6], [3, 8, 11, 7, 2], [10], [9]],
    '3-1-4-2': [[6, 4, 5], [8], [3, 11, 7, 2], [10, 9]],
    '5-4-1': [[3, 4, 5, 6, 2], [11, 10, 8, 7], [9]],
    '5-3-2': [[3, 4, 5, 6, 2], [11, 8, 7], [9, 10]],
  };

  // Platsen på planen som 365Scores ritar den: linje 0 (målvakten) till 100
  // (längst fram) jämnt fördelat, sida 0 (lagets vänsterkant) till 100.
  // Två på en linje står på 20 och 80, som hos 365Scores.
  const SIDES = { 1: [50], 2: [20, 80] };
  function sides(n) {
    return SIDES[n] || Array.from({ length: n }, (_, i) => Math.round((i * 100) / (n - 1)));
  }

  // formation → { platsnummer: { l, s, g } }, g = del av laget: G målvakt,
  // D försvar (första linjen), F anfall (sista), M allt däremellan. null =
  // okänd formation.
  const memo = {};
  function spots(f) {
    if (memo[f] !== undefined) return memo[f];
    const lines = FORMATIONS[f];
    if (!lines) return (memo[f] = null);
    const out = { 1: { l: 0, s: 50, g: 'G' } };
    lines.forEach((places, i) => {
      const xs = sides(places.length);
      const g = i === 0 ? 'D' : i === lines.length - 1 ? 'F' : 'M';
      places.forEach((p, j) => { out[p] = { l: Math.round((100 * (i + 1)) / lines.length), s: xs[j], g }; });
    });
    return (memo[f] = out);
  }

  // Plats för plats i planen (slots: [{ l, s, g }]) och kön (pool: [{ g, l,
  // s, p }], p = platsens index i slots om spelaren startade i mallens match,
  // annars -1). out(spelare) = saknas. Svarar [{ slot, player }] för alla elva
  // platser, eller null om kön inte räcker till elva.
  function fill(plan, out) {
    const slots = plan.slots;
    const taken = new Array(slots.length).fill(null);
    const used = new Set();
    const free = (g) => slots.map((s, i) => i).filter((i) => !taken[i] && (g == null || slots[i].g === g));
    const near = (pl, list) => {
      let best = -1;
      let bd = Infinity;
      for (const i of list) {
        const s = slots[i];
        const d = (pl.l == null ? 0 : (s.l - pl.l) ** 2) + (pl.s == null ? 0 : (s.s - pl.s) ** 2);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    };
    const ok = plan.pool.filter((pl) => !(out && out(pl)));
    // Först var och en i sin egen del av laget, i köns ordning – den som
    // startade i mallens match på sin plats där.
    for (const pl of ok) {
      if (!free().length) break;
      const i = pl.p >= 0 && !taken[pl.p] ? pl.p : near(pl, free(pl.g));
      if (i < 0) continue;
      taken[i] = pl;
      used.add(pl);
    }
    // Räcker inte en del av laget till tar nästa i kön platsen (aldrig en
    // utespelare i mål eller en målvakt ute).
    for (const i of free()) {
      const pl = ok.find((x) => !used.has(x) && (x.g === 'G') === (slots[i].g === 'G'));
      if (!pl) continue;
      taken[i] = pl;
      used.add(pl);
    }
    if (taken.some((x) => !x)) return null;
    return taken.map((player, i) => ({ slot: slots[i], player }));
  }

  return { FORMATIONS, spots, fill };
});
