import {
  configureThroughputTracker,
  resetThroughputTracker,
  recordThroughputRequest,
  getThroughputStats,
  getAllThroughputStats,
  makeKey,
} from './endpointThroughputTracker';

describe('endpointThroughputTracker', () => {
  beforeEach(() => {
    resetThroughputTracker();
  });

  describe('makeKey', () => {
    it('combines method and path', () => {
      expect(makeKey('get', '/users')).toBe('GET:/users');
    });

    it('uppercases method', () => {
      expect(makeKey('post', '/items')).toBe('POST:/items');
    });
  });

  describe('recordThroughputRequest', () => {
    it('creates an entry on first record', () => {
      recordThroughputRequest('GET', '/users');
      const stats = getThroughputStats('GET', '/users');
      expect(stats).not.toBeNull();
      expect(stats!.totalInWindow).toBe(1);
    });

    it('accumulates multiple requests', () => {
      recordThroughputRequest('GET', '/users');
      recordThroughputRequest('GET', '/users');
      recordThroughputRequest('GET', '/users');
      const stats = getThroughputStats('GET', '/users');
      expect(stats!.totalInWindow).toBe(3);
    });

    it('tracks peak RPS', () => {
      configureThroughputTracker({ windowMs: 1000 });
      for (let i = 0; i < 5; i++) recordThroughputRequest('GET', '/ping');
      const stats = getThroughputStats('GET', '/ping');
      expect(stats!.peakRps).toBeGreaterThan(0);
    });
  });

  describe('getThroughputStats', () => {
    it('returns null for unknown endpoint', () => {
      expect(getThroughputStats('GET', '/unknown')).toBeNull();
    });

    it('returns correct method and path', () => {
      recordThroughputRequest('POST', '/orders');
      const stats = getThroughputStats('POST', '/orders');
      expect(stats!.method).toBe('POST');
      expect(stats!.path).toBe('/orders');
    });

    it('currentRps is non-negative', () => {
      recordThroughputRequest('GET', '/health');
      const stats = getThroughputStats('GET', '/health');
      expect(stats!.currentRps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAllThroughputStats', () => {
    it('returns empty array when no data', () => {
      expect(getAllThroughputStats()).toEqual([]);
    });

    it('returns stats for all recorded endpoints', () => {
      recordThroughputRequest('GET', '/a');
      recordThroughputRequest('POST', '/b');
      const all = getAllThroughputStats();
      expect(all).toHaveLength(2);
      const paths = all.map(s => s.path);
      expect(paths).toContain('/a');
      expect(paths).toContain('/b');
    });
  });

  describe('configureThroughputTracker', () => {
    it('accepts custom windowMs', () => {
      expect(() => configureThroughputTracker({ windowMs: 5000 })).not.toThrow();
    });
  });

  describe('resetThroughputTracker', () => {
    it('clears all stored data', () => {
      recordThroughputRequest('GET', '/test');
      resetThroughputTracker();
      expect(getAllThroughputStats()).toEqual([]);
    });
  });
});
