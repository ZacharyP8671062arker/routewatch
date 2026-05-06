import Fastify, { FastifyInstance } from 'fastify';
import { routeWatchFastify } from './fastifyMiddleware';

async function buildApp(options = {}): Promise<FastifyInstance> {
  const fastify = Fastify();
  routeWatchFastify(fastify, options);

  fastify.get('/users', async () => {
    return { users: [{ id: 1, name: 'Alice' }] };
  });

  fastify.post('/users', async (request) => {
    return { created: true, data: request.body };
  });

  await fastify.ready();
  return fastify;
}

/**
 * Extracts the JSON payload embedded in a routewatch HTML response.
 * Looks for content inside a <pre> tag and parses it as JSON.
 */
function extractJsonFromHtmlResponse(body: string): unknown[] {
  const match = body.match(/<pre>(.*?)<\/pre>/s);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1].trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

describe('routeWatchFastify middleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should serve HTML docs at default path', async () => {
    const response = await app.inject({ method: 'GET', url: '/__routewatch' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('should serve JSON docs when format is json', async () => {
    const jsonApp = await buildApp({ format: 'json' });
    const response = await jsonApp.inject({ method: 'GET', url: '/__routewatch' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    await jsonApp.close();
  });

  it('should collect route data after traffic', async () => {
    await app.inject({ method: 'GET', url: '/users' });
    await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Bob' },
      headers: { 'content-type': 'application/json' },
    });

    const docsResponse = await app.inject({ method: 'GET', url: '/__routewatch' });
    const body = docsResponse.body;
    expect(body).toContain('/users');
  });

  it('should support a custom docs path', async () => {
    const customApp = await buildApp({ path: '/api-docs' });
    const response = await customApp.inject({ method: 'GET', url: '/api-docs' });
    expect(response.statusCode).toBe(200);
    await customApp.close();
  });

  it('should not record traffic to the docs route itself', async () => {
    await app.inject({ method: 'GET', url: '/__routewatch' });
    await app.inject({ method: 'GET', url: '/__routewatch' });

    const docsResponse = await app.inject({ method: 'GET', url: '/__routewatch' });
    const routes = extractJsonFromHtmlResponse(docsResponse.body);

    // Docs path should not appear as a collected route
    const docRoute = routes.find((r: any) => r.path === '/__routewatch');
    expect(docRoute).toBeUndefined();
  });
});
