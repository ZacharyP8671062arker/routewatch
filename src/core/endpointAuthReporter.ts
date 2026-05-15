import { getAllAuthStats, AuthStats } from './endpointAuthTracker';

export interface AuthReport {
  totalEndpoints: number;
  unauthenticatedEndpoints: string[];
  failureRateViolations: Array<{ key: string; failureRate: number; threshold: number }>;
  summary: Record<string, AuthStats>;
}

const DEFAULT_FAILURE_RATE_THRESHOLD = 0.1;

export function generateAuthReport(failureRateThreshold = DEFAULT_FAILURE_RATE_THRESHOLD): AuthReport {
  const allStats = getAllAuthStats();
  const keys = Object.keys(allStats);

  const unauthenticatedEndpoints: string[] = [];
  const failureRateViolations: AuthReport['failureRateViolations'] = [];

  for (const key of keys) {
    const stats = allStats[key];

    if (stats.scheme === 'none' || stats.scheme === undefined) {
      unauthenticatedEndpoints.push(key);
    }

    const total = stats.successCount + stats.failureCount;
    if (total > 0) {
      const failureRate = stats.failureCount / total;
      if (failureRate > failureRateThreshold) {
        failureRateViolations.push({ key, failureRate, threshold: failureRateThreshold });
      }
    }
  }

  return {
    totalEndpoints: keys.length,
    unauthenticatedEndpoints,
    failureRateViolations,
    summary: allStats,
  };
}

export function hasAuthViolations(report: AuthReport): boolean {
  return (
    report.unauthenticatedEndpoints.length > 0 ||
    report.failureRateViolations.length > 0
  );
}

export function formatAuthReportText(report: AuthReport): string {
  const lines: string[] = ['=== Auth Report ===', `Total endpoints tracked: ${report.totalEndpoints}`];

  if (report.unauthenticatedEndpoints.length > 0) {
    lines.push(`\nUnauthenticated endpoints (${report.unauthenticatedEndpoints.length}):`);
    for (const ep of report.unauthenticatedEndpoints) {
      lines.push(`  - ${ep}`);
    }
  } else {
    lines.push('\nAll endpoints have authentication configured.');
  }

  if (report.failureRateViolations.length > 0) {
    lines.push(`\nHigh failure rate endpoints (${report.failureRateViolations.length}):`);
    for (const v of report.failureRateViolations) {
      lines.push(`  - ${v.key}: ${(v.failureRate * 100).toFixed(1)}% failures (threshold: ${(v.threshold * 100).toFixed(1)}%)`);
    }
  } else {
    lines.push('\nNo high failure rate violations detected.');
  }

  return lines.join('\n');
}
