import {
  addTag,
  removeTag,
  getTags,
  getEndpointsByTag,
  getAllTags,
  clearTags,
  makeKey,
} from "./endpointTagManager";

beforeEach(() => {
  clearTags();
});

describe("makeKey", () => {
  it("formats method and path as uppercase key", () => {
    expect(makeKey("get", "/users")).toBe("GET:/users");
    expect(makeKey("POST", "/orders")).toBe("POST:/orders");
  });
});

describe("addTag / getTags", () => {
  it("adds a tag to an endpoint", () => {
    addTag("GET", "/users", "public");
    expect(getTags("GET", "/users")).toContain("public");
  });

  it("normalizes tags to lowercase", () => {
    addTag("GET", "/users", "Auth");
    expect(getTags("GET", "/users")).toContain("auth");
  });

  it("allows multiple tags per endpoint", () => {
    addTag("GET", "/users", "public");
    addTag("GET", "/users", "auth");
    const tags = getTags("GET", "/users");
    expect(tags).toContain("public");
    expect(tags).toContain("auth");
  });

  it("returns empty array for untagged endpoint", () => {
    expect(getTags("DELETE", "/unknown")).toEqual([]);
  });
});

describe("removeTag", () => {
  it("removes a specific tag from an endpoint", () => {
    addTag("POST", "/login", "auth");
    addTag("POST", "/login", "public");
    removeTag("POST", "/login", "auth");
    expect(getTags("POST", "/login")).not.toContain("auth");
    expect(getTags("POST", "/login")).toContain("public");
  });

  it("does not throw when removing tag from unregistered endpoint", () => {
    expect(() => removeTag("GET", "/nope", "ghost")).not.toThrow();
  });
});

describe("getEndpointsByTag", () => {
  it("returns all endpoints with a given tag", () => {
    addTag("GET", "/users", "internal");
    addTag("POST", "/users", "internal");
    addTag("GET", "/health", "public");
    const results = getEndpointsByTag("internal");
    expect(results).toContain("GET:/users");
    expect(results).toContain("POST:/users");
    expect(results).not.toContain("GET:/health");
  });
});

describe("getAllTags", () => {
  it("returns a map of all tagged endpoints", () => {
    addTag("GET", "/a", "alpha");
    addTag("GET", "/b", "beta");
    const all = getAllTags();
    expect(all["GET:/a"]).toContain("alpha");
    expect(all["GET:/b"]).toContain("beta");
  });
});
