/**
 * Tracks timeout configuration and violations per endpoint.
 */

interface TimeoutConfig {
  thresholdMs: number;
}

interface TimeoutStats {
  method: string;
  path: string;
  thresholdMs: number;
  totalRequests: number;
  timeoutViolations: number;
  violationRate: number;
  lastViolationAt: number | null;
}

const configs = new Map<string, TimeoutConfig>();
const stats = new Map<string, Omit<TimeoutStats, 'method' | 'path' | 'thresholdMs' | 'violationRate'>>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configureTimeout(method: string, path: string, thresholdMs: number): void {
  const key = makeKey(method, path);
  configs.set(key, { thresholdMs });
}

export function resetTimeoutTracker(): void {
  configs.clear();
  stats.clear();
}

export function recordTimeoutRequest(
  method: string,
  path: string,
  durationMs: number
): void {
  const key = makeKey(method, path);
  const config = configs.get(key);
  if (!config) return;

  const existing = stats.get(key) ?? {
    totalRequests: 0,
    timeoutViolations: 0,
    lastViolationAt: null,
  };

  const isViolation = durationMs > config.thresholdMs;
  stats.set(key, {
    totalRequests: existing.totalRequests + 1,
    timeoutViolations: existing.timeoutViolations + (isViolation ? 1 : 0),
    lastViolationAt: isViolation ? Date.now() : existing.lastViolationAt,
  });
}

export function getTimeoutStats(method: string, path: string): TimeoutStats | null {
  const key = makeKey(method, path);
  const config = configs.get(key);
  const entry = stats.get(key);
  if (!config || !entry) return null;

  return {
    method: method.toUpperCase(),
    path,
    thresholdMs: config.thresholdMs,
    totalRequests: entry.totalRequests,
    timeoutViolations: entry.timeoutViolations,
    violationRate: entry.totalRequests > 0
      ? entry.timeoutViolations / entry.totalRequests
      : 0,
    lastViolationAt: entry.lastViolationAt,
  };
}

export function getAllTimeoutStats(): TimeoutStats[] {
  return Array.from(configs.keys()).map((key) => {
    const [method, ...rest] = key.split(':');
    return getTimeoutStats(method, rest.join(':'))!;
  }).filter(Boolean);
}
