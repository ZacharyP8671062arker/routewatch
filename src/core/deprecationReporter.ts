/**
 * deprecationReporter.ts
 * Generates deprecation summary reports from route traffic data.
 */

import {
  getDeprecationStatus,
  getAllDeprecations,
  DeprecationStatus,
} from './endpointDeprecator';

export interface RouteAgeEntry {
  method: string;
  path: string;
  lastSeenAt: Date;
}

export interface DeprecationReportEntry {
  method: string;
  path: string;
  status: DeprecationStatus;
  lastSeenAt: Date;
  reason?: string;
  sunsetAt?: Date;
}

export interface DeprecationReport {
  generatedAt: Date;
  total: number;
  byStatus: Record<DeprecationStatus, number>;
  entries: DeprecationReportEntry[];
}

export function generateDeprecationReport(
  routes: RouteAgeEntry[]
): DeprecationReport {
  const manualEntries = getAllDeprecations();
  const manualMap = new Map(
    manualEntries.map((e) => [`${e.method}:${e.path}`, e])
  );

  const entries: DeprecationReportEntry[] = routes.map((r) => {
    const status = getDeprecationStatus(r.method, r.path, r.lastSeenAt);
    const manual = manualMap.get(`${r.method}:${r.path}`);
    return {
      method: r.method,
      path: r.path,
      status,
      lastSeenAt: r.lastSeenAt,
      reason: manual?.reason,
      sunsetAt: manual?.sunsetAt,
    };
  });

  const byStatus: Record<DeprecationStatus, number> = {
    active: 0,
    warning: 0,
    deprecated: 0,
    sunset: 0,
  };

  for (const entry of entries) {
    byStatus[entry.status]++;
  }

  return {
    generatedAt: new Date(),
    total: entries.length,
    byStatus,
    entries,
  };
}

export function hasDeprecationViolations(report: DeprecationReport): boolean {
  return report.byStatus.deprecated > 0 || report.byStatus.sunset > 0;
}

export function formatDeprecationReportText(report: DeprecationReport): string {
  const lines: string[] = [
    `Deprecation Report — ${report.generatedAt.toISOString()}`,
    `Total routes: ${report.total}`,
    `Active: ${report.byStatus.active} | Warning: ${report.byStatus.warning} | Deprecated: ${report.byStatus.deprecated} | Sunset: ${report.byStatus.sunset}`,
    '',
  ];
  for (const e of report.entries.filter((e) => e.status !== 'active')) {
    lines.push(
      `[${e.status.toUpperCase()}] ${e.method} ${e.path}${
        e.reason ? ` — ${e.reason}` : ''
      }${
        e.sunsetAt ? ` (sunset: ${e.sunsetAt.toISOString()})` : ''
      }`
    );
  }
  return lines.join('\n');
}
