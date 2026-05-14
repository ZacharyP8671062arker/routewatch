import {
  configureAuth,
  recordAuthRequest,
  getAuthStats,
  getAllAuthStats,
  resetAuthTracker,
  detectSchemeFromHeaders,
  makeKey,
} from './endpointAuthTracker';

beforeEach(() => {
  resetAuthTracker();
});

describe('makeKey', () => {
  it('normalises method to uppercase', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
  });
});

describe('configureAuth', () => {
  it('stores the required scheme for an endpoint', () => {
    configureAuth('GET', '/users', 'bearer');
    const stats = getAuthStats('GET', '/users');
    expect(stats?.requiredScheme).toBe('bearer');
  });

  it('updates required scheme if already configured', () => {
    configureAuth('GET', '/users', 'bearer');
    configureAuth('GET', '/users', 'api-key');
    expect(getAuthStats('GET', '/users')?.requiredScheme).toBe('api-key');
  });
});

describe('recordAuthRequest', () => {
  it('increments totalRequests', () => {
    recordAuthRequest('POST', '/login', 'basic');
    recordAuthRequest('POST', '/login', 'basic');
    expect(getAuthStats('POST', '/login')?.totalRequests).toBe(2);
  });

  it('increments unauthenticatedRequests for none scheme', () => {
    recordAuthRequest('GET', '/public', 'none');
    recordAuthRequest('GET', '/public', 'bearer');
    const stats = getAuthStats('GET', '/public');
    expect(stats?.unauthenticatedRequests).toBe(1);
  });

  it('tracks unique observed schemes', () => {
    recordAuthRequest('GET', '/data', 'bearer');
    recordAuthRequest('GET', '/data', 'bearer');
    recordAuthRequest('GET', '/data', 'api-key');
    const stats = getAuthStats('GET', '/data');
    expect(stats?.observedSchemes).toEqual(['bearer', 'api-key']);
  });

  it('auto-creates entry if not pre-configured', () => {
    recordAuthRequest('DELETE', '/item', 'bearer');
    const stats = getAuthStats('DELETE', '/item');
    expect(stats).toBeDefined();
    expect(stats?.requiredScheme).toBe('unknown');
  });
});

describe('getAllAuthStats', () => {
  it('returns all tracked endpoints', () => {
    configureAuth('GET', '/a', 'bearer');
    configureAuth('POST', '/b', 'api-key');
    expect(getAllAuthStats()).toHaveLength(2);
  });
});

describe('detectSchemeFromHeaders', () => {
  it('detects bearer token', () => {
    expect(detectSchemeFromHeaders({ authorization: 'Bearer abc123' })).toBe('bearer');
  });

  it('detects basic auth', () => {
    expect(detectSchemeFromHeaders({ authorization: 'Basic dXNlcjpwYXNz' })).toBe('basic');
  });

  it('detects api-key header', () => {
    expect(detectSchemeFromHeaders({ 'x-api-key': 'my-key' })).toBe('api-key');
  });

  it('returns none when no auth headers present', () => {
    expect(detectSchemeFromHeaders({ 'content-type': 'application/json' })).toBe('none');
  });

  it('prefers api-key over authorization', () => {
    expect(
      detectSchemeFromHeaders({ authorization: 'Bearer tok', 'x-api-key': 'k' })
    ).toBe('api-key');
  });
});
