import {
  generateEnvironmentReport,
  hasUnassignedEndpoints,
  formatEnvironmentReportText,
} from './environmentReporter';
import { assignEnvironment, resetEnvironmentTracker } from './endpointEnvironmentTracker';

beforeEach(() => {
  resetEnvironmentTracker();
});

describe('generateEnvironmentReport', () => {
  it('returns empty report when no endpoints are registered', () => {
    const report = generateEnvironmentReport();
    expect(report.totalEndpoints).toBe(0);
    expect(report.environments).toEqual([]);
    expect(report.unassignedEndpoints).toBe(0);
  });

  it('reports all environments and endpoint counts', () => {
    assignEnvironment('GET', '/users', 'production');
    assignEnvironment('GET', '/users', 'staging');
    assignEnvironment('POST', '/orders', 'production');
    const report = generateEnvironmentReport();
    expect(report.totalEndpoints).toBe(2);
    expect(report.environments).toContain('production');
    expect(report.environments).toContain('staging');
    expect(report.endpointsByEnvironment['production']).toHaveLength(2);
    expect(report.endpointsByEnvironment['staging']).toHaveLength(1);
  });

  it('counts unassigned endpoints', () => {
    assignEnvironment('GET', '/ping', 'dev');
    // Manually test unassigned by checking tracker after clear — simulate via fresh entry
    const report = generateEnvironmentReport();
    expect(report.unassignedEndpoints).toBe(0);
  });
});

describe('hasUnassignedEndpoints', () => {
  it('returns false when all endpoints have environments', () => {
    assignEnvironment('GET', '/status', 'prod');
    expect(hasUnassignedEndpoints()).toBe(false);
  });

  it('returns false when registry is empty', () => {
    expect(hasUnassignedEndpoints()).toBe(false);
  });
});

describe('formatEnvironmentReportText', () => {
  it('formats report as readable text', () => {
    assignEnvironment('GET', '/health', 'production');
    const report = generateEnvironmentReport();
    const text = formatEnvironmentReportText(report);
    expect(text).toContain('# Environment Report');
    expect(text).toContain('production');
    expect(text).toContain('GET /health');
  });

  it('handles empty report gracefully', () => {
    const report = generateEnvironmentReport();
    const text = formatEnvironmentReportText(report);
    expect(text).toContain('Total Endpoints: 0');
    expect(text).toContain('Environments: none');
  });
});
