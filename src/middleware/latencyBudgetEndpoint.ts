import { Router, Request, Response } from 'express';
import {
  configureLatencyBudget,
  getAllLatencyBudgetStatuses,
  getLatencyBudgetStatus,
} from '../core/endpointLatencyBudget';

export function createLatencyBudgetRouter(): Router {
  const router = Router();

  // GET /routewatch/latency-budget — list all budgets and statuses
  router.get('/', (_req: Request, res: Response) => {
    const statuses = getAllLatencyBudgetStatuses();
    const violated = statuses.filter((s) => s.violated);
    res.json({
      total: statuses.length,
      violated: violated.length,
      statuses,
    });
  });

  // POST /routewatch/latency-budget — configure a budget
  router.post('/', (req: Request, res: Response) => {
    const { method, path: routePath, budgetMs } = req.body ?? {};
    if (!method || !routePath || typeof budgetMs !== 'number') {
      return res.status(400).json({
        error: 'method, path, and budgetMs (number) are required',
      });
    }
    configureLatencyBudget(method, routePath, { budgetMs });
    const status = getLatencyBudgetStatus(method, routePath);
    return res.status(201).json(status);
  });

  // GET /routewatch/latency-budget/:method/*path — single endpoint status
  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const routePath = '/' + (req.params as Record<string, string>)['0'];
    const status = getLatencyBudgetStatus(method, routePath);
    if (!status) {
      return res.status(404).json({ error: 'No latency budget configured for this endpoint' });
    }
    return res.json(status);
  });

  return router;
}
