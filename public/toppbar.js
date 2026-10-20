'use strict';

// Toppbaren: högst upp på sidan syns loggan och namnet, längre ner bara
// menyn. Klassen is-scrolled styr det i theme.css. På telefonen skrollar
// loggans rad undan av sig själv och klassen gör ingenting där.

(function () {
  const bar = document.querySelector('.topbar');
  if (!bar) return;
  let on = null;
  function sync() {
    const v = window.scrollY > 8;
    if (v === on) return;
    on = v;
    bar.classList.toggle('is-scrolled', v);
  }
  window.addEventListener('scroll', sync, { passive: true });
  sync();
})();
