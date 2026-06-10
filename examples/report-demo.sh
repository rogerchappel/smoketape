#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
report_dir="${repo_root}/.demo-output"

cd "$repo_root"
mkdir -p "$report_dir"
npm run build >/dev/null

node dist/src/index.js run examples/basic/smoketape.yml \
  --report "$report_dir/basic-smoke.md"

node dist/src/index.js run examples/basic/smoketape.yml \
  --json \
  --report "$report_dir/basic-smoke.json" \
  > "$report_dir/basic-smoke.stdout.json"

printf 'Markdown report: %s\n' "$report_dir/basic-smoke.md"
printf 'JSON report: %s\n' "$report_dir/basic-smoke.json"
