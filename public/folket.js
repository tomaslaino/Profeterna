'use strict';

// ---------- Stryktipset och Svenska folket ----------
//
// Svenska Spels Stryktips för omgångens kupong (samtal.js):
//
// - Hämta Stryktipset (Välj matcher): veckans tretton matcher i kupongens
//   ordning, knutna till sajtens matcher på lagen och avsparken.
// - Svenska folket: hur stor del av raderna som har med 1, X och 2, under
//   rutorna på kupongen bredvid modellens odds. Grönt när modellen ger
//   tecknet klart större chans än folket spelar det – där finns spelvärdet.
//   Svenska Spel räknar om fördelningen medan raderna lämnas in; sidan
//   frågar varje minut fram till spelstoppet och skriver om siffrorna där de
//   står, utan att rita om kupongen.
//
// Svenska Spel släpper inte in anrop direkt från sajten, så tjänsten
// profeterna-kupong hämtar åt den (GET …/stryktipset, worker/stryktipset.mjs;
// lokalt /api/stryktipset). Omgången som hämtades från Svenska Spel har sitt
// nummer med sig (spel.nr), så att fördelningen går att läsa också efter
// spelstoppet. Annars används omgången som är öppen, och numret sparas på
// enheten för omgångens kupong.
//
// Läses efter kupong.js och använder dess hjälpare (KP, kpLoad, kpStore,
// isOpen, fold) och app.js (state, esc, fTime, fWeekdayTime).

