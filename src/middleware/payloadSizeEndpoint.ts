import { Router, Request, Response } from 'express';
import {
  configurePayloadSize,
  getPayloadSizeStats,
  getAllPayloadSizeStats,
  PayloadSizeConfig,
} from '../core/endpointPayloadSizeTracker';

export function createPayloadSizeRouter(): Router {
  const router = Router();

  // GET /routewatch/payload-size — list all stats
  router.get('/', (_req: Request, res: Response) => {
    const stats = getAllPayloadSizeStats();
    const hasViolations = stats.some(
      s => s.requestViolations > 0 || s.responseViolations > 0
    );
    res.json({ hasViolations, count: stats.length, stats });
  });

  // GET /routewatch/payload-size/:method/:path — single endpoint stats
  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method.toUpperCase();
    const path = '/' + (req.params as Record<string, string>)[0];
    const stats = getPayloadSizeStats(method, path);
    if (!stats) {
      return res.status(404).json({ error: 'No payload data for this endpoint' });
    }
    return res.json(stats);
  });

  // POST /routewatch/payload-size/configure — set thresholds
  router.post('/configure', (req: Request, res: Response) => {
    const { method, path, maxRequestBytes, maxResponseBytes } = req.body as {
      method: string;
      path: string;
      maxRequestBytes?: number;
      maxResponseBytes?: number;
    };
    if (!method || !path) {
      return res.status(400).json({ error: '"method" and "path" are required' });
    }
    const config: PayloadSizeConfig = {};
    if (maxRequestBytes !== undefined) config.maxRequestBytes = maxRequestBytes;
    if (maxResponseBytes !== undefined) config.maxResponseBytes = maxResponseBytes;
    configurePayloadSize(method, path, config);
    return res.json({ ok: true, method: method.toUpperCase(), path, config });
  });

  return router;
}
