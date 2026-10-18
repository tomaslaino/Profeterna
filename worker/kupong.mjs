// Spara en kupong direkt från sidan (Kupong → Ny kupong → Spara), utan att
// den som sparar behöver ett GitHub-konto. Tjänsten profeterna-kupong
// (worker/kupong-proxy.mjs) skriver kupongen som fil i
// data/kuponger/ med en commit via GitHubs API, så git-historiken visar
// fortfarande när kupongen lades – och pushen bygger om sajten. Skyddat med
// ett gemensamt kodord.
//
//   POST /kupong {"kod": "…", "andra": "<kupong-id>" | null,
//                 "kupong": {"id", "namn", "skapad", "matcher": [{"id", "match", "tecken", "kommentar"}]}}
//   → 200 {ok: true, id, skapad, commit}   id får ett tillägg (-2 …) om
//          datumet redan är taget av en annan kupong; commit = länk
//   → 400 kupongen har fel · 403 fel kodord · 429 för många fel kodord
//   → 503 inte påslaget (hemligheterna saknas)
//
// Hemligheter i tjänsten: KUPONG_KOD (kodordet) och GITHUB_TOKEN (en
// fine-grained token med bara Contents: Read and write på repot). Lokalt kör
// server.js samma saveCoupon() men skriver filen direkt i data/kuponger/.
//
// Filen skrivs här, inte på sidan: tecken, längder och format kontrolleras,
// "skapad" sätts av tjänstens klocka och formatet är detsamma som när filen
// sparas för hand (src/coupons.js läser den).

export const REPO = 'tomaslaino/Profeterna';
export const BRANCH = 'main';
export const DIR = 'data/kuponger';

const NOTE_MAX = 140; // samma gräns som src/coupons.js
const NAME_MAX = 60;
const LABEL_MAX = 120;
const MATCHES_MAX = 40;
const WRONG_MAX = 10; // fel kodord per timme och IP-adress
const COUPON_ID = /^\d{4}-\d{2}-\d{2}(-\d{1,2})?$/;
const MATCH_ID = /^\d{1,12}$/;

// Tecknen skrivs alltid i ordningen 1, X, 2.
export function normSign(s) {
  const t = String(s == null ? '' : s).toUpperCase().replace(/[^12X]/g, '');
  return ['1', 'X', '2'].filter((c) => t.includes(c)).join('') || null;
}

const text = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);

// Kupongen från sidan → raderna i filen, eller fel.
export function validateCoupon(k) {
  const errors = [];
  if (!k || typeof k !== 'object') return { errors: ['ingen kupong'] };
  const id = String(k.id || '');
  if (!COUPON_ID.test(id)) errors.push('ogiltigt kupong-id');
  const list = Array.isArray(k.matcher) ? k.matcher : [];
  if (!list.length) errors.push('inga matcher');
  if (list.length > MATCHES_MAX) errors.push(`högst ${MATCHES_MAX} matcher`);
  const seen = new Set();
  const rows = [];
  for (const [i, m] of list.slice(0, MATCHES_MAX).entries()) {
    const mid = m && m.id != null ? String(m.id).trim() : '';
    const sign = normSign(m && m.tecken);
    if (!MATCH_ID.test(mid)) { errors.push(`match ${i + 1}: id saknas`); continue; }
    if (!sign) { errors.push(`match ${i + 1}: tecken saknas`); continue; }
    if (seen.has(mid)) { errors.push(`match ${i + 1}: finns redan på kupongen`); continue; }
    seen.add(mid);
    const note = text(m.kommentar, NOTE_MAX);
    rows.push({ id: mid, match: text(m.match, LABEL_MAX) || `match ${mid}`, tecken: sign, ...(note ? { kommentar: note } : {}) });
  }
  const created = k.skapad && !Number.isNaN(Date.parse(k.skapad)) ? new Date(k.skapad).toISOString() : null;
  return { id, name: text(k.namn, NAME_MAX), created, rows, errors };
}

// Filen med en match per rad – samma format som sidan skriver (public/kupong.js).
export function couponJSON(file) {
  const { matcher, ...head } = file;
  const lines = Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  const rows = matcher.map((r, i) => `    { "id": ${JSON.stringify(r.id)}, "match": ${JSON.stringify(r.match)}, "tecken": ${JSON.stringify(r.tecken)}` +
    `${r.kommentar ? `, "kommentar": ${JSON.stringify(r.kommentar)}` : ''} }${i < matcher.length - 1 ? ',' : ''}`);
  return ['{', ...lines, '  "matcher": [', ...rows, '  ]', '}', ''].join('\n');
}

// Jämför kodordet utan att svarstiden avslöjar hur mycket som stämde.
async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', enc.encode(String(s)))));
  const u = new Uint8Array(x);
  const v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

