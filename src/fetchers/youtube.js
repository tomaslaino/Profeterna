'use strict';

// YouTube: höjdpunkterna som klubbarna och sändarna själva lägger ut, via
// kanalernas öppna flöden (feeds/videos.xml – de 15 senaste klippen, utan
// nyckel). Kanalerna står i config/youtube.js. Vilken match ett klipp hör
// till avgörs i src/hojdpunkter.js.
//
// Flödet har inga längder och inga landsspärrar. Det enda som kontrolleras
// här är att klippet får visas inuti andra sajter: YouTubes oEmbed svarar 401
// när ägaren stängt av det och 404 när klippet är borttaget eller privat. Är
// klippet spärrat i Sverige märks det först i spelaren, som då tar nästa
// klipp (public/hojdpunkter.js).
//
// Varje körning läser alla flöden, så att inget hinner falla ur de 15
// senaste. Klipp från förra hämtningen behålls hela säsongen.

const { CLUBS, CHANNELS } = require('../../config/youtube');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
const FEED = (id) => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
const OEMBED = (id) => 'https://www.youtube.com/oembed?format=json&url=' +
  encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
const CHANNEL_ID = /^UC[\w-]{22}$/;
// Så många nya klipp kontrolleras per körning; resten nästa gång.
const OEMBED_PER_RUN = 80;

// Sammandrag, inte allt annat klubbarna lägger ut. Damlag, ungdomslag,
// träningsmatcher, EFL Trophy, halvlekar och gamla matcher hör inte till
// någon match i spelprogrammet.
const HIGHLIGHTS = /\bhighlights?\b/i;
const NOT_MATCH = new RegExp('\\b(' + [
  'women', 'wsl', 'lionesses', 'girls', 'u-?\\d\\d', 'under[- ]?\\d\\d', 'academy', 'pl2', 'premier league 2',
  'youth', 'reserves?', 'friendly', 'friendlies', 'pre-?season', 'legends', 'futsal', 'trophy', 'half[- ]time',
  'first half', 'second half', 'classic', 'rewind', 'throwback', 'on this day', 'retro', 'archive', 'season review',
  'best of', 'every goal', 'compilation', 'shorts',
].join('|') + ')\\b', 'i');

const status = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  return { code: res.status, text: res.ok ? await res.text() : '' };
};

const unxml = (s) => String(s)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');

// Flödets klipp: { id, title, pub, short }.
function entries(xml) {
  const out = [];
  for (const [, e] of String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const tag = (t) => {
      const m = e.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`));
      return m ? unxml(m[1]).trim() : null;
    };
    const href = (e.match(/<link rel="alternate" href="([^"]+)"/) || [])[1] || '';
    out.push({ id: tag('yt:videoId'), title: tag('title'), pub: tag('published'), short: href.includes('/shorts/') });
  }
  return out.filter((x) => x.id && x.title && x.pub);
}

const isHighlights = (title) => HIGHLIGHTS.test(title) && !NOT_MATCH.test(title);

// Kanalens id ur kanalsidan ("@namn", "user/namn" – kanaler utan id i config).
async function resolveChannel(path) {
  const { code, text } = await status(`https://www.youtube.com/${path}`);
  if (code !== 200) throw new Error(`HTTP ${code}`);
  const m = text.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)
    || text.match(/feeds\/videos\.xml\?channel_id=(UC[\w-]{22})/)
    || text.match(/"externalId":"(UC[\w-]{22})"/);
  if (!m) throw new Error('inget kanal-id på sidan');
  return m[1];
}

async function mapLimit(items, limit, fn) {
  let next = 0;
  const worker = async () => { while (next < items.length) { const i = next++; await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

// Alla kanaler: klubbarna (key = ESPN-namnet) och sändarna (key = config-nyckeln).
function channelList() {
  return [
    ...CHANNELS.map((c) => ({ key: c.key, name: c.name, id: c.id || null, path: c.path || null })),
    ...Object.entries(CLUBS).map(([team, v]) => (CHANNEL_ID.test(v)
      ? { key: team, name: team, id: v, path: null }
      : { key: team, name: team, id: null, path: v })),
  ];
}

// prev = förra hämtningen ({ videos, ids }), since = säsongens första dag.
// Fallerar fler än hälften av flödena fallerar hela hämtningen – cachen
// behåller då förra omgångens klipp.
async function fetchVideos(prev, since) {
  const ids = { ...((prev && prev.ids) || {}) };
  const byId = new Map();
  for (const v of (prev && prev.videos) || []) if (v.pub >= since) byId.set(v.id, v);
  const failed = [];
  const channels = channelList();

  await mapLimit(channels, 6, async (c) => {
    try {
      let id = c.id || ids[c.path];
      if (!id) {
        id = await resolveChannel(c.path);
        ids[c.path] = id;
      }
      const { code, text } = await status(FEED(id));
      if (code !== 200) throw new Error(`HTTP ${code}`);
      for (const e of entries(text)) {
        if (e.short || e.pub < since || !isHighlights(e.title)) continue;
        const have = byId.get(e.id);
        byId.set(e.id, { id: e.id, ch: c.key, title: e.title, pub: e.pub, embed: have ? have.embed : null });
      }
    } catch (err) {
      failed.push(`${c.name}: ${String(err.message || err)}`);
    }
  });
  if (failed.length) console.log(`[youtube] svarade inte: ${failed.join('; ')}`);
  if (failed.length > channels.length / 2) {
    throw new Error(`${failed.length} av ${channels.length} kanaler svarade inte (${failed.slice(0, 3).join('; ')})`);
  }

  // Får klippet visas inuti andra sajter? Nyast först.
  const unchecked = [...byId.values()].filter((v) => v.embed == null)
    .sort((a, b) => b.pub.localeCompare(a.pub)).slice(0, OEMBED_PER_RUN);
  await mapLimit(unchecked, 6, async (v) => {
    try {
      const { code } = await status(OEMBED(v.id));
      if (code === 200) v.embed = true;
      else if (code === 401 || code === 403 || code === 404) v.embed = false;
    } catch {
      // nästa körning
    }
  });

  const videos = [...byId.values()].filter((v) => v.embed !== false)
    .sort((a, b) => b.pub.localeCompare(a.pub));
  return { videos, ids, channels: channels.length, failed, sourceUrl: 'https://www.youtube.com' };
}

module.exports = { fetchVideos, entries, isHighlights };
