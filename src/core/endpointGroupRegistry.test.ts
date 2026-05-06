import {
  assignGroup,
  removeGroup,
  getGroup,
  getEndpointsByGroup,
  getAllGroups,
  clearGroupRegistry,
} from './endpointGroupRegistry';

beforeEach(() => {
  clearGroupRegistry();
});

describe('assignGroup', () => {
  it('assigns a group to an endpoint', () => {
    assignGroup('GET', '/users', 'user-management');
    expect(getGroup('GET', '/users')).toBe('user-management');
  });

  it('overwrites existing group assignment', () => {
    assignGroup('GET', '/users', 'user-management');
    assignGroup('GET', '/users', 'admin');
    expect(getGroup('GET', '/users')).toBe('admin');
  });
});

describe('removeGroup', () => {
  it('removes group assignment from an endpoint', () => {
    assignGroup('GET', '/users', 'user-management');
    removeGroup('GET', '/users');
    expect(getGroup('GET', '/users')).toBeNull();
  });

  it('does nothing if endpoint has no group', () => {
    expect(() => removeGroup('GET', '/nonexistent')).not.toThrow();
  });
});

describe('getEndpointsByGroup', () => {
  it('returns all endpoints in a group', () => {
    assignGroup('GET', '/users', 'user-management');
    assignGroup('POST', '/users', 'user-management');
    assignGroup('GET', '/orders', 'order-management');

    const userEndpoints = getEndpointsByGroup('user-management');
    expect(userEndpoints).toHaveLength(2);
    expect(userEndpoints).toContainEqual({ method: 'GET', path: '/users' });
    expect(userEndpoints).toContainEqual({ method: 'POST', path: '/users' });
  });

  it('returns empty array for unknown group', () => {
    expect(getEndpointsByGroup('nonexistent')).toEqual([]);
  });
});

describe('getAllGroups', () => {
  it('returns all group names', () => {
    assignGroup('GET', '/users', 'user-management');
    assignGroup('GET', '/orders', 'order-management');

    const groups = getAllGroups();
    expect(groups).toContain('user-management');
    expect(groups).toContain('order-management');
    expect(groups).toHaveLength(2);
  });

  it('returns empty array when no groups assigned', () => {
    expect(getAllGroups()).toEqual([]);
  });
});
