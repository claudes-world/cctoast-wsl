#!/usr/bin/env node
import { build } from 'esbuild';
import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const isDev = !isProduction;

// Build configuration
const buildConfig = {
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'bin/cctoast-wsl',
  sourcemap: isDev,
  minify: isProduction,
  treeShaking: true,
  metafile: true, // Enable metafile for bundle analysis
  external: [], // Bundle all dependencies for CLI portability
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    ),
  },
  banner: {
    js: '#!/usr/bin/env node\n',
  },
};

try {
  console.log(`Building${isDev ? ' (development)' : ''} cctoast-wsl CLI...`);

  const result = await build(buildConfig);

  // Make the output executable
  chmodSync('bin/cctoast-wsl', 0o755);

  // Report build results
  const stats = result.metafile ? result.metafile : null;
  console.log('✓ Build completed successfully');

  if (stats) {
    const bundleSize = Math.round(
      Object.values(stats.outputs)[0]?.bytes / 1024
    );
    console.log(`Bundle size: ${bundleSize}KB`);

    if (bundleSize > 100) {
      console.warn('⚠️  Bundle size exceeds 100KB target');
    }
  }
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
