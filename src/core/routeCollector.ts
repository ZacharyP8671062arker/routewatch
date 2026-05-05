export interface RouteEntry {
  method: string;
  path: string;
  firstSeen: Date;
  lastSeen: Date;
  hitCount: number;
  statusCodes: Record<number, number>;
  avgResponseTimeMs: number;
  totalResponseTimeMs: number;
}

export class RouteCollector {
  private routes: Map<string, RouteEntry> = new Map();

  private buildKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  record(
    method: string,
    path: string,
    statusCode: number,
    responseTimeMs: number
  ): void {
    const key = this.buildKey(method, path);
    const now = new Date();

    if (!this.routes.has(key)) {
      this.routes.set(key, {
        method: method.toUpperCase(),
        path,
        firstSeen: now,
        lastSeen: now,
        hitCount: 0,
        statusCodes: {},
        avgResponseTimeMs: 0,
        totalResponseTimeMs: 0,
      });
    }

    const entry = this.routes.get(key)!;
    entry.hitCount += 1;
    entry.lastSeen = now;
    entry.statusCodes[statusCode] = (entry.statusCodes[statusCode] ?? 0) + 1;
    entry.totalResponseTimeMs += responseTimeMs;
    entry.avgResponseTimeMs = entry.totalResponseTimeMs / entry.hitCount;
  }

  getAll(): RouteEntry[] {
    return Array.from(this.routes.values());
  }

  getByMethod(method: string): RouteEntry[] {
    return this.getAll().filter(
      (r) => r.method === method.toUpperCase()
    );
  }

  clear(): void {
    this.routes.clear();
  }
}

export const defaultCollector = new RouteCollector();
