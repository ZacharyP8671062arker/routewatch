import {
  generateDeprecationReport,
  hasDeprecationViolations,
  formatDeprecationReportText,
  RouteAgeEntry,
} from './deprecationReporter';
import { markDeprecated, resetDeprecator } from './endpointDeprecator';

beforeEach(() => {
  resetDeprecator();
});

const recentDate = new Date();
const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);

const routes: RouteAgeEntry[] = [
  { method: 'GET', path: '/users', lastSeenAt: recentDate },
  { method: 'GET', path: '/legacy', lastSeenAt: oldDate },
  { method: 'POST', path: '/submit', lastSeenAt: recentDate },
];

describe('generateDeprecationReport', () => {
  it('generates a report with correct totals', () => {
    const report = generateDeprecationReport(routes);
    expect(report.total).toBe(3);
    expect(report.generatedAt).toBeInstanceOf(Date);
  });

  it('marks old routes as deprecated', () => {
    const report = generateDeprecationReport(routes);
    const legacy = report.entries.find((e) => e.path === '/legacy');
    expect(legacy?.status).toBe('deprecated');
  });

  it('marks recent routes as active', () => {
    const report = generateDeprecationReport(routes);
    const users = report.entries.find((e) => e.path === '/users');
    expect(users?.status).toBe('active');
  });

  it('includes reason for manually tagged routes', () => {
    markDeprecated('POST', '/submit', 'use /v2/submit');
    const report = generateDeprecationReport(routes);
    const submit = report.entries.find((e) => e.path === '/submit');
    expect(submit?.reason).toBe('use /v2/submit');
  });

  it('counts byStatus correctly', () => {
    const report = generateDeprecationReport(routes);
    expect(report.byStatus.active).toBeGreaterThanOrEqual(1);
    expect(report.byStatus.deprecated).toBeGreaterThanOrEqual(1);
  });
});

describe('hasDeprecationViolations', () => {
  it('returns true when deprecated routes exist', () => {
    const report = generateDeprecationReport(routes);
    expect(hasDeprecationViolations(report)).toBe(true);
  });

  it('returns false when all routes are active', () => {
    const freshRoutes: RouteAgeEntry[] = [
      { method: 'GET', path: '/a', lastSeenAt: recentDate },
    ];
    const report = generateDeprecationReport(freshRoutes);
    expect(hasDeprecationViolations(report)).toBe(false);
  });
});

describe('formatDeprecationReportText', () => {
  it('includes header and status counts', () => {
    const report = generateDeprecationReport(routes);
    const text = formatDeprecationReportText(report);
    expect(text).toContain('Deprecation Report');
    expect(text).toContain('Total routes: 3');
  });

  it('lists deprecated routes in output', () => {
    const report = generateDeprecationReport(routes);
    const text = formatDeprecationReportText(report);
    expect(text).toContain('[DEPRECATED]');
    expect(text).toContain('/legacy');
  });

  it('omits active routes from detail lines', () => {
    const report = generateDeprecationReport(routes);
    const text = formatDeprecationReportText(report);
    const lines = text.split('\n').filter((l) => l.includes('/users'));
    expect(lines).toHaveLength(0);
  });
});
