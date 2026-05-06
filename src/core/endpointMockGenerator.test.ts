import { generateMockForRoute, generateAllMocks } from './endpointMockGenerator';
import { RouteDoc } from './docGenerator';

const baseRoute: RouteDoc = {
  method: 'get',
  path: '/users',
  requestSchema: null,
  responseSchema: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
      active: { type: 'boolean' },
    },
  },
  sampleCount: 1,
};

describe('generateMockForRoute', () => {
  it('returns status 200', () => {
    const mock = generateMockForRoute(baseRoute);
    expect(mock.status).toBe(200);
  });

  it('generates mock body from response schema', () => {
    const mock = generateMockForRoute(baseRoute);
    expect(mock.body).toHaveProperty('id', 1);
    expect(mock.body).toHaveProperty('name', 'sample_name');
    expect(mock.body).toHaveProperty('active', true);
  });

  it('returns empty body when responseSchema is null', () => {
    const route = { ...baseRoute, responseSchema: null };
    const mock = generateMockForRoute(route);
    expect(mock.body).toEqual({});
  });

  it('returns empty body when schema has no properties', () => {
    const route = { ...baseRoute, responseSchema: { type: 'object' } };
    const mock = generateMockForRoute(route);
    expect(mock.body).toEqual({});
  });

  it('uses abc123 for id-like string fields', () => {
    const route = {
      ...baseRoute,
      responseSchema: {
        type: 'object',
        properties: { userId: { type: 'string' } },
      },
    };
    const mock = generateMockForRoute(route);
    expect(mock.body.userId).toBe('abc123');
  });
});

describe('generateAllMocks', () => {
  it('creates a map keyed by METHOD path', () => {
    const mocks = generateAllMocks([baseRoute]);
    expect(mocks.has('GET /users')).toBe(true);
  });

  it('returns empty map for empty input', () => {
    const mocks = generateAllMocks([]);
    expect(mocks.size).toBe(0);
  });

  it('handles multiple routes', () => {
    const second: RouteDoc = { ...baseRoute, method: 'post', path: '/users' };
    const mocks = generateAllMocks([baseRoute, second]);
    expect(mocks.size).toBe(2);
    expect(mocks.has('POST /users')).toBe(true);
  });
});
