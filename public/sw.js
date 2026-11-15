'use strict';

// ---------- sajtens filer sparade mellan publiceringarna ----------
//
// Sajten publiceras om flera gånger i timmen (data var 30:e minut och varje
// ändring i koden), och GitHub Pages ger då varje fil ett nytt datum och en ny
// etag, också de som inte har ändrats. Webbläsaren sparar dem bara tio minuter
// (max-age=600) och kan sedan inte fråga om de är desamma, så ett nytt besök
// hämtade om allt: JavaScript, stilmallen, typsnitten och rummets bilder,
// 2–4 MB, och tolkade koden från början.
//
// Den här filen (registreras från index.html) sparar dem i stället i
// webbläsarens Cache Storage, var och en med sin kontrollsumma. Bygget skriver
// in listan över filerna och deras kontrollsummor i index.html (rum-filer,
// src/filer.js), så varje besök vet exakt vilka versioner sidan ska ha:
//  – en sparad fil med samma kontrollsumma som i listan tas ur lådan,
//  – annars hämtas filen som vanligt, och den sparas bara om dess innehåll har
//    den kontrollsumma listan säger (då kan det aldrig bli en gammal version),
//  – det som inte står i listan (data/, sidorna, ljudet, andra adresser) rörs
//    inte: det hämtas som förut.
// Sidan ser alltså samma filer som utan den här filen, bara utan att hämta
// det som redan finns. Går något fel här hämtas filen som vanligt.
//
// Sparas om något i den här filen ändras på ett sätt som gör det sparade
// oanvändbart: byt LADA, så tas den gamla lådan bort.

const LADA = 'filer-1';
// (bara sådant som inte ändras utan att byta innehåll; data/ och sidorna aldrig)
const ARTER = /\.(js|css|woff2?|png|webp|jpe?g|gif|svg|ico|gz|bin)$/;

// klientens id → listan (ett löfte: { fil: kontrollsumma } eller null), från sidans navigering
const KLIENTER = new Map();
// den senaste navigeringen utan resultingClientId (Safari): den första okända klienten får dess lista
let vantar = null;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // (sidan hämtas medan den här filen startar)
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    for (const k of await caches.keys()) if (/^filer-/.test(k) && k !== LADA) await caches.delete(k);
  })());
});

const ROT = () => new URL(self.registration.scope).pathname;
// adressen → filens namn i listan (som bygget skriver det), eller null
function relativ(url) {
  if (url.origin !== self.location.origin || url.search || !url.pathname.startsWith(ROT())) return null;
  let rel;
  try {
    rel = decodeURIComponent(url.pathname.slice(ROT().length));
  } catch (err) {
    return null;
  }
  return ARTER.test(rel) && !rel.startsWith('data/') ? rel : null;
}

// SHA-256 i base64url, så många tecken som bygget skriver (src/filer.js)
async function summa(buf, n) {
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, n);
}

const duger = (svar) => svar && svar.status === 200 && (svar.type === 'basic' || svar.type === 'default') && !svar.redirected;

// svaret sparas om innehållet har kontrollsumman h
async function spara(lada, nyckel, svar, h) {
  const buf = await svar.arrayBuffer();
  if ((await summa(buf, h.length)) !== h) return;
  const hd = new Headers();
  for (const k of ['content-type', 'last-modified']) if (svar.headers.get(k)) hd.set(k, svar.headers.get(k));
  hd.set('x-filer', h);
  await lada.put(nyckel, new Response(buf, { status: 200, statusText: 'OK', headers: hd }));
}

// listan i sidans html (src/filer.js), eller null
function lasLista(html) {
  const m = /<script id="rum-filer" type="application\/json">([^<]*)<\/script>/.exec(html);
  if (!m) return null;
  try {
    const l = JSON.parse(m[1]);
    return l && typeof l === 'object' ? l : null;
  } catch (err) {
    return null;
  }
}

// det sparade som inte står i listan längre (eller har en annan kontrollsumma)
async function stada(lista) {
  const lada = await caches.open(LADA);
  for (const req of await lada.keys()) {
    const rel = relativ(new URL(req.url));
    if (!rel || !lista[rel]) await lada.delete(req);
    else {
      const s = await lada.match(req);
      if (!s || s.headers.get('x-filer') !== lista[rel]) await lada.delete(req);
    }
  }
}

// (listan står bara i förstasidan; de andra sidorna och deras filer hämtas som förut)
function navigering(e) {
  const p = new URL(e.request.url).pathname;
  const forsta = p === ROT() || p === `${ROT()}index.html`;
  e.respondWith((async () => {
    const svar = (await Promise.resolve(e.preloadResponse).catch(() => null)) || (await fetch(e.request));
    if (forsta && svar.ok && /text\/html/.test(svar.headers.get('content-type') || '')) {
      const lista = svar.clone().text().then(lasLista).catch(() => null);
      const post = { lista, t: Date.now() };
      if (e.resultingClientId) KLIENTER.set(e.resultingClientId, post);
      else vantar = post;
      // (gamla klienter glöms: deras filer hämtas som vanligt)
      for (const [id, k] of KLIENTER) if (Date.now() - k.t > 10 * 60e3) KLIENTER.delete(id);
      e.waitUntil(lista.then((l) => (l ? new Promise((r) => setTimeout(r, 20000)).then(() => stada(l)) : null)).catch(() => {}));
    }
    return svar;
  })());
}

async function fil(e, req, rel, post) {
  const lista = await post.lista;
  const h = lista && lista[rel];
  if (!h) return fetch(req);
  const nyckel = new URL(rel, self.registration.scope).href;
  let lada = null;
  let sparad = null;
  try {
    lada = await caches.open(LADA);
    sparad = await lada.match(nyckel);
  } catch (err) {
    lada = null;
  }
  if (sparad && sparad.headers.get('x-filer') === h) return sparad;
  const svar = await fetch(req);
  if (lada && duger(svar)) e.waitUntil(spara(lada, nyckel, svar.clone(), h).catch(() => {}));
  return svar;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    navigering(e);
    return;
  }
  if (req.headers.has('range') || req.cache === 'no-store' || req.cache === 'reload') return;
  const rel = relativ(new URL(req.url));
  if (!rel) return;
  let post = KLIENTER.get(e.clientId);
  if (!post && vantar && e.clientId && Date.now() - vantar.t < 10000) {
    post = vantar;
    KLIENTER.set(e.clientId, vantar);
    vantar = null;
  }
  // (en sida vars navigering den här filen inte såg: som vanligt)
  if (!post) return;
  e.respondWith(fil(e, req, rel, post));
});

// Första besöket går inte genom den här filen (den registreras efteråt). Sidan skickar då sin lista och
// det den hämtade, och det som fortfarande ligger i webbläsarens vanliga cache sparas här (med samma
// kontroll), så att redan nästa besök har nytta av det.
self.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || !d.filer || typeof d.filer !== 'object' || !Array.isArray(d.laddat)) return;
  e.waitUntil((async () => {
    const lada = await caches.open(LADA);
    for (const adr of d.laddat.slice(0, 600)) {
      let url;
      try {
        url = new URL(adr);
      } catch (err) {
        continue;
      }
      const rel = relativ(url);
      const h = rel && d.filer[rel];
      if (!h || typeof h !== 'string') continue;
      try {
        const s = await lada.match(url.href);
        if (s && s.headers.get('x-filer') === h) continue;
        const svar = await fetch(url.href, { cache: 'force-cache' });
        if (duger(svar)) await spara(lada, url.href, svar, h);
      } catch (err) { /* nästa */ }
    }
  })().catch(() => {}));
});
