// Matchanalysen (fas 5): underlaget som skickas till språkmodellen,
// innehållsavtrycket och sifferkontrollen. Ren kod utan beroenden – körs i
// proxyn på Cloudflare (worker/index.mjs) och lokalt i Express-servern.
//
// Underlaget är det matchvyn visar, med sidans precision: hela procent, mål
// med en decimal, odds med två, decimalkomma. Ingen hämttid ingår, så samma
// underlag ger samma avtryck oavsett när källorna hämtades. Det är också
// facit för sifferkontrollen – ett tal som inte står här får inte stå i texten.

const TZ = 'Europe/Stockholm';
const fKickoff = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
});

// Hela procent som summerar till 100 (största rest) – samma regel som sidan.
export function pct3(ps) {
  const raw = ps.map((p) => p * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}
const pct = (x) => Math.round(x * 100);
const dec = (x, d = 1) => (x == null ? '–' : x.toFixed(d).replace('.', ','));
const sgn = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '±0');
const line = (x) => String(x).replace('.', ',');

function seasonOf(iso) {
  const y = Number(iso.slice(0, 4));
  const start = Number(iso.slice(5, 7)) >= 7 ? y : y - 1;
  return `${start}/${String(start + 1).slice(2)}`;
}

function marketMissing(d) {
  if (d.match.type === 'cup') return d.odds.note || 'DraftKings har inga odds för matchen';
  return 'football-data.co.uk har inga odds för matchen ännu (läggs ut fre/tis)';
}

