import { Router, Request, Response } from 'express';
import {
  recordTrace,
  getTraces,
  getAllTraces,
  clearTraces,
} from '../core/endpointRequestTracer';

/**
 * Provides REST endpoints for inspecting recorded request traces.
 * Also exports a helper to instrument incoming requests.
 */
export function createRequestTracerRouter(): Router {
  const router = Router();

  // GET /routewatch/traces — list all endpoint traces
  router.get('/routewatch/traces', (_req: Request, res: Response) => {
    res.json({ traces: getAllTraces() });
  });

  // GET /routewatch/traces/:method/:path — get traces for a specific endpoint
  router.get('/routewatch/traces/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const path = '/' + (req.params as Record<string, string>)[0];
    const stats = getTraces(method, path);
    if (!stats) {
      return res.status(404).json({ error: 'No traces found for this endpoint' });
    }
    res.json(stats);
  });

  // DELETE /routewatch/traces — clear all traces
  router.delete('/routewatch/traces', (_req: Request, res: Response) => {
    clearTraces();
    res.json({ message: 'All traces cleared' });
  });

  return router;
}

/**
 * Express middleware that automatically records a trace for every request.
 */
export function requestTracerMiddleware(
  req: Request,
  res: Response,
  next: () => void
): void {
  const start = Date.now();
  const requestSize = parseInt(req.headers['content-length'] ?? '0', 10) || 0;
  const traceId =
    (req.headers['x-trace-id'] as string) ??
    Math.random().toString(36).slice(2);

  res.on('finish', () => {
    const path = req.route?.path ?? req.path;
    recordTrace(req.method, path, {
      traceId,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      timestamp: Date.now(),
      requestSize,
      responseSize: parseInt(res.getHeader('content-length') as string ?? '0', 10) || 0,
    });
  });

  next();
}
