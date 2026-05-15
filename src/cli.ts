import { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { initProject } from './init.js';
import { explainReport } from './explain.js';
import { renderJson, renderMarkdown } from './reporter.js';
import { runTape } from './runner.js';

export async function main(argv = process.argv): Promise<void> {
  const program = new Command();
  program
    .name('smoketape')
    .description('Local-first YAML smoke tapes for CLI proof reports.')
    .version('0.1.0');

  program.command('init')
    .description('Write a starter smoketape.yml and fixture CLI.')
    .option('--cwd <path>', 'Directory to initialize', process.cwd())
    .action(async (options: { cwd: string }) => {
      const written = await initProject(options.cwd);
      console.log(`Wrote ${written.join(', ')}`);
    });

  program.command('run')
    .argument('<tape>', 'YAML tape to run')
    .description('Run a smoketape in a temporary sandbox.')
    .option('--json', 'Print JSON report to stdout')
    .option('--report <path>', 'Write a Markdown report, or .json for JSON')
    .option('--sandbox <path>', 'Use a specific sandbox directory')
    .option('--timeout-ms <ms>', 'Default per-step timeout in milliseconds', parsePositiveInt)
    .option('--allow-host-cwd', 'Allow step cwd values to escape the sandbox')
    .option('--allow-network', 'Mark network access as intentionally allowed')
    .action(async (tape: string, options: { json?: boolean; report?: string; sandbox?: string; timeoutMs?: number; allowHostCwd?: boolean; allowNetwork?: boolean }) => {
      const report = await runTape(tape, options);
      if (options.report) {
        const target = path.resolve(options.report);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, target.endsWith('.json') ? renderJson(report) : renderMarkdown(report));
      }
      process.stdout.write(options.json ? renderJson(report) : renderMarkdown(report));
      if (!report.ok) process.exitCode = 1;
    });

  program.command('explain')
    .argument('<report>', 'JSON report from smoketape run --report report.json')
    .description('Summarize a JSON proof report in plain text.')
    .action(async (reportPath: string) => {
      process.stdout.write(await explainReport(reportPath));
    });

  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) throw new Error('Expected a positive integer');
  return parsed;
}
