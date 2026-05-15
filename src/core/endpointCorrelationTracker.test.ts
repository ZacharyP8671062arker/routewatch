import {
  recordCorrelatedRequest,
  flushSession,
  getCorrelations,
  getAllCorrelations,
  resetCorrelationTracker,
  makeKey,
} from './endpointCorrelationTracker';

beforeEach(() => {
  resetCorrelationTracker();
});

describe('makeKey', () => {
  it('formats method and path into a key', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
    expect(makeKey('POST', '/orders')).toBe('POST:/orders');
  });
});

describe('recordCorrelatedRequest', () => {
  it('records correlation between two endpoints in the same session', () => {
    recordCorrelatedRequest('sess1', 'GET', '/users');
    recordCorrelatedRequest('sess1', 'GET', '/orders');

    const usersCorr = getCorrelations('GET', '/users');
    expect(usersCorr['GET:/orders']).toBe(1);

    const ordersCorr = getCorrelations('GET', '/orders');
    expect(ordersCorr['GET:/users']).toBe(1);
  });

  it('increments count for repeated co-occurrences across sessions', () => {
    recordCorrelatedRequest('s1', 'GET', '/a');
    recordCorrelatedRequest('s1', 'POST', '/b');
    recordCorrelatedRequest('s2', 'GET', '/a');
    recordCorrelatedRequest('s2', 'POST', '/b');

    const corr = getCorrelations('GET', '/a');
    expect(corr['POST:/b']).toBe(2);
  });

  it('does not correlate an endpoint with itself', () => {
    recordCorrelatedRequest('s1', 'GET', '/a');
    recordCorrelatedRequest('s1', 'GET', '/a');

    const corr = getCorrelations('GET', '/a');
    expect(corr['GET:/a']).toBeUndefined();
  });

  it('does not correlate endpoints across different sessions', () => {
    recordCorrelatedRequest('s1', 'GET', '/x');
    recordCorrelatedRequest('s2', 'GET', '/y');

    const corrX = getCorrelations('GET', '/x');
    expect(corrX['GET:/y']).toBeUndefined();
  });
});

describe('flushSession', () => {
  it('removes the session buffer so future requests are not correlated with past ones', () => {
    recordCorrelatedRequest('s1', 'GET', '/a');
    flushSession('s1');
    recordCorrelatedRequest('s1', 'GET', '/b');

    const corrA = getCorrelations('GET', '/a');
    expect(corrA['GET:/b']).toBeUndefined();
  });
});

describe('getAllCorrelations', () => {
  it('returns all tracked correlations', () => {
    recordCorrelatedRequest('s1', 'GET', '/users');
    recordCorrelatedRequest('s1', 'DELETE', '/users');

    const all = getAllCorrelations();
    expect(all['GET:/users']).toBeDefined();
    expect(all['DELETE:/users']).toBeDefined();
  });

  it('returns empty object when no data', () => {
    expect(getAllCorrelations()).toEqual({});
  });
});
