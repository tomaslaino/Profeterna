'use strict';

// ---------- kupongen ----------
//
// Gängets kupong för omgången: utvalda matcher med ett tecken var (1, X, 2
// eller en gardering som 1X). Kupongerna ligger som filer i data/kuponger/ i
// repot och läses av bygget till data/kuponger.json (src/coupons.js). Här
// rättas de mot matches.json och – medan matcherna pågår – mot
// liveställningen från ESPN:s öppna API, som hämtas direkt i webbläsaren varje
// minut. Tecknet gäller ställningen efter 90 minuter, som prognosen.
//
// En ny kupong görs under Kupong → Ny kupong och sparas med en commit på
// GitHub: sidan öppnar GitHub med filen ifylld. Tills bygget publicerat den
// visas den i den här webbläsaren, märkt "väntar på GitHub".
//
// Läses efter app.js och använder dess hjälpare ($, esc, state, getJSON,
// fmt, fTime, fDay, dayKey, cap, compOf).

const KP = {
  data: null, // data/kuponger.json
  live: new Map(), // matchid → { state, name, detail, score }
  liveAt: null,
  liveError: false,
  timer: null,
  wasLive: false,
  view: null, // { mode: 'show', id } | { mode: 'new', edit } | { mode: 'saved', ... }
  draft: null,
  q: '',
  comp: 'all',
  allDays: false, // Ny kupong: alla PICK_DAYS dagar, inte bara närmaste omgången
  flash: null, // en rad överst i kupongvyn nästa gång den ritas (t.ex. "sparad")
};
const SIGNS = ['1', 'X', '2'];
const LIVE_EVERY_MS = 60000;
const PICK_DAYS = 14;
// Så lång får en anteckning om en match vara (samma gräns som src/coupons.js).
const NOTE_MAX = 140;
const KP_DRAFT = 'profeterna.kupong.utkast';
const KP_PENDING = 'profeterna.kupong.osparad';
// ESPN:s ligakoder, om meta.json byggts före kupongen (annars därifrån).
const ESPN_CODE = { pl: 'eng.1', ch: 'eng.2', l1: 'eng.3', l2: 'eng.4', fac: 'eng.fa', lc: 'eng.league_cup' };
// Matcher som inte spelas, i spelprogrammet eller i liveställningen (samma
// som worker/kupong.mjs och src/history.js). De räknas inte på kupongen.
const OFF = /POSTPONED|CANCEL|ABANDON|SUSPEND/;
const offLabel = (s) => (/CANCEL/.test(s) ? 'inställd' : /ABANDON|SUSPEND/.test(s) ? 'avbruten' : 'uppskjuten');

const kpNum = (x) => x.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fDayNum = fmt({ day: 'numeric' });
const fMonth = fmt({ month: 'short' });
const fWeekdayTime = fmt({ weekday: 'short', hour: '2-digit', minute: '2-digit' });

// localStorage kan saknas eller kasta (privat läge) – då finns bara inget utkast.
function kpLoad(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function kpStore(key, v) {
  try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(v)); } catch { /* inget */ }
}

// ---------- data ----------

function whenMatches() {
  if (state.all) return Promise.resolve();
  return new Promise((res) => document.addEventListener('matches-loaded', res, { once: true }));
}

async function loadCoupons() {
  if (KP.data) return KP.data;
  KP.data = await getJSON('data/kuponger.json').catch(() => ({ coupons: [], errors: [], repo: null, branch: 'main', dir: 'data/kuponger' }));
  return KP.data;
}

let kpIndex = { src: null, map: new Map() };
function matchById(id) {
  if (kpIndex.src !== state.all) {
    kpIndex = { src: state.all, map: new Map((state.all ? state.all.matches : []).map((m) => [m.id, m])) };
  }
  return kpIndex.map.get(id) || null;
}

// Kuponger som sparats (eller tagits bort, removed) här men ännu inte
// publicerats av bygget, per id, med versionerna (sha) som de ersätter
// (older: den som ändringen utgick från, den som bygget visade då och de som
// tidigare osparade ersatte). Efter tre dygn antas de aldrig ha committats
// och glöms.
function pendingCoupons() {
  const all = kpLoad(KP_PENDING) || {};
  const keep = {};
  for (const [id, p] of Object.entries(all)) {
    if (p && (p.coupon || p.removed) && Date.now() - new Date(p.savedAt).getTime() < 3 * 86400000) keep[id] = p;
  }
  if (Object.keys(keep).length !== Object.keys(all).length) kpStore(KP_PENDING, keep);
  return keep;
}
function setPending(coupon, base, removed = false) {
  const all = pendingCoupons();
  const pub = KP.data ? KP.data.coupons.find((c) => c.id === coupon.id) : null;
  const older = [...new Set([base, pub && pub.sha, ...((all[coupon.id] && all[coupon.id].older) || [])].filter(Boolean))];
  kpStore(KP_PENDING, { ...all, [coupon.id]: { savedAt: new Date().toISOString(), ...(removed ? { removed: true } : { coupon }), older } });
}
function clearPending(id) {
  const all = pendingCoupons();
  delete all[id];
  kpStore(KP_PENDING, all);
}

const signature = (c) => c.matches.map((x) => `${x.id}:${x.sign}:${x.note || ''}`).sort().join(',');

// Den osparade ersätter den publicerade bara så länge bygget visar en äldre
// version. Visar bygget den – eller en senare, som någon annan sparat –
// gäller den publicerade. En borttagen döljs så länge bygget visar en version
// som togs bort.
function allCoupons() {
  const list = (KP.data ? KP.data.coupons : []).slice();
  for (const [id, { coupon, removed, older }] of Object.entries(pendingCoupons())) {
    const i = list.findIndex((c) => c.id === id);
    if (removed) {
      if (i >= 0 && (older || []).includes(list[i].sha)) list.splice(i, 1);
      else if (i >= 0) clearPending(id);
      continue;
    }
    const p = { ...coupon, pending: true };
    if (i < 0) { list.push(p); continue; }
    const pub = list[i];
    if (signature(pub) === signature(p) || (p.sha && pub.sha === p.sha) || !(older || []).includes(pub.sha)) clearPending(p.id);
    else list[i] = p;
  }
  return list;
}

// En kupong som tjänsten svarat med (filens format) → sidans format.
function fromStored(k) {
  if (!k || !Array.isArray(k.matcher)) return null;
  const sign = (s) => { const t = String(s || '').toUpperCase(); return SIGNS.filter((x) => t.includes(x)).join(''); };
  const matches = k.matcher.filter((r) => r && r.id != null && sign(r.tecken))
    .map((r) => ({ id: String(r.id), sign: sign(r.tecken), label: r.match ? String(r.match) : null, ...(r.kommentar ? { note: String(r.kommentar) } : {}) }));
  return matches.length ? { id: String(k.id), name: k.namn || null, created: k.skapad || null, sha: k.sha || null, matches } : null;
}

// ---------- rättning ----------

const signIdx = (s) => (s.home > s.away ? 0 : s.home === s.away ? 1 : 2);

