'use strict';

// Höjdpunkterna: länkar till Viaplays gratis sammandrag, som repriserna på
// gravergrav.se. Bygget knyter klippen till matcherna (src/hojdpunkter.js);
// app.js ritar spelikonen på matchraden (m.v, det längsta klippet) och
// knapparna i matchrutans rubrik (d.highlights, högst två längder).
//
// Viaplay tillåter inte att spelaren visas inuti sajten (X-Frame-Options:
// DENY), så klippet öppnas i ett litet eget fönster ovanpå sidan – samma
// fönster för nästa klipp. På telefon och surfplatta i en ny flik.
//
// Matchraden är en knapp som öppnar matchrutan – ikonen på den öppnar i
// stället klippet. Med tangentbordet nås klippet i matchrutan.

(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.5 5.6v12.8L18.8 12z" fill="currentColor"/></svg>';
  const mins = (s) => `${Math.max(1, Math.round((s || 0) / 60))} min`;
  const live = (h) => h && h.url && !(h.until && Date.parse(h.until) <= Date.now());

  function row(m) {
    const v = m && m.v;
    if (!v || !v.u) return '';
    return `<span class="hl-play" data-hl="${esc(v.u)}" title="Höjdpunkter${v.s ? `, ${mins(v.s)}` : ''} · Viaplay" aria-hidden="true">${PLAY}</span>`;
  }

  function head(d) {
    const list = ((d && d.highlights) || []).filter(live);
    if (!list.length) return '';
    return '<div class="hl-links">' + list.map((h, i) =>
      `<a class="hl-btn${i ? ' alt' : ''}" href="${esc(h.url)}" data-hl="${esc(h.url)}" target="_blank" rel="noopener" title="Viaplay · gratis med reklam">` +
      `${i ? '' : `${PLAY}<span>Höjdpunkter</span>`}<span class="hl-len">${mins(h.sec)}</span></a>`).join('') + '</div>';
  }

  // Ett 16:9-fönster mitt över sidan på datorn, annars en ny flik.
  function open(url) {
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

  // Före radens egen klickhanterare (fångas på vägen ner). Cmd-, Ctrl- och
  // mittenklick på knapparna i rutan öppnar en flik som vanligt.
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('[data-hl]');
    if (!el) return;
    if (el.tagName === 'A' && (e.metaKey || e.ctrlKey || e.shiftKey || e.button)) return;
    e.preventDefault();
    e.stopPropagation();
    open(el.dataset.hl);
  }, true);

  window.Hojdpunkter = { row, head };
}());
