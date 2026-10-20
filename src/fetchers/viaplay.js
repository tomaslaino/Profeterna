'use strict';

// Viaplays öppna innehålls-API (content.viaplay.se), samma JSON som
// viaplay.se läser. Viaplay visar Premier League, Championship, League One,
// FA-cupen och Ligacupen i Sverige och lägger ut sammandrag som går att se
// gratis – med reklam, utan konto (verifierat 2026-10-20: Tottenham–Coventry
// spelades utloggad efter tio sekunders reklam). League Two har inga
// sammandrag där. API:t svarar även utanför Sverige (GitHub Actions).
//
// Varje tävlingssida har listor med klipp: "Höjdpunkter" (Premier Leagues
// sammandrag på fem minuter, som ligger ute en månad, och EFL:s, ett år) och
// "Utvalda klipp" (bl.a. Premier Leagues "Höjdpunkter: A-B" på tre minuter,
// ett år). Sammandragen känns igen på formatet – mål, intervjuer och
// studioklipp har andra. Vilken match ett klipp hör till avgörs i
// src/hojdpunkter.js.

const { getJson, mapLimit } = require('./http');

const BASE = 'https://content.viaplay.se/pcdash-se/sport/fotboll';
const PAGES = { pl: 'premier-league', ch: 'championship', l1: 'league-one', fac: 'fa-cupen', lc: 'ligacupen' };
const FORMATS = new Set(['Höjdpunkter från Premier League', 'Sporthöjdpunkter']);
// Sidor à 40 klipp per lista. Premier Leagues "Utvalda klipp" hade sju i
// oktober 2026, nyast först.
const MAX_PAGES = 12;

const products = (j) => (j && j._embedded && j._embedded['viaplay:products']) || [];
const nextPage = (j) => (j && j._links && j._links.next && j._links.next.href) || null;

function clip(p, comp) {
  const c = p.content || {};
  const sys = p.system || {};
  const av = sys.availability || {};
  if (p.type !== 'clip' || !sys.guid || !c.title || !av.end) return null;
  if (!FORMATS.has(c.format && c.format.title)) return null;
  const ms = c.duration && c.duration.milliseconds;
  return {
    guid: sys.guid,
    comp,
    title: c.title,
    sec: ms ? Math.round(ms / 1000) : null,
    from: av.start || null,
    until: av.end,
  };
}

// Klippen som går att se nu, från säsongens start (since, ISO-datum). Klipp
// från förra hämtningen (prev) som fortfarande ligger ute behålls, även om de
// fallit ur listorna. Fallerar en sida fallerar hela hämtningen – cachen
// behåller då förra omgångens klipp.
async function fetchClips(prev, since) {
  const now = Date.now();
  const live = (c) => Date.parse(c.until) > now && (!c.from || c.from >= since);
  const byGuid = new Map();
  for (const c of (prev && prev.clips) || []) if (live(c)) byGuid.set(c.guid, c);
  await mapLimit(Object.entries(PAGES), 2, async ([comp, page]) => {
    const j = await getJson(`${BASE}/${page}`);
    for (const b of (j._embedded && j._embedded['viaplay:blocks']) || []) {
      if (b.type !== 'list') continue;
      let list = products(b);
      let next = nextPage(b);
      for (let n = 1; next && n < MAX_PAGES; n++) {
        const pj = await getJson(next);
        list = list.concat(products(pj));
        next = nextPage(pj);
      }
      for (const p of list) {
        const c = clip(p, comp);
        if (c && live(c)) byGuid.set(c.guid, c);
      }
    }
  });
  const clips = [...byGuid.values()].sort((a, b) => String(b.from).localeCompare(String(a.from)));
  return { clips, sourceUrl: 'https://viaplay.se/sportklipp' };
}

// Viaplays spelare för klippet: startar direkt, utan konto och utan
// klippsidans Börja titta (verifierat 2026-10-20). Viaplay tillåter inte att
// sidorna visas inuti andra sajter (X-Frame-Options: DENY), så klippet går
// inte att bädda in – det öppnas i ett eget fönster (public/hojdpunkter.js).
const clipUrl = (guid) => `https://viaplay.se/player/default/sport/${guid}`;

module.exports = { fetchClips, clipUrl, PAGES };
