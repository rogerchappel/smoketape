import { access, readFile } from 'node:fs/promises';
import type { AssertionResult, FileAssertion, OutputAssertion } from './types.js';
import { resolveSandboxFile } from './sandbox.js';

function values(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function pass(target: string, assertion: string, message: string): AssertionResult {
  return { ok: true, target, assertion, message };
}

function fail(target: string, assertion: string, message: string): AssertionResult {
  return { ok: false, target, assertion, message };
}

export function assertOutput(target: 'stdout' | 'stderr', text: string, assertion?: OutputAssertion): AssertionResult[] {
  if (!assertion) return [];
  const results: AssertionResult[] = [];
  for (const expected of values(assertion.contains)) {
    results.push(text.includes(expected) ? pass(target, 'contains', `found ${JSON.stringify(expected)}`) : fail(target, 'contains', `missing ${JSON.stringify(expected)}`));
  }
  for (const forbidden of values(assertion.notContains)) {
    results.push(!text.includes(forbidden) ? pass(target, 'notContains', `did not find ${JSON.stringify(forbidden)}`) : fail(target, 'notContains', `found forbidden ${JSON.stringify(forbidden)}`));
  }
  for (const pattern of values(assertion.regex)) {
    const regex = new RegExp(pattern, 'm');
    results.push(regex.test(text) ? pass(target, 'regex', `matched /${pattern}/`) : fail(target, 'regex', `did not match /${pattern}/`));
  }
  return results;
}

export async function assertFiles(sandbox: string, assertions: FileAssertion[] = []): Promise<AssertionResult[]> {
  const results: AssertionResult[] = [];
  for (const assertion of assertions) {
    const file = resolveSandboxFile(sandbox, assertion.path);
    let exists = true;
    try { await access(file); } catch { exists = false; }
    const expectExists = assertion.exists ?? true;
    results.push(exists === expectExists ? pass(assertion.path, 'exists', expectExists ? 'file exists' : 'file is absent') : fail(assertion.path, 'exists', expectExists ? 'file missing' : 'file unexpectedly exists'));
    if (!exists) continue;
    const content = await readFile(file, 'utf8');
    for (const expected of values(assertion.contains)) {
      results.push(content.includes(expected) ? pass(assertion.path, 'contains', `found ${JSON.stringify(expected)}`) : fail(assertion.path, 'contains', `missing ${JSON.stringify(expected)}`));
    }
    for (const forbidden of values(assertion.notContains)) {
      results.push(!content.includes(forbidden) ? pass(assertion.path, 'notContains', `did not find ${JSON.stringify(forbidden)}`) : fail(assertion.path, 'notContains', `found forbidden ${JSON.stringify(forbidden)}`));
    }
  }
  return results;
}
