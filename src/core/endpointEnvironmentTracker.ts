/**
 * Tracks which environments (e.g. dev, staging, prod) each endpoint is active in.
 */

type Environment = string;

interface EnvironmentEntry {
  method: string;
  path: string;
  environments: Set<Environment>;
}

const registry = new Map<string, EnvironmentEntry>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function assignEnvironment(method: string, path: string, env: Environment): void {
  const key = makeKey(method, path);
  if (!registry.has(key)) {
    registry.set(key, { method: method.toUpperCase(), path, environments: new Set() });
  }
  registry.get(key)!.environments.add(env);
}

export function removeEnvironment(method: string, path: string, env: Environment): void {
  const key = makeKey(method, path);
  registry.get(key)?.environments.delete(env);
}

export function getEnvironments(method: string, path: string): Environment[] {
  const key = makeKey(method, path);
  return Array.from(registry.get(key)?.environments ?? []);
}

export function getEndpointsByEnvironment(env: Environment): Array<{ method: string; path: string }> {
  const results: Array<{ method: string; path: string }> = [];
  for (const entry of registry.values()) {
    if (entry.environments.has(env)) {
      results.push({ method: entry.method, path: entry.path });
    }
  }
  return results;
}

export function getAllEnvironmentEntries(): Array<{ method: string; path: string; environments: Environment[] }> {
  return Array.from(registry.values()).map((e) => ({
    method: e.method,
    path: e.path,
    environments: Array.from(e.environments),
  }));
}

export function resetEnvironmentTracker(): void {
  registry.clear();
}
