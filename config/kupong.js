'use strict';

// Spara-knappen för kupongen (Kupong → Ny kupong → Spara): tjänsten på
// Cloudflare som kontrollerar kodordet och committar kupongfilen
// (worker/kupong-proxy.mjs, driftsätts med worker/kupong.toml). Bygget skriver
// adressen i data/kuponger.json. Med enabled: false visar sidan bara
// GitHub-länken.
//
// Samma tjänst håller gängets egna tips inför samtalet (…/samtal,
// worker/samtal.mjs). gang = vilka som tippar, med initialerna som syns i
// samtalsunderlaget; tipsen visas när alla här har lämnat in.

module.exports = {
  enabled: true,
  endpoint: 'https://profeterna-kupong.fritid-moln.workers.dev/kupong',
  gang: [
    { id: 'DL', namn: 'Daniel Laino' },
    { id: 'DT', namn: 'Daniel Teijder' },
    { id: 'DJ', namn: 'Daniel Johansson' },
  ],
};
