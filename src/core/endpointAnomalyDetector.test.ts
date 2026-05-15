import {
  configureAnomalyDetector,
  resetAnomalyDetector,
  detectAnomalies,
  AnomalyResult,
} from './endpointAnomalyDetector';
import * as rtTracker from './responseTimeTracker';
import * as routeStats from './routeStats';

describe('endpointAnomalyDetector', () => {
  beforeEach(() => {
    resetAnomalyDetector();
    jest.restoreAllMocks();
  });

  function mockRtStats(data: Record<string, { mean: number; stddev: number; p95: number; count: number }>) {
    jest.spyOn(rtTracker, 'getAllResponseTimeStats').mockReturnValue(data as any);
  }

  function mockRouteStats(data: Record<string, { total: number; errors: number }>) {
    jest.spyOn(routeStats, 'getAllStats').mockReturnValue(data as any);
  }

  it('returns empty when no stats available', () => {
    mockRtStats({});
    mockRouteStats({});
    expect(detectAnomalies()).toEqual([]);
  });

  it('skips routes below minSampleSize', () => {
    mockRtStats({ 'GET|/api/test': { mean: 100, stddev: 10, p95: 500, count: 3 } });
    mockRouteStats({});
    expect(detectAnomalies()).toEqual([]);
  });

  it('detects response time spike when z-score exceeds threshold', () => {
    mockRtStats({ 'GET|/api/slow': { mean: 100, stddev: 20, p95: 200, count: 10 } });
    mockRouteStats({});
    configureAnomalyDetector({ responseTimeZScoreThreshold: 2.5 });
    const results = detectAnomalies();
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('response_time_spike');
    expect(results[0].method).toBe('GET');
    expect(results[0].path).toBe('/api/slow');
    expect(results[0].severity).toBe('low');
  });

  it('assigns high severity for very large z-score', () => {
    mockRtStats({ 'POST|/api/heavy': { mean: 100, stddev: 10, p95: 145, count: 20 } });
    mockRouteStats({});
    configureAnomalyDetector({ responseTimeZScoreThreshold: 2.5 });
    const results = detectAnomalies();
    expect(results[0].severity).toBe('high');
  });

  it('detects error rate spike', () => {
    mockRtStats({});
    mockRouteStats({ 'DELETE|/api/resource': { total: 10, errors: 4 } });
    const results = detectAnomalies();
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('error_rate_spike');
    expect(results[0].value).toBeCloseTo(0.4, 2);
    expect(results[0].severity).toBe('medium');
  });

  it('assigns high severity for error rate >= 0.6', () => {
    mockRtStats({});
    mockRouteStats({ 'GET|/api/broken': { total: 10, errors: 7 } });
    const results = detectAnomalies();
    expect(results[0].severity).toBe('high');
  });

  it('respects custom errorRateSpikeThreshold', () => {
    configureAnomalyDetector({ errorRateSpikeThreshold: 0.5 });
    mockRtStats({});
    mockRouteStats({ 'GET|/api/flaky': { total: 10, errors: 4 } });
    expect(detectAnomalies()).toEqual([]);
  });

  it('handles zero stddev without crashing', () => {
    mockRtStats({ 'GET|/api/stable': { mean: 50, stddev: 0, p95: 50, count: 10 } });
    mockRouteStats({});
    expect(() => detectAnomalies()).not.toThrow();
  });
});
