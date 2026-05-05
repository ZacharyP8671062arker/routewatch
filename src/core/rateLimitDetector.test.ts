import {
  configureRateLimitDetector,
  resetRateLimitDetector,
  recordRequest,
  evaluateRateLimit,
  getAllRateLimitResults,
  getExceededRoutes,
} from './rateLimitDetector';

describe('rateLimitDetector', () => {
  beforeEach(() => {
    resetRateLimitDetector();
  });

  it('records requests and returns count within window', () => {
    recordRequest('GET /api/users');
    recordRequest('GET /api/users');
    const result = evaluateRateLimit('GET /api/users');
    expect(result.requestsInWindow).toBe(2);
    expect(result.exceeded).toBe(false);
  });

  it('detects exceeded rate limit', () => {
    configureRateLimitDetector({ maxRequests: 3, windowMs: 60_000 });
    for (let i = 0; i < 5; i++) recordRequest('POST /api/items');
    const result = evaluateRateLimit('POST /api/items');
    expect(result.exceeded).toBe(true);
    expect(result.requestsInWindow).toBe(5);
    expect(result.limit).toBe(3);
  });

  it('returns not exceeded for unknown route', () => {
    const result = evaluateRateLimit('GET /unknown');
    expect(result.exceeded).toBe(false);
    expect(result.requestsInWindow).toBe(0);
  });

  it('getAllRateLimitResults returns all tracked routes', () => {
    recordRequest('GET /a');
    recordRequest('POST /b');
    const results = getAllRateLimitResults();
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.route)).toContain('GET /a');
    expect(results.map((r) => r.route)).toContain('POST /b');
  });

  it('getExceededRoutes returns only routes over limit', () => {
    configureRateLimitDetector({ maxRequests: 2, windowMs: 60_000 });
    recordRequest('GET /fast');
    recordRequest('GET /fast');
    recordRequest('GET /fast');
    recordRequest('GET /slow');
    const exceeded = getExceededRoutes();
    expect(exceeded).toHaveLength(1);
    expect(exceeded[0].route).toBe('GET /fast');
  });

  it('resets state on resetRateLimitDetector', () => {
    recordRequest('GET /api/test');
    resetRateLimitDetector();
    const results = getAllRateLimitResults();
    expect(results).toHaveLength(0);
  });
});
