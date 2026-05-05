import { RouteEntry } from './routeCollector';
import { inferSchema } from './schemaInferrer';

export interface RouteDoc {
  method: string;
  path: string;
  requestBodySchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  querySchema?: Record<string, unknown>;
  sampleCount: number;
  lastSeen: string;
}

export interface ApiDoc {
  generatedAt: string;
  totalRoutes: number;
  routes: RouteDoc[];
}

export function generateRouteDoc(entry: RouteEntry): RouteDoc {
  const doc: RouteDoc = {
    method: entry.method.toUpperCase(),
    path: entry.path,
    sampleCount: entry.samples.length,
    lastSeen: entry.lastSeen,
  };

  const bodySamples = entry.samples
    .map((s) => s.requestBody)
    .filter((b): b is Record<string, unknown> => b != null);

  if (bodySamples.length > 0) {
    doc.requestBodySchema = bodySamples.reduce(
      (merged, sample) => inferSchema(sample),
      {} as Record<string, unknown>
    );
  }

  const querySamples = entry.samples
    .map((s) => s.query)
    .filter((q): q is Record<string, unknown> => q != null && Object.keys(q).length > 0);

  if (querySamples.length > 0) {
    doc.querySchema = inferSchema(querySamples[0]);
  }

  const responseSamples = entry.samples
    .map((s) => s.responseBody)
    .filter((r): r is Record<string, unknown> => r != null);

  if (responseSamples.length > 0) {
    doc.responseSchema = inferSchema(responseSamples[0]);
  }

  return doc;
}

export function generateApiDoc(entries: RouteEntry[]): ApiDoc {
  return {
    generatedAt: new Date().toISOString(),
    totalRoutes: entries.length,
    routes: entries.map(generateRouteDoc),
  };
}
