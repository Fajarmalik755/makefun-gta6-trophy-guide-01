// Vice City Platinum Playbook — tiny local server for app/ (Node 22, stdlib).
//
// Serves the guide's app/ folder on http://localhost:8080 so it can be tried
// in a desktop browser. Usage: `node serve.ts` or `node serve.ts --port 9000`.
// It only ever serves files from inside app/, and only over the local loopback
// interface — this is a development convenience, not a public web server.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The folder served, resolved next to this file.
const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

// Pick a port: --port <n> wins, anything invalid falls back to 8080.
// (8080 is the kit's usual local port for this competition's guides.)
const argv = process.argv.slice(2);
const flagAt = argv.indexOf('--port');
const wanted = flagAt === -1 ? 8080 : Number(argv[flagAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const target = new URL(req.url ?? '/', 'http://localhost');
  let path = target.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(join(appRoot, normalize(path)));
  if (file !== appRoot && !file.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store', // always serve fresh files while editing
  });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log('Vice City Platinum Playbook is on http://localhost:' + port);
});
