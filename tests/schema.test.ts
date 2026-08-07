import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { loadTape } from '../src/schema.js';
import { SmoketapeError } from '../src/errors.js';

async function writeTape(contents: string): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'smoketape-schema-'));
  const tapePath = path.join(directory, 'tape.yml');
  await writeFile(tapePath, contents);
  return tapePath;
}

test('loads a representative tape with native js-yaml types', async () => {
  const tape = await loadTape(await writeTape([
    'version: 1',
    'name: parser compatibility',
    'timeoutMs: 2500',
    'fixtures: fixture.txt',
    'redactions: [secret]',
    'env:',
    '  RETRIES: 2',
    '  ENABLED: true',
    'steps:',
    '  - name: inspect fixture',
    '    command: [node, -e, "console.log(42)"]',
    '    expect:',
    '      exitCode: 0',
    '      stdout:',
    '        contains: ["42"]'
  ].join('\n')));

  assert.equal(tape.version, 1);
  assert.equal(tape.timeoutMs, 2500);
  assert.deepEqual(tape.env, { RETRIES: 2, ENABLED: true });
  assert.deepEqual(tape.steps[0]?.command, ['node', '-e', 'console.log(42)']);
});

test('preserves validation errors for invalid tape fields', async () => {
  const tapePath = await writeTape('version: 1\nsteps:\n  - command: 42\n');

  await assert.rejects(
    () => loadTape(tapePath),
    (error) => error instanceof SmoketapeError
      && error.code === 'INVALID_TAPE'
      && error.message === 'steps[0].command must be a string or string array'
  );
});

for (const document of ['', 'null\n', '- command: echo\n']) {
  test(`rejects non-object tape document ${JSON.stringify(document)}`, async () => {
    const tapePath = await writeTape(document);

    await assert.rejects(
      () => loadTape(tapePath),
      (error) => error instanceof SmoketapeError
        && error.code === 'INVALID_TAPE'
        && error.message === 'Tape must be a YAML object'
    );
  });
}
