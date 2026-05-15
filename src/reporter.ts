import type { TapeReport } from './types.js';

export function renderJson(report: TapeReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderMarkdown(report: TapeReport): string {
  const lines: string[] = [];
  lines.push(`# Smoketape Report: ${report.name}`);
  lines.push('');
  lines.push(report.ok ? '**Status:** PASS ✅' : '**Status:** FAIL ❌');
  lines.push(`**Started:** ${report.startedAt}`);
  lines.push(`**Duration:** ${report.durationMs}ms`);
  lines.push(`**Sandbox:** \`${report.sandbox}\``);
  lines.push(`**Network:** ${report.allowNetwork ? 'allowed' : 'disabled by default'}`);
  if (report.redacted) lines.push('**Redactions:** applied');
  lines.push('');
  for (const [index, step] of report.steps.entries()) {
    lines.push(`## ${index + 1}. ${step.name}`);
    lines.push('');
    lines.push(`- Status: ${step.ok ? 'PASS' : 'FAIL'}`);
    lines.push(`- Command: \`${Array.isArray(step.command) ? step.command.join(' ') : step.command}\``);
    lines.push(`- Exit code: ${step.exitCode}${step.timedOut ? ' (timed out)' : ''}`);
    lines.push(`- Duration: ${step.durationMs}ms`);
    lines.push('');
    if (step.stdout) lines.push('<details><summary>stdout</summary>\n\n```text\n' + step.stdout.trimEnd() + '\n```\n</details>');
    if (step.stderr) lines.push('<details><summary>stderr</summary>\n\n```text\n' + step.stderr.trimEnd() + '\n```\n</details>');
    lines.push('');
    lines.push('| Target | Assertion | Result | Message |');
    lines.push('| --- | --- | --- | --- |');
    for (const assertion of step.assertions) lines.push(`| ${escapeCell(assertion.target)} | ${escapeCell(assertion.assertion)} | ${assertion.ok ? 'PASS' : 'FAIL'} | ${escapeCell(assertion.message)} |`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function escapeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}
