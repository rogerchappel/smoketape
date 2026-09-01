import { spawn } from 'node:child_process';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadTape } from './schema.js';
import { createSandbox, resolveStepCwd } from './sandbox.js';
import { assertFiles, assertOutput } from './assertions.js';
import { redactObject, redactText } from './redact.js';
import type { AssertionResult, StepResult, TapeConfig, TapeReport, TapeStep } from './types.js';

export type RunOptions = {
  sandbox?: string;
  timeoutMs?: number;
  allowHostCwd?: boolean;
  allowNetwork?: boolean;
};

export const OUTPUT_LIMIT_BYTES = 65_536;

export async function runTape(tapePath: string, options: RunOptions = {}): Promise<TapeReport> {
  const started = performance.now();
  const startedAt = new Date().toISOString();
  const absoluteTape = path.resolve(tapePath);
  const tape = await loadTape(absoluteTape);
  const allowNetwork = Boolean(options.allowNetwork || tape.allowNetwork);
  const sandbox = await createSandbox(absoluteTape, tape, options.sandbox);
  const steps: StepResult[] = [];
  let redacted = false;
  for (const [index, step] of tape.steps.entries()) {
    const result = await runStep(step, index, tape, sandbox, { ...options, allowNetwork });
    const redactedStep = redactObject(result, tape.redactions ?? []);
    redactedStep.value.stdout = limitRedacted(redactedStep.value.stdout);
    redactedStep.value.stderr = limitRedacted(redactedStep.value.stderr);
    steps.push(redactedStep.value);
    redacted = redacted || redactedStep.redacted;
  }
  const finishedAt = new Date().toISOString();
  const report: TapeReport = {
    ok: steps.every((step) => step.ok),
    name: tape.name ?? path.basename(absoluteTape),
    tapePath: absoluteTape,
    sandbox,
    startedAt,
    finishedAt,
    durationMs: Math.round(performance.now() - started),
    allowNetwork,
    redacted,
    steps
  };
  return report;
}

async function runStep(step: TapeStep, index: number, tape: TapeConfig, sandbox: string, options: RunOptions): Promise<StepResult> {
  const command = Array.isArray(step.command) ? step.command.join(' ') : step.command;
  const cwd = resolveStepCwd(sandbox, step.cwd, Boolean(options.allowHostCwd || tape.allowHostCwd));
  const timeoutMs = step.timeoutMs ?? options.timeoutMs ?? tape.timeoutMs ?? 10_000;
  const env = buildEnv(tape, step, Boolean(options.allowNetwork));
  const started = performance.now();
  const execution = await executeCommand(step.command, cwd, env, step.stdin, timeoutMs, tape.redactions ?? []);
  const stdout = limitRedacted(redactText(execution.stdout, tape.redactions ?? []).text);
  const stderr = limitRedacted(redactText(execution.stderr, tape.redactions ?? []).text);
  const assertions: AssertionResult[] = [];
  const expectedExit = step.expect?.exitCode ?? 0;
  assertions.push(execution.exitCode === expectedExit ? { ok: true, target: 'exitCode', assertion: 'equals', message: `exit code ${expectedExit}` } : { ok: false, target: 'exitCode', assertion: 'equals', message: `expected ${expectedExit}, got ${execution.exitCode}` });
  assertions.push(...assertOutput('stdout', stdout, step.expect?.stdout));
  assertions.push(...assertOutput('stderr', stderr, step.expect?.stderr));
  assertions.push(...await assertFiles(sandbox, step.expect?.files));
  return {
    name: step.name ?? `step ${index + 1}`,
    command: step.command,
    cwd,
    exitCode: execution.exitCode,
    timedOut: execution.timedOut,
    durationMs: Math.round(performance.now() - started),
    stdout,
    stderr,
    stdoutTruncated: execution.stdoutTruncated,
    stderrTruncated: execution.stderrTruncated,
    assertions,
    ok: assertions.every((item) => item.ok) && !execution.timedOut
  };
}

function limitRedacted(text: string): string {
  const value = Buffer.from(text);
  if (value.length <= OUTPUT_LIMIT_BYTES) return text;
  let limited = value.subarray(0, OUTPUT_LIMIT_BYTES).toString('utf8');
  while (Buffer.byteLength(limited) > OUTPUT_LIMIT_BYTES) limited = limited.slice(0, -1);
  return limited;
}

function buildEnv(tape: TapeConfig, step: TapeStep, allowNetwork: boolean): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) delete env[key];
  env.SMOKETAPE = '1';
  env.SMOKETAPE_NETWORK = allowNetwork ? 'allowed' : 'disabled';
  if (!allowNetwork) env.NO_PROXY = '*';
  for (const [key, value] of Object.entries(tape.env ?? {})) env[key] = String(value);
  for (const [key, value] of Object.entries(step.env ?? {})) env[key] = String(value);
  return env;
}

function executeCommand(command: string | string[], cwd: string, env: NodeJS.ProcessEnv, stdin: string | undefined, timeoutMs: number, redactions: string[]): Promise<{ exitCode: number | null; stdout: string; stderr: string; stdoutTruncated: boolean; stderrTruncated: boolean; timedOut: boolean }> {
  return new Promise((resolve) => {
    const useProcessGroup = process.platform !== 'win32';
    const child = Array.isArray(command)
      ? spawn(command[0] ?? '', command.slice(1), { cwd, env, shell: false, detached: useProcessGroup })
      : spawn(command, { cwd, env, shell: true, detached: useProcessGroup });
    const lookahead = Math.max(256, ...redactions.map((value) => Buffer.byteLength(value)));
    const stdout = createOutputCollector(OUTPUT_LIMIT_BYTES, lookahead);
    const stderr = createOutputCollector(OUTPUT_LIMIT_BYTES, lookahead);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      killCommand(child.pid, useProcessGroup, 'SIGTERM');
      setTimeout(() => killCommand(child.pid, useProcessGroup, 'SIGKILL'), 500).unref();
    }, timeoutMs);
    child.stdout?.on('data', (chunk: Buffer) => stdout.append(chunk));
    child.stderr?.on('data', (chunk: Buffer) => stderr.append(chunk));
    child.on('error', (error) => { stderr.append(Buffer.from(`${error.message}\n`)); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const stdoutResult = stdout.finish();
      const stderrResult = stderr.finish();
      resolve({ exitCode: code, stdout: stdoutResult.text, stderr: stderrResult.text, stdoutTruncated: stdoutResult.truncated, stderrTruncated: stderrResult.truncated, timedOut });
    });
    if (stdin !== undefined) child.stdin?.end(stdin);
    else child.stdin?.end();
  });
}

function createOutputCollector(limit: number, lookahead: number): { append(chunk: Buffer): void; finish(): { text: string; truncated: boolean } } {
  const chunks: Buffer[] = [];
  const retainedLimit = limit + lookahead;
  let retained = 0;
  let total = 0;
  return {
    append(chunk) {
      total += chunk.length;
      if (retained >= retainedLimit) return;
      const slice = chunk.subarray(0, retainedLimit - retained);
      chunks.push(slice);
      retained += slice.length;
    },
    finish() {
      const buffer = Buffer.concat(chunks, retained);
      return { text: buffer.subarray(0, limit + lookahead).toString('utf8'), truncated: total > limit };
    }
  };
}

function killCommand(pid: number | undefined, processGroup: boolean, signal: NodeJS.Signals): void {
  if (pid === undefined) return;
  try {
    process.kill(processGroup ? -pid : pid, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
  }
}
