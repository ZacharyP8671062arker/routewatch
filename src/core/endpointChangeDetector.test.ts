import {
  recordSnapshot,
  getChangeLog,
  getSnapshot,
  resetChangeDetector,
} from './endpointChangeDetector';

beforeEach(() => {
  resetChangeDetector();
});

describe('recordSnapshot', () => {
  it('stores a snapshot on first call with no change events', () => {
    const events = recordSnapshot('GET', '/users', { id: 'number' }, { name: 'string' });
    expect(events).toHaveLength(0);
    const snap = getSnapshot('GET', '/users');
    expect(snap).toBeDefined();
    expect(snap?.method).toBe('GET');
    expect(snap?.path).toBe('/users');
  });

  it('detects a requestSchema change', () => {
    recordSnapshot('GET', '/users', { id: 'number' }, { name: 'string' });
    const events = recordSnapshot('GET', '/users', { id: 'number', role: 'string' }, { name: 'string' });
    expect(events).toHaveLength(1);
    expect(events[0].field).toBe('requestSchema');
    expect(events[0].method).toBe('GET');
    expect(events[0].path).toBe('/users');
  });

  it('detects a responseSchema change', () => {
    recordSnapshot('POST', '/items', {}, { id: 'number' });
    const events = recordSnapshot('POST', '/items', {}, { id: 'number', created: 'boolean' });
    expect(events).toHaveLength(1);
    expect(events[0].field).toBe('responseSchema');
  });

  it('detects changes in both schemas simultaneously', () => {
    recordSnapshot('PUT', '/orders', { qty: 'number' }, { ok: 'boolean' });
    const events = recordSnapshot('PUT', '/orders', { qty: 'number', note: 'string' }, { ok: 'boolean', id: 'number' });
    expect(events).toHaveLength(2);
  });

  it('emits no events when schemas are unchanged', () => {
    recordSnapshot('DELETE', '/posts', {}, { deleted: 'boolean' });
    const events = recordSnapshot('DELETE', '/posts', {}, { deleted: 'boolean' });
    expect(events).toHaveLength(0);
  });
});

describe('getChangeLog', () => {
  it('accumulates all change events across calls', () => {
    recordSnapshot('GET', '/a', { x: 'number' }, {});
    recordSnapshot('GET', '/a', { x: 'string' }, {});
    recordSnapshot('GET', '/a', { x: 'boolean' }, {});
    expect(getChangeLog().length).toBeGreaterThanOrEqual(2);
  });

  it('returns a copy so mutations do not affect internal state', () => {
    const log = getChangeLog();
    log.push({} as any);
    expect(getChangeLog()).toHaveLength(0);
  });
});

describe('resetChangeDetector', () => {
  it('clears snapshots and change log', () => {
    recordSnapshot('GET', '/reset', { a: 'number' }, {});
    recordSnapshot('GET', '/reset', { b: 'string' }, {});
    resetChangeDetector();
    expect(getSnapshot('GET', '/reset')).toBeUndefined();
    expect(getChangeLog()).toHaveLength(0);
  });
});
