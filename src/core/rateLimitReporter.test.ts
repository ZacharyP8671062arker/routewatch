import {
  generateRateLimitReport,
  hasRateLimitViolations,
  formatRateLimitReportText,
} from './rateLimitReporter';
import {
  resetRateLimitDetector,
  recordRequest,
  configureRateLimitDetector,
} from './rateLimitDetector';

describe('rateLimitReporter', () => {
  beforeEach(() => {
    resetRateLimitDetector();
  });

  it('generates a report with no violations when under limit', () => {
    configureRateLimitDetector({ maxRequests: 10, windowMs: 60_000 });
    recordRequest('GET /api/health');
    const report = generateRateLimitReport();
    expect(report.exceededCount).toBe(0);
    expect(report.violations).toHaveLength(0);
    expect(report.totalRoutes).toBe(1);
    expect(report.generatedAt).toBeTruthy();
  });

  it('generates a report with violations when over limit', () => {
    configureRateLimitDetector({ maxRequests: 2, windowMs: 60_000 });
    for (let i = 0; i < 4; i++) recordRequest('DELETE /api/items');
    const report = generateRateLimitReport();
    expect(report.exceededCount).toBe(1);
    expect(report.violations[0].route).toBe('DELETE /api/items');
  });

  it('hasRateLimitViolations returns false when no violations', () => {
    expect(hasRateLimitViolations()).toBe(false);
  });

  it('hasRateLimitViolations returns true when violations exist', () => {
    configureRateLimitDetector({ maxRequests: 1, windowMs: 60_000 });
    recordRequest('GET /api/burst');
    recordRequest('GET /api/burst');
    expect(hasRateLimitViolations()).toBe(true);
  });

  it('formatRateLimitReportText includes violation details', () => {
    configureRateLimitDetector({ maxRequests: 1, windowMs: 60_000 });
    recordRequest('POST /api/flood');
    recordRequest('POST /api/flood');
    const report = generateRateLimitReport();
    const text = formatRateLimitReportText(report);
    expect(text).toContain('POST /api/flood');
    expect(text).toContain('Violations:');
  });

  it('formatRateLimitReportText shows clean message when no violations', () => {
    const report = generateRateLimitReport();
    const text = formatRateLimitReportText(report);
    expect(text).toContain('No rate limit violations detected.');
  });
});
