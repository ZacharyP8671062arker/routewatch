import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RouteCollector } from '../core/routeCollector';
import { TrafficSampler } from '../core/trafficSampler';
import { renderHtml, renderJson } from '../ui/docRenderer';

export interface RouteWatchFastifyOptions {
  path?: string;
  maxSamples?: number;
  format?: 'html' | 'json';
}

const defaultOptions: Required<RouteWatchFastifyOptions> = {
  path: '/__routewatch',
  maxSamples: 10,
  format: 'html',
};

export function routeWatchFastify(
  fastify: FastifyInstance,
  options: RouteWatchFastifyOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const collector = new RouteCollector();
  const sampler = new TrafficSampler(opts.maxSamples);

  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      (request as any)._routeWatchStart = Date.now();
    }
  );

  fastify.addHook(
    'onSend',
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      const routePath = request.routerPath ?? request.url;

      if (routePath === opts.path) return payload;

      const method = request.method.toUpperCase();
      const statusCode = reply.statusCode;
      const durationMs = Date.now() - ((request as any)._routeWatchStart ?? Date.now());

      let requestBody: unknown = request.body;
      let responseBody: unknown;
      try {
        responseBody = typeof payload === 'string' ? JSON.parse(payload) : payload;
      } catch {
        responseBody = undefined;
      }

      sampler.record(method, routePath, statusCode, durationMs, requestBody, responseBody);
      collector.collect(method, routePath, sampler.getSamples(method, routePath));

      return payload;
    }
  );

  fastify.get(opts.path, async (_request: FastifyRequest, reply: FastifyReply) => {
    const routes = collector.getRoutes();
    if (opts.format === 'json') {
      reply.header('Content-Type', 'application/json');
      return reply.send(renderJson(routes));
    }
    reply.header('Content-Type', 'text/html');
    return reply.send(renderHtml(routes));
  });
}
