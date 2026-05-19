/**
 * Tracks a "fingerprint" for each endpoint based on its observed request/response
 * schema shape. Useful for detecting silent contract drift over time.
 */

export interface EndpointFingerprint {
  method: string;
  path: string;
  requestBodyKeys: string[];
  responseBodyKeys: string[];
  statusCodes: number[];
  lastUpdated: number;
}

const store = new Map<string, EndpointFingerprint>();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}::${path}`;
}

export function recordFingerprint(
  method: string,
  path: string,
  requestBodyKeys: string[],
  responseBodyKeys: string[],
  statusCode: number
): EndpointFingerprint {
  const key = makeKey(method, path);
  const existing = store.get(key);

  const mergedRequestKeys = Array.from(
    new Set([...(existing?.requestBodyKeys ?? []), ...requestBodyKeys])
  ).sort();

  const mergedResponseKeys = Array.from(
    new Set([...(existing?.responseBodyKeys ?? []), ...responseBodyKeys])
  ).sort();

  const mergedStatusCodes = Array.from(
    new Set([...(existing?.statusCodes ?? []), statusCode])
  ).sort((a, b) => a - b);

  const fingerprint: EndpointFingerprint = {
    method: method.toUpperCase(),
    path,
    requestBodyKeys: mergedRequestKeys,
    responseBodyKeys: mergedResponseKeys,
    statusCodes: mergedStatusCodes,
    lastUpdated: Date.now(),
  };

  store.set(key, fingerprint);
  return fingerprint;
}

export function getFingerprint(method: string, path: string): EndpointFingerprint | undefined {
  return store.get(makeKey(method, path));
}

export function getAllFingerprints(): EndpointFingerprint[] {
  return Array.from(store.values());
}

export function resetFingerprintTracker(): void {
  store.clear();
}

export function compareFingerprints(
  a: EndpointFingerprint,
  b: EndpointFingerprint
): { added: string[]; removed: string[]; statusDrift: number[] } {
  const addedResp = b.responseBodyKeys.filter((k) => !a.responseBodyKeys.includes(k));
  const removedResp = a.responseBodyKeys.filter((k) => !b.responseBodyKeys.includes(k));
  const statusDrift = b.statusCodes.filter((s) => !a.statusCodes.includes(s));
  return { added: addedResp, removed: removedResp, statusDrift };
}
