import {
  configureCost,
  resetCostTracker,
  recordCostRequest,
  getCostStats,
  getAllCostStats,
  makeKey,
} from "./endpointCostTracker";

beforeEach(() => {
  resetCostTracker();
});

describe("makeKey", () => {
  it("uppercases the method", () => {
    expect(makeKey("get", "/users")).toBe("GET:/users");
  });
});

describe("getCostStats", () => {
  it("returns null when no config exists", () => {
    expect(getCostStats("GET", "/unknown")).toBeNull();
  });

  it("returns zero cost before any requests", () => {
    configureCost("GET", "/items", { costPerRequest: 5 });
    const stats = getCostStats("GET", "/items")!;
    expect(stats.totalRequests).toBe(0);
    expect(stats.totalCost).toBe(0);
    expect(stats.overBudget).toBe(false);
  });

  it("accumulates cost correctly", () => {
    configureCost("POST", "/search", { costPerRequest: 10, budgetLimit: 25 });
    recordCostRequest("POST", "/search");
    recordCostRequest("POST", "/search");
    const stats = getCostStats("POST", "/search")!;
    expect(stats.totalRequests).toBe(2);
    expect(stats.totalCost).toBe(20);
    expect(stats.overBudget).toBe(false);
  });

  it("flags overBudget when cost exceeds limit", () => {
    configureCost("GET", "/heavy", { costPerRequest: 15, budgetLimit: 20 });
    recordCostRequest("GET", "/heavy");
    recordCostRequest("GET", "/heavy");
    const stats = getCostStats("GET", "/heavy")!;
    expect(stats.totalCost).toBe(30);
    expect(stats.overBudget).toBe(true);
  });

  it("does not flag overBudget when no limit set", () => {
    configureCost("DELETE", "/resource", { costPerRequest: 100 });
    recordCostRequest("DELETE", "/resource");
    const stats = getCostStats("DELETE", "/resource")!;
    expect(stats.overBudget).toBe(false);
  });
});

describe("getAllCostStats", () => {
  it("returns all configured endpoints", () => {
    configureCost("GET", "/a", { costPerRequest: 1 });
    configureCost("POST", "/b", { costPerRequest: 2 });
    const all = getAllCostStats();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.path)).toEqual(expect.arrayContaining(["/a", "/b"]));
  });
});
