// import { oppna } from './cdp.mjs': egen headless Chrome (metal) på ledig port, hålls öppen tills stang()
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import net from 'node:net'; import path from 'node:path';
export const HERE = path.dirname(new URL(import.meta.url).pathname);
const ledig = () => new Promise((ok) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
export const sov = (ms) => new Promise((ok) => setTimeout(ok, ms));
export async function oppna({ W = 1440, H = 900, D = 1, mobil = false, tid = 280000 } = {}) {
  const dbg = await ledig(); const prof = path.join(HERE, 'chrome-' + dbg);
  const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--use-angle=metal', '--enable-unsafe-webgl', '--disable-gpu-watchdog', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  const stang = () => { try { ch.kill('SIGKILL'); } catch {} try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} };
  const tg = setTimeout(() => { console.error('tidsgräns'); stang(); process.exit(2); }, tid);
  let tabs; for (let i = 0; i < 80; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); if (tabs.length) break; } catch {} await sov(400); }
  const ws = new WebSocket((tabs.find((t) => t.url === 'about:blank') || tabs[0]).webSocketDebuggerUrl);
  await new Promise((ok) => { ws.onopen = ok; });
  let id = 0; const vant = new Map(); const fel = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && vant.has(m.id)) { vant.get(m.id)(m); vant.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') fel.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') fel.push(m.params.entry.text + ' ' + (m.params.entry.url || '')); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') fel.push(m.params.args.map((a) => a.value || a.description).join(' ')); };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; vant.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: +D, mobile: !!mobil });
  const port = process.env.PORT || 8765;
  const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) console.log('FEL', r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result?.result?.value; };
  const ga = async (sokv) => { await send('Page.navigate', { url: `http://127.0.0.1:${port}${sokv}` }); };
  const vantaPa = async (x, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(x)) return true; await sov(200); } return false; };
  const bild = async (ut, clip) => { const b = await send('Page.captureScreenshot', { format: ut.endsWith('.png') ? 'png' : 'jpeg', quality: 90, ...(clip ? { clip: { scale: 1, ...clip } } : {}) }); fs.writeFileSync(ut, Buffer.from(b.result.data, 'base64')); };
  return { send, ev, ga, vantaPa, bild, fel, sov, stang: () => { clearTimeout(tg); stang(); } };
}
