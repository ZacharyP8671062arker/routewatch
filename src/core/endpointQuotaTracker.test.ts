import {
  configureQuota,
  resetQuotaTracker,
  recordQuotaRequest,
  getQuotaStats,
  getAllQuotaStats,
  makeKey,
} from './endpointQuotaTracker';

beforeEach(() => {
  resetQuotaTracker();
});

describe('makeKey', () => {
  it('uppercases method and joins with path', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
  });
});

describe('configureQuota + getQuotaStats', () => {
  it('returns null when no config exists', () => {
    expect(getQuotaStats('GET', '/unknown')).toBeNull();
  });

  it('returns zero count before any requests', () => {
    configureQuota('GET', '/items', { limit: 10, windowMs: 60000 });
    const stats = getQuotaStats('GET', '/items')!;
    expect(stats.count).toBe(0);
    expect(stats.exceeded).toBe(false);
    expect(stats.limit).toBe(10);
  });
});

describe('recordQuotaRequest', () => {
  it('increments count within window', () => {
    configureQuota('POST', '/orders', { limit: 5, windowMs: 60000 });
    const now = Date.now();
    recordQuotaRequest('POST', '/orders', now);
    recordQuotaRequest('POST', '/orders', now + 1000);
    const stats = getQuotaStats('POST', '/orders', now + 2000)!;
    expect(stats.count).toBe(2);
  });

  it('resets count after window expires', () => {
    configureQuota('POST', '/orders', { limit: 5, windowMs: 1000 });
    const now = Date.now();
    recordQuotaRequest('POST', '/orders', now);
    recordQuotaRequest('POST', '/orders', now + 500);
    // After window
    recordQuotaRequest('POST', '/orders', now + 1500);
    const stats = getQuotaStats('POST', '/orders', now + 1600)!;
    expect(stats.count).toBe(1);
  });

  it('marks exceeded when count surpasses limit', () => {
    configureQuota('GET', '/search', { limit: 2, windowMs: 60000 });
    const now = Date.now();
    recordQuotaRequest('GET', '/search', now);
    recordQuotaRequest('GET', '/search', now);
    recordQuotaRequest('GET', '/search', now);
    const stats = getQuotaStats('GET', '/search', now)!;
    expect(stats.exceeded).toBe(true);
    expect(stats.count).toBe(3);
  });

  it('ignores unregistered routes silently', () => {
    recordQuotaRequest('DELETE', '/ghost');
    expect(getQuotaStats('DELETE', '/ghost')).toBeNull();
  });
});

describe('getAllQuotaStats', () => {
  it('returns stats for all configured routes', () => {
    configureQuota('GET', '/a', { limit: 10, windowMs: 5000 });
    configureQuota('POST', '/b', { limit: 20, windowMs: 5000 });
    const all = getAllQuotaStats();
    expect(all).toHaveLength(2);
    const paths = all.map((s) => s.path);
    expect(paths).toContain('/a');
    expect(paths).toContain('/b');
  });
});
