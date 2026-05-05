import {
  setThresholds,
  getThresholds,
  resetThresholds,
  evaluateThresholds,
  ThresholdViolation,
} from './alertThresholds';

describe('alertThresholds', () => {
  beforeEach(() => {
    resetThresholds();
  });

  describe('setThresholds / getThresholds', () => {
    it('returns default thresholds initially', () => {
      const t = getThresholds();
      expect(t.maxAvgResponseTimeMs).toBe(2000);
      expect(t.maxErrorRate).toBe(0.1);
    });

    it('merges partial config with defaults', () => {
      setThresholds({ maxAvgResponseTimeMs: 500 });
      const t = getThresholds();
      expect(t.maxAvgResponseTimeMs).toBe(500);
      expect(t.maxErrorRate).toBe(0.1);
    });

    it('resets to defaults after resetThresholds()', () => {
      setThresholds({ maxAvgResponseTimeMs: 100, maxErrorRate: 0.5 });
      resetThresholds();
      const t = getThresholds();
      expect(t.maxAvgResponseTimeMs).toBe(2000);
      expect(t.maxErrorRate).toBe(0.1);
    });
  });

  describe('evaluateThresholds', () => {
    it('returns no violations when all metrics are within bounds', () => {
      const violations = evaluateThresholds('GET', '/api/users', 100, 0.01, 50);
      expect(violations).toHaveLength(0);
    });

    it('detects response time violation', () => {
      const violations = evaluateThresholds('GET', '/api/slow', 3000, 0.01, 50);
      const v = violations.find((x) => x.type === 'response_time');
      expect(v).toBeDefined();
      expect(v!.value).toBe(3000);
      expect(v!.threshold).toBe(2000);
    });

    it('detects error rate violation', () => {
      const violations = evaluateThresholds('POST', '/api/broken', 200, 0.5, 50);
      const v = violations.find((x) => x.type === 'error_rate');
      expect(v).toBeDefined();
      expect(v!.value).toBe(0.5);
    });

    it('detects low traffic violation when minRequestCount is set', () => {
      setThresholds({ minRequestCount: 100 });
      const violations = evaluateThresholds('GET', '/api/rare', 200, 0.01, 5);
      const v = violations.find((x) => x.type === 'low_traffic');
      expect(v).toBeDefined();
      expect(v!.value).toBe(5);
      expect(v!.threshold).toBe(100);
    });

    it('returns multiple violations when several thresholds are breached', () => {
      const violations = evaluateThresholds('DELETE', '/api/chaos', 5000, 0.9, 1);
      expect(violations.length).toBeGreaterThanOrEqual(2);
    });
  });
});
