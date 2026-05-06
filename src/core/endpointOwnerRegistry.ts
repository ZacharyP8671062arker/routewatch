/**
 * Endpoint Owner Registry
 * Tracks ownership (team/person) for API endpoints.
 */

type OwnerEntry = {
  owner: string;
  team?: string;
  contact?: string;
  assignedAt: number;
};

const ownerMap = new Map<string, OwnerEntry>();

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function assignOwner(
  method: string,
  path: string,
  owner: string,
  team?: string,
  contact?: string
): void {
  const key = makeKey(method, path);
  ownerMap.set(key, { owner, team, contact, assignedAt: Date.now() });
}

export function removeOwner(method: string, path: string): boolean {
  const key = makeKey(method, path);
  return ownerMap.delete(key);
}

export function getOwner(method: string, path: string): OwnerEntry | undefined {
  return ownerMap.get(makeKey(method, path));
}

export function getAllOwners(): Record<string, OwnerEntry> {
  const result: Record<string, OwnerEntry> = {};
  for (const [key, entry] of ownerMap.entries()) {
    result[key] = entry;
  }
  return result;
}

export function getEndpointsByOwner(owner: string): string[] {
  const keys: string[] = [];
  for (const [key, entry] of ownerMap.entries()) {
    if (entry.owner === owner) keys.push(key);
  }
  return keys;
}

export function getEndpointsByTeam(team: string): string[] {
  const keys: string[] = [];
  for (const [key, entry] of ownerMap.entries()) {
    if (entry.team === team) keys.push(key);
  }
  return keys;
}

export function resetOwnerRegistry(): void {
  ownerMap.clear();
}
