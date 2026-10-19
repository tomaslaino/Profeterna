'use strict';

// ---------- poängen för gängets tips ----------
//
// Delas av sidan (tippare.js: Omgångens och Säsongens tippare) och bygget
// (src/tippare.js, som fryser in avslutade omgångar), så att båda räknar
// likadant. I webbläsaren är den window.Tippoang, i Node module.exports.
//
// Poäng per match = 1 om tipset satt (annars 0) minus modellens chans för
// tipset före avspark – för en gardering chanserna ihop. Rätt på en
// storfavorit på 70 % ger +0,30 och en missad −0,70; en skräll på 20 % ger
// +0,80 om den sitter och kostar bara −0,20 om den inte gör det. Mätt med
// modellens egna sannolikheter är det väntade 0 vad man än tippar, så summan
// visar hur mycket bättre (plus) eller sämre (minus) än modellen man tippade.
// Saknas modellen för en match används kuponghistorikens schablon
// (src/history.js): 45 % för ett tecken, 75 % för två.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Tippoang = factory();
})(typeof self !== 'undefined' ? self : this, () => {
  const SIGNS = ['1', 'X', '2'];
  const BASE = { 1: 0.45, 2: 0.75, 3: 1 };

  // "x1" → "1X"; tomt om inget tecken.
  const sign = (s) => {
    const t = String(s || '').toUpperCase();
    return SIGNS.filter((x) => t.includes(x)).join('');
  };

  // Modellens chans för tecknet i hela procent, ur prognosen [1, X, 2]
  // (hela procent) – eller null om prognosen saknas.
  const pct = (s, model) => (model ? s.split('').reduce((a, x) => a + model[SIGNS.indexOf(x)], 0) : null);

  // Chansen som räknas (0–1): modellens, annars schablonen.
  const chance = (s, p) => (p != null ? p / 100 : BASE[s.length]);

  // Modellens tips: det troligaste utfallet.
  const modelSign = (model) => (model ? SIGNS[model.indexOf(Math.max(...model))] : null);

  const points = (hit, prob) => (hit ? 1 : 0) - prob;

  // rows: [{hit, pts} | null] – null är inget tips, pts null en match som
  // inte är avgjord.
  function tally(rows) {
    const done = rows.filter((r) => r && r.pts != null);
    return { n: done.length, ok: done.filter((r) => r.hit).length, pts: done.reduce((a, r) => a + r.pts, 0) };
  }

  // Placeringen följer det som syns: poängen med en decimal, sedan antal rätt.
  const key = (t) => Math.round(t.pts * 10) * 1000 + t.ok;

  // Tipparna i placeringsordning. Med played (någon match avgjord) får högst
  // award 'best' och lägst 'worst' – bara när det finns en skillnad, och
  // delat vid lika.
  function rank(people, played) {
    const ranked = people.slice().sort((a, b) => key(b) - key(a));
    for (const p of ranked) delete p.award;
    if (ranked.length >= 2 && played) {
      const top = key(ranked[0]);
      const low = key(ranked[ranked.length - 1]);
      if (top !== low) {
        for (const p of ranked) {
          if (key(p) === top) p.award = 'best';
          else if (key(p) === low) p.award = 'worst';
        }
      }
    }
    return ranked;
  }

  // Säsongen ur omgångarnas summeringar:
  //   rounds: [{ people: [{id, name, none?, n, ok, pts, award?}], model: {n, ok, pts} }]
  // En omgång räknas för den som tippade minst en avgjord match i den.
  function season(rounds) {
    const by = new Map();
    const model = { id: 'modellen', name: 'Modellen', model: true, rounds: 0, n: 0, ok: 0, pts: 0 };
    for (const r of rounds) {
      for (const p of r.people || []) {
        if (p.none || !p.n) continue;
        if (!by.has(p.id)) by.set(p.id, { id: p.id, name: p.name, rounds: 0, n: 0, ok: 0, pts: 0, best: 0, worst: 0 });
        const s = by.get(p.id);
        s.name = p.name || s.name;
        s.rounds += 1;
        s.n += p.n;
        s.ok += p.ok;
        s.pts += p.pts;
        if (p.award === 'best') s.best += 1;
        if (p.award === 'worst') s.worst += 1;
      }
      if (r.model && r.model.n) {
        model.rounds += 1;
        model.n += r.model.n;
        model.ok += r.model.ok;
        model.pts += r.model.pts;
      }
    }
    return { people: [...by.values()].sort((a, b) => key(b) - key(a)), model };
  }

  return { SIGNS, BASE, sign, pct, chance, modelSign, points, tally, key, rank, season };
});
