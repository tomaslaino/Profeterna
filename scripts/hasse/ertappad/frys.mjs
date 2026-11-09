// Öppnar Hasse i provservern, fryser honom och ritar en bild vid varje T (tidslinjen i rum-hasse-3d.js).
// PORT=8931 [D=2] [KLIPP='{"x":600,"y":40,"width":300,"height":260}'] node scripts/hasse/ertappad/frys.mjs UTMAPP namn 504,508.1
import { oppna } from '../cdp.mjs';
const [UT, namn, Ts] = process.argv.slice(2);
process.env.PORT = process.env.PORT || '8931';
const D = +(process.env.D || 1);
const c = await oppna({ W: 1280, H: 800, D });
await c.ga('/');
await c.vantaPa('document.body && document.body.dataset.rumKlar === "1"', 90000);
await c.sov(1000);
await c.ev('RumHasse.oppna()');
console.log('framme', await c.vantaPa('window.__H && __H.on && __H.rum.classList.contains("hasse-framme")', 30000));
await c.sov(800);
await c.ev('__H.on = false');
for (const t of Ts.split(',').map(Number)) {
  await c.ev(`__H.fig.rita(${t}, 10)`);
  await c.sov(250);
  await c.bild(`${UT}/${namn}-${t}.png`, process.env.KLIPP ? JSON.parse(process.env.KLIPP) : undefined);
}
console.log('fel', c.fel.slice(0, 5));
c.stang(); process.exit(0);
