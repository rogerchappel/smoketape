import { cp, mkdtemp, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { SmoketapeError } from './errors.js';
import type { TapeConfig } from './types.js';

export async function createSandbox(tapePath: string, tape: TapeConfig, requestedRoot?: string): Promise<string> {
  const sandbox = requestedRoot ? path.resolve(requestedRoot) : await mkdtemp(path.join(os.tmpdir(), 'smoketape-'));
  await mkdir(sandbox, { recursive: true });
  const tapeDir = path.dirname(path.resolve(tapePath));
  const fixtures = tape.fixtures === undefined ? [] : Array.isArray(tape.fixtures) ? tape.fixtures : [tape.fixtures];
  for (const fixture of fixtures) {
    const source = path.resolve(tapeDir, fixture);
    const destination = path.join(sandbox, path.basename(fixture));
    assertInside(tapeDir, source, `Fixture path escapes tape directory: ${fixture}`);
    await cp(source, destination, { recursive: true, force: true, errorOnExist: false });
  }
  return sandbox;
}

export function resolveStepCwd(sandbox: string, cwd: string | undefined, allowHostCwd = false): string {
  const resolved = cwd ? path.resolve(sandbox, cwd) : sandbox;
  if (!allowHostCwd) assertInside(sandbox, resolved, `Step cwd escapes sandbox: ${cwd ?? '.'}`);
  return resolved;
}

export function resolveSandboxFile(sandbox: string, filePath: string): string {
  const resolved = path.resolve(sandbox, filePath);
  assertInside(sandbox, resolved, `File assertion escapes sandbox: ${filePath}`);
  return resolved;
}

export function assertInside(root: string, target: string, message: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return;
  throw new SmoketapeError(message, 'UNSAFE_PATH');
}
