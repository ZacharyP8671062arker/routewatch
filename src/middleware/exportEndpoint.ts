import { Request, Response, Router } from 'express';
import { exportDoc, ExportFormat } from '../core/exportFormatter';
import { generateApiDoc } from '../core/docGenerator';

export interface ExportEndpointOptions {
  /** Base path for the export endpoint, defaults to '/__routewatch/export' */
  basePath?: string;
  /** Allowed formats, defaults to all */
  allowedFormats?: ExportFormat[];
}

const DEFAULT_OPTIONS: Required<ExportEndpointOptions> = {
  basePath: '/__routewatch/export',
  allowedFormats: ['json', 'openapi', 'markdown'],
};

export function createExportRouter(options: ExportEndpointOptions = {}): Router {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const router = Router();

  router.get(opts.basePath, (req: Request, res: Response) => {
    const format = (req.query.format as ExportFormat) || 'json';

    if (!opts.allowedFormats.includes(format)) {
      res.status(400).json({
        error: `Unsupported format: ${format}. Allowed: ${opts.allowedFormats.join(', ')}`,
      });
      return;
    }

    try {
      const doc = generateApiDoc();
      const output = exportDoc(doc, format);

      if (format === 'markdown') {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="api-docs.md"');
        res.send(output);
      } else {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (format === 'openapi') {
          res.setHeader('Content-Disposition', 'attachment; filename="openapi.json"');
        }
        res.send(output);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate export' });
    }
  });

  return router;
}
