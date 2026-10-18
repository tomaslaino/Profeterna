'use strict';

// Spara-knappen för kupongen (Kupong → Ny kupong → Spara): tjänsten på
// Cloudflare som kontrollerar kodordet och committar kupongfilen
// (worker/kupong-proxy.mjs, driftsätts med worker/kupong.toml). Bygget skriver
// adressen i data/kuponger.json. Med enabled: false visar sidan bara
// GitHub-länken.

module.exports = {
  enabled: true,
  endpoint: 'https://profeterna-kupong.fritid-moln.workers.dev/kupong',
};
