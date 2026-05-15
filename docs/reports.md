# Reports

`smoketape run` always prints a report to stdout and can also write one with `--report`.

- `--json` prints JSON to stdout.
- `--report report.json` writes JSON.
- `--report report.md` writes Markdown.

The JSON shape is intentionally direct: top-level run metadata plus a `steps` array with command output and assertion results. Markdown is optimized for pasting into issues, PRs, and agent handoffs.
