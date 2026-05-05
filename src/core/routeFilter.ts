/**
 * routeFilter.ts
 * Provides filtering utilities to include/exclude routes from documentation
 * based on path patterns, methods, and custom predicates.
 */

export interface RouteFilterOptions {
  excludePaths?: (string | RegExp)[];
  includePaths?: (string | RegExp)[];
  excludeMethods?: string[];
  includeMethods?: string[];
  customFilter?: (method: string, path: string) => boolean;
}

function matchesPattern(value: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    return value === pattern || value.startsWith(pattern);
  }
  return pattern.test(value);
}

export function shouldIncludeRoute(
  method: string,
  path: string,
  options: RouteFilterOptions
): boolean {
  const upperMethod = method.toUpperCase();

  if (options.customFilter && !options.customFilter(upperMethod, path)) {
    return false;
  }

  if (options.excludePaths?.some((p) => matchesPattern(path, p))) {
    return false;
  }

  if (options.includePaths && !options.includePaths.some((p) => matchesPattern(path, p))) {
    return false;
  }

  if (options.excludeMethods?.map((m) => m.toUpperCase()).includes(upperMethod)) {
    return false;
  }

  if (
    options.includeMethods &&
    !options.includeMethods.map((m) => m.toUpperCase()).includes(upperMethod)
  ) {
    return false;
  }

  return true;
}

export function createRouteFilter(
  options: RouteFilterOptions
): (method: string, path: string) => boolean {
  return (method: string, path: string) => shouldIncludeRoute(method, path, options);
}
