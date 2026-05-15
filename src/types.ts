export type OutputAssertion = {
  contains?: string | string[];
  notContains?: string | string[];
  regex?: string | string[];
};

export type FileAssertion = {
  path: string;
  exists?: boolean;
  contains?: string | string[];
  notContains?: string | string[];
};

export type TapeStep = {
  name?: string;
  command: string | string[];
  cwd?: string;
  env?: Record<string, string | number | boolean>;
  stdin?: string;
  timeoutMs?: number;
  expect?: {
    exitCode?: number;
    stdout?: OutputAssertion;
    stderr?: OutputAssertion;
    files?: FileAssertion[];
  };
};

export type TapeConfig = {
  version?: 1;
  name?: string;
  description?: string;
  timeoutMs?: number;
  env?: Record<string, string | number | boolean>;
  redactions?: string[];
  allowHostCwd?: boolean;
  allowNetwork?: boolean;
  fixtures?: string | string[];
  steps: TapeStep[];
};

export type AssertionResult = {
  ok: boolean;
  target: string;
  assertion: string;
  message: string;
};

export type StepResult = {
  name: string;
  command: string | string[];
  cwd: string;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  assertions: AssertionResult[];
  ok: boolean;
};

export type TapeReport = {
  ok: boolean;
  name: string;
  tapePath: string;
  sandbox: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  allowNetwork: boolean;
  redacted: boolean;
  steps: StepResult[];
};
