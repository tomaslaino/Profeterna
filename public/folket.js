'use strict';

// ---------- Stryktipset ----------
//
// Hämta Stryktipset (Välj matcher, samtal.js): veckans tretton matcher från
// Svenska Spel i kupongens ordning, knutna till sajtens matcher på lagen och
// avsparken.
//
// Svenska Spel släpper inte in anrop direkt från sajten, så tjänsten
// profeterna-kupong hämtar åt den (GET …/stryktipset, worker/stryktipset.mjs;
// lokalt /api/stryktipset).
//
// Läses efter kupong.js och använder dess hjälpare (KP, fold) och app.js
// (state).

window.Folket = (() => {
  const endpoint = () => {
    const s = KP.data && KP.data.samtal;
    return s && s.endpoint ? s.endpoint.replace(/\/samtal$/, '/stryktipset') : null;
  };

  async function fetchDraw() {
    const url = endpoint();
    if (!url) return null;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      return res.ok && body.ok ? body.omgang : null;
    } catch {
      return null;
    }
  }

  // ---------- Svenska Spels lag → sajtens matcher ----------

  // Svenska Spels korta namn ("QPR", "Wolves", "West Brom", "Bristol C") är
  // början av sajtens, sedan smeknamnen översatts. Samma regler i tjänsten,
  // som startar veckans omgång (linkDraw i worker/stryktipset.mjs).
  const ALIAS = [
    [/\bman\.?\s+(?:utd|u|united)\b/g, 'manchester united'],
    [/\bman\.?\s+city\b/g, 'manchester city'],
    [/\bsheff\.?\b/g, 'sheffield'],
    [/\butd\b/g, 'united'],
    [/\bwed\b/g, 'wednesday'],
    [/\bwolves\b/g, 'wolverhampton'],
    [/\bspurs\b/g, 'tottenham'],
    [/\bq\.?p\.?r\b/g, 'queens park rangers'],
    [/\bmk\s+dons\b/g, 'milton keynes dons'],
    [/\bnott'?m\.?\s+forest\b/g, 'nottingham forest'],
    [/\bboro\b/g, 'middlesbrough'],
  ];
  const key = (s) => ALIAS.reduce((t, [re, to]) => t.replace(re, to), fold(s))
    .replace(/^(?:afc|fc)\s+/, '').replace(/[^a-z0-9]/g, '');
  const same = (a, b) => {
    const x = key(a);
    const y = key(b);
    return x.length >= 3 && y.length >= 3 && (x.startsWith(y) || y.startsWith(x));
  };

  // Svenska Spels matcher → sajtens, i kupongens ordning. Samma lag i samma
  // ordning, närmast avsparken (inom ett och ett halvt dygn).
  function link(omgang) {
    const all = (state.all && state.all.matches) || [];
    return omgang.matcher.map((x) => {
      const t = Date.parse(x.avspark);
      let best = null;
      for (const m of all) {
        const d = Math.abs(Date.parse(m.kickoff) - t);
        if (!(d <= 36 * 3600000) || !same(x.hemma, m.home) || !same(x.borta, m.away)) continue;
        if (!best || d < best.d) best = { m, d };
      }
      return { ...x, m: best ? best.m : null };
    });
  }

  // Välj matcher → Hämta Stryktipset: veckans omgång med sajtens matcher.
  // → {omgang, rows: [{nr, hemma, borta, m}]} eller null (ingen kontakt
  // eller ingen omgång öppen).
  async function open() {
    const omgang = await fetchDraw();
    return omgang ? { omgang, rows: link(omgang) } : null;
  }

  return { open };
})();
