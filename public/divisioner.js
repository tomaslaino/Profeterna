'use strict';

// Sidorna Tabeller och Statistik: en division åt gången, med flikar som på
// gravergrav.se. Tabeller har tabellen, säsongsprognosen och modellens styrka
// för alla lag; Statistik har översikten, spelarna, lagen, matchbilden och
// jämförelsen mellan divisionerna. Vilken sida det är står i <body
// data-page>. Data: data/divisions.json (src/divisions.js),
// data/players/<liga>.json (src/players.js) och data/season.json
// (src/season.js, prognosmotorns säsongsprognos). Fristående från app.js – egna
// hjälpare och diagram i ren SVG, en fast färg per division ur divisioner.css.
//
// Pedagogiken: varje block säger vad det visar i en mening, varje siffra har
// källa och period, "okänt" visas som okänt, och förkortningarna förklaras i
// ordlistan längst ned.

const $ = (s) => document.querySelector(s);
const TZ = 'Europe/Stockholm';
const PAGES = {
  tabeller: [
    { id: 'tabell', label: 'Tabell' },
    { id: 'prognos', label: 'Säsongsprognos' },
    { id: 'styrka', label: 'Styrka' },
  ],
  statistik: [
    { id: 'oversikt', label: 'Översikt' },
    { id: 'spelare', label: 'Spelare' },
    { id: 'lag', label: 'Lag' },
    { id: 'matchbilden', label: 'Matchbilden' },
    { id: 'jamfor', label: 'Jämför divisioner' },
  ],
};
const PAGE = document.body.dataset.page === 'statistik' ? 'statistik' : 'tabeller';
const VIEWS = PAGES[PAGE];
// Vyerna som gäller alla divisioner på en gång (divisionsvalet dämpas).
const ALL_DIVS = new Set(['jamfor', 'styrka']);
// Länk till en vy, på den här sidan eller den andra.
function viewHref(div, view) {
  const page = Object.keys(PAGES).find((p) => PAGES[p].some((v) => v.id === view)) || PAGE;
  return `${page === PAGE ? '' : `${page}.html`}#${div}/${view}`;
}
const state = {
  data: null,
  meta: null,
  players: new Map(), // division → spelarfilen (eller { unknown })
  season: null, // säsongsprognosen (data/season.json), laddas vid behov
  div: 'pl',
  view: VIEWS[0].id,
  metric: 'home',
  pf: { q: '', team: '', pos: '', played: true, sort: 'g', dir: -1, limit: 60, cols: 'oversikt' },
  tf: { cols: 'tabell', sort: 'rank', dir: 1 },
};
const charts = new Map(); // id → ritfunktion; ritas om när bredden ändras

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

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
const color = (id) => `var(--dv-${id})`;
const unknown = (why = 'okänt') => `<span class="unknown">${esc(why)}</span>`;
const fDateTime = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const when = (iso) => (iso ? esc(fDateTime.format(new Date(iso))) : 'okänt');
const MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
const DAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
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

// ---------- måtten (jämförelsen och säsong för säsong) ----------

const METRICS = [
  { group: 'Resultat', id: 'home', label: 'Hemmavinster', get: (s) => s.home, kind: 'pct', covid: true },
  { group: 'Resultat', id: 'draw', label: 'Oavgjorda', get: (s) => s.draw, kind: 'pct' },
  { group: 'Resultat', id: 'away', label: 'Bortavinster', get: (s) => s.away, kind: 'pct', covid: true },
  { group: 'Resultat', id: 'homeAdv', label: 'Hemmalagets målövervikt', unit: 'mål per match', get: (s) => s.homeAdv, kind: 'dec', d: 2, covid: true },
  { group: 'Mål', id: 'goals', label: 'Mål per match', get: (s) => s.goals, kind: 'dec', d: 2 },
  { group: 'Mål', id: 'o25', label: 'Över 2,5 mål', get: (s) => s.o25, kind: 'pct' },
  { group: 'Mål', id: 'btts', label: 'Båda lagen gör mål', get: (s) => s.btts, kind: 'pct' },
  { group: 'Mål', id: 'nil', label: 'Mållöst (0–0)', get: (s) => s.nil, kind: 'pct' },
  { group: 'Halvtid', id: 'second', label: 'Andel av målen i andra halvlek', get: (s) => s.ht && s.ht.secondShare, kind: 'pct' },
  { group: 'Halvtid', id: 'leadWin', label: 'Halvtidsledning blir vinst', get: (s) => s.ht && s.ht.leadWin, kind: 'pct' },
  { group: 'Spelet', id: 'shots', label: 'Skott per match', get: (s) => s.shots && s.shots.shots, kind: 'dec', d: 1 },
  { group: 'Spelet', id: 'sot', label: 'Skott på mål per match', get: (s) => s.shots && s.shots.sot, kind: 'dec', d: 1 },
  { group: 'Spelet', id: 'conv', label: 'Mål per skott på mål', get: (s) => s.shots && s.shots.conv, kind: 'pct' },
  { group: 'Spelet', id: 'corners', label: 'Hörnor per match', get: (s) => s.corners, kind: 'dec', d: 1 },
  { group: 'Disciplin', id: 'fouls', label: 'Frisparkar per match', get: (s) => s.fouls, kind: 'dec', d: 1 },
  { group: 'Disciplin', id: 'yellow', label: 'Gula kort per match', get: (s) => s.cards && s.cards.yellow, kind: 'dec', d: 2 },
  { group: 'Disciplin', id: 'red', label: 'Röda kort per match', get: (s) => s.cards && s.cards.red, kind: 'dec', d: 3 },
  {
    group: 'Marknaden', id: 'favWin', label: 'Oddsfavoriten vinner', get: (s) => s.market && s.market.favWin, kind: 'pct',
    note: 'Marknadssnittets öppningsodds, från 2005/06 (Betbrain-snittet t.o.m. 2018/19).',
  },
  {
    group: 'Marknaden', id: 'logLoss', label: 'Marknadens log-poäng', unit: 'lägre = lättare att förutsäga', get: (s) => s.market && s.market.logLoss, kind: 'dec', d: 3,
    note: 'Medelvärdet av −ln(marknadens sannolikhet för det som hände). Ett mått på hur förutsägbar divisionen är för spelbolagen.',
  },
  {
    group: 'Marknaden', id: 'margin', label: 'Spelbolagens marginal', get: (s) => s.market && s.market.margin, kind: 'pct',
    note: 'Summan av 1/odds minus 1 i marknadssnittet. Snittet bytte källa 2019/20 (Betbrain → football-data.co.uk:s eget).',
  },
  {
    group: 'Övrigt', id: 'balance', label: 'Spridning i poäng per match', unit: 'lägre = jämnare division', get: (s) => s.balance && s.balance.sd, kind: 'dec', d: 2,
    note: 'Standardavvikelsen i poäng per match mellan lagen i tabellen (utan poängavdrag).',
  },
  {
    group: 'Övrigt', id: 'attendance', label: 'Publik per match', get: (s) => s.attendance && s.attendance.mean, kind: 'int', covid: true,
    note: 'football-data.co.uk 2000/01–2001/02 och ESPN 2021/22–2025/26; åren däremellan saknas i de fria källorna.',
  },
];
const metric = (id) => METRICS.find((m) => m.id === id);

function fmtOf(m) {
  if (m.kind === 'pct') return (x) => pct(x, 1);
  if (m.kind === 'int') return int;
  return (x) => num(x, m.d == null ? 2 : m.d);
}

// Antal decimaler för en axelmarkering med steget step.
function decimalsFor(step) {
  const d = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return Number.isInteger(+(step * 10 ** d).toFixed(6)) ? d : d + 1;
}
function tickFmtOf(m, step) {
  if (m.kind === 'pct') return (v) => `${num(v * 100, decimalsFor(step * 100))} %`;
  return (v) => num(v, decimalsFor(step));
}

function ticks(lo, hi, count) {
  const span = hi - lo || Math.abs(hi) || 1;
  const mag = 10 ** Math.floor(Math.log10(span / count));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => span / s <= count) || 10 * mag;
  const out = [];
  for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 1e6; v += step) out.push(+v.toFixed(10));
  return { values: out, step };
}

// ---------- verktygstips (data-tip på diagram och celler) ----------

const tip = () => document.getElementById('dv-tip');
function placeTip(e) {
  const t = tip();
  const pad = 14;
  const r = t.getBoundingClientRect();
  let left = e.clientX + pad;
  let top = e.clientY + pad;
  if (left + r.width > window.innerWidth - 8) left = e.clientX - r.width - pad;
  if (top + r.height > window.innerHeight - 8) top = e.clientY - r.height - pad;
  t.style.left = `${Math.max(8, left)}px`;
  t.style.top = `${Math.max(8, top)}px`;
}
document.addEventListener('pointerover', (e) => {
  const el = e.target.closest && e.target.closest('[data-tip]');
  const t = tip();
  if (!el) { t.hidden = true; return; }
  t.innerHTML = el.getAttribute('data-tip');
  t.hidden = false;
  placeTip(e);
});
document.addEventListener('pointermove', (e) => { if (!tip().hidden) placeTip(e); });
document.addEventListener('pointerout', (e) => {
  const el = e.target.closest && e.target.closest('[data-tip]');
  if (el && !el.contains(e.relatedTarget)) tip().hidden = true;
});
window.addEventListener('scroll', () => { tip().hidden = true; }, { passive: true });

// ---------- diagram ----------

function barPath(x, y, w, h, r = 4) {
  const k = Math.min(r, w / 2, h);
  return `M${x.toFixed(1)},${(y + h).toFixed(1)}V${(y + k).toFixed(1)}Q${x.toFixed(1)},${y.toFixed(1)} ${(x + k).toFixed(1)},${y.toFixed(1)}` +
    `H${(x + w - k).toFixed(1)}Q${(x + w).toFixed(1)},${y.toFixed(1)} ${(x + w).toFixed(1)},${(y + k).toFixed(1)}V${(y + h).toFixed(1)}Z`;
}

// Linjediagram, en linje per division. Pågående säsong streckad och ofylld.
function lineChart(el, { labels, series, m, aria }) {
  const W = Math.max(280, el.clientWidth);
  const H = W < 520 ? 240 : 280;
  const L = 52; const R = 34; const T = 18; const B = 26;
  const vals = series.flatMap((s) => s.values.filter((v) => v != null));
  if (!vals.length) { el.innerHTML = `<p class="empty">${unknown('okänt – ingen division har data för måttet')}</p>`; return; }
  let lo = Math.min(...vals); let hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.1 || 1;
  lo -= pad; hi += pad;
  const tk = ticks(lo, hi, H < 260 ? 4 : 5);
  lo = tk.values[0]; hi = tk.values[tk.values.length - 1];
  const tf = tickFmtOf(m, tk.step);
  const f = fmtOf(m);
  const band = (W - L - R) / labels.length;
  const x = (i) => L + band * (i + 0.5);
  const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  let svg = `<svg class="dv-svg" width="${W}" height="${H}" role="img" aria-label="${esc(aria)}">`;
  if (m.covid) {
    const i = labels.indexOf('2020/21');
    if (i >= 0) {
      svg += `<rect class="band" x="${(x(i) - band / 2).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${H - T - B}"/>` +
        `<text class="band-label" x="${x(i).toFixed(1)}" y="${T - 5}" text-anchor="middle">utan publik</text>`;
    }
  }
  for (const v of tk.values) {
    svg += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>` +
      `<text class="tick" x="${L - 6}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${esc(tf(v))}</text>`;
  }
  const every = Math.ceil(labels.length / Math.max(1, Math.floor((W - L - R) / 44)));
  labels.forEach((lab, i) => {
    if (i % every === 0 || i === labels.length - 1) svg += `<text class="tick" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(lab.slice(2))}</text>`;
  });
  const ends = [];
  for (const s of series) {
    let d = '';
    let pen = false;
    let last = null;
    s.values.forEach((v, i) => {
      if (v == null || s.partial[i]) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
      last = i;
    });
    svg += `<path class="line" style="--c:${s.color}" d="${d}"/>`;
    const pi = s.partial.findIndex(Boolean);
    if (pi >= 0 && s.values[pi] != null) {
      if (last != null && last === pi - 1) {
        svg += `<path class="line partial" style="--c:${s.color}" d="M${x(last).toFixed(1)},${y(s.values[last]).toFixed(1)}L${x(pi).toFixed(1)},${y(s.values[pi]).toFixed(1)}"/>`;
      }
      svg += `<circle class="dot partial" style="--c:${s.color}" cx="${x(pi).toFixed(1)}" cy="${y(s.values[pi]).toFixed(1)}" r="4"/>`;
    }
    if (last != null) {
      svg += `<circle class="dot" style="--c:${s.color}" cx="${x(last).toFixed(1)}" cy="${y(s.values[last]).toFixed(1)}" r="4"/>`;
      const endI = pi >= 0 && s.values[pi] != null ? pi : last;
      ends.push({ label: s.short, x: x(endI) + 9, y: y(s.values[endI]) + 4 });
    }
  }
  // Direktetiketter vid linjeslutet, isärflyttade så att de inte krockar.
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
  const over = ends.length ? ends[ends.length - 1].y - (H - B + 2) : 0;
  if (over > 0) for (const e of ends) e.y -= over;
  for (const e of ends) svg += `<text class="end" x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}">${esc(e.label)}</text>`;
  // Träffytor per säsong med hårkors och alla divisioners värden.
  labels.forEach((lab, i) => {
    const rows = series.map((s) => `<i class="dv-key dot" style="--c:${s.color}"></i>${esc(s.short)} ${s.values[i] == null ? '–' : esc(f(s.values[i]))}` +
      `${s.n[i] ? ` <span class="muted">(${esc(int(s.n[i]))} matcher${s.partial[i] ? ', pågår' : ''})</span>` : ''}`);
    let g = `<g class="col"><line class="cross" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${T}" y2="${H - B}"/>`;
    for (const s of series) {
      if (s.values[i] != null) g += `<circle class="dot hd" style="--c:${s.color}" cx="${x(i).toFixed(1)}" cy="${y(s.values[i]).toFixed(1)}" r="4"/>`;
    }
    g += `<rect class="hit" x="${(x(i) - band / 2).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${H - T - B}" data-tip="${esc(`<b>${esc(lab)}</b>\n${rows.join('\n')}`)}"/></g>`;
    svg += g;
  });
  el.innerHTML = `${svg}</svg>`;
}

// Stapeldiagram med en serie. labels: 'all' = värde på varje stapel (bara
// när de får plats), 'max' = bara den högsta.
function columnChart(el, { bars, fmt, labels = 'all', H = 170, aria }) {
  const W = Math.max(220, el.clientWidth);
  const L = 4; const R = 4; const T = 18; const B = 22;
  const max = Math.max(...bars.map((b) => b.v || 0)) || 1;
  const band = (W - L - R) / bars.length;
  const bw = Math.max(3, Math.min(24, band * 0.64));
  const base = H - B;
  const iMax = bars.findIndex((b) => b.v === max);
  const mode = labels === 'all' && band < 34 ? 'max' : labels;
  const every = Math.ceil(bars.length / Math.max(1, Math.floor((W - L - R) / 26)));
  let svg = `<svg class="dv-svg" width="${W}" height="${H}" role="img" aria-label="${esc(aria)}">` +
    `<line class="base" x1="${L}" x2="${W - R}" y1="${base}" y2="${base}"/>`;
  bars.forEach((b, i) => {
    const cx = L + band * (i + 0.5);
    const h = b.v ? (b.v / max) * (H - T - B) : 0;
    svg += '<g class="col">';
    if (h > 0) svg += `<path class="bar${b.soft ? ' soft' : ''}" d="${barPath(cx - bw / 2, base - h, bw, h)}"/>`;
    if (b.v != null && (mode === 'all' || (mode === 'max' && i === iMax))) {
      svg += `<text class="val" x="${cx.toFixed(1)}" y="${(base - h - 5).toFixed(1)}" text-anchor="middle">${esc(fmt(b.v))}</text>`;
    }
    if (i % every === 0 || i === bars.length - 1) svg += `<text class="tick" x="${cx.toFixed(1)}" y="${H - 7}" text-anchor="middle">${esc(b.label)}</text>`;
    svg += `<rect class="hit" x="${(cx - band / 2).toFixed(1)}" y="${T - 14}" width="${band.toFixed(1)}" height="${H - T - B + 14}" data-tip="${esc(b.tip)}"/></g>`;
  });
  el.innerHTML = `${svg}</svg>`;
}

