/**
 * Tracks request traces per endpoint, storing recent request metadata
 * for debugging and observability purposes.
 */

export interface RequestTrace {
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
  requestSize: number;
  responseSize: number;
}

export interface TraceStats {
  method: string;
  path: string;
  traces: RequestTrace[];
  totalRequests: number;
  lastSeen: number;
}

const MAX_TRACES_PER_ENDPOINT = 50;
const traceStore = new Map<string, TraceStats>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function recordTrace(
  method: string,
  path: string,
  trace: Omit<RequestTrace, 'method' | 'path'>
): void {
  const key = makeKey(method, path);
  const existing = traceStore.get(key) ?? {
    method: method.toUpperCase(),
    path,
    traces: [],
    totalRequests: 0,
    lastSeen: 0,
  };

  const full: RequestTrace = { ...trace, method: method.toUpperCase(), path };
  existing.traces.push(full);
  if (existing.traces.length > MAX_TRACES_PER_ENDPOINT) {
    existing.traces.shift();
  }
  existing.totalRequests += 1;
  existing.lastSeen = trace.timestamp;
  traceStore.set(key, existing);
}

export function getTraces(method: string, path: string): TraceStats | undefined {
  return traceStore.get(makeKey(method, path));
}

export function getAllTraces(): TraceStats[] {
  return Array.from(traceStore.values());
}

export function clearTraces(): void {
  traceStore.clear();
}
