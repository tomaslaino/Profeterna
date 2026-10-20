'use strict';

// Höjdpunkterna knutna till matcherna i spelprogrammet: YouTube-klipp ur
// klubbarnas och sändarnas kanaler (src/fetchers/youtube.js), som spelas på
// sajten, och Viaplays gratis sammandrag (src/fetchers/viaplay.js), som
// öppnas hos Viaplay när inget YouTube-klipp finns. Visas i matchrutan och på
// matchraden; inget här styr prognoserna.
//
// ---------- Viaplay ----------
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
const { ALIASES } = require('../config/team-aliases');
const { CLUBS, CHANNELS, NAMES } = require('../config/youtube');

const SOURCE_ID = 'viaplay_hojdpunkter';
const YT_SOURCE_ID = 'youtube_hojdpunkter';
const DAY = 86400000;
const MIN = 60000;

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

// ---------- YouTube ----------
//
// Klippen har bara titel, kanal och tid: "Birmingham City 3-0 Queens Park
// Rangers | Championship highlights", "HIGHLIGHTS | Blues 3-0 QPR". Ett klipp
// hör till en spelad match som började 95 minuter till sex dygn innan det
// lades ut, och där
//   - i en klubbs kanal: klubben spelade och motståndaren står i titeln
//     (klubben kallar ofta sig själv vid smeknamn, "Blues", "Pompey");
//   - i en sändares kanal: båda lagen står i titeln.
// Står ett resultat i titeln ska det vara matchens, åt något håll (efter
// förlängning eller efter 90 minuter). Passar flera matcher väljs den där
// mest av titeln stämmer, sedan den närmast i tid.
//
// Ett lag står i titeln under ESPN-namnet, under det utan "City", "Town",
// "United" osv. ("Birmingham"), under namnen i aliastabellerna
// (config/team-aliases.js, config/youtube.js NAMES) – som hela ord. Det
// kortaste namnet kan vara tvetydigt ("Bristol", "Manchester"), men bara
// lagen i matcherna som passar i tid prövas.

const SUFFIX = / (city|town|united|rovers|athletic|wanderers|county|albion|hotspur|argyle|alexandra|stanley|north end)$/;
const EXTENDED = /\bextended\b/i;
const plain = (s) => ` ${norm(s).replace(/[^a-z0-9]+/g, ' ').trim()} `;

const variantCache = new Map();
function variants(team) {
  if (variantCache.has(team)) return variantCache.get(team);
  const out = new Set();
  const add = (s) => {
    const p = plain(s).trim();
    if (p.length >= 3) out.add(p);
  };
  const base = plain(team).trim().replace(/^afc /, '').replace(/ afc$/, '');
  add(team);
  add(base);
  add(base.replace(SUFFIX, ''));
  for (const [alias, espn] of Object.entries(ALIASES)) if (espn === team) add(alias);
  for (const alias of NAMES[team] || []) add(alias);
  const list = [...out].sort((a, b) => b.length - a.length);
  variantCache.set(team, list);
  return list;
}

// Var i titeln (plain) laget står, med det längsta namnet: [början, slut]
// eller null. Spannet skip är redan taget av det andra laget.
function locate(t, team, skip) {
  for (const v of variants(team)) {
    for (let i = t.indexOf(` ${v} `); i >= 0; i = t.indexOf(` ${v} `, i + 1)) {
      const span = [i + 1, i + 1 + v.length];
      if (!skip || span[1] <= skip[0] || span[0] >= skip[1]) return span;
    }
  }
  return null;
}
const len = (span) => (span ? span[1] - span[0] : 0);

// Resultatet i titeln, om det finns, ska vara matchens.
function scoreFits(title, m) {
  const x = String(title).match(/(?:^|\D)(\d{1,2}) ?[-–] ?(\d{1,2})(?!\d)/);
  if (!x) return true;
  const a = Number(x[1]);
  const b = Number(x[2]);
  return [m.score, m.score90].filter(Boolean)
    .some((s) => (s.home === a && s.away === b) || (s.home === b && s.away === a));
}

// Hur väl titeln passar matchen (antal tecken som stämmer), 0 = inte alls.
// club = kanalens klubb, eller null för en sändare.
function fit(title, m, club) {
  if (!scoreFits(title, m)) return 0;
  const t = plain(title);
  if (club) {
    const opp = locate(t, club === m.home ? m.away : m.home, null);
    return opp ? len(opp) + len(locate(t, club, opp)) : 0;
  }
  let best = 0;
  for (const [a, b] of [[m.home, m.away], [m.away, m.home]]) {
    const sa = locate(t, a, null);
    const sb = sa && locate(t, b, sa);
    if (sb) best = Math.max(best, len(sa) + len(sb));
  }
  return best;
}

const ORDER = new Map(CHANNELS.map((c, i) => [c.key, c.order != null ? c.order : i]));
const NAME = new Map(CHANNELS.map((c) => [c.key, c.name]));

// I vilken ordning spelaren provar klippen: längre sammandrag först, sedan
// sändarna, hemmalagets kanal och bortalagets.
function rank(v, m) {
  const ch = v.ch in CLUBS ? (v.ch === m.home ? 50 : 60) : (ORDER.get(v.ch) || 0);
  return (EXTENDED.test(v.title) ? 0 : 100) + ch;
}

// Spelade matcher → { byMatch: Map(id → klipp i den ordning de provas),
// videos, matched }. Klipp: { id, ch (kanalens namn), t (titeln) }.
function youtubeByMatch(matches) {
  const cache = readCache(YT_SOURCE_ID);
  const videos = (cache && cache.data && cache.data.videos) || [];
  const played = matches.filter((m) => m.completed && m.score);
  const byTeam = new Map();
  for (const m of played) {
    for (const t of [m.home, m.away]) {
      if (!byTeam.has(t)) byTeam.set(t, []);
      byTeam.get(t).push(m);
    }
  }
  const found = new Map();
  for (const v of videos) {
    const pub = Date.parse(v.pub);
    const club = v.ch in CLUBS ? v.ch : null;
    let best = null;
    let bestFit = 0;
    for (const m of club ? byTeam.get(club) || [] : played) {
      const k = Date.parse(m.kickoff);
      if (pub < k + 95 * MIN || pub > k + 6 * DAY) continue;
      const f = fit(v.title, m, club);
      if (f > bestFit || (f && f === bestFit && k > Date.parse(best.kickoff))) {
        best = m;
        bestFit = f;
      }
    }
    if (!best) continue;
    if (!found.has(best.id)) found.set(best.id, []);
    found.get(best.id).push({ v, r: rank(v, best) });
  }
  const byMatch = new Map();
  for (const [id, list] of found) {
    byMatch.set(id, list
      .sort((a, b) => a.r - b.r || a.v.pub.localeCompare(b.v.pub))
      .slice(0, 4)
      .map(({ v }) => ({ id: v.id, ch: NAME.get(v.ch) || v.ch, t: v.title })));
  }
  return { byMatch, videos: videos.length, matched: byMatch.size };
}

module.exports = { highlightsByMatch, youtubeByMatch, teams, sameTeam, fit, variants, SOURCE_ID, YT_SOURCE_ID };
