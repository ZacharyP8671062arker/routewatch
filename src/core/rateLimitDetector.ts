/**
 * Detects routes that are being called at unusually high rates
 * and flags them for potential rate limiting concerns.
 */

const requestCounts: Map<string, number[]> = new Map();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  route: string;
  requestsInWindow: number;
  limit: number;
  exceeded: boolean;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 100,
};

let currentConfig: RateLimitConfig = { ...defaultConfig };

export function configureRateLimitDetector(config: Partial<RateLimitConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function resetRateLimitDetector(): void {
  requestCounts.clear();
  currentConfig = { ...defaultConfig };
}

export function recordRequest(route: string): void {
  const now = Date.now();
  const timestamps = requestCounts.get(route) ?? [];
  const windowStart = now - currentConfig.windowMs;
  const filtered = timestamps.filter((t) => t >= windowStart);
  filtered.push(now);
  requestCounts.set(route, filtered);
}

export function evaluateRateLimit(route: string): RateLimitResult {
  const now = Date.now();
  const timestamps = requestCounts.get(route) ?? [];
  const windowStart = now - currentConfig.windowMs;
  const requestsInWindow = timestamps.filter((t) => t >= windowStart).length;

  return {
    route,
    requestsInWindow,
    limit: currentConfig.maxRequests,
    exceeded: requestsInWindow > currentConfig.maxRequests,
    windowMs: currentConfig.windowMs,
  };
}

export function getAllRateLimitResults(): RateLimitResult[] {
  return Array.from(requestCounts.keys()).map((route) => evaluateRateLimit(route));
}

export function getExceededRoutes(): RateLimitResult[] {
  return getAllRateLimitResults().filter((r) => r.exceeded);
}
