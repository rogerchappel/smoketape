# Reports

`smoketape run` always prints a report to stdout and can also write one with `--report`.

- `--json` prints JSON to stdout.
- `--report report.json` writes JSON.
- `--report report.md` writes Markdown.

The JSON shape is intentionally direct: top-level run metadata plus a `steps` array with command output and assertion results. Markdown is optimized for pasting into issues, PRs, and agent handoffs.

## Output retention and redaction

Smoketape retains the first 65,536 bytes of each step's stdout and stderr independently. It keeps a small bounded lookahead while the command runs so configured and default secrets that begin near the retention boundary can be redacted before the final limit is applied. Additional output is discarded rather than accumulated in memory.

Every JSON step includes `stdoutTruncated` and `stderrTruncated`. Markdown report stream headings state when the corresponding output was truncated. Output assertions evaluate the same retained, redacted text included in reports, so an expectation beyond the retention boundary cannot match.

Configured literal redactions and the default `TOKEN`, `SECRET`, `PASSWORD`, `ghp_`, and `sk-` patterns are applied before output is reported. The default assignment scan processes long benign output linearly rather than repeatedly rescanning it.

For a runnable example that writes both Markdown and JSON reports, see
[Report Demo](tutorials/report-demo.md) or run:

```bash
bash examples/report-demo.sh
```
