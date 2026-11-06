// Ljuden runt Hasse Backe (rum-hasse.js): handen eller näven i bardisken, och koppen som klirrar på
// fatet när den landar efter slaget eller när han ställer ned den. Allt räknas fram med Web Audio när
// det hörs, utan ljudfiler, och lite olika varje gång.
//
// spela(ctx, { typ: 'dunk' | 'klirr' | 'skrap', styrka, sort, mjuk, ms }), från figurens händelser
// (handelser i rum-hasse-3d.js) och pennan på din kupong (rum-hasse-kupong.js). sort: 'hand' (handflatan), 'nave' (lillfingersidan av näven) eller
// 'bada' (båda händerna). mjuk: koppen ställs ned, inte tappas.

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

export function spela(ctx, e) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime + 0.01;
  const s = Math.max(0, e.styrka || 0);
  const mal = slutet(ctx);
  if (e.typ === 'dunk') dunk(ctx, mal, t, s, e.sort);
  else if (e.typ === 'klirr' && s > 0.02) klirr(ctx, mal, t, s, e.mjuk);
  else if (e.typ === 'skrap') skrap(ctx, mal, t, s, e.ms);
}
