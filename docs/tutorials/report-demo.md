# Report Demo

This recipe turns the basic checked-in tape into Markdown and JSON proof
artifacts. It is intended for PR descriptions, release candidates, and agent
handoffs where a maintainer needs more than "the command worked on my machine."

## Run

```bash
npm install
bash examples/report-demo.sh
```

The script writes:

- `.demo-output/basic-smoke.md`
- `.demo-output/basic-smoke.json`
- `.demo-output/basic-smoke.stdout.json`

## Inspect

Open the Markdown report for a human-readable run summary. Use the JSON report
when another tool needs to inspect step status, command output, or assertion
results.

The demo uses `examples/basic/smoketape.yml`, which runs `node --version` and
asserts that stdout looks like a Node version string.
