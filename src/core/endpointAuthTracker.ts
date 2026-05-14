/**
 * Tracks authentication requirements and observed auth schemes per endpoint.
 */

export type AuthScheme = 'bearer' | 'basic' | 'api-key' | 'none' | 'unknown';

export interface AuthStats {
  method: string;
  path: string;
  requiredScheme: AuthScheme;
  observedSchemes: AuthScheme[];
  totalRequests: number;
  unauthenticatedRequests: number;
}

const authRegistry = new Map<string, AuthStats>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configureAuth(
  method: string,
  path: string,
  requiredScheme: AuthScheme
): void {
  const key = makeKey(method, path);
  const existing = authRegistry.get(key);
  if (existing) {
    existing.requiredScheme = requiredScheme;
  } else {
    authRegistry.set(key, {
      method: method.toUpperCase(),
      path,
      requiredScheme,
      observedSchemes: [],
      totalRequests: 0,
      unauthenticatedRequests: 0,
    });
  }
}

export function recordAuthRequest(
  method: string,
  path: string,
  observedScheme: AuthScheme
): void {
  const key = makeKey(method, path);
  if (!authRegistry.has(key)) {
    authRegistry.set(key, {
      method: method.toUpperCase(),
      path,
      requiredScheme: 'unknown',
      observedSchemes: [],
      totalRequests: 0,
      unauthenticatedRequests: 0,
    });
  }
  const stats = authRegistry.get(key)!;
  stats.totalRequests += 1;
  if (observedScheme === 'none') {
    stats.unauthenticatedRequests += 1;
  }
  if (!stats.observedSchemes.includes(observedScheme)) {
    stats.observedSchemes.push(observedScheme);
  }
}

export function getAuthStats(method: string, path: string): AuthStats | undefined {
  return authRegistry.get(makeKey(method, path));
}

export function getAllAuthStats(): AuthStats[] {
  return Array.from(authRegistry.values());
}

export function resetAuthTracker(): void {
  authRegistry.clear();
}

export function detectSchemeFromHeaders(
  headers: Record<string, string | string[] | undefined>
): AuthScheme {
  const auth = headers['authorization'];
  const apiKey = headers['x-api-key'];
  if (apiKey) return 'api-key';
  if (typeof auth === 'string') {
    if (auth.toLowerCase().startsWith('bearer ')) return 'bearer';
    if (auth.toLowerCase().startsWith('basic ')) return 'basic';
  }
  return 'none';
}
