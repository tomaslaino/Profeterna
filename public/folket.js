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
//
// Samma omgång ger siffrorna på gängets kupong: Svenska folket, oddsen och
// favoritskapet för varje match (info, hamta), en sort åt gången med flikar
// (flik, flikar, tal). Bara gängets kupong, i rummet (rum.js) och på papperet
// (samtal.js) – var och ens egen kupong ska inte styras av vad folket spelar.

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
    // Landslagen (sedan 2026-11-13): sajten skriver som Svenska Spel
    // (config/landslag.js), men samma land kan stå på flera sätt – och på
    // engelska. Gemener utan accenter, som namnet ser ut när reglerna körs.
    [/\bbosni(?:en|a)\b(?:[\s-]*(?:&|och|o\.|and|-|\/)?[\s-]*her[cz]egovina\b)?/g, 'bosnien hercegovina'],
    [/\b(?:n(?:ord|orra)?\.?[\s-]*irland|northern\s+ireland|n\.\s*ireland)\b/g, 'nordirland'],
    [/\brep(?:ubliken)?\.?\s*irland\b|\birlandska\s+rep[a-z]*\.?|\beire\b|\b(?:rep(?:ublic)?\.?\s+of\s+)?ireland\b/g, 'irland'],
    [/\btjeckiska\s+rep[a-z]*\.?|\bczech(?:ia|\s+republic)?\b/g, 'tjeckien'],
    [/\bvitryssland\b/g, 'belarus'],
    [/\b(?:n(?:ord|orra)?\.?[\s-]*)?makedonien\b|\b(?:north\s+)?macedonia\b/g, 'nordmakedonien'],
    [/\bturkiye\b|\bturkey\b/g, 'turkiet'],
    [/\bholland\b|\bnetherlands\b/g, 'nederlanderna'],
    [/\bfaroerna\b|\bfaroe\s+islands\b/g, 'faroarna'],
    [/\bsweden\b/g, 'sverige'],
    [/\bnorway\b/g, 'norge'],
    [/\bdenmark\b/g, 'danmark'],
    [/\bromania\b/g, 'rumanien'],
    [/\bpoland\b/g, 'polen'],
    [/\bukraine\b/g, 'ukraina'],
    [/\baustria\b/g, 'osterrike'],
    [/\bgeorgia\b/g, 'georgien'],
    [/\bhungary\b/g, 'ungern'],
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

  // ---------- Svenska folket, oddsen och favoritskapet ----------

  const SORT = ['folket', 'odds', 'fav'];
  const FLIK = 'profeterna.spelflik';
  const INFO = new Map(); // omgångens nr → {at, stang, tid, slag, rader: {matchens id: {folket, odds, fav}}}

  let valdFlik = null;

  const info = (nr) => INFO.get(Number(nr)) || null;

  // Hämtar omgången nr, högst en gång i minuten och var kvart efter spelstoppet,
  // när siffrorna står still. → true om siffrorna har ändrats.
  async function hamta(nr) {
    const n = Number(nr);
    const url = endpoint();
    const had = INFO.get(n);
    const t = Date.now();
    if (!url || !n || (had && t - had.at < (had.stang && Date.parse(had.stang) < t ? 900000 : 60000))) return false;
    if (had) had.at = t;
    let om = null;
    try {
      const res = await fetch(`${url}?nr=${n}`, { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      om = res.ok && body.ok ? body.omgang : null;
    } catch {
      om = null;
    }
    if (!om) {
      if (!had) INFO.set(n, { at: t, rader: {} });
      return false;
    }
    const rader = {};
    for (const x of link(om)) if (x.m && (x.folket || x.odds)) rader[String(x.m.id)] = { folket: x.folket || null, odds: x.odds || null, fav: x.fav || null, slag: x.oddsSlag || null };
    const ny = !had || JSON.stringify(had.rader) !== JSON.stringify(rader);
    INFO.set(n, { at: t, stang: om.stang || null, tid: om.folketTid || null, oddsTid: om.oddsTid || null, rader });
    return ny;
  }

  // Vilken sort som står under rutorna: 0 Svenska folket, 1 odds, 2 favoritskap.
  function flik() {
    if (valdFlik == null) {
      try {
        valdFlik = Number(localStorage.getItem(FLIK));
      } catch {
        valdFlik = 0;
      }
    }
    return SORT[valdFlik] ? valdFlik : 0;
  }
  function valjFlik(n) {
    valdFlik = n;
    try {
      localStorage.setItem(FLIK, String(n));
    } catch {
      /* då gäller den tills sidan laddas om */
    }
  }

  // Talet för tecknet j i en match (en rad ur info), som det står på kupongen.
  function tal(rad, j, f = flik()) {
    const v = rad && rad[SORT[f]];
    if (!v || v[j] == null) return '–';
    return f === 1 ? v[j].toFixed(2).replace('.', ',') : `${Math.round(v[j])}%`;
  }

  // Säger var oddsen kommer från, när man pekar på fliken: efter spelstoppet är
  // de sista läget eller, om det saknas, startoddsen.
  function oddsTitel(i) {
    const slag = Object.values((i && i.rader) || {}).map((r) => r.slag);
    return slag.includes('start') ? 'Startoddsen från Svenska Spel: sista läget före spelstopp finns inte'
      : slag.includes('sista') ? 'Svenska Spels odds, sista läget före spelstopp' : 'Svenska Spels odds';
  }
  const titlar = (i) => ['Svenska folket: hur stor del av raderna som har med tecknet', oddsTitel(i), 'Favoritskap: chansen enligt oddsen'];
  const NAMN = ['Folket', 'Odds', 'Favoritskap'];
  // Knapparna, med sort i data-spelflik – de sorter som finns. Saknas den valda
  // (tjänsten har inga odds) står den första som finns där.
  const finns = (i) => [0, 1, 2].filter((k) => Object.values((i && i.rader) || {}).some((r) => r[SORT[k]]));
  const vald = (i) => {
    const lista = finns(i);
    return lista.includes(flik()) || !lista.length ? flik() : lista[0];
  };
  const flikar = (i, f = vald(i)) => finns(i).map((k) => `<button type="button" data-spelflik="${k}" aria-pressed="${k === f}" title="${titlar(i)[k]}">${NAMN[k]}</button>`).join('');

  return { open, info, hamta, vald, valjFlik, tal, flikar, NAMN };
})();
