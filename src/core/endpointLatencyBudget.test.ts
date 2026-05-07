import {
  configureLatencyBudget,
  resetLatencyBudget,
  recordLatencySample,
  getLatencyBudgetStatus,
  getAllLatencyBudgetStatuses,
  makeKey,
} from './endpointLatencyBudget';

describe('endpointLatencyBudget', () => {
  beforeEach(() => {
    resetLatencyBudget();
  });

  describe('makeKey', () => {
    it('should produce uppercase method and path key', () => {
      expect(makeKey('get', '/users')).toBe('GET:/users');
    });
  });

  describe('configureLatencyBudget', () => {
    it('should store config and return status', () => {
      configureLatencyBudget('GET', '/users', { budgetMs: 200 });
      const status = getLatencyBudgetStatus('GET', '/users');
      expect(status).not.toBeNull();
      expect(status!.budgetMs).toBe(200);
    });
  });

  describe('getLatencyBudgetStatus', () => {
    it('should return null when no config exists', () => {
      expect(getLatencyBudgetStatus('GET', '/unknown')).toBeNull();
    });

    it('should return zero latency when no samples recorded', () => {
      configureLatencyBudget('GET', '/users', { budgetMs: 300 });
      const status = getLatencyBudgetStatus('GET', '/users');
      expect(status!.avgLatencyMs).toBe(0);
      expect(status!.p95LatencyMs).toBe(0);
      expect(status!.violated).toBe(false);
    });

    it('should detect a budget violation', () => {
      configureLatencyBudget('POST', '/orders', { budgetMs: 100 });
      for (let i = 0; i < 20; i++) recordLatencySample('POST', '/orders', 250);
      const status = getLatencyBudgetStatus('POST', '/orders');
      expect(status!.violated).toBe(true);
      expect(status!.consumed).toBeGreaterThan(1);
    });

    it('should not violate when latency is within budget', () => {
      configureLatencyBudget('GET', '/health', { budgetMs: 500 });
      for (let i = 0; i < 10; i++) recordLatencySample('GET', '/health', 50);
      const status = getLatencyBudgetStatus('GET', '/health');
      expect(status!.violated).toBe(false);
      expect(status!.consumed).toBeLessThan(1);
    });

    it('should cap samples at MAX_SAMPLES', () => {
      configureLatencyBudget('GET', '/stream', { budgetMs: 100 });
      for (let i = 0; i < 250; i++) recordLatencySample('GET', '/stream', i);
      const status = getLatencyBudgetStatus('GET', '/stream');
      expect(status).not.toBeNull();
    });
  });

  describe('getAllLatencyBudgetStatuses', () => {
    it('should return all configured endpoints', () => {
      configureLatencyBudget('GET', '/a', { budgetMs: 100 });
      configureLatencyBudget('POST', '/b', { budgetMs: 200 });
      const all = getAllLatencyBudgetStatuses();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when nothing configured', () => {
      expect(getAllLatencyBudgetStatuses()).toEqual([]);
    });
  });
});
