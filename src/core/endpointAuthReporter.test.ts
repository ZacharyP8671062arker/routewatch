import { generateAuthReport, hasAuthViolations, formatAuthReportText } from './endpointAuthReporter';
import { configureAuth, recordAuthRequest, getAllAuthStats } from './endpointAuthTracker';

// Mock the auth tracker module
jest.mock('./endpointAuthTracker');

const mockGetAllAuthStats = getAllAuthStats as jest.MockedFunction<typeof getAllAuthStats>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('generateAuthReport', () => {
  it('returns empty report when no stats exist', () => {
    mockGetAllAuthStats.mockReturnValue({});
    const report = generateAuthReport();
    expect(report.totalEndpoints).toBe(0);
    expect(report.unauthenticatedEndpoints).toHaveLength(0);
    expect(report.failureRateViolations).toHaveLength(0);
  });

  it('identifies unauthenticated endpoints', () => {
    mockGetAllAuthStats.mockReturnValue({
      'GET:/public': { scheme: 'none', successCount: 10, failureCount: 0 } as any,
      'POST:/secure': { scheme: 'bearer', successCount: 5, failureCount: 0 } as any,
    });
    const report = generateAuthReport();
    expect(report.unauthenticatedEndpoints).toContain('GET:/public');
    expect(report.unauthenticatedEndpoints).not.toContain('POST:/secure');
  });

  it('detects high failure rate violations', () => {
    mockGetAllAuthStats.mockReturnValue({
      'GET:/api/data': { scheme: 'bearer', successCount: 5, failureCount: 5 } as any,
      'GET:/api/ok': { scheme: 'bearer', successCount: 100, failureCount: 1 } as any,
    });
    const report = generateAuthReport(0.1);
    expect(report.failureRateViolations).toHaveLength(1);
    expect(report.failureRateViolations[0].key).toBe('GET:/api/data');
    expect(report.failureRateViolations[0].failureRate).toBeCloseTo(0.5);
  });

  it('respects custom failure rate threshold', () => {
    mockGetAllAuthStats.mockReturnValue({
      'GET:/api/data': { scheme: 'bearer', successCount: 8, failureCount: 2 } as any,
    });
    const reportStrict = generateAuthReport(0.15);
    expect(reportStrict.failureRateViolations).toHaveLength(1);

    const reportLenient = generateAuthReport(0.25);
    expect(reportLenient.failureRateViolations).toHaveLength(0);
  });
});

describe('hasAuthViolations', () => {
  it('returns false when no violations exist', () => {
    const report = { totalEndpoints: 1, unauthenticatedEndpoints: [], failureRateViolations: [], summary: {} };
    expect(hasAuthViolations(report)).toBe(false);
  });

  it('returns true when unauthenticated endpoints exist', () => {
    const report = { totalEndpoints: 1, unauthenticatedEndpoints: ['GET:/open'], failureRateViolations: [], summary: {} };
    expect(hasAuthViolations(report)).toBe(true);
  });

  it('returns true when failure rate violations exist', () => {
    const report = { totalEndpoints: 1, unauthenticatedEndpoints: [], failureRateViolations: [{ key: 'GET:/x', failureRate: 0.5, threshold: 0.1 }], summary: {} };
    expect(hasAuthViolations(report)).toBe(true);
  });
});

describe('formatAuthReportText', () => {
  it('includes header and endpoint count', () => {
    mockGetAllAuthStats.mockReturnValue({});
    const report = generateAuthReport();
    const text = formatAuthReportText(report);
    expect(text).toContain('=== Auth Report ===');
    expect(text).toContain('Total endpoints tracked: 0');
  });

  it('lists unauthenticated endpoints', () => {
    mockGetAllAuthStats.mockReturnValue({
      'GET:/public': { scheme: 'none', successCount: 3, failureCount: 0 } as any,
    });
    const report = generateAuthReport();
    const text = formatAuthReportText(report);
    expect(text).toContain('GET:/public');
    expect(text).toContain('Unauthenticated endpoints');
  });

  it('shows clean message when no violations', () => {
    mockGetAllAuthStats.mockReturnValue({
      'GET:/api': { scheme: 'bearer', successCount: 10, failureCount: 0 } as any,
    });
    const report = generateAuthReport();
    const text = formatAuthReportText(report);
    expect(text).toContain('All endpoints have authentication configured.');
    expect(text).toContain('No high failure rate violations detected.');
  });
});
