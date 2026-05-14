import { getAllVersions, getEndpointsByVersion } from './endpointVersionTracker';

export interface VersionReport {
  totalEndpoints: number;
  versionedEndpoints: number;
  unversionedEndpoints: number;
  versionSummary: Record<string, string[]>;
  endpointDetails: Record<string, string[]>;
}

export function generateVersionReport(allEndpointKeys: string[]): VersionReport {
  const endpointDetails = getAllVersions();
  const versionSummary: Record<string, string[]> = {};

  for (const [key, versions] of Object.entries(endpointDetails)) {
    for (const v of versions) {
      if (!versionSummary[v]) versionSummary[v] = [];
      versionSummary[v].push(key);
    }
  }

  const versionedKeys = new Set(Object.keys(endpointDetails).filter((k) => endpointDetails[k].length > 0));
  const unversionedEndpoints = allEndpointKeys.filter((k) => !versionedKeys.has(k)).length;

  return {
    totalEndpoints: allEndpointKeys.length,
    versionedEndpoints: versionedKeys.size,
    unversionedEndpoints,
    versionSummary,
    endpointDetails,
  };
}

export function hasUnversionedEndpoints(allEndpointKeys: string[]): boolean {
  const report = generateVersionReport(allEndpointKeys);
  return report.unversionedEndpoints > 0;
}

export function formatVersionReportText(report: VersionReport): string {
  const lines: string[] = [
    `Version Report`,
    `==============`,
    `Total Endpoints  : ${report.totalEndpoints}`,
    `Versioned        : ${report.versionedEndpoints}`,
    `Unversioned      : ${report.unversionedEndpoints}`,
    ``,
    `Versions:`,
  ];

  for (const [version, endpoints] of Object.entries(report.versionSummary)) {
    lines.push(`  ${version}: ${endpoints.join(', ')}`);
  }

  return lines.join('\n');
}
