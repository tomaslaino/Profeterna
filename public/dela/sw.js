'use strict';

// ---------- delat till appen ----------
//
// En skärmbild som delas till Matchfixarna i telefonen (Dela → Matchfixarna,
// sajten installerad från Chrome, eller Ladda upp system i den gamla appen i
// android/) skickas som ett formulär till /dela/ – share_target i
// manifest.webmanifest. GitHub Pages tar inte emot formulär, så det här tar
// emot det i webbläsaren: bilderna läggs i lådan "delat" och tobaksaffären
// öppnas med ?delat, där systembild.js läser dem och kryssar gängets kupong på
// pulten. Bilderna lämnar aldrig telefonen.
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
    return Response.redirect(`/?delat=${filer.length}`, 303);
  })());
});
