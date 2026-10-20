'use strict';

// Matchrutan (app.js öppnar den): flikarna Startelvor och Matchen hämtar sin
// data i webbläsaren när rutan öppnas, som liveställningen i kupongen.
//
// - Startelvor: 365Scores öppna webb-API, ingen nyckel. En trolig elva finns
//   ofta dagen före matchen ("NotConfirmed"), den bekräftade ungefär en timme
//   före avspark ("Confirmed") och efter matchen elvorna med mål, kort och
//   byten. Där står också vilka som saknas (skador, avstängningar) – även i
//   ligorna under Premier League, där sajten annars saknar fri källa. ESPN:s
//   matchid finns inte hos 365Scores, så matchen hittas på tävling, avspark
//   och lagnamn (alla 505 matcher 1/9–8/11 2026 hittades, verifierat
//   2026-10-19). Gräver Grav hämtar sina startelvor på samma sätt.
// - Matchen: ESPN:s matchsammanfattning (samma id som spelprogrammet) –
//   målen, korten, bytena, lagstatistiken och publiken. Uppdateras varje
//   minut medan matchen pågår och rutan är öppen.
//
// Båda svarar med Access-Control-Allow-Origin: * (verifierat 2026-10-19).
// Inget här styr prognoserna.

(function () {
  const S365 = 'https://webws.365scores.com/web';
  const P365 = 'appTypeId=5&langId=1&timezoneName=UTC&userCountryId=1';
  // Tävlingarna hos 365Scores (verifierat 2026-10-19).
  const COMP365 = { pl: 7, ch: 1, l1: 2, l2: 3, fac: 8, lc: 9 };
  const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
  const LIVE_MS = 60000;
  const FRESH_MS = 120000;
  const TZ = 'Europe/Stockholm';
  const fClock = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // matchid → senaste svaret { at, data } eller { at, error }
  const games = new Map(); // matchid → Promise med 365Scores-id (eller null)
  const lineups = new Map();
  const summaries = new Map();
  let current = null; // { root, m, espn }
  let timer = null;

  // ---------- 365Scores: hitta matchen ----------

  const ALIAS = { 'milton keynes dons': 'mk dons' };
  function norm(s) {
    const n = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/&/g, ' and ').replace(/\b(a ?f ?c|f ?c)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
    return ALIAS[n] || n;
  }
  function sim(a, b) {
    a = norm(a);
    b = norm(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.startsWith(`${b} `) || b.startsWith(`${a} `)) return 0.8;
    const A = new Set(a.split(' '));
    const B = new Set(b.split(' '));
    let n = 0;
    for (const x of A) if (B.has(x)) n++;
    return n / Math.max(A.size, B.size);
  }
  const teamSim = (name, c) => Math.max(sim(name, c.name), sim(name, c.longName));

  const pad = (n) => String(n).padStart(2, '0');
  const dmy = (t) => { const d = new Date(t); return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; };

  // Samma tävling, avspark inom tre timmar och bäst överensstämmande lagnamn;
  // minst ett av lagen måste stämma helt.
  function findGame(m) {
    if (!games.has(m.id)) {
      const c = COMP365[m.comp];
      const t = Date.parse(m.kickoff);
      const p = !c ? Promise.resolve(null) : getJSON(`${S365}/games/?${P365}&competitions=${c}&startDate=${dmy(t - 86400000)}&endDate=${dmy(t + 86400000)}`)
        .then((d) => {
          let best = null;
          let bs = 0;
          for (const g of d.games || []) {
            if (g.competitionId !== c || Math.abs(Date.parse(g.startTime) - t) > 3 * 3600000) continue;
            const s = teamSim(m.home, g.homeCompetitor || {}) + teamSim(m.away, g.awayCompetitor || {});
            if (s > bs) { bs = s; best = g; }
          }
          return best && bs >= 1 ? best.id : null;
        });
      p.catch(() => games.delete(m.id));
      games.set(m.id, p);
    }
    return games.get(m.id);
  }

  async function loadLineups(m, force) {
    const have = lineups.get(m.id);
    if (have && !have.error && !force && Date.now() - have.at < FRESH_MS) return have;
    let r;
    try {
      const id = await findGame(m);
      if (id == null) r = { at: Date.now(), none: true };
      else r = { at: Date.now(), data: parseGame((await getJSON(`${S365}/game/?${P365}&gameId=${id}`)).game || {}) };
    } catch (err) {
      r = have && have.data ? have : { at: Date.now(), error: err.message };
    }
    lineups.set(m.id, r);
    return r;
  }

  // ---------- 365Scores: läsa matchen ----------

  // Skadan på svenska; okänd text blir "skada" (den engelska syns i title).
  const INJURY = [
    [/cruciate/i, 'korsband'], [/hamstring/i, 'baksida lår'], [/achilles/i, 'hälsena'],
    [/knee/i, 'knä'], [/ankle/i, 'fotled'], [/calf/i, 'vad'], [/groin|adductor/i, 'ljumske'],
    [/thigh|quad/i, 'lår'], [/back/i, 'rygg'], [/hip/i, 'höft'], [/foot|toe|heel/i, 'fot'],
    [/shoulder/i, 'axel'], [/head|concussion/i, 'huvud'], [/rib|chest/i, 'bröstkorg'],
    [/wrist|hand|arm|elbow|finger/i, 'arm'], [/abdominal|stomach/i, 'mage'], [/muscle/i, 'muskel'],
    [/knock/i, 'smäll'], [/discomfort/i, 'känningar'], [/ill|virus|flu/i, 'sjuk'],
    [/personal/i, 'personliga skäl'],
  ];
  const MONTH = {
    january: 'januari', february: 'februari', march: 'mars', april: 'april', may: 'maj', june: 'juni',
    july: 'juli', august: 'augusti', september: 'september', october: 'oktober', november: 'november', december: 'december',
  };
  const PART = { early: 'början av', mid: 'mitten av', late: 'slutet av' };

  function why(x) {
    if (x.suspension) {
      const n = String(x.suspension.name || '');
      return /red/i.test(n) ? 'avstängd, rött kort' : /yellow/i.test(n) ? 'avstängd, gula kort' : 'avstängd';
    }
    const r = (x.injury && x.injury.reason) || '';
    const hit = INJURY.find(([re]) => re.test(r));
    return hit ? hit[1] : 'skada';
  }
  function back(s) {
    if (!s) return null;
    const m = /^(early|mid|late)\s+([a-z]+)\s+(\d{4})$/i.exec(s.trim());
    if (m && MONTH[m[2].toLowerCase()]) {
      const y = Number(m[3]) !== new Date().getFullYear() ? ` ${m[3]}` : '';
      return `tillbaka ${PART[m[1].toLowerCase()]} ${MONTH[m[2].toLowerCase()]}${y}`;
    }
    if (/back in training/i.test(s)) return 'tillbaka i träning';
    if (/season/i.test(s)) return 'resten av säsongen';
    return null;
  }

  // Kort namn på planen: 365Scores egna ("Van De Ven", "S. Neave" → "Neave").
  function shortName(p) {
    const s = String(p.shortName || '').replace(/^\p{Lu}\.\s*/u, '').trim();
    if (s) return s;
    const parts = String(p.name || '').trim().split(/\s+/);
    return parts[parts.length - 1] || '';
  }

  function parseGame(g) {
    const people = new Map((g.members || []).map((p) => [p.id, p]));
    const ev = new Map();
    const at = (id) => { if (!ev.has(id)) ev.set(id, { goals: 0, own: 0, yc: 0, rc: 0, off: null, on: null }); return ev.get(id); };
    for (const e of g.events || []) {
      const t = e.eventType || {};
      if (e.playerId == null) continue;
      if (t.id === 1) {
        if (/own/i.test(t.subTypeName || '')) at(e.playerId).own++;
        else at(e.playerId).goals++;
      } else if (t.id === 2) at(e.playerId).yc++;
      else if (t.id === 3) at(e.playerId).rc++;
    }
    const side = (c) => {
      const lu = (c && c.lineups) || null;
      const ms = (lu && lu.members) || [];
      const who = (x) => {
        const p = people.get(x.id) || {};
        const y = x.yardFormation || {};
        return {
          id: x.id,
          name: p.name || '',
          short: shortName(p),
          nr: p.jerseyNumber > 0 ? p.jerseyNumber : null,
          line: y.fieldLine,
          side: y.fieldSide,
          pos: (x.position && x.position.name) || '',
          ev: ev.get(x.id) || null,
        };
      };
      // Bytena står på avbytaren: vem hen ersatte och när.
      for (const x of ms) {
        if (x.status !== 2 || !x.substitution) continue;
        at(x.id).on = x.substitution.time;
        if (x.substitution.playerId != null) at(x.substitution.playerId).off = x.substitution.time;
      }
      const starters = ms.filter((x) => x.status === 1).map(who);
      const coach = ms.filter((x) => x.status === 4).map((x) => (people.get(x.id) || {}).name).find(Boolean) || null;
      return {
        status: lu ? String(lu.status || '') : '',
        formation: (lu && lu.formation) || null,
        starters,
        placed: starters.length === 11 && starters.every((p) => Number.isFinite(p.line) && Number.isFinite(p.side)),
        bench: ms.filter((x) => x.status === 2).map(who),
        coach,
        out: ms.filter((x) => x.status === 3 || x.status === 5).map((x) => ({
          name: (people.get(x.id) || {}).name || '',
          doubtful: x.status === 5,
          why: why(x),
          back: back(x.injury && x.injury.expectedReturn),
          raw: [x.injury && x.injury.reason, x.injury && x.injury.expectedReturn, x.suspension && x.suspension.name].filter(Boolean).join(' · '),
        })).filter((x) => x.name),
      };
    };
    // ev fylls av bytena i side(), så lagen läses först och händelserna sätts sedan.
    const home = side(g.homeCompetitor);
    const away = side(g.awayCompetitor);
    for (const t of [home, away]) for (const p of [...t.starters, ...t.bench]) p.ev = ev.get(p.id) || null;
    return { home, away, state: g.statusGroup, played: g.statusGroup === 4 || g.statusGroup === 3 };
  }

  // ---------- Startelvor ----------

  // Tävlingar där 365Scores har en trolig elva före den bekräftade: 2026-10-19
  // för 14 av 23 PL- och CH-matcher upp till fem dagar fram, ingen av 61 i L1,
  // L2 och EFL-cupen.
  const PROBABLE = new Set(['pl', 'ch']);

  const POS_SV = { Goalkeeper: 'målvakt', Defender: 'back', Midfielder: 'mittfältare', Attacker: 'anfallare' };

  function badges(e) {
    if (!e) return '';
    let h = '';
    for (let i = 0; i < e.goals; i++) h += '<i class="mr-b goal" title="Mål"></i>';
    for (let i = 0; i < e.own; i++) h += '<i class="mr-b goal own" title="Självmål"></i>';
    if (e.rc) h += `<i class="mr-b rc" title="${e.yc ? 'Andra gula kortet' : 'Rött kort'}"></i>`;
    else if (e.yc) h += '<i class="mr-b yc" title="Gult kort"></i>';
    return h ? `<span class="mr-badges">${h}</span>` : '';
  }

  function spots(t, cls) {
    return t.starters.map((p) => {
      const off = p.ev && p.ev.off != null ? `<span class="mr-off" title="Utbytt">${p.ev.off}′</span>` : '';
      return `<div class="mr-pl ${cls}" style="--l:${p.line};--s:${p.side}" title="${esc(p.name)}${POS_SV[p.pos] ? `, ${POS_SV[p.pos]}` : ''}">` +
        `<span class="mr-dot">${p.nr == null ? '' : p.nr}${badges(p.ev)}</span>` +
        `<span class="mr-nm">${esc(p.short)}${off}</span></div>`;
    }).join('');
  }

  // Planen ritas liggande på breda skärmar och stående på mobilen; markeringarna
  // har bara sin linje (--l, 0 = egna målet, 100 = längst fram) och sida
  // (--s, 0 = lagets vänsterkant) och placeras i stilmallen.
  const LINES_WIDE = '<svg class="mr-lines wide" viewBox="0 0 105 68" preserveAspectRatio="none" aria-hidden="true">' +
    '<rect x="0.5" y="0.5" width="104" height="67" rx="1"/><path d="M52.5 0.5v67"/><circle cx="52.5" cy="34" r="9.15"/>' +
    '<path d="M0.5 13.84h16.5v40.32H0.5M0.5 24.84h5.5v18.32H0.5M104.5 13.84H88v40.32h16.5M104.5 24.84H99v18.32h5.5"/></svg>';
  const LINES_TALL = '<svg class="mr-lines tall" viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true">' +
    '<rect x="0.5" y="0.5" width="67" height="104" rx="1"/><path d="M0.5 52.5h67"/><circle cx="34" cy="52.5" r="9.15"/>' +
    '<path d="M13.84 0.5v16.5h40.32V0.5M24.84 0.5v5.5h18.32V0.5M13.84 104.5V88h40.32v16.5M24.84 104.5V99h18.32v5.5"/></svg>';

  function playerList(list, played) {
    return '<ul class="mr-names">' + list.map((p) => {
      const on = played && p.ev && p.ev.on != null ? ` <span class="mr-on" title="Inbytt">${p.ev.on}′</span>` : '';
      return `<li><span class="mr-nr">${p.nr == null ? '' : p.nr}</span>${esc(p.name)}${on}${badges(p.ev)}</li>`;
    }).join('') + '</ul>';
  }

  function outList(t) {
    const row = (x) => `<li${x.raw ? ` title="${esc(x.raw)}"` : ''}>${esc(x.name)} <span class="muted">${esc([x.why, x.back].filter(Boolean).join(' · '))}</span></li>`;
    const gone = t.out.filter((x) => !x.doubtful);
    const unsure = t.out.filter((x) => x.doubtful);
    let h = '';
    if (gone.length) h += `<h5>Saknas</h5><ul class="mr-out">${gone.map(row).join('')}</ul>`;
    if (unsure.length) h += `<h5>Osäkra</h5><ul class="mr-out">${unsure.map(row).join('')}</ul>`;
    return h;
  }

  function teamBlock(name, t, played, cls) {
    let h = `<div class="mr-team ${cls}"><h4><i class="mr-key"></i>${esc(name)}${t.formation ? ` <span class="hint">${esc(t.formation)}</span>` : ''}</h4>`;
    if (t.coach) h += `<p class="mr-coach"><span class="muted">Tränare</span> ${esc(t.coach)}</p>`;
    if (t.starters.length && !t.placedBoth) h += `<h5>Startelva</h5>${playerList(t.starters, played)}`;
    if (t.bench.length) h += `<h5>Avbytare</h5>${playerList(t.bench, played)}`;
    h += outList(t);
    if (!t.starters.length && !t.bench.length && !t.out.length) h += '<p class="muted">Inget från 365Scores än.</p>';
    return h + '</div>';
  }

  function renderLineups(m, r) {
    if (!r) return '<p class="mr-wait">Hämtar startelvorna …</p>';
    if (r.error) return `<p class="unknown">Kunde inte hämta startelvorna från 365Scores just nu (${esc(r.error)}).</p>`;
    if (r.none) return '<p class="unknown">Hittade inte matchen hos 365Scores.</p>';
    const L = r.data;
    const { home, away } = L;
    const both = home.placed && away.placed;
    home.placedBoth = both;
    away.placedBoth = both;
    const confirmed = (t) => /^confirmed$/i.test(t.status);
    const any = home.starters.length || away.starters.length;
    // När elvorna brukar komma står i chipets tooltip.
    let chip = '';
    if (!any) {
      chip = `<span class="mr-chip none" title="${PROBABLE.has(m.comp)
        ? 'Trolig elva några dagar före, bekräftad ungefär en timme före avspark'
        : 'Bekräftad ungefär en timme före avspark'}">Ingen startelva än</span>`;
    }
    else if (L.played || m.completed) chip = '';
    else if (confirmed(home) && confirmed(away)) chip = '<span class="mr-chip ok">Bekräftad startelva</span>';
    else chip = '<span class="mr-chip prob" title="Bedömd av 365Scores · bekräftad ungefär en timme före avspark">Trolig startelva</span>';
    let h = `<div class="mr-lu-head">${chip}<span class="mr-src">365Scores, hämtat ${esc(fClock.format(new Date(r.at)))}</span></div>`;
    if (both) {
      // Lagens rader står ovanför planen på breda skärmar och vid var sin
      // planhalva på mobilen (bortalaget överst).
      const leg = (name, t, cls) => `<div class="mr-leg ${cls}"><i class="mr-key"></i><span class="n">${esc(name)}</span>` +
        `${t.formation ? `<b>${esc(t.formation)}</b>` : ''}</div>`;
      h += `<div class="mr-pitch-wrap">${leg(m.home, home, 'h')}${leg(m.away, away, 'a')}` +
        `<div class="mr-pitch">${LINES_WIDE}${LINES_TALL}${spots(home, 'h')}${spots(away, 'a')}</div></div>`;
    }
    const played = L.played || m.completed;
    const some = (t) => t.starters.length || t.bench.length || t.out.length || t.coach;
    if (some(home) || some(away)) h += `<div class="mr-teams">${teamBlock(m.home, home, played, 'h')}${teamBlock(m.away, away, played, 'a')}</div>`;
    return h;
  }

  // ---------- Matchen (ESPN) ----------

  async function loadSummary(m, espn, force) {
    const have = summaries.get(m.id);
    if (have && !have.error && !force && (have.done || Date.now() - have.at < LIVE_MS / 2)) return have;
    let r;
    try {
      const d = await getJSON(`${ESPN}/${encodeURIComponent(espn)}/summary?event=${encodeURIComponent(m.id)}`);
      const st = (((d.header || {}).competitions || [])[0] || {}).status || {};
      r = { at: Date.now(), data: d, done: Boolean(st.type && st.type.completed) };
    } catch (err) {
      r = have && have.data ? have : { at: Date.now(), error: err.message };
    }
    summaries.set(m.id, r);
    return r;
  }

  const STATS = [
    ['possessionPct', 'Bollinnehav', (v) => `${Math.round(v)} %`],
    ['totalShots', 'Skott'],
    ['shotsOnTarget', 'Skott på mål'],
    ['wonCorners', 'Hörnor'],
    ['saves', 'Räddningar'],
    ['totalPasses', 'Passningar'],
    ['passPct', 'Lyckade passningar', (v) => `${Math.round(v * 100)} %`],
    ['foulsCommitted', 'Regelbrott'],
    ['offsides', 'Offside'],
    ['yellowCards', 'Gula kort'],
    ['redCards', 'Röda kort'],
  ];

  function statsBlock(box, homeId) {
    const teams = (box && box.teams) || [];
    const h = teams.find((t) => String(t.team && t.team.id) === homeId);
    const a = teams.find((t) => t !== h);
    if (!h || !a) return '';
    const val = (t, k) => {
      const s = (t.statistics || []).find((x) => x.name === k);
      const v = s ? Number(s.displayValue) : NaN;
      return Number.isFinite(v) ? v : null;
    };
    // ESPN avrundar passningsandelen till en decimal (0,9) – räknas här ur antalen.
    const get = (t, k) => (k === 'passPct'
      ? (val(t, 'totalPasses') ? val(t, 'accuratePasses') / val(t, 'totalPasses') : null)
      : val(t, k));
    const rows = STATS.map(([k, label, f]) => {
      const x = get(h, k);
      const y = get(a, k);
      if (x == null || y == null) return '';
      const fmt = f || ((v) => String(v));
      const sum = k === 'passPct' ? 0 : x + y;
      const w = sum > 0 ? (x / sum) * 100 : 50;
      const lead = x > y ? ' h' : y > x ? ' a' : '';
      return `<div class="mr-stat${lead}"><b>${fmt(x)}</b><span>${label}</span><b>${fmt(y)}</b>` +
        (k === 'passPct' ? '' : `<div class="mr-bar"><i style="width:${w.toFixed(1)}%"></i><i style="width:${(100 - w).toFixed(1)}%"></i></div>`) + '</div>';
    }).join('');
    return rows ? `<div class="card mr-stats"><h4>Statistik</h4>${rows}</div>` : '';
  }

  // Händelserna som en tidslinje: hemmalaget till vänster, bortalaget till
  // höger och minuten i mitten. Ställningen räknas fram mål för mål.
  function eventsBlock(d, homeId) {
    const evs = (d.keyEvents || []).filter((e) => {
      const t = (e.type && e.type.type) || '';
      return e.scoringPlay || /yellow-card|red-card|substitution|^halftime$/.test(t);
    });
    if (!evs.some((e) => e.team)) return '<div class="card"><h4>Händelser</h4><p class="muted">Inga händelser från ESPN.</p></div>';
    let gh = 0;
    let ga = 0;
    const rows = evs.map((e) => {
      const t = (e.type && e.type.type) || '';
      const min = esc((e.clock && e.clock.displayValue) || '');
      if (t === 'halftime') return `<div class="mr-ev mr-ht"><span>Halvtid ${gh}–${ga}</span></div>`;
      const home = String(e.team && e.team.id) === homeId;
      const ps = (e.participants || []).map((p) => (p.athlete && p.athlete.displayName) || '').filter(Boolean);
      let ic;
      let body;
      if (e.scoringPlay) {
        if (home) gh++; else ga++;
        const own = /own-goal/.test(t);
        const pen = /penalty/.test(t);
        ic = `<i class="mr-b goal${own ? ' own' : ''}"></i>`;
        const extra = own ? 'självmål' : pen ? 'straff' : ps[1] ? `assist ${esc(ps[1])}` : '';
        body = `<b>${esc(ps[0] || 'Mål')}</b> <span class="mr-score">${gh}–${ga}</span>${extra ? `<span class="sub">${extra}</span>` : ''}`;
      } else if (/card/.test(t)) {
        const second = /second yellow/i.test(e.text || '');
        ic = `<i class="mr-b ${/red/.test(t) ? 'rc' : 'yc'}"></i>`;
        body = `<b>${esc(ps[0] || '')}</b>${second ? '<span class="sub">andra gula</span>' : ''}`;
      } else {
        ic = '<i class="mr-b sub"></i>';
        body = `<span class="mr-in">${esc(ps[0] || '')}</span><span class="sub">ut ${esc(ps[1] || '')}</span>`;
      }
      const cell = `<div class="mr-evx">${ic}<div>${body}</div></div>`;
      return `<div class="mr-ev${/substitution/.test(t) ? ' subst' : ''}">${home ? cell : '<div></div>'}<span class="mr-min">${min}</span>${home ? '<div></div>' : cell}</div>`;
    }).join('');
    return `<div class="card mr-events"><h4>Händelser</h4>${rows}</div>`;
  }

  function renderEvents(m, r) {
    if (!r) return '<p class="mr-wait">Hämtar matchen …</p>';
    if (r.error) return `<p class="unknown">Kunde inte hämta matchen från ESPN just nu (${esc(r.error)}).</p>`;
    const d = r.data;
    const comp = ((d.header || {}).competitions || [])[0] || {};
    const st = (comp.status || {}).type || {};
    const hc = (comp.competitors || []).find((c) => c.homeAway === 'home') || {};
    const ac = (comp.competitors || []).find((c) => c.homeAway === 'away') || {};
    const homeId = String((hc.team || {}).id || hc.id || '');
    let h = '';
    if (st.state === 'pre') return '<p class="muted">Matchen har inte börjat än.</p>';
    if (st.state === 'in') {
      h += `<p class="mr-live"><i></i>Pågår · ${esc(st.shortDetail || st.detail || '')} · <b>${esc(hc.score)}–${esc(ac.score)}</b>` +
        ` <span class="muted">uppdateras varje minut</span></p>`;
    } else if (!m.score && hc.score != null) {
      h += `<p class="mr-live done">Slut · <b>${esc(hc.score)}–${esc(ac.score)}</b></p>`;
    }
    h += eventsBlock(d, homeId);
    h += statsBlock(d.boxscore, homeId);
    const gi = d.gameInfo || {};
    if (gi.attendance) h += `<p class="mr-facts">Publik <b>${Number(gi.attendance).toLocaleString('sv-SE')}</b></p>`;
    h += `<p class="src-line">ESPN, hämtat ${esc(fClock.format(new Date(r.at)))}.</p>`;
    return h;
  }

  // ---------- rutan ----------

  function fill(kind) {
    if (!current) return;
    const { root, m } = current;
    if (kind === 'lineups') {
      const el = root.querySelector('[data-mr-lineups]');
      if (el && el.dataset.mrLineups === m.id) el.innerHTML = renderLineups(m, lineups.get(m.id));
    } else {
      const el = root.querySelector('[data-mr-events]');
      if (el && el.dataset.mrEvents === m.id) el.innerHTML = renderEvents(m, summaries.get(m.id));
    }
  }

  function live() {
    const r = current && summaries.get(current.m.id);
    const st = r && r.data && ((((r.data.header || {}).competitions || [])[0] || {}).status || {}).type;
    return Boolean(st && st.state === 'in');
  }

  async function refresh(force) {
    const c = current;
    if (!c) return;
    const jobs = [];
    if (c.root.querySelector('[data-mr-lineups]')) jobs.push(loadLineups(c.m, force).then(() => { if (current === c) fill('lineups'); }));
    if (c.espn && c.root.querySelector('[data-mr-events]')) jobs.push(loadSummary(c.m, c.espn, force).then(() => { if (current === c) fill('events'); }));
    await Promise.all(jobs);
    clearTimeout(timer);
    if (current === c && live()) timer = setTimeout(() => refresh(true), LIVE_MS);
  }

  // app.js ritar platshållarna och lämnar sedan över rutan.
  window.Matchruta = {
    lineupPane: (m) => `<div class="mr-lineups" data-mr-lineups="${esc(m.id)}"><p class="mr-wait">Hämtar startelvorna …</p></div>`,
    eventsPane: (m) => `<div class="mr-matchen" data-mr-events="${esc(m.id)}"><p class="mr-wait">Hämtar matchen …</p></div>`,
    hydrate(root, d, espn) {
      const same = current && current.m.id === d.match.id;
      current = { root, m: d.match, espn };
      fill('lineups');
      fill('events');
      if (!same || !timer) refresh(false);
    },
    stop() {
      clearTimeout(timer);
      timer = null;
      current = null;
    },
  };
}());
