# Smoketape demo video brief

## Working title

Proof reports for tiny CLI smoke tests

## Demo goal

Show how a maintainer can replace an opaque ad hoc smoke script with a readable
YAML tape, then produce Markdown or JSON evidence that a command ran, expected
output appeared, files were created, and sensitive values were redacted.

## Source material

- `fixtures/sample.yml` demonstrates the minimum tape shape.
- `examples/basic/smoketape.yml` shows a runnable happy-path example.
- `examples/redaction/smoketape.yml` demonstrates report redaction behavior.
- `examples/report-demo.sh` runs the built CLI and writes report artifacts.
- `docs/tutorials/report-demo.md` explains the same flow as a recipe.

## Three-scene outline

1. Open `examples/basic/smoketape.yml` and point out the readable command,
   stdout expectation, and file assertion.
2. Run `npm run build` followed by `bash examples/report-demo.sh` to create
   fresh proof artifacts.
3. Open the generated Markdown report and explain why the report is useful in a
   PR, release checklist, or agent handoff.

## Commands to show

```bash
npm install
npm run build
bash examples/report-demo.sh
node dist/src/index.js run examples/redaction/smoketape.yml --json
```

## Honest limitations to mention

- Smoketape is a local smoke-test runner, not a secure sandbox for untrusted
  commands.
- Network access is marked disabled by default, but reviewed tapes can opt in
  with `--allow-network`.
- The tool complements unit tests; it does not replace full integration or
  end-to-end coverage.

## Social hooks

- "A smoke test should leave evidence, not just vibes."
- "Readable YAML in, PR-ready proof report out."
- "Tiny CLI demos deserve deterministic checks too."
