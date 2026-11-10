// Lagets supporterforum till tidningen inför omgången (config/forum.js): läs de mest aktuella
// trådarna på forumets tavla, dela upp dem i inlägg (vem som skrev och när) och låt Claude Code
// ta ut det intressanta inför matchen. Körs av scripts/tidning/poddar.mjs på iMacen, i samma
// jobb som supporterpoddarna, och uppgifterna hamnar på samma informationssidor.
//
// Forumen läses som en vanlig läsare gör: några sidor per lag och natt, med ett ärligt namn i
// förfrågan och med hänsyn till robots.txt. Ett forum som spärrar sådant som inte är en
// webbläsare (403, Cloudflares kontroll, inloggning) räknas som oläsligt och hoppas över; det
// görs inga försök att ta sig förbi spärren.
//
// Varje uppgift måste ha ett citat som står ordagrant i ett av inläggen, och vem som skrev det
// tas ur inlägget, inte ur Claudes svar. Inläggen stannar i mappen utanför repot.

import crypto from 'node:crypto';
import fc from '../../config/forum.js';
import { jsonOf } from './kontroller.mjs';
import { claudeSvar } from './claude.mjs';
import { namnen, citatStar } from './poddar.mjs';

const DAG = 86400000;
const UA = 'Matchfixarna/1.0 (forumlasare)';
const nowFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const tidFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const ren = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const antalOrd = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const hash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);

// ---------- hämtningen ----------

export class Sparrad extends Error {}

// Spärrar som inte är något fel hos oss: en sådan sida läses inte, och forumet räknas som oläsligt.
// (Cloudflares passiva skript, /cdn-cgi/challenge-platform/…, finns på många vanliga sidor och är ingen spärr.)
const SPARR_RE = /cf-chl-|_cf_chl_opt|<title>\s*(?:just a moment|attention required|access denied|login|log in|sign in)\b|id="challenge-form"/i;

export async function hamtaSida(url, { timeoutMs = 30000, fetchImpl = globalThis.fetch } = {}) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'en-GB,en;q=0.8' }, redirect: 'follow' });
  if ([401, 403, 429, 503].includes(res.status)) throw new Sparrad(`HTTP ${res.status}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (SPARR_RE.test(html.slice(0, 20000)) || (html.length < 15000 && /captcha/i.test(html))) throw new Sparrad('sidan kräver en webbläsare eller inloggning');
  return { url: res.url || url, html };
}

// Vi läser som en användarstyrd AI-läsare (Anthropics Claude-User): de reglerna gäller oss, och säger
// forumet nej till AI-assistenters läsning (Claude-User, ChatGPT-User, Perplexity-User) eller till
// AI-svar (Content-Signal: ai-input=no) läses det inte alls. Spärrar mot AI-träning (ClaudeBot,
// GPTBot, CCBot …) gäller inte oss: inget tränas, och bara korta översatta citat trycks.
const VARA_AGENTER = ['matchfixarna', 'claude-user'];
const AI_LASARE = ['claude-user', 'chatgpt-user', 'perplexity-user'];

// robots.txt: reglerna för alla (*) och för oss. → (url) => true om sidan får läsas.
export function robotsRegler(txt) {
  const grupper = [];
  let g = null;
  let iAgenter = false;
  for (const rad0 of String(txt || '').split(/\r?\n/)) {
    const rad = rad0.replace(/#.*/, '').trim();
    const m = rad.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, falt, v] = [m[0], m[1].toLowerCase(), m[2].trim()];
    if (falt === 'user-agent') {
      if (!iAgenter) { g = { agenter: [], regler: [] }; grupper.push(g); }
      g.agenter.push(v.toLowerCase());
      iAgenter = true;
    } else if ((falt === 'allow' || falt === 'disallow') && g) {
      iAgenter = false;
      if (v || falt === 'allow') g.regler.push({ ok: falt === 'allow', monster: v });
    } else iAgenter = false;
  }
  const aiNej = grupper.some((x) => x.agenter.some((a) => AI_LASARE.includes(a.split('/')[0])) && x.regler.some((r) => !r.ok && r.monster === '/') && !x.regler.some((r) => r.ok && r.monster === '/'))
    || /^\s*content-signal\s*:[^\n]*\bai-input\s*=\s*no\b/im.test(String(txt || ''));
  if (aiNej) return () => false;
  const vara = grupper.filter((x) => x.agenter.some((a) => VARA_AGENTER.includes(a.split('/')[0].trim())));
  const regler = (vara.length ? vara : grupper.filter((x) => x.agenter.includes('*'))).flatMap((x) => x.regler);
  const traff = (monster, vag) => {
    const re = new RegExp(`^${monster.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')}`);
    return re.test(vag);
  };
  return (url) => {
    let u;
    try { u = new URL(url); } catch { return false; }
    const vag = `${u.pathname}${u.search}`;
    let bast = null;
    for (const r of regler) {
      if (!r.monster || !traff(r.monster, vag)) continue;
      if (!bast || r.monster.length > bast.monster.length || (r.monster.length === bast.monster.length && r.ok)) bast = r;
    }
    return !bast || bast.ok;
  };
}

const robotsCache = new Map();
async function farLasas(url, opts = {}) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let regel = () => true;
    try {
      const res = await (opts.fetchImpl || globalThis.fetch)(`${u.origin}/robots.txt`, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': UA }, redirect: 'follow' });
      if (res.ok) regel = robotsRegler(await res.text());
    } catch { /* ingen robots.txt: inga regler */ }
    robotsCache.set(u.origin, regel);
  }
  return robotsCache.get(u.origin)(url);
}

async function lasSida(url, opts) {
  if (!(await farLasas(url, opts))) throw new Sparrad('robots.txt säger nej');
  return hamtaSida(url, opts);
}

// ---------- html ----------

const ENTITETER = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', pound: '£', euro: '€', eacute: 'é', copy: '©' };
export const avkoda = (s) => String(s || '')
  .replace(/&#(\d+);/g, (m, n) => { try { return String.fromCodePoint(+n); } catch { return ' '; } })
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return ' '; } })
  .replace(/&([a-z]+);/gi, (m, n) => (ENTITETER[n.toLowerCase()] != null ? ENTITETER[n.toLowerCase()] : m));

const TOMMA = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'param', 'track']);

