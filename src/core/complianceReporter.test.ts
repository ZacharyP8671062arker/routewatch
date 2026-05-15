import {
  generateComplianceReport,
  hasComplianceViolations,
  formatComplianceReportText,
} from './complianceReporter';
import { assignCompliance, resetComplianceTracker } from './endpointComplianceTracker';

beforeEach(() => resetComplianceTracker());

describe('generateComplianceReport', () => {
  it('returns zeroed report when no data', () => {
    const report = generateComplianceReport();
    expect(report.total).toBe(0);
    expect(report.compliant).toBe(0);
    expect(report.nonCompliant).toBe(0);
    expect(report.violations).toHaveLength(0);
  });

  it('counts compliant and non-compliant correctly', () => {
    assignCompliance('GET', '/a', ['GDPR'], true);
    assignCompliance('POST', '/b', ['GDPR'], false, 'Missing consent flow');
    const report = generateComplianceReport();
    expect(report.total).toBe(2);
    expect(report.compliant).toBe(1);
    expect(report.nonCompliant).toBe(1);
  });

  it('groups by standard', () => {
    assignCompliance('GET', '/x', ['HIPAA'], true);
    assignCompliance('GET', '/y', ['HIPAA', 'SOC2'], false);
    const report = generateComplianceReport();
    expect(report.byStandard['HIPAA'].total).toBe(2);
    expect(report.byStandard['HIPAA'].compliant).toBe(1);
    expect(report.byStandard['SOC2'].total).toBe(1);
    expect(report.byStandard['SOC2'].compliant).toBe(0);
  });
});

describe('hasComplianceViolations', () => {
  it('returns false when all compliant', () => {
    assignCompliance('GET', '/ok', ['GDPR'], true);
    expect(hasComplianceViolations()).toBe(false);
  });

  it('returns true when violations exist', () => {
    assignCompliance('GET', '/bad', ['PCI-DSS'], false);
    expect(hasComplianceViolations()).toBe(true);
  });
});

describe('formatComplianceReportText', () => {
  it('includes standard summary and violations', () => {
    assignCompliance('DELETE', '/pii', ['GDPR'], false, 'Needs audit');
    const report = generateComplianceReport();
    const text = formatComplianceReportText(report);
    expect(text).toContain('Non-compliant           : 1');
    expect(text).toContain('GDPR');
    expect(text).toContain('[DELETE] /pii');
    expect(text).toContain('Needs audit');
  });

  it('omits violations section when all compliant', () => {
    assignCompliance('GET', '/safe', ['SOC2'], true);
    const report = generateComplianceReport();
    const text = formatComplianceReportText(report);
    expect(text).not.toContain('Violations:');
  });
});
