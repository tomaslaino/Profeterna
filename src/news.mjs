// Nyheter till matchanalysen. gatherNews() hämtar det senaste om en kommande
// match online när någon trycker på Analysera: förhandsartiklar, trupp- och
// skadeläge och presskonferenser från brittiska medier (via Bing News), lagens
// nyheter hos ESPN och BBC Sport, och väderprognosen vid arenan. newsPayload()
// gör om resultatet till en del av underlaget till språkmodellen.
//
// Varje artikel blir en datapunkt med källa, publiceringsdatum och länk, som i
// Gräva gulds datatabell. Det som inte gick att hämta står som okänt. Inget
// här ändrar prognosen.
//
// Ren kod utan beroenden – bara fetch – så att samma fil körs i proxyn på
// Cloudflare Workers och lokalt i Node. Hämtningen kastar aldrig: en källa som
// inte svarar redovisas och resten används. Inställningar i config/news.js.

import cfg from '../config/news.js';
import comps from '../config/competitions.js';

const DAY = 86400000;
const TZ = 'Europe/Stockholm';
const fDate = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

// ---------- huvudfunktionen ----------

// match: { id, comp, kickoff, home, away, venue } (som i data/match/<id>.json).
// store: valfri cache { get(key), put(key, value) } – samma som analysens.
export async function gatherNews(match, { now = new Date(), store = null, fetchImpl = globalThis.fetch } = {}) {
  const key = `news:${cfg.version}:${match.id}`;
  const cached = await safely(() => store && store.get(key));
  if (cached && cached.gatheredAt && now.getTime() - Date.parse(cached.gatheredAt) < cfg.cacheMinutes * 60000) {
    return { ...cached, cached: true };
  }

  const ctx = {
    match,
    now,
    // Anropas som fristående funktion: i Workers kastar fetch "Illegal
    // invocation" om den anropas som metod på ett annat objekt.
    fetch: (url, init) => fetchImpl(url, init),
    teams: { home: teamOf(match.home), away: teamOf(match.away) },
    to: new Date(Math.min(now.getTime(), Date.parse(match.kickoff))),
  };
  // De senaste windowDays dagarna – räknat från nu, så att en match långt
  // fram också får lagens aktuella läge.
  ctx.from = new Date(ctx.to.getTime() - cfg.windowDays * DAY);

  const S = cfg.sources;
  const [espnInfo, ...lists] = await Promise.all([
    S.espn.enabled ? run('ESPN (match)', () => espnSummary(ctx)) : skip('ESPN (match)'),
    S.bing.enabled ? run('Bing News', () => bingNews(ctx)) : skip('Bing News'),
    S.bbc.enabled ? run('BBC Sport', () => bbcFeeds(ctx)) : skip('BBC Sport'),
  ]);
  // ESPN:s lagnyheter och vädret behöver lagens ESPN-id och arenans stad.
  const info = espnInfo.value || {};
  const [espnTeam, weather] = await Promise.all([
    S.espn.enabled && info.teamIds ? run('ESPN (lagen)', () => espnTeamNews(ctx, info)) : skip('ESPN (lagen)', S.espn.enabled ? espnInfo.error || 'matchen saknas hos ESPN' : null),
    S.weather.enabled ? run('Open-Meteo', () => weatherAt(ctx, info.city)) : skip('Open-Meteo'),
  ]);

  const results = [espnInfo, ...lists, espnTeam];
  const candidates = results.flatMap((r) => (r.value && r.value.items) || []);
  const items = pick(candidates, ctx);
  await fetchBodies(items, ctx);

  const news = {
    version: cfg.version,
    matchId: match.id,
    gatheredAt: now.toISOString(),
    window: { from: ctx.from.toISOString(), to: ctx.to.toISOString() },
    items: items.map((it, i) => ({ id: `N${i + 1}`, ...publicItem(it) })),
    weather: weather.value || { unknown: true, reason: weather.error || 'ingen väderprognos' },
    sources: [...results, weather].map((r) => ({ name: r.name, ok: !r.error && !r.skipped, n: r.value && r.value.items ? r.value.items.length : null, error: r.error || null })),
  };
  // Svarade ingen nyhetskälla sparas inget – nästa klick försöker igen.
  if (news.sources.some((s) => s.ok && s.name !== 'Open-Meteo')) await safely(() => store && store.put(key, news));
  return { ...news, cached: false };
}

