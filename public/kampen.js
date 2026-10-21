'use strict';

// ---------- Olympen ----------
//
// Fliken Olympen (#olympen, först Kampen – filerna heter kampen): gängets
// inbördes kamp om tipsen, säsongen igenom.
// Samma tips och poäng som Omgångens och Säsongens tippare på förstasidan
// (tippare.js, tippoang.js): 1 för rätt minus modellens chans för tipset före
// avspark – plus är bättre än modellen, minus sämre.
//
// Omgångarna är de avslutade ur data/tippare.json (src/tippare.js, med
// matcherna och allas tecken) och – medan den pågår – omgången ur
// GET …/samtal, preliminärt och rättad som kupongen (ställningen efter 90
// minuter, aktuell ställning, Dölj resultat). En avslutad omgång med en match
// som Dölj resultat döljer räknas bort, som på förstasidan.
//
// Sidan: ställningen som en prispall, betyget (betyg.js), kurvan omgång för
// omgång, inbördes möten (vem som fick mest poäng i omgångarna som båda
// tippade), spelkassan (10 kr per match på sitt tips till modellens odds),
// höjdpunkterna, var och ens sätt att tippa och omgångarna – med gängets
// kupong ur varje omgång – och sist Grupparbetena: de färdigspelade
// kupongerna (historik.js, #olympen/kuponger/<id>).
//
// Läses efter tippare.js och använder dess data och hjälpare (TP, tpLoad,
// tpLoadSeason, tpScore, tpRoundHidden, tpPts, tpTone, tpAwards, tpLiveName,
// tpRoundHead), kupong.js (KP, teamsOf, dateRange, kpNum, whenMatches,
// loadCoupons), kronan.js (KRONAN_KROPPAR), betyg.js (Betyg) och historik.js
// (Historik) när de finns.

// hk: rutan som Grupparbetena ritas i. Den ligger kvar när resten av sidan
// ritas om, så att sorteringen och AI:ns kommentarer står kvar.
// coupons: de färdigspelade kupongerna, när historiken är läst (wait).
const KAMP = { html: null, width: 0, hk: null, coupons: null, wait: null };
// Spelkassan: så mycket på varje match.
const KAMP_INSATS = 10;
const KAMP_BILD = { DL: 'profeterna/laino.jpg', DT: 'profeterna/teijder.jpg', DJ: 'profeterna/johansson.jpg' };
// En färg per tippare i kurvan och vid porträtten, i gängets ordning – samma
// som på kupongen (.sm-p0–2 i samtal.css): blått, grönt och lila. Den mörkare
// tonen är för papperet (betyg.js).
const KAMP_FARG = ['#b3cffb', '#97e0bd', '#d6bcf7', '#f0d699', '#f2b8a0'];
const KAMP_DJUP = ['#4d8ff0', '#3db37c', '#a069e6', '#c9973f', '#c8643a'];
const KAMP_MODELL = '#9d9383';

// ---------- omgångarna ----------

// Gänget i tjänstens ordning, och den som bara finns i en gammal omgång sist.
function kampGang(rounds) {
  const list = (((KP.data && KP.data.samtal && KP.data.samtal.gang) || [])).map((g) => ({ id: g.id, name: g.namn || g.id, bild: g.bild }));
  for (const r of rounds) {
    for (const p of r.people || []) if (!list.some((g) => g.id === p.id)) list.push({ id: p.id, name: p.name || p.id });
  }
  // Utan tjänsten och utan omgångar: gänget från kröningens bilder (kronan.js).
  if (!list.length && typeof KRONAN_KROPPAR !== 'undefined') {
    for (const [id, k] of Object.entries(KRONAN_KROPPAR)) list.push({ id, name: k.namn || id });
  }
  return list.map(({ bild, ...g }, i) => ({ ...g, color: KAMP_FARG[i % KAMP_FARG.length], deep: KAMP_DJUP[i % KAMP_DJUP.length], img: bild || KAMP_BILD[g.id] || null }));
}

// Omgången som pågår, i samma form som de avslutade – eller null.
function kampLive(frozen, now) {
  const round = TP.round;
  if (!round || !round.visas || !round.tips || !Array.isArray(round.matcher) || !round.matcher.length || !state.all) return null;
  if (frozen.some((r) => r.id === round.id)) return null;
  const s = tpScore(round, now);
  if (!s.played || !s.ranked.length) return null;
  const kicks = s.status.map((r) => r.kick).filter(Boolean);
  const matches = round.matcher.map((x, i) => {
    const st = s.status[i];
    if (st.state === 'off' || st.state === 'missing') return null;
    const model = st.m && (st.m.j && st.m.j.p ? st.m.j.p : st.m.f ? st.m.f.p : null);
    const tips = {};
    for (const g of round.gang || []) {
      const t = round.tips[g.id] && round.tips[g.id].tecken;
      const sign = Tippoang.sign(t && t[x.id]);
      if (sign) tips[g.id] = sign;
    }
    const res = st.state === 'final' && st.res != null ? Tippoang.SIGNS[st.res] : null;
    return { id: x.id, match: teamsOf(st), ...(res ? { res } : {}), ...(model ? { model } : {}), tips };
  }).filter(Boolean);
  // Leder och Sist blir orakel och Ikaros först när omgången är klar.
  const people = s.people.map(({ rows, award, ...p }) => (s.done && award ? { ...p, award } : p));
  return {
    id: round.id,
    ...(tpLiveName() ? { name: tpLiveName() } : {}),
    from: new Date(Math.min(...kicks)).toISOString(),
    to: new Date(Math.max(...kicks)).toISOString(),
    live: true,
    done: s.done,
    n: s.played,
    total: s.n,
    hidden: s.hidden,
    people,
    model: { n: s.model.n, ok: s.model.ok, pts: s.model.pts },
    matches,
  };
}

