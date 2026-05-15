import {
  recordTrace,
  getTraces,
  getAllTraces,
  clearTraces,
  makeKey,
} from './endpointRequestTracer';

beforeEach(() => clearTraces());

describe('makeKey', () => {
  it('uppercases method and joins with path', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
  });
});

describe('recordTrace', () => {
  it('stores a trace entry', () => {
    recordTrace('GET', '/users', {
      traceId: 'abc123',
      statusCode: 200,
      durationMs: 45,
      timestamp: 1000,
      requestSize: 0,
      responseSize: 120,
    });
    const stats = getTraces('GET', '/users');
    expect(stats).toBeDefined();
    expect(stats!.traces).toHaveLength(1);
    expect(stats!.traces[0].traceId).toBe('abc123');
    expect(stats!.totalRequests).toBe(1);
  });

  it('increments totalRequests on subsequent calls', () => {
    for (let i = 0; i < 3; i++) {
      recordTrace('POST', '/orders', {
        traceId: `id-${i}`,
        statusCode: 201,
        durationMs: 20,
        timestamp: 2000 + i,
        requestSize: 50,
        responseSize: 80,
      });
    }
    const stats = getTraces('POST', '/orders');
    expect(stats!.totalRequests).toBe(3);
    expect(stats!.traces).toHaveLength(3);
  });

  it('caps stored traces at 50', () => {
    for (let i = 0; i < 60; i++) {
      recordTrace('GET', '/items', {
        traceId: `t${i}`,
        statusCode: 200,
        durationMs: 10,
        timestamp: i,
        requestSize: 0,
        responseSize: 0,
      });
    }
    const stats = getTraces('GET', '/items');
    expect(stats!.traces).toHaveLength(50);
    expect(stats!.totalRequests).toBe(60);
  });
});

describe('getAllTraces', () => {
  it('returns all recorded endpoints', () => {
    recordTrace('GET', '/a', { traceId: '1', statusCode: 200, durationMs: 5, timestamp: 1, requestSize: 0, responseSize: 0 });
    recordTrace('DELETE', '/b', { traceId: '2', statusCode: 204, durationMs: 3, timestamp: 2, requestSize: 0, responseSize: 0 });
    expect(getAllTraces()).toHaveLength(2);
  });
});

describe('clearTraces', () => {
  it('removes all stored traces', () => {
    recordTrace('GET', '/x', { traceId: 'z', statusCode: 200, durationMs: 1, timestamp: 1, requestSize: 0, responseSize: 0 });
    clearTraces();
    expect(getAllTraces()).toHaveLength(0);
  });
});
