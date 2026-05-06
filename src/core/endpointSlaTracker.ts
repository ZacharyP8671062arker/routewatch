/**
 * Tracks SLA (Service Level Agreement) compliance for endpoints.
 * Records whether response times meet configured SLA thresholds.
 */

interface SlaConfig {
  maxResponseTimeMs: number;
  minSuccessRate: number; // 0-1
}

interface SlaRecord {
  total: number;
  violations: number;
  slowRequests: number;
  lastViolationAt: number | null;
}

const defaultConfig: SlaConfig = {
  maxResponseTimeMs: 1000,
  minSuccessRate: 0.99,
};

let config: SlaConfig = { ...defaultConfig };
const slaStore = new Map<string, SlaRecord>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configureSla(options: Partial<SlaConfig>): void {
  config = { ...config, ...options };
}

export function resetSlaTracker(): void {
  slaStore.clear();
  config = { ...defaultConfig };
}

export function recordSlaRequest(
  method: string,
  path: string,
  responseTimeMs: number,
  statusCode: number
): void {
  const key = makeKey(method, path);
  const record = slaStore.get(key) ?? {
    total: 0,
    violations: 0,
    slowRequests: 0,
    lastViolationAt: null,
  };

  record.total += 1;

  const isSlow = responseTimeMs > config.maxResponseTimeMs;
  const isError = statusCode >= 500;

  if (isSlow) record.slowRequests += 1;

  const successRate = record.total > 0
    ? (record.total - record.violations) / record.total
    : 1;

  if (isError || successRate < config.minSuccessRate) {
    record.violations += 1;
    record.lastViolationAt = Date.now();
  }

  slaStore.set(key, record);
}

export function getSlaStatus(method: string, path: string): SlaRecord & { compliant: boolean } | null {
  const key = makeKey(method, path);
  const record = slaStore.get(key);
  if (!record) return null;
  const successRate = record.total > 0
    ? (record.total - record.violations) / record.total
    : 1;
  const compliant = record.slowRequests === 0 && successRate >= config.minSuccessRate;
  return { ...record, compliant };
}

export function getAllSlaStatuses(): Record<string, ReturnType<typeof getSlaStatus>> {
  const result: Record<string, ReturnType<typeof getSlaStatus>> = {};
  for (const key of slaStore.keys()) {
    const [method, ...pathParts] = key.split(':');
    result[key] = getSlaStatus(method, pathParts.join(':'));
  }
  return result;
}
