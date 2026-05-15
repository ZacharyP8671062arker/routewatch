const requestSizes: Map<string, number[]> = new Map();
const responseSizes: Map<string, number[]> = new Map();

export interface PayloadSizeConfig {
  maxRequestBytes?: number;
  maxResponseBytes?: number;
}

export interface PayloadSizeStats {
  method: string;
  path: string;
  avgRequestBytes: number;
  maxRequestBytes: number;
  avgResponseBytes: number;
  maxResponseBytes: number;
  sampleCount: number;
  requestViolations: number;
  responseViolations: number;
}

const configs: Map<string, PayloadSizeConfig> = new Map();

export function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function configurePayloadSize(method: string, path: string, config: PayloadSizeConfig): void {
  configs.set(makeKey(method, path), config);
}

export function resetPayloadSizeTracker(): void {
  requestSizes.clear();
  responseSizes.clear();
  configs.clear();
}

export function recordPayload(
  method: string,
  path: string,
  requestBytes: number,
  responseBytes: number
): void {
  const key = makeKey(method, path);
  if (!requestSizes.has(key)) requestSizes.set(key, []);
  if (!responseSizes.has(key)) responseSizes.set(key, []);
  requestSizes.get(key)!.push(requestBytes);
  responseSizes.get(key)!.push(responseBytes);
}

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function getPayloadSizeStats(method: string, path: string): PayloadSizeStats | null {
  const key = makeKey(method, path);
  const reqSamples = requestSizes.get(key) ?? [];
  const resSamples = responseSizes.get(key) ?? [];
  if (reqSamples.length === 0 && resSamples.length === 0) return null;
  const config = configs.get(key) ?? {};
  return {
    method: method.toUpperCase(),
    path,
    avgRequestBytes: Math.round(avg(reqSamples)),
    maxRequestBytes: reqSamples.length ? Math.max(...reqSamples) : 0,
    avgResponseBytes: Math.round(avg(resSamples)),
    maxResponseBytes: resSamples.length ? Math.max(...resSamples) : 0,
    sampleCount: Math.max(reqSamples.length, resSamples.length),
    requestViolations: config.maxRequestBytes
      ? reqSamples.filter(s => s > config.maxRequestBytes!).length
      : 0,
    responseViolations: config.maxResponseBytes
      ? resSamples.filter(s => s > config.maxResponseBytes!).length
      : 0,
  };
}

export function getAllPayloadSizeStats(): PayloadSizeStats[] {
  const keys = new Set([...requestSizes.keys(), ...responseSizes.keys()]);
  const results: PayloadSizeStats[] = [];
  for (const key of keys) {
    const [method, ...pathParts] = key.split(':');
    const stats = getPayloadSizeStats(method, pathParts.join(':'));
    if (stats) results.push(stats);
  }
  return results;
}
