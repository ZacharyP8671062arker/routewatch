import {
  generateCostReport,
  hasCostViolations,
  formatCostReportText,
} from "./costReporter";
import {
  configureCost,
  resetCostTracker,
  recordCostRequest,
} from "./endpointCostTracker";

beforeEach(() => {
  resetCostTracker();
});

describe("generateCostReport", () => {
  it("returns empty report when nothing configured", () => {
    const report = generateCostReport();
    expect(report.totalEndpoints).toBe(0);
    expect(report.overBudgetEndpoints).toBe(0);
    expect(report.totalCostAllEndpoints).toBe(0);
    expect(report.endpoints).toEqual([]);
  });

  it("aggregates totals correctly", () => {
    configureCost("GET", "/a", { costPerRequest: 3, budgetLimit: 10 });
    configureCost("POST", "/b", { costPerRequest: 7, budgetLimit: 5 });
    recordCostRequest("GET", "/a");
    recordCostRequest("POST", "/b");
    recordCostRequest("POST", "/b");
    const report = generateCostReport();
    expect(report.totalEndpoints).toBe(2);
    expect(report.totalCostAllEndpoints).toBe(3 + 14);
    expect(report.overBudgetEndpoints).toBe(1);
  });

  it("includes a generatedAt timestamp", () => {
    const report = generateCostReport();
    expect(typeof report.generatedAt).toBe("string");
    expect(new Date(report.generatedAt).getTime()).not.toBeNaN();
  });
});

describe("hasCostViolations", () => {
  it("returns false when no violations", () => {
    configureCost("GET", "/cheap", { costPerRequest: 1, budgetLimit: 100 });
    recordCostRequest("GET", "/cheap");
    expect(hasCostViolations()).toBe(false);
  });

  it("returns true when at least one endpoint is over budget", () => {
    configureCost("POST", "/expensive", { costPerRequest: 50, budgetLimit: 40 });
    recordCostRequest("POST", "/expensive");
    expect(hasCostViolations()).toBe(true);
  });
});

describe("formatCostReportText", () => {
  it("includes over-budget warning in text", () => {
    configureCost("GET", "/pricey", { costPerRequest: 20, budgetLimit: 10 });
    recordCostRequest("GET", "/pricey");
    const report = generateCostReport();
    const text = formatCostReportText(report);
    expect(text).toContain("OVER BUDGET");
    expect(text).toContain("GET /pricey");
  });

  it("shows (no limit) when budget is not set", () => {
    configureCost("DELETE", "/free", { costPerRequest: 5 });
    const report = generateCostReport();
    const text = formatCostReportText(report);
    expect(text).toContain("(no limit)");
  });
});
