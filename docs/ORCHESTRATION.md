# smoketape Orchestration

`smoketape` is intentionally small enough for one agent or maintainer to operate locally.

## Local workflow

1. Write or update a YAML tape near the fixture it proves.
2. Run `npm test` for fixture-backed coverage.
3. Run `npm run smoke` for the installed CLI path.
4. Run `bash scripts/validate.sh` before release or handoff.
5. Attach the Markdown report when asking another agent or human to review behavior.

## Agent guardrails

- Do not run unreviewed third-party tapes.
- Prefer temp sandboxes; use `--allow-host-cwd` only for a deliberate local repo smoke.
- Keep `--allow-network` off unless the tape is explicitly testing network behavior.
- Add values to `redactions` before recording proof output that may include tokens.

## Release gate

The project is ready to ship when these commands pass:

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
node dist/src/index.js run fixtures/sample.yml --report reports/sample.md --json
```
