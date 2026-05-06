import {
  configureDeprecator,
  resetDeprecator,
  markDeprecated,
  getDeprecationStatus,
  getAllDeprecations,
  isDeprecated,
} from './endpointDeprecator';

beforeEach(() => {
  resetDeprecator();
});

describe('markDeprecated', () => {
  it('marks a route as deprecated', () => {
    markDeprecated('GET', '/old-users', 'Use /users instead');
    expect(isDeprecated('GET', '/old-users')).toBe(true);
  });

  it('is case-insensitive for method', () => {
    markDeprecated('get', '/old-users');
    expect(isDeprecated('GET', '/old-users')).toBe(true);
  });

  it('stores reason and sunsetAt', () => {
    const sunset = new Date(Date.now() + 86400000);
    markDeprecated('POST', '/legacy', 'old api', sunset);
    const all = getAllDeprecations();
    expect(all[0].reason).toBe('old api');
    expect(all[0].sunsetAt).toEqual(sunset);
  });
});

describe('getDeprecationStatus', () => {
  it('returns active for a recently seen route', () => {
    const status = getDeprecationStatus('GET', '/users', new Date());
    expect(status).toBe('active');
  });

  it('returns warning when route is older than warnAfterDays', () => {
    configureDeprecator({ warnAfterDays: 10, maxAgeDays: 30 });
    const old = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);
    expect(getDeprecationStatus('GET', '/stale', old)).toBe('warning');
  });

  it('returns deprecated when route exceeds maxAgeDays', () => {
    configureDeprecator({ warnAfterDays: 10, maxAgeDays: 30 });
    const veryOld = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    expect(getDeprecationStatus('GET', '/ancient', veryOld)).toBe('deprecated');
  });

  it('returns deprecated for manually tagged route', () => {
    markDeprecated('DELETE', '/remove-me');
    const status = getDeprecationStatus('DELETE', '/remove-me', new Date());
    expect(status).toBe('deprecated');
  });

  it('returns sunset when sunsetAt has passed', () => {
    const past = new Date(Date.now() - 1000);
    markDeprecated('PUT', '/gone', 'removed', past);
    expect(getDeprecationStatus('PUT', '/gone', new Date())).toBe('sunset');
  });
});

describe('getAllDeprecations', () => {
  it('returns all manually tagged deprecations', () => {
    markDeprecated('GET', '/a');
    markDeprecated('POST', '/b');
    expect(getAllDeprecations()).toHaveLength(2);
  });

  it('returns empty array when none tagged', () => {
    expect(getAllDeprecations()).toHaveLength(0);
  });
});
