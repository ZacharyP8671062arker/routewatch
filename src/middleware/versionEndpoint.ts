import { Router, Request, Response } from 'express';
import {
  assignVersion,
  removeVersion,
  getVersions,
  getAllVersions,
  getEndpointsByVersion,
  resetVersionTracker,
} from '../core/endpointVersionTracker';
import { generateVersionReport, formatVersionReportText } from '../core/versionReporter';

export function createVersionRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(getAllVersions());
  });

  router.get('/report', (req: Request, res: Response) => {
    const all = getAllVersions();
    const keys = Object.keys(all);
    const report = generateVersionReport(keys);
    if (req.query.format === 'text') {
      res.type('text/plain').send(formatVersionReportText(report));
    } else {
      res.json(report);
    }
  });

  router.get('/by-version/:version', (req: Request, res: Response) => {
    const { version } = req.params;
    const endpoints = getEndpointsByVersion(version);
    res.json({ version, endpoints });
  });

  router.get('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const versions = getVersions(method, path);
    res.json({ method: method.toUpperCase(), path: `/${path}`, versions });
  });

  router.post('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const { version } = req.body as { version?: string };
    if (!version) {
      return res.status(400).json({ error: 'version is required' });
    }
    assignVersion(method, `/${path}`, version);
    res.status(201).json({ method: method.toUpperCase(), path: `/${path}`, version });
  });

  router.delete('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const { version } = req.body as { version?: string };
    if (!version) {
      return res.status(400).json({ error: 'version is required' });
    }
    removeVersion(method, `/${path}`, version);
    res.json({ method: method.toUpperCase(), path: `/${path}`, version, removed: true });
  });

  return router;
}