function fail(status, error) {
  return { status, body: { ok: false, error } };
}

const conflict = () => Object.assign(new Error('konflikt'), { conflict: true });

// writer: {get(path) → {sha} | null, put(path, text, {sha, message}) → {url}}
// limiter: {count() → antal fel kodord, bump()} – valfri.
export async function saveCoupon(body, { env, writer, limiter = null, now = () => new Date() }) {
  if (!env.KUPONG_KOD || !writer) return fail(503, 'Att spara direkt är inte påslaget.');
  const b = body && typeof body === 'object' ? body : {};
  if (limiter && (await limiter.count()) >= WRONG_MAX) return fail(429, 'För många fel kodord. Vänta en timme.');
  if (!b.kod || !(await sameSecret(b.kod, env.KUPONG_KOD))) {
    if (limiter) await limiter.bump();
    return fail(403, 'Fel kodord.');
  }
  const edit = b.andra == null || b.andra === '' ? null : String(b.andra);
  if (edit && !COUPON_ID.test(edit)) return fail(400, 'Ogiltig kupong.');
  const v = validateCoupon(b.kupong);
  if (v.errors.length) return fail(400, `Kupongen har fel: ${v.errors.join(', ')}.`);

  const path = (id) => `${DIR}/${id}.json`;
  const stamp = now().toISOString();
  const fileFor = (isEdit) => ({
    ...(v.name ? { namn: v.name } : {}),
    // En ny kupong får tjänstens klocka; en ändrad behåller sin första tid.
    skapad: isEdit && v.created ? v.created : stamp,
    ...(isEdit ? { 'ändrad': stamp } : {}),
    matcher: v.rows,
  });
  const message = (id, isEdit) => `Kupong ${id}${v.name ? ` (${v.name})` : ''}${isEdit ? ' ändrad' : ''}`;

  // Ändring: skriv över filen (finns den inte än skapas den med samma id).
  if (edit) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const cur = await writer.get(path(edit));
      try {
        const file = fileFor(Boolean(cur));
        const r = await writer.put(path(edit), couponJSON(file), { sha: cur && cur.sha, message: message(edit, Boolean(cur)) });
        return { status: 200, body: { ok: true, id: edit, skapad: file.skapad, commit: r.url || null } };
      } catch (err) {
        if (!err.conflict) throw err;
      }
    }
    return fail(409, 'Kupongen ändrades samtidigt av någon annan. Försök igen.');
  }

  // Ny kupong: första lediga id från datumet (2026-10-24, 2026-10-24-2 …).
  const base = v.id.slice(0, 10);
  for (let i = 1; i <= 20; i++) {
    const id = i === 1 ? base : `${base}-${i}`;
    if (await writer.get(path(id))) continue;
    try {
      const file = fileFor(false);
      const r = await writer.put(path(id), couponJSON(file), { message: message(id, false) });
      return { status: 200, body: { ok: true, id, skapad: file.skapad, commit: r.url || null } };
    } catch (err) {
      if (!err.conflict) throw err;
    }
  }
  return fail(409, 'Hittade inget ledigt kupong-id för datumet.');
}

// UTF-8 → base64, som GitHubs API vill ha filens innehåll.
function base64(s) {
  let bin = '';
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Skriver filen med en commit via GitHubs contents-API.
export function githubWriter(token, { repo = REPO, branch = BRANCH, fetchImpl = fetch } = {}) {
  const api = `https://api.github.com/repos/${repo}/contents/`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'profeterna-kupong',
  };
  const problem = (res) => Object.assign(new Error(`GitHub svarade ${res.status}.`), { status: 502 });
  return {
    async get(p) {
      const res = await fetchImpl(`${api}${p}?ref=${encodeURIComponent(branch)}`, { headers });
      if (res.status === 404) return null;
      if (!res.ok) throw problem(res);
      const d = await res.json();
      return { sha: d.sha };
    },
    async put(p, content, { sha, message }) {
      const res = await fetchImpl(`${api}${p}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: base64(content), branch, ...(sha ? { sha } : {}) }),
      });
      // 409: filen ändrades sedan vi läste den; 422 om sha: filen finns redan.
      if (res.status === 409) throw conflict();
      if (res.status === 422 && /sha/i.test(await res.text())) throw conflict();
      if (!res.ok) throw problem(res);
      const d = await res.json();
      return { url: d.commit && d.commit.html_url };
    },
  };
}

// Fel kodord räknas per IP-adress i en timme (KV-bindningen KUPONG).
export function kvLimiter(kv, ip) {
  const key = `kupong-fel:${ip || 'okänd'}`;
  return {
    count: async () => Number(await kv.get(key)) || 0,
    bump: async () => kv.put(key, String((Number(await kv.get(key)) || 0) + 1), { expirationTtl: 3600 }),
  };
}
