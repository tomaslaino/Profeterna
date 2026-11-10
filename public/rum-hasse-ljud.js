// Ljuden runt Hasse Backe (rum-hasse.js): handen eller näven i bardisken, och koppen som klirrar på
// fatet när den landar efter slaget eller när han ställer ned den. Allt räknas fram med Web Audio när
// det hörs, utan ljudfiler, och lite olika varje gång.
//
// spela(ctx, { typ: 'dunk' | 'klirr' | 'skrap' | 'vissla' | 'anda', styrka, sort, mjuk, ms, f, f1 }), från figurens händelser
// (handelser i rum-hasse-3d.js) och pennan på din kupong (rum-hasse-kupong.js). sort: 'hand' (handflatan), 'nave' (lillfingersidan av näven) eller
// 'bada' (båda händerna). mjuk: koppen ställs ned, inte tappas. vissla: en ton han visslar, f till f1 Hz under ms;
// anda: han andas på glasögonen (sort 'ha') eller blåser på naglarna ('blas').
// Elden (cigarren som tänds, rum-hasse-eld.js): fras (stickan mot plånen och lågan som tar), puff (ett bloss
// när han tänder), skak (han skakar ut stickan), lock och stang (tändarens lock upp och igen) och hjul (hjulet
// mot flintan; tar: lågan tar).

const brus = new WeakMap();
// en sekund vitt brus per ljudsammanhang
function bruset(ctx) {
  let b = brus.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    brus.set(ctx, b);
  }
  return b;
}
const slump = (a, b) => a + Math.random() * (b - a);

// Allt går genom en mjuk begränsare, så att ett hårt slag inte spräcker ljudet.
const begr = new WeakMap();
function slutet(ctx) {
  let c = begr.get(ctx);
  if (!c) {
    c = ctx.createDynamicsCompressor();
    c.threshold.value = -8;
    c.knee.value = 6;
    c.ratio.value = 6;
    c.attack.value = 0.002;
    c.release.value = 0.18;
    const g = ctx.createGain();
    g.gain.value = 1;
    c.connect(g).connect(ctx.destination);
    begr.set(ctx, c);
  }
  return c;
}
// Ut: en gemensam volym, och åt vilket håll ljudet kommer (koppen till höger, hans högra hand till
// vänster i bilden).
function ut(ctx, mal, hall) {
  const g = ctx.createGain();
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = hall;
    g.connect(p).connect(mal);
  } else g.connect(mal);
  return g;
}
// styrkan: snabbt upp, sedan exponentiellt ned (tau i sekunder)
function kurva(ctx, t, topp, tau, upp = 0.002) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(topp, t + upp);
  g.gain.setTargetAtTime(0, t + upp, tau);
  return g;
}
// brus genom ett filter
function bruston(ctx, t, typ, f, q, topp, tau, mal, len = 0.4) {
  const s = ctx.createBufferSource();
  s.buffer = bruset(ctx);
  const fl = ctx.createBiquadFilter();
  fl.type = typ;
  fl.frequency.value = f;
  fl.Q.value = q;
  const g = kurva(ctx, t, topp, tau, 0.0008);
  s.connect(fl).connect(g).connect(mal);
  s.start(t, Math.random() * 0.5, len);
}
// en sinuston som klingar av, med tonhöjden från f0 till f1
function ton(ctx, t, f0, f1, glid, topp, tau, mal, len = 0.6) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + glid);
  const g = kurva(ctx, t, topp, tau);
  o.connect(g).connect(mal);
  o.start(t);
  o.stop(t + len);
}