// Underlaget till språkmodellen, med svenska nycklar som resten av
// underlaget (worker/analysis.mjs). Artikeltexten finns bara här.
export function newsPayload(news) {
  const out = {
    förklaring: 'Hämtat online när analysen begärdes. Rapporterat i media, inte kontrollerat av Profeterna och inte med i prognosen. Hänvisa med artikelns id, t.ex. [N1], och ange källan.',
    hämtat: `${fDate.format(new Date(news.gatheredAt))} svensk tid`,
    'artiklar från': `${fDate.format(new Date(news.window.from))} svensk tid`,
  };
  out.artiklar = news.items.length
    ? news.items.map((it) => {
      const a = { id: it.id, källa: it.source, publicerad: `${fDate.format(new Date(it.publishedAt))} svensk tid`, lag: it.teams.join(', ') || 'båda/okänt', typ: it.kind, rubrik: it.title };
      if (it.summary) a.ingress = it.summary;
      if (it.text) a.text = it.text;
      return a;
    })
    : 'okänt – inga artiklar om matchen eller lagen hittades';
  out.väder = weatherText(news.weather);
  const down = news.sources.filter((s) => s.error);
  if (down.length) out['källor som inte svarade'] = down.map((s) => `${s.name}: ${s.error}`);
  return out;
}

// Hänvisningar i modellens text: [N3] eller [N1, N4].
const REF_RE = /\[(N\d+(?:\s*[,;]\s*N?\d+)*)\]/g;

// Texten utan hänvisningar – för sifferkontrollen, så att "N3" inte räknas
// som talet 3.
export function withoutRefs(text) {
  return String(text || '').replace(REF_RE, '');
}

// Hänvisningarna numreras om 1, 2, 3 … i den ordning de först citeras, som i
// Gräver Grav, och bara citerade artiklar kommer med i källistan. En
// hänvisning till ett id som inte finns tas bort.
// → { text: 'Scott är skadad [1] …', sources: [{ n, source, title, url, publishedAt }] }
export function citeNews(text, news) {
  const byId = new Map(news.items.map((it) => [it.id, it]));
  const num = new Map();
  const out = String(text || '').replace(REF_RE, (m, ids) => {
    const ns = [...new Set(ids.split(/\s*[,;]\s*/).map((x) => (x.startsWith('N') ? x : `N${x}`)))]
      .filter((id) => byId.has(id))
      .map((id) => {
        if (!num.has(id)) num.set(id, num.size + 1);
        return num.get(id);
      });
    return ns.length ? `[${ns.sort((x, y) => x - y).join(', ')}]` : '';
  })
    // [2][3] → [2, 3]
    .replace(/\[(\d+(?:, \d+)*)\](?:\s*\[(\d+(?:, \d+)*)\])+/g, (m) => `[${[...new Set(m.match(/\d+/g).map(Number))].sort((x, y) => x - y).join(', ')}]`)
    .replace(/ {2,}/g, ' ')
    .replace(/ +([.,;:])/g, '$1')
    .trim();
  const sources = [...num.entries()].map(([id, n]) => {
    const it = byId.get(id);
    return { n, source: it.source, title: it.title, url: it.url, publishedAt: it.publishedAt };
  });
  return { text: out, sources };
}

// ---------- lagnamn ----------

