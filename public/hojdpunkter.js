'use strict';

// Höjdpunkterna. Bygget knyter klippen till matcherna (src/hojdpunkter.js):
// YouTube-klipp ur klubbarnas och sändarnas kanaler (m.y på matchraden,
// d.youtube i matchrutan) och Viaplays gratis sammandrag (m.v, d.highlights).
// app.js ritar spelikonen på matchraden och knappen i matchrutans rubrik.
//
// YouTube-klippen fälls ut under knappen man klickade på: under matchraden i
// listan, under knappen i matchrutans rubrik. Skrollar man förbi flyttar
// klippet ut i hörnet och spelar vidare där, tills platsen syns igen. Öppnas
// matchrutan för samma match följer klippet med upp i rubriken, annars
// ligger det i hörnet ovanpå rutan. Det går att förstora mitt på sidan, och
// ett klick till på knappen stänger. Nästa klipp tar samma spelare – en i
// taget. Klipp som är spärrade i Sverige sorterar bygget bort. Går
// ett klipp ändå inte att spela här (spärrat i landet, borttaget) provas
// nästa i listan, och klippet hoppas över nästa gång. När inget går visas
// Viaplays sammandrag i stället, om det finns.
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
    return ` data-yt="${esc(ids.join(' '))}" data-mid="${esc(m.id)}" data-name="${esc(`${m.home} – ${m.away}`)}"` +
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

  // Klippet spelas i YouTubes inbäddade spelare. Med enablejsapi=1 berättar
  // den via postMessage hur det går (fel, hur långt det spelats) – samma
  // meddelanden som YouTubes eget spelar-API bygger på, men utan dess skript
  // från www.youtube.com, som kan vara spärrat i webbläsaren. Spelaren börjar
  // svara först när sidan sagt "listening".
  const HOST = 'https://www.youtube-nocookie.com';
  // 100 borttaget/privat, 101 och 150 får inte visas här (oftast spärrat i landet).
  const GONE = new Set([100, 101, 150]);

  // open: ett klipp är igång, mid: dess match. seen: platsen under knappen
  // syns. hold: tills dess stannar spelaren på sin plats medan sidan skrollar
  // fram den.
  const P = {
    root: null, frame: null, ready: false, ping: null, list: [], i: 0, via: null, t: 0, seq: 0,
    open: false, mid: null, watch: null, io: null, seen: true, hold: 0,
  };
  const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

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
    // I hörnet tar matchens namn en tillbaka till platsen i listan.
    root.querySelector('.hlp-name').addEventListener('click', () => {
      if (root.classList.contains('away') && !root.classList.contains('big')) {
        root.scrollIntoView({ block: 'center', behavior: smooth() });
      }
    });
    root.querySelector('.hlp-out').addEventListener('click', (e) => {
      const b = e.target.closest('[data-via-open]');
      if (b) openViaplay(P.via);
    });
    P.io = new IntersectionObserver((list) => {
      P.seen = list[list.length - 1].isIntersecting;
      float();
    });
    return root;
  }

  // Platsen under knappen behåller sin höjd medan klippet ligger i hörnet
  // eller är förstorat, så att det som står under inte hoppar.
  function keep(on) {
    const root = P.root;
    if (!on) root.style.height = '';
    else if (!root.style.height && !root.classList.contains('loose')) root.style.height = `${root.offsetHeight}px`;
  }

  function setBig(on) {
    const root = P.root;
    if (!root) return;
    keep(on || root.classList.contains('away'));
    root.classList.toggle('big', on);
    const b = root.querySelector('.hlp-size');
    b.innerHTML = on ? SHRINK : GROW;
    b.setAttribute('aria-label', on ? 'Förminska' : 'Förstora');
    b.title = on ? 'Förminska' : 'Förstora';
  }

  // Ut i hörnet när platsen under knappen skrollats ur bild, tillbaka när
  // den syns igen.
  function float() {
    const root = P.root;
    if (!P.open) return;
    const away = !root.classList.contains('loose') && !P.seen && Date.now() >= P.hold;
    if (away === root.classList.contains('away')) return;
    keep(away || root.classList.contains('big'));
    root.classList.toggle('away', away);
  }

  // Den översta öppna rutan (en modal ruta gör allt utanför den oklickbart),
  // annars sidan.
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

  // Knappen klippet startades från, i den öppna rutan eller på sidan – om den
  // syns, alltså inte i en dold flik eller en stängd ruta.
  function trigger(h) {
    for (const el of (h === document.body ? document : h).querySelectorAll('[data-yt]')) {
      if (el.dataset.mid === P.mid && el.getClientRects().length) return el;
    }
    return null;
  }

  // Spelaren läggs under knappen klippet startades från – matchraden eller
  // knapparna i matchrutans rubrik – och i hörnet när den knappen inte syns.
  // Körs när sidan ritas om, en ruta öppnas eller stängs och en flik byts.
  function place() {
    const root = P.root;
    if (!P.open) return;
    const h = host();
    const btn = trigger(h);
    for (const el of document.querySelectorAll('[data-yt].on')) {
      if (el !== btn) el.classList.remove('on');
    }
    if (!btn) {
      if (root.parentNode !== h || !root.classList.contains('loose')) move(h, null, true);
      return;
    }
    btn.classList.add('on');
    const mask = root.querySelector('.hlp-mask');
    if (mask.hidden !== !btn.dataset.hide) mask.hidden = !btn.dataset.hide;
    const a = btn.closest('.mrow, .hl-links') || btn;
    if (a.nextSibling !== root) move(a.parentNode, a.nextSibling, false);
  }

  // moveBefore behåller klippet där det var; annars laddas det om från
  // samma ställe.
  function move(parent, before, loose) {
    const root = P.root;
    root.classList.remove('away');
    root.classList.toggle('loose', loose);
    root.style.height = '';
    let kept = false;
    if (root.isConnected && parent.moveBefore) {
      try {
        parent.moveBefore(root, before);
        kept = true;
      } catch {
        // flyttas nedan
      }
    }
    if (!kept) {
      parent.insertBefore(root, before);
      if (P.frame) load(P.t);
    }
    // Bevakningen börjar om och svarar genast om platsen syns.
    P.io.unobserve(root);
    P.io.observe(root);
  }

  function listen(f, id) {
    f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), HOST);
  }

  function stopPlayer() {
    clearTimeout(P.ping);
    P.ping = null;
    P.frame = null;
    P.ready = false;
  }

  // Klippet P.list[P.i], från sekund `start`. Spelarens id i meddelandena är
  // P.seq, så att svar från ett tidigare klipp inte räknas.
  function load(start) {
    const seq = ++P.seq;
    const root = P.root;
    root.querySelector('.hlp-out').hidden = true;
    stopPlayer();
    const q = new URLSearchParams({
      autoplay: 1, rel: 0, playsinline: 1, iv_load_policy: 3, start: Math.floor(start || 0),
      enablejsapi: 1, origin: location.origin, widgetid: seq,
    });
    const f = document.createElement('iframe');
    f.src = `${HOST}/embed/${encodeURIComponent(P.list[P.i])}?${q}`;
    f.title = 'Höjdpunkter';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    // "listening" när spelaren säger att den är redo (readyToListen), och
    // från att ramen laddats var fjärdedels sekund tills den svarar, högst
    // tio sekunder.
    const hello = (n) => {
      if (seq !== P.seq || P.ready || !n) return;
      listen(f, seq);
      P.ping = setTimeout(hello, 250, n - 1);
    };
    f.addEventListener('load', () => hello(40));
    P.frame = f;
    root.querySelector('.hlp-video').replaceChildren(f);
  }

  // Spelarens meddelanden: ett fel tar nästa klipp, tiden behövs om spelaren
  // måste laddas om när den flyttas.
  window.addEventListener('message', (e) => {
    const f = P.frame;
    if (!f || e.source !== f.contentWindow || e.origin !== HOST || typeof e.data !== 'string') return;
    let d;
    try {
      d = JSON.parse(e.data);
    } catch {
      return;
    }
    if (!d || d.id !== P.seq) return;
    if (d.event === 'readyToListen') {
      listen(f, P.seq);
      return;
    }
    P.ready = true;
    if (d.event === 'onError') {
      if (GONE.has(d.info)) markBad(P.list[P.i]);
      next();
    } else if (d.event === 'infoDelivery' && d.info && typeof d.info.currentTime === 'number') {
      P.t = d.info.currentTime;
    }
  });

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

  // Ett klick till på samma match stänger.
  function play(el) {
    if (P.open && el.dataset.mid === P.mid) {
      close();
      return;
    }
    const skip = new Set(bad());
    const list = el.dataset.yt.split(' ').filter((id) => id && !skip.has(id));
    if (!P.root) P.root = build();
    const root = P.root;
    stopPlayer();
    root.querySelector('.hlp-video').innerHTML = '';
    root.querySelector('.hlp-name').textContent = el.dataset.name || 'Höjdpunkter';
    root.querySelector('.hlp-mask').hidden = !el.dataset.hide;
    setBig(false);
    P.list = list;
    P.i = 0;
    P.t = 0;
    P.via = el.dataset.via || null;
    P.mid = el.dataset.mid;
    P.open = true;
    P.hold = Date.now() + 900;
    setTimeout(float, 950);
    place();
    if (!P.watch) {
      P.watch = new MutationObserver(place);
      P.watch.observe(document.body, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden'],
      });
    }
    if (list.length) load(0);
    else out();
    // Hela spelaren fram i bild, under den klistrade toppbaren.
    if (!root.classList.contains('loose') && host() === document.body) {
      root.scrollIntoView({ block: 'nearest', behavior: smooth() });
    }
  }

  function close() {
    P.open = false;
    P.seq++;
    stopPlayer();
    if (P.watch) P.watch.disconnect();
    P.watch = null;
    for (const el of document.querySelectorAll('[data-yt].on')) el.classList.remove('on');
    const root = P.root;
    if (root) {
      setBig(false);
      P.io.unobserve(root);
      root.classList.remove('away', 'loose');
      root.style.height = '';
      root.remove();
      root.querySelector('.hlp-video').innerHTML = '';
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
