import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { redactText } from '../src/redact.js';
import { renderJson, renderMarkdown } from '../src/reporter.js';
import { runTape } from '../src/runner.js';

test('default redaction stays fast on large benign output and preserves supported secrets', () => {
  const benign = 'x'.repeat(40_000);
  const started = performance.now();
  const result = redactText(`${benign}\nAPI_TOKEN=visible\nghp_${'a'.repeat(24)}\nsk-${'b'.repeat(24)}\nPASSWORD=hunter2`);
  assert.ok(performance.now() - started < 1_000, '40,000-character redaction should complete within one second');
  assert.equal(result.redacted, true);
  assert.match(result.text, new RegExp(`^${benign}`));
  assert.doesNotMatch(result.text, /visible|hunter2|ghp_|sk-/);
});

test('retains bounded stdout and stderr and reports truncation without leaking boundary secrets', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'smoketape-output-limit-'));
  const tapePath = path.join(tmp, 'tape.yml');
  const script = [
    "const pad = 'x'.repeat(65520)",
    "process.stdout.write(pad + ' API_TOKEN=boundary-secret ' + 'z'.repeat(2000))",
    "process.stderr.write(pad + ' ghp_aaaaaaaaaaaaaaaaaaaaaaaa ' + 'z'.repeat(2000))"
  ].join(';');
  await writeFile(tapePath, [
    'version: 1',
    'steps:',
    '  - command:',
    '      - node',
    '      - -e',
    `      - ${JSON.stringify(script)}`
  ].join('\n'));

  const report = await runTape(tapePath);
  const step = report.steps[0]!;
  assert.equal(step.stdoutTruncated, true);
  assert.equal(step.stderrTruncated, true);
  assert.ok(Buffer.byteLength(step.stdout) <= 65_536);
  assert.ok(Buffer.byteLength(step.stderr) <= 65_536);
  assert.doesNotMatch(renderJson(report), /boundary-secret|ghp_/);
  const markdown = renderMarkdown(report);
  assert.match(markdown, /stdout \(truncated at 65536 bytes\)/);
  assert.match(markdown, /stderr \(truncated at 65536 bytes\)/);
});
