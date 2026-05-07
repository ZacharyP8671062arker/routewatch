/**
 * Tracks retry behavior for endpoints based on observed traffic patterns.
 * A "retry" is detected when the same client IP hits the same route within a short window.
 */

interface RetryRecord {
  count: number;
  firstSeen: number;
  lastSeen: number;
  retries: number;
}

interface RetryStats {
  totalRequests: number;
  totalRetries: number;
  retryRate: number;
  firstSeen: number;
  lastSeen: number;
}

const store = new Map<string, Map<string, RetryRecord>>();

const DEFAULT_WINDOW_MS = 5000;
let windowMs = DEFAULT_WINDOW_MS;

export function configureRetryTracker(options: { windowMs?: number }): void {
  if (options.windowMs !== undefined) windowMs = options.windowMs;
}

export function resetRetryTracker(): void {
  store.clear();
  windowMs = DEFAULT_WINDOW_MS;
}

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function recordRetryRequest(method: string, path: string, clientIp: string): boolean {
  const routeKey = makeKey(method, path);
  if (!store.has(routeKey)) store.set(routeKey, new Map());
  const clients = store.get(routeKey)!;

  const now = Date.now();
  const existing = clients.get(clientIp);
  let isRetry = false;

  if (existing) {
    if (now - existing.lastSeen <= windowMs) {
      existing.retries += 1;
      isRetry = true;
    }
    existing.count += 1;
    existing.lastSeen = now;
  } else {
    clients.set(clientIp, { count: 1, firstSeen: now, lastSeen: now, retries: 0 });
  }

  return isRetry;
}

export function getRetryStats(method: string, path: string): RetryStats | null {
  const routeKey = makeKey(method, path);
  const clients = store.get(routeKey);
  if (!clients || clients.size === 0) return null;

  let totalRequests = 0;
  let totalRetries = 0;
  let firstSeen = Infinity;
  let lastSeen = -Infinity;

  for (const rec of clients.values()) {
    totalRequests += rec.count;
    totalRetries += rec.retries;
    if (rec.firstSeen < firstSeen) firstSeen = rec.firstSeen;
    if (rec.lastSeen > lastSeen) lastSeen = rec.lastSeen;
  }

  return {
    totalRequests,
    totalRetries,
    retryRate: totalRequests > 0 ? totalRetries / totalRequests : 0,
    firstSeen,
    lastSeen,
  };
}

export function getAllRetryStats(): Record<string, RetryStats> {
  const result: Record<string, RetryStats> = {};
  for (const [key] of store.entries()) {
    const [method, ...rest] = key.split(':');
    const stats = getRetryStats(method, rest.join(':'));
    if (stats) result[key] = stats;
  }
  return result;
}
