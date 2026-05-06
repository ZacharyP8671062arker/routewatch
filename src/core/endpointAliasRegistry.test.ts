import {
  assignAlias,
  removeAlias,
  getAlias,
  getAllAliases,
  hasAlias,
  resetAliasRegistry,
  formatAliasReportText,
} from './endpointAliasRegistry';

describe('endpointAliasRegistry', () => {
  beforeEach(() => {
    resetAliasRegistry();
  });

  it('assigns and retrieves an alias', () => {
    assignAlias('GET', '/users', 'List Users', 'Returns all users');
    const entry = getAlias('GET', '/users');
    expect(entry).toBeDefined();
    expect(entry?.alias).toBe('List Users');
    expect(entry?.description).toBe('Returns all users');
  });

  it('is case-insensitive on method', () => {
    assignAlias('get', '/items', 'Get Items');
    expect(getAlias('GET', '/items')?.alias).toBe('Get Items');
  });

  it('returns undefined for unregistered route', () => {
    expect(getAlias('POST', '/unknown')).toBeUndefined();
  });

  it('hasAlias returns true when alias exists', () => {
    assignAlias('DELETE', '/posts/:id', 'Delete Post');
    expect(hasAlias('DELETE', '/posts/:id')).toBe(true);
  });

  it('hasAlias returns false when alias does not exist', () => {
    expect(hasAlias('PATCH', '/nope')).toBe(false);
  });

  it('removes an alias', () => {
    assignAlias('PUT', '/profile', 'Update Profile');
    const removed = removeAlias('PUT', '/profile');
    expect(removed).toBe(true);
    expect(getAlias('PUT', '/profile')).toBeUndefined();
  });

  it('removeAlias returns false if not found', () => {
    expect(removeAlias('GET', '/ghost')).toBe(false);
  });

  it('getAllAliases returns all registered entries', () => {
    assignAlias('GET', '/a', 'Route A');
    assignAlias('POST', '/b', 'Route B', 'Creates B');
    const all = getAllAliases();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all['GET:/a'].alias).toBe('Route A');
    expect(all['POST:/b'].description).toBe('Creates B');
  });

  it('formatAliasReportText returns placeholder when empty', () => {
    expect(formatAliasReportText()).toBe('No aliases registered.');
  });

  it('formatAliasReportText lists all aliases', () => {
    assignAlias('GET', '/health', 'Health Check', 'Liveness probe');
    const text = formatAliasReportText();
    expect(text).toContain('GET:/health');
    expect(text).toContain('"Health Check"');
    expect(text).toContain('Liveness probe');
  });
});
