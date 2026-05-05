export interface RouteStats {
  path: string;
  method: string;
  hitCount: number;
  lastSeen: Date;
  firstSeen: Date;
  avgResponseTime: number;
  statusCodes: Record<number, number>;
}

export interface StatsUpdate {
  path: string;
  method: string;
  responseTime: number;
  statusCode: number;
}

const statsStore = new Map<string, RouteStats>();

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function recordStats(update: StatsUpdate): void {
  const key = makeKey(update.method, update.path);
  const existing = statsStore.get(key);
  const now = new Date();

  if (!existing) {
    statsStore.set(key, {
      path: update.path,
      method: update.method.toUpperCase(),
      hitCount: 1,
      firstSeen: now,
      lastSeen: now,
      avgResponseTime: update.responseTime,
      statusCodes: { [update.statusCode]: 1 },
    });
    return;
  }

  const newAvg =
    (existing.avgResponseTime * existing.hitCount + update.responseTime) /
    (existing.hitCount + 1);

  statsStore.set(key, {
    ...existing,
    hitCount: existing.hitCount + 1,
    lastSeen: now,
    avgResponseTime: Math.round(newAvg * 100) / 100,
    statusCodes: {
      ...existing.statusCodes,
      [update.statusCode]: (existing.statusCodes[update.statusCode] ?? 0) + 1,
    },
  });
}

export function getStats(method: string, path: string): RouteStats | undefined {
  return statsStore.get(makeKey(method, path));
}

export function getAllStats(): RouteStats[] {
  return Array.from(statsStore.values());
}

export function clearStats(): void {
  statsStore.clear();
}
