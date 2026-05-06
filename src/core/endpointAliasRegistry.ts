/**
 * endpointAliasRegistry.ts
 * Allows routes to be registered with human-readable aliases for display in docs.
 */

type AliasEntry = {
  alias: string;
  description?: string;
};

const aliasMap = new Map<string, AliasEntry>();

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function assignAlias(
  method: string,
  path: string,
  alias: string,
  description?: string
): void {
  const key = makeKey(method, path);
  aliasMap.set(key, { alias, description });
}

export function removeAlias(method: string, path: string): boolean {
  const key = makeKey(method, path);
  return aliasMap.delete(key);
}

export function getAlias(
  method: string,
  path: string
): AliasEntry | undefined {
  return aliasMap.get(makeKey(method, path));
}

export function getAllAliases(): Record<string, AliasEntry> {
  const result: Record<string, AliasEntry> = {};
  for (const [key, entry] of aliasMap.entries()) {
    result[key] = entry;
  }
  return result;
}

export function hasAlias(method: string, path: string): boolean {
  return aliasMap.has(makeKey(method, path));
}

export function resetAliasRegistry(): void {
  aliasMap.clear();
}

export function formatAliasReportText(): string {
  const entries = [...aliasMap.entries()];
  if (entries.length === 0) return 'No aliases registered.';
  return entries
    .map(([key, { alias, description }]) => {
      const desc = description ? ` — ${description}` : '';
      return `${key} => "${alias}"${desc}`;
    })
    .join('\n');
}
