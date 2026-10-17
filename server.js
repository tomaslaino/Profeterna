'use strict';

// Lokal utvecklingsserver. Den publicerade sajten (profeterna.se) är statisk
// och byggs av GitHub Actions; här görs samma bygge lokalt var 15:e minut och
// _site/ serveras precis som GitHub Pages gör.

const express = require('express');
const { loadEnv } = require('./src/env');
const { build, OUT } = require('./src/build');

loadEnv();

const TICK_MINUTES = 15;

async function cycle() {
  try {
    const { results, site } = await build();
    const fetched = results.filter((r) => r.action === 'fetched').length;
    const errors = results.filter((r) => r.action === 'error');
    console.log(`[build] ${site.generatedAt}: ${fetched} källor hämtade, ${errors.length} fel, ${site.pages} matchsidor`);
    for (const e of errors) console.log(`        ${e.id}: ${e.error}`);
  } catch (err) {
    console.error('[build]', err);
  }
}

const app = express();
app.use(express.static(OUT));

const port = parseInt(process.env.PORT || '3001', 10);
app.listen(port, async () => {
  console.log(`Profeterna körs lokalt på http://localhost:${port}`);
  await cycle();
  setInterval(cycle, TICK_MINUTES * 60 * 1000);
});
