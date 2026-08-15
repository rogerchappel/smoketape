# smoketape

Tiny, deterministic smoke tests for CLIs. Write a readable YAML tape, replay it in a local temp sandbox, and get proof that a command ran, output matched, files appeared, and secrets were redacted. 🎞️

`smoketape` is built for agent-made developer tools where a unit test is not quite enough and a hand-written shell script is too opaque.

## Install

The npm package has not been published yet. After the first successful registry release, install it with:

```bash
npm install -D smoketape
npx smoketape init
```

Until then, install from a checkout for local development:

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

## Programmatic API

Importing `smoketape` is side-effect free. The package root exports the tape runner,
report formatters, report explainer, and their TypeScript types:

```js
import { runTape, renderJson } from 'smoketape';

const report = await runTape('smoketape.yml');
console.log(renderJson(report));
```

The command-line executable is available separately through the `smoketape` binary.

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
- Per-step timeouts default to 10 seconds. On POSIX platforms, timeout cleanup signals the command's process group (including descendants) and escalates from `SIGTERM` to `SIGKILL` after a 500 ms grace period; other platforms terminate the direct child.
- Common proxy env vars are removed and `SMOKETAPE_NETWORK=disabled` is set unless `--allow-network` is passed.
- Reports redact configured values and common token-looking strings.

This is a local smoke-test tool, not a secure untrusted-code sandbox. Review tapes before running them.

## More docs

- [Tape schema](docs/schema.md)
- [Reports](docs/reports.md)
- [Safety notes](docs/safety.md)
- [Orchestration](docs/ORCHESTRATION.md)

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

## Release readiness

Use [docs/release-readiness.md](docs/release-readiness.md) before opening release PRs or tagging a release.

## License

MIT
