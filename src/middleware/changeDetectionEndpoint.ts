/**
 * Express router that exposes endpoint change detection data.
 * Mounts at a configurable path to serve change log and snapshots.
 */

import { Router, Request, Response } from 'express';
import { getChangeLog, getSnapshot } from '../core/endpointChangeDetector';

export interface ChangeDetectionRouterOptions {
  path?: string;
}

export function createChangeDetectionRouter(
  options: ChangeDetectionRouterOptions = {}
): Router {
  const router = Router();
  const basePath = options.path ?? '/_routewatch/changes';

  router.get(`${basePath}/log`, (_req: Request, res: Response) => {
    const log = getChangeLog();
    res.json({
      total: log.length,
      changes: log.map((e) => ({
        method: e.method,
        path: e.path,
        field: e.field,
        detectedAt: new Date(e.detectedAt).toISOString(),
        previous: e.previous,
        current: e.current,
      })),
    });
  });

  router.get(`${basePath}/snapshot`, (req: Request, res: Response) => {
    const method = (req.query.method as string | undefined)?.toUpperCase();
    const routePath = req.query.path as string | undefined;

    if (!method || !routePath) {
      res.status(400).json({ error: 'Query params "method" and "path" are required.' });
      return;
    }

    const snapshot = getSnapshot(method, routePath);
    if (!snapshot) {
      res.status(404).json({ error: 'No snapshot found for the given method and path.' });
      return;
    }

    res.json({
      ...snapshot,
      capturedAt: new Date(snapshot.capturedAt).toISOString(),
    });
  });

  return router;
}
