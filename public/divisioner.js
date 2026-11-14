'use strict';

// Sidorna Tabeller och Statistik: en division åt gången, vald med numrerade
// flikar (nivå 1–4). Tabeller har tabellen; Statistik har spelarna och lagen.
// Vilken sida det är står i <body data-page>. Data: data/divisions.json
// (src/divisions.js), data/players/<liga>.json (src/players.js),
// data/teams/<liga>.json (src/teamstats.js) och data/matches.json (formen
// och nästa match). Lagens topplistor och lagkortet har samma tal under
// samma namn som datorn i tobaksaffären (rum-register.js; förut också
// anslagstavlan, borttagen 2026-11-14).
// Fristående från app.js – egna hjälpare, en fast färg per division ur
// theme.css.
//
// Pedagogiken: varje block säger vad det visar i en mening, varje siffra har
// källa och period, "okänt" visas som okänt, och förkortningarna förklaras i
// ordlistan längst ned.

const $ = (s) => document.querySelector(s);
const TZ = 'Europe/Stockholm';
const PAGES = {
  tabeller: [
    { id: 'tabell', label: 'Tabell' },
  ],
  statistik: [
    { id: 'spelare', label: 'Spelarna' },
    { id: 'lag', label: 'Lagen' },
  ],
};
const PAGE = document.body.dataset.page === 'statistik' ? 'statistik' : 'tabeller';
const VIEWS = PAGES[PAGE];
// Flikar som tagits bort: gamla länkar hamnar här i stället.
const MOVED = { prognos: 'tabell', styrka: 'tabell', oversikt: 'spelare', matchbilden: 'spelare', jamfor: 'spelare' };
// Länk till en vy, på den här sidan eller den andra.
function viewHref(div, view) {
  const page = Object.keys(PAGES).find((p) => PAGES[p].some((v) => v.id === view)) || PAGE;
  return `${page === PAGE ? '' : `${page}.html`}#${div}/${view}`;
}
const state = {
  data: null,
  meta: null,
  players: new Map(), // division → spelarfilen (eller { unknown })
  div: 'pl',
  view: VIEWS[0].id,
  pf: { q: '', team: '', pos: '', played: true, sort: 'g', dir: -1, limit: 60, cols: 'oversikt' },
  tf: { cols: 'tabell', sort: 'rank', dir: 1 },
  mtab: { team: null, player: null }, // senast valda flik i lag- och spelarrutan
  form: null, // lagnamn → lagets matcher, senaste först (loadForm)
  lf: { who: 'lor', sort: 'grupp', dir: 1 }, // tabellen Landslagen
  landById: null, // matchlistans landskamper efter id (loadLandMatches)
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Lagets sköld för mörk botten (skoldar.js), och namnet med skölden framför
// – samma i Tabeller, Statistik och lagrutan.
const teamCrest = (name) => (window.Skoldar ? Skoldar.img(name, { dark: true }) : '');
const teamName = (name) => `<span class="dv-tname">${teamCrest(name)}<span>${esc(name)}</span></span>`;

async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(res.status === 404 ? 'finns inte' : `HTTP ${res.status}`);
  return res.json();
}

