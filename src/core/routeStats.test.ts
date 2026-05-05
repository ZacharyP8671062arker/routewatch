import {
  recordStats,
  getStats,
  getAllStats,
  clearStats,
} from "./routeStats";

describe("routeStats", () => {
  beforeEach(() => {
    clearStats();
  });

  it("records a new route stat on first hit", () => {
    recordStats({ path: "/users", method: "GET", responseTime: 120, statusCode: 200 });
    const stats = getStats("GET", "/users");
    expect(stats).toBeDefined();
    expect(stats!.hitCount).toBe(1);
    expect(stats!.avgResponseTime).toBe(120);
    expect(stats!.statusCodes[200]).toBe(1);
  });

  it("increments hit count on subsequent calls", () => {
    recordStats({ path: "/users", method: "GET", responseTime: 100, statusCode: 200 });
    recordStats({ path: "/users", method: "GET", responseTime: 200, statusCode: 200 });
    const stats = getStats("GET", "/users");
    expect(stats!.hitCount).toBe(2);
  });

  it("calculates average response time correctly", () => {
    recordStats({ path: "/items", method: "POST", responseTime: 100, statusCode: 201 });
    recordStats({ path: "/items", method: "POST", responseTime: 300, statusCode: 201 });
    const stats = getStats("POST", "/items");
    expect(stats!.avgResponseTime).toBe(200);
  });

  it("tracks multiple status codes", () => {
    recordStats({ path: "/data", method: "GET", responseTime: 50, statusCode: 200 });
    recordStats({ path: "/data", method: "GET", responseTime: 60, statusCode: 404 });
    recordStats({ path: "/data", method: "GET", responseTime: 70, statusCode: 200 });
    const stats = getStats("GET", "/data");
    expect(stats!.statusCodes[200]).toBe(2);
    expect(stats!.statusCodes[404]).toBe(1);
  });

  it("treats method case-insensitively", () => {
    recordStats({ path: "/ping", method: "get", responseTime: 10, statusCode: 200 });
    const stats = getStats("GET", "/ping");
    expect(stats).toBeDefined();
    expect(stats!.method).toBe("GET");
  });

  it("returns all stats", () => {
    recordStats({ path: "/a", method: "GET", responseTime: 10, statusCode: 200 });
    recordStats({ path: "/b", method: "POST", responseTime: 20, statusCode: 201 });
    expect(getAllStats()).toHaveLength(2);
  });

  it("returns undefined for unknown route", () => {
    expect(getStats("DELETE", "/nonexistent")).toBeUndefined();
  });

  it("sets firstSeen and lastSeen timestamps", () => {
    const before = new Date();
    recordStats({ path: "/ts", method: "GET", responseTime: 5, statusCode: 200 });
    const after = new Date();
    const stats = getStats("GET", "/ts");
    expect(stats!.firstSeen.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(stats!.lastSeen.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
