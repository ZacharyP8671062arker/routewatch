/**
 * Endpoint Notes Registry
 * Allows attaching free-form notes/comments to API endpoints.
 */

type NoteEntry = {
  note: string;
  createdAt: number;
  updatedAt: number;
};

const notesStore = new Map<string, NoteEntry>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function setNote(method: string, path: string, note: string): void {
  const key = makeKey(method, path);
  const existing = notesStore.get(key);
  const now = Date.now();
  notesStore.set(key, {
    note,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  });
}

export function getNote(method: string, path: string): NoteEntry | undefined {
  return notesStore.get(makeKey(method, path));
}

export function removeNote(method: string, path: string): boolean {
  return notesStore.delete(makeKey(method, path));
}

export function getAllNotes(): Record<string, NoteEntry> {
  const result: Record<string, NoteEntry> = {};
  for (const [key, entry] of notesStore.entries()) {
    result[key] = entry;
  }
  return result;
}

export function hasNote(method: string, path: string): boolean {
  return notesStore.has(makeKey(method, path));
}

export function resetNotesRegistry(): void {
  notesStore.clear();
}
