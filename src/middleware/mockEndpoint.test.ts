import express from 'express';
import request from 'supertest';
import { createMockRouter } from './mockEndpoint';
import { RouteDoc } from '../core/docGenerator';

const sampleRoutes: RouteDoc[] = [
  {
    method: 'get',
    path: '/items',
    requestSchema: null,
    responseSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        label: { type: 'string' },
      },
    },
    sampleCount: 3,
  },
  {
    method: 'post',
    path: '/items',
    requestSchema: null,
    responseSchema: null,
    sampleCount: 1,
  },
];

function buildApp(routes: RouteDoc[]) {
  const app = express();
  app.use('/_routewatch', createMockRouter(() => routes));
  return app;
}

describe('GET /_routewatch/mocks', () => {
  it('returns all mocks as a JSON object', async () => {
    const app = buildApp(sampleRoutes);
    const res = await request(app).get('/_routewatch/mocks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('GET /items');
    expect(res.body).toHaveProperty('POST /items');
  });

  it('includes status and body in each mock', async () => {
    const app = buildApp(sampleRoutes);
    const res = await request(app).get('/_routewatch/mocks');
    expect(res.body['GET /items'].status).toBe(200);
    expect(res.body['GET /items'].body).toHaveProperty('id');
  });

  it('returns empty object when no routes', async () => {
    const app = buildApp([]);
    const res = await request(app).get('/_routewatch/mocks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });
});

describe('GET /_routewatch/mocks/:method/*', () => {
  it('returns mock for a specific route', async () => {
    const app = buildApp(sampleRoutes);
    const res = await request(app).get('/_routewatch/mocks/get/items');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 200);
  });

  it('returns 404 for unknown route', async () => {
    const app = buildApp(sampleRoutes);
    const res = await request(app).get('/_routewatch/mocks/delete/items');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/No mock found/);
  });
});
