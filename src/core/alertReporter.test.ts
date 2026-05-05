import { generateAlertReport, hasViolations } from './alertReporter';
import { recordStats, clearStats } from './routeStats';
import { recordResponseTime, clearResponseTimeStats } from './responseTimeTracker';
import { setThresholds, resetThresholds } from './alertThresholds';

describe('alertReporter', () => {
  beforeEach(() => {
    clearStats();
    clearResponseTimeStats();
    resetThresholds();
  });

  it('returns an empty report when no stats exist', () => {
    const report = generateAlertReport();
    expect(report.totalViolations).toBe(0);
    expect(report.violations).toHaveLength(0);
    expect(report.generatedAt).toBeTruthy();
  });

  it('detects no violations when metrics are healthy', () => {
    recordStats('GET', '/api/users', 200);
    recordResponseTime('GET', '/api/users', 100);
    const report = generateAlertReport();
    expect(report.totalViolations).toBe(0);
  });

  it('detects response time violation from live stats', () => {
    setThresholds({ maxAvgResponseTimeMs: 500 });
    recordStats('GET', '/api/slow', 200);
    recordResponseTime('GET', '/api/slow', 3000);
    const report = generateAlertReport();
    const v = report.violations.find((x) => x.type === 'response_time');
    expect(v).toBeDefined();
    expect(v!.route).toBe('/api/slow');
  });

  it('detects error rate violation from live stats', () => {
    setThresholds({ maxErrorRate: 0.2 });
    for (let i = 0; i < 5; i++) recordStats('POST', '/api/broken', 500);
    for (let i = 0; i < 5; i++) recordStats('POST', '/api/broken', 200);
    recordResponseTime('POST', '/api/broken', 100);
    const report = generateAlertReport();
    const v = report.violations.find((x) => x.type === 'error_rate');
    expect(v).toBeDefined();
    expect(v!.method).toBe('POST');
  });

  it('hasViolations returns false when no violations', () => {
    recordStats('GET', '/health', 200);
    recordResponseTime('GET', '/health', 50);
    expect(hasViolations()).toBe(false);
  });

  it('hasViolations returns true when violations exist', () => {
    setThresholds({ maxAvgResponseTimeMs: 100 });
    recordStats('GET', '/api/slow', 200);
    recordResponseTime('GET', '/api/slow', 5000);
    expect(hasViolations()).toBe(true);
  });
});
