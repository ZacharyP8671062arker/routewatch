import { Router, Request, Response } from 'express';
import {
  getAllCacheStats,
  getCacheStats,
  resetCacheTracker,
} from '../core/endpointCacheTracker';

/**
 * Mounts cache statistics endpoints under a given prefix (default: /__routewatch/cache).
 */
export function createCacheStatsRouter(prefix = '/__routewatch/cache'): Router {
  const router = Router();

  // GET all cache stats
  router.get(`${prefix}`, (_req: Request, res: Response) => {
    const stats = getAllCacheStats();
    res.json({
      stats,
      summary: buildSummary(stats),
    });
  });

  // GET cache stats for a specific endpoint
  router.get(`${prefix}/lookup`, (req: Request, res: Response) => {
    const { method, path: routePath } = req.query as {
      method?: string;
      path?: string;
    };
    if (!method || !routePath) {
      res.status(400).json({ error: 'method and path query params are required' });
      return;
    }
    const stats = getCacheStats(method, routePath);
    if (!stats) {
      res.status(404).json({ error: 'No cache data found for the given endpoint' });
      return;
    }
    res.json(stats);
  });

  // DELETE — reset all cache stats
  router.delete(`${prefix}`, (_req: Request, res: Response) => {
    resetCacheTracker();
    res.json({ message: 'Cache stats cleared' });
  });

  return router;
}

function buildSummary(
  stats: Record<string, { hits: number; misses: number; hitRate: number }>
): { totalEndpoints: number; overallHitRate: number } {
  const entries = Object.values(stats);
  if (entries.length === 0) return { totalEndpoints: 0, overallHitRate: 0 };
  const totalHits = entries.reduce((s, e) => s + e.hits, 0);
  const totalRequests = entries.reduce((s, e) => s + e.hits + e.misses, 0);
  return {
    totalEndpoints: entries.length,
    overallHitRate: totalRequests === 0 ? 0 : totalHits / totalRequests,
  };
}
