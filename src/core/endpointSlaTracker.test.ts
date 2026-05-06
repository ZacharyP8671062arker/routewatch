import {
  configureSla,
  resetSlaTracker,
  recordSlaRequest,
  getSlaStatus,
  getAllSlaStatuses,
  makeKey,
} from './endpointSlaTracker';

describe('endpointSlaTracker', () => {
  beforeEach(() => {
    resetSlaTracker();
  });

  describe('makeKey', () => {
    it('should combine method and path', () => {
      expect(makeKey('get', '/users')).toBe('GET:/users');
    });

    it('should uppercase method', () => {
      expect(makeKey('post', '/items')).toBe('POST:/items');
    });
  });

  describe('recordSlaRequest', () => {
    it('should record a fast successful request as compliant', () => {
      recordSlaRequest('GET', '/users', 200, 200);
      const status = getSlaStatus('GET', '/users');
      expect(status).not.toBeNull();
      expect(status!.total).toBe(1);
      expect(status!.slowRequests).toBe(0);
      expect(status!.compliant).toBe(true);
    });

    it('should record a slow request', () => {
      configureSla({ maxResponseTimeMs: 500 });
      recordSlaRequest('GET', '/users', 800, 200);
      const status = getSlaStatus('GET', '/users');
      expect(status!.slowRequests).toBe(1);
      expect(status!.compliant).toBe(false);
    });

    it('should record a server error as a violation', () => {
      recordSlaRequest('POST', '/items', 100, 500);
      const status = getSlaStatus('POST', '/items');
      expect(status!.violations).toBe(1);
      expect(status!.lastViolationAt).not.toBeNull();
    });

    it('should accumulate multiple requests', () => {
      recordSlaRequest('GET', '/health', 50, 200);
      recordSlaRequest('GET', '/health', 60, 200);
      recordSlaRequest('GET', '/health', 70, 200);
      const status = getSlaStatus('GET', '/health');
      expect(status!.total).toBe(3);
    });
  });

  describe('getSlaStatus', () => {
    it('should return null for unknown endpoint', () => {
      expect(getSlaStatus('GET', '/unknown')).toBeNull();
    });
  });

  describe('getAllSlaStatuses', () => {
    it('should return all tracked endpoints', () => {
      recordSlaRequest('GET', '/a', 100, 200);
      recordSlaRequest('POST', '/b', 200, 201);
      const all = getAllSlaStatuses();
      expect(Object.keys(all)).toHaveLength(2);
      expect(all['GET:/a']).toBeDefined();
      expect(all['POST:/b']).toBeDefined();
    });

    it('should return empty object when no data', () => {
      expect(getAllSlaStatuses()).toEqual({});
    });
  });

  describe('configureSla', () => {
    it('should persist config across calls', () => {
      configureSla({ maxResponseTimeMs: 300 });
      recordSlaRequest('GET', '/fast', 400, 200);
      const status = getSlaStatus('GET', '/fast');
      expect(status!.slowRequests).toBe(1);
    });
  });
});
