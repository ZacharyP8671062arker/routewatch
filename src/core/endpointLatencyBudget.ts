/**
 * Endpoint Latency Budget Tracker
 * Tracks how much of each endpoint's latency budget has been consumed.
 */

interface LatencyBudgetConfig {
  budgetMs: number;
}

interface LatencyBudgetStatus {
  method: string;
  path: string;
  budgetMs: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  consumed: number; // 0.0 - 1.0+
  violated: boolean;
}

const budgetConfigs = new Map<string, LatencyBudgetConfig>();
const latencySamples = new Map<string, number[]>();

const MAX_SAMPLES = 200;

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configureLatencyBudget(
  method: string,
  path: string,
  config: LatencyBudgetConfig
): void {
  budgetConfigs.set(makeKey(method, path), config);
}

export function resetLatencyBudget(): void {
  budgetConfigs.clear();
  latencySamples.clear();
}

export function recordLatencySample(
  method: string,
  path: string,
  latencyMs: number
): void {
  const key = makeKey(method, path);
  if (!latencySamples.has(key)) {
    latencySamples.set(key, []);
  }
  const samples = latencySamples.get(key)!;
  samples.push(latencyMs);
  if (samples.length > MAX_SAMPLES) samples.shift();
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function getLatencyBudgetStatus(
  method: string,
  path: string
): LatencyBudgetStatus | null {
  const key = makeKey(method, path);
  const config = budgetConfigs.get(key);
  if (!config) return null;
  const samples = latencySamples.get(key) ?? [];
  const sorted = [...samples].sort((a, b) => a - b);
  const avg = samples.length ? samples.reduce((s, v) => s + v, 0) / samples.length : 0;
  const p95 = percentile(sorted, 95);
  const consumed = config.budgetMs > 0 ? p95 / config.budgetMs : 0;
  return {
    method: method.toUpperCase(),
    path,
    budgetMs: config.budgetMs,
    avgLatencyMs: Math.round(avg * 100) / 100,
    p95LatencyMs: p95,
    consumed: Math.round(consumed * 1000) / 1000,
    violated: consumed > 1,
  };
}

export function getAllLatencyBudgetStatuses(): LatencyBudgetStatus[] {
  return Array.from(budgetConfigs.keys()).map((key) => {
    const [method, ...rest] = key.split(':');
    return getLatencyBudgetStatus(method, rest.join(':'))!;
  });
}
