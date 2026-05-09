import { Router, Request, Response } from 'express';
import {
  addDependency,
  removeDependency,
  getDependencies,
  getAllDependencies,
  getDependents,
  makeKey,
} from '../core/endpointDependencyTracker';

export function createDependencyRouter(): Router {
  const router = Router();

  // GET all dependencies
  router.get('/', (_req: Request, res: Response) => {
    res.json({ dependencies: getAllDependencies() });
  });

  // GET dependencies for a specific endpoint
  router.get('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const deps = getDependencies(method, `/${path}`);
    res.json({ key: makeKey(method, `/${path}`), dependencies: deps });
  });

  // GET reverse: who depends on this endpoint
  router.get('/dependents/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const key = makeKey(method, `/${path}`);
    const dependents = getDependents(key);
    res.json({ key, dependents });
  });

  // POST add a dependency
  router.post('/', (req: Request, res: Response) => {
    const { method, path, dependsOn } = req.body as {
      method?: string;
      path?: string;
      dependsOn?: string;
    };
    if (!method || !path || !dependsOn) {
      return res.status(400).json({ error: 'method, path, and dependsOn are required' });
    }
    addDependency(method, path, dependsOn);
    res.status(201).json({ key: makeKey(method, path), dependsOn });
  });

  // DELETE remove a dependency
  router.delete('/', (req: Request, res: Response) => {
    const { method, path, dependsOn } = req.body as {
      method?: string;
      path?: string;
      dependsOn?: string;
    };
    if (!method || !path || !dependsOn) {
      return res.status(400).json({ error: 'method, path, and dependsOn are required' });
    }
    removeDependency(method, path, dependsOn);
    res.json({ removed: true });
  });

  return router;
}