// Marknadens kalibrering: snittsannolikhet per 10 %-intervall mot utfallet.
function calChart(el, cal) {
  const W = Math.min(400, Math.max(240, el.clientWidth));
  const H = Math.round(W * 0.82);
  const L = 40; const R = 10; const T = 10; const B = 32;
  const x = (v) => L + v * (W - L - R);
  const y = (v) => T + (1 - v) * (H - T - B);
  let svg = `<svg class="dv-svg" width="${W}" height="${H}" role="img" aria-label="Marknadens sannolikhet mot utfallet">`;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    svg += `<line class="grid" x1="${x(0)}" x2="${x(1)}" y1="${y(t)}" y2="${y(t)}"/><line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${y(0)}" y2="${y(1)}"/>` +
      `<text class="tick" x="${x(t)}" y="${H - B + 14}" text-anchor="middle">${t * 100} %</text>` +
      `<text class="tick" x="${L - 6}" y="${y(t) + 3.5}" text-anchor="end">${t * 100} %</text>`;
  }
  svg += `<line class="diag" x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}"/>`;
  for (const b of cal.bins) {
    if (!b.n || b.n < 30) continue;
    svg += `<circle class="pt" cx="${x(b.p).toFixed(1)}" cy="${y(b.hit).toFixed(1)}" r="5" data-tip="${esc(`<b>Marknaden ${pct(b.lo)}–${pct(b.hi)}</b>\nsnitt ${pct(b.p, 1)}, det blev ${pct(b.hit, 1)}\n${int(b.n)} utfall`)}"/>`;
  }
  svg += `<text class="axis" x="${(L + W - R) / 2}" y="${H - 3}" text-anchor="middle">Marknaden sa</text>`;
  el.innerHTML = `${svg}</svg>`;
}

// Publik (logaritmisk skala) mot hemmafördel i poäng per match, lag för lag.
function crowdChart(el, teams) {
  const W = Math.max(260, el.clientWidth);
  const H = 230;
  const L = 40; const R = 10; const T = 10; const B = 32;
  const xs = teams.map((t) => Math.log10(t.att));
  const ys = teams.map((t) => t.hp - t.ap);
  const x0 = Math.min(...xs) - 0.05; const x1 = Math.max(...xs) + 0.05;
  const yt = ticks(Math.min(0, ...ys), Math.max(0, ...ys), 4);
  const y0 = yt.values[0]; const y1 = yt.values[yt.values.length - 1];
  const x = (v) => L + ((v - x0) / (x1 - x0)) * (W - L - R);
  const y = (v) => T + ((y1 - v) / (y1 - y0)) * (H - T - B);
  let svg = `<svg class="dv-svg" width="${W}" height="${H}" role="img" aria-label="Publik mot hemmafördel per lag och säsong">`;
  for (const v of yt.values) {
    svg += `<line class="${Math.abs(v) < 1e-9 ? 'zero' : 'grid'}" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>` +
      `<text class="tick" x="${L - 6}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${esc(num(v, decimalsFor(yt.step)))}</text>`;
  }
  for (const a of [1000, 2000, 5000, 10000, 20000, 50000, 100000]) {
    const v = Math.log10(a);
    if (v < x0 || v > x1) continue;
    svg += `<line class="grid" x1="${x(v).toFixed(1)}" x2="${x(v).toFixed(1)}" y1="${T}" y2="${H - B}"/>` +
      `<text class="tick" x="${x(v).toFixed(1)}" y="${H - B + 14}" text-anchor="middle">${esc(int(a))}</text>`;
  }
  teams.forEach((t, i) => {
    svg += `<circle class="pt" cx="${x(xs[i]).toFixed(1)}" cy="${y(ys[i]).toFixed(1)}" r="4.5" data-tip="${esc(`<b>${esc(t.team)}</b> ${esc(t.season)}\npublik ${int(t.att)} per hemmamatch\npoäng per match hemma ${num(t.hp, 2)}, borta ${num(t.ap, 2)}`)}"/>`;
  });
  svg += `<text class="axis" x="${(L + W - R) / 2}" y="${H - 3}" text-anchor="middle">Publik per hemmamatch</text>`;
  el.innerHTML = `${svg}</svg>`;
}

function redraw() {
  for (const draw of charts.values()) draw();
}
let resizeTimer = null;
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(redraw, 120);
});

// ---------- gemensamma byggstenar ----------

// Ett kort: rubrik, valfri kort förklaring (en rad, t.ex. hur en tabell läses),
// innehåll och källrad. Definitioner står i ordlistan och i verktygstipsen,
// inte som löptext – sidan ska gå att läsa utan förklaringar.
function card(title, { hint, key, body, src, cls = '' }) {
  return `<section class="card dv-card ${cls}"><h4>${esc(title)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</h4>` +
    (key ? `<p class="dv-key-line">${key}</p>` : '') + body +
    (src ? `<p class="src-line">${src}</p>` : '') + '</section>';
}

function sectionHead(title, sub) {
  return `<div class="dv-sechead"><h3>${esc(title)}</h3>${sub ? `<p>${sub}</p>` : ''}</div>`;
}

// Värde i en tabellcell: 0 dämpat, okänt som streck med förklaring.
function cell(v, { d = 0, strong = false } = {}) {
  if (v == null) return '<span class="dv-nil" title="okänt – ingen statistik hos ESPN">–</span>';
  if (v === 0) return '<span class="dv-zero">0</span>';
  const s = d ? num(v, d) : int(v);
  return strong ? `<b>${s}</b>` : s;
}

// ---------- avvikelse mot tioårssnittet ----------

const CMP = [
  { group: 'Resultat' },
  { label: 'Matcher', get: (s) => s.n, f: int },
  { label: 'Hemmavinst', m: 'home', test: 'share', more: 'Fler hemmasegrar', less: 'Färre hemmasegrar' },
  { label: 'Oavgjort', m: 'draw', test: 'share', more: 'Fler oavgjorda', less: 'Färre oavgjorda' },
  { label: 'Bortavinst', m: 'away', test: 'share', more: 'Fler bortasegrar', less: 'Färre bortasegrar' },
  { label: 'Hemmalagets målövervikt', sub: 'mål per match', m: 'homeAdv', test: 'diff', more: 'Större hemmafördel', less: 'Mindre hemmafördel' },
  { group: 'Mål' },
  { label: 'Mål per match', m: 'goals', test: 'poisson', more: 'Fler mål', less: 'Färre mål' },
  { label: 'Över 2,5 mål', m: 'o25', test: 'share', more: 'Fler målrika matcher', less: 'Färre målrika matcher' },
  { label: 'Båda lagen gör mål', m: 'btts', test: 'share', more: 'Oftare mål av båda lagen', less: 'Mer sällan mål av båda lagen' },
  { label: 'Mållöst (0–0)', m: 'nil', test: 'share', more: 'Fler 0–0', less: 'Färre 0–0' },
  { label: 'xG per match', sub: 'football-data.co.uk, ny 2026/27', get: (s) => s.xg && s.xg.xg, f: (x) => num(x, 2) },
  { group: 'Halvtid' },
  { label: 'Mål i andra halvlek', sub: 'andel av målen', m: 'second' },
  { label: 'Halvtidsledning blir vinst', m: 'leadWin', test: 'share', n: (s) => s.ht && s.ht.n * s.ht.lead, more: 'Ledningar i halvtid håller oftare', less: 'Ledningar i halvtid håller mer sällan' },
  { group: 'Spelet' },
  { label: 'Skott per match', m: 'shots' },
  { label: 'Skott på mål per match', m: 'sot' },
  { label: 'Mål per skott på mål', m: 'conv' },
  { label: 'Hörnor per match', m: 'corners' },
  { group: 'Disciplin' },
  { label: 'Frisparkar per match', m: 'fouls' },
  { label: 'Gula kort per match', m: 'yellow', test: 'poisson', more: 'Fler gula kort', less: 'Färre gula kort' },
  { label: 'Röda kort per match', m: 'red' },
  { group: 'Marknaden' },
  { label: 'Oddsfavoriten vinner', m: 'favWin', test: 'share', n: (s) => s.market && s.market.n, more: 'Favoriterna vinner oftare', less: 'Favoriterna vinner mer sällan' },
  { label: 'Spelbolagens marginal', m: 'margin' },
  { label: 'Marknadens log-poäng', sub: 'lägre = lättare att förutsäga', m: 'logLoss' },
  { group: 'Publik' },
  { label: 'Publik per match', sub: 'ESPN, 2021/22–2025/26', m: 'attendance' },
];

// +1/−1 när årets värde ligger mer än två standardfel från tioårssnittet,
// annars 0 (eller null om det inte går att pröva).
function deviation(row, cur, win) {
  if (!row.test || !cur || !win) return null;
  const get = row.get || metric(row.m).get;
  const c = get(cur); const w = get(win);
  const n = row.n ? row.n(cur) : cur.n;
  if (c == null || w == null || !n || n < 30) return null;
  let se;
  if (row.test === 'share') se = Math.sqrt((w * (1 - w)) / n);
  else if (row.test === 'poisson') se = Math.sqrt(w / n);
  else if (row.test === 'diff') se = Math.sqrt(win.goals / n);
  if (!se) return null;
  return Math.abs(c - w) <= 2 * se ? 0 : Math.sign(c - w);
}

function flag(row, cur, win) {
  const d = deviation(row, cur, win);
  if (!d) return '';
  const up = d > 0;
  return ` <span class="dv-flag" title="Ovanligt ${up ? 'högt' : 'lågt'} i år – mer än två standardfel från tioårssnittet" aria-label="ovanligt ${up ? 'högt' : 'lågt'}">${up ? '▲' : '▼'}</span>`;
}

// ---------- översikt ----------

const TILES = [
  { label: 'Hemmaseger', m: 'home', what: 'Andel av matcherna som hemmalaget vann.' },
  { label: 'Oavgjort', m: 'draw', what: 'Andel av matcherna som slutade lika.' },
  { label: 'Mål per match', m: 'goals', what: 'Båda lagens mål tillsammans, i snitt per match.' },
  { label: 'Båda lagen gör mål', m: 'btts', what: 'Andel av matcherna där båda lagen gjorde minst ett mål.' },
  { label: 'Över 2,5 mål', m: 'o25', what: 'Andel av matcherna med tre mål eller fler.' },
  { label: 'Gula kort per match', m: 'yellow', what: 'Båda lagens gula kort tillsammans, i snitt per match.' },
];

function tile(t, dv) {
  const row = CMP.find((r) => r.m === t.m);
  const m = metric(t.m);
  const f = fmtOf(m);
  const c = dv.current ? m.get(dv.current) : null;
  const w = dv.window ? m.get(dv.window) : null;
  // Chippet bara när året avviker; som vanligt och för få matcher syns inte.
  const d = deviation(row, dv.current, dv.window);
  const verdict = d ? `<span class="dv-chip ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲ ovanligt högt' : '▼ ovanligt lågt'}</span>` : '';
  return `<div class="dv-tile" title="${esc(t.what)}"><div class="dv-tile-label">${esc(t.label)}</div>` +
    `<div class="dv-tile-num">${c == null ? unknown() : esc(f(c))}</div>` +
    `<div class="dv-tile-sub">snitt ${w == null ? 'okänt' : esc(f(w))}</div>${verdict}</div>`;
}

// Det som avviker mest i år, i klartext.
function standouts(dv) {
  const out = [];
  for (const row of CMP) {
    const d = deviation(row, dv.current, dv.window);
    if (!d) continue;
    const m = metric(row.m);
    const f = fmtOf(m);
    out.push(`<li><b>${esc(d > 0 ? row.more : row.less)}</b> än vanligt: ${esc(f(m.get(dv.current)))} i år mot ${esc(f(m.get(dv.window)))} i snitt.</li>`);
  }
  return out;
}

function leaderCard(title, icon, list, value, { more, empty = 'inga än', note, top } = {}) {
  const rows = list.length
    ? list.map((p, i) => `<li><button type="button" class="dv-lrow" data-pid="${esc(p.id)}">` +
      `<span class="dv-lrank">${i + 1}</span><span class="dv-lname">${esc(p.name)}<small>${esc(p.team)}</small></span>` +
      `<span class="dv-lval">${value(p)}</span></button></li>`).join('')
    : `<li class="dv-lempty">${esc(empty)}</li>`;
  return `<section class="dv-leader"><h4><span class="dv-licon" aria-hidden="true">${icon}</span>${esc(title)}</h4><ol>${rows}</ol>` +
    (note ? `<p class="dv-lnote">${note}</p>` : '') +
    (more ? `<a class="dv-lmore" href="${more}">Alla spelare →</a>` : '') +
    (top ? `<button type="button" class="dv-lmore dv-linkbtn" data-top="${esc(top)}">Topp 20 →</button>` : '') + '</section>';
}

const cardsVal = (p) => `${p.yc ? `<i class="dv-card-y" aria-label="gula"></i>${p.yc}` : ''}${p.rc ? ` <i class="dv-card-r" aria-label="röda"></i>${p.rc}` : ''}`;
const byCards = (list) => [...list].sort((a, b) => (b.rc * 3 + b.yc) - (a.rc * 3 + a.yc) || a.app - b.app);

function overviewView(dv, P) {
  const d = state.data;
  const w = d.window;
  let html = '';
  html += `<p class="dv-meta">${esc(d.season)} · ${dv.current ? `${int(dv.current.n)} matcher` : 'inga matcher än'}` +
    ` · snitt = ${w ? `${esc(w.first)}–${esc(w.last)}` : 'okänt'}</p>`;
  html += `<div class="dv-tiles">${TILES.map((t) => tile(t, dv)).join('')}</div>`;

  const so = standouts(dv);
  if (so.length) html += card('Sticker ut i år', { body: `<ul class="dv-standout">${so.join('')}</ul>`, cls: 'dv-wide' });

  if (P && !P.unknown) {
    const L = P.leaders;
    const more = `#${dv.id}/spelare`;
    html += sectionHead('Spelarna', `Ligamatcher ${esc(d.season)}`);
    html += '<div class="dv-leaders">' +
      leaderCard('Skytteliga', '⚽', L.goals.slice(0, 5), (p) => `<b>${p.g}</b>`, { more }) +
      leaderCard('Flest assist', '🎯', L.assists.slice(0, 5), (p) => `<b>${p.a}</b>`, { more }) +
      leaderCard('Flest kort', '🟨', byCards(L.yellow.concat(L.red.filter((r) => !L.yellow.some((y) => y.id === r.id)))).slice(0, 5), cardsVal, { more }) +
      '</div>';
    html += playersCaveat(P);
  } else {
    html += `<p class="note">Spelardata: ${unknown(P ? P.reason : 'laddas inte')}</p>`;
  }
  return html;
}