window.Folket = (() => {
  const POLL_MS = 60000;
  const NR = 'profeterna.folket.nr';
  const F = {
    key: null, // omgångens kupong (id) som fördelningen gäller
    s: null, // omgångens kupong som den ser ut nu
    nr: null, // Svenska Spels omgång
    omgang: null, // svaret från tjänsten
    byId: new Map(), // sajtens match-id → {nr, folket}
    at: 0, // när fördelningen hämtades senast
    timer: null,
    busy: false,
  };

  const endpoint = () => {
    const s = KP.data && KP.data.samtal;
    return s && s.endpoint ? s.endpoint.replace(/\/samtal$/, '/stryktipset') : null;
  };

  async function fetchDraw(nr = null) {
    const url = endpoint();
    if (!url) return null;
    try {
      const res = await fetch(`${url}${nr ? `?nr=${encodeURIComponent(nr)}` : ''}`, { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      return res.ok && body.ok ? body.omgang : null;
    } catch {
      return null;
    }
  }

  // ---------- Svenska Spels lag → sajtens matcher ----------

  // Svenska Spels korta namn ("QPR", "Wolves", "West Brom", "Bristol C") är
  // början av sajtens, sedan smeknamnen översatts.
  const ALIAS = [
    [/\bman\.?\s+(?:utd|u|united)\b/g, 'manchester united'],
    [/\bman\.?\s+city\b/g, 'manchester city'],
    [/\bsheff\.?\b/g, 'sheffield'],
    [/\butd\b/g, 'united'],
    [/\bwed\b/g, 'wednesday'],
    [/\bwolves\b/g, 'wolverhampton'],
    [/\bspurs\b/g, 'tottenham'],
    [/\bq\.?p\.?r\b/g, 'queens park rangers'],
    [/\bmk\s+dons\b/g, 'milton keynes dons'],
    [/\bnott'?m\.?\s+forest\b/g, 'nottingham forest'],
    [/\bboro\b/g, 'middlesbrough'],
  ];
  const key = (s) => ALIAS.reduce((t, [re, to]) => t.replace(re, to), fold(s))
    .replace(/^(?:afc|fc)\s+/, '').replace(/[^a-z0-9]/g, '');
  const same = (a, b) => {
    const x = key(a);
    const y = key(b);
    return x.length >= 3 && y.length >= 3 && (x.startsWith(y) || y.startsWith(x));
  };

  // Svenska Spels matcher → sajtens, i kupongens ordning. Samma lag i samma
  // ordning, närmast avsparken (inom ett och ett halvt dygn).
  function link(omgang) {
    const all = (state.all && state.all.matches) || [];
    return omgang.matcher.map((x) => {
      const t = Date.parse(x.avspark);
      let best = null;
      for (const m of all) {
        const d = Math.abs(Date.parse(m.kickoff) - t);
        if (!(d <= 36 * 3600000) || !same(x.hemma, m.home) || !same(x.borta, m.away)) continue;
        if (!best || d < best.d) best = { m, d };
      }
      return { ...x, m: best ? best.m : null };
    });
  }

  // Välj matcher → Hämta Stryktipset: veckans omgång med sajtens matcher.
  // → {omgang, rows: [{nr, hemma, borta, m}]} eller null (ingen kontakt
  // eller ingen omgång öppen).
  async function open() {
    const omgang = await fetchDraw();
    return omgang ? { omgang, rows: link(omgang) } : null;
  }

  // ---------- fördelningen på kupongen ----------

  // Omgången som kupongen s hör till: den som hämtades från Svenska Spel,
  // annars den som sparats på enheten för kupongen, annars den öppna (om den
  // har någon av kupongens matcher).
  async function load(s) {
    const saved = kpLoad(NR);
    const nr = (s.spel && s.spel.nr) || (saved && saved.id === s.id ? saved.nr : null);
    const omgang = await fetchDraw(nr);
    if (!omgang || !SM_ok(s)) return false;
    const ids = new Set(s.matcher.map((x) => x.id));
    const rows = link(omgang).filter((r) => r.m && ids.has(r.m.id));
    if (!rows.length) return false;
    if (!nr) kpStore(NR, { id: s.id, nr: omgang.nr });
    const before = JSON.stringify([...F.byId]);
    F.nr = omgang.nr;
    F.omgang = omgang;
    F.byId = new Map(rows.map((r) => [r.m.id, { nr: r.nr, folket: r.folket }]));
    return JSON.stringify([...F.byId]) !== before;
  }
  // Kupongen är fortfarande den som fördelningen hämtades för.
  const SM_ok = (s) => F.key === s.id;

  // Spelstoppet har passerat: fördelningen är fryst.
  const closed = () => Boolean(F.omgang && F.omgang.stang && Date.now() > Date.parse(F.omgang.stang) + 120000);

  // Följ fördelningen för kupongen s: hämtas nu och sedan varje minut medan
  // sidan visas och spelet är öppet. Siffrorna på sidan skrivs om på plats.
  function watch(s) {
    if (!s || !endpoint()) return;
    F.s = s;
    if (F.key !== s.id) {
      F.key = s.id;
      F.nr = null;
      F.omgang = null;
      F.byId = new Map();
      F.at = 0;
    }
    if (!F.at || (!closed() && Date.now() - F.at > POLL_MS)) refresh(s);
    if (F.timer || closed()) return;
    F.timer = setInterval(() => {
      // Bara medan kupongen med siffrorna syns, och bara om den har matcher
      // från Stryktipset.
      if (!document.querySelector('[data-sf]') || closed() || (F.at && !F.busy && !F.byId.size)) {
        clearInterval(F.timer);
        F.timer = null;
        return;
      }
      if (!document.hidden) refresh(F.s);
    }, POLL_MS);
  }

  async function refresh(s) {
    if (F.busy) return;
    F.busy = true;
    F.at = Date.now();
    try {
      if (await load(s)) paint();
      else stamp();
    } finally {
      F.busy = false;
    }
  }

  // Siffrorna i varje ruta och tiden i foten, där de står på sidan.
  function paint() {
    for (const el of document.querySelectorAll('[data-sf]')) {
      const [id, i] = el.dataset.sf.split(':');
      el.outerHTML = cell(id, Number(i), el.dataset.p ? Number(el.dataset.p) : null);
    }
    stamp();
  }
  function stamp() {
    for (const el of document.querySelectorAll('[data-sf-tid]')) el.outerHTML = field();
  }

  // Under rutan för tecknet i (0–2) i matchen id: Svenska folkets procent,
  // grön när modellens chans p (hela procent) är klart större. Tom plats när
  // fördelningen saknas, så att sidan kan fylla i den när den kommer.
  function cell(id, i, p = null) {
    const r = F.byId.get(String(id));
    const v = r && r.folket ? r.folket[i] : null;
    const attr = ` data-sf="${esc(`${id}:${i}`)}"${p != null ? ` data-p="${p}"` : ''}`;
    if (v == null) return `<small class="sm-sf"${attr} hidden></small>`;
    const value = p != null && p >= v * 1.25 && p - v >= 4;
    const tip = `Svenska folket ${v} %${p != null ? ` · modellen ${p} %` : ''}`;
    return `<small class="sm-sf${value ? ' sm-sf-v' : ''}"${attr} title="${esc(tip)}">${v}%</small>`;
  }

  // Fältet i kupongens fot: när fördelningen räknades senast, eller vid
  // spelstoppet. Tomt utan fördelning.
  function field() {
    const o = F.omgang;
    if (!o || !F.byId.size) return '<span data-sf-tid hidden></span>';
    const t = o.folketTid ? new Date(o.folketTid) : null;
    const when = t ? (Date.now() - t.getTime() > 20 * 3600000 ? fWeekdayTime : fTime).format(t) : '–';
    const tip = `Stryktipset${o.vecka ? ` v ${o.vecka}` : ''} · andel av raderna${closed() ? ' vid spelstoppet' : ', uppdateras varje minut'}`;
    return `<span class="pp-field" data-sf-tid title="${esc(tip)}"><span>Svenska folket</span><b>${esc(when)}</b></span>`;
  }

  return { open, watch, cell, field, has: () => F.byId.size > 0 };
})();
