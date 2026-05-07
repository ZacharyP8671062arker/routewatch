/**
 * Visibility Reporter
 * Generates summary reports of endpoint visibility levels.
 */

import {
  getAllVisibilities,
  getEndpointsByVisibility,
  VisibilityEntry,
  VisibilityLevel,
} from './endpointVisibilityRegistry';

export interface VisibilityReport {
  total: number;
  public: VisibilityEntry[];
  internal: VisibilityEntry[];
  hidden: VisibilityEntry[];
  summary: Record<VisibilityLevel, number>;
}

export function generateVisibilityReport(): VisibilityReport {
  const all = getAllVisibilities();
  const pub = getEndpointsByVisibility('public');
  const internal = getEndpointsByVisibility('internal');
  const hidden = getEndpointsByVisibility('hidden');

  return {
    total: all.length,
    public: pub,
    internal,
    hidden,
    summary: {
      public: pub.length,
      internal: internal.length,
      hidden: hidden.length,
    },
  };
}

export function hasHiddenEndpoints(): boolean {
  return getEndpointsByVisibility('hidden').length > 0;
}

export function formatVisibilityReportText(report: VisibilityReport): string {
  const lines: string[] = [
    `Endpoint Visibility Report`,
    `==========================`,
    `Total tracked: ${report.total}`,
    `  Public:   ${report.summary.public}`,
    `  Internal: ${report.summary.internal}`,
    `  Hidden:   ${report.summary.hidden}`,
  ];

  if (report.hidden.length > 0) {
    lines.push('', 'Hidden Endpoints:');
    report.hidden.forEach((e) => lines.push(`  [${e.method}] ${e.path}`));
  }

  if (report.internal.length > 0) {
    lines.push('', 'Internal Endpoints:');
    report.internal.forEach((e) => lines.push(`  [${e.method}] ${e.path}`));
  }

  return lines.join('\n');
}
