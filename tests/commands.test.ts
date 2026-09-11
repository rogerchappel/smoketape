import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { initProject } from '../src/init.js';
import { explainReport } from '../src/explain.js';
import { runTape } from '../src/runner.js';
import { renderJson } from '../src/reporter.js';
import { loadTape } from '../src/schema.js';

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

test('CLI rejects malformed timeout values without running the tape', async () => {
  for (const value of ['1000junk', '1.5', '0', '-1', '', 'Infinity', 'NaN']) {
    await assert.rejects(
      () => execFileAsync('node', [
        'dist/src/index.js', 'run', 'tests/fixtures/basic/tape.yml', '--timeout-ms', value, '--json'
      ], { cwd: process.cwd() }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        const failure = error as Error & { code?: number; stderr?: string; stdout?: string };
        assert.equal(failure.code, 1, value);
        assert.match(failure.stderr ?? '', /--timeout-ms must be a positive integer no greater than 2147483647/, value);
        assert.equal(failure.stdout, '', value);
        return true;
      }
    );
  }
});

test('CLI accepts a positive integer timeout', async () => {
  const { stdout, stderr } = await execFileAsync('node', [
    'dist/src/index.js', 'run', 'tests/fixtures/basic/tape.yml', '--timeout-ms', '1000', '--json'
  ], { cwd: process.cwd() });

  assert.equal(stderr, '');
  assert.equal(JSON.parse(stdout).ok, true);
});


test('accepts the Node timer maximum for tape fields and the CLI flag', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'smoketape-timeout-boundary-'));
  const tapePath = path.join(tmp, 'boundary.yml');
  await writeFile(tapePath, `version: 1\nname: boundary\ntimeoutMs: 2147483647\nsteps:\n  - command: node -e "process.stdout.write('ok')"\n    timeoutMs: 2147483647\n`);
  const tape = await loadTape(tapePath);
  assert.equal(tape.timeoutMs, 2147483647);
  assert.equal(tape.steps[0]?.timeoutMs, 2147483647);
  const result = await execFileAsync('node', ['dist/src/index.js', 'run', tapePath, '--timeout-ms', '2147483647', '--json'], { cwd: process.cwd() });
  assert.match(result.stdout, /\"ok\"/);
  assert.doesNotMatch(result.stderr, /TimeoutOverflowWarning/);
});

test('rejects timeout values above the Node timer maximum', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'smoketape-timeout-reject-'));
  for (const field of ['timeoutMs', 'stepTimeoutMs']) {
    const tapePath = path.join(tmp, `${field}.yml`);
    const yaml = field === 'timeoutMs'
      ? `version: 1\ntimeoutMs: 2147483648\nsteps:\n  - command: node -e "process.stdout.write('ok')"\n`
      : `version: 1\nsteps:\n  - command: node -e "process.stdout.write('ok')"\n    timeoutMs: 2147483648\n`;
    await writeFile(tapePath, yaml);
    await assert.rejects(() => loadTape(tapePath), /positive integer no greater than 2147483647/);
  }
  await assert.rejects(
    () => execFileAsync('node', ['dist/src/index.js', 'run', 'fixtures/sample.yml', '--timeout-ms', '2147483648'], { cwd: process.cwd() }),
    /positive integer no greater than 2147483647/
  );
});
