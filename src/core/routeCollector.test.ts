import { RouteCollector } from './routeCollector';

describe('RouteCollector', () => {
  let collector: RouteCollector;

  beforeEach(() => {
    collector = new RouteCollector();
  });

  it('records a new route on first request', () => {
    collector.record('GET', '/api/users', 200, 45);
    const routes = collector.getAll();
    expect(routes).toHaveLength(1);
    expect(routes[0].method).toBe('GET');
    expect(routes[0].path).toBe('/api/users');
    expect(routes[0].hitCount).toBe(1);
  });

  it('accumulates hits for the same route', () => {
    collector.record('GET', '/api/users', 200, 40);
    collector.record('GET', '/api/users', 200, 60);
    const routes = collector.getAll();
    expect(routes).toHaveLength(1);
    expect(routes[0].hitCount).toBe(2);
    expect(routes[0].avgResponseTimeMs).toBe(50);
  });

  it('tracks status codes independently', () => {
    collector.record('POST', '/api/items', 201, 30);
    collector.record('POST', '/api/items', 400, 10);
    const entry = collector.getAll()[0];
    expect(entry.statusCodes[201]).toBe(1);
    expect(entry.statusCodes[400]).toBe(1);
  });

  it('treats different methods as separate routes', () => {
    collector.record('GET', '/api/users', 200, 20);
    collector.record('POST', '/api/users', 201, 30);
    expect(collector.getAll()).toHaveLength(2);
  });

  it('filters routes by method', () => {
    collector.record('GET', '/api/users', 200, 20);
    collector.record('POST', '/api/users', 201, 30);
    collector.record('DELETE', '/api/users/1', 204, 15);
    const gets = collector.getByMethod('GET');
    expect(gets).toHaveLength(1);
    expect(gets[0].method).toBe('GET');
  });

  it('clears all routes', () => {
    collector.record('GET', '/api/health', 200, 5);
    collector.clear();
    expect(collector.getAll()).toHaveLength(0);
  });

  it('normalises method to uppercase', () => {
    collector.record('get', '/api/ping', 200, 5);
    expect(collector.getAll()[0].method).toBe('GET');
  });
});
