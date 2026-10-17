'use strict';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
const TIMEOUT_MS = 30000;

async function get(url, headers) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} från ${new URL(url).host}`);
  return res;
}

async function getJson(url, headers) {
  const res = await get(url, headers);
  try {
    return await res.json();
  } catch {
    throw new Error(`oväntat svar (inte JSON) från ${new URL(url).host}`);
  }
}

async function getText(url, headers) {
  return (await get(url, headers)).text();
}

// Kör uppgifter med begränsad samtidighet, i ordning. Fel i en uppgift
// fäller hela körningen (anroparen avgör om delresultat duger).
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

module.exports = { getJson, getText, mapLimit };
