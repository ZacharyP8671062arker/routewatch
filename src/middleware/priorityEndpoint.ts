import { Router, Request, Response } from 'express';
import {
  assignPriority,
  removePriority,
  getPriority,
  getAllPriorities,
  getEndpointsByPriority,
  getPrioritySummary,
  PriorityLevel,
} from '../core/endpointPriorityRegistry';

const VALID_PRIORITIES: PriorityLevel[] = ['critical', 'high', 'medium', 'low'];

export function createPriorityRouter(): Router {
  const router = Router();

  // GET /priorities — list all or filter by level
  router.get('/', (req: Request, res: Response) => {
    const { level } = req.query;
    if (level) {
      if (!VALID_PRIORITIES.includes(level as PriorityLevel)) {
        return res.status(400).json({ error: `Invalid priority level: ${level}` });
      }
      return res.json(getEndpointsByPriority(level as PriorityLevel));
    }
    return res.json(getAllPriorities());
  });

  // GET /priorities/summary — counts per level
  router.get('/summary', (_req: Request, res: Response) => {
    res.json(getPrioritySummary());
  });

  // GET /priorities/:method/:path — get priority for a specific endpoint
  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const path = '/' + (req.params as Record<string, string>)['0'];
    const entry = getPriority(method, path);
    if (!entry) {
      return res.status(404).json({ error: 'Priority not found for this endpoint' });
    }
    return res.json(entry);
  });

  // POST /priorities — assign priority
  router.post('/', (req: Request, res: Response) => {
    const { method, path, priority, reason } = req.body;
    if (!method || !path || !priority) {
      return res.status(400).json({ error: 'method, path, and priority are required' });
    }
    if (!VALID_PRIORITIES.includes(priority as PriorityLevel)) {
      return res.status(400).json({ error: `Invalid priority level: ${priority}` });
    }
    const entry = assignPriority(method, path, priority as PriorityLevel, reason);
    return res.status(201).json(entry);
  });

  // DELETE /priorities/:method/:path — remove priority
  router.delete('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const path = '/' + (req.params as Record<string, string>)['0'];
    const removed = removePriority(method, path);
    if (!removed) {
      return res.status(404).json({ error: 'Priority entry not found' });
    }
    return res.json({ message: 'Priority removed' });
  });

  return router;
}
