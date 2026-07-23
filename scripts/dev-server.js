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

function fileIfExists(pathname) {
  if (!existsSync(pathname)) return null;
  const stats = statSync(pathname);
  return stats.isFile() ? pathname : null;
}

function resolveTarget(pathname) {
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const rootFile = fileIfExists(safeJoin(requestPath));
  if (rootFile) return rootFile;

  const publicFile = fileIfExists(join(root, 'public', normalize(requestPath).replace(/^\//, '')));
  if (publicFile) return publicFile;

  const firstSegment = pathname.split('/').filter(Boolean)[0];
  const withoutProject = firstSegment ? `/${pathname.split('/').filter(Boolean).slice(1).join('/')}` : requestPath;
  const projectFile = withoutProject === '/' ? null : fileIfExists(safeJoin(withoutProject));
  if (projectFile) return projectFile;

  const projectPublicFile = withoutProject === '/'
    ? null
    : fileIfExists(join(root, 'public', normalize(withoutProject).replace(/^\//, '')));
  if (projectPublicFile) return projectPublicFile;

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
