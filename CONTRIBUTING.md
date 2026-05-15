# Contributing

Thanks for helping make CLI smoke tests less mysterious.

## Local setup

```bash
npm install
npm test
npm run smoke
```

## Pull request expectations

- Add or update fixture tapes for behavior changes.
- Keep the YAML schema small and readable.
- Preserve conservative defaults; new host or network access must be explicit.
- Run `bash scripts/validate.sh` before asking for review.

## Commit style

Use small, meaningful commits with prefixes like `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.
