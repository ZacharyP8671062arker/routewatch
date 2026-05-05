/**
 * Tracks response time statistics per route.
 */

export interface ResponseTimeStats {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
}

const store = new Map<string, ResponseTimeStats>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function recordResponseTime(
  method: string,
  path: string,
  durationMs: number
): void {
  const key = makeKey(method, path);
  const existing = store.get(key);

  if (!existing) {
    store.set(key, {
      count: 1,
      totalMs: durationMs,
      minMs: durationMs,
      maxMs: durationMs,
      avgMs: durationMs,
    });
    return;
  }

  const count = existing.count + 1;
  const totalMs = existing.totalMs + durationMs;

  store.set(key, {
    count,
    totalMs,
    minMs: Math.min(existing.minMs, durationMs),
    maxMs: Math.max(existing.maxMs, durationMs),
    avgMs: totalMs / count,
  });
}

export function getResponseTimeStats(
  method: string,
  path: string
): ResponseTimeStats | undefined {
  return store.get(makeKey(method, path));
}

export function getAllResponseTimeStats(): Record<string, ResponseTimeStats> {
  const result: Record<string, ResponseTimeStats> = {};
  for (const [key, stats] of store.entries()) {
    result[key] = { ...stats };
  }
  return result;
}

export function clearResponseTimeStats(): void {
  store.clear();
}
