import { readFile } from 'node:fs/promises';
import type { TapeReport } from './types.js';

export async function explainReport(reportPath: string): Promise<string> {
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as TapeReport;
  const failedSteps = report.steps.filter((step) => !step.ok);
  const lines: string[] = [];
  lines.push(report.ok ? `PASS: ${report.name}` : `FAIL: ${report.name}`);
  lines.push(`${report.steps.length} step(s), ${failedSteps.length} failing, ${report.durationMs}ms total.`);
  if (!report.allowNetwork) lines.push('Network was disabled by smoketape defaults.');
  for (const step of failedSteps) {
    lines.push(`- ${step.name}: ${step.assertions.filter((item) => !item.ok).map((item) => `${item.target} ${item.assertion} (${item.message})`).join('; ') || 'timed out'}`);
  }
  return `${lines.join('\n')}\n`;
}
