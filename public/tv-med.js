'use strict';

// Tv:n som följer med (rum-bild.js) till Tabeller, Statistik och Om oss, som är
// egna sidor: följde tv:n med från sidan innan (sessionStorage
// profeterna.tv.foljer, inom tio minuter som ATER i rum-bild.js) hämtas det som
// behövs för den här – tv:ns stil och rum-bild.js, som visar bilden ur samtalet
// (telefon.js, som står på sidan och följer med av sig själv). Annars hämtas
// ingenting.
(function () {
  let f = null;
  try {
    f = JSON.parse(sessionStorage.getItem('profeterna.tv.foljer') || 'null');
  } catch (e) {
    return;
  }
  if (!f || !(Date.now() - f.t < 10 * 60 * 1000)) return;
  const skript = (src) => new Promise((ok) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = s.onerror = ok;
    document.head.append(s);
  });
  new Promise((ok) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'rum-tv.css';
    css.onload = css.onerror = ok;
    document.head.append(css);
  })
    .then(() => (window.Tippoang ? null : skript('tippoang.js')))
    .then(() => skript('rum-bild.js'));
})();
