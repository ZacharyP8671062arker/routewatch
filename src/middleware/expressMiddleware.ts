import { Request, Response, NextFunction } from 'express';
import { RouteCollector } from '../core/routeCollector';
import { TrafficSampler } from '../core/trafficSampler';
import { renderHtml, renderJson } from '../ui/docRenderer';

export interface RouteWatchOptions {
  docsPath?: string;
  maxSamples?: number;
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<RouteWatchOptions> = {
  docsPath: '/__routewatch',
  maxSamples: 10,
  enabled: true,
};

export function routeWatch(options: RouteWatchOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!opts.enabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  const collector = new RouteCollector();
  const sampler = new TrafficSampler(opts.maxSamples);

  return function routeWatchMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Serve docs UI
    if (req.path === opts.docsPath) {
      const accept = req.headers['accept'] ?? '';
      const routes = collector.getRoutes();
      if (accept.includes('application/json')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(renderJson(routes));
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.end(renderHtml(routes));
      }
      return;
    }

    const startTime = Date.now();

    res.on('finish', () => {
      const method = req.method.toUpperCase();
      const path = req.route?.path ?? req.path;
      const statusCode = res.statusCode;
      const duration = Date.now() - startTime;

      const sample = sampler.record(method, path, {
        requestBody: req.body,
        queryParams: req.query,
        statusCode,
        duration,
      });

      collector.collect(method, path, sample);
    });

    next();
  };
}
