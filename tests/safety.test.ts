import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { runTape } from '../src/runner.js';
import { loadTape } from '../src/schema.js';
import { SmoketapeError } from '../src/errors.js';

const root = process.cwd();
const fixture = (name: string) => path.join(root, 'tests/fixtures', name, 'tape.yml');

test('rejects file assertions that escape the sandbox', async () => {
  await assert.rejects(() => runTape(fixture('unsafe-file')), /escapes sandbox/);
});

test('rejects step cwd values that escape the sandbox', async () => {
  await assert.rejects(() => runTape(fixture('unsafe-cwd')), /escapes sandbox/);
});

test('rejects unsupported tape versions', async () => {
  await assert.rejects(() => loadTape(fixture('invalid')), (error) => error instanceof SmoketapeError && error.code === 'INVALID_TAPE');
});

for (const stream of ['stdout', 'stderr'] as const) {
  test(`rejects invalid ${stream} regex before running a command`, async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'smoketape-invalid-regex-'));
    const tapePath = path.join(tmp, 'tape.yml');
    const markerPath = path.join(tmp, 'command-ran');
    const sideEffect = `require('node:fs').writeFileSync(${JSON.stringify(markerPath)}, '')`;
    await writeFile(tapePath, [
      'version: 1',
      'steps:',
      '  - command:',
      '      - node',
      '      - -e',
      `      - ${JSON.stringify(sideEffect)}`,
      '    expect:',
      `      ${stream}:`,
      "        regex: '['"
    ].join('\n'));

    await assert.rejects(
      () => runTape(tapePath),
      (error) => error instanceof SmoketapeError
        && error.code === 'INVALID_TAPE'
        && error.message === `steps[0].expect.${stream}.regex contains invalid regular expression "[": Unterminated character class`
    );
    await assert.rejects(() => stat(markerPath), (error: NodeJS.ErrnoException) => error.code === 'ENOENT');
  });
}