function teamOf(name) {
  const listed = cfg.names[name];
  const plain = String(name).replace(/^AFC /, '').replace(/ FC$/, '').replace(/ & Hove Albion$/, '');
  const names = [...new Set([...(listed || [plain]), name, plain])];
  return {
    name,
    search: names[0],
    // Skiftlägeskänsligt och på ordgräns: "Reading" ska inte träffa "reading".
    re: new RegExp(`(?<![\\p{L}\\d])(${names.map(escapeRe).sort((a, b) => b.length - a.length).join('|')})(?![\\p{L}\\d])`, 'u'),
  };
}

function teamsIn(text, ctx) {
  const out = [];
  if (ctx.teams.home.re.test(text)) out.push('home');
  if (ctx.teams.away.re.test(text)) out.push('away');
  return out;
}

// ---------- källor ----------

async function bingNews(ctx) {
  const { home, away } = ctx.teams;
  const queries = cfg.sources.bing.queries.map((q) => q.replace('{home}', home.search).replace('{away}', away.search));
  const pages = await Promise.all(queries.map(async (q) => {
    const url = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setlang=${cfg.sources.bing.market}&cc=GB`;
    try {
      return parseRss(await getText(url, ctx));
    } catch (err) {
      return { error: err.message };
    }
  }));
  const failed = pages.filter((p) => p.error);
  if (failed.length === pages.length) throw new Error(failed[0].error);
  const items = pages.filter((p) => !p.error).flat().map((x) => ({
    via: 'Bing News',
    source: x.source || hostOf(realUrl(x.link)),
    title: x.title,
    summary: x.description,
    url: realUrl(x.link),
    publishedAt: x.pubDate,
  }));
  return { items };
}

async function bbcFeeds(ctx) {
  const lists = await Promise.all(['home', 'away'].map(async (side) => {
    const name = ctx.teams[side].name;
    const slug = cfg.bbcSlugs[name] || name.toLowerCase().replace(/&/g, 'and').replace(/[.']/g, '').replace(/\s+/g, '-');
    const items = parseRss(await getText(`https://feeds.bbci.co.uk/sport/football/teams/${slug}/rss.xml`, ctx));
    return items.map((x) => ({
      via: 'BBC Sport',
      source: 'BBC Sport',
      title: x.title,
      summary: x.description,
      url: x.link.replace(/\?.*$/, ''),
      publishedAt: x.pubDate,
      video: /\/videos?\//.test(x.link),
      side,
    }));
  }));
  return { items: lists.flat() };
}

function espnLeague(ctx) {
  const c = (comps.COMPETITIONS || []).find((x) => x.id === ctx.match.comp);
  if (!c || !c.espn) throw new Error(`okänd tävling ${ctx.match.comp}`);
  return c.espn;
}

// Matchsidan hos ESPN: lagens id, arenans stad, ev. förhandsartikel och
// ligans nyheter (de som rör något av lagen tas med).
async function espnSummary(ctx) {
  const league = espnLeague(ctx);
  const j = await getJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${encodeURIComponent(ctx.match.id)}`, ctx);
  const comp = j.header && j.header.competitions && j.header.competitions[0];
  const teamIds = {};
  for (const c of (comp && comp.competitors) || []) teamIds[c.homeAway] = c.team && c.team.id;
  const venue = j.gameInfo && j.gameInfo.venue;
  const city = venue && venue.address && venue.address.city;
  const items = [];
  if (j.article && j.article.headline) items.push(espnItem(j.article, { preview: true }));
  for (const a of (j.news && j.news.articles) || []) {
    const cats = (a.categories || []).filter((c) => c.type === 'team').map((c) => String(c.teamId || (c.team && c.team.id)));
    if (cats.includes(String(teamIds.home)) || cats.includes(String(teamIds.away))) items.push(espnItem(a, { teams: cats.length }));
  }
  return { items, teamIds: teamIds.home && teamIds.away ? teamIds : null, league, city: city || null };
}

async function espnTeamNews(ctx, info) {
  const lists = await Promise.all(['home', 'away'].map(async (side) => {
    const j = await getJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${info.league}/news?team=${info.teamIds[side]}&limit=20`, ctx);
    return (j.articles || []).map((a) => espnItem(a, { side, teams: (a.categories || []).filter((c) => c.type === 'team').length }));
  }));
  return { items: lists.flat() };
}

