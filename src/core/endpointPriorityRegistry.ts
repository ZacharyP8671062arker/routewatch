/**
 * Endpoint Priority Registry
 * Allows assigning priority levels to endpoints for triage and documentation ordering.
 */

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityEntry {
  method: string;
  path: string;
  priority: PriorityLevel;
  reason?: string;
  assignedAt: string;
}

const priorityMap = new Map<string, PriorityEntry>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function assignPriority(
  method: string,
  path: string,
  priority: PriorityLevel,
  reason?: string
): PriorityEntry {
  const key = makeKey(method, path);
  const entry: PriorityEntry = {
    method: method.toUpperCase(),
    path,
    priority,
    reason,
    assignedAt: new Date().toISOString(),
  };
  priorityMap.set(key, entry);
  return entry;
}

export function removePriority(method: string, path: string): boolean {
  return priorityMap.delete(makeKey(method, path));
}

export function getPriority(method: string, path: string): PriorityEntry | undefined {
  return priorityMap.get(makeKey(method, path));
}

export function getAllPriorities(): PriorityEntry[] {
  return Array.from(priorityMap.values());
}

export function getEndpointsByPriority(priority: PriorityLevel): PriorityEntry[] {
  return getAllPriorities().filter((e) => e.priority === priority);
}

export function getPrioritySummary(): Record<PriorityLevel, number> {
  const summary: Record<PriorityLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const entry of priorityMap.values()) {
    summary[entry.priority]++;
  }
  return summary;
}

export function resetPriorityRegistry(): void {
  priorityMap.clear();
}
