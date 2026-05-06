/**
 * Endpoint Health Checker
 * Evaluates the health of observed API endpoints based on error rates and response times.
 */

import { getStats } from './routeStats';
import { getResponseTimeStats } from './responseTimeTracker';

export interface HealthStatus {
  route: string;
  method: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  errorRate: number;
  avgResponseTime: number;
  totalRequests: number;
  reasons: string[];
}

export interface HealthConfig {
  maxErrorRate: number;       // 0..1, e.g. 0.05 = 5%
  maxAvgResponseTime: number; // milliseconds
  minRequests: number;        // minimum samples before evaluating
}

const DEFAULT_CONFIG: HealthConfig = {
  maxErrorRate: 0.05,
  maxAvgResponseTime: 1000,
  minRequests: 5,
};

let config: HealthConfig = { ...DEFAULT_CONFIG };

export function configureHealthChecker(overrides: Partial<HealthConfig>): void {
  config = { ...DEFAULT_CONFIG, ...overrides };
}

export function resetHealthChecker(): void {
  config = { ...DEFAULT_CONFIG };
}

export function checkEndpointHealth(method: string, route: string): HealthStatus {
  const stats = getStats(method, route);
  const rtStats = getResponseTimeStats(method, route);

  const totalRequests = stats?.totalRequests ?? 0;
  const errorCount = stats?.errorCount ?? 0;
  const avgResponseTime = rtStats?.avg ?? 0;

  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
  const reasons: string[] = [];

  let status: HealthStatus['status'] = 'healthy';

  if (totalRequests < config.minRequests) {
    return { route, method, status: 'healthy', errorRate, avgResponseTime, totalRequests, reasons: ['insufficient data'] };
  }

  if (errorRate > config.maxErrorRate) {
    reasons.push(`error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold ${(config.maxErrorRate * 100).toFixed(1)}%`);
    status = errorRate > config.maxErrorRate * 2 ? 'unhealthy' : 'degraded';
  }

  if (avgResponseTime > config.maxAvgResponseTime) {
    reasons.push(`avg response time ${avgResponseTime.toFixed(0)}ms exceeds threshold ${config.maxAvgResponseTime}ms`);
    if (status !== 'unhealthy') status = 'degraded';
  }

  return { route, method, status, errorRate, avgResponseTime, totalRequests, reasons };
}

export function getAllEndpointHealth(): HealthStatus[] {
  const { getAllStats } = require('./routeStats');
  const allStats = getAllStats() as Array<{ method: string; route: string }>;
  return allStats.map(({ method, route }) => checkEndpointHealth(method, route));
}
