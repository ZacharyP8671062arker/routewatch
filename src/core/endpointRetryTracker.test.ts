import {
  configureRetryTracker,
  resetRetryTracker,
  recordRetryRequest,
  getRetryStats,
  getAllRetryStats,
} from './endpointRetryTracker';

describe('endpointRetryTracker', () => {
  beforeEach(() => {
    resetRetryTracker();
  });

  describe('recordRetryRequest', () => {
    it('returns false for first request from a client', () => {
      const isRetry = recordRetryRequest('GET', '/api/users', '127.0.0.1');
      expect(isRetry).toBe(false);
    });

    it('returns true for a second request from same client within window', () => {
      configureRetryTracker({ windowMs: 5000 });
      recordRetryRequest('GET', '/api/users', '127.0.0.1');
      const isRetry = recordRetryRequest('GET', '/api/users', '127.0.0.1');
      expect(isRetry).toBe(true);
    });

    it('returns false for requests from different clients', () => {
      recordRetryRequest('GET', '/api/users', '127.0.0.1');
      const isRetry = recordRetryRequest('GET', '/api/users', '10.0.0.1');
      expect(isRetry).toBe(false);
    });

    it('does not count as retry if outside time window', () => {
      configureRetryTracker({ windowMs: 1 });
      recordRetryRequest('GET', '/api/users', '127.0.0.1');
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const isRetry = recordRetryRequest('GET', '/api/users', '127.0.0.1');
          expect(isRetry).toBe(false);
          resolve();
        }, 10);
      });
    });
  });

  describe('getRetryStats', () => {
    it('returns null for unknown route', () => {
      expect(getRetryStats('GET', '/unknown')).toBeNull();
    });

    it('returns correct stats after requests', () => {
      recordRetryRequest('POST', '/api/login', '1.1.1.1');
      recordRetryRequest('POST', '/api/login', '1.1.1.1');
      recordRetryRequest('POST', '/api/login', '2.2.2.2');

      const stats = getRetryStats('POST', '/api/login');
      expect(stats).not.toBeNull();
      expect(stats!.totalRequests).toBe(3);
      expect(stats!.totalRetries).toBe(1);
      expect(stats!.retryRate).toBeCloseTo(1 / 3);
    });

    it('includes firstSeen and lastSeen timestamps', () => {
      const before = Date.now();
      recordRetryRequest('GET', '/api/data', '5.5.5.5');
      const stats = getRetryStats('GET', '/api/data');
      expect(stats!.firstSeen).toBeGreaterThanOrEqual(before);
      expect(stats!.lastSeen).toBeGreaterThanOrEqual(stats!.firstSeen);
    });
  });

  describe('getAllRetryStats', () => {
    it('returns empty object when no data', () => {
      expect(getAllRetryStats()).toEqual({});
    });

    it('returns stats for all tracked routes', () => {
      recordRetryRequest('GET', '/a', '1.1.1.1');
      recordRetryRequest('POST', '/b', '2.2.2.2');
      const all = getAllRetryStats();
      expect(Object.keys(all)).toContain('GET:/a');
      expect(Object.keys(all)).toContain('POST:/b');
    });
  });
});
