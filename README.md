# smoketape

Tiny, deterministic smoke tests for CLIs. Write a readable YAML tape, replay it in a local temp sandbox, and get proof that a command ran, output matched, files appeared, and secrets were redacted. 🎞️

`smoketape` is built for agent-made developer tools where a unit test is not quite enough and a hand-written shell script is too opaque.

## Install

```bash
npm install -D smoketape
npx smoketape init
```

For local development in this repo:

```bash
npm install
npm run build
node dist/src/index.js run fixtures/sample.yml --report reports/sample.md
```

## CLI

```bash
smoketape init
smoketape run smoketape.yml --report reports/smoke.md
smoketape run fixtures/sample.yml --json
smoketape explain reports/smoke.json
```

## Tape schema

```yaml
version: 1
name: my-cli-smoke
timeoutMs: 5000
fixtures: fixtures/demo
redactions:
  - ${SECRET_VALUE}
steps:
  - name: run the command
    command: node demo/cli.mjs --name Roger
    env:
      CI: true
    expect:
      exitCode: 0
      stdout:
        contains: "hello Roger"
        regex: "hello\\s+Roger"
        notContains: "SECRET"
      stderr:
        notContains: "UnhandledPromiseRejection"
      files:
        - path: output.txt
          exists: true
          contains: "Roger"
```

Commands can be shell strings or argv arrays:

```yaml
command: ["node", "demo/cli.mjs", "--help"]
```

## Safety model

- Runs in a temp sandbox by default.
- Fixture paths must stay under the tape directory.
- Step `cwd` and file assertions cannot escape the sandbox unless `--allow-host-cwd` is explicitly set.
- Per-step timeouts default to 10 seconds.
- Common proxy env vars are removed and `SMOKETAPE_NETWORK=disabled` is set unless `--allow-network` is passed.
- Reports redact configured values and common token-looking strings.

This is a local smoke-test tool, not a secure untrusted-code sandbox. Review tapes before running them.

## Reports

Markdown reports are human-friendly evidence for PRs and agent handoffs. JSON reports are stable enough for automation:

```bash
smoketape run smoketape.yml --report reports/smoke.json --json
smoketape explain reports/smoke.json
```

## Source and inspiration

Inspired by Roger's OSS factory quality bar, local fixture-backed smokes across the repo garden, and classic terminal recording/snapshot testing ideas. It does not copy any external implementation.

## Development

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## License

MIT
