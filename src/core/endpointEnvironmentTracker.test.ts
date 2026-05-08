import {
  assignEnvironment,
  removeEnvironment,
  getEnvironments,
  getEndpointsByEnvironment,
  getAllEnvironmentEntries,
  resetEnvironmentTracker,
} from './endpointEnvironmentTracker';

beforeEach(() => {
  resetEnvironmentTracker();
});

describe('assignEnvironment', () => {
  it('assigns an environment to an endpoint', () => {
    assignEnvironment('GET', '/users', 'production');
    expect(getEnvironments('GET', '/users')).toContain('production');
  });

  it('supports multiple environments for the same endpoint', () => {
    assignEnvironment('GET', '/users', 'staging');
    assignEnvironment('GET', '/users', 'production');
    const envs = getEnvironments('GET', '/users');
    expect(envs).toContain('staging');
    expect(envs).toContain('production');
  });

  it('does not duplicate environments', () => {
    assignEnvironment('POST', '/items', 'dev');
    assignEnvironment('POST', '/items', 'dev');
    expect(getEnvironments('POST', '/items')).toHaveLength(1);
  });
});

describe('removeEnvironment', () => {
  it('removes a specific environment from an endpoint', () => {
    assignEnvironment('GET', '/health', 'dev');
    assignEnvironment('GET', '/health', 'staging');
    removeEnvironment('GET', '/health', 'dev');
    expect(getEnvironments('GET', '/health')).not.toContain('dev');
    expect(getEnvironments('GET', '/health')).toContain('staging');
  });

  it('does not throw if endpoint does not exist', () => {
    expect(() => removeEnvironment('DELETE', '/ghost', 'prod')).not.toThrow();
  });
});

describe('getEndpointsByEnvironment', () => {
  it('returns endpoints active in a given environment', () => {
    assignEnvironment('GET', '/users', 'production');
    assignEnvironment('POST', '/orders', 'staging');
    assignEnvironment('GET', '/products', 'production');
    const prodEndpoints = getEndpointsByEnvironment('production');
    expect(prodEndpoints).toHaveLength(2);
    expect(prodEndpoints.map((e) => e.path)).toContain('/users');
    expect(prodEndpoints.map((e) => e.path)).toContain('/products');
  });

  it('returns empty array when no endpoints match', () => {
    expect(getEndpointsByEnvironment('canary')).toEqual([]);
  });
});

describe('getAllEnvironmentEntries', () => {
  it('returns all entries with their environments', () => {
    assignEnvironment('GET', '/a', 'dev');
    assignEnvironment('POST', '/b', 'prod');
    const all = getAllEnvironmentEntries();
    expect(all).toHaveLength(2);
  });

  it('returns empty array when nothing is registered', () => {
    expect(getAllEnvironmentEntries()).toEqual([]);
  });
});