const NF = new Map();
function num(x, d = 1) {
  if (x == null || !Number.isFinite(x)) return '–';
  if (!NF.has(d)) NF.set(d, new Intl.NumberFormat('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d }));
  return NF.get(d).format(x);
}
const pct = (x, d = 0) => (x == null || !Number.isFinite(x) ? '–' : `${num(x * 100, d)} %`);
const int = (x) => (x == null || !Number.isFinite(x) ? '–' : num(Math.round(x), 0));
const color = (id) => (id === 'unl' ? 'var(--dv-unl, #2a9db0)' : `var(--dv-${id})`);
const unknown = (why = 'okänt') => `<span class="unknown">${esc(why)}</span>`;
const fDateTime = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const when = (iso) => (iso ? esc(fDateTime.format(new Date(iso))) : 'okänt');
const MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
// 1:a, 2:a, 3:e … 21:a, 22:a
const ordinal = (n) => `${n}:${n % 10 <= 2 && n % 10 >= 1 && (n % 100 < 11 || n % 100 > 12) ? 'a' : 'e'}`;

// ---------- spelare: positioner och nationer på svenska ----------

const POS = { MV: 'Målvakt', B: 'Back', MF: 'Mittfältare', A: 'Anfallare' };
const POS_PLURAL = { MV: 'Målvakter', B: 'Backar', MF: 'Mittfältare', A: 'Anfallare' };
const POS_ORDER = { MV: 0, B: 1, MF: 2, A: 3 };

// ESPN:s landsnamn → svenska. Saknas ett land visas ESPN:s namn.
const NAT = {
  England: 'England', Wales: 'Wales', Scotland: 'Skottland', 'Northern Ireland': 'Nordirland', 'Republic of Ireland': 'Irland',
  France: 'Frankrike', Netherlands: 'Nederländerna', Brazil: 'Brasilien', Spain: 'Spanien', Jamaica: 'Jamaica', Denmark: 'Danmark',
  USA: 'USA', Germany: 'Tyskland', Portugal: 'Portugal', Australia: 'Australien', Belgium: 'Belgien', Sweden: 'Sverige',
  Argentina: 'Argentina', Nigeria: 'Nigeria', Italy: 'Italien', Japan: 'Japan', Ghana: 'Ghana', Norway: 'Norge', Canada: 'Kanada',
  Senegal: 'Senegal', 'New Zealand': 'Nya Zeeland', 'Sierra Leone': 'Sierra Leone', Morocco: 'Marocko', Switzerland: 'Schweiz',
  Austria: 'Österrike', Cameroon: 'Kamerun', Serbia: 'Serbien', Greece: 'Grekland', Mali: 'Mali', Ukraine: 'Ukraina',
  'Ivory Coast': 'Elfenbenskusten', Zimbabwe: 'Zimbabwe', Grenada: 'Grenada', 'Congo DR': 'DR Kongo', Croatia: 'Kroatien',
  Gambia: 'Gambia', Czechia: 'Tjeckien', Slovakia: 'Slovakien', Hungary: 'Ungern', Ecuador: 'Ecuador', Poland: 'Polen',
  Algeria: 'Algeriet', Albania: 'Albanien', Kenya: 'Kenya', Guyana: 'Guyana', Uruguay: 'Uruguay', 'South Korea': 'Sydkorea',
  'Burkina Faso': 'Burkina Faso', Türkiye: 'Turkiet', Paraguay: 'Paraguay', Colombia: 'Colombia', Chile: 'Chile',
  Slovenia: 'Slovenien', 'Bosnia and Herzegovina': 'Bosnien och Hercegovina', 'St Lucia': 'Saint Lucia', Tunisia: 'Tunisien',
  Mexico: 'Mexiko', Iceland: 'Island', Israel: 'Israel', Georgia: 'Georgien', Curaçao: 'Curaçao', Suriname: 'Surinam',
  Cyprus: 'Cypern', Malta: 'Malta', Haiti: 'Haiti', Egypt: 'Egypten', 'Trinidad and Tobago': 'Trinidad och Tobago',
  Romania: 'Rumänien', 'St Kitts and Nevis': 'Saint Kitts och Nevis', Latvia: 'Lettland', Finland: 'Finland', Malawi: 'Malawi',
  Uganda: 'Uganda', 'South Africa': 'Sydafrika', Bulgaria: 'Bulgarien', Uzbekistan: 'Uzbekistan', Mozambique: 'Moçambique',
  Barbados: 'Barbados', Peru: 'Peru', Benin: 'Benin', Kazakhstan: 'Kazakstan', Fiji: 'Fiji', Namibia: 'Namibia',
  Indonesia: 'Indonesien', Guadeloupe: 'Guadeloupe', 'Costa Rica': 'Costa Rica', Estonia: 'Estland', 'Comoros Islands': 'Komorerna',
  Montenegro: 'Montenegro', Martinique: 'Martinique', Bangladesh: 'Bangladesh', Jordan: 'Jordanien', Venezuela: 'Venezuela',
  Gabon: 'Gabon', Congo: 'Kongo-Brazzaville', Moldova: 'Moldavien', Oman: 'Oman', Bermuda: 'Bermuda',
  'Dominican Republic': 'Dominikanska republiken', Guatemala: 'Guatemala', Afghanistan: 'Afghanistan', Burundi: 'Burundi',
  Iraq: 'Irak', 'Guinea-Bissau': 'Guinea-Bissau', 'Antigua and Barbuda': 'Antigua och Barbuda', 'Faroe Islands': 'Färöarna',
  Cuba: 'Kuba', Montserrat: 'Montserrat', Guinea: 'Guinea', Angola: 'Angola', Togo: 'Togo', Lithuania: 'Litauen',
  'North Macedonia': 'Nordmakedonien', Kosovo: 'Kosovo', China: 'Kina', India: 'Indien', Iran: 'Iran', Philippines: 'Filippinerna',
};
const natSv = (n) => (n ? NAT[n] || n : null);

// ---------- gemensamma byggstenar ----------

// Ett kort: rubrik, valfri kort förklaring (en rad, t.ex. hur en tabell läses),
// innehåll och källrad. Definitioner står i ordlistan och i kolumnernas
// title-texter, inte som löptext – sidan ska gå att läsa utan förklaringar.
// tip = förklaringen som visas när man pekar på rubriken.
const tipAttr = (head, tip) => (tip ? ` data-tip="${esc(tip)}" data-tip-head="${esc(head)}"` : '');

function card(title, { hint, key, body, src, cls = '', tip }) {
  return `<section class="card dv-card ${cls}">` +
    (title ? `<h4${tipAttr(title, tip)}>${esc(title)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</h4>` : '') +
    (key ? `<p class="dv-key-line">${key}</p>` : '') + body +
    (src ? `<p class="src-line">${src}</p>` : '') + '</section>';
}

// Värde i en tabellcell: 0 dämpat, okänt som streck med förklaring.
function cell(v, { d = 0, strong = false } = {}) {
  if (v == null) return '<span class="dv-nil" title="okänt – ingen statistik hos ESPN">–</span>';
  if (v === 0) return '<span class="dv-zero">0</span>';
  const s = d ? num(v, d) : int(v);
  return strong ? `<b>${s}</b>` : s;
}

// ---------- tabellen ----------

const ZONES = [
  { test: (n) => /relegation/i.test(n), cls: 'z-down', label: 'Nedflyttning' },
  { test: (n) => /playoff/i.test(n), cls: 'z-po', label: 'Kval till uppflyttning' },
  { test: (n) => /champions league/i.test(n), cls: 'z-up', label: 'Champions League' },
  { test: (n) => /europa|conference/i.test(n), cls: 'z-eu', label: 'Europa- eller Conference League' },
  { test: (n) => /promotion/i.test(n), cls: 'z-up', label: 'Direkt uppflyttning' },
];
const zoneOf = (note) => (note ? ZONES.find((z) => z.test(note)) || null : null);
// Zonen för en rad: landslagens rader bär sin zon själva (landZone), de
// engelska läses ur ESPN:s note.
const zoneRow = (r) => (r && 'zone' in r ? r.zone : zoneOf(r && r.note));

// Zonstrecket med zonens namn där zonen slutar: under de övre zonerna, ovanför
// nedflyttningen – aldrig i tabellens kant. rows kan ha luckor (null).
function zoneLine(rows, i, cols) {
  const line = (z) => `<tr class="dv-zline ${z.cls}" aria-hidden="true"><td colspan="${cols}"><div><span>${esc(z.label)}</span></div></td></tr>`;
  const z = rows[i] && zoneRow(rows[i]);
  if (!z) return { before: '', after: '' };
  const prev = i > 0 ? rows[i - 1] : undefined;
  const next = i < rows.length - 1 ? rows[i + 1] : undefined;
  const other = (r) => !r || (zoneRow(r) || {}).label !== z.label;
  const down = z.cls === 'z-down' || z.down;
  return {
    before: down && prev !== undefined && other(prev) ? line(z) : '',
    after: !down && next !== undefined && other(next) ? line(z) : '',
  };
}

// Som en vanlig tabell: S V O F, målen och poängen. I telefonen ryms inte
// målen bredvid långa lagnamn (Wolverhampton) – där räcker +/−.
function leagueTable(rows, { attr = (r) => `data-team="${esc(r.espnId)}"` } = {}) {
  const head = '<thead><tr><th class="c">#</th><th>Lag</th><th class="num" title="Spelade matcher">S</th>' +
    '<th class="num" title="Vunna">V</th><th class="num" title="Oavgjorda">O</th><th class="num" title="Förlorade">F</th>' +
    '<th class="num hide-xs" title="Gjorda–insläppta mål">Mål</th><th class="num" title="Målskillnad">+/−</th>' +
    '<th class="num" title="Poäng: 3 för vinst, 1 för oavgjort">P</th></tr></thead>';
  const body = rows.map((r, i) => {
    if (!r) return `<tr class="dv-gap"><td colspan="9">⋯</td></tr>`;
    const z = zoneRow(r);
    const zl = zoneLine(rows, i, 9);
    const gd = r.gd > 0 ? `+${r.gd}` : r.gd < 0 ? `−${-r.gd}` : '0';
    return zl.before + `<tr class="dv-trow ${z ? z.cls : ''}" ${attr(r)} tabindex="0" title="${z ? esc(z.label) : ''}">` +
      `<td class="c rank">${r.rank}</td><td class="team">${teamName(r.name)}</td><td class="num">${r.played}</td>` +
      `<td class="num">${r.won}</td><td class="num">${r.drawn}</td><td class="num">${r.lost}</td>` +
      `<td class="num hide-xs">${r.gf}–${r.ga}</td><td class="num">${gd}</td>` +
      `<td class="num pts">${r.points}${r.deductions ? `<sup title="${r.deductions} poängs avdrag">*</sup>` : ''}</td></tr>` + zl.after;
  }).join('');
  return `<div class="table-wrap dv-tw"><table class="dv-league">${head}<tbody>${body}</tbody></table></div>`;
}

function tableView(P) {
  if (!P || P.unknown || !P.table) {
    return `<p class="empty">${unknown('okänt – ingen tabell hämtad för divisionen')}</p>`;
  }
  const rows = P.table.rows;
  const ded = rows.filter((r) => r.deductions);
  // Utan rubrik: sidan heter Tabeller och divisionen står i flikarna ovanför.
  // Zonerna förklarar sig själva med strecken i tabellen.
  return card('', {
    body: leagueTable(rows) +
      (ded.length ? `<p class="dv-note">* Poängavdrag: ${ded.map((r) => `${esc(r.name)} −${r.deductions}`).join(', ')}.</p>` : ''),
    src: `Tabell: ESPN, hämtat ${when(P.table.fetchedAt)}`,
    cls: 'dv-tablecard',
  });
}

const signed = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? `±${num(0, d)}` : x > 0 ? `+${num(x, d)}` : `−${num(-x, d)}`);

function dateLabel(iso) {
  if (!iso) return 'okänt';
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

// ---------- sorterbara tabeller (spelarna och lagen) ----------

// En kolumn: get = sorteringsvärdet, show = cellen (annars cell()), in = de
// kolumngrupper den syns i. ok = kräver ett minsta underlag: värden under
// det visas dämpade och sorteras efter dem som räcker, före okänt.
function sortBy(list, col, dir, tiebreak) {
  return list.sort((a, b) => {
    const x = col.get(a); const y = col.get(b);
    if (x == null && y == null) return tiebreak(a, b);
    if (x == null) return 1;
    if (y == null) return -1;
    if (col.ok) {
      const qa = col.ok(a); const qb = col.ok(b);
      if (qa !== qb) return qa ? -1 : 1;
    }
    const c = col.text ? String(x).localeCompare(String(y), 'sv') : x - y;
    return c * dir || tiebreak(a, b);
  });
}

// Rubriken kan ha en kort underrad (sub); förklaringen (title, med name som
// rubrik) visas i förklaringsrutan när man pekar på kolumnen – se tips().
// Pilen står i mellanrummet bredvid rubriken (framför talen, efter orden)
// och tar ingen plats, och underraden finns alltid: rubrikerna står på samma
// rad, och tabellen flyttar sig inte när man sorterar eller byter flik.
function sortHead(cols, f, attr, lead = '') {
  return `<thead><tr>${lead}` + cols.map((c) => {
    const on = c.key === f.sort;
    const tip = c.title ? ` data-tip="${esc(c.title)}" data-tip-head="${esc(c.name || c.label)}"` : '';
    const dir = on ? `<span class="dv-dir" aria-hidden="true">${f.dir > 0 ? '▲' : '▼'}</span>` : '';
    return `<th class="${c.cls}${on ? ' on' : ''}" aria-sort="${on ? (f.dir > 0 ? 'ascending' : 'descending') : 'none'}"${tip}>` +
      `<button type="button" ${attr}="${c.key}"><span class="dv-lab">${esc(c.label)}${dir}</span>` +
      `<small>${c.sub ? esc(c.sub) : '&nbsp;'}</small></button></th>`;
  }).join('') + '</tr></thead>';
}

// En osynlig rad under tabellen med alla olika värden i varje kolumn, ett per
// rad: kolumnen blir lika bred som det bredaste värdet bland alla raderna,
// inte bara bland dem som visas (och i telefonen, där namnen bryts, som det
// bredaste ordet). Då ändrar kolumnerna inte bredd när man sorterar,
// filtrerar eller visar fler.
const sizers = new WeakMap();
function sizerRow(all, cols, lead = '') {
  const key = cols.map((c) => c.key).join();
  const cache = sizers.get(all) || new Map();
  sizers.set(all, cache);
  if (!cache.has(key)) {
    const tds = cols.map((c) => `<td class="${c.cls}">${[...new Set(all.map((x) => colValue(c, x)))].join('<br>')}</td>`);
    cache.set(key, `<tfoot class="dv-sizer" aria-hidden="true"><tr>${lead}${tds.join('')}</tr></tfoot>`);
  }
  return cache.get(key);
}

// Sorteringen ritar om tabellen; rullningen i sidled ska stå kvar.
function keepScroll(el, draw) {
  const at = [...el.querySelectorAll('.table-wrap')].map((w) => w.scrollLeft);
  draw();
  el.querySelectorAll('.table-wrap').forEach((w, i) => { if (at[i]) w.scrollLeft = at[i]; });
}

// Förklaringsrutan: syns direkt när musen pekar på något med data-tip (eller
// när det får fokus från tangentbordet). Ligger i body med position: fixed så
// att tabellens rullruta inte klipper den. Pekskärmar får ingen – där sorterar
// ett tryck, och ordlistan förklarar.
function tips(root) {
  const box = document.createElement('div');
  box.id = 'dv-tip';
  box.className = 'dv-tip';
  box.setAttribute('role', 'tooltip');
  box.hidden = true;
  document.body.appendChild(box);
  let cur = null;
  const hide = () => {
    if (cur) cur.removeAttribute('aria-describedby');
    cur = null;
    box.hidden = true;
  };
  const show = (el) => {
    if (el === cur) return;
    hide();
    cur = el;
    el.setAttribute('aria-describedby', 'dv-tip');
    box.innerHTML = `<b>${esc(el.dataset.tipHead || '')}</b>${esc(el.dataset.tip)}`;
    box.hidden = false;
    const r = el.getBoundingClientRect();
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    box.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8))}px`;
    box.style.top = `${r.bottom + 8 + h <= window.innerHeight ? r.bottom + 8 : Math.max(8, r.top - h - 8)}px`;
  };
  root.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest('[data-tip]');
    if (el) show(el); else hide();
  });
  root.addEventListener('pointerleave', hide);
  root.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && e.target.matches(':focus-visible')) show(el);
  });
  root.addEventListener('focusout', hide);
  root.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true, capture: true });
}

function colValue(c, x) {
  let v;
  if (c.show) v = c.show(x);
  else if (c.pct) v = c.get(x) == null ? cell(null) : pct(c.get(x));
  else v = cell(c.get(x), { d: c.d || 0, strong: c.strong });
  if (c.ok && c.get(x) != null && !c.ok(x)) v = `<span class="dv-unq" title="${esc(c.okWhy || 'för litet underlag')}">${v}</span>`;
  return v;
}

function colCell(c, x) {
  return `<td class="${c.cls}">${colValue(c, x)}</td>`;
}

// Plus/minus med färg: grönt bra, rött dåligt (invert för insläppta), inget
// inom dödbandet.
function delta(v, { d = 1, dead = 0.05, invert = false, fmt } = {}) {
  if (v == null) return cell(null);
  const s = fmt ? fmt(v) : signed(v, d);
  if (Math.abs(v) < dead) return `<span class="dv-even">${s}</span>`;
  return `<span class="${(v > 0) !== invert ? 'dv-pos' : 'dv-neg'}">${s}</span>`;
}
const signedPct = (x) => (Math.round(x * 100) === 0 ? '±0 %' : x > 0 ? `+${num(x * 100, 0)} %` : `−${num(-x * 100, 0)} %`);

// Kolumngrupperna som flikar ovanför tabellen.
function segHtml(groups, cur, attr) {
  return `<div class="dv-seg" role="group" aria-label="Kolumner">${groups.map((g) =>
    `<button type="button" ${attr}="${g.id}" aria-pressed="${g.id === cur}">${esc(g.label)}</button>`).join('')}</div>`;
}

// ---------- spelarna ----------

// Gränserna för kvoter, ur spelarfilen (thresholds).
const TH = { shots: 10, min: 270, rated: 3, shareRated: 0.5 };
const per90 = (x, p) => (x == null || !p.min ? null : (x / p.min) * 90);
// Mål och assist till per 90: FPL:s egna i Premier League (samma matcher som
// FPL-minuterna), annars truppens – speltiden räknas för samma matcher.
const goals90 = (p) => (p.fg !== undefined ? p.fg : p.g);
const ga90Of = (p) => (goals90(p) == null ? null : goals90(p) + ((p.fg !== undefined ? p.fa : p.a) || 0));
const dxgOf = (p) => (p.xg != null && p.fg != null ? p.fg - p.xg : null);
const qMin = { ok: (p) => p.min >= TH.min, okWhy: 'Osäker siffra: mindre än tre hela matchers speltid' };
// ESPN:s siffror per 90 minuter: i Premier League med speltiden ur
// matchrapporterna (emin, samma matcher som truppen), annars FPL:s.
const espnMin = (p) => (p.emin !== undefined ? p.emin : p.min);
const per90e = (x, p) => (x == null || !espnMin(p) ? null : (x / espnMin(p)) * 90);
const qMinE = { ok: (p) => espnMin(p) >= TH.min, okWhy: qMin.okWhy };
// Lagets mål i truppen (samma matcher som spelarnas), per lag-id.
const teamGoals = new Map();
const goalShare = (p) => {
  const tg = teamGoals.get(p.teamId);
  return p.noStats || !tg ? null : ((p.g || 0) + (p.a || 0)) / tg;
};
const onlyMv = (p, v) => (p.pos === 'MV' ? v : null);

// sort = förvald sortering när gruppen väljs (den första som finns).
// needs: 'goals' = målen ur matchrapporterna.
const P_GROUPS = [
  { id: 'oversikt', label: 'Översikt', sort: ['g'] },
  { id: 'avslut', label: 'Avslut', sort: ['g'] },
  { id: 'malen', label: 'Målen', sort: ['gw', 'g'], needs: 'goals' },
  { id: 'forsvar', label: 'Försvar', sort: ['def90', 'svp'] },
  { id: 'regelbrott', label: 'Regelbrott', sort: ['fs'] },
];
const PA = P_GROUPS.map((g) => g.id);
const MIN_IN = ['oversikt', 'avslut', 'forsvar', 'regelbrott'];
const PCOLS = [
  { key: 'name', label: 'Spelare', get: (p) => p.name, text: true, cls: 'pname dv-stick', in: PA,
    show: (p) => `<span class="dv-pn">${esc(p.name)}</span><small class="show-sm">${esc(p.team)}</small>` },
  { key: 'team', label: 'Lag', get: (p) => p.team, text: true, cls: 'pteam hide-sm', in: PA, show: (p) => esc(p.team) },
  { key: 'pos', label: 'Pos', name: 'Position', title: 'MV = målvakt, B = back, MF = mittfältare, A = anfallare.',
    get: (p) => POS_ORDER[p.pos], show: (p) => esc(p.pos || '–'), cls: 'c', in: PA },
  { key: 'app', label: 'M', name: 'Matcher', title: 'Ligamatcher i år – både från start och som inhoppare.', get: (p) => p.app, cls: 'num', in: PA },
  { key: 'starts', label: 'Start', name: 'Från start', title: 'Ligamatcher där spelaren fanns med i startelvan.', get: (p) => p.starts, cls: 'num hide-md hide-sm', in: ['oversikt'] },
  { key: 'min', label: 'Min', name: 'Speltid', title: 'Spelade minuter i ligan i år.', get: (p) => p.min, cls: 'num hide-xs', mins: true, in: MIN_IN },
  { key: 'g', label: 'Mål', title: 'Ligamål i år. Självmål räknas inte.', get: (p) => p.g, cls: 'num', strong: true, in: ['oversikt', 'avslut', 'malen'] },

  // Målen: ur ESPN:s matchrapporter. kinds = målens sort, som bara finns där
  // rapporterna beskriver målen (inte League One och League Two).
  { key: 'gshare', label: 'Inblandad', sub: 'i lagets mål', name: 'Inblandad i lagets mål',
    title: 'Mål och assist delat med lagets mål: hur stor del av lagets mål spelaren har gjort eller lagt sista passningen till. Dämpade siffror: laget har gjort färre än fem mål.',
    get: goalShare, pct: true, cls: 'num hide-xs', in: ['malen'],
    ok: (p) => teamGoals.get(p.teamId) >= 5, okWhy: 'Osäker siffra: laget har gjort färre än fem mål' },
  { key: 'gw', label: 'Segermål', title: 'Mål som avgjorde en vunnen match: målet som gav laget den ledning det sedan aldrig tappade. Vid 3–1 är lagets andra mål segermålet.',
    get: (p) => p.gw, cls: 'num', strong: true, in: ['malen'] },
  { key: 'gpts', label: 'Poäng', sub: 'åt laget', name: 'Poäng som målen gav',
    title: 'Poängen laget hade tappat utan spelarens mål. Ett mål i en match som vanns med ett mål är värt två poäng (seger i stället för oavgjort), ett mål i en oavgjord match en poäng. Mål i matcher som vanns stort eller förlorades ger inga.',
    get: (p) => p.gpts, cls: 'num', in: ['malen'] },
  { key: 'g1', label: 'Första', sub: 'målet i matchen', name: 'Matchens första mål', title: 'Mål som var matchens första – det som gav laget ledningen med 1–0.',
    get: (p) => p.g1, cls: 'num hide-sm', in: ['malen'] },
  { key: 'gpen', label: 'Straff', name: 'Straffar', title: 'Straffmål av slagna straffar i ligan – räddade, missade och i ramen räknas som slagna. Straffläggningar räknas inte.',
    get: (p) => p.gpen, cls: 'num', kinds: true, in: ['malen'],
    show: (p) => (p.gpen == null ? cell(null) : p.gpen + (p.pmiss || 0) ? `${p.gpen} <span class="muted">av ${p.gpen + (p.pmiss || 0)}</span>` : cell(0)) },
  { key: 'glate', label: 'Sena', sub: 'från 80:e min', name: 'Sena mål', title: 'Mål från den 80:e minuten och framåt, tilläggstiden inräknad.',
    get: (p) => p.glate, cls: 'num hide-sm', in: ['malen'] },
  { key: 'gsub', label: 'Inhopp', sub: 'mål', name: 'Mål som inhoppare', title: 'Mål gjorda efter att spelaren bytts in.', get: (p) => p.gsub, cls: 'num hide-sm', in: ['malen'] },
  { key: 'a', label: 'Ass', name: 'Assist', title: 'Sista passningen före ett mål – eller ett skott som räddas och slås in av en lagkamrat. Enligt ESPN.',
    get: (p) => p.a, cls: 'num', in: ['oversikt'] },
  { key: 'rt', label: 'Betyg', name: 'Snittbetyg',
    title: 'Snittet av spelarens betyg från 365Scores, 1–10, i ligans matcher i år. En vanlig insats ger runt 6,7. Dämpade siffror: betyg i färre än tre matcher eller i färre än hälften av lagets.',
    get: (p) => p.rt, d: 1, cls: 'num', rt: true, in: ['oversikt'],
    ok: (p) => p.rn >= TH.rated && p.rq >= TH.shareRated, okWhy: 'Osäker siffra: betyg i färre än tre matcher eller i färre än hälften av lagets' },
  { key: 'fs', label: 'Fälld', name: 'Fälld', title: 'Gånger spelaren har blivit fälld eller utsatt för en annan förseelse som domaren blåst för.',
    get: (p) => p.fs, cls: 'num', strong: true, in: ['regelbrott'] },
  { key: 'fs90', label: 'Fälld', sub: 'per 90 min', name: 'Fälld per 90 minuter', title: 'Gånger spelaren har blivit fälld per 90 minuters speltid. Dämpade siffror: mindre än tre hela matchers speltid.',
    get: (p) => per90e(p.fs, p), d: 1, cls: 'num hide-xs', mins: true, in: ['regelbrott'], ...qMinE },
  { key: 'fc', label: 'Fäller', name: 'Begångna regelbrott', title: 'Regelbrott spelaren har begått som domaren blåst frispark eller straff för.',
    get: (p) => p.fc, cls: 'num', in: ['regelbrott'] },
  { key: 'fc90', label: 'Fäller', sub: 'per 90 min', name: 'Begångna regelbrott per 90 minuter', title: 'Begångna regelbrott per 90 minuters speltid. Dämpade siffror: mindre än tre hela matchers speltid.',
    get: (p) => per90e(p.fc, p), d: 1, cls: 'num hide-xs', mins: true, in: ['regelbrott'], ...qMinE },
  { key: 'yc', label: 'Gul', name: 'Gula kort', title: 'Gula kort i ligan i år.', get: (p) => p.yc, cls: 'num', in: ['regelbrott'] },
  { key: 'rc', label: 'Röd', name: 'Röda kort', title: 'Röda kort i ligan i år.', get: (p) => p.rc, cls: 'num', in: ['regelbrott'] },
  { key: 'sh', label: 'Skott', title: 'Alla avslut – även de som går utanför eller blockeras.', get: (p) => p.sh, cls: 'num', in: ['avslut'] },
  { key: 'sot', label: 'På mål', name: 'Skott på mål', title: 'Skott som hade gått in om målvakten inte räddat. Skott utanför och i stolpen räknas inte.',
    get: (p) => p.sot, cls: 'num', in: ['avslut'] },
  { key: 'conv', label: 'Mål/skott', name: 'Mål per skott',
    title: 'Hur stor andel av skotten som blivit mål. 20 % = vart femte skott går in. Spelare med färre än tio skott visas dämpade – där är siffran osäker.',
    get: (p) => (p.sh ? p.g / p.sh : null), pct: true, cls: 'num hide-xs', in: ['avslut'],
    ok: (p) => p.sh >= TH.shots, okWhy: 'Osäker siffra: färre än tio skott' },
  { key: 'gpm', label: 'Mål', sub: 'per match', name: 'Mål per match', title: 'Mål delat med antalet matcher. Inhopp räknas som hela matcher.',
    get: (p) => (p.app ? p.g / p.app : null), d: 2, cls: 'num', nomins: true, in: ['avslut'] },
  { key: 'xg', label: 'xG', name: 'Förväntade mål (xG)',
    title: 'Hur många mål spelarens chanser brukar ge. Varje skott får ett värde efter hur ofta ett sådant skott blir mål – en straff runt 0,8, ett långskott några hundradelar. Från Fantasy Premier League.',
    get: (p) => p.xg, d: 1, cls: 'num', fpl: true, in: ['avslut'] },
  { key: 'dxg', label: 'Mål mot xG',
    title: 'Gjorda mål minus xG. Plus (grönt) = fler mål än chanserna brukar ge – en skicklig avslutare eller tur. Stora avvikelser brukar jämna ut sig med tiden.',
    get: dxgOf, cls: 'num', fpl: true, in: ['avslut'], show: (p) => delta(dxgOf(p), { d: 1, dead: 0.05 }) },
  { key: 'xa', label: 'xA', name: 'Förväntade assist (xA)',
    title: 'Hur många mål spelarens passningar före lagkamraternas skott brukar ge, oavsett om skotten gick in. Från Fantasy Premier League.',
    get: (p) => p.xa, d: 1, cls: 'num hide-xs', fpl: true, in: ['avslut'] },
  { key: 'g90', label: 'Mål', sub: 'per 90 min', name: 'Mål per 90 minuter',
    title: 'Mål per 90 minuters speltid – rättvisare än per match för spelare som ofta byts in eller ut. Dämpade siffror: mindre än tre hela matchers speltid.',
    get: (p) => per90(goals90(p), p), d: 2, cls: 'num', mins: true, in: ['avslut'], ...qMin },
  { key: 'xg90', label: 'xG', sub: 'per 90 min', name: 'xG per 90 minuter',
    title: 'Förväntade mål per 90 minuters speltid: hur ofta spelaren kommer till lägen, oavsett om de blir mål.',
    get: (p) => per90(p.xg, p), d: 2, cls: 'num hide-sm', fpl: true, in: ['avslut'], ...qMin },
  { key: 'ga90', label: 'M+A', sub: 'per 90 min', name: 'Mål plus assist per 90 minuter', title: 'Mål och assist tillsammans per 90 minuters speltid.',
    get: (p) => per90(ga90Of(p), p), d: 2, cls: 'num hide-xs', mins: true, in: ['avslut'], ...qMin },

  // Försvar: närkamperna från Fantasy Premier League, målvakterna från ESPN.
  { key: 'tk', label: 'Tacklingar', title: 'Gånger spelaren har tagit bollen från en motståndare i en närkamp. Från Fantasy Premier League.',
    get: (p) => p.tk, cls: 'num', fpl: true, in: ['forsvar'] },
  { key: 'rec', label: 'Bollvinster', title: 'Gånger spelaren har tagit hand om en lös boll åt laget. Målvakter får många när de plockar inlägg och långbollar. Från Fantasy Premier League.',
    get: (p) => p.rec, cls: 'num hide-xs', fpl: true, in: ['forsvar'] },
  { key: 'cbi', label: 'Rensningar', sub: 'täckningar, brytningar', name: 'Rensningar, täckningar och brytningar',
    title: 'Bollar spelaren har rensat bort, skott och passningar spelaren har täckt och passningar spelaren har brutit. Från Fantasy Premier League.',
    get: (p) => p.cbi, cls: 'num', fpl: true, in: ['forsvar'] },
  { key: 'def90', label: 'Insatser', sub: 'per 90 min', name: 'Försvarsinsatser per 90 minuter',
    title: 'Tacklingar, rensningar, täckningar och brytningar per 90 minuters speltid. Dämpade siffror: mindre än tre hela matchers speltid.',
    get: (p) => (p.tk == null || p.cbi == null ? null : per90(p.tk + p.cbi, p)), d: 1, cls: 'num', strong: true, fpl: true, in: ['forsvar'], ...qMin },
  { key: 'cs', label: 'Nollor', name: 'Hållna nollor', title: 'Matcher där laget inte släppte in något mål medan spelaren var på planen, minst 60 minuter. Från Fantasy Premier League.',
    get: (p) => p.cs, cls: 'num hide-xs', fpl: true, in: ['forsvar'] },
  { key: 'sv', label: 'Räddningar', title: 'Målvaktens räddningar i ligan i år.', get: (p) => onlyMv(p, p.sv), cls: 'num', in: ['forsvar'],
    show: (p) => (p.pos === 'MV' ? cell(p.sv) : '') },
  { key: 'svp', label: 'Räddade', sub: 'av skotten på mål', name: 'Räddningsprocent',
    title: 'Räddningar delat med skotten på mål som målvakten mött. Dämpade siffror: färre än tio skott på mål.',
    get: (p) => onlyMv(p, p.savePct), cls: 'num', in: ['forsvar'],
    show: (p) => (p.pos !== 'MV' ? '' : p.savePct == null ? cell(null) : pct(p.savePct)),
    ok: (p) => (p.sv || 0) + (p.gc || 0) >= 10, okWhy: 'Osäker siffra: färre än tio skott på mål' },
  { key: 'og', label: 'Självmål', title: 'Självmål i ligan i år.', get: (p) => p.og, cls: 'num hide-xs', in: ['forsvar'] },
];

// fpl = xG och försvarsspel (bara Premier League), mins = speltiden
// (alla ligor där den är känd), kinds = målens sort, rt = betygen.
function playerGroups(P) {
  return P_GROUPS.filter((g) => g.needs !== 'goals' || P.goalTypes);
}

function playerGroup(P) {
  const list = playerGroups(P);
  return list.find((g) => g.id === state.pf.cols) || list[0];
}

function playerCols(P) {
  const fpl = !!P.fpl;
  const mins = !!(P.minutes || P.fpl);
  const kinds = !!(P.goalTypes && P.goalTypes.kinds);
  const rt = !!P.ratings;
  const g = playerGroup(P).id;
  return PCOLS.filter((c) => c.in.includes(g) && (!c.fpl || fpl) && (!c.mins || mins) && (!c.nomins || !mins) && (!c.kinds || kinds) && (!c.rt || rt));
}

// Gruppens förvalda sortering: den första av dess kolumner som finns.
function groupSort(P, cols) {
  return playerGroup(P).sort.map((k) => cols.find((c) => c.key === k)).find(Boolean) || cols.find((c) => !c.text);
}

// Lika tal: den som har spelat färre matcher först – samma tal på kortare
// tid – och sedan namnet. Både tabellen och topplistorna sorterar så.
const fewerApps = (a, b) => (a.app || 0) - (b.app || 0) || a.name.localeCompare(b.name, 'sv');

function filteredPlayers(P, cols) {
  const f = state.pf;
  const q = f.q.trim().toLowerCase();
  const col = cols.find((c) => c.key === f.sort) || groupSort(P, cols);
  const list = P.players.filter((p) => (!f.played || (p.app > 0)) && (!f.team || p.teamId === f.team) && (!f.pos || p.pos === f.pos) &&
    (!q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || (natSv(p.nat) || '').toLowerCase().includes(q)));
  return sortBy(list, col, col.key === f.sort ? f.dir : -1, fewerApps);
}

// En topplista är tabellens första rader sorterad på kolumnen: samma ordning
// på båda ställena. Betygen räknas bara när de är säkra nog (ok).
function leaders(P, key) {
  const col = PCOLS.find((c) => c.key === key);
  return sortBy(P.players.filter((p) => col.get(p) > 0 && (!col.ok || col.ok(p))), col, -1, fewerApps);
}

function playerTableHtml(P) {
  const cols = playerCols(P);
  const list = filteredPlayers(P, cols);
  const f = state.pf;
  const head = sortHead(cols, f, 'data-sort', '<th class="c hide-xs">#</th>');
  const rows = list.slice(0, f.limit).map((p, i) => `<tr class="dv-prow" data-pid="${esc(p.id)}" tabindex="0">` +
    `<td class="c rank hide-xs">${i + 1}</td>${cols.map((c) => colCell(c, p)).join('')}</tr>`).join('');
  const rest = list.length - Math.min(list.length, f.limit);
  const sizer = sizerRow(P.players, cols, `<td class="c rank hide-xs">${P.players.length}</td>`);
  return `<div class="table-wrap dv-tw"><table class="dv-players">${head}<tbody>${rows}</tbody>${sizer}</table></div>` +
    '<div class="dv-tfoot">' +
    (rest > 0 ? `<button type="button" class="dv-more" data-more="1">Visa ${Math.min(rest, 100)} till ↓<small>${rest} kvar</small></button>` : '') +
    `<p class="dv-count" id="dv-count">${list.length} spelare${f.played ? ' som spelat' : ''}${f.team || f.pos || f.q ? ' med filtret' : ''}</p></div>`;
}

// En rad i en topplista: spelaren med laget under namnet, eller laget med
// placeringen i tabellen under – lika höga rader under Spelarna och Lagen.
const playerRow = (p) => ({ attr: `data-pid="${esc(p.id)}"`, name: p.name, sub: p.team });
// Laget har sin sköld framför namnet, som i Tabeller.
const teamRow = (t) => ({ attr: t.espnId ? `data-team="${esc(t.espnId)}"` : 'disabled', name: t.name, sub: t.grupp ? `${ordinal(t.rank)} i grupp ${t.grupp}` : `${ordinal(t.rank)} plats`, crest: true });
// rank = placeringen som text ('' när den delas med raden ovanför), bar =
// en stapel mellan namnet och talet (dbar).
const leaderLi = (x, rank, value, who, bar = '') => {
  const r = who(x);
  const name = `${esc(r.name)}<small>${r.subHtml || esc(r.sub)}</small>`;
  return `<li><button type="button" class="dv-lrow${bar ? ' bar' : ''}" ${r.attr}>` +
    `<span class="dv-lrank">${rank}</span>` +
    (r.crest ? `<span class="dv-lname dv-lteam">${teamCrest(r.name)}<span>${name}</span></span>` : `<span class="dv-lname">${name}</span>`) +
    (bar ? `<span class="dv-lbar" aria-hidden="true">${bar}</span>` : '') +
    `<span class="dv-lval">${value(x)}</span></button></li>`;
};

// Delad placering, som skytteligan på text-tv:n i tobaksaffären: lika tal
// delar plats, och numret står bara på den första.
const ranks = (list, same) => list.map((x, i) => (i && same && same(list[i - 1], x) ? '' : String(i + 1)));
const sameOn = (get) => (a, b) => get(a) === get(b);

// Stapeln i en lista åt två håll. r = talet delat med divisionens största
// (−1–1). Den börjar i mitten: åt höger för plus, åt vänster för minus,
// grön och röd när plus är bra (tone 'signed') och grå när det bara är
// olika (Motståndet).
function dbar(r, tone = 'signed') {
  const w = `${(Math.min(1, Math.abs(r)) * 50).toFixed(1)}%`;
  return `<span class="dv-dbar"><i class="${r > 0 ? 'up' : 'down'}${tone === 'even' ? ' even' : ''}" style="width:${w}"></i></span>`;
}

const lmore = (key, label) => `<p class="dv-lfoot"><button type="button" class="dv-lmore dv-linkbtn" data-top="${esc(key)}">${label} →</button></p>`;

function leaderCard(title, list, value, { empty = 'inga än', note, top, tip, who = playerRow, same, bar, more = 'Topp 20' } = {}) {
  const rk = ranks(list, same);
  const rows = list.length
    ? list.map((x, i) => leaderLi(x, rk[i], value, who, bar ? bar(x) : '')).join('')
    : `<li class="dv-lempty">${esc(empty)}</li>`;
  return `<section class="dv-leader"><h4${tipAttr(title, tip)}>${esc(title)}</h4><ol>${rows}</ol>` +
    (note ? `<p class="dv-lnote">${note}</p>` : '') + (top ? lmore(top, more) : '') + '</section>';
}

// Topplistorna: fem på kortet (n), upp till 20 i en dialog. Listan sparas
// per vy så att knappen Topp 20 kan öppna den. Lagens listor (all) visar
// hela divisionen i dialogen, med knappen Alla lag.
const tops = new Map();
function topCard(key, title, list, value, opts = {}) {
  const n = opts.n || 5;
  tops.set(key, { title, list, value, note: opts.note, who: opts.who || playerRow, same: opts.same, bar: opts.bar, all: opts.all });
  return leaderCard(title, list.slice(0, n), value, { ...opts, top: list.length > n ? key : null, more: opts.all ? 'Alla lag' : 'Topp 20' });
}

function openTop(key) {
  const t = tops.get(key);
  if (!t) return;
  let body;
  let n;
  if (t.full) {
    body = t.full();
    n = t.n;
  } else {
    const list = t.all ? t.list : t.list.slice(0, 20);
    const rk = ranks(list, t.same);
    body = `<ol class="dv-toplist">${list.map((x, i) => leaderLi(x, rk[i], t.value, t.who, t.bar ? t.bar(x) : '')).join('')}</ol>`;
    n = list.length;
  }
  showModal(mhead(null, t.title, [`${esc(divName())} · ${t.all || t.full ? `alla ${n} lag` : `topp ${n}`}`]) +
    body + mfoot(t.note ? [t.note] : []));
}

function playersView(dv, P) {
  if (!P || P.unknown) {
    return `<p class="empty">${unknown(`okänt – ${P ? P.reason : 'ingen spelardata'}`)}</p>`;
  }
  TH.shots = P.thresholds.minShotsConversion;
  TH.min = P.thresholds.minMinutesP90 || 270;
  TH.rated = P.thresholds.minRated || 3;
  TH.shareRated = P.thresholds.minShareRated || 0.5;
  teamGoals.clear();
  for (const t of P.teams) teamGoals.set(t.espnId, t.goals);
  tops.clear();
  const L = P.leaders;
  const t = P.totals;
  const f = state.pf;
  const teams = [...P.teams].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  let html = '';
  // Tre topplistor, samma i alla divisioner. Resten (xG, kort, skott) går
  // att sortera fram i tabellen Alla spelare. Betygen ersätter målvakterna
  // när de finns (målvakterna finns kvar under Försvar i tabellen).
  // Lika tal delar plats, som skytteligan på text-tv:n.
  html += '<div class="dv-leaders">' +
    topCard('goals', 'Skytteliga', leaders(P, 'g'), (p) => `<b>${p.g}</b>`, { same: sameOn((p) => p.g) }) +
    topCard('assists', 'Flest assist', leaders(P, 'a'), (p) => `<b>${p.a}</b>`, { same: sameOn((p) => p.a) }) +
    (P.ratings
      ? topCard('rating', 'Högst betyg', leaders(P, 'rt'), (p) => `<b>${num(p.rt, 1)}</b>`, { empty: 'okänt', same: sameOn((p) => Math.round(p.rt * 10)) })
      : topCard('keepers', 'Målvakter', L.keepers, (p) => `<b>${pct(p.savePct)}</b>`, { empty: 'okänt', same: sameOn((p) => Math.round(p.savePct * 100)) })) +
    '</div>';

  html += card('Alla spelare', {
    body: segHtml(playerGroups(P), playerGroup(P).id, 'data-pcols') + '<div class="dv-filters">' +
      `<input type="search" id="pf-q" class="dv-input" placeholder="Sök spelare, lag eller nation …" value="${esc(f.q)}" aria-label="Sök spelare">` +
      `<select id="pf-team" class="dv-select" aria-label="Lag"><option value="">Alla lag</option>${teams.map((x) => `<option value="${esc(x.espnId)}"${x.espnId === f.team ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` +
      `<select id="pf-pos" class="dv-select" aria-label="Position"><option value="">Alla positioner</option>${Object.keys(POS).map((k) => `<option value="${k}"${k === f.pos ? ' selected' : ''}>${POS_PLURAL[k]}</option>`).join('')}</select>` +
      `<label class="dv-toggle"><input type="checkbox" id="pf-played"${f.played ? ' checked' : ''}> Bara de som spelat</label>` +
      '</div><div id="dv-ptable">' + playerTableHtml(P) + '</div>',
    src: `ESPN, hämtat ${when(P.source.fetchedAt)} · ${int(t.used)} av ${int(t.players)} har spelat` +
      (t.teamsBehind ? ` · släpar en omgång för ${t.teamsBehind} lag` : '') +
      (P.fpl ? ` · speltid, xG och försvarsspel: Fantasy Premier League, hämtat ${when(P.fpl.fetchedAt)}` : '') +
      (!P.fpl && P.minutes ? ` · speltid${P.goalTypes ? ' och målen' : ''}: ESPN:s matchrapporter, hämtat ${when(P.minutes.fetchedAt)}` : '') +
      (P.fpl && P.goalTypes ? ` · målen: ESPN:s matchrapporter, hämtat ${when(P.goalTypes.fetchedAt)}` : '') +
      (P.ratings ? ` · betyg: 365Scores, hämtat ${when(P.ratings.fetchedAt)}` +
        (P.ratings.games < P.ratings.played ? ` (${int(P.ratings.games)} av ${int(P.ratings.played)} matcher har betyg)` : '') : ''),
    cls: 'dv-wide',
  });

  html += '<div class="dv-grid2">' + goalsByPos(P) + '</div>';
  return html;
}

