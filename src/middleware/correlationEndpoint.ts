import { Router, Request, Response } from 'express';
import {
  getAllCorrelations,
  getCorrelations,
  resetCorrelationTracker,
} from '../core/endpointCorrelationTracker';

/**
 * Mounts endpoints for inspecting endpoint correlation data.
 *
 * GET  /routewatch/correlations          - all correlations
 * GET  /routewatch/correlations/:method/:path - correlations for one endpoint
 * DELETE /routewatch/correlations        - reset tracker
 */
export function createCorrelationRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    const data = getAllCorrelations();
    const summary = Object.entries(data).map(([endpoint, peers]) => ({
      endpoint,
      correlatedWith: Object.entries(peers)
        .sort((a, b) => b[1] - a[1])
        .map(([peer, count]) => ({ peer, count })),
    }));
    res.json({ correlations: summary });
  });

  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    // Express wildcard gives the rest of the path
    const path = '/' + (req.params[0] ?? '');
    const correlations = getCorrelations(method, path);
    const sorted = Object.entries(correlations)
      .sort((a, b) => b[1] - a[1])
      .map(([peer, count]) => ({ peer, count }));
    res.json({
      endpoint: `${method.toUpperCase()}:${path}`,
      correlatedWith: sorted,
    });
  });

  router.delete('/', (_req: Request, res: Response) => {
    resetCorrelationTracker();
    res.json({ message: 'Correlation tracker reset.' });
  });

  return router;
}
