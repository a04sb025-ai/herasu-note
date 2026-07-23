import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] || '.';
const port = Number(process.argv[3] || process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml' };

createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const safePath = normalize(pathname).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(root, safePath);
  const fallback = join(root, 'index.html');
  const target = existsSync(filePath) && statSync(filePath).isFile() ? filePath : fallback;
  response.setHeader('Content-Type', types[extname(target)] || 'application/octet-stream');
  createReadStream(target).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`へらすノート: http://localhost:${port}`);
});
