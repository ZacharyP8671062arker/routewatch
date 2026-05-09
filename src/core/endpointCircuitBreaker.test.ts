import {
  configureCircuitBreaker,
  resetCircuitBreaker,
  recordCircuitRequest,
  getCircuitStatus,
  getAllCircuitStatuses,
  makeKey,
} from './endpointCircuitBreaker';

beforeEach(() => {
  resetCircuitBreaker();
});

describe('makeKey', () => {
  it('normalises method to uppercase', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
  });
});

describe('recordCircuitRequest', () => {
  it('starts in closed state', () => {
    recordCircuitRequest('GET', '/users', true);
    expect(getCircuitStatus('GET', '/users')?.state).toBe('closed');
  });

  it('opens circuit after failure threshold', () => {
    configureCircuitBreaker({ failureThreshold: 3 });
    for (let i = 0; i < 3; i++) recordCircuitRequest('GET', '/users', false);
    expect(getCircuitStatus('GET', '/users')?.state).toBe('open');
  });

  it('does not open before threshold', () => {
    configureCircuitBreaker({ failureThreshold: 3 });
    for (let i = 0; i < 2; i++) recordCircuitRequest('GET', '/users', false);
    expect(getCircuitStatus('GET', '/users')?.state).toBe('closed');
  });

  it('ignores requests while open and timeout not elapsed', () => {
    configureCircuitBreaker({ failureThreshold: 1, timeoutMs: 60_000 });
    recordCircuitRequest('GET', '/users', false);
    const before = getCircuitStatus('GET', '/users')!.failures;
    recordCircuitRequest('GET', '/users', false);
    expect(getCircuitStatus('GET', '/users')!.failures).toBe(before);
  });

  it('moves to half-open after timeout', () => {
    configureCircuitBreaker({ failureThreshold: 1, timeoutMs: 0 });
    recordCircuitRequest('GET', '/users', false);
    recordCircuitRequest('GET', '/users', true);
    expect(getCircuitStatus('GET', '/users')?.state).toBe('half-open');
  });

  it('closes circuit from half-open after success threshold', () => {
    configureCircuitBreaker({ failureThreshold: 1, timeoutMs: 0, successThreshold: 2 });
    recordCircuitRequest('GET', '/users', false);
    recordCircuitRequest('GET', '/users', true); // half-open
    recordCircuitRequest('GET', '/users', true); // closed
    expect(getCircuitStatus('GET', '/users')?.state).toBe('closed');
  });

  it('re-opens from half-open on failure', () => {
    configureCircuitBreaker({ failureThreshold: 1, timeoutMs: 0, successThreshold: 3 });
    recordCircuitRequest('GET', '/users', false);
    recordCircuitRequest('GET', '/users', false); // re-opens
    expect(getCircuitStatus('GET', '/users')?.state).toBe('open');
  });
});

describe('getAllCircuitStatuses', () => {
  it('returns all tracked endpoints', () => {
    recordCircuitRequest('GET', '/a', true);
    recordCircuitRequest('POST', '/b', false);
    expect(getAllCircuitStatuses()).toHaveLength(2);
  });
});
