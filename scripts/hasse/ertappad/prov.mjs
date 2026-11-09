// Provserver: repots public/ först, resten från matchfixarna.se, och window.__H = H i rum-hasse.js.
// node scripts/hasse/ertappad/prov.mjs 8931
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../public');
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.bin': 'application/octet-stream' };
const port = +(process.argv[2] || 8931);
http.createServer(async (q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROT, p);
  if (f.startsWith(ROT) && fs.existsSync(f) && fs.statSync(f).isFile()) {
    let b = fs.readFileSync(f);
    if (p === '/rum-hasse.js') b = Buffer.from(b.toString().replace(/(\n  const H = \{[^\n]*\n)/, '$1  window.__H = H;\n'));
    s.writeHead(200, { 'content-type': TYP[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    return s.end(b);
  }
  try {
    const r = await fetch('https://matchfixarna.se' + q.url);
    const b = Buffer.from(await r.arrayBuffer());
    s.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'no-store' });
    s.end(b);
  } catch (e) { s.writeHead(502); s.end(String(e)); }
}).listen(port, '127.0.0.1', () => console.log('prov på', port));
