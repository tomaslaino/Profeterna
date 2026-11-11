'use strict';

// ---------- Helgarderat på sajten ----------
//
// Sidan med tidningen Helgarderat (helgarderat.html). Tidningen själv, omslaget, kupongen och matchbladen, ritas av
// rum-tidning.js, samma som på pulten i rummet: det finns bara en tidning (2026-11-11, användarens önskemål: "Det ska
// alltså bara finnas en tidning"). Här hämtas numret och ritas tidningen ark för ark på den mörka disken, med omslaget
// förstorat så att det ryms på skärmen.

(function () {
  const rot = document.getElementById('hg');
  const RT = window.RumTidning;
  if (!rot || !RT) return;

  const passa = () => RT.passa(rot, Math.min(rot.clientWidth - 24, 940), window.innerHeight - 40);
  // En länk till en sida när den kommer in utifrån, också de gamla (#sida-5, #kupongen och #forsta).
  function tillLanken() {
    const h = location.hash.slice(1);
    const el = h && (document.getElementById(h) || document.getElementById(`hg-${h}`));
    if (el) el.scrollIntoView();
  }

  const skoldar = window.Skoldar ? Skoldar.ready : Promise.resolve();
  Promise.all([RT.hamta(), skoldar.catch(() => null)])
    .then(([u]) => {
      if (!u) throw new Error('inget nummer');
      rot.innerHTML = RT.tidning(u);
      rot.removeAttribute('aria-busy');
      passa();
      RT.bildfel(rot);
      addEventListener('resize', passa);
      tillLanken();
    })
    .catch((e) => {
      console.warn('Helgarderat:', e);
      rot.innerHTML = '<section class="hg-ark hg-fel"><p>Tidningen kunde inte hämtas.</p></section>';
      rot.removeAttribute('aria-busy');
    });
})();
