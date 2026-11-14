import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// web/public/ holds the pages not yet moved to React; they are copied to dist/ unchanged.
// Each web/*.html is a React page and is built into dist/ under the same name.
const root = resolve(import.meta.dirname, 'web');
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f.replace(/\.html$/, ''), resolve(root, f)]),
);

export default defineConfig({
  root,
  appType: 'mpa',
  plugins: [
    react(),
    {
      // The home page is still a static page in web/public, so point "/" at it during development.
      name: 'serve-public-home-page',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url.startsWith('/?')) req.url = '/index.html' + req.url.slice(1);
          next();
        });
      },
    },
  ],
  server: { port: 4400 },
  preview: { port: 4400 },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'app', // keep bundles apart from the site's own assets/ folder
    rollupOptions: { input: pages },
  },
});
