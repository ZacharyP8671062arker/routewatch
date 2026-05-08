import { getAllCostStats, CostStats } from "./endpointCostTracker";

export interface CostReport {
  generatedAt: string;
  totalEndpoints: number;
  overBudgetEndpoints: number;
  totalCostAllEndpoints: number;
  endpoints: CostStats[];
}

export function generateCostReport(): CostReport {
  const endpoints = getAllCostStats();
  const overBudgetEndpoints = endpoints.filter((e) => e.overBudget).length;
  const totalCostAllEndpoints = endpoints.reduce((sum, e) => sum + e.totalCost, 0);
  return {
    generatedAt: new Date().toISOString(),
    totalEndpoints: endpoints.length,
    overBudgetEndpoints,
    totalCostAllEndpoints,
    endpoints,
  };
}

export function hasCostViolations(): boolean {
  return getAllCostStats().some((e) => e.overBudget);
}

export function formatCostReportText(report: CostReport): string {
  const lines: string[] = [
    `Cost Report — ${report.generatedAt}`,
    `Endpoints tracked : ${report.totalEndpoints}`,
    `Over-budget       : ${report.overBudgetEndpoints}`,
    `Total cost        : ${report.totalCostAllEndpoints}`,
    "",
  ];
  for (const e of report.endpoints) {
    const budget = e.budgetLimit !== undefined ? `/ ${e.budgetLimit}` : "(no limit)";
    const flag = e.overBudget ? " ⚠ OVER BUDGET" : "";
    lines.push(
      `  ${e.method} ${e.path} — cost: ${e.totalCost} ${budget}${flag}`
    );
  }
  return lines.join("\n");
}
