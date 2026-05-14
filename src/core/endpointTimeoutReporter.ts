import { getAllTimeoutStats, TimeoutStats } from './endpointTimeoutTracker';

export interface TimeoutReport {
  totalEndpoints: number;
  timedOutEndpoints: number;
  cleanEndpoints: number;
  entries: Array<{
    method: string;
    path: string;
    stats: TimeoutStats;
    violated: boolean;
  }>;
}

export function generateTimeoutReport(): TimeoutReport {
  const all = getAllTimeoutStats();
  const entries: TimeoutReport['entries'] = [];

  for (const [key, stats] of Object.entries(all)) {
    const [method, path] = key.split(':');
    const violated = stats.timeoutCount > 0;
    entries.push({ method, path, stats, violated });
  }

  const timedOutEndpoints = entries.filter((e) => e.violated).length;

  return {
    totalEndpoints: entries.length,
    timedOutEndpoints,
    cleanEndpoints: entries.length - timedOutEndpoints,
    entries,
  };
}

export function hasTimeoutViolations(): boolean {
  const report = generateTimeoutReport();
  return report.timedOutEndpoints > 0;
}

export function formatTimeoutReportText(): string {
  const report = generateTimeoutReport();
  const lines: string[] = [
    '=== Endpoint Timeout Report ===',
    `Total Endpoints : ${report.totalEndpoints}`,
    `Timed Out       : ${report.timedOutEndpoints}`,
    `Clean           : ${report.cleanEndpoints}`,
    '',
  ];

  for (const entry of report.entries) {
    const { method, path, stats, violated } = entry;
    const status = violated ? '⚠ TIMEOUT' : '✓ OK';
    lines.push(
      `[${status}] ${method.toUpperCase()} ${path}`,
      `  Requests: ${stats.totalRequests} | Timeouts: ${stats.timeoutCount} | Rate: ${(
        (stats.timeoutCount / Math.max(stats.totalRequests, 1)) *
        100
      ).toFixed(1)}% | Budget: ${stats.budgetMs}ms`,
      ''
    );
  }

  return lines.join('\n');
}
