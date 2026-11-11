'use strict';

// ---------- delat till appen ----------
//
// En skärmbild som delas till Matchfixarna i telefonen (Dela → Ladda upp
// system, appen i android/ eller sajten installerad från Chrome) skickas som
// ett formulär till /dela/ – share_target i manifest.webmanifest. GitHub Pages
// tar inte emot formulär, så det här tar emot det i webbläsaren: bilderna
// läggs i lådan "delat" och sidan öppnas på kupongen med ?delat, där
// systembild.js läser dem som om de valts med Ladda upp system. Bilderna
// lämnar aldrig telefonen.
//
// Gäller bara adresser under /dela/ (registreras med scope /dela/ i
// systembild.js) – resten av sajten går som förut, utan service worker.

const LADA = 'delat';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'POST' || new URL(e.request.url).pathname !== '/dela/') return;
  e.respondWith((async () => {
    let filer = [];
    try {
      const data = await e.request.formData();
      filer = data.getAll('bild').filter((f) => f && typeof f === 'object' && f.size > 0);
      const lada = await caches.open(LADA);
      for (const k of await lada.keys()) await lada.delete(k);
      await Promise.all(filer.map((f, i) => lada.put(`/dela/bild-${i}`, new Response(f, {
        headers: { 'Content-Type': f.type || 'image/png', 'X-Namn': encodeURIComponent(f.name || '') },
      }))));
    } catch (_) {
      filer = [];
    }
    return Response.redirect(`/?delat=${filer.length}#kupong`, 303);
  })());
});