// Omgångarna i tidsordning, den som pågår sist. Var och en har people
// [{id, name, none?, n, ok, pts, award?}], model {n, ok, pts} och matches
// [{id, match, res?, model?, tips}] – res bara när matchen är avgjord.
function kampRounds(now = Date.now()) {
  const all = (TP.season && TP.season.rounds) || [];
  const hidden = all.filter(tpRoundHidden);
  const list = all.filter((r) => !hidden.includes(r))
    .map((r) => ({ ...r, done: true, matches: (r.matches || []).filter((m) => !m.off) }))
    .sort((a, b) => String(a.from).localeCompare(String(b.from)));
  const live = kampLive(all, now);
  if (live) list.push(live);
  return { list, hidden, live };
}

const kampTook = (p) => p && !p.none && p.n > 0;

// Varje avgjort tips: vem, tecknet, modellens chans, om det satt, poängen och
// om den var ensam om rätt. Med model också modellens eget tips per match.
function kampTips(rounds) {
  const out = [];
  const model = [];
  for (const r of rounds) {
    for (const m of r.matches || []) {
      if (!m.res) continue;
      const who = Object.entries(m.tips || {}).map(([id, t]) => [id, Tippoang.sign(t)]).filter(([, s]) => s);
      const hits = who.filter(([, s]) => s.includes(m.res)).length;
      const msign = Tippoang.modelSign(m.model || null);
      for (const [id, sign] of who) {
        const prob = Tippoang.chance(sign, Tippoang.pct(sign, m.model || null));
        const hit = sign.includes(m.res);
        out.push({ id, sign, prob, hit, pts: Tippoang.points(hit, prob), alone: hit && hits === 1 && who.length > 1, withModel: msign ? sign.includes(msign) : null, r, m });
      }
      if (msign) {
        const prob = Tippoang.chance(msign, Tippoang.pct(msign, m.model));
        model.push({ id: 'modellen', sign: msign, prob, hit: msign === m.res, r, m });
      }
    }
  }
  return { tips: out, model };
}

// ---------- ord och tal ----------

const kampPct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : '–');
const kampKr = (x) => {
  const v = Math.round(x);
  const t = Math.abs(v).toLocaleString('sv-SE');
  return v > 0 ? `+${t} kr` : v < 0 ? `−${t} kr` : '0 kr';
};
const kampOdds = (prob) => (prob > 0 ? fmtOdds(1 / prob) : '–');
const kampSurname = (name) => { const i = name.indexOf(' '); return i > 0 ? name.slice(i + 1) : name; };
// Kupong 1 med omgångens namn bredvid, och datumen och vad namnet syftar på
// när man pekar.
const kampRoundNr = (r) => couponNumber((r.matches || []).map((m) => m.id));
const kampRound = (r) => `<span title="${esc([dateRange(r.from, r.to), r.hint].filter(Boolean).join(' · '))}">Kupong ${kampRoundNr(r)}` +
  `${r.name ? ` <span class="kp-bi">${esc(r.name)}</span>` : ''}</span>`;
const kampRoundText = (r) => `Kupong ${kampRoundNr(r)} (${r.name || dateRange(r.from, r.to)})`;

function kampFace(g, size = '') {
  const style = `style="--km-c:${g.color}"`;
  return g.img
    ? `<span class="km-face${size}" ${style}><img src="${esc(g.img)}" alt="" loading="lazy" width="200" height="200"></span>`
    : `<span class="km-face${size} km-face-txt" ${style}>${esc(g.id)}</span>`;
}

// ---------- ställningen ----------

// Ställningen som en prispall uppe på Olympen: kropparna från kröningen
// (KRONAN_KROPPAR i kronan.js) på marmorsocklar, ettan i mitten med strålar
// bakom sig. Lika placering står lika högt. Modellen står nedanför. Före
// första omgången står de utnämnda på förhand där (kampEmpty).

// Berget bakom pallen: en dimmig kam längst bak, Olympen framför med snö på
// topparna.
const KAMP_BERG = '<svg class="km-berg" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
  '<path class="b" d="M0 120V76l38-12 30 8 42-20 38 14 36-9 30 12 36-19 40 12 40-14 38 15 32-6v59z"/>' +
  '<path class="f" d="M0 120V97l48-12 40 4 40-27 30-17 26-15 16-9 14 10 18-7 24 23 30 15 34 12 40 8 40 8v28z"/>' +
  '<path class="s" d="M166 45l18-15 16-9 14 10 18-7 11 11-9-1-10 7-10-5-10 7-10-6-12 8z"/></svg>';
