import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runTape } from '../src/runner.js';
import { renderJson, renderMarkdown } from '../src/reporter.js';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const fixture = (name: string) => path.join(root, 'tests/fixtures', name, 'tape.yml');

test('runs a passing tape', async () => {
  const report = await runTape(fixture('basic'));
  assert.equal(report.ok, true);
  assert.equal(report.steps[0]?.ok, true);
  assert.match(report.steps[0]?.stdout ?? '', /hello smoketape/);
});

test('captures failing assertions without throwing', async () => {
  const report = await runTape(fixture('failing'));
  assert.equal(report.ok, false);
  assert.equal(report.steps[0]?.assertions.some((item) => !item.ok && item.target === 'stdout'), true);
});

test('marks timed out commands as failed', async () => {
  const report = await runTape(fixture('timeout'));
  assert.equal(report.ok, false);
  assert.equal(report.steps[0]?.timedOut, true);
});

test('asserts created files inside sandbox', async () => {
  const report = await runTape(fixture('files'));
  assert.equal(report.ok, true);
  assert.equal(report.steps[0]?.assertions.filter((item) => item.target === 'artifact.txt').every((item) => item.ok), true);
});

test('redacts configured secrets before assertion and report output', async () => {
  const report = await runTape(fixture('redaction'));
  assert.equal(report.ok, true);
  assert.equal(report.redacted, true);
  assert.doesNotMatch(renderJson(report), /visible-secret/);
  assert.match(report.steps[0]?.stdout ?? '', /\[REDACTED\]/);
});

test('renders markdown proof reports', async () => {
  const report = await runTape(fixture('basic'));
  const markdown = renderMarkdown(report);
  assert.match(markdown, /# Smoketape Report/);
  assert.match(markdown, /PASS/);
});



test('passes stdin to commands', async () => {
  const report = await runTape(fixture('stdin'));
  assert.equal(report.ok, true);
  assert.match(report.steps[0]?.stdout ?? '', /got:input-value/);
});

test('runs argv array commands without a shell', async () => {
  const report = await runTape(fixture('argv'));
  assert.equal(report.ok, true);
  assert.match(report.steps[0]?.stdout ?? '', /array-ok/);
});

test('merges tape and step environment with network disabled marker', async () => {
  const report = await runTape(fixture('env'));
  assert.equal(report.ok, true);
  assert.match(report.steps[0]?.stdout ?? '', /tape:step:disabled/);
});

test('real CLI smoke writes JSON and markdown reports', async () => {
  await execFileAsync('npm', ['run', 'build'], { cwd: root });
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'smoketape-cli-test-'));
  const jsonPath = path.join(tmp, 'report.json');
  const mdPath = path.join(tmp, 'report.md');
  await execFileAsync('node', ['dist/src/index.js', 'run', 'fixtures/sample.yml', '--report', jsonPath, '--json'], { cwd: root });
  await execFileAsync('node', ['dist/src/index.js', 'run', 'fixtures/sample.yml', '--report', mdPath], { cwd: root });
  assert.equal(JSON.parse(await readFile(jsonPath, 'utf8')).ok, true);
  assert.match(await readFile(mdPath, 'utf8'), /Smoketape Report/);
});