function espnItem(a, extra = {}) {
  const web = a.links && a.links.web && a.links.web.href;
  return {
    via: 'ESPN',
    source: 'ESPN',
    title: a.headline,
    summary: a.description || null,
    url: web || null,
    publishedAt: a.published || a.lastModified,
    espnId: a.id || null,
    video: a.type === 'Media',
    roundup: extra.teams > 4,
    preview: Boolean(extra.preview),
    side: extra.side || null,
  };
}

// Väder i arenans stad: avsparkstimmen och timmen efter.
async function weatherAt(ctx, city) {
  if (!city) throw new Error('arenans stad är okänd');
  const ko = new Date(ctx.match.kickoff);
  if (ko.getTime() - ctx.now.getTime() > 16 * DAY) throw new Error('prognosen finns först 16 dagar före avspark');
  const geo = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&countryCode=GB`, ctx);
  const place = (geo.results || [])[0];
  if (!place) throw new Error(`hittade inte ${city}`);
  const day = ko.toISOString().slice(0, 10);
  const hourly = 'temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code';
  const f = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&hourly=${hourly}&wind_speed_unit=ms&timezone=GMT&start_date=${day}&end_date=${day}`, ctx);
  const h = f.hourly || {};
  const i = (h.time || []).indexOf(`${day}T${String(ko.getUTCHours()).padStart(2, '0')}:00`);
  if (i < 0) throw new Error('avsparkstimmen saknas i prognosen');
  const span = [i, Math.min(i + 1, h.time.length - 1)];
  const max = (k) => Math.max(...span.map((j) => h[k][j]));
  return {
    place: place.name,
    at: ctx.match.kickoff,
    tempC: h.temperature_2m[i],
    precipMm: Math.round((h.precipitation[span[0]] + (span[1] !== span[0] ? h.precipitation[span[1]] : 0)) * 10) / 10,
    precipProb: max('precipitation_probability'),
    windMs: max('wind_speed_10m'),
    gustMs: max('wind_gusts_10m'),
    code: h.weather_code[i],
    source: 'Open-Meteo',
  };
}

// ---------- urval ----------

const KIND = [
  ['förhandsartikel', /\b(preview|prediction|predicted|team news|line-?ups?|starting xi|xi to face|ahead of|clash|showdown|reasons why|what to expect|things to know|key battles?)\b/i],
  ['skador och trupp', /\b(injur\w*|fitness|ruled out|doubt\w*|sidelined|suspen\w*|ban(?:ned)?|red card|available|returns?|setback|surgery|squad)\b/i],
  ['tränare och klubb', /\b(press conference|presser|says|said|admits|insists|reveals|warns|boss|manager|head coach|coach)\b/i],
  ['matchrapport', /\b(report|ratings|recap|highlights|beat|beaten|draw|drew|win over|defeat|thrash\w*|fight back)\b/i],
];

function kindOf(text) {
  for (const [k, re] of KIND) if (re.test(text)) return k;
  return 'nyhet';
}