// Handen (eller näven) i en tjock bardisk av trä: en dov duns som sjunker, träets knack, handflatans
// smäll och skivan som klingar kort. Allt på disken skramlar lite.
function dunk(ctx, mal, t, s, sort) {
  const nave = sort === 'nave';
  const bada = sort === 'bada';
  const o = ut(ctx, mal, bada ? 0 : -0.25);
  o.gain.value = Math.min(1, 0.6 + 0.3 * s);
  const k = Math.min(1.4, s);
  // dunsen
  ton(ctx, t, nave ? 88 : 105, nave ? 44 : 52, 0.12, 0.85 * k, bada ? 0.11 : 0.085, o, 0.7);
  ton(ctx, t, nave ? 150 : 175, nave ? 92 : 110, 0.08, 0.32 * k, 0.05, o, 0.4);
  // träet: knacket och skivan som klingar
  bruston(ctx, t, 'bandpass', nave ? 210 : 280, 1.3, 0.9 * k, 0.045, o);
  bruston(ctx, t, 'bandpass', nave ? 620 : 760, 2.2, 0.28 * k, 0.03, o);
  ton(ctx, t, slump(205, 222), slump(198, 205), 0.2, 0.12 * k, 0.11, o);
  ton(ctx, t, slump(338, 352), slump(330, 338), 0.2, 0.07 * k, 0.08, o);
  // handflatan smäller (näven nästan inte), två händer strax efter varandra
  const small = (t2, a) => {
    bruston(ctx, t2, 'highpass', 1500, 0.7, a, 0.011, o, 0.1);
    bruston(ctx, t2, 'bandpass', 3200, 0.9, a * 0.5, 0.006, o, 0.08);
  };
  small(t, (nave ? 0.06 : 0.42) * k);
  if (bada) small(t + slump(0.006, 0.014), 0.38 * k);
  // askkoppen och fatet skramlar till
  skrammel(ctx, mal, t + slump(0.004, 0.012), 0.22 * k);
}

// Porslin mot porslin: några deltoner som inte är övertoner, de höga klingar av fortast, och ett
// litet klick. Koppens fot slår oftast två gånger strax efter varandra.
const DELAR = [[1, 1, 0.16], [1.59, 0.62, 0.11], [2.41, 0.5, 0.075], [3.46, 0.32, 0.05], [4.72, 0.2, 0.032]];
function porslin(ctx, mal, t, s, f0) {
  for (const [r, a, tau] of DELAR) ton(ctx, t, f0 * r * slump(0.995, 1.005), f0 * r, 0.05, a * s * 0.16, tau * slump(0.85, 1.15), mal, tau * 6 + 0.05);
  bruston(ctx, t, 'highpass', 4200, 0.8, s * 0.22, 0.004, mal, 0.05);
}
function klirr(ctx, mal, t, s, mjuk) {
  const o = ut(ctx, mal, 0.35);
  const f0 = mjuk ? slump(1650, 1850) : slump(1900, 2350);
  // (när han ställer ned den: först foten mot fatet, ett dovare tock)
  if (mjuk) bruston(ctx, t, 'bandpass', 950, 1.6, s * 0.35, 0.018, o, 0.1);
  porslin(ctx, o, t, s * (mjuk ? 0.7 : 1), f0);
  if (Math.random() < 0.75) porslin(ctx, o, t + slump(0.008, 0.022), s * slump(0.25, 0.5), f0 * slump(1.01, 1.04));
}
// allt det andra på disken: korta, låga klick av gods
function skrammel(ctx, mal, t, s) {
  const o = ut(ctx, mal, 0.1);
  for (let i = 0; i < 3; i++) {
    const t2 = t + i * slump(0.012, 0.03);
    porslin(ctx, o, t2, s * (1 - i * 0.3), slump(1300, 1700));
  }
}

// Pennan mot papperet och disken under: ett kort, torrt skrap.
function skrap(ctx, mal, t, s, ms) {
  const o = ut(ctx, mal, -0.1);
  const lang = ms / 1000;
  for (const [typ, f, q, a] of [['bandpass', slump(2500, 3300), 0.7, 0.2], ['bandpass', slump(700, 950), 1.1, 0.12]]) {
    const b = ctx.createBufferSource();
    b.buffer = bruset(ctx);
    const fl = ctx.createBiquadFilter();
    fl.type = typ;
    fl.frequency.value = f;
    fl.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a * s, t + 0.012);
    g.gain.setValueAtTime(a * s, t + lang * 0.7);
    g.gain.linearRampToValueAtTime(0, t + lang);
    b.connect(fl).connect(g).connect(o);
    b.start(t, Math.random() * 0.5, lang + 0.02);
  }
}

