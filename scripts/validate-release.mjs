#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateRelease({ tag, tarball, manifest }) {
  const expectedTag = `v${manifest.version}`;
  assert.equal(tag, expectedTag, `release tag ${tag} does not match package version ${manifest.version} (expected ${expectedTag})`);

  const expectedTarball = `${manifest.name.replace(/^@/, '').replace('/', '-')}-${manifest.version}.tgz`;
  assert.equal(basename(tarball), expectedTarball, `release artifact ${basename(tarball)} does not match ${expectedTarball}`);
}

export function main(argv = process.argv.slice(2)) {
  const [tag, tarball] = argv;
  assert(tag && tarball, 'usage: node scripts/validate-release.mjs <vX.Y.Z tag> <package.tgz>');
  const manifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
  validateRelease({ tag, tarball, manifest });
  console.log(`verified release ${tag} will publish ${tarball}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
