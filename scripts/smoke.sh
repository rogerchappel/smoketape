#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
node "$ROOT/dist/src/index.js" init --cwd "$TMP" >/dev/null
node "$ROOT/dist/src/index.js" run "$TMP/smoketape.yml" --report "$TMP/report.md" --json > "$TMP/report.json"
grep -q '"ok": true' "$TMP/report.json"
grep -q 'Smoketape Report' "$TMP/report.md"
node "$ROOT/dist/src/index.js" explain "$TMP/report.json" | grep -q 'PASS:'
echo "smoketape smoke ok: $TMP"
