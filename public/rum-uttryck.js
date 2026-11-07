// Gängets ansiktsuttryck (rum-3d.js): hur glada DL, DT och DJ ser ut.
// Ansiktsbilderna (rum/ansikte-*.svg) är ritade glada – DL ler med tänderna,
// DT skrattar med ögonen hopknipna och DJ ler i skägget (rum/skagg-dj.svg).
// uttryck ritar om munnen, ögonbrynen, ögonlocken och rodnaden efter läget:
//
//   jublar  munnen öppen i ett skratt, ögonbrynen uppe och kinderna som
//           trycker upp ögonen (DT som han är ritad)
//   glad    som bilderna är ritade (DT med öppna ögon och ett brett leende)
//   nojd    munnen stängd i ett litet leende
//   sur     munnen rak och nedåt i mungiporna, ögonbrynen ihopdragna och
//           ögonlocken lite tunga
//   deppig  munnen nedåt, ögonbrynen uppåt inåt, tunga ögonlock, påsar under
//           ögonen och nästan ingen rodnad
//   orolig  läpparna ihoppressade och ögonbrynen uppåt inåt (rynkor i pannan)
//
// Ögonen behåller samma uppbyggnad (ögonvitan, klippet, ögat i klippet och
// ögonlocket efter), så att blundar i rum-3d.js gör en blinkning av dem.
// uttryck(svg, 'dl', 'glad') och skaggUttryck(svg, 'glad') – och alla utan
// läge (null) – ger tillbaka samma text, så att den redan laddade bilden kan
// användas.

export const LAGEN = ['jublar', 'glad', 'nojd', 'sur', 'deppig', 'orolig'];

// Läget för ansiktena: hur det går för omgången som spelas (spel i rum-3d.js:
// 'glad', 'nerv' eller 'deppig', och när allt är spelat ett av LAGEN) före
// hur den senaste kupongen gick (senast, ett av LAGEN från rum-folk.js), och
// annars null: som bilderna är ritade (med dolda resultat och utan historik).
export function ansiktsLage(spel, senast) {
  if (spel === 'nerv') return 'orolig';
  if (LAGEN.includes(spel)) return spel;
  return LAGEN.includes(senast) ? senast : null;
}

// mun: hur munnen böjer sig (1 ett leende, −1 nedåt) eller 'skratt' och
// 'tander' (öppen); bryn: ögonbrynen vridna kring ytterändan, grader (plus
// = de inre ändarna upp, minus = ihopdragna); lyft: ögonbrynen upp (minus)
// eller ner; lock: hur långt övre ögonlocket hänger ner över ögat (0–1);
// glada: kinderna som trycker upp nedre ögonlocket (0–1); rod: rodnaden mot
// bilden; pasar: påsar under ögonen; tight: läpparna ihoppressade.
const LAGE = {
  jublar: { mun: 'skratt', lyft: -2.5, glada: 1, rod: 1.3 },
  glad: null,
  nojd: { mun: 0.5, glada: 0.25, rod: 0.85 },
  sur: { mun: -0.3, bryn: -8, lyft: 1.5, lock: 0.25, rod: 0.5 },
  deppig: { mun: -0.9, bryn: 12, lock: 0.42, rod: 0.15, pasar: 1 },
  orolig: { mun: -0.15, tight: 1, bryn: 10, lyft: -1.5, rod: 0.55 },
};

