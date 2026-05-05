/**
 * alertReporter.ts
 * Collects threshold violations across all observed routes and exposes a summary.
 */

import { ThresholdViolation, evaluateThresholds } from './alertThresholds';
import { getAllStats } from './routeStats';
import { getAllResponseTimeStats } from './responseTimeTracker';

export interface AlertReport {
  generatedAt: string;
  totalViolations: number;
  violations: ThresholdViolation[];
}

export function generateAlertReport(): AlertReport {
  const violations: ThresholdViolation[] = [];
  const allStats = getAllStats();
  const allTimings = getAllResponseTimeStats();

  for (const [key, stats] of Object.entries(allStats)) {
    const [method, route] = key.split('|');
    if (!method || !route) continue;

    const timingKey = `${method}|${route}`;
    const timing = allTimings[timingKey];
    const avgResponseTimeMs = timing?.avg ?? 0;

    const totalRequests = stats.total ?? 0;
    const errorCount = stats.errors ?? 0;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    const routeViolations = evaluateThresholds(
      route,
      method,
      avgResponseTimeMs,
      errorRate,
      totalRequests
    );

    violations.push(...routeViolations);
  }

  return {
    generatedAt: new Date().toISOString(),
    totalViolations: violations.length,
    violations,
  };
}

export function hasViolations(): boolean {
  return generateAlertReport().totalViolations > 0;
}
