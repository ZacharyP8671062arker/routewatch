import {
  getAllCompliances,
  getNonCompliantEndpoints,
  getEndpointsByStandard,
  ComplianceEntry,
  ComplianceStandard,
} from './endpointComplianceTracker';

export interface ComplianceReport {
  total: number;
  compliant: number;
  nonCompliant: number;
  byStandard: Record<ComplianceStandard, { total: number; compliant: number }>;
  violations: ComplianceEntry[];
}

export function generateComplianceReport(): ComplianceReport {
  const all = getAllCompliances();
  const violations = getNonCompliantEndpoints();

  const standards = Array.from(new Set(all.flatMap((e) => e.standards)));
  const byStandard: Record<string, { total: number; compliant: number }> = {};

  for (const std of standards) {
    const entries = getEndpointsByStandard(std);
    byStandard[std] = {
      total: entries.length,
      compliant: entries.filter((e) => e.compliant).length,
    };
  }

  return {
    total: all.length,
    compliant: all.length - violations.length,
    nonCompliant: violations.length,
    byStandard,
    violations,
  };
}

export function hasComplianceViolations(): boolean {
  return getNonCompliantEndpoints().length > 0;
}

export function formatComplianceReportText(report: ComplianceReport): string {
  const lines: string[] = [
    `Compliance Report`,
    `=================`,
    `Total endpoints tracked : ${report.total}`,
    `Compliant               : ${report.compliant}`,
    `Non-compliant           : ${report.nonCompliant}`,
    '',
    'By Standard:',
  ];

  for (const [std, stats] of Object.entries(report.byStandard)) {
    lines.push(`  ${std}: ${stats.compliant}/${stats.total} compliant`);
  }

  if (report.violations.length > 0) {
    lines.push('', 'Violations:');
    for (const v of report.violations) {
      const note = v.notes ? ` (${v.notes})` : '';
      lines.push(`  [${v.method}] ${v.path} — ${v.standards.join(', ')}${note}`);
    }
  }

  return lines.join('\n');
}
