import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRelease } from '../scripts/validate-release.mjs';

const manifest = { name: 'smoketape', version: '0.1.0' };

test('accepts the package artifact matching the release tag', () => {
  assert.doesNotThrow(() => validateRelease({ tag: 'v0.1.0', tarball: '/tmp/smoketape-0.1.0.tgz', manifest }));
});

test('rejects a tag that does not match package.json', () => {
  assert.throws(
    () => validateRelease({ tag: 'v0.2.0', tarball: '/tmp/smoketape-0.1.0.tgz', manifest }),
    /release tag v0\.2\.0 does not match package version 0\.1\.0/,
  );
});

test('rejects an artifact that does not match the package version', () => {
  assert.throws(
    () => validateRelease({ tag: 'v0.1.0', tarball: '/tmp/smoketape-0.0.9.tgz', manifest }),
    /release artifact smoketape-0\.0\.9\.tgz does not match smoketape-0\.1\.0\.tgz/,
  );
});