// Tar bort element (med allt i dem) där bort(tagg, attribut) är sant. Taggarna räknas, så att
// nästlade element tas bort hela.
export function utanElement(html, bort) {
  const s = String(html || '');
  const re = /<(\/?)([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  let ut = '';
  let pos = 0;
  let djup = 0; // > 0: inne i ett element som tas bort
  let tagg = null;
  let m;
  while ((m = re.exec(s))) {
    const [hel, slut, namn0, attr] = m;
    const namn = namn0.toLowerCase();
    if (djup === 0) {
      if (!slut && !TOMMA.has(namn) && !/\/\s*$/.test(attr) && bort(namn, attr)) {
        ut += s.slice(pos, m.index);
        djup = 1;
        tagg = namn;
      }
      continue;
    }
    if (namn !== tagg) continue;
    if (slut) djup--;
    else if (!/\/\s*$/.test(attr)) djup++;
    if (djup === 0) pos = m.index + hel.length;
  }
  return djup === 0 ? ut + s.slice(pos) : ut;
}

const BRUS_TAGG = new Set(['script', 'style', 'noscript', 'svg', 'template', 'button', 'select', 'textarea', 'form', 'iframe', 'video', 'audio', 'head', 'nav', 'footer', 'menu', 'aside']);
// Citat ur andra inlägg, signaturer och knappar: inget av det är inläggets egna ord.
const BRUS_KLASS = /\b(?:bbCodeBlock--quote|bbCodeQuote|quote(?:header|footer|box|container|wrap|_container|content)?|bbc_standard_quote|bbcode_quote|bbcode_container|ipsQuote\w*|signature\w*|message-signature|memberSignature|message-footer|message-attribution\w*|reactionsBar|likesBar|ipsReact\w*|ipsComment_controls|ipsItemControls|post-buttons|postprofile|back2top|moderatorbar|under_message|reportlinks|quickbuttons|Reactions|editedBy|message-lastEdit|ipsType_reset ipsType_medium ipsType_light)\b/;
const BRUS_ROLL = /data-role="(?:memberSignature|commentControls|reactionList)"/;

// Html till läsbar text, med radbrytningar där sidan bryter. Tiderna står kvar som [ÅÅÅÅ-MM-DD tt:mm].
export function tillText(html) {
  let s = utanElement(html, (namn, attr) => BRUS_TAGG.has(namn) || namn === 'blockquote' || BRUS_ROLL.test(attr) || (/\bclass=["']([^"']*)["']/i.test(attr) && BRUS_KLASS.test(attr.match(/\bclass=["']([^"']*)["']/i)[1])));
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<time\b[^>]*\bdatetime=["']([^"']+)["'][^>]*>[\s\S]*?<\/time>/gi, (m, d) => { const t = Date.parse(d); return Number.isFinite(t) ? ` [${tidFmt.format(new Date(t))}] ` : ' '; })
    .replace(/<img\b[^>]*\balt=["']([^"']{1,8})["'][^>]*>/gi, ' $1 ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|ul|ol|table|section|article|header|aside|dd|dt)>/gi, '\n')
    .replace(/<(?:p|div|li|tr|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return avkoda(s).split('\n').map((r) => r.replace(/[ \t\u00a0]+/g, ' ').trim()).filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n');
}

// ---------- trådarna ----------

// En adress till en tråd → {nyckel, slag: 'forsta' | 'sista' | 'sida', nr}. nyckel är trådens
// id hos motorn; slag 'sista' är länken till trådens senaste inlägg och nr sidans nummer (eller
// förskjutning, för phpBB och SMF). null för det som inte är en tråd.
export function tradAdress(href) {
  let u;
  try { u = new URL(href); } catch { return null; }
  let v = decodeURIComponent(u.pathname);
  let q = u.search;
  let m;
  // XenForo utan vänliga adresser: index.php?threads/titel.123/page-4
  if (/\/index\.php$/.test(v) && (m = q.match(/^\?((?:threads|forums)\/[^&]*)(.*)$/))) { v = `${v.replace(/index\.php$/, '')}${decodeURIComponent(m[1])}`; q = m[2].replace(/^&/, '?'); }
  // Discourse: /t/titel/123 (/45 är inlägg 45)
  if ((m = v.match(/^(?:\/[^/]+)*\/t\/[^/]+\/(\d+)(?:\/(\d+))?\/?$/))) return m[2] ? { nyckel: `d${m[1]}`, slag: 'sista', nr: +m[2] } : { nyckel: `d${m[1]}`, slag: 'forsta' };
  // ProBoards: /thread/123/titel (?page=4); /threads/recent/123 och /post/567/thread är senaste inlägget
  if ((m = v.match(/\/threads\/recent\/(\d+)\/?$/))) return { nyckel: `b${m[1]}`, slag: 'sista' };
  if (/\/post\/\d+\/thread\/?$/.test(v)) return { nyckel: null, slag: 'sista' };
  if ((m = v.match(/\/thread\/(\d+)(?:\/[^/]*)?\/?$/))) {
    const p = q.match(/[?&]page=(\d+)/);
    return p && +p[1] > 1 ? { nyckel: `b${m[1]}`, slag: 'sida', nr: +p[1] } : { nyckel: `b${m[1]}`, slag: 'forsta' };
  }
  // Forumotion: /t123-titel, /t123p40-titel (förskjutning)
  if ((m = v.match(/^\/t(\d+)(?:p(\d+))?-[^/]*$/))) return m[2] && +m[2] > 0 ? { nyckel: `o${m[1]}`, slag: 'sida', nr: +m[2] } : { nyckel: `o${m[1]}`, slag: 'forsta' };
  // FansNetwork och TWTD: /forum/123/titel/, /forum/123/page:3/, /forum/123/567/page:3/ (inlägg 567)
  if ((m = v.match(/\/forum\/(\d{3,})\/(.*)$/))) {
    const r = m[2];
    if (/^\d+\//.test(r)) return { nyckel: `w${m[1]}`, slag: 'sista' };
    const p = r.match(/^page:(\d+)/);
    if (p) return +p[1] > 1 ? { nyckel: `w${m[1]}`, slag: 'sida', nr: +p[1] } : { nyckel: `w${m[1]}`, slag: 'forsta' };
    return { nyckel: `w${m[1]}`, slag: 'forsta' };
  }
  // The Fishy: ?m-123/ (s-10/ är förskjutning, s-all/ hela tråden)
  if ((m = q.match(/^\?m-(\d+)\/(?:s-(\d+)\/)?$/))) return m[2] && +m[2] > 0 ? { nyckel: `f${m[1]}`, slag: 'sida', nr: +m[2] } : { nyckel: `f${m[1]}`, slag: 'forsta' };
  // XenForo: /threads/titel.123/ (page-4, post-567, latest, unread)
  if ((m = v.match(/\/threads\/(?:[^/]*\.)?(\d+)\/?(.*)$/)) && !/^\d+-/.test(v.split('/threads/')[1])) {
    const r = m[2];
    if (/^(?:latest|unread|post-\d+)/.test(r) || /\bpost-\d+/.test(r)) return { nyckel: `x${m[1]}`, slag: 'sista' };
    const p = r.match(/^page-(\d+)/);
    if (p) return { nyckel: `x${m[1]}`, slag: 'sida', nr: +p[1] };
    if (r === '' || r === '/') return { nyckel: `x${m[1]}`, slag: 'forsta' };
    return null;
  }
  // Invision: /topic/123-titel/ (page/4/, ?do=getLastComment)
  if ((m = v.match(/\/topic\/(\d+)-[^/]*\/?(.*)$/))) {
    if (/do=(?:getLastComment|getNewComment)/.test(q)) return { nyckel: `i${m[1]}`, slag: 'sista' };
    const p = m[2].match(/^page\/(\d+)/);
    if (p) return { nyckel: `i${m[1]}`, slag: 'sida', nr: +p[1] };
    if ((m[2] === '' || m[2] === '/') && !/\b(?:do|comment|preview)=/.test(q)) return { nyckel: `i${m[1]}`, slag: 'forsta' };
    return null;
  }
  // phpBB: viewtopic.php?t=123 (&start=40); ?p=567#p567 är senaste inlägget
  if (/viewtopic\.php$/.test(v)) {
    const t = q.match(/[?&]t=(\d+)/);
    const p = q.match(/[?&]p=(\d+)/);
    const st = q.match(/[?&]start=(\d+)/);
    if (/[?&]view=(?:unread|newest)/.test(q) && t) return { nyckel: `p${t[1]}`, slag: 'sista' };
    if (p && !t) return { nyckel: null, slag: 'sista' };
    if (t) return st && +st[1] > 0 ? { nyckel: `p${t[1]}`, slag: 'sida', nr: +st[1] } : { nyckel: `p${t[1]}`, slag: 'forsta' };
    return null;
  }
  // SMF: index.php?topic=123.0 (.40, .msg567#new, .new#new)
  if ((m = `${v}${q}`.match(/[?&;]topic=(\d+)(?:\.([a-z]*\d*|new))?/))) {
    const r = m[2] || '0';
    if (/^(?:msg\d+|new)$/.test(r)) return { nyckel: `s${m[1]}`, slag: 'sista' };
    if (/^\d+$/.test(r)) return +r > 0 ? { nyckel: `s${m[1]}`, slag: 'sida', nr: +r } : { nyckel: `s${m[1]}`, slag: 'forsta' };
    return null;
  }
  // vBulletin: showthread.php?t=123 / ?123-titel / /threads/123-titel (/page4, &page=4, goto=newpost)
  if ((m = `${v}${q}`.match(/showthread\.php\?(?:t=)?(\d+)/) || v.match(/\/threads\/(\d+)-[^/]*\/?(.*)$/))) {
    const id = m[1];
    if (/goto=(?:newpost|lastpost)|[?&]p=\d+/.test(q) || /\/(?:newpost|lastpost)$/.test(v)) return { nyckel: `v${id}`, slag: 'sista' };
    const p = `${v}${q}`.match(/(?:[?&]page=|\/page)(\d+)/);
    return p && +p[1] > 1 ? { nyckel: `v${id}`, slag: 'sida', nr: +p[1] } : { nyckel: `v${id}`, slag: 'forsta' };
  }
  // MyBB: showthread.php?tid=123 (&page=4, &action=lastpost)
  if (/showthread\.php$/.test(v) && (m = q.match(/[?&]tid=(\d+)/))) {
    if (/action=(?:lastpost|newpost)/.test(q)) return { nyckel: `m${m[1]}`, slag: 'sista' };
    const p = q.match(/[?&]page=(\d+)/);
    return p && +p[1] > 1 ? { nyckel: `m${m[1]}`, slag: 'sida', nr: +p[1] } : { nyckel: `m${m[1]}`, slag: 'forsta' };
  }
  // Vanilla: /discussion/123/titel (/p4); /discussion/comment/567 är ett inlägg
  if ((m = v.match(/\/discussion\/comment\/\d+/))) return { nyckel: null, slag: 'sista' };
  if ((m = v.match(/\/discussion\/(\d+)(?:\/[^/]*)?(?:\/p(\d+))?\/?$/))) {
    return m[2] && +m[2] > 1 ? { nyckel: `n${m[1]}`, slag: 'sida', nr: +m[2] } : { nyckel: `n${m[1]}`, slag: 'forsta' };
  }
  return null;
}

// En länk som en fullständig adress, utan forumets sessionsnummer (en sådan adress kan vara spärrad).
export function adressAv(href, bas) {
  const u = new URL(avkoda(href).trim(), bas);
  // Bara på strängen: URLSearchParams skulle skriva om frågor som ?m-123/ och ?threads/….
  if (/(?:^\?|[&;])(?:sid|s|PHPSESSID)=/i.test(u.search)) {
    u.search = u.search.replace(/([?&;])(?:sid|s|PHPSESSID)=[0-9a-f]{16,}(?=[&;]|$)/gi, '$1').replace(/[&;]{2,}/g, '&').replace(/\?[&;]/, '?').replace(/[?&;]$/, '');
  }
  return u.href;
}

const LANK_RE = /<a\b([^>]*)\bhref=["']([^"'#][^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi;
const TID_RE = /<time\b[^>]*\bdatetime=["']([^"']+)["']|data-timestamp=["'](\d{10}|\d{13})["']|data-time=["'](\d{10})["']|\btimestamp&quot;:(\d{10})/gi;

// Tavlans trådar i sidans ordning (oftast den senast aktiva först). → [{nyckel, titel, adress, sista, tid}]
export function tradarPaTavlan(html, bas) {
  const tradar = new Map();
  let senast = null;
  const lankar = [];
  for (const m of String(html).matchAll(LANK_RE)) {
    let href;
    try { href = adressAv(m[2], bas); } catch { continue; }
    const a = tradAdress(href);
    if (!a) continue;
    lankar.push({ i: m.index, href, a, text: tillText(m[4]).replace(/\s+/g, ' ').trim(), attr: `${m[1]} ${m[3]}` });
  }
  for (const l of lankar) {
    // phpBB och Vanilla: länken till senaste inlägget har inget tråd-id, och hör till tråden före.
    const nyckel = l.a.nyckel || senast;
    if (!nyckel) continue;
    let t = tradar.get(nyckel);
    if (!t) {
      if (!l.a.nyckel) continue;
      t = { nyckel, titel: '', titelForsta: false, adress: null, sista: null, sidor: 0, i: l.i, tider: [] };
      tradar.set(nyckel, t);
    }
    senast = nyckel;
    if (l.a.slag === 'forsta' && !t.adress) t.adress = l.href;
    if (l.a.slag === 'sista' && !t.sista) t.sista = l.href;
    if (l.a.slag === 'sida') t.sidor = Math.max(t.sidor, l.a.nr);
    // Titeln är den längsta länktexten som inte är ett sidnummer eller en tid.
    const text = l.text.replace(/\[\d{4}-\d\d-\d\d \d\d:\d\d\]/g, '').trim();
    const duger = l.a.slag !== 'sida' && /[a-z]{3}/i.test(text) && !/^(?:go to|last|latest|new|unread|first|next|page|re:)\b/i.test(text) && !(tolkaTid(text) && text.length < 40);
    const forsta = l.a.slag === 'forsta';
    if (duger && ((forsta && !t.titelForsta) || (forsta === t.titelForsta && text.length > t.titel.length))) { t.titel = text; t.titelForsta = forsta; }
  }
  // Tiderna mellan en tråds första länk och nästa tråds: den senaste är trådens senaste inlägg.
  const lista = [...tradar.values()].filter((t) => t.titel && (t.adress || t.sista)).sort((a, b) => a.i - b.i);
  const s = String(html);
  for (let k = 0; k < lista.length; k++) {
    const del = s.slice(lista[k].i, k + 1 < lista.length ? lista[k + 1].i : Math.min(s.length, lista[k].i + 6000));
    for (const m of del.matchAll(TID_RE)) {
      const n = String(m[2] || m[3] || m[4] || '');
      const t = m[1] ? Date.parse(m[1]) : Number(n) * (n.length === 13 ? 1 : 1000);
      if (Number.isFinite(t)) lista[k].tider.push(t);
    }
    if (!lista[k].tider.length) lista[k].tider.push(...tiderIText(tillText(del)).map((t) => Date.parse(t)));
  }
  return lista.map((t) => ({ nyckel: t.nyckel, titel: t.titel.slice(0, 160), adress: t.adress || t.sista, sista: t.sista, sidor: t.sidor || null, tid: t.tider.length ? new Date(Math.max(...t.tider)).toISOString() : null }));
}

// Trådar som inte handlar om laget och matchen: köp och sälj, resor, lekar och annat.
const ANNAT_RE = /\b(?:tickets?|for sale|wanted|swap|lift share|car share|travel(?:ling)?|coach(?:es)? (?:to|from|times)|parking|programmes?|quiz|competition|sweep\w*|raffle|auction|signed|prediction league|predictor|predictions? (?:league|game|comp)|ladders? game|fantasy|fpl|rules|guidelines|forum (?:news|help|feedback|rules)|contact\w*|the site|website|welcome|introduc\w*|ride shar\w*|off.?topic|music|films?|tv|politics|cricket|rugby|darts|golf|snooker|formula|f1|nfl|nba|boxing|ufc|rip|obituar\w*|in memoriam|birthday|christmas|recipe|beer|pubs?|holiday|women|ladies|academy|u21s?|u18s?|under.?(?:21|23|18)s?|youth|podcasts?|ep\.? ?\d+|episode|agm|word association|alphabet game|games?|yesteryear|on this day|history|nostalgia|memories|retro|ex.?players?|fixtures|results|merch\w*|shop|streams?|streaming|charity|fundraising)\b/i;
const VIKTIGT_RE = /\b(?:team news|injur\w*|fitness|line.?ups?|starting|xi|eleven|team sheet|teamsheet|preview|squad|manager|head coach|gaffer|sack\w*|board|owners?|takeover|chairman|embargo|protest|fans|loan|signing|contract|tactics|formation|keeper|goalkeeper|captain|v |vs\.?|versus)\b/i;
const MATCH_RE = /\b(?:match ?(?:day|thread)|pre.?match|post.?match|player ratings|ratings|man of the match|motm)\b/i;

// Tavlans trådar inför matchen, de bästa först. Tråden om just den här matchen (motståndaren
// i rubriken) går före allt; sedan det som är aktivt nu och har en rubrik om laget.
export function valjTradar(tradar, { mot = null, now = Date.now(), dagar = fc.dagar } = {}) {
  const motNamn = mot ? namnen(mot).map(ren).filter((n) => n.length >= 3) : [];
  const ut = [];
  tradar.forEach((t, i) => {
    if (t.tid && now - Date.parse(t.tid) > dagar * DAG) return;
    const titel = ` ${ren(t.titel)} `;
    const harMot = motNamn.some((n) => titel.includes(` ${n} `));
    if (!harMot && ANNAT_RE.test(t.titel)) return;
    let p = 10 - Math.min(i, 30) * 0.4;
    if (harMot) p += 9;
    if (MATCH_RE.test(t.titel)) p += harMot ? 3 : 1;
    if (VIKTIGT_RE.test(t.titel)) p += 3;
    if (t.tid && now - Date.parse(t.tid) < 2 * DAG) p += 2;
    if (!t.tid) p -= 1;
    ut.push({ ...t, p });
  });
  return ut.sort((a, b) => b.p - a.p);
}

// ---------- inläggen ----------

const MANAD = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// En tid som forumet skriver den → ISO (brittisk tid räknas som UTC, det räcker för att se
// hur gammalt ett inlägg är). "1794213191000", "Nov 9, 2026 8:33 GMT", "November 9, 2026, 2:04pm",
// "Wed Sep 02 2026, 00:33", "08:02 - Jun 11", "Today at 09:14:00 pm". → ISO eller null
export function tolkaTid(text, now = Date.now()) {
  const t = String(text || '').trim();
  if (/^\d{13}$/.test(t)) return new Date(+t).toISOString();
  if (/^\d{10}$/.test(t)) return new Date(+t * 1000).toISOString();
  if (/^\d{4}-\d\d-\d\dT/.test(t) && Number.isFinite(Date.parse(t))) return new Date(Date.parse(t)).toISOString();
  const kl = t.match(/\b(\d{1,2}):(\d\d)(?::\d\d)?\s*([ap]\.?m\.?)?/i);
  let h = kl ? +kl[1] : 12;
  if (kl && kl[3] && /p/i.test(kl[3]) && h < 12) h += 12;
  if (kl && kl[3] && /a/i.test(kl[3]) && h === 12) h = 0;
  const min = kl ? +kl[2] : 0;
  const idag = new Date(now);
  if (/\b(?:today|yesterday)\b/i.test(t)) {
    const d = Date.UTC(idag.getUTCFullYear(), idag.getUTCMonth(), idag.getUTCDate(), h, min) - (/yesterday/i.test(t) ? 86400000 : 0);
    return new Date(d).toISOString();
  }
  const m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?(?:\s+(\d{4}))?/i)
    || t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?(?:\s+(\d{4}))?/i);
  if (!m) return null;
  const dagForst = /^\d/.test(m[1]);
  const dag = +(dagForst ? m[1] : m[2]);
  const man = MANAD[(dagForst ? m[2] : m[1]).slice(0, 3).toLowerCase()];
  let ar = m[3] ? +m[3] : (t.match(/\b(20\d\d)\b/) || [])[1] ? +t.match(/\b(20\d\d)\b/)[1] : idag.getUTCFullYear();
  let d = Date.UTC(ar, man, dag, h, min);
  // Utan år: ett datum i framtiden är förra årets.
  if (!m[3] && !/\b20\d\d\b/.test(t) && d > now + 2 * 86400000) d = Date.UTC(--ar, man, dag, h, min);
  return Number.isFinite(d) ? new Date(d).toISOString() : null;
}

// Tider som står som text ("Tue Nov 10, 2026 7:00 am", "Today at 09:14:00 PM", "9 November 2026"). → [ISO]
const MAN = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
const DATUM_RE = new RegExp(`\\b(?:\\d{1,2}:\\d\\d\\s*-\\s*${MAN}\\s+\\d{1,2}(?:,?\\s+20\\d\\d)?|\\d{1,2}\\s+${MAN}\\s+\\d{1,2}:\\d\\d|(?:today|yesterday)(?:\\s+at)?\\s+\\d{1,2}:\\d\\d(?::\\d\\d)?\\s*(?:[ap]\\.?m\\.?)?|(?:\\d{1,2}(?:st|nd|rd|th)?\\s+${MAN}|${MAN}\\s+\\d{1,2}(?:st|nd|rd|th)?),?\\s+20\\d\\d(?:,?\\s+(?:at\\s+)?\\d{1,2}:\\d\\d(?::\\d\\d)?\\s*(?:[ap]\\.?m\\.?)?)?)`, 'gi');
export function tiderIText(text, now = Date.now()) {
  return [...String(text || '').matchAll(DATUM_RE)].map((m) => tolkaTid(m[0], now)).filter((t) => t && Date.parse(t) <= now + 86400000);
}

// Elementet som börjar vid i (dess öppningstagg) med allt i det, till den tagg som stänger det.
export function elementVid(html, i) {
  const s = String(html);
  const forsta = s.slice(i).match(/^<([a-z][a-z0-9]*)\b/i);
  if (!forsta) return null;
  const tagg = forsta[1].toLowerCase();
  const re = new RegExp(`<(/?)${tagg}\\b[^>]*>`, 'gi');
  re.lastIndex = i;
  let djup = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) djup--;
    else if (!/\/\s*>$/.test(m[0])) djup++;
    if (djup === 0) return s.slice(i, m.index + m[0].length);
  }
  return null;
}

// Motorerna vi känner igen: var ett inlägg börjar (start), vem som skrev det (vem), när (tid:
// sekunder, millisekunder eller text) och elementet som är inläggets egen text (text).
const MOTORER = [
  { namn: 'xenforo', start: /<article\b[^>]*\bclass=["'][^"']*\bmessage--post\b/gi, vem: /\bdata-author=["']([^"']+)["']/, text: /<div\b[^>]*\bclass=["'][^"']*\bbbWrapper\b[^>]*>/i },
  { namn: 'xenforo1', start: /<li\b[^>]*\bid=["']post-\d+["'][^>]*\bclass=["'][^"']*\bmessage\b/gi, vem: /\bdata-author=["']([^"']+)["']/, tid: /class=["']DateTime["'][^>]*\bdata-time=["'](\d{10})["']|<span class=["']DateTime["'] title=["']([^"']+)["']/, text: /<blockquote\b[^>]*\bclass=["'][^"']*\bmessageText\b[^>]*>/i },
  { namn: 'ips', start: /<(?:div|article)\b[^>]*\bdata-quotedata=["']/gi, vem: /&quot;username&quot;:&quot;(.*?)&quot;/, tid: /&quot;timestamp&quot;:(\d{10})/, text: /<div\b[^>]*\bdata-role=["']commentContent["'][^>]*>/i },
  { namn: 'phpbb', start: /<div\b[^>]*\bid=["']p\d+["'][^>]*\bclass=["'][^"']*\bpost\b/gi, vem: /class=["']username(?:-coloured)?["'][^>]*>([^<]+)<|class=["']postprofile-name["'][^>]*>(?:\s*<[^>]+>)*\s*([^<]+)/, tid: /<p class=["']author["'][\s\S]*?(?:&raquo;|»|<\/span>)\s*([^<]{6,60})<|class=["']topic-date["'][^>]*>([^<]{6,60})</, text: /<div\b[^>]*\bclass=["']content["'][^>]*>/i },
  { namn: 'smf', start: /<div\b[^>]*\bclass=["']post_wrapper["']/gi, vem: /<div class=["']poster["']>[\s\S]*?<a\b[^>]*>([^<]+)<\/a>/, tid: /<div class=["']smalltext["']>[\s\S]{0,80}?(?:on:<\/strong>|»)\s*([^<»]{6,60})|\bclass=["']smalltext["']>([^<]{6,60}\d\d:\d\d[^<]{0,12})<\/a>/, text: /<div\b[^>]*\bclass=["']inner["'][^>]*\bid=["']msg_\d+["'][^>]*>|<div\b[^>]*\bid=["']msg_\d+["'][^>]*\bclass=["']inner["'][^>]*>/i },
  { namn: 'proboards', start: /<tr\b[^>]*\bid=["']post-\d+["'][^>]*\bclass=["'][^"']*\bpost\b/gi, vem: /<div class=["']mini-profile["']>\s*<a\b[^>]*>([^<]+)<\/a>/, tid: /\bdata-timestamp=["'](\d{13})["']/, text: /<div\b[^>]*\bclass=["']message["'][^>]*>/i },
  { namn: 'forumotion', start: /<div\b[^>]*\bclass=["']post post--\d+/gi, vem: /class=["']username["'][^>]*>(?:\s*<[^>]+>)*\s*([^<]+)/, tid: /<div\b[^>]*\bclass=["']posthead["'][\s\S]*?<\/a>\s*([^<]{6,60})</, text: /<div\b[^>]*\bclass=["']entry-content["'][^>]*>/i },
  { namn: 'fansnetwork', start: /<a name=["']post\d+["']><\/a>|<table\b[^>]*\bborder-width: 1px 1px 1px 5px/gi, vem: /\/members\/[^"']+["'][^>]*font-weight: bold[^>]*>([^<]+)<|<a\b[^>]*\bhref=["'][^"']*\/members\/[^"']+["'][^>]*>([^<]{2,40})<\/a>/, tid: /(\d{1,2}:\d\d - [A-Z][a-z]{2} \d{1,2}(?:,? \d{4})?)/, text: /<td valign=["']?top["']?>/i },
  { namn: 'fishy', start: /<a id=["']num\d+["']><\/a>/gi, vem: /<strong><a\b[^>]*>([^<]+)<\/a><\/strong>/, tid: /class=["']smalltext didate["']>([^<]+)</, text: /<div\b[^>]*\bid=["']m\d+["'][^>]*>/i },
  { namn: 'vbulletin', start: /<li\b[^>]*\bclass=["'][^"']*\bpostbit(?:legacy|old)?\b|<div\b[^>]*\bid=["']edit\d+["']/gi, vem: /class=["'](?:bigusername|username[^"']*)["'][^>]*>(?:\s*<[^>]+>)*\s*([^<]+)/, tid: /<span class=["']date["']>([^<]+(?:<span class=["']time["']>[^<]+)?)/, text: /<div\b[^>]*\bid=["']post_message_\d+["'][^>]*>/i },
  { namn: 'mybb', start: /<div\b[^>]*\bclass=["']post\b[^"']*["'][^>]*\bid=["']post_\d+["']/gi, vem: /class=["']largetext["'][^>]*>\s*(?:<[^>]+>\s*)*([^<]+)/, tid: /<span class=["']post_date["']>([^<]+)/, text: /<div\b[^>]*\bclass=["']post_body[^"']*["'][^>]*>/i },
  { namn: 'vanilla', start: /<li\b[^>]*\bclass=["'][^"']*\bItem(?:Comment|Discussion)?\b[^"']*["'][^>]*\bid=["'](?:Comment|Discussion)_\d+["']|<li\b[^>]*\bid=["'](?:Comment|Discussion)_\d+["'][^>]*\bclass=["'][^"']*\bItem\b/gi, vem: /class=["']Username[^"']*["'][^>]*>([^<]+)/, text: /<div\b[^>]*\bclass=["']Message userContent[^"']*["'][^>]*>/i },
];
// Om elementet inte går att avgränsa: där inläggets egen text tar slut.
const SLUT_RE = /<(?:footer|form|menu|aside)\b|<\/article>|class=["'][^"']*\b(?:message-footer|message-signature|signature\w*|ipsComment_controls|ipsItemControls|ipsEntry__(?:controls|foot\w*)|postprofile|back2top|moderatorbar|under_message|postfoot|after_content|Reactions|post_controls)\b|data-role=["'](?:memberSignature|commentControls)["']|<div\b[^>]*\bid=["']sig\d+/i;

const ettInlagg = (text, flestTecken) => (text.length > flestTecken ? `${text.slice(0, flestTecken).replace(/\s+\S*$/, '')} …` : text);

// Trådens sida → {motor, inlagg: [{vem, tid, text}]}. Känns motorn inte igen blir det hela
// sidans text som ett enda stycke utan namn.
export function inlaggen(html, { flestTecken = fc.teckenPerInlagg, now = Date.now() } = {}) {
  const s = String(html);
  for (const mo of MOTORER) {
    const starter = [...s.matchAll(mo.start)].map((m) => m.index);
    if (starter.length < 1) continue;
    const inlagg = [];
    for (let k = 0; k < starter.length; k++) {
      const slutDel = k + 1 < starter.length ? starter[k + 1] : Math.min(s.length, starter[k] + 60000);
      const del = s.slice(starter[k], slutDel);
      const t0 = del.search(mo.text);
      if (t0 < 0) continue;
      // Inläggets eget element, så att knappar, signatur och nästa inläggs huvud inte följer med.
      let kropp = elementVid(s, starter[k] + t0);
      // Bara det som står i elementet: det kan självt vara ett citatblock (XenForo 1).
      if (kropp) kropp = kropp.replace(/^<[^>]*>/, '').replace(/<\/[a-z0-9]+>\s*$/i, '');
      if (!kropp || kropp.length > del.length - t0 + 200) {
        kropp = del.slice(t0);
        const slut = kropp.slice(20).search(SLUT_RE);
        if (slut >= 0) kropp = kropp.slice(0, slut + 20).replace(/<[^>]*$/, '');
      }
      const text = tillText(kropp).replace(/\n+/g, '\n').trim();
      if (!text) continue;
      const vemM = del.match(mo.vem);
      const vem = vemM && vemM.slice(1).find(Boolean) ? avkoda(vemM.slice(1).find(Boolean)).replace(/\\u([0-9a-f]{4})/gi, (x, h) => String.fromCharCode(parseInt(h, 16))).replace(/\s+/g, ' ').trim() : null;
      let tid = null;
      const tm = mo.tid && del.match(mo.tid);
      const tt = tm && tm.slice(1).find(Boolean);
      if (tt) tid = tolkaTid(avkoda(tt.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' '), now);
      if (!tid) {
        const ti = del.slice(0, Math.max(t0, 2000)).match(/<time\b[^>]*\bdatetime=["']([^"']+)["']|data-time=["'](\d{10})["']/i);
        const t = ti ? (ti[1] ? Date.parse(ti[1]) : Number(ti[2]) * 1000) : NaN;
        if (Number.isFinite(t)) tid = new Date(t).toISOString();
      }
      if (!tid) tid = tiderIText(tillText(del.slice(0, t0)), now)[0] || null;
      inlagg.push({ vem: vem && vem.length <= 40 ? vem : null, tid, text: ettInlagg(text, flestTecken) });
    }
    if (inlagg.length) return { motor: mo.namn, inlagg };
  }
  const huvud = (s.match(/<main\b[\s\S]*?<\/main>/i) || s.match(/<body\b[\s\S]*<\/body>/i) || [s])[0];
  const text = tillText(huvud);
  return { motor: null, inlagg: text ? [{ vem: null, tid: null, text: text.slice(0, flestTecken * 8) }] : [] };
}

// ---------- Discourse ----------
// Discourse har ett öppet JSON-gränssnitt med samma innehåll som sidorna: tavlan är
// /latest.json (eller kategorins .json) och tråden /t/<id>/<inlägg>.json.

const arDiscourse = (html) => /<meta\b[^>]*name=["']generator["'][^>]*content=["']Discourse/i.test(html);

async function hamtaJson(url, opts = {}) {
  if (!(await farLasas(url, opts))) throw new Sparrad('robots.txt säger nej');
  const res = await (opts.fetchImpl || globalThis.fetch)(url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': UA, accept: 'application/json' }, redirect: 'follow' });
  if ([401, 403, 429, 503].includes(res.status)) throw new Sparrad(`HTTP ${res.status}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function discourseTradar(j, bas) {
  const u = new URL(bas);
  return ((j && j.topic_list && j.topic_list.topics) || []).filter((t) => !t.pinned_globally && !t.archived).map((t) => ({
    nyckel: `d${t.id}`, titel: String(t.title || '').slice(0, 160), adress: `${u.origin}/t/${t.slug}/${t.id}`, sista: null, sidor: t.posts_count || null,
    tid: t.last_posted_at || t.bumped_at || null, discourse: { id: t.id, inlagg: t.highest_post_number || t.posts_count || 1 },
  }));
}

async function lasDiscourseTrad(t, opts) {
  const u = new URL(t.adress);
  const j = await hamtaJson(`${u.origin}/t/${t.discourse.id}/${t.discourse.inlagg}.json`, opts);
  const inlagg = ((j && j.post_stream && j.post_stream.posts) || []).filter((p) => p && p.cooked && !p.hidden)
    .map((p) => ({ vem: p.username || null, tid: p.created_at || null, text: ettInlagg(tillText(p.cooked), fc.teckenPerInlagg) })).filter((p) => p.text);
  return { titel: t.titel, adress: t.adress, motor: 'discourse', inlagg };
}

// Sidorna i tråden som sidan länkar till. → [{nr, adress}] (nr är sidnummer eller förskjutning)
function sidlankar(html, bas, nyckel) {
  const ut = new Map();
  for (const m of String(html).matchAll(LANK_RE)) {
    let href;
    try { href = adressAv(m[2], bas); } catch { continue; }
    const a = tradAdress(href);
    if (a && a.nyckel === nyckel && a.slag === 'sida' && !ut.has(a.nr)) ut.set(a.nr, href);
  }
  return [...ut].map(([nr, adress]) => ({ nr, adress })).sort((a, b) => a.nr - b.nr);
}
// Sidans nummer i tråden: ur sidans kanoniska adress (som har numret också när man kom dit via
// länken till senaste inlägget), annars ur adressen. null om det inte går att se.
function sidansNr(sida) {
  const kanon = (sida.html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i) || sida.html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i) || [])[1];
  for (const u of [kanon && (() => { try { return adressAv(kanon, sida.url); } catch { return null; } })(), sida.url]) {
    const a = u && tradAdress(u);
    if (a && a.slag === 'sida') return a.nr;
    if (a && a.slag === 'forsta') return 0;
  }
  return null;
}
const inlaggsNyckel = (x) => `${x.vem}|${x.tid}|${x.text.slice(0, 80)}`;

// Läser trådens senaste inlägg: sista sidan, och sidan före om den sista är kort.
// → {titel, adress, motor, inlagg: [{vem, tid, text}]}
export async function lasTrad(t, { minstInlagg = fc.minstInlagg, ...opts } = {}) {
  if (t.discourse) return lasDiscourseTrad(t, opts);
  let sida = await lasSida(t.sista || t.adress, opts);
  if (!t.sista) {
    const l = sidlankar(sida.html, sida.url, t.nyckel);
    const nu = sidansNr(sida) || 0;
    const sist = l.filter((x) => x.nr > nu).pop();
    if (sist) sida = await lasSida(sist.adress, opts);
  }
  let { motor, inlagg } = inlaggen(sida.html);
  if (motor && inlagg.length < minstInlagg) {
    const nu = sidansNr(sida);
    const fore = sidlankar(sida.html, sida.url, t.nyckel).filter((x) => nu == null || x.nr < nu).pop();
    if (fore) {
      try {
        const sett = new Set(inlagg.map(inlaggsNyckel));
        inlagg = [...inlaggen((await lasSida(fore.adress, opts)).html).inlagg.filter((x) => !sett.has(inlaggsNyckel(x))), ...inlagg];
      } catch { /* sista sidan räcker */ }
    }
  }
  return { titel: t.titel, adress: t.adress, motor, inlagg };
}

// Tavlans trådar, för alla motorer (Discourse via sitt JSON-gränssnitt).
export async function tavlansTradar(adress, opts = {}) {
  const s = await lasSida(adress, opts);
  if (!arDiscourse(s.html)) return tradarPaTavlan(s.html, s.url);
  const u = new URL(s.url);
  const vag = u.pathname.replace(/\/$/, '') || '/latest';
  return discourseTradar(await hamtaJson(`${u.origin}${vag}.json${u.search}`, opts), s.url);
}

// Läser forumets tavlor och de bästa trådarna inför matchen. forum: {namn, tavlor: [adress]}.
// → {forum, tradar: [{titel, adress, motor, inlagg}], kandidater} Kastar Sparrad om ingen
// tavla går att läsa.
export async function lasForum(forum, { mot = null, now = Date.now(), logg = () => {}, ...opts } = {}) {
  const alla = [];
  let sparr = null;
  for (const adress of forum.tavlor) {
    try {
      for (const t of await tavlansTradar(adress, opts)) if (!alla.some((x) => x.nyckel === t.nyckel)) alla.push(t);
    } catch (err) {
      if (err instanceof Sparrad) sparr = err;
      logg(`  ${forum.namn}: tavlan ${adress} gick inte att läsa (${err.message})`);
    }
  }
  if (!alla.length) throw sparr || new Error('inga trådar på tavlan');
  // De bästa kandidaterna läses tills fc.tradar trådar har något nytt (en tråd med ett par
  // gamla inlägg på sista sidan är inte värd att skicka vidare).
  const val = valjTradar(alla, { mot, now }).slice(0, fc.kandidater);
  const tradar = [];
  for (const t of val) {
    if (tradar.length >= fc.tradar) break;
    try {
      const r = await lasTrad(t, opts);
      // Bara inlägg från de senaste dagarna (de utan tid får följa med; sidan är trådens sista).
      r.inlagg = r.inlagg.filter((x) => !x.tid || now - Date.parse(x.tid) <= fc.dagar * DAG);
      if (r.inlagg.length >= 2 || (r.inlagg.length && r.motor === null)) tradar.push(r);
    } catch (err) {
      logg(`  ${forum.namn}: "${t.titel}" gick inte att läsa (${err.message})`);
    }
  }
  return { forum, tradar, kandidater: alla.length };
}

// Inläggen som de ges till Claude: numrerade genom alla trådar, med vem och när.
// → {text, inlagg: [{nr, vem, tid, text, trad}]}
export function forumText(lasning, { flestTecken = fc.flestTecken } = {}) {
  const inlagg = [];
  const delar = [];
  let langd = 0;
  for (const t of lasning.tradar) {
    const rader = [];
    for (const x of t.inlagg) {
      const nr = inlagg.length + 1;
      const rad = `[${nr}] ${x.vem || 'okänd'}${x.tid ? `, ${tidFmt.format(new Date(x.tid))}` : ''}:\n${x.text}`;
      if (langd + rad.length > flestTecken) break;
      langd += rad.length;
      inlagg.push({ nr, vem: x.vem, tid: x.tid, text: x.text, trad: t.titel });
      rader.push(rad);
    }
    if (rader.length) delar.push(`### Tråden "${t.titel}"\n\n${rader.join('\n\n')}`);
  }
  return { text: delar.join('\n\n'), inlagg };
}

// ---------- urvalet ----------

const TIPS_RE = /\b(spik\w*|\w*gardera\w*|\w*gardering\w*|odds\w*|favorit(?:en|er|erna)?|skräll\w*)\b/i;
const AMNEN = ['trupp', 'elva', 'spel', 'klubb', 'match'];

// Claudes svar → uppgifterna som håller: citatet står i inlägget (eller i exakt ett annat
// inlägg), och den som skrev inlägget står som avsändare. → {rattKlubb, handlarOm, uppgifter, strukna}
export function forumUppgifterAv(content, inlagg) {
  let j;
  try { j = jsonOf(content); } catch { return null; }
  if (!j || !Array.isArray(j.uppgifter)) return null;
  const uppgifter = [];
  let strukna = 0;
  for (const x of j.uppgifter) {
    const t = x && typeof x.t === 'string' ? x.t.trim() : '';
    const s = x && ['b', 'h', 'o'].includes(x.s) ? x.s : 'h';
    const a = x && AMNEN.includes(x.a) ? x.a : 'match';
    const vikt = Math.max(1, Math.min(5, Math.round(Number(x && x.vikt) || 3)));
    const citat = x && typeof x.citat === 'string' ? x.citat.trim() : '';
    let post = inlagg.find((p) => p.nr === Number(x && x.inlagg));
    if (!post || !citatStar(citat, post.text)) {
      const andra = inlagg.filter((p) => citatStar(citat, p.text));
      post = andra.length === 1 ? andra[0] : null;
    }
    if (!t || antalOrd(t) > 65 || TIPS_RE.test(t) || !post) { strukna++; continue; }
    const sagt0 = typeof x.sagt === 'string' ? x.sagt.trim().replace(/^[”"»«'‘’]+|[”"»«'‘’]+$/g, '') : '';
    const sagt = sagt0 && antalOrd(sagt0) >= 4 && antalOrd(sagt0) <= 50 && !TIPS_RE.test(sagt0) ? sagt0 : null;
    uppgifter.push({ a, t, s, inlagg: post.nr, vikt, citat, sagt, vem: sagt ? post.vem : null, tid: post.tid || null, trad: post.trad });
  }
  uppgifter.sort((p, q) => q.vikt - p.vikt);
  return { rattKlubb: j.ratt_klubb !== false, handlarOm: typeof j.handlar_om === 'string' ? j.handlar_om.trim() : null, uppgifter: uppgifter.slice(0, fc.uppgifter), strukna };
}

// Tar ut det intressanta ur forumets inlägg. → {handlarOm, uppgifter, strukna, sekunder, rattKlubb}
export async function taUtForum(lasning, { lag, mot = null, avspark = null, spelare = [], id, now = () => new Date(), claude = claudeSvar } = {}) {
  const { text, inlagg } = forumText(lasning);
  if (!inlagg.length) return { handlarOm: null, uppgifter: [], strukna: 0, sekunder: 0, rattKlubb: true };
  const fraga = [
    `Idag är det ${nowFmt.format(now())}.`,
    `Laget: ${lag}.${mot ? ` Nästa match: mot ${mot}${avspark ? `, ${nowFmt.format(new Date(avspark))}` : ''}.` : ''}`,
    `Forumet: ${lasning.forum.namn}.`,
    spelare.length ? `Spelare i de två lagens trupper (för stavningen): ${spelare.join(', ')}.` : '',
    `\nInläggen:\n\n${text}`,
  ].filter(Boolean).join('\n');
  const r = await claude({ system: fc.urvalPrompt.replace('{flest}', fc.uppgifter).replace('{dagar}', fc.dagar), prompt: fraga, tools: [], model: fc.model, effort: fc.effort, timeoutMs: fc.timeoutMs });
  const u = r.refused ? null : forumUppgifterAv(r.content, inlagg);
  if (!u) throw new Error(r.refused ? 'Claude avböjde' : 'svaret gick inte att läsa');
  u.uppgifter.forEach((x, i) => { x.id = `${id}-${i + 1}`; });
  return { ...u, sekunder: r.seconds };
}

// Läsningens fingeravtryck: samma inlägg som förra natten behöver inte läsas av Claude igen.
export const lasningsNyckel = (lasning) => hash(lasning.tradar.map((t) => t.inlagg.map((x) => `${x.vem}|${x.tid}|${x.text.slice(0, 200)}`).join('\n')).join('\n#\n'));

// Läsningen som den sparas i omgångens fil, bredvid poddavsnitten.
export function forumPost(lasning, u, { id, nyckel, version, now = new Date() }) {
  const tider = lasning.tradar.flatMap((t) => t.inlagg.map((x) => Date.parse(x.tid))).filter(Number.isFinite);
  return {
    id,
    typ: 'forum',
    podd: lasning.forum.namn,
    titel: lasning.tradar.map((t) => t.titel).join(' · ').slice(0, 300),
    datum: (tider.length ? new Date(Math.max(...tider)) : now).toISOString(),
    sida: (lasning.tradar[0] && lasning.tradar[0].adress) || lasning.forum.tavlor[0],
    tradar: lasning.tradar.map((t) => ({ titel: t.titel, adress: t.adress, inlagg: t.inlagg.length })),
    nyckel,
    version,
    uttaget: now.toISOString(),
    handlarOm: u.handlarOm,
    uppgifter: u.uppgifter,
  };
}

// ---------- registret: lagens forum ----------

// Lever forumet och går det att läsa? → {ok, orsak, tradar, senast}
export async function provaForum(forum, { now = Date.now(), ...opts } = {}) {
  const tradar = [];
  for (const adress of forum.tavlor) {
    try {
      tradar.push(...(await tavlansTradar(adress, opts)));
    } catch (err) {
      return { ok: false, orsak: err.message, tradar: 0, senast: null };
    }
  }
  const tider = tradar.map((t) => Date.parse(t.tid)).filter(Number.isFinite);
  const senast = tider.length ? new Date(Math.max(...tider)).toISOString() : null;
  if (tradar.length < 5) return { ok: false, orsak: `bara ${tradar.length} trådar på tavlan`, tradar: tradar.length, senast };
  if (senast && now - Date.parse(senast) > fc.levandeDagar * DAG) return { ok: false, orsak: `inget inlägg på ${fc.levandeDagar} dagar`, tradar: tradar.length, senast };
  return { ok: true, orsak: null, tradar: tradar.length, senast };
}

// Frågar Claude efter forumen för lagen som inte står i config/forum.js. → {lag: {namn, tavlor}}
export async function fragaEfterForum(lagen, { claude = claudeSvar } = {}) {
  const r = await claude({
    system: fc.letaPrompt.replace('{sokningar}', fc.sokningar),
    prompt: `Klubbarna:\n${lagen.map((l) => `- ${l}`).join('\n')}`,
    tools: ['WebSearch'], model: fc.model, effort: fc.letaEffort, timeoutMs: fc.timeoutMs,
  });
  const j = jsonOf(r.content);
  const ut = {};
  for (const lag of lagen) {
    const f = j && j.klubbar && j.klubbar[lag];
    const tavlor = f && Array.isArray(f.tavlor) ? f.tavlor.filter((x) => typeof x === 'string' && /^https?:\/\//.test(x)).slice(0, 2) : [];
    ut[lag] = f && typeof f.namn === 'string' && tavlor.length ? { namn: f.namn.trim(), tavlor } : null;
  }
  return ut;
}

// Ska lagets forum letas upp (igen)? post: registrets rad. kant: lagets rad i config/forum.js.
export function forumSkaLetas(post, now = Date.now(), kant = null) {
  if (!post || !post.kollad) return true;
  if (kant && JSON.stringify(kant) !== JSON.stringify(post.kant || null)) return true;
  return now - Date.parse(post.kollad) > (post.forum ? fc.letaOmDagar.med : fc.letaOmDagar.utan) * DAG;
}
