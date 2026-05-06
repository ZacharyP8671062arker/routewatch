import {
  configureHealthChecker,
  resetHealthChecker,
  checkEndpointHealth,
} from './endpointHealthChecker';
import { recordStats, clearStats } from './routeStats';
import { recordResponseTime, clearResponseTimeStats } from './responseTimeTracker';

function seedData(method: string, route: string, total: number, errors: number, avgMs: number) {
  for (let i = 0; i < total; i++) {
    const isError = i < errors;
    recordStats(method, route, isError ? 500 : 200);
    recordResponseTime(method, route, avgMs);
  }
}

beforeEach(() => {
  clearStats();
  clearResponseTimeStats();
  resetHealthChecker();
});

describe('checkEndpointHealth', () => {
  it('returns healthy for a well-behaved endpoint', () => {
    seedData('GET', '/api/users', 20, 0, 200);
    const result = checkEndpointHealth('GET', '/api/users');
    expect(result.status).toBe('healthy');
    expect(result.reasons).toHaveLength(0);
  });

  it('returns degraded when error rate slightly exceeds threshold', () => {
    seedData('GET', '/api/items', 20, 2, 300); // 10% errors, threshold 5%
    const result = checkEndpointHealth('GET', '/api/items');
    expect(result.status).toBe('degraded');
    expect(result.reasons.some(r => r.includes('error rate'))).toBe(true);
  });

  it('returns unhealthy when error rate is more than 2x threshold', () => {
    seedData('POST', '/api/orders', 20, 6, 300); // 30% errors, threshold 5%
    const result = checkEndpointHealth('POST', '/api/orders');
    expect(result.status).toBe('unhealthy');
  });

  it('returns degraded when avg response time exceeds threshold', () => {
    seedData('GET', '/api/slow', 10, 0, 1500);
    const result = checkEndpointHealth('GET', '/api/slow');
    expect(result.status).toBe('degraded');
    expect(result.reasons.some(r => r.includes('response time'))).toBe(true);
  });

  it('returns healthy with insufficient data note', () => {
    seedData('DELETE', '/api/rare', 2, 1, 500);
    const result = checkEndpointHealth('DELETE', '/api/rare');
    expect(result.status).toBe('healthy');
    expect(result.reasons).toContain('insufficient data');
  });

  it('respects custom config thresholds', () => {
    configureHealthChecker({ maxErrorRate: 0.20, maxAvgResponseTime: 2000, minRequests: 3 });
    seedData('GET', '/api/lenient', 10, 1, 1800); // 10% errors, under 20% threshold
    const result = checkEndpointHealth('GET', '/api/lenient');
    expect(result.status).toBe('healthy');
  });

  it('exposes correct errorRate and totalRequests', () => {
    seedData('GET', '/api/stats', 10, 3, 400);
    const result = checkEndpointHealth('GET', '/api/stats');
    expect(result.totalRequests).toBe(10);
    expect(result.errorRate).toBeCloseTo(0.3);
  });
});
