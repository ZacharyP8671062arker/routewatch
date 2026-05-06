import { Router, Request, Response } from 'express';
import {
  setNote,
  getNote,
  removeNote,
  getAllNotes,
} from '../core/endpointNotesRegistry';

/**
 * Creates an Express router exposing CRUD endpoints for endpoint notes.
 */
export function createNotesRouter(): Router {
  const router = Router();

  // GET all notes
  router.get('/', (_req: Request, res: Response) => {
    res.json(getAllNotes());
  });

  // GET note for a specific endpoint
  router.get('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const entry = getNote(method, `/${path}`);
    if (!entry) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(entry);
  });

  // PUT (upsert) a note for a specific endpoint
  router.put('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const { note } = req.body as { note?: string };
    if (typeof note !== 'string' || note.trim() === '') {
      return res.status(400).json({ error: '"note" field is required and must be a non-empty string' });
    }
    setNote(method, `/${path}`, note.trim());
    const entry = getNote(method, `/${path}`)!;
    res.status(200).json(entry);
  });

  // DELETE a note for a specific endpoint
  router.delete('/:method/:path(*)', (req: Request, res: Response) => {
    const { method, path } = req.params;
    const removed = removeNote(method, `/${path}`);
    if (!removed) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(204).send();
  });

  return router;
}
