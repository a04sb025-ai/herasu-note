import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('404.html', 'dist/404.html');
await cp('.nojekyll', 'dist/.nojekyll');
await cp('src', 'dist/src', { recursive: true });
await cp('manifest.webmanifest', 'dist/manifest.webmanifest');
await cp('sw.js', 'dist/sw.js');
await cp('icons', 'dist/icons', { recursive: true });
console.log('Built static app into dist/');
