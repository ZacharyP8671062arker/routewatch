/**
 * Tracks co-occurrence and call correlation between endpoints.
 * Useful for identifying endpoints that are frequently called together.
 */

const correlationMap = new Map<string, Map<string, number>>();
const sessionBuffer = new Map<string, string[]>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

/**
 * Record a request within a session context.
 * sessionId can be derived from a request ID, user session, or trace ID.
 */
export function recordCorrelatedRequest(sessionId: string, method: string, path: string): void {
  const key = makeKey(method, path);
  const existing = sessionBuffer.get(sessionId) ?? [];

  for (const prev of existing) {
    if (prev === key) continue;
    // Increment correlation: prev -> key
    if (!correlationMap.has(prev)) correlationMap.set(prev, new Map());
    const prevMap = correlationMap.get(prev)!;
    prevMap.set(key, (prevMap.get(key) ?? 0) + 1);

    // Increment correlation: key -> prev
    if (!correlationMap.has(key)) correlationMap.set(key, new Map());
    const keyMap = correlationMap.get(key)!;
    keyMap.set(prev, (keyMap.get(prev) ?? 0) + 1);
  }

  existing.push(key);
  sessionBuffer.set(sessionId, existing);
}

/**
 * Flush a session (e.g. on session end or timeout).
 */
export function flushSession(sessionId: string): void {
  sessionBuffer.delete(sessionId);
}

/**
 * Get correlation counts for a specific endpoint.
 */
export function getCorrelations(method: string, path: string): Record<string, number> {
  const key = makeKey(method, path);
  const inner = correlationMap.get(key);
  if (!inner) return {};
  return Object.fromEntries(inner.entries());
}

/**
 * Get all correlation data.
 */
export function getAllCorrelations(): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const [key, inner] of correlationMap.entries()) {
    result[key] = Object.fromEntries(inner.entries());
  }
  return result;
}

export function resetCorrelationTracker(): void {
  correlationMap.clear();
  sessionBuffer.clear();
}
