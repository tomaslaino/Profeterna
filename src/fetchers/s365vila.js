'use strict';

// Spelarnas vila före en match (sedan 2026-11-16, användarens önskemål om
// datorns LÄGET: "någon form av genomsnitt för hur många dagar spelarna i
// respektive lag har fått vila inför denna match – jag tänker då också
// klubblag", för den förmodade startelvan och hela truppen). Lagets VILAN
// räknar bara lagets egna matcher: inför en landskamp har spelarna spelat för
// sina klubbar under tiden, och en klubbs spelare kan ha spelat för
// landslaget. Här räknas varje spelares egen senaste match, i alla
// tävlingar, ur 365Scores öppna webb-API (samma källa som betygen och
// trupperna, ingen nyckel). Verifierat 2026-11-16:
//
//   /web/athletes/?athletes={id,…}&fullDetails=true
//       varje spelares fem senaste matcher (lastMatches) i alla tävlingar –
//       ligan, cuperna, Europa och landslaget – med played och speltiden
//       (athleteStats typ 229). En hel trupp i ett anrop: ~100 kB packat,
//       under en sekund (Italiens 31 spelare).
//   /web/games/fixtures/?competitions={id}
//       tävlingens kommande matcher, för att hitta matchens id hos 365Scores
//   /web/game/?gameId={id}
//       matchens elvor: lineups.status Confirmed (uttagen strax före
//       avspark) eller NotConfirmed (365Scores troliga elva, "Probable
//       Lineups", ibland flera dagar före); members med status 1 = från
//       start, 3 = saknas, 5 = tveksam
//
// Elvan, i den här ordningen:
//   uttagen   365Scores elva när den är bekräftad
//   trolig    365Scores troliga elva
//   beräknad  sajtens beräknade startelva (src/startelvor.js, samma som
//             matchrutans flik Startelvor) utan dem som saknas – ligalagen
//   förra     elvan i lagets förra match (landslagen före 365Scores elva)
// Truppen är 365Scores trupp (s365_squads_<liga>; för landslagen den
// uttagna truppen) utom den som inte har spelat på en månad: långtidsskadade
// och de som aldrig spelar.
//
// En spelares vila är dagarna mellan hans senaste match där han spelade
// (inhopp också) och matchdagen, som lagets VILAN (torsdag → söndag = 3). I
// snittet räknas mer än två veckor som två veckor, som mätaren i datorn: den
// som kommer tillbaka efter en skada ska inte dra upp hela elvans snitt.
//
// Under ett landslagsuppehåll räknas en klubbspelare från landskampen han
// väntas spela före klubbmatchen (steg 4b nedan). Har laget en annan
// klubbmatch före den här (en match i veckan före helgens) räknas inget
// förrän den är spelad: spelarnas vila hänger då på den. En spelad match
// står kvar som den var vid avspark.

const { getJson, mapLimit } = require('./http');
const { teamSim } = require('./s365ratings');
const Elva = require('../../public/elva.js');

const WEB = 'https://webws.365scores.com';
const PARAMS = 'appTypeId=5&langId=1&timezoneName=UTC&userCountryId=1';
const HOUR = 3600000;
const DAY = 24 * HOUR;
// matcher så här många dagar fram räknas; spelade sparas så här länge
const WINDOW_DAYS = 7;
const KEEP_DAYS = 30;
// en trupps senaste matcher hämtas om efter så här lång tid
const TEAM_TTL = 12 * HOUR;
// tävlingens kommande matcher (för att hitta matchens id) högst så här ofta
const LIST_TTL = 6 * HOUR;
// truppen: den som har spelat de senaste ACTIVE_DAYS dagarna
const ACTIVE_DAYS = 30;
// i snittet räknas längre vila som MAX_DAYS
const MAX_DAYS = 14;
const KICKOFF_SLACK = 3 * HOUR;
const PER_CALL = 45;
const CONCURRENCY = 3;
const MINUTES = 229;

// Landskamperna under ett uppehåll: listan hämtas om efter NAT_TTL, med
// NAT_PER_CALL landslag per anrop; "under uppehållet" = de senaste
// UPPEHALL_DAYS dagarna.
const NAT_TTL = 3 * HOUR;
const NAT_PER_CALL = 50;
const UPPEHALL_DAYS = 10;
const INTL = new Set(['unl', 'vsk', 'emk']);

// Tävlingarna hos 365Scores (som i public/matchruta.js).
const COMP365 = { pl: 7, ch: 1, l1: 2, l2: 3, fac: 8, lc: 9, unl: 7016, vsk: 570 };

