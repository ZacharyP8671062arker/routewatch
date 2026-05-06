import { Router, Request, Response } from "express";
import {
  assignOwner,
  removeOwner,
  getOwner,
  getAllOwners,
  getEndpointsByOwner,
  getEndpointsByTeam,
} from "../core/endpointOwnerRegistry";

/**
 * Creates an Express router exposing owner-management endpoints.
 * Mount with: app.use('/_routewatch/owners', createOwnerRouter())
 */
export function createOwnerRouter(): Router {
  const router = Router();

  // GET all owners
  router.get("/", (_req: Request, res: Response) => {
    res.json(getAllOwners());
  });

  // GET owner for a specific endpoint  ?method=GET&path=/users
  router.get("/lookup", (req: Request, res: Response) => {
    const { method, path: routePath } = req.query as Record<string, string>;
    if (!method || !routePath) {
      return res.status(400).json({ error: "method and path query params required" });
    }
    const entry = getOwner(method, routePath);
    if (!entry) {
      return res.status(404).json({ error: "No owner registered for this endpoint" });
    }
    res.json(entry);
  });

  // GET endpoints by owner  ?owner=alice
  router.get("/by-owner", (req: Request, res: Response) => {
    const { owner } = req.query as Record<string, string>;
    if (!owner) return res.status(400).json({ error: "owner query param required" });
    res.json(getEndpointsByOwner(owner));
  });

  // GET endpoints by team  ?team=platform
  router.get("/by-team", (req: Request, res: Response) => {
    const { team } = req.query as Record<string, string>;
    if (!team) return res.status(400).json({ error: "team query param required" });
    res.json(getEndpointsByTeam(team));
  });

  // POST assign owner  { method, path, owner, team?, contact? }
  router.post("/", (req: Request, res: Response) => {
    const { method, path: routePath, owner, team, contact } = req.body ?? {};
    if (!method || !routePath || !owner) {
      return res.status(400).json({ error: "method, path, and owner are required" });
    }
    assignOwner(method, routePath, owner, team, contact);
    res.status(201).json({ message: "Owner assigned", key: `${method.toUpperCase()}:${routePath}` });
  });

  // DELETE remove owner  ?method=GET&path=/users
  router.delete("/", (req: Request, res: Response) => {
    const { method, path: routePath } = req.query as Record<string, string>;
    if (!method || !routePath) {
      return res.status(400).json({ error: "method and path query params required" });
    }
    const removed = removeOwner(method, routePath);
    if (!removed) return res.status(404).json({ error: "Owner entry not found" });
    res.json({ message: "Owner removed" });
  });

  return router;
}
