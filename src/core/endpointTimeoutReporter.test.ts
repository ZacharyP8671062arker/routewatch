import {
  configureTimeout,
  resetTimeoutTracker,
  recordTimeoutRequest,
} from './endpointTimeoutTracker';
import {
  generateTimeoutReport,
  hasTimeoutViolations,
  formatTimeoutReportText,
} from './endpointTimeoutReporter';

beforeEach(() => {
  resetTimeoutTracker();
});

describe('generateTimeoutReport', () => {
  it('returns empty report when no data', () => {
    const report = generateTimeoutReport();
    expect(report.totalEndpoints).toBe(0);
    expect(report.timedOutEndpoints).toBe(0);
    expect(report.cleanEndpoints).toBe(0);
    expect(report.entries).toHaveLength(0);
  });

  it('counts timed-out vs clean endpoints correctly', () => {
    configureTimeout('get', '/fast', { budgetMs: 500 });
    configureTimeout('post', '/slow', { budgetMs: 200 });

    recordTimeoutRequest('get', '/fast', 100, false);
    recordTimeoutRequest('post', '/slow', 300, true);

    const report = generateTimeoutReport();
    expect(report.totalEndpoints).toBe(2);
    expect(report.timedOutEndpoints).toBe(1);
    expect(report.cleanEndpoints).toBe(1);
  });

  it('marks entry as violated when timeoutCount > 0', () => {
    configureTimeout('delete', '/resource', { budgetMs: 100 });
    recordTimeoutRequest('delete', '/resource', 200, true);

    const report = generateTimeoutReport();
    const entry = report.entries.find((e) => e.path === '/resource');
    expect(entry).toBeDefined();
    expect(entry!.violated).toBe(true);
  });
});

describe('hasTimeoutViolations', () => {
  it('returns false when no violations', () => {
    configureTimeout('get', '/ok', { budgetMs: 500 });
    recordTimeoutRequest('get', '/ok', 50, false);
    expect(hasTimeoutViolations()).toBe(false);
  });

  it('returns true when at least one timeout occurred', () => {
    configureTimeout('get', '/bad', { budgetMs: 100 });
    recordTimeoutRequest('get', '/bad', 500, true);
    expect(hasTimeoutViolations()).toBe(true);
  });
});

describe('formatTimeoutReportText', () => {
  it('includes header and endpoint info', () => {
    configureTimeout('get', '/api/data', { budgetMs: 300 });
    recordTimeoutRequest('get', '/api/data', 400, true);

    const text = formatTimeoutReportText();
    expect(text).toContain('Endpoint Timeout Report');
    expect(text).toContain('/api/data');
    expect(text).toContain('TIMEOUT');
    expect(text).toContain('Budget: 300ms');
  });

  it('shows OK status for clean endpoints', () => {
    configureTimeout('post', '/submit', { budgetMs: 1000 });
    recordTimeoutRequest('post', '/submit', 200, false);

    const text = formatTimeoutReportText();
    expect(text).toContain('✓ OK');
  });
});
