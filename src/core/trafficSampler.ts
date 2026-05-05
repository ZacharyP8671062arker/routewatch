import { inferSchema, mergeSchemas, InferredSchema } from './schemaInferrer';

export interface RouteSample {
  method: string;
  path: string;
  requestBodySchema?: InferredSchema;
  responseBodySchema?: InferredSchema;
  statusCodes: Set<number>;
  hitCount: number;
  lastSeen: Date;
}

type RouteKey = string;

function buildKey(method: string, path: string): RouteKey {
  return `${method.toUpperCase()}:${path}`;
}

export class TrafficSampler {
  private samples = new Map<RouteKey, RouteSample>();

  record(options: {
    method: string;
    path: string;
    requestBody?: unknown;
    responseBody?: unknown;
    statusCode: number;
  }): void {
    const { method, path, requestBody, responseBody, statusCode } = options;
    const key = buildKey(method, path);

    const existing = this.samples.get(key);

    if (!existing) {
      this.samples.set(key, {
        method: method.toUpperCase(),
        path,
        requestBodySchema: requestBody != null ? inferSchema(requestBody) : undefined,
        responseBodySchema: responseBody != null ? inferSchema(responseBody) : undefined,
        statusCodes: new Set([statusCode]),
        hitCount: 1,
        lastSeen: new Date(),
      });
      return;
    }

    existing.hitCount += 1;
    existing.lastSeen = new Date();
    existing.statusCodes.add(statusCode);

    if (requestBody != null) {
      existing.requestBodySchema = mergeSchemas(
        existing.requestBodySchema,
        inferSchema(requestBody)
      );
    }

    if (responseBody != null) {
      existing.responseBodySchema = mergeSchemas(
        existing.responseBodySchema,
        inferSchema(responseBody)
      );
    }
  }

  getAll(): RouteSample[] {
    return Array.from(this.samples.values());
  }

  get(method: string, path: string): RouteSample | undefined {
    return this.samples.get(buildKey(method, path));
  }

  clear(): void {
    this.samples.clear();
  }
}
