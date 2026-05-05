import express, { Application } from 'express';
import request from 'supertest';
import { routeWatch } from './expressMiddleware';

function buildApp(options = {}): Application {
  const app = express();
  app.use(express.json());
  app.use(routeWatch(options));

  app.get('/users', (_req, res) => res.json({ users: [] }));
  app.post('/users', (req, res) => res.status(201).json(req.body));

  return app;
}

describe('routeWatch express middleware', () => {
  it('passes through normal requests without interference', async () => {
    const app = buildApp();
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ users: [] });
  });

  it('serves HTML docs at default docsPath', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/__routewatch')
      .set('Accept', 'text/html');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<html');
  });

  it('serves JSON docs when Accept is application/json', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/__routewatch')
      .set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    const body = JSON.parse(res.text);
    expect(body).toHaveProperty('routes');
  });

  it('serves docs at a custom docsPath', async () => {
    const app = buildApp({ docsPath: '/api-docs' });
    const res = await request(app)
      .get('/api-docs')
      .set('Accept', 'application/json');
    expect(res.status).toBe(200);
  });

  it('does nothing when enabled is false', async () => {
    const app = buildApp({ enabled: false });
    const res = await request(app).get('/__routewatch');
    // Should fall through to 404 since no route registered
    expect(res.status).toBe(404);
  });

  it('collects route data after traffic flows through', async () => {
    const app = buildApp();
    await request(app).post('/users').send({ name: 'Alice' });

    const docsRes = await request(app)
      .get('/__routewatch')
      .set('Accept', 'application/json');

    const { routes } = JSON.parse(docsRes.text);
    expect(Array.isArray(routes)).toBe(true);
  });
});
