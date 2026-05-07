/**
 * Endpoint Visibility Registry
 * Tracks whether endpoints are public, internal, or hidden from documentation.
 */

export type VisibilityLevel = 'public' | 'internal' | 'hidden';

export interface VisibilityEntry {
  method: string;
  path: string;
  visibility: VisibilityLevel;
  updatedAt: string;
}

const registry = new Map<string, VisibilityEntry>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function setVisibility(
  method: string,
  path: string,
  visibility: VisibilityLevel
): void {
  const key = makeKey(method, path);
  registry.set(key, {
    method: method.toUpperCase(),
    path,
    visibility,
    updatedAt: new Date().toISOString(),
  });
}

export function getVisibility(
  method: string,
  path: string
): VisibilityLevel {
  const key = makeKey(method, path);
  return registry.get(key)?.visibility ?? 'public';
}

export function removeVisibility(method: string, path: string): boolean {
  return registry.delete(makeKey(method, path));
}

export function getAllVisibilities(): VisibilityEntry[] {
  return Array.from(registry.values());
}

export function getEndpointsByVisibility(
  visibility: VisibilityLevel
): VisibilityEntry[] {
  return getAllVisibilities().filter((e) => e.visibility === visibility);
}

export function isVisible(
  method: string,
  path: string,
  allowInternal = false
): boolean {
  const v = getVisibility(method, path);
  if (v === 'hidden') return false;
  if (v === 'internal' && !allowInternal) return false;
  return true;
}

export function resetVisibilityRegistry(): void {
  registry.clear();
}
