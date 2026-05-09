/**
 * Tracks declared dependencies between endpoints.
 * Useful for understanding call chains and impact analysis.
 */

type Key = string;

const dependencyMap = new Map<Key, Set<string>>();

export function makeKey(method: string, path: string): Key {
  return `${method.toUpperCase()}:${path}`;
}

export function addDependency(method: string, path: string, dependsOn: string): void {
  const key = makeKey(method, path);
  if (!dependencyMap.has(key)) {
    dependencyMap.set(key, new Set());
  }
  dependencyMap.get(key)!.add(dependsOn);
}

export function removeDependency(method: string, path: string, dependsOn: string): void {
  const key = makeKey(method, path);
  dependencyMap.get(key)?.delete(dependsOn);
}

export function getDependencies(method: string, path: string): string[] {
  const key = makeKey(method, path);
  return Array.from(dependencyMap.get(key) ?? []);
}

export function getAllDependencies(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, deps] of dependencyMap.entries()) {
    result[key] = Array.from(deps);
  }
  return result;
}

export function getDependents(targetKey: string): string[] {
  const dependents: string[] = [];
  for (const [key, deps] of dependencyMap.entries()) {
    if (deps.has(targetKey)) {
      dependents.push(key);
    }
  }
  return dependents;
}

export function clearDependencies(): void {
  dependencyMap.clear();
}
