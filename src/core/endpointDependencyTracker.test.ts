import {
  addDependency,
  removeDependency,
  getDependencies,
  getAllDependencies,
  getDependents,
  clearDependencies,
  makeKey,
} from './endpointDependencyTracker';

beforeEach(() => {
  clearDependencies();
});

describe('makeKey', () => {
  it('formats method and path into a key', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
  });
});

describe('addDependency / getDependencies', () => {
  it('records a dependency for an endpoint', () => {
    addDependency('GET', '/orders', 'GET:/users');
    expect(getDependencies('GET', '/orders')).toContain('GET:/users');
  });

  it('supports multiple dependencies', () => {
    addDependency('GET', '/orders', 'GET:/users');
    addDependency('GET', '/orders', 'GET:/products');
    const deps = getDependencies('GET', '/orders');
    expect(deps).toHaveLength(2);
    expect(deps).toContain('GET:/products');
  });

  it('returns empty array when no dependencies registered', () => {
    expect(getDependencies('POST', '/unknown')).toEqual([]);
  });
});

describe('removeDependency', () => {
  it('removes a specific dependency', () => {
    addDependency('GET', '/orders', 'GET:/users');
    addDependency('GET', '/orders', 'GET:/products');
    removeDependency('GET', '/orders', 'GET:/users');
    expect(getDependencies('GET', '/orders')).not.toContain('GET:/users');
    expect(getDependencies('GET', '/orders')).toContain('GET:/products');
  });
});

describe('getAllDependencies', () => {
  it('returns all registered dependencies', () => {
    addDependency('GET', '/orders', 'GET:/users');
    addDependency('POST', '/checkout', 'GET:/cart');
    const all = getAllDependencies();
    expect(all['GET:/orders']).toContain('GET:/users');
    expect(all['POST:/checkout']).toContain('GET:/cart');
  });
});

describe('getDependents', () => {
  it('finds endpoints that depend on a given key', () => {
    addDependency('GET', '/orders', 'GET:/users');
    addDependency('POST', '/checkout', 'GET:/users');
    const dependents = getDependents('GET:/users');
    expect(dependents).toContain('GET:/orders');
    expect(dependents).toContain('POST:/checkout');
  });

  it('returns empty array when no dependents', () => {
    expect(getDependents('GET:/orphan')).toEqual([]);
  });
});
