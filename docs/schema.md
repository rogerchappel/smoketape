# Tape Schema

A smoketape file is YAML with `version: 1` and a non-empty `steps` array.

## Top-level fields

- `name`: report title.
- `description`: human context for the tape.
- `timeoutMs`: default per-step timeout, expressed as a positive integer number of milliseconds no greater than `2147483647`, the Node.js timer maximum. Zero, negative, fractional, non-finite, and larger values are invalid.
- `env`: environment values merged into every step.
- `fixtures`: path or paths copied from beside the tape into the sandbox.
- `redactions`: literal strings replaced with `[REDACTED]` before reports are emitted.
- `allowHostCwd`: YAML boolean opt-in escape hatch for cwd outside the sandbox.
- `allowNetwork`: YAML boolean marker that network use is intended.

Both safety flags require literal YAML booleans (`true` or `false`). Quoted
strings, numbers, and null values are rejected as `INVALID_TAPE` before the
sandbox is created or a command runs.

## Step fields

- `name`: display name.
- `command`: shell string or argv array.
- `cwd`: sandbox-relative working directory.
- `env`: per-step environment values.
- `stdin`: text sent to the command.
- `timeoutMs`: per-step timeout override with the same positive-integer constraint as the top-level timeout, including the `2147483647` maximum.
- `expect.exitCode`: expected integer process exit status from `0` through `255`, default `0`.
- `expect.stdout` / `expect.stderr`: `contains`, `notContains`, and `regex` assertions. Regex values use JavaScript regular-expression syntax with multiline matching. Smoketape validates every pattern while loading the tape; an invalid pattern exits nonzero with a field-specific `INVALID_TAPE` error before creating a sandbox or running any step.
- `expect.files`: sandbox-relative file assertions.
