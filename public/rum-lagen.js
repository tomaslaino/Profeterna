'use strict';

// Lagen på kupongen i tobaksaffären (rum.js): ett klick på lagen i en rad på
// kupongen i handen lägger ett blad med båda lagen ovanpå kupongen, på samma
// papper och i samma mått. Bladet är byggt av det sajten redan visar, med
// samma tal under samma namn:
//   oddsen       chansen för 1, X och 2 ur spelbolagens odds utan marginalen,
//                i stapeln från Vad drog åt vilket håll (.tug-stack), och under
//                den oddsen som matchbladet visar dem (bookOdds i app.js)
//   Ligan hittills  Mål som i Lagen sida vid sida (ESPN) och xG summerat över
//                säsongen ur samma källa som raden xG där (Understat i Premier
//                League, annars football-data.co.uk)
//   Form         de tio senaste matcherna i alla tävlingar, nyast till vänster,
//                i formens stämplade rutor (grön vinst, röd förlust, grå
//                oavgjort, efter 90 minuter) – hemmamatcherna i övre raden och
//                bortamatcherna i den undre, med ställningen i rutan och lagets
//                och motståndarnas xG under (bara ligamatcher har xG)
// Lagets siffror först, motståndarnas sedan, som på resten av sajten.
// Allt ur matchens fil (data/match/<id>.json: teams.*.record, .xg, .senaste
// och odds, src/matches.js). Dolda resultat (Spoiler) står som ?.
//
// RumLagen.load(id) → Promise med matchens fil (null om den inte går att hämta)
// RumLagen.html({ m, nr, av, kupong, nar }, d) → bladets innehåll; d undefined = hämtas