// Han visslar (klippet vissla): en ren ton som glider upp i tonen i början, med lite vibrato och luften
// som hörs i den, mjukt in och ut.
function vissla(ctx, mal, t, e) {
  const o = ut(ctx, mal, 0);
  const lang = Math.max(0.15, (e.ms || 300) / 1000);
  const s = Math.min(1, e.styrka ?? 0.8);
  const f0 = e.f;
  const f1 = e.f1 || f0;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(f0 * 0.94, t);
  osc.frequency.exponentialRampToValueAtTime(f0, t + 0.045);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + lang);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = slump(5, 6.2);
  const lg = ctx.createGain();
  lg.gain.value = f0 * 0.012;
  lfo.connect(lg).connect(osc.frequency);
  const topp = 0.11 * s;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(topp, t + 0.035);
  g.gain.setValueAtTime(topp, t + lang - 0.07);
  g.gain.linearRampToValueAtTime(0, t + lang);
  osc.connect(g).connect(o);
  // luften
  const b = ctx.createBufferSource();
  b.buffer = bruset(ctx);
  const fl = ctx.createBiquadFilter();
  fl.type = 'bandpass';
  fl.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + lang);
  fl.Q.value = 6;
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0, t);
  bg.gain.linearRampToValueAtTime(0.05 * s, t + 0.03);
  bg.gain.linearRampToValueAtTime(0, t + lang);
  b.connect(fl).connect(bg).connect(o);
  osc.start(t);
  lfo.start(t);
  b.start(t, Math.random() * 0.3, lang + 0.05);
  osc.stop(t + lang + 0.05);
  lfo.stop(t + lang + 0.05);
}
// Ett andetag: ett varmt, dovt ha på glasögonen, eller en tunnare pust på naglarna.
function anda(ctx, mal, t, e) {
  const o = ut(ctx, mal, -0.05);
  const lang = Math.max(0.1, (e.ms || 400) / 1000);
  const ha = e.sort === 'ha';
  const b = ctx.createBufferSource();
  b.buffer = bruset(ctx);
  const fl = ctx.createBiquadFilter();
  fl.type = 'bandpass';
  fl.frequency.value = ha ? slump(650, 800) : slump(1800, 2400);
  fl.Q.value = ha ? 0.9 : 1.4;
  const topp = ha ? 0.22 : 0.12;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(topp, t + lang * 0.25);
  g.gain.linearRampToValueAtTime(topp * 0.6, t + lang * 0.7);
  g.gain.linearRampToValueAtTime(0, t + lang);
  b.connect(fl).connect(g).connect(o);
  b.start(t, Math.random() * 0.4, lang + 0.05);
}