function barList(rows, { label, value, fmt, sub }) {
  const max = Math.max(...rows.map(value)) || 1;
  return '<ul class="dv-barlist">' + rows.map((r) => `<li><span class="bl-l">${label(r)}</span>` +
    `<span class="bl-b"><i style="width:${((value(r) / max) * 100).toFixed(1)}%"></i></span>` +
    `<span class="bl-v">${fmt(r)}${sub ? `<small>${sub(r)}</small>` : ''}</span></li>`).join('') + '</ul>';
}

function goalsByPos(P) {
  const posName = { A: 'Anfallare', MF: 'Mittfältare', B: 'Backar', MV: 'Målvakter', okänd: 'Okänd position' };
  return card('Vem gör målen?', {
    body: barList(P.goalsByPos, { label: (r) => esc(posName[r.pos] || r.pos), value: (r) => r.goals, fmt: (r) => pct(r.share), sub: (r) => `${r.goals} mål` }),
    src: `ESPN-trupperna, hämtat ${when(P.source.fetchedAt)}`,
  });
}

// ---------- lagen ----------

// Lagfilen (data/teams/<division>.json): tabellen ur ESPN och xG, skott,
// kort och oddsen ur football-data.co.uk, som har ett eget antal matcher –
// därför per match eller som skillnad inom samma matcher.
const per = (o, k) => (o && o.n ? o[k] / o.n : null);
const fdOf = (t, k) => (t.fd ? t.fd[k] : null);
const share = (t, k) => (t.fd && t.fd.n ? t.fd[k] / t.fd.n : null);
const xgd = (t) => { const x = fdOf(t, 'xg'); return x ? (x.f - x.a) / x.n : null; };
const xpd = (t) => { const x = fdOf(t, 'xg'); return x ? x.pts - x.xp : null; };
const xdraw = (t) => { const x = fdOf(t, 'xg'); return x ? x.xd / x.n : null; };
const vsOdds = (t) => { const m = fdOf(t, 'mkt'); return m ? m.pts - m.xp : null; };
const roi = (t) => { const m = fdOf(t, 'mkt'); return m ? (m.ret - m.n) / m.n : null; };
const sqOf = (t, k) => (t.sq ? t.sq[k] : null);
const signedInt = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '0');

// ---------- formen och nästa match ----------

// Som på anslagstavlan i tobaksaffären och i matchrutan: de fem senaste
// matcherna, nyast först, V, O eller F efter 90 minuter. Ur data/matches.json,
// alltså ligan och de engelska cuperna (Europacuperna finns bara i matchens
// fil). Ett dolt resultat står som ? och räknas inte.
const FORM_TIP = 'De fem senaste matcherna i ligan och de engelska cuperna, nyast till vänster: V = vinst, O = oavgjort, F = förlust. ' +
  'Det är ställningen efter 90 minuter som gäller. Peka på en ruta för att se vilken match det var.';
