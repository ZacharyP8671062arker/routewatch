import { generateSlaReport, hasSlaViolations, formatSlaReportText } from './slaReporter';
import { recordSlaRequest, resetSlaTracker, configureSla } from './endpointSlaTracker';

describe('slaReporter', () => {
  beforeEach(() => {
    resetSlaTracker();
  });

  describe('generateSlaReport', () => {
    it('should return empty report when no data', () => {
      const report = generateSlaReport();
      expect(report.totalEndpoints).toBe(0);
      expect(report.compliantEndpoints).toBe(0);
      expect(report.violatingEndpoints).toEqual([]);
      expect(report.details).toEqual({});
    });

    it('should include generatedAt timestamp', () => {
      const report = generateSlaReport();
      expect(new Date(report.generatedAt).getTime()).not.toBeNaN();
    });

    it('should report compliant endpoints correctly', () => {
      recordSlaRequest('GET', '/ping', 100, 200);
      recordSlaRequest('GET', '/ping', 150, 200);
      const report = generateSlaReport();
      expect(report.totalEndpoints).toBe(1);
      expect(report.compliantEndpoints).toBe(1);
      expect(report.violatingEndpoints).toHaveLength(0);
    });

    it('should identify slow endpoints as violating', () => {
      configureSla({ maxResponseTimeMs: 200 });
      recordSlaRequest('GET', '/slow', 500, 200);
      const report = generateSlaReport();
      expect(report.violatingEndpoints).toContain('GET:/slow');
      expect(report.compliantEndpoints).toBe(0);
    });

    it('should include lastViolationAt as ISO string', () => {
      recordSlaRequest('POST', '/fail', 100, 500);
      const report = generateSlaReport();
      const detail = report.details['POST:/fail'];
      expect(detail.lastViolationAt).not.toBeNull();
      expect(new Date(detail.lastViolationAt!).getTime()).not.toBeNaN();
    });

    it('should set lastViolationAt to null for compliant endpoints', () => {
      recordSlaRequest('GET', '/ok', 100, 200);
      const report = generateSlaReport();
      expect(report.details['GET:/ok'].lastViolationAt).toBeNull();
    });
  });

  describe('hasSlaViolations', () => {
    it('should return false when all compliant', () => {
      recordSlaRequest('GET', '/ok', 50, 200);
      expect(hasSlaViolations()).toBe(false);
    });

    it('should return true when violations exist', () => {
      recordSlaRequest('DELETE', '/bad', 100, 503);
      expect(hasSlaViolations()).toBe(true);
    });
  });

  describe('formatSlaReportText', () => {
    it('should include header and summary', () => {
      const report = generateSlaReport();
      const text = formatSlaReportText(report);
      expect(text).toContain('SLA Report');
      expect(text).toContain('compliant');
    });

    it('should list violating endpoints', () => {
      configureSla({ maxResponseTimeMs: 100 });
      recordSlaRequest('GET', '/laggy', 300, 200);
      const report = generateSlaReport();
      const text = formatSlaReportText(report);
      expect(text).toContain('GET:/laggy');
      expect(text).toContain('slow requests');
    });

    it('should show all-clear message when compliant', () => {
      recordSlaRequest('GET', '/fast', 10, 200);
      const report = generateSlaReport();
      const text = formatSlaReportText(report);
      expect(text).toContain('All endpoints are SLA compliant.');
    });
  });
});
