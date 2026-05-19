import {
  recordFingerprint,
  getFingerprint,
  getAllFingerprints,
  resetFingerprintTracker,
  compareFingerprints,
  makeKey,
} from './endpointFingerprintTracker';

beforeEach(() => {
  resetFingerprintTracker();
});

describe('makeKey', () => {
  it('normalises method to upper case', () => {
    expect(makeKey('get', '/users')).toBe('GET::/users');
  });
});

describe('recordFingerprint', () => {
  it('stores a new fingerprint', () => {
    const fp = recordFingerprint('GET', '/users', [], ['id', 'name'], 200);
    expect(fp.method).toBe('GET');
    expect(fp.path).toBe('/users');
    expect(fp.responseBodyKeys).toEqual(['id', 'name']);
    expect(fp.statusCodes).toEqual([200]);
  });

  it('merges keys on subsequent calls', () => {
    recordFingerprint('GET', '/users', [], ['id'], 200);
    const fp = recordFingerprint('GET', '/users', [], ['id', 'email'], 404);
    expect(fp.responseBodyKeys).toEqual(['email', 'id']);
    expect(fp.statusCodes).toEqual([200, 404]);
  });

  it('deduplicates keys', () => {
    recordFingerprint('POST', '/items', ['name'], ['id'], 201);
    const fp = recordFingerprint('POST', '/items', ['name', 'name'], ['id'], 201);
    expect(fp.requestBodyKeys).toEqual(['name']);
    expect(fp.statusCodes).toEqual([201]);
  });
});

describe('getFingerprint', () => {
  it('returns undefined for unknown route', () => {
    expect(getFingerprint('DELETE', '/ghost')).toBeUndefined();
  });

  it('returns stored fingerprint', () => {
    recordFingerprint('PUT', '/things', ['x'], ['y'], 200);
    const fp = getFingerprint('PUT', '/things');
    expect(fp).toBeDefined();
    expect(fp?.path).toBe('/things');
  });
});

describe('getAllFingerprints', () => {
  it('returns all stored fingerprints', () => {
    recordFingerprint('GET', '/a', [], [], 200);
    recordFingerprint('POST', '/b', ['x'], ['y'], 201);
    expect(getAllFingerprints()).toHaveLength(2);
  });
});

describe('compareFingerprints', () => {
  it('detects added response keys', () => {
    const a = recordFingerprint('GET', '/v1', [], ['id'], 200);
    resetFingerprintTracker();
    const b = recordFingerprint('GET', '/v2', [], ['id', 'createdAt'], 200);
    const diff = compareFingerprints(a, b);
    expect(diff.added).toEqual(['createdAt']);
    expect(diff.removed).toEqual([]);
  });

  it('detects removed response keys', () => {
    const a = recordFingerprint('GET', '/v1', [], ['id', 'name'], 200);
    resetFingerprintTracker();
    const b = recordFingerprint('GET', '/v2', [], ['id'], 200);
    const diff = compareFingerprints(a, b);
    expect(diff.removed).toEqual(['name']);
  });

  it('detects status code drift', () => {
    const a = recordFingerprint('GET', '/v1', [], [], 200);
    resetFingerprintTracker();
    const b = recordFingerprint('GET', '/v2', [], [], 500);
    const diff = compareFingerprints(a, b);
    expect(diff.statusDrift).toContain(500);
  });
});
