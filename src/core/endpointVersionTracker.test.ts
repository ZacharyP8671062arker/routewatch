import {
  assignVersion,
  removeVersion,
  getVersions,
  getLatestVersion,
  getAllVersions,
  getEndpointsByVersion,
  resetVersionTracker,
} from './endpointVersionTracker';

beforeEach(() => {
  resetVersionTracker();
});

describe('assignVersion', () => {
  it('assigns a version to an endpoint', () => {
    assignVersion('GET', '/users', 'v1');
    expect(getVersions('GET', '/users')).toContain('v1');
  });

  it('does not duplicate versions', () => {
    assignVersion('GET', '/users', 'v1');
    assignVersion('GET', '/users', 'v1');
    expect(getVersions('GET', '/users')).toHaveLength(1);
  });

  it('supports multiple versions per endpoint', () => {
    assignVersion('GET', '/users', 'v1');
    assignVersion('GET', '/users', 'v2');
    expect(getVersions('GET', '/users')).toEqual(['v1', 'v2']);
  });
});

describe('removeVersion', () => {
  it('removes a version from an endpoint', () => {
    assignVersion('POST', '/orders', 'v1');
    removeVersion('POST', '/orders', 'v1');
    expect(getVersions('POST', '/orders')).not.toContain('v1');
  });

  it('handles removing a non-existent version gracefully', () => {
    expect(() => removeVersion('GET', '/missing', 'v1')).not.toThrow();
  });
});

describe('getLatestVersion', () => {
  it('returns the last assigned version', () => {
    assignVersion('GET', '/items', 'v1');
    assignVersion('GET', '/items', 'v2');
    expect(getLatestVersion('GET', '/items')).toBe('v2');
  });

  it('returns null when no versions assigned', () => {
    expect(getLatestVersion('DELETE', '/nothing')).toBeNull();
  });
});

describe('getAllVersions', () => {
  it('returns all endpoint version mappings', () => {
    assignVersion('GET', '/a', 'v1');
    assignVersion('POST', '/b', 'v2');
    const all = getAllVersions();
    expect(all['GET:/a']).toContain('v1');
    expect(all['POST:/b']).toContain('v2');
  });
});

describe('getEndpointsByVersion', () => {
  it('returns endpoints tagged with a given version', () => {
    assignVersion('GET', '/users', 'v2');
    assignVersion('POST', '/users', 'v1');
    assignVersion('GET', '/posts', 'v2');
    const results = getEndpointsByVersion('v2');
    expect(results).toContain('GET:/users');
    expect(results).toContain('GET:/posts');
    expect(results).not.toContain('POST:/users');
  });
});
