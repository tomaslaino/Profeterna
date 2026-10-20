// Förklaringsrutan på startsidan: syns direkt när musen pekar på något med
// data-tip (rubrik i data-tip-head), och vid ett tryck på pekskärm. Samma
// utseende som på Divisioner (.dv-tip i divisioner.css). Har position: fixed
// så att matchrutans rullruta inte klipper den.
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const box = document.createElement('div');
  box.id = 'fk-tip';
  box.className = 'dv-tip';
  box.setAttribute('role', 'tooltip');
  box.hidden = true;
  document.body.appendChild(box);

  let cur = null;
  let touch = false;
  const hide = () => {
    if (cur) cur.removeAttribute('aria-describedby');
    cur = null;
    box.hidden = true;
  };
  const show = (el) => {
    if (el === cur) return;
    hide();
    cur = el;
    el.setAttribute('aria-describedby', 'fk-tip');
    // Matchrutan är en <dialog> i webbläsarens översta lager – rutan måste
    // ligga i den för att synas ovanpå.
    const host = el.closest('dialog[open]') || document.body;
    if (box.parentNode !== host) host.appendChild(box);
    const head = el.dataset.tipHead;
    box.innerHTML = (head ? `<b>${esc(head)}</b>` : '') + esc(el.dataset.tip);
    box.hidden = false;
    const r = el.getBoundingClientRect();
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    box.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8))}px`;
    box.style.top = `${r.bottom + 8 + h <= window.innerHeight ? r.bottom + 8 : Math.max(8, r.top - h - 8)}px`;
  };

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest('[data-tip]');
    if (el) show(el); else hide();
  });
  document.addEventListener('pointerdown', (e) => { touch = e.pointerType !== 'mouse'; });
  // Pekskärm: ett tryck visar förklaringen, ett till (eller ett tryck
  // någon annanstans) stänger den. Med mus stänger ett klick.
  document.addEventListener('click', (e) => {
    const el = touch && e.target.closest('[data-tip]');
    if (el && el !== cur) show(el); else hide();
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && e.target.matches(':focus-visible')) show(el);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true, capture: true });
  window.addEventListener('resize', hide);
})();