export function payloadOf(d) {
  const m = d.match;
  const p = d.prediction;
  const H = m.home;
  const A = m.away;
  const trio = (v) => ({ [H]: v[0], Oavgjort: v[1], [A]: v[2] });
  const w = pct3(p.p);

  const match = { tävling: m.compName, säsong: seasonOf(m.kickoff) };
  if (m.round) match.omgång = m.round;
  match.avspark = `${fKickoff.format(new Date(m.kickoff))} svensk tid`;
  match.hemmalag = H;
  match.bortalag = A;
  if (m.venue) match.arena = m.venue;
  if (m.neutral) match['neutral plan'] = 'ja';
  if (m.tierNote) match.nivåer = m.tierNote;

  const prognos = {
    regelversion: p.rulesVersion,
    'skattad på matcher t.o.m.': p.fitThrough,
    '1X2 efter 90 minuter, %': trio(w),
  };
  if (p.range) prognos['osäkerhet i lagens styrka, mittersta 80 %, %'] = trio(p.range.map((r) => `${pct(r[0])}–${pct(r[1])}`));
  prognos['förväntade mål'] = { [H]: dec(p.goals[0]), [A]: dec(p.goals[1]) };
  prognos['över 2,5 mål, %'] = pct(p.over25);
  prognos['båda lagen gör mål, %'] = pct(p.btts);
  prognos['troligaste resultat'] = p.scores.top.map((t) => `${t.home}–${t.away} (${pct(t.p)} %)`);
  if (p.advance) {
    if (p.advance.home == null) {
      prognos['går vidare'] = `okänt – ${p.advance.reason || ''}`.trim();
    } else {
      const a = pct3([p.advance.home, p.advance.away]);
      const adv = { [H]: `${a[0]} %`, [A]: `${a[1]} %`, regel: p.advance.rule };
      const f = p.advance.firstLeg;
      if (f) adv['första mötet'] = `${f.home} ${f.score.home}–${f.score.away} ${f.away}`;
      prognos['går vidare'] = adv;
    }
  }
  prognos.lagdata = [p.teams.home, p.teams.away].map((t) => (t.basis === 'eget'
    ? `${t.name}: ${t.matches} matcher sedan ${t.since}, ${t.seasonMatches} i år`
    : `${t.name}: nivåsnitt, ${t.matches} FA-cupmatcher för lag under National League sedan ${t.since}`));
  if (p.notes && p.notes.length) prognos.noteringar = p.notes;

  // Steg för steg, som kortet "Vad drog åt vilket håll".
  let prev = null;
  const steg = (p.steps || []).map((x) => {
    const row = { steg: x.label };
    if (x.sub) row.detalj = x.sub;
    row['1X2, %'] = pct3(x.p).join(' · ');
    if (prev) {
      const d1 = x.p[0] - prev.p[0];
      const d2 = x.p[2] - prev.p[2];
      const [team, dv] = d1 >= d2 ? [H, d1] : [A, d2];
      const v = Math.round(dv * 100);
      row['drar mot'] = v >= 1 ? `${team} +${v} procentenheter` : 'ingen märkbar effekt';
    }
    prev = x;
    return row;
  });

  const b = p.baselines;
  const mk = b.market;
  const baslinjer = { 'ordning för 1X2': `${H} · oavgjort · ${A}`, modellen: w.join(' · ') };
  if (mk && mk.p) {
    const c = pct3(mk.p);
    baslinjer['(c) marknaden'] = { '1X2, %': c.join(' · '), källa: `${mk.source}, ${mk.kind}` };
    if (mk.over25 != null) baslinjer['(c) marknaden']['över 2,5 mål, %'] = pct(mk.over25);
    baslinjer['modellen minus marknaden, procentenheter'] = w.map((x, i) => sgn(x - c[i])).join(' · ');
  } else {
    baslinjer['(c) marknaden'] = `okänt – ${marketMissing(d)}`;
  }
  baslinjer['(b) säsongens mål'] = b.season.p
    ? { '1X2, %': pct3(b.season.p).join(' · '), underlag: `Poisson på årets matcher (${b.season.matches[0]} resp. ${b.season.matches[1]})` }
    : `okänt – ${b.season.reason}`;
  baslinjer['(a) naiv'] = b.naive.p
    ? { '1X2, %': pct3(b.naive.p).join(' · '), underlag: `${b.naive.scope}, ${b.naive.seasons[0]}–${b.naive.seasons[1]}` }
    : `okänt – ${b.naive.reason}`;

  const out = { match, prognos, 'vad drog åt vilket håll': steg, 'mot baslinjerna': baslinjer };
  out.odds = oddsOf(d.odds);
  out.lagen = teamsOf(d, H, A);
  out.form = {
    förklaring: 'senaste 5 i alla tävlingar, nyast först; V/O/F avgjort på 90 minuter',
    [H]: formOf(d.teams.home),
    [A]: formOf(d.teams.away),
  };
  if (d.meetings && d.meetings.length) {
    out['möten i år'] = d.meetings.map((x) => `${x.kickoff.slice(0, 10)} ${x.compShort}: ${x.home} ${x.score.home}–${x.score.away} ${x.away}`);
  }
  const pm = d.pastMeetings;
  if (pm) {
    out['möten tidigare säsonger'] = pm.list.length
      ? pm.list.map((x) => `${x.date} (${x.season}) ${x.compShort}: ${x.home} ${x.score.home}–${x.score.away} ${x.away}`)
      : `inga möten i ligorna sedan ${pm.first} eller i FA-cupen sedan 2021/22`;
  }
  out['skador och avstängningar'] = { [H]: squadOf(d.squad.home), [A]: squadOf(d.squad.away) };
  const src = [d.squad.home, d.squad.away].find((s) => s.source);
  if (src) out['skador och avstängningar'].källa = `${src.source.provider}${src.note ? `, ${src.note}` : ''}`;
  out.okänt = d.unknowns;
  return out;
}

function oddsOf(o) {
  const rows = [];
  const x12 = (v) => v.map((x) => dec(x, 2)).join(' · ');
  const ou = (t) => `över/under ${line(t.line)} mål ${dec(t.over, 2)} / ${dec(t.under, 2)}`;
  if (o.espn) rows.push(`${o.espn.provider} via ESPN: ${x12(o.espn.x12)}${o.espn.total ? `; ${ou(o.espn.total)}` : ''}`);
  for (const [label, s] of [['öppning', o.fdOpen], ['stängning', o.fdClose]]) {
    if (!s) continue;
    if (s.avg) rows.push(`football-data.co.uk, snitt ${label}: ${x12(s.avg)}${s.total25 ? `; ${ou({ line: 2.5, ...s.total25 })}` : ''}`);
    if (s.betfair) rows.push(`football-data.co.uk, Betfair Exchange ${label}: ${x12(s.betfair)}`);
  }
  return rows.length ? rows : `okänt – ${o.note || 'inga odds hittade för matchen'}`;
}

