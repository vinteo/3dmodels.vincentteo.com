import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, '..');
const distDir = path.resolve(frontendDir, 'dist');
const configPath = path.resolve(frontendDir, '../../config/models.config.json');

if (!fs.existsSync(distDir)) {
  console.error(`[generateRoutes] dist directory does not exist: ${distDir}`);
  process.exit(1);
}

const indexHtmlPath = path.resolve(distDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`[generateRoutes] index.html not found in ${distDir}`);
  process.exit(1);
}

const baseIndexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Load models from config/models.config.json
let models = [];
if (fs.existsSync(configPath)) {
  try {
    models = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.warn('[generateRoutes] Could not parse models.config.json:', err);
  }
}

// Built-in known model fallback IDs
const knownModelIds = new Set(['kumiko-keychain', 'kumiko-pattern-keychain']);
models.forEach((m) => {
  if (m.id) knownModelIds.add(m.id);
});

console.log(`[generateRoutes] Generating static routes for ${knownModelIds.size} models...`);

for (const modelId of knownModelIds) {
  const model = models.find((m) => m.id === modelId) || {
    id: modelId,
    name: modelId
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    description: 'Interactive 3D CAD model customizer and direct STL/STEP CAD export.'
  };

  const title = `${model.name} | Vincent Teo 3D Models`;
  const description =
    model.description ||
    'Interactive 3D CAD model customizer and direct STL/STEP CAD export powered by Replicad.';

  // Customize SEO/OpenGraph tags for this specific model route
  let customizedHtml = baseIndexHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
      `<meta property="og:title" content="${title}" />`
    )
    .replace(
      /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
      `<meta name="description" content="${description}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
      `<meta property="og:description" content="${description}" />`
    );

  // 1. Root-level slug file (e.g. dist/kumiko-keychain.html for GitHub Pages clean URLs)
  const slugHtmlFile = path.resolve(distDir, `${modelId}.html`);
  fs.writeFileSync(slugHtmlFile, customizedHtml, 'utf8');

  // 2. Directory index file (e.g. dist/kumiko-keychain/index.html)
  const slugDir = path.resolve(distDir, modelId);
  fs.mkdirSync(slugDir, { recursive: true });
  fs.writeFileSync(path.resolve(slugDir, 'index.html'), customizedHtml, 'utf8');

  // 3. /models/ subpath files (e.g. dist/models/kumiko-keychain.html & dist/models/kumiko-keychain/index.html)
  const modelsSubDir = path.resolve(distDir, 'models');
  fs.mkdirSync(modelsSubDir, { recursive: true });
  fs.writeFileSync(path.resolve(modelsSubDir, `${modelId}.html`), customizedHtml, 'utf8');
  const modelsModelDir = path.resolve(modelsSubDir, modelId);
  fs.mkdirSync(modelsModelDir, { recursive: true });
  fs.writeFileSync(path.resolve(modelsModelDir, 'index.html'), customizedHtml, 'utf8');

  console.log(`  ✓ Generated static routes for /${modelId}`);
}

// 4. Generate GitHub Pages SPA fallback 404.html
const spa404Html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>3D Models Customizer & Exporter | Vincent Teo</title>
    <script type="text/javascript">
      // Single Page Apps for GitHub Pages
      // MIT License - https://github.com/rafgraph/spa-github-pages
      var pathSegmentsToKeep = 0;
      var l = window.location;
      l.replace(
        l.protocol +
          '//' +
          l.hostname +
          (l.port ? ':' + l.port : '') +
          l.pathname
            .split('/')
            .slice(0, 1 + pathSegmentsToKeep)
            .join('/') +
          '/?/' +
          l.pathname
            .slice(1)
            .split('/')
            .slice(pathSegmentsToKeep)
            .join('/')
            .replace(/&/g, '~and~') +
          (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
          l.hash
      );
    </script>
  </head>
  <body></body>
</html>
`;

fs.writeFileSync(path.resolve(distDir, '404.html'), spa404Html, 'utf8');
console.log('  ✓ Generated SPA fallback 404.html');

// 5. Ensure .nojekyll exists
fs.writeFileSync(path.resolve(distDir, '.nojekyll'), '', 'utf8');
console.log('  ✓ Created .nojekyll');

// 6. Ensure CNAME exists
fs.writeFileSync(path.resolve(distDir, 'CNAME'), '3dmodels.vincentteo.com\n', 'utf8');
console.log('  ✓ Created CNAME (3dmodels.vincentteo.com)');

console.log('[generateRoutes] Completed successfully.');
