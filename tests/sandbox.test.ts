import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { SmoketapeError } from '../src/errors.js';
import { createSandbox } from '../src/sandbox.js';

test('rejects fixture paths with colliding sandbox basenames before staging', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'smoketape-collision-'));
  await mkdir(path.join(root, 'a', 'common'), { recursive: true });
  await mkdir(path.join(root, 'b', 'common'), { recursive: true });
  await writeFile(path.join(root, 'a', 'common', 'value.txt'), 'first\n');
  await writeFile(path.join(root, 'b', 'common', 'value.txt'), 'second\n');

  await assert.rejects(
    () => createSandbox(path.join(root, 'tape.yml'), { fixtures: ['a/common', 'b/common'], steps: [] }),
    (error) => error instanceof SmoketapeError
      && error.code === 'INVALID_TAPE'
      && /a\/common and b\/common/.test(error.message)
  );
});