const KAMP_MOLN = '<div class="km-moln" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';

// Tvåan till vänster, ettan i mitten, trean till höger – resten efter.
const kampPallOrder = (list) => (list.length >= 3 ? [list[1], list[0], list[2], ...list.slice(3)] : list);

function kampFig(g) {
  const k = typeof KRONAN_KROPPAR !== 'undefined' ? KRONAN_KROPPAR[g.id] : null;
  return k
    ? `<div class="km-fig"><img src="${esc(k.bild)}" alt="" draggable="false"></div>`
    : `<div class="km-fig km-fig-txt">${kampFace(g, ' km-face-lg')}</div>`;
}

// cols: [{g, rank, cap}] i placeringsordning. flat: alla lika högt i gängets
// ordning, med 0 på sockeln.
function kampPall(cols, flat = false) {
  const steps = (flat ? cols : kampPallOrder(cols)).map(({ g, rank, cap }) => {
    const r = flat ? 3 : Math.min(rank, 3);
    return `<li class="km-step km-r${r}${!flat && rank === 1 ? ' is-lead' : ''}" style="--km-c:${g.color}">` +
      `<div class="km-stand">${!flat && rank === 1 ? '<div class="km-rays"></div>' : ''}${kampFig(g)}` +
      `<div class="km-plinth"><span>${flat ? 0 : rank}</span></div></div>` +
      `<div class="km-cap">${cap}</div></li>`;
  }).join('');
  return `<div class="km-pall n${cols.length}"><div class="km-sky">${KAMP_BERG}${KAMP_MOLN}</div><ol class="km-steps">${steps}</ol></div>`;
}

function kampStanding(rounds, live, gang) {
  const s = Tippoang.season(rounds);
  const byId = new Map(gang.map((g) => [g.id, g]));
  const lead = s.people[0];
  let rank = 0;
  let prev = null;
  const cols = s.people.map((p, i) => {
    const key = Tippoang.key(p);
    if (key !== prev) { rank = i + 1; prev = key; }
    const g = byId.get(p.id) || { id: p.id, name: p.name, color: KAMP_MODELL };
    const now = live && live.people.find((x) => x.id === p.id);
    const behind = Math.round((lead.pts - p.pts) * 10) / 10;
    const gap = rank > 1 && behind > 0 ? ` title="${kpNum(behind)} efter ${esc(kampSurname(lead.name))}"` : '';
    const badges = tpAwards(p) +
      (kampTook(now) ? `<span class="km-now ${tpTone(now.pts)}" title="Preliminärt, i omgången som pågår">${tpPts(now.pts)} i omgången</span>` : '');
    const cap = `<b class="km-name" title="${esc(p.name)}">${esc(kampSurname(p.name))}</b>` +
      `<span class="km-pts ${tpTone(p.pts)}"${gap}>${tpPts(p.pts)}</span>` +
      `<span class="km-ok" title="Antal rätt av spelade matcher">${p.ok}<span>/${p.n}</span></span>` +
      (badges ? `<span class="km-badges">${badges}</span>` : '');
    return { g, rank, cap };
  });
  const m = s.model;
  const model = m.n
    ? '<p class="km-pall-model"><span class="km-face km-face-txt km-face-model" aria-hidden="true">M</span>' +
      `<span>Modellen</span><b class="${tpTone(m.pts)}">${tpPts(m.pts)}</b>` +
      `<span class="km-ok" title="Antal rätt av spelade matcher">${m.ok}<span>/${m.n}</span></span></p>`
    : '';
  const done = rounds.filter((r) => r.done).length;
  const status = live
    ? `<p class="kp-line km-status">${live.done ? 'Omgången är färdigspelad' : `Preliminärt · omgången pågår, ${live.n} av ${live.total} matcher spelade`}` +
      `${live.hidden ? ` · ${Spoiler.chip(`${live.hidden} ${live.hidden === 1 ? 'dold' : 'dolda'}`)}` : ''}</p>`
    : '';
  return '<div class="card km-card">' +
    `<p class="kp-eyebrow">${done ? `Ställningen efter ${done} ${done === 1 ? 'omgång' : 'omgångar'}` : 'Ställningen'}</p>` +
    `${kampPall(cols)}${model}${status}</div>`;
}

// ---------- kurvan ----------

