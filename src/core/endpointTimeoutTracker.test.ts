import {
  configureTimeout,
  resetTimeoutTracker,
  recordTimeoutRequest,
  getTimeoutStats,
  getAllTimeoutStats,
  makeKey,
} from './endpointTimeoutTracker';

beforeEach(() => {
  resetTimeoutTracker();
});

describe('makeKey', () => {
  it('formats method and path into a key', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
    expect(makeKey('POST', '/items')).toBe('POST:/items');
  });
});

describe('configureTimeout + getTimeoutStats', () => {
  it('returns null for unconfigured endpoint', () => {
    expect(getTimeoutStats('GET', '/unknown')).toBeNull();
  });

  it('returns stats with zero counts after configuration', () => {
    configureTimeout('GET', '/ping', 200);
    const result = getTimeoutStats('GET', '/ping');
    expect(result).not.toBeNull();
    expect(result!.thresholdMs).toBe(200);
    expect(result!.totalRequests).toBe(0);
    expect(result!.timeoutViolations).toBe(0);
    expect(result!.violationRate).toBe(0);
    expect(result!.lastViolationAt).toBeNull();
  });
});

describe('recordTimeoutRequest', () => {
  it('does nothing for unconfigured endpoint', () => {
    recordTimeoutRequest('GET', '/noop', 500);
    expect(getTimeoutStats('GET', '/noop')).toBeNull();
  });

  it('records a non-violating request', () => {
    configureTimeout('POST', '/data', 300);
    recordTimeoutRequest('POST', '/data', 150);
    const stats = getTimeoutStats('POST', '/data')!;
    expect(stats.totalRequests).toBe(1);
    expect(stats.timeoutViolations).toBe(0);
    expect(stats.lastViolationAt).toBeNull();
  });

  it('records a timeout violation', () => {
    configureTimeout('POST', '/data', 300);
    recordTimeoutRequest('POST', '/data', 450);
    const stats = getTimeoutStats('POST', '/data')!;
    expect(stats.totalRequests).toBe(1);
    expect(stats.timeoutViolations).toBe(1);
    expect(stats.lastViolationAt).not.toBeNull();
  });

  it('calculates violation rate correctly', () => {
    configureTimeout('GET', '/api', 100);
    recordTimeoutRequest('GET', '/api', 50);
    recordTimeoutRequest('GET', '/api', 200);
    recordTimeoutRequest('GET', '/api', 300);
    const stats = getTimeoutStats('GET', '/api')!;
    expect(stats.totalRequests).toBe(3);
    expect(stats.timeoutViolations).toBe(2);
    expect(stats.violationRate).toBeCloseTo(2 / 3);
  });
});

describe('getAllTimeoutStats', () => {
  it('returns empty array when nothing configured', () => {
    expect(getAllTimeoutStats()).toEqual([]);
  });

  it('returns stats for all configured endpoints', () => {
    configureTimeout('GET', '/a', 100);
    configureTimeout('POST', '/b', 200);
    const all = getAllTimeoutStats();
    expect(all).toHaveLength(2);
    const paths = all.map((s) => s.path);
    expect(paths).toContain('/a');
    expect(paths).toContain('/b');
  });
});
