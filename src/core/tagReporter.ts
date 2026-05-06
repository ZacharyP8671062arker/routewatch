/**
 * tagReporter.ts
 * Generates a human-readable or structured report of endpoint tags.
 */

import { getAllTags, getEndpointsByTag } from "./endpointTagManager";

export interface TagReport {
  totalTaggedEndpoints: number;
  tagIndex: Record<string, string[]>;
  endpointIndex: Record<string, string[]>;
}

export function generateTagReport(): TagReport {
  const endpointIndex = getAllTags();
  const tagIndex: Record<string, string[]> = {};

  for (const [endpoint, tags] of Object.entries(endpointIndex)) {
    for (const tag of tags) {
      if (!tagIndex[tag]) {
        tagIndex[tag] = [];
      }
      tagIndex[tag].push(endpoint);
    }
  }

  return {
    totalTaggedEndpoints: Object.keys(endpointIndex).length,
    tagIndex,
    endpointIndex,
  };
}

export function formatTagReportText(report: TagReport): string {
  const lines: string[] = [];
  lines.push("=== Endpoint Tag Report ===");
  lines.push(`Total tagged endpoints: ${report.totalTaggedEndpoints}`);
  lines.push("");

  const tags = Object.keys(report.tagIndex).sort();
  if (tags.length === 0) {
    lines.push("No tags registered.");
    return lines.join("\n");
  }

  for (const tag of tags) {
    lines.push(`[${tag}]`);
    for (const endpoint of report.tagIndex[tag].sort()) {
      lines.push(`  - ${endpoint}`);
    }
  }

  return lines.join("\n");
}

export function hasTaggedEndpoints(): boolean {
  return Object.keys(getAllTags()).length > 0;
}