// Var sakerna sitter i bilderna (viewBox −80 −100 160 180) och deras färger.
// mun: mitten (x, y), bredd w, linjen mellan läpparna, underläppen, munnen
// inuti, tänderna och hur mycket högra mungipan går upp när han ler (snett);
// nasa: var skrattvecket börjar vid näsvingen; bort: munnen som ska bort
// (fyllningar, linjer, klipp och linjer som börjar med d); egen: läget som
// han har ett eget sätt för (null = som bilden är ritad).
const ANS = {
  dl: {
    hud: '#f0c3a6', linje: '#b06e5c', bryn: '#8a6242', rodnad: '#e9806e',
    mun: { x: 1, y: 44, w: 36, linje: '#8a3c33', lapp: '#c47a6a', mork: '#6b2a24', tand: '#f6f0e6', snett: 1.5 },
    nasa: [13, 26],
    bort: { fill: ['#6b2a24'], stroke: ['#8a3c33', '#c47a6a'], klipp: ['mdl'], d: ['M22 32 ', 'M-13 27 ', 'M13 25 '] },
  },
  dt: {
    hud: '#ecbc9c', linje: '#a86a52', bryn: '#6b4128', rodnad: '#e27e66',
    mun: { x: 0, y: 41, w: 40, linje: '#7a3328', lapp: '#b5604f', mork: '#45150f', tand: '#f4efe6' },
    nasa: [12, 23],
    bort: { fill: ['#45150f'], stroke: ['#b5604f'], klipp: ['mdt'], d: ['M-12 23 ', 'M12 23 '] },
    // DT skrattar med ögonen hopknipna i bilden: de bågarna, fransarna,
    // linjerna under och skrattrynkorna byts mot öppna ögon (ogon)
    skratt: { fill: ['#2a1a14'], stroke: ['#2e1c14'], d: ['M-31 4 ', 'M-29 8 ', 'M13 4 ', 'M15 8 '], rynkor: ['M-35 ', 'M35 '] },
    ogon: { x: 22, y: -2.5, w: 11, iris: '#6b5034', pupill: '#15100c', lock: '#2e1c14' },
    egen: { jublar: null, glad: { mun: 'tander', glada: 0.8, rod: 1.1, rynkor: 1 } },
  },
  dj: {
    hud: '#e9b593', linje: '#a1644c', bryn: '#24160e', rodnad: '#d9765e',
    // munnen sitter i skägget (skaggUttryck)
    egen: { jublar: { lyft: -2.5, glada: 1, rod: 1.3 } },
  },
};

const tal = (el) => (el.getAttribute('d') || '').match(/-?[\d.]+/g).map(Number);
const r1 = (x) => Math.round(x * 10) / 10;

function las(svg) {
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
}

// tar bort det som bort pekar ut (och klippen med det som klipps) och ger
// tillbaka elementet som stod först, där det nya ska in
function rensa(doc, b) {
  const ut = [];
  for (const f of b.fill || []) ut.push(...doc.querySelectorAll(`[fill="${f}"]`));
  for (const s of b.stroke || []) ut.push(...doc.querySelectorAll(`[stroke="${s}"]`));
  for (const k of b.klipp || []) ut.push(...doc.querySelectorAll(`clipPath[id="${k}"], g[clip-path="url(#${k})"]`));
  for (const d of [...(b.d || []), ...(b.rynkor || [])]) ut.push(...[...doc.querySelectorAll('path')].filter((p) => (p.getAttribute('d') || '').startsWith(d)));
  const alla = [...doc.documentElement.querySelectorAll('*')];
  const forst = ut.length ? ut.reduce((a, x) => (alla.indexOf(x) < alla.indexOf(a) ? x : a)) : null;
  const plats = forst ? doc.createElementNS('http://www.w3.org/2000/svg', 'g') : null;
  if (plats) forst.before(plats);
  for (const x of ut) x.remove();
  return plats;
}

// lägger in svg-text före elementet (och tar bort elementet)
function inPa(plats, html) {
  plats.insertAdjacentHTML('beforebegin', html);
  plats.remove();
}

// Öppna ögon (DT) med samma uppbyggnad som DL:s och DJ:s
function oppnaOgon(o, linje) {
  let s = '';
  for (const sx of [-1, 1]) {
    const cx = sx * o.x;
    const x0 = cx - o.w;
    const x1 = cx + o.w;
    const y0 = sx < 0 ? o.y : o.y - 0.5;
    const y1 = sx < 0 ? o.y - 0.5 : o.y;
    const id = sx < 0 ? 'e-1' : 'e1';
    const vit = `M${x0} ${y0} Q${cx} ${o.y - 8.5} ${x1} ${y1} Q${cx} ${o.y + 3.5} ${x0} ${y0} Z`;
    const ix = cx + sx * 0.5;
    s += `<path d="${vit}" fill="#f7f1ea"/><clipPath id="${id}"><path d="${vit}"/></clipPath>`
      + `<g clip-path="url(#${id})"><circle cx="${ix}" cy="${o.y - 1}" r="5.6" fill="${o.iris}"/><circle cx="${ix}" cy="${o.y - 1}" r="2.5" fill="${o.pupill}"/><circle cx="${ix - 2}" cy="${o.y - 3}" r="1.5" fill="#fff"/></g>`
      + `<path d="M${x0 - 1} ${y0} Q${cx} ${o.y - 9.8} ${x1 + 1} ${y1 - 0.5}" fill="none" stroke="${o.lock}" stroke-width="3" stroke-linecap="round" opacity="1.0"/>`
      + `<path d="M${x0} ${o.y - 6} Q${cx} ${o.y - 13} ${x1 + 1} ${o.y - 6.5}" fill="none" stroke="${linje}" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>`
      + `<path d="M${x0 + 2} ${o.y + 5} Q${cx} ${o.y + 9} ${x1 - 2} ${o.y + 4.5}" fill="none" stroke="${linje}" stroke-width="1.3" stroke-linecap="round" opacity="0.4"/>`;
  }
  return s;
}

