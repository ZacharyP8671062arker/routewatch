// Tracks requests-per-second throughput for each endpoint over a sliding window

const WINDOW_MS = 60_000; // 1 minute sliding window

interface ThroughputEntry {
  timestamps: number[];
  peakRps: number;
}

const store = new Map<string, ThroughputEntry>();

let windowMs = WINDOW_MS;

export function configureThroughputTracker(options: { windowMs?: number } = {}): void {
  if (options.windowMs !== undefined) windowMs = options.windowMs;
}

export function resetThroughputTracker(): void {
  store.clear();
  windowMs = WINDOW_MS;
}

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function recordThroughputRequest(method: string, path: string): void {
  const key = makeKey(method, path);
  const now = Date.now();
  if (!store.has(key)) {
    store.set(key, { timestamps: [], peakRps: 0 });
  }
  const entry = store.get(key)!;
  entry.timestamps.push(now);
  // Prune old timestamps outside the window
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter(t => t >= cutoff);
  // Calculate current RPS and update peak
  const windowSec = windowMs / 1000;
  const currentRps = entry.timestamps.length / windowSec;
  if (currentRps > entry.peakRps) entry.peakRps = currentRps;
}

export interface ThroughputStats {
  method: string;
  path: string;
  currentRps: number;
  peakRps: number;
  totalInWindow: number;
}

export function getThroughputStats(method: string, path: string): ThroughputStats | null {
  const key = makeKey(method, path);
  const entry = store.get(key);
  if (!entry) return null;
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = entry.timestamps.filter(t => t >= cutoff);
  const windowSec = windowMs / 1000;
  return {
    method: method.toUpperCase(),
    path,
    currentRps: recent.length / windowSec,
    peakRps: entry.peakRps,
    totalInWindow: recent.length,
  };
}

export function getAllThroughputStats(): ThroughputStats[] {
  const now = Date.now();
  const cutoff = now - windowMs;
  const windowSec = windowMs / 1000;
  return Array.from(store.entries()).map(([key, entry]) => {
    const [method, ...pathParts] = key.split(':');
    const path = pathParts.join(':');
    const recent = entry.timestamps.filter(t => t >= cutoff);
    return {
      method,
      path,
      currentRps: recent.length / windowSec,
      peakRps: entry.peakRps,
      totalInWindow: recent.length,
    };
  });
}
