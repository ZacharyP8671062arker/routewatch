/**
 * Express router that exposes rate limit detection results
 * at a configurable endpoint.
 */

import { Router, Request, Response } from 'express';
import { generateRateLimitReport, formatRateLimitReportText } from '../core/rateLimitReporter';
import { configureRateLimitDetector, RateLimitConfig } from '../core/rateLimitDetector';

export interface RateLimitEndpointOptions {
  path?: string;
  rateLimitConfig?: Partial<RateLimitConfig>;
}

export function createRateLimitRouter(options: RateLimitEndpointOptions = {}): Router {
  const router = Router();
  const endpointPath = options.path ?? '/__routewatch/rate-limits';

  if (options.rateLimitConfig) {
    configureRateLimitDetector(options.rateLimitConfig);
  }

  router.get(endpointPath, (req: Request, res: Response) => {
    const accept = req.headers['accept'] ?? '';
    const report = generateRateLimitReport();

    if (accept.includes('text/plain')) {
      res.setHeader('Content-Type', 'text/plain');
      return res.send(formatRateLimitReportText(report));
    }

    res.setHeader('Content-Type', 'application/json');
    return res.json(report);
  });

  return router;
}
