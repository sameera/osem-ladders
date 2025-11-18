import * as esbuild from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join, parse, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const isDev = args.includes('--dev');
const isWatch = args.includes('--watch');

const srcDir = join(__dirname, 'src', 'handlers');
const outDir = join(__dirname, '..', '..', 'dist', 'apps', 'api');

interface Handler {
  in: string;
  out: string;
}

// Find all handler files
function findHandlers(dir: string): Handler[] {
  const handlers: Handler[] = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      handlers.push(...findHandlers(filePath));
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      // Get relative path from handlers directory
      const relativePath = filePath.substring(srcDir.length + 1);
      const { dir: handlerDir, name } = parse(relativePath);
      const outFile = handlerDir
        ? `${handlerDir}/${name}.js`
        : `${name}.js`;

      handlers.push({
        in: filePath,
        out: outFile
      });
    }
  }

  return handlers;
}

const handlers = findHandlers(srcDir);

// Create entry points object
const entryPoints = handlers.reduce<Record<string, string>>((acc, handler) => {
  acc[handler.out.replace('.js', '')] = handler.in;
  return acc;
}, {});

const buildOptions: esbuild.BuildOptions = {
  entryPoints,
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: outDir,
  outExtension: { '.js': '.mjs' },
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
      console.log(`Handlers built: ${Object.keys(entryPoints).length}`);
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
