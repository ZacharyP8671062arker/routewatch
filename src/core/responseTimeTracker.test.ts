import {
  recordResponseTime,
  getResponseTimeStats,
  getAllResponseTimeStats,
  clearResponseTimeStats,
  makeKey,
} from "./responseTimeTracker";

beforeEach(() => {
  clearResponseTimeStats();
});

describe("makeKey", () => {
  it("combines method and path into a key", () => {
    expect(makeKey("get", "/users")).toBe("GET:/users");
    expect(makeKey("POST", "/items")).toBe("POST:/items");
  });
});

describe("recordResponseTime", () => {
  it("creates a new entry on first record", () => {
    recordResponseTime("GET", "/users", 120);
    const stats = getResponseTimeStats("GET", "/users");
    expect(stats).toBeDefined();
    expect(stats!.count).toBe(1);
    expect(stats!.totalMs).toBe(120);
    expect(stats!.minMs).toBe(120);
    expect(stats!.maxMs).toBe(120);
    expect(stats!.avgMs).toBe(120);
  });

  it("updates stats on subsequent records", () => {
    recordResponseTime("GET", "/users", 100);
    recordResponseTime("GET", "/users", 200);
    recordResponseTime("GET", "/users", 150);

    const stats = getResponseTimeStats("GET", "/users");
    expect(stats!.count).toBe(3);
    expect(stats!.totalMs).toBe(450);
    expect(stats!.minMs).toBe(100);
    expect(stats!.maxMs).toBe(200);
    expect(stats!.avgMs).toBeCloseTo(150);
  });

  it("tracks different routes independently", () => {
    recordResponseTime("GET", "/users", 50);
    recordResponseTime("POST", "/users", 300);

    expect(getResponseTimeStats("GET", "/users")!.avgMs).toBe(50);
    expect(getResponseTimeStats("POST", "/users")!.avgMs).toBe(300);
  });
});

describe("getAllResponseTimeStats", () => {
  it("returns all tracked route stats", () => {
    recordResponseTime("GET", "/a", 10);
    recordResponseTime("DELETE", "/b", 20);

    const all = getAllResponseTimeStats();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["GET:/a"]).toBeDefined();
    expect(all["DELETE:/b"]).toBeDefined();
  });

  it("returns an empty object when no stats recorded", () => {
    expect(getAllResponseTimeStats()).toEqual({});
  });
});

describe("clearResponseTimeStats", () => {
  it("removes all tracked stats", () => {
    recordResponseTime("GET", "/x", 99);
    clearResponseTimeStats();
    expect(getAllResponseTimeStats()).toEqual({});
  });
});
