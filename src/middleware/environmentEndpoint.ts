import { Router, Request, Response } from 'express';
import {
  assignEnvironment,
  removeEnvironment,
  getEnvironments,
  getEndpointsByEnvironment,
  getAllEnvironmentEntries,
} from '../core/endpointEnvironmentTracker';
import { generateEnvironmentReport, formatEnvironmentReportText } from '../core/environmentReporter';

export function createEnvironmentRouter(): Router {
  const router = Router();

  // GET all environment entries
  router.get('/', (_req: Request, res: Response) => {
    res.json(getAllEnvironmentEntries());
  });

  // GET report
  router.get('/report', (req: Request, res: Response) => {
    const report = generateEnvironmentReport();
    if (req.query.format === 'text') {
      res.type('text/plain').send(formatEnvironmentReportText(report));
    } else {
      res.json(report);
    }
  });

  // GET endpoints by environment
  router.get('/by-env/:env', (req: Request, res: Response) => {
    const { env } = req.params;
    res.json(getEndpointsByEnvironment(env));
  });

  // GET environments for a specific endpoint
  router.get('/endpoint', (req: Request, res: Response) => {
    const { method, path: ePath } = req.query as { method?: string; path?: string };
    if (!method || !ePath) {
      return res.status(400).json({ error: 'method and path query params are required' });
    }
    res.json(getEnvironments(method, ePath));
  });

  // POST assign environment
  router.post('/assign', (req: Request, res: Response) => {
    const { method, path: ePath, environment } = req.body as Record<string, string>;
    if (!method || !ePath || !environment) {
      return res.status(400).json({ error: 'method, path, and environment are required' });
    }
    assignEnvironment(method, ePath, environment);
    res.json({ success: true });
  });

  // DELETE remove environment
  router.delete('/remove', (req: Request, res: Response) => {
    const { method, path: ePath, environment } = req.body as Record<string, string>;
    if (!method || !ePath || !environment) {
      return res.status(400).json({ error: 'method, path, and environment are required' });
    }
    removeEnvironment(method, ePath, environment);
    res.json({ success: true });
  });

  return router;
}
