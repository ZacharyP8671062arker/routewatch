/**
 * tagEndpoint.ts
 * Express router that exposes endpoints for viewing and managing endpoint tags.
 */

import { Router, Request, Response } from "express";
import { addTag, removeTag, getTags, clearTags } from "../core/endpointTagManager";
import { generateTagReport, formatTagReportText } from "../core/tagReporter";

export function createTagRouter(): Router {
  const router = Router();

  // GET /tags — return full tag report as JSON
  router.get("/tags", (_req: Request, res: Response) => {
    const report = generateTagReport();
    res.json(report);
  });

  // GET /tags/text — return human-readable tag report
  router.get("/tags/text", (_req: Request, res: Response) => {
    const report = generateTagReport();
    res.type("text/plain").send(formatTagReportText(report));
  });

  // GET /tags/:method/:path — get tags for a specific endpoint
  router.get("/tags/:method/*", (req: Request, res: Response) => {
    const method = req.params.method;
    const path = "/" + (req.params as Record<string, string>)["0"];
    const tags = getTags(method, path);
    res.json({ method: method.toUpperCase(), path, tags });
  });

  // POST /tags — add a tag { method, path, tag }
  router.post("/tags", (req: Request, res: Response) => {
    const { method, path, tag } = req.body ?? {};
    if (!method || !path || !tag) {
      return res.status(400).json({ error: "method, path, and tag are required" });
    }
    addTag(method, path, tag);
    res.status(201).json({ method: method.toUpperCase(), path, tag });
  });

  // DELETE /tags — remove a tag { method, path, tag }
  router.delete("/tags", (req: Request, res: Response) => {
    const { method, path, tag } = req.body ?? {};
    if (!method || !path || !tag) {
      return res.status(400).json({ error: "method, path, and tag are required" });
    }
    removeTag(method, path, tag);
    res.status(200).json({ removed: true });
  });

  // DELETE /tags/all — clear all tags
  router.delete("/tags/all", (_req: Request, res: Response) => {
    clearTags();
    res.status(200).json({ cleared: true });
  });

  return router;
}