function playersCaveat(P) {
  const t = P.totals;
  const parts = [`ESPN, hämtat ${when(P.source.fetchedAt)}`];
  if (t.teamsBehind) parts.push(`släpar en omgång för ${t.teamsBehind} lag`);
  if (P.seasonMismatch) parts.push(`OBS: ESPN visar inte ${esc(state.data.season)} än`);
  return `<p class="src-line">${parts.join(' · ')}</p>`;
}

// ---------- tabellen ----------

const ZONES = [
  { test: (n) => /relegation/i.test(n), cls: 'z-down', label: 'Nedflyttning' },
  { test: (n) => /playoff/i.test(n), cls: 'z-po', label: 'Kval till uppflyttning (playoff)' },
  { test: (n) => /champions league/i.test(n), cls: 'z-up', label: 'Champions League' },
  { test: (n) => /europa|conference/i.test(n), cls: 'z-eu', label: 'Europa- eller Conference League' },
  { test: (n) => /promotion/i.test(n), cls: 'z-up', label: 'Direkt uppflyttning' },
];
const zoneOf = (note) => (note ? ZONES.find((z) => z.test(note)) || null : null);

function leagueTable(rows, P, { compact = false } = {}) {
  const top = new Map(P.teams.map((t) => [t.espnId, t]));
  const head = '<thead><tr><th class="c">#</th><th>Lag</th><th class="num" title="Spelade matcher">S</th>' +
    '<th class="num" title="Vunna">V</th><th class="num" title="Oavgjorda">O</th><th class="num" title="Förlorade">F</th>' +
    '<th class="num" title="Gjorda–insläppta mål">Mål</th><th class="num" title="Målskillnad">+/−</th>' +
    (compact ? '' : '<th class="num hide-sm" title="Gula och röda kort (spelarnas, ur trupperna)">Kort</th><th class="hide-sm">Bäste målskytt</th>') +
    '<th class="num" title="Poäng: 3 för vinst, 1 för oavgjort">P</th></tr></thead>';
  const body = rows.map((r) => {
    if (!r) return `<tr class="dv-gap"><td colspan="${compact ? 9 : 11}">⋯</td></tr>`;
    const z = zoneOf(r.note);
    const t = top.get(r.espnId);
    const gd = r.gd > 0 ? `+${r.gd}` : r.gd < 0 ? `−${-r.gd}` : '0';
    return `<tr class="dv-trow ${z ? z.cls : ''}" data-team="${esc(r.espnId)}" tabindex="0" title="${z ? esc(z.label) : ''}">` +
      `<td class="c rank">${r.rank}</td><td class="team">${esc(r.name)}</td><td class="num">${r.played}</td>` +
      `<td class="num">${r.won}</td><td class="num">${r.drawn}</td><td class="num">${r.lost}</td>` +
      `<td class="num">${r.gf}–${r.ga}</td><td class="num">${gd}</td>` +
      (compact ? '' : `<td class="num hide-sm dv-cards">${r.yc == null ? '–' : `<i class="dv-card-y"></i>${r.yc}${r.rc ? ` <i class="dv-card-r"></i>${r.rc}` : ''}`}</td>` +
        `<td class="hide-sm dv-scorer">${t && t.topScorer && t.topScorer.g ? `${esc(t.topScorer.name)} <b>${t.topScorer.g}</b>` : '<span class="muted">–</span>'}</td>`) +
      `<td class="num pts">${r.points}${r.deductions ? `<sup title="${r.deductions} poängs avdrag">*</sup>` : ''}</td></tr>`;
  }).join('');
  return `<div class="table-wrap dv-tw"><table class="dv-league">${head}<tbody>${body}</tbody></table></div>`;
}

function tableView(dv, P) {
  if (!P || P.unknown || !P.table) {
    return `<p class="empty">${unknown('okänt – ingen tabell hämtad för divisionen')}</p>`;
  }
  const rows = P.table.rows;
  const zones = [];
  for (const r of rows) {
    const z = zoneOf(r.note);
    if (z && !zones.some((x) => x.cls === z.cls && x.label === z.label)) zones.push(z);
  }
  const ded = rows.filter((r) => r.deductions);
  return sectionHead(`Tabell – ${dv.name}`, `${esc(state.data.season)} · ${Math.max(...rows.map((r) => r.played))} omgångar`) +
    card('Tabellen', {
      body: leagueTable(rows, P) +
        `<div class="dv-zones">${zones.map((z) => `<span class="${z.cls}"><i></i>${esc(z.label)}</span>`).join('')}</div>` +
        (ded.length ? `<p class="dv-note">* Poängavdrag: ${ded.map((r) => `${esc(r.name)} −${r.deductions}`).join(', ')}.</p>` : ''),
      src: `Tabell: ESPN, hämtat ${when(P.table.fetchedAt)} · kort och målskyttar: ESPN-trupperna, hämtat ${when(P.source.fetchedAt)} · ` +
        `<a href="#${esc(dv.id)}/prognos">Säsongsprognosen →</a>`,
      cls: 'dv-tablecard',
    });
}

// ---------- säsongsprognosen ----------

let seasonLoad = null;
async function loadSeason() {
  if (!seasonLoad) {
    seasonLoad = getJSON('data/season.json')
      .catch((err) => ({ error: `säsongsprognosen kunde inte läsas (${err.message})` }))
      .then((S) => { state.season = S; return S; });
  }
  return seasonLoad;
}

// Chans i hela procent. 0 och 100 = i ingen respektive alla simuleringar
// (inte matematiskt avgjort); <1 och >99 i stället för att avrunda dit.
function chance(x) {
  if (x == null) return '–';
  if (x === 0) return '<span class="dv-zero" title="i ingen av simuleringarna">0</span>';
  if (x === 1) return '<span title="i alla simuleringarna">100</span>';
  if (x < 0.005) return '<1';
  if (x > 0.995) return '>99';
  return String(Math.round(x * 100));
}
const chanceText = (x) => (x === 0 ? '0' : x < 0.005 ? '<1' : x > 0.995 && x < 1 ? '>99' : String(Math.round(x * 100)));
const signed = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? `±${num(0, d)}` : x > 0 ? `+${num(x, d)}` : `−${num(-x, d)}`);
const ranksText = (rs) => (rs.length === 1 ? `plats ${rs[0]}` : `plats ${rs[0]}–${rs[rs.length - 1]}`);
const fShort = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
const ZONE_CLS = { title: 'z-up', cl: 'z-up', promo: 'z-up', playoff: 'z-po', down: 'z-down' };

function seasonOf(div) {
  const S = state.season;
  if (!S || S.error || !S.divisions) return null;
  return S.divisions.find((x) => x.id === div) || null;
}

// Slutplaceringarna som en rad rutor, färgade efter zonen och mörkare ju
// större chansen (roten ur, så att några procent syns).
function posStrip(pos, F) {
  const zoneAt = new Map();
  for (const z of [...F.zones].reverse()) for (const r of z.ranks) zoneAt.set(r, ZONE_CLS[z.key] || '');
  return `<div class="dv-strip" aria-hidden="true">${pos.map((v, i) =>
    `<i class="${zoneAt.get(i + 1) || ''}" style="--a:${Math.round(Math.sqrt(v) * 100)}%" title="${i + 1}:a: ${chanceText(v)} %"></i>`).join('')}</div>`;
}

function forecastView(dv, P) {
  const S = state.season;
  if (!S || S.error) return `<p class="empty">${unknown(`okänt – ${S ? S.error : 'ingen säsongsprognos'}`)}</p>`;
  const F = seasonOf(dv.id);
  if (!F) return `<p class="empty">${unknown('okänt – ingen säsongsprognos för divisionen')}</p>`;
  if (F.unknown) return `<p class="empty">${unknown(`okänt – ${F.unknown}`)}</p>`;
  const now = new Map(P && !P.unknown && P.table ? P.table.rows.map((r) => [r.espnId, r]) : []);
  const zones = F.zones;
  const head = '<thead><tr><th class="c" title="Placering i tabellen nu">Nu</th><th>Lag</th>' +
    '<th class="num hide-xs" title="Poäng nu (efter poängavdrag)">P</th>' +
    '<th class="num" title="Förväntade poäng när säsongen är slut – inom parentes spannet där 80 % av simuleringarna hamnar">Förv. poäng</th>' +
    zones.map((z) => `<th class="num" title="${esc(`${z.label}: ${ranksText(z.ranks)}, chans i procent`)}">${esc(z.short || z.label)} %</th>`).join('') +
    '<th class="hide-sm" title="Chansen för varje slutplacering, från första till sista">Slutplacering</th>' +
    '<th class="num hide-md" title="Modellens förväntade målskillnad per match mot ett genomsnittligt Premier League-lag på neutral plan">Styrka</th></tr></thead>';
  const total = S.strength ? S.strength.length : null;
  const body = F.teams.map((t) => {
    const r = now.get(t.espnId);
    return `<tr class="dv-trow" data-team="${esc(t.espnId)}" tabindex="0">` +
      `<td class="c rank">${r ? r.rank : '–'}</td><td class="team">${esc(t.name)}</td>` +
      `<td class="num hide-xs">${t.now.points}${t.now.ded ? `<sup title="${t.now.ded} poängs avdrag">*</sup>` : ''}</td>` +
      `<td class="num pts">${int(t.points.mean)} <small class="muted hide-xs">${t.points.lo}–${t.points.hi}</small></td>` +
      zones.map((z) => `<td class="num">${chance(t.p[z.key])}</td>`).join('') +
      `<td class="hide-sm">${posStrip(t.pos, F)}</td>` +
      `<td class="num hide-md"${t.strength && total ? ` title="${t.strength.rank}:a av ${total} lag i nivå 1–4"` : ''}>${t.strength ? signed(t.strength.rating) : '–'}</td></tr>`;
  }).join('');
  const zoneKey = zones.map((z) => `<span class="${ZONE_CLS[z.key] || ''}"><i></i>${esc(z.label)}: ${esc(ranksText(z.ranks))}</span>`).join('');
  const ded = F.teams.filter((t) => t.now.ded);
  let html = sectionHead(`Säsongsprognos – ${dv.name}`, `${int(F.remaining)} matcher kvar`);
  html += card('Var lagen hamnar', {
    hint: 'modellens prognos, inte facit',
    body: `<div class="table-wrap dv-tw"><table class="dv-league dv-proj">${head}<tbody>${body}</tbody></table></div>` +
      `<div class="dv-zones">${zoneKey}</div>` +
      (ded.length ? `<p class="dv-note">* Poängavdrag (ESPN), redan dragna: ${ded.map((t) => `${esc(t.name)} −${t.now.ded}`).join(', ')}.</p>` : ''),
    src: `Prognosmotorn, regelversion ${esc(S.rulesVersion)}: resten av säsongen spelad ${int(F.sims)} gånger med modellens sannolikheter, ` +
      `skattat på matcher t.o.m. ${esc(dateLabel(S.fitThrough))} · resultat och spelprogram: ESPN, hämtat ${when(F.fixturesFetchedAt)} · zoner: ESPN:s tabell, hämtad ${when(F.standingsFetchedAt)}`,
    cls: 'dv-tablecard',
  });
  html += fixturesCard(F);
  html += seasonMethod(S, F);
  return html;
}

