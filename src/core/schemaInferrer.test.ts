import { inferSchema, mergeSchemas, InferredSchema } from './schemaInferrer';

describe('inferSchema', () => {
  it('returns null type for null', () => {
    expect(inferSchema(null)).toEqual({ type: 'null' });
  });

  it('infers primitive types', () => {
    expect(inferSchema('hello')).toEqual({ type: 'string' });
    expect(inferSchema(42)).toEqual({ type: 'number' });
    expect(inferSchema(true)).toEqual({ type: 'boolean' });
  });

  it('infers object schema', () => {
    const result = inferSchema({ name: 'Alice', age: 30 });
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });
  });

  it('infers array schema from first element', () => {
    const result = inferSchema([{ id: 1 }]);
    expect(result).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'number' } },
      },
    });
  });

  it('returns unknown for empty arrays', () => {
    expect(inferSchema([])).toEqual({ type: 'array', items: { type: 'unknown' } });
  });

  it('limits recursion depth', () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: 'too deep' } } } } } } };
    const result = inferSchema(deep);
    expect(result.type).toBe('object');
  });
});

describe('mergeSchemas', () => {
  it('returns incoming when existing is undefined', () => {
    const schema: InferredSchema = { type: 'string' };
    expect(mergeSchemas(undefined, schema)).toEqual(schema);
  });

  it('returns incoming when types differ', () => {
    const a: InferredSchema = { type: 'string' };
    const b: InferredSchema = { type: 'number' };
    expect(mergeSchemas(a, b)).toEqual(b);
  });

  it('merges object properties', () => {
    const a: InferredSchema = { type: 'object', properties: { name: { type: 'string' } } };
    const b: InferredSchema = { type: 'object', properties: { age: { type: 'number' } } };
    const result = mergeSchemas(a, b);
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });
  });

  it('merges nested array items', () => {
    const a: InferredSchema = { type: 'array', items: { type: 'string' } };
    const b: InferredSchema = { type: 'array', items: { type: 'string' } };
    expect(mergeSchemas(a, b)).toEqual({ type: 'array', items: { type: 'string' } });
  });
});
