import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function initProject(root = process.cwd()): Promise<string[]> {
  const files: Array<[string, string]> = [
    ['smoketape.yml', sampleTape()],
    ['fixtures/hello/package.json', '{"type":"module"}\n'],
    ['fixtures/hello/hello.mjs', sampleFixture()]
  ];
  const written: string[] = [];
  for (const [relative, content] of files) {
    const target = path.resolve(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, { flag: 'wx' });
    written.push(relative);
  }
  return written;
}

function sampleTape(): string {
  return `version: 1
name: hello-smoke
description: Example smoketape that proves a tiny fixture CLI works.
timeoutMs: 5000
fixtures: fixtures/hello
redactions:
  - super-secret-demo-token
steps:
  - name: run hello fixture
    command: node hello/hello.mjs Roger
    expect:
      exitCode: 0
      stdout:
        contains: "hello, Roger"
        notContains: super-secret-demo-token
      files:
        - path: hello-output.txt
          exists: true
          contains: "Roger"
`;
}

function sampleFixture(): string {
  return `import { writeFileSync } from 'node:fs';
const name = process.argv[2] ?? 'world';
writeFileSync('hello-output.txt', \`ran for \${name}\\n\`);
console.log(\`hello, \${name}\`);
`;
}
