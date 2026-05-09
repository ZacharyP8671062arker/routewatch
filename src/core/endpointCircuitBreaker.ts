/**
 * Circuit breaker tracker for endpoints.
 * Tracks consecutive failures and open/closed/half-open states.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;   // failures before opening
  successThreshold: number;   // successes in half-open before closing
  timeoutMs: number;          // ms before moving open -> half-open
}

export interface CircuitBreakerStatus {
  method: string;
  path: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number | null;
  openedAt: number | null;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 30_000,
};

let config: CircuitBreakerConfig = { ...DEFAULT_CONFIG };
const store = new Map<string, CircuitBreakerStatus>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configureCircuitBreaker(cfg: Partial<CircuitBreakerConfig>): void {
  config = { ...DEFAULT_CONFIG, ...cfg };
}

export function resetCircuitBreaker(): void {
  config = { ...DEFAULT_CONFIG };
  store.clear();
}

function getOrCreate(method: string, path: string): CircuitBreakerStatus {
  const key = makeKey(method, path);
  if (!store.has(key)) {
    store.set(key, { method, path, state: 'closed', failures: 0, successes: 0, lastFailureAt: null, openedAt: null });
  }
  return store.get(key)!;
}

export function recordCircuitRequest(method: string, path: string, success: boolean): void {
  const status = getOrCreate(method, path);
  const now = Date.now();

  if (status.state === 'open') {
    if (status.openedAt !== null && now - status.openedAt >= config.timeoutMs) {
      status.state = 'half-open';
      status.successes = 0;
    } else {
      return;
    }
  }

  if (success) {
    status.successes += 1;
    if (status.state === 'half-open' && status.successes >= config.successThreshold) {
      status.state = 'closed';
      status.failures = 0;
      status.openedAt = null;
    }
  } else {
    status.failures += 1;
    status.lastFailureAt = now;
    if (status.state !== 'half-open' && status.failures >= config.failureThreshold) {
      status.state = 'open';
      status.openedAt = now;
    } else if (status.state === 'half-open') {
      status.state = 'open';
      status.openedAt = now;
    }
  }
}

export function getCircuitStatus(method: string, path: string): CircuitBreakerStatus | undefined {
  return store.get(makeKey(method, path));
}

export function getAllCircuitStatuses(): CircuitBreakerStatus[] {
  return Array.from(store.values());
}