const FORM_RESULT = { V: 'Vinst', O: 'Oavgjort', F: 'Förlust' };
const FORM_PTS = { V: 3, O: 1, F: 0 };
// cuperna på svenska, som i kortregistret
const COMP_SV = { FAC: 'FA-cupen', EFL: 'Ligacupen' };
const compSv = (m) => COMP_SV[m.compShort] || m.compName || '';
const offMatch = (m) => /POSTPONED|CANCEL|ABANDON|SUSPEND/.test(m.status || '');
const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayNo = (t) => Math.round(Date.parse(`${fDay.format(new Date(t))}T00:00:00Z`) / 86400000);
const fKick = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const shortDay = (iso) => { const d = new Date(`${fDay.format(new Date(iso))}T12:00:00Z`); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`; };

// [mål för, mål emot] för laget efter 90 minuter (och efter förlängningen)
function goalsOf(m, team, s = m.score90 || m.score) {
  if (!s) return null;
  return m.home === team ? [s.home, s.away] : [s.away, s.home];
}
function letter(m, team) {
  const g = goalsOf(m, team);
  return !g ? null : g[0] > g[1] ? 'V' : g[0] < g[1] ? 'F' : 'O';
}

// Lagnamn → lagets matcher i alla tävlingar, senaste först. Hämtas en gång.
let formLoad = null;
function loadForm() {
  if (!formLoad) {
    formLoad = allMatches().then((all) => {
      const map = new Map();
      for (const m of all || []) {
        if (offMatch(m)) continue;
        for (const t of [m.home, m.away]) {
          if (!map.has(t)) map.set(t, []);
          map.get(t).push(m);
        }
      }
      for (const l of map.values()) l.sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
      state.form = map;
      return map;
    }, () => { state.form = new Map(); return state.form; });
  }
  return formLoad;
}

// De fem senaste: [{ m, l: 'V' | 'O' | 'F' | '?' }]
function teamForm(name) {
  const list = (state.form && state.form.get(name)) || [];
  return list.filter((m) => m.completed).slice(0, 5)
    .map((m) => ({ m, l: window.Spoiler && Spoiler.hidden(m) ? '?' : letter(m, name) || '–' }));
}
// Poängen i de fem (3 för vinst, 1 för oavgjort); null utan ett enda känt resultat.
function formPts(f) {
  const known = f.filter((x) => x.l in FORM_PTS);
  return known.length ? known.reduce((s, x) => s + FORM_PTS[x.l], 0) : null;
}
// Nästa match: den första som inte är spelad (en som pågår räknas).
function teamNext(name) {
  const list = (state.form && state.form.get(name)) || [];
  const soon = Date.now() - 3 * 3600000;
  return list.filter((m) => !m.completed && Date.parse(m.kickoff) > soon).pop() || null;
}

// Matchen bakom en formruta, i ord.
function formText(x, team) {
  const m = x.m;
  const home = m.home === team;
  const g = goalsOf(m, team);
  const g2 = m.score90 && m.score ? goalsOf(m, team, m.score) : null;
  const more = g2 && (g2[0] !== g[0] || g2[1] !== g[1]) ? ` efter 90 minuter, ${g2[0]}–${g2[1]} efter förlängning` : '';
  return `${shortDay(m.kickoff)} · ${compSv(m)} · ${home ? 'hemma' : 'borta'} mot ${home ? m.away : m.home}${g ? ` · ${g[0]}–${g[1]}${more}` : ''}`;
}
// Rutorna (style.css .form). Förklaringen i förklaringsrutan på sidan
// (data-tip), som title i lag- och spelarrutan.
function formChips(f, team, { title = false } = {}) {
  if (!f.length) return '<span class="dv-nil" title="Inga spelade matcher">–</span>';
  return `<span class="form dv-form">${f.map((x) => {
    const head = x.l === '?' ? 'Dold' : FORM_RESULT[x.l] || 'Resultat saknas';
    const text = x.l === '?' ? 'Du har valt att dölja resultat.' : formText(x, team);
    const attr = title ? ` title="${esc(`${head}: ${text}`)}"` : ` data-tip-head="${esc(head)}" data-tip="${esc(text)}"`;
    return `<span class="${x.l === '?' ? 'sp-form' : x.l}"${attr}>${esc(x.l)}</span>`;
  }).join('')}</span>`;
}

// I lagkortet: nästa match som en rad – motståndet med skölden, hemma eller
// borta, avsparken och tävlingen när det inte är ligan, och om hur många
// dagar (som Nästa på lagkortet i kortregistret).
function nextMatch(team, m) {
  const home = m.home === team;
  const opp = home ? m.away : m.home;
  const d = dayNo(Date.parse(m.kickoff)) - dayNo(Date.now());
  const live = Date.parse(m.kickoff) <= Date.now();
  const when = live ? 'pågår' : d <= 0 ? 'i dag' : d === 1 ? 'i morgon' : `om ${d} dagar`;
  const comp = m.comp !== state.div ? compSv(m) : '';
  return `<div class="dv-next"><span class="dv-tname">${teamCrest(opp)}<span><b>${esc(opp)}</b>` +
    `<small>${home ? 'Hemma' : 'Borta'} · ${esc(fKick.format(new Date(m.kickoff)))}${comp ? ` · ${esc(comp)}` : ''}</small></span></span>` +
    `<b class="dv-next-when">${when}</b></div>`;
}

// I lagkortet: de fem senaste en och en – rutan, motståndet, hemma eller
// borta, dagen och tävlingen, och resultatet ur lagets synvinkel.
function formList(team, f) {
  return `<ul class="dv-flist">${f.map((x) => {
    const m = x.m;
    const home = m.home === team;
    const opp = home ? m.away : m.home;
    const g = x.l === '?' ? null : goalsOf(m, team);
    return `<li><span class="form dv-form"><span class="${x.l === '?' ? 'sp-form' : x.l}">${esc(x.l)}</span></span>` +
      `<span class="dv-tname">${teamCrest(opp)}<span>${esc(opp)}<small>${home ? 'hemma' : 'borta'} · ${esc(shortDay(m.kickoff))}` +
      `${m.comp !== state.div ? ` · ${esc(compSv(m))}` : ''}</small></span></span>` +
      `<b>${g ? `${g[0]}–${g[1]}` : '?'}</b></li>`;
  }).join('')}</ul>`;
}

const T_GROUPS = [
  { id: 'tabell', label: 'Tabell', sort: 'rank', dir: 1 },
  { id: 'xg', label: 'xG', sort: 'xgd', dir: -1, needs: 'xg' },
  { id: 'spelet', label: 'Spelet', sort: 'shf', dir: -1 },
  { id: 'marknaden', label: 'Oddsen', sort: 'vso', dir: -1 },
  { id: 'truppen', label: 'Truppen', sort: 'goals', dir: -1, needs: 'players' },
];
const TA = T_GROUPS.map((g) => g.id);
const TCOLS = [
  { key: 'rank', label: '#', name: 'Placering', title: 'Lagets placering i tabellen just nu (landslagen: i gruppen).', get: (t) => (t.grupp ? grpOrd(t.grupp) * 100 + t.rank : t.rank), cls: 'c rank', asc: true, in: ['tabell'], show: (t) => t.rank },
  { key: 'name', label: 'Lag', get: (t) => t.name, text: true, cls: 'team dv-stick', in: TA, show: (t) => teamName(t.name) },
  // (bara landslagen: gruppen i Nations League)
  { key: 'grupp', label: 'Grupp', name: 'Gruppen', title: 'Gruppen i Nations League: ligan (A–D) och gruppens nummer.', get: (t) => (t.grupp ? grpOrd(t.grupp) * 100 + t.rank : null), cls: 'c', asc: true, in: ['tabell'], land: true, show: (t) => esc(t.grupp || '–') },
  { key: 'm', label: 'S', name: 'Spelade matcher', title: 'Antal spelade ligamatcher.', get: (t) => t.m, cls: 'num', in: ['tabell'] },
  { key: 'w', label: 'V', name: 'Vunna', title: 'Vunna matcher – ger 3 poäng var.', get: (t) => t.w, cls: 'num', in: ['tabell'] },
  { key: 'd', label: 'O', name: 'Oavgjorda', title: 'Oavgjorda matcher – ger 1 poäng var.', get: (t) => t.d, cls: 'num', in: ['tabell'] },
  { key: 'l', label: 'F', name: 'Förlorade', title: 'Förlorade matcher – ger inga poäng.', get: (t) => t.l, cls: 'num', in: ['tabell'] },
  { key: 'gf', label: 'GM', name: 'Gjorda mål', title: 'Mål laget har gjort i ligan.', get: (t) => t.gf, cls: 'num hide-xs', in: ['tabell'] },
  { key: 'ga', label: 'IM', name: 'Insläppta mål', title: 'Mål laget har släppt in i ligan.', get: (t) => t.ga, cls: 'num hide-xs', asc: true, in: ['tabell'] },
  { key: 'gd', label: '+/−', name: 'Målskillnad', title: 'Gjorda minus insläppta mål. Skiljer lag som har lika många poäng.',
    get: (t) => t.gd, cls: 'num', in: ['tabell'], show: (t) => signedInt(t.gd) },
  { key: 'pts', label: 'P', name: 'Poäng', title: '3 poäng för vinst, 1 för oavgjort. En stjärna betyder att laget fått poängavdrag.', get: (t) => t.pts, cls: 'num pts', in: ['tabell'],
    show: (t) => `<b>${t.pts}</b>${t.ded ? `<sup title="${t.ded} poängs avdrag">*</sup>` : ''}` },
  { key: 'form', label: 'Form', sub: 'nyast först', name: 'Formen', title: `${FORM_TIP} Sorteras på poängen i de fem matcherna.`,
    get: (t) => formPts(teamForm(t.name)), cls: 'c dv-fcol hide-xs', in: ['tabell'], show: (t) => formChips(teamForm(t.name), t.name) },
  { key: 'gpm', label: 'Mål', sub: 'per match', name: 'Gjorda mål per match',
    title: 'Gjorda mål delat med antalet matcher – går att jämföra även när lagen har spelat olika många matcher.',
    get: (t) => (t.m ? t.gf / t.m : null), d: 2, cls: 'num hide-sm', in: ['tabell'] },
  { key: 'gapm', label: 'Insläppta', sub: 'per match', name: 'Insläppta mål per match', title: 'Insläppta mål delat med antalet matcher. Lägre är bättre.',
    get: (t) => (t.m ? t.ga / t.m : null), d: 2, cls: 'num hide-sm', asc: true, in: ['tabell'] },
  { key: 'cs', label: 'Nollor', sub: 'andel matcher', name: 'Hållna nollor', title: 'Hur stor andel av matcherna laget har klarat utan att släppa in något mål.',
    get: (t) => share(t, 'cs'), pct: true, cls: 'num hide-xs', in: ['tabell'] },

  // xG-fliken läses från vänster: chanserna laget skapar och släpper till,
  // skillnaden, hur målen och poängen stämt med chanserna, hur ofta matcherna
  // legat nära kryss, hur svårt programmet varit och vad modellen gör av allt.
  { key: 'xgf', label: 'Skapar', sub: 'xG per match', name: 'Skapade chanser',
    title: 'Förväntade mål (xG) per match: hur många mål lagets chanser brukar ge. Varje skott får ett värde efter hur ofta ett sådant skott blir mål – en straff runt 0,8, ett långskott några hundradelar. Högre är bättre.',
    get: (t) => per(fdOf(t, 'xg'), 'f'), d: 2, cls: 'num', in: ['xg'] },
  { key: 'xga', label: 'Släpper till', sub: 'xG per match', name: 'Motståndarnas chanser',
    title: 'Motståndarnas förväntade mål (xG) per match: hur bra chanser laget släpper till. Lägre är bättre.',
    get: (t) => per(fdOf(t, 'xg'), 'a'), d: 2, cls: 'num', asc: true, in: ['xg'] },
  { key: 'xgd', label: 'Skillnad', sub: 'xG per match', name: 'xG-skillnad',
    title: 'Lagets xG minus motståndarnas, per match. Plus (grönt) = laget skapar bättre chanser än det släpper till. Visar lagets styrka säkrare än målskillnaden, eftersom slumpen i avsluten spelar mindre roll.',
    get: xgd, cls: 'num', in: ['xg'], show: (t) => delta(xgd(t), { d: 2, dead: 0.005 }) },
  { key: 'dxg', label: 'Gjorda', sub: 'mål mot xG', name: 'Gjorda mål mot xG',
    title: 'Gjorda mål minus xG under säsongen. Plus (grönt) = fler mål än chanserna brukar ge – bra avslut eller tur. Stora avvikelser brukar jämna ut sig.',
    get: (t) => { const x = fdOf(t, 'xg'); return x ? x.gf - x.f : null; }, cls: 'num', in: ['xg'],
    show: (t) => { const x = fdOf(t, 'xg'); return delta(x ? x.gf - x.f : null, { d: 1 }); } },
  { key: 'dxga', label: 'Insläppta', sub: 'mål mot xG', name: 'Insläppta mål mot xG',
    title: 'Insläppta mål minus motståndarnas xG under säsongen. Minus (grönt) = färre insläppta än chanserna brukar ge – bra målvakt eller tur. Plus (rött) = fler än väntat.',
    get: (t) => { const x = fdOf(t, 'xg'); return x ? x.ga - x.a : null; }, cls: 'num', asc: true, in: ['xg'],
    show: (t) => { const x = fdOf(t, 'xg'); return delta(x ? x.ga - x.a : null, { d: 1, invert: true }); } },
  { key: 'xpd', label: 'Poäng', sub: 'mot chanserna', name: 'Poäng mot chanserna',
    title: 'Tagna poäng minus de poäng lagets chanser brukar ge. Varje match räknas om till chanser att vinna och spela oavgjort ur båda lagens xG, och ger 3 × vinstchansen + oavgjortchansen. Plus (grönt) = fler poäng än chanserna var värda – oftast tur, som brukar jämna ut sig. Minus (rött) = färre.',
    get: xpd, cls: 'num', in: ['xg'], show: (t) => delta(xpd(t), { d: 1 }) },
  { key: 'xdr', label: 'Kryss', sub: 'enligt chanserna', name: 'Krysschans',
    title: 'Chansen att lagets matcher skulle sluta oavgjort, i snitt, räknat ur båda lagens xG. Högt = jämna matcher med få chanser, där krysset ligger nära.',
    get: xdraw, pct: true, cls: 'num hide-xs', in: ['xg'] },
  { key: 'opp', label: 'Motstånd', sub: 'hittills', name: 'Motståndets styrka hittills',
    title: 'Hur starka motståndarna har varit jämfört med ett normalt spelschema i divisionen, i mål per match enligt prognosmodellen. Plus = svårare motstånd än snittet, minus = lättare. Bra att ha med när xG-siffrorna jämförs.',
    get: (t) => fdOf(t, 'opp'), cls: 'num hide-xs', in: ['xg'],
    show: (t) => (fdOf(t, 'opp') == null ? cell(null) : `<span class="dv-even">${signed(fdOf(t, 'opp'), 2)}</span>`) },
  { key: 'str', label: 'Styrka', sub: 'enligt modellen', name: 'Modellens styrka',
    title: 'Prognosmodellens bedömning: väntad målskillnad per match mot ett snittlag i divisionen på neutral plan. Tar hänsyn till motståndet och till tidigare säsonger med mindre vikt, och är samma styrka som ger prognoserna.',
    get: (t) => t.str, cls: 'num', in: ['xg'], show: (t) => delta(t.str, { d: 2, dead: 0.005 }) },

  { key: 'shf', label: 'Skott', sub: 'per match', name: 'Skott per match', title: 'Lagets avslut per match – även de som går utanför eller blockeras.',
    get: (t) => per(fdOf(t, 'sh'), 'f'), d: 1, cls: 'num', in: ['spelet'] },
  { key: 'sha', label: 'Skott mot', sub: 'per match', name: 'Skott mot per match', title: 'Motståndarnas avslut per match. Lägre är bättre.',
    get: (t) => per(fdOf(t, 'sh'), 'a'), d: 1, cls: 'num', asc: true, in: ['spelet'] },
  { key: 'sotf', label: 'På mål', sub: 'per match', name: 'Skott på mål per match', title: 'Lagets skott per match som hade gått in om målvakten inte räddat.',
    get: (t) => per(fdOf(t, 'sh'), 'of'), d: 1, cls: 'num hide-xs', in: ['spelet'] },
  { key: 'ycm', label: 'Gula', sub: 'per match', name: 'Gula kort per match', title: 'Lagets gula kort per match. Den som visas ut efter två gula kort har fått två gula och ett rött.',
    get: (t) => per(fdOf(t, 'cards'), 'y'), d: 2, cls: 'num', in: ['spelet'] },

  // Oddsen läses från vänster: hur ofta laget var favorit, vad oddsen
  // väntade sig, vad laget tog, skillnaden och vad ett spel på laget gav.
  { key: 'fav', label: 'Favorit', sub: 'andel matcher', name: 'Favorit enligt oddsen',
    title: 'Hur ofta laget hade större chans än motståndaren att vinna, enligt spelbolagens odds före avspark. 100 % = favorit i varje match, 0 % = aldrig favorit.',
    get: (t) => { const m = fdOf(t, 'mkt'); return m ? m.fav / m.n : null; }, pct: true, cls: 'num hide-xs', in: ['marknaden'] },
  { key: 'mxp', label: 'Väntat', sub: 'poäng enligt oddsen', name: 'Väntade poäng',
    title: 'Så många poäng oddsen räknade med att laget skulle ta. Före varje match görs oddsen om till chanser (utan spelbolagens påslag), och matchen ger 3 × vinstchansen + oavgjortchansen. Exempel: 60 % vinst och 25 % oavgjort = 2,05 poäng.',
    get: (t) => (fdOf(t, 'mkt') ? fdOf(t, 'mkt').xp : null), d: 1, cls: 'num', in: ['marknaden'] },
  { key: 'mpts', label: 'Tog', sub: 'poäng', name: 'Tagna poäng',
    title: 'Poängen laget faktiskt tog i samma matcher. Kan vara färre än i tabellen – oddsen kommer ibland en omgång efter.',
    get: (t) => (fdOf(t, 'mkt') ? fdOf(t, 'mkt').pts : null), cls: 'num', in: ['marknaden'] },
  { key: 'vso', label: 'Mot oddsen', sub: 'poäng över/under', name: 'Poäng mot oddsen',
    title: 'Tagna minus väntade poäng. Plus (grönt) = laget har tagit fler poäng än oddsen trodde. Minus (rött) = färre än väntat.',
    get: vsOdds, cls: 'num', in: ['marknaden'], show: (t) => delta(vsOdds(t), { d: 1 }) },
  { key: 'roi', label: 'Spel på seger', sub: 'vinst på insatsen', name: 'Om man spelat på laget',
    title: 'Om man satsat lika mycket på att laget vinner varje match, till oddset före avspark: så mycket hade man vunnit (+) eller förlorat (−) av det man satsat. +50 % = varje hundralapp hade blivit 150 kr. Spelbolagens påslag är inräknat.',
    get: roi, cls: 'num', in: ['marknaden'], show: (t) => delta(roi(t), { dead: 0.005, fmt: signedPct }) },

  { key: 'goals', label: 'Mål', name: 'Mål av lagets spelare',
    title: 'Mål som ESPN har skrivit på lagets spelare. Självmål räknas inte, så summan kan vara lägre än i tabellen.',
    get: (t) => sqOf(t, 'goals'), cls: 'num', in: ['truppen'] },
  { key: 'scorer', label: 'Bäste målskytt', title: 'Spelaren med flest ligamål i laget, och antalet mål.',
    get: (t) => (t.sq && t.sq.topScorer ? t.sq.topScorer.g : null), cls: 'hide-sm', in: ['truppen'],
    show: (t) => (t.sq && t.sq.topScorer && t.sq.topScorer.g ? `${esc(t.sq.topScorer.name)} <b>${t.sq.topScorer.g}</b>` : '–') },
  { key: 'topScorerShare', label: 'Beroende', sub: 'andel av målen', name: 'Beroende av bäste målskytten',
    title: 'Hur stor del av lagets mål den bäste målskytten har gjort. Högt värde = laget hänger mycket på en enda spelare.',
    get: (t) => sqOf(t, 'topScorerShare'), cls: 'num', pct: true, in: ['truppen'] },
];

// A1 → 1, A2 → 2 … D2 → 32: grupperna i Nations Leagues ordning
const grpOrd = (g) => (String(g).charCodeAt(0) - 64) * 10 + (Number(String(g).slice(1)) || 0);

const teamsLoad = new Map(); // division → löfte om lagfilen
function loadTeams(div) {
  if (!teamsLoad.has(div)) {
    teamsLoad.set(div, getJSON(`data/teams/${div}.json`)
      .catch((err) => ({ unknown: true, reason: `lagstatistiken kunde inte läsas (${err.message})` })));
  }
  return teamsLoad.get(div);
}

function teamGroups(T, P) {
  return T_GROUPS.filter((g) => (g.needs !== 'xg' || T.hasXg) && (g.needs !== 'players' || (P && !P.unknown)));
}

function teamRows(T, P) {
  const sq = new Map(P && !P.unknown ? P.teams.map((x) => [x.espnId, x]) : []);
  return T.teams.map((t) => ({ ...t, sq: t.espnId ? sq.get(t.espnId) || null : null }));
}

// Lagen som topplistor, byggda som spelarnas: placeringen under namnet och
// Alla lag under listan – vad talet betyder står i rubrikens förklaring.
// Raderna öppnar lagkortet när det finns. Sju rader, så att korten blir
// lika höga som listorna åt två håll (som Kryssar gärna på anslagstavlan).
// who = raden, om underraden ska vara något annat än placeringen.
function teamTop(key, title, list, value, { tip, get, who = teamRow } = {}) {
  const rows = list.filter((t) => get(t) != null && Number.isFinite(get(t)))
    .sort((a, b) => get(b) - get(a) || a.rank - b.rank);
  return topCard(key, title, rows, value, { tip, empty: 'okänt', who, n: 7, all: true });
}

// En lista åt två håll, som Tur & otur och Slår oddsen på anslagstavlan: de
// tre högsta (plus) under det första ordet och de tre lägsta (minus) under
// det andra, med stapeln från mitten. Alla lag visar hela divisionen likadant.
function twoWay(key, title, list, get, { up, down, value, tip, tone = 'signed' }) {
  const known = list.filter((t) => get(t) != null && Number.isFinite(get(t)));
  const max = Math.max(...known.map((t) => Math.abs(get(t)))) || 1;
  const hi = known.filter((t) => get(t) > 0).sort((a, b) => get(b) - get(a) || a.rank - b.rank);
  const lo = known.filter((t) => !(get(t) > 0)).sort((a, b) => get(a) - get(b) || b.rank - a.rank);
  const half = (label, side, xs, n, cls = '') => `<p class="dv-lsub ${side}${tone === 'even' ? ' even' : ''}">${esc(label)}</p>` +
    (xs.length
      ? `<ol${cls ? ` class="${cls}"` : ''}>${xs.slice(0, n).map((t, i) => leaderLi(t, String(i + 1), value, teamRow, dbar(get(t) / max, tone))).join('')}</ol>`
      : '<p class="dv-lempty">Inget lag</p>');
  tops.set(key, { title, n: known.length, full: () => half(up, 'up', hi, Infinity, 'dv-toplist') + half(down, 'down', lo, Infinity, 'dv-toplist') });
  const body = known.length
    ? half(up, 'up', hi, 3) + half(down, 'down', lo.filter((t) => get(t) < 0), 3) + lmore(key, 'Alla lag')
    : '<ol><li class="dv-lempty">okänt</li></ol>';
  return `<section class="dv-leader dv-two"><h4${tipAttr(title, tip)}>${esc(title)}</h4>${body}</section>`;
}

function teamsView(dv, P, T) {
  if (!T || T.unknown) return `<p class="empty">${unknown(`okänt – ${T ? T.reason : 'ingen lagstatistik'}`)}</p>`;
  const land = isLand(dv.id);
  const groups = teamGroups(T, P);
  const f = state.tf;
  if (!groups.some((g) => g.id === f.cols)) Object.assign(f, { cols: 'tabell', sort: 'rank', dir: 1 });
  const all = teamRows(T, P);
  const cols = TCOLS.filter((c) => c.in.includes(f.cols) && (!c.land || land));
  const col = cols.find((c) => c.key === f.sort) || cols[0];
  const list = sortBy([...all], col, f.dir, (a, b) => a.rank - b.rank);
  const head = sortHead(cols, f, 'data-tsort');
  // (landslagens zoner gäller gruppen och står på Tabeller)
  const body = list.map((t) => `<tr class="${t.espnId && P && !P.unknown ? 'dv-trow' : ''} ${!land && zoneOf(t.note) ? zoneOf(t.note).cls : ''}"` +
    `${t.espnId && P && !P.unknown ? ` data-team="${esc(t.espnId)}" tabindex="0"` : ''}>${cols.map((c) => colCell(c, t)).join('')}</tr>`).join('');

  const S = T.source.stats;
  // (landslagen: siffrorna från 365Scores och oddsen från DraftKings)
  const fd = `${esc(S.provider || 'football-data.co.uk')}, ${int(S.matches)} matcher t.o.m. ${S.last ? esc(dateLabel(S.last)) : 'okänt'}`;
  const src = {
    tabell: `Tabell: ${esc(T.source.table.provider)}, hämtat ${when(T.source.table.fetchedAt)} · nollor: ${fd}`,
    xg: `xG: ${fd}${T.source.strength ? ` · motståndet: prognosmotorns styrka t.o.m. ${esc(dateLabel(T.source.strength.fitThrough))}` : ''}`,
    spelet: fd,
    marknaden: T.source.odds ? `Odds vid avspark: ${esc(T.source.odds.provider)}, ${int(T.source.odds.matches)} matcher` : `Odds vid avspark, snittet hos spelbolagen: ${fd}`,
    truppen: P && !P.unknown ? `ESPN-trupperna, hämtat ${when(P.source.fetchedAt)}` : '',
  }[f.cols];

  // Topplistorna är anslagstavlans lappar i tobaksaffären (borttagen 2026-11-14),
  // med samma namn, i samma ordning och ur samma tal: Formen, Starkast,
  // Kryssar gärna, Tur & otur, Slår oddsen och Motståndet. Skadelistan står
  // i lagkortet (Frånvaro), och vilan hör till omgången.
  const opp = (t) => fdOf(t, 'opp');
  tops.clear();
  const leaders =
    // Formen: rutorna under namnet i stället för placeringen, och poängen i
    // de fem matcherna till höger – så att namnen får plats.
    teamTop('form', 'Formen', all, (t) => `<b>${formPts(teamForm(t.name))} p</b>`, {
      get: (t) => formPts(teamForm(t.name)), who: (t) => ({ ...teamRow(t), subHtml: formChips(teamForm(t.name), t.name) }),
      tip: `${FORM_TIP} Flest poäng i de fem överst (3 för vinst, 1 för oavgjort).` }) +
    // (landslagen har ingen styrka i modellen, som bara känner lagen i
    // England: där är det xG-skillnaden per match, som inte väger in ligan)
    (land ? twoWay('styrka', 'xG-skillnad', all, xgd, {
      up: 'Bäst', down: 'Sämst', value: (t) => `<b>${delta(xgd(t), { d: 2, dead: 0.005 })}</b>`,
      tip: 'xG-skillnaden per match i Nations League: lagets chanser minus motståndarnas. Ligorna A–D är olika starka.' })
      : twoWay('styrka', 'Starkast & svagast', all, (t) => t.str, {
        up: 'Starkast', down: 'Svagast', value: (t) => `<b>${delta(t.str, { d: 2, dead: 0.005 })}</b>`,
        tip: 'Modellens väntade målskillnad per match mot ett snittlag i divisionen, med motståndet inräknat.' })) +
    teamTop('kryss', 'Kryssar gärna', all, (t) => `<b>${pct(xdraw(t))}</b>`,
      { get: xdraw, tip: 'Chansen till oavgjort i lagets matcher, i snitt, räknat ur båda lagens xG.' }) +
    twoWay('tur', 'Tur & otur', all, xpd, {
      up: 'Tur', down: 'Otur', value: (t) => `<b>${delta(xpd(t), { d: 1 })}</b>`,
      tip: 'Poäng mot chanserna: tagna poäng minus de poäng lagets chanser (xG) brukar ge. Tur = fler poäng än chanserna var värda, otur = färre. Brukar jämna ut sig.' }) +
    twoWay('odds', 'Mot oddsen', all, vsOdds, {
      up: 'Slår oddsen', down: 'Sviker', value: (t) => `<b>${delta(vsOdds(t), { d: 1 })}</b>`,
      tip: 'Tagna poäng minus de poäng oddsen vid avspark väntade sig. Slår oddsen = fler poäng än väntat, sviker = färre.' }) +
    // (landslagen: hur ofta laget har varit favorit i stället för motståndet)
    (land ? teamTop('favorit', 'Favorit oftast', all, (t) => `<b>${pct(fdOf(t, 'mkt').fav / fdOf(t, 'mkt').n)}</b>`, {
      get: (t) => { const m = fdOf(t, 'mkt'); return m && m.n ? m.fav / m.n : null; },
      tip: 'Andelen matcher där laget hade större chans än motståndaren att vinna, enligt oddsen före avspark.' })
      : twoWay('motstand', 'Motståndet', all, opp, {
        up: 'Tufft hittills', down: 'Lätt hittills', tone: 'even', value: (t) => `<b class="dv-even">${signed(opp(t), 2)}</b>`,
        tip: 'Motståndarnas styrka hittills mot ett normalt spelschema i divisionen, i mål per match enligt prognosmodellen. Tufft = svårare motstånd än snittet, lätt = lättare.' }));

  return '<div class="dv-leaders">' + leaders + '</div>' +
    card('Alla lag', {
      body: segHtml(groups, f.cols, 'data-tcols') +
        `<div class="table-wrap dv-tw"><table class="dv-teams dv-league">${head}<tbody>${body}</tbody></table></div>`,
      src,
      cls: 'dv-wide',
    });
}

// ---------- spelarkort och lagkort (dialog) ----------

// Alla statistikrutor byggs av samma delar, så att de ser likadana ut:
// huvudet (märke, namn, underrad), nyckeltalen i en list, flikar, avsnitt
// med en rubrik och siffror i jämna kolumner, mätare för andelar och
// chanser, och sist knappar. Källraderna syns bara med Visa detaljer, som
// på sidan.

function dialog() {
  let d = document.getElementById('dv-modal');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'dv-modal';
    d.className = 'dv-modal';
    // spelarkortet i rummet är ett lager för bakåt (rum-bak.js), hur det än stängs
    d.addEventListener('close', () => { if (window.RumBak) RumBak.bort('spelarkort'); });
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) d.close();
      const t = e.target.closest('[data-mtab]');
      if (t) { selectMtab(t.dataset.mtab); return; }
      const p = e.target.closest('[data-pid]');
      if (p && d.contains(p)) { openPlayer(p.dataset.pid); return; }
      const tm = e.target.closest('[data-team]');
      if (tm && d.contains(tm)) openTeam(tm.dataset.team);
    });
    // Piltangenterna mellan flikarna.
    d.addEventListener('keydown', (e) => {
      const t = e.target.closest('[data-mtab]');
      if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const all = [...t.parentElement.children];
      const i = all.indexOf(t);
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
      e.preventDefault();
      selectMtab(all[j].dataset.mtab, true);
    });
    document.body.appendChild(d);
  }
  return d;
}

function showModal(html) {
  const d = dialog();
  d.innerHTML = `<div class="dv-mbox"><button type="button" class="dv-mclose" data-close aria-label="Stäng">×</button>${html}</div>`;
  if (!d.open) {
    d.showModal();
    if (window.RumBak) RumBak.fram('spelarkort', () => d.close());
  }
  d.scrollTop = 0;
  const box = d.querySelector('.dv-mbox');
  if (!box) return;
  box.scrollTop = 0;
  // Flikarna fastnar överst när man rullar; först då får de bakgrund.
  const tabs = box.querySelector('.dv-mtabs');
  if (tabs) box.addEventListener('scroll', () => tabs.classList.toggle('stuck', box.scrollTop > tabsTop(box)), { passive: true });
}

// Var flikarna står när rutan inte är rullad: ovanför den synliga fliken.
function tabsTop(box) {
  const pane = box.querySelector('.dv-mpane:not([hidden])');
  return pane ? pane.offsetTop - box.querySelector('.dv-mtabs').offsetHeight - parseFloat(getComputedStyle(box).paddingTop) : 0;
}

// Flikarna: [id, etikett (html), innehåll (html), rubrik om fliken står
// ensam]. Tomma flikar faller bort, och blir bara en kvar står den som ett
// vanligt avsnitt. Fliken man senast valde väljs igen (per sorts ruta), så
// att man kan gå från lag till lag och stanna i Truppen; pick väljer en
// bestämd flik utan att komma ihåg den.
function mtabs(kind, label, panes, pick) {
  const xs = panes.filter((x) => x && x[2]);
  if (xs.length < 2) return xs.map(([, name, html, title]) => msec(title || name, html)).join('');
  const want = pick || state.mtab[kind];
  const cur = xs.some(([id]) => id === want) ? want : xs[0][0];
  return `<div class="dv-mtabs" role="tablist" aria-label="${esc(label)}" data-kind="${kind}">${xs.map(([id, name]) =>
    `<button type="button" role="tab" id="dv-mtab-${id}" data-mtab="${id}" aria-controls="dv-mpane-${id}" aria-selected="${id === cur}"${id === cur ? '' : ' tabindex="-1"'}>${name}</button>`).join('')}</div>` +
    xs.map(([id, , html]) => `<div class="dv-mpane" id="dv-mpane-${id}" role="tabpanel" aria-labelledby="dv-mtab-${id}"${id === cur ? '' : ' hidden'}>${html}</div>`).join('');
}

function selectMtab(id, focus) {
  const box = dialog().querySelector('.dv-mbox');
  const list = box && box.querySelector('.dv-mtabs');
  if (!list) return;
  state.mtab[list.dataset.kind] = id;
  // Har man rullat förbi flikarna börjar den nya fliken överst.
  const top = tabsTop(box);
  const past = box.scrollTop > top;
  for (const b of list.children) {
    const on = b.dataset.mtab === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus({ preventScroll: true });
    if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  for (const p of box.querySelectorAll('.dv-mpane')) p.hidden = p.id !== `dv-mpane-${id}`;
  if (past) box.scrollTop = top;
}

const divName = () => (isLand(state.div) ? 'Nations League' : state.data.divisions.find((x) => x.id === state.div).name);

// Huvudet: märket (tröjnummer eller lagets två första bokstäver), namnet och
// underrader som redan är escapade. Med photo står spelarens bild i ringen och
// tröjnumret i hörnet; går bilden inte att ladda blir det märket som förut.
// Med shield (lagets sköld) står skölden i stället för märket.
function mhead(badge, title, subs, cls = '', photo = '', shield = '') {
  const shirt = /^\d+$/.test(badge || '') ? ' class="dv-shirt"' : '';
  const av = shield
    ? `<div class="dv-avatar${cls} crest">${shield}</div>`
    : photo
    ? `<div class="dv-avatar photo${cls}"><img src="${esc(photo)}" alt="" onerror="this.parentNode.classList.remove('photo');this.remove()"><span${shirt}>${esc(badge)}</span></div>`
    : badge ? `<div class="dv-avatar${cls}">${esc(badge)}</div>` : '';
  return '<div class="dv-mhead">' + av +
    `<div><h3>${esc(title)}</h3>${subs.filter(Boolean).map((s) => `<p>${s}</p>`).join('')}</div></div>`;
}

// Spelarens bild hos 365Scores ([athleteId, imageVersion] ur spelarfilen).
const photoUrl = (ph) => (ph ? `https://imagecache.365scores.com/image/upload/f_png,w_100,h_100,c_limit,q_auto:eco,dpr_2/v${ph[1]}/Athletes/${ph[0]}` : '');

// Nyckeltalen: högst fyra, [värde (html), etikett, förklaring].
function kpis(list) {
  const xs = list.filter(Boolean);
  return `<div class="dv-kpis" style="--n:${xs.length}">${xs.map(([v, label, tip]) =>
    `<div${tip ? ` title="${esc(tip)}"` : ''}><b>${v}</b><span>${esc(label)}</span></div>`).join('')}</div>`;
}

// Siffrorna i ett avsnitt: [värde (html), etikett, förklaring].
function facts(list) {
  return `<dl class="dv-mfacts">${list.filter(Boolean).map(([v, label, tip]) =>
    `<div${tip ? ` title="${esc(tip)}"` : ''}><dt>${esc(label)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

// Mätare för andelar och chanser (0–1). label och sub är html; med pid går
// raden att klicka till spelarkortet.
function meters(list) {
  return `<ul class="dv-meters">${list.map((m) => {
    // en liten men verklig chans syns som en strimma, noll som ingenting
    const w = !(m.v > 0) ? 0 : Math.max(1, Math.min(1, m.v) * 100);
    const inner = `<span class="dv-meter-label">${m.label}${m.sub ? `<small>${m.sub}</small>` : ''}</span>` +
      `<span class="dv-meter"${m.color ? ` style="--c:${m.color}"` : ''}><i style="width:${w.toFixed(1)}%"></i></span>` +
      `<b>${m.text}</b>`;
    return `<li>${m.pid ? `<button type="button" class="dv-meter-row" data-pid="${esc(m.pid)}">${inner}</button>`
      : `<div class="dv-meter-row">${inner}</div>`}</li>`;
  }).join('')}</ul>`;
}

// Ett avsnitt: rubrik med valfri länk till höger och innehåll. Utan
// rubrik när fliken redan säger vad det är.
function msec(title, body, { link } = {}) {
  return '<section class="dv-msec">' + (title ? `<h5 class="dv-h5"><span>${esc(title)}</span>` +
    (link ? `<a class="dv-mlink" href="${esc(link[0])}">${esc(link[1])}</a>` : '') + '</h5>' : '') + body + '</section>';
}

// Sist i rutan: källraderna (med Visa detaljer) och knapparna.
function mfoot(srcs, buttons = '') {
  const s = showSources() ? srcs.filter(Boolean) : [];
  if (!s.length && !buttons) return '';
  return `<div class="dv-mfoot">${s.map((x) => `<p class="dv-msrc">${x}</p>`).join('')}${buttons}</div>`;
}

const unsure = (v, why) => `<span class="dv-unq" title="${esc(why)}">${v}</span>`;
const cardsVal = (p) => `${p.yc ? `<i class="dv-card-y" aria-label="gula"></i>${p.yc}` : ''}${p.rc ? ` <i class="dv-card-r" aria-label="röda"></i>${p.rc}` : ''}`;

function playerById(id) {
  const P = state.players.get(state.div);
  return P && !P.unknown ? P.players.find((p) => p.id === id) : null;
}

function openPlayer(id) {
  const p = playerById(id);
  if (!p) return;
  const P = state.players.get(state.div);
  const team = P.teams.find((t) => t.espnId === p.teamId);
  const avail = P.availability && !P.availability.unknown ? P.availability[p.teamId] : null;
  const mv = p.pos === 'MV';
  const initials = p.jersey || p.name.split(/\s+/).map((x) => x[0]).slice(0, 2).join('');
  let html = mhead(initials, p.name, [
    [p.team, POS[p.pos]].filter(Boolean).map(esc).join(' · '),
    [natSv(p.nat), p.age != null ? `${p.age} år` : null].filter(Boolean).map(esc).join(' · '),
  ], '', photoUrl(p.ph));

  // Skadad, avstängd eller tveksam: överst, i FPL:s ord (på svenska).
  if (avail && !avail.unknown) {
    const last = p.name.split(/\s+/).pop().toLowerCase();
    const hit = avail.players.find((x) => x.name.toLowerCase().includes(last));
    if (hit) {
      const what = hit.news || `${hit.status}${hit.chance != null ? ` · ${hit.chance} % chans att spela` : ''}`;
      html += `<p class="dv-avail${hit.status === 'tveksam' ? '' : ' out'}">${esc(what.charAt(0).toUpperCase() + what.slice(1))}</p>`;
    }
  }

  // Flikarna: Matcherna, sedan Anfall och Försvar (målvakten: I målet).
  // Nyckeltalen står ovanför och följer med.
  const panes = [];
  if (p.noStats) {
    html += `<p class="dv-calm">${unknown('Ingen statistik hos ESPN i år')}</p>`;
  } else {
    const full = p.min >= TH.min;
    html += kpis([
      [cell(p.app), 'Matcher'],
      p.min != null ? [cell(p.min), 'Minuter'] : [cell(p.starts), 'Från start'],
      mv ? [p.savePct == null ? '–' : pct(p.savePct), 'Räddnings­procent', 'Räddningar delat med skotten på mål som målvakten mött']
        : [cell(p.g, { strong: true }), 'Mål'],
      mv ? [cell(p.gc), 'Insläppta'] : [cell(p.a), 'Assist'],
    ]);
    panes.push(['matcher', 'Matcherna', msec(null, facts([
      p.rt != null ? [p.rn < TH.rated ? unsure(num(p.rt, 1), 'Osäker siffra: färre än tre matcher med betyg') : `<b>${num(p.rt, 1)}</b>`,
        `Betyg i ${p.rn} ${p.rn === 1 ? 'match' : 'matcher'}`, 'Snittet av spelarens betyg från 365Scores, 1–10. En vanlig insats ger runt 6,7'] : null,
      p.rt != null && p.rb ? [cell(p.rb), 'Bäst på plan', 'Matcher där spelaren fick högst betyg av alla på planen'] : null,
      p.min != null ? [cell(p.starts), 'Från start'] : null,
      [p.app != null && p.starts != null ? cell(p.app - p.starts) : cell(null), 'Inhopp'],
      p.min != null && p.app ? [`${int(p.min / p.app)} min`, 'Speltid per match'] : null,
      [p.yc || p.rc ? cardsVal(p) : cell(p.yc == null ? null : 0), 'Kort'],
      [cell(p.fs), 'Fälld', 'Gånger spelaren har blivit fälld eller utsatt för en annan förseelse som domaren blåst för'],
      [cell(p.fc), 'Regelbrott', 'Regelbrott spelaren har begått som domaren blåst för'],
    ]))]);
    if (mv) {
      panes.push(['malet', 'I målet', msec(null, facts([
        [cell(p.sv), 'Räddningar'],
        [p.sv != null && p.gc != null ? cell(p.sv + p.gc) : cell(null), 'Skott på mål'],
        [p.gc != null && p.app ? num(p.gc / p.app, 1) : '–', 'Insläppta per match'],
        p.cs != null ? [cell(p.cs), 'Hållna nollor'] : null,
      ]))]);
    } else {
      const conv = p.sh ? pct(p.g / p.sh) : '–';
      let att = msec('Mål och skott', facts([
        full ? [num(per90(goals90(p), p), 2), 'Mål per 90 min'] : [p.app ? num(p.g / p.app, 2) : '–', 'Mål per match'],
        [cell(p.sh), 'Skott'],
        [cell(p.sot), 'Skott på mål'],
        [p.sh && p.sh < TH.shots ? unsure(conv, 'Osäker siffra: färre än tio skott') : conv, 'Mål per skott'],
      ]) + (team && team.goals && p.g
        ? meters([{ label: 'Andel av lagets mål', sub: `${p.g} av ${team.goals}`, v: p.g / team.goals, text: pct(p.g / team.goals) }])
        : ''));
      // Målens betydelse och sort ur matchrapporterna – sorten bara där den finns.
      if (p.g && p.gw != null) {
        const pens = (p.gpen || 0) + (p.pmiss || 0);
        att += msec('Målen', facts([
          [cell(p.gw, { strong: true }), 'Segermål', 'Mål som avgjorde en vunnen match: målet som gav laget den ledning det sedan aldrig tappade'],
          [cell(p.gpts), 'Poäng åt laget', 'Poängen laget hade tappat utan spelarens mål'],
          [cell(p.g1), 'Matchens första'],
          [cell(p.glate), 'Från 80:e minuten'],
          p.gpen != null && pens ? [`${p.gpen} av ${pens}`, 'Straffar', 'Straffmål av slagna straffar'] : null,
          p.gsub ? [cell(p.gsub), 'Som inhoppare'] : null,
        ]));
      } else if (p.pmiss) {
        att += msec('Målen', facts([['0 av ' + p.pmiss, 'Straffar', 'Straffmål av slagna straffar']]));
      }
      if (p.xg != null) {
        att += msec('Chanserna', facts([
          [num(p.xg, 1), 'xG', 'Förväntade mål: hur många mål spelarens skott brukar ge'],
          [delta(dxgOf(p), { d: 1 }), 'Mål mot xG', 'Gjorda mål minus xG – plus är fler mål än chanserna brukar ge'],
          [num(p.xa, 1), 'xA', 'Förväntade assist: hur många mål passningarna före lagkamraternas skott brukar ge'],
          full ? [num(per90(p.xg, p), 2), 'xG per 90 min'] : null,
        ]));
      }
      panes.push(['anfall', 'Anfall', att]);
      if (p.tk != null) {
        panes.push(['forsvar', 'Försvar', msec(null, facts([
          [cell(p.tk), 'Tacklingar'],
          [cell(p.cbi), 'Rensningar m.m.', 'Rensningar, täckningar och brytningar'],
          [cell(p.rec), 'Bollvinster', 'Lösa bollar spelaren har tagit hand om åt laget'],
          p.min >= TH.min && p.cbi != null ? [num(per90(p.tk + p.cbi, p), 1), 'Insatser per 90 min', 'Tacklingar, rensningar, täckningar och brytningar per 90 minuters speltid'] : null,
        ]))]);
      }
    }
  }
  // Laget med och utan honom från start, också för den som inte spelat i år.
  if (p.mu) panes.push(['medutan', 'Med och utan', medUtan(p), 'Med och utan honom']);
  html += mtabs('player', 'Om spelaren', panes);
  html += mfoot([], `<button type="button" class="dv-mbtn" data-team-open="${esc(p.teamId)}">Truppen i ${esc(p.team)} →</button>`);
  showModal(html);
}

// Hur laget har gått i ligan med och utan spelaren i startelvan, under hans
// tid i laget (src/medochutan.js): matcherna, poängen per match och poängen
// per match mot vad oddsen vid avspark räknade med. Mot oddsen tar hänsyn
// till att stjärnorna oftare vilar mot de svaga lagen.
const fMonth = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric', timeZone: 'UTC' });
function medUtan(p) {
  const since = fMonth.format(new Date(`${p.mu.fran}-15T12:00Z`));
  const side = ([n, w, d, l, , , xp], title) => {
    const pm = (3 * w + d) / n;
    return msec(title, facts([
      [cell(n), 'Matcher', `Ligamatcher för ${p.team} sedan ${since}`],
      [`${w}–${d}–${l}`, 'V–O–F', 'Vunna, oavgjorda och förlorade'],
      [num(pm, 2), 'Poäng per match'],
      [delta(pm - xp / n, { d: 2 }), 'Mot oddsen', `${num(pm, 2)} poäng per match, ${num(xp / n, 2)} väntade enligt oddsen vid avspark`],
    ]));
  };
  return side(p.mu.m, 'Med honom från start') + side(p.mu.u, 'Utan honom från start');
}

// Alla matcher, även cuperna (data/matches.json): spoilerskyddet har dem
// redan eller hämtar dem.
function allMatches() {
  if (window.Spoiler) return Spoiler.matches();
  return getJSON('data/matches.json').then((d) => d.matches, () => []);
}

async function openTeam(id, pick) {
  const P = state.players.get(state.div);
  if (!P || P.unknown) return;
  const land = isLand(state.div);
  const [T, all, , , L] = await Promise.all([loadTeams(state.div), allMatches(), window.Skoldar && Skoldar.ready, loadForm(), land ? loadLand() : null, land ? loadLandMatches() : null]);
  const t = P.teams.find((x) => x.espnId === id);
  if (!t) return;
  // Ett landslag: tabellraden ur lagfilen (platsen i gruppen) och zonen som på Tabeller
  const tl = land && T && !T.unknown ? T.teams.find((x) => x.espnId === id) : null;
  const lt = land && L && !L.unknown ? L.lag.find((x) => x.espnId === id) : null;
  const r = tl ? { rank: tl.rank, points: tl.pts, gf: tl.gf, ga: tl.ga, played: tl.m, note: null } : P.table ? P.table.rows.find((x) => x.espnId === id) : null;
  const squad = P.players.filter((p) => p.teamId === id)
    .sort((a, b) => (POS_ORDER[a.pos] ?? 9) - (POS_ORDER[b.pos] ?? 9) || (b.app || 0) - (a.app || 0) || a.name.localeCompare(b.name, 'sv'));
  const z = land ? (tl && tl.liga ? landZone(landLegend(L), tl.liga, tl.rank) : null) : r && zoneOf(r.note);
  // skölden som i tabellen, initialerna bara när laget saknar sköld
  let html = mhead(t.name.slice(0, 2).toUpperCase(), t.name,
    [[land && tl && tl.grupp ? `Nations League, grupp ${tl.grupp}` : divName(), r ? `${ordinal(r.rank)} plats` : null, z ? z.label : null].filter(Boolean).map(esc).join(' · ')], ' team',
    '', window.Skoldar && Skoldar.has(t.name) ? teamCrest(t.name) : '');
  const f = teamForm(t.name);
  html += kpis([
    r ? [cell(r.points, { strong: true }), 'Poäng'] : null,
    r ? [`${r.gf}–${r.ga}`, 'Mål'] : null,
    f.length ? [formChips(f, t.name, { title: true }), 'Form', FORM_TIP] : null,
  ]);
  // Flikarna: Spelet, Truppen, Frånvaro och Höjdpunkter. Poängen, målen och
  // formen står ovanför och följer med. Spelet har det som kortregistret i
  // tobaksaffären har om ett lag – nästa match, målen och xG för och mot,
  // hur ofta laget varit favorit – och formen match för match, och sedan
  // lagets tal från anslagstavlan (Tur & otur, Kryssar gärna, Mot oddsen,
  // Starkast och Motståndet) under samma namn som i tabellen Alla lag.
  const tt = T && !T.unknown ? T.teams.find((x) => x.espnId === id) : null;
  let game = '';
  const nx = teamNext(t.name);
  if (nx) game += msec('Nästa match', nextMatch(t.name, nx));
  if (f.length) game += msec('Formen', formList(t.name, f));
  const x = tt && tt.fd ? tt.fd.xg : null;
  const m = tt && tt.fd ? tt.fd.mkt : null;
  const link = [viewHref(state.div, 'lag'), 'Alla lag'];
  if ((r && r.played) || x) {
    game += msec('Målen och chanserna', facts([
      r && r.played ? [num(r.gf / r.played, 2), 'Mål per match', 'Gjorda mål per match i ligan'] : null,
      x ? [num(x.f / x.n, 2), 'xG per match', 'Förväntade mål per match – hur bra chanser laget skapar'] : null,
      r && r.played ? [num(r.ga / r.played, 2), 'Insläppta per match', 'Insläppta mål per match i ligan'] : null,
      x ? [num(x.a / x.n, 2), 'xG mot per match', 'Motståndarnas förväntade mål per match'] : null,
    ]), { link });
  }
  if (x || m) {
    game += msec('Mot chanserna och oddsen', facts([
      x ? [delta(x.pts - x.xp, { d: 1 }), 'Poäng mot chanserna', `Tur & otur: ${x.pts} poäng, ${num(x.xp, 1)} enligt chanserna (xG)`] : null,
      x ? [pct(x.xd / x.n), 'Kryss enligt chanserna', `Kryssar gärna: ${x.d} kryss på ${x.n} matcher`] : null,
      m ? [delta(m.pts - m.xp, { d: 1 }), 'Poäng mot oddsen', `Mot oddsen: ${m.pts} poäng, ${num(m.xp, 1)} väntade enligt oddsen vid avspark`] : null,
      m ? [`${m.fav}<small>av ${m.n}</small>`, 'Favorit', 'Matcher där laget hade större chans än motståndaren att vinna, enligt oddsen före avspark'] : null,
    ]));
  }
  const op = tt && tt.fd ? tt.fd.opp : null;
  if (tt && (tt.str != null || op != null)) {
    game += msec('Modellen', facts([
      tt.str != null ? [delta(tt.str, { d: 2, dead: 0.005 }), 'Styrka enligt modellen', 'Väntad målskillnad per match mot ett snittlag i divisionen, med motståndet inräknat'] : null,
      op != null ? [`<span class="dv-even">${signed(op, 2)}</span>`, 'Motstånd hittills', 'Motståndarnas styrka mot ett normalt spelschema i divisionen, i mål per match. Plus = tuffare än snittet'] : null,
    ]));
  }

  let scorer = '';
  if (t.topScorer && t.topScorer.g && t.goals) {
    const ts = squad.find((p) => p.name === t.topScorer.name);
    scorer = meters([{ label: `<b>${esc(t.topScorer.name)}</b>`, sub: `Bäste målskytt · ${t.topScorer.g} av ${t.goals} mål`,
      v: t.topScorerShare, text: pct(t.topScorerShare), pid: ts && ts.id }]);
  }
  const squadHtml = msec(null, scorer + '<div class="table-wrap dv-tw"><table class="dv-squad"><thead><tr><th class="c">Pos</th><th class="c">#</th><th>Spelare</th>' +
    '<th class="num hide-xs">Ålder</th><th class="num">M</th><th class="num">Mål</th><th class="num">Ass</th><th class="num">Gul</th><th class="num">Röd</th></tr></thead><tbody>' +
    squad.map((p) => `<tr class="dv-prow${p.app ? '' : ' idle'}" data-pid="${esc(p.id)}" tabindex="0"><td class="c">${esc(p.pos || '–')}</td><td class="c muted">${esc(p.jersey || '')}</td>` +
      `<td>${esc(p.name)}<small class="dv-natline">${esc(natSv(p.nat) || '')}</small></td><td class="num hide-xs">${p.age ?? '–'}</td>` +
      `<td class="num">${cell(p.app)}</td><td class="num">${cell(p.g, { strong: true })}</td><td class="num">${cell(p.a)}</td><td class="num">${cell(p.yc)}</td><td class="num">${cell(p.rc)}</td></tr>`).join('') +
    '</tbody></table></div>');

  const av = P.availability && !P.availability.unknown ? P.availability[id] : null;
  const away = av && !av.unknown ? msec(null, av.players.length
    ? `<ul class="dv-inj">${av.players.map((x) => `<li class="${x.status === 'tveksam' ? 'doubt' : 'out'}">` +
      `<span><b>${esc(x.name)}</b> <small>${esc(x.pos || '')}</small></span><span class="dv-inj-st">${esc(x.status.charAt(0).toUpperCase() + x.status.slice(1))}</span>` +
      `${x.news ? `<span class="dv-inj-what">${esc(x.news)}</span>` : ''}</li>`).join('')}</ul>`
    : '<p class="dv-calm">Inga rapporterade.</p>') : '';

  // Höjdpunkterna i alla tävlingar (hojdpunkter.js).
  const hl = window.Hojdpunkter && Hojdpunkter.team ? Hojdpunkter.team(t.name, all) : null;

  html += mtabs('team', 'Om laget', [
    ['spelet', 'Spelet', game, 'Spelet hittills'],
    ['trupp', 'Truppen', squadHtml],
    // (landslagen: alla landskamper sedan hösten 2024, som på openLand)
    ...(lt ? [['landskamper', 'Landskamper', landBody(L, lt), 'Landskamperna sedan 2024']] : []),
    ['franvaro', `Frånvaro${away && av.players.length ? ` <small>${av.players.length}</small>` : ''}`, away, 'Skador och avstängningar'],
    ['hojdpunkter', `Höjdpunkter${hl && hl.n ? ` <small>${hl.n}</small>` : ''}`, hl && hl.html, 'Höjdpunkter'],
  ], pick);
  showModal(html);
}

// ---------- landslagen ----------
//
// Fliken Landslag efter de fyra divisionerna, på båda sidorna. Tabeller har
// Nations Leagues fjorton grupper (A1–D2). Statistik har sedan 2026-11-14
// Spelarna och Lagen som divisionerna, ur data/players/unl.json och
// data/teams/unl.json (spelarna, xG, skotten och oddsen i Nations League), och
// under Lagen formen och siffrorna för alla europeiska landslag sedan 2024.
// Data: data/landslag.json (src/landslag.js) och matchlistan
// (data/matches.json) för länkarna till matchrutan. Ett lag i Nations League
// öppnar samma lagruta som klubbarna, med landskamperna i en egen flik.
// Stryktipsets landskamper spelas på lördagen: grupperna och lagen som spelar
// då står först och är märkta.

const LAND = 'unl';
const LAND_COMPS = ['unl', 'emk', 'vsk'];
const LAND_DIV = { id: LAND, name: 'Landslag' };
const isLand = (id) => id === LAND;
let landLoad = null;
function loadLand() {
  if (!landLoad) landLoad = getJSON('data/landslag.json').catch((err) => ({ unknown: true, reason: err.message }));
  return landLoad;
}

const fDayTime = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit' });
const kick = (iso) => esc(fDayTime.format(new Date(iso)).replace(/^(\w)/, (c) => c.toUpperCase()));

// Stryktipsets dag: lördagen i veckan, och fram till måndag den som var.
function couponDay(now = Date.now()) {
  const d = new Date(`${fDay.format(new Date(now - 2 * 86400000))}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}
// Landskamperna på Stryktipsets dag.
function couponLand(L) {
  const day = couponDay();
  return (L.omgang || []).filter((m) => fDay.format(new Date(m.avspark)) === day)
    .sort((a, b) => a.avspark.localeCompare(b.avspark) || a.hemma.localeCompare(b.hemma, 'sv'));
}

// Zonerna i Nations League. ESPN skriver dem en gång per placering (bara i
// en grupp) och för alla ligor på en rad: "A: Qualifies for QFs; B-D:
// Promotion". Placeringens text läses för gruppens liga.
const LAND_ZONES = [
  { test: /qualif|quarter|QF/i, cls: 'z-eu', label: 'Kvartsfinal' },
  { test: /promotion play/i, cls: 'z-po', label: 'Kval till uppflyttning' },
  { test: /promotion/i, cls: 'z-up', label: 'Uppflyttning' },
  { test: /relegation or play/i, cls: 'z-down', label: 'Nedflyttning eller kval' },
  { test: /relegation play/i, cls: 'z-po', label: 'Kval mot nedflyttning', down: true },
  { test: /relegation/i, cls: 'z-down', label: 'Nedflyttning' },
];
function landLegend(L) {
  const byRank = new Map();
  for (const g of L.grupper) for (const r of g.lag) if (r.note && !byRank.has(r.rank)) byRank.set(r.rank, r.note);
  return byRank;
}
function landZone(legend, liga, rank) {
  const note = legend.get(rank);
  if (!note || !liga) return null;
  for (const part of note.split(';')) {
    const m = /^\s*([A-D](?:\s*[-,]\s*[A-D])*)\s*:\s*(.+)$/.exec(part);
    if (!m) continue;
    const letters = new Set();
    for (const bit of m[1].split(',')) {
      const [a, b = a] = bit.split('-').map((x) => x.trim());
      for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) letters.add(String.fromCharCode(c));
    }
    if (letters.has(liga)) return LAND_ZONES.find((z) => z.test.test(m[2])) || null;
  }
  return null;
}

// Flaggan står i sköldarnas index under det svenska namnet.
const flagName = (name) => teamName(name);

function landMatchLink(m) {
  return `<a class="dv-lmatch" href="index.html#match/${esc(m.id)}"><span class="dv-lm-when">${kick(m.avspark)}</span>` +
    `<span class="dv-lm-teams">${esc(m.hemma)}–${esc(m.borta)}</span>` +
    (m.resultat && m.status !== 'STATUS_SCHEDULED' ? `<b class="dv-lm-res">${landHidden(m.id) ? '?' : `${m.resultat.home}–${m.resultat.away}`}</b>` : '') +
    '</a>';
}

function landTablesView(L) {
  if (!L || L.unknown || !L.grupper || !L.grupper.length) {
    return `<p class="empty">${unknown(`okänt – ingen tabell hämtad för Nations League${L && L.reason ? ` (${L.reason})` : ''}`)}</p>`;
  }
  const legend = landLegend(L);
  const lor = couponLand(L);
  const lorGroups = new Set(lor.map((m) => m.grupp).filter(Boolean));
  const groupCard = (g) => {
    const rows = g.lag.map((r) => ({ ...r, name: r.lag, zone: landZone(legend, g.liga, r.rank) }));
    const games = lor.filter((m) => m.grupp === g.id);
    return `<section class="card dv-card dv-tablecard dv-lgroup${games.length ? ' on' : ''}">` +
      `<h4>${esc(g.namn)}${games.length ? ' <span class="dv-ltag">Lördag</span>' : ''}</h4>` +
      leagueTable(rows, { attr: (r) => `data-land="${esc(r.espnId)}"` }) +
      (games.length ? `<div class="dv-lgames">${games.map(landMatchLink).join('')}</div>` : '') +
      '</section>';
  };
  const first = L.grupper.filter((g) => lorGroups.has(g.id));
  const rest = L.grupper.filter((g) => !lorGroups.has(g.id));
  const ligor = ['A', 'B', 'C', 'D'].map((l) => [l, rest.filter((g) => g.liga === l)]).filter(([, gs]) => gs.length);
  let html = '';
  if (first.length) {
    html += '<div class="dv-sechead"><h3>Lördagens grupper</h3><p>Där Stryktipsets landskamper spelas. Klicka på ett lag för formen och matcherna.</p></div>' +
      `<div class="dv-lgrid">${first.map(groupCard).join('')}</div>`;
  }
  html += ligor.map(([l, gs]) => `<div class="dv-sechead"><h3>Liga ${l}</h3></div><div class="dv-lgrid">${gs.map(groupCard).join('')}</div>`).join('');
  return html + `<p class="src-line">Tabell: ESPN, hämtat ${when(L.kalla && L.kalla.tabell)}. Zonerna enligt ESPN: vad placeringen ger när gruppspelet är klart.</p>`;
}

// Formrutorna för ett landslag: de fem senaste landskamperna, nyast till
// vänster, i samma rutor som klubbarnas. En dold match (spoilerskyddet) står
// som ?.
function landHidden(id) {
  const m = state.landById && state.landById.get(String(id));
  return !!(m && window.Spoiler && Spoiler.hidden(m));
}
const landTurn = (r) => r.turneringNamn || r.turnering || '';
function landRowText(r) {
  return `${shortDay(`${r.datum}T12:00:00Z`)} · ${landTurn(r)} · ${r.hemma ? 'hemma' : 'borta'} mot ${r.motstand} · ${r.mal[0]}–${r.mal[1]}` +
    (r.avgjord ? ` (avgjord på ${r.avgjord})` : '');
}
function landChips(list, { title = false } = {}) {
  if (!list.length) return '<span class="dv-nil" title="Inga spelade landskamper">–</span>';
  return `<span class="form dv-form">${list.map((r) => {
    const hid = landHidden(r.id);
    const l = hid ? '?' : r.utfall;
    const head = hid ? 'Dold' : FORM_RESULT[l];
    const text = hid ? 'Du har valt att dölja resultat.' : landRowText(r);
    const attr = title ? ` title="${esc(`${head}: ${text}`)}"` : ` data-tip-head="${esc(head)}" data-tip="${esc(text)}"`;
    return `<span class="${hid ? 'sp-form' : l}"${attr}>${esc(l)}</span>`;
  }).join('')}</span>`;
}
const LAND_FORM_TIP = 'De fem senaste landskamperna – Nations League, VM, VM-kvalet och vänskapsmatcherna – nyast till vänster: V = vinst, O = oavgjort, F = förlust. Ställningen efter 90 minuter gäller.';

// Ett landslags rad i tabellen Alla landslag.
const LAND_COLS = [
  { key: 'lag', label: 'Lag', cls: '', text: true, get: (t) => t.lag },
  { key: 'grupp', label: 'Grupp', cls: 'c', sub: 'NL', title: 'Gruppen i Nations League (NL)', text: true, get: (t) => t.grupp || 'Ö' },
  { key: 'form', label: 'Form', cls: '', sub: '5 senaste', title: LAND_FORM_TIP, get: (t) => t.senaste.slice(0, 5).reduce((s, r) => s + FORM_PTS[r.utfall], 0) },
  { key: 'nl', label: 'P', cls: 'num', sub: 'NL', title: 'Poängen i Nations League och placeringen i gruppen', get: (t) => (t.tabell ? t.tabell.points : null) },
  { key: 'm', label: 'M', cls: 'num', sub: 'sedan 2024', title: 'Landskamper sedan hösten 2024: Nations League, VM, VM-kvalet och vänskapsmatcherna', get: (t) => t.alla.matcher },
  { key: 'vof', label: 'V–O–F', cls: 'num', sub: 'poäng/match', title: 'Vunna, oavgjorda och förlorade landskamper sedan hösten 2024. Sorteras på poäng per match (3 för vinst, 1 för oavgjort).', get: (t) => (t.alla.matcher ? (3 * t.alla.v + t.alla.o) / t.alla.matcher : null) },
  { key: 'mal', label: 'Mål', cls: 'num hide-xs', sub: '+/−', title: 'Gjorda–insläppta mål i landskamperna sedan hösten 2024. Sorteras på målskillnaden.', get: (t) => t.alla.gjorda - t.alla.inslappta },
  { key: 'nollor', label: 'Nollor', cls: 'num hide-xs', title: 'Landskamper utan insläppt mål sedan hösten 2024', get: (t) => t.alla.nollor },
  { key: 'nasta', label: 'Nästa', cls: 'hide-xs', title: 'Nästa landskamp', text: true, get: (t) => (t.nasta ? t.nasta.datum : 'z') },
];

function landSort(list) {
  const { sort, dir } = state.lf;
  const c = LAND_COLS.find((x) => x.key === sort) || LAND_COLS[0];
  return [...list].sort((a, b) => {
    const x = c.get(a);
    const y = c.get(b);
    if (x == null && y == null) return a.lag.localeCompare(b.lag, 'sv');
    if (x == null) return 1;
    if (y == null) return -1;
    const d = c.text ? String(x).localeCompare(String(y), 'sv') : x - y;
    const rank = (t) => (t.tabell ? t.tabell.rank : 9);
    return d * dir || (c.key === 'grupp' ? rank(a) - rank(b) : 0) || a.lag.localeCompare(b.lag, 'sv');
  });
}

function landTeamRow(t, lorTeams) {
  const a = t.alla;
  const nx = t.nasta;
  const on = lorTeams.has(t.lag);
  return `<tr class="dv-trow${on ? ' dv-lon' : ''}" data-land="${esc(t.espnId)}" tabindex="0">` +
    `<td class="team">${flagName(t.lag)}</td>` +
    `<td class="c">${t.grupp ? esc(t.grupp) : '<span class="dv-nil" title="Inte i Nations League">–</span>'}</td>` +
    `<td>${landChips(t.senaste.slice(0, 5))}</td>` +
    `<td class="num">${t.tabell ? `<b>${t.tabell.points}</b> <small class="muted">${ordinal(t.tabell.rank)}</small>` : '<span class="dv-nil">–</span>'}</td>` +
    `<td class="num">${a.matcher}</td>` +
    `<td class="num">${a.v}–${a.o}–${a.f}</td>` +
    `<td class="num hide-xs">${a.gjorda}–${a.inslappta}</td>` +
    `<td class="num hide-xs">${cell(a.nollor)}</td>` +
    `<td class="hide-xs">${nx ? `<span class="dv-lnext">${esc(shortDay(nx.datum))} ${nx.hemma ? 'mot' : 'i'} ${esc(nx.motstand)}</span>` : '<span class="dv-nil">–</span>'}</td></tr>`;
}

function landStatsView(L) {
  if (!L || L.unknown || !L.lag || !L.lag.length) {
    return `<p class="empty">${unknown(`okänt – ingen data om landslagen${L && L.reason ? ` (${L.reason})` : ''}`)}</p>`;
  }
  const byName = new Map(L.lag.map((t) => [t.lag, t]));
  const lor = couponLand(L);
  const lorTeams = new Set(lor.flatMap((m) => [m.hemma, m.borta]));
  let html = '';

  // Lördagens landskamper: lagen sida vid sida med formen, gruppen och
  // marknadens chans.
  if (lor.length) {
    const side = (name) => {
      const t = byName.get(name);
      return `<div class="dv-lside">${flagName(name)}` +
        `<div class="dv-lside-f">${t ? landChips(t.senaste.slice(0, 5)) : ''}` +
        `${t && t.tabell ? `<small>${ordinal(t.tabell.rank)} i ${esc(t.grupp)} · ${t.tabell.points} p</small>` : ''}</div></div>`;
    };
    html += card('Lördagens landskamper', {
      hint: 'Stryktipsets dag',
      tip: 'Formen är de fem senaste landskamperna, nyast till vänster. Chansen är marknadens – DraftKings odds utan spelbolagets marginal – inte modellens.',
      body: `<ul class="dv-lgamelist">${lor.map((m) => {
        const p = m.prognos;
        const res = m.resultat && m.status !== 'STATUS_SCHEDULED' && !(window.Spoiler && landHidden(m.id));
        return `<li><a href="index.html#match/${esc(m.id)}" class="dv-lgame">` +
          `<span class="dv-lg-when">${kick(m.avspark)}<small>${esc(m.grupp ? `Grupp ${m.grupp}` : m.turneringNamn)}</small></span>` +
          side(m.hemma) + side(m.borta) +
          `<span class="dv-lg-p">${res ? `<b>${m.resultat.home}–${m.resultat.away}</b>`
            : p ? p.map((v, i) => `<span title="${['Hemmaseger', 'Oavgjort', 'Bortaseger'][i]} enligt marknaden"><small>${'1X2'[i]}</small>${v} %</span>`).join('')
              : '<span class="dv-nil" title="Inga odds än">–</span>'}</span></a></li>`;
      }).join('')}</ul>`,
      src: `Matcherna: ESPN, hämtat ${when(L.kalla && L.kalla.matcher)} · Chansen: DraftKings via ESPN, utan marginal`,
      cls: 'dv-lgamecard',
    });
  }

  // Alla landslag, sorterbart; lördagens lag först om inget annat valts.
  const seg = [['lor', 'Lördagens lag'], ['alla', 'Alla']];
  const only = state.lf.who === 'lor' && lorTeams.size;
  const list = landSort(L.lag.filter((t) => (only ? lorTeams.has(t.lag) : true)));
  const head = sortHead(LAND_COLS, state.lf, 'data-lsort');
  html += card('Landslagen', {
    hint: 'alla landskamper sedan hösten 2024',
    tip: 'Nations League, VM, VM-kvalet och vänskapsmatcherna sedan september 2024. Ställningen efter 90 minuter gäller. Klicka på ett lag för matcherna.',
    body: (lorTeams.size ? `<div class="dv-seg" role="group" aria-label="Vilka lag">${seg.map(([id, label]) =>
      `<button type="button" data-lwho="${id}" aria-pressed="${(only ? 'lor' : 'alla') === id}">${label}</button>`).join('')}</div>` : '') +
      `<div class="table-wrap dv-tw"><table class="dv-teams dv-landtab">${head}<tbody>${list.map((t) => landTeamRow(t, lorTeams)).join('')}</tbody></table></div>`,
    src: `Matcherna: ESPN, hämtat ${when(L.kalla && L.kalla.historik)} (tidigare turneringar) och ${when(L.kalla && L.kalla.matcher)} (Nations League)`,
  });
  return html;
}

// Lagkortet för ett landslag: gruppen, Nations League hittills, alla
// landskamper sedan 2024, nästa match och de tio senaste – med länkar till
// matchrutan för de matcher sajten har.
async function openLand(espnId) {
  const L = await loadLand();
  if (!L || L.unknown) return;
  const t = L.lag.find((x) => x.espnId === espnId);
  if (!t) return;
  const legend = landLegend(L);
  const z = t.tabell ? landZone(legend, t.liga, t.tabell.rank) : null;
  const sub = [t.grupp ? `Nations League, grupp ${t.grupp}` : 'Inte i Nations League', t.tabell ? `${ordinal(t.tabell.rank)} plats` : null, z ? z.label : null];
  let html = mhead(t.kod || t.lag.slice(0, 2).toUpperCase(), t.lag, [sub.filter(Boolean).map(esc).join(' · ')], ' team',
    '', window.Skoldar && Skoldar.has(t.lag) ? teamCrest(t.lag) : '');
  const nl = t.nationsLeague;
  const a = t.alla;
  html += kpis([
    t.tabell ? [cell(t.tabell.points, { strong: true }), 'Poäng i gruppen'] : null,
    nl.matcher ? [`${nl.gjorda}–${nl.inslappta}`, 'Mål i gruppen'] : null,
    t.senaste.length ? [landChips(t.senaste.slice(0, 5), { title: true }), 'Form', LAND_FORM_TIP] : null,
  ]);
  const have = state.landById || new Map();
  const link = (id, txt) => (have.has(String(id)) ? `<a href="index.html#match/${esc(id)}">${txt}</a>` : txt);
  if (t.nasta) {
    const n = t.nasta;
    const d = dayNo(Date.parse(n.datum)) - dayNo(Date.now());
    const live = Date.parse(n.datum) <= Date.now();
    const whenTxt = live ? 'pågår' : d <= 0 ? 'i dag' : d === 1 ? 'i morgon' : `om ${d} dagar`;
    html += msec('Nästa match', `<div class="dv-next"><span class="dv-tname">${teamCrest(n.motstand)}<span><b>${link(n.id, esc(n.motstand))}</b>` +
      `<small>${n.hemma ? 'Hemma' : 'Borta'} · ${esc(fKick.format(new Date(n.datum)))}${n.turnering === 'UNL' ? ' · Nations League' : ''}</small></span></span>` +
      `<b class="dv-next-when">${whenTxt}</b></div>`);
  }
  html += landBody(L, t);
  html += mfoot([`Matcherna och tabellen: ESPN, hämtat ${when(L.kalla && L.kalla.matcher)}.`]);
  showModal(html);
}

// Landslagets siffror sedan hösten 2024 och de senaste landskamperna (i
// landslagets kort och på lagrutans flik Landskamper).
function landBody(L, t) {
  const nl = t.nationsLeague;
  const a = t.alla;
  const have = state.landById || new Map();
  const link = (id, txt) => (have.has(String(id)) ? `<a href="index.html#match/${esc(id)}">${txt}</a>` : txt);
  let html = msec('Siffrorna', facts([
    [`${nl.v}–${nl.o}–${nl.f}`, 'V–O–F i gruppen', `${nl.matcher} matcher i årets Nations League`],
    [`${nl.gjorda}–${nl.inslappta}`, 'Mål i gruppen', 'Gjorda–insläppta mål i årets Nations League'],
    [`${a.v}–${a.o}–${a.f}`, 'V–O–F sedan 2024', `${a.matcher} landskamper sedan ${a.fran ? dateLabel(a.fran) : 'hösten'} ${a.fran ? a.fran.slice(0, 4) : '2024'}`],
    [`${a.gjorda}–${a.inslappta}`, 'Mål sedan 2024', 'Gjorda–insläppta mål sedan hösten 2024'],
    a.matcher ? [num(a.gjorda / a.matcher, 2), 'Mål per match', 'Gjorda mål per landskamp sedan hösten 2024'] : null,
    a.matcher ? [`${a.nollor}<small> av ${a.matcher}</small>`, 'Hållit nollan', 'Landskamper utan insläppt mål sedan hösten 2024'] : null,
  ]));
  if (t.senaste.length) {
    html += msec(`De ${t.senaste.length} senaste`, `<ul class="dv-flist">${t.senaste.map((r) => {
      const hid = landHidden(r.id);
      const l = hid ? '?' : r.utfall;
      return `<li><span class="form dv-form"><span class="${hid ? 'sp-form' : l}">${esc(l)}</span></span>` +
        `<span class="dv-tname">${teamCrest(r.motstand)}<span>${link(r.id, esc(r.motstand))}<small>${r.hemma ? 'hemma' : 'borta'} · ${esc(shortDay(`${r.datum}T12:00:00Z`))} · ${esc(landTurn(r))}</small></span></span>` +
        `<b>${hid ? '?' : `${r.mal[0]}–${r.mal[1]}${r.avgjord ? '*' : ''}`}</b></li>`;
    }).join('')}</ul>` + (t.senaste.some((r) => r.avgjord) ? '<p class="dv-note">* Ställningen efter 90 minuter; avgjord i förlängning eller på straffar.</p>' : ''));
  }
  return html;
}

// Ett landslag i Nations League öppnar lagrutan (spelarna, xG och oddsen),
// de andra landslagets kort.
function openLandTeam(espnId) {
  const P = state.players.get(LAND);
  if (P && !P.unknown && P.teams.some((t) => t.espnId === espnId)) openTeam(espnId);
  else openLand(espnId);
}

// Matchlistans landskamper efter id (länkarna och spoilerskyddet).
async function loadLandMatches() {
  if (state.landById) return state.landById;
  const all = await allMatches();
  state.landById = new Map((all || []).filter((m) => LAND_COMPS.includes(m.comp)).map((m) => [String(m.id), m]));
  return state.landById;
}

// ---------- ordlistan ----------

// [term, förklaring, sidan den hör till – utan sida på båda]
const GLOSSARY = [
  ['S V O F P', 'Tabellen: spelade, vunna, oavgjorda, förlorade och poäng (3 för vinst, 1 för oavgjort). Lika poäng skiljs åt på målskillnad (+/−) och sedan gjorda mål.', 'tabeller'],
  ['Zonerna', 'De färgade raderna och strecken i tabellen: vad placeringen ger i slutet av säsongen enligt ESPN – uppflyttning, kval (playoff), Europa eller nedflyttning.', 'tabeller'],
  ['M, Start, Min, Ass, M+A', 'Spelartabellen: matcher (från start och inhopp), matcher från start, spelade minuter, assist och mål plus assist.', 'statistik'],
  ['– och grå 0', 'Streck = okänt (ESPN har ingen statistik för spelaren), grå 0 = noll.'],
  ['Spelarstatistiken', 'Bara ligamatcher i år, ur ESPN:s trupper. Den släpar ofta en omgång efter tabellen; självmål och spelare som lämnat klubben saknas. I Premier League kommer speltid, xG, försvarsspel från Fantasy Premier League, i övriga ligor räknas speltiden ur ESPN:s matchrapporter (byten och röda kort, utan tilläggstid). Målens sort och betydelse kommer från matchrapporterna i alla fyra ligor.', 'statistik'],
  ['Per 90', 'Per 90 spelade minuter – som om spelaren spelat hela matcher. Visas för spelare med minst tre hela matchers speltid; dämpade siffror har för litet underlag.', 'statistik'],
  ['Formen', 'De fem senaste matcherna i ligan och de engelska cuperna (inte Europacuperna), nyast till vänster: V = vinst, O = oavgjort, F = förlust. Ställningen efter 90 minuter gäller, så en match som avgjorts i förlängning eller på straffar räknas som oavgjord. Topplistan Formen räknar 3 poäng för vinst och 1 för oavgjort i de fem.', 'statistik'],
  ['Topplistorna under Lagen', 'Samma tal som i datorn i tobaksaffären: Formen, Starkast & svagast, Kryssar gärna, Tur & otur, Mot oddsen och Motståndet. Listorna åt två håll visar de tre högsta och de tre lägsta, med en stapel från mitten (längst för divisionens största tal); Alla lag visar hela divisionen.', 'statistik'],
  ['Delad placering', 'Har två lika tal i en topplista delar de plats, och numret står bara på den första – som skytteligan på text-tv:n.', 'statistik'],
  ['Lagstatistiken', 'Tabellen är ESPN:s. xG, skott, kort och odds kommer från football-data.co.uk, som ofta ligger en omgång efter – därför visas de per match eller som skillnad inom samma matcher.', 'statistik'],
  ['Beroende', 'Hur stor del av lagets mål den bäste målskytten gjort.', 'statistik'],
  ['Effektivast', 'Mål per skott, bland spelare med minst tio skott.', 'statistik'],
  ['Segermål', 'Målet som gav laget den ledning det sedan aldrig tappade. Vid 3–1 är lagets andra mål segermålet, vid 1–0 det enda.', 'statistik'],
  ['Poäng åt laget', 'Poängen laget hade tappat utan spelarens mål. Ett mål i en match som vanns med ett mål är värt två poäng (seger i stället för oavgjort), ett mål i en oavgjord match en poäng (oavgjort i stället för förlust). Mål i matcher som vanns stort eller förlorades ger inga poäng.', 'statistik'],
  ['Inblandad i lagets mål', 'Mål och assist delat med lagets mål: hur stor del av lagets mål spelaren har gjort eller lagt sista passningen till.', 'statistik'],
  ['Målen', 'Segermål, poäng åt laget, matchens första mål, sena mål (från 80:e minuten, tilläggstiden inräknad) och mål som inhoppare finns för alla fyra ligor. Straffarna bara för Premier League och Championship – i League One och League Two anger matchrapporterna bara minut och målskytt.', 'statistik'],
  ['Fälld, Fäller', 'Gånger spelaren har blivit fälld, och gånger spelaren själv har begått ett regelbrott som domaren blåst för.', 'statistik'],
  ['Försvarsinsatser', 'Tacklingar, rensningar, täckningar och brytningar. Bara Premier League, från Fantasy Premier League.', 'statistik'],
  ['Assist', 'Passningen (eller skottet som räddas och slås in) som leder direkt till ett mål, enligt ESPN.', 'statistik'],
  ['Skott på mål', 'Skott som skulle ha gått in om målvakten inte räddat. Skott utanför och i stolpen räknas inte.', 'statistik'],
  ['Räddningsprocent', 'Räddningar delat med skotten på mål som målvakten mött (räddningar + insläppta).', 'statistik'],
  ['Betyg', 'Snittet av spelarens betyg i ligans matcher, från 365Scores. Betyget sätts efter varje match, från 1 till 10, ur spelarens statistik i matchen. En vanlig insats ger runt 6,7 och bara vart tionde betyg är över 7,5. Inhoppare som bara spelat några minuter får inget betyg.', 'statistik'],
  ['xG', 'Förväntade mål: varje skott får ett värde efter hur ofta ett sådant skott brukar bli mål – en straff runt 0,8, ett långskott några hundradelar. Summan visar hur många mål chanserna brukar ge, oavsett om de gick in.', 'statistik'],
  ['xG mot, xA', 'xG mot: motståndarnas förväntade mål, alltså hur bra chanser laget släpper till. xA: förväntade assist, ur passningarna före lagkamraternas skott.', 'statistik'],
  ['Mål mot xG', 'Gjorda mål minus xG (och insläppta mål minus xG mot). Stora avvikelser är ofta tur eller otur och brukar jämna ut sig under en säsong.', 'statistik'],
  ['Motstånd', 'Motståndets styrka hittills enligt prognosmodellen, i mål per match, mot vad ett lag i divisionen möter i snitt. Plus = svårare program än snittet (Tufft hittills i topplistan Motståndet), minus = lättare (Lätt hittills).', 'statistik'],
  ['Poäng och kryss mot chanserna', 'Varje match räknas om till chanser att vinna, spela oavgjort och förlora ur båda lagens xG. Poäng mot chanserna: tagna poäng minus 3 × vinstchansen plus oavgjortchansen, match för match – plus är oftast tur, som brukar jämna ut sig (Tur & otur). Kryss enligt chanserna: oavgjortchansen i snitt (Kryssar gärna).', 'statistik'],
  ['Styrka', 'Prognosmodellens bedömning av laget: väntad målskillnad per match mot ett snittlag i divisionen på neutral plan, med motståndet inräknat och tidigare säsonger med mindre vikt.', 'statistik'],
  ['Nollor', 'Andel av lagets matcher utan insläppt mål.', 'statistik'],
  ['Väntat, Tog, Mot oddsen', 'Poängen oddsen vid avspark väntade sig – 3 × vinstchansen plus oavgjortchansen, match för match – poängen laget tog i samma matcher, och skillnaden. Plus = bättre än oddsen trodde (Slår oddsen), minus = sämre (Sviker).', 'statistik'],
  ['Favorit', 'Matcher där laget hade större chans än motståndaren att vinna, enligt oddsen före avspark.', 'statistik'],
  ['Med och utan', 'Hur laget har gått i ligan när spelaren startat och när han inte startat (borta eller på bänken), sedan 2021/22 och bara under hans tid i laget: säsonger i följd då han spelat, och för den som står i truppen fram till i dag. Mot oddsen = poäng per match minus vad oddsen vid avspark räknade med, så att det inte ser ut som att laget klarar sig bättre utan stjärnan för att han vilat mot de svaga lagen. Visas när båda sidorna har minst tio matcher. I matchbladet: poängen per match mot oddsen utan honom minus med honom, minus = laget har tappat utan honom.', 'statistik'],
  ['Spel på seger', 'Vinst eller förlust i procent av insatserna om man satsat lika mycket på att laget vinner varje match, till oddset vid avspark. Spelbolagens marginal är inräknad.', 'statistik'],
  ['Marginal', 'Spelbolagens påslag: hur mycket summan av 1/odds överstiger 100 %.', 'statistik'],
  ['Grundserien', 'Ligans ordinarie matcher, utan kvalspel (playoff) och cuper.'],
];

function glossary() {
  return '<details class="help dv-glossary src-only"><summary>Ordlista</summary><dl>' +
    GLOSSARY.filter(([, , page]) => !page || page === PAGE)
      .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('') + '</dl></details>';
}

// ---------- sidan ----------

function frame() {
  const d = state.data;
  return '<div class="dv-head">' +
    `<div class="dv-divs" id="dv-divs" role="group" aria-label="Division">${d.divisions.map((x) =>
      `<button type="button" data-div="${x.id}" aria-pressed="${x.id === state.div}" style="--c:${color(x.id)}">${esc(x.name)}</button>`).join('')}` +
    `<button type="button" data-div="${LAND}" aria-pressed="${isLand(state.div)}" style="--c:${color(LAND)}">${esc(LAND_DIV.name)}</button></div>` +
    '</div>' + viewTabs() + '<div id="dv-view" class="dv-view"></div>' +
    '<p class="detail-foot"><button type="button" class="src-toggle" aria-pressed="false">Visa detaljer</button></p>' + glossary();
}

// Statistik: Spelarna | Lagen är rubriken under divisionsflikarna, där
// Tabeller har sin tabellrubrik.
function viewTabs() {
  if (VIEWS.length < 2) return '';
  return `<nav class="dv-views" id="dv-views" aria-label="Vy">${VIEWS.map((v) =>
    `<a href="#${state.div}/${v.id}" data-view="${v.id}"${v.id === state.view ? ' aria-current="page"' : ''}>${esc(v.label)}</a>`).join('')}</nav>`;
}

// Källraderna, förklaringarna och ordlistan (.src-line, .src-only m.fl.) är
// dolda tills man ber om dem – samma val och nyckel som på matchsidan,
// sparat på enheten.
function showSources() {
  try { return localStorage.getItem('visaKallor') === '1'; } catch { return false; }
}
function setShowSources(on) {
  try { localStorage.setItem('visaKallor', on ? '1' : '0'); } catch { /* inget lagringsutrymme */ }
  const el = $('#divisions');
  el.classList.toggle('show-src', on);
  const b = el.querySelector('button.src-toggle');
  if (b) { b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Dölj detaljer' : 'Visa detaljer'; }
}

async function loadPlayers(div) {
  if (state.players.has(div)) return state.players.get(div);
  const dv = isLand(div) ? LAND_DIV : state.data.divisions.find((x) => x.id === div);
  let P;
  if (!dv) {
    P = { unknown: true, reason: 'okänd division' };
  } else {
    try {
      P = await getJSON(`data/players/${div}.json`);
    } catch (err) {
      P = { unknown: true, reason: `spelardatan kunde inte läsas (${err.message})` };
    }
  }
  state.players.set(div, P);
  return P;
}

async function renderView() {
  const d = state.data;
  const dv = isLand(state.div) ? LAND_DIV : d.divisions.find((x) => x.id === state.div) || d.divisions[0];
  for (const b of document.querySelectorAll('#dv-divs button')) b.setAttribute('aria-pressed', String(b.dataset.div === dv.id));
  // Smal skärm: rulla flikraden så att den valda divisionen syns hel.
  const tabs = $('#dv-divs');
  const on = tabs && tabs.querySelector('[aria-pressed="true"]');
  if (on) {
    const box = tabs.getBoundingClientRect();
    const r = on.getBoundingClientRect();
    if (r.left < box.left || r.right > box.right) tabs.scrollLeft += r.left - box.left - 16;
  }
  for (const a of document.querySelectorAll('#dv-views a')) {
    a.href = `#${dv.id}/${a.dataset.view}`;
    if (a.dataset.view === state.view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  const el = $('#dv-view');
  // Tabeller: landslagens grupper (ett lag i Nations League öppnar lagrutan,
  // som behöver spelarfilen)
  if (isLand(dv.id) && PAGE === 'tabeller') {
    const [L] = await Promise.all([loadLand(), loadLandMatches(), loadPlayers(LAND), window.Spoiler && Spoiler.on() && Spoiler.matches()]);
    if (!isLand(state.div)) return;
    el.classList.remove('sp-veiled');
    const draw = () => { el.innerHTML = landTablesView(L); };
    if (el.dataset.drawn === LAND) keepScroll(el, draw);
    else draw();
    el.dataset.drawn = LAND;
    veil(dv, state.view);
    return;
  }
  const P = await loadPlayers(dv.id);
  const [T] = state.view === 'lag' ? await Promise.all([loadTeams(dv.id), loadForm()]) : [null];
  // (landslagen: under Lagen också lördagens landskamper och alla landslag sedan 2024)
  const [L] = isLand(dv.id) && state.view === 'lag' ? await Promise.all([loadLand(), loadLandMatches()]) : [null];
  // Spoilerskyddet behöver matcherna innan något ritas, annars hinner det dolda synas.
  if (window.Spoiler && Spoiler.on()) await Spoiler.matches();
  // Användaren kan ha bytt vy medan spelarfilen laddades.
  if (dv.id !== state.div) return;
  el.classList.remove('sp-veiled');
  const draw = () => {
    if (state.view === 'tabell') el.innerHTML = tableView(P);
    else if (state.view === 'lag') el.innerHTML = teamsView(dv, P, T) + (L ? landStatsView(L) : '');
    else el.innerHTML = playersView(dv, P);
  };
  // Samma vy igen (sorteringen i Lag): rullningen i sidled står kvar.
  const drawn = `${dv.id}/${state.view}`;
  if (el.dataset.drawn === drawn) keepScroll(el, draw);
  else draw();
  el.dataset.drawn = drawn;
  veil(dv, state.view);
}

// Spoilerskyddet (spoiler.js): har divisionen matcher som döljs just nu läggs
// vyn bakom en ridå – tabellen och statistiken räknar redan med resultaten.
async function veil(dv, view) {
  if (!window.Spoiler || !Spoiler.on()) return;
  const inDiv = (m) => (isLand(dv.id) ? LAND_COMPS.includes(m.comp) : m.comp === dv.id);
  const recent = (await Spoiler.matches()).filter((m) => inDiv(m) && Spoiler.hides(m.kickoff));
  const n = recent.filter(Spoiler.hidden).length;
  if (!n || dv.id !== state.div || view !== state.view) return;
  const el = $('#dv-view');
  if (el.querySelector(':scope > .sp-card')) return;
  // En ny match i perioden ger en ny nyckel – då dras ridån för igen.
  const key = `div:${dv.id}:${recent.map((m) => m.id).sort().join(',')}`;
  if (Spoiler.isShown(key)) return;
  for (const c of el.children) c.inert = true;
  el.classList.add('sp-veiled');
  el.insertAdjacentHTML('afterbegin', Spoiler.card({
    title: `${n} ${n === 1 ? 'match' : 'matcher'} i ${isLand(dv.id) ? 'landskamperna' : dv.name} är dolda`,
    text: 'Tabellen och statistiken räknar med resultaten.',
    keys: [key],
  }));
}

function updatePlayerTable() {
  const P = state.players.get(state.div);
  const box = $('#dv-ptable');
  if (P && box) keepScroll(box, () => { box.innerHTML = playerTableHtml(P); });
}

// Händelser via delegering: allt i #divisions renderas om ofta.
function wire() {
  const root = $('#divisions');
  tips(root);
  root.addEventListener('click', (e) => {
    if (e.target.closest('button.src-toggle')) { setShowSources(!showSources()); return; }
    const div = e.target.closest('#dv-divs button');
    if (div) {
      go(div.dataset.div, state.view);
      return;
    }
    const s = e.target.closest('[data-sort]');
    if (s) {
      const k = s.dataset.sort;
      const textCol = PCOLS.find((c) => c.key === k).text;
      state.pf.dir = state.pf.sort === k ? -state.pf.dir : (textCol ? 1 : -1);
      state.pf.sort = k;
      updatePlayerTable();
      return;
    }
    const pc = e.target.closest('[data-pcols]');
    if (pc) {
      state.pf.cols = pc.dataset.pcols;
      for (const b of pc.parentElement.children) b.setAttribute('aria-pressed', String(b === pc));
      const P = state.players.get(state.div);
      if (P && !P.unknown) Object.assign(state.pf, { sort: groupSort(P, playerCols(P)).key, dir: -1 });
      updatePlayerTable();
      return;
    }
    const ts = e.target.closest('[data-tsort]');
    if (ts) {
      const k = ts.dataset.tsort;
      const c = TCOLS.find((x) => x.key === k);
      state.tf.dir = state.tf.sort === k ? -state.tf.dir : (c.text || c.asc ? 1 : -1);
      state.tf.sort = k;
      renderView();
      return;
    }
    const tc = e.target.closest('[data-tcols]');
    if (tc) {
      const g = T_GROUPS.find((x) => x.id === tc.dataset.tcols);
      state.tf = { cols: g.id, sort: g.sort, dir: g.dir };
      renderView();
      return;
    }
    const ls = e.target.closest('[data-lsort]');
    if (ls) {
      const k = ls.dataset.lsort;
      const c = LAND_COLS.find((x) => x.key === k);
      state.lf.dir = state.lf.sort === k ? -state.lf.dir : (c.text ? 1 : -1);
      state.lf.sort = k;
      renderView();
      return;
    }
    const lw = e.target.closest('[data-lwho]');
    if (lw) { state.lf.who = lw.dataset.lwho; renderView(); return; }
    const ld = e.target.closest('[data-land]');
    if (ld) { openLandTeam(ld.dataset.land); return; }
    const top = e.target.closest('[data-top]');
    if (top) { openTop(top.dataset.top); return; }
    if (e.target.closest('[data-more]')) {
      state.pf.limit += 100;
      updatePlayerTable();
      return;
    }
    const p = e.target.closest('[data-pid]');
    if (p) { openPlayer(p.dataset.pid); return; }
    const t = e.target.closest('[data-team]');
    if (t) openTeam(t.dataset.team);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const p = e.target.closest('tr[data-pid]');
    if (p) { openPlayer(p.dataset.pid); return; }
    const t = e.target.closest('tr[data-team]');
    if (t) { openTeam(t.dataset.team); return; }
    const ld = e.target.closest('tr[data-land]');
    if (ld) openLandTeam(ld.dataset.land);
  });
  root.addEventListener('input', (e) => {
    if (e.target.id === 'pf-q') { state.pf.q = e.target.value; state.pf.limit = 60; updatePlayerTable(); }
  });
  root.addEventListener('change', (e) => {
    const id = e.target.id;
    if (id === 'pf-team') state.pf.team = e.target.value;
    else if (id === 'pf-pos') state.pf.pos = e.target.value;
    else if (id === 'pf-played') state.pf.played = e.target.checked;
    else return;
    state.pf.limit = 60;
    updatePlayerTable();
  });
}

// Från spelarkortet till lagets trupp (även i matchbladet).
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-team-open]');
  if (b) openTeam(b.dataset.teamOpen, 'trupp');
});

// Adressen #pl/spelare väljer division och vy (länkbart). Äldre länkar
// #pl (bara division) fungerar också.
function parseHash() {
  const [div, view] = location.hash.replace(/^#/, '').split('/');
  return { div: div || null, view: (view && MOVED[view]) || view || null };
}

function go(div, view) {
  const h = `#${div}/${view}`;
  if (location.hash !== h) location.hash = h;
  else apply();
}

function apply() {
  const { div, view } = parseHash();
  const divs = state.data.divisions;
  const nd = div && (isLand(div) || divs.some((x) => x.id === div)) ? div : state.div;
  const nv = view && VIEWS.some((v) => v.id === view) ? view : (div ? VIEWS[0].id : state.view);
  if (nd !== state.div) {
    state.pf = { ...state.pf, q: '', team: '', limit: 60 };
  }
  state.div = nd;
  state.view = nv;
  const m = document.getElementById('dv-modal');
  if (m && m.open) m.close();
  renderView();
  if (view) window.scrollTo({ top: Math.min(window.scrollY, ($('#divisions').offsetTop || 0) - 8) });
}

// ---------- spelarkortet i matchbladet ----------

// Förstasidan har ingen #divisions: där läser matchbladet (matchruta.js) in
// filen med import() bara för spelarkorten, och sidan ritas inte.
// Spelarfilerna har 365Scores id för bilden (ph), samma id som startelvorna.
const EMBEDDED = !document.getElementById('divisions');
let embedLoad = null;
function embedData() {
  if (!embedLoad) {
    embedLoad = getJSON('data/divisions.json')
      .catch(() => ({ divisions: [] }))
      .then((d) => { state.data = d; });
  }
  return embedLoad;
}
// Tabeller och Statistik: klart när sidan ritats första gången (init).
let pageDone;
const pageReady = new Promise((res) => { pageDone = res; });

// Divisionen för ett kort utifrån (matchbladet, sökningen i sok.js). På
// Tabeller och Statistik följer sidan med till divisionen innan kortet
// öppnas, så att kortet och sidan under det handlar om samma division.
async function cardDiv(div) {
  if (EMBEDDED) {
    await embedData();
    if ((await loadPlayers(div)).unknown) return false;
    state.div = div;
    return true;
  }
  await pageReady;
  if (!state.data || state.data.error || !(isLand(div) || state.data.divisions.some((x) => x.id === div))) return false;
  if (state.div !== div) {
    const h = `#${div}/${state.view}`;
    if (location.hash === h) apply();
    else await new Promise((res) => { window.addEventListener('hashchange', res, { once: true }); location.hash = h; });
  }
  return !(await loadPlayers(div)).unknown;
}

window.Spelarkort = {
  // 365Scores athleteId → spelarens id i divisionens spelarfil.
  async index(div) {
    if (EMBEDDED) await embedData();
    else await pageReady;
    const P = await loadPlayers(div);
    return new Map(P.unknown ? [] : P.players.filter((p) => p.ph).map((p) => [p.ph[0], p.id]));
  },
  async open(div, id) {
    if (await cardDiv(div)) openPlayer(id);
  },
  // Lagkortet (ESPN:s lag-id), på fliken pick eller den senast valda.
  async team(div, espnId, pick) {
    if (await cardDiv(div)) openTeam(espnId, pick);
  },
};

window.addEventListener('hashchange', () => {
  // Matchbladet stängs eller byter match: kortet går med.
  if (EMBEDDED) {
    const m = document.getElementById('dv-modal');
    if (m && m.open) m.close();
    return;
  }
  if (state.data && !state.data.error) apply();
});

(async function init() {
  if (EMBEDDED) return;
  // Smal skärm: rulla fliklistan så att den aktiva länken syns.
  const cur = document.querySelector('.tabs [aria-current="page"]');
  if (cur) cur.parentElement.scrollLeft = cur.offsetLeft - 16;
  try {
    state.meta = await getJSON('data/meta.json');
    const tl = $('#topline');
    if (tl) tl.innerHTML = `Säsong <strong>${esc(state.meta.season)}</strong> · uppdaterad ${esc(fDateTime.format(new Date(state.meta.generatedAt)))}`;
  } catch {
    const tl = $('#topline');
    if (tl) tl.textContent = '';
  }
  try {
    // Sköldarnas index hämtas redan av skoldar.js; tabellen väntar in det.
    [state.data] = await Promise.all([getJSON('data/divisions.json'), window.Skoldar && Skoldar.ready]);
  } catch (err) {
    $('#divisions').innerHTML = `<p class="empty">Kunde inte läsa divisionsstatistiken: ${esc(err.message)}</p>`;
    return;
  }
  if (state.data.error) {
    $('#divisions').innerHTML = `<p class="empty">Divisionsstatistiken kunde inte räknas fram vid senaste uppdateringen: ${esc(state.data.error)}</p>`;
    return;
  }
  const { div, view } = parseHash();
  if (div && (isLand(div) || state.data.divisions.some((x) => x.id === div))) state.div = div;
  if (view && VIEWS.some((v) => v.id === view)) state.view = view;
  $('#divisions').innerHTML = frame();
  setShowSources(showSources());
  wire();
  renderView();
  if (window.Spoiler) Spoiler.onChange(renderView);
})().finally(pageDone);
