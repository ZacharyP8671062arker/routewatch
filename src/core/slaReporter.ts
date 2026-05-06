/**
 * Generates human-readable SLA compliance reports.
 */
import { getAllSlaStatuses } from './endpointSlaTracker';

interface SlaReport {
  generatedAt: string;
  totalEndpoints: number;
  compliantEndpoints: number;
  violatingEndpoints: string[];
  details: Record<string, {
    total: number;
    violations: number;
    slowRequests: number;
    compliant: boolean;
    lastViolationAt: string | null;
  }>;
}

export function generateSlaReport(): SlaReport {
  const statuses = getAllSlaStatuses();
  const keys = Object.keys(statuses);
  const violating: string[] = [];
  const details: SlaReport['details'] = {};

  for (const key of keys) {
    const s = statuses[key];
    if (!s) continue;
    if (!s.compliant) violating.push(key);
    details[key] = {
      total: s.total,
      violations: s.violations,
      slowRequests: s.slowRequests,
      compliant: s.compliant,
      lastViolationAt: s.lastViolationAt
        ? new Date(s.lastViolationAt).toISOString()
        : null,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    totalEndpoints: keys.length,
    compliantEndpoints: keys.length - violating.length,
    violatingEndpoints: violating,
    details,
  };
}

export function hasSlaViolations(): boolean {
  const report = generateSlaReport();
  return report.violatingEndpoints.length > 0;
}

export function formatSlaReportText(report: SlaReport): string {
  const lines: string[] = [
    `SLA Report — ${report.generatedAt}`,
    `Endpoints: ${report.compliantEndpoints}/${report.totalEndpoints} compliant`,
  ];

  if (report.violatingEndpoints.length > 0) {
    lines.push('\nViolating Endpoints:');
    for (const key of report.violatingEndpoints) {
      const d = report.details[key];
      lines.push(
        `  ${key}: ${d.violations} violations, ${d.slowRequests} slow requests (total: ${d.total})`
      );
    }
  } else {
    lines.push('All endpoints are SLA compliant.');
  }

  return lines.join('\n');
}
