import {
  assignGroup,
  removeGroup,
  getGroup,
  getEndpointsByGroup,
  getAllGroups,
  resetGroupRegistry,
} from './endpointGroupRegistry';

beforeEach(() => {
  resetGroupRegistry();
});

describe('assignGroup', () => {
  it('assigns a group to an endpoint', () => {
    assignGroup('GET', '/users', 'users');
    expect(getGroup('GET', '/users')).toBe('users');
  });

  it('reassigns endpoint to a new group and removes from old', () => {
    assignGroup('GET', '/users', 'users');
    assignGroup('GET', '/users', 'admin');
    expect(getGroup('GET', '/users')).toBe('admin');
    expect(getEndpointsByGroup('users')).not.toContain('GET:/users');
    expect(getEndpointsByGroup('admin')).toContain('GET:/users');
  });

  it('normalises method to uppercase', () => {
    assignGroup('get', '/items', 'catalog');
    expect(getGroup('GET', '/items')).toBe('catalog');
  });
});

describe('removeGroup', () => {
  it('removes group assignment from an endpoint', () => {
    assignGroup('POST', '/orders', 'orders');
    removeGroup('POST', '/orders');
    expect(getGroup('POST', '/orders')).toBeUndefined();
    expect(getEndpointsByGroup('orders')).not.toContain('POST:/orders');
  });

  it('does nothing for unknown endpoint', () => {
    expect(() => removeGroup('DELETE', '/unknown')).not.toThrow();
  });
});

describe('getEndpointsByGroup', () => {
  it('returns all endpoints in a group', () => {
    assignGroup('GET', '/users', 'users');
    assignGroup('POST', '/users', 'users');
    const endpoints = getEndpointsByGroup('users');
    expect(endpoints).toContain('GET:/users');
    expect(endpoints).toContain('POST:/users');
  });

  it('returns empty array for unknown group', () => {
    expect(getEndpointsByGroup('nonexistent')).toEqual([]);
  });
});

describe('getAllGroups', () => {
  it('returns all groups with their endpoints', () => {
    assignGroup('GET', '/users', 'users');
    assignGroup('GET', '/products', 'catalog');
    const all = getAllGroups();
    expect(all['users']).toContain('GET:/users');
    expect(all['catalog']).toContain('GET:/products');
  });

  it('returns empty object when no groups assigned', () => {
    expect(getAllGroups()).toEqual({});
  });
});