// Ögonen: övre ögonlocket ner (lock), kinderna upp (glada) och påsar under
// (pasar). Ögonvitan är M x0 y0 Q cx övre x1 y1 Q cx nedre x0 y0 Z.
function ogonen(doc, a, p) {
  for (const v of doc.querySelectorAll('path[fill="#f7f1ea"]')) {
    const [x0, y0, cx, ovre, x1, y1, , nedre] = tal(v);
    const g = doc.querySelector(`g[clip-path="url(#${v.nextElementSibling.id})"]`);
    const lock = g && g.nextElementSibling;
    if (!g || !lock) continue;
    let ny = '';
    if (p.lock) {
      const y = ovre + p.lock * (nedre - ovre);
      ny += `<path d="M${x0 - 3} ${y0 - 15} L${x1 + 3} ${y1 - 15} L${x1 + 3} ${y1} Q${cx} ${r1(y)} ${x0 - 3} ${y0} Z" fill="${a.hud}"/>`;
      const l = tal(lock);
      lock.setAttribute('d', `M${l[0]} ${l[1]} Q${l[2]} ${r1(l[3] + (y - ovre))} ${l[4]} ${l[5]}`);
    }
    if (p.glada) {
      const y = nedre - 4.5 * p.glada;
      ny += `<path d="M${x0 - 3} ${y0 + 1} Q${cx} ${r1(y)} ${x1 + 3} ${y1 + 1} L${x1 + 3} ${y1 + 12} L${x0 - 3} ${y0 + 12} Z" fill="${a.hud}"/>`
        + `<path d="M${x0 + 1} ${y0 + 0.6} Q${cx} ${r1(y + 0.4)} ${x1 - 1} ${y1 + 0.6}" fill="none" stroke="${a.linje}" stroke-width="1.4" stroke-linecap="round" opacity="${r1(0.55 * p.glada)}"/>`;
    }
    if (ny) g.insertAdjacentHTML('beforeend', ny);
    if (p.pasar) {
      lock.insertAdjacentHTML('afterend', `<path d="M${x0 + 3} ${y0 + 6.5} Q${cx} ${r1(nedre + 8.5)} ${x1 - 3} ${y1 + 6.5}" fill="none" stroke="${a.linje}" stroke-width="1.5" stroke-linecap="round" opacity="${r1(0.4 * p.pasar)}"/>`);
    }
  }
}

// Ögonbrynen: vridna kring ytterändan och lyfta, med rynkor emellan när de
// dras ihop och i pannan när de inre ändarna går upp.
function brynen(doc, a, p) {
  const b = [...doc.querySelectorAll(`path[fill="${a.bryn}"]`)];
  for (const el of b) {
    const n = tal(el);
    const xs = n.filter((_, i) => i % 2 === 0);
    const sx = Math.sign(xs.reduce((s, x) => s + x, 0));
    // ytteränden: punkten längst ut
    const i = xs.reduce((m, x, j) => (Math.abs(x) > Math.abs(xs[m]) ? j : m), 0);
    const px = n[i * 2];
    const py = n[i * 2 + 1];
    const v = sx * (p.bryn || 0);
    el.setAttribute('transform', `translate(0 ${p.lyft || 0}) rotate(${v} ${px} ${py})`);
  }
  if (!b.length) return;
  const sist = b[b.length - 1];
  if ((p.bryn || 0) < 0) {
    const o = r1(Math.min(0.5, -p.bryn * 0.05));
    sist.insertAdjacentHTML('afterend', `<path d="M-3.5 -27 Q-2.3 -23 -3 -18.5 M3.5 -27 Q2.3 -23 3 -18.5" fill="none" stroke="${a.linje}" stroke-width="1.4" stroke-linecap="round" opacity="${o}"/>`);
  } else if ((p.bryn || 0) > 0) {
    const o = r1(Math.min(0.45, p.bryn * 0.035));
    sist.insertAdjacentHTML('afterend', `<path d="M-8 -32 Q0 -35.5 8 -32 M-6 -37.5 Q0 -40 6 -37.5" fill="none" stroke="${a.linje}" stroke-width="1.3" stroke-linecap="round" opacity="${o}"/>`);
  }
}