function gradeRow(x, now) {
  const m = matchById(x.id);
  const r = { id: x.id, sign: x.sign, label: x.label, note: x.note || null, m, state: 'missing', res: null, hit: null, score: null, clock: null, p: null, pr: null, tip: null, kick: null };
  if (!m) return r;
  r.kick = new Date(m.kickoff).getTime();
  // Prognosen före avspark ur journalen om den finns, annars sajtens prognos.
  const pr = m.j && m.j.p ? m.j.p : m.f ? m.f.p : null;
  if (pr) {
    r.pr = pr;
    r.p = x.sign.split('').reduce((a, s) => a + pr[SIGNS.indexOf(s)], 0);
    r.tip = pr.indexOf(Math.max(...pr));
  }
  const L = KP.live.get(m.id);
  // Uppskjuten, inställd eller avbruten – enligt bygget, eller enligt
  // liveställningen innan nästa bygge vet om det (ESPN ger dem läget "post",
  // som en slutspelad match).
  const off = OFF.test(m.status || '') ? m.status : !m.completed && L && OFF.test(L.name || '') ? L.name : null;
  if (off) {
    r.state = 'off';
    r.off = offLabel(off);
  } else if (m.completed) {
    r.state = 'final';
    r.score = m.score;
    const s90 = m.score90 || (/STATUS_(FULL_TIME|FINAL)$/.test(m.status) ? m.score : null);
    r.res = s90 ? signIdx(s90) : null;
    if (m.status === 'STATUS_FINAL_AET') r.extra = 'e.fl.';
    if (m.shootout) r.extra = `str. ${m.shootout.home}–${m.shootout.away}`;
  } else if (L && (L.state === 'in' || L.state === 'post')) {
    r.state = L.state === 'in' ? 'live' : 'final';
    r.score = L.score;
    r.clock = L.state === 'in' ? L.detail : null;
    // Förlängning och straffar: ställningen efter 90 minuter kommer med
    // nästa bygge (målminuterna), inte ur liveställningen. ESPN säger ibland
    // bara "pågår" – då avgör matchminuten (90'+3' är ordinarie tid).
    const minute = Number((/^(\d+)'/.exec(L.detail || '') || [])[1]);
    const regular = L.state === 'in'
      ? /^STATUS_(FIRST_HALF|HALFTIME|SECOND_HALF|END_PERIOD)$/.test(L.name) || (L.name === 'STATUS_IN_PROGRESS' && minute <= 90)
      : /STATUS_(FULL_TIME|FINAL)$/.test(L.name);
    r.res = regular ? signIdx(L.score) : null;
  } else if (r.kick <= now) {
    r.state = 'started';
  } else {
    r.state = 'upcoming';
  }
  // Slutspelad – också när spoilerskyddet döljer resultatet: att matchen är
  // slut avslöjar inget.
  r.over = r.state === 'final';
  // Spoilerskyddet: startad match utan ställning och utan rättning.
  if (r.state !== 'upcoming' && r.state !== 'off' && isHidden(m)) {
    return { ...r, state: 'hidden', score: null, res: null, clock: null, extra: null };
  }
  if (r.res != null) r.hit = x.sign.includes(SIGNS[r.res]);
  return r;
}

function gradeCoupon(c, now = Date.now()) {
  const rows = c.matches.map((x) => gradeRow(x, now)).sort((a, b) => (a.kick || 0) - (b.kick || 0));
  const counted = rows.filter((r) => r.state !== 'off' && r.state !== 'missing');
  const is = (st, hit) => counted.filter((r) => r.state === st && (hit === undefined || r.hit === hit)).length;
  const g = {
    rows,
    n: counted.length,
    ok: is('final', true),
    no: is('final', false),
    live: is('live'),
    liveOk: is('live', true),
    left: is('upcoming') + is('started'),
    hidden: is('hidden'),
    modelOk: counted.filter((r) => r.state === 'final' && r.res != null && r.tip === r.res).length,
    first: rows.length ? rows[0].kick : null,
    last: rows.length ? rows[rows.length - 1].kick : null,
  };
  g.max = g.n - g.no;
  g.done = counted.every((r) => r.over);
  // Väntat antal rätt: klara matcher räknas som de gick, resten med
  // modellens sannolikhet för vårt tecken före avspark.
  g.expected = counted.reduce((a, r) => a + (r.state === 'final' && r.hit != null ? (r.hit ? 1 : 0) : (r.p || 0) / 100), 0);
  g.started = counted.some((r) => r.state !== 'upcoming');
  return g;
}

// Omgångens kupong (förstasidan och Kupong → Omgången): gängets kupong ur
// omgången som alla tippade (samtal.js) tills den är färdigspelad, annars den
// som pågår, annars nästa, annars den som spelades färdigt senast.
function currentCoupon(now = Date.now()) {
  const made = hasSamtal() ? Samtal.made() : null;
  if (made && !gradeCoupon(made, now).done) return made;
  const graded = allCoupons().map((c) => ({ c, g: gradeCoupon(c, now) })).filter((x) => x.g.first);
  const running = graded.filter((x) => x.g.started && !x.g.done).sort((a, b) => b.g.first - a.g.first);
  if (running.length) return running[0].c;
  const next = graded.filter((x) => !x.g.started).sort((a, b) => a.g.first - b.g.first);
  if (next.length) return next[0].c;
  const last = graded.filter((x) => x.g.done).sort((a, b) => b.g.last - a.g.last);
  return last.length ? last[0].c : null;
}

// ---------- liveställningen ----------

function espnCode(comp) {
  const c = state.meta && state.meta.competitions.find((x) => x.id === comp);
  return (c && c.espn) || ESPN_CODE[comp] || null;
}

// Matcher på kupongerna – och i omgången som gänget tippar (samtal.js), också
// innan gängets kupong finns – som pågår enligt spelprogrammet men inte är
// klara i matches.json.
function liveNeeded(now = Date.now()) {
  const ids = new Set(allCoupons().flatMap((c) => c.matches.map((x) => x.id)));
  if (window.Samtal) for (const id of Samtal.ids()) ids.add(id);
  const out = [];
  for (const id of ids) {
    const m = matchById(id);
    if (!m || m.completed || OFF.test(m.status || '')) continue;
    const t = new Date(m.kickoff).getTime();
    if (t <= now + 2 * 60000 && t >= now - 5 * 3600000) out.push(m);
  }
  return out;
}

async function fetchLive(matches) {
  const keys = new Set();
  for (const m of matches) {
    const code = espnCode(m.comp);
    if (code) keys.add(`${code}|${m.kickoff.slice(0, 10).replace(/-/g, '')}`);
  }
  let failed = false;
  await Promise.all([...keys].map(async (k) => {
    const [code, date] = k.split('|');
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard?dates=${date}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      for (const e of d.events || []) {
        const c = e.competitions && e.competitions[0];
        if (!c) continue;
        const h = c.competitors.find((t) => t.homeAway === 'home');
        const a = c.competitors.find((t) => t.homeAway === 'away');
        const st = c.status.type;
        KP.live.set(String(e.id), {
          state: st.state, name: st.name, detail: st.shortDetail || c.status.displayClock,
          score: { home: Number(h.score), away: Number(a.score) },
        });
      }
    } catch {
      failed = true;
    }
  }));
  KP.liveError = failed;
  KP.liveAt = new Date().toISOString();
}

// Varje minut: hämta liveställningen om någon kupongmatch pågår och rita om
// (en gång till när den sista slutat). En död källa ger bara ingen
// liveställning – sidan fortsätter som vanligt.
async function liveTick() {
  clearTimeout(KP.timer);
  try {
    const need = liveNeeded();
    if (need.length && !document.hidden) await fetchLive(need);
    if (need.length || KP.wasLive) redraw();
    KP.wasLive = need.length > 0;
  } finally {
    KP.timer = setTimeout(liveTick, LIVE_EVERY_MS);
  }
}

// ---------- gemensamma bitar ----------

function dateRange(a, b) {
  if (!a) return '';
  const A = new Date(a);
  const B = new Date(b || a);
  const mon = (d) => fMonth.format(d).replace('.', '');
  if (dayKey.format(A) === dayKey.format(B)) return `${fDayNum.format(A)} ${mon(A)}`;
  if (mon(A) === mon(B)) return `${fDayNum.format(A)}–${fDayNum.format(B)} ${mon(B)}`;
  return `${fDayNum.format(A)} ${mon(A)} – ${fDayNum.format(B)} ${mon(B)}`;
}

function rowClass(r) {
  if (r.state === 'hidden') return 'hid';
  if (r.state === 'final') return r.hit === true ? 'ok' : r.hit === false ? 'no' : 'unk';
  if (r.state === 'live') return r.hit === true ? 'live ok' : r.hit === false ? 'live no' : 'live';
  if (r.state === 'off' || r.state === 'missing') return 'off';
  return 'wait';
}

function teamsOf(r) {
  return r.m ? `${r.m.home} – ${r.m.away}` : r.label || `match ${r.id}`;
}

function scoreText(r) {
  return r.score ? `${r.score.home}–${r.score.away}` : '';
}

function pearlTitle(r) {
  const what = r.state === 'final' ? scoreText(r) || 'spelad'
    : r.state === 'live' ? `${scoreText(r)} ${r.clock || ''}`.trim()
      : r.state === 'off' ? r.off : r.state === 'missing' ? 'okänd match' : r.state === 'hidden' ? 'dolt'
        : r.m ? fWeekdayTime.format(new Date(r.m.kickoff)) : '';
  return `${teamsOf(r)} · ${r.sign} · ${what}${r.note ? ` · ”${r.note}”` : ''}`;
}

function pearls(rows, size = '') {
  return `<span class="kp-pearls ${size}">` + rows.map((r) => {
    const cls = rowClass(r);
    const icon = cls === 'ok' ? '✓' : cls === 'no' ? '✕' : '';
    return `<span class="kp-dot ${cls}" title="${esc(pearlTitle(r))}">${icon}</span>`;
  }).join('') + '</span>';
}

function bigNumber(g) {
  if (!g.started) return `<span class="kp-big"><b>${g.n}</b><span>${g.n === 1 ? 'match' : 'matcher'}</span></span>`;
  // Spoilerskyddet: rätt bland matcherna som syns, + ? för de dolda.
  return `<span class="kp-big"><b>${g.hidden && !g.ok ? '?' : g.ok}</b>` +
    (g.liveOk ? `<em title="Rätt om ställningen håller">+${g.liveOk}</em>` : '') +
    (g.hidden && g.ok ? '<em class="sp-q" title="Dolt – du har valt att dölja resultat">+?</em>' : '') +
    `<span>/ ${g.n} rätt</span></span>`;
}

function statusLine(g) {
  if (!g.started) {
    return `Startar ${esc(fWeekdayTime.format(new Date(g.first)))} · väntat <b>${kpNum(g.expected)}</b> rätt`;
  }
  if (g.done && g.hidden) return `Klar · ${Spoiler.chip(`${g.hidden} ${g.hidden === 1 ? 'dold' : 'dolda'}`)}`;
  if (g.done) return `Klar · modellens tips gav <b>${g.modelOk}</b> rätt`;
  return [
    g.live ? `<span class="kp-livetxt">${g.live} pågår</span>` : null,
    g.hidden ? Spoiler.chip(`${g.hidden} ${g.hidden === 1 ? 'dold' : 'dolda'}`) : null,
    g.left ? `${g.left} kvar` : null,
    `väntat <b>${kpNum(g.expected)}</b> rätt`,
  ].filter(Boolean).join(' · ');
}

// ---------- kupongvyn ----------

// Kupong: #kupong (omgången), #kupong/historik och
// #kupong/historik/<id> (historik.js), #kupong/samtal… (samtal.js),
// #kupong/<id>, #kupong/ny, #kupong/andra/<id> och #kupong/bort/<id>.
async function showCoupon(arg) {
  const [mode, id] = (arg || '').split('/');
  if (mode === 'historik') return renderHistory(id || null);
  const el = $('#coupon');
  el.innerHTML = '<p class="empty">Laddar …</p>';
  await Promise.all([whenMatches(), loadCoupons()]);
  if (!state.all) {
    el.innerHTML = '<p class="empty">Kunde inte läsa matcherna.</p>';
    return;
  }
  if (mode === 'samtal' && window.Samtal) return Samtal.show(id || '');
  // Medan omgångens kupong fylls i eller tipsen jämförs är det omgången
  // (samtal.js).
  if (!mode && hasSamtal()) {
    await Samtal.load();
    if (Samtal.active()) return Samtal.show('', true);
  }
  if (mode === 'ny') return renderCreate(null);
  if (mode === 'andra' && id) return renderCreate(id);
  if (mode === 'bort' && id) return renderRemove(id);
  KP.view = { mode: 'show', id: mode || null };
  renderCouponShow(KP.view.id);
  window.scrollTo(0, 0);
}

// Kupongsidans två lägen: omgången – från att matcherna väljs tills gängets
// kupong är färdigspelad – och de färdigspelade.
function viewNav(on) {
  const link = (key, href, label) => `<a href="${href}"${on === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return '<nav class="kp-views" aria-label="Kupong">' +
    link('omgang', '#kupong', 'Omgången') + link('historik', '#kupong/historik', 'Historik') + '</nav>';
}

// Omgångens gång i fyra steg under flikarna, när gänget tippar var för sig
// först (samtal.js). now: steget som pågår (5 = klar). info: en rad om läget
// i stället för förklaringen under ett steg.
const STEPS = ['Välj matcher', 'Alla tippar', 'Uppgörelsen', 'Matcherna'];
function roundSteps(now, info = {}) {
  if (!hasSamtal()) return '';
  return '<ol class="kp-steps" aria-label="Omgångens gång">' + STEPS.map((name, i) => {
    const n = i + 1;
    return `<li class="${n < now ? 'done' : n === now ? 'now' : ''}"${n === now ? ' aria-current="step"' : ''}>` +
      `<span class="kp-step-n" aria-hidden="true">${n < now ? '✓' : n}</span>` +
      `<span class="kp-step-t"><b>${name}</b>${info[n] ? `<span>${esc(info[n])}</span>` : ''}</span></li>`;
  }).join('') + '</ol>';
}

// Ny kupong börjar med att någon väljer omgångens matcher, som var och en
// sedan fyller i för sig inför samtalet (samtal.js). Utan samtalstjänsten
// görs gängets kupong direkt.
const hasSamtal = () => Boolean(window.Samtal && KP.data && KP.data.samtal);
const newCouponHref = () => (hasSamtal() ? '#kupong/samtal/ny' : '#kupong/ny');
// Omgången som fylls i inför samtalet, överst på förstasidan.
const samtalTeaser = () => (hasSamtal() ? Samtal.teaser() : '');

// En kupong per omgång: den som är först väljer matcherna, sedan fyller alla
// i samma kupong. På kupongsidan går systemet ni spelade också att ladda upp
// som skärmbild (systembild.js).
function emptyCard(upload = false) {
  return '<div class="kp-empty card"><p class="kp-eyebrow">Kupong</p><h2 class="page-title">Omgångens kupong</h2>' +
    `<div class="kp-empty-go"><a class="kp-btn primary" href="${newCouponHref()}">Välj matcher</a>` +
    (upload && window.Systembild ? Systembild.button('kp-btn', true) : '') + '</div></div>';
}

// Utan id omgångens kupong, annars en viss kupong.
function renderCouponShow(id) {
  const el = $('#coupon');
  const all = allCoupons();
  const graded = all.map((c) => ({ c, g: gradeCoupon(c) })).sort((a, b) => (b.g.first || 0) - (a.g.first || 0));
  if (!graded.length) {
    // Omgångens tips finns kvar att titta på, också utan gängets kupong.
    el.innerHTML = viewNav('omgang') + roundSteps(1) + emptyCard(true) +
      (!id && hasSamtal() && Samtal.visible() ? '<p class="legend"><a href="#kupong/samtal">Förra omgångens tips</a></p>' : '') + couponErrors();
    return;
  }
  const curId = id || (currentCoupon() || {}).id;
  const cur = graded.find((x) => x.c.id === curId) || (id ? null : graded[0]);
  if (!cur) {
    el.innerHTML = viewNav(null) + `<p class="empty">Kupongen ${esc(id)} finns inte. <a href="#kupong">Till kupongen</a></p>`;
    return;
  }
  const { c, g } = cur;
  // Är omgångens kupong färdigspelad görs nästa med den stora knappen under.
  const round = !id;
  const canEdit = g.rows.some((r) => r.state === 'upcoming');
  // Gängets kupong ur omgången som alla tippade: sista steget, och allas tips
  // finns kvar att titta på.
  const fromTips = round && hasSamtal() && Samtal.covers(c);
  // Allas tips går att se så länge omgången finns – också om gängets kupong
  // inte gjordes ur den.
  const tipsLink = round && hasSamtal() && Samtal.visible();
  // En kupong i taget: nästa görs först när den här är färdigspelad, med den
  // stora knappen under kupongen.
  let html = '<div class="pp-top">' + viewNav(round ? 'omgang' : null) + '<div class="kp-actions">' +
    (tipsLink ? '<a class="kp-btn" href="#kupong/samtal">Allas tips</a>' : '') +
    (canEdit ? `<a class="kp-btn" href="#kupong/andra/${esc(c.id)}">Ändra</a>` : '') +
    // En färdigspelad står kvar i historiken och tas inte bort.
    (g.done ? '' : `<a class="kp-btn" href="#kupong/bort/${esc(c.id)}">Ta bort</a>`) +
    (g.done && !c.pending ? `<a class="kp-btn" href="#kupong/historik/${esc(c.id)}">Betyg och kommentar</a>` : '') +
    // En skärmbild av systemet: ändrar den här kupongen om det är samma
    // matcher, annars blir det en ny (systembild.js).
    (round && window.Systembild ? Systembild.button() : '') +
    '</div></div>' + (fromTips ? roundSteps(g.done ? 5 : 4) : '');

  if (KP.flash) {
    html += `<p class="legend kp-flash" role="status">${esc(KP.flash)}</p>`;
    KP.flash = null;
  }
  if (g.hidden) {
    const ids = g.rows.filter((r) => r.state === 'hidden').map((r) => r.id);
    html += Spoiler.card({
      title: `${g.hidden} ${g.hidden === 1 ? 'match är dold' : 'matcher är dolda'}`,
      text: 'Du har valt att dölja resultat.',
      keys: ids,
      button: 'Visa resultaten',
    });
  }
  html += Papper.coupon(c.name ? c : { ...c, name: couponName(c) }, g);
  // Färdigspelad även om spoilerskyddet döljer resultaten (g.done).
  if (round && g.done) html += `<a class="kp-next" href="${newCouponHref()}"><span aria-hidden="true">+</span> Skapa ny kupong</a>`;
  html += moreSection(graded.filter((x) => x !== cur && !x.g.done));
  html += couponErrors();
  el.innerHTML = html;
}

// Kupong → Historik: de färdigspelade kupongerna med betyg och AI:ns
// kommentar (historik.js).
function renderHistory(id) {
  KP.view = { mode: 'history', id };
  $('#coupon').innerHTML = viewNav('historik') +
    '<div class="kp-head"><div><p class="kp-eyebrow">Färdigspelade kuponger</p><h2 class="page-title">Historik</h2></div></div>' +
    '<div id="history"><p class="empty">Laddar …</p></div>';
  window.scrollTo(0, 0);
  Historik.show($('#history'), id);
}

// ---------- förstasidan ----------

// Förstasidan: hjälten och omgångens kupong i korthet (hela finns under
// Kupong).
async function showHome() {
  const el = $('#home');
  KP.view = { mode: 'home' };
  if (!KP.data || !state.all) el.innerHTML = '<p class="empty">Laddar …</p>';
  await Promise.all([whenMatches(), loadCoupons()]);
  if (KP.view.mode !== 'home') return;
  if (!state.all) {
    el.innerHTML = '<p class="empty">Kunde inte läsa matcherna.</p>';
    return;
  }
  renderHome();
}

function renderHome() {
  const c = currentCoupon();
  // Pågår en omgång inför samtalet står den överst (samtal.js), och rutan
  // ritas om när någon lämnar in.
  // En färdigspelad kupong står då bara i Historik.
  const samtal = samtalTeaser();
  if (samtal) Samtal.watch();
  const g = c && gradeCoupon(c);
  $('#home').innerHTML = samtal + (c && !(samtal && g.done) ? teaser(c, g) : samtal ? '' : emptyCard());
}

// Kupongens namn: det som sparades med den, annars omgångens namn om den
// gjordes ur omgången som gänget tippade (samtal.js).
const couponName = (c) => c.name || (hasSamtal() && Samtal.covers(c) && Samtal.name()) || null;

// Omgångens kupong i korthet: siffran, en prick per match och vägen in.
// Resten (väntat, modellens tips, GitHub) står på kupongsidan.
function teaser(c, g) {
  const name = couponName(c);
  const go = g.done
    ? `<a class="kp-btn primary" href="${newCouponHref()}">+ Ny kupong</a><a class="kp-btn" href="#kupong">Se kupongen</a>`
    : `<a class="kp-btn primary" href="#kupong">${g.started ? 'Följ kupongen' : 'Till kupongen'}</a>`;
  return `<div class="card kp-teaser${g.live ? ' is-live' : ''}">` +
    // Namnet som rubrik och datumen ovanför; utan namn som förut.
    `<div class="kp-teaser-txt"><p class="kp-eyebrow">${esc(name ? dateRange(g.first, g.last) : 'Omgångens kupong')}</p>` +
    `<h2 class="page-title"><a href="#kupong">${esc(name || dateRange(g.first, g.last))}</a></h2>` +
    (g.started ? '' : `<span class="kp-line">Startar ${esc(fWeekdayTime.format(new Date(g.first)))}</span>`) + '</div>' +
    `<a class="kp-teaser-num" href="#kupong" aria-label="Till kupongen">${bigNumber(g)}</a>` +
    pearls(g.rows) +
    `<div class="kp-teaser-go">${go}</div></div>`;
}

// Liveställningen eller spoilerskyddet ändrades: rita om det som syns.
function redraw() {
  if (!KP.view) return;
  if (KP.view.mode === 'home' && !$('#home-section').hidden) renderHome();
  if (KP.view.mode === 'show' && !$('#coupon-section').hidden) renderCouponShow(KP.view.id);
  if (KP.view.mode === 'samtal' && window.Samtal) Samtal.redraw();
}

function liveLine(g) {
  if (!KP.liveAt && !g.live) return '<p class="legend kp-src">Efter 90 minuter</p>';
  return '<p class="legend kp-src">Efter 90 minuter · ' +
    (KP.liveError ? '<span class="note">ESPN svarar inte – ställningen kan vara gammal</span>'
      : `aktuell ställning från ESPN, ${esc(fTime.format(new Date(KP.liveAt)))}`) + '</p>';
}

// Fler kuponger som inte är färdigspelade, t.ex. nästa omgångs medan den
// här pågår. De färdiga finns under Historik.
const openCoupons = () => moreSection(allCoupons().map((c) => ({ c, g: gradeCoupon(c) }))
  .filter((x) => x.g.first && !x.g.done).sort((a, b) => b.g.first - a.g.first));
function moreSection(list) {
  if (!list.length) return '';
  return '<h3 class="kp-h">Fler kuponger</h3><div class="mlist">' + list.map(({ c, g }) =>
    `<a class="kp-past" href="#kupong/${esc(c.id)}"><span class="kp-past-date">${esc(dateRange(g.first, g.last))}` +
    `${c.name ? `<span class="sub">${esc(c.name)}</span>` : ''}</span>${pearls(g.rows, 'sm')}` +
    `<span class="kp-past-num"><b>${g.hidden ? '?' : g.ok}</b>/${g.n}</span></a>`).join('') + '</div>';
}

function couponErrors() {
  const errs = KP.data && KP.data.errors;
  if (!errs || !errs.length) return '';
  return '<p class="legend">' + errs.map((e) => `<span class="note">${esc(e.file)}: ${esc(e.errors.join(', '))}</span>`).join('<br>') + '</p>';
}

// ---------- ny kupong ----------

// base = versionen (sha) av kupongen som en ändring utgår från. Tjänsten
// sparar bara över den versionen, så att ingen skriver över någon annans
// ändring utan att veta om den.
function newDraft(editId) {
  const d = { edit: editId, name: '', picks: {}, notes: {}, locked: [], base: null };
  if (!editId) return d;
  const c = allCoupons().find((x) => x.id === editId);
  if (!c) return d;
  d.name = c.name || '';
  d.created = c.created;
  d.base = c.sha || null;
  for (const x of c.matches) {
    d.picks[x.id] = x.sign;
    if (x.note) d.notes[x.id] = x.note;
  }
  settleDraft(d);
  return d;
}

const isOpen = (m, now) => Boolean(m && !m.completed && !OFF.test(m.status || '') && new Date(m.kickoff).getTime() > now);

// Startade matcher går inte att ändra. På en kupong som ändras ligger de
// kvar som de stod (locked) – också om de valts bort eller fått ett annat
// tecken i utkastet innan de startade – och på en ny kupong tas de bort.
// Körs varje gång listan ritas och när kupongen sparas, så att en match som
// startar medan man väljer inte följer med. Tjänsten kontrollerar detsamma.
function settleDraft(d, now = Date.now()) {
  const pub = d.edit ? allCoupons().find((c) => c.id === d.edit) : null;
  const was = new Map((pub ? pub.matches : []).map((x) => [x.id, x]));
  const out = { dropped: 0, reverted: 0 };
  for (const [id, sign] of Object.entries(d.picks)) {
    if (isOpen(matchById(id), now)) continue;
    delete d.picks[id];
    delete d.notes[id];
    if (!was.has(id)) out.dropped++;
    else if (was.get(id).sign !== sign) out.reverted++;
  }
  d.locked = [...was.values()].filter((x) => !isOpen(matchById(x.id), now));
  return out;
}

function startedNote({ dropped, reverted }) {
  return [
    dropped ? `${dropped === 1 ? 'En match' : `${dropped} matcher`} som du valt har startat och togs bort.` : null,
    reverted ? `${reverted === 1 ? 'En match' : `${reverted} matcher`} har startat – där gäller det som stod på kupongen.` : null,
  ].filter(Boolean).join(' ');
}

function lockInfo() {
  const el = $('#kp-lockinfo');
  if (!el) return;
  // Vilka som har startat står på papperet.
  el.innerHTML = KP.draftNote ? `<span class="note">${esc(KP.draftNote)}</span>` : '';
  el.hidden = !el.innerHTML;
}

// Programmet till vänster och kupongen på papper bredvid (Papper.builder i
// papper.js): + i programmet lägger en rad på papperet, där tecknen kryssas
// och anteckningen skrivs. En vald match utan kryss står i utkastet med
// tomt tecken ('').
function renderCreate(editId) {
  const saved = kpLoad(KP_DRAFT);
  // Ett sparat utkast till en kupong som ändrats sedan dess gäller inte – då
  // börjar man om från den nya versionen.
  const cur = editId ? allCoupons().find((x) => x.id === editId) : null;
  const stale = Boolean(saved && editId && saved.edit === editId && cur && (saved.base || null) !== (cur.sha || null));
  KP.draft = saved && saved.edit === editId && !stale ? saved : newDraft(editId);
  KP.draft.notes = KP.draft.notes || {};
  KP.draftNote = stale ? 'Kupongen har ändrats sedan ditt utkast – du börjar från den nya versionen.' : null;
  KP.view = { mode: 'new', edit: editId };
  KP.allDays = false;
  const el = $('#coupon');
  const comps = [{ id: 'all', short: 'Alla', name: 'Alla tävlingar' }, ...state.comps.values()];
  const tools = '<div class="toolbar kp-tools">' +
    `<input type="search" id="kp-q" class="kp-search" placeholder="Sök lag" autocomplete="off" value="${esc(KP.q)}">` +
    '<div class="chips" id="kp-comps" role="group" aria-label="Tävling">' + comps.map((c) =>
      `<button type="button" data-comp="${c.id}" title="${esc(c.name)}" aria-pressed="${c.id === KP.comp}">${esc(c.short)}</button>`).join('') + '</div></div>' +
    '<p class="legend" id="kp-lockinfo" hidden></p>' +
    // Efter Ladda upp system: vad som kom med från bilden (systembild.js).
    (window.Systembild ? Systembild.note() : '');
  el.innerHTML = '<div class="kp-head"><div>' +
    `<p class="kp-eyebrow">${editId ? 'Ändra kupong' : 'Ny kupong'}</p><h2 class="page-title">Välj matcher</h2></div>` +
    `<div class="kp-actions">${window.Systembild ? Systembild.button() : ''}<a class="kp-btn" href="#kupong${editId ? `/${esc(editId)}` : ''}">Avbryt</a></div></div>` +
    Papper.builder({
      id: 'kp-build',
      list: 'kp-pick-list',
      tools,
      head: `<input type="text" id="kp-name" class="pb-name" maxlength="40" placeholder="Namn (valfritt)" aria-label="Kupongens namn" value="${esc(KP.draft.name)}">`,
      foot: '<button type="button" id="kp-save" class="kp-btn primary">Spara kupong</button><p class="pb-msg" id="kp-pick-msg" role="status"></p>',
    });

  $('#kp-q').addEventListener('input', (e) => { KP.q = e.target.value; renderPickList(); });
  for (const b of document.querySelectorAll('#kp-comps button')) {
    b.addEventListener('click', () => {
      KP.comp = b.dataset.comp;
      for (const x of document.querySelectorAll('#kp-comps button')) x.setAttribute('aria-pressed', String(x === b));
      renderPickList();
    });
  }
  $('#kp-name').addEventListener('input', (e) => { KP.draft.name = e.target.value; kpStore(KP_DRAFT, KP.draft); });
  $('#kp-save').addEventListener('click', saveCoupon);
  const build = $('#kp-build');
  // Anteckningen sparas i utkastet medan man skriver; papperet ritas inte
  // om, så att fältet behåller fokus.
  build.addEventListener('input', (e) => {
    const f = e.target.closest('input[data-note]');
    if (!f) return;
    const v = f.value.slice(0, NOTE_MAX);
    if (v.trim()) KP.draft.notes[f.dataset.note] = v;
    else delete KP.draft.notes[f.dataset.note];
    kpStore(KP_DRAFT, KP.draft);
  });
  build.addEventListener('click', (e) => {
    if (e.target.closest('#kp-more')) {
      KP.allDays = true;
      renderPickList();
      return;
    }
    const picks = KP.draft.picks;
    // + och bock i programmet, × på kupongen.
    const add = e.target.closest('button[data-add], button[data-drop]');
    if (add) {
      const id = add.dataset.add || add.dataset.drop;
      if (add.dataset.drop || picks[id] != null) {
        delete picks[id];
        delete KP.draft.notes[id];
      } else {
        picks[id] = '';
      }
    } else {
      // Kryssen på papperet: utan kryss står matchen kvar, med tomma rutor.
      const b = e.target.closest('button[data-s]');
      if (!b) return;
      const id = b.closest('[data-id]').dataset.id;
      const cur = picks[id] || '';
      picks[id] = SIGNS.filter((x) => (x === b.dataset.s ? !cur.includes(x) : cur.includes(x))).join('');
    }
    $('#kp-pick-msg').innerHTML = '';
    kpStore(KP_DRAFT, KP.draft);
    renderPickList();
  });
  renderPickList();
  window.scrollTo(0, 0);
}

// Gemener utan accenter, så att "malmo" hittar "Malmö" och "wolves" inte
// behöver stora bokstäver.
const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function pickable(now = Date.now()) {
  return state.all.matches.filter((m) => {
    const t = new Date(m.kickoff).getTime();
    return isOpen(m, now) && t <= now + PICK_DAYS * 86400000;
  });
}

// Närmaste omgången: till och med måndagen efter nästa lördag (svensk tid),
// som dag på formen ÅÅÅÅ-MM-DD. På söndagen gäller nästa helg.
function roundEnd(now = Date.now()) {
  const [y, mo, d] = dayKey.format(new Date(now)).split('-').map(Number);
  const today = Date.UTC(y, mo - 1, d);
  const toSat = (6 - new Date(today).getUTCDay() + 7) % 7;
  return new Date(today + (toSat + 2) * 86400000).toISOString().slice(0, 10);
}

function renderPickList() {
  const el = $('#kp-pick-list');
  if (!el) return;
  const moved = settleDraft(KP.draft);
  if (moved.dropped || moved.reverted) {
    KP.draftNote = startedNote(moved);
    kpStore(KP_DRAFT, KP.draft);
  }
  lockInfo();
  const q = fold(KP.q.trim());
  const picks = KP.draft.picks;
  const all = pickable().filter((m) => {
    if (KP.comp !== 'all' && m.comp !== KP.comp) return false;
    return !q || fold(`${m.home} ${m.away}`).includes(q);
  });
  // Först bara närmaste omgången (och det som redan är valt); sökningen
  // gäller alla dagar.
  const end = roundEnd();
  const list = KP.allDays || q ? all
    : all.filter((m) => picks[m.id] != null || dayKey.format(new Date(m.kickoff)) <= end);
  const later = all.length - list.length;
  const more = later ? `<button type="button" class="earlier" id="kp-more">Visa fler dagar <span class="n">${later}</span></button>` : '';
  el.innerHTML = (list.length ? Papper.program(list, (id) => picks[id] != null)
    : `<p class="empty">${later ? 'Inga matcher den närmaste omgången.' : 'Inga matcher hittades.'}</p>`) + more;
  drawSlip();
}

function draftMatches(d = KP.draft) {
  return Object.entries(d.picks)
    .map(([id, sign]) => ({ id, sign, note: ((d.notes || {})[id] || '').trim().slice(0, NOTE_MAX), m: matchById(id) }))
    .filter((x) => x.m);
}

// Papperet: de valda matcherna och – vid ändring – de som har startat, som
// står kvar som de var. I foten rader och väntat antal rätt; startade
// matcher räknas som de gått, eller med prognosen.
function drawSlip() {
  const sel = draftMatches();
  const now = Date.now();
  const locked = KP.draft.locked.map((x) => ({ ...x, m: matchById(x.id), locked: true }));
  const signed = sel.filter((x) => x.sign);
  const fields = [];
  if (signed.length || locked.length) {
    const rows = [...signed, ...locked].reduce((a, x) => a * Math.max(1, x.sign.length), 1);
    const exp = signed.reduce((a, x) => a + (x.m.f ? x.sign.split('').reduce((b, s) => b + x.m.f.p[SIGNS.indexOf(s)], 0) / 100 : 0), 0) +
      KP.draft.locked.map((x) => gradeRow(x, now)).reduce((a, r) => a + (r.state === 'final' && r.hit != null ? (r.hit ? 1 : 0) : (r.p || 0) / 100), 0);
    fields.push(['Rader', rows, 'Antal rader med garderingarna'], ['Väntat', kpNum(exp), 'Väntat antal rätt enligt modellen']);
  }
  Papper.slip('kp-build', {
    rows: [...sel.map((x) => ({ ...x, note: KP.draft.notes[x.id] || '' })), ...locked],
    signs: true,
    fields,
  });
  if (sel.length === signed.length) $('#kp-build').classList.remove('need');
}

// Filen med en match per rad, så att den går att läsa och ändra på GitHub.
function couponJSON(file) {
  const { matcher, ...head } = file;
  const lines = Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  const rows = matcher.map((r, i) => `    { "id": ${JSON.stringify(r.id)}, "match": ${JSON.stringify(r.match)}, "tecken": ${JSON.stringify(r.tecken)}` +
    `${r.kommentar ? `, "kommentar": ${JSON.stringify(r.kommentar)}` : ''} }${i < matcher.length - 1 ? ',' : ''}`);
  return ['{', ...lines, '  "matcher": [', ...rows, '  ]', '}', ''].join('\n');
}

// Kupongen blir en fil i repot. Med proxyn (KP.data.save) sparas den direkt
// – proxyn committar filen (worker/kupong.mjs). Annars, eller om
// proxyn inte kan spara, via GitHub: en ny fil öppnas ifylld; finns filen
// redan öppnas den för redigering och innehållet kopieras, eftersom GitHub
// inte kan fylla i en befintlig fil.
async function saveCoupon() {
  // Har en vald match hunnit starta visas det först, i stället för att
  // kupongen sparas utan den.
  const moved = settleDraft(KP.draft);
  if (moved.dropped || moved.reverted) {
    kpStore(KP_DRAFT, KP.draft);
    KP.draftNote = startedNote(moved);
    renderPickList();
    return;
  }
  // En vald match utan kryss: rutorna blir röda och raden rullas fram – i
  // telefonen dras papperet fram först.
  const blank = draftMatches().filter((x) => !x.sign).length;
  if (blank) {
    $('#kp-build').classList.add('need');
    Papper.open('kp-build');
    Papper.reveal('kp-build', '.pb-row.unsigned');
    $('#kp-pick-msg').innerHTML = `<span class="note">Kryssa i alla matcher – ${blank === 1 ? 'en saknar' : `${blank} saknar`} tecken.</span>`;
    return;
  }
  const ctx = couponCtx(KP.draft);
  if (!ctx) {
    $('#kp-pick-msg').innerHTML = '<span class="note">Välj minst en match.</span>';
    return;
  }
  KP.view = { mode: 'saved', id: ctx.id };
  if (KP.data.save) renderDirect(ctx);
  else renderViaGitHub(ctx);
  window.scrollTo(0, 0);
}

// Utkastet → det som sparas: filen, raderna och kupongen som sidan visar
// den. En ny kupong får första lediga id från datumet för första matchen.
// null om ingen match är vald. Används också av samtalsunderlaget, som
// sparar gängets kupong direkt (samtal.js).
function couponCtx(d) {
  const sel = draftMatches(d).filter((x) => x.sign);
  if (!sel.length && !d.locked.length) return null;
  let id = d.edit;
  if (!id) {
    const first = sel.map((x) => x.m.kickoff).sort()[0];
    const base = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(first));
    const taken = new Set(allCoupons().map((c) => c.id));
    id = base;
    for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  }
  const name = (d.name || '').trim();
  const rows = [
    ...d.locked.map((x) => ({ id: x.id, match: x.label || teamsOf({ m: matchById(x.id), id: x.id }), tecken: x.sign, ...(x.note ? { kommentar: x.note } : {}) })),
    ...sel.map((x) => ({ id: x.id, match: `${x.m.home} – ${x.m.away}`, tecken: x.sign, ...(x.note ? { kommentar: x.note } : {}) })),
  ];
  const kick = (r) => { const m = matchById(r.id); return m ? m.kickoff : ''; };
  rows.sort((a, b) => kick(a).localeCompare(kick(b)));
  const file = {
    ...(name ? { namn: name } : {}),
    skapad: d.created || new Date().toISOString(),
    ...(d.edit ? { 'ändrad': new Date().toISOString() } : {}),
    matcher: rows,
  };
  return {
    id, edit: d.edit, base: d.base || null, name, rows, file,
    range: dateRange(kick(rows[0]) || null, kick(rows[rows.length - 1]) || null),
    coupon: { id, name: name || null, created: file.skapad, matches: rows.map((r) => ({ id: r.id, sign: r.tecken, label: r.match, ...(r.kommentar ? { note: r.kommentar } : {}) })) },
  };
}

function savedHead(eyebrow, ctx) {
  return `<div class="kp-head"><div><p class="kp-eyebrow">${esc(eyebrow)}</p><h2 class="page-title">${esc(ctx.range)}</h2></div></div>`;
}

// Spara direkt: kupongen skickas med en gång; Spara står kvar om det inte gick.
function renderDirect(ctx) {
  $('#coupon').innerHTML = savedHead('Spara kupongen', ctx) +
    '<form class="card kp-saved" id="kp-direct">' +
    '<div class="kp-actions"><button type="submit" class="kp-btn primary" id="kp-send">Spara</button></div>' +
    '<p class="kp-msg" id="kp-msg" role="status"></p>' +
    `<p class="legend kp-alt"><a href="#kupong/${ctx.edit ? `andra/${esc(ctx.edit)}` : 'ny'}">Tillbaka</a> · ` +
    '<button type="button" class="kp-linkbtn" id="kp-viagh">Spara via GitHub i stället</button></p></form>';
  $('#kp-direct').addEventListener('submit', (e) => { e.preventDefault(); sendDirect(ctx); });
  $('#kp-viagh').addEventListener('click', () => renderViaGitHub(ctx));
  sendDirect(ctx);
}

// Skickar kupongen till tjänsten. Tillbaka:
//   {ok, coupon, commit}        sparad – och visas här tills bygget publicerat den
//   {other, changed | taken}    någon annan hann före: changed = kupongen har
//                               ändrats sedan versionen ändringen utgick från,
//                               taken = en kupong som sidan inte kände till har
//                               sparats för samma dag. other visas här tills
//                               bygget publicerat den, och sparas inte över
//                               utan att man sett den.
//   {error, offline}            tjänsten kan inte spara just nu (inte påslaget,
//                               GitHub svarar inte, ingen kontakt) – GitHub-vägen
//                               finns kvar; utan offline: kupongen har fel e.d.
async function postCoupon(ctx) {
  let res = null;
  let body = {};
  try {
    res = await fetch(KP.data.save, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        andra: ctx.edit || null,
        ...(ctx.edit ? { bas: ctx.base } : {}),
        ...(ctx.anyway ? { 'ändå': true } : {}),
        kupong: { id: ctx.id, namn: ctx.name, skapad: ctx.file.skapad, matcher: ctx.rows },
      }),
    });
    body = await res.json().catch(() => ({}));
  } catch {
    res = null;
  }
  if (res && res.ok && body.ok) {
    const coupon = { ...ctx.coupon, id: body.id || ctx.id, created: body.skapad || ctx.coupon.created, sha: body.sha || null };
    setPending(coupon, ctx.edit ? ctx.base : null);
    return { ok: true, coupon, commit: body.commit || null };
  }
  const other = res && res.status === 409 ? fromStored(body.kupong) : null;
  if (other && body.changed) {
    setPending(other, ctx.base);
    return { other, changed: true, error: body.error };
  }
  if (other && body.taken) {
    setPending(other, null);
    return { other, taken: true, error: body.error };
  }
  if (res && [400, 409].includes(res.status)) return { error: body.error || 'Det gick inte att spara.' };
  return { offline: true, error: (body && body.error) || 'Ingen kontakt med servern.' };
}

async function sendDirect(ctx) {
  const msg = (h) => { $('#kp-msg').innerHTML = h; };
  const btn = $('#kp-send');
  btn.disabled = true;
  msg('Sparar …');
  const r = await postCoupon(ctx);
  btn.disabled = false;
  if (r.ok) {
    kpStore(KP_DRAFT, null);
    KP.view = { mode: 'saved', id: r.coupon.id };
    $('#coupon').innerHTML = savedHead('Sparad', ctx) +
      '<div class="card kp-saved"><p>Syns för alla om några minuter.</p>' +
      `<div class="kp-actions"><a class="kp-btn primary" href="#kupong/${esc(r.coupon.id)}">Visa kupongen</a>` +
      (r.commit ? `<a class="kp-btn" href="${esc(r.commit)}" target="_blank" rel="noopener">Ändringen på GitHub</a>` : '') + '</div></div>';
    return;
  }
  // Någon annan hann före: utkastet finns kvar, men sparas inte över den
  // andra versionen utan att man sett den.
  if (r.changed) {
    msg(`<span class="note">${esc(r.error)}</span> ` +
      `<button type="button" class="kp-linkbtn" id="kp-restart">Börja om från den nya versionen</button>`);
    $('#kp-restart').addEventListener('click', () => {
      kpStore(KP_DRAFT, null);
      renderCreate(ctx.edit);
    });
    return;
  }
  if (r.taken) {
    msg(`<span class="note">${esc(r.error)}</span> <a href="#kupong/${esc(r.other.id)}">Visa den</a> · ` +
      '<button type="button" class="kp-linkbtn" id="kp-anyway">Spara ändå, som en kupong till</button>');
    $('#kp-anyway').addEventListener('click', () => sendDirect({ ...ctx, anyway: true }));
    return;
  }
  if (!r.offline) {
    msg(`<span class="note">${esc(r.error)}</span>`);
    return;
  }
  msg(`<span class="note">${esc(r.error)}</span> ` +
    '<button type="button" class="kp-linkbtn" id="kp-viagh2">Spara via GitHub i stället</button>');
  $('#kp-viagh2').addEventListener('click', () => renderViaGitHub(ctx));
}

function renderViaGitHub(ctx) {
  const json = couponJSON(ctx.file);
  setPending(ctx.coupon, ctx.edit ? ctx.base : null);
  kpStore(KP_DRAFT, null);
  const repo = KP.data.repo || 'tomaslaino/Profeterna';
  const branch = KP.data.branch || 'main';
  const path = `${KP.data.dir || 'data/kuponger'}/${ctx.id}.json`;
  const exists = (KP.data.coupons || []).some((c) => c.id === ctx.id);
  const url = exists
    ? `https://github.com/${repo}/edit/${branch}/${path}`
    : `https://github.com/${repo}/new/${branch}?filename=${encodeURIComponent(path)}&value=${encodeURIComponent(json)}`;
  $('#coupon').innerHTML = savedHead('Kupongen är klar', ctx) +
    '<div class="card kp-saved">' +
    (exists
      ? '<p>Öppna filen på GitHub, markera allt, klistra in och tryck <b>Commit changes</b>. Innehållet kopieras när du trycker på knappen.</p>'
      : '<p>Tryck <b>Commit changes</b> på GitHub.</p>') +
    `<div class="kp-actions"><a class="kp-btn primary" id="kp-gh" href="${esc(url)}" target="_blank" rel="noopener">Spara på GitHub</a>` +
    '<button type="button" class="kp-btn" id="kp-copy">Kopiera</button>' +
    `<a class="kp-btn" href="#kupong/${esc(ctx.id)}">Visa kupongen</a></div>` +
    `<details class="kp-file"><summary>${esc(path)}</summary><pre>${esc(json)}</pre></details></div>`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(json); $('#kp-copy').textContent = 'Kopierad'; } catch { /* markera själv i filen nedan */ }
  };
  $('#kp-copy').addEventListener('click', copy);
  if (exists) $('#kp-gh').addEventListener('click', copy);
}

