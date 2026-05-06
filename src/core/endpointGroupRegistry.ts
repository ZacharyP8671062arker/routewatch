/**
 * endpointGroupRegistry.ts
 * Allows grouping endpoints by logical domain/module name.
 */

const groupMap: Map<string, Set<string>> = new Map();
const endpointGroupMap: Map<string, string> = new Map();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function assignGroup(method: string, path: string, group: string): void {
  const key = makeKey(method, path);
  const prev = endpointGroupMap.get(key);
  if (prev && prev !== group) {
    const prevSet = groupMap.get(prev);
    if (prevSet) prevSet.delete(key);
  }
  endpointGroupMap.set(key, group);
  if (!groupMap.has(group)) {
    groupMap.set(group, new Set());
  }
  groupMap.get(group)!.add(key);
}

export function removeGroup(method: string, path: string): void {
  const key = makeKey(method, path);
  const group = endpointGroupMap.get(key);
  if (group) {
    const set = groupMap.get(group);
    if (set) set.delete(key);
    endpointGroupMap.delete(key);
  }
}

export function getGroup(method: string, path: string): string | undefined {
  return endpointGroupMap.get(makeKey(method, path));
}

export function getEndpointsByGroup(group: string): string[] {
  return Array.from(groupMap.get(group) ?? []);
}

export function getAllGroups(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [group, keys] of groupMap.entries()) {
    result[group] = Array.from(keys);
  }
  return result;
}

export function resetGroupRegistry(): void {
  groupMap.clear();
  endpointGroupMap.clear();
}
