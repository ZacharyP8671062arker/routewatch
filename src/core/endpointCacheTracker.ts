/**
 * Tracks cache hit/miss statistics per endpoint.
 */

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

interface CacheEntry {
  hits: number;
  misses: number;
}

const cacheStore = new Map<string, CacheEntry>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function recordCacheHit(method: string, path: string): void {
  const key = makeKey(method, path);
  const entry = cacheStore.get(key) ?? { hits: 0, misses: 0 };
  entry.hits += 1;
  cacheStore.set(key, entry);
}

export function recordCacheMiss(method: string, path: string): void {
  const key = makeKey(method, path);
  const entry = cacheStore.get(key) ?? { hits: 0, misses: 0 };
  entry.misses += 1;
  cacheStore.set(key, entry);
}

export function getCacheStats(method: string, path: string): CacheStats | null {
  const key = makeKey(method, path);
  const entry = cacheStore.get(key);
  if (!entry) return null;
  const total = entry.hits + entry.misses;
  return {
    hits: entry.hits,
    misses: entry.misses,
    hitRate: total === 0 ? 0 : entry.hits / total,
  };
}

export function getAllCacheStats(): Record<string, CacheStats> {
  const result: Record<string, CacheStats> = {};
  for (const [key, entry] of cacheStore.entries()) {
    const total = entry.hits + entry.misses;
    result[key] = {
      hits: entry.hits,
      misses: entry.misses,
      hitRate: total === 0 ? 0 : entry.hits / total,
    };
  }
  return result;
}

export function resetCacheTracker(): void {
  cacheStore.clear();
}