// ---------- ta bort ----------

function removeOnGitHub(id) {
  const repo = KP.data.repo || 'tomaslaino/Profeterna';
  return `https://github.com/${repo}/delete/${KP.data.branch || 'main'}/${KP.data.dir || 'data/kuponger'}/${id}.json`;
}

// Ta bort en kupong som inte är färdigspelad (en färdigspelad fryses in i
// historiken och står kvar där). Med tjänsten tas filen bort med en commit
// (worker/kupong.mjs) och kupongen är borta i den här webbläsaren tills
// bygget publicerat det. Annars öppnas GitHubs sida för att ta bort filen.
// Inget skickas förrän man tryckt – till skillnad från Spara.
function renderRemove(id) {
  const el = $('#coupon');
  const c = allCoupons().find((x) => x.id === id);
  KP.view = { mode: 'remove', id };
  window.scrollTo(0, 0);
  if (!c) {
    el.innerHTML = viewNav(null) + `<p class="empty">Kupongen ${esc(id)} finns inte. <a href="#kupong">Till kupongen</a></p>`;
    return;
  }
  const g = gradeCoupon(c);
  const ctx = { c, range: dateRange(g.first, g.last) };
  if (g.done) {
    el.innerHTML = savedHead('Ta bort kupongen', ctx) +
      '<div class="card kp-saved"><p>Kupongen är färdigspelad och står kvar i historiken.</p>' +
      `<div class="kp-actions"><a class="kp-btn" href="#kupong/${esc(id)}">Tillbaka</a></div></div>`;
    return;
  }
  const gh = esc(removeOnGitHub(id));
  const what = `<p>Hela kupongen${c.name ? ` ${esc(c.name)}` : ''} tas bort för alla, ${g.n === 1 ? 'med sin match' : `med alla ${g.n} matcher`}` +
    `${g.started ? ' – också de som redan har spelats' : ''}.</p>`;
  if (!KP.data.save) {
    el.innerHTML = savedHead('Ta bort kupongen', ctx) + `<div class="card kp-saved">${what}` +
      '<p>Tryck <b>Commit changes</b> på GitHub.</p>' +
      `<div class="kp-actions"><a class="kp-btn kp-danger" href="${gh}" target="_blank" rel="noopener">Ta bort på GitHub</a>` +
      `<a class="kp-btn" href="#kupong/${esc(id)}">Avbryt</a></div></div>`;
    return;
  }
  el.innerHTML = savedHead('Ta bort kupongen', ctx) +
    `<form class="card kp-saved" id="kp-remove">${what}` +
    '<div class="kp-actions"><button type="submit" class="kp-btn kp-danger" id="kp-send">Ta bort kupongen</button></div>' +
    '<p class="kp-msg" id="kp-msg" role="status"></p>' +
    `<p class="legend kp-alt"><a href="#kupong/${esc(id)}">Avbryt</a> · ` +
    `<a href="${gh}" target="_blank" rel="noopener">Ta bort via GitHub i stället</a></p></form>`;
  $('#kp-remove').addEventListener('submit', (e) => { e.preventDefault(); sendRemove(ctx); });
}

