// När analyserna skrivs (config/analyser.js, tider): på bestämda klockslag i svensk
// tid, också när sommartiden skiftar. Varje tid skriver nya analyser för omgångens
// matcher som inte har börjat. Sover datorn när det är dags skrivs de när den
// vaknar, och en match som misslyckas försöks igen tills nästa tid.

const TZ = 'Europe/Stockholm';
const H = 3600000;
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function svensk(ms) {
  const p = Object.fromEntries(fmt.formatToParts(ms).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), min: Number(p.minute) };
}

// Ögonblicket när den svenska klockan visar den tiden.
function ogonblick(y, m, d, h, min) {
  const mal = Date.UTC(y, m - 1, d, h, min);
  let t = mal;
  for (let i = 0; i < 2; i++) {
    const s = svensk(t);
    t += mal - Date.UTC(s.y, s.m - 1, s.d, s.h, s.min);
  }
  return t;
}

// Tiderna drygt en vecka åt båda håll, i ordning. dag: 0 = söndag, 1 = måndag …
function runt(now, tider) {
  const s = svensk(now);
  const ut = [];
  for (let i = -8; i <= 8; i++) {
    const dag = new Date(Date.UTC(s.y, s.m - 1, s.d + i));
    for (const t of tider) {
      if (t.dag !== dag.getUTCDay()) continue;
      const [h, min] = t.kl.split(':').map(Number);
      ut.push(ogonblick(dag.getUTCFullYear(), dag.getUTCMonth() + 1, dag.getUTCDate(), h, min));
    }
  }
  return ut.sort((a, b) => a - b);
}

export const senasteTid = (now, tider) => runt(now, tider).filter((t) => t <= now).pop() || 0;
export const nastaTid = (now, tider) => runt(now, tider).find((t) => t > now) || null;

// Vilka av omgångens matcher ska skrivas nu? per: match-id → analysen.
//   - En tid gäller omgångar som fanns när klockan slog, så att en omgång som skapas
//     strax före nästa tid inte skrivs två gånger i rad.
//   - En match utan analys skrivs ändå när det är högst forhandTimmar kvar till avspark.
//   - Analyser med en äldre promptVersion räknas som saknade.
// → {kvar, klara, att, tid, nasta}: att är matcherna som ska skrivas, tid den senaste
// tiden och nasta den som kommer efter.
export function attSkriva(round, per, { now, tider, forhandTimmar, version, tvinga = false }) {
  const kvar = round.matcher.filter((x) => Date.parse(x.avspark) > now);
  const tid = senasteTid(now, tider);
  const skapad = Date.parse(round.skapad) || 0;
  const galler = tid >= skapad;
  const klara = [];
  const att = [];
  for (const x of kvar) {
    const a = per.get(String(x.id));
    const aktuell = Boolean(a && a.version === version);
    const fardig = aktuell && (!galler || Date.parse(a.writtenAt) >= tid);
    if (fardig) klara.push(x);
    const saknasNara = !aktuell && Date.parse(x.avspark) - now <= forhandTimmar * H;
    if (tvinga || (!fardig && (galler || saknasNara))) att.push(x);
  }
  return { kvar, klara, att, tid, nasta: nastaTid(now, tider) };
}
