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
  const execution = await executeCommand(step.command, cwd, env, step.stdin, timeoutMs);
  const stdout = redactText(execution.stdout, tape.redactions ?? []);
  const stderr = redactText(execution.stderr, tape.redactions ?? []);
  const assertions: AssertionResult[] = [];
  const expectedExit = step.expect?.exitCode ?? 0;
  assertions.push(execution.exitCode === expectedExit ? { ok: true, target: 'exitCode', assertion: 'equals', message: `exit code ${expectedExit}` } : { ok: false, target: 'exitCode', assertion: 'equals', message: `expected ${expectedExit}, got ${execution.exitCode}` });
  assertions.push(...assertOutput('stdout', stdout.text, step.expect?.stdout));
  assertions.push(...assertOutput('stderr', stderr.text, step.expect?.stderr));
  assertions.push(...await assertFiles(sandbox, step.expect?.files));
  return {
    name: step.name ?? `step ${index + 1}`,
    command: step.command,
    cwd,
    exitCode: execution.exitCode,
    timedOut: execution.timedOut,
    durationMs: Math.round(performance.now() - started),
    stdout: stdout.text,
    stderr: stderr.text,
    assertions,
    ok: assertions.every((item) => item.ok) && !execution.timedOut
  };
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

function executeCommand(command: string | string[], cwd: string, env: NodeJS.ProcessEnv, stdin: string | undefined, timeoutMs: number): Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = Array.isArray(command)
      ? spawn(command[0] ?? '', command.slice(1), { cwd, env, shell: false })
      : spawn(command, { cwd, env, shell: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 500).unref();
    }, timeoutMs);
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => { stderr += `${error.message}\n`; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr, timedOut });
    });
    if (stdin !== undefined) child.stdin?.end(stdin);
    else child.stdin?.end();
  });
}