// Tabellen "Lagen sida vid sida", grupp för grupp.
function teamsOf(d, H, A) {
  const out = {};
  for (const g of d.rows) {
    const grp = {};
    const s = g.sources && g.sources.find(Boolean);
    if (s) {
      let src = s.provider;
      if (g.through) {
        const [a, b] = g.through;
        src += a === b ? `, t.o.m. ${a || '–'}` : `, t.o.m. ${a || '–'} resp. ${b || '–'}`;
      }
      grp.källa = src;
    }
    for (const r of g.rows) grp[r.label] = { [H]: r.values[0] == null ? 'okänt' : r.values[0], [A]: r.values[1] == null ? 'okänt' : r.values[1] };
    if (g.note) grp.not = g.note;
    out[g.title] = grp;
  }
  return out;
}

function formOf(t) {
  const f = t.form || [];
  if (!f.length) return 'inga tidigare matcher';
  return f.map((x) => `${x.result || '?'} ${x.date} ${x.comp} ${x.home ? 'hemma' : 'borta'}${x.opponent ? ` mot ${x.opponent}` : ''} ${x.gf}–${x.ga}${x.decided ? ` (${x.decided})` : ''}`);
}

function squadOf(s) {
  if (s.unknown) return `okänt – ${s.reason}`;
  if (!s.players.length) return 'inga skador eller avstängningar rapporterade';
  return s.players.map((p) => `${p.name}${p.pos ? ` (${p.pos})` : ''} ${p.status}` +
    `${p.chance != null ? `, ${p.chance} % chans att spela` : ''}${p.news ? `: ${p.news}` : ''}${p.since ? ` (${p.since})` : ''}`);
}

// ---------- innehållsavtryck ----------

export async function fingerprint(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ---------- sifferkontroll ----------

// Taltoken med decimalkomma eller -punkt och tusental med (hårt) mellanslag,
// t.ex. "1,7", "20 096". Gränserna hindrar tusentalsformen från att matcha
// mitt i en längre sifferföljd. Tecken (+, −) räknas inte.
const NUM_RE = /(?<![\d.,])\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?(?!\d)|\d+(?:[.,]\d+)?/g;
// Räkneord kontrolleras också – prompten kräver siffror, och ett tal skrivet
// med bokstäver ska inte kunna slinka förbi. ("en"/"ett" är också artiklar.)
const WORDS = {
  noll: 0, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12,
  tretton: 13, fjorton: 14, femton: 15, sexton: 16, sjutton: 17, arton: 18, nitton: 19, tjugo: 20,
};
const WORD_RE = new RegExp(`(?<![\\p{L}\\d])(${Object.keys(WORDS).join('|')})(?![\\p{L}\\d])`, 'giu');

const norm = (tok) => String(parseFloat(tok.replace(/[   ]/g, '').replace(',', '.')));

export function numbersIn(s) {
  return [...s.matchAll(NUM_RE)].map((m) => norm(m[0]));
}

// Talen i texten som inte finns i underlaget (tomt = godkänd). Kontrollen ser
// att varje tal finns i underlaget, inte att det används i rätt sammanhang.
export function foreignNumbers(text, payload) {
  const allowed = new Set(numbersIn(JSON.stringify(payload)));
  const bad = [];
  for (const m of text.matchAll(NUM_RE)) if (!allowed.has(norm(m[0]))) bad.push(m[0]);
  for (const m of text.matchAll(WORD_RE)) if (!allowed.has(String(WORDS[m[1].toLowerCase()]))) bad.push(m[1]);
  return [...new Set(bad)];
}
