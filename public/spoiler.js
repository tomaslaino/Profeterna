'use strict';

// Spoilerskyddet, som på gravergrav.se: skölden i toppbaren döljer resultaten
// från matcher som startat det senaste dygnet – eller från en vald dag – så
// att man kan se matchen först. Matchlistan, matchvyn, kupongen,
// utvärderingen, historiken och divisionerna frågar window.Spoiler om en match
// ska döljas och ritar om när läget ändras. Läget sparas i webbläsaren och
// gäller alla sidor; en dold match kan visas ändå.
//
// Läses före sidornas egna skript. Allt ligger i en funktion så att inget
// krockar med deras $, esc och state.

(function () {
  const TZ = 'Europe/Stockholm';
  const KEY = 'profeterna.spoiler';
  const DAY = 86400000;
  const PICK_DAYS = 14; // så långt bakåt kan brytpunkten väljas
  const SHIELD = '<svg class="sp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 3l7 3v5c0 4.5-3 8.4-7 9.6C8 19.4 5 15.5 5 11V6z"/><path d="M9.2 12.1l1.9 1.9 3.8-4"/></svg>';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  // ---------- dagar (svensk tid) ----------

  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  function dayOf(t) {
    const p = {};
    for (const x of ymd.formatToParts(new Date(t))) p[x.type] = x.value;
    return `${p.year}-${p.month}-${p.day}`;
  }
  const fLong = new Intl.DateTimeFormat('sv-SE', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'short' });
  function dayLabel(d, now = Date.now()) {
    if (d === dayOf(now)) return 'Idag';
    if (d === dayOf(now - DAY)) return 'Igår';
    const s = fLong.format(new Date(`${d}T12:00:00Z`)).replace('.', '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const shortDay = (d) => `${Number(d.slice(8, 10))}/${Number(d.slice(5, 7))}`;

  // ---------- läget ----------
  // mode: off | auto (senaste dygnet) | custom (från dagen from)
  // shown: matcher (id) eller annat (nyckel) som visats ändå → när

  function read() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* inget */ }
    s = s || {};
    const shown = {};
    for (const [k, t] of Object.entries(s.shown || {})) if (Date.now() - t < 30 * DAY) shown[k] = t;
    return {
      mode: s.mode === 'auto' || s.mode === 'custom' ? s.mode : 'off',
      from: /^\d{4}-\d{2}-\d{2}$/.test(s.from || '') ? s.from : null,
      shown,
    };
  }
  let S = read();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* privat läge: gäller bara sidan */ }
  }
  const from = () => S.from || dayOf(Date.now() - DAY);

  // Döljs en match som startade vid kickoff (ISO eller ms) just nu? En match
  // som inte startat har inget resultat att avslöja.
  function hides(kickoff, now = Date.now()) {
    if (S.mode === 'off' || kickoff == null) return false;
    const t = typeof kickoff === 'number' ? kickoff : Date.parse(kickoff);
    if (!Number.isFinite(t) || t > now) return false;
    if (S.mode === 'custom') return dayOf(t) >= from();
    return now - t < DAY;
  }
  // Bara ett datum (formen, historiken utan matchid): dagen döljs om den kan
  // ha en dold match – i dygnsläget idag och igår.
  function hidesDay(date, now = Date.now()) {
    if (S.mode === 'off' || !date) return false;
    const d = String(date).slice(0, 10);
    if (d > dayOf(now)) return false;
    return d >= (S.mode === 'custom' ? from() : dayOf(now - DAY));
  }
  const isShown = (key) => Boolean(S.shown[key]);
  const off = (m) => /POSTPONED|CANCEL|ABANDON|SUSPEND/.test(m.status || '');
  // Matchen { id, kickoff } döljs och har inte visats ändå.
  const hidden = (m) => Boolean(m) && !off(m) && hides(m.kickoff) && !isShown(m.id);

  // ---------- matcherna ----------
  // Startsidan lämnar över sin lista; andra sidor hämtar den bara när
  // skyddet är på och de behöver den.

  let list = null;
  let byId = null;
  let loading = null;
  function useMatches(ms) {
    list = ms || [];
    byId = null;
  }
  function matches() {
    if (list) return Promise.resolve(list);
    if (!loading) {
      loading = fetch('data/matches.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!list) useMatches(d ? d.matches : []); return list; })
        .catch(() => { loading = null; return []; });
    }
    return loading;
  }
  // Döljs matchen med id? null om matchen är okänd (listan inte hämtad).
  function hiddenId(id) {
    if (!list) return null;
    if (!byId) byId = new Map(list.map((m) => [m.id, m]));
    const m = byId.get(String(id));
    return m ? hidden(m) : null;
  }

  // ---------- byggstenar för sidorna ----------

  function chip(text = 'dolt') {
    return `<span class="sp-chip" title="Dolt – du har valt att dölja resultat">${SHIELD}${esc(text)}</span>`;
  }
  // Kort med knappen som visar det dolda: keys är matchid eller egna nycklar.
  function card({ title, text, keys, button = 'Visa ändå' }) {
    return `<div class="sp-card">${SHIELD}<div class="sp-msg"><strong>${esc(title)}</strong>` +
      `${text ? `<span>${esc(text)}</span>` : ''}</div>` +
      `<button type="button" class="sp-show" data-sp-show="${esc(keys.join(' '))}">${esc(button)}</button></div>`;
  }

  // ---------- ändringar ----------

  const listeners = [];
  function emit() {
    sync();
    for (const fn of listeners) {
      try { fn(); } catch (err) { console.error(err); }
    }
  }
  function show(keys) {
    for (const k of keys) S.shown[k] = Date.now();
    save();
    emit();
  }
  function setMode(mode, day) {
    S.mode = mode;
    if (mode === 'custom') S.from = day || from();
    S.shown = {}; // nytt läge = allt döljs igen
    save();
    emit();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sp-show]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    show(b.dataset.spShow.split(' ').filter(Boolean));
  });
  // Samma läge i alla flikar.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { S = read(); emit(); }
  });

  // ---------- knappen och panelen ----------

  let btn = null;
  let panel = null;

  function mount() {
    const bar = document.querySelector('.topbar-inner');
    if (!bar) return;
    const box = document.createElement('div');
    box.className = 'sp-ctl';
    box.innerHTML = '<button type="button" class="sp-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="sp-panel">' +
      `${SHIELD}<span class="sp-state"></span></button>` +
      '<div class="sp-panel" id="sp-panel" role="dialog" aria-labelledby="sp-title" hidden></div>';
    bar.appendChild(box);
    btn = box.querySelector('.sp-btn');
    panel = box.querySelector('.sp-panel');
    btn.addEventListener('click', () => (panel.hidden ? open() : close()));
    // Panelen ritas om vid varje val – fokus flyttas tillbaka till valet.
    panel.addEventListener('click', (e) => {
      const o = e.target.closest('[data-sp-mode]');
      if (o) {
        setMode(o.dataset.spMode);
        panel.querySelector('[aria-checked="true"]').focus();
      }
      if (e.target.closest('.sp-x')) close(true);
    });
    panel.addEventListener('change', (e) => {
      if (!e.target.matches('select')) return;
      setMode('custom', e.target.value);
      panel.querySelector('select').focus();
    });
    // composedPath: det klickade valet kan redan vara ersatt när klicket når hit.
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !e.composedPath().includes(box)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) close(true);
    });
    sync();
  }

  function open() {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    paint();
    const cur = panel.querySelector('[aria-checked="true"]');
    if (cur) cur.focus();
  }
  function close(focus) {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (focus) btn.focus();
  }

  function sync() {
    if (!btn) return;
    const label = S.mode === 'off' ? 'Av' : S.mode === 'auto' ? '24 h' : `fr. ${shortDay(from())}`;
    btn.classList.toggle('is-on', S.mode !== 'off');
    btn.querySelector('.sp-state').textContent = label;
    btn.title = `Dölj resultat: ${S.mode === 'off' ? 'av' : S.mode === 'auto' ? 'det senaste dygnet' : `från ${dayLabel(from()).toLowerCase()}`}`;
    btn.setAttribute('aria-label', btn.title);
    if (panel && !panel.hidden) paint();
  }

  function paint() {
    const opt = (mode, label) => `<button type="button" class="sp-opt" role="radio" data-sp-mode="${mode}" aria-checked="${S.mode === mode}">` +
      `<span class="sp-radio" aria-hidden="true"></span>${esc(label)}</button>`;
    const now = Date.now();
    const days = [];
    for (let i = 0; i < PICK_DAYS; i++) days.push(dayOf(now - i * DAY));
    if (S.from && !days.includes(S.from)) days.push(S.from);
    panel.innerHTML = '<div class="sp-head"><h3 id="sp-title">Dölj resultat</h3>' +
      '<button type="button" class="sp-x" aria-label="Stäng">×</button></div>' +
      '<div class="sp-opts" role="radiogroup" aria-labelledby="sp-title">' +
      opt('off', 'Visa allt') + opt('auto', 'Senaste dygnet') + opt('custom', 'Från en viss dag') + '</div>' +
      (S.mode === 'custom'
        ? '<label class="sp-field"><span>Dölj från och med</span><select>' +
          days.map((d) => `<option value="${d}"${d === from() ? ' selected' : ''}>${esc(dayLabel(d, now))}</option>`).join('') +
          '</select></label>'
        : '') +
      '<p class="sp-status"></p>';
    status();
  }

  // Raden längst ned: hur mycket som döljs just nu.
  async function status() {
    const el = panel.querySelector('.sp-status');
    if (S.mode === 'off') { el.textContent = ''; return; }
    const ms = await matches();
    const n = ms.filter((m) => hidden(m)).length;
    if (!panel.contains(el)) return; // panelen har ritats om under tiden
    el.textContent = !n ? 'Inget att dölja' : n === 1 ? '1 match dold' : `${n} matcher dolda`;
  }

  window.Spoiler = {
    on: () => S.mode !== 'off',
    hides,
    hidesDay,
    hidden,
    hiddenId,
    isShown,
    show,
    matches,
    useMatches,
    chip,
    card,
    onChange: (fn) => listeners.push(fn),
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
