/**
 * Detects schema changes for endpoints over time.
 * Compares current inferred schema against a previously stored baseline.
 */

import { mergeSchemas } from './schemaInferrer';

export interface SchemaSnapshot {
  method: string;
  path: string;
  requestSchema: Record<string, unknown>;
  responseSchema: Record<string, unknown>;
  capturedAt: number;
}

export interface ChangeEvent {
  method: string;
  path: string;
  field: 'requestSchema' | 'responseSchema';
  previous: Record<string, unknown>;
  current: Record<string, unknown>;
  detectedAt: number;
}

const snapshots = new Map<string, SchemaSnapshot>();
const changeLog: ChangeEvent[] = [];

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

function schemasEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function recordSnapshot(
  method: string,
  path: string,
  requestSchema: Record<string, unknown>,
  responseSchema: Record<string, unknown>
): ChangeEvent[] {
  const key = makeKey(method, path);
  const now = Date.now();
  const detected: ChangeEvent[] = [];

  const existing = snapshots.get(key);
  if (existing) {
    for (const field of ['requestSchema', 'responseSchema'] as const) {
      if (!schemasEqual(existing[field], field === 'requestSchema' ? requestSchema : responseSchema)) {
        const event: ChangeEvent = {
          method,
          path,
          field,
          previous: existing[field],
          current: field === 'requestSchema' ? requestSchema : responseSchema,
          detectedAt: now,
        };
        changeLog.push(event);
        detected.push(event);
      }
    }
  }

  snapshots.set(key, { method, path, requestSchema, responseSchema, capturedAt: now });
  return detected;
}

export function getChangeLog(): ChangeEvent[] {
  return [...changeLog];
}

export function getSnapshot(method: string, path: string): SchemaSnapshot | undefined {
  return snapshots.get(makeKey(method, path));
}

export function resetChangeDetector(): void {
  snapshots.clear();
  changeLog.length = 0;
}
