import { getAllCircuitStatuses, CircuitBreakerStatus } from './endpointCircuitBreaker';

export interface CircuitBreakerReport {
  total: number;
  open: number;
  halfOpen: number;
  closed: number;
  endpoints: CircuitBreakerStatus[];
}

export function generateCircuitBreakerReport(): CircuitBreakerReport {
  const all = getAllCircuitStatuses();
  return {
    total: all.length,
    open: all.filter((s) => s.state === 'open').length,
    halfOpen: all.filter((s) => s.state === 'half-open').length,
    closed: all.filter((s) => s.state === 'closed').length,
    endpoints: all,
  };
}

export function hasOpenCircuits(): boolean {
  return getAllCircuitStatuses().some((s) => s.state === 'open');
}

export function formatCircuitBreakerReportText(report: CircuitBreakerReport): string {
  const lines: string[] = [
    '# Circuit Breaker Report',
    `Total: ${report.total} | Open: ${report.open} | Half-Open: ${report.halfOpen} | Closed: ${report.closed}`,
    '',
  ];

  for (const ep of report.endpoints) {
    const last = ep.lastFailureAt ? new Date(ep.lastFailureAt).toISOString() : 'never';
    lines.push(
      `[${ep.state.toUpperCase().padEnd(9)}] ${ep.method} ${ep.path}` +
        ` | failures: ${ep.failures} | last failure: ${last}`
    );
  }

  return lines.join('\n');
}
