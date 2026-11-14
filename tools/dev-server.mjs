// Local server for checking the build: static files with the real CSP, functions on an in memory store.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { memoryStore } from './test/memory-store.mjs';

process.env.SESSION_SECRET ||= 'b'.repeat(64);
process.env.ASSESSOR_PASSCODE ||= 'dev-passcode-1234';
globalThis.__W10_STORE__ = memoryStore();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const toml = readFileSync(join(root, 'netlify.toml'), 'utf8');
const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)[1];
const learner = (await import('../netlify/functions/learner.mjs')).default;
const assessor = (await import('../netlify/functions/assessor.mjs')).default;

// Cache rules from netlify.toml. Netlify's default for static files is max-age=0, must-revalidate.
const cacheRules = toml.split('[[headers]]').slice(1)
  .map((b) => ({ path: (b.match(/for = "([^"]+)"/) || [])[1], cache: (b.match(/Cache-Control = "([^"]+)"/) || [])[1] }))
  .filter((r) => r.path && r.cache);
const cacheFor = (path) => cacheRules.find((r) => (r.path.endsWith('/*') ? path.startsWith(r.path.slice(0, -1)) : r.path === path))?.cache || 'public, max-age=0, must-revalidate';
const stats = { files: 0, notModified: 0, api: 0 };

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Content-Security-Policy', csp);
  const handler = url.pathname === '/api/learner' ? learner : url.pathname === '/api/assessor' ? assessor : null;
  if (handler) {
    stats.api++;
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const out = await handler(request);
    const headers = {};
    out.headers.forEach((v, k) => { headers[k] = v; });
    const cookie = out.headers.get('set-cookie');
    if (cookie) headers['set-cookie'] = cookie;
    res.writeHead(out.status, headers);
    res.end(Buffer.from(await out.arrayBuffer()));
    return;
  }
  if (url.pathname === '/__test/stats') { res.end(JSON.stringify(stats)); return; }
  if (url.pathname === '/__test/stats/reset') { stats.files = 0; stats.notModified = 0; stats.api = 0; res.end('ok'); return; }
  if (url.pathname === '/__test/expire') {
    const store = globalThis.__W10_STORE__;
    for (const k of store._dump().keys()) {
      if (k.startsWith('work/')) { const w = await store.get(k); w.deadline = new Date(Date.now() - 1000).toISOString(); await store.setJSON(k, w); }
    }
    res.end('expired');
    return;
  }
  let file = join(root, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(join(root, 'public')) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  const data = readFileSync(file);
  const etag = `"${createHash('sha1').update(data).digest('hex').slice(0, 16)}"`;
  const headers = { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': cacheFor(url.pathname), etag };
  stats.files++;
  if (req.headers['if-none-match'] === etag) { stats.notModified++; res.writeHead(304, headers); res.end(); return; }
  res.writeHead(200, headers);
  res.end(data);
}).listen(8899, () => console.log('dev server on 8899'));