// En matchs elva hämtas oftare ju närmare avspark: den troliga ändras, och
// den uttagna kommer ungefär en timme före.
const gameTtl = (left) => (left > 2 * DAY ? 6 * HOUR : left > 6 * HOUR ? 2 * HOUR : 0.4 * HOUR);
const dateDays = (a, b) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / DAY);
const r1 = (x) => Math.round(x * 10) / 10;

// events: alla kommande matcher i spelprogrammen [{ id, comp, kickoff,
// home: { espnId, name }, away }] (även Europacuperna, för att se om laget
// har en match före); squads: Map ESPN-lag-id → { c, a } ur s365_squads_*;
// planFor(id) → den beräknade startelvans plan (src/startelvor.js elvaFor)
// eller null; previous: förra hämtningens data.
async function fetchVila({ events, squads, planFor, previous, now = Date.now() }) {
  const old = previous || {};
  const teams = { ...(old.teams || {}) };
  const games = { ...(old.games || {}) };
  const ids = { ...(old.ids || {}) };
  const lists = { ...(old.lists || {}) };
  const matches = {};
  for (const [id, m] of Object.entries(old.matches || {})) {
    const t = Date.parse(m.k);
    if (t <= now && t > now - KEEP_DAYS * DAY) matches[id] = m;
  }

  const todo = events.filter((e) => {
    const t = Date.parse(e.kickoff);
    return COMP365[e.comp] && t > now && t <= now + WINDOW_DAYS * DAY && (squads.has(e.home.espnId) || squads.has(e.away.espnId));
  });
  // har laget en annan match före den här?
  const earlier = (tid, e) => events.some((x) => x.id !== e.id && (x.home.espnId === tid || x.away.espnId === tid)
    && Date.parse(x.kickoff) > now - KICKOFF_SLACK && Date.parse(x.kickoff) < Date.parse(e.kickoff) - HOUR);
  let calls = 0;
  const get = (url) => { calls++; return getJson(url); };

  // 1. Matchens id hos 365Scores, ur tävlingens kommande matcher.
  const utan = todo.filter((e) => !ids[e.id]);
  for (const comp of [...new Set(utan.map((e) => e.comp))]) {
    if (lists[comp] && now - lists[comp] < LIST_TTL) continue;
    lists[comp] = now;
    let list = [];
    try {
      list = (await get(`${WEB}/web/games/fixtures/?${PARAMS}&competitions=${COMP365[comp]}`)).games || [];
    } catch (err) {
      console.error(`[s365_vila] ${comp}: ${err.message || err}`);
    }
    const taken = new Set(Object.values(ids));
    for (const e of utan.filter((x) => x.comp === comp)) {
      const g = findGame(e, list, taken);
      if (g) { ids[e.id] = g.id; taken.add(g.id); }
    }
  }

  // 2. Elvorna i matcherna (de som saknas med), oftare nära avspark.
  const parseGame = (g) => {
    const people = new Map((g.members || []).map((p) => [p.id, p]));
    const aid = (x) => (people.get(x.id) || {}).athleteId || null;
    const s = {};
    for (const c of [g.homeCompetitor, g.awayCompetitor]) {
      if (!c) continue;
      const lu = c.lineups || {};
      const ms = lu.members || [];
      s[c.id] = {
        st: String(lu.status || ''),
        xi: ms.filter((x) => x.status === 1).map(aid).filter(Boolean),
        out: ms.filter((x) => x.status === 3).map(aid).filter(Boolean),
      };
    }
    return { at: now, k: g.startTime || null, ended: g.statusGroup === 4, s };
  };
  const gameJobs = todo.filter((e) => {
    const gid = ids[e.id];
    if (!gid) return false;
    const have = games[gid];
    return !have || now - have.at > gameTtl(Date.parse(e.kickoff) - now);
  }).map((e) => ids[e.id]);
  await mapLimit(gameJobs, CONCURRENCY, async (gid) => {
    try {
      const j = await get(`${WEB}/web/game/?${PARAMS}&gameId=${gid}`);
      if (j && j.game) games[gid] = parseGame(j.game);
    } catch (err) {
      console.error(`[s365_vila] match ${gid}: ${err.message || err}`);
    }
  });

  // Elvan för ett lag i en match: { aids, k } eller null.
  const plans = new Map();
  const planOf = (id) => {
    if (!plans.has(id)) {
      let p = null;
      try { p = planFor(id); } catch (err) { console.error(`[s365_vila] startelvan ${id}: ${err.message || err}`); }
      plans.set(id, p);
    }
    return plans.get(id);
  };
  const elvaOf = (e, sideKey, c) => {
    const g = ids[e.id] && games[ids[e.id]];
    const s = g && g.s && g.s[c];
    if (s && s.xi.length >= 11) return { aids: s.xi.slice(0, 11), k: s.st === 'Confirmed' ? 'uttagen' : 'trolig' };
    const ut = new Set((s && s.out) || []);
    const plan = planOf(e.id);
    const p = plan && plan[sideKey];
    if (p) {
      const sjuk = new Set(['skadad', 'avstängd', 'ej uttagbar']);
      const xi = Elva.fill({ slots: p.slots.map(([l, s1, g1]) => ({ l, s: s1, g: g1 })), pool: p.pool },
        (pl) => sjuk.has(pl.x) || (pl.a != null && ut.has(pl.a)));
      if (xi) return { aids: xi.map((x) => x.player.a).filter(Boolean), k: 'beräknad' };
    }
    return null;
  };

  // 3. Trupperna: varje spelares senaste matcher. Elvans spelare hämtas
  // också när de inte står i 365Scores trupp.
  const need = new Map(); // c → Set(athleteId)
  const add = (c, aids) => {
    if (!need.has(c)) need.set(c, new Set());
    for (const a of aids) need.get(c).add(a);
  };
  for (const e of todo) {
    for (const sideKey of ['home', 'away']) {
      const sq = squads.get(e[sideKey].espnId);
      if (!sq || earlier(e[sideKey].espnId, e)) continue;
      add(sq.c, sq.a.map((x) => x[0]));
      const xi = elvaOf(e, sideKey, sq.c);
      if (xi) add(sq.c, xi.aids);
    }
  }
  // (en spelare utan tredje fältet, landslaget, sparades före 2026-11-16 kväll)
  const teamJobs = [...need].filter(([c, set]) => {
    const T = teams[c];
    return !T || now - T.at > TEAM_TTL || [...set].some((a) => !T.ath[a]) || Object.values(T.ath).some((x) => x.length < 3);
  });
  await mapLimit(teamJobs, CONCURRENCY, async ([c, set]) => {
    const all = [...set];
    const ath = {};
    const tgames = new Map();
    try {
      for (let i = 0; i < all.length; i += PER_CALL) {
        const j = await get(`${WEB}/web/athletes/?${PARAMS}&athletes=${all.slice(i, i + PER_CALL).join(',')}&fullDetails=true`);
        for (const a of j.athletes || []) {
          const gs = (a.lastMatches && a.lastMatches.games) || [];
          ath[a.id] = [a.name || '', gs.filter((x) => x.played && x.game && x.game.startTime).map((x) => {
            const min = (x.athleteStats || []).find((y) => y && y.type === MINUTES);
            return [x.game.startTime, min ? Number(min.value) || 0 : null, x.game.competitionId, x.relatedCompetitor || null];
          }), a.nationalTeamId > 0 && a.nationalTeamId !== Number(c) ? a.nationalTeamId : null];
          for (const x of gs) {
            if (x.relatedCompetitor === Number(c) && x.game && x.game.statusGroup === 4) tgames.set(x.game.id, x.game.startTime);
          }
        }
      }
      teams[c] = { at: now, ath, g: [...tgames].sort((a, b) => a[1].localeCompare(b[1])) };
    } catch (err) {
      console.error(`[s365_vila] lag ${c}: ${err.message || err}`);
    }
  });

  // 4. Landslagen (och andra utan beräknad elva) utan 365Scores elva: elvan
  // i lagets förra match. En spelad match ändras inte och hämtas en gång.
  const forra = (e, c) => {
    const T = teams[c];
    const l = T ? T.g.filter(([, t]) => Date.parse(t) < Date.parse(e.kickoff) - HOUR) : [];
    return l.length ? l[l.length - 1][0] : null;
  };
  const forraJobs = new Set();
  for (const e of todo) {
    for (const sideKey of ['home', 'away']) {
      const sq = squads.get(e[sideKey].espnId);
      if (!sq || earlier(e[sideKey].espnId, e) || elvaOf(e, sideKey, sq.c)) continue;
      const gid = forra(e, sq.c);
      if (gid && !(games[gid] && games[gid].ended)) forraJobs.add(gid);
    }
  }
  await mapLimit([...forraJobs], CONCURRENCY, async (gid) => {
    try {
      const j = await get(`${WEB}/web/game/?${PARAMS}&gameId=${gid}`);
      if (j && j.game) games[gid] = parseGame(j.game);
    } catch (err) {
      console.error(`[s365_vila] förra matchen ${gid}: ${err.message || err}`);
    }
  });

  // 4b. Landskamperna under ett uppehåll (sedan 2026-11-16, användaren: "Kan
  // landskamperna under uppehållet räknas in också?"). En klubbspelare som
  // väntas spela för sitt landslag före klubbmatchen räknas från den
  // landskampen, inte från sin förra match. Väntas spela gör han när han står
  // i landslagets elva hos 365Scores (uttagen eller trolig), eller – när
  // landskampen ännu inte har någon elva – när han redan har spelat för
  // landslaget under uppehållet. Landslaget är spelarens nationalTeamId,
  // landskamperna hämtas för alla landslagen i ett par anrop
  // (/web/games/fixtures/?competitors=<id,…>, verifierat 2026-11-16 med 54
  // lag i ett anrop). Bara när det finns landskamper före klubbmatcherna.
  const klubb = todo.filter((e) => !INTL.has(e.comp));
  const sistKlubb = klubb.length ? Math.max(...klubb.map((e) => Date.parse(e.kickoff))) : 0;
  const uppehall = klubb.length > 0 && events.some((x) => INTL.has(x.comp)
    && Date.parse(x.kickoff) > now - KICKOFF_SLACK && Date.parse(x.kickoff) < sistKlubb);
  let nat = null;
  if (uppehall) {
    const natIds = new Set();
    for (const e of klubb) {
      for (const sideKey of ['home', 'away']) {
        const sq = squads.get(e[sideKey].espnId);
        const T = sq && teams[sq.c];
        if (T) for (const x of Object.values(T.ath)) if (x[2]) natIds.add(x[2]);
      }
    }
    const gammal = old.nat && old.nat.g ? old.nat : null;
    if (gammal && now - gammal.at < NAT_TTL && [...natIds].every((id) => gammal.ids.includes(id))) nat = gammal;
    else {
      const lista = new Map();
      let ok = true;
      const allaIds = [...natIds];
      for (let i = 0; i < allaIds.length; i += NAT_PER_CALL) {
        let url = `${WEB}/web/games/fixtures/?${PARAMS}&competitors=${allaIds.slice(i, i + NAT_PER_CALL).join(',')}`;
        try {
          for (let sida = 0; sida < 4 && url; sida++) {
            const j = await get(url);
            const gs = j.games || [];
            for (const g of gs) {
              if (!g.homeCompetitor || !g.awayCompetitor || g.statusGroup === 4) continue;
              lista.set(g.id, [g.id, g.startTime, g.homeCompetitor.id, g.awayCompetitor.id, g.hasLineups ? 1 : 0]);
            }
            const sist = gs.length ? Math.max(...gs.map((g) => Date.parse(g.startTime))) : Infinity;
            url = sist < sistKlubb && j.paging && j.paging.nextPage ? WEB + j.paging.nextPage : null;
          }
        } catch (err) {
          ok = false;
          console.error(`[s365_vila] landskamperna: ${err.message || err}`);
        }
      }
      nat = ok || !gammal ? { at: now, ids: allaIds, g: [...lista.values()] } : gammal;
    }
  }
  const natList = nat ? nat.g.filter(([, st]) => Date.parse(st) > now - KICKOFF_SLACK && Date.parse(st) < sistKlubb) : [];
  const natJobs = natList.filter(([gid, st, , , harElva]) => {
    const have = games[gid];
    return harElva && (!have || now - have.at > gameTtl(Date.parse(st) - now));
  }).map(([gid]) => gid);
  await mapLimit(natJobs, CONCURRENCY, async (gid) => {
    try {
      const j = await get(`${WEB}/web/game/?${PARAMS}&gameId=${gid}`);
      if (j && j.game) games[gid] = parseGame(j.game);
    } catch (err) {
      console.error(`[s365_vila] landskamp ${gid}: ${err.message || err}`);
    }
  });
  // landskampen (avsparken) som spelaren väntas spela sist före klubbmatchen, eller null
  const vantad = (x, aid, e) => {
    const land = x[2];
    if (!land || INTL.has(e.comp)) return null;
    const t1 = Date.parse(e.kickoff) - HOUR;
    const kom = natList.filter(([, st, h, a]) => (h === land || a === land) && Date.parse(st) < t1)
      .sort((p, q) => q[1].localeCompare(p[1]));
    if (!kom.length) return null;
    const spelat = x[1].some(([s, min, , rc]) => rc === land && min !== 0 && Date.parse(s) > now - UPPEHALL_DAYS * DAY);
    for (const [gid, st] of kom) {
      const s = games[gid] && games[gid].s && games[gid].s[land];
      if (s && s.xi.length >= 11 ? s.xi.includes(Number(aid)) : spelat) return st;
    }
    return null;
  };

  // 5. Snitten per lag och match. { d: dagar, l: räknad från en landskamp
  // som inte är spelad än } eller null (inte spelat i de listade matcherna);
  // undefined när spelaren inte är hämtad.
  const vila = (T, aid, e) => {
    const x = T.ath[aid];
    if (!x) return undefined;
    const t = Date.parse(e.kickoff) - HOUR;
    const prev = x[1].filter(([s, min]) => Date.parse(s) < t && min !== 0).map(([s]) => s).sort().pop() || null;
    const ny = vantad(x, aid, e);
    const sist = ny && (!prev || ny > prev) ? ny : prev;
    return sist ? { d: dateDays(sist, e.kickoff), l: sist === ny } : null;
  };
  const snitt = (ds) => r1(ds.reduce((s, d) => s + (d == null ? MAX_DAYS : Math.min(MAX_DAYS, d)), 0) / ds.length);
  let computed = 0;
  for (const e of todo) {
    const out = { k: e.kickoff, at: new Date(now).toISOString() };
    for (const sideKey of ['home', 'away']) {
      const tid = e[sideKey].espnId;
      const sq = squads.get(tid);
      const T = sq && teams[sq.c];
      if (!T || earlier(tid, e)) { out[sideKey] = null; continue; }
      const act = sq.a.map(([aid]) => vila(T, aid, e)).filter((v) => v && v.d <= ACTIVE_DAYS);
      const trupp = act.length >= 5 ? { d: snitt(act.map((v) => v.d)), n: act.length, l: act.filter((v) => v.l).length } : null;
      let xi = elvaOf(e, sideKey, sq.c);
      if (!xi) {
        const gid = forra(e, sq.c);
        const s = gid && games[gid] && games[gid].s && games[gid].s[sq.c];
        const g = ids[e.id] && games[ids[e.id]];
        const ut = new Set((g && g.s && g.s[sq.c] && g.s[sq.c].out) || []);
        if (s && s.xi.length >= 11) xi = { aids: s.xi.filter((a) => !ut.has(a)), k: 'förra' };
      }
      let elva = null;
      if (xi) {
        const p = xi.aids.map((a) => [a, vila(T, a, e)]).filter(([, v]) => v !== undefined);
        if (p.length >= 8) {
          elva = {
            d: snitt(p.map(([, v]) => (v ? v.d : null))), n: p.length, k: xi.k,
            l: p.filter(([, v]) => v && v.l).length,
            // [namn, dagar (null: inte spelat i de listade matcherna), 1 = från en kommande landskamp]
            p: p.map(([a, v]) => [T.ath[a][0], v ? v.d : null, v && v.l ? 1 : 0]),
          };
        }
      }
      out[sideKey] = elva || trupp ? { elva, trupp } : null;
    }
    if (out.home || out.away) { matches[e.id] = out; computed++; }
  }

  // Bara det som behövs nästa gång: lagen och matcherna i fönstret.
  const usedC = new Set(todo.flatMap((e) => [e.home, e.away].map((t) => squads.get(t.espnId)).filter(Boolean).map((sq) => String(sq.c))));
  for (const c of Object.keys(teams)) if (!usedC.has(c) && now - teams[c].at > 3 * DAY) delete teams[c];
  for (const [gid, g] of Object.entries(games)) if (now - g.at > KEEP_DAYS * DAY) delete games[gid];
  const live = new Set(todo.map((e) => e.id));
  for (const id of Object.keys(ids)) if (!live.has(id) && !matches[id]) delete ids[id];

  return {
    matches, teams, games, ids, lists, nat,
    upcoming: todo.length, computed, calls,
    sourceUrl: 'https://www.365scores.com/football',
  };
}

function findGame(e, games, taken) {
  const t = Date.parse(e.kickoff);
  let best = null;
  let bs = 0;
  for (const g of games) {
    if (taken.has(g.id) || Math.abs(Date.parse(g.startTime) - t) > KICKOFF_SLACK) continue;
    const s = teamSim(e.home.name, g.homeCompetitor) + teamSim(e.away.name, g.awayCompetitor);
    if (s > bs) { bs = s; best = g; }
  }
  return best && bs >= 1 ? best : null;
}

module.exports = { fetchVila, COMP365, MAX_DAYS, ACTIVE_DAYS };
