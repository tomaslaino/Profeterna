'use strict';

// Höjdpunkterna. Bygget knyter klippen till matcherna (src/hojdpunkter.js):
// YouTube-klipp ur klubbarnas och sändarnas kanaler (m.y på matchraden,
// d.youtube i matchrutan) och Viaplays gratis sammandrag (m.v, d.highlights).
// app.js ritar spelikonen på matchraden och knappen i matchrutans rubrik.
//
// YouTube-klippen spelas i en liten spelare nere i hörnet, ovanpå sidan, som
// går att förstora och som ligger kvar medan man bläddrar. Nästa klipp tar
// samma spelare. Går ett klipp inte att spela här (spärrat i landet,
// borttaget) provas nästa i listan, och klippet hoppas över nästa gång. När
// inget går visas Viaplays sammandrag i stället, om det finns.
//
// Viaplay tillåter inte att spelaren visas inuti sajten (X-Frame-Options:
// DENY), så Viaplays klipp öppnas i ett litet eget fönster – på telefon och
// surfplatta i en ny flik. Det gäller bara matcher utan YouTube-klipp.
//
// Matchraden är en knapp som öppnar matchrutan – ikonen på den spelar i
// stället klippet. Med tangentbordet nås klippet i matchrutan.

(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const svg = (d, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"${fill ? '' : ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${d}</svg>`;
  const PLAY = svg('<path d="M8.5 5.6v12.8L18.8 12z" fill="currentColor"/>', true);
  const GROW = svg('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>');
  const SHRINK = svg('<path d="M20 4l-6 6M14 5v5h5M4 20l6-6M10 19v-5H5"/>');
  const CLOSE = svg('<path d="M6 6l12 12M18 6L6 18"/>');
  const mins = (s) => `${Math.max(1, Math.round((s || 0) / 60))} min`;
  const live = (h) => h && h.url && !(h.until && Date.parse(h.until) <= Date.now());
  const hidden = (m) => Boolean(window.Spoiler && Spoiler.hidden(m));

  // ---------- matchraden och matchrutan ----------

  // Det som spelaren behöver, som data-attribut på ikonen eller knappen.
  function attrs(m, ids, via) {
    return ` data-yt="${esc(ids.join(' '))}" data-name="${esc(`${m.home} – ${m.away}`)}"` +
      (via ? ` data-via="${esc(via)}"` : '') + (hidden(m) ? ' data-hide="1"' : '');
  }

  function row(m) {
    if (!m) return '';
    if (m.y && m.y.length) {
      return `<span class="hl-play"${attrs(m, m.y, m.v && m.v.u)} title="Höjdpunkter" aria-hidden="true">${PLAY}</span>`;
    }
    const v = m.v;
    if (!v || !v.u) return '';
    return `<span class="hl-play" data-hl="${esc(v.u)}" title="Höjdpunkter${v.s ? `, ${mins(v.s)}` : ''} · Viaplay" aria-hidden="true">${PLAY}</span>`;
  }

  function head(d) {
    const list = ((d && d.highlights) || []).filter(live);
    const yt = (d && d.youtube) || [];
    if (yt.length) {
      return '<div class="hl-links"><button type="button" class="hl-btn"' +
        `${attrs(d.match, yt.map((c) => c.id), list.length && list[0].url)} title="${esc(yt[0].ch)} · YouTube">` +
        `${PLAY}<span>Höjdpunkter</span></button></div>`;
    }
    if (!list.length) return '';
    return '<div class="hl-links">' + list.map((h, i) =>
      `<a class="hl-btn${i ? ' alt' : ''}" href="${esc(h.url)}" data-hl="${esc(h.url)}" target="_blank" rel="noopener" title="Viaplay · gratis med reklam">` +
      `${i ? '' : `${PLAY}<span>Höjdpunkter</span>`}<span class="hl-len">${mins(h.sec)}</span></a>`).join('') + '</div>';
  }

  // Viaplay: ett 16:9-fönster mitt över sidan på datorn, annars en ny flik.
  function openViaplay(url) {
    const small = window.matchMedia('(pointer: coarse), (max-width: 760px)').matches;
    if (small) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    const w = Math.min(1024, screen.availWidth - 80);
    const h = Math.round((w * 9) / 16);
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + Math.max(40, (window.outerHeight - h) / 2));
    const win = window.open(url, 'matchfixarna-hojdpunkter', `popup,width=${w},height=${h},left=${left},top=${top}`);
    if (!win) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    win.opener = null;
    win.focus();
  }

  // ---------- klipp som inte går att spela här ----------

  // Sparas i webbläsaren: spärrat i landet eller borttaget ändras sällan.
  const BAD_KEY = 'matchfixarna.hl-ej';
  function bad() {
    try {
      return JSON.parse(localStorage.getItem(BAD_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function markBad(id) {
    try {
      const list = bad().filter((x) => x !== id);
      list.push(id);
      localStorage.setItem(BAD_KEY, JSON.stringify(list.slice(-300)));
    } catch {
      // privat läge: provas igen nästa gång
    }
  }

  // ---------- YouTubes spelare ----------

  // YouTubes spelar-API, eller null om det inte går att ladda (t.ex. spärrat
  // i webbläsaren) – då spelas första klippet i en vanlig inbäddning.
  let apiP = null;
  function api() {
    if (apiP) return apiP;
    apiP = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        resolve(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
      setTimeout(() => resolve(window.YT && window.YT.Player ? window.YT : null), 8000);
    });
    return apiP;
  }

  const HOST = 'https://www.youtube-nocookie.com';
  // 100 borttaget/privat, 101 och 150 får inte visas här (oftast spärrat i landet).
  const GONE = new Set([100, 101, 150]);

  const P = { root: null, yt: null, list: [], i: 0, via: null, t: 0, seq: 0, timer: null, watch: null };

  function build() {
    const root = document.createElement('div');
    root.className = 'hlp';
    root.innerHTML = '<div class="hlp-dim"></div>' +
      '<div class="hlp-box" role="region" aria-label="Höjdpunkter">' +
      '<div class="hlp-bar"><span class="hlp-name"></span>' +
      `<button type="button" class="hlp-ic hlp-size" aria-label="Förstora" title="Förstora">${GROW}</button>` +
      `<button type="button" class="hlp-ic hlp-x" aria-label="Stäng" title="Stäng">${CLOSE}</button></div>` +
      '<div class="hlp-frame"><div class="hlp-video"></div><div class="hlp-mask" hidden></div>' +
      '<div class="hlp-out" hidden></div></div></div>';
    root.querySelector('.hlp-size').addEventListener('click', () => setBig(!root.classList.contains('big')));
    root.querySelector('.hlp-x').addEventListener('click', close);
    root.querySelector('.hlp-dim').addEventListener('click', () => setBig(false));
    root.querySelector('.hlp-out').addEventListener('click', (e) => {
      const b = e.target.closest('[data-via-open]');
      if (b) openViaplay(P.via);
    });
    return root;
  }

  function setBig(on) {
    const root = P.root;
    if (!root) return;
    root.classList.toggle('big', on);
    const b = root.querySelector('.hlp-size');
    b.innerHTML = on ? SHRINK : GROW;
    b.setAttribute('aria-label', on ? 'Förminska' : 'Förstora');
    b.title = on ? 'Förminska' : 'Förstora';
  }

  // Spelaren ligger i den öppna rutan (en modal ruta gör allt utanför den
  // oklickbart), annars direkt i sidan.
  function host() {
    const open = [...document.querySelectorAll('dialog[open]')].filter((d) => {
      try {
        return d.matches(':modal');
      } catch {
        return true;
      }
    });
    return open.length ? open[open.length - 1] : document.body;
  }

  // Flytta spelaren när en ruta öppnas eller stängs. moveBefore behåller
  // klippet där det var; annars laddas det om från samma ställe.
  function rehost() {
    const root = P.root;
    if (!root || !root.isConnected) return;
    const h = host();
    if (root.parentNode === h) return;
    if (h.moveBefore) {
      try {
        h.moveBefore(root, null);
        return;
      } catch {
        // flyttas nedan
      }
    }
    h.appendChild(root);
    if (P.i < P.list.length) load(P.t);
  }

  function stopPlayer() {
    clearInterval(P.timer);
    P.timer = null;
    if (P.yt) {
      try {
        P.yt.destroy();
      } catch {
        // redan borta
      }
      P.yt = null;
    }
  }

  // Klippet P.list[P.i], från sekund `start`.
  async function load(start) {
    const seq = ++P.seq;
    const root = P.root;
    const box = root.querySelector('.hlp-video');
    root.querySelector('.hlp-out').hidden = true;
    stopPlayer();
    box.innerHTML = '<div></div>';
    const id = P.list[P.i];
    const YT = await api();
    if (seq !== P.seq) return;
    const vars = { autoplay: 1, rel: 0, playsinline: 1, iv_load_policy: 3, start: Math.floor(start || 0) };
    if (!YT) {
      const q = new URLSearchParams(vars);
      box.innerHTML = `<iframe src="${HOST}/embed/${encodeURIComponent(id)}?${q}" title="Höjdpunkter" ` +
        'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen ' +
        'referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      return;
    }
    P.yt = new YT.Player(box.firstChild, {
      host: HOST,
      videoId: id,
      width: '100%',
      height: '100%',
      playerVars: { ...vars, origin: location.origin },
      events: {
        onError: (e) => {
          if (seq !== P.seq) return;
          if (GONE.has(e.data)) markBad(P.list[P.i]);
          next();
        },
      },
    });
    P.timer = setInterval(() => {
      try {
        P.t = P.yt.getCurrentTime() || P.t;
      } catch {
        // spelaren laddar
      }
    }, 1000);
  }

  function next() {
    P.t = 0;
    if (++P.i < P.list.length) load(0);
    else out();
  }

  // Inget av klippen går att spela här.
  function out() {
    stopPlayer();
    const root = P.root;
    root.querySelector('.hlp-video').innerHTML = '';
    const el = root.querySelector('.hlp-out');
    el.innerHTML = '<p>Går inte att spela här</p>' + (P.via
      ? `<button type="button" class="hl-btn" data-via-open>${PLAY}<span>Viaplay</span></button>`
      : '');
    el.hidden = false;
  }

  function play(el) {
    const all = el.dataset.yt.split(' ').filter(Boolean);
    const skip = new Set(bad());
    const list = all.filter((id) => !skip.has(id));
    if (!P.root) P.root = build();
    const root = P.root;
    root.querySelector('.hlp-name').textContent = el.dataset.name || 'Höjdpunkter';
    root.querySelector('.hlp-mask').hidden = !el.dataset.hide;
    P.list = list;
    P.i = 0;
    P.t = 0;
    P.via = el.dataset.via || null;
    if (!root.isConnected) host().appendChild(root);
    else rehost();
    if (!P.watch) {
      P.watch = new MutationObserver(rehost);
      P.watch.observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
    }
    if (list.length) load(0);
    else out();
  }

  function close() {
    P.seq++;
    stopPlayer();
    if (P.watch) P.watch.disconnect();
    P.watch = null;
    if (P.root) {
      setBig(false);
      P.root.remove();
      P.root.querySelector('.hlp-video').innerHTML = '';
    }
  }

  // Esc förminskar en förstorad spelare (och stänger inte matchrutan under).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !P.root || !P.root.classList.contains('big')) return;
    e.preventDefault();
    e.stopPropagation();
    setBig(false);
  }, true);

  // Före radens egen klickhanterare (fångas på vägen ner). Cmd-, Ctrl- och
  // mittenklick på Viaplays knappar i rutan öppnar en flik som vanligt.
  document.addEventListener('click', (e) => {
    const yt = e.target.closest && e.target.closest('[data-yt]');
    if (yt) {
      e.preventDefault();
      e.stopPropagation();
      play(yt);
      return;
    }
    const el = e.target.closest && e.target.closest('[data-hl]');
    if (!el) return;
    if (el.tagName === 'A' && (e.metaKey || e.ctrlKey || e.shiftKey || e.button)) return;
    e.preventDefault();
    e.stopPropagation();
    openViaplay(el.dataset.hl);
  }, true);

  window.Hojdpunkter = { row, head };
}());
