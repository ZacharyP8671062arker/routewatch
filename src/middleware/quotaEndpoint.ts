import { Router, Request, Response } from 'express';
import {
  configureQuota,
  recordQuotaRequest,
  getQuotaStats,
  getAllQuotaStats,
  QuotaConfig,
} from '../core/endpointQuotaTracker';

export function createQuotaRouter(): Router {
  const router = Router();

  // GET /routewatch/quota — list all quota stats
  router.get('/', (_req: Request, res: Response) => {
    const stats = getAllQuotaStats();
    res.json({
      total: stats.length,
      exceeded: stats.filter((s) => s.exceeded).length,
      quotas: stats,
    });
  });

  // GET /routewatch/quota/:method/:path — get quota stats for a specific route
  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const path = '/' + (req.params as Record<string, string>)[0];
    const stats = getQuotaStats(method, path);
    if (!stats) {
      return res.status(404).json({ error: `No quota configured for ${method.toUpperCase()} ${path}` });
    }
    res.json(stats);
  });

  // POST /routewatch/quota/configure — configure a quota for a route
  router.post('/configure', (req: Request, res: Response) => {
    const { method, path, limit, windowMs } = req.body as {
      method: string;
      path: string;
      limit: number;
      windowMs: number;
    };

    if (!method || !path || typeof limit !== 'number' || typeof windowMs !== 'number') {
      return res.status(400).json({ error: 'method, path, limit, and windowMs are required' });
    }

    const config: QuotaConfig = { limit, windowMs };
    configureQuota(method, path, config);
    res.status(201).json({ message: `Quota configured for ${method.toUpperCase()} ${path}`, config });
  });

  // POST /routewatch/quota/record — manually record a quota request
  router.post('/record', (req: Request, res: Response) => {
    const { method, path } = req.body as { method: string; path: string };
    if (!method || !path) {
      return res.status(400).json({ error: 'method and path are required' });
    }
    recordQuotaRequest(method, path);
    const stats = getQuotaStats(method, path);
    res.json({ recorded: true, stats });
  });

  return router;
}
