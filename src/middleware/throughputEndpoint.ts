import { Router, Request, Response } from 'express';
import {
  recordThroughputRequest,
  getThroughputStats,
  getAllThroughputStats,
  configureThroughputTracker,
} from '../core/endpointThroughputTracker';

export function createThroughputRouter(): Router {
  const router = Router();

  // Configure window via query param: POST /__routewatch/throughput/configure
  router.post('/configure', (req: Request, res: Response) => {
    const { windowMs } = req.body as { windowMs?: number };
    if (windowMs !== undefined && (typeof windowMs !== 'number' || windowMs <= 0)) {
      return res.status(400).json({ error: 'windowMs must be a positive number' });
    }
    configureThroughputTracker({ windowMs });
    return res.json({ ok: true, windowMs });
  });

  // GET /__routewatch/throughput — list all throughput stats
  router.get('/', (_req: Request, res: Response) => {
    const stats = getAllThroughputStats();
    return res.json({ throughput: stats });
  });

  // GET /__routewatch/throughput/:method/:path — stats for a specific endpoint
  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method.toUpperCase();
    const path = '/' + (req.params as Record<string, string>)[0];
    const stats = getThroughputStats(method, path);
    if (!stats) {
      return res.status(404).json({ error: `No throughput data for ${method} ${path}` });
    }
    return res.json(stats);
  });

  // POST /__routewatch/throughput/record — manually record a request (useful for testing)
  router.post('/record', (req: Request, res: Response) => {
    const { method, path } = req.body as { method?: string; path?: string };
    if (!method || !path) {
      return res.status(400).json({ error: 'method and path are required' });
    }
    recordThroughputRequest(method, path);
    return res.json({ ok: true });
  });

  return router;
}