function dateLabel(iso) {
  if (!iso) return 'okänt';
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

// En kommande match som ruta: motståndarens förkortning, H/B och
// vinstchansen; färgen går från rött till grönt med de förväntade poängen.
function fxChip(n) {
  if (!n.p) return `<span class="dv-fx unknown" title="${esc(`${n.opponent}: prognos okänd`)}"><b>${esc(n.abbr || '?')}</b><small>?</small></span>`;
  const [w, d, l] = n.p;
  // Förväntade poäng 0,6–2,4 per match spänner upp färgskalan rött → grönt.
  const e = Math.min(1, Math.max(0, ((3 * w + d) - 0.6) / 1.8));
  const tip = `${fShort.format(new Date(n.date))} · ${n.home ? 'hemma' : 'borta'} mot ${n.opponent}: vinst ${chanceText(w)} %, oavgjort ${chanceText(d)} %, förlust ${chanceText(l)} %`;
  return `<span class="dv-fx" style="--e:${Math.round(e * 100)}%" title="${esc(tip)}"><b>${esc(n.abbr || n.opponent.slice(0, 3).toUpperCase())}</b><small>${n.home ? 'H' : 'B'} ${chanceText(w)}</small></span>`;
}

function fixturesCard(F) {
  const list = F.teams.filter((t) => t.next && t.next.list.length).sort((a, b) => (b.next.xp ?? -1) - (a.next.xp ?? -1));
  if (!list.length) return '';
  const rows = list.map((t) => `<tr class="dv-trow" data-team="${esc(t.espnId)}" tabindex="0"><td class="team">${esc(t.name)}</td>` +
    `<td><div class="dv-fxs">${t.next.list.map(fxChip).join('')}</div></td>` +
    `<td class="num pts">${t.next.xp == null ? '–' : num(t.next.xp, 2)}</td></tr>`).join('');
  return card('Programmet framåt', {
    hint: `de närmaste ${F.teams[0].next.n} ligamatcherna`,
    key: 'Vinstchans i % · H hemma, B borta · grönt lätt, rött svårt',
    body: `<div class="table-wrap dv-tw"><table class="dv-league dv-fxtable"><thead><tr><th>Lag</th><th>Matcherna</th><th class="num" title="Förväntade poäng per match de närmaste matcherna">Poäng/match</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    src: 'Prognosmotorn · samma sannolikheter som under Matcher',
    cls: 'dv-tablecard',
  });
}

function seasonMethod(S, F) {
  const items = [
    ['Simuleringen', `Varje återstående ligamatch spelas med modellens förväntade mål för matchen – samma som ger prognoserna under Matcher – och tabellen räknas ut. Det görs ${int(S.sims)} gånger; andelen gånger ett lag hamnar på en plats är chansen.`],
    ['Osäkerheten', `Simuleringarna fördelas på modellens ${S.samples} omskattningar med slumpvikter (samma som ger spannet under varje prognos). Ett lag som är bättre än skattningen är det då i alla sina matcher i samma simulering – som i verkligheten.${F.uncertainty ? '' : ' Den här gången saknades omskattningar för några matcher; där används bara skattningen.'}`],
    ['Förenklingar', 'Lagens styrka och tabelläget hålls fasta resten av säsongen – skador, övergångar och tränarbyten räknas inte in. Lika poäng skiljs på målskillnad, sedan gjorda mål, sedan lott. Playoff spelas inte: chansen gäller en playoffplats. Europaplatser via cuperna räknas inte.'],
    ['Zonerna', 'Vilka placeringar som ger uppflyttning, playoff, Europa och nedflyttning läses ur ESPN:s tabell.'],
    ['Styrka', 'Modellens förväntade målskillnad per match mot ett genomsnittligt Premier League-lag på neutral plan. Alla fyra divisioner på samma skala – se fliken Styrka.'],
    ['Programmet framåt', 'Förväntade poäng per match räknas med lagets egen styrka, så starka lag hamnar högt. Färgerna visar hur svår varje match är för just det laget.'],
  ];
  return `<details class="help dv-glossary src-only"><summary>Så räknas prognosen</summary><dl>${items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>`;
}

// Modellens styrka för alla lag i nivå 1–4 (Tabeller → Styrka).
function strengthSection(S) {
  if (!S || S.error || !S.strength || !S.strength.length) {
    return card('Modellens styrka – alla lag', { body: `<p class="empty">${unknown(`okänt – ${S && S.error ? S.error : 'ingen skattning'}`)}</p>`, cls: 'dv-wide' });
  }
  const divOf = new Map(state.data.divisions.map((x) => [x.short, x]));
  const rows = S.strength.map((t) => {
    const d = divOf.get(t.division);
    return `<tr><td class="c rank">${t.rank}</td><td class="team">${esc(t.name)}</td>` +
      `<td>${d ? `<i class="dv-key dot" style="--c:${color(d.id)}"></i>` : ''}${esc(t.division)}</td>` +
      `<td class="num pts">${signed(t.rating)}</td><td class="num hide-sm">${num(t.gf, 2)}–${num(t.ga, 2)}</td>` +
      `<td class="num hide-sm muted">${t.range ? (t.range[0] === t.range[1] ? t.range[0] : `${t.range[0]}–${t.range[1]}`) : '–'}</td></tr>`;
  }).join('');
  return card('Modellens styrka – alla lag', {
    hint: `${S.strength.length} lag · skattat t.o.m. ${dateLabel(S.fitThrough)}`,
    body: '<div class="table-wrap dv-tw dv-scroll"><table class="dv-league"><thead><tr><th class="c">#</th><th>Lag</th><th>Division</th>' +
      '<th class="num" title="Förväntad målskillnad per match mot ett genomsnittligt Premier League-lag på neutral plan">Styrka</th>' +
      `<th class="num hide-sm" title="Förväntade mål för–emot i samma match">Mål</th><th class="num hide-sm" title="Placeringen i 80 % av omskattningarna">Spann</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    src: 'Prognosmotorn: mål efter 90 minuter i alla tävlingar sedan fyra säsonger, nyare matcher väger tyngre. Lag med för få matcher i underlaget saknas.',
    cls: 'dv-wide',
  });
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

function sortHead(cols, f, attr, lead = '') {
  return `<thead><tr>${lead}` + cols.map((c) => {
    const on = c.key === f.sort;
    return `<th class="${c.cls}${on ? ' on' : ''}" aria-sort="${on ? (f.dir > 0 ? 'ascending' : 'descending') : 'none'}">` +
      `<button type="button" ${attr}="${c.key}"${c.title ? ` title="${esc(c.title)}"` : ''}>${esc(c.label)}${on ? (f.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
  }).join('') + '</tr></thead>';
}

function colCell(c, x) {
  let v;
  if (c.show) v = c.show(x);
  else if (c.pct) v = c.get(x) == null ? cell(null) : pct(c.get(x));
  else v = cell(c.get(x), { d: c.d || 0, strong: c.strong });
  if (c.ok && c.get(x) != null && !c.ok(x)) v = `<span class="dv-unq" title="${esc(c.okWhy || 'för litet underlag')}">${v}</span>`;
  return `<td class="${c.cls}">${v}</td>`;
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

// Kolumngrupperna som ett segment ovanför tabellen.
function segHtml(groups, cur, attr) {
  return `<div class="dv-seg" role="group" aria-label="Kolumner">${groups.map((g) =>
    `<button type="button" ${attr}="${g.id}" aria-pressed="${g.id === cur}">${esc(g.label)}</button>`).join('')}</div>`;
}

// ---------- spelarna ----------

// Gränserna för kvoter, ur spelarfilen (thresholds).
const TH = { shots: 10, min: 270 };
const per90 = (x, p) => (x == null || !p.min ? null : (x / p.min) * 90);
const dxgOf = (p) => (p.xg != null && p.fg != null ? p.fg - p.xg : null);
const qMin = { ok: (p) => p.min >= TH.min, okWhy: 'mindre än tre hela matchers speltid' };

const P_GROUPS = [
  { id: 'oversikt', label: 'Översikt' },
  { id: 'avslut', label: 'Avslut' },
];
const PA = ['oversikt', 'avslut'];
const PCOLS = [
  { key: 'name', label: 'Spelare', get: (p) => p.name, text: true, cls: 'pname dv-stick', in: PA,
    show: (p) => `${esc(p.name)}<small class="show-sm">${esc(p.team)}</small>` },
  { key: 'team', label: 'Lag', get: (p) => p.team, text: true, cls: 'pteam hide-sm', in: PA, show: (p) => esc(p.team) },
  { key: 'pos', label: 'Pos', title: 'Position', get: (p) => POS_ORDER[p.pos], show: (p) => esc(p.pos || '–'), cls: 'c', in: PA },
  { key: 'age', label: 'Ålder', get: (p) => p.age, cls: 'num hide-xs', in: ['oversikt'] },
  { key: 'nat', label: 'Nation', get: (p) => natSv(p.nat), text: true, cls: 'pnat hide-sm', in: ['oversikt'], show: (p) => esc(natSv(p.nat) || '–') },
  { key: 'app', label: 'M', title: 'Matcher – från start och inhopp', get: (p) => p.app, cls: 'num', in: PA },
  { key: 'starts', label: 'Start', title: 'Matcher från start', get: (p) => p.starts, cls: 'num hide-md hide-sm', in: ['oversikt'] },
  { key: 'min', label: 'Min', title: 'Spelade minuter (FPL)', get: (p) => p.min, cls: 'num hide-xs', fpl: true, in: PA },
  { key: 'g', label: 'Mål', get: (p) => p.g, cls: 'num', strong: true, in: PA },
  { key: 'a', label: 'Ass', title: 'Assist – passningen eller skottet före målet', get: (p) => p.a, cls: 'num', in: ['oversikt'] },
  { key: 'ga', label: 'M+A', title: 'Mål plus assist', get: (p) => (p.noStats ? null : (p.g || 0) + (p.a || 0)), cls: 'num hide-xs', in: ['oversikt'] },
  { key: 'yc', label: 'Gul', title: 'Gula kort', get: (p) => p.yc, cls: 'num', in: ['oversikt'] },
  { key: 'rc', label: 'Röd', title: 'Röda kort', get: (p) => p.rc, cls: 'num', in: ['oversikt'] },
  { key: 'cost', label: 'Pris', title: 'Priset i Fantasy Premier League, miljoner pund', get: (p) => p.cost, cls: 'num', fpl: true, in: ['oversikt'],
    show: (p) => (p.cost == null ? cell(null) : `<span class="dv-price">£${num(p.cost, 1)}m</span>`) },
  { key: 'sh', label: 'Skott', get: (p) => p.sh, cls: 'num', in: ['avslut'] },
  { key: 'sot', label: 'På mål', title: 'Skott på mål', get: (p) => p.sot, cls: 'num', in: ['avslut'] },
  { key: 'conv', label: 'Mål/skott', title: 'Mål per skott', get: (p) => (p.sh ? p.g / p.sh : null), pct: true, cls: 'num hide-xs', in: ['avslut'],
    ok: (p) => p.sh >= TH.shots, okWhy: 'färre än tio skott' },
  { key: 'gpm', label: 'Mål/M', title: 'Mål per match', get: (p) => (p.app ? p.g / p.app : null), d: 2, cls: 'num', nofpl: true, in: ['avslut'] },
  { key: 'xg', label: 'xG', title: 'Förväntade mål ur chanserna', get: (p) => p.xg, d: 1, cls: 'num', fpl: true, in: ['avslut'] },
  { key: 'dxg', label: '±xG', title: 'Mål minus xG – plus = fler mål än chanserna brukar ge', get: dxgOf, cls: 'num', fpl: true, in: ['avslut'],
    show: (p) => delta(dxgOf(p), { d: 1, dead: 0.05 }) },
  { key: 'xa', label: 'xA', title: 'Förväntade assist', get: (p) => p.xa, d: 1, cls: 'num hide-xs', fpl: true, in: ['avslut'] },
  { key: 'g90', label: 'Mål/90', title: 'Mål per 90 minuter', get: (p) => per90(p.fg, p), d: 2, cls: 'num', fpl: true, in: ['avslut'], ...qMin },
  { key: 'xg90', label: 'xG/90', title: 'xG per 90 minuter', get: (p) => per90(p.xg, p), d: 2, cls: 'num hide-sm', fpl: true, in: ['avslut'], ...qMin },
  { key: 'ga90', label: 'M+A/90', title: 'Mål plus assist per 90 minuter', get: (p) => per90(p.fg == null ? null : p.fg + (p.fa || 0), p), d: 2, cls: 'num hide-xs', fpl: true, in: ['avslut'], ...qMin },
];

function playerCols(P) {
  const fpl = !!P.fpl;
  return PCOLS.filter((c) => c.in.includes(state.pf.cols) && (!c.fpl || fpl) && (!c.nofpl || !fpl));
}

function filteredPlayers(P, cols) {
  const f = state.pf;
  const q = f.q.trim().toLowerCase();
  const col = cols.find((c) => c.key === f.sort) || cols.find((c) => c.key === 'g');
  const list = P.players.filter((p) => (!f.played || (p.app > 0)) && (!f.team || p.teamId === f.team) && (!f.pos || p.pos === f.pos) &&
    (!q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || (natSv(p.nat) || '').toLowerCase().includes(q)));
  return sortBy(list, col, col.key === f.sort ? f.dir : -1,
    (a, b) => (b.app || 0) - (a.app || 0) || a.name.localeCompare(b.name, 'sv'));
}

function playerTableHtml(P) {
  const cols = playerCols(P);
  const list = filteredPlayers(P, cols);
  const f = state.pf;
  const head = sortHead(cols, f, 'data-sort', '<th class="c hide-xs">#</th>');
  const rows = list.slice(0, f.limit).map((p, i) => `<tr class="dv-prow" data-pid="${esc(p.id)}" tabindex="0">` +
    `<td class="c rank hide-xs">${i + 1}</td>${cols.map((c) => colCell(c, p)).join('')}</tr>`).join('');
  const rest = list.length - Math.min(list.length, f.limit);
  return `<div class="table-wrap dv-tw"><table class="dv-players">${head}<tbody>${rows}</tbody></table></div>` +
    (rest > 0 ? `<button type="button" class="dv-more" data-more="1">Visa ${Math.min(rest, 100)} till (${rest} kvar)</button>` : '') +
    `<p class="dv-count" id="dv-count">${list.length} spelare${f.played ? ' som spelat' : ''}${f.team || f.pos || f.q ? ' med filtret' : ''}</p>`;
}

// Topplistorna: fem på kortet, upp till 20 i en dialog. Listan sparas per
// vy så att knappen Topp 20 kan öppna den.
const tops = new Map();
function topCard(key, title, icon, list, value, opts = {}) {
  tops.set(key, { title, icon, list, value, note: opts.note });
  return leaderCard(title, icon, list.slice(0, 5), value, { ...opts, top: list.length > 5 ? key : null });
}

function openTop(key) {
  const t = tops.get(key);
  if (!t) return;
  const rows = t.list.slice(0, 20).map((p, i) => `<li><button type="button" class="dv-lrow" data-pid="${esc(p.id)}">` +
    `<span class="dv-lrank">${i + 1}</span><span class="dv-lname">${esc(p.name)}<small>${esc(p.team)}</small></span>` +
    `<span class="dv-lval">${t.value(p)}</span></button></li>`).join('');
  showModal(`<div class="dv-mhead"><div class="dv-avatar">${t.icon}</div><div><h3>${esc(t.title)}</h3>` +
    `<p>${esc(state.data.divisions.find((x) => x.id === state.div).name)} · topp ${Math.min(20, t.list.length)}</p></div></div>` +
    `<ol class="dv-toplist">${rows}</ol>${t.note ? `<p class="dv-mnote">${t.note}</p>` : ''}`);
}

function playersView(dv, P) {
  if (!P || P.unknown) {
    return `<p class="empty">${unknown(`okänt – ${P ? P.reason : 'ingen spelardata'}`)}</p>`;
  }
  TH.shots = P.thresholds.minShotsConversion;
  TH.min = P.thresholds.minMinutesP90 || 270;
  tops.clear();
  const L = P.leaders;
  const t = P.totals;
  const f = state.pf;
  const xg = !!(P.fpl && L.overXg);
  const teams = [...P.teams].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  let html = sectionHead('Spelarstatistik', `Ligamatcher ${esc(state.data.season)}`);
  const xgVal = (p) => `<b>${delta(p.dxg, { d: 1 })}</b><small>${p.fg} mål · ${num(p.xg, 1)} xG</small>`;
  html += '<div class="dv-leaders">' +
    topCard('goals', 'Skytteliga', '⚽', L.goals, (p) => `<b>${p.g}</b><small>${p.app} m</small>`) +
    topCard('assists', 'Flest assist', '🎯', L.assists, (p) => `<b>${p.a}</b><small>${p.app} m</small>`) +
    (xg
      ? topCard('overxg', 'Över xG', '📈', L.overXg, xgVal, { note: 'Mål minus förväntade mål (xG)' }) +
        topCard('underxg', 'Under xG', '📉', L.underXg, xgVal, { note: 'Färre mål än chanserna brukar ge' })
      : topCard('involvement', 'Mål + assist', '✨', L.involvement, (p) => `<b>${p.ga}</b><small>${p.g}+${p.a}</small>`) +
        topCard('conversion', 'Effektivast', '🔥', L.conversion, (p) => `<b>${pct(p.conv)}</b><small>${p.g}/${p.sh}</small>`,
          { note: `Mål per skott · minst ${P.thresholds.minShotsConversion} skott`, empty: 'ingen har tillräckligt många skott än' })) +
    topCard('cards', 'Flest kort', '🟨', byCards(L.yellow.concat(L.red.filter((r) => !L.yellow.some((y) => y.id === r.id)))), cardsVal) +
    topCard('keepers', 'Målvakter', '🧤', L.keepers, (p) => `<b>${pct(p.savePct)}</b><small>${p.gc} insl.</small>`,
      { note: 'Räddningsprocent · minst halva lagets matcher', empty: 'okänt' }) +
    '</div>';

  html += card('Alla spelare', {
    body: segHtml(P_GROUPS, f.cols, 'data-pcols') + '<div class="dv-filters">' +
      `<input type="search" id="pf-q" class="dv-input" placeholder="Sök spelare, lag eller nation …" value="${esc(f.q)}" aria-label="Sök spelare">` +
      `<select id="pf-team" class="dv-select" aria-label="Lag"><option value="">Alla lag</option>${teams.map((x) => `<option value="${esc(x.espnId)}"${x.espnId === f.team ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` +
      `<select id="pf-pos" class="dv-select" aria-label="Position"><option value="">Alla positioner</option>${Object.keys(POS).map((k) => `<option value="${k}"${k === f.pos ? ' selected' : ''}>${POS_PLURAL[k]}</option>`).join('')}</select>` +
      `<label class="dv-toggle"><input type="checkbox" id="pf-played"${f.played ? ' checked' : ''}> Bara de som spelat</label>` +
      '</div><div id="dv-ptable">' + playerTableHtml(P) + '</div>',
    src: `ESPN, hämtat ${when(P.source.fetchedAt)} · ${int(t.used)} av ${int(t.players)} har spelat` +
      (t.teamsBehind ? ` · släpar en omgång för ${t.teamsBehind} lag` : '') +
      (P.fpl ? ` · speltid, xG och pris: Fantasy Premier League, hämtat ${when(P.fpl.fetchedAt)}` : ''),
    cls: 'dv-wide',
  });

  html += '<div class="dv-grid2">' + squadFacts(P, dv) + nationsCard(P) + '</div>';
  return html;
}

function barList(rows, { label, value, fmt, sub }) {
  const max = Math.max(...rows.map(value)) || 1;
  return '<ul class="dv-barlist">' + rows.map((r) => `<li><span class="bl-l">${label(r)}</span>` +
    `<span class="bl-b"><i style="width:${((value(r) / max) * 100).toFixed(1)}%"></i></span>` +
    `<span class="bl-v">${fmt(r)}${sub ? `<small>${sub(r)}</small>` : ''}</span></li>`).join('') + '</ul>';
}

function squadFacts(P, dv) {
  const t = P.totals;
  const posName = { A: 'Anfallare', MF: 'Mittfältare', B: 'Backar', MV: 'Målvakter', okänd: 'Okänd position' };
  return card('Spelarna i siffror', {
    body: '<dl class="facts dv-facts">' +
      `<dt title="Viktad med matcher">Snittålder</dt><dd><b>${num(t.avgAge, 1)} år</b></dd>` +
      `<dt title="Andel av de spelade matcherna">Engelska spelare</dt><dd><b>${pct(t.homeShare)}</b></dd>` +
      `<dt>Nationer</dt><dd><b>${int(t.nations)}</b></dd>` +
      `<dt title="Självmål, spelare som lämnat klubben och omgången ESPN inte fört in">Mål utan målskytt</dt><dd>${t.unattributed == null ? 'okänt' : `<b>${int(t.unattributed)}</b> <span class="muted">av ${int(t.goalsFor)}</span>`}</dd></dl>` +
      '<h5 class="dv-h5">Vem gör målen?</h5>' +
      barList(P.goalsByPos, { label: (r) => esc(posName[r.pos] || r.pos), value: (r) => r.goals, fmt: (r) => pct(r.share), sub: (r) => `${r.goals} mål` }),
    src: `ESPN-trupperna, hämtat ${when(P.source.fetchedAt)}`,
  });
}

function nationsCard(P) {
  const list = P.nations.filter((n) => n.nat !== 'okänd').slice(0, 10);
  return card('Nationaliteter', {
    hint: 'andel av matcherna',
    body: barList(list, { label: (n) => esc(natSv(n.nat)), value: (n) => n.apps, fmt: (n) => pct(n.appShare), sub: (n) => `${n.players} spelare` }),
    src: 'ESPN · nationalitet enligt spelarens registrering (citizenship)',
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
const vsOdds = (t) => { const m = fdOf(t, 'mkt'); return m ? m.pts - m.xp : null; };
const roi = (t) => { const m = fdOf(t, 'mkt'); return m ? (m.ret - m.n) / m.n : null; };
const sqOf = (t, k) => (t.sq ? t.sq[k] : null);
const signedInt = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '0');

const T_GROUPS = [
  { id: 'tabell', label: 'Tabell', sort: 'rank', dir: 1 },
  { id: 'xg', label: 'xG', sort: 'xgd', dir: -1, needs: 'xg' },
  { id: 'spelet', label: 'Spelet', sort: 'shf', dir: -1 },
  { id: 'marknaden', label: 'Oddsen', sort: 'vso', dir: -1 },
  { id: 'truppen', label: 'Truppen', sort: 'goals', dir: -1, needs: 'players' },
];
const TA = T_GROUPS.map((g) => g.id);
const TCOLS = [
  { key: 'rank', label: '#', title: 'Placering i tabellen', get: (t) => t.rank, cls: 'c rank', asc: true, in: ['tabell'], show: (t) => t.rank },
  { key: 'name', label: 'Lag', get: (t) => t.name, text: true, cls: 'team dv-stick', in: TA, show: (t) => esc(t.name) },
  { key: 'm', label: 'M', title: 'Spelade matcher', get: (t) => t.m, cls: 'num', in: ['tabell'] },
  { key: 'w', label: 'V', title: 'Vunna', get: (t) => t.w, cls: 'num', in: ['tabell'] },
  { key: 'd', label: 'O', title: 'Oavgjorda', get: (t) => t.d, cls: 'num', in: ['tabell'] },
  { key: 'l', label: 'F', title: 'Förlorade', get: (t) => t.l, cls: 'num', in: ['tabell'] },
  { key: 'gf', label: 'GM', title: 'Gjorda mål', get: (t) => t.gf, cls: 'num hide-xs', in: ['tabell'] },
  { key: 'ga', label: 'IM', title: 'Insläppta mål', get: (t) => t.ga, cls: 'num hide-xs', asc: true, in: ['tabell'] },
  { key: 'gd', label: 'MS', title: 'Målskillnad', get: (t) => t.gd, cls: 'num', in: ['tabell'], show: (t) => signedInt(t.gd) },
  { key: 'pts', label: 'P', title: 'Poäng', get: (t) => t.pts, cls: 'num pts', in: ['tabell'],
    show: (t) => `<b>${t.pts}</b>${t.ded ? `<sup title="${t.ded} poängs avdrag">*</sup>` : ''}` },
  { key: 'gpm', label: 'Mål/M', title: 'Gjorda mål per match', get: (t) => (t.m ? t.gf / t.m : null), d: 2, cls: 'num hide-sm', in: ['tabell'] },
  { key: 'gapm', label: 'IM/M', title: 'Insläppta mål per match', get: (t) => (t.m ? t.ga / t.m : null), d: 2, cls: 'num hide-sm', asc: true, in: ['tabell'] },
  { key: 'cs', label: 'Nollor', title: 'Andel matcher utan insläppt mål', get: (t) => share(t, 'cs'), pct: true, cls: 'num hide-xs', in: ['tabell'] },

  { key: 'xgf', label: 'xG/M', title: 'Förväntade mål per match – chanserna laget skapat', get: (t) => per(fdOf(t, 'xg'), 'f'), d: 2, cls: 'num', in: ['xg'] },
  { key: 'xga', label: 'xGA/M', title: 'Förväntade insläppta per match – chanserna motståndet fått', get: (t) => per(fdOf(t, 'xg'), 'a'), d: 2, cls: 'num', asc: true, in: ['xg'] },
  { key: 'xgd', label: 'xG-diff', title: 'xG minus xGA per match', get: xgd, cls: 'num', in: ['xg'], show: (t) => delta(xgd(t), { d: 2, dead: 0.005 }) },
  { key: 'dxg', label: '±xG', title: 'Mål minus xG – plus = fler mål än chanserna brukar ge', get: (t) => { const x = fdOf(t, 'xg'); return x ? x.gf - x.f : null; }, cls: 'num', in: ['xg'],
    show: (t) => { const x = fdOf(t, 'xg'); return delta(x ? x.gf - x.f : null, { d: 1 }); } },
  { key: 'dxga', label: '±xGA', title: 'Insläppta minus xGA – minus = färre insläppta än chanserna brukar ge', get: (t) => { const x = fdOf(t, 'xg'); return x ? x.ga - x.a : null; }, cls: 'num', asc: true, in: ['xg'],
    show: (t) => { const x = fdOf(t, 'xg'); return delta(x ? x.ga - x.a : null, { d: 1, invert: true }); } },
  { key: 'opp', label: 'Motst', title: 'Motståndets styrka hittills mot snittet i divisionen – plus = tuffare program', get: (t) => fdOf(t, 'opp'), cls: 'num hide-xs', in: ['xg'],
    show: (t) => (fdOf(t, 'opp') == null ? cell(null) : `<span class="dv-even">${signed(fdOf(t, 'opp'), 2)}</span>`) },

  { key: 'shf', label: 'Skott/M', title: 'Skott per match', get: (t) => per(fdOf(t, 'sh'), 'f'), d: 1, cls: 'num', in: ['spelet'] },
  { key: 'sha', label: 'Mot/M', title: 'Skott mot per match', get: (t) => per(fdOf(t, 'sh'), 'a'), d: 1, cls: 'num', asc: true, in: ['spelet'] },
  { key: 'sotf', label: 'På mål/M', title: 'Skott på mål per match', get: (t) => per(fdOf(t, 'sh'), 'of'), d: 1, cls: 'num hide-xs', in: ['spelet'] },
  { key: 'corf', label: 'Hörnor/M', title: 'Hörnor per match', get: (t) => per(fdOf(t, 'cor'), 'f'), d: 1, cls: 'num hide-xs', in: ['spelet'] },
  { key: 'ycm', label: 'Gula/M', title: 'Gula kort per match', get: (t) => per(fdOf(t, 'cards'), 'y'), d: 2, cls: 'num', in: ['spelet'] },
  { key: 'rcs', label: 'Röda', title: 'Röda kort', get: (t) => (fdOf(t, 'cards') ? fdOf(t, 'cards').r : null), cls: 'num hide-xs', in: ['spelet'] },
  { key: 'o25', label: 'Ö2,5', title: 'Andel av lagets matcher med tre mål eller fler', get: (t) => share(t, 'o25'), pct: true, cls: 'num', in: ['spelet'] },
  { key: 'btts', label: 'BLGM', title: 'Båda lagen gör mål – andel av lagets matcher', get: (t) => share(t, 'btts'), pct: true, cls: 'num', in: ['spelet'] },

  { key: 'mxp', label: 'Väntat', title: 'Poängen oddsen väntade sig, match för match (stängningsodds, marginalen bortdragen)', get: (t) => (fdOf(t, 'mkt') ? fdOf(t, 'mkt').xp : null), d: 1, cls: 'num', in: ['marknaden'] },
  { key: 'mpts', label: 'Poäng', title: 'Poängen i samma matcher', get: (t) => (fdOf(t, 'mkt') ? fdOf(t, 'mkt').pts : null), cls: 'num', in: ['marknaden'] },
  { key: 'vso', label: '±', title: 'Poäng minus väntade poäng – plus = bättre än oddsen trodde', get: vsOdds, cls: 'num', in: ['marknaden'],
    show: (t) => delta(vsOdds(t), { d: 1 }) },
  { key: 'fav', label: 'Favorit', title: 'Andel matcher där laget var favorit enligt oddsen', get: (t) => { const m = fdOf(t, 'mkt'); return m ? m.fav / m.n : null; }, pct: true, cls: 'num hide-xs', in: ['marknaden'] },
  { key: 'roi', label: 'Avkastning', title: 'Lika stor insats på att laget vinner varje match, till stängningsoddset: vinst eller förlust i procent av insatserna', get: roi, cls: 'num', in: ['marknaden'],
    show: (t) => delta(roi(t), { dead: 0.005, fmt: signedPct }) },

  { key: 'used', label: 'Spelare', title: 'Spelare som spelat minst en ligamatch', get: (t) => sqOf(t, 'used'), cls: 'num', in: ['truppen'] },
  { key: 'avgAge', label: 'Ålder', title: 'Snittålder, viktad med matcher', get: (t) => sqOf(t, 'avgAge'), cls: 'num', d: 1, in: ['truppen'] },
  { key: 'homeShare', label: 'Engelska', title: 'Andel av matcherna spelade av engelska spelare', get: (t) => sqOf(t, 'homeShare'), cls: 'num', pct: true, in: ['truppen'] },
  { key: 'goals', label: 'Mål', title: 'Mål av lagets spelare (utan självmål)', get: (t) => sqOf(t, 'goals'), cls: 'num', in: ['truppen'] },
  { key: 'scorer', label: 'Bäste målskytt', get: (t) => (t.sq && t.sq.topScorer ? t.sq.topScorer.g : null), cls: 'hide-sm', in: ['truppen'],
    show: (t) => (t.sq && t.sq.topScorer && t.sq.topScorer.g ? `${esc(t.sq.topScorer.name)} <b>${t.sq.topScorer.g}</b>` : '–') },
  { key: 'topScorerShare', label: 'Beroende', title: 'Bäste målskyttens andel av lagets mål', get: (t) => sqOf(t, 'topScorerShare'), cls: 'num', pct: true, in: ['truppen'] },
  { key: 'yc', label: 'Gula', get: (t) => sqOf(t, 'yc'), cls: 'num', in: ['truppen'] },
  { key: 'rc', label: 'Röda', get: (t) => sqOf(t, 'rc'), cls: 'num', in: ['truppen'] },
];

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

// Lagen som topplistor: kortets rader öppnar lagkortet när det finns.
function teamTop(title, icon, list, value, { note, asc = false, get } = {}) {
  const rows = list.filter((t) => get(t) != null)
    .sort((a, b) => (asc ? get(a) - get(b) : get(b) - get(a)) || a.name.localeCompare(b.name, 'sv')).slice(0, 5);
  const li = rows.map((t, i) => `<li><button type="button" class="dv-lrow"${t.espnId ? ` data-team="${esc(t.espnId)}"` : ' disabled'}>` +
    `<span class="dv-lrank">${i + 1}</span><span class="dv-lname">${esc(t.name)}<small>${ordinal(t.rank)} i tabellen</small></span>` +
    `<span class="dv-lval">${value(t)}</span></button></li>`).join('');
  return `<section class="dv-leader"><h4><span class="dv-licon" aria-hidden="true">${icon}</span>${esc(title)}</h4>` +
    `<ol>${li || '<li class="dv-lempty">okänt</li>'}</ol>${note ? `<p class="dv-lnote">${note}</p>` : ''}</section>`;
}

function teamsView(dv, P, T) {
  if (!T || T.unknown) return `<p class="empty">${unknown(`okänt – ${T ? T.reason : 'ingen lagstatistik'}`)}</p>`;
  const groups = teamGroups(T, P);
  const f = state.tf;
  if (!groups.some((g) => g.id === f.cols)) Object.assign(f, { cols: 'tabell', sort: 'rank', dir: 1 });
  const all = teamRows(T, P);
  const cols = TCOLS.filter((c) => c.in.includes(f.cols));
  const col = cols.find((c) => c.key === f.sort) || cols[0];
  const list = sortBy([...all], col, f.dir, (a, b) => a.rank - b.rank);
  const head = sortHead(cols, f, 'data-tsort');
  const body = list.map((t) => `<tr class="${t.espnId && P && !P.unknown ? 'dv-trow' : ''} ${zoneOf(t.note) ? zoneOf(t.note).cls : ''}"` +
    `${t.espnId && P && !P.unknown ? ` data-team="${esc(t.espnId)}" tabindex="0"` : ''}>${cols.map((c) => colCell(c, t)).join('')}</tr>`).join('');

  const S = T.source.stats;
  const fd = `football-data.co.uk, ${int(S.matches)} matcher t.o.m. ${S.last ? esc(dateLabel(S.last)) : 'okänt'}`;
  const src = {
    tabell: `Tabell: ${esc(T.source.table.provider)}, hämtat ${when(T.source.table.fetchedAt)} · nollor: ${fd}`,
    xg: `xG: ${fd}${T.source.strength ? ` · motståndet: prognosmotorns styrka t.o.m. ${esc(dateLabel(T.source.strength.fitThrough))}` : ''}`,
    spelet: fd,
    marknaden: `Stängningsodds, snittet hos spelbolagen: ${fd}`,
    truppen: P && !P.unknown ? `ESPN-trupperna, hämtat ${when(P.source.fetchedAt)}` : '',
  }[f.cols];

  const leaders = T.hasXg
    ? teamTop('Skapar mest', '⚡', all, (t) => `<b>${num(per(t.fd.xg, 'f'), 2)}</b><small>xG per match</small>`, { get: (t) => per(fdOf(t, 'xg'), 'f') }) +
      teamTop('Släpper till minst', '🛡️', all, (t) => `<b>${num(per(t.fd.xg, 'a'), 2)}</b><small>xGA per match</small>`, { get: (t) => per(fdOf(t, 'xg'), 'a'), asc: true })
    : teamTop('Skjuter mest', '⚡', all, (t) => `<b>${num(per(t.fd.sh, 'f'), 1)}</b><small>skott per match</small>`, { get: (t) => per(fdOf(t, 'sh'), 'f') }) +
      teamTop('Tillåter minst', '🛡️', all, (t) => `<b>${num(per(t.fd.sh, 'a'), 1)}</b><small>skott mot per match</small>`, { get: (t) => per(fdOf(t, 'sh'), 'a'), asc: true });

  return sectionHead('Lagen') +
    '<div class="dv-leaders dv-leaders4">' + leaders +
    teamTop('Slår oddsen', '📈', all, (t) => `<b>${delta(vsOdds(t), { d: 1 })}</b><small>${t.fd.mkt.pts} p · ${num(t.fd.mkt.xp, 1)} väntat</small>`, { get: vsOdds, note: 'Poäng mot vad stängningsoddsen väntade sig' }) +
    teamTop('Bäst att spela på', '💰', all, (t) => `<b>${delta(roi(t), { fmt: signedPct })}</b><small>${t.fd.mkt.n} matcher</small>`, { get: roi, note: 'Samma insats på seger i varje match' }) +
    '</div>' +
    card('Alla lag', {
      body: segHtml(groups, f.cols, 'data-tcols') +
        `<div class="table-wrap dv-tw"><table class="dv-teams dv-league">${head}<tbody>${body}</tbody></table></div>`,
      src,
      cls: 'dv-wide',
    });
}

// ---------- spelarkort och lagkort (dialog) ----------

function dialog() {
  let d = document.getElementById('dv-modal');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'dv-modal';
    d.className = 'dv-modal';
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) d.close();
      const p = e.target.closest('[data-pid]');
      if (p && d.contains(p)) openPlayer(p.dataset.pid);
    });
    document.body.appendChild(d);
  }
  return d;
}

function showModal(html) {
  const d = dialog();
  d.innerHTML = `<div class="dv-mbox"><button type="button" class="dv-mclose" data-close aria-label="Stäng">×</button>${html}</div>`;
  if (!d.open) d.showModal();
  d.scrollTop = 0;
  const box = d.querySelector('.dv-mbox');
  if (box) box.scrollTop = 0;
}

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
  const initials = p.jersey || p.name.split(/\s+/).map((x) => x[0]).slice(0, 2).join('');
  const sub = [p.team, p.jersey ? `#${p.jersey}` : null, POS[p.pos] || null].filter(Boolean).map(esc).join(' · ');
  let html = `<div class="dv-mhead"><div class="dv-avatar">${esc(initials)}</div><div><h3>${esc(p.name)}</h3><p>${sub}</p></div></div>`;
  if (p.noStats) {
    html += `<div class="dv-mtiles">${mtile(p.age == null ? '–' : p.age, 'Ålder')}${mtile(natSv(p.nat) || '–', 'Nation')}</div>` +
      `<p class="dv-calm">${unknown('Ingen statistik hos ESPN i år')}</p>`;
  } else {
    html += '<div class="dv-mtiles">' + mtile(p.age == null ? '–' : p.age, 'Ålder') + mtile(p.app, 'Matcher') +
      (p.min != null ? mtile(int(p.min), 'Minuter') : '') +
      (p.pos === 'MV' ? mtile(p.savePct == null ? '–' : pct(p.savePct), 'Räddningar') + mtile(p.gc, 'Insläppta')
        : mtile(p.g, 'Mål') + mtile(p.a, 'Assist')) + '</div>';
    const rows = [
      ['Nationalitet', esc(natSv(p.nat) || 'okänt')],
      ['Från start / inhopp', `${p.starts ?? '–'} / ${p.app != null && p.starts != null ? p.app - p.starts : '–'}`],
    ];
    if (p.min != null && p.app) rows.push(['Speltid per match', `${int(p.min / p.app)} min`]);
    if (p.pos === 'MV') {
      rows.push(['Räddningar', `${p.sv ?? '–'} av ${p.sv != null && p.gc != null ? p.sv + p.gc : '–'} skott på mål`]);
      rows.push(['Insläppta per match', p.gc != null && p.app ? num(p.gc / p.app, 1) : '–']);
    } else {
      rows.push(['Mål per match', p.app ? num(p.g / p.app, 2) : '–']);
      rows.push(['Skott / på mål', `${p.sh ?? '–'} / ${p.sot ?? '–'}`]);
      rows.push(['Mål per skott', p.sh ? `${pct(p.g / p.sh)} <span class="muted">(${p.g} av ${p.sh})</span>` : '–']);
      if (p.xg != null) {
        rows.push(['xG / xA', `${num(p.xg, 2)} / ${num(p.xa, 2)}`]);
        rows.push(['Mål mot xG', `${delta(dxgOf(p), { d: 1 })} <span class="muted">(${p.fg} mål på ${num(p.xg, 1)} xG)</span>`]);
        if (p.min >= TH.min) rows.push(['Per 90 minuter', `${num(per90(p.fg, p), 2)} mål · ${num(per90(p.xg, p), 2)} xG`]);
      }
    }
    rows.push(['Kort', p.yc || p.rc ? `${p.yc ? `<i class="dv-card-y"></i>${p.yc} gula` : ''}${p.rc ? ` <i class="dv-card-r"></i>${p.rc} röda` : ''}` : 'inga']);
    if (team && team.goals && p.g) rows.push([`Andel av ${esc(team.name)}s mål`, `${pct(p.g / team.goals)} <span class="muted">(${p.g} av ${team.goals})</span>`]);
    html += `<dl class="dv-mrows">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  }
  if (p.cost != null) {
    const f = [
      ['Pris', `£${num(p.cost, 1)}m`],
      ['Vald av', p.sel == null ? '–' : `${num(p.sel, 1)} % av lagen`],
      ['Poäng', `${p.fpts ?? '–'}${p.bonus ? ` <span class="muted">(${p.bonus} bonus)</span>` : ''}`],
    ];
    if ((p.pos === 'MV' || p.pos === 'B') && p.cs != null) f.push(['Hållna nollor', p.cs]);
    if (p.pen === 1 || p.pen === 2) f.push(['Straffskytt', p.pen === 1 ? 'förstaval' : 'andraval']);
    html += `<h5 class="dv-h5">Fantasy Premier League</h5><dl class="dv-mrows">${f.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  }
  if (avail && !avail.unknown) {
    const last = p.name.split(/\s+/).pop().toLowerCase();
    const hit = avail.players.find((x) => x.name.toLowerCase().includes(last));
    if (hit) html += `<p class="dv-avail">⚠ ${esc(hit.status)}${hit.chance != null ? ` (${hit.chance} % chans att spela)` : ''}${hit.news ? ` – ${esc(hit.news)}` : ''}</p>`;
  }
  html += `<p class="dv-mnote">ESPN · ligamatcher ${esc(state.data.season)} · hämtat ${when(P.source.fetchedAt)}` +
    `${p.min != null ? ` · speltid, xG och FPL: Fantasy Premier League, hämtat ${when(P.fpl.fetchedAt)}` : ''}</p>` +
    `<p class="dv-mback"><button type="button" class="dv-linkbtn" data-team-open="${esc(p.teamId)}">← ${esc(p.team)}: hela truppen</button></p>`;
  showModal(html);
}

function mtile(v, label) {
  return `<div class="dv-mtile"><b>${esc(String(v))}</b><span>${esc(label)}</span></div>`;
}

async function openTeam(id) {
  const P = state.players.get(state.div);
  if (!P || P.unknown) return;
  const T = await loadTeams(state.div);
  const t = P.teams.find((x) => x.espnId === id);
  if (!t) return;
  const r = P.table ? P.table.rows.find((x) => x.espnId === id) : null;
  const squad = P.players.filter((p) => p.teamId === id)
    .sort((a, b) => (POS_ORDER[a.pos] ?? 9) - (POS_ORDER[b.pos] ?? 9) || (b.app || 0) - (a.app || 0) || a.name.localeCompare(b.name, 'sv'));
  const z = r && zoneOf(r.note);
  let html = `<div class="dv-mhead"><div class="dv-avatar team">${esc(t.name.slice(0, 2).toUpperCase())}</div><div><h3>${esc(t.name)}</h3>` +
    `<p>${esc(state.data.divisions.find((x) => x.id === state.div).name)}${r ? ` · ${ordinal(r.rank)} plats` : ''}${z ? ` · ${esc(z.label)}` : ''}</p></div></div>`;
  html += '<div class="dv-mtiles">' +
    (r ? mtile(r.points, 'Poäng') + mtile(`${r.gf}–${r.ga}`, 'Mål') : '') +
    mtile(t.avgAge == null ? '–' : num(t.avgAge, 1), 'Snittålder') + mtile(t.used, 'Spelare använda') + '</div>';
  if (t.topScorer && t.topScorer.g) {
    html += `<p class="dv-calm">Bäste målskytt <b>${esc(t.topScorer.name)}</b> · ${t.topScorer.g} av ${t.goals} mål (${pct(t.topScorerShare)})</p>`;
  }
  const tt = T && !T.unknown ? T.teams.find((x) => x.espnId === id) : null;
  if (tt && tt.fd && (tt.fd.xg || tt.fd.mkt)) {
    const x = tt.fd.xg;
    const m = tt.fd.mkt;
    html += '<h5 class="dv-h5">Spelet hittills</h5><div class="dv-mtiles">' +
      (x ? mtile(num(x.f / x.n, 2), 'xG per match') + mtile(num(x.a / x.n, 2), 'xGA per match') : '') +
      (m ? mtile(signed(m.pts - m.xp, 1), 'Poäng mot oddsen') + mtile(signedPct((m.ret - m.n) / m.n), 'Avkastning') : '') + '</div>' +
      `<p class="dv-mnote">football-data.co.uk · ${tt.fd.n} matcher t.o.m. ${esc(dateLabel(T.source.stats.last))} · <a href="${esc(viewHref(state.div, 'lag'))}">Alla lag</a></p>`;
  }
  const F = seasonOf(state.div);
  const ft = F && F.teams ? F.teams.find((x) => x.espnId === id) : null;
  if (ft) {
    html += '<h5 class="dv-h5">Säsongsprognosen</h5><div class="dv-mtiles">' +
      mtile(`${int(ft.points.mean)}`, `Förv. poäng (${ft.points.lo}–${ft.points.hi})`) +
      mtile(num(ft.meanPos, 1), 'Förv. placering') +
      F.zones.filter((z) => z.key !== 'title' || ft.p.title > 0).map((z) => mtile(`${chanceText(ft.p[z.key])} %`, z.label)).join('') + '</div>';
    if (ft.next && ft.next.list.length) {
      html += `<p class="dv-calm">De närmaste ligamatcherna – hemma (H) eller borta (B) och vinstchansen i procent:</p><div class="dv-fxs dv-fxs-wide">${ft.next.list.map(fxChip).join('')}</div>`;
    }
    html += `<p class="dv-mnote">Prognosmotorn · ${int(state.season.sims)} simuleringar · <a href="${esc(viewHref(state.div, 'prognos'))}">Hela prognosen</a></p>`;
  }
  const av = P.availability && !P.availability.unknown ? P.availability[id] : null;
  if (av && !av.unknown) {
    html += '<h5 class="dv-h5">Skador och avstängningar</h5>' + (av.players.length
      ? `<ul class="dv-avlist">${av.players.map((x) => `<li><b>${esc(x.name)}</b> <span class="muted">${esc(x.pos || '')}</span> – ${esc(x.status)}${x.chance != null ? ` (${x.chance} %)` : ''}${x.news ? `<small>${esc(x.news)}</small>` : ''}</li>`).join('')}</ul>`
      : '<p class="dv-calm">Inga rapporterade.</p>') + `<p class="dv-mnote">Fantasy Premier League · hämtat ${when(av.source.fetchedAt)}</p>`;
  }
  html += '<h5 class="dv-h5">Truppen</h5><div class="table-wrap dv-tw"><table class="dv-squad"><thead><tr><th class="c">Pos</th><th class="c">#</th><th>Spelare</th>' +
    '<th class="num hide-xs">Ålder</th><th class="num">M</th><th class="num">Mål</th><th class="num">Ass</th><th class="num">Gul</th><th class="num">Röd</th></tr></thead><tbody>' +
    squad.map((p) => `<tr class="dv-prow${p.app ? '' : ' idle'}" data-pid="${esc(p.id)}" tabindex="0"><td class="c">${esc(p.pos || '–')}</td><td class="c muted">${esc(p.jersey || '')}</td>` +
      `<td>${esc(p.name)}<small class="dv-natline">${esc(natSv(p.nat) || '')}</small></td><td class="num hide-xs">${p.age ?? '–'}</td>` +
      `<td class="num">${cell(p.app)}</td><td class="num">${cell(p.g, { strong: true })}</td><td class="num">${cell(p.a)}</td><td class="num">${cell(p.yc)}</td><td class="num">${cell(p.rc)}</td></tr>`).join('') +
    '</tbody></table></div>';
  const cov = t.coverage;
  html += `<p class="dv-mnote">ESPN · hämtat ${when(P.source.fetchedAt)}${cov.behind ? ` · ${cov.covered} av ${cov.matches} matcher införda` : ''}</p>`;
  showModal(html);
}

// ---------- matchbilden (fördelningar per division) ----------

function heatmap(D) {
  const max = Math.max(...D.grid.flat());
  const lab = (i) => (i === D.grid.length - 1 ? `${i}+` : String(i));
  let html = '<table class="dv-heat"><thead><tr><th title="Rader = hemmamål, kolumner = bortamål, andel av matcherna i procent">%</th>' + D.grid[0].map((_, j) => `<th>${lab(j)}</th>`).join('') + '</tr></thead><tbody>';
  D.grid.forEach((row, i) => {
    html += `<tr><th class="rowh">${lab(i)}</th>`;
    row.forEach((c, j) => {
      const a = max ? (c / max) * 0.88 : 0;
      html += `<td style="--a:${a.toFixed(3)}"${a > 0.5 ? ' class="hi"' : ''} data-tip="${esc(`<b>${lab(i)}–${lab(j)}</b>\n${pct(c / D.n, 1)} av matcherna (${int(c)})`)}">${num((c / D.n) * 100, 1)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  const top = D.grid.flatMap((row, i) => row.map((c, j) => ({ c, s: `${lab(i)}–${lab(j)}` }))).sort((a, b) => b.c - a.c).slice(0, 3);
  return `${html}<p class="dv-note">Vanligast: ${top.map((t) => `${esc(t.s)} (${pct(t.c / D.n, 1)})`).join(', ')}.</p>`;
}

function htftTable(D, w) {
  if (!D.htft) return `<p>${unknown()}</p>`;
  const names = ['Hemma leder', 'Oavgjort', 'Borta leder'];
  const total = D.htft.flat().reduce((s, x) => s + x, 0);
  let html = '<table class="odds dv-htft"><thead><tr><th>I halvtid</th><th class="num">Andel</th><th class="num">1</th><th class="num">X</th><th class="num">2</th></tr></thead><tbody>';
  D.htft.forEach((row, i) => {
    const n = row.reduce((s, x) => s + x, 0);
    const mx = Math.max(...row);
    html += `<tr><td>${names[i]}</td><td class="num">${pct(n / total)}</td>` +
      row.map((c) => `<td class="num${c === mx ? ' max' : ''}" data-tip="${esc(`<b>${names[i]} i halvtid</b>\n${int(c)} av ${int(n)} matcher`)}">${pct(n ? c / n : null)}</td>`).join('') + '</tr>';
  });
  html += '</tbody></table>';
  const h = w && w.ht;
  if (h) {
    html += '<dl class="facts dv-facts">' +
      `<dt>Mål per halvlek</dt><dd>${num(h.first, 2)} och ${num(h.second, 2)} – ${pct(h.secondShare)} i andra</dd>` +
      `<dt>Ledning i halvtid</dt><dd>vinst ${pct(h.leadWin)}, oavgjort ${pct(h.leadDraw)}, förlust ${pct(h.leadLoss)}</dd></dl>`;
  }
  return html;
}

function barTable(rows, { head, cols }) {
  const maxes = cols.map((c) => (c.bar ? Math.max(...rows.map((r) => c.get(r) || 0)) : null));
  return `<div class="dv-x"><table class="odds dv-bars"><thead><tr><th>${esc(head)}</th>${cols.map((c) => `<th class="num${c.cls ? ` ${c.cls}` : ''}"${c.bar ? ' colspan="2"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>` +
    rows.map((r) => `<tr${r.n < 100 ? ' class="thin"' : ''}><td>${esc(r.label)}</td>` + cols.map((c, i) => {
      const v = c.get(r);
      const td = `<td class="num${c.cls ? ` ${c.cls}` : ''}">${esc(c.f(v))}</td>`;
      if (!c.bar) return td;
      const wpct = v != null && maxes[i] ? (v / maxes[i]) * 100 : 0;
      return `<td class="barcell"><span class="dv-bar${c.soft ? ' soft' : ''}" style="width:${wpct.toFixed(1)}%"></span></td>${td}`;
    }).join('') + '</tr>').join('') + '</tbody></table></div>';
}

const RATE_COLS = [
  { label: 'Matcher', get: (r) => r.n, f: int, cls: 'n' },
  { label: 'Hemmavinst', get: (r) => r.home, f: (x) => pct(x), bar: true },
  { label: 'Oavgjort', get: (r) => r.draw, f: (x) => pct(x) },
  { label: 'Mål', get: (r) => r.goals, f: (x) => num(x, 2), bar: true, soft: true },
];

function newcomerBlock(x, kind, idx) {
  const up = kind === 'up';
  const title = up ? `Uppflyttade från ${x.fromName || 'nivån under'}` : `Nedflyttade från ${x.fromName}`;
  const nx = x.next;
  const after = up
    ? `åkte ned igen ${pct(nx.down)}, stannade ${pct(nx.stayed)}, gick upp igen ${pct(nx.up)}`
    : `gick upp direkt igen ${pct(nx.up)}, stannade ${pct(nx.stayed)}, åkte ned igen ${pct(nx.down)}`;
  const cur = x.current.length
    ? x.current.map((t) => `${esc(t.team)} ${ordinal(t.rank)} (${num(t.ppg, 2)} p/m efter ${t.p})`).join(', ')
    : 'inga i år';
  return `<div class="dv-newc"><h5>${esc(title)}</h5>` +
    '<dl class="facts dv-facts">' +
    `<dt>Poäng per match</dt><dd><strong>${num(x.ppg, 2)}</strong> – divisionens snitt ${num(x.avgPpg, 2)}</dd>` +
    `<dt>Snittplacering</dt><dd>${num(x.meanRank, 1)}${x.topHalf != null ? ` · övre halvan ${pct(x.topHalf)}` : ''}</dd>` +
    `<dt>Säsongen efter</dt><dd>${after}${nx.gone ? `, lämnade nivå 1–5 ${pct(nx.gone)}` : ''}</dd>` +
    `<dt>I år</dt><dd>${cur}</dd></dl>` +
    `<div class="dv-chart" id="d-rank-${idx}" style="margin-top:0.6rem"></div>` +
    `<p class="dv-note">Slutplacering, ${int(x.teamSeasons)} lag ${esc(x.seasons[0])}–${esc(x.seasons[1])}.</p></div>`;
}

function rankBars(x) {
  const total = x.rankCounts.reduce((s, c) => s + c, 0);
  return x.rankCounts.map((c, i) => ({ label: String(i + 1), v: total ? c / total : 0, tip: `<b>${ordinal(i + 1)} plats</b>\n${c} av ${total} lag` }));
}

function matchView(dv) {
  const d = state.data;
  const w = dv.window;
  const D = dv.dist;
  if (!w || !D) return { html: `<p class="empty">${unknown('okänt – ingen data för divisionen')}</p>`, draw: [] };
  const period = `${w.seasons[0]}–${w.seasons[1]}`;
  const fdSrc = `football-data.co.uk · ${esc(period)} · ${int(D.n)} matcher`;
  const draw = [];
  let html = sectionHead('Matchbilden', `${w.count} säsonger · ${esc(period)}`);
  if (!dv.full) html += '<p class="note">Halvtid, hörnor, kort och domare: okänt.</p>';
  html += '<div class="dv-grid3">';

  html += card('Vanligaste resultaten', {
    hint: period,
    body: heatmap(D), src: fdSrc,
  });
  html += card('Antal mål i matchen', {
    hint: period,
    body: '<div class="dv-chart" id="d-totals"></div>' +
      `<p class="dv-note">Snitt ${num(w.goals, 2)} mål per match: hemmalaget ${num(w.hg, 2)}, bortalaget ${num(w.ag, 2)}. Över 2,5 mål ${pct(w.o25)}, båda gör mål ${pct(w.btts)}.</p>`,
    src: fdSrc,
  });
  draw.push(['d-totals', () => {
    const tot = D.totals.reduce((s, c) => s + c, 0);
    columnChart($('#d-totals'), {
      aria: 'Fördelning av antal mål per match',
      fmt: (v) => pct(v),
      bars: D.totals.map((c, i) => ({ label: i === D.totals.length - 1 ? `${i}+` : String(i), v: c / tot, tip: `<b>${i === D.totals.length - 1 ? `${i} eller fler` : i} mål</b>\n${pct(c / tot, 1)} av matcherna (${int(c)})` })),
    });
  }]);
  html += card('Halvtid → fulltid', {
    hint: period,
    body: htftTable(D, w), src: fdSrc,
  });

  const t = dv.timing;
  if (t) {
    const per = `${t.seasons[0]}–${t.seasons[t.seasons.length - 1]}`;
    const fg = t.first;
    html += card('När målen görs', {
      hint: `${per}, minut`,
      body: '<div class="dv-chart" id="d-timing"></div>' +
        '<dl class="facts dv-facts">' +
        `<dt>Efter 75:e minuten</dt><dd>${pct(t.lateShare)} av målen</dd>` +
        (fg ? `<dt>Första målet</dt><dd>hemmalaget ${pct(fg.home)} · laget som gör det vinner ${pct(fg.win)}, oavgjort ${pct(fg.draw)}, förlorar ${pct(fg.loss)}</dd>` : '') +
        `<dt>Sena avgöranden</dt><dd>1X2 ändras efter 75:e minuten i ${pct(t.changedAfter75)} av matcherna, i tilläggstiden i ${pct(t.changedInStoppage)}</dd></dl>`,
      src: `ESPN · ${int(t.used)} matcher med målminuter (${esc(d.season)} hittills inräknad)`,
    });
    draw.push(['d-timing', () => {
      columnChart($('#d-timing'), {
        aria: 'Andel av målen per kvart',
        fmt: (v) => pct(v),
        bars: t.bins.map((b) => {
          const lab = b.stoppage ? `${b.lo}+` : `${b.lo}–${b.hi}`;
          return { label: lab, v: t.timed ? b.n / t.timed : null, soft: b.stoppage, tip: `<b>${b.stoppage ? `Tilläggstid, ${b.lo === 45 ? 'första' : 'andra'} halvlek` : `Minut ${lab}`}</b>\n${pct(b.n / t.timed, 1)} av målen (${int(b.n)})` };
        }),
      });
    }]);
  } else {
    html += card('När målen görs', { body: `<p>${unknown('okänt – ESPN saknar målminuter för divisionen')}</p>` });
  }

  const newc = [];
  if (dv.promoted) newc.push(newcomerBlock(dv.promoted, 'up', 0));
  if (dv.relegated) newc.push(newcomerBlock(dv.relegated, 'down', 1));
  if (newc.length) {
    html += card('Nykomlingarna', {
      hint: 'alla säsonger',
      body: newc.join(''), src: 'football-data.co.uk · var laget spelade säsongen före och efter · slutplaceringen ur en tabell räknad på resultaten, utan poängavdrag',
    });
  }
  if (dv.promoted) draw.push(['d-rank-0', () => columnChart($('#d-rank-0'), { aria: 'Slutplacering för uppflyttade lag', fmt: (v) => pct(v), labels: 'max', H: 120, bars: rankBars(dv.promoted) })]);
  if (dv.relegated) draw.push(['d-rank-1', () => columnChart($('#d-rank-1'), { aria: 'Slutplacering för nedflyttade lag', fmt: (v) => pct(v), labels: 'max', H: 120, bars: rankBars(dv.relegated) })]);

  const mk = w.market;
  if (mk && D.calibration) {
    html += card('Marknaden', {
      hint: period,
      body: '<div class="dv-chart" id="d-cal"></div>' +
        '<dl class="facts dv-facts">' +
        `<dt>Favoriten vinner</dt><dd>${pct(mk.favWin)}</dd>` +
        `<dt>Marknaden → utfallet</dt><dd>hemmavinst ${pct(mk.pHome)} → ${pct(w.home)} · oavgjort ${pct(mk.pDraw)} → ${pct(w.draw)} · bortavinst ${pct(mk.pAway)} → ${pct(w.away)}</dd>` +
        `<dt>Marginal</dt><dd>${pct(mk.margin, 1)} · log-poäng ${num(mk.logLoss, 3)}</dd></dl>`,
      src: `football-data.co.uk · marknadssnittets öppningsodds · ${int(mk.n)} matcher`,
    });
    draw.push(['d-cal', () => calChart($('#d-cal'), D.calibration)]);
  }

  const cr = dv.crowd;
  if (cr) {
    html += card('Publik', {
      hint: `${cr.seasons[0].label}–${cr.seasons[cr.seasons.length - 1].label}`,
      body: '<div class="dv-chart" id="d-crowd"></div>' +
        '<dl class="facts dv-facts"><dt>Snitt per säsong</dt><dd>' + cr.seasons.map((s) => `${esc(s.label.slice(2))}: ${int(s.mean)}`).join(' · ') + '</dd>' +
        (cr.r != null ? `<dt>Samband</dt><dd>r = ${num(cr.r, 2)} mellan publik (log) och hemmafördel</dd>` : '') + '</dl>' +
        '<p class="dv-note">En punkt per lag och säsong · lodrätt = poäng per match hemma minus borta.</p>',
      src: `ESPN · ${int(cr.teams.length)} lag-säsonger med minst tio hemmamatcher med publik`,
    });
    if (cr.teams.length) draw.push(['d-crowd', () => crowdChart($('#d-crowd'), cr.teams)]);
  }

  html += '</div><div class="dv-grid2">';
  const months = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map((mo) => D.months[mo - 1]).filter((r) => r.n > 0).map((r) => ({ ...r, label: MONTHS[r.month - 1] }));
  html += card('Över säsongen', {
    hint: period,
    body: barTable(months, { head: 'Månad', cols: RATE_COLS }), src: fdSrc,
  });
  const days = [1, 2, 3, 4, 5, 6, 0].map((i) => D.weekdays[i]).filter((r) => r.n > 0).map((r) => ({ ...r, label: DAYS[r.day] }));
  let dayBody = barTable(days, { head: 'Veckodag', cols: RATE_COLS });
  if (D.kickoff) {
    const ko = D.kickoff.filter((r) => r.n > 0);
    dayBody += `<h5 class="dv-h5">Avsparkstid <span class="hint">brittisk tid, från 2019/20</span></h5>${barTable(ko, { head: 'Avspark', cols: RATE_COLS })}`;
  }
  html += card('Veckodag och avspark', {
    hint: period,
    body: dayBody, src: fdSrc,
  });
  html += '</div>';

  const R = dv.referees;
  if (R && R.rows.length) {
    html += card('Domare', {
      hint: `${R.seasons[0]}–${R.seasons[R.seasons.length - 1]}, minst ${R.min} matcher`,
      body: '<div class="table-wrap dv-scroll"><table class="odds"><thead><tr><th>Domare</th><th class="num">Matcher</th><th class="num">Gula</th><th class="num">Röda</th>' +
        '<th class="num">Frisparkar</th><th class="num">1</th><th class="num">X</th><th class="num">2</th><th class="num">Mål</th></tr></thead><tbody>' +
        `<tr class="avg"><td>Alla ${int(R.referees)} domare</td><td class="num">${int(R.avg.n)}</td><td class="num">${num(R.avg.yellow, 2)}</td><td class="num">${num(R.avg.red, 2)}</td>` +
        `<td class="num">${num(w.fouls, 1)}</td><td class="num">${pct(R.avg.home)}</td><td class="num"></td><td class="num"></td><td class="num"></td></tr>` +
        R.rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="num">${int(r.n)}</td><td class="num">${num(r.yellow, 2)}</td><td class="num">${num(r.red, 2)}</td>` +
          `<td class="num">${num(r.fouls, 1)}</td><td class="num">${pct(r.home)}</td><td class="num">${pct(r.draw)}</td><td class="num">${pct(r.away)}</td><td class="num">${num(r.goals, 2)}</td></tr>`).join('') +
        '</tbody></table></div>',
      src: 'football-data.co.uk',
      cls: 'dv-wide',
    });
  }
  return { html, draw };
}

// ---------- jämförelsen mellan divisionerna ----------

function compareSection(d) {
  const divs = d.divisions;
  const w = d.window;
  let html = '<div class="table-wrap"><table class="dv-cmp"><thead><tr><th></th>' +
    divs.map((x) => `<th class="num" title="${esc(x.name)}"><i class="dv-key dot" style="--c:${color(x.id)}"></i>${esc(x.short)}</th>`).join('') +
    '</tr></thead><tbody>';
  for (const row of CMP) {
    if (row.group) { html += `<tr class="group"><td colspan="${divs.length + 1}">${esc(row.group)}</td></tr>`; continue; }
    const m = row.m ? metric(row.m) : null;
    const get = row.get || m.get;
    const f = row.f || fmtOf(m);
    html += `<tr><td>${esc(row.label)}${row.sub ? `<span class="sub">${esc(row.sub)}</span>` : ''}</td>`;
    for (const x of divs) {
      const c = x.current ? get(x.current) : null;
      const wv = x.window ? get(x.window) : null;
      html += `<td class="num">${c == null ? '<strong>–</strong>' : `<strong>${esc(f(c))}</strong>`}${flag(row, x.current, x.window)}` +
        `<span class="sub">${wv == null ? 'okänt' : esc(f(wv))}</span></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return card(`${d.season} mot snittet`, {
    key: `Stor siffra = i år · liten = snitt ${w ? `${esc(w.first)}–${esc(w.last)}` : 'okänt'} · ▲▼ = ovanligt`,
    body: html,
    src: 'football-data.co.uk och ESPN · grundserien, mål efter 90 minuter',
    cls: 'dv-wide',
  });
}

function seasonLabels(d) {
  const set = new Map();
  for (const x of d.divisions) for (const s of x.seasons) set.set(s.label, s.code);
  return [...set.keys()].sort();
}

function trendSeries(d, m) {
  const labels = seasonLabels(d);
  const series = d.divisions.map((x) => {
    const by = new Map(x.seasons.map((s) => [s.label, s]));
    return {
      id: x.id, short: x.short, color: color(x.id),
      values: labels.map((l) => (by.has(l) ? m.get(by.get(l)) ?? null : null)),
      partial: labels.map((l) => !!(by.has(l) && by.get(l).partial)),
      n: labels.map((l) => (by.has(l) ? by.get(l).n : null)),
    };
  });
  return { labels, series };
}

function trendSection() {
  const groups = [...new Set(METRICS.map((m) => m.group))];
  return card('Säsong för säsong', {
    body: '<div class="toolbar"><label class="dv-label" for="dv-metric">Mått</label><select id="dv-metric" class="dv-select">' +
      groups.map((g) => `<optgroup label="${esc(g)}">${METRICS.filter((m) => m.group === g).map((m) => `<option value="${m.id}"${m.id === state.metric ? ' selected' : ''}>${esc(m.label)}</option>`).join('')}</optgroup>`).join('') +
      '</select></div>' +
      '<div class="dv-legend" id="dv-trend-legend"></div><div id="dv-trend" class="dv-chart"></div>' +
      '<p class="dv-note" id="dv-trend-note"></p>' +
      '<details class="as-table"><summary>Som tabell</summary><div id="dv-trend-table"></div></details>',
    src: 'football-data.co.uk och ESPN',
    cls: 'dv-wide',
  });
}

function drawTrend() {
  const d = state.data;
  const m = metric(state.metric);
  const { labels, series } = trendSeries(d, m);
  $('#dv-trend-legend').innerHTML = series.map((s) => `<span><i class="dv-key" style="--c:${s.color}"></i>${esc(s.short)} ${esc(d.divisions.find((x) => x.id === s.id).name)}</span>`).join('') +
    `<span class="muted">streckat och ofyllt = ${esc(d.season)} hittills</span>`;
  lineChart($('#dv-trend'), { labels, series, m, aria: `${m.label} per säsong och division` });
  $('#dv-trend-note').textContent = [m.unit ? `${m.label}: ${m.unit}.` : '', m.note || '', m.covid ? 'Säsongen 2020/21 spelades nästan helt utan publik.' : ''].filter(Boolean).join(' ');
  const f = fmtOf(m);
  $('#dv-trend-table').innerHTML = '<div class="table-wrap"><table class="odds"><thead><tr><th>Säsong</th>' +
    series.map((s) => `<th class="num">${esc(s.short)}</th>`).join('') + '</tr></thead><tbody>' +
    labels.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => `<tr><td>${esc(l)}${series.some((s) => s.partial[i]) ? ' <span class="muted">(pågår)</span>' : ''}</td>` +
      series.map((s) => `<td class="num">${s.values[i] == null ? '–' : esc(f(s.values[i]))}</td>`).join('') + '</tr>').join('') +
    '</tbody></table></div>';
}

// ---------- ordlistan ----------

// [term, förklaring, sidan den hör till – utan sida på båda]
const GLOSSARY = [
  ['1 X 2', 'Hemmaseger (1), oavgjort (X) och bortaseger (2) efter 90 minuter.', 'statistik'],
  ['S V O F P', 'Tabellen: spelade, vunna, oavgjorda, förlorade och poäng (3 för vinst, 1 för oavgjort). Lika poäng skiljs åt på målskillnad (+/−) och sedan gjorda mål.', 'tabeller'],
  ['Zonerna', 'Färgen till vänster i tabellen: vad placeringen ger i slutet av säsongen enligt ESPN – uppflyttning, kval (playoff), Europa eller nedflyttning.', 'tabeller'],
  ['M, Start, Min, Ass, M+A', 'Spelartabellen: matcher (från start och inhopp), matcher från start, spelade minuter, assist och mål plus assist.', 'statistik'],
  ['– och grå 0', 'Streck = okänt (ESPN har ingen statistik för spelaren), grå 0 = noll.'],
  ['Spelarstatistiken', 'Bara ligamatcher i år, ur ESPN:s trupper. Den släpar ofta en omgång efter tabellen; självmål och spelare som lämnat klubben saknas. I Premier League kommer speltid, xG och pris från Fantasy Premier League.', 'statistik'],
  ['Per 90', 'Per 90 spelade minuter, för spelare med minst tre hela matchers speltid. Bara Premier League, där speltiden är känd. Dämpade värden har för litet underlag.', 'statistik'],
  ['Pris', 'Spelarens pris i Fantasy Premier League, i miljoner pund – spelets värdering, som stiger när många köper spelaren.', 'statistik'],
  ['Lagstatistiken', 'Tabellen är ESPN:s. xG, skott, hörnor, kort och odds kommer från football-data.co.uk, som ofta ligger en omgång efter – därför visas de per match eller som skillnad inom samma matcher.', 'statistik'],
  ['Snittålder', 'Viktad med matcher, så att ordinarie spelare väger mer än de som hoppat in en gång.', 'statistik'],
  ['Beroende', 'Hur stor del av lagets mål den bäste målskytten gjort.', 'statistik'],
  ['Effektivast', 'Mål per skott, bland spelare med minst tio skott.', 'statistik'],
  ['Över 2,5 mål', 'Matchen slutar med tre mål eller fler, båda lagen tillsammans.', 'statistik'],
  ['Båda lagen gör mål', 'Båda lagen gör minst ett mål var.', 'statistik'],
  ['Hemmalagets målövervikt', 'Hemmalagets mål minus bortalagets, i snitt per match – ett mått på hemmafördelen.', 'statistik'],
  ['Assist', 'Passningen (eller skottet som räddas och slås in) som leder direkt till ett mål, enligt ESPN.', 'statistik'],
  ['Skott på mål', 'Skott som skulle ha gått in om målvakten inte räddat. Skott utanför och i stolpen räknas inte.', 'statistik'],
  ['Räddningsprocent', 'Räddningar delat med skotten på mål som målvakten mött (räddningar + insläppta).', 'statistik'],
  ['xG', 'Förväntade mål: hur många mål chanserna brukar ge i snitt, oavsett om de gick in.', 'statistik'],
  ['xGA, xA', 'Förväntade insläppta mål ur motståndarnas chanser, och förväntade assist ur passningarna före skotten.', 'statistik'],
  ['±xG, ±xGA', 'Mål minus xG och insläppta minus xGA. Stora avvikelser är ofta tur eller otur och brukar krympa över en säsong.', 'statistik'],
  ['Motst', 'Motståndets styrka hittills enligt modellen, mot vad ett lag i divisionen möter i snitt. Plus = tuffare program än snittet.', 'statistik'],
  ['Nollor, Ö2,5, BLGM', 'Andel av lagets matcher utan insläppt mål, med tre mål eller fler, och där båda lagen gjort mål.', 'statistik'],
  ['Väntat, ±', 'Poängen stängningsoddsen väntade sig – 3 × vinstchansen plus oavgjortchansen, match för match – och lagets poäng minus det.', 'statistik'],
  ['Avkastning', 'Vinst eller förlust i procent av insatserna om man satsat lika mycket på att laget vinner varje match, till stängningsoddset. Spelbolagens marginal är inräknad.', 'statistik'],
  ['Marginal', 'Spelbolagens påslag: hur mycket summan av 1/odds överstiger 100 %.', 'statistik'],
  ['Log-poäng', 'Hur väl sannolikheterna träffade. Lägre är bättre; ett mått på hur förutsägbar divisionen är.', 'statistik'],
  ['▲ ▼, ovanligt', 'Årets värde ligger mer än två standardfel från tioårssnittet – mer än slumpen brukar ge på så många matcher.', 'statistik'],
  ['Kalibrering', 'Marknaden i Matchbilden: av de gånger oddsen gav t.ex. 40–50 %, hur ofta hände det? På diagonalen stämmer oddsen.', 'statistik'],
  ['Domare', 'Domaren tillsätts några dagar före matchen och finns inte i prognosunderlaget. Med 10–40 matcher per domare är skillnaderna till stor del slump.', 'statistik'],
  ['Grundserien', 'Ligans ordinarie matcher, utan kvalspel (playoff) och cuper.'],
  ['Säsongsprognos', 'Resten av säsongen spelas tusentals gånger med modellens sannolikheter för varje match. Andelen gånger ett lag hamnar på en plats är chansen. 0 och 100 betyder i ingen respektive alla simuleringar – inte att saken är avgjord.', 'tabeller'],
  ['Förväntade poäng', 'Snittet av slutpoängen i simuleringarna, med spannet där 80 % av dem hamnar.', 'tabeller'],
  ['Styrka', 'Modellens förväntade målskillnad per match mot ett genomsnittligt Premier League-lag på neutral plan. Alla fyra divisioner på samma skala.', 'tabeller'],
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
      `<button type="button" data-div="${x.id}" aria-pressed="${x.id === state.div}" title="${esc(x.name)}"><i class="dv-key dot" style="--c:${color(x.id)}"></i>${esc(x.name)}</button>`).join('')}</div>` +
    `<nav class="dv-views" id="dv-views" aria-label="Vy">${VIEWS.map((v) =>
      `<a href="#${state.div}/${v.id}" data-view="${v.id}"${v.id === state.view ? ' aria-current="page"' : ''}>${esc(v.label)}</a>`).join('')}</nav>` +
    '</div><div id="dv-view" class="dv-view"></div>' +
    '<p class="detail-foot"><button type="button" class="src-toggle" aria-pressed="false">Visa detaljer</button></p>' + glossary();
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
  const dv = state.data.divisions.find((x) => x.id === div);
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
  const dv = d.divisions.find((x) => x.id === state.div) || d.divisions[0];
  for (const b of document.querySelectorAll('#dv-divs button')) b.setAttribute('aria-pressed', String(b.dataset.div === dv.id));
  for (const a of document.querySelectorAll('#dv-views a')) {
    a.href = `#${dv.id}/${a.dataset.view}`;
    if (a.dataset.view === state.view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  $('#dv-divs').classList.toggle('dim', ALL_DIVS.has(state.view));
  charts.clear();
  const el = $('#dv-view');
  const P = ALL_DIVS.has(state.view) || state.view === 'matchbilden' ? null : await loadPlayers(dv.id);
  const T = state.view === 'lag' ? await loadTeams(dv.id) : null;
  if (state.view === 'prognos' || state.view === 'styrka') await loadSeason();
  // Spoilerskyddet behöver matcherna innan något ritas, annars hinner det dolda synas.
  if (window.Spoiler && Spoiler.on()) await Spoiler.matches();
  // Användaren kan ha bytt vy medan spelarfilen laddades.
  if (dv.id !== state.div) return;
  el.classList.remove('sp-veiled');
  if (state.view === 'tabell') el.innerHTML = tableView(dv, P);
  else if (state.view === 'prognos') el.innerHTML = forecastView(dv, P);
  else if (state.view === 'spelare') el.innerHTML = playersView(dv, P);
  else if (state.view === 'lag') el.innerHTML = teamsView(dv, P, T);
  else if (state.view === 'matchbilden') {
    const v = matchView(dv);
    el.innerHTML = v.html;
    for (const [k, fn] of v.draw) charts.set(k, fn);
  } else if (state.view === 'jamfor') {
    el.innerHTML = sectionHead('Jämför divisionerna', 'Alla fyra · sedan 2000/01') +
      compareSection(d) + trendSection();
    $('#dv-metric').addEventListener('change', (e) => { state.metric = e.target.value; drawTrend(); });
    charts.set('trend', drawTrend);
  } else if (state.view === 'styrka') {
    el.innerHTML = sectionHead('Styrka', 'Alla lag i nivå 1–4 på samma skala') + strengthSection(state.season);
  } else {
    el.innerHTML = overviewView(dv, P);
  }
  redraw();
  veil(dv, state.view);
}

// Spoilerskyddet (spoiler.js): har divisionen matcher som döljs just nu läggs
// vyn bakom en ridå – tabellen och statistiken räknar redan med resultaten.
// Jämförelsen och styrkan gäller alla divisioner på en gång och visas ändå.
async function veil(dv, view) {
  if (!window.Spoiler || !Spoiler.on() || ALL_DIVS.has(view)) return;
  const recent = (await Spoiler.matches()).filter((m) => m.comp === dv.id && Spoiler.hides(m.kickoff));
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
    title: `${n} ${n === 1 ? 'match' : 'matcher'} i ${dv.name} är dolda`,
    text: 'Tabellen och statistiken räknar med resultaten.',
    keys: [key],
  }));
}

function updatePlayerTable() {
  const P = state.players.get(state.div);
  const box = $('#dv-ptable');
  if (P && box) box.innerHTML = playerTableHtml(P);
}

// Händelser via delegering: allt i #divisions renderas om ofta.
function wire() {
  const root = $('#divisions');
  root.addEventListener('click', (e) => {
    if (e.target.closest('button.src-toggle')) { setShowSources(!showSources()); return; }
    const div = e.target.closest('#dv-divs button');
    if (div) {
      if (ALL_DIVS.has(state.view)) state.view = VIEWS[0].id;
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
      if (P && !P.unknown && !playerCols(P).some((c) => c.key === state.pf.sort)) Object.assign(state.pf, { sort: 'g', dir: -1 });
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
    if (t) openTeam(t.dataset.team);
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
  // Från spelarkortet till lagets trupp.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-team-open]');
    if (b) openTeam(b.dataset.teamOpen);
  });
}

// Adressen #pl/spelare väljer division och vy (länkbart). Äldre länkar
// #pl (bara division) fungerar också.
function parseHash() {
  const [div, view] = location.hash.replace(/^#/, '').split('/');
  return { div: div || null, view: view || null };
}

function go(div, view) {
  const h = `#${div}/${view}`;
  if (location.hash !== h) location.hash = h;
  else apply();
}

function apply() {
  const { div, view } = parseHash();
  const divs = state.data.divisions;
  const nd = div && divs.some((x) => x.id === div) ? div : state.div;
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

window.addEventListener('hashchange', () => { if (state.data && !state.data.error) apply(); });

(async function init() {
  // Smal skärm: rulla fliklistan så att den aktiva länken syns.
  const cur = document.querySelector('.tabs [aria-current="page"]');
  if (cur) cur.parentElement.scrollLeft = cur.offsetLeft - 16;
  try {
    state.meta = await getJSON('data/meta.json');
    const tl = $('#topline');
    if (tl) tl.innerHTML = `Säsong <strong>${esc(state.meta.season)}</strong> · byggd ${esc(fDateTime.format(new Date(state.meta.generatedAt)))}`;
  } catch {
    const tl = $('#topline');
    if (tl) tl.textContent = '';
  }
  try {
    state.data = await getJSON('data/divisions.json');
  } catch (err) {
    $('#divisions').innerHTML = `<p class="empty">Kunde inte läsa divisionsstatistiken: ${esc(err.message)}</p>`;
    return;
  }
  if (state.data.error) {
    $('#divisions').innerHTML = `<p class="empty">Divisionsstatistiken kunde inte räknas fram vid bygget: ${esc(state.data.error)}</p>`;
    return;
  }
  const { div, view } = parseHash();
  if (div && state.data.divisions.some((x) => x.id === div)) state.div = div;
  if (view && VIEWS.some((v) => v.id === view)) state.view = view;
  $('#divisions').innerHTML = frame();
  setShowSources(showSources());
  wire();
  renderView();
  loadSeason(); // lagkortet visar säsongsprognosen när den finns
  if (window.Spoiler) Spoiler.onChange(renderView);
})();
