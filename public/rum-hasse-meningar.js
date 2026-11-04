// Hasse Backes text i meningar. Han säger en mening i taget i tobaksaffären
// (rum-hasse.js), och Macen tar fram ljudet mening för mening
// (src/analyser/rost.mjs). Båda delar texten här, så att varje mening har sitt
// ljud. Inte vid "J. Smith", "t.ex." eller 2,56. Filen är både ett skript i
// sidan (window.HasseMeningar) och en modul för Node.
(function (meningar) {
  if (typeof module === 'object' && module.exports) module.exports = meningar;
  else window.HasseMeningar = meningar;
})(function meningar(t) {
  const delar = String(t).replace(/([.!?…]+["”»’']?)\s+(?=[\p{Lu}\d"“«])/gu, '$1\n').split('\n');
  const ut = [];
  for (const d of delar) {
    const f = ut[ut.length - 1];
    if (f && /(?:^|\s)(?:\p{Lu}|t\.ex|bl\.a|d\.v\.s|ca)\.$/u.test(f)) ut[ut.length - 1] = `${f} ${d}`;
    else if (d.trim()) ut.push(d.trim());
  }
  return ut;
});
