/**
 * Generates human-readable and structured reports from rate limit detection results.
 */

import { getExceededRoutes, getAllRateLimitResults, RateLimitResult } from './rateLimitDetector';

export interface RateLimitReport {
  generatedAt: string;
  totalRoutes: number;
  exceededCount: number;
  violations: RateLimitResult[];
}

export function generateRateLimitReport(): RateLimitReport {
  const all = getAllRateLimitResults();
  const violations = getExceededRoutes();

  return {
    generatedAt: new Date().toISOString(),
    totalRoutes: all.length,
    exceededCount: violations.length,
    violations,
  };
}

export function hasRateLimitViolations(): boolean {
  return getExceededRoutes().length > 0;
}

export function formatRateLimitReportText(report: RateLimitReport): string {
  const lines: string[] = [
    `Rate Limit Report — ${report.generatedAt}`,
    `Total routes tracked: ${report.totalRoutes}`,
    `Routes exceeding limit: ${report.exceededCount}`,
    '',
  ];

  if (report.violations.length === 0) {
    lines.push('No rate limit violations detected.');
  } else {
    lines.push('Violations:');
    for (const v of report.violations) {
      lines.push(
        `  [${v.route}] ${v.requestsInWindow} requests in ${v.windowMs}ms (limit: ${v.limit})`
      );
    }
  }

  return lines.join('\n');
}