// Jämna steg för y-axeln: högst fem streck.
function kampTicks(lo, hi) {
  const span = Math.max(hi - lo, 0.5);
  const step = [0.25, 0.5, 1, 2, 5, 10, 20].find((x) => span / x <= 5) || 50;
  const out = [];
  for (let v = Math.floor(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  if (out[out.length - 1] < hi) out.push(out[out.length - 1] + step);
  return out;
}

// Poängen efter varje omgång, en linje per tippare och modellen streckad. Ritas
// i sidans bredd så att texten håller sin storlek på mobilen.
function kampCurve(rounds, gang, width) {
  const series = [...gang, { id: 'modellen', name: 'Modellen', color: KAMP_MODELL, model: true }].map((g) => {
    let acc = 0;
    let took = false;
    const pts = [0];
    for (const r of rounds) {
      const p = g.model ? r.model : (r.people || []).find((x) => x.id === g.id);
      if (kampTook(p)) { acc += p.pts; took = true; }
      pts.push(acc);
    }
    return { ...g, pts, took };
  }).filter((x) => x.took);
  if (!series.length) return '';
  const W = Math.max(280, Math.min(width || 640, 1080));
  const H = W < 480 ? 190 : 230;
  const L = 34;
  const R = 34;
  const T = 12;
  const B = 24;
  const all = series.flatMap((x) => x.pts);
  const ticks = kampTicks(Math.min(0, ...all), Math.max(0, ...all));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const x = (i) => L + (i * (W - L - R)) / rounds.length;
  const y = (v) => T + ((hi - v) * (H - T - B)) / (hi - lo || 1);
  const r1 = (v) => Math.round(v * 10) / 10;
  const grid = ticks.map((v) => `<line class="${v === 0 ? 'km-zero' : 'km-gl'}" x1="${L}" x2="${W - R}" y1="${r1(y(v))}" y2="${r1(y(v))}"/>` +
    `<text class="km-tick" x="${L - 6}" y="${r1(y(v)) + 4}" text-anchor="end">${v > 0 ? '+' : v < 0 ? '−' : ''}${kpNumShort(Math.abs(v))}</text>`).join('');
  // Datum under några av omgångarna, så att de inte krockar.
  const every = Math.max(1, Math.ceil(rounds.length / Math.floor((W - L - R) / 64)));
  const dates = rounds.map((r, i) => {
    const j = i + 1;
    if (j !== rounds.length && (rounds.length - j) % every) return '';
    return `<text class="km-tick" x="${r1(x(j))}" y="${H - 6}" text-anchor="middle">${r.live && !r.done ? 'nu' : esc(dateRange(r.from))}</text>`;
  }).join('');
  const liveLast = rounds.length && rounds[rounds.length - 1].live && !rounds[rounds.length - 1].done;
  const lines = series.map((sx) => {
    const p = sx.pts.map((v, i) => `${r1(x(i))} ${r1(y(v))}`);
    const solid = liveLast ? p.slice(0, -1) : p;
    const dash = sx.model ? ' stroke-dasharray="5 4"' : '';
    let d = solid.length > 1 ? `<path d="M${solid.join(' L')}" stroke="${sx.color}"${dash}/>` : '';
    if (liveLast) d += `<path class="km-prel" d="M${p.slice(-2).join(' L')}" stroke="${sx.color}"/>`;
    const dots = sx.model ? '' : sx.pts.slice(1).map((v, i) =>
      `<circle cx="${r1(x(i + 1))}" cy="${r1(y(v))}" r="3" fill="${sx.color}"><title>${esc(kampSurname(sx.name))} efter ${esc(kampRoundText(rounds[i]))}: ${tpPts(v)}</title></circle>`).join('');
    return d + dots;
  }).join('');
  // Porträtten vid linjernas slut, i ring i tipparens färg – isärflyttade om
  // de hamnar för nära. Modellen och den som saknar bild får bokstäver.
  const ends = series.map((sx) => ({ sx, face: !sx.model && sx.img, y: y(sx.pts[sx.pts.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) {
    const gap = ends[i].face || ends[i - 1].face ? 20 : 12;
    if (ends[i].y - ends[i - 1].y < gap) ends[i].y = ends[i - 1].y + gap;
  }
  const ex = x(rounds.length);
  const labels = ends.map(({ sx, face, y: yy }) => (face
    ? `<g class="km-endface"><clipPath id="km-end-${esc(sx.id)}"><circle cx="${r1(ex + 16)}" cy="${r1(yy)}" r="9"/></clipPath>` +
      `<image href="${esc(sx.img)}" x="${r1(ex + 7)}" y="${r1(yy - 9)}" width="18" height="18" preserveAspectRatio="xMidYMid slice" clip-path="url(#km-end-${esc(sx.id)})"/>` +
      `<circle cx="${r1(ex + 16)}" cy="${r1(yy)}" r="9.8" fill="none" stroke="${sx.color}" stroke-width="1.6"/><title>${esc(sx.name)}</title></g>`
    : `<text class="km-end" x="${r1(ex + 7)}" y="${r1(yy) + 4}" fill="${sx.color}">${sx.model ? 'M' : esc(sx.id)}</text>`)).join('');
  const legend = series.map((sx) => `<span class="km-key${sx.model ? ' km-key-model' : ''}" style="--km-c:${sx.color}">${esc(sx.model ? 'Modellen' : kampSurname(sx.name))}</span>`).join('');
  return '<div class="card km-card">' +
    '<p class="kp-eyebrow">Omgång för omgång</p>' +
    `<svg class="km-curve" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Poängen efter varje omgång">` +
    `${grid}${dates}<g class="km-lines">${lines}</g>${labels}</svg>` +
    `<p class="km-keys">${legend}</p></div>`;
}

// Tal på y-axeln: utan decimaler när de inte behövs.
function kpNumShort(v) {
  return Number.isInteger(v) ? String(v) : v.toLocaleString('sv-SE', { maximumFractionDigits: 2 });
}

// ---------- inbördes ----------

// Varje par: omgångar som var och en vann, lika, och poängen mot varandra – i
// de avslutade omgångarna som båda tippade. Samma ordning som placeringen:
// poängen med en decimal, sedan antal rätt.
function kampPairs(rounds, gang) {
  const done = rounds.filter((r) => r.done);
  const out = [];
  for (let i = 0; i < gang.length; i++) {
    for (let j = i + 1; j < gang.length; j++) {
      const a = gang[i];
      const b = gang[j];
      const pr = { a, b, wa: 0, wb: 0, eq: 0, diff: 0 };
      for (const r of done) {
        const pa = (r.people || []).find((x) => x.id === a.id);
        const pb = (r.people || []).find((x) => x.id === b.id);
        if (!kampTook(pa) || !kampTook(pb)) continue;
        const ka = Tippoang.key(pa);
        const kb = Tippoang.key(pb);
        if (ka > kb) pr.wa += 1;
        else if (kb > ka) pr.wb += 1;
        else pr.eq += 1;
        pr.diff += pa.pts - pb.pts;
      }
      if (pr.wa + pr.wb + pr.eq) out.push(pr);
    }
  }
  return out;
}

function kampPairsCard(rounds, gang) {
  const pairs = kampPairs(rounds, gang);
  if (!pairs.length) return '';
  const rows = pairs.map((p) => {
    const n = p.wa + p.wb + p.eq;
    const d = Math.round(p.diff * 10) / 10;
    const ahead = d > 0 ? p.a : d < 0 ? p.b : null;
    const line = [
      `${n} ${n === 1 ? 'omgång' : 'omgångar'}`,
      p.eq ? `${p.eq} ${p.eq === 1 ? 'oavgjord' : 'oavgjorda'}` : null,
      ahead ? `${esc(kampSurname(ahead.name))} ${kpNumShort(Math.abs(d))} poäng före` : 'lika på poäng',
    ].filter(Boolean).join(' · ');
    return '<li class="km-pair">' +
      `<span class="km-side">${kampFace(p.a, ' km-face-sm')}<b>${esc(kampSurname(p.a.name))}</b></span>` +
      `<span class="km-score"><b class="${p.wa > p.wb ? 'win' : ''}">${p.wa}</b>–<b class="${p.wb > p.wa ? 'win' : ''}">${p.wb}</b></span>` +
      `<span class="km-side km-side-b"><b>${esc(kampSurname(p.b.name))}</b>${kampFace(p.b, ' km-face-sm')}</span>` +
      `<span class="km-bar" aria-hidden="true"><i style="flex:${p.wa};background:${p.a.color}"></i><i class="km-eq" style="flex:${p.eq}"></i><i style="flex:${p.wb};background:${p.b.color}"></i></span>` +
      `<span class="km-pair-sub">${line}</span></li>`;
  }).join('');
  return '<div class="card km-card">' +
    '<p class="kp-eyebrow">Inbördes möten</p>' +
    `<ul class="km-pairs">${rows}</ul></div>`;
}

// ---------- spelkassan ----------

// 10 kr per match på sitt tips till modellens odds före avspark. En
// gardering delar tian så att vinsten blir densamma vilket tecken som än
// sitter: insatsen genom tecknens chans ihop.
function kampKassa(t, gang) {
  const one = (list) => {
    const k = { n: list.length, in: list.length * KAMP_INSATS, back: 0, best: null };
    for (const x of list) {
      if (!x.hit) continue;
      const pay = KAMP_INSATS / x.prob;
      k.back += pay;
      if (!k.best || pay > k.best.pay) k.best = { pay, x };
    }
    k.net = k.back - k.in;
    return k;
  };
  const people = gang.map((g) => ({ g, ...one(t.tips.filter((x) => x.id === g.id)) })).filter((k) => k.n);
  people.sort((a, b) => b.net - a.net);
  return { people, model: one(t.model) };
}

function kampKassaCard(t, gang) {
  const k = kampKassa(t, gang);
  if (!k.people.length) return '';
  const best = (b) => (b ? `största vinsten ${Math.round(b.pay)} kr på ${esc(b.x.sign)} i ${esc(b.x.m.match)}` : 'ingen vinst ännu');
  const row = (g, x, model) => `<li class="km-krow${model ? ' km-model' : ''}">` +
    (model ? '<span class="km-face km-face-txt km-face-model" aria-hidden="true">M</span>' : kampFace(g)) +
    `<span class="km-who"><b>${esc(model ? 'Modellen' : kampSurname(g.name))}</b>` +
    `<span class="sub">${x.in.toLocaleString('sv-SE')} kr på ${x.n} ${x.n === 1 ? 'match' : 'matcher'} · ${best(x.best)}</span></span>` +
    `<span class="km-kr ${x.net >= 0.5 ? 'pos' : x.net <= -0.5 ? 'neg' : ''}">${kampKr(x.net)}</span></li>`;
  return '<div class="card km-card">' +
    `<p class="kp-eyebrow">Spelkassan <span class="km-hint">${KAMP_INSATS} kr per match</span></p>` +
    `<ul class="km-kassa">${k.people.map((x) => row(x.g, x)).join('')}${k.model.n ? row(null, k.model, true) : ''}</ul></div>`;
}

// ---------- höjdpunkterna ----------

function kampHighlights(rounds, t, gang) {
  const byId = new Map(gang.map((g) => [g.id, g]));
  const nameOf = (id) => esc(kampSurname((byId.get(id) || { name: id }).name));
  const hits = t.tips.filter((x) => x.hit);
  const bomb = hits.length ? hits.reduce((a, b) => (b.pts > a.pts ? b : a)) : null;
  const per = rounds.filter((r) => r.done).flatMap((r) => (r.people || []).filter(kampTook).map((p) => ({ p, r })));
  const top = per.length ? per.reduce((a, b) => (b.p.pts > a.p.pts ? b : a)) : null;
  const low = per.length ? per.reduce((a, b) => (b.p.pts < a.p.pts ? b : a)) : null;
  const list = [
    bomb && ['Säsongens skräll', kampOdds(bomb.prob), `odds · ${nameOf(bomb.id)} tippade ${esc(bomb.sign)} i ${esc(bomb.m.match)}`],
    top && ['Bästa omgången', tpPts(top.p.pts), `${nameOf(top.p.id)} · ${kampRound(top.r)}`],
    low && low !== top && ['Sämsta omgången', tpPts(low.p.pts), `${nameOf(low.p.id)} · ${kampRound(low.r)}`],
  ];
  if (!list.some(Boolean)) return '';
  return '<div class="km-tiles">' + list.filter(Boolean).map(([label, num, sub]) =>
    `<div class="dv-tile km-tile"><div class="dv-tile-label">${esc(label)}</div><div class="dv-tile-num">${num}</div><div class="dv-tile-sub">${sub}</div></div>`).join('') + '</div>';
}

// ---------- så tippar vi ----------

function kampStyle(rounds, t, gang) {
  const cols = gang.map((g) => {
    const mine = t.tips.filter((x) => x.id === g.id);
    const mr = rounds.filter((r) => r.done).map((r) => (r.people || []).find((p) => p.id === g.id)).filter(kampTook);
    const withM = mine.filter((x) => x.withModel != null);
    return {
      g,
      n: mine.length,
      odds: mine.length ? kampOdds(mine.reduce((a, x) => a + x.prob, 0) / mine.length) : '–',
      hedge: kampPct(mine.filter((x) => x.sign.length > 1).length, mine.length),
      model: kampPct(withM.filter((x) => x.withModel).length, withM.length),
      alone: mine.filter((x) => x.alone).length,
      bombs: mine.filter((x) => x.hit && x.prob < 1 / 3).length,
      best: mr.length ? tpPts(Math.max(...mr.map((p) => p.pts))) : '–',
    };
  }).filter((c) => c.n);
  if (!cols.length) return '';
  const rows = [
    ['Snittodds', 'odds', 'Modellens odds för tipsen i genomsnitt – högre är djärvare'],
    ['Garderade', 'hedge', 'Andel tips med två eller tre tecken'],
    ['Höll med modellen', 'model', 'Andel tips där modellens troligaste utfall fanns med'],
    ['Ensam om rätt', 'alone', 'Matcher där ingen annan i gänget hade rätt'],
    ['Skrällar som satt', 'bombs', 'Rätt på tips med odds över 3,00'],
    ['Bästa omgången', 'best', 'Högsta poäng i en enskild omgång'],
  ];
  const head = cols.map((c) => `<th scope="col" title="${esc(c.g.name)}"><span class="km-dot" style="--km-c:${c.g.color}"></span><span class="km-long">${esc(kampSurname(c.g.name))}</span><span class="km-short">${esc(c.g.id)}</span></th>`).join('');
  const body = rows.map(([label, k, what]) => `<tr><th scope="row" title="${esc(what)}">${esc(label)}</th>${cols.map((c) => `<td>${c[k]}</td>`).join('')}</tr>`).join('');
  return '<div class="card km-card">' +
    '<p class="kp-eyebrow">Så tippar vi</p>' +
    `<div class="table-wrap"><table class="km-style"><thead><tr><th scope="col"><span class="tp-vh">Mått</span></th>${head}</tr></thead>` +
    `<tbody>${body}</tbody></table></div></div>`;
}

// ---------- omgångarna ----------

// Gängets kupong ur omgången: den färdigspelade kupongen med flest av
// omgångens matcher, minst hälften av kupongens (som namnet i
// src/history.js) – eller null.
function kampCoupon(r) {
  const ids = new Set((r.matches || []).map((m) => String(m.id)));
  let best = null;
  let most = 0;
  for (const c of KAMP.coupons || []) {
    const n = c.rows.filter((x) => x.id && ids.has(x.id)).length;
    if (n > most) {
      most = n;
      best = c;
    }
  }
  return best && most * 2 >= best.rows.length ? best : null;
}

// Kupongens rätt, i betygets färg, med länk ner till den i Grupparbetena.
function kampCouponLink(c) {
  const href = esc(Historik.href(c.id));
  if (Historik.hidden(c)) return `<a class="km-kup" href="${href}" title="Resultatet är dolt">?</a>`;
  return `<a class="km-kup g${c.grade}" href="${href}" title="${esc(`${c.ok} av ${c.n} rätt · ${c.label}`)}">` +
    `${c.ok}<span>/${c.n}</span></a>`;
}

function kampRoundsCard(rounds, gang) {
  if (!rounds.length) return '';
  const cols = [...gang.filter((g) => rounds.some((r) => kampTook((r.people || []).find((p) => p.id === g.id)))), { id: 'modellen', model: true }];
  // Kolumnen Kupongen när någon omgång har en färdigspelad kupong.
  const kup = rounds.some(kampCoupon);
  const head = cols.map((c) => `<th scope="col" class="km-th-face" title="${esc(c.model ? 'Modellen' : c.name)}">` +
    `${c.model ? '<span class="km-face km-face-sm km-face-txt km-face-model">M</span>' : kampFace(c, ' km-face-sm')}</th>`).join('') +
    (kup ? '<th scope="col" class="km-th-face km-col-kup" title="Gängets kupong">' +
      '<span class="km-face km-face-sm km-face-model km-face-kup" aria-hidden="true"></span><span class="tp-vh">Kupongen</span></th>' : '');
  const body = rounds.slice().reverse().map((r) => {
    const cells = cols.map((c) => {
      const p = c.model ? r.model : (r.people || []).find((x) => x.id === c.id);
      if (!kampTook(p)) return '<td class="tp-none">–</td>';
      const aw = p.award ? ` tp-aw ${p.award}` : '';
      const title = p.award === 'best' ? 'Omgångens orakel' : p.award === 'worst' ? 'Omgångens Ikaros' : '';
      return `<td><span class="${(tpTone(p.pts) + aw).trim()}"${title ? ` title="${title}"` : ''}>${tpPts(p.pts)}</span></td>`;
    }).join('');
    // Gängets kupong: en egen kolumn, och i telefonen en rad under omgången
    // (historik.css).
    const k = kup && kampCoupon(r);
    const link = k && k.n ? kampCouponLink(k) : '';
    const kcell = kup ? (link ? `<td class="km-col-kup">${link}</td>` : '<td class="km-col-kup tp-none">–</td>') : '';
    const kline = link ? `<span class="km-kup-sm">Kupongen ${link}</span>` : '';
    const n = r.live ? `${r.n} av ${r.total} matcher` : `${r.n} ${r.n === 1 ? 'match' : 'matcher'}`;
    return `<tr${r.live && !r.done ? ' class="km-live"' : ''}><th scope="row">${tpRoundHead(r, `${r.live && !r.done ? 'pågår · ' : ''}${n}`)}${kline}</th>${cells}${kcell}</tr>`;
  }).join('');
  return '<div class="card km-card tp-card tp-rounds">' +
    '<p class="kp-eyebrow">Omgångarna</p>' +
    `<div class="table-wrap"><table class="tp-table"><thead><tr><th scope="col">Omgång</th>${head}</tr></thead>` +
    `<tbody>${body}</tbody></table></div></div>`;
}

// ---------- sidan ----------

const KAMP_HJALP = '<details class="help km-help"><summary>Så räknas poängen</summary>' +
  '<p>Rätt tips ger 1 poäng och fel tips 0. Från det dras modellens chans för ditt tips, räknad före avspark. ' +
  'Ett säkert tips ger alltså lite när det sitter och kostar mycket när det spricker.</p>' +
  '<p>Exempel: modellen ger hemmalaget 70 % chans att vinna. Tippar du 1 och hemmalaget vinner får du 1 − 0,7 = +0,3. ' +
  'Blir det kryss eller bortavinst får du 0 − 0,7 = −0,7. Samma räkning för tre sorters tips:</p>' +
  '<table class="km-rules"><thead><tr><th scope="col">Tips</th><th scope="col">Chans</th><th scope="col">Rätt</th><th scope="col">Fel</th></tr></thead><tbody>' +
  '<tr><th scope="row">Storfavorit</th><td>70 %</td><td class="pos">+0,3</td><td class="neg">−0,7</td></tr>' +
  '<tr><th scope="row">Jämn match</th><td>40 %</td><td class="pos">+0,6</td><td class="neg">−0,4</td></tr>' +
  '<tr><th scope="row">Skräll</th><td>20 %</td><td class="pos">+0,8</td><td class="neg">−0,2</td></tr></tbody></table>' +
  '<p>Garderar du läggs chanserna för dina tecken ihop. Har krysset 20 % räknas 1X i exemplet som 90 %: ' +
  '+0,1 om det sitter och −0,9 om det spricker. En helgardering täcker alltid 100 % och ger därför 0.</p>' +
  '<p>För en hel omgång blir summan helt enkelt antal rätt minus så många rätt som modellen väntade sig av dina tips. ' +
  'Plus betyder att du fick fler rätt än modellen trodde, minus färre. ' +
  'Bäst i omgången blir Omgångens orakel och sämst Omgångens Ikaros.</p></details>';

// Före första omgången står de som utnämndes på förhand (KRONAN_START i
// kronan.js) på pallen: oraklet högst i mitten, Ikaros lägst och resten
// emellan. Utan kröningen står alla lika högt.
function kampEmpty(gang) {
  const start = typeof KRONAN_START !== 'undefined' ? KRONAN_START : null;
  const step = (g) => (!start ? 0 : start.orakel.includes(g.id) ? 0 : start.ikaros.includes(g.id) ? 2 : 1);
  const n = [0, 1].map((s) => gang.filter((g) => step(g) === s).length);
  const cols = [...gang].sort((a, b) => step(a) - step(b)).map((g) => ({
    g,
    rank: [1, 1 + n[0], 1 + n[0] + n[1]][step(g)],
    cap: `<b class="km-name" title="${esc(g.name)}">${esc(kampSurname(g.name))}</b>`,
  }));
  return '<div class="card km-card km-empty">' + kampPall(cols, !start) +
    '<p class="km-empty-title">Alla står på noll.</p>' +
    '<p><a class="kp-btn" href="#kupong">Till omgången</a></p></div>';
}

function kampHtml(width) {
  const { list, hidden, live } = kampRounds();
  const gang = kampGang(list);
  const hid = hidden.length
    ? `<p class="kp-line km-status">${Spoiler.chip(`${hidden.length} ${hidden.length === 1 ? 'omgång dold' : 'omgångar dolda'}`)}` +
      `<button type="button" class="tp-show" data-sp-show="${esc(hidden.flatMap((r) => r.matches.map((m) => m.id)).join(' '))}">Visa ändå</button></p>`
    : '';
  const head = '<h2 class="page-title">Olympen</h2>';
  // Platsen för Grupparbetena (KAMP.hk), som kampRender sätter in.
  const kup = window.Historik ? '<div data-km-kuponger></div>' : '';
  if (!list.length) return head + kampEmpty(gang) + hid + kup;
  const t = kampTips(list);
  const pair = [kampPairsCard(list, gang), kampKassaCard(t, gang)].filter(Boolean);
  return head + hid +
    kampStanding(list, live, gang) +
    (window.Betyg ? Betyg.html(list, gang) : '') +
    kampCurve(list, gang, width) +
    (pair.length ? `<div class="km-grid">${pair.join('')}</div>` : '') +
    kampHighlights(list, t, gang) +
    kampStyle(list, t, gang) +
    kampRoundsCard(list, gang) +
    kup +
    KAMP_HJALP;
}

// #olympen/kuponger/<id>: kupongen i Grupparbetena (null utan id), eller
// undefined om adressen inte pekar dit.
function kampTarget() {
  const m = /^(?:olympen|kampen)\/kuponger(?:\/(.+))?$/.exec(location.hash.replace(/^#/, ''));
  if (!m) return undefined;
  try {
    return m[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

// Grupparbetena i sin ruta, som ligger kvar mellan omritningarna. Första
// gången och när adressen byts dit ritas de, och sidan bläddras fram till
// kupongen (eller delen).
function kampKuponger(el, go) {
  const fresh = !KAMP.hk;
  if (fresh) {
    KAMP.hk = document.createElement('section');
    KAMP.hk.className = 'km-kuponger';
    KAMP.hk.setAttribute('aria-label', 'Gängets kuponger');
  }
  const slot = el.querySelector('[data-km-kuponger]');
  if (slot) slot.replaceWith(KAMP.hk);
  if (!KAMP.hk.isConnected) return;
  const target = kampTarget();
  if (!fresh && !(go && target !== undefined)) return;
  // Efter att tabellen Omgångarna har fått kolumnen Kupongen, så att inget
  // ovanför flyttar sig när sidan har bläddrats fram.
  KAMP.wait.then(() => Historik.show(KAMP.hk, target || null)).then(() => {
    if (target === null) KAMP.hk.scrollIntoView();
  });
}

function kampRender(e) {
  const el = $('#kampen');
  if (!el || $('#battle-section').hidden) return;
  // Kupongerna läses första gången sidan visas, till tabellen Omgångarna
  // (historik.js).
  if (window.Historik && !KAMP.wait) {
    KAMP.wait = Historik.coupons().then((list) => {
      KAMP.coupons = list;
      kampRender();
    });
  }
  // Kurvan ritas i kortets bredd: sidans bredd minus kortets luft.
  const width = el.clientWidth - (el.clientWidth < 560 ? 34 : 42);
  const open = el.querySelector('.km-help') && el.querySelector('.km-help').open;
  const html = kampHtml(width);
  if (html !== KAMP.html) {
    KAMP.html = html;
    KAMP.width = el.clientWidth;
    el.innerHTML = html;
    if (open) el.querySelector('.km-help').open = true;
  }
  if (window.Historik) kampKuponger(el, Boolean(e && e.type === 'hashchange'));
}

// ---------- start ----------

(async function initKampen() {
  const el = $('#kampen');
  if (!el) return;
  await Promise.all([whenMatches(), loadCoupons(), TP.season ? null : tpLoadSeason()]);
  await tpLoad();
  kampRender();
  window.addEventListener('hashchange', kampRender);
  if (window.Spoiler) Spoiler.onChange(kampRender);
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { if (el.clientWidth !== KAMP.width) kampRender(); }, 150);
  });
  // Medan omgången pågår: aktuell ställning varje minut (kupong.js hämtar
  // den) och tipsen från tjänsten högst var femte minut (tippare.js).
  setInterval(() => {
    if ($('#battle-section').hidden || document.hidden) return;
    tpLoad().then(kampRender);
  }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tpLoad().then(kampRender); });
})();
