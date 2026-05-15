import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { initProject } from '../src/init.js';
import { explainReport } from '../src/explain.js';
import { runTape } from '../src/runner.js';
import { renderJson } from '../src/reporter.js';

const execFileAsync = promisify(execFile);

test('initProject writes starter tape and fixture', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'smoketape-init-test-'));
  const written = await initProject(tmp);
  assert.deepEqual(written, ['smoketape.yml', 'fixtures/hello/package.json', 'fixtures/hello/hello.mjs']);
  assert.match(await readFile(path.join(tmp, 'smoketape.yml'), 'utf8'), /hello-smoke/);
});

test('explainReport summarizes passing reports', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'smoketape-explain-test-'));
  const report = await runTape(path.join(process.cwd(), 'fixtures/sample.yml'));
  const reportPath = path.join(tmp, 'report.json');
  await import('node:fs/promises').then((fs) => fs.writeFile(reportPath, renderJson(report)));
  assert.match(await explainReport(reportPath), /PASS: smoketape-sample/);
});

test('CLI exits non-zero for failing tapes', async () => {
  await assert.rejects(
    () => execFileAsync('node', ['dist/src/index.js', 'run', 'tests/fixtures/failing/tape.yml', '--json'], { cwd: process.cwd() }),
    /Command failed/
  );
});