function pick(candidates, ctx) {
  const seen = new Map();
  for (const c of candidates) {
    if (!c.title || !c.publishedAt) continue;
    const t = Date.parse(c.publishedAt);
    if (!Number.isFinite(t) || t < ctx.from.getTime() || t > ctx.to.getTime()) continue;
    const url = c.url || '';
    if (cfg.excludeTitle.test(c.title) || cfg.excludeUrl.test(url) || domainIn(url, cfg.excludeDomains)) continue;
    const text = `${c.title} ${c.summary || ''}`;
    const teams = teamsIn(text, ctx);
    // ESPN och BBC är redan per lag; Bing-träffar måste nämna något av lagen.
    if (!teams.length && c.side) teams.push(c.side);
    if (!teams.length) continue;
    let kind = c.preview ? 'förhandsartikel' : kindOf(text);
    // En förhandsartikel som bara nämner det ena laget gäller oftast lagets
    // förra match – den säger något om truppen, men är ingen förhandsartikel
    // till den här.
    const other = kind === 'förhandsartikel' && teams.length < 2 && !c.preview;
    if (other) kind = 'skador och trupp';
    let score = teams.length === 2 ? 4 : 1;
    if (kind === 'förhandsartikel') score += 4;
    else if (kind === 'skador och trupp') score += other ? 2 : 3;
    else if (kind === 'tränare och klubb') score += 2;
    else if (kind === 'matchrapport') score += 1;
    if (ctx.to.getTime() - t < 3 * DAY) score += 1;
    if (c.roundup) score -= 2;
    if (c.video) score -= 1;
    const item = { ...c, publishedAt: new Date(t).toISOString(), teams: teams.map((s) => ctx.teams[s].name), kind, score };
    // Samma artikel från flera källor eller frågor: behåll den bästa.
    const k = titleKey(c.title);
    const prev = seen.get(k) || (url && [...seen.values()].find((x) => x.url === url));
    if (!prev || prev.score < score) {
      if (prev) seen.delete(titleKey(prev.title));
      seen.set(k, item);
    }
  }
  const order = (a, b) => b.score - a.score || Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  // Artiklar om bara det ena laget får högst halva platserna per lag, så att
  // en storklubb inte tränger undan motståndaren. Blir det platser över fylls
  // de ändå.
  const cap = Math.ceil(cfg.maxItems / 2);
  const per = {};
  const first = [];
  const rest = [];
  for (const it of [...seen.values()].sort(order)) {
    const solo = it.teams.length === 1 ? it.teams[0] : null;
    if (solo && (per[solo] || 0) >= cap) rest.push(it);
    else {
      if (solo) per[solo] = (per[solo] || 0) + 1;
      first.push(it);
    }
  }
  return [...first, ...rest].slice(0, cfg.maxItems).sort(order);
}

const titleKey = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 70);

function publicItem(it) {
  const out = { source: it.source, via: it.via, title: it.title, summary: it.summary || null, url: it.url, publishedAt: it.publishedAt, teams: it.teams, kind: it.kind };
  if (it.text) out.text = it.text;
  return out;
}

// ---------- artikeltext ----------

// Texten hämtas för de högst rankade artiklarna: först de som gäller båda
// lagen, sedan varannan för vardera laget. Några extra försöks samtidigt, så
// att en sida som inte går att läsa inte lämnar en lucka; av dem som lyckas
// behålls de maxBodies första.
async function fetchBodies(items, ctx) {
  const ok = items.filter((it) => !it.video && it.url && !domainIn(it.url, cfg.noBody));
  const solo = (name) => ok.filter((it) => it.teams.length === 1 && it.teams[0] === name);
  const [h, a] = [solo(ctx.teams.home.name), solo(ctx.teams.away.name)];
  const order = ok.filter((it) => it.teams.length === 2);
  for (let i = 0; i < Math.max(h.length, a.length); i++) order.push(...[h[i], a[i]].filter(Boolean));
  const todo = order.slice(0, cfg.maxBodies + 4);
  const texts = await Promise.all(todo.map(async (it) => {
    try {
      const text = await bodyOf(it, ctx);
      const clean = text && cleanBody(text);
      return clean && clean.length > 200 ? clip(clean, cfg.bodyChars) : null;
    } catch {
      // Utan text återstår rubrik och ingress – det räcker som datapunkt.
      return null;
    }
  }));
  let kept = 0;
  todo.forEach((it, i) => {
    if (texts[i] && kept < cfg.maxBodies) {
      it.text = texts[i];
      kept++;
    }
  });
}

