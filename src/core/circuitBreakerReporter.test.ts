import { resetCircuitBreaker, recordCircuitRequest, configureCircuitBreaker } from './endpointCircuitBreaker';
import {
  generateCircuitBreakerReport,
  hasOpenCircuits,
  formatCircuitBreakerReportText,
} from './circuitBreakerReporter';

beforeEach(() => {
  resetCircuitBreaker();
});

describe('generateCircuitBreakerReport', () => {
  it('returns zeroes when no data', () => {
    const report = generateCircuitBreakerReport();
    expect(report.total).toBe(0);
    expect(report.open).toBe(0);
  });

  it('counts states correctly', () => {
    configureCircuitBreaker({ failureThreshold: 1, timeoutMs: 60_000 });
    recordCircuitRequest('GET', '/a', true);   // closed
    recordCircuitRequest('POST', '/b', false); // open
    const report = generateCircuitBreakerReport();
    expect(report.total).toBe(2);
    expect(report.closed).toBe(1);
    expect(report.open).toBe(1);
  });

  it('includes endpoint details', () => {
    recordCircuitRequest('GET', '/ping', true);
    const report = generateCircuitBreakerReport();
    expect(report.endpoints[0].path).toBe('/ping');
  });
});

describe('hasOpenCircuits', () => {
  it('returns false when all closed', () => {
    recordCircuitRequest('GET', '/ok', true);
    expect(hasOpenCircuits()).toBe(false);
  });

  it('returns true when a circuit is open', () => {
    configureCircuitBreaker({ failureThreshold: 1 });
    recordCircuitRequest('GET', '/bad', false);
    expect(hasOpenCircuits()).toBe(true);
  });
});

describe('formatCircuitBreakerReportText', () => {
  it('includes header and summary line', () => {
    const report = generateCircuitBreakerReport();
    const text = formatCircuitBreakerReportText(report);
    expect(text).toContain('# Circuit Breaker Report');
    expect(text).toContain('Total: 0');
  });

  it('lists endpoint states', () => {
    configureCircuitBreaker({ failureThreshold: 1 });
    recordCircuitRequest('DELETE', '/item', false);
    const report = generateCircuitBreakerReport();
    const text = formatCircuitBreakerReportText(report);
    expect(text).toContain('OPEN');
    expect(text).toContain('DELETE /item');
  });
});
