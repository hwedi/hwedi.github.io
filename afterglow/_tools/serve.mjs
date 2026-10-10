// A tiny local web server. It shows the site the way visitors get it: at /afterglow/, like on hwedi.tech.
// The other tools start it by themselves. Run it on its own when you want to click around before you ship.
//
//   cd afterglow/_tools
//   node serve.mjs                 then open http://localhost:4173/afterglow/   (Ctrl+C stops it)
//   PORT=8080 node serve.mjs       another port
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), site = path.resolve(here, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.gif': 'image/gif', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };

export function serve(port = 0) {
  const server = http.createServer((req, res) => {
    const send = (code, body, head = {}) => { res.writeHead(code, { 'Cache-Control': 'no-store', ...head }); res.end(body); };
    let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(400, 'bad address'); }
    if (p === '/' || p === '/afterglow') return send(302, '', { Location: '/afterglow/' });
    if (!p.startsWith('/afterglow/')) return send(404, 'not found');
    const parts = p.slice('/afterglow/'.length).split('/');
    // GitHub Pages does not publish names that start with "_" or "." (that is why _tools stays private), so neither does this
    if (parts.some(s => s.startsWith('_') || s.startsWith('.'))) return send(404, 'not published');
    let file = path.join(site, ...parts); if (file !== site && !file.startsWith(site + path.sep)) return send(404, 'not found');
    try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); return send(200, fs.readFileSync(file), { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' }); }
    catch (e) { return send(404, 'not found'); }
  });
  return new Promise((resolve, reject) => { server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/afterglow/`, close: () => new Promise(r => { server.closeAllConnections?.(); server.close(r); }) })); });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const s = await serve(+process.env.PORT || 4173); console.log('Afterglow is at ' + s.url.replace('127.0.0.1', 'localhost') + '    (Ctrl+C stops it)');
}