async function bodyOf(it, ctx) {
  const url = it.url;
  // MSN återpublicerar lokaltidningar; sidan byggs i webbläsaren, men
  // innehållet finns som JSON.
  const msn = url.match(/^https?:\/\/(?:www\.)?msn\.com\/.*\/ar-(AA[\w]+)/);
  if (msn) {
    const j = await getJson(`https://assets.msn.com/content/view/v2/Detail/en-gb/${msn[1]}`, ctx);
    if (j.provider && j.provider.name && it.source.endsWith(' on MSN')) it.source = j.provider.name;
    if (j.sourceHref) it.url = j.sourceHref;
    return textOfHtml(j.body || '');
  }
  const espn = url.match(/espn\.[a-z.]+\/.*\/story\/_\/id\/(\d+)/);
  if (espn || it.espnId) {
    const j = await getJson(`https://content.core.api.espn.com/v1/sports/news/${espn ? espn[1] : it.espnId}`, ctx);
    const h = j.headlines && j.headlines[0];
    return h && h.story ? textOfHtml(h.story) : null;
  }
  return articleText(await getText(url, ctx));
}

// Brödtexten ur en artikelsida: JSON-LD (articleBody) om den finns, annars
// styckena i <article> (eller hela sidan) efter att menyer, skript och annat
// skräp tagits bort.
export function articleText(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = findKey(tryJson(m[1]), 'articleBody');
    if (typeof body === 'string' && body.length > 300) return squash(decode(body.replace(/<[^>]+>/g, ' ')));
  }
  const page = html.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|figure|iframe|button)\b[\s\S]*?<\/\1>/gi, ' ');
  const paras = (h) => [...h.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => squash(decode(m[1].replace(/<[^>]+>/g, ' '))).replace(/\s+/g, ' '))
    .filter((p) => p.length >= 60 && / \S+ /.test(p) && !/[{}]|^(advertisement|read more|sign up|subscribe)/i.test(p))
    .join('\n');
  // Största <article> först; räcker den inte (t.ex. bara en ingress) tas
  // styckena på hela sidan.
  const art = [...page.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((m) => m[0]).sort((a, b) => b.length - a.length)[0];
  const fromArt = art ? paras(art) : '';
  return fromArt.length >= 300 ? fromArt : paras(page);
}

// Rader som inte hör hemma i underlaget: bylines och tidsstämplar, och
// odds- och spelrader (sajten har egna marknadsdata och ger inga spelråd).
const JUNK_LINE = /^(by\b.{0,60}\||last updated|published:)|\b(odds|sky bet|bet365|paddy power|william hill|betfair|betvictor|ladbrokes|coral|bookmakers?|bet builder|free bets?|acca)\b|^\W*$/i;

function cleanBody(text) {
  return text.split('\n').map((x) => x.trim()).filter((x) => x.length > 25 && !JUNK_LINE.test(x)).join('\n');
}

function textOfHtml(s) {
  return s
    .split(/<\/(?:p|h\d|li)>/i)
    .map((x) => squash(decode(x.replace(/<[^>]+>/g, ' '))))
    .filter((x) => x.length > 30)
    .join('\n');
}

function clip(s, n) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('."'));
  return `${cut.slice(0, end > n * 0.6 ? end + 1 : n).trim()} …`;
}

// ---------- väder i text ----------

const WMO = {
  0: 'klart', 1: 'mestadels klart', 2: 'halvklart', 3: 'mulet', 45: 'dimma', 48: 'underkylld dimma',
  51: 'lätt duggregn', 53: 'duggregn', 55: 'kraftigt duggregn', 56: 'underkylt duggregn', 57: 'underkylt duggregn',
  61: 'lätt regn', 63: 'regn', 65: 'kraftigt regn', 66: 'underkylt regn', 67: 'underkylt regn',
  71: 'lätt snöfall', 73: 'snöfall', 75: 'kraftigt snöfall', 77: 'kornsnö',
  80: 'lätta regnskurar', 81: 'regnskurar', 82: 'kraftiga regnskurar', 85: 'snöbyar', 86: 'kraftiga snöbyar',
  95: 'åska', 96: 'åska med hagel', 99: 'åska med kraftigt hagel',
};

