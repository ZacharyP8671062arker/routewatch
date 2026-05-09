import { Router, Request, Response } from 'express';
import { generateCircuitBreakerReport, hasOpenCircuits, formatCircuitBreakerReportText } from '../core/circuitBreakerReporter';
import { recordCircuitRequest, configureCircuitBreaker, resetCircuitBreaker } from '../core/endpointCircuitBreaker';

export function createCircuitBreakerRouter(): Router {
  const router = Router();

  /** GET /routewatch/circuit-breaker — JSON report */
  router.get('/', (_req: Request, res: Response) => {
    const report = generateCircuitBreakerReport();
    res.json({
      hasOpenCircuits: hasOpenCircuits(),
      ...report,
    });
  });

  /** GET /routewatch/circuit-breaker/text — plain-text report */
  router.get('/text', (_req: Request, res: Response) => {
    const report = generateCircuitBreakerReport();
    res.type('text/plain').send(formatCircuitBreakerReportText(report));
  });

  /** POST /routewatch/circuit-breaker/record — manually record a result */
  router.post('/record', (req: Request, res: Response) => {
    const { method, path: p, success } = req.body as { method?: string; path?: string; success?: boolean };
    if (!method || !p || success === undefined) {
      res.status(400).json({ error: 'method, path, and success are required' });
      return;
    }
    recordCircuitRequest(method, p, Boolean(success));
    res.json({ recorded: true });
  });

  /** POST /routewatch/circuit-breaker/configure — update thresholds */
  router.post('/configure', (req: Request, res: Response) => {
    const { failureThreshold, successThreshold, timeoutMs } = req.body as Record<string, number>;
    configureCircuitBreaker({ failureThreshold, successThreshold, timeoutMs });
    res.json({ configured: true });
  });

  /** DELETE /routewatch/circuit-breaker/reset — clear all state */
  router.delete('/reset', (_req: Request, res: Response) => {
    resetCircuitBreaker();
    res.json({ reset: true });
  });

  return router;
}
