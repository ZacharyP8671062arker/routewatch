import { Router, Request, Response } from 'express';
import {
  getAllFingerprints,
  getFingerprint,
  compareFingerprints,
  EndpointFingerprint,
} from '../core/endpointFingerprintTracker';

export function createFingerprintRouter(): Router {
  const router = Router();

  // GET /__routewatch/fingerprints — list all fingerprints
  router.get('/', (_req: Request, res: Response) => {
    const fingerprints = getAllFingerprints();
    res.json({ total: fingerprints.length, fingerprints });
  });

  // GET /__routewatch/fingerprints/lookup?method=GET&path=/users
  router.get('/lookup', (req: Request, res: Response) => {
    const { method, path: routePath } = req.query as { method?: string; path?: string };
    if (!method || !routePath) {
      res.status(400).json({ error: '"method" and "path" query params are required.' });
      return;
    }
    const fp = getFingerprint(method, routePath);
    if (!fp) {
      res.status(404).json({ error: 'Fingerprint not found for given method + path.' });
      return;
    }
    res.json(fp);
  });

  // POST /__routewatch/fingerprints/compare — compare two fingerprint payloads
  router.post('/compare', (req: Request, res: Response) => {
    const { a, b } = req.body as { a?: EndpointFingerprint; b?: EndpointFingerprint };
    if (!a || !b) {
      res.status(400).json({ error: 'Request body must contain "a" and "b" fingerprint objects.' });
      return;
    }
    const diff = compareFingerprints(a, b);
    const hasDrift =
      diff.added.length > 0 || diff.removed.length > 0 || diff.statusDrift.length > 0;
    res.json({ hasDrift, diff });
  });

  return router;
}
