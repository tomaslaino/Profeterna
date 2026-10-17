'use strict';

// ============================================================================
// Regelkonfig för prognosmotorn (src/forecast.js, src/model.js).
//
// Allt som bestämmer en prognos ligger här, med en regelversion som anger
// datum. Samma data ger alltid samma prognos (även osäkerhetsintervallen –
// slumpen är seedad). Ändras något här som påverkar prognoserna ska
// versionen räknas upp; journalen (fas 3) visar vilken version som gjorde
// varje prognos.
//
// Fas 2: INGEN kandidatfaktor styr prognosen. Grundmodellen bygger enbart på
// mål efter 90 minuter. xG, skott, form, tabell, skador, inbördes möten och
// odds visas som underlag i matchvyn men prövas först walk-forward i fas 4 –
// samma krav som kandidatjakten i Gräva guld. Även modellens strukturval
// nedan (halveringstid, fönster, cupmatcher med i skattningen) är
// a priori-val, inte anpassade till utfallen; de prövas också i fas 4.
// ============================================================================

module.exports = {
  version: '2026-10-17.1',

  // --------------------------------------------------------------------------
  // Grundmodell: Dixon & Coles (1997). Varje lag har en anfalls- och en
  // försvarsparameter, gemensam hemmafördel och en korrektion (ρ) för låga
  // resultat (0–0, 1–0, 0–1, 1–1). Skattas med maximum likelihood på
  // tidsviktade matcher – två steg: först Poisson-parametrarna, sedan ρ givet
  // dem (vanlig förenkling; ρ påverkar bara de fyra låga resultaten).
  //
  // Alla fem nivåerna (Premier League–National League) skattas i EN modell,
  // så att lagens styrka hamnar på samma skala. Divisionerna kopplas ihop av
  // lag som flyttats upp eller ned (laget behåller sina parametrar, som
  // avklingar) och av cupmatcher mellan nivåer.
  // --------------------------------------------------------------------------
  model: {
    // Tidsavklingning: vikt = 0,5^(ålder i dagar / halfLifeDays). Dixon &
    // Coles fann ξ = 0,0065 per halvvecka optimalt i sina data ≈ halveringstid
    // ett år. Ett a priori-val – prövas mot alternativ i fas 4.
    halfLifeDays: 365,
    // Tidigare säsonger med i skattningen utöver innevarande (vikten för en
    // match fyra säsonger bak är ~1/16).
    historySeasons: 4,
    // Cupmatcher (resultat efter 90 minuter) ingår i skattningen med samma
    // vikt som ligamatcher – de är de enda direkta mötena mellan nivåerna
    // under en säsong. Förbehåll: storlag roterar i cuperna, vilket kan dra
    // ned deras skattade styrka marginellt (prövas i fas 4).
    includeCups: true,
    // Minsta viktade antal matcher för ett lag. Under gränsen är lagets
    // styrka okänd och prognosen blir "okänt" – den gissas inte.
    minEffectiveMatches: 6,
    // Resultatmatrisen räknas till och med så många mål per lag (massan
    // utanför är försumbar och normeras bort).
    maxGoals: 10,
    tolerance: 1e-7,
    maxIterations: 2000,

    // Kandidatreglage (fas 4). Standardvärdena nedan ÄR grundmodellen ovan –
    // de ändrar ingen prognos. Andra värden prövas walk-forward i
    // kandidatjakten (src/candidates.js) och används skarpt först när en
    // kandidat klarat kravet och fått en ny regelversion.
    //   homeAdvantage  'common' = en gemensam hemmafördel; 'perDivision' =
    //                  en per division, och cupmatcherna en egen
    //   cupWeight      cupmatchernas vikt mot ligamatcherna (1 = samma)
    //   shotsBlend     andel skott på mål i målen som skattas (0 = bara mål).
    //                  Skott på mål räknas om till mål med andelen mål per
    //                  skott på mål i underlaget före prognosdagen; matcher
    //                  utan skottdata skattas på målen.
    //   xgBlend        andel xG (Understat, bara Premier League) på samma sätt
    homeAdvantage: 'common',
    cupWeight: 1,
    shotsBlend: 0,
    xgBlend: 0,
  },

  // --------------------------------------------------------------------------
  // Lag under National League (nivå 6 och lägre, bara i FA-cupen) har ingen
  // lagdata hos de fria källorna. De slås ihop till ETT genomsnittslag
  // "under National League", skattat på alla sådana lags FA-cupmatcher hos
  // ESPN (från first round proper; kvalomgångarna saknas) – historiskt utfall
  // för samma nivå. Märks tydligt i matchvyn. Matcherna avklingar inte, eftersom
  // det är nivån och inte ett enskilt lag som skattas.
  // --------------------------------------------------------------------------
  lowerTier: {
    decay: false,
  },

  // --------------------------------------------------------------------------
  // Osäkerhet: Bayesiansk bootstrap – skattningen görs om `samples` gånger
  // med slumpvikter (Exp(1)) på matcherna, och spannet är de mittersta
  // `interval` av omskattningarnas sannolikheter. Fångar osäkerheten i lagens
  // styrka, inte modellfel. ρ hålls fast i omskattningarna. Räknas för
  // kommande matcher.
  // --------------------------------------------------------------------------
  uncertainty: {
    samples: 50,
    interval: 0.8,
    seed: 20261017,
  },

  // --------------------------------------------------------------------------
  // Baslinjer att mäta mot (byggprompten): modellen är bara värd något om den
  // slår (b), och den intressanta frågan över tid är om den slår (c).
  // --------------------------------------------------------------------------
  baselines: {
    // (a) Naiv: andelen hemmasegrar/oavgjorda/bortasegrar i divisionen under
    // de senaste `seasons` avslutade säsongerna. Cupmatcher: alla ligamatcher
    // på nivå 1–4 under samma säsonger (fri cuphistorik finns bara för FA-cupen
    // från 2021/22).
    naive: { seasons: 10 },
    // (b) Poisson på säsongens mål: anfall, försvar och hemmafördel skattade
    // enbart på innevarande säsongs matcher, utan historik, tidsvikt eller
    // ρ-korrektion. Kräver att båda lagen spelat minst `minMatches` matcher
    // och att de hänger ihop via årets matcher – annars okänt.
    season: { minMatches: 5 },
    // (c) Marknaden: odds omräknade till sannolikheter utan marginal med
    // Shins metod (Shin 1993; Štrumbelj 2014 fann den träffsäkrare än
    // proportionell normering för fotbollsodds, eftersom den tar hänsyn till
    // favorit–longshot-snedheten). Är summan av 1/odds ≤ 1 finns ingen
    // marginal att ta bort och sannolikheterna normeras bara.
    //   Ligorna: marknadssnittet hos football-data.co.uk (Avg, öppningsodds
    //   insamlade fre/tis) vid prognostillfället. Tuffaste referens för
    //   spelade matcher: Betfair Exchange vid stängning (BFEC).
    //   Cuperna: DraftKings via ESPN (enda fria källan för cupodds).
    market: { method: 'shin' },
  },

  // --------------------------------------------------------------------------
  // Cuper. Huvudprognosen gäller 90 minuter. Sannolikheten att gå vidare
  // härleds ur samma modell: oavgjort efter 90 → förlängning (30 min med
  // samma målfrekvens per minut, oberoende Poisson) och/eller straffar
  // (50/50 – inget fritt underlag för något annat).
  //
  // Regler 2026/27 (kontrollerat 2026-10-17 mot ESPN:s utfall 2025/26 och
  // pressuppgifter; FA:s och EFL:s regelböcker är inte lästa):
  //   FA-cupen: inga omspel från first round proper (sedan 2024/25) –
  //   förlängning och straffar i alla omgångar. Semifinal och final på
  //   Wembley.
  //   EFL-cupen: straffar direkt efter 90 minuter i alla omgångar före
  //   semifinal. Semifinalerna avgörs sammanlagt över två möten, med
  //   förlängning och straffar efter returen. Final på Wembley med
  //   förlängning och straffar.
  // ESPN:s flagga för neutral plan är inte satt för Wembley-matcherna
  // (2025/26), därför anges neutrala omgångar här.
  // --------------------------------------------------------------------------
  cups: {
    extraTimeShare: 30 / 90,
    penaltyHomeShare: 0.5,
    fac: { afterDraw: 'extra_time', twoLegRounds: [], neutralRounds: ['semifinals', 'final'] },
    lc: { afterDraw: 'penalties', extraTimeRounds: ['semifinals', 'final'], twoLegRounds: ['semifinals'], neutralRounds: ['final'] },
  },
};
