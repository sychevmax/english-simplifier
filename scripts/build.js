const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'dist');
  const assetsDir = path.join(outDir, 'assets');

  // Clean and recreate dist
  try {
    fs.rmSync(outDir, { recursive: true, force: true });
  } catch (e) { /* ignore */ }
  fs.mkdirSync(assetsDir, { recursive: true });

  try {
    // Build the React app entry (index.tsx)
    await esbuild.build({
      entryPoints: [path.join(root, 'index.tsx')],
      bundle: true,
      minify: true,
      sourcemap: false,
      format: 'esm',
      outfile: path.join(assetsDir, 'index.js'),
      loader: {
        '.png': 'file',
        '.jpg': 'file',
        '.svg': 'file',
        '.css': 'css',
        '.ts': 'ts',
        '.tsx': 'tsx'
      },
      define: { 'process.env.NODE_ENV': '"production"' },
      logLevel: 'info'
    });

    // Read index.html and replace the dev module import with the bundled file
    const indexPath = path.join(root, 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');

    indexHtml = indexHtml.replace(
      /<script[^>]*type=["']module["'][^>]*src=["']\/index\.tsx["'][^>]*><\/script>/,
      '<script type="module" src="/assets/index.js"></script>'
    );

    // Write modified index.html to dist
    fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');

    // Copy any referenced static files (e.g., vite.svg) if present
    const staticFiles = ['vite.svg'];
    staticFiles.forEach((file) => {
      const src = path.join(root, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(outDir, file));
      }
    });

    console.log('Build completed. dist/ created with bundled assets.');
    process.exit(0);
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
})();