function weatherText(w) {
  if (!w || w.unknown) return `okänt – ${(w && w.reason) || 'ingen väderprognos'}`;
  const n = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  return {
    plats: w.place,
    vid: `avspark ${fDay.format(new Date(w.at))} svensk tid`,
    väder: WMO[w.code] || 'okänt',
    temperatur: `${Math.round(w.tempC)} °C`,
    nederbörd: `${n(w.precipMm)} mm under de 2 första timmarna, risk ${w.precipProb} %`,
    vind: `${Math.round(w.windMs)} m/s, byar upp till ${Math.round(w.gustMs)} m/s`,
    källa: 'Open-Meteo',
  };
}

// ---------- RSS och HTTP ----------

export function parseRss(xml) {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => {
    const it = m[0];
    const tag = (name) => {
      const x = it.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
      return x ? squash(decode(x[1].replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '').replace(/<[^>]+>/g, ' '))) : null;
    };
    return { title: tag('title'), link: tag('link') || '', description: tag('description'), pubDate: tag('pubDate'), source: tag('News:Source') || tag('source') };
  });
}

// Bing länkar via sin klickräknare; den riktiga adressen står i url=.
function realUrl(link) {
  try {
    const u = new URL(link);
    if (/(^|\.)bing\.com$/.test(u.hostname) && u.searchParams.get('url')) return u.searchParams.get('url');
  } catch {
    // ingen giltig adress – lämna som den är
  }
  return link;
}

async function getText(url, ctx) {
  const res = await ctx.fetch(url, {
    headers: { 'User-Agent': cfg.userAgent, Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-GB,en;q=0.9' },
    signal: AbortSignal.timeout(cfg.timeoutMs),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} från ${hostOf(url)}`);
  const text = await res.text();
  return text.length > cfg.maxPageBytes ? text.slice(0, cfg.maxPageBytes) : text;
}

async function getJson(url, ctx) {
  const text = await getText(url, ctx);
  const j = tryJson(text);
  if (j == null) throw new Error(`oväntat svar (inte JSON) från ${hostOf(url)}`);
  return j;
}

async function run(name, fn) {
  try {
    return { name, value: await fn() };
  } catch (err) {
    const msg = err && err.name === 'TimeoutError' ? 'svarade inte i tid' : (err && err.message) || String(err);
    return { name, error: /fetch failed|ENOTFOUND|ECONNREFUSED/i.test(msg) ? 'gick inte att nå' : msg };
  }
}

function skip(name, error = null) {
  return Promise.resolve(error ? { name, error } : { name, skipped: true });
}

async function safely(fn) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ---------- småhjälp ----------

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'okänd källa';
  }
}

function domainIn(url, list) {
  const h = hostOf(url);
  return list.some((d) => h === d || h.endsWith(`.${d}`));
}

function tryJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function findKey(o, key) {
  const stack = [o];
  while (stack.length) {
    const x = stack.pop();
    if (Array.isArray(x)) stack.push(...x);
    else if (x && typeof x === 'object') {
      if (key in x) return x[key];
      stack.push(...Object.values(x));
    }
  }
  return null;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', pound: '£', euro: '€' };

function decode(s) {
  // Två varv: Bing kodar ibland en redan kodad text (&amp;#39;).
  let out = s;
  for (let i = 0; i < 2; i++) {
    out = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
      }
      return ENT[e.toLowerCase()] ?? m;
    });
  }
  return out;
}

const squash = (s) => s.replace(/[ \t\r\f\v ]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
