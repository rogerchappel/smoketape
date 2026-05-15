# PRD: smoketape

Status: in-progress
Decision: build now

## Pitch

`smoketape` records tiny, deterministic CLI smoke tests as readable YAML tapes, then replays them against local fixtures so agents can prove a tool still behaves before they ship it. It is a little flight recorder for command-line confidence. 🎞️

## Why It Matters

Developer tools often have unit tests but weak end-to-end proof. Agent-built repos especially need a cheap way to demonstrate: "this command ran, these files appeared, this output matched, and no network was touched." Shell scripts work, but they are hard to inspect, hard to summarize, and easy to make non-deterministic.

`smoketape` turns CLI verification into portable evidence: commands, env, cwd, expected exit codes, stdout/stderr assertions, file assertions, and a Markdown/JSON report.

## Qualification

### Pub Test

"Snapshot-style smoke tests for CLIs: write a small tape, replay it locally, and hand agents a proof report."

### Source / Inspiration

Inspired by Roger's OSS factory quality bar, local fixture-backed smokes across the existing repo garden, and classic terminal recording/snapshot testing ideas. It does not copy any external implementation.

### V1 Scope

- TypeScript CLI package.
- `smoketape init` writes `smoketape.yml` and `fixtures/` examples.
- `smoketape run <tape>` executes steps in a temp sandbox by default.
- YAML tape schema for commands, env, stdin, expected exit code, output contains/regex/not-contains, and file exists/contains/not-contains assertions.
- Safety defaults: no network mode flag, command timeout, cwd sandboxing, clear opt-in for host paths.
- `--json` and Markdown proof reports.
- Fixture-backed tests for passing, failing, timeout, redaction, and file assertions.
- Real CLI smoke that runs a sample tape against a tiny fixture command.

## Out of Scope

- Full terminal TTY recording/playback.
- Browser automation.
- Distributed test execution.
- Executing untrusted tapes without review.

## CLI Sketch

```bash
smoketape init
smoketape run smoketape.yml --report reports/smoke.md
smoketape run fixtures/failing.yml --json
smoketape explain reports/smoke.json
```

## Verification

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, `bash scripts/validate.sh`, and one real CLI smoke using fixture tapes.

## Agent Prompt

Build `smoketape` as a local-first TypeScript CLI for deterministic command smoke tests. Keep the schema small, readable, and safe. Produce useful JSON/Markdown evidence reports and strong fixture coverage.
