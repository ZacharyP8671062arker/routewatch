/**
 * Tracks compliance status for endpoints (e.g. GDPR, HIPAA, PCI-DSS).
 */

export type ComplianceStandard = 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'SOC2' | string;

export interface ComplianceEntry {
  method: string;
  path: string;
  standards: ComplianceStandard[];
  compliant: boolean;
  notes?: string;
  updatedAt: string;
}

const registry = new Map<string, ComplianceEntry>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function assignCompliance(
  method: string,
  path: string,
  standards: ComplianceStandard[],
  compliant: boolean,
  notes?: string
): void {
  const key = makeKey(method, path);
  registry.set(key, {
    method: method.toUpperCase(),
    path,
    standards,
    compliant,
    notes,
    updatedAt: new Date().toISOString(),
  });
}

export function removeCompliance(method: string, path: string): boolean {
  return registry.delete(makeKey(method, path));
}

export function getCompliance(method: string, path: string): ComplianceEntry | undefined {
  return registry.get(makeKey(method, path));
}

export function getAllCompliances(): ComplianceEntry[] {
  return Array.from(registry.values());
}

export function getNonCompliantEndpoints(): ComplianceEntry[] {
  return getAllCompliances().filter((e) => !e.compliant);
}

export function getEndpointsByStandard(standard: ComplianceStandard): ComplianceEntry[] {
  return getAllCompliances().filter((e) => e.standards.includes(standard));
}

export function resetComplianceTracker(): void {
  registry.clear();
}
