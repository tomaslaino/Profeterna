'use strict';

// Lagsköldarna (ESPN, som bygget lägger i skoldar/): Tabeller och matchbladet
// sätter skölden bredvid lagnamnet. Skoldar.ready läser indexet
// data/skoldar.json (lagnamn → [ESPN-id, mörk finns]); Skoldar.img(namn)
// ger skölden i en ruta av fast storlek, så att namnen står i linje även när
// ett lag saknar sköld – då är rutan tom. dark = varianten för mörk botten,
// när laget har en (Tottenhams tupp vit i stället för marinblå).
//
// Läses före sidornas egna skript.

(function () {
  let lag = {};
  const ready = fetch('data/skoldar.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => { lag = j.lag || {}; })
    .catch(() => {});

  function img(name, { dark = false } = {}) {
    const t = lag[name];
    const src = t ? `skoldar/${t[0]}${dark && t[1] ? '-m' : ''}.png` : '';
    return `<span class="skold" aria-hidden="true">${src ? `<img src="${src}" alt="" decoding="async">` : ''}</span>`;
  }

  // finns en sköld för laget? (lagrutan visar annars initialerna)
  const has = (name) => !!lag[name];

  window.Skoldar = { ready, img, has };
})();
