import { getResponseTimeStats } from './responseTimeTracker';
import { getStats } from './routeStats';

export interface AnomalyConfig {
  responseTimeZScoreThreshold: number;
  errorRateSpikeThreshold: number;
  minSampleSize: number;
}

export interface AnomalyResult {
  method: string;
  path: string;
  type: 'response_time_spike' | 'error_rate_spike';
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
}

let config: AnomalyConfig = {
  responseTimeZScoreThreshold: 2.5,
  errorRateSpikeThreshold: 0.3,
  minSampleSize: 5,
};

export function configureAnomalyDetector(cfg: Partial<AnomalyConfig>): void {
  config = { ...config, ...cfg };
}

export function resetAnomalyDetector(): void {
  config = {
    responseTimeZScoreThreshold: 2.5,
    errorRateSpikeThreshold: 0.3,
    minSampleSize: 5,
  };
}

export function detectAnomalies(): AnomalyResult[] {
  const results: AnomalyResult[] = [];
  const allRtStats = getAllResponseTimeStatsLocal();
  const allRouteStats = getAllRouteStatsLocal();

  for (const [key, rtStats] of Object.entries(allRtStats)) {
    if (rtStats.count < config.minSampleSize) continue;
    const [method, path] = key.split('|');
    const zScore = rtStats.stddev > 0
      ? (rtStats.p95 - rtStats.mean) / rtStats.stddev
      : 0;
    if (zScore >= config.responseTimeZScoreThreshold) {
      results.push({
        method, path,
        type: 'response_time_spike',
        value: Math.round(zScore * 100) / 100,
        threshold: config.responseTimeZScoreThreshold,
        severity: zScore >= 4 ? 'high' : zScore >= 3 ? 'medium' : 'low',
      });
    }
  }

  for (const [key, stats] of Object.entries(allRouteStats)) {
    if (stats.total < config.minSampleSize) continue;
    const [method, path] = key.split('|');
    const errorRate = stats.errors / stats.total;
    if (errorRate >= config.errorRateSpikeThreshold) {
      results.push({
        method, path,
        type: 'error_rate_spike',
        value: Math.round(errorRate * 1000) / 1000,
        threshold: config.errorRateSpikeThreshold,
        severity: errorRate >= 0.6 ? 'high' : errorRate >= 0.45 ? 'medium' : 'low',
      });
    }
  }

  return results;
}

function getAllResponseTimeStatsLocal() {
  try {
    const { getAllResponseTimeStats } = require('./responseTimeTracker');
    return getAllResponseTimeStats() as Record<string, { mean: number; stddev: number; p95: number; count: number }>;
  } catch { return {}; }
}

function getAllRouteStatsLocal() {
  try {
    const { getAllStats } = require('./routeStats');
    return getAllStats() as Record<string, { total: number; errors: number }>;
  } catch { return {}; }
}
