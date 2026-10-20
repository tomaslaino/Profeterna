// Veckans Stryktips från Svenska Spel: de tretton matcherna i kupongens
// ordning och Svenska folket – hur stor del av raderna som har med 1, X och 2,
// som Svenska Spel räknar om medan raderna lämnas in och fryser vid
// spelstoppet. Sidan hämtar omgångens matcher härifrån (Välj matcher →
// Hämta Stryktipset) och visar Svenska folket under rutorna på kupongen
// (public/folket.js). Svenska Spels öppna gränssnitt svarar inte på anrop
// från andra sajter i webbläsaren, så tjänsten profeterna-kupong hämtar åt
// sidan (worker/kupong-proxy.mjs).
//
//   GET /stryktipset          omgången som är öppen för spel just nu
//   GET /stryktipset?nr=4976  en viss omgång – också efter spelstoppet,
//                             med Svenska folket som det stod då
//   → 200 {ok, omgang: {spel, nr, vecka, stang, lage, folketTid,
//          matcher: [{nr, hemma, borta, avspark, liga, folket: [1, X, 2] | null}]}}
//          omgang = null när ingen omgång är öppen (mellan spelstoppet och
//          nästa omgång)
//   → 400 ogiltigt nr · 502 Svenska Spel svarar inte
//
// Svaret sparas en minut i tjänsten, så att Svenska Spel får högst ett anrop
// i minuten per omgång hur många som än tittar.

const API = 'https://api.spela.svenskaspel.se/draw/1/stryktipset/draws';
const TTL_MS = 60000;
const memo = new Map(); // adress → {at, body}

const num = (s) => {
  const n = Number(String(s == null ? '' : s).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const iso = (s) => (s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null);

// Svenska Spels omgång → det sidan behöver.
export function trimDraw(d) {
  if (!d || !Array.isArray(d.drawEvents)) return null;
  const week = /(\d{4})-(\d{1,2})\b/.exec(d.drawComment || '') || /\bv\.?\s*(\d{1,2})\b/i.exec(d.regCloseDescription || '');
  return {
    spel: 'Stryktipset',
    nr: d.drawNumber,
    vecka: week ? Number(week[week.length - 1]) : null,
    stang: iso(d.regCloseTime),
    lage: d.drawState || null,
    folketTid: iso(d.drawEvents.map((e) => e.svenskaFolket && e.svenskaFolket.date).filter(Boolean).sort().pop()),
    matcher: d.drawEvents
      .slice()
      .sort((a, b) => a.eventNumber - b.eventNumber)
      .map((e) => {
        const m = e.match || {};
        const team = (type) => ((m.participants || []).find((p) => p.type === type) || {}).name || null;
        const [home, away] = String(e.eventDescription || '').split(' - ');
        const f = e.svenskaFolket;
        const folket = f ? [num(f.one), num(f.x), num(f.two)] : null;
        return {
          nr: e.eventNumber,
          hemma: team('home') || home || null,
          borta: team('away') || away || null,
          avspark: iso(m.matchStart),
          liga: (m.league && m.league.name) || null,
          ...(e.cancelled ? { struken: true } : {}),
          folket: folket && folket.every((x) => x != null) ? folket : null,
        };
      }),
  };
}

// fetchImpl och now går att byta i provet.
export async function getStryktipset(nr, { fetchImpl = fetch, now = () => Date.now() } = {}) {
  if (nr != null && !/^\d{1,6}$/.test(String(nr))) return { status: 400, body: { ok: false, error: 'Ogiltigt nummer på omgången.' } };
  const url = nr != null ? `${API}/${nr}` : API;
  const hit = memo.get(url);
  if (hit && now() - hit.at < TTL_MS) return { status: 200, body: hit.body };
  let raw;
  try {
    const res = await fetchImpl(url, { headers: { Accept: 'application/json' }, cf: { cacheTtl: 60, cacheEverything: true } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    raw = await res.json();
  } catch (err) {
    console.error('[stryktipset]', err);
    // Hellre en minut gammalt än inget.
    if (hit) return { status: 200, body: hit.body };
    return { status: 502, body: { ok: false, error: 'Svenska Spel svarar inte just nu.' } };
  }
  // Den öppna omgången: den som stänger först, om flera är öppna.
  const draw = nr != null ? raw.draw
    : (raw.draws || []).slice().sort((a, b) => String(a.regCloseTime).localeCompare(String(b.regCloseTime)))[0];
  const body = { ok: true, omgang: trimDraw(draw) };
  memo.set(url, { at: now(), body });
  return { status: 200, body };
}
