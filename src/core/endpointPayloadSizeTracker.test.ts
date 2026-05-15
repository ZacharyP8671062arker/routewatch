import {
  configurePayloadSize,
  resetPayloadSizeTracker,
  recordPayload,
  getPayloadSizeStats,
  getAllPayloadSizeStats,
  makeKey,
} from './endpointPayloadSizeTracker';

beforeEach(() => {
  resetPayloadSizeTracker();
});

describe('makeKey', () => {
  it('combines method and path', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
  });

  it('uppercases method', () => {
    expect(makeKey('post', '/items')).toBe('POST:/items');
  });
});

describe('recordPayload + getPayloadSizeStats', () => {
  it('returns null when no data recorded', () => {
    expect(getPayloadSizeStats('GET', '/missing')).toBeNull();
  });

  it('records and computes averages correctly', () => {
    recordPayload('GET', '/users', 100, 500);
    recordPayload('GET', '/users', 200, 1000);
    const stats = getPayloadSizeStats('GET', '/users');
    expect(stats).not.toBeNull();
    expect(stats!.avgRequestBytes).toBe(150);
    expect(stats!.avgResponseBytes).toBe(750);
    expect(stats!.maxRequestBytes).toBe(200);
    expect(stats!.maxResponseBytes).toBe(1000);
    expect(stats!.sampleCount).toBe(2);
  });

  it('reports zero violations when no config set', () => {
    recordPayload('POST', '/data', 9999, 9999);
    const stats = getPayloadSizeStats('POST', '/data');
    expect(stats!.requestViolations).toBe(0);
    expect(stats!.responseViolations).toBe(0);
  });
});

describe('configurePayloadSize + violations', () => {
  it('counts request violations', () => {
    configurePayloadSize('POST', '/upload', { maxRequestBytes: 500 });
    recordPayload('POST', '/upload', 400, 100);
    recordPayload('POST', '/upload', 600, 100);
    recordPayload('POST', '/upload', 700, 100);
    const stats = getPayloadSizeStats('POST', '/upload');
    expect(stats!.requestViolations).toBe(2);
  });

  it('counts response violations', () => {
    configurePayloadSize('GET', '/big', { maxResponseBytes: 1000 });
    recordPayload('GET', '/big', 50, 800);
    recordPayload('GET', '/big', 50, 1200);
    const stats = getPayloadSizeStats('GET', '/big');
    expect(stats!.responseViolations).toBe(1);
  });
});

describe('getAllPayloadSizeStats', () => {
  it('returns empty array when nothing recorded', () => {
    expect(getAllPayloadSizeStats()).toEqual([]);
  });

  it('returns stats for all recorded endpoints', () => {
    recordPayload('GET', '/a', 100, 200);
    recordPayload('POST', '/b', 300, 400);
    const all = getAllPayloadSizeStats();
    expect(all).toHaveLength(2);
    const paths = all.map(s => s.path);
    expect(paths).toContain('/a');
    expect(paths).toContain('/b');
  });
});
