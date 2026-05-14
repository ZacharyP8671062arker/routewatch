const versionMap = new Map<string, string[]>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function assignVersion(method: string, path: string, version: string): void {
  const key = makeKey(method, path);
  const existing = versionMap.get(key) ?? [];
  if (!existing.includes(version)) {
    existing.push(version);
  }
  versionMap.set(key, existing);
}

export function removeVersion(method: string, path: string, version: string): void {
  const key = makeKey(method, path);
  const existing = versionMap.get(key) ?? [];
  versionMap.set(key, existing.filter((v) => v !== version));
}

export function getVersions(method: string, path: string): string[] {
  return versionMap.get(makeKey(method, path)) ?? [];
}

export function getLatestVersion(method: string, path: string): string | null {
  const versions = getVersions(method, path);
  if (versions.length === 0) return null;
  return versions[versions.length - 1];
}

export function getAllVersions(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, versions] of versionMap.entries()) {
    result[key] = versions;
  }
  return result;
}

export function getEndpointsByVersion(version: string): string[] {
  const results: string[] = [];
  for (const [key, versions] of versionMap.entries()) {
    if (versions.includes(version)) {
      results.push(key);
    }
  }
  return results;
}

export function resetVersionTracker(): void {
  versionMap.clear();
}
