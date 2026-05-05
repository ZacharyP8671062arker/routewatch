import { shouldIncludeRoute, createRouteFilter } from './routeFilter';

describe('shouldIncludeRoute', () => {
  it('returns true when no filters are specified', () => {
    expect(shouldIncludeRoute('GET', '/api/users', {})).toBe(true);
  });

  it('excludes paths matching a string prefix', () => {
    expect(shouldIncludeRoute('GET', '/health', { excludePaths: ['/health'] })).toBe(false);
    expect(shouldIncludeRoute('GET', '/api/users', { excludePaths: ['/health'] })).toBe(true);
  });

  it('excludes paths matching a regex', () => {
    expect(shouldIncludeRoute('GET', '/internal/metrics', { excludePaths: [/^\/internal/] })).toBe(false);
    expect(shouldIncludeRoute('GET', '/api/metrics', { excludePaths: [/^\/internal/] })).toBe(true);
  });

  it('includes only paths matching includePaths', () => {
    const options = { includePaths: ['/api'] };
    expect(shouldIncludeRoute('GET', '/api/users', options)).toBe(true);
    expect(shouldIncludeRoute('GET', '/health', options)).toBe(false);
  });

  it('excludes specified HTTP methods', () => {
    expect(shouldIncludeRoute('OPTIONS', '/api/users', { excludeMethods: ['OPTIONS'] })).toBe(false);
    expect(shouldIncludeRoute('GET', '/api/users', { excludeMethods: ['OPTIONS'] })).toBe(true);
  });

  it('is case-insensitive for methods', () => {
    expect(shouldIncludeRoute('options', '/api/users', { excludeMethods: ['OPTIONS'] })).toBe(false);
    expect(shouldIncludeRoute('GET', '/api/users', { includeMethods: ['get'] })).toBe(true);
  });

  it('includes only specified HTTP methods', () => {
    const options = { includeMethods: ['GET', 'POST'] };
    expect(shouldIncludeRoute('GET', '/api/users', options)).toBe(true);
    expect(shouldIncludeRoute('DELETE', '/api/users', options)).toBe(false);
  });

  it('applies customFilter', () => {
    const options = { customFilter: (method: string, path: string) => path.startsWith('/api') };
    expect(shouldIncludeRoute('GET', '/api/users', options)).toBe(true);
    expect(shouldIncludeRoute('GET', '/admin/users', options)).toBe(false);
  });

  it('combines multiple filters (all must pass)', () => {
    const options = {
      includePaths: ['/api'],
      excludeMethods: ['DELETE'],
    };
    expect(shouldIncludeRoute('GET', '/api/users', options)).toBe(true);
    expect(shouldIncludeRoute('DELETE', '/api/users', options)).toBe(false);
    expect(shouldIncludeRoute('GET', '/health', options)).toBe(false);
  });
});

describe('createRouteFilter', () => {
  it('returns a reusable filter function', () => {
    const filter = createRouteFilter({ excludePaths: ['/health'], excludeMethods: ['OPTIONS'] });
    expect(filter('GET', '/api/users')).toBe(true);
    expect(filter('GET', '/health')).toBe(false);
    expect(filter('OPTIONS', '/api/users')).toBe(false);
  });
});
