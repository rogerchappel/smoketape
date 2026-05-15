# smoketape Tasks

## MVP complete

- [x] Scaffold TypeScript CLI package with StackForge.
- [x] Define readable YAML tape schema for commands, env, stdin, output assertions, and file assertions.
- [x] Run steps in a temporary sandbox by default.
- [x] Copy local fixtures into the sandbox before execution.
- [x] Add conservative safety defaults: sandboxed cwd, timeout, scrubbed proxy env, explicit network flag.
- [x] Emit JSON and Markdown proof reports.
- [x] Implement `init`, `run`, and `explain` commands.
- [x] Add fixture-backed tests for pass, fail, timeout, redaction, and file assertions.
- [x] Add real CLI smoke coverage.
- [x] Document source inspiration, safety model, examples, and contribution flow.

## Follow-ups

- [ ] Add JSON Schema export for editor completion.
- [ ] Add optional JUnit output for CI dashboards.
- [ ] Add richer diff output for failed file assertions.
- [ ] Explore opt-in Docker/network isolation profiles.