// En öppen mun: överkanten y, halva bredden h, djupet d, tändernas band och
// tungan (eller inte).
function oppen(m, { y, h, d, band, tunga }) {
  const x = m.x;
  const form = `M${x - h} ${y} Q${x} ${y + 5} ${x + h} ${y} Q${r1(x + h * 0.85)} ${y + d - 3} ${x} ${y + d} Q${r1(x - h * 0.85)} ${y + d - 3} ${x - h} ${y} Z`;
  return `<path d="${form}" fill="${m.mork}"/><clipPath id="m-ny"><path d="${form}"/></clipPath><g clip-path="url(#m-ny)">`
    + `<path d="M${x - h - 1} ${y - 1} Q${x} ${y + 4} ${x + h + 1} ${y - 1} L${x + h + 1} ${y + band} Q${x} ${y + band + 5} ${x - h - 1} ${y + band} Z" fill="${m.tand}"/>`
    + (tunga ? `<ellipse cx="${x}" cy="${y + d - 5}" rx="${r1(h * 0.45)}" ry="4" fill="#a8473f"/>` : '')
    + `</g><path d="M${r1(x - h * 0.6)} ${y + d + 2.5} Q${x} ${y + d + 6} ${r1(x + h * 0.6)} ${y + d + 2.5}" fill="none" stroke="${m.lapp}" stroke-width="2.2" stroke-linecap="round" opacity="0.45"/>`;
}

// Munnen och vecken runt den. c = p.mun: 1 ett leende, −1 nedåt.
function munnen(a, p) {
  const m = a.mun;
  const x = m.x;
  const [nx, ny] = a.nasa;
  let s = '';
  let c;
  let hy;
  let hh;
  if (p.mun === 'skratt' || p.mun === 'tander') {
    const sk = p.mun === 'skratt';
    hh = m.w / 2 + (sk ? 2 : 3);
    hy = m.y - (sk ? 10 : 7);
    s += oppen(m, sk ? { y: hy, h: hh, d: 22, band: 8, tunga: true } : { y: hy, h: hh, d: 15, band: 7, tunga: false });
    c = 1;
  } else {
    c = p.mun;
    const h = (m.w / 2) * (p.tight ? 0.78 : 1) * (1 + 0.08 * c);
    const b = 6.5 * c;
    const sn = c > 0 ? (m.snett || 0) * c : 0;
    const yl = r1(m.y - b);
    const yr = r1(m.y - b - sn);
    hh = h;
    hy = Math.min(yl, yr);
    s += `<path d="M${r1(x - h)} ${yl} Q${x} ${r1(m.y + b)} ${r1(x + h)} ${yr}" fill="none" stroke="${m.linje}" stroke-width="${p.tight ? 2.9 : 2.3}" stroke-linecap="round" opacity="0.9"/>`;
    // underläppen: en mjuk båge under, som skjuts upp när munnen går nedåt
    const u = m.y + 6 + 0.5 * c;
    s += `<path d="M${r1(x - h * 0.45)} ${r1(u)} Q${x} ${r1(u + 3.4 + 1.2 * c)} ${r1(x + h * 0.45)} ${r1(u)}" fill="none" stroke="${m.lapp}" stroke-width="2.4" stroke-linecap="round" opacity="0.45"/>`;
    // mungiporna: små veck uppåt i ett leende, ner mot hakan när munnen går nedåt
    for (const sx of [-1, 1]) {
      const px = r1(x + sx * (h + 0.5));
      const py = sx < 0 ? yl : yr;
      if (c > 0.2) s += `<path d="M${px} ${py} q${sx * 2.5} -0.8 ${sx * 3} -3.5" fill="none" stroke="${a.linje}" stroke-width="1.5" stroke-linecap="round" opacity="${r1(0.5 * c)}"/>`;
      if (c < -0.3) s += `<path d="M${px} ${r1(py + 1.5)} q${sx * 1.2} 3 ${sx * 0.6} 6" fill="none" stroke="${a.linje}" stroke-width="1.4" stroke-linecap="round" opacity="${r1(0.3 * -c)}"/>`;
    }
  }
  // skrattvecken från näsvingarna, djupare ju gladare (knappt när munnen inte ler)
  for (const sx of [-1, 1]) {
    if (c <= 0) continue;
    const o = 0.2 + 0.3 * c;
    const ex = r1(x + sx * (hh + 4));
    const ey = r1(hy + 3);
    s += `<path d="M${sx * nx} ${ny} Q${sx * (nx + 9)} ${ny + 4} ${ex} ${ey}" fill="none" stroke="${a.linje}" stroke-width="1.7" stroke-linecap="round" opacity="${r1(o)}"/>`;
  }
  return s;
}

