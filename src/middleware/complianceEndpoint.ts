import { Router, Request, Response } from 'express';
import {
  assignCompliance,
  removeCompliance,
  getAllCompliances,
  getCompliance,
  ComplianceStandard,
} from '../core/endpointComplianceTracker';
import {
  generateComplianceReport,
  formatComplianceReportText,
} from '../core/complianceReporter';

export function createComplianceRouter(): Router {
  const router = Router();

  // GET /routewatch/compliance — full report
  router.get('/', (_req: Request, res: Response) => {
    const report = generateComplianceReport();
    res.json(report);
  });

  // GET /routewatch/compliance/text — plain-text report
  router.get('/text', (_req: Request, res: Response) => {
    const report = generateComplianceReport();
    res.type('text/plain').send(formatComplianceReportText(report));
  });

  // GET /routewatch/compliance/all — list all entries
  router.get('/all', (_req: Request, res: Response) => {
    res.json(getAllCompliances());
  });

  // GET /routewatch/compliance/:method/:path(*)
  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const path = '/' + (req.params as Record<string, string>)[0];
    const entry = getCompliance(method, path);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json(entry);
  });

  // POST /routewatch/compliance — assign compliance
  router.post('/', (req: Request, res: Response) => {
    const { method, path, standards, compliant, notes } = req.body as {
      method: string;
      path: string;
      standards: ComplianceStandard[];
      compliant: boolean;
      notes?: string;
    };
    if (!method || !path || !Array.isArray(standards) || typeof compliant !== 'boolean') {
      return res.status(400).json({ error: 'method, path, standards[], and compliant are required' });
    }
    assignCompliance(method, path, standards, compliant, notes);
    res.status(201).json({ ok: true });
  });

  // DELETE /routewatch/compliance/:method/:path(*)
  router.delete('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const path = '/' + (req.params as Record<string, string>)[0];
    const removed = removeCompliance(method, path);
    if (!removed) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });

  return router;
}
