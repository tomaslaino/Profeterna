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
// Den här filen (registreras från index.html, och av telefon.js för samtalets
// aviseringar, se nederst) sparar dem i stället i
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

// ---------- samtalet: aviseringarna (telefon.js, worker/samtalet.mjs) ----------
//
// När gänget ringer och sidan inte är öppen kommer en avisering utan innehåll
// (web push). Här frågas tjänsten vad det gäller (/samtal/nu) och telefonen
// visar det: Tejder ringer, med Inte nu och Svara (Android), eller Missat samtal
// från Tejder – med Gå med medan samtalet pågår och Ring upp efteråt. Samma tag,
// så att det missade samtalet ersätter det som ringde. Ett tryck öppnar sidan
// (eller tar fram den som är öppen) och svarar, går med eller ringer upp.
// Tjänstens adress, namnen vi kallas och porträtten skriver sidan i lådan
// telefon (telefon.js, aviseringar).

const TEL = 'telefon';
const TEL_FIL = () => new URL('telefon.json', self.registration.scope).href;

async function telefonen() {
  try {
    const r = await (await caches.open(TEL)).match(TEL_FIL());
    return r ? await r.json() : null;
  } catch (err) {
    return null;
  }
}

async function samtalNu(t) {
  const sub = await self.registration.pushManager.getSubscription();
  if (!t || !t.bas || !sub) return null;
  const r = await fetch(`${t.bas}/samtal/nu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
  return r.ok ? r.json() : null;
}

const telOrd = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} och ${xs[xs.length - 1]}` : xs[0] || '');

async function ringer() {
  const t = await telefonen();
  let d = null;
  try {
    d = await samtalNu(t);
  } catch (err) {
    d = null;
  }
  const namn = (v) => (t && t.namn && t.namn[v]) || v;
  const bild = (v) => (t && t.bild && t.bild[v]) || new URL('ikon-192.png', self.registration.scope).href;
  const vem = d && d.vem;
  const s = d && d.samtal;
  const f = d && d.senast;
  const o = { tag: 'samtal', badge: new URL('ikon-maskbar-512.png', self.registration.scope).href, timestamp: Date.now() };
  let titel;
  if (s && vem && s.ringer.includes(vem)) {
    const med = s.med.filter((v) => v !== s.av);
    titel = `${namn(s.av)} ringer`;
    Object.assign(o, {
      body: med.length ? `${telOrd(med.map(namn))} är med` : 'Matchfixarna',
      icon: bild(s.av),
      actions: [{ action: 'inte', title: 'Inte nu' }, { action: 'svara', title: 'Svara' }],
      requireInteraction: true,
      renotify: true,
      vibrate: [600, 200, 400, 1400, 600, 200, 400, 1400, 600, 200, 400],
      data: { samtal: 'svara' },
    });
  } else if (s && vem && s.missat.includes(vem) && s.med.length) {
    titel = `Missat samtal från ${namn(s.av)}`;
    Object.assign(o, { body: `${telOrd(s.med.map(namn))} pratar fortfarande`, icon: bild(s.av), actions: [{ action: 'svara', title: 'Gå med' }], data: { samtal: 'svara' } });
  } else if (f && vem && (f.missat || []).includes(vem)) {
    const k = new Date(f.slut || Date.now());
    titel = `Missat samtal från ${namn(f.av)}`;
    Object.assign(o, { body: `kl. ${String(k.getHours()).padStart(2, '0')}.${String(k.getMinutes()).padStart(2, '0')}`, icon: bild(f.av), actions: [{ action: 'ring', title: 'Ring upp' }], data: { samtal: 'ring' } });
  } else {
    // (tjänsten svarade inte: något har hänt i samtalet, och sidan visar vad)
    titel = s && s.med.length ? 'Samtal pågår' : 'Matchfixarna';
    Object.assign(o, { body: s && s.med.length ? telOrd(s.med.map(namn)) : 'Gänget har ringt', icon: bild(s ? s.av : ''), data: { samtal: s && s.med.length ? 'svara' : '' } });
  }
  await self.registration.showNotification(titel, o);
}

self.addEventListener('push', (e) => {
  e.waitUntil(ringer());
});

async function telInte() {
  const t = await telefonen();
  const sub = await self.registration.pushManager.getSubscription();
  if (!t || !t.bas || !sub) return;
  await fetch(`${t.bas}/samtal/inte`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
}

// Sidan med rummet (förstasidan): den som är öppen tas fram och får veta vad
// som trycktes, annars öppnas den.
async function telOppna(vad) {
  const rot = new URL(self.registration.scope);
  const alla = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const sidan = alla.find((c) => {
    const u = new URL(c.url);
    return u.origin === rot.origin && (u.pathname === rot.pathname || u.pathname === `${rot.pathname}index.html`);
  });
  if (sidan) {
    await sidan.focus().catch(() => {});
    if (vad) sidan.postMessage({ samtal: vad });
    return;
  }
  const u = new URL(rot.href);
  if (vad) u.searchParams.set('samtal', vad);
  await self.clients.openWindow(u.href);
}

self.addEventListener('notificationclick', (e) => {
  if (e.notification.tag !== 'samtal') return;
  e.notification.close();
  const vad = e.action || (e.notification.data && e.notification.data.samtal) || '';
  e.waitUntil(vad === 'inte' ? telInte() : telOppna(vad));
});