// Ansiktsbilden för vem (dl, dt, dj) i läget (LAGEN); samma text tillbaka när
// bilden redan är så.
export function uttryck(svg, vem, lage) {
  const a = ANS[vem];
  if (!a) return svg;
  const p = a.egen && lage in a.egen ? a.egen[lage] : LAGE[lage];
  if (!p) return svg;
  const doc = las(svg);
  // DT: öppna ögon i stället för de hopknipna (skrattrynkorna kvar när han är glad)
  if (a.skratt) {
    const plats = rensa(doc, p.rynkor ? { ...a.skratt, rynkor: [] } : a.skratt);
    if (plats) inPa(plats, oppnaOgon(a.ogon, a.linje));
  }
  if (a.mun) {
    const plats = rensa(doc, a.bort);
    if (plats) inPa(plats, munnen(a, p));
  }
  ogonen(doc, a, p);
  brynen(doc, a, p);
  if (p.rod != null) {
    for (const el of doc.querySelectorAll(`ellipse[fill="${a.rodnad}"]`)) el.setAttribute('opacity', Math.round(Number(el.getAttribute('opacity') || 1) * p.rod * 100) / 100);
  }
  return new XMLSerializer().serializeToString(doc);
}

// DJ:s mun i skägget (rum/skagg-dj.svg) efter läget: läpparna under mustaschen.
const SKAGG = { lapp: '#a8584a', mork: '#3e1512', tand: '#efe8dc', mustasch: 'M-24 42' };
export function skaggUttryck(svg, lage) {
  const p = LAGE[lage];
  if (!p) return svg;
  const doc = las(svg);
  const mus = [...doc.querySelectorAll('path')].find((x) => (x.getAttribute('d') || '').startsWith(SKAGG.mustasch));
  rensa(doc, { fill: [SKAGG.lapp, SKAGG.mork], klipp: ['mdj'] });
  if (!mus) return new XMLSerializer().serializeToString(doc);
  let s;
  if (p.mun === 'skratt') {
    // öppen med tänderna överst, under mustaschen
    const f = 'M-17 38 Q0 42 17 38 Q14 53 0 56 Q-14 53 -17 38 Z';
    s = `<path d="M-19 37.5 Q0 42 19 37.5 Q15 56 0 59 Q-15 56 -19 37.5 Z" fill="${SKAGG.lapp}"/><path d="${f}" fill="${SKAGG.mork}"/><clipPath id="mdj"><path d="${f}"/></clipPath>`
      + `<g clip-path="url(#mdj)"><path d="M-18 37 Q0 41 18 37 L18 44 Q0 48 -18 44 Z" fill="${SKAGG.tand}"/><ellipse cx="0" cy="52" rx="7" ry="3.5" fill="#9c4038"/></g>`;
  } else {
    const c = p.mun;
    const h = 16 * (p.tight ? 0.8 : 1);
    const b = 6 * c;
    const y = 46;
    // underläppen som en fylld båge under linjen, linjen mellan läpparna
    s = `<path d="M${-h} ${r1(y - b)} Q0 ${r1(y + b + 6 + 2 * c)} ${h} ${r1(y - b)} Q0 ${r1(y + b + 1)} ${-h} ${r1(y - b)} Z" fill="${SKAGG.lapp}"/>`
      + `<path d="M${-h - 1} ${r1(y - b)} Q0 ${r1(y + b)} ${h + 1} ${r1(y - b)}" fill="none" stroke="${SKAGG.mork}" stroke-width="${p.tight ? 3.2 : 2.6}" stroke-linecap="round"/>`;
  }
  mus.insertAdjacentHTML('beforebegin', s);
  return new XMLSerializer().serializeToString(doc);
}
