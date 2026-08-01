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

Run `npm run package:smoke` after building. It packs the publish artifact, invokes the installed `smoketape` CLI, verifies every advertised `main`, `bin`, `exports`, and `types` target, and compiles a TypeScript consumer against the tarball.

## Publishing

Before creating the first tag, configure `rogerchappel/smoketape` as a trusted publisher for the `smoketape` package on npm, targeting the `release.yml` workflow. No npm token is required: the tag workflow installs a compatible npm CLI, then uses GitHub OIDC and `npm publish --provenance`.

Create a tag that exactly matches `package.json`, such as `v0.1.0` for version `0.1.0`. The workflow validates both the tag and the packed filename, publishes that exact tarball, and only then creates the GitHub release. A publish failure therefore cannot create a GitHub release that claims an unavailable npm package.

Registry installation (`npm install -D smoketape`) is supported only after that workflow completes successfully. Before the first publish, use the checkout installation documented in the README.

## Notes

- Keep README examples aligned with the fixture-backed smoke command.
- Do not publish until CI is green on the release branch.
- Update CHANGELOG.md with user-facing changes before tagging.
