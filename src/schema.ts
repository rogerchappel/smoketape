import yaml from 'js-yaml';
import { readFile } from 'node:fs/promises';
import { SmoketapeError } from './errors.js';
import type { TapeConfig, TapeStep } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringList(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return value;
  throw new SmoketapeError(`${field} must be a string or string array`, 'INVALID_TAPE');
}

function assertOutput(value: unknown, field: string): void {
  if (value === undefined) return;
  if (!isRecord(value)) throw new SmoketapeError(`${field} must be an object`, 'INVALID_TAPE');
  stringList(value.contains, `${field}.contains`);
  stringList(value.notContains, `${field}.notContains`);
  stringList(value.regex, `${field}.regex`);
}

function assertEnv(value: unknown, field: string): void {
  if (value === undefined) return;
  if (!isRecord(value)) throw new SmoketapeError(`${field} must be an object`, 'INVALID_TAPE');
  for (const [key, item] of Object.entries(value)) {
    if (!['string', 'number', 'boolean'].includes(typeof item)) {
      throw new SmoketapeError(`${field}.${key} must be a string, number, or boolean`, 'INVALID_TAPE');
    }
  }
}

function assertStep(step: unknown, index: number): asserts step is TapeStep {
  const field = `steps[${index}]`;
  if (!isRecord(step)) throw new SmoketapeError(`${field} must be an object`, 'INVALID_TAPE');
  if (!(typeof step.command === 'string' || (Array.isArray(step.command) && step.command.every((part) => typeof part === 'string')))) {
    throw new SmoketapeError(`${field}.command must be a string or string array`, 'INVALID_TAPE');
  }
  if (step.name !== undefined && typeof step.name !== 'string') throw new SmoketapeError(`${field}.name must be a string`, 'INVALID_TAPE');
  if (step.cwd !== undefined && typeof step.cwd !== 'string') throw new SmoketapeError(`${field}.cwd must be a string`, 'INVALID_TAPE');
  if (step.stdin !== undefined && typeof step.stdin !== 'string') throw new SmoketapeError(`${field}.stdin must be a string`, 'INVALID_TAPE');
  if (step.timeoutMs !== undefined && (typeof step.timeoutMs !== 'number' || step.timeoutMs < 1)) throw new SmoketapeError(`${field}.timeoutMs must be a positive number`, 'INVALID_TAPE');
  assertEnv(step.env, `${field}.env`);
  if (step.expect !== undefined) {
    if (!isRecord(step.expect)) throw new SmoketapeError(`${field}.expect must be an object`, 'INVALID_TAPE');
    if (step.expect.exitCode !== undefined && typeof step.expect.exitCode !== 'number') throw new SmoketapeError(`${field}.expect.exitCode must be a number`, 'INVALID_TAPE');
    assertOutput(step.expect.stdout, `${field}.expect.stdout`);
    assertOutput(step.expect.stderr, `${field}.expect.stderr`);
    if (step.expect.files !== undefined) {
      if (!Array.isArray(step.expect.files)) throw new SmoketapeError(`${field}.expect.files must be an array`, 'INVALID_TAPE');
      step.expect.files.forEach((file, fileIndex) => {
        if (!isRecord(file) || typeof file.path !== 'string') throw new SmoketapeError(`${field}.expect.files[${fileIndex}].path must be a string`, 'INVALID_TAPE');
        if (file.exists !== undefined && typeof file.exists !== 'boolean') throw new SmoketapeError(`${field}.expect.files[${fileIndex}].exists must be a boolean`, 'INVALID_TAPE');
        stringList(file.contains, `${field}.expect.files[${fileIndex}].contains`);
        stringList(file.notContains, `${field}.expect.files[${fileIndex}].notContains`);
      });
    }
  }
}

export async function loadTape(tapePath: string): Promise<TapeConfig> {
  const raw = await readFile(tapePath, 'utf8');
  const parsed = yaml.load(raw);
  if (!isRecord(parsed)) throw new SmoketapeError('Tape must be a YAML object', 'INVALID_TAPE');
  if (parsed.version !== undefined && parsed.version !== 1) throw new SmoketapeError('Only tape version 1 is supported', 'INVALID_TAPE');
  if (parsed.name !== undefined && typeof parsed.name !== 'string') throw new SmoketapeError('name must be a string', 'INVALID_TAPE');
  if (parsed.timeoutMs !== undefined && (typeof parsed.timeoutMs !== 'number' || parsed.timeoutMs < 1)) throw new SmoketapeError('timeoutMs must be a positive number', 'INVALID_TAPE');
  if (parsed.redactions !== undefined && !(Array.isArray(parsed.redactions) && parsed.redactions.every((item) => typeof item === 'string'))) throw new SmoketapeError('redactions must be a string array', 'INVALID_TAPE');
  if (parsed.fixtures !== undefined && !(typeof parsed.fixtures === 'string' || (Array.isArray(parsed.fixtures) && parsed.fixtures.every((item) => typeof item === 'string')))) throw new SmoketapeError('fixtures must be a string or string array', 'INVALID_TAPE');
  assertEnv(parsed.env, 'env');
  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) throw new SmoketapeError('steps must be a non-empty array', 'INVALID_TAPE');
  parsed.steps.forEach(assertStep);
  return parsed as TapeConfig;
}
