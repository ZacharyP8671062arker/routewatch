import { exportDoc, formatAsJson, formatAsOpenApi, formatAsMarkdown } from './exportFormatter';
import { ApiDoc } from './docGenerator';

const sampleDoc: ApiDoc = {
  routes: [
    {
      method: 'GET',
      path: '/users/:id',
      requestSchema: null,
      responseSchema: { type: 'object', properties: { id: { type: 'number' }, name: { type: 'string' } } },
      sampleCount: 5,
    },
    {
      method: 'POST',
      path: '/users',
      requestSchema: { type: 'object', properties: { name: { type: 'string' } } },
      responseSchema: { type: 'object', properties: { id: { type: 'number' } } },
      sampleCount: 3,
    },
  ],
  generatedAt: '2024-01-01T00:00:00.000Z',
};

describe('formatAsJson', () => {
  it('should return valid JSON string', () => {
    const result = formatAsJson(sampleDoc);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should include all routes', () => {
    const result = JSON.parse(formatAsJson(sampleDoc));
    expect(result.routes).toHaveLength(2);
  });
});

describe('formatAsOpenApi', () => {
  it('should include openapi version', () => {
    const result = formatAsOpenApi(sampleDoc) as any;
    expect(result.openapi).toBe('3.0.0');
  });

  it('should convert Express path params to OpenAPI format', () => {
    const result = formatAsOpenApi(sampleDoc) as any;
    expect(result.paths['/users/{id}']).toBeDefined();
  });

  it('should include request body for POST routes', () => {
    const result = formatAsOpenApi(sampleDoc) as any;
    expect(result.paths['/users'].post.requestBody).toBeDefined();
  });

  it('should not include request body for GET routes with no schema', () => {
    const result = formatAsOpenApi(sampleDoc) as any;
    expect(result.paths['/users/{id}'].get.requestBody).toBeUndefined();
  });
});

describe('formatAsMarkdown', () => {
  it('should start with a heading', () => {
    const result = formatAsMarkdown(sampleDoc);
    expect(result.startsWith('# API Documentation')).toBe(true);
  });

  it('should include route method and path', () => {
    const result = formatAsMarkdown(sampleDoc);
    expect(result).toContain('GET /users/:id');
    expect(result).toContain('POST /users');
  });

  it('should include request schema section when present', () => {
    const result = formatAsMarkdown(sampleDoc);
    expect(result).toContain('**Request Body:**');
  });
});

describe('exportDoc', () => {
  it('should export json format', () => {
    const result = exportDoc(sampleDoc, 'json');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should export openapi format', () => {
    const result = exportDoc(sampleDoc, 'openapi');
    const parsed = JSON.parse(result);
    expect(parsed.openapi).toBe('3.0.0');
  });

  it('should export markdown format', () => {
    const result = exportDoc(sampleDoc, 'markdown');
    expect(result).toContain('# API Documentation');
  });

  it('should throw for unsupported format', () => {
    expect(() => exportDoc(sampleDoc, 'xml' as any)).toThrow('Unsupported export format');
  });
});
