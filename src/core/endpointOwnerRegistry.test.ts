import {
  assignOwner,
  removeOwner,
  getOwner,
  getAllOwners,
  getEndpointsByOwner,
  getEndpointsByTeam,
  resetOwnerRegistry,
} from "./endpointOwnerRegistry";

beforeEach(() => {
  resetOwnerRegistry();
});

describe("assignOwner / getOwner", () => {
  it("stores and retrieves an owner entry", () => {
    assignOwner("GET", "/users", "alice", "platform", "alice@example.com");
    const entry = getOwner("GET", "/users");
    expect(entry).toBeDefined();
    expect(entry?.owner).toBe("alice");
    expect(entry?.team).toBe("platform");
    expect(entry?.contact).toBe("alice@example.com");
    expect(typeof entry?.assignedAt).toBe("number");
  });

  it("is case-insensitive for method", () => {
    assignOwner("post", "/items", "bob");
    expect(getOwner("POST", "/items")?.owner).toBe("bob");
  });

  it("returns undefined for unknown endpoint", () => {
    expect(getOwner("DELETE", "/nothing")).toBeUndefined();
  });
});

describe("removeOwner", () => {
  it("removes an existing owner and returns true", () => {
    assignOwner("GET", "/ping", "carol");
    expect(removeOwner("GET", "/ping")).toBe(true);
    expect(getOwner("GET", "/ping")).toBeUndefined();
  });

  it("returns false when entry does not exist", () => {
    expect(removeOwner("GET", "/ghost")).toBe(false);
  });
});

describe("getAllOwners", () => {
  it("returns all registered owners", () => {
    assignOwner("GET", "/a", "alice");
    assignOwner("POST", "/b", "bob");
    const all = getAllOwners();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["GET:/a"].owner).toBe("alice");
    expect(all["POST:/b"].owner).toBe("bob");
  });
});

describe("getEndpointsByOwner", () => {
  it("returns keys for a specific owner", () => {
    assignOwner("GET", "/x", "alice");
    assignOwner("POST", "/y", "alice");
    assignOwner("DELETE", "/z", "bob");
    const keys = getEndpointsByOwner("alice");
    expect(keys).toHaveLength(2);
    expect(keys).toContain("GET:/x");
    expect(keys).toContain("POST:/y");
  });
});

describe("getEndpointsByTeam", () => {
  it("returns keys for a specific team", () => {
    assignOwner("GET", "/t1", "alice", "platform");
    assignOwner("GET", "/t2", "bob", "platform");
    assignOwner("GET", "/t3", "carol", "infra");
    const keys = getEndpointsByTeam("platform");
    expect(keys).toHaveLength(2);
    expect(keys).not.toContain("GET:/t3");
  });
});
