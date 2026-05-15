import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
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
