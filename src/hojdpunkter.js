'use strict';

// Höjdpunkterna: Viaplays gratis sammandrag (src/fetchers/viaplay.js) knutna
// till matcherna i spelprogrammet, som repriserna på gravergrav.se. Visas i
// matchrutan och på matchraden; inget här styr prognoserna.
//
// Klippen har inget matchid, bara en titel – "Tottenham - Coventry",
// "Höjdpunkter: Fulham-Manchester United", "FLC: West Brom - Burnley |
// Highlights". Matchen hittas därför på tävling, lag och datum: samma
// tävling, spelad, båda lagen stämmer och avspark högst 30 dagar före och
// tre dagar efter att klippet lades ut (Premier Leagues klipp ligger ute från
// midnatt dagen före matchen, och Viaplay lägger ibland ut samma sammandrag
// igen veckor senare). Passar flera matcher väljs den närmast i
// tid; passar ingen visas klippet inte.
//
// Ett lag stämmer om namnen är lika efter aliastabellen
// (config/team-aliases.js) eller om varje ord i Viaplays namn är början av
// ESPN-namnets ord i tur och ordning ("Bristol C" = "Bristol City", "West
// Brom" = "West Bromwich Albion"). Ensamt vore det tvetydigt ("Bristol"), men
// här ska båda lagen stämma i en och samma match – därför räcker det.
// Verifierat 2026-10-20: alla 212 sammandrag med två lag i titeln från
// säsongens start hittade exakt en match (170 matcher), sedan smeknamnen
// Sheff Utd, Palace och MK Dons lagts i aliastabellen.

const { readCache } = require('./store');
const { keyOf, espnKey, norm } = require('./teams');
const { clipUrl } = require('./fetchers/viaplay');

const SOURCE_ID = 'viaplay_hojdpunkter';
const DAY = 86400000;

// Klippets två lag, eller null om titeln inte är en match.
function teams(title) {
  const t = String(title || '').replace(/\s*\|.*$/, '').replace(/^[^:]{1,20}:\s*/, '').trim();
  let parts = t.split(/\s+[-–]\s+/);
  if (parts.length !== 2) parts = t.split(/\s*[-–]\s*/);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return parts;
}

const words = (s) => norm(s).split(' ').filter(Boolean);

function sameTeam(name, espnName) {
  if (keyOf(name) === espnKey(espnName)) return true;
  const a = words(name);
  const b = words(espnName);
  return a.length > 0 && a.length <= b.length && a.every((w, i) => b[i].startsWith(w));
}

// Spelade matcher → { byMatch: Map(id → klipp, längst först), clips, matched }.
function highlightsByMatch(matches) {
  const cache = readCache(SOURCE_ID);
  const clips = (cache && cache.data && cache.data.clips) || [];
  const now = Date.now();
  const played = matches.filter((m) => m.completed);
  const byMatch = new Map();
  for (const c of clips) {
    if (Date.parse(c.until) <= now) continue;
    const p = teams(c.title);
    if (!p) continue;
    const t = Date.parse(c.from);
    let best = null;
    for (const m of played) {
      const k = Date.parse(m.kickoff);
      if (m.comp !== c.comp || k < t - 30 * DAY || k > t + 3 * DAY) continue;
      if (!sameTeam(p[0], m.home) || !sameTeam(p[1], m.away)) continue;
      if (!best || Math.abs(k - t) < Math.abs(Date.parse(best.kickoff) - t)) best = m;
    }
    if (!best) continue;
    if (!byMatch.has(best.id)) byMatch.set(best.id, []);
    byMatch.get(best.id).push(c);
  }
  // Samma sammandrag kan ligga ute flera gånger: ett per längd (hel minut),
  // det senast utlagda. Längst först, högst två.
  for (const [id, list] of byMatch) {
    const byLen = new Map();
    for (const c of list) {
      const k = Math.round((c.sec || 0) / 60);
      const have = byLen.get(k);
      if (!have || String(c.from) > String(have.from)) byLen.set(k, c);
    }
    byMatch.set(id, [...byLen.values()]
      .sort((a, b) => (b.sec || 0) - (a.sec || 0))
      .slice(0, 2)
      .map((c) => ({ url: clipUrl(c.guid), sec: c.sec, until: c.until })));
  }
  return { byMatch, clips: clips.length, matched: byMatch.size };
}

module.exports = { highlightsByMatch, teams, sameTeam, SOURCE_ID };
