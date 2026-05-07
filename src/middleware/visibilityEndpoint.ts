/**
 * Visibility Endpoint
 * Exposes REST endpoints for managing and querying endpoint visibility.
 */

import { Router, Request, Response } from 'express';
import {
  setVisibility,
  getVisibility,
  removeVisibility,
  getAllVisibilities,
  getEndpointsByVisibility,
  resetVisibilityRegistry,
  VisibilityLevel,
} from '../core/endpointVisibilityRegistry';
import {
  generateVisibilityReport,
  formatVisibilityReportText,
} from '../core/visibilityReporter';

const VALID_LEVELS: VisibilityLevel[] = ['public', 'internal', 'hidden'];

export function createVisibilityRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(getAllVisibilities());
  });

  router.get('/report', (req: Request, res: Response) => {
    const report = generateVisibilityReport();
    if (req.query.format === 'text') {
      res.type('text/plain').send(formatVisibilityReportText(report));
    } else {
      res.json(report);
    }
  });

  router.get('/filter', (req: Request, res: Response) => {
    const level = req.query.level as VisibilityLevel;
    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({ error: 'Invalid visibility level' });
    }
    res.json(getEndpointsByVisibility(level));
  });

  router.get('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const visibility = getVisibility(method, `/${path}`);
    res.json({ method: method.toUpperCase(), path: `/${path}`, visibility });
  });

  router.post('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const { visibility } = req.body as { visibility: VisibilityLevel };
    if (!VALID_LEVELS.includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility level' });
    }
    setVisibility(method, `/${path}`, visibility);
    res.json({ method: method.toUpperCase(), path: `/${path}`, visibility });
  });

  router.delete('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const removed = removeVisibility(method, `/${path}`);
    res.json({ removed });
  });

  router.post('/reset', (_req: Request, res: Response) => {
    resetVisibilityRegistry();
    res.json({ message: 'Visibility registry cleared' });
  });

  return router;
}
