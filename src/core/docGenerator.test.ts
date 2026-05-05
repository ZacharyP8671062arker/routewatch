import { generateRouteDoc, generateApiDoc } from './docGenerator';
import { RouteEntry } from './routeCollector';

const makeSample = (overrides = {}) => ({
  requestBody: { name: 'Alice', age: 30 },
  query: { page: '1' },
  responseBody: { id: 1, name: 'Alice' },
  statusCode: 200,
  ...overrides,
});

const makeEntry = (overrides: Partial<RouteEntry> = {}): RouteEntry => ({
  method: 'post',
  path: '/users',
  samples: [makeSample()],
  lastSeen: new Date().toISOString(),
  ...overrides,
});

describe('generateRouteDoc', () => {
  it('sets method and path', () => {
    const doc = generateRouteDoc(makeEntry());
    expect(doc.method).toBe('POST');
    expect(doc.path).toBe('/users');
  });

  it('infers requestBodySchema from samples', () => {
    const doc = generateRouteDoc(makeEntry());
    expect(doc.requestBodySchema).toBeDefined();
  });

  it('infers querySchema when query params present', () => {
    const doc = generateRouteDoc(makeEntry());
    expect(doc.querySchema).toBeDefined();
  });

  it('infers responseSchema from samples', () => {
    const doc = generateRouteDoc(makeEntry());
    expect(doc.responseSchema).toBeDefined();
  });

  it('omits requestBodySchema when no bodies', () => {
    const entry = makeEntry({ samples: [makeSample({ requestBody: null })] });
    const doc = generateRouteDoc(entry);
    expect(doc.requestBodySchema).toBeUndefined();
  });

  it('records sampleCount', () => {
    const entry = makeEntry({ samples: [makeSample(), makeSample()] });
    expect(generateRouteDoc(entry).sampleCount).toBe(2);
  });
});

describe('generateApiDoc', () => {
  it('returns correct totalRoutes', () => {
    const doc = generateApiDoc([makeEntry(), makeEntry({ path: '/posts' })]);
    expect(doc.totalRoutes).toBe(2);
  });

  it('includes generatedAt timestamp', () => {
    const doc = generateApiDoc([]);
    expect(typeof doc.generatedAt).toBe('string');
  });
});
