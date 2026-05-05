/**
 * Infers a lightweight JSON schema from a sample value.
 * Used to build request/response shape documentation on-the-fly.
 */

export type InferredSchema =
  | { type: 'object'; properties: Record<string, InferredSchema> }
  | { type: 'array'; items: InferredSchema }
  | { type: 'string' | 'number' | 'boolean' | 'null' | 'unknown' };

export function inferSchema(value: unknown, depth = 0): InferredSchema {
  if (depth > 5) return { type: 'unknown' };

  if (value === null) return { type: 'null' };

  switch (typeof value) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'object': {
      if (Array.isArray(value)) {
        const itemSchema =
          value.length > 0 ? inferSchema(value[0], depth + 1) : { type: 'unknown' as const };
        return { type: 'array', items: itemSchema };
      }

      const properties: Record<string, InferredSchema> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        properties[key] = inferSchema(val, depth + 1);
      }
      return { type: 'object', properties };
    }
    default:
      return { type: 'unknown' };
  }
}

/**
 * Merges two inferred schemas, preferring object/array details over primitives.
 * Allows schema to evolve as more traffic flows through.
 */
export function mergeSchemas(
  existing: InferredSchema | undefined,
  incoming: InferredSchema
): InferredSchema {
  if (!existing) return incoming;
  if (existing.type !== incoming.type) return incoming;

  if (
    existing.type === 'object' &&
    incoming.type === 'object'
  ) {
    const merged: Record<string, InferredSchema> = { ...existing.properties };
    for (const [key, schema] of Object.entries(incoming.properties)) {
      merged[key] = mergeSchemas(existing.properties[key], schema);
    }
    return { type: 'object', properties: merged };
  }

  if (
    existing.type === 'array' &&
    incoming.type === 'array'
  ) {
    return { type: 'array', items: mergeSchemas(existing.items, incoming.items) };
  }

  return existing;
}
