import { RouteDoc } from './docGenerator';

export interface MockResponse {
  status: number;
  body: Record<string, unknown>;
}

function generateMockValue(type: string, key: string): unknown {
  switch (type) {
    case 'string':
      return key.toLowerCase().includes('id') ? 'abc123' : `sample_${key}`;
    case 'number':
      return key.toLowerCase().includes('id') ? 1 : 42;
    case 'boolean':
      return true;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

function buildMockBody(
  schema: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!schema || typeof schema !== 'object') return {};
  const props = (schema as any).properties;
  if (!props) return {};
  const result: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(props)) {
    const fieldDef = def as any;
    result[key] = generateMockValue(fieldDef.type ?? 'string', key);
  }
  return result;
}

export function generateMockForRoute(route: RouteDoc): MockResponse {
  const body = buildMockBody(route.responseSchema as Record<string, unknown>);
  return { status: 200, body };
}

export function generateAllMocks(
  routes: RouteDoc[]
): Map<string, MockResponse> {
  const map = new Map<string, MockResponse>();
  for (const route of routes) {
    const key = `${route.method.toUpperCase()} ${route.path}`;
    map.set(key, generateMockForRoute(route));
  }
  return map;
}
