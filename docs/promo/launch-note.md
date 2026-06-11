# Smoketape launch note draft

Smoketape is a local-first CLI for turning small command-line smoke tests into
reviewable proof reports. A tape describes the command to run, the output to
expect, files that should appear, and values that must be redacted from the
report.

The current examples focus on maintainer and agent workflows: run a fixture in a
temporary sandbox, confirm stdout and file assertions, and attach Markdown or
JSON evidence to a PR or handoff.

Try the local demo from a checkout:

```bash
npm install
npm run build
bash examples/report-demo.sh
```

Smoketape is intentionally scoped. It is not a secure runner for untrusted code,
and it should sit beside unit tests rather than replace them. Its job is to make
the small "does the CLI actually work?" proof easy to read, rerun, and review.
