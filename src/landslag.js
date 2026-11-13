'use strict';

// Landslagen (data/landslag.json): det som datorn, text-tv:n och statistiken
// behöver om landskamperna, i en fil. Beskrivande – styr ingen prognos.
//
//   grupper   Nations Leagues grupper (A1–D2) med tabellen, placering först
//   lag       varje europeiskt landslag: gruppen och raden i tabellen, Nations
//             League hittills, alla landskamper sedan hösten 2024 (V–O–F och
//             mål), de tio senaste matcherna och nästa match
//   omgang    landskamperna de närmaste sju dagarna och de senaste tre, med
//             marknadens prognos i hela procent
//
// Lagen heter som på Stryktipset (config/landslag.js); `en` är ESPN:s namn och
// `espnId` nyckeln till flaggan (data/skoldar.json, under det svenska namnet).
// Allt kommer ur ESPN (src/sources.js: espn_fixtures_unl/emk/vsk,
// espn_tabell_unl, espn_land_historik).

const { load, landCalendar } = require('./matches');
const { competition } = require('../config/competitions');
const { wholePercent } = require('./model');

const SENASTE = 10;
const DAY = 86400000;

function landslagFil({ predictions = new Map(), now = Date.now() } = {}) {
  const D = load();
  const grupper = D.landTabell.groups.map((g) => ({
    id: g.id,
    namn: g.name,
    liga: g.id ? g.id[0] : null,
    lag: g.rows.map((r) => ({
      lag: r.name, en: r.en, espnId: r.espnId, kod: r.abbr || null,
      rank: r.rank, played: r.played, won: r.won, drawn: r.drawn, lost: r.lost,
      gf: r.gf, ga: r.ga, gd: r.gd, points: r.points, note: r.note || null,
    })),
  }));

  // Alla europeiska landslag: de i tabellen och de som spelar landskamperna.
  const lagen = new Map();
  for (const g of D.landTabell.groups) for (const r of g.rows) lagen.set(r.key, { namn: r.name, en: r.en, espnId: r.espnId, kod: r.abbr || null });
  for (const m of D.land) {
    for (const [k, t] of [[m.hk, m.home], [m.ak, m.away]]) {
      if (!lagen.has(k)) lagen.set(k, { namn: t.name, en: t.en, espnId: t.espnId, kod: t.abbr || null });
    }
  }

  const lag = [];
  for (const [k, t] of lagen) {
    const cal = landCalendar(D, k);
    const spelade = cal.filter((x) => x.completed && (x.score90 || x.score));
    const rad = (x) => {
      const s = x.score90 || x.score;
      const f = x.home ? s.home : s.away;
      const a = x.home ? s.away : s.home;
      return {
        id: x.id, datum: x.kickoff.slice(0, 10), turnering: x.short, turneringNamn: x.name,
        hemma: x.home, motstand: x.opponent, mal: [f, a], utfall: f > a ? 'V' : f < a ? 'F' : 'O',
        ...(x.shootout ? { avgjord: 'straffar' } : x.status === 'STATUS_FINAL_AET' ? { avgjord: 'förlängning' } : {}),
      };
    };
    const rader = spelade.map(rad);
    const sum = (rs) => ({
      matcher: rs.length,
      v: rs.filter((r) => r.utfall === 'V').length,
      o: rs.filter((r) => r.utfall === 'O').length,
      f: rs.filter((r) => r.utfall === 'F').length,
      gjorda: rs.reduce((n, r) => n + r.mal[0], 0),
      inslappta: rs.reduce((n, r) => n + r.mal[1], 0),
      nollor: rs.filter((r) => r.mal[1] === 0).length,
    });
    const nl = rader.filter((r, i) => spelade[i].comp === 'unl');
    const tab = D.landTabell.byKey.get(k);
    const nasta = cal.find((x) => !x.completed && Date.parse(x.kickoff) > now - 3 * 3600000 && !/POSTPONED|CANCELED/.test(x.status || ''));
    lag.push({
      lag: t.namn, en: t.en, espnId: t.espnId, kod: t.kod,
      grupp: tab ? tab.group.id : null,
      liga: tab && tab.group.id ? tab.group.id[0] : null,
      tabell: tab ? { rank: tab.row.rank, av: tab.group.rows.length, played: tab.row.played, points: tab.row.points, gd: tab.row.gd } : null,
      nationsLeague: sum(nl),
      alla: { ...sum(rader), fran: rader.length ? rader[0].datum : null },
      senaste: rader.slice(-SENASTE).reverse(),
      nasta: nasta ? { id: nasta.id, datum: nasta.kickoff, turnering: nasta.short, hemma: nasta.home, motstand: nasta.opponent } : null,
    });
  }
  lag.sort((a, b) => a.lag.localeCompare(b.lag, 'sv'));

  const omgang = D.land
    .filter((m) => Date.parse(m.kickoff) >= now - 3 * DAY && Date.parse(m.kickoff) <= now + 7 * DAY)
    .map((m) => {
      const p = predictions.get(m.id);
      const c = competition(m.comp);
      return {
        id: m.id, avspark: m.kickoff, turnering: c.short, turneringNamn: c.name, grupp: m.group ? m.group.replace(/^Group\s+/, '') : null,
        hemma: m.home.name, borta: m.away.name, arena: m.venue || null, ort: m.venueCity || null,
        status: m.status, resultat: m.score90 || null,
        prognos: p && p.status === 'ok' ? wholePercent(p.p) : null,
      };
    });

  return {
    kalla: {
      provider: 'ESPN',
      matcher: D.landFetchedAt.unl || null,
      tabell: D.landTabell.fetchedAt,
      historik: D.landHistFetchedAt,
    },
    grupper,
    lag,
    omgang,
  };
}

module.exports = { landslagFil };
