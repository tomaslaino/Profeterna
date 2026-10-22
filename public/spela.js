'use strict';

// ---------- Spela hos Svenska Spel ----------
//
// Gängets kupong för Stryktipset (c.spel) går att spela med ett tryck:
// länken öppnar veckans Stryktips hos Svenska Spel med gängets tecken
// ifyllda. Numren på Svenska Spels kupong kommer från omgången där (Folket,
// folket.js – samma som Hämta Stryktipset), så att de stämmer också när en
// match har strukits. Knappen står bara medan omgången är öppen för spel, och
// bara när varje match på Svenska Spels kupong (utom strukna) har ett tecken
// på gängets kupong. Omgången hämtas när en kupong för Stryktipset visas,
// högst var femte minut, och sidan ritas om när den har kommit.
//
// Priset: en rad kostar en krona på Stryktipset (Svenska Spels rowPrice), så
// i foten på en kupong för Stryktipset står Pris – i kronor, och för gängets
// kupong vad det blir per person – i stället för Kombinationer.
//
// Läses efter kupong.js och folket.js och använder deras hjälpare (KP,
// Folket, redraw).

window.Spela = (() => {
  const RADPRIS = 1;
  const PRODUKT = 1; // Stryktipset hos Svenska Spel
  const BAS = 'https://spela.svenskaspel.se/stryktipset';
  const STALE_MS = 5 * 60000;
  let draw = null; // {nr, stang, rows: [{nr, struken, m}]} – omgången som är öppen
  let at = 0;

  async function load() {
    at = Date.now();
    const got = window.Folket ? await Folket.open() : null;
    const next = got && got.omgang.lage === 'Open' ? { nr: got.omgang.nr, stang: Date.parse(got.omgang.stang), rows: got.rows } : null;
    const was = draw;
    draw = next;
    if (next || was) redraw();
  }

  // Länken till Svenska Spel med kupongens tecken, eller null.
  function href(c) {
    if (!c || c.spel !== 'Stryktipset') return null;
    if (Date.now() - at > STALE_MS) load();
    if (!draw || !(Date.now() < draw.stang)) return null;
    const signs = new Map(c.matches.map((x) => [x.id, x.sign]));
    const rows = draw.rows.filter((r) => !r.struken);
    if (!rows.length || !rows.every((r) => r.m && signs.get(r.m.id))) return null;
    const q = new URLSearchParams({
      product: String(PRODUKT),
      draw: String(draw.nr),
      signs: rows.map((r) => `${r.nr}:${signs.get(r.m.id)}`).join(','),
      share: 'valid',
    });
    return `${BAS}?${q}`;
  }

  // Knappen, eller ingenting. cls: knappens klasser.
  function button(c, cls = 'kp-btn primary kp-spela') {
    const url = href(c);
    return url ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener" title="Öppnar Stryktipset hos Svenska Spel med gängets tecken ifyllda">Spela hos Svenska Spel</a>` : '';
  }

  // Fältet i foten för kupongens rader: Pris på Stryktipset, annars
  // Kombinationer. folk: hur många som delar på gängets kupong.
  const kr = (n) => `${n.toLocaleString('sv-SE', { maximumFractionDigits: 2 })} kr`;
  function field(rader, spel, folk = 0) {
    if (!spel) return ['Kombinationer', rader];
    const pris = rader * RADPRIS;
    return ['Pris', kr(pris) + (folk > 1 ? `<small>${kr(pris / folk)} var</small>` : ''),
      folk > 1 ? `${rader} rader à ${kr(RADPRIS)}, delat på ${folk}` : `${rader} rader à ${kr(RADPRIS)}`];
  }

  // Hur många som delar på gängets kupong.
  const folk = () => (KP.data && KP.data.samtal && KP.data.samtal.gang ? KP.data.samtal.gang.length : 0);

  return { href, button, field, folk };
})();