async function sendRemove(ctx) {
  const { c } = ctx;
  const msg = (h) => { $('#kp-msg').innerHTML = h; };
  const btn = $('#kp-send');
  btn.disabled = true;
  msg('Tar bort …');
  let res;
  let body = {};
  try {
    res = await fetch(KP.data.save, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bort: c.id, ...(c.sha ? { bas: c.sha } : {}) }),
    });
    body = await res.json().catch(() => ({}));
  } catch {
    res = null;
  }
  btn.disabled = false;
  if (res && res.ok && body.ok) {
    setPending(c, c.sha, true);
    const d = kpLoad(KP_DRAFT);
    if (d && d.edit === c.id) kpStore(KP_DRAFT, null);
    KP.view = { mode: 'removed', id: c.id };
    $('#coupon').innerHTML = savedHead('Borttagen', ctx) +
      '<div class="card kp-saved"><p>Försvinner för alla om några minuter.</p>' +
      '<div class="kp-actions"><a class="kp-btn primary" href="#kupong">Till kupongen</a>' +
      (body.commit ? `<a class="kp-btn" href="${esc(body.commit)}" target="_blank" rel="noopener">Ändringen på GitHub</a>` : '') + '</div></div>';
    return;
  }
  // Någon annan har ändrat kupongen: den versionen visas här tills bygget
  // publicerat den, och tas inte bort utan att man sett den.
  const other = res && res.status === 409 && body.changed ? fromStored(body.kupong) : null;
  if (other) {
    setPending(other, c.sha);
    msg(`<span class="note">${esc(body.error)}</span> <a href="#kupong/${esc(other.id)}">Visa den nya versionen</a>`);
    return;
  }
  if (res && [400, 409].includes(res.status)) {
    msg(`<span class="note">${esc(body.error || 'Det gick inte att ta bort kupongen.')}</span>`);
    return;
  }
  msg(`<span class="note">${esc((body && body.error) || 'Ingen kontakt med servern.')}</span> ` +
    `<a href="${esc(removeOnGitHub(c.id))}" target="_blank" rel="noopener">Ta bort via GitHub i stället</a>`);
}

// ---------- start ----------

(async function initCoupons() {
  await Promise.all([whenMatches(), loadCoupons()]);
  liveTick();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) liveTick(); });
  // Spoilerskyddet ändrades: rätta om med det som får synas.
  if (window.Spoiler) {
    Spoiler.onChange(() => {
      redraw();
    });
  }
})();