window.RumLagen = (() => {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dec = (x, d = 1) => (x == null ? '–' : x.toFixed(d).replace('.', ','));
  const crest = (name) => (window.Skoldar ? Skoldar.img(name) : '');
  const RES = { V: 'Vinst', O: 'Oavgjort', F: 'Förlust' };
  const MAN = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const dag = (s) => `${Number(s.slice(8, 10))} ${MAN[Number(s.slice(5, 7)) - 1]}`;
  const hides = (date) => Boolean(window.Spoiler && Spoiler.hidesDay && Spoiler.hidesDay(date));

  const cache = new Map();
  function load(id) {
    if (!cache.has(id)) {
      const p = fetch(`data/match/${encodeURIComponent(id)}.json`, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((d) => {
          if (!d) cache.delete(id);
          return d;
        });
      cache.set(id, p);
    }
    return cache.get(id);
  }

  // Hela procent som summerar till 100 (pct3 i app.js, samma regel som bygget).
  function hela(ps) {
    if (typeof pct3 === 'function') return pct3(ps);
    const raw = ps.map((p) => p * 100);
    const out = raw.map(Math.floor);
    let left = 100 - out.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
    return out;
  }

  // Chansen ur oddsen: spelbolagens odds som matchbladet visar dem, med
  // marginalen bortdragen i proportion (som marknaden i src/teamstats.js).
  function oddsen(d, m) {
    const b = typeof bookOdds === 'function' ? bookOdds(d) : null;
    if (!b || !b.x || !b.x.every((x) => x > 1)) {
      const note = d.odds && d.odds.note;
      return `<div class="rl-odds tom"><p>${esc(note || 'Inga odds för matchen.')}</p></div>`;
    }
    const inv = b.x.map((x) => 1 / x);
    const sum = inv[0] + inv[1] + inv[2];
    const p = hela(inv.map((x) => x / sum));
    const lab = [m.home, 'Oavgjort', m.away];
    const odd = (x) => (typeof odds === 'function' ? odds(x) : dec(x, 2));
    return '<div class="rl-odds">' +
      `<div class="rl-chans">${p.map((v, i) => `<span class="c${i}" title="${esc(`${lab[i]}: ${v} %`)}"><i>${'1X2'[i]}</i><b>${v} %</b></span>`).join('')}</div>` +
      `<div class="tug-stack">${p.map((v, i) => `<span class="s${i}" style="flex:${v} 1 0"></span>`).join('')}</div>` +
      `<p class="rl-bolag"${b.title ? ` title="${esc(b.title)}"` : ''}>${esc(b.name)} ${b.x.map((x) => `<b>${odd(x)}</b>`).join(' · ')}</p></div>`;
  }

  // Mål och xG i ligan hittills, sida vid sida: lagets först, motståndarnas sedan.
  // xG kan sakna den senaste omgången (football-data.co.uk släpar), och då står
  // antalet matcher det gäller under.
  function ligan(d, veil) {
    const T = [d.teams.home, d.teams.away];
    const rec = (t) => t.record && t.record.all;
    const mal = (t, i) => {
      const r = rec(t);
      if (!r || !r.n) return '–';
      return veil[i] ? '?' : `${r.gf}–${r.ga}`;
    };
    const xg = (t, i) => {
      const x = t.xg;
      if (!x || !x.n) return '–';
      if (veil[i]) return '?';
      const r = rec(t);
      const n = r && r.n !== x.n ? `<small>${x.n} matcher</small>` : '';
      return `${dec(x.f)}–${dec(x.a)}${n}`;
    };
    const rad = (label, f) => `<span class="h">${f(T[0], 0)}</span><span class="mid">${label}</span><span class="a">${f(T[1], 1)}</span>`;
    const lg = T.map((t) => (t.league ? t.league.name : null));
    const liga = lg[0] !== lg[1] ? rad('Liga', (t) => esc(t.league ? t.league.name : 'okänd')) : '';
    const src = T.map((t) => t.xg && t.xg.source && t.xg.source.provider).filter(Boolean);
    const title = src.length ? ` title="${esc(`xG: ${[...new Set(src)].join(' och ')}`)}"` : '';
    return `<div class="rl-ligan"><span class="rl-rub">Ligan hittills</span>${liga}${rad('Mål', mal)}` +
      rad(`<span${title}>xG</span>`, xg) + '</div>';
  }

  // Formen: en kolumn per match, nyast till vänster; hemmamatcherna i övre
  // raden och bortamatcherna i den undre.
  function form(name, t, cls) {
    const list = (t && t.senaste) || [];
    const ruta = (x, i) => {
      const where = `${x.home ? 'hemma' : 'borta'}${x.opponent ? ` mot ${x.opponent}` : ''}`;
      const at = `grid-column:${i + 2};grid-row:${x.home ? 1 : 2}`;
      if (hides(x.date)) return `<span class="rl-m" style="${at}" title="Dold – du har valt att dölja resultat."><b class="sp">?</b></span>`;
      const score = x.gf == null ? '' : `${x.gf}–${x.ga}`;
      const tip = `${dag(x.date)} · ${x.comp} · ${where}${score ? ` · ${score}` : ''}` +
        `${x.decided ? `, avgjord ${x.decided === 'straffar' ? 'på straffar' : 'i förlängning'}` : ''}` +
        `${x.xg ? ` · xG ${dec(x.xg[0])}–${dec(x.xg[1])}` : ''}`;
      return `<span class="rl-m" style="${at}" title="${esc(`${RES[x.result] || 'Resultat saknas'}: ${tip}`)}">` +
        `<b class="${x.result || ''}">${score || '?'}</b>${x.xg ? `<small>${dec(x.xg[0])}–${dec(x.xg[1])}</small>` : ''}</span>`;
    };
    const banor = list.length
      ? '<span class="rl-bana" style="grid-row:1">Hemma</span><span class="rl-bana" style="grid-row:2">Borta</span>' + list.map(ruta).join('')
      : '<span class="rl-inga">Inga tidigare matcher</span>';
    return `<div class="rl-lag ${cls}"><span class="rl-namn"><i></i>${esc(name)}</span><div class="rl-banor">${banor}</div></div>`;
  }

  function html({ m, nr, av, kupong, nar }, d) {
    const band = `<span class="band"><small>MATCHFIXARNA · ${esc(kupong ? kupong.toUpperCase() : 'KUPONG')}</small><b>Match ${nr}</b></span>`;
    const head = `<div class="rl-topp"><span class="rl-t h">${crest(m.home)}<b>${esc(m.home)}</b></span>` +
      `<span class="rl-nar">${esc(nar)}</span><span class="rl-t a"><b>${esc(m.away)}</b>${crest(m.away)}</span></div>`;
    const fot = '<div class="rl-fot"><button type="button" class="rl-vag tillbaka" data-lagen-ut>Kupongen</button>' +
      `<span class="rl-steg"><button type="button" class="rl-pil" data-steg="-1" aria-label="Förra matchen"${nr > 1 ? '' : ' disabled'}>‹</button>` +
      `<span>${nr} av ${av}</span><button type="button" class="rl-pil" data-steg="1" aria-label="Nästa match"${nr < av ? '' : ' disabled'}>›</button></span>` +
      `<a class="rl-vag" href="#match/${esc(m.id)}">Matchbladet</a></div>`;
    let body;
    if (d === undefined) body = '<p class="rl-vant">Hämtar …</p>';
    else if (!d || !d.teams) body = '<p class="rl-vant">Siffrorna går inte att hämta just nu.</p>';
    else {
      const T = [d.teams.home, d.teams.away];
      const veil = T.map((t) => (t.senaste || []).some((x) => hides(x.date)));
      body = oddsen(d, m) + ligan(d, veil) +
        `<div class="rl-form"><span class="rl-rub">Form</span>${form(m.home, T[0], 'h')}${form(m.away, T[1], 'a')}</div>`;
    }
    return band + head + body + fot;
  }

  return { load, html };
})();
