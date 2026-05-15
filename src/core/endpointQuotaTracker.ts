/**
 * Tracks per-endpoint request quotas over a rolling time window.
 */

export interface QuotaConfig {
  limit: number;
  windowMs: number;
}

export interface QuotaStats {
  method: string;
  path: string;
  limit: number;
  windowMs: number;
  count: number;
  exceeded: boolean;
  resetAt: number;
}

interface QuotaEntry {
  config: QuotaConfig;
  count: number;
  windowStart: number;
}

const quotaStore = new Map<string, QuotaEntry>();
const quotaConfigs = new Map<string, QuotaConfig>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configureQuota(method: string, path: string, config: QuotaConfig): void {
  const key = makeKey(method, path);
  quotaConfigs.set(key, config);
}

export function resetQuotaTracker(): void {
  quotaStore.clear();
  quotaConfigs.clear();
}

export function recordQuotaRequest(method: string, path: string, now = Date.now()): void {
  const key = makeKey(method, path);
  const config = quotaConfigs.get(key);
  if (!config) return;

  const existing = quotaStore.get(key);
  if (!existing || now - existing.windowStart >= config.windowMs) {
    quotaStore.set(key, { config, count: 1, windowStart: now });
  } else {
    existing.count += 1;
  }
}

export function getQuotaStats(method: string, path: string, now = Date.now()): QuotaStats | null {
  const key = makeKey(method, path);
  const config = quotaConfigs.get(key);
  if (!config) return null;

  const entry = quotaStore.get(key);
  const count = entry && now - entry.windowStart < config.windowMs ? entry.count : 0;
  const windowStart = entry ? entry.windowStart : now;

  return {
    method: method.toUpperCase(),
    path,
    limit: config.limit,
    windowMs: config.windowMs,
    count,
    exceeded: count > config.limit,
    resetAt: windowStart + config.windowMs,
  };
}

export function getAllQuotaStats(now = Date.now()): QuotaStats[] {
  return Array.from(quotaConfigs.keys()).map((key) => {
    const [method, ...pathParts] = key.split(':');
    return getQuotaStats(method, pathParts.join(':'), now)!;
  });
}
