import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const workspace = mkdtempSync(join(tmpdir(), 'smoketape-package-'));

function collectTargets(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectTargets);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectTargets);
  return [];
}

try {
  const packOutput = execFileSync(
    'npm',
    ['pack', '--json', '--pack-destination', workspace],
    { cwd: root, encoding: 'utf8' },
  );
  const [packed] = JSON.parse(packOutput);
  const tarball = join(workspace, packed.filename);
  const contents = new Set(
    execFileSync('tar', ['-tf', tarball], { encoding: 'utf8' })
      .trim()
      .split('\n'),
  );
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const advertisedTargets = [
    ...collectTargets(manifest.main),
    ...collectTargets(manifest.bin),
    ...collectTargets(manifest.exports),
    ...collectTargets(manifest.types),
  ].filter((target) => target.startsWith('./'));

  assert(advertisedTargets.length > 0, 'package.json does not advertise any package targets');
  for (const target of new Set(advertisedTargets)) {
    const packedPath = `package/${target.slice(2)}`;
    assert(contents.has(packedPath), `packed artifact is missing advertised target: ${target}`);
  }

  const consumer = join(workspace, 'consumer');
  execFileSync('mkdir', ['-p', consumer]);
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball],
    { cwd: consumer, stdio: 'inherit' },
  );
  writeFileSync(join(consumer, 'index.ts'), "import 'smoketape';\n");
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        noEmit: true,
        strict: true,
      },
      files: ['index.ts'],
    }),
  );
  execFileSync(
    join(root, 'node_modules', '.bin', 'tsc'),
    ['--project', join(consumer, 'tsconfig.json')],
    { cwd: consumer, stdio: 'inherit' },
  );

  console.log(`verified ${packed.filename}: package targets and TypeScript consumption`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
