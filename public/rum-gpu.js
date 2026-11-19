// Med en skuggkarta kraschar grafikkort av typen PowerVR (Pixel 10 i Chrome):
// alltid vid bild 9–10, med drivrutinen (LoadTextureState) eller med ett
// grafikkort som hänger sig, och all 3D på sidan försvinner. Det spelar ingen
// roll hur ofta skuggorna räknas om, hur de filtreras, om bara bordet tar emot
// dem eller hur fort bilderna ritas; utan skuggkarta håller det. Där ritas 3D-
// delarna (rum-3d.js, rum-saker.js, rum-inredning.js och rum-dator.js)
// därför utan skuggor. ?rum-skuggor visar dem ändå, för att prova nya versioner
// av drivrutinen.
export function utanSkuggor(renderare) {
  if (/[?&]rum-skuggor\b/.test(location.search)) return false;
  const g = renderare.getContext();
  const d = g.getExtension('WEBGL_debug_renderer_info');
  return Boolean(d) && /PowerVR/i.test(String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)));
}

// three.js frågar efter varje grafikprogram efter dess fellogg (getProgramInfoLog och två
// getShaderInfoLog) och om det gick att länka. Det är frågor som väntar in grafikprocessen:
// under starten, när den har texturer och ritningar i kö, står huvudtråden still tills allt
// före är gjort, för ungefär hundra program i rummet (i en svag telefon 0,7 sekunder sammanlagt,
// 2026-11-18). Loggen behövs bara när något är fel, så den läses bara med ?rum-fel, där
// felrutan (rum-fel.js) visar den.
export function felkoll(renderare) {
  renderare.debug.checkShaderErrors = /[?&]rum-fel\b/.test(location.search);
}
