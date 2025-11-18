import * as esbuild from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const isDev = args.includes('--dev');
const isWatch = args.includes('--watch');

const srcDir = join(__dirname, 'src');
const outDir = join(__dirname, '..', '..', 'dist', 'apps', 'api');

// Single entry point for Fastify router
const entryPoint = join(srcDir, 'index.ts');

const buildOptions: esbuild.BuildOptions = {
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(outDir, 'index.mjs'),
  sourcemap: !isProduction,
  minify: isProduction,
  keepNames: true,
  external: [
    '@aws-sdk/*',
    'aws-sdk'
  ],
  banner: {
    js: `
// Lambda handler entry point
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      isProduction ? 'production' : isDev ? 'development' : 'production'
    )
  },
  logLevel: 'info'
};

async function build(): Promise<void> {
  try {
    if (isWatch) {
      const context = await esbuild.context(buildOptions);
      await context.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log(`Build complete! Output: ${outDir}`);
      console.log(`Entry point: ${entryPoint}`);
      console.log(`Output file: index.mjs`);
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
