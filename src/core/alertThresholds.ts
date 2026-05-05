/**
 * alertThresholds.ts
 * Defines and evaluates configurable alert thresholds for route metrics.
 */

export interface ThresholdConfig {
  maxAvgResponseTimeMs?: number;
  maxErrorRate?: number; // 0–1
  minRequestCount?: number;
}

export interface ThresholdViolation {
  route: string;
  method: string;
  type: 'response_time' | 'error_rate' | 'low_traffic';
  message: string;
  value: number;
  threshold: number;
}

const defaultThresholds: ThresholdConfig = {
  maxAvgResponseTimeMs: 2000,
  maxErrorRate: 0.1,
};

let activeThresholds: ThresholdConfig = { ...defaultThresholds };

export function setThresholds(config: Partial<ThresholdConfig>): void {
  activeThresholds = { ...defaultThresholds, ...config };
}

export function getThresholds(): ThresholdConfig {
  return { ...activeThresholds };
}

export function resetThresholds(): void {
  activeThresholds = { ...defaultThresholds };
}

export function evaluateThresholds(
  route: string,
  method: string,
  avgResponseTimeMs: number,
  errorRate: number,
  requestCount: number
): ThresholdViolation[] {
  const violations: ThresholdViolation[] = [];
  const t = activeThresholds;

  if (t.maxAvgResponseTimeMs !== undefined && avgResponseTimeMs > t.maxAvgResponseTimeMs) {
    violations.push({
      route,
      method,
      type: 'response_time',
      message: `Avg response time ${avgResponseTimeMs.toFixed(1)}ms exceeds threshold of ${t.maxAvgResponseTimeMs}ms`,
      value: avgResponseTimeMs,
      threshold: t.maxAvgResponseTimeMs,
    });
  }

  if (t.maxErrorRate !== undefined && errorRate > t.maxErrorRate) {
    violations.push({
      route,
      method,
      type: 'error_rate',
      message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold of ${(t.maxErrorRate * 100).toFixed(1)}%`,
      value: errorRate,
      threshold: t.maxErrorRate,
    });
  }

  if (t.minRequestCount !== undefined && requestCount < t.minRequestCount) {
    violations.push({
      route,
      method,
      type: 'low_traffic',
      message: `Request count ${requestCount} is below minimum threshold of ${t.minRequestCount}`,
      value: requestCount,
      threshold: t.minRequestCount,
    });
  }

  return violations;
}
