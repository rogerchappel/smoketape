# Release readiness

Use this checklist before cutting a release or asking for a release review.

## Local verification

```sh
npm install
npm run check
npm run test
npm run smoke
npm run package:smoke
npm run release:check
```

## Package contents

Run `npm run package:smoke` after building. It packs the publish artifact, verifies every advertised `main`, `bin`, `exports`, and `types` target, and compiles a TypeScript consumer against the tarball.

## Notes

- Keep README examples aligned with the fixture-backed smoke command.
- Do not publish until CI is green on the release branch.
- Update CHANGELOG.md with user-facing changes before tagging.
