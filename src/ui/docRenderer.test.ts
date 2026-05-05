import { renderHtml, renderJson } from './docRenderer';
import { ApiDoc } from '../core/docGenerator';

const mockDoc: ApiDoc = {
  generatedAt: '2024-01-01T00:00:00.000Z',
  totalRoutes: 2,
  routes: [
    {
      method: 'GET',
      path: '/users',
      sampleCount: 5,
      lastSeen: '2024-01-01T00:00:00.000Z',
      querySchema: { page: 'number' },
      responseSchema: { id: 'number', name: 'string' },
    },
    {
      method: 'POST',
      path: '/users',
      sampleCount: 3,
      lastSeen: '2024-01-01T00:00:00.000Z',
      requestBodySchema: { name: 'string', age: 'number' },
      responseSchema: { id: 'number' },
    },
  ],
};

describe('renderHtml', () => {
  it('returns a string containing DOCTYPE', () => {
    expect(renderHtml(mockDoc)).toContain('<!DOCTYPE html>');
  });

  it('includes route method and path', () => {
    const html = renderHtml(mockDoc);
    expect(html).toContain('GET');
    expect(html).toContain('/users');
    expect(html).toContain('POST');
  });

  it('includes totalRoutes count', () => {
    expect(renderHtml(mockDoc)).toContain('Total routes: 2');
  });

  it('renders query schema section when present', () => {
    expect(renderHtml(mockDoc)).toContain('Query Params');
  });

  it('renders request body section when present', () => {
    expect(renderHtml(mockDoc)).toContain('Request Body');
  });

  it('does not render request body for GET route', () => {
    const html = renderHtml({ ...mockDoc, routes: [mockDoc.routes[0]] });
    expect(html).not.toContain('Request Body');
  });
});

describe('renderJson', () => {
  it('returns valid JSON string', () => {
    expect(() => JSON.parse(renderJson(mockDoc))).not.toThrow();
  });

  it('includes all routes', () => {
    const parsed = JSON.parse(renderJson(mockDoc));
    expect(parsed.routes).toHaveLength(2);
  });

  it('preserves generatedAt', () => {
    const parsed = JSON.parse(renderJson(mockDoc));
    expect(parsed.generatedAt).toBe('2024-01-01T00:00:00.000Z');
  });
});
