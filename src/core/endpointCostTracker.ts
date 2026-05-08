/**
 * Tracks a configurable "cost" score per endpoint (e.g. compute units,
 * upstream API credits, or arbitrary weight) so teams can budget expensive
 * routes.
 */

export interface CostConfig {
  costPerRequest: number;
  budgetLimit?: number;
}

export interface CostStats {
  method: string;
  path: string;
  costPerRequest: number;
  totalRequests: number;
  totalCost: number;
  budgetLimit?: number;
  overBudget: boolean;
}

const costConfigs = new Map<string, CostConfig>();
const requestCounts = new Map<string, number>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configureCost(method: string, path: string, config: CostConfig): void {
  costConfigs.set(makeKey(method, path), config);
}

export function resetCostTracker(): void {
  costConfigs.clear();
  requestCounts.clear();
}

export function recordCostRequest(method: string, path: string): void {
  const key = makeKey(method, path);
  requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);
}

export function getCostStats(method: string, path: string): CostStats | null {
  const key = makeKey(method, path);
  const config = costConfigs.get(key);
  if (!config) return null;
  const totalRequests = requestCounts.get(key) ?? 0;
  const totalCost = totalRequests * config.costPerRequest;
  return {
    method: method.toUpperCase(),
    path,
    costPerRequest: config.costPerRequest,
    totalRequests,
    totalCost,
    budgetLimit: config.budgetLimit,
    overBudget: config.budgetLimit !== undefined && totalCost > config.budgetLimit,
  };
}

export function getAllCostStats(): CostStats[] {
  return Array.from(costConfigs.keys()).map((key) => {
    const [method, ...rest] = key.split(":");
    return getCostStats(method, rest.join(":"))!;
  });
}