// en brusvåg genom ett filter, upp på upp sekunder och ned på ned, med topp a
function svep(ctx, mal, t, typ, f, q, a, upp, ned, f1 = f) {
  const b = ctx.createBufferSource();
  b.buffer = bruset(ctx);
  const fl = ctx.createBiquadFilter();
  fl.type = typ;
  fl.frequency.setValueAtTime(f, t);
  if (f1 !== f) fl.frequency.exponentialRampToValueAtTime(f1, t + upp + ned);
  fl.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(a, t + upp);
  g.gain.linearRampToValueAtTime(0, t + upp + ned);
  b.connect(fl).connect(g).connect(mal);
  b.start(t, Math.random() * 0.4, upp + ned + 0.05);
}
// Stickan dras mot plånen: ett torrt skrap med knaster i, och lågan som fräser till och tar.
function fras(ctx, mal, t) {
  const o = ut(ctx, mal, -0.35);
  svep(ctx, o, t, 'bandpass', slump(2600, 3400), 1.1, 0.24, 0.01, 0.11);
  for (let i = 0; i < 6; i++) bruston(ctx, t + slump(0, 0.1), 'highpass', 3000, 0.8, slump(0.05, 0.12), 0.004, o, 0.03);
  svep(ctx, o, t + 0.07, 'lowpass', 900, 0.7, 0.3, 0.05, 0.45, 400);
  svep(ctx, o, t + 0.08, 'bandpass', 2200, 0.9, 0.06, 0.03, 0.3);
}
// Ett bloss: läpparna om cigarren, ett mjukt, dovt pupp.
function puff(ctx, mal, t) {
  const o = ut(ctx, mal, -0.15);
  svep(ctx, o, t, 'lowpass', slump(500, 650), 1.2, 0.3, 0.012, 0.07);
  ton(ctx, t, slump(150, 170), 110, 0.05, 0.09, 0.03, o, 0.12);
}
// Han skakar ut stickan: två snabba luftdrag.
function skak(ctx, mal, t) {
  const o = ut(ctx, mal, -0.3);
  svep(ctx, o, t, 'bandpass', 700, 0.8, 0.12, 0.02, 0.07);
  svep(ctx, o, t + 0.14, 'bandpass', 650, 0.8, 0.1, 0.02, 0.07);
}
// Tändarens lock: ett klart metalliskt klick när det fälls upp, ett dovare när det slås igen.
function lock(ctx, mal, t, upp) {
  const o = ut(ctx, mal, -0.3);
  const f0 = upp ? slump(3100, 3500) : slump(1900, 2200);
  for (const [r, a, tau] of [[1, 1, 0.05], [1.71, 0.5, 0.03], [2.63, 0.3, 0.02]]) ton(ctx, t, f0 * r, f0 * r, 0.01, a * (upp ? 0.07 : 0.06), tau * (upp ? 1.4 : 0.7), o, 0.3);
  bruston(ctx, t, 'highpass', 4000, 0.8, upp ? 0.18 : 0.26, 0.006, o, 0.04);
  if (!upp) bruston(ctx, t, 'bandpass', 900, 1.2, 0.25, 0.02, o, 0.06);
}
// Hjulet mot flintan: ett kort, kornigt raspande, och tar det fräser lågan upp.
function hjul(ctx, mal, t, tar) {
  const o = ut(ctx, mal, -0.3);
  for (let i = 0; i < 9; i++) bruston(ctx, t + i * slump(0.008, 0.013), 'bandpass', slump(3500, 5200), 1.4, slump(0.06, 0.14), 0.005, o, 0.03);
  if (tar) svep(ctx, o, t + 0.07, 'lowpass', 700, 0.7, 0.16, 0.04, 0.35, 350);
}

export function spela(ctx, e) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime + 0.01;
  const s = Math.max(0, e.styrka || 0);
  const mal = slutet(ctx);
  if (e.typ === 'dunk') dunk(ctx, mal, t, s, e.sort);
  else if (e.typ === 'klirr' && s > 0.02) klirr(ctx, mal, t, s, e.mjuk);
  else if (e.typ === 'skrap') skrap(ctx, mal, t, s, e.ms);
  else if (e.typ === 'vissla' && e.f) vissla(ctx, mal, t, e);
  else if (e.typ === 'anda') anda(ctx, mal, t, e);
  else if (e.typ === 'fras') fras(ctx, mal, t);
  else if (e.typ === 'puff') puff(ctx, mal, t);
  else if (e.typ === 'skak') skak(ctx, mal, t);
  else if (e.typ === 'lock') lock(ctx, mal, t, e.upp !== false);
  else if (e.typ === 'hjul') hjul(ctx, mal, t, Boolean(e.tar));
}
