import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] || '.';
const port = Number(process.argv[3] || process.env.PORT || 5173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function safeJoin(pathname) {
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
  return join(root, safePath);
}

function resolveTarget(pathname) {
  const filePath = safeJoin(pathname === '/' ? '/index.html' : pathname);
  if (existsSync(filePath)) {
    const stats = statSync(filePath);
    if (stats.isFile()) return filePath;
    if (stats.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      if (existsSync(indexPath)) return indexPath;
    }
  }

  const firstSegment = pathname.split('/').filter(Boolean)[0];
  const projectFallback = firstSegment ? join(root, firstSegment, 'index.html') : join(root, 'index.html');
  return existsSync(projectFallback) ? projectFallback : join(root, 'index.html');
}

createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const target = resolveTarget(decodeURIComponent(url.pathname));
  response.setHeader('Content-Type', types[extname(target)] || 'application/octet-stream');
  createReadStream(target)
    .on('error', () => {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    })
    .pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`へらすノート: http://localhost:${port}`);
});
