/**
 * endpointDeprecator.ts
 * Tracks and manages deprecated API endpoints based on traffic age and manual tagging.
 */

export interface DeprecationConfig {
  maxAgeDays: number;
  warnAfterDays: number;
}

export interface DeprecationEntry {
  method: string;
  path: string;
  deprecatedAt: Date;
  reason?: string;
  sunsetAt?: Date;
  manuallyTagged: boolean;
}

export type DeprecationStatus = 'active' | 'warning' | 'deprecated' | 'sunset';

const deprecationMap = new Map<string, DeprecationEntry>();
let config: DeprecationConfig = { maxAgeDays: 180, warnAfterDays: 120 };

export function configureDeprecator(cfg: Partial<DeprecationConfig>): void {
  config = { ...config, ...cfg };
}

export function resetDeprecator(): void {
  deprecationMap.clear();
  config = { maxAgeDays: 180, warnAfterDays: 120 };
}

export function markDeprecated(
  method: string,
  path: string,
  reason?: string,
  sunsetAt?: Date
): void {
  const key = `${method.toUpperCase()}:${path}`;
  deprecationMap.set(key, {
    method: method.toUpperCase(),
    path,
    deprecatedAt: new Date(),
    reason,
    sunsetAt,
    manuallyTagged: true,
  });
}

export function getDeprecationStatus(
  method: string,
  path: string,
  lastSeenAt: Date
): DeprecationStatus {
  const key = `${method.toUpperCase()}:${path}`;
  const entry = deprecationMap.get(key);

  if (entry?.sunsetAt && new Date() >= entry.sunsetAt) return 'sunset';
  if (entry?.manuallyTagged) return 'deprecated';

  const ageMs = Date.now() - lastSeenAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays >= config.maxAgeDays) return 'deprecated';
  if (ageDays >= config.warnAfterDays) return 'warning';
  return 'active';
}

export function getAllDeprecations(): DeprecationEntry[] {
  return Array.from(deprecationMap.values());
}

export function isDeprecated(method: string, path: string): boolean {
  const key = `${method.toUpperCase()}:${path}`;
  return deprecationMap.has(key);
}
