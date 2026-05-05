import { TrafficSampler } from './trafficSampler';

describe('TrafficSampler', () => {
  let sampler: TrafficSampler;

  beforeEach(() => {
    sampler = new TrafficSampler();
  });

  it('records a new route sample', () => {
    sampler.record({ method: 'GET', path: '/users', statusCode: 200 });
    const sample = sampler.get('GET', '/users');
    expect(sample).toBeDefined();
    expect(sample?.hitCount).toBe(1);
    expect(sample?.statusCodes.has(200)).toBe(true);
  });

  it('increments hitCount on repeated calls', () => {
    sampler.record({ method: 'POST', path: '/items', statusCode: 201 });
    sampler.record({ method: 'POST', path: '/items', statusCode: 201 });
    expect(sampler.get('POST', '/items')?.hitCount).toBe(2);
  });

  it('accumulates distinct status codes', () => {
    sampler.record({ method: 'GET', path: '/health', statusCode: 200 });
    sampler.record({ method: 'GET', path: '/health', statusCode: 503 });
    const codes = sampler.get('GET', '/health')?.statusCodes;
    expect(codes?.has(200)).toBe(true);
    expect(codes?.has(503)).toBe(true);
  });

  it('infers request body schema', () => {
    sampler.record({
      method: 'POST',
      path: '/login',
      requestBody: { username: 'alice', password: 'secret' },
      statusCode: 200,
    });
    const schema = sampler.get('POST', '/login')?.requestBodySchema;
    expect(schema?.type).toBe('object');
  });

  it('merges response body schemas across requests', () => {
    sampler.record({
      method: 'GET',
      path: '/profile',
      responseBody: { id: 1 },
      statusCode: 200,
    });
    sampler.record({
      method: 'GET',
      path: '/profile',
      responseBody: { id: 2, name: 'Bob' },
      statusCode: 200,
    });
    const schema = sampler.get('GET', '/profile')?.responseBodySchema;
    expect(schema?.type).toBe('object');
    if (schema?.type === 'object') {
      expect(schema.properties['id']).toEqual({ type: 'number' });
      expect(schema.properties['name']).toEqual({ type: 'string' });
    }
  });

  it('getAll returns all recorded routes', () => {
    sampler.record({ method: 'GET', path: '/a', statusCode: 200 });
    sampler.record({ method: 'POST', path: '/b', statusCode: 201 });
    expect(sampler.getAll()).toHaveLength(2);
  });

  it('clear removes all samples', () => {
    sampler.record({ method: 'GET', path: '/x', statusCode: 200 });
    sampler.clear();
    expect(sampler.getAll()).toHaveLength(0);
  });
});
