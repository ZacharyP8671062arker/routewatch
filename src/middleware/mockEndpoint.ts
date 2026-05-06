import { Router, Request, Response } from 'express';
import { generateAllMocks } from '../core/endpointMockGenerator';
import { RouteDoc } from '../core/docGenerator';

export function createMockRouter(
  getRoutes: () => RouteDoc[]
): Router {
  const router = Router();

  router.get('/mocks', (_req: Request, res: Response) => {
    const routes = getRoutes();
    const mocks = generateAllMocks(routes);
    const output: Record<string, unknown> = {};
    for (const [key, mock] of mocks.entries()) {
      output[key] = mock;
    }
    res.json(output);
  });

  router.get('/mocks/:method/*', (req: Request, res: Response) => {
    const method = req.params.method.toLowerCase();
    const path = '/' + (req.params as any)[0];
    const routes = getRoutes();
    const match = routes.find(
      (r) => r.method.toLowerCase() === method && r.path === path
    );
    if (!match) {
      res.status(404).json({ error: 'No mock found for route' });
      return;
    }
    const mocks = generateAllMocks([match]);
    const key = `${method.toUpperCase()} ${path}`;
    res.json(mocks.get(key) ?? { status: 200, body: {} });
  });

  return router;
}
