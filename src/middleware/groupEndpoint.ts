import { Router, Request, Response } from 'express';
import {
  assignGroup,
  removeGroup,
  getGroup,
  getEndpointsByGroup,
  getAllGroups,
  clearGroupRegistry,
} from '../core/endpointGroupRegistry';

export function createGroupRouter(): Router {
  const router = Router();

  // GET all groups
  router.get('/groups', (_req: Request, res: Response) => {
    const groups = getAllGroups();
    const result: Record<string, Array<{ method: string; path: string }>> = {};
    for (const group of groups) {
      result[group] = getEndpointsByGroup(group);
    }
    res.json({ groups: result });
  });

  // GET endpoints for a specific group
  router.get('/groups/:group', (req: Request, res: Response) => {
    const { group } = req.params;
    const endpoints = getEndpointsByGroup(group);
    if (endpoints.length === 0) {
      res.status(404).json({ error: `Group '${group}' not found or empty` });
      return;
    }
    res.json({ group, endpoints });
  });

  // GET group for a specific endpoint
  router.get('/groups/endpoint/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const group = getGroup(method.toUpperCase(), `/${path}`);
    if (!group) {
      res.status(404).json({ error: 'No group assigned to this endpoint' });
      return;
    }
    res.json({ method: method.toUpperCase(), path: `/${path}`, group });
  });

  // POST assign group to endpoint
  router.post('/groups/assign', (req: Request, res: Response) => {
    const { method, path, group } = req.body;
    if (!method || !path || !group) {
      res.status(400).json({ error: 'method, path, and group are required' });
      return;
    }
    assignGroup(method.toUpperCase(), path, group);
    res.json({ success: true, method: method.toUpperCase(), path, group });
  });

  // DELETE remove group from endpoint
  router.delete('/groups/endpoint/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    removeGroup(method.toUpperCase(), `/${path}`);
    res.json({ success: true });
  });

  // DELETE clear all groups (dev/test utility)
  router.delete('/groups', (_req: Request, res: Response) => {
    clearGroupRegistry();
    res.json({ success: true });
  });

  return router;
}
