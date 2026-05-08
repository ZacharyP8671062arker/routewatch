import { getAllEnvironmentEntries, getEndpointsByEnvironment } from './endpointEnvironmentTracker';

export interface EnvironmentReport {
  totalEndpoints: number;
  environments: string[];
  endpointsByEnvironment: Record<string, Array<{ method: string; path: string }>>;
  unassignedEndpoints: number;
}

export function generateEnvironmentReport(): EnvironmentReport {
  const entries = getAllEnvironmentEntries();
  const envSet = new Set<string>();

  for (const entry of entries) {
    for (const env of entry.environments) {
      envSet.add(env);
    }
  }

  const environments = Array.from(envSet).sort();
  const endpointsByEnvironment: Record<string, Array<{ method: string; path: string }>> = {};

  for (const env of environments) {
    endpointsByEnvironment[env] = getEndpointsByEnvironment(env);
  }

  const unassignedEndpoints = entries.filter((e) => e.environments.length === 0).length;

  return {
    totalEndpoints: entries.length,
    environments,
    endpointsByEnvironment,
    unassignedEndpoints,
  };
}

export function hasUnassignedEndpoints(): boolean {
  return getAllEnvironmentEntries().some((e) => e.environments.length === 0);
}

export function formatEnvironmentReportText(report: EnvironmentReport): string {
  const lines: string[] = ['# Environment Report', ''];
  lines.push(`Total Endpoints: ${report.totalEndpoints}`);
  lines.push(`Environments: ${report.environments.join(', ') || 'none'}`);
  lines.push(`Unassigned Endpoints: ${report.unassignedEndpoints}`);
  lines.push('');

  for (const [env, endpoints] of Object.entries(report.endpointsByEnvironment)) {
    lines.push(`## ${env} (${endpoints.length} endpoint(s))`);
    for (const ep of endpoints) {
      lines.push(`  - ${ep.method} ${ep.path}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
