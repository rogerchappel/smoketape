# Tape Schema

A smoketape file is YAML with `version: 1` and a non-empty `steps` array.

## Top-level fields

- `name`: report title.
- `description`: human context for the tape.
- `timeoutMs`: default per-step timeout.
- `env`: environment values merged into every step.
- `fixtures`: path or paths copied from beside the tape into the sandbox.
- `redactions`: literal strings replaced with `[REDACTED]` before reports are emitted.
- `allowHostCwd`: opt-in escape hatch for cwd outside the sandbox.
- `allowNetwork`: explicit marker that network use is intended.

## Step fields

- `name`: display name.
- `command`: shell string or argv array.
- `cwd`: sandbox-relative working directory.
- `env`: per-step environment values.
- `stdin`: text sent to the command.
- `timeoutMs`: per-step timeout override.
- `expect.exitCode`: expected numeric exit code, default `0`.
- `expect.stdout` / `expect.stderr`: `contains`, `notContains`, and `regex` assertions.
- `expect.files`: sandbox-relative file assertions.
