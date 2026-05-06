/**
 * endpointTagManager.ts
 * Allows tagging endpoints with custom labels (e.g. "auth", "public", "internal")
 * so they can be grouped and filtered in documentation.
 */

type TagMap = Map<string, Set<string>>;

const tagMap: TagMap = new Map();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function addTag(method: string, path: string, tag: string): void {
  const key = makeKey(method, path);
  if (!tagMap.has(key)) {
    tagMap.set(key, new Set());
  }
  tagMap.get(key)!.add(tag.trim().toLowerCase());
}

export function removeTag(method: string, path: string, tag: string): void {
  const key = makeKey(method, path);
  tagMap.get(key)?.delete(tag.trim().toLowerCase());
}

export function getTags(method: string, path: string): string[] {
  const key = makeKey(method, path);
  return Array.from(tagMap.get(key) ?? []);
}

export function getEndpointsByTag(tag: string): string[] {
  const normalized = tag.trim().toLowerCase();
  const results: string[] = [];
  for (const [key, tags] of tagMap.entries()) {
    if (tags.has(normalized)) {
      results.push(key);
    }
  }
  return results;
}

export function getAllTags(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, tags] of tagMap.entries()) {
    result[key] = Array.from(tags);
  }
  return result;
}

export function clearTags(): void {
  tagMap.clear();
}
