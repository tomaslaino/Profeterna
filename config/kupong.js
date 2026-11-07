'use strict';

// Spara-knappen för kupongen (Kupong → Ny kupong → Spara): tjänsten på
// Cloudflare som kontrollerar kodordet och committar kupongfilen
// (worker/kupong-proxy.mjs, driftsätts med worker/kupong.toml). Bygget skriver
// adressen i data/kuponger.json. Med enabled: false visar sidan bara
// GitHub-länken.
//
// Samma tjänst håller gängets egna tips inför samtalet (…/samtal,
// worker/samtal.mjs). gang = vilka som tippar, med initialerna som syns i
// samtalsunderlaget; tipsen visas när alla här har lämnat in. bild = porträttet
// som står i rutorna på kupongen och i underlaget i stället för initialerna.
//
// regel = hur många spikar (ett tecken), halvgarderingar (två) och
// helgarderingar (alla tre) en kupong har – var och ens när hen lämnar in och
// gängets. Gäller omgångar med lika många matcher som regeln (Stryktipsets
// tretton); null = ingen regel. Gängets kupong styrs av den men stoppas inte:
// följer den inte regeln frågar sidan först (gänget kan ha spelat något annat).
//
// efterAvspark = så många minuter efter avsparken som en match går att fylla i
// och ändra på gängets kupong (uppgörelsen, Ny kupong, Ändra och Ladda upp
// system) – så att kupongen kan föras in också när den spelades hos Svenska
// Spel i sista stund. Var och ens egna tips stänger fortfarande vid första
// avsparken, när allas tips visas. Bygget skriver värdet i data/kuponger.json
// och tjänsten (worker/kupong-proxy.mjs) kontrollerar detsamma.
//
// rummet = websocketen till tjänsten profeterna-rummet (worker/rummet.mjs,
// driftsätts med worker/rummet.toml): vilka i gänget som har tobaksaffären
// öppen och vad de pekar på, så att deras figurer tittar dit hos de andra
// (public/rum-folk.js). null = bara din egen figur.

module.exports = {
  enabled: true,
  endpoint: 'https://profeterna-kupong.fritid-moln.workers.dev/kupong',
  // Den publicerade sajten, som tjänsten och scripts/analyser/skriv.mjs läser.
  site: 'https://tomaslaino.github.io/Profeterna',
  gang: [
    { id: 'DL', namn: 'Daniel Laino', bild: 'profeterna/laino.jpg' },
    { id: 'DT', namn: 'Daniel Tejder', bild: 'profeterna/teijder.jpg' },
    { id: 'DJ', namn: 'Daniel Johansson', bild: 'profeterna/johansson.jpg' },
  ],
  regel: { spik: 4, halv: 5, hel: 4 },
  efterAvspark: 30,
  rummet: 'wss://profeterna-rummet.fritid-moln.workers.dev/rum',
};
